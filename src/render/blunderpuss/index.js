// Blunderpuss (2026-11-27, the Sky Whale's Sky Pirate Gunner remade from scratch as a new creature; the id
// stays `gunner`). The youngest of Captain Gale's crew: a ginger kitten in a striped sailor's shirt with a
// brass blunderbuss nearly as big as it is. It loads it with cloud (cannonballs are heavy, and cloud is free
// up here), and is very proud of the BOOM. On its own copy of the creature base (rig.js; body.js `kitten`: a
// small chest, a soft round tummy, slim legs on neat round paws), dressed here; its head, ears, bandana,
// tail, clothes and blunderbuss drawn here from scratch over the mannequin (never the shared face, never the
// hero).
//   look    ginger tabby fur with a few soft darker bands (never lines), a cream muzzle, chest and tail tip,
//           big pricked ears with soft round tips, a little gold hoop in its near ear; a coral-red bandana
//           knotted at the back of its head, its ends fluttering; its clothes WORN: a cream sailor's shirt
//           with soft periwinkle stripes (the base's body and arms, so it folds with every pose), rolled
//           navy trousers to the knee (the legs' own skin), a red sash with its knot at the hip; bare ginger
//           paws; a long striped tail held up in a question mark. A brass bell-mouthed blunderbuss with a
//           honey-wood stock in its near paw. Its own soft ginger outline, outer edge only, face bare.
//   eyes    its own "kitten eyes": big upturned almonds (tsurime), a sea-green iris round a tall soft oval
//           pupil that widens when it's excited, a four-point star glint, a neat lash line with a little
//           cat-eye wing; thin arched brows. A small cat mouth with a fang that peeks out when it's smug.
//   walk    the base's walk at a swaggering little pace (26), the blunderbuss swinging at its side, its tail
//           up.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - load (7.0 s): muzzle up; a pinch of powder poured (a soft puff), the ramrod tamped down three
//             times, a cloudball dropped in, a proud pat;
//           - wash (6.4 s): a paw licked and a face washed, kitten-fashion, round and round;
//           - chase (6.6 s): its tail tip twitches; it notices, stares, swats at it, then spins after it
//             (clean mirror flips), and stops, embarrassed;
//           - coin (6.8 s): a gold doubloon from its sash, flipped high, caught, bitten to test it; a grin.
//   moves   Blunderblast (the blunderbuss shouldered, one eye shut to aim, its tail lashing; BOOM: a soft
//           cloud bursting from the bell, the recoil rocking it back on its heels, its cloudball flying:
//           its shot, `cloudball`, drawn here); Stock Bonk (the gun swung up by its barrel, up on its toes;
//           then the stock bonked down at you, a ring of sparkles); Paw Bat (a low kitten crouch, its rear
//           wiggling; then two quick bats of its free paw, whap whap).
//   else    hurt: a hiss, ears flat; after landing a hit: it blows the cloud wisp off the bell, smug, the fang
//           out; hunting you: the gun shouldered, aiming; low on health: worried, ears flat, a bead of sweat;
//           a nap (habitat): sat down, its tail round its paws, its chin on its chest; beaten: dizzy. Its marks
//           over its head (!, ?) are its own: little curled scraps of treasure map (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: the BOOM as a soft cloud burst (never fire), powder
// as a soft grey puff, the coin a glossy gold disc, sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust, star } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee, ribbon } from './act.js';

