// The Usher Otter (2026-11-27, the Dream Theatre's Chorus Flamingo remade from scratch as a new creature;
// the id stays `chorusgirl`). The Grand Lobby's usherette: a sleek little river otter in the theatre's
// wine-red uniform, who has shown ten thousand people to their seats and has never once seen the end of
// a play, because someone is always rustling a sweet wrapper in row F. Torch in paw, a "shh" always
// ready. On its own copy of the creature base (rig.js; body.js `otter`: a long supple body, short legs,
// short arms), dressed here; its head, tail, uniform and torch drawn here from scratch over the
// mannequin (never the shared face, never the hero).
//   look    glossy cocoa fur, a cream face, chin and throat; a broad flat otter head with small round
//           ears set low, puffy cream whisker pads and a big soft cocoa nose; a thick tapering tail
//           (two springy halves). Its uniform is worn: the body's own skin in wine-red is the jacket
//           and its sleeves and the trousers (cut from its outline, folding with every pose), with a
//           stand-up gold-edged collar, three gold frogging braids across the chest with brass
//           buttons, gold cuffs, a gold stripe down the trouser leg; a tiny wine pillbox hat with a
//           gold band, pinned on at a jaunty tilt; its paws and webbed feet its own fur. A little
//           brass torch in its near paw. Its own soft plum-brown outline, outer edge only, face bare.
//   eyes    its own "lamplit button" eyes: nearly round, a big conker-brown iris that fills most of
//           the eye (a thin warm white rim round it), a deep pupil, and its glint a soft rounded
//           square like the reflection of a torch, with a small round one under it; a short neat
//           lash line with one round flick. Cream tuft brows do the acting. An otter's "w" mouth.
//   walk    the base's walk at an usher's brisk, upright pace, the torch carried low, the tail
//           swaying as a counterweight.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - tickets (7.4 s): a ticket from its pocket, torn in two (the stub flutters down); offered
//             with a little bow ... to nobody; a look left and right; tucked away, sheepish;
//           - torch (6.6 s): click: the torch on, its soft beam swept slowly along the floor; it finds
//             something (a dropped sweet wrapper?); "shh!" a finger to its lips at the culprit; click;
//           - spruce (6.4 s): the hat set straight, the jacket brushed down, a paw licked and the fur
//             smoothed over its head the way otters groom; a swish of its tail;
//           - juggle (7.6 s): three wrapped humbugs from its pocket, juggled in a cascade the way
//             otters juggle pebbles; caught, one popped in its mouth, a happy crunch.
//   moves   Shush (a finger to its lips, a deep breath; then it leans right in, SHHH, a soft hush wave
//           rolling out ahead); Torch Flash (the torch raised over its shoulder, a squint; then
//           thrust out, a bright soft cone of light flaring at you); Torch Bonk (the torch twirled and
//           drawn right back, leaning away; then swung over and down on your head like a little brass
//           baton, BONK, a soft arc and a ring of sparkles).
//   else    hurt: a wince, the hat knocked crooked; after landing a hit: a polite little bow, paw on its
//           chest; hunting you: the torch up and on, brows down, stern; low on health: worried, a bead
//           of sweat, its hat askew; a nap (habitat): sat back on its tail, paws folded over its tummy
//           round the torch, its head nodding; beaten: dizzy. Its marks over its head (!, ?, z's,
//           sweat) are its own, in its own style (`ownEmotes`): little ticket-shaped cards.
// Every effect is drawn here, live, in its own soft style: the torch's light a warm cream cone with a
// soft glow, the hush waves soft wine arcs, dust soft rounds, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, sweat } from './fx.js';

const BIG = 1.16;
const LW = 1.6 / BIG;
const INK = '#74404e';
const FUR = ['#c8987a', '#9e6c52', '#7c5242', '#5e3c32'];
const CREAM = ['#fffaf1', '#f6e6d2', '#e4cbb0'];
const COAT = ['#dc7486', '#b44a62', '#8e3450', '#6c2640'];
const GOLD = ['#fff4c0', '#f2c85c', '#c89038'];
const NOSE = ['#6a3c3c', '#4c2a2c'];
const LASH = '#4a2632';
const IRIS = ['#3a1e16', '#7a4022', '#b0682e', '#e09a4e'];
const BRASS = ['#fff0b8', '#e6be62', '#b8862e', '#8a5e22'];
const BEAM = '#fff4d6';
const HUM = [['#ff9ab8', '#ffffff'], ['#9ad8ff', '#ffffff'], ['#ffd36b', '#ffffff']];

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
const HS = 1.32;
const HO = [1.4, -15.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [72.4, 116.4];
const TAIL_B = [61.4, 132.6];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 70, c: 6, gain: 0.4, turn: 0.7, hang: 0.25, max: 13, flutter: 1.2, hz: 0.4, dir: [-6, 7] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 60, c: 5.4, gain: 0.45, turn: 0.7, hang: 0.2, max: 15, flutter: 1.6, hz: 0.46, dir: [-7, 1] } },
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

