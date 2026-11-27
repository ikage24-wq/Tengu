// The Sea Angel (2026-11-26, remade from scratch in place of the old Star Twirler, keeping its id
// `stardancer`): a soprano in Queen Coralie's palace choir, the Sunken Aquarium Palace's level 20
// singer. A real sea angel (Clione), chibi: a round head with two tiny rounded horn-buds, a short
// neck, a soft plump body tapering to a rounded tail tip that sways, and two big rounded wing-flaps
// at her shoulders that she beats like little wings to fly through the water (a quick downbeat that
// lifts her, a slower up-stroke). Soft glassy aqua-mint, a pale sheen, a lilac shade. Her signature:
// her tiny coral-pink heart glowing softly inside her chest, beating (faster when she's excited), and
// a halo of little bubbles floating over her head. The palace livery: a coral-pink ribbon collar with
// a pearl at the throat. A dramatic show-off soprano: quick, fluttery, a bit vain, warm-hearted.
// She floats a hand's height over the floor and keeps to it (no `fly`), on her own copy of the fish
// base (fishbase.js, its seahorse reshaped into her).
//   idle    her act, in four pieces, the next one that fits the time she has before she moves on
//           (data: `rest`; world/mobs.js tells her, `m.restUntil`):
//           - the high note (8 s): a flourish, a big breath, chest out, and a long high note (soft
//             round music notes rising, her heart glowing brighter, wings spread and trembling) until
//             she runs out of breath... and coughs up a bubble. A sheepish look; ahem;
//           - halo trouble (7.6 s): humming, her bubble halo drifts askew; she notices, huffs, flutters
//             up under it and bumps it straight; one bubble pops (a sad face), and she blows a new one
//             up into the gap. Pleased;
//           - heart flutter (6.4 s): she notices you; her heart beats fast and glows, she clasps her
//             wings to her chest and twirls (two whole turns, clean mirror flips), then sighs, little
//             hearts rising;
//           - the curtsy (5.6 s): wings spread, a dainty curtsy, an encore bow, and a wing raised for
//             the applause.
//   moves   (def.moves, in turn) Wing Slap: one wing cocked back over her shoulder, then a quick
//           double slap, near wing then far, in soft aqua swooshes. Heart Swoop: she rises, wings
//           high, then dives head first at you, a burst of soft hearts on contact. High C: a big
//           breath, chin up, then a short sung blast: sound rings and a ring of notes pushing out in
//           front of her.
//   faces   her own family of eyes: tall oval "starry" eyes, an aqua-to-lilac iris with a tiny star
//           glint and a round glint, a neat lash line with one curled flick at the outer corner (the
//           whole iris always clear while she's awake); round brows; rosy blush; a small mouth that
//           rounds into an "o" when she sings. Calm, proud, a big breath, singing (eyes shut, "o"),
//           belting (eyes wide, "O"), strained, a cough, sheepish, surprised, a huff, sad, blowing,
//           happy, in love, joy, smug, fierce, shouting, hurt (squeezed), asleep, dizzy, worried,
//           cross and talking.
//   marks   her own (`ownEmotes`): a "!" in a bubble as she starts hunting you, "?" when she loses you,
//           a smug little trill note after a hit, a squeezed wince with a few bubbles knocked off her
//           when hurt, a bead of sweat when low, soft z's as she sleeps curled up with her wings
//           wrapped round her, and little stars circling when she's beaten.
// Everything drawn here, live, in her own soft style (curvy four-point sparkles, round bubbles with a
// glint, soft notes and hearts with a deeper line of their own colour, white cores).
import { dressedFish } from './fishbase.js';

// ---------- Little helpers ----------
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a pop in with a light overshoot: 0 → a touch past 1 → 1)
const backOut = (u) => {
  const v = clamp(u, 0, 1) - 1;
  return 1 + 2.2 * v * v * v + 1.2 * v * v;
};
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
  if (al <= 0.005 || r <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, al));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// the game's curvy four-point sparkle, with a soft line of its own
function sparkle(ctx, x, y, k, fill = '#ffffff', ink = '#8fb6dc', al = 1) {
  if (k <= 0.05 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x + k * 0.16, y - k * 0.16, x + k, y);
  ctx.quadraticCurveTo(x + k * 0.16, y + k * 0.16, x, y + k);
  ctx.quadraticCurveTo(x - k * 0.16, y + k * 0.16, x - k, y);
  ctx.quadraticCurveTo(x - k * 0.16, y - k * 0.16, x, y - k);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.25, k * 0.24);
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
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
// a round bubble with a glint, outlined in its own soft aqua
function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.08) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(232,252,250,0.6)';
  ctx.fill();
  ctx.lineWidth = Math.max(0.25, r * 0.24);
  ctx.strokeStyle = SA.bub;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.58, -2.6, -1.55);
  ctx.lineWidth = Math.max(0.22, r * 0.24);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ell(ctx, x + r * 0.38, y + r * 0.36, r * 0.13, r * 0.13);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}
// a bubble popping: a soft ring opening out, four little droplet sparkles
function pop(ctx, x, y, r, u) {
  if (u < 0 || u >= 1) return;
  const e = 1 - (1 - u) ** 2;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.beginPath();
  ctx.arc(x, y, r * (1 + e * 1.3), 0, TAU);
  ctx.lineWidth = Math.max(0.25, r * 0.3 * (1 - u));
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    const an = (i / 4) * TAU + 0.4;
    sparkle(ctx, x + Math.cos(an) * r * (1.2 + e * 2.2), y + Math.sin(an) * r * (1.2 + e * 2.2), r * 0.7 * Math.sin(Math.PI * u), '#ffffff', SA.bub);
  }
}
// a cute rounded heart (its tip rounded too), about 2s across
function heartPath(ctx, x, y, s, rot = 0) {
  const c = Math.cos(rot);
  const sn = Math.sin(rot);
  const P = (px, py) => [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s];
  ctx.beginPath();
  ctx.moveTo(...P(0.12, 0.9));
  ctx.quadraticCurveTo(...P(0, 0.98), ...P(-0.12, 0.9));
  ctx.bezierCurveTo(...P(-0.5, 0.6), ...P(-1.05, 0.15), ...P(-1.0, -0.32));
  ctx.bezierCurveTo(...P(-0.96, -0.95), ...P(-0.2, -1.05), ...P(0, -0.48));
  ctx.bezierCurveTo(...P(0.2, -1.05), ...P(0.96, -0.95), ...P(1.0, -0.32));
  ctx.bezierCurveTo(...P(1.05, 0.15), ...P(0.5, 0.6), ...P(0.12, 0.9));
  ctx.closePath();
}
function softHeart(ctx, x, y, s, al = 1, rot = 0) {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  heartPath(ctx, x, y, s, rot);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(0.3, s * 0.36);
  ctx.strokeStyle = SA.heart.ink;
  ctx.stroke();
  ctx.fillStyle = SA.heart.base;
  ctx.fill();
  ell(ctx, x - s * 0.42, y - s * 0.42, s * 0.28, s * 0.2, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}
// a soft rounded music note (an oval head, a stem, a curled flag), a deeper line of its own colour
function note(ctx, x, y, s, al, k = 0, rot = 0) {
  if (al <= 0.01 || s <= 0.05) return;
  const [col, ink] = SA.note[k % SA.note.length];
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const shape = (w, c) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0.95, -0.1);
    ctx.lineTo(0.95, -3.2);
    ctx.quadraticCurveTo(2.2, -2.9, 1.95, -1.6);
    ctx.stroke();
  };
  shape(1.25, ink);
  ell(ctx, 0, 0, 1.15, 0.86, -0.4);
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  shape(0.55, col);
  ell(ctx, -0.35, -0.25, 0.35, 0.22, -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}

// ---------- Her colours ----------
const SA = {
  C: { lt: '#f3fffc', base: '#c2efe6', sh: '#b3c4ec', deep: '#9aa5dc' },
  CW: { lt: '#ffffff', base: '#e2e7fb', sh: '#c3c0ee', deep: '#8f98d6' },
  ink: '#6b8fbd',
  lash: '#4b4592',
  brow: '#8f8ccc',
  mouth: '#86508a',
  rib: { lt: '#ffd9d9', base: '#f7a4ab', sh: '#df8592', ink: '#c56f82' },
  pearl: { lt: '#ffffff', base: '#f8f3f5', sh: '#d8cce8', ink: '#a99cc6' },
  heart: { core: '#ffe6ec', base: '#ff93aa', sh: '#ec7591', glow: '#ff9fb8', ink: '#d9667f' },
  bub: '#79a9d4',
  note: [['#c7b6f6', '#8676cc'], ['#a3e8e1', '#56a9b0'], ['#ffb6c1', '#d27b8c']],
};

