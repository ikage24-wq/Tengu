// The Toast-Dash Stoat (2026-11-27, the Dream Theatre's Rush-Hour Penguin remade from scratch as a new
// creature; the id stays `paperdragon`). A commuter from Act I, the Queen's dream of her old morning train:
// a slim little stoat in a trench coat who is late. It has always been late. It will be late tomorrow.
// It runs everywhere with a slice of toast in its mouth, the way people in cartoons do, hoping to bump
// into destiny at a corner (it bumps into you instead). On its own copy of the creature base (rig.js;
// body.js `stoat`: a long slender body, a narrow waist, longer legs for running, slim arms), dressed
// here; its head, tail, coat and briefcase drawn here from scratch over the mannequin (never the shared
// face, never the hero).
//   look    warm chestnut fur on top, a cream face, throat and front; small round ears; a long slim
//           tail with a soft charcoal tip; its clothes worn: a beige trench coat (the body's own skin
//           and its sleeves, so it folds with every pose) with wide lapels, a belt with a buckle, and its
//           skirt flaring behind on a spring as it runs; a white shirt and a loosened navy tie showing
//           at the front; navy trousers (the legs' own skin); its paws and feet its own fur. A little
//           tan briefcase in its near paw. Its own soft cocoa outline, outer edge only, face bare.
//   eyes    its own "rush-hour eyes": big tall ovals tipped up at the outer corner, a chestnut-gold
//           iris, a deep pupil and a four-point star of a glint (the anime "determination" sparkle);
//           an upturned lash line with one round flick. Thin curved brows. A small quick mouth.
//   walk    the base's walk at a hurrying commuter's pace (40), leaning in, the briefcase swinging, the
//           coat flaring behind.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - watch (6.0 s): a glance at its wristwatch; a double take; panic, a bead of sweat; a foot
//             tapping on the spot;
//           - toast (7.0 s): the briefcase set down; a slice of toast out of its coat pocket; a bite (soft
//             crumbs); then held in its mouth, running on the spot; the briefcase picked back up;
//           - tie (6.0 s): the briefcase set down; its tie straightened in a rush, the knot pushed up; it
//             springs crooked again; a shrug; the briefcase picked up;
//           - stretch (6.6 s): a sprinter's lunge stretch, deep; then "on your marks", crouched; nothing
//             happens; sheepish, it stands back up.
//   moves   Late Dash (toast in its mouth, it crouches to sprint; then dashes at you and bumps, a burst of
//           soft stars, a skid back); Briefcase Swing (the briefcase swung back round behind it; then
//           brought round at you, WHUMP); Tail Whip (a low turn of its hips, its long tail cocked; then
//           whipped round low across your ankles in a soft swish).
//   else    hurt: a wince, its tie flying up; after landing a hit: "sorry, sorry!", a quick bow; hunting
//           you: leaning in on its toes, toast in its mouth; low on health: frazzled, a bead of sweat; a nap
//           (habitat): asleep standing, chin on its chest, the briefcase hugged; beaten: dizzy. Its marks
//           over its head (!, ?, z's, sweat) are its own: little train-ticket stubs (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: speed lines as soft tapering streaks, crumbs as
// soft toasted rounds, stars as round-tipped gold stars, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, streak } from './fx.js';