const BIG = 1.06;
const LW = 1.6 / BIG;
const ID = 'blunderpuss';
const INK = '#a8705e';
const FUR = ['#fff2e0', '#ffcf96', '#f0a868', '#cc8048'];
const CREAM = ['#fffcf6', '#fff0dc', '#f2dcc0'];
const BAND = '#e08a52';
const SHIRT = ['#fffdf8', '#f6f0e6', '#e0d6c8', '#c4b8a6'];
const STRIPE = '#8a9ee0';
const TROU = ['#8c9ad0', '#6a78b0', '#545e94', '#424a78'];
const RED = ['#ffc0b4', '#ff8270', '#e05c54', '#b8444a'];
const BRASS = ['#fff4c0', '#f4cc62', '#d4a23e', '#a8782e'];
const WOOD = ['#f2c890', '#cc9256', '#9e6a3a'];
const GOLD = ['#fff6c0', '#ffd65a', '#e0a830'];
const LASH = '#3a2a24';
const IRIS = ['#1a2a22', '#2e8a70', '#66c4a0', '#c4f0d8'];
const PUFF = ['#ffffff', '#eef0f8', '#d2d8ea'];

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
const HO = [1.2, -15.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [72, 113];
const TAIL_B = [58, 104];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 62, c: 5.4, gain: 0.45, turn: 0.7, max: 14, flutter: 1.4, hz: 0.42, dir: [-6, -4] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 50, c: 4.6, gain: 0.55, turn: 0.7, max: 18, flutter: 2, hz: 0.5, dir: [0, -8] } },
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
// p: its pupil's width (a tall soft oval, wider when it's excited)
const FACES = {
  calm: { e: 'open', g: [0.6, 0.3], p: 0.42, b: [0, 0], m: 'calm' },
  load: { e: 'open', g: [0.6, -1.2], p: 0.4, b: [0.4, 0.6], m: 'calm' },
  tamp: { e: 'squeeze', b: [0.6, 0.6], m: 'grit' },
  proud: { e: 'happy', b: [-0.6, -1], m: 'smirk' },
  lick: { e: 'shut', b: [-0.4, -0.4], m: 'lick' },
  wash: { e: 'happy', b: [-0.4, -0.6], m: 'calm' },
  twitch: { e: 'wide', g: [-1.6, 1.2], p: 0.7, b: [-1.2, -1.4], m: 'o' },
  stalk: { e: 'open', g: [-1.8, 1.4], p: 0.86, b: [0.8, 1], m: 'calm' },
  spin: { e: 'squeeze', b: [-0.6, -0.6], m: 'open' },
  embarrassed: { e: 'open', g: [-1, 0.9], p: 0.5, b: [-1, -1.2], m: 'wobble' },
  coin: { e: 'wide', g: [0.6, -1.8], p: 0.8, b: [-1.2, -1.4], m: 'o' },
  bite: { e: 'squeeze', b: [0.4, 0.4], m: 'bite' },
  grin: { e: 'happy', b: [-0.8, -1.2], m: 'smirk' },
  aim: { e: 'wink', g: [1.7, 0.2], p: 0.3, b: [0.4, 1.2], m: 'grit' },
  focus: { e: 'open', g: [1.5, 0.3], p: 0.36, b: [0.6, 1], m: 'calm' },
  fierce: { e: 'open', g: [1.6, 0.2], p: 0.32, b: [1, 1.3], m: 'smirk' },
  wiggle: { e: 'open', g: [1.6, 0.5], p: 0.9, b: [0.4, 0.8], m: 'calm' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'shout' },
  smug: { e: 'happy', b: [-0.4, -1.4], m: 'smirk' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'open' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'hiss' },
  worried: { e: 'open', g: [0.3, 1], p: 0.6, b: [-1.4, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], p: 0.6, b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.2, 0.2], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], p: 0.42, b: [0, -0.4], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], p: 0.42, b: [0, -0.4], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], p: 0.42, b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['tamp', 'proud', 'lick', 'wash', 'spin', 'bite', 'grin', 'shout', 'smug', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The kitten eye: a big upturned almond, its outer corner (o's side) lifted.
function almond(ctx, x, y, w, h, o) {
  smooth(ctx, [[x - w * o, y + h * 0.2], [x - w * 0.7 * o, y - h * 0.62], [x - w * 0.05 * o, y - h * 0.98], [x + w * 0.75 * o, y - h * 0.95], [x + w * 1.08 * o, y - h * 0.62], [x + w * 0.88 * o, y + h * 0.45], [x + w * 0.1 * o, y + h * 0.95], [x - w * 0.7 * o, y + h * 0.72]]);
}
function eye(ctx, a, x, y, o, f) {
  const w = 4;
  const h = 4.4;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'open' : 'happy';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1.2 - (o < 0 ? 0.6 : 0)], [x, y - h * 0.85], [x + w, y + 1.2 - (o > 0 ? 0.6 : 0)], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.4], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.6], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.6], [x, y + (kind === 'sleep' ? 2.8 : 2.2)], [x + w, y + 0.2 - (o > 0 ? 0.4 : 0)], 1.4, LASH);
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
  } else {
    const [gx, gy] = f.g ?? [0.6, 0.3];
    ctx.save();
    almond(ctx, x, y, w * big, h * big, o);
    ctx.clip();
    const ix = x + gx * 0.6;
    const iy = y + gy * 0.45;
    const r = h * 0.8 * big;
    ell(ctx, ix, iy, r, r * 1.04);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.3, r * 0.82, r * 0.66);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.66, r * 0.5, r * 0.26);
    ctx.fillStyle = tone(a, IRIS[3]);
    ctx.fill();
    // the tall soft oval pupil
    ell(ctx, ix, iy, r * (f.p ?? 0.42), r * 0.8);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    // its four-point star glint, a small round one under it
    sparkle(ctx, ix - r * 0.34 * o, iy - r * 0.42, r * 0.5, 1, '#ffffff');
    ell(ctx, ix + r * 0.36 * o, iy + r * 0.38, r * 0.12, r * 0.12);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // a neat lash line over the top, a little cat-eye wing at the outer corner
  ctx.beginPath();
  ctx.moveTo(x - w * big * 0.95 * o, y - h * big * 0.05);
  ctx.bezierCurveTo(x - w * 0.7 * o, y - h * big * 0.75, x + w * 0.1 * o, y - h * big * 1.08, x + w * big * 1.08 * o, y - h * big * 0.62);
  pen(ctx, tone(a, LASH), 1.3);
  ctx.stroke();
  stroke3(ctx, a, [x + w * big * 1.04 * o, y - h * big * 0.62], [x + (w + 1) * o, y - h * 0.86], [x + (w + 1.5) * o, y - h * 1.22], 0.95, LASH);
}
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 2, y + lift + 0.4);
  ctx.quadraticCurveTo(x - o * 0.2, y - 1.2 + lift * 0.6, x + o * 2, y + lift * 0.3);
  pen(ctx, tone(a, FUR[3]), 0.85);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#8a4a4e';
  const DARK = '#6a2a3a';
  const line = (pts, w = 0.7) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const fang = (fx, fy) => {
    smooth(ctx, [[fx - 0.45, fy], [fx + 0.45, fy], [fx + 0.1, fy + 1.1], [fx - 0.1, fy + 1.1]]);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };
  const open = (w, h, fangs = false) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.15], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.5, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
    if (fangs) {
      fang(x - w * 0.55, y - 0.1);
      fang(x + w * 0.55, y - 0.1);
    }
  };
  switch (m) {
    case 'smirk':
      line([[x - 1.8, y + 0.3], [x - 0.6, y + 0.9], [x + 0.4, y + 0.3], [x + 1.4, y + 0.2], [x + 2.2, y - 0.8]]);
      fang(x + 0.9, y + 0.4);
      break;
    case 'open':
      open(1.7, 2);
      break;
    case 'shout':
      open(2.2, 2.6, true);
      break;
    case 'hiss':
      open(1.9, 1.8, true);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 0.85, 1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'grit':
      line([[x - 1.8, y + 0.5], [x, y + 0.2], [x + 1.8, y + 0.4]], 0.85);
      break;
    case 'bite':
      line([[x - 1.6, y + 0.3], [x, y + 0.6], [x + 1.6, y + 0.3]], 0.8);
      fang(x - 0.6, y + 0.4);
      fang(x + 0.6, y + 0.4);
      break;
    case 'lick':
      line([[x - 1.2, y + 0.2], [x, y + 0.5], [x + 1.2, y + 0.2]]);
      ell(ctx, x + 0.4, y + 1.2, 0.8, 0.9);
      ctx.fillStyle = tone(a, '#ff8aa2');
      ctx.fill();
      break;
    case 'wobble':
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.2], [x, y + 0.3], [x + 0.9, y - 0.2], [x + 1.8, y + 0.4]], 0.65);
      break;
    case 'frown':
      line([[x - 1.6, y + 0.9], [x, y], [x + 1.6, y + 0.9]]);
      break;
    case 'talkA':
      open(1.3, 1.8);
      break;
    case 'talkE':
      open(1.7, 1.1);
      break;
    default:
      // at rest: a small cat mouth, its two soft curls from under the nose, closed
      line([[x, y - 0.6], [x - 0.3, y + 0.5], [x - 1.4, y + 0.6]], 0.62);
      line([[x, y - 0.6], [x + 0.3, y + 0.5], [x + 1.4, y + 0.5]], 0.62);
  }
}
// The head: a round kitten's head, wide at the cheeks, a small neat muzzle.
const SKULL = [[-17.6, 2], [-16.8, -8], [-11, -14.6], [-1.6, -17], [7.6, -15.8], [14.4, -11.2], [18.4, -4.6], [20.6, 1], [19.8, 5.8], [16.4, 10], [8.6, 13.6], [-1.6, 14.4], [-11.6, 12], [-17, 7.6]];
// Its big pricked ears, soft round tips (`flat` laid back).
function ear(ctx, a, mode, x, y, r, rot, hoop = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r * 0.9, 2.4], [-r * 0.72, -r * 0.9], [-r * 0.26, -r * 1.9], [r * 0.18, -r * 1.92], [r * 0.66, -r * 0.9], [r * 0.9, 2.4]]);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    smooth(ctx, [[-r * 0.5, 1.4], [-r * 0.42, -r * 0.7], [-r * 0.1, -r * 1.42], [r * 0.14, -r * 1.42], [r * 0.4, -r * 0.7], [r * 0.5, 1.4]]);
    ctx.fillStyle = tone(a, '#ffd2d4');
    ctx.fill();
    // soft fluff in the ear
    glow(ctx, 0, -r * 0.2, r * 0.5, CREAM[0], 0.8);
    if (hoop) {
      ctx.beginPath();
      ctx.arc(r * 0.6, -r * 0.1, 1.5, -0.6, TAU - 1.2);
      pen(ctx, tone(a, GOLD[2]), 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// The bandana: a coral-red cap over its crown between its ears, knotted at the back, two short ends.
function bandana(ctx, a, mode) {
  const q = a.gl ?? {};
  const sw = q.knot ?? 0;
  smooth(ctx, [[-16.6, -3.4], [-15.4, -11], [-9, -16], [0, -17.8], [8.6, -16.4], [14.2, -11.6], [13, -8.6], [6, -11.2], [-2, -11.6], [-10, -8.6]]);
  paint(ctx, a, mode, RED[2]);
  // the knot and its two ends
  for (const [dx, dy, l, ang] of [[-1, 1, 6.4, 0.5], [1, 2.2, 5.2, 0.9]]) {
    ctx.save();
    ctx.translate(-16 + dx * 0.4, -5 + dy);
    ctx.rotate(ang + sw * 0.3 * dx);
    smooth(ctx, [[0, -1.2], [-l * 0.5, -1.6], [-l, -0.6], [-l * 0.9, 1], [-l * 0.4, 1.4], [0, 1.2]]);
    paint(ctx, a, mode, RED[2]);
    ctx.restore();
  }
  ell(ctx, -16, -4.4, 2.2, 2);
  paint(ctx, a, mode, RED[3]);
  if (mode === 'fill') {
    glow(ctx, -2, -15, 7, RED[0], 0.6);
    // three soft white polka dots
    for (const [px, py] of [[-6, -13], [3, -14.8], [9, -12.2]]) {
      ell(ctx, px, py, 1.1, 0.9);
      ctx.fillStyle = tone(a, '#fff4ee', 0.9);
      ctx.fill();
    }
  }
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const flat = q.earFlat ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -11.2, -11.6, 5.8, -0.5 - flat * 0.8);
  ear(ctx, a, mode, 3, -15.6, 6.2, 0.1 - flat * 0.9, true);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 0, -10, 15, FUR[0], 0.8);
    glow(ctx, -14, 9, 10, FUR[2], 0.55);
    // its tabby bands: three soft darker strokes over the brow, fading out
    for (const [x0, y0, x1, y1] of [[-5, -16, -4, -10], [0.6, -17, 1.2, -11], [6, -16, 5.4, -10.6]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 + 0.6, (y0 + y1) / 2, x1, y1);
      pen(ctx, tone(a, BAND, 0.55), 1.6);
      ctx.stroke();
    }
    // the cream muzzle and chin
    smooth(ctx, [[5, 2.4], [11, -0.6], [18.4, 1], [19.6, 6], [14.6, 11.6], [5, 14], [-2, 12.4], [0.6, 6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 13.4, 4, 6, CREAM[0], 0.9);
    ctx.restore();
    for (const [cx, cy, k] of [[-7.4, 6, 0.6], [8.6, 7, 1]]) {
      ell(ctx, cx, cy, 2.5, 1.5);
      ctx.fillStyle = tone(a, '#ff9aa6', 0.4 * k + (q.blush ?? 0) * 0.35);
      ctx.fill();
    }
    eye(ctx, a, -2.6, -1.8, -1, f);
    eye(ctx, a, 10, -2.4, 1, f);
    brow(ctx, a, -2.8, -8.8, -1, (f.b?.[0] ?? 0) * 0.9);
    brow(ctx, a, 10, -9.6, 1, (f.b?.[1] ?? 0) * 0.9);
    // the nose: a small soft pink heart-ish button
    smooth(ctx, [[15.6, 1.4], [18.2, 1], [18.4, 2.2], [17, 3.4], [15.8, 2.6]]);
    ctx.fillStyle = tone(a, '#f08a98');
    ctx.fill();
    ell(ctx, 16.8, 1.5, 0.6, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    mouth(ctx, a, 16.8, 4.6, f.m);
    for (const [dy, c] of [[-0.8, -1.6], [0.6, -0.2], [2, 1.2]]) {
      ctx.beginPath();
      ctx.moveTo(18.4, 4.2 + dy);
      ctx.quadraticCurveTo(22.6, 3.6 + dy + c * 0.4, 26.2, 4 + dy + c);
      pen(ctx, tone(a, '#ffffff', 0.85), 0.3);
      ctx.stroke();
    }
  }
  bandana(ctx, a, mode);
  ctx.restore();
}

// ---------- Its clothes ----------
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
// Over the body: the shirt's stripes, the trousers' waist, the red sash and its knot.
function shirt(ctx, a, mode, D) {
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
  // the stripes: soft periwinkle bands across the shirt
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const y0 = st[1] + 4 + i * 3.6;
    ctx.moveTo(...C([st[0] - 30, y0]));
    ctx.quadraticCurveTo(...C([st[0], y0 + 1.2]), ...C([st[0] + 30, y0]));
    pen(ctx, tone(a, STRIPE, 0.75), 1.15);
    ctx.stroke();
  }
  const c0 = C([st[0] + 4, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 6, SHIRT[0], 0.6);
  // the trousers from the hips down
  poly(ctx, [W([w[0] - 40, w[1] + 3]), W([w[0] + 40, w[1] + 3]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, TROU[1]);
  ctx.fill();
  // the red sash, its knot at the near hip
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 40, w[1] + 2.4]));
  ctx.lineTo(...W([w[0] + 40, w[1] + 2.4]));
  pen(ctx, tone(a, RED[2]), 2.6);
  ctx.stroke();
  pen(ctx, tone(a, RED[1]), 1);
  ctx.stroke();
  ctx.restore();
}
// The sash's knot and its two ends, over the near hip (they swing a little).
function sashKnot(ctx, a, mode, D) {
  const w = D.J.waist;
  const p = ptOf(a, D, 'waistB', [w[0] + 9, w[1] + 2.4]);
  const sw = (a.gl ?? {}).knot ?? 0;
  ctx.save();
  ctx.translate(...p);
  for (const [ang, l] of [[1.9 + sw * 0.2, 3.6], [1.4 + sw * 0.3, 3]]) {
    ctx.save();
    ctx.rotate(ang);
    smooth(ctx, [[0, -0.7], [l, -0.8], [l + 0.4, 0.6], [0, 0.7]]);
    paint(ctx, a, mode, RED[2]);
    ctx.restore();
  }
  ell(ctx, 0, 0, 1.2, 1);
  paint(ctx, a, mode, RED[3]);
  ctx.restore();
}
// A soft stripe round each sleeve.
function sleeve(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  const S0 = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  for (const [P, Q, u] of [[S0, E, 0.55], [E, Wr, 0.35]]) {
    const p = [mix(P[0], Q[0], u), mix(P[1], Q[1], u)];
    const ang = Math.atan2(Q[1] - P[1], Q[0] - P[0]);
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(ang);
    const hw = k === 'F' ? 1.3 : 1.5;
    smooth(ctx, [[-0.45, -hw], [0.45, -hw], [0.45, hw], [-0.45, hw]]);
    ctx.fillStyle = tone(a, STRIPE, 0.85);
    ctx.fill();
    ctx.restore();
  }
}
// Its long striped tail, up in a question mark, a cream tip.
const TAIL_PTS_A = [[74, 115], [65, 112], TAIL_B];
const TAIL_PTS_B = [[54, 92], [57, 82], [63, 79]];
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const c = ribbon(ctx, pts, [5.6, 5.4, 5.2, 5, 4.8, 4.6].map((w) => w * D.SC * 1.5));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (const u of [0.25, 0.45, 0.65]) {
    const i = Math.round(u * (c.length - 1));
    const p = c[i];
    const p0 = c[Math.max(0, i - 1)];
    const an = Math.atan2(p[1] - p0[1], p[0] - p0[0]);
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(an);
    ell(ctx, 0, 0, 1.1, 4);
    ctx.fillStyle = tone(a, BAND, 0.75);
    ctx.fill();
    ctx.restore();
  }
  const tip = c[c.length - 1];
  ell(ctx, tip[0], tip[1], 3, 3);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ctx.restore();
}
// The blunderbuss (hand space): along +x from its grip, the barrel and its bell; the stock back the other way.
function gunAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0], y: p[1], ang: a.gl?.gunAng ?? 1.1 };
}
function gun(ctx, a, mode, D) {
  const G = gunAt(a, D);
  ctx.save();
  ctx.translate(G.x, G.y);
  ctx.rotate(G.ang);
  const parts = [
    // the stock, curving back from the grip
    [() => smooth(ctx, [[-1.2, -1], [-5, -0.6], [-8.6, 0.6], [-9, 2.6], [-5.6, 2.4], [-1.2, 1.2]]), WOOD[1]],
    // the barrel
    [() => smooth(ctx, [[0, -0.9], [8, -0.8], [8, 0.8], [0, 0.9]]), BRASS[2]],
    // the bell
    [() => smooth(ctx, [[7.6, -0.9], [10.4, -2.4], [11.2, -2.6], [11.2, 2.6], [10.4, 2.4], [7.6, 0.9]]), BRASS[1]],
  ];
  for (const [shape, col] of parts) {
    shape();
    if (mode === 'line') paint(ctx, a, 'line', null, WOOD[2]);
    else {
      ctx.fillStyle = tone(a, col);
      ctx.fill();
    }
  }
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(0.6, -0.4);
    ctx.lineTo(7.6, -0.4);
    pen(ctx, tone(a, BRASS[0]), 0.4);
    ctx.stroke();
    ell(ctx, 11, 0, 0.7, 2.1);
    ctx.fillStyle = tone(a, '#5a4a5a');
    ctx.fill();
    ell(ctx, 9.6, -1.4, 0.7, 0.4, -0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    // the stock's grain and a brass band
    ctx.beginPath();
    ctx.moveTo(-2, 0.4);
    ctx.quadraticCurveTo(-5, 0.6, -8, 1.6);
    pen(ctx, tone(a, WOOD[0], 0.8), 0.35);
    ctx.stroke();
    ctx.fillStyle = tone(a, BRASS[1]);
    ctx.fillRect(-0.4, -1.1, 0.8, 2.2);
  }
  ctx.restore();
}
const bellAt = (a, D) => {
  const G = gunAt(a, D);
  return [G.x + Math.cos(G.ang) * 11.4, G.y + Math.sin(G.ang) * 11.4, G.ang];
};

