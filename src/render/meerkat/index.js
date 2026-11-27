// The Jelly Bean Meerkat (2026-11-27, the Candy Volcano's Jelly Bean Ninja remade from scratch as a new
// creature; the id stays `jellyninja`). A meerkat on lookout duty in the Licorice Mine and the Candy
// Kitchen: meerkats keep watch for their burrow standing tall on their toes and tail, and this one keeps
// watch with a slingshot (a candy-cane fork, a licorice-lace band) and a bandolier of jelly beans for
// ammunition, which it eats when nobody's looking. It warms its tummy at the caramel's glow the way
// meerkats sunbathe, and digs for dropped jelly beans in the sugar gravel. On its own copy of the creature
// base (rig.js; body.js `meerkat`: a slim upright body with a long soft tummy, slim arms, long narrow
// feet), dressed here; its head, eye patches, ears, bandolier, slingshot and tail drawn here from scratch
// over the mannequin (never the shared face, never the hero).
//   look    sandy toffee fur, a long cream tummy, soft darker bands across its back; a narrow head with a
//           soft pointed snout and a round cocoa nose; soft cocoa patches round its eyes (the eyes on top,
//           clear); little crescent ears low at the sides; its own eyes ("lookout eyes": upturned almonds,
//           a honey-gold iris with a big round pupil and a little round glint, a neat lash line flicking up
//           at the outer corner); round sandy brows; a mint bandolier across its chest, six jelly beans in
//           its loops (strawberry, lemon, lime, grape, orange, blueberry); its slingshot in its near paw;
//           a long thin tail with a cocoa tip. Its own soft toffee outline, outer edge only, face bare.
//   walk    a brisk upright scurry at the base's walk, its tail swaying low behind as a balance.
//   idle    a 29 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - sentry (7.2 s): up tall on its toes, tail planted behind as a prop, paws held at its chest;
//             it looks up, along, down, a peep!; all clear; it settles;
//           - sunbathe (7.0 s): it leans back with its tummy to the warm glow, paws out, eyes closed,
//             blissful, a shimmer of warmth; a scratch of its tummy;
//           - dig (7.0 s): it digs fast, sugar gravel flying out behind; a jelly bean! held up, popped
//             in its mouth, a happy munch;
//           - practice (7.4 s): a bean loaded, the band drawn, one eye shut to aim; let go: the bean goes
//             straight up... and comes down bonk on its head; a rub, sheepish.
//   moves   Slingshot (a bean from its bandolier, loaded, the band drawn back to its cheek; then let fly at
//           you, data `shot: 'jellybean'`); Gravel Kick (it turns its back, digging in; then flings a
//           spray of sugar gravel back at you between its legs, and turns round again); Lookout Pounce (up
//           tall on its toes; then a pounce at you, paws first, and back).
//   else    hurt: a squeak and a wince, ears back; after landing a hit: a jelly bean flipped up and caught
//           in its mouth; hunting you: low, the slingshot ready, eyes narrowed; low on health: worried, a
//           bead of sweat; a nap (habitat): curled on its side, its tail over its nose, z's; beaten: dizzy.
//           Its marks over its head (!, ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: jelly beans as glossy rounded beans, gravel as
// soft sugar grains (round, a few), warmth as a soft shimmer, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust, cue } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee, ribbon } from './act.js';

