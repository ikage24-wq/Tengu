// The Geode Bear (2026-11-26, the Crystal Cave's Crystal Golem remade from scratch as a new creature; the id
// stays `rockgolem`). A chubby cave-bear cub of the Crystal Cave, slow and heavy, who never backs down.
// Where its belly should be there's a geode, cracked open: warm crystals inside that glow like coals
// (the only warm thing left down there, the story says, and the Geode Cores you can take from them).
// Amethyst grows from its shoulders the way crystal grows from the cave's columns. Somebody knitted it a
// scarf. On its own copy of the creature base (rig.js; body.js `bear`: a round barrel of a body, a big
// belly, short thick legs on big round paws, short thick arms), dressed here; its head, fur, geode,
// crystals and scarf drawn here from scratch over the mannequin (never the shared face, never the hero).
//   look    dusky blue-grey fur, a cream muzzle and a round plum nose, round ears with pink insides; its
//           own eyes ("ember eyes": round and kind, a warm brown iris glowing coral-gold at the bottom
//           like a coal, a big round glint and a little flame-drop glint, a soft thick lid line, a soft
//           lower lid); round fur brows that do its acting; the geode belly (a stone rim, rounded
//           crystals inside, glowing and breathing); amethyst clusters on its shoulders; a knitted plum
//           scarf, wrapped round its neck and knotted, the two ends on springs. Its own soft plum outline,
//           outer edge only, face bare.
//   walk    the base's walk at a heavy cub's pace, a sway in its shoulders, the scarf ends swinging.
//   idle    a 31 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - warm (7.4 s): it sits back and holds its paws to its glowing belly, wiggling its claws in
//             the warmth, a happy sigh, warm sparks drifting up;
//           - drip (6.8 s): a drip from the ceiling lands on its nose; a sneeze, a shake of its head,
//             a suspicious look up at the ceiling;
//           - truffle (8.4 s): a sniff, a dig, and a glowing crystal truffle; it munches it, cheeks full,
//             and does a happy little wiggle;
//           - doze (8.0 s): a huge yawn, it sits, its chin drops, its belly dims, z's; a start, ears up.
//   moves   Crystal Slam (up on its toes, both paws high; then slammed down, rounded crystals bursting up
//           out of the floor at you); Crystal Toss (a paw back to its shoulder and a crystal snapped off;
//           then lobbed at you, shattering into sparkles); Ember Huff (a big breath in, its belly flaring
//           bright; then a warm huff of glowing embers rolling out at you).
//   else    hurt: a squeezed wince, ears flat, its belly flickering; after landing a hit: a proud pat of
//           its belly; hunting you: brows down, paws up; low on health: worried, a bead of sweat; a nap
//           (habitat): sat down, dozing, its belly dim; beaten: dizzy. Its marks over its head (!, ?, z's,
//           sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: crystals as rounded amethyst prisms, embers
// as soft round glowing motes (never specks), dust as soft lilac-grey puffs, sparkles the game's curvy
// stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, pen, glow, sparkle, sweat, dizzy } from './fx.js';

const BIG = 1.55;
const LW = 1.6 / BIG;
const INK = '#4e4a78';
const FUR = ['#e2e0f2', '#acaad0', '#8784b0', '#64608c'];
const CREAM = ['#fffaf2', '#f4e8dc', '#dccab8'];
const EAR_IN = '#f6b8c8';
const NOSE = ['#8a5a82', '#5e3a5e'];
const CRYS = ['#f8f2ff', '#d6c0f6', '#a888e4', '#7c5cc4'];
const CRYS_INK = '#6a4caa';
const CORE = ['#fff6d6', '#ffd27a', '#ff9a60', '#e0604e'];
const STONE = ['#d6d2e2', '#a8a2bc', '#7c7694'];
const SCARF = ['#ffd6e6', '#e88ab0', '#c06090', '#9a4674'];
const SCARF_INK = '#8a3e68';
const CLAW = ['#fffaf0', '#ebdcc6', '#c8b292'];
const LASH = '#3a2838';
const IRIS = ['#3c2018', '#7a4028', '#e07848', '#ffc070', '#fff2c8'];
const DUST = ['#f2eef8', '#bcb4d0'];
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
const PIV2 = { scarfA: 'scarfA', scarfB: 'scarfB' };
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
// ---------- Its head (head units about the middle of its skull, drawn 1.25x) ----------
const HS = 1.25;
// (set low on its shoulders: a bear has no neck to speak of)
const HO = [1, -14.5];
const headAt = (a, D, uv) => ptOf(a, D, 'head', [D.J.neck[0] + (HO[0] + uv[0]) * HS, D.J.neck[1] + (HO[1] + uv[1]) * HS]);
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}

// ---------- Its loose pieces: the scarf's two ends ----------
const KNOT = [97, 88.6];
const JOINTS = { scarfA: [KNOT[0] - 1, KNOT[1] + 2], scarfB: [KNOT[0] + 2, KNOT[1] + 2] };
const SOFTS = [
  { name: 'scarfA', parent: 'chest', pivot: 'scarfA', rot: (S, a) => a.gb?.scarf ?? 0, soft: { k: 62, c: 4.8, gain: 0.6, turn: 0.9, hang: 0.85, max: 24, flutter: 2, hz: 0.55, dir: [0, 8] } },
  { name: 'scarfB', parent: 'chest', pivot: 'scarfB', rot: (S, a) => a.gb?.scarf ?? 0, soft: { k: 70, c: 5, gain: 0.6, turn: 0.9, hang: 0.85, max: 24, flutter: 2, hz: 0.65, dir: [0, 7] } },
];

