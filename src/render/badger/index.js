// The Cocoa Badger (2026-11-27, the Candy Volcano's Chocolate Knight remade from scratch as a new creature;
// the id stays `chocoknight`). A stout little badger who digs the Licorice Mine: badgers are the world's
// best diggers, and this one digs for cocoa beans in the chocolate rock. It wears a miner's cocoa-brown
// coverall, a helmet that is really an upturned cupcake case with a birthday candle stuck on the front for
// a lamp, and carries a pickaxe of rock candy on a licorice handle. It takes its lunch break very
// seriously. On its own copy of the creature base (rig.js; body.js `badger`: a stocky wide body, short
// thick legs, short strong arms), dressed here: the base's own skin is its coverall (cut by the body's
// own outline, so the sleeves and trouser legs are really worn), its head, paws, boots, helmet, pick and
// tail drawn here from scratch over the mannequin (never the shared face, never the hero).
//   look    a cream face with two soft licorice-plum stripes sweeping back from its snout over its head
//           (its eyes sit on the cream, clear of them), grey cheeks, little round ears tipped in cream; a
//           big round plum nose on a long soft snout; its own eyes ("lantern eyes": wide warm ovals, a
//           toffee-amber iris with a darker ring, a teardrop glint like a candle flame, a short sturdy
//           lash line with a dip at the corner); thick round cream brows; a coverall in cocoa brown with a
//           bib pocket (a cocoa bean stitched on it), two buttons, a belt with a coil of licorice rope,
//           rolled cuffs; toffee boots; grey paws with soft round claws; the cupcake-case helmet (pleated
//           pink foil, a rim) with its candle and a little flame; the pick; a short fluffy grey tail. Its
//           own soft cocoa outline, outer edge only, face bare.
//   walk    the base's walk at a sturdy plod, its pick held up before it, its candle flame leaning back.
//   idle    a 28 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - chip (7.8 s): a lump of chocolate rock; it chips at it twice, chips flying; a cocoa bean!
//             held up, looked at, polished on its chest and tucked in its bib pocket, proud;
//           - lunch (7.4 s): its pick planted in the ground, a cookie sandwich out of its pocket; it
//             munches, crumbs falling; a pat of its tummy, content; the pick picked up again;
//           - candle (6.6 s): its candle flickers low; it looks up cross-eyed, cups a paw round it and
//             blows ever so gently; the flame comes back bigger; phew, a paw across its brow;
//           - stretch (6.4 s): its free paw stretched high, a big twisting stretch one way and the
//             other, a yawn, a satisfied huff.
//   moves   Pick Chop (the pick raised high over its head, a long slow wind-up; then chopped down in
//           front, chocolate chips and a sugar sparkle flying); Shoulder Barge (its shoulder dropped,
//           braced; then a short charge, a puff of dust); Lamp Flare (its head ducked, the candle flame
//           swelling; then a nod and a warm burst of light).
//   else    hurt: a wince, the flame ducking, ears back; after landing a hit: the pick hefted up with a
//           proud huff; hunting you: pick held ready across its body, head low; low on health: worried, a
//           bead of sweat, its flame small; a nap (habitat): sat down, chin on its chest, its candle
//           burning low, z's; beaten: dizzy, the flame out (a curl of smoke). Its marks over its head (!,
//           ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: chocolate chips as soft rounded chunks, the
// flame and its light a warm soft glow (it gives off light), dust as soft cocoa puffs.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee } from './act.js';

