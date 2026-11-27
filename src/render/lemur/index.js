// The Mantra Lemur (2026-11-27, the Sky Whale's Feather Monk remade from scratch as a new creature; the id stays
// `monk`). Ring-tailed lemurs sit with their arms open to the sun as if they were praying to it, so of course
// the ones up here became monks: they keep a little temple of breath in the whale's Lung Gardens (they
// breathe with the whale, in and out) and meditate on the Fallen Star's crater floor. Very serene. Very
// serious about it. On its own copy of the creature base (rig.js; body.js `lemur`: a lithe body, a soft
// tummy, longer legs, long arms with slender hands), dressed here; its head, mask, ears, ringed tail, robe and
// singing bowl drawn here from scratch over the mannequin (never the shared face, never the hero).
//   look    soft dove-grey fur, a white face and front, soft charcoal masks round its eyes (soft triangles,
//           the eyes clear inside them), a dark snout tip, pointed ears with white fluffy rims; a long tail
//           in soft black-and-white rings, held up in an S behind it; a saffron monk's robe WORN (the base's
//           body and arms with wide cuffs, the legs its loose robe trousers) with a plum sash from its near
//           shoulder across to its far hip and a cord belt; dark grey hands and feet; a little brass singing
//           bowl on its near palm. Its own soft grey outline, outer edge only, face bare.
//   eyes    its own "sun eyes": big round amber-orange eyes with fine soft rays in the iris (a sunburst), a
//           small pupil, a tilted oval glint and a dot; a calm smooth lash line; soft round grey brows.
//   walk    the base's walk at an unhurried pace (24), the bowl level on its palm, its tail swaying high.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - sunbathe (7.4 s): it leans back, arms wide, tummy to the light, eyes closed: a ring-tailed
//             lemur's sun worship; a slow blissful breath;
//           - meditate (7.0 s): it settles low, its hands together at its chest, eyes shut, its tail curled
//             round; an "om", the air shimmering calm;
//           - chime (6.4 s): the bowl struck with its little mallet; it listens to the long ring with its
//             eyes closed, swaying;
//           - salute (6.6 s): a sun salute: arms raised high overhead, a deep bow forward, and up again.
//   moves   Bowl Chime (the mallet raised high over the bowl, eyes shut; then struck: soft golden rings of
//           sound rolling out at you); Tail Sweep (it turns its back, a clean mirror flip, crouching; then its
//           ringed tail sweeps low at you, a soft swoosh); Big Breath (a deep breath in, its arms rising wide,
//           chest up; then a long OMMM out, a soft gust of wind lines pushing at you).
//   else    hurt: a startled squeak, its tail bristling; after landing a hit: palms together, a serene little
//           bow; hunting you: a calm ready stance, the bowl up; low on health: worried, a bead of sweat; a nap
//           (habitat): asleep in its meditation, its head nodding; beaten: dizzy. Its marks over its head (!,
//           ?) are its own: little lotus buds (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: sound as soft golden rings, breath as soft curling
// wind lines, warmth as a soft shimmer, sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, cue, note } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee, ribbon } from './act.js';

