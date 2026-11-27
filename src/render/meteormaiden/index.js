// The Meteor Maiden (2026-11-22, the kid monster standard; rebuilt 2026-11-26 to today's standard, the
// id stays `meteorgolem`). Her idea is kept: a fallen-star tomboy, a piece of the star that fell on
// Howling Rock while the sky stood still, who punches rocks for fun and, really, is trying to punch her
// way back up to the sky. Rock gauntlets glowing in their cracks, a comet for a ponytail, a puffy navy
// bomber jacket with gold rib knit open over a white star tee, cuffed shorts, striped knee socks, round
// crater-rock boots, a plaster across her nose and a cocky grin. Rebuilt from scratch on her own copy of
// the kid base (kidrig.js: the kid base is her own body), everything drawn live here: her own hair and
// her own face (nothing of the hero's: no hero hair, no kidHead), her clothes worn, cut to her body.
//   hair    coral, pulled back into a high ponytail: one soft mass from a gold star tie, a gentle S, one
//           smooth taper to a round tip that bursts into the comet's fire (soft round tongues, gold
//           to white at the heart); an even blunt fringe in five sections stopping above her brows; a
//           short side lock outside each eye; one light, one shine band.
//   face    her own "meteor eyes": upturned almonds, a fiery iris banded crimson to orange to gold, a
//           star glint and a round one, a neat lash line with a sporty little wing, no lid over them
//           at rest; thick round-ended brows that do her acting; the plaster; a lopsided grin with a
//           gap in her teeth.
//   walk    her own stroll, kept: the kid walk on her stride (15 px) and kick (3 px), about one and a
//           half strides a second, the heavy gauntlets swinging a little against her legs, her jacket
//           panels kicked by her thighs, the comet streaming after her.
//   idle    a 29 s act in four pieces, each the next one that fits the time she has before she moves on
//           (data `rest`; world/mobs.js tells her, `m.restUntil`):
//           - bump (6.6 s): her gauntlets bumped together in a shower of sparks, a grin, two quick jabs
//             at the air, a hop on her toes like a boxer;
//           - wish (8.0 s): a shooting star overhead: she points, tracks it, hops and waves after it
//             (take me with you!), it's gone; a wistful look up, a sigh, then she shakes it off and
//             grins (the one sincere beat: she wants to go home);
//           - flick (6.4 s): a toss of her head flicks her ponytail, the comet flaring; smug; she
//             presses her plaster down with a thumb;
//           - warmup (7.6 s): an arm stretched across her chest, then the other, a crack of her
//             knuckles in sparks, a bounce from foot to foot.
//   moves   Meteor Smash (a gauntlet hauled up over her head, sparks gathering, the comet flaring;
//           then slammed into the ground: a crater, rubble and sparks; a shake of her hand); Shooting
//           Star (a crouch, her fist low and glowing; then a rising uppercut off the ground, a trail of
//           stars up after it); Comet Combo (fists up; then two quick jabs and a big straight, a pop of
//           sparks off each).
//   else    hurt: a wince, a hand to her plaster; after landing a hit: a fist pump and a cocky grin;
//           hunting you: fists up in a boxer's stance; low on health: panting, a bead of sweat; a nap
//           (habitat): sat cross-legged, dozing, the comet burning low; beaten: dizzy. Her marks over her
//           head (!, ?, z's, sweat) are her own (`ownEmotes`).
// Every effect is drawn here, live, in her own soft style: sparks as round glowing embers (never
// specks), rubble as rounded crater rocks, dust as soft puffs, stars the game's curvy sparkles, the
// comet's fire as soft round tongues.
import { dressRig } from './kidrig.js';
import { bluntBangs, drawBangs, drawPiece, shineBand, foreheadShade } from '../mobs/softhair.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (c, al) => {
  const [r, g, b] = hexRgb(c);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// (a colour, whitened by a hit's flash)
const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a?.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.005 || r <= 0.05) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, al));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function smoothPath(ctx, pts) {
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ctx.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}
function paint(ctx, a, mode, col, ink, w = 6) {
  if (mode === 'line') {
    ctx.strokeStyle = ink;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
}
// ---------- Her colours ----------
const SKIN = { lt: '#fff6ee', base: '#ffe4d2', sh: '#f6c4ac', deep: '#e2a28c' };
const HAIR = ['#ffd2b0', '#ff9a6c', '#e8744c', '#b84e38'];
const HAIR_INK = '#a8463a';
const JACKET = ['#6a74c8', '#3a4292', '#2a3070', '#1e2252'];
const JACKET_INK = '#232860';
const RIB = ['#fff0b0', '#ffcf5a', '#d99a2a'];
const TEE = ['#ffffff', '#fff6ec', '#ecdccc'];
const SHORTS = ['#8a7cb8', '#5c4e8a', '#43386a'];
const SHORTS_INK = '#3a3060';
const SOCK = ['#ffffff', '#ece6f4'];
const STRIPE = '#ffb84a';
const ROCK = ['#c4b6c4', '#8c7c8e', '#665668', '#463a4c'];
const ROCK_INK = '#4a3c50';
const MAGMA = ['#fff4c0', '#ffd25a', '#ff9a3a', '#e8602e'];
const FIRE = ['#fff8e0', '#ffe07a', '#ffb04a', '#ff7a46'];
const LASH = '#3a1a1e';
const IRIS = ['#9a2418', '#d84a20', '#ff8a2a', '#ffcf5a'];
const STAR = '#ffd45c';

// ---------- Frames (kid units; the head in head units) ----------
const SC = 1 / 3;
const HS = 0.72;
const HX = 81;
const HY = 83 - 31 * HS;
const hk = ([u, v]) => [HX + u * HS, HY + v * HS];
const TIE = [-28, -44];
const PONY_B = [-64, -22];
const JOINTS = {
  ponyA: hk(TIE), ponyB: hk(PONY_B), lockF: hk([-34.6, -16]), lockN: hk([35.4, -16]),
  jacF: [69, 88], jacN: [91, 88],
};
const SOFTS = [
  { name: 'ponyA', parent: 'head', pivot: 'ponyA', rot: (S, a) => a.mm?.pony ?? 0, soft: { k: 64, c: 6.2, gain: 0.45, turn: 0.8, hang: 0.45, max: 20, flutter: 1.5, hz: 0.45, dir: [-4, 8] } },
  { name: 'ponyB', parent: 'ponyA', pivot: 'ponyB', rot: (S, a) => (a.mm?.pony ?? 0) * 0.6, soft: { k: 58, c: 5.8, gain: 0.42, turn: 0.8, hang: 0.35, max: 20, flutter: 2.4, hz: 0.6, dir: [2, 9] } },
  { name: 'lockF', parent: 'head', pivot: 'lockF', soft: { k: 110, c: 6.6, gain: 0.45, turn: 0.9, hang: 0.4, max: 10, flutter: 1, hz: 0.5, dir: [0, 6] } },
  { name: 'lockN', parent: 'head', pivot: 'lockN', soft: { k: 118, c: 6.6, gain: 0.45, turn: 0.9, hang: 0.4, max: 10, flutter: 1, hz: 0.56, dir: [0, 6] } },
  { name: 'jacF', parent: 'chest', pivot: 'jacF', rot: (S, a) => (a.mm?.jacF ?? 0) * D2R, soft: { k: 96, c: 6.6, gain: 0.55, turn: 0.9, hang: 0.5, max: 12, dir: [-1, 10] } },
  { name: 'jacN', parent: 'chest', pivot: 'jacN', rot: (S, a) => (a.mm?.jacN ?? 0) * D2R, soft: { k: 104, c: 6.6, gain: 0.55, turn: 0.9, hang: 0.5, max: 12, dir: [1, 10] } },
];
const SOFT_NAMES = SOFTS.map((p) => p.name);
const PIVOT = { chest: 'ribs', waistB: 'navel', torso: 'hip', head: 'neck', armFu: 'shF', armFf: 'elF', armNu: 'shN', armNf: 'elN', handF: 'wrF', handN: 'wrN', thighF: 'hipF', thighN: 'hipN', shinF: 'kneeF', shinN: 'kneeN', footF: 'ankF', footN: 'ankN', ...Object.fromEntries(SOFTS.map((p) => [p.name, p.pivot])) };
function enter(ctx, a, D, bone) {
  ctx.transform(...a.blMat(bone));
  const p = D.J[PIVOT[bone]];
  ctx.translate(-p[0] * SC, -p[1] * SC);
  ctx.scale(SC, SC);
}
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  ctx.translate(HX, HY);
  ctx.scale(HS, HS);
}
const pointIn = (a, D, bone, [x, y]) => D.at(a, bone, [(x - D.J[PIVOT[bone]][0]) * SC, (y - D.J[PIVOT[bone]][1]) * SC]);
const headAt = (a, D, uv) => pointIn(a, D, 'head', hk(uv));
const angOf = (M) => Math.atan2(M[1], M[0]);
const swingOf = (a, name, parent) => {
  const d = angOf(a.blMat(name)) - angOf(a.blMat(parent));
  return Math.atan2(Math.sin(d), Math.cos(d));
};

