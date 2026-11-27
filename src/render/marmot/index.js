// The Whistledown Marmot (2026-11-27, the Sky Garden's Pegasus Foal remade from scratch as a new creature;
// the id stays `cloudsheep`). The Cloud Meadows are alpine meadows that happen to float, and their marmots
// grow their winter coats in as cloud: a soft cloud ruff round the neck (the "cloud mane" tailors pay for)
// and a big puff of a cloud tail. Every marmot is the meadow's self-appointed lookout and whistles at
// everything: a hawk, a passing cloud, its own tail. They live on Frozen Peak's lake shore too (marmots
// love a mountain). On its own copy of the creature base (rig.js; body.js `marmot`: a chubby pear of a
// body, the belly round and low, short sturdy legs on wide feet, short arms with small deft paws), dressed
// here; its head, ruff and tail drawn here from scratch over the mannequin (never the shared face, never
// the hero).
//   look    warm honey fur, a cream belly, muzzle and cheeks, a soft cocoa cap over its crown (an alpine
//           marmot's), small round ears low on its head, two little buck teeth; cocoa paws and feet; a
//           cloud ruff (ONE soft closed shape with a few broad lobes, lilac in its shade, white on top) and
//           a cloud plume of a tail on two springs. Its own warm outline, outer edge only, face bare.
//   eyes    its own "drop eyes": gentle downturned (tareme) eyes, a deep cocoa iris warming to honey at the
//           bottom, a curved crescent shine and a dot, a neat lash line whose outer end droops into a
//           small round tail; short round cocoa brows that do its acting.
//   walk    the base's walk at an easy waddling pace (22), the ruff and tail bouncing on their springs.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - lookout (6.8 s): up tall on its toes, paws together at its chest, a slow scan one way and
//             the other; it spots something! a sharp whistle (cheeks puffed, then FWEET!, soft rings);
//             it was only a cloud. Sheepish;
//           - dandelion (7.0 s): it bends to pick a dandelion clock, sniffs it, blows: the seeds float off
//             and it watches them go, delighted; the stem nibbled down;
//           - stretch (6.4 s): paws up as high as they go, up on its toes, a huge yawn (buck teeth and
//             all), and a contented wiggle;
//           - groom (6.6 s): paws licked and scrubbed over its cheeks in quick little circles, then its
//             ruff patted back into shape, a wisp of cloud puffing off.
//   moves   Alarm Whistle (up tall, a deep breath, cheeks puffed; then a piercing FWEET! at you, sound rings
//           and a little gust); Belly Bump (it rocks back on its heels; then the whole chubby belly
//           bumped into you, a puff of cloud); Marmot Boxing (up on its toes, paws up like a boxer; a
//           quick one-two of paw jabs, a soft pow at each).
//   else    hurt: a squeak, ears back, ruff flattened; after landing a hit: a smug little whistle and a
//           paw dusted on its ruff; hunting you: crouched forward, ruff fluffed up, paws up; low on health:
//           worried, a bead of sweat, its tail drooping; a nap (habitat): sat down, chin on its ruff, its
//           tail curled round; beaten: dizzy. Its marks over its head (!, ?) are its own little clouds
//           (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: soft white rings and cloud puffs, dandelion
// seeds with downy tops, sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, sline, pen, glow, sparkle, dizzy, sweat, dust, cue, note } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee } from './act.js';

const BIG = 1.12;
const LW = 1.6 / BIG;
const ID = 'whistlemarmot';
const INK = '#9a7462';
const FUR = ['#fff1da', '#f0cd98', '#d4a670', '#b4825a'];
const CAP = ['#c89c74', '#a87a56', '#8a6046'];
const CREAM = ['#fffbf2', '#faebd2', '#ecd6b6'];
const PAW = ['#c49a78', '#a47a5a', '#86603f', '#6c4c34'];
const EARIN = ['#f6d2c6', '#dca898'];
const CLOUD = ['#ffffff', '#f4f2fc', '#e0dcf2', '#c6c0e2'];
const LASH = '#4a2e26';
const IRIS = ['#20110a', '#5a3420', '#956038', '#dcae70'];
const RING = ['#ffffff', '#e6e2f6'];

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
const HS = 1.28;
const HO = [1.4, -14.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
// (its cloud tail: the root tucked inside its rump, the plume rising behind it on two springs)
const TAIL_A = [78, 122];
const TAIL_B = [64, 114];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 70, c: 7.4, gain: 0.45, turn: 0.6, hang: 0.15, max: 14, flutter: 0.8, hz: 0.4, dir: [-6, -3] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 52, c: 5.6, gain: 0.55, turn: 0.7, hang: 0.15, max: 18, flutter: 1.2, hz: 0.45, dir: [-3, -8] } },
];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? PIV2[bone]];
const ptOf = (a, D, bone, p) => {
  const q = pivOf(D, bone);
  return D.at(a, bone, [(p[0] - q[0]) * D.SC, (p[1] - q[1]) * D.SC]);
};
const headAt = (a, D, uv) => ptOf(a, D, 'head', hk(uv));
function headFrame(ctx, a, D) {
  D.frame(ctx, a, 'head');
  const p = pivOf(D, 'head');
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}

