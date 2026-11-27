// The Turtle Squire (2026-11-27, the Sky Whale's Barnacle Knight remade from scratch as a new creature; the id
// stays `barnacleknight`). The Barnacle Matriarch's squires are young sea turtles who let the barnacles grow
// on their shells as a badge of long service (they are very slow, so the barnacles have plenty of time). This
// one takes squiring very seriously and is never quite awake. It fights with its scallop-shell shield and its
// own shell. On its own copy of the creature base (rig.js; body.js `turtle`: a broad barrel of a body, short
// thick legs on big flat feet, short thick arms), dressed here; its head, helm, shell, surcoat and shield drawn
// here from scratch over the mannequin (never the shared face, never the hero).
//   look    soft sea-green skin, paler on its throat, a couple of soft paler scale patches on its head (never
//           dots); a domed shell on its back in soft olive-teal plates with a warm cream rim, three little
//           pastel barnacles on it like medals; a coral surcoat WORN (the base's own body, sleeveless, its own
//           green arms bare) with a cream hem, a cream belt and a little scallop badge; a scallop-shell helm,
//           fluted cream-pink, a tiny coral knob on top; a big scallop shield in its near hand. Its own soft
//           sea-green outline, outer edge only, face bare.
//   eyes    its own "pebble eyes": round on top and flatter underneath, a sea-glass teal iris in soft rings,
//           a soft rounded-square glint like a window; a thick neat lash line ending in a round dot; pale
//           ridge brows. A small beak of a mouth.
//   walk    the base's walk at a slow dutiful plod (20), its shield at its side, its shell rocking.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - drill (7.2 s): shield up, a peek over its rim; two "hut!" shoves at nothing; attention;
//           - polish (6.4 s): a breath on the shield, a rub with its far hand, a gleam; admiration;
//           - yawn (6.6 s): a long slow yawn, its head sinking, its eyes closing... it snaps back to attention,
//             embarrassed;
//           - snack (6.8 s): a ribbon of sea lettuce from its belt, munched very slowly; content.
//   moves   Shield Shove (it rocks back on its heels, the shield drawn in; then a heavy lunge, shield first,
//           a soft splash of spray); Shell Slam (it turns its back, a clean mirror flip, and crouches; then
//           slams backward into you with its barnacled shell, a ring of sparkles); Tide Stomp (one foot raised
//           high, arms out; then a stomp, a soft wave rolling out along the floor both ways).
//   else    hurt: its head pulled in, a wince; after landing a hit: chest out, a salute; hunting you: low
//           behind its raised shield; low on health: worried, a bead of sweat, its shield sagging; a nap
//           (habitat): sat down, its helm tipped forward, z's; beaten: dizzy. Its marks over its head (!, ?)
//           are its own: little scallop shells (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: water as soft curling spray and a gentle wave,
// sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust, cue } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee } from './act.js';

const BIG = 1.22;
const LW = 1.6 / BIG;
const ID = 'turtlesquire';
const INK = '#5a8a7e';
const SKIN = ['#e6faea', '#b4e2c4', '#88c4a4', '#62a084'];
const THROAT = ['#fbfff2', '#eef8dc'];
const SHELL = ['#d8eec4', '#a2c89c', '#7aa486', '#5a826c'];
const RIM = ['#fff4d2', '#f2dca8', '#d4b880'];
const COAT = ['#ffe0dc', '#ffaea6', '#e88a86', '#c46a6e'];
const TRIM = ['#fffaf0', '#f4e8d2', '#dccaa8'];
const SCAL = ['#fff4ee', '#ffd8d0', '#f4b0ae', '#d48a8e'];
const BARN = ['#fbf6ff', '#e6dcf4', '#c4b4dc', '#ffc8d8'];
const LASH = '#2e3a36';
const IRIS = ['#123a3a', '#2a7a7a', '#5ab8b0', '#bdf0e4'];
const WATER = ['#ffffff', '#d8f0ff', '#9ccdf0', '#6aa8dc'];
const LETTUCE = ['#c8f0a0', '#8ad070'];

const paint = (ctx, a, mode, col, ink = INK, w = LW) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};

// ---------- Frames ----------
const NECK = [80.9, 88.2];
const HS = 1.24;
const HO = [1.6, -14.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const pivOf = (D, bone) => D.J[D.PIV[bone]];
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = pivOf(D, bone);
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => {
  const q = pivOf(D, bone);
  return D.at(a, bone, [(p[0] - q[0]) * D.SC, (p[1] - q[1]) * D.SC]);
};
const headAt = (a, D, uv) => ptOf(a, D, 'head', hk(uv));
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}

