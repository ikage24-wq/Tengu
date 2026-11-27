// The Travel-Pillow Sloth (2026-11-27, the Dream Theatre's Sleepy Commuter Sheep remade from scratch as a new
// creature; the id stays `sleepysheep`). A commuter from Act I, the Queen's dream of her old morning
// train: a fluffy sloth in a big knitted cardigan and a travel pillow, who has been on this train since
// the first stop and will sleep through its own, every single day. It moves only as fast as it has to,
// which is never very. On its own copy of the creature base (rig.js; body.js `sloth`: a soft round body,
// short bowed legs, long dangling arms), dressed here; its head, cardigan, pillow and flask drawn here from
// scratch over the mannequin (never the shared face, never the hero).
//   look    shaggy oat-beige fur, a pale cream face with soft cocoa eye stripes sweeping back toward its
//           ears (a band, never spots), a little rounded nose, its gentle sloth smile; its clothes worn:
//           a chunky lilac knit cardigan (the body's own skin and its sleeves, so it folds with every
//           pose) with soft ribbing, a buttoned front and a cream tee peeking out; a plush buttercup travel
//           pillow round its neck (stars on it); its legs and long paws its own fur, three soft round
//           claws each; a little mint flask of tea in its near paw. Its own soft mauve outline, outer edge
//           only, face bare.
//   eyes    its own "pebble eyes": small and round, set in the cocoa stripes, a soft hazel iris and a
//           big ring of light round its pupil like a little donut (its glint), a short soft lash line;
//           pale tufty brows that do its acting. Its permanent gentle smile.
//   walk    the base's walk at a sloth's pace (20), slow and swaying, the long arms dangling.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - doze (8.0 s): its head sinks slowly onto its pillow, z's; a lurch (the train!) and it
//             jolts awake, blinking; a slow look round; it settles back;
//           - stretch (7.0 s): a slow-motion stretch, its long arms out wide, a long yawn; then it hugs
//             itself, cosy;
//           - tea (7.0 s): the flask raised (slowly), its spout flipped open, a sip, a warm sigh, a curl of steam
//             behind it;
//           - pillow (6.2 s): its pillow plumped with a pat or two, then its cheek snuggled into it.
//   moves   Slow Slap (a long, slow, sleepy wind-up, its long arm raised; then a surprisingly quick swipe
//           of its soft claws, three soft arcs); Nod Off (it nods off on its feet, swaying forward; then
//           its head drops into you, BONK); Big Yawn (a huge breath in; then a yawn so big a soft drowsy
//           wave of curls rolls out at you).
//   else    hurt: a slow wince, its eyes squeezing; after landing a hit: a contented little smile, a
//           pat of its pillow; hunting you: as alert as it gets, eyes a touch wider, arms half up; low on
//           health: worried, a bead of sweat; a nap (habitat): asleep standing, head on its pillow,
//           z's; beaten: dizzy. Its marks over its head (!, ?, z's, sweat) are its own: little soft
//           cloud-pillows (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: drowsy curls as soft lilac swirls, steam soft
// white rounds behind its face, claw swipes as soft arcs, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat } from './fx.js';