const BIG = 1.2;
const LW = 1.6 / BIG;
const INK = '#9a6e4e';
const FUR = ['#fff4e2', '#f0d4aa', '#d6b082', '#b48c62'];
const CREAM = ['#fffcf4', '#fbf0de'];
const PATCH = ['#a6806e', '#8a6658'];
const NOSE = ['#7a5048', '#5e3a36'];
const LASH = '#4a2e26';
const IRIS = ['#2e1a0e', '#8a5a1a', '#d8a434', '#ffe08a'];
const STRAP = ['#c8f4e0', '#8ad8b8', '#5ab494'];
const BEANS = ['#ff8aa8', '#ffd86a', '#9ee06a', '#c09aff', '#ffae6a', '#8acaff'];
const CANE = ['#ffffff', '#ff7a8e', '#d8485e'];
const LICO = '#7a4a6a';
const GRAVEL = ['#fffaf2', '#f4dcc8', '#d8b8a0'];

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
const ID = 'jellymeerkat';
const NECK = [80.9, 86.4];
const HS = 1.3;
const HO = [1.5, -16];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [72, 116];
const TAIL_B = [60, 126];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 76, c: 5.8, gain: 0.4, turn: 0.8, hang: 0.12, max: 12, flutter: 1, hz: 0.42, dir: [-6, 5] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 64, c: 5, gain: 0.46, turn: 0.8, hang: 0.12, max: 14, flutter: 1.4, hz: 0.5, dir: [-6, 3] } },
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
const FACES = {
  calm: { e: 'open', g: [0.5, 0.2], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.8], m: 'open' },
  scanUp: { e: 'open', g: [0.6, -1.6], b: [-0.8, -1], m: 'calm' },
  scanFar: { e: 'open', g: [1.6, 0], b: [-0.4, 0.6], m: 'calm' },
  scanDown: { e: 'open', g: [0.8, 1.6], b: [-0.4, -0.4], m: 'calm' },
  peep: { e: 'wide', g: [1.4, -0.4], b: [-1.4, -1.6], m: 'o' },
  clear: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  bask: { e: 'shut', b: [-0.8, -1.2], m: 'smile' },
  scratch: { e: 'happy', b: [-0.4, -0.8], m: 'open' },
  dig: { e: 'squeeze', b: [-0.4, 1], m: 'grit' },
  find: { e: 'wide', g: [0.6, -0.8], b: [-1.6, -1.8], m: 'o' },
  munch: { e: 'happy', b: [-0.4, -0.6], m: 'chew' },
  aim: { e: 'wink', g: [1.6, 0], b: [-0.4, 1.2], m: 'set' },
  up: { e: 'open', g: [0.4, -2], b: [-1.2, -1.6], m: 'o' },
  bonk: { e: 'squeeze', b: [1.2, -1.4], m: 'wobble' },
  sheepish: { e: 'open', g: [-1.2, 0.8], b: [1, -1.4], m: 'smile' },
  focus: { e: 'open', g: [1.4, 0.3], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.6, 0.2], b: [-1, 2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  cheeky: { e: 'happy', b: [-0.8, -0.2], m: 'chew' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'squeak' },
  surprised: { e: 'wide', g: [0.2, -0.4], b: [-2, -2.2], m: 'o' },
  worried: { e: 'open', g: [0.3, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.5, 0.2], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.5, 0.2], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.5, 0.2], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'clear', 'bask', 'scratch', 'dig', 'munch', 'bonk', 'shout', 'cheeky', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The lookout eye's outline: an upturned almond, its outer corner (o's side) lifted.
