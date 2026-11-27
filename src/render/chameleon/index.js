// The Swirl Chameleon (2026-11-27, the Candy Volcano's Lollipop Witch remade from scratch as a new creature;
// the id stays `lollipopwitch`). A little chameleon of the Gumdrop Hills and the Candy Kitchen who has
// lived on lollipops so long it has turned into one: its tail is curled into a swirl lollipop's spiral, and
// the candy stripes down its body ripple from colour to colour when it's pleased with itself (which is
// most of the time). Its eyes, each in its own round turret, look two ways at once until something tasty
// comes by; then both lock on and its sticky tongue does the rest. On its own copy of the creature base
// (rig.js; body.js `chameleon`: a slim little lizard body, slim limbs), dressed here; its head, casque,
// eyes, stripes, grips and tail drawn here from scratch over the mannequin (never the shared face, never
// the hero).
//   look    soft mint skin with candy stripes (strawberry, lemon, lilac, sky) curving round its body and
//           tail; a round head with a soft rounded casque (a crest like a little helmet) striped to match;
//           its own eyes ("turret eyes": each a big round eye in a round mound of skin, a lemon-lime iris
//           with a sunburst of fine lines round a round pupil, one round glint, a neat lash line along the
//           top of the turret; each looks its own way); round mint brows on the turrets; a long soft
//           smile of a mouth down its snout, curling up at the corner; two-toed grips for hands and feet;
//           its tail rolled up behind into a swirl lollipop's spiral, on springs. Its own soft green-teal
//           outline, outer edge only, face bare.
//   walk    the base's walk with a chameleon's rocking step (it sways back and forth like a leaf in the
//           breeze before each step goes down), slow and dainty, its spiral tail bobbing.
//   idle    a 28 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - colours (6.8 s): chest out, a wave of colour runs down its stripes, then another, brighter;
//             a proud little pose and a twinkle;
//           - catch (7.6 s): a candy sprinkle drifts by; one eye follows it, the other looks the other
//             way, until both lock on; a sway, a freeze, and its tongue shoots out and snaps it up; munch,
//             happy;
//           - sway (6.4 s): it rocks back and forth like a leaf, one grip lifted, eyes half closed,
//             perfectly content;
//           - lick (7.2 s): it curls its tail round in front and licks the swirl (it's sweet!), and again;
//             the third time its tongue sticks; a tug, a pop, a sheepish look.
//   moves   Gumdrop Fling (both eyes lock on, it rocks back, mouth open; then its tongue shoots out and
//           flings a gumdrop at you, data `shot: 'gumdrop'`); Tongue Snap (a crouch and a rock back; then
//           its tongue snaps out straight at you and back); Tail Whip (its tail unrolls behind it; then a
//           spin, the tail whipping round in a ring of candy colour).
//   else    hurt: a wince, its stripes flushing pale, both eyes squeezed; after landing a hit: a smug
//           ripple of colour and a tongue flick; hunting you: low, both eyes locked on, tail rolled
//           tight; low on health: worried, a bead of sweat, its stripes faded; a nap (habitat): curled
//           down, its tail wrapped round, eyes shut, z's; beaten: dizzy. Its marks over its head (!, ?,
//           z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: sprinkles as soft round-ended candy capsules,
// sparkles the game's curvy stars, colour as soft candy-striped rings.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee } from './act.js';

const BIG = 1.22;
const LW = 1.6 / BIG;
const INK = '#4e8a7a';
const SKIN = ['#f2fff4', '#c6f2d2', '#94d8b0', '#68b48e'];
const STRIPES = ['#ffa8cc', '#ffe08e', '#cbb2ff', '#a4dcff'];
const LASH = '#24463e';
const IRIS = ['#2e3a0e', '#7a8c1a', '#c8cc3a', '#fff4a8'];
const TONGUE = ['#ffb4cc', '#f07aa2'];
const SUGAR = '#fff6e8';

const paint = (ctx, a, mode, col, ink = INK, w = LW) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
// (a stripe colour, its brightness lifted by a colour wave `lit` 0..1, faded by `fade`)
const hexMix = (c1, c2, u) => {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a1, b1] = [p(c1), p(c2)];
  return `#${a1.map((v, i) => Math.round(v + (b1[i] - v) * u).toString(16).padStart(2, '0')).join('')}`;
};
const stripeCol = (i, lit, fade) => hexMix(hexMix(STRIPES[((i % 4) + 4) % 4], '#ffffff', lit * 0.35), SKIN[1], fade);