// ---------- Its face ----------
// e: open | wide | happy | shut | sleep | squeeze | dizzy | wink | squint; g gaze; b brows [outer, inner]; m mouth.
const FACES = {
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'calm' },
  polite: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  happy: { e: 'happy', b: [-0.9, -1], m: 'open' },
  look: { e: 'open', g: [-1.3, 0.2], b: [0.4, -0.8], m: 'calm' },
  lookB: { e: 'open', g: [1.6, 0.2], b: [0.4, -0.8], m: 'calm' },
  huh: { e: 'open', g: [0.2, -0.6], b: [-1.2, 0.8], m: 'o' },
  sheepish: { e: 'open', g: [-1, 0.9], b: [1, -1.4], m: 'wobble' },
  focus: { e: 'open', g: [1.2, 0.9], b: [-0.4, 1.2], m: 'set' },
  spot: { e: 'wide', g: [1.4, 1.1], b: [-1.6, -1.8], m: 'o' },
  shh: { e: 'squint', g: [1.2, 0.4], b: [-0.6, 1.8], m: 'shh' },
  proud: { e: 'happy', b: [-0.9, -0.5], m: 'grin' },
  lick: { e: 'shut', b: [0, -0.3], m: 'tongue' },
  juggle: { e: 'open', g: [0.4, -1.8], b: [-1, -1.2], m: 'grin' },
  yum: { e: 'happy', b: [-1, -1.2], m: 'chew' },
  fierce: { e: 'open', g: [1.6, 0.5], b: [-0.8, 2.2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shh' },
  flash: { e: 'squint', g: [1.4, 0.2], b: [-0.6, 1.6], m: 'grin' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  worried: { e: 'open', g: [0.3, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['polite', 'happy', 'proud', 'lick', 'yum', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A soft rounded square (the torch-light glint).
function rsq(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x - w + r, y - h);
  ctx.lineTo(x + w - r, y - h);
  ctx.quadraticCurveTo(x + w, y - h, x + w, y - h + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x - w + r, y + h);
  ctx.quadraticCurveTo(x - w, y + h, x - w, y + h - r);
  ctx.lineTo(x - w, y - h + r);
  ctx.quadraticCurveTo(x - w, y - h, x - w + r, y - h);
  ctx.closePath();
}
// One eye (head units): o +1 the eye nearer its nose, -1 the other.
function eye(ctx, a, x, y, o, f) {
  const w = 3.9;
  const h = 4.3;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1], [x, y - h * 1.05], [x + w, y + 1], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.2], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.2], [x + w * 0.2 * o, y + 1.1], [x + w * 0.9 * o, y + 0.4], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3 : 2.4)], [x + w, y], 1.4, LASH);
    stroke3(ctx, a, [x + w * o, y], [x + (w + 0.8) * o, y - 0.3], [x + (w + 1.1) * o, y - 1], 0.9, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  // (squinting: the same round eye, its lash line lowered to the top of the iris, the iris whole under it)
  const sq = kind === 'squint' ? 0.72 : 1;
  ell(ctx, x, y + (1 - sq) * h * 0.5, w * big, h * big * sq);
  ctx.fillStyle = tone(a, '#fffaf2');
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
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
    stroke3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.3], [x + w, y - h * 0.3], 1.4, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.6, 0.3];
  ctx.save();
  ell(ctx, x, y + (1 - sq) * h * 0.5, w * big, h * big * sq);
  ctx.clip();
  const ir = (kind === 'wide' ? 0.72 : 0.86) * (sq < 1 ? 0.78 : 1);
  const ix = x + gx * 0.55;
  const iy = y + gy * 0.45 + (1 - sq) * h * 0.55;
  const iw = w * ir;
  const ih = h * ir;
  // the iris: a deep conker brown, warming to amber at the bottom, filling most of the eye
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.12, iw * 0.9, ih * 0.86);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.5, iw * 0.7, ih * 0.38);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.7, iw * 0.42, ih * 0.16);
  ctx.fillStyle = tone(a, IRIS[3], 0.8);
  ctx.fill();
  ell(ctx, ix + 0.1, iy - ih * 0.05, iw * 0.46, ih * 0.48);
  ctx.fillStyle = tone(a, '#24120e');
  ctx.fill();
  // its glints: a soft rounded square (a lamp's reflection) and a small round one
  rsq(ctx, ix - iw * 0.32, iy - ih * 0.36, 1.05, 0.95, 0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + iw * 0.38, iy + ih * 0.34, 0.5, 0.5);
  ctx.fill();
  ctx.restore();
  // a short neat lash line over the top, round at both ends, one round flick at its outer corner
  const top = y - h * big * sq + (1 - sq) * h * 0.5;
  stroke3(ctx, a, [x - w * 0.96, y - h * 0.25 * sq], [x, top - h * 0.32], [x + w * 0.96, y - h * 0.25 * sq], 1.2, LASH);
  stroke3(ctx, a, [x + w * 0.86 * o, top + h * 0.3], [x + (w + 0.7) * o, top + 0.1], [x + (w + 1.1) * o, top - 0.6], 0.95, LASH);
}
// Cream tuft brows: a soft round dab each, tipping with the mood.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.save();
  ctx.translate(x, y + (bo + bi) * 0.35);
  ctx.rotate(((bi - bo) * 0.22) * o);
  ell(ctx, 0, 0, 2.3, 1.05);
  ctx.fillStyle = tone(a, CREAM[0]);
  ctx.fill();
  ctx.restore();
}
function mouth(ctx, a, x, y, m, chew = 0) {
  const LIP = '#6a2e3a';
  const open = (w, h, teeth = false) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7a2e44');
    ctx.fill();
    ell(ctx, x, y + h * 0.8, w * 0.56, h * 0.32);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
    if (teeth) {
      for (const d of [-0.6, 0.6]) {
        smooth(ctx, [[x + d - 0.5, y + 0.1], [x + d + 0.5, y + 0.1], [x + d + 0.45, y + 1.1], [x + d - 0.45, y + 1.1]]);
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
  // (the otter's philtrum: a short line down from the nose to where the "w" meets)
  if (m !== 'shh' && m !== 'o') line([[x, y - 2], [x + 0.1, y - 1], [x, y]], 0.6);
  switch (m) {
    case 'smile':
      line([[x - 2.4, y - 0.4], [x - 1.2, y + 1.3], [x, y], [x + 1.2, y + 1.3], [x + 2.4, y - 0.4]]);
      break;
    case 'open':
      open(2, 2.2);
      break;
    case 'grin':
      open(2.4, 2, true);
      break;
    case 'o':
      ell(ctx, x, y + 0.6, 1, 1.15);
      ctx.fillStyle = tone(a, '#7a2e44');
      ctx.fill();
      break;
    case 'shh':
      // (lips pushed into a little round "shh")
      ell(ctx, x + 0.3, y + 0.4, 1.25, 0.95);
      ctx.fillStyle = tone(a, '#c86a80');
      ctx.fill();
      ell(ctx, x + 0.3, y + 0.4, 0.6, 0.45);
      ctx.fillStyle = tone(a, '#7a2e44');
      ctx.fill();
      break;
    case 'tongue':
      line([[x - 1.8, y], [x, y + 0.6], [x + 1.8, y]]);
      smooth(ctx, [[x - 0.5, y + 0.4], [x + 1.1, y + 0.4], [x + 1.2, y + 2.4], [x + 0.3, y + 2.9], [x - 0.5, y + 2.1]]);
      ctx.fillStyle = tone(a, '#ff8eaa');
      ctx.fill();
      break;
    case 'chew': {
      const c = Math.sin(chew * 22);
      line([[x - 2.2, y + 0.2 + c * 0.3], [x - 1, y + 1.4], [x, y + 0.4 - c * 0.3], [x + 1, y + 1.4], [x + 2.2, y + 0.2 + c * 0.3]]);
      break;
    }
    case 'set':
      line([[x - 1.8, y + 0.5], [x, y + 0.1], [x + 1.8, y + 0.5]], 0.85);
      break;
    case 'wobble':
      line([[x - 2, y + 0.4], [x - 1, y - 0.3], [x, y + 0.3], [x + 1, y - 0.3], [x + 2, y + 0.4]], 0.7);
      break;
    case 'frown':
      line([[x - 1.8, y + 0.9], [x, y - 0.2], [x + 1.8, y + 0.9]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.5, 0.7, 0.55);
      ctx.fillStyle = tone(a, '#7a2e44');
      ctx.fill();
      break;
    case 'talkA':
      open(1.6, 1.9);
      break;
    case 'talkE':
      open(2, 1.1);
      break;
    default:
      // at rest: the otter's soft "w", its near side tucked up
      line([[x - 2.2, y - 0.2], [x - 1.1, y + 1.1], [x, y], [x + 1.1, y + 1.2], [x + 2.3, y - 0.5]], 0.72);
  }
}
// The skull: broad and a little flat, a wide muzzle.
const SKULL = [[-18.4, -1.6], [-16.8, -10.6], [-10.4, -16], [-1, -17.8], [8, -16.6], [15, -12.4], [19.6, -5.6], [23.8, 0.6], [24, 7], [19.2, 12.6], [8.4, 15.6], [-4, 15.2], [-13.6, 10.8]];
const MASK = [[0.6, 4.6], [7, 2.2], [14.6, 0], [21, -0.8], [25, 2.4], [24.6, 8.6], [19, 13.4], [8.6, 15.6], [-1.6, 13]];
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r, 1.4], [-r * 0.96, -r * 0.5], [-r * 0.4, -r * 1.1], [r * 0.4, -r * 1.1], [r * 0.96, -r * 0.5], [r, 1.4]]);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    ell(ctx, 0, -r * 0.2, r * 0.52, r * 0.56);
    ctx.fillStyle = tone(a, '#d8a49a');
    ctx.fill();
  }
  ctx.restore();
}
// Its pillbox hat, pinned on at a tilt (head units, over the crown).
function hat(ctx, a, mode, tilt) {
  ctx.save();
  ctx.translate(1.6, -16.4);
  ctx.rotate(-0.22 + tilt);
  smooth(ctx, [[-6.8, 1.6], [-7, -3.4], [-5.4, -5.6], [5.4, -5.6], [7, -3.4], [6.8, 1.6], [0, 2.6]]);
  paint(ctx, a, mode, COAT[1]);
  if (mode === 'fill') {
    // its top, lit; a gold band round it; a gold button on top
    ell(ctx, 0, -5, 6.2, 1.5);
    ctx.fillStyle = tone(a, COAT[0]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6.9, -0.2);
    ctx.quadraticCurveTo(0, 1.4, 6.9, -0.2);
    pen(ctx, tone(a, GOLD[1]), 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6.6, -0.7);
    ctx.quadraticCurveTo(0, 0.7, 6.6, -0.7);
    pen(ctx, tone(a, GOLD[0], 0.8), 0.45);
    ctx.stroke();
    glow(ctx, -2.6, -3.4, 3.4, COAT[0], 0.5);
    ell(ctx, 0.4, -6.1, 1.2, 0.9);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ell(ctx, 0.1, -6.4, 0.45, 0.3);
    ctx.fillStyle = tone(a, GOLD[0]);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -15.6, -6.6, 3.4, -0.9);
  ear(ctx, a, mode, -5.4, -15.4, 3.6, -0.3);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -2, -11, 16, FUR[0], 0.8);
    glow(ctx, -16, 9, 11, FUR[2], 0.6);
    // the cream face, chin and throat
    smooth(ctx, MASK);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 14, 5, 8, CREAM[0], 0.9);
    glow(ctx, 6, 14, 7, CREAM[2], 0.6);
    ctx.restore();
    // cheeks
    for (const [cx, cy, k] of [[-8.6, 6, 0.65], [12.4, 6.4, 1]]) {
      ell(ctx, cx, cy, 2.8, 1.6);
      ctx.fillStyle = tone(a, '#ff9cae', 0.42 * k);
      ctx.fill();
    }
    eye(ctx, a, -4.6, -2.6, -1, f);
    eye(ctx, a, 9.6, -3, 1, f);
    brow(ctx, a, -4.8, -9.2, -1, f.b);
    brow(ctx, a, 9.8, -9.6, 1, f.b);
    // puffy whisker pads, its whiskers, then the big soft nose
    for (const [wx, wy, r] of [[18.4, 6.2, 3], [22.4, 5.8, 2.7]]) {
      ell(ctx, wx, wy, r, r * 0.8);
      ctx.fillStyle = tone(a, CREAM[0]);
      ctx.fill();
    }
    ctx.save();
    ctx.globalAlpha *= 0.75;
    for (const [dy, len, bend] of [[-0.6, 7, -1.2], [0.9, 7.6, 0], [2.4, 6.4, 1.1]]) {
      ctx.beginPath();
      ctx.moveTo(23.4, 5.4 + dy);
      ctx.quadraticCurveTo(23.4 + len * 0.55, 5.4 + dy * 1.6 + bend * 0.3, 23.4 + len, 5.4 + dy * 2.2 + bend);
      pen(ctx, tone(a, CREAM[2]), 0.36);
      ctx.stroke();
    }
    ctx.restore();
    const tw = q.sniff ? Math.sin((a.now ?? 0) * 26) * 0.3 : 0;
    smooth(ctx, [[18.8 + tw, 1], [24.4 + tw, 0.4], [25.4 + tw, 2], [22.4 + tw, 4.8], [19.4 + tw, 2.8]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 21.8 + tw, 1.5, 1.2, 0.5, -0.1);
    ctx.fillStyle = 'rgba(255,240,240,0.7)';
    ctx.fill();
    mouth(ctx, a, 21.6, 8.6, f.m, a.now ?? 0);
  }
  hat(ctx, a, mode, q.hatTilt ?? 0);
  ctx.restore();
}

