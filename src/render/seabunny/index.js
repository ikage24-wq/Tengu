// The Sea Bunny Bellhop (2026-11-26, the Jelly Belle remade from scratch; the id `jellymaid` kept):
// Queen Coralie's bellhop, who runs the bubble lifts at the Coral Gate. A real sea bunny (Jorunna
// parva, a sea slug): a plump snow-white fluffy slug gliding on its foot. Its "ears" are its two
// rhinophores (cream, soft warm-grey rounded tips), its "bunny tail" the round gill puff on its back,
// a pom-pom it blows bubbles from (the bubble lift). It wears the palace livery: a tiny coral-pink
// bellhop pillbox cap with a gold band and a PEARL button on top, perched jauntily, pinned between
// its ears. Eager, over-polite, far too keen to help ("Going up!"), and always hoping
// for a tip. It moves on its own copy of the snail (slugbase.js: the shell taken off, a soft fluffy
// mantle in its place, ears and a tail of its own).
//   idle    its act, in four pieces, each whole in itself (the next one that fits the time it has
//           to stand, m.restUntil; data `rest`):
//           - "Going up!": it puffs its tail and blows a round bubble from it that rises; it watches
//             it go, ears up, and gives it a proud ear-salute; the bubble pops, a happy bounce;
//           - the tip: it perks up, looks left, looks right, expecting a tip from someone...
//             nobody; its ears droop, a tiny sigh, then it perks straight back up;
//           - the cap: a shimmy knocks its cap sideways onto one ear; a sheepish buck-tooth grin, a
//             wiggle, and it flicks the cap back straight with an ear, pleased;
//           - the groom: a happy shake that fluffs it up, soft fluff puffs drifting off, proud.
//   moves   (def.moves, in turn) Ear Whap: both ears swung back, then whipped forward in a soft
//           white swoosh. Bellhop Bump: it backs up, then glides forward fast, belly first, a soft
//           fluff burst on contact. Cap Flip: the cap flicked off by an ear, spinning a short arc
//           in front at head height, and caught back on its head.
//   faces   its own: big round glossy dark-cocoa button eyes set wide (a big round glint and a
//           small one, a neat short lash line on top, the whole eye always open awake), soft round
//           brows, pink blush, a tiny bunny "w" mouth that opens, and a single buck tooth for
//           funny moments; eager, puffed, awed, proud, talking, happy, sad, blank, wide, sheepish,
//           keen (fierce), shouting, a wince, asleep, dizzy, worried, cross.
//   emotes  all its own (ownEmotes): a "!" bubble as it starts hunting you, a "?" bubble when it
//           loses you, a ding-ding bellhop note after landing a hit, little bubbles off its head and
//           its ears flattened when hurt, a sweat bead when low, z's asleep (curled under its own
//           ears), and dizzy swirls and sparkles when it's beaten.
// Everything here drawn from scratch; the cap is its own prop.
import { dressedSlug } from './slugbase.js';

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
  if (al <= 0.005) return;
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
// a pop in with a little overshoot, held, then out (e: seconds since it began; len: how long)
const pop = (e, len) => {
  if (e < 0 || e > len) return 0;
  const k = e < 0.22 ? 1 + 0.18 * Math.sin(Math.PI * (e / 0.22)) * (e / 0.22) - (1 - sstep(e / 0.14)) : 1;
  return Math.max(0, k) * (1 - sstep((e - (len - 0.25)) / 0.25));
};

// ---------- Its colours ----------
const SB = {
  C: { lt: '#ffffff', base: '#f9f7ff', sh: '#dbd3f0', deep: '#c1b5df' },
  CE: { base: '#fff3df', sh: '#f0dbbd', tip: '#b4a59c', tipLt: '#d3c7be' },
  CT: { lt: '#ffffff', base: '#fffaf6', sh: '#e2d6ec' },
  ink: '#a597c9',
  inkE: '#c4a78b',
  eye: { top: '#331e18', mid: '#4a2c22', bot: '#7a4a38', lash: '#3a221d', low: '#c8a2c4' },
  cap: { lt: '#ffc6cf', base: '#ff91a6', sh: '#e66f89', ink: '#cf6a82', strap: '#e0758d' },
  gold: { lt: '#fff0b8', base: '#f4c55c', sh: '#d29c3e' },
  pearl: { lt: '#ffffff', base: '#f7f2ff', sh: '#d6cbe9' },
  blush: '#ff9cb6',
  brow: '#b9a3c2',
  mouth: '#8f5168',
  inside: '#a24d6a',
  tongue: '#ff9fb4',
  bubble: { rim: '#9fd8ec', fill: '#e8f8ff' },
};