// ---------- Her moods: the face's targets ----------
// shut (which eyes: open, happy arcs, sleep, squeeze, dizzy); bt brow tilt (+ knit, − worried), by brow
// raise; the mouth's half width, smile (−1 frown .. 1 smile), openness and roundness (1: an "o");
// bl blush; star the glint's size; heart heart-shaped glints; smirk one corner up; tear.
const FACE0 = { bt: 0, by: 0, mw: 0.72, ms: 0.35, mo: 0, mr: 0, bl: 0.55, star: 1, heart: 0, smirk: 0, tear: 0 };
const FACES = {
  calm: { shut: 'open' },
  proud: { shut: 'happy', bt: -0.1, by: 0.5, mw: 0.78, ms: 0.85, bl: 0.7, smirk: 0.4 },
  breath: { shut: 'open', bt: -0.25, by: 0.85, mw: 0.36, ms: 0.15, bl: 0.95 },
  sing: { shut: 'happy', bt: -0.35, by: 0.9, mw: 0.5, ms: 0.2, mo: 1.0, mr: 1, bl: 0.9 },
  belt: { shut: 'open', bt: -0.2, by: 1.1, mw: 0.5, ms: 0.1, mo: 1.2, mr: 1, bl: 0.85, star: 1.3 },
  strain: { shut: 'squeeze', bt: -0.65, by: 0.4, mw: 0.42, ms: -0.15, mo: 0.55, mr: 1, bl: 1.1 },
  cough: { shut: 'squeeze', bt: -0.4, by: 0.1, mw: 0.55, ms: -0.2, mo: 0.7, mr: 0.6, bl: 0.95 },
  sheepish: { shut: 'open', bt: -0.5, by: 0.3, mw: 0.7, ms: 0.5, bl: 1.05 },
  surprised: { shut: 'open', bt: -0.15, by: 1.1, mw: 0.35, ms: 0, mo: 0.5, mr: 1, bl: 0.6, star: 1.2 },
  huff: { shut: 'open', bt: 0.65, by: 0, mw: 0.55, ms: -0.4, bl: 0.8 },
  sad: { shut: 'open', bt: -0.8, by: 0.25, mw: 0.55, ms: -0.6, bl: 0.5, tear: 1 },
  blow: { shut: 'open', bt: -0.1, by: 0.45, mw: 0.28, ms: 0, mo: 0.38, mr: 1, bl: 0.85 },
  happy: { shut: 'happy', bt: -0.15, by: 0.6, mw: 0.9, ms: 1, mo: 0.6, bl: 0.9 },
  love: { shut: 'open', bt: -0.35, by: 0.6, mw: 0.6, ms: 0.85, bl: 1.3, star: 1.4, heart: 1 },
  joy: { shut: 'happy', bt: -0.2, by: 0.7, mw: 0.95, ms: 1, mo: 0.75, bl: 1.1 },
  smug: { shut: 'happy', bt: 0.15, by: 0.55, mw: 0.5, ms: 0.6, mo: 0.32, mr: 0.85, bl: 0.75, smirk: 1 },
  fierce: { shut: 'open', bt: 0.75, by: -0.1, mw: 0.5, ms: -0.15, bl: 0.55 },
  shout: { shut: 'open', bt: 0.85, by: -0.1, mw: 0.75, ms: 0.1, mo: 0.95, mr: 0.3, bl: 0.6 },
  hurt: { shut: 'squeeze', bt: -0.6, mw: 0.6, ms: -0.6, mo: 0.45, mr: 0.4, bl: 0.6 },
  sleep: { shut: 'sleep', bt: -0.1, mw: 0.3, ms: 0.15, mo: 0.16, mr: 1, bl: 0.5 },
  dizzy: { shut: 'dizzy', bt: -0.4, by: 0.2, mw: 0.6, ms: -0.4, mo: 0.4, mr: 0.6, bl: 0.4 },
  worried: { shut: 'open', bt: -0.65, by: 0.3, mw: 0.5, ms: -0.3, mo: 0.15, mr: 0.6, bl: 0.5 },
  cross: { shut: 'open', bt: 0.85, by: -0.2, mw: 0.6, ms: -0.45, bl: 0.6 },
  talk: { shut: 'open', bt: -0.05, by: 0.3, mw: 0.7, ms: 0.4, mo: 0.4, bl: 0.6 },
};
for (const k of Object.keys(FACES)) FACES[k] = { ...FACE0, ...FACES[k] };
const SHUTS = ['open', 'happy', 'sleep', 'squeeze', 'dizzy'];
const FKEYS = Object.keys(FACE0);
// vowels for talking: [width, smile, open, round], each held a beat, eased into the next
const VOWELS = [[0.45, 0.1, 0.8, 0.9], [0.85, 0.4, 0.6, 0.15], [0.95, 0.5, 0.3, 0], [0.7, 0.3, 0, 0], [0.5, 0.2, 0.5, 0.7]];

// ---------- The moves (channels: d1 the near wing cocked back high, d2 the near wing slapped
// forward over the top, d3 the far wing slapped forward, d4 both spread wide behind, d5 both
// clasped to her chest (round from below), d6 both tucked back, d7 the near wing raised in a
// flourish, d8 the near wing swept forward low (a bow), the far one spread low) ----------
const MOVES = {
  // Wing Slap: one wing cocked back over her shoulder, then a quick double slap, near then far.
  slap: {
    anticT: 0.35,
    keys: [
      [0, { x: -0.05, rise: 0.03, pitch: -12, head: -6, bend: -12, d1: 1 }],
      [0.06, { x: 0.3, rise: 0, pitch: 14, head: 6, bend: 14, d1: 0, d2: 1 }, 'out'],
      [0.13, { x: 0.28, pitch: 4, head: 0, bend: 2, d2: 0.35 }, 'io'],
      [0.19, { x: 0.34, pitch: 16, head: 5, bend: 16, d2: 0.1, d3: 1 }, 'out'],
      [0.42, { x: 0.3, pitch: 10, bend: 8, d2: 0, d3: 0.8 }],
      [0.68, { x: 0.1, pitch: 2, head: 0, bend: 0, d3: 0.15 }, 'io'],
      [0.92, {}, 'io'],
    ],
    swoosh: [[0.06, 'near'], [0.19, 'far']],
  },
  // Heart Swoop: up she rises, wings high, then dives head first at you; a burst of hearts.
  swoop: {
    anticT: 0.35,
    keys: [
      [0, { x: -0.06, rise: 0.36, pitch: -16, head: -10, bend: -18, curl: 0.3, d4: 1 }],
      [0.1, { x: 0.55, rise: 0.04, pitch: 62, head: 12, bend: 10, curl: -0.4, d4: 0, d6: 1 }, 'out'],
      [0.17, { x: 0.5, rise: 0, pitch: 40, head: 6, d6: 0.6 }, 'io'],
      [0.42, { x: 0.28, rise: 0.06, pitch: -10, head: -4, bend: -6, curl: 0.1, d6: 0, d4: 0.7 }, 'io'],
      [0.64, { x: 0.12, rise: 0.02, pitch: 0, head: 0, bend: 0, curl: 0, d4: 0.2 }, 'io'],
      [0.92, {}, 'io'],
    ],
    burst: 0.09,
  },
  // High C: a big breath, chest out and chin up; the note, a short blast at you; held; a bow of
  // the head.
  highC: {
    anticT: 0.35,
    keys: [
      [0, { x: -0.04, rise: 0.04, pitch: -14, head: -16, bend: -8, d4: 0.55 }],
      [0.05, { x: 0.06, rise: 0.02, pitch: 6, head: 2, bend: 6, d4: 1 }, 'out'],
      [0.44, { x: 0.06, pitch: 4, head: 0, d4: 0.95 }],
      [0.7, { x: 0.02, rise: 0, pitch: 0, bend: 0, d4: 0.2 }, 'io'],
      [0.96, {}, 'io'],
    ],
    blast: 0.05,
  },
  // Hit: a flinch back, wings jolted back, a curl of the tail.
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.07, pitch: -14, head: -12, bend: 24, curl: 0.4, d6: 0.6 }, 'out'],
      [0.22, { x: -0.06, pitch: -8, head: -6, bend: 10, d6: 0.3 }],
      [0.42, { x: -0.03, pitch: -2, head: 0, bend: 0, curl: 0, d6: 0 }, 'io'],
      [0.76, {}, 'io'],
    ],
  },
  // After landing a hit: chin up, a wing raised, a smug little trill.
  trill: {
    anticT: 0.1,
    keys: [
      [0, {}],
      [0.14, { rise: 0.05, pitch: -8, head: -12, d7: 0.7 }, 'out'],
      [0.6, { rise: 0.06, pitch: -6, head: -9, d7: 0.6 }],
      [0.84, { rise: 0, pitch: 0, head: 0, d7: 0 }, 'io'],
      [1.05, {}],
    ],
  },
};
const POOL = ['slap', 'swoop', 'highC'];
const NAMES = new Map(Object.entries(MOVES).map(([k, v]) => [v, k]));

// ---------- Her act ----------
const PIECES = { aria: 8.0, halo: 7.6, flutter: 6.4, curtsy: 5.6 };
const ORDER = ['aria', 'halo', 'flutter', 'curtsy'];
// (her wing-beat's pace: px swum to a beat; a beat a second at rest)
const WCYC = 18;
const REST_RATE = 1.7;
const HALO_N = 7;
const GAP = 2;
// a wing beat's shape: 0 up, 1 down; a quick downbeat (38%), a slower up-stroke
const strokeAt = (ph) => (ph < 0.38 ? sstep(ph / 0.38) : 1 - sstep((ph - 0.38) / 0.62));
// the lift it gives: up through the downbeat, sinking back through the up-stroke
const liftAt = (ph) => (ph < 0.45 ? sstep(ph / 0.45) : 1 - sstep((ph - 0.45) / 0.55));
// her heart's beat (a soft lub-dub)
const beatAt = (ph) => {
  const u = ph % 1;
  return Math.exp(-(((u - 0.12) / 0.07) ** 2)) + 0.6 * Math.exp(-(((u - 0.32) / 0.07) ** 2));
};

function moveFace(name, mt) {
  if (name === 'slap') return mt < 0 ? 'fierce' : mt < 0.32 ? 'shout' : 'fierce';
  if (name === 'swoop') return mt < 0 ? 'smug' : mt < 0.3 ? 'shout' : 'proud';
  if (name === 'highC') return mt < 0 ? 'breath' : mt < 0.62 ? 'belt' : 'proud';
  if (name === 'trill') return 'smug';
  return 'fierce';
}

