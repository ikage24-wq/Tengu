// The Kite Pika (2026-11-27, the Sky Whale's Kite Rider remade from scratch as a new creature; the id stays
// `kiterider`). The whale's tail docks and the West Rim of Starfall Heights are the windiest places in the
// sky, and the pikas there never go anywhere without their kites: a paper diamond kite strapped to their
// backs like a pair of wings, so the first good gust lifts them off their toes. This one is still not very
// good at landing. On its own copy of the creature base (rig.js; body.js `pika`: a soft round body, short
// legs, short arms with small mitten paws), dressed here; its head, ears, jacket, kite and kite tail drawn
// here from scratch over the mannequin (never the shared face, never the hero).
//   look    soft dove-taupe fur, a cream muzzle and chin, big round ears with cream rims and rosy insides
//           (a pika's signature), no tail to speak of; a honey-yellow flight jacket WORN (the base's own
//           body and arms, so it folds with every pose) with a cream fleece collar and cuffs, a zip and a
//           pocket, its fur below the hem; on its back a coral-and-cream paper diamond kite on a strap
//           across its chest, the kite's tail of little ribbon bows streaming behind on two springs. Its
//           own soft taupe outline, outer edge only, face bare.
//   eyes    its own "marble eyes": big and round, nearly all iris (a deep chestnut warming to amber at
//           the bottom), a big round glint and a small one, a short neat lash line over the outer half
//           with one round flick; little round dot brows that do its acting.
//   walk    the base's walk at a busy little pace (26), the kite rocking on its strap, its bows trailing.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - wind (6.4 s): a paw licked and held up to feel the wind, its ears turning; a gust! ears and
//             bows streaming; a happy nod (found it);
//           - lift (7.0 s): the kite catches a gust and lifts it onto its toes, then off the ground, its
//             feet dangling and kicking, arms out for balance; it drifts down and lands with a wobble; phew;
//           - hay (6.6 s): a sprig of sky-clover from its jacket pocket (pikas make hay), munched with a
//             little bob, the rest tucked away for later;
//           - strap (6.8 s): its strap tugged tight with both paws, the kite jiggling; a look back over its
//             shoulder at its kite; chest out, proud.
//   moves   Gust Rush (it leans back and lets the kite fill with wind; then the gust shoves it forward
//           into you, ears streaming, wind lines curling round it); Kite Twirl (it winds round, then
//           spins on the spot, a clean mirror flip, so the kite's edge swats you, a soft coral swoosh);
//           Eep! (cheeks puffed, up on its toes; then a sharp EEP! at you, a pika's alarm call, in soft
//           rings).
//   else    hurt: a squeak, ears flat; after landing a hit: a pleased little bounce on its toes, ears
//           wiggling; hunting you: crouched low, ears forward, the kite raised; low on health: worried, a
//           bead of sweat, ears and kite drooping; a nap (habitat): sat down, chin on its chest, ears
//           drooped; beaten: dizzy. Its marks over its head (!, ?) are its own: little diamond kites
//           (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: wind as soft curling white lines and puffs,
// sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust, cue } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee } from './act.js';