// ---------- Its faces ----------
// Targets for a mood: shut (which closed shape, or none), brow tilt (+ knit, - worried) and raise,
// the mouth's width, smile (-1 frown, 1 smile), openness, the buck tooth, blush, glints (sparkle).
const FACES = {
  calm: { shut: null, bt: 0, by: 0, mw: 0.8, ms: 0.55, mo: 0, te: 0, bl: 0.55, gl: 1 },
  eager: { shut: null, bt: -0.25, by: 0.55, mw: 1.0, ms: 1, mo: 0.45, te: 0, bl: 0.8, gl: 1.3 },
  puff: { shut: null, bt: 0.15, by: 0.25, mw: 0.45, ms: 0.15, mo: 0, te: 0, bl: 1, gl: 1 },
  awe: { shut: null, bt: -0.25, by: 0.85, mw: 0.5, ms: 0.25, mo: 0.6, te: 0, bl: 0.7, gl: 1.25 },
  proud: { shut: null, bt: 0.1, by: 0.3, mw: 1.0, ms: 1, mo: 0.12, te: 0, bl: 0.85, gl: 1.15 },
  talk: { shut: null, bt: -0.1, by: 0.35, mw: 0.9, ms: 0.6, mo: 0.5, te: 0, bl: 0.7, gl: 1.1 },
  happy: { shut: 'happy', bt: -0.2, by: 0.45, mw: 1.1, ms: 1, mo: 0.6, te: 0, bl: 0.9, gl: 1 },
  content: { shut: 'happy', bt: -0.1, by: 0.3, mw: 1.0, ms: 1, mo: 0, te: 0, bl: 0.8, gl: 1 },
  sad: { shut: null, bt: -0.85, by: 0.2, mw: 0.6, ms: -0.6, mo: 0, te: 0, bl: 0.4, gl: 0.85 },
  blank: { shut: null, bt: -0.2, by: 0.3, mw: 0.5, ms: 0, mo: 0, te: 0, bl: 0.5, gl: 1 },
  wide: { shut: null, bt: -0.45, by: 1, mw: 0.5, ms: 0, mo: 0.75, te: 0, bl: 0.6, gl: 0.8 },
  sheepish: { shut: null, bt: -0.55, by: 0.4, mw: 1.0, ms: 0.85, mo: 0, te: 1, bl: 1, gl: 1 },
  fierce: { shut: null, bt: 0.75, by: -0.15, mw: 0.85, ms: 0.25, mo: 0.15, te: 0, bl: 0.6, gl: 1.1 },
  shout: { shut: null, bt: 0.65, by: 0, mw: 0.9, ms: 0.4, mo: 0.9, te: 0, bl: 0.65, gl: 1.1 },
  wince: { shut: 'squeeze', bt: -0.6, by: 0, mw: 1.0, ms: -0.4, mo: 0.4, te: 0, bl: 0.8, gl: 1 },
  sleep: { shut: 'sleep', bt: -0.1, by: 0, mw: 0.5, ms: 0.3, mo: 0.15, te: 0, bl: 0.55, gl: 1 },
  dizzy: { shut: 'dizzy', bt: -0.4, by: 0.2, mw: 0.7, ms: -0.4, mo: 0.45, te: 0, bl: 0.4, gl: 1 },
  worried: { shut: null, bt: -0.7, by: 0.4, mw: 0.6, ms: -0.3, mo: 0.15, te: 0, bl: 0.5, gl: 1 },
  cross: { shut: null, bt: 0.9, by: -0.25, mw: 0.7, ms: -0.4, mo: 0, te: 0, bl: 0.55, gl: 1 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const FKEYS = ['bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl', 'gl'];
// vowel mouths for talking ("Going up!"): [width, smile, open], each held a beat, eased into the next
const VOWELS = [[0.6, 0.3, 0.75], [1.1, 0.6, 0.55], [0.8, 0.5, 0.2], [1.0, 0.7, 0.7], [0.55, 0.3, 0.45]];

// ---------- Its act: four pieces, each whole in itself ----------
const PIECES = { lift: 8.4, tip: 7.2, cap: 6.6, groom: 6.0 };
const ORDER = ['lift', 'tip', 'cap', 'groom'];
const NONE = { perk: 0, inhale: 0, puff: 0, blow: 0, bub: -1, watch: 0, salute: 0, talk: 0, cheer: 0, peekL: 0, peekR: 0, droop: 0, sigh: -1, bounce: 0, shimmy: 0, capOff: 0, capHop: 0, capWob: 0, oops: 0, wiggle: 0, flick: 0, nod: 0, brace: 0, shake: 0, fluff: -1, proud: 0, shine: -1, gleam: -1, face: 'calm', lookX: null, lookY: 0 };
function actAt(name, u) {
  const A = { ...NONE, piece: name, u };
  // (the breath after a piece: just standing, its easy face)
  if (u > PIECES[name]) return A;
  if (name === 'lift') {
    // "Going up!": ears up, a breath in, the tail puffed, a bubble blown from it
    A.perk = win(u, 0.1, 0.5, 7.2, 8.0);
    A.inhale = win(u, 0.6, 1.3, 1.6, 2.0);
    A.puff = win(u, 0.8, 1.6, 2.3, 2.9);
    A.blow = win(u, 1.55, 1.7, 2.25, 2.5);
    A.bub = u >= 1.7 && u < 6.6 ? u - 1.7 : -1;
    // watching it rise (head up, eyes after it), a proud ear-salute, "Going up!"
    A.watch = win(u, 2.3, 2.8, 5.9, 6.4);
    A.talk = win(u, 2.95, 3.05, 3.75, 3.85);
    A.salute = win(u, 4.1, 4.4, 5.3, 5.7);
    // the bubble pops: a happy bounce
    A.cheer = win(u, 6.35, 6.5, 7.3, 7.8);
    A.face = u < 0.6 ? 'eager' : u < 2.4 ? 'puff' : u < 2.95 ? 'awe' : u < 3.85 ? 'talk' : u < 5.8 ? 'proud' : u < 6.35 ? 'awe' : u < 7.6 ? 'happy' : 'calm';
    if (A.watch > 0.05) {
      A.lookX = -0.55;
      A.lookY = -1;
    }
  } else if (name === 'tip') {
    // perked up, looking left, then right, for someone with a tip... nobody
    A.perk = win(u, 0.1, 0.4, 3.3, 3.6) + win(u, 4.85, 5.0, 6.3, 7.0);
    A.peekL = win(u, 0.9, 1.15, 1.65, 1.9);
    A.peekR = win(u, 1.9, 2.1, 2.65, 2.9);
    // the ears droop, a tiny sigh; then straight back up, eager as ever
    A.droop = win(u, 3.4, 3.95, 4.7, 4.9);
    A.sigh = u >= 3.95 && u < 5.0 ? u - 3.95 : -1;
    A.bounce = win(u, 4.85, 5.0, 5.2, 5.65);
    A.face = u < 0.9 ? 'eager' : u < 2.9 ? 'blank' : u < 3.4 ? 'blank' : u < 4.85 ? 'sad' : u < 6.6 ? 'eager' : 'calm';
    if (A.peekL > 0.05) A.lookX = -1;
    if (A.peekR > 0.05) A.lookX = 1;
    if (u >= 2.9 && u < 3.4) A.lookX = 0;
    if (A.droop > 0.05) A.lookY = 0.7;
  } else if (name === 'cap') {
    // a shimmy knocks the cap sideways onto an ear
    A.shimmy = win(u, 0.4, 0.6, 1.3, 1.5);
    A.capOff = sstep((u - 1.1) / 0.3) * (1 - sstep((u - 4.05) / 0.4));
    A.oops = win(u, 1.4, 1.5, 2.0, 2.2);
    // a sheepish look up at it (the buck tooth), a wiggle that only jiggles it, the ear flick
    A.wiggle = win(u, 2.9, 3.1, 3.75, 3.95);
    A.capWob = A.wiggle * Math.sin(u * 11) * 0.16;
    A.flick = win(u, 3.85, 4.05, 4.25, 4.6);
    A.capHop = Math.sin(Math.PI * clamp((u - 4.05) / 0.4, 0, 1)) * 2.4;
    A.nod = win(u, 4.5, 4.7, 5.6, 6.1);
    A.gleam = u >= 4.55 && u < 5.35 ? (u - 4.55) / 0.8 : -1;
    A.face = u < 0.4 ? 'calm' : u < 1.4 ? 'happy' : u < 2.1 ? 'wide' : u < 2.95 ? 'sheepish' : u < 3.9 ? 'fierce' : u < 4.6 ? 'eager' : u < 5.6 ? 'content' : 'proud';
    if (u >= 1.6 && u < 2.95) {
      A.lookX = -0.6;
      A.lookY = -0.9;
    }
  } else if (name === 'groom') {
    // a brace, a happy shake that fluffs it up, fluff puffs drifting off, proud
    A.brace = win(u, 0.4, 0.8, 0.95, 1.1);
    A.shake = win(u, 1.0, 1.2, 2.25, 2.6);
    A.fluff = u >= 1.35 && u < 4.6 ? u - 1.35 : -1;
    A.proud = win(u, 2.6, 2.95, 4.8, 5.4);
    A.perk = A.proud;
    A.shine = u >= 3.0 && u < 3.9 ? (u - 3.0) / 0.9 : -1;
    A.face = u < 1.0 ? 'eager' : u < 2.6 ? 'happy' : u < 5.2 ? 'proud' : 'calm';
  }
  return A;
}

// ---------- Its moves (channels: x in body heights, lift in px, angles in degrees; earA + ears
// swept back, - swung forward; earN the near ear's own swing forward; perk, droop, puff, lean) ----------
const MOVES = {
  // Ear Whap: both ears swung back hard, then whipped forward in a soft swoosh
  whap: {
    keys: [
      [0, { earA: 1.2, nAng: 14, head: -12, lean: -6, x: -0.05, crouch: 0.25 }],
      [0.07, { earA: -1.3, nAng: -12, head: 14, lean: 6, x: 0.1, crouch: 0 }, 'out'],
      [0.24, { earA: -1.05, nAng: -9, head: 10, lean: 4, x: 0.1 }, 'io'],
      [0.5, { earA: -0.3, nAng: -2, head: 3, lean: 1, x: 0.04 }, 'io'],
      [0.8, {}, 'io'],
    ],
    swoosh: [0.01, 0.34],
  },
  // Bellhop Bump: backs well up (the deepest wind-up), then glides in fast, belly first
  bump: {
    keys: [
      [0, { x: -0.26, crouch: 0.6, lean: -7, nAng: 10, head: -6, earA: 0.85, puff: 0.5 }],
      [0.1, { x: 0.5, crouch: 0, lean: -3, nAng: 16, head: -10, earA: 1.0, lift: 0.6 }, 'out'],
      [0.18, { x: 0.44, lean: 4, nAng: 6, head: -2, earA: 0.3, lift: 0 }, 'out'],
      [0.52, { x: 0.28, lean: 1, nAng: 2, earA: 0.1 }, 'io'],
      [0.95, {}, 'io'],
    ],
    burst: 0.1,
    trail: [-0.05, 0.6],
  },
  // Cap Flip: the near ear curled under the brim, then flicked: the cap spins out and comes back
  capflip: {
    keys: [
      [0, { earN: 1.0, nAng: 8, head: -8, lean: -3, crouch: 0.2 }],
      [0.06, { earN: -0.85, nAng: -4, head: 6, lean: 3, crouch: 0 }, 'out'],
      [0.3, { earN: -0.3, nAng: 6, head: -9, perk: 0.6 }, 'io'],
      [0.52, { earN: 0.3, nAng: -6, head: 8, crouch: 0.3, perk: 0.3 }, 'io'],
      [0.72, { crouch: 0.05, perk: 0.4 }, 'io'],
      [1.0, {}, 'io'],
    ],
    fly: [0, 0.52],
  },
};
const POOL = ['whap', 'bump', 'capflip'];

// ---------- Its act, moods, face and cap (each frame, before drawing) ----------
function pose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const now = a.now ?? a.t ?? 0;
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const alive = m.hp > 0;
  const name = mv ? Object.keys(K.moves).find((n) => K.moves[n] === mv) : null;
  // (a hit only counts once it has happened: a time since it less than nothing, as when a stage
  // replays from the start with the last hit still remembered, is no hit at all)
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.55;
  const napping = alive && (m.pose === 'sleep' || m.cine?.mood === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const fighting = alive && ((m.aggroUntil ?? 0) > now || Boolean(m.engaged));
  const walkW = clamp(a.walkW ?? 0, 0, 1);
  const moving = Boolean(a.moving) || walkW > 0.15;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;
  const cine = m.cine?.mood;
  const go = (p, w) => {
    if (w > 0.001) for (const [c, v] of Object.entries(p)) out[c] = mix(out[c] ?? 0, v, w);
  };
  const add = (p, w) => {
    if (w > 0.001) for (const [c, v] of Object.entries(p)) out[c] = (out[c] ?? 0) + v * w;
  };
  let face = null;
  const say = (f, w) => {
    if (w > 0.4) face = f;
  };
  let lookX = 0;
  let lookY = 0;

  // Turning round: its eyes and ears go first (a look back the way it's turning, the ears stood up),
  // then the body flips; the look carried over the flip so it never jumps.
  const turning = alive && m.heading !== undefined && m.dir !== m.heading;
  const turnW = turning ? sstep((m.turnT ?? 0) / 0.12) : 0;
  st.sbTurn = mix(st.sbTurn ?? 0, turnW, k(turning ? 30 : 12));
  go({ perk: 0.9 }, st.sbTurn);
  add({ head: -4 }, st.sbTurn);

  // (just lost you: a puzzled look about under its "?" before anything else)
  const lostT = now - (st.sbLostAt ?? -9);
  const puzzled = alive && !fighting && lostT >= 0 && lostT < 1.4;
  // Calm: standing about with nothing else on (the act shows only then, fading in and out)
  const calmGoal = !mv && alive && !napping && !m.pose && !m.cine && !hurt && !fighting && !moving && !turning && !puzzled ? 1 : 0;
  st.sbCalm = mix(st.sbCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.sbCalm);
  // The piece it is playing: started as it settles; the next once one ends (a breath between), the
  // first in turn that fits the time it has (m.restUntil, from world/mobs.js); none when nothing
  // fits. Dropped once it's no longer calm, or the clock went back (a stage's replay).
  let PC = st.sbPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.4) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.sbN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.sbN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.25 };
        st.sbN = (st.sbN + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.sbPiece = PC;
  const A = PC && PC.name ? actAt(PC.name, now - PC.t0) : { ...NONE, piece: null, u: 0 };
  const u = A.u;
  if (cw > 0.001) {
    // "Going up!"
    go({ perk: 1 }, A.perk * cw);
    add({ lift: 0.7, nAng: 4, head: -3 }, A.inhale * cw);
    go({ puff: 1.1 }, A.puff * cw);
    add({ puff: 0.18 * Math.sin(u * 22), tail: 0.25 * Math.sin(u * 22) }, A.blow * cw);
    add({ nAng: 13, head: -12, lean: -3 }, A.watch * cw);
    go({ earN: 1.15 }, A.salute * cw);
    add({ lift: 0.9 * Math.abs(Math.sin((u - 6.35) * 9)) }, A.cheer * cw);
    // the tip
    add({ earA: 0.25, head: 4, lean: -2 }, A.peekL * cw);
    add({ earA: -0.2, head: -2, lean: 3, x: 0.02 }, A.peekR * cw);
    go({ droop: 0.95, perk: 0 }, A.droop * cw);
    add({ nAng: -10, head: 9, crouch: 0.4, lean: -1 }, A.droop * cw);
    add({ lift: 1.3 }, A.bounce * cw);
    // the cap
    add({ lean: 5 * Math.sin(u * 13), x: 0.015 * Math.sin(u * 13 + 0.6), lift: 0.35 * Math.abs(Math.sin(u * 13)) }, A.shimmy * cw);
    add({ nAng: 6, head: -6, lift: 0.4 }, A.oops * cw);
    add({ head: 6 * Math.sin(u * 11), lean: 2.5 * Math.sin(u * 11 + 0.5) }, A.wiggle * cw);
    add({ earN: 1.3, nAng: 4 }, A.flick * cw);
    add({ head: 5 * Math.max(0, Math.sin((u - 4.5) * 6)), nAng: 6 }, A.nod * cw);
    // the groom
    add({ crouch: 0.35 }, A.brace * cw);
    add({ lean: 6 * Math.sin(u * 30), head: 7 * Math.sin(u * 30 + 1), earA: 0.45 * Math.sin(u * 30 + 0.4), x: 0.012 * Math.sin(u * 30 + 2), tail: 0.6 * Math.sin(u * 30 + 1.4), lift: 0.4 }, A.shake * cw);
    add({ nAng: 10, head: -8, lift: 0.4 }, A.proud * cw);
    if (cw > 0.5) {
      face = A.face;
      if (A.lookX !== null) lookX = A.lookX;
      lookY = A.lookY;
    }
  }
  // Going about: keen, its ears streaming back a touch; hunting you: keen and leaning in.
  if (alive && !mv && !napping) {
    if (moving) say(fighting ? 'fierce' : 'eager', walkW);
    else if (fighting && !hurt) {
      go({ perk: 0.7 }, 1);
      add({ lean: 3, nAng: -2 }, 1);
      say('fierce', 1);
    }
  }
  if (fighting && alive) lookX = 0.45;
  if (puzzled && !mv && !moving) {
    say('blank', 1);
    lookX = clamp(Math.sin(lostT * 4.5) * 2, -1, 1);
    add({ head: 4 * Math.sin(lostT * 4.5), perk: 0.5 }, 1);
  }
  if (turning) lookX = -1;
  // The moves' faces.
  if (name === 'whap' || name === 'bump') face = mt < 0 ? 'fierce' : mt < 0.38 ? 'shout' : 'fierce';
  else if (name === 'capflip') {
    face = mt < 0 ? 'fierce' : mt < 0.5 ? 'awe' : 'proud';
    if (mt >= 0 && mt < 0.5) lookY = -0.6;
  } else if (name === 'hurt' || hurt) face = 'wince';
  // After landing a hit: a proud little bounce and an ear-salute, "ding-ding!" (eased in as a blow's
  // own pose lets go, never jumped to as the blow ends)
  const gl = now - (m.gloatAt ?? -9);
  const moveW = name && name !== 'hurt' ? (mt >= 0 ? 1 - sstep((mt - 0.45) / 0.4) : 1) : 0;
  if (alive && gl >= 0 && gl < 1.2 && !hurt) {
    const w = win(gl, 0, 0.15, 0.9, 1.2) * (1 - moveW);
    go({ perk: 1, earN: 1.1 }, w);
    add({ lift: 1.0 * Math.abs(Math.sin(gl * 8)), nAng: 6, head: -5 }, w);
    say('proud', w);
  }
  // Cutscene moods.
  if (alive && !mv && !hurt) {
    if (cine === 'happy') {
      say('happy', 1);
      go({ perk: 1 }, 1);
      add({ lift: 0.6 * Math.abs(Math.sin(now * 6)) }, 1);
    } else if (cine === 'sad') {
      say('sad', 1);
      go({ droop: 0.8 }, 1);
      add({ nAng: -8, head: 8 }, 1);
    } else if (cine === 'angry') say('cross', 1);
    else if (cine === 'talk' || m.talking) say('talk', 1);
  }
  // A nap: settled low, curled under its own ears (flopped forward over its cap), breathing slow.
  st.sbNap = mix(st.sbNap ?? 0, napping && !mv ? 1 : 0, k(napping ? 2.2 : 6));
  const nw = sstep(st.sbNap);
  if (nw > 0.001) {
    const br = Math.sin(now * 1.3);
    go({ crouch: 0.85, nAng: -12, head: 12, earA: -0.95, droop: 0, perk: 0, lean: -2, lift: br * 0.25, puff: 0.2 + br * 0.1 }, nw);
    if (nw > 0.5) face = 'sleep';
  }
  // Beaten: slumped flat, ears flopped back, its cap slipped.
  if (!alive) {
    go({ crouch: 1.1, lift: -0.3, nAng: -18, head: 16, droop: 1, earA: 0.4, perk: 0, lean: -5, x: 0, puff: 0, earN: 0, earF: 0 }, 1);
    face = 'dizzy';
  }
  // Its mood: the above, else low on health (worried), else calm.
  let mood = face ?? (low ? 'worried' : 'calm');
  if (m.faceTest && FACES[m.faceTest]) mood = m.faceTest;
  const F = FACES[mood];
  const f = (st.sbF ??= { bt: 0, by: 0, mw: 0.8, ms: 0.55, mo: 0, te: 0, bl: 0.55, gl: 1, shut: { happy: 0, sleep: 0, squeeze: 0, dizzy: 0 }, lx: 0, ly: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor(now * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const fast = k(14);
  for (const key of FKEYS) f[key] = mix(f[key], tgt[key], fast);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, k(16));
  // (its look, carried over a flip so it never jumps)
  if (st.sbFlip !== undefined && st.sbFlip !== a.flip) f.lx = -f.lx;
  st.sbFlip = a.flip;
  f.lx = mix(f.lx, lookX, k(turning ? 22 : 9));
  f.ly = mix(f.ly, lookY, k(9));
  // a blink now and then (never while a closed face is on)
  const bt = (now + (m.uid ?? 0) * 0.83) % 4.3;
  f.blink = F.shut ? 0 : win(bt, 4.05, 4.11, 4.17, 4.27);
  f.mood = mood;
  // The cap: on its seat; knocked onto its ear in the act; slipped when beaten; tipped asleep.
  st.sbCapK = mix(st.sbCapK ?? 0, Math.max(A.capOff * cw, alive ? 0 : 0.8), k(16));
  // (the hop back up only while it really is coming back, eased with the act)
  const cap = { k: st.sbCapK, hop: A.capHop * cw, wob: A.capWob * cw, nap: nw, fly: -1, antic: 0 };
  if (name === 'capflip' && alive) {
    if (mt >= 0 && mt < MOVES.capflip.fly[1]) cap.fly = mt;
    else if (mt < 0) cap.antic = sstep(1 + mt / 0.4);
  }
  // Its own marks: a "!" as it starts hunting you, a "?" when it loses you.
  if (fighting && alive && !st.sbHunt) st.sbBangAt = now;
  if (!fighting && st.sbHunt && alive) st.sbLostAt = now;
  st.sbHunt = fighting && alive;
  a.sb = {
    f, A, cw, cap, nw,
    bang: now - (st.sbBangAt ?? -9),
    huh: now - (st.sbLostAt ?? -9),
    gloat: alive ? gl : -1,
    hurtT: hurt ? ago : -1,
    low: low && !napping,
    name,
    mt,
  };
}

// ---------- Its face (head frame: x forward, y down; the head's middle at 0, 0) ----------
const EYE_N = [-0.4, 0.5];
const EYE_F = [4.7, 0.3];
const MOUTH = [2.2, 3.55];
// One button eye: `k` 1 the near eye, ~0.8 the far one (seen a little narrower, three-quarter on).
function eye(ctx, a, f, x0, y0, k, near) {
  const rx = 1.9 * k;
  const ry = 2.2;
  const x = x0 + f.lx * 0.5;
  const y = y0 + f.ly * 0.4;
  const ink = lit(a, SB.eye.lash);
  const t = a.t ?? 0;
  // closed: crossfading shapes as they come and go
  const shutW = Math.min(1, f.shut.happy + f.shut.sleep + f.shut.squeeze + f.shut.dizzy + f.blink);
  const outer = near ? -1 : 1;
  if (shutW > 0.01) {
    ctx.save();
    const draw = (w, fn) => {
      if (w <= 0.01) return;
      ctx.globalAlpha *= w;
      fn();
      ctx.globalAlpha /= w;
    };
    draw(f.shut.happy, () => {
      stroke(ctx, [[x - rx, y + 0.45], [x, y - ry * 0.85], [x + rx, y + 0.45]], 0.62, ink);
    });
    draw(f.shut.sleep + f.blink, () => {
      stroke(ctx, [[x - rx, y - 0.1], [x, y + ry * 0.55], [x + rx, y - 0.1]], 0.58, ink);
      stroke(ctx, [[x + outer * rx * 0.95, y - 0.05], [x + outer * rx * 1.3, y - 0.05], [x + outer * rx * 1.45, y - 0.45]], 0.4, ink);
    });
    draw(f.shut.squeeze, () => {
      stroke(ctx, [[x + outer * rx, y - ry * 0.6], [x - outer * rx * 0.1, y - ry * 0.1], [x - outer * rx * 0.8, y + 0.05]], 0.62, ink);
      stroke(ctx, [[x - outer * rx * 0.8, y + 0.05], [x - outer * rx * 0.1, y + ry * 0.2], [x + outer * rx, y + ry * 0.6]], 0.62, ink);
    });
    draw(f.shut.dizzy, () => {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.45;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const an = (i / 28) * TAU * 2.2 + t * 4 * (near ? 1 : -1);
        const r = (i / 28) * rx * 0.95;
        const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * (ry / rx)];
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      }
      ctx.stroke();
    });
    ctx.restore();
  }
  const openW = 1 - shutW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // the button: deep cocoa, warmer toward the bottom, a soft warm light low in it
  const g = ctx.createLinearGradient(x, y - ry, x, y + ry);
  g.addColorStop(0, lit(a, SB.eye.top));
  g.addColorStop(0.55, lit(a, SB.eye.mid));
  g.addColorStop(1, lit(a, SB.eye.bot));
  ell(ctx, x, y, rx, ry);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ell(ctx, x - f.lx * 0.3 * k, y + ry * 0.62, rx * 0.62, ry * 0.3);
  ctx.fillStyle = 'rgba(176,112,86,0.5)';
  ctx.fill();
  ctx.restore();
  // the glints: a big round one up and back, a small one low and forward (bigger when it sparkles)
  const gk = f.gl;
  ell(ctx, x - rx * 0.3, y - ry * 0.36, rx * 0.36 * gk, rx * 0.36 * gk);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + rx * 0.36, y + ry * 0.4, rx * 0.15 * gk, rx * 0.15 * gk);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  if (gk > 1.12) sparkle(ctx, x + rx * 0.38, y - ry * 0.45, 0.65 * (gk - 1) * 3, 'rgba(255,255,255,0.95)');
  // the lash line: a neat short arc over the top, one little flick at the outer corner
  ctx.strokeStyle = ink;
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 0.2, ry + 0.2, 0, Math.PI * (near ? 1.12 : 1.22), Math.PI * (near ? 1.78 : 1.88));
  ctx.stroke();
  const an = Math.PI * (near ? 1.12 : 1.88);
  const e0 = [x + Math.cos(an) * (rx + 0.2), y + Math.sin(an) * (ry + 0.2)];
  stroke(ctx, [e0, [e0[0] + outer * 0.55, e0[1] - 0.05], [e0[0] + outer * 0.85, e0[1] - 0.55]], 0.42, ink);
  // a soft lilac line under it
  ctx.strokeStyle = lit(a, SB.eye.low, 0.7);
  ctx.lineWidth = 0.28;
  ctx.beginPath();
  ctx.ellipse(x, y, rx + 0.35, ry + 0.35, 0, Math.PI * 0.3, Math.PI * 0.7);
  ctx.stroke();
  ctx.restore();
}
function face(ctx, a, sk, K) {
  const sb = a.sb;
  if (!sb) return;
  const f = sb.f;
  // the blush: soft pink ovals under the eyes
  ctx.save();
  for (const [bx, by, rx, ry, al] of [[-2.4, 3.3, 1.8, 1.0, 0.85], [6.7, 3.0, 1.3, 0.8, 0.75]]) {
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(1, ry / rx);
    glow(ctx, 0, 0, rx, SB.blush, al * f.bl);
    ctx.restore();
  }
  ctx.restore();
  eye(ctx, a, f, EYE_F[0], EYE_F[1], 0.8, false);
  eye(ctx, a, f, EYE_N[0], EYE_N[1], 1, true);
  // soft round brows: short dashes, tilted by the mood (+ knit toward the middle, - worried)
  const brow = (x, y, inner) => {
    const yy = y - 2.2 - 1.35 - f.by * 0.7;
    const yi = yy + f.bt * 0.55;
    const yo = yy - f.bt * 0.25;
    const [ya, yb] = inner < 0 ? [yi, yo] : [yo, yi];
    stroke(ctx, [[x - 0.8, ya], [x, Math.min(ya, yb) - 0.3], [x + 0.8, yb]], 0.6, lit(a, SB.brow));
  };
  brow(EYE_N[0] + f.lx * 0.3 - 0.1, EYE_N[1], 1);
  brow(EYE_F[0] + f.lx * 0.3, EYE_F[1], -1);
  // the mouth: a tiny bunny "w", opening below it; a single buck tooth in funny moments
  const [mx, my] = MOUTH;
  const w = 0.95 * f.mw;
  const lift = f.ms * 0.32;
  const wPath = () => {
    ctx.beginPath();
    ctx.moveTo(mx - w, my - 0.12 - lift);
    ctx.quadraticCurveTo(mx - w * 0.5, my + 0.55, mx, my + 0.02);
    ctx.quadraticCurveTo(mx + w * 0.5, my + 0.55, mx + w, my - 0.12 - lift);
  };
  if (f.mo > 0.06) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(mx - w * 0.82, my + 0.05 - lift * 0.5);
    ctx.quadraticCurveTo(mx - w * 0.45, my + 0.5, mx, my + 0.1);
    ctx.quadraticCurveTo(mx + w * 0.45, my + 0.5, mx + w * 0.82, my + 0.05 - lift * 0.5);
    ctx.bezierCurveTo(mx + w * 0.8, my + 0.6 + o * 1.5, mx - w * 0.8, my + 0.6 + o * 1.5, mx - w * 0.82, my + 0.05 - lift * 0.5);
    ctx.fillStyle = lit(a, SB.inside);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, mx, my + 0.5 + o * 1.25, w * 0.55, 0.25 + o * 0.45);
    ctx.fillStyle = lit(a, SB.tongue);
    ctx.fill();
    ctx.restore();
  }
  if (f.te > 0.04) {
    // the buck tooth, peeking out under the middle of the "w"
    ctx.save();
    ctx.globalAlpha *= clamp(f.te, 0, 1);
    ctx.beginPath();
    ctx.moveTo(mx - 0.38, my + 0.12);
    ctx.lineTo(mx + 0.38, my + 0.12);
    ctx.lineTo(mx + 0.38, my + 0.7);
    ctx.quadraticCurveTo(mx + 0.38, my + 0.95, mx, my + 0.95);
    ctx.quadraticCurveTo(mx - 0.38, my + 0.95, mx - 0.38, my + 0.7);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = lit(a, '#cbbbd6');
    ctx.lineWidth = 0.18;
    ctx.stroke();
    ctx.restore();
  }
  wPath();
  ctx.strokeStyle = lit(a, SB.mouth);
  ctx.lineWidth = 0.42;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// ---------- The cap: a tiny coral pillbox, a gold band, a pearl button on top ----------
