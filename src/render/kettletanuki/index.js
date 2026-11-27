// The Kettle Tanuki (2026-11-26, rebuilt from scratch on the creature base as its own character; the id
// stays `kettletanuki`). The Tea Terraces' own Bunbuku: a tanuki who turned himself into a copper tea
// kettle for a joke and only got halfway back. His head, paws, feet and striped tail poke out of a round
// copper kettle he wears like a barrel, its lid on his head for a hat with a leaf on it, its spout on his
// front. He's very proud of it. On his own copy of the creature base (rig.js; body.js `kettle`), dressed
// here; his head, kettle, lid and tail drawn here from scratch over the mannequin (never the shared face).
//   look    warm tan fur with the tanuki's dark mask and dark legs and arms, a cream muzzle, round ears;
//           his own eyes ("penny eyes": round and bright, a copper iris with a thin coin-ring of light
//           round its pupil, a big round glint, a short lash line with one little flick, a soft lower
//           lid); round brows; the kettle round his middle (worn: his arms come out of its sides, his
//           legs out of its bottom), its spout and bail handle; the lid hat with its knob and a sprung
//           leaf; the striped tail on springs. His own soft cocoa outline, outer edge only, face bare.
//   walk    a short-legged trot at his own pace, the kettle rocking, the lid tapping, the tail swinging.
//   idle    a 29 s act in four pieces, each the next one that fits the time he has (data `rest`):
//           - whistle (6.6 s): steam builds in his spout, the lid rattles, and he whistles like a
//             kettle on the boil, hopping on the spot; a proud grin;
//           - pour (8.0 s): he takes out a little cup, tips forward and pours himself tea from his own
//             spout, blows on it, sips, bliss;
//           - peek (7.6 s): he ducks down into his kettle, the lid settling; his eyes peek out over the
//             rim, darting; then up he pops, "boo!", giggling;
//           - polish (7.0 s): he huffs on his kettle and rubs it with his paw till it gleams, admiring
//             himself in it.
//   moves   Steam Whistle (he leans back, steam building, the lid rattling; then a jet of steam out of
//           his spout at you); Lid Toss (the lid snatched off his head and wound back; then flung like a
//           frisbee, out at you and back again); Belly Bonk (a crouch; then a hop and a bonk with his
//           kettle belly, CLONG).
//   else    hurt: a squeeze, the lid jumping off his head and back; after landing a hit: a smug lid
//           tip; hunting you: brows down, paws up; low on health: worried, sweat; a nap (habitat): sunk
//           down into his kettle, only his ears and the lid showing, z's; beaten: dizzy. His marks over
//           his head are his own (`ownEmotes`).
// Every effect is drawn here, live, in his own soft style: steam as soft white puffs with a pale line,
// tea as round amber drops with a glint, the clong as soft copper arcs, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, pen, glow, sparkle, sweat, dizzy } from './fx.js';

const BIG = 1.3;
const LW = 1.6 / BIG;
const INK = '#6a4430';
const FUR = ['#fbe8d2', '#e0b48a', '#bc8a62', '#8e6244'];
const LIMB = ['#a88a72', '#7c5c48', '#604636', '#48342a'];
const MASK = '#6a4a3a';
const CREAM = ['#fffaf0', '#f6e6d2', '#e2cbb0'];
const COP = ['#ffe6c0', '#f2aa6a', '#c87642', '#924e2a'];
const COP_INK = '#7a3e22';
const LEAF = ['#d6f4b0', '#8cce6a', '#5ea24e'];
const TEA = ['#fff2c8', '#e8b05a', '#b8742c'];
const LASH = '#3e2a24';
const IRIS = ['#5a2a14', '#b0602a', '#e89450', '#ffd8a0'];
const STEAM = ['#ffffff', '#f4f0f8', '#d8d0e4'];
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
const SOFTN = ['tail0', 'tail1', 'leaf'];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? (SOFTN.includes(bone) ? bone : null)];
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
const HS = 1.2;
const HO = [1, -15];
const NECK = [80.9, 88.2];
const headK = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const headAt = (a, D, uv) => ptOf(a, D, 'head', headK([uv[0], uv[1] + sinkOf(a)]));
// (ducked into his kettle, his head sinks down inside its rim)
const sinkOf = (a) => (a.kt?.sink ?? 0) * 13;
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(HO[0], HO[1] + sinkOf(a));
}
const mulM = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];