const BIG = 1.12;
const LW = 1.6 / BIG;
const ID = 'mantralemur';
const INK = '#857c94';
const FUR = ['#f6f4f8', '#d2cdda', '#aea8bc', '#8a829c'];
const WHITE = ['#ffffff', '#f7f4f4', '#e4dee6'];
const MASK = ['#6e6678', '#544c62'];
const HAND = ['#9a92a8', '#7a728a', '#5e5872', '#4a445c'];
const ROBE = ['#fff2dc', '#ffcc94', '#f2aa6c', '#c88454'];
const SASH = ['#d090b8', '#a8668e', '#844c70'];
const BRASS = ['#fff4c0', '#f2c860', '#cc9a3e', '#a0742e'];
const LASH = '#3a2e36';
const IRIS = ['#2a1608', '#d0721e', '#f4a432', '#ffe0a0'];
const RING = ['#fff6d0', '#ffd870'];

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
const HO = [1.4, -15.2];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
// (its tail: from its rump, up behind it in an S, on three springy pieces)
const TAIL_A = [72, 112];
const TAIL_B = [56, 102];
const TAIL_C = [52, 80];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B, tailC: TAIL_C };
const PIV2 = { tailA: 'tailA', tailB: 'tailB', tailC: 'tailC' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 60, c: 5.4, gain: 0.4, turn: 0.7, max: 12, flutter: 1.2, hz: 0.4, dir: [-6, -3] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 48, c: 4.4, gain: 0.5, turn: 0.7, max: 16, flutter: 1.8, hz: 0.45, dir: [0, -8] } },
  { name: 'tailC', parent: 'tailB', pivot: 'tailC', rot: (S, a) => (a.gl?.tailCurl ?? 0) * 0.8 + (a.gl?.tailTip ?? 0), soft: { k: 40, c: 3.8, gain: 0.6, turn: 0.7, max: 20, flutter: 2.6, hz: 0.5, dir: [6, -6] } },
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
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'calm' },
  bask: { e: 'shut', b: [-0.8, -1], m: 'content' },
  breathe: { e: 'shut', b: [-0.6, -0.8], m: 'o' },
  om: { e: 'shut', b: [-0.4, -0.4], m: 'om' },
  serene: { e: 'shut', b: [-0.6, -0.6], m: 'content' },
  strike: { e: 'open', g: [1.2, 1.4], b: [0.4, 0.4], m: 'calm' },
  listen: { e: 'shut', b: [-1, -1.2], m: 'content' },
  reach: { e: 'open', g: [0.4, -1.8], b: [-1, -1.2], m: 'o' },
  fold: { e: 'shut', b: [0, 0], m: 'calm' },
  focus: { e: 'open', g: [1.5, 0.3], b: [0.8, 1], m: 'calm' },
  fierce: { e: 'open', g: [1.6, 0.3], b: [1, 1.2], m: 'set' },
  inhale: { e: 'shut', b: [-0.8, -1], m: 'o' },
  shout: { e: 'squeeze', b: [0.8, 1], m: 'ommm' },
  sweep: { e: 'squeeze', b: [0.8, 1], m: 'grit' },
  bowGloat: { e: 'shut', b: [-0.6, -0.8], m: 'smile' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'open' },
  worried: { e: 'open', g: [0.3, 1], b: [-1.4, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.2, 0.2], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['bask', 'breathe', 'om', 'serene', 'listen', 'fold', 'inhale', 'shout', 'sweep', 'bowGloat', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The sun eye: big and round, a sunburst iris.
function eye(ctx, a, x, y, o, f) {
  const r0 = 3.9;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - r0, y + 1.2], [x, y - r0 * 0.9], [x + r0, y + 1.2], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - r0 * 0.9 * o, y - 1.8], [x + r0 * 0.3 * o, y - 0.2], [x + r0 * 0.9 * o, y + 0.4], 1.35, LASH);
    stroke3(ctx, a, [x - r0 * 0.9 * o, y + 2.4], [x + r0 * 0.2 * o, y + 1.2], [x + r0 * 0.9 * o, y + 0.6], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    // (closed: one long serene curve, a small curl at its outer end)
    stroke3(ctx, a, [x - r0, y + 0.6], [x, y + (kind === 'sleep' ? 2.8 : 2.4)], [x + r0, y + 0.6], 1.4, LASH);
    stroke3(ctx, a, [x + r0 * o, y + 0.6], [x + (r0 + 0.6) * o, y + 0.2], [x + (r0 + 0.8) * o, y - 0.4], 0.9, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
  const r = r0 * big;
  ell(ctx, x, y, r, r * 1.04);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      if (i) ctx.lineTo(x + Math.cos(an) * u * r * 0.7, y + Math.sin(an) * u * r * 0.7);
      else ctx.moveTo(x, y);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.6, 0.3];
    ctx.save();
    ell(ctx, x, y, r, r * 1.04);
    ctx.clip();
    const ix = x + gx * 0.45;
    const iy = y + gy * 0.45;
    const ir = r * 0.86;
    ell(ctx, ix, iy, ir, ir);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ir * 0.18, ir * 0.82, ir * 0.76);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    // fine soft rays: a sunburst
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU;
      ctx.beginPath();
      ctx.moveTo(ix + Math.cos(an) * ir * 0.42, iy + Math.sin(an) * ir * 0.42);
      ctx.lineTo(ix + Math.cos(an) * ir * 0.86, iy + Math.sin(an) * ir * 0.86);
      pen(ctx, tone(a, IRIS[3], 0.45), 0.3);
      ctx.stroke();
    }
    ell(ctx, ix, iy, ir * 0.34, ir * 0.34);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix - ir * 0.36 * o, iy - ir * 0.4, ir * 0.3, ir * 0.18, -0.5 * o);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ell(ctx, ix + ir * 0.38 * o, iy + ir * 0.36, ir * 0.11, ir * 0.11);
    ctx.fill();
    ctx.restore();
  }
  // a calm smooth lash line over the top, its outer end lifting a touch
  ctx.beginPath();
  ctx.moveTo(x - r * 1.0 * o, y - r * 0.15);
  ctx.bezierCurveTo(x - r * 0.7 * o, y - r * 1.12, x + r * 0.6 * o, y - r * 1.14, x + r * 1.08 * o, y - r * 0.4);
  pen(ctx, tone(a, LASH), 1.25);
  ctx.stroke();
}
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 1.8, y + lift + 0.3);
  ctx.quadraticCurveTo(x, y - 0.7 + lift * 0.6, x + o * 1.8, y + lift * 0.3 + 0.2);
  pen(ctx, tone(a, FUR[2]), 1.4);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#4e3e50';
  const DARK = '#5e2a40';
  const line = (pts, w = 0.7) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y - 0.2], [x + w * 0.7, y + h], [x, y + h * 1.15], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.5, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb0');
    ctx.fill();
  };
  switch (m) {
    case 'content':
      line([[x - 1.8, y], [x - 0.4, y + 0.8], [x + 1.2, y + 0.4], [x + 1.8, y + 0.1], [x + 2.2, y - 0.4]]);
      break;
    case 'smile':
      line([[x - 2, y - 0.4], [x - 0.6, y + 1.1], [x + 1.4, y + 0.5], [x + 2, y + 0.1], [x + 2.4, y - 0.6]]);
      break;
    case 'om':
      ell(ctx, x, y + 0.9, 1.1, 1.2);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'ommm':
      ell(ctx, x, y + 1.1, 1.6, 1.8);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 0.85, 1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'open':
      open(1.7, 2);
      break;
    case 'set':
      line([[x - 1.8, y + 0.5], [x, y + 0.3], [x + 1.8, y + 0.4]], 0.8);
      break;
    case 'grit':
      line([[x - 1.8, y + 0.5], [x, y + 0.1], [x + 1.8, y + 0.4]], 0.9);
      break;
    case 'wobble':
      line([[x - 1.8, y + 0.4], [x - 0.9, y - 0.2], [x, y + 0.3], [x + 0.9, y - 0.2], [x + 1.8, y + 0.4]], 0.65);
      break;
    case 'frown':
      line([[x - 1.6, y + 0.9], [x, y], [x + 1.6, y + 0.9]]);
      break;
    case 'talkA':
      open(1.3, 1.8);
      break;
    case 'talkE':
      open(1.7, 1.1);
      break;
    default:
      // at rest: a small level line, its corners soft
      line([[x - 1.6, y + 0.3], [x, y + 0.5], [x + 1.7, y + 0.2]], 0.68);
  }
}
// The head: round at the back, a fox-like pointed snout.
const SKULL = [[-17, 2], [-16, -7], [-10.6, -13.6], [-1.6, -16], [7, -14.4], [13, -9.6], [17, -4.4], [22, -1.2], [27, 1.4], [27.4, 4.2], [24, 6.4], [16, 9.6], [7, 13.4], [-3, 14.4], [-12.4, 10.6]];
// Its pointed ears, white fluffy rims, soft round tips.
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r * 0.8, 2], [-r * 0.9, -r * 0.7], [-r * 0.3, -r * 1.7], [r * 0.2, -r * 1.7], [r * 0.7, -r * 0.7], [r * 0.8, 2]]);
  paint(ctx, a, mode, WHITE[1]);
  if (mode === 'fill') {
    smooth(ctx, [[-r * 0.46, 1.2], [-r * 0.5, -r * 0.6], [-r * 0.16, -r * 1.26], [r * 0.12, -r * 1.26], [r * 0.42, -r * 0.6], [r * 0.46, 1.2]]);
    ctx.fillStyle = tone(a, FUR[2]);
    ctx.fill();
    glow(ctx, 0, -r * 0.4, r * 0.5, '#f2d6dc', 0.5);
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const back = q.earBack ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -11.4, -11, 5, -0.7 - back * 0.6);
  ear(ctx, a, mode, -1, -14.6, 5.4, -0.32 - back * 0.7);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, WHITE[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, 6, -2, 16, WHITE[0], 0.9);
    // the grey cap over the back and top of its head
    smooth(ctx, [[-20, 16], [-20, -18], [-2, -20], [8, -16], [6, -11], [-2, -9.6], [-8, -6], [-11, 2], [-10, 14]]);
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fill();
    glow(ctx, -8, -12, 7, FUR[0], 0.7);
    glow(ctx, -14, 8, 8, FUR[2], 0.5);
    // soft charcoal masks round its eyes (soft triangles narrowing down the snout)
    for (const [px, py, o] of [[-1.4, -1.2, -1], [11.6, -1.8, 1]]) {
      smooth(ctx, [[px - 4.6, py - 1.6], [px - 1.6, py - 4.8], [px + 3, py - 4.6], [px + 5.4 * (o > 0 ? 1.3 : 1), py + 0.4], [px + 6 * (o > 0 ? 1.3 : 0.9), py + 3.6], [px + 1, py + 4.4], [px - 3.6, py + 2]]);
      ctx.fillStyle = tone(a, MASK[0], 0.5);
      ctx.fill();
    }
    // the dark snout tip
    smooth(ctx, [[22.4, -0.4], [27.4, 1.4], [27.6, 4.4], [24, 6], [21.4, 4]]);
    ctx.fillStyle = tone(a, MASK[1]);
    ctx.fill();
    ell(ctx, 25.6, 1.8, 1, 0.5, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    ctx.restore();
    for (const [cx, cy, k] of [[-6.6, 7.4, 0.5], [9.6, 7.8, 0.9]]) {
      ell(ctx, cx, cy, 2.4, 1.4);
      ctx.fillStyle = tone(a, '#ffa6b8', 0.38 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, -1.4, -1.2, -1, f);
    eye(ctx, a, 11.6, -1.8, 1, f);
    brow(ctx, a, -1.6, -8.4, -1, (f.b?.[0] ?? 0) * 0.9);
    brow(ctx, a, 11.4, -9, 1, (f.b?.[1] ?? 0) * 0.9);
    mouth(ctx, a, 19.4, 8.2, f.m);
  }
  ctx.restore();
}