// ---------- Its face ----------
// e: open | wide | happy | squeeze | shut | sleep | dizzy; g gaze; b brows [outer, inner] (+ lower);
// m mouth.
const FACES = {
  calm: { e: 'open', g: [0.5, 0.4], b: [0, 0], m: 'calm' },
  cozy: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  happy: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  proud: { e: 'open', g: [0.6, 0.2], b: [-0.5, -0.3], m: 'smile' },
  sniff: { e: 'shut', b: [0, -0.4], m: 'calm' },
  up: { e: 'open', g: [0.3, -2.4], b: [-1.2, -1.6], m: 'o' },
  sus: { e: 'open', g: [0.6, -2.2], b: [-0.6, 1.6], m: 'set' },
  sneeze: { e: 'squeeze', b: [0.4, 1.2], m: 'open' },
  chew: { e: 'happy', b: [-0.6, -0.8], m: 'chew' },
  focus: { e: 'open', g: [1.2, 0.8], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.4, 0.4], b: [-1, 2.2], m: 'set' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  inhale: { e: 'open', g: [1, -0.4], b: [-1, 1], m: 'puff' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  surprised: { e: 'wide', g: [0.2, -0.4], b: [-2, -2.2], m: 'o' },
  worried: { e: 'open', g: [0.4, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  yawn: { e: 'squeeze', b: [0.6, -1.2], m: 'yawn' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['cozy', 'happy', 'sniff', 'sneeze', 'chew', 'shout', 'hurt', 'yawn', 'sleep', 'shut', 'dizzy']);

function curve3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// One eye (head units): x, y its middle; o +1 the near eye, -1 the far.
function eye(ctx, a, x, y, o, f) {
  const w = 4.4;
  const h = 4.6;
  const kind = f.e;
  if (kind === 'happy') {
    curve3(ctx, a, [x - w, y + 1], [x, y - h * 1.15], [x + w, y + 1], 1.45, LASH);
    return;
  }
  if (kind === 'squeeze') {
    curve3(ctx, a, [x - w * o, y - 1.8], [x + w * 0.2 * o, y - 0.2], [x + w * o, y + 0.4], 1.4, LASH);
    curve3(ctx, a, [x - w * o, y + 2.2], [x + w * 0.1 * o, y + 1.2], [x + w * o, y + 0.5], 1.2, LASH);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    curve3(ctx, a, [x - w, y], [x, y + (kind === 'sleep' ? 3.4 : 2.8)], [x + w, y], 1.45, LASH);
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
    curve3(ctx, a, [x - w, y - h * 0.3], [x, y - h * 1.3], [x + w, y - h * 0.3], 1.5, LASH);
    return;
  }
  const [gx, gy] = f.g ?? [0.5, 0.4];
  const ix = x + gx;
  const iy = y + gy + 0.3;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = w * 0.76 * ir;
  const ih = h * 0.8 * ir;
  // the iris: deep warm brown, glowing coral to gold at the bottom like a coal
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.3, iw * 0.86, ih * 0.86);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.42, iw * 0.66, ih * 0.4);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.56, iw * 0.42, ih * 0.22);
  ctx.fillStyle = tone(a, IRIS[3]);
  ctx.fill();
  ell(ctx, ix, iy, iw * 0.4 * ir, ih * 0.42 * ir);
  ctx.fillStyle = tone(a, '#1e0e0c');
  ctx.fill();
  // glints: a big round one, and its little flame drop (a rounded teardrop, tip up)
  ell(ctx, ix - 1.2, iy - 1.5, 1.35 * ir, 1.25 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const fx0 = ix + 1.2;
  const fy0 = iy + 1.5;
  ctx.beginPath();
  ctx.moveTo(fx0, fy0 - 1.5);
  ctx.quadraticCurveTo(fx0 + 0.9, fy0 - 0.2, fx0 + 0.7, fy0 + 0.4);
  ctx.arc(fx0, fy0 + 0.4, 0.7, 0, Math.PI);
  ctx.quadraticCurveTo(fx0 - 0.9, fy0 - 0.2, fx0, fy0 - 1.5);
  ctx.fillStyle = tone(a, IRIS[4]);
  ctx.fill();
  // a soft thick lid line over the top, round at both ends (no flick: a bear's soft eye)
  ctx.beginPath();
  ctx.moveTo(x - w * 0.98, y - h * 0.2);
  ctx.quadraticCurveTo(x, y - h * 1.36, x + w * 0.98, y - h * 0.2);
  pen(ctx, tone(a, LASH), 1.7);
  ctx.stroke();
  // the soft lower lid
  curve3(ctx, a, [x - w * 0.5 * o, y + h * 0.98], [x + w * 0.2 * o, y + h * 1.06], [x + w * 0.8 * o, y + h * 0.7], 0.6, '#b88aa0');
}
// Round fur brows (head units): a soft round tuft over each eye.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 3, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1.1 + (bo + bi) * 0.35, x + o * 3, y + bo * 0.7);
  pen(ctx, tone(a, FUR[3]), 1.9);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#6e3a58';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#7a2e4a');
    ctx.fill();
    ell(ctx, x, y + h * 0.75, w * 0.6, h * 0.36);
    ctx.fillStyle = tone(a, '#ff98ae');
    ctx.fill();
  };
  const stroke = (pts, w = 0.8) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  switch (m) {
    case 'smile':
      stroke([[x - 2.4, y - 0.2], [x - 1.2, y + 1.4], [x, y + 0.3], [x + 1.2, y + 1.4], [x + 2.4, y - 0.2]]);
      break;
    case 'open':
      open(2.4, 2.4);
      break;
    case 'o':
      ell(ctx, x, y + 0.7, 1.1, 1.3);
      ctx.fillStyle = tone(a, '#7a2e4a');
      ctx.fill();
      break;
    case 'shout':
      open(2.8, 3);
      break;
    case 'yawn':
      open(2.2, 3.6);
      break;
    case 'puff':
      // cheeks full of air, lips pressed
      ell(ctx, x, y + 0.6, 0.9, 0.7);
      ctx.fillStyle = tone(a, '#7a2e4a');
      ctx.fill();
      break;
    case 'chew': {
      const ch = Math.sin((a.now ?? 0) * 14);
      stroke([[x - 2, y + 0.4 + ch * 0.4], [x, y + 1.2 - ch * 0.4], [x + 2, y + 0.4 + ch * 0.4]], 0.9);
      break;
    }
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
      ell(ctx, x, y + 0.4, 0.8, 0.6);
      ctx.fillStyle = tone(a, '#7a2e4a');
      ctx.fill();
      break;
    case 'talkA':
      open(1.8, 2);
      break;
    case 'talkE':
      open(2.2, 1.1);
      break;
    default:
      // at rest: a bear's soft "w" under its nose, a little closed and content
      stroke([[x - 2.2, y - 0.2], [x - 1.1, y + 1.0], [x, y + 0.2], [x + 1.1, y + 1.0], [x + 2.2, y - 0.2]], 0.75);
  }
}
// The skull: a big round head, a touch wider at the cheeks.
const SKULL = [[-20, -2], [-18.6, -11], [-12.6, -17.6], [-3, -20], [7, -19], [14.6, -14], [19, -6], [20.4, 2], [18.6, 10], [12, 15.6], [2, 17.4], [-8, 16.6], [-16, 11.6]];
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, 0, r, r * 0.94);
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'fill') {
    ell(ctx, 0.3, 0.6, r * 0.56, r * 0.5);
    ctx.fillStyle = tone(a, EAR_IN);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gb ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  const flat = q.earFlat ?? 0;
  ctx.save();
  headFrame(ctx, a, D);
  // its round ears, rooted inside the skull (they flatten back when it's hurt)
  ear(ctx, a, mode, -13.4, -16 + flat * 3, 6.2, -0.4 - flat * 0.5);
  ear(ctx, a, mode, 11.4, -17.4 + flat * 3, 6.4, 0.3 + flat * 0.5);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -6, -12, 16, FUR[0], 0.85);
    glow(ctx, -16, 10, 10, FUR[2], 0.6);
    ctx.restore();
    // cheeks
    for (const [cx, k] of [[-10, 0.75], [13.6, 1]]) {
      ell(ctx, cx, 5.6, 3.2, 1.9);
      ctx.fillStyle = tone(a, '#ff9cb4', 0.5 * k);
      ctx.fill();
    }
    eye(ctx, a, -6, -1.2, -1, f);
    eye(ctx, a, 8.4, -1.6, 1, f);
    brow(ctx, a, -6.2, -8.2, -1, f.b);
    brow(ctx, a, 8.6, -8.6, 1, f.b);
    // the muzzle: a soft cream round, a little toward its nose (puffed out when it chews or huffs)
    const puff = q.puffCheek ?? 0;
    smooth(ctx, [[1.6, 7], [4, 3.6], [9, 2.8], [14.4, 3.6], [17, 7.4], [15.4, 11.6], [9.4, 13.4 + puff], [3.4, 11.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 8, 5, 5, CREAM[0], 0.9);
    if (puff > 0.05) {
      ell(ctx, 3.6, 9, 3 * puff, 2.4 * puff);
      ctx.fillStyle = tone(a, CREAM[0]);
      ctx.fill();
    }
    // the nose: a round plum button with a glint, twitching when it sniffs
    const tw = q.sniff ? Math.sin((a.now ?? 0) * 30) * 0.35 : 0;
    smooth(ctx, [[10.4 + tw, 4.2], [12.6 + tw, 3.4], [15.2 + tw, 4], [15.4 + tw, 5.8], [13 + tw, 7.2], [10.6 + tw, 6]]);
    ctx.fillStyle = tone(a, NOSE[0]);
    ctx.fill();
    ell(ctx, 12.4 + tw, 4.3, 1, 0.55, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 12.6, 9.2, f.m);
  }
  ctx.restore();
}

