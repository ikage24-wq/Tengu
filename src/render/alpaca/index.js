// The Nebula Knitter (2026-11-26, the Star Observatory's Nebula Witch remade from scratch as a new
// creature; the id stays `nebulawitch`). A fluffy little alpaca, the tower's knitter: her fleece is a
// soft nebula, the cloud that new stars are born in, and every so often a baby star wriggles out of it.
// She spins her wool into starry yarn and knits the night sky (the Stargazer set's star-chart scarf is
// hers). She hums while she knits, the way alpacas do. On her own copy of the creature base (rig.js;
// body.js `alpaca`: a round little body under her fleece, short legs, short arms), dressed here; her long
// neck, head, fleece, beret and knitting drawn here from scratch over the mannequin (never the shared
// face, never the hero).
//   look    fawn-cream skin; a fleece of nebula wool (lilac, rose and sea-green clouds blended, little stars
//           twinkling in it) round her body and up her long neck, a fluffy topknot over her brow, long
//           soft ears; her own eyes ("dewdrop eyes": tall ovals, a rose-to-sea-green iris like her wool,
//           a round glint and a little star, a neat lash line with two short round-tipped lashes, an
//           alpaca's famous ones); round brows; a soft split muzzle; a navy knitted beret with a
//           cream pom-pom, tipped over her topknot; two knitting needles and her night-sky scarf (navy,
//           a starry stripe) in her hands, the yarn running back to a ball tucked in her fleece. Her own
//           soft plum outline, outer edge only, face bare.
//   walk    the base's walk, her legs mostly lost in her fleece, a gentle sway of her neck.
//   idle    a 29 s act in four pieces, each the next one that fits the time she has before she moves on
//           (data `rest`; world/mobs.js tells her, `m.restUntil`):
//           - knit (8.0 s): a row knitted, the needles clicking in turn, the scarf growing; she holds it
//             up to look at it, pleased, and a little hum;
//           - ball (8.0 s): her yarn ball drops out of her fleece and rolls away; she reaches, it's out
//             of reach; she reels it back in hand over hand on its thread, catches it, tucks it back, huff;
//           - newstar (6.6 s): something wriggles in her fleece; a baby star pops out; a gasp, she cups
//             it, it floats up out of her hands and away, twinkling, and she waves it bye-bye;
//           - hum (6.8 s): eyes closed, she sways side to side humming, the stars in her fleece
//             twinkling in time; a contented sigh.
//   moves   Yarn Comet (the yarn ball plucked from her fleece and swung round on its thread; then
//           flung at you, data `shot: 'nebulayarn'`, its thread whipping out); Needle Jab (her needles
//           crossed and drawn back; then a fencer's double thrust, little sparkles at their tips);
//           Fleece Puff (a deep breath, her fleece fluffing right up; then a shake, a burst of nebula wool
//           and little stars round her).
//   else    hurt: a wince, ears back, her fleece fluffed; after landing a hit: a smug ear flick and a hum;
//           hunting you: needles crossed ready, ears forward; low on health: worried, a bead of sweat; a
//           nap (habitat): folded down on her legs like an alpaca does, her knitting in her lap, z's;
//           beaten: dizzy. Her marks over her head (!, ?, z's, sweat) are her own (`ownEmotes`).
// Every effect is drawn here, live, in her own soft style: wool as soft rounded nebula puffs (rose,
// lilac, sea-green), stars as little round-tipped stars, notes soft rounded strokes.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat } from './fx.js';

const BIG = 1.2;
const LW = 1.6 / BIG;
const INK = '#7a5a86';
const SKIN = ['#fffaf2', '#f3e4d4', '#dcc6b0', '#bea48e'];
const WOOL = ['#fff4fb', '#f2dcf4', '#d8c0ee', '#b8a2dc'];
const NEB = ['#ffc6e0', '#cdb6ff', '#a8eee0', '#ffe2b0'];
const MUZ = ['#fffdf8', '#f8ece0', '#e6d2c0'];
const LASH = '#40284e';
const IRIS = ['#3c2450', '#8a4a9a', '#d878b0', '#8ad8c8', '#e8fff8'];
const BERET = ['#6c74c0', '#4c54a0', '#363c7e', '#262a5e'];
const BERET_INK = '#262a5e';
const SCARF = ['#5a62b0', '#3e4690', '#2c3270'];
const NEEDLE = ['#fffaf0', '#e8dcc4', '#b8a284'];
const STAR = ['#fffbe6', '#ffe89a', '#ffcf5a', '#e6a23a'];
const STAR_INK = '#c7862c';
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
const HS = 1.2;
// (her head carried high on her long neck)
const HO = [2.4, -27];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const EAR_F = [-8.6, -15.4];
const EAR_N = [5.4, -16.6];
const JOINTS = { earF: hk(EAR_F), earN: hk(EAR_N) };
const PIV2 = { earF: 'earF', earN: 'earN' };
const SOFTS = [
  { name: 'earF', parent: 'head', pivot: 'earF', rot: (S, a) => a.nk?.earF ?? 0, soft: { k: 110, c: 6.6, gain: 0.34, turn: 0.6, max: 14, flutter: 1, hz: 0.45, dir: [0, -9] } },
  { name: 'earN', parent: 'head', pivot: 'earN', rot: (S, a) => a.nk?.earN ?? 0, soft: { k: 118, c: 6.6, gain: 0.34, turn: 0.6, max: 14, flutter: 1, hz: 0.52, dir: [0, -9] } },
];
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? PIV2[bone] ?? bone];
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

// ---------- Wool ----------
// A fleecy outline: soft round lobes all the way round an ellipse (never points), `n` lobes, `puff`
// how far they bulge.
function fleecePts(cx, cy, rx, ry, n, puff, ph = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const an = (i / (n * 2)) * TAU + ph;
    const r = i % 2 ? 1 - puff * 0.5 : 1 + puff * 0.5;
    pts.push([cx + Math.cos(an) * rx * r, cy + Math.sin(an) * ry * r]);
  }
  return pts;
}
// The nebula in her wool: soft rose, lilac and sea-green clouds blended, a few stars twinkling in it
// (inside a clip of the wool's shape).
function nebula(ctx, a, x, y, w, h, seed, tw = 1) {
  glow(ctx, x - w * 0.3, y - h * 0.35, w * 0.75, WOOL[0], 0.9);
  glow(ctx, x + w * 0.35, y - h * 0.05, w * 0.55, NEB[0], 0.55);
  glow(ctx, x - w * 0.2, y + h * 0.35, w * 0.6, NEB[1], 0.55);
  glow(ctx, x + w * 0.25, y + h * 0.45, w * 0.45, NEB[2], 0.5);
  glow(ctx, x - w * 0.55, y + h * 0.05, w * 0.4, WOOL[3], 0.4);
  const t = a.now ?? 0;
  for (let i = 0; i < 3; i++) {
    const px = x + (hash(seed + i * 3) - 0.5) * w * 1.3;
    const py = y + (hash(seed + i * 7 + 1) - 0.5) * h * 1.2;
    const k = 0.55 + 0.45 * Math.sin(t * (1.6 + i * 0.4) + seed + i * 2) * tw;
    sparkle(ctx, px, py, 1.2 * k, 0.9, STAR[1]);
  }
}