// ---------- Its robe ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function robe(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const J = D.J;
  const st = J.stern;
  const w = J.waist;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  const c0 = C([st[0] + 4, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 7, ROBE[0], 0.8);
  // the robe's wrap: its front edge from the neck down across to the far side
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 4, st[1] - 1]));
  ctx.quadraticCurveTo(...C([st[0] - 2, st[1] + 8]), ...W([w[0] - 8, w[1] + 1]));
  pen(ctx, tone(a, ROBE[3], 0.6), 0.6);
  ctx.stroke();
  // the plum sash from its near shoulder across to its far hip
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 13, st[1] - 1]));
  ctx.quadraticCurveTo(...C([st[0] + 2, st[1] + 10]), ...W([w[0] - 14, w[1] + 3]));
  pen(ctx, tone(a, SASH[2]), 3.2);
  ctx.stroke();
  pen(ctx, tone(a, SASH[1]), 2.2);
  ctx.stroke();
  // the cord belt and its knot
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 40, w[1] + 1.4]));
  ctx.lineTo(...W([w[0] + 40, w[1] + 1.4]));
  pen(ctx, tone(a, BRASS[2]), 0.9);
  ctx.stroke();
  const kn = W([w[0] + 7, w[1] + 1.6]);
  ell(ctx, kn[0], kn[1], 0.9, 0.8);
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ctx.restore();
}
// The wide cuffs at its wrists.
function cuff(ctx, a, mode, D, k) {
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const p = [mix(E[0], Wr[0], 0.82), mix(E[1], Wr[1], 0.82)];
  const ang = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(ang);
  smooth(ctx, [[-1.4, -2.1], [1.4, -2.6], [1.6, 2.6], [-1.4, 2.1]]);
  paint(ctx, a, mode, k === 'F' ? ROBE[2] : ROBE[1]);
  ctx.restore();
}
// Its long ringed tail, up behind it in an S.
const TAIL_PTS_A = [[74, 114], [64, 108], TAIL_B];
const TAIL_PTS_B = [[50, 92], TAIL_C];
const TAIL_PTS_C = [[56, 68], [64, 62], [70, 62]];
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p)), ...TAIL_PTS_C.map((p) => ptOf(a, D, 'tailC', p))];
  const c = ribbon(ctx, pts, [6.4, 6.6, 6.8, 6.8, 6.6, 6.4, 6, 5.4].map((w) => w * D.SC * 1.3));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, WHITE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // its rings: soft charcoal bands, the tip dark
  const n = 7;
  for (let j = 0; j < n; j++) {
    const u = 0.12 + (j / n) * 0.86;
    const i = Math.round(u * (c.length - 1));
    const p = c[i];
    const p0 = c[Math.max(0, i - 1)];
    const an = Math.atan2(p[1] - p0[1], p[0] - p0[0]);
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(an);
    ell(ctx, 0, 0, j === n - 1 ? 3.4 : 1.2, 4);
    ctx.fillStyle = tone(a, MASK[0], 0.9);
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] + 0.6, c[i][1] - 0.6, 1.6, '#ffffff', 0.5);
  ctx.restore();
}
// The singing bowl, level on its near palm (drawn over the hand).
function bowlAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0] + 0.4, y: p[1] - 1.6, tilt: a.gl?.bowlTilt ?? 0 };
}
function bowl(ctx, a, mode, D) {
  const B = bowlAt(a, D);
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.rotate(B.tilt);
  smooth(ctx, [[-3.4, -1.6], [3.4, -1.6], [3, 0.8], [1.6, 2.2], [-1.6, 2.2], [-3, 0.8]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, BRASS[3]);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ell(ctx, 0, -1.6, 3.4, 0.8);
  ctx.fillStyle = tone(a, BRASS[3]);
  ctx.fill();
  ell(ctx, 0, -1.6, 2.8, 0.5);
  ctx.fillStyle = tone(a, BRASS[2]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2.4, -0.4);
  ctx.quadraticCurveTo(-1, 1, 1.4, 0.6);
  pen(ctx, tone(a, BRASS[0]), 0.5);
  ctx.stroke();
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { sunbathe: 7.4, meditate: 7.0, chime: 6.4, salute: 6.6 };
const ORDER = ['sunbathe', 'meditate', 'chime', 'salute'];
const POOL = ['chime', 'sweep', 'breath'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL);
  const now = F.now;
  const q = { face: null, tailRot: 0, tailCurl: 0, tailTip: 0, earBack: 0, blush: 0, bowlTilt: 0, warm: 0, calmAir: 0, mallet: 0, malletUp: 0, ring: -1, omS: -1, chimeS: -1, sweepS: -1, breathS: -1, inhale: 0, sweat: -1, zz: 0, flipNow: false };
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
  // Standing: the bowl level on its near palm at its middle, the far hand easy at its side; tail up high.
  go({ shN: -30 + br * 1.4, elN: -80, hwN: 20, shF: -8 + br, elF: -30, hwF: 0, head: -2, chest: -br * 0.6 }, 1);
  add({ tilt: 3 }, walking);
  q.tailRot = Math.sin(t * 0.5) * 0.05 + Math.sin(U * TAU * 2) * 0.06 * walking;
  q.tailCurl = Math.sin(t * 0.6 + 1) * 0.06;
  q.tailTip = Math.sin(t * 0.8 + 2) * 0.1;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);
  let sit = 0;

  if (k > 0.001 && piece === 'sunbathe') {
    // it leans back, arms wide, tummy to the light, eyes closed
    const bk = win(pu, 0.2, 1.0, 6.4, 7.2);
    const slow = Math.sin(pu * 1.3) * 0.5 + 0.5;
    go({ tilt: -12 - slow * 2, chest: -6 - slow * 2, head: -10, shN: -100, elN: -20, hwN: 10, shF: -96, elF: -16, hwF: 10, lift: -0.02 }, bk * k);
    say('bask', bk * k);
    q.warm = bk * k;
    q.tailCurl += 0.2 * bk * k;
  }
  if (k > 0.001 && piece === 'meditate') {
    const md = win(pu, 0.2, 0.9, 6.2, 6.9);
    sit = Math.max(sit, md * k);
    go({ shN: -60, elN: -120, hwN: -20, shF: -56, elF: -124, hwF: -20, head: -2 }, md * k);
    q.tailRot += 0.8 * md * k;
    q.tailCurl += 0.6 * md * k;
    say(win(pu, 2.4, 2.6, 4.2, 4.5) > 0.5 ? 'om' : 'serene', md * k);
    if (pu > 2.4 && pu < 4.6) q.omS = pu - 2.4;
    q.calmAir = md * k;
  }
  if (k > 0.001 && piece === 'chime') {
    // the mallet raised over the bowl
    const rs = win(pu, 0.2, 0.6, 1.0, 1.15);
    go({ shF: -110, elF: -60, hwF: -20 }, rs * k);
    say('strike', rs * k);
    q.malletUp = rs * k;
    // struck: it listens to the long ring, eyes closed, swaying
    if (pu > 1.1 && pu < 5.6) q.ring = pu - 1.1;
    const ls = win(pu, 1.1, 1.4, 5.6, 6.1);
    go({ shF: -50, elF: -70, head: 4 + Math.sin(pu * 1.6) * 4, tilt: Math.sin(pu * 1.6) * 3, neckR: 4 }, ls * k);
    say('listen', ls * k);
    q.mallet = Math.max(q.mallet, win(pu, 0.2, 0.4, 1.4, 1.8) * k);
  }
  if (k > 0.001 && piece === 'salute') {
    // arms raised high overhead
    const up = win(pu, 0.2, 0.8, 2.2, 2.6);
    go({ shN: -170, elN: -10, hwN: 0, shF: -166, elF: -10, hwF: 0, chest: -5, head: -12, tilt: -4, toeN: 6 }, up * k);
    say('reach', up * k);
    // a deep bow forward
    const bw = win(pu, 2.4, 3.1, 4.4, 5.0);
    go({ tilt: 34, chest: 10, head: 16, shN: 20, elN: -10, shF: 24, elF: -10, lift: -0.03 }, bw * k);
    say('fold', bw * k);
    q.tailCurl -= 0.3 * bw * k;
    // and up again, serene
    say('serene', win(pu, 4.9, 5.2, 6.2, 6.6) * k);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: a calm ready stance, the bowl up (eased in and out) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ lift: -0.04, tilt: 6, head: 2, shN: -70, elN: -70, hwN: 20, shF: -60, elF: -90, fxN: 0.12, fxF: -0.08 }, hw);
    q.tailCurl += 0.2 * hw;
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.tailRot -= 0.3;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.55) / 0.4)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'chime') {
      // the mallet raised high over the bowl, eyes shut
      go({ shN: -80, elN: -70, hwN: 20, shF: -160, elF: -30, hwF: -10, tilt: -6, chest: -4, head: -6 }, wu);
      q.malletUp = Math.max(q.malletUp, W);
      q.mallet = Math.max(q.mallet, W);
      say('inhale', W);
      // struck: soft golden rings of sound rolling out at you
      if (s >= 0) {
        go({ shN: -80, elN: -70, hwN: 20, shF: -60, elF: -70, tilt: 8, chest: 3, head: 4, x: 0.03 }, sw);
        q.mallet = Math.max(q.mallet, sw);
        q.chimeS = s;
        say('focus', sw);
      }
    } else if (mvName === 'sweep') {
      // it turns its back (a clean mirror flip), crouching
      if (W > 0.3 || (s >= 0 && s < 0.7)) q.flipNow = true;
      go({ lift: -0.07, tilt: 14, head: 8, shN: -40, elN: -80, shF: -30, elF: -60 }, wu);
      q.tailRot += -0.5 * wu;
      say('focus', W);
      // then its ringed tail sweeps low at you
      if (s >= 0) {
        const sweep = Math.sin(Math.PI * clamp(s / 0.45, 0, 1));
        go({ lift: -0.08, tilt: 22, head: 10, x: -0.05 * sweep }, sw);
        q.tailRot += (-0.5 + 2.4 * sweep) * sw;
        q.tailCurl += -0.8 * sweep * sw;
        q.sweepS = s;
        say('sweep', win(s, 0, 0.04, 0.4, 0.5));
      }
    } else {
      // a deep breath in, arms rising wide, chest up
      go({ shN: -130, elN: -30, shF: -126, elF: -30, tilt: -10, chest: -8, head: -12, toeN: 8, toeF: 6 }, wu);
      q.inhale = W;
      say('inhale', W);
      // then a long OMMM out
      if (s >= 0) {
        go({ shN: -80, elN: -10, hwN: 0, shF: -70, elF: -10, tilt: 10, chest: 4, head: 2, x: 0.03 }, sw);
        q.breathS = s;
        say('shout', win(s, 0, 0.04, 0.55, 0.65));
      }
    }
  }
  // ----- Hurt: a startled squeak, its tail bristling -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shF: -50, elF: -110, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.earBack += kh;
    q.tailTip += 0.5 * kh;
  }
  // ----- After landing a hit: palms together, a serene little bow -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.4 && alive && !hurt) {
    const kg = win(gl, 0, 0.3, 1.0, 1.4) * (1 - F.moveW);
    go({ tilt: 14, head: 12, chest: 4, shF: -60, elF: -124, hwF: -20 }, kg);
    say('bowGloat', kg);
  }
  // ----- A nap (its habitat): asleep in its meditation, its head nodding -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 14 + Math.sin(now * 1.2) * 4, chest: 3, shN: -60, elN: -120, hwN: -20, shF: -56, elF: -124 }, nw);
    q.tailRot += 0.8 * nw;
    q.tailCurl += 0.6 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (sit > 0.001) go({ lift: -0.2 + Math.sin(now * 1.1) * 0.004, tilt: 4, fxN: 0.34, fxF: 0.26, fyN: 0.02, fyF: 0.02 }, sit);
  if (alive && !F.busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.earBack = 0.8;
  }
  settleFace(st, q, now, m.uid, SHUTS, 5);
  easeKeys(st, q, ['tailRot', 'tailCurl', 'tailTip', 'earBack', 'blush', 'bowlTilt', 'warm', 'calmAir', 'mallet', 'malletUp', 'inhale'], dt, (key) => (key.startsWith('tail') ? 8 : 10));
  q.calm = k;
  st.kFlip = Boolean(q.flipNow) && alive;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little lotus bud.