// ---------- Her face (head units: eyes at y 9, the face's edges at about +-34, chin 33) ----------
// e: open | wide | glare | happy | squeeze | shut | sleep | dizzy | wink; g gaze; b brows [outer, inner]
// (+ lower); m mouth.
const FACES = {
  calm: { e: 'open', g: [1, 0.4], b: [0, 0], m: 'smirk' },
  happy: { e: 'happy', b: [-1.4, -1], m: 'grin' },
  focus: { e: 'glare', g: [2, 0.6], b: [2.8, -1.6], m: 'line' },
  fierce: { e: 'glare', g: [2.2, 0.4], b: [4, -2], m: 'teeth' },
  shout: { e: 'squeeze', b: [3, -1.6], m: 'shout' },
  wonder: { e: 'wide', g: [1.2, -3.2], b: [-3.4, -2.6], m: 'o' },
  cheer: { e: 'happy', b: [-2, -1.4], m: 'shout' },
  smug: { e: 'wink', g: [1.6, 0.2], b: [-1.6, 1], m: 'smirk' },
  wistful: { e: 'open', g: [0.4, -3.4], b: [-2.6, 2.4], m: 'small' },
  sigh: { e: 'shut', b: [-1.6, 1.8], m: 'small' },
  grit: { e: 'squeeze', b: [2.6, -1], m: 'teeth' },
  hurt: { e: 'squeeze', b: [-3, 2.2], m: 'wobble' },
  ow: { e: 'wink', g: [0.8, 0.6], b: [-2.6, 2], m: 'teeth' },
  surprised: { e: 'wide', g: [0.4, -0.4], b: [-4.2, -3.4], m: 'o' },
  worried: { e: 'open', g: [1.2, 1], b: [-3.4, 2.2], m: 'wobble' },
  pant: { e: 'open', g: [1, 1.2], b: [-2.4, 2], m: 'pant' },
  sad: { e: 'open', g: [0.4, 2.4], b: [-3.2, 2.4], m: 'wobble' },
  sleep: { e: 'sleep', b: [0.6, 0.6], m: 'sleepy' },
  shut: { e: 'shut', b: [0, 0], m: 'smirk' },
  dizzy: { e: 'dizzy', b: [-2, 1.6], m: 'wobble' },
  talkA: { e: 'open', g: [1.2, 0.4], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [1.2, 0.4], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [1.2, 0.4], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'cheer', 'shout', 'sigh', 'grit', 'hurt', 'sleep', 'shut', 'dizzy']);
// One eye (head units): an upturned almond; o -1 the far eye, 1 the near (its outer corner that way).
function eye(ctx, a, x, y, o, f) {
  // (drawn a fifth bigger about its middle: big bright eyes for her chibi face)
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.2, 1.2);
  ctx.translate(-x, -y);
  eye0(ctx, a, x, y, o, f);
  ctx.restore();
}
function eye0(ctx, a, x, y, o, f) {
  const P = (dx, dy) => [x + dx * o, y + dy];
  const lineW = 2.3;
  const stroke = (pts, w) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    ctx.strokeStyle = tone(a, LASH);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'happy' : 'open';
  if (kind === 'happy') {
    stroke([P(-6.6, 2.2), P(0.4, -5.2), P(7, 1.4)], lineW);
    stroke([P(6.4, 0.6), P(8.2, -0.8), P(9.2, -2.6)], 1.5);
    return;
  }
  if (kind === 'squeeze') {
    stroke([P(6.8, -3.8), P(0.4, -1), P(-5.4, 0.6)], lineW);
    stroke([P(6.8, 4.2), P(0.4, 1.8), P(-5.4, 0.6)], lineW * 0.85);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke([P(-6.6, 0.6), P(0, kind === 'sleep' ? 4.6 : 3.8), P(7.2, 0)], lineW);
    stroke([P(6.8, 0.2), P(8.6, -0.6), P(9.4, -2.2)], 1.4);
    return;
  }
  const wide = kind === 'wide' ? 1.4 : 0;
  const glare = kind === 'glare' ? 1 : 0;
  // the almond: its top flattened toward her nose when she glares (never a lid over the iris)
  const top = [P(-6.4, 1.2), P(-3.6, -5.8 - wide + glare * 1.6), P(2.2, -7.2 - wide + glare * 0.6), P(7.4, -4.4 - wide * 0.4)];
  const bottom = [P(7.4, -4.4 - wide * 0.4), P(6.4, 3.2), P(1, 6.6 + wide * 0.5), P(-4.4, 5.6), P(-6.4, 1.2)];
  const almond = () => {
    ctx.beginPath();
    ctx.moveTo(...top[0]);
    ctx.bezierCurveTo(...top[1], ...top[2], ...top[3]);
    ctx.bezierCurveTo(...bottom[1], ...bottom[2], ...bottom[3]);
    ctx.quadraticCurveTo(...bottom[4], ...top[0]);
    ctx.closePath();
  };
  almond();
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const an = u * TAU * 1.8 * o;
      const px = x + 0.6 * o + Math.cos(an) * u * 4.6;
      const py = y + 0.4 + Math.sin(an) * u * 4.6;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.strokeStyle = tone(a, IRIS[1]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    stroke([top[0], top[1], top[3]], lineW);
    return;
  }
  ctx.save();
  almond();
  ctx.clip();
  const [gx, gy] = f.g ?? [1, 0.4];
  const ix = x + gx + 0.5 * o;
  const iy = y + 0.6 + gy;
  const ir = wide ? 0.86 : 1;
  // the iris: banded crimson at the top, orange, gold at the bottom, like a meteor's glow
  ell(ctx, ix, iy, 5.2 * ir, 6.4 * ir);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 1.2, 4.6 * ir, 5.2 * ir);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + 2.8, 3.8 * ir, 3 * ir);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + 3.8, 2.6 * ir, 1.6 * ir);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ell(ctx, ix, iy + 0.2, (glare ? 1.3 : 1.8) * ir, 2.6 * ir);
  ctx.fillStyle = tone(a, '#2a0e0a');
  ctx.fill();
  // glints: her star, and a round one
  const sx = ix - 2 * o;
  const sy = iy - 2.6;
  const r = wide ? 3 : 2.4;
  ctx.beginPath();
  ctx.moveTo(sx, sy - r);
  ctx.quadraticCurveTo(sx + r * 0.2, sy - r * 0.2, sx + r, sy);
  ctx.quadraticCurveTo(sx + r * 0.2, sy + r * 0.2, sx, sy + r);
  ctx.quadraticCurveTo(sx - r * 0.2, sy + r * 0.2, sx - r, sy);
  ctx.quadraticCurveTo(sx - r * 0.2, sy - r * 0.2, sx, sy - r);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + 2.2 * o, iy + 2.6, 0.9, 0.9);
  ctx.fill();
  ctx.restore();
  // a neat lash line along the top, a sporty little wing off its outer corner
  stroke([top[0], [lerp(top[1][0], top[2][0], 0.5), Math.min(top[1][1], top[2][1]) - 0.3], top[3]], lineW);
  stroke([P(6.8, -4 - wide * 0.4), P(9, -5.6 - wide * 0.3), P(10, -7.6 - wide * 0.3)], 1.6);
}
function brows(ctx, a, b) {
  const [bo, bi] = b ?? [0, 0];
  for (const o of [-1, 1]) {
    const cx = (o < 0 ? -13 : 15);
    const y0 = -4.6;
    // (thick, round at both ends, angled a little: inner end, a peak, outer end)
    const inner = [cx - 5 * o, y0 + bi * 0.8];
    const peak = [cx + 0.6 * o, y0 - 2 + (bo + bi) * 0.4];
    const outer = [cx + 5.4 * o, y0 - 0.6 + bo * 0.8];
    ctx.beginPath();
    ctx.moveTo(...inner);
    ctx.quadraticCurveTo(...peak, ...outer);
    ctx.strokeStyle = tone(a, '#9a3a2c');
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}
function mouth(ctx, a, m) {
  const x = 3;
  const y = 24;
  const LIP = '#a63a3c';
  const fillM = (pts) => {
    smoothPath(ctx, pts);
    ctx.fillStyle = tone(a, '#a8384a');
    ctx.fill();
  };
  const line = (pts, w = 1.5) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    ctx.strokeStyle = tone(a, LIP);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const teethGap = (y0, h) => {
    for (const [x0, x1] of [[x - 4, x - 0.4], [x + 0.6, x + 4.2]]) {
      smoothPath(ctx, [[x0, y0], [x1, y0], [x1 - 0.2, y0 + h], [x0 + 0.2, y0 + h]]);
      ctx.fillStyle = tone(a, '#ffffff');
      ctx.fill();
    }
  };
  switch (m) {
    case 'grin':
      fillM([[x - 5.4, y - 1.2], [x + 5.6, y - 1.6], [x + 4.2, y + 3], [x, y + 4.6], [x - 4, y + 3]]);
      teethGap(y - 1, 1.8);
      ell(ctx, x, y + 3.1, 2.2, 1.1);
      ctx.fillStyle = tone(a, '#ff8e8a');
      ctx.fill();
      break;
    case 'shout':
      fillM([[x - 5, y - 1.6], [x + 5, y - 1.6], [x + 4.2, y + 3.6], [x, y + 6], [x - 4.2, y + 3.6]]);
      teethGap(y - 1.5, 1.6);
      ell(ctx, x, y + 4.2, 2.6, 1.4);
      ctx.fillStyle = tone(a, '#ff8e8a');
      ctx.fill();
      break;
    case 'teeth':
      fillM([[x - 4, y - 0.6], [x + 4, y - 0.6], [x + 3.4, y + 2.4], [x - 3.4, y + 2.4]]);
      smoothPath(ctx, [[x - 3.4, y - 0.2], [x + 3.4, y - 0.2], [x + 3.2, y + 1.8], [x - 3.2, y + 1.8]]);
      ctx.fillStyle = tone(a, '#ffffff');
      ctx.fill();
      break;
    case 'o':
      fillM([[x - 1.8, y], [x, y - 1], [x + 1.8, y], [x + 1.8, y + 2.6], [x, y + 3.6], [x - 1.8, y + 2.6]]);
      break;
    case 'line':
      line([[x - 3.2, y + 1], [x, y + 0.6], [x + 3.4, y + 0.4]], 1.6);
      break;
    case 'small':
      line([[x - 2, y + 1], [x, y + 1.6], [x + 2, y + 1]], 1.4);
      break;
    case 'wobble':
      line([[x - 4, y + 1], [x - 2, y - 0.3], [x, y + 1], [x + 2, y - 0.3], [x + 4, y + 1]], 1.4);
      break;
    case 'pant':
      fillM([[x - 3, y - 0.6], [x + 3, y - 0.6], [x + 2.2, y + 2.4], [x, y + 3.2], [x - 2.2, y + 2.4]]);
      ell(ctx, x + 0.4, y + 2.4, 1.6, 1.2);
      ctx.fillStyle = tone(a, '#ff8e8a');
      ctx.fill();
      break;
    case 'sleepy':
      fillM([[x - 1.2, y + 0.4], [x, y], [x + 1.2, y + 0.4], [x + 1.2, y + 1.8], [x, y + 2.4], [x - 1.2, y + 1.8]]);
      break;
    case 'talkA':
      fillM([[x - 2.6, y - 0.6], [x + 2.6, y - 0.6], [x + 2, y + 2.8], [x, y + 3.6], [x - 2, y + 2.8]]);
      break;
    case 'talkE':
      fillM([[x - 3.4, y], [x + 3.4, y], [x + 2.6, y + 2], [x - 2.6, y + 2]]);
      break;
    default:
      // the cocky smirk: hiked up on the near side, the corner just open on a tooth
      line([[x - 3.6, y + 1.2], [x - 0.4, y + 1.7], [x + 2.6, y + 0.8], [x + 4.2, y - 0.8], [x + 4.6, y - 1.4]], 1.5);
      smoothPath(ctx, [[x + 2.6, y + 0.4], [x + 4, y - 0.6], [x + 3.8, y + 0.9]]);
      ctx.fillStyle = tone(a, '#ffffff');
      ctx.fill();
  }
}
// The face: a round kid face with a slightly firmer chin, chubby cheeks, her blush and her plaster.
const FACE = [[-33, -12], [-35, 8], [-30, 22], [-17, 30.6], [3, 33.4], [21, 30], [31, 21], [35, 7], [33, -12], [0, -30]];
function faceDraw(ctx, a, mode, f, B) {
  smoothPath(ctx, FACE);
  paint(ctx, a, mode, SKIN.base, SKIN.deep, 6 / HS);
  if (mode !== 'fill') return;
  ctx.save();
  smoothPath(ctx, FACE);
  ctx.clip();
  glow(ctx, -30, 12, 9, SKIN.sh, 0.6);
  foreheadShade(ctx, B, SKIN.sh, 0.7);
  ctx.restore();
  for (const [cx, k] of [[-20, 0.85], [24, 1]]) {
    ell(ctx, cx, 19, 7.4, 4.4);
    ctx.fillStyle = tone(a, '#ffb4b4', 0.5 * k);
    ctx.fill();
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - 2.2 + i * 2.8, 20.4);
      ctx.lineTo(cx - 1 + i * 2.8, 18.4);
      ctx.strokeStyle = tone(a, '#f06a8a', 0.7);
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  eye(ctx, a, -13.2, 9.6, -1, f);
  eye(ctx, a, 15.2, 9.6, 1, f);
  brows(ctx, a, f.b);
  // her plaster across the bridge of her nose: one soft peach strip, a darker pad in its middle
  ctx.save();
  ctx.translate(2.6, 16.2);
  ctx.rotate(-0.22);
  ctx.beginPath();
  ctx.roundRect(-7.2, -2.3, 14.4, 4.6, 2.2);
  ctx.fillStyle = tone(a, '#e8b896');
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-6.7, -1.9, 13.4, 3.8, 1.9);
  ctx.fillStyle = tone(a, '#ffe8d2');
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-2, -1.9, 4, 3.8, 1);
  ctx.fillStyle = tone(a, '#f6d0b4');
  ctx.fill();
  ctx.restore();
  mouth(ctx, a, f.m);
}

