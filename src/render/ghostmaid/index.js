// The Ghost Maid (2026-11-26, remade from scratch, the player's pick "A" of three: Lacey, the moon-jelly
// parlourmaid): the Moonlit Manor's level 15 maid, the one Madame Velvet's bell sends running. A pale
// moon jellyfish whose frilled bell is her own lace mob cap (a lavender ribbon round it, a bow at the
// back), lace ribbons for oral arms, fine trailing tentacles. In one ribbon arm a feather duster, in
// another a little silver service bell. Serene, proper, a touch vain; she floats a hand's height over
// the floor (a ground floater, like the Lantern Wisp: she keeps to the manor's floors with her pack)
// and glides on a pulsing bell. She moves on her own copy of the jellyfish (jellybase.js).
//   idle    a 30 s act, only while she floats about calm:
//           - the cobweb: she rises and reaches her duster high overhead, swishing; dust drifts down
//             and a wisp of cobweb sticks to the duster; a little shake and it floats off;
//           - the dust mote: a sparkly mote drifts down and round her; she turns a full pirouette
//             following it with her eyes, then catches it with a flick of the duster;
//           - the polish: the silver bell raised before her face, rubbed with the duster, her
//             reflection admired (a blush, a glint);
//           - the bell: she rings it, "ding!", much louder than she meant: a wince, then a sheepish
//             look round.
//   moves   (def.moves, in turn) Duster Swat: the duster arm swung up behind the bell, then whipped
//           round in front in a puff of dust. Service Bell: the bell raised high, rung once, a ring
//           of chimes pushing out. Lace Lash: two lace ribbons cocked back, then snapped out like a
//           tea towel.
//   faces   her own: serene crescent eyes with crescent-moon glints, soft brows, a mouth drawn from a
//           width, a smile and an openness (so every change eases); content and proud (happy arcs),
//           fierce (brows knit, a gritted little mouth), a wince (squeezed), hurt, sleepy, dizzy
//           (beaten), sad, cross, talking (vowel shapes), worried when low.
// Everything here drawn from scratch; the duster and the bell are her own props, drawn by her rig.
import { dressedJelly } from './jellybase.js';

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
// a rounded lash: a short curve from b, out along an, curling
function lash(ctx, b, an, len, w, col, curl = 0.5) {
  const m = [b[0] + Math.cos(an) * len * 0.55, b[1] + Math.sin(an) * len * 0.55];
  const e = [b[0] + Math.cos(an - curl) * len, b[1] + Math.sin(an - curl) * len];
  stroke(ctx, [b, m, e], w, col);
}
// A soft cloud of round puffs (the duster's plumes): its outline in the line pass (only the outer
// edge survives), filled with a lit top and a shaded bottom in the fill pass.
function puffs(ctx, mode, K, a, list, col) {
  ctx.beginPath();
  for (const [x, y, r] of list) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = lit(a, col.base);
  ctx.fill('nonzero');
  ctx.save();
  ctx.clip('nonzero');
  for (const [x, y, r] of list) {
    ell(ctx, x + r * 0.18, y + r * 0.42, r * 0.9, r * 0.6);
    ctx.fillStyle = lit(a, col.sh, 0.55);
    ctx.fill();
  }
  for (const [x, y, r] of list) glow(ctx, x - r * 0.3, y - r * 0.38, r * 0.75, col.lt, 0.9);
  ctx.restore();
}

// ---------- Her colours ----------
const LA = {
  C: { lt: '#f7fbff', base: '#dfeafa', sh: '#bfd0ee', deep: '#9fb0db' },
  CR: { lt: '#ffffff', base: '#f6f2fd', sh: '#d9d1ef', deep: '#bdb1de' },
  CO: { lt: '#fbf3fd', base: '#efdff4', sh: '#d8c2e6', deep: '#bca3d3' },
  CF: { base: '#dbe6f7', sh: '#c9d7f1', deep: '#a8bce4' },
  ink: '#7688bf',
  eye: '#4b4f8f',
  rib: { lt: '#ddd0f7', base: '#b9a4e6', sh: '#9b85cf' },
  feather: { lt: '#fff0f6', base: '#f6cde0', sh: '#e0a8c6' },
  wood: { lt: '#f0d3b0', base: '#c99a6c', sh: '#a3774f' },
  silver: { lt: '#ffffff', base: '#e6ecf5', sh: '#aebbd2' },
  web: '#cfc6df',
};