function saPose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? 0;
  const t = a.t ?? 0;
  const alive = m.hp > 0;
  const q = { face: null, lookX: null, lookY: null, flapK: 1, flapAmp: 1, vib: 0, rate: 1.15, glow: 0.35, askew: 0, popT: -1, gap: false, newT: -1, singT: -1, singW: 0, inhale: 0, coughT: -1, twirl: false, twirlT: -1, heartsT: -1, bowT: -1, hum: -1, sweat: 0 };
  a.sa = q;
  a.saM = m;
  const go = (p, w) => {
    if (w > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * w;
  };
  const add = (p, w) => {
    if (w > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * w;
  };
  const say = (f, w) => {
    if (w > 0.45) q.face = f;
  };
  const swim = sstep(st.fsSwim ?? 0);
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.55;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;
  const name = mv ? NAMES.get(mv) ?? null : null;

  // ----- The act (floating about calm, eased in and out) -----
  const calmGoal = !mv && alive && !napping && !m.pose && !m.cine && !hurt && !fighting && swim < 0.15 ? 1 : 0;
  st.saCalm = mix(st.saCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 8));
  const w = sstep(st.saCalm);
  let PC = st.saPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (w < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 0.6) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.saOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.saOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.saOrd = (st.saOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.saPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;

  if (w > 0.001 && piece === 'aria') {
    // a flourish of the near wing, proud
    const prep = win(pu, 0.1, 0.5, 1.0, 1.3);
    go({ d7: 0.7, head: -4 }, prep * w);
    say('proud', prep * w);
    // the big breath: chest out, chin up, wings lifting back
    const br = win(pu, 1.0, 1.5, 2.0, 2.15);
    go({ pitch: -10, head: -12, d4: 0.45 }, br * w);
    add({ lift: 1.4 }, br * w);
    say('breath', br * w);
    q.inhale = br * w;
    // the note: wings spread wide and trembling, rising as it climbs, her heart aglow
    const nt = win(pu, 2.0, 2.2, 5.3, 5.9);
    go({ pitch: -7, head: -16, d4: 1 }, nt * w);
    add({ lift: 3.2 * sstep((pu - 2.0) / 3.2) }, nt * w);
    q.vib = Math.max(q.vib, nt * w);
    q.flapAmp = mix(q.flapAmp, 0.3, nt * w);
    if (pu >= 2.05 && pu < 5.9) {
      q.singT = pu - 2.05;
      q.singW = nt * w;
    }
    say(pu < 3.8 ? 'sing' : 'belt', nt * w);
    // out of breath: it wobbles, she strains, sinking
    const sr = win(pu, 5.3, 5.45, 5.95, 6.1);
    go({ head: -6, pitch: -2, d4: 0.55 }, sr * w);
    add({ lift: -1.2 }, sr * w);
    say('strain', sr * w);
    // the cough: a jerk forward, and a bubble pops out
    const cf = win(pu, 6.0, 6.06, 6.2, 6.6);
    go({ pitch: 12, head: 14, bend: 10, d4: 0, d6: 0.3 }, cf * w);
    say('cough', cf * w);
    if (pu >= 6.05 && pu < 8.0) q.coughT = pu - 6.05;
    // sheepish, eyes on the bubble; then ahem
    const sh = win(pu, 6.45, 6.65, 7.2, 7.4);
    say('sheepish', sh * w);
    q.sweat = Math.max(q.sweat, sh * w);
    if (sh > 0.3) {
      q.lookY = -1;
      q.lookX = 0.7;
    }
    const ahem = win(pu, 7.3, 7.5, 7.7, 8.0);
    go({ pitch: -4, head: -6, d7: 0.45 }, ahem * w);
    say('proud', ahem * w);
    q.glow = mix(q.glow, 1, Math.max(nt, br * 0.7) * w);
    q.rate = mix(q.rate, 1.6, nt * w);
  }
  if (w > 0.001 && piece === 'halo') {
    // humming, the halo drifts askew (and is bumped straight at 2.65 s)
    q.askew = win(pu, 0.2, 1.7, 2.6, 2.72) * w;
    const hum = win(pu, 0.2, 0.5, 1.35, 1.5);
    say('proud', hum * w);
    if (pu >= 0.3 && pu < 1.6) q.hum = pu - 0.3;
    const nz = win(pu, 1.45, 1.6, 1.95, 2.05);
    say('surprised', nz * w);
    if (pu > 1.45 && pu < 3.05) q.lookY = -1;
    say('huff', win(pu, 1.95, 2.05, 2.4, 2.5) * w);
    // a flutter up under it, quick little beats, bumping it straight
    const up = win(pu, 2.15, 2.5, 2.75, 3.3);
    add({ lift: 5.5 }, up * w);
    q.flapK = mix(1, 2.8, up * w);
    q.flapAmp = mix(q.flapAmp, 1.2, up * w);
    say('huff', up * w);
    say('proud', win(pu, 2.95, 3.05, 3.35, 3.45) * w);
    // one bubble pops: sad
    if (w > 0.5 && pu >= 3.45 && pu < 6.45) q.gap = true;
    if (pu >= 3.45 && pu < 4.4) q.popT = pu - 3.45;
    const sd = win(pu, 3.5, 3.7, 4.55, 4.75);
    say('sad', sd * w);
    go({ head: 8, d6: 0.4 }, sd * w);
    if (sd > 0.3) q.lookY = -1;
    // a breath in, and she blows a new one up into the gap
    const ib = win(pu, 4.7, 4.82, 4.95, 5.02);
    say('breath', ib * w);
    go({ pitch: -6, head: -6 }, ib * w);
    const bl = win(pu, 5.0, 5.08, 5.6, 5.75);
    say('blow', bl * w);
    go({ pitch: 3, head: -10 }, bl * w);
    if (w > 0.5 && pu >= 5.0 && pu < 6.6) q.newT = pu - 5.0;
    if (pu > 5.6 && pu < 6.5) q.lookY = -1;
    // pleased, a little wiggle
    const jy = win(pu, 6.45, 6.6, 7.15, 7.55);
    say('joy', jy * w);
    add({ lift: 1, bend: Math.sin(pu * 11) * 6 }, jy * w);
  }
  if (w > 0.001 && piece === 'flutter') {
    // she notices you
    const nz = win(pu, 0.1, 0.22, 0.75, 0.95);
    say('surprised', nz * w);
    add({ lift: 1.6 }, nz * w);
    go({ d4: 0.5 }, nz * w);
    // her heart beats fast and glows; wings clasped to her chest, a bashful sway
    const lv = win(pu, 0.8, 1.1, 2.0, 2.2);
    say('love', lv * w);
    go({ d5: 1, head: 9, pitch: 4 }, lv * w);
    add({ bend: Math.sin(pu * 4.5) * 7 }, lv * w);
    q.rate = mix(q.rate, 2.9, win(pu, 0.15, 0.4, 5.0, 5.6) * w);
    q.glow = mix(q.glow, 1, win(pu, 0.3, 0.6, 5.0, 5.6) * w);
    if (pu > 0.1 && pu < 2.1) q.lookX = -0.7;
    // the twirl: two whole turns, clean mirror flips at each half turn
    const tw = win(pu, 2.0, 2.2, 3.75, 3.95);
    go({ d5: 1, head: -6, pitch: -3 }, tw * w);
    add({ lift: 2 }, tw * w);
    say('joy', tw * w);
    q.twirl = w > 0.5 && pu >= 2.2 && pu < 3.8 && Math.floor((pu - 2.2) / 0.4) % 2 === 0;
    if (pu >= 2.2 && pu < 4.3) q.twirlT = pu - 2.2;
    // a dreamy sigh, little hearts rising
    const sg = win(pu, 3.85, 4.15, 5.0, 5.45);
    say('love', sg * w);
    go({ d5: 0.9, head: 11, pitch: 6 }, sg * w);
    if (sg > 0.3) q.lookX = -0.7;
    if (pu >= 3.95 && pu < 6.2) q.heartsT = pu - 3.95;
  }
  if (w > 0.001 && piece === 'curtsy') {
    const sp = win(pu, 0.1, 0.45, 0.85, 1.05);
    go({ d4: 1, head: -8, pitch: -5 }, sp * w);
    say('proud', sp * w);
    // a dainty curtsy: a dip, her head bowed, her tail tucked, wings spread low
    const dp = win(pu, 0.9, 1.35, 2.05, 2.55);
    go({ d8: 1, head: 16, pitch: 8, curl: 0.7, bend: -12 }, dp * w);
    add({ lift: -3.4 }, dp * w);
    say('proud', dp * w);
    // the encore bow: deeper and quicker, the near wing swept across in front
    const bw = win(pu, 2.75, 3.0, 3.45, 3.9);
    go({ d8: 1, head: 24, pitch: 16, curl: 0.5, bend: -8 }, bw * w);
    add({ lift: -1.5 }, bw * w);
    say('happy', bw * w);
    if (pu >= 2.95 && pu < 4.1) q.bowT = pu - 2.95;
    // a wing raised for the applause
    const fin = win(pu, 3.85, 4.1, 5.05, 5.55);
    go({ d7: 0.85, head: -6, pitch: -3 }, fin * w);
    say('smug', fin * w);
    if (fin > 0.3) q.lookX = -0.7;
  }
  q.calm = w;

  // ----- Hunting you: leaning in, wings half spread -----
  if (fighting && !mv && !hurt) go({ d4: 0.35, pitch: 6, head: 2 }, 1 - swim * 0.5);
  if (low && !mv) go({ d6: 0.25 }, 1);
  // ----- Asleep: curled up, wings wrapped round her -----
  st.saNap = mix(st.saNap ?? 0, napping && !mv ? 1 : 0, k(napping ? 2.2 : 6));
  const nw = sstep(st.saNap);
  if (nw > 0.001) go({ d5: 1, curl: 0.9, bend: -12, head: 20 }, nw);
  if (!alive) go({ d6: 0.6 }, 1);
  // ----- Her moves' own touches: the High C's vibrato -----
  if (name === 'highC' && mt >= 0.05 && mt < 0.6) q.vib = Math.max(q.vib, 1 - sstep((mt - 0.45) / 0.15));
  if (name === 'swoop' && mt < 0) q.glow = Math.max(q.glow, 0.9);
  if (name === 'highC' && mt < 0) q.inhale = Math.max(q.inhale, 1);

  // ----- Her wing beat, and the bob it gives -----
  const odo = m.odo ?? 0;
  const step = Math.min(30, Math.abs(odo - (st.saOdo ?? odo)));
  st.saOdo = odo;
  st.saFK = mix(st.saFK ?? 1, q.flapK, k(6));
  const still = napping || !alive;
  st.saWph = ((st.saWph ?? ((m.uid ?? 0) * 0.29) % 1) + (still ? 0 : dt * REST_RATE * st.saFK * (1 - swim) + step / WCYC)) % 1;
  st.saAmp = mix(st.saAmp ?? 1, still ? 0 : q.flapAmp, k(5));
  st.saVib = mix(st.saVib ?? 0, q.vib, k(10));
  out.lift = (out.lift ?? 0) + liftAt(st.saWph) * mix(1.7, 1.0, swim) * st.saAmp;

  // ----- Her mood, and her face eased toward it -----
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (!alive) mood = 'dizzy';
  else if (hurt) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name && name !== 'hurt') mood = moveFace(name, mt);
  else if (cine === 'happy') mood = 'joy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (w > 0.5 && q.face) mood = q.face;
  else if (fighting) mood = 'fierce';
  else if (low) mood = 'worried';
  // (a dev check page may hold a mood to look at it close up)
  if (m.faceTest && FACES[m.faceTest]) mood = m.faceTest;
  const F = FACES[mood] ?? FACES.calm;
  const f = (st.saF ??= { ...FACE0, w: { open: 1, happy: 0, sleep: 0, squeeze: 0, dizzy: 0 }, lookX: 0, lookY: 0, sweat: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor(now * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2], mr: v[3] };
  }
  const fast = k(14);
  for (const key of FKEYS) f[key] = mix(f[key], tgt[key], fast);
  for (const s of SHUTS) f.w[s] = mix(f.w[s], s === F.shut ? 1 : 0, k(13));
  // (where she looks: what the act says; back over her shoulder as she turns round (the face first,
  // then the body); at the bubble she coughed; else ahead)
  let lx = q.lookX ?? 0;
  let ly = q.lookY ?? 0;
  if (st.fsTt != null && st.fsTt < 0.14 && alive) lx = -1;
  if (mood === 'sad') ly = 0.6;
  f.lookX = mix(f.lookX, lx, k(16));
  f.lookY = mix(f.lookY, ly, k(16));
  f.sweat = mix(f.sweat, Math.max(q.sweat, low && !mv ? 1 : 0), k(5));
  // her own blink rhythm (from her id), only while her eyes are open
  const bp = (now + (m.uid ?? 0) * 0.71) % 4.3;
  f.blink = F.shut === 'open' ? win(bp, 0, 0.05, 0.08, 0.14) : 0;
  a.saF = f;
  a.saMood = mood;

  // ----- Her heart: its beat and glow -----
  let rate = q.rate;
  let glw = q.glow;
  if (fighting) {
    rate = Math.max(rate, 1.8);
    glw = Math.max(glw, 0.55);
  }
  if (low) rate = Math.max(rate, 2.3);
  if (mood === 'love') {
    rate = Math.max(rate, 2.8);
    glw = 1;
  }
  if (napping) {
    rate = 0.7;
    glw = 0.25;
  }
  if (!alive) {
    rate = 0;
    glw = 0;
  }
  st.hbRate = mix(st.hbRate ?? 1.1, rate, k(3));
  st.hbPh = ((st.hbPh ?? (m.uid ?? 0) * 0.37) + dt * st.hbRate) % 1000;
  st.hbGlow = mix(st.hbGlow ?? 0.35, glw, k(4));
  a.saHB = { b: alive ? beatAt(st.hbPh) : 0, glow: st.hbGlow };

  // ----- Her marks: "!" as she starts hunting you, "?" when she loses you -----
  if (fighting && !st.saHunt) st.saBangAt = now;
  if (!fighting && st.saHunt && alive) st.saLostAt = now;
  st.saHunt = fighting;
  q.bang = now - (st.saBangAt ?? -9);
  q.huh = now - (st.saLostAt ?? -9);
  q.gloatT = alive ? now - (m.gloatAt ?? -9) : -1;
  q.hurtT = hurt ? ago : -1;
  q.zz = nw;
  if (!alive) st.saDeadAt ??= now;
  else st.saDeadAt = undefined;
  q.deadT = alive ? -1 : now - st.saDeadAt;
  // (the halo's missing bubble: gone at once when it pops, grown back in if the act is cut short)
  st.haMiss = q.gap ? 1 : q.newT >= 1.45 ? 0 : mix(st.haMiss ?? 0, 0, k(5));
  if (q.newT >= 0 && q.newT < 1.45) st.haMiss = 1;
  // her twirl (two whole turns): mirror flips, done by the drawer below
  st.saTwirl = q.twirl && alive;
}