// ---------- Its uniform ----------
// (Its jacket and sleeves and trousers are the base's own skin in wine-red; over them, cut from the same
// outline, the frogging, the buttons, the trouser line and stripe; at the neck the collar; gold cuffs.)
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function button(ctx, a, x, y, r = 0.85) {
  ell(ctx, x, y, r, r);
  ctx.fillStyle = tone(a, BRASS[2]);
  ctx.fill();
  ell(ctx, x - r * 0.15, y - r * 0.15, r * 0.7, r * 0.7);
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.35, r * 0.3, r * 0.24);
  ctx.fillStyle = tone(a, BRASS[0]);
  ctx.fill();
}
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
  // the jacket's hem: a slightly darker band where it stops over the trousers, lit along its edge
  const hem = [T([h[0] - 24, h[1] - 3]), T([h[0], h[1] - 1.4]), T([h[0] + 22, h[1] - 3.4])];
  ctx.beginPath();
  ctx.moveTo(...hem[0]);
  ctx.quadraticCurveTo(...hem[1], ...hem[2]);
  ctx.lineTo(...T([h[0] + 24, h[1] + 30]));
  ctx.lineTo(...T([h[0] - 26, h[1] + 30]));
  ctx.closePath();
  ctx.fillStyle = tone(a, COAT[2]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...hem[0]);
  ctx.quadraticCurveTo(...hem[1], ...hem[2]);
  pen(ctx, tone(a, COAT[0], 0.7), 0.7);
  ctx.stroke();
  // the front edge: a soft fold down the middle, toward its near side
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 7, st[1] + 1]));
  ctx.quadraticCurveTo(...W([w[0] + 8.6, w[1]]), ...T([h[0] + 7.4, h[1] - 2]));
  pen(ctx, tone(a, COAT[2], 0.8), 0.6);
  ctx.stroke();
  // three gold frogging braids across the chest, each with its loop and a brass button
  for (const [k, y0] of [[0, 4.4], [1, 9.6], [2, 14.6]]) {
    const yy = st[1] + y0;
    const P = (dx, dy = 0) => (k < 2 ? C([st[0] + dx, yy + dy]) : W([st[0] + dx, yy + dy]));
    ctx.beginPath();
    ctx.moveTo(...P(1.2, 0.4));
    ctx.quadraticCurveTo(...P(6.4, -1), ...P(12.6, 0.2));
    pen(ctx, tone(a, GOLD[2]), 1.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(...P(1.4, 0.1));
    ctx.quadraticCurveTo(...P(6.4, -1.3), ...P(12.4, -0.1));
    pen(ctx, tone(a, GOLD[1]), 0.6);
    ctx.stroke();
    // (its loop at the outer end)
    const [lx, ly] = P(13.6, 0.1);
    ell(ctx, lx, ly, 1.15, 0.8);
    pen(ctx, tone(a, GOLD[1]), 0.5);
    ctx.stroke();
    const [bx, by] = P(7.4, -0.7);
    button(ctx, a, bx, by, 0.72);
  }
  // a soft light on the chest and shade toward the far side
  const c0 = C([st[0] + 8, st[1] + 4]);
  glow(ctx, c0[0], c0[1], 5.4, COAT[0], 0.45);
  ctx.restore();
}
// The collar: a stand-up band round its neck, gold-edged, under its chin.
function collar(ctx, a, mode, D) {
  const J = D.J;
  const st = J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const pts = [C([st[0] - 9, st[1] - 1]), C([st[0] - 7, st[1] - 5.6]), C([st[0] + 2, st[1] - 7.4]), C([st[0] + 11, st[1] - 5]), C([st[0] + 12.4, st[1] - 0.6]), C([st[0] + 2, st[1] + 1.4])];
  smooth(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, COAT[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...C([st[0] - 7.4, st[1] - 5]));
  ctx.quadraticCurveTo(...C([st[0] + 2, st[1] - 7.6]), ...C([st[0] + 11.4, st[1] - 4.4]));
  pen(ctx, tone(a, GOLD[1]), 0.9);
  ctx.stroke();
  const b = C([st[0] + 4.6, st[1] - 1.4]);
  button(ctx, a, b[0], b[1], 0.7);
}
// A gold cuff round the sleeve's end, then its paw (fur) over it.
function cuff(ctx, a, mode, D, k) {
  const W = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(W[1] - E[1], W[0] - E[0]);
  ctx.save();
  ctx.translate(...W);
  ctx.rotate(ang);
  smooth(ctx, [[-2.4, -2.5], [0.2, -2.7], [0.6, 0], [0.2, 2.7], [-2.4, 2.5], [-2.8, 0]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null);
  } else {
    ctx.fillStyle = tone(a, k === 'F' ? GOLD[2] : GOLD[1]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.2, -2.4);
    ctx.lineTo(-1.2, 2.4);
    pen(ctx, tone(a, GOLD[0], 0.7), 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
// The trousers' gold stripe down the near leg (along its bones, a touch toward the front).
function stripe(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const H = ptOf(a, D, 'thighN', D.J.hipN);
  const K = ptOf(a, D, 'shinN', D.J.kneeN);
  const A = ptOf(a, D, 'footN', D.J.ankN);
  ctx.beginPath();
  ctx.moveTo(H[0] + 0.9, H[1] + 1.4);
  ctx.quadraticCurveTo(K[0] + 1.3, K[1], A[0] + 0.9, A[1] - 1.2);
  pen(ctx, tone(a, GOLD[1]), 0.8);
  ctx.stroke();
}
// The thick otter tail: one smooth tapering rudder through its two springy halves.
const TAIL_PTS_A = [[74, 114], [68.6, 124], TAIL_B];
const TAIL_PTS_B = [[52, 138], [42, 139.6], [33.4, 136]];
const TAIL_W = [16, 15, 13, 10.6, 8.4, 6.2, 4];
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
    L.push([c[i][0] - (dy / d) * ws[i], c[i][1] + (dx / d) * ws[i]]);
    Rr.push([c[i][0] + (dy / d) * ws[i], c[i][1] - (dx / d) * ws[i]]);
  }
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
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
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const ws = TAIL_W.map((w) => w * D.SC);
  const c = ribbon(ctx, pts, ws);
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] - 0.4, c[i][1] - 1.6, 3.2, FUR[0], 0.55);
  for (let i = 1; i < c.length; i += 3) glow(ctx, c[i][0] + 0.6, c[i][1] + 2, 2.8, FUR[2], 0.5);
  ctx.restore();
}