// ---------- The act's clock and her moods ----------
// (a 30 s loop, from her own place in time; the beats' windows in seconds)
const ACT = 30;
const actT = (a, m) => (((a.t ?? 0) + ((m.uid ?? 0) % 7) * 1.1 + 26) % ACT);
// Her face's targets for a mood: lid (0 open, 1 shut), shut (which closed shape), brow tilt (+ knit,
// - worried) and raise, the mouth's width, smile (-1 frown, 1 smile), openness and teeth, blush.
const FACES = {
  calm: { lid: 0.3, shut: 'happy', bt: 0, by: 0, mw: 0.9, ms: 0.6, mo: 0, te: 0, bl: 0.5 },
  focus: { lid: 0.12, shut: 'happy', bt: 0.25, by: 0.3, mw: 0.55, ms: 0, mo: 0, te: 0, bl: 0.45 },
  curious: { lid: 0.05, shut: 'happy', bt: -0.1, by: 0.6, mw: 0.55, ms: 0.1, mo: 0.45, te: 0, bl: 0.5 },
  content: { lid: 1, shut: 'happy', bt: -0.1, by: 0.3, mw: 1.0, ms: 1, mo: 0, te: 0, bl: 0.7 },
  happy: { lid: 1, shut: 'happy', bt: -0.15, by: 0.5, mw: 1.2, ms: 1, mo: 0.75, te: 0, bl: 0.8 },
  admire: { lid: 0.5, shut: 'happy', bt: -0.2, by: 0.2, mw: 1.0, ms: 1, mo: 0.15, te: 0, bl: 1 },
  proud: { lid: 1, shut: 'happy', bt: 0.05, by: 0.4, mw: 0.7, ms: 0.4, mo: 0.6, te: 0, bl: 0.6 },
  wince: { lid: 1, shut: 'squeeze', bt: -0.5, by: -0.1, mw: 1.1, ms: -0.3, mo: 0.35, te: 1, bl: 0.8 },
  sheepish: { lid: 0.35, shut: 'happy', bt: -0.45, by: 0.2, mw: 0.8, ms: 0.45, mo: 0, te: 0, bl: 0.95 },
  fierce: { lid: 0.18, shut: 'happy', bt: 0.75, by: -0.2, mw: 0.8, ms: -0.1, mo: 0.35, te: 1, bl: 0.45 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.6, by: 0, mw: 0.9, ms: -0.6, mo: 0.45, te: 0, bl: 0.6 },
  sleep: { lid: 1, shut: 'sleep', bt: -0.1, by: 0, mw: 0.6, ms: 0.2, mo: 0.2, te: 0, bl: 0.5 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.4, by: 0.2, mw: 0.8, ms: -0.4, mo: 0.4, te: 0, bl: 0.4 },
  sad: { lid: 0.4, shut: 'happy', bt: -0.7, by: 0.1, mw: 0.8, ms: -0.7, mo: 0, te: 0, bl: 0.4 },
  cross: { lid: 0.3, shut: 'happy', bt: 0.85, by: -0.25, mw: 0.7, ms: -0.4, mo: 0, te: 0, bl: 0.5 },
  worried: { lid: 0.12, shut: 'happy', bt: -0.6, by: 0.3, mw: 0.7, ms: -0.3, mo: 0.15, te: 0, bl: 0.5 },
  talk: { lid: 0.22, shut: 'happy', bt: -0.05, by: 0.25, mw: 0.9, ms: 0.4, mo: 0.4, te: 0, bl: 0.55 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
// vowel mouths for talking: [width, smile, open], each held a beat, eased into the next
const VOWELS = [[0.6, 0.1, 0.8], [1.15, 0.4, 0.7], [1.2, 0.5, 0.3], [0.9, 0.3, 0], [0.75, 0.2, 0.5]];

// The act: what each channel does at a moment of the loop (weights before the calm fade).
function actAt(u) {
  // the cobweb: up high, swishing, a shake, pleased
  const high = win(u, 3.0, 4.0, 7.6, 8.6);
  const swish = win(u, 4.2, 4.6, 7.0, 7.4);
  const shake = win(u, 8.9, 9.05, 9.45, 9.6);
  // the dust mote: it drifts down and round, she turns after it, the catch
  const moteOn = win(u, 12.0, 12.4, 16.7, 16.75);
  const turn = sstep((u - 13.6) / 2.8) * (u < 20 ? 1 : 0);
  const catchW = win(u, 16.2, 16.55, 16.8, 17.4);
  // the polish and the bell
  const bellUp = Math.max(win(u, 20.0, 20.8, 24.8, 25.6), win(u, 25.6, 26.3, 28.4, 29.2));
  const rub = win(u, 21.0, 21.4, 23.4, 23.8);
  const ring = win(u, 26.7, 26.78, 27.0, 27.4);
  const flinch = win(u, 26.78, 26.9, 27.3, 28.0);
  let face = 'calm';
  if (u > 3.4 && u < 8.6) face = 'focus';
  else if (u >= 9.6 && u < 11.2) face = 'content';
  else if (u >= 12.3 && u < 16.7) face = 'curious';
  else if (u >= 16.7 && u < 18.6) face = 'happy';
  else if (u >= 20.4 && u < 23.8) face = 'focus';
  else if (u >= 23.8 && u < 25.2) face = 'admire';
  else if (u >= 26.2 && u < 26.75) face = 'proud';
  else if (u >= 26.75 && u < 27.9) face = 'wince';
  else if (u >= 27.9 && u < 29.6) face = 'sheepish';
  // where she looks: up at the cobweb, after the mote, at the bell, about her (sheepish)
  let lookX = null;
  let lookY = 0;
  if (u > 3.4 && u < 8.8) lookY = -1;
  if (u >= 20.4 && u < 25.2) lookX = 1;
  if (u >= 27.9 && u < 29.6) lookX = Math.sin((u - 27.9) * 4.2) > 0 ? 1 : -1;
  return { high, swish, shake, moteOn, turn, catchW, bellUp, rub, ring, flinch, face, lookX, lookY, u };
}
// the mote's place round her (the bell's frame, x forward), and whether it is in front of her
function motePos(u, sk) {
  const p = sstep((u - 12.2) / 4.3);
  const az = -2.2 + p * (TAU + 2.2 - 0.25) + 0.37;
  const r = sk.ws * 1.45;
  return { x: Math.sin(az) * r, y: mix(-sk.hh * 1.6, -sk.hh * 0.2, p) + Math.sin(p * 7) * 1.2, front: Math.cos(az) };
}

// ---------- The moves (channels: d1 the duster swung up behind, d2 the duster swept out in front, d3
// the bell raised, d4 the lace ribbons cocked back, d5 the bell shaken, d7 the duster rubbing, d8 the
// duster held up high, d9 the ribbons snapped out) ----------
const MOVES = {
  swat: {
    anticT: 0.3,
    keys: [
      [0, { pitch: -14, pump: -0.45, d1: 1, x: -0.04, lift: 1.5 }],
      [0.06, { pitch: 18, pump: 1, d1: 0, d2: 1, x: 0.14 }, 'out'],
      [0.2, { pitch: 14, pump: 0.5, d2: 1, x: 0.14 }],
      [0.46, { pitch: 4, d2: 0.3, x: 0.06 }, 'io'],
      [0.78, {}, 'io'],
    ],
    spark: [0.08],
    sparkAt: 'duster',
    puff: 0.06,
  },
  bell: {
    anticT: 0.3,
    keys: [
      [0, { d3: 1, pitch: -9, lift: 2.5, pump: -0.35 }],
      [0.06, { d3: 1, d5: 1, pitch: 10, x: 0.06, pump: 0.9, lift: 1 }, 'out'],
      [0.3, { d3: 1, d5: 0.55, pitch: 8, x: 0.06 }],
      [0.56, { d3: 0.3, d5: 0, pitch: 2 }, 'io'],
      [0.86, {}, 'io'],
    ],
    ring: 0.06,
  },
  lash: {
    anticT: 0.3,
    keys: [
      [0, { d4: 1, zap: -0.8, pitch: -16, pump: -0.4, x: -0.03 }],
      [0.05, { d4: 0, d9: 1, zap: 1, pitch: 20, pump: 1, x: 0.1 }, 'out'],
      [0.24, { d9: 1, zap: 0.85, pitch: 14, x: 0.1 }],
      [0.5, { d9: 0.2, zap: 0.1, pitch: 4, x: 0.04 }, 'io'],
      [0.8, {}, 'io'],
    ],
    trail: 0.07,
  },
};
const POOL = ['swat', 'bell', 'lash'];

// ---------- Her act, her moods and her face's easing (each frame, before drawing) ----------
function laPose(m, a, out, K, mv) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > (a.now ?? 0));
  // (a hit only counts once it has happened: a time since it that is less than nothing, as when a
  // stage or a film replays from the start with the last hit still remembered, is no hit at all)
  const ago = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && ago >= 0 && ago < 0.55;
  // Calm: floating about with nothing else on (the act shows only then, fading in and out)
  // (never mid-fight: not while she is after someone, or called in by Madame Velvet's bell)
  const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || Boolean(m.engaged);
  const calmGoal = !mv && m.hp > 0 && !napping && !m.pose && !m.cine && !hurt && !fighting && (st.tnGo ?? 0) < 0.15 ? 1 : 0;
  st.laCalm = mix(st.laCalm ?? 0, calmGoal, k(calmGoal ? 1.6 : 7));
  const cw = sstep(st.laCalm);
  const u = actT(a, m);
  const A = actAt(u);
  // (the act on the channels, as much as she is calm)
  out.d8 = Math.max(out.d8 ?? 0, A.high * cw);
  out.d2 = Math.max(out.d2 ?? 0, A.catchW * 0.65 * cw);
  out.d3 = Math.max(out.d3 ?? 0, A.bellUp * cw);
  out.d7 = Math.max(out.d7 ?? 0, A.rub * cw);
  out.d5 = Math.max(out.d5 ?? 0, A.ring * cw);
  out.lift += (5 * A.high + 1.5 * A.bellUp) * cw;
  out.pitch += (-9 * A.high - 4 * A.bellUp - 12 * A.flinch + 6 * A.catchW) * cw;
  out.pump += (0.6 * A.flinch - 0.2 * A.high) * cw;
  out.x = (out.x ?? 0) + (-0.05 * A.flinch) * cw;
  if (A.lookX !== null) out.look = mix(out.look, A.lookX, cw);
  // the turn after the mote: whole turns, eased; cut short, it finishes the nearest way round
  const turnGoal = cw > 0.02 && A.turn > 0 && A.turn < 1 ? A.turn : Math.round(st.laTurn ?? 0);
  st.laTurn = mix(st.laTurn ?? 0, turnGoal, k(cw > 0.02 && A.turn > 0 && A.turn < 1 ? 30 : 5));
  if (Math.abs(st.laTurn - Math.round(st.laTurn)) < 1e-3) st.laTurn = 0;
  a.laTurn = st.laTurn;
  a.laAct = { ...A, cw };
  a.laSwish = A.swish * cw;
  a.laShake = A.shake * cw;
  // Her mood: beaten, hurt, asleep, a move, a scene's mood, the act's, low on health, calm
  let mood = 'calm';
  const name = mv ? Object.keys(MOVES).find((n) => MOVES[n] === mv) : null;
  const cine = m.cine?.mood;
  if (m.hp <= 0) mood = 'dizzy';
  else if (hurt) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'swat' || name === 'lash') mood = 'fierce';
  else if (name === 'bell') mood = 'proud';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (cw > 0.5 && A.face !== 'calm') mood = A.face;
  else if (m.hp < m.def.hp * 0.25) mood = 'worried';
  // (a bell ring as an attack: the wince after the ring)
  const F = FACES[mood];
  const f = (st.laF ??= { lid: 0.3, bt: 0, by: 0, mw: 0.9, ms: 0.6, mo: 0, te: 0, bl: 0.5, lookY: 0, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 }, sweat: 0 });
  let tgt = F;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor((a.t ?? 0) * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const fast = k(14);
  for (const key of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl']) f[key] = mix(f[key], tgt[key], key === 'lid' ? k(18) : fast);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, k(12));
  f.lookY = mix(f.lookY, mood === 'sad' ? 0.6 : cw > 0.5 ? A.lookY : 0, k(8));
  f.sweat = mix(f.sweat, mood === 'sheepish' || mood === 'worried' ? 1 : 0, k(5));
  a.laF = f;
  a.laMood = mood;
  // (her arms held closer to their shapes through a move, so a blow lands on its beat; eased)
  st.laPin = mix(st.laPin ?? 0, name ? 1 : 0, k(name ? 14 : 6));
  a.laPinW = st.laPin;
  // (the long tentacles too, for the lash only)
  st.laPinF = mix(st.laPinF ?? 0, name === 'lash' ? 1 : 0, k(name === 'lash' ? 14 : 6));
  a.laPinF = st.laPinF;
}

// ---------- Drawing her (in the bell's frame: x forward, y down, 0 at the rim's middle) ----------
// The way she faces as she turns: the face's place round the bell (x = sin, in front while cos > 0)
const PHI0 = 0.37;
const faceAz = (a) => PHI0 + TAU * (a.laTurn ?? 0);
const bowAz = (a) => faceAz(a) - 1.95;
// the ribbon band's middle line, a little lower at the front
const ribbonY = (sk, x) => -0.7 * sk.hh + 0.09 * sk.hh * Math.cos(((x - 0.3 * sk.ws) / (1.3 * sk.ws)) * Math.PI);
function laPaint(ctx, a, sk, K) {
  K.bellFrame(ctx, a);
  const ws = sk.ws;
  // a pale moon sheen on the crown
  glow(ctx, -0.2 * ws, -0.82 * sk.hh, ws * 0.55, '#ffffff', 0.85);
  // the ribbon band, lit along its top
  for (const [col, w, dy] of [[LA.rib.base, 2.1, 0], [LA.rib.lt, 0.5, -0.55]]) {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = mix(-ws * 1.1, ws * 1.1, i / 24);
      ctx.lineTo(x, ribbonY(sk, x) + dy);
    }
    ctx.strokeStyle = lit(a, col);
    ctx.lineWidth = w;
    ctx.stroke();
  }
}
// Her face: serene crescent eyes, heavy soft upper lids, pale aqua irises with a crescent-moon glint,
// a lower lid, two curled lashes at the outer corner; soft brows; a mouth from width, smile, openness.
function laFace(ctx, a, sk, K) {
  const f = a.laF;
  if (!f) return;
  const az = faceAz(a);
  const front = Math.cos(az);
  const show = sstep((front - 0.05) / 0.35);
  if (show <= 0.01) return;
  K.bellFrame(ctx, a);
  ctx.globalAlpha *= show;
  const t = a.t ?? 0;
  const lk = clamp(sk.look ?? 0, -1, 1);
  const sx = mix(0.55, 1, front);
  const cx = Math.sin(az) * sk.ws * 0.92 + lk * 1.1 * front;
  const ey = -0.4 * sk.hh + f.lookY * 0.5;
  const blink = f.lid < 0.6 ? win(t % 4.7, 4.25, 4.33, 4.4, 4.5) : 0;
  const L = Math.max(f.lid, blink);
  const ink = lit(a, LA.eye);
  // the blush
  glow(ctx, cx + 5.0 * sx, ey + 3.0, 2.6, '#ff9fc2', 0.5 * f.bl);
  glow(ctx, cx - 4.4 * sx, ey + 3.0, 2.2, '#ff9fc2', 0.4 * f.bl);
  const eye = (x, s, near) => {
    const ew = 2.1 * s;
    const eh = 2.45;
    // closed: crossfading shapes as the lids come down
    const closedW = sstep((L - 0.7) / 0.3);
    if (closedW > 0.01) {
      ctx.save();
      ctx.globalAlpha *= closedW;
      if (f.shut.happy > 0.01) {
        ctx.globalAlpha *= f.shut.happy;
        stroke(ctx, [[x - ew, ey + 0.5], [x, ey - eh * 0.75], [x + ew, ey + 0.4]], 0.62, ink);
        lash(ctx, [x + ew * 0.98, ey + 0.35], -0.35, 1.1, 0.4, ink, 0.6);
        ctx.globalAlpha /= f.shut.happy;
      }
      if (f.shut.sleep > 0.01) {
        ctx.globalAlpha *= f.shut.sleep;
        stroke(ctx, [[x - ew, ey], [x, ey + eh * 0.7], [x + ew, ey]], 0.6, ink);
        lash(ctx, [x + ew * 0.95, ey], -0.1, 1.1, 0.4, ink, -0.5);
        ctx.globalAlpha /= f.shut.sleep;
      }
      if (f.shut.squeeze > 0.01) {
        ctx.globalAlpha *= f.shut.squeeze;
        const sg = near ? -1 : 1;
        stroke(ctx, [[x + sg * ew, ey - eh * 0.6], [x - sg * ew * 0.1, ey - eh * 0.1], [x - sg * ew * 0.85, ey + 0.05]], 0.62, ink);
        stroke(ctx, [[x - sg * ew * 0.85, ey + 0.05], [x - sg * ew * 0.1, ey + eh * 0.2], [x + sg * ew, ey + eh * 0.6]], 0.62, ink);
        ctx.globalAlpha /= f.shut.squeeze;
      }
      if (f.shut.dizzy > 0.01) {
        ctx.globalAlpha *= f.shut.dizzy;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 0.45;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * (near ? 1 : -1);
          const r = (i / 26) * ew * 0.95;
          const p = [x + Math.cos(an) * r, ey + Math.sin(an) * r * 1.1];
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.globalAlpha /= f.shut.dizzy;
      }
      ctx.restore();
    }
    const openW = 1 - closedW;
    if (openW <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= openW;
    const Lo = clamp(L, 0, 0.85);
    ctx.save();
    // the white: almond, fuller below
    ctx.beginPath();
    ctx.moveTo(x - ew, ey);
    ctx.quadraticCurveTo(x, ey - eh * 1.25, x + ew, ey - eh * 0.1);
    ctx.quadraticCurveTo(x + ew * 0.2, ey + eh * 1.25, x - ew, ey);
    ctx.fillStyle = lit(a, '#fdfdff');
    ctx.fill();
    ctx.clip();
    const ix = x + 0.2 * ew + lk * 0.35;
    const iy = ey + 0.1 + f.lookY * 0.55;
    const g = ctx.createLinearGradient(ix, iy - eh, ix, iy + eh);
    g.addColorStop(0, '#46509f');
    g.addColorStop(0.55, '#5fa7cf');
    g.addColorStop(1, '#a6eef0');
    ctx.fillStyle = g;
    ell(ctx, ix, iy, ew * 0.72, eh * 0.95);
    ctx.fill();
    // the lid's shadow and the lid itself
    const ly = ey - eh + eh * 1.6 * Lo;
    ctx.fillStyle = 'rgba(60,63,122,0.35)';
    ctx.fillRect(x - ew * 1.2, ly, ew * 2.4, 0.7);
    ctx.fillStyle = lit(a, LA.C.base);
    ctx.fillRect(x - ew * 1.2, ey - eh * 1.4, ew * 2.4, ly - (ey - eh * 1.4));
    ctx.restore();
    // the glints: a little crescent moon up front, a dot low behind
    ctx.save();
    ctx.translate(ix + ew * 0.22, Math.max(ly + 0.75, iy - eh * 0.45));
    ctx.beginPath();
    ctx.arc(0, 0, 0.62, 0, TAU);
    ctx.arc(0.32, -0.22, 0.5, 0, TAU, true);
    ctx.fillStyle = '#ffffff';
    ctx.fill('evenodd');
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ell(ctx, ix - ew * 0.3, iy + eh * 0.42, 0.28, 0.28);
    ctx.fill();
    // the upper lid line (heavy, soft), the lashes at the outer corner, the lower lid
    stroke(ctx, [[x - ew * 1.05, ly + eh * 0.55 * (1 - Lo) + 0.2], [x - ew * 0.1, ly - 0.35], [x + ew * 1.05, ly + eh * 0.35 * (1 - Lo)]], 0.62, ink);
    lash(ctx, [x + ew * 1.0, ly + eh * 0.3 * (1 - Lo)], -0.35, 1.35, 0.42, ink, 0.7);
    lash(ctx, [x + ew * 0.7, ly + 0.05], -0.95, 1.05, 0.38, ink, 0.6);
    stroke(ctx, [[x - ew * 0.6, ey + eh * 0.95], [x + ew * 0.1, ey + eh * 1.18], [x + ew * 0.75, ey + eh * 0.85]], 0.32, lit(a, '#6c79b8', 0.8));
    ctx.restore();
  };
  eye(cx - 3.9 * sx, 0.8 * sx, false);
  eye(cx + 3.0 * sx, sx, true);
  // the brows: soft arcs, tilted by the mood (+ knit toward the middle, - worried)
  const by = ey - 3.9 - f.by * 0.7;
  const brow = (x0, x1, inner) => {
    // (the inner end goes down when knit, up when worried)
    const yi = by + f.bt * 0.9;
    const yo = by - f.bt * 0.35;
    const [ya, yb] = inner < 0 ? [yi, yo] : [yo, yi];
    stroke(ctx, [[x0, ya], [(x0 + x1) / 2, Math.min(ya, yb) - 0.6], [x1, yb]], 0.42, lit(a, '#8a96cc'));
  };
  brow(cx + 1.2 * sx, cx + 4.8 * sx, -1);
  brow(cx - 5.3 * sx, cx - 2.6 * sx, 1);
  // the mouth: from its width, smile and openness (so every change eases)
  const mx = cx + 0.1 * sx;
  const my = ey + 3.9;
  const w = f.mw * sx;
  const cy = my - f.ms * 0.45;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(mx - w, cy);
    ctx.quadraticCurveTo(mx, my + f.ms * 0.5 - o * 0.35, mx + w, cy);
    ctx.quadraticCurveTo(mx, my + f.ms * 0.9 + o * 1.7, mx - w, cy);
    ctx.fillStyle = lit(a, '#8f5287');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, mx, my + f.ms * 0.7 + o * 1.4, w * 0.75, o * 0.7);
    ctx.fillStyle = lit(a, '#ea90b0');
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = lit(a, '#ffffff', f.te);
      ctx.fillRect(mx - w, my + f.ms * 0.5 - o * 0.6 - 0.5, w * 2, 0.75);
    }
    ctx.restore();
  } else stroke(ctx, [[mx - w, cy], [mx, my + f.ms * 0.75], [mx + w, cy - 0.05]], 0.42, lit(a, '#86629c'));
  // a sweat drop for the sheepish look round (and low on health)
  if (f.sweat > 0.05) {
    const x = cx - 6.6 * sx;
    const y = ey - 2.6 + ((t * 0.6) % 1) * 0.8;
    ctx.globalAlpha *= f.sweat;
    ctx.beginPath();
    ctx.moveTo(x, y - 1.1);
    ctx.quadraticCurveTo(x + 0.85, y + 0.3, x, y + 0.85);
    ctx.quadraticCurveTo(x - 0.85, y + 0.3, x, y - 1.1);
    ctx.fillStyle = 'rgba(200,236,255,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,170,215,0.8)';
    ctx.lineWidth = 0.25;
    ctx.stroke();
  }
}
// The bow on the ribbon: two round loops, a knot, two tails, at the ribbon's back; it goes round
// with her as she turns (behind the bell while it is round the back, in front while it is round the front).
function laBow(front) {
  return (ctx, a, mode, K) => {
    const az = bowAz(a);
    if ((Math.cos(az) > 0) !== front) return;
    const sk = a.tk;
    K.bellFrame(ctx, a);
    const x = Math.sin(az) * sk.ws * 0.93;
    const y = ribbonY(sk, x) + 0.2;
    // (seen from the side at the bell's edge: its loops stick out behind; turned to face us, they
    // spread either side)
    // (everything from the bow's turn, so it never jumps: sa is its side, -1 at the left edge, 1 at
    // the right, 0 facing us or away; ca how much it faces us)
    const sa = Math.sin(az);
    const ca = Math.abs(Math.cos(az));
    const sw = Math.sin((a.t ?? 0) * 1.7) * 0.08;
    const loops = [[x + 2.3 * sa + 2.6 * Math.cos(az), y - 1.6, 2.4, 1.5, 0.7 * sa + sw], [x + 2.0 * sa - 2.6 * Math.cos(az), y + mix(1.5, -1.4, ca), 2.1, 1.3, -mix(0.55, 0.7, ca) * sa - sw]];
    ctx.beginPath();
    for (const [lx, ly, rx, ry, r] of loops) {
      ctx.moveTo(lx + rx * Math.cos(r), ly + rx * Math.sin(r));
      ctx.ellipse(lx, ly, rx, ry, r, 0, TAU);
    }
    for (const [dx, an, L] of [[-0.6, 2.35 + sw, 4.4], [0.4, 1.85 + sw * 0.7, 3.8]]) {
      const ang = Math.atan2(Math.sin(an), -Math.cos(an) * sa);
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const P = (q, ww) => [x - dx * 0.4 * sa + c * q - s * ww, y + 0.6 + s * q + c * ww];
      ctx.moveTo(...P(0, -0.7));
      ctx.lineTo(...P(L, -0.95));
      ctx.lineTo(...P(L - 0.9, 0));
      ctx.lineTo(...P(L, 0.95));
      ctx.lineTo(...P(0, 0.7));
      ctx.closePath();
    }
    ctx.moveTo(x + 1.1, y);
    ctx.ellipse(x, y, 1.1, 1.2, 0, 0, TAU);
    if (mode === 'line') return K.edge(ctx);
    ctx.fillStyle = lit(a, LA.rib.base);
    ctx.fill('nonzero');
    for (const [lx, ly, rx, ry, r] of loops) {
      ell(ctx, lx + 0.4, ly + 0.2, rx * 0.5, ry * 0.45, r);
      ctx.fillStyle = lit(a, LA.rib.sh);
      ctx.fill();
      ell(ctx, lx - 0.3, ly - 0.4, rx * 0.55, ry * 0.35, r);
      ctx.fillStyle = lit(a, LA.rib.lt);
      ctx.fill();
    }
    ell(ctx, x - 0.2, y - 0.3, 0.6, 0.5);
    ctx.fillStyle = lit(a, LA.rib.lt);
    ctx.fill();
  };
}
// The feather duster in her near front ribbon arm, its handle gripped in the arm's curled tip.
function dusterAt(sk) {
  const J = sk.oral[3];
  const p = J[J.length - 1];
  const q = J[J.length - 3];
  const an = sk.dAn ?? Math.atan2(p[1] - q[1], p[0] - q[0]);
  return { p, an, head: [p[0] + Math.cos(an) * 6.6, p[1] + Math.sin(an) * 6.6] };
}
// The duster turns with her arm's tip on a quick damped spring of its own (once a frame, in the first
// pass), so a tip pressed flat on the floor or flicked hard never spins it round in a frame.
function dusterTurn(a, sk) {
  const st = (a.mo.rig ??= {});
  const J = sk.oral[3];
  const p = J[J.length - 1];
  const q = J[J.length - 3];
  const raw = Math.atan2(p[1] - q[1], p[0] - q[0]);
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  if (st.dAn === undefined || !(dt > 0)) {
    st.dAn ??= raw;
    st.dV ??= 0;
  } else {
    const goal = st.dAn + Math.atan2(Math.sin(raw - st.dAn), Math.cos(raw - st.dAn));
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      st.dV += ((goal - st.dAn) * 900 - st.dV * 48) * (dt / n);
      st.dAn += st.dV * (dt / n);
    }
  }
  sk.dAn = st.dAn;
}
function laDuster(ctx, a, mode, K) {
  const sk = a.tk;
  if (mode === 'line' || sk.dAn === undefined) dusterTurn(a, sk);
  const { p, an } = dusterAt(sk);
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(an);
  ctx.beginPath();
  ctx.moveTo(-1.6, -0.55);
  ctx.lineTo(4.2, -0.5);
  ctx.lineTo(4.2, 0.5);
  ctx.lineTo(-1.6, 0.55);
  ctx.closePath();
  ctx.moveTo(-1.2, 0);
  ctx.arc(-1.9, 0, 0.75, 0, TAU);
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = lit(a, LA.wood.base);
    ctx.fill('nonzero');
    ctx.fillStyle = lit(a, LA.wood.lt);
    ctx.fillRect(-1.6, -0.45, 5.8, 0.35);
    // the grip: the ribbon arm's tip wrapped round it twice
    for (const gx of [-0.4, 0.5]) {
      ell(ctx, gx, 0, 0.45, 0.85);
      ctx.fillStyle = lit(a, LA.CO.base);
      ctx.fill();
      ctx.strokeStyle = lit(a, LA.CO.sh);
      ctx.lineWidth = 0.25;
      ctx.stroke();
    }
  }
  // the plumes: a round, fluffy head of soft tufts, each nodding a little on its own
  const t = a.t ?? 0;
  const list = [[6.8, 0, 2.9]];
  for (let i = 0; i < 7; i++) {
    const q = (i - 3) * 0.48 + 0.06 * Math.sin(t * 2.1 + i * 1.3);
    const r = 3.3 - Math.abs(i - 3) * 0.15;
    list.push([6.4 + Math.cos(q) * r, Math.sin(q) * r, 1.75 - Math.abs(i - 3) * 0.12]);
  }
  puffs(ctx, mode, K, a, list, LA.feather);
  ctx.restore();
  // a wisp of cobweb caught on it in the act, then shaken off
  if (mode === 'fill') cobweb(ctx, a, sk);
}
function cobweb(ctx, a, sk) {
  const A = a.laAct;
  if (!A) return;
  const u = A.u;
  const on = sstep((u - 5.0) / 0.8) * (u < 11 ? 1 : 0) * A.cw;
  if (on <= 0.01) return;
  const { head } = dusterAt(sk);
  // (shaken loose at 9.3 s: it floats up and away, fading)
  const off = sstep((u - 9.3) / 1.5);
  const x = head[0] - off * 6;
  const y = head[1] - 1.5 - off * 9 + Math.sin(u * 3) * 0.4 * off;
  ctx.save();
  ctx.globalAlpha *= on * (1 - off);
  ctx.strokeStyle = LA.web;
  ctx.lineWidth = 0.45;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 1.4 + i * 1.2, y);
    ctx.quadraticCurveTo(x - 2 + i * 1.1, y + 2 + i * 0.4, x - 3.2 + i * 1.6, y + 3.6 + Math.sin(u * 2 + i) * 0.4);
    ctx.stroke();
  }
  ell(ctx, x - 0.2, y, 1.4, 0.9);
  ctx.fillStyle = 'rgba(240,236,248,0.85)';
  ctx.fill();
  ctx.restore();
}
// The little silver service bell in her far front ribbon arm: it hangs and swings from her grip,
// shaken hard when it rings.
function bellAt(a) {
  const sk = a.tk;
  const J = sk.oral[1];
  const p = J[J.length - 1];
  const t = a.t ?? 0;
  const shake = clamp(sk.S?.d5 ?? 0, 0, 1);
  const sw = Math.sin(t * 2.3 + 1) * 0.12 + Math.sin(t * 38) * 0.45 * shake;
  return { p, sw };
}
function laBell(ctx, a, mode, K) {
  const { p, sw } = bellAt(a);
  ctx.translate(p[0], p[1] + 0.6);
  ctx.rotate(sw);
  ctx.beginPath();
  ctx.moveTo(-2, 2.4);
  ctx.quadraticCurveTo(-2.1, -0.4, 0, -0.6);
  ctx.quadraticCurveTo(2.1, -0.4, 2, 2.4);
  ctx.quadraticCurveTo(0, 3, -2, 2.4);
  ctx.moveTo(0.6, -0.9);
  ctx.arc(0, -0.9, 0.6, 0, TAU);
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = lit(a, LA.silver.base);
  ctx.fill('nonzero');
  ell(ctx, 0.6, 1.4, 1.1, 0.9);
  ctx.fillStyle = lit(a, LA.silver.sh, 0.7);
  ctx.fill();
  ell(ctx, -0.8, 0.5, 0.45, 1.1, 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // the clapper, peeking under the rim
  ell(ctx, Math.sin((a.t ?? 0) * 38) * 0.5 * clamp(a.tk.S?.d5 ?? 0, 0, 1), 2.7, 0.5, 0.45);
  ctx.fillStyle = lit(a, LA.silver.sh);
  ctx.fill();
}
// a soft moonlit glow round her, behind everything
function laAura(ctx, a, mode) {
  if (mode !== 'line') return;
  const sk = a.tk;
  const c = sk.toW([0, -0.45 * sk.hh]);
  glow(ctx, c[0], c[1], sk.ws * 2.0, '#cfe6ff', 0.32);
}
// ---------- Her arms' own shapes: [angles, weight] for each (in the world, with her lean) ----------
function laGoals(kind, j, nn, S, { hang, prof, t, beta, a }) {
  if (kind !== 'oral') return null;
  const lean = beta * 0.6;
  const w = (v) => clamp(v ?? 0, 0, 1.2);
  const add = (L, f) => L.map((v, i) => v + lean + f(i / (nn - 1)));
  // (settled low, asleep or beaten: each ribbon laid out along the floor, out front or behind, so
  // none is pushed about by it)
  const flat = [add(prof(nn, j % 2 ? 1.0 : Math.PI - 1.0, j % 2 ? -0.85 : 0.85, 0), () => 0), w(S.flat) * 0.9];
  if (j === 3) {
    const sw = a.laSwish ?? 0;
    const sh = a.laShake ?? 0;
    return [
      // raised up over the back of the bell (the wind-up), whipped down in front (the swat)
      [add(prof(nn, 0.9, -2.5, -0.4), () => 0), w(S.d1)],
      [add(prof(nn, 0.75, -0.45, 0.15), () => 0), w(S.d2)],
      // held up high overhead, swishing at the cobweb
      [add(prof(nn, 0.5, -1.7, -0.4), (f) => sw * 0.35 * Math.sin(t * 7) * f * f), w(S.d8)],
      // rubbing the bell held up in front of her
      [add(prof(nn, 0.6, -1.35, -0.1), (f) => 0.18 * Math.sin(t * 9) * f * f), w(S.d7)],
      // a little shake (the cobweb off)
      [add(prof(nn, hang - 0.2, -0.3, 0), (f) => 0.35 * Math.sin(t * 30) * f * f), w(sh)],
      flat,
    ];
  }
  // (the bell held up out to her side, at her eyes' height, clear of the bell)
  if (j === 1) return [[add(prof(nn, 0.05, -0.75, 0.1), () => 0), w(S.d3)], flat];
  // the two lace ribbons that lash: cocked back, then snapped out in front
  return [
    [add(prof(nn, hang + 1.0, 0.7, 0.4), () => 0), w(S.d4)],
    [add(prof(nn, 0.8, -0.55, -0.2), (f) => 0.1 * Math.sin(t * 16 - f * 5) * f), w(S.d9)],
    flat,
  ];
}
// Where an effect comes from: the duster's head, the bell, the lashing ribbon tips.
function laSpot(sk, what) {
  if (what === 'duster') return dusterAt(sk).head;
  if (what === 'bell') {
    const J = sk.oral[1];
    return J[J.length - 1];
  }
  if (what === 'lash') {
    const p = sk.oral[0][sk.oral[0].length - 1];
    const q = sk.oral[2][sk.oral[2].length - 1];
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  }
  return null;
}
// ---------- Her effects ----------
const puffAt = (ctx, x, y, r, al) => {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = '#f6eefc';
  ctx.fill();
  ctx.strokeStyle = '#d8c8ea';
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.globalAlpha = 1;
};
// a music note (round head, a stem with a curl)
function note(ctx, x, y, s, al, col) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ell(ctx, x, y, 1.1 * s, 0.85 * s, -0.4);
  ctx.fillStyle = col;
  ctx.fill();
  stroke(ctx, [[x + 1 * s, y - 0.2 * s], [x + 1 * s, y - 2 * s], [x + 1 * s, y - 3.6 * s]], 0.45 * s, col);
  stroke(ctx, [[x + 1 * s, y - 3.6 * s], [x + 2.2 * s, y - 3.1 * s], [x + 2.1 * s, y - 1.9 * s]], 0.45 * s, col);
  ctx.globalAlpha = 1;
}
function ding(ctx, c, k, big) {
  // a soft ring pushing out, and notes rising off it
  const r = (big ? 4 : 2.5) + (big ? 22 : 9) * sstep(k);
  ctx.globalAlpha = (1 - k) * 0.9;
  ctx.beginPath();
  ctx.arc(c[0], c[1], r, 0, TAU);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = big ? 1.6 : 0.9;
  ctx.stroke();
  ctx.strokeStyle = '#e8dcff';
  ctx.lineWidth = big ? 0.7 : 0.4;
  ctx.stroke();
  ctx.globalAlpha = 1;
  const n = big ? 4 : 2;
  for (let i = 0; i < n; i++) {
    const q = -Math.PI / 2 + (i - (n - 1) / 2) * (big ? 0.75 : 0.9);
    const d = (big ? 6 : 3) + (big ? 12 : 5) * sstep(k);
    note(ctx, c[0] + Math.cos(q) * d, c[1] + Math.sin(q) * d - k * 2, big ? 0.9 : 0.6, (1 - k) * 0.95, i % 2 ? '#b9a4e6' : '#8fb4e8');
  }
  sparkle(ctx, c[0] + 2, c[1] - 2, (big ? 2.6 : 1.4) * (1 - k), rgba('#fff6c8', 1 - k));
}
function laFx(ctx, m, a, K) {
  const sk = a.tk;
  if (!sk) return;
  const t = a.t ?? 0;
  const A = a.laAct;
  ctx.save();
  // two soft moonlit sparkles drifting about her
  for (let i = 0; i < 2; i++) {
    const u = (t * 0.2 + i / 2) % 1;
    const c = sk.toW([Math.sin(i * 2.1 + t * 0.4) * sk.ws * 1.2, -sk.hh * 0.2 + 8 - u * 18]);
    sparkle(ctx, c[0], c[1], 1.0 + 0.3 * Math.sin(t * 3 + i), rgba('#ffffff', Math.sin(Math.PI * u) * 0.75));
  }
  // the act's own touches
  if (A && A.cw > 0.01 && m.hp > 0) {
    const u = A.u;
    // dust shaken down from the swishing, drifting to the floor
    if (u > 4.3 && u < 9) {
      const { head } = dusterAt(sk);
      for (let i = 0; i < 4; i++) {
        const v = ((u - 4.3) * 0.7 + i * 0.25) % 1;
        const al = Math.sin(Math.PI * v) * 0.7 * A.cw * win(u, 4.3, 4.8, 8.0, 9);
        puffAt(ctx, head[0] - 2 + i * 1.6 + Math.sin(v * 5 + i) * 1.2, head[1] + 2 + v * 14, 0.7 + 0.4 * (i % 2), al);
      }
    }
    // the mote: a sparkly speck of dust drifting down and round her, caught on the duster
    if (A.moteOn > 0.01) {
      const mp = motePos(u, sk);
      const c0 = sk.toW([mp.x, mp.y]);
      const caught = sstep((u - 16.45) / 0.25);
      const { head } = dusterAt(sk);
      const c = [mix(c0[0], head[0], caught), mix(c0[1], head[1], caught)];
      const al = A.moteOn * A.cw * (mp.front > -0.2 ? 1 : 0.45);
      glow(ctx, c[0], c[1], 3.6, '#ffe9a8', 0.75 * al);
      sparkle(ctx, c[0], c[1], 2.0 + 0.4 * Math.sin(t * 6), rgba('#fff6d0', al));
      sparkle(ctx, c[0], c[1], 1.0, rgba('#ffffff', al));
    }
    if (u > 16.7 && u < 17.5) {
      const k = (u - 16.7) / 0.8;
      const { head } = dusterAt(sk);
      sparkle(ctx, head[0], head[1] - 1, 2.8 * (1 - k) * A.cw, rgba('#fff6c8', 1 - k));
      for (let i = 0; i < 4; i++) {
        const q = i * 1.57 + 0.4;
        sparkle(ctx, head[0] + Math.cos(q) * 5 * sstep(k), head[1] - 1 + Math.sin(q) * 5 * sstep(k), 0.8 * (1 - k), rgba('#ffffff', (1 - k) * A.cw));
      }
    }
    // the polish: a glint on the bell, her reflection admired
    if (u > 23.6 && u < 24.8) {
      const k = (u - 23.6) / 1.2;
      const { p } = bellAt(a);
      sparkle(ctx, p[0] - 0.8, p[1] + 1.4, 2.2 * Math.sin(Math.PI * k) * A.cw, '#ffffff');
    }
    // the ring: "ding!" (a small one), much too loud for her
    if (u > 26.75 && u < 27.75) {
      const { p } = bellAt(a);
      ding(ctx, [p[0], p[1] + 1], (u - 26.75) / 1.0, false);
    }
  }
  // the moves' own
  const mv = a.tnMove;
  if (mv && m.hp > 0) {
    if (mv.mv === MOVES.swat) {
      const k = (mv.t - MOVES.swat.puff) / 0.42;
      if (k > 0 && k < 1) {
        const { head } = dusterAt(sk);
        for (let i = 0; i < 6; i++) {
          const q = i * 1.05 + 0.3;
          const r = 2 + 6 * sstep(k);
          puffAt(ctx, head[0] + Math.cos(q) * r, head[1] + Math.sin(q) * r * 0.7, 1 + 1.4 * k, (1 - k) * 0.75);
        }
      }
    } else if (mv.mv === MOVES.bell) {
      const k = (mv.t - MOVES.bell.ring) / 0.55;
      if (k > 0 && k < 1) {
        const { p } = bellAt(a);
        ding(ctx, [p[0], p[1] + 1], k, true);
      }
    } else if (mv.mv === MOVES.lash) {
      const k = (mv.t - MOVES.lash.trail) / 0.22;
      if (k > 0 && k < 1) {
        const c = sk.tips.reduce((s, p) => [s[0] + p[0] / sk.tips.length, s[1] + p[1] / sk.tips.length], [0, 0]);
        const b = sk.toW([0, -0.1 * sk.hh]);
        const r = Math.hypot(c[0] - b[0], c[1] - b[1]);
        const an = Math.atan2(c[1] - b[1], c[0] - b[0]);
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.beginPath();
        ctx.arc(b[0], b[1], r, an - 1.4 + k * 0.4, an + 0.1);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2 * (1 - k * 0.6);
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = '#e4d4f6';
        ctx.lineWidth = 0.9 * (1 - k * 0.6);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  ctx.restore();
}

// ---------- Her dress on the jellyfish ----------
const look = {
  P: { bell: { w: 13, h: 15.5 }, rim: 21, fringe: 7, oral: { L: 16 }, fine: { L: 19 }, speed: 52, cycle: 34, moves: POOL },
  C: LA.C,
  CR: LA.CR,
  CO: LA.CO,
  CF: LA.CF,
  ink: LA.ink,
  moves: MOVES,
  // (her arms snap through a move on its beat: stiffer springs while one plays)
  moveStiff: 7,
  pick: (m, a, st) => (typeof m.move === 'string' && MOVES[m.move] ? m.move : POOL[(st.tnN ?? 0) % POOL.length]),
  paint: laPaint,
  face: laFace,
  goals: laGoals,
  pin: (key, j, n, a) => {
    const w = key === 'jOral' ? (a.laPinW ?? 0) : (a.laPinF ?? 0);
    const k = key === 'jOral' ? 0.15 : 0.07;
    return w > 0.002 ? Array.from({ length: n }, (_, i) => w * k * (1 - (0.55 * i) / (n - 1))) : undefined;
  },
  spot: laSpot,
  pose: (m, a, out, K, mv, mt) => {
    laPose(m, a, out, K, mv, mt);
  },
  under: {
    fineFar: laAura,
    bell: laBow(false),
  },
  over: {
    oralNear: laDuster,
    oralFar: laBell,
    bell: laBow(true),
  },
  fx: laFx,
};

export const GHOST_MAID = dressedJelly(look);
// (`noHop`: none of the monster drawer's little hops or idle notes over her; she shows her moods in
// her own act and face)
GHOST_MAID.art.noHop = true;
// (her dress, for the dev tools that watch her parts frame by frame)
export const GHOST_MAID_LOOK = look;