// ---------- Her wings ----------
// (near: d1 cocked back high, d2 slapped forward over the top, d4 spread, d5 clasped round from below,
// d6 tucked, d7 raised, d8 swept forward low; far: d3 slapped forward, d4, d5, d6, d8 spread low)
const NEAR_POSES = [['d1', -40], ['d2', 98], ['d4', -96], ['d5', -222], ['d6', -170], ['d7', -24], ['d8', -246]];
const FAR_POSES = [['d3', 92], ['d4', -84], ['d5', -236], ['d6', -162], ['d8', -124]];
function saPecGoal(side, { S, a, st, far }) {
  const ph = ((st.saWph ?? 0) + (far ? 0.05 : 0)) % 1;
  const amp = st.saAmp ?? 1;
  const up = far ? -42 : -50;
  const dn = far ? -122 : -132;
  const mid = (up + dn) / 2;
  const flap = mid + (mix(up, dn, strokeAt(ph)) - mid) * amp;
  let sum = 0;
  let acc = 0;
  for (const [ch, g] of far ? FAR_POSES : NEAR_POSES) {
    const wv = clamp(S[ch] ?? 0, 0, 1.2);
    if (wv <= 0) continue;
    // (spread wide while she sings: a fast little tremble)
    const vib = ch === 'd4' ? (st.saVib ?? 0) * 7 * Math.sin((a.t ?? 0) * 34 + (far ? 1.3 : 0)) : 0;
    sum += wv;
    acc += wv * (g + vib);
  }
  if (sum <= 0) return flap;
  const free = Math.max(0, 1 - sum);
  return (flap * free + acc) / Math.max(1, sum + free);
}
// A wing-flap: a rounded paddle, narrow at its root inside her shoulder, broad and round at the end,
// its tip cupping a little against the stroke.
function saWingPts(f) {
  const u = [Math.cos(f.ang), Math.sin(f.ang)];
  const v = [-u[1], u[0]];
  const L = f.len;
  const W = f.w;
  const cup = clamp(-(f.lag ?? 0) * 1.4, -0.45, 0.45);
  const at = (x, y) => {
    const yy = y * W + cup * x * x * W * 0.5;
    return [f.root[0] + u[0] * x * L + v[0] * yy, f.root[1] + u[1] * x * L + v[1] * yy];
  };
  return [at(-0.2, 0), at(0.02, -0.18), at(0.3, -0.34), at(0.62, -0.47), at(0.9, -0.42), at(1.04, -0.12), at(1.0, 0.2), at(0.82, 0.4), at(0.52, 0.38), at(0.22, 0.25), at(0.02, 0.15)];
}
function saWingPaint(ctx, a, f, far, K) {
  const u = [Math.cos(f.ang), Math.sin(f.ang)];
  const c = [f.root[0] + u[0] * f.len * 0.62, f.root[1] + u[1] * f.len * 0.62];
  glow(ctx, c[0], c[1], f.len * 0.62, far ? SA.CW.base : SA.CW.lt, far ? 0.55 : 0.95);
  // a lilac blush of shade at the root, a pale glassy rim round the edge
  glow(ctx, f.root[0], f.root[1], f.len * 0.42, SA.CW.sh, far ? 0.4 : 0.6);
  ctx.beginPath();
  K.loopPath(ctx, saWingPts(f));
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = far ? 'rgba(235,240,255,0.35)' : 'rgba(255,255,255,0.7)';
  ctx.stroke();
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = rgba(SA.CW.sh, 0.75);
  ctx.beginPath();
  K.loopPath(ctx, saWingPts({ ...f, len: f.len * 0.8, w: f.w * 0.72, root: [f.root[0] + u[0] * f.len * 0.12, f.root[1] + u[1] * f.len * 0.12] }));
  ctx.stroke();
}