const BIG = 1.24;
const LW = 1.6 / BIG;
const INK = '#7a4a3a';
const SUIT = ['#d6a07c', '#b07656', '#8a5640', '#683a2c'];
const FACE = ['#fffcf6', '#f6eee4', '#e0d2c8'];
const GREY = ['#e2dce4', '#bdb2c0', '#988aa0'];
const STRIPE = ['#6a5468', '#54405a'];
const NOSE = ['#7a4a6a', '#5c3450'];
const LASH = '#40283a';
const IRIS = ['#3a1c10', '#7a4418', '#c07a2a', '#f4c060'];
const CASE = ['#ffe4ee', '#ffbcd4', '#e892b2'];
const CANDLE = ['#fffaf4', '#ff9cbc'];
const FLAME = ['#fff8d8', '#ffd86a', '#ff9a4a'];
const BOOT = ['#f4c48c', '#d49a5e', '#a8703e'];
const PICK = ['#ffe4f0', '#ffb0d0', '#e07aa8'];
const LICO = ['#7a5a7a', '#4e3a54'];
const CHOC = ['#a8704e', '#7a4a32', '#5a3424'];

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
const ID = 'cocoabadger';
const NECK = [80.9, 87.3];
const HS = 1.32;
const HO = [1.5, -15.4];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [70.4, 116];
const JOINTS = { tailA: TAIL_A };
const PIV2 = { tailA: 'tailA' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 90, c: 6, gain: 0.4, turn: 0.7, hang: 0.1, max: 12, flutter: 1, hz: 0.45, dir: [-5, 3] } },
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
  calm: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.8], m: 'open' },
  focus: { e: 'open', g: [1.2, 0.8], b: [-0.4, 1.4], m: 'set' },
  chip: { e: 'squeeze', b: [-0.4, 1.4], m: 'grit' },
  find: { e: 'wide', g: [0.8, 1.2], b: [-1.6, -1.8], m: 'o' },
  admire: { e: 'open', g: [1, -0.8], b: [-1, -1.2], m: 'smile' },
  proud: { e: 'happy', b: [-0.8, -0.4], m: 'grin' },
  munch: { e: 'happy', b: [-0.4, -0.6], m: 'chew' },
  munchB: { e: 'happy', b: [-0.4, -0.6], m: 'open' },
  content: { e: 'happy', b: [-0.8, -1.2], m: 'smile' },
  cross: { e: 'open', g: [0.2, -2], g2: [1.6, -2], b: [-1.2, -1.6], m: 'o' },
  blow: { e: 'shut', b: [-0.2, -0.6], m: 'blow' },
  phew: { e: 'happy', b: [0.8, -1.2], m: 'smile' },
  stretch: { e: 'squeeze', b: [-0.6, -0.8], m: 'yawn' },
  huff: { e: 'happy', b: [-0.8, -0.2], m: 'puff' },
  fierce: { e: 'open', g: [1.5, 0.4], b: [-1, 2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
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
const SHUTS = new Set(['happy', 'chip', 'proud', 'munch', 'munchB', 'content', 'blow', 'phew', 'stretch', 'huff', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A candle-flame glint: a little teardrop, point up.
function flameGlint(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.5);
  ctx.quadraticCurveTo(x + s * 1.1, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s * 1.1, y + s * 0.2, x, y - s * 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
// One lantern eye (head units): a wide warm oval. o +1 on its nose's side.
function eye(ctx, a, x, y, o, f, g) {
  const w = 4.2;
  const h = 3.7;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1], [x, y - h * 1.3], [x + w, y + 1], 1.5, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.3], 1.4, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.2], [x + w * 0.2 * o, y + 1.1], [x + w * 0.9 * o, y + 0.4], 1.25, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 2.6 : 2)], [x + w, y], 1.45, LASH);
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
    stroke3(ctx, a, [x - w, y - h * 0.4], [x, y - h * 1.3], [x + w, y - h * 0.4], 1.45, LASH);
    return;
  }
  const [gx, gy] = g ?? [0.5, 0.3];
  ctx.save();
  ell(ctx, x, y, w * big, h * big);
  ctx.clip();
  const ix = x + gx * 0.8;
  const iy = y + gy * 0.5;
  const ir = h * 0.92 * big;
  ell(ctx, ix, iy, ir, ir);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ir * 0.24, ir * 0.78, ir * 0.66);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ir * 0.56, ir * 0.48, ir * 0.26);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ell(ctx, ix, iy, ir * 0.42, ir * 0.42);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  flameGlint(ctx, ix - 1 * o, iy - 0.8, 0.95 * big);
  ell(ctx, ix + 1.3 * o, iy + 1.3, 0.45, 0.42);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
  // a short sturdy lash line over the top, a little dip down at its outer corner
  stroke3(ctx, a, [x - w * 1.0 * o, y - h * 0.3], [x - w * 0.1 * o, y - h * 1.36], [x + w * 0.86 * o, y - h * 0.7], 1.45, LASH);
  stroke3(ctx, a, [x + w * 0.8 * o, y - h * 0.76], [x + (w + 0.7) * o, y - h * 0.62], [x + (w + 1.2) * o, y - h * 0.1], 1.0, LASH);
}
// Thick round cream brows (they show up on the stripes).
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.4, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1 + (bo + bi) * 0.35, x + o * 2.4, y + bo * 0.7);
  pen(ctx, tone(a, FACE[0]), 2);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#8a4a5a';
  const DARK = '#6a2e44';
  const line = (pts, w = 0.8) => {
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
    ell(ctx, x, y + h * 0.78, w * 0.58, h * 0.34);
    ctx.fillStyle = tone(a, '#ff9cb4');
    ctx.fill();
  };
  switch (m) {
    case 'smile':
      line([[x - 2.4, y - 0.4], [x - 1.2, y + 1.3], [x, y + 0.4], [x + 1.2, y + 1.3], [x + 2.4, y - 0.4]]);
      break;
    case 'open':
      open(2.2, 2.2);
      break;
    case 'grin':
      open(2.6, 2);
      for (const d of [-0.6, 0.6]) {
        smooth(ctx, [[x + d - 0.5, y], [x + d + 0.5, y], [x + d + 0.45, y + 0.9], [x + d - 0.45, y + 0.9]]);
        ctx.fillStyle = tone(a, '#ffffff');
        ctx.fill();
      }
      break;
    case 'grit':
      line([[x - 2.2, y + 0.4], [x, y + 0.1], [x + 2.2, y + 0.4]], 1);
      break;
    case 'chew':
      line([[x - 2, y + 0.4], [x - 0.8, y + 1.2], [x + 0.4, y + 0.6], [x + 1.4, y + 1.1], [x + 2, y + 0.2]], 0.8);
      break;
    case 'o':
      ell(ctx, x, y + 0.9, 1.1, 1.2);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'blow':
      ell(ctx, x + 0.5, y + 0.7, 0.8, 0.7);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'yawn':
      open(2, 3.4);
      break;
    case 'puff':
      line([[x - 2, y + 0.6], [x, y + 1], [x + 2, y + 0.4]], 0.8);
      break;
    case 'set':
      line([[x - 2, y + 0.6], [x, y], [x + 2, y + 0.6]], 0.9);
      break;
    case 'shout':
      open(2.6, 2.8);
      break;
    case 'wobble':
      line([[x - 2.2, y + 0.4], [x - 1.1, y - 0.4], [x, y + 0.3], [x + 1.1, y - 0.4], [x + 2.2, y + 0.4]], 0.75);
      break;
    case 'frown':
      line([[x - 2, y + 0.9], [x, y - 0.2], [x + 2, y + 0.9]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.8, 0.6);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'talkA':
      open(1.8, 1.9);
      break;
    case 'talkE':
      open(2.2, 1.1);
      break;
    default:
      // at rest: a sturdy little "w", one corner a touch higher
      line([[x - 2.2, y + 0.1], [x - 1.1, y + 1], [x, y + 0.3], [x + 1.1, y + 1], [x + 2.2, y - 0.3]], 0.78);
  }
}
// The head: broad and round, a long soft snout ahead.
const SKULL = [[-18, 2], [-17, -8], [-11, -14.6], [-2, -17], [8, -15.6], [14.6, -10.6], [19, -4], [23.4, 1], [24.6, 6.6], [21, 11.4], [12, 14.6], [0, 15.4], [-10, 13.6], [-15.6, 9]];
function ear(ctx, a, mode, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ell(ctx, 0, -2.6, 4.2, 4);
  paint(ctx, a, mode, GREY[1]);
  if (mode === 'fill') {
    ell(ctx, 0, -3.6, 3, 2.6);
    ctx.fillStyle = tone(a, FACE[0]);
    ctx.fill();
    ell(ctx, 0, -2.2, 1.8, 1.8);
    ctx.fillStyle = tone(a, STRIPE[1], 0.7);
    ctx.fill();
  }
  ctx.restore();
}
// The helmet: an upturned cupcake case, pleated pink foil, a rim, its candle on the front.
function helmet(ctx, a, mode, q) {
  const tip = q.helmTip ?? 0;
  ctx.save();
  ctx.translate(0, -14);
  ctx.rotate(tip);
  smooth(ctx, [[-16.6, 0.6], [-14.6, -6.4], [-8, -10.6], [1, -11.4], [9.6, -9.4], [15, -4.4], [16.6, 0.6], [0, 2.4]]);
  paint(ctx, a, mode, CASE[1]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -4, -8, 10, CASE[0], 0.9);
    // its pleats
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 4.4, 1);
      ctx.quadraticCurveTo(i * 4.2 + 0.3, -5, i * 2.6, -10.6);
      pen(ctx, tone(a, CASE[2], 0.5), 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the rim: a soft rolled band
  smooth(ctx, [[-18.4, 0.4], [-8, -1.6], [8, -1.6], [18.4, 0.4], [18, 2.6], [0, 1.8], [-18, 2.6]]);
  paint(ctx, a, mode, CASE[0]);
  ctx.restore();
}
function candle(ctx, a, mode, q) {
  const tip = q.helmTip ?? 0;
  ctx.save();
  ctx.translate(0, -14);
  ctx.rotate(tip);
  // a striped birthday candle stood on the front of the case
  smooth(ctx, [[8.6, -6.6], [11.2, -7], [11.6, -16.4], [9, -16.4]]);
  paint(ctx, a, mode, CANDLE[0]);
  if (mode === 'fill') {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(8.8, -8 - i * 3.2);
      ctx.lineTo(11.4, -9.4 - i * 3.2);
      pen(ctx, tone(a, CANDLE[1]), 1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(10.3, -16.4);
    ctx.lineTo(10.3, -17.8);
    pen(ctx, tone(a, '#6a5050'), 0.5);
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
  ear(ctx, a, mode, -13.6, -10.4, -0.7 - flat * 0.5);
  ear(ctx, a, mode, 7, -13.6, 0.3 + flat * 0.5);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FACE[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 2, -8, 15, FACE[0], 0.9);
    // grey cheeks and back of the head
    glow(ctx, -15, 6, 10, GREY[1], 0.8);
    // its two stripes sweeping back from the snout over its head (its eyes clear of them)
    smooth(ctx, [[16, -2], [10, -9.4], [0, -12.6], [-10, -12], [-18, -7], [-19, -1], [-12, -5.4], [-2, -7.6], [8, -6]]);
    ctx.fillStyle = tone(a, STRIPE[0]);
    ctx.fill();
    smooth(ctx, [[18.4, -0.4], [14, -4], [9, -5.4], [12, -2.4]]);
    ctx.fillStyle = tone(a, STRIPE[0]);
    ctx.fill();
    glow(ctx, -6, -11, 6, '#8a7488', 0.5);
    // the cream stripe up the middle, from its snout between its eyes over its crown, parting the dark
    // into two stripes (a badger's own markings)
    smooth(ctx, [[15.6, -1.2], [10, -6.6], [2.6, -10.6], [-6, -18], [-10, -17.6], [-2.6, -9.6], [6, -4.6], [12.6, -0.6]]);
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    ctx.restore();
    // cheeks
    for (const [cx, cy, k] of [[-8.6, 6.4, 0.7], [7.6, 6.8, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.6);
      ctx.fillStyle = tone(a, '#ff9cae', 0.42 * k);
      ctx.fill();
    }
    eye(ctx, a, -5.2, 0.4, -1, f, f.g2 ?? f.g);
    eye(ctx, a, 7.6, 0, 1, f, f.g);
    brow(ctx, a, -5.2, -5.4, -1, f.b);
    brow(ctx, a, 7.8, -5.8, 1, f.b);
    // the nose: a big round plum button with a glint
    smooth(ctx, [[20.6, 2], [24.6, 1.4], [26.2, 4], [24.4, 6.6], [21, 6]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 23, 2.6, 1.1, 0.55, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 20, 10.4, f.m);
  }
  helmet(ctx, a, mode, q);
  candle(ctx, a, mode, q);
  ctx.restore();
}
// Where its flame is (rig space).
const flameAt = (a, D) => {
  const q = a.gl ?? {};
  const tip = q.helmTip ?? 0;
  const [x, y] = [10.3, -18.4];
  return headAt(a, D, [x * Math.cos(tip) - y * Math.sin(tip), -14 + x * Math.sin(tip) + y * Math.cos(tip)]);
};

// ---------- Its body ----------
// The coverall's trim over the base's own skin (its colours): the bib with its pocket, buttons, the belt
// with its coil of licorice rope.
function coverall(ctx, a, mode, D) {
  if (mode !== 'fill' || !a.blTorsoPts) return;
  const q = a.gl ?? {};
  ctx.save();
  ctx.beginPath();
  a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.clip();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  // the bib
  smooth(ctx, [[74, 94], [92, 94], [94, 108], [74, 108]]);
  ctx.fillStyle = tone(a, SUIT[0]);
  ctx.fill();
  // its pocket, a cocoa bean stitched on it
  smooth(ctx, [[80, 99], [91, 99], [91, 106], [80, 106]]);
  ctx.fillStyle = tone(a, SUIT[1]);
  ctx.fill();
  ctx.setLineDash([0.8, 0.8]);
  smooth(ctx, [[80.6, 99.6], [90.4, 99.6], [90.4, 105.4], [80.6, 105.4]]);
  pen(ctx, tone(a, SUIT[0], 0.8), 0.4);
  ctx.stroke();
  ctx.setLineDash([]);
  ell(ctx, 85.6, 102.6, 2, 1.4, -0.3);
  ctx.fillStyle = tone(a, CHOC[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(84.4, 103.2);
  ctx.quadraticCurveTo(85.6, 102.2, 86.8, 102);
  pen(ctx, tone(a, CHOC[0]), 0.4);
  ctx.stroke();
  // a cocoa bean tucked in the pocket, peeping out once it's found one
  if ((q.beanIn ?? 0) > 0.02) {
    ell(ctx, 88.4, 99 - q.beanIn * 1.2, 1.4 * q.beanIn, 1.1 * q.beanIn, -0.6);
    ctx.fillStyle = tone(a, CHOC[0]);
    ctx.fill();
  }
  // two buttons
  for (const bx of [75.6, 92.2]) {
    ell(ctx, bx, 95.6, 1.2, 1.2);
    ctx.fillStyle = tone(a, BOOT[0]);
    ctx.fill();
  }
  // the belt and its buckle
  smooth(ctx, [[60, 109], [100, 109], [100, 113], [60, 113]]);
  ctx.fillStyle = tone(a, SUIT[3]);
  ctx.fill();
  smooth(ctx, [[84, 108.4], [89, 108.4], [89, 113.6], [84, 113.6]]);
  ctx.fillStyle = tone(a, BOOT[0]);
  ctx.fill();
  smooth(ctx, [[85.2, 109.6], [87.8, 109.6], [87.8, 112.4], [85.2, 112.4]]);
  ctx.fillStyle = tone(a, SUIT[3]);
  ctx.fill();
  // a coil of licorice rope on its hip
  for (let i = 0; i < 3; i++) {
    ell(ctx, 68 + i * 0.4, 115 + i * 0.6, 4.4 - i * 0.6, 3 - i * 0.3);
    pen(ctx, tone(a, LICO[0]), 1.1);
    ctx.stroke();
  }
  // seams and a soft fold or two
  ctx.beginPath();
  ctx.moveTo(80, 114);
  ctx.lineTo(80, 124);
  pen(ctx, tone(a, SUIT[2], 0.7), 0.5);
  ctx.stroke();
  glow(ctx, 70, 100, 8, SUIT[0], 0.35);
  ctx.restore();
  ctx.restore();
}
// Grey paws with soft round claws, out of the coverall's cuffs.
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const [x, y] = D.J[`hand${k}`];
  ell(ctx, x, y + 0.6, 5.4, 5);
  paint(ctx, a, mode, k === 'N' ? GREY[1] : GREY[2]);
  if (mode === 'fill') {
    ell(ctx, x - 1, y - 0.6, 3, 2.4);
    ctx.fillStyle = tone(a, k === 'N' ? GREY[0] : GREY[1], 0.8);
    ctx.fill();
    for (const dx of [-2.4, 0, 2.4]) {
      ell(ctx, x + dx, y + 5, 0.9, 1.3);
      ctx.fillStyle = tone(a, FACE[0]);
      ctx.fill();
    }
    // the cuff, rolled
    smooth(ctx, [[x - 5.6, y - 5.4], [x + 5.6, y - 5.4], [x + 5.4, y - 2.6], [x - 5.4, y - 2.6]]);
    ctx.fillStyle = tone(a, k === 'N' ? SUIT[0] : SUIT[1]);
    ctx.fill();
  }
  ctx.restore();
}
// Toffee boots over its feet, a rolled cuff of coverall above.
function boot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const [x, y] = D.J[`ank${k}`];
  smooth(ctx, [[x - 6.4, y - 3], [x + 4, y - 3.4], [x + 9.4, y + 1.6], [x + 9.6, y + 6.6], [x - 6.6, y + 6.6]]);
  paint(ctx, a, mode, k === 'N' ? BOOT[1] : BOOT[2]);
  if (mode === 'fill') {
    glow(ctx, x + 2, y, 5, BOOT[0], 0.7);
    smooth(ctx, [[x - 6.8, y + 4.6], [x + 9.8, y + 4.6], [x + 9.8, y + 6.8], [x - 6.8, y + 6.8]]);
    ctx.fillStyle = tone(a, SUIT[3]);
    ctx.fill();
    smooth(ctx, [[x - 6.6, y - 5.6], [x + 5, y - 5.6], [x + 5, y - 2.4], [x - 6.6, y - 2.4]]);
    ctx.fillStyle = tone(a, k === 'N' ? SUIT[0] : SUIT[1]);
    ctx.fill();
  }
  ctx.restore();
}
function tail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'tailA');
  const [x, y] = TAIL_A;
  smooth(ctx, [[x + 2, y - 2.6], [x - 4, y - 3.6], [x - 9.4, y - 1.4], [x - 10.4, y + 2.4], [x - 6, y + 4], [x + 1.6, y + 3]]);
  paint(ctx, a, mode, GREY[1]);
  if (mode === 'fill') glow(ctx, x - 6, y - 1.6, 4, GREY[0], 0.8);
  ctx.restore();
}
// The pick: a licorice handle with a pink rock-candy head, held in its near paw (`ang` its handle's
// turn in the paw's frame, base units).
function pick(ctx, a, mode, D) {
  const q = a.gl ?? {};
  if (q.noPick) return;
  ctx.save();
  enter(ctx, a, D, 'handN');
  const [x, y] = D.J.handN;
  ctx.translate(x, y);
  ctx.rotate(q.pickAng ?? 0);
  // the handle: a licorice twist from below its fist to the head
  smooth(ctx, [[-1.3, 9], [1.3, 9], [1.3, -24], [-1.3, -24]]);
  paint(ctx, a, mode, LICO[0]);
  if (mode === 'fill') {
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(-1.2, 7 - i * 3.5);
      ctx.lineTo(1.2, 5.6 - i * 3.5);
      pen(ctx, tone(a, LICO[1]), 0.6);
      ctx.stroke();
    }
  }
  // the head: a soft pink rock-candy crystal, a blade to each side
  smooth(ctx, [[-11, -22], [-6, -27.6], [0, -28.4], [6, -27.6], [12.6, -23], [7, -23.4], [0, -21.4], [-6, -23.4]]);
  paint(ctx, a, mode, PICK[1], '#b05a84');
  if (mode === 'fill') {
    smooth(ctx, [[-8, -24], [-4, -27], [2, -27.4], [5, -25.4], [0, -24.4]]);
    ctx.fillStyle = tone(a, PICK[0]);
    ctx.fill();
    ell(ctx, 0, -25, 2.4, 2.2);
    ctx.fillStyle = tone(a, LICO[1]);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Its things in the world ----------
function chunk(ctx, x, y, r, ang, al = 1) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-r, -r * 0.7], [r * 0.9, -r * 0.9], [r, r * 0.6], [-r * 0.8, r * 0.8]]);
    if (pass === 'line') {
      pen(ctx, CHOC[2], r * 0.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = CHOC[1];
      ctx.fill();
      ell(ctx, -r * 0.2, -r * 0.3, r * 0.4, r * 0.25);
      ctx.fillStyle = CHOC[0];
      ctx.fill();
    }
  }
  ctx.restore();
}
// A lump of chocolate rock on the ground (grown in solid, chipped down a little).
function rockLump(ctx, x, g, chip) {
  if (g <= 0.02) return;
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(g, g);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-6, 0.4], [-5.6, -4.4], [-2, -7.4 + chip], [3, -7 + chip * 0.6], [6.4, -3.6], [6.6, 0.4]]);
    if (pass === 'line') {
      pen(ctx, CHOC[2], 1.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = CHOC[1];
      ctx.fill();
      glow(ctx, -1, -5, 4, CHOC[0], 0.9);
      ell(ctx, 3, -2, 1, 0.8);
      ctx.fillStyle = '#ffd6e6';
      ctx.fill();
    }
  }
  ctx.restore();
}
// The pick stood in the ground, its head up (rig space).
function plantedPick(ctx, a, x) {
  ctx.save();
  ctx.translate(x, -2);
  ctx.rotate(0.12);
  ctx.scale(0.375, 0.375);
  for (const mode of ['line', 'fill']) {
    smooth(ctx, [[-1.3, 6], [1.3, 6], [1.3, -24], [-1.3, -24]]);
    paint(ctx, a, mode, LICO[0], INK, LW / 0.375);
    smooth(ctx, [[-11, -22], [-6, -27.6], [0, -28.4], [6, -27.6], [12.6, -23], [7, -23.4], [0, -21.4], [-6, -23.4]]);
    paint(ctx, a, mode, PICK[1], '#b05a84', LW / 0.375);
  }
  ctx.restore();
}
function cookie(ctx, x, y, s, bite) {
  if (s <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, Math.PI * 0.25 * bite, TAU - Math.PI * 0.25 * bite);
    if (bite > 0.05) ctx.lineTo(0.6, 0);
    ctx.closePath();
    if (pass === 'line') {
      pen(ctx, CHOC[2], 0.9);
      ctx.stroke();
    } else {
      ctx.fillStyle = CHOC[1];
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2.4, 0);
      ctx.lineTo(2.4 - bite * 2, 0);
      pen(ctx, '#fff6ee', 0.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { chip: 7.8, lunch: 7.4, candle: 6.6, stretch: 6.4 };
const ORDER = ['chip', 'lunch', 'candle', 'stretch'];
const POOL = ['chop', 'barge', 'flare'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
// (the pick's rest: held up before it, its head forward)
const SHOULDER = { shN: -18, elN: -126, hwN: -10 };
const PICK_REST = -2.5;

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, tailRot: 0, earFlat: 0, flame: 1, helmTip: 0, pickAng: PICK_REST, noPick: false, planted: 0, beanIn: st.kBean ?? 0, lump: -1, lumpChip: 0, chipS: -1, bean: -1, cookie: -1, crumbs: 0, puff: 0, smoke: 0, chopS: -1, bargeS: -1, flareS: -1, flareW: 0, sweat: -1, zz: 0 };
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
  const pickTo = (ang, k) => {
    q.pickAng += (ang - q.pickAng) * clamp(k, 0, 1);
  };
  const { alive, mvName, W, s, hurt, ago, fighting, napping, cine, low } = F;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const U = a[`tk${ID}U`] ?? 0;
  const toLeg = (c.H ?? 36) / Math.max(1, c.leg ?? 9.8);
  // Standing: the pick held up before it, the far paw on its belt, a slow breath. Walking: a sturdy plod.
  const br = c.breath ?? 0;
  go({ ...SHOULDER, shF: 10 + br, elF: -40, hwF: -10, head: 2, chest: -br * 0.6 }, 1);
  add({ tilt: 3, x: Math.abs(Math.sin(U * TAU * 2)) * 0.004 }, walking);
  q.tailRot = Math.sin(t * 0.7) * 0.06 + Math.sin(U * TAU * 2) * 0.12 * walking;
  q.flame = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 13.3) * 0.04;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  let sit = 0;

  if (k > 0.001 && piece === 'chip') {
    q.lump = sstep((pu - 0.1) / 0.4) * k * (1 - sstep((pu - 7.2) / 0.5));
    // it chips at it twice: up, and down
    for (const c0 of [0.8, 2.0]) {
      const up = win(pu, c0, c0 + 0.35, c0 + 0.45, c0 + 0.55);
      const dn = win(pu, c0 + 0.45, c0 + 0.6, c0 + 0.75, c0 + 1.05);
      go({ shN: -172, elN: -24, hwN: -10, tilt: -6, head: -6, shF: -150, elF: -40 }, up * k);
      pickTo(-2.95, up * k);
      go({ shN: -50, elN: -10, hwN: 0, tilt: 16, head: 10, shF: -44, elF: -10 }, dn * k);
      pickTo(-0.1, dn * k);
      if (pu > c0 + 0.55 && pu < c0 + 1.3) q.chipS = pu - c0 - 0.55;
      say(up > 0.3 ? 'focus' : 'chip', Math.max(up, dn) * k);
    }
    q.lumpChip = sstep((pu - 1.35) / 0.2) * 1.2 + sstep((pu - 2.55) / 0.2) * 1.2;
    // a cocoa bean! held up in its far paw, looked at
    const hold = win(pu, 3.2, 3.6, 5.4, 5.8);
    go({ shF: -168, elF: -24, hwF: -20, head: -12, tilt: -3 }, hold * k);
    say(pu < 3.9 ? 'find' : 'admire', hold * k);
    if (pu > 3.2 && pu < 6.6) q.bean = pu - 3.2;
    // polished on its chest, tucked in its pocket, proud
    const pol = win(pu, 5.4, 5.6, 6.2, 6.5);
    go({ shF: -50, elF: -110, hwF: -30 + Math.sin(pu * 22) * 14, head: 10 }, pol * k);
    if (pu > 6.3) st.kBean = 1;
    say('proud', win(pu, 6.4, 6.6, 7.4, 7.8) * k);
    go({ chest: -4, head: -6 }, win(pu, 6.4, 6.6, 7.4, 7.8) * k);
  }
  if (k > 0.001 && piece === 'lunch') {
    // the pick planted in the ground beside it
    const plant = win(pu, 0.1, 0.5, 6.6, 7.0);
    go({ shN: -40, elN: -10, hwN: 0, tilt: 6 }, win(pu, 0.1, 0.4, 0.6, 0.9) * k);
    pickTo(0.05, win(pu, 0.1, 0.4, 0.6, 0.9) * k);
    if (pu > 0.55 && pu < 6.75) q.noPick = true;
    q.planted = q.noPick ? 1 : 0;
    go({ shN: -40, elN: -10, hwN: 0, tilt: 6 }, win(pu, 6.5, 6.7, 6.8, 7.1) * k);
    // a cookie sandwich out of its pocket, munched in its near paw
    const reach = win(pu, 0.8, 1.1, 1.3, 1.6);
    go({ shN: -10, elN: -110, hwN: -20, head: 10 }, reach * k);
    const eat = win(pu, 1.4, 1.8, 4.8, 5.2);
    const mb = Math.sin(pu * 14);
    go({ shN: -58, elN: -116, hwN: -30, head: 4 + mb * 1.5 }, eat * k);
    if (pu > 1.2 && pu < 5.0) q.cookie = pu - 1.2;
    say(mb > 0 ? 'munch' : 'munchB', eat * k);
    q.crumbs = eat * k;
    // a pat of its tummy, content
    const pat = win(pu, 5.2, 5.5, 6.4, 6.7);
    go({ shN: -10, elN: -70, hwN: -30 + Math.sin(pu * 14) * 12, chest: -3, head: -4 }, pat * k);
    say('content', pat * k);
    void plant;
  }
  if (k > 0.001 && piece === 'candle') {
    // its candle flickers low; it looks up cross-eyed
    const lowF = win(pu, 0.2, 0.6, 3.0, 3.4);
    q.flame *= 1 - 0.55 * lowF * k + Math.sin(pu * 30) * 0.12 * lowF;
    const up = win(pu, 0.5, 0.9, 2.0, 2.3);
    go({ head: -14, neckR: -3 }, up * k);
    say('cross', up * k);
    // a paw cupped round it; ever so gentle a blow
    const cup = win(pu, 2.0, 2.4, 3.6, 4.0);
    go({ shF: -170, elF: -60, hwF: -40, head: -10 }, cup * k);
    say('blow', win(pu, 2.4, 2.6, 3.3, 3.5) * k);
    q.puff = win(pu, 2.5, 2.6, 3.2, 3.4) * k;
    // the flame back, bigger; phew, a paw across its brow
    q.flame *= 1 + 0.5 * win(pu, 3.3, 3.5, 4.4, 5.0) * k;
    const phew = win(pu, 4.2, 4.5, 5.8, 6.3);
    go({ shF: -150, elF: -90, hwF: -20, head: 4 }, phew * k);
    say('phew', phew * k);
  }
  if (k > 0.001 && piece === 'stretch') {
    // its free paw stretched high; a twisting stretch one way and the other
    const str = win(pu, 0.2, 0.7, 4.6, 5.0);
    const tw = Math.sin((pu - 0.7) * 2.6) * win(pu, 0.7, 1.0, 4.2, 4.6);
    go({ shF: -172, elF: -20, hwF: -30, chest: -4 + tw * 4, waist: tw * 4, head: -6 - tw * 4, tilt: tw * 4, lift: 0.015 }, str * k);
    say('stretch', win(pu, 1.6, 1.9, 3.2, 3.6) * k);
    // a satisfied huff
    const hf = win(pu, 4.8, 5.0, 6.0, 6.4);
    go({ chest: -4, head: -6 }, hf * k);
    say('huff', hf * k);
    q.puff = Math.max(q.puff, win(pu, 5.0, 5.1, 5.5, 5.8) * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: pick held ready across its body, head low -----
  if (hunting && !hurt && !mvName) {
    go({ shN: -60, elN: -70, hwN: 0, shF: -70, elF: -60, tilt: 6, head: 6, lift: -0.02 }, 1 - walking * 0.4);
    pickTo(0.5, 1 - walking * 0.4);
    q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.flame *= 0.6;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.1) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'chop') {
      // the pick raised high over its head, slowly
      go({ shN: -175, elN: -36, hwN: -14, shF: -168, elF: -40, tilt: -10, head: -10, chest: -4, lift: 0.02, toeN: 8 }, wu);
      pickTo(-3.0, wu);
      say('focus', W);
      if (s >= 0) {
        // chopped down in front
        go({ shN: -40, elN: -6, hwN: 0, shF: -36, elF: -8, tilt: 20, head: 14, chest: 4, x: 0.04, lift: -0.04 }, snap * sw);
        pickTo(0.05, snap * sw);
        q.chopS = s;
        say('shout', win(s, 0, 0.03, 0.3, 0.45));
      }
    } else if (mvName === 'barge') {
      // its shoulder dropped, braced
      go({ tilt: 18, head: 8, lift: -0.06, shN: -30, elN: -60, shF: 20, elF: -40, fxN: 0.25, fxF: -0.3 }, wu);
      say('focus', W);
      if (s >= 0) {
        const out1 = sstep(s / 0.18);
        const back = sstep((s - 0.45) / 0.4);
        const xx = 0.48 * out1 * (1 - back);
        go({ x: xx, tilt: 22, head: 10, shN: -10, elN: -50, fxN: xx * toLeg + 0.2, fxF: xx * toLeg - 0.3 }, sw);
        if (s < 0.9) q.bargeS = s;
        say('shout', win(s, 0, 0.04, 0.35, 0.45));
      }
    } else {
      // its head ducked, the flame swelling; then a nod and a warm burst of light
      go({ head: 18, neckR: 5, tilt: 6, chest: 2, lift: -0.03 }, wu);
      q.flame *= 1 + 0.6 * wu;
      q.flareW = wu;
      say('focus', W);
      if (s >= 0) {
        go({ head: -16, neckR: -4, chest: -4, tilt: -4, x: 0.02 }, snap * sw);
        q.flame *= 1 + 0.9 * win(s, 0, 0.04, 0.2, 0.5);
        q.flareS = s;
        say('shout', win(s, 0, 0.03, 0.3, 0.45));
      }
    }
  }
  // ----- Hurt: a wince, the flame ducking, ears back -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shF: -40, elF: -100, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.flame *= 1 - 0.5 * kh;
    q.helmTip = -0.15 * kh;
  }
  // ----- After landing a hit: the pick hefted up with a proud huff -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.8, 1.1) * (1 - F.moveW);
    go({ ...SHOULDER, head: -8, chest: -4, tilt: -3 }, kg);
    pickTo(PICK_REST, kg);
    q.puff = Math.max(q.puff, kg * 0.8);
    say('huff', kg);
  }
  // ----- A nap (its habitat): sat down, chin on its chest, its candle burning low -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 20 + Math.sin(now * 1.4) * 2, neckR: 5, shN: -40, elN: -60, shF: -30, elF: -60 }, nw);
    pickTo(0.9, nw);
    q.flame *= 1 - 0.5 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (sit > 0.001) go({ lift: -0.2 + Math.sin(now * 1.4) * 0.006, tilt: -6, fxN: 0.4, fyN: 0.06, fxF: 0.34, fyF: 0.05, toeN: -14, toeF: -14 }, sit);
  if (alive && !F.busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.earFlat = 0.7;
    q.flame = 0;
    q.smoke = 1;
    q.helmTip = -0.3;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.5);
  // (the pick's angle eased, kept within a turn of the last so it never spins the long way round)
  if (st.k_pickAng != null) q.pickAng += TAU * Math.round((st.k_pickAng - q.pickAng) / TAU);
  easeKeys(st, q, ['tailRot', 'earFlat', 'helmTip', 'pickAng', 'beanIn'], dt, (key) => (key === 'pickAng' ? 10 : 12));
  q.beanIn = st.kBean ?? 0;
  q.calm = k;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
