// The Stormsong Frog (2026-11-27, the Sky Whale's Storm Harpist remade from scratch as a new creature; the id
// stays `harpist`). Frogs sing loudest before a storm, and the tree frogs of the sky sing so well they bring
// the storms on: little buskers in rain slickers on the whale's spine market and the East Rim, each with a
// golden harp whose strings crackle with weather. On its own copy of the creature base (rig.js; body.js
// `frog`: narrow shoulders, a round tummy and wide hips, short springy legs on big flat feet), dressed here;
// its head, eye bumps, throat sac, slicker, hood and harp drawn here from scratch over the mannequin (never
// the shared face, never the hero).
//   look    soft mint-green skin, a cream throat and tummy, its big eyes up on two round bumps on top of its
//           wide head, little round pads on its fingertips; a periwinkle rain slicker WORN (the base's body
//           and arms: sleeves and all) with a lemon lining, lemon toggles and its hood down behind its head;
//           its green legs bare below the hem; a small golden bow-harp, its strings pale storm-blue. Its own
//           soft green outline, outer edge only, face bare.
//   eyes    its own "frog eyes": big round golden eyes up on their bumps, a soft horizontal pupil (a frog's),
//           a pale ring round the iris, a crescent of light along its top and one round glint; a thin neat
//           lash line; little green brows on the bumps. A wide frog mouth, and a throat sac that swells as
//           its own round shape when it sings (never a stretch).
//   walk    the base's walk at an easy springy pace (24), its harp held up, its hood bobbing.
//   idle    four pieces, each the next that fits the time it has before it moves on (data `rest`,
//           world/mobs.js `m.restUntil`):
//           - tune (6.8 s): a string plucked, its head cocked to listen; the peg twisted; plucked again;
//             satisfied;
//           - rain (7.0 s): a hand held out, palm up; one raindrop lands in it; a blink; delight; a little
//             rain dance on the spot;
//           - sing (7.2 s): eyes shut, its throat sac swelling in time, storm-blue notes rising;
//           - bow (6.0 s): a flourish across all the strings, sparkles; a deep performer's bow, a hand on its
//             heart.
//   moves   Thunder Strum (the harp raised high, eyes shut, the sac filling; then a great strum, every string
//           flashing, a note of lightning flying at you: its shot, `stormnote`, drawn here); Thunder Croak
//           (its sac swelling huge; then a booming CROAK in soft rings with a crackle of light); Puddle Leap
//           (a deep frog crouch; then a leap at you in an arc, legs out behind, landing with a splash).
//   else    hurt: eyes squeezed, its sac gone flat; after landing a hit: a ribbit and a little jig; hunting
//           you: crouched, harp up; low on health: worried, a bead of sweat; a nap (habitat): sat squat, eyes
//           closed, z's; beaten: dizzy. Its marks over its head (!, ?) are its own: little raindrops
//           (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: lightning as slim soft zigzags with round joins and
// a white core (never jagged), notes and drops soft and round, sparkles the game's curvy stars, never specks.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, dizzy, sweat, cue, note } from './fx.js';
import { fightState, pickPiece, settleFace, easeKeys, bubble, zee } from './act.js';

const BIG = 1.1;
const LW = 1.6 / BIG;
const ID = 'stormfrog';
const INK = '#5e9a80';
const SKIN = ['#f0fff2', '#bdeec6', '#8fd4a2', '#68b284'];
const BELLY = ['#fffff6', '#f4f8dc', '#e2eac4'];
const COAT = ['#e6e8ff', '#aab2f2', '#8088d4', '#5e66b0'];
const LEMON = ['#fff8c4', '#ffe476', '#e6c050'];
const GOLD = ['#fff6c8', '#f6d066', '#d4a640', '#a87a34'];
const STRING = ['#ffffff', '#cfe6ff', '#9cc4f4'];
const BOLT = ['#ffffff', '#fff6b0', '#ffe066', '#c8a8ff'];
const LASH = '#2a3a30';
const IRIS = ['#1e2a1a', '#c08a24', '#f0c040', '#fff2b0'];
const RAIN = ['#e8f4ff', '#9ccaf4', '#6aa6e0'];

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
const NECK = [80.9, 89.1];
const HS = 1.3;
const HO = [1.6, -12.4];
const hk = ([u, v]) => [NECK[0] + (HO[0] + u) * HS, NECK[1] + (HO[1] + v) * HS];
const pivOf = (D, bone) => D.J[D.PIV[bone]];
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
  pluck: { e: 'open', g: [1.6, 1.4], b: [-0.4, -0.6], m: 'o' },
  listen: { e: 'shut', b: [-0.6, -0.8], m: 'calm' },
  twist: { e: 'squeeze', b: [0.6, 0.6], m: 'grit' },
  pleased: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  palm: { e: 'open', g: [1.2, 1.6], b: [-0.6, -0.8], m: 'o' },
  blink: { e: 'shut', b: [-0.4, -0.4], m: 'o' },
  delight: { e: 'happy', b: [-1, -1.2], m: 'open' },
  sing: { e: 'shut', b: [-1, -1.2], m: 'sing' },
  flourish: { e: 'happy', b: [-0.8, -1], m: 'smile' },
  bow: { e: 'shut', b: [-0.4, -0.6], m: 'smile' },
  focus: { e: 'open', g: [1.5, 0.3], b: [0.8, 1], m: 'calm' },
  fierce: { e: 'open', g: [1.6, 0.3], b: [1.2, 1.4], m: 'grit' },
  swell: { e: 'squeeze', b: [0.6, 0.8], m: 'puff' },
  shout: { e: 'squeeze', b: [1, 1.2], m: 'croak' },
  ribbit: { e: 'happy', b: [-0.8, -1], m: 'open' },
  happy: { e: 'happy', b: [-0.8, -1], m: 'open' },
  hurt: { e: 'squeeze', b: [-1.2, -1.4], m: 'wobble' },
  worried: { e: 'open', g: [0.3, 1], b: [-1.4, -1.6], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [-1.4, -1.6], m: 'frown' },
  sleep: { e: 'sleep', b: [0.2, 0.2], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [-1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, -0.4], m: 'o' },
};
const SHUTS = new Set(['listen', 'twist', 'pleased', 'blink', 'delight', 'sing', 'flourish', 'bow', 'swell', 'shout', 'ribbit', 'happy', 'hurt', 'sleep', 'shut', 'dizzy']);

