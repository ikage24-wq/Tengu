// The Cloudherd Samoyed (2026-11-27, the Sky Whale's Cloud Shepherd remade from scratch as a new creature; the
// id stays `shepherdess`). A sheepdog pup who gave up on sheep (too fast, too woolly, too many of them) and
// herds clouds instead. Its whole flock is one small cloud, which keeps wandering off. It looks a little like
// a cloud itself. On its own copy of the creature base (rig.js; body.js `samoyed`: a sturdy round body, a
// deep chest, sturdy legs on big round paws), dressed here; its head, ears, ruff, plume tail, smock, whistle
// and cloud drawn here from scratch over the mannequin (never the shared face, never the hero).
//   look    snow-white fur shaded a soft lilac, a big fluffy ruff round its neck (one soft bib, never
//           beads), pricked triangular ears with soft round tips and pink insides, a black nose, its plume
//           of a tail curled up over its back; a periwinkle shepherd's smock WORN (the base's body and arms:
//           sleeves and all) with cream smocking at the chest and a patch pocket, its fur below the hem;
//           a little brass shepherd's whistle on a cord. Its own soft lilac outline, outer edge only, face
//           bare.
//   eyes    its own "sheepdog eyes": soft downturned almonds (tareme), a warm cocoa iris with a sky-blue
//           reflection along its bottom, a big round glint, a lash line that droops softly to the outer
//           corner and ends round; soft little round brows.
//   walk    the base's walk at a jaunty pace (24), its plume tail swaying over its back, its cloud bobbing
//           along behind on a soft spring.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - count (6.4 s): it counts its flock (a look back at the cloud, one paw held up: one!), its tail
//             wagging, very pleased;
//           - stray (7.2 s): the cloud drifts off; it notices, drops into a herding crouch and gives it the
//             sheepdog's stare; two short whistles; the cloud comes back; good cloud;
//           - pillow (6.8 s): the cloud patted and plumped, then it leans its head back on it, eyes shut;
//           - rain (6.6 s): the cloud drifts over its head and drizzles on it; ears droop; then a big shake,
//             spray flying, and a sheepish look.
//   moves   Woof! (a deep breath, chest puffed; then a big round WOOF in a soft ring); Cloud Bonk (a whistle,
//           the cloud drawn back; then sent swooping at you, a soft bonk and a drizzle, and back); Shake-Off
//           (braced low; then a full-body shake, spray flying at you).
//   else    hurt: a yelp, ears back; after landing a hit: tail wagging, a happy pant; hunting you: the
//           herding crouch and the stare; low on health: worried, ears down, tail low, a bead of sweat; a nap
//           (habitat): sat down, its chin sunk in its ruff, the cloud tucked behind its head; beaten: dizzy.
//           Its marks over its head (!, ?) are its own: little clouds (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: the cloud and puffs as soft round billows,
// rain as a few soft drops, sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, cue, note } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee, ribbon } from './act.js';