// ---------- Its things in the world ----------
function puff(ctx, x, y, r, al) {
  dust(ctx, x, y, r, al, PUFF[0], PUFF[2]);
}
function coin(ctx, x, y, s, spin, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const wdt = Math.max(0.25, Math.abs(Math.cos(spin)));
  ell(ctx, x, y, s * wdt, s);
  ctx.fillStyle = GOLD[2];
  ctx.fill();
  ell(ctx, x, y, s * wdt * 0.78, s * 0.78);
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  ell(ctx, x - s * 0.3 * wdt, y - s * 0.3, s * 0.3 * wdt, s * 0.2);
  ctx.fillStyle = GOLD[0];
  ctx.fill();
  ctx.restore();
}
// A cloudball: a ball of cloud packed tight, a soft shade underneath.
function cloudBall(ctx, x, y, r, spin, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const an = (i / 5) * TAU;
    ctx.moveTo(Math.cos(an) * r * 0.45 + r * 0.6, Math.sin(an) * r * 0.45);
    ctx.ellipse(Math.cos(an) * r * 0.45, Math.sin(an) * r * 0.45, r * 0.6, r * 0.6, 0, 0, TAU);
  }
  pen(ctx, PUFF[2], 0.7);
  ctx.stroke();
  ctx.fillStyle = PUFF[1];
  ctx.fill();
  ctx.restore();
  glow(ctx, x - r * 0.3, y - r * 0.3, r * 0.8, '#ffffff', 0.9 * al);
}

