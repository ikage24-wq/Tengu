// The Steam Capybara (2026-11-26, the Wraith remade from scratch as a new creature; the id stays `shade`). A
// round, unbothered capybara who lives wherever warm water meets dark rock: in the Crystal Cave it floats
// over the warm underground lake and round the Shade Spires; on Serpent Springs it drifts up the steaming
// terraces and the Steam Heights. It never touches the ground: it sits in its own little bath-cloud of
// steam, an onsen towel folded on its head with a yuzu on top, as capybaras do in a hot spring. On its own
// copy of the creature base (rig.js; body.js `capybara`: a round barrel of a body, short legs tucked under
// it on its cloud, short arms), dressed here; its head, towel and cloud drawn here from scratch over the
// mannequin (never the shared face).
//   look    warm caramel fur with a paler belly, a big blunt capybara muzzle with a soft dark nose, small
//           round ears high on its head; its own eyes ("dewdrop eyes": round, a deep pool-teal iris
//           with a pale crescent of reflected light across its top and two little bubble glints, a short
//           soft lid line, a rosy lower lid); tiny round brows; a small calm capybara mouth; a white onsen
//           towel with a blue stripe folded on its head, a little yuzu on it; its cloud of steam, soft
//           lilac-white puffs that curl and drift. Its own soft cocoa outline, outer edge only, face bare.
//   floating  it always floats (the game counts a flyer as always moving; its motion goes by its own
//           travel): bobbing gently in its cloud; moving, it leans into it and its cloud trails wisps of
//           steam behind it.
//   idle    a 29 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - soak (7.4 s): it sinks into its cloud like a bath, "ahh", steam curling up, its ears
//             twitching;
//           - splash (6.8 s): it dips both paws into its cloud, splashes warm water on its face, and
//             shakes its head dry, drops flying;
//           - rings (6.6 s): it blows steam rings, watches one drift up, pokes it, and it pops into
//             sparkles; a chuckle;
//           - doze (7.8 s): its eyes grow heavy, it dozes, bubbles drifting up; its cloud thins and it
//             dips, wakes with a start and paddles hard to puff its cloud back up; a relieved sigh.
//   moves   Steam Jet (cheeks puffed, leaning back; then a jet of hot steam puffs at you); Towel Snap
//           (the towel flicked off its head into its paw and twisted; then snapped out at you with a
//           spray of warm drops); Bubble Burst (a big bubble swelling at its lips; then puffed off at
//           you, popping in a ring of drops and sparkles).
//   else    hurt: a squeezed wince, ears flat; after landing a hit: a smug little bounce in its cloud;
//           hunting you: a determined pout; low on health: worried, a bead of sweat; a nap (habitat):
//           dozing in its cloud; beaten: dizzy, its cloud fading. Its marks over its head (!, ?, z's,
//           sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: steam as soft lilac-white puffs with a pale
// line, warm water as round drops with a soft blue line and a glint, bubbles as round shimmering rings,
// sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, pen, glow, sparkle, sweat, dizzy } from './fx.js';

const BIG = 1.22;
const LW = 1.6 / BIG;
const INK = '#7a5238';
const SKIN = ['#f8e6d0', '#d8ae86', '#b48762', '#88623f'];
const BELLY = ['#fff6ea', '#f0dcc2'];
const NOSE = ['#7a5444', '#5a3c30'];
const YUZU = ['#fff6b0', '#ffd23e', '#e8a420'];
const TOWEL = ['#ffffff', '#f2f0f8', '#d8d4e8'];
const STRIPE = '#6a9ad8';
const STEAM = ['#ffffff', '#f2eefa', '#d6cfe8', '#b8aed4'];
const LASH = '#4a2a48';
const IRIS = ['#123c48', '#1f6a78', '#3ea4ac', '#9ee8e2'];
const WATER = ['#ffffff', '#d6f0ff', '#a6d6f4'];
const WATER_INK = '#5c8ec8';
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
const SOFTNAMES = [];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? (SOFTNAMES.includes(bone) ? bone : null)];
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
// ---------- Its head (head units about the middle of its skull, drawn 1.25x) ----------
const HS = 1.25;
const HO = [1, -16];
const NECK = [80.9, 88.2];
const headK = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const headAt = (a, D, uv) => ptOf(a, D, 'head', headK(uv));
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}

// ---------- Its loose pieces: none (a capybara is a tidy round loaf; its towel rides its head) ----------
const JOINTS = {};
const SOFTS = [];

