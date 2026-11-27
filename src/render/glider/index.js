// The Star Glider (2026-11-26, the Star Observatory's Comet Courier remade from scratch as a new creature;
// the id stays `cometcourier`). A little sugar glider who lives on the Starlit Stair, the open stair
// up the outside of Astraea's tower, where the meteor showers come down. It catches the falling stars
// and keeps them in its pouch, so its tummy glows like a lantern; on a clear night you can count how
// many it has caught by how warm the glow is. Its gliding skin is freckled with tiny stars. On its own
// copy of the creature base (rig.js; body.js `glider`: a slim little body, a round tummy, short legs,
// longer arms), dressed here; its head, ears, gliding skin, pouch and tail drawn here from scratch
// over the mannequin (never the shared face, never the hero).
//   look    soft periwinkle-grey fur, a cream face and tummy, a navy stripe from between its eyes up
//           over its crown, big round dish ears (lilac-pink inside) on springs; its own eyes
//           ("moonpool eyes": tall and round, a deep indigo iris lightening to periwinkle at the
//           bottom with a ring of gold starlight, a crescent-moon glint and a round one, a neat lash
//           line with a little upturned wing); round fur brows that do its acting; a pink nose; the
//           pouch on its tummy glowing gold; its gliding skin from wrist to ankle (folded away at
//           rest, spread wide to glide), a cream rim and star freckles; a long bushy tail hanging
//           behind in a hook, its tip navy with a twinkle. Its own soft indigo outline, outer edge
//           only, face bare.
//   walk    the base's walk at a quick little critter's pace, its tail swaying behind as a rudder.
//   idle    a 30 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - catch (8.6 s): its ears perk, it looks up: a falling star streaks down; a crouch and a
//             hop with its arms up (skin spread) and it catches it; hot! hot!: juggled paw to paw and
//             blown on; tucked into its pouch, which glows brighter; a proud pat; a happy wiggle;
//           - groom (6.8 s): it washes its face with both paws, then pulls its tail round in front and
//             combs it; a fluff and a shake from nose to tail tip;
//           - stargaze (7.0 s): it sits back on its haunches, looks up, and traces a constellation
//             with one finger (its stars and lines appear as it draws them), a dreamy sigh;
//           - practice (7.6 s): a big stretch, skin spread wide, and a yawn; then a pretend glide,
//             leaning out on one foot, arms wide; it wobbles, windmills, nearly falls; sheepish, then a
//             ta-da.
//   moves   Glide Swoop (a crouch, arms flung up, its skin opening wide; then it swoops at you low and
//           fast in a trail of stardust and skips back); Star Toss (a paw into its pouch, a star pulled
//           out, juggled, hot; then lobbed at you, bursting in sparkles); Tail Twirl (its back half
//           turned, the tail fluffed up high; then a spin, the tail whipping round in a ring of
//           stardust).
//   else    hurt: a squeezed wince, ears flat back, a star jumping out of its pouch and dropping back
//           in; after landing a hit: a cheeky pat of its pouch, its tongue out; hunting you: crouched,
//           ears forward, arms half out; low on health: worried, a bead of sweat; a nap (habitat): sat
//           down, its tail wrapped round its front like a blanket, the pouch glowing low; beaten: dizzy.
//           Its marks over its head (!, ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: stars as round-tipped gold stars with a soft
// glow, stardust as soft round motes (never specks), sparkles the game's curvy stars, puffs of breath
// soft white rounds.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, sline, pen, glow, sparkle, dizzy, sweat } from './fx.js';