// ---------- Its face ----------
// b: [far brow lift, near brow lift] (negative up); g: where it looks
const FACES = {
  calm: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'calm' },
  scan: { e: 'open', g: [1.4, -0.5], b: [-0.4, -0.6], m: 'calm' },
  scanB: { e: 'open', g: [-1.5, -0.4], b: [-0.4, -0.6], m: 'calm' },
  spot: { e: 'wide', g: [1.2, -0.8], b: [-1.6, -1.9], m: 'o' },
  puff: { e: 'squeeze', b: [0.5, 0.6], m: 'puff' },
  whistle: { e: 'squeeze', b: [0.7, 0.8], m: 'whistle' },
  sheepish: { e: 'open', g: [-0.6, 1.2], b: [-1.2, -0.6], m: 'wobble' },
  find: { e: 'wide', g: [0.9, 1.3], b: [-1.3, -1.5], m: 'o' },
  sniff: { e: 'shut', b: [-0.6, -0.8], m: 'calm' },
  blow: { e: 'shut', b: [-0.4, -0.5], m: 'whistle' },
  watch: { e: 'happy', b: [-1.2, -1.4], m: 'open' },
  munch: { e: 'happy', b: [-0.4, -0.6], m: 'chew' },
  reach: { e: 'squeeze', b: [-0.6, -0.8], m: 'grit' },
  yawn: { e: 'shut', b: [-1, -1.2], m: 'yawn' },
  content: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  groom: { e: 'shut', b: [0.2, 0.2], m: 'lick' },
  scrub: { e: 'shut', b: [0.4, 0.4], m: 'chew' },
  proud: { e: 'happy', b: [-1, -0.6], m: 'smile' },
  focus: { e: 'open', g: [1.4, 0.3], b: [0.6, 1], m: 'grit' },
  fierce: { e: 'open', g: [1.5, 0.2], b: [1, 1.2], m: 'teeth' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'shout' },
  smug: { e: 'happy', b: [-0.4, -1.2], m: 'smile' },
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
const SHUTS = new Set(['puff', 'whistle', 'sniff', 'blow', 'watch', 'munch', 'reach', 'yawn', 'content', 'groom', 'scrub', 'proud', 'shout', 'smug', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The drop eye: a gentle downturned eye, its outer corner a little lower; the whole iris always clear.
function eye(ctx, a, x, y, o, f) {
  const w = 3.3;
  const h = 3.7;
  const tilt = o * 0.2;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1.2 - o * 0.3], [x, y - h * 0.85], [x + w, y + 1.2 + o * 0.3], 1.4, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.4], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.6], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    // (a soft downward curve with the droop at its outer end, a small curled tail)
    stroke3(ctx, a, [x - w * o, y + 0.2], [x, y + (kind === 'sleep' ? 2.6 : 2.1)], [x + w * o, y + 1.1], 1.35, LASH);
    stroke3(ctx, a, [x + w * o, y + 1.1], [x + (w + 0.9) * o, y + 1.3], [x + (w + 1.1) * o, y + 2.2], 0.9, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
  ell(ctx, x, y, w * big, h * big, tilt);
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
    ell(ctx, x, y, w * big, h * big, tilt);
    ctx.clip();
    const ix = x + gx * 0.42;
    const iy = y + 0.3 + gy * 0.36;
    const r = w * 0.8 * big;
    ell(ctx, ix, iy, r, r * 1.12);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.42, r * 0.8, r * 0.58);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.78, r * 0.5, r * 0.24);
    ctx.fillStyle = tone(a, IRIS[3]);
    ctx.fill();
    ell(ctx, ix, iy - r * 0.08, r * 0.46, r * 0.5);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    // its shine: a curved crescent up on the far side, a dot low on the near side
    ctx.beginPath();
    ctx.arc(ix - r * 0.08, iy - r * 0.02, r * 0.62, Math.PI * 1.08, Math.PI * 1.5);
    pen(ctx, '#ffffff', 1.0);
    ctx.stroke();
    ell(ctx, ix + r * 0.42, iy + r * 0.36, r * 0.15, r * 0.15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // a neat lash line along the top, its outer end drooping into a small round tail
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.ellipse(0, 0, w * big * 1.04, h * big * 1.04, 0, o > 0 ? -2.5 : -Math.PI + 0.25, o > 0 ? -0.25 : -0.64);
  pen(ctx, tone(a, LASH), 1.2);
  ctx.stroke();
  const ex = o * w * big * 1.0;
  const ey = -0.9;
  stroke3(ctx, a, [ex, ey], [ex + 1.0 * o, ey + 0.4], [ex + 1.1 * o, ey + 1.5], 0.95, LASH);
  ctx.restore();
}
// Short round brows: soft little arcs, round at both ends.
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 1.6, y + lift + 0.3);
  ctx.quadraticCurveTo(x, y - 0.7 + lift * 0.6, x + o * 1.6, y + lift * 0.35 + 0.3);
  pen(ctx, tone(a, CAP[2]), 1.3);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#7c5048';
  const DARK = '#6a2e3e';
  const line = (pts, w = 0.7) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  // its two little buck teeth, peeking under the lip (most mouths show them)
  const teeth = (dy = 0, k = 1) => {
    for (const sx of [-1, 1]) {
      const tx = x + sx * 0.62 - 0.02;
      smooth(ctx, [[tx - 0.55, y + 0.1 + dy], [tx + 0.55, y + 0.1 + dy], [tx + 0.55, y + 1.5 * k + dy], [tx, y + 1.75 * k + dy], [tx - 0.55, y + 1.5 * k + dy]]);
      ctx.fillStyle = tone(a, '#fffdf8');
      ctx.fill();
      pen(ctx, tone(a, '#d8c8bc'), 0.25);
      ctx.stroke();
    }
  };
  const open = (w, h, tooth = true) => {
    smooth(ctx, [[x - w, y], [x, y - 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.82, w * 0.5, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
    if (tooth) teeth(0.1, 0.8);
  };
  // (the little split under its nose, in every mouth)
  stroke3(ctx, a, [x, y - 2], [x + 0.1, y - 1.2], [x, y - 0.4], 0.45, LIP);
  switch (m) {
    case 'smile':
      line([[x - 2.1, y - 0.5], [x - 1, y + 0.7], [x, y - 0.1], [x + 1, y + 0.7], [x + 2.1, y - 0.5]]);
      teeth(0.2, 0.8);
      break;
    case 'open':
      open(1.7, 2);
      break;
    case 'o':
      ell(ctx, x, y + 0.9, 0.85, 1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'whistle':
      ell(ctx, x + 0.3, y + 0.5, 0.55, 0.55);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 0.3, y + 0.5, 0.95, 0, TAU);
      pen(ctx, tone(a, LIP), 0.45);
      ctx.stroke();
      break;
    case 'shout':
      open(1.7, 2.6);
      break;
    case 'squeak':
      open(1.1, 1.6);
      break;
    case 'grit':
      line([[x - 1.7, y + 0.4], [x, y], [x + 1.7, y + 0.4]], 0.8);
      teeth(0.3, 0.7);
      break;
    case 'teeth':
      line([[x - 1.8, y + 0.2], [x, y - 0.2], [x + 1.8, y + 0.2]], 0.8);
      teeth(0.1, 1.05);
      break;
    case 'puff':
      // (cheeks puffed round with the breath)
      for (const cx of [-3.4, 3.2]) {
        ell(ctx, x + cx, y - 0.6, 2.4, 1.9);
        ctx.fillStyle = tone(a, CREAM[0], 0.85);
        ctx.fill();
      }
      line([[x - 0.9, y + 0.4], [x, y + 0.6], [x + 0.9, y + 0.4]], 0.7);
      break;
    case 'chew':
      line([[x - 1.6, y + 0.2], [x - 0.7, y + 0.9], [x + 0.2, y + 0.3], [x + 1, y + 0.8], [x + 1.7, y + 0.1]]);
      teeth(0.4, 0.7);
      break;
    case 'lick':
      line([[x - 1.2, y + 0.2], [x, y + 0.5], [x + 1.2, y + 0.2]]);
      ell(ctx, x + 0.3, y + 1.3, 0.8, 0.9);
      ctx.fillStyle = tone(a, '#ff8aa2');
      ctx.fill();
      break;
    case 'yawn':
      open(2, 3.4);
      break;
    case 'wobble':
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.2], [x, y + 0.3], [x + 0.9, y - 0.2], [x + 1.8, y + 0.4]], 0.65);
      teeth(0.4, 0.6);
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
      // at rest: its soft closed mouth, the buck teeth just showing
      line([[x - 2, y - 0.3], [x - 1, y + 0.5], [x, y - 0.1], [x + 1, y + 0.5], [x + 2, y - 0.3]], 0.6);
      teeth(0.3, 0.75);
  }
}
// The head: broad and round, full cheeks, a short soft muzzle.
const SKULL = [[-18.8, 1], [-17.8, -8.6], [-12.2, -14.8], [-3, -16.8], [6.4, -16], [13.8, -12.4], [18.2, -6.4], [20.6, 0], [20.2, 5.6], [17, 10.8], [10, 14.6], [0, 16], [-10.6, 14], [-16.8, 8.4]];
// Its small round ears, low on its head (`back` laid back, `up` pricked).
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r * 0.9, 1.6], [-r * 1.08, -r * 0.4], [-r * 0.6, -r * 1.12], [r * 0.3, -r * 1.2], [r * 0.98, -r * 0.6], [r * 0.9, 1.6]]);
  paint(ctx, a, mode, CAP[1]);
  if (mode === 'fill') {
    smooth(ctx, [[-r * 0.56, 0.8], [-r * 0.7, -r * 0.3], [-r * 0.36, -r * 0.8], [r * 0.26, -r * 0.84], [r * 0.64, -r * 0.4], [r * 0.56, 0.8]]);
    ctx.fillStyle = tone(a, EARIN[0]);
    ctx.fill();
    glow(ctx, 0, -r * 0.3, r * 0.6, EARIN[1], 0.5);
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const back = q.earBack ?? 0;
  const up = q.earUp ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -12.6, -11.4, 4.2, -0.62 - back * 0.5 + up * 0.25);
  ear(ctx, a, mode, -1.2, -15.2, 4.4, -0.16 - back * 0.6 + up * 0.2);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -2, -9, 15, FUR[0], 0.8);
    glow(ctx, -14, 9, 10, FUR[2], 0.55);
    // its soft cocoa cap over the crown, down to just above its brows (a soft edge, never a helmet line)
    const cap = [[-24, 4], [-24, -24], [18, -24], [16, -13.4], [10, -11.6], [4, -11], [-2, -10.6], [-8, -9], [-13, -5.4], [-17.6, 0]];
    smooth(ctx, cap);
    ctx.fillStyle = tone(a, CAP[0], 0.55);
    ctx.fill();
    smooth(ctx, cap.map(([x0, y0]) => [x0 * 0.98 - 0.4, y0 - 1.1]));
    ctx.fillStyle = tone(a, CAP[0]);
    ctx.fill();
    glow(ctx, 0, -15, 9, CAP[0], 0.4);
    glow(ctx, 4, -16, 7, '#e2b88c', 0.55);
    // the cream muzzle and cheeks
    smooth(ctx, [[3.6, 1.8], [10.6, -1.4], [18, -0.6], [21.4, 4], [19, 10.8], [11, 15], [1.6, 14.4], [0.4, 7.8]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 14, 4.4, 6.4, CREAM[0], 0.9);
    glow(ctx, 5, 12, 5, CREAM[2], 0.45);
    ctx.restore();
    for (const [cx, cy, k] of [[-7.4, 6.8, 0.6], [7.6, 7.6, 1]]) {
      ell(ctx, cx, cy, 2.5, 1.5);
      ctx.fillStyle = tone(a, '#ff9eb0', 0.4 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -2.8, -2.4, -1, f);
    eye(ctx, a, 9.4, -2.8, 1, f);
    brow(ctx, a, -3.2, -8.8, -1, (f.b?.[0] ?? 0) * 0.9);
    brow(ctx, a, 9.2, -9.4, 1, (f.b?.[1] ?? 0) * 0.9);
    // the nose: a soft rounded cocoa button, a light on it
    smooth(ctx, [[16.8, 0.4], [19.8, 0.2], [20.2, 1.6], [18.6, 3.2], [17, 2]]);
    ctx.fillStyle = tone(a, '#8a5a4c');
    ctx.fill();
    ell(ctx, 18.4, 0.9, 0.7, 0.35, 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 17.2, 5.6, f.m);
    // a few fine whiskers on the near cheek
    for (const [dy, c] of [[-0.4, -1.2], [1.4, 0.8]]) {
      ctx.beginPath();
      ctx.moveTo(19.4, 4 + dy);
      ctx.quadraticCurveTo(23, 3.2 + dy + c * 0.5, 26.4, 3.6 + dy + c);
      pen(ctx, tone(a, '#ffffff', 0.8), 0.32);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- Its belly, ruff and tail ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// Over the body: the soft cream belly, lit from above.
function belly(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const J = D.J;
  const w = J.waist;
  const h = J.hip;
  const st = J.stern;
  const W = (p) => ptOf(a, D, 'waistB', p);
  const C = (p) => ptOf(a, D, 'chest', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  const c0 = C([st[0] + 2, st[1] + 4]);
  glow(ctx, c0[0], c0[1], 7, FUR[0], 0.7);
  const b0 = W([w[0] + 7, w[1] + 3]);
  smooth(ctx, [W([w[0] + 1, w[1] - 7]), W([w[0] + 9, w[1] - 8]), W([w[0] + 15, w[1] - 1]), W([h[0] + 14, h[1] + 3]), W([h[0] + 6, h[1] + 5]), W([w[0] - 1, w[1] + 4])]);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  glow(ctx, b0[0], b0[1] - 2, 6, CREAM[0], 0.9);
  const b1 = W([h[0] + 6, h[1] + 3]);
  glow(ctx, b1[0], b1[1], 5, CREAM[2], 0.5);
  ctx.restore();
}
// The cloud ruff: ONE soft closed cloud round its neck, fuller under its chin, a few broad lobes on its
// lower edge (never a row of beads), lilac in its shade, white on top. `puff` fluffs the lobes out (their
// own shape grows, nothing is scaled); `flat` presses it down.
// (2026-11-27, the player: the cloud mane barely showed, a plain beige blob. Now the star of the
// design: a big soft cumulus ruff round its shoulders and chest, broad lobes of different sizes down
// its lower edge and out to each side, puffed out over its shoulders.)
const RUFF = [[-23, -4], [-21.4, -12.4], [-14, -17.4], [-4, -19], [7, -18.4], [16, -15.6], [23, -10.6], [27.6, -4], [30, 2.6], [27, 7.4], [28, 12.6], [22.6, 17.8], [16.4, 16.6], [10, 21], [3, 18.4], [-4, 20.8], [-10.4, 17], [-16.6, 18.4], [-21.4, 13], [-26.6, 8.2], [-27, 1.6]];
const LOBES = new Set([8, 10, 11, 13, 15, 17, 19]);
function ruff(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const pf = clamp(q.ruffPuff ?? 0, -0.6, 1.2);
  const lift = q.ruffLift ?? 0;
  const pts = RUFF.map(([x, y], i) => {
    const k = LOBES.has(i) ? 1 : 0.45;
    const cx = 1;
    const cy = 0;
    return C([st[0] + x + (x - cx) * 0.1 * pf * k, st[1] + y + (y - cy) * 0.14 * pf * k - lift]);
  });
  smooth(ctx, pts);
  paint(ctx, a, mode, CLOUD[1]);
  if (mode !== 'fill') return;
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  const lo = C([st[0] + 3, st[1] + 18]);
  glow(ctx, lo[0], lo[1], 16, CLOUD[3], 0.6);
  const sideB = C([st[0] - 21, st[1] + 9]);
  glow(ctx, sideB[0], sideB[1], 10, CLOUD[2], 0.65);
  const hi = C([st[0] + 7, st[1] - 7]);
  glow(ctx, hi[0], hi[1], 14, CLOUD[0], 0.95);
  const hi2 = C([st[0] + 21, st[1] + 4]);
  glow(ctx, hi2[0], hi2[1], 7, CLOUD[0], 0.8);
  // three soft inner curls where the cloud folds (thin, fading, fewer than the lobes)
  for (const [p0, p1, p2] of [[[9, 10], [12.6, 6.6], [17.6, 8.2]], [[-11.6, 8], [-8.2, 5.4], [-3.4, 6.8]], [[-1.6, 14.4], [2, 12], [6.2, 13.6]]]) {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] + p0[0], st[1] + p0[1] - lift]));
    ctx.quadraticCurveTo(...C([st[0] + p1[0], st[1] + p1[1] - lift]), ...C([st[0] + p2[0], st[1] + p2[1] - lift]));
    pen(ctx, tone(a, CLOUD[2], 0.8), 0.55);
    ctx.stroke();
  }
  ctx.restore();
}
// A little cloud cuff round a wrist (its winter coat coming in as cloud there too): one soft puff of
// three broad lobes, matching the ruff and the tail.
const CUFF = [[-4.6, -1.6], [-2.4, -4.4], [1.4, -4.6], [4.4, -2.2], [5, 1.4], [2.4, 3.8], [-1, 3], [-3.8, 3.6], [-5.4, 1.2]];
function cuff(ctx, a, mode, D, k) {
  const w = D.J[`wr${k}`];
  if (!w) return;
  const pts = CUFF.map(([x, y]) => ptOf(a, D, `hand${k}`, [w[0] + x, w[1] + y - 1.4]));
  smooth(ctx, pts);
  paint(ctx, a, mode, CLOUD[1]);
  if (mode !== 'fill') return;
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  const lo = ptOf(a, D, `hand${k}`, [w[0], w[1] + 3]);
  glow(ctx, lo[0], lo[1], 2.6, k === 'F' ? CLOUD[3] : CLOUD[2], 0.6);
  const hi = ptOf(a, D, `hand${k}`, [w[0] + 1, w[1] - 4]);
  glow(ctx, hi[0], hi[1], 2.4, CLOUD[0], 0.95);
  ctx.restore();
}
// The cloud tail: one soft plume, its root inside the rump, three broad lobes, a curled tip.
const TAILPTS_A = [[80, 118], [82, 126], [74, 130.4], [65, 127.6], [57.6, 122.4]];
const TAILPTS_B = [[51, 115.6], [48.4, 106], [52, 97.4], [59.6, 95], [66.2, 99.6], [67.4, 106.6], [71.6, 112]];
function tailPts(a, D) {
  return [...TAILPTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAILPTS_B.map((p) => ptOf(a, D, 'tailB', p))];
}
function tail(ctx, a, mode, D) {
  const pts = tailPts(a, D);
  smooth(ctx, pts);
  paint(ctx, a, mode, CLOUD[1]);
  if (mode !== 'fill') return;
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  const root = ptOf(a, D, 'tailA', [72, 126]);
  glow(ctx, root[0], root[1], 8, CLOUD[3], 0.6);
  const mid = ptOf(a, D, 'tailB', [55, 112]);
  glow(ctx, mid[0], mid[1], 7, CLOUD[2], 0.55);
  const top = ptOf(a, D, 'tailB', [59, 100]);
  glow(ctx, top[0], top[1], 8, CLOUD[0], 0.95);
  // a soft curl at the tip and one fold between the lobes
  const c0 = ptOf(a, D, 'tailB', [56, 104]);
  const c1 = ptOf(a, D, 'tailB', [59.6, 101]);
  const c2 = ptOf(a, D, 'tailB', [63, 104.4]);
  ctx.beginPath();
  ctx.moveTo(...c0);
  ctx.quadraticCurveTo(...c1, ...c2);
  pen(ctx, tone(a, CLOUD[2], 0.85), 0.6);
  ctx.stroke();
  const f0 = ptOf(a, D, 'tailA', [62, 125]);
  const f1 = ptOf(a, D, 'tailA', [64, 121.4]);
  const f2 = ptOf(a, D, 'tailA', [68.6, 121.6]);
  ctx.beginPath();
  ctx.moveTo(...f0);
  ctx.quadraticCurveTo(...f1, ...f2);
  pen(ctx, tone(a, CLOUD[2], 0.7), 0.55);
  ctx.stroke();
  ctx.restore();
}
// A dandelion clock: a stem, a round downy head of seeds (fewer as they're blown), or a bare stem.
function dandelion(ctx, x, y, s, ang, left) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 2.6 * s);
  ctx.quadraticCurveTo(0.6 * s, -2 * s, 0.2 * s, -6.4 * s);
  pen(ctx, '#86c070', 0.55 * s);
  ctx.stroke();
  if (left > 0.02) {
    ctx.globalAlpha *= clamp(left * 1.4, 0, 1);
    glow(ctx, 0.2 * s, -8 * s, 3.4 * s, '#ffffff', 0.9);
    const n = Math.round(4 + left * 8);
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU;
      ctx.beginPath();
      ctx.moveTo(0.2 * s, -8 * s);
      ctx.lineTo(0.2 * s + Math.cos(an) * 2.4 * s, -8 * s + Math.sin(an) * 2.4 * s);
      pen(ctx, 'rgba(255,255,255,0.85)', 0.28 * s);
      ctx.stroke();
    }
    ell(ctx, 0.2 * s, -8 * s, 0.7 * s, 0.7 * s);
    ctx.fillStyle = '#e6dcc8';
    ctx.fill();
  }
  ctx.restore();
}
// One dandelion seed on the air: a downy little parasol on a short stalk.
function seed(ctx, x, y, s, ang, al) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 2.2 * s);
  pen(ctx, '#d8ccb8', 0.3 * s);
  ctx.stroke();
  ell(ctx, 0, 2.5 * s, 0.35 * s, 0.5 * s);
  ctx.fillStyle = '#c4a884';
  ctx.fill();
  glow(ctx, 0, -0.3 * s, 1.8 * s, '#ffffff', 0.8);
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(i * 0.7 * s, -1.2 * s + Math.abs(i) * 0.25 * s);
    pen(ctx, 'rgba(255,255,255,0.95)', 0.25 * s);
    ctx.stroke();
  }
  ctx.restore();
}
// A soft puff of cloud.
const puffCloud = (ctx, x, y, r, al) => dust(ctx, x, y, r, al, '#ffffff', '#dcd8f0');