// ---------- Frames ----------
const ID = 'swirlcham';
const NECK = [80.9, 87.3];
const HS = 1.32;
const HO = [1.5, -15.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [72.6, 111.6];
const TAIL_B = [62, 116.4];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 80, c: 6, gain: 0.36, turn: 0.7, hang: 0.08, max: 10, flutter: 0.8, hz: 0.35, dir: [-6, 3] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 70, c: 5.6, gain: 0.4, turn: 0.7, hang: 0.06, max: 12, flutter: 1, hz: 0.42, dir: [-4, 2] } },
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
// e: open | wide | happy | shut | half | sleep | squeeze | dizzy | wink; g gaze of its near eye, g2 its far
// eye's (each its own way); b brows [outer, inner]; m mouth.
const FACES = {
  calm: { e: 'open', g: [0.6, 0.2], g2: [-0.8, -0.4], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.8], m: 'open' },
  proud: { e: 'happy', b: [-0.8, -0.4], m: 'grin' },
  pose: { e: 'half', g: [0.6, 0], g2: [0.6, 0], b: [-0.6, 0.2], m: 'grin' },
  track: { e: 'open', g: [1.2, -1.4], g2: [-1.4, 0.6], b: [-1, -1.2], m: 'calm' },
  lock: { e: 'wide', g: [1.4, -1.2], g2: [1.4, -1.2], b: [-1.2, 1], m: 'set' },
  zap: { e: 'wide', g: [1.6, -0.8], g2: [1.6, -0.8], b: [-1, 1.4], m: 'tongue' },
  munch: { e: 'happy', b: [-0.6, -0.8], m: 'chew' },
  dreamy: { e: 'half', g: [0.4, 0.6], g2: [0.2, 0.8], b: [-0.6, -1], m: 'smile' },
  sweet: { e: 'wide', g: [-1, 0.8], g2: [-1, 0.8], b: [-1.6, -1.8], m: 'o' },
  lick: { e: 'shut', b: [-0.6, -1], m: 'tongue' },
  stuck: { e: 'squeeze', b: [1, -1.4], m: 'tongue' },
  sheepish: { e: 'open', g: [-1.2, 0.8], g2: [1.2, 0.8], b: [1, -1.4], m: 'smile' },
  focus: { e: 'open', g: [1.4, 0.3], g2: [1.4, 0.3], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.6, 0.2], g2: [1.6, 0.2], b: [-1, 2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  smug: { e: 'half', g: [1, 0], g2: [1, 0], b: [-0.8, 0.2], m: 'blep' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  surprised: { e: 'wide', g: [0.2, -0.4], g2: [0.2, -0.4], b: [-2, -2.2], m: 'o' },
  worried: { e: 'open', g: [0.3, 0.9], g2: [-0.6, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], g2: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.2], g2: [0.6, 0.2], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.2], g2: [0.6, 0.2], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.2], g2: [0.6, 0.2], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'proud', 'munch', 'lick', 'stuck', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// One turret eye (head units): its mound of skin first (both passes, so it bulges out of the outline),