const BIG = 1.15;
const LW = 1.6 / BIG;
const INK = '#5a5890';
const FUR = ['#eef0fb', '#bcc1e2', '#9399c6', '#6e72a2'];
const CREAM = ['#fffbf4', '#f5ecdf', '#ddd0c4'];
const STRIPE = ['#545a9a', '#3c4078'];
const EAR_IN = ['#f8d6e8', '#e8aeca'];
const NOSE = ['#f49ab4', '#d0728e'];
const LASH = '#322a5c';
const IRIS = ['#241e4e', '#3f3a92', '#6964c8', '#a6b2ee', '#ffe7a8'];
const STAR = ['#fffbe6', '#ffe89a', '#ffcf5a', '#e6a23a'];
const STAR_INK = '#c7862c';
const MEM = ['#c4c8e6', '#a6abd6', '#8a90c0'];
const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));

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
// (its loose pieces: the ears and the two halves of its tail, on the engine's soft springs)
const NECK = [80.9, 87.3];
const HS = 1.3;
const HO = [1.5, -16.5];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const EAR_F = [-9.6, -12.6];
const EAR_N = [6.4, -15.4];
const TAIL_A = [71.6, 114];
const TAIL_B = [57.4, 133.6];
const JOINTS = { earF: hk(EAR_F), earN: hk(EAR_N), tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { earF: 'earF', earN: 'earN', tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'earF', parent: 'head', pivot: 'earF', rot: (S, a) => a.gl?.earF ?? 0, soft: { k: 130, c: 7, gain: 0.32, turn: 0.6, max: 12, flutter: 1, hz: 0.5, dir: [0, -7] } },
  { name: 'earN', parent: 'head', pivot: 'earN', rot: (S, a) => a.gl?.earN ?? 0, soft: { k: 140, c: 7, gain: 0.32, turn: 0.6, max: 12, flutter: 1, hz: 0.57, dir: [0, -7] } },
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 62, c: 5.2, gain: 0.45, turn: 0.8, hang: 0.25, max: 14, flutter: 1.5, hz: 0.42, dir: [-6, 7] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 54, c: 4.6, gain: 0.5, turn: 0.8, hang: 0.2, max: 16, flutter: 2, hz: 0.5, dir: [-6, 2] } },
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
// e: open | wide | happy | shut | sleep | squeeze | dizzy | wink; g gaze; b brows [outer, inner]
// (+ lower); m mouth.
const FACES = {
  calm: { e: 'open', g: [0.5, 0.4], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  cozy: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  up: { e: 'open', g: [0.6, -2.2], b: [-1, -1.4], m: 'o' },
  wonder: { e: 'wide', g: [0.5, -1.8], b: [-1.6, -2], m: 'o' },
  hot: { e: 'squeeze', b: [0.6, 1.2], m: 'shout' },
  blow: { e: 'shut', b: [0.2, 0.6], m: 'blow' },
  proud: { e: 'happy', b: [-0.8, -0.4], m: 'grin' },
  wash: { e: 'shut', b: [0, -0.2], m: 'smile' },
  dreamy: { e: 'happy', b: [-0.8, -1.4], m: 'smile' },
  trace: { e: 'open', g: [0.9, -2.4], b: [-0.8, -1], m: 'calm' },
  yawn: { e: 'squeeze', b: [0.6, -1.2], m: 'yawn' },
  whee: { e: 'wide', g: [1.2, -0.4], b: [-1.4, -1.6], m: 'grin' },
  wobbly: { e: 'wide', g: [-0.6, 1], b: [1.2, -1.8], m: 'wobble' },
  sheepish: { e: 'open', g: [-1.2, 0.8], b: [1, -1.4], m: 'smile' },
  tada: { e: 'wink', g: [1, 0], b: [-1, -0.6], m: 'grin' },
  focus: { e: 'open', g: [1.4, 0.6], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.6, 0.4], b: [-1, 2.2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  cheeky: { e: 'wink', g: [1, 0.2], b: [-0.8, -0.6], m: 'blep' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  surprised: { e: 'wide', g: [0.2, -0.4], b: [-2, -2.2], m: 'o' },
  worried: { e: 'open', g: [0.4, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'cozy', 'hot', 'blow', 'proud', 'wash', 'dreamy', 'yawn', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A crescent moon (a glint): a disc with a bite out of it.
function crescent(ctx, x, y, r, col, tilt = -0.6) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI * 0.5, Math.PI * 0.5, false);
  ctx.bezierCurveTo(r * 0.55, r * 0.55, r * 0.55, -r * 0.55, 0, -r);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// One eye (head units): x, y its middle; o +1 the eye nearer its nose, -1 the other (its outer corner
// that way).
function eye(ctx, a, x, y, o, f) {
  const w = 4.4;
  const h = 5.4;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 0.8], [x, y - h * 1.1], [x + w, y + 0.8], 1.4, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.3], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.4], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3.2 : 2.6)], [x + w, y], 1.4, LASH);
    // (a little curl of lash at its outer corner)
    stroke3(ctx, a, [x + w * o, y], [x + (w + 1) * o, y - 0.2], [x + (w + 1.4) * o, y - 1.1], 0.9, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.07 : 1;
  ell(ctx, x, y, w * big, h * big);
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
    stroke3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.3], [x + w, y - h * 0.3], 1.4, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.5, 0.4];
  ctx.save();
  ell(ctx, x, y, w * big, h * big);
  ctx.clip();
  const ix = x + gx * 0.8;
  const iy = y + gy * 0.7 + 0.2;
  const ir = kind === 'wide' ? 0.86 : 1;
  const iw = w * 0.84 * ir;
  const ih = h * 0.86 * ir;
  // the iris: deep indigo at the top, lightening to periwinkle at the bottom, a ring of gold starlight
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.3, iw * 0.88, ih * 0.88);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.36, iw * 0.74, ih * 0.5);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.56, iw * 0.52, ih * 0.26);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix, iy + 0.2, iw * 0.78, ih * 0.8, 0, Math.PI * 0.2, Math.PI * 0.8);
  pen(ctx, tone(a, IRIS[4], 0.7), 0.45);
  ctx.stroke();
  ell(ctx, ix, iy - 0.2, iw * 0.42 * ir, ih * 0.46 * ir);
  ctx.fillStyle = tone(a, '#171436');
  ctx.fill();
  // glints: its crescent moon, and a little round one
  crescent(ctx, ix - 1.4, iy - 1.9, 1.55 * ir, '#ffffff', -0.5);
  ell(ctx, ix + 1.5, iy + 1.9, 0.6, 0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  // a neat lash line over the top, round at both ends, a little upturned wing at its outer corner
  stroke3(ctx, a, [x - w * 0.98, y - h * 0.1], [x, y - h * 1.36], [x + w * 0.98, y - h * 0.1], 1.25, LASH);
  stroke3(ctx, a, [x + w * 0.9 * o, y - h * 0.3], [x + (w + 0.9) * o, y - h * 0.42], [x + (w + 1.5) * o, y - h * 0.82], 0.95, LASH);
}
// Round fur brows (head units): short, full, round at both ends.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.4, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1 + (bo + bi) * 0.35, x + o * 2.4, y + bo * 0.7);
  pen(ctx, tone(a, STRIPE[0]), 1.7);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#7a3a62';
  const open = (w, h, teeth = false) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7e2e52');
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.58, h * 0.34);
    ctx.fillStyle = tone(a, '#ff9cb4');
    ctx.fill();
    if (teeth) {
      for (const d of [-0.55, 0.55]) {
        smooth(ctx, [[x + d - 0.5, y - 0.1], [x + d + 0.5, y - 0.1], [x + d + 0.45, y + 1], [x + d - 0.45, y + 1]]);
        ctx.fillStyle = tone(a, '#ffffff');
        ctx.fill();
      }
    }
  };
  const line = (pts, w = 0.75) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'smile':
      line([[x - 2, y - 0.3], [x - 1, y + 1.3], [x, y + 0.3], [x + 1, y + 1.3], [x + 2.2, y - 0.6]]);
      break;
    case 'open':
      open(2, 2.2);
      break;
    case 'grin':
      open(2.4, 2.2, true);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1, 1.2);
      ctx.fillStyle = tone(a, '#7e2e52');
      ctx.fill();
      break;
    case 'blow':
      ell(ctx, x + 0.6, y + 0.6, 0.8, 0.7);
      ctx.fillStyle = tone(a, '#7e2e52');
      ctx.fill();
      break;
    case 'shout':
      open(2.4, 2.8, true);
      break;
    case 'yawn':
      open(1.9, 3.4);
      break;
    case 'blep':
      line([[x - 2, y], [x, y + 0.6], [x + 2, y]], 0.75);
      ell(ctx, x + 0.4, y + 1.2, 0.9, 1.1);
      ctx.fillStyle = tone(a, '#ff8eaa');
      ctx.fill();
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
      ctx.fillStyle = tone(a, '#7e2e52');
      ctx.fill();
      break;
    case 'talkA':
      open(1.6, 1.9);
      break;
    case 'talkE':
      open(2, 1.1);
      break;
    default:
      // at rest: a small soft mouth, its far corner tucked up (a little smile it can't help)
      line([[x - 1.7, y + 0.1], [x - 0.8, y + 0.9], [x + 0.1, y + 0.4], [x + 1, y + 0.9], [x + 1.9, y - 0.3]], 0.72);
  }
}
// The skull: round, a little snout toward its nose.
const SKULL = [[-19, -1], [-17.6, -10.6], [-11.4, -17], [-2, -19.6], [8, -18.2], [15, -12.8], [19.2, -5.4], [22, 2.2], [21, 8.4], [15.4, 13.4], [5, 15.6], [-6, 15], [-14.4, 10.6]];
const MASK = [[0, 3], [5, -1.4], [12, -2.6], [18.6, -1], [22.4, 3], [21.6, 8.6], [15.6, 13.6], [6, 15.2], [-1.6, 12]];
function ear(ctx, a, mode, D, root, base, name, flat) {
  ctx.save();
  ctx.translate(...root);
  ctx.rotate(base + swingOf(a, name, 'head') * 0.85 - flat * 0.7);
  // a big round dish, its root sunk inside the skull
  smooth(ctx, [[-4.4, 2], [-7.6, -4], [-7, -11.4], [-2, -15.6], [4, -14.6], [7.6, -9.4], [7, -2.6], [3.8, 2.2]]);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -3, -12, 8, FUR[0], 0.8);
    ctx.restore();
    smooth(ctx, [[-2.6, 0], [-5, -4.6], [-4.4, -10.4], [-0.8, -13], [3.4, -12], [5.2, -7.8], [4.6, -2.6], [2, 0.4]]);
    ctx.fillStyle = tone(a, EAR_IN[0]);
    ctx.fill();
    ell(ctx, 0.6, -5.2, 2.4, 4.6, 0.1);
    ctx.fillStyle = tone(a, EAR_IN[1], 0.55);
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
  ear(ctx, a, mode, D, EAR_F, -0.55, 'earF', -flat);
  ear(ctx, a, mode, D, EAR_N, 0.28, 'earN', flat);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -4, -12, 17, FUR[0], 0.85);
    glow(ctx, -16, 10, 11, FUR[2], 0.65);
    // the cream face, soft at its edges
    smooth(ctx, MASK);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 12, 4, 8, CREAM[0], 0.9);
    // the navy stripe, from between its eyes up over its crown (wider over the crown, round ends)
    smooth(ctx, [[2.6, -5.2], [3.8, -9.4], [3.4, -15.6], [0.4, -21], [-4.8, -21.4], [-2.4, -15.2], [0.2, -9.4], [1.2, -5.2]]);
    ctx.fillStyle = tone(a, STRIPE[0]);
    ctx.fill();
    ctx.restore();
    // cheeks
    for (const [cx, cy, k] of [[-8.8, 6.6, 0.7], [11.4, 7, 1]]) {
      ell(ctx, cx, cy, 3, 1.8);
      ctx.fillStyle = tone(a, '#ff9cbc', 0.45 * k);
      ctx.fill();
    }
    eye(ctx, a, -5.4, -0.6, -1, f);
    eye(ctx, a, 8.8, -1, 1, f);
    brow(ctx, a, -5.6, -8.6, -1, f.b);
    brow(ctx, a, 9, -9, 1, f.b);
    // the nose: a soft rounded pink button with a glint
    const tw = q.sniff ? Math.sin((a.now ?? 0) * 30) * 0.3 : 0;
    smooth(ctx, [[18.6 + tw, 3.4], [21.6 + tw, 3], [22.4 + tw, 4.6], [20.6 + tw, 6.4], [18.8 + tw, 5.4]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 20.4 + tw, 3.8, 0.8, 0.45, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    mouth(ctx, a, 18.4, 9, f.m);
  }
  ctx.restore();
}