// ---------- Her hair (soft hair: one light, an even blunt cut) ----------
const HAIR_H = { C: HAIR, ink: HAIR_INK, tone, lw: 6 / HS, top: -60, bottom: 46 };
// (pulled back tight into her ponytail: the cap hugs her skull, the nape tucked up behind her ears)
const CAP = [[-36.6, -10], [-38, -28], [-31.4, -45], [-17, -54.6], [0, -57.6], [17, -54.6], [31, -45], [38, -28], [36.6, -10], [32.6, -18], [22, -30], [0, -34], [-22, -30], [-32.6, -18]];
const BANGS = bluntBangs({ x0: -31, x1: 31, n: 5, cutMid: -8, rise: 6, seed: 23, top: -42, occl: -35 });
// A side lock framing her cheek, outside her eye: short and soft, its end a round turn inward.
function sideLock(ctx, a, mode, root, len, w, o, swing) {
  ctx.save();
  ctx.translate(root[0], root[1]);
  ctx.rotate(swing);
  const pts = [[-w * 0.45 * o, -12], [w * 0.5 * o, -12], [w * 0.62 * o, len * 0.4], [w * 0.4 * o, len * 0.84], [-w * 0.1 * o, len], [-w * 0.5 * o, len * 0.8], [-w * 0.56 * o, len * 0.36]];
  const H = { ...HAIR_H, top: HAIR_H.top - root[1], bottom: HAIR_H.bottom - root[1] };
  drawPiece(ctx, a, mode, pts, H, (c) => {
    const g = c.createLinearGradient(0, -12, 0, 2);
    g.addColorStop(0, rgba(HAIR[3], 0.4));
    g.addColorStop(1, rgba(HAIR[3], 0));
    c.fillStyle = g;
    c.fillRect(-w, -12, w * 2, 14);
  });
  ctx.restore();
}
// The ponytail (rig space): one soft mass through points on its two springy halves, puffed at the tie,
// a gentle S, one smooth taper to a round tip; lit by her hair's one light; the comet's fire bursting
// off its tip (drawn in the fx pass).
const PONY_A_PTS = [TIE, [-48, -40], PONY_B];
const PONY_B_PTS = [[-70, -2], [-68, 16], [-60, 30]];
const PONY_W = [20, 24, 21, 17, 12, 7];
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
function ponyPts(a, D) {
  const toKid = ([u, v]) => hk([u, v]);
  return [...PONY_A_PTS.map((p) => pointIn(a, D, 'ponyA', toKid(p))), ...PONY_B_PTS.map((p) => pointIn(a, D, 'ponyB', toKid(p)))];
}
function ponytail(ctx, a, mode, D) {
  const pts = ponyPts(a, D);
  const c = spline(pts, 6);
  const ws = c.map((_, i) => {
    const u = (i / (c.length - 1)) * (PONY_W.length - 1);
    const j = Math.min(PONY_W.length - 2, Math.floor(u));
    return lerp(PONY_W[j], PONY_W[j + 1], sstep(u - j)) * HS * SC * 0.5;
  });
  const L = [];
  const R = [];
  for (let i = 0; i < c.length; i++) {
    const p = c[Math.max(0, i - 1)];
    const q = c[Math.min(c.length - 1, i + 1)];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.hypot(dx, dy) || 1;
    L.push([c[i][0] - (dy / d) * ws[i], c[i][1] + (dx / d) * ws[i]]);
    R.push([c[i][0] + (dy / d) * ws[i], c[i][1] - (dx / d) * ws[i]]);
  }
  const e = c[c.length - 1];
  const pe = c[c.length - 2];
  const ang = Math.atan2(L[L.length - 1][1] - e[1], L[L.length - 1][0] - e[0]);
  const out = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
  const ccw = Math.cos(ang - Math.PI / 2 - out) > 0;
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
  ctx.arc(e[0], e[1], ws[ws.length - 1], ang, ang + (ccw ? -Math.PI : Math.PI), ccw);
  for (const p of R.slice().reverse()) ctx.lineTo(...p);
  ctx.closePath();
  if (mode === 'line') {
    ctx.strokeStyle = HAIR_INK;
    ctx.lineWidth = 2 * SC * 3 / 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return c;
  }
  // (her hair's one light: lit from above, deeper toward the tip, which warms to comet gold)
  const top = Math.min(...c.map((p) => p[1]));
  const bot = Math.max(...c.map((p) => p[1]));
  const g = ctx.createLinearGradient(0, top - 1, 0, bot + 1);
  g.addColorStop(0, tone(a, HAIR[0]));
  g.addColorStop(0.3, tone(a, HAIR[1]));
  g.addColorStop(0.75, tone(a, HAIR[2]));
  g.addColorStop(1, tone(a, FIRE[2]));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // the tie's puff lit, a soft shade down its back edge, the shine on the puff
  glow(ctx, c[1][0], c[1][1], 3.4, HAIR[0], 0.7);
  for (let i = 4; i < c.length; i += 3) glow(ctx, R[i][0], R[i][1], 1.6, HAIR[3], 0.3);
  glow(ctx, e[0], e[1], 3, FIRE[1], 0.8 * (a.mm?.flare ?? 0.5));
  ctx.restore();
  return c;
}
// The gold star tie (head units), over the ponytail's root.
function tie(ctx, a, mode) {
  ctx.save();
  ctx.translate(TIE[0], TIE[1]);
  ctx.rotate(-0.3);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 4.2 : 8.6;
    pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
  }
  smoothPath(ctx, pts.map(([px, py], i) => (i % 2 ? [px, py] : [px * 1.06, py * 1.06])));
  paint(ctx, a, mode, STAR, '#b8782a', 3.6);
  if (mode === 'fill') {
    ell(ctx, -1.2, -1.6, 2.6, 2);
    ctx.fillStyle = tone(a, '#fff3c8');
    ctx.fill();
  }
  ctx.restore();
}
function drawHead(ctx, a, mode, S, D) {
  const q = a.mm ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  faceDraw(ctx, a, mode, f, BANGS);
  // her side locks, outside her eyes
  for (const [k, root, o, len] of [['lockF', [-34.6, -16], -1, 30], ['lockN', [35.4, -16], 1, 28]]) sideLock(ctx, a, mode, root, len, 9, o, swingOf(a, k, 'head') * 0.8);
  drawBangs(ctx, a, mode, BANGS, HAIR_H);
  drawPiece(ctx, a, mode, CAP, HAIR_H, (c) => glow(c, -14, -50, 16, HAIR[0], 0.5));
  if (mode === 'fill') shineBand(ctx, a, HAIR_H, [CAP], -46, 2.4, -28, 28);
  tie(ctx, a, mode);
  ctx.restore();
}