// then the eye in it. o +1 the eye on its nose's side; g its own gaze.
function turret(ctx, a, mode, x, y, r) {
  smooth(ctx, [[x - r * 1.0, y + r * 0.5], [x - r * 1.04, y - r * 0.5], [x - r * 0.5, y - r * 1.06], [x + r * 0.5, y - r * 1.06], [x + r * 1.04, y - r * 0.5], [x + r * 1.0, y + r * 0.5], [x, y + r * 1.08]]);
  paint(ctx, a, mode, SKIN[1]);
}
function eye(ctx, a, x, y, o, f, g) {
  const r = 3.7;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  // the turret's soft shading (lit on top, a ring of deeper skin round the eye)
  ctx.save();
  ell(ctx, x, y, r * 1.5, r * 1.5);
  ctx.clip();
  glow(ctx, x - 1, y - 3.6, 5, SKIN[0], 0.9);
  ctx.restore();
  ell(ctx, x, y, r * 1.12, r * 1.12);
  ctx.fillStyle = tone(a, SKIN[2], 0.55);
  ctx.fill();
  if (kind === 'happy') {
    stroke3(ctx, a, [x - r, y + 0.6], [x, y - r * 1.2], [x + r, y + 0.6], 1.35, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - r * 0.9 * o, y - 1.8], [x + r * 0.3 * o, y - 0.3], [x + r * 0.9 * o, y + 0.3], 1.3, LASH);
    stroke3(ctx, a, [x - r * 0.9 * o, y + 2.2], [x + r * 0.2 * o, y + 1.1], [x + r * 0.9 * o, y + 0.4], 1.15, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - r, y], [x, y + (kind === 'sleep' ? 2.6 : 2)], [x + r, y], 1.35, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  const R = r * big;
  ell(ctx, x, y, R, R);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      if (i) ctx.lineTo(x + Math.cos(an) * u * R * 0.7, y + Math.sin(an) * u * R * 0.7);
      else ctx.moveTo(x, y);
    }
    pen(ctx, tone(a, IRIS[1]), 0.75);
    ctx.stroke();
    return;
  }
  const [gx, gy] = g ?? [0.6, 0.2];
  ctx.save();
  ell(ctx, x, y, R, R);
  ctx.clip();
  const ix = x + gx * 0.9;
  const iy = y + gy * 0.9;
  const ir = R * 0.74;
  ell(ctx, ix, iy, ir, ir);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ir * 0.18, ir * 0.82, ir * 0.78);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  // its sunburst: fine lines round the pupil
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU;
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(an) * ir * 0.42, iy + Math.sin(an) * ir * 0.42);
    ctx.lineTo(ix + Math.cos(an) * ir * 0.82, iy + Math.sin(an) * ir * 0.82);
    pen(ctx, tone(a, IRIS[3], 0.55), 0.28);
    ctx.stroke();
  }
  ell(ctx, ix, iy, ir * 0.38, ir * 0.38);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix - 0.9 * o, iy - 1.2, 1.05, 1.0);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (kind === 'half') {
    // (half-closed: a soft lid of skin over the top of the eye, the lash line along its edge)
    ctx.beginPath();
    ctx.rect(x - R - 1, y - R - 1, R * 2 + 2, R * 0.9 + 1);
    ctx.fillStyle = tone(a, SKIN[1]);
    ctx.fill();
  }
  ctx.restore();
  // a neat lash line along the top of the eye, round at both ends, one short flick at its outer side
  const top = kind === 'half' ? y - R * 0.12 : y - R * 0.98;
  if (kind === 'half') stroke3(ctx, a, [x - R * 0.96, y - R * 0.1], [x, y - R * 0.2], [x + R * 0.96, y - R * 0.1], 1.2, LASH);
  else stroke3(ctx, a, [x - R * 0.92, y - R * 0.38], [x, top - R * 0.36], [x + R * 0.92, y - R * 0.38], 1.2, LASH);
  stroke3(ctx, a, [x + R * 0.86 * o, kind === 'half' ? y - R * 0.12 : y - R * 0.5], [x + (R + 0.8) * o, kind === 'half' ? y - R * 0.3 : y - R * 0.7], [x + (R + 1.2) * o, kind === 'half' ? y - R * 0.6 : y - R * 1.0], 0.8, LASH);
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 0.8 + (bo + bi) * 0.35, x + o * 2, y + bo * 0.7);
  pen(ctx, tone(a, SKIN[3]), 1.45);
  ctx.stroke();
}
// Its mouth: a long soft line down its snout, curling up at the corner; open, it's a wide soft gape.
function mouth(ctx, a, m) {
  const LIP = '#3e7a68';
  const DARK = '#a0406a';
  const x = 13;
  const y = 7.6;
  const line = (pts, w = 0.8) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const gape = (h) => {
    smooth(ctx, [[x - 6.4, y - 0.4], [x + 2, y - 0.6], [x + 6.4, y - 1.4], [x + 5.2, y + h * 0.6], [x, y + h], [x - 5, y + h * 0.4]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x - 0.4, y + h * 0.66, 3.2, h * 0.3);
    ctx.fillStyle = tone(a, TONGUE[0]);
    ctx.fill();
  };
  switch (m) {
    case 'open':
      gape(2.4);
      break;
    case 'grin':
      line([[x - 7, y - 1], [x - 2, y + 1.6], [x + 3, y + 1], [x + 5.6, y + 0.4], [x + 6.6, y - 1.4]], 0.85);
      break;
    case 'smile':
      line([[x - 6.6, y - 0.6], [x - 1, y + 1.2], [x + 4, y + 0.6], [x + 5.6, y + 0.2], [x + 6.2, y - 1]], 0.8);
      break;
    case 'tongue':
      gape(2);
      break;
    case 'chew':
      line([[x - 5.4, y], [x - 2, y + 1.4], [x + 1, y + 0.6], [x + 4, y + 1.4], [x + 5.6, y - 0.4]], 0.8);
      break;
    case 'o':
      ell(ctx, x + 2, y + 0.8, 1.2, 1.3);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      line([[x - 6, y - 0.4], [x - 2, y + 0.6], [x + 0.6, y + 0.6]], 0.7);
      break;
    case 'blep':
      line([[x - 6.6, y - 0.6], [x - 1, y + 1.2], [x + 4, y + 0.6], [x + 5.6, y + 0.2], [x + 6.2, y - 1]], 0.8);
      ell(ctx, x + 2.6, y + 1.6, 1, 1.2);
      ctx.fillStyle = tone(a, TONGUE[0]);
      ctx.fill();
      break;
    case 'set':
      line([[x - 6.4, y + 0.4], [x - 1, y + 0.4], [x + 4, y - 0.2], [x + 5.4, y], [x + 6, y + 0.4]], 0.85);
      break;
    case 'shout':
      gape(3.2);
      break;
    case 'wobble':
      line([[x - 6, y + 0.4], [x - 3, y - 0.4], [x, y + 0.4], [x + 3, y - 0.4], [x + 5.6, y + 0.4]], 0.7);
      break;
    case 'frown':
      line([[x - 6, y + 1], [x - 1, y - 0.2], [x + 4, y + 0.2], [x + 5.4, y + 0.8], [x + 6, y + 1.4]], 0.8);
      break;
    case 'sleep':
      line([[x - 5.4, y], [x - 1, y + 0.8], [x + 3, y + 0.4], [x + 4.6, y + 0.2], [x + 5.4, y - 0.4]], 0.7);
      break;
    case 'talkA':
      gape(2);
      break;
    case 'talkE':
      gape(1.2);
      break;
    default:
      // at rest: its long soft smile, the corner curling up
      line([[x - 6.6, y - 0.4], [x - 1, y + 1], [x + 4, y + 0.4], [x + 5.6, y], [x + 6.2, y - 1.2]], 0.78);
  }
}
// The head: a round skull, a soft rounded snout ahead, the casque rising behind like a little helmet.
const SKULL = [[-17, 3], [-16.4, -7], [-10.6, -13], [-2, -15], [7, -13.4], [14.6, -8], [19.6, -1.6], [21, 4.6], [18.6, 10], [11.6, 13.6], [2, 14.6], [-7, 13.6], [-13.6, 9.6]];
const CASQUE = [[-15.6, -4], [-17.4, -12], [-13, -19.6], [-5, -22.4], [2.4, -20], [5, -14], [-2, -12], [-10, -8]];
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  smooth(ctx, CASQUE);
  paint(ctx, a, mode, SKIN[1]);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, SKIN[1]);
  turret(ctx, a, mode, -4.6, -4.4, 5.6);
  turret(ctx, a, mode, 8.6, -5.2, 5.8);
  if (mode === 'fill') {
    const lit = q.lit ?? 0;
    const fade = q.fade ?? 0;
    const ph = q.band ?? 0;
    // the casque: candy stripes round it
    ctx.save();
    smooth(ctx, CASQUE);
    ctx.clip();
    for (let i = -1; i < 5; i++) {
      const o2 = i * 5 + (ph % 1) * 5;
      ctx.beginPath();
      ctx.moveTo(-20 + o2, -26);
      ctx.quadraticCurveTo(-14 + o2, -14, -20 + o2 + 2, -2);
      pen(ctx, tone(a, stripeCol(i - Math.floor(ph), lit, fade)), 2.4);
      ctx.stroke();
    }
    glow(ctx, -9, -19, 7, '#ffffff', 0.5);
    ctx.restore();
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 0, -10, 15, SKIN[0], 0.85);
    glow(ctx, -12, 10, 10, SKIN[2], 0.55);
    // a soft pale jaw under its smile
    glow(ctx, 8, 13, 9, SKIN[0], 0.8);
    // a stripe sweeping over the back of its head
    ctx.beginPath();
    ctx.moveTo(-17, -2);
    ctx.quadraticCurveTo(-12, 4, -14, 13);
    pen(ctx, tone(a, stripeCol(2 - Math.floor(ph), lit, fade)), 2.6);
    ctx.stroke();
    ctx.restore();
    // cheeks
    for (const [cx, cy, k] of [[-9.6, 5.2, 0.7], [6.6, 4.8, 1]]) {
      ell(ctx, cx, cy, 2.4, 1.5);
      ctx.fillStyle = tone(a, '#ff98b8', 0.45 * k + (q.blush ?? 0) * 0.35);
      ctx.fill();
    }
    eye(ctx, a, -4.6, -4.4, -1, f, f.g2 ?? f.g);
    eye(ctx, a, 8.6, -5.2, 1, f, f.g);
    brow(ctx, a, -4.6, -11, -1, f.b);
    brow(ctx, a, 8.8, -11.8, 1, f.b);
    // a nostril dot on its snout's tip (a soft little curve)
    ctx.beginPath();
    ctx.moveTo(18.6, 1.4);
    ctx.quadraticCurveTo(19.4, 0.8, 19.8, 1.8);
    pen(ctx, tone(a, SKIN[3]), 0.7);
    ctx.stroke();
    mouth(ctx, a, f.m);
  }
  ctx.restore();
}