// ---------- Her body's markings: the glassy sheen, and her heart ----------
function saPaint(ctx, a, sk, K) {
  const SJ = K.SJ;
  // a pale sheen down her back, a glassy rim of light inside its edge, a lilac shade low in front
  const s0 = SJ[2];
  glow(ctx, ...sk.along(s0 + 1.5, sk.back[2] * 0.45), 4.2, '#ffffff', 0.55);
  ctx.beginPath();
  const rim = [];
  for (let i = 0; i <= 5; i++) {
    const s = mix(SJ[2] - 0.5, SJ[sk.pos.length - 2], i / 5);
    rim.push(sk.along(s, sk.girth(s, 1) * 0.7));
  }
  K.linePath(ctx, rim);
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.stroke();
  glow(ctx, ...sk.along(SJ[3] + 2, -sk.belly[3] * 0.7), 5, SA.C.sh, 0.4);
  // her heart: inside her chest, a soft coral-pink glow that beats
  const hb = a.saHB ?? { b: 0, glow: 0.35 };
  const hp = sk.along(SJ[2] + 1.1, -sk.belly[2] * 0.4);
  const an = sk.angAt(SJ[2] + 1.1) - Math.PI / 2;
  glow(ctx, hp[0], hp[1], 4.6 + 1.2 * hb.b, SA.heart.glow, 0.22 + 0.38 * hb.glow + 0.2 * hb.b);
  const s = 1.5 * (1 + 0.07 * hb.b);
  heartPath(ctx, hp[0], hp[1], s, an);
  ctx.fillStyle = lit(a, SA.heart.base, 0.82);
  ctx.fill();
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = rgba(SA.heart.sh, 0.7);
  ctx.stroke();
  glow(ctx, hp[0] - 0.35, hp[1] - 0.4, 1.3, SA.heart.core, 0.5 + 0.4 * hb.glow);
  sparkle(ctx, hp[0] - 0.55, hp[1] - 0.6, 0.45 + 0.2 * hb.b, '#ffffff', SA.heart.sh, 0.9);
}
// Her head's: a sheen on the crown, a glassy rim of light round the back.
function saHeadPaint(ctx, a, sk) {
  const { rx, ry } = sk.head;
  glow(ctx, -rx * 0.3, -ry * 0.58, rx * 0.62, '#ffffff', 0.65);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.84, ry * 0.84, 0, 2.3, 3.75);
  ctx.lineWidth = 0.65;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.stroke();
  glow(ctx, -rx * 0.25, ry * 0.85, rx * 0.55, SA.C.sh, 0.35);
}
// Two tiny rounded horn-buds on top of her head, rooted inside it (drawn under it).
function saBuds(ctx, a, mode, K) {
  const sk = a.fk;
  const { rx, ry } = sk.head;
  K.headFrame(ctx, a);
  const wob = Math.sin(TAU * (a.mo.rig?.saWph ?? 0) - 1.2) * 0.07;
  const buds = [];
  for (const [th, L, r] of [[-2.05, 0.75, 0.66], [-1.3, 0.9, 0.72]]) {
    const b = [Math.cos(th) * (rx - 0.9), Math.sin(th) * (ry - 0.9)];
    const d = th + wob * (th < -1.6 ? 1 : 0.7);
    const tip = [b[0] + Math.cos(d) * (L + 0.9), b[1] + Math.sin(d) * (L + 0.9)];
    buds.push([b, tip, r]);
  }
  ctx.beginPath();
  for (const [b, tip, r] of buds) {
    const dx = tip[0] - b[0];
    const dy = tip[1] - b[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const r0 = r * 1.2;
    ctx.moveTo(b[0] + nx * r0, b[1] + ny * r0);
    ctx.lineTo(tip[0] + nx * r, tip[1] + ny * r);
    ctx.arc(tip[0], tip[1], r, Math.atan2(ny, nx), Math.atan2(ny, nx) - Math.PI, true);
    ctx.lineTo(b[0] - nx * r0, b[1] - ny * r0);
    ctx.arc(b[0], b[1], r0, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) - Math.PI, true);
    ctx.closePath();
  }
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = lit(a, SA.C.base);
  ctx.fill('nonzero');
  for (const [, tip, r] of buds) {
    glow(ctx, tip[0], tip[1], r * 1.6, SA.C.sh, 0.6);
    ell(ctx, tip[0] - r * 0.3, tip[1] - r * 0.3, r * 0.32, r * 0.24, -0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  }
}

// ---------- The palace livery: a coral-pink ribbon collar, a pearl at her throat ----------
function collarAt(sk, K) {
  const s0 = K.SJ[1] + 0.95;
  const gb = sk.girth(s0, 1);
  const gf = sk.girth(s0, -1);
  const top = [];
  const bot = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const off = mix(gb + 0.3, -(gf + 0.3), u);
    const sag = 0.5 * Math.sin(Math.PI * u) + 0.35 * u;
    top.push(sk.along(s0 - 0.7 + sag, off));
    bot.push(sk.along(s0 + 0.8 + sag, off));
  }
  const pearl = sk.along(s0 + 0.05 + 0.8, -gf * 0.72);
  const knot = sk.along(s0 + 0.1, gb + 0.15);
  return { top, bot, pearl, knot, s0 };
}
function smoothThrough(ctx, pts, first) {
  if (first) ctx.moveTo(...pts[0]);
  else ctx.lineTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mxp = (pts[i][0] + pts[i + 1][0]) / 2;
    const myp = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mxp, myp);
  }
  ctx.lineTo(...pts[pts.length - 1]);
}
function saCollar(ctx, a, mode, K) {
  const sk = a.fk;
  const c = collarAt(sk, K);
  const fwd = sk.fwdAt(c.s0);
  const dirAn = Math.atan2(fwd[1], fwd[0]);
  // the little bow at the back of her neck: two loops and a knot
  const backAn = dirAn - Math.PI / 2;
  const loopPts = [0.7, -0.7].map((dA) => {
    const an = backAn + dA;
    return [c.knot[0] + Math.cos(an) * 1.2, c.knot[1] + Math.sin(an) * 1.2, an];
  });
  ctx.beginPath();
  for (const [x, y, an] of loopPts) {
    ctx.moveTo(x + Math.cos(an) * 1.3, y + Math.sin(an) * 1.3);
    ctx.ellipse(x, y, 1.3, 0.85, an, 0, TAU);
  }
  smoothThrough(ctx, c.top, true);
  smoothThrough(ctx, [...c.bot].reverse(), false);
  ctx.closePath();
  ctx.moveTo(c.pearl[0] + 1.05, c.pearl[1]);
  ctx.arc(c.pearl[0], c.pearl[1], 1.05, 0, TAU);
  if (mode === 'line') return K.edge(ctx);
  // the band
  ctx.beginPath();
  smoothThrough(ctx, c.top, true);
  smoothThrough(ctx, [...c.bot].reverse(), false);
  ctx.closePath();
  ctx.fillStyle = lit(a, SA.rib.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  smoothThrough(ctx, c.top.map((p, i) => [mix(p[0], c.bot[i][0], 0.28), mix(p[1], c.bot[i][1], 0.28)]), true);
  ctx.lineWidth = 0.55;
  ctx.strokeStyle = lit(a, SA.rib.lt);
  ctx.stroke();
  for (const i of [2, 4, 6]) {
    ctx.beginPath();
    ctx.moveTo(...c.top[i]);
    ctx.lineTo(...c.bot[i]);
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = rgba(SA.rib.sh, 0.6);
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  smoothThrough(ctx, c.top, true);
  smoothThrough(ctx, [...c.bot].reverse(), false);
  ctx.closePath();
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = rgba(SA.rib.ink, 0.85);
  ctx.stroke();
  // the bow's loops and knot
  for (const [x, y, an] of loopPts) {
    ell(ctx, x, y, 1.3, 0.85, an);
    ctx.fillStyle = lit(a, SA.rib.base);
    ctx.fill();
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = rgba(SA.rib.ink, 0.85);
    ctx.stroke();
    ell(ctx, x + Math.cos(an) * 0.35, y + Math.sin(an) * 0.35, 0.55, 0.3, an);
    ctx.fillStyle = lit(a, SA.rib.sh, 0.7);
    ctx.fill();
  }
  ell(ctx, c.knot[0], c.knot[1], 0.6, 0.6);
  ctx.fillStyle = lit(a, SA.rib.sh);
  ctx.fill();
  // the pearl: round and glossy, a soft lilac shade, a white glint, a pink sheen
  const [px, py] = c.pearl;
  ell(ctx, px, py, 1.05, 1.05);
  ctx.fillStyle = lit(a, SA.pearl.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, px + 0.45, py + 0.5, 1.2, SA.pearl.sh, 0.9);
  glow(ctx, px - 0.2, py + 0.1, 0.8, '#ffd9e6', 0.5);
  ctx.restore();
  ell(ctx, px, py, 1.05, 1.05);
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = rgba(SA.pearl.ink, 0.9);
  ctx.stroke();
  ell(ctx, px - 0.38, py - 0.4, 0.32, 0.24, -0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

// ---------- Her bubble halo (it floats over her head on a spring of its own) ----------
// (once a frame, in the first part drawn: it follows a point over her head through the world, so
// her starts, stops, bobs and turns leave it trailing and settling; it tilts with her head)
function haloStep(a, K) {
  if (a.saHalo) return a.saHalo;
  const st = a.mo.rig;
  const sk = a.fk;
  const m = a.saM ?? {};
  const q = a.sa ?? {};
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const Hh = sk.head;
  const fl = K.left(a) ? -1 : 1;
  const ask = q.askew ?? 0;
  const tl = K.plus(Hh.centre, K.turned([0.3 - 1.7 * ask, -(Hh.ry + 4.4) + 1.1 * ask], Hh.hA * 0.7));
  const tx = (m.x ?? 0) + fl * tl[0];
  const ty = (m.y ?? 0) + tl[1];
  let h = st.ha;
  // (only a real jump, a teleport or a respawn, puts it straight back over her head)
  if (!h || Math.hypot(tx - h.x, ty - h.y) > 80) h = st.ha = { x: tx, y: ty, vx: 0, vy: 0, r: 0, vr: 0, ph: ((m.uid ?? 0) * 0.9) % TAU };
  const rGoal = Hh.hA * 0.55 + 0.42 * ask - clamp(h.vx * fl * 0.006, -0.3, 0.3);
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    const hh = dt / n;
    for (let i = 0; i < n; i++) {
      h.vx += (85 * (tx - h.x) - 10 * h.vx) * hh;
      h.vy += (85 * (ty - h.y) - 10 * h.vy) * hh;
      h.x += h.vx * hh;
      h.y += h.vy * hh;
      // (a soft leash: in a dive or a dash it trails a little and never more than a few px, eased
      // onto it with no corner, so it never comes away from her)
      const ex = h.x - tx;
      const ey = h.y - ty;
      const d = Math.hypot(ex, ey);
      if (d > 5) {
        const dd = 5 + 3.5 * Math.tanh((d - 5) / 3.5);
        h.x = tx + (ex / d) * dd;
        h.y = ty + (ey / d) * dd;
        const out = (h.vx * ex + h.vy * ey) / d;
        if (out > 0) {
          h.vx -= (out * ex) / d;
          h.vy -= (out * ey) / d;
        }
      }
      h.vr +=(110 * (rGoal - h.r) - 12 * h.vr) * hh;
      h.r += h.vr * hh;
    }
    if (!Number.isFinite(h.x + h.y + h.r)) Object.assign(h, { x: tx, y: ty, vx: 0, vy: 0, r: 0, vr: 0 });
    h.ph = (h.ph + dt * ((q.zz ?? 0) > 0.5 ? 0.12 : 0.4)) % TAU;
  }
  a.saHalo = { c: [(h.x - (m.x ?? 0)) * fl, h.y - (m.y ?? 0)], r: h.r, ph: h.ph };
  return a.saHalo;
}
// where each of the halo's bubbles is: [x, y, size, in front?]
function haloBubbles(a, H) {
  const t = a.t ?? 0;
  const R = 5.2;
  const cs = Math.cos(H.r);
  const sn = Math.sin(H.r);
  const out = [];
  const q = a.sa ?? {};
  for (let i = 0; i < HALO_N; i++) {
    const th = H.ph + (i / HALO_N) * TAU;
    const ox = Math.cos(th) * R;
    const oy = Math.sin(th) * R * 0.3 + Math.sin(t * 2.2 + i * 1.3) * 0.22;
    const x = H.c[0] + ox * cs - oy * sn;
    const y = H.c[1] + ox * sn + oy * cs;
    const s0 = 1.15 * (0.9 + 0.12 * Math.sin(th));
    let s = s0;
    if (i === GAP) s *= 1 - (a.mo.rig?.haMiss ?? 0);
    // (beaten: they pop one by one)
    if ((q.deadT ?? -1) >= 0) s *= q.deadT < 0.1 + i * 0.08 ? 1 : 0;
    out.push([x, y, s, Math.sin(th) > 0, i, s0]);
  }
  return out;
}
function haloRing(ctx, H, front, al) {
  ctx.save();
  ctx.translate(...H.c);
  ctx.rotate(H.r);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5.2, 1.56, 0, front ? 0 : Math.PI, front ? Math.PI : TAU);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = `rgba(255,246,214,${0.22 * al})`;
  ctx.stroke();
  ctx.lineWidth = 0.45;
  ctx.strokeStyle = `rgba(255,255,255,${0.6 * al})`;
  ctx.stroke();
  ctx.restore();
}
function haloBack(ctx, a, mode, K) {
  if (mode !== 'line') return;
  const H = haloStep(a, K);
  const q = a.sa ?? {};
  const al = (q.deadT ?? -1) >= 0 ? 1 - sstep(q.deadT / 0.7) : 1;
  glow(ctx, H.c[0], H.c[1], 7.5, '#fff6d8', 0.22 * al);
  haloRing(ctx, H, false, al);
  for (const [x, y, s, front] of haloBubbles(a, H)) if (!front) bubble(ctx, x, y, s, al);
}
function haloFront(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const H = haloStep(a, K);
  const q = a.sa ?? {};
  const al = (q.deadT ?? -1) >= 0 ? 1 - sstep(q.deadT / 0.7) : 1;
  haloRing(ctx, H, true, al);
  for (const [x, y, s, front] of haloBubbles(a, H)) if (front) bubble(ctx, x, y, s, al);
}

// ---------- Her face (in her head's frame: x forward, y down, 0 at its middle) ----------
const FX0 = 1.05;
const EY = 0.5;
const MX = FX0 + 0.3;
const MY = EY + 3.3;
// one tapering lash stroke along an ellipse from its inner corner over the top to its outer, ending
// in a round wing with one curled flick
function lashLine(ctx, x, y, ew, eh, o, ink, flick = true) {
  const thIn = o > 0 ? -Math.PI + 0.5 : -0.5;
  const thOut = o > 0 ? -0.16 : -Math.PI + 0.16;
  const N = 12;
  const outer = [];
  const inner = [];
  let wEnd = 0;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = mix(thIn, thOut, u);
    const wv = 0.1 + 0.46 * u ** 1.25;
    wEnd = wv;
    outer.push([x + (ew + wv) * Math.cos(th), y + (eh + wv) * Math.sin(th)]);
    inner.push([x + (ew - 0.06) * Math.cos(th), y + (eh - 0.06) * Math.sin(th)]);
  }
  ctx.beginPath();
  ctx.moveTo(...outer[0]);
  for (const p of outer) ctx.lineTo(...p);
  for (let i = inner.length - 1; i >= 0; i--) ctx.lineTo(...inner[i]);
  ctx.closePath();
  ctx.fillStyle = ink;
  ctx.fill();
  const ex = (outer[N][0] + inner[N][0]) / 2;
  const ey = (outer[N][1] + inner[N][1]) / 2;
  ell(ctx, ex, ey, wEnd * 0.55, wEnd * 0.55);
  ctx.fill();
  if (flick) stroke(ctx, [[ex, ey - wEnd * 0.2], [ex + o * 0.75, ey - 0.3], [ex + o * 0.95, ey - 0.95], [ex + o * 1.0, ey - 1.2], [ex + o * 0.82, ey - 1.3]], 0.34, ink);
}
// a closed eye: a soft tapered arc (up: happy; down: asleep, a blink), its outer end curling
function closedArc(ctx, x, y, ew, eh, o, ink, upArc) {
  const N = 10;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const th = upArc ? mix(o > 0 ? -Math.PI + 0.25 : -0.25, o > 0 ? -0.25 : -Math.PI + 0.25, u) : mix(o > 0 ? Math.PI - 0.25 : 0.25, o > 0 ? 0.25 : Math.PI - 0.25, u);
    pts.push([x + ew * Math.cos(th), y + (upArc ? eh * 0.5 : eh * 0.36) * Math.sin(th) + (upArc ? 0.45 : -0.1), 0.12 + 0.36 * u]);
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1] - pts[0][2] / 2);
  for (const [px, py, wv] of pts) ctx.lineTo(px, py - wv / 2);
  for (let i = N; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + pts[i][2] / 2);
  ctx.closePath();
  ctx.fillStyle = ink;
  ctx.fill();
  const [ex, ey, we] = pts[N];
  ell(ctx, ex, ey, we * 0.5, we * 0.5);
  ctx.fill();
  stroke(ctx, upArc ? [[ex, ey], [ex + o * 0.7, ey - 0.15], [ex + o * 0.85, ey - 0.8]] : [[ex, ey], [ex + o * 0.6, ey - 0.1], [ex + o * 0.75, ey - 0.65]], 0.32, ink);
}
function saEye(ctx, a, f, x, y, s, o) {
  const ew = 1.5 * s;
  const eh = 2.2;
  const ink = lit(a, SA.lash);
  const t = a.t ?? 0;
  const W = f.w;
  const openW = clamp(W.open * (1 - f.blink), 0, 1);
  if (openW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= openW;
    ctx.save();
    ell(ctx, x, y, ew, eh);
    ctx.fillStyle = lit(a, '#fdfdff');
    ctx.fill();
    ctx.clip();
    const ix = x + clamp(f.lookX, -1, 1) * 0.3 * s;
    const iy = y + 0.12 + clamp(f.lookY, -1, 1) * 0.32;
    const g = ctx.createLinearGradient(ix, iy - eh, ix, iy + eh);
    g.addColorStop(0, '#6f5fc3');
    g.addColorStop(0.5, '#6aa4dc');
    g.addColorStop(1, '#a6f1e6');
    ell(ctx, ix, iy, ew * 0.84, eh * 0.86);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 0.22;
    ctx.strokeStyle = 'rgba(80,70,160,0.75)';
    ctx.stroke();
    ell(ctx, ix, iy - 0.2, ew * 0.34, eh * 0.38);
    ctx.fillStyle = lit(a, '#40398a');
    ctx.fill();
    // (the lash line's soft shadow over the top of the iris)
    const sg = ctx.createLinearGradient(x, y - eh, x, y - eh * 0.25);
    sg.addColorStop(0, 'rgba(60,50,130,0.45)');
    sg.addColorStop(1, 'rgba(60,50,130,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(x - ew, y - eh, ew * 2, eh * 0.8);
    // a soft aqua light low in the iris
    glow(ctx, ix - ew * 0.1, iy + eh * 0.5, ew * 0.7, '#d6fff7', 0.55);
    ctx.restore();
    // the glints: a tiny star up front (a heart when she's in love), a round one low behind
    const gx = ix + o * 0 + ew * 0.3;
    const gy = iy - eh * 0.4;
    const st = 0.78 * f.star * (1 + 0.08 * Math.sin(t * 3 + x));
    sparkle(ctx, gx, gy, st * (1 - f.heart), '#ffffff', 'rgba(255,255,255,0)');
    if (f.heart > 0.02) softHeart(ctx, gx - 0.1, gy + 0.1, 0.55 * f.heart * f.star, f.heart);
    ell(ctx, ix - ew * 0.34, iy + eh * 0.42, 0.3, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    lashLine(ctx, x, y, ew, eh, o, ink);
    ctx.restore();
  }
  // the closed shapes, crossfading in
  const shut = (wv, fn) => {
    if (wv <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= clamp(wv, 0, 1);
    fn();
    ctx.restore();
  };
  shut(W.happy, () => closedArc(ctx, x, y, ew, eh, o, ink, true));
  shut(Math.max(W.sleep, W.open * f.blink), () => closedArc(ctx, x, y, ew, eh, o, ink, false));
  shut(W.squeeze, () => {
    // > <: pointing in toward her nose
    const i = -o;
    stroke(ctx, [[x - i * ew * 0.9, y - eh * 0.55], [x + i * ew * 0.1, y - eh * 0.2], [x + i * ew * 0.8, y + 0.05]], 0.5, ink);
    stroke(ctx, [[x + i * ew * 0.8, y + 0.05], [x + i * ew * 0.1, y + eh * 0.3], [x - i * ew * 0.9, y + eh * 0.6]], 0.5, ink);
  });
  shut(W.dizzy, () => {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const an = (i / 26) * TAU * 2 + t * 4 * o;
      const r = (i / 26) * ew * 0.95;
      const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.3];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
  });
}
function saFace(ctx, a, sk) {
  const f = a.saF;
  if (!f) return;
  // the blush: soft rosy cheeks
  glow(ctx, FX0 - 3.3, EY + 2.55, 2.0, '#ff9cc0', 0.55 * f.bl);
  glow(ctx, FX0 + 3.75, EY + 2.45, 1.45, '#ff9cc0', 0.45 * f.bl);
  if (f.bl > 1) {
    // (in love, a few soft blush strokes)
    ctx.save();
    ctx.globalAlpha *= clamp(f.bl - 1, 0, 0.4) * 2;
    for (const dx of [-0.5, 0.3, 1.1]) stroke(ctx, [[FX0 - 3.9 + dx, EY + 2.9], [FX0 - 3.6 + dx, EY + 2.5], [FX0 - 3.35 + dx, EY + 2.15]], 0.22, '#ff7fa8');
    ctx.restore();
  }
  // the eyes: the near one, its outer corner behind; the far one, a touch narrower, toward the front
  saEye(ctx, a, f, FX0 - 2.0, EY, 1.0, -1);
  saEye(ctx, a, f, FX0 + 2.25, EY - 0.05, 0.82, 1);
  // a tear for a sad moment
  if (f.tear > 0.05) {
    const x = FX0 - 2.9;
    const y = EY + 2.3 + ((a.t ?? 0) * 0.5 % 1) * 0.7;
    ctx.save();
    ctx.globalAlpha *= f.tear;
    ctx.beginPath();
    ctx.moveTo(x, y - 0.9);
    ctx.quadraticCurveTo(x + 0.6, y + 0.2, x, y + 0.6);
    ctx.quadraticCurveTo(x - 0.6, y + 0.2, x, y - 0.9);
    ctx.fillStyle = 'rgba(205,242,255,0.95)';
    ctx.fill();
    ctx.lineWidth = 0.2;
    ctx.strokeStyle = SA.bub;
    ctx.stroke();
    ctx.restore();
  }
  // round brows: short, full, round at both ends, tilted by her mood (+ knit, − worried)
  const brow = (x, s, o) => {
    const by = EY - 2.2 - 1.15 - f.by * 0.55;
    const inX = x - o * 0.75 * s;
    const outX = x + o * 0.8 * s;
    const yi = by + f.bt * 0.5;
    const yo = by - f.bt * 0.22;
    stroke(ctx, [[inX, yi], [(inX + outX) / 2, Math.min(yi, yo) - 0.28], [outX, yo]], 0.62, lit(a, SA.brow));
  };
  brow(FX0 - 2.0, 1, -1);
  brow(FX0 + 2.25, 0.82, 1);
  // the mouth: from its width, smile, openness and roundness, so every change eases
  const w = f.mw * 1.15;
  const sm = f.ms;
  const op = f.mo;
  const r = f.mr;
  const openK = sstep((op - 0.05) / 0.12);
  const col = lit(a, SA.mouth);
  if (openK < 0.99) {
    ctx.save();
    ctx.globalAlpha *= 1 - openK;
    const cy = MY - sm * 0.42;
    // (one smooth stroke, its corners curling up with the smile; a smirk lifts one corner more)
    stroke(ctx, [[MX - w, cy + f.smirk * 0.12], [MX, MY + sm * 0.5], [MX + w, cy - f.smirk * 0.3]], 0.42, col);
    ctx.restore();
  }
  if (openK > 0.01) {
    ctx.save();
    ctx.globalAlpha *= openK;
    const ww = mix(w, 0.4 + 0.28 * op, r);
    const cyc = mix(MY - sm * 0.42, MY + op * 0.35, r);
    const upY = mix(MY - sm * 0.15 + 0.1, cyc - op * 0.95, r);
    const loY = mix(MY + sm * 0.4 + op * 1.5, cyc + op * 1.0, r);
    const pts = [[MX - ww, cyc + f.smirk * 0.1], [MX - ww * 0.62, mix(upY, cyc, 0.25)], [MX, upY], [MX + ww * 0.62, mix(upY, cyc, 0.25) - f.smirk * 0.15], [MX + ww, cyc - f.smirk * 0.3], [MX + ww * 0.62, mix(loY, cyc, 0.3)], [MX, loY], [MX - ww * 0.62, mix(loY, cyc, 0.3)]];
    ctx.beginPath();
    loopSmooth(ctx, pts);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, MX, loY - 0.1, ww * 0.7, Math.max(0.2, (loY - upY) * 0.32));
    ctx.fillStyle = lit(a, '#f08fb2');
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}
function loopSmooth(ctx, pts) {
  const k = pts.length;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < k; i++) {
    const a0 = pts[(i + k - 1) % k];
    const a1 = pts[i];
    const a2 = pts[(i + 1) % k];
    const a3 = pts[(i + 2) % k];
    ctx.bezierCurveTo(a1[0] + (a2[0] - a0[0]) / 6, a1[1] + (a2[1] - a0[1]) / 6, a2[0] - (a3[0] - a1[0]) / 6, a2[1] - (a3[1] - a1[1]) / 6, a2[0], a2[1]);
  }
  ctx.closePath();
}

// ---------- Where things are, in the rig's frame ----------
const headPt = (sk, x, y) => {
  const H = sk.head;
  const c = Math.cos(H.hA);
  const s = Math.sin(H.hA);
  return [H.centre[0] + x * c - y * s, H.centre[1] + x * s + y * c];
};
const mouthPt = (sk) => headPt(sk, MX, MY + 0.3);
const wingTip = (f) => [f.root[0] + Math.cos(f.ang) * f.len, f.root[1] + Math.sin(f.ang) * f.len];
function saSpot(sk, what) {
  if (what === 'mouth') return mouthPt(sk);
  if (what === 'head') return headPt(sk, sk.head.rx * 0.9, 0);
  if (what === 'top') return headPt(sk, 0, -sk.head.ry);
  return null;
}
// (drawing something that reads one way round, a note, a "?", unmirrored however she faces)
function upright(ctx, a, K, x, y, fn) {
  ctx.save();
  ctx.translate(x, y);
  if (K.left(a)) ctx.scale(-1, 1);
  fn();
  ctx.restore();
}

// ---------- Her effects and marks ----------
// a soft swoosh: a crescent round the wing's root along its swing, a white core, an aqua edge
function swoosh(ctx, root, r, a0, a1, u) {
  if (u <= 0 || u >= 1) return;
  const span = a1 - a0;
  const e = 1 - (1 - u) ** 2;
  const head = a0 + span * Math.min(1, e * 1.25);
  const tail = a0 + span * Math.max(0, e * 1.25 - 0.55);
  const al = 1 - sstep((u - 0.45) / 0.55);
  const N = 14;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= N; i++) {
    const v = i / N;
    const an = mix(tail, head, v);
    const th = Math.sin(Math.PI * Math.min(1, v * 1.1)) * 2.2;
    outer.push([root[0] + Math.cos(an) * (r + th * 0.5), root[1] + Math.sin(an) * (r + th * 0.5)]);
    inner.push([root[0] + Math.cos(an) * (r - th), root[1] + Math.sin(an) * (r - th)]);
  }
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(...outer[0]);
  for (const p of outer) ctx.lineTo(...p);
  for (let i = N; i >= 0; i--) ctx.lineTo(...inner[i]);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = 'rgba(110,190,205,0.85)';
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,250,244,0.85)';
  ctx.fill();
  ctx.beginPath();
  for (let i = 3; i <= N; i++) {
    const v = i / N;
    const an = mix(tail, head, v);
    const p = [root[0] + Math.cos(an) * (r - 0.3), root[1] + Math.sin(an) * (r - 0.3)];
    if (i === 3) ctx.moveTo(...p);
    else ctx.lineTo(...p);
  }
  ctx.lineWidth = 0.6;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}