const BUBBLE = [[-6, 3], [-6.6, -1.2], [-4.2, -3.8], [-2.2, -2.4], [0, -7], [2.2, -2.4], [4.2, -3.8], [6.6, -1.2], [6, 3], [3, 5.8], [-3, 5.8]];
const BCOL = [INK, '#fff8f0', SASH[2], '#8a7aa0'];
// A soft curling line of breath.
function windLine(ctx, x, y, len, u, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al * Math.sin(Math.PI * clamp(u, 0, 1));
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + len * 0.4, y - 2, x + len * 0.8, y + 1.5, x + len, y - 1);
  ctx.arc(x + len - 0.2, y - 2.6, 1.6, Math.PI / 2, -Math.PI / 2 - 1, true);
  pen(ctx, '#e8eefc', 1.4);
  ctx.stroke();
  pen(ctx, '#ffffff', 0.7);
  ctx.stroke();
  ctx.restore();
}
function soundRing(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.8);
  pen(ctx, RING[1], 1.4);
  ctx.stroke();
  pen(ctx, RING[0], 0.6);
  ctx.stroke();
  ctx.restore();
}

function under2(ctx, m, a) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.39;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const B = bowlAt(a, D);
  const [fh, fv] = ptOf(a, D, 'handF', D.J.handF);
  // its little mallet, in its far hand
  if ((q.mallet ?? 0) > 0.05) {
    ctx.save();
    ctx.globalAlpha *= clamp(q.mallet * 1.6, 0, 1);
    const ang = -0.6 - (q.malletUp ?? 0) * 0.6;
    ctx.beginPath();
    ctx.moveTo(fh, fv);
    ctx.lineTo(fh + Math.cos(ang) * 6, fv + Math.sin(ang) * 6);
    pen(ctx, '#9e6a3a', 0.9);
    ctx.stroke();
    ell(ctx, fh + Math.cos(ang) * 6.6, fv + Math.sin(ang) * 6.6, 1.3, 1.1);
    ctx.fillStyle = '#f0d8b0';
    ctx.fill();
    ctx.restore();
  }
  // sunbathing: a soft shimmer of warmth on its tummy
  if ((q.warm ?? 0) > 0.05) {
    const [cx, cy] = ptOf(a, D, 'waistB', [86, 104]);
    glow(ctx, cx + 3, cy - 3, 11, '#ffd8a0', 0.3 * q.warm);
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.45 + i * 0.5) % 1;
      ctx.save();
      ctx.globalAlpha *= q.warm * Math.sin(Math.PI * f) * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx + 6 + i * 3, cy + 2 - f * 12);
      ctx.quadraticCurveTo(cx + 8 + i * 3, cy - 2 - f * 12, cx + 6 + i * 3, cy - 6 - f * 12);
      pen(ctx, '#ffe6c0', 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
  // meditating: the air calm round it in slow soft rings; an "om"
  if ((q.calmAir ?? 0) > 0.05) {
    const [cx, cy] = ptOf(a, D, 'chest', [80, 100]);
    for (let i = 0; i < 2; i++) {
      const f = (t * 0.3 + i * 0.5) % 1;
      ctx.save();
      ctx.globalAlpha *= q.calmAir * Math.sin(Math.PI * f) * 0.35;
      ell(ctx, cx, cy, 6 + f * 10, 4 + f * 6);
      pen(ctx, '#fff0d8', 0.7);
      ctx.stroke();
      ctx.restore();
    }
  }
  if ((q.omS ?? -1) >= 0 && q.omS < 2.2) {
    const [mx, my] = headAt(a, D, [20, 6]);
    const e = q.omS / 2.2;
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.75) / 0.25)) * 0.9;
    cue(ctx, 'om', mx + 6, my - 6 - e * 6, 3.2, a.flip ? -1 : 1, -0.06, SASH[2], '#fff8ee');
    ctx.restore();
  }
  // the bowl's long ring
  if ((q.ring ?? -1) >= 0 && q.ring < 4.5) {
    for (let i = 0; i < 3; i++) {
      const f = (q.ring * 0.6 + i / 3) % 1;
      soundRing(ctx, B.x, B.y - 1, 3 + f * 9, (1 - f) * (1 - sstep((q.ring - 3.6) / 0.9)) * 0.7);
    }
    if (q.ring < 0.6) sparkle(ctx, B.x + 2, B.y - 3, 1.8 * Math.sin(Math.PI * q.ring / 0.6), 1, RING[0]);
  }
  // ----- Bowl Chime: golden rings rolling out at you -----
  if ((q.chimeS ?? -1) >= 0 && q.chimeS < 0.9) {
    const e = q.chimeS / 0.9;
    for (let i = 0; i < 3; i++) {
      const u = clamp(e * 1.3 - i * 0.16, 0, 1);
      if (u > 0) soundRing(ctx, B.x + 4 + u * 18, B.y - 2, 3 + u * 9, (1 - u) * 0.95);
    }
    if (e < 0.4) sparkle(ctx, B.x + 2, B.y - 3, 2.4 * Math.sin(Math.PI * e / 0.4), 1, '#ffffff');
  }
  // ----- Tail Sweep: a soft grey swoosh low along the floor -----
  if ((q.sweepS ?? -1) >= 0 && q.sweepS < 0.55) {
    const e = q.sweepS / 0.55;
    ctx.save();
    ctx.globalAlpha *= Math.sin(Math.PI * e);
    ctx.beginPath();
    ctx.ellipse(-8, -6, 18, 6, 0, Math.PI * 0.55 - e * 1.6, Math.PI * 0.55 - e * 1.6 + 1.6);
    pen(ctx, FUR[1], 3);
    ctx.stroke();
    pen(ctx, '#ffffff', 1.1);
    ctx.stroke();
    ctx.restore();
  }
  // ----- Big Breath: the breath drawn in; then a long OMMM out, wind lines pushing at you -----
  if ((q.inhale ?? 0) > 0.1) {
    const [mx, my] = headAt(a, D, [26, 6]);
    for (let i = 0; i < 2; i++) {
      const f = (t * 1.4 + i * 0.5) % 1;
      windLine(ctx, mx + 18 - f * 14, my - 4 + i * 6, 7, 1 - f, q.inhale * 0.7);
    }
  }
  if ((q.breathS ?? -1) >= 0 && q.breathS < 0.95) {
    const e = q.breathS / 0.95;
    const [mx, my] = headAt(a, D, [26, 6]);
    for (let i = 0; i < 4; i++) windLine(ctx, mx + 2 + e * 22 + (i % 2) * 4, my - 8 + i * 5, 10, clamp(e * 1.5 - i * 0.1, 0, 1), 0.9);
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.7) / 0.3));
    cue(ctx, 'ommm', mx + 10 + e * 4, my - 12 - e * 3, 3.6, a.flip ? -1 : 1, -0.08, SASH[2], '#fff8ee');
    ctx.restore();
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.4 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#9a8eb0', '#fffaf2');
    }
  }
  const [bx, by] = headAt(a, D, [4, -36]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  void note;
  ctx.globalAlpha = base;
}

const DRESS = {
  id: ID,
  // (the skin is its robe, sleeves and all, its legs its loose robe trousers; dark grey hands and feet, a white neck)
  skin: {
    lt: ROBE[0], base: ROBE[1], sh: ROBE[2], deep: ROBE[3], ink: INK, guides: false, out: LW,
    parts: {
      hand: { lt: HAND[0], base: HAND[1], sh: HAND[2], deep: HAND[3] },
      foot: { lt: HAND[0], base: HAND[1], sh: HAND[2], deep: HAND[3] },
      neck: { lt: ROBE[0], base: ROBE[1], sh: ROBE[2], deep: ROBE[3] },
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
    torsoSkin: (ctx, a, mode, S, D) => robe(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => bowl(ctx, a, mode, D),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('lemur', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Tail Sweep: turned round with a clean mirror flip, never a squeeze)
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
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
export const MANTRA_LEMUR_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MANTRA_LEMUR_SIZE = { w: 26, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