function stroke3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// The frog eye: big and round, up on its bump.
function eye(ctx, a, x, y, o, f) {
  const r0 = 4.2;
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
    stroke3(ctx, a, [x - r0, y + 0.4], [x, y + (kind === 'sleep' ? 2.8 : 2.2)], [x + r0, y + 0.4], 1.4, LASH);
    return;
  }
  const big = kind === 'wide' ? 1.1 : 1;
  const r = r0 * big;
  ell(ctx, x, y, r, r);
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
    ell(ctx, x, y, r, r);
    ctx.clip();
    const ix = x + gx * 0.45;
    const iy = y + gy * 0.45;
    const ir = r * 0.86;
    ell(ctx, ix, iy, ir, ir);
    ctx.fillStyle = tone(a, IRIS[1]);
    ctx.fill();
    ell(ctx, ix, iy + ir * 0.2, ir * 0.8, ir * 0.72);
    ctx.fillStyle = tone(a, IRIS[2]);
    ctx.fill();
    // a pale ring round the iris
    ell(ctx, ix, iy, ir * 0.62, ir * 0.62);
    pen(ctx, tone(a, IRIS[3], 0.55), 0.4);
    ctx.stroke();
    // the soft horizontal pupil
    ell(ctx, ix, iy, ir * 0.48, ir * 0.3);
    ctx.fillStyle = tone(a, IRIS[0]);
    ctx.fill();
    // a crescent of light along its top, one round glint
    ctx.beginPath();
    ctx.arc(ix, iy, ir * 0.78, -2.5, -1.0);
    pen(ctx, 'rgba(255,255,255,0.9)', 0.8);
    ctx.stroke();
    ell(ctx, ix + ir * 0.34 * o, iy + ir * 0.3, ir * 0.14, ir * 0.14);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(x, y, r * 1.02, -Math.PI + 0.25, -0.25);
  pen(ctx, tone(a, LASH), 1.15);
  ctx.stroke();
}
function brow(ctx, a, x, y, o, lift) {
  ctx.beginPath();
  ctx.moveTo(x - o * 2, y + lift + 0.4);
  ctx.quadraticCurveTo(x, y - 0.8 + lift * 0.6, x + o * 2, y + lift * 0.3 + 0.2);
  pen(ctx, tone(a, SKIN[3]), 1.2);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#3e6a4e';
  const DARK = '#6a2e44';
  const line = (pts, w = 0.8) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y + 0.3], [x + w, y - 0.3], [x + w * 0.8, y + h], [x, y + h * 1.15], [x - w * 0.8, y + h]]);
    ctx.fillStyle = tone(a, DARK);
    ctx.fill();
    ell(ctx, x, y + h * 0.78, w * 0.55, h * 0.32);
    ctx.fillStyle = tone(a, '#ff9cb4');
    ctx.fill();
  };
  switch (m) {
    case 'smile':
      line([[x - 5, y - 1], [x - 2, y + 1.6], [x + 1.6, y + 1], [x + 3.6, y + 0.4], [x + 4.4, y - 1]]);
      break;
    case 'open':
      open(3.2, 2.6);
      break;
    case 'croak':
      open(4, 3.4);
      break;
    case 'sing':
      ell(ctx, x, y + 0.8, 1.4, 1.3);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'o':
      ell(ctx, x, y + 0.8, 1, 1.1);
      ctx.fillStyle = tone(a, DARK);
      ctx.fill();
      break;
    case 'puff':
      line([[x - 4, y + 0.2], [x, y + 0.4], [x + 4, y]], 0.8);
      break;
    case 'grit':
      line([[x - 4, y + 0.6], [x, y + 0.2], [x + 4, y + 0.4]], 0.95);
      break;
    case 'wobble':
      line([[x - 4, y + 0.4], [x - 2, y - 0.3], [x, y + 0.3], [x + 2, y - 0.3], [x + 4, y + 0.4]], 0.75);
      break;
    case 'frown':
      line([[x - 4, y + 1.2], [x, y], [x + 4, y + 1.2]]);
      break;
    case 'talkA':
      open(2.4, 2.2);
      break;
    case 'talkE':
      open(3, 1.3);
      break;
    default:
      // at rest: a wide closed frog mouth, level, its near corner tucked up a touch
      line([[x - 5, y - 0.3], [x - 1, y + 0.9], [x + 3, y + 0.5], [x + 4, y + 0.3], [x + 4.6, y - 0.4]], 0.8);
  }
}
// The head: wide and soft, its two eye bumps up on top (part of its outline).
const SKULL = [[-17, 4], [-16, -3], [-11, -7.6], [-3, -9], [6, -9], [14, -7], [19.6, -2.2], [22.6, 3], [21.2, 8], [15, 11.6], [6, 13.4], [-4, 13.6], [-12.6, 11]];
const BUMPS = [[-4.4, -8.6, 6.4], [9.6, -9.4, 6.8]];
function headShape(ctx) {
  smooth(ctx, SKULL);
  for (const [x, y, r] of BUMPS) {
    ctx.moveTo(x + r, y);
    ctx.ellipse(x, y, r, r * 0.94, 0, 0, TAU);
  }
}
function head(ctx, a, mode, D) {
  const q = a.gl ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  headShape(ctx);
  paint(ctx, a, mode, SKIN[1]);
  if (mode === 'fill') {
    ctx.save();
    headShape(ctx);
    ctx.clip();
    glow(ctx, 3, -8, 16, SKIN[0], 0.85);
    glow(ctx, -14, 8, 10, SKIN[2], 0.6);
    // a cream jaw and throat
    smooth(ctx, [[-6, 8], [4, 6.4], [14, 6.6], [21, 5.6], [20, 9], [14, 12.4], [4, 14], [-6, 13]]);
    ctx.fillStyle = tone(a, BELLY[1]);
    ctx.fill();
    ctx.restore();
    for (const [cx, cy, k] of [[-8.6, 4.4, 0.6], [8, 4.6, 1]]) {
      ell(ctx, cx, cy, 2.6, 1.5);
      ctx.fillStyle = tone(a, '#ff9eb4', 0.42 * k + (q.blush ?? 0) * 0.3);
      ctx.fill();
    }
    eye(ctx, a, BUMPS[0][0], BUMPS[0][1] + 0.2, -1, f);
    eye(ctx, a, BUMPS[1][0], BUMPS[1][1] + 0.2, 1, f);
    brow(ctx, a, BUMPS[0][0], BUMPS[0][1] - 6.8, -1, (f.b?.[0] ?? 0) * 0.8);
    brow(ctx, a, BUMPS[1][0], BUMPS[1][1] - 7.2, 1, (f.b?.[1] ?? 0) * 0.8);
    mouth(ctx, a, 13.6, 4.8, f.m);
  }
  // its throat sac, in front of its chin: its own round shape, swelling
  const sac = q.sac ?? 0;
  if (sac > 0.02) {
    ell(ctx, 9, 12.4 + sac * 2.6, 3 + sac * 5.6, 2 + sac * 4.4);
    paint(ctx, a, mode, BELLY[1]);
    if (mode === 'fill') {
      glow(ctx, 7.6, 11 + sac * 1.6, 2 + sac * 3.4, '#ffffff', 0.9);
      ell(ctx, 9, 14 + sac * 4, 2 + sac * 4, 0.6 + sac * 1.2);
      ctx.fillStyle = tone(a, '#ffd2dc', 0.35);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- Its slicker, hood and harp ----------
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
function slicker(ctx, a, mode, D) {
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
  const c0 = C([st[0] + 2, st[1] + 6]);
  glow(ctx, c0[0], c0[1], 7, COAT[0], 0.75);
  // its own skin below the hem (its tummy's cream showing at the front), the lemon lining at the hem
  poly(ctx, [T([h[0] - 40, h[1] + 3]), T([h[0] + 40, h[1] + 3]), T([h[0] + 40, h[1] + 30]), T([h[0] - 40, h[1] + 30])]);
  ctx.fillStyle = tone(a, SKIN[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...T([h[0] - 40, h[1] + 2.4]));
  ctx.lineTo(...T([h[0] + 40, h[1] + 2.4]));
  pen(ctx, tone(a, LEMON[1]), 1.4);
  ctx.stroke();
  // the front opening, lemon lining showing, and three lemon toggles
  ctx.beginPath();
  ctx.moveTo(...C([st[0] + 7.4, st[1] + 2]));
  ctx.quadraticCurveTo(...W([w[0] + 9.4, w[1]]), ...T([h[0] + 9.6, h[1] + 2]));
  pen(ctx, tone(a, LEMON[1]), 0.9);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const p = i < 2 ? C([st[0] + 6.2, st[1] + 5 + i * 5]) : W([w[0] + 8.2, w[1] + 1]);
    smooth(ctx, [[p[0] - 1, p[1] - 0.45], [p[0] + 1, p[1] - 0.45], [p[0] + 1, p[1] + 0.45], [p[0] - 1, p[1] + 0.45]]);
    ctx.fillStyle = tone(a, LEMON[2]);
    ctx.fill();
  }
  ctx.restore();
}
// The hood, down behind its head, and the slicker's collar.
function hood(ctx, a, mode, D) {
  const st = D.J.stern;
  const C = (p) => ptOf(a, D, 'chest', p);
  const q = a.gl ?? {};
  const b = q.hoodBob ?? 0;
  smooth(ctx, [[-14, -10 + b], [-6, -16 + b], [2, -12], [4, -4], [-2, 2], [-12, 1], [-16, -4 + b * 0.5]].map(([x, y]) => C([st[0] + x, st[1] + y])));
  paint(ctx, a, mode, COAT[2]);
  if (mode === 'fill') {
    smooth(ctx, [[-11, -9 + b], [-5, -13 + b], [0, -10], [1, -5], [-4, -2], [-10, -3]].map(([x, y]) => C([st[0] + x, st[1] + y])));
    ctx.fillStyle = tone(a, LEMON[0], 0.9);
    ctx.fill();
  }
  // the collar points
  for (const pts of [[[-4, -4], [5, -4.4], [6, 0.4], [0, 1.2], [-4.6, -0.6]], [[5.4, -4.4], [12.6, -4], [12, -0.2], [7.6, 1.4]]]) {
    smooth(ctx, pts.map(([x, y]) => C([st[0] + x, st[1] + y])));
    paint(ctx, a, mode, COAT[1]);
  }
}
// Little round pads on its fingertips and toes.
function pads(ctx, a, mode, D, k) {
  if (mode !== 'fill') return;
  const p = ptOf(a, D, `hand${k}`, D.J[`hand${k}`]);
  for (const [dx, dy] of [[1.4, 1.2], [0, 1.8], [-1.2, 1.3]]) {
    ell(ctx, p[0] + dx, p[1] + dy, 0.7, 0.7);
    ctx.fillStyle = tone(a, SKIN[0]);
    ctx.fill();
  }
}
// The harp (hand space: its pillar along -y up from the grip, the curved neck over to the sound box).
const HARP = 0.72;
function harpAt(a, D) {
  const p = ptOf(a, D, 'handN', D.J.handN);
  return { x: p[0], y: p[1], ang: a.gl?.harpAng ?? 0 };
}
const HSTR = [[1.6, -2.2, -11.4], [3.4, -2.6, -12.4], [5.2, -2.4, -12.4], [7, -2.0, -11.2]];
function harp(ctx, a, mode, D) {
  const H = harpAt(a, D);
  const q = a.gl ?? {};
  ctx.save();
  ctx.translate(H.x, H.y);
  ctx.rotate(H.ang);
  ctx.scale(HARP, HARP);
  // the frame: a pillar up from its paw, a scroll on top, the curved neck down to the sound box
  const frame = () => {
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(0.2, -13);
    ctx.quadraticCurveTo(4, -15.6, 8.6, -11);
    ctx.quadraticCurveTo(10.4, -6, 8.4, -1.4);
    ctx.quadraticCurveTo(4, 1.4, 0, 1);
  };
  frame();
  if (mode === 'line') {
    pen(ctx, GOLD[3], 2.6);
    ctx.stroke();
    ctx.restore();
    return;
  }
  pen(ctx, tone(a, GOLD[2]), 1.8);
  ctx.stroke();
  pen(ctx, tone(a, GOLD[1]), 0.9);
  ctx.stroke();
  ell(ctx, 0.2, -13.6, 1.4, 1.4);
  ctx.fillStyle = tone(a, GOLD[1]);
  ctx.fill();
  ell(ctx, -0.2, -14, 0.6, 0.5);
  ctx.fillStyle = tone(a, GOLD[0]);
  ctx.fill();
  // its strings: pale storm-blue, flashing white when struck
  const fl = clamp(q.flash ?? 0, 0, 1);
  HSTR.forEach(([x, y0, y1], i) => {
    const wob = Math.sin((a.now ?? 0) * 60 + i * 2) * 0.35 * clamp((q.ring ?? 0) - i * 0.1, 0, 1);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.quadraticCurveTo(x + wob, (y0 + y1) / 2, x, y1);
    pen(ctx, fl > 0.05 ? mixHex(STRING[1], '#ffffff', fl) : STRING[2], 0.35 + fl * 0.3);
    ctx.stroke();
  });
  if (fl > 0.05) glow(ctx, 4, -7, 6, '#fff6b0', fl * 0.6);
  ctx.restore();
}
function mixHex(c0, c1, u) {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [a0, b0] = [p(c0), p(c1)];
  return `rgb(${a0.map((v, i) => Math.round(mix(v, b0[i], u))).join(',')})`;
}

// ---------- Its things in the world ----------
// A slim soft zigzag of lightning from (x0, y0) to (x1, y1): round joins, a white core.
function bolt(ctx, x0, y0, x1, y1, al, seed = 0, w = 1.4) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const n = 4;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const s = (i % 2 ? 1 : -1) * (1.4 + ((seed * 7 + i * 3) % 5) * 0.2);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.hypot(dx, dy) || 1;
    ctx.lineTo(x0 + dx * u - (dy / d) * s, y0 + dy * u + (dx / d) * s);
  }
  ctx.lineTo(x1, y1);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = BOLT[3];
  ctx.lineWidth = w * 1.9;
  ctx.globalAlpha *= 0.5;
  ctx.stroke();
  ctx.globalAlpha /= 0.5;
  ctx.strokeStyle = BOLT[2];
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = BOLT[0];
  ctx.lineWidth = w * 0.4;
  ctx.stroke();
  ctx.restore();
}
// A note of lightning: a soft round eighth note in storm gold, a little zigzag flag.
function stormNote(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  glow(ctx, 0, -1, 5 * s, '#fff2a0', 0.5);
  ell(ctx, 0, 0, 1.7 * s, 1.3 * s, -0.4);
  ctx.fillStyle = BOLT[2];
  ctx.fill();
  ell(ctx, -0.5 * s, -0.4 * s, 0.6 * s, 0.35 * s, -0.4);
  ctx.fillStyle = BOLT[0];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1.4 * s, -0.4 * s);
  ctx.lineTo(1.4 * s, -5 * s);
  ctx.lineTo(2.8 * s, -3.8 * s);
  ctx.lineTo(2.2 * s, -3.2 * s);
  ctx.lineTo(3.4 * s, -2.2 * s);
  pen(ctx, BOLT[2], 0.8 * s);
  ctx.stroke();
  pen(ctx, BOLT[0], 0.3 * s);
  ctx.stroke();
  ctx.restore();
}
function drop(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  smooth(ctx, [[0, -1.6 * s], [0.9 * s, 0.2 * s], [0.7 * s, 1 * s], [-0.7 * s, 1 * s], [-0.9 * s, 0.2 * s]]);
  ctx.fillStyle = RAIN[1];
  ctx.fill();
  ell(ctx, -0.25 * s, 0.1 * s, 0.25 * s, 0.4 * s);
  ctx.fillStyle = RAIN[0];
  ctx.fill();
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { tune: 6.8, rain: 7.0, sing: 7.2, bow: 6.0 };
const ORDER = ['tune', 'rain', 'sing', 'bow'];
const POOL = ['strum', 'croak', 'leap'];
const MELEE = ['croak', 'leap'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];
const pick = (m, n) => (m.swingFar === true ? 'strum' : m.swingFar === false ? MELEE[n % 2] : POOL[n % POOL.length]);

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const F = fightState(m, a, st, m.def.moves ?? POOL, pick);
  const now = F.now;
  const q = { face: null, blush: 0, sac: 0, harpAng: 0, flash: 0, ring: 0, hoodBob: 0, pluck: -1, dropS: -1, notes: 0, gliss: -1, strumS: -1, croakS: -1, leapS: -1, sweat: -1, zz: 0, dance: 0 };
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
  const aimHarp = (ang, k) => {
    q.harpAng = mix(q.harpAng, ang, k);
  };
  const { alive, mvName, W, s, hurt, ago, fighting, napping, cine, low } = F;
  const walking = clamp(a.walkW ?? 0, 0, 1);
  const U = a[`tk${ID}U`] ?? 0;
  const br = c.breath ?? 0;
  // Standing: its harp held up in its near paw at its chest, the far hand easy; a slow frog breath at the throat.
  go({ shN: -24 + br * 1.4, elN: -62, hwN: 0, shF: -16 + br, elF: -40, hwF: 0, head: -2, chest: -br * 0.6 }, 1);
  add({ tilt: 3 }, walking);
  q.sac = 0.08 + Math.max(0, Math.sin(t * 1.7)) * 0.06;
  q.hoodBob = Math.sin(t * 1.2) * 0.4 + Math.sin(U * TAU * 2) * 0.8 * walking;

  // ----- The act -----
  const calmGoal = !F.busy && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.kCalm = mix(st.kCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const k = sstep(st.kCalm);
  const { piece, pu } = pickPiece(m, st, now, calmGoal, k, PIECES, ORDER);

  if (k > 0.001 && piece === 'tune') {
    const hold = win(pu, 0.2, 0.5, 6.2, 6.6);
    go({ shN: -40, elN: -70, head: 8, neckR: 4 }, hold * k);
    aimHarp(-0.2, hold * k);
    // a string plucked, head cocked to listen
    for (const t0 of [0.6, 4.4]) {
      const pl = win(pu, t0, t0 + 0.15, t0 + 0.3, t0 + 0.5);
      go({ shF: -60, elF: -60, hwF: 10 }, pl * k);
      if (pu > t0 + 0.15 && pu < t0 + 1.4) {
        q.pluck = pu - t0 - 0.15;
        q.ring = Math.max(q.ring, 1 - q.pluck / 1.25);
      }
      const ls = win(pu, t0 + 0.4, t0 + 0.7, t0 + 1.4, t0 + 1.7);
      go({ head: 12, neckR: 8, tilt: 4 }, ls * k);
      say(t0 > 1 ? 'pleased' : 'listen', ls * k);
      say('pluck', pl * k);
    }
    // the peg twisted
    const tw = win(pu, 2.4, 2.7, 3.8, 4.1);
    go({ shF: -90, elF: -100, hwF: Math.sin(pu * 12) * 20 }, tw * k);
    say('twist', tw * k);
    say('pleased', win(pu, 5.8, 6.0, 6.6, 6.8) * k);
  }
  if (k > 0.001 && piece === 'rain') {
    // a hand held out, palm up
    const ho = win(pu, 0.2, 0.6, 4.0, 4.4);
    go({ shF: -70, elF: -20, hwF: 30, head: -6 }, ho * k);
    say('palm', win(pu, 0.4, 0.7, 1.8, 2.0) * k);
    // one raindrop lands in it
    if (pu > 0.6 && pu < 2.6) q.dropS = pu - 0.6;
    say('blink', win(pu, 1.9, 2.0, 2.2, 2.3) * k);
    say('delight', win(pu, 2.3, 2.5, 4.2, 4.5) * k);
    // a little rain dance on the spot
    const dn = win(pu, 4.2, 4.5, 6.4, 6.9);
    const st2 = Math.sin(pu * 9);
    go({ toeN: Math.max(0, st2) * 24, toeF: Math.max(0, -st2) * 24, tilt: st2 * 4, head: -st2 * 4, shF: -100 + st2 * 20, elF: -40, lift: Math.abs(st2) * 0.015 }, dn * k);
    say('delight', dn * k);
    q.dance = dn * k;
  }
  if (k > 0.001 && piece === 'sing') {
    const sg = win(pu, 0.2, 0.6, 6.6, 7.1);
    const beat = Math.max(0, Math.sin(pu * 4.4));
    go({ head: -10 + beat * 3, chest: -4, tilt: -3 + beat * 2, shF: -60 + beat * 10, elF: -60 }, sg * k);
    q.sac = mix(q.sac, 0.3 + beat * 0.55, sg * k);
    say('sing', sg * k);
    q.notes = Math.max(q.notes, sg * k);
  }
  if (k > 0.001 && piece === 'bow') {
    // a flourish across all the strings
    const fl = win(pu, 0.2, 0.5, 1.8, 2.1);
    go({ shN: -90, elN: -60, shF: -80 + Math.sin(pu * 6) * 30, elF: -40, head: -6, chest: -4 }, fl * k);
    aimHarp(-0.3, fl * k);
    if (pu > 0.5 && pu < 2.0) q.gliss = (pu - 0.5) / 1.5;
    q.ring = Math.max(q.ring, fl * k);
    say('flourish', fl * k);
    // a deep performer's bow, a hand on its heart
    const bw = win(pu, 2.2, 2.8, 4.8, 5.4);
    go({ tilt: 28, head: 18, chest: 8, shF: -50, elF: -130, hwF: -30, shN: -10, elN: -40 }, bw * k);
    aimHarp(0.4, bw * k);
    say('bow', bw * k);
    q.blush = Math.max(q.blush, bw * k * 0.7);
  }

  const hunting = fighting && alive;
  if (hunting && !st.kHunt) st.kBangAt = now;
  if (!hunting && st.kHunt && alive) st.kLostAt = now;
  st.kHunt = hunting;
  q.bang = now - (st.kBangAt ?? -9);
  q.huh = now - (st.kLostAt ?? -9);
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: crouched, harp up (eased in and out) -----
  st.huntK = mix(st.huntK ?? 0, hunting && !hurt && !mvName ? 1 : 0, ease(6));
  const huntW = alive ? sstep(st.huntK) : 0;
  if (huntW > 0.001) {
    const hw = huntW * (1 - walking * 0.5);
    go({ lift: -0.05, tilt: 8, head: 2, shN: -80, elN: -60, shF: -40, elF: -60 }, hw);
    aimHarp(-0.15, hw);
    if (huntW > 0.5 && !mvName) q.face = 'fierce';
  }
  if (low && !F.busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? sstep(s / 0.08) * (1 - sstep((s - 0.55) / 0.4)) : 0;
    const snap = s >= 0 ? sstep(s / 0.08) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'strum') {
      // the harp raised high, eyes shut, the sac filling
      go({ shN: -140, elN: -40, shF: -110, elF: -40, tilt: -8, chest: -5, head: -10 }, wu);
      aimHarp(-0.2, sstep(W));
      q.sac = mix(q.sac, 0.6, W);
      q.flash = Math.max(q.flash, W * 0.4 * (0.5 + 0.5 * Math.sin(now * 30)));
      say('swell', W);
      // then a great strum: every string flashing, a note of lightning away
      if (s >= 0) {
        go({ shN: -80, elN: -40, shF: -30, elF: -20, hwF: 20, tilt: 10, chest: 4, head: 2, x: 0.03 }, sw);
        aimHarp(-0.6, sw);
        q.flash = Math.max(q.flash, 1 - sstep(s / 0.4));
        q.ring = Math.max(q.ring, 1 - sstep(s / 0.8));
        q.strumS = s;
        say('shout', win(s, 0, 0.03, 0.3, 0.45));
      }
    } else if (mvName === 'croak') {
      // its sac swelling huge
      go({ tilt: -6, chest: -6, head: -8, lift: 0.01, shF: 10, elF: -60 }, wu);
      q.sac = mix(q.sac, 1, sstep(W));
      say('swell', W);
      // a booming CROAK
      if (s >= 0) {
        go({ tilt: 10, chest: 5, head: 4, x: 0.04, shF: -30, elF: -40 }, sw);
        q.sac = mix(q.sac, 1 - sstep(s / 0.35) * 0.8, sw);
        q.croakS = s;
        say('shout', win(s, 0, 0.03, 0.4, 0.5));
      }
    } else {
      // a deep frog crouch
      go({ lift: -0.14, tilt: 18, head: -4, chest: 4, shN: -60, elN: -80, shF: -30, elF: -50, fxN: 0.2, fxF: -0.1 }, wu);
      say('focus', W);
      // then a leap at you in an arc, legs out behind, a splash where it lands
      if (s >= 0) {
        const v = clamp(s / 0.5, 0, 1);
        const up = Math.sin(Math.PI * v);
        const out1 = sstep(s / 0.4);
        const back = sstep((s - 0.55) / 0.4);
        const xx = 0.4 * out1 * (1 - back);
        go({ x: xx, tilt: 30 * up, head: -10 * up, shN: -120 * up - 40, elN: -20, shF: -110 * up - 20, elF: -20, fxN: xx * 2.4 - 0.4 * up, fxF: xx * 2.4 - 0.5 * up, fyN: 0.3 * up, fyF: 0.3 * up, toeN: 30 * up, toeF: 30 * up }, sw);
        add({ hop: up * 0.2 }, sw);
        q.leapS = s;
        say(s < 0.45 ? 'ribbit' : 'shout', win(s, 0, 0.04, 0.5, 0.6));
      }
    }
  }
  // ----- Hurt: eyes squeezed, its sac gone flat -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -12, head: -10, neckR: -4, shF: -50, elF: -110, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.sac = mix(q.sac, 0, kh);
  }
  // ----- After landing a hit: a ribbit and a little jig -----
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.3 && alive && !hurt) {
    const kg = win(gl, 0, 0.2, 1.0, 1.3) * (1 - F.moveW);
    const jg = Math.sin(gl * 14);
    go({ toeN: Math.max(0, jg) * 20, toeF: Math.max(0, -jg) * 20, tilt: jg * 3, shF: -110, elF: -40 }, kg);
    q.sac = mix(q.sac, 0.5, kg * win(gl, 0, 0.1, 0.4, 0.6));
    say('ribbit', kg);
  }
  // ----- A nap (its habitat): sat squat, eyes closed -----
  st.kNap = mix(st.kNap ?? 0, napping && !F.busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.kNap);
  if (nw > 0.001) {
    go({ lift: -0.18 + Math.sin(now * 1.2) * 0.004, tilt: 8, head: 10 + Math.sin(now * 1.2) * 2, chest: 3, shN: -40, elN: -70, shF: -30, elF: -80, fxN: 0.34, fxF: 0.22, fyN: 0.02, fyF: 0.02 }, nw);
    aimHarp(0.3, nw);
    q.sac = mix(q.sac, 0.15 + Math.max(0, Math.sin(now * 1.2)) * 0.2, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  if (alive && !F.busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.sac = 0;
  }
  settleFace(st, q, now, m.uid, SHUTS, 4.8);
  // (the harp's angle rides a critically damped spring, sub-stepped: it sets off and lands smoothly)
  {
    let x = st.k_hpX ?? q.harpAng;
    let v = st.k_hpV ?? 0;
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    const K = mvName ? 400 : 240;
    for (let i = 0; i < n; i++) {
      v += (K * (q.harpAng - x) - 2 * Math.sqrt(K) * v) * h;
      x += v * h;
    }
    st.k_hpX = x;
    st.k_hpV = v;
    q.harpAng = x;
  }
  easeKeys(st, q, ['blush', 'sac', 'flash', 'ring', 'hoodBob', 'notes'], dt, (key) => (key === 'flash' ? 24 : key === 'sac' ? 10 : 9));
  q.calm = k;
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// Its own marks: a little raindrop.
const BUBBLE = [[0, -7.6], [3.6, -2.6], [5.6, 1.6], [4.4, 5], [0, 6.4], [-4.4, 5], [-5.6, 1.6], [-3.6, -2.6]];
const BCOL = [INK, '#f4fbff', '#5e66b0', '#5e9a80'];

function under2() {}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gl ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.43;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [2, -26]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const H = harpAt(a, D);
  const hx0 = H.x + (Math.cos(H.ang - Math.PI / 2) * 7 + Math.cos(H.ang) * 4) * HARP;
  const hy0 = H.y + (Math.sin(H.ang - Math.PI / 2) * 7 + Math.sin(H.ang) * 4) * HARP;
  // a plucked string: one storm-blue note
  if ((q.pluck ?? -1) >= 0 && q.pluck < 1.2) {
    const e = q.pluck / 1.2;
    note(ctx, hx0 + 2 + e * 4, hy0 - 3 - e * 8, 0.9, Math.sin(e * 5) * 0.2, Math.sin(Math.PI * e), '#8ab4f0');
  }
  // one raindrop, falling into its palm
  if ((q.dropS ?? -1) >= 0 && q.dropS < 2) {
    const [px, py] = ptOf(a, D, 'handF', D.J.handF);
    const e = q.dropS;
    const y = e < 1.3 ? mix(py - 26, py - 1.4, (e / 1.3) ** 2) : py - 1.4;
    drop(ctx, px + 0.6, y, 1, e < 1.3 ? 1 : 1 - sstep((e - 1.5) / 0.4));
    if (e > 1.28 && e < 1.7) sparkle(ctx, px + 1, py - 2.4, 1.4 * Math.sin(Math.PI * (e - 1.28) / 0.42), 1, '#ffffff');
  }
  // rain dance: a few soft drops pattering round it
  if ((q.dance ?? 0) > 0.05) {
    for (let i = 0; i < 3; i++) {
      const f = (t * 1.3 + i / 3) % 1;
      drop(ctx, -8 + i * 8, -34 + f * 30, 0.7, q.dance * Math.sin(Math.PI * f) * 0.8);
    }
  }
  // singing: storm-blue notes rising
  if ((q.notes ?? 0) > 0.05) {
    const [mx, my] = headAt(a, D, [16, 4]);
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.6 + i / 3) % 1;
      note(ctx, mx + 4 + f * 8 + Math.sin(f * 7) * 2, my - 4 - f * 14, 0.85, Math.sin(f * 6) * 0.25, q.notes * Math.sin(Math.PI * f), i % 2 ? '#8ab4f0' : '#c8a8ff');
    }
  }
  // the flourish: sparkles running up the strings
  if ((q.gliss ?? -1) >= 0 && q.gliss < 1) {
    for (let i = 0; i < 3; i++) {
      const u = clamp(q.gliss * 1.4 - i * 0.15, 0, 1);
      sparkle(ctx, hx0 - 2 + u * 6, hy0 + 4 - u * 10, 1.3 * Math.sin(Math.PI * u), 1, i % 2 ? BOLT[1] : '#ffffff');
    }
  }
  // ----- Thunder Strum: a crackle off the strings, the note of lightning away -----
  if ((q.strumS ?? -1) >= 0 && q.strumS < 0.6) {
    const e = q.strumS / 0.6;
    for (let i = 0; i < 3; i++) {
      const an = -1 + i * 0.6;
      bolt(ctx, hx0 + 2, hy0, hx0 + 2 + Math.cos(an) * (6 + e * 6), hy0 + Math.sin(an) * (6 + e * 5), (1 - e) * 0.9, i, 0.9);
    }
    if (q.strumS < 0.45) {
      const u = q.strumS / 0.45;
      stormNote(ctx, hx0 + 6 + u * 34, hy0 - 2 - Math.sin(Math.PI * u) * 4, 1.1, Math.sin(u * 8) * 0.2, 1 - sstep((u - 0.8) / 0.2));
    }
  }
  // ----- Thunder Croak: soft booming rings and a crackle of light -----
  if ((q.croakS ?? -1) >= 0 && q.croakS < 0.85) {
    const e = q.croakS / 0.85;
    const [mx, my] = headAt(a, D, [16, 10]);
    for (let i = 0; i < 3; i++) {
      const u = clamp(e * 1.3 - i * 0.16, 0, 1);
      if (u <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.9;
      ell(ctx, mx + 2 + u * 10, my, 3 + u * 9, 3 + u * 10);
      pen(ctx, '#ffffff', 1.5);
      ctx.stroke();
      pen(ctx, BOLT[1], 0.6);
      ctx.stroke();
      ctx.restore();
    }
    bolt(ctx, mx + 8, my - 8, mx + 16 + e * 4, my - 2, (1 - e) * 0.9, 2, 1);
    ctx.save();
    ctx.globalAlpha *= sstep(e / 0.1) * (1 - sstep((e - 0.7) / 0.3));
    cue(ctx, 'croak!', mx + 8 + e * 3, my - 12 - e * 3, 3.6, a.flip ? -1 : 1, -0.1, '#5e66b0', '#fffdf0');
    ctx.restore();
  }
  // ----- Puddle Leap: a splash where it lands -----
  if ((q.leapS ?? -1) >= 0 && q.leapS > 0.42 && q.leapS < 0.95) {
    const u = (q.leapS - 0.42) / 0.53;
    for (let i = 0; i < 5; i++) {
      const sd = i - 2;
      drop(ctx, 10 + sd * (2 + u * 4), -2 - Math.sin(Math.PI * u) * (4 + (i % 2) * 3), 0.8, 1 - u);
    }
    ctx.save();
    ctx.globalAlpha *= (1 - u) * 0.8;
    ell(ctx, 10, -0.3, 4 + u * 8, 1 + u * 1.2);
    pen(ctx, RAIN[1], 0.8);
    ctx.stroke();
    ctx.restore();
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-15, -4]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [8, -22]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip, '#7a96c0', '#ffffff');
    }
  }
  const [bx, by] = headAt(a, D, [4, -32]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip, BUBBLE, BCOL);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip, BUBBLE, BCOL);
  ctx.globalAlpha = base;
}

