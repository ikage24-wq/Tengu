// The Spyglass Loris (2026-11-26, the Star Observatory's Telescope Crab remade from scratch as a new
// creature; the id stays `starcarto`). A chubby little slow loris, the tower's star surveyor: its huge
// round night eyes were made for finding stars, so Astraea gave it a brass spyglass and a tube of
// charts and sent it out on the Starlit Stair to map them. It does everything very, very slowly, and
// when something startles it, it does what a real loris does: it throws its arms up over its head. On
// its own copy of the creature base (rig.js; body.js `loris`: a chubby pear of a body, short sturdy
// legs, arms a touch long), dressed here; its head, cap, spyglass, chart tube and charts drawn here from
// scratch over the mannequin (never the shared face, never the hero).
//   look    honey-cream fur, the loris's soft cocoa mask round each eye and a cream stripe down between
//           them, a small cream muzzle and a rosy nose, little round ears; its own eyes ("lantern
//           eyes": huge and round, an amber iris glowing to honey at the bottom, a big round glint and a
//           little four-point star glint, a soft thick lid line); round cocoa brows that do its acting; a
//           navy surveyor's cap with a short brim and a brass star badge; a strap across its chest to the
//           chart tube on its back (rolled star charts poking out of it); the brass spyglass in its paw.
//           Its own soft cocoa outline, outer edge only, face bare.
//   walk    the base's walk at a loris's slow, careful pace.
//   idle    a 30 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - survey (8.2 s): the spyglass raised slowly, drawn out section by section, put to its eye
//             and swept slowly across the sky; it finds a star, a little gasp, and lowers it, pleased;
//           - chart (7.6 s): a chart drawn out of the tube on its back and unrolled in both paws; it
//             studies it, turns it upside down, frowns, turns it back, nods, rolls it up;
//           - startle (6.6 s): a little star pops down beside it: it freezes, then throws both arms
//             up over its head (a loris's way), peeks out from under them, lowers them slowly, a sigh of
//             relief, and straightens its cap;
//           - doze (7.6 s): a slooow yawn and a slow-motion stretch, it nods off standing up, its chin
//             dropping; a snort awake, and it pretends nothing happened.
//   moves   Lens Flare (the spyglass put to its eye and drawn out, starlight gathering in the lens; then
//           a glint of starlight shot at you, data `shot: 'starglint'`, a flash at the lens and a kick
//           back); Spyglass Bonk (snapped shut and raised high in both paws; then bonked down in front
//           of it with a clack and a pop of little stars); Chart Unroll (a chart pulled from the tube on
//           its back; then flung so it unrolls along the floor at you, and pulled back in).
//   else    hurt: arms up over its head, eyes squeezed; after landing a hit: a slow satisfied nod;
//           hunting you: the spyglass held ready, brows down; low on health: worried, a bead of sweat;
//           a nap (habitat): sat down, hugging its spyglass, its cap tipped over its brow, z's; beaten:
//           dizzy. Its marks over its head (!, ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: starlight as warm honey-gold glints with
// soft rays (never specks), brass and parchment as themselves, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat } from './fx.js';

const BIG = 1.25;
const LW = 1.6 / BIG;
const INK = '#7a5866';
const FUR = ['#fff7ec', '#f1dbbf', '#d9bb96', '#b6916e'];
const CREAM = ['#fffdf8', '#fbf2e4', '#e8d6c0'];
const PATCH = ['#c09482', '#9a7066'];
const EAR_IN = '#f2c2c4';
const NOSE = ['#d88896', '#b0667a'];
const LASH = '#4a2a30';
const IRIS = ['#4a2610', '#98561c', '#df942c', '#ffd06a', '#fff3c4'];
const CAP = ['#7a84c8', '#5560a6', '#3c4482', '#2c3264'];
const CAP_INK = '#2e3060';
const BRASS = ['#fff3c8', '#f2cc6c', '#cc963c', '#9a6a2c'];
const BRASS_INK = '#8a5a26';
const LENS = ['#f2fbff', '#bfe4f6', '#86bde0'];
const PAPER = ['#fffaea', '#f0e2bc', '#d4bc8c'];
const SKY = ['#4a508e', '#363c74'];
const GLINT = ['#fffbea', '#ffe8a8', '#ffcf6a', '#eaa44a'];
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

// ---------- Frames ----------
const NECK = [80.9, 87.3];
const HS = 1.32;
const HO = [1.4, -16];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? bone];
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
// (a part's turn in the rig's space, radians)
const angOf = (a, bone) => {
  const M = a.blMat(bone);
  return Math.atan2(M[1], M[0]);
};

