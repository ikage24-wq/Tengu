// The Backdrop Beaver (2026-11-27, the Dream Theatre's Stagehand Mole remade from scratch as a new creature;
// the id stays `stagehand`). The theatre's scene painter, who lives backstage among the painted flats: a
// chubby beaver in paint-spattered dungarees who builds and paints every backdrop for the show, gnaws
// its pencils sharp, and thumps its tail three times for "places, everyone!". It has painted the same
// sunset four hundred times and still thinks it could be a bit more orange. On its own copy of the
// creature base (rig.js; body.js `beaver`: a pear of a body with a big round bottom, short thick legs
// on big flat feet, short sturdy arms), dressed here; its head, tail, clothes and brush drawn here from
// scratch over the mannequin (never the shared face, never the hero).
//   look    warm chestnut fur, a cream muzzle, two big apricot front teeth that always show, small round
//           ears, round chubby cheeks; a sage newsboy cap; a yellow pencil standing in its bib pocket;
//           its clothes worn: a cream work shirt (its sleeves the base's own arm skin, a rolled cuff at
//           each wrist) under denim dungarees (the body's own skin, so they fold with every pose: the
//           bib cut from its outline, straps over the shoulders, brass buttons, a bib pocket), soft
//           paint splotches on the denim; its paws and big flat feet its own fur; a broad flat paddle
//           tail (two springy halves) with a soft criss-cross of light. A wide paintbrush in its near
//           paw, its tip dipped mint. Its own soft cocoa outline, outer edge only, face bare.
//   eyes    its own "lamp-and-moon" eyes: taller than wide, an amber iris lit from below, its glints a
//           crescent moon low in the eye and a small round one high up; a thick neat lash line with two
//           round flicks; short thick rounded brows that do its acting. Its buck-toothed mouth.
//   walk    the base's walk at a stagehand's steady trudge (28), the brush carried like a tool, the
//           heavy tail swinging a beat behind.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - paint (7.6 s): broad strokes on the scenery, paint dripping off the brush; a drip lands on
//             its own nose; cross-eyed; wiped off with the back of its paw, sheepish;
//           - measure (6.6 s): the painter's measure: the brush held up at arm's length, one eye shut,
//             sizing up the scenery; a pleased nod; then a doubt (a bit more orange?);
//           - gnaw (6.2 s): the brush swapped into its bib pocket for the pencil standing there, the
//             pencil gnawed sharp (curls of shavings), its point admired, swapped back;
//           - thump (6.0 s): the cue: its tail thumped on the boards three times; peering out at the
//             stage, a paw shading its eyes; a happy nod: places!
//   moves   Brush Swipe (the brush drawn back over its shoulder; then swept across at you in a big mint
//           arc, drops flying); Tail Thump (it turns away (a clean mirror flip), its paddle tail cocked
//           up; then thumped down on you, a thud of dust and soft shock lines); Paint Flick (the brush
//           loaded low behind it; then flicked up, a mint blob lobbed at you, splatting soft where it
//           lands).
//   else    hurt: a wince, its cap jumping; after landing a hit: blows on its brush tip, pleased; hunting
//           you: the brush held up like a sword, brows down; low on health: worried, a bead of sweat, cap
//           askew; a nap (habitat): sat back on its tail, the cap tipped down over its eyes; beaten:
//           dizzy. Its marks over its head (!, ?, z's, sweat) are its own: little paint-swatch cards
//           (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: paint as glossy soft mint drops and
// splats (never specks), shavings as soft curls, dust soft rounds, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, sweat } from './fx.js';

