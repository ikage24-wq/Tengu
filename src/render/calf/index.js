// The Strawberry Calf (2026-11-27, the Candy Volcano's Gummy Bear Brawler remade from scratch as a new
// creature; the id stays `gummybear`). A little calf of the Gumdrop Hills, where the grass is spun sugar
// and the gumdrops grow like flowers: a cream calf with strawberry-milk spots, who wears a gumdrop on a
// ribbon for a cowbell (a sugar crystal inside it for a clapper) and is very proud of it. It grazes the
// candy flowers, frolics in calf zoomies and practises its moo, which is much smaller than it would
// like. On its own copy of the creature base (rig.js; body.js `calf`: a sturdy round little calf, legs a
// touch long, short arms), dressed here; its head, ears, horns, forelock, spots, hooves, bell and tail
// drawn here from scratch over the mannequin (never the shared face, never the hero).
//   look    a cream coat with soft strawberry-pink spots (one over its far eye and ear), a big round pink
//           muzzle with comma nostrils; floppy ears out to the sides on springs, pink inside; two little
//           caramel horn nubs; a short strawberry-blond forelock of three rounded clumps, cut well above
//           its brows; its own eyes ("milk-drop eyes": round with a soft downturned outer corner, a
//           chestnut iris warming to caramel at the bottom with a pink rim light, a round glint and a
//           tiny heart glint, a neat lash line with two round-tipped lashes curling down at the outer
//           corner); round pink brows; caramel hooves; a mint ribbon collar with its gumdrop bell; a
//           thin tail with a pink tuft on a spring. Its own soft rose-brown outline, outer edge only,
//           face bare.
//   walk    the base's walk at a calf's unhurried amble, its head nodding with each step the way a
//           cow's does, its bell swinging, its tail swaying.
//   idle    a 27 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - graze (7.6 s): a gumdrop flower pops up at its feet; it bends, nips it off, comes up
//             chewing the way a calf does (jaw sliding side to side), swallows, a happy sigh;
//           - frolic (6.6 s): calf zoomies: a play bow, three bucking hops with its heels kicked up,
//             a prance on the spot; then puffed, panting, pleased with itself;
//           - bell (6.8 s): it looks down at its bell and taps it, ding!; delighted, it shakes its head to
//             ring it, notes flying, until it's dizzy; a giggle;
//           - moo (6.4 s): a big breath in and its moo comes out tiny; it stares; a bigger breath up on
//             its toes, MOO!, which squeaks; a hoof over its mouth, blushing.
//   moves   Head Butt (its head down, a hoof scraping the ground, snorting; then a short charge, bonk,
//           and back); Hoof Stamp (it rears up on its hind legs, forehooves high; then stamps down,
//           a ring of sugar dust); Bell Clang (its head tossed back, the bell swung back on its ribbon;
//           then a hard nod and the bell flung out at you, DING, rings and notes).
//   else    hurt: a wince, ears flat back, its bell jangling; after landing a hit: a proud snort and a
//           tail swish; hunting you: head low, ears forward, a hoof pawing; low on health: worried, a
//           bead of sweat; a nap (habitat): lying down, its chin on its hooves, z's; beaten: dizzy. Its
//           marks over its head (!, ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: sugar as soft pink-and-white sparkles, dust as
// soft cream puffs, notes round-headed in strawberry pink, its moo a soft round word.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust, note, cue } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee, ribbon } from './act.js';

const BIG = 1.2;
const LW = 1.6 / BIG;
const INK = '#a2687a';
const COAT = ['#fffdf8', '#fbf1e6', '#ecd6c6', '#d2b4a4'];
const SPOT = ['#ffd2de', '#ffb0c4', '#f08aa6'];
const MUZZLE = ['#ffe0e6', '#ffc2d0', '#ef9db2'];
const HAIR = ['#fff0d6', '#f8c8a4', '#e6a07e', '#c27c62'];
const HORN = ['#fff4dc', '#f0d0a0', '#c89a68'];
const HOOF = ['#d6a07a', '#ad7a58', '#86583e'];
const LASH = '#4a2a30';
const IRIS = ['#3a1e1e', '#6a3428', '#9e5a3a', '#d8965e', '#ffc2d2'];
const RIBBON = ['#d8fff0', '#8ee0c0', '#58b896'];
const GUM = ['#ffe0ea', '#ff98b4', '#e8607e', '#c04462'];
const SUGAR = '#ffe8f0';

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
const ID = 'strawcalf';
const NECK = [80.9, 87.3];
const HS = 1.3;
const HO = [1.5, -16.5];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const EAR_F = [-15.6, -7.4];
const EAR_N = [13.4, -10.6];
const TAIL_A = [71.6, 114];
const TAIL_B = [66.4, 117.2];
const BELL = [86.6, 92.6];
const JOINTS = { earF: hk(EAR_F), earN: hk(EAR_N), tailA: TAIL_A, tailB: TAIL_B, bell: BELL };
const PIV2 = { earF: 'earF', earN: 'earN', tailA: 'tailA', tailB: 'tailB', bell: 'bell' };
const SOFTS = [
  { name: 'earF', parent: 'head', pivot: 'earF', rot: (S, a) => a.gl?.earF ?? 0, soft: { k: 110, c: 6.4, gain: 0.34, turn: 0.6, hang: 0.15, max: 13, flutter: 1, hz: 0.45, dir: [-7, 2] } },
  { name: 'earN', parent: 'head', pivot: 'earN', rot: (S, a) => a.gl?.earN ?? 0, soft: { k: 118, c: 6.4, gain: 0.34, turn: 0.6, hang: 0.15, max: 13, flutter: 1, hz: 0.5, dir: [7, 2] } },
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 70, c: 5.4, gain: 0.42, turn: 0.8, hang: 0.1, max: 13, flutter: 1.2, hz: 0.4, dir: [-3, 8] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 60, c: 4.8, gain: 0.48, turn: 0.8, hang: 0.12, max: 15, flutter: 1.6, hz: 0.48, dir: [-2, 8] } },
  { name: 'bell', parent: 'chest', pivot: 'bell', rot: (S, a) => a.gl?.bellRot ?? 0, soft: { k: 120, c: 6, gain: 0.4, turn: 0.7, hang: 0.5, max: 14, flutter: 0.6, hz: 0.6, dir: [0, 6] } },
];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? PIV2[bone]];
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
const angOf = (M) => Math.atan2(M[1], M[0]);
const swingOf = (a, name, parent) => {
  const d = angOf(a.blMat(name)) - angOf(a.blMat(parent));
  return Math.atan2(Math.sin(d), Math.cos(d));
};