// ---------- Her clothes (kid units, in her bones' frames) ----------
// The white tee under her jacket, a star printed on it (in the chest's frame).
function tee(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  smoothPath(ctx, [[69, 86.4], [75, 85], [80.6, 85.6], [86.4, 85], [92, 86.4], [93.6, 96], [93, 105], [80.6, 106.4], [67.6, 105], [67, 96]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, '#c8b8a8', 2);
  } else {
    ctx.fillStyle = tone(a, TEE[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 70, 100, 10, TEE[2], 0.7);
    glow(ctx, 88, 90, 8, TEE[0], 0.9);
    ctx.restore();
    // the star print
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 2.2 : 4.8;
      pts.push([82 + Math.cos(an) * rr, 97 + Math.sin(an) * rr]);
    }
    smoothPath(ctx, pts.map(([px, py], i) => (i % 2 ? [px, py] : [82 + (px - 82) * 1.06, 97 + (py - 97) * 1.06])));
    ctx.fillStyle = tone(a, '#ff8a4a');
    ctx.fill();
  }
  ctx.restore();
}
// The back of her jacket, behind her (its lining in shadow).
function jacketBack(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  smoothPath(ctx, [[65, 86], [80, 84.4], [95, 86], [98, 98], [97.4, 106], [80, 107], [62.6, 106], [62, 98]]);
  paint(ctx, a, mode, JACKET[3], JACKET_INK, 2.2);
  ctx.restore();
}
// A front panel of her jacket (k F / N), hanging open from her shoulder, puffy and quilted, a gold rib
// hem; it swings on its spring.
const PANEL = {
  F: [[64.4, 87], [72.6, 86], [75, 95.6], [74.6, 104.6], [69, 106], [63, 105.6], [62, 96]],
  N: [[86.6, 86], [95.4, 87], [98.4, 96], [97.4, 105.6], [91, 106], [86, 104.6], [85.4, 95.6]],
};
function panel(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `jac${k}`);
  smoothPath(ctx, PANEL[k]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, JACKET_INK, 2.2);
    ctx.restore();
    return;
  }
  const far = k === 'F';
  ctx.fillStyle = tone(a, far ? JACKET[2] : JACKET[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  if (far) glow(ctx, 64, 100, 9, JACKET[3], 0.6);
  else {
    glow(ctx, 94, 92, 8, JACKET[0], 0.7);
    glow(ctx, 88, 104, 7, JACKET[2], 0.5);
  }
  // quilting: two soft seams across
  ctx.strokeStyle = tone(a, JACKET[3], 0.7);
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  for (const y of [94.6, 100]) {
    ctx.beginPath();
    if (far) {
      ctx.moveTo(62.6, y);
      ctx.quadraticCurveTo(68.6, y + 1.2, 75, y + 0.4);
    } else {
      ctx.moveTo(85.4, y + 0.4);
      ctx.quadraticCurveTo(91.6, y + 1.2, 98.2, y);
    }
    ctx.stroke();
  }
  // the gold rib hem
  ctx.fillStyle = tone(a, RIB[1]);
  ctx.fillRect(far ? 61 : 84.6, 102.6, 15, 4.4);
  ctx.strokeStyle = tone(a, RIB[2], 0.7);
  ctx.lineWidth = 0.4;
  for (let x = far ? 62 : 85.6; x < (far ? 76 : 99); x += 1.4) {
    ctx.beginPath();
    ctx.moveTo(x, 102.8);
    ctx.lineTo(x, 106.6);
    ctx.stroke();
  }
  ctx.restore();
  if (!far) {
    // a little gold star pin on her near panel
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 1.1 : 2.4;
      pts.push([92 + Math.cos(an) * rr, 91.4 + Math.sin(an) * rr]);
    }
    smoothPath(ctx, pts);
    ctx.fillStyle = tone(a, STAR);
    ctx.fill();
  }
  ctx.restore();
}
// The rib-knit collar round her neck (in the chest's frame), the neck's soft shadow under her chin.
function collar(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  ctx.beginPath();
  ctx.moveTo(66.6, 86);
  ctx.quadraticCurveTo(80.6, 92.4, 94.6, 86);
  if (mode === 'line') {
    ctx.strokeStyle = '#b8782a';
    ctx.lineWidth = 5.8;
    ctx.lineCap = 'round';
    ctx.stroke();
  } else {
    ctx.strokeStyle = tone(a, RIB[1]);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = tone(a, RIB[0], 0.7);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(68, 85.6);
    ctx.quadraticCurveTo(80.6, 91.2, 93.2, 85.6);
    ctx.stroke();
  }
  ctx.restore();
}
// A puffy jacket sleeve along an arm bone (p0 to p1, game px), a gold rib cuff at the wrist.
function sleeve(ctx, a, mode, p0, p1, w0, w1, col, cuff) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  ctx.beginPath();
  ctx.moveTo(p0[0] + nx * w0 * 0.5 * SC, p0[1] + ny * w0 * 0.5 * SC);
  ctx.lineTo(p1[0] + nx * w1 * 0.5 * SC, p1[1] + ny * w1 * 0.5 * SC);
  ctx.arc(p1[0], p1[1], w1 * 0.5 * SC, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
  ctx.lineTo(p0[0] - nx * w0 * 0.5 * SC, p0[1] - ny * w0 * 0.5 * SC);
  ctx.arc(p0[0], p0[1], w0 * 0.5 * SC, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
  ctx.closePath();
  if (mode === 'line') return paint(ctx, a, 'line', null, JACKET_INK, 0.75);
  ctx.fillStyle = tone(a, col);
  ctx.fill();
  ctx.strokeStyle = tone(a, JACKET[3], 0.8);
  ctx.lineWidth = 0.18;
  ctx.stroke();
  if (cuff) {
    const cx = p1[0] - (dx / L) * 0.7;
    const cy = p1[1] - (dy / L) * 0.7;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w1 * 0.56 * SC, w1 * 0.3 * SC, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU);
    ctx.fillStyle = tone(a, RIB[1]);
    ctx.fill();
  }
}
function drawSleeve(ctx, a, mode, S, D, k) {
  const far = k === 'F';
  for (const [bone, from, to, w0, w1] of [[`arm${k}u`, `sh${k}`, `el${k}`, 11.4, 10.4], [`arm${k}f`, `el${k}`, `wr${k}`, 10.4, 10.8]]) {
    ctx.save();
    D.frame(ctx, a, bone);
    sleeve(ctx, a, mode, D.loc(from, bone), D.loc(to, bone), w0, w1, far ? JACKET[2] : JACKET[1], bone.endsWith('f'));
    ctx.restore();
  }
}
// A crater-rock gauntlet (in the hand's frame, kid units): a round fist swallowing her wrist, craters,
// a crack glowing with magma.
function gauntlet(ctx, a, mode, D, k) {
  const q = a.mm ?? {};
  const far = k === 'F';
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const [wx, wy] = D.J[`wr${k}`];
  const open = (k === 'N' ? q.openN : q.openF) ?? 0;
  const glowK = (k === 'N' ? q.glowN : q.glowF) ?? 0.4;
  // the cuff over her wrist and the round fist (an open hand: three round fingers spread)
  const fist = [[wx - 7.4, wy - 1.6], [wx + 6.6, wy - 2.4], [wx + 9, wy + 4.6], [wx + 6.6, wy + 11.6], [wx - 5, wy + 12], [wx - 8.6, wy + 5.6]];
  smoothPath(ctx, fist);
  paint(ctx, a, mode, far ? ROCK[2] : ROCK[1], ROCK_INK, 2.4);
  if (open > 0.05) {
    for (let i = -1; i <= 1; i++) {
      smoothPath(ctx, [[wx + i * 3.6 - 1.6, wy + 9], [wx + i * 3.6 + 1.6, wy + 9], [wx + i * 3.9 + 1.4, wy + 9 + 5 * open], [wx + i * 3.9 - 1.4, wy + 9 + 5 * open]]);
      paint(ctx, a, mode, far ? ROCK[2] : ROCK[1], ROCK_INK, 2.4);
    }
  }
  if (mode === 'fill') {
    ctx.save();
    smoothPath(ctx, fist);
    ctx.clip();
    glow(ctx, wx + 2.4, wy + 1.6, 5.4, far ? ROCK[1] : ROCK[0], 0.8);
    glow(ctx, wx - 6, wy + 9, 6, far ? ROCK[3] : ROCK[2], 0.7);
    for (const [cx, cy, r] of [[wx - 3, wy + 6, 1.6], [wx + 4, wy + 8, 1.2]]) {
      ell(ctx, cx, cy, r, r * 0.8);
      ctx.fillStyle = tone(a, far ? ROCK[3] : ROCK[2]);
      ctx.fill();
      ell(ctx, cx + 0.4, cy - 0.3, r * 0.8, r * 0.4);
      ctx.fillStyle = tone(a, far ? ROCK[2] : ROCK[0], 0.8);
      ctx.fill();
    }
    // the knuckle line and the glowing crack
    ctx.beginPath();
    ctx.moveTo(wx - 5.6, wy + 9.4);
    ctx.quadraticCurveTo(wx, wy + 11.2, wx + 5.6, wy + 9.2);
    ctx.strokeStyle = tone(a, far ? ROCK[3] : ROCK[2]);
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx + 1, wy);
    ctx.quadraticCurveTo(wx + 2.8, wy + 3.4, wx + 0.8, wy + 6.4);
    ctx.quadraticCurveTo(wx + 0.2, wy + 8, wx + 1.8, wy + 9.6);
    ctx.strokeStyle = tone(a, MAGMA[2]);
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.stroke();
    glow(ctx, wx + 1.6, wy + 4.6, 3 + glowK * 4, MAGMA[1], 0.25 + glowK * 0.5);
    ctx.restore();
  }
  ctx.restore();
}
// Her cuffed shorts: the hips (in the torso's frame) and a leg each (in the thigh's frame), so they
// follow her legs.
function shortsTop(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  smoothPath(ctx, [[66, 100.6], [80, 100], [94, 100.6], [95.6, 108], [91, 110.6], [80, 111.4], [69, 110.6], [64.4, 108]]);
  paint(ctx, a, mode, SHORTS[1], SHORTS_INK, 2.2);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, 90, 102, 7, SHORTS[0], 0.6);
    glow(ctx, 68, 108, 7, SHORTS[2], 0.6);
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(81, 102);
    ctx.lineTo(81.2, 109.6);
    ctx.strokeStyle = tone(a, SHORTS[2]);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  ctx.restore();
}
function shortsLeg(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `thigh${k}`);
  const x = k === 'F' ? 73 : 87;
  const far = k === 'F';
  smoothPath(ctx, [[x - 6.6, 104], [x + 6.6, 104], [x + 7.2, 117.6], [x - 7.2, 117.6]]);
  paint(ctx, a, mode, far ? SHORTS[2] : SHORTS[1], SHORTS_INK, 2.2);
  if (mode === 'fill') {
    // the turned-up cuff
    smoothPath(ctx, [[x - 7.4, 114.6], [x + 7.4, 114.6], [x + 7.4, 118.4], [x - 7.4, 118.4]]);
    ctx.fillStyle = tone(a, far ? SHORTS[1] : SHORTS[0]);
    ctx.fill();
  }
  ctx.restore();
}
// Her striped knee socks (in the shin's frame).
function sock(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, `shin${k}`);
  const x = k === 'F' ? 73 : 87;
  const far = k === 'F';
  smoothPath(ctx, [[x - 3.9, 125.4], [x + 3.9, 125.4], [x + 3.7, 139], [x - 3.7, 139]]);
  ctx.fillStyle = tone(a, far ? SOCK[1] : SOCK[0]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = tone(a, far ? '#e8a240' : STRIPE);
  for (const y of [127.4, 130.6]) ctx.fillRect(x - 5, y, 10, 1.5);
  glow(ctx, x - 3, 133, 3, '#c8c2da', 0.5);
  ctx.restore();
  ctx.restore();
}
// Her round crater-rock boots (in the foot's frame).
function boot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const x = k === 'F' ? 73 : 87;
  const far = k === 'F';
  const pts = [[x - 5.2, 134.4], [x + 3.4, 134.6], [x + 9, 139.6], [x + 9.6, 144.4], [x + 8, 146.6], [x - 5.2, 146.6], [x - 6.2, 141]];
  smoothPath(ctx, pts);
  paint(ctx, a, mode, far ? ROCK[2] : ROCK[1], ROCK_INK, 2.4);
  if (mode === 'fill') {
    ctx.save();
    smoothPath(ctx, pts);
    ctx.clip();
    ctx.fillStyle = tone(a, far ? ROCK[3] : ROCK[2]);
    ctx.fillRect(x - 8, 144.6, 20, 4);
    glow(ctx, x + 2, 138, 4, far ? ROCK[1] : ROCK[0], 0.8);
    ell(ctx, x + 5.4, 141.4, 1.1, 0.9);
    ctx.fillStyle = tone(a, far ? ROCK[3] : ROCK[2]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 6, 138.6);
    ctx.quadraticCurveTo(x + 7.6, 140.4, x + 7, 142.6);
    ctx.strokeStyle = tone(a, MAGMA[2]);
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- Her act and fight ----------
const PIECES = { bump: 6.6, wish: 8.0, flick: 6.4, warmup: 7.6 };
const ORDER = ['bump', 'wish', 'flick', 'warmup'];
const POOL = ['smash', 'uppercut', 'combo'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, pony: 0, flare: 0.5, jacF: 0, jacN: 0, openN: 0, openF: 0, glowN: 0.4, glowF: 0.4, sparks: -1, jabs: [], star: -1, wave: 0, gather: 0, crater: -1, trail: -1, pops: [], zz: 0, sweat: -1, pant: 0, knuckles: -1 };
  a.mm = q;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const add = (p, k) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + val * k;
  };
  const say = (f, k) => {
    if (k > 0.45) q.face = f;
  };
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const alive = m.hp > 0;
  const br = c.breath ?? 0;
  // Standing: her weight on one leg, the heavy fists hanging loose, a slow breath; a slow shift.
  const sway = Math.sin(t * 0.55);
  go({ shF: 8 + br * 2, elF: -14, hwF: 6, shN: -8 - br * 2, elN: -16, hwN: 6, tilt: sway * 1.4, head: -sway * 1.2 + Math.sin(t * 0.7) * 1.6 }, 1 - walking);
  // Her stroll (her own walk, kept): the heavy fists swinging a little against her legs, the elbows
  // folding as each fist comes forward, the head a beat behind; the comet streaming after her.
  const u = a.blkidU ?? 0;
  const p = u * TAU;
  const fold = (v) => (1 - Math.cos(v)) / 2;
  go({ shF: -4 - Math.cos(p - 0.15) * 18, elF: 12 - fold(p - 0.4) * 14, shN: -4 + Math.cos(p - 0.15) * 18, elN: -16 - fold(p - 0.4 + Math.PI) * 14, tilt: 2.5 + Math.sin(p - 0.5) * 1.4 }, walking);
  q.pony = (0.12 + Math.sin(p * 2 - 1) * 0.06) * walking;
  q.jacF = Math.sin(p + Math.PI) * 6 * walking;
  q.jacN = Math.sin(p) * 6 * walking;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.mmWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.2;
  if ((wind > 0 || striking) && alive) {
    if (!st.mmAtk) {
      const pool = m.def.moves ?? POOL;
      st.mmN = (st.mmN ?? m.uid ?? 0) + 1;
      st.mmMove = m.move ?? pool[st.mmN % pool.length];
    }
    st.mmAtk = true;
  } else st.mmAtk = false;
  const mvName = st.mmAtk ? st.mmMove : null;
  const hadWind = now - (st.mmWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.mmCalm = lerp(st.mmCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.mmCalm);
  let PC = st.mmPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.mmOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.mmOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.mmOrd = (st.mmOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.mmPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'bump') {
    // her gauntlets out, then bumped together in front of her: sparks
    const out1 = win(pu, 0.2, 0.6, 1.8, 2.0);
    go({ shF: 40, elF: 30, shN: -44, elN: -30 }, out1 * k);
    const inW = win(pu, 0.75, 1.0, 1.6, 1.9);
    go({ shF: 2, elF: -118, shN: 8, elN: -128, head: 4 }, inW * k);
    const bump = pulse(pu, 1.0, 0.3);
    add({ lift: -bump * 0.01, head: bump * 4 }, k);
    if (pu > 1.0 && pu < 1.9) q.sparks = pu - 1.0;
    q.glowN += 0.5 * inW * k;
    q.glowF += 0.5 * inW * k;
    say('happy', win(pu, 1.0, 1.1, 2.0, 2.2) * k);
    // two quick jabs at the air, a hop on her toes
    const box = win(pu, 2.4, 2.7, 4.6, 5.0);
    go({ shN: -40, elN: -110, shF: -30, elF: -120, tilt: 3, lift: -0.012 }, box * k);
    for (const [t0, i] of [[3.0, 0], [3.5, 1]]) {
      const j = pulse(pu, t0, 0.24);
      add({ shN: -50 * j, elN: 100 * j, x: 0.03 * j, tilt: 4 * j }, k);
      if (pu > t0 + 0.08 && pu < t0 + 0.5) q.jabs.push({ e: (pu - t0 - 0.08) / 0.42, i });
    }
    add({ lift: Math.abs(Math.sin((pu - 2.6) * 7.4)) * 0.025 * box }, k);
    say('focus', box * k);
    say('smug', win(pu, 5.0, 5.2, 6.2, 6.5) * k);
  }
  if (k > 0.001 && piece === 'wish') {
    // a shooting star overhead: she spots it, points, tracks it across the sky
    if (pu > 0.3 && pu < 3.4) q.star = pu - 0.3;
    const look = win(pu, 0.3, 0.6, 3.2, 3.6);
    go({ head: -16, neckR: -4, chest: -3 }, look * k);
    say('wonder', win(pu, 0.4, 0.5, 1.6, 1.8) * k);
    const point = win(pu, 0.7, 1.0, 1.8, 2.1);
    go({ shN: -150, elN: -12, hwN: -20 }, point * k);
    // hops and waves after it: take me with you!
    const hopW = win(pu, 1.9, 2.0, 3.0, 3.2);
    go({ shN: -160, elN: -30 + Math.sin(pu * 14) * 30, shF: -150, elF: -40 }, hopW * k);
    q.openN = Math.max(q.openN, hopW * k);
    for (const t0 of [2.0, 2.5]) add({ hop: pulse(pu, t0, 0.4) * 0.07 }, k);
    say('cheer', hopW * k);
    // it's gone: a wistful look up, a sigh (she wants to go home)
    const wist = win(pu, 3.4, 3.7, 5.4, 5.8);
    go({ head: -12, shN: -10, elN: -20, shF: 6, elF: -14, tilt: -2 }, wist * k);
    say('wistful', wist * k);
    const sigh = win(pu, 4.8, 5.0, 5.7, 5.9);
    add({ chest: Math.sin(Math.PI * clamp((pu - 4.8) / 1.0, 0, 1)) * 5, head: 8 * sigh }, k);
    say('sigh', sigh * k);
    q.flare -= 0.3 * Math.max(wist, sigh) * k;
    // then she shakes it off and grins
    const shake = win(pu, 5.9, 6.0, 6.6, 6.8);
    add({ head: Math.sin(pu * 22) * 8 * shake }, k);
    say('shut', shake * k);
    const grin = win(pu, 6.8, 7.0, 7.7, 8.0);
    go({ shN: -120, elN: -90, hwN: -10 }, grin * k);
    say('happy', grin * k);
  }
  if (k > 0.001 && piece === 'flick') {
    // a toss of her head flicks her ponytail; the comet flares
    const wind1 = win(pu, 0.2, 0.5, 0.6, 0.7);
    const toss = win(pu, 0.6, 0.75, 1.0, 1.4);
    go({ head: 10, neckR: 3 }, wind1 * k);
    go({ head: -14, neckR: -4, tilt: -3 }, toss * k);
    // (whipped out back behind her, never forward over her face)
    q.pony += (-0.2 * wind1 + 0.75 * toss) * k;
    q.flare += 0.9 * win(pu, 0.7, 0.8, 1.6, 2.2) * k;
    say('smug', win(pu, 0.8, 1.0, 3.2, 3.4) * k);
    go({ shN: -60, elN: -120, hwN: 20 }, win(pu, 1.2, 1.5, 3.0, 3.4) * k);
    // presses her plaster down with a thumb
    const plaster = win(pu, 3.6, 4.0, 4.9, 5.3);
    go({ shN: -98, elN: -134, hwN: -20, head: 4 }, plaster * k);
    say('ow', win(pu, 4.0, 4.1, 4.7, 4.8) * k);
    say('calm', win(pu, 5.2, 5.3, 6.2, 6.4) * k);
  }
  if (k > 0.001 && piece === 'warmup') {
    // an arm across her chest, then the other
    const a1 = win(pu, 0.2, 0.6, 1.6, 1.9);
    go({ shN: -86, elN: -40, shF: -40, elF: -120, chest: 4, head: -4 }, a1 * k);
    const a2 = win(pu, 1.9, 2.3, 3.3, 3.6);
    go({ shF: -86, elF: -40, shN: -40, elN: -120, chest: -4, head: 4 }, a2 * k);
    say('focus', Math.max(a1, a2) * k);
    // a crack of her knuckles in sparks
    const crack = win(pu, 3.8, 4.1, 4.6, 4.9);
    go({ shF: 2, elF: -118, shN: 8, elN: -128, head: 6 }, crack * k);
    if (pu > 4.2 && pu < 5.0) q.knuckles = pu - 4.2;
    say('smug', crack * k);
    // a bounce from foot to foot, fists up
    const bounce = win(pu, 5.0, 5.3, 7.0, 7.5);
    go({ shN: -40, elN: -110, shF: -30, elF: -120 }, bounce * k);
    add({ lift: Math.abs(Math.sin((pu - 5.0) * 7)) * 0.03 * bounce, x: Math.sin((pu - 5.0) * 3.5) * 0.02 * bounce, tilt: Math.sin((pu - 5.0) * 3.5) * 3 * bounce }, k);
    say('happy', bounce * k);
  }
  q.calm = cw;

  // (her own marks over her head)
  if (fighting && alive && !st.mmHunt) st.mmBangAt = now;
  if (!fighting && st.mmHunt && alive) st.mmLostAt = now;
  st.mmHunt = fighting && alive;
  q.bang = now - (st.mmBangAt ?? -9);
  q.huh = now - (st.mmLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: fists up in a boxer's stance -----
  if (fighting && alive && !hurt) {
    go({ shN: -44, elN: -112, shF: -34, elF: -122, tilt: 4, head: 3, lift: -0.012 }, 1 - walking * 0.5);
    q.face = 'fierce';
    q.glowN += 0.3;
    q.glowF += 0.3;
  }
  if (low && !busy) {
    q.face = q.face ?? 'pant';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Her moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.6) / 0.45) : 0;
    const snap = s >= 0 ? sstep(s / 0.09) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'smash') {
      // a gauntlet hauled up over her head, sparks gathering, the comet flaring
      go({ x: -0.03, lift: -0.02, tilt: -12, head: -8, shF: 50, elF: 20, shN: -168, elN: -24 }, wu);
      q.gather = wu;
      q.glowN += 1.2 * wu;
      q.flare += 0.8 * wu;
      q.pony += 0.3 * wu;
      say('focus', W);
      // then slammed into the ground: a crater, rubble and sparks; a shake of her hand
      go({ x: 0.08, lift: -0.06, tilt: 24, head: 10, shF: 70, elF: 30, shN: -24, elN: -4 }, snap * sw);
      // (her comet streaming out back behind her as she drives down, never forward over her face)
      q.pony += 0.7 * snap * sw;
      say('shout', snap * win(s, 0, 0.02, 0.32, 0.4));
      if (s >= 0) q.crater = s;
      const shake = s > 0.4 && s < 1.1 ? Math.sin((Math.PI * (s - 0.4)) / 0.7) : 0;
      add({ elN: Math.sin(now * 40) * 14 * shake }, 1);
      say('ow', shake > 0.3 ? 1 : 0);
    } else if (mvName === 'uppercut') {
      // a crouch, her fist low and glowing
      go({ lift: -0.07, tilt: 10, head: 4, shN: 30, elN: -60, shF: -30, elF: -100, x: -0.02 }, wu);
      q.glowN += 1.2 * wu;
      q.gather = wu * 0.7;
      say('grit', W);
      // then a rising uppercut off the ground, a trail of stars up after it
      if (s >= 0) {
        const rise = win(s, 0, 0.06, 0.22, 0.5);
        go({ lift: 0.02, tilt: -14, head: -12, shN: -160, elN: -40, shF: -20, elF: -70, x: 0.05 }, rise * sw);
        add({ hop: pulse(s, 0, 0.45) * 0.1 }, sw);
        q.pony += 0.7 * rise * sw + 0.4 * sw;
        q.trail = s;
        say('shout', win(s, 0, 0.02, 0.3, 0.4));
        say('happy', win(s, 0.45, 0.55, 0.9, 1.0));
      }
    } else {
      // fists up
      go({ shN: -44, elN: -112, shF: -34, elF: -122, tilt: 4, head: 3 }, wu);
      say('focus', W);
      // two quick jabs and a big straight
      if (s >= 0) {
        const j1 = pulse(s, 0, 0.2);
        const j2 = pulse(s, 0.18, 0.2);
        const big = win(s, 0.36, 0.44, 0.6, 0.85);
        go({ shN: -44, elN: -112, shF: -34, elF: -122, tilt: 4 }, sw);
        add({ shN: -50 * j1, elN: 100 * j1, x: 0.03 * j1, tilt: 4 * j1 }, sw);
        add({ shF: -56 * j2, elF: 110 * j2, x: 0.03 * j2, tilt: 5 * j2 }, sw);
        go({ shN: -92, elN: -4, x: 0.07, tilt: 12, head: 4, fxN: 0.3 }, big * sw);
        for (const [t0, i] of [[0.05, 0], [0.23, 1], [0.44, 2]]) if (s > t0 && s < t0 + 0.45) q.jabs.push({ e: (s - t0) / 0.45, i, big: i === 2 });
        say('shout', win(s, 0, 0.02, 0.6, 0.7));
      }
    }
  }
  // (her jacket panels kicked by a knee that lifts or a leg that strides out under them)
  q.jacN -= clamp((out.fyN ?? 0) * 40 + Math.max(0, out.fxN ?? 0) * 22, 0, 26);
  q.jacF -= clamp((out.fyF ?? 0) * 40 + Math.max(0, out.fxF ?? 0) * 22, 0, 24);
  for (const key of ['jacF', 'jacN']) {
    st[`mm_${key}`] = lerp(st[`mm_${key}`] ?? q[key], q[key], ease(18));
    q[key] = st[`mm_${key}`];
  }
  // ----- Hurt: a wince, a hand to her plaster -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -98, elN: -134, hwN: -20, lift: -0.02 }, kh);
    q.face = 'hurt';
  }
  // ----- After landing a hit: a fist pump and a cocky grin -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.6) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.8, 1.1) * (1 - moveW);
    go({ shN: -150, elN: -60, tilt: -3, head: -6 }, kg);
    add({ elN: Math.sin(gl * 18) * 16 * kg }, 1);
    say('happy', kg);
  }
  // ----- A nap (her habitat): sat cross-legged, dozing, the comet burning low -----
  st.mmNap = lerp(st.mmNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.mmNap);
  if (nw > 0.001) {
    go({ lift: -0.13, tilt: 3, head: 15 + Math.sin(now * 1.5) * 3, neckR: 4, shN: -30, elN: -80, shF: -20, elF: -84, fxN: 0.28, fyN: 0.02, fxF: -0.18, toeN: -20, toeF: 20 }, nw);
    q.flare -= 0.4 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
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
    q.flare = 0.1;
  }
  // ----- The face: an in-between (a blink) on every change; her own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.mmFace) {
    st.mmFaceFrom = st.mmFace;
    st.mmFace = f;
    st.mmFaceAt = now;
  }
  const since0 = now - (st.mmFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.mmFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.mmFaceFrom) && !(talky(f) && talky(st.mmFaceFrom))) f = 'shut';
  const P = 2.9 + ((m.uid ?? 0) % 7) * 0.35;
  if ((now + ((m.uid ?? 0) % 5) * 0.8) % P < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  for (const key of ['pony', 'flare', 'glowN', 'glowF', 'openN']) {
    st[`mm_${key}`] = lerp(st[`mm_${key}`] ?? q[key], q[key], ease(key === 'pony' ? 12 : 10));
    q[key] = st[`mm_${key}`];
  }
}