function zee(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-1.5, -1.5);
  ctx.quadraticCurveTo(0, -1.8, 1.5, -1.5);
  ctx.quadraticCurveTo(0, 0, -1.5, 1.5);
  ctx.quadraticCurveTo(0, 1.25, 1.6, 1.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = '#7f9fd0';
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = '#effffc';
  ctx.stroke();
  ctx.restore();
}
function sweatDrop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2);
  ctx.bezierCurveTo(r * 0.4, -r * 1.4, r * 1.05, -r * 0.6, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.6, -r * 0.4, -r * 1.4, 0, -r * 2);
  ctx.closePath();
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = SA.bub;
  ctx.stroke();
  ctx.fillStyle = '#d4f4ff';
  ctx.fill();
  ell(ctx, -r * 0.35, -r * 0.4, r * 0.26, r * 0.4, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// her "!" and "?": a round water bubble popping in, the mark inside
function markBubble(ctx, a, K, x, y, mark, e, dur) {
  const kk = backOut(e / 0.28) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (kk <= 0.02) return;
  upright(ctx, a, K, x, y, () => {
    ctx.scale(kk, kk);
    bubble(ctx, 0, 0, 4.1);
    ctx.lineCap = 'round';
    const col = mark === '!' ? '#ef6b8b' : '#8f78d2';
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    if (mark === '!') {
      ctx.moveTo(0, -2.3);
      ctx.lineTo(0, 0.5);
    } else {
      ctx.moveTo(-1.3, -1.3);
      ctx.quadraticCurveTo(-1.0, -2.9, 0.4, -2.75);
      ctx.quadraticCurveTo(1.7, -2.4, 1.2, -1.1);
      ctx.quadraticCurveTo(0.35, -0.5, 0.2, 0.5);
    }
    ctx.stroke();
    ell(ctx, mark === '!' ? 0 : 0.2, 2.1, 0.72, 0.72);
    ctx.fill();
  });
}

function saFx(ctx, m, a, K) {
  const sk = a.fk;
  const q = a.sa;
  if (!sk || !q) return;
  const t = a.t ?? 0;
  const alive = m.hp > 0;
  const mouth = mouthPt(sk);
  const top = headPt(sk, 0.3, -sk.head.ry);
  const H = a.saHalo ?? haloStep(a, K);
  ctx.save();
  // (fading with her as the game fades her out)
  ctx.globalAlpha *= clamp(a.alpha ?? 1, 0, 1);
  if (ctx.globalAlpha <= 0.01) {
    ctx.restore();
    return;
  }
  // her heart shining through, when it glows bright (through clasped wings too)
  const hb = a.saHB ?? { b: 0, glow: 0 };
  if (hb.glow > 0.6) {
    const hp = sk.along(K.SJ[2] + 1.1, -sk.belly[2] * 0.4);
    glow(ctx, hp[0], hp[1], 5 + hb.b * 1.5, SA.heart.glow, (hb.glow - 0.6) * 0.6 + hb.b * 0.12);
  }
  // now and then at rest, a little bubble drifts up from her mouth
  if (alive && !a.fsMove && q.singT < 0 && q.zz < 0.5) {
    const c = (t + ((m.uid ?? 0) % 5) * 1.7) % 7.3;
    if (c < 2.4) {
      const u = c / 2.4;
      bubble(ctx, mouth[0] + 4.2 + u * 2.5 + Math.sin(u * 9) * 0.5, mouth[1] - 1 - u * 11, 0.65 + u * 0.35, Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.9);
    }
  }
  // ----- the act's -----
  // the high note: soft round notes rising off her one by one, swaying; smaller as her breath runs out
  if (q.singT >= 0) {
    const n = Math.floor(q.singT / 0.42);
    for (let i = Math.max(0, n - 4); i <= n; i++) {
      const age = q.singT - i * 0.42;
      if (age < 0 || age > 1.7) continue;
      const u = age / 1.7;
      const tired = i * 0.42 > 3.3 ? 0.65 : 1;
      const x = mouth[0] + 5 + u * 5 + Math.sin(u * 6 + i) * 1.4;
      const y = mouth[1] - 1 - u * 13;
      upright(ctx, a, K, x, y, () => note(ctx, 0, 0, (0.55 + 0.2 * Math.sin(Math.PI * u)) * tired, Math.sin(Math.PI * Math.min(1, u * 1.15)) * q.singW, i, Math.sin(u * 5 + i) * 0.2));
    }
    // a soft shine off her open mouth as she holds it
    sparkle(ctx, mouth[0] + 2.2, mouth[1] - 1.2, (0.9 + 0.3 * Math.sin(t * 12)) * q.singW * (q.singT < 3.3 ? 1 : 0.6), '#ffffff', '#9fd8e0');
  }
  // the breath in: a few bubbles drawn in toward her mouth
  if (q.inhale > 0.05) {
    for (let i = 0; i < 3; i++) {
      const u = ((t * 1.6 + i / 3) % 1);
      const d = (1 - u) * 7;
      const an = -0.4 + i * 0.4;
      bubble(ctx, mouth[0] + Math.cos(an) * d + 0.8, mouth[1] + Math.sin(an) * d, 0.5 + 0.3 * (1 - u), q.inhale * Math.sin(Math.PI * u));
    }
  }
  // the cough: a bubble pops out, wobbles up and pops
  if (q.coughT >= 0) {
    const u = q.coughT;
    const x = mouth[0] + 3 + Math.min(u, 0.4) * 8 + Math.sin(u * 6) * 0.8;
    const y = mouth[1] - 1 - u * 6;
    if (u < 1.6) bubble(ctx, x, y, 1.3 * backOut(u / 0.25), 1);
    else pop(ctx, x, y, 1.3, (u - 1.6) / 0.35);
  }
  // humming: two tiny notes
  if (q.hum >= 0) {
    for (let i = 0; i < 2; i++) {
      const u = (q.hum - i * 0.55) / 1.0;
      if (u < 0 || u > 1) continue;
      upright(ctx, a, K, mouth[0] + 5 + u * 4, mouth[1] - 1 - u * 7, () => note(ctx, 0, 0, 0.42, Math.sin(Math.PI * u) * q.calm, i + 1, 0.15));
    }
  }
  // halo trouble: the pop, and the new bubble blown up into the gap
  if (q.popT >= 0) {
    const b = haloBubbles(a, H)[GAP];
    pop(ctx, b[0], b[1], 1.2, q.popT / 0.45);
  }
  if (q.newT >= 0 && q.newT < 1.45) {
    const b = haloBubbles(a, H)[GAP];
    const grow = q.newT < 0.6 ? 0.3 + 0.7 * sstep(q.newT / 0.6) : 1;
    const fly = sstep((q.newT - 0.6) / 0.85);
    // (from her lips, out and up in front of her face on a curve, into its place)
    const p0 = [mouth[0] + 2.4, mouth[1] + 0.3];
    const pc = [mouth[0] + 9, mouth[1] - 9];
    const x = (1 - fly) ** 2 * p0[0] + 2 * fly * (1 - fly) * pc[0] + fly * fly * b[0];
    const y = (1 - fly) ** 2 * p0[1] + 2 * fly * (1 - fly) * pc[1] + fly * fly * b[1];
    bubble(ctx, x, y, mix(1.15 * grow, b[5], fly), 1);
    if (fly > 0.9) sparkle(ctx, b[0] + 1.4, b[1] - 1.2, 1.1 * Math.sin(Math.PI * (fly - 0.9) * 10), '#fff6c8', SA.bub);
  }
  // heart flutter: sparkles round her as she twirls, then little hearts rising
  if (q.twirlT >= 0) {
    const u = q.twirlT / 2.1;
    const c = sk.along(K.SJ[2], 0);
    for (let i = 0; i < 4; i++) {
      const an = u * 11 + (i / 4) * TAU;
      sparkle(ctx, c[0] + Math.cos(an) * 9, c[1] + Math.sin(an) * 3 - u * 5 + i * 0.6, 1.2 * Math.sin(Math.PI * clamp(u, 0, 1)), i % 2 ? '#ffe3ec' : '#ffffff', i % 2 ? SA.heart.ink : SA.bub);
    }
  }
  if (q.heartsT >= 0) {
    const hp = sk.along(K.SJ[2] + 1.1, -sk.belly[2] * 0.4);
    for (let i = 0; i < 3; i++) {
      const u = (q.heartsT - i * 0.5) / 1.5;
      if (u < 0 || u > 1) continue;
      softHeart(ctx, hp[0] + 7 + u * 3 + Math.sin(u * 7 + i) * 1.2, hp[1] - 3 - u * 14, 0.9 * backOut(u / 0.2), 1 - sstep((u - 0.7) / 0.3));
    }
  }
  // the bow: a little burst of sparkles before her
  if (q.bowT >= 0) {
    const u = q.bowT / 1.15;
    const c = headPt(sk, sk.head.rx + 3, 3);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI * 0.45 + (i / 4) * Math.PI * 0.75;
      const d = 2 + (1 - (1 - u) ** 2) * 8;
      sparkle(ctx, c[0] + Math.cos(an) * d, c[1] + Math.sin(an) * d * 0.8, (i % 2 ? 0.9 : 1.4) * Math.sin(Math.PI * clamp(u, 0, 1)), i % 2 ? '#fff6c8' : '#ffffff', SA.bub);
    }
  }
  // ----- the moves' -----
  const mv = a.fsMove;
  const name = mv ? NAMES.get(mv.mv) : null;
  const mt = mv?.t ?? 0;
  if (name === 'slap' && alive) {
    const near = sk.pecs.near;
    const far = sk.pecs.far;
    // (the wind-up: a glint at the cocked wing's tip)
    if (mt < 0) sparkle(ctx, ...wingTip(near), 1.4 * sstep((mt + 0.35) / 0.3), '#ffffff', SA.bub);
    for (const [s0, side] of MOVES.slap.swoosh) {
      const f = side === 'near' ? near : far;
      const u = (mt - s0 + 0.03) / 0.3;
      const fw = Math.atan2(sk.fwd[1], sk.fwd[0]);
      // (in front of her, below her chin: the wing itself goes over behind her head)
      const r = f.len * 1.15;
      swoosh(ctx, f.root, r, fw + 0.95, fw + 2.05, u);
      // the hit: a soft splash where the slap lands
      const v = (mt - s0) / 0.4;
      if (v > 0 && v < 1) {
        const hx = f.root[0] + Math.cos(fw + 1.6) * r + 2;
        const hy = f.root[1] + Math.sin(fw + 1.6) * r;
        const e = 1 - (1 - v) ** 2;
        sparkle(ctx, hx, hy, 2.4 * (1 - v), '#ffffff', SA.bub);
        for (let i = 0; i < 3; i++) bubble(ctx, hx + 1 + e * (3 + i * 2), hy - 1 + (i - 1) * 2.2 * e - e * 2, 0.6 + i * 0.25, 1 - v);
      }
    }
  }
  if (name === 'swoop' && alive) {
    const hp = headPt(sk, sk.head.rx * 0.95, 0.5);
    // (the wind-up: a soft heart swelling over her as she rises)
    if (mt < 0) {
      const g = sstep((mt + 0.35) / 0.3);
      softHeart(ctx, top[0] + 1, top[1] - 9, 1.4 * g, g);
    }
    // the dive: a trail of bubbles behind her
    if (mt >= 0 && mt < 0.5) {
      for (let i = 0; i < 4; i++) {
        const u = (mt - i * 0.03) / 0.45;
        if (u < 0 || u > 1) continue;
        const tp = sk.tipPt;
        bubble(ctx, tp[0] - 2 - i * 2.5 - u * 3, tp[1] - 4 - i * 2 - u * 4, 0.6 + (i % 2) * 0.4, 1 - u);
      }
    }
    // the hit: a burst of soft hearts, a ring, sparkles
    const u = (mt - MOVES.swoop.burst) / 0.55;
    if (u > 0 && u < 1) {
      const e = 1 - (1 - u) ** 2;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.9;
      ctx.beginPath();
      ctx.arc(hp[0] + 2, hp[1], 2 + e * 9, 0, TAU);
      ctx.lineWidth = 1.4 * (1 - u);
      ctx.strokeStyle = '#ffd3de';
      ctx.stroke();
      ctx.lineWidth = 0.5 * (1 - u);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 6; i++) {
        const an = (i / 6) * TAU + 0.3;
        const d = 3 + e * 9;
        softHeart(ctx, hp[0] + 2 + Math.cos(an) * d, hp[1] + Math.sin(an) * d - e * 2, (0.75 + (i % 2) * 0.3) * (1 - u * 0.4), 1 - sstep((u - 0.55) / 0.45), Math.cos(an) * 0.3);
      }
      sparkle(ctx, hp[0] + 2, hp[1], 3 * (1 - u), '#fff6c8', SA.heart.ink);
    }
  }
  if (name === 'highC' && alive) {
    // the breath in, and a gleam on her pearl
    if (mt < 0) sparkle(ctx, ...collarAt(sk, K).pearl, 1.3 * sstep((mt + 0.35) / 0.3), '#ffffff', SA.pearl.ink);
    // the blast: sound rings pushing out in front, a ring of notes riding them
    const u = (mt - MOVES.highC.blast) / 0.7;
    if (u > 0 && u < 1) {
      const fw = Math.atan2(sk.fwd[1], sk.fwd[0]) + Math.PI / 2;
      for (let i = 0; i < 3; i++) {
        const v = clamp(u * 1.3 - i * 0.15, 0, 1);
        if (v <= 0 || v >= 1) continue;
        const r = 3 + (1 - (1 - v) ** 2) * 24;
        ctx.save();
        ctx.globalAlpha *= (1 - v) * 0.9;
        ctx.beginPath();
        ctx.arc(mouth[0] + 2.5, mouth[1] + 0.5, r, fw - 0.7, fw + 0.7);
        ctx.lineCap = 'round';
        ctx.lineWidth = 2.0 * (1 - v * 0.5);
        ctx.strokeStyle = 'rgba(190,176,240,0.85)';
        ctx.stroke();
        ctx.lineWidth = 0.8 * (1 - v * 0.5);
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();
      }
      for (let i = 0; i < 5; i++) {
        const an = fw - 0.6 + (i / 4) * 1.2;
        const d = 7 + (1 - (1 - u) ** 2) * 18;
        upright(ctx, a, K, mouth[0] + Math.cos(an) * d, mouth[1] + Math.sin(an) * d, () => note(ctx, 0, 0, 0.6, 1 - sstep((u - 0.6) / 0.4), i, Math.sin(u * 8 + i) * 0.25));
      }
    }
  }
  // ----- her marks, on her head (over the halo) -----
  const mk = [H.c[0] + 1.5, H.c[1] - 6.5];
  if (q.bang >= 0 && q.bang < 1.1 && alive) markBubble(ctx, a, K, mk[0], mk[1], '!', q.bang, 1.1);
  else if (q.huh >= 0 && q.huh < 1.4 && alive) markBubble(ctx, a, K, mk[0], mk[1], '?', q.huh, 1.4);
  // a smug little trill: one note, a wavy trill beside it
  if (q.gloatT >= 0 && q.gloatT < 1.1) {
    const e = q.gloatT;
    const al = win(e, 0, 0.12, 0.8, 1.1);
    const x = mouth[0] + 6.5 + e * 3;
    const y = mouth[1] - 2 - e * 7;
    upright(ctx, a, K, x, y, () => {
      note(ctx, 0, 0, 0.75, al, 0, Math.sin(e * 14) * 0.18);
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const xx = 2.2 + i * 0.32;
        const yy = -2.6 + Math.sin(i * 1.2 + e * 18) * 0.5;
        if (i) ctx.lineTo(xx, yy);
        else ctx.moveTo(xx, yy);
      }
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = '#8676cc';
      ctx.stroke();
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = '#e4dcff';
      ctx.stroke();
      ctx.restore();
    });
  }
  // hurt: a few bubbles knocked off her and a little star of a bump
  if (q.hurtT >= 0 && q.hurtT < 0.55) {
    const e = q.hurtT / 0.55;
    const c = headPt(sk, -sk.head.rx * 0.4, -sk.head.ry * 0.7);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI * 0.85 + i * 0.45;
      bubble(ctx, c[0] + Math.cos(an) * (2 + e * 6), c[1] + Math.sin(an) * (2 + e * 5) + e * e * 3, 0.55 + i * 0.2, 1 - e);
    }
    sparkle(ctx, c[0] - 1, c[1] - 1, 2.2 * Math.sin(Math.PI * Math.min(1, e * 1.6)), '#ffffff', '#e0849c');
  }
  // sweat, when she's low (or sheepish)
  const f = a.saF;
  if (f && f.sweat > 0.05 && alive) {
    const u = ((a.now ?? t) * 0.8) % 1;
    const p = headPt(sk, -sk.head.rx * 0.78, -sk.head.ry * 0.25 + sstep(u) * 2.2);
    sweatDrop(ctx, p[0], p[1], 0.85, f.sweat * Math.sin(Math.PI * u));
  }
  // asleep: soft z's drifting up off her
  if (q.zz > 0.3 && alive) {
    for (let i = 0; i < 2; i++) {
      const u = ((a.now ?? t) * 0.42 + i * 0.5) % 1;
      upright(ctx, a, K, top[0] + 3 + u * 5 + Math.sin(u * 5) * 1.2, top[1] - 4 - u * 9, () => zee(ctx, 0, 0, 0.5 + u * 0.45, q.zz * Math.sin(Math.PI * u)));
    }
  }
  // beaten: little stars circling her head
  if (!alive && (q.deadT ?? 0) < 1.6) {
    const al = 1 - sstep(((q.deadT ?? 0) - 1.1) / 0.5);
    for (let i = 0; i < 3; i++) {
      const an = (a.now ?? t) * 5 + (i / 3) * TAU;
      sparkle(ctx, top[0] + Math.cos(an) * 5, top[1] - 1.5 + Math.sin(an) * 1.6, 1.3, '#fff3b8', '#d6a85c', al);
    }
  }
  ctx.restore();
}