// ---------- Its face ----------
// e: open | wide | happy | shut | sleep | squeeze | dizzy | wink; g gaze; b brows [outer, inner]; m mouth.
const FACES = {
  calm: { e: 'open', g: [0.4, 0.3], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.8], m: 'open' },
  cozy: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  down: { e: 'open', g: [0.6, 1.8], b: [-0.4, -0.8], m: 'calm' },
  nip: { e: 'shut', b: [0, -0.4], m: 'o' },
  chew: { e: 'happy', b: [-0.3, -0.5], m: 'chew' },
  sigh: { e: 'happy', b: [-0.8, -1.2], m: 'smile' },
  glee: { e: 'happy', b: [-1, -1.2], m: 'grin' },
  wild: { e: 'wide', g: [1, -0.6], b: [-1.4, -1.6], m: 'grin' },
  pant: { e: 'happy', b: [-0.4, -1], m: 'pant' },
  proud: { e: 'happy', b: [-0.8, -0.4], m: 'smile' },
  curious: { e: 'open', g: [0.6, 1.9], b: [-1, -1.6], m: 'o' },
  delight: { e: 'wide', g: [0.4, 1.4], b: [-1.6, -1.8], m: 'open' },
  shake: { e: 'squeeze', b: [-0.6, -0.8], m: 'grin' },
  woozy: { e: 'dizzy', b: [0.8, -1], m: 'wobble' },
  giggle: { e: 'happy', b: [-1, -1.4], m: 'grin' },
  breath: { e: 'shut', b: [-0.6, -1], m: 'puff' },
  moo: { e: 'shut', b: [-1, -1.4], m: 'o' },
  stare: { e: 'wide', g: [0.2, 1.2], b: [-1.8, -2], m: 'small' },
  big: { e: 'squeeze', b: [-0.8, 1.4], m: 'shout' },
  sheepish: { e: 'happy', b: [1, -1.4], m: 'smile' },
  focus: { e: 'open', g: [1.2, 0.6], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.5, 0.4], b: [-1, 2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  cheeky: { e: 'wink', g: [1, 0.2], b: [-0.8, -0.6], m: 'blep' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  surprised: { e: 'wide', g: [0.2, -0.4], b: [-2, -2.2], m: 'o' },
  worried: { e: 'open', g: [0.3, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'cozy', 'nip', 'chew', 'sigh', 'glee', 'pant', 'proud', 'shake', 'woozy', 'giggle', 'breath', 'moo', 'big', 'sheepish', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A tiny heart (its eye's second glint).
function heart(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.9);
  ctx.fillStyle = col;
  ctx.fill();
}
// The milk-drop eye's outline: round, fuller at the bottom, its outer corner (o's side, away from the
// middle of its face) sitting a little lower.
function dropPath(ctx, x, y, w, h, o) {
  smooth(ctx, [[x + w * o * 1.0, y + h * 0.18], [x + w * o * 0.86, y - h * 0.62], [x, y - h * 0.96], [x - w * o * 0.86, y - h * 0.68], [x - w * o * 1.0, y + h * 0.02], [x - w * o * 0.74, y + h * 0.78], [x, y + h * 1.02], [x + w * o * 0.78, y + h * 0.86]]);
}
// One eye (head units): x, y its middle; o +1 the eye nearer its nose, -1 the other.
function eye(ctx, a, x, y, o, f) {
  const w = 4.2;
  const h = 4.9;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1], [x, y - h * 1.05], [x + w, y + 1], 1.4, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.3], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.4], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.2], [x, y + (kind === 'sleep' ? 3 : 2.4)], [x + w, y + 0.2], 1.4, LASH);
    // (its two lashes still curl down at the outer corner)
    stroke3(ctx, a, [x + w * o, y + 0.2], [x + (w + 1) * o, y + 0.6], [x + (w + 1.4) * o, y + 1.8], 0.9, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  dropPath(ctx, x, y, w * big, h * big, o);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * w * 0.7;
      const py = y + Math.sin(an) * u * h * 0.7;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[2]), 0.8);
    ctx.stroke();
    stroke3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.25], [x + w, y - h * 0.3], 1.4, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.4, 0.3];
  ctx.save();
  dropPath(ctx, x, y, w * big, h * big, o);
  ctx.clip();
  const ix = x + gx * 0.75;
  const iy = y + gy * 0.6 + 0.3;
  const ir = kind === 'wide' ? 0.86 : 1;
  const iw = w * 0.8 * ir;
  const ih = h * 0.84 * ir;
  // the iris: chestnut, warming to caramel at the bottom, a pink rim light along its lower edge
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.25, iw * 0.9, ih * 0.9);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.32, iw * 0.76, ih * 0.56);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.56, iw * 0.56, ih * 0.28);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.1, iw * 0.86, ih * 0.88, 0, Math.PI * 0.25, Math.PI * 0.75);
  pen(ctx, tone(a, IRIS[4], 0.8), 0.5);
  ctx.stroke();
  ell(ctx, ix, iy - 0.1, iw * 0.4 * ir, ih * 0.42 * ir);
  ctx.fillStyle = tone(a, '#200e10');
  ctx.fill();
  // glints: a round one up by its nose side, a tiny heart low on the other
  ell(ctx, ix - 1.1 * o, iy - 1.7, 1.35 * ir, 1.25 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  heart(ctx, ix + 1.3 * o, iy + 1.9, 0.62, '#ffffff');
  ctx.restore();
  // a neat lash line over the top, round at both ends, and two round-tipped lashes curling down at its
  // outer corner (a calf's long lashes)
  stroke3(ctx, a, [x - w * 0.96 * o, y - h * 0.4], [x, y - h * 1.28], [x + w * 1.02 * o, y + h * 0.05], 1.25, LASH);
  stroke3(ctx, a, [x + w * 0.95 * o, y - h * 0.1], [x + (w + 1.1) * o, y - h * 0.04], [x + (w + 1.7) * o, y + h * 0.4], 0.9, LASH);
  stroke3(ctx, a, [x + w * 0.8 * o, y - h * 0.5], [x + (w + 0.6) * o, y - h * 0.66], [x + (w + 1.4) * o, y - h * 0.5], 0.85, LASH);
}
// Round soft brows, strawberry pink.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.2, y + bo * 0.7);
  ctx.quadraticCurveTo(x, y - 0.9 + (bo + bi) * 0.35, x + o * 2.2, y + bi * 0.7);
  pen(ctx, tone(a, HAIR[2]), 1.6);
  ctx.stroke();
}
// Its mouth, low on its muzzle; `jaw` slides it side to side as it chews.
function mouth(ctx, a, x, y, m, jaw = 0) {
  const LIP = '#a24a64';
  const DARK = '#8a2e4c';
  x += jaw;
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.58, h * 0.34);
    ctx.fillStyle = tone(a, '#ff9cb4');
    ctx.fill();
  };
  const line = (pts, w = 0.75) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const tongue = (dx, dy, l) => {
    smooth(ctx, [[x - 1.2, y + 0.2], [x + 1.2, y + 0.2], [x + 1.4 + dx, y + l * 0.6 + dy], [x + 0.2 + dx, y + l + dy], [x - 1 + dx, y + l * 0.7 + dy]]);
    ctx.fillStyle = tone(a, '#ff8eaa');
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 0.1 + dx * 0.4, y + 0.6);
    ctx.lineTo(x + 0.15 + dx * 0.7, y + l * 0.6 + dy * 0.6);
    pen(ctx, tone(a, '#e0607e', 0.6), 0.35);
    ctx.stroke();
  };
  switch (m) {
    case 'smile':
      line([[x - 2.2, y - 0.3], [x - 1, y + 1.3], [x, y + 0.4], [x + 1, y + 1.3], [x + 2.2, y - 0.4]]);
      break;
    case 'open':
      open(2, 2);
      break;
    case 'grin':
      open(2.5, 2.2);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1, 1.15);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'small':
      ell(ctx, x, y + 0.6, 0.6, 0.55);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'puff':
      line([[x - 1.6, y + 0.4], [x, y + 0.9], [x + 1.6, y + 0.4]], 0.7);
      break;
    case 'shout':
      open(2.4, 2.8);
      break;
    case 'blep':
      line([[x - 2, y], [x, y + 0.6], [x + 2, y]], 0.75);
      ell(ctx, x + 0.4, y + 1.2, 0.9, 1.1);
      ctx.fillStyle = tone(a, '#ff8eaa');
      ctx.fill();
      break;
    case 'lick':
      open(1.6, 1.4);
      tongue(1.6, 0.6, 4.6);
      break;
    case 'pant':
      open(1.9, 1.8);
      tongue(0.4, 0.2, 3);
      break;
    case 'chew':
      // (a soft closed mouth, pushed to one side; a round full cheek)
      line([[x - 1.8, y + 0.4], [x - 0.6, y + 1.1], [x + 0.4, y + 0.6], [x + 1.2, y + 1], [x + 1.8, y + 0.2]], 0.72);
      break;
    case 'set':
      line([[x - 1.8, y + 0.5], [x, y - 0.1], [x + 1.8, y + 0.5]], 0.85);
      break;
    case 'wobble':
      line([[x - 2, y + 0.4], [x - 1, y - 0.4], [x, y + 0.3], [x + 1, y - 0.4], [x + 2, y + 0.4]], 0.7);
      break;
    case 'frown':
      line([[x - 1.8, y + 0.8], [x, y - 0.2], [x + 1.8, y + 0.8]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.7, 0.55);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'talkA':
      open(1.6, 1.9);
      break;
    case 'talkE':
      open(2, 1.1);
      break;
    default:
      // at rest: a soft calf's mouth, its far corner tucked up a touch
      line([[x - 2, y + 0.1], [x - 0.9, y + 0.9], [x, y + 0.4], [x + 1, y + 0.9], [x + 2, y - 0.2]], 0.72);
  }
}
// The skull: round and broad, a soft dome; the muzzle a big round snout low at its front.
const SKULL = [[-18.6, 0], [-17.4, -10], [-11, -16.8], [-1.6, -19.4], [8, -18], [15, -12.6], [18.6, -4.6], [19.6, 3], [16, 11], [6, 15.4], [-6, 14.6], [-14.2, 9.6]];
const MUZ = [[3.6, 5.4], [9, 1.6], [16.6, 1], [22.6, 4], [24.2, 9.6], [20.8, 14.6], [12.6, 16.4], [5.6, 13.8]];
// (its forelock: a soft curly tuft of three round curls on its crown between its horns, well above its
// brows)
const LOCK = [[-7.6, -13.6], [-8.4, -17.2], [-5.4, -20], [-1.6, -19.4], [0.6, -22], [4.6, -21.6], [6.4, -18.8], [9.6, -17.4], [9.8, -14], [7, -12.2], [3.4, -13], [0.2, -11.8], [-3.6, -12.8]];
function ear(ctx, a, mode, root, base, name, flat) {
  ctx.save();
  ctx.translate(...root);
  ctx.rotate(base + swingOf(a, name, 'head') * 0.85 + flat);
  // a soft floppy leaf of an ear, its root sunk inside the skull
  smooth(ctx, [[-3.6, 1.6], [-4.4, -4], [-3, -10.6], [0, -13.2], [3, -10.6], [4.4, -4], [3.6, 1.6]]);
  paint(ctx, a, mode, COAT[1]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -1.6, -8, 7, COAT[0], 0.8);
    glow(ctx, 2.6, -2, 6, COAT[2], 0.5);
    ctx.restore();
    smooth(ctx, [[-1.8, -1], [-2.6, -5.4], [-1.6, -10], [0, -11.4], [1.6, -10], [2.6, -5.4], [1.8, -1]]);
    ctx.fillStyle = tone(a, SPOT[1]);
    ctx.fill();
    ell(ctx, 0, -5.6, 1.1, 3.4);
    ctx.fillStyle = tone(a, SPOT[2], 0.45);
    ctx.fill();
  }
  ctx.restore();
}
function horn(ctx, a, mode, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  smooth(ctx, [[-2.2, 2], [-2, -1.4], [-0.9, -3.8], [0.9, -3.8], [2, -1.4], [2.2, 2]]);
  paint(ctx, a, mode, HORN[1]);
  if (mode === 'fill') {
    ell(ctx, -0.5, -1.8, 0.8, 1.4);
    ctx.fillStyle = tone(a, HORN[0]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 0.4);
    ctx.quadraticCurveTo(0, 1.2, 2, 0.4);
    pen(ctx, tone(a, HORN[2], 0.6), 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  const flat = q.earFlat ?? 0;
  ear(ctx, a, mode, EAR_F, -1.95, 'earF', flat * 0.6);
  ear(ctx, a, mode, EAR_N, 1.75, 'earN', -flat * 0.6);
  horn(ctx, a, mode, -7.6, -16.4, -0.3);
  horn(ctx, a, mode, 7.4, -17.4, 0.25);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, COAT[1]);
  smooth(ctx, MUZ);
  paint(ctx, a, mode, MUZZLE[1]);
  smooth(ctx, LOCK);
  paint(ctx, a, mode, HAIR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -12, 16, COAT[0], 0.9);
    glow(ctx, -15, 9, 10, COAT[2], 0.6);
    // its strawberry spot over its far eye and ear
    smooth(ctx, [[-19.6, -10], [-14, -14.2], [-8.6, -12], [-6.8, -6.6], [-8.8, -1.4], [-14.4, 0.6], [-20, -2.6]]);
    ctx.fillStyle = tone(a, SPOT[0]);
    ctx.fill();
    glow(ctx, -15, -3, 6, SPOT[1], 0.45);
    ctx.restore();
    // the muzzle: lit on top, a deeper pink under, two soft comma nostrils
    ctx.save();
    smooth(ctx, MUZ);
    ctx.clip();
    glow(ctx, 14, 3.6, 8, MUZZLE[0], 0.95);
    glow(ctx, 12, 16, 8, MUZZLE[2], 0.5);
    ctx.restore();
    const sn = q.snort ?? 0;
    for (const [nx, ny, k] of [[14.4, 6.6, 0.85], [20.6, 7, 1]]) {
      ctx.beginPath();
      ctx.moveTo(nx - 0.9 * k, ny - 0.5);
      ctx.quadraticCurveTo(nx + 0.4 * k, ny - 1.2 - sn * 0.4, nx + 0.8 * k, ny + 0.4);
      pen(ctx, tone(a, MUZZLE[2]), 0.95 + sn * 0.3);
      ctx.stroke();
    }
    ell(ctx, 17, 3, 2.2, 0.7, -0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    // cheeks
    for (const [cx, cy, k] of [[-9.6, 6.4, 0.75], [6.2, 8.2, 1]]) {
      ell(ctx, cx, cy, 2.8 + (q.cheek ?? 0) * 0.6, 1.7 + (q.cheek ?? 0) * 0.5);
      ctx.fillStyle = tone(a, '#ff98b6', (0.42 + (q.blush ?? 0) * 0.35) * k);
      ctx.fill();
    }
    eye(ctx, a, -6.2, -2.2, -1, f);
    eye(ctx, a, 6.6, -2.6, 1, f);
    brow(ctx, a, -6.4, -9.2, -1, f.b);
    brow(ctx, a, 6.8, -9.6, 1, f.b);
    // the forelock: three round curls, each lit on top, a soft curl line in each, one shine
    ctx.save();
    smooth(ctx, LOCK);
    ctx.clip();
    glow(ctx, 0, -14, 10, HAIR[2], 0.35);
    for (const [cx, cy, r] of [[-4.6, -16.4, 3.6], [2.4, -18.2, 3.8], [6.8, -15.4, 3.2]]) {
      glow(ctx, cx - 0.6, cy - 1.2, r * 1.1, HAIR[0], 0.85);
      ctx.beginPath();
      ctx.arc(cx + 0.2, cy + 0.4, r * 0.48, Math.PI * 0.9, Math.PI * 2.3);
      pen(ctx, tone(a, HAIR[2], 0.5), 0.6);
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-5.4, -18.2);
    ctx.quadraticCurveTo(0, -20.6, 4.6, -19.6);
    pen(ctx, tone(a, '#ffffff', 0.6), 0.8);
    ctx.stroke();
    mouth(ctx, a, 15.6, 11.6, f.m, q.jaw ?? 0);
  }
  ctx.restore();
}

// ---------- Its body ----------
// Its spots and cream belly (in the waist's frame, kept inside its body's outline).
function coat(ctx, a, mode, D) {
  if (mode !== 'fill' || !a.blTorsoPts) return;
  ctx.save();
  ctx.beginPath();
  a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.clip();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  // a cream belly
  smooth(ctx, [[82, 100], [92, 101], [96, 110], [93, 120], [84, 123], [78, 116], [78, 106]]);
  ctx.fillStyle = tone(a, COAT[0]);
  ctx.fill();
  // strawberry spots: one big on its back and rump, one round on its shoulder
  smooth(ctx, [[60, 104], [68, 98], [74, 102], [75, 112], [70, 121], [62, 122], [58, 113]]);
  ctx.fillStyle = tone(a, SPOT[0]);
  ctx.fill();
  glow(ctx, 66, 116, 6, SPOT[1], 0.5);
  smooth(ctx, [[79.6, 93.6], [85, 92.4], [88, 96], [85.4, 100.4], [80, 99.6]]);
  ctx.fillStyle = tone(a, SPOT[0]);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
// Its collar: a mint ribbon round its neck with a little bow at the back.
function collar(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'neckB');
  const s = D.J.stern;
  smooth(ctx, [[s[0] - 8.4, s[1] - 3.4], [s[0], s[1] - 5.2], [s[0] + 8.2, s[1] - 3.6], [s[0] + 8.4, s[1] - 0.8], [s[0], s[1] - 2], [s[0] - 8.6, s[1] - 0.6]]);
  paint(ctx, a, mode, RIBBON[1]);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(s[0] - 7.6, s[1] - 3.4);
    ctx.quadraticCurveTo(s[0], s[1] - 4.6, s[0] + 7.4, s[1] - 3.2);
    pen(ctx, tone(a, RIBBON[0], 0.9), 0.7);
    ctx.stroke();
  }
  // the bow at its nape
  for (const sgn of [-1, 1]) {
    smooth(ctx, [[s[0] - 8.6, s[1] - 2.2], [s[0] - 11 + sgn * 0.2, s[1] - 2.2 - sgn * 3.2], [s[0] - 13, s[1] - 2.2 - sgn * 1.4]]);
    paint(ctx, a, mode, RIBBON[2]);
  }
  ctx.restore();
}
// The gumdrop bell, hanging from the collar on its own spring.
function bell(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'bell');
  const [x, y] = BELL;
  // a short loop of ribbon, then the gumdrop: a sugared dome, its rim a little flared
  smooth(ctx, [[x - 1, y - 0.6], [x + 1, y - 0.6], [x + 0.9, y + 2.6], [x - 0.9, y + 2.6]]);
  paint(ctx, a, mode, RIBBON[1]);
  smooth(ctx, [[x - 4.4, y + 9], [x - 4, y + 5], [x - 2, y + 2.2], [x + 2, y + 2.2], [x + 4, y + 5], [x + 4.4, y + 9], [x, y + 9.8]]);
  paint(ctx, a, mode, GUM[1], '#b8506c');
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, x - 1.4, y + 4, 4.4, GUM[0], 0.9);
    glow(ctx, x + 2.6, y + 8.6, 4, GUM[2], 0.6);
    // sugar on it: soft white grains (round, a few)
    for (const [dx, dy] of [[-2.2, 6.4], [0.6, 4.4], [2.4, 6.8], [-0.6, 8]]) {
      ell(ctx, x + dx, y + dy, 0.45, 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
    }
    ctx.restore();
    // its crystal clapper peeping under the rim
    const cl = (a.gl?.clap ?? 0) * 1.4;
    smooth(ctx, [[x - 0.9 + cl, y + 9.4], [x + 0.9 + cl, y + 9.4], [x + 0.6 + cl, y + 11], [x - 0.6 + cl, y + 11]]);
    ctx.fillStyle = tone(a, '#f2f8ff');
    ctx.fill();
  }
  ctx.restore();
}
// Hooves over its hands (caramel, split in two) and over its feet.
function hoofHand(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const [x, y] = D.J[`hand${k}`];
  smooth(ctx, [[x - 5, y - 1.2], [x - 4.6, y + 3.6], [x, y + 5.4], [x + 4.6, y + 3.6], [x + 5, y - 1.2], [x, y - 2.4]]);
  paint(ctx, a, mode, k === 'N' ? HOOF[0] : HOOF[1]);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(x + 0.4, y - 0.6);
    ctx.quadraticCurveTo(x + 0.6, y + 2.4, x + 0.2, y + 5);
    pen(ctx, tone(a, HOOF[2], 0.8), 0.8);
    ctx.stroke();
    ell(ctx, x - 2, y + 0.6, 1.6, 1.1);
    ctx.fillStyle = tone(a, '#f2c8a4', 0.7);
    ctx.fill();
    // a cuff of cream fur over the hoof's top
    smooth(ctx, [[x - 5.4, y - 2], [x, y - 3.6], [x + 5.4, y - 2], [x + 4.8, y - 0.2], [x, y - 0.8], [x - 4.8, y - 0.2]]);
    ctx.fillStyle = tone(a, k === 'N' ? COAT[1] : COAT[2]);
    ctx.fill();
  }
  ctx.restore();
}
function hoofFoot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const [x, y] = D.J[`ank${k}`];
  smooth(ctx, [[x - 5.6, y - 0.6], [x + 5.6, y - 0.6], [x + 7.6, y + 4.8], [x + 6.4, y + 7.4], [x - 5, y + 7.4], [x - 6.4, y + 4.4]]);
  paint(ctx, a, mode, k === 'N' ? HOOF[0] : HOOF[1]);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(x + 3.4, y + 1.6);
    ctx.quadraticCurveTo(x + 4.2, y + 4.6, x + 3.8, y + 7.2);
    pen(ctx, tone(a, HOOF[2], 0.8), 0.8);
    ctx.stroke();
    ell(ctx, x - 0.6, y + 2.2, 3.2, 1.2);
    ctx.fillStyle = tone(a, '#f2c8a4', 0.6);
    ctx.fill();
    smooth(ctx, [[x - 6.2, y - 1.4], [x, y - 2.8], [x + 6.2, y - 1.4], [x + 5.6, y + 0.8], [x, y + 0.2], [x - 5.6, y + 0.8]]);
    ctx.fillStyle = tone(a, k === 'N' ? COAT[1] : COAT[2]);
    ctx.fill();
  }
  ctx.restore();
}
// Its thin tail, hanging from its rump on two springy halves, a pink tuft at its end.
const TAIL_PTS_A = [[72.6, 113.4], [68.8, 116], TAIL_B];
const TAIL_PTS_B = [[62.6, 119.8], [61, 122.4]];
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const c = ribbon(ctx, pts, [3.4, 2.8, 2.4, 2.2, 2].map((w) => w * D.SC * 1.6));
  paint(ctx, a, mode, COAT[2]);
  // the tuft: a soft round pink puff of three overlapping rounds
  const e = c[c.length - 1];
  const p = c[c.length - 4];
  const dx = e[0] - p[0];
  const dy = e[1] - p[1];
  const d = Math.hypot(dx, dy) || 1;
  const [ux, uy] = [dx / d, dy / d];
  const r = 1.5;
  ctx.beginPath();
  for (const [s, side] of [[0.6, 0], [1.4, 0.9], [1.4, -0.9], [2.1, 0]]) {
    const cx = e[0] + ux * s - uy * side;
    const cy = e[1] + uy * s + ux * side;
    ctx.moveTo(cx + r, cy);
    ctx.arc(cx, cy, r, 0, TAU);
  }
  paint(ctx, a, mode, SPOT[1]);
  if (mode === 'fill') glow(ctx, e[0] + ux * 1.2 - 0.4, e[1] + uy * 1.2 - 0.6, 2.2, SPOT[0], 0.8);
}