// ---------- Its face ----------
const FACES = {
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'calm' },
  peek: { e: 'open', g: [1.6, 0.6], b: [0.6, 0.8], m: 'calm' },
  hut: { e: 'squeeze', b: [0.8, 0.8], m: 'shout' },
  attention: { e: 'open', g: [1.2, -0.2], b: [-0.4, -0.6], m: 'set' },
  hah: { e: 'shut', b: [0, 0], m: 'o' },
  rub: { e: 'happy', b: [-0.4, -0.6], m: 'calm' },
  admire: { e: 'wide', g: [0.8, 0.6], b: [-1.2, -1.4], m: 'smile' },
  yawn: { e: 'shut', b: [-0.8, -0.8], m: 'yawn' },
  drowsy: { e: 'shut', b: [0.2, 0.2], m: 'calm' },
  startle: { e: 'wide', g: [0.6, 0], b: [-1.8, -2], m: 'o' },
  sheepish: { e: 'open', g: [-0.8, 0.8], b: [-1, -1.2], m: 'wobble' },
  munch: { e: 'happy', b: [-0.4, -0.6], m: 'munch' },
  content: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  focus: { e: 'open', g: [1.5, 0.3], b: [0.8, 1], m: 'set' },
  fierce: { e: 'open', g: [1.6, 0.3], b: [1.2, 1.4], m: 'grit' },
  shout: { e: 'squeeze', b: [1, 1.2], m: 'shout' },
  salute: { e: 'happy', b: [-0.6, -1], m: 'smile' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'open' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'wobble' },
  worried: { e: 'open', g: [0.3, 1], b: [-1.4, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.2, 0.2], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['hut', 'hah', 'rub', 'yawn', 'drowsy', 'munch', 'content', 'shout', 'salute', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The pebble eye: round on top, flatter underneath.
function pebble(ctx, x, y, w, h) {
  smooth(ctx, [[x - w, y + h * 0.3], [x - w * 0.95, y - h * 0.5], [x - w * 0.4, y - h], [x + w * 0.4, y - h], [x + w * 0.95, y - h * 0.5], [x + w, y + h * 0.3], [x + w * 0.5, y + h * 0.62], [x - w * 0.5, y + h * 0.62]]);
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.5;
  const h = 4;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1.2], [x, y - h * 0.9], [x + w, y + 1.2], 1.5, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.4], 1.4, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.6], 1.25, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.6], [x, y + (kind === 'sleep' ? 2.6 : 2)], [x + w, y + 0.6], 1.45, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
  pebble(ctx, x, y, w * big, h * big);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      if (i) ctx.lineTo(x + Math.cos(an) * u * w * 0.7, y - 0.4 + Math.sin(an) * u * h * 0.6);
      else ctx.moveTo(x, y - 0.4);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.6, 0.3];
    ctx.save();
    pebble(ctx, x, y, w * big, h * big);
    ctx.clip();
    const ix = x + gx * 0.5;
    const iy = y - 0.4 + gy * 0.35;
    const r = w * 0.78 * big;
    // sea-glass rings
    ell(ctx, ix, iy, r, r);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy, r * 0.78, r * 0.78);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.3, r * 0.56, r * 0.36);
    ctx.fillStyle = tone(a, IRIS[3], 0.85);
    ctx.fill();
    ell(ctx, ix, iy - r * 0.05, r * 0.42, r * 0.42);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    // a soft rounded-square window glint
    smooth(ctx, [[ix - r * 0.62, iy - r * 0.62], [ix - r * 0.12, iy - r * 0.64], [ix - r * 0.12, iy - r * 0.14], [ix - r * 0.62, iy - r * 0.12]]);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ix + r * 0.38, iy + r * 0.34, r * 0.12, r * 0.12);
    ctx.fill();
    ctx.restore();
  }
  // a thick neat lash line over the top, ending in a round dot at the outer corner
  ctx.beginPath();
  ctx.moveTo(x - w * big * 1.02, y + h * big * 0.1);
  ctx.bezierCurveTo(x - w * big * 0.9, y - h * big * 1.15, x + w * big * 0.9, y - h * big * 1.15, x + w * big * 1.02, y + h * big * 0.1);
  pen(ctx, tone(a, LASH), 1.45);
  ctx.stroke();
  ell(ctx, x + w * big * 1.05 * o, y + h * big * 0.12, 0.7, 0.7);
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
}
// Pale ridge brows (a soft scale ridge each).
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 2.2, y + lift + 0.4);
  ctx.quadraticCurveTo(x, y - 0.9 + lift * 0.6, x + o * 2.2, y + lift * 0.3 + 0.3);
  pen(ctx, tone(a, SKIN[3]), 1.5);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#3e6a5a';
  const DARK = '#5a2e44';
  const line = (pts, w = 0.8) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y - 0.5], [x + w * 0.8, y + h], [x, y + h * 1.15], [x - w * 0.8, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.5, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
  };
  switch (m) {
    case 'smile':
      line([[x - 3, y - 0.6], [x - 0.6, y + 1.4], [x + 2.6, y + 0.2], [x + 3.4, y - 0.4], [x + 3.6, y - 0.9]]);
      break;
    case 'set':
      line([[x - 3, y + 0.3], [x, y + 0.6], [x + 3.2, y + 0.1]], 0.9);
      break;
    case 'open':
      open(2.2, 2.2);
      break;
    case 'shout':
      open(2.6, 2.8);
      break;
    case 'yawn':
      open(2.4, 3.6);
      break;
    case 'o':
      ell(ctx, x, y + 0.9, 1, 1.15);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'munch':
      line([[x - 2.6, y + 0.2], [x - 1.2, y + 1], [x, y + 0.4], [x + 1.4, y + 1], [x + 2.8, y + 0.1]], 0.8);
      ell(ctx, x - 3.6, y - 0.4, 1.8, 1.3);
      ctx.fillStyle = tone(a, SKIN[0], 0.6);
      ctx.fill();
      break;
    case 'grit':
      line([[x - 3, y + 0.5], [x, y + 0.2], [x + 3, y + 0.4]], 1);
      break;
    case 'wobble':
      line([[x - 2.6, y + 0.4], [x - 1.3, y - 0.2], [x, y + 0.3], [x + 1.3, y - 0.2], [x + 2.6, y + 0.4]], 0.75);
      break;
    case 'frown':
      line([[x - 2.6, y + 1], [x, y], [x + 2.6, y + 1]]);
      break;
    case 'talkA':
      open(1.8, 2);
      break;
    case 'talkE':
      open(2.2, 1.2);
      break;
    default:
      // at rest: the small beak, closed, a little hook at its tip
      line([[x - 3, y], [x, y + 0.7], [x + 2.8, y + 0.2], [x + 3.4, y + 0.1], [x + 3.6, y - 0.5]], 0.75);
  }
}
// The head: a smooth rounded wedge, its beak soft at the front.
const SKULL = [[-16, 4], [-15.4, -6], [-10, -13], [0, -15.6], [9, -14.2], [15.6, -9.4], [20.2, -3.6], [23, 2.2], [22.2, 7], [17, 10.6], [8, 12.8], [-2, 13.6], [-11, 11.2]];
// The scallop-shell helm: a fluted cap, its ribs fanning from a little coral knob.
function helm(ctx, a, mode) {
  const q = a.gl ?? {};
  const tip = q.helmTip ?? 0;
  ctx.save();
  ctx.translate(0, -6);
  ctx.rotate(tip * 0.22);
  ctx.translate(0, 6);
  const cap = [[-16.6, -2], [-16, -9], [-11, -15.6], [-2, -18.8], [8, -18], [15.6, -13.4], [18.6, -7.6], [17, -7.6], [9, -11.6], [0, -12.4], [-9, -10], [-14.6, -4]];
  smooth(ctx, cap);
  paint(ctx, a, mode, SCAL[1]);
  ell(ctx, -1, -19.6, 1.8, 1.6);
  paint(ctx, a, mode, COAT[2]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, cap);
    ctx.clip();
    glow(ctx, -2, -16, 10, SCAL[0], 0.9);
    // its ribs, fanning from the knob: soft deeper bands
    for (let i = 0; i < 7; i++) {
      const an = Math.PI * (0.92 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(-1, -19);
      ctx.lineTo(-1 + Math.cos(an) * -22, -19 + Math.sin(an) * -22);
      pen(ctx, tone(a, SCAL[2], 0.6), 1.1);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-14.6, -4.2);
    ctx.quadraticCurveTo(0, -13.6, 17.2, -7.8);
    pen(ctx, tone(a, SCAL[3], 0.8), 0.7);
    ctx.stroke();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 2, -8, 15, SKIN[0], 0.85);
    glow(ctx, -13, 8, 10, SKIN[2], 0.6);
    // a pale throat and beak
    smooth(ctx, [[4, 5], [12, 3], [22, 3.6], [21.6, 7.6], [15, 11], [4, 13.4], [-4, 13]]);
    ctx.fillStyle = tone(a, THROAT[1]);
    ctx.fill();
    // two soft paler scale patches on the side of its head
    for (const pts of [[[-12, -6], [-7, -8.6], [-4.6, -4.6], [-8.6, -2], [-12.4, -2.6]], [[-13.6, 2], [-10.4, 0.6], [-8.6, 3.6], [-11.6, 6]]]) {
      smooth(ctx, pts);
      ctx.fillStyle = tone(a, SKIN[0], 0.32);
      ctx.fill();
    }
    ctx.restore();
    for (const [cx, cy, k] of [[-6.4, 6.4, 0.6], [9.6, 7, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ffa0b0', 0.38 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -1.6, -1.6, -1, f);
    eye(ctx, a, 11, -2, 1, f);
    brow(ctx, a, -1.8, -8.2, -1, (f.b?.[0] ?? 0) * 0.9);
    brow(ctx, a, 11, -8.8, 1, (f.b?.[1] ?? 0) * 0.9);
    // two small nostrils' worth of a soft nose shade, never dots: one soft dash
    ctx.beginPath();
    ctx.moveTo(20.4, 1.2);
    ctx.quadraticCurveTo(21.4, 0.6, 22.2, 1.2);
    pen(ctx, tone(a, SKIN[3], 0.7), 0.6);
    ctx.stroke();
    mouth(ctx, a, 17.6, 5.4, f.m);
  }
  helm(ctx, a, mode);
  ctx.restore();
}

// ---------- Its shell (behind it) ----------
function shell(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const o = (x, y) => [st[0] + x, st[1] + y];
  const dome = [o(-6, -9), o(-20, -6), o(-31, 6), o(-34, 22), o(-28, 36), o(-14, 42), o(0, 40), o(6, 26), o(4, 6)];
  smooth(ctx, dome);
  paint(ctx, a, mode, SHELL[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, dome);
    ctx.clip();
    glow(ctx, ...o(-18, 8), 14, SHELL[0], 0.9);
    glow(ctx, ...o(-12, 34), 12, SHELL[3], 0.5);
    // its plates: soft rounded shapes a shade apart, a thin soft seam between
    const plates = [
      [[-20, 6], [-11, 3], [-6, 12], [-12, 18], [-21, 16]],
      [[-24, 20], [-14, 20], [-10, 29], [-16, 35], [-24, 31]],
      [[-8, 16], [0, 14], [2, 24], [-4, 31], [-10, 27]],
    ];
    plates.forEach((pp, i) => {
      smooth(ctx, pp.map(([x, y]) => o(x, y)));
      ctx.fillStyle = tone(a, i === 1 ? SHELL[2] : SHELL[0], 0.55);
      ctx.fill();
    });
    // the warm cream rim round its edge
    smooth(ctx, dome);
    pen(ctx, tone(a, RIM[1]), 2.2);
    ctx.stroke();
    ctx.restore();
    // three little pastel barnacles, like medals (closed cones, a soft pink tip, never a dark hole)
    for (const [bx, by, s] of [[-21, 12, 1], [-15, 27, 0.85], [-25, 26, 0.7]]) {
      const [x, y] = o(bx, by);
      smooth(ctx, [[x - 3 * s, y + 2 * s], [x - 1.6 * s, y - 2 * s], [x + 1.6 * s, y - 2 * s], [x + 3 * s, y + 2 * s]]);
      ctx.fillStyle = tone(a, BARN[1]);
      ctx.fill();
      ell(ctx, x, y - 2 * s, 1.5 * s, 0.8 * s);
      ctx.fillStyle = tone(a, BARN[3]);
      ctx.fill();
      ell(ctx, x - 1 * s, y, 0.7 * s, 1.2 * s);
      ctx.fillStyle = tone(a, BARN[0], 0.9);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- Its surcoat ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
}
function surcoat(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const J = D.J;
  const st = J.stern;
  const w = J.waist;
  const h = J.hip;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  const c0 = C([st[0] + 4, st[1] + 7]);
  glow(ctx, c0[0], c0[1], 7, COAT[0], 0.8);
  // its own green below the surcoat's hem, the cream hem band
  poly(ctx, [T([h[0] - 40, h[1] + 2]), T([h[0] + 40, h[1] + 3]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, SKIN[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...T([h[0] - 40, h[1] + 1.4]));
  ctx.lineTo(...T([h[0] + 40, h[1] + 2.4]));
  pen(ctx, tone(a, TRIM[1]), 1.8);
  ctx.stroke();
  // the cream belt
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 40, w[1] + 1]));
  ctx.lineTo(...W([w[0] + 40, w[1] + 1]));
  pen(ctx, tone(a, TRIM[2]), 2);
  ctx.stroke();
  pen(ctx, tone(a, TRIM[1]), 1.1);
  ctx.stroke();
  // a little scallop badge on its chest
  const bd = C([st[0] + 6, st[1] + 8]);
  ctx.save();
  ctx.translate(...bd);
  smooth(ctx, [[-2.4, 1.6], [-2.6, -0.6], [-1.4, -2.4], [0, -2.8], [1.4, -2.4], [2.6, -0.6], [2.4, 1.6], [0, 2]]);
  ctx.fillStyle = tone(a, TRIM[0]);
  ctx.fill();
  for (const dx of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 1.6);
    ctx.lineTo(dx * 1.6, -2);
    pen(ctx, tone(a, COAT[1], 0.8), 0.35);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
// The surcoat's shoulder edges: a soft cream trim where its arms come out (the arms are bare).
function armhole(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  const S0 = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(E[1] - S0[1], E[0] - S0[0]);
  ctx.save();
  ctx.translate(...S0);
  ctx.rotate(ang);
  smooth(ctx, [[-1.6, -2.6], [1.6, -2.8], [1.4, 2.8], [-1.6, 2.6]]);
  ctx.fillStyle = tone(a, k === 'F' ? COAT[2] : COAT[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1.4, -2.6);
  ctx.lineTo(1.2, 2.6);
  pen(ctx, tone(a, TRIM[1]), 0.8);
  ctx.stroke();
  ctx.restore();
}
// Its scallop shield (hand space: along +x from its grip is up through the shell's middle).
function shieldAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0], y: p[1], ang: a.gl?.shieldAng ?? -1.2 };
}
function shield(ctx, a, mode, D) {
  const S = shieldAt(a, D);
  ctx.save();
  ctx.translate(S.x, S.y);
  ctx.rotate(S.ang);
  // (the fan: its hinge by the grip, its scalloped edge out along +x)
  const fan = [[-2.2, -2.6], [-1.4, -4], [3, -6.4], [7.4, -6.6], [9.8, -4.4], [10.8, -1.4], [11, 1.4], [9.8, 4.4], [7.4, 6.6], [3, 6.4], [-1.4, 4], [-2.2, 2.6]];
  smooth(ctx, fan);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, SCAL[3]);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, SCAL[1]);
  ctx.fill();
  ctx.save();
  smooth(ctx, fan);
  ctx.clip();
  glow(ctx, 6, -2, 7, SCAL[0], 1);
  glow(ctx, 4, 5, 6, SCAL[2], 0.6);
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.lineTo(12, i * 2.6);
    pen(ctx, tone(a, SCAL[2], 0.7), 0.7);
    ctx.stroke();
  }
  ctx.restore();
  // its hinge "ears"
  smooth(ctx, [[-3.2, -2.4], [0.4, -2.6], [0.6, 2.6], [-3.2, 2.4]]);
  ctx.fillStyle = tone(a, SCAL[2]);
  ctx.fill();
  if ((a.gl?.gleam ?? 0) > 0.01) glow(ctx, 6, -3, 4, '#ffffff', a.gl.gleam);
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { drill: 7.2, polish: 6.4, yawn: 6.6, snack: 6.8 };
const ORDER = ['drill', 'polish', 'yawn', 'snack'];
const POOL = ['shove', 'shell', 'stomp'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
const GUARD = { shN: -70, elN: -60, hwN: 0, shF: -50, elF: -80 };

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, blush: 0, shieldAng: -1.25, helmTip: 0, gleam: 0, hah: 0, hutS: -1, lettuce: -1, bite: 0, shoveS: -1, slamS: -1, stompS: -1, sweat: -1, zz: 0, flipNow: false };
  a.gl = q;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  const aim = (ang, k) => {
    q.shieldAng = mix(q.shieldAng, ang, k);
  };
  const { alive, mvName, W, s, hurt, ago, fighting, napping, cine, low } = F;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const U = a[`tk${ID}U`] ?? 0;
  const br = c.breath ?? 0;
  // Standing: square and dutiful, its shield at its side, the far hand easy.
  go({ shN: -14 + br * 1.2, elN: -30, hwN: 0, shF: -10 + br, elF: -30, hwF: 0, head: -2, chest: -br * 0.6 }, 1);
  add({ tilt: 2, chest: Math.sin(U * TAU * 2) * 1.5 }, walking);

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);

  if (k > 0.001 && piece === 'drill') {
    // shield up, a peek over its rim
    const up = win(pu, 0.2, 0.6, 2.2, 2.5);
    go({ ...GUARD, head: 4, lift: -0.03, tilt: 6 }, up * k);
    aim(-0.15, up * k);
    say('peek', up * k);
    // two "hut!" shoves at nothing
    for (const t0 of [2.4, 3.8]) {
      const sh = win(pu, t0, t0 + 0.15, t0 + 0.5, t0 + 0.9);
      go({ ...GUARD, shN: -86, elN: -20, tilt: 12, x: 0.04 }, sh * k);
      aim(-0.05, sh * k);
      say('hut', win(pu, t0, t0 + 0.1, t0 + 0.4, t0 + 0.55) * k);
      if (pu > t0 && pu < t0 + 0.8) q.hutS = pu - t0;
    }
    // attention
    const at = win(pu, 5.2, 5.5, 6.8, 7.2);
    go({ chest: -4, tilt: -3, head: -4, shF: 4, elF: -10 }, at * k);
    say('attention', at * k);
  }
  if (k > 0.001 && piece === 'polish') {
    // the shield held up to its face, a breath on it
    const hold = win(pu, 0.2, 0.6, 5.6, 6.1);
    go({ shN: -56, elN: -70, hwN: 0, head: 6 }, hold * k);
    aim(-1.45, hold * k);
    const hh = win(pu, 0.6, 0.9, 1.5, 1.8);
    say('hah', hh * k);
    q.hah = hh * k;
    // a rub with its far hand
    const rb = win(pu, 1.8, 2.1, 3.8, 4.1);
    go({ shF: -90 + Math.sin(pu * 12) * 12, elF: -70, hwF: -10 }, rb * k);
    say('rub', rb * k);
    // a gleam; admiration
    q.gleam = win(pu, 4.0, 4.3, 4.7, 5.2) * k * 0.9;
    say('admire', win(pu, 4.1, 4.4, 5.8, 6.2) * k);
  }
  if (k > 0.001 && piece === 'yawn') {
    // a long slow yawn
    const yw = win(pu, 0.2, 1.0, 2.2, 2.8);
    go({ head: -12, chest: -5, tilt: -4, shF: -30, elF: -20 }, yw * k);
    say('yawn', yw * k);
    // its head sinking, eyes closing
    const sk = win(pu, 2.6, 3.4, 4.3, 4.4);
    go({ head: 14, lift: -0.03, chest: 4, shN: 0, elN: -10 }, sk * k);
    aim(-1.0, sk * k);
    q.helmTip = 0.8 * sk * k;
    say('drowsy', sk * k);
    // it snaps back to attention, embarrassed
    const sn = win(pu, 4.4, 4.55, 6.1, 6.5);
    go({ chest: -5, tilt: -4, head: -6, lift: 0.01 }, sn * k);
    say(pu < 5 ? 'startle' : 'sheepish', sn * k);
    q.blush = Math.max(q.blush, win(pu, 4.8, 5.1, 6.2, 6.5) * k);
  }
  if (k > 0.001 && piece === 'snack') {
    // a ribbon of sea lettuce from its belt
    const gt = win(pu, 0.2, 0.5, 1.0, 1.2);
    go({ shF: 10, elF: -60, hwF: -20, head: 8 }, gt * k);
    // munched very slowly
    const mu = win(pu, 1.1, 1.5, 5.0, 5.4);
    go({ shF: -60, elF: -130, hwF: -30, head: 4 + Math.sin(pu * 4.4) * 2 }, mu * k);
    say('munch', mu * k);
    if (pu > 0.9 && pu < 5.4) q.lettuce = pu - 0.9;
    q.bite = clamp((pu - 1.4) / 3.6, 0, 1);
    // content
    say('content', win(pu, 5.3, 5.6, 6.4, 6.8) * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: low behind its raised shield (eased in and out) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(5));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ ...GUARD, lift: -0.03, tilt: 6, head: 3 }, hw);
    aim(-0.2, hw);
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    aim(-0.7, 0.6);
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.6) / 0.45)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'shove') {
      // it rocks back on its heels, the shield drawn in
      go({ ...GUARD, shN: -40, elN: -100, tilt: -12, chest: -5, head: -4, x: -0.05, toeN: -10, toeF: -8 }, wu);
      aim(-0.4, sstep(W));
      say('focus', W);
      // then a heavy lunge, shield first
      if (s >= 0) {
        const back = sstep((s - 0.5) / 0.45);
        go({ ...GUARD, shN: -90, elN: -14, tilt: 18 * (1 - back), chest: 6, head: 4, x: 0.24 * (1 - back), fxN: 0.5 * (1 - back), fxF: 0.3 * (1 - back), lift: -0.02 }, sw);
        aim(-0.05, sw);
        q.shoveS = s;
        say('shout', win(s, 0, 0.04, 0.45, 0.55));
      }
    } else if (mvName === 'shell') {
      // it turns its back (a clean mirror flip) and crouches
      if (W > 0.3 || (s >= 0 && s < 0.75)) q.flipNow = true;
      go({ lift: -0.07, tilt: 10, head: 6, shN: -40, elN: -60, shF: -30, elF: -60 }, wu);
      aim(-0.9, wu);
      say('focus', W);
      // then slams backward into you with its shell (backward is your way: it has its back to you)
      if (s >= 0) {
        const out1 = sstep(s / 0.16);
        const back = sstep((s - 0.45) / 0.4);
        go({ x: -0.26 * out1 * (1 - back), tilt: -16 * out1 * (1 - back), chest: -6, head: -8, lift: -0.02, fxN: -0.4 * out1 * (1 - back), fxF: -0.3 * out1 * (1 - back) }, sw);
        add({ hop: Math.sin(Math.PI * clamp(s / 0.4, 0, 1)) * 0.04 }, sw);
        q.slamS = s;
        say('shout', win(s, 0, 0.04, 0.4, 0.5));
      }
    } else {
      // one foot raised high, arms out
      go({ lift: 0.02, tilt: -6, chest: -3, head: -4, shN: -80, elN: -20, shF: -70, elF: -20, fxN: 0.15, fyN: 0.5 }, wu);
      aim(-0.6, wu);
      say('focus', W);
      // then a stomp, a soft wave rolling out both ways
      if (s >= 0) {
        go({ lift: -0.05, tilt: 8, chest: 4, head: 6, shN: -40, elN: -40, shF: -40, elF: -40, fxN: 0.15 }, sw);
        q.stompS = s;
        say('shout', win(s, 0, 0.04, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: its head pulled in, a wince -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ head: 14, lift: -0.03, tilt: -8, chest: 6, ...GUARD }, kh);
    aim(-0.3, kh);
    q.face = 'hurt';
    q.helmTip = Math.max(q.helmTip, 0.4 * kh);
  }
  // ----- After landing a hit: chest out, a salute -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.4 && alive && !hurt) {
    const kg = win(gl, 0, 0.3, 1.0, 1.4) * (1 - F.moveW);
    go({ chest: -6, tilt: -4, head: -4, shF: -150, elF: -110, hwF: -20 }, kg);
    say('salute', kg);
  }
  // ----- A nap (its habitat): sat down, its helm tipped forward -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    go({ lift: -0.18 + Math.sin(now * 1.1) * 0.004, tilt: 6, head: 16 + Math.sin(now * 1.1) * 1.5, chest: 3, shN: -20, elN: -40, shF: -20, elF: -60, fxN: 0.3, fxF: 0.2, fyN: 0.02, fyF: 0.02 }, nw);
    aim(-0.6, nw);
    q.helmTip = Math.max(q.helmTip, 0.6 * nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !F.busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.helmTip = 0.7;
  }
  settleFace(st, q, now, m.uid, SHUTS, 5.2);
  // (the shield's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly)
  {
    let x = st.k_shX ?? q.shieldAng;
    let v = st.k_shV ?? 0;
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    const K = mvName ? 380 : 220;
    for (let i = 0; i < n; i++) {
      v += (K * (q.shieldAng - x) - 2 * Math.sqrt(K) * v) * h;
      x += v * h;
    }
    st.k_shX = x;
    st.k_shV = v;
    q.shieldAng = x;
  }
  easeKeys(st, q, ['blush', 'helmTip', 'gleam', 'hah'], dt, () => 9);
  q.calm = k;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little scallop shell.