const BIG = 1.12;
const LW = 1.6 / BIG;
const ID = 'cloudsamoyed';
// (2026-11-27, the player: very pale and plain. Its white fur now warms to cream in the light and cools
// to a gentle sky blue-grey in the shade, its outline a touch deeper, its smock a clearer periwinkle,
// its ears pinker, its muzzle and cheeks cream, so its face reads at a glance.)
const INK = '#8b80b2';
const FUR = ['#ffffff', '#fbf6ee', '#d8def0', '#b2bcdc'];
const EARIN = ['#ffd4de', '#f2a4ba'];
const SMOCK = ['#e8f0ff', '#b4cdf6', '#8eaae6', '#6d86c4'];
const STITCH = '#fff8ec';
const BRASS = ['#fff0b0', '#f2c860', '#c8963a'];
const CORD = '#8a6a9a';
const LASH = '#3a2c3e';
const IRIS = ['#1e140e', '#4e3022', '#80543a', '#a8d4ff'];
const CLOUD = ['#ffffff', '#f2f6ff', '#d6e2f8', '#b4c4e6'];
const RAIN = ['#e8f4ff', '#9ccaf4', '#6aa6e0'];

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
const NECK = [80.9, 87.3];
const HS = 1.3;
const HO = [1.4, -15.4];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
// (its plume: from its rump, up over its back, curling forward at the tip)
const TAIL_A = [70, 113];
const TAIL_B = [60, 100];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 70, c: 6, gain: 0.4, turn: 0.7, max: 12, flutter: 1.2, hz: 0.45, dir: [-4, -6] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 58, c: 5, gain: 0.5, turn: 0.7, max: 14, flutter: 1.6, hz: 0.5, dir: [2, -6] } },
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
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'calm' },
  look: { e: 'open', g: [-1.8, -0.4], b: [-0.4, -0.6], m: 'calm' },
  one: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  alert: { e: 'wide', g: [-1.6, 0], b: [-1.4, -1.6], m: 'o' },
  stare: { e: 'open', g: [-1.9, 0.4], b: [1, 1.2], m: 'calm' },
  whistle: { e: 'shut', b: [-0.4, -0.4], m: 'whistle' },
  good: { e: 'happy', b: [-1, -1], m: 'pant' },
  pat: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  bliss: { e: 'shut', b: [-0.8, -1], m: 'smile' },
  droop: { e: 'open', g: [0.2, -1.8], b: [-1.4, -1.6], m: 'frown' },
  shake: { e: 'squeeze', b: [0.6, 0.6], m: 'grit' },
  sheepish: { e: 'open', g: [-0.8, 0.8], b: [-1, -1.2], m: 'wobble' },
  puff: { e: 'shut', b: [0.4, 0.4], m: 'puff' },
  focus: { e: 'open', g: [1.5, 0.3], b: [0.8, 1], m: 'calm' },
  fierce: { e: 'open', g: [1.7, 0.4], b: [1.2, 1.4], m: 'grit' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'woof' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'pant' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'yelp' },
  worried: { e: 'open', g: [0.3, 1], b: [-1.4, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.2, 0.2], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['one', 'whistle', 'good', 'pat', 'bliss', 'shake', 'puff', 'shout', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The sheepdog eye: a soft almond whose outer corner droops (o: which side is outer).
function almond(ctx, x, y, w, h, o) {
  smooth(ctx, [[x - w * o, y - h * 0.2], [x - w * 0.55 * o, y - h * 0.95], [x + w * 0.35 * o, y - h * 1.0], [x + w * 1.02 * o, y - h * 0.2], [x + w * 0.9 * o, y + h * 0.6], [x, y + h * 0.95], [x - w * 0.8 * o, y + h * 0.55]]);
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.8;
  const h = 3.9;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1], [x - w * 0.1 * o, y - h * 0.9], [x + w, y + 1.4], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.4], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.6], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.2], [x, y + (kind === 'sleep' ? 2.6 : 2)], [x + w, y + 0.8], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
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
  } else {
    const [gx, gy] = f.g ?? [0.6, 0.3];
    ctx.save();
    almond(ctx, x, y, w * big, h * big, o);
    ctx.clip();
    const ix = x + gx * 0.6;
    const iy = y + 0.3 + gy * 0.4;
    const r = h * 0.82 * big;
    ell(ctx, ix, iy, r, r);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy - r * 0.2, r * 0.82, r * 0.74);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    // the sky caught along its bottom
    ctx.beginPath();
    ctx.ellipse(ix, iy + r * 0.1, r * 0.82, r * 0.78, 0, 0.35, Math.PI - 0.35);
    pen(ctx, tone(a, IRIS[3], 0.85), r * 0.26);
    ctx.stroke();
    ell(ctx, ix, iy - r * 0.08, r * 0.46, r * 0.46);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix - r * 0.34 * o, iy - r * 0.4, r * 0.3, r * 0.28);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ix + r * 0.3 * o, iy + r * 0.12, r * 0.11, r * 0.11);
    ctx.fill();
    ctx.restore();
  }
  // a soft lash line along the top, drooping to the outer corner, ending round
  ctx.beginPath();
  ctx.moveTo(x - w * big * 0.95 * o, y - h * big * 0.32);
  ctx.bezierCurveTo(x - w * 0.5 * o, y - h * big * 1.1, x + w * 0.45 * o, y - h * big * 1.12, x + w * big * 1.06 * o, y - h * big * 0.12);
  pen(ctx, tone(a, LASH), 1.3);
  ctx.stroke();
  ell(ctx, x + w * big * 1.14 * o, y + h * big * 0.02, 0.65, 0.65);
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
}
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 1.6, y + lift + 0.4);
  ctx.quadraticCurveTo(x, y - 0.6 + lift * 0.6, x + o * 1.6, y + lift * 0.35 + 0.4);
  pen(ctx, tone(a, FUR[3]), 1.45);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#3e2e40';
  const DARK = '#6a2e44';
  const line = (pts, w = 0.75) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h, tongue = 0) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y - 0.2], [x + w * 0.8, y + h], [x, y + h * 1.2], [x - w * 0.8, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x + 0.2, y + h * 0.8 + tongue, w * 0.55, h * 0.36 + tongue * 0.6);
    ctx.fillStyle = tone(a, '#ff8aa8');
    ctx.fill();
  };
  // (the short line down from its nose, in every mouth)
  stroke3(ctx, a, [x + 3.4, y - 3.2], [x + 1.2, y - 2.6], [x, y - 0.3], 0.6, LIP);
  switch (m) {
    case 'smile':
      line([[x - 3, y - 0.8], [x - 1.6, y + 1], [x, y], [x + 1.6, y + 1], [x + 2.8, y - 1]]);
      break;
    case 'pant':
      open(2.2, 2.2, 1.2);
      break;
    case 'woof':
      open(2.4, 3.2);
      break;
    case 'yelp':
      open(1.4, 2);
      break;
    case 'o':
      ell(ctx, x, y + 0.9, 0.95, 1.1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'whistle':
      ell(ctx, x + 0.4, y + 0.6, 0.6, 0.6);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'puff':
      ell(ctx, x - 3.4, y + 0.2, 2.6, 2);
      ctx.fillStyle = tone(a, FUR[0], 0.8);
      ctx.fill();
      line([[x - 1.4, y + 0.4], [x, y + 0.6], [x + 1.4, y + 0.3]]);
      break;
    case 'grit':
      line([[x - 2.2, y + 0.4], [x, y + 0.1], [x + 2.2, y + 0.4]], 0.9);
      break;
    case 'wobble':
      line([[x - 2.2, y + 0.4], [x - 1.1, y - 0.2], [x, y + 0.3], [x + 1.1, y - 0.2], [x + 2.2, y + 0.4]], 0.7);
      break;
    case 'frown':
      line([[x - 2.2, y + 1], [x, y], [x + 2.2, y + 1]]);
      break;
    case 'talkA':
      open(1.6, 2);
      break;
    case 'talkE':
      open(2, 1.2);
      break;
    default:
      // at rest: its lips closed, level, a soft curve each side
      line([[x - 2.6, y - 0.1], [x - 1.3, y + 0.7], [x, y], [x + 1.3, y + 0.7], [x + 2.5, y - 0.1]], 0.7);
  }
}
// The head: a broad soft wedge, full fluffy cheeks, a short sturdy muzzle.
const SKULL = [[-18, 2], [-17, -8], [-11.6, -14.6], [-2, -17], [7, -15.6], [13.6, -11], [17.6, -5.4], [22, -2.2], [25.4, 1], [25.2, 5], [21, 8.4], [13, 11.6], [4, 15.6], [-6.4, 16], [-14.8, 11.6]];
// Its pricked ears: triangles with soft round tips (`back` laid back, `droop` drooping).
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r * 0.8, 2.4], [-r * 0.62, -r * 0.9], [-r * 0.2, -r * 1.85], [r * 0.14, -r * 1.9], [r * 0.6, -r * 0.9], [r * 0.82, 2.4]]);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    smooth(ctx, [[-r * 0.44, 1.4], [-r * 0.36, -r * 0.7], [-r * 0.08, -r * 1.42], [r * 0.12, -r * 1.42], [r * 0.36, -r * 0.7], [r * 0.46, 1.4]]);
    ctx.fillStyle = tone(a, EARIN[0]);
    ctx.fill();
    glow(ctx, 0, -r * 0.5, r * 0.6, EARIN[1], 0.45);
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const back = q.earBack ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -10.6, -11.8, 5.4, -0.45 - back * 0.8);
  ear(ctx, a, mode, 1.6, -15.2, 5.8, 0.02 - back * 0.9);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 2, -9, 16, FUR[0], 0.95);
    glow(ctx, -14, 10, 11, FUR[2], 0.7);
    glow(ctx, 2, 14, 8, FUR[2], 0.45);
    // the soft fluffy cheek, its edge a gentle tuft
    ctx.beginPath();
    ctx.moveTo(-15, 4);
    ctx.quadraticCurveTo(-11, 9, -12.6, 13.4);
    pen(ctx, tone(a, FUR[2], 0.7), 0.7);
    ctx.stroke();
    glow(ctx, 20, 3, 7, FUR[0], 0.9);
    // (a warm cream muzzle and cheek fluff)
    glow(ctx, 19, 5.4, 7.6, '#fff0d8', 0.85);
    glow(ctx, -10, 9, 6, '#fff0dc', 0.55);
    ctx.restore();
    for (const [cx, cy, k] of [[-7.4, 6.4, 0.6], [9.4, 7.4, 1]]) {
      ell(ctx, cx, cy, 2.7, 1.6);
      ctx.fillStyle = tone(a, '#ff9fb6', 0.55 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -2.6, -2.4, -1, f);
    eye(ctx, a, 10.6, -2.8, 1, f);
    brow(ctx, a, -2.8, -9.2, -1, (f.b?.[0] ?? 0) * 0.9);
    brow(ctx, a, 10.4, -9.8, 1, (f.b?.[1] ?? 0) * 0.9);
    // the nose: a soft black button, glossy
    smooth(ctx, [[21.6, 0], [25.2, -0.6], [26.4, 1.4], [24.6, 3.6], [22, 3]]);
    ctx.fillStyle = tone(a, '#3a2e3e');
    ctx.fill();
    ell(ctx, 24, 0.4, 0.9, 0.45, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 19.6, 6.4, f.m);
  }
  ctx.restore();
}