// ---------- Its things in the world (rig space, game px, its feet at 0, 0) ----------
// A gumdrop flower: a mint stem and two leaves, a domed pink gumdrop for a bloom, grown up from the
// ground (`g` 0..1, never faded), nipped down to its stem (`bit` 0..1).
function flower(ctx, a, x, g, bit) {
  if (g <= 0.01) return;
  const hgt = 5.4 * g;
  for (const mode of ['line', 'fill']) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 0.8, -hgt * 0.5, x + 0.2, -hgt);
    if (mode === 'line') {
      pen(ctx, '#3e8a68', 1.5);
      ctx.stroke();
    } else {
      pen(ctx, RIBBON[2], 0.8);
      ctx.stroke();
    }
    for (const s of [-1, 1]) {
      smooth(ctx, [[x + 0.3, -hgt * 0.35], [x + s * 2.4 * g, -hgt * 0.55], [x + s * 1.2 * g, -hgt * 0.3]]);
      if (mode === 'line') {
        pen(ctx, '#3e8a68', 0.6);
        ctx.stroke();
      } else {
        ctx.fillStyle = RIBBON[1];
        ctx.fill();
      }
    }
    const br = 2.1 * g * (1 - bit);
    if (br > 0.05) {
      smooth(ctx, [[x - br, -hgt + 0.6], [x - br * 0.8, -hgt - br * 0.7], [x, -hgt - br * 1.1], [x + br * 0.8, -hgt - br * 0.7], [x + br, -hgt + 0.6]]);
      if (mode === 'line') {
        pen(ctx, '#b8506c', 0.6);
        ctx.stroke();
      } else {
        ctx.fillStyle = GUM[1];
        ctx.fill();
        ell(ctx, x - br * 0.3, -hgt - br * 0.45, br * 0.35, br * 0.25);
        ctx.fillStyle = GUM[0];
        ctx.fill();
      }
    }
  }
}
// A soft white snort puff.
function puff(ctx, x, y, r, al) {
  dust(ctx, x, y, r, al, '#ffffff', '#f0dde4');
}
// A ring of sound off the bell: a soft open arc.
function ring(ctx, x, y, r, al, dir = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.arc(x, y, r, dir > 0 ? -0.9 : Math.PI - 0.9, dir > 0 ? 0.9 : Math.PI + 0.9);
  pen(ctx, GUM[1], 1.1);
  ctx.stroke();
  pen(ctx, '#ffffff', 0.45);
  ctx.stroke();
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { graze: 7.6, frolic: 6.6, bell: 6.8, moo: 6.4 };
const ORDER = ['graze', 'frolic', 'bell', 'moo'];
const POOL = ['butt', 'stamp', 'clang'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, earF: 0, earN: 0, earFlat: 0, tailRot: 0, tailCurl: 0, bellRot: 0, clap: 0, jaw: 0, cheek: 0, blush: 0, snort: 0, flower: -1, flowerBit: 0, notes: 0, puffs: -1, mooT: -1, bigMoo: -1, sweat: -1, zz: 0, scrape: 0, bonk: -1, stampS: -1, clangS: -1, sugar: 0 };
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
  const { alive, mvName, W, s, hurt, ago, fighting, napping, cine, low } = F;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const U = a[`tk${ID}U`] ?? 0;
  const toLeg = (c.H ?? 36) / Math.max(1, c.leg ?? 9.8);
  // Standing: forehooves loose at its sides, a little forward; head a touch low; a slow breath.
  // Walking: its head nods with each forefoot's step, the way a cow's does; its bell swings.
  const br = c.breath ?? 0;
  go({ shN: 2 + br * 1.5, elN: -12, hwN: 4, shF: 5 + br, elF: -10, hwF: 2, head: 3, chest: -br * 0.5 }, 1);
  const nod = Math.sin(U * TAU * 2 - 0.6);
  add({ head: nod * 4, neckR: nod * 1.5 }, walking);
  q.bellRot = Math.sin(U * TAU * 2 + 0.4) * 0.18 * walking;
  q.tailRot = Math.sin(t * 0.8) * 0.06 + Math.sin(U * TAU) * 0.12 * walking;
  q.tailCurl = Math.sin(t * 0.6 + 1) * 0.06;
  q.earF = Math.sin(t * 0.5) * 0.04 - nod * 0.06 * walking;
  q.earN = Math.sin(t * 0.43 + 2) * 0.04 + nod * 0.06 * walking;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  let sit = 0;

  if (k > 0.001 && piece === 'graze') {
    // a gumdrop flower pops up at its feet; it looks down at it
    q.flower = sstep((pu - 0.2) / 0.5) * k;
    const look = win(pu, 0.3, 0.7, 1.2, 1.4);
    go({ head: 18, neckR: 4 }, look * k);
    say('down', look * k);
    // it bends and nips it off
    const bend = win(pu, 1.1, 1.6, 2.6, 3.1);
    go({ tilt: 22, head: 26, neckR: 6, lift: -0.05, shN: -30, elN: -24, shF: -24, elF: -20, x: 0.04 }, bend * k);
    say('nip', win(pu, 1.6, 1.8, 2.6, 2.8) * k);
    q.flowerBit = sstep((pu - 2.0) / 0.5);
    // up, chewing: its jaw sliding side to side, a full round cheek
    const chew = win(pu, 2.9, 3.2, 5.4, 5.7);
    q.jaw = Math.sin((pu - 2.9) * 7.5) * 1.1 * chew * k;
    q.cheek = chew * k;
    go({ head: -2 + Math.sin((pu - 2.9) * 7.5) * 1.5, chest: -1 }, chew * k);
    say('chew', chew * k);
    // a swallow, then a happy sigh
    add({ head: -4 * win(pu, 5.5, 5.6, 5.8, 6.0) }, k);
    const sigh = win(pu, 5.9, 6.2, 7.0, 7.5);
    add({ chest: -Math.sin(Math.PI * clamp((pu - 5.9) / 1.4, 0, 1)) * 4 }, k);
    say('sigh', sigh * k);
    q.tailRot += Math.sin(pu * 9) * 0.25 * sigh * k;
    if (pu > 7.0) q.flower = Math.max(0, q.flower - sstep((pu - 7.0) / 0.4));
  }
  if (k > 0.001 && piece === 'frolic') {
    // a play bow: front low, rump up, tail up
    const bow = win(pu, 0.0, 0.3, 0.6, 0.75);
    go({ tilt: 24, head: 10, lift: -0.06, shN: -40, elN: -10, shF: -34, elF: -10, fxN: 0.25, fxF: 0.2 }, bow * k);
    q.tailRot -= 0.6 * bow * k;
    say('glee', bow * k);
    // three bucking hops, heels kicked up behind
    for (const [h0, amp] of [[0.7, 1], [1.45, 0.85], [2.2, 1.1]]) {
      const v = clamp((pu - h0) / 0.6, 0, 1);
      if (v > 0 && v < 1) {
        const up = Math.sin(Math.PI * v);
        add({ hop: up * 0.16 * amp }, k);
        const kick = Math.sin(Math.PI * clamp((v - 0.2) / 0.6, 0, 1));
        go({ tilt: 18 * kick, head: -8 * kick, fxN: -0.55 * kick, fyN: 0.3 * kick, fxF: -0.45 * kick, fyF: 0.36 * kick, toeN: -30 * kick, toeF: -30 * kick, shN: -70, elN: -30, shF: -60, elF: -30 }, k * sstep(v / 0.15) * (1 - sstep((v - 0.85) / 0.15)));
        q.tailRot -= 0.8 * kick * k;
        q.earF += 0.4 * up * k;
        q.earN -= 0.4 * up * k;
        q.bellRot += 0.5 * kick * k;
        say('wild', k);
      }
    }
    // a prance on the spot: hooves high in turn
    const pr = win(pu, 2.9, 3.1, 4.3, 4.5);
    const ps = Math.sin((pu - 2.9) * 10);
    go({ fyN: Math.max(0, ps) * 0.3, fyF: Math.max(0, -ps) * 0.3, shN: -40 - ps * 20, shF: -30 + ps * 20, elN: -60, elF: -60, head: -4 }, pr * k);
    add({ hop: Math.abs(ps) * 0.03 }, pr * k);
    q.bellRot += ps * 0.3 * pr * k;
    say('glee', pr * k);
    // puffed, panting, pleased
    const pant = win(pu, 4.5, 4.8, 6.0, 6.5);
    go({ tilt: 8, head: 6, shN: -20, elN: -20, chest: Math.sin(pu * 14) * 2 }, pant * k);
    say(pu < 5.6 ? 'pant' : 'proud', pant * k);
  }
  if (k > 0.001 && piece === 'bell') {
    // it looks down at its bell
    const look = win(pu, 0.1, 0.5, 2.2, 2.5);
    go({ head: 22, neckR: 5 }, look * k);
    say('curious', look * k);
    // a tap with its hoof: ding!
    const tap = win(pu, 0.7, 1.0, 1.3, 1.6);
    go({ shN: -80, elN: -96, hwN: -20 }, tap * k);
    if (pu > 1.1 && pu < 1.35) {
      q.bellRot += 0.6 * k;
      q.clap = 1;
    }
    say('delight', win(pu, 1.3, 1.5, 2.2, 2.4) * k);
    if (pu > 1.15 && pu < 2.3) q.notes = Math.max(q.notes, win(pu, 1.15, 1.3, 2.0, 2.3) * k);
    // it shakes its head to ring it
    const sh = win(pu, 2.4, 2.6, 4.4, 4.7);
    const sw = Math.sin((pu - 2.4) * 11);
    go({ head: sw * 14, neckR: sw * 5, chest: -sw * 2 }, sh * k);
    q.earF += sw * 0.6 * sh * k;
    q.earN -= sw * 0.6 * sh * k;
    q.bellRot += sw * 0.7 * sh * k;
    q.clap = Math.max(q.clap, Math.abs(sw) * sh);
    q.notes = Math.max(q.notes, sh * k);
    say('shake', sh * k);
    // dizzy: a wobble
    const wz = win(pu, 4.6, 4.8, 5.5, 5.8);
    add({ tilt: Math.sin(pu * 6) * 6 * wz, head: Math.sin(pu * 6 + 1) * 6 * wz, x: Math.sin(pu * 6) * 0.02 * wz }, k);
    say('woozy', wz * k);
    // a giggle
    const gg = win(pu, 5.7, 5.9, 6.4, 6.8);
    add({ chest: Math.sin(pu * 26) * 2 * gg, head: Math.sin(pu * 26 - 0.5) * 2 * gg }, k);
    go({ shN: -60, elN: -110, hwN: -20 }, gg * k);
    say('giggle', gg * k);
  }
  if (k > 0.001 && piece === 'moo') {
    // a big breath in: chest out, head up
    const in1 = win(pu, 0.1, 0.8, 1.0, 1.2);
    go({ chest: -6, head: -10, neckR: -3, shN: -18, shF: -14 }, in1 * k);
    say('breath', in1 * k);
    q.cheek = Math.max(q.cheek, in1 * k);
    // a moo, tiny
    const m1 = win(pu, 1.0, 1.15, 1.7, 1.9);
    go({ head: 2, chest: 1 }, m1 * k);
    say('moo', m1 * k);
    if (pu > 1.05 && pu < 2.6) q.mooT = pu - 1.05;
    // it stares (was that it?)
    const stare = win(pu, 1.9, 2.0, 2.7, 2.9);
    go({ head: 14, neckR: 3 }, stare * k);
    say('stare', stare * k);
    // a bigger breath, up on its toes; MOO!, which squeaks
    const in2 = win(pu, 2.8, 3.4, 3.6, 3.75);
    go({ chest: -8, head: -14, lift: 0.04, toeN: 18, toeF: 18, shN: -30, shF: -26 }, in2 * k);
    say('breath', in2 * k);
    q.cheek = Math.max(q.cheek, in2 * k * 1.2);
    const m2 = win(pu, 3.6, 3.7, 4.4, 4.7);
    go({ head: -6, chest: 2, x: 0.02, shN: -40, elN: -20, shF: -34, elF: -20 }, m2 * k);
    q.earFlat = Math.max(q.earFlat, -0.5 * m2 * k);
    say('big', m2 * k);
    if (pu > 3.65 && pu < 5.2) q.bigMoo = pu - 3.65;
    // a hoof over its mouth, blushing
    const shy = win(pu, 4.6, 4.9, 6.0, 6.4);
    go({ shN: -78, elN: -118, hwN: -24, head: 8, neckR: 3, chest: Math.sin(pu * 22) * 1.4 }, shy * k);
    q.blush = Math.max(q.blush, shy * k);
    say('sheepish', shy * k);
  }

  // (its own marks over its head)
  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: head low, ears forward, a hoof pawing -----
  if (hunting && !hurt) {
    const kk = 1 - walking * 0.5;
    const paw = Math.sin(now * 5.5);
    go({ tilt: 8, head: 12, lift: -0.02, shN: -26, elN: -20, shF: -20, elF: -16 }, kk);
    if (!mvName) go({ fxN: 0.1 + paw * 0.18, fyN: Math.max(0, paw) * 0.12 }, kk * (1 - walking));
    q.earF -= 0.3;
    q.earN += 0.3;
    q.face = 'fierce';
    q.scrape = mvName ? 0 : (1 - walking) * Math.max(0, -paw);
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.1) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'butt') {
      // head down, a hoof scraping the ground, snorting
      const paw = Math.sin(now * 12);
      go({ tilt: 14, head: 26, neckR: 6, lift: -0.04, shN: -30, elN: -16, shF: -24, elF: -14, fxN: 0.15 + paw * 0.25 * (1 - W), fyN: Math.max(0, paw) * 0.12 * (1 - W) }, wu);
      q.scrape = Math.max(q.scrape, Math.max(0, -paw) * wu * (1 - W * 0.6));
      q.snort = Math.max(q.snort, wu);
      if (W > 0.3) q.puffs = (now * 1.6) % 1;
      q.earFlat = Math.max(q.earFlat, 0.4 * wu);
      say('focus', W);
      // the charge, bonk, and back
      if (s >= 0) {
        const out1 = sstep(s / 0.16);
        const back = sstep((s - 0.42) / 0.4);
        const xx = 0.5 * out1 * (1 - back);
        go({ x: xx, tilt: 20, head: 30, neckR: 8, shN: -60, elN: -20, shF: -50, elF: -20, fxN: xx * toLeg, fxF: xx * toLeg - 0.2 }, sw);
        add({ hop: Math.sin(Math.PI * clamp(s / 0.2, 0, 1)) * 0.04 }, sw);
        if (s > 0.12 && s < 0.7) q.bonk = s - 0.12;
        q.bellRot += 0.6 * win(s, 0.1, 0.16, 0.3, 0.5);
        say('shout', win(s, 0, 0.04, 0.3, 0.4));
        say('proud', win(s, 0.45, 0.55, 0.85, 0.95));
      }
    } else if (mvName === 'stamp') {
      // it rears up on its hind legs, forehooves high
      go({ tilt: -26, head: -12, lift: 0.06, shN: -150, elN: -40, hwN: -10, shF: -140, elF: -44, x: -0.03, toeN: 12, toeF: 10 }, wu);
      q.tailRot += 0.5 * wu;
      q.earFlat = Math.max(q.earFlat, -0.4 * wu);
      say('focus', W);
      if (s >= 0) {
        // stamped down: a ring of sugar dust
        go({ tilt: 16, head: 14, lift: -0.06, shN: -50, elN: -6, shF: -44, elF: -6, x: 0.05 }, snap * sw);
        say('shout', win(s, 0, 0.03, 0.3, 0.45));
        q.stampS = s;
        q.bellRot += 0.7 * win(s, 0, 0.05, 0.2, 0.45);
        q.earF += 0.5 * win(s, 0, 0.05, 0.2, 0.4);
        q.earN -= 0.5 * win(s, 0, 0.05, 0.2, 0.4);
      }
    } else {
      // its head tossed back, the bell swung back on its ribbon
      go({ head: -24, neckR: -6, chest: -6, tilt: -6, x: -0.03, shN: -30, elN: -40, shF: -24, elF: -40 }, wu);
      q.bellRot += 1.0 * wu;
      say('focus', W);
      if (s >= 0) {
        // a hard nod: the bell flung out at you, DING
        go({ head: 26, neckR: 8, chest: 4, tilt: 12, x: 0.05, shN: -40, elN: -20, shF: -34, elF: -20 }, snap * sw);
        q.bellRot -= 1.8 * win(s, 0, 0.04, 0.22, 0.5);
        q.clap = Math.max(q.clap, win(s, 0, 0.03, 0.3, 0.5));
        q.clangS = s;
        say('shout', win(s, 0, 0.03, 0.3, 0.45));
        say('proud', win(s, 0.5, 0.6, 0.85, 0.95));
      }
    }
  }
  // ----- Hurt: a wince, ears flat back, the bell jangling -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -8, neckR: -4, shN: -22, elN: -96, hwN: -20, shF: -18, elF: -92, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.bellRot += Math.sin(ago * 30) * 0.5 * kh;
    q.clap = kh;
  }
  // ----- After landing a hit: a proud snort and a tail swish -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.8, 1.1) * (1 - F.moveW);
    go({ head: -8, chest: -3, tilt: -3 }, kg);
    q.tailRot += Math.sin(gl * 14) * 0.6 * kg;
    q.snort = Math.max(q.snort, kg);
    if (gl > 0.1 && gl < 0.9) q.puffs = (gl - 0.1) / 0.8;
    say('cheeky', kg);
  }
  // ----- A nap (its habitat): lying down, its chin on its hooves -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 16 + Math.sin(now * 1.4) * 2, neckR: 4, tilt: 2, shN: -50, elN: -40, hwN: 10, shF: -46, elF: -40 }, nw);
    q.earFlat = Math.max(q.earFlat, 0.5 * nw);
    q.tailCurl += 0.6 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // lying down: folded on its legs
  if (sit > 0.001) go({ lift: -0.22 + Math.sin(now * 1.4) * 0.006, fxN: 0.35, fyN: 0.05, fxF: 0.3, fyF: 0.05, toeN: -12, toeF: -12 }, sit);
  if (alive && !F.busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.earFlat = 0.7;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.6);
  easeKeys(st, q, ['earFlat', 'tailRot', 'tailCurl', 'bellRot', 'earF', 'earN', 'cheek', 'blush', 'snort', 'clap'], dt, (key) => (key.startsWith('tail') ? 9 : key === 'bellRot' ? 14 : 12));
  q.calm = k;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