// ---------- Its body ----------
// Its tummy and pouch (in the waist's frame): a cream tummy, the pouch's soft lip, gold light inside.
function tummy(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const q = a.gl ?? {};
  const k = q.pouch ?? 0.6;
  ctx.save();
  enter(ctx, a, D, 'waistB');
  smooth(ctx, [[80, 97], [88, 96], [93.6, 102], [94.6, 112], [91, 121], [84, 123.6], [78.6, 120], [77, 108]]);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 90, 101, 9, CREAM[0], 0.85);
  glow(ctx, 80, 121, 8, CREAM[2], 0.7);
  ctx.restore();
  // the pouch: a soft round pocket of tummy, the light of the stars inside spilling from its lip
  ell(ctx, 86.4, 113.4, 6.4, 5.2);
  ctx.fillStyle = tone(a, CREAM[2], 0.55);
  ctx.fill();
  glow(ctx, 86.6, 109.6, 7 + k * 3, STAR[2], 0.25 + k * 0.45);
  ctx.beginPath();
  ctx.moveTo(80.2, 110.6);
  ctx.quadraticCurveTo(86.4, 112.6 + (q.pouchOpen ?? 0) * 2, 92.6, 109.8);
  pen(ctx, tone(a, CREAM[2]), 1.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(81, 110.2);
  ctx.quadraticCurveTo(86.4, 108.6 - k * 0.6, 92, 109.4);
  pen(ctx, tone(a, STAR[1], 0.35 + k * 0.5), 1.1);
  ctx.stroke();
  ctx.restore();
}
// The long bushy tail: one smooth plume through points on its two springy halves, hanging back from its
// rump and hooking up behind; the tip navy with a twinkle.
const TAIL_PTS_A = [[73.4, 112], [66, 122], TAIL_B];
const TAIL_PTS_B = [[48, 138.6], [39.6, 135], [35.4, 125.6], [37, 117]];
const TAIL_W = [9, 15, 18, 19, 18.4, 16, 12];
function spline(pts, n = 6) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// A soft ribbon round a centre line (widths at each control point, eased between), a round cap at its
// end.
function ribbon(ctx, pts, widths, n = 6) {
  const c = spline(pts, n);
  const ws = c.map((_, i) => {
    const u = (i / (c.length - 1)) * (widths.length - 1);
    const j = Math.min(widths.length - 2, Math.floor(u));
    return mix(widths[j], widths[j + 1], sstep(u - j)) / 2;
  });
  const L = [];
  const Rr = [];
  for (let i = 0; i < c.length; i++) {
    const p = c[Math.max(0, i - 1)];
    const q = c[Math.min(c.length - 1, i + 1)];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    L.push([c[i][0] + nx * ws[i], c[i][1] + ny * ws[i]]);
    Rr.push([c[i][0] - nx * ws[i], c[i][1] - ny * ws[i]]);
  }
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
  // (a round cap, swept round the outside of its end)
  const e = c[c.length - 1];
  const pe = c[c.length - 2];
  const ang = Math.atan2(L[L.length - 1][1] - e[1], L[L.length - 1][0] - e[0]);
  const out = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
  const ccw = Math.cos(ang - Math.PI / 2 - out) > 0;
  ctx.arc(e[0], e[1], ws[ws.length - 1], ang, ang + (ccw ? -Math.PI : Math.PI), ccw);
  for (const p of Rr.reverse()) ctx.lineTo(...p);
  ctx.closePath();
  return c;
}
function tail(ctx, a, mode, D) {
  // (the plume's points, the rig's space, game px)
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const ws = TAIL_W.map((w) => w * D.SC * (a.gl?.tailPuff ?? 1));
  const c = ribbon(ctx, pts, ws);
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // lit along its top, shaded underneath, its navy tip
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] - 0.6, c[i][1] - 1.4, 3.4, FUR[0], 0.5);
  for (let i = 1; i < c.length; i += 3) glow(ctx, c[i][0] + 0.8, c[i][1] + 1.8, 3, FUR[2], 0.45);
  const tip = c[c.length - 1];
  const pre = c[c.length - 8];
  ell(ctx, tip[0] + (tip[0] - pre[0]) * 0.1, tip[1] + (tip[1] - pre[1]) * 0.1, 4.2, 4.2);
  ctx.fillStyle = tone(a, STRIPE[0]);
  ctx.fill();
  glow(ctx, mix(tip[0], pre[0], 0.6), mix(tip[1], pre[1], 0.6), 3.2, STRIPE[0], 0.7);
  ctx.restore();
}
// Its gliding skin, from shoulder along the arm to the wrist, across to the ankle and up its flank;
// `open` 0 (folded away) .. 1 (spread taut): the free edge eased in toward its body as it folds.
function skinPts(a, D, k) {
  const S0 = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const W = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const A = ptOf(a, D, `foot${k}`, D.J[`ank${k}`]);
  const P = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  return { S0, E, W, A, P };
}
function membrane(ctx, a, mode, D, k) {
  const open = (k === 'N' ? a.gl?.wingN : a.gl?.wingF) ?? 0;
  if (open < 0.02) return;
  const { S0, E, W, A, P } = skinPts(a, D, k);
  const o = sstep(open);
  const Wp = [mix(E[0], W[0], sstep(open * 1.6)), mix(E[1], W[1], sstep(open * 1.6))];
  const Ap = [mix(P[0], A[0], o * 0.85 + 0.15), mix(P[1], A[1], o * 0.85 + 0.15)];
  const body = [(S0[0] + P[0]) / 2, (S0[1] + P[1]) / 2];
  const mid = [(Wp[0] + Ap[0]) / 2, (Wp[1] + Ap[1]) / 2];
  // (the free edge sags in toward its body, two soft scallops)
  const c1 = [mix(body[0], mix(Wp[0], mid[0], 0.5), 0.35 + o * 0.6), mix(body[1], mix(Wp[1], mid[1], 0.5), 0.35 + o * 0.6)];
  const m1 = [mix(body[0], mid[0], 0.3 + o * 0.62), mix(body[1], mid[1], 0.3 + o * 0.62)];
  const c2 = [mix(body[0], mix(mid[0], Ap[0], 0.5), 0.35 + o * 0.6), mix(body[1], mix(mid[1], Ap[1], 0.5), 0.35 + o * 0.6)];
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...S0);
    ctx.lineTo(...E);
    ctx.lineTo(...Wp);
    ctx.quadraticCurveTo(...c1, ...m1);
    ctx.quadraticCurveTo(...c2, ...Ap);
    ctx.lineTo(...P);
    ctx.closePath();
  };
  path();
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, k === 'N' ? MEM[0] : MEM[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, body[0], body[1], 9, k === 'N' ? MEM[1] : MEM[2], 0.55);
  // its cream rim along the free edge
  ctx.beginPath();
  ctx.moveTo(...Wp);
  ctx.quadraticCurveTo(...c1, ...m1);
  ctx.quadraticCurveTo(...c2, ...Ap);
  pen(ctx, tone(a, CREAM[1], 0.9), 1.3);
  ctx.stroke();
  ctx.restore();
  // its star freckles, twinkling slowly (spread with the skin)
  if (k === 'N' && o > 0.55) {
    const t = a.now ?? 0;
    for (const [u, v, ph] of [[0.55, 0.72, 0], [0.75, 0.6, 1.7], [0.4, 0.86, 3.1], [0.85, 0.82, 4.4]]) {
      const x = mix(mix(S0[0], Wp[0], u), mix(P[0], m1[0], u), v);
      const y = mix(mix(S0[1], Wp[1], u), mix(P[1], m1[1], u), v);
      sparkle(ctx, x, y, (0.55 + 0.25 * Math.sin(t * 2.1 + ph)) * (o - 0.55) / 0.45, 1, STAR[1]);
    }
  }
}