// ---------- Its face ----------
const FACES = {
  calm: { e: 'open', g: [0.4, 0.4], b: [0, 0], m: 'calm' },
  cozy: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  happy: { e: 'happy', b: [-0.6, -0.8], m: 'open' },
  giggle: { e: 'happy', b: [-0.6, -0.8], m: 'open' },
  smug: { e: 'open', g: [0.8, 0.2], b: [0.4, -0.4], m: 'smile' },
  puff: { e: 'open', g: [1.2, -0.2], b: [-0.6, 1.2], m: 'puff' },
  o: { e: 'open', g: [0.8, -0.6], b: [-0.6, -0.8], m: 'o' },
  up: { e: 'open', g: [0.4, -2.4], b: [-1.0, -1.4], m: 'o' },
  focus: { e: 'open', g: [1.2, 0.6], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.4, 0.4], b: [-0.8, 2], m: 'pout' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
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
const SHUTS = new Set(['cozy', 'happy', 'giggle', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);
function curve3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// One eye (head units): x, y its middle; o +1 near, -1 far.
function eye(ctx, a, x, y, o, f) {
  const w = 4.6;
  const h = 4.9;
  const kind = f.e;
  if (kind === 'happy') {
    curve3(ctx, a, [x - w, y + 1.2], [x, y - h * 1.1], [x + w, y + 1.2], 1.3, LASH);
    return;
  }
  if (kind === 'squeeze') {
    curve3(ctx, a, [x - w * o, y - 1.8], [x + w * 0.2 * o, y - 0.2], [x + w * o, y + 0.4], 1.3, LASH);
    curve3(ctx, a, [x - w * o, y + 2.2], [x + w * 0.1 * o, y + 1.2], [x + w * o, y + 0.5], 1.1, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    curve3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3.2 : 2.6)], [x + w, y], 1.3, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
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
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
    curve3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.25], [x + w, y - h * 0.3], 1.2, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.4, 0.4];
  const ix = x + gx;
  const iy = y + gy + 0.3;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = w * 0.76 * ir;
  const ih = h * 0.8 * ir;
  // a deep pool-teal iris, lighter round its pupil, a pale crescent of reflected light across its top
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.4, iw * 0.84, ih * 0.82);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.35, iw * 0.6, ih * 0.42);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + 0.2, iw * 0.38 * ir, ih * 0.4 * ir);
  ctx.fillStyle = tone(a, '#0a2028');
  ctx.fill();
  ctx.save();
  ell(ctx, ix, iy, iw, ih);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(ix, iy - ih * 0.95, iw * 1.05, ih * 0.62, 0, 0, Math.PI);
  ctx.fillStyle = tone(a, IRIS[3], 0.55);
  ctx.fill();
  ctx.restore();
  // its two little bubble glints, low, and a big round one up high
  ell(ctx, ix - 1.2, iy - 1.6, 1.3 * ir, 1.2 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  for (const [dx, dy, r] of [[1.4, 1.6, 0.75], [0.4, 2.6, 0.45]]) {
    ell(ctx, ix + dx, iy + dy, r, r);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }
  // a short soft lid line over the top, round-ended
  ctx.beginPath();
  ctx.moveTo(x - w * 0.95, y - h * 0.3);
  ctx.quadraticCurveTo(x, y - h * 1.3, x + w * 0.95, y - h * 0.3);
  pen(ctx, tone(a, LASH), 1.3);
  ctx.stroke();
  curve3(ctx, a, [x - w * 0.5 * o, y + h * 0.98], [x + w * 0.2 * o, y + h * 1.06], [x + w * 0.8 * o, y + h * 0.7], 0.55, '#e08aa8');
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.4, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 0.9 + (bo + bi) * 0.35, x + o * 2.4, y + bo * 0.7);
  pen(ctx, tone(a, SKIN[3]), 1.5);
  ctx.stroke();
}
// Its small calm mouth (head units; x its middle).
function mouth(ctx, a, x, y, m) {
  const LIP = '#9a3a6a';
  const stroke = (pts, w = 0.85) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y], [x + w * 0.6, y + h], [x, y + h * 1.15], [x - w * 0.6, y + h]]);
    ctx.fillStyle = tone(a, '#8a2e5a');
    ctx.fill();
    ell(ctx, x, y + h * 0.7, w * 0.5, h * 0.34);
    ctx.fillStyle = tone(a, '#ff9ab8');
    ctx.fill();
  };
  switch (m) {
    case 'smile':
      stroke([[x - 2.6, y - 0.4], [x, y + 1.6], [x + 2.6, y - 0.4]]);
      break;
    case 'open':
      open(4.6, 2.6);
      break;
    case 'o':
      ell(ctx, x + 1, y + 0.6, 1.2, 1.4);
      ctx.fillStyle = tone(a, '#8a2e5a');
      ctx.fill();
      break;
    case 'puff':
      ell(ctx, x + 1, y + 0.6, 0.9, 0.7);
      ctx.fillStyle = tone(a, '#8a2e5a');
      ctx.fill();
      break;
    case 'shout':
      open(3.6, 3.2);
      break;
    case 'set':
      stroke([[x - 4, y + 0.4], [x, y + 0.8], [x + 4, y + 0.4]]);
      break;
    case 'pout':
      stroke([[x - 3, y + 1], [x, y - 0.2], [x + 3, y + 1]], 0.9);
      break;
    case 'wobble':
      stroke([[x - 3, y + 0.4], [x - 1.5, y - 0.4], [x, y + 0.3], [x + 1.5, y - 0.4], [x + 3, y + 0.4]], 0.75);
      break;
    case 'frown':
      stroke([[x - 3, y + 1], [x, y - 0.2], [x + 3, y + 1]]);
      break;
    case 'sleep':
      ell(ctx, x + 1, y + 0.4, 0.8, 0.6);
      ctx.fillStyle = tone(a, '#8a2e5a');
      ctx.fill();
      break;
    case 'talkA':
      open(2.6, 2.2);
      break;
    case 'talkE':
      open(3.6, 1.2);
      break;
    default:
      // at rest: a capybara's small calm 'w', perfectly unbothered
      stroke([[x - 2.2, y - 0.2], [x - 1.1, y + 0.9], [x, y + 0.2], [x + 1.1, y + 0.9], [x + 2.2, y - 0.2]], 0.75);
  }
}
// The skull: wide and round, a little flatter on top (head units).
const SKULL = [[-20, -2], [-18.4, -11], [-12, -16.6], [-2, -18.6], [8, -17.4], [16, -13.6], [21, -9], [25.4, -4], [27.4, 2], [27, 8], [23, 12.4], [14, 15.4], [2, 16.4], [-9, 15.4], [-16, 11]];
// Its small round ears, high on its head (rooted inside its skull; flattening back when it's hurt).
function ears(ctx, a, mode, q) {
  const flat = q.earFlat ?? 0;
  const wig = q.earWig ?? 0;
  for (const [x, y, r, rot] of [[-12, -15.6, 3.4, -0.6], [3, -18, 3.6, -0.2]]) {
    ctx.save();
    ctx.translate(x, y + flat * 2);
    ctx.rotate(rot - flat * 0.6 + wig);
    ell(ctx, 0, -1, r, r * 0.9);
    paint(ctx, a, mode, SKIN[2]);
    if (mode === 'fill') {
      ell(ctx, 0.2, -0.6, r * 0.5, r * 0.44);
      ctx.fillStyle = tone(a, SKIN[3]);
      ctx.fill();
    }
    ctx.restore();
  }
}
// The towel folded on its head (head units, about its middle): white, a blue stripe, a soft fold.
function towel(ctx, a, mode) {
  smooth(ctx, [[-12, -2.6], [-11, -4.4], [0, -5.2], [11, -4.6], [12.4, -2.4], [12, 2.4], [0, 3], [-11.6, 2.4]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, '#9a94b8');
  ctx.fillStyle = tone(a, TOWEL[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, STRIPE);
  ctx.fillRect(-13, 0, 26, 1.1);
  ctx.fillStyle = tone(a, TOWEL[0]);
  ctx.fillRect(-13, -4.6, 26, 1.6);
  ctx.beginPath();
  ctx.moveTo(-4, -4.6);
  ctx.quadraticCurveTo(-3, -1, -4.2, 2.6);
  pen(ctx, tone(a, TOWEL[2]), 0.6);
  ctx.stroke();
  ctx.restore();
  // the little yuzu sat on top
  ell(ctx, 3, -8.4, 3.8, 3.4);
  ctx.fillStyle = tone(a, YUZU[1]);
  ctx.fill();
  pen(ctx, tone(a, YUZU[2]), 0.6);
  ctx.stroke();
  ell(ctx, 1.8, -9.6, 1.4, 0.9);
  ctx.fillStyle = tone(a, YUZU[0]);
  ctx.fill();
  ell(ctx, 3.6, -11.6, 1.4, 0.7, -0.5);
  ctx.fillStyle = tone(a, '#7cc05a');
  ctx.fill();
}
function head(ctx, a, mode, D) {
  const q = a.sx ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ears(ctx, a, mode, q);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -6, -12, 16, SKIN[0], 0.85);
    glow(ctx, -18, 8, 10, SKIN[2], 0.55);
    ctx.restore();
    for (const [cx, k] of [[-11, 0.75], [10, 1]]) {
      ell(ctx, cx, 4.4, 3.2, 1.9);
      ctx.fillStyle = tone(a, '#ff8eb0', 0.45 * k);
      ctx.fill();
    }
    // (puffed cheeks)
    if ((q.puffCheek ?? 0) > 0.05) for (const cx of [-10, 12]) {
      ell(ctx, cx, 6, 4.4 * q.puffCheek, 3.6 * q.puffCheek);
      ctx.fillStyle = tone(a, SKIN[0], 0.9);
      ctx.fill();
    }
    // the big blunt muzzle, paler, its soft dark nose on top
    smooth(ctx, [[6, 2], [12, -2], [20, -2.4], [26, 0.6], [27.6, 6], [25, 11.4], [17, 13.6], [9, 12], [5.4, 7]]);
    ctx.fillStyle = tone(a, BELLY[1]);
    ctx.fill();
    glow(ctx, 16, 3, 7, BELLY[0], 0.85);
    smooth(ctx, [[20, -0.6], [24.6, -0.8], [26.4, 2], [24.4, 3.6], [20.6, 3]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 22.4, 0.2, 1.2, 0.5, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    eye(ctx, a, -6, -3.8, -1, f);
    eye(ctx, a, 8.6, -4.6, 1, f);
    brow(ctx, a, -6.2, -10.6, -1, f.b);
    brow(ctx, a, 8.8, -11.4, 1, f.b);
    mouth(ctx, a, 19, 8.6, f.m);
  }
  ctx.restore();
}
// Its towel: on its head, or flicked off into its near hand (blended between).
function towelOn(ctx, a, mode, D) {
  const q = a.sx ?? {};
  const off = sstep(q.towelOff ?? 0);
  const Mh = mulM(a.blMat('head'), headLocal(D, [-1, -17.6]));
  let M = Mh;
  if (off > 0.001) {
    const Mhand = a.blMat('handN');
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    const k = Math.hypot(Mhand[0], Mhand[1]) * HS * D.SC;
    const tw = q.twist ?? 0;
    const c = Math.cos(tw) * k;
    const s = Math.sin(tw) * k;
    M = Mh.map((v, i) => mix(v, [c, s, -s, c, hx + 2, hy - 2][i], off));
  }
  ctx.save();
  ctx.transform(...M);
  towel(ctx, a, mode);
  ctx.restore();
}
function headLocal(D, [u, v]) {
  const n = D.J.neck;
  const p = D.J[D.PIV.head];
  const sc = D.SC;
  return [HS * sc, 0, 0, HS * sc, (n[0] - p[0] + (HO[0] + u) * HS) * sc, (n[1] - p[1] + (HO[1] + v) * HS) * sc];
}
const mulM = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];

// ---------- Its body ----------
function belly(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, 'waistB');
  smooth(ctx, [[82, 104], [92, 104], [98, 112], [98.4, 121], [92, 126.6], [84, 126.6], [80, 118]]);
  ctx.fillStyle = tone(a, BELLY[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 92, 112, 8, BELLY[0], 0.9);
  ctx.restore();
  ctx.restore();
}
// Its cloud of steam: soft lilac-white puffs round where it sits (back half under it, front half over
// its tucked legs). `k` its fullness (it thins when the capybara dozes off), `bath` how far it's sunk in.
function steamCloud(ctx, a, D, front, q) {
  const t = a.now ?? 0;
  const k = q.cloud ?? 1;
  const [hx, hy] = ptOf(a, D, 'torso', [80, 128]);
  const bath = q.bath ?? 0;
  const list = front
    ? [[-9, 3, 5.2], [-2, 4.4, 6.2], [6, 3.6, 5.4], [11.6, 1.6, 4]]
    : [[-13, -1, 5], [-6, -3.4 - bath * 4, 6], [3, -4 - bath * 4.4, 6.4], [11, -1.6 - bath * 3, 5]];
  for (const pass of ['line', 'fill']) {
    list.forEach(([dx, dy, r], i) => {
      const rr = r * k * (1 + Math.sin(t * 1.4 + i * 1.7) * 0.06) * (front ? 1 + bath * 0.25 : 1);
      if (rr < 0.4) return;
      const x = hx + dx * k;
      const y = hy + dy + Math.sin(t * 1.1 + i) * 0.5;
      ell(ctx, x, y, rr, rr * 0.82);
      if (pass === 'line') {
        pen(ctx, tone(a, STEAM[3]), 0.9);
        ctx.stroke();
      } else {
        ctx.fillStyle = tone(a, front ? STEAM[1] : STEAM[2]);
        ctx.fill();
        ell(ctx, x - rr * 0.22, y - rr * 0.26, rr * 0.55, rr * 0.4);
        ctx.fillStyle = tone(a, STEAM[0]);
        ctx.fill();
      }
    });
  }
}

// ---------- Its act and fight ----------
const PIECES = { soak: 7.4, splash: 6.8, rings: 6.6, doze: 7.8 };
const ORDER = ['soak', 'splash', 'rings', 'doze'];
const POOL = ['jet', 'snap', 'bubble'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, earWig: 0, earFlat: 0, gill: 0, gillOpen: 0, tail0: 0, tail1: 0, tail2: 0, cloud: 1, bath: 0, towelOff: 0, twist: 0, puffCheek: 0, curls: 0.2, rings: -1, ringPop: -1, splash: -1, shake: 0, bubbles: 0, paddle: 0, zz: 0, sweat: -1, jet: -1, snap: -1, bubble: null, trail: 0 };
  a.sx = q;
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
  // (floating: by its own travel, as a flyer always counts as moving)
  if (dt > 0) {
    const vx = st.sxX == null ? 0 : (m.x - st.sxX) / dt;
    st.sxV = mix(st.sxV ?? 0, Math.min(140, Math.abs(vx)), Math.min(1, dt * 5));
  }
  st.sxX = m.x;
  const fly = alive ? sstep(((st.sxV ?? 0) - 6) / 30) : 0;
  // Sat in its cloud, bobbing: legs tucked under it, little hands resting on the cloud's edge.
  const bob = Math.sin(t * 1.5);
  go({ x: 0, hop: 0.16 + bob * 0.012, lift: 0, tilt: Math.sin(t * 0.8) * 1.4, head: Math.sin(t * 0.7 + 1) * 2.4, fxN: 0.3, fyN: 0.34, fxF: 0.22, fyF: 0.3, toeN: -6, toeF: -6, shN: -20, elN: -30, hwN: 10, shF: -12, elF: -30, hwF: 10 }, 1);
  // Floating along: leaning into it, gills and tail streaming back, wisps trailing off its cloud.
  go({ tilt: 10, head: -5 }, fly);
  q.gill = 0.2 * fly + Math.sin(t * 1.1) * 0.06;
  q.tail0 = 0.45 + 0.15 * fly + Math.sin(t * 1.2) * 0.07;
  q.tail1 = 0.12 * fly + Math.sin(t * 1.2 - 0.7) * 0.1;
  q.tail2 = 0.2 + Math.sin(t * 1.2 - 1.4) * 0.14;
  q.trail = fly;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.sxWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.sxAtk) {
      const pool = m.def.moves ?? POOL;
      st.sxN = (st.sxN ?? m.uid ?? 0) + 1;
      st.sxMove = m.move ?? pool[st.sxN % pool.length];
    }
    st.sxAtk = true;
  } else st.sxAtk = false;
  const mvName = st.sxAtk ? st.sxMove : null;
  const hadWind = now - (st.sxWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.4 ? sstep(since / 0.4) : 1;
      s = since - 0.4;
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
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && fly < 0.05 && alive ? 1 : 0;
  st.sxCalm = mix(st.sxCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.sxCalm);
  let PC = st.sxPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.sxOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.sxOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.sxOrd = (st.sxOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.sxPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'soak') {
    // sunk into its cloud like a bath, "ahh", its gills fanning slowly
    const soak = win(pu, 0.2, 1.2, 6.2, 7.0);
    q.bath = Math.max(q.bath, soak * k);
    go({ hop: 0.1, tilt: -6, head: -10, shN: -6, elN: -20, shF: -2, elF: -20 }, soak * k);
    say('cozy', win(pu, 0.8, 1.0, 6.4, 6.6) * k);
    q.earWig = Math.sin(pu * 2.2) * 0.25 * win(pu, 2.0, 2.2, 2.8, 3.0) * k;
    q.curls = Math.max(q.curls, soak * k);
  }
  if (k > 0.001 && piece === 'splash') {
    // both hands dipped in its cloud
    const dip = win(pu, 0.2, 0.6, 1.4, 1.7);
    go({ shN: 10, elN: -10, shF: 14, elF: -10, tilt: 12, head: 10 }, dip * k);
    say('o', dip * k);
    // warm water splashed on its face: head bowed down into its hands
    const spl = win(pu, 1.6, 1.85, 2.4, 2.7);
    go({ shN: -110, elN: -100, hwN: -20, shF: -100, elF: -100, hwF: -20, head: 22, tilt: 14 }, spl * k);
    say('shut', spl * k);
    if (pu > 1.8 && pu < 2.6) q.splash = pu - 1.8;
    // a shake of its gills, drops flying
    const sh = win(pu, 2.9, 3.05, 4.0, 4.3);
    add({ head: Math.sin(pu * 28) * 8 * sh, neckR: Math.sin(pu * 28 - 0.5) * 3 * sh }, k);
    q.earWig = Math.sin(pu * 28 - 1) * 0.3 * sh * k;
    q.shake = sh * k;
    say('shut', sh * k);
    say('happy', win(pu, 4.3, 4.5, 6.2, 6.6) * k);
  }
  if (k > 0.001 && piece === 'rings') {
    // steam rings blown up
    const blow = win(pu, 0.3, 0.5, 2.2, 2.4);
    say('o', blow * k);
    go({ head: -8, tilt: -3 }, blow * k);
    if (pu > 0.5 && pu < 3.6) q.rings = pu - 0.5;
    // watching one drift up, poking it: it pops into sparkles
    const look = win(pu, 2.3, 2.5, 3.6, 3.8);
    go({ head: -16, neckR: -4 }, look * k);
    say('up', look * k);
    const poke = win(pu, 3.0, 3.3, 3.6, 4.0);
    go({ shN: -150, elN: -40, hwN: -20 }, poke * k);
    if (pu > 3.4 && pu < 4.4) q.ringPop = pu - 3.4;
    const gig = win(pu, 3.8, 4.0, 5.6, 6.0);
    add({ chest: Math.sin(pu * 20) * 2.4 * gig, head: Math.sin(pu * 20 - 0.6) * 2.6 * gig }, k);
    go({ shN: -60, elN: -110, hwN: -20 }, gig * k);
    say('giggle', gig * k);
  }
  if (k > 0.001 && piece === 'doze') {
    const nod = win(pu, 0.4, 1.2, 4.2, 4.4);
    go({ head: 18 + Math.sin(pu * 1.5) * 3, neckR: 4, hop: 0.12 }, nod * k);
    say('sleep', win(pu, 1.0, 1.1, 4.2, 4.3) * k);
    q.zz = Math.max(q.zz, win(pu, 1.4, 1.8, 4.0, 4.3) * k);
    q.bubbles = Math.max(q.bubbles, win(pu, 1.2, 1.6, 4.0, 4.3) * k);
    // its cloud thins as it sleeps... it dips, wakes, and paddles it back up
    q.cloud = Math.min(q.cloud, 1 - 0.5 * win(pu, 2.6, 4.2, 4.8, 6.0) * k);
    add({ hop: -0.06 * win(pu, 3.8, 4.3, 4.6, 5.2) }, k);
    say('surprised', win(pu, 4.3, 4.35, 4.7, 4.8) * k);
    const pad = win(pu, 4.7, 4.85, 5.9, 6.1);
    add({ shN: Math.sin(pu * 22) * 30 * pad, shF: -Math.sin(pu * 22) * 30 * pad }, k);
    go({ elN: -40, elF: -40 }, pad * k);
    q.paddle = pad * k;
    say('worried', pad * k);
    say('cozy', win(pu, 6.2, 6.4, 7.3, 7.6) * k);
  }

  // (its own marks over its head)
  if (fighting && alive && !st.sxHunt) st.sxBangAt = now;
  if (!fighting && st.sxHunt && alive) st.sxLostAt = now;
  st.sxHunt = fighting && alive;
  q.bang = now - (st.sxBangAt ?? -9);
  q.huh = now - (st.sxLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: a determined pout, gills flared -----
  if (fighting && alive && !hurt) {
    go({ tilt: 6, head: 4, shN: -50, elN: -60, shF: -40, elF: -60 }, 1 - fly * 0.4);
    q.gillOpen = Math.max(q.gillOpen, 0.6);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 0;
    const sm5 = (u) => {
      const v = clamp(u, 0, 1);
      return v * v * v * (v * (v * 6 - 15) + 10);
    };
    const snapT = mvName === 'snap' ? 0.24 : 0.18;
    const snap = s >= 0 ? sm5(s / (hadWind ? snapT : snapT + 0.06)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'jet') {
      // cheeks puffed, gills flared, leaning back; then a jet of steam at you
      go({ tilt: -10, head: -8, chest: -6, shN: 10, elN: -40, shF: 14, elF: -40 }, wu);
      q.puffCheek = Math.max(q.puffCheek, wu);
      q.gillOpen = Math.max(q.gillOpen, wu);
      say('puff', W);
      go({ tilt: 10, head: 6, chest: 4, x: 0.02 }, snap * sw);
      say('o', snap * sw);
      if (s >= 0 && s < 1.0) q.jet = s;
    } else if (mvName === 'snap') {
      // the towel flicked off its head into its hand and twisted; then snapped out at you
      go({ shN: -120, elN: -60, hwN: -20, tilt: -6, head: -4 }, wu);
      q.towelOff = Math.max(q.towelOff, sstep(W / 0.6));
      q.twist = W * 1.2 * (s >= 0 ? 1 - sstep(s / 0.35) : 1);
      say('focus', W);
      go({ shN: -40, elN: -10, tilt: 10, head: 6, x: 0.03 }, snap * sw);
      q.towelOff = Math.max(q.towelOff, s >= 0 ? 1 - sstep((s - 0.35) / 0.6) : 0);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      if (s >= 0 && s < 1.0) q.snap = s;
    } else {
      // a big bubble swelling at its lips; then puffed off at you
      go({ tilt: -6, head: -6, shN: -50, elN: -80, shF: -40, elF: -80 }, wu);
      say('o', W);
      go({ tilt: 6, head: 4 }, snap * sw);
      q.bubble = { W, s };
    }
  }
  // ----- Hurt: a wince, gills clamped shut, its cloud jolted -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -70, elN: -110, shF: -60, elF: -110 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat ?? 0, kh);
  }
  // ----- After landing a hit: a smug little bounce in its cloud -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.28, 0.8, 1.1) * (1 - moveW);
    add({ hop: Math.abs(Math.sin(gl * 8)) * 0.03 * kg }, 1);
    say('smug', kg);
  }
  // ----- A nap (its habitat) -----
  st.sxNap = mix(st.sxNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.sxNap);
  if (nw > 0.001) {
    go({ head: 18 + Math.sin(now * 1.4) * 3, neckR: 4, hop: 0.12 }, nw);
    q.bath = Math.max(q.bath, 0.6 * nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
      q.bubbles = nw;
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
    q.cloud = 0.6;
  }
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.sxFace) {
    st.sxFaceFrom = st.sxFace;
    st.sxFace = f;
    st.sxFaceAt = now;
  }
  const since0 = now - (st.sxFaceAt ?? -9);
  if (since0 >= 0 && since0 < 0.07 && st.sxFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.sxFaceFrom)) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.59) % 4.3;
  if (bl < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  for (const key of ['earWig', 'earFlat', 'cloud', 'bath', 'towelOff', 'twist', 'puffCheek']) {
    st[`sx_${key}`] = mix(st[`sx_${key}`] ?? q[key], q[key], ease(key === 'towelOff' ? (q[key] > (st[`sx_${key}`] ?? 0) ? 14 : 5) : 10));
    q[key] = st[`sx_${key}`];
  }
}