// ---------- Its act and fight ----------
const PIECES = { lookout: 6.8, dandelion: 7.0, stretch: 6.4, groom: 6.6 };
const ORDER = ['lookout', 'dandelion', 'stretch', 'groom'];
const POOL = ['whistle', 'bump', 'box'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, tailRot: 0, tailCurl: 0, earBack: 0, earUp: 0, blush: 0, ruffPuff: 0, ruffLift: 0, flower: -1, blown: 0, seedT: -1, whistleS: -1, gust: 0, wisp: -1, bumpS: -1, boxS: -1, smugS: -1, sweat: -1, zz: 0, scrub: 0 };
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
  // Standing: both paws held loosely in front of its tummy, the near a little higher (never twins); its
  // tail up behind it, swaying slowly.
  go({ shN: -18 + br * 1.4, elN: -62, hwN: -10, shF: -26 + br, elF: -54, hwF: -6, head: -1, chest: -br * 0.6 }, 1);
  add({ tilt: 3, shN: Math.sin(U * TAU * 2) * 9, shF: -Math.sin(U * TAU * 2) * 7 }, walking);
  q.tailRot = Math.sin(t * 0.6) * 0.05 + 0.12 * walking;
  q.tailCurl = Math.sin(t * 0.55 + 0.8) * 0.06;
  q.earBack = 0.15 * walking;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);

  if (k > 0.001 && piece === 'lookout') {
    // up tall on its toes, paws together at its chest
    const up = win(pu, 0.2, 0.7, 5.8, 6.4);
    go({ lift: 0.03, toeN: 18, toeF: 16, tilt: -6, chest: -4, shN: -64, elN: -104, hwN: -24, shF: -58, elF: -108, hwF: -20 }, up * k);
    q.earUp += 0.6 * up * k;
    q.tailRot += -0.1 * up * k;
    // a slow scan one way, then the other
    const sa = win(pu, 0.7, 1.1, 1.9, 2.2);
    go({ head: -4, neckR: 4 }, sa * k);
    say('scan', sa * k);
    const sb = win(pu, 2.1, 2.5, 3.0, 3.2);
    go({ head: -2, neckR: -8, chest: -2 }, sb * k);
    say('scanB', sb * k);
    // it spots something!
    const sp = win(pu, 3.15, 3.25, 3.6, 3.7);
    go({ head: -8, neckR: 2, lift: 0.04 }, sp * k);
    say('spot', sp * k);
    q.ruffPuff += 0.5 * sp * k;
    // cheeks puffed... FWEET!
    const pf = win(pu, 3.6, 3.75, 3.95, 4.05);
    say('puff', pf * k);
    const wh = win(pu, 4.0, 4.05, 4.6, 4.8);
    go({ head: -6, chest: -6, tilt: -8 }, wh * k);
    q.ruffPuff += 0.8 * wh * k;
    q.tailRot += -0.25 * wh * k;
    say('whistle', wh * k);
    if (pu > 4.0 && pu < 5.0) q.whistleS = (pu - 4.0) * 0.8;
    // it was only a cloud: sheepish
    const sh = win(pu, 4.8, 5.1, 6.2, 6.7);
    go({ head: 6, shN: -40, elN: -120, hwN: -30 }, sh * k);
    say('sheepish', sh * k);
    q.blush = Math.max(q.blush, sh * k * 0.7);
  }
  if (k > 0.001 && piece === 'dandelion') {
    // it bends to pick a dandelion clock
    const bd = win(pu, 0.2, 0.7, 1.0, 1.4);
    go({ tilt: 16, chest: 8, head: 10, lift: -0.05, shN: 30, elN: -20, hwN: 10 }, bd * k);
    q.tailRot += 0.12 * bd * k;
    if (pu > 1.0 && pu < 6.8) q.flower = pu - 1.0;
    // held up, sniffed
    const hold = win(pu, 1.2, 1.6, 2.4, 2.6);
    go({ shN: -80, elN: -90, hwN: -20, head: -4 }, hold * k);
    say(pu < 1.9 ? 'find' : 'sniff', hold * k);
    // a breath, and it blows: the seeds float off
    const bl = win(pu, 2.5, 2.7, 3.3, 3.5);
    go({ shN: -82, elN: -96, hwN: -20, head: 2, chest: 3, tilt: 2 }, bl * k);
    say('blow', bl * k);
    q.blown = clamp((pu - 2.8) / 0.4, 0, 1);
    if (pu > 2.8 && pu < 7.0) q.seedT = pu - 2.8;
    // it watches them go, delighted, up on its toes
    const wt = win(pu, 3.4, 3.7, 5.0, 5.3);
    go({ shN: -70, elN: -80, hwN: -10, head: -14, chest: -4, toeN: 10, toeF: 8, lift: 0.02 }, wt * k);
    say('watch', wt * k);
    q.blush = Math.max(q.blush, wt * k * 0.5);
    q.tailRot += Math.sin(pu * 7) * 0.08 * wt * k;
    // the stem nibbled down
    const nb = win(pu, 5.2, 5.5, 6.4, 6.8);
    go({ shN: -66, elN: -122, hwN: -30, head: 6 + Math.sin(pu * 14) * 2 }, nb * k);
    say('munch', nb * k);
  }
  if (k > 0.001 && piece === 'stretch') {
    // paws up as high as they go, up on its toes
    const sr = win(pu, 0.2, 0.9, 2.6, 3.1);
    go({ shN: -150, elN: -24, hwN: -10, shF: -144, elF: -30, hwF: -10, toeN: 20, toeF: 18, lift: 0.04, chest: -8, tilt: -6, head: -10 }, sr * k);
    say(pu < 1.0 ? 'reach' : 'yawn', sr * k);
    q.earBack += 0.4 * sr * k;
    q.tailRot += -0.3 * sr * k;
    q.tailCurl += -0.2 * sr * k;
    // down again, a contented wiggle of its hips
    const wg = win(pu, 3.0, 3.4, 5.4, 6.0);
    const wig = Math.sin((pu - 3.0) * 8.5);
    go({ tilt: wig * 3, pelvis: wig * 4, head: 2 - wig * 2, shN: -30, elN: -80, shF: -20, elF: -70 }, wg * k);
    q.tailRot += wig * 0.18 * wg * k;
    say('content', wg * k);
    q.blush = Math.max(q.blush, wg * k * 0.4);
  }
  if (k > 0.001 && piece === 'groom') {
    // both paws licked...
    const lk = win(pu, 0.2, 0.5, 1.0, 1.2);
    go({ shN: -62, elN: -128, hwN: -30, shF: -58, elF: -130, hwF: -30, head: 6 }, lk * k);
    say('groom', lk * k);
    // ...and scrubbed over its cheeks in quick little circles
    const sc = win(pu, 1.1, 1.3, 3.4, 3.7);
    const cyc = (pu - 1.1) * TAU * 1.9;
    go({ shN: -86 + Math.sin(cyc) * 12, elN: -126 + Math.cos(cyc) * 10, hwN: -30, shF: -80 - Math.sin(cyc) * 12, elF: -124 - Math.cos(cyc) * 10, hwF: -30, head: 4 + Math.sin(cyc) * 3, neckR: Math.cos(cyc) * 2 }, sc * k);
    say('scrub', sc * k);
    q.scrub = sc * k;
    q.earBack += 0.5 * sc * k;
    // its ruff patted back into shape (it puffs up between pats), a wisp of cloud puffing off
    const pt = win(pu, 3.6, 3.9, 5.6, 6.0);
    const pat = Math.max(0, Math.sin((pu - 3.6) * 9));
    go({ shN: -40, elN: -110 + pat * 14, hwN: -40, shF: -30, elF: -100, head: 10, chest: 2 }, pt * k);
    q.ruffPuff += (0.4 - pat * 0.5) * pt * k;
    say('proud', pt * k);
    if (pu > 4.2 && pu < 5.6) q.wisp = (pu - 4.2) / 1.4;
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: crouched forward, ruff fluffed up, paws up (eased in and out, never a snap) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ lift: -0.03, tilt: 9, head: 2, shN: -56, elN: -96, hwN: -20, shF: -50, elF: -100, hwF: -20 }, hw);
    q.ruffPuff += 0.7 * hw;
    q.earBack += 0.3 * hw;
    q.tailRot += -0.2 * hw;
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.tailRot += 0.4;
    q.tailCurl += 0.2;
    q.ruffPuff -= 0.3;
    q.earBack += 0.5;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.55) / 0.4)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'whistle') {
      // up tall, a deep breath, cheeks puffed
      go({ lift: 0.03, toeN: 18, toeF: 16, tilt: -10, chest: -7, head: -8, shN: -64, elN: -106, hwN: -24, shF: -58, elF: -110, hwF: -20 }, wu);
      q.ruffPuff += 0.6 * wu;
      q.earUp += 0.5 * wu;
      q.tailRot += -0.2 * wu;
      say(W < 0.4 ? 'focus' : 'puff', W);
      // then a piercing FWEET! at you
      if (s >= 0) {
        go({ tilt: 6, chest: 4, head: 4, lift: 0.01, toeN: 8, toeF: 8, shN: -40, elN: -70, shF: -36, elF: -80, x: 0.03 }, sw);
        q.ruffPuff += 1.0 * sw;
        q.earBack += 0.6 * sw;
        q.tailRot += -0.35 * sw;
        q.whistleS = s;
        q.gust = Math.max(q.gust, sw);
        say('whistle', win(s, 0, 0.03, 0.5, 0.6));
      }
    } else if (mvName === 'bump') {
      // it rocks back on its heels
      go({ tilt: -16, chest: -6, head: -4, x: -0.05, toeN: -14, toeF: -10, shN: 10, elN: -40, shF: 14, elF: -40 }, wu);
      q.tailRot += 0.25 * wu;
      q.earBack += 0.3 * wu;
      say('focus', W);
      // then the whole chubby belly bumped into you
      if (s >= 0) {
        const out1 = sstep(s / 0.18);
        const back = sstep((s - 0.42) / 0.45);
        const xx = 0.36 * out1 * (1 - back);
        go({ x: xx, tilt: -10 * (1 - back), chest: -8, pelvis: -6, head: 6, shN: 30, elN: -20, shF: 36, elF: -24, toeN: 10, toeF: 8 }, sw);
        add({ hop: Math.sin(Math.PI * clamp(s / 0.36, 0, 1)) * 0.04 }, sw);
        q.tailRot += -0.3 * sw;
        q.ruffPuff += 0.5 * sw;
        q.bumpS = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    } else {
      // up on its toes, paws up like a boxer
      go({ lift: 0.03, toeN: 16, toeF: 14, tilt: -4, chest: -4, head: 2, shN: -40, elN: -128, hwN: -20, shF: -60, elF: -118, hwF: -20, x: -0.02 }, wu);
      q.earBack += 0.3 * wu;
      q.ruffPuff += 0.3 * wu;
      say('focus', W);
      // a quick one-two of paw jabs
      if (s >= 0) {
        const j1 = win(s, 0, 0.05, 0.14, 0.24);
        const j2 = win(s, 0.2, 0.26, 0.36, 0.5);
        go({ lift: 0.03, toeN: 16, toeF: 14, tilt: 8, head: 2, shN: -40, elN: -128, shF: -60, elF: -118, x: 0.06 }, sw);
        go({ shN: -82, elN: -10, hwN: 0, chest: 4, x: 0.1 }, j1);
        go({ shF: -86, elF: -14, hwF: 0, chest: -2, x: 0.12, shN: -30, elN: -130 }, j2);
        q.boxS = s;
        say('shout', win(s, 0, 0.03, 0.42, 0.52));
      }
    }
  }
  // ----- Hurt: a squeak, ears back, ruff flattened -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shN: -60, elN: -120, shF: -50, elF: -120, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earBack += 1.1 * kh;
    q.ruffPuff -= 0.5 * kh;
    q.tailRot += 0.2 * kh;
  }
  // ----- After landing a hit: a smug little whistle, a paw dusted on its ruff -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.4 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 1.0, 1.4) * (1 - F.moveW);
    const dust1 = Math.max(0, Math.sin(gl * 12));
    go({ shN: -46, elN: -118 + dust1 * 10, hwN: -30, shF: -20, elF: -60, head: -6, chest: -4, tilt: -3 }, kg);
    say('smug', kg);
    if (gl > 0.2 && gl < 1.2) q.smugS = gl - 0.2;
    q.tailRot += Math.sin(gl * 10) * 0.12 * kg;
  }
  // ----- A nap (its habitat): sat down, chin on its ruff, its tail curled round -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    go({ lift: -0.2 + Math.sin(now * 1.3) * 0.004, tilt: 10, head: 18 + Math.sin(now * 1.3) * 2, chest: 4, shN: -30, elN: -100, shF: -26, elF: -100, fxN: 0.32, fxF: 0.22, fyN: 0.02, fyF: 0.02 }, nw);
    q.earBack += 0.5 * nw;
    q.tailRot += 0.5 * nw;
    q.tailCurl += 0.35 * nw;
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
    q.tailRot += 0.4;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.9);
  easeKeys(st, q, ['tailRot', 'tailCurl', 'earBack', 'earUp', 'blush', 'ruffPuff', 'ruffLift', 'gust', 'scrub'], dt, (key) => (key.startsWith('ear') ? 10 : key.startsWith('tail') ? 7 : 8));
  q.calm = k;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little cloud with the mark on it.