// ---------- His loose pieces ----------
const TAIL = [[66, 118], [54, 116], [44, 110]];
const LEAF_AT = [2, -27];
const JOINTS = { tail0: TAIL[0], tail1: TAIL[1], leaf: headK(LEAF_AT) };
const SOFTS = [
  { name: 'tail0', parent: 'torso', pivot: 'tail0', rot: (S, a) => a.kt?.tail0 ?? 0, soft: { k: 84, c: 7, gain: 0.4, turn: 0.7, max: 12, dir: [-10, 0] } },
  { name: 'tail1', parent: 'tail0', pivot: 'tail1', rot: (S, a) => a.kt?.tail1 ?? 0, soft: { k: 64, c: 5.8, gain: 0.5, turn: 0.85, max: 20, flutter: 3, hz: 0.6, dir: [-8, -4] } },
  { name: 'leaf', parent: 'head', pivot: 'leaf', soft: { k: 110, c: 5, gain: 0.5, turn: 0.85, max: 22, flutter: 3, hz: 0.8, dir: [1, -6] } },
];

// ---------- His face ----------
const FACES = {
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'calm' },
  grin: { e: 'open', g: [0.8, 0.2], b: [-0.6, -0.6], m: 'grin' },
  happy: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  bliss: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  giggle: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  smug: { e: 'open', g: [1.2, 0.2], b: [0.4, -0.4], m: 'grin' },
  whistle: { e: 'happy', b: [-0.6, -0.8], m: 'o' },
  peekL: { e: 'open', g: [-2, 0.6], b: [-0.4, -0.6], m: 'calm' },
  peekR: { e: 'open', g: [2, 0.6], b: [-0.4, -0.6], m: 'calm' },
  focus: { e: 'open', g: [1.4, 0.6], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.4, 0.4], b: [-1, 2.2], m: 'set' },
  puff: { e: 'open', g: [1.2, -0.2], b: [-0.6, 1.2], m: 'puff' },
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
const SHUTS = new Set(['happy', 'bliss', 'giggle', 'whistle', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);
function curve3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
function eye(ctx, a, x, y, o, f) {
  const w = 4.5;
  const h = 4.8;
  const kind = f.e;
  if (kind === 'happy') {
    curve3(ctx, a, [x - w, y + 1.2], [x, y - h * 1.1], [x + w, y + 1.2], 1.4, LASH);
    return;
  }
  if (kind === 'squeeze') {
    curve3(ctx, a, [x - w * o, y - 1.8], [x + w * 0.2 * o, y - 0.2], [x + w * o, y + 0.4], 1.4, LASH);
    curve3(ctx, a, [x - w * o, y + 2.2], [x + w * 0.1 * o, y + 1.2], [x + w * o, y + 0.5], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    curve3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3.2 : 2.6)], [x + w, y], 1.4, LASH);
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
    return;
  }
  const [gx, gy] = f.g ?? [0.6, 0.3];
  const ix = x + gx;
  const iy = y + gy + 0.3;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = w * 0.78 * ir;
  const ih = h * 0.8 * ir;
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.4, iw * 0.84, ih * 0.84);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.4, iw * 0.6, ih * 0.38);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + 0.1, iw * 0.38 * ir, ih * 0.4 * ir);
  ctx.fillStyle = tone(a, '#2a120a');
  ctx.fill();
  // his coin-ring of light round the pupil, and a big round glint
  ell(ctx, ix, iy + 0.1, iw * 0.56 * ir, ih * 0.58 * ir);
  pen(ctx, tone(a, IRIS[3], 0.85), 0.45);
  ctx.stroke();
  ell(ctx, ix - 1.2, iy - 1.6, 1.3 * ir, 1.2 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // a short lash line, one little flick off its outer corner
  ctx.beginPath();
  ctx.moveTo(x - w * 0.95, y - h * 0.3);
  ctx.quadraticCurveTo(x, y - h * 1.28, x + w * 0.95, y - h * 0.3);
  pen(ctx, tone(a, LASH), 1.35);
  ctx.stroke();
  const ox = x + o * w * 0.95;
  curve3(ctx, a, [ox, y - h * 0.35], [ox + o * 0.9, y - h * 0.55], [ox + o * 1.5, y - h * 0.95], 0.85, LASH);
  curve3(ctx, a, [x - w * 0.5 * o, y + h * 0.98], [x + w * 0.2 * o, y + h * 1.06], [x + w * 0.8 * o, y + h * 0.7], 0.55, '#b88a7a');
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.6, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1 + (bo + bi) * 0.35, x + o * 2.6, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1.6);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#6e3a34';
  const stroke = (pts, w = 0.8) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7a2e36');
    ctx.fill();
    ell(ctx, x, y + h * 0.75, w * 0.6, h * 0.36);
    ctx.fillStyle = tone(a, '#ff98a8');
    ctx.fill();
  };
  switch (m) {
    case 'grin':
      stroke([[x - 2.6, y - 0.2], [x - 1, y + 1.6], [x + 0.4, y + 0.4], [x + 1.8, y + 1.6], [x + 3, y - 0.6]]);
      ctx.beginPath();
      ctx.moveTo(x + 1.4, y + 1);
      ctx.lineTo(x + 2.2, y + 1);
      ctx.lineTo(x + 1.8, y + 2.2);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    case 'smile':
      stroke([[x - 2.2, y - 0.2], [x, y + 1.6], [x + 2.4, y - 0.4]]);
      break;
    case 'open':
      open(2.4, 2.4);
      break;
    case 'o':
      ell(ctx, x + 0.6, y + 0.6, 1.0, 1.2);
      ctx.fillStyle = tone(a, '#7a2e36');
      ctx.fill();
      break;
    case 'puff':
      ell(ctx, x + 0.6, y + 0.6, 0.8, 0.6);
      ctx.fillStyle = tone(a, '#7a2e36');
      ctx.fill();
      break;
    case 'shout':
      open(2.8, 3);
      break;
    case 'set':
      stroke([[x - 2, y + 0.5], [x, y - 0.1], [x + 2, y + 0.5]], 0.9);
      break;
    case 'wobble':
      stroke([[x - 2.2, y + 0.4], [x - 1.1, y - 0.4], [x, y + 0.3], [x + 1.1, y - 0.4], [x + 2.2, y + 0.4]], 0.75);
      break;
    case 'frown':
      stroke([[x - 2, y + 0.8], [x, y - 0.2], [x + 2, y + 0.8]]);
      break;
    case 'sleep':
      ell(ctx, x + 0.4, y + 0.4, 0.8, 0.6);
      ctx.fillStyle = tone(a, '#7a2e36');
      ctx.fill();
      break;
    case 'talkA':
      open(1.8, 2);
      break;
    case 'talkE':
      open(2.2, 1.1);
      break;
    default:
      stroke([[x - 2.2, y - 0.2], [x - 1.1, y + 1.0], [x, y + 0.2], [x + 1.1, y + 1.0], [x + 2.2, y - 0.2]], 0.75);
  }
}
// The skull with its cheek ruffs (rounded bumps, never points).
const SKULL = [[-19, -4], [-17, -12], [-11, -17], [-2, -19], [8, -18], [15.4, -13], [19, -5], [21.4, 2], [22, 7], [19, 10.4], [14, 14.6], [4, 16.4], [-6, 15.6], [-14, 12.4], [-20, 8.6], [-21.6, 3]];
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, 0, r, r * 0.92);
  paint(ctx, a, mode, MASK);
  if (mode === 'fill') {
    ell(ctx, 0.3, 0.8, r * 0.58, r * 0.5);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.kt ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -13, -15, 5.6, -0.35);
  ear(ctx, a, mode, 11, -16.4, 5.8, 0.3);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -4, -12, 15, FUR[0], 0.85);
    glow(ctx, -17, 8, 9, FUR[2], 0.55);
    // the tanuki's dark mask round each eye (under the eye, never over it), and the pale blaze between
    for (const [mx, my, rx, ry, r] of [[-6.6, 1.6, 7.6, 5.6, -0.3], [9.2, 1.2, 7.8, 5.6, 0.25]]) {
      ell(ctx, mx, my, rx, ry, r);
      ctx.fillStyle = tone(a, MASK);
      ctx.fill();
    }
    smooth(ctx, [[0.4, -10], [3.6, -10], [4.4, -2], [2, 1], [-0.4, -2]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    ctx.restore();
    eye(ctx, a, -6.2, -0.4, -1, f);
    eye(ctx, a, 9, -0.8, 1, f);
    brow(ctx, a, -6.4, -7.6, -1, f.b);
    brow(ctx, a, 9.2, -8, 1, f.b);
    // the muzzle and its nose
    smooth(ctx, [[2, 7.4], [4.6, 4.2], [9.6, 3.4], [15, 4.6], [17.4, 8.2], [15, 12], [9.4, 13.4], [3.8, 11.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 9, 6, 5, CREAM[0], 0.9);
    smooth(ctx, [[11, 4.6], [13.2, 3.8], [15.6, 4.6], [15.4, 6.4], [13.2, 7.4], [11.2, 6.4]]);
    ctx.fillStyle = tone(a, '#3e2a26');
    ctx.fill();
    ell(ctx, 12.8, 4.6, 0.9, 0.5, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 12.4, 9.4, f.m);
  }
  ctx.restore();
}
// The lid on his head: a copper dome with its knob and a sprung leaf (head units, in the head's frame).
const LID = [[-15, -15], [-13, -20], [-6, -23.6], [2, -24.4], [10, -23.4], [16, -19.6], [17.6, -15], [17.6, -13.6], [-15.4, -13.6]];
function lidShape(ctx, a, mode) {
  smooth(ctx, LID);
  if (mode === 'line') return paint(ctx, a, 'line', null, COP_INK);
  ctx.fillStyle = tone(a, COP[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -6, -21, 10, COP[0], 0.95);
  glow(ctx, 14, -15, 8, COP[3], 0.5);
  ctx.fillStyle = tone(a, COP[2]);
  ctx.fillRect(-18, -15.4, 40, 2);
  ctx.restore();
  ell(ctx, 1.4, -25.6, 2.4, 1.8);
  ctx.fillStyle = tone(a, COP[3]);
  ctx.fill();
  ell(ctx, 0.8, -26.2, 1, 0.6);
  ctx.fillStyle = tone(a, COP[0]);
  ctx.fill();
}
function leafShape(ctx, a, mode) {
  smooth(ctx, [[0, 0], [-3.6, -3.4], [-3.6, -8], [0, -12.6], [4, -9], [4.4, -3.4]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, '#4e8a40');
  ctx.fillStyle = tone(a, LEAF[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -1, -8, 5, LEAF[0], 0.9);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(0.3, -0.6);
  ctx.quadraticCurveTo(0, -6, 0.3, -10);
  pen(ctx, tone(a, LEAF[2]), 0.7);
  ctx.stroke();
}
function lidOn(ctx, a, mode, D) {
  const q = a.kt ?? {};
  const off = sstep(q.lidOff ?? 0);
  const Mh = mulM(a.blMat('head'), headLocal(D, [0, -(q.lidPop ?? 0) * 5 + sinkOf(a)], (q.lidRattle ?? 0)));
  let M = Mh;
  if (off > 0.001) {
    const Mn = a.blMat('handN');
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    const k = Math.hypot(Mn[0], Mn[1]) * HS * D.SC;
    const sp = q.lidSpin ?? 0;
    M = Mh.map((v, i) => mix(v, [k * Math.cos(sp), k * Math.sin(sp), -k * Math.sin(sp), k * Math.cos(sp), hx, hy + 20 * k][i], off));
  }
  ctx.save();
  ctx.transform(...M);
  lidShape(ctx, a, mode);
  // the leaf on its knob (on its spring)
  const d = Math.atan2(a.blMat('leaf')[1], a.blMat('leaf')[0]) - Math.atan2(a.blMat('head')[1], a.blMat('head')[0]);
  ctx.translate(LEAF_AT[0], LEAF_AT[1] + 1);
  ctx.rotate(0.3 + Math.atan2(Math.sin(d), Math.cos(d)));
  leafShape(ctx, a, mode);
  ctx.restore();
}
function headLocal(D, [u, v], rot = 0) {
  const n = D.J.neck;
  const p = D.J[D.PIV.head];
  const sc = D.SC;
  const c = Math.cos(rot) * HS * sc;
  const s = Math.sin(rot) * HS * sc;
  return [c, s, -s, c, (n[0] - p[0] + (HO[0] + u) * HS) * sc, (n[1] - p[1] + (HO[1] + v) * HS) * sc];
}

// ---------- His kettle (kid units, worn round his middle) ----------
// The body of the kettle: a round copper pot from his shoulders to his hips, a rim at the top.
const POT = [[62, 92], [70, 88.4], [80, 87.6], [90, 88.4], [98, 92], [102, 102], [102.6, 112], [99, 122], [90, 127.4], [80, 128.4], [70, 127.4], [61, 122], [58, 112], [58.6, 102]];
function kettle(ctx, a, mode, D) {
  const q = a.kt ?? {};
  ctx.save();
  enter(ctx, a, D, 'waistB');
  // the spout on his front (its root inside the pot)
  smooth(ctx, [[96, 104], [104, 100], [110, 94], [113.4, 91.4], [115, 93.4], [112, 98.6], [105, 108], [98, 112]]);
  if (mode === 'line') paint(ctx, a, 'line', null, COP_INK);
  else {
    ctx.fillStyle = tone(a, COP[2]);
    ctx.fill();
    ell(ctx, 113.6, 92.6, 1.4, 1);
    ctx.fillStyle = tone(a, COP[3]);
    ctx.fill();
  }
  smooth(ctx, POT);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, COP_INK);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, COP[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 70, 100, 16, COP[0], 0.85);
  glow(ctx, 96, 120, 14, COP[3], 0.6);
  // bands round the pot, and its shine (bright after a polish)
  ctx.fillStyle = tone(a, COP[2]);
  ctx.fillRect(56, 95, 50, 2.4);
  ctx.fillRect(56, 120, 50, 2);
  ctx.beginPath();
  ctx.moveTo(66, 102);
  ctx.quadraticCurveTo(68, 110, 70, 116);
  pen(ctx, 'rgba(255,255,255,0.75)', 2 + (q.shine ?? 0) * 1.5);
  ctx.stroke();
  // a soft little leaf crest on its side
  ell(ctx, 85, 110, 4, 3);
  ctx.fillStyle = tone(a, COP[2]);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
// Ducked inside: the front of the kettle's top drawn again over his sunk head, so he's down in it.
function rimOver(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  ctx.beginPath();
  ctx.rect(50, 92, 60, 40);
  ctx.clip();
  smooth(ctx, POT);
  if (mode === 'line') paint(ctx, a, 'line', null, COP_INK);
  else {
    ctx.fillStyle = tone(a, COP[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 70, 100, 16, COP[0], 0.85);
    ctx.fillStyle = tone(a, COP[2]);
    ctx.fillRect(56, 95, 50, 2.4);
    ctx.restore();
  }
  ctx.restore();
}
// The bail handle arching up behind his head (under him).
function bail(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  ctx.beginPath();
  ctx.moveTo(63, 94);
  ctx.bezierCurveTo(58, 64, 102, 64, 97, 94);
  if (mode === 'line') {
    pen(ctx, COP_INK, 6);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, '#6a4a3a'), 3.2);
    ctx.stroke();
  }
  ctx.restore();
}
// His striped tail: two fluffy pieces with dark rings and a dark tip.
function tail(ctx, a, mode, D) {
  for (let i = 1; i >= 0; i--) {
    ctx.save();
    enter(ctx, a, D, `tail${i}`);
    const p0 = TAIL[i];
    const p1 = TAIL[i + 1];
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    ctx.translate(p0[0], p0[1]);
    ctx.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
    const w0 = i === 0 ? 6.6 : 7.2;
    const w1 = i === 0 ? 7.2 : 5;
    smooth(ctx, [[-2, -w0], [L * 0.5, -w1 - 0.8], [L + w1 * 0.8, -w1 * 0.4], [L + w1 * 0.8, w1 * 0.4], [L * 0.5, w1 + 0.8], [-2, w0]]);
    if (mode === 'line') paint(ctx, a, 'line');
    else {
      ctx.fillStyle = tone(a, FUR[1]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = tone(a, MASK);
      ctx.fillRect(L * 0.45, -10, 3.4, 20);
      if (i === 1) ell(ctx, L + 2, 0, 5, 6);
      ctx.fill();
      glow(ctx, L * 0.3, -w0 * 0.5, w0, FUR[0], 0.6);
      ctx.restore();
    }
    ctx.restore();
  }
}
function cup(ctx, a, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  smooth(ctx, [[x - 2.6 * s, y - 2 * s], [x + 2.6 * s, y - 2 * s], [x + 2.2 * s, y + 1.6 * s], [x - 2.2 * s, y + 1.6 * s]]);
  ctx.fillStyle = tone(a, '#f4f0e8');
  ctx.fill();
  pen(ctx, '#a08a78', 0.5 * s);
  ctx.stroke();
  ell(ctx, x, y - 1.8 * s, 2.3 * s, 0.6 * s);
  ctx.fillStyle = tone(a, '#9ac46a');
  ctx.fill();
  ctx.restore();
}

// ---------- His act and fight ----------
const PIECES = { whistle: 6.6, pour: 8.0, peek: 7.6, polish: 7.0 };
const ORDER = ['whistle', 'pour', 'peek', 'polish'];
const POOL = ['steam', 'lid', 'bonk'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tail0: 0, tail1: 0, lidOff: 0, lidSpin: 0, lidPop: 0, lidRattle: 0, sink: 0, shine: 0, steam: 0.15, whistle: 0, cup: 0, pourK: 0, sip: 0, fog: -1, zz: 0, sweat: -1, jet: -1, toss: null, bonk: -1, sparkle: -1 };
  a.kt = q;
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
  go({ shN: -10 + br * 2, elN: -40, hwN: 10, shF: 4 + br * 1.5, elF: -36, hwF: 8, tilt: 2 + walking * 3, head: -1 }, 1);
  const u = a.blkidU ?? a.wp ?? 0;
  q.tail0 = 0.2 + Math.sin(t * 1.1) * 0.08 + Math.sin(u) * 0.12 * walking;
  q.tail1 = 0.5 + Math.sin(t * 1.1 - 0.7) * 0.12;
  q.lidRattle = Math.sin(u * 2) * 0.04 * walking;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.ktWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.ktAtk) {
      const pool = m.def.moves ?? POOL;
      st.ktN = (st.ktN ?? m.uid ?? 0) + 1;
      st.ktMove = m.move ?? pool[st.ktN % pool.length];
    }
    st.ktAtk = true;
  } else st.ktAtk = false;
  const mvName = st.ktAtk ? st.ktMove : null;
  const hadWind = now - (st.ktWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.ktCalm = mix(st.ktCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.ktCalm);
  let PC = st.ktPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.ktOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.ktOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.ktOrd = (st.ktOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.ktPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'whistle') {
    const build = win(pu, 0.2, 1.6, 4.4, 5.0);
    q.steam = Math.max(q.steam, build * k);
    q.lidRattle += Math.sin(pu * 40) * 0.08 * build * k;
    say('puff', win(pu, 0.4, 0.6, 1.6, 1.8) * k);
    const wh = win(pu, 1.6, 1.8, 4.2, 4.6);
    q.whistle = wh * k;
    say('whistle', wh * k);
    add({ hop: Math.abs(Math.sin(pu * 9)) * 0.05 * wh, tilt: Math.sin(pu * 9) * 2 * wh }, k);
    go({ shN: -60, elN: -100, shF: -50, elF: -100 }, wh * k);
    say('grin', win(pu, 4.6, 4.8, 6.0, 6.4) * k);
  }
  if (k > 0.001 && piece === 'pour') {
    // a little cup out in his paw
    q.cup = win(pu, 0.3, 0.6, 7.2, 7.6) * k;
    const hold = win(pu, 0.3, 0.7, 7.0, 7.5);
    go({ shN: -50, elN: -60, hwN: -10 }, hold * k);
    // tipped forward, tea poured from his own spout into it
    const tip = win(pu, 1.0, 1.5, 3.2, 3.6);
    go({ tilt: 22, head: -6 }, tip * k);
    q.pourK = win(pu, 1.4, 1.6, 3.0, 3.3) * k;
    say('focus', tip * k);
    // blown on, sipped, bliss
    const blow = win(pu, 3.8, 4.0, 4.6, 4.8);
    go({ shN: -110, elN: -110, head: 4 }, win(pu, 3.6, 4.0, 6.0, 6.4) * k);
    say('puff', blow * k);
    q.sip = win(pu, 4.8, 5.0, 5.8, 6.0) * k;
    say('bliss', win(pu, 4.9, 5.0, 7.2, 7.6) * k);
  }
  if (k > 0.001 && piece === 'peek') {
    // ducked down into his kettle: head sunk, paws and feet tucked; his eyes darting over the rim
    const duck = win(pu, 0.3, 0.8, 4.8, 5.1);
    q.sink = Math.max(q.sink, duck * k);
    const left = Math.floor(pu / 0.7) % 2 === 0;
    say(left ? 'peekL' : 'peekR', win(pu, 1.0, 1.1, 4.6, 4.8) * k);
    // boo!
    const boo = pu > 5.0 ? clamp(boing(pu - 5.0, 9, 16), 0, 1.15) * (1 - sstep((pu - 5.8) / 0.5)) : 0;
    add({ hop: 0.08 * boo }, k);
    go({ shN: -150, elN: -30, shF: -140, elF: -30 }, win(pu, 5.0, 5.15, 5.6, 5.9) * k);
    say('surprised', win(pu, 5.0, 5.05, 5.4, 5.5) * k);
    const gig = win(pu, 5.6, 5.8, 7.0, 7.4);
    add({ chest: Math.sin(pu * 20) * 2.4 * gig, head: Math.sin(pu * 20 - 0.6) * 2.6 * gig }, k);
    say('giggle', gig * k);
  }
  if (k > 0.001 && piece === 'polish') {
    const huff = win(pu, 0.2, 0.5, 1.0, 1.2);
    go({ head: 14, tilt: 6 }, huff * k);
    say('puff', huff * k);
    if (pu > 0.6 && pu < 1.8) q.fog = pu - 0.6;
    const rub = win(pu, 1.2, 1.5, 4.2, 4.6);
    go({ shN: -20, elN: -110, hwN: 10 }, rub * k);
    add({ shN: Math.sin(pu * 14) * 16 * rub, elN: Math.cos(pu * 14) * 10 * rub }, k);
    say('focus', rub * k);
    q.shine = win(pu, 4.0, 4.4, 6.4, 7.0) * k;
    if (pu > 4.4 && pu < 6.2) q.sparkle = pu - 4.4;
    say('smug', win(pu, 4.4, 4.6, 6.6, 7.0) * k);
    add({ chest: -4 * win(pu, 4.6, 5.0, 6.2, 6.8) }, k);
  }

  if (fighting && alive && !st.ktHunt) st.ktBangAt = now;
  if (!fighting && st.ktHunt && alive) st.ktLostAt = now;
  st.ktHunt = fighting && alive;
  q.bang = now - (st.ktBangAt ?? -9);
  q.huh = now - (st.ktLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  if (fighting && alive && !hurt) {
    go({ tilt: 8, head: 4, shN: -60, elN: -80, shF: -50, elF: -80 }, 1);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- His moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 0;
    const sm5 = (v0) => {
      const v = clamp(v0, 0, 1);
      return v * v * v * (v * (v * 6 - 15) + 10);
    };
    const snapT = mvName === 'lid' ? 0.24 : 0.18;
    const snap = s >= 0 ? sm5(s / (hadWind ? snapT : snapT + 0.06)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'steam') {
      go({ tilt: -10, head: -6, shN: 10, elN: -50, shF: 14, elF: -50 }, wu);
      q.steam = Math.max(q.steam, wu);
      q.lidRattle += Math.sin(now * 40) * 0.1 * wu;
      say('puff', W);
      go({ tilt: 14, head: 4 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.jet = s;
    } else if (mvName === 'lid') {
      go({ shN: 60, elN: -60, hwN: -10, tilt: -8, head: -4 }, wu);
      q.lidOff = Math.max(q.lidOff, sstep(W / 0.5));
      say('focus', W);
      go({ shN: -100, elN: -10, tilt: 10, x: 0.02 }, snap * sw);
      say('grin', snap * sw);
      q.toss = { W, s };
      if (s >= 0) q.lidOff = 0;
    } else {
      go({ lift: -0.07, tilt: 10, head: 6, shN: 20, elN: -60, shF: 24, elF: -60 }, wu);
      say('focus', W);
      const hopK = s >= 0 ? Math.sin(Math.PI * clamp(s / 0.4, 0, 1)) : 0;
      add({ hop: 0.1 * hopK, x: 0.12 * sstep(s / 0.3) * sw }, 1);
      go({ tilt: 20, head: 8 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0.3 && s < 1.0) q.bonk = s - 0.3;
    }
  }
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -10, head: 12, neckR: 4, shN: -80, elN: -110, shF: -70, elF: -110 }, kh);
    q.face = 'hurt';
    q.lidPop = Math.max(q.lidPop, Math.sin(Math.PI * clamp(ago / 0.5, 0, 1)));
  }
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.28, 0.8, 1.1) * (1 - moveW);
    q.lidRattle += -0.18 * kg;
    say('smug', kg);
  }
  st.ktNap = mix(st.ktNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.ktNap);
  if (nw > 0.001) {
    q.sink = Math.max(q.sink, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // sunk into his kettle: his head down into its rim, his limbs tucked up inside
  if (q.sink > 0.001) go({ head: 10, neckR: 2, shN: -10, elN: -150, shF: -10, elF: -150, lift: -0.08, fxN: 0.1, fyN: 0.2, fxF: 0.06, fyF: 0.18 }, q.sink);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  let f = q.face ?? 'calm';
  if (f !== st.ktFace) {
    st.ktFaceFrom = st.ktFace;
    st.ktFace = f;
    st.ktFaceAt = now;
  }
  const since0 = now - (st.ktFaceAt ?? -9);
  if (since0 >= 0 && since0 < 0.07 && st.ktFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.ktFaceFrom)) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.71) % 4.4;
  if (bl < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  for (const key of ['tail0', 'tail1', 'lidOff', 'lidPop', 'lidRattle', 'sink', 'shine', 'steam', 'cup']) {
    st[`kt_${key}`] = mix(st[`kt_${key}`] ?? q[key], q[key], ease(key === 'lidOff' ? (q[key] > (st[`kt_${key}`] ?? 0) ? 14 : 6) : 12));
    q[key] = st[`kt_${key}`];
  }
}

// ---------- Live effects (rig space, game px, his feet at 0, 0) ----------
function puff(ctx, x, y, r, al, pass) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.88);
  if (pass === 'line') {
    ctx.lineWidth = Math.max(0.4, r * 0.3);
    ctx.strokeStyle = STEAM[2];
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
function teaDrop(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.lineWidth = Math.max(0.3, r * 0.45);
  ctx.strokeStyle = TEA[2];
  ctx.stroke();
  ctx.fillStyle = TEA[1];
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.4, r * 0.35);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function note(ctx, x, y, s, al, fl = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl ? -s : s, s);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.4, 1.05, -0.35, 0, TAU);
    ctx.moveTo(1.1, -0.3);
    ctx.lineTo(1.1, -4.4);
    ctx.quadraticCurveTo(2.4, -3.6, 2.6, -2.2);
    ctx.lineCap = 'round';
    if (pass === 'line') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = COP[3];
      ctx.stroke();
    } else {
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = '#fff4e0';
      ctx.stroke();
      ctx.fillStyle = '#fff4e0';
      ctx.fill();
    }
  }
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
  ctx.strokeStyle = '#fff6ea';
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
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#8a6a54';
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
function clong(ctx, x, y, u) {
  if (u <= 0 || u >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.lineCap = 'round';
  for (const [col, w] of [[COP[2], 2.2], ['#fff0d0', 1]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x, y, 3 + u * 10, side * 0.9 - 0.45, side * 0.9 + 0.45);
      ctx.stroke();
    }
  }
  ctx.restore();
  sparkle(ctx, x, y, 3 * Math.sin(Math.PI * clamp(u * 1.6, 0, 1)), 1, '#fff6c8');
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  tail(ctx, a, 'line', D);
  tail(ctx, a, 'fill', D);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.kt ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -30]);
    dizzy(ctx, hx, hy, 6, a.now ?? 0, 3);
    return;
  }
  const [sx, sy] = ptOf(a, D, 'waistB', [114, 91.6]);
  // steam curling from his spout (more as it builds)
  {
    const L = [];
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.5 + i / 3) % 1;
      L.push([sx + f * 4 + Math.sin(f * 5 + i) * 1.4, sy - 1 - f * 14, 0.7 + f * 1.4 + (q.steam ?? 0) * 0.6, (0.3 + (q.steam ?? 0) * 0.7) * Math.sin(Math.PI * f) * 0.85]);
    }
    cloud(ctx, L);
  }
  if ((q.whistle ?? 0) > 0.05) {
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.8 + i * 0.5) % 1;
      note(ctx, sx + 4 + f * 6, sy - 4 - f * 10, 0.7, q.whistle * Math.sin(Math.PI * f), a.flip);
    }
  }
  // his little cup, the tea pouring into it, the sip
  if ((q.cup ?? 0) > 0.02) {
    const [cx, cy] = ptOf(a, D, 'handN', D.J.handN);
    cup(ctx, a, cx + 1, cy - 1.6, 0.9, q.cup);
    if ((q.pourK ?? 0) > 0.05) {
      for (let i = 0; i < 5; i++) {
        const f = (t * 3 + i / 5) % 1;
        teaDrop(ctx, mix(sx, cx + 1, f), mix(sy, cy - 3, f) - Math.sin(Math.PI * f) * 2, 0.45, q.pourK);
      }
    }
  }
  if ((q.fog ?? -1) >= 0 && q.fog < 1.2) {
    const [mx, my] = headAt(a, D, [12, 14]);
    cloud(ctx, [0, 1, 2].map((i) => {
      const f = clamp(q.fog - i * 0.12, 0, 1);
      return [mx + 2 + f * 3, my + 4 + f * 6 + i, 0.8 + f * 0.8, (1 - f) * 0.7];
    }));
  }
  if ((q.sparkle ?? -1) >= 0) {
    const [px, py] = ptOf(a, D, 'waistB', [72, 104]);
    for (let i = 0; i < 3; i++) {
      const f = clamp(q.sparkle * 0.9 - i * 0.2, 0, 1);
      sparkle(ctx, px + i * 4 - 4, py - f * 4 + i * 2, (i % 2 ? 1.1 : 1.6) * Math.sin(Math.PI * f), 1, i % 2 ? '#fff6c8' : '#ffffff');
    }
  }
  // ----- Steam Whistle: a jet of steam puffs out of his spout -----
  if ((q.jet ?? -1) >= 0 && q.jet < 1.0) {
    const s = q.jet;
    const flow = s < 0.5 ? 1 : 1 - sstep((s - 0.5) / 0.4);
    const L = [];
    for (let i = 0; i < 9; i++) {
      const v = (s * 2.2 + i / 9) % 1;
      if (v > s * 2.2) continue;
      L.push([sx + 2 + v * 30, sy - 2 + Math.sin(v * 6 + i) * 1.6 - v * 3, 1 + v * 2.4, flow * (1 - v * 0.7)]);
    }
    cloud(ctx, L);
  }
  // ----- Lid Toss: the lid out at you like a frisbee and back -----
  if (q.toss && q.toss.s >= 0 && q.toss.s < 1.0) {
    const s = q.toss.s;
    const out0 = sstep(s / 0.4);
    const back = sstep((s - 0.45) / 0.45);
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    const x = mix(hx, 36, out0 * (1 - back)) + (back > 0 ? 0 : 0);
    const y = mix(hy, -18, out0 * (1 - back)) - Math.sin(Math.PI * out0) * 4;
    const lx = mix(x, hx, back);
    const ly = mix(y, hy, back);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(s * 14);
    ctx.scale(0.36, 0.2);
    lidShape(ctx, a, 'line');
    lidShape(ctx, a, 'fill');
    ctx.restore();
    // a soft whoosh behind it
    for (let i = 1; i <= 3; i++) sparkle(ctx, lx - (back > 0 ? -1 : 1) * i * 3, ly + i * 0.4, 0.8 * (1 - i * 0.2), 0.8, '#fff4e0');
    if (s > 0.32 && s < 0.6) clong(ctx, 36, -18, (s - 0.32) / 0.28);
  }
  // ----- Belly Bonk: CLONG off his kettle belly, a puff of dust -----
  if ((q.bonk ?? -1) >= 0 && q.bonk < 0.8) {
    const u = q.bonk / 0.6;
    clong(ctx, 18, -10, u);
    cloud(ctx, [-1, 1].map((d) => [10 + d * (4 + u * 8), -1.4, 1.4 * (1 - u * 0.5), 1 - u]));
  }
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    cloud(ctx, [0, 1].map((i) => [sx + i * 3 - 1, sy - 2 - e * 6, 1 + e, 1 - e]));
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-18, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -30]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [14, -38]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, bx - 4 + e * 4, by + 8 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, '#fff2c8');
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'kettletanuki',
  skin: { lt: LIMB[0], base: LIMB[1], sh: LIMB[2], deep: LIMB[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    torso: (ctx, a, mode, S, D) => bail(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => kettle(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      if (!(a.kt?.toss && a.kt.toss.s >= 0)) lidOn(ctx, a, mode, D);
      if ((a.kt?.sink ?? 0) > 0.05) rimOver(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('kettle', DRESS);
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
export const KETTLE_TANUKI_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const KETTLE_TANUKI_SIZE = { w: 32, h: Math.round(R.H * BIG * 1.02), speed: Math.round(R.speed * BIG) };