// Its shot (render/dreamfx.js dreamShot, `stormnote`): a note of lightning flying, a little crackle trailing.
export function stormNoteShot(ctx, shot, x, y, p, d) {
  if (shot !== 'stormnote') return false;
  bolt(ctx, x - d * 9, y + Math.sin(p * 20) * 1.5, x - d * 2, y, 0.7, Math.floor(p * 12), 0.8);
  stormNote(ctx, x, y, 1.2, Math.sin(p * 14) * 0.25 * d);
  return true;
}

const DRESS = {
  id: ID,
  // (the skin is its slicker, sleeves and all; its own green at its legs, hands, feet and throat)
  skin: {
    lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: LW,
    parts: {
      leg: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      hand: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      foot: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3] },
      neck: { lt: BELLY[0], base: BELLY[1], sh: BELLY[2], deep: SKIN[2] },
    },
  },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  under2,
  under: {
    handNskin: (ctx, a, mode, S, D) => harp(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => slicker(ctx, a, mode, D),
    neckSkin: (ctx, a, mode, S, D) => hood(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => pads(ctx, a, mode, D, 'F'),
    handNskin: (ctx, a, mode, S, D) => pads(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
  },
  pose,
  fx,
};
const R = dressRig('frog', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.4);
rig.h = Math.round(rig.h * BIG * 1.4);
export const STORM_FROG_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const STORM_FROG_SIZE = { w: 28, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