// (its seat on the head, in the head's frame: its bottom middle, sunk a little into the fluff)
const SEAT = [0.9, -7.25];
const SEAT_R = 0.2;
const ON_EAR = [-4.2, -6.85];
const ON_EAR_R = -0.8;
// Where the cap is (the body's frame) and how it's turned.
function capPlace(a, sk, K) {
  const c = a.sb?.cap ?? { k: 0, hop: 0, wob: 0, nap: 0, fly: -1, antic: 0 };
  const seatW = K.headPt(sk, [SEAT[0] + 0.4 * c.nap, SEAT[1] + 0.15 * c.nap - 0.5 * c.antic]);
  const seatR = sk.ha + SEAT_R + 0.28 * c.nap - 0.08 * c.antic;
  if (c.fly >= 0) {
    // flicked off: out to the front at head height, spinning, then back over the top to its seat
    const hc = sk.hc;
    const rx = K.P.head.rx;
    const ry = K.P.head.ry;
    const t = c.fly;
    const P1 = [hc[0] + rx + 5, hc[1] - ry - 3.5];
    const P2 = [hc[0] + rx + 9.5, hc[1] - 1.2];
    const Q1 = [hc[0] + rx + 2.5, hc[1] - ry - 9];
    let p;
    if (t < 0.12) p = K.bez2(seatW, P1, P2, 1 - (1 - t / 0.12) ** 2);
    else p = K.bez2(P2, Q1, seatW, sstep((t - 0.12) / 0.4));
    return { p, r: seatR + TAU * 2 * sstep(t / 0.52), strap: 0, fly: true };
  }
  const q = [mix(SEAT[0], ON_EAR[0], c.k), mix(SEAT[1], ON_EAR[1], c.k) - c.hop];
  if (c.nap > 0) {
    q[0] += 0.4 * c.nap;
    q[1] += 0.15 * c.nap;
  }
  q[1] -= 0.5 * c.antic;
  return { p: K.headPt(sk, q), r: sk.ha + mix(SEAT_R, ON_EAR_R, c.k) + c.wob + 0.28 * c.nap - 0.08 * c.antic, strap: 1, fly: false };
}
function pillbox(ctx, a, mode, K) {
  const w = 2.8;
  const h = 3.0;
  ctx.beginPath();
  ctx.moveTo(-w, 0.2);
  ctx.lineTo(-w, -h + 0.4);
  ctx.quadraticCurveTo(-w, -h, -w + 0.5, -h);
  ctx.lineTo(w - 0.5, -h);
  ctx.quadraticCurveTo(w, -h, w, -h + 0.4);
  ctx.lineTo(w, 0.2);
  ctx.quadraticCurveTo(0, 0.75, -w, 0.2);
  ctx.closePath();
  K.addRing(ctx, [0, -h - 0.75], 0.95);
  if (mode === 'line') {
    ctx.strokeStyle = SB.cap.ink;
    ctx.lineWidth = 1.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = lit(a, SB.cap.base);
  ctx.fill('nonzero');
  ctx.save();
  ctx.beginPath();
  ctx.rect(-w, -h, w * 2, h + 1);
  ctx.clip();
  // lit down its front, shaded at its back; the top a lighter oval; the gold band
  glow(ctx, w * 0.35, -h * 0.55, 2.6, SB.cap.lt, 0.85);
  glow(ctx, -w * 0.9, -h * 0.4, 2.2, SB.cap.sh, 0.6);
  ell(ctx, 0, -h + 0.05, w - 0.25, 0.62);
  ctx.fillStyle = lit(a, SB.cap.lt, 0.9);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-w, -0.95);
  ctx.quadraticCurveTo(0, -0.45, w, -0.95);
  ctx.lineTo(w, 0.3);
  ctx.quadraticCurveTo(0, 0.85, -w, 0.3);
  ctx.closePath();
  ctx.fillStyle = lit(a, SB.gold.base);
  ctx.fill();
  ctx.strokeStyle = lit(a, SB.gold.lt);
  ctx.lineWidth = 0.32;
  ctx.beginPath();
  ctx.moveTo(-w + 0.3, -0.62);
  ctx.quadraticCurveTo(0, -0.12, w - 0.3, -0.62);
  ctx.stroke();
  glow(ctx, -w * 0.85, -0.3, 1.2, SB.gold.sh, 0.7);
  ctx.restore();
  // the pearl button on top
  const pg = ctx.createRadialGradient(-0.3, -h - 1.05, 0.1, 0, -h - 0.75, 0.95);
  pg.addColorStop(0, lit(a, SB.pearl.lt));
  pg.addColorStop(0.6, lit(a, SB.pearl.base));
  pg.addColorStop(1, lit(a, SB.pearl.sh));
  ell(ctx, 0, -h - 0.75, 0.95, 0.95);
  ctx.fillStyle = pg;
  ctx.fill();
  ell(ctx, -0.32, -h - 1.05, 0.28, 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
function capLayer(ctx, a, mode, K) {
  const sk = a.bk;
  if (!sk) return;
  const c = capPlace(a, sk, K);
  // (no chin strap, 2026-11-26 review: a thin line on the white fluff read as a crack; the cap sits
  // pinned between the ears)
  ctx.save();
  ctx.translate(...c.p);
  ctx.rotate(c.r);
  pillbox(ctx, a, mode, K);
  ctx.restore();
}

// ---------- Its effects (all its own: soft shapes, a darker shade of their own colour as outline,
// white cores, curvy sparkles, round bubbles with a glint) ----------
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(232,248,255,0.45)';
  ctx.fill();
  ctx.strokeStyle = SB.bubble.rim;
  ctx.lineWidth = Math.max(0.3, r * 0.16);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = Math.max(0.25, r * 0.14);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, Math.PI * 1.08, Math.PI * 1.42);
  ctx.stroke();
  ell(ctx, x + r * 0.35, y + r * 0.38, r * 0.12, r * 0.12);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}
