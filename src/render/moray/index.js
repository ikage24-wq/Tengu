// Murri and Ena, the Twin Morays (2026-11-26, remade from scratch: the Moray Grotto's pair, level 22):
// two chibi moray eel sisters who have lived in the grotto's burrows since the palace sank, and have
// never once had visitors. A big round head on a long soft body, a long low frilled fin down the
// whole back, a little round tail fin, tiny pectorals. They move on their own copy of the fish base
// (eelbase.js), dressed here; everything else is drawn here from scratch.
//   Murri  the big sister: jade green, a mint belly, a deeper jade stripe down her back under the
//          frill; a little coral crown with a pearl, set a touch crooked (she says it's on purpose).
//          Bossy and smug: oval jade eyes with a soft rounded-diamond glint, short thick round brows,
//          a sly closed smile.
//   Ena    the little sister: honey gold, a peach-cream belly, a coral frill; two frilly round cheek
//          fins and a pearl on a coral ribbon round her neck. Giggly and sweet: round amber eyes with
//          three little bubbles for glints, thin arched brows, an open giggle.
//   both   a moray's mouth along the snout that opens and closes as they breathe (soft round felt
//          "teeth" when it opens wide for a chomp, never points).
//   idle   an act in four pieces, each whole in itself, the next that fits the time left before she
//          moves on (data `rest`, m.restUntil): the gulp (slow moray breaths, a bubble ring), the
//          primp (Murri straightens her crown; Ena fluffs her frills), peekaboo (she ducks behind her
//          own coiled tail and pops up with a grin) and the loop (a happy loop-the-loop).
//   fight  (world/aquarium.js) the casts' holds and strikes: Chomp Chomp! (head drawn back, jaws wide,
//          then two snapping bites), Sister Gossip (cheeks puffed, a whisper), Peekaboo! (from her
//          burrow), Sister's Pick (wriggling ready in her burrow, then the lunge along the floor), Twin
//          Twirl (coiled, then a spin), Grotto Squabble (thrashing and huffing); in a burrow
//          (m.burrowed) only her head and neck show in the hole's mouth; tangled with her sister
//          (m.tangle) she is curled in a knot, seeing stars.
//   scene  (data/scenes.js aquarium_moray) hide, peekaboo, emerge, loop, boop.
// Every effect and mark is drawn here in their own soft style (bubbles with an aqua rim, the game's
// curvy sparkles, her own colour).
import { dressedEel } from './eelbase.js';
import { MURRI_C, ENA_C } from './looks.js';

// ---------- Little helpers ----------
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
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
  if (al <= 0.005 || r <= 0.05) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, al));
  g.addColorStop(1, rgba(hex, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function sparkle(ctx, x, y, k, fill) {
  if (k <= 0.03) return;
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
  for (let i = 1; i + 1 < pts.length; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
  if (pts.length % 2 === 0) ctx.lineTo(...pts[pts.length - 1]);
  ctx.stroke();
}
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];

// ---------- Their colours ----------
const TW = {
  murri: {
    C: { lt: '#e6faee', base: '#8fdcb0', sh: '#62bd92', deep: '#3f9a76' },
    back: '#4fae84', stripe: '#3d9a74', belly: '#e9fbef', bellySh: '#c4ead6',
    CF: { lt: '#d6f6e4', base: '#7fd0a4', sh: '#58b48a', deep: '#3a9472' },
    CS: { lt: '#e2f8ea', base: '#9bdcb8', sh: '#6cc09a', deep: '#47a07e' },
    inks: { body: ['#2f8466', '#7cb8a0'], fin: '#3a8c6e', sail: '#3a8c6e' },
    ink: '#2f8466',
    iris: ['#185c46', '#3faa80', '#b4f2d4'], pupil: '#123e31', lash: '#24503f', brow: '#4f957a',
    blush: '#ff9fb4', line: '#2c5e4c', mouth: '#a8506c', tongue: '#f6a6b8',
    mark: { edge: '#4fae84', glyph: '#2c7a5e', fill: 'rgba(236,252,244,0.96)' },
  },
  ena: {
    C: { lt: '#fff8de', base: '#ffd57a', sh: '#f4b552', deep: '#da8f38' },
    back: '#f6b04a', stripe: '#ee9c3e', belly: '#fff4dc', bellySh: '#f8dcb4',
    CF: { lt: '#ffe2d4', base: '#ffad8e', sh: '#f08c72', deep: '#d46e5c' },
    CS: { lt: '#ffe6d8', base: '#ffb496', sh: '#f39478', deep: '#d87660' },
    inks: { body: ['#c77a2c', '#d4a874'], fin: '#c9685a', sail: '#c9685a' },
    ink: '#c77a2c',
    iris: ['#6a3410', '#d0842a', '#ffe2a2'], pupil: '#43200a', lash: '#5a2e14', brow: '#c98a52',
    blush: '#ff8fa4', line: '#7a3e1c', mouth: '#b04c64', tongue: '#ffa8b4',
    mark: { edge: '#f0a040', glyph: '#b86a24', fill: 'rgba(255,250,236,0.96)' },
  },
};
const CORAL = { lt: '#ffd6d6', base: '#ff9ea4', sh: '#ea7c8a', ink: '#c9607a' };
const PEARL = { base: '#fbf6ef', sh: '#e2d6ec', ink: '#ad9fc6' };
const BUB = { edge: '#7cc4d8', fill: 'rgba(226,246,255,0.55)' };

// ---------- Their moves (x, rise in body heights; angles in degrees; d1 the jaw open, d2 cheeks puffed,
// d3 how far she's coiled down behind her tail) ----------
// (in a burrow: her body down the hole, upright; only her head and neck up in its mouth, the head
// nodded forward to look out)
const HIDE = { rise: -1.7, pitch: -80, bend: 8, head: 30, fins: -0.6, dorsal: -0.8 };
const PEEK_UP = { rise: -0.12, pitch: -80, bend: 8, head: 34, fins: 0.4, dorsal: 0.6 };
const MOVES = {
  // a plain swing at the tank: a quick snap
  nip: {
    anticT: 0.3,
    keys: [
      [0, { x: -0.08, pitch: -10, head: -10, d1: 0.8, dorsal: 0.6, fins: 0.5 }],
      [0.07, { x: 0.24, pitch: 6, head: 9, d1: 0, thrash: 0.5, dorsal: 0.3 }, 'out'],
      [0.24, { x: 0.12, head: 2, d1: 0.1 }, 'io'],
      [0.6, {}, 'io'],
    ],
    snap: [0.07],
  },
  // Chomp Chomp!: the head drawn far back, jaws wide, then two snapping bites
  chomp: {
    anticT: 0.5,
    keys: [
      [0, { x: -0.16, pitch: -18, head: -16, d1: 1, dorsal: 1, fins: 0.8, bend: -14 }],
      [0.08, { x: 0.32, pitch: 8, head: 10, d1: 0, thrash: 0.8, dorsal: 0.5 }, 'out'],
      [0.17, { x: 0.27, pitch: -2, head: -6, d1: 0.75 }, 'io'],
      [0.25, { x: 0.33, pitch: 7, head: 9, d1: 0 }, 'out'],
      [0.55, { x: 0.1, head: 0, d1: 0.05, thrash: 0 }, 'io'],
      [0.95, {}, 'io'],
    ],
    snap: [0.08, 0.25],
  },
  // Sister Gossip: cheeks puffed full of whispers, then out it all comes
  gossip: {
    anticT: 0.45,
    keys: [
      [0, { pitch: -8, head: -10, d1: 0.15, d2: 1, fins: 0.6 }],
      [0.1, { pitch: 5, head: 6, d1: 0.55, d2: 0, thrash: 0.3 }, 'out'],
      [0.45, { pitch: 2, head: 2, d1: 0.2 }, 'io'],
      [0.85, {}, 'io'],
    ],
    whisper: [0.1],
  },
  // Peekaboo!: up out of the burrow's mouth with a snap
  peek: {
    anticT: 0.45,
    keys: [
      [0, { ...HIDE, rise: -0.4, d1: 0.3 }],
      [0.1, { ...PEEK_UP, rise: 0.4, d1: 1, dorsal: 1 }, 'out'],
      [0.24, { ...PEEK_UP, rise: 0.32, d1: 0 }, 'out'],
      [0.7, { ...PEEK_UP }, 'io'],
      [1.0, {}, 'io'],
    ],
    snap: [0.24],
  },
  // Sister's Pick: wriggling ready, then off
  pick: {
    anticT: 0.45,
    keys: [
      [0, { pitch: -16, head: -12, thrash: 0.8, dorsal: 1, fins: 0.9, d1: 0.4 }],
      [0.1, { x: 0.12, pitch: 4, head: 6, thrash: 1, fins: -1, dorsal: -0.6, d1: 0.7 }, 'out'],
      [0.6, {}, 'io'],
    ],
  },
  // Twin Twirl: coiled up tight, then a spin round (a whole turn, never a squeeze)
  twirl: {
    anticT: 0.5,
    keys: [
      [0, { bend: -60, head: 12, pitch: 6, fins: 0.8, dorsal: 1, d1: 0.3 }],
      [0.4, { bend: -40, tumble: 1, rise: 0.15, thrash: 1, fins: 1, d1: 0.6 }, 'io'],
      [0.6, { bend: 0, tumble: 1, rise: 0, thrash: 0.3 }, 'io'],
      [0.9, { tumble: 1 }, 'io'],
    ],
    swirl: [0, 0.6],
  },
  // Grotto Squabble: a huffy thrash, the head shaking
  squabble: {
    anticT: 0.5,
    keys: [
      [0, { thrash: 1, head: -12, d1: 0.6, d2: 1, dorsal: 1 }],
      [0.1, { thrash: 1.2, head: 10, pitch: 6, d1: 0.2, d2: 0 }, 'out'],
      [0.3, { thrash: 1, head: -8, d1: 0.7 }, 'io'],
      [0.5, { thrash: 0.8, head: 6, d1: 0.2 }, 'io'],
      [0.95, {}, 'io'],
    ],
    huff: [0.1, 0.3, 0.5],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.06, pitch: -14, head: -12, bend: 26, fins: 1, dorsal: 1, spread: 1, d1: 0.45 }, 'out'],
      [0.2, { x: -0.06, pitch: -8, bend: 10, fins: 0.6, d1: 0.2 }],
      [0.45, { x: -0.03, pitch: -2, bend: 0, fins: 0.2, d1: 0 }, 'io'],
      [0.75, {}, 'io'],
    ],
  },
  // after landing a hit: a giggly wiggle (Ena) or a smug flick (Murri)
  giggle: {
    anticT: 0.1,
    keys: [
      [0, { fins: 0.4 }],
      [0.12, { thrash: 0.8, pitch: -9, d1: 0.35, fins: 0.9, dorsal: 0.8 }, 'out'],
      [0.6, { thrash: 0.8, pitch: -6, d1: 0.3, fins: 0.8 }],
      [0.9, {}, 'io'],
    ],
  },
  // ---- the scene's (data/scenes.js aquarium_moray) ----
  // hide: down in her hole out of sight (held a long while: the next act takes over)
  hide: { anticT: 0, keys: [[0, HIDE], [40, HIDE]] },
  // peekaboo: up out of the hole, a look round, a giggle, and back down
  peekaboo: {
    anticT: 0,
    keys: [
      [0, HIDE],
      [0.3, { ...PEEK_UP, d1: 0.5 }, 'out'],
      [0.55, { ...PEEK_UP, head: -4, d1: 0.1 }, 'io'],
      [0.85, { ...PEEK_UP, head: -14, d1: 0.5 }, 'io'],
      [1.15, HIDE, 'in'],
      [40, HIDE],
    ],
  },
  // emerge: bursting out of the hole and swimming free
  emerge: {
    anticT: 0,
    keys: [
      [0, HIDE],
      [0.22, { rise: 0.4, pitch: -34, bend: 22, d1: 0.8, dorsal: 1, thrash: 1, fins: 1 }, 'out'],
      [0.55, { rise: 0.1, pitch: -4, bend: 0, d1: 0, thrash: 0.4 }, 'io'],
      [0.95, {}, 'io'],
    ],
  },
  // loop: a happy loop-the-loop over her own tail
  loop: {
    anticT: 0,
    keys: [
      [0, { bend: -20, fins: 0.6 }],
      [0.55, { tumble: -1, rise: 0.35, bend: -50, thrash: 1, fins: 1, dorsal: 1, d1: 0.5 }, 'io'],
      [1.0, { tumble: -1, rise: 0, bend: 0, thrash: 0.2 }, 'io'],
      [1.2, { tumble: -1 }, 'io'],
    ],
  },
  // boop: noses touching
  boop: {
    anticT: 0,
    keys: [
      [0, { x: -0.04, head: -6 }],
      [0.16, { x: 0.12, head: 8, pitch: 4, d1: 0 }, 'out'],
      [0.6, { x: 0.08, head: 4 }, 'io'],
      [1.0, {}, 'io'],
    ],
  },
};
const POSE_MOVE = { chomp: 'chomp', gossip: 'gossip', peek: 'peek', pick: 'pick', twirl: 'twirl', squabble: 'squabble' };
// (which move a strike plays: the cast's own as its wind-up starts, else a plain nip)
const pick = (m, a, st) => {
  if (typeof m.move === 'string' && MOVES[m.move]) return m.move;
  const pose = m.castPose ?? (a.now - (st.mrPoseAt ?? -9) < 0.3 ? st.mrPose : null);
  return POSE_MOVE[pose] ?? 'nip';
};