const BUBBLE = [[-6, 3], [-6.6, -1.6], [-4, -5.4], [0, -6.8], [4, -5.4], [6.6, -1.6], [6, 3], [2.4, 5.6], [-2.4, 5.6]];
const BCOL = [INK, '#fff8f4', COAT[3], '#5a8a8a'];
function splash(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  smooth(ctx, [[0, -1.8 * s], [1 * s, 0.2 * s], [0.8 * s, 1.1 * s], [-0.8 * s, 1.1 * s], [-1 * s, 0.2 * s]]);
  ctx.fillStyle = WATER[2];
  ctx.fill();
  ell(ctx, -0.25 * s, 0.1 * s, 0.25 * s, 0.45 * s);
  ctx.fillStyle = WATER[0];
  ctx.fill();
  ctx.restore();
}
// A soft wave rolling along the floor (`d` its way), its crest curling over.
function wave(ctx, x, y, h, d, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(d, 1);
  smooth(ctx, [[-8, 0.6], [-4, -h * 0.4], [0, -h], [2.6, -h * 0.9], [3, -h * 0.5], [1.4, -h * 0.5], [4, 0.6]]);
  ctx.fillStyle = WATER[1];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-5, -h * 0.3);
  ctx.quadraticCurveTo(-1, -h * 0.95, 2.4, -h * 0.8);
  pen(ctx, WATER[0], 0.8);
  ctx.stroke();
  ctx.restore();
}