function almond(ctx, x, y, w, h, o) {
  smooth(ctx, [[x - w * o, y + h * 0.4], [x - w * o * 0.7, y - h * 0.6], [x, y - h * 0.98], [x + w * o * 0.8, y - h * 0.9], [x + w * o * 1.06, y - h * 0.5], [x + w * o * 0.8, y + h * 0.4], [x, y + h * 0.92], [x - w * o * 0.7, y + h * 0.8]]);
}
function eye(ctx, a, x, y, o, f) {
  const w = 4.1;
  const h = 4.3;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'open' : 'happy';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 0.8], [x, y - h * 1.15], [x + w, y + 0.4 - 0.6 * o], 1.4, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.3], 1.3, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.2], [x + w * 0.2 * o, y + 1.1], [x + w * 0.9 * o, y + 0.4], 1.15, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 2.6 : 2)], [x + w, y - 0.6 * o], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  almond(ctx, x, y, w * big, h * big, o);
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
    return;
  }
  const [gx, gy] = f.g ?? [0.5, 0.2];
  ctx.save();
  almond(ctx, x, y, w * big, h * big, o);
  ctx.clip();
  const ix = x + gx * 0.8;
  const iy = y + gy * 0.6;
  const ir = h * 0.82 * big;
  ell(ctx, ix, iy, ir, ir);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ir * 0.26, ir * 0.8, ir * 0.66);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ir * 0.6, ir * 0.5, ir * 0.24);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ell(ctx, ix, iy, ir * 0.5, ir * 0.5);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix - 1.1 * o, iy - 1.3, 1.1, 1.0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  // a neat lash line over the top, flicking up at its outer corner
  stroke3(ctx, a, [x - w * 0.9 * o, y - h * 0.5], [x + w * 0.1 * o, y - h * 1.32], [x + w * 1.04 * o, y - h * 0.62], 1.25, LASH);
  stroke3(ctx, a, [x + w * 0.96 * o, y - h * 0.62], [x + (w + 0.8) * o, y - h * 0.86], [x + (w + 1.2) * o, y - h * 1.3], 0.9, LASH);
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.1, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 0.9 + (bo + bi) * 0.35, x + o * 2.1, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1.5);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#8a5048';
  const DARK = '#6a2e3a';
  const line = (pts, w = 0.72) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.8, w * 0.55, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb4');
    ctx.fill();
  };
  switch (m) {
    case 'smile':
      line([[x - 2, y - 0.2], [x - 0.9, y + 1.1], [x + 0.2, y + 0.3], [x + 1.1, y + 1], [x + 2, y - 0.5]]);
      break;
    case 'open':
      open(1.8, 2);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 0.9, 1.05);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'squeak':
      open(1.2, 1.7);
      break;
    case 'grit':
      line([[x - 1.8, y + 0.4], [x, y + 0.1], [x + 1.8, y + 0.4]], 0.9);
      break;
    case 'chew':
      line([[x - 1.7, y + 0.3], [x - 0.7, y + 1.1], [x + 0.3, y + 0.5], [x + 1.1, y + 1], [x + 1.8, y + 0.2]], 0.72);
      ell(ctx, x - 2.6, y - 0.6, 1.4, 1.1);
      ctx.fillStyle = tone(a, FUR[0], 0.6);
      ctx.fill();
      break;
    case 'set':
      line([[x - 1.8, y + 0.5], [x, y], [x + 1.8, y + 0.5]], 0.85);
      break;
    case 'shout':
      open(2.2, 2.6);
      break;
    case 'wobble':
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.3], [x, y + 0.3], [x + 0.9, y - 0.3], [x + 1.8, y + 0.4]], 0.66);
      break;
    case 'frown':
      line([[x - 1.6, y + 0.8], [x, y - 0.1], [x + 1.6, y + 0.8]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.6, 0.5);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'talkA':
      open(1.4, 1.8);
      break;
    case 'talkE':
      open(1.8, 1.1);
      break;
    default:
      // at rest: a small alert mouth, one corner up
      line([[x - 1.8, y + 0.1], [x - 0.8, y + 0.9], [x + 0.2, y + 0.3], [x + 1, y + 0.8], [x + 1.9, y - 0.3]], 0.7);
  }
}
// The head: a narrow round head and a soft pointed snout.
const SKULL = [[-16, 3], [-15.4, -7], [-10, -14], [-1.6, -16.6], [7, -15], [13.4, -9.4], [18, -2.6], [23.4, 2.6], [24.6, 6.6], [21.6, 9.4], [13, 12.6], [2, 14.4], [-8, 13], [-13.6, 8.8]];
function ear(ctx, a, mode, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  smooth(ctx, [[-2.2, 2], [-3.2, -1.6], [-1.4, -4.4], [1.4, -4.4], [3.2, -1.6], [2.2, 2]]);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    ell(ctx, 0, -1.6, 1.4, 1.6);
    ctx.fillStyle = tone(a, PATCH[1], 0.7);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  const flat = q.earFlat ?? 0;
  ear(ctx, a, mode, -14.2, -2.6, -1.4 - flat * 0.4);
  ear(ctx, a, mode, 5, -13.6, 0.4 + flat * 0.4);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 0, -10, 15, FUR[0], 0.85);
    glow(ctx, -12, 8, 9, FUR[2], 0.6);
    // a cream muzzle and throat
    smooth(ctx, [[2, 6], [12, 3.4], [22, 4.6], [22, 10], [12, 14], [0, 15], [-6, 12]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    // a soft darker cap over the top of its head
    glow(ctx, -6, -16, 10, FUR[3], 0.4);
    ctx.restore();
    // soft cocoa patches round its eyes (teardrops falling to the cheek), the eyes on top
    for (const [px, py, o] of [[-5.6, -1, -1], [7, -1.6, 1]]) {
      smooth(ctx, [[px - 4.8, py - 0.6], [px - 3.4, py - 4.6], [px + 1, py - 5.2], [px + 4.4, py - 2.8], [px + 4.2, py + 2], [px + 1.4 * o, py + 5.6], [px - 3.2, py + 3.2]]);
      ctx.fillStyle = tone(a, PATCH[0], 0.42);
      ctx.fill();
    }
    for (const [cx, cy, k] of [[-10.2, 6.6, 0.7], [5.4, 7.6, 1]]) {
      ell(ctx, cx, cy, 2.3, 1.4);
      ctx.fillStyle = tone(a, '#ff98a8', 0.4 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -5.6, -1, -1, f);
    eye(ctx, a, 7, -1.6, 1, f);
    brow(ctx, a, -5.6, -8.2, -1, f.b);
    brow(ctx, a, 7.2, -8.8, 1, f.b);
    // the nose: a soft round cocoa button
    smooth(ctx, [[21.4, 2.6], [24.6, 2.2], [25.6, 4], [24, 5.8], [21.6, 5]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 23.4, 3, 0.8, 0.4, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 19.4, 9.4, f.m);
  }
  ctx.restore();
}

// ---------- Its body ----------
// A long cream tummy, soft bands across its back, the bandolier and its jelly beans.
function coat(ctx, a, mode, D) {
  if (mode !== 'fill' || !a.blTorsoPts) return;
  const q = a.gl ?? {};
  ctx.save();
  ctx.beginPath();
  a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.clip();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  smooth(ctx, [[81, 94], [90, 94], [95, 106], [93, 120], [85, 125], [79, 118], [78, 104]]);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  glow(ctx, 87, 100, 6, CREAM[0], 0.9);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(60, 98 + i * 6);
    ctx.quadraticCurveTo(66, 100 + i * 6, 70, 97 + i * 6);
    pen(ctx, tone(a, FUR[3], 0.45), 1.6);
    ctx.stroke();
  }
  // the bandolier: a mint strap from its far shoulder across to its near hip, beans in its loops
  ctx.beginPath();
  ctx.moveTo(70, 90);
  ctx.quadraticCurveTo(82, 100, 93, 116);
  pen(ctx, tone(a, STRAP[2]), 4);
  ctx.stroke();
  pen(ctx, tone(a, STRAP[1]), 3);
  ctx.stroke();
  const n = q.beans ?? 6;
  for (let i = 0; i < 6; i++) {
    const u = 0.12 + i * 0.15;
    const bx = mix(mix(70, 82, u), mix(82, 93, u), u);
    const by = mix(mix(90, 100, u), mix(100, 116, u), u);
    if (i < n) {
      ell(ctx, bx, by, 2, 1.4, 0.9);
      ctx.fillStyle = tone(a, BEANS[i]);
      ctx.fill();
      ell(ctx, bx - 0.5, by - 0.5, 0.7, 0.4, 0.9);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();
    } else {
      ell(ctx, bx, by, 1.6, 1, 0.9);
      ctx.fillStyle = tone(a, STRAP[2]);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();
}
// Its long thin tail, from its rump on two springy halves, a cocoa tip.
const TAIL_PTS_A = [[73, 115], [66, 121], TAIL_B];
const TAIL_PTS_B = [[53, 131], [46, 135.6], [40, 138]];
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const c = ribbon(ctx, pts, [5, 4.2, 3.4, 2.8, 2.2, 1.8].map((w) => w * D.SC * 1.4));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  const tip = c[c.length - 1];
  ell(ctx, tip[0], tip[1], 2.6, 2.6);
  ctx.fillStyle = tone(a, PATCH[1]);
  ctx.fill();
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0], c[i][1] - 0.8, 1.6, FUR[1], 0.6);
  ctx.restore();
}
// Its slingshot, in its near paw: a candy-cane fork (its band drawn live in the effects).
const FORK = { tipA: [-4.4, -14], tipB: [4.4, -14] };
function slingshot(ctx, a, mode, D) {
  const q = a.gl ?? {};
  ctx.save();
  enter(ctx, a, D, 'handN');
  const [x, y] = D.J.handN;
  ctx.translate(x, y);
  ctx.rotate(q.slingAng ?? 0);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.lineTo(0, -6);
  ctx.quadraticCurveTo(-4.4, -6.6, -4.4, -14);
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(4.4, -6.6, 4.4, -14);
  if (mode === 'line') {
    pen(ctx, '#b84a62', 3.6);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, CANE[0]), 2.2);
    ctx.stroke();
    ctx.setLineDash([1.6, 1.6]);
    pen(ctx, tone(a, CANE[1]), 2.2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}