const BUBBLE = [[-5.4, -5], [5.4, -5], [5.8, 3.2], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.2]];
const BCOL = [INK, '#fffaf4', '#e8608e', '#8a5a4a'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}
// Its flame: a soft warm teardrop with a white heart and a gentle glow (it gives off light).
function flame(ctx, x, y, k, lean) {
  if (k <= 0.03) return;
  glow(ctx, x, y - 1.6 * k, 6 * k, FLAME[1], 0.45);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.beginPath();
  ctx.moveTo(0, -4.2 * k);
  ctx.quadraticCurveTo(1.8 * k, -1.2 * k, 0.9 * k, 0.2);
  ctx.quadraticCurveTo(0, 0.8, -0.9 * k, 0.2);
  ctx.quadraticCurveTo(-1.8 * k, -1.2 * k, 0, -4.2 * k);
  ctx.fillStyle = FLAME[2];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -3 * k);
  ctx.quadraticCurveTo(1.1 * k, -0.9 * k, 0.5 * k, 0);
  ctx.quadraticCurveTo(0, 0.4, -0.5 * k, 0);
  ctx.quadraticCurveTo(-1.1 * k, -0.9 * k, 0, -3 * k);
  ctx.fillStyle = FLAME[1];
  ctx.fill();
  ell(ctx, 0, -0.9 * k, 0.45 * k, 0.8 * k);
  ctx.fillStyle = FLAME[0];
  ctx.fill();
  ctx.restore();
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  const [fx0, fy0] = flameAt(a, D);
  const walking = clamp(a.walkW ?? 0, 0, 1);
  if (m.hp <= 0) {
    // the flame out: a soft curl of smoke
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.5 + i * 0.5) % 1;
      dust(ctx, fx0 + Math.sin(f * 6) * 1.2, fy0 - f * 8, 0.8 + f, (1 - f) * 0.6, '#f4eef4', '#c8c0cc');
    }
    const [hx, hy] = headAt(a, D, [2, -34]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  flame(ctx, fx0, fy0, clamp(q.flame ?? 1, 0, 2.2), -0.25 * walking + Math.sin(t * 5) * 0.06);
  // its pick planted in the ground beside it (lunch)
  if ((q.planted ?? 0) > 0) plantedPick(ctx, a, 15);
  // the lump of chocolate rock it chips at
  if ((q.lump ?? -1) > 0) rockLump(ctx, 16, q.lump, q.lumpChip ?? 0);
  if ((q.chipS ?? -1) >= 0 && q.chipS < 0.7) {
    const e = q.chipS / 0.7;
    for (let i = 0; i < 4; i++) {
      const vx = (i - 1.5) * 4;
      chunk(ctx, 16 + vx * e, -5 - Math.sin(Math.PI * e) * (6 + i) + e * 4, 0.9 - i * 0.1, e * 6 + i, 1 - sstep((e - 0.7) / 0.3));
    }
    sparkle(ctx, 16, -6, 1.6 * Math.sin(Math.PI * e), 1, '#ffd6e6');
  }
  // the cocoa bean it found, held in its far paw (then into its pocket)
  if ((q.bean ?? -1) >= 0 && q.bean < 3.2) {
    const [hx, hy] = ptOf(a, D, 'handF', D.J.handF);
    ctx.save();
    for (const pass of ['line', 'fill']) {
      ell(ctx, hx + 0.6, hy - 2, 1.4, 1.0, -0.6);
      if (pass === 'line') {
        pen(ctx, CHOC[2], 0.6);
        ctx.stroke();
      } else {
        ctx.fillStyle = CHOC[0];
        ctx.fill();
      }
    }
    ctx.restore();
    if (q.bean > 0.4 && q.bean < 2.2) sparkle(ctx, hx + 2.4, hy - 4, 1.1 * Math.sin(Math.PI * clamp((q.bean - 0.4) / 1.8, 0, 1)), 1, '#ffe8b0');
  }
  // the cookie sandwich in its far paw, bitten smaller
  if ((q.cookie ?? -1) >= 0) {
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    const grow = sstep(q.cookie / 0.25);
    cookie(ctx, hx + 1, hy - 1.6, grow * (1 - sstep((q.cookie - 3.4) / 0.8) * 0.6), clamp((q.cookie - 0.8) / 3, 0, 1));
  }
  if ((q.crumbs ?? 0) > 0.1) {
    const [mx, my] = headAt(a, D, [20, 12]);
    for (let i = 0; i < 3; i++) {
      const f = (t * 1.4 + i / 3) % 1;
      chunk(ctx, mx + (i - 1) * 2 + Math.sin(i * 3) * 1, my + f * 18, 0.45, f * 4 + i, q.crumbs * (1 - f));
    }
  }
  // a breath or a huff: a soft warm puff
  if ((q.puff ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [26, 9]);
    for (let i = 0; i < 2; i++) {
      const f = (t * 1.5 + i * 0.5) % 1;
      dust(ctx, mx + 1 + f * 4, my - f * 3, 0.8 + f, q.puff * Math.sin(Math.PI * f) * 0.8, '#ffffff', '#e8e0e6');
    }
  }
  // ----- Pick Chop: chocolate chips and a sugar sparkle where it lands -----
  if ((q.chopS ?? -1) >= 0 && q.chopS < 0.8) {
    const e = q.chopS / 0.8;
    const cx = 22;
    dust(ctx, cx, -1.6, 2 + e * 4, (1 - e) * 0.8, '#e8c4a8', '#b08060');
    for (let i = 0; i < 5; i++) {
      const vx = (i - 2) * 4.4;
      chunk(ctx, cx + vx * e, -3 - Math.sin(Math.PI * e) * (7 + (i % 3) * 2) + e * 3, 1.1 - (i % 2) * 0.3, e * 7 + i, 1 - sstep((e - 0.7) / 0.3));
    }
    sparkle(ctx, cx, -5, 2.6 * Math.sin(Math.PI * Math.min(1, e * 2)), 1, '#ffd6e6');
  }
  // ----- Shoulder Barge: a puff of dust behind its feet, a soft whoosh -----
  if ((q.bargeS ?? -1) >= 0) {
    const e = clamp(q.bargeS / 0.6, 0, 1);
    const [cx] = ptOf(a, D, 'chest', D.J.ribs);
    for (let i = 0; i < 3; i++) dust(ctx, cx - 8 - i * 4 - e * 6, -1.6 - i * 0.6, 1.4 + e * 2, (1 - e) * 0.8, '#e8c4a8', '#b08060');
    ctx.save();
    ctx.globalAlpha *= (1 - e) * 0.6;
    for (const dy of [-12, -20]) {
      ctx.beginPath();
      ctx.moveTo(cx - 10 - e * 6, dy);
      ctx.lineTo(cx - 20 - e * 6, dy);
      pen(ctx, '#ffffff', 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }
  // ----- Lamp Flare: the light gathering, then a warm burst of rays ahead -----
  if ((q.flareW ?? 0) > 0.05) glow(ctx, fx0, fy0 - 2, 8 + q.flareW * 6, FLAME[1], 0.3 * q.flareW);
  if ((q.flareS ?? -1) >= 0 && q.flareS < 0.7) {
    const e = q.flareS / 0.7;
    glow(ctx, fx0 + 6 + e * 8, fy0 + 4, 14 + e * 10, FLAME[1], 0.55 * (1 - e));
    ctx.save();
    ctx.globalAlpha *= 1 - e;
    for (let i = 0; i < 5; i++) {
      const an = -0.5 + i * 0.25;
      const r0 = 4 + e * 6;
      const r1 = r0 + 6 + e * 10;
      ctx.beginPath();
      ctx.moveTo(fx0 + Math.cos(an) * r0, fy0 + 4 + Math.sin(an) * r0);
      ctx.lineTo(fx0 + Math.cos(an) * r1, fy0 + 4 + Math.sin(an) * r1);
      pen(ctx, FLAME[1], 1.4);
      ctx.stroke();
      pen(ctx, FLAME[0], 0.6);
      ctx.stroke();
    }
    ctx.restore();
    sparkle(ctx, fx0 + 10 + e * 10, fy0 + 4, 2.4 * Math.sin(Math.PI * e), 1, FLAME[0]);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-16, -4]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [4, -30]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#9a6a5a', '#fff6ee');
    }
  }
  const [bx, by] = headAt(a, D, [-2, -42]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  // (the skin is its coverall: cocoa brown, its own soft ink)
  skin: { lt: SUIT[0], base: SUIT[1], sh: SUIT[2], deep: SUIT[3], ink: INK, guides: false, out: LW },
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
    torsoSkin: (ctx, a, mode, S, D) => coverall(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => pick(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('badger', DRESS);
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
rig.h = Math.round(rig.h * BIG * 1.4);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over its head left
// to it, drawn here in its own style)
export const COCOA_BADGER_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const COCOA_BADGER_SIZE = { w: 32, h: Math.round(R.H * BIG * 1.12), speed: Math.round(R.speed * BIG) };