// ---------- The idle act ----------
const PIECES = { gulp: 6.4, primp: 7.2, peekaboo: 6.2, loop: 5.2 };
const ORDER = ['gulp', 'primp', 'peekaboo', 'loop'];
const NONE = { x: 0, rise: 0, pitch: 0, head: 0, bend: 0, fins: 0, thrash: 0, dorsal: 0, d1: 0, d2: 0, tumble: 0, face: 'calm', gx: null, gy: 0, rings: -1, fluff: 0, tilt: 0 };
function actAt(name, u, sis) {
  const A = { ...NONE, piece: name, u };
  if (name === 'gulp') {
    // slow moray breaths (the mouth opening and closing), then a puffed cheek and a bubble ring
    const br = win(u, 0.2, 0.6, 3.4, 3.8);
    A.d1 = br * (0.25 + 0.25 * Math.sin(u * 3.2));
    A.head = br * 3 * Math.sin(u * 1.6);
    const puff = win(u, 3.8, 4.2, 4.5, 4.6);
    const blow = win(u, 4.55, 4.65, 5.1, 5.6);
    A.d2 = puff;
    A.d1 = Math.max(A.d1, blow * 0.6);
    A.pitch = -6 * puff + 4 * blow;
    A.rings = u > 4.6 && u < 6.3 ? u - 4.6 : -1;
    A.face = u > 4.4 && u < 6 ? 'proud' : 'calm';
    A.gy = u > 4.6 ? -0.5 : 0;
    A.gx = u > 4.6 ? 0.6 : null;
  } else if (name === 'primp') {
    if (sis === 'murri') {
      // a toss of the head knocks her crown crooked; she balances it back with little nods; smug
      const toss = win(u, 0.4, 0.7, 0.9, 1.3);
      A.head = -14 * toss + 6 * win(u, 1.3, 1.5, 1.7, 2.0) - 5 * win(u, 2.4, 2.6, 2.8, 3.1) + 4 * win(u, 3.4, 3.6, 3.8, 4.1);
      A.pitch = -6 * toss;
      A.tilt = clamp(sstep((u - 0.8) / 0.3) - sstep((u - 1.6) / 1.0) * 0.5 - sstep((u - 2.9) / 0.8) * 0.5, 0, 1);
      A.face = u < 1.3 ? 'calm' : u < 4.2 ? 'focus' : 'smug';
      A.gy = u > 1.3 && u < 4.2 ? -1 : 0;
      A.dorsal = 0.6 * win(u, 4.3, 4.6, 6.2, 6.8);
    } else {
      // a shake that fluffs her frills out, a pat-pat with her fins, pleased
      const sh = win(u, 0.4, 0.55, 1.6, 1.8);
      A.head = sh * 7 * Math.sin(u * 22);
      A.fluff = Math.max(sh, win(u, 1.6, 1.8, 4.6, 5.4) * 0.6);
      A.fins = 0.9 * win(u, 2.0, 2.3, 3.8, 4.2);
      A.face = u < 1.8 ? 'squeeze' : u < 4.4 ? 'content' : 'happy';
    }
  } else if (name === 'peekaboo') {
    // down behind her own coiled tail... and up with a grin (twice)
    const dn = Math.max(win(u, 0.6, 1.0, 1.9, 2.15), win(u, 3.2, 3.55, 4.3, 4.5));
    A.bend = -95 * dn;
    A.head = 18 * dn;
    A.pitch = 14 * dn;
    A.rise = -0.12 * dn;
    A.tumble = 0;
    A.face = dn > 0.5 ? 'squeeze' : u > 2 && u < 3.2 ? 'peek' : u > 4.4 ? 'happy' : 'calm';
    A.d1 = (u > 2.1 && u < 2.9) || u > 4.5 ? 0.5 : 0;
    A.gx = u > 2.1 && u < 3.2 ? -1 : null;
  } else if (name === 'loop') {
    const lp = sstep((u - 0.8) / 1.6);
    const on = u > 0.8 && u < 2.4;
    A.tumble = on ? -lp : 0;
    A.rise = 0.3 * Math.sin(Math.PI * clamp((u - 0.8) / 1.6, 0, 1));
    A.bend = -40 * Math.sin(Math.PI * clamp((u - 0.8) / 1.6, 0, 1));
    A.thrash = 0.9 * win(u, 0.7, 0.9, 2.2, 2.6);
    A.fins = A.thrash;
    A.dorsal = A.thrash;
    A.face = u > 0.6 && u < 3.6 ? 'happy' : 'calm';
    A.d1 = u > 2.4 && u < 3.4 ? 0.5 : 0;
  }
  return A;
}