const BIG = 1.08;
const LW = 1.6 / BIG;
const ID = 'kitepika';
const INK = '#8a7280';
const FUR = ['#f8f0e8', '#ddcbbd', '#bea896', '#9c8676'];
const CREAM = ['#fffbf6', '#f6ece0', '#e6d6c4'];
const EARIN = ['#f4d4d2', '#dcaab0'];
const JACK = ['#fff0c0', '#f8cf70', '#dca850', '#b9863c'];
const FLEECE = ['#fffdf8', '#f4ebdc', '#ddd0bc'];
const KITE = ['#ffd8cc', '#ff9e8a', '#e8786a', '#c45a54'];
const PAPER = ['#fffaf0', '#f6ead6'];
const SPAR = ['#e8c08a', '#b88a5a'];
const BOWS = ['#8ad0ff', '#ffd86a', '#ff9eb8'];
const LASH = '#3e2a2a';
const IRIS = ['#22140e', '#5a3424', '#9a6238', '#e2aa6a'];
const WIND = ['#ffffff', '#e4eefc'];

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
const HS = 1.3;
const HO = [1.2, -15.2];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
// (the kite hangs from its strap between its shoulder blades; its tail from the kite's bottom corner)
const KITE_P = [72, 97];
const KT_A = [70, 121];
const KT_B = [62, 131];
const JOINTS = { kite: KITE_P, ktailA: KT_A, ktailB: KT_B };
const PIV2 = { kite: 'kite', ktailA: 'ktailA', ktailB: 'ktailB' };
const SOFTS = [
  { name: 'kite', parent: 'chest', pivot: 'kite', rot: (S, a) => a.gl?.kiteTilt ?? 0, soft: { k: 120, c: 9, gain: 0.3, turn: 0.5, max: 9, flutter: 1.2, hz: 0.5, dir: [-2, -6] } },
  { name: 'ktailA', parent: 'kite', pivot: 'ktailA', rot: (S, a) => a.gl?.bowRot ?? 0, soft: { k: 40, c: 4.4, gain: 0.6, turn: 0.8, hang: 0.4, max: 24, flutter: 1.6, hz: 0.5, dir: [-4, 6] } },
  { name: 'ktailB', parent: 'ktailA', pivot: 'ktailB', rot: (S, a) => (a.gl?.bowRot ?? 0) * 0.6, soft: { k: 34, c: 3.8, gain: 0.7, turn: 0.8, hang: 0.4, max: 28, flutter: 2.2, hz: 0.55, dir: [-6, 4] } },
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

// ---------- Its face ----------
// b: [far brow lift, near brow lift] (negative up)
const FACES = {
  calm: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'calm' },
  lick: { e: 'shut', b: [-0.4, -0.4], m: 'lick' },
  feel: { e: 'open', g: [0.9, -1.4], b: [-1, -1.4], m: 'o' },
  gust: { e: 'wide', g: [0.4, -0.6], b: [-1.8, -2], m: 'o' },
  found: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  whoa: { e: 'wide', g: [0.2, 1.2], b: [-1.6, -2], m: 'eep' },
  float: { e: 'happy', b: [-1, -1.2], m: 'open' },
  phew: { e: 'shut', b: [0.6, -0.6], m: 'wobble' },
  find: { e: 'wide', g: [0.8, -0.8], b: [-1.4, -1.6], m: 'o' },
  munch: { e: 'happy', b: [-0.4, -0.6], m: 'chew' },
  tug: { e: 'squeeze', b: [0.6, 0.8], m: 'grit' },
  check: { e: 'open', g: [-1.8, -0.4], b: [-0.6, -1], m: 'calm' },
  proud: { e: 'happy', b: [-1, -0.6], m: 'smile' },
  focus: { e: 'open', g: [1.4, 0.3], b: [0.6, 1], m: 'grit' },
  fierce: { e: 'open', g: [1.5, 0.2], b: [1, 1.2], m: 'grit' },
  puff: { e: 'shut', b: [0.6, 0.6], m: 'puff' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'eep' },
  cheeky: { e: 'happy', b: [-0.6, -1.2], m: 'smile' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'open' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'squeak' },
  worried: { e: 'open', g: [0.3, 1], b: [-1.4, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.3, 0.3], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.5, 0.3], b: [0, -0.4], m: 'talkA' },
  talkE: { e: 'open', g: [0.5, 0.3], b: [0, -0.4], m: 'talkE' },
  talkO: { e: 'open', g: [0.5, 0.3], b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['lick', 'found', 'float', 'phew', 'munch', 'tug', 'proud', 'puff', 'shout', 'cheeky', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The marble eye: a round eye, nearly all iris.
function eye(ctx, a, x, y, o, f) {
  const w = 3.7;
  const h = 4.1;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1], [x, y - h * 0.9], [x + w, y + 1], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.4], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.6], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.4], [x, y + (kind === 'sleep' ? 2.8 : 2.2)], [x + w, y + 0.4], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
  ell(ctx, x, y, w * big, h * big);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      if (i) ctx.lineTo(x + Math.cos(an) * u * w * 0.7, y + Math.sin(an) * u * h * 0.7);
      else ctx.moveTo(x, y);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.5, 0.3];
    ctx.save();
    ell(ctx, x, y, w * big, h * big);
    ctx.clip();
    const ix = x + gx * 0.45;
    const iy = y + gy * 0.4;
    const r = w * 0.9 * big;
    // nearly all iris: deep chestnut, warming to amber at the bottom
    ell(ctx, ix, iy, r, r * 1.08);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.38, r * 0.82, r * 0.6);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.72, r * 0.52, r * 0.24);
    ctx.fillStyle = tone(a, IRIS[3]);
    ctx.fill();
    ell(ctx, ix, iy - r * 0.05, r * 0.5, r * 0.52);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    // its glints: a big round one up on the far side, a small one low on the near side
    ell(ctx, ix - r * 0.38, iy - r * 0.42, r * 0.34, r * 0.32);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ix + r * 0.42, iy + r * 0.34, r * 0.14, r * 0.14);
    ctx.fill();
    ctx.restore();
  }
  // a short neat lash line over the outer half, one round flick
  const a0 = o > 0 ? -1.85 : -Math.PI + 0.35;
  const a1 = o > 0 ? -0.35 : -Math.PI + 1.85;
  ctx.beginPath();
  ctx.ellipse(x, y, w * big * 1.03, h * big * 1.03, 0, a0, a1);
  pen(ctx, tone(a, LASH), 1.25);
  ctx.stroke();
  const ex = x + Math.cos(o > 0 ? a1 : a0) * w * big * 1.03;
  const ey = y + Math.sin(-0.35) * h * big * 1.03;
  stroke3(ctx, a, [ex, ey], [ex + 0.8 * o, ey - 0.4], [ex + 1.1 * o, ey - 1.3], 0.95, LASH);
}
// Short round brows: soft little arcs, round at both ends, lifted (negative) or knit at their inner end.
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 1.7, y + lift + 0.3);
  ctx.quadraticCurveTo(x, y - 0.8 + lift * 0.6, x + o * 1.7, y + lift * 0.35 + 0.2);
  pen(ctx, tone(a, FUR[3]), 1.25);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#7a4e52';
  const DARK = '#6a2e3e';
  const line = (pts, w = 0.7) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h, teeth = false) => {
    smooth(ctx, [[x - w, y], [x, y - 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.82, w * 0.5, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
    if (teeth) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 0.9, y - 0.1, 0.8, 0.9);
      ctx.fillRect(x + 0.1, y - 0.1, 0.8, 0.9);
    }
  };
  // (the little split under its nose, in every mouth)
  stroke3(ctx, a, [x, y - 1.9], [x + 0.1, y - 1.1], [x, y - 0.3], 0.45, LIP);
  switch (m) {
    case 'smile':
      line([[x - 2, y - 0.4], [x - 1, y + 0.9], [x, y], [x + 1, y + 0.9], [x + 2, y - 0.4]]);
      break;
    case 'open':
      open(1.7, 2);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 0.85, 1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'eep':
      open(1.6, 2.4, true);
      break;
    case 'squeak':
      open(1.1, 1.6, true);
      break;
    case 'grit':
      line([[x - 1.7, y + 0.5], [x, y + 0.1], [x + 1.7, y + 0.5]], 0.85);
      break;
    case 'puff':
      ell(ctx, x - 3.4, y - 0.6, 2.4, 1.8);
      ctx.fillStyle = tone(a, CREAM[0], 0.8);
      ctx.fill();
      line([[x - 1, y + 0.3], [x, y + 0.5], [x + 1, y + 0.3]], 0.7);
      break;
    case 'chew':
      line([[x - 1.6, y + 0.2], [x - 0.7, y + 1], [x + 0.2, y + 0.4], [x + 1, y + 0.9], [x + 1.7, y + 0.1]]);
      ell(ctx, x - 3, y - 0.6, 1.6, 1.2);
      ctx.fillStyle = tone(a, CREAM[0], 0.6);
      ctx.fill();
      break;
    case 'lick':
      line([[x - 1.2, y + 0.2], [x, y + 0.5], [x + 1.2, y + 0.2]]);
      ell(ctx, x + 0.3, y + 1.2, 0.8, 0.9);
      ctx.fillStyle = tone(a, '#ff8aa2');
      ctx.fill();
      break;
    case 'wobble':
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.2], [x, y + 0.3], [x + 0.9, y - 0.2], [x + 1.8, y + 0.4]], 0.65);
      break;
    case 'frown':
      line([[x - 1.6, y + 0.9], [x, y], [x + 1.6, y + 0.9]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.55, 0.45);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'talkA':
      open(1.3, 1.8);
      break;
    case 'talkE':
      open(1.7, 1.1);
      break;
    default:
      // at rest: the little w of a pika's mouth, closed
      line([[x - 2.1, y - 0.3], [x - 1.1, y + 0.8], [x, y], [x + 1.1, y + 0.8], [x + 2.1, y - 0.3]], 0.62);
  }
}
// The head: a round ball of a head, full fluffy cheeks, a short soft muzzle.
const SKULL = [[-18, 0.6], [-16.8, -9.4], [-10.6, -15.6], [-1.4, -17.6], [8, -16.4], [15, -11.8], [18.6, -5], [19.8, 1], [19.2, 6.4], [15.6, 11.2], [8.4, 14.6], [-1.8, 15.4], [-11.6, 12.4], [-17, 7]];
// Its big round ears (`back` swept back by the wind or flattened, `up` pricked).
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r * 0.62, 2], [-r * 1.02, -r * 0.6], [-r * 0.6, -r * 1.5], [r * 0.2, -r * 1.7], [r * 0.95, -r * 1.2], [r * 0.9, -r * 0.2], [r * 0.6, 2]]);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    smooth(ctx, [[-r * 0.4, 0.6], [-r * 0.78, -r * 0.6], [-r * 0.46, -r * 1.3], [r * 0.18, -r * 1.46], [r * 0.72, -r * 1.06], [r * 0.66, -r * 0.2], [r * 0.4, 0.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    smooth(ctx, [[-r * 0.22, -0.2], [-r * 0.5, -r * 0.62], [-r * 0.3, -r * 1.12], [r * 0.14, -r * 1.22], [r * 0.48, -r * 0.94], [r * 0.42, -r * 0.24]]);
    ctx.fillStyle = tone(a, EARIN[0]);
    ctx.fill();
    glow(ctx, 0, -r * 0.6, r * 0.6, EARIN[1], 0.5);
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const back = q.earBack ?? 0;
  const up = q.earUp ?? 0;
  const sway = q.earSway ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -11.6, -12.2, 5.8, -0.7 - back * 0.55 + up * 0.25 + sway * 0.6);
  ear(ctx, a, mode, 1.8, -15.4, 6.1, -0.12 - back * 0.7 + up * 0.2 + sway);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -1, -10, 15, FUR[0], 0.85);
    glow(ctx, -14, 9, 10, FUR[2], 0.55);
    // the cream muzzle and chin, the fluffy cheek
    smooth(ctx, [[5, 2.6], [12, -0.6], [19, 0.6], [20, 6], [15, 12], [6, 15.6], [-2, 14.6], [0, 8]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 13.6, 4, 6, CREAM[0], 0.9);
    ctx.restore();
    for (const [cx, cy, k] of [[-7.6, 6.2, 0.6], [8.2, 7.2, 1]]) {
      ell(ctx, cx, cy, 2.5, 1.5);
      ctx.fillStyle = tone(a, '#ff9eb0', 0.42 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -2.4, -1.6, -1, f);
    eye(ctx, a, 9.8, -2.2, 1, f);
    brow(ctx, a, -2.8, -8.6, -1, (f.b?.[0] ?? 0) * 0.9);
    brow(ctx, a, 9.6, -9.2, 1, (f.b?.[1] ?? 0) * 0.9);
    // the nose: a small rosy button, a light on it
    ell(ctx, 17.4, 1.6, 1.6, 1.2, 0.2);
    ctx.fillStyle = tone(a, '#c88290');
    ctx.fill();
    ell(ctx, 17, 1.1, 0.6, 0.35, 0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 16.6, 5.2, f.m);
    // a few fine whiskers on the near cheek
    for (const [dy, c] of [[-0.6, -1.4], [1.2, 0.6]]) {
      ctx.beginPath();
      ctx.moveTo(17.4, 4 + dy);
      ctx.quadraticCurveTo(21.6, 3 + dy + c * 0.5, 25.4, 3.4 + dy + c);
      pen(ctx, tone(a, '#ffffff', 0.8), 0.32);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- Its jacket ----------
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
// Over the body: the jacket's hem with its fur below, the zip, the pocket, the kite's strap.
function jacket(ctx, a, mode, D) {
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
  const c0 = C([st[0] + 5, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 6, JACK[0], 0.75);
  // its own fur below the jacket's hem
  poly(ctx, [T([h[0] - 40, h[1] - 3]), T([h[0] + 40, h[1] - 3]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  const bl = T([h[0] + 4, h[1] + 2]);
  glow(ctx, bl[0], bl[1], 5, CREAM[1], 0.7);
  // the ribbed hem band
  ctx.beginPath();
  ctx.moveTo(...T([h[0] - 40, h[1] - 3.6]));
  ctx.lineTo(...T([h[0] + 40, h[1] - 3.6]));
  pen(ctx, tone(a, JACK[2]), 1.4);
  ctx.stroke();
  // the zip down its front
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 6.4, st[1] + 2]));
  ctx.quadraticCurveTo(...W([w[0] + 8.4, w[1] - 2]), ...T([h[0] + 8.4, h[1] - 4]));
  pen(ctx, tone(a, JACK[3], 0.8), 0.5);
  ctx.stroke();
  const zp = C([st[0] + 6.6, st[1] + 3.4]);
  ell(ctx, zp[0], zp[1], 0.6, 0.9);
  ctx.fillStyle = tone(a, '#e8e2f0');
  ctx.fill();
  // a patch pocket, its flap
  const pk = W([w[0] + 1.6, w[1] + 1]);
  smooth(ctx, [[pk[0] - 1.6, pk[1] - 1.4], [pk[0] + 1.6, pk[1] - 1.4], [pk[0] + 1.6, pk[1] + 1.6], [pk[0] - 1.6, pk[1] + 1.6]]);
  ctx.fillStyle = tone(a, JACK[2], 0.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pk[0] - 1.8, pk[1] - 1.2);
  ctx.lineTo(pk[0] + 1.8, pk[1] - 1.2);
  pen(ctx, tone(a, JACK[3]), 0.55);
  ctx.stroke();
  // the kite's strap across its chest, from the far shoulder down to the near side
  ctx.beginPath();
  ctx.moveTo(...C([st[0] - 12, st[1] + 1]));
  ctx.quadraticCurveTo(...C([st[0] + 2, st[1] + 8]), ...W([w[0] + 13, w[1] - 4]));
  pen(ctx, tone(a, KITE[3]), 1.5);
  ctx.stroke();
  pen(ctx, tone(a, KITE[1]), 0.9);
  ctx.stroke();
  const bk = C([st[0] + 3, st[1] + 7.4]);
  smooth(ctx, [[bk[0] - 1, bk[1] - 1], [bk[0] + 1, bk[1] - 1], [bk[0] + 1, bk[1] + 1], [bk[0] - 1, bk[1] + 1]]);
  ctx.fillStyle = tone(a, '#f4e2a6');
  ctx.fill();
  ctx.restore();
}
// The cream fleece collar: two soft rolls round its neck.
function collar(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  for (const pts of [[[-9, -3], [0, -5.4], [6, -3.6], [5.4, 1.4], [-1, 2.4], [-8.4, 1]], [[4, -4.6], [12, -4.4], [13.6, -0.6], [10, 2.2], [5, 1.6]]]) {
    smooth(ctx, pts.map(([x, y]) => C([st[0] + x, st[1] + y])));
    paint(ctx, a, mode, FLEECE[1]);
  }
  if (mode === 'fill') {
    const g = C([st[0] + 2, st[1] - 3.4]);
    glow(ctx, g[0], g[1], 3.4, FLEECE[0], 0.9);
  }
}
// A fleece cuff round each wrist.
function cuff(ctx, a, mode, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const p = [mix(E[0], Wr[0], 0.8), mix(E[1], Wr[1], 0.8)];
  const ang = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(ang);
  const hw = k === 'F' ? 1.7 : 1.9;
  smooth(ctx, [[-1.1, -hw], [1.1, -hw], [1.2, hw], [-1.2, hw]]);
  paint(ctx, a, mode, k === 'F' ? FLEECE[2] : FLEECE[1]);
  ctx.restore();
}

// ---------- Its kite ----------
// (kite space: the strap point at KITE_P; a diamond tilted back over its shoulders, its top corner up behind
// its head, its trailing corner out behind it, its bottom corner by its rump where the tail ties on)
const KPTS = { top: [58, 50], back: [30, 99], bot: [70, 123], front: [86, 88] };
function kite(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'kite');
  const { top, back, bot, front } = KPTS;
  const sh = (p) => smooth(ctx, p);
  const dia = [top, [mix(top[0], back[0], 0.5) - 1, mix(top[1], back[1], 0.5) - 1], back, [mix(back[0], bot[0], 0.5) - 1, mix(back[1], bot[1], 0.5) + 1], bot, [mix(bot[0], front[0], 0.5) + 1, mix(bot[1], front[1], 0.5)], front, [mix(front[0], top[0], 0.5) + 1, mix(front[1], top[1], 0.5)]];
  sh(dia);
  if (mode === 'line') {
    paint(ctx, a, 'line', null);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, PAPER[0]);
  ctx.fill();
  ctx.save();
  sh(dia);
  ctx.clip();
  // coral quarters: the upper back and the lower front
  const cen = [mix(top[0], bot[0], 0.42), mix(top[1], bot[1], 0.42)];
  poly(ctx, [cen, top, [top[0] - 30, top[1] - 6], back]);
  ctx.fillStyle = tone(a, KITE[1]);
  ctx.fill();
  poly(ctx, [cen, bot, [bot[0] + 30, bot[1] + 6], front]);
  ctx.fillStyle = tone(a, KITE[1]);
  ctx.fill();
  glow(ctx, top[0] - 2, top[1] + 10, 12, '#ffffff', 0.5);
  glow(ctx, back[0] + 6, back[1] + 6, 10, KITE[2], 0.35);
  // a little cream star in the middle
  ctx.save();
  ctx.translate(cen[0] - 4, cen[1] - 2);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 2.2 : 5;
    const an = (i / 10) * TAU - Math.PI / 2;
    ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, '#fff4c8');
  ctx.fill();
  ctx.restore();
  ctx.restore();
  // its two spars
  ctx.beginPath();
  ctx.moveTo(...top);
  ctx.lineTo(...bot);
  ctx.moveTo(...back);
  ctx.lineTo(...front);
  pen(ctx, tone(a, SPAR[1]), 1.6);
  ctx.stroke();
  pen(ctx, tone(a, SPAR[0]), 0.8);
  ctx.stroke();
  ctx.restore();
}
// The kite's tail: a string of three ribbon bows trailing from its bottom corner.
const KTAIL_A = [KT_A, [66, 126], KT_B];
const KTAIL_B = [[54, 134], [46, 136]];
function kiteTail(ctx, a, mode, D) {
  const pts = [...KTAIL_A.map((p) => ptOf(a, D, 'ktailA', p)), ...KTAIL_B.map((p) => ptOf(a, D, 'ktailB', p))];
  if (mode === 'line') return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(...pts[i], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  ctx.lineTo(...pts[pts.length - 1]);
  pen(ctx, tone(a, SPAR[1]), 0.45);
  ctx.stroke();
  // the bows at the string's points
  [pts[1], pts[2], pts[4]].forEach((p, i) => {
    const q = pts[Math.min(pts.length - 1, [2, 3, 4][i])];
    const r = pts[[0, 1, 3][i]];
    const an = Math.atan2(q[1] - r[1], q[0] - r[0]) + Math.PI / 2;
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(an);
    const s = 1 - i * 0.1;
    for (const sd of [-1, 1]) {
      smooth(ctx, [[0, 0], [sd * 1.8 * s, -1.2 * s], [sd * 2.3 * s, 0], [sd * 1.8 * s, 1.2 * s]]);
      ctx.fillStyle = tone(a, BOWS[i]);
      ctx.fill();
    }
    ell(ctx, 0, 0, 0.6 * s, 0.6 * s);
    ctx.fillStyle = tone(a, '#ffffff', 0.9);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}
// A sprig of sky-clover (its hay): a stem, three round leaves, a puff of a flower.
function sprig(ctx, x, y, s, ang, bitten = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 2 * s);
  ctx.quadraticCurveTo(0.4 * s, -1 * s, 0, -4 * s);
  pen(ctx, '#7aba6a', 0.5 * s);
  ctx.stroke();
  for (const [lx, ly] of [[-1, -2], [1, -2.6], [0, -3.8]].slice(0, bitten > 0.6 ? 1 : bitten > 0.3 ? 2 : 3)) {
    ell(ctx, lx * s, ly * s, 0.9 * s, 0.7 * s);
    ctx.fillStyle = '#9ed878';
    ctx.fill();
  }
  if (bitten < 0.5) {
    ell(ctx, 0, -4.6 * s, 1 * s, 0.9 * s);
    ctx.fillStyle = '#e8c8ff';
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { wind: 6.4, lift: 7.0, hay: 6.6, strap: 6.8 };
const ORDER = ['wind', 'lift', 'hay', 'strap'];
const POOL = ['gust', 'twirl', 'eep'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, kiteTilt: 0, bowRot: 0, earBack: 0, earUp: 0, earSway: 0, blush: 0, gust: 0, lick: 0, sprig: -1, bite: 0, wobble: 0, rushS: -1, twirlS: -1, eepS: -1, puff: 0, phew: -1, sweat: -1, zz: 0, flipNow: false, windT: 0 };
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
  const br = c.breath ?? 0;
  // Standing: its near paw at its side, the far one on its kite's strap; the kite rocking a little.
  go({ shN: -10 + br * 1.4, elN: -34, hwN: 0, shF: -36 + br, elF: -96, hwF: -20, head: -1, chest: -br * 0.6 }, 1);
  add({ tilt: 3, shN: Math.sin(U * TAU * 2) * 10, elN: -10 }, walking);
  q.kiteTilt = Math.sin(t * 0.8) * 0.03 + Math.sin(U * TAU * 2 + 0.6) * 0.06 * walking;
  q.bowRot = Math.sin(t * 0.7) * 0.03 + 0.25 * walking;
  q.earBack = 0.25 * walking;
  q.earSway = Math.sin(t * 0.7 + 0.4) * 0.03;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);

  if (k > 0.001 && piece === 'wind') {
    // a paw licked...
    const lk = win(pu, 0.2, 0.5, 1.2, 1.5);
    go({ shN: -70, elN: -120, hwN: -30, head: 6 }, lk * k);
    say('lick', lk * k);
    // ...and held up high to feel the wind, its ears turning
    const fl = win(pu, 1.5, 1.9, 3.4, 3.7);
    go({ shN: -160, elN: -20, hwN: -10, head: -10, tilt: -3 }, fl * k);
    say('feel', fl * k);
    q.earSway += Math.sin(pu * 3.2) * 0.25 * fl * k;
    // a gust! ears and bows streaming, the kite fluttering
    const g = win(pu, 3.6, 3.8, 4.4, 4.9);
    go({ tilt: -6, head: -4, shN: -40, elN: -60, toeN: -6 }, g * k);
    q.earBack += 0.9 * g * k;
    q.kiteTilt += -0.28 * g * k + Math.sin(pu * 22) * 0.05 * g * k;
    q.bowRot += 0.7 * g * k;
    q.gust = Math.max(q.gust, g * k);
    say('gust', g * k);
    // a happy nod: found it
    const nd = win(pu, 4.8, 5.1, 6.0, 6.4);
    go({ head: 6 + Math.sin((pu - 4.8) * 9) * 5 * nd, shN: -20 }, nd * k);
    say('found', nd * k);
  }
  if (k > 0.001 && piece === 'lift') {
    // the kite tugs it onto its toes
    const tp = win(pu, 0.3, 0.7, 1.2, 1.5);
    go({ lift: 0.04, toeN: 22, toeF: 22, tilt: -4, shN: -60, elN: -40, shF: -60, elF: -50 }, tp * k);
    q.kiteTilt += -0.22 * tp * k;
    say('whoa', tp * k);
    // and off the ground: its feet dangling and kicking, arms out for balance
    const up = win(pu, 1.2, 1.9, 4.2, 5.0);
    const kick = Math.sin(pu * 7.4);
    go({ toeN: 30, toeF: 26, tilt: -2 + Math.sin(pu * 2.2) * 4, shN: -100 + Math.sin(pu * 3.1) * 14, elN: -10, shF: -96 - Math.sin(pu * 3.1) * 14, elF: -14, head: -4, fxN: 0.12 * kick, fxF: -0.12 * kick, fyN: 0.18 + 0.06 * kick, fyF: 0.2 - 0.06 * kick }, up * k);
    add({ hop: 0.13 * up + Math.sin(pu * 2.4) * 0.02 * up }, k);
    q.kiteTilt += (-0.3 + Math.sin(pu * 2.4) * 0.08) * up * k;
    q.bowRot += 0.5 * up * k;
    q.earBack += 0.4 * up * k;
    q.earUp += 0.4 * up * k;
    say(pu < 2.4 ? 'whoa' : 'float', up * k);
    // it drifts down and lands with a wobble
    const ld = win(pu, 4.9, 5.1, 5.5, 5.9);
    go({ lift: -0.05, tilt: 6, shN: -60, elN: -40, shF: -50, elF: -40 }, ld * k);
    q.wobble = ld * k;
    // phew
    const ph = win(pu, 5.7, 6.0, 6.6, 7.0);
    go({ shN: -40, elN: -120, hwN: -30, head: 4, chest: 2 }, ph * k);
    say('phew', ph * k);
    if (pu > 5.8 && pu < 6.9) q.phew = pu - 5.8;
  }
  if (k > 0.001 && piece === 'hay') {
    // into its pocket...
    const rch = win(pu, 0.2, 0.5, 0.9, 1.1);
    go({ shN: 10, elN: -60, hwN: -20, head: 10 }, rch * k);
    // ...a sprig of sky-clover, held up
    const hold = win(pu, 1.0, 1.3, 1.6, 1.8);
    go({ shN: -110, elN: -50, head: -6 }, hold * k);
    say('find', hold * k);
    if (pu > 1.0 && pu < 6.0) q.sprig = pu - 1.0;
    // munched with a little bob
    const mu = win(pu, 1.7, 2.0, 4.4, 4.7);
    go({ shN: -64, elN: -118, hwN: -30, head: 4 + Math.sin(pu * 13) * 2.4 }, mu * k);
    say('munch', mu * k);
    q.bite = clamp((pu - 2) / 2.4, 0, 0.7);
    q.blush = Math.max(q.blush, mu * k * 0.6);
    // the rest tucked away for later, a pat
    const tk = win(pu, 4.6, 4.9, 5.7, 6.1);
    go({ shN: 10, elN: -60, hwN: -20, head: 8 }, tk * k);
    say('cheeky', win(pu, 4.6, 4.9, 6.2, 6.6) * k);
  }
  if (k > 0.001 && piece === 'strap') {
    // the strap tugged tight with both paws
    const tg = win(pu, 0.2, 0.5, 2.3, 2.6);
    const tw = Math.max(0, Math.sin(pu * 8));
    go({ shN: -60, elN: -100, hwN: -20, shF: -30, elF: -110, hwF: -30, chest: 2 + tw * 2, head: 4 }, tg * k);
    q.kiteTilt += (0.1 - tw * 0.12) * tg * k;
    say('tug', tg * k);
    // a look back over its shoulder at its kite
    const lb = win(pu, 2.7, 3.0, 4.3, 4.6);
    go({ head: -12, neckR: -8, chest: -3, tilt: -2 }, lb * k);
    say('check', lb * k);
    // chest out, proud
    const pr = win(pu, 4.7, 5.0, 6.3, 6.8);
    go({ chest: -6, tilt: -5, head: -6, shN: 20, elN: -110, hwN: 20, shF: 26, elF: -100, hwF: 20 }, pr * k);
    say('proud', pr * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: crouched low, ears forward, the kite raised (eased in and out, never a snap) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ lift: -0.03, tilt: 8, head: 2, shN: -50, elN: -60, shF: -46, elF: -70 }, hw);
    q.kiteTilt += -0.15 * hw;
    q.earUp += 0.5 * hw;
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.kiteTilt += 0.22;
    q.earBack += 0.5;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.55) / 0.4)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'gust') {
      // it leans back and lets the kite fill with wind
      go({ tilt: -14, chest: -5, head: -6, lift: -0.02, toeN: -12, toeF: -8, shN: -30, elN: -60, shF: -20, elF: -70, x: -0.04 }, wu);
      q.kiteTilt += -0.45 * wu;
      q.earBack += 0.6 * wu;
      q.bowRot += 0.4 * wu;
      q.gust = Math.max(q.gust, W * 0.7);
      say('focus', W);
      // then the gust shoves it forward into you
      if (s >= 0) {
        const out1 = sstep(s / 0.26);
        const back = sstep((s - 0.5) / 0.42);
        const xx = 0.42 * out1 * (1 - back);
        go({ x: xx, tilt: 20 * (1 - back), chest: 4, head: -2, shN: 40, elN: -20, shF: 50, elF: -20, fxN: xx * 2.2, fxF: xx * 2.2 - 0.15, toeN: 10 }, sw);
        add({ hop: Math.sin(Math.PI * clamp(s / 0.45, 0, 1)) * 0.05 }, sw);
        q.kiteTilt += -0.2 * sw;
        q.earBack += 1.0 * sw;
        q.bowRot += 0.8 * sw;
        q.rushS = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    } else if (mvName === 'twirl') {
      // it winds round...
      go({ tilt: -4, chest: -6, head: -10, neckR: -6, shN: 40, elN: -60, shF: 30, elF: -60, lift: -0.03 }, wu);
      q.kiteTilt += 0.2 * wu;
      say('focus', W);
      // ...then spins on the spot (a clean mirror flip and back), so the kite's edge swats you
      if (s >= 0) {
        if (s > 0.06 && s < 0.32) q.flipNow = true;
        go({ shN: -90, elN: -20, shF: -80, elF: -20, tilt: 4, head: 2 }, sw);
        add({ hop: Math.sin(Math.PI * clamp(s / 0.4, 0, 1)) * 0.03 }, sw);
        q.kiteTilt += (-0.35 + 0.35 * sstep((s - 0.3) / 0.3)) * sw;
        q.bowRot += 0.9 * sw;
        q.twirlS = s;
        say('shout', win(s, 0, 0.03, 0.3, 0.4));
      }
    } else {
      // cheeks puffed, up on its toes
      go({ lift: 0.03, toeN: 20, toeF: 18, tilt: -6, chest: -4, head: -6, shN: -30, elN: -110, shF: -30, elF: -110 }, wu);
      q.earUp += 0.8 * wu;
      q.puff = wu;
      say('puff', W);
      // then a sharp EEP! at you
      if (s >= 0) {
        go({ tilt: 10, chest: 4, head: 6, shN: 30, elN: -30, shF: 36, elF: -30, x: 0.04, lift: -0.01 }, sw);
        q.earUp += 1 * sw;
        q.eepS = s;
        say('shout', win(s, 0, 0.03, 0.45, 0.55));
      }
    }
  }
  // ----- Hurt: a squeak, ears flat -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shN: -60, elN: -120, shF: -50, elF: -120, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earBack += 1.1 * kh;
    q.kiteTilt += 0.2 * kh;
  }
  // ----- After landing a hit: a pleased little bounce on its toes, ears wiggling -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.9, 1.2) * (1 - F.moveW);
    go({ toeN: 16, toeF: 14, lift: 0.02 + Math.abs(Math.sin(gl * 9)) * 0.02, shN: -40, elN: -110, shF: -40, elF: -110, head: -4 }, kg);
    q.earSway += Math.sin(gl * 16) * 0.3 * kg;
    say('cheeky', kg);
  }
  // ----- A nap (its habitat): sat down, chin on its chest, ears drooped -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    go({ lift: -0.2 + Math.sin(now * 1.3) * 0.004, tilt: 10, head: 18 + Math.sin(now * 1.3) * 2, chest: 4, shN: -30, elN: -100, shF: -26, elF: -100, fxN: 0.32, fxF: 0.22, fyN: 0.02, fyF: 0.02 }, nw);
    q.earBack += 0.6 * nw;
    q.kiteTilt += 0.18 * nw;
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
    q.earBack = 0.8;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.6);
  // (the kite's tilt rides a critically damped spring, sub-stepped: it sets off and lands smoothly, never
  // leaping the frame a new aim is set)
  {
    let x = st.k_kiteX ?? q.kiteTilt;
    let v = st.k_kiteV ?? 0;
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      v += (260 * (q.kiteTilt - x) - 32 * v) * h;
      x += v * h;
    }
    st.k_kiteX = x;
    st.k_kiteV = v;
    q.kiteTilt = x;
  }
  easeKeys(st, q, ['bowRot', 'earBack', 'earUp', 'earSway', 'blush', 'puff', 'gust'], dt, (key) => (key.startsWith('ear') ? 10 : 8));
  q.calm = k;
  q.windT = t;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little diamond kite with the mark on it, a bow under it.