// ---------- Her face ----------
const FACES = {
  calm: { e: 'open', g: [0.6, 0.4], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  pleased: { e: 'happy', b: [-0.5, -0.6], m: 'smile' },
  hum: { e: 'shut', b: [-0.4, -0.6], m: 'hum' },
  knit: { e: 'open', g: [0.8, 2.2], b: [-0.2, 0.4], m: 'calm' },
  admire: { e: 'open', g: [1, 0.6], b: [-1, -1.2], m: 'smile' },
  oops: { e: 'wide', g: [1.4, 1.6], b: [-1.8, -2], m: 'o' },
  strain: { e: 'squeeze', b: [0.4, 1.2], m: 'set' },
  huff: { e: 'shut', b: [0.4, 1.4], m: 'puff' },
  gasp: { e: 'wide', g: [0.4, 1.4], b: [-1.6, -2], m: 'o' },
  coo: { e: 'happy', b: [-1, -1.2], m: 'o' },
  bye: { e: 'open', g: [0.8, -2.2], b: [-0.8, -1.2], m: 'smile' },
  focus: { e: 'open', g: [1.4, 0.6], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.6, 0.4], b: [-1, 2.2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  inhale: { e: 'open', g: [1, -0.4], b: [-1, 1], m: 'puff' },
  smug: { e: 'happy', b: [-1, -0.2], m: 'hum' },
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
const SHUTS = new Set(['happy', 'pleased', 'hum', 'strain', 'huff', 'coo', 'shout', 'smug', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
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
// One eye (head units): a tall oval, o +1 the eye toward her nose, -1 the other (its outer corner).
function eye(ctx, a, x, y, o, f) {
  const w = 4.0;
  const h = 5.0;
  const kind = f.e;
  // (her two long lashes off the outer corner, short and round-tipped, grown from the lash line)
  const lashes = (yy, k = 1) => {
    stroke3(ctx, a, [x + w * 0.78 * o, yy - h * 0.34 * k], [x + (w + 0.9) * o, yy - h * 0.5 * k], [x + (w + 1.4) * o, yy - h * 0.86 * k], 0.85, LASH);
    stroke3(ctx, a, [x + w * 0.4 * o, yy - h * 0.78 * k], [x + (w * 0.5 + 0.5) * o, yy - h * 1.02 * k], [x + (w * 0.6 + 0.8) * o, yy - h * 1.3 * k], 0.8, LASH);
  };
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 0.8], [x, y - h * 1.05], [x + w, y + 0.8], 1.3, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.3], 1.3, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.4], [x + w * 0.2 * o, y + 1.2], [x + w * 0.9 * o, y + 0.4], 1.15, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3 : 2.5)], [x + w, y], 1.3, LASH);
    // (her long lashes resting down)
    stroke3(ctx, a, [x + w * 0.6 * o, y + 1.4], [x + (w * 0.7 + 0.6) * o, y + 2.4], [x + (w * 0.8 + 0.6) * o, y + 3.2], 0.75, LASH);
    stroke3(ctx, a, [x + w * 0.1 * o, y + 2.1], [x + (w * 0.15 + 0.3) * o, y + 3.1], [x + (w * 0.2 + 0.2) * o, y + 3.9], 0.7, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.07 : 1;
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
    stroke3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.3], [x + w, y - h * 0.3], 1.3, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.6, 0.4];
  ctx.save();
  ell(ctx, x, y, w * big, h * big);
  ctx.clip();
  const ix = x + gx * 0.7;
  const iy = y + gy * 0.7 + 0.2;
  const ir = kind === 'wide' ? 0.86 : 1;
  const iw = w * 0.82 * ir;
  const ih = h * 0.84 * ir;
  // the iris: plum at the top, rose through the middle, sea-green at the bottom, like her wool
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.25, iw * 0.86, ih * 0.86);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.28, iw * 0.72, ih * 0.54);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.56, iw * 0.5, ih * 0.26);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ell(ctx, ix, iy - 0.1, iw * 0.38 * ir, ih * 0.42 * ir);
  ctx.fillStyle = tone(a, '#24142e');
  ctx.fill();
  ell(ctx, ix - 1.2, iy - 1.6, 1.25 * ir, 1.2 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  star4(ctx, ix + 1.3, iy + 1.7, 0.95 * ir, tone(a, IRIS[4]));
  ctx.restore();
  stroke3(ctx, a, [x - w * 0.98, y - h * 0.1], [x, y - h * 1.34], [x + w * 0.98, y - h * 0.1], 1.25, LASH);
  lashes(y);
}
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.1, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 0.9 + (bo + bi) * 0.35, x + o * 2.1, y + bo * 0.7);
  pen(ctx, tone(a, '#a07aa0'), 1.6);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#8a4a6a';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#86325a');
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.58, h * 0.34);
    ctx.fillStyle = tone(a, '#ff9cb6');
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
    case 'smile':
      line([[x - 2.2, y - 0.3], [x - 1.1, y + 1.3], [x, y + 0.3], [x + 1.1, y + 1.3], [x + 2.3, y - 0.5]]);
      break;
    case 'hum':
      // lips pressed, a little hum
      line([[x - 1.6, y + 0.3], [x, y + 0.9], [x + 1.6, y + 0.3]], 0.8);
      break;
    case 'puff':
      ell(ctx, x + 0.4, y + 0.6, 0.8, 0.7);
      ctx.fillStyle = tone(a, '#86325a');
      ctx.fill();
      break;
    case 'open':
      open(2, 2);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1, 1.2);
      ctx.fillStyle = tone(a, '#86325a');
      ctx.fill();
      break;
    case 'shout':
      open(2.3, 2.6);
      break;
    case 'set':
      line([[x - 1.8, y + 0.4], [x, y + 0.1], [x + 1.8, y + 0.4]], 0.85);
      break;
    case 'wobble':
      line([[x - 2, y + 0.4], [x - 1, y - 0.4], [x, y + 0.3], [x + 1, y - 0.4], [x + 2, y + 0.4]], 0.7);
      break;
    case 'frown':
      line([[x - 1.8, y + 0.8], [x, y - 0.2], [x + 1.8, y + 0.8]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.7, 0.5);
      ctx.fillStyle = tone(a, '#86325a');
      ctx.fill();
      break;
    case 'talkA':
      open(1.6, 1.8);
      break;
    case 'talkE':
      open(2, 1);
      break;
    default:
      // at rest: an alpaca's soft split lip, one corner tucked up
      line([[x - 1.9, y + 0.2], [x - 0.9, y + 1.1], [x, y + 0.3], [x + 1, y + 1.1], [x + 2, y - 0.2]], 0.72);
  }
}
const SKULL = [[-15, 0], [-14.6, -9], [-10, -15.4], [-2, -17.6], [6.6, -16.6], [12.6, -12], [16.4, -4.4], [20.4, 1.4], [21.6, 6.6], [19, 11.4], [12.6, 13.6], [3, 13.4], [-6, 12], [-12.6, 7.4]];
const TOPKNOT = [[-15, -6], [-15.6, -13.4], [-10.6, -20.6], [-2.6, -23.6], [6.4, -22.4], [13, -17], [14.6, -11.4], [10.6, -9.8], [5, -11.2], [0, -9.8], [-5, -11], [-10, -9]];
function ear(ctx, a, mode, root, base, name, flat) {
  ctx.save();
  ctx.translate(...root);
  ctx.rotate(base + swingOf(a, name, 'head') * 0.85 - flat * 0.8 * Math.sign(base || 1));
  // a long soft banana of an ear, its root sunk in her topknot, a round tip
  smooth(ctx, [[-2.8, 2], [-3.6, -5], [-3, -11.4], [-1, -14.6], [1.4, -14.2], [2.8, -10.4], [3, -4], [2.4, 2]]);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill') {
    smooth(ctx, [[-1.2, 0], [-1.8, -5], [-1.2, -10.6], [0.2, -12.4], [1.2, -10], [1.4, -4.4], [0.8, 0]]);
    ctx.fillStyle = tone(a, '#f6c8d8');
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.nk ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  const flat = q.earFlat ?? 0;
  // her long neck, a column of fleece from her shoulders up into her head (part of the head, pivoting
  // at its base)
  const NECKPTS = [[-9.6, 6], [-4.4, 2], [3.6, 3.6], [8.6, 10], [9.6, 18], [8.4, 26], [3, 30.4], [-5, 30.4], [-10.6, 26], [-11.8, 16]];
  smooth(ctx, NECKPTS);
  paint(ctx, a, mode, WOOL[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, NECKPTS);
    ctx.clip();
    nebula(ctx, a, -1, 18, 11, 12, 11, 0.7);
    ctx.restore();
  }
  ear(ctx, a, mode, EAR_F, -0.32, 'earF', flat);
  ear(ctx, a, mode, EAR_N, 0.22, 'earN', flat);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 0, -8, 16, SKIN[0], 0.9);
    glow(ctx, -12, 9, 9, SKIN[2], 0.55);
    // her muzzle: a soft cream round toward her nose, split in an alpaca's way
    smooth(ctx, [[8, 4], [12.4, 0.4], [18.6, 0.6], [22.2, 4.4], [21.4, 9.8], [16, 12.6], [10, 11.6]]);
    ctx.fillStyle = tone(a, MUZ[1]);
    ctx.fill();
    glow(ctx, 16, 3, 5, MUZ[0], 0.9);
    ctx.restore();
    for (const [cx, cy, k] of [[-8.4, 6.6, 0.6], [9.6, 7.4, 0.9]]) {
      ell(ctx, cx, cy, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ff9cc4', 0.45 * k);
      ctx.fill();
    }
    eye(ctx, a, -4.8, -1.2, -1, f);
    eye(ctx, a, 8.2, -1.6, 1, f);
    brow(ctx, a, -5, -8.4, -1, f.b);
    brow(ctx, a, 8.4, -8.8, 1, f.b);
    // nostrils: two soft commas, and the soft split line down to her lip
    for (const [nx, ny] of [[19.4, 3.6], [21.2, 4.6]]) {
      ell(ctx, nx, ny, 0.55, 0.85, 0.5);
      ctx.fillStyle = tone(a, '#b88a9a');
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(20.2, 5.8);
    ctx.quadraticCurveTo(20.4, 7, 19.8, 7.8);
    pen(ctx, tone(a, '#c8a2aa'), 0.5);
    ctx.stroke();
    mouth(ctx, a, 19.4, 8.6, f.m);
  }
  // the topknot: a soft fluffy cloud over her brow, ending above her brows
  smooth(ctx, TOPKNOT);
  paint(ctx, a, mode, WOOL[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, TOPKNOT);
    ctx.clip();
    nebula(ctx, a, 0, -16, 13, 7, 5, 0.6);
    ctx.restore();
  }
  // the beret, tipped over her topknot, its pom-pom
  ctx.save();
  ctx.translate(-2, -21);
  ctx.rotate(-0.26 + (q.beretTip ?? 0));
  smooth(ctx, [[-11.4, 1.4], [-10.6, -3], [-4, -6.2], [5, -6], [11.4, -2.6], [12.4, 1.4], [6, 2.8], [-4, 3]]);
  paint(ctx, a, mode, BERET[1], BERET_INK);
  if (mode === 'fill') {
    glow(ctx, -3, -4, 9, BERET[0], 0.7);
    ctx.beginPath();
    ctx.moveTo(-10.6, 1);
    ctx.quadraticCurveTo(0, 3, 12, 1);
    pen(ctx, tone(a, BERET[2]), 1.6);
    ctx.stroke();
    // a little row of knitted stars round its band
    for (let i = 0; i < 4; i++) star4(ctx, -6 + i * 5, -1.6, 0.8, tone(a, STAR[1]));
  }
  ell(ctx, 1.6, -7.4, 2.6, 2.4);
  paint(ctx, a, mode, '#fff6f0', BERET_INK);
  if (mode === 'fill') {
    ell(ctx, 1, -8, 1.2, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// ---------- Her body ----------
// The fleece round her body (in the waist's frame): one soft lobed cloud from her shoulders to her
// knees, the nebula in it; `puff` fluffs it up.
function fleece(ctx, a, mode, D) {
  const q = a.nk ?? {};
  const p = q.puff ?? 0;
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const pts = fleecePts(81, 111, 18.6 * (1 + p * 0.14), 19.4 * (1 + p * 0.1), 9, 0.09, 0.3);
  smooth(ctx, pts);
  paint(ctx, a, mode, WOOL[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    nebula(ctx, a, 81, 110, 18, 18, 1, 1 + p);
    ctx.restore();
    // soft curls of wool: a few round arcs, shaded
    for (const [x, y, r] of [[72, 104, 4], [88, 100, 3.6], [84, 116, 4.2], [70, 118, 3.4], [93, 112, 3]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0.3, 2.6);
      pen(ctx, tone(a, WOOL[3], 0.35), 0.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// A puff of wool at her near shoulder, so her arm comes out of her fleece.
function cuff(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'armNu');
  const s = D.J.shN;
  const pts = fleecePts(s[0], s[1] + 2, 6.4, 6, 5, 0.14, 0.4);
  smooth(ctx, pts);
  paint(ctx, a, mode, WOOL[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    glow(ctx, s[0] - 2, s[1] - 1, 6, WOOL[0], 0.9);
    glow(ctx, s[0] + 2, s[1] + 4, 5, NEB[1], 0.5);
    ctx.restore();
  }
  ctx.restore();
}
// Her knitting (rig space): two needles in her hands, the night-sky scarf hanging from them; the
// yarn running back to the ball tucked in her fleece.
function needleAt(a, D, k) {
  // (both needles held up close together by her paws, the far one just behind the near: her far paw
  // is lost in her fleece, so its needle is held from beside the near one)
  const hn = ptOf(a, D, 'handN', D.J.handN);
  const h = k === 'N' ? hn : [hn[0] - 1.6, hn[1] + 0.6];
  const ang = (k === 'N' ? a.nk?.angN : a.nk?.angF) ?? -1.2;
  return { h, ang, tip: [h[0] + Math.cos(ang) * 8, h[1] + Math.sin(ang) * 8], butt: [h[0] - Math.cos(ang) * 2.4, h[1] - Math.sin(ang) * 2.4] };
}
function needle(ctx, a, mode, n) {
  ctx.beginPath();
  ctx.moveTo(...n.butt);
  ctx.lineTo(...n.tip);
  if (mode === 'line') {
    pen(ctx, '#8a7a6a', 1.7);
    ctx.stroke();
    return;
  }
  pen(ctx, tone(a, NEEDLE[1]), 1);
  ctx.stroke();
  ell(ctx, n.butt[0], n.butt[1], 0.9, 0.9);
  ctx.fillStyle = tone(a, STAR[2]);
  ctx.fill();
}
function knitting(ctx, a, mode, D) {
  const q = a.nk ?? {};
  const N = needleAt(a, D, 'N');
  const F = needleAt(a, D, 'F');
  const hold = q.scarfK ?? 1;
  // the scarf hangs from where the needles cross
  const top = [mix(N.tip[0], F.tip[0], 0.5) - 1, mix(N.tip[1], F.tip[1], 0.5) + 1.4];
  const len = (5 + (q.rows ?? 0) * 0.5) * hold;
  const sway = Math.sin((a.now ?? 0) * 1.7) * 0.6 + (q.scarfSway ?? 0);
  if (hold > 0.05) {
    const w = 3.2;
    const pts = [[top[0] - w, top[1]], [top[0] + w, top[1]], [top[0] + w + sway, top[1] + len], [top[0] - w + sway * 1.1, top[1] + len + 0.4]];
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    ctx.lineTo(...pts[1]);
    ctx.quadraticCurveTo(top[0] + w + sway * 0.4, top[1] + len * 0.5, ...pts[2]);
    ctx.lineTo(...pts[3]);
    ctx.quadraticCurveTo(top[0] - w + sway * 0.4, top[1] + len * 0.5, ...pts[0]);
    ctx.closePath();
    paint(ctx, a, mode, SCARF[1], SCARF[2]);
    if (mode === 'fill') {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = tone(a, SCARF[0]);
      ctx.fillRect(top[0] - w, top[1], w, len + 2);
      // a starry stripe and knitted ribs
      ctx.fillStyle = tone(a, NEB[1], 0.8);
      ctx.fillRect(top[0] - w - 1, top[1] + len * 0.45, w * 2 + 3, 1.1);
      for (let i = 0; i < 3; i++) star4(ctx, top[0] - 1.6 + i * 1.7 + sway * 0.5, top[1] + len * 0.72 + (i % 2) * 0.6, 0.55, tone(a, STAR[1]));
      ctx.strokeStyle = tone(a, SCARF[2], 0.6);
      ctx.lineWidth = 0.3;
      for (let x = -w + 0.8; x < w; x += 1.1) {
        ctx.beginPath();
        ctx.moveTo(top[0] + x, top[1] + 0.4);
        ctx.lineTo(top[0] + x + sway, top[1] + len);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  needle(ctx, a, mode, F);
  needle(ctx, a, mode, N);
}
// Her yarn ball (rig space), tucked in her fleece at her side or wherever the act puts it; the thread
// from it to her knitting.
function yarnBall(ctx, a, mode, x, y, r, spin) {
  ell(ctx, x, y, r, r);
  paint(ctx, a, mode, NEB[1], '#8a6aaa');
  if (mode === 'fill') {
    ctx.save();
    ell(ctx, x, y, r, r);
    ctx.clip();
    glow(ctx, x - r * 0.4, y - r * 0.4, r * 1.2, NEB[0], 0.7);
    glow(ctx, x + r * 0.4, y + r * 0.5, r, NEB[2], 0.6);
    ctx.strokeStyle = 'rgba(122,90,150,0.5)';
    ctx.lineWidth = 0.35;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.95, r * (0.35 + i * 0.22), spin + i * 0.9, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }
}
function ballAt(a, D) {
  const q = a.nk ?? {};
  const home = ptOf(a, D, 'waistB', [93, 117]);
  if (q.ballAt) return q.ballAt;
  return home;
}
// ---------- Her act and fight ----------
const PIECES = { knit: 8.0, ball: 8.0, newstar: 6.6, hum: 6.8 };
const ORDER = ['knit', 'ball', 'newstar', 'hum'];
const POOL = ['yarn', 'needle', 'fluff'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, earF: 0, earN: 0, earFlat: 0, puff: 0, angN: -1.05, angF: -1.45, scarfK: 1, rows: st.nkRows ?? 0, scarfSway: 0, beretTip: 0, ballAt: null, ballSpin: 0, slack: 1, ballGone: false, click: 0, notes: 0, baby: -1, wave: 0, sling: -1, flingS: -1, jab: -1, burst: -1, gather: 0, zz: 0, sweat: -1 };
  a.nk = q;
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
  // Standing: her knitting held up before her, needles crossed, a slow breath, her neck swaying gently.
  const br = c.breath ?? 0;
  go({ shN: -40 + br * 1.5, elN: -70, hwN: -10, shF: -34 + br * 1.5, elF: -76, hwF: -10, tilt: 1 + walking * 2, head: -2 + Math.sin(t * 0.6) * 1.5, chest: -br * 0.6 }, 1);
  q.earF = Math.sin(t * 0.5) * 0.05;
  q.earN = Math.sin(t * 0.44 + 2) * 0.05;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.nkWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.nkAtk) {
      const pool = m.def.moves ?? POOL;
      st.nkN = (st.nkN ?? m.uid ?? 0) + 1;
      st.nkMove = m.move ?? pool[st.nkN % pool.length];
    }
    st.nkAtk = true;
  } else st.nkAtk = false;
  const mvName = st.nkAtk ? st.nkMove : null;
  const hadWind = now - (st.nkWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.nkCalm = mix(st.nkCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.nkCalm);
  let PC = st.nkPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.nkOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.nkOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.nkOrd = (st.nkOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.nkPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let sit = 0;

  if (k > 0.001 && piece === 'knit') {
    // a row knitted: the needles clicking in turn, her head bent over it
    const kn = win(pu, 0.2, 0.6, 4.6, 5.0);
    const cl = Math.sin((pu - 0.6) * 9);
    go({ head: 12, neckR: 4, shN: -46 + cl * 6, elN: -74, shF: -38 - cl * 6, elF: -80 }, kn * k);
    q.angN += cl * 0.22 * kn * k;
    q.angF -= cl * 0.22 * kn * k;
    q.click = kn * k * Math.max(0, Math.sin((pu - 0.6) * 9 - 1.2));
    say('knit', kn * k);
    // (the scarf grows by a row as she finishes it; kept, so it keeps growing, up to a point)
    if (pu > 4.4 && !st.nkRowDone && k > 0.5) {
      st.nkRows = Math.min(10, (st.nkRows ?? 0) + 1);
      st.nkRowDone = true;
    }
    if (pu < 1) st.nkRowDone = false;
    // held up to look at, pleased; a little hum
    const up = win(pu, 4.9, 5.4, 7.2, 7.7);
    go({ shN: -96, elN: -40, shF: -88, elF: -44, head: -6 }, up * k);
    say('admire', win(pu, 5.2, 5.4, 6.2, 6.4) * k);
    say('hum', win(pu, 6.3, 6.5, 7.6, 7.9) * k);
    q.notes = Math.max(q.notes, win(pu, 6.3, 6.5, 7.6, 7.9) * k);
    q.notesT = pu - 6.3;
  }
  if (k > 0.001 && piece === 'ball') {
    // her yarn ball drops out of her fleece and rolls away
    const home = st.nkBallHome ?? [14, -14];
    const fall = clamp((pu - 0.3) / 0.35, 0, 1);
    const roll = sstep((pu - 0.65) / 0.9);
    const reel = sstep((pu - 3.6) / 2.0);
    const bx = mix(mix(home[0], 16, fall), 40, roll * (1 - reel)) + mix(0, 0, reel);
    const by = pu < 0.65 ? mix(home[1], -2.4, fall * fall) : -2.4 - Math.abs(Math.sin(Math.PI * clamp((pu - 0.65) / 0.45, 0, 1))) * 3 * (1 - roll);
    const caught = sstep((pu - 5.4) / 0.4);
    if (pu > 0.25 && pu < 6.4) {
      // (rig space, its feet at 0, 0: whichever way she faces, the ball rolls on ahead of her)
      const [hx, hy] = [st.nkHandAt?.[0] ?? 12, st.nkHandAt?.[1] ?? -24];
      q.ballAt = [mix(reel > 0 ? mix(40, hx, reel) : bx, hx, caught), mix(reel > 0 ? mix(-2.4, hy, reel) - Math.sin(Math.PI * reel) * 4 : by, hy, caught)];
      q.ballSpin = (roll * (1 - reel) - reel) * 9;
      q.slack = 0.2;
    }
    say('oops', win(pu, 0.4, 0.5, 1.4, 1.6) * k);
    // she reaches, and it's out of reach
    const reach = win(pu, 1.4, 1.9, 3.2, 3.5);
    go({ tilt: 18, head: 10, shN: -84, elN: -10, hwN: -30, fxN: 0.3 }, reach * k);
    say('strain', reach * k);
    // reeled back in hand over hand on its thread
    const rl = win(pu, 3.5, 3.7, 5.4, 5.6);
    const hh = Math.sin((pu - 3.6) * 10);
    go({ shN: -60 + hh * 20, elN: -60 - hh * 20, shF: -60 - hh * 20, elF: -60 + hh * 20, tilt: -4 }, rl * k);
    say('focus', rl * k);
    // caught, tucked back in her fleece, a huff
    const tuck = win(pu, 5.6, 5.9, 6.4, 6.7);
    go({ shN: 10, elN: -80, hwN: -30, head: 8 }, tuck * k);
    say('huff', win(pu, 6.6, 6.8, 7.6, 7.9) * k);
    add({ chest: -Math.sin(Math.PI * clamp((pu - 6.7) / 0.8, 0, 1)) * 4 }, k);
  }
  if (k > 0.001 && piece === 'newstar') {
    // something wriggles in her fleece
    const wr = win(pu, 0.2, 0.3, 1.0, 1.2);
    add({ pelvis: Math.sin(pu * 22) * 3 * wr, chest: -Math.sin(pu * 22) * 2 * wr }, k);
    q.puff = Math.max(q.puff, 0.25 * wr * k);
    go({ head: 18, neckR: 6 }, win(pu, 0.3, 0.6, 1.6, 1.9) * k);
    say('surprised', wr * k);
    // a baby star pops out; a gasp; cupped in her hands
    if (pu > 1.0 && pu < 6.4) q.baby = pu - 1.0;
    say('gasp', win(pu, 1.0, 1.1, 1.7, 1.8) * k);
    const cup = win(pu, 1.6, 2.0, 3.0, 3.3);
    go({ shN: -70, elN: -60, hwN: -40, shF: -64, elF: -64, hwF: -40, head: 12 }, cup * k);
    q.scarfK = Math.min(q.scarfK, 1 - cup * 0.7 * k);
    say('coo', win(pu, 1.9, 2.0, 3.0, 3.1) * k);
    // it floats up out of her hands and away; she waves it bye-bye
    const look = win(pu, 3.0, 3.3, 5.8, 6.3);
    go({ head: -18, neckR: -5 }, look * k);
    const wave = win(pu, 3.8, 4.0, 5.6, 5.9);
    go({ shN: -150, elN: -30 + Math.sin(pu * 11) * 30, hwN: -20 }, wave * k);
    q.wave = wave * k;
    say('bye', look * k);
    say('pleased', win(pu, 5.9, 6.1, 6.5, 6.6) * k);
  }
  if (k > 0.001 && piece === 'hum') {
    // eyes closed, swaying side to side, humming
    const hm = win(pu, 0.2, 0.7, 5.4, 6.0);
    const sw = Math.sin((pu - 0.4) * 2.6);
    add({ tilt: sw * 5 * hm, head: -sw * 6 * hm, neckR: -sw * 2 * hm, pelvis: sw * 2 * hm }, k);
    q.earF += sw * 0.18 * hm * k;
    q.earN += sw * 0.18 * hm * k;
    say('hum', hm * k);
    q.notes = Math.max(q.notes, hm * k);
    q.notesT = pu;
    q.twinkle = hm * k;
    // a contented sigh
    add({ chest: -Math.sin(Math.PI * clamp((pu - 5.6) / 1.0, 0, 1)) * 5 }, k);
    say('pleased', win(pu, 5.8, 6.0, 6.6, 6.8) * k);
  }
  q.calm = cw;

  // (her own marks over her head)
  if (fighting && alive && !st.nkHunt) st.nkBangAt = now;
  if (!fighting && st.nkHunt && alive) st.nkLostAt = now;
  st.nkHunt = fighting && alive;
  q.bang = now - (st.nkBangAt ?? -9);
  q.huh = now - (st.nkLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: needles crossed ready, ears forward -----
  if (fighting && alive && !hurt) {
    go({ tilt: 6, head: 2, shN: -76, elN: -50, shF: -64, elF: -60 }, 1 - walking * 0.5);
    q.angN = mix(q.angN, -0.4, 1 - walking * 0.5);
    q.angF = mix(q.angF, -0.9, 1 - walking * 0.5);
    q.earF -= 0.2;
    q.earN += 0.2;
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Her moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.45) : 0;
    const snap = s >= 0 ? sstep(s / 0.1) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'yarn') {
      // the yarn ball plucked from her fleece, swung round on its thread over her head
      const pluck = win(W, 0, 0.2, 0.3, 0.45);
      go({ shN: 10, elN: -80, hwN: -30, head: 8 }, pluck * (1 - snap));
      const swing = sstep((W - 0.3) / 0.25) * (1 - snap);
      go({ shN: -160, elN: -20, hwN: -10, tilt: -8, head: -10, x: -0.02 }, swing);
      say('focus', W);
      if (W > 0.3 && s < 0) q.sling = now;
      q.scarfK = Math.min(q.scarfK, 1 - 0.6 * Math.max(sstep(W), sw));
      // then flung at you
      go({ shN: -70, elN: -6, hwN: 10, tilt: 12, head: 6, x: 0.04 }, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      if (s >= 0) q.flingS = s;
      if (W > 0.3 || s >= 0) q.ballGone = true;
    } else if (mvName === 'needle') {
      // needles crossed and drawn back
      go({ shN: -20, elN: -110, shF: -14, elF: -110, tilt: -8, head: -4, x: -0.03 }, wu);
      q.angN = mix(q.angN, -0.2, wu);
      q.angF = mix(q.angF, -0.5, wu);
      say('focus', W);
      // a fencer's double thrust
      if (s >= 0) {
        const t1 = win(s, 0, 0.06, 0.16, 0.26);
        const t2 = win(s, 0.24, 0.3, 0.42, 0.6);
        go({ shN: -92, elN: -2, tilt: 14, x: 0.05, head: 4, fxN: 0.4 }, t1 * sw);
        go({ shF: -90, elF: -2, tilt: 16, x: 0.06, head: 6, fxN: 0.45 }, t2 * sw);
        q.angN = mix(q.angN, 0.05, Math.max(t1, t2 * 0.5) * sw);
        q.angF = mix(q.angF, 0.05, t2 * sw);
        say('shout', win(s, 0, 0.02, 0.5, 0.6));
        q.jab = s;
      }
    } else {
      // a deep breath, her fleece fluffing right up
      go({ tilt: -6, head: -10, chest: -6, shN: 10, elN: -50, shF: 14, elF: -50 }, wu);
      q.puff = Math.max(q.puff, sstep(W));
      q.gather = wu;
      say('inhale', W);
      // then a shake: a burst of wool and little stars round her
      if (s >= 0) {
        const sh = win(s, 0, 0.04, 0.4, 0.6);
        add({ chest: Math.sin(s * 40) * 5 * sh, head: Math.sin(s * 40 - 0.6) * 6 * sh, pelvis: -Math.sin(s * 40) * 3 * sh }, 1);
        q.puff = Math.max(q.puff, 1 - sstep((s - 0.1) / 0.5));
        say('shout', win(s, 0, 0.02, 0.4, 0.5));
        q.burst = s;
      }
    }
  }
  // ----- Hurt: a wince, ears back, her fleece fluffed -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -10, head: 12, neckR: 4, shN: -60, elN: -100, shF: -54, elF: -100, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.puff = Math.max(q.puff, 0.5 * kh);
  }
  // ----- After landing a hit: a smug ear flick and a hum -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 0.9, 1.2) * (1 - moveW);
    q.earN += Math.sin(Math.PI * clamp(gl / 0.4, 0, 1)) * 0.5 * kg;
    add({ head: -6 * kg }, 1);
    say('smug', kg);
    q.notes = Math.max(q.notes, kg);
    q.notesT = gl;
  }
  // ----- A nap (her habitat): folded down on her legs, her knitting in her lap -----
  st.nkNap = mix(st.nkNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.nkNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 16 + Math.sin(now * 1.3) * 3, neckR: 4, shN: -20, elN: -60, shF: -16, elF: -60 }, nw);
    q.beretTip += 0.12 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // (an alpaca lies down on her folded legs: kushed, low, her legs tucked under her fleece)
  if (sit > 0.001) go({ lift: -0.24 + Math.sin(now * 1.3) * 0.006, tilt: -4, fxN: 0.12, fyN: 0.02, fxF: 0.06, fyF: 0.02, toeN: -10, toeF: -10 }, sit);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.earFlat = 0.6;
  }
  let f = q.face ?? 'calm';
  if (f !== st.nkFace) {
    st.nkFaceFrom = st.nkFace;
    st.nkFace = f;
    st.nkFaceAt = now;
  }
  const since0 = now - (st.nkFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.nkFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.nkFaceFrom) && !(talky(f) && talky(st.nkFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.57) % 4.6;
  if (bl < 0.13 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['earF', 'earN', 'earFlat', 'puff', 'angN', 'angF', 'scarfK', 'beretTip']) {
    st[`nk_${key}`] = mix(st[`nk_${key}`] ?? q[key], q[key], ease(key.startsWith('ang') ? 14 : 10));
    q[key] = st[`nk_${key}`];
  }
  // (her yarn ball, where the act has it or tucked at her side: eased back home when an act is cut
  // short, so it rolls back rather than jumping; at home it rides with her)
  const home = st.nkBallHome ?? [14, -14];
  const goal = q.ballAt ?? home;
  const prev = st.nkBallPos ?? goal;
  if (!q.ballAt && Math.hypot(prev[0] - home[0], prev[1] - home[1]) < 0.6) st.nkBallPos = home;
  else st.nkBallPos = [mix(prev[0], goal[0], ease(q.ballAt ? 40 : 9)), mix(prev[1], goal[1], ease(q.ballAt ? 40 : 9))];
  q.ballAt = st.nkBallPos;
  // (the ball grown back in her fleece after a throw, never popping)
  st.nkBallK = mix(st.nkBallK ?? 1, q.ballGone ? 0 : 1, ease(q.ballGone ? 30 : 4));
  q.ballK = st.nkBallK;
}

// ---------- Live effects (rig space, game px, her feet at 0, 0) ----------
// A soft puff of nebula wool.
function wool(ctx, x, y, r, al, col = NEB[0]) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const pass of ['line', 'fill']) {
    for (const [dx, dy, kk] of [[0, 0, 1], [r * 0.7, -r * 0.3, 0.7], [-r * 0.6, -r * 0.4, 0.65]]) {
      ell(ctx, x + dx, y + dy, r * kk, r * kk * 0.9);
      if (pass === 'line') {
        pen(ctx, '#b89ad0', 0.6);
        ctx.stroke();
      } else {
        ctx.fillStyle = WOOL[0];
        ctx.fill();
      }
    }
  }
  glow(ctx, x, y + r * 0.2, r * 1.2, col, 0.5);
  ctx.restore();
}
function babyStar(ctx, x, y, r, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.8, STAR[1], 0.5);
  ctx.translate(x, y);
  ctx.rotate(ang);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.55 : r;
    pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
  }
  smooth(ctx, pts.map(([px, py], i) => (i % 2 ? [px, py] : [px * 1.08, py * 1.08])));
  pen(ctx, STAR_INK, Math.max(0.35, r * 0.2));
  ctx.stroke();
  ctx.fillStyle = STAR[2];
  ctx.fill();
  // its sleepy little face (two closed arcs): it's a baby
  if (r > 1.4) {
    ctx.strokeStyle = '#a0602a';
    ctx.lineWidth = r * 0.1;
    ctx.lineCap = 'round';
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(d * r * 0.26, -r * 0.02, r * 0.13, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }
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
    ctx.lineJoin = 'round';
    if (pass === 'line') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#a07ac0';
      ctx.stroke();
    } else {
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = '#fbe8ff';
      ctx.stroke();
      ctx.fillStyle = '#fbe8ff';
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
  ctx.strokeStyle = '#8a70b0';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fbf0ff';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const kk = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (kk <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -kk : kk, kk);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      pen(ctx, INK, 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffbff';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#8a70b0';
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
// The shot she throws in the dungeon (render/dreamfx.js dreamShot, the 'spit' vfx): her ball of nebula
// yarn, spinning, its thread trailing behind it in a soft wave.
export function nebulaYarnShot(ctx, shot, x, y, p, d) {
  if (shot !== 'nebulayarn') return false;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 1; i <= 8; i++) ctx.lineTo(x - d * i * 2.6, y + Math.sin(p * 18 + i * 0.9) * 1.6 + i * 0.2);
  pen(ctx, NEB[0], 0.9);
  ctx.stroke();
  for (const mode of ['line', 'fill']) yarnBall(ctx, { flash: 0 }, mode, x, y, 3.2, p * 12 * d);
  sparkle(ctx, x - d * 4, y - 3, 1.2 + Math.sin(p * 24) * 0.4, 1, STAR[1]);
  ctx.restore();
  return true;
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  // (where her near hand is, for the yarn she reels in)
  const st = a.mo.rig;
  if (st) {
    st.nkHandAt = ptOf(a, D, 'handN', D.J.handN);
    st.nkBallHome = ptOf(a, D, 'waistB', [93, 117]);
  }
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.nk ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.41;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  // knitting: a tiny sparkle where the needles click
  if ((q.click ?? 0) > 0.3) {
    const N = needleAt(a, D, 'N');
    sparkle(ctx, N.tip[0] - 1, N.tip[1] + 1, 0.9 * q.click, 1, STAR[1]);
  }
  // humming: soft notes drifting off her lips
  if ((q.notes ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [20, 6]);
    for (let i = 0; i < 2; i++) {
      const f = ((q.notesT ?? 0) * 0.6 + i * 0.5) % 1;
      note(ctx, mx + 2 + f * 7 + Math.sin(f * 6 + i) * 1.2, my - 2 - f * 10, 0.7, q.notes * Math.sin(Math.PI * f), a.flip);
    }
  }
  // the baby star: out of her fleece, cupped, floating up and away
  if ((q.baby ?? -1) >= 0) {
    const e = q.baby;
    const [cx, cy] = ptOf(a, D, 'waistB', [88, 104]);
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    const pop = sstep(e / 0.4);
    const inHands = sstep((e - 0.6) / 0.4);
    const up = sstep((e - 2.2) / 2.6);
    let x = mix(cx, cx + 3, pop);
    let y = mix(cy, cy - 6, pop) - Math.sin(Math.PI * clamp(e / 0.6, 0, 1)) * 3;
    x = mix(x, hx - 1, inHands);
    y = mix(y, hy - 3, inHands);
    x = mix(x, x + 10 + Math.sin(e * 2.4) * 3, up);
    y = mix(y, y - 30, up);
    babyStar(ctx, x, y, 1.9 * (0.6 + 0.4 * pop), Math.sin(e * 3) * 0.3, 1 - sstep((e - 4.6) / 0.8));
    if (up > 0.05) for (let i = 1; i <= 3; i++) sparkle(ctx, x - Math.sin(e * 2.4 + i) * 2, y + i * 3, 0.8 * (1 - i * 0.25), (1 - sstep((e - 4.6) / 0.8)) * up, STAR[1]);
  }
  // ----- Yarn Comet: the ball swung round on its thread overhead; then flung -----
  if ((q.sling ?? -1) >= 0 && (q.flingS ?? -1) < 0) {
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    // (a sling's circle up over her paw, out in front of her face)
    const an = (a.now ?? 0) * 14;
    const bx = hx + 8 + Math.cos(an) * 5;
    const by = hy - 9 + Math.sin(an) * 5;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(bx, by);
    pen(ctx, NEB[0], 0.5);
    ctx.stroke();
    for (const mode of ['line', 'fill']) yarnBall(ctx, a, mode, bx, by, 2.4, an);
    a.mo.nkSling = [bx, by];
    for (let i = 1; i <= 3; i++) sparkle(ctx, hx + 8 + Math.cos(an - i * 0.5) * 5, hy - 9 + Math.sin(an - i * 0.5) * 5, 0.7 * (1 - i * 0.25), 0.8, NEB[1]);
  }
  if ((q.flingS ?? -1) < 0 && (q.sling ?? -1) < 0) a.mo.nkSling = null;
  if ((q.flingS ?? -1) >= 0 && q.flingS < 0.5) {
    // (the ball itself flies on as the dungeon's shot; here the thread whips out after it)
    const e = q.flingS / 0.5;
    const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
    ctx.save();
    ctx.globalAlpha *= 1 - e;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    for (let i = 1; i <= 8; i++) ctx.lineTo(hx + i * (2 + e * 4), hy + Math.sin(i * 1.1 + e * 10) * 2 * (1 - e) + i * 0.4);
    pen(ctx, NEB[0], 0.7);
    ctx.stroke();
    ctx.restore();
    // (flying on from where the sling let it go)
    const [sx, sy] = a.mo.nkSling ?? [hx + 6, hy];
    const bx = mix(sx, hx + 36, e);
    const by = mix(sy, hy + 6, e) - Math.sin(Math.PI * e) * 5;
    for (const mode of ['line', 'fill']) yarnBall(ctx, a, mode, bx, by, 2.4, e * 14);
  }
  // ----- Needle Jab: little sparkles at the needles' tips -----
  if ((q.jab ?? -1) >= 0 && q.jab < 0.8) {
    for (const [k, t0] of [['N', 0.08], ['F', 0.32]]) {
      const e = (q.jab - t0) / 0.35;
      if (e < 0 || e > 1) continue;
      const n = needleAt(a, D, k);
      sparkle(ctx, n.tip[0] + 1, n.tip[1], 2.2 * Math.sin(Math.PI * e), 1, STAR[1]);
      for (let i = 0; i < 3; i++) {
        const an = -0.8 + i * 0.8;
        sparkle(ctx, n.tip[0] + 1 + Math.cos(an) * e * 6, n.tip[1] + Math.sin(an) * e * 5, 0.8 * (1 - e), 1, NEB[i % 3]);
      }
    }
  }
  // ----- Fleece Puff: wool gathering in; then a burst of wool and little stars round her -----
  const [cx, cy] = ptOf(a, D, 'waistB', [81, 111]);
  if ((q.gather ?? 0) > 0.05) {
    for (let i = 0; i < 5; i++) {
      const f = (t * 1.4 + i / 5) % 1;
      const an = (i / 5) * TAU + t;
      const r = 16 * (1 - f) + 6;
      sparkle(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.7, 0.9, q.gather * Math.sin(Math.PI * f), NEB[i % 3]);
    }
  }
  if ((q.burst ?? -1) >= 0 && q.burst < 0.9) {
    const e = q.burst / 0.9;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU + 0.3;
      const r = 8 + sstep(e) * 20;
      wool(ctx, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.7 - e * 3, 2.2 * (1 - e * 0.6), 1 - sstep((e - 0.5) / 0.5), NEB[i % 3]);
      if (i % 2) babyStar(ctx, cx + Math.cos(an + 0.4) * r * 1.2, cy + Math.sin(an + 0.4) * r * 0.8 - e * 6, 1 * (1 - e * 0.5), e * 4, 1 - sstep((e - 0.6) / 0.4));
    }
  }
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    for (let i = 0; i < 3; i++) wool(ctx, cx - 14 + i * 14 + (i - 1) * e * 6, cy - 4 - e * 6 - (i % 2) * 3, 1.3 * (1 - e * 0.5), 1 - e, NEB[i]);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -4]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -30]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.4 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [12, -38]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  ctx.globalAlpha = base;
}

// The yarn ball (in rig space) where the act has it, or tucked at her side; grown back in after a throw.
function drawBall(ctx, a, mode, S, D) {
  const q = a.nk ?? {};
  const kk = sstep(q.ballK ?? 1);
  if (kk < 0.03 || q.sling >= 0) return;
  const [bx, by] = ballAt(a, D);
  const N = needleAt(a, D, 'N');
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo((bx + N.h[0]) / 2, Math.max(by, N.h[1]) + 2 + (q.slack ?? 1) * 2, N.h[0], N.h[1] + 0.5);
    pen(ctx, tone(a, NEB[0]), 0.45);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(kk, kk);
  yarnBall(ctx, a, mode, 0, 0, 2.4, q.ballSpin ?? 0);
  ctx.restore();
}

const DRESS = {
  id: 'nebulaknitter',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: LW },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      fleece(ctx, a, mode, D);
      drawBall(ctx, a, mode, S, D);
    },
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => {
      cuff(ctx, a, mode, D);
      knitting(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('alpaca', DRESS);
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
rig.h = Math.round(rig.h * BIG * 1.5);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over her head left
// to her, drawn here in her own style)
export const NEBULA_KNITTER_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const NEBULA_KNITTER_SIZE = { w: 32, h: Math.round(R.H * BIG * 1.4), speed: Math.round(R.speed * BIG) };