const BUBBLE = [[-6.4, 1.6], [-6.8, -2.2], [-3.6, -5.6], [0.4, -6.6], [4.2, -5.2], [6.6, -1.8], [6, 2], [2.6, 4.4], [-2.4, 4.4]];
const BCOL = [INK, '#fffdf8', CAP[2], '#7a6a8a'];
// Soft sound rings out from its mouth.
function rings(ctx, x, y, e, d, n = 3, col = '#f2e4c8') {
  for (let i = 0; i < n; i++) {
    const u = clamp(e * 1.4 - i * 0.18, 0, 1);
    if (u <= 0) continue;
    ctx.save();
    ctx.globalAlpha *= (1 - u) * 0.9;
    ctx.beginPath();
    ctx.arc(x + d * 1, y, 3 + u * 12, d > 0 ? -0.8 : Math.PI - 0.8, d > 0 ? 0.8 : Math.PI + 0.8);
    pen(ctx, RING[0], 1.3);
    ctx.stroke();
    pen(ctx, col, 0.6);
    ctx.stroke();
    ctx.restore();
  }
}

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -28]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  // the dandelion in its paw, and its seeds on the air
  if ((q.flower ?? -1) >= 0) {
    const [px, py] = ptOf(a, D, 'handN', D.J.handN);
    dandelion(ctx, px + 0.4, py - 0.6, 0.8, -0.25, 1 - (q.blown ?? 0));
    if (q.flower < 0.5) sparkle(ctx, px + 2, py - 8, 1.2 * Math.sin(Math.PI * q.flower / 0.5), 1, '#fff6e0');
  }
  if ((q.seedT ?? -1) >= 0) {
    const [px, py] = ptOf(a, D, 'handN', D.J.handN);
    for (let i = 0; i < 6; i++) {
      const u = clamp((q.seedT - i * 0.08) / 3.2, 0, 1);
      if (u <= 0) continue;
      const sx = px + 2 + u * (9 + i * 2) + Math.sin(u * 6 + i) * 1.6;
      const sy = py - 5 - u * (11 + (i % 3) * 3);
      seed(ctx, sx, sy, 0.7, Math.sin(u * 5 + i) * 0.4, Math.sin(Math.PI * u));
    }
  }
  // the whistle: soft rings out from its mouth, and the word
  if ((q.whistleS ?? -1) >= 0 && q.whistleS < 0.8) {
    const e = q.whistleS / 0.8;
    const [mx, my] = headAt(a, D, [22, 5]);
    rings(ctx, mx, my, e, 1);
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.7) / 0.3));
    cue(ctx, 'fweet!', mx + 8 + e * 4, my - 8 - e * 3, 3.4, a.flip ? -1 : 1, -0.12, CAP[2], '#fffdf6');
    ctx.restore();
    if (q.gust > 0.05) {
      for (let i = 0; i < 3; i++) puffCloud(ctx, mx + 10 + e * 16 + i * 4, my + 2 + i * 3, 1.4 + e * 2.4, (1 - e) * 0.5 * q.gust);
    }
  }
  // a wisp of cloud puffing off its ruff
  if ((q.wisp ?? -1) >= 0 && q.wisp < 1) {
    const [cx, cy] = ptOf(a, D, 'chest', [D.J.stern[0] + 10, D.J.stern[1] - 2]);
    puffCloud(ctx, cx + q.wisp * 6, cy - q.wisp * 10, 1.4 + q.wisp * 1.6, Math.sin(Math.PI * q.wisp) * 0.75);
    sparkle(ctx, cx + 2 + q.wisp * 8, cy - 4 - q.wisp * 12, 1 * Math.sin(Math.PI * q.wisp), 1, '#ffffff');
  }
  // ----- Belly Bump: a puff of cloud where its belly lands -----
  if ((q.bumpS ?? -1) >= 0 && q.bumpS < 0.7) {
    const u = clamp((q.bumpS - 0.1) / 0.55, 0, 1);
    if (u > 0) {
      const [px, py] = ptOf(a, D, 'waistB', [D.J.waist[0] + 20, D.J.waist[1]]);
      puffCloud(ctx, px + 3 + u * 4, py, 2 + u * 5, (1 - u) * 0.85);
      for (let i = 0; i < 3; i++) sparkle(ctx, px + 4 + Math.cos(i * 2.1) * (3 + u * 8), py + Math.sin(i * 2.1) * (3 + u * 6), 1.4 * (1 - u), 1, '#ffffff');
    }
  }
  // ----- Marmot Boxing: a soft pow at each jab -----
  if ((q.boxS ?? -1) >= 0 && q.boxS < 0.75) {
    for (const [t0, hand] of [[0.08, 'N'], [0.28, 'F']]) {
      const u = (q.boxS - t0) / 0.3;
      if (u <= 0 || u >= 1) continue;
      const [px, py] = ptOf(a, D, `hand${hand}`, D.J[`hand${hand}`]);
      ctx.save();
      ctx.globalAlpha *= 1 - sstep((u - 0.4) / 0.6);
      for (let i = 0; i < 5; i++) {
        const an = -0.9 + i * 0.45;
        const r0 = 2 + u * 2;
        const r1 = 4 + u * 5;
        ctx.beginPath();
        ctx.moveTo(px + 2 + Math.cos(an) * r0, py + Math.sin(an) * r0);
        ctx.lineTo(px + 2 + Math.cos(an) * r1, py + Math.sin(an) * r1);
        pen(ctx, '#ffffff', 1.1);
        ctx.stroke();
        pen(ctx, '#f6dcb4', 0.5);
        ctx.stroke();
      }
      ctx.restore();
      sparkle(ctx, px + 3, py - 1, 2 * (1 - u), 1, '#fff2d0');
    }
  }
  // ----- A smug little whistle after landing a hit: one note -----
  if ((q.smugS ?? -1) >= 0 && q.smugS < 1) {
    const [mx, my] = headAt(a, D, [22, 0]);
    note(ctx, mx + 2 + q.smugS * 4, my - 4 - q.smugS * 8, 0.9, -0.2, Math.sin(Math.PI * q.smugS), '#e8b870');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -22]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#a08a98', '#fffaf2');
    }
  }
  const [bx, by] = headAt(a, D, [4, -32]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  // (the skin is its own honey fur; cocoa paws and feet)
  skin: {
    lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: LW,
    parts: {
      hand: { lt: PAW[0], base: PAW[1], sh: PAW[2], deep: PAW[3] },
      foot: { lt: PAW[0], base: PAW[1], sh: PAW[2], deep: PAW[3] },
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
    torsoSkin: (ctx, a, mode, S, D) => belly(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => ruff(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    handNskin: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('marmot', DRESS);
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
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over its head its own)
export const WHISTLE_MARMOT_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const WHISTLE_MARMOT_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