const BUBBLE = [[0, -7.4], [6.2, -0.8], [0.6, 6.2], [-0.6, 6.2], [-6.2, -0.8]];
const BCOL = [INK, '#fffaf2', KITE[3], '#7a6a8a'];
// A soft curling line of wind.
function windLine(ctx, x, y, len, u, al, d = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al * Math.sin(Math.PI * clamp(u, 0, 1));
  ctx.beginPath();
  const x0 = x - d * len * 0.5;
  ctx.moveTo(x0, y);
  ctx.bezierCurveTo(x0 + d * len * 0.4, y - 2, x0 + d * len * 0.8, y + 1.5, x0 + d * len, y - 1);
  ctx.arc(x0 + d * len - d * 0.2, y - 2.6, 1.6, Math.PI / 2, d > 0 ? -Math.PI / 2 - 1 : -Math.PI / 2 + 1, d < 0);
  pen(ctx, WIND[1], 1.4);
  ctx.stroke();
  pen(ctx, WIND[0], 0.7);
  ctx.stroke();
  ctx.restore();
}

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const [hx0, hy0] = headAt(a, D, [2, -4]);
  // a gust: soft curling lines of wind streaming past it, from ahead to behind
  if ((q.gust ?? 0) > 0.05) {
    for (let i = 0; i < 3; i++) {
      const f = (t * 1.1 + i / 3) % 1;
      windLine(ctx, hx0 + 14 - f * 34, hy0 - 8 + i * 8, 9, f, q.gust * 0.85, -1);
    }
  }
  // the sprig of sky-clover in its paw
  if ((q.sprig ?? -1) >= 0) {
    const [px, py] = ptOf(a, D, 'handN', D.J.handN);
    sprig(ctx, px + 0.4, py - 1.6, 0.9, -0.3, q.bite);
    if (q.sprig < 0.8) sparkle(ctx, px + 2, py - 6, 1.3 * Math.sin(Math.PI * q.sprig / 0.8), 1, '#f0e0ff');
  }
  // the landing: a soft puff of dust at its feet
  if ((q.wobble ?? 0) > 0.05) dust(ctx, 2, -0.5, 2 + q.wobble * 2, q.wobble * 0.6, '#ffffff', '#e2e6f2');
  // phew: a little sigh puff
  if ((q.phew ?? -1) >= 0 && q.phew < 1) {
    const [mx, my] = headAt(a, D, [22, 6]);
    dust(ctx, mx + 2 + q.phew * 4, my - q.phew * 2, 1 + q.phew, (1 - q.phew) * 0.7, '#ffffff', '#e6e8f4');
  }
  // ----- Gust Rush: wind lines curling round it as it's shoved forward, a puff where it lands -----
  if ((q.rushS ?? -1) >= 0 && q.rushS < 0.8) {
    const e = q.rushS / 0.8;
    for (let i = 0; i < 4; i++) windLine(ctx, hx0 - 6 - e * 10 - i * 3, hy0 - 10 + i * 7, 11, clamp(e * 1.6 - i * 0.1, 0, 1), 0.9, 1);
    if (q.rushS > 0.12 && q.rushS < 0.62) {
      const u = (q.rushS - 0.12) / 0.5;
      const [px, py] = ptOf(a, D, 'chest', [96, 100]);
      dust(ctx, px + 4 + u * 4, py, 2 + u * 4, (1 - u) * 0.8, '#ffffff', '#dde6f6');
      for (let i = 0; i < 3; i++) sparkle(ctx, px + 4 + Math.cos(i * 2.1) * (3 + u * 7), py + Math.sin(i * 2.1) * (3 + u * 5), 1.4 * (1 - u), 1, '#ffffff');
    }
  }
  // ----- Kite Twirl: a soft coral swoosh round it -----
  if ((q.twirlS ?? -1) >= 0 && q.twirlS < 0.55) {
    const e = q.twirlS / 0.55;
    const [cx, cy] = ptOf(a, D, 'chest', [80, 98]);
    ctx.save();
    ctx.globalAlpha *= 1 - sstep((e - 0.5) / 0.5);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 15, 6, -0.1, Math.PI * 0.9 - e * 2.6, Math.PI * 0.9 - e * 2.6 + 2.2 * Math.min(1, e * 2.5), false);
    pen(ctx, KITE[0], 3);
    ctx.stroke();
    pen(ctx, '#ffffff', 1.2);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 3; i++) sparkle(ctx, cx + 12 + i * 3, cy - 4 + i * 4, 1.2 * Math.sin(Math.PI * e), 1, i % 2 ? KITE[0] : '#ffffff');
  }
  // ----- Eep!: soft rings of its call, and the word -----
  if ((q.eepS ?? -1) >= 0 && q.eepS < 0.75) {
    const e = q.eepS / 0.75;
    const [mx, my] = headAt(a, D, [22, 6]);
    for (let i = 0; i < 3; i++) {
      const u = clamp(e * 1.4 - i * 0.18, 0, 1);
      if (u <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.9;
      ctx.beginPath();
      ctx.arc(mx + 1, my, 3 + u * 12, -0.8, 0.8);
      pen(ctx, '#ffffff', 1.3);
      ctx.stroke();
      pen(ctx, '#f6c0cc', 0.6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.7) / 0.3));
    cue(ctx, 'eep!', mx + 7 + e * 4, my - 7 - e * 3, 3.6, a.flip ? -1 : 1, -0.12, KITE[3], '#fffaf2');
    ctx.restore();
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#a08a98', '#fffaf2');
    }
  }
  const [bx, by] = headAt(a, D, [4, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  // (the skin is its jacket, sleeves and all; its own fur at its legs, paws, feet and neck)
  skin: {
    lt: JACK[0], base: JACK[1], sh: JACK[2], deep: JACK[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: '#7e6a5e' },
      neck: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    torso: (ctx, a, mode, S, D) => {
      kiteTail(ctx, a, mode, D);
      kite(ctx, a, mode, D);
    },
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => jacket(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('pika', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Kite Twirl: turned round with a clean mirror flip, never a squeeze)
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
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over its head its own)
export const KITE_PIKA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const KITE_PIKA_SIZE = { w: 26, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