// ---------- Its smock, ruff and whistle ----------
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
function smock(ctx, a, mode, D) {
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
  const c0 = C([st[0] + 4, st[1] + 8]);
  glow(ctx, c0[0], c0[1], 7, SMOCK[0], 0.8);
  // its own fur below the smock's hem (a soft curved hem, a little longer at the front)
  poly(ctx, [T([h[0] - 40, h[1] - 1]), T([h[0], h[1] + 1]), T([h[0] + 40, h[1] + 2]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  const bl = T([h[0] + 2, h[1] + 4]);
  glow(ctx, bl[0], bl[1], 5, FUR[0], 0.9);
  ctx.beginPath();
  ctx.moveTo(...T([h[0] - 40, h[1] - 1.4]));
  ctx.quadraticCurveTo(...T([h[0], h[1] + 0.6]), ...T([h[0] + 40, h[1] + 1.6]));
  pen(ctx, tone(a, SMOCK[3], 0.8), 0.9);
  ctx.stroke();
  // the smocking across its chest: two rows of soft cream stitches
  for (const dy of [5.5, 8]) {
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const p = C([st[0] - 8 + i * 2.2, st[1] + dy + (i % 2) * 1]);
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    pen(ctx, tone(a, STITCH, 0.85), 0.42);
    ctx.stroke();
  }
  // a patch pocket on its near side
  const pk = W([w[0] + 3, w[1] + 2]);
  smooth(ctx, [[pk[0] - 1.8, pk[1] - 1.5], [pk[0] + 1.8, pk[1] - 1.5], [pk[0] + 1.9, pk[1] + 1.8], [pk[0] - 1.9, pk[1] + 1.8]]);
  ctx.fillStyle = tone(a, SMOCK[2], 0.55);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(pk[0] - 1.8, pk[1] - 1.3);
  ctx.lineTo(pk[0] + 1.8, pk[1] - 1.3);
  pen(ctx, tone(a, STITCH, 0.9), 0.4);
  ctx.stroke();
  ctx.restore();
}
// The ruff: one big soft bib of fur round its neck, its lower edge three broad gentle lobes; the whistle on
// its cord hangs over it.
function ruff(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const q = a.gl ?? {};
  const j = q.jiggle ?? 0;
  const pts = [[-14, -7], [-4, -9.4], [7, -9], [16, -5.6], [17, 3 + j * 0.6], [13, 8.6 + j], [7.4, 7.4], [2.6, 11.4 - j * 0.6], [-3, 8.6], [-9, 10 + j * 0.5], [-14.4, 4]];
  smooth(ctx, pts.map(([x, y]) => C([st[0] + x, st[1] + y])));
  paint(ctx, a, mode, FUR[1]);
  if (mode !== 'fill') return;
  const g = C([st[0] + 3, st[1] - 2]);
  glow(ctx, g[0], g[1], 5, FUR[0], 1);
  const s2 = C([st[0] - 8, st[1] + 3]);
  glow(ctx, s2[0], s2[1], 3.4, FUR[2], 0.6);
  // the whistle's cord and the little brass whistle
  const w0 = C([st[0] + 5, st[1] + 4 + j * 0.4]);
  ctx.beginPath();
  ctx.moveTo(...C([st[0] - 2, st[1] - 6]));
  ctx.quadraticCurveTo(...C([st[0] + 2, st[1] + 2]), ...w0);
  pen(ctx, tone(a, CORD), 0.4);
  ctx.stroke();
  ctx.save();
  ctx.translate(...w0);
  ctx.rotate(0.5 + (q.whistleAng ?? 0));
  smooth(ctx, [[-0.6, -0.7], [2.6, -0.6], [3, 0.6], [1.6, 1.4], [-0.6, 0.8]]);
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ell(ctx, 0.8, -0.2, 0.9, 0.35);
  ctx.fillStyle = tone(a, BRASS[0]);
  ctx.fill();
  ctx.restore();
}
// Its plume of a tail, curled up over its back: one fluffy soft shape, its lit side bright.
const TAIL_PTS_A = [[72, 116], [64, 110], TAIL_B];
const TAIL_PTS_B = [[53, 88], [55, 77], [63, 72]];
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  ribbon(ctx, pts, [10, 15, 18, 18, 16, 12, 8].map((w) => w * D.SC));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 1; i < pts.length; i++) glow(ctx, pts[i][0] + 1, pts[i][1] - 1, 3.4, FUR[0], 0.9);
  glow(ctx, pts[1][0] - 2, pts[1][1] + 2, 4, FUR[2], 0.6);
  ctx.restore();
}

// ---------- Its cloud (its whole flock) ----------
// (rig space, game px, its feet at 0, 0; `s` its size, `rain` 0..1 a drizzle under it)
function cloud(ctx, x, y, s, al = 1, squish = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  const lobes = [[-4.6, 0.8, 3.2], [-1.6, -1.8, 4], [2.4, -1.2, 3.6], [5, 1, 2.8], [0.4, 1.6, 3.6]];
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    for (const [lx, ly, r] of lobes) {
      ctx.moveTo(lx * s + r * s, ly * s);
      ctx.ellipse(lx * s, ly * s + squish * 0.6, r * s, r * s * (1 - squish * 0.0), 0, 0, TAU);
    }
    if (pass === 'line') {
      pen(ctx, CLOUD[3], 1.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = CLOUD[1];
      ctx.fill();
    }
  }
  // a soft shade along its bottom, a bright top
  ctx.save();
  ctx.beginPath();
  for (const [lx, ly, r] of lobes) {
    ctx.moveTo(lx * s + r * s, ly * s);
    ctx.ellipse(lx * s, ly * s, r * s, r * s, 0, 0, TAU);
  }
  ctx.clip();
  glow(ctx, 0, 4 * s, 7 * s, CLOUD[2], 0.9);
  glow(ctx, -1.6 * s, -3 * s, 4.6 * s, CLOUD[0], 1);
  ctx.restore();
  ctx.restore();
}
function drop(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  smooth(ctx, [[0, -1.6 * s], [0.9 * s, 0.2 * s], [0.7 * s, 1 * s], [-0.7 * s, 1 * s], [-0.9 * s, 0.2 * s]]);
  ctx.fillStyle = RAIN[1];
  ctx.fill();
  ell(ctx, -0.25 * s, 0.1 * s, 0.25 * s, 0.4 * s);
  ctx.fillStyle = RAIN[0];
  ctx.fill();
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { count: 6.4, stray: 7.2, pillow: 6.8, rain: 6.6 };
const ORDER = ['count', 'stray', 'pillow', 'rain'];
const POOL = ['woof', 'cloud', 'shake'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
// (where its cloud floats at rest, behind its shoulder, game px from its feet)
const HOME = [-15, -27];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, tailRot: 0, tailCurl: 0, earBack: 0, blush: 0, jiggle: 0, whistleAng: 0, cx: HOME[0], cy: HOME[1], rain: 0, spray: -1, oneS: -1, notes: 0, bonkS: -1, woofS: -1, shakeS: -1, sweat: -1, zz: 0 };
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
  const toCloud = (x, y, k) => {
    q.cx = mix(q.cx, x, k);
    q.cy = mix(q.cy, y, k);
  };
  const { alive, mvName, W, s, hurt, ago, fighting, napping, cine, low } = F;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const U = a[`tk${ID}U`] ?? 0;
  const br = c.breath ?? 0;
  // Standing: square on its paws, chest out a little, paws easy at its sides; the cloud bobbing behind.
  go({ shN: -14 + br * 1.4, elN: -40, hwN: 0, shF: -10 + br, elF: -44, hwF: 0, head: -2, chest: -1 - br * 0.6 }, 1);
  add({ tilt: 3 }, walking);
  q.tailRot = Math.sin(t * 0.7) * 0.05 + Math.sin(U * TAU * 2) * 0.08 * walking;
  q.tailCurl = Math.sin(t * 0.55 + 1) * 0.06;
  q.cy += Math.sin(t * 1.1 + (m.uid ?? 0)) * 1.2;
  q.cx += -5 * walking;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  const wag = (amt, kk) => {
    q.tailRot += Math.sin(now * 13) * 0.16 * amt * kk;
    q.tailCurl += Math.sin(now * 13 - 0.8) * 0.12 * amt * kk;
  };

  if (k > 0.001 && piece === 'count') {
    // a look back at its flock
    const lb = win(pu, 0.2, 0.6, 1.6, 1.9);
    go({ head: -6, neckR: -6, chest: -2 }, lb * k);
    say('look', lb * k);
    // one paw held up: one!
    const one = win(pu, 1.9, 2.2, 4.0, 4.4);
    go({ shN: -150, elN: -20, hwN: -10, head: -4, chest: -4, tilt: -3 }, one * k);
    say('one', one * k);
    if (pu > 2.0 && pu < 3.4) q.oneS = pu - 2.0;
    // very pleased, tail wagging
    const pl = win(pu, 3.6, 4.0, 6.0, 6.4);
    wag(1, pl * k);
    go({ chest: -5, head: -3 }, pl * k);
    say('good', pl * k);
  }
  if (k > 0.001 && piece === 'stray') {
    // the cloud drifts off
    const off = win(pu, 0.2, 1.8, 4.6, 6.0);
    toCloud(HOME[0] - 22, HOME[1] + 6, off * k);
    // it notices
    say('alert', win(pu, 1.0, 1.2, 1.9, 2.1) * k);
    go({ head: -8, neckR: -8 }, win(pu, 1.0, 1.3, 1.9, 2.1) * k);
    q.earBack -= 0.2 * win(pu, 1.0, 1.2, 1.9, 2.1) * k;
    // the herding crouch and the stare
    const cr = win(pu, 1.9, 2.3, 3.4, 3.7);
    go({ lift: -0.07, tilt: 12, head: 4, neckR: -6, shN: -24, elN: -40, shF: -16, elF: -40 }, cr * k);
    say('stare', cr * k);
    // two short whistles
    const wh = win(pu, 3.5, 3.7, 4.7, 5.0);
    go({ shN: -110, elN: -116, hwN: -30, head: -4 }, wh * k);
    q.whistleAng = 1.2 * wh * k;
    say('whistle', wh * k);
    q.notes = Math.max(q.notes, wh * k);
    // good cloud
    const gd = win(pu, 5.4, 5.7, 6.8, 7.2);
    wag(1, gd * k);
    say('good', gd * k);
  }
  if (k > 0.001 && piece === 'pillow') {
    // the cloud patted and plumped (it comes round to its shoulder)
    const pt = win(pu, 0.2, 0.6, 2.8, 3.1);
    toCloud(-10, -22, pt * k);
    go({ shF: -60 + Math.sin(pu * 11) * 14, elF: -60, hwF: -20, head: -6, neckR: -6, chest: -2 }, pt * k);
    say('pat', pt * k);
    // its head laid back on it, eyes shut
    const lay = win(pu, 3.0, 3.5, 6.0, 6.6);
    toCloud(-6, -36, lay * k);
    go({ head: -14, neckR: -10, chest: -6, tilt: -6, shN: -10, elN: -60, shF: -10, elF: -60 }, lay * k);
    say('bliss', lay * k);
    q.tailCurl += 0.2 * lay * k;
  }
  if (k > 0.001 && piece === 'rain') {
    // the cloud drifts over its head and drizzles
    const ov = win(pu, 0.2, 1.0, 3.7, 4.2);
    toCloud(4, -52, ov * k);
    q.rain = win(pu, 1.0, 1.3, 3.4, 3.8) * k;
    go({ head: -12, neckR: -4 }, win(pu, 1.0, 1.4, 3.3, 3.7) * k);
    say('droop', win(pu, 1.2, 1.5, 3.5, 3.8) * k);
    q.earBack += 0.8 * win(pu, 1.2, 1.6, 3.6, 3.9) * k;
    q.tailRot += 0.3 * q.rain;
    // a big shake, spray flying
    const sh = win(pu, 3.9, 4.0, 5.0, 5.2);
    const wob = Math.sin(pu * 24);
    go({ tilt: wob * 9, head: wob * -12, neckR: wob * 6, chest: wob * 3, shN: -20 + wob * 20, shF: -20 - wob * 20, elN: -40, elF: -40 }, sh * k);
    q.jiggle = wob * sh * k;
    if (pu > 3.9 && pu < 5.3) q.spray = pu - 3.9;
    say('shake', sh * k);
    // a sheepish look
    say('sheepish', win(pu, 5.1, 5.3, 6.2, 6.6) * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the herding crouch and the stare (eased in and out) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ lift: -0.05, tilt: 10, head: 3, shN: -26, elN: -44, shF: -18, elF: -44 }, hw);
    toCloud(HOME[0] - 2, HOME[1] - 4, hw);
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.earBack += 0.7;
    q.tailRot += 0.4;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.55) / 0.4)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'woof') {
      // a deep breath, chest puffed, head back
      go({ tilt: -10, chest: -8, head: -12, shN: 10, elN: -50, shF: 14, elF: -50, toeN: 6 }, wu);
      say('puff', W);
      // WOOF
      if (s >= 0) {
        go({ tilt: 12, chest: 6, head: 8, x: 0.05, shN: -30, elN: -40, shF: -20, elF: -40 }, sw);
        q.earBack += 0.5 * sw;
        q.woofS = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else if (mvName === 'cloud') {
      // a whistle, the cloud drawn back
      go({ shN: -110, elN: -116, hwN: -30, head: -2 }, wu);
      q.whistleAng = 1.2 * wu;
      q.notes = Math.max(q.notes, wu);
      toCloud(HOME[0] - 8, HOME[1] - 6, wu);
      say('whistle', W);
      // then sent swooping at you: a soft bonk, a drizzle, and back
      if (s >= 0) {
        go({ shN: -90, elN: -6, hwN: 10, tilt: 6, head: -2, x: 0.02 }, sw);
        const out1 = sstep(s / 0.22);
        const back = sstep((s - 0.55) / 0.4);
        toCloud(mix(HOME[0], 30, out1 * (1 - back)), mix(HOME[1], -16, out1 * (1 - back)) - Math.sin(Math.PI * out1) * 8 * (1 - back), sw);
        q.bonkS = s;
        q.rain = Math.max(q.rain, win(s, 0.2, 0.3, 0.6, 0.8));
        say('fierce', sw);
      }
    } else {
      // braced low
      go({ lift: -0.05, tilt: 10, head: 10, shN: -20, elN: -40, shF: -14, elF: -40 }, wu);
      say('focus', W);
      // a full-body shake, spray flying at you
      if (s >= 0) {
        const fade = 1 - sstep((s - 0.1) / 0.5);
        const wob = Math.sin(s * 30) * fade;
        go({ tilt: 4 + wob * 10, head: wob * -14, neckR: wob * 6, chest: wob * 4, shN: -20 + wob * 22, shF: -20 - wob * 22, elN: -40, elF: -40, lift: -0.02 }, sw);
        q.jiggle = wob * sw;
        q.shakeS = s;
        say('shake', win(s, 0, 0.03, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: a yelp, ears back -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shN: -40, elN: -80, shF: -30, elF: -80, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earBack += 1.2 * kh;
    toCloud(HOME[0] - 4, HOME[1] + 2, kh);
  }
  // ----- After landing a hit: tail wagging, a happy pant -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.3 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 1.0, 1.3) * (1 - F.moveW);
    wag(1.2, kg);
    go({ chest: -4, head: -4, tilt: -2 }, kg);
    say('happy', kg);
  }
  // ----- A nap (its habitat): sat down, its chin sunk in its ruff, the cloud tucked behind its head -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    go({ lift: -0.2 + Math.sin(now * 1.3) * 0.004, tilt: 8, head: 16 + Math.sin(now * 1.3) * 2, chest: 3, shN: -30, elN: -90, shF: -26, elF: -90, fxN: 0.3, fxF: 0.2, fyN: 0.02, fyF: 0.02 }, nw);
    toCloud(-9, -16, nw);
    q.tailRot += 0.3 * nw;
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
    q.earBack = 0.9;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.2);
  // (its cloud rides a soft damped spring of its own, sub-stepped: it drifts after its aim, overshoots a
  // touch and settles; never a snap)
  {
    let x = st.k_cx ?? q.cx;
    let y = st.k_cy ?? q.cy;
    let vx = st.k_cvx ?? 0;
    let vy = st.k_cvy ?? 0;
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    const K = mvName ? 140 : 40;
    const Cd = mvName ? 18 : 9.5;
    for (let i = 0; i < n; i++) {
      vx += (K * (q.cx - x) - Cd * vx) * h;
      vy += (K * (q.cy - y) - Cd * vy) * h;
      x += vx * h;
      y += vy * h;
    }
    if (!Number.isFinite(x + y)) {
      x = q.cx;
      y = q.cy;
      vx = vy = 0;
    }
    Object.assign(st, { k_cx: x, k_cy: y, k_cvx: vx, k_cvy: vy });
    q.cx = x;
    q.cy = y;
  }
  easeKeys(st, q, ['tailRot', 'tailCurl', 'earBack', 'blush', 'whistleAng', 'rain', 'notes'], dt, (key) => (key.startsWith('tail') ? 9 : 10));
  q.calm = k;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little cloud with the mark on it.
const BUBBLE = Array.from({ length: 12 }, (_, i) => {
  const an = (i / 12) * TAU;
  const r = i % 2 ? 5.4 : 6.6;
  return [Math.cos(an) * r * 1.05, Math.sin(an) * r * 0.86];
});
const BCOL = [INK, '#ffffff', '#e8607a', '#7a86b6'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
  const q = a.gl ?? {};
  if (m.hp <= 0) return;
  // its cloud, behind it, a drizzle under it when it rains
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.37;
  if ((q.rain ?? 0) > 0.05) {
    for (let i = 0; i < 4; i++) {
      const f = (t * 1.6 + i / 4) % 1;
      drop(ctx, q.cx - 4 + i * 2.6, q.cy + 3 + f * 14, 0.8, q.rain * Math.sin(Math.PI * f));
    }
  }
  cloud(ctx, q.cx, q.cy, 1, 1, 0);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.37;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  // "one!"
  if ((q.oneS ?? -1) >= 0 && q.oneS < 1.4) {
    const [px, py] = ptOf(a, D, 'handN', D.J.handN);
    ctx.save();
    ctx.globalAlpha *= sstep(q.oneS / 0.12) * (1 - sstep((q.oneS - 1.1) / 0.3));
    cue(ctx, 'one!', px + 4, py - 5 - q.oneS * 2, 3.4, a.flip ? -1 : 1, -0.1, '#7a86b6', '#ffffff');
    ctx.restore();
  }
  // whistles: little notes off its whistle
  if ((q.notes ?? 0) > 0.1) {
    const [mx, my] = headAt(a, D, [24, 6]);
    for (let i = 0; i < 2; i++) {
      const f = (t * 1.2 + i * 0.5) % 1;
      note(ctx, mx + 3 + f * 6, my - 2 - f * 8, 0.8, Math.sin(f * 6) * 0.2, q.notes * Math.sin(Math.PI * f), '#9ab8f0');
    }
  }
  // the shake's spray: a few soft drops flung out both ways
  const spray = (e, n, reach) => {
    const [cx, cy] = ptOf(a, D, 'chest', [80, 96]);
    for (let i = 0; i < n; i++) {
      const sd = i % 2 ? 1 : -1;
      const v = clamp(e * 1.4 - (i >> 1) * 0.08, 0, 1);
      drop(ctx, cx + sd * (5 + v * reach * (0.7 + (i % 3) * 0.15)), cy + 2 - Math.sin(Math.PI * v) * (6 + (i % 3) * 2) + v * 4, 0.75, 1 - v);
    }
  };
  if ((q.spray ?? -1) >= 0 && q.spray < 1.2) spray(q.spray / 1.2, 6, 16);
  // ----- Woof!: a big round soft ring of its bark, and the word -----
  if ((q.woofS ?? -1) >= 0 && q.woofS < 0.8) {
    const e = q.woofS / 0.8;
    const [mx, my] = headAt(a, D, [26, 6]);
    for (let i = 0; i < 2; i++) {
      const u = clamp(e * 1.3 - i * 0.2, 0, 1);
      if (u <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.9;
      ell(ctx, mx + 2 + u * 8, my, 3 + u * 8, 3 + u * 9);
      pen(ctx, '#ffffff', 1.6);
      ctx.stroke();
      pen(ctx, CLOUD[2], 0.6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.7) / 0.3));
    cue(ctx, 'woof!', mx + 8 + e * 3, my - 9 - e * 3, 3.8, a.flip ? -1 : 1, -0.1, '#7a86b6', '#ffffff');
    ctx.restore();
  }
  // ----- Cloud Bonk: sparkles where the cloud lands -----
  if ((q.bonkS ?? -1) >= 0 && q.bonkS > 0.18 && q.bonkS < 0.7) {
    const u = (q.bonkS - 0.18) / 0.52;
    for (let i = 0; i < 4; i++) {
      const an = -1.4 + i * 0.9;
      sparkle(ctx, q.cx + 4 + Math.cos(an) * (5 + u * 7), q.cy + Math.sin(an) * (4 + u * 5), 1.5 * Math.sin(Math.PI * u), 1, i % 2 ? '#dbe8ff' : '#ffffff');
    }
  }
  // ----- Shake-Off: spray flung at you -----
  if ((q.shakeS ?? -1) >= 0 && q.shakeS < 0.8) spray(q.shakeS / 0.8, 8, 22);
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#9aa6d0', '#ffffff');
    }
  }
  const [bx, by] = headAt(a, D, [4, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  // (the skin is its smock, sleeves and all; its own fur at its legs, paws, feet and neck)
  skin: {
    lt: SMOCK[0], base: SMOCK[1], sh: SMOCK[2], deep: SMOCK[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
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
    torso: (ctx, a, mode, S, D) => tail(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => smock(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => ruff(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('samoyed', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
export const CLOUD_SAMOYED_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const CLOUD_SAMOYED_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