// ---------- Its body ----------
// Candy stripes curving round its body (clipped to its outline), a pale soft tummy.
function stripes(ctx, a, mode, D) {
  if (mode !== 'fill' || !a.blTorsoPts) return;
  const q = a.gl ?? {};
  ctx.save();
  ctx.beginPath();
  a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.clip();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const ph = q.band ?? 0;
  // (wide soft bands wrapping round it on a slant, like a candy wrapper's twist)
  for (let i = -2; i < 4; i++) {
    const y0 = 92 + i * 11 + (ph % 1) * 11;
    ctx.beginPath();
    ctx.moveTo(54, y0 - 6);
    ctx.quadraticCurveTo(72, y0 + 4, 104, y0 + 10);
    pen(ctx, tone(a, stripeCol(i - Math.floor(ph), q.lit ?? 0, q.fade ?? 0), 0.85), 5);
    ctx.stroke();
  }
  smooth(ctx, [[81, 98], [90, 98], [95, 107], [92, 119], [84, 122], [79, 114], [78, 104]]);
  ctx.fillStyle = tone(a, SKIN[0]);
  ctx.fill();
  glow(ctx, 88, 102, 6, '#ffffff', 0.6);
  ctx.restore();
  ctx.restore();
}
// Two-toed grips: a mitten split into two round toes (hands and feet).
function grip(ctx, a, mode, D, bone, at, k, foot) {
  ctx.save();
  enter(ctx, a, D, bone);
  const [x, y] = at;
  const c = k === 'N' ? SKIN[1] : SKIN[2];
  ctx.beginPath();
  if (foot) {
    for (const [dx, dy, r] of [[4.4, 3.6, 2.8], [0.6, 4.2, 2.8], [-2.6, 2.4, 2.6]]) {
      ctx.moveTo(x + dx + r, y + dy);
      ctx.arc(x + dx, y + dy, r, 0, TAU);
    }
  } else {
    for (const [dx, dy, r] of [[1.8, 1.6, 2.4], [-1.6, 2.2, 2.4]]) {
      ctx.moveTo(x + dx + r, y + dy);
      ctx.arc(x + dx, y + dy, r, 0, TAU);
    }
  }
  paint(ctx, a, mode, c);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(x + (foot ? 2.4 : 0.1), y + (foot ? 2.6 : 0.6));
    ctx.lineTo(x + (foot ? 2.6 : 0.1), y + (foot ? 5.6 : 3.6));
    pen(ctx, tone(a, SKIN[3], 0.7), 0.6);
    ctx.stroke();
  }
  ctx.restore();
}
// Its tail: down from its rump, then rolled up into a swirl lollipop's spiral (the spiral tightening or
// opening on `roll`), candy-striped along its length.
function tailPts(a, D) {
  const q = a.gl ?? {};
  const roll = q.roll ?? 1;
  const A = [[73.4, 111], [67.6, 114.6], TAIL_B].map((p) => ptOf(a, D, 'tailA', p));
  const B = [];
  const turns = 1.45 * roll + 0.15;
  const cx = 54.6;
  const cy = 112.2;
  for (let i = 1; i <= 26; i++) {
    const u = i / 26;
    const an = 0.42 - u * TAU * turns;
    const r = mix(8.6, 1.8, u) * (0.7 + 0.3 * roll) + (1 - roll) * u * 10;
    B.push(ptOf(a, D, 'tailB', [cx + Math.cos(an) * r + (1 - roll) * u * -6, cy + Math.sin(an) * r]));
  }
  return [...A, ...B];
}
function tail(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const c = tailPts(a, D);
  const n = c.length;
  const ws = c.map((_, i) => mix(5.6, 1.3, i / (n - 1)) * D.SC * (q.tailPuff ?? 1));
  const L = [];
  const Rr = [];
  for (let i = 0; i < n; i++) {
    const p = c[Math.max(0, i - 1)];
    const r = c[Math.min(n - 1, i + 1)];
    const dx = r[0] - p[0];
    const dy = r[1] - p[1];
    const d = Math.hypot(dx, dy) || 1;
    L.push([c[i][0] - (dy / d) * ws[i], c[i][1] + (dx / d) * ws[i]]);
    Rr.push([c[i][0] + (dy / d) * ws[i], c[i][1] - (dx / d) * ws[i]]);
  }
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(...L[0]);
    for (const p of L.slice(1)) ctx.lineTo(...p);
    const e = c[n - 1];
    ctx.arc(e[0], e[1], ws[n - 1], 0, TAU);
    ctx.moveTo(...Rr[n - 1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(...Rr[i]);
    ctx.closePath();
  };
  // (drawn as quads joined edge to edge, so the spiral's overlapping turns never cancel out)
  const quads = (each) => {
    for (let i = 0; i < n - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(...L[i]);
      ctx.lineTo(...L[i + 1]);
      ctx.lineTo(...Rr[i + 1]);
      ctx.lineTo(...Rr[i]);
      ctx.closePath();
      each(i);
    }
    const e = c[n - 1];
    ell(ctx, e[0], e[1], ws[n - 1], ws[n - 1]);
    each(n - 1);
  };
  if (mode === 'line') {
    pen(ctx, INK, LW * 1.7);
    quads(() => ctx.stroke());
    return;
  }
  const lit = q.lit ?? 0;
  const fade = q.fade ?? 0;
  const ph = q.band ?? 0;
  quads((i) => {
    const band = Math.floor(i / 3 - ph * 2);
    ctx.fillStyle = tone(a, i % 3 === 2 ? SKIN[1] : stripeCol(band, lit, fade));
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 0.35;
    ctx.stroke();
  });
  // (the swirl's inner edge: a soft line where each turn lies on the one outside it)
  ctx.beginPath();
  for (let i = 4; i < n; i++) ctx[i === 4 ? 'moveTo' : 'lineTo'](...Rr[i]);
  pen(ctx, tone(a, SKIN[3], 0.45), 0.4);
  ctx.stroke();
  void outline;
}

// ---------- Its things in the world ----------
// A candy sprinkle: a soft round-ended capsule.
function sprinkle(ctx, x, y, s, ang, col, al = 1) {
  if (al <= 0.01 || s <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.lineTo(s, 0);
  pen(ctx, '#7a5a7a', s * 1.15);
  ctx.stroke();
  pen(ctx, col, s * 0.8);
  ctx.stroke();
  pen(ctx, 'rgba(255,255,255,0.7)', s * 0.25);
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.15);
  ctx.lineTo(s * 0.3, -s * 0.15);
  ctx.stroke();
  ctx.restore();
}
// A gumdrop: a soft sugared dome.
function gumdrop(ctx, x, y, r, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[x - r, y + r * 0.7], [x - r * 0.9, y - r * 0.2], [x - r * 0.4, y - r * 0.9], [x + r * 0.4, y - r * 0.9], [x + r * 0.9, y - r * 0.2], [x + r, y + r * 0.7], [x, y + r * 0.85]]);
    if (pass === 'line') {
      pen(ctx, '#a0506a', r * 0.3);
      ctx.stroke();
    } else {
      ctx.fillStyle = col;
      ctx.fill();
    }
  }
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.25, -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.restore();
}
// Its tongue: a soft pink tube from its mouth to a round sticky tip (`len` game px, at angle `ang`).
function tongue(ctx, a, x0, y0, len, ang, bulb = 1.4) {
  if (len < 0.4) return;
  const x1 = x0 + Math.cos(ang) * len;
  const y1 = y0 + Math.sin(ang) * len + Math.sin(Math.min(1, len / 20) * Math.PI) * 0.6;
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 0.6, x1, y1);
    pen(ctx, pass === 'line' ? '#c85a80' : TONGUE[0], pass === 'line' ? 1.5 : 0.9);
    ctx.stroke();
    ell(ctx, x1, y1, bulb, bulb * 0.9);
    if (pass === 'line') {
      pen(ctx, '#c85a80', 0.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = TONGUE[0];
      ctx.fill();
      ell(ctx, x1 - bulb * 0.3, y1 - bulb * 0.35, bulb * 0.35, bulb * 0.25);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }
  }
  return [x1, y1];
}