// ---------- Live effects (rig space, game px, her feet at 0, 0) ----------
// A spark: a soft round glowing ember, gold at its heart (never a speck).
function ember(ctx, x, y, r, al, col = MAGMA[2]) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.6, col, 0.5);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = MAGMA[1];
  ctx.fill();
  ell(ctx, x - r * 0.2, y - r * 0.2, r * 0.5, r * 0.5);
  ctx.fillStyle = MAGMA[0];
  ctx.fill();
  ctx.restore();
}
function sparkle(ctx, x, y, s, al = 1, col = '#fff3c8') {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, s * 1.6, col, 0.45);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x + s * 0.16, y - s * 0.16, x + s, y);
  ctx.quadraticCurveTo(x + s * 0.16, y + s * 0.16, x, y + s);
  ctx.quadraticCurveTo(x - s * 0.16, y + s * 0.16, x - s, y);
  ctx.quadraticCurveTo(x - s * 0.16, y - s * 0.16, x, y - s);
  ctx.fill();
  ctx.restore();
}
// A rounded crater rock flying (rubble).
function rock(ctx, x, y, r, ang, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  smoothPath(ctx, [[-r, -r * 0.5], [r * 0.2, -r], [r, -r * 0.2], [r * 0.7, r * 0.8], [-r * 0.6, r * 0.9]]);
  ctx.strokeStyle = ROCK_INK;
  ctx.lineWidth = Math.max(0.3, r * 0.3);
  ctx.stroke();
  ctx.fillStyle = ROCK[1];
  ctx.fill();
  ell(ctx, -r * 0.2, -r * 0.3, r * 0.5, r * 0.3);
  ctx.fillStyle = ROCK[0];
  ctx.fill();
  ctx.restore();
}
function dust(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const pass of ['line', 'fill']) {
    for (const [dx, dy, kk] of [[0, 0, 1], [r * 0.7, -r * 0.3, 0.7], [-r * 0.6, -r * 0.4, 0.6]]) {
      ell(ctx, x + dx, y + dy, r * kk, r * kk * 0.86);
      if (pass === 'line') {
        ctx.strokeStyle = '#c8b8c4';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      } else {
        ctx.fillStyle = '#f2e8e6';
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
// The comet's fire off her ponytail's tip: soft round tongues streaming back, gold to white at the
// heart, flickering on their own beats.
function comet(ctx, a, x, y, dir, k, t) {
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);
  for (const [col, sz] of [[FIRE[3], 1], [FIRE[2], 0.78], [FIRE[1], 0.55], [FIRE[0], 0.3]]) {
    for (let i = 0; i < 3; i++) {
      const fl = Math.sin(t * (6 + i * 2.3) + i * 2) * 0.5;
      const len = (6.4 + i * 1.6 + fl) * sz * (0.6 + 0.4 * k);
      const w = (2.6 - i * 0.5) * sz * (0.7 + 0.3 * k);
      const off = (i - 1) * 1.3 * sz;
      ctx.beginPath();
      ctx.moveTo(-0.4, off - w);
      ctx.quadraticCurveTo(len * 0.5, off - w * 0.9 + fl * 0.5, len, off + fl * 0.4);
      ctx.quadraticCurveTo(len * 0.5, off + w * 0.9 + fl * 0.5, -0.4, off + w);
      ctx.arc(-0.4, off, w, Math.PI / 2, -Math.PI / 2, false);
      ctx.closePath();
      ctx.fillStyle = tone(a, col);
      ctx.fill();
    }
  }
  ctx.restore();
  glow(ctx, x, y, 5 * (0.6 + 0.4 * k), FIRE[1], 0.4 * k);
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
  ctx.strokeStyle = '#c86a4a';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#fff4e8';
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
    smoothPath(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      ctx.strokeStyle = JACKET_INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffaf2';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#ff6a4a' : '#5a5aa8';
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
function sweat(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.4);
  ctx.quadraticCurveTo(x + s, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s, y + s * 0.2, x, y - s * 1.4);
  ctx.fillStyle = '#bfe8ff';
  ctx.fill();
  ctx.strokeStyle = '#7ab8dc';
  ctx.lineWidth = s * 0.25;
  ctx.stroke();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  // (every loose piece swung once a frame, drawn or not, so none of them ever skips time)
  for (const n of SOFT_NAMES) a.blMat(n);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.mm ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  const handPt = (k) => pointIn(a, D, `hand${k}`, [D.J[`wr${k}`][0], D.J[`wr${k}`][1] + 6]);
  // the comet's fire off her ponytail's tip, a few stars shed off it
  const pp = ponyPts(a, D);
  const tip = pp[pp.length - 1];
  const pre = pp[pp.length - 2];
  const dir = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
  comet(ctx, a, tip[0], tip[1], dir, clamp(q.flare ?? 0.5, 0, 1.6), t);
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -64]);
    for (let i = 0; i < 3; i++) {
      const an = (a.now ?? 0) * 3.2 + (i * TAU) / 3;
      const px = hx + Math.cos(an) * 7;
      const py = hy + Math.sin(an) * 2.2;
      if (i % 2) sparkle(ctx, px, py, 1.8, Math.sin(an) > 0 ? 1 : 0.6, FIRE[1]);
      else ember(ctx, px, py, 0.9, Math.sin(an) > 0 ? 1 : 0.6);
    }
    return;
  }
  for (let i = 0; i < 2; i++) {
    const P = 0.9 + i * 0.3;
    const f = (((t + i * 0.45) % P) + P) % P / P;
    sparkle(ctx, tip[0] + Math.cos(dir) * (2 + f * 5) + i * 1.4, tip[1] + Math.sin(dir) * (2 + f * 5) - f * 3, 1.1 * (1 - f), (1 - f) * clamp(q.flare ?? 0.5, 0.2, 1), FIRE[1]);
  }
  // little embers rising off her gauntlets' cracks now and then
  for (const [k2, ph] of [['N', 0], ['F', 0.8]]) {
    const [hx, hy] = handPt(k2);
    const P = 1.7;
    const f = ((((t + ph) % P) + P) % P) / P;
    if (f < 0.7) ember(ctx, hx + 0.6 + Math.sin(f * 9) * 1.2, hy - 2 - f * 8, 0.45 * (1 - f * 0.5), 0.8 * (1 - f / 0.7));
  }
  // the bump: a shower of sparks off her fists
  if ((q.sparks ?? -1) >= 0) {
    const [hx, hy] = handPt('N');
    const e = q.sparks / 0.9;
    for (let i = 0; i < 7; i++) {
      const an = -Math.PI / 2 + (i - 3) * 0.45;
      const r = 3 + e * 10;
      ember(ctx, hx - 1 + Math.cos(an) * r, hy - 1 + Math.sin(an) * r + e * e * 6, 0.7 * (1 - e), 1 - e);
    }
    sparkle(ctx, hx - 1, hy - 2, 3 * Math.sin(Math.PI * clamp(e * 2, 0, 1)), 1, FIRE[1]);
  }
  if ((q.knuckles ?? -1) >= 0) {
    const [hx, hy] = handPt('N');
    for (let i = 0; i < 3; i++) {
      const e = clamp((q.knuckles - i * 0.18) / 0.35, 0, 1);
      if (e > 0 && e < 1) sparkle(ctx, hx + (i - 1) * 2.4, hy - 3 - e * 3, 1.4 * Math.sin(Math.PI * e), 1, FIRE[1]);
    }
  }
  // jabs: a little pop of sparks out in front of each punch
  for (const j of q.jabs ?? []) {
    const [hx, hy] = handPt(j.i === 1 ? 'F' : 'N');
    const e = j.e;
    const big = j.big ? 1.6 : 1;
    sparkle(ctx, hx + 3, hy, 2 * big * Math.sin(Math.PI * e), 1, FIRE[1]);
    for (let i = 0; i < 3; i++) {
      const an = -0.6 + i * 0.6;
      ember(ctx, hx + 3 + Math.cos(an) * e * 6 * big, hy + Math.sin(an) * e * 5 * big, 0.5 * big * (1 - e), 1 - e);
    }
  }
  // the shooting star she wishes on, streaking across the sky over her
  if ((q.star ?? -1) >= 0) {
    const u = clamp(q.star / 3, 0, 1);
    const [hx, hy] = headAt(a, D, [0, -60]);
    const x = hx + 24 - u * 40;
    const y = hy - 10 + u * 6;
    const al = Math.sin(Math.PI * u);
    sparkle(ctx, x, y, 2.4, al, FIRE[0]);
    for (let i = 1; i < 6; i++) ember(ctx, x + i * 2.4, y - i * 0.5, 0.6 - i * 0.08, al * (1 - i / 6), FIRE[1]);
  }
  // ----- Meteor Smash: sparks gathering at the raised fist; then the crater -----
  if ((q.gather ?? 0) > 0.05) {
    const [hx, hy] = handPt('N');
    for (let i = 0; i < 4; i++) {
      const an = t * 6 + (i * TAU) / 4;
      sparkle(ctx, hx + Math.cos(an) * 5, hy + 2 + Math.sin(an) * 5, 1.2, q.gather, FIRE[1]);
    }
  }
  if ((q.crater ?? -1) >= 0 && q.crater < 0.9) {
    const e = q.crater / 0.9;
    const gx = 15;
    // the crater: a soft dark dish in the ground, a glowing rim
    ctx.save();
    ctx.globalAlpha *= 1 - sstep((e - 0.6) / 0.4);
    ell(ctx, gx, -0.2, 6 + e * 3, 1.4);
    ctx.fillStyle = '#7a6a7c';
    ctx.fill();
    ell(ctx, gx, -0.6, 6 + e * 3, 1.0);
    ctx.strokeStyle = MAGMA[2];
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const an = Math.PI + (i / 5) * Math.PI;
      const r = 3 + e * 14;
      rock(ctx, gx + Math.cos(an) * r, -1 + Math.sin(an) * r * 0.8 + e * e * 10, 1.1 * (1 - e * 0.4), e * 6 + i, 1 - sstep((e - 0.7) / 0.3));
      ember(ctx, gx + Math.cos(an + 0.3) * r * 1.1, -2 + Math.sin(an + 0.3) * r * 0.9 + e * e * 8, 0.7 * (1 - e), 1 - e);
    }
    dust(ctx, gx - 6 - e * 8, -2, 2 + e * 4, 0.7 * (1 - e));
    dust(ctx, gx + 6 + e * 8, -2, 2 + e * 4, 0.7 * (1 - e));
  }
  // ----- Shooting Star: a trail of stars up after her rising fist -----
  if ((q.trail ?? -1) >= 0 && q.trail < 0.9) {
    if (!a.mo.mmTrail || q.trail < 0.03) a.mo.mmTrail = [];
    const [hx, hy] = handPt('N');
    if (q.trail < 0.35) a.mo.mmTrail.push([hx, hy, q.trail]);
    for (const [x, y, t0] of a.mo.mmTrail) {
      const e = clamp((q.trail - t0) / 0.5, 0, 1);
      sparkle(ctx, x + hash(t0 * 97) * 2 - 1, y + e * 3, 1.6 * (1 - e), 1 - e, FIRE[1]);
    }
  } else a.mo.mmTrail = null;
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [36, -14]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [24, -52]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [34, -72]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.hurtT >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    const [hx, hy] = headAt(a, D, [0, -40]);
    for (let i = 0; i < 3; i++) sparkle(ctx, hx - 6 + i * 6, hy - e * 6, 1.4 * (1 - e), 1 - e, FIRE[1]);
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  skin: SKIN,
  liveHead: true,
  noMoves: true,
  stride: 15,
  kick: 3,
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    // (her ponytail and her jacket's back behind everything)
    armFu: (ctx, a, mode, S, D) => {
      ponytail(ctx, a, mode, D);
      jacketBack(ctx, a, mode, D);
    },
  },
  // (her sleeves draw her arms whole: the base's own arm skin is left out)
  hide: ['armF', 'armN'],
  over: {
    armFf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => gauntlet(ctx, a, mode, D, 'F'),
    legF: (ctx, a, mode, S, D) => {
      sock(ctx, a, mode, D, 'F');
      shortsLeg(ctx, a, mode, D, 'F');
    },
    legN: (ctx, a, mode, S, D) => {
      sock(ctx, a, mode, D, 'N');
      shortsLeg(ctx, a, mode, D, 'N');
    },
    footFskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'N'),
    torsoSkin: (ctx, a, mode, S, D) => {
      shortsTop(ctx, a, mode, D);
      tee(ctx, a, mode, D);
      panel(ctx, a, mode, D, 'F');
      panel(ctx, a, mode, D, 'N');
    },
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D),
    head: drawHead,
    armNf: (ctx, a, mode, S, D) => drawSleeve(ctx, a, mode, S, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => gauntlet(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};

const R = dressRig(DRESS);
const rig = R.rig;
// (her box: the ponytail's comet streaming out behind her)
rig.w = Math.round(rig.w * 1.15);
rig.h = Math.round(rig.h * 1.1);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over her head left
// to her, drawn here in her own style)
export const METEOR_MAIDEN_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const METEOR_MAIDEN_SIZE = { w: 28, h: Math.round(R.H * 1.08) };
export const METEOR_MAIDEN_DRESS = DRESS;
