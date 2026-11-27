// The Floss Chinchilla (2026-11-27, the Candy Volcano's Cotton Candy Sheep remade from scratch as a new
// creature; the id stays `cottoncandy`). A chinchilla of the Gumdrop Hills and the Candy Kitchen whose fur
// is spun sugar: pink candy floss fading to sky blue down its back, so soft it lifts in the breeze. Real
// chinchillas keep their fur clean by rolling in dust; this one rolls in powdered sugar, which is why it is
// so fluffy (and so sticky). It nibbles sugar crystals held in both paws, "popcorns" straight up in the
// air when it's happy, and its huge round ears never stop listening. On its own copy of the creature base
// (rig.js; body.js `chinchilla`: a round puff of a body, tiny arms, short hind legs on big long feet),
// dressed here; its head, ears, floss fur, whiskers and tail drawn here from scratch over the mannequin
// (never the shared face, never the hero).
//   look    floss-pink fur with a sky-blue swirl down its back and a cream tummy; a round head with fluffy
//           cheek ruffs; two huge round ears on springs, lilac-pink and thin enough for the light to
//           glow through; a little rounded pink nose, a soft "y" of a mouth and two caramel front teeth
//           (a chinchilla's are orange) when it opens; a few soft white whiskers; its own eyes ("bead
//           eyes": big glossy domes of deep plum, nearly all pupil, a lilac rim light along the bottom, a
//           big round glint and a small one, a short neat lash line on the outer half with one round
//           flick); round pink brows; tiny paws held at its chest; a big floss tail curling up behind
//           like a scroll of candy floss, on springs. Its own soft plum outline, outer edge only, face
//           bare.
//   walk    a scurry: the base's walk at little steps, leaning in, its paws tucked at its chest, its
//           tail bobbing behind.
//   idle    a 28 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - bath (7.8 s): down low, it rubs one cheek then the other in the powdered sugar, kicking
//             up puffs; it stands and shakes from nose to tail, a sparkly cloud; fluffed up and proud;
//           - nibble (7.2 s): a sugar crystal glints in the grass; it picks it up and sits up with it in
//             both paws, nibbling fast until it's gone; it licks its paws;
//           - popcorn (6.4 s): its ears perk, a wiggle, then two popcorn leaps straight up, twisting in
//             the air; a happy shimmy;
//           - ears (6.6 s): one ear turns, then the other; it freezes, up on its toes, listening; nothing;
//             it pulls one big ear down with both paws and grooms it.
//   moves   Floss Puff (it fluffs right up and takes a deep breath, cheeks round; then blows a puff of
//           candy floss at you, data `shot: 'flosspuff'`, its own soft cloud); Popcorn Pop (a crouch,
//           then a twisting leap at you and a bonk); Sugar Shake (braced low; then the dust-bath shake,
//           a ring of sugar and floss flung out round it).
//   else    hurt: a squeak and a wince, ears flat, a wisp of floss slipping off (real chinchillas drop a
//           tuft of fur when grabbed); after landing a hit: a smug ear flick, nose in the air; hunting
//           you: up on its toes, ears forward, paws tucked; low on health: worried, a bead of sweat; a nap
//           (habitat): curled in a floss ball, its tail wrapped round, z's; beaten: dizzy. Its marks
//           over its head (!, ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: floss as soft pink and blue cloud puffs, sugar
// as soft white sparkles, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, dust } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee, ribbon } from './act.js';