// ---------- Its stars (rig space, game px) ----------
// A star: five round-tipped points, gold, a soft glow round it, a cream heart.
function goldStar(ctx, a, x, y, r, ang, al = 1, glowK = 1) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  if (glowK > 0) glow(ctx, x, y, r * 2.6, STAR[2], 0.4 * glowK);
  ctx.translate(x, y);
  ctx.rotate(ang);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.52 : r;
    pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
  }
  smooth(ctx, pts.map(([px, py], i) => (i % 2 ? [px, py] : [px * 1.08, py * 1.08])));
  pen(ctx, STAR_INK, Math.max(0.35, r * 0.2));
  ctx.stroke();
  ctx.fillStyle = STAR[2];
  ctx.fill();
  ell(ctx, -r * 0.1, -r * 0.12, r * 0.34, r * 0.28);
  ctx.fillStyle = STAR[0];
  ctx.fill();
  ctx.restore();
}
// Stardust: a soft round glowing mote, never a speck.
function mote(ctx, x, y, r, al, col = STAR[1]) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.4, col, 0.5);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = STAR[0];
  ctx.fill();
  ctx.restore();
}
// A soft white puff of breath.
function breath(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const pass of ['line', 'fill']) {
    for (const [dx, dy, k] of [[0, 0, 1], [r * 0.8, -r * 0.3, 0.7], [-r * 0.5, -r * 0.5, 0.6]]) {
      ell(ctx, x + dx, y + dy, r * k, r * k * 0.86);
      if (pass === 'line') {
        pen(ctx, '#cdd0ea', 0.6);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { catch: 8.6, groom: 6.8, stargaze: 7.0, practice: 7.6 };
const ORDER = ['catch', 'groom', 'stargaze', 'practice'];
const POOL = ['swoop', 'toss', 'twirl'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, pouch: 0.55 + Math.sin(t * 1.3) * 0.1, pouchOpen: 0, earF: 0, earN: 0, earFlat: 0, tailRot: 0, tailCurl: 0, tailPuff: 1, wingN: 0, wingF: 0, sniff: false, held: null, fall: -1, puffs: 0, trace: -1, zz: 0, sweat: -1, trail: 0, swoopS: -1, tossW: 0, tossS: -1, ring: -1, pop: -1, sit: 0, tadaS: -1 };
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
  const alive = m.hp > 0;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  // (feet carried along with the body when it lunges: `x` in heights, feet in leg lengths)
  const toLeg = (c.H ?? 36) / Math.max(1, c.leg ?? 9.8);
  // Standing: light on its feet, paws held loosely up at its chest (a glider's way), a slow breath;
  // walking, the paws swing a little and the tail sways as a rudder.
  const br = c.breath ?? 0;
  go({ shN: -24 + br * 2, elN: -74, hwN: -10, shF: -18 + br * 1.5, elF: -70, hwF: -8, tilt: 3 + walking * 3, head: -2, chest: -br * 0.6 }, 1);
  q.tailRot = Math.sin(t * 0.7) * 0.06 + Math.sin((a.blkidU ?? t) * TAU) * 0.08 * walking;
  q.tailCurl = Math.sin(t * 0.55 + 1) * 0.05;
  q.earF = Math.sin(t * 0.5) * 0.04;
  q.earN = Math.sin(t * 0.43 + 2) * 0.04;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.glWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.glAtk) {
      const pool = m.def.moves ?? POOL;
      st.glN = (st.glN ?? m.uid ?? 0) + 1;
      st.glMove = m.move ?? pool[st.glN % pool.length];
    }
    st.glAtk = true;
  } else st.glAtk = false;
  const mvName = st.glAtk ? st.glMove : null;
  const hadWind = now - (st.glWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.22 ? sstep(since / 0.22) : 1;
      s = since - 0.22;
    } else W = 1;
  }
  const busy = Boolean(mvName) || !alive;
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.glCalm = mix(st.glCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.glCalm);
  let PC = st.glPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.glOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.glOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.glOrd = (st.glOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.glPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let sit = 0;

  if (k > 0.001 && piece === 'catch') {
    // its ears perk; it looks up: a star falling
    const look = win(pu, 0, 0.5, 2.0, 2.2);
    go({ head: -14, neckR: -4, chest: -3 }, look * k);
    q.earF += 0.25 * look * k;
    q.earN += -0.25 * look * k;
    say('up', look * k);
    if (pu > 0.4 && pu < 2.6) q.fall = pu - 0.4;
    // a crouch, then a hop with both arms up and its skin spread: caught!
    const crouch = win(pu, 1.7, 2.0, 2.05, 2.2);
    go({ lift: -0.07, tilt: 8, head: -6, shN: -10, shF: -6 }, crouch * k);
    if (pu >= 2.15 && pu <= 2.85) {
      const v = (pu - 2.15) / 0.7;
      add({ hop: Math.sin(Math.PI * v) * 0.22 }, k);
      go({ shN: -168, elN: -16, shF: -160, elF: -14, head: -16, tilt: -6, fyN: 0.2 * Math.sin(Math.PI * v), fyF: 0.26 * Math.sin(Math.PI * v), toeN: 14, toeF: 10 }, k * sstep(v / 0.2) * (1 - sstep((v - 0.8) / 0.2)));
      q.wingN = Math.max(q.wingN, Math.sin(Math.PI * v) * k);
      q.wingF = Math.max(q.wingF, Math.sin(Math.PI * v) * k);
      say('wonder', k);
    }
    // landing, then hot! hot!: juggled paw to paw, blown on
    go({ lift: -0.05, tilt: 4 }, win(pu, 2.8, 2.9, 3.0, 3.2) * k);
    const hot = win(pu, 2.95, 3.1, 4.4, 4.6);
    const j = Math.sin((pu - 3.0) * 13);
    go({ shN: -70 - j * 14, elN: -80, hwN: -20, shF: -64 + j * 14, elF: -84, hwF: -20, head: 4 }, hot * k);
    add({ lift: Math.abs(j) * 0.012 }, hot * k);
    say(Math.sin((pu - 3.0) * 6.5) > 0 ? 'hot' : 'blow', hot * k);
    if (hot > 0.3) q.held = { hand: j > 0 ? 'N' : 'F', hot: true, jug: j };
    if (pu > 3.3 && pu < 4.5) q.puffs = hot * k;
    // tucked into its pouch, which glows brighter; a proud pat
    const tuck = win(pu, 4.5, 4.8, 5.3, 5.6);
    go({ shN: 6, elN: -96, hwN: -40, head: 12, neckR: 3 }, tuck * k);
    if (tuck > 0.3 && pu < 5.1) q.held = { hand: 'N' };
    q.pouchOpen = Math.max(q.pouchOpen, tuck * k);
    say('focus', tuck * k);
    q.pouch += 0.6 * sstep((pu - 5.0) / 0.4) * (1 - sstep((pu - 7.2) / 1.2)) * k;
    const pat = win(pu, 5.5, 5.7, 6.8, 7.1);
    go({ shN: -10, elN: -86, hwN: -30 + Math.sin(pu * 16) * 14, head: 4 }, pat * k);
    say('proud', win(pu, 5.4, 5.5, 7.0, 7.2) * k);
    const wig = win(pu, 7.0, 7.2, 8.1, 8.5);
    add({ pelvis: Math.sin(pu * 15) * 4 * wig, chest: -Math.sin(pu * 15) * 3 * wig, head: Math.sin(pu * 15 - 0.6) * 3 * wig }, k);
    q.tailRot += Math.sin(pu * 15) * 0.2 * wig * k;
    say('happy', wig * k);
  }
  if (k > 0.001 && piece === 'groom') {
    // both paws circling over its face
    const wash = win(pu, 0.2, 0.6, 2.4, 2.7);
    const cyc = Math.sin(pu * 9);
    go({ shN: -96 + cyc * 10, elN: -116, hwN: -20, shF: -90 - cyc * 10, elF: -118, hwF: -20, head: 8 + cyc * 3, neckR: 2 }, wash * k);
    say('wash', wash * k);
    // the tail pulled round in front and combed
    const comb = win(pu, 2.6, 3.1, 5.0, 5.4);
    q.tailRot += 1.25 * comb * k;
    q.tailCurl += 0.9 * comb * k;
    go({ head: 16, neckR: 5, tilt: 6, shN: -30 + Math.sin(pu * 7) * 18, elN: -60, shF: -24 - Math.sin(pu * 7) * 18, elF: -60 }, comb * k);
    say('cozy', comb * k);
    // a fluff and a shake, nose to tail tip
    const sh = win(pu, 5.3, 5.45, 6.0, 6.3);
    add({ chest: Math.sin(pu * 34) * 4 * sh, head: Math.sin(pu * 34 - 0.6) * 6 * sh, pelvis: -Math.sin(pu * 34) * 3 * sh }, k);
    q.tailPuff = 1 + 0.25 * sh * k;
    q.earF += Math.sin(pu * 34) * 0.3 * sh * k;
    q.earN -= Math.sin(pu * 34) * 0.3 * sh * k;
    say('shut', sh * k);
    say('proud', win(pu, 6.2, 6.3, 6.7, 6.8) * k);
  }
  if (k > 0.001 && piece === 'stargaze') {
    // sat back on its haunches, looking up
    sit = Math.max(sit, win(pu, 0.2, 0.9, 6.2, 6.9) * k);
    const up = win(pu, 0.6, 1.1, 6.0, 6.6);
    go({ head: -18, neckR: -5, chest: -4 }, up * k);
    say('up', up * k);
    // a finger tracing a constellation: up, across, down, across (its stars light as it goes)
    const tr = win(pu, 1.4, 1.8, 4.6, 5.0);
    const u = clamp((pu - 1.8) / 2.8, 0, 1);
    const path = [[-150, -10], [-170, 10], [-150, 30], [-128, 14], [-140, -6]];
    const seg = Math.min(path.length - 2, Math.floor(u * (path.length - 1)));
    const v = sstep(u * (path.length - 1) - seg);
    go({ shN: mix(path[seg][0], path[seg + 1][0], v), elN: mix(path[seg][1], path[seg + 1][1], v) - 20, hwN: -30 }, tr * k);
    if (tr > 0.05) q.trace = u;
    q.traceK = tr * k;
    say('trace', tr * k);
    // a dreamy sigh
    const sigh = win(pu, 4.8, 5.1, 6.2, 6.6);
    add({ chest: -Math.sin(Math.PI * clamp((pu - 4.9) / 1.3, 0, 1)) * 5 }, k);
    say('dreamy', sigh * k);
    if (pu > 4.6 && pu < 7) q.trace = 1;
    q.traceFade = 1 - sstep((pu - 5.6) / 1.2);
  }
  if (k > 0.001 && piece === 'practice') {
    // a big stretch, skin wide, and a yawn
    const str = win(pu, 0.1, 0.6, 1.6, 2.0);
    go({ shN: -150, elN: -8, shF: -140, elF: -8, chest: -6, head: -8, lift: 0.015 }, str * k);
    q.wingN = Math.max(q.wingN, str * 0.8 * k);
    q.wingF = Math.max(q.wingF, str * 0.8 * k);
    say('yawn', win(pu, 0.4, 0.6, 1.6, 1.8) * k);
    // a pretend glide: leaning out on one foot, arms wide
    const gl = win(pu, 2.2, 2.7, 4.6, 4.9);
    const wob = win(pu, 3.6, 3.8, 4.7, 4.9);
    go({ tilt: 22 + Math.sin(pu * 11) * 8 * wob, head: -12, shN: -96 + Math.sin(pu * 12) * 30 * wob, elN: -4, shF: -84 - Math.sin(pu * 12) * 30 * wob, elF: -4, fyF: 0.35, fxF: -0.5, toeF: -20, x: 0.03 }, gl * k);
    q.wingN = Math.max(q.wingN, gl * k);
    q.wingF = Math.max(q.wingF, gl * k);
    q.tailRot += -0.35 * gl * k;
    say(wob > 0.4 ? 'wobbly' : 'whee', gl * k);
    // it catches its balance, sheepish; then a ta-da
    const back = win(pu, 4.8, 5.0, 5.6, 5.8);
    go({ shN: -30, elN: -110, hwN: -20, head: 6 }, back * k);
    say('sheepish', back * k);
    const ta = win(pu, 5.8, 6.1, 7.0, 7.5);
    go({ shN: -140, elN: -20, hwN: -30, tilt: -4, head: -6, chest: -3, fxN: 0.25, toeN: 10 }, ta * k);
    q.wingN = Math.max(q.wingN, ta * 0.55 * k);
    say('tada', ta * k);
    if (pu > 5.95 && pu < 7.3) q.tadaS = pu - 5.95;
  }

  // (its own marks over its head)
  if (fighting && alive && !st.glHunt) st.glBangAt = now;
  if (!fighting && st.glHunt && alive) st.glLostAt = now;
  st.glHunt = fighting && alive;
  q.bang = now - (st.glBangAt ?? -9);
  q.huh = now - (st.glLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: crouched, ears forward, arms half out -----
  if (fighting && alive && !hurt) {
    go({ tilt: 10, head: 6, lift: -0.03, shN: -70, elN: -40, shF: -60, elF: -40 }, 1 - walking * 0.5);
    q.wingN = Math.max(q.wingN, 0.3);
    q.wingF = Math.max(q.wingF, 0.3);
    q.earF += 0.2;
    q.earN -= 0.2;
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.1) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'swoop') {
      // a crouch, arms flung up, its skin opening wide
      go({ lift: -0.08, tilt: 16, head: -8, shN: -150, elN: -10, shF: -142, elF: -10, fyF: 0.05 }, wu);
      q.wingN = Math.max(q.wingN, wu);
      q.wingF = Math.max(q.wingF, wu);
      q.tailRot -= 0.3 * wu;
      say('focus', W);
      // then the swoop: low and fast at you, in a long glide, and a skip back
      if (s >= 0) {
        const out1 = sstep(s / 0.22);
        const back = sstep((s - 0.5) / 0.4);
        const xx = 0.62 * out1 * (1 - back);
        const hop = Math.sin(Math.PI * clamp(s / 0.42, 0, 1)) * 0.12 + Math.sin(Math.PI * clamp((s - 0.5) / 0.4, 0, 1)) * 0.06;
        const glide = win(s, 0, 0.06, 0.38, 0.5);
        go({ x: xx, tilt: 34, head: -14, shN: -96, elN: -2, shF: -84, elF: -2, fyN: 0.4, fxN: xx * toLeg - 0.4, fyF: 0.5, fxF: xx * toLeg - 0.6, toeN: -24, toeF: -24 }, glide * sw);
        go({ x: xx, fxN: xx * toLeg, fxF: xx * toLeg }, (1 - glide) * sw);
        add({ hop }, sw);
        q.wingN = Math.max(q.wingN, glide * sw);
        q.wingF = Math.max(q.wingF, glide * sw);
        q.tailRot -= 0.5 * glide * sw;
        q.trail = glide * sw;
        q.swoopS = s;
        say('shout', win(s, 0, 0.04, 0.32, 0.4));
        say('happy', win(s, 0.45, 0.5, 0.8, 0.9));
      }
    } else if (mvName === 'toss') {
      // a paw into its pouch, a star pulled out, juggled hot; then wound back over its shoulder
      const dip = win(W, 0, 0.25, 0.4, 0.55);
      go({ shN: 8, elN: -100, hwN: -40, head: 12 }, dip * (1 - snap));
      q.pouchOpen = Math.max(q.pouchOpen, dip);
      const back = sstep((W - 0.5) / 0.4) * (1 - snap);
      const j = Math.sin(now * 16);
      go({ shN: 36, elN: -120, hwN: -30, tilt: -8, head: -4, x: -0.03, shF: -60 + j * 8, elF: -70 }, back);
      say(W < 0.45 ? 'focus' : 'hot', W);
      if (W > 0.35 && s < 0) q.held = { hand: 'N', hot: W > 0.5 };
      q.tossW = W;
      go({ shN: -130, elN: -20, tilt: 12, head: 4, x: 0.04, shF: 10, elF: -40 }, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      if (s >= 0) q.tossS = s;
      q.pouch -= 0.15 * Math.max(sstep(W), snap);
    } else {
      // its back half turned, the tail fluffed up high; then a spin, the tail whipping round
      go({ tilt: -6, head: -10, neckR: -4, lift: -0.05, shN: -40, elN: -90, shF: -30, elF: -90 }, wu);
      q.tailRot += -0.9 * wu;
      q.tailCurl += 0.6 * wu;
      q.tailPuff = 1 + 0.3 * wu;
      say('focus', W);
      if (s >= 0) {
        const spin = s < 0.42;
        q.twirl = spin && Math.floor(s / 0.105) % 2 === 1;
        q.tailRot += (spin ? Math.sin(s * 30) * 0.9 : 0) * sw;
        q.tailPuff = Math.max(q.tailPuff, 1 + 0.3 * sw);
        add({ hop: Math.sin(Math.PI * clamp(s / 0.42, 0, 1)) * 0.05 }, sw);
        go({ shN: -100, elN: -20, shF: -90, elF: -20, tilt: 6 }, win(s, 0, 0.05, 0.38, 0.5) * sw);
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
        q.ring = s;
      }
    }
  }
  // ----- Hurt: a wince, ears flat back, a star jumping out of its pouch -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -70, elN: -110, shF: -60, elF: -110, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.tailPuff = Math.max(q.tailPuff, 1 + 0.25 * kh);
    q.pop = ago;
  }
  // ----- After landing a hit: a cheeky pat of its pouch -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 0.8, 1.1) * (1 - moveW);
    go({ shN: -8, elN: -90, hwN: -30 + Math.sin(gl * 16) * 12, head: -4, chest: -3 }, kg);
    say('cheeky', kg);
  }
  // ----- A nap (its habitat): sat down, its tail wrapped round its front like a blanket -----
  st.glNap = mix(st.glNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.glNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 20 + Math.sin(now * 1.5) * 3, neckR: 5, shN: -40, elN: -90, shF: -36, elF: -90 }, nw);
    q.tailRot += 1.3 * nw;
    q.tailCurl += 1.0 * nw;
    q.pouch -= 0.3 * nw;
    q.earFlat = Math.max(q.earFlat, 0.4 * nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // sat down: back on its haunches, legs out in front
  if (sit > 0.001) go({ lift: -0.2 + Math.sin(now * 1.4) * 0.006, tilt: -8, fxN: 0.4, fyN: 0.06, fxF: 0.34, fyF: 0.05, toeN: -14, toeF: -14 }, sit);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.pouch = 0.15;
    q.earFlat = 0.6;
  }
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.glFace) {
    st.glFaceFrom = st.glFace;
    st.glFace = f;
    st.glFaceAt = now;
  }
  const since0 = now - (st.glFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.glFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.glFaceFrom) && !(talky(f) && talky(st.glFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.61) % 4.3;
  if (bl < 0.12 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  // (everything soft eased, so nothing snaps)
  for (const key of ['pouch', 'pouchOpen', 'earFlat', 'wingN', 'wingF', 'tailPuff', 'tailRot', 'tailCurl', 'earF', 'earN']) {
    st[`gl_${key}`] = mix(st[`gl_${key}`] ?? q[key], q[key], ease(key.startsWith('wing') ? 16 : key.startsWith('tail') ? 9 : 12));
    q[key] = st[`gl_${key}`];
  }
  q.sit = sit;
  q.calm = cw;
  st.glTwirl = Boolean(q.twirl);
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
function zee(ctx, x, y, s, al, fl = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl ? -s : s, s);
  ctx.beginPath();
  ctx.moveTo(-1.6, -1.6);
  ctx.quadraticCurveTo(0, -1.9, 1.6, -1.6);
  ctx.quadraticCurveTo(0, 0, -1.6, 1.6);
  ctx.quadraticCurveTo(0, 1.3, 1.7, 1.6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#6a6eaa';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f2f2ff';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02 || e < 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      pen(ctx, INK, 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#6a6eaa';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.5, -1.8);
    ctx.quadraticCurveTo(-1.2, -3.6, 0.4, -3.4);
    ctx.quadraticCurveTo(2, -3, 1.4, -1.4);
    ctx.quadraticCurveTo(0.4, -0.6, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.4, 0.85, 0.85);
  ctx.fill();
  ctx.restore();
}
// The constellation it traces in the air (rig space, over its head): four stars joined by soft lines.
const CONST = [[10, -58], [18, -64], [27, -59], [22, -52]];

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const [px, py] = ptOf(a, D, 'waistB', [86.4, 111]);
  const handPt = (k) => ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  // the falling star: streaking down from up and ahead into its reach
  if ((q.fall ?? -1) >= 0) {
    const u = clamp(q.fall / 1.9, 0, 1);
    const [hx, hy] = headAt(a, D, [4, -34]);
    const x = mix(hx + 22, hx + 2, sstep(u));
    const y = mix(hy - 20, hy + 2, u);
    for (let i = 1; i <= 5; i++) mote(ctx, x + i * 2.6, y - i * 2.8, 0.7 - i * 0.1, (1 - i / 6) * 0.9);
    goldStar(ctx, a, x, y, 1.9, u * 6, 1);
  }
  // the star in its paws
  if (q.held) {
    let [hx, hy] = handPt(q.held.hand);
    if (q.held.jug !== undefined) {
      // (juggled: tossed in an arc from paw to paw, never jumping between them)
      const [nx, ny] = handPt('N');
      const [fx0, fy0] = handPt('F');
      const u = 0.5 + 0.5 * q.held.jug;
      hx = mix(fx0, nx, u);
      hy = mix(fy0, ny, u) - (1 - q.held.jug * q.held.jug) * 5;
    }
    goldStar(ctx, a, hx, hy - 1.6, 1.8, Math.sin(t * 3) * 0.3, 1, q.held.hot ? 1.3 : 1);
  }
  // blowing on its hot paws
  if ((q.puffs ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [22, 9]);
    for (let i = 0; i < 2; i++) {
      const f = (t * 1.6 + i * 0.5) % 1;
      breath(ctx, mx + 2 + f * 5, my + f * 3, 0.9 + f * 0.6, q.puffs * Math.sin(Math.PI * f) * 0.9);
    }
  }
  // a warm glow and a couple of motes rising off its pouch now and then
  const glowK = q.pouch ?? 0.55;
  for (let i = 0; i < 2; i++) {
    const P = 2.6 + i * 0.9;
    const f = (((t + i * 1.3) % P) + P) % P / P;
    if (f < 0.6) mote(ctx, px - 2 + i * 4 + Math.sin(f * 7 + i) * 1.2, py - 1 - f * 12, 0.45, glowK * 0.7 * Math.sin(Math.PI * (f / 0.6)));
  }
  // the constellation it traces: each star lit as its finger reaches it, lines between
  if ((q.trace ?? -1) >= 0) {
    const fade = (q.traceFade ?? 1) * (q.calm ?? 1);
    const n = CONST.length;
    const reach = q.trace * (n - 1);
    ctx.save();
    ctx.globalAlpha *= fade * 0.6;
    pen(ctx, STAR[1], 0.5);
    ctx.setLineDash([1, 1.2]);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (i > reach + 0.001) break;
      const p = CONST[i];
      if (i === 0) ctx.moveTo(...p);
      else {
        const v = clamp(reach - (i - 1), 0, 1);
        const pr = CONST[i - 1];
        ctx.lineTo(mix(pr[0], p[0], v), mix(pr[1], p[1], v));
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    for (let i = 0; i < n; i++) {
      const v = clamp((reach - i + 0.4) / 0.4, 0, 1);
      if (v > 0) sparkle(ctx, CONST[i][0], CONST[i][1], (1 + 0.3 * Math.sin(t * 3 + i)) * v, fade, STAR[1]);
    }
  }
  // ----- Glide Swoop: a trail of stardust streaming off its skin and tail -----
  if ((q.trail ?? 0) > 0.05) {
    const [cx, cy] = ptOf(a, D, 'chest', D.J.ribs);
    for (let i = 0; i < 7; i++) {
      const f = (t * 3 + i / 7) % 1;
      mote(ctx, cx - 4 - f * 18, cy - 2 + Math.sin(i * 2.1) * 4 + f * 3, 0.7 * (1 - f), q.trail * (1 - f));
    }
    // soft whoosh arcs over and under it
    ctx.save();
    ctx.globalAlpha *= q.trail * 0.55;
    ctx.lineCap = 'round';
    for (const [dy, r] of [[-6, 10], [6, 8]]) {
      ctx.beginPath();
      ctx.arc(cx - 8, cy + dy, r, dy < 0 ? 1.2 : -1.9, dy < 0 ? 1.9 : -1.2);
      pen(ctx, '#ffffff', 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }
  // ----- Star Toss: lobbed in an arc, bursting in sparkles where it lands -----
  if ((q.tossS ?? -1) >= 0 && q.tossS < 1.0) {
    const s = q.tossS;
    if (!a.mo.glToss || s < 0.03) a.mo.glToss = handPt('N');
    const [ox, oy] = a.mo.glToss;
    const u = clamp(s / 0.5, 0, 1);
    const x = mix(ox, 34, u);
    const y = mix(oy, -4, u) - Math.sin(Math.PI * u) * 14;
    if (u < 1) {
      for (let i = 1; i <= 4; i++) mote(ctx, x - i * 2.4 * (1 - u * 0.3), y + i * 0.9 - Math.sin(Math.PI * u) * i * 0.6, 0.6 - i * 0.1, 1 - i / 5);
      goldStar(ctx, a, x, y, 2, u * 10, 1, 1.3);
    } else {
      const v = clamp((s - 0.5) / 0.45, 0, 1);
      glow(ctx, 34, -5, 12 * (1 - v * 0.5), STAR[2], 0.55 * (1 - v));
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI + (i / 5) * Math.PI;
        goldStar(ctx, a, 34 + Math.cos(an) * v * 10, -5 + Math.sin(an) * v * 8 + v * v * 6, 0.9 * (1 - v), an, 1 - v, 0.6);
      }
      sparkle(ctx, 34, -7, 3.2 * Math.sin(Math.PI * v), 1, '#ffffff');
    }
  } else a.mo.glToss = null;
  // ----- Tail Twirl: a ring of stardust whipped round it, low -----
  if ((q.ring ?? -1) >= 0 && q.ring < 0.9) {
    const s = q.ring;
    const u = clamp(s / 0.7, 0, 1);
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + s * 9;
      const r = 6 + sstep(u) * 22;
      mote(ctx, Math.cos(an) * r + 4, -5 + Math.sin(an) * r * 0.24, 0.7, (1 - u) * (Math.sin(an) > -0.2 ? 1 : 0.55));
    }
    sparkle(ctx, 4 + sstep(u) * 26, -6, 2.4 * Math.sin(Math.PI * u), 1, STAR[1]);
  }
  // ta-da: sparkles round its raised paw
  if ((q.tadaS ?? -1) >= 0) {
    const [hx, hy] = handPt('N');
    for (let i = 0; i < 4; i++) {
      const f = clamp(q.tadaS * 1.3 - i * 0.18, 0, 1);
      const an = -Math.PI / 2 + (i - 1.5) * 0.9;
      sparkle(ctx, hx + Math.cos(an) * (3 + f * 5), hy + Math.sin(an) * (3 + f * 5), (i % 2 ? 1.1 : 1.6) * Math.sin(Math.PI * f), 1, i % 2 ? STAR[1] : '#ffffff');
    }
  }
  // hurt: a star jumps out of its pouch and drops back in
  if ((q.pop ?? -1) >= 0 && q.pop < 0.6) {
    const e = q.pop / 0.6;
    goldStar(ctx, a, px + e * 3, py - 2 - Math.sin(Math.PI * e) * 9, 1.4, e * 5, 1 - sstep((e - 0.8) / 0.2));
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-16, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [14, -26]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [14, -40]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, bx - 4 + e * 4, by + 8 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, STAR[1]);
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'starglider',
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: LW },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    // (its tail, then its gliding skin behind its body: only what spreads out past its outline shows,
    // between its arms and its legs)
    torso: (ctx, a, mode, S, D) => {
      tail(ctx, a, mode, D);
      membrane(ctx, a, mode, D, 'F');
      membrane(ctx, a, mode, D, 'N');
    },
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => tummy(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('glider', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Tail Twirl: clean mirror flips at each half turn, never a squeeze)
  const st = a.mo?.rig;
  const flip0 = a.flip;
  if (st?.glTwirl && m.hp > 0) a.flip = !a.flip;
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
export const STAR_GLIDER_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const STAR_GLIDER_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
