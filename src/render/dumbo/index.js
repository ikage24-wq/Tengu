// The Dumbo Lamplighter (2026-11-26, the Lantern Angler remade from scratch, the id `anglerlamp` kept):
// one of Lady Abyssia's "darlings", the little lamplighters who carry light down into the Ink Abyss for
// Her Ladyship. A tiny dumbo octopus: a round soft apricot-peach mantle (a lilac blush underneath), two
// big rounded ear fins that flap like Dumbo's ears to hover, short soft arms joined by a webbing skirt
// of round scallops. One arm curls round the ring of its little lantern: violet sea-glass (Her
// Ladyship's colour) under a dark-violet cap with her teal band and a tiny orange starfish (her hat's
// buckle), a warm golden glow inside. The gag: a lamplighter who is scared of the dark. Shy, earnest,
// jumpy, devoted. It hovers a hand's height over the floor and bobs on each flap (the beat from the
// distance it swims; a slow one at rest), on its own copy of the tentacle base's octopus (octobase.js).
// It is not placed on the maps: Lady Abyssia calls two of them in her fight (world/aquarium.js).
//   idle    an act of about 30 s in four pieces, each whole in itself, the next that fits the time it
//           has before it swims on (data `rest`, `m.restUntil`):
//           - the trim: the lantern brought up close, its little door opened with another arm, a soft
//             blow on the light; it flares up (a jump, eyes wide) and settles warm; the door shut, a
//             pleased little smile;
//           - lights out: the light flickers and goes out; panic in the dark: eyes huge, ears clamped
//             to its head, trembling, looking every way; the light pops back on: a big relieved sigh;
//           - the lookout: it flaps up higher and holds the lantern up high, peering into the dark one
//             way, then the other; nothing there;
//           - the lullaby: it sways the lantern gently side to side, humming, soft notes rising.
//   moves   (def.moves, in turn) Glare: the lantern held up, its light swelling (sparkles drawn in, a
//           tightening halo: the longest, deepest wind-up), then a bright soft flash ring. Lantern
//           Bonk: the lantern swung up over its head on its arm, bonked down in front, golden
//           sparkles. Ear Slap: both ear fins swept back, then whipped forward, a puff of bubbles.
//   marks   all its own (`ownEmotes`): a "!" with a jump as it starts hunting you, a "?" when it loses
//           you, a shy happy wiggle and a note after landing a hit, a squeezed wince (the lantern
//           swinging) when hurt, a sweat drop when low, z's asleep (settled on the floor, ears drooped,
//           the lantern set down and dimmed), and beaten: dizzy, the lantern going out.
//   dark    (2026-11-26) held in Her Ladyship's Lights Out! (m.heldUntil, world/aquarium.js): the
//           lantern held up high and bright for everyone, ears clamped down, scared, trembling.
//   faces   its own eye family: huge round deep-violet deep-sea eyes, very glossy, three steady glints
//           (a big one, a small one, a tiny warm one from the lantern), a neat lash line on top (the
//           whole iris always shows while awake; scared they open wider, the pupils shrink, the brows
//           go up), soft round brows, rosy cheeks, a tiny mouth (a wobbly line when scared).
import { dressedOcto } from './octobase.js';

