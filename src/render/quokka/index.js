// The Intern Quokka (2026-11-27, the Dream Theatre's Sticky Note Bird remade from scratch as a new creature;
// the id stays `prompter`). The office's intern in Act II, the Queen's dream of her old job: a small round
// quokka, the happiest animal in the world, in its very first week, in a shirt three sizes too big. It
// smiles at everything, says yes to everything, and has been asked to "circulate this memo", so it folds
// every memo into a paper plane and circulates it at you. On its own copy of the creature base (rig.js;
// body.js `quokka`: a bean of a body, short legs on long hind feet, short arms), dressed here; its head,
// clothes, lanyard and planes drawn here from scratch over the mannequin (never the shared face, never
// the hero).
//   look    warm cinnamon-grey fur, a cream face with round chubby cheeks and its famous wide smile,
//           small round ears, a little dark button nose; its clothes worn: an oversized white shirt (the
//           body's own skin and its long sleeves, so it folds with every pose) with big floppy cuffs
//           that half swallow its paws, a skinny striped mint-and-peach tie, khaki trousers (the legs'
//           own skin, the waist cut from the body's outline); a blue lanyard with its ID badge (a tiny
//           smiling photo) bouncing on its chest on a spring; its long hind feet its own fur; a stubby
//           tail. A folded paper plane in its near paw. Its own soft cocoa outline, outer edge only,
//           face bare.
//   eyes    its own "sunny eyes": big and round, droopy at their outer corners (kind and eager), a
//           hazel-green iris and a heart-shaped glint; a soft lash line that dips at the outer corner;
//           little arched brows that do its acting. Its wide smile.
//   walk    the base's walk at an eager little hustle (34), the lanyard bouncing.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - fold (7.4 s): a memo folded into a paper plane (sheet, fold, fold, plane), admired; sent
//             gliding off in a little loop that lands on the floor ahead;
//           - badge (6.0 s): its ID badge held up proudly to nobody, beaming; polished on its sleeve;
//           - coffee (7.0 s): a tray of three coffees balanced on its paw; a wobble, a bigger wobble;
//             saved; a relieved sigh;
//           - notes (6.4 s): a sticky note scribbled on and stuck to its own forehead; it reads it
//             (cross-eyed); peeled off, a giggle.
//   moves   Paper Plane (a memo folded in a snap and thrown at you: its shot, `paperplane`, drawn here);
//           Memo Slap (a sticky note slapped onto you, SMACK, a soft square burst); Eager Bow (an
//           enthusiastic bow so deep its head bonks you, its badge swinging).
//   else    hurt: a wince, still smiling bravely; after landing a hit: "thank you!", a little bow and a
//           beam; hunting you: eager, leaning in, a plane ready; low on health: worried, a bead of
//           sweat, still smiling; a nap (habitat): asleep sitting on its feet, smiling in its sleep;
//           beaten: dizzy. Its marks over its head (!, ?, z's, sweat) are its own: little sticky notes
//           (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: paper as soft cream folds, sticky notes as
// soft mint squares, sparkles the game's curvy stars, glides as soft dotted trails.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat } from './fx.js';