// ---------- Their faces ----------
// targets: sh (shut 0..1), kind (the shut shape), bt brow knit (+) / worried (-), by brow raise, ms
// smile, mw mouth width, mo open, te felt teeth, bl blush, gl a bright glint
const F0 = { sh: 0, kind: 'blink', bt: 0, by: 0.1, ms: 0.35, mw: 1, mo: 0, te: 0, bl: 0.5, gl: 0 };
const FACES = {
  calm: { ...F0 },
  smug: { ...F0, bt: 0.25, by: 0.3, ms: 0.85, mw: 1.05, bl: 0.6 },
  proud: { ...F0, by: 0.45, ms: 0.6, bl: 0.6, gl: 0.6 },
  focus: { ...F0, bt: 0.35, by: 0, ms: 0.05, mw: 0.8 },
  peek: { ...F0, bt: -0.1, by: 0.45, ms: 1, mw: 1.15, mo: 0.35, bl: 0.75, gl: 0.6 },
  happy: { ...F0, sh: 1, kind: 'happy', bt: -0.15, by: 0.45, ms: 1, mw: 1.15, mo: 0.6, bl: 0.85 },
  content: { ...F0, sh: 1, kind: 'happy', bt: -0.1, by: 0.25, ms: 0.85, mw: 1, bl: 0.75 },
  squeeze: { ...F0, sh: 1, kind: 'squeeze', bt: -0.2, by: 0.2, ms: 0.7, mw: 1, mo: 0.25, bl: 0.8 },
  fierce: { ...F0, bt: 0.9, by: -0.1, ms: -0.15, mw: 1.1, mo: 0.7, te: 1, bl: 0.5 },
  chomp: { ...F0, bt: 0.75, by: 0.1, ms: 0.3, mw: 1.2, mo: 1, te: 1, bl: 0.55, gl: 0.3 },
  whisper: { ...F0, bt: -0.05, by: 0.35, ms: 0.65, mw: 0.6, mo: 0.15, bl: 0.75 },
  mischief: { ...F0, bt: 0.25, by: 0.3, ms: 1, mw: 1.15, mo: 0.2, bl: 0.7, gl: 0.5 },
  cross: { ...F0, bt: 1, by: -0.15, ms: -0.6, mw: 0.8, mo: 0.1, bl: 0.9 },
  sulk: { ...F0, bt: -0.5, by: 0.1, ms: -0.55, mw: 0.7, mo: 0, bl: 0.9 },
  surprised: { ...F0, bt: -0.15, by: 0.9, ms: 0, mw: 0.7, mo: 0.6, bl: 0.5 },
  hurt: { ...F0, sh: 1, kind: 'squeeze', bt: -0.6, by: 0, ms: -0.6, mw: 0.9, mo: 0.45, bl: 0.6 },
  knot: { ...F0, sh: 1, kind: 'dizzy', bt: -0.5, by: 0.3, ms: -0.3, mw: 0.9, mo: 0.4, bl: 0.9 },
  sleep: { ...F0, sh: 1, kind: 'sleep', bt: -0.1, by: 0, ms: 0.3, mw: 0.7, mo: 0.12, bl: 0.5 },
  dizzy: { ...F0, sh: 1, kind: 'dizzy', bt: -0.45, by: 0.2, ms: -0.3, mw: 0.85, mo: 0.35, bl: 0.4 },
  sad: { ...F0, bt: -0.75, by: 0.2, ms: -0.6, mw: 0.8, bl: 0.4 },
  worried: { ...F0, bt: -0.6, by: 0.35, ms: -0.25, mw: 0.7, mo: 0.15, bl: 0.5 },
  talk: { ...F0, by: 0.3, ms: 0.45, mw: 0.95, mo: 0.3, bl: 0.55 },
};
const KINDS = ['blink', 'happy', 'sleep', 'squeeze', 'dizzy'];
const FKEYS = ['bt', 'by', 'ms', 'mw', 'mo', 'te', 'bl', 'gl'];
const VOWELS = [[0.7, 0.2, 0.7], [1.1, 0.45, 0.5], [1.15, 0.6, 0.2], [0.85, 0.35, 0], [0.75, 0.2, 0.45]];