// ---------- Its act and fight ----------
const PIECES = { colours: 6.8, catch: 7.6, sway: 6.4, lick: 7.2 };
const ORDER = ['colours', 'catch', 'sway', 'lick'];
const POOL = ['fling', 'snap', 'whip'];
const MELEE = ['snap', 'whip'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
const pick = (m, n) => (m.swingFar === true ? 'fling' : m.swingFar === false ? MELEE[n % 2] : POOL[n % POOL.length]);

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL, pick);
  const now = F.now;
  const q = { face: null, tailRot: 0, tailCurl: 0, tailPuff: 1, roll: 1, lit: 0, fade: 0, blush: 0, band: 0, wave: 0, sprinkle: -1, tongue: 0, tongueAng: 0, caught: false, tailLick: 0, tw: -1, snapS: -1, flingS: -1, whipS: -1, sweat: -1, zz: 0, flipNow: false, twinkle: -1 };
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
  // Standing: grips held loosely before it, a slow breath, its stripes drifting slowly round it.
  // Walking: a chameleon's rocking step, swaying back and forth like a leaf before each foot goes down.
  const br = c.breath ?? 0;
  go({ shN: -24 + br * 1.5, elN: -46, hwN: -10, shF: -18 + br, elF: -40, hwF: -8, head: 2, chest: -br * 0.5 }, 1);
  const rock = Math.sin(U * TAU * 2 + 0.9);
  add({ x: rock * 0.025, tilt: rock * 4 + 2, head: -rock * 3 }, walking);
  st.kBand = ((st.kBand ?? 0) + dt * 0.12) % 64;
  q.band = st.kBand;
  q.tailRot = Math.sin(t * 0.6) * 0.05 + rock * 0.1 * walking;
  q.tailCurl = Math.sin(t * 0.5 + 1) * 0.05;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  let curl = 0;

  if (k > 0.001 && piece === 'colours') {
    // chest out; a wave of colour down its stripes, then another, brighter
    const pr = win(pu, 0.2, 0.6, 5.8, 6.4);
    go({ chest: -5, head: -6, tilt: -3, shN: -10, elN: -30, shF: -6, elF: -30 }, pr * k);
    say('pose', pr * k);
    for (const [w0, amp] of [[0.6, 0.7], [2.6, 1]]) {
      const v = clamp((pu - w0) / 1.6, 0, 1);
      q.lit = Math.max(q.lit, Math.sin(Math.PI * v) * amp * k);
      st.kBand += dt * 1.6 * Math.sin(Math.PI * v) * amp * k;
    }
    q.band = st.kBand;
    // a proud little pose and a twinkle
    const pp = win(pu, 4.4, 4.7, 6.0, 6.4);
    go({ shN: -110, elN: -40, hwN: -20, tilt: -6, head: -8, fxN: 0.15, toeN: 10 }, pp * k);
    say('proud', pp * k);
    if (pu > 4.6 && pu < 6) q.twinkle = pu - 4.6;
  }
  if (k > 0.001 && piece === 'catch') {
    // a sprinkle drifts by; one eye follows, the other looks the other way
    if (pu > 0.2 && pu < 4.4) q.sprinkle = pu - 0.2;
    const tr = win(pu, 0.4, 0.7, 2.6, 2.8);
    say('track', tr * k);
    add({ head: Math.sin(pu * 2) * 4 * tr }, k);
    // both lock on; a sway, a freeze
    const lk = win(pu, 2.7, 2.9, 3.7, 3.85);
    const sway = Math.sin((pu - 2.7) * 7) * (1 - sstep((pu - 3.3) / 0.3));
    go({ tilt: 6 + sway * 5, x: sway * 0.02, head: -6, shN: -40, elN: -50 }, lk * k);
    say('lock', lk * k);
    // its tongue shoots out and snaps it up
    const zap = win(pu, 3.75, 3.8, 4.0, 4.35);
    q.tongue = Math.max(q.tongue, zap * k);
    q.tongueAng = -0.5;
    if (pu > 3.86) q.caught = true;
    say('zap', zap * k);
    // munch, happy
    const mu = win(pu, 4.3, 4.5, 6.0, 6.3);
    add({ head: Math.sin(pu * 16) * 1.4 * mu }, k);
    say('munch', mu * k);
    say('happy', win(pu, 6.1, 6.3, 7.1, 7.5) * k);
    q.lit = Math.max(q.lit, 0.6 * win(pu, 6.0, 6.3, 7.0, 7.5) * k);
  }
  if (k > 0.001 && piece === 'sway') {
    // it rocks back and forth like a leaf, one grip lifted, eyes half closed
    const sw = win(pu, 0.2, 0.7, 5.6, 6.2);
    const rk = Math.sin((pu - 0.2) * 2.6);
    go({ x: rk * 0.035, tilt: rk * 6, head: -rk * 5, chest: rk * 2, shN: -60, elN: -60, hwN: -30, fyN: 0.12, fxN: 0.2, toeN: -20 }, sw * k);
    q.tailRot += rk * 0.2 * sw * k;
    say('dreamy', sw * k);
  }
  if (k > 0.001 && piece === 'lick') {
    // its tail curled round in front; it licks the swirl
    const cur = win(pu, 0.2, 0.8, 6.0, 6.6);
    q.tailRot += 2.4 * cur * k;
    q.tailCurl += 0.6 * cur * k;
    go({ head: 18, neckR: 5, tilt: 6, shN: -40, elN: -70, shF: -30, elF: -70 }, cur * k);
    for (const l0 of [1.2, 2.4]) {
      const v = win(pu, l0, l0 + 0.15, l0 + 0.35, l0 + 0.6);
      q.tailLick = Math.max(q.tailLick, v * k);
      say('lick', v * k);
    }
    say('sweet', win(pu, 1.7, 1.8, 2.2, 2.35) * k);
    // the third time it sticks; a tug, a pop
    const sk = win(pu, 3.5, 3.65, 4.9, 5.0);
    q.tailLick = Math.max(q.tailLick, sk * k);
    const tug = Math.sin((pu - 3.8) * 18) * win(pu, 3.8, 3.9, 4.8, 4.9);
    add({ head: -6 * sk - tug * 3, x: -0.02 * sk }, k);
    say('stuck', sk * k);
    if (pu > 4.95 && pu < 5.6) q.tw = pu - 4.95;
    say('sheepish', win(pu, 5.1, 5.3, 6.6, 7.0) * k);
    q.blush = Math.max(q.blush, win(pu, 5.1, 5.3, 6.6, 7.0) * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: low, both eyes locked on, tail rolled tight -----
  if (hunting && !hurt) {
    go({ tilt: 8, head: 4, lift: -0.03, shN: -40, elN: -40 }, 1 - walking * 0.5);
    q.roll = 1.15;
    q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.fade = Math.max(q.fade, 0.45);
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.1) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'fling') {
      // both eyes lock on; it rocks back, mouth open
      go({ tilt: -8, head: -10, x: -0.03, shN: -30, elN: -60, shF: -24, elF: -60 }, wu);
      say(W < 0.6 ? 'lock' : 'zap', W);
      q.lit = Math.max(q.lit, 0.5 * wu);
      if (s >= 0) {
        go({ tilt: 10, head: 4, x: 0.03 }, snap * sw);
        q.tongue = Math.max(q.tongue, win(s, 0, 0.06, 0.16, 0.36));
        q.tongueAng = -0.25;
        q.flingS = s;
        say('zap', win(s, 0, 0.03, 0.3, 0.4));
        say('smug', win(s, 0.45, 0.55, 0.85, 0.95));
      }
    } else if (mvName === 'snap') {
      // a crouch and a rock back; then its tongue snaps out straight at you and back
      go({ lift: -0.06, tilt: -6, head: -4, x: -0.04, shN: -30, elN: -50, fxN: 0.1 }, wu);
      say('lock', W);
      if (s >= 0) {
        go({ tilt: 14, head: 6, x: 0.05, lift: -0.02 }, snap * sw);
        q.tongue = Math.max(q.tongue, win(s, 0, 0.05, 0.14, 0.34) * 1.35);
        q.tongueAng = 0.05;
        q.snapS = s;
        say('zap', win(s, 0, 0.03, 0.3, 0.4));
        say('smug', win(s, 0.45, 0.55, 0.85, 0.95));
      }
    } else {
      // its tail unrolls behind it; then a spin, the tail whipping round
      go({ tilt: -6, head: -8, lift: -0.03, shN: -40, elN: -60, shF: -30, elF: -60 }, wu);
      q.roll = mix(1, 0.15, wu);
      q.tailRot -= 0.5 * wu;
      say('focus', W);
      if (s >= 0) {
        const spin = s < 0.42;
        if (spin && Math.floor(s / 0.105) % 2 === 1) q.flipNow = true;
        q.roll = mix(0.15, 1, sstep((s - 0.4) / 0.4));
        q.tailRot += (spin ? Math.sin(s * 30) * 0.8 : 0) * sw;
        add({ hop: Math.sin(Math.PI * clamp(s / 0.42, 0, 1)) * 0.04 }, sw);
        q.whipS = s;
        q.lit = Math.max(q.lit, win(s, 0, 0.05, 0.4, 0.6));
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: a wince, its stripes flushing pale -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shN: -50, elN: -90, shF: -44, elF: -90, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.fade = Math.max(q.fade, 0.7 * kh);
    q.roll = Math.max(q.roll, 1 + 0.2 * kh);
  }
  // ----- After landing a hit: a smug ripple of colour and a tongue flick -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.8, 1.1) * (1 - F.moveW);
    go({ head: -8, chest: -3, tilt: -3 }, kg);
    q.lit = Math.max(q.lit, kg);
    st.kBand += dt * 1.2 * kg;
    q.band = st.kBand;
    say('smug', kg);
  }
  // ----- A nap (its habitat): curled down, its tail wrapped round -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    curl = Math.max(curl, nw);
    q.tailRot += 1.4 * nw;
    q.roll = Math.max(q.roll, 1 + 0.15 * nw);
    q.fade = Math.max(q.fade, 0.25 * nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (curl > 0.001) go({ lift: -0.2 + Math.sin(now * 1.4) * 0.006, tilt: 18, head: 18, neckR: 5, shN: -40, elN: -110, shF: -36, elF: -110, fxN: 0.3, fxF: 0.24, fyN: 0.04, fyF: 0.04 }, curl);
  if (alive && !F.busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.fade = 0.5;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.8);
  easeKeys(st, q, ['tailRot', 'tailCurl', 'tailPuff', 'roll', 'lit', 'fade', 'blush', 'tongue', 'tailLick'], dt, (key) => (key === 'tongue' ? 30 : key.startsWith('tail') ? 9 : key === 'roll' ? 10 : 12));
  q.calm = k;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
const BUBBLE = [[-5.6, -4], [-3.4, -6.2], [3.4, -6.2], [5.6, -4], [5.6, 3], [1.2, 4.6], [-0.4, 7], [-1.6, 4.6], [-5.6, 3]];
const BCOL = [INK, '#f8fffa', '#e8608e', '#4e8a7a'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.29;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const [mx, my] = headAt(a, D, [17, 8]);
  // the sprinkle drifting by (caught: gone)
  if ((q.sprinkle ?? -1) >= 0 && !q.caught) {
    const e = q.sprinkle;
    const x = mx + 24 - e * 3.4;
    const y = my - 18 + e * 3.2 + Math.sin(e * 3) * 2;
    sprinkle(ctx, x, y, 1.6, e * 1.4, STRIPES[0], sstep(e / 0.4));
  }
  // its tongue
  if ((q.tongue ?? 0) > 0.02) {
    const len = q.tongue * 26;
    const tip = tongue(ctx, a, mx, my, len, q.tongueAng ?? 0, 1.5);
    if (tip && q.sprinkle >= 0 && q.caught && q.tongue > 0.1) sprinkle(ctx, tip[0], tip[1], 1.4, 0.6, STRIPES[0]);
  }
  // licking its tail: the tongue to the swirl in front
  if ((q.tailLick ?? 0) > 0.02) {
    const tp = tailPts(a, D);
    const tgt = tp[Math.floor(tp.length * 0.55)];
    const d = Math.hypot(tgt[0] - mx, tgt[1] - my);
    tongue(ctx, a, mx, my, d * q.tailLick, Math.atan2(tgt[1] - my, tgt[0] - mx), 1.1);
  }
  // the pop when its tongue comes unstuck
  if ((q.tw ?? -1) >= 0 && q.tw < 0.6) {
    const e = q.tw / 0.6;
    for (let i = 0; i < 4; i++) {
      const an = -1.6 + i * 0.9;
      sparkle(ctx, mx + 2 + Math.cos(an) * (2 + e * 6), my + Math.sin(an) * (2 + e * 5), 1.2 * (1 - e), 1, i % 2 ? STRIPES[1] : '#ffffff');
    }
  }
  // a twinkle off its stripes
  if ((q.twinkle ?? -1) >= 0) {
    const [cx, cy] = ptOf(a, D, 'chest', D.J.ribs);
    for (let i = 0; i < 3; i++) {
      const f = clamp(q.twinkle * 1.2 - i * 0.25, 0, 1);
      sparkle(ctx, cx - 4 + i * 5, cy - 6 - f * 6, 1.4 * Math.sin(Math.PI * f), 1, STRIPES[i % 4]);
    }
  }
  // ----- Gumdrop Fling: on its tongue's tip, then flung off at you -----
  if ((q.flingS ?? -1) >= 0 && q.flingS < 0.9) {
    const s = q.flingS;
    if (s < 0.14) {
      const len = (q.tongue ?? 0) * 26;
      gumdrop(ctx, mx + Math.cos(-0.25) * len, my + Math.sin(-0.25) * len, 1.8, STRIPES[0]);
    } else {
      const u = clamp((s - 0.14) / 0.5, 0, 1);
      const x0 = mx + 25;
      gumdrop(ctx, x0 + u * 24, my - 6 - Math.sin(Math.PI * u) * 8 + u * 8, 1.8, STRIPES[0], 1 - sstep((u - 0.8) / 0.2));
      for (let i = 1; i <= 3; i++) sparkle(ctx, x0 + u * 24 - i * 3, my - 6 - Math.sin(Math.PI * u) * 8 + u * 8 + i * 0.6, 1 - i * 0.2, 1 - u, STRIPES[i % 4]);
    }
  }
  // ----- Tongue Snap: a sparkle at its tip as it lands -----
  if ((q.snapS ?? -1) >= 0 && q.snapS < 0.4) {
    const e = q.snapS / 0.4;
    const len = Math.max(0.1, (q.tongue ?? 0)) * 26;
    sparkle(ctx, mx + len + 1, my, 2.4 * Math.sin(Math.PI * e), 1, '#ffffff');
    glow(ctx, mx + len, my, 6, TONGUE[0], 0.4 * (1 - e));
  }
  // ----- Tail Whip: a ring of candy colour whipped round it -----
  if ((q.whipS ?? -1) >= 0 && q.whipS < 0.8) {
    const s = q.whipS;
    const u = clamp(s / 0.6, 0, 1);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.8;
      ctx.beginPath();
      ctx.ellipse(2, -9 + i * 0.8, 8 + sstep(u) * 16 + i * 1.6, (8 + sstep(u) * 16 + i * 1.6) * 0.32, 0, Math.PI * (0.1 + i * 0.4) + s * 8, Math.PI * (0.8 + i * 0.4) + s * 8);
      pen(ctx, STRIPES[i], 1.3);
      ctx.stroke();
      ctx.restore();
    }
    sparkle(ctx, 4 + sstep(u) * 22, -9, 2.2 * Math.sin(Math.PI * u), 1, STRIPES[1]);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [10, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#5a9a86', '#f2fff6');
    }
  }
  const [bx, by] = headAt(a, D, [6, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  void t;
  ctx.globalAlpha = base;
}

// The shot it flings in the dungeon (render/dreamfx.js dreamShot, the 'spit' vfx): a gumdrop tumbling
// along, candy sparkles trailing.
export function gumdropShot(ctx, shot, x, y, p, d) {
  if (shot !== 'gumdrop') return false;
  ctx.save();
  for (let i = 1; i <= 3; i++) sparkle(ctx, x - d * i * 3.2, y + Math.sin(p * 12 + i) * 1.2, 1.2 - i * 0.25, 0.9 - i * 0.2, STRIPES[i % 4]);
  ctx.translate(x, y);
  ctx.rotate(p * 8 * d);
  gumdrop(ctx, 0, 0, 3, STRIPES[0]);
  ctx.restore();
  return true;
}

const DRESS = {
  id: ID,
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: LW },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    torso: (ctx, a, mode, S, D) => {
      if (!((a.gl?.tailRot ?? 0) > 1.2)) tail(ctx, a, mode, D);
    },
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => stripes(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => grip(ctx, a, mode, D, 'handF', D.J.handF, 'F'),
    footFskin: (ctx, a, mode, S, D) => grip(ctx, a, mode, D, 'footF', D.J.ankF, 'F', true),
    footNskin: (ctx, a, mode, S, D) => grip(ctx, a, mode, D, 'footN', D.J.ankN, 'N', true),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => {
      grip(ctx, a, mode, D, 'handN', D.J.handN, 'N');
      // (its tail curled round in front, to be licked: over its body)
      if ((a.gl?.tailRot ?? 0) > 1.2) tail(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('chameleon', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Tail Whip: clean mirror flips at each half turn, never a squeeze)
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
export const SWIRL_CHAMELEON_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const SWIRL_CHAMELEON_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