const BIG = 1.12;
const LW = 1.6 / BIG;
const INK = '#7a4c3c';
const FUR = ['#d9a67c', '#b37c52', '#8e5c3c', '#6c442e'];
const CREAM = ['#fffaf0', '#f6e2c8', '#e0c4a2'];
const DENIM = ['#b4cdea', '#86a6d2', '#6a88b8', '#506c9a'];
const SHIRT = ['#fffdf8', '#f4ece0', '#ddd0c0', '#c2b4a2'];
const CAP = ['#c8e0c0', '#9cbf94', '#7a9e72', '#5c7c56'];
const TAILC = ['#a6887a', '#806456', '#62483e'];
const TEETH = ['#fffaf0', '#ffe0b4', '#e8b888'];
const NOSE = ['#6e4234', '#4e2e24'];
const LASH = '#4a2a22';
const IRIS = ['#4a2a10', '#8a5420', '#c88a34', '#f4c868'];
const BRASS = ['#fff0b8', '#e6be62', '#b8862e'];
const PAINT = ['#e2fff4', '#8fe0c6', '#5cbfa2', '#3f9c84'];
const SPLOT = ['#ffc4b8', '#a8e8d0', '#ffe08a'];
const WOOD = ['#f0c890', '#d09a5c', '#a87440'];
const BS = 0.78;

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
const HO = [1.2, -15.4];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [70.6, 121];
const TAIL_B = [60, 135.6];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 80, c: 7, gain: 0.32, turn: 0.6, hang: 0.3, max: 11, flutter: 0.8, hz: 0.35, dir: [-6, 6] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 72, c: 6.4, gain: 0.36, turn: 0.6, hang: 0.25, max: 12, flutter: 1, hz: 0.4, dir: [-7, 1] } },
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
  calm: { e: 'open', g: [0.6, 0.4], b: [0, 0], m: 'calm' },
  happy: { e: 'happy', b: [-0.9, -1], m: 'open' },
  pleased: { e: 'happy', b: [-0.6, -0.6], m: 'smile' },
  focus: { e: 'open', g: [1.2, 0.8], b: [-0.4, 1.3], m: 'set' },
  paint: { e: 'open', g: [1.5, 0.2], b: [-0.6, 0.6], m: 'tongue' },
  cross: { e: 'open', g: [1.6, 1.6], gF: [2.2, 1.6], b: [-1.6, -1.8], m: 'o' },
  sheepish: { e: 'open', g: [-1, 0.9], b: [1, -1.4], m: 'grin' },
  read: { e: 'open', g: [1.6, 1.2], b: [-0.4, -0.2], m: 'calm' },
  snap: { e: 'squeeze', b: [1.2, 1.2], m: 'shout' },
  gnaw: { e: 'shut', b: [0.2, 0.6], m: 'gnaw' },
  admire: { e: 'wide', g: [1.4, -0.6], b: [-1.4, -1.6], m: 'grin' },
  listen: { e: 'open', g: [1.6, 0.2], b: [-1, 0.4], m: 'o' },
  wink: { e: 'wink', g: [1.6, -0.6], b: [-0.6, 0.8], m: 'tongue' },
  doubt: { e: 'open', g: [1.2, -0.4], b: [-1.2, 0.8], m: 'wobble' },
  places: { e: 'happy', b: [-1, -1.2], m: 'grin' },
  fierce: { e: 'open', g: [1.6, 0.5], b: [-0.8, 2.2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  blow: { e: 'shut', b: [-0.4, -0.4], m: 'blow' },
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
const SHUTS = new Set(['wink', 'happy', 'pleased', 'snap', 'gnaw', 'places', 'shout', 'blow', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// A crescent: a thin moon of light low in the eye (its glint).
function moonGlint(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI * 0.12, Math.PI * 0.88);
  ctx.arc(x, y - r * 0.42, r * 0.9, Math.PI * 0.82, Math.PI * 0.18, true);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.5;
  const h = 4.7;
  let kind = f.e;
  if (kind === 'wink') kind = o > 0 ? 'open' : 'happy';
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1.2], [x, y - h * 0.95], [x + w, y + 1.2], 1.55, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 2], [x + w * 0.3 * o, y - 0.3], [x + w * 0.9 * o, y + 0.2], 1.4, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.2], [x + w * 0.2 * o, y + 1.1], [x + w * 0.9 * o, y + 0.4], 1.25, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.4], [x, y + (kind === 'sleep' ? 3.2 : 2.6)], [x + w, y + 0.4], 1.5, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  ell(ctx, x, y, w * big, h * big);
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
    stroke3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.3], [x + w, y - h * 0.3], 1.5, LASH);
    return;
  }
  const [gx, gy] = (o < 0 && f.gF) || f.g || [0.6, 0.4];
  ctx.save();
  ell(ctx, x, y, w * big, h * big);
  ctx.clip();
  const ir = kind === 'wide' ? 0.74 : 0.84;
  const ix = x + gx * 0.5;
  const iy = y + gy * 0.5 + 0.3;
  const iw = w * ir;
  const ih = h * ir;
  // the iris: deep at the top, amber lit from below
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.18, iw * 0.88, ih * 0.8);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.5, iw * 0.72, ih * 0.42);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.72, iw * 0.5, ih * 0.18);
  ctx.fillStyle = tone(a, IRIS[3], 0.85);
  ctx.fill();
  ell(ctx, ix, iy - ih * 0.1, iw * 0.44, ih * 0.42);
  ctx.fillStyle = tone(a, '#2a160a');
  ctx.fill();
  // its glints: a crescent moon low in the eye, a small round one high
  moonGlint(ctx, ix, iy + ih * 0.15, iw * 0.78);
  ell(ctx, ix - iw * 0.3, iy - ih * 0.45, 0.85, 0.85);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  // a thick neat lash line, two round flicks at its outer corner
  stroke3(ctx, a, [x - w * 0.98, y - h * 0.3], [x, y - h * 1.32], [x + w * 0.98, y - h * 0.3], 1.45, LASH);
  stroke3(ctx, a, [x + w * 0.8 * o, y - h * 0.66], [x + (w + 0.6) * o, y - h * 0.8], [x + (w + 1.1) * o, y - h * 1.08], 0.95, LASH);
  stroke3(ctx, a, [x + w * 0.95 * o, y - h * 0.38], [x + (w + 0.8) * o, y - h * 0.46], [x + (w + 1.4) * o, y - h * 0.66], 0.85, LASH);
}
// Short thick rounded brows (head units), tipping with the mood.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 2.2, y + bi * 0.7);
  ctx.lineTo(x + o * 2.2, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1.9);
  ctx.stroke();
}
function teeth(ctx, a, x, y, open = 0) {
  for (const [dx, k] of [[-1.15, 0.92], [1.15, 1]]) {
    smooth(ctx, [[x + dx - 1.1, y + open], [x + dx + 1.1, y + open], [x + dx + 1.1, y + 2.6 * k + open], [x + dx + 0.6, y + 3.3 * k + open], [x + dx - 0.6, y + 3.3 * k + open], [x + dx - 1.1, y + 2.6 * k + open]]);
    pen(ctx, tone(a, TEETH[2]), 0.45);
    ctx.stroke();
    ctx.fillStyle = tone(a, dx < 0 ? TEETH[1] : TEETH[0]);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(x, y + open + 0.3);
  ctx.lineTo(x, y + open + 2.8);
  pen(ctx, tone(a, TEETH[2], 0.8), 0.35);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m, now = 0) {
  const LIP = '#6a3428';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7a3030');
    ctx.fill();
    ell(ctx, x, y + h * 0.85, w * 0.55, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9caa');
    ctx.fill();
    teeth(ctx, a, x, y - 0.2);
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
      line([[x - 2.6, y - 0.6], [x, y + 1.1], [x + 2.6, y - 0.6]]);
      teeth(ctx, a, x, y + 0.5);
      break;
    case 'open':
    case 'shout':
      open(2.4, m === 'shout' ? 3 : 2.4);
      break;
    case 'grin':
      line([[x - 2.8, y - 0.8], [x, y + 1.2], [x + 2.8, y - 0.8]], 0.8);
      teeth(ctx, a, x, y + 0.6);
      break;
    case 'o':
      ell(ctx, x, y + 0.7, 1.1, 1.3);
      ctx.fillStyle = tone(a, '#7a3030');
      ctx.fill();
      teeth(ctx, a, x, y - 0.9, 0);
      break;
    case 'tongue':
      line([[x - 2.2, y], [x, y + 0.7], [x + 2.2, y]]);
      teeth(ctx, a, x, y + 0.5);
      ell(ctx, x + 2.4, y + 1.4, 0.9, 1.1, 0.3);
      ctx.fillStyle = tone(a, '#ff8ea0');
      ctx.fill();
      break;
    case 'gnaw': {
      const c = Math.sin(now * 30) * 0.5;
      line([[x - 2.2, y + c], [x, y + 0.6], [x + 2.2, y - c]]);
      teeth(ctx, a, x, y + 0.6 + Math.abs(c));
      break;
    }
    case 'blow':
      ell(ctx, x + 0.5, y + 0.6, 0.9, 0.8);
      ctx.fillStyle = tone(a, '#7a3030');
      ctx.fill();
      break;
    case 'set':
      line([[x - 2, y + 0.4], [x, y], [x + 2, y + 0.4]], 0.85);
      teeth(ctx, a, x, y + 0.4);
      break;
    case 'wobble':
      line([[x - 2.2, y + 0.4], [x - 1.1, y - 0.3], [x, y + 0.3], [x + 1.1, y - 0.3], [x + 2.2, y + 0.4]], 0.7);
      teeth(ctx, a, x, y + 0.5);
      break;
    case 'frown':
      line([[x - 2, y + 0.9], [x, y - 0.2], [x + 2, y + 0.9]]);
      break;
    case 'sleep':
      line([[x - 1.6, y + 0.2], [x, y + 0.8], [x + 1.6, y + 0.2]], 0.65);
      teeth(ctx, a, x, y + 0.6);
      break;
    case 'talkA':
      open(1.8, 2);
      break;
    case 'talkE':
      open(2.2, 1.2);
      break;
    default:
      // at rest: a soft little line, its two big teeth peeking out under it
      line([[x - 2.4, y - 0.2], [x - 1.2, y + 0.8], [x, y + 0.2], [x + 1.2, y + 0.8], [x + 2.4, y - 0.4]], 0.72);
      teeth(ctx, a, x, y + 0.5);
  }
}
const SKULL = [[-18, 0], [-16.6, -10], [-10.6, -16.4], [-1.4, -18.6], [7.6, -17.6], [14.4, -13], [18.6, -6.4], [21.8, 0], [22.6, 6.4], [19.6, 12.4], [10, 16.6], [-2, 16.4], [-12.6, 12.4]];
function ear(ctx, a, mode, x, y, r) {
  ell(ctx, x, y, r, r * 0.92);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    ell(ctx, x + 0.3, y + 0.2, r * 0.5, r * 0.48);
    ctx.fillStyle = tone(a, '#c88a74');
    ctx.fill();
  }
}
// Its newsboy cap, the brim to the front; `tip` 0 sat on top .. 1 pulled down over its eyes.
function cap(ctx, a, mode, tilt, tip) {
  ctx.save();
  ctx.translate(0.4 + tip * 2, -15.6 + tip * 6);
  ctx.rotate(-0.12 + tilt + tip * 0.3);
  // the crown: a soft puffed round, then the brim
  smooth(ctx, [[-12, 2.2], [-12.6, -3], [-8, -7.8], [1, -9], [9.6, -6.6], [13.4, -1.6], [12.4, 2.6], [0, 3.4]]);
  paint(ctx, a, mode, CAP[1]);
  smooth(ctx, [[8.6, 1.4], [16.6, 0.8], [19.4, 2.6], [16.2, 4.4], [8.4, 3.8]]);
  paint(ctx, a, mode, CAP[2]);
  if (mode === 'fill') {
    glow(ctx, -3, -5, 8, CAP[0], 0.7);
    // its panels: soft seams from the button
    for (const ex of [-9, -1, 8]) {
      ctx.beginPath();
      ctx.moveTo(-0.6, -8.6);
      ctx.quadraticCurveTo(ex * 0.6, -6, ex, 2);
      pen(ctx, tone(a, CAP[2], 0.55), 0.45);
      ctx.stroke();
    }
    ell(ctx, -0.6, -8.8, 1.3, 0.9);
    ctx.fillStyle = tone(a, CAP[2]);
    ctx.fill();
    // a little paint dab on it
    ell(ctx, 6, -3.2, 1.3, 1);
    ctx.fillStyle = tone(a, SPLOT[0]);
    ctx.fill();
  }
  ctx.restore();
}
// The pencil (head units, behind its near ear) unless it's in its paw.
function pencilShape(ctx, a, mode, len = 9) {
  smooth(ctx, [[-len / 2, -0.9], [len / 2 - 1.4, -0.9], [len / 2 + 0.6, 0], [len / 2 - 1.4, 0.9], [-len / 2, 0.9], [-len / 2 - 0.5, 0]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, '#b8863a');
  ctx.fillStyle = tone(a, '#ffd860');
  ctx.fill();
  ctx.fillStyle = tone(a, '#f4a8b8');
  ctx.fillRect(-len / 2 - 0.4, -0.85, 1.6, 1.7);
  ell(ctx, len / 2 - 0.4, 0, 1, 0.75);
  ctx.fillStyle = tone(a, WOOD[0]);
  ctx.fill();
  ell(ctx, len / 2 + 0.3, 0, 0.35, 0.3);
  ctx.fillStyle = tone(a, '#6a5a6a');
  ctx.fill();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -15.2, -9.6, 3.2);
  ear(ctx, a, mode, -6.4, -16.4, 3.4);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -11, 16, FUR[0], 0.8);
    glow(ctx, -15, 10, 11, FUR[2], 0.6);
    // chubby cheeks, lighter
    glow(ctx, 6, 8, 8, FUR[0], 0.7);
    // the cream muzzle, a round lump
    ell(ctx, 16, 6.6, 7.4, 6);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 17, 4, 5, CREAM[0], 0.9);
    ctx.restore();
    for (const [cx, cy, k] of [[-8, 6, 0.6], [9.6, 7.4, 1]]) {
      ell(ctx, cx, cy, 2.8, 1.7);
      ctx.fillStyle = tone(a, '#ff9c9c', 0.42 * k);
      ctx.fill();
    }
    eye(ctx, a, -4.4, -3.4, -1, f);
    eye(ctx, a, 8.6, -3.8, 1, f);
    brow(ctx, a, -4.6, -10.4, -1, f.b);
    brow(ctx, a, 8.8, -10.8, 1, f.b);
    // the nose: a round dark button with a soft light
    ell(ctx, 20.2, 2, 2.7, 1.9, 0.1);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 19.6, 1.3, 1, 0.5, 0.1);
    ctx.fillStyle = 'rgba(255,236,226,0.75)';
    ctx.fill();
    // the paint drip on its nose (from its act), till it wipes it off
    if ((q.nosePaint ?? 0) > 0.02) {
      ctx.save();
      ctx.globalAlpha *= q.nosePaint;
      smooth(ctx, [[19, 0.6], [22, 0.4], [22.4, 2.4], [21, 4.4], [20.4, 2.6], [19.2, 2.2]]);
      ctx.fillStyle = PAINT[1];
      ctx.fill();
      ell(ctx, 20.4, 1.2, 0.7, 0.4);
      ctx.fillStyle = PAINT[0];
      ctx.fill();
      ctx.restore();
    }
    mouth(ctx, a, 17.4, 8.6, f.m, a.now ?? 0);
  }
  cap(ctx, a, mode, q.capTilt ?? 0, q.capTip ?? 0);
  ctx.restore();
}