const BIG = 1.13;
const LW = 1.6 / BIG;
const INK = '#7a4e40';
const FUR = ['#e6b48a', '#c08458', '#9a643e', '#76482c'];
const CREAM = ['#fffcf4', '#f8ecd8', '#e6d2b6'];
const COAT = ['#fbeccc', '#e6d0a2', '#c8ae80', '#a68c62'];
const COAT_IN = '#b89a6c';
const TROU = ['#9aa4c8', '#727ca6', '#58628a', '#444c70'];
const SHIRT = ['#ffffff', '#eef0f8'];
const TIE = ['#8aa0e0', '#5a6cb4', '#44528e'];
const CASE = ['#f2c48e', '#d29a5e', '#a8743e', '#86582c'];
const TOAST = ['#fff4d2', '#f4cc84', '#d89a4e', '#b07434'];
const TIP = '#5a4a56';
const LASH = '#4a2a26';
const IRIS = ['#4a2810', '#8a5422', '#c48a3c', '#f6d078'];

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
const HS = 1.28;
const HO = [1.6, -15.2];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [72.6, 114];
const TAIL_B = [60, 126];
const SKIRT = [72, 112];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B, skirt: SKIRT };
const PIV2 = { tailA: 'tailA', tailB: 'tailB', skirt: 'skirt' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 64, c: 5.4, gain: 0.45, turn: 0.75, hang: 0.25, max: 14, flutter: 1.5, hz: 0.45, dir: [-6, 5] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 56, c: 4.8, gain: 0.5, turn: 0.75, hang: 0.2, max: 16, flutter: 2, hz: 0.5, dir: [-7, 1] } },
  // (the coat's skirt behind, swinging only back and in against its legs)
  { name: 'skirt', parent: 'torso', pivot: 'skirt', rot: (S, a) => a.gl?.skirt ?? 0, soft: { k: 120, c: 9, gain: 0.3, turn: 0.4, hang: 0.3, max: 9, flutter: 1, hz: 0.6, dir: [-3, 8] } },
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
  calm: { e: 'open', g: [0.8, 0.3], b: [0, 0], m: 'calm' },
  eager: { e: 'open', g: [1.4, 0.2], b: [-0.6, 0.6], m: 'grin' },
  glance: { e: 'open', g: [1.2, 1.6], b: [0, 0], m: 'calm' },
  late: { e: 'wide', g: [1.4, 1.4], b: [-1.8, -2], m: 'o' },
  panic: { e: 'wide', g: [-0.6, 0.4], b: [1.6, -2], m: 'wobble' },
  munch: { e: 'happy', b: [-0.8, -1], m: 'chew' },
  toast: { e: 'open', g: [1.6, 0.2], b: [-0.6, 0.8], m: 'toast' },
  fuss: { e: 'open', g: [0.8, 1.6], b: [0.6, -0.6], m: 'set' },
  shrug: { e: 'happy', b: [1, -1.2], m: 'wobble' },
  strain: { e: 'squeeze', b: [0.8, 1], m: 'set' },
  ready: { e: 'open', g: [1.8, 0], b: [-0.6, 1.6], m: 'set' },
  sheepish: { e: 'open', g: [-1, 0.9], b: [1, -1.4], m: 'grin' },
  sorry: { e: 'happy', b: [1, -1.2], m: 'open' },
  fierce: { e: 'open', g: [1.8, 0.3], b: [-0.8, 2], m: 'toast' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  happy: { e: 'happy', b: [-0.9, -1], m: 'open' },
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
const SHUTS = new Set(['munch', 'shrug', 'strain', 'sorry', 'shout', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A four-point star glint (its determination sparkle).
function starGlint(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.18, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.18, y + s * 0.18, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.18, y + s * 0.18, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.18, y - s * 0.18, x, y - s);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.5;
  const h = 5;
  const tilt = -0.22 * o;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1], [x, y - h * 0.85], [x + w, y + 1 - o * 0.6], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.2], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.2], [x + w * 0.2 * o, y + 1.1], [x + w * 0.9 * o, y + 0.4], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.6], [x, y + (kind === 'sleep' ? 3 : 2.4)], [x + w, y + 0.6 - o * 0.5], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ell(ctx, 0, 0, w * big, h * big);
  ctx.fillStyle = tone(a, '#fffdf6');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = Math.cos(an) * u * w * 0.7;
      const py = Math.sin(an) * u * h * 0.7;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.8, 0.3];
    ctx.save();
    ell(ctx, 0, 0, w * big, h * big);
    ctx.clip();
    const ir = kind === 'wide' ? 0.72 : 0.84;
    const ix = gx * 0.5;
    const iy = gy * 0.5 + 0.3;
    const iw = w * ir;
    const ih = h * ir;
    ell(ctx, ix, iy, iw, ih);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.15, iw * 0.88, ih * 0.82);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.48, iw * 0.7, ih * 0.42);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.72, iw * 0.46, ih * 0.16);
    ctx.fillStyle = tone(a, IRIS[3], 0.85);
    ctx.fill();
    ell(ctx, ix, iy - ih * 0.05, iw * 0.44, ih * 0.44);
    ctx.fillStyle = tone(a, '#24120a');
    ctx.fill();
    // its glints: a four-point star, and a small round one
    starGlint(ctx, ix - iw * 0.3, iy - ih * 0.38, 1.5);
    ell(ctx, ix + iw * 0.4, iy + ih * 0.42, 0.5, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // an upturned lash line, one round flick lifting off its outer corner
  stroke3(ctx, a, [-w * 0.98, -h * 0.28], [0, -h * 1.3], [w * 0.98, -h * 0.28], 1.3, LASH);
  stroke3(ctx, a, [w * 0.85 * o, -h * 0.62], [(w + 0.8) * o, -h * 0.78], [(w + 1.3) * o, -h * 1.12], 1, LASH);
  ctx.restore();
}
// Thin curved brows.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.6, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1.1 + (bo + bi) * 0.35, x + o * 2.6, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1);
  ctx.stroke();
}
// A slice of toast (local units: its middle at 0, 0): a soft crust, a golden middle, a pat of butter.
// (2026-11-27, the player: a black dot on the toast read as a fly. The bite was cut out with
// 'destination-out', which punched a hole through everything under it, the map too, showing black.
// Now the bite is clipped out of the slice itself, with a soft toasted edge round it.)
function toastShape(ctx, a, s, bite = 0) {
  ctx.save();
  ctx.scale(s, s);
  if (bite > 0) {
    ctx.beginPath();
    ctx.rect(-8, -8, 16, 16);
    ctx.ellipse(3.6, -2.6, 1.6 * bite, 1.6 * bite, 0, 0, Math.PI * 2);
    ctx.clip('evenodd');
  }
  smooth(ctx, [[-3.6, 3], [-3.8, -1.4], [-2.6, -3.4], [0, -3.8], [2.6, -3.4], [3.8, -1.4], [3.6, 3]]);
  pen(ctx, tone(a, TOAST[3]), 0.7);
  ctx.stroke();
  ctx.fillStyle = tone(a, TOAST[2]);
  ctx.fill();
  smooth(ctx, [[-2.8, 2.3], [-3, -1.1], [-2, -2.7], [0, -3], [2, -2.7], [3, -1.1], [2.8, 2.3]]);
  ctx.fillStyle = tone(a, TOAST[1]);
  ctx.fill();
  ell(ctx, -0.4, -0.4, 1.3, 0.9, 0.2);
  ctx.fillStyle = tone(a, '#fff6b8');
  ctx.fill();
  if (bite > 0) {
    // the bite's edge: the crumb showing toasted round it
    ctx.beginPath();
    ctx.ellipse(3.6, -2.6, 1.6 * bite + 0.25, 1.6 * bite + 0.25, 0, Math.PI * 0.45, Math.PI * 1.25);
    pen(ctx, tone(a, TOAST[3]), 0.6);
    ctx.stroke();
  }
  ctx.restore();
}
function mouth(ctx, a, x, y, m, now = 0) {
  const LIP = '#6a3428';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7a2e38');
    ctx.fill();
    ell(ctx, x, y + h * 0.8, w * 0.55, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9caa');
    ctx.fill();
  };
  const line = (pts, w = 0.72) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'grin':
      open(2.2, 1.6);
      break;
    case 'open':
      open(2, 2.2);
      break;
    case 'shout':
      open(2.4, 2.8);
      break;
    case 'o':
      ell(ctx, x, y + 0.7, 1, 1.25);
      ctx.fillStyle = tone(a, '#7a2e38');
      ctx.fill();
      break;
    case 'chew': {
      const c = Math.sin(now * 20);
      line([[x - 1.8, y + 0.2 + c * 0.3], [x, y + 1 - c * 0.2], [x + 1.8, y + 0.2 + c * 0.3]]);
      break;
    }
    case 'toast':
      // the corner of a slice of toast held in its teeth (the slice itself drawn with its head)
      line([[x - 1.8, y + 0.4], [x, y + 0.8], [x + 1.8, y + 0.4]]);
      break;
    case 'set':
      line([[x - 1.8, y + 0.4], [x, y + 0.1], [x + 1.8, y + 0.4]], 0.8);
      break;
    case 'wobble':
      line([[x - 1.9, y + 0.4], [x - 0.9, y - 0.3], [x, y + 0.3], [x + 0.9, y - 0.3], [x + 1.9, y + 0.4]], 0.68);
      break;
    case 'frown':
      line([[x - 1.7, y + 0.9], [x, y - 0.2], [x + 1.7, y + 0.9]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.5, 0.7, 0.55);
      ctx.fillStyle = tone(a, '#7a2e38');
      ctx.fill();
      break;
    case 'talkA':
      open(1.6, 1.9);
      break;
    case 'talkE':
      open(2, 1.1);
      break;
    default:
      line([[x - 2, y - 0.2], [x - 1, y + 0.9], [x, y + 0.3], [x + 1, y + 0.9], [x + 2.1, y - 0.4]], 0.7);
  }
}
const SKULL = [[-17.4, -1], [-15.8, -10.4], [-9.6, -16.2], [-0.4, -18], [8.4, -16.6], [15, -12], [19.6, -5.4], [24.6, -0.4], [26.4, 4], [24.4, 8.2], [17.6, 11.6], [8, 14.4], [-3, 14.6], [-12.6, 10.6]];
const BELLY_FACE = [[-1, 6], [6, 3], [13, 0.6], [20, -0.4], [26, 1.6], [26.4, 6.4], [21, 10.6], [12, 14.6], [2, 15], [-6, 13.4]];
function ear(ctx, a, mode, x, y, r) {
  ell(ctx, x, y, r, r * 0.9);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ell(ctx, x + 0.4, y + 0.3, r * 0.55, r * 0.5);
    ctx.fillStyle = tone(a, '#f2c2b0');
    ctx.fill();
  }
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -12.6, -12.6, 3.6);
  ear(ctx, a, mode, -2.4, -16.8, 3.8);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -2, -11, 16, FUR[0], 0.8);
    glow(ctx, -15, 9, 11, FUR[2], 0.6);
    smooth(ctx, BELLY_FACE);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 18, 5, 7, CREAM[0], 0.9);
    ctx.restore();
    for (const [cx, cy, k] of [[-7.6, 5.4, 0.6], [12.6, 6.2, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ff9cae', 0.45 * k);
      ctx.fill();
    }
    eye(ctx, a, -3.8, -3.6, -1, f);
    eye(ctx, a, 9.8, -4, 1, f);
    brow(ctx, a, -4, -11, -1, f.b);
    brow(ctx, a, 10, -11.4, 1, f.b);
    // the nose: a soft round cocoa bead at the tip of its snout
    ell(ctx, 25.4, 2.2, 1.9, 1.5, 0.2);
    ctx.fillStyle = tone(a, '#5a3434');
    ctx.fill();
    ell(ctx, 24.8, 1.6, 0.7, 0.4, 0.2);
    ctx.fillStyle = 'rgba(255,236,236,0.7)';
    ctx.fill();
    mouth(ctx, a, 20.8, 8, f.m, a.now ?? 0);
    // the toast in its teeth, sticking out ahead
    if ((q.toastMouth ?? 0) > 0.02) {
      ctx.save();
      ctx.translate(23.6, 12.4);
      ctx.rotate(0.22);
      toastShape(ctx, a, 2.1 * q.toastMouth, 0.7);
      ctx.restore();
    }
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
// The coat's front over the body: the open front with the shirt and tie, the lapels, the belt.
function coat(ctx, a, mode, D) {
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
  const c0 = C([st[0] + 4, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 6, COAT[0], 0.7);
  // the open front: the white shirt in a V down to the belt
  const vee = [C([st[0] + 1.4, st[1] - 1]), C([st[0] + 9.6, st[1] - 1]), W([w[0] + 7.6, w[1] - 1]), W([w[0] + 4.4, w[1] - 1])];
  poly(ctx, vee);
  ctx.fillStyle = tone(a, SHIRT[0]);
  ctx.fill();
  // the tie, loosened, swinging askew
  const sk = a.gl?.tieSkew ?? 0;
  const blade = [C([st[0] + 4.4, st[1] + 2]), C([st[0] + 6.6, st[1] + 2]), W([w[0] + 7.6 + sk * 3, w[1] - 2]), W([w[0] + 6 + sk * 3, w[1]]), W([w[0] + 4.6 + sk * 3, w[1] - 2])];
  smooth(ctx, blade);
  ctx.fillStyle = tone(a, TIE[1]);
  ctx.fill();
  const kn = C([st[0] + 5.4 + sk * 0.8, st[1] + 1.4]);
  ell(ctx, kn[0], kn[1], 1.4, 1.1);
  ctx.fillStyle = tone(a, TIE[2]);
  ctx.fill();
  // the lapels, wide, down each side of the opening
  for (const [x0, x1, xw] of [[0, 3.4, w[0] + 3.4], [11, 8.2, w[0] + 8.4]]) {
    poly(ctx, [C([st[0] + x0, st[1] - 2]), C([st[0] + x0 + (x0 ? 2.8 : -2.8), st[1] + 2]), C([st[0] + x1 + (x0 ? 1 : -1), st[1] + 9]), W([xw, w[1] - 1.4]), C([st[0] + x1, st[1] + 6])]);
    ctx.fillStyle = tone(a, COAT[0]);
    ctx.fill();
  }
  // the belt, a buckle at the front
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 40, w[1] + 0.6]));
  ctx.lineTo(...W([w[0] + 40, w[1] + 0.6]));
  pen(ctx, tone(a, COAT[3]), 1.8);
  ctx.stroke();
  const bk = W([w[0] + 6, w[1] + 0.6]);
  smooth(ctx, [[bk[0] - 1.4, bk[1] - 1.2], [bk[0] + 1.4, bk[1] - 1.2], [bk[0] + 1.4, bk[1] + 1.2], [bk[0] - 1.4, bk[1] + 1.2]]);
  pen(ctx, tone(a, '#e6cf8a'), 0.6);
  ctx.stroke();
  // the coat's skirt over the hips, shaded toward the far side
  const sh = T([h[0] - 12, h[1] + 3]);
  glow(ctx, sh[0], sh[1], 7, COAT[3], 0.45);
  ctx.restore();
}
// The coat's skirt behind: a flap from the waist down past its knees, flaring as it hurries.
function skirt(ctx, a, mode, D) {
  const P = (p) => ptOf(a, D, 'skirt', p);
  const pts = [P([82, 110]), P([66, 112]), P([60, 124]), P([56, 133]), P([62, 136]), P([72, 134]), P([82, 128])];
  smooth(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, COAT_IN);
  ctx.fill();
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  const g = P([64, 120]);
  glow(ctx, g[0], g[1], 5, COAT[2], 0.6);
  ctx.restore();
}
// A shirt cuff at the sleeve's end.
function cuff(ctx, a, mode, D, k) {
  const W = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(W[1] - E[1], W[0] - E[0]);
  ctx.save();
  ctx.translate(...W);
  ctx.rotate(ang);
  smooth(ctx, [[-2.2, -2.5], [0.2, -2.7], [0.6, 0], [0.2, 2.7], [-2.2, 2.5], [-2.6, 0]]);
  if (mode === 'line') paint(ctx, a, 'line', null);
  else {
    ctx.fillStyle = tone(a, k === 'F' ? COAT[2] : COAT[1]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1, -2.4);
    ctx.lineTo(-1, 2.4);
    pen(ctx, tone(a, COAT[3], 0.6), 0.45);
    ctx.stroke();
  }
  ctx.restore();
}
// The long slim tail, its tip soft charcoal.
const TAIL_PTS_A = [[73.6, 112], [67, 120], TAIL_B];
const TAIL_PTS_B = [[50, 132], [41, 132], [34, 127]];
const TAIL_W = [8.4, 8, 7.6, 7.4, 7.6, 7.2, 6];
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
  const c = ribbon(ctx, pts, TAIL_W.map((w) => w * D.SC));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] - 0.3, c[i][1] - 1.2, 2.4, FUR[0], 0.5);
  // its soft charcoal tip
  const n = c.length;
  for (let i = Math.floor(n * 0.72); i < n; i++) {
    const u = (i - n * 0.72) / (n * 0.28);
    ell(ctx, c[i][0], c[i][1], 2.2, 2.2);
    ctx.fillStyle = tone(a, TIP, clamp(u * 2.2, 0, 1));
    ctx.fill();
  }
  ctx.restore();
}
// The briefcase: in its near paw, or set down beside it (slid there, never popping).
function caseAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  const k = sstep(a.gl?.caseDown ?? 0);
  return { x: mix(p[0] + 0.4, 9, k), y: mix(p[1] + 1.2, -0.2, k), ang: mix(a.gl?.caseAng ?? 0, 0, k), down: k };
}
function briefcase(ctx, a, mode, D) {
  const B = caseAt(a, D);
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.rotate(B.ang);
  // (hung from its handle at 0, 0: the case below; set down, its base on the floor)
  ctx.translate(0, mix(0.6, -5, B.down));
  const body = () => smooth(ctx, [[-5.2, 1.4], [5.2, 1.4], [5.6, 2.4], [5.4, 8.6], [4.6, 9.4], [-4.6, 9.4], [-5.4, 8.6], [-5.6, 2.4]]);
  const handle = () => {
    ctx.beginPath();
    ctx.moveTo(-2, 1.6);
    ctx.quadraticCurveTo(-2, -0.8, 0, -0.8);
    ctx.quadraticCurveTo(2, -0.8, 2, 1.6);
  };
  if (mode === 'line') {
    body();
    paint(ctx, a, 'line', null, CASE[3]);
    handle();
    pen(ctx, CASE[3], 1.8);
    ctx.stroke();
    ctx.restore();
    return;
  }
  handle();
  pen(ctx, tone(a, CASE[2]), 1);
  ctx.stroke();
  body();
  ctx.fillStyle = tone(a, CASE[1]);
  ctx.fill();
  ctx.save();
  body();
  ctx.clip();
  glow(ctx, -2, 3, 5, CASE[0], 0.7);
  ctx.fillStyle = tone(a, CASE[2]);
  ctx.fillRect(-6, 4.2, 12, 1);
  ctx.restore();
  for (const x of [-3, 3]) {
    smooth(ctx, [[x - 0.8, 3.6], [x + 0.8, 3.6], [x + 0.8, 5.6], [x - 0.8, 5.6]]);
    ctx.fillStyle = tone(a, '#f6dc8a');
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { watch: 6.0, toast: 7.0, tie: 6.0, stretch: 6.6 };
const ORDER = ['watch', 'toast', 'tie', 'stretch'];
const POOL = ['dash', 'case', 'whip'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tailRot: 0, tailCurl: 0, skirt: 0, tieSkew: 0.4, caseDown: 0, caseAng: 0, toastMouth: 0, toastHand: 0, crumbs: 0, watch: 0, dashS: -1, swing: -1, whipS: -1, sorryS: -1, sweat: -1, zz: 0, speed: 0 };
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
  const br = c.breath ?? 0;
  // Standing: weight forward, impatient, the briefcase hanging in its near paw; walking, a hurrying lean,
  // the coat flaring behind.
  go({ shN: -4 + br * 1.5, elN: -10, hwN: -6, shF: 10 + br, elF: -24, tilt: 2 + walking * 6, head: -2, chest: -br * 0.6 }, 1);
  q.tailRot = Math.sin(t * 0.7) * 0.06 + Math.sin((a.blkidU ?? t) * TAU - 0.5) * 0.12 * walking;
  q.tailCurl = Math.sin(t * 0.6 + 1) * 0.06;
  q.skirt = -0.25 * walking;
  q.caseAng = Math.sin((a.blkidU ?? t) * TAU) * 0.15 * walking;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.stWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.stAtk) {
      const pool = m.def.moves ?? POOL;
      st.stN = (st.stN ?? m.uid ?? 0) + 1;
      st.stMove = m.move ?? pool[st.stN % pool.length];
    }
    st.stAtk = true;
  } else st.stAtk = false;
  const mvName = st.stAtk ? st.stMove : null;
  const hadWind = now - (st.stWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.stCalm = mix(st.stCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.stCalm);
  let PC = st.stPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.stOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.stOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.stOrd = (st.stOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.stPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  // (setting the briefcase down beside it and picking it back up: a bend to the floor each time)
  const setDown = (t0, t1) => {
    const bend = win(pu, t0, t0 + 0.3, t0 + 0.5, t0 + 0.8) + win(pu, t1, t1 + 0.3, t1 + 0.5, t1 + 0.8);
    go({ tilt: 18, chest: 6, head: 6, lift: -0.04, shN: -20, elN: -10, x: 0.01 }, bend * k);
    q.caseDown = Math.max(q.caseDown, sstep((pu - t0 - 0.35) / 0.2) * (1 - sstep((pu - t1 - 0.25) / 0.2)) * k);
  };

  if (k > 0.001 && piece === 'watch') {
    // a glance at its wristwatch (the briefcase raised with it)
    const look = win(pu, 0.2, 0.45, 1.1, 1.3);
    go({ shN: -70, elN: -90, hwN: -30, head: 10, neckR: 3 }, look * k);
    q.watch = Math.max(q.watch, look * k);
    say('glance', look * k);
    // a double take
    const dbl = win(pu, 1.3, 1.4, 1.6, 1.8);
    go({ head: -6, neckR: -2 }, dbl * k);
    const look2 = win(pu, 1.7, 1.85, 2.6, 2.9);
    go({ shN: -70, elN: -96, hwN: -30, head: 12, neckR: 4, tilt: 5 }, look2 * k);
    q.watch = Math.max(q.watch, look2 * k);
    say('late', look2 * k);
    if (pu > 2.3 && pu < 5.6) q.sweat = (pu - 2.3) % 1;
    // panic: a foot tapping fast on the spot
    const tap = win(pu, 2.8, 3.0, 5.4, 5.8);
    go({ toeN: -10 + Math.max(0, Math.sin(pu * 18)) * 20, head: -2, tilt: 4 }, tap * k);
    add({ lift: Math.abs(Math.sin(pu * 9)) * 0.008 }, tap * k);
    q.tailRot += Math.sin(pu * 9) * 0.2 * tap * k;
    say('panic', tap * k);
  }
  if (k > 0.001 && piece === 'toast') {
    setDown(0.2, 5.9);
    // a slice of toast out of its coat pocket; a bite
    const out0 = win(pu, 1.0, 1.3, 2.4, 2.6);
    go({ shN: 6, elN: -110, hwN: -30, head: 6 }, win(pu, 1.0, 1.2, 1.35, 1.5) * k);
    go({ shN: -74, elN: -118, hwN: -20, head: 0 }, sstep((pu - 1.4) / 0.25) * out0 * k);
    q.toastHand = pu > 1.3 && pu < 2.55 ? 1 : 0;
    const munch = win(pu, 1.8, 1.9, 2.4, 2.5);
    say(munch > 0.5 ? 'munch' : 'eager', out0 * k);
    q.crumbs = Math.max(q.crumbs, munch * k);
    // then held in its mouth, running on the spot
    q.toastMouth = Math.max(q.toastMouth, sstep((pu - 2.45) / 0.15) * (1 - sstep((pu - 6.6) / 0.25)) * k);
    const run = win(pu, 2.7, 3.0, 5.4, 5.7);
    const rp = (pu - 2.7) * 9;
    go({ tilt: 12, shN: -10 + Math.sin(rp) * 40, elN: -80, shF: 10 - Math.sin(rp) * 40, elF: -80, head: -6, fyN: Math.max(0, Math.sin(rp)) * 0.3, fyF: Math.max(0, -Math.sin(rp)) * 0.3, toeN: 10, toeF: 10 }, run * k);
    add({ lift: Math.abs(Math.sin(rp)) * 0.015 }, run * k);
    q.skirt -= 0.4 * run * k;
    say('toast', win(pu, 2.5, 2.7, 6.6, 6.8) * k);
  }
  if (k > 0.001 && piece === 'tie') {
    setDown(0.2, 4.9);
    // the tie straightened in a rush, its knot pushed up
    const fix = win(pu, 1.0, 1.25, 2.5, 2.7);
    go({ shN: -30 + Math.sin(pu * 14) * 6, elN: -128, hwN: -30, head: 10, neckR: 3 }, fix * k);
    q.tieSkew = mix(q.tieSkew, 0, sstep((pu - 1.2) / 0.8) * k);
    say('fuss', fix * k);
    // it springs crooked again; a shrug
    if (pu > 2.9) q.tieSkew = mix(q.tieSkew, 1.1, sstep((pu - 2.9) / 0.2) * k);
    const shrug = win(pu, 3.0, 3.3, 4.2, 4.5);
    go({ shN: 20, elN: -60, hwN: 20, shF: -10, elF: -60, head: -4, chest: -2 }, shrug * k);
    add({ lift: 0.012 * shrug }, k);
    say('shrug', shrug * k);
  }
  if (k > 0.001 && piece === 'stretch') {
    setDown(0.2, 5.4);
    // a sprinter's lunge stretch, deep
    const lunge = win(pu, 1.0, 1.5, 2.6, 3.0);
    go({ lift: -0.1, tilt: 10, fxN: 0.55, fyN: 0, fxF: -0.5, toeF: -20, shN: -40, elN: -20, shF: -20, elF: -30, head: -4 }, lunge * k);
    say('strain', lunge * k);
    // on your marks: crouched, ready... nothing happens
    const mark = win(pu, 3.0, 3.4, 4.4, 4.7);
    go({ lift: -0.12, tilt: 26, chest: 8, head: -14, fxN: 0.2, fxF: -0.45, toeF: -30, shN: -10, elN: -40, shF: 20, elF: -40 }, mark * k);
    q.skirt -= 0.3 * mark * k;
    say('ready', mark * k);
    const sheep = win(pu, 4.5, 4.8, 5.2, 5.5);
    go({ shF: -60, elF: -120, head: 6 }, sheep * k);
    say('sheepish', win(pu, 4.6, 4.8, 6.2, 6.6) * k);
  }

  if (fighting && alive && !st.stHunt) st.stBangAt = now;
  if (!fighting && st.stHunt && alive) st.stLostAt = now;
  st.stHunt = fighting && alive;
  q.bang = now - (st.stBangAt ?? -9);
  q.huh = now - (st.stLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: leaning in on its toes, toast in its mouth -----
  // (the lean eases off as a move takes over, never dropping out in one frame)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) go({ tilt: 10, head: -4, lift: 0.01, toeN: 8, toeF: 8, shN: -20, elN: -30, shF: 10, elF: -60 }, huntW * (1 - walking * 0.4));
  if (fighting && alive && !hurt) {
    q.toastMouth = Math.max(q.toastMouth, 1);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.tieSkew = 1.2;
    q.sweat = (t * 0.6) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'dash') {
      // toast in its mouth, crouched to sprint
      go({ lift: -0.1, tilt: 24, chest: 6, head: -12, x: -0.04, fxN: 0.15, fxF: -0.35, toeF: -24, shN: 20, elN: -60, shF: -30, elF: -60 }, wu);
      q.toastMouth = 1;
      q.skirt -= 0.3 * wu;
      say('ready', W);
      // then it dashes at you and bumps; a skid back
      if (s >= 0) {
        const out1 = sstep(s / 0.18);
        const back = sstep((s - 0.45) / 0.4);
        const xx = 0.66 * out1 * (1 - back);
        const rp = s * 26;
        // (its legs and arms pump only on the way in; the way back is a skid on both feet, never a run backward)
        const run = Math.sin(rp) * (1 - back);
        go({ x: xx, tilt: 22 * (1 - back), head: -8, shN: -10 + run * 50, elN: -80, shF: 10 - run * 50, elF: -80, fxN: xx * toLeg + run * 0.2, fxF: xx * toLeg - run * 0.2, fyN: Math.max(0, run) * 0.25, fyF: Math.max(0, -run) * 0.25 }, sw);
        add({ hop: Math.abs(run) * 0.02 }, sw);
        q.skirt -= 0.8 * (1 - back) * sw;
        q.toastMouth = 1;
        q.speed = win(s, 0, 0.04, 0.3, 0.45) * sw;
        q.dashS = s;
        say(s < 0.3 ? 'fierce' : 'shout', sw);
      }
    } else if (mvName === 'case') {
      // the briefcase swung back round behind it
      go({ shN: 80, elN: -30, tilt: -10, chest: -6, head: -4, x: -0.03, shF: -40, elF: -40 }, wu);
      q.caseAng = mix(q.caseAng, 1.2, wu);
      say('ready', W);
      // then brought round at you: WHUMP
      if (s >= 0) {
        go({ shN: -96, elN: -4, tilt: 16, chest: 6, head: 2, x: 0.07, shF: 30, elF: -30 }, sw);
        q.caseAng = mix(q.caseAng, -1.4, snap * sw);
        q.swing = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else {
      // a low turn of its hips, its long tail cocked up behind
      go({ tilt: -6, pelvis: 10, waist: -6, lift: -0.06, head: -6, shN: -30, elN: -50, shF: -20, elF: -50 }, wu);
      q.tailRot += 0.8 * wu;
      q.tailCurl += 0.5 * wu;
      say('ready', W);
      // then whipped round low across your ankles: the tail sweeps down and forward under it
      if (s >= 0) {
        const whip = sstep(s / 0.12);
        q.tailRot += (0.8 - 1.3 * whip) * sw; // (low across the ankles, its tip kept off the floor)
        q.tailCurl += (0.5 - 0.9 * whip) * sw;
        go({ tilt: 8, pelvis: -12, waist: 6, lift: -0.05, head: -4, x: 0.04 }, sw);
        q.whipS = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    }
  }
  // ----- Hurt: a wince, its tie flying up -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -20, elN: -60, shF: -40, elF: -100, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.tieSkew += 1.2 * kh;
    q.skirt += 0.3 * kh;
  }
  // ----- After landing a hit: "sorry, sorry!", a quick bow -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.9, 1.2) * (1 - moveW);
    const bob = Math.max(0, Math.sin(gl * 12));
    go({ tilt: 10 + bob * 10, head: 10 + bob * 6, chest: 4, shF: -60, elF: -110 }, kg);
    say('sorry', kg);
    if (kg > 0.3) q.sorryS = gl;
  }
  // ----- A nap (its habitat): asleep standing, chin on its chest, the briefcase hugged -----
  st.stNap = mix(st.stNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.stNap);
  if (nw > 0.001) {
    go({ head: 20 + Math.sin(now * 1.3) * 3, neckR: 6, chest: 4, tilt: 2, shN: 0, elN: -110, hwN: -30, shF: -20, elF: -110 }, nw);
    q.caseAng = mix(q.caseAng, -0.6, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
      q.toastMouth = 0;
    }
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.tieSkew = 1.4;
    q.toastMouth = 0;
  }
  if (q.face === 'fierce' && q.toastMouth < 0.5) q.face = 'ready';
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.stFace) {
    st.stFaceFrom = st.stFace;
    st.stFace = f;
    st.stFaceAt = now;
  }
  const since0 = now - (st.stFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.stFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.stFaceFrom) && !(talky(f) && talky(st.stFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.53) % 3.9;
  if (bl < 0.11 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['tieSkew', 'caseDown', 'caseAng', 'toastMouth', 'skirt', 'tailRot', 'tailCurl']) {
    const rate = key === 'caseAng' ? 14 : key === 'toastMouth' ? 16 : key.startsWith('tail') ? 9 : 10;
    st[`st_${key}`] = mix(st[`st_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`st_${key}`];
  }
  q.calm = cw;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little train-ticket stub (a cream stub, a punched notch, a navy stripe).
function stub(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  ctx.rotate(-0.1);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.6, -4.2], [5.6, -4.4], [5.8, -1.2], [4.8, 0], [5.8, 1.2], [5.6, 4.2], [-5.6, 4.4]]);
    if (pass === 'line') {
      pen(ctx, TROU[2], 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff8e8';
      ctx.fill();
    }
  }
  ctx.fillStyle = TROU[1];
  ctx.fillRect(-5, -3.6, 1.4, 7.2);
  ctx.strokeStyle = mark === '!' ? '#e8604e' : TROU[2];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0.6, -2.4);
    ctx.lineTo(0.6, 0.6);
  } else {
    ctx.moveTo(-0.8, -1.6);
    ctx.quadraticCurveTo(-0.5, -3, 1, -2.9);
    ctx.quadraticCurveTo(2.5, -2.6, 1.9, -1.1);
    ctx.quadraticCurveTo(0.9, -0.4, 0.8, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0.6 : 0.8, 2.2, 0.75, 0.75);
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
  ctx.strokeStyle = TROU[2];
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f6f8ff';
  ctx.stroke();
  ctx.restore();
}
// A soft toasted crumb.
function crumb(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.85);
  ctx.fillStyle = TOAST[1];
  ctx.fill();
  ell(ctx, x - r * 0.25, y - r * 0.25, r * 0.4, r * 0.32);
  ctx.fillStyle = TOAST[0];
  ctx.fill();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  for (const mode of ['line', 'fill']) skirt(ctx, a, mode, D);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -28]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const handPt = (k) => ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  // its wristwatch
  if ((q.watch ?? 0) > 0.05) {
    const [wx, wy] = ptOf(a, D, 'handN', D.J.wrN);
    ell(ctx, wx, wy, 1.4, 1.4);
    ctx.fillStyle = '#f6dc8a';
    ctx.fill();
    ell(ctx, wx, wy, 0.95, 0.95);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  // the toast in its paw
  if (q.toastHand) {
    const [hx, hy] = handPt('N');
    ctx.save();
    ctx.translate(hx + 1, hy - 3);
    ctx.rotate(-0.3);
    toastShape(ctx, a, 0.95, 0.3);
    ctx.restore();
  }
  // crumbs as it bites
  if ((q.crumbs ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [22, 10]);
    for (let i = 0; i < 3; i++) {
      const f = ((t * 1.8 + i / 3) % 1);
      crumb(ctx, mx + i * 1.4 - f * 2, my + f * 14, 0.55, q.crumbs * (1 - f));
    }
  }
  // Late Dash: soft speed streaks behind it, then a bump of soft gold stars
  if ((q.speed ?? 0) > 0.05) {
    const [cx, cy] = ptOf(a, D, 'chest', D.J.ribs);
    for (let i = 0; i < 4; i++) {
      const yy = cy - 6 + i * 4;
      const f = (t * 4 + i * 0.3) % 1;
      // (each streak fades in and out of its own loop, so its wrap back is never seen)
      streak(ctx, cx - 26 - f * 4, yy, cx - 8 - f * 4, yy, 1.1, q.speed * 0.9 * Math.sin(Math.PI * f), '#fff6e6');
    }
  }
  if ((q.dashS ?? -1) >= 0.12 && q.dashS < 0.7) {
    const u = (q.dashS - 0.12) / 0.58;
    const [hx, hy] = headAt(a, D, [28, 2]);
    for (let i = 0; i < 4; i++) {
      const an = -Math.PI * 0.75 + (i / 3) * Math.PI * 0.9;
      star(ctx, hx + Math.cos(an) * (3 + u * 9), hy + Math.sin(an) * (3 + u * 7), 1.3 * (1 - u), an + u * 4, 1 - u);
    }
    sparkle(ctx, hx + 2, hy, 3 * Math.sin(Math.PI * clamp(u * 2, 0, 1)), 1, '#fff2c0');
  }
  // Briefcase Swing: a soft arc and a puff where it lands
  if ((q.swing ?? -1) >= 0 && q.swing < 0.6) {
    const u = q.swing / 0.6;
    const [cx, cy] = ptOf(a, D, 'chest', D.J.ribs);
    ctx.save();
    ctx.globalAlpha *= (1 - sstep((u - 0.2) / 0.5)) * 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 1.8, 1.8 - 2.2 * sstep(u * 3), true);
    pen(ctx, '#fff4e0', 2.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 17, 1.7, 1.7 - 2.1 * sstep(u * 3), true);
    pen(ctx, CASE[1], 0.8);
    ctx.stroke();
    ctx.restore();
    dust(ctx, cx + 18, cy - 4, 2 + u * 3, (1 - u) * 0.8, '#fff6ec', '#e8dccc');
  }
  // Tail Whip: a soft low swish across the floor ahead
  if ((q.whipS ?? -1) >= 0 && q.whipS < 0.6) {
    const u = q.whipS / 0.6;
    ctx.save();
    ctx.globalAlpha *= (1 - sstep((u - 0.25) / 0.5)) * 0.85;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(4, -3, 20, 5, 0, Math.PI * 0.9, Math.PI * 0.9 - Math.PI * 1.1 * sstep(u * 2.5), true);
    pen(ctx, '#fff4ec', 2.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(4, -3, 20, 5, 0, Math.PI * 0.88, Math.PI * 0.88 - Math.PI * 1.06 * sstep(u * 2.5), true);
    pen(ctx, FUR[1], 0.8);
    ctx.stroke();
    ctx.restore();
    sparkle(ctx, 22, -3, 2 * Math.sin(Math.PI * u), 1, '#fff2d8');
  }
  // "sorry, sorry!": a little sweat-bead of embarrassment and a soft sparkle
  if ((q.sorryS ?? -1) >= 0 && q.sorryS < 1.1) {
    const [hx, hy] = headAt(a, D, [-14, -10]);
    sweat(ctx, hx, hy + q.sorryS * 2, 0.9, Math.sin(Math.PI * clamp(q.sorryS / 1.1, 0, 1)));
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-14, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [10, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [6, -32]);
  if (q.bang >= 0 && q.bang < 1.1) stub(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) stub(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'toastdashstoat',
  // (the skin is its trench coat and sleeves; its trousers the legs' own skin; fur paws, feet and neck)
  skin: {
    lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: TROU[0], base: TROU[1], sh: TROU[2], deep: TROU[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: '#5a3420' },
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
    // (the briefcase hangs from its paw: the paw drawn over its handle)
    handNskin: (ctx, a, mode, S, D) => briefcase(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => coat(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('stoat', DRESS);
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
export const TOAST_DASH_STOAT_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const TOAST_DASH_STOAT_SIZE = { w: 26, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