// ---------- Her dress on the fish base ----------
const look = {
  P: {
    name: 'Sea Angel',
    spine: [[0.8, -11.0, 2.4, 2.4], [0.3, -8.0, 2.6, 2.9], [0, -4.6, 4.4, 4.8], [0, -0.6, 5.2, 5.4], [-0.3, 3.0, 4.6, 4.6], [-0.7, 5.9, 3.5, 3.4], [-1.0, 8.3, 2.3, 2.2], [-1.1, 10.1, 1.35, 1.3]],
    pivot: 3,
    tailFrom: 5,
    head: { at: [0.5, -3.7], rx: 6.6, ry: 6.0, snout: 0, snoutLen: 0, w0: 0, w1: 0, crown: -90, bump: 0, neckGap: 0.85 },
    pec: { at: [5.7, 2.1], len: 10, w: 6.4, farLen: 0.9, ang: -90, scull: 0, tuck: -165, out: -100 },
    swim: { amp: 5, lag: 0.7, beats: 2.2, idle: 0.3, scull: 1, paddle: 0, recoil: 2, bob: 0.4 },
    speed: 50,
    lean: 14,
    hover: 3.5,
    moveTilt: 0,
    turn: [0.12, 0.34, 22],
    moves: POOL,
  },
  C: SA.C,
  CW: SA.CW,
  ink: SA.ink,
  box: [84, 100],
  size: [24, 38],
  quietIdle: true,
  tailSway: { k: 60, c: 7, gain: 0.018, lag: 0.35 },
  kick: { pitch: -40, bend: 120 },
  moves: MOVES,
  pleased: 'trill',
  pick: (m, a, st) => (typeof m.move === 'string' && MOVES[m.move] ? m.move : (m.def.moves ?? POOL)[(st.fsN ?? 0) % (m.def.moves ?? POOL).length]),
  pose: saPose,
  pecGoal: saPecGoal,
  pecPts: saWingPts,
  pecPaint: saWingPaint,
  paint: saPaint,
  headPaint: saHeadPaint,
  face: saFace,
  spot: saSpot,
  under: { pecF: haloBack, head: saBuds },
  over: { body: saCollar, head: haloFront },
  fx: saFx,
};

const D = dressedFish(look);
const rig = D.art.rig;
const draw0 = rig.draw;
// (her twirl: clean mirror flips at each half turn, shown at once, with none of the base's swish)
rig.draw = (ctx, m, a) => {
  const st = (a.mo.rig ??= {});
  const flip0 = a.flip;
  const tw = Boolean(st.saTwirl) && m.hp > 0;
  if (tw) a.flip = !a.flip;
  if (tw !== Boolean(st.saTwWas) && st.fsShown !== undefined) {
    st.fsShown = a.flip;
    st.fsTt = null;
  }
  st.saTwWas = tw;
  draw0(ctx, m, a);
  a.flip = flip0;
  // (where her head was drawn, in the rig's frame, for the dev check pages' close-ups)
  st.saHeadAt = a.fk?.head?.centre;
};
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over her head are
// her own, drawn here in her own style)
export const SEA_ANGEL_ART = { ...D.art, rig, noHop: true, ownEmotes: true };
export const SEA_ANGEL = { art: SEA_ANGEL_ART, w: D.w, h: D.h, speed: D.speed, bodyH: D.bodyH };
// (her dress, for the dev tools that watch her parts frame by frame)
export const SEA_ANGEL_LOOK = look;