// ---------- Its face ----------
const FACES = {
  calm: { e: 'open', g: [0.4, 0.3], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  pleased: { e: 'happy', b: [-0.5, -0.6], m: 'smile' },
  peer: { e: 'open', g: [1.4, -1], b: [-0.4, 0.8], m: 'set' },
  gasp: { e: 'wide', g: [1.2, -1.2], b: [-1.6, -2], m: 'o' },
  study: { e: 'open', g: [0.6, 1.4], b: [-0.2, 0.8], m: 'set' },
  puzzled: { e: 'open', g: [0.2, 1.2], b: [1.2, -1.2], m: 'wobble' },
  nod: { e: 'happy', b: [-0.4, -0.4], m: 'smile' },
  frozen: { e: 'wide', g: [-1, 0.2], b: [-2, -2.2], m: 'o' },
  peek: { e: 'open', g: [-1.2, -0.6], b: [1.2, -1.6], m: 'wobble' },
  relief: { e: 'shut', b: [0.6, -1], m: 'smile' },
  yawn: { e: 'squeeze', b: [0.6, -1.2], m: 'yawn' },
  drowsy: { e: 'sleep', b: [0.4, 0.2], m: 'calm' },
  snort: { e: 'wide', g: [0.4, -0.4], b: [-1.8, -2], m: 'o' },
  innocent: { e: 'open', g: [-1.2, -1.4], b: [-0.6, -1], m: 'smile' },
  focus: { e: 'open', g: [1.4, 0.4], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.6, 0.4], b: [-1, 2.2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  smug: { e: 'happy', b: [-1, -0.2], m: 'smile' },
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
const SHUTS = new Set(['happy', 'pleased', 'nod', 'relief', 'yawn', 'drowsy', 'shout', 'smug', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A little four-point star glint.
function star4(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r);
  ctx.fillStyle = col;
  ctx.fill();
}
// One eye (head units): huge and round, a loris's.
function eye(ctx, a, x, y, o, f) {
  const w = 5.0;
  const h = 5.2;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 0.8], [x, y - h * 1.05], [x + w, y + 0.8], 1.55, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2.2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.3], 1.45, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.6], [x + w * 0.2 * o, y + 1.3], [x + w * 0.9 * o, y + 0.4], 1.3, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3.4 : 2.8)], [x + w, y], 1.55, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.06 : 1;
  ell(ctx, x, y, w * big, h * big);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * w * 0.72;
      const py = y + Math.sin(an) * u * h * 0.72;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[1]), 0.85);
    ctx.stroke();
    stroke3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.3], [x + w, y - h * 0.3], 1.55, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.4, 0.3];
  ctx.save();
  ell(ctx, x, y, w * big, h * big);
  ctx.clip();
  const ix = x + gx * 0.8;
  const iy = y + gy * 0.7;
  const ir = kind === 'wide' ? 0.86 : 1;
  const iw = w * 0.86 * ir;
  const ih = h * 0.86 * ir;
  // the iris: amber, glowing to honey at the bottom like a lantern
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.25, iw * 0.88, ih * 0.88);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.32, iw * 0.74, ih * 0.52);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.52, iw * 0.5, ih * 0.28);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ell(ctx, ix, iy - 0.1, iw * 0.4 * ir, ih * 0.4 * ir);
  ctx.fillStyle = tone(a, '#24120a');
  ctx.fill();
  // glints: a big round one, a little four-point star
  ell(ctx, ix - 1.5, iy - 1.6, 1.5 * ir, 1.4 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  star4(ctx, ix + 1.7, iy + 1.8, 1.05 * ir, tone(a, IRIS[4]));
  ctx.restore();
  // a soft thick lid line, round at both ends
  stroke3(ctx, a, [x - w * 0.98, y - h * 0.08], [x, y - h * 1.36], [x + w * 0.98, y - h * 0.08], 1.6, LASH);
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.6, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1 + (bo + bi) * 0.35, x + o * 2.6, y + bo * 0.7);
  pen(ctx, tone(a, PATCH[1]), 1.9);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#8a4a5a';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#86324e');
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.58, h * 0.34);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
  };
  const line = (pts, w = 0.8) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'smile':
      line([[x - 2.2, y - 0.4], [x, y + 1.6], [x + 2.4, y - 0.6]]);
      break;
    case 'open':
      open(2.2, 2.2);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1.1, 1.3);
      ctx.fillStyle = tone(a, '#86324e');
      ctx.fill();
      break;
    case 'shout':
      open(2.5, 2.8);
      break;
    case 'yawn':
      open(2, 3.8);
      break;
    case 'set':
      line([[x - 1.9, y + 0.4], [x, y + 0.1], [x + 1.9, y + 0.5]], 0.9);
      break;
    case 'wobble':
      line([[x - 2.1, y + 0.4], [x - 1, y - 0.4], [x, y + 0.3], [x + 1, y - 0.4], [x + 2.1, y + 0.4]], 0.75);
      break;
    case 'frown':
      line([[x - 1.9, y + 0.8], [x, y - 0.2], [x + 1.9, y + 0.8]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.75, 0.55);
      ctx.fillStyle = tone(a, '#86324e');
      ctx.fill();
      break;
    case 'talkA':
      open(1.7, 2);
      break;
    case 'talkE':
      open(2.1, 1.1);
      break;
    default:
      // at rest: a small soft mouth, one corner a touch higher (it is quietly content)
      line([[x - 1.8, y + 0.2], [x - 0.2, y + 0.9], [x + 2, y - 0.2]], 0.78);
  }
}
const SKULL = [[-20, -1], [-19, -11], [-13, -18], [-3, -20.4], [8, -19.6], [15.6, -14.2], [20, -6], [21.4, 2], [20, 9], [14, 14.6], [4, 16.6], [-7, 16], [-15, 11.6]];
// The cap: a soft navy surveyor's cap, the crown round and full, a short brim out over its brow.
const CAP_CROWN = [[-20.6, -5.4], [-20.4, -13.6], [-14.6, -21.6], [-3, -25.4], [9, -23.6], [16.6, -17], [18.4, -11.2], [10, -10], [0, -9.6], [-10, -7.8]];
const CAP_BRIM = [[8, -12.6], [17.4, -13.8], [24.4, -11.6], [25.4, -9.4], [20, -8.8], [11, -9.4]];
function head(ctx, a, mode, D) {
  const q = a.lr ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const tip = q.capTip ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  // its little round ears, rooted inside the skull below the cap's edge
  for (const [x, y, r, rot] of [[-16.6, -6.4, 4.2, -0.6], [14.6, -9.4, 4.0, 0.6]]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot - (q.earFlat ?? 0) * 0.4 * Math.sign(rot));
    ell(ctx, 0, -2.4, r, r * 0.92);
    paint(ctx, a, mode, FUR[2]);
    if (mode === 'fill') {
      ell(ctx, 0.2, -2.1, r * 0.55, r * 0.5);
      ctx.fillStyle = tone(a, EAR_IN);
      ctx.fill();
    }
    ctx.restore();
  }
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -4, -10, 18, FUR[0], 0.85);
    glow(ctx, -16, 10, 11, FUR[2], 0.6);
    // the loris's soft cocoa mask round each eye, running up toward its crown
    for (const [x, y, rx, ry, r] of [[-6.4, -1.4, 7.4, 8.4, 0.18], [8.6, -1.8, 7, 8.2, -0.16]]) {
      ell(ctx, x, y, rx, ry, r);
      ctx.fillStyle = tone(a, PATCH[0], 0.9);
      ctx.fill();
      ell(ctx, x - r * 8, y - 7, rx * 0.5, ry * 0.7, r);
      ctx.fillStyle = tone(a, PATCH[0], 0.75);
      ctx.fill();
    }
    // the cream stripe down between them to its muzzle
    smooth(ctx, [[-0.2, -12], [2.8, -12.4], [3.6, -4], [5.4, 2.4], [2.6, 4.6], [-0.2, -2.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    ctx.restore();
    // the muzzle: a small cream round toward its nose
    smooth(ctx, [[8.4, 5.6], [12, 2.6], [17.6, 2.4], [21.6, 5], [20.8, 9.4], [15.6, 12.4], [10.4, 11.4]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 15, 5, 5, CREAM[0], 0.9);
    for (const [cx, cy, k] of [[-11.6, 8.2, 0.6], [9.4, 9.8, 0.9]]) {
      ell(ctx, cx, cy, 2.8, 1.6);
      ctx.fillStyle = tone(a, '#ff9cb4', 0.42 * k);
      ctx.fill();
    }
    eye(ctx, a, -6.2, -0.6, -1, f);
    eye(ctx, a, 8.4, -1, 1, f);
    brow(ctx, a, -6.6, -8.8, -1, f.b);
    brow(ctx, a, 8.8, -9.2, 1, f.b);
    smooth(ctx, [[17.6, 3.6], [20.6, 3.2], [21.4, 4.8], [19.6, 6.6], [17.8, 5.6]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 19.4, 4, 0.8, 0.45, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    mouth(ctx, a, 17.2, 9.4, f.m);
  }
  // the cap (worn on its crown; tipped forward over its brow when it dozes)
  ctx.save();
  ctx.translate(0, -10);
  ctx.rotate(tip * 0.22);
  ctx.translate(tip * 1.4, 10 + tip * 1.2);
  smooth(ctx, CAP_BRIM);
  paint(ctx, a, mode, CAP[2], CAP_INK);
  smooth(ctx, CAP_CROWN);
  paint(ctx, a, mode, CAP[1], CAP_INK);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, CAP_CROWN);
    ctx.clip();
    glow(ctx, -6, -21, 13, CAP[0], 0.85);
    glow(ctx, 6, -9, 9, CAP[3], 0.5);
    // a soft seam over the crown and a band round its edge
    ctx.beginPath();
    ctx.moveTo(-3, -25);
    ctx.quadraticCurveTo(4, -18, 6, -10.6);
    pen(ctx, tone(a, CAP[3], 0.5), 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-20.6, -7.6);
    ctx.quadraticCurveTo(-4, -10.2, 18, -12.8);
    pen(ctx, tone(a, CAP[3]), 2);
    ctx.stroke();
    ctx.restore();
    // the brass star badge
    ctx.save();
    ctx.translate(8.6, -15.6);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 1.25 : 2.6;
      pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
    }
    smooth(ctx, pts.map(([px, py], i) => (i % 2 ? [px, py] : [px * 1.08, py * 1.08])));
    pen(ctx, tone(a, BRASS_INK), 0.5);
    ctx.stroke();
    ctx.fillStyle = tone(a, BRASS[1]);
    ctx.fill();
    ell(ctx, -0.4, -0.5, 0.8, 0.6);
    ctx.fillStyle = tone(a, BRASS[0]);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

// ---------- Its gear ----------
// The chart tube on its back (in the chest's frame): a leather tube slung slantwise, two rolled charts
// poking out of its top behind its shoulder.
function tube(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const out = a.lr?.tubeOut ?? 0;
  ctx.translate(64, 104);
  ctx.rotate(-0.42);
  // the charts (one drawn up out of it as it pulls it)
  for (const [dx, len, col] of [[-1.6, 6 + out * 8, PAPER[1]], [1.8, 4.6, PAPER[0]]]) {
    ctx.beginPath();
    ctx.roundRect(dx - 1.8, -18 - len, 3.6, len + 4, 1.6);
    paint(ctx, a, mode, col, BRASS_INK);
    if (mode === 'fill') {
      ell(ctx, dx, -18 - len, 1.8, 0.8);
      ctx.fillStyle = tone(a, PAPER[2]);
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.roundRect(-4.2, -19, 8.4, 26, 3.4);
  paint(ctx, a, mode, '#a8705a', '#6e4436');
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, '#c48c6c');
    ctx.fillRect(-3.6, -18, 2.6, 24);
    for (const y of [-16, 3]) {
      ctx.fillStyle = tone(a, BRASS[2]);
      ctx.fillRect(-4.2, y, 8.4, 1.8);
    }
  }
  ctx.restore();
}
// The strap across its chest to the tube (in the chest's frame), over its fur.
function strap(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, 'chest');
  ctx.beginPath();
  ctx.moveTo(70, 90);
  ctx.quadraticCurveTo(84, 100, 95, 112);
  pen(ctx, tone(a, '#8a5a48'), 2.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70.6, 89.6);
  ctx.quadraticCurveTo(84.4, 99.4, 95.4, 111.2);
  pen(ctx, tone(a, '#b47c62'), 0.9);
  ctx.stroke();
  ell(ctx, 88.6, 104.2, 1.6, 1.6);
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ctx.restore();
}
// The brass spyglass (rig space, game px): its eyepiece at x, y, pointing along `ang`, drawn out
// `ext` 0..1 (its three sections sliding out of each other); the lens glowing with `glowK`.
function spyglass(ctx, a, mode, x, y, ang, ext, glowK = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const secs = [[0, 3.4, 1.0], [2.6 - 0.2 * ext, 3.6 + 3.2 * ext, 1.3], [5.2 + 2.8 * ext, 5, 1.7]];
  const end = secs[2][0] + secs[2][1];
  const body = () => {
    for (const [x0, len, r] of secs) {
      ctx.beginPath();
      ctx.roundRect(x0, -r, len, r * 2, r * 0.7);
      if (mode === 'line') {
        pen(ctx, BRASS_INK, LW * 1.1);
        ctx.stroke();
      } else {
        ctx.fillStyle = tone(a, BRASS[2]);
        ctx.fill();
        ctx.fillStyle = tone(a, BRASS[1]);
        ctx.fillRect(x0 + 0.3, -r * 0.8, len - 0.6, r * 0.7);
        ctx.fillStyle = tone(a, BRASS[0], 0.8);
        ctx.fillRect(x0 + 0.6, -r * 0.62, len - 1.2, r * 0.22);
        // a dark ring where each section slides out of the next
        ctx.fillStyle = tone(a, BRASS[3]);
        ctx.fillRect(x0 + len - 0.5, -r, 0.5, r * 2);
      }
    }
    // the lens rim
    ctx.beginPath();
    ctx.roundRect(end - 0.8, -2.1, 1.6, 4.2, 0.8);
    if (mode === 'line') {
      pen(ctx, BRASS_INK, LW * 1.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, BRASS[3]);
      ctx.fill();
    }
  };
  body();
  if (mode === 'fill') {
    ell(ctx, end + 0.6, 0, 0.6, 1.7);
    ctx.fillStyle = tone(a, LENS[1]);
    ctx.fill();
    ell(ctx, end + 0.7, -0.6, 0.3, 0.6);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    if (glowK > 0.02) {
      glow(ctx, end + 1, 0, 3 + glowK * 4, GLINT[2], 0.35 + glowK * 0.45);
      glow(ctx, end + 1, 0, 1.6 + glowK * 1.6, GLINT[0], 0.7 * glowK);
    }
  }
  ctx.restore();
  return [x + Math.cos(ang) * (end + 1), y + Math.sin(ang) * (end + 1)];
}
// Where the spyglass is this frame: held in its near paw at rest, its eyepiece put to its near eye
// when it peers.
function glassAt(a, D) {
  const q = a.lr ?? {};
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const eyeP = headAt(a, D, [9.6, -0.6]);
  const ang = q.glassAng ?? -1.2;
  const L = 6 + 3 * (q.ext ?? 0);
  const held = [hand[0] - Math.cos(ang) * L * 0.4, hand[1] - Math.sin(ang) * L * 0.4];
  const k = sstep(q.toEye ?? 0);
  return { x: mix(held[0], eyeP[0] + 0.6, k), y: mix(held[1], eyeP[1], k), ang };
}
function drawGlass(ctx, a, mode, D) {
  const q = a.lr ?? {};
  const k = sstep(q.glassK ?? 1);
  if (k < 0.03) {
    a.lr.lensAt = null;
    return;
  }
  const g = glassAt(a, D);
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.scale(k, k);
  const L = spyglass(ctx, a, mode, 0, 0, g.ang, q.ext ?? 0, q.lensGlow ?? 0);
  ctx.restore();
  a.lr.lensAt = [g.x + L[0] * k, g.y + L[1] * k];
}
// A chart held open between its paws (rig space): parchment, a navy sky printed on it, little stars
// and the lines between them, rolled up at each end in a paw.
function chartBetween(ctx, a, mode, D, k, flipped) {
  if (k <= 0.02) return;
  const [nx, ny] = ptOf(a, D, 'handN', D.J.handN);
  const [fx, fy] = ptOf(a, D, 'handF', D.J.handF);
  const w = Math.hypot(nx - fx, ny - fy) * sstep(k);
  const ang = Math.atan2(ny - fy, nx - fx);
  ctx.save();
  ctx.translate(fx, fy - 2);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.roundRect(0, -4.6, Math.max(1, w), 9.2, 1);
  paint(ctx, a, mode, PAPER[0], BRASS_INK);
  if (mode === 'fill' && w > 3) {
    ctx.beginPath();
    ctx.roundRect(1.4, -3.4, w - 2.8, 6.8, 1);
    ctx.fillStyle = tone(a, SKY[0]);
    ctx.fill();
    const stars = [[0.25, -1.2], [0.42, 1.4], [0.6, -0.6], [0.78, 1.0]];
    ctx.beginPath();
    stars.forEach(([u, v], i) => (i ? ctx.lineTo(1.4 + u * (w - 2.8), v * flipped) : ctx.moveTo(1.4 + u * (w - 2.8), v * flipped)));
    pen(ctx, tone(a, GLINT[1], 0.7), 0.35);
    ctx.stroke();
    for (const [u, v] of stars) star4(ctx, 1.4 + u * (w - 2.8), v * flipped, 0.7, tone(a, GLINT[0]));
  }
  // the rolled ends
  for (const x of [0, w]) {
    ctx.beginPath();
    ctx.roundRect(x - 1.3, -5.4, 2.6, 10.8, 1.3);
    paint(ctx, a, mode, PAPER[1], BRASS_INK);
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { survey: 8.2, chart: 7.6, startle: 6.6, doze: 7.6 };
const ORDER = ['survey', 'chart', 'startle', 'doze'];
const POOL = ['flare', 'bonk', 'unroll'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, ext: 0, toEye: 0, glassAng: -0.85, lensGlow: 0, capTip: 0, earFlat: 0, tubeOut: 0, chart: 0, chartFlip: false, gather: 0, flash: -1, pop: -1, crash: -1, unroll: -1, zz: 0, sweat: -1, noGlass: false };
  a.lr = q;
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
  // Standing: the spyglass held upright in its near paw against its chest, the other paw hanging,
  // a slow breath.
  const br = c.breath ?? 0;
  go({ shN: -8 + br * 1.5, elN: -66, hwN: -10, shF: 4 + br * 1.5, elF: -22, hwF: 6, tilt: 2 + walking * 2, head: -1, chest: -br * 0.6 }, 1);

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.lrWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.2;
  if ((wind > 0 || striking) && alive) {
    if (!st.lrAtk) {
      const pool = m.def.moves ?? POOL;
      st.lrN = (st.lrN ?? m.uid ?? 0) + 1;
      st.lrMove = m.move ?? pool[st.lrN % pool.length];
    }
    st.lrAtk = true;
  } else st.lrAtk = false;
  const mvName = st.lrAtk ? st.lrMove : null;
  const hadWind = now - (st.lrWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.3 ? sstep(since / 0.3) : 1;
      s = since - 0.3;
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
  st.lrCalm = mix(st.lrCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.lrCalm);
  let PC = st.lrPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.lrOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.lrOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.lrOrd = (st.lrOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.lrPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let sit = 0;
  // (peering through the spyglass: both paws up at its eye, the far one under the barrel)
  const peer = (amt, aim) => {
    go({ shN: -96, elN: -96, hwN: -16, shF: -84, elF: -80, hwF: -10, head: -6 + aim * 30, neckR: aim * 8, chest: -2 }, amt);
    q.toEye = Math.max(q.toEye, amt);
    q.glassAng = mix(q.glassAng, -0.15 + aim, amt);
  };

  if (k > 0.001 && piece === 'survey') {
    // raised slowly, drawn out section by section, to its eye, swept slowly across the sky
    const up = win(pu, 0.2, 1.4, 6.6, 7.4);
    const aim = -0.5 + Math.sin(clamp((pu - 2.4) / 3.2, 0, 1) * Math.PI) * 0.22;
    peer(up * k, aim);
    q.ext = Math.max(q.ext, sstep((pu - 1.0) / 1.2) * (1 - sstep((pu - 6.4) / 0.8)) * k);
    say('peer', win(pu, 1.4, 1.6, 4.6, 4.8) * k);
    // found one: a little gasp
    const gasp = win(pu, 4.6, 4.75, 5.8, 6.0);
    add({ head: -4 * gasp, chest: -3 * gasp }, k);
    say('gasp', gasp * k);
    q.lensGlow = Math.max(q.lensGlow, gasp * 0.6 * k);
    say('pleased', win(pu, 6.2, 6.5, 7.8, 8.1) * k);
  }
  if (k > 0.001 && piece === 'chart') {
    // the spyglass tucked away under its arm; a chart drawn from the tube on its back
    const reach = win(pu, 0.2, 0.8, 1.2, 1.6);
    go({ shN: 30, elN: -150, hwN: -20, head: -6, neckR: -3, tilt: -3 }, reach * k);
    q.tubeOut = Math.max(q.tubeOut, win(pu, 0.6, 0.9, 1.1, 1.3) * k);
    q.noGlass = pu > 0.4 && pu < 7.0;
    const open = win(pu, 1.4, 2.1, 6.4, 7.0);
    go({ shN: -44, elN: -42, hwN: -10, shF: -36, elF: -64, hwF: -10, head: 14, neckR: 5 }, open * k);
    q.chart = open * k;
    say('study', win(pu, 2.0, 2.2, 3.2, 3.4) * k);
    // turned upside down... frowned at... turned back
    const turned = pu > 3.4 && pu < 4.8;
    q.chartFlip = turned;
    go({ head: 4, neckR: 10 }, win(pu, 3.4, 3.6, 4.6, 4.8) * k);
    say('puzzled', win(pu, 3.4, 3.6, 4.6, 4.8) * k);
    const nod = win(pu, 4.9, 5.1, 6.1, 6.3);
    add({ head: Math.sin((pu - 4.9) * 9) * 6 * nod }, k);
    say('nod', nod * k);
  }
  if (k > 0.001 && piece === 'startle') {
    if (pu > 0.3 && pu < 1.4) q.crash = pu - 0.3;
    // frozen
    const fr = win(pu, 0.8, 0.85, 1.4, 1.5);
    say('frozen', fr * k);
    // then both arms thrown up over its head (a loris's way)
    const arms = win(pu, 1.4, 1.65, 3.8, 5.0);
    go({ shN: -172, elN: -60, hwN: -20, shF: -166, elF: -64, hwF: -20, head: 8, neckR: 3, lift: -0.02 }, arms * k);
    q.toEye = 0;
    q.glassAng = mix(q.glassAng, -2.6, arms * k);
    say('hurt', win(pu, 1.5, 1.6, 2.3, 2.4) * k);
    // a peek out from under them
    const pk = win(pu, 2.4, 2.6, 3.7, 3.9);
    go({ head: -2, neckR: -4 }, pk * k);
    say('peek', pk * k);
    // lowered slowly; a sigh; the cap straightened
    say('relief', win(pu, 4.6, 4.8, 5.4, 5.6) * k);
    add({ chest: -Math.sin(Math.PI * clamp((pu - 4.6) / 1, 0, 1)) * 4 }, k);
    const cap = win(pu, 5.4, 5.7, 6.1, 6.5);
    go({ shF: -150, elF: -90, hwF: -20, head: -4 }, cap * k);
    q.capTip -= 0.4 * Math.sin(Math.PI * clamp((pu - 5.5) / 0.8, 0, 1)) * k;
    say('pleased', cap * k);
  }
  if (k > 0.001 && piece === 'doze') {
    // a slooow yawn and a slow-motion stretch
    const yw = win(pu, 0.2, 1.2, 2.4, 3.0);
    go({ shF: -150, elF: -40, hwF: -20, chest: -6, head: -10, lift: 0.01 }, yw * k);
    say('yawn', win(pu, 0.5, 0.8, 2.3, 2.6) * k);
    // it nods off standing up, its chin dropping, its cap tipping
    const nod = win(pu, 3.0, 3.8, 5.6, 5.7);
    go({ head: 16 + Math.sin(pu * 1.6) * 2, neckR: 4, chest: 3, shN: -6, elN: -80 }, nod * k);
    q.capTip += 0.6 * nod * k;
    say('drowsy', win(pu, 2.9, 3.0, 3.6, 3.7) * k);
    say('sleep', win(pu, 3.6, 3.7, 5.6, 5.65) * k);
    q.zz = Math.max(q.zz, win(pu, 4.0, 4.4, 5.5, 5.65) * k);
    // a snort awake, and it pretends nothing happened
    const jolt = pu > 5.6 ? clamp(boing(pu - 5.6, 9, 18), 0, 1.15) * (1 - sstep((pu - 6.2) / 0.4)) : 0;
    add({ hop: 0.03 * jolt, head: -6 * jolt }, k);
    say('snort', win(pu, 5.6, 5.65, 6.1, 6.2) * k);
    say('innocent', win(pu, 6.2, 6.4, 7.3, 7.6) * k);
  }
  q.calm = cw;

  // (its own marks over its head)
  if (fighting && alive && !st.lrHunt) st.lrBangAt = now;
  if (!fighting && st.lrHunt && alive) st.lrLostAt = now;
  st.lrHunt = fighting && alive;
  q.bang = now - (st.lrBangAt ?? -9);
  q.huh = now - (st.lrLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the spyglass held ready, brows down -----
  if (fighting && alive && !hurt) {
    go({ tilt: 6, head: 4, shN: -50, elN: -80, hwN: -10, shF: -30, elF: -60 }, 1 - walking * 0.5);
    q.glassAng = mix(q.glassAng, -0.5, 1 - walking * 0.5);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.6) / 0.45) : 0;
    const snap = s >= 0 ? sstep(s / 0.1) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'flare') {
      // the spyglass to its eye, drawn out, starlight gathering in the lens
      peer(sstep(Math.min(1, W * 1.6)), -0.12);
      q.ext = Math.max(q.ext, sstep((W - 0.2) / 0.5));
      q.lensGlow = Math.max(q.lensGlow, sstep((W - 0.4) / 0.6));
      q.gather = sstep((W - 0.3) / 0.7) * (1 - snap);
      go({ x: -0.02, tilt: -4 }, wu);
      say('peer', W);
      // then the glint shot at you: a flash at the lens, a kick back
      if (s >= 0) {
        peer(sw, -0.12 - 0.12 * win(s, 0, 0.04, 0.12, 0.3));
        q.ext = Math.max(q.ext, sw);
        go({ x: -0.04, tilt: -8, head: -6 }, win(s, 0, 0.03, 0.12, 0.4));
        q.flash = s;
        say('peer', win(s, 0, 0.02, 0.35, 0.45));
        say('smug', win(s, 0.45, 0.55, 0.9, 1.0));
      }
    } else if (mvName === 'bonk') {
      // snapped shut and raised high in both paws
      go({ shN: -176, elN: -30, hwN: -10, shF: -168, elF: -34, hwF: -10, tilt: -8, head: -8, chest: -4, lift: 0.01 }, wu);
      q.glassAng = mix(q.glassAng, -1.5, wu);
      say('focus', W);
      // then bonked down in front of it with a clack
      go({ shN: -58, elN: -10, hwN: 10, shF: -52, elF: -12, hwF: 10, tilt: 18, head: 8, chest: 6, x: 0.04, lift: -0.04 }, snap * sw);
      q.glassAng = mix(q.glassAng, 0.55, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      if (s >= 0) q.pop = s;
    } else {
      // a chart pulled from the tube on its back
      const reach = win(W, 0, 0.35, 0.6, 0.8);
      go({ shN: 30, elN: -150, hwN: -20, head: -6, tilt: -4 }, reach * (1 - snap));
      q.tubeOut = Math.max(q.tubeOut, win(W, 0.3, 0.45, 0.6, 0.75));
      q.noGlass = W > 0.2 || s >= 0;
      const hold = sstep((W - 0.6) / 0.35) * (1 - snap);
      go({ shN: 20, elN: -120, hwN: -30, tilt: -8, x: -0.03, head: -4 }, hold);
      q.rollHeld = W > 0.6 && s < 0;
      say('focus', W);
      // then flung, unrolling along the floor at you, and pulled back in
      go({ shN: -86, elN: -6, hwN: 0, tilt: 14, head: 6, x: 0.04, lift: -0.03 }, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      if (s >= 0) q.unroll = s;
    }
  }
  // ----- Hurt: arms up over its head, eyes squeezed (a loris's way) -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.7);
    go({ shN: -170, elN: -66, shF: -164, elF: -66, head: 10, neckR: 3, tilt: -6, lift: -0.02 }, kh);
    q.glassAng = mix(q.glassAng, -2.6, kh);
    q.toEye = Math.min(q.toEye, 1 - kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
  }
  // ----- After landing a hit: a slow satisfied nod -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.6) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.3, 0.9, 1.2) * (1 - moveW);
    add({ head: Math.sin(gl * 6) * 6 * kg }, 1);
    say('smug', kg);
  }
  // ----- A nap (its habitat): sat down hugging its spyglass, its cap over its brow -----
  st.lrNap = mix(st.lrNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.lrNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 18 + Math.sin(now * 1.4) * 3, neckR: 5, shN: -30, elN: -110, shF: -26, elF: -100 }, nw);
    q.glassAng = mix(q.glassAng, -1.0, nw);
    q.capTip += 0.8 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (sit > 0.001) go({ lift: -0.2 + Math.sin(now * 1.3) * 0.006, tilt: -8, fxN: 0.4, fyN: 0.06, fxF: 0.34, fyF: 0.05, toeN: -14, toeF: -14 }, sit);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 6) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.capTip = 0.5;
  }
  // ----- The face: an in-between (a blink) on every change; its own slow blink -----
  let f = q.face ?? 'calm';
  if (f !== st.lrFace) {
    st.lrFaceFrom = st.lrFace;
    st.lrFace = f;
    st.lrFaceAt = now;
  }
  const since0 = now - (st.lrFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.08 && st.lrFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.lrFaceFrom) && !(talky(f) && talky(st.lrFaceFrom))) f = 'shut';
  // (a loris blinks slowly, and seldom)
  const bl = (now + (m.uid ?? 0) * 0.77) % 5.6;
  if (bl < 0.2 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['ext', 'toEye', 'glassAng', 'lensGlow', 'capTip', 'earFlat', 'tubeOut', 'chart']) {
    st[`lr_${key}`] = mix(st[`lr_${key}`] ?? q[key], q[key], ease(key === 'glassAng' ? 9 : 10));
    q[key] = st[`lr_${key}`];
  }
  // (the spyglass tucked away and brought back out grown in solid, never popping in mid-air)
  // (the chart turned over and back, never flipped in one frame)
  st.lrTurn = mix(st.lrTurn ?? 0, q.chartFlip ? 1 : 0, ease(7));
  q.chartTurn = st.lrTurn;
  st.lrGlassK = mix(st.lrGlassK ?? 1, q.noGlass ? 0 : 1, ease(12));
  q.glassK = st.lrGlassK;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// A glint of starlight: a warm round heart, four soft rays, a glow.
function glint(ctx, x, y, r, al, spin = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 3, GLINT[2], 0.45);
  ctx.translate(x, y);
  ctx.rotate(spin);
  star4(ctx, 0, 0, r * 1.6, GLINT[1]);
  ctx.rotate(Math.PI / 4);
  star4(ctx, 0, 0, r * 0.9, GLINT[0]);
  ell(ctx, 0, 0, r * 0.45, r * 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// The shot it fires in the dungeon (render/dreamfx.js dreamShot, the 'spit' vfx: `p` 0..1 along its
// flight, `d` the way it flies): a glint of starlight streaking, a soft trail of light behind it.
export function starGlintShot(ctx, shot, x, y, p, d) {
  if (shot !== 'starglint') return false;
  ctx.save();
  for (let i = 1; i <= 4; i++) {
    ctx.globalAlpha = 0.5 * (1 - i / 5);
    ell(ctx, x - d * i * 3, y + Math.sin(p * 20 + i) * 0.4, 2.2 - i * 0.35, 1.2 - i * 0.18);
    ctx.fillStyle = GLINT[1];
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  glint(ctx, x, y, 2.4, 1, p * 6);
  return true;
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
  ctx.strokeStyle = '#8a6a7a';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fff6ee';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      pen(ctx, INK, 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffbf2';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#8a6a7a';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
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

function under2(ctx, m, a) {
  void m;
  void a;
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.lr ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -32]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const lens = q.lensAt;
  // a star found in the sky: a little twinkle in the lens
  // ----- Lens Flare: starlight spiralling into the lens; the flash as it fires -----
  if (lens && (q.gather ?? 0) > 0.05) {
    for (let i = 0; i < 5; i++) {
      const f = (t * 1.6 + i / 5) % 1;
      const an = (i / 5) * TAU + t * 2;
      const r = (1 - f) * 12;
      glint(ctx, lens[0] + Math.cos(an) * r, lens[1] + Math.sin(an) * r * 0.7, 0.5 + f * 0.3, q.gather * Math.sin(Math.PI * f));
    }
  }
  if (lens && (q.flash ?? -1) >= 0 && q.flash < 0.45) {
    const e = q.flash / 0.45;
    glint(ctx, lens[0] + 1, lens[1], 3.4 * (1 - e * 0.6), 1 - sstep((e - 0.5) / 0.5), e * 2);
    // a short beam leaving the lens (the glint itself flies on as the dungeon's shot)
    ctx.save();
    ctx.globalAlpha *= (1 - e) * 0.8;
    ctx.lineCap = 'round';
    for (const [col, w] of [[GLINT[2], 2.4], [GLINT[0], 1]]) {
      ctx.beginPath();
      ctx.moveTo(lens[0] + 2 + e * 10, lens[1]);
      ctx.lineTo(lens[0] + 8 + e * 26, lens[1]);
      pen(ctx, col, w);
      ctx.stroke();
    }
    ctx.restore();
  }
  // a found star twinkling in the lens (surveying)
  if (lens && (q.lensGlow ?? 0) > 0.1 && (q.gather ?? 0) < 0.05 && (q.flash ?? -1) < 0) glint(ctx, lens[0] + 0.6, lens[1], 1.1, q.lensGlow);
  // ----- Spyglass Bonk: a pop of little stars where it lands -----
  if ((q.pop ?? -1) >= 0 && q.pop < 0.8) {
    const e = q.pop / 0.8;
    const x = 22;
    const y = -4;
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI * 0.95 + (i / 4) * Math.PI * 0.9;
      glint(ctx, x + Math.cos(an) * (3 + e * 9), y + Math.sin(an) * (3 + e * 7) + e * e * 5, 0.7 * (1 - e * 0.5), 1 - e, e * 4);
    }
    sparkle(ctx, x, y - 1, 3 * Math.sin(Math.PI * Math.min(1, e * 2)), 1, GLINT[1]);
  }
  // ----- Chart Unroll: the chart flung, unrolling along the floor at you, pulled back in -----
  if (q.rollHeld) {
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(-0.6);
    for (const mode of ['line', 'fill']) {
      ctx.beginPath();
      ctx.roundRect(-1.6, -6, 3.2, 12, 1.5);
      paint(ctx, a, mode, PAPER[1], BRASS_INK);
    }
    ctx.restore();
  }
  if ((q.unroll ?? -1) >= 0 && q.unroll < 1.2) {
    const s = q.unroll;
    const outK = sstep(s / 0.3) * (1 - sstep((s - 0.75) / 0.4));
    const x0 = 10;
    const len = outK * 34;
    const rollR = 2.2 + (1 - outK) * 1.6;
    ctx.save();
    for (const mode of ['line', 'fill']) {
      if (len > 1) {
        ctx.beginPath();
        ctx.roundRect(x0, -1.4, len, 1.4, 0.6);
        paint(ctx, a, mode, PAPER[0], BRASS_INK);
        if (mode === 'fill') {
          ctx.fillStyle = tone(a, SKY[0]);
          ctx.fillRect(x0 + 1, -1.2, Math.max(0, len - 2), 0.9);
          for (let i = 0; i < 5; i++) {
            const px = x0 + 3 + i * 6.4;
            if (px < x0 + len - 2) star4(ctx, px, -0.75, 0.6, GLINT[0]);
          }
        }
      }
      ell(ctx, x0 + len, -rollR, rollR, rollR);
      paint(ctx, a, mode, PAPER[1], BRASS_INK);
    }
    ctx.restore();
    // the stars printed on it twinkle as it rolls over you
    if (outK > 0.6) for (let i = 0; i < 3; i++) glint(ctx, x0 + 8 + i * 10, -4 - Math.sin(t * 6 + i) * 2, 0.7, (outK - 0.6) * 2.2);
  }
  // ----- Startled: a little star pops down beside it -----
  if ((q.crash ?? -1) >= 0) {
    const e = q.crash;
    const u = clamp(e / 0.45, 0, 1);
    if (u < 1) glint(ctx, -16 - u * 4, -40 + u * 38, 1.4, 1, u * 4);
    else {
      const v = clamp((e - 0.45) / 0.6, 0, 1);
      for (let i = 0; i < 4; i++) {
        const an = -Math.PI * 0.9 + (i / 3) * Math.PI * 0.8;
        glint(ctx, -20 + Math.cos(an) * v * 7, -2 + Math.sin(an) * v * 6, 0.7 * (1 - v), 1 - v);
      }
    }
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-18, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [14, -28]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.35 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [14, -40]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    glint(ctx, bx - 4 + e * 4, by + 8 - e * 6, 1.1 * Math.sin(Math.PI * e), 1);
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'spyglassloris',
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: LW },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  under2,
  under: {
    // (the chart tube on its back, behind everything)
    torso: (ctx, a, mode, S, D) => tube(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => strap(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    // (the spyglass and a chart in its paws: over its near arm, under its near paw, so the paw holds them)
    armN: (ctx, a, mode, S, D) => {
      chartBetween(ctx, a, mode, D, a.lr?.chart ?? 0, Math.cos(Math.PI * (a.lr?.chartTurn ?? 0)));
      drawGlass(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('loris', DRESS);
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
export const SPYGLASS_LORIS_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const SPYGLASS_LORIS_SIZE = { w: 32, h: Math.round(R.H * BIG * 1.1), speed: Math.round(R.speed * BIG) };