// ---------- Little helpers ----------
const TAU = Math.PI * 2;
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
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const [r, g, b] = rgb(hex);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${clamp(al, 0, 1)})`;
};
function glow(ctx, x, y, r, hex, al) {
  if (al <= 0.005 || !(r > 0)) return;
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
// a round bubble with a glint
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(236,228,255,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(176,150,226,0.9)';
  ctx.lineWidth = Math.max(0.25, r * 0.22);
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.38, r * 0.3, r * 0.22, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// a soft round puff (a sigh, a curl of smoke as the light goes out)
function puffAt(ctx, x, y, r, al, fill, line) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.3, r * 0.14);
  ctx.stroke();
  ctx.restore();
}
// a music note, its own: a round head with a glint, a stem, a soft curled flag
function note(ctx, x, y, s, al, col, edgeCol) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  stroke(ctx, [[x + 0.95 * s, y - 0.1 * s], [x + 0.95 * s, y - 1.8 * s], [x + 0.95 * s, y - 3.4 * s]], 0.5 * s, edgeCol);
  stroke(ctx, [[x + 0.95 * s, y - 3.4 * s], [x + 2.3 * s, y - 2.9 * s], [x + 1.9 * s, y - 1.7 * s]], 0.55 * s, edgeCol);
  ell(ctx, x, y, 1.15 * s, 0.9 * s, -0.4);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.strokeStyle = edgeCol;
  ctx.lineWidth = 0.3 * s;
  ctx.stroke();
  ell(ctx, x - 0.35 * s, y - 0.3 * s, 0.35 * s, 0.22 * s, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
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

// ---------- Its colours ----------
const DB = {
  // the mantle: apricot-peach, rose-lilac in its deepest shade
  C: { lt: '#fff4ec', base: '#ffd8c2', sh: '#f4b8a6', deep: '#dc9aa6' },
  // the arms and the web: peach, blushing lilac underneath
  CA: { lt: '#ffe8de', base: '#fbcdc0', sh: '#e6b3c8', deep: '#c99ccb' },
  // the ear fins
  CF: { lt: '#fff3ea', base: '#ffd3bf', sh: '#f2b6ab', deep: '#e7a1b6' },
  ink: '#ad6c74',
  blush: '#ff98aa',
  lilac: '#dcc2f0',
  // the eyes
  eyeRim: '#2a1a54',
  iris: ['#36236a', '#583c9e', '#a382e2'],
  pupil: '#1b1034',
  lash: '#3a2462',
  brow: '#c7836f',
  mouth: '#8a3e5c',
  tongue: '#ee8fa8',
  // the lantern: violet sea-glass, a dark-violet cap and ring, Her Ladyship's teal band and starfish
  glass: { lt: '#e6dcff', base: '#bea6ee', sh: '#8f6fd6', ink: '#7657bd' },
  cap: { lt: '#7d66c2', base: '#4d3a8c', sh: '#382a6c', ink: '#30245c' },
  teal: { base: '#5ac8c8', lt: '#a4ebe6' },
  star: '#ff9a5a',
  light: { core: '#fffbe6', mid: '#ffd770', edge: '#ffb85a', halo: '#ffd98a' },
};

// ---------- Its moods (the face's targets) ----------
// sh: how shut (0 open .. 1 shut), kind: which shut shape; W: how wide the eyes open (scared, wider),
// pp: the pupils' size; bt: brow tilt (+ knit, - worried), by: brow raise; mw, ms, mo: the mouth's
// width, smile (-1 frown .. 1 smile) and openness; ro: a little round "o"; wob: a wobbly line; pf:
// puffed cheeks; bl: blush.
const F0 = { sh: 0, kind: 'blink', W: 1, pp: 0.85, bt: -0.15, by: 0.1, mw: 0.65, ms: 0.35, mo: 0, ro: 0, wob: 0, pf: 0, bl: 0.6 };
const face = (o) => ({ ...F0, ...o });
const FACES = {
  calm: face({}),
  shy: face({ bt: -0.4, by: 0.2, mw: 0.55, ms: 0.3, bl: 1.05 }),
  focus: face({ pp: 1, bt: 0.12, by: -0.05, mw: 0.45, ms: 0.05, bl: 0.5 }),
  blow: face({ pp: 1, bt: -0.1, by: 0.15, mw: 0.35, ms: 0, ro: 1, pf: 0.6, bl: 0.85 }),
  startle: face({ W: 1.17, pp: 0.45, bt: -0.55, by: 0.95, mw: 0.5, ms: 0, ro: 0.85, bl: 0.5 }),
  relief: face({ sh: 1, kind: 'happy', bt: -0.4, by: 0.3, mw: 0.9, ms: 0.45, mo: 0.6, bl: 0.85 }),
  content: face({ pp: 1, bt: -0.25, by: 0.2, mw: 0.85, ms: 1, bl: 0.95 }),
  scared: face({ W: 1.18, pp: 0.4, bt: -0.85, by: 0.8, mw: 0.85, ms: -0.4, wob: 1, bl: 0.3 }),
  peer: face({ W: 1.06, pp: 0.7, bt: -0.5, by: 0.5, mw: 0.45, ms: -0.1, wob: 0.35, bl: 0.4 }),
  hum: face({ sh: 1, kind: 'happy', bt: -0.25, by: 0.3, mw: 0.5, ms: 0.4, ro: 0.55, bl: 0.95 }),
  sing: face({ pp: 1, bt: -0.25, by: 0.3, mw: 0.5, ms: 0.6, ro: 0.45, bl: 0.95 }),
  brave: face({ W: 1.04, pp: 0.8, bt: 0.35, by: 0, mw: 0.45, ms: -0.1, wob: 0.25, bl: 0.6 }),
  charge: face({ W: 1.1, pp: 0.6, bt: 0.75, by: -0.25, mw: 0.55, ms: -0.25, bl: 0.7 }),
  glare: face({ W: 1.04, pp: 0.8, bt: 0.6, by: -0.15, mw: 0.5, ms: -0.15, bl: 0.55 }),
  effort: face({ W: 1.02, pp: 0.9, bt: 0.55, by: -0.1, mw: 0.8, ms: 0.1, mo: 0.8, bl: 0.65 }),
  puff: face({ pp: 0.9, bt: 0.45, by: -0.05, mw: 0.3, ms: 0, pf: 1, bl: 0.9 }),
  alert: face({ W: 1.18, pp: 0.45, bt: -0.4, by: 1, mw: 0.5, ro: 1, bl: 0.5 }),
  lost: face({ W: 1.05, pp: 0.8, bt: -0.35, by: 0.45, mw: 0.45, ms: -0.2, wob: 0.45, bl: 0.45 }),
  gloat: face({ sh: 1, kind: 'happy', bt: -0.2, by: 0.4, mw: 0.95, ms: 1, mo: 0.3, bl: 1.15 }),
  happy: face({ pp: 1, bt: -0.2, by: 0.4, mw: 1.0, ms: 1, mo: 0.55, bl: 1 }),
  hurt: face({ sh: 1, kind: 'squeeze', bt: -0.75, by: 0.1, mw: 0.8, ms: -0.45, mo: 0.4, wob: 0.7, bl: 0.6 }),
  sleep: face({ sh: 1, kind: 'sleep', bt: -0.1, by: 0, mw: 0.4, ms: 0.15, ro: 0.25, bl: 0.6 }),
  dizzy: face({ sh: 1, kind: 'dizzy', bt: -0.45, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.3, wob: 1, bl: 0.4 }),
  worried: face({ W: 1.08, pp: 0.7, bt: -0.7, by: 0.5, mw: 0.7, ms: -0.35, wob: 0.6, bl: 0.4 }),
  sad: face({ pp: 0.9, bt: -0.8, by: 0.3, mw: 0.7, ms: -0.6, bl: 0.35 }),
  cross: face({ pp: 0.9, bt: 0.7, by: -0.2, mw: 0.6, ms: -0.4, pf: 0.4, bl: 0.75 }),
  talk: face({ pp: 0.9, bt: -0.1, by: 0.2 }),
};
const KINDS = ['blink', 'happy', 'sleep', 'squeeze', 'dizzy'];
const FKEYS = ['W', 'pp', 'bt', 'by', 'mw', 'ms', 'mo', 'ro', 'wob', 'pf', 'bl'];
// vowel mouths for talking: [width, smile, open, round], each held a beat, eased into the next
const VOWELS = [[0.55, 0.1, 0.7, 0], [0.9, 0.4, 0.55, 0], [0.4, 0.1, 0, 0.9], [0.8, 0.3, 0, 0], [0.6, 0.2, 0.4, 0]];

// ---------- Its act: four pieces, each whole in itself ----------
const PIECES = { trim: 8.0, dark: 8.6, lookout: 7.0, lullaby: 7.2 };
const ORDER = ['trim', 'dark', 'lookout', 'lullaby'];
const NONE = { x: 0, lift: 0, pitch: 0, tilt: 0, fin: 0, beat: 0, crouch: 0, still: 0, hop: 0, look: 0, lookW: 0, high: 0, close: 0, sway: 0, swayS: 0, help: 0, door: 0, Lv: null, face: 'calm', gx: null, gy: 0, tremble: 0 };
// (a light that flickers, from the act's own time: never random)
const flick = (u) => clamp(0.5 + 0.28 * Math.sin(u * 37) + 0.22 * Math.sin(u * 61 + 1.3) + 0.18 * Math.sin(u * 23 + 0.4), 0, 1);
// A piece's channels at `u` seconds into it.
function actAt(name, u) {
  const A = { ...NONE, piece: name, u };
  if (u > PIECES[name]) return A;
  if (name === 'trim') {
    A.close = win(u, 0.2, 1.1, 6.3, 7.3);
    A.help = Math.max(win(u, 0.9, 1.35, 1.7, 2.2), win(u, 4.6, 5.0, 5.35, 5.85));
    A.door = sstep((u - 1.35) / 0.35) * (1 - sstep((u - 5.05) / 0.3));
    const blowW = win(u, 1.9, 2.1, 2.6, 2.8);
    const flare = win(u, 2.72, 2.86, 2.95, 4.2);
    const jolt = win(u, 2.78, 2.9, 3.3, 3.9);
    A.x = 0.025 * blowW - 0.05 * jolt;
    A.pitch = 6 * blowW - 12 * jolt + 3 * A.close;
    A.hop = 0.09 * win(u, 2.78, 2.9, 3.05, 3.5);
    A.fin = 0.8 * jolt - 0.2 * blowW;
    A.lift = 1.5 * jolt;
    A.Lv = 1 + 0.12 * blowW + 1.45 * flare - 0.0 * u;
    if (u >= 4.2) A.Lv = 1.08;
    A.face = u < 0.3 ? 'calm' : u < 1.9 ? 'focus' : u < 2.75 ? 'blow' : u < 3.9 ? 'startle' : u < 4.6 ? 'relief' : u < 5.9 ? 'focus' : 'content';
    if (u > 0.3 && u < 2.75) [A.gx, A.gy] = [1, 0.55];
    else if (u >= 2.75 && u < 3.9) [A.gx, A.gy] = [0.5, 0.2];
    else if (u >= 4.6 && u < 5.9) [A.gx, A.gy] = [1, 0.55];
    else if (u >= 5.9) [A.gx, A.gy] = [0.2, 0];
  } else if (name === 'dark') {
    const out = sstep((u - 1.7) / 0.15) * (1 - sstep((u - 5.0) / 0.12));
    const fl = u > 0.8 && u < 1.85 ? flick(u) : 1;
    A.Lv = u < 0.8 ? 1 : u < 5.0 ? (1 - out) * mix(1, 0.25 + 0.75 * fl, sstep((u - 0.8) / 0.3)) : 1 + 0.55 * win(u, 5.0, 5.1, 5.15, 5.9);
    const panic = win(u, 1.8, 2.0, 4.95, 5.35);
    A.fin = -1.35 * panic + 0.7 * win(u, 5.0, 5.12, 5.35, 5.9) - 0.5 * win(u, 5.9, 6.4, 6.9, 7.8);
    A.still = 0.7 * panic;
    A.tremble = win(u, 1.9, 2.1, 4.9, 5.2);
    A.crouch = 0.35 * panic + 0.75 * win(u, 5.9, 6.5, 6.9, 7.8);
    A.hop = 0.07 * win(u, 5.0, 5.1, 5.2, 5.6);
    A.pitch = -4 * panic + 5 * win(u, 5.9, 6.5, 6.9, 7.8);
    A.close = 0.35 * win(u, 0.8, 1.2, 1.7, 2.1);
    A.face = u < 0.8 ? 'calm' : u < 1.75 ? 'worried' : u < 5.0 ? 'scared' : u < 5.75 ? 'startle' : u < 7.6 ? 'relief' : 'shy';
    if (u >= 0.8 && u < 1.75) [A.gx, A.gy] = [1, 0.5];
    else if (u >= 1.75 && u < 5.0) [A.gx, A.gy] = [Math.floor((u - 1.75) / 0.6) % 2 ? -1 : 1, Math.floor((u - 1.75) / 0.9) % 2 ? -0.3 : 0.2];
    else if (u >= 5.0 && u < 5.75) [A.gx, A.gy] = [1, 0.5];
    else if (u >= 7.6) [A.gx, A.gy] = [-0.4, 0.5];
  } else if (name === 'lookout') {
    A.high = win(u, 0.3, 1.2, 5.3, 6.3);
    A.beat = 1.6 * win(u, 0.2, 0.6, 5.2, 5.9);
    A.lift = 5 * win(u, 0.3, 1.3, 5.3, 6.4);
    const back = win(u, 2.8, 3.25, 4.55, 5.0);
    A.look = -1;
    A.lookW = back;
    A.pitch = 4 * win(u, 1.2, 1.6, 2.5, 2.9) - 3 * back;
    A.tilt = -4 * back;
    A.Lv = 1 + 0.15 * A.high;
    A.face = u < 0.4 ? 'calm' : u < 0.9 ? 'focus' : u < 4.9 ? 'peer' : u < 5.7 ? 'shy' : 'content';
    if (u >= 0.9 && u < 2.9) [A.gx, A.gy] = [1, -0.25];
    else if (u >= 2.9 && u < 4.9) [A.gx, A.gy] = [-1, -0.25];
    else if (u >= 4.9 && u < 5.7) [A.gx, A.gy] = [-0.3, 0.5];
  } else if (name === 'lullaby') {
    A.sway = win(u, 0.4, 1.1, 6.1, 6.9);
    A.swayS = Math.sin(((u - 0.4) * TAU) / 2.4);
    A.pitch = 3 * A.swayS * A.sway;
    A.tilt = 3 * A.swayS * A.sway;
    A.x = 0.012 * A.swayS * A.sway;
    A.still = 0.3 * A.sway;
    A.Lv = 1 + 0.1 * Math.sin(u * 2.1) * A.sway;
    A.face = u < 0.5 ? 'calm' : u < 3.2 ? 'hum' : u < 5.0 ? 'sing' : u < 6.3 ? 'hum' : 'content';
    if (u >= 3.2 && u < 5.0) [A.gx, A.gy] = [0.8, 0.45];
  }
  return A;
}

// ---------- The moves (its own channels: d1 the lantern held up high, d2 swung up over its head, d3
// bonked down in front, d4 the second front arm reaching to the lantern's door, d6 the lantern set
// down on the floor, d7 brought up close, d8 swayed side to side) ----------
const MOVES = {
  glare: {
    anticT: 0.55,
    keys: [
      [0, { d1: 1, lift: 3.5, pitch: -7, tilt: -5, fin: 0.45, sweep: -0.15, beat: 1.2 }],
      [0.05, { d1: 1, lift: 2.5, pitch: 9, x: 0.07, fin: 0.6, sweep: 0.2, beat: 1.2 }, 'out'],
      [0.34, { d1: 1, lift: 2.5, pitch: 7, x: 0.07, fin: 0.4 }],
      [0.62, { d1: 0.35, pitch: 2, x: 0.02 }, 'io'],
      [0.95, {}, 'io'],
    ],
    flash: 0.03,
  },
  bonk: {
    anticT: 0.45,
    keys: [
      [0, { d2: 1, pitch: -12, lift: 3, x: -0.04, tilt: -8, fin: 0.3 }],
      [0.07, { d3: 1, pitch: 16, lift: -0.5, x: 0.12, tilt: 6, fin: -0.2 }, 'out'],
      [0.26, { d3: 1, pitch: 13, x: 0.12, tilt: 4 }],
      [0.56, { d3: 0.3, pitch: 4, x: 0.05 }, 'io'],
      [0.88, {}, 'io'],
    ],
    bonkAt: 0.06,
  },
  earslap: {
    anticT: 0.3,
    keys: [
      [0, { sweep: -1.0, fin: 0.55, pitch: -9, x: -0.03, still: 1 }],
      [0.05, { sweep: 1.05, fin: -0.25, pitch: 11, x: 0.1, still: 1 }, 'out'],
      [0.22, { sweep: 0.9, fin: -0.15, pitch: 8, x: 0.1, still: 1 }],
      [0.5, { sweep: 0.15, pitch: 2, x: 0.03, still: 0.4 }, 'io'],
      [0.8, {}, 'io'],
    ],
    puffAt: 0.05,
  },
  // after landing a hit: a shy little happy wiggle
  wiggle: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.14, { pitch: 7, tilt: 6, lift: 1.5, fin: 0.4 }, 'io'],
      [0.32, { pitch: -6, tilt: -6, lift: 2, fin: 0.5 }, 'io'],
      [0.5, { pitch: 6, tilt: 5, lift: 1.8, fin: 0.4 }, 'io'],
      [0.68, { pitch: -3, tilt: -3, lift: 1 }, 'io'],
      [1.0, {}, 'io'],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.06, pitch: -16, tilt: -12, splay: 0.45, crouch: 0.25, fin: -0.7, sweep: -0.3 }, 'out'], [0.24, { x: -0.05, pitch: -10, tilt: -8, splay: 0.3, crouch: 0.2, fin: -0.5 }], [0.6, {}, 'io']],
  },
};
const POOL = ['glare', 'bonk', 'earslap'];

// ---------- Its arms: which hold what ----------
const LAMP = 7;
const HELP = 6;
const ARMS = [
  { at: [-5.4, 2.2], dir: 36, far: true },
  { at: [-1.2, 3.0], dir: 10, far: true },
  { at: [3.2, 2.6], dir: -18, far: true },
  { at: [-6.4, 1.8], dir: 44, far: false },
  { at: [-2.0, 3.2], dir: 15, far: false },
  { at: [2.4, 3.2], dir: -14, far: false },
  // the second front arm, free of the web: it opens the lantern's door
  { at: [4.8, 2.8], dir: -22, far: false, free: true, len: 0.9 },
  // the lantern arm, over the body, curled round the lantern's ring
  { at: [6.2, 2.2], dir: -34, far: false, free: true, front: true, held: true, len: 1.45, stiff: 1.8 },
];
// An arm laid along a soft curve from its root R (leaving along u0) to T (arriving along u1), its
// handles grown until the curve is the arm's own length (so it never stretches).
const curveLen = (R, c1, c2, T) => {
  let s = 0;
  let px = R[0];
  let py = R[1];
  for (let k = 1; k <= 12; k++) {
    const t = k / 12;
    const v = 1 - t;
    const x = v * v * v * R[0] + 3 * v * v * t * c1[0] + 3 * v * t * t * c2[0] + t * t * t * T[0];
    const y = v * v * v * R[1] + 3 * v * v * t * c1[1] + 3 * v * t * t * c2[1] + t * t * t * T[1];
    s += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return s;
};
function arcTo(K, R, u0, T, u1, n, seg) {
  const L = n * seg;
  const hnd = (h) => [[R[0] + u0[0] * h, R[1] + u0[1] * h], [T[0] - u1[0] * h, T[1] - u1[1] * h]];
  let lo = 0;
  let hi = L * 1.4;
  let h = 0;
  if (curveLen(R, ...hnd(0), T) >= L) h = 0;
  else if (curveLen(R, ...hnd(hi), T) <= L) h = hi;
  else {
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (curveLen(R, ...hnd(mid), T) > L) hi = mid;
      else lo = mid;
    }
    h = (lo + hi) / 2;
  }
  const [c1, c2] = hnd(h);
  return K.anglesOf(K.layAlong(K.bezPts(R, c1, c2, T, 14), n, seg));
}
const norm2 = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
// The lantern arm's shapes: [tip from its root (in the crown's frame), leaving, arriving]
const HOLD = {
  rest: [[8.0, -3.0], norm2(0.75, 0.66), norm2(0.45, -0.9)],
  high: [[8.5, -11.5], norm2(0.95, -0.1), norm2(0.35, -0.94)],
  over: [[5.0, -14.5], norm2(0.95, -0.3), norm2(-0.45, -0.89)],
  bonk: [[12.5, 1.0], norm2(0.9, -0.4), norm2(0.85, 0.55)],
  close: [[8.6, -5.0], norm2(0.9, -0.2), norm2(0.25, -0.97)],
  floor: [[9.0, -7.4], norm2(0.9, 0.1), norm2(0.3, -0.95)],
};
function dbGoals(j, n, S, { body, a, R, seg, sk }) {
  const K = a.dbK;
  if (!K) return null;
  if (j === LAMP) {
    const sway = clamp(S.d8 ?? 0, 0, 1) * (a.dbSwayS ?? 0);
    const w = { high: clamp(S.d1, 0, 1), over: clamp(S.d2, 0, 1), bonk: clamp(S.d3, 0, 1), close: clamp(S.d7, 0, 1), floor: clamp(S.d6, 0, 1) };
    let tot = 0;
    for (const v of Object.values(w)) tot += v;
    const sc = tot > 1 ? 1 / tot : 1;
    const out = [];
    const shape = (key, wt) => {
      if (wt <= 0.002) return;
      const [d, u0, u1] = HOLD[key];
      // (swayed side to side for the lullaby, the tip led along a soft arc)
      const dx = key === 'rest' || key === 'close' ? sway * 2.6 : 0;
      const dy = key === 'rest' || key === 'close' ? -Math.abs(sway) * 0.8 : 0;
      const T = K.plus(R, K.turn([d[0] + dx, d[1] + dy], body));
      out.push([arcTo(K, R, K.turn(u0, body), T, K.turn([u1[0] + sway * 0.35, u1[1]], body), n, seg), wt]);
    };
    shape('rest', Math.max(0, 1 - tot));
    for (const [key, v] of Object.entries(w)) shape(key, v * sc);
    return out;
  }
  if (j === HELP) {
    const w = clamp(S.d4, 0, 1);
    if (w <= 0.002 || !sk?.lamp) return null;
    // (reaching to the lantern's door, on the side of its glass toward the body)
    const T = sk.lamp.door;
    const u1 = norm2(T[0] - R[0], (T[1] - R[1]) * 0.4);
    return [[arcTo(K, R, K.turn(norm2(0.55, 0.75), body), T, u1, n, seg), w]];
  }
  return null;
}
// (how hard the lantern arm is held to its shape, so the lantern is always where the move wants it)
function dbPin(j, n, a) {
  if (j !== LAMP) return undefined;
  const k = a.dbPinK ?? 0.05;
  const out = ((a.mo.rig ??= {}).dbPinArr ??= new Array(n).fill(0));
  for (let i = 0; i < n; i++) out[i] = k * (1 - (0.45 * i) / (n - 1));
  return out;
}

// ---------- Its act, its moods and its face's easing (each frame, before drawing) ----------
function dbPose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? 0;
  const alive = m.hp > 0;
  a.dbM = m;
  a.dbK = K;
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
  // (a hit only counts once it has happened: a replay with the last hit still remembered is no hit)
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.55;
  const fighting = (m.aggroUntil ?? 0) > now || Boolean(m.engaged);
  const swimming = (st.tnGo ?? 0) > 0.25;
  const name = mv ? Object.keys(MOVES).find((nm) => MOVES[nm] === mv) ?? 'base' : null;
  // Calm: hovering about with nothing else on (the act shows only then, fading in and out).
  const calmGoal = !mv && alive && !napping && !m.pose && !m.cine && !hurt && !fighting && !swimming ? 1 : 0;
  st.dbCalm = mix(st.dbCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.dbCalm);
  // The piece it is playing: started as it settles; the next once one ends (a breath between), the
  // first in turn that fits the time it has (m.restUntil); none when nothing fits. Dropped once it's
  // no longer calm, or the clock went back (a stage's replay).
  let PC = st.dbPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.4) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.dbN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.dbN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.25 };
        st.dbN = (st.dbN + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.dbPiece = PC;
  const A = PC && PC.name ? actAt(PC.name, now - PC.t0) : { ...NONE, piece: null, u: 0 };
  // (the act on the channels, as much as it is calm)
  out.x += A.x * cw;
  out.hop += A.hop * cw;
  out.lift += A.lift * cw;
  out.pitch += A.pitch * cw;
  out.tilt += A.tilt * cw;
  out.fin += A.fin * cw;
  out.beat += A.beat * cw;
  out.crouch += A.crouch * cw;
  out.still = Math.max(out.still, A.still * cw);
  out.look = mix(out.look, A.look, A.lookW * cw);
  out.d1 = Math.max(out.d1, A.high * cw);
  out.d4 = Math.max(out.d4, A.help * cw);
  out.d7 = Math.max(out.d7, A.close * cw);
  out.d8 = Math.max(out.d8, A.sway * cw);
  a.dbSwayS = A.swayS;
  // (trembling in the dark: a small quick shiver, eased in and out)
  const tr = A.tremble * cw;
  if (tr > 0.001) {
    out.x += 0.008 * Math.sin(now * 47) * tr;
    out.pitch += 1.2 * Math.sin(now * 41 + 1) * tr;
  }
  // (Held still in Her Ladyship's Lights Out!, world/aquarium.js, which holds it where it is: the
  // lantern held up high for everyone, its ears clamped down, trembling; eased in and out.)
  const darkGoal = alive && !mv && (m.heldUntil ?? 0) > now ? 1 : 0;
  st.dbDark = mix(st.dbDark ?? 0, darkGoal, k(darkGoal ? 6 : 4));
  const dk = sstep(st.dbDark);
  if (dk > 0.001) {
    out.d1 = Math.max(out.d1, dk);
    out.lift += 3 * dk;
    out.fin += -1.1 * dk;
    out.still = Math.max(out.still, 0.6 * dk);
    out.x += 0.008 * Math.sin(now * 47) * dk;
    out.pitch += 1.2 * Math.sin(now * 41 + 1) * dk;
  }
  // Its own marks: a "!" with a jump as it starts hunting you, a "?" when it loses you.
  if (fighting && alive && !st.dbHunt) st.dbBangAt = now;
  if (!fighting && st.dbHunt && alive) st.dbLostAt = now;
  st.dbHunt = fighting && alive;
  const bang = now - (st.dbBangAt ?? -9);
  const huh = now - (st.dbLostAt ?? -9);
  const banging = alive && !mv && bang >= 0 && bang < 1.1;
  const huhing = alive && !mv && !fighting && huh >= 0 && huh < 1.5;
  if (banging) {
    out.hop += 0.12 * win(bang, 0.0, 0.1, 0.2, 0.45);
    out.fin += 0.8 * win(bang, 0.0, 0.08, 0.35, 0.8);
    out.pitch += -5 * win(bang, 0.0, 0.1, 0.3, 0.6);
  }
  if (huhing) {
    const hw = win(huh, 0, 0.2, 1.1, 1.5);
    out.tilt += 5 * Math.sin(huh * 4.5) * hw;
    out.fin += -0.25 * hw;
  }
  // Hunting you (not in a move): brave, ears up, the lantern a little higher.
  if (fighting && alive && !mv && !hurt) {
    out.fin += 0.2;
    out.d1 = Math.max(out.d1, 0.3);
  }
  // Asleep or beaten: settled on the floor, the lantern set down beside it.
  out.d6 = napping || !alive ? 1 : 0;
  if (napping && alive) out.fin -= 0.35;
  // The light: warm and steady; the act's, swelling for the glare, flashing, dimmed asleep, going out.
  let L = fighting ? 1.1 : 1;
  if (cw > 0.01 && A.Lv !== null) L = mix(L, A.Lv, cw);
  if (napping && alive) L = 0.3 + 0.05 * Math.sin(now * 0.8);
  if (name === 'glare') L = mt < 0 ? 1 + 1.5 * sstep(a.ph?.antic ?? 0) : mt < MOVES.glare.flash ? 2.6 : mix(2.6, 1.1, sstep((mt - MOVES.glare.flash) / 0.6));
  else if (name === 'bonk' && mt >= 0) L = 1.35 - 0.25 * sstep(mt / 0.5);
  if (hurt) L *= 1 - 0.5 * win(ago, 0, 0.04, 0.12, 0.4);
  if (dk > 0.01) L = mix(L, 1.45, dk);
  if (!alive) {
    st.dbDeadAt ??= now;
    if (now < st.dbDeadAt) st.dbDeadAt = now;
    const d = now - st.dbDeadAt;
    L = (1 - sstep(d / 1.4)) * (0.75 + 0.25 * Math.sin(d * 23));
  } else st.dbDeadAt = null;
  st.Lv = mix(st.Lv ?? L, L, k(26));
  a.dbLv = Math.max(0, st.Lv);
  // (the lantern arm held to its shape: firmer through a move, so it lands on its beat)
  st.dbPinK = mix(st.dbPinK ?? 0.05, mv ? 0.12 : 0.05, k(8));
  a.dbPinK = st.dbPinK;
  // (a new hit swings the lantern)
  if (hurt && ago < 0.05 && st.dbHitSwing !== m.hp) {
    st.dbHitSwing = m.hp;
    st.dbKick = (st.dbKick ?? 0) + 1;
  }
  // Its mood: beaten, hurt, asleep, a move, its marks, a scene's mood, the act's, hunting, low, calm.
  const low = alive && m.hp < (m.def.hp ?? 1) * 0.25;
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (!alive) mood = 'dizzy';
  else if (hurt || (name === 'base' && mv === K.moves.knockdown)) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'glare') mood = mt < 0 ? 'charge' : mt < 0.5 ? 'glare' : 'brave';
  else if (name === 'bonk') mood = mt < 0.35 ? 'effort' : 'brave';
  else if (name === 'earslap') mood = mt < 0 ? 'puff' : mt < 0.3 ? 'effort' : 'brave';
  else if (name === 'wiggle') mood = 'gloat';
  else if (name) mood = 'focus';
  else if (banging) mood = bang < 0.75 ? 'alert' : 'brave';
  else if (huhing) mood = 'lost';
  else if (dk > 0.5) mood = 'scared';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (cw > 0.5 && A.piece) mood = A.face;
  else if (fighting) mood = 'brave';
  else if (low) mood = 'worried';
  // (a dev page may hold a mood to look at it close up: tools/zz-anglerlampcheck.html)
  if (typeof m.faceTest === 'string' && FACES[m.faceTest]) mood = m.faceTest;
  const F = FACES[mood] ?? FACES.calm;
  const f = (st.dbF ??= { shut: 0, kinds: { blink: 1, happy: 0, sleep: 0, squeeze: 0, dizzy: 0 }, ...Object.fromEntries(FKEYS.map((key) => [key, F0[key]])), gx: 0, gy: 0, sweat: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor((a.t ?? 0) * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2], ro: v[3] };
  }
  const fast = k(16);
  for (const key of FKEYS) f[key] = mix(f[key], tgt[key], fast);
  // (a blink every few seconds while its eyes are open: a quick close, never a lid sliding down)
  const t = (a.t ?? 0) + ((m.uid ?? 0) % 5) * 0.83;
  const blink = F.sh < 0.5 ? win(t % 4.1, 3.72, 3.78, 3.84, 3.94) : 0;
  const shutGoal = Math.max(F.sh, blink);
  f.shut = mix(f.shut, shutGoal, k(F.sh > 0.5 || blink > 0 ? 28 : 20));
  const kind = F.sh > 0.5 ? F.kind : 'blink';
  for (const kd of KINDS) f.kinds[kd] = mix(f.kinds[kd], kd === kind ? 1 : 0, k(16));
  // where it looks: the act's, at you (hunting or in a move), about it (lost you), else ahead
  let gx = 0;
  let gy = 0;
  if (cw > 0.5 && A.gx !== null) [gx, gy] = [A.gx, A.gy];
  else if (fighting || mv) [gx, gy] = [1, 0];
  else if (huhing) [gx, gy] = [Math.floor(huh * 2.4) % 2 ? -1 : 1, -0.2];
  else if (mood === 'worried' || mood === 'sad') [gx, gy] = [-0.3, 0.6];
  f.gx = mix(f.gx, gx, k(22));
  f.gy = mix(f.gy, gy, k(22));
  f.sweat = mix(f.sweat, (cw > 0.5 && A.face === 'scared') || low ? 1 : 0, k(5));
  a.dbF = f;
  a.dbMood = mood;
  a.dbAct = { ...A, cw };
  a.dbBang = banging ? bang : -1;
  a.dbHuh = huhing ? huh : -1;
  a.dbGloat = name === 'wiggle' ? mt : -1;
  a.dbNap = napping && alive;
  a.dbDead = !alive ? now - (st.dbDeadAt ?? now) : -1;
  a.dbHurt = hurt ? ago : -1;
  a.dbMove = mv && name !== 'base' ? { name, t: mt, antic: a.ph?.antic ?? 0 } : null;
}

// ---------- The lantern (hung from its ring at the lantern arm's tip, swinging on its own) ----------
// Its frame: the ring at 0, the lantern hanging down its own y.
const RING = 1.45;
const GLASS = [0, 6.0, 3.1];
function lampUpdate(a, sk, K) {
  const st = (a.mo.rig ??= {});
  const J = sk.arms[LAMP].J;
  const tip = J[J.length - 1];
  const prev = J[J.length - 2];
  const th = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  const u = [Math.cos(th), Math.sin(th)];
  // (the ring's middle a little back along the arm: the tip curls through it and out)
  const ring = [tip[0] - u[0] * 0.55, tip[1] - u[1] * 0.55];
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const m = a.dbM ?? { x: 0, y: 0 };
  const mo = K.motionAt(st, 'dbRing', ring, m, a);
  // the lantern's swing: hanging (gravity), or held stiff along the arm as it is swung (the bonk)
  const S = sk.S;
  const stiff = clamp((S.d2 ?? 0) + (S.d3 ?? 0), 0, 1);
  const along = Math.PI / 2 - th;
  const p = (st.dbPend ??= { x: 0, v: 0 });
  if ((st.dbKicked ?? 0) !== (st.dbKick ?? 0)) {
    st.dbKicked = st.dbKick ?? 0;
    p.v -= 5;
  }
  if (dt > 0) {
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const g = p.x + K.wrapPi(along - p.x);
      const acc = -60 * Math.sin(p.x) * (1 - stiff) - (p.x - g) * 520 * stiff - p.v * (5 + 18 * stiff) - (mo.ax * Math.cos(p.x) - mo.ay * Math.sin(p.x)) * 0.05;
      p.v += acc * h;
      p.x += p.v * h;
    }
    // (a soft stop when hanging free: it never swings up past level)
    if (stiff < 0.5 && Math.abs(p.x) > 1.25) {
      p.x = Math.sign(p.x) * 1.25;
      p.v *= 0.4;
    }
  }
  if (!Number.isFinite(p.x)) Object.assign(p, { x: 0, v: 0 });
  // keep its turns whole-free (a swing taken round a full turn is the same place)
  if (stiff < 0.05 && Math.abs(p.x) > Math.PI) p.x = K.wrapPi(p.x);
  const al = p.x;
  const d = [Math.sin(al), Math.cos(al)];
  const at = (lx, ly) => [ring[0] + d[1] * lx + d[0] * ly, ring[1] - d[0] * lx + d[1] * ly];
  sk.lamp = { ring, al, th, at, glass: at(GLASS[0], GLASS[1]), bottom: at(0, 10.2), door: at(-2.6, GLASS[1]) };
}
function drawLamp(ctx, a, sk, K) {
  const L = sk.lamp;
  if (!L) return;
  const Lv = a.dbLv ?? 1;
  const t = a.t ?? 0;
  const act = a.dbAct;
  const door = act ? act.door * act.cw : 0;
  ctx.save();
  ctx.translate(...L.ring);
  ctx.rotate(-L.al);
  const [gx, gy, gr] = GLASS;
  // the glass ball: violet sea-glass, frosted, its own soft outline
  ell(ctx, gx, gy, gr, gr * 0.98);
  ctx.strokeStyle = lit(a, DB.glass.ink);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = lit(a, DB.glass.base);
  ctx.fill();
  ctx.save();
  ell(ctx, gx, gy, gr, gr * 0.98);
  ctx.clip();
  // (shaded low behind, a paler frosted patch or two)
  ell(ctx, gx + 1.3, gy + 1.4, gr * 0.95, gr * 0.9);
  ctx.fillStyle = lit(a, DB.glass.sh, 0.5);
  ctx.fill();
  ell(ctx, gx - 1.2, gy - 0.6, 1.5, 1.2, -0.5);
  ctx.fillStyle = lit(a, DB.glass.lt, 0.45);
  ctx.fill();
  // the light inside: a soft warm orb (brighter through the open door)
  const k = clamp(Lv, 0, 2.6);
  const r = 1.4 + 1.25 * Math.min(k, 2);
  if (k > 0.01) {
    const g = ctx.createRadialGradient(gx, gy + 0.1, 0, gx, gy + 0.1, r * 1.35);
    g.addColorStop(0, rgba(DB.light.core, Math.min(1, k)));
    g.addColorStop(0.4, rgba(DB.light.mid, 0.92 * Math.min(1, k)));
    g.addColorStop(1, rgba(DB.light.edge, 0));
    ctx.fillStyle = g;
    ctx.fillRect(gx - r * 1.4, gy - r * 1.4, r * 2.8, r * 2.8);
    if (door > 0.02) glow(ctx, gx - 1.7, gy, 2.4, DB.light.core, 0.6 * door * Math.min(1, k));
    // two little sparkles drifting in it
    for (let i = 0; i < 2; i++) {
      const q = t * 0.9 + i * 3.1;
      sparkle(ctx, gx + Math.sin(q) * 1.3, gy + Math.cos(q * 0.8 + i) * 1.1, (0.55 + 0.25 * Math.sin(q * 2.3)) * Math.min(1, k), rgba('#ffffff', 0.9 * Math.min(1, k)));
    }
  }
  ctx.restore();
  // its shine: a soft white crescent, top left
  ctx.beginPath();
  ctx.arc(gx, gy, gr - 0.7, Math.PI * 1.05, Math.PI * 1.48);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 0.55;
  ctx.lineCap = 'round';
  ctx.stroke();
  // the little door: a round-cornered pane on the side toward the body, swinging open on its hinge
  {
    const dw = 2.3;
    const dh = 2.9;
    const hx = -gr + 0.75;
    const sw = Math.cos(door * Math.PI * 0.72);
    const x1 = hx + dw * sw;
    const top = gy - dh / 2;
    ctx.beginPath();
    ctx.moveTo(hx, top + 0.5);
    ctx.quadraticCurveTo(hx, top, hx + (x1 - hx) * 0.25, top);
    ctx.lineTo(hx + (x1 - hx) * 0.75, top);
    ctx.quadraticCurveTo(x1, top, x1, top + 0.5);
    ctx.lineTo(x1, top + dh - 0.5);
    ctx.quadraticCurveTo(x1, top + dh, hx + (x1 - hx) * 0.75, top + dh);
    ctx.lineTo(hx + (x1 - hx) * 0.25, top + dh);
    ctx.quadraticCurveTo(hx, top + dh, hx, top + dh - 0.5);
    ctx.closePath();
    ctx.fillStyle = lit(a, DB.glass.lt, 0.35 + 0.25 * door);
    ctx.fill();
    ctx.strokeStyle = lit(a, DB.cap.base);
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
  // the bottom cap and its knob
  ell(ctx, 0, 9.35, 1.0, 0.75);
  ctx.strokeStyle = lit(a, DB.cap.ink);
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = lit(a, DB.cap.base);
  ctx.fill();
  ell(ctx, 0, 8.75, 1.45, 0.6);
  ctx.stroke();
  ctx.fill();
  // the cap: a dark-violet dome, Her Ladyship's teal band round it, her little orange starfish
  ctx.beginPath();
  ctx.moveTo(-2.75, 3.45);
  ctx.quadraticCurveTo(-2.7, 1.1, 0, 1.0);
  ctx.quadraticCurveTo(2.7, 1.1, 2.75, 3.45);
  ctx.quadraticCurveTo(0, 3.85, -2.75, 3.45);
  ctx.closePath();
  ctx.strokeStyle = lit(a, DB.cap.ink);
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = lit(a, DB.cap.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = lit(a, DB.teal.base);
  ctx.fillRect(-3, 2.55, 6, 0.85);
  ctx.fillStyle = lit(a, DB.teal.lt);
  ctx.fillRect(-3, 2.55, 6, 0.25);
  ell(ctx, -1.0, 1.55, 1.1, 0.4, -0.25);
  ctx.fillStyle = lit(a, DB.cap.lt, 0.8);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? 0.28 : 0.62;
    const q = (i / 10) * TAU - Math.PI / 2;
    const p = [1.25 + Math.cos(q) * rr, 2.95 + Math.sin(q) * rr];
    i ? ctx.lineTo(...p) : ctx.moveTo(...p);
  }
  ctx.closePath();
  ctx.fillStyle = lit(a, DB.star);
  ctx.fill();
  // the ring on top (its back; the front of it goes over the arm's tip)
  ctx.beginPath();
  ctx.arc(0, 0, RING, 0, TAU);
  ctx.strokeStyle = lit(a, DB.cap.ink);
  ctx.lineWidth = 1.05;
  ctx.stroke();
  ctx.strokeStyle = lit(a, DB.cap.base);
  ctx.lineWidth = 0.55;
  ctx.stroke();
  ctx.restore();
}
// The front of the ring, over the arm's tip curled through it.
function drawRingFront(ctx, a, sk) {
  const L = sk.lamp;
  if (!L) return;
  // (the side of the ring the arm comes in from)
  const an = L.th + Math.PI;
  ctx.beginPath();
  ctx.arc(L.ring[0], L.ring[1], RING, an - 0.55, an + 0.55);
  ctx.lineCap = 'round';
  ctx.strokeStyle = lit(a, DB.cap.ink);
  ctx.lineWidth = 1.05;
  ctx.stroke();
  ctx.strokeStyle = lit(a, DB.cap.lt);
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// ---------- Drawing it ----------
// Its markings on the mantle (clipped to it): a lilac blush underneath, the lantern's warm light on it.
function dbPaint(ctx, a, sk, K) {
  const rx = sk.rx;
  const ry = sk.ry;
  const b = sk.inM([0, -0.1 * ry]);
  glow(ctx, b[0], b[1], rx * 0.95, DB.lilac, 0.55);
  const L = sk.lamp;
  const Lv = a.dbLv ?? 1;
  if (L && Lv > 0.02) glow(ctx, L.glass[0], L.glass[1], 9 + 3 * Math.min(Lv, 2), DB.light.halo, 0.22 * Math.min(Lv, 2));
}
// Its face (in the mantle's frame): huge round deep-violet eyes, soft round brows, rosy cheeks, a
// tiny mouth.
function dbFace(ctx, a, sk, K) {
  const f = a.dbF;
  if (!f) return;
  K.mantleFrame(ctx, a);
  const rx = sk.rx;
  const ry = sk.ry;
  const t = a.t ?? 0;
  const lk = clamp(sk.look ?? 0, -1, 1);
  const fx = rx * 0.3 + lk * 1.1;
  const ey = -ry * 0.74;
  const Lv = clamp(a.dbLv ?? 1, 0, 1.5);
  const W = f.W;
  // the cheeks (puffed: rounder and rosier)
  for (const [cx, s] of [[fx - 5.0, 1], [fx + 4.3, 0.85]]) {
    glow(ctx, cx, ey + 3.4, (2.1 + 0.6 * f.pf) * s, DB.blush, (0.4 + 0.12 * f.pf) * f.bl);
    if (f.pf > 0.05) {
      ell(ctx, cx - 0.4, ey + 2.9, 0.7 * s, 0.45 * s, -0.3);
      ctx.fillStyle = rgba('#ffffff', 0.55 * f.pf);
      ctx.fill();
    }
  }
  const closedW = sstep((f.shut - 0.45) / 0.45);
  const eye = (x, rx0, ry0, side) => {
    const ex = rx0 * W;
    const eyH = ry0 * W;
    const ink = lit(a, DB.lash);
    if (closedW > 0.01) {
      ctx.save();
      ctx.globalAlpha *= closedW;
      const kd = f.kinds;
      if (kd.happy > 0.01) {
        ctx.globalAlpha *= kd.happy;
        stroke(ctx, [[x - ex, ey + 0.5], [x, ey - eyH * 0.95], [x + ex, ey + 0.5]], 0.7, ink);
        ctx.globalAlpha /= kd.happy;
      }
      if (kd.sleep > 0.01) {
        ctx.globalAlpha *= kd.sleep;
        stroke(ctx, [[x - ex, ey - 0.2], [x, ey + eyH * 0.55], [x + ex, ey - 0.2]], 0.65, ink);
        stroke(ctx, [[x + side * ex * 0.95, ey - 0.15], [x + side * (ex + 0.6), ey + 0.05], [x + side * (ex + 1.0), ey + 0.55]], 0.4, ink);
        ctx.globalAlpha /= kd.sleep;
      }
      if (kd.blink > 0.01) {
        ctx.globalAlpha *= kd.blink;
        stroke(ctx, [[x - ex, ey + 0.1], [x, ey + eyH * 0.28], [x + ex, ey + 0.1]], 0.65, ink);
        ctx.globalAlpha /= kd.blink;
      }
      if (kd.squeeze > 0.01) {
        ctx.globalAlpha *= kd.squeeze;
        // (pointing in toward the middle of its face: "> <")
        const sg = -side;
        stroke(ctx, [[x - sg * ex, ey - eyH * 0.6], [x - sg * ex * 0.1, ey - eyH * 0.15], [x + sg * ex * 0.85, ey]], 0.68, ink);
        stroke(ctx, [[x + sg * ex * 0.85, ey], [x - sg * ex * 0.1, ey + eyH * 0.2], [x - sg * ex, ey + eyH * 0.6]], 0.68, ink);
        ctx.globalAlpha /= kd.squeeze;
      }
      if (kd.dizzy > 0.01) {
        ctx.globalAlpha *= kd.dizzy;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * ex * 0.95;
          const p = [x + Math.cos(an) * r, ey + Math.sin(an) * r * 1.12];
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.globalAlpha /= kd.dizzy;
      }
      ctx.restore();
    }
    const openW = 1 - closedW;
    if (openW <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= openW;
    // the eye: a deep rim, the iris lighter low down where the lantern lights it
    ell(ctx, x, ey, ex, eyH);
    ctx.fillStyle = lit(a, DB.eyeRim);
    ctx.fill();
    const g = ctx.createLinearGradient(x, ey - eyH, x, ey + eyH);
    g.addColorStop(0, DB.iris[0]);
    g.addColorStop(0.55, DB.iris[1]);
    g.addColorStop(1, DB.iris[2]);
    ell(ctx, x, ey + 0.08 * eyH, ex * 0.86, eyH * 0.86);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    // the pupil (it looks about; small when scared)
    const px = x + f.gx * ex * 0.22;
    const py = ey + 0.12 * eyH + f.gy * eyH * 0.16;
    ell(ctx, px, py, ex * 0.44 * f.pp, eyH * 0.46 * f.pp);
    ctx.fillStyle = DB.pupil;
    ctx.fill();
    glow(ctx, x + 0.25 * ex, ey + eyH * 0.95, ex * 0.95, '#ffcf8a', 0.3 * Lv);
    ctx.restore();
    // three steady glints: a big one up top, a small one low, a tiny warm one from the lantern
    ell(ctx, x - 0.3 * ex, ey - 0.38 * eyH, 0.38 * ex, 0.3 * eyH, -0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, x - 0.22 * ex, ey + 0.46 * eyH, 0.15 * ex, 0.14 * ex);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ell(ctx, x + 0.42 * ex, ey + 0.3 * eyH, 0.13 * ex, 0.12 * ex);
    ctx.fillStyle = rgba('#ffe09a', 0.35 + 0.6 * Lv);
    ctx.fill();
    // the lash line on top: neat, hugging the eye, a little heavier toward the outer corner, a flick
    ctx.lineCap = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.ellipse(x, ey, ex * 1.03, eyH * 1.03, 0, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (side < 0) ctx.ellipse(x, ey, ex * 1.03, eyH * 1.03, 0, Math.PI * 1.06, Math.PI * 1.32);
    else ctx.ellipse(x, ey, ex * 1.03, eyH * 1.03, 0, Math.PI * 1.68, Math.PI * 1.94);
    ctx.stroke();
    const oa = side < 0 ? Math.PI * 1.08 : Math.PI * 1.92;
    const ox = x + Math.cos(oa) * ex * 1.03;
    const oy = ey + Math.sin(oa) * eyH * 1.03;
    stroke(ctx, [[ox, oy], [ox + side * 0.55, oy - 0.25], [ox + side * 0.95, oy - 0.85]], 0.42, ink);
    ctx.restore();
  };
  // (the near eye full, the far one a little narrower round the curve of its head)
  eye(fx - 3.35, 2.45, 2.85, -1);
  eye(fx + 2.85, 2.05, 2.8, 1);
  // the brows: soft round dashes, tilted by the mood (+ knit toward the middle, - worried)
  const brow = (x, side, s) => {
    const base = ey - 2.85 * W - 1.45 - f.by * 0.9;
    const yi = base + f.bt * 0.8;
    const yo = base - f.bt * 0.3;
    const xi = x - side * 1.25 * s;
    const xo = x + side * 1.35 * s;
    stroke(ctx, [[xi, yi], [(xi + xo) / 2, Math.min(yi, yo) - 0.45], [xo, yo]], 0.8, lit(a, DB.brow));
  };
  brow(fx - 3.35, -1, 1);
  brow(fx + 2.85, 1, 0.85);
  // the mouth: tiny; a line (smile or frown, wobbly when scared), open, or a little round "o"
  const mx = fx - 0.25;
  const my = -ry * 0.36;
  const w = 1.1 * f.mw;
  const ro = clamp(f.ro, 0, 1);
  if (1 - ro > 0.02) {
    ctx.save();
    ctx.globalAlpha *= 1 - ro;
    const cy = my - f.ms * 0.4;
    if (f.mo > 0.08) {
      const o = f.mo;
      ctx.beginPath();
      ctx.moveTo(mx - w, cy);
      ctx.quadraticCurveTo(mx, my + f.ms * 0.45 - o * 0.3, mx + w, cy);
      ctx.quadraticCurveTo(mx, my + f.ms * 0.8 + o * 1.5, mx - w, cy);
      ctx.fillStyle = lit(a, DB.mouth);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ell(ctx, mx, my + f.ms * 0.6 + o * 1.25, w * 0.7, o * 0.6);
      ctx.fillStyle = lit(a, DB.tongue);
      ctx.fill();
      ctx.restore();
    } else if (f.wob > 0.05) {
      ctx.strokeStyle = lit(a, DB.mouth);
      ctx.lineWidth = 0.45;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        const xx = mx - w + 2 * w * u;
        const yy = cy + f.ms * 0.8 * (1 - (2 * u - 1) ** 2) + f.wob * 0.32 * Math.sin(u * Math.PI * 3);
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
    } else stroke(ctx, [[mx - w, cy], [mx, my + f.ms * 0.7], [mx + w, cy]], 0.45, lit(a, DB.mouth));
    ctx.restore();
  }
  if (ro > 0.02) {
    const rr = 0.25 + 0.45 * ro;
    ell(ctx, mx, my + 0.15, rr * 0.85, rr);
    ctx.fillStyle = lit(a, DB.mouth);
    ctx.fill();
    ell(ctx, mx, my + 0.15 + rr * 0.35, rr * 0.5, rr * 0.4);
    ctx.fillStyle = lit(a, DB.tongue, 0.8);
    ctx.fill();
  }
  // a sweat drop sliding down the side of its head (scared in the dark, low on health)
  if (f.sweat > 0.05) {
    const u = (t * 0.8) % 1;
    const x = -rx * 0.62;
    const y = -ry * 1.35 + u * 3.2;
    ctx.save();
    ctx.globalAlpha *= f.sweat * (u < 0.8 ? 1 : (1 - u) * 5);
    ctx.beginPath();
    ctx.moveTo(x, y - 1.3);
    ctx.quadraticCurveTo(x + 1.0, y + 0.35, x, y + 1.0);
    ctx.quadraticCurveTo(x - 1.0, y + 0.35, x, y - 1.3);
    ctx.fillStyle = 'rgba(214,236,255,0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(132,160,216,0.9)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ell(ctx, x - 0.3, y + 0.15, 0.25, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}
// The fins' paler middles (over them, in their fill).
function dbFins(ctx, a, mode) {
  if (mode !== 'fill') return;
  const sk = a.tk;
  for (const f of sk.fins) {
    const p = f.mid[3];
    const q = f.mid[2];
    const an = Math.atan2(p[1] - q[1], p[0] - q[0]);
    ell(ctx, p[0], p[1], 3.0, 1.6, an);
    ctx.fillStyle = lit(a, f.back ? '#f4b7b8' : '#ffc6c4', 0.55);
    ctx.fill();
  }
}
// The lantern under the lantern arm (in its fill, so it keeps its own outline over the body), the
// ring's front over the arm's tip.
function dbLampUnder(ctx, a, mode, K) {
  const sk = a.tk;
  if (mode === 'line') {
    lampUpdate(a, sk, K);
    return;
  }
  if (!sk.lamp) lampUpdate(a, sk, K);
  drawLamp(ctx, a, sk, K);
}
function dbLampOver(ctx, a, mode) {
  if (mode !== 'fill') return;
  drawRingFront(ctx, a, a.tk);
}
// Where an effect comes from: the lantern, its bottom, the front ear's tip, the mouth.
function dbSpot(sk, what) {
  if (what === 'lamp') return sk.lamp?.glass ?? null;
  if (what === 'bonk') return sk.lamp?.bottom ?? null;
  if (what === 'ear') return sk.fins[1].mid[sk.fins[1].mid.length - 1];
  if (what === 'mouth') return sk.inM([sk.rx * 0.3 + (sk.look ?? 0) * 1.1 - 0.25, -sk.ry * 0.36]);
  return null;
}

// ---------- Its effects and marks ----------
// a soft halo ring (violet edge, warm core)
function haloRing(ctx, x, y, r, w, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.strokeStyle = '#a487e6';
  ctx.lineWidth = w + 0.7;
  ctx.stroke();
  ctx.strokeStyle = '#ffe7a0';
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.2, w * 0.35);
  ctx.stroke();
  ctx.restore();
}
// a mark in a soft round bubble over its head: "!" (amber) or "?" (violet)
function mark(ctx, x, y, kind, e, len, unflip) {
  const inn = e < 0.25 ? easeOut(e / 0.25) * (1 + 0.18 * Math.sin(Math.PI * clamp(e / 0.25, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  if (unflip) ctx.scale(-1, 1);
  ctx.globalAlpha *= Math.min(1, k * 1.4);
  const R = 4.3 * Math.min(1, 0.6 + 0.4 * k);
  ell(ctx, 0, 0, R, R * 0.94);
  ctx.fillStyle = 'rgba(252,248,255,0.97)';
  ctx.fill();
  ctx.strokeStyle = '#8e70cf';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // a little tail of bubbles toward its head, a glint
  bubble(ctx, -R * 0.5, R * 1.2, 0.85, 1);
  bubble(ctx, -R * 0.75, R * 1.75, 0.5, 1);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.72, -2.6, -1.95);
  ctx.stroke();
  if (kind === '!') {
    // (a soft tapered bar and a dot, warm amber like its lantern)
    ctx.beginPath();
    ctx.moveTo(-0.85, -R * 0.62);
    ctx.quadraticCurveTo(0, -R * 0.78, 0.85, -R * 0.62);
    ctx.lineTo(0.35, R * 0.16);
    ctx.quadraticCurveTo(0, R * 0.26, -0.35, R * 0.16);
    ctx.closePath();
    ctx.fillStyle = '#f0a03c';
    ctx.fill();
    ell(ctx, 0, R * 0.52, 0.72, 0.68);
    ctx.fill();
  } else {
    stroke(ctx, [[-R * 0.35, -R * 0.22], [-R * 0.3, -R * 0.62], [0, -R * 0.62], [R * 0.4, -R * 0.6], [R * 0.32, -R * 0.22], [R * 0.2, -R * 0.02], [0, R * 0.05], [-0.05, R * 0.1], [0, R * 0.22]], 1.1, '#8e70cf');
    ell(ctx, 0, R * 0.55, 0.66, 0.66);
    ctx.fillStyle = '#8e70cf';
    ctx.fill();
  }
  ctx.restore();
}
// a soft rounded z in a little bubble
function zee(ctx, x, y, k, al) {
  if (al <= 0.01) return;
  bubble(ctx, x, y, 2.2 * k, al * 0.8);
  ctx.save();
  ctx.globalAlpha *= al;
  const w = 1.05 * k;
  stroke(ctx, [[x - w, y - w], [x, y - w * 1.05], [x + w, y - w], [x, y], [x - w, y + w]], 0.55 * k, '#8f86c8');
  stroke(ctx, [[x - w, y + w], [x, y + w * 1.05], [x + w, y + w]], 0.55 * k, '#8f86c8');
  ctx.restore();
}
function dbFx(ctx, m, a, K) {
  const sk = a.tk;
  if (!sk || !sk.lamp) return;
  const t = a.t ?? 0;
  const unflip = Boolean(a.flip);
  const L = sk.lamp;
  const Lv = a.dbLv ?? 1;
  const G = L.glass;
  ctx.save();
  // the lantern's warm light round it
  if (Lv > 0.01) glow(ctx, G[0], G[1], 5.5 + 3.5 * Math.min(Lv, 2.6), DB.light.halo, Math.min(0.55, 0.16 + 0.1 * Lv));
  const head = sk.inM([sk.rx * 0.1, -sk.ry * 2]);
  const over = [head[0] + 3, head[1] - 7];
  // ---- the act's touches ----
  const A = a.dbAct;
  if (A && A.cw > 0.01 && A.piece && m.hp > 0) {
    const u = A.u;
    const cw = A.cw;
    if (A.piece === 'trim') {
      // a soft breath of little bubbles from its mouth to the light
      if (u > 1.9 && u < 3.0) {
        const mo = dbSpot(sk, 'mouth');
        for (let i = 0; i < 4; i++) {
          const q = (u - 1.9 - i * 0.12) / 0.6;
          if (q <= 0 || q >= 1) continue;
          bubble(ctx, mix(mo[0] + 1.2, G[0] - 2.4, q) , mix(mo[1], G[1] - 0.6, q) - Math.sin(Math.PI * q) * 1.4, 0.45 + 0.2 * (i % 2), cw * Math.sin(Math.PI * q));
        }
      }
      // the flare: a burst of warm sparkles and a soft ring
      if (u > 2.74 && u < 3.7) {
        const q = (u - 2.74) / 0.96;
        haloRing(ctx, G[0], G[1], 3 + 9 * easeOut(q), 1.3 * (1 - q) + 0.2, (1 - q) * cw);
        for (let i = 0; i < 5; i++) {
          const an = i * 1.26 + 0.4;
          const d = 3.5 + 8 * easeOut(q);
          sparkle(ctx, G[0] + Math.cos(an) * d, G[1] + Math.sin(an) * d, 1.3 * (1 - q) + 0.2, rgba(i % 2 ? '#fff6d0' : '#ffd36a', (1 - q) * cw));
        }
      }
      // pleased, the door shut: one little sparkle on the glass
      if (u > 6.0 && u < 7.0) sparkle(ctx, G[0] + 1.6, G[1] - 1.8, 1.4 * Math.sin(Math.PI * (u - 6.0)), rgba('#ffffff', cw));
    } else if (A.piece === 'dark') {
      // the light goes out: a little curl of soft lilac smoke from the cap
      if (u > 1.75 && u < 3.6) {
        const top = L.at(0, 1.2);
        for (let i = 0; i < 3; i++) {
          const q = (u - 1.75 - i * 0.25) / 1.3;
          if (q <= 0 || q >= 1) continue;
          puffAt(ctx, top[0] + Math.sin(q * 5 + i) * 1.3, top[1] - 1 - q * 9, 0.7 + 1.1 * q, Math.sin(Math.PI * q) * 0.7 * cw, '#e8e0f2', '#c6b8de');
        }
      }
      // back on: a pop of warm sparkles
      if (u > 5.0 && u < 5.7) {
        const q = (u - 5.0) / 0.7;
        for (let i = 0; i < 4; i++) {
          const an = i * 1.57 + 0.8;
          sparkle(ctx, G[0] + Math.cos(an) * (3 + 5 * easeOut(q)), G[1] + Math.sin(an) * (3 + 5 * easeOut(q)), 1.2 * (1 - q) + 0.2, rgba('#ffe6a0', (1 - q) * cw));
        }
      }
      // the big relieved sigh: a soft puff out of its mouth, drifting down and away
      if (u > 6.0 && u < 7.6) {
        const mo = dbSpot(sk, 'mouth');
        for (let i = 0; i < 3; i++) {
          const q = (u - 6.0 - i * 0.18) / 1.2;
          if (q <= 0 || q >= 1) continue;
          puffAt(ctx, mo[0] + 2 + q * 7 + i * 0.8, mo[1] + 0.5 + q * 2.5 - i * 0.6, 0.6 + 1.2 * q, Math.sin(Math.PI * q) * 0.75 * cw, '#fff4f6', '#f0c8d4');
        }
      }
    } else if (A.piece === 'lullaby') {
      // soft notes rising from its humming, violet and gold in turn
      const mo = dbSpot(sk, 'mouth');
      for (let i = 0; i < 5; i++) {
        const u0 = 0.8 + i * 1.15;
        const q = (u - u0) / 1.7;
        if (q <= 0 || q >= 1) continue;
        upright(ctx, mo[0] + 2.5 + q * 4 + Math.sin(q * 6 + i) * 1.2, mo[1] - 3 - q * 11, unflip, () => note(ctx, 0, 0, 0.62, Math.sin(Math.PI * q) * cw, i % 2 ? '#ffe39a' : '#d9c6ff', i % 2 ? '#d4964a' : '#8e70cf'));
      }
    }
  }
  // ---- the moves ----
  const mv = a.dbMove;
  if (mv && m.hp > 0) {
    if (mv.name === 'glare') {
      if (mv.t < 0) {
        // the charge: a halo tightening round the lantern, sparkles drawn in to it
        const ch = sstep(mv.antic);
        haloRing(ctx, G[0], G[1], 10 - 5 * ch, 0.5 + 0.6 * ch, ch * 0.75);
        for (let i = 0; i < 5; i++) {
          const fr = ((t * 1.6 + i * 0.2) % 1 + 1) % 1;
          const an = i * 1.256 + t * 0.9;
          const d = 13 * (1 - fr);
          sparkle(ctx, G[0] + Math.cos(an) * d, G[1] + Math.sin(an) * d, (0.5 + 0.9 * fr) * ch, rgba(i % 2 ? '#fff3c4' : '#d9c6ff', ch * Math.sin(Math.PI * fr)));
        }
      } else {
        // the flash: a soft bright disc, a ring rolling out, sparkles flung wide
        const q = (mv.t - MOVES.glare.flash) / 0.6;
        if (q > 0 && q < 1) {
          glow(ctx, G[0], G[1], 8 + 14 * easeOut(q), '#fffbe6', 0.85 * (1 - q));
          haloRing(ctx, G[0], G[1], 5 + 22 * easeOut(q), 2.2 * (1 - q) + 0.3, 1 - q);
          for (let i = 0; i < 7; i++) {
            const an = i * 0.9 - 0.6;
            const d = 6 + 18 * easeOut(q);
            sparkle(ctx, G[0] + Math.cos(an) * d, G[1] + Math.sin(an) * d * 0.8, 1.8 * (1 - q) + 0.2, rgba(i % 2 ? '#ffffff' : '#ffd96e', 1 - q));
          }
        }
      }
    } else if (mv.name === 'bonk') {
      const q = (mv.t - MOVES.bonk.bonkAt) / 0.5;
      if (q > 0 && q < 1) {
        const B = L.bottom;
        // a big soft star at the bonk, a little ring, golden sparkles hopping off
        sparkle(ctx, B[0] + 1, B[1], 5.2 * (1 - easeOut(q)) + 0.3, rgba('#fff3c4', 1 - q));
        sparkle(ctx, B[0] + 1, B[1], 2.6 * (1 - easeOut(q)), rgba('#ffffff', 1 - q));
        haloRing(ctx, B[0] + 1, B[1], 2 + 8 * easeOut(q), 0.9 * (1 - q) + 0.2, (1 - q) * 0.8);
        for (let i = 0; i < 6; i++) {
          const an = -Math.PI / 2 + (i - 2.5) * 0.48;
          const d = 3 + 10 * easeOut(q);
          sparkle(ctx, B[0] + 1 + Math.cos(an) * d, B[1] + Math.sin(an) * d + q * q * 6, 1.1 * (1 - q) + 0.15, rgba(i % 2 ? '#ffd96e' : '#fff6d0', 1 - q));
        }
      }
    } else if (mv.name === 'earslap') {
      // a soft swoosh behind the front ear's tip as it whips round, then a puff of bubbles
      const E = dbSpot(sk, 'ear');
      const s = (mv.t - 0.0) / 0.25;
      if (s > 0 && s < 1) {
        const c = sk.inM([sk.rx * 0.2, -sk.ry * 1.5]);
        const r = Math.hypot(E[0] - c[0], E[1] - c[1]);
        const an = Math.atan2(E[1] - c[1], E[0] - c[0]);
        ctx.save();
        ctx.globalAlpha *= (1 - s) * 0.85;
        ctx.beginPath();
        ctx.arc(c[0], c[1], r, an - 1.5 + s * 0.6, an);
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#f2c0b6';
        ctx.lineWidth = 2.4 * (1 - s) + 0.5;
        ctx.stroke();
        ctx.strokeStyle = '#fff6f0';
        ctx.lineWidth = 1.2 * (1 - s) + 0.2;
        ctx.stroke();
        ctx.restore();
      }
      const q = (mv.t - MOVES.earslap.puffAt) / 0.7;
      if (q > 0 && q < 1) {
        for (let i = 0; i < 7; i++) {
          const qq = clamp(q * 1.2 - i * 0.04, 0, 1);
          if (qq <= 0 || qq >= 1) continue;
          const an = -0.5 + (i - 3) * 0.22;
          const d = 2 + 16 * easeOut(qq);
          bubble(ctx, E[0] + 2 + Math.cos(an) * d, E[1] + 5 + Math.sin(an) * d - qq * 3, 0.6 + 0.35 * (i % 3), 1 - qq);
        }
      }
    }
  }
  // ---- its marks ----
  if (a.dbBang >= 0) mark(ctx, over[0], over[1], '!', a.dbBang, 1.1, unflip);
  else if (a.dbHuh >= 0) mark(ctx, over[0], over[1], '?', a.dbHuh, 1.5, unflip);
  // the gloat: a little note bobbing up from its happy wiggle
  if (a.dbGloat >= 0 && a.dbGloat < 1.05) {
    const e = a.dbGloat;
    const al = Math.min(1, (1.05 - e) * 4) * sstep(e / 0.1);
    upright(ctx, head[0] + 4 + e * 5, head[1] - 2 - e * 7 - Math.abs(Math.sin(e * 9)) * 1.2, unflip, () => note(ctx, 0, 0, 0.8, al, '#ffe39a', '#d4964a'));
    sparkle(ctx, head[0] - 3 - e * 2, head[1] - e * 5, 1.2 * Math.sin(Math.PI * clamp(e / 0.8, 0, 1)), rgba('#fff6d0', al));
  }
  // hurt: a little soft star pops off its head and a drop flies
  if (a.dbHurt >= 0 && a.dbHurt < 0.5) {
    const e = a.dbHurt / 0.5;
    const p = [head[0] - 4 - e * 4, head[1] + 1 - e * 5 + e * e * 4];
    sparkle(ctx, head[0] + 2, head[1] - 1, 2.6 * (1 - easeOut(e)), rgba('#ffffff', 1 - e));
    ctx.save();
    ctx.globalAlpha *= 1 - e;
    ctx.beginPath();
    ctx.moveTo(p[0] + 0.9, p[1] - 0.6);
    ctx.quadraticCurveTo(p[0] + 0.2, p[1] + 1.1, p[0] - 0.5, p[1] + 0.6);
    ctx.quadraticCurveTo(p[0] - 0.9, p[1] - 0.2, p[0] + 0.9, p[1] - 0.6);
    ctx.fillStyle = 'rgba(214,236,255,0.96)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(132,160,216,0.9)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ctx.restore();
  }
  // asleep: z's drifting up in little bubbles
  if (a.dbNap) {
    for (let i = 0; i < 3; i++) {
      const q = (t * 0.4 + i / 3) % 1;
      upright(ctx, head[0] + 2 + q * 5 + Math.sin(q * 5) * 1.2, head[1] - 2 - q * 10, unflip, () => zee(ctx, 0, 0, 0.6 + q * 0.5, Math.sin(Math.PI * q)));
    }
  }
  // beaten: little stars and bubbles going round over its head; a curl of smoke from the lantern
  if (a.dbDead >= 0) {
    const e = a.dbDead;
    const al = sstep(e / 0.3) * (1 - sstep((e - 2.4) / 0.6));
    for (let i = 0; i < 3; i++) {
      const an = t * 3 + (i * TAU) / 3;
      const x = head[0] + Math.cos(an) * 5;
      const y = head[1] - 2 + Math.sin(an) * 1.6;
      if (i % 2) bubble(ctx, x, y, 0.9, al);
      else sparkle(ctx, x, y, 1.5, rgba('#fff0b0', al));
    }
    if (e > 0.6 && e < 2.6) {
      const top = L.at(0, 1.2);
      for (let i = 0; i < 3; i++) {
        const q = (e - 0.6 - i * 0.3) / 1.4;
        if (q <= 0 || q >= 1) continue;
        puffAt(ctx, top[0] + Math.sin(q * 5 + i) * 1.2, top[1] - 1 - q * 8, 0.6 + 1 * q, Math.sin(Math.PI * q) * 0.65, '#e8e0f2', '#c6b8de');
      }
    }
  }
  ctx.restore();
}

// ---------- Its dress on the octopus ----------
const look = {
  P: {
    hover: 14,
    flatHover: 4.4,
    mantle: { at: [-0.4, 1.4], rx: 10.5, ry: 10, tilt: -3 },
    arm: { L: 9.6, n: 7, w0: 4.4, w1: 2.4 },
    arms: ARMS,
    webs: [[0, 1], [1, 2], [3, 4], [4, 5]],
    webF: 0.86,
    notch: 0.12,
    fins: { at: [[-0.7, -1.36], [0.64, -1.4]], L: 9, W: 4.3, rest: 6, amp: 28 },
    flapHz: 0.75,
    cycle: 26,
    bob: 1.5,
    speed: 48,
    moves: POOL,
  },
  C: DB.C,
  CA: DB.CA,
  CF: DB.CF,
  ink: DB.ink,
  moves: MOVES,
  pleased: 'wiggle',
  moveStiff: 2.6,
  pick: (m, a, st) => (typeof m.move === 'string' && MOVES[m.move] ? m.move : POOL[(st.tnN ?? 0) % POOL.length]),
  paint: dbPaint,
  face: dbFace,
  goals: dbGoals,
  pin: dbPin,
  spot: dbSpot,
  pose: dbPose,
  over: {
    fins: dbFins,
    armFront: dbLampOver,
  },
  under: {
    armFront: dbLampUnder,
  },
  fx: dbFx,
};

export const DUMBO = dressedOcto(look);
// (`noHop`: none of the monster drawer's little hops or idle notes over it; `ownEmotes`: every mark
// over its head is its own, drawn above)
DUMBO.art.noHop = true;
DUMBO.art.ownEmotes = true;
// (its dress, for the dev tools that watch its parts frame by frame)
export const DUMBO_LOOK = look;