// ---------- Its clothes ----------
// (Its dungarees are the body's own skin in denim and its shirt sleeves the arms' own skin in cream; over
// the body, cut from the same outline, the shirt above the bib, the bib and its straps, the pocket, the
// paint splotches; a rolled cuff at each wrist.)
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
function button(ctx, a, x, y, r = 0.8) {
  ell(ctx, x, y, r, r);
  ctx.fillStyle = tone(a, BRASS[2]);
  ctx.fill();
  ell(ctx, x - r * 0.15, y - r * 0.15, r * 0.66, r * 0.66);
  ctx.fillStyle = tone(a, BRASS[1]);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.32, r * 0.28, r * 0.22);
  ctx.fillStyle = tone(a, BRASS[0]);
  ctx.fill();
}
function dungarees(ctx, a, mode, D) {
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
  // the shirt above the dungarees' waist
  poly(ctx, [C([st[0] - 40, st[1] - 20]), C([st[0] + 40, st[1] - 20]), W([w[0] + 40, w[1] + 1]), W([w[0] - 40, w[1] + 1])]);
  ctx.fillStyle = tone(a, SHIRT[1]);
  ctx.fill();
  const c0 = C([st[0] + 6, st[1] + 5]);
  glow(ctx, c0[0], c0[1], 6, SHIRT[0], 0.8);
  const c1 = C([st[0] - 12, st[1] + 10]);
  glow(ctx, c1[0], c1[1], 6, SHIRT[2], 0.7);
  // the bib: denim from the waist up over the chest, its top edge stitched, toward the front
  const bib = [C([st[0] - 4.4, st[1] + 6.4]), C([st[0] + 14.6, st[1] + 5.8]), W([w[0] + 16, w[1] + 1]), W([w[0] - 6, w[1] + 1.4])];
  poly(ctx, bib);
  ctx.fillStyle = tone(a, DENIM[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...C([st[0] - 3.4, st[1] + 7.6]));
  ctx.lineTo(...C([st[0] + 13.8, st[1] + 7]));
  pen(ctx, tone(a, DENIM[0], 0.9), 0.4);
  ctx.setLineDash([0.8, 0.7]);
  ctx.stroke();
  ctx.setLineDash([]);
  // the straps, over its shoulders from the bib's top corners, a brass button at each
  for (const [x0, x1] of [[-2.6, -6], [12.6, 12]]) {
    const p0 = C([st[0] + x0, st[1] + 7.2]);
    const p1 = C([st[0] + x1, st[1] - 6]);
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    pen(ctx, tone(a, DENIM[2]), 2.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    pen(ctx, tone(a, DENIM[1]), 1.3);
    ctx.stroke();
    button(ctx, a, p0[0], p0[1] + 0.2, 0.85);
  }
  // the bib pocket, a pencil-stub of paint on it
  const pk = [C([st[0] + 1.8, st[1] + 9.6]), C([st[0] + 9.6, st[1] + 9.4]), C([st[0] + 9.2, st[1] + 15]), C([st[0] + 2.2, st[1] + 15.2])];
  poly(ctx, pk);
  ctx.fillStyle = tone(a, DENIM[2], 0.55);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...pk[0]);
  ctx.lineTo(...pk[1]);
  pen(ctx, tone(a, DENIM[0], 0.9), 0.5);
  ctx.stroke();
  // its pencil, standing up out of the pocket (unless it's in its paw)
  if (!a.gl?.pencilOut) {
    const pp = C([st[0] + 3.6, st[1] + 8.6]);
    ctx.save();
    ctx.translate(pp[0], pp[1]);
    ctx.rotate(-1.35);
    ctx.scale(D.SC * 1.1, D.SC * 1.1);
    pencilShape(ctx, a, 'fill', 7);
    ctx.restore();
  }
  // the trouser half: shaded toward the far side, soft paint splotches
  const sh = T([h[0] - 14, h[1] + 2]);
  glow(ctx, sh[0], sh[1], 8, DENIM[3], 0.5);
  for (const [p, r, i] of [[C([st[0] + 11, st[1] + 18]), 1.6, 0], [T([h[0] + 10, h[1] + 4]), 1.3, 1], [W([w[0] - 2, w[1] + 4]), 1.1, 2]]) {
    smooth(ctx, [[p[0] - r, p[1]], [p[0] - r * 0.3, p[1] - r * 0.9], [p[0] + r * 0.8, p[1] - r * 0.6], [p[0] + r, p[1] + r * 0.3], [p[0] + r * 0.1, p[1] + r * 0.9], [p[0] - r * 0.7, p[1] + r * 0.6]]);
    ctx.fillStyle = tone(a, SPLOT[i]);
    ctx.fill();
  }
  ctx.restore();
}
// A rolled cuff at the sleeve's end (the shirt's).
function cuff(ctx, a, mode, D, k) {
  const W = ptOf(a, D, `hand${k}`, D.J[`wr${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const ang = Math.atan2(W[1] - E[1], W[0] - E[0]);
  ctx.save();
  ctx.translate(...W);
  ctx.rotate(ang);
  smooth(ctx, [[-3, -3.1], [0.2, -3.3], [0.8, 0], [0.2, 3.3], [-3, 3.1], [-3.6, 0]]);
  if (mode === 'line') paint(ctx, a, 'line', null);
  else {
    ctx.fillStyle = tone(a, k === 'F' ? SHIRT[2] : SHIRT[0]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.4, -3);
    ctx.lineTo(-1.4, 3);
    pen(ctx, tone(a, SHIRT[3], 0.6), 0.4);
    ctx.stroke();
  }
  ctx.restore();
}
// The flat paddle tail: a broad rounded paddle through its two springy halves, a soft criss-cross of light.
const TAIL_PTS_A = [[72, 118], [66, 128], TAIL_B];
const TAIL_PTS_B = [[50, 139], [41, 140.6], [34, 139.6]];
const TAIL_W = [8, 12, 18, 21, 21, 17, 8];
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
  return { c, ws };
}
function tail(ctx, a, mode, D) {
  const pts = [...TAIL_PTS_A.map((p) => ptOf(a, D, 'tailA', p)), ...TAIL_PTS_B.map((p) => ptOf(a, D, 'tailB', p))];
  const { c } = ribbon(ctx, pts, TAIL_W.map((w) => w * D.SC));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, TAILC[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] - 0.4, c[i][1] - 1.8, 3.6, TAILC[0], 0.5);
  for (let i = 1; i < c.length; i += 3) glow(ctx, c[i][0] + 0.4, c[i][1] + 2.2, 3, TAILC[2], 0.45);
  // a soft criss-cross of light along the paddle
  ctx.globalAlpha *= 0.28;
  pen(ctx, TAILC[0], 0.35);
  for (let i = 8; i < c.length - 2; i += 4) {
    const [x, y] = c[i];
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x - 2.4, y - 2.4 * s);
      ctx.lineTo(x + 2.4, y + 2.4 * s);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Its paintbrush (rig space, at its near paw, aimed by the pose): a wooden handle, a silver ferrule, a
// wide brush of cream bristles dipped mint.
function brushAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  const ang = a.gl?.brushAng ?? 1.2;
  const k = sstep(a.gl?.pocketed ?? 0);
  if (k <= 0) return { x: p[0], y: p[1], ang };
  // (hung in the loop at its near hip, like a tool in a belt: slid there from its paw, never popping)
  const h = ptOf(a, D, 'torso', [D.J.hip[0] + 13, D.J.hip[1] - 3]);
  return { x: mix(p[0], h[0], k), y: mix(p[1], h[1], k), ang: mix(ang, 1.9, k) };
}
function brush(ctx, a, mode, D) {
  const B = brushAt(a, D);
  ctx.save();
  ctx.translate(B.x, B.y);
  ctx.rotate(B.ang);
  ctx.scale(BS, BS);
  // (along +x: the handle's end behind the paw, then the ferrule and the brush out front)
  const handle = () => smooth(ctx, [[-6.4, -0.85], [3, -0.9], [3, 0.9], [-6.4, 0.85], [-7, 0]]);
  const head0 = () => smooth(ctx, [[3, -2.1], [5.4, -2.3], [9.6, -3.1], [11.2, -2.4], [11.4, 0], [11.2, 2.4], [9.6, 3.1], [5.4, 2.3], [3, 2.1]]);
  if (mode === 'line') {
    handle();
    paint(ctx, a, 'line', null);
    head0();
    paint(ctx, a, 'line', null);
    ctx.restore();
    return;
  }
  handle();
  ctx.fillStyle = tone(a, WOOD[1]);
  ctx.fill();
  ell(ctx, -0.6, -0.35, 3.4, 0.3);
  ctx.fillStyle = tone(a, WOOD[0]);
  ctx.fill();
  head0();
  ctx.fillStyle = tone(a, '#fff4e0');
  ctx.fill();
  ctx.save();
  head0();
  ctx.clip();
  // the silver ferrule, then the mint tip, wetter the more it's loaded
  ctx.fillStyle = tone(a, '#d6dce8');
  ctx.fillRect(2.8, -2.6, 2.8, 5.2);
  ctx.fillStyle = tone(a, '#f4f6fb');
  ctx.fillRect(3.2, -2.4, 0.8, 4.8);
  // the bristles' lines
  ctx.globalAlpha *= 0.35;
  pen(ctx, '#c8b8a0', 0.3);
  for (const yy of [-1.6, -0.5, 0.6, 1.7]) {
    ctx.beginPath();
    ctx.moveTo(5.8, yy * 0.9);
    ctx.lineTo(10.6, yy * 1.25);
    ctx.stroke();
  }
  ctx.globalAlpha /= 0.35;
  const wet = a.gl?.wet ?? 0.6;
  ctx.fillStyle = tone(a, PAINT[1]);
  ctx.fillRect(8.4 - wet * 1.8, -3.4, 4, 6.8);
  ell(ctx, 9.6, -1.4, 1, 0.55);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { paint: 7.6, measure: 6.6, gnaw: 6.2, thump: 6.0 };
const ORDER = ['paint', 'measure', 'gnaw', 'thump'];
const POOL = ['brush', 'thump', 'splat'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tailRot: 0, tailCurl: 0, capTilt: 0, capTip: 0, brushAng: 1.25, wet: 0.6, drips: 0, nosePaint: 0, pencilOut: false, pocketed: 0, pencil: 0, shave: 0, thumps: -1, swipe: -1, thud: -1, flick: -1, blowS: -1, sweat: -1, zz: 0, sit: 0 };
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
  // Standing: a sturdy stance, the brush held at its side like a tool, the far paw loose; walking, a
  // steady trudge, the heavy tail swinging a beat behind.
  go({ shN: -10 + br * 1.5, elN: -34, hwN: -6, shF: 8 + br, elF: -16, tilt: walking * 2, head: -1, chest: -br * 0.6 }, 1);
  q.tailRot = Math.sin(t * 0.55) * 0.04 + Math.sin((a.blkidU ?? t) * TAU - 0.8) * 0.08 * walking;
  q.tailCurl = Math.sin(t * 0.45 + 1) * 0.04;
  q.brushAng = 1.3 + Math.sin(t * 0.7) * 0.03;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.bvWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.bvAtk) {
      const pool = m.def.moves ?? POOL;
      st.bvN = (st.bvN ?? m.uid ?? 0) + 1;
      st.bvMove = m.move ?? pool[st.bvN % pool.length];
    }
    st.bvAtk = true;
  } else st.bvAtk = false;
  const mvName = st.bvAtk ? st.bvMove : null;
  const hadWind = now - (st.bvWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.bvCalm = mix(st.bvCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.bvCalm);
  let PC = st.bvPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.bvOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.bvOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.bvOrd = (st.bvOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.bvPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let sit = 0;

  if (k > 0.001 && piece === 'paint') {
    // broad strokes on the scenery, up and down
    const strokes = win(pu, 0.2, 0.6, 3.8, 4.2);
    const sw = Math.sin((pu - 0.6) * 4.2);
    go({ shN: -62 - sw * 26, elN: -40 + sw * 10, hwN: 0, tilt: 5, head: 3 - sw * 3, shF: 10, elF: -30 }, strokes * k);
    q.brushAng = mix(q.brushAng, -0.4 - sw * 0.25, strokes * k);
    q.drips = strokes * k;
    say('paint', strokes * k);
    // a drip lands on its nose: cross-eyed
    const drip = sstep((pu - 4.3) / 0.15) * (1 - sstep((pu - 6.4) / 0.3));
    q.nosePaint = drip * k;
    if (pu > 3.9 && pu < 4.35) q.noseDrip = (pu - 3.9) / 0.45;
    const cross = win(pu, 4.3, 4.45, 5.4, 5.6);
    go({ head: 6, neckR: 2 }, cross * k);
    say('cross', cross * k);
    // wiped off with the back of its paw
    const wipe = win(pu, 5.5, 5.8, 6.4, 6.7);
    go({ shN: -96 + Math.sin(pu * 18) * 8, elN: -128, hwN: -20, head: 4 }, wipe * k);
    q.brushAng = mix(q.brushAng, 2.5, wipe * k);
    say('sheepish', win(pu, 5.5, 5.7, 7.2, 7.6) * k);
  }
  if (k > 0.001 && piece === 'measure') {
    // the painter's measure: the brush held up at arm's length, upright, one eye shut, sizing up the
    // scenery; nudged up, down; a nod
    const hold0 = win(pu, 0.2, 0.7, 3.8, 4.3);
    const nudge = Math.sin((pu - 1.2) * 2.6) * win(pu, 1.2, 1.5, 3.4, 3.7);
    go({ shN: -98 + nudge * 8, elN: -8, hwN: 0, tilt: -4, head: -2, neckR: 2, chest: -2, shF: 10, elF: -20 }, hold0 * k);
    q.brushAng = mix(q.brushAng, -1.62, hold0 * k);
    say('wink', win(pu, 0.6, 0.8, 3.7, 3.9) * k);
    // a nod, pleased with what it sees; then a little doubt: a bit more orange?
    const nod = win(pu, 4.1, 4.3, 5.0, 5.3);
    add({ head: Math.sin((pu - 4.2) * 12) * 5 * nod }, k);
    say('pleased', nod * k);
    const doubt = win(pu, 5.2, 5.4, 6.2, 6.5);
    go({ head: 6, neckR: 5, tilt: 2 }, doubt * k);
    say('doubt', doubt * k);
  }
  if (k > 0.001 && piece === 'gnaw') {
    // the brush hung in the loop at its hip, then the pencil drawn from its bib pocket
    const hang = win(pu, 0.15, 0.4, 0.6, 0.75) + win(pu, 5.05, 5.25, 5.5, 5.75);
    go({ shN: 14, elN: -18, hwN: -10, head: 8, neckR: 3 }, hang * k);
    q.pocketed = sstep((pu - 0.42) / 0.2) * (1 - sstep((pu - 5.3) / 0.2));
    const draw = win(pu, 0.65, 0.85, 1.0, 1.15) + win(pu, 4.85, 5.0, 5.05, 5.2);
    go({ shN: 12, elN: -112, hwN: -30, head: 8, neckR: 3 }, draw * k);
    q.pencilOut = pu > 0.92 && pu < 5.0;
    // gnawed sharp: held to its big teeth, curls of shavings
    const gn = win(pu, 0.9, 1.2, 3.4, 3.7);
    go({ shN: -92, elN: -126, hwN: -10, head: 2 }, gn * k);
    q.pencil = 1;
    q.shave = gn * k;
    say('gnaw', gn * k);
    // its point admired, held up at arm's length
    const adm = win(pu, 3.6, 3.9, 4.8, 5.0);
    go({ shN: -112, elN: -40, hwN: -10, head: -6, chest: -2 }, adm * k);
    q.pencil = pu < 3.75 ? 1 : 2;
    say('admire', adm * k);
    say('pleased', win(pu, 5.3, 5.5, 5.9, 6.2) * k);
  }
  if (k > 0.001 && piece === 'thump') {
    // its tail thumped on the boards three times: the cue
    const th = win(pu, 0.2, 0.5, 2.6, 2.9);
    let pulse = 0;
    for (let i = 0; i < 3; i++) {
      const u = pu - 0.6 - i * 0.6;
      if (u > -0.25 && u < 0.35) pulse = Math.max(pulse, u < 0 ? sstep((u + 0.25) / 0.25) : 1 - sstep(u / 0.35));
      if (u >= 0 && u < 0.5) q.thumps = u;
    }
    q.tailRot += (0.35 - pulse * 0.6) * th * k;
    add({ lift: -0.012 * pulse, chest: 2 * pulse }, th * k);
    go({ shF: 10, elF: -30, head: -2 }, th * k);
    say('focus', th * k);
    // peering out at the stage, its paw shading its eyes (the brush sticking out behind)
    const lis = win(pu, 3.0, 3.3, 4.4, 4.7);
    go({ shN: -112, elN: -122, hwN: -10, head: -4, neckR: -2, tilt: 6, x: 0.02 }, lis * k);
    q.brushAng = mix(q.brushAng, 2.6, lis * k);
    say('listen', lis * k);
    // a happy nod: places!
    const nod = win(pu, 4.6, 4.8, 5.6, 6.0);
    add({ head: Math.sin((pu - 4.7) * 12) * 6 * nod }, k);
    go({ shN: -50, elN: -40 }, nod * k);
    say('places', nod * k);
  }

  if (fighting && alive && !st.bvHunt) st.bvBangAt = now;
  if (!fighting && st.bvHunt && alive) st.bvLostAt = now;
  st.bvHunt = fighting && alive;
  q.bang = now - (st.bvBangAt ?? -9);
  q.huh = now - (st.bvLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the brush held up like a sword, brows down -----
  // (the stance eases off as a move or a flinch takes over, never dropping out in one frame: the 2026-11-27
  // jitter probe found the arm and its prop leaping at the start of every wind-up)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    go({ shN: -56, elN: -60, tilt: 6, head: 4, shF: -30, elF: -40, lift: -0.02 }, huntW * (1 - walking * 0.5));
    q.brushAng = mix(q.brushAng, -0.9, huntW * (1 - walking * 0.5));
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.capTilt -= 0.22;
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'brush') {
      // the brush drawn back over its shoulder, leaning away
      go({ shN: 60, elN: -90, tilt: -9, chest: -5, head: -4, x: -0.03, shF: -40, elF: -40 }, wu);
      q.brushAng = mix(q.brushAng, -2.6, wu);
      q.wet = 1;
      say('focus', W);
      // then swept across at you in a big mint arc
      if (s >= 0) {
        go({ shN: -70, elN: -6, tilt: 16, chest: 6, head: 4, x: 0.07, shF: 20, elF: -30 }, sw);
        q.brushAng = mix(q.brushAng, 0.5, snap * sw);
        q.swipe = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else if (mvName === 'thump') {
      // turned away from you (a clean mirror flip), its paddle tail cocked up high behind it, at you
      q.twirl = W > 0.55 && s < 0.56;
      go({ tilt: -6, head: -8, neckR: -5, lift: -0.05, shN: -30, elN: -60, shF: -30, elF: -60 }, wu);
      q.tailRot += 0.85 * wu;
      q.tailCurl += 0.5 * wu;
      say('focus', W);
      if (s >= 0) {
        // then thumped down on you: a thud of dust and soft shock lines
        const slam = sstep(s / 0.08);
        q.tailRot += (0.85 - 1.3 * slam) * sw;
        q.tailCurl += (0.5 - 0.8 * slam) * sw;
        go({ tilt: 10, head: -12, neckR: -8, lift: -0.04, shN: -50, elN: -50, shF: -50, elF: -40 }, win(s, 0, 0.05, 0.45, 0.6) * sw);
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
        q.thud = s;
        q.thudAway = q.twirl;
      }
    } else {
      // the brush loaded low behind it
      go({ shN: 40, elN: -20, tilt: -4, lift: -0.04, head: 2, x: -0.02, shF: -20, elF: -40 }, wu);
      q.brushAng = mix(q.brushAng, 2.2, wu);
      q.wet = 1;
      say('focus', W);
      // then flicked up: a mint blob lobbed at you
      if (s >= 0) {
        go({ shN: -110, elN: -20, tilt: 6, chest: -3, head: -6, x: 0.04 }, sw);
        q.brushAng = mix(q.brushAng, -1.6, snap * sw);
        q.wet = 1 - sstep(s / 0.1) * 0.7;
        q.flick = s;
        say('happy', win(s, 0.05, 0.1, 0.5, 0.6));
      }
    }
  }
  // ----- Hurt: a wince, the cap jumping -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -30, elN: -90, shF: -40, elF: -100, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.capTilt -= 0.35 * kh;
    q.tailCurl += 0.4 * kh;
  }
  // ----- After landing a hit: blows on its brush tip, pleased -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.3 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 0.95, 1.3) * (1 - moveW);
    go({ shN: -80, elN: -110, hwN: -10, head: 2, tilt: -2 }, kg);
    q.brushAng = mix(q.brushAng, -1.9, kg);
    say('blow', kg);
    if (kg > 0.3) q.blowS = gl;
  }
  // ----- A nap (its habitat): sat back on its tail, the cap tipped down over its eyes -----
  st.bvNap = mix(st.bvNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.bvNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 14 + Math.sin(now * 1.3) * 2.5, neckR: 4, shN: -20, elN: -80, shF: -26, elF: -96, hwF: -20 }, nw);
    q.brushAng = mix(q.brushAng, 2.4, nw);
    q.capTip = nw;
    q.tailRot += 0.3 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (sit > 0.001) go({ lift: -0.17 + Math.sin(now * 1.3) * 0.006, tilt: -9, fxN: 0.4, fyN: 0.06, fxF: 0.34, fyF: 0.05, toeN: -14, toeF: -14 }, sit);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.capTilt -= 0.45;
  }
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.bvFace) {
    st.bvFaceFrom = st.bvFace;
    st.bvFace = f;
    st.bvFaceAt = now;
  }
  const since0 = now - (st.bvFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.bvFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.bvFaceFrom) && !(talky(f) && talky(st.bvFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.67) % 5.1;
  if (bl < 0.13 && !SHUTS.has(f) && f !== 'dizzy' && q.capTip < 0.5) f = 'shut';
  q.face = f;
  for (const key of ['capTilt', 'capTip', 'brushAng', 'pocketed', 'wet', 'tailRot', 'tailCurl']) {
    // (its prop's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly, where an
    // eased chase leapt off at full speed the frame a new aim was set; the 2026-11-27 jitter probe)
    if (key === 'brushAng') {
      let x = st.bv_brushAng ?? q[key];
      let v = st.bv_brushAngV ?? 0;
      const n = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        v += (400 * (q[key] - x) - 40 * v) * h;
        x += v * h;
      }
      st.bv_brushAngV = v;
      st.bv_brushAng = x;
      q[key] = x;
      continue;
    }
    const rate = key === 'brushAng' ? 14 : key.startsWith('tail') ? 9 : 10;
    st[`bv_${key}`] = mix(st[`bv_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`bv_${key}`];
  }
  q.sit = sit;
  q.calm = cw;
  st.bvTwirl = Boolean(q.twirl);
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little paint-swatch card (a cream card with a mint drip down one corner).
function swatch(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5, -5], [5, -5.2], [5.4, 4.2], [-5.2, 4.6]]);
    if (pass === 'line') {
      pen(ctx, '#9a6a5a', 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffaf2';
      ctx.fill();
    }
  }
  // the drip
  smooth(ctx, [[2.6, -5.6], [5.8, -5.6], [5.6, -2], [4.4, 0.6], [3.6, -1.6], [2.6, -3.6]]);
  ctx.fillStyle = PAINT[1];
  ctx.fill();
  ctx.strokeStyle = mark === '!' ? PAINT[3] : '#7a6a8a';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(-0.6, -2.8);
    ctx.lineTo(-0.6, 0.4);
  } else {
    ctx.moveTo(-2.1, -1.8);
    ctx.quadraticCurveTo(-1.8, -3.4, -0.2, -3.3);
    ctx.quadraticCurveTo(1.4, -3, 0.8, -1.4);
    ctx.quadraticCurveTo(-0.2, -0.7, -0.4, 0.5);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? -0.6 : -0.4, 2.3, 0.8, 0.8);
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
  ctx.strokeStyle = DENIM[3];
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f4f8ff';
  ctx.stroke();
  ctx.restore();
}
// A glossy soft drop of mint paint.
function drop(ctx, x, y, r, al = 1, stretch = 1) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * Math.min(1.25, 0.95 + (stretch - 1) * 0.3), 0, 0, TAU);
  ctx.fillStyle = PAINT[1];
  ctx.fill();
  pen(ctx, PAINT[3], Math.max(0.3, r * 0.2));
  ctx.stroke();
  ell(ctx, x - r * 0.3, y - r * 0.1, r * 0.3, r * 0.22);
  ctx.fillStyle = PAINT[0];
  ctx.fill();
  ctx.restore();
}
// A soft splat of paint where a blob lands: a round blob with rounded lobes, glossy.
function splat(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  smooth(ctx, [[x - r, y], [x - r * 0.6, y - r * 0.32], [x + r * 0.2, y - r * 0.38], [x + r, y - r * 0.12], [x + r * 0.7, y + r * 0.26], [x - r * 0.3, y + r * 0.3]]);
  ctx.fillStyle = PAINT[1];
  ctx.fill();
  pen(ctx, PAINT[3], 0.5);
  ctx.stroke();
  ell(ctx, x - r * 0.3, y - r * 0.12, r * 0.36, r * 0.1);
  ctx.fillStyle = PAINT[0];
  ctx.fill();
  ctx.restore();
  for (const [dx, rr] of [[-r * 1.4, 0.6], [r * 1.35, 0.5], [r * 0.2, 0.45]]) drop(ctx, x + dx, y - (dx > 0 && rr < 0.5 ? r * 0.55 : 0.2), rr * (r / 4), al);
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
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
  const B = brushAt(a, D);
  const tip = [B.x + Math.cos(B.ang) * 11.2 * BS, B.y + Math.sin(B.ang) * 11.2 * BS];
  // paint dripping off the brush as it paints (each drop falls to the floor and is gone)
  if ((q.drips ?? 0) > 0.05) {
    for (let i = 0; i < 3; i++) {
      const P = 0.9 + i * 0.27;
      const f = (((t + i * 0.4) % P) + P) % P / P;
      const n = Math.floor((t + i * 0.4) / P);
      if (!a.mo[`bvDrip${i}`] || a.mo[`bvDrip${i}`].n !== n) a.mo[`bvDrip${i}`] = { n, x: tip[0], y: tip[1] };
      const d = a.mo[`bvDrip${i}`];
      const y = mix(d.y, -0.8, f * f);
      if (f < 0.92) drop(ctx, d.x - f * 1.5, y, 0.8, q.drips * (1 - sstep((f - 0.75) / 0.17)), 1 + f);
    }
  }
  // the drip that lands on its nose
  if ((q.noseDrip ?? -1) >= 0 && q.noseDrip < 1) {
    const [nx, ny] = headAt(a, D, [20.5, 1]);
    drop(ctx, nx, mix(ny - 14, ny, sstep(q.noseDrip)), 0.9, 1);
  }
  // the pencil in its paw (gnawed, then held up)
  if (q.pencilOut) {
    const [hx, hy] = handPt('N');
    ctx.save();
    ctx.translate(hx, hy - 0.6);
    ctx.rotate(q.pencil === 2 ? -1.2 : -0.3);
    ctx.scale(D.SC * HS * 1.12, D.SC * HS * 1.12);
    for (const md of ['line', 'fill']) pencilShape(ctx, a, md, 8);
    ctx.restore();
    if (q.pencil === 2) sparkle(ctx, hx + 1.5, hy - 5, 1.4 * (0.6 + 0.4 * Math.sin(t * 8)), 1, '#fff6c8');
  }
  // curls of shavings off the pencil as it gnaws
  if ((q.shave ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [19, 10]);
    for (let i = 0; i < 3; i++) {
      const f = ((t * 1.7 + i / 3) % 1);
      const x = mx + 2 + f * 4 + Math.sin(f * 6 + i) * 1.5;
      const y = my + f * 16;
      ctx.save();
      ctx.globalAlpha *= q.shave * (1 - f);
      ctx.translate(x, y);
      ctx.rotate(f * 6 + i);
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 1.4);
      pen(ctx, WOOD[1], 0.7);
      ctx.stroke();
      ctx.restore();
    }
  }
  // its tail's thumps: soft dust puffs behind it
  if ((q.thumps ?? -1) >= 0 && q.thumps < 0.5) {
    const tp = ptOf(a, D, 'tailB', TAIL_PTS_B[1]);
    const u = q.thumps / 0.5;
    dust(ctx, tp[0] - 2 - u * 3, -1.5 - u * 2, 1.6 + u * 1.6, 1 - u, '#f4e6d6', '#d4bca6');
    dust(ctx, tp[0] + 3 + u * 2, -1.2 - u * 1.5, 1.3 + u * 1.2, 1 - u, '#f4e6d6', '#d4bca6');
  }
  // Brush Swipe: a big mint arc, drops flying off its end
  if ((q.swipe ?? -1) >= 0 && q.swipe < 0.7) {
    const u = q.swipe / 0.7;
    const [cx, cy] = ptOf(a, D, 'chest', D.J.stern);
    const al = (1 - sstep((u - 0.25) / 0.5)) * 0.9;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 18, -2.2, -2.2 + 2.6 * sstep(u * 3.2));
    pen(ctx, PAINT[0], 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 18, -2.1, -2.1 + 2.5 * sstep(u * 3.2));
    pen(ctx, PAINT[1], 2);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const v = clamp(u * 1.5 - i * 0.1, 0, 1);
      if (v > 0 && v < 1) drop(ctx, cx + 18 + i * 3 + v * 10, cy + 6 + (i - 1.5) * 3 + v * v * 14, 0.9 - i * 0.1, 1 - v, 1 + v);
    }
  }
  // Tail Thump: a thud of dust and soft shock lines where the paddle lands (kept where it landed)
  if ((q.thud ?? -1) >= 0 && q.thud < 0.55) {
    const tp = ptOf(a, D, 'tailB', TAIL_PTS_B[1]);
    if (!a.mo.bvThud || q.thud < 0.1) a.mo.bvThud = { x: tp[0], away: q.thudAway };
    const x0 = a.mo.bvThud.x * (a.mo.bvThud.away === q.thudAway ? 1 : -1);
    const u = clamp((q.thud - 0.07) / 0.48, 0, 1);
    if (q.thud > 0.07) {
      for (let i = 0; i < 4; i++) {
        const side = i % 2 ? 1 : -1;
        dust(ctx, x0 + side * (2 + u * 9) * (1 + (i >> 1) * 0.6), -1.5 - u * 3 - (i >> 1), 2.6 + u * 2, (1 - u) * 0.9, '#f2e4d4', '#d2b8a0');
      }
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.8;
      ctx.lineCap = 'round';
      for (const [dx, h] of [[-6, 4], [0, 6], [6, 4]]) {
        ctx.beginPath();
        ctx.moveTo(x0 + dx * (1 + u), -8 - u * 4);
        ctx.lineTo(x0 + dx * (1 + u) * 1.2, -8 - u * 4 - h);
        pen(ctx, '#ffffff', 1.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  } else a.mo.bvThud = null;
  // Paint Flick: a mint blob lobbed at you, splatting soft where it lands
  if ((q.flick ?? -1) >= 0 && q.flick < 0.95) {
    const s = q.flick;
    if (!a.mo.bvFlick || s < 0.03) a.mo.bvFlick = tip.slice();
    const [ox, oy] = a.mo.bvFlick;
    const u = clamp(s / 0.45, 0, 1);
    const x = mix(ox, 30, u);
    const y = mix(oy, -1.5, u) - Math.sin(Math.PI * u) * 12;
    if (u < 1) {
      drop(ctx, x, y, 1.6, 1, 1.2);
      for (let i = 1; i <= 2; i++) drop(ctx, x - i * 2.2, y + i * 0.8, 0.8 - i * 0.2, 0.8 - i * 0.25);
    } else {
      const v = clamp((s - 0.45) / 0.5, 0, 1);
      splat(ctx, 30, -0.8, 3 + sstep(v * 3) * 3, 1 - sstep((v - 0.5) / 0.5));
      for (let i = 0; i < 4; i++) {
        const an = -Math.PI * 0.15 - (i / 3) * Math.PI * 0.7;
        drop(ctx, 30 + Math.cos(an) * v * 8, -2 + Math.sin(an) * v * 7 + v * v * 5, 0.7 * (1 - v), 1 - v);
      }
    }
  } else a.mo.bvFlick = null;
  // its gloat: blowing on the brush tip, a soft puff and a sparkle
  if ((q.blowS ?? -1) >= 0 && q.blowS < 1.2) {
    const f = (q.blowS * 1.4) % 1;
    dust(ctx, tip[0] + 1 + f * 3, tip[1] - 2 - f * 4, 0.9 + f, (1 - f) * 0.7, '#ffffff', '#ece6f0');
    sparkle(ctx, tip[0] + 2, tip[1] - 1, 1.4 * Math.sin(Math.PI * Math.min(1, q.blowS)), 1, '#ffe8c0');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -26]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [6, -34]);
  if (q.bang >= 0 && q.bang < 1.1) swatch(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) swatch(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'backdropbeaver',
  // (the skin is its denim dungarees; its sleeves the shirt's cream; its own fur at the paws, feet, neck)
  skin: {
    lt: DENIM[0], base: DENIM[1], sh: DENIM[2], deep: DENIM[3], ink: INK, guides: false, out: LW,
    parts: {
      arm: { lt: SHIRT[0], base: SHIRT[1], sh: SHIRT[2], deep: SHIRT[3] },
      hand: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
      foot: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: '#523424' },
      neck: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3] },
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
    handNskin: (ctx, a, mode, S, D) => brush(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => dungarees(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('beaver', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (Tail Thump: it turns its back on you, a clean mirror flip, never a squeeze)
  const st = a.mo?.rig;
  const flip0 = a.flip;
  if (st?.bvTwirl && m.hp > 0) a.flip = !a.flip;
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
  a.flip = flip0;
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
export const BACKDROP_BEAVER_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const BACKDROP_BEAVER_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