// ---------- Live effects (rig space, game px, the point it floats over at 0, 0) ----------
function puff(ctx, x, y, r, al, pass) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.88);
  if (pass === 'line') {
    ctx.lineWidth = Math.max(0.4, r * 0.3);
    ctx.strokeStyle = STEAM[3];
    ctx.stroke();
  } else {
    ctx.fillStyle = STEAM[1];
    ctx.fill();
    ell(ctx, x - r * 0.2, y - r * 0.22, r * 0.56, r * 0.46);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
function cloud(ctx, list) {
  for (const pass of ['line', 'fill']) for (const [x, y, r, al] of list) puff(ctx, x, y, r, al, pass);
}
function bead(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.lineWidth = Math.max(0.3, r * 0.45);
  ctx.strokeStyle = WATER_INK;
  ctx.stroke();
  ctx.fillStyle = WATER[2];
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.35);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A round shimmering bubble: a soft rim catching teal and pink, a glint.
function soapBubble(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(214,246,250,0.35)';
  ctx.fill();
  ctx.lineWidth = Math.max(0.4, r * 0.14);
  ctx.strokeStyle = '#8edce0';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.86, Math.PI * 0.15, Math.PI * 0.6);
  ctx.strokeStyle = '#ffb8d4';
  ctx.lineWidth = Math.max(0.3, r * 0.1);
  ctx.stroke();
  ell(ctx, x - r * 0.38, y - r * 0.38, r * 0.24, r * 0.16, -0.6);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function steamRing(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.34);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = STEAM[3];
  ctx.stroke();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
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
  ctx.strokeStyle = '#8a6a54';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fff4fa';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#5a9ab8';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
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

// Under everything: its tail, the back half of its cloud, and wisps of steam trailing as it floats.
function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  const q = a.sx ?? {};
  if ((q.trail ?? 0) > 0.05 && m.hp > 0) {
    const t = (a.now ?? 0) + (m.uid ?? 0) * 0.3;
    const L = [];
    for (let i = 0; i < 4; i++) {
      const f = (t * 1.4 + i / 4) % 1;
      L.push([-10 - f * 16, -3 - (i % 2) * 2 - f * 3, 1.6 * (1 - f * 0.5), q.trail * (1 - f) * 0.8]);
    }
    cloud(ctx, L);
  }
  steamCloud(ctx, a, D, false, q);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.sx ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -28]);
    dizzy(ctx, hx, hy, 6, a.now ?? 0, 3);
    return;
  }
  const [mx, my] = headAt(a, D, [4, 9]);
  // steam curling up off its cloud (more as it soaks)
  {
    const [hx, hy] = ptOf(a, D, 'torso', [80, 124]);
    const L = [];
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.4 + i / 3) % 1;
      L.push([hx - 8 + i * 8 + Math.sin(f * 5 + i) * 2, hy - 6 - f * 20, 0.9 + f * 1.4, (q.curls ?? 0.2) * Math.sin(Math.PI * f) * 0.8]);
    }
    cloud(ctx, L);
  }
  // splashing its face, shaking its gills dry
  if ((q.splash ?? -1) >= 0) {
    for (let i = 0; i < 5; i++) {
      const u = clamp(q.splash / 0.7 - i * 0.05, 0, 1);
      const an = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
      bead(ctx, mx + Math.cos(an) * (4 + u * 8), my - 4 + Math.sin(an) * (4 + u * 6) + u * u * 6, 0.55, 1 - u);
    }
  }
  if ((q.shake ?? 0) > 0.1) {
    const [hx, hy] = headAt(a, D, [0, -4]);
    for (let i = 0; i < 5; i++) {
      const f = (t * 2.4 + i / 5) % 1;
      const an = -Math.PI * 0.95 + (i / 4) * Math.PI * 0.9;
      bead(ctx, hx + Math.cos(an) * (8 + f * 9), hy + Math.sin(an) * (6 + f * 6) + f * f * 6, 0.5, q.shake * (1 - f));
    }
  }
  // steam rings blown up; one popped into sparkles
  if ((q.rings ?? -1) >= 0) {
    for (let i = 0; i < 2; i++) {
      const f = clamp((q.rings - i * 0.8) / 2.4, 0, 1);
      if (f <= 0 || f >= 1) continue;
      if (i === 0 && (q.ringPop ?? -1) >= 0) continue;
      steamRing(ctx, mx + 3 + f * 4, my - 4 - f * 20, 1.2 + f * 2.6, Math.sin(Math.PI * f));
    }
  }
  if ((q.ringPop ?? -1) >= 0 && q.ringPop < 1.0) {
    const [px, py] = ptOf(a, D, 'handN', D.J.handN);
    const e = q.ringPop;
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + 0.4;
      sparkle(ctx, px + Math.cos(an) * (2 + e * 6), py - 4 + Math.sin(an) * (2 + e * 5), 1.4 * Math.sin(Math.PI * e), 1, i % 2 ? '#fff6c8' : '#ffffff');
    }
  }
  // dozing: little bubbles drifting up off its lips
  if ((q.bubbles ?? 0) > 0.05) {
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.6 + i * 0.5) % 1;
      soapBubble(ctx, mx + 4 + f * 3, my - 2 - f * 10, 0.6 + f * 0.8, q.bubbles * Math.sin(Math.PI * f));
    }
  }
  // paddling its cloud back up: puffs kicked up round its hands
  if ((q.paddle ?? 0) > 0.05) {
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    cloud(ctx, [0, 1, 2].map((i) => [hx - 2 + i * 3 + Math.sin(t * 20 + i) * 1.5, hy + 2, 1.4, q.paddle * 0.8]));
  }
  // ----- Steam Jet: a jet of round steam puffs at you, hot drops in it -----
  if ((q.jet ?? -1) >= 0 && q.jet < 1.0) {
    const s = q.jet;
    const flow = s < 0.5 ? 1 : 1 - sstep((s - 0.5) / 0.4);
    const L = [];
    for (let i = 0; i < 9; i++) {
      const u = (s * 2.2 + i / 9) % 1;
      if (u > s * 2.2) continue;
      L.push([mx + 3 + u * 30, my + Math.sin(u * 6 + i) * 1.6 + u * 3, 1 + u * 2.2, flow * (1 - u * 0.7)]);
    }
    cloud(ctx, L);
    for (let i = 0; i < 3; i++) {
      const u = (s * 2 + i / 3) % 1;
      bead(ctx, mx + 6 + u * 26, my + 2 + u * 4, 0.5, flow * (1 - u));
    }
  }
  // ----- Towel Snap: a soft white snap arc and a spray of warm drops -----
  if ((q.snap ?? -1) >= 0 && q.snap < 0.9) {
    const s = q.snap;
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    const u = clamp(s / 0.35, 0, 1);
    if (u < 1) {
      ctx.save();
      ctx.globalAlpha *= 1 - u;
      ctx.lineCap = 'round';
      for (const [col, w] of [['#c8c0dc', 2.6], ['#ffffff', 1.2]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.arc(hx, hy, 10 + u * 6, -1.2 + u * 0.6, 0.2 + u * 0.8);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (let i = 0; i < 6; i++) {
      const v = clamp((s - i * 0.03) / 0.7, 0, 1);
      bead(ctx, hx + 6 + v * (16 + (i % 3) * 5), hy - 4 + (i % 2) * 3 - Math.sin(Math.PI * v) * 5 + v * v * 10, 0.6, 1 - sstep((v - 0.75) / 0.25));
    }
  }
  // ----- Bubble Burst: the bubble swelling at its lips, puffed off at you, popping -----
  if (q.bubble) {
    const { W, s } = q.bubble;
    if (s < 0) soapBubble(ctx, mx + 3 + W * 2, my, 1 + W * 4, 1);
    else if (s < 1.0) {
      const u = clamp(s / 0.55, 0, 1);
      if (u < 1) soapBubble(ctx, mx + 5 + u * 28, my - 2 - Math.sin(Math.PI * u) * 4, 5, 1);
      else {
        const v = clamp((s - 0.55) / 0.4, 0, 1);
        for (let i = 0; i < 8; i++) {
          const an = (i / 8) * TAU;
          bead(ctx, mx + 33 + Math.cos(an) * (3 + v * 8), my - 2 + Math.sin(an) * (3 + v * 8) + v * v * 5, 0.55, 1 - v);
        }
        sparkle(ctx, mx + 33, my - 2, 3 * Math.sin(Math.PI * v), 1, '#ffffff');
      }
    }
  }
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    const [hx, hy] = ptOf(a, D, 'torso', [80, 126]);
    cloud(ctx, [-1, 1].map((d) => [hx + d * (6 + e * 8), hy - 1 - e * 2, 1.6, 1 - e]));
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-20, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -26]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [14, -34]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, bx - 4 + e * 4, by + 8 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, '#fff2c8');
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'steamcapybara',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => belly(ctx, a, mode, D),
    // (its tucked legs sit down in the front of its cloud)
    footNskin: (ctx, a, mode, S, D) => {
      if (mode === 'fill') steamCloud(ctx, a, D, true, a.sx ?? {});
    },
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      towelOn(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('capybara', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (it never steps: the game counts a flyer as always moving, so the base is told it isn't, and its
  // floating goes by its own travel)
  const moving0 = a.moving;
  a.moving = false;
  draw0(ctx, m, a);
  a.moving = moving0;
  a.gait = null;
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.35);
rig.h = Math.round(rig.h * BIG * 1.3);
export const STEAM_CAPYBARA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const STEAM_CAPYBARA_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.05) };