const forkTip = (a, D, which) => {
  const q = a.gl ?? {};
  const [x, y] = D.J.handN;
  const an = q.slingAng ?? 0;
  const [u, v] = FORK[which];
  return ptOf(a, D, 'handN', [x + u * Math.cos(an) - v * Math.sin(an), y + u * Math.sin(an) + v * Math.cos(an)]);
};

// ---------- Its things in the world ----------
function bean(ctx, x, y, s, ang, col, al = 1) {
  if (al <= 0.01 || s <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-1.8 * s, -0.4 * s], [-0.6 * s, -1.2 * s], [1.4 * s, -1 * s], [1.9 * s, 0.2 * s], [0.8 * s, 1.1 * s], [-1.2 * s, 1 * s]]);
    if (pass === 'line') {
      pen(ctx, '#8a5a6a', 0.55 * s);
      ctx.stroke();
    } else {
      ctx.fillStyle = col;
      ctx.fill();
      ell(ctx, -0.4 * s, -0.5 * s, 0.7 * s, 0.35 * s, 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }
  }
  ctx.restore();
}
function grain(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.85);
  ctx.fillStyle = GRAVEL[1];
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.45, r * 0.35);
  ctx.fillStyle = GRAVEL[0];
  ctx.fill();
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { sentry: 7.2, sunbathe: 7.0, dig: 7.0, practice: 7.4 };
const ORDER = ['sentry', 'sunbathe', 'dig', 'practice'];
const POOL = ['sling', 'kick', 'pounce'];
const MELEE = ['kick', 'pounce'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
const pick = (m, n) => (m.swingFar === true ? 'sling' : m.swingFar === false ? MELEE[n % 2] : POOL[n % POOL.length]);
// (the sling drawn: its near paw out with the fork, the far paw back at its cheek with the pouch)
const DRAWN = { shN: -96, elN: -8, hwN: 0, shF: -88, elF: -118, hwF: -20 };

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL, pick);
  const now = F.now;
  const q = { face: null, tailRot: 0, tailCurl: 0, earFlat: 0, blush: 0, slingAng: 0.4, band: 0, pouch: 0, beans: 6, peep: -1, warm: 0, gravel: 0, found: -1, eaten: false, loaded: false, upBean: -1, slingS: -1, kickS: -1, pounceS: -1, flip: -1, sweat: -1, zz: 0, flipNow: false };
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
  // Standing: upright, its slingshot hanging from its near paw, the far paw at its chest, alert. Walking:
  // a brisk upright scurry, its tail low behind as a balance.
  const br = c.breath ?? 0;
  go({ shN: -6 + br * 1.4, elN: -30, hwN: 0, shF: -40 + br, elF: -100, hwF: -24, head: -1, chest: -br * 0.6 }, 1);
  add({ tilt: 4 }, walking);
  q.tailRot = Math.sin(t * 0.7) * 0.05 + Math.sin(U * TAU * 2) * 0.1 * walking;
  q.tailCurl = Math.sin(t * 0.55 + 1) * 0.05;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  let curl = 0;

  if (k > 0.001 && piece === 'sentry') {
    // up tall on its toes, tail planted, paws at its chest
    const tall = win(pu, 0.2, 0.7, 5.6, 6.2);
    go({ lift: 0.05, toeN: 22, toeF: 22, tilt: -6, chest: -3, shN: -40, elN: -100, hwN: -40, shF: -36, elF: -104, hwF: -40 }, tall * k);
    q.tailRot += 0.5 * tall * k;
    q.tailCurl -= 0.3 * tall * k;
    q.slingAng = mix(q.slingAng, 1.6, tall * k);
    // it looks up, along, down
    say('scanUp', win(pu, 0.8, 1.0, 1.8, 2.0) * k);
    go({ head: -14 }, win(pu, 0.8, 1.0, 1.8, 2.0) * k);
    say('scanFar', win(pu, 2.0, 2.2, 3.0, 3.2) * k);
    say('scanDown', win(pu, 3.2, 3.4, 3.9, 4.1) * k);
    go({ head: 12 }, win(pu, 3.2, 3.4, 3.9, 4.1) * k);
    // a peep!
    const pp = win(pu, 4.0, 4.1, 4.7, 4.9);
    say('peep', pp * k);
    go({ head: -6, lift: 0.015 }, pp * k);
    if (pu > 4.05 && pu < 5.2) q.peep = pu - 4.05;
    // all clear; it settles
    say('clear', win(pu, 5.0, 5.2, 6.6, 7.0) * k);
  }
  if (k > 0.001 && piece === 'sunbathe') {
    // leaned back, tummy to the warm glow, paws out, eyes closed
    const bk = win(pu, 0.2, 0.8, 5.2, 5.8);
    go({ tilt: -14, chest: -6, head: -10, shN: -60, elN: -20, hwN: 20, shF: -50, elF: -24, hwF: 20, lift: -0.02 }, bk * k);
    q.slingAng = mix(q.slingAng, 0.9, bk * k);
    say('bask', bk * k);
    q.warm = bk * k;
    q.tailRot += 0.3 * bk * k;
    // a scratch of its tummy
    const sc = win(pu, 5.2, 5.4, 6.4, 6.8);
    go({ shF: -10, elF: -80, hwF: -30 + Math.sin(pu * 26) * 16, head: 6 }, sc * k);
    say('scratch', sc * k);
  }
  if (k > 0.001 && piece === 'dig') {
    // it digs fast, gravel flying out behind
    const dg = win(pu, 0.2, 0.6, 3.6, 4.0);
    const d = Math.sin(pu * 18);
    go({ tilt: 30, head: 16, lift: -0.08, shN: -40 + d * 26, elN: -30, shF: -40 - d * 26, elF: -30, fxN: 0.2, fxF: -0.2 }, dg * k);
    q.slingAng = mix(q.slingAng, 2.4, dg * k);
    q.tailRot -= 0.4 * dg * k;
    say('dig', dg * k);
    q.gravel = dg * k;
    // a jelly bean! held up, popped in its mouth
    const up = win(pu, 3.9, 4.2, 5.0, 5.3);
    go({ shF: -130, elF: -60, hwF: -20, head: -8 }, up * k);
    say('find', up * k);
    if (pu > 3.9 && pu < 5.3) q.found = pu - 3.9;
    const eat = win(pu, 5.2, 5.4, 6.4, 6.8);
    go({ shF: -60, elF: -120, hwF: -30, head: 4 + Math.sin(pu * 14) * 1.5 }, eat * k);
    say('munch', eat * k);
    if (pu > 5.2 && pu < 5.5) q.found = 1.3 + (pu - 5.2);
  }
  if (k > 0.001 && piece === 'practice') {
    // a bean loaded, the band drawn, one eye shut to aim; aimed straight up (just to see)
    const ld = win(pu, 0.2, 0.5, 0.8, 1.0);
    go({ shF: -40, elF: -120, hwF: -20 }, ld * k);
    const dr = win(pu, 0.9, 1.6, 2.6, 2.7);
    go({ ...DRAWN, shN: -150, shF: -140, elF: -100, head: -14, tilt: -4 }, dr * k);
    q.slingAng = mix(q.slingAng, 0, dr * k);
    q.band = Math.max(q.band, dr * k);
    q.loaded = pu > 0.4 && pu < 2.65;
    q.beans = pu > 0.4 ? 5 : 6;
    say('aim', dr * k);
    // let go: the bean straight up... and back down, bonk
    if (pu > 2.65 && pu < 4.6) q.upBean = pu - 2.65;
    say('up', win(pu, 2.7, 2.8, 3.8, 3.9) * k);
    go({ head: -18 }, win(pu, 2.7, 2.8, 3.8, 3.95) * k);
    const bk2 = win(pu, 3.95, 4.0, 4.6, 4.9);
    go({ head: 10, lift: -0.03, shF: -150, elF: -90, hwF: -20 }, bk2 * k);
    say('bonk', bk2 * k);
    // a rub, sheepish
    const rb = win(pu, 4.8, 5.0, 6.8, 7.2);
    go({ shF: -160, elF: -80, hwF: -20 + Math.sin(pu * 16) * 14, head: 6 }, rb * k);
    say('sheepish', rb * k);
    q.blush = Math.max(q.blush, rb * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: low, the slingshot ready, eyes narrowed -----
  if (hunting && !hurt && !mvName) {
    go({ tilt: 8, head: 4, lift: -0.03, shN: -60, elN: -40, shF: -50, elF: -100 }, 1 - walking * 0.5);
    q.slingAng = mix(q.slingAng, 0.3, 1 - walking * 0.5);
    q.face = 'fierce';
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
    if (mvName === 'sling') {
      // a bean from its bandolier, loaded, the band drawn back to its cheek
      const ld = win(W, 0, 0.2, 0.3, 0.45);
      go({ shF: -40, elF: -120, hwF: -20 }, ld * (1 - snap));
      go(DRAWN, sstep((W - 0.3) / 0.5) * (1 - snap));
      go({ tilt: -3, head: -2 }, wu);
      q.slingAng = mix(q.slingAng, 1.55, sstep((W - 0.3) / 0.5) * (1 - snap));
      q.band = Math.max(q.band, sstep((W - 0.3) / 0.5) * (1 - snap));
      q.loaded = W > 0.2 && s < 0;
      q.beans = W > 0.15 ? 5 : 6;
      say(W < 0.4 ? 'focus' : 'aim', W);
      if (s >= 0) {
        // let fly
        go({ ...DRAWN, shF: -60, elF: -40, hwF: 20, tilt: 4 }, snap * sw);
        q.slingAng = mix(q.slingAng, 1.55, sw);
        q.slingS = s;
        q.beans = 5;
        say('shout', win(s, 0, 0.03, 0.25, 0.4));
      }
    } else if (mvName === 'kick') {
      // it turns its back, digging in
      go({ tilt: 30, head: 14, lift: -0.08, shN: -30, elN: -30, shF: -30, elF: -30 }, wu);
      if (W > 0.25 || (s >= 0 && s < 0.55)) q.flipNow = true;
      say('dig', W);
      if (s >= 0) {
        // a spray of sugar gravel flung back at you between its legs
        const kk = Math.sin(s * 30) * win(s, 0, 0.03, 0.4, 0.5);
        go({ fxN: -0.4 * Math.max(0, kk), fyN: 0.2 * Math.max(0, kk), fxF: -0.4 * Math.max(0, -kk), fyF: 0.2 * Math.max(0, -kk) }, sw);
        q.kickS = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else {
      // up tall on its toes; then a pounce at you, paws first, and back
      go({ lift: 0.05, toeN: 22, toeF: 22, tilt: -8, head: -6, shN: -50, elN: -100, shF: -44, elF: -104 }, wu);
      q.tailRot += 0.4 * wu;
      say('focus', W);
      if (s >= 0) {
        const v = clamp(s / 0.45, 0, 1);
        const up = Math.sin(Math.PI * v);
        const out1 = sstep(s / 0.25);
        const back = sstep((s - 0.5) / 0.4);
        const xx = 0.5 * out1 * (1 - back);
        go({ x: xx, tilt: 24 * up, head: -4, shN: -120, elN: -10, shF: -110, elF: -10, fxN: xx * toLeg, fxF: xx * toLeg - 0.2, fyN: 0.2 * up, fyF: 0.3 * up }, sw);
        add({ hop: up * 0.16 }, sw);
        if (s > 0.3 && s < 0.8) q.pounceS = s - 0.3;
        say('shout', win(s, 0, 0.04, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: a squeak and a wince, ears back -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shF: -50, elF: -120, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
  }
  // ----- After landing a hit: a jelly bean flipped up and caught in its mouth -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.8, 1.1) * (1 - F.moveW);
    go({ shF: -90, elF: -60, hwF: 10, head: -14 }, kg);
    q.flip = gl;
    say(gl < 0.6 ? 'up' : 'cheeky', kg);
  }
  // ----- A nap (its habitat): curled on its side, its tail over its nose -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    curl = Math.max(curl, nw);
    q.tailRot += 1.6 * nw;
    q.tailCurl += 0.8 * nw;
    q.slingAng = mix(q.slingAng, 1.6, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (curl > 0.001) go({ lift: -0.22 + Math.sin(now * 1.4) * 0.006, tilt: 22, head: 20, neckR: 5, shN: -40, elN: -110, shF: -36, elF: -110, fxN: 0.3, fxF: 0.24, fyN: 0.04, fyF: 0.04 }, curl);
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
  settleFace(st, q, now, m.uid, SHUTS, 3.9);
  easeKeys(st, q, ['tailRot', 'tailCurl', 'earFlat', 'blush', 'slingAng', 'band', 'warm'], dt, (key) => (key === 'band' ? 20 : key.startsWith('tail') ? 9 : 12));
  q.calm = k;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
const BUBBLE = [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]];
const BCOL = [INK, '#fffaf2', '#e8608e', '#9a6e4e'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.53;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -28]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const A = forkTip(a, D, 'tipA');
  const B = forkTip(a, D, 'tipB');
  const [fh, fv] = ptOf(a, D, 'handF', D.J.handF);
  // the band: from each tip of the fork, to its far paw when drawn, else slack between them
  {
    const b = clamp(q.band ?? 0, 0, 1);
    const P = [mix((A[0] + B[0]) / 2, fh, b), mix((A[1] + B[1]) / 2 + 2 * (1 - b), fv, b)];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...A);
    ctx.quadraticCurveTo(mix(A[0], P[0], 0.5), mix(A[1], P[1], 0.5) + 0.6 * (1 - b), ...P);
    ctx.quadraticCurveTo(mix(B[0], P[0], 0.5), mix(B[1], P[1], 0.5) + 0.6 * (1 - b), ...B);
    pen(ctx, LICO, 0.6);
    ctx.stroke();
    ctx.restore();
    if (q.loaded) bean(ctx, P[0], P[1], 0.75, 0.3, BEANS[5]);
  }
  // peep!: its little alarm call
  if ((q.peep ?? -1) >= 0 && q.peep < 1.1) {
    const e = q.peep;
    const [mx, my] = headAt(a, D, [24, 4]);
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.8) / 0.3));
    cue(ctx, 'peep!', mx + 5 + e * 3, my - 5 - e * 4, 3.4, a.flip ? -1 : 1, -0.1, '#a0604a', '#fffaf2');
    ctx.restore();
  }
  // the caramel's warmth on its tummy: a soft shimmer
  if ((q.warm ?? 0) > 0.05) {
    const [cx, cy] = ptOf(a, D, 'waistB', [88, 104]);
    glow(ctx, cx + 4, cy, 10, '#ffc888', 0.3 * q.warm);
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.5 + i * 0.5) % 1;
      ctx.save();
      ctx.globalAlpha *= q.warm * Math.sin(Math.PI * f) * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + 8 + i * 3, cy + 4 - f * 10);
      ctx.quadraticCurveTo(cx + 10 + i * 3, cy - f * 10, cx + 8 + i * 3, cy - 4 - f * 10);
      pen(ctx, '#ffe4b8', 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
  // digging: sugar gravel flying out behind it
  if ((q.gravel ?? 0) > 0.05) {
    for (let i = 0; i < 4; i++) {
      const f = (t * 2.2 + i / 4) % 1;
      grain(ctx, -2 - f * 14, -1 - Math.sin(Math.PI * f) * 7, 0.7, q.gravel * (1 - f * 0.6));
    }
  }
  // the jelly bean it finds (then eats)
  if ((q.found ?? -1) >= 0 && q.found < 1.4) {
    const [hx, hy] = ptOf(a, D, 'handF', D.J.handF);
    bean(ctx, hx + 0.6, hy - 1.8, 0.9, 0.3, BEANS[0]);
    if (q.found < 1) sparkle(ctx, hx + 3, hy - 4, 1.2 * Math.sin(Math.PI * q.found), 1, '#fff0c8');
  }
  // practice: the bean shot straight up, then back down on its head
  if ((q.upBean ?? -1) >= 0) {
    const e = q.upBean;
    const [hx, hy] = headAt(a, D, [0, -18]);
    const top = hy - 26;
    const y = e < 0.65 ? mix(fv, top, sstep(e / 0.65)) : e < 1.3 ? mix(top, hy, ((e - 0.65) / 0.65) ** 2) : hy - Math.sin(Math.PI * clamp((e - 1.3) / 0.4, 0, 1)) * 4 + (e - 1.3) * 10;
    const x = e < 1.3 ? mix(fh, hx, sstep(e / 1.3)) : hx + (e - 1.3) * 12;
    bean(ctx, x, y, 0.9, e * 9, BEANS[5], 1 - sstep((e - 1.7) / 0.25));
    if (e > 1.28 && e < 1.7) sparkle(ctx, hx, hy - 1, 1.8 * Math.sin(Math.PI * (e - 1.28) / 0.42), 1, '#ffffff');
  }
  // ----- Slingshot: the bean away, a flick of the band -----
  if ((q.slingS ?? -1) >= 0 && q.slingS < 0.6) {
    const e = q.slingS / 0.6;
    const x0 = (A[0] + B[0]) / 2;
    const y0 = (A[1] + B[1]) / 2;
    bean(ctx, x0 + e * 34, y0 - Math.sin(Math.PI * e) * 3, 0.9, e * 12, BEANS[5], 1 - sstep((e - 0.75) / 0.25));
    for (let i = 1; i <= 3; i++) sparkle(ctx, x0 + e * 34 - i * 3, y0 - Math.sin(Math.PI * e) * 3 + i * 0.4, 1 - i * 0.2, 1 - e, BEANS[i]);
  }
  // ----- Gravel Kick: a spray of sugar gravel back at you -----
  if ((q.kickS ?? -1) >= 0 && q.kickS < 0.8) {
    const e = q.kickS / 0.8;
    for (let i = 0; i < 7; i++) {
      const f = clamp(e * 1.3 - i * 0.06, 0, 1);
      // (flung out behind it, between its legs: it has its back to you, so behind is your way)
      grain(ctx, -2 - f * (16 + i * 2.4), -2 - Math.sin(Math.PI * f) * (4 + (i % 3) * 3), 0.8 + (i % 2) * 0.3, 1 - f);
    }
    dust(ctx, -6 - e * 10, -2, 1.6 + e * 2, (1 - e) * 0.7, GRAVEL[0], GRAVEL[2]);
  }
  // ----- Lookout Pounce: a soft bonk of sparkles where its paws land -----
  if ((q.pounceS ?? -1) >= 0 && q.pounceS < 0.5) {
    const e = q.pounceS / 0.5;
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    for (let i = 0; i < 4; i++) {
      const an = -1.2 + i * 0.8;
      sparkle(ctx, hx + 2 + Math.cos(an) * (2 + e * 8), hy + Math.sin(an) * (2 + e * 7), 1.4 * (1 - e), 1, i % 2 ? '#fff0c8' : '#ffffff');
    }
  }
  // gloat: a jelly bean flipped up off its paw and caught in its mouth
  if ((q.flip ?? -1) >= 0 && q.flip < 0.7) {
    const e = q.flip / 0.7;
    const [mx, my] = headAt(a, D, [20, 9]);
    bean(ctx, mix(fh, mx, e), mix(fv, my, e) - Math.sin(Math.PI * e) * 10, 0.8, e * 10, BEANS[1], 1 - sstep((e - 0.85) / 0.15));
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [10, -22]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#a07a5a', '#fffaf2');
    }
  }
  const [bx, by] = headAt(a, D, [6, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

// The shot it slings in the dungeon (render/dreamfx.js dreamShot, the 'spit' vfx): a jelly bean
// tumbling along, a few candy sparkles trailing.
export function jellyBeanShot(ctx, shot, x, y, p, d) {
  if (shot !== 'jellybean') return false;
  ctx.save();
  for (let i = 1; i <= 3; i++) sparkle(ctx, x - d * i * 3, y + Math.sin(p * 12 + i) * 1, 1.1 - i * 0.22, 0.9 - i * 0.2, BEANS[i]);
  bean(ctx, x, y, 1.5, p * 14 * d, BEANS[Math.floor(p * 0.01) % BEANS.length]);
  ctx.restore();
  return true;
}

const DRESS = {
  id: ID,
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: LW },
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
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => slingshot(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('meerkat', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Gravel Kick: turned round with a clean mirror flip, never a squeeze)
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
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over its head left
// to it, drawn here in its own style)
export const JELLY_MEERKAT_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const JELLY_MEERKAT_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