const BUBBLE = [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]];
const BCOL = [INK, '#fffaf6', '#e8608e', '#a2687a'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -28]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  // the gumdrop flower at its feet
  if ((q.flower ?? -1) > 0) flower(ctx, a, 15, q.flower, q.flowerBit ?? 0);
  const bellAt = () => ptOf(a, D, 'bell', [BELL[0], BELL[1] + 7]);
  // notes off its bell
  if ((q.notes ?? 0) > 0.05) {
    const [bx, by] = bellAt();
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.9 + i / 3) % 1;
      note(ctx, bx + 3 + f * 10 + Math.sin(f * 6 + i) * 1.5, by - 2 - f * 14, 0.9, Math.sin(f * 4) * 0.3, q.notes * Math.sin(Math.PI * f), i % 2 ? '#ffd0dc' : '#ff9ab4');
    }
  }
  // snort puffs from its nostrils
  if ((q.puffs ?? -1) >= 0) {
    const [nx, ny] = headAt(a, D, [22, 7.6]);
    for (let i = 0; i < 2; i++) {
      const f = (q.puffs + i * 0.5) % 1;
      puff(ctx, nx + 1.5 + f * 5, ny + 1 + f * 1.5, 0.9 + f * 1.1, Math.sin(Math.PI * f) * 0.85);
    }
  }
  // a hoof scraping: a little puff of sugar dust behind it
  if ((q.scrape ?? 0) > 0.05) {
    const [fx0] = ptOf(a, D, 'footN', D.J.ankN);
    dust(ctx, fx0 - 3, -1.2, 1.6 * q.scrape, 0.75 * q.scrape, '#fff4f6', '#f0c8d4');
  }
  // its moo, a soft round word; the big one squeaks (a wobble in it)
  if ((q.mooT ?? -1) >= 0) {
    const e = q.mooT;
    const [mx, my] = headAt(a, D, [24, 8]);
    const al = sstep(e / 0.15) * (1 - sstep((e - 1.1) / 0.4));
    ctx.save();
    ctx.globalAlpha *= al;
    cue(ctx, 'moo', mx + 4 + e * 3, my - 3 - e * 5, 3.4, a.flip ? -1 : 1, -0.1, '#c0607e', '#fff6f8');
    ctx.restore();
  }
  if ((q.bigMoo ?? -1) >= 0) {
    const e = q.bigMoo;
    const [mx, my] = headAt(a, D, [24, 6]);
    const al = sstep(e / 0.12) * (1 - sstep((e - 1.1) / 0.45));
    ctx.save();
    ctx.globalAlpha *= al;
    cue(ctx, 'MOO~', mx + 6 + e * 4, my - 6 - e * 4 + Math.sin(e * 30) * 0.5 * (1 - e), 5.2, a.flip ? -1 : 1, -0.12 + Math.sin(e * 24) * 0.05, '#c0607e', '#fff6f8');
    ctx.restore();
  }
  // ----- Head Butt: a soft bonk of sugar sparkles at its forehead -----
  if ((q.bonk ?? -1) >= 0 && q.bonk < 0.55) {
    const e = q.bonk / 0.55;
    const [hx, hy] = headAt(a, D, [20, -8]);
    glow(ctx, hx + 2, hy, 8 * (1 - e * 0.4), GUM[1], 0.45 * (1 - e));
    for (let i = 0; i < 5; i++) {
      const an = -1.3 + i * 0.65;
      sparkle(ctx, hx + 2 + Math.cos(an) * (3 + e * 9), hy + Math.sin(an) * (3 + e * 8), (i % 2 ? 1 : 1.5) * (1 - e), 1, i % 2 ? SUGAR : '#ffffff');
    }
  }
  // ----- Hoof Stamp: a ring of sugar dust rolling out along the ground, a pink shock arc -----
  if ((q.stampS ?? -1) >= 0 && q.stampS < 0.8) {
    const e = q.stampS / 0.8;
    const cx = 12;
    ctx.save();
    ctx.globalAlpha *= 1 - e;
    ctx.beginPath();
    ctx.ellipse(cx, -0.5, 4 + e * 22, 1.2 + e * 3.2, 0, 0, TAU);
    pen(ctx, GUM[1], 1.2 * (1 - e) + 0.3);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 5; i++) {
      const d = (i - 2) * (3 + e * 9);
      dust(ctx, cx + d, -1.4 - Math.abs(Math.sin(i * 1.7)) * e * 3, 1.2 + e * 1.8, (1 - e) * 0.9, '#fff4f6', '#f0c8d4');
    }
    for (let i = 0; i < 3; i++) sparkle(ctx, cx - 8 + i * 8, -3 - e * 7 - i * 1.5, 1.4 * Math.sin(Math.PI * e), 1, SUGAR);
  }
  // ----- Bell Clang: rings of sound and notes flying out ahead -----
  if ((q.clangS ?? -1) >= 0 && q.clangS < 0.9) {
    const e = q.clangS / 0.9;
    const [bx, by] = bellAt();
    for (let i = 0; i < 3; i++) {
      const v = clamp(e * 1.4 - i * 0.18, 0, 1);
      ring(ctx, bx + 3 + v * 14, by, 2 + v * 8, (1 - v) * 0.9);
    }
    for (let i = 0; i < 3; i++) {
      const v = clamp(e * 1.2 - i * 0.12, 0, 1);
      note(ctx, bx + 6 + v * 22, by - 3 - Math.sin(Math.PI * v) * 6 + i * 3, 1.1, 0.2, Math.sin(Math.PI * v), i % 2 ? '#ffd0dc' : '#ff9ab4');
    }
    sparkle(ctx, bx + 2, by, 2.6 * Math.sin(Math.PI * Math.min(1, e * 3)), 1, '#ffffff');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-16, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#b07a8a', '#fff4f6');
    }
  }
  const [bx, by] = headAt(a, D, [12, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  skin: { lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: LW },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    torso: (ctx, a, mode, S, D) => tail(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => coat(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => {
      collar(ctx, a, mode, D);
      bell(ctx, a, mode, D);
    },
    handFskin: (ctx, a, mode, S, D) => hoofHand(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => hoofFoot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => hoofFoot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => hoofHand(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('calf', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over its head left
// to it, drawn here in its own style)
export const STRAWBERRY_CALF_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const STRAWBERRY_CALF_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
