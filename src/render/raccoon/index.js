// The Red-Tape Raccoon (2026-11-27, the Dream Theatre's Stapler Croc remade from scratch as a new creature;
// the id stays `primadonna`). A clerk from Act II, the Queen's dream of her old office: a prim little
// raccoon in shirtsleeves and a green eyeshade who has never once approved a form on the first try. It
// guards the In tray, stamps DENIED with relish, and ties up everything (and everyone) in red tape. On its
// own copy of the creature base (rig.js; body.js `raccoon`: a soft barrel of a body, short legs, deft
// arms with small clever hands), dressed here; its head, ringed tail, clothes and stamp drawn here from
// scratch over the mannequin (never the shared face, never the hero).
//   look    soft silver-grey fur, a cream muzzle and brow, a soft plum-grey mask band across its eyes (a
//           band, never spots), round ears with cream rims; a green celluloid eyeshade on a band; its
//           clothes worn: a crisp lilac-white shirt (the base's own body and arm skin, so it folds with
//           every pose) with red sleeve garters, a navy tie and charcoal trousers with a belt (the
//           trousers the legs' own skin, the waist cut from the body's outline); its paws and feet its own
//           fur, dark like gloves; a fluffy tail with soft charcoal rings (no lines inside). A wooden
//           rubber stamp in its near paw. Its own soft plum outline, outer edge only, face bare.
//   eyes    its own "clerk's eyes": a low gentle dome on top (its neat lash line), full and round
//           underneath, a cool lilac-grey iris kept whole and clear, a deep pupil, and one glint: a
//           thin bar of light like a desk lamp on glass. Thin straight brows that do its acting (one
//           raised, mostly). A small prim mouth.
//   walk    the base's walk at a clerk's officious pace (30), stamp held at the ready, tail swaying.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - stamp (7.0 s): a breath on the stamp (hah), then THUNK on the floor in front of it, a soft
//             red seal left there; again, THUNK; an inspection of its work, a satisfied sniff;
//           - polish (6.4 s): the stamp rubbed clean on its shirt front, held up to the light, a glint;
//           - visor (6.0 s): the eyeshade adjusted, a long suspicious look at you over the top of it; a
//             "next!" flick of its paw;
//           - clock (6.6 s): a look at the watch on its wrist; a sigh; a foot tapping; a slump.
//   moves   Red Tape (a roll of red tape whipped out and flung at you, unspooling as it flies: its shot,
//           `redtape`, drawn here); DENIED (the stamp raised high in both paws; then slammed down on you,
//           a soft red seal bursting); Paperwork (a sheaf of forms riffled out of its shirt; then fanned at
//           you, the pages fluttering in a soft spray).
//   else    hurt: a wince, the eyeshade knocked up; after landing a hit: a smug "next!" and its brow
//           raised; hunting you: the stamp held up, one brow raised; low on health: flustered, a bead of
//           sweat, tie askew; a nap (habitat): asleep standing, its head on its chest, the eyeshade down;
//           beaten: dizzy. Its marks over its head (!, ?, z's, sweat) are its own: little rubber-stamped
//           memo slips (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: red tape as a soft glossy ribbon, ink as soft
// rounded seals (never splashes), paper as soft cream sheets, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, dust, sweat } from './fx.js';