const BIG = 1.22;
const LW = 1.6 / BIG;
const INK = '#a2709e';
const FUR = ['#fff4fa', '#ffd6ec', '#f4b0d4', '#d88cb6'];
const BLUE = ['#eef8ff', '#c4e4ff', '#96c6ee'];
const CREAM = ['#fffdf8', '#fff2ea', '#f0d8d4'];
const EAR = ['#ffe6f2', '#f8c2dc', '#e89cc2'];
const NOSE = ['#ff9cbc', '#e07098'];
const LASH = '#4a2848';
const IRIS = ['#1e0e24', '#3e1e48', '#6a3e80', '#c4a0e8'];
const SUGAR = '#fff6fa';

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
const ID = 'flosschin';
const NECK = [80.9, 88.2];
const HS = 1.46;
const HO = [1, -14.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const EAR_F = [-11.6, -12];
const EAR_N = [6.4, -14.6];
const TAIL_A = [70.6, 116];
const TAIL_B = [58, 112];
const JOINTS = { earF: hk(EAR_F), earN: hk(EAR_N), tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { earF: 'earF', earN: 'earN', tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'earF', parent: 'head', pivot: 'earF', rot: (S, a) => a.gl?.earF ?? 0, soft: { k: 120, c: 6.6, gain: 0.3, turn: 0.6, max: 12, flutter: 1, hz: 0.5, dir: [-2, -8] } },
  { name: 'earN', parent: 'head', pivot: 'earN', rot: (S, a) => a.gl?.earN ?? 0, soft: { k: 128, c: 6.6, gain: 0.3, turn: 0.6, max: 12, flutter: 1, hz: 0.55, dir: [2, -8] } },
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 66, c: 5.4, gain: 0.4, turn: 0.8, hang: 0.08, max: 12, flutter: 1.2, hz: 0.4, dir: [-6, -2] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 58, c: 4.8, gain: 0.46, turn: 0.8, hang: 0.06, max: 14, flutter: 1.6, hz: 0.48, dir: [-2, -6] } },
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
  calm: { e: 'open', g: [0.4, 0.2], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.8], m: 'open' },
  cozy: { e: 'happy', b: [-0.4, -0.6], m: 'calm' },
  rub: { e: 'shut', b: [-0.4, -0.8], m: 'smile' },
  shake: { e: 'squeeze', b: [-0.6, -0.8], m: 'teeth' },
  proud: { e: 'happy', b: [-0.8, -0.4], m: 'smile' },
  spot: { e: 'wide', g: [0.8, 1.6], b: [-1.4, -1.6], m: 'o' },
  nibble: { e: 'happy', b: [-0.4, -0.6], m: 'nib' },
  nibbleB: { e: 'happy', b: [-0.4, -0.6], m: 'teeth' },
  lick: { e: 'shut', b: [-0.4, -0.8], m: 'blep' },
  perk: { e: 'wide', g: [0.6, -0.6], b: [-1.6, -1.8], m: 'o' },
  whee: { e: 'happy', b: [-1.2, -1.4], m: 'open' },
  listen: { e: 'open', g: [-1.2, -0.4], b: [-0.6, -1.2], m: 'calm' },
  freeze: { e: 'wide', g: [1.4, -0.4], b: [-1.6, -1.8], m: 'small' },
  meh: { e: 'open', g: [0.2, 0.8], b: [0.8, -0.6], m: 'flat' },
  groom: { e: 'shut', b: [-0.2, -0.6], m: 'smile' },
  breath: { e: 'shut', b: [-0.4, 0.8], m: 'puff' },
  blow: { e: 'squeeze', b: [-0.6, 1.4], m: 'blow' },
  focus: { e: 'open', g: [1.2, 0.5], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.5, 0.4], b: [-1, 2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'teeth' },
  smug: { e: 'happy', b: [-0.8, 0.2], m: 'smile' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'squeak' },
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
const SHUTS = new Set(['happy', 'cozy', 'rub', 'shake', 'proud', 'nibble', 'nibbleB', 'lick', 'whee', 'groom', 'breath', 'blow', 'shout', 'smug', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// One bead eye (head units): x, y its middle; o +1 the eye on its nose's side, -1 the other (its outer
// corner that way).
function eye(ctx, a, x, y, o, f) {
  const r = 4.7;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - r, y + 0.8], [x, y - r * 1.2], [x + r, y + 0.8], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - r * 0.9 * o, y - 2], [x + r * 0.3 * o, y - 0.3], [x + r * 0.9 * o, y + 0.3], 1.35, LASH);
    stroke3(ctx, a, [x - r * 0.9 * o, y + 2.4], [x + r * 0.2 * o, y + 1.2], [x + r * 0.9 * o, y + 0.4], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - r, y], [x, y + (kind === 'sleep' ? 2.8 : 2.2)], [x + r, y], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  const R = r * big;
  if (kind === 'dizzy') {
    ell(ctx, x, y, R, R * 1.04);
    ctx.fillStyle = tone(a, '#ffffff');
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * R * 0.7;
      const py = y + Math.sin(an) * u * R * 0.7;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[2]), 0.8);
    ctx.stroke();
    return;
  }
  // a glossy dome of deep plum, nearly all pupil (the gaze slides it a little in its socket)
  const [gx, gy] = f.g ?? [0.4, 0.2];
  const ex = x + gx * 0.35;
  const ey = y + gy * 0.3;
  ell(ctx, ex, ey, R, R * 1.04);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ctx.save();
  ell(ctx, ex, ey, R, R * 1.04);
  ctx.clip();
  ell(ctx, ex, ey + R * 0.4, R * 0.86, R * 0.6);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ex, ey + R * 0.76, R * 0.6, R * 0.3);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ex, ey + 0.1, R * 0.92, R * 0.96, 0, Math.PI * 0.2, Math.PI * 0.8);
  pen(ctx, tone(a, IRIS[3], 0.85), 0.55);
  ctx.stroke();
  // glints: a big round one up on its nose's side, a small one low on the other
  ell(ctx, ex + 1.3 * o, ey - 1.6, 1.6 * big, 1.5 * big);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ex - 1.6 * o, ey + 1.7, 0.75, 0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
  // a short neat lash line over its outer half, round at both ends, one round flick at its corner
  stroke3(ctx, a, [x - R * 0.1 * o, y - R * 1.12], [x + R * 0.78 * o, y - R * 1.02], [x + R * 1.08 * o, y - R * 0.2], 1.2, LASH);
  stroke3(ctx, a, [x + R * 0.98 * o, y - R * 0.56], [x + (R + 0.9) * o, y - R * 0.74], [x + (R + 1.4) * o, y - R * 1.0], 0.85, LASH);
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 0.9 + (bo + bi) * 0.35, x + o * 2, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1.5);
  ctx.stroke();
}
// The mouth, a soft "y" under its nose; two caramel teeth when it opens.
function mouth(ctx, a, x, y, m) {
  const LIP = '#a04a7a';
  const DARK = '#7a2a58';
  const line = (pts, w = 0.72) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const teeth = (n = 1) => {
    for (const d of [-0.5, 0.5]) {
      smooth(ctx, [[x + d - 0.48, y + 0.4], [x + d + 0.48, y + 0.4], [x + d + 0.42, y + 0.4 + 1.5 * n], [x + d - 0.42, y + 0.4 + 1.5 * n]]);
      ctx.fillStyle = tone(a, '#ffc884');
      ctx.fill();
    }
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y + 0.3], [x, y], [x + w, y + 0.3], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.8, w * 0.5, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cc0');
    ctx.fill();
  };
  // (the little "y": a short line down from the nose, then the two soft curls of its lip)
  const stem = () => line([[x, y - 1.2], [x, y - 0.6], [x, y]], 0.6);
  switch (m) {
    case 'smile':
      stem();
      line([[x - 2, y - 0.2], [x - 1, y + 1.2], [x, y], [x + 1, y + 1.2], [x + 2, y - 0.2]]);
      break;
    case 'open':
      stem();
      open(1.7, 2);
      teeth(0.8);
      break;
    case 'teeth':
      stem();
      open(1.8, 2.2);
      teeth(1);
      break;
    case 'nib':
      stem();
      line([[x - 1.2, y + 0.2], [x, y + 0.7], [x + 1.2, y + 0.2]]);
      teeth(0.9);
      break;
    case 'squeak':
      stem();
      open(1.3, 1.7);
      teeth(0.7);
      break;
    case 'o':
      stem();
      ell(ctx, x, y + 0.9, 0.9, 1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'small':
      stem();
      ell(ctx, x, y + 0.6, 0.55, 0.5);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'puff':
      line([[x - 1.4, y + 0.2], [x, y + 0.6], [x + 1.4, y + 0.2]], 0.6);
      break;
    case 'blow':
      ell(ctx, x + 0.4, y + 0.6, 0.85, 0.75);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'blep':
      stem();
      line([[x - 1.6, y], [x, y + 0.5], [x + 1.6, y]]);
      ell(ctx, x + 0.3, y + 1.1, 0.8, 0.95);
      ctx.fillStyle = tone(a, '#ff8eb4');
      ctx.fill();
      break;
    case 'flat':
      stem();
      line([[x - 1.6, y + 0.4], [x, y + 0.3], [x + 1.6, y + 0.4]]);
      break;
    case 'set':
      stem();
      line([[x - 1.6, y + 0.5], [x, y], [x + 1.6, y + 0.5]], 0.8);
      break;
    case 'wobble':
      stem();
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.3], [x, y + 0.3], [x + 0.9, y - 0.3], [x + 1.8, y + 0.4]], 0.65);
      break;
    case 'frown':
      stem();
      line([[x - 1.6, y + 0.8], [x, y - 0.1], [x + 1.6, y + 0.8]]);
      break;
    case 'sleep':
      line([[x - 1.2, y + 0.3], [x, y + 0.7], [x + 1.2, y + 0.3]], 0.6);
      break;
    case 'talkA':
      stem();
      open(1.4, 1.8);
      teeth(0.7);
      break;
    case 'talkE':
      stem();
      open(1.7, 1.1);
      break;
    default:
      // at rest: its little "y", one curl a touch higher
      stem();
      line([[x - 1.8, y + 0.1], [x - 0.9, y + 1], [x, y], [x + 0.9, y + 1], [x + 1.9, y - 0.3]], 0.66);
  }
}
// The skull: round and wide, fluffy cheek ruffs (soft bumps) low at both sides, a short snout.
const SKULL = [[-18.4, 2], [-18, -8], [-12.4, -15.4], [-3, -18.4], [6.6, -17.4], [14, -12], [18, -4.6], [19.8, 2.6], [18.6, 7.6], [15.4, 12.4], [9, 15], [2, 15.6], [-4, 15.6], [-10.2, 14.8], [-15.6, 11.4], [-19.6, 8.6], [-18, 5.4]];
function ear(ctx, a, mode, root, base, name, flat) {
  ctx.save();
  ctx.translate(...root);
  ctx.rotate(base + swingOf(a, name, 'head') * 0.85 + flat);
  // a huge round dish, its root sunk inside the skull
  smooth(ctx, [[-5, 3], [-10, -3], [-10.6, -10.6], [-6.4, -15.6], [0.6, -16.6], [7.4, -13.4], [9.6, -6.6], [7.4, 0], [3.6, 3.4]]);
  paint(ctx, a, mode, EAR[0]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    // thin enough for the light to glow through: a pink heart of light
    glow(ctx, -0.6, -9, 10, EAR[1], 0.9);
    glow(ctx, -1, -10, 5, EAR[2], 0.5);
    ctx.beginPath();
    ctx.moveTo(-6.6, -12.6);
    ctx.quadraticCurveTo(-3, -17, 3, -15.6);
    pen(ctx, tone(a, '#ffffff', 0.7), 0.9);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  const flat = q.earFlat ?? 0;
  ear(ctx, a, mode, EAR_F, -0.78, 'earF', -flat * 0.9 + (q.earTurnF ?? 0));
  ear(ctx, a, mode, EAR_N, 0.62, 'earN', flat * 0.9 + (q.earTurnN ?? 0));
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -4, -12, 16, FUR[0], 0.9);
    // a sky-blue swirl over the back of its head, like floss twisted on the stick
    glow(ctx, -17, -6, 10, BLUE[1], 0.75);
    glow(ctx, -14, 12, 9, FUR[2], 0.6);
    // its cream muzzle and cheeks
    smooth(ctx, [[0, 4], [6, -0.6], [13, -1.4], [19, 2], [19.4, 8], [14, 13.6], [5, 14.8], [-0.6, 11]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 12, 3, 7, CREAM[0], 0.9);
    // the floss of its cheek ruffs: soft curls
    for (const [cx, cy, r, s] of [[-14.6, 10.2, 3, 1], [-9.6, 13, 2.6, -1], [12.6, 12.2, 2.4, 1]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * (s > 0 ? 0.9 : 0.1), Math.PI * (s > 0 ? 1.9 : 1.1));
      pen(ctx, tone(a, s > 0 ? FUR[0] : BLUE[0], 0.8), 0.7);
      ctx.stroke();
    }
    ctx.restore();
    // cheeks
    for (const [cx, cy, k] of [[-10.4, 5.4, 0.7], [7.4, 6.6, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.6);
      ctx.fillStyle = tone(a, '#ff8ec0', 0.45 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -5.6, -2, -1, f);
    eye(ctx, a, 7.4, -2.4, 1, f);
    brow(ctx, a, -5.8, -9.6, -1, f.b);
    brow(ctx, a, 7.6, -10, 1, f.b);
    // whiskers: a few soft white strokes from its snout (never more than three a side)
    const tw = q.twitch ?? 0;
    for (const [dy, l, an] of [[-0.6, 7, -0.18], [0.8, 7.6, 0.02], [2.2, 6.6, 0.2]]) {
      ctx.beginPath();
      ctx.moveTo(15.6, 5 + dy);
      ctx.quadraticCurveTo(15.6 + l * 0.5, 5 + dy + an * l * 0.4 - 0.4 + tw * 0.4, 15.6 + l, 5 + dy + an * l + tw * 0.6);
      pen(ctx, tone(a, '#ffffff', 0.85), 0.42);
      ctx.stroke();
    }
    // the nose: a little rounded pink heart-ish button with a glint
    const sn = q.sniff ? Math.sin((a.now ?? 0) * 28) * 0.25 : 0;
    smooth(ctx, [[16 + sn, 2.6], [19.2 + sn, 2.2], [19.8 + sn, 3.8], [17.8 + sn, 5.6], [16 + sn, 4.4]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 17.6 + sn, 3, 0.7, 0.4, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    mouth(ctx, a, 17.6, 7.4, f.m);
  }
  ctx.restore();
}

// ---------- Its body ----------
// The floss of its coat: a sky-blue swirl down its back, a cream tummy, soft floss curls (clipped to
// its body's outline).
function floss(ctx, a, mode, D) {
  if (mode !== 'fill' || !a.blTorsoPts) return;
  const q = a.gl ?? {};
  ctx.save();
  ctx.beginPath();
  a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.clip();
  ctx.save();
  enter(ctx, a, D, 'waistB');
  glow(ctx, 62, 106, 16, BLUE[1], 0.85);
  glow(ctx, 66, 96, 9, BLUE[0], 0.7);
  smooth(ctx, [[82, 99], [93, 100], [99, 110], [96, 121], [86, 124], [79, 117], [78, 106]]);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  glow(ctx, 90, 104, 6, CREAM[0], 0.9);
  // floss curls: soft open loops of lighter floss
  const fl = q.fluff ?? 0;
  for (const [cx, cy, r, c] of [[64, 100, 3.4, BLUE[0]], [60, 112, 3, BLUE[0]], [70, 118, 2.8, FUR[0]], [74, 104, 2.4, FUR[0]], [88, 96, 2.2, FUR[0]]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (1 + fl * 0.2), Math.PI * 0.8, Math.PI * 2.1);
    pen(ctx, tone(a, c, 0.75), 0.9);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}
// A fluffy rim round its body when it puffs up (outside its outline, both passes): a few soft lobes.
function fluffRim(ctx, a, mode, D) {
  const fl = a.gl?.fluff ?? 0;
  if (fl < 0.04) return;
  ctx.save();
  enter(ctx, a, D, 'waistB');
  ctx.beginPath();
  for (const [cx, cy, r] of [[64, 98, 6], [60, 110, 6.4], [66, 121, 5.6], [96, 104, 5.4], [98, 116, 5], [80, 92, 5]]) {
    const rr = r * fl;
    ctx.moveTo(cx + rr, cy);
    ctx.arc(cx, cy, rr, 0, TAU);
  }
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') glow(ctx, 62, 104, 10 * fl, BLUE[1], 0.6);
  ctx.restore();
}
// Its tail: a big floss plume curling up behind like a scroll, on two springy halves.
const TAIL_PTS_A = [[71.6, 117], [64, 116.6], TAIL_B];
const TAIL_PTS_B = [[52.6, 106], [52, 99], [56.4, 95.4], [60.4, 98]];
const TAIL_W = [8, 13, 16, 16, 14, 11, 8];
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const puffK = a.gl?.tailPuff ?? 1;
  const c = ribbon(ctx, pts, TAIL_W.map((w) => w * D.SC * puffK));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] - 0.4, c[i][1] - 1.2, 3.2, FUR[0], 0.55);
  for (let i = Math.floor(c.length * 0.45); i < c.length; i += 2) glow(ctx, c[i][0], c[i][1], 3, BLUE[1], 0.5);
  ctx.restore();
}
// Its tiny paws: soft pink mitts (the base's hands, coloured), with a cream pad.
function paw(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const [x, y] = D.J[`hand${k}`];
  ell(ctx, x + 0.4, y + 0.8, 2.2, 1.6);
  ctx.fillStyle = tone(a, k === 'N' ? CREAM[1] : CREAM[2]);
  ctx.fill();
  ctx.restore();
}

// ---------- Its things in the world ----------
// A sugar crystal: a little faceted pink-white gem (in rig space), grown solid, nibbled down.
function crystal(ctx, a, x, y, s, ang = 0) {
  if (s <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  for (const mode of ['line', 'fill']) {
    smooth(ctx, [[-1.8, 1.6], [-2, -0.6], [-0.6, -2.4], [1.2, -2.2], [2.1, -0.2], [1.6, 1.8]]);
    if (mode === 'line') {
      pen(ctx, '#c88aac', 0.7);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff0f8';
      ctx.fill();
      smooth(ctx, [[0, -2.2], [1.1, -2], [1.9, -0.3], [0.4, 0.2]]);
      ctx.fillStyle = '#ffd2ea';
      ctx.fill();
      ell(ctx, -0.8, -1, 0.5, 0.8, -0.4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.restore();
}
// A puff of candy floss: soft overlapping rounds, pink with a blue heart, lit on top.
function flossPuff(ctx, x, y, r, al, rot = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  const lobes = [[0, 0, 1], [r * 0.7, -r * 0.25, 0.72], [-r * 0.66, -r * 0.18, 0.74], [r * 0.2, -r * 0.62, 0.66], [-r * 0.1, r * 0.4, 0.7]];
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    for (const [dx, dy, k] of lobes) {
      const px = x + dx * Math.cos(rot) - dy * Math.sin(rot);
      const py = y + dx * Math.sin(rot) + dy * Math.cos(rot);
      ctx.moveTo(px + r * k, py);
      ctx.arc(px, py, r * k, 0, TAU);
    }
    if (pass === 'line') {
      pen(ctx, '#d88cb6', Math.max(0.4, r * 0.18));
      ctx.stroke();
    } else {
      ctx.fillStyle = FUR[1];
      ctx.fill();
    }
  }
  glow(ctx, x + r * 0.1, y + r * 0.1, r * 0.9, BLUE[1], 0.8);
  glow(ctx, x - r * 0.3, y - r * 0.4, r * 0.7, FUR[0], 0.9);
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { bath: 7.8, nibble: 7.2, popcorn: 6.4, ears: 6.6 };
const ORDER = ['bath', 'nibble', 'popcorn', 'ears'];
const POOL = ['puff', 'pop', 'shake'];
const MELEE = ['pop', 'shake'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
// (far: the puff; close up: the pop and the shake in turn; m.swingFar is set as its wind-up starts)
const pick = (m, n) => (m.swingFar === true ? 'puff' : m.swingFar === false ? MELEE[n % 2] : POOL[n % POOL.length]);

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL, pick);
  const now = F.now;
  const q = { face: null, earF: 0, earN: 0, earFlat: 0, earTurnF: 0, earTurnN: 0, tailRot: 0, tailCurl: 0, tailPuff: 1, fluff: 0, blush: 0, twitch: 0, sniff: false, held: -1, find: -1, bathDust: 0, shakeS: -1, cloud: -1, puffS: -1, popS: -1, ringS: -1, tuft: -1, sweat: -1, zz: 0, flipNow: false };
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
  // Standing: paws held up at its chest the way a chinchilla does, a slow breath; its whiskers twitch now
  // and then. Walking: a scurry, leaning in, a little bob of its tail on every step.
  const br = c.breath ?? 0;
  go({ shN: -46 + br * 1.5, elN: -104, hwN: -24, shF: -40 + br, elF: -100, hwF: -20, head: 1, chest: -br * 0.6 }, 1);
  add({ tilt: 7, head: -3 }, walking);
  q.tailRot = Math.sin(t * 0.7) * 0.05 + Math.sin(U * TAU * 2) * 0.1 * walking;
  q.tailCurl = Math.sin(t * 0.55 + 1) * 0.06;
  q.earF = Math.sin(t * 0.5) * 0.05;
  q.earN = Math.sin(t * 0.43 + 2) * 0.05;
  q.twitch = Math.max(0, Math.sin(t * 2.3)) ** 8;
  q.sniff = q.twitch > 0.3;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  let sit = 0;
  let curl = 0;

  if (k > 0.001 && piece === 'bath') {
    // down low, rubbing one cheek then the other in the sugar
    const low1 = win(pu, 0.2, 0.7, 4.0, 4.4);
    go({ lift: -0.16, tilt: 26, head: 18, shN: -20, elN: -30, shF: -14, elF: -30, fxN: 0.2, fxF: 0.1 }, low1 * k);
    const rub = Math.sin((pu - 0.8) * 5);
    add({ head: rub * 12, neckR: rub * 5, chest: rub * 3, pelvis: -rub * 3 }, win(pu, 0.8, 1.0, 3.8, 4.1) * k);
    q.tailRot += rub * 0.3 * low1 * k;
    say('rub', low1 * k);
    q.bathDust = win(pu, 0.8, 1.0, 3.9, 4.2) * k;
    // up, and the shake from nose to tail
    const sh = win(pu, 4.3, 4.45, 5.5, 5.8);
    add({ chest: Math.sin(pu * 34) * 4 * sh, head: Math.sin(pu * 34 - 0.6) * 7 * sh, pelvis: -Math.sin(pu * 34) * 3 * sh }, k);
    q.earF += Math.sin(pu * 34) * 0.4 * sh * k;
    q.earN -= Math.sin(pu * 34) * 0.4 * sh * k;
    q.fluff = Math.max(q.fluff, sh * k);
    q.tailPuff = 1 + 0.25 * sh * k;
    if (pu > 4.3 && pu < 6.6) q.shakeS = pu - 4.3;
    say('shake', sh * k);
    // fluffed up and proud
    const pr = win(pu, 5.7, 6.0, 7.2, 7.7);
    go({ chest: -4, head: -6, tilt: -3 }, pr * k);
    q.fluff = Math.max(q.fluff, 0.6 * pr * k);
    say('proud', pr * k);
  }
  if (k > 0.001 && piece === 'nibble') {
    // a crystal glints in the grass: it spots it, picks it up
    if (pu < 1.7) q.find = sstep((pu - 0.1) / 0.4) * k;
    const look = win(pu, 0.3, 0.6, 1.0, 1.2);
    go({ head: 16, neckR: 4 }, look * k);
    say('spot', look * k);
    const pickUp = win(pu, 1.0, 1.4, 1.6, 1.9);
    go({ tilt: 24, head: 16, lift: -0.08, shN: -40, elN: -20, shF: -34, elF: -20 }, pickUp * k);
    // sat up, the crystal in both paws at its mouth, nibbling fast
    sit = Math.max(sit, win(pu, 1.7, 2.1, 6.0, 6.5) * k);
    const nib = win(pu, 1.9, 2.2, 5.4, 5.7);
    const nb = Math.sin(pu * 22);
    go({ shN: -66, elN: -112, hwN: -30, shF: -60, elF: -108, hwF: -26, head: 6 + nb * 1.6, neckR: 2 }, nib * k);
    say(nb > 0 ? 'nibble' : 'nibbleB', nib * k);
    if (pu > 1.7 && pu < 5.5) q.held = 1 - sstep((pu - 2.4) / 3.0);
    // the last crumb; its paws licked
    const lick = win(pu, 5.5, 5.7, 6.6, 7.0);
    go({ shN: -60, elN: -118, hwN: -40, head: 10 }, lick * k);
    say('lick', lick * k);
  }
  if (k > 0.001 && piece === 'popcorn') {
    // its ears perk, a wiggle
    const perk = win(pu, 0.1, 0.4, 1.0, 1.2);
    q.earF += 0.3 * perk * k;
    q.earN -= 0.3 * perk * k;
    say('perk', perk * k);
    add({ pelvis: Math.sin(pu * 20) * 3 * win(pu, 0.6, 0.8, 1.2, 1.4) }, k);
    // two popcorn leaps straight up, twisting (clean mirror flips at the top)
    for (const h0 of [1.4, 2.6]) {
      const v = clamp((pu - h0) / 0.8, 0, 1);
      if (v > 0 && v < 1) {
        const crouch = Math.sin(Math.PI * clamp(v / 0.2, 0, 1)) * (v < 0.2 ? 1 : 0);
        const up = Math.sin(Math.PI * clamp((v - 0.15) / 0.75, 0, 1));
        go({ lift: -0.06 * crouch }, k);
        add({ hop: up * 0.26 }, k);
        go({ tilt: -6 * up, shN: -100, elN: -60, shF: -90, elF: -60, fyN: 0.3 * up, fyF: 0.3 * up, toeN: 20 * up, toeF: 20 * up }, k * up);
        q.tailRot -= 0.5 * up * k;
        q.fluff = Math.max(q.fluff, 0.5 * up * k);
        if (v > 0.42 && v < 0.62 && k > 0.5) q.flipNow = true;
        say('whee', k);
      }
    }
    // a happy shimmy
    const sm = win(pu, 3.9, 4.1, 5.6, 6.0);
    add({ pelvis: Math.sin(pu * 18) * 4 * sm, chest: -Math.sin(pu * 18) * 3 * sm, head: Math.sin(pu * 18 - 0.6) * 3 * sm }, k);
    q.tailRot += Math.sin(pu * 18) * 0.25 * sm * k;
    say('happy', sm * k);
  }
  if (k > 0.001 && piece === 'ears') {
    // one ear turns, then the other
    q.earTurnF += -0.5 * win(pu, 0.2, 0.5, 1.4, 1.7) * k;
    q.earTurnN += 0.5 * win(pu, 1.0, 1.3, 2.2, 2.5) * k;
    say('listen', win(pu, 0.2, 0.4, 2.2, 2.4) * k);
    // it freezes, up on its toes, listening
    const fr = win(pu, 2.3, 2.5, 3.6, 3.9);
    go({ lift: 0.04, toeN: 20, toeF: 20, tilt: -4, head: -6, shN: -60, elN: -110, shF: -54, elF: -106 }, fr * k);
    q.earF += 0.2 * fr * k;
    q.earN -= 0.2 * fr * k;
    say('freeze', fr * k);
    // nothing
    say('meh', win(pu, 3.8, 3.9, 4.2, 4.4) * k);
    // it pulls one big ear down with both paws and grooms it
    const gr = win(pu, 4.3, 4.7, 6.0, 6.5);
    go({ shN: -128, elN: -70, hwN: -30, shF: -120, elF: -74, head: 14, neckR: 5 }, gr * k);
    q.earTurnN += 1.0 * gr * k;
    q.earN += Math.sin(pu * 9) * 0.12 * gr * k;
    say('groom', gr * k);
  }

  // (its own marks over its head)
  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: up on its toes, ears forward, paws tucked -----
  if (hunting && !hurt) {
    go({ tilt: 4, head: -2, lift: 0.01, toeN: 8, toeF: 8 }, 1 - walking * 0.6);
    q.earF += 0.25;
    q.earN -= 0.15;
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
    if (mvName === 'puff') {
      // it fluffs right up and takes a deep breath, cheeks round
      go({ chest: -6, head: -8, lift: 0.03, toeN: 12, toeF: 12, shN: -60, elN: -110, shF: -54, elF: -106 }, wu);
      q.fluff = Math.max(q.fluff, wu);
      q.tailPuff = 1 + 0.3 * wu;
      say('breath', W);
      // then blows: a puff of floss at you
      if (s >= 0) {
        go({ chest: 3, head: 6, x: 0.03, shN: -40, elN: -100, shF: -34, elF: -96 }, snap * sw);
        q.fluff = Math.max(q.fluff, 0.4 * sw);
        q.puffS = s;
        say('blow', win(s, 0, 0.03, 0.35, 0.5));
        say('smug', win(s, 0.5, 0.6, 0.85, 0.95));
      }
    } else if (mvName === 'pop') {
      // a crouch; then a twisting leap at you, and a bonk
      go({ lift: -0.1, tilt: 14, head: 6, shN: -30, elN: -90, shF: -24, elF: -90, fxN: 0.12, fxF: -0.1 }, wu);
      q.tailRot -= 0.4 * wu;
      say('focus', W);
      if (s >= 0) {
        const v = clamp(s / 0.5, 0, 1);
        const up = Math.sin(Math.PI * v);
        const out1 = sstep(s / 0.28);
        const back = sstep((s - 0.5) / 0.4);
        const xx = 0.42 * out1 * (1 - back);
        go({ x: xx, tilt: 18 * up, head: -6, shN: -130, elN: -40, shF: -120, elF: -40, fxN: xx * toLeg, fxF: xx * toLeg, fyN: 0.2 * up, fyF: 0.24 * up }, sw);
        add({ hop: up * 0.2 }, sw);
        if (s > 0.12 && s < 0.3) q.flipNow = true;
        if (s > 0.36 && s < 0.9) q.popS = s - 0.36;
        q.tailRot -= 0.6 * up * sw;
        say('shout', win(s, 0, 0.04, 0.4, 0.5));
        say('smug', win(s, 0.55, 0.65, 0.85, 0.95));
      }
    } else {
      // braced low; then the dust-bath shake, sugar flung out all round
      go({ lift: -0.08, tilt: 10, head: 8, shN: -24, elN: -96, shF: -20, elF: -96, fxN: 0.15, fxF: -0.12 }, wu);
      q.fluff = Math.max(q.fluff, 0.5 * wu);
      say('focus', W);
      if (s >= 0) {
        const sh = win(s, 0, 0.04, 0.5, 0.7);
        add({ chest: Math.sin(s * 40) * 5 * sh, head: Math.sin(s * 40 - 0.6) * 9 * sh, pelvis: -Math.sin(s * 40) * 4 * sh }, sw);
        q.earF += Math.sin(s * 40) * 0.5 * sh;
        q.earN -= Math.sin(s * 40) * 0.5 * sh;
        q.fluff = Math.max(q.fluff, sh);
        q.tailPuff = Math.max(q.tailPuff, 1 + 0.3 * sh);
        q.ringS = s;
        say('shake', sh);
        say('smug', win(s, 0.6, 0.7, 0.85, 0.95));
      }
    }
  }
  // ----- Hurt: a squeak and a wince, ears flat, a wisp of floss slipping off -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shN: -60, elN: -120, shF: -54, elF: -116, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.fluff = Math.max(q.fluff, 0.6 * kh);
    q.tuft = ago;
  }
  // ----- After landing a hit: a smug ear flick, nose in the air -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.8, 1.1) * (1 - F.moveW);
    go({ head: -12, chest: -3, tilt: -3 }, kg);
    q.earN += Math.sin(Math.PI * clamp(gl / 0.4, 0, 1)) * 0.6 * kg;
    say('smug', kg);
  }
  // ----- A nap (its habitat): curled in a floss ball, its tail wrapped round -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    curl = Math.max(curl, nw);
    q.earFlat = Math.max(q.earFlat, 0.7 * nw);
    q.tailRot += 1.0 * nw;
    q.tailCurl += 0.8 * nw;
    q.fluff = Math.max(q.fluff, 0.5 * nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // sat up on its haunches
  if (sit > 0.001) go({ lift: -0.14, tilt: -6, fxN: 0.3, fyN: 0.04, fxF: 0.26, fyF: 0.04, toeN: -10, toeF: -10 }, sit);
  // curled into a ball: low, head tucked, paws in
  if (curl > 0.001) go({ lift: -0.2 + Math.sin(now * 1.4) * 0.006, tilt: 20, head: 20, neckR: 5, shN: -30, elN: -120, shF: -26, elF: -120, fxN: 0.3, fxF: 0.24, fyN: 0.04, fyF: 0.04 }, curl);
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
  settleFace(st, q, now, m.uid, SHUTS, 4.1);
  easeKeys(st, q, ['earFlat', 'earTurnF', 'earTurnN', 'tailRot', 'tailCurl', 'tailPuff', 'earF', 'earN', 'fluff', 'blush'], dt, (key) => (key.startsWith('tail') ? 9 : key === 'fluff' ? 10 : 12));
  q.calm = k;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
const BUBBLE = [[-5.4, -4.6], [-2.6, -6.4], [2.6, -6.4], [5.6, -4], [5.6, 2.6], [1.2, 4.6], [-0.4, 7], [-1.6, 4.6], [-5.6, 2.8]];
const BCOL = [INK, '#fffafd', '#e8608e', '#8a6ab0'];

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
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
  const handPt = (k) => ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  // the sugar crystal it finds, then holds in both paws (nibbled smaller and smaller)
  if ((q.find ?? -1) > 0.02) crystal(ctx, a, 13, -1.4, q.find, 0.2);
  if ((q.held ?? -1) >= 0) {
    const [nx, ny] = handPt('N');
    const [fx0, fy0] = handPt('F');
    crystal(ctx, a, (nx + fx0) / 2 + 0.6, (ny + fy0) / 2 - 1.2, 0.3 + q.held * 0.7, -0.3);
  }
  // the bath: little puffs of sugar kicked up round its cheek
  if ((q.bathDust ?? 0) > 0.05) {
    const [hx] = headAt(a, D, [10, 10]);
    for (let i = 0; i < 3; i++) {
      const f = (t * 1.3 + i / 3) % 1;
      dust(ctx, hx - 2 + i * 3 + f * 2, -1 - f * 4, 1 + f * 1.4, q.bathDust * (1 - f) * 0.9, '#ffffff', '#f4d6e6');
    }
  }
  // the shake: a sparkly cloud of sugar flung off
  if ((q.shakeS ?? -1) >= 0 && q.shakeS < 2.2) {
    const e = q.shakeS / 2.2;
    const [cx, cy] = ptOf(a, D, 'chest', D.J.ribs);
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU + 0.4;
      const r = 6 + e * 14;
      sparkle(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.7, (i % 2 ? 1 : 1.5) * Math.sin(Math.PI * e), 1, i % 2 ? SUGAR : BLUE[0]);
    }
    dust(ctx, cx, cy + 2, 5 + e * 6, (1 - e) * 0.5, '#ffffff', '#f4d6e6');
  }
  // ----- Floss Puff: blown from its mouth, then off at you -----
  if ((q.puffS ?? -1) >= 0 && q.puffS < 0.9) {
    const e = q.puffS;
    const [mx, my] = headAt(a, D, [22, 8]);
    for (let i = 0; i < 3; i++) {
      const v = clamp(e * 2.2 - i * 0.2, 0, 1);
      flossPuff(ctx, mx + 2 + v * (10 + i * 5), my - v * 2 + i, 1.2 + v * 2.2, (1 - v) * 0.95, v * 2 + i);
    }
  }
  // ----- Popcorn Pop: a bonk of sugar sparkles where it lands on you -----
  if ((q.popS ?? -1) >= 0 && q.popS < 0.5) {
    const e = q.popS / 0.5;
    const [hx, hy] = headAt(a, D, [20, 2]);
    glow(ctx, hx + 2, hy, 7 * (1 - e * 0.4), FUR[2], 0.45 * (1 - e));
    for (let i = 0; i < 5; i++) {
      const an = -1.3 + i * 0.65;
      sparkle(ctx, hx + 2 + Math.cos(an) * (3 + e * 9), hy + Math.sin(an) * (3 + e * 8), (i % 2 ? 1 : 1.5) * (1 - e), 1, i % 2 ? SUGAR : BLUE[0]);
    }
  }
  // ----- Sugar Shake: a ring of sugar and floss wisps flung out round it -----
  if ((q.ringS ?? -1) >= 0 && q.ringS < 0.9) {
    const e = q.ringS / 0.9;
    const [cx, cy] = ptOf(a, D, 'chest', D.J.ribs);
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU + 0.2;
      const r = 5 + sstep(e) * 20;
      const x = cx + Math.cos(an) * r;
      const y = Math.min(-1, cy + Math.sin(an) * r * 0.6);
      if (i % 2) sparkle(ctx, x, y, 1.6 * (1 - e), 1, SUGAR);
      else flossPuff(ctx, x, y, 1.4 * (1 - e * 0.5), 1 - e, an);
    }
  }
  // hurt: a wisp of floss slipping off and drifting down
  if ((q.tuft ?? -1) >= 0 && q.tuft < 0.9) {
    const e = q.tuft / 0.9;
    const [cx, cy] = ptOf(a, D, 'chest', [D.J.ribs[0] - 6, D.J.ribs[1]]);
    flossPuff(ctx, cx - 3 - e * 6, cy - 2 + e * 8 + Math.sin(e * 8) * 1, 1.5, 1 - sstep((e - 0.6) / 0.4), e * 2);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-16, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -22]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#b07aa8', '#fff4fa');
    }
  }
  const [bx, by] = headAt(a, D, [10, -40]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

// The shot it blows in the dungeon (render/dreamfx.js dreamShot, the 'spit' vfx): a puff of candy floss
// tumbling along, a few sugar sparkles trailing.
export function flossShot(ctx, shot, x, y, p, d) {
  if (shot !== 'flosspuff') return false;
  ctx.save();
  for (let i = 1; i <= 3; i++) sparkle(ctx, x - d * i * 3.4, y + Math.sin(p * 14 + i) * 1.2, 1.1 - i * 0.2, 0.9 - i * 0.2, SUGAR);
  flossPuff(ctx, x, y, 3.4, 1, p * 6 * d);
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
    torsoSkin: (ctx, a, mode, S, D) => {
      fluffRim(ctx, a, mode, D);
      floss(ctx, a, mode, D);
    },
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('chinchilla', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Popcorn: a clean mirror flip at the top of each twist, never a squeeze)
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
export const FLOSS_CHINCHILLA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const FLOSS_CHINCHILLA_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.06), speed: Math.round(R.speed * BIG) };