// ---------- Her pose, act, moods (each frame, before drawing) ----------
function pose(sis, m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? 0;
  const t = a.t ?? 0;
  const alive = m.hp > 0;
  const H = K.H;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.55;
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const name = mv ? Object.keys(MOVES).find((nm) => MOVES[nm] === mv) ?? 'base' : null;
  if (m.castPose) {
    st.mrPose = m.castPose;
    st.mrPoseAt = now;
  }
  const swimming = (st.fsV ?? 0) > 6;
  // ----- Calm: the act -----
  const calmGoal = !mv && alive && !napping && !m.pose && !m.cine && !hurt && !fighting && !swimming && !m.burrowed ? 1 : 0;
  st.mrCalm = mix(st.mrCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.mrCalm);
  let PC = st.mrPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.4) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.mrN ??= ((m.uid ?? 0) + (sis === 'ena' ? 2 : 0)) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.mrN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.25 };
        st.mrN = (st.mrN + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.mrPiece = PC;
  const A = PC && PC.name ? actAt(PC.name, now - PC.t0, sis) : { ...NONE, piece: null, u: 0 };
  for (const key of ['pitch', 'head', 'bend', 'fins', 'thrash', 'dorsal', 'd1', 'd2']) out[key] += A[key] * cw;
  out.x += A.x * H * cw;
  out.rise += A.rise * H * cw;
  // (her loop: whole turns about her middle, added to a move's own)
  a.fsTumble = (a.fsTumble ?? 0) + A.tumble * cw;
  // ----- In her burrow: her head and neck up in the hole's mouth (dive: down in, then up to peek) -----
  const burrowGoal = alive && m.burrowed ? 1 : 0;
  st.mrBur = mix(st.mrBur ?? burrowGoal, burrowGoal, k(burrowGoal ? 30 : 9));
  const bw = sstep(st.mrBur);
  if (bw > 0.001) {
    const since = now - (m.diveAt ?? -9);
    const up = since >= 0 && since < 1 ? sstep((since - 0.2) / 0.55) : 1;
    const peekW = m.burrowed ? up : 1;
    const rise = mix(HIDE.rise * H, PEEK_UP.rise * H, peekW);
    // (wriggling in the hole: a slow sway, quicker as a pick or a peek gets ready)
    const busy = m.castPose === 'pick' || m.castPose === 'peek' ? 1 : 0;
    const sway = Math.sin(t * (2 + 4 * busy) + (sis === 'ena' ? 1.3 : 0));
    const goal = { pitch: mix(HIDE.pitch, PEEK_UP.pitch, peekW) + sway * 4, bend: mix(HIDE.bend, PEEK_UP.bend, peekW), head: -8 + sway * 6, fins: 0.3, dorsal: 0.4 + 0.5 * busy };
    if (!mv || name === 'hurt') {
      for (const key of Object.keys(goal)) out[key] = mix(out[key], goal[key], bw);
      out.rise = mix(out.rise, rise, bw);
      out.x *= 1 - bw;
    }
  }
  // ----- Casting (a rotation's long hold before its wind-up) -----
  const cast = alive && m.cast && !mv ? m.castPose : null;
  st.mrCastW = mix(st.mrCastW ?? 0, cast ? 1 : 0, k(cast ? 6 : 8));
  if (cast) st.mrCastPose = cast;
  const cpw = sstep(st.mrCastW) * (1 - bw);
  const cp = st.mrCastPose;
  if (cpw > 0.001) {
    const hold = {
      chomp: { x: -0.06 * H, pitch: -10, head: -10, d1: 0.85 + 0.15 * Math.sin(t * 7), dorsal: 1, fins: 0.7 },
      gossip: { pitch: -4, head: -6 + 3 * Math.sin(t * 5), d2: 0.8, fins: 0.5, d1: 0.1 },
      twirl: { bend: -55 - 8 * Math.sin(t * 6), head: 12, pitch: 6, fins: 0.8, dorsal: 1, thrash: 0.35 },
      squabble: { thrash: 0.8, head: 10 * Math.sin(t * 9), d1: 0.4 + 0.3 * Math.sin(t * 9), d2: 0.5, dorsal: 1 },
      peek: { dorsal: 0.6, thrash: 0.3 },
      pick: { thrash: 0.5, dorsal: 0.8 },
    }[cp];
    if (hold) for (const key of Object.keys(hold)) out[key] = mix(out[key], hold[key], cpw);
  }
  // ----- A lunge along the floor: fast, low, mouth open -----
  const lunging = alive && m.charging?.lunge;
  st.mrLungeW = mix(st.mrLungeW ?? 0, lunging ? 1 : 0, k(lunging ? 14 : 5));
  const lw = sstep(st.mrLungeW);
  if (lw > 0.001) {
    const goal = { pitch: 4, head: 6, thrash: 1.1, fins: -1, dorsal: -0.7, d1: 0.6, spread: 0.2 };
    for (const key of Object.keys(goal)) out[key] = mix(out[key], goal[key], lw);
  }
  // ----- Tangled: curled in a knot with her sister, seeing stars -----
  const knotted = alive && m.tangle && now < m.tangle.until;
  st.mrKnotW = mix(st.mrKnotW ?? 0, knotted ? 1 : 0, k(knotted ? 10 : 3));
  const kw = sstep(st.mrKnotW);
  if (kw > 0.001) {
    const goal = { bend: 330 + 14 * Math.sin(t * 2.2), head: 14, pitch: 18 + 4 * Math.sin(t * 2.6), fins: 0.9, dorsal: -0.2, thrash: 0.25, d1: 0.3, rise: 0.12 * H };
    for (const key of Object.keys(goal)) out[key] = mix(out[key], goal[key], kw);
  }
  if (typeof m.bendTest === 'number') out.bend += m.bendTest;
  // ----- Her marks: "!" as she starts hunting you, "?" when she loses you -----
  if (fighting && !st.mrHunt && alive) st.mrBangAt = now;
  if (!fighting && st.mrHunt && alive) st.mrLostAt = now;
  st.mrHunt = fighting;
  const bang = now - (st.mrBangAt ?? -9);
  const huh = now - (st.mrLostAt ?? -9);
  const banging = alive && bang >= 0 && bang < 1.2 && !m.burrowed;
  const huhing = alive && !fighting && huh >= 0 && huh < 1.4;
  if (banging && !mv) {
    out.dorsal += 0.8 * win(bang, 0, 0.1, 0.6, 1.0);
    out.rise += 0.08 * H * win(bang, 0, 0.12, 0.3, 0.6);
    out.fins += 0.7 * win(bang, 0, 0.12, 0.6, 1.0);
  }
  if (huhing && !mv) out.head += -6 * win(huh, 0, 0.2, 1.0, 1.4);
  // ----- Hunting you (in the open, nothing else on): a ready sway, the frill up -----
  if (fighting && !mv && !hurt && !m.burrowed && !lunging && !knotted && !cast) {
    out.pitch += -3 + 1.5 * Math.cos(t * 2.4);
    out.head += 2 * Math.sin(t * 2.4 + 0.6);
    out.dorsal += 0.6;
    out.d1 += 0.12 + 0.12 * Math.sin(t * 2.4);
  }
  // ----- Her mood -----
  const low = alive && m.hp < (m.def.hp ?? 1) * 0.25;
  const cine = m.cine?.mood;
  const phaseNow = m.phaseAt != null && now - m.phaseAt >= 0 && now - m.phaseAt < 1.4;
  let mood = 'calm';
  if (!alive) mood = 'dizzy';
  else if (knotted) mood = 'knot';
  else if (hurt || name === 'hurt') mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'chomp' || name === 'nip') mood = mt < 0 ? 'fierce' : mt < 0.35 ? 'chomp' : sis === 'murri' ? 'smug' : 'happy';
  else if (name === 'gossip') mood = mt < 0 ? 'whisper' : 'mischief';
  else if (name === 'peek' || name === 'peekaboo' || name === 'emerge') mood = 'peek';
  else if (name === 'pick') mood = 'mischief';
  else if (name === 'twirl' || name === 'loop') mood = 'happy';
  else if (name === 'squabble') mood = 'cross';
  else if (name === 'giggle') mood = sis === 'murri' ? 'smug' : 'happy';
  else if (name === 'boop') mood = 'content';
  else if (lunging) mood = 'chomp';
  else if (cast === 'chomp') mood = 'fierce';
  else if (cast === 'gossip') mood = 'whisper';
  else if (cast === 'twirl') mood = 'mischief';
  else if (cast === 'squabble') mood = 'cross';
  else if (cast === 'pick' || cast === 'peek' || m.burrowed) mood = 'mischief';
  else if (phaseNow) mood = 'cross';
  else if (m.alone) mood = 'sulk';
  else if (banging) mood = bang < 0.15 ? 'surprised' : 'mischief';
  else if (huhing) mood = 'surprised';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (cw > 0.5 && A.piece && A.face !== 'calm') mood = A.face;
  else if (low) mood = 'worried';
  else if (fighting) mood = sis === 'murri' ? 'smug' : 'mischief';
  if (typeof m.faceTest === 'string' && FACES[m.faceTest]) mood = m.faceTest;
  const F = FACES[mood] ?? FACES.calm;
  const f = (st.mrF ??= { shut: 0, kinds: { blink: 1, happy: 0, sleep: 0, squeeze: 0, dizzy: 0 }, ...F0, gx: 0, gy: 0, sweat: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  for (const key of FKEYS) f[key] = mix(f[key], tgt[key], k(14));
  const bt = t + ((m.uid ?? 0) % 5) * 0.9 + (sis === 'ena' ? 1.7 : 0);
  const blink = F.sh < 0.5 ? win(bt % (sis === 'ena' ? 3.9 : 4.7), 3.4, 3.46, 3.52, 3.62) : 0;
  f.shut = mix(f.shut, Math.max(F.sh, blink), k(F.sh > 0.5 || blink > 0 ? 26 : 18));
  const kind = F.sh > 0.5 ? F.kind : 'blink';
  for (const kd of KINDS) f.kinds[kd] = mix(f.kinds[kd], kd === kind ? 1 : 0, k(16));
  let gx = 0;
  let gy = 0;
  const turnT = st.fsTt;
  if (turnT != null && turnT < (K.P.turn?.[0] ?? 0.14)) [gx, gy] = [-1, 0];
  else if (cw > 0.5 && A.gx !== null) [gx, gy] = [A.gx, A.gy];
  else if (huhing) [gx, gy] = [Math.sin(huh * 6) > 0 ? 1 : -0.8, -0.2];
  else if (fighting || mv) [gx, gy] = [1, 0];
  else if (mood === 'worried' || mood === 'sad' || mood === 'sulk') [gx, gy] = [-0.3, 0.6];
  f.gx = mix(f.gx, gx, k(18));
  f.gy = mix(f.gy, gy, k(18));
  f.sweat = mix(f.sweat, (low && !napping) || knotted ? 1 : 0, k(5));
  // her jaw: the moves' and the act's d1, eased (read by the face from the skeleton's channels)
  a.mrF = f;
  a.mrMood = mood;
  a.mrAct = { ...A, cw };
  a.mrBang = banging ? bang : -1;
  a.mrHuh = huhing ? huh : -1;
  a.mrGloat = name === 'giggle' ? mt : -1;
  a.mrHurt = hurt ? ago : -1;
  a.mrNap = napping;
  a.mrKnot = kw;
  a.mrMove = mv && name !== 'base' && name !== 'hurt' ? { name, t: mt } : null;
  a.mrPop = alive ? now - (m.popAt ?? -9) : -1;
  a.mrDive = alive ? now - (m.diveAt ?? -9) : -1;
  a.mrLunge = lw;
  a.mrCast = cast ? { pose: cast, w: cpw, left: m.cast ? m.cast.t0 + m.cast.dur - now : 0 } : null;
  a.mrTilt = sis === 'murri' ? 0.18 + 0.5 * (A.piece === 'primp' ? A.tilt * cw : 0) : 0;
  a.mrFluff = sis === 'ena' ? (A.piece === 'primp' ? A.fluff * cw : 0) : 0;
}

// ---------- Drawing her ----------
function bodyFill(T) {
  return (ctx, a, sk, K) => {
    const s = K.s;
    const pv = K.P.pivot;
    const top = add(sk.pivot, [sk.nrm[pv][0] * sk.back[pv], sk.nrm[pv][1] * sk.back[pv]]);
    const low = add(sk.pivot, [-sk.nrm[pv][0] * sk.belly[pv], -sk.nrm[pv][1] * sk.belly[pv]]);
    const g = ctx.createLinearGradient(top[0], top[1], low[0], low[1]);
    g.addColorStop(0, lit(a, T.back));
    g.addColorStop(0.32, lit(a, T.C.base));
    g.addColorStop(0.62, lit(a, T.C.lt));
    g.addColorStop(0.75, lit(a, T.belly));
    g.addColorStop(1, lit(a, T.bellySh));
    ctx.fillStyle = g;
    ctx.fillRect(sk.pivot[0] - 200 * s, sk.pivot[1] - 200 * s, 400 * s, 400 * s);
    // the head lit from the upper front; a soft sheen along the back; the tail end a touch deeper
    K.soft(ctx, sk.along(2 * s, sk.back[0] * 0.45), sk.back[0] * 1.0, T.C.lt, 0.85);
    K.soft(ctx, sk.along(18 * s, sk.back[3] * 0.4), sk.back[3] * 1.6, T.C.lt, 0.35);
    K.soft(ctx, sk.pos[sk.pos.length - 1], 7 * s, T.C.deep, 0.35);
    // (her stripe down the back, under the frill, fading toward the head and the tail)
    ctx.save();
    ctx.lineCap = 'round';
    const N = sk.pos.length;
    for (let j = 1; j < N - 1; j++) {
      const p0 = add(sk.pos[j], [sk.nrm[j][0] * sk.back[j] * 0.72, sk.nrm[j][1] * sk.back[j] * 0.72]);
      const p1 = add(sk.pos[j + 1], [sk.nrm[j + 1][0] * sk.back[j + 1] * 0.72, sk.nrm[j + 1][1] * sk.back[j + 1] * 0.72]);
      const al = 0.55 * Math.sin(Math.PI * (j / (N - 1)));
      ctx.strokeStyle = lit(a, T.stripe, al);
      ctx.lineWidth = sk.back[j] * 0.5;
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      ctx.stroke();
    }
    ctx.restore();
  };
}
// Ena's pearl ribbon: a coral band round her neck, just behind the head (clipped to the body)
function enaRibbon(ctx, a, sk, K) {
  const s = K.s;
  const j = 1;
  const c = sk.pos[j];
  const n = sk.nrm[j];
  const f = sk.dirs[j];
  const top = add(c, [n[0] * sk.back[j] * 1.1, n[1] * sk.back[j] * 1.1]);
  const bot = add(c, [-n[0] * sk.belly[j] * 1.1, -n[1] * sk.belly[j] * 1.1]);
  const w = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(top[0] + f[0] * w, top[1] + f[1] * w);
  ctx.quadraticCurveTo(c[0] + f[0] * (w + 1.2 * s), c[1] + f[1] * (w + 1.2 * s), bot[0] + f[0] * w, bot[1] + f[1] * w);
  ctx.lineTo(bot[0] - f[0] * w, bot[1] - f[1] * w);
  ctx.quadraticCurveTo(c[0] - f[0] * (w - 1.2 * s), c[1] - f[1] * (w - 1.2 * s), top[0] - f[0] * w, top[1] - f[1] * w);
  ctx.closePath();
  ctx.fillStyle = lit(a, CORAL.base);
  ctx.fill();
  stroke(ctx, [add(top, [f[0] * w * 0.4, f[1] * w * 0.4]), add(c, [f[0] * w * 1.2, f[1] * w * 1.2]), add(bot, [f[0] * w * 0.4, f[1] * w * 0.4])], 0.5 * s, lit(a, CORAL.lt, 0.85));
}
// The pearl hanging from Ena's ribbon, under her chin (over the body, both passes)
function enaPearl(ctx, a, mode, K) {
  const sk = a.fk;
  const s = K.s;
  const j = 1;
  const at = add(sk.pos[j], [-sk.nrm[j][0] * sk.belly[j] * 0.95, -sk.nrm[j][1] * sk.belly[j] * 0.95]);
  const sw = Math.sin((a.t ?? 0) * 2.1) * 0.25;
  const p = add(at, [Math.sin(sw) * 2.4 * s, Math.cos(sw) * 2.4 * s]);
  const r = 1.55 * s;
  ell(ctx, p[0], p[1], r, r);
  if (mode === 'line') {
    ctx.strokeStyle = PEARL.ink;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    return;
  }
  const g = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.4, 0, p[0], p[1], r);
  g.addColorStop(0, lit(a, '#ffffff'));
  g.addColorStop(0.6, lit(a, PEARL.base));
  g.addColorStop(1, lit(a, PEARL.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, p[0] - r * 0.3, p[1] - r * 0.35, r * 0.28, r * 0.2, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // the little coral knot it hangs from
  ell(ctx, at[0], at[1], 0.9 * s, 0.75 * s);
  ctx.fillStyle = lit(a, CORAL.sh);
  ctx.fill();
}
// Ena's frilly cheek fins: two round fans behind her face, rooted inside her head, fluffing out
function enaFrills(ctx, a, mode, K) {
  const T = TW.ena;
  K.headFrame(ctx, a);
  const fl = a.mrFluff ?? 0;
  const t = a.t ?? 0;
  for (const [x, y, r, an] of [[-3.0, 2.0, 3.8, 2.3], [-3.6, -1.6, 3.1, 2.9]]) {
    const sp = 1 + 0.18 * fl + 0.04 * Math.sin(t * 3 + x);
    const ang = an + 0.15 * fl * Math.sin(t * 20);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -1.3);
    const N = 5;
    for (let i = 0; i <= N; i++) {
      const q = -0.95 + (i / N) * 1.9;
      const R = r * sp * (0.92 + 0.08 * Math.cos(i * 2));
      const p = [Math.cos(q) * R, Math.sin(q) * R];
      if (i === 0) ctx.lineTo(...p);
      else {
        const qm = q - 0.95 / N;
        ctx.quadraticCurveTo(Math.cos(qm) * R * 1.16, Math.sin(qm) * R * 1.16, ...p);
      }
    }
    ctx.lineTo(0, 1.3);
    ctx.closePath();
    if (mode === 'line') {
      ctx.strokeStyle = T.inks.fin;
      ctx.lineWidth = 2 / K.s;
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = lit(a, T.CF.base);
      ctx.fill();
      ctx.save();
      ctx.clip();
      glow(ctx, r * 0.25, 0, r * 0.8, T.CF.lt, 0.8);
      ctx.strokeStyle = lit(a, T.CF.sh, 0.8);
      ctx.lineWidth = 0.3;
      for (const q of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(q) * r * 0.25, Math.sin(q) * r * 0.25);
        ctx.lineTo(Math.cos(q) * r * 0.85, Math.sin(q) * r * 0.85);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
// Murri's little coral crown, on top of her head (rooted inside it), set a touch crooked
function murriCrown(ctx, a, mode, K) {
  K.headFrame(ctx, a);
  ctx.translate(1.0, -8.1);
  ctx.rotate(a.mrTilt ?? 0.18);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-3.2, 1.6);
    ctx.quadraticCurveTo(-3.6, -1.2, -2.3, -2.9);
    ctx.quadraticCurveTo(-1.6, -1.2, -1.0, -1.0);
    ctx.quadraticCurveTo(-0.6, -3.9, 0, -4.2);
    ctx.quadraticCurveTo(0.6, -3.9, 1.0, -1.0);
    ctx.quadraticCurveTo(1.6, -1.2, 2.3, -2.9);
    ctx.quadraticCurveTo(3.6, -1.2, 3.2, 1.6);
    ctx.quadraticCurveTo(0, 2.4, -3.2, 1.6);
    ctx.closePath();
  };
  path();
  if (mode === 'line') {
    ctx.strokeStyle = CORAL.ink;
    ctx.lineWidth = 2 / K.s;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = lit(a, CORAL.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = lit(a, CORAL.sh, 0.7);
  ctx.fillRect(-4, 0.6, 8, 2);
  ctx.restore();
  for (const [x, y, r] of [[-2.3, -2.9, 0.75], [0, -4.2, 0.85], [2.3, -2.9, 0.75]]) {
    ell(ctx, x, y, r, r);
    ctx.fillStyle = lit(a, CORAL.lt);
    ctx.fill();
  }
  // the pearl in front
  ell(ctx, 0, 0.3, 1.05, 1.05);
  const g = ctx.createRadialGradient(-0.35, -0.05, 0, 0, 0.3, 1.1);
  g.addColorStop(0, lit(a, '#ffffff'));
  g.addColorStop(0.6, lit(a, PEARL.base));
  g.addColorStop(1, lit(a, PEARL.sh));
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, -0.3, -0.05, 0.28, 0.2, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

// Her face (in the head's frame: x ahead, y down, units).
const EYES = {
  murri: { n: { x: 0.9, y: -2.9, rx: 2.3, ry: 2.6 }, f: { x: 5.1, y: -3.2, rx: 1.45, ry: 2.25 } },
  ena: { n: { x: 0.8, y: -2.8, rx: 2.6, ry: 2.75 }, f: { x: 5.15, y: -3.1, rx: 1.65, ry: 2.4 } },
};
function face(sis) {
  const T = TW[sis];
  const E = EYES[sis];
  return (ctx, a, sk, K) => {
    const f = a.mrF;
    if (!f) return;
    K.headFrame(ctx, a);
    const t = a.t ?? 0;
    const S = sk.S ?? {};
    // rosy cheeks (puffed full when she's holding a whisper or a bubble)
    const puff = clamp(S.d2 ?? 0, 0, 1);
    glow(ctx, 0.2, 1.6, 2.4 + 0.9 * puff, T.blush, 0.45 * f.bl + 0.25 * puff);
    glow(ctx, 5.2, 1.0, 1.4 + 0.5 * puff, T.blush, 0.35 * f.bl + 0.2 * puff);
    const closedW = sstep((f.shut - 0.25) / 0.5);
    const gx = clamp(f.gx, -1, 1);
    const gy = clamp(f.gy, -1, 1);
    const ink = lit(a, T.lash);
    const eye = (e, near) => {
      const { x, y, rx, ry } = e;
      if (closedW > 0.01) {
        ctx.save();
        ctx.globalAlpha *= closedW;
        const Kd = f.kinds;
        if (Kd.happy > 0.01) {
          ctx.globalAlpha *= Kd.happy;
          stroke(ctx, [[x - rx, y + 0.3], [x, y - ry * 1.15], [x + rx, y + 0.2]], 0.5, ink);
          ctx.globalAlpha /= Kd.happy;
        }
        const lineW = Math.min(1, Kd.sleep + Kd.blink);
        if (lineW > 0.01) {
          ctx.globalAlpha *= lineW;
          stroke(ctx, [[x - rx, y], [x, y + ry * 0.55], [x + rx, y - 0.1]], 0.5, ink);
          if (sis === 'murri') stroke(ctx, [[x + rx, y - 0.1], [x + rx + 0.4, y - 0.25], [x + rx + 0.6, y - 0.7]], 0.4, ink);
          ctx.globalAlpha /= lineW;
        }
        if (Kd.squeeze > 0.01) {
          ctx.globalAlpha *= Kd.squeeze;
          const o = near ? 1 : -1;
          stroke(ctx, [[x - o * rx, y - ry * 0.55], [x + o * rx * 0.1, y - ry * 0.05], [x + o * rx * 0.85, y]], 0.5, ink);
          stroke(ctx, [[x + o * rx * 0.85, y], [x + o * rx * 0.1, y + ry * 0.2], [x - o * rx, y + ry * 0.5]], 0.5, ink);
          ctx.globalAlpha /= Kd.squeeze;
        }
        if (Kd.dizzy > 0.01) {
          ctx.globalAlpha *= Kd.dizzy;
          ctx.strokeStyle = ink;
          ctx.lineWidth = 0.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (let i = 0; i <= 26; i++) {
            const an = (i / 26) * TAU * 2 + t * 4 * (near ? 1 : -1);
            const r = (i / 26) * rx * 0.9;
            const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * (ry / rx)];
            i ? ctx.lineTo(...p) : ctx.moveTo(...p);
          }
          ctx.stroke();
          ctx.globalAlpha /= Kd.dizzy;
        }
        ctx.restore();
      }
      const openW = 1 - closedW;
      if (openW <= 0.01) return;
      ctx.save();
      ctx.globalAlpha *= openW;
      // the white: Murri's a tall oval tipped up at its outer corner, Ena's round
      ctx.beginPath();
      if (sis === 'murri') ctx.ellipse(x, y, rx, ry, -0.12, 0, TAU);
      else ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.fillStyle = lit(a, '#fbfffd');
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = sis === 'murri' ? 'rgba(120,170,150,0.32)' : 'rgba(200,150,110,0.3)';
      ctx.fillRect(x - rx * 1.2, y - ry * 1.2, rx * 2.4, ry * 0.4);
      // the iris (dark at the top, light low down), the pupil, a soft light low in it
      const ix = x + gx * rx * 0.16;
      const iy = y + 0.1 * ry + gy * ry * 0.14;
      const irx = rx * (sis === 'murri' ? 0.7 : 0.76);
      const iry = ry * (sis === 'murri' ? 0.8 : 0.82);
      const g = ctx.createLinearGradient(ix, iy - iry, ix, iy + iry);
      g.addColorStop(0, lit(a, T.iris[0]));
      g.addColorStop(0.55, lit(a, T.iris[1]));
      g.addColorStop(1, lit(a, T.iris[2]));
      ell(ctx, ix, iy, irx, iry);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = lit(a, T.iris[0], 0.8);
      ctx.lineWidth = 0.22;
      ctx.stroke();
      ell(ctx, ix, iy - iry * 0.05, irx * 0.42, iry * 0.5);
      ctx.fillStyle = lit(a, T.pupil);
      ctx.fill();
      ell(ctx, ix, iy + iry * 0.55, irx * 0.62, iry * 0.25);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.restore();
      // the glints: Murri a soft rounded diamond and a dot; Ena three little bubbles
      if (sis === 'murri') {
        ctx.save();
        ctx.translate(ix + irx * 0.32, iy - iry * 0.38);
        ctx.rotate(Math.PI / 4);
        const q = irx * (0.36 + 0.12 * f.gl);
        ctx.beginPath();
        ctx.roundRect(-q, -q, q * 2, q * 2, q * 0.55);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.restore();
        ell(ctx, ix - irx * 0.42, iy + iry * 0.42, irx * 0.16, irx * 0.16);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fill();
      } else {
        for (const [dx, dy, r] of [[0.34, -0.42, 0.3 + 0.08 * f.gl], [0.0, -0.06, 0.15], [-0.26, 0.24, 0.1]]) {
          ell(ctx, ix + irx * dx, iy + iry * dy, irx * r, irx * r);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
      // the lash line: neat along the top (never over the iris), a round wing at the outer corner
      const top = [];
      for (let i = 0; i <= 8; i++) {
        const q = Math.PI + (i / 8) * Math.PI;
        const rot = sis === 'murri' ? -0.12 : 0;
        const px = Math.cos(q) * rx;
        const py = Math.sin(q) * ry;
        top.push([x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
      }
      ctx.strokeStyle = ink;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // (thin at the inner corner, thickening evenly toward the outer one)
      const w0 = sis === 'murri' ? 0.22 : 0.18;
      const w1 = sis === 'murri' ? 0.58 : 0.46;
      for (let i = 2; i < 8; i++) {
        ctx.lineWidth = mix(w0, w1, (i - 2) / 5);
        ctx.beginPath();
        ctx.moveTo(...top[i]);
        ctx.lineTo(...top[i + 1]);
        ctx.stroke();
      }
      // one soft wing at the outer corner, round-tipped
      const oc = top[8];
      if (sis === 'murri') stroke(ctx, [oc, [oc[0] + 0.5, oc[1] - 0.1], [oc[0] + 0.72, oc[1] - 0.5]], 0.46, ink);
      else stroke(ctx, [oc, [oc[0] + 0.45, oc[1] - 0.05], [oc[0] + 0.62, oc[1] - 0.42]], 0.36, ink);
      ctx.restore();
    };
    eye(E.f, false);
    eye(E.n, true);
    // the brows: Murri's short thick round ones, Ena's thin arched ones
    const brow = (e, side, w, len) => {
      const lift = f.by * 0.8;
      const yb = e.y - e.ry - 1.7 - lift;
      const yi = yb + f.bt * 0.7;
      const yo = yb - f.bt * 0.25 - 0.15;
      const xi = e.x - e.rx * len * 0.6;
      const xo = e.x + e.rx * len * 0.75;
      const mid = [(xi + xo) / 2, Math.min(yi, yo) - (sis === 'ena' ? 0.55 : 0.3)];
      stroke(ctx, [[xi, yi], mid, [xo, yo]], w, lit(a, T.brow));
    };
    if (sis === 'murri') {
      brow(E.n, 1, 0.66, 0.85);
      brow(E.f, -1, 0.54, 0.75);
    } else {
      brow(E.n, 1, 0.42, 1.25);
      brow(E.f, -1, 0.36, 1.1);
    }
    // the mouth: along the snout from its tip back toward the cheek, from width, smile and openness;
    // the jaw (the moves' d1) opens it wide, soft round felt teeth along the top when it does
    const jawOpen = Math.max(f.mo, clamp(S.d1 ?? 0, 0, 1));
    const M0 = [6.95, 1.9];
    const Kc = [M0[0] - 5.0 * f.mw, 2.9 - 0.7 * f.ms];
    const Mm = [(M0[0] + Kc[0]) / 2 + 0.2, 2.95 + 0.35 * f.ms];
    if (jawOpen > 0.06) {
      const o = jawOpen;
      ctx.beginPath();
      ctx.moveTo(...M0);
      ctx.quadraticCurveTo(Mm[0], Mm[1] - 0.2, ...Kc);
      ctx.quadraticCurveTo(Mm[0] - 0.3, Mm[1] + 0.4 + o * 3.2, M0[0] - 0.2, M0[1] + o * 1.4);
      ctx.closePath();
      ctx.fillStyle = lit(a, T.mouth);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ell(ctx, Mm[0] - 0.2, Mm[1] + 0.6 + o * 2.4, 1.5, o * 1.0);
      ctx.fillStyle = lit(a, T.tongue);
      ctx.fill();
      // (soft round felt teeth along the top edge: little bumps, never points)
      const tw = Math.max(f.te, o > 0.6 ? (o - 0.6) * 2.5 : 0);
      if (tw > 0.05) {
        ctx.fillStyle = lit(a, '#ffffff', clamp(tw, 0, 1));
        for (let i = 0; i < 4; i++) {
          const u = (i + 0.5) / 4;
          const px = mix(M0[0] - 0.4, Kc[0] + 0.4, u);
          const py = mix(M0[1], Kc[1], u) + 0.25 + 0.3 * Math.sin(Math.PI * u) * f.ms;
          ell(ctx, px, py, 0.42, 0.5);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    stroke(ctx, [M0, Mm, Kc], 0.45, lit(a, T.line));
    // a little curl at the corner: Murri's sly, Ena's sweet
    if (f.ms > 0.3) stroke(ctx, [Kc, [Kc[0] - 0.35, Kc[1] - 0.05], [Kc[0] - 0.45, Kc[1] - 0.5]], 0.4, lit(a, T.line));
    // a nostril dot up at the snout
    ell(ctx, 6.6, -1.3, 0.34, 0.28);
    ctx.fillStyle = lit(a, T.line, 0.6);
    ctx.fill();
    // a bead of sweat (low on health; tangled)
    if (f.sweat > 0.05) {
      const u = (t * 0.6) % 1;
      const x = -3.2;
      const y = -6 + sstep(u) * 1.8;
      ctx.save();
      ctx.globalAlpha *= f.sweat * Math.sin(Math.PI * u);
      ctx.beginPath();
      ctx.moveTo(x, y - 1.2);
      ctx.quadraticCurveTo(x + 0.95, y + 0.3, x, y + 0.9);
      ctx.quadraticCurveTo(x - 0.95, y + 0.3, x, y - 1.2);
      ctx.fillStyle = 'rgba(214,240,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(110,170,200,0.85)';
      ctx.lineWidth = 0.28;
      ctx.stroke();
      ctx.restore();
    }
  };
}

// ---------- Her effects ----------
function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = BUB.fill;
  ctx.fill();
  ctx.strokeStyle = BUB.edge;
  ctx.lineWidth = Math.max(0.3, r * 0.2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(0.3, r * 0.22);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, -2.6, -1.7);
  ctx.stroke();
  ctx.restore();
}
function ringB(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r * 0.45, r);
  ctx.strokeStyle = BUB.edge;
  ctx.lineWidth = Math.max(0.6, r * 0.32);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,252,255,0.95)';
  ctx.lineWidth = Math.max(0.3, r * 0.14);
  ctx.stroke();
  ctx.restore();
}
function swoosh(ctx, pts, w, al, col) {
  if (al <= 0.01 || pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  for (const [kk, c] of [[1, col.edge], [0.6, '#e6fbff'], [0.28, '#ffffff']]) {
    for (let i = 0; i < pts.length - 1; i++) {
      const f = 1 - i / (pts.length - 1);
      ctx.strokeStyle = c;
      ctx.lineWidth = Math.max(0.2, w * kk * (0.25 + 0.75 * f));
      ctx.beginPath();
      ctx.moveTo(...pts[i]);
      ctx.lineTo(...pts[i + 1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// A mark over her head in a bubble with a rim of her own colour: "!", "?" or a little note ("*").
function mark(ctx, x, y, kind, e, len, s, unflip, T) {
  const inn = e < 0.25 ? easeOut(e / 0.25) * (1 + 0.18 * Math.sin(Math.PI * clamp(e / 0.25, 0, 1))) : 1;
  const k = inn * (1 - sstep((e - (len - 0.25)) / 0.25));
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2 * s);
  if (unflip) ctx.scale(-1, 1);
  ctx.globalAlpha *= Math.min(1, k * 1.4);
  const R = 4.2 * s * Math.min(1, 0.6 + 0.4 * k);
  ell(ctx, 0, 0, R, R);
  ctx.strokeStyle = T.mark.edge;
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  ctx.fillStyle = T.mark.fill;
  ctx.fill();
  // (a bubble's glint, and a little bubble trailing below)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.7 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.78, -2.6, -1.9);
  ctx.stroke();
  bubble(ctx, -R * 0.55, R * 1.25, R * 0.22, 1);
  const col = T.mark.glyph;
  if (kind === '!') {
    stroke(ctx, [[0, -R * 0.55], [0, -R * 0.2], [0, R * 0.15]], 1.25 * s, col);
    ell(ctx, 0, R * 0.5, 0.7 * s, 0.7 * s);
    ctx.fillStyle = col;
    ctx.fill();
  } else if (kind === '?') {
    stroke(ctx, [[-R * 0.34, -R * 0.22], [-R * 0.3, -R * 0.62], [0, -R * 0.62], [R * 0.4, -R * 0.6], [R * 0.32, -R * 0.24], [R * 0.22, -R * 0.03], [0, R * 0.06], [0, R * 0.14], [0, R * 0.2]], 1.15 * s, col);
    ell(ctx, 0, R * 0.52, 0.66 * s, 0.66 * s);
    ctx.fillStyle = col;
    ctx.fill();
  } else {
    // a round note with a curl (her gloat)
    ell(ctx, -R * 0.2, R * 0.3, R * 0.26, R * 0.2, -0.4);
    ctx.fillStyle = col;
    ctx.fill();
    stroke(ctx, [[R * 0.04, R * 0.25], [R * 0.05, -R * 0.2], [R * 0.05, -R * 0.55]], 0.8 * s, col);
    stroke(ctx, [[R * 0.05, -R * 0.55], [R * 0.4, -R * 0.42], [R * 0.36, -R * 0.12]], 0.8 * s, col);
  }
  ctx.restore();
}
function zee(ctx, x, y, kz, al, s) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const w = 1.2 * kz * s;
  const pts = [[x - w, y - w], [x, y - w * 1.08], [x + w, y - w], [x + w * 0.1, y - w * 0.1], [x - w, y + w], [x, y + w * 1.08], [x + w, y + w]];
  stroke(ctx, pts, 0.95 * kz * s, BUB.edge);
  stroke(ctx, pts, 0.42 * kz * s, '#f2fbff');
  ctx.restore();
}
function fx(sis) {
  const T = TW[sis];
  return (ctx, m, a, K) => {
    const sk = a.fk;
    if (!sk) return;
    const s = K.s;
    const t = a.t ?? 0;
    const alive = m.hp > 0;
    const unflip = Boolean(a.flip) !== Boolean(K.mirrored(a));
    const mouth = sk.inHead(7.1, 2.2);
    const A = a.mrAct;
    // (where her face is drawn, for the dev pages' close-ups: tools/zz-moraycheck.html)
    if (a.mo?.rig) a.mo.rig.mrHeadAt = sk.inHead(2.4, -3.2);
    ctx.save();
    // ----- the act's touches -----
    if (A && A.piece && A.cw > 0.01 && alive) {
      const u = A.u;
      const cw = A.cw;
      if (A.piece === 'gulp') {
        // little breath bubbles, then a bubble ring floating off
        for (let i = 0; i < 2; i++) {
          const q = (u * 0.5 + i * 0.5) % 1;
          if (u < 4) bubble(ctx, mouth[0] + 1.5 * s + q * 3 * s, mouth[1] - q * 12 * s, (0.5 + 0.3 * i) * s, Math.sin(Math.PI * q) * cw * 0.8);
        }
        if (A.rings >= 0) {
          const q = A.rings / 1.7;
          ringB(ctx, mouth[0] + (3 + q * 18) * s, mouth[1] - (1 + q * 10) * s, (1.4 + q * 1.6) * s, Math.sin(Math.PI * clamp(q, 0, 1)) * cw);
        }
      } else if (A.piece === 'primp' && sis === 'murri' && u > 4.2 && u < 5.2) {
        const c = sk.inHead(1.2, -11.5);
        sparkle(ctx, c[0], c[1], 2.2 * s * Math.sin(Math.PI * (u - 4.2)) * cw, '#ffffff');
      } else if (A.piece === 'primp' && sis === 'ena' && u > 0.5 && u < 2.2) {
        for (let i = 0; i < 3; i++) {
          const q = clamp((u - 0.5 - i * 0.25) / 1.0, 0, 1);
          const c = sk.inHead(-3 - q * 4, -1 + i * 2 - q * 3);
          bubble(ctx, c[0], c[1], 0.6 * s, Math.sin(Math.PI * q) * cw);
        }
      } else if (A.piece === 'peekaboo' && ((u > 2.1 && u < 2.8) || (u > 4.5 && u < 5.2))) {
        const q = u > 4 ? (u - 4.5) / 0.7 : (u - 2.1) / 0.7;
        const c = sk.inHead(2, -12);
        sparkle(ctx, c[0], c[1], 2 * s * Math.sin(Math.PI * q) * cw, '#ffffff');
      } else if (A.piece === 'loop' && u > 0.8 && u < 2.6) {
        const tail = sk.tail?.root ?? sk.pivot;
        for (let i = 0; i < 3; i++) {
          const q = ((u - 0.8) * 1.4 + i / 3) % 1;
          bubble(ctx, tail[0] - q * 4 * s, tail[1] - q * 8 * s, (0.5 + 0.25 * i) * s, Math.sin(Math.PI * q) * cw);
        }
      }
    }
    // ----- the moves -----
    const MV = a.mrMove;
    if (MV && alive) {
      const mv = MOVES[MV.name];
      const mt = MV.t;
      for (const t0 of mv.snap ?? []) {
        const u = (mt - t0) / 0.35;
        if (u < 0 || u > 1) continue;
        // the snap: a soft round "chomp" crescent and two sparkles at the mouth
        const c = add(mouth, [2.5 * s, 0]);
        ctx.save();
        ctx.globalAlpha *= 1 - u;
        ctx.strokeStyle = T.mark.edge;
        ctx.lineWidth = 1.3 * s * (1 - u * 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(c[0], c[1], (2.5 + u * 4) * s, -1.1, 1.1);
        ctx.stroke();
        ctx.restore();
        sparkle(ctx, c[0] + 3 * s, c[1] - 2.5 * s, 2.6 * s * (1 - u), '#ffffff');
        sparkle(ctx, c[0] + 3.5 * s, c[1] + 2.5 * s, 1.5 * s * (1 - u), rgba(T.C.lt, 1 - u));
      }
      if (mv.whisper) {
        const u = (mt - mv.whisper[0]) / 0.8;
        if (u > 0 && u < 1) for (let i = 0; i < 3; i++) bubble(ctx, mouth[0] + (2 + u * 10 + i * 2) * s, mouth[1] - (u * 4 + i) * s, (0.8 - i * 0.15) * s, 1 - u);
      }
      if (mv.huff) for (const t0 of mv.huff) {
        const u = (mt - t0) / 0.4;
        if (u > 0 && u < 1) {
          const c = sk.inHead(-1, -9);
          for (const dx of [-1, 1]) bubble(ctx, c[0] + dx * (1.5 + u * 4) * s, c[1] - u * 5 * s, 0.9 * s, 1 - u);
        }
      }
      if (mv.swirl && mt > mv.swirl[0] && mt < mv.swirl[1]) {
        const u = (mt - mv.swirl[0]) / (mv.swirl[1] - mv.swirl[0]);
        const c = sk.pivot;
        for (let i = 0; i < 6; i++) {
          const q = (i / 6) * TAU + u * 9;
          bubble(ctx, c[0] + Math.cos(q) * 16 * s, c[1] + Math.sin(q) * 7 * s, 0.8 * s, Math.sin(Math.PI * u));
        }
      }
    }
    // the cast's wind-up cue: bubbles gathering at her mouth as the cast nears its end
    const C = a.mrCast;
    if (C && alive && C.left < 0.9 && C.left > 0) {
      const w = 1 - C.left / 0.9;
      for (let i = 0; i < 3; i++) {
        const q = (i / 3) * TAU + t * 5;
        bubble(ctx, mouth[0] + Math.cos(q) * (5 - 3 * w) * s, mouth[1] + Math.sin(q) * (4 - 2.5 * w) * s, 0.7 * s, w * C.w);
      }
    }
    // a lunge: bubbles streaming off behind her
    if (a.mrLunge > 0.05 && alive) {
      const back = sk.tail?.root ?? sk.pos[sk.pos.length - 1];
      for (let i = 0; i < 5; i++) {
        const q = (t * 3 + i / 5) % 1;
        bubble(ctx, back[0] - sk.fwd[0] * q * 18 * s, back[1] - sk.fwd[1] * q * 18 * s - (i % 3 - 1) * 2 * s, (0.6 + (i % 2) * 0.4) * s, Math.sin(Math.PI * q) * a.mrLunge);
      }
    }
    // popping out of a burrow / ducking in: a burst of bubbles at the hole
    for (const [since, dur, n] of [[a.mrPop, 0.6, 9], [a.mrDive, 0.5, 6]]) {
      if (!(since >= 0 && since < dur)) continue;
      const u = since / dur;
      const c = [0, -12 * s];
      for (let i = 0; i < n; i++) {
        const q = (i / n) * TAU;
        bubble(ctx, c[0] + Math.cos(q) * (4 + u * 14) * s, c[1] + Math.sin(q) * (3 + u * 6) * s - u * 10 * s, (0.7 + (i % 3) * 0.3) * s, 1 - u);
      }
    }
    // ----- her marks (on her drawn head) -----
    const over = sk.inHead(1.5, -17.5);
    if (a.mrBang >= 0) mark(ctx, over[0], over[1], '!', a.mrBang, 1.2, s, unflip, T);
    else if (a.mrHuh >= 0) mark(ctx, over[0], over[1], '?', a.mrHuh, 1.4, s, unflip, T);
    if (a.mrGloat >= 0 && a.mrGloat < 1.1) mark(ctx, over[0] + a.mrGloat * 2 * s, over[1] - a.mrGloat * 3 * s, '*', a.mrGloat, 1.1, s, unflip, T);
    // hit: a few bubbles knocked off her head, a flinch sparkle
    if (a.mrHurt >= 0 && a.mrHurt < 0.55 && alive) {
      const u = a.mrHurt / 0.55;
      const c = sk.inHead(-1, -10);
      for (const [dx, dy] of [[-1, -0.6], [-0.3, -1.1], [0.5, -0.9]]) bubble(ctx, c[0] + dx * (2 + 6 * u) * s, c[1] + dy * (2 + 5 * u) * s, 0.8 * s, 1 - u);
      sparkle(ctx, c[0] + 3 * s, c[1] - 1 * s, 2 * s * (1 - u), rgba('#ffffff', 1 - u));
    }
    // tangled: stars circling over the knot
    if (a.mrKnot > 0.05 && alive) {
      const c = sk.inHead(0.5, -12.5);
      for (let i = 0; i < 3; i++) {
        const q = t * 3.2 + (i / 3) * TAU + (sis === 'ena' ? 1 : 0);
        sparkle(ctx, c[0] + Math.cos(q) * 5 * s, c[1] + Math.sin(q) * 1.6 * s, 1.5 * s * a.mrKnot, i % 2 ? rgba('#fff3c4', a.mrKnot) : rgba(T.C.lt, a.mrKnot));
      }
    }
    // asleep: soft z's drifting up, a bubble after each
    if (a.mrNap) {
      const c = sk.inHead(0.5, -12);
      for (let i = 0; i < 2; i++) {
        const q = ((a.now ?? t) * 0.4 + i * 0.5) % 1;
        ctx.save();
        ctx.translate(c[0] + q * 5 * s, c[1] - q * 8 * s);
        if (unflip) ctx.scale(-1, 1);
        zee(ctx, 0, 0, 0.6 + q * 0.5, Math.sin(Math.PI * q), s);
        ctx.restore();
        bubble(ctx, c[0] + q * 5 * s - 2 * s, c[1] - q * 8 * s + 2.2 * s, 0.5 * s, Math.sin(Math.PI * q) * 0.8);
      }
    }
    // beaten: little sparkles and a pearl circling over her head
    if (!alive) {
      const c = sk.inHead(0.5, -12);
      for (let i = 0; i < 3; i++) {
        const q = t * 3 + (i / 3) * TAU;
        const x = c[0] + Math.cos(q) * 4.5 * s;
        const y = c[1] + Math.sin(q) * 1.5 * s;
        if (i === 0) bubble(ctx, x, y, 0.9 * s, 1);
        else sparkle(ctx, x, y, 1.4 * s, i % 2 ? '#fff3c4' : '#ffffff');
      }
    }
    ctx.restore();
  };
}

// ---------- Her dress on the eel ----------
function dress(sis) {
  const T = TW[sis];
  const look = {
    P: {
      scale: 1.9,
      // (a moray: a big round head, a long soft body tapering to the tail)
      spine: [[13, 0, 9.0, 8.2], [8.0, 0, 9.6, 8.6], [3.0, 0.3, 6.8, 6.1], [-1.6, 0.5, 5.8, 5.2], [-6.2, 0.4, 5.2, 4.6], [-10.6, 0.2, 4.5, 3.9], [-14.8, 0, 3.7, 3.2], [-18.6, 0, 2.9, 2.5], [-22, 0, 2.1, 1.8], [-25, 0, 1.5, 1.3]],
      pivot: 2,
      // (the round blunt snout: from the chin up round the nose to the brow)
      front: { pts: [[1.4, 8.0], [3.6, 7.0], [5.6, 5.3], [6.9, 3.0], [7.5, 0.4], [7.3, -2.4], [6.4, -5.0], [4.7, -7.2], [2.3, -8.8]], tip: 4 },
      pec: { at: [8.6, 3.4], len: 3.2, w: 2.4, ang: 130, scull: 20, tuck: 160, out: 96 },
      // (the moray's long low frill down the whole back)
      sail: { s0: 9.5, s1: 37.5, h: 3.4, prof: [0.7, 0.9, 1, 1, 0.98, 0.95, 0.9, 0.86, 0.8, 0.74, 0.66, 0.58], up: 6, fan: 18, flat: 62, foldLen: 0.6, flutter: 8, inset: 1.2, scallop: 0.12 },
      tail: { kind: 'fan', len: 5.2, w: 1.5, spread: 34, notch: 0.86 },
      swim: { amp: 18, fin: 1.6, lag: 0.6, beats: 1.7, idle: 0.45, scull: 0.9, paddle: 18, recoil: 3, bob: 0.6, flutter: 4 },
      speed: 44,
      lean: 1,
      swimFins: -0.2,
      turn: [0.15, 0.5, 30],
      float: 4,
      playful: 0,
      moves: ['nip'],
    },
    C: T.C,
    CF: T.CF,
    CS: T.CS,
    inks: T.inks,
    ink: T.ink,
    fxC: { fill: BUB.fill, edge: BUB.edge, glint: '#ffffff', spark: rgba(T.C.deep, 0.8) },
    moves: MOVES,
    pleased: 'giggle',
    pick,
    bodyFill: bodyFill(T),
    paint: sis === 'ena' ? enaRibbon : null,
    face: face(sis),
    pose: (m, a, out, K, mv, mt) => pose(sis, m, a, out, K, mv, mt),
    spot: (sk, what) => (what === 'mouth' || what === 'nose' ? sk.inHead(7.1, 2.2) : null),
    over: sis === 'murri' ? { body: murriCrown } : { body: (ctx, a, mode, K) => {
      ctx.save();
      enaFrills(ctx, a, mode, K);
      ctx.restore();
      enaPearl(ctx, a, mode, K);
    } },
    fx: fx(sis),
  };
  const D = dressedEel(look);
  const rig = D.art.rig;
  const draw0 = rig.draw;
  // In her burrow (and the scene's hide and peekaboo), only the hole's mouth shows her: a clip the
  // shape of the burrow's arch (render/aquarium.js burrowArt), the floor its bottom. Her loops and
  // spins turn her whole (a tumble about her middle, never a squeeze).
  rig.draw = (ctx, m, a) => {
    // (a scene's act, m.cine.act from world/director.js, played as her own move)
    const ca = m.cine?.act;
    if (ca && MOVES[ca.move]) {
      if (m.act?.name !== ca.move || m.act?.at !== ca.at) m.act = { name: ca.move, at: ca.at, cine: true };
    } else if (m.act?.cine) m.act = null;
    const act = m.act && (m.act.name === 'hide' || m.act.name === 'peekaboo' || m.act.name === 'emerge') ? (a.now ?? 0) - m.act.at : -1;
    const hole = m.hp > 0 && (Boolean(m.burrowed) || (act >= 0 && (m.act.name !== 'emerge' || act < 0.3)));
    if (hole) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-26, 3);
      ctx.lineTo(-26, -58);
      ctx.bezierCurveTo(-26, -86, 26, -86, 26, -58);
      ctx.lineTo(26, 3);
      ctx.closePath();
      ctx.clip();
      draw0(ctx, m, a);
      ctx.restore();
    } else draw0(ctx, m, a);
  };
  return { ...D, look };
}

export const MURRI = dress('murri');
export const ENA = dress('ena');
for (const D of [MURRI, ENA]) {
  // (`noHop`: none of the monster drawer's hops or idle notes over them; `ownEmotes`: their marks
  // drawn here, on their drawn heads)
  D.art.noHop = true;
  D.art.ownEmotes = true;
}
export const MORAY_LOOKS = { murri: MURRI.look, ena: ENA.look };