const BIG = 1.1;
const LW = 1.6 / BIG;
const INK = '#7a5040';
const FUR = ['#e6c4a4', '#c49a78', '#9e765a', '#7a5842'];
const CREAM = ['#fffcf4', '#f8ead6', '#e6d2b4'];
const SHIRT = ['#ffffff', '#f2f2fa', '#d8d8e8', '#bcbcd2'];
const KHAKI = ['#ecdcb4', '#d0bc8c', '#ae9a6c', '#8c7a52'];
const TIE = ['#b8f0d8', '#ffc8b0'];
const CORD = ['#9ad0ff', '#5a9ae0'];
const NOTE = ['#e8fff4', '#b8f2d8', '#7ad6b0'];
const PAPER = ['#ffffff', '#fbf7ee', '#e6dece'];
const LASH = '#4e2e28';
const IRIS = ['#2e3a20', '#5a7038', '#8aa654', '#d6e28c'];
const COFFEE = ['#fff4ea', '#d8a47a', '#9a6a4a'];

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
const HS = 1.34;
const HO = [1.2, -15];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const BADGE = [86, 95];
const JOINTS = { badge: BADGE };
const PIV2 = { badge: 'badge' };
const SOFTS = [
  // (its ID badge on its lanyard, swinging only a little against its chest)
  { name: 'badge', parent: 'chest', pivot: 'badge', rot: (S, a) => a.gl?.badgeRot ?? 0, soft: { k: 110, c: 8, gain: 0.35, turn: 0.4, hang: 0.4, max: 10, flutter: 0.6, hz: 0.6, dir: [0, 8] } },
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
  calm: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'beam' },
  eager: { e: 'wide', g: [1.4, 0.2], b: [-0.8, -0.6], m: 'grin' },
  fold: { e: 'open', g: [1.2, 1.6], b: [-0.2, 0.4], m: 'tongue' },
  admire: { e: 'wide', g: [1, -0.6], b: [-1.2, -1.4], m: 'grin' },
  watch: { e: 'open', g: [1.8, -0.6], b: [-1, -1.2], m: 'o' },
  proud: { e: 'happy', b: [-1, -1.2], m: 'grin' },
  wobble: { e: 'wide', g: [0.4, -1.6], b: [1.2, -1.8], m: 'wobble' },
  phew: { e: 'happy', b: [0.8, -1], m: 'o' },
  scribble: { e: 'open', g: [1.4, 1.4], b: [-0.4, 0.6], m: 'tongue' },
  cross: { e: 'open', g: [1.6, -1.8], gF: [2.2, -1.8], b: [-1.6, -1.8], m: 'o' },
  giggle: { e: 'happy', b: [-0.9, -1], m: 'grin' },
  fierce: { e: 'open', g: [1.7, 0.3], b: [-0.6, 1.4], m: 'beam' },
  shout: { e: 'squeeze', b: [-0.6, 1.6], m: 'grin' },
  thanks: { e: 'happy', b: [-1, -1.2], m: 'grin' },
  happy: { e: 'happy', b: [-0.9, -1], m: 'grin' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'brave' },
  worried: { e: 'open', g: [0.3, 0.9], b: [1.4, -1.8], m: 'brave' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'brave' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'beam' },
  shut: { e: 'shut', b: [0, 0], m: 'beam' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['proud', 'phew', 'giggle', 'shout', 'thanks', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
function heartGlint(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.35);
  ctx.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.3, y - r * 0.1, x, y + r * 0.9);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
// Its eye: big and round, droopy at its outer corner (the eye's outline lower toward the outer side).
function eyePath(ctx, x, y, w, h, o) {
  ctx.beginPath();
  ctx.ellipse(x, y, w, h, 0.16 * o, 0, TAU);
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.9;
  const h = 4.4;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1.2 + o * 0.4], [x, y - h * 0.85], [x + w, y + 1.2 - o * 0.4], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.8], [x + w * 0.3 * o, y - 0.2], [x + w * 0.9 * o, y + 0.3], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.2], [x + w * 0.2 * o, y + 1.1], [x + w * 0.9 * o, y + 0.5], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.3 - o * 0.4], [x, y + (kind === 'sleep' ? 3 : 2.4)], [x + w, y + 0.3 + o * 0.4], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  eyePath(ctx, x, y, w * big, h * big, o);
  ctx.fillStyle = tone(a, '#fffdf6');
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
  } else {
    const [gx, gy] = (o < 0 && f.gF) || f.g || [0.6, 0.3];
    ctx.save();
    eyePath(ctx, x, y, w * big, h * big, o);
    ctx.clip();
    const ir = kind === 'wide' ? 0.74 : 0.86;
    const ix = x + gx * 0.5;
    const iy = y + gy * 0.5 + 0.3;
    const iw = w * ir;
    const ih = h * ir;
    ell(ctx, ix, iy, iw, ih);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.14, iw * 0.88, ih * 0.84);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.48, iw * 0.68, ih * 0.42);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + ih * 0.7, iw * 0.44, ih * 0.16);
    ctx.fillStyle = tone(a, IRIS[3], 0.85);
    ctx.fill();
    ell(ctx, ix, iy - ih * 0.04, iw * 0.46, ih * 0.46);
    ctx.fillStyle = tone(a, '#1c2412');
    ctx.fill();
    // its glints: a little heart, and a round one
    heartGlint(ctx, ix - iw * 0.3, iy - ih * 0.36, 1.3);
    ell(ctx, ix + iw * 0.42, iy + ih * 0.4, 0.5, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // a soft lash line that dips at its outer corner
  stroke3(ctx, a, [x - w * o * 0.98, y - h * 0.5 - 0.3], [x, y - h * 1.26 * big], [x + w * o * 1.0, y - h * 0.1], 1.25, LASH);
}
// Little arched brows.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.2, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1.3 + (bo + bi) * 0.35, x + o * 2.2, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1.1);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#6e3430';
  const open = (w, h, teeth = false) => {
    smooth(ctx, [[x - w, y - 0.4], [x, y + 0.3], [x + w, y - 0.6], [x + w * 0.75, y + h], [x, y + h * 1.25], [x - w * 0.75, y + h]]);
    ctx.fillStyle = tone(a, '#7a2e3a');
    ctx.fill();
    ell(ctx, x, y + h * 0.85, w * 0.55, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9aa8');
    ctx.fill();
    if (teeth) {
      smooth(ctx, [[x - w * 0.5, y + 0.1], [x + w * 0.5, y], [x + w * 0.4, y + 0.9], [x - w * 0.4, y + 0.9]]);
      ctx.fillStyle = tone(a, '#ffffff');
      ctx.fill();
    }
  };
  const line = (pts, w = 0.78) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'grin':
      open(2.8, 2.2, true);
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1.1, 1.3);
      ctx.fillStyle = tone(a, '#7a2e3a');
      ctx.fill();
      break;
    case 'tongue':
      line([[x - 2.6, y - 0.6], [x, y + 1.2], [x + 2.6, y - 0.8]]);
      ell(ctx, x + 1.4, y + 1.2, 0.9, 1.1, 0.3);
      ctx.fillStyle = tone(a, '#ff8ea0');
      ctx.fill();
      break;
    case 'wobble':
      line([[x - 2.4, y + 0.2], [x - 1.2, y - 0.5], [x, y + 0.2], [x + 1.2, y - 0.5], [x + 2.4, y + 0.2]], 0.7);
      break;
    case 'brave':
      // still smiling, bravely: a smile with a wobble in it
      line([[x - 2.6, y - 0.6], [x - 1.2, y + 0.9], [x, y + 0.5], [x + 1.2, y + 0.9], [x + 2.6, y - 0.6]], 0.75);
      break;
    case 'talkA':
      open(1.8, 1.9);
      break;
    case 'talkE':
      open(2.3, 1.2);
      break;
    default:
      // its wide quokka beam: a big soft curve, corners tucked up into its cheeks
      line([[x - 3.2, y - 1], [x, y + 1.7], [x + 3.2, y - 1.2]], 0.8);
  }
}
const SKULL = [[-17.6, 0], [-16.4, -9.6], [-10.4, -15.6], [-1.6, -17.6], [7.6, -16.4], [14.4, -11.8], [18.6, -5], [21, 1.6], [20.6, 8.6], [15.6, 14], [6, 16.8], [-5, 16.2], [-13.6, 10.6]];
function ear(ctx, a, mode, x, y, r) {
  ell(ctx, x, y, r, r);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ell(ctx, x + 0.3, y + 0.3, r * 0.56, r * 0.56);
    ctx.fillStyle = tone(a, '#f0b8a8');
    ctx.fill();
  }
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -13.6, -12.4, 3.8);
  ear(ctx, a, mode, -3.4, -16.6, 4);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -11, 16, FUR[0], 0.8);
    glow(ctx, -15, 9, 10, FUR[2], 0.55);
    // its cream face and round chubby cheeks
    smooth(ctx, [[-4, 2], [2, -5], [10, -7], [17, -5], [21, 2], [20.6, 9], [15, 15], [5, 17], [-4, 13]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 12, 6, 9, CREAM[0], 0.9);
    ctx.restore();
    for (const [cx, cy, k] of [[-5.6, 6.6, 0.7], [13.6, 7.8, 1]]) {
      ell(ctx, cx, cy, 3, 1.8);
      ctx.fillStyle = tone(a, '#ff9cae', 0.5 * k);
      ctx.fill();
    }
    eye(ctx, a, -3.8, -2.4, -1, f);
    eye(ctx, a, 9.6, -2.6, 1, f);
    brow(ctx, a, -4, -9.6, -1, f.b);
    brow(ctx, a, 9.8, -10, 1, f.b);
    // its little dark button nose
    smooth(ctx, [[17, 3], [20.4, 2.6], [21, 4.2], [19, 6], [17.2, 4.6]]);
    ctx.fillStyle = tone(a, '#4e3434');
    ctx.fill();
    ell(ctx, 18.8, 3.4, 0.8, 0.4);
    ctx.fillStyle = 'rgba(255,240,240,0.7)';
    ctx.fill();
    mouth(ctx, a, 16.4, 9, f.m);
    // the sticky note stuck to its forehead (its act), soft mint
    if ((q.forehead ?? 0) > 0.02) {
      ctx.save();
      ctx.translate(4, -12.6);
      ctx.rotate(-0.12);
      const s = q.forehead;
      smooth(ctx, [[-4 * s, -4 * s], [4 * s, -4 * s], [4 * s, 4 * s], [-4 * s, 4 * s]]);
      ctx.fillStyle = tone(a, NOTE[1]);
      ctx.fill();
      pen(ctx, tone(a, NOTE[2]), 0.5);
      ctx.stroke();
      pen(ctx, tone(a, '#5a8a7a', 0.8), 0.4);
      for (const yy of [-1.6, 0, 1.6]) {
        ctx.beginPath();
        ctx.moveTo(-2.6 * s, yy * s);
        ctx.quadraticCurveTo(0, (yy - 0.5) * s, 2.4 * s, yy * s);
        ctx.stroke();
      }
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
// Its shirt front: its placket, its skinny striped tie, its khaki trousers from the waist, a soft fold.
function shirt(ctx, a, mode, D) {
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
  const c0 = C([st[0] + 5, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 6, SHIRT[0], 0.8);
  // the khaki trousers from the waist down
  poly(ctx, [W([w[0] - 40, w[1] + 5]), W([w[0] + 40, w[1] + 4]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, KHAKI[1]);
  ctx.fill();
  const sh = T([h[0] - 12, h[1] + 3]);
  glow(ctx, sh[0], sh[1], 7, KHAKI[3], 0.4);
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 40, w[1] + 5.6]));
  ctx.lineTo(...W([w[0] + 40, w[1] + 4.6]));
  pen(ctx, tone(a, KHAKI[2]), 1.1);
  ctx.stroke();
  // the shirt tucked in: a soft puffed fold over the waistband
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 8, w[1] + 3.6]));
  ctx.quadraticCurveTo(...W([w[0] + 2, w[1] + 5.6]), ...W([w[0] + 14, w[1] + 3]));
  pen(ctx, tone(a, SHIRT[2], 0.8), 0.6);
  ctx.stroke();
  // the skinny striped tie
  const blade = [C([st[0] + 4.6, st[1] + 1]), C([st[0] + 6.4, st[1] + 1]), W([w[0] + 7.4, w[1] + 1.6]), W([w[0] + 6.2, w[1] + 3]), W([w[0] + 5, w[1] + 1.6])];
  smooth(ctx, blade);
  ctx.fillStyle = tone(a, TIE[0]);
  ctx.fill();
  ctx.save();
  smooth(ctx, blade);
  ctx.clip();
  pen(ctx, tone(a, TIE[1]), 0.8);
  for (let i = 0; i < 6; i++) {
    const p = C([st[0] + 3, st[1] + 2 + i * 2.6]);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] + 4, p[1] - 1.4);
    ctx.stroke();
  }
  ctx.restore();
  const kn = C([st[0] + 5.5, st[1] + 0.2]);
  ell(ctx, kn[0], kn[1], 1.2, 1);
  ctx.fillStyle = tone(a, TIE[1]);
  ctx.fill();
  ctx.restore();
}
// The shirt's soft collar, two points under its chin.
function collar(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  for (const pts of [[[-5.6, -4], [4, -3.4], [5.2, 0.6], [-0.6, 1.8], [-6.2, -0.4]], [[5.8, -3.4], [12.6, -4], [12.2, -0.4], [8.6, 1.8], [5.6, 0.6]]]) {
    smooth(ctx, pts.map(([x, y]) => C([st[0] + x, st[1] + y])));
    paint(ctx, a, mode, SHIRT[0]);
  }
}
// Its big floppy cuffs, half swallowing its paws.
function cuff(ctx, a, mode, D, k) {
  const W = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(W[1] - E[1], W[0] - E[0]);
  ctx.save();
  ctx.translate(...W);
  ctx.rotate(ang);
  smooth(ctx, [[-2.6, -3], [1.4, -3.6], [2.4, -1], [2.2, 2], [1.2, 3.6], [-2.6, 3]]);
  if (mode === 'line') paint(ctx, a, 'line', null);
  else {
    ctx.fillStyle = tone(a, k === 'F' ? SHIRT[2] : SHIRT[0]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0.4, -3.2);
    ctx.lineTo(0.4, 3.2);
    pen(ctx, tone(a, SHIRT[3], 0.6), 0.4);
    ctx.stroke();
    ell(ctx, -0.8, 1.4, 0.45, 0.45);
    ctx.fillStyle = tone(a, SHIRT[3]);
    ctx.fill();
  }
  ctx.restore();
}
// The lanyard round its neck and its ID badge (on its spring), a tiny smiling photo on it.
function lanyard(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const P = (p) => ptOf(a, D, 'badge', p);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(...C([st[0] - 3, st[1] - 2]));
    ctx.quadraticCurveTo(...C([st[0] - 1, st[1] + 4]), ...P([BADGE[0], BADGE[1] + 1]));
    ctx.quadraticCurveTo(...C([st[0] + 11, st[1] + 3]), ...C([st[0] + 12, st[1] - 2]));
    pen(ctx, tone(a, CORD[1]), 0.9);
    ctx.stroke();
  }
  const card = [P([BADGE[0] - 4.6, BADGE[1] + 2]), P([BADGE[0] + 4.6, BADGE[1] + 2]), P([BADGE[0] + 4.6, BADGE[1] + 13]), P([BADGE[0] - 4.6, BADGE[1] + 13])];
  smooth(ctx, [...card, card[0]].slice(0, 4).flatMap((p, i, arr) => [p, [(p[0] + arr[(i + 1) % 4][0]) / 2, (p[1] + arr[(i + 1) % 4][1]) / 2]]));
  if (mode === 'line') return paint(ctx, a, 'line', null, CORD[1]);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  // the tiny photo: a round smiling face in a blue square
  const ph = P([BADGE[0] - 1.4, BADGE[1] + 6.4]);
  const ph2 = P([BADGE[0] + 1.6, BADGE[1] + 9.6]);
  const cx = (ph[0] + ph2[0]) / 2;
  const cy = (ph[1] + ph2[1]) / 2;
  ell(ctx, cx, cy, 1.4, 1.4);
  ctx.fillStyle = tone(a, CORD[0]);
  ctx.fill();
  ell(ctx, cx, cy + 0.1, 0.8, 0.8);
  ctx.fillStyle = tone(a, FUR[0]);
  ctx.fill();
  const lnA = P([BADGE[0] - 3.4, BADGE[1] + 11.4]);
  const lnB = P([BADGE[0] + 3.4, BADGE[1] + 11.4]);
  ctx.beginPath();
  ctx.moveTo(...lnA);
  ctx.lineTo(...lnB);
  pen(ctx, tone(a, SHIRT[3]), 0.4);
  ctx.stroke();
}
// Its stubby tail, a soft round lump behind its far hip.
function tail(ctx, a, mode, D) {
  const p = ptOf(a, D, 'torso', [D.J.hip[0] - 11, D.J.hip[1] + 2]);
  ell(ctx, p[0], p[1], 2.8, 2.2, 0.5);
  paint(ctx, a, mode, FUR[2]);
}
// The paper plane (local: nose at +x): a soft cream dart with its fold down the middle.
function planeShape(ctx, s, fold = 1) {
  ctx.save();
  ctx.scale(s, s);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-3, -2.4 * fold);
    ctx.lineTo(-2.2, 0);
    ctx.lineTo(-3, 1.4 * fold);
    ctx.closePath();
    if (pass === 'line') {
      pen(ctx, PAPER[2], 0.7);
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = PAPER[0];
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-2.2, 0);
  pen(ctx, PAPER[2], 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, 1.4 * fold);
  ctx.lineTo(-2.2, 0);
  ctx.closePath();
  ctx.fillStyle = PAPER[2];
  ctx.fill();
  ctx.restore();
}
// A sheet of memo, half folded (`f` 0 a sheet .. 1 a plane).
function memoShape(ctx, s, f) {
  if (f > 0.66) return planeShape(ctx, s, 1);
  ctx.save();
  ctx.scale(s, s);
  const w = mix(3.2, 3.6, f);
  const h = mix(4, 2.2, f / 0.66);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-w, -h], [w, -h], [w + (f > 0.33 ? 1.4 : 0), 0], [w, h], [-w, h]]);
    if (pass === 'line') {
      pen(ctx, PAPER[2], 0.7);
      ctx.stroke();
    } else {
      ctx.fillStyle = PAPER[1];
      ctx.fill();
    }
  }
  pen(ctx, '#c8c4dc', 0.3);
  for (const yy of [-0.4, 0.3]) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.6, yy * h);
    ctx.lineTo(w * 0.6, yy * h);
    ctx.stroke();
  }
  ctx.restore();
}
// Its shot (render/dreamfx.js dreamShot, `paperplane`): a paper plane gliding at you, a soft dotted
// trail behind it, a little bob as it flies.
export function paperPlaneShot(ctx, shot, x, y, p, d) {
  if (shot !== 'paperplane') return false;
  ctx.save();
  ctx.globalAlpha *= 0.6;
  for (let i = 1; i <= 4; i++) {
    ell(ctx, x - d * i * 3, y + Math.sin(p * 12 - i) * 0.8 + i * 0.3, 0.55 - i * 0.08, 0.55 - i * 0.08);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(x, y + Math.sin(p * 12) * 0.8);
  ctx.scale(d, 1);
  ctx.rotate(Math.cos(p * 12) * 0.12);
  planeShape(ctx, 1.1);
  ctx.restore();
  return true;
}

// ---------- Its act and fight ----------
const PIECES = { fold: 7.4, badge: 6.0, coffee: 7.0, notes: 6.4 };
const ORDER = ['fold', 'badge', 'coffee', 'notes'];
const POOL = ['plane', 'memo', 'bow'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, badgeRot: 0, held: 1, heldFold: 1, glide: -1, badgeUp: 0, shine: -1, tray: 0, trayTip: 0, forehead: 0, scribble: 0, planeS: -1, slapS: -1, bowS: -1, thanksS: -1, sweat: -1, zz: 0, sit: 0 };
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
  // Standing: bright and upright, up on its toes a touch, the paper plane held ready at its chest.
  go({ shN: -8 + br * 1.5, elN: -58, hwN: -10, shF: 8 + br, elF: -24, tilt: -1 + walking * 3, head: -3, chest: -br * 0.6 - 1 }, 1);
  q.badgeRot = Math.sin((a.blkidU ?? t) * TAU * 2) * 0.1 * walking;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.qkWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.qkAtk) {
      const pool = m.def.moves ?? POOL;
      st.qkN = (st.qkN ?? m.uid ?? 0) + 1;
      st.qkMove = m.move ?? pool[st.qkN % pool.length];
    }
    st.qkAtk = true;
  } else st.qkAtk = false;
  const mvName = st.qkAtk ? st.qkMove : null;
  const hadWind = now - (st.qkWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.qkCalm = mix(st.qkCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.qkCalm);
  let PC = st.qkPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.qkOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.qkOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.qkOrd = (st.qkOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.qkPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'fold') {
    // a memo folded into a plane in its paws at its chest (sheet, fold, fold, plane)
    const fold = win(pu, 0.2, 0.5, 3.0, 3.3);
    const fp = Math.max(0, Math.sin((pu - 0.6) * 7));
    go({ shN: -18 + fp * 6, elN: -74, hwN: -20, shF: -18 - fp * 6, elF: -74, hwF: -20, head: 12, neckR: 3 }, fold * k);
    q.heldFold = pu < 0.6 ? 0 : clamp((pu - 0.6) / 2.4, 0, 1);
    say('fold', fold * k);
    // admired, held up
    const adm = win(pu, 3.1, 3.4, 4.2, 4.4);
    go({ shN: -110, elN: -50, head: -6, chest: -2 }, adm * k);
    say('admire', adm * k);
    // sent gliding off in a little loop
    const throw0 = win(pu, 4.3, 4.45, 4.7, 5.0);
    go({ shN: -90, elN: -10, hwN: 20, tilt: 6, x: 0.02 }, throw0 * k);
    if (pu > 4.45) q.held = 0;
    if (pu > 4.45 && pu < 7.2) q.glide = (pu - 4.45) / 2.6;
    const watch = win(pu, 4.6, 4.9, 6.8, 7.2);
    go({ head: -6, neckR: -2 }, watch * k);
    say('watch', watch * k);
    q.held = Math.max(q.held, sstep((pu - 6.9) / 0.3));
  }
  if (k > 0.001 && piece === 'badge') {
    // its ID badge held up proudly to nobody
    const up = win(pu, 0.2, 0.5, 2.8, 3.1);
    go({ shF: -60, elF: -60, hwF: -10, head: 4, chest: -4, tilt: -3 }, up * k);
    q.badgeUp = up * k;
    say('proud', up * k);
    if (pu > 1.0 && pu < 2.2) q.shine = (pu - 1.0) / 1.2;
    // polished on its sleeve
    const pol = win(pu, 3.0, 3.3, 5.2, 5.6);
    go({ shN: -20 + Math.sin(pu * 12) * 8, elN: -110, hwN: -30, head: 10, neckR: 3 }, pol * k);
    say('eager', pol * k);
  }
  if (k > 0.001 && piece === 'coffee') {
    // a tray of three coffees balanced on its near paw
    const tray = win(pu, 0.2, 0.6, 6.0, 6.5);
    go({ shN: -44, elN: -46, hwN: 40, head: 2, shF: -20, elF: -60 }, tray * k);
    q.tray = tray * k;
    q.held = 1 - tray * k;
    // a wobble, a bigger wobble
    const wob = win(pu, 1.4, 1.6, 4.0, 4.3);
    const wv = Math.sin((pu - 1.4) * 9) * (0.5 + 0.5 * win(pu, 2.4, 2.8, 3.6, 4.0));
    go({ tilt: wv * 7, head: -wv * 6, shN: -70 + wv * 16 }, wob * k);
    add({ lift: Math.abs(wv) * 0.01 }, wob * k);
    q.trayTip = wv * wob * k;
    say(wob > 0.5 ? 'wobble' : 'eager', tray * k);
    // saved; a relieved sigh
    const phew = win(pu, 4.3, 4.5, 5.6, 6.0);
    add({ chest: Math.sin(Math.PI * clamp((pu - 4.3) / 1.5, 0, 1)) * 4 }, k);
    say('phew', phew * k);
  }
  if (k > 0.001 && piece === 'notes') {
    // a sticky note scribbled on
    const scr = win(pu, 0.2, 0.5, 2.0, 2.3);
    go({ shN: -22 + Math.sin(pu * 16) * 6, elN: -78, hwN: -20, shF: -30, elF: -80, head: 12, neckR: 3 }, scr * k);
    q.scribble = scr * k;
    q.held = 1 - scr * k;
    say('scribble', scr * k);
    // stuck to its own forehead; read, cross-eyed
    const slap = win(pu, 2.2, 2.4, 2.7, 2.9);
    go({ shN: -120, elN: -130, hwN: -20, head: -4 }, slap * k);
    q.forehead = sstep((pu - 2.45) / 0.08) * (1 - sstep((pu - 5.0) / 0.12)) * k;
    const read = win(pu, 2.8, 3.0, 4.5, 4.8);
    go({ head: -10, neckR: -3 }, read * k);
    say('cross', read * k);
    // peeled off, a giggle
    const peel = win(pu, 4.7, 4.9, 5.1, 5.3);
    go({ shN: -120, elN: -130, hwN: -20 }, peel * k);
    const gig = win(pu, 5.1, 5.3, 6.0, 6.4);
    add({ head: Math.sin(pu * 20) * 2.4 * gig, chest: Math.sin(pu * 20 + 1) * 1.6 * gig }, k);
    say('giggle', gig * k);
  }

  if (fighting && alive && !st.qkHunt) st.qkBangAt = now;
  if (!fighting && st.qkHunt && alive) st.qkLostAt = now;
  st.qkHunt = fighting && alive;
  q.bang = now - (st.qkBangAt ?? -9);
  q.huh = now - (st.qkLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: eager, leaning in, a plane ready -----
  // (the stance eases off as a move or a flinch takes over, never dropping out in one frame: the 2026-11-27
  // jitter probe found the arm and its prop leaping at the start of every wind-up)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    go({ shN: -36, elN: -40, tilt: 6, head: 2, toeN: 6, toeF: 6 }, huntW * (1 - walking * 0.5));
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'plane') {
      // a memo folded in a snap, then drawn back past its ear
      go({ shN: 50, elN: -100, hwN: -20, tilt: -8, head: -4, x: -0.02, shF: -40, elF: -40 }, wu);
      q.heldFold = sstep(W / 0.5);
      say('eager', W);
      // then thrown at you (its shot flies on from here)
      if (s >= 0) {
        go({ shN: -100, elN: -6, hwN: 20, tilt: 10, chest: 4, head: 2, x: 0.04 }, sw);
        q.held = sstep((s - 0.7) / 0.25);
        q.planeS = s;
        say('happy', win(s, 0.02, 0.06, 0.5, 0.6));
      }
    } else if (mvName === 'memo') {
      // a sticky note peeled off its pad, held up
      go({ shN: -130, elN: -70, hwN: -20, tilt: -6, head: -4, shF: -20, elF: -40 }, wu);
      q.held = 1 - wu;
      say('eager', W);
      // then slapped onto you: SMACK
      if (s >= 0) {
        go({ shN: -70, elN: -4, hwN: 10, tilt: 16, chest: 6, head: 4, x: 0.07 }, sw);
        q.held = sstep((s - 0.7) / 0.25);
        q.slapS = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    } else {
      // standing up straight, chest out, a big breath: "good morning!"
      go({ tilt: -8, chest: -6, head: -10, lift: 0.02, shN: 10, elN: -20, shF: 10, elF: -20 }, wu);
      say('eager', W);
      // then a bow so deep its head bonks you
      if (s >= 0) {
        go({ tilt: 34, chest: 12, head: 14, x: 0.06, lift: -0.05, shN: 20, elN: -10, shF: 20, elF: -10 }, sw);
        q.badgeRot += 0.6 * sw;
        q.bowS = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    }
  }
  // ----- Hurt: a wince, still smiling bravely -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -50, elN: -110, shF: -40, elF: -100, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.badgeRot -= 0.5 * kh;
  }
  // ----- After landing a hit: "thank you!", a little bow and a beam -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 0.85, 1.2) * (1 - moveW);
    go({ tilt: 14, head: 10, chest: 5 }, kg);
    say('thanks', kg);
    if (kg > 0.3) q.thanksS = gl;
  }
  // ----- A nap (its habitat): sat back on its long feet, smiling in its sleep -----
  st.qkNap = mix(st.qkNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.qkNap);
  if (nw > 0.001) {
    q.sit = nw;
    go({ head: 14 + Math.sin(now * 1.4) * 2.5, neckR: 4, shN: -20, elN: -100, shF: -20, elF: -100, lift: -0.18 + Math.sin(now * 1.4) * 0.006, tilt: -6, fxN: 0.36, fyN: 0.05, fxF: 0.3, fyF: 0.04, toeN: -14, toeF: -14 }, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 8) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  // ----- The face: an in-between (a blink) on every change; its own quick blink -----
  let f = q.face ?? 'calm';
  if (f !== st.qkFace) {
    st.qkFaceFrom = st.qkFace;
    st.qkFace = f;
    st.qkFaceAt = now;
  }
  const since0 = now - (st.qkFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.qkFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.qkFaceFrom) && !(talky(f) && talky(st.qkFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.47) % 3.7;
  if (bl < 0.11 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['badgeRot', 'held', 'heldFold', 'badgeUp', 'tray', 'trayTip', 'forehead', 'scribble']) {
    const rate = key === 'forehead' ? 30 : 12;
    st[`qk_${key}`] = mix(st[`qk_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`qk_${key}`];
  }
  q.calm = cw;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little mint sticky note, its corner curling.
function sticky(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  ctx.rotate(-0.08);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5, -5], [5, -5], [5, 3], [3.4, 5], [-5, 5]]);
    if (pass === 'line') {
      pen(ctx, NOTE[2], 1.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = NOTE[1];
      ctx.fill();
    }
  }
  smooth(ctx, [[5, 3], [3.4, 5], [3.4, 3.2]]);
  ctx.fillStyle = NOTE[0];
  ctx.fill();
  ctx.strokeStyle = mark === '!' ? '#e8607a' : '#4a7a6a';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.8);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.5, -1.8);
    ctx.quadraticCurveTo(-1.2, -3.4, 0.4, -3.3);
    ctx.quadraticCurveTo(2, -3, 1.4, -1.4);
    ctx.quadraticCurveTo(0.4, -0.7, 0.2, 0.4);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.8, 0.8);
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
  ctx.strokeStyle = NOTE[2];
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f4fffa';
  ctx.stroke();
  ctx.restore();
}
function cup(ctx, x, y) {
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[x - 1.3, y - 2.4], [x + 1.3, y - 2.4], [x + 1, y], [x - 1, y]]);
    if (pass === 'line') {
      pen(ctx, COFFEE[2], 0.6);
      ctx.stroke();
    } else {
      ctx.fillStyle = COFFEE[0];
      ctx.fill();
    }
  }
  ctx.fillStyle = COFFEE[1];
  ctx.fillRect(x - 1.25, y - 1.6, 2.5, 0.8);
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  for (const mode of ['line', 'fill']) tail(ctx, a, mode, D);
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
  const [hx, hy] = handPt('N');
  // the paper in its paw (a sheet, folding, a plane), grown in as it's drawn, never popping
  if ((q.held ?? 0) > 0.03 && (q.tray ?? 0) < 0.5) {
    ctx.save();
    ctx.translate(hx + 1.2, hy - 1.4);
    ctx.rotate(-0.25);
    memoShape(ctx, 0.95 * sstep(q.held), q.heldFold ?? 1);
    ctx.restore();
  }
  // its plane gliding off in a little loop, landing on the floor ahead
  if ((q.glide ?? -1) >= 0 && q.glide < 1) {
    if (!a.mo.qkGlide || q.glide < 0.03) a.mo.qkGlide = [hx, hy];
    const [ox, oy] = a.mo.qkGlide;
    const u = q.glide;
    const lp = clamp((u - 0.25) / 0.35, 0, 1);
    const x = ox + u * 18 + Math.sin(lp * TAU) * 4 * (lp > 0 && lp < 1 ? 1 : 0);
    const y = mix(oy, -1.5, sstep(clamp((u - 0.55) / 0.45, 0, 1))) - Math.sin(Math.PI * clamp(u / 0.6, 0, 1)) * 6 - (1 - Math.cos(lp * TAU)) * 3.4;
    const ang = lp > 0 && lp < 1 ? -lp * TAU : u > 0.8 ? 0.15 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    planeShape(ctx, 0.95);
    ctx.restore();
  } else a.mo.qkGlide = null;
  // its badge held up: a shine running across it
  if ((q.shine ?? -1) >= 0 && q.shine < 1) {
    const [bx, by] = ptOf(a, D, 'badge', [BADGE[0], BADGE[1] + 7]);
    sparkle(ctx, bx - 2 + q.shine * 4, by - 1, 1.8 * Math.sin(Math.PI * q.shine), 1, '#ffffff');
  }
  // the coffee tray on its paw, tipping with its wobbles
  if ((q.tray ?? 0) > 0.03) {
    ctx.save();
    ctx.globalAlpha *= clamp(q.tray * 2, 0, 1);
    ctx.translate(hx, hy - 1.4);
    ctx.rotate((q.trayTip ?? 0) * 0.3);
    smooth(ctx, [[-5.6, -0.4], [5.6, -0.4], [5.4, 0.8], [-5.4, 0.8]]);
    ctx.fillStyle = '#d8dce8';
    ctx.fill();
    for (const x of [-3.4, 0, 3.4]) cup(ctx, x, -0.4);
    ctx.restore();
  }
  // its pen scribbling
  if ((q.scribble ?? 0) > 0.05) {
    const [fx0, fy0] = handPt('F');
    ctx.save();
    ctx.globalAlpha *= q.scribble;
    smooth(ctx, [[hx - 3, hy - 3], [hx + 3, hy - 3], [hx + 3, hy + 2.6], [hx - 3, hy + 2.6]]);
    ctx.fillStyle = NOTE[1];
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx0 + 1, fy0 - 1);
    ctx.lineTo(fx0 + 1 + Math.sin(t * 16) * 1.5, fy0 - 5);
    pen(ctx, '#5a6aa8', 0.9);
    ctx.stroke();
    ctx.restore();
  }
  // Paper Plane: a little soft whoosh off its paw as it lets go
  if ((q.planeS ?? -1) >= 0 && q.planeS < 0.4) {
    const u = q.planeS / 0.4;
    sparkle(ctx, hx + 4 + u * 8, hy - 2 - u * 2, 1.8 * Math.sin(Math.PI * u), 1, '#ffffff');
  }
  // Memo Slap: SMACK, a soft mint square burst where the note lands
  if ((q.slapS ?? -1) >= 0 && q.slapS < 0.7) {
    if (!a.mo.qkSlap || q.slapS < 0.05) a.mo.qkSlap = [hx + 3, hy];
    const [sx, sy] = a.mo.qkSlap;
    const u = q.slapS / 0.7;
    ctx.save();
    ctx.globalAlpha *= 1 - sstep((u - 0.4) / 0.6);
    ctx.translate(sx, sy);
    ctx.rotate(0.1 + u * 0.3);
    const r = 2.6 + sstep(u * 3) * 2.4;
    // (a real sticky note: a square with soft corners and two scribbled lines; four corner points alone
    // smoothed into a mint ball)
    const c = 0.82;
    smooth(ctx, [[-r, -r * c], [-r * c, -r], [r * c, -r], [r, -r * c], [r, r * c], [r * c, r], [-r * c, r], [-r, r * c]]);
    ctx.fillStyle = NOTE[1];
    ctx.fill();
    pen(ctx, NOTE[2], 0.6);
    ctx.stroke();
    ctx.globalAlpha *= 0.6;
    for (const yy of [-0.3, 0.25]) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, yy * r);
      ctx.quadraticCurveTo(0, yy * r - 0.4, r * 0.5, yy * r);
      pen(ctx, NOTE[2], 0.45);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + 0.5;
      sparkle(ctx, sx + Math.cos(an) * (4 + u * 8), sy + Math.sin(an) * (4 + u * 6), 1.4 * Math.sin(Math.PI * u), 1, i % 2 ? NOTE[0] : '#ffffff');
    }
  } else a.mo.qkSlap = null;
  // Eager Bow: soft stars as its head bonks you
  if ((q.bowS ?? -1) >= 0.1 && q.bowS < 0.7) {
    const u = (q.bowS - 0.1) / 0.6;
    const [bx, by] = headAt(a, D, [18, -14]);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI / 2 + (i - 1) * 0.9 + u * 2;
      star(ctx, bx + Math.cos(an) * (5 + u * 5), by + Math.sin(an) * (3 + u * 3), 1.3 * (1 - u * 0.6), an, 1 - u);
    }
  }
  // "thank you!": two little sparkles by its beam
  if ((q.thanksS ?? -1) >= 0 && q.thanksS < 1.1) {
    const [mx, my] = headAt(a, D, [22, 2]);
    for (let i = 0; i < 2; i++) sparkle(ctx, mx + 2 + i * 3, my - 3 - i * 3 - q.thanksS * 2, 1.4 * Math.sin(Math.PI * clamp(q.thanksS - i * 0.15, 0, 1)), 1, i ? NOTE[1] : '#fff4c8');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [sx, sy] = headAt(a, D, [-14, -8]);
    sweat(ctx, sx, sy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [zx, zy] = headAt(a, D, [10, -24]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, zx + f * 6 + Math.sin(f * 5) * 1.4, zy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [6, -32]);
  if (q.bang >= 0 && q.bang < 1.1) sticky(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) sticky(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  void dust;
  void glow;
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'internquokka',
  // (the skin is its big white shirt and long sleeves; khaki trouser legs; its own fur at paws, feet, neck)
  skin: {
    lt: SHIRT[0], base: SHIRT[1], sh: SHIRT[2], deep: SHIRT[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: KHAKI[0], base: KHAKI[1], sh: KHAKI[2], deep: KHAKI[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: '#5e4230' },
      neck: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
    },
  },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => shirt(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => {
      collar(ctx, a, mode, D);
      lanyard(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('quokka', DRESS);
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
export const INTERN_QUOKKA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const INTERN_QUOKKA_SIZE = { w: 26, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