// ---------- Its act and fight ----------
const PIECES = { load: 7.0, wash: 6.4, chase: 6.6, coin: 6.8 };
const ORDER = ['load', 'wash', 'chase', 'coin'];
const POOL = ['blast', 'bonk', 'bat'];
const MELEE = ['bonk', 'bat'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
const pick = (m, n) => (m.swingFar === true ? 'blast' : m.swingFar === false ? MELEE[n % 2] : POOL[n % POOL.length]);
const AIM = { shN: -78, elN: -40, hwN: 0, shF: -70, elF: -60, hwF: 0 };

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL, pick);
  const now = F.now;
  const q = { face: null, tailRot: 0, tailCurl: 0, earFlat: 0, blush: 0, knot: 0, gunAng: 1.15, powder: -1, rod: 0, rodY: 0, ballIn: -1, coinS: -1, boom: -1, bonkS: -1, batS: -1, smoke: -1, sweat: -1, zz: 0, flipNow: false };
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
  const aimGun = (ang, k) => {
    q.gunAng = mix(q.gunAng, ang, k);
  };
  const { alive, mvName, W, s, hurt, ago, fighting, napping, cine, low } = F;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const U = a[`tk${ID}U`] ?? 0;
  const br = c.breath ?? 0;
  // Standing: the blunderbuss hanging from its near paw, muzzle down and forward; the far paw on its hip.
  go({ shN: -18 + br * 1.4, elN: -30, hwN: 0, shF: 20 + br, elF: -100, hwF: -20, head: -1, chest: -br * 0.6 }, 1);
  add({ tilt: 3, shN: Math.sin(U * TAU * 2) * 8 }, walking);
  q.tailRot = Math.sin(t * 0.6) * 0.05 + Math.sin(U * TAU * 2 + 0.6) * 0.06 * walking;
  q.tailCurl = Math.sin(t * 0.8 + 1) * 0.08;
  q.knot = Math.sin(t * 1.1) * 0.3 + Math.sin(U * TAU * 2) * 0.6 * walking;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);

  if (k > 0.001 && piece === 'load') {
    // muzzle up, held at its chest
    const hold = win(pu, 0.2, 0.6, 6.0, 6.6);
    go({ shN: -40, elN: -110, hwN: 0, head: 4 }, hold * k);
    aimGun(-1.45, hold * k);
    // a pinch of powder poured
    const pw = win(pu, 0.6, 0.9, 1.6, 1.9);
    go({ shF: -130, elF: -40, hwF: -20 }, pw * k);
    say('load', win(pu, 0.4, 0.7, 1.8, 2.0) * k);
    if (pu > 1.0 && pu < 2.2) q.powder = pu - 1.0;
    // the ramrod tamped down three times
    const rd = win(pu, 1.9, 2.2, 4.0, 4.3);
    const tp = Math.max(0, Math.sin((pu - 2.2) * 9.4));
    go({ shF: -150 + tp * 20, elF: -30 - tp * 20, hwF: 0 }, rd * k);
    q.rod = rd * k;
    q.rodY = tp;
    say('tamp', rd * k);
    // a cloudball dropped in, a proud pat
    if (pu > 4.2 && pu < 5.0) q.ballIn = pu - 4.2;
    const pt = win(pu, 5.0, 5.3, 6.4, 6.8);
    go({ shF: -60 + Math.sin(pu * 14) * 8, elF: -110, chest: -3, head: -3 }, pt * k);
    say('proud', pt * k);
  }
  if (k > 0.001 && piece === 'wash') {
    // a paw licked
    const lk = win(pu, 0.2, 0.5, 1.4, 1.7);
    go({ shF: -60, elF: -130, hwF: -30, head: 6 }, lk * k);
    say('lick', lk * k);
    // and the face washed, round and round
    const ws = win(pu, 1.6, 1.9, 5.4, 5.8);
    const rr = pu * 7;
    go({ shF: -100 + Math.sin(rr) * 14, elF: -120 + Math.cos(rr) * 10, hwF: -20, head: 8 + Math.sin(rr) * 3, neckR: 4 }, ws * k);
    say('wash', ws * k);
    q.earFlat = Math.max(q.earFlat, 0.3 * ws * k);
  }
  if (k > 0.001 && piece === 'chase') {
    // its tail tip twitches
    const tw = win(pu, 0.2, 0.4, 1.2, 1.4);
    q.tailCurl += Math.sin(pu * 20) * 0.3 * tw * k;
    // it notices, stares
    const nt = win(pu, 0.8, 1.1, 2.6, 2.8);
    go({ head: 10, neckR: -8, lift: -0.03, tilt: 6 }, nt * k);
    say(pu < 1.5 ? 'twitch' : 'stalk', nt * k);
    q.tailCurl += Math.sin(pu * 13) * 0.2 * nt * k;
    // swats at it
    const sw2 = win(pu, 2.6, 2.75, 3.1, 3.3);
    go({ shF: -40, elF: -20, hwF: 20, tilt: 10, head: 12 }, sw2 * k);
    // spins after it: two clean mirror flips, a little hop each
    const sp = win(pu, 3.2, 3.4, 4.6, 4.8);
    if (pu > 3.45 && pu < 4.55) q.flipNow = Math.floor((pu - 3.45) / 0.28) % 2 === 0;
    add({ hop: Math.abs(Math.sin((pu - 3.4) * 11.2)) * 0.03 * sp }, k);
    go({ shF: -60, elF: -40, tilt: 6 }, sp * k);
    say('spin', sp * k);
    // stops, embarrassed
    const em = win(pu, 4.8, 5.0, 6.2, 6.6);
    go({ shF: -40, elF: -120, hwF: -20, head: 6 }, em * k);
    say('embarrassed', em * k);
    q.blush = Math.max(q.blush, em * k);
  }
  if (k > 0.001 && piece === 'coin') {
    // a doubloon from its sash
    const gt = win(pu, 0.2, 0.5, 1.0, 1.2);
    go({ shF: -10, elF: -60, hwF: -20, head: 8 }, gt * k);
    // flipped high...
    const fl = win(pu, 1.1, 1.3, 2.8, 3.0);
    go({ shF: -110, elF: -30, hwF: 0, head: -12 }, fl * k);
    say('coin', fl * k);
    if (pu > 1.2 && pu < 6.4) q.coinS = pu - 1.2;
    // ...caught, bitten to test it
    const bt = win(pu, 3.0, 3.2, 4.4, 4.6);
    go({ shF: -60, elF: -130, hwF: -20, head: 6 }, bt * k);
    say('bite', bt * k);
    // a grin
    const gr = win(pu, 4.5, 4.8, 6.3, 6.8);
    go({ shF: -40, elF: -110, chest: -3, head: -3 }, gr * k);
    say('grin', gr * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the gun shouldered, aiming (eased in and out) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ ...AIM, tilt: 4, head: 2, lift: -0.02 }, hw);
    aimGun(0.05, hw);
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.earFlat = Math.max(q.earFlat, 0.8);
    q.tailRot += 0.3;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.55) / 0.4)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'blast') {
      // shouldered, one eye shut to aim, its tail lashing
      go({ ...AIM, tilt: 2, head: 3 }, wu);
      aimGun(0, sstep(W));
      q.tailCurl += Math.sin(now * 9) * 0.25 * W;
      say('aim', W);
      // BOOM: the recoil rocks it back on its heels
      if (s >= 0) {
        const kick = Math.sin(Math.PI * clamp(s / 0.45, 0, 1));
        go({ ...AIM, tilt: -10 * kick, chest: -6 * kick, head: -8 * kick, x: -0.06 * kick, toeN: -10 * kick, toeF: -8 * kick }, sw);
        aimGun(-0.6 * kick, sw);
        q.earFlat = Math.max(q.earFlat, 0.7 * kick);
        q.boom = s;
        say('shout', win(s, 0, 0.03, 0.3, 0.45));
      }
    } else if (mvName === 'bonk') {
      // swung up by its barrel, up on its toes
      go({ shN: -170, elN: -30, hwN: 0, shF: -150, elF: -40, tilt: -8, chest: -4, head: -6, lift: 0.03, toeN: 18, toeF: 16 }, wu);
      aimGun(-2.9, sstep(W));
      say('focus', W);
      // then the stock bonked down at you
      if (s >= 0) {
        go({ shN: -60, elN: -10, shF: -50, elF: -20, tilt: 18, chest: 6, head: 6, x: 0.06, lift: -0.02 }, sw);
        aimGun(mix(-2.9, -3.9, snap), sw);
        q.bonkS = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    } else {
      // a low kitten crouch, its rear wiggling
      const wg = Math.sin(now * 16) * W;
      go({ lift: -0.08, tilt: 18, head: 6, pelvis: wg * 4, shF: -40, elF: -80, shN: -20, elN: -30 }, wu);
      q.tailRot += wg * 0.12;
      q.tailCurl += wg * 0.2;
      say('wiggle', W);
      // two quick bats of its free paw: whap whap
      if (s >= 0) {
        const b1 = win(s, 0, 0.05, 0.14, 0.2);
        const b2 = win(s, 0.2, 0.26, 0.36, 0.44);
        go({ lift: -0.03, tilt: 10, x: 0.06, shF: -70, elF: -60 }, sw);
        go({ shF: -100, elF: -10, hwF: 20 }, Math.max(b1, b2) * sw);
        q.batS = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: a hiss, ears flat -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shF: -40, elF: -110, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.tailCurl += 0.4 * kh;
  }
  // ----- After landing a hit: it blows the cloud wisp off the bell, smug -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.3 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 1.0, 1.3) * (1 - F.moveW);
    go({ shN: -60, elN: -120, hwN: 0, head: 4, chest: -3 }, kg);
    aimGun(-1.3, kg);
    q.smoke = gl;
    say('smug', kg);
  }
  // ----- A nap (its habitat): sat down, its tail round its paws, chin on its chest -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    go({ lift: -0.2 + Math.sin(now * 1.3) * 0.004, tilt: 8, head: 18 + Math.sin(now * 1.3) * 2, chest: 3, shN: -40, elN: -60, shF: -30, elF: -90, fxN: 0.3, fxF: 0.2, fyN: 0.02, fyF: 0.02 }, nw);
    aimGun(0.3, nw);
    q.tailRot -= 0.5 * nw;
    q.tailCurl -= 0.5 * nw;
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
    q.earFlat = 0.8;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.4);
  // (the blunderbuss's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly,
  // never leaping on the first frame of a wind-up; a full turn's gap is unwound, never spun back)
  {
    let x = st.k_gunX ?? q.gunAng;
    let v = st.k_gunV ?? 0;
    while (q.gunAng - x > Math.PI) x += TAU;
    while (x - q.gunAng > Math.PI) x -= TAU;
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    const K = mvName ? 320 : 260;
    for (let i = 0; i < n; i++) {
      v += (K * (q.gunAng - x) - 2 * Math.sqrt(K) * v) * h;
      x += v * h;
    }
    st.k_gunX = x;
    st.k_gunV = v;
    q.gunAng = x;
  }
  easeKeys(st, q, ['tailRot', 'tailCurl', 'earFlat', 'blush', 'knot', 'rod'], dt, (key) => (key.startsWith('tail') ? 9 : key === 'knot' ? 6 : 12));
  q.calm = k;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little curled scrap of treasure map.