// ---------- Its body ----------
// A rounded amethyst prism (kid units, rooted at 0, 0, pointing up along -y): soft rounded tip.
function prism(ctx, a, mode, len, w, glowK = 0) {
  smooth(ctx, [[-w, 1], [-w, -len * 0.62], [-w * 0.5, -len * 0.94], [0, -len], [w * 0.5, -len * 0.94], [w, -len * 0.62], [w, 1]]);
  if (mode === 'line') return paint(ctx, a, 'line', null, CRYS_INK, LW);
  ctx.fillStyle = tone(a, CRYS[2]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  // a lit face down one side, a soft shine, a glow when it flares
  ctx.fillStyle = tone(a, CRYS[1]);
  ctx.fillRect(-w, -len, w * 0.9, len + 2);
  ctx.beginPath();
  ctx.moveTo(-w * 0.45, -len * 0.2);
  ctx.lineTo(-w * 0.45, -len * 0.78);
  pen(ctx, 'rgba(255,255,255,0.8)', w * 0.35);
  ctx.stroke();
  if (glowK > 0.02) glow(ctx, 0, -len * 0.4, len, CRYS[0], glowK * 0.7);
  ctx.restore();
}
// The amethyst growing from its shoulders and upper back (in the chest's frame; the roots inside its fur).
const CLUSTERS = [[66, 90, -0.55, 11, 3.2], [71, 86.6, -0.2, 14, 3.6], [76.6, 86.4, 0.12, 9, 2.8], [63, 96, -0.9, 8, 2.6]];
function crystals(ctx, a, mode, D, missing = -1) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  CLUSTERS.forEach(([x, y, r, len, w], i) => {
    if (i === missing) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r);
    prism(ctx, a, mode, len, w, a.gb?.flare ?? 0);
    ctx.restore();
  });
  ctx.restore();
}
// The geode belly: a stone rim round an opening in its fur, rounded crystals inside, glowing like coals
// (in the waist's frame).
const GEODE = [[80, 104], [88, 101.6], [96.4, 104.6], [100, 112], [97.6, 120], [89, 123.4], [81, 121], [77.6, 112]];
function geode(ctx, a, mode, D) {
  const q = a.gb ?? {};
  const k = q.core ?? 0.6;
  ctx.save();
  enter(ctx, a, D, 'waistB');
  // the cream belly fur round it
  smooth(ctx, [[76, 100], [90, 98], [101.4, 104], [104, 114], [100, 124], [88, 127.6], [78, 124], [74, 112]]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 96, 106, 9, CREAM[0], 0.8);
    glow(ctx, 80, 124, 9, CREAM[2], 0.6);
    ctx.restore();
    // the stone rim
    smooth(ctx, GEODE.map(([x, y]) => [88 + (x - 88) * 1.14, 112.4 + (y - 112.4) * 1.14]));
    ctx.fillStyle = tone(a, STONE[1]);
    ctx.fill();
    smooth(ctx, GEODE);
    ctx.fillStyle = tone(a, STONE[2]);
    ctx.fill();
    ctx.save();
    smooth(ctx, GEODE);
    ctx.clip();
    // the warm crystals inside, glowing like coals; their glow breathing with it
    ctx.fillStyle = tone(a, CORE[3]);
    ctx.fillRect(74, 98, 30, 28);
    glow(ctx, 89, 114, 13, CORE[2], 0.7 + k * 0.3);
    for (const [x, y, r, s] of [[82, 108, 0.5, 6], [88, 106, 0.1, 7], [94.6, 108.6, -0.4, 6], [80.4, 117, 0.9, 5], [86, 120, 0.3, 6], [92, 118.6, -0.3, 7], [97, 115, -1, 5]]) {
      ctx.save();
      ctx.translate(x, y + s * 0.6);
      ctx.rotate(r + Math.PI);
      smooth(ctx, [[-2, 0], [-2, -s * 0.7], [0, -s], [2, -s * 0.7], [2, 0]]);
      ctx.fillStyle = tone(a, CORE[1]);
      ctx.fill();
      ctx.fillStyle = tone(a, CORE[0], 0.6 + k * 0.4);
      ctx.fillRect(-2, -s, 1.6, s);
      ctx.restore();
    }
    glow(ctx, 88, 112, 8, CORE[0], 0.35 + k * 0.5);
    ctx.restore();
    // a soft crack running out from the rim into its fur, and a lit rim edge
    ctx.beginPath();
    ctx.moveTo(98, 106);
    ctx.quadraticCurveTo(100.6, 103, 101, 100.6);
    pen(ctx, tone(a, STONE[2]), 0.9);
    ctx.stroke();
  }
  ctx.restore();
}
// The scarf: wrapped round its neck (a band following the neck's outline, knitted ribs) and knotted at
// its near side; the two ends hang from the knot on their springs.
function scarfWrap(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  smooth(ctx, [[65, 83.4], [74, 86], [82, 86.6], [90, 85.6], [97, 83.4], [98.6, 88], [96.6, 92.6], [88, 94.4], [80, 94.8], [72, 94], [64.4, 90]]);
  if (mode === 'line') paint(ctx, a, 'line', null, SCARF_INK);
  else {
    ctx.fillStyle = tone(a, SCARF[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 90, 88, 8, SCARF[0], 0.7);
    glow(ctx, 70, 94, 7, SCARF[2], 0.6);
    // knitted ribs and a stripe
    ctx.strokeStyle = tone(a, SCARF[2]);
    ctx.lineWidth = 0.8;
    for (let x = 67; x < 97; x += 3.4) {
      ctx.beginPath();
      ctx.moveTo(x, 84.6 + Math.abs(x - 82) * 0.04);
      ctx.lineTo(x + 0.6, 94.2);
      ctx.stroke();
    }
    ctx.fillStyle = tone(a, SCARF[0], 0.8);
    ctx.fillRect(64, 89.4, 36, 1.4);
    ctx.restore();
  }
  ctx.restore();
}
function scarfEnds(ctx, a, mode, D) {
  for (const [k, len, w] of [['scarfA', 11, 5.6], ['scarfB', 8.6, 5]]) {
    ctx.save();
    enter(ctx, a, D, k);
    const p = D.J[k];
    ctx.translate(p[0], p[1]);
    smooth(ctx, [[-w * 0.5, -2], [w * 0.5, -2], [w * 0.58, len * 0.6], [w * 0.5, len], [-w * 0.5, len], [-w * 0.58, len * 0.55]]);
    if (mode === 'line') paint(ctx, a, 'line', null, SCARF_INK);
    else {
      ctx.fillStyle = tone(a, k === 'scarfA' ? SCARF[1] : SCARF[2]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = tone(a, SCARF[0], 0.8);
      ctx.fillRect(-w, len * 0.45, w * 2, 1.4);
      ctx.restore();
      // a soft fringe of round tassels
      for (let i = 0; i < 3; i++) {
        ell(ctx, -w * 0.3 + i * w * 0.3, len + 1, 0.9, 1.3);
        ctx.fillStyle = tone(a, SCARF[2]);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  // the knot
  ctx.save();
  enter(ctx, a, D, 'chest');
  ell(ctx, KNOT[0], KNOT[1], 3.4, 3);
  if (mode === 'line') paint(ctx, a, 'line', null, SCARF_INK);
  else {
    ctx.fillStyle = tone(a, SCARF[1]);
    ctx.fill();
    ell(ctx, KNOT[0] - 0.8, KNOT[1] - 0.8, 1.4, 1);
    ctx.fillStyle = tone(a, SCARF[0]);
    ctx.fill();
  }
  ctx.restore();
}
// Round claws on a paw (kid units, in the hand's frame).
function claws(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const h = D.J[k === 'N' ? 'handN' : 'handF'];
  for (const [dx, len] of [[-2.8, 3.2], [0, 3.6], [2.8, 3.2]]) {
    ctx.save();
    ctx.translate(h[0] + dx, h[1] + 4.6);
    ell(ctx, 0, len * 0.5, 1.1, len * 0.55);
    if (mode === 'line') paint(ctx, a, 'line', null, CLAW[2], LW * 0.8);
    else {
      ctx.fillStyle = tone(a, CLAW[1]);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
function toes(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const x = D.J[`ank${k}`][0];
  for (const dx of [5, 7.6]) {
    ell(ctx, x + dx, 144.8, 1.3, 1.0);
    if (mode === 'line') paint(ctx, a, 'line', null, CLAW[2], LW * 0.8);
    else {
      ctx.fillStyle = tone(a, CLAW[1]);
      ctx.fill();
    }
  }
  ctx.restore();
}
// Its round stub of a tail, behind its hips.
function tailStub(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  ell(ctx, 62, 118, 5, 4.6);
  paint(ctx, a, mode, FUR[2]);
  ctx.restore();
}
// The crystal truffle it digs up (game px about its middle).
function truffle(ctx, a, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.6, CRYS[1], 0.5);
  ell(ctx, x, y, r, r * 0.86);
  ctx.fillStyle = tone(a, '#8a6a5a');
  ctx.fill();
  pen(ctx, '#5a4040', r * 0.22);
  ctx.stroke();
  for (const [dx, dy, s] of [[-0.3, -0.7, 0.6], [0.5, -0.5, 0.5]]) {
    ell(ctx, x + dx * r, y + dy * r, s * r * 0.5, s * r * 0.7);
    ctx.fillStyle = tone(a, CRYS[1]);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Its act and fight ----------
const PIECES = { warm: 7.4, drip: 6.8, truffle: 8.4, doze: 8.0 };
const ORDER = ['warm', 'drip', 'truffle', 'doze'];
const POOL = ['slam', 'toss', 'huff'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, core: 0.55 + Math.sin(t * 1.4) * 0.12, flare: 0, scarf: 0, earFlat: 0, sniff: false, puffCheek: 0, motes: 0, drip: -1, shake: 0, truffle: 0, dig: -1, zz: 0, sweat: -1, slam: -1, toss: null, huff: -1, gather: 0, missing: -1, sparkle: -1 };
  a.gb = q;
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
  // Standing: heavy and settled, its arms hanging round its belly, a slow breath; walking, a sway.
  const br = c.breath ?? 0;
  go({ shN: -8 + br * 2, elN: -34, hwN: 10, shF: 6 + br * 1.5, elF: -30, hwF: 8, tilt: 2 + walking * 2, head: -1, chest: -br * 0.6 }, 1);
  q.scarf = 0.08 * walking;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.gbWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.gbAtk) {
      const pool = m.def.moves ?? POOL;
      st.gbN = (st.gbN ?? m.uid ?? 0) + 1;
      st.gbMove = m.move ?? pool[st.gbN % pool.length];
    }
    st.gbAtk = true;
  } else st.gbAtk = false;
  const mvName = st.gbAtk ? st.gbMove : null;
  const hadWind = now - (st.gbWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.gbCalm = mix(st.gbCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.gbCalm);
  let PC = st.gbPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.gbOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.gbOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.gbOrd = (st.gbOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.gbPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let sit = 0;

  if (k > 0.001 && piece === 'warm') {
    // sat back, its paws held to its glowing belly, claws wiggling in the warmth
    sit = Math.max(sit, win(pu, 0.2, 0.9, 6.4, 7.2) * k);
    const paws = win(pu, 0.6, 1.2, 5.8, 6.4);
    go({ shN: -30, elN: -74, hwN: -30, shF: -24, elF: -70, hwF: -30, head: 8, neckR: 3 }, paws * k);
    add({ hwN: Math.sin(pu * 9) * 14 * win(pu, 1.6, 1.8, 3.6, 3.8), hwF: Math.sin(pu * 9 + 1.4) * 14 * win(pu, 1.6, 1.8, 3.6, 3.8) }, k);
    q.core += 0.35 * paws * k;
    q.motes = Math.max(q.motes, paws * k);
    say('cozy', win(pu, 1.2, 1.4, 6.0, 6.2) * k);
    // a happy sigh: a slow rise and fall of its chest
    add({ chest: -Math.sin(Math.PI * clamp((pu - 4.0) / 1.4, 0, 1)) * 5, head: -Math.sin(Math.PI * clamp((pu - 4.0) / 1.4, 0, 1)) * 4 }, k);
  }
  if (k > 0.001 && piece === 'drip') {
    // a drip falls from the ceiling and lands on its nose
    if (pu > 0.2 && pu < 1.6) q.drip = pu - 0.2;
    say('surprised', win(pu, 1.4, 1.45, 1.8, 1.9) * k);
    // ah... CHOO: a sneeze, a shake of its head
    const ah = win(pu, 1.9, 2.3, 2.6, 2.7);
    go({ head: -12, neckR: -4, chest: -4 }, ah * k);
    say('sneeze', win(pu, 2.2, 2.3, 3.0, 3.1) * k);
    const ch = win(pu, 2.65, 2.72, 2.9, 3.2);
    go({ head: 16, neckR: 5, chest: 5, tilt: 5 }, ch * k);
    const sh = win(pu, 3.3, 3.45, 4.2, 4.5);
    add({ head: Math.sin(pu * 26) * 8 * sh, neckR: Math.sin(pu * 26 - 0.5) * 3 * sh }, k);
    q.shake = sh * k;
    say('shut', sh * k);
    // a suspicious squint up at the ceiling
    const sus = win(pu, 4.6, 4.9, 6.2, 6.6);
    go({ head: -14, neckR: -4, tilt: -2 }, sus * k);
    say('sus', sus * k);
  }
  if (k > 0.001 && piece === 'truffle') {
    // a sniff along the floor
    const sn = win(pu, 0, 0.5, 1.0, 1.2);
    go({ tilt: 18, head: 14 }, sn * k);
    q.sniff = sn > 0.4;
    say('sniff', sn * k);
    // a dig with both paws
    const dg = win(pu, 1.0, 1.4, 3.2, 3.5);
    go({ tilt: 30, head: 12, lift: -0.06, shN: -40, elN: -20, shF: -34, elF: -20 }, dg * k);
    add({ shN: Math.sin(pu * 10) * 16 * dg, shF: -Math.sin(pu * 10) * 16 * dg }, k);
    say('focus', dg * k);
    if (dg > 0.3) q.dig = pu;
    // a glowing truffle! munched, cheeks full
    q.truffle = win(pu, 3.4, 3.6, 5.2, 5.4) * k;
    const hold = win(pu, 3.4, 3.8, 4.8, 5.3);
    go({ shN: -110, elN: -70, hwN: -20, head: -4 }, hold * k);
    say('surprised', win(pu, 3.6, 3.7, 4.1, 4.2) * k);
    say('happy', win(pu, 4.2, 4.3, 5.0, 5.2) * k);
    const chew = win(pu, 5.2, 5.4, 6.8, 7.0);
    q.puffCheek = Math.max(q.puffCheek, chew * k);
    say('chew', chew * k);
    // a happy wiggle
    const wig = win(pu, 7.0, 7.2, 8.0, 8.3);
    add({ pelvis: Math.sin(pu * 16) * 5 * wig, chest: -Math.sin(pu * 16) * 3 * wig, head: Math.sin(pu * 16 - 0.6) * 3 * wig }, k);
    say('cozy', wig * k);
  }
  if (k > 0.001 && piece === 'doze') {
    say('yawn', win(pu, 0, 0.2, 0.9, 1.1) * k);
    go({ shN: -140, elN: -60, shF: -130, elF: -60, head: -10, chest: -4 }, win(pu, 0.1, 0.4, 0.9, 1.2) * k);
    sit = Math.max(sit, win(pu, 0.8, 1.6, 5.6, 6.2) * k);
    const nod = win(pu, 1.4, 2.0, 5.4, 5.6);
    go({ head: 18 + Math.sin(pu * 1.5) * 3, neckR: 5 }, nod * k);
    say('sleep', win(pu, 1.6, 1.7, 5.4, 5.5) * k);
    q.zz = Math.max(q.zz, win(pu, 2.0, 2.4, 5.2, 5.5) * k);
    q.core -= 0.35 * nod * k;
    // a start, ears up
    const jolt = pu > 5.5 ? clamp(boing(pu - 5.5, 9, 18), 0, 1.15) * (1 - sstep((pu - 6.2) / 0.4)) : 0;
    add({ hop: 0.04 * jolt, head: -6 * jolt }, k);
    say('surprised', win(pu, 5.5, 5.55, 6.2, 6.4) * k);
    say('proud', win(pu, 6.6, 6.8, 7.6, 7.9) * k);
  }

  // (its own marks over its head)
  if (fighting && alive && !st.gbHunt) st.gbBangAt = now;
  if (!fighting && st.gbHunt && alive) st.gbLostAt = now;
  st.gbHunt = fighting && alive;
  q.bang = now - (st.gbBangAt ?? -9);
  q.huh = now - (st.gbLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: brows down, paws up -----
  if (fighting && alive && !hurt) {
    go({ tilt: 8, head: 6, shN: -70, elN: -80, hwN: 10, shF: -60, elF: -80 }, 1);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- Its moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 0;
    const snapT = mvName === 'slam' ? 0.32 : 0.16;
    // (a smootherstep: its heavy paws come to rest with no sudden stop)
    const sm5 = (u) => {
      const v = clamp(u, 0, 1);
      return v * v * v * (v * (v * 6 - 15) + 10);
    };
    const snap = s >= 0 ? sm5(s / (hadWind ? snapT : snapT + 0.06)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'slam') {
      // up on its toes, both paws high; then slammed down
      go({ tilt: -8, head: -8, lift: 0.03, shN: -138, elN: -46, shF: -134, elF: -46, chest: -4 }, wu);
      q.flare = Math.max(q.flare, wu * 0.6);
      say('fierce', W);
      go({ tilt: 20, head: 10, lift: -0.06, shN: -48, elN: -16, shF: -44, elF: -16 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.slam = s;
    } else if (mvName === 'toss') {
      // a paw back over its shoulder, a crystal snapped off; then lobbed at you
      go({ shN: 40, elN: -130, hwN: -20, tilt: -6, head: -4, x: -0.02 }, wu);
      say('focus', W);
      if (W > 0.55 || s >= 0) q.missing = 1;
      go({ shN: -120, elN: -20, tilt: 10, head: 4, x: 0.03 }, snap * sw);
      say('shout', snap * win(s, 0, 0.02, 0.3, 0.45));
      q.toss = { W, s };
    } else {
      // a big breath in, its belly flaring; then a warm huff of embers rolling out at you
      go({ tilt: -8, head: -10, chest: -8, shN: 20, elN: -40, shF: 24, elF: -40 }, wu);
      q.core += 0.6 * wu;
      q.gather = wu;
      q.puffCheek = Math.max(q.puffCheek, wu);
      say('inhale', W);
      go({ tilt: 14, head: 8, chest: 6, x: 0.02 }, snap * sw);
      q.core += 0.5 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.huff = s;
    }
  }
  // ----- Hurt: a wince, ears flat, its belly flickering -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -10, head: 12, neckR: 4, shN: -80, elN: -110, shF: -70, elF: -110 }, kh);
    q.face = 'hurt';
    q.earFlat = Math.max(q.earFlat, kh);
    q.core *= 0.6 + 0.4 * Math.abs(Math.sin(ago * 30));
  }
  // ----- After landing a hit: a proud pat of its belly -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.28, 0.8, 1.1) * (1 - moveW);
    go({ shN: -30, elN: -80, hwN: -20 + Math.sin(gl * 14) * 10, chest: -4, head: -4 }, kg);
    say('proud', kg);
  }
  // ----- A nap (its habitat): sat down, dozing, its belly dim -----
  st.gbNap = mix(st.gbNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.gbNap);
  if (nw > 0.001) {
    sit = Math.max(sit, nw);
    go({ head: 18 + Math.sin(now * 1.5) * 3, neckR: 5, shN: -20, elN: -60, shF: -16, elF: -60 }, nw);
    q.core -= 0.35 * nw;
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // sat down: its rump low, legs out in front
  if (sit > 0.001) go({ lift: -0.24 + Math.sin(now * 1.4) * 0.006, tilt: -8, fxN: 0.42, fyN: 0.06, fxF: 0.36, fyF: 0.05, toeN: -14, toeF: -14 }, sit);
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.core = 0.15;
  }
  // ----- The face: an in-between (a blink) on every change; its own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.gbFace) {
    st.gbFaceFrom = st.gbFace;
    st.gbFace = f;
    st.gbFaceAt = now;
  }
  const since0 = now - (st.gbFaceAt ?? -9);
  if (since0 >= 0 && since0 < 0.07 && st.gbFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.gbFaceFrom)) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.53) % 4.8;
  if (bl < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  for (const key of ['core', 'flare', 'earFlat', 'puffCheek', 'scarf']) {
    st[`gb_${key}`] = mix(st[`gb_${key}`] ?? q[key], q[key], ease(10));
    q[key] = st[`gb_${key}`];
  }
}

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
function puff(ctx, x, y, r, al, pass) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.88);
  if (pass === 'line') {
    ctx.lineWidth = Math.max(0.4, r * 0.3);
    ctx.strokeStyle = DUST[1];
    ctx.stroke();
  } else {
    ctx.fillStyle = DUST[0];
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
// A warm ember: a soft round glowing mote, gold at its heart (never a speck).
function ember(ctx, a, x, y, r, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.4, CORE[2], 0.45);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = CORE[1];
  ctx.fill();
  ell(ctx, x - r * 0.2, y - r * 0.2, r * 0.5, r * 0.5);
  ctx.fillStyle = CORE[0];
  ctx.fill();
  ctx.restore();
}
// A rounded amethyst shard in flight or bursting up (game px; its root at x, y, pointing along `ang`).
function shard(ctx, a, x, y, len, w, ang, al) {
  if (al <= 0.01 || len <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const mode of ['line', 'fill']) {
    smooth(ctx, [[-w, 0.4], [-w, -len * 0.62], [-w * 0.5, -len * 0.94], [0, -len], [w * 0.5, -len * 0.94], [w, -len * 0.62], [w, 0.4]]);
    if (mode === 'line') {
      pen(ctx, CRYS_INK, Math.max(0.5, w * 0.5));
      ctx.stroke();
    } else {
      ctx.fillStyle = CRYS[2];
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = CRYS[1];
      ctx.fillRect(-w, -len, w * 0.9, len + 1);
      ctx.restore();
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
  ctx.strokeStyle = '#7a6eaa';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f4f0ff';
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
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#7a6eaa';
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
function drop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2);
  ctx.bezierCurveTo(r * 0.35, -r * 1.4, r * 1.05, -r * 0.6, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.6, -r * 0.35, -r * 1.4, 0, -r * 2);
  ctx.closePath();
  pen(ctx, '#6a9ad8', Math.max(0.3, r * 0.4));
  ctx.stroke();
  ctx.fillStyle = '#cfeeff';
  ctx.fill();
  ell(ctx, -r * 0.35, -r * 0.4, r * 0.28, r * 0.38, -0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gb ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.51;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -30]);
    dizzy(ctx, hx, hy, 7, a.now ?? 0, 3);
    return;
  }
  const [cx, cy] = ptOf(a, D, 'waistB', [88, 112]);
  // warm motes drifting up off its belly (warming its paws)
  if ((q.motes ?? 0) > 0.05) {
    for (let i = 0; i < 4; i++) {
      const f = (t * 0.45 + i / 4) % 1;
      const n = Math.floor(t * 0.45 + i / 4);
      ember(ctx, a, cx + (hash(n * 3 + i) - 0.5) * 8 + Math.sin(f * 5 + i) * 1.5, cy - 2 - f * 22, 0.7 * (1 - f * 0.4), q.motes * Math.sin(Math.PI * f));
    }
  }
  // the drip from the ceiling onto its nose, and the drops shaken off
  if ((q.drip ?? -1) >= 0 && q.drip < 1.4) {
    const [nx, ny] = headAt(a, D, [13, 2]);
    const u = clamp(q.drip / 1.2, 0, 1);
    if (u < 1) drop(ctx, nx, ny - 30 + u * u * 30, 0.9, 1);
    else for (const d of [-1, 1]) drop(ctx, nx + d * (1 + (q.drip - 1.2) * 12), ny - Math.sin(Math.PI * (q.drip - 1.2) / 0.2) * 2, 0.5, 1 - (q.drip - 1.2) / 0.2);
  }
  if ((q.shake ?? 0) > 0.1) {
    const [hx, hy] = headAt(a, D, [0, -8]);
    for (let i = 0; i < 4; i++) {
      const f = (t * 2.4 + i / 4) % 1;
      const an = -Math.PI * 0.95 + (i / 3) * Math.PI * 0.9;
      drop(ctx, hx + Math.cos(an) * (8 + f * 8), hy + Math.sin(an) * (6 + f * 6) + f * f * 6, 0.45, q.shake * (1 - f));
    }
  }
  // digging: dust and pebbly crumbs; the truffle in its paws
  if ((q.dig ?? -1) >= 0) {
    const [hx] = ptOf(a, D, 'handN', D.J.handN);
    const L = [];
    for (let i = 0; i < 4; i++) {
      const f = (t * 2.0 + i / 4) % 1;
      L.push([hx - 3 - f * 14, -1 - Math.sin(Math.PI * f) * 7, 1.1 + f * 0.8, Math.sin(Math.PI * f) * 0.85]);
    }
    cloud(ctx, L);
  }
  if ((q.truffle ?? 0) > 0.02) {
    const [tx, ty] = ptOf(a, D, 'handN', [D.J.handN[0] + 1, D.J.handN[1] + 1]);
    truffle(ctx, a, tx, ty - 1.4, 1.6, q.truffle);
  }
  // ----- Crystal Slam: rounded crystals bursting up out of the floor in a line at you -----
  if ((q.slam ?? -1) >= 0) {
    const s = q.slam;
    for (let i = 0; i < 4; i++) {
      const u = clamp((s - i * 0.07) / 0.5, 0, 1);
      if (u <= 0) continue;
      const rise = Math.sin(Math.PI * Math.min(1, u * 1.25)) * (1 - sstep((u - 0.75) / 0.25));
      const x = 14 + i * 7;
      shard(ctx, a, x, 0.5, (6 + (i % 2) * 3) * rise, 1.6, (i % 2 ? 0.2 : -0.15), 1 - sstep((u - 0.8) / 0.2));
      if (u < 0.6) cloud(ctx, [[x - 2, -1, 1.4 * (1 - u), 0.8], [x + 2, -1.2, 1.2 * (1 - u), 0.7]]);
    }
    const L = [];
    for (const side of [-1, 1]) for (let i = 0; i < 2; i++) L.push([side * (5 + s * 14 + i * 4), -1.2 - i, 1.6 - s, 1 - s]);
    cloud(ctx, L);
  }
  // ----- Crystal Toss: the crystal snapped off its shoulder, lobbed, shattering into sparkles -----
  if (q.toss) {
    const { W, s } = q.toss;
    if (s < 0 && W > 0.55) {
      const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
      shard(ctx, a, hx, hy, 4, 1.2, 0.4, 1);
    } else if (s >= 0 && s < 1.0) {
      if (!a.mo.gbToss || s < 0.03) a.mo.gbToss = ptOf(a, D, 'handN', D.J.handN);
      const [ox, oy] = a.mo.gbToss;
      const u = clamp(s / 0.55, 0, 1);
      const x = mix(ox, 38, u);
      const y = mix(oy, -6, u) - Math.sin(Math.PI * u) * 12;
      if (u < 1) {
        shard(ctx, a, x, y, 4.4, 1.3, u * 9, 1);
        for (let i = 1; i <= 3; i++) sparkle(ctx, x - i * 3 * (1 - u * 0.5), y + i * 0.8, 0.8 * (1 - i * 0.2), 1 - u * 0.5, CRYS[0]);
      } else {
        const v = clamp((s - 0.55) / 0.4, 0, 1);
        for (let i = 0; i < 6; i++) {
          const an = -Math.PI + (i / 5) * Math.PI;
          shard(ctx, a, 38 + Math.cos(an) * v * 9, -6 + Math.sin(an) * v * 7 + v * v * 6, 2 * (1 - v), 0.8, an + Math.PI / 2, 1 - v);
        }
        sparkle(ctx, 38, -8, 3 * Math.sin(Math.PI * v), 1, '#ffffff');
      }
    } else a.mo.gbToss = null;
  }
  // ----- Ember Huff: embers gathering at its belly, then a warm wave rolling out at you -----
  if ((q.gather ?? 0) > 0.05) {
    for (let i = 0; i < 5; i++) {
      const an = t * 2.2 + (i / 5) * TAU;
      const r = 10 - q.gather * 6;
      ember(ctx, a, cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.7, 0.8, q.gather);
    }
  }
  if ((q.huff ?? -1) >= 0 && q.huff < 1.0) {
    const s = q.huff;
    const [mx, my] = headAt(a, D, [16, 9]);
    for (let i = 0; i < 9; i++) {
      const u = clamp((s - i * 0.035) / 0.7, 0, 1);
      if (u <= 0) continue;
      const spread = ((i % 3) - 1) * 0.35;
      const d = sstep(u) * 30;
      ember(ctx, a, mx + d * Math.cos(spread), my + d * Math.sin(spread) + u * 6, 1.0 + (i % 2) * 0.4, 1 - sstep((u - 0.6) / 0.4));
    }
    // a soft heat shimmer: two warm arcs rolling out
    for (let i = 0; i < 2; i++) {
      const u = clamp((s - i * 0.12) / 0.6, 0, 1);
      if (u <= 0 || u >= 1) continue;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.7;
      ctx.lineCap = 'round';
      for (const [col, w] of [[CORE[2], 2.2], [CORE[0], 0.9]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.arc(mx, my + 2, 4 + u * 22, -0.5, 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  // hurt: a little flicker of embers off its belly
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    for (let i = 0; i < 3; i++) ember(ctx, a, cx + (i - 1) * 4 * (1 + e), cy - 2 - e * 8 - (i % 2) * 2, 0.7, 1 - e);
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-18, -8]);
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
  id: 'geodebear',
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    // (its tail and the crystals on its back, behind its body)
    torso: (ctx, a, mode, S, D) => tailStub(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      geode(ctx, a, mode, D);
      crystals(ctx, a, mode, D, a.gb?.missing ?? -1);
      scarfWrap(ctx, a, mode, D);
    },
    handFskin: (ctx, a, mode, S, D) => claws(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => toes(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => toes(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      scarfEnds(ctx, a, mode, D);
    },
    handNskin: (ctx, a, mode, S, D) => claws(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('bear', DRESS);
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
export const GEODE_BEAR_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GEODE_BEAR_SIZE = { w: 40, h: Math.round(R.H * BIG * 1.02), speed: Math.round(R.speed * BIG) };