const BIG = 1.12;
const LW = 1.6 / BIG;
const INK = '#6a5a7a';
const FUR = ['#dcd8e4', '#b2aec0', '#8e8aa0', '#6e6a82'];
const CREAM = ['#fffdf8', '#f2eee8', '#dcd6ce'];
const MASKC = ['#8e86a0', '#6e6680'];
const PAW = ['#9a92aa', '#7a7290', '#5e5874', '#4a445e'];
const SHIRT = ['#fdfcff', '#eeeaf8', '#d6d0e6', '#bab2cc'];
const TROU = ['#8e8aa0', '#6c6884', '#545068', '#403c52'];
const TIE = ['#8a9ad8', '#5a6aae', '#46528a'];
const GART = ['#ff9aa4', '#e86a7a'];
const VISOR = ['#c8f0c8', '#8ed69a', '#62b276'];
const LASH = '#3e3450';
const IRIS = ['#3a3450', '#6a6290', '#9a92c0', '#cec8ea'];
const RED = ['#ffd0d4', '#ff8a96', '#e8606e', '#c24656'];
const WOOD = ['#f0c890', '#c8925a', '#9e6a3c'];
const PAPER = ['#ffffff', '#fbf6ea', '#e6dcc6'];

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
const HO = [1.4, -15.6];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const TAIL_A = [71, 118.6];
const TAIL_B = [60.4, 132];
const JOINTS = { tailA: TAIL_A, tailB: TAIL_B };
const PIV2 = { tailA: 'tailA', tailB: 'tailB' };
const SOFTS = [
  { name: 'tailA', parent: 'torso', pivot: 'tailA', rot: (S, a) => a.gl?.tailRot ?? 0, soft: { k: 66, c: 5.6, gain: 0.42, turn: 0.7, hang: 0.25, max: 13, flutter: 1.3, hz: 0.42, dir: [-6, 6] } },
  { name: 'tailB', parent: 'tailA', pivot: 'tailB', rot: (S, a) => a.gl?.tailCurl ?? 0, soft: { k: 58, c: 5, gain: 0.48, turn: 0.7, hang: 0.2, max: 15, flutter: 1.7, hz: 0.48, dir: [-7, 0] } },
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
// b: [far brow lift, near brow lift] (negative up); the near brow does most of its acting.
const FACES = {
  calm: { e: 'open', g: [0.6, 0.4], b: [0, 0], m: 'prim' },
  smug: { e: 'open', g: [1.2, 0.2], b: [0.4, -1.4], m: 'smirk' },
  stern: { e: 'open', g: [1.5, 0.5], b: [0.8, 0.8], m: 'set' },
  doubt: { e: 'open', g: [1.6, 1], b: [0.8, -1.8], m: 'prim' },
  hah: { e: 'shut', b: [0, 0], m: 'o' },
  thunk: { e: 'squeeze', b: [0.6, 0.6], m: 'set' },
  pleased: { e: 'happy', b: [-0.4, -0.8], m: 'smirk' },
  polish: { e: 'shut', b: [-0.2, -0.4], m: 'prim' },
  glint: { e: 'wide', g: [1, -1.2], b: [-1, -1.6], m: 'smirk' },
  peer: { e: 'open', g: [1.8, 0.2], b: [1, -0.6], m: 'set' },
  next: { e: 'happy', b: [0, -1.2], m: 'open' },
  watch: { e: 'open', g: [1.2, 1.6], b: [0.2, 0.4], m: 'prim' },
  sigh: { e: 'shut', b: [1, -0.8], m: 'o' },
  tap: { e: 'open', g: [-0.6, 0.6], b: [1.2, 0.6], m: 'wobble' },
  fierce: { e: 'open', g: [1.6, 0.5], b: [1, -1.4], m: 'set' },
  shout: { e: 'squeeze', b: [1.4, 1.4], m: 'shout' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'open' },
  hurt: { e: 'squeeze', b: [-1, -1.6], m: 'wobble' },
  worried: { e: 'open', g: [0.3, 0.9], b: [-1.2, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [-1.4, -1.4], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'prim' },
  shut: { e: 'shut', b: [0, 0], m: 'prim' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, -0.6], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, -0.6], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, -0.6], m: 'o' },
};
const SHUTS = new Set(['hah', 'thunk', 'pleased', 'polish', 'next', 'sigh', 'shout', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The clerk's eye: flat along the top (the ruled lash line), round below.
function eyePath(ctx, x, y, w, h) {
  ctx.beginPath();
  ctx.moveTo(x - w, y - h * 0.35);
  ctx.bezierCurveTo(x - w * 0.6, y - h * 1.05, x + w * 0.6, y - h * 1.05, x + w, y - h * 0.35);
  ctx.bezierCurveTo(x + w * 1.05, y + h * 0.5, x + w * 0.55, y + h, x, y + h);
  ctx.bezierCurveTo(x - w * 0.55, y + h, x - w * 1.05, y + h * 0.5, x - w, y - h * 0.35);
  ctx.closePath();
}
function eye(ctx, a, x, y, o, f) {
  const w = 3.6;
  const h = 4;
  const kind = f.e;
  if (kind === 'happy') {
    stroke3(ctx, a, [x - w, y + 1.4], [x, y - h * 0.6], [x + w, y + 1.4], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    stroke3(ctx, a, [x - w * 0.9 * o, y - 1.6], [x + w * 0.3 * o, y + 0.1], [x + w * 0.9 * o, y + 0.5], 1.35, LASH);
    stroke3(ctx, a, [x - w * 0.9 * o, y + 2.6], [x + w * 0.2 * o, y + 1.4], [x + w * 0.9 * o, y + 0.7], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    stroke3(ctx, a, [x - w, y + 0.6], [x, y + (kind === 'sleep' ? 2.8 : 2.2)], [x + w, y + 0.6], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  eyePath(ctx, x, y, w * big, h * big);
  ctx.fillStyle = tone(a, '#fdfcff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * w * 0.6;
      const py = y + 1.2 + Math.sin(an) * u * h * 0.55;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
  } else {
    const [gx, gy] = f.g ?? [0.6, 0.4];
    ctx.save();
    eyePath(ctx, x, y, w * big, h * big);
    ctx.clip();
    const ir = kind === 'wide' ? 0.62 : 0.7;
    const ix = x + gx * 0.5;
    const iy = y + 0.6 + gy * 0.35;
    const r = w * ir;
    // the iris, whole below the ruled line: cool lilac-grey, lighter at the bottom
    ell(ctx, ix, iy, r, r * 1.05);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.12, r * 0.88, r * 0.9);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.5, r * 0.66, r * 0.4);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    ell(ctx, ix, iy + r * 0.72, r * 0.4, r * 0.16);
    ctx.fillStyle = tone(a, IRIS[3], 0.8);
    ctx.fill();
    ell(ctx, ix, iy, r * 0.42, r * 0.44);
    ctx.fillStyle = tone(a, '#221c30');
    ctx.fill();
    // its one glint: a thin bar of desk-lamp light across the top of the iris
    ctx.beginPath();
    ctx.moveTo(ix - r * 0.6, iy - r * 0.42);
    ctx.lineTo(ix + r * 0.35, iy - r * 0.52);
    pen(ctx, '#ffffff', 0.85);
    ctx.stroke();
    ell(ctx, ix + r * 0.45, iy + r * 0.4, 0.42, 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // the ruled lash line: straight along the top, round at its ends, a short neat tick at the outer corner
  ctx.beginPath();
  ctx.moveTo(x - w * 1.02, y - h * 0.35 * big);
  ctx.bezierCurveTo(x - w * 0.6, y - h * 1.08 * big, x + w * 0.6, y - h * 1.08 * big, x + w * 1.02, y - h * 0.35 * big);
  pen(ctx, tone(a, LASH), 1.3);
  ctx.stroke();
  stroke3(ctx, a, [x + w * 0.95 * o, y - h * 0.35], [x + (w + 0.8) * o, y - h * 0.45], [x + (w + 1.2) * o, y - h * 0.8], 0.9, LASH);
}
// Thin straight brows: a ruled dash each, raised (negative) or knit (positive) at its own end.
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 2.4, y + lift * 0.4);
  ctx.lineTo(x + o * 2.4, y + lift * 0.9 - (lift < 0 ? 0.6 : 0));
  pen(ctx, tone(a, MASKC[1]), 1.05);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#5e3a52';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.2], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#6e2e48');
    ctx.fill();
    ell(ctx, x, y + h * 0.8, w * 0.55, h * 0.3);
    ctx.fillStyle = tone(a, '#ff9cb4');
    ctx.fill();
  };
  const line = (pts, w = 0.7) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'smirk':
      line([[x - 1.8, y + 0.3], [x - 0.2, y + 0.8], [x + 1.4, y + 0.1], [x + 2, y - 0.3], [x + 2.4, y - 0.9]]);
      break;
    case 'open':
      open(1.9, 2);
      break;
    case 'shout':
      open(2.3, 2.8);
      break;
    case 'o':
      ell(ctx, x, y + 0.6, 0.9, 1);
      ctx.fillStyle = tone(a, '#6e2e48');
      ctx.fill();
      break;
    case 'set':
      line([[x - 1.8, y + 0.4], [x, y + 0.4], [x + 1.8, y + 0.3]], 0.8);
      break;
    case 'wobble':
      line([[x - 1.9, y + 0.4], [x - 0.9, y - 0.2], [x, y + 0.3], [x + 0.9, y - 0.2], [x + 1.9, y + 0.4]], 0.65);
      break;
    case 'frown':
      line([[x - 1.7, y + 0.9], [x, y - 0.1], [x + 1.7, y + 0.9]]);
      break;
    case 'talkA':
      open(1.5, 1.8);
      break;
    case 'talkE':
      open(1.9, 1.1);
      break;
    default:
      // prim: a small neat line, its corners tucked in, the far one a touch down
      line([[x - 1.6, y + 0.5], [x, y + 0.15], [x + 1.6, y + 0.35]], 0.7);
  }
}
const SKULL = [[-18.2, -1], [-16.6, -10.4], [-10.6, -16], [-1.6, -17.8], [7.2, -16.8], [14, -12.6], [18.4, -6.6], [23.4, -1], [26, 3.4], [24.6, 7.6], [18.6, 11.4], [9.4, 14.8], [-2.6, 15], [-12.8, 11]];
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  smooth(ctx, [[-r, 1.6], [-r * 0.9, -r * 0.7], [0, -r * 1.25], [r * 0.9, -r * 0.7], [r, 1.6]]);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    smooth(ctx, [[-r * 0.86, 0.6], [-r * 0.76, -r * 0.6], [0, -r * 1.1], [r * 0.76, -r * 0.6], [r * 0.86, 0.6], [0, 0]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    ell(ctx, 0, -r * 0.2, r * 0.48, r * 0.6);
    ctx.fillStyle = tone(a, FUR[3]);
    ctx.fill();
  }
  ctx.restore();
}
// Its eyeshade: a green celluloid visor on a band round its brow (`up` lifts it, `down` tips it low).
// (2026-11-27 finish: the band hugs its crown just inside the head's outline and the brim is a short
// curved shade over its brows, its front just past the face; the first try, a straight bar with a long
// blade, read as a stick through its head once tipped down for a nap.) It pivots at the back of its head.
function visor(ctx, a, mode, up, down) {
  ctx.save();
  ctx.translate(-14, -8 + down * 1.6);
  ctx.rotate(-up * 0.16 + down * 0.1);
  ctx.translate(14, 8);
  // the band round its head, following the crown
  smooth(ctx, [[-17.2, -4.6], [-15.4, -11.6], [-7.4, -16.4], [2.6, -17.2], [10.8, -15.4], [16.4, -10.6], [14.6, -9.4], [9.8, -13.4], [2.4, -15], [-6.2, -14.2], [-13, -10.2], [-15, -4.2]]);
  paint(ctx, a, mode, VISOR[2]);
  // the shade, see-through green, out over its brows
  smooth(ctx, [[-4.6, -14.6], [6, -16], [15.6, -13.6], [21.6, -10.6], [20.4, -9.2], [14, -10.6], [6, -12.2], [-2.4, -12.6]]);
  if (mode === 'line') paint(ctx, a, 'line', null);
  else {
    ctx.fillStyle = tone(a, VISOR[0], 0.82);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2, -14.2);
    ctx.quadraticCurveTo(12, -14.6, 19.4, -10.8);
    pen(ctx, tone(a, '#ffffff', 0.8), 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -14.6, -10.6, 4, -0.55);
  ear(ctx, a, mode, -4.6, -16.2, 4.2, -0.15);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -11, 16, FUR[0], 0.8);
    glow(ctx, -16, 9, 11, FUR[2], 0.6);
    // the cream brow and muzzle
    smooth(ctx, [[-2, -11], [8, -12.4], [16, -8.6], [17, -6], [8, -7.6], [-1, -7.4]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    smooth(ctx, [[1, 5], [9, 2.4], [17, 0.6], [24, 0.4], [26.6, 3.6], [24.6, 8.4], [17, 12.6], [8, 15], [-1, 12.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 18, 5, 7, CREAM[0], 0.9);
    // the mask: one soft band across both eyes, fading toward the cheeks (never spots)
    smooth(ctx, [[-12, -6.6], [-4, -8], [6, -8.4], [14.6, -6.8], [17.2, -3], [15, 1.6], [9, 2.4], [3, 0.6], [-3, 2], [-10, 1.6], [-14, -2]]);
    ctx.fillStyle = tone(a, MASKC[0]);
    ctx.fill();
    glow(ctx, 2, -3, 8, MASKC[1], 0.35);
    ctx.restore();
    eye(ctx, a, -4.2, -3.4, -1, f);
    eye(ctx, a, 9, -3.8, 1, f);
    brow(ctx, a, -4.4, -10.4, -1, f.b?.[0] ?? 0);
    brow(ctx, a, 9.2, -10.8, 1, f.b?.[1] ?? 0);
    for (const [cx, cy, k] of [[-8.4, 6.4, 0.55], [12, 7.4, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ffa0b8', 0.4 * k);
      ctx.fill();
    }
    // the nose: a soft round plum button, a light on it
    ell(ctx, 24.6, 2.6, 2.2, 1.7, 0.15);
    ctx.fillStyle = tone(a, '#4e4060');
    ctx.fill();
    ell(ctx, 24, 1.9, 0.9, 0.45, 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fill();
    mouth(ctx, a, 20.4, 8.4, f.m);
  }
  visor(ctx, a, mode, q.visorUp ?? 0, q.visorDown ?? 0);
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
// Shirt front details over the body: the placket and buttons, the tie, the trousers' waist and belt.
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
  const c0 = C([st[0] + 6, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 6, SHIRT[0], 0.8);
  // the trousers from the waist down, and the belt
  poly(ctx, [W([w[0] - 40, w[1] + 4]), W([w[0] + 40, w[1] + 4]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, TROU[1]);
  ctx.fill();
  const sh = T([h[0] - 12, h[1] + 3]);
  glow(ctx, sh[0], sh[1], 7, TROU[3], 0.45);
  ctx.beginPath();
  ctx.moveTo(...W([w[0] - 40, w[1] + 4.6]));
  ctx.lineTo(...W([w[0] + 40, w[1] + 4.6]));
  pen(ctx, tone(a, TROU[3]), 1.6);
  ctx.stroke();
  const bk = W([w[0] + 8.6, w[1] + 4.6]);
  smooth(ctx, [[bk[0] - 1.3, bk[1] - 1.1], [bk[0] + 1.3, bk[1] - 1.1], [bk[0] + 1.3, bk[1] + 1.1], [bk[0] - 1.3, bk[1] + 1.1]]);
  ctx.fillStyle = tone(a, '#e6dcb0');
  ctx.fill();
  // the placket down the shirt front, its little buttons
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 5.4, st[1] + 2]));
  ctx.quadraticCurveTo(...W([w[0] + 6.8, w[1] - 4]), ...W([w[0] + 7.4, w[1] + 3.6]));
  pen(ctx, tone(a, SHIRT[2], 0.8), 0.5);
  ctx.stroke();
  // the tie: a knot under the collar, a long blade down its front, a touch askew when it's flustered
  const sk = a.gl?.tieSkew ?? 0;
  const k0 = C([st[0] + 5.2, st[1] - 0.6]);
  const blade = [C([st[0] + 3.6, st[1] + 1.2]), C([st[0] + 7, st[1] + 1.2]), W([w[0] + 9.2 + sk * 3, w[1] - 0.6]), W([w[0] + 6.8 + sk * 3, w[1] + 2.6]), W([w[0] + 4.4 + sk * 3, w[1] - 0.6])];
  smooth(ctx, blade);
  ctx.fillStyle = tone(a, TIE[1]);
  ctx.fill();
  ctx.save();
  smooth(ctx, blade);
  ctx.clip();
  pen(ctx, tone(a, TIE[0], 0.7), 0.6);
  for (let i = 0; i < 4; i++) {
    const p = C([st[0] + 3, st[1] + 3 + i * 3.2]);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] + 4, p[1] - 1.6);
    ctx.stroke();
  }
  ctx.restore();
  ell(ctx, k0[0], k0[1], 2, 1.6);
  ctx.fillStyle = tone(a, TIE[2]);
  ctx.fill();
  ctx.restore();
}
// The shirt collar: two soft white points under its chin.
function collar(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  for (const pts of [[[-6, -4.4], [3.4, -3.6], [5, 0.4], [-1, 1.6], [-6.6, -0.6]], [[5.6, -3.6], [13, -4.2], [12.6, -0.6], [8.6, 1.6], [5.4, 0.4]]]) {
    smooth(ctx, pts.map(([x, y]) => C([st[0] + x, st[1] + y])));
    paint(ctx, a, mode, SHIRT[0]);
  }
}
// A red sleeve garter round the upper arm.
function garter(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  const S0 = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const p = [mix(S0[0], E[0], 0.62), mix(S0[1], E[1], 0.62)];
  const ang = Math.atan2(E[1] - S0[1], E[0] - S0[0]);
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(ang);
  const hw = k === 'F' ? 1.3 : 1.55;
  smooth(ctx, [[-0.75, -hw], [0.75, -hw], [0.8, hw], [-0.8, hw]]);
  ctx.fillStyle = tone(a, k === 'F' ? GART[1] : GART[0]);
  ctx.fill();
  ctx.restore();
}
// The ringed tail: one fluffy plume, its rings soft charcoal bands (no lines inside).
const TAIL_PTS_A = [[72.6, 116], [67, 125], TAIL_B];
const TAIL_PTS_B = [[50, 137], [40, 135.6], [33, 129]];
const TAIL_W = [10, 15, 18, 19, 18, 15, 10];
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
  const { c, ws } = ribbon(ctx, pts, TAIL_W.map((w) => w * D.SC));
  if (mode === 'line') return paint(ctx, a, 'line', null);
  ctx.fillStyle = tone(a, FUR[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // its rings: soft charcoal bands across the plume, each a soft band (no line), the tip dark
  for (const u of [0.32, 0.52, 0.72, 0.95]) {
    const i = Math.round(u * (c.length - 1));
    const p = c[Math.min(c.length - 1, i)];
    const q = c[Math.max(0, i - 1)];
    const an = Math.atan2(p[1] - q[1], p[0] - q[0]);
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(an);
    ell(ctx, 0, 0, u > 0.9 ? 4 : 1.5, ws[i] * 1.3);
    ctx.fillStyle = tone(a, MASKC[1], 0.85);
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < c.length; i += 3) glow(ctx, c[i][0] - 0.4, c[i][1] - 1.6, 3.2, FUR[0], 0.5);
  ctx.restore();
}
// The rubber stamp (rig space, at its near paw): a round wooden knob, a neck, a block, the red rubber.
function stampAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0], y: p[1], ang: a.gl?.stampAng ?? 1.4 };
}
function stamp(ctx, a, mode, D) {
  const S = stampAt(a, D);
  ctx.save();
  ctx.translate(S.x, S.y);
  ctx.rotate(S.ang);
  // (along +x: the knob in the paw, the neck, the block, the rubber face out front)
  const shapes = [
    () => ell(ctx, -1, 0, 2.6, 2.4),
    () => smooth(ctx, [[0.6, -1.1], [3.4, -1.1], [3.4, 1.1], [0.6, 1.1]]),
    () => smooth(ctx, [[3.2, -3.6], [6.2, -3.6], [6.4, 3.6], [3.2, 3.6]]),
    () => smooth(ctx, [[6.1, -3.4], [7.3, -3.3], [7.3, 3.3], [6.1, 3.4]]),
  ];
  const cols = [WOOD[1], WOOD[2], WOOD[1], RED[2]];
  for (let i = 0; i < shapes.length; i++) {
    shapes[i]();
    if (mode === 'line') paint(ctx, a, 'line', null, WOOD[2]);
    else {
      ctx.fillStyle = tone(a, cols[i]);
      ctx.fill();
    }
  }
  if (mode === 'fill') {
    ell(ctx, -1.6, -0.9, 1.2, 0.8);
    ctx.fillStyle = tone(a, WOOD[0]);
    ctx.fill();
    ctx.fillStyle = tone(a, WOOD[0]);
    ctx.fillRect(3.6, -3.2, 0.8, 6.4);
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { stamp: 7.0, polish: 6.4, visor: 6.0, clock: 6.6 };
const ORDER = ['stamp', 'polish', 'visor', 'clock'];
const POOL = ['tape', 'denied', 'forms'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tailRot: 0, tailCurl: 0, visorUp: 0, visorDown: 0, stampAng: 1.4, tieSkew: 0, seal: -1, hah: 0, glint: -1, watch: 0, tapeS: -1, tapeW: 0, slam: -1, sheaf: 0, fan: -1, nextS: -1, sweat: -1, zz: 0, sit: 0 };
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
  // Standing: prim and upright, the stamp held at the ready at its side, the far paw tucked behind its back.
  go({ shN: -22 + br * 1.5, elN: -56, hwN: -6, shF: 24 + br, elF: -40, tilt: -2 + walking * 3, head: -2, chest: -br * 0.6 - 1.5 }, 1);
  q.tailRot = Math.sin(t * 0.6) * 0.05 + Math.sin((a.blkidU ?? t) * TAU - 0.6) * 0.1 * walking;
  q.tailCurl = Math.sin(t * 0.5 + 1) * 0.05;
  q.stampAng = 1.5 + Math.sin(t * 0.7) * 0.03;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.rcWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  if ((wind > 0 || striking) && alive) {
    if (!st.rcAtk) {
      const pool = m.def.moves ?? POOL;
      st.rcN = (st.rcN ?? m.uid ?? 0) + 1;
      st.rcMove = m.move ?? pool[st.rcN % pool.length];
    }
    st.rcAtk = true;
  } else st.rcAtk = false;
  const mvName = st.rcAtk ? st.rcMove : null;
  const hadWind = now - (st.rcWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.rcCalm = mix(st.rcCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.rcCalm);
  let PC = st.rcPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.rcOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.rcOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.rcOrd = (st.rcOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.rcPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;

  if (k > 0.001 && piece === 'stamp') {
    // a breath on the stamp: hah
    const hah = win(pu, 0.2, 0.5, 1.2, 1.4);
    go({ shN: -80, elN: -118, hwN: 0, head: 4 }, hah * k);
    q.stampAng = mix(q.stampAng, 0.3, hah * k);
    q.hah = hah * k;
    say('hah', hah * k);
    // THUNK on the floor in front of it (bending), twice
    for (const t0 of [1.5, 3.2]) {
      const dn = win(pu, t0, t0 + 0.35, t0 + 0.6, t0 + 0.95);
      const hit = sstep((pu - t0 - 0.25) / 0.1);
      go({ shN: -50 + hit * 10, elN: -20 + hit * 14, tilt: 16 + hit * 6, chest: 8, head: 10, lift: -0.04 * hit, x: 0.02 }, dn * k);
      q.stampAng = mix(q.stampAng, 1.57, dn * k);
      say(hit > 0.5 && pu < t0 + 0.5 ? 'thunk' : 'stern', dn * k);
      if (pu >= t0 + 0.3 && pu < t0 + 2.5) q.seal = Math.max(q.seal, pu - t0 - 0.3);
    }
    // an inspection of its work, a satisfied sniff
    const insp = win(pu, 4.4, 4.7, 6.2, 6.6);
    go({ tilt: 8, head: 14, neckR: 4 }, insp * k);
    say(pu > 5.4 ? 'pleased' : 'doubt', insp * k);
  }
  if (k > 0.001 && piece === 'polish') {
    // rubbed on its shirt front
    const rub = win(pu, 0.2, 0.5, 2.6, 2.9);
    go({ shN: 10 + Math.sin(pu * 12) * 8, elN: -108, hwN: -30, head: 8, neckR: 3 }, rub * k);
    q.stampAng = mix(q.stampAng, -0.4, rub * k);
    say('polish', rub * k);
    // held up to the light: a glint
    const up = win(pu, 2.8, 3.2, 5.4, 5.9);
    go({ shN: -110, elN: -60, hwN: 0, head: -8, neckR: -2, chest: -2 }, up * k);
    q.stampAng = mix(q.stampAng, -0.2, up * k);
    if (pu > 3.4 && pu < 4.4) q.glint = (pu - 3.4) / 1.0;
    say(pu > 3.6 ? 'glint' : 'calm', up * k);
  }
  if (k > 0.001 && piece === 'visor') {
    // the eyeshade adjusted with its near paw
    const adj = win(pu, 0.2, 0.5, 1.2, 1.5);
    go({ shN: -122, elN: -112, hwN: -20, head: -4 }, adj * k);
    q.visorUp += 0.6 * win(pu, 0.4, 0.6, 1.0, 1.3) * k;
    q.stampAng = mix(q.stampAng, 2.6, adj * k);
    // a long suspicious look at you over the top of it
    const peer = win(pu, 1.4, 1.8, 3.8, 4.1);
    go({ tilt: 6, head: 12, neckR: 5, x: 0.02 }, peer * k);
    q.visorDown += 0.4 * peer * k;
    say('peer', peer * k);
    // "next!": a brisk flick of its paw
    const nx = win(pu, 4.1, 4.3, 5.2, 5.6);
    go({ shN: -70 + Math.sin((pu - 4.2) * 14) * 16, elN: -60, hwN: 30, head: -4 }, nx * k);
    say('next', nx * k);
    if (nx > 0.3) q.nextS = pu - 4.1;
  }
  if (k > 0.001 && piece === 'clock') {
    // a look at the watch on its wrist
    const look = win(pu, 0.2, 0.5, 1.9, 2.2);
    go({ shN: -70, elN: -96, hwN: -40, head: 12, neckR: 4 }, look * k);
    q.watch = look * k;
    say('watch', look * k);
    // a sigh
    const sigh = win(pu, 2.1, 2.3, 3.0, 3.3);
    add({ chest: Math.sin(Math.PI * clamp((pu - 2.1) / 1.1, 0, 1)) * 5, head: Math.sin(Math.PI * clamp((pu - 2.1) / 1.1, 0, 1)) * 4 }, k);
    say('sigh', sigh * k);
    // its foot tapping
    const tap = win(pu, 3.1, 3.3, 5.1, 5.3);
    go({ toeN: -14 + Math.max(0, Math.sin(pu * 13)) * 22, head: -2 }, tap * k);
    say('tap', tap * k);
    q.tailRot += Math.sin(pu * 6.5) * 0.15 * tap * k;
    // a slump
    const sl = win(pu, 5.2, 5.5, 6.2, 6.6);
    go({ tilt: 6, head: 10, chest: 4, shN: -6, elN: -30 }, sl * k);
    say('sigh', sl * k);
  }

  if (fighting && alive && !st.rcHunt) st.rcBangAt = now;
  if (!fighting && st.rcHunt && alive) st.rcLostAt = now;
  st.rcHunt = fighting && alive;
  q.bang = now - (st.rcBangAt ?? -9);
  q.huh = now - (st.rcLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: the stamp held up, one brow raised -----
  // (the stance eases off as a move or a flinch takes over, never dropping out in one frame: the 2026-11-27
  // jitter probe found the arm and its prop leaping at the start of every wind-up)
  st.huntK = mix(st.huntK ?? 0, fighting && alive && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    go({ shN: -58, elN: -50, tilt: 4, head: 4, shF: 20, elF: -40 }, huntW * (1 - walking * 0.5));
    q.stampAng = mix(q.stampAng, -0.6, huntW * (1 - walking * 0.5));
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.tieSkew = 1;
    q.visorUp += 0.4;
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'tape') {
      // a roll of red tape whipped out (the stamp tucked away a moment), drawn back
      go({ shN: 50, elN: -90, hwN: -20, tilt: -8, chest: -4, head: -4, x: -0.03, shF: -30, elF: -50 }, wu);
      q.tapeW = W;
      say('smug', W);
      // then flung at you, unspooling (its shot flies on from here)
      if (s >= 0) {
        go({ shN: -100, elN: -10, hwN: 10, tilt: 12, chest: 5, head: 2, x: 0.05, shF: 20, elF: -40 }, sw);
        q.tapeS = s;
        say('shout', win(s, 0, 0.03, 0.35, 0.45));
      }
    } else if (mvName === 'denied') {
      // the stamp raised high, up on its toes
      go({ shN: -150, elN: -40, hwN: 0, tilt: -10, chest: -6, head: -10, x: -0.02, toeN: 10, toeF: 8, shF: -20, elF: -60 }, wu);
      q.stampAng = mix(q.stampAng, -1.57, wu);
      say('stern', W);
      // then slammed down on you: DENIED
      if (s >= 0) {
        go({ shN: -60, elN: -6, tilt: 20, chest: 8, head: 8, x: 0.07, lift: -0.03, shF: 20, elF: -30 }, sw);
        q.stampAng = mix(q.stampAng, 1.0, snap * sw);
        q.slam = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else {
      // a sheaf of forms riffled out of its shirt
      go({ shN: 6, elN: -110, hwN: -30, tilt: -4, head: 6 }, win(W, 0, 0.3, 0.55, 0.75) * (1 - snap));
      q.sheaf = Math.max(q.sheaf, sstep(W / 0.4));
      go({ shN: 40, elN: -80, tilt: -8, head: -2 }, sstep((W - 0.55) / 0.4) * (1 - snap));
      say('smug', W);
      // then fanned at you in a soft spray of pages
      if (s >= 0) {
        go({ shN: -96, elN: -20, hwN: 20, tilt: 12, chest: 5, head: 2, x: 0.05 }, sw);
        q.sheaf = Math.max(q.sheaf, 1 - sstep(s / 0.25));
        q.fan = s;
        say('happy', win(s, 0.02, 0.06, 0.5, 0.6));
      }
    }
  }
  // ----- Hurt: a wince, the eyeshade knocked up -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: 12, neckR: 4, shN: -40, elN: -100, shF: -10, elF: -100, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.visorUp += 0.9 * kh;
    q.tailCurl += 0.4 * kh;
  }
  // ----- After landing a hit: a smug "next!" -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt) {
    const kg = win(gl, 0, 0.25, 0.85, 1.2) * (1 - moveW);
    go({ shN: -70 + Math.sin(gl * 14) * 14, elN: -60, hwN: 30, head: -6, chest: -3 }, kg);
    say('smug', kg);
    if (kg > 0.3) q.nextS = gl;
  }
  // ----- A nap (its habitat): asleep standing, its head on its chest, the eyeshade tipped down -----
  st.rcNap = mix(st.rcNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.rcNap);
  if (nw > 0.001) {
    go({ head: 20 + Math.sin(now * 1.3) * 3, neckR: 6, chest: 4, tilt: 3, shN: -6, elN: -30, lift: Math.sin(now * 1.3) * 0.004 }, nw);
    q.visorDown += 0.9 * nw;
    q.stampAng = mix(q.stampAng, 1.7, nw);
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
    q.visorUp += 0.8;
    q.tieSkew = 1;
  }
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.rcFace) {
    st.rcFaceFrom = st.rcFace;
    st.rcFace = f;
    st.rcFaceAt = now;
  }
  const since0 = now - (st.rcFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.rcFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.rcFaceFrom) && !(talky(f) && talky(st.rcFaceFrom))) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.59) % 5.4;
  if (bl < 0.12 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
  for (const key of ['visorUp', 'visorDown', 'stampAng', 'tieSkew', 'sheaf', 'tailRot', 'tailCurl']) {
    // (its prop's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly, where an
    // eased chase leapt off at full speed the frame a new aim was set; the 2026-11-27 jitter probe)
    if (key === 'stampAng') {
      let x = st.rc_stampAng ?? q[key];
      let v = st.rc_stampAngV ?? 0;
      const n = Math.max(1, Math.ceil(dt / 0.008));
      const h = dt / n;
      for (let i = 0; i < n; i++) {
        v += (400 * (q[key] - x) - 40 * v) * h;
        x += v * h;
      }
      st.rc_stampAngV = v;
      st.rc_stampAng = x;
      q[key] = x;
      continue;
    }
    const rate = key === 'stampAng' ? 14 : key.startsWith('tail') ? 9 : 10;
    st[`rc_${key}`] = mix(st[`rc_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`rc_${key}`];
  }
  q.calm = cw;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little memo slip with a red rubber-stamped ring round the mark.
function memo(ctx, x, y, mark, e, dur, fl = false) {
  if (e < 0) return;
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  ctx.rotate(0.06);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-5.2, -5.2], [5.2, -5.4], [5.4, 5], [-5.4, 5.2]]);
    if (pass === 'line') {
      pen(ctx, '#8a7aa0', 1.1);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fffcf2';
      ctx.fill();
    }
  }
  ell(ctx, 0, 0, 3.8, 3.8);
  pen(ctx, RED[1], 0.7);
  ctx.stroke();
  ctx.strokeStyle = mark === '!' ? RED[3] : '#6a5a8a';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -2.4);
    ctx.lineTo(0, 0.6);
  } else {
    ctx.moveTo(-1.4, -1.4);
    ctx.quadraticCurveTo(-1.1, -2.9, 0.4, -2.8);
    ctx.quadraticCurveTo(1.9, -2.5, 1.3, -1);
    ctx.quadraticCurveTo(0.3, -0.4, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.2, 0.75, 0.75);
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
  ctx.strokeStyle = '#f6f4ff';
  ctx.stroke();
  ctx.restore();
}
// A soft rubber-stamped seal (a ring with a little star in it), laid flat on the floor or in the air.
function seal(ctx, x, y, r, al, flat = 0.4, txt = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(1, flat);
  ell(ctx, 0, 0, r, r);
  pen(ctx, RED[2], r * 0.22);
  ctx.stroke();
  ell(ctx, 0, 0, r * 0.62, r * 0.62);
  ctx.fillStyle = RED[0];
  ctx.fill();
  if (txt) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.36, -r * 0.36);
    ctx.lineTo(r * 0.36, r * 0.36);
    ctx.moveTo(r * 0.36, -r * 0.36);
    ctx.lineTo(-r * 0.36, r * 0.36);
    pen(ctx, RED[2], r * 0.18);
    ctx.stroke();
  } else {
    ell(ctx, 0, 0, r * 0.24, r * 0.24);
    ctx.fillStyle = RED[2];
    ctx.fill();
  }
  ctx.restore();
}
// A soft cream sheet of paper, tumbling.
function sheet(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const pass of ['line', 'fill']) {
    // (a sheet with soft corners: four corner points alone smoothed into an oval)
    smooth(ctx, [[-s, -s * 1.1], [-s * 0.8, -s * 1.3], [s * 0.8, -s * 1.3], [s, -s * 1.1], [s * 1.05, s * 1.1], [s * 0.85, s * 1.3], [-s * 0.8, s * 1.3], [-s, s * 1.1]]);
    if (pass === 'line') {
      pen(ctx, PAPER[2], 0.6);
      ctx.stroke();
    } else {
      ctx.fillStyle = PAPER[1];
      ctx.fill();
    }
  }
  pen(ctx, '#c8c0dc', 0.3);
  for (const yy of [-0.5, 0.1, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, yy * s);
    ctx.lineTo(s * 0.6, yy * s);
    ctx.stroke();
  }
  ctx.restore();
}
// The red-tape roll: a glossy red ring, its loose end trailing.
function roll(ctx, x, y, r, spin, trail = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (trail > 0) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-trail * 0.3, r * 2.2, -trail * 0.7, -r, -trail, r * 0.6);
    pen(ctx, RED[3], 1.6);
    ctx.stroke();
    pen(ctx, RED[1], 0.9);
    ctx.stroke();
  }
  ctx.rotate(spin);
  ell(ctx, 0, 0, r, r);
  ctx.fillStyle = RED[2];
  ctx.fill();
  pen(ctx, RED[3], r * 0.18);
  ctx.stroke();
  ell(ctx, 0, 0, r * 0.45, r * 0.45);
  ctx.fillStyle = '#fff4ec';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75, -2.4, -1.2);
  pen(ctx, RED[0], r * 0.16);
  ctx.stroke();
  ctx.restore();
}
// Its shot (render/dreamfx.js dreamShot, `redtape`): the roll of red tape spinning through the air, its
// ribbon unspooling behind it in soft loops.
export function redTapeShot(ctx, shot, x, y, p, d) {
  if (shot !== 'redtape') return false;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const px = x - d * u * 22 * Math.min(1, p * 3 + 0.2);
    const py = y + Math.sin(u * 9 - p * 20) * 2.4 * u;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  pen(ctx, RED[3], 1.8);
  ctx.stroke();
  pen(ctx, RED[1], 1);
  ctx.stroke();
  ctx.restore();
  roll(ctx, x, y, 2.6, p * 14 * d, 0);
  return true;
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
  const S0 = stampAt(a, D);
  const face = [S0.x + Math.cos(S0.ang) * 7.6, S0.y + Math.sin(S0.ang) * 7.6];
  // a breath on the stamp: a soft white puff
  if ((q.hah ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [24, 9]);
    const f = (t * 1.4) % 1;
    dust(ctx, mx + 2 + f * 3, my + f * 2, 0.9 + f, q.hah * (1 - f) * 0.8, '#ffffff', '#e6e2f0');
  }
  // the seals it stamps on the floor, fading (kept where they were stamped)
  if ((q.seal ?? -1) >= 0) {
    if (!a.mo.rcSeal || q.seal < 0.05) a.mo.rcSeal = face[0];
    seal(ctx, a.mo.rcSeal, -0.6, 3.2, 1 - sstep((q.seal - 1.6) / 0.6), 0.32);
  } else a.mo.rcSeal = null;
  // held up to the light: a glint off its rubber
  if ((q.glint ?? -1) >= 0 && q.glint < 1) sparkle(ctx, face[0], face[1], 2.4 * Math.sin(Math.PI * q.glint), 1, '#ffffff');
  // its wristwatch, read
  if ((q.watch ?? 0) > 0.05) {
    const [wx, wy] = ptOf(a, D, 'handN', D.J.wrN);
    ell(ctx, wx, wy, 1.4, 1.4);
    ctx.fillStyle = '#e6dcb0';
    ctx.fill();
    ell(ctx, wx, wy, 0.95, 0.95);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.lineTo(wx + Math.cos(t * 2) * 0.7, wy + Math.sin(t * 2) * 0.7);
    pen(ctx, '#5a4a6a', 0.3);
    ctx.stroke();
  }
  // "next!": a soft flick line off its paw
  if ((q.nextS ?? -1) >= 0 && q.nextS < 1) {
    const [hx, hy] = handPt('N');
    ctx.save();
    ctx.globalAlpha *= Math.sin(Math.PI * q.nextS) * 0.8;
    ctx.beginPath();
    ctx.arc(hx - 2, hy, 5, -1.2, 0.2);
    pen(ctx, '#ffffff', 1);
    ctx.stroke();
    ctx.restore();
  }
  // Red Tape: the roll in its paw, wound back; then flung (the shot itself flies from the game)
  if ((q.tapeW ?? 0) > 0.2 && (q.tapeS ?? -1) < 0) {
    const [hx, hy] = handPt('N');
    roll(ctx, hx + 1, hy - 1.5, 2.4 * sstep((q.tapeW - 0.2) / 0.3), t * 2, 4 * q.tapeW);
  }
  if ((q.tapeS ?? -1) >= 0 && q.tapeS < 0.5) {
    const [hx, hy] = handPt('N');
    const u = q.tapeS / 0.5;
    ctx.save();
    ctx.globalAlpha *= 1 - u;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.bezierCurveTo(hx + 8, hy - 6 + u * 4, hx + 14, hy + 4, hx + 20 + u * 10, hy - 2);
    pen(ctx, RED[3], 1.6);
    ctx.stroke();
    pen(ctx, RED[1], 0.9);
    ctx.stroke();
    ctx.restore();
    sparkle(ctx, hx + 6 + u * 10, hy - 4, 1.6 * Math.sin(Math.PI * u), 1, RED[0]);
  }
  // DENIED: a soft red seal bursting where the stamp lands, a ring of sparkles
  if ((q.slam ?? -1) >= 0 && q.slam < 0.75) {
    if (!a.mo.rcSlam || q.slam < 0.05) a.mo.rcSlam = face.slice();
    const [sx, sy] = a.mo.rcSlam;
    const u = q.slam / 0.75;
    seal(ctx, sx + 2, sy, 3 + sstep(u * 3) * 4, 1 - sstep((u - 0.45) / 0.55), 1, true);
    for (let i = 0; i < 5; i++) {
      const an = (i / 5) * TAU + 0.3;
      sparkle(ctx, sx + 2 + Math.cos(an) * (4 + u * 9), sy + Math.sin(an) * (4 + u * 7), 1.4 * Math.sin(Math.PI * u), 1, i % 2 ? RED[0] : '#ffffff');
    }
  } else a.mo.rcSlam = null;
  // Paperwork: the sheaf in its paw, then a soft spray of pages
  if ((q.sheaf ?? 0) > 0.05) {
    const [hx, hy] = handPt('N');
    for (let i = 0; i < 3; i++) sheet(ctx, hx + 1.5 + i * 0.6, hy - 2.5 - i * 0.4, 1.8 * q.sheaf, -0.3 + i * 0.25 + Math.sin(t * 9 + i) * 0.08 * q.sheaf, 1);
  }
  if ((q.fan ?? -1) >= 0 && q.fan < 0.95) {
    if (!a.mo.rcFan || q.fan < 0.05) a.mo.rcFan = handPt('N');
    const [hx, hy] = a.mo.rcFan;
    const u = q.fan / 0.95;
    for (let i = 0; i < 5; i++) {
      const v = clamp(u * 1.3 - i * 0.06, 0, 1);
      const an = -0.6 + i * 0.3;
      sheet(ctx, hx + Math.cos(an) * v * 26, hy + Math.sin(an) * v * 14 + v * v * 10, 1.7, v * 4 + i, 1 - sstep((v - 0.6) / 0.4));
    }
  } else a.mo.rcFan = null;
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -8]);
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
  if (q.bang >= 0 && q.bang < 1.1) memo(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) memo(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'redtaperaccoon',
  // (the skin is its shirt; its trousers the legs' own skin; dark glove-like paws and feet, a grey neck)
  skin: {
    lt: SHIRT[0], base: SHIRT[1], sh: SHIRT[2], deep: SHIRT[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: TROU[0], base: TROU[1], sh: TROU[2], deep: TROU[3] },
      hand: { lt: PAW[0], base: PAW[1], sh: PAW[2], deep: PAW[3] },
      foot: { lt: PAW[1], base: PAW[2], sh: PAW[3], deep: '#3a344c' },
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
    handNskin: (ctx, a, mode, S, D) => stamp(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => shirt(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => garter(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => garter(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('raccoon', DRESS);
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
export const RED_TAPE_RACCOON_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const RED_TAPE_RACCOON_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