function under2() {}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const Sd = shieldAt(a, D);
  const face = [Sd.x + Math.cos(Sd.ang) * 6, Sd.y + Math.sin(Sd.ang) * 6];
  // "hut!"
  if ((q.hutS ?? -1) >= 0 && q.hutS < 0.8) {
    const [mx, my] = headAt(a, D, [22, 2]);
    ctx.save();
    ctx.globalAlpha *= sstep(q.hutS / 0.08) * (1 - sstep((q.hutS - 0.55) / 0.25));
    cue(ctx, 'hut!', mx + 6, my - 8 - q.hutS * 3, 3.4, a.flip ? -1 : 1, -0.1, COAT[3], '#fffaf2');
    ctx.restore();
  }
  // a breath on the shield
  if ((q.hah ?? 0) > 0.05) dust(ctx, face[0], face[1], 1.6, q.hah * 0.6, '#ffffff', '#e2eef4');
  if ((q.gleam ?? 0) > 0.2) sparkle(ctx, face[0] + 1, face[1] - 2, 2.2 * q.gleam, 1, '#ffffff');
  // the ribbon of sea lettuce, shorter with every bite
  if ((q.lettuce ?? -1) >= 0) {
    const [px, py] = ptOf(a, D, 'handF', D.J.handF);
    const L = 6 * (1 - q.bite * 0.75);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let i = 1; i <= 4; i++) ctx.lineTo(px + Math.sin(i * 1.6 + (a.now ?? 0) * 2) * 1.2, py + (i / 4) * L);
    pen(ctx, LETTUCE[1], 1.8);
    ctx.stroke();
    pen(ctx, LETTUCE[0], 0.9);
    ctx.stroke();
    ctx.restore();
  }
  // ----- Shield Shove: a soft splash of spray off the shield -----
  if ((q.shoveS ?? -1) >= 0 && q.shoveS > 0.08 && q.shoveS < 0.75) {
    if (!a.mo.kShove) a.mo.kShove = face.slice();
    const [sx, sy] = a.mo.kShove;
    const u = (q.shoveS - 0.08) / 0.67;
    for (let i = 0; i < 5; i++) {
      const an = -1.2 + i * 0.6;
      splash(ctx, sx + 3 + Math.cos(an) * (2 + u * 10), sy + Math.sin(an) * (2 + u * 7) + u * u * 6, 0.9, 1 - u);
    }
    sparkle(ctx, sx + 4, sy - 1, 2.2 * Math.sin(Math.PI * u), 1, '#ffffff');
  } else a.mo.kShove = null;
  // ----- Shell Slam: a ring of sparkles off its shell -----
  if ((q.slamS ?? -1) >= 0 && q.slamS > 0.1 && q.slamS < 0.7) {
    const [cx, cy] = ptOf(a, D, 'chest', [60, 100]);
    const u = (q.slamS - 0.1) / 0.6;
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU + 0.3;
      sparkle(ctx, cx + Math.cos(an) * (4 + u * 9), cy + Math.sin(an) * (4 + u * 7), 1.6 * (1 - u), 1, i % 2 ? BARN[3] : '#ffffff');
    }
  }
  // ----- Tide Stomp: a soft wave rolling out along the floor both ways, a little spray -----
  if ((q.stompS ?? -1) >= 0 && q.stompS < 1.0) {
    const u = q.stompS;
    const fade = 1 - sstep((u - 0.6) / 0.4);
    for (const d of [1, -1]) wave(ctx, d * (6 + u * 30), 0.4, 4 * Math.sin(Math.PI * clamp(u / 0.9, 0, 1)) + 1, d, fade);
    if (u < 0.5) for (let i = 0; i < 4; i++) splash(ctx, (i - 1.5) * 4, -2 - Math.sin(Math.PI * u / 0.5) * (5 + (i % 2) * 3), 0.8, 1 - u / 0.5);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-14, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -26]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.38 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#7aa49a', '#fffaf2');
    }
  }
  const [bx, by] = headAt(a, D, [4, -38]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  // (the skin is its surcoat; its own green at its bare arms, hands, legs, feet and neck)
  skin: {
    lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: LW,
    parts: {
      arm: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      leg: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      hand: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      foot: { lt: SKIN[1], base: SKIN[2], sh: SKIN[3], deep: '#4a7e68' },
      neck: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  under2,
  under: {
    torso: (ctx, a, mode, S, D) => shell(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => shield(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => surcoat(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => armhole(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => armhole(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('turtle', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Shell Slam: turned round with a clean mirror flip, never a squeeze)
  const st = a.mo?.rig;
  const flip0 = a.flip;
  if (st?.kFlip && m.hp > 0) a.flip = !a.flip;
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
  a.flip = flip0;
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
export const TURTLE_SQUIRE_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [140, 200, 380, 280], draw: R.still, rig, noHop: true, ownEmotes: true };
export const TURTLE_SQUIRE_SIZE = { w: 32, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