// a soft fluff puff: three round lobes, white, a soft lilac edge
function fluffPuff(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (const [dx, dy, r] of [[0, 0, 1.0], [-0.85, 0.35, 0.72], [0.85, 0.3, 0.75]]) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  ctx.strokeStyle = SB.ink;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fill('nonzero');
  ctx.restore();
}
// a music note (round head, a stem with a flag), soft-edged
function note(ctx, x, y, s, al, col, edge) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [c, w] of [[edge, 1.1], [col, 0]]) {
    ell(ctx, x, y, 1.05 * s + w * 0.3, 0.8 * s + w * 0.3, -0.4);
    ctx.fillStyle = c;
    ctx.fill();
    stroke(ctx, [[x + 0.95 * s, y - 0.1 * s], [x + 0.95 * s, y - 1.8 * s], [x + 0.95 * s, y - 3.4 * s]], 0.45 * s + w * 0.6, c);
    stroke(ctx, [[x + 0.95 * s, y - 3.4 * s], [x + 2.1 * s, y - 2.9 * s], [x + 2.0 * s, y - 1.8 * s]], 0.45 * s + w * 0.6, c);
  }
  ctx.restore();
}
// The marks' bubble: a round sea bubble over its head, a glyph drawn in it, two little bubbles
// trailing down to its head.
function markBubble(ctx, a, x, y, e, len, kind) {
  const s = pop(e, len);
  if (s <= 0.01) return;
  const col = kind === '!' ? '#ff6f8f' : '#9a86cc';
  ctx.save();
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.scale(s, s);
  bubble(ctx, -3.2, 5.2, 0.7, 1);
  bubble(ctx, -1.9, 3.9, 0.95, 1);
  ell(ctx, 0, 0, 4.1, 4.1);
  ctx.fillStyle = 'rgba(250,253,255,0.95)';
  ctx.fill();
  ctx.strokeStyle = kind === '!' ? '#ffb3c3' : '#c8bce8';
  ctx.lineWidth = 0.75;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, 0, 3.0, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
  if (kind === '!') {
    ctx.beginPath();
    ctx.moveTo(-0.55, -2.4);
    ctx.lineTo(0.55, -2.4);
    ctx.lineTo(0.3, 0.6);
    ctx.quadraticCurveTo(0, 0.9, -0.3, 0.6);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
    ell(ctx, 0, 1.75, 0.62, 0.62);
    ctx.fill();
  } else {
    stroke(ctx, [[-1.25, -1.2], [-1.1, -2.6], [0.2, -2.6], [1.5, -2.4], [1.2, -1.2], [1.0, -0.4], [0.05, 0.05], [-0.05, 0.3], [0, 0.65]], 0.85, col);
    ell(ctx, 0, 1.8, 0.58, 0.58);
    ctx.fillStyle = col;
    ctx.fill();
  }
  ctx.restore();
}
// a soft "z", lilac with a white edge (never mirrored)
function zee(ctx, a, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.globalAlpha *= al;
  for (const [c, w] of [['#ffffff', 1.25], ['#9d8ccc', 0.55]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w * s;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.9 * s, -0.9 * s);
    ctx.quadraticCurveTo(0, -1.05 * s, 0.9 * s, -0.9 * s);
    ctx.lineTo(-0.9 * s, 0.9 * s);
    ctx.quadraticCurveTo(0, 1.05 * s, 0.9 * s, 0.9 * s);
    ctx.stroke();
  }
  ctx.restore();
}
function fx(ctx, m, a, S, K) {
  const sk = a.bk;
  const sb = a.sb;
  if (!sk || !sb) return;
  const t = a.t ?? 0;
  const rx = K.P.head.rx;
  const ry = K.P.head.ry;
  const hp = (p) => K.headPt(sk, p);
  ctx.save();
  const A = sb.A;
  const cw = sb.cw;
  // ---- the act ----
  if (cw > 0.01 && m.hp > 0) {
    // the lift bubble: blown up out of its tail, rising and wobbling, popped in a sparkle
    if (A.bub >= 0) {
      const tl = sk.tail;
      const top = K.add(tl.c, K.mul(K.unit(tl.ang), 2.6 + 0.3 * tl.puff));
      const b = A.bub;
      const grow = sstep(b / 0.7);
      const rise = sstep((b - 0.7) / 3.9);
      const r = 0.6 + 2.2 * grow;
      const x = top[0] + Math.sin(b * 2.3) * 1.3 * rise - rise * 2;
      const y = top[1] - r * 0.85 - rise * 14;
      const popK = clamp((b - 4.6) / 0.3, 0, 1);
      if (popK < 1) bubble(ctx, x, y, r, cw * (1 - popK));
      if (popK > 0) {
        for (let i = 0; i < 5; i++) {
          const q = i * 1.26 + 0.3;
          const d = r + 2.6 * sstep(popK);
          sparkle(ctx, x + Math.cos(q) * d, y + Math.sin(q) * d, 0.9 * (1 - popK) * cw, i % 2 ? '#bfeaff' : '#ffffff');
        }
        sparkle(ctx, x, y, 2.2 * Math.sin(Math.PI * popK) * cw, '#ffffff');
      }
    }
    // the sigh: one small soft bubble out of its mouth, drifting forward and down
    if (A.sigh >= 0) {
      const mo = hp([2.6, 4.4]);
      const v = A.sigh / 1.05;
      bubble(ctx, mo[0] + 1.5 + v * 3.5, mo[1] + 0.6 + v * 1.4 - Math.sin(Math.PI * v) * 1.2, 0.55 + 0.35 * v, Math.sin(Math.PI * v) * cw);
    }
    // the pearl's gleam, once the cap is back straight
    if (A.gleam >= 0) {
      const c = capPlace(a, sk, K);
      const pp = [c.p[0] + Math.sin(c.r) * 3.75, c.p[1] - Math.cos(c.r) * 3.75];
      sparkle(ctx, pp[0] - 0.4, pp[1] - 0.6, 2.0 * Math.sin(Math.PI * A.gleam) * cw, '#ffffff');
      sparkle(ctx, pp[0] + 1.8, pp[1] - 1.6, 0.9 * Math.sin(Math.PI * clamp(A.gleam * 1.4 - 0.2, 0, 1)) * cw, '#fff3c6');
    }
    // fluff puffs drifting off the shake
    if (A.fluff >= 0) {
      for (let i = 0; i < 5; i++) {
        const v = clamp((A.fluff - i * 0.18) / 2.6, 0, 1);
        if (v <= 0 || v >= 1) continue;
        const from = i % 2 ? K.add(sk.mc, [-6 + i * 2.2, -6.5]) : hp([-5 + i * 2.5, -5.5]);
        const side = i % 2 ? -1 : 1;
        fluffPuff(ctx, from[0] + side * (1.5 + v * 4.5) + Math.sin(v * 6 + i) * 0.8, from[1] - v * 8, 0.75 + 0.35 * v, Math.sin(Math.PI * v) * 0.95 * cw);
      }
    }
    // its fur's shine after the groom: a soft sparkle sliding over its back
    if (A.shine >= 0) {
      const p = K.add(sk.mc, [-6 + A.shine * 10, -7.2 + Math.sin(A.shine * Math.PI) * -1.2]);
      sparkle(ctx, p[0], p[1], 1.8 * Math.sin(Math.PI * A.shine) * cw, '#ffffff');
      sparkle(ctx, p[0] + 2.4, p[1] - 2, 0.8 * Math.sin(Math.PI * A.shine) * cw, '#f3eaff');
    }
  }
  // ---- the moves ----
  const mv = a.shMove;
  if (mv && m.hp > 0) {
    const tt = mv.t;
    if (mv.mv === MOVES.whap) {
      // a soft white swoosh following the ears' tips round the front
      const [s0, s1] = MOVES.whap.swoosh;
      const kk = (tt - s0) / (s1 - s0);
      if (kk > 0 && kk < 1) {
        const e = sk.ears.N;
        const c = K.mix(e.root, sk.ears.F.root, 0.5);
        const R = e.L + 1.2;
        const now = Math.atan2(e.tip[1] - c[1], e.tip[0] - c[0]);
        const from = now - 2.1 * (1 - kk * 0.6);
        const al = Math.sin(Math.PI * Math.min(1, kk * 1.6)) * (1 - kk);
        ctx.lineCap = 'round';
        for (const [col, w] of [[SB.ink, 3.0], ['#ffffff', 2.1], ['#f4f0ff', 0.9]]) {
          ctx.globalAlpha = al * 0.9;
          ctx.strokeStyle = col;
          ctx.lineWidth = w * (1 - kk * 0.5);
          ctx.beginPath();
          ctx.arc(c[0], c[1], R, from, now - 0.1);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        const tipP = [c[0] + Math.cos(now) * R, c[1] + Math.sin(now) * R];
        sparkle(ctx, tipP[0] + 1, tipP[1], 1.6 * al, '#ffffff');
      }
    } else if (mv.mv === MOVES.bump) {
      // a soft fluff burst at its front on contact
      const kk = (tt - MOVES.bump.burst) / 0.5;
      if (kk > 0 && kk < 1) {
        const c = [sk.xf + 1.5, -8.5];
        const e = 1 - (1 - kk) ** 3;
        for (let i = 0; i < 6; i++) {
          const q = -1.5 + i * 0.62;
          const d = 2 + 6 * e;
          fluffPuff(ctx, c[0] + Math.cos(q) * d * 0.8, c[1] + Math.sin(q) * d, 0.6 + 0.5 * (1 - kk), (1 - kk) * 0.95);
        }
        sparkle(ctx, c[0] + 2, c[1], 2.8 * (1 - kk), '#ffffff');
        sparkle(ctx, c[0] + 4.5 * e, c[1] - 4 * e, 1.2 * (1 - kk), '#ffd9e2');
        sparkle(ctx, c[0] + 4 * e, c[1] + 4 * e, 1.0 * (1 - kk), '#fff3c6');
      }
    } else if (mv.mv === MOVES.capflip) {
      // the cap's spin: a soft trail of little sparkles; a "ding" where it lands its blow
      if (tt >= 0 && tt < 0.52) {
        const c = capPlace(a, sk, K);
        for (let i = 1; i <= 3; i++) {
          const q = clamp(tt - i * 0.035, 0, 0.52);
          const save = sb.cap.fly;
          sb.cap.fly = q;
          const p = capPlace(a, sk, K).p;
          sb.cap.fly = save;
          sparkle(ctx, p[0], p[1] - 1.5, (1.1 - i * 0.25) * Math.sin(Math.PI * (tt / 0.52)), i % 2 ? '#ffd9e2' : '#ffffff');
        }
        const kk = (tt - 0.1) / 0.32;
        if (kk > 0 && kk < 1) {
          const e = 1 - (1 - kk) ** 3;
          ctx.globalAlpha = (1 - kk) * 0.85;
          ctx.strokeStyle = '#ffd3dc';
          ctx.lineWidth = 1.2 * (1 - kk) + 0.3;
          ctx.beginPath();
          ctx.arc(c.p[0], c.p[1] - 1.5, 2 + 6 * e, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
          sparkle(ctx, c.p[0] + 1, c.p[1] - 2, 2.4 * (1 - kk), '#ffffff');
        }
      }
    }
  }
  // ---- its own marks, on its drawn head ----
  const mark = hp([10.2, -11.8]);
  if (m.hp > 0) {
    if (sb.bang >= 0 && sb.bang < 1.1) markBubble(ctx, a, mark[0], mark[1], sb.bang, 1.1, '!');
    else if (sb.huh >= 0 && sb.huh < 1.4) markBubble(ctx, a, mark[0], mark[1], sb.huh, 1.4, '?');
    // after landing a hit: "ding-ding!", two little bellhop notes popping up
    if (sb.gloat >= 0 && sb.gloat < 1.2) {
      for (const [d0, dx] of [[0.05, 0], [0.38, 3.4]]) {
        const e = sb.gloat - d0;
        if (e < 0 || e > 0.8) continue;
        const v = e / 0.8;
        const p = hp([4 + dx + v * 2, -ry - 4 - v * 6]);
        note(ctx, p[0], p[1], 0.85, Math.sin(Math.PI * Math.min(1, v * 1.3)), dx ? '#f4b545' : '#ff7f9c', '#ffffff');
        const rk = clamp(e / 0.3, 0, 1);
        if (rk < 1) {
          ctx.globalAlpha = (1 - rk) * 0.8;
          ctx.strokeStyle = '#ffe3a0';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(p[0], p[1] - 1, 1.2 + rk * 3.2, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
    }
    // hurt: three little bubbles knocked off its head
    if (sb.hurtT >= 0 && sb.hurtT < 0.55) {
      const v = sb.hurtT / 0.55;
      for (let i = 0; i < 3; i++) {
        const q = -2.2 + i * 0.5;
        const p = hp([-2 + i * 1.5, -ry + 1]);
        bubble(ctx, p[0] + Math.cos(q) * (1 + v * 5), p[1] + Math.sin(q) * (1 + v * 5), 0.55 + i * 0.15, (1 - v) * 0.95);
      }
    }
    // low on health: a sweat bead sliding down the back of its head, again and again
    if (sb.low) {
      const v = ((t * 0.8) % 1);
      const p = hp([-rx * 0.62, -3.2 + v * 3.0]);
      ctx.save();
      ctx.globalAlpha = v < 0.75 ? 1 : (1 - v) * 4;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1] - 1.3);
      ctx.quadraticCurveTo(p[0] + 0.95, p[1] + 0.2, p[0], p[1] + 0.9);
      ctx.quadraticCurveTo(p[0] - 0.95, p[1] + 0.2, p[0], p[1] - 1.3);
      ctx.fillStyle = 'rgba(206,238,255,0.95)';
      ctx.fill();
      ctx.strokeStyle = SB.bubble.rim;
      ctx.lineWidth = 0.3;
      ctx.stroke();
      ell(ctx, p[0] - 0.25, p[1] - 0.05, 0.2, 0.3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
    // asleep: soft z's drifting up off its head
    if (sb.nw > 0.5) {
      for (let i = 0; i < 3; i++) {
        const v = (t * 0.4 + i / 3) % 1;
        const p = hp([5 + v * 4, -ry - 2 - v * 9]);
        zee(ctx, a, p[0] + Math.sin(v * 5 + i) * 0.8, p[1], 0.7 + v * 0.6, Math.sin(Math.PI * v) * (sb.nw - 0.5) * 2);
      }
    }
  } else {
    // beaten: little sparkles going round over its head
    const c = hp([1, -ry - 3]);
    for (let i = 0; i < 3; i++) {
      const q = t * 3.2 + (i * TAU) / 3;
      sparkle(ctx, c[0] + Math.cos(q) * 5, c[1] + Math.sin(q) * 1.6, 1.3 + 0.3 * Math.sin(q), i === 1 ? '#ffd2dc' : i === 2 ? '#fff0b8' : '#ffffff');
    }
  }
  ctx.restore();
}

// ---------- Its dress on the sea slug ----------
const look = {
  C: SB.C,
  CE: SB.CE,
  CT: SB.CT,
  ink: SB.ink,
  inkE: SB.inkE,
  inkT: SB.ink,
  // its own shape over the slug's: a big round head rising over a lower, shorter back (chibi)
  P: {
    foot: { back: -14.5, front: 14.6, h: 4.0 },
    mantle: { c: [-4.0, -7.9], rx: 10.6, ry: 6.6 },
    head: { c: [6.0, -12.9], rx: 8.6, ry: 7.9, tilt: 3 },
    ears: [
      { id: 'F', far: true, root: [3.7, -6.1], ang: -74, len: 7.8, w: 3.2 },
      { id: 'N', far: false, root: [-1.8, -6.3], ang: -104, len: 8.2, w: 3.4 },
    ],
    tail: { at: -138, out: 3.3 },
  },
  moves: MOVES,
  pool: POOL,
  kick: { head: 40, nAng: 30, earA: 5 },
  turnKick: { head: 12, earA: 2 },
  face,
  pose,
  fx,
  over: { body: capLayer },
};

export const SEA_BUNNY = dressedSlug(look);
// (`noHop`: none of the monster drawer's hops or idle notes over it; `ownEmotes`: every mark over its
// head is its own, drawn above)
SEA_BUNNY.art.noHop = true;
SEA_BUNNY.art.ownEmotes = true;
// (its dress, for the dev tools that watch its parts frame by frame)
export const SEA_BUNNY_LOOK = look;