const BIG = 1.14;
const LW = 1.6 / BIG;
const INK = '#7e6478';
const FUR = ['#efe4d2', '#d2bea2', '#ae9878', '#8a745a'];
const FACE = ['#fffbf2', '#f6ecda', '#e2d2b8'];
const STRIPE = ['#a88468', '#8a6a52'];
const KNIT = ['#eadcf8', '#cbb6ea', '#a892cc', '#8a74ae'];
const TEE = ['#fffdf4', '#f2ead8'];
const PILLOW = ['#fff6c8', '#ffe48a', '#f0c45a', '#c89a3a'];
const FLASK = ['#d8f8ea', '#a0e2c8', '#6cbfa0', '#4c9a80'];
const LASH = '#4e3a40';
const IRIS = ['#3e2a20', '#6e4c34', '#a07a50', '#d8b884'];
const DROWSY = ['#f6f0ff', '#b8a2ea', '#9078cc'];

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
const HO = [1, -15.4];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const pivOf = (D, bone) => D.J[D.PIV[bone]];
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
  calm: { e: 'open', g: [0.5, 0.4], b: [0, 0], m: 'smile' },
  focus: { e: 'open', g: [1, 1.2], b: [-0.2, 0.4], m: 'set' },
  drowsy: { e: 'open', g: [0.3, 1.2], b: [0.6, -0.6], m: 'smile' },
  dozing: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  jolt: { e: 'wide', g: [0.4, -0.4], b: [-1.8, -2], m: 'o' },
  blink: { e: 'open', g: [-1.2, 0.4], b: [-0.8, -1], m: 'o' },
  lookB: { e: 'open', g: [1.4, 0.2], b: [-0.6, -0.6], m: 'smile' },
  yawn: { e: 'squeeze', b: [0.6, -1.2], m: 'yawn' },
  cosy: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  sip: { e: 'shut', b: [-0.4, -0.6], m: 'sip' },
  sigh: { e: 'happy', b: [-0.8, -1.2], m: 'o' },
  pat: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  snug: { e: 'shut', b: [-0.6, -0.9], m: 'smile' },
  alert: { e: 'wide', g: [1.4, 0.4], b: [-0.4, 0.8], m: 'set' },
  sleepy: { e: 'open', g: [1.2, 0.8], b: [-0.2, 0.6], m: 'set' },
  shout: { e: 'squeeze', b: [-0.6, 1.6], m: 'shout' },
  happy: { e: 'happy', b: [-0.9, -1], m: 'open' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  worried: { e: 'open', g: [0.3, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'smile' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['dozing', 'yawn', 'cosy', 'sip', 'sigh', 'pat', 'snug', 'shout', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
function eye(ctx, a, x, y, o, f) {
  const r = 3.1;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - r, y + 1], [x, y - r * 0.9], [x + r, y + 1], 1.4, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - r * 0.9 * o, y - 1.8], [x + r * 0.3 * o, y - 0.2], [x + r * 0.9 * o, y + 0.2], 1.3, LASH);
    stroke3(ctx, a, [x - r * 0.9 * o, y + 2], [x + r * 0.2 * o, y + 1], [x + r * 0.9 * o, y + 0.4], 1.15, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - r, y + 0.2], [x, y + (kind === 'sleep' ? 2.6 : 2.1)], [x + r, y + 0.2], 1.35, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
  ell(ctx, x, y, r * big, r * big * 1.04);
  ctx.fillStyle = tone(a, '#fffdf6');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * r * 0.7;
      const py = y + Math.sin(an) * u * r * 0.7;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.5, 0.4];
    ctx.save();
    ell(ctx, x, y, r * big, r * big * 1.04);
    ctx.clip();
    const ir = (kind === 'wide' ? 0.7 : 0.82) * r;
    const ix = x + gx * 0.45;
    const iy = y + gy * 0.45 + 0.2;
    ell(ctx, ix, iy, ir, ir);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix, iy + ir * 0.14, ir * 0.88, ir * 0.84);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ir * 0.48, ir * 0.66, ir * 0.38);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy, ir * 0.42, ir * 0.42);
    ctx.fillStyle = tone(a, '#24160e');
    ctx.fill();
    // its glint: a soft ring of light round the pupil (a little donut), a dot below
    ell(ctx, ix - ir * 0.2, iy - ir * 0.25, ir * 0.42, ir * 0.42);
    pen(ctx, 'rgba(255,255,255,0.95)', 0.55);
    ctx.stroke();
    ell(ctx, ix + ir * 0.42, iy + ir * 0.45, 0.42, 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // a short soft lash line along the top
  stroke3(ctx, a, [x - r * 0.95, y - r * 0.35], [x, y - r * 1.38 * big], [x + r * 0.95, y - r * 0.35], 1.15, LASH);
}
// Pale tufty brows: two soft rounded dabs each.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  for (const [dx, k] of [[-1, bi], [1, bo]]) {
    ell(ctx, x + dx * o * 1.2, y + k * 0.6, 1.4, 0.9);
    ctx.fillStyle = tone(a, FACE[0]);
    ctx.fill();
  }
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#7a4652';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7e3448');
    ctx.fill();
    ell(ctx, x, y + h * 0.82, w * 0.55, h * 0.3);
    ctx.fillStyle = tone(a, '#ffa0b4');
    ctx.fill();
  };
  const line = (pts, w = 0.75) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'open':
      open(2, 2);
      break;
    case 'shout':
      open(2.4, 2.8);
      break;
    case 'yawn':
      open(2.2, 4);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1, 1.2);
      ctx.fillStyle = tone(a, '#7e3448');
      ctx.fill();
      break;
    case 'sip':
      ell(ctx, x + 0.5, y + 0.6, 0.8, 0.7);
      ctx.fillStyle = tone(a, '#7e3448');
      ctx.fill();
      break;
    case 'set':
      line([[x - 1.8, y + 0.4], [x, y + 0.7], [x + 1.8, y + 0.4]], 0.8);
      break;
    case 'wobble':
      line([[x - 2, y + 0.4], [x - 1, y - 0.3], [x, y + 0.3], [x + 1, y - 0.3], [x + 2, y + 0.4]], 0.68);
      break;
    case 'frown':
      line([[x - 1.8, y + 0.9], [x, y - 0.2], [x + 1.8, y + 0.9]]);
      break;
    case 'sleep':
      line([[x - 1.6, y], [x, y + 0.9], [x + 1.6, y]], 0.7);
      break;
    case 'talkA':
      open(1.6, 1.9);
      break;
    case 'talkE':
      open(2, 1.1);
      break;
    default:
      // the sloth's gentle smile: one soft curve, its corners tucked up
      line([[x - 2.6, y - 0.4], [x, y + 1.3], [x + 2.6, y - 0.6]], 0.75);
  }
}
const SKULL = [[-17.6, 0], [-16.4, -10], [-10.4, -16.2], [-1, -18.4], [8.6, -17], [15.4, -12], [19.4, -5], [21, 2.4], [19.6, 9.6], [13.4, 14.6], [3, 16.6], [-7.6, 15], [-14.6, 9.6]];
// Its shaggy crown: three broad soft lobes of fur over the back and top of the head (part of the skull's
// outline), and a sloth's own shaggy bowl-cut fringe over its forehead (2026-11-27 finish: a row of six
// small round bumps read as a sheep's wool cap).
const SHAG = [[-15, -5.6, 4.4], [-11.2, -13.2, 4.8], [-3.2, -16.8, 4.6]];
const FRINGE = [[-7, -18.4], [5, -19.6], [15.4, -15], [19.6, -9.8], [16.8, -10], [14.2, -9.6], [11.8, -11.2], [8.8, -10.6], [5.6, -12], [2.6, -11.4], [-0.6, -12.6], [-3.6, -12.8], [-6.6, -14.6]];
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  // (the shaggy crown and the skull as one soft shape)
  ctx.beginPath();
  for (const [x, y, r] of SHAG) {
    ctx.moveTo(x + r, y);
    ctx.ellipse(x, y, r, r * 0.9, 0, 0, TAU);
  }
  paint(ctx, a, mode, FUR[1]);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.beginPath();
    for (const [x, y, r] of SHAG) {
      ctx.moveTo(x + r, y);
      ctx.ellipse(x, y, r, r * 0.9, 0, 0, TAU);
    }
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fill();
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -12, 15, FUR[0], 0.8);
    glow(ctx, -14, 10, 10, FUR[2], 0.55);
    // its pale face, a wide soft oval
    smooth(ctx, [[-6, -4], [-2, -11], [7, -12.4], [15, -9.6], [20, -2.6], [20.4, 5.4], [16.4, 12], [8, 15], [-1, 13], [-6.4, 5]]);
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    glow(ctx, 10, 2, 9, FACE[0], 0.9);
    // the soft cocoa stripes from each eye sweeping back toward its ears (bands, never spots)
    smooth(ctx, [[-14, -6.4], [-8.6, -6], [-3, -5.4], [-1, -2.6], [-3.6, 0.6], [-9, 0.6], [-14.6, -1.6]]);
    ctx.fillStyle = tone(a, STRIPE[0]);
    ctx.fill();
    smooth(ctx, [[4.8, -6], [9.4, -6.4], [13.4, -5.8], [14.6, -3], [12.6, 0.2], [8, 0.4], [4.4, -2]]);
    ctx.fillStyle = tone(a, STRIPE[0]);
    ctx.fill();
    // the shaggy fringe: its soft shadow on the forehead first, then the fur, lit from the one light above
    // with one soft shine across it and faint parting lines fading before the ends
    ctx.save();
    ctx.translate(0.3, 1.1);
    smooth(ctx, FRINGE);
    ctx.fillStyle = tone(a, FACE[2], 0.7);
    ctx.fill();
    ctx.restore();
    smooth(ctx, FRINGE);
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fill();
    ctx.save();
    smooth(ctx, FRINGE);
    ctx.clip();
    glow(ctx, 3, -17, 11, FUR[0], 0.85);
    glow(ctx, 6, -10.6, 9, FUR[2], 0.32);
    ctx.beginPath();
    ctx.ellipse(5, -15, 9.6, 1.5, 0.12, 0, TAU);
    ctx.fillStyle = tone(a, '#ffffff', 0.22);
    ctx.fill();
    for (const [x0, y0, x1, y1] of [[1.2, -16.6, 1, -12.6], [7.4, -16.8, 7.2, -12], [12.8, -14.6, 13, -11]]) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, tone(a, FUR[2], 0));
      g.addColorStop(1, tone(a, FUR[2], 0.55));
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 + 0.6, (y0 + y1) / 2, x1, y1);
      pen(ctx, g, 0.5);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
    for (const [cx, cy, k] of [[-5.6, 5, 0.6], [12, 5.6, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ffa4b4', 0.42 * k);
      ctx.fill();
    }
    eye(ctx, a, -4.2, -2.6, -1, f);
    eye(ctx, a, 9.6, -2.8, 1, f);
    brow(ctx, a, -4.6, -9.4, -1, f.b);
    brow(ctx, a, 9.8, -9.6, 1, f.b);
    // its little rounded nose
    smooth(ctx, [[15.4, 2.4], [19.4, 2], [20, 3.6], [17.8, 5.4], [15.6, 4]]);
    ctx.fillStyle = tone(a, '#6a4a48');
    ctx.fill();
    ell(ctx, 17.4, 2.8, 0.9, 0.45);
    ctx.fillStyle = 'rgba(255,240,236,0.7)';
    ctx.fill();
    mouth(ctx, a, 16.2, 8.4, f.m);
  }
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
// The cardigan over its body: the open front with the cream tee, the buttons, soft ribbing at the hem,
// its fur legs below the hem.
function cardigan(ctx, a, mode, D) {
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
  // its fur below the cardigan's hem
  poly(ctx, [T([h[0] - 40, h[1] + 2.4]), T([h[0] + 40, h[1] + 1.4]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  const lg = T([h[0] + 4, h[1] + 5]);
  glow(ctx, lg[0], lg[1], 5, FUR[0], 0.6);
  // the ribbed hem
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(...T([h[0] - 40, h[1] + 0.8 - i * 1.4]));
    ctx.lineTo(...T([h[0] + 40, h[1] - 0.2 - i * 1.4]));
    pen(ctx, tone(a, i ? KNIT[2] : KNIT[3]), 1.2);
    ctx.stroke();
  }
  // the knit: soft vertical ribs following the body
  ctx.globalAlpha *= 0.35;
  pen(ctx, KNIT[2], 0.4);
  for (let k = -3; k <= 4; k++) {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] + k * 4, st[1] - 2]));
    ctx.quadraticCurveTo(...W([w[0] + k * 4.4, w[1]]), ...T([h[0] + k * 4, h[1] - 1]));
    ctx.stroke();
  }
  ctx.globalAlpha /= 0.35;
  // the open front: the cream tee in a soft V
  poly(ctx, [C([st[0] + 2, st[1] - 1]), C([st[0] + 12, st[1] - 1]), W([w[0] + 10.6, w[1] + 2]), T([h[0] + 9.6, h[1] - 1]), T([h[0] + 6.6, h[1] - 1]), W([w[0] + 5.6, w[1] + 2])]);
  ctx.fillStyle = tone(a, TEE[0]);
  ctx.fill();
  // the cardigan's front band down the near side of the opening, its buttons
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 2.6, st[1]]));
  ctx.quadraticCurveTo(...W([w[0] + 5, w[1]]), ...T([h[0] + 6, h[1] - 1]));
  pen(ctx, tone(a, KNIT[0]), 1.6);
  ctx.stroke();
  for (const p of [C([st[0] + 3.6, st[1] + 6]), W([w[0] + 5.2, w[1] - 2]), W([w[0] + 5.8, w[1] + 4])]) {
    ell(ctx, p[0], p[1], 0.85, 0.85);
    ctx.fillStyle = tone(a, '#fff0c0');
    ctx.fill();
  }
  const c0 = C([st[0] - 6, st[1] + 8]);
  glow(ctx, c0[0], c0[1], 7, KNIT[3], 0.35);
  ctx.restore();
}
// The ribbed knit cuff at each sleeve's end, its long paw peeking out.
function cuff(ctx, a, mode, D, k) {
  const W = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(W[1] - E[1], W[0] - E[0]);
  ctx.save();
  ctx.translate(...W);
  ctx.rotate(ang);
  smooth(ctx, [[-3, -3.4], [0.2, -3.6], [0.7, 0], [0.2, 3.6], [-3, 3.4], [-3.5, 0]]);
  if (mode === 'line') paint(ctx, a, 'line', null);
  else {
    ctx.fillStyle = tone(a, k === 'F' ? KNIT[2] : KNIT[1]);
    ctx.fill();
    pen(ctx, tone(a, KNIT[3], 0.5), 0.4);
    for (const yy of [-1.8, 0, 1.8]) {
      ctx.beginPath();
      ctx.moveTo(-2.6, yy);
      ctx.lineTo(0, yy);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Three soft round claws on each long paw.
function claws(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  const H = ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  const Wr = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const ang = Math.atan2(H[1] - Wr[1], H[0] - Wr[0]);
  ctx.save();
  ctx.translate(...H);
  ctx.rotate(ang);
  for (const dy of [-1.3, 0, 1.3]) {
    smooth(ctx, [[1.2, dy - 0.45], [2.6, dy - 0.2], [2.9, dy + 0.3], [1.4, dy + 0.5]]);
    ctx.fillStyle = tone(a, k === 'F' ? '#e2d4c0' : '#fff6e6');
    ctx.fill();
  }
  ctx.restore();
}
// The plush travel pillow round its neck: a fat soft U with stars, its open ends under its chin.
function pillow(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const plump = a.gl?.plump ?? 0;
  const pts = [[-13.4, 0], [-12.4, -5.6], [-6, -8.4], [3, -8.6], [11.6, -6.4], [15.6, -1.6], [13.4, 2.6], [9, 0.4], [3, -1.6], [-3, -1.4], [-8.6, 1.4], [-11.4, 3.4]].map(([x, y]) => C([st[0] + x * (1 + plump * 0.05), st[1] + y * (1 + plump * 0.05)]));
  smooth(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, PILLOW[1]);
  ctx.fill();
  // (a soft edge of its own colour where it lies over the face)
  pen(ctx, tone(a, PILLOW[2]), 0.5);
  ctx.stroke();
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  const l = C([st[0] + 0, st[1] - 7]);
  glow(ctx, l[0], l[1], 6, PILLOW[0], 0.9);
  const d = C([st[0] - 9, st[1] + 0]);
  glow(ctx, d[0], d[1], 5, PILLOW[2], 0.6);
  ctx.restore();
  for (const [x, y, r] of [[-8.4, -3.4, 1.1], [2, -5.6, 1.2], [10.6, -3.2, 1]]) {
    const p = C([st[0] + x, st[1] + y]);
    star(ctx, p[0], p[1], r, 0.2, 0.9);
  }
}
// Its flask of tea (rig space, at its near paw): a mint flask, its cap-cup on top.
function flaskAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0], y: p[1], ang: a.gl?.flaskAng ?? 0, cap: a.gl?.cap ?? 0 };
}
function flask(ctx, a, mode, D) {
  const F = flaskAt(a, D);
  ctx.save();
  ctx.translate(F.x, F.y);
  ctx.rotate(F.ang);
  ctx.scale(0.72, 0.72);
  // (upright in the paw: its body down past the paw, its cap above)
  const body = () => smooth(ctx, [[-2.2, -3.6], [2.2, -3.6], [2.5, -1], [2.5, 5], [1.8, 6], [-1.8, 6], [-2.5, 5], [-2.5, -1]]);
  const capS = () => smooth(ctx, [[-2.3, -6.8], [2.3, -6.8], [2.5, -3.8], [-2.5, -3.8]]);
  for (const sh of [body, capS]) {
    sh();
    if (mode === 'line') paint(ctx, a, 'line', null, FLASK[3]);
    else {
      ctx.fillStyle = tone(a, sh === capS ? FLASK[2] : FLASK[1]);
      ctx.fill();
    }
  }
  if (mode === 'fill') {
    ell(ctx, -1, 1, 0.7, 3.4);
    ctx.fillStyle = tone(a, FLASK[0], 0.8);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { doze: 8.0, stretch: 7.0, tea: 7.0, pillow: 6.2 };
const ORDER = ['doze', 'stretch', 'tea', 'pillow'];
const POOL = ['slap', 'nod', 'yawn'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, flaskAng: 0.1, cap: 0, plump: 0, steam: 0, yawnS: -1, swipe: -1, bonk: -1, drowse: -1, zz: 0, sweat: -1, patS: -1, jolt: -1 };
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
  const br = c.breath ?? 0;
  // Standing: soft and slumped, long arms dangling, the flask held loosely; a slow sway. Walking, a
  // sloth's slow sway, the long arms swinging late.
  const sway = Math.sin(t * 0.8);
  go({ shN: -4 + br * 1.4, elN: -12, hwN: -6, shF: 6 + br, elF: -10, tilt: 3 + sway * 1.2 + walking * 2, head: 3 + sway * 1.5, chest: 2 - br * 0.6, pelvis: sway * 1.2 }, 1);
  q.flaskAng = 0.12 + sway * 0.04;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.slWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.slAtk) {
      const pool = m.def.moves ?? POOL;
      st.slN = (st.slN ?? m.uid ?? 0) + 1;
      st.slMove = m.move ?? pool[st.slN % pool.length];
    }
    st.slAtk = true;
  } else st.slAtk = false;
  const mvName = st.slAtk ? st.slMove : null;
  const hadWind = now - (st.slWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  const hurt = alive && ago >= 0 && ago < 0.7;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.slCalm = mix(st.slCalm ?? 0, calmGoal, ease(calmGoal ? 1.6 : 7));
  const cw = sstep(st.slCalm);
  let PC = st.slPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.slOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.slOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.slOrd = (st.slOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.slPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'doze') {
    // its head sinking slowly onto its pillow
    const sink = win(pu, 0.2, 2.2, 4.0, 4.15);
    go({ head: 22, neckR: 8, chest: 5, tilt: 4, shN: 4, elN: -8, shF: 8, elF: -6 }, sink * k);
    say(pu < 1.4 ? 'drowsy' : 'dozing', sink * k);
    if (pu > 1.8 && pu < 4.0) q.zz = sink * k;
    // a lurch (the train!): it jolts awake, blinking
    const jolt = win(pu, 4.0, 4.1, 4.5, 4.9);
    go({ head: -8, neckR: -3, tilt: -4, lift: 0.015, shN: -30, elN: -40, shF: -20, elF: -40 }, jolt * k);
    if (pu > 4.0 && pu < 4.8) q.jolt = (pu - 4.0) / 0.8;
    say('jolt', jolt * k);
    // a slow look round; it settles back
    const look = win(pu, 4.8, 5.1, 6.6, 7.0);
    const lr = sstep((pu - 5.6) / 0.4);
    go({ neckR: -5 + lr * 8, head: 2 }, look * k);
    say(lr > 0.5 ? 'lookB' : 'blink', look * k);
    const settle = win(pu, 6.8, 7.2, 7.8, 8.2);
    go({ head: 8, chest: 3 }, settle * k);
    say('cosy', settle * k);
  }
  if (k > 0.001 && piece === 'stretch') {
    // a slow-motion stretch, long arms out wide, a long yawn
    const str = win(pu, 0.2, 1.6, 3.6, 4.4);
    go({ shN: -110, elN: -10, hwN: 20, shF: 70, elF: -10, chest: -6, head: -10, tilt: -4, lift: 0.02 }, str * k);
    q.flaskAng = mix(q.flaskAng, -0.6, str * k);
    say(pu > 1.2 && pu < 3.8 ? 'yawn' : 'drowsy', str * k);
    // it hugs itself, cosy
    const hug = win(pu, 4.3, 4.8, 6.4, 6.9);
    go({ shN: 10, elN: -130, hwN: -30, shF: -40, elF: -120, head: 8, chest: 3 }, hug * k);
    add({ pelvis: Math.sin(pu * 3) * 2 * hug }, k);
    say('cosy', hug * k);
  }
  if (k > 0.001 && piece === 'tea') {
    // the flask raised; its lid unscrewed, slowly
    const up = win(pu, 0.2, 0.8, 5.8, 6.5);
    go({ shN: -66, elN: -96, hwN: -10, head: 4, shF: -10, elF: -40 }, up * k);
    q.cap = sstep((pu - 1.2) / 1.2) * (1 - sstep((pu - 5.2) / 0.6));
    say('focus', win(pu, 0.6, 0.9, 2.2, 2.5) * k);
    // a sip
    const sip = win(pu, 2.6, 3.0, 3.8, 4.1);
    go({ shN: -92, elN: -126, head: -10, chest: -3 }, sip * k);
    q.flaskAng = mix(q.flaskAng, -0.7, sip * k);
    say('sip', sip * k);
    // a warm sigh, a curl of steam behind it
    const sigh = win(pu, 4.0, 4.3, 5.4, 5.8);
    add({ chest: Math.sin(Math.PI * clamp((pu - 4.0) / 1.6, 0, 1)) * 4 }, k);
    say('sigh', sigh * k);
    q.steam = win(pu, 2.8, 3.2, 5.6, 6.2) * k;
  }
  if (k > 0.001 && piece === 'pillow') {
    // its pillow plumped with a pat or two
    const pat = win(pu, 0.2, 0.5, 2.2, 2.5);
    const pp = Math.max(0, Math.sin((pu - 0.5) * 8));
    go({ shN: -86 - pp * 10, elN: -124, hwN: -30, head: -6, neckR: -2 }, pat * k);
    q.flaskAng = mix(q.flaskAng, 2.2, pat * k);
    q.plump = pp * pat * k;
    if (pu > 0.5 && pu < 2.2) q.patS = ((pu - 0.5) * 8 / Math.PI) % 2;
    say('pat', pat * k);
    // then its cheek snuggled into it
    const snug = win(pu, 2.5, 3.0, 5.4, 6.0);
    go({ head: 16, neckR: 10, tilt: 3, chest: 2 }, snug * k);
    add({ head: Math.sin(pu * 3) * 2 * snug }, k);
    say('snug', snug * k);
  }

  if (fighting && alive && !st.slHunt) st.slBangAt = now;
  if (!fighting && st.slHunt && alive) st.slLostAt = now;
  st.slHunt = fighting && alive;
  q.bang = now - (st.slBangAt ?? -9);
  q.huh = now - (st.slLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: as alert as it gets, arms half up -----
  // (the stance eases off as a move or a flinch takes over, never dropping out in one frame: the 2026-11-27
  // jitter probe found the arm and its prop leaping at the start of every wind-up)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    go({ shN: -50, elN: -40, shF: -30, elF: -40, tilt: 6, head: 0 }, huntW * (1 - walking * 0.5));
    if (huntW > 0.5 && !mvName) q.face = Math.floor(now / 2.6) % 2 ? 'sleepy' : 'alert';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.4) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.07) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'slap') {
      // a long, slow, sleepy wind-up, its long near arm raised and drawn back
      go({ shN: 40 + (1 - W) * -30, elN: -100, hwN: -20, tilt: -8, head: -2, chest: -4, x: -0.02 }, wu);
      q.flaskAng = mix(q.flaskAng, 2.6, wu);
      say(W < 0.6 ? 'sleepy' : 'alert', W);
      // then a surprisingly quick swipe of its soft claws
      if (s >= 0) {
        go({ shN: -86, elN: -10, hwN: 20, tilt: 14, chest: 6, head: 4, x: 0.06 }, sw);
        q.swipe = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else if (mvName === 'nod') {
      // it nods off on its feet, swaying forward
      go({ head: 14 + Math.sin(W * 7) * 3, neckR: 4, tilt: 4 + W * 6, chest: 3, lift: -0.02, shN: 6, elN: -10, shF: 8, elF: -10 }, wu);
      say('dozing', W);
      if (W > 0.3) q.zz = 0.6 * wu;
      // then its head drops into you: BONK
      if (s >= 0) {
        go({ head: 26, neckR: 10, tilt: 22, chest: 8, x: 0.07, lift: -0.04, shN: -30, elN: -20, shF: 20, elF: -20 }, sw);
        q.bonk = s;
        say(s < 0.3 ? 'dozing' : 'jolt', sw);
      }
    } else {
      // a huge breath in
      go({ chest: -8, head: -12, tilt: -6, lift: 0.02, shN: -30, elN: -40, shF: 20, elF: -30 }, wu);
      say('drowsy', W);
      // then a yawn so big a soft drowsy wave rolls out
      if (s >= 0) {
        go({ chest: -4, head: -16, tilt: 4, shN: -100, elN: -20, shF: 40, elF: -20, lift: 0.01 }, sw);
        q.yawnS = s;
        say('yawn', win(s, 0, 0.05, 0.6, 0.7));
      }
    }
  }
  // ----- Hurt: a slow wince -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.7);
    go({ tilt: -10, head: 10, neckR: 4, shN: -30, elN: -80, shF: -20, elF: -90, lift: -0.02 }, kh);
    q.face = 'hurt';
  }
  // ----- After landing a hit: a contented little smile, a pat of its pillow -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.4 && alive && !hurt) {
    const kg = win(gl, 0, 0.3, 1.0, 1.4) * (1 - moveW);
    go({ shN: -86, elN: -124, hwN: -30, head: -2 }, kg);
    q.flaskAng = mix(q.flaskAng, 2.2, kg);
    say('pat', kg);
    if (kg > 0.3) q.patS = (gl * 2.4) % 2;
  }
  // ----- A nap (its habitat): asleep standing, head on its pillow -----
  st.slNap = mix(st.slNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 1.8 : 6));
  const nw = sstep(st.slNap);
  if (nw > 0.001) {
    go({ head: 22 + Math.sin(now * 1.1) * 2, neckR: 9, chest: 5, tilt: 4, shN: 4, elN: -8, shF: 8, elF: -6 }, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'alert';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 5) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  // ----- The face: an in-between (a blink) on every change; its own slow blink -----
  let f = q.face ?? 'calm';
  if (f !== st.slFace) {
    st.slFaceFrom = st.slFace;
    st.slFace = f;
    st.slFaceAt = now;
  }
  const since0 = now - (st.slFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.09 && st.slFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.slFaceFrom) && !(talky(f) && talky(st.slFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.77) % 3.6;
  if (bl < 0.22 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['flaskAng', 'cap', 'plump', 'steam']) {
    // (its prop's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly, where an
    // eased chase leapt off at full speed the frame a new aim was set; the 2026-11-27 jitter probe)
    if (key === 'flaskAng') {
      let x = st.sl_flaskAng ?? q[key];
      let v = st.sl_flaskAngV ?? 0;
      const n = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        v += (400 * (q[key] - x) - 40 * v) * h;
        x += v * h;
      }
      st.sl_flaskAngV = v;
      st.sl_flaskAng = x;
      q[key] = x;
      continue;
    }
    st[`sl_${key}`] = mix(st[`sl_${key}`] ?? q[key], q[key], ease(key === 'flaskAng' ? 12 : 10));
    q[key] = st[`sl_${key}`];
  }
  q.calm = cw;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little soft cloud-pillow with the mark on it.
function cloudMark(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, 1 - Math.exp(-7 * e) * Math.cos(14 * e)) * (1 - sstep((e - dur + 0.3) / 0.3));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    for (const [cx, cy, r] of [[-3.4, 0.6, 3.2], [0, -1.4, 3.8], [3.4, 0.6, 3.2], [0, 2, 3]]) {
      ctx.moveTo(cx + r, cy);
      ctx.ellipse(cx, cy, r, r * 0.9, 0, 0, TAU);
    }
    if (pass === 'line') {
      pen(ctx, KNIT[2], 1.4);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffaff';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e07a9a' : KNIT[3];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.2);
  } else {
    ctx.moveTo(-1.4, -2);
    ctx.quadraticCurveTo(-1.1, -3.6, 0.4, -3.5);
    ctx.quadraticCurveTo(1.9, -3.2, 1.3, -1.6);
    ctx.quadraticCurveTo(0.3, -0.9, 0.2, 0.2);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2, 0.75, 0.75);
  ctx.fill();
  ctx.restore();
}
// A soft lilac z, drifting.
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
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = KNIT[3];
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#fbf6ff';
  ctx.stroke();
  ctx.restore();
}
// A soft drowsy curl: a lilac swirl with a pale core.
function curl(ctx, x, y, r, rot, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    const an = u * TAU * 1.15;
    const rr = r * (1 - u * 0.75);
    if (i) ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
    else ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr);
  }
  ctx.lineCap = 'round';
  pen(ctx, DROWSY[1], r * 0.42);
  ctx.stroke();
  pen(ctx, DROWSY[0], r * 0.18);
  ctx.stroke();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  // steam from its tea, behind its face (never in front of it)
  if ((q.steam ?? 0) > 0.05 && m.hp > 0) {
    const F = flaskAt(a, D);
    for (let i = 0; i < 3; i++) {
      const f = (((a.now ?? 0) * 0.5 + i / 3) % 1);
      dust(ctx, F.x - 2 - f * 4 + Math.sin(f * 6 + i) * 1.5, F.y - 8 - f * 14, 1 + f * 1.6, q.steam * Math.sin(Math.PI * f) * 0.7, '#ffffff', '#ece6f2');
    }
  }
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -28]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const handPt = (k) => ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  // the jolt awake: a couple of soft start lines by its head
  if ((q.jolt ?? -1) >= 0 && q.jolt < 1) {
    const [hx, hy] = headAt(a, D, [16, -18]);
    ctx.save();
    ctx.globalAlpha *= Math.sin(Math.PI * q.jolt);
    ctx.lineCap = 'round';
    for (const [dx, dy] of [[0, 0], [3.4, 1.6], [-3, 1.8]]) {
      ctx.beginPath();
      ctx.moveTo(hx + dx, hy + dy);
      ctx.lineTo(hx + dx * 1.3, hy + dy - 3);
      pen(ctx, KNIT[3], 0.9);
      ctx.stroke();
    }
    ctx.restore();
  }
  // its pats on the pillow: a tiny soft puff each
  if ((q.patS ?? -1) >= 0) {
    const u = q.patS % 1;
    const [px, py] = ptOf(a, D, 'chest', [D.J.stern[0] + 10, D.J.stern[1] - 9]);
    sparkle(ctx, px + 2, py - 2 - u * 3, 1.2 * Math.sin(Math.PI * u), 1, PILLOW[0]);
  }
  // Slow Slap: three soft claw arcs
  if ((q.swipe ?? -1) >= 0 && q.swipe < 0.6) {
    const u = q.swipe / 0.6;
    const [cx, cy] = ptOf(a, D, 'chest', D.J.stern);
    ctx.save();
    ctx.globalAlpha *= (1 - sstep((u - 0.2) / 0.5)) * 0.85;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 3, 17 + i * 2.4, -1.4, -1.4 + 1.9 * sstep(u * 3 - i * 0.12));
      pen(ctx, '#fffaf2', 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 2, cy + 3, 17 + i * 2.4, -1.3, -1.3 + 1.8 * sstep(u * 3 - i * 0.12));
      pen(ctx, FUR[2], 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Nod Off: BONK, soft stars where its head lands
  if ((q.bonk ?? -1) >= 0.12 && q.bonk < 0.75) {
    const u = (q.bonk - 0.12) / 0.63;
    const [hx, hy] = headAt(a, D, [10, -18]);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI / 2 + (i - 1) * 0.9 + u * 2;
      star(ctx, hx + Math.cos(an) * (5 + u * 5), hy + Math.sin(an) * (3 + u * 3), 1.3 * (1 - u * 0.6), an, 1 - u);
    }
  }
  // Big Yawn: a soft drowsy wave of curls rolling out at you
  if ((q.yawnS ?? -1) >= 0 && q.yawnS < 1.0) {
    const [mx, my] = headAt(a, D, [20, 9]);
    for (let i = 0; i < 6; i++) {
      const v = clamp(q.yawnS * 1.4 - (i % 3) * 0.12, 0, 1);
      if (v <= 0) continue;
      const dy = (i - 2.5) * 2.4;
      curl(ctx, mx + 4 + v * 26, my + dy * (0.6 + v) + Math.sin(v * 7 + i) * 1.2, 1.9 + v * 2.2, v * 4 + i, 1 - sstep((v - 0.55) / 0.45));
    }
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [10, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.32 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.65 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [6, -32]);
  if (q.bang >= 0 && q.bang < 1.3) cloudMark(ctx, bx, by, '!', q.bang, 1.3, a.flip);
  else if (q.huh >= 0 && q.huh < 1.5) cloudMark(ctx, bx, by, '?', q.huh, 1.5, a.flip);
  void handPt;
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'travelpillowsloth',
  // (the skin is its knit cardigan and sleeves; its own fur at the legs, paws, feet and neck)
  skin: {
    lt: KNIT[0], base: KNIT[1], sh: KNIT[2], deep: KNIT[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: '#6e5a46' },
      neck: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  under2,
  under: {
    handNskin: (ctx, a, mode, S, D) => flask(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => cardigan(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => claws(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => claws(ctx, a, mode, D, 'N'),
    // (its pillow round its neck, tucked up under its chin, over the bottom of its head)
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      pillow(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('sloth', DRESS);
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
export const STRAP_SLOTH_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const STRAP_SLOTH_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