const BUBBLE = [[-5.6, -5], [5.2, -5.6], [6, -1], [5.6, 4.4], [3.4, 6], [-1, 5.2], [-5.8, 5]];
const BCOL = [INK, '#fff6e2', RED[3], '#7a6a8a'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.41;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const [bx0, by0, bang0] = bellAt(a, D);
  const [fh, fv] = ptOf(a, D, 'handF', D.J.handF);
  // a pinch of powder: a soft grey puff off the bell
  if ((q.powder ?? -1) >= 0 && q.powder < 1.2) {
    const e = q.powder / 1.2;
    dust(ctx, bx0 + 1, by0 - 1 - e * 4, 1 + e * 2, (1 - e) * 0.7, '#f0eef6', '#c8c2d8');
  }
  // the ramrod, tamped down the barrel from its far paw
  if ((q.rod ?? 0) > 0.05) {
    ctx.save();
    ctx.globalAlpha *= clamp(q.rod * 1.5, 0, 1);
    // (along the gun's own line, out of the bell, sliding in and out as it's tamped)
    const dx = Math.cos(bang0);
    const dy = Math.sin(bang0);
    const in0 = -3 + (1 - q.rodY) * 3;
    ctx.beginPath();
    ctx.moveTo(bx0 + dx * in0, by0 + dy * in0);
    ctx.lineTo(bx0 + dx * (in0 + 9), by0 + dy * (in0 + 9));
    pen(ctx, WOOD[2], 1);
    ctx.stroke();
    pen(ctx, WOOD[0], 0.4);
    ctx.stroke();
    ctx.restore();
  }
  // a cloudball dropped in the bell
  if ((q.ballIn ?? -1) >= 0 && q.ballIn < 0.8) {
    const e = q.ballIn / 0.8;
    cloudBall(ctx, bx0, by0 - 5 + e * 5, 1.4, e * 3, 1 - sstep((e - 0.7) / 0.3));
  }
  // the doubloon: flipped high, caught, bitten, put away
  if ((q.coinS ?? -1) >= 0) {
    const e = q.coinS;
    if (e < 1.8) {
      const u = e / 1.8;
      const y = fv - 3 - Math.sin(Math.PI * u) * 20;
      coin(ctx, fh + Math.sin(Math.PI * u) * 2, y, 1.4, e * 14);
      if (u > 0.4 && u < 0.6) sparkle(ctx, fh + 2, y - 2, 1.4, 1, GOLD[0]);
    } else if (e < 4.6) coin(ctx, fh + 0.6, fv - 1.6, 1.4, 0.3);
  }
  // ----- Blunderblast: BOOM, a soft cloud bursting from the bell, the cloudball away -----
  if ((q.boom ?? -1) >= 0 && q.boom < 0.9) {
    if (!a.mo.kBell) a.mo.kBell = [bx0, by0];
    const [bx, by] = a.mo.kBell;
    const e = q.boom / 0.9;
    for (let i = 0; i < 4; i++) {
      const an = -0.8 + i * 0.5;
      puff(ctx, bx + 2 + Math.cos(an) * (2 + e * 7), by + Math.sin(an) * (2 + e * 5) - e * 2, 1.6 + e * 2.4, (1 - e) * 0.9);
    }
    star(ctx, bx + 1, by, 3 * Math.sin(Math.PI * clamp(e * 3, 0, 1)), q.boom * 3, 1 - sstep(e * 3));
    if (q.boom < 0.45) {
      const u = q.boom / 0.45;
      cloudBall(ctx, bx + 4 + u * 36, by - Math.sin(Math.PI * u) * 3, 2, u * 8, 1 - sstep((u - 0.8) / 0.2));
    }
  } else a.mo.kBell = null;
  // ----- Stock Bonk: a ring of sparkles where the stock comes down -----
  if ((q.bonkS ?? -1) >= 0 && q.bonkS > 0.05 && q.bonkS < 0.6) {
    const G = gunAt(a, D);
    const sx = G.x - Math.cos(G.ang) * 8;
    const sy = G.y - Math.sin(G.ang) * 8;
    if (!a.mo.kBonk) a.mo.kBonk = [sx, sy];
    const [px, py] = a.mo.kBonk;
    const u = (q.bonkS - 0.05) / 0.55;
    for (let i = 0; i < 5; i++) {
      const an = (i / 5) * TAU + 0.4;
      sparkle(ctx, px + Math.cos(an) * (3 + u * 7), py + Math.sin(an) * (3 + u * 5), 1.4 * (1 - u), 1, i % 2 ? GOLD[0] : '#ffffff');
    }
  } else a.mo.kBonk = null;
  // ----- Paw Bat: two quick soft swipe arcs -----
  if ((q.batS ?? -1) >= 0 && q.batS < 0.6) {
    for (const [t0, dy] of [[0.04, -3], [0.24, 2]]) {
      const u = (q.batS - t0) / 0.24;
      if (u < 0 || u > 1) continue;
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * u);
      ctx.beginPath();
      ctx.arc(fh - 2, fv + dy, 6, -1.2, 0.6);
      pen(ctx, '#ffffff', 1.6);
      ctx.stroke();
      pen(ctx, FUR[1], 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
  // gloat: the cloud wisp blown off the bell
  if ((q.smoke ?? -1) >= 0 && q.smoke < 1.3) {
    // (the wisp left where it was blown off the bell, drifting up from there)
    if (!a.mo.kSmoke) a.mo.kSmoke = [bx0, by0];
    const e = q.smoke / 1.3;
    puff(ctx, a.mo.kSmoke[0] + e * 3, a.mo.kSmoke[1] - 2 - e * 7, 1.2 + e * 1.4, Math.sin(Math.PI * e) * 0.8);
  } else a.mo.kSmoke = null;
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#b08a7a', '#fffaf2');
    }
  }
  const [mbx, mby] = headAt(a, D, [4, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, mbx, mby, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, mbx, mby, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  void t;
  ctx.globalAlpha = base;
}

// Its shot (render/dreamfx.js dreamShot, `cloudball`): a cloudball tumbling through the air, a couple of
// small soft puffs trailing it.
export function cloudBallShot(ctx, shot, x, y, p, d) {
  if (shot !== 'cloudball') return false;
  for (let i = 1; i <= 2; i++) dust(ctx, x - d * i * 4, y + Math.sin(p * 10 + i) * 0.8, 1.6 - i * 0.4, 0.7 - i * 0.2, PUFF[0], PUFF[2]);
  cloudBall(ctx, x, y, 2.4, p * 10 * d);
  return true;
}

const DRESS = {
  id: ID,
  // (the skin is its shirt, sleeves and all; its trousers the legs' own skin; its own ginger paws and feet)
  skin: {
    lt: SHIRT[0], base: SHIRT[1], sh: SHIRT[2], deep: SHIRT[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: TROU[0], base: TROU[1], sh: TROU[2], deep: TROU[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
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
    handNskin: (ctx, a, mode, S, D) => gun(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      shirt(ctx, a, mode, D);
      sashKnot(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('kitten', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (the chase's spins: clean mirror flips, never a squeeze)
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
export const BLUNDERPUSS_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const BLUNDERPUSS_SIZE = { w: 26, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