// ---------- Its torch (rig space: drawn at its near paw, aimed by the pose) ----------
function torchAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  const ang = a.gl?.torchAng ?? 0.9;
  return { x: p[0], y: p[1], ang };
}
function torch(ctx, a, mode, D) {
  const T = torchAt(a, D);
  ctx.save();
  ctx.translate(T.x, T.y);
  ctx.rotate(T.ang);
  ctx.scale(0.86, 0.86);
  // (along +x: the grip behind the paw, the flared head out front with its glass lens)
  smooth(ctx, [[-3.4, -1.15], [2.6, -1.2], [3.6, -2.1], [6, -2.2], [6.3, 0], [6, 2.2], [3.6, 2.1], [2.6, 1.2], [-3.4, 1.15], [-3.9, 0]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, BRASS[3]);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ell(ctx, 1, -0.55, 4.2, 0.4);
  ctx.fillStyle = tone(a, BRASS[0], 0.8);
  ctx.fill();
  ell(ctx, 4.4, 1.2, 1.4, 0.7);
  ctx.fillStyle = tone(a, BRASS[2], 0.6);
  ctx.fill();
  const on = a.gl?.torchOn ?? 0;
  ell(ctx, 6.1, 0, 0.7, 1.9);
  ctx.fillStyle = tone(a, on > 0.2 ? '#fffbe6' : '#d8e4ee');
  ctx.fill();
  if (on > 0.02) glow(ctx, 6.6, 0, 4 + on * 2, '#fff2c0', 0.7 * on);
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { tickets: 7.4, torch: 6.6, spruce: 6.4, juggle: 7.6 };
const ORDER = ['tickets', 'torch', 'spruce', 'juggle'];
const POOL = ['shush', 'flash', 'bonk'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tailRot: 0, tailCurl: 0, hatTilt: 0, torchAng: 0.95, torchOn: 0, beam: 0, beamAng: 0.5, ticket: null, stub: -1, hums: null, hush: -1, flashS: -1, swatS: -1, sweat: -1, zz: 0, sniff: false, bowS: -1, sit: 0 };
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
  const toLeg = (c.H ?? 36) / Math.max(1, c.leg ?? 9.8);
  // Standing: upright and proper, the torch held low in its near paw, the far paw at its side; walking,
  // brisk, the tail swaying as a counterweight.
  const br = c.breath ?? 0;
  go({ shN: -16 + br * 1.5, elN: -40, hwN: -6, shF: 6 + br, elF: -14, tilt: -1 + walking * 3, head: -2, chest: -br * 0.6 - 1 }, 1);
  q.tailRot = Math.sin(t * 0.6) * 0.05 + Math.sin((a.blkidU ?? t) * TAU) * 0.1 * walking;
  q.tailCurl = Math.sin(t * 0.5 + 1) * 0.05;
  q.torchAng = 1.1 + Math.sin(t * 0.8) * 0.03;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.otWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.otAtk) {
      const pool = m.def.moves ?? POOL;
      st.otN = (st.otN ?? m.uid ?? 0) + 1;
      st.otMove = m.move ?? pool[st.otN % pool.length];
    }
    st.otAtk = true;
  } else st.otAtk = false;
  const mvName = st.otAtk ? st.otMove : null;
  const hadWind = now - (st.otWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.otCalm = mix(st.otCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.otCalm);
  let PC = st.otPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.otOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.otOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.otOrd = (st.otOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.otPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let sit = 0;

  if (k > 0.001 && piece === 'tickets') {
    // a paw into its jacket pocket; a ticket out
    const dig = win(pu, 0.1, 0.4, 0.8, 1.05);
    go({ shN: 10, elN: -110, hwN: -30, head: 8, neckR: 2 }, dig * k);
    say('focus', dig * k);
    // torn in two, both paws up at its chest: rip!
    const tear = win(pu, 0.9, 1.2, 2.3, 2.6);
    const rip = sstep((pu - 1.7) / 0.16);
    go({ shN: -30 - rip * 6, elN: -70, hwN: -10 + rip * 14, shF: -34 + rip * 10, elF: -72, hwF: -10, head: 12, chest: -1 }, tear * k);
    if (pu > 0.75 && pu < 5.9) q.ticket = { torn: rip, tuck: 0 };
    if (pu > 1.7 && pu < 3.6) q.stub = (pu - 1.7) / 1.9;
    say('focus', tear * k);
    // offered with a little bow, to nobody
    const offer = win(pu, 2.5, 2.9, 3.9, 4.2);
    go({ shN: -78, elN: -16, hwN: 10, shF: 0, elF: -90, hwF: -20, head: 14, chest: 6, tilt: 8, neckR: 3 }, offer * k);
    say('polite', offer * k);
    // a look one way, then the other
    const look = win(pu, 4.1, 4.3, 5.3, 5.5);
    const lr = sstep((pu - 4.75) / 0.12);
    go({ head: -4, neckR: -6 + lr * 12, shN: -40, elN: -50 }, look * k);
    say(lr > 0.5 ? 'lookB' : 'look', look * k);
    // tucked away, sheepish
    const tuck = win(pu, 5.4, 5.7, 6.6, 7.1);
    go({ shN: 8, elN: -110, hwN: -30, shF: -10, elF: -60, head: 6, neckR: 4 }, tuck * k);
    if (q.ticket) q.ticket.tuck = sstep((pu - 5.5) / 0.3);
    say('sheepish', tuck * k);
    q.tailRot += Math.sin(pu * 5) * 0.12 * tuck * k;
  }
  if (k > 0.001 && piece === 'torch') {
    // click: on; the beam swept slowly along the floor
    const raise = win(pu, 0.1, 0.5, 5.6, 6.0);
    const sw = clamp((pu - 0.8) / 2.8, 0, 1);
    go({ shN: -58, elN: -24, hwN: 0, tilt: 4, head: 6, shF: 4, elF: -20 }, raise * k);
    q.torchAng = mix(q.torchAng, mix(0.75, 0.25, sstep(sw)), raise * k);
    q.torchOn = Math.max(q.torchOn, sstep((pu - 0.5) / 0.12) * (1 - sstep((pu - 5.7) / 0.12)) * k);
    q.beam = q.torchOn;
    q.beamAng = q.torchAng;
    say('focus', win(pu, 0.4, 0.6, 3.6, 3.8) * k);
    // it finds something: a start
    const spot = win(pu, 3.7, 3.85, 4.1, 4.3);
    add({ lift: 0.02 * spot, head: -6 * spot }, k);
    q.tailCurl += 0.4 * spot * k;
    say('spot', spot * k);
    // "shh!" a finger to its lips at the culprit, leaning in
    const shh = win(pu, 4.2, 4.5, 5.5, 5.8);
    go({ shF: -120, elF: -140, hwF: -10, tilt: 8, head: -2, x: 0.02 }, shh * k);
    say('shh', shh * k);
    if (shh > 0.3) q.hush = (pu - 4.4) / 1.2;
  }
  if (k > 0.001 && piece === 'spruce') {
    // the hat set straight with its far paw
    const hatK = win(pu, 0.1, 0.5, 1.4, 1.7);
    go({ shF: -150, elF: -64, hwF: -20, head: -4, neckR: -2 }, hatK * k);
    q.hatTilt += 0.22 * sstep((pu - 0.6) / 0.5) * (1 - sstep((pu - 5.6) / 0.8)) * k;
    say('focus', hatK * k);
    // the jacket brushed down
    const brush = win(pu, 1.7, 1.9, 3.2, 3.4);
    go({ shF: -30 + Math.sin(pu * 11) * 10, elF: -100, hwF: -30, head: 12, neckR: 3 }, brush * k);
    say('shut', brush * k);
    // a paw licked, the fur smoothed back over its head
    const lick = win(pu, 3.4, 3.6, 4.0, 4.2);
    go({ shF: -86, elF: -130, hwF: -30, head: 6 }, lick * k);
    say('lick', lick * k);
    const smooth0 = win(pu, 4.1, 4.3, 5.0, 5.2);
    const u = clamp((pu - 4.3) / 0.7, 0, 1);
    go({ shF: -150 - u * 30, elF: -50 + u * 30, hwF: -10, head: 8 - u * 8 }, smooth0 * k);
    say('shut', smooth0 * k);
    // a swish of its tail, proud
    const swish = win(pu, 5.2, 5.4, 6.0, 6.4);
    q.tailRot += Math.sin((pu - 5.2) * 9) * 0.35 * swish * k;
    go({ chest: -3, head: -4 }, swish * k);
    say('proud', swish * k);
  }
  if (k > 0.001 && piece === 'juggle') {
    // three humbugs from its pocket
    const dig = win(pu, 0.1, 0.4, 0.8, 1.0);
    go({ shF: 6, elF: -110, hwF: -30, head: 8 }, dig * k);
    // juggled in a cascade, paw to paw, eyes on the top of the arc
    const jug = win(pu, 0.9, 1.2, 5.0, 5.3);
    const ph = (pu - 1.1) * 7.4;
    const hn = Math.sin(ph);
    go({ shN: -22 + hn * 12, elN: -58 + hn * 8, hwN: -20, shF: -22 - hn * 12, elF: -58 - hn * 8, hwF: -20, head: -8, neckR: -3 }, jug * k);
    add({ lift: Math.abs(Math.sin(ph)) * 0.008 }, jug * k);
    q.torchAng = mix(q.torchAng, 1.5, jug * k);
    if (jug > 0.2) q.hums = { ph, k: jug * k };
    say('juggle', jug * k);
    // caught; one popped in its mouth; a happy crunch
    const pop = win(pu, 5.2, 5.4, 5.8, 6.0);
    go({ shF: -100, elF: -120, hwF: -20, head: -6 }, pop * k);
    const crunch = win(pu, 5.8, 6.0, 7.0, 7.5);
    add({ head: Math.sin(pu * 22) * 1.6 * crunch, chest: -2 * crunch }, k);
    q.tailRot += Math.sin(pu * 8) * 0.18 * crunch * k;
    say('yum', win(pu, 5.6, 5.8, 7.2, 7.5) * k);
  }

  // (its own marks over its head)
  if (fighting && alive && !st.otHunt) st.otBangAt = now;
  if (!fighting && st.otHunt && alive) st.otLostAt = now;
  st.otHunt = fighting && alive;
  q.bang = now - (st.otBangAt ?? -9);
  q.huh = now - (st.otLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the torch up and on, brows down, stern -----
  // (the stance eases off as a move or a flinch takes over, never dropping out in one frame: the 2026-11-27
  // jitter probe found the arm and its prop leaping at the start of every wind-up)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    go({ shN: -62, elN: -26, tilt: 5, head: 4, shF: -10, elF: -40 }, huntW * (1 - walking * 0.5));
    q.torchAng = mix(q.torchAng, 0.35, huntW * (1 - walking * 0.5));
    q.torchOn = Math.max(q.torchOn, 0.8 * huntW);
    q.beam = Math.max(q.beam, 0.55 * huntW * (1 - walking * 0.6));
    if (huntW > 0.5) q.beamAng = q.torchAng;
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.hatTilt -= 0.25;
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'shush') {
      // a finger to its lips, a deep breath, leaning back
      go({ shF: -122, elF: -140, hwF: -10, tilt: -10, chest: -6, head: -10, x: -0.03, lift: 0.01 }, wu);
      say('shh', W);
      // then it leans right in: SHHH
      if (s >= 0) {
        go({ shF: -110, elF: -136, tilt: 22, chest: 8, head: 4, x: 0.08, fxN: 0.08 * toLeg, toeF: 12 }, sw);
        say('shout', win(s, 0, 0.03, 0.5, 0.6));
        q.hush = s / 0.7;
        q.hushBig = true;
        q.tailRot -= 0.3 * sw;
      }
    } else if (mvName === 'flash') {
      // the torch raised over its shoulder, a squint
      go({ shN: -150, elN: -70, hwN: 0, tilt: -6, head: -6, shF: -20, elF: -60 }, wu);
      q.torchAng = mix(q.torchAng, -1.2, wu);
      say('focus', W);
      // then thrust out at you: a bright cone of light
      if (s >= 0) {
        go({ shN: -86, elN: -6, tilt: 12, chest: 4, head: 2, x: 0.05, shF: 10, elF: -30 }, sw);
        q.torchAng = mix(q.torchAng, 0.08, snap * sw);
        q.torchOn = Math.max(q.torchOn, sw);
        q.flashS = s;
        say('flash', win(s, 0, 0.03, 0.55, 0.7));
      }
    } else {
      // the torch twirled once and drawn right back behind it, leaning back, the far paw out for balance
      const up = sstep(W) * (1 - snap);
      go({ shN: 70, elN: -70, hwN: 0, tilt: -10, chest: -5, head: -6, x: -0.03, shF: -60, elF: -30, toeN: 8 }, up);
      q.torchAng = mix(q.torchAng, -2.4 - Math.sin(W * Math.PI) * 1.4, up);
      say(W < 0.5 ? 'focus' : 'fierce', W);
      if (s >= 0) {
        // then brought down on your head: BONK
        go({ shN: -78, elN: -10, tilt: 18, chest: 6, head: 6, x: 0.07, shF: -20, elF: -60 }, sw);
        q.torchAng = mix(q.torchAng, 0.35, snap * sw);
        q.swatS = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: a wince, the hat knocked crooked -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -40, elN: -100, shF: -50, elF: -110, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.hatTilt -= 0.45 * kh;
    q.tailCurl += 0.5 * kh;
  }
  // ----- After landing a hit: a polite little bow, paw on its chest -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 0.85, 1.2) * (1 - moveW);
    go({ shF: -20, elF: -110, hwF: -30, head: 14, chest: 6, tilt: 6 }, kg);
    say('polite', kg);
    if (kg > 0.3) q.bowS = gl;
  }
  // ----- A nap (its habitat): sat back on its tail, paws folded round the torch -----
  st.otNap = mix(st.otNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.otNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 18 + Math.sin(now * 1.4) * 3, neckR: 5, shN: -30, elN: -96, hwN: -20, shF: -24, elF: -96, hwF: -20 }, nw);
    q.torchAng = mix(q.torchAng, 1.9, nw);
    q.tailRot += 0.4 * nw;
    q.tailCurl += 0.6 * nw;
    q.hatTilt -= 0.2 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (sit > 0.001) go({ lift: -0.18 + Math.sin(now * 1.4) * 0.006, tilt: -10, fxN: 0.4, fyN: 0.06, fxF: 0.34, fyF: 0.05, toeN: -14, toeF: -14 }, sit);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.hatTilt -= 0.5;
  }
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.otFace) {
    st.otFaceFrom = st.otFace;
    st.otFace = f;
    st.otFaceAt = now;
  }
  const since0 = now - (st.otFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.otFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.otFaceFrom) && !(talky(f) && talky(st.otFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.71) % 4.6;
  if (bl < 0.12 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  // (everything soft eased, so nothing snaps)
  for (const key of ['hatTilt', 'torchAng', 'torchOn', 'beam', 'tailRot', 'tailCurl']) {
    const rate = key === 'torchOn' ? 18 : key === 'torchAng' ? 14 : key.startsWith('tail') ? 9 : 10;
    st[`ot_${key}`] = mix(st[`ot_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`ot_${key}`];
  }
  q.sit = sit;
  q.calm = cw;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// A little ticket-shaped card (its own marks): a cream card with notched corners, a wine edge.
function card(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  ctx.rotate(-0.08);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.4, -4.4], [-1.6, -4.8], [0, -3.8], [1.6, -4.8], [5.4, -4.4], [5.6, 3.6], [1.6, 4.2], [0, 3.2], [-1.6, 4.2], [-5.6, 3.6]]);
    if (pass === 'line') {
      pen(ctx, COAT[2], 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffaf0';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? COAT[1] : '#8a6a72';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.6);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.5, -1.6);
    ctx.quadraticCurveTo(-1.2, -3.2, 0.4, -3.1);
    ctx.quadraticCurveTo(2, -2.8, 1.4, -1.2);
    ctx.quadraticCurveTo(0.4, -0.5, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.8, 0.8);
  ctx.fill();
  ctx.restore();
}
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
  ctx.strokeStyle = COAT[2];
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fff4f0';
  ctx.stroke();
  ctx.restore();
}
// A ticket (rig space): a little cream card with a wine stripe, torn at `torn`.
function ticketDraw(ctx, x, y, ang, half, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, half ? [[-1.6, -1.6], [1.6, -1.6], [1.7, 1.6], [-1.6, 1.6]] : [[-3.2, -1.7], [3.2, -1.7], [3.3, 1.7], [-3.2, 1.7]]);
    if (pass === 'line') {
      pen(ctx, COAT[2], 0.7);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff6e4';
      ctx.fill();
    }
  }
  ctx.fillStyle = COAT[1];
  ctx.fillRect(half ? -0.8 : -1.6, -1.1, 0.7, 2.2);
  ctx.restore();
}
// A wrapped humbug: a round sweet with twisted wrapper ends.
function humbug(ctx, x, y, r, ang, i) {
  const [c0, c1] = HUM[i % 3];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(-r * 1.9, -r * 0.7);
    ctx.lineTo(-r * 1.9, r * 0.7);
    ctx.closePath();
    ctx.moveTo(r, 0);
    ctx.lineTo(r * 1.9, -r * 0.7);
    ctx.lineTo(r * 1.9, r * 0.7);
    ctx.closePath();
    ctx.moveTo(r, 0);
    ctx.ellipse(0, 0, r, r, 0, 0, TAU);
    if (pass === 'line') {
      pen(ctx, '#a0607a', 0.6);
      ctx.stroke();
    } else {
      ctx.fillStyle = c0;
      ctx.fill();
    }
  }
  ell(ctx, -r * 0.3, -r * 0.35, r * 0.4, r * 0.28);
  ctx.fillStyle = c1;
  ctx.fill();
  ctx.restore();
}
// A soft cone of warm light from the torch's lens (rig space), fading along its length.
function beam(ctx, x, y, ang, len, spread, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, `rgba(255,246,214,${0.55 * al})`);
  g.addColorStop(0.7, `rgba(255,240,200,${0.22 * al})`);
  g.addColorStop(1, 'rgba(255,240,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -1.4);
  ctx.quadraticCurveTo(len * 0.5, -spread * 0.6, len, -spread);
  ctx.quadraticCurveTo(len * 1.08, 0, len, spread);
  ctx.quadraticCurveTo(len * 0.5, spread * 0.6, 0, 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// A hush wave: a soft wine arc, rolling out, thinning.
function hushArc(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r, -0.7, 0.7);
  pen(ctx, '#ffd6e0', 2.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r, -0.62, 0.62);
  pen(ctx, COAT[0], 0.9);
  ctx.stroke();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -26]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const handPt = (k) => ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  const T = torchAt(a, D);
  const lens = [T.x + Math.cos(T.ang) * 5.5, T.y + Math.sin(T.ang) * 5.5];
  // the torch's beam (sweeping the floor, or held on you while hunting)
  if ((q.beam ?? 0) > 0.02) beam(ctx, lens[0], lens[1], T.ang, 20, 6, q.beam);
  // the ticket in its paws: whole, then torn into ticket and stub; tucked away at the end
  if (q.ticket) {
    const [nx, ny] = handPt('N');
    const [fx0, fy0] = handPt('F');
    const tk = q.ticket.tuck ?? 0;
    const al = 1 - tk;
    if (q.ticket.torn < 0.5) ticketDraw(ctx, mix(nx, fx0, 0.5), mix(ny, fy0, 0.5) - 1.5, -0.1, false, al);
    else ticketDraw(ctx, nx + 0.5, ny - 1.4, -0.2, false, al);
  }
  // the stub fluttering down to the floor
  if ((q.stub ?? -1) >= 0 && q.stub < 1) {
    const u = q.stub;
    if (!a.mo.otStub || u < 0.03) a.mo.otStub = handPt('F');
    const [sx, sy] = a.mo.otStub;
    ticketDraw(ctx, sx - u * 6 + Math.sin(u * 14) * 2.4, mix(sy, -1.2, sstep(u)), Math.sin(u * 12) * 0.8, true, 1 - sstep((u - 0.8) / 0.2));
  } else a.mo.otStub = null;
  // the humbugs, juggled in a cascade: each on its own arc between the paws
  if (q.hums) {
    const [nx, ny] = handPt('N');
    const [fx0, fy0] = handPt('F');
    // (each sweet rides one smooth loop between the paws: tossed high from one, caught low by the other
    // and carried across, so none ever turns back on its path)
    const cx = (nx + fx0) / 2;
    const cy = (ny + fy0) / 2 - 1;
    const rx = Math.max(2.5, Math.abs(nx - fx0) / 2 + 1);
    for (let i = 0; i < 3; i++) {
      const th = q.hums.ph * 0.5 + (i * TAU) / 3;
      const sn = Math.sin(th);
      const x = cx + Math.cos(th) * rx;
      const y = cy - (sn * 4.2 + 3.4 * sn * Math.abs(sn));
      ctx.save();
      ctx.globalAlpha *= clamp(q.hums.k * 2, 0, 1);
      humbug(ctx, x, y, 1.15, th * 2 + i, i);
      ctx.restore();
    }
  }
  // Shush: soft wine hush waves rolling out from its lips
  if ((q.hush ?? -1) >= 0 && q.hush < 1.2) {
    const [mx, my] = headAt(a, D, [26, 8]);
    for (let i = 0; i < 3; i++) {
      const u = clamp(q.hush * 1.2 - i * 0.2, 0, 1);
      if (u > 0 && u < 1) hushArc(ctx, mx, my, 3 + u * (q.hushBig ? 22 : 11), (1 - u) * 0.9);
    }
    if (q.hush > 0.05 && q.hush < 0.9) sparkle(ctx, mx + 6 + q.hush * (q.hushBig ? 14 : 6), my - 4, 1.4 * Math.sin(Math.PI * q.hush), 1, '#ffd6e0');
  }
  // Torch Flash: a bright soft cone and a flare at the lens
  if ((q.flashS ?? -1) >= 0 && q.flashS < 0.8) {
    const s = q.flashS;
    const u = clamp(s / 0.6, 0, 1);
    const al = sstep(s / 0.05) * (1 - sstep((s - 0.3) / 0.4));
    beam(ctx, lens[0], lens[1], T.ang, 22 + u * 18, 7 + u * 9, al * 1.2);
    glow(ctx, lens[0], lens[1], 6 + u * 6, '#fff4c8', 0.8 * al);
    sparkle(ctx, lens[0] + 1, lens[1], 3.6 * Math.sin(Math.PI * clamp(s / 0.35, 0, 1)), 1, '#fff4c8');
    for (let i = 0; i < 3; i++) {
      const v = clamp(u * 1.3 - i * 0.15, 0, 1);
      sparkle(ctx, lens[0] + 8 + v * 22, lens[1] + (i - 1) * 6 * v, 1.4 * Math.sin(Math.PI * v), al, '#ffffff');
    }
  }
  // Torch Bonk: a soft brass arc as it comes down, a ring of sparkles where it lands
  if ((q.swatS ?? -1) >= 0 && q.swatS < 0.7) {
    const u = q.swatS / 0.7;
    const [hx, hy] = ptOf(a, D, 'chest', D.J.stern);
    ctx.save();
    ctx.globalAlpha *= (1 - sstep((u - 0.2) / 0.5)) * 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(hx, hy, 19, -1.7, -1.7 + 1.9 * sstep(u * 3));
    pen(ctx, '#fff4d6', 2.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx, hy, 19, -1.6, -1.6 + 1.8 * sstep(u * 3));
    pen(ctx, BRASS[1], 0.7);
    ctx.stroke();
    ctx.restore();
    const cx = hx + 19 * Math.cos(0.2);
    const cy = hy + 19 * Math.sin(0.2);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.9;
      const v = clamp(u * 1.6 - 0.1, 0, 1);
      sparkle(ctx, cx + Math.cos(an) * (2 + v * 8), cy + Math.sin(an) * (2 + v * 6), (i % 2 ? 1 : 1.5) * Math.sin(Math.PI * v), 1, i % 2 ? GOLD[0] : '#ffffff');
    }
  }
  // its polite bow: a little sparkle by its paw
  if ((q.bowS ?? -1) >= 0 && q.bowS < 1) {
    const [hx, hy] = handPt('F');
    sparkle(ctx, hx + 2, hy - 3 - q.bowS * 3, 1.5 * Math.sin(Math.PI * q.bowS), 1, GOLD[0]);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [10, -32]);
  if (q.bang >= 0 && q.bang < 1.1) card(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) card(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  ctx.globalAlpha = base;
  void t;
}

const DRESS = {
  id: 'usherotter',
  // (the skin is its uniform: the wine-red jacket and trousers; its own fur at the paws, feet and neck)
  skin: {
    lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: LW,
    parts: {
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: '#4a2e28' },
      neck: { lt: CREAM[0], base: CREAM[1], sh: CREAM[2], deep: FUR[2] },
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
    // (the torch held in its near paw: the paw drawn over its grip)
    handNskin: (ctx, a, mode, S, D) => torch(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => jacket(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D),
    legN: (ctx, a, mode, S, D) => stripe(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('otter', DRESS);
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
export const USHER_OTTER_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const USHER_OTTER_SIZE = { w: 26, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
