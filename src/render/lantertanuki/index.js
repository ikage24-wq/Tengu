// The Lantern Tanuki (2026-11-26, rebuilt from scratch on the creature base as its own character; the id
// stays `lantertanuki`). The Tea Terraces' night watchman: a big-bellied old-style tanuki like the
// clay ones by tea-house doors, a wide straw hat on his head, an indigo happi coat worn open over his
// round belly and indigo work trousers, who walks the Mist Hollow at night with a paper lantern on a
// bamboo pole. He keeps the hollow lit, drums his belly to keep himself awake, and nods off anyway.
// On his own copy of the creature base (rig.js; body.js `lantern`): the base's own skin is his coat and
// trousers (indigo, so they fit and fold with every pose); over it, cut from the body's own outline,
// the open front of the coat, his belly, the collar and the hem; his head, hat, paws, feet, tail, pole
// and lantern drawn here from scratch (never the shared face).
//   look    cool grey-brown fur, the tanuki's dark mask in two drooping patches, a cream muzzle and
//           cheeks, pale brow spots for brows (a real tanuki's); his own eyes ("firefly eyes": tall
//           and round, a gold-green iris lit from below like a lantern, a big round glint and a little
//           warm one, a soft upper lash with two flicks, a soft lower lid); the straw kasa hat; the
//           happi with its pale collar and a wave-pattern hem, a red cord tied under his belly; dark
//           fur paws and feet; the striped tail on springs; the red paper lantern on its pole, swinging,
//           its candle flickering. His own soft slate outline, outer edge only, face bare.
//   walk    a slow round-bellied waddle at his own pace, the lantern swinging behind each step.
//   idle    a 29 s act in four pieces, each the next one that fits the time he has (data `rest`):
//           - lamplight (7.6 s): he lifts the lantern high and peers into the mist, this way and that;
//             little firefly lights drift in round it; a soft smile;
//           - drum (7.0 s): pon-poko: he drums his belly with his free paw, eyes shut, swaying, notes
//             and soft rings off his belly; a last big PON;
//           - dango (7.2 s): a skewer of three dango out of his coat, eaten one by one, cheeks full,
//             bliss;
//           - doze (7.4 s): leaning on his pole he nods off, the lantern dimming, z's; a firefly light
//             lands on his nose and he wakes with a start, sheepish.
//   moves   Lantern Swing (the pole wound back over his shoulder; then swung round at you, the lantern
//           trailing a ribbon of warm light); Foxfire (the lantern raised, its flame swelling; then
//           three soft blue-green foxfire flames float out of it at you); Belly Drum (a deep breath,
//           belly out; then PON! a slap on his belly sends warm rings rolling out along the ground).
//   else    hurt: a squeeze, the hat jumping, the lantern swinging wildly; after landing a hit: the
//           lantern raised, a cheeky grin; hunting you: brows down, lantern up; low on health:
//           worried, sweat, the candle guttering; a nap (habitat): the doze held, z's; beaten: dizzy.
//           His marks over his head are his own (`ownEmotes`).
// Every effect is drawn here, live, in his own soft style: lantern light as warm soft halos, firefly
// lights as little glowing dots, foxfire as rounded teal flames with white hearts, rings as soft
// lantern-orange arcs, notes his own, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, sweat, dizzy } from './fx.js';

const BIG = 1.34;
const LW = 1.6 / BIG;
const INK = '#4a4660';
const FUR = ['#f0e8e0', '#b4a294', '#8c7a6e', '#5e5048'];
const PAW = ['#7a6a62', '#5a4c46', '#463a36', '#342a28'];
const MASK = '#4a3c38';
const CREAM = ['#fffaf2', '#f4e8da', '#dccbb8'];
const COAT = ['#7a88c0', '#4c5a94', '#38447a', '#2a3460'];
const COLLAR = ['#f4f2ec', '#dcd8d0'];
const CORD = ['#ff9a7a', '#e0563e', '#a83a2e'];
const STRAW = ['#fff4cc', '#ecd08a', '#c9a45a', '#8e6c36'];
const LAMP = ['#fff2c0', '#ff9a5a', '#e2533e', '#a8322a'];
const LAMP_CAP = '#3a3036';
const BAMBOO = ['#e8dca0', '#bca868', '#8a7844'];
const FOX = ['#ffffff', '#c8fff0', '#6adcc8', '#2e9e9a'];
const FLY = ['#fffbd0', '#f4ee80', '#c8d860'];
const LASH = '#2e2830';
// (shut, his eyes are pale lines on the dark of his mask, so they read)
const SHUT_LINE = '#f6ece2';
const IRIS = ['#3a3a16', '#8a9a2e', '#d8d860', '#fff6b0'];
const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
const sm5 = (v0) => {
  const v = clamp(v0, 0, 1);
  return v * v * v * (v * (v * 6 - 15) + 10);
};
const paint = (ctx, a, mode, col, ink = INK, w = LW) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
const SOFTN = ['tail0', 'tail1'];
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
const headK = ([u, v], n = [80.9, 87.3]) => [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS];
const headAt = (a, D, uv) => ptOf(a, D, 'head', headK(uv, D.J.neck));
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(HO[0], HO[1]);
}

// ---------- His loose pieces ----------
const TAIL = [[66, 120], [55, 119], [45, 114]];
const JOINTS = { tail0: TAIL[0], tail1: TAIL[1] };
const SOFTS = [
  { name: 'tail0', parent: 'torso', pivot: 'tail0', rot: (S, a) => a.lt?.tail0 ?? 0, soft: { k: 80, c: 7, gain: 0.4, turn: 0.7, max: 12, dir: [-10, 0] } },
  { name: 'tail1', parent: 'tail0', pivot: 'tail1', rot: (S, a) => a.lt?.tail1 ?? 0, soft: { k: 60, c: 5.6, gain: 0.5, turn: 0.85, max: 20, flutter: 3, hz: 0.5, dir: [-8, -4] } },
];

// ---------- His face ----------
const FACES = {
  calm: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'calm' },
  soft: { e: 'open', g: [0.6, -0.4], b: [-0.6, -0.4], m: 'smile' },
  look: { e: 'open', g: [1.6, -0.6], b: [-0.6, -0.8], m: 'calm' },
  lookB: { e: 'open', g: [-1.6, -0.4], b: [-0.6, -0.8], m: 'calm' },
  grin: { e: 'open', g: [0.9, 0.2], b: [-0.6, -0.6], m: 'grin' },
  happy: { e: 'happy', b: [-0.8, -0.9], m: 'open' },
  bliss: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  chew: { e: 'happy', b: [-0.4, -0.6], m: 'chew' },
  drum: { e: 'happy', b: [-0.6, -0.8], m: 'o' },
  sleepy: { e: 'sleep', b: [0.6, 0.6], m: 'calm' },
  startle: { e: 'wide', g: [0.2, -0.6], b: [-2, -2.2], m: 'o' },
  sheepish: { e: 'happy', b: [1.2, -1.4], m: 'wobble' },
  focus: { e: 'open', g: [1.4, 0.4], b: [-0.4, 1.4], m: 'set' },
  fierce: { e: 'open', g: [1.4, 0.4], b: [-1, 2.2], m: 'set' },
  puff: { e: 'open', g: [1.2, -0.2], b: [-0.6, 1.2], m: 'puff' },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  worried: { e: 'open', g: [0.4, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'bliss', 'chew', 'drum', 'sleepy', 'sheepish', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);
function curve3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// His firefly eyes: tall and round, the iris lit from below like a lantern.
function eye(ctx, a, x, y, o, f) {
  const w = 4.3;
  const h = 5.3;
  const kind = f.e;
  if (kind === 'happy') {
    curve3(ctx, a, [x - w, y + 1.4], [x, y - h * 1.05], [x + w, y + 1.4], 1.5, SHUT_LINE);
    return;
  }
  if (kind === 'squeeze') {
    curve3(ctx, a, [x - w * o, y - 1.8], [x + w * 0.2 * o, y - 0.2], [x + w * o, y + 0.4], 1.5, SHUT_LINE);
    curve3(ctx, a, [x - w * o, y + 2.2], [x + w * 0.1 * o, y + 1.2], [x + w * o, y + 0.5], 1.3, SHUT_LINE);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    curve3(ctx, a, [x - w, y + 0.6], [x, y + (kind === 'sleep' ? 3.6 : 3)], [x + w, y + 0.6], 1.5, SHUT_LINE);
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
  const [gx, gy] = f.g ?? [0.5, 0.3];
  const ix = x + gx * 0.9;
  const iy = y + gy + 0.4;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = w * 0.8 * ir;
  const ih = h * 0.82 * ir;
  ctx.save();
  ell(ctx, x, y, w * big, h * big);
  ctx.clip();
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.3, iw * 0.86, ih * 0.86);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  // lit from below, like a lantern
  ell(ctx, ix, iy + ih * 0.42, iw * 0.66, ih * 0.42);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.55, iw * 0.4, ih * 0.22);
  ctx.fillStyle = tone(a, IRIS[3], 0.85);
  ctx.fill();
  ell(ctx, ix, iy - 0.2, iw * 0.4 * ir, ih * 0.44 * ir);
  ctx.fillStyle = tone(a, '#1e1a12');
  ctx.fill();
  ctx.restore();
  // a big round glint up high and a little warm one low on the other side
  ell(ctx, ix - 1.3, iy - 1.9, 1.35 * ir, 1.3 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + 1.4, iy + 1.5, 0.6 * ir, 0.55 * ir);
  ctx.fillStyle = 'rgba(255,248,210,0.95)';
  ctx.fill();
  // the soft upper lash, two little flicks off its outer corner
  ctx.beginPath();
  ctx.moveTo(x - w * 0.98, y - h * 0.22);
  ctx.quadraticCurveTo(x, y - h * 1.26, x + w * 0.98, y - h * 0.22);
  pen(ctx, tone(a, LASH), 1.4);
  ctx.stroke();
  const ox = x + o * w * 0.96;
  curve3(ctx, a, [ox, y - h * 0.3], [ox + o * 0.8, y - h * 0.42], [ox + o * 1.6, y - h * 0.7], 0.85, LASH);
  curve3(ctx, a, [ox - o * 0.6, y - h * 0.62], [ox + o * 0.1, y - h * 0.86], [ox + o * 0.7, y - h * 1.12], 0.75, LASH);
  // the soft lower lid
  curve3(ctx, a, [x - w * 0.55 * o, y + h * 0.96], [x + w * 0.15 * o, y + h * 1.08], [x + w * 0.78 * o, y + h * 0.72], 0.55, '#a8968e');
}
// His brows are the pale spots a real tanuki has over its eyes: they lift, drop and tilt.
function browSpot(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  const tilt = (bi - bo) * 0.14 * o;
  ell(ctx, x, y + (bo + bi) * 0.45, 2.8, 1.5, tilt);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ell(ctx, x - 0.4, y - 0.3 + (bo + bi) * 0.45, 1.6, 0.8, tilt);
  ctx.fillStyle = tone(a, CREAM[0]);
  ctx.fill();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#5e3a3a';
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
      stroke([[x - 2.6, y - 0.4], [x, y + 2], [x + 2.8, y - 0.6]]);
      ell(ctx, x + 0.2, y + 0.9, 1.3, 0.7);
      ctx.fillStyle = tone(a, '#7a2e36');
      ctx.fill();
      break;
    case 'smile':
      stroke([[x - 2.2, y - 0.2], [x, y + 1.5], [x + 2.4, y - 0.4]]);
      break;
    case 'chew':
      stroke([[x - 1.6, y + 0.2], [x, y + 1.1], [x + 1.6, y + 0.2]]);
      break;
    case 'open':
      open(2.4, 2.4);
      break;
    case 'o':
      ell(ctx, x + 0.4, y + 0.7, 1.1, 1.3);
      ctx.fillStyle = tone(a, '#7a2e36');
      ctx.fill();
      break;
    case 'puff':
      ell(ctx, x + 0.4, y + 0.6, 0.8, 0.6);
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
      ell(ctx, x + 0.3, y + 0.5, 0.8, 0.6);
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
      // his resting mouth: a little 'w' under the nose
      stroke([[x - 2.1, y - 0.1], [x - 1.05, y + 1.0], [x, y + 0.1], [x + 1.05, y + 1.0], [x + 2.1, y - 0.1]], 0.75);
  }
}
// The skull: round, fluffy cheek ruffs low on each side (rounded bumps, never points).
const SKULL = [[-20, -5], [-17, -12.6], [-10, -17.4], [0, -19], [9, -18], [16, -13.6], [20, -6], [22.4, 1], [24, 6], [21.6, 9.4], [22.2, 12.6], [16.6, 15.4], [8, 17.2], [0, 17.6], [-8, 16.8], [-14, 14], [-19.4, 15], [-21, 10.4], [-22.4, 3.6]];
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, 0, r, r * 0.9);
  paint(ctx, a, mode, MASK);
  if (mode === 'fill') {
    ell(ctx, 0.3, 0.9, r * 0.56, r * 0.48);
    ctx.fillStyle = tone(a, FUR[2]);
    ctx.fill();
  }
  ctx.restore();
}
// A drooping mask patch round an eye (under the eye, never over it), its tail toward the cheek.
function maskPatch(ctx, a, x, y, o) {
  smooth(ctx, [[x - 6 * o, y - 2.4], [x - 2.6 * o, y - 5.6], [x + 2.8 * o, y - 5.6], [x + 6.2 * o, y - 2], [x + 6.4 * o, y + 3.6], [x + 4.4 * o, y + 8.6], [x + 1 * o, y + 9.2], [x - 2.4 * o, y + 6.4], [x - 5.8 * o, y + 3.2]]);
  ctx.fillStyle = tone(a, MASK);
  ctx.fill();
}
function head(ctx, a, mode, D) {
  const q = a.lt ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -14, -14, 5.6, -0.4);
  ear(ctx, a, mode, 12.4, -15.4, 5.8, 0.34);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -11, 15, FUR[0], 0.8);
    glow(ctx, -18, 9, 9, FUR[2], 0.55);
    // the pale cheek ruffs, then the mask over them, the near patch tailing outward
    ell(ctx, -15, 10, 7, 5.6, 0.2);
    ctx.fillStyle = tone(a, CREAM[2]);
    ctx.fill();
    ell(ctx, 19, 9, 6.4, 5.4, -0.2);
    ctx.fill();
    maskPatch(ctx, a, -6, 0.2, -1);
    maskPatch(ctx, a, 9.6, -0.2, 1);
    // the pale stripe down between his eyes
    smooth(ctx, [[1, -12], [3.8, -12], [4.6, -3.4], [2.4, 0], [0.2, -3.4]]);
    ctx.fillStyle = tone(a, CREAM[2]);
    ctx.fill();
    ctx.restore();
    eye(ctx, a, -5.8, -0.2, -1, f);
    eye(ctx, a, 9.6, -0.6, 1, f);
    browSpot(ctx, a, -6, -8.6, -1, f.b);
    browSpot(ctx, a, 9.8, -9, 1, f.b);
    // the muzzle: a soft round cream snout, his round nose, a 'w' of a mouth
    smooth(ctx, [[1.4, 7.6], [4, 4.6], [8.6, 3.6], [14, 4.4], [17.2, 7.6], [15.8, 11.8], [10, 13.8], [4.4, 12.6]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 8.4, 6.4, 5, CREAM[0], 0.9);
    ell(ctx, 13.2, 5.4, 2.6, 2);
    ctx.fillStyle = tone(a, '#2e2628');
    ctx.fill();
    ell(ctx, 12.4, 4.6, 0.9, 0.55, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 12, 9.6, f.m);
    if ((q.cheek ?? 0) > 0.02) {
      // cheeks full of dango
      ctx.save();
      ctx.globalAlpha *= q.cheek;
      ell(ctx, 16.6, 9.6, 4.6, 3.8);
      ctx.fillStyle = tone(a, CREAM[1]);
      ctx.fill();
      ctx.restore();
    }
    ell(ctx, -13, 6.4, 2.6, 1.4);
    ctx.fillStyle = 'rgba(255,150,150,0.22)';
    ctx.fill();
  }
  ctx.restore();
}
// His straw kasa hat: a wide shallow cone, its weave, sitting low over his ears (head units).
const HAT = [[-26, -13.6], [-22.6, -16.8], [-14, -18.6], [-7, -24.4], [2, -28.2], [11, -24.8], [18, -18.8], [26.4, -17.2], [29.4, -14.4], [26.4, -11.6], [14, -10.6], [2, -10.6], [-10, -11], [-21, -11.8]];
function hat(ctx, a, mode, D) {
  const q = a.lt ?? {};
  ctx.save();
  headFrame(ctx, a, D);
  ctx.translate(2, -14 - (q.hatPop ?? 0) * 3);
  ctx.rotate((q.hatTilt ?? 0) - 0.04);
  ctx.translate(-2, 14);
  smooth(ctx, HAT);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, STRAW[3]);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, STRAW[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -4, -22, 12, STRAW[0], 0.9);
  glow(ctx, 22, -13, 9, STRAW[2], 0.6);
  // the weave: soft lines from the tip down to the brim, and a ring round the crown
  pen(ctx, tone(a, STRAW[2], 0.7), 0.5);
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(2, -28);
    ctx.quadraticCurveTo(2 + i * 2.6, -20, 2 + i * 5.2, -10);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-17, -17.4);
  ctx.quadraticCurveTo(2, -14.4, 20, -17.6);
  pen(ctx, tone(a, STRAW[2]), 0.9);
  ctx.stroke();
  // the brim's underside, a shade in under its front edge
  ctx.beginPath();
  ctx.moveTo(-24, -12.4);
  ctx.quadraticCurveTo(2, -9.4, 28, -13.2);
  pen(ctx, tone(a, STRAW[3], 0.55), 1.2);
  ctx.stroke();
  ctx.restore();
  ell(ctx, 2, -28.2, 1.8, 1.2);
  ctx.fillStyle = tone(a, STRAW[2]);
  ctx.fill();
  ctx.restore();
}

// ---------- His clothes (the base's skin is his coat and trousers) ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
const chain = (pts) => {
  // a soft closed curve through rig-space points
  const n = pts.length;
  return (ctx) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const nx = pts[(i + 1) % n];
      const m = [(p[0] + nx[0]) / 2, (p[1] + nx[1]) / 2];
      if (!i) ctx.moveTo(m[0], m[1]);
      else ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    const p = pts[0];
    const m0 = [(pts[n - 1][0] + p[0]) / 2, (pts[n - 1][1] + p[1]) / 2];
    ctx.quadraticCurveTo(pts[n - 1][0], pts[n - 1][1], m0[0], m0[1]);
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + pts[1][0]) / 2, (p[1] + pts[1][1]) / 2);
    ctx.closePath();
  };
};
function coat(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  // the coat's hem: a band with a wave pattern round his hips, and the trousers below it
  const hem = [T([50, 122]), T([110, 122]), T([110, 127.6]), T([50, 127.6])];
  ctx.beginPath();
  hem.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.fillStyle = tone(a, COAT[2]);
  ctx.fill();
  pen(ctx, tone(a, COLLAR[1], 0.8), 0.35);
  for (let i = 0; i < 9; i++) {
    const [px, py] = T([58 + i * 5, 127.4]);
    ctx.beginPath();
    ctx.arc(px, py, 1.1, Math.PI, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 0.6, Math.PI, TAU);
    ctx.stroke();
  }
  // his belly in the coat's open front: big and round, the cream of it, lit from the lantern side
  const belly = chain([C([80, 96]), C([89, 95]), W([97.4, 106]), W([100, 115]), T([97, 123.4]), T([88, 126.8]), T([79, 125.4]), W([74.6, 116]), W([75, 106]), C([76, 99])]);
  belly(ctx);
  ctx.fillStyle = tone(a, CREAM[1]);
  ctx.fill();
  ctx.save();
  belly(ctx);
  ctx.clip();
  const g0 = W([90, 108]);
  glow(ctx, g0[0], g0[1], 6, CREAM[0], 0.95);
  const g1 = T([80, 125]);
  glow(ctx, g1[0], g1[1], 5, CREAM[2], 0.8);
  // the belly button
  const nb = W([88.4, 117]);
  ell(ctx, nb[0], nb[1], 0.45, 0.32);
  ctx.fillStyle = tone(a, CREAM[2]);
  ctx.fill();
  ctx.restore();
  // the collar bands down each edge of the open front, pale, standing off the belly
  for (const pts of [[C([78.6, 88.6]), C([74.6, 96]), W([72, 106]), W([71.6, 116]), T([74.6, 124])], [C([84.6, 88.6]), C([92.6, 94.4]), W([100.4, 104]), W([103, 114]), T([100.4, 124])]]) {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(...pts[i], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    ctx.lineTo(...pts[pts.length - 1]);
    pen(ctx, tone(a, COLLAR[1]), 2.2 * D.SC * 2.6);
    ctx.stroke();
    pen(ctx, tone(a, COLLAR[0]), 1.2 * D.SC * 2.6);
    ctx.stroke();
  }
  // the red cord tied under his belly, its bow on the near hip
  const cord = [T([62, 121]), W([80, 127.4]), T([98, 122])];
  ctx.beginPath();
  ctx.moveTo(...cord[0]);
  ctx.quadraticCurveTo(...cord[1], ...cord[2]);
  pen(ctx, tone(a, CORD[2]), 1.1);
  ctx.stroke();
  pen(ctx, tone(a, CORD[1]), 0.6);
  ctx.stroke();
  ctx.restore();
  // (the bow, outside the clip so its loops sit over the edge of him)
  const [bx, by] = T([98.6, 122]);
  for (const s of [-1, 1]) {
    ell(ctx, bx + s * 1.1, by - 0.2, 1.2, 0.75, s * 0.4);
    ctx.fillStyle = tone(a, CORD[1]);
    ctx.fill();
  }
  ell(ctx, bx, by, 0.55, 0.55);
  ctx.fillStyle = tone(a, CORD[2]);
  ctx.fill();
}
// A wide sleeve cuff at the wrist (in the forearm's frame) and the fur paw out of it.
function cuff(ctx, a, mode, D, k) {
  const bone = `arm${k}f`;
  ctx.save();
  D.frame(ctx, a, bone);
  const e = D.loc(`el${k}`, bone);
  const w = D.loc(`wr${k}`, bone);
  const an = Math.atan2(w[1] - e[1], w[0] - e[0]);
  ctx.translate(mix(e[0], w[0], 0.82), mix(e[1], w[1], 0.82));
  ctx.rotate(an - Math.PI / 2);
  // its bell opening: wider than the arm, a pale band round it
  ctx.beginPath();
  ctx.moveTo(-2.4, -1.6);
  ctx.quadraticCurveTo(-3.4, 1.2, -3, 1.9);
  ctx.quadraticCurveTo(0, 2.9, 3, 1.9);
  ctx.quadraticCurveTo(3.4, 1.2, 2.4, -1.6);
  ctx.closePath();
  if (mode === 'line') paint(ctx, a, 'line');
  else {
    ctx.fillStyle = tone(a, COAT[1]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3, 1.3);
    ctx.quadraticCurveTo(0, 2.3, 3, 1.3);
    pen(ctx, tone(a, COLLAR[0]), 0.7);
    ctx.stroke();
  }
  ctx.restore();
}
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const h = D.J[`hand${k}`];
  ell(ctx, h[0], h[1] + 0.6, 6.2, 6.4);
  if (mode === 'line') paint(ctx, a, 'line');
  else {
    ctx.fillStyle = tone(a, PAW[1]);
    ctx.fill();
    glow(ctx, h[0] - 1.4, h[1] - 1.6, 4.4, PAW[0], 0.8);
  }
  ctx.restore();
}
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const an = D.J[`ank${k}`];
  smooth(ctx, [[an[0] - 6.4, an[1] - 2], [an[0] - 3, an[1] - 4.4], [an[0] + 4, an[1] - 3.4], [an[0] + 10.6, an[1] + 0.6], [an[0] + 11.2, an[1] + 4.6], [an[0] + 4, an[1] + 6], [an[0] - 5.4, an[1] + 5.4], [an[0] - 7.4, an[1] + 2]]);
  if (mode === 'line') paint(ctx, a, 'line');
  else {
    ctx.fillStyle = tone(a, PAW[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, an[0] + 2, an[1] - 1.6, 6, PAW[0], 0.7);
    ctx.restore();
    // a trouser hem at the ankle
    ctx.beginPath();
    ctx.moveTo(an[0] - 6, an[1] - 2.6);
    ctx.quadraticCurveTo(an[0] - 1, an[1] - 4.6, an[0] + 4.6, an[1] - 3);
    pen(ctx, tone(a, COAT[2]), 1.6);
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
    const w0 = i === 0 ? 7 : 7.8;
    const w1 = i === 0 ? 7.8 : 5.4;
    smooth(ctx, [[-2, -w0], [L * 0.5, -w1 - 1], [L + w1 * 0.8, -w1 * 0.4], [L + w1 * 0.8, w1 * 0.4], [L * 0.5, w1 + 1], [-2, w0]]);
    if (mode === 'line') paint(ctx, a, 'line');
    else {
      ctx.fillStyle = tone(a, FUR[1]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = tone(a, MASK);
      ctx.fillRect(L * 0.4, -11, 3.6, 22);
      if (i === 1) {
        ell(ctx, L + 2.4, 0, 5.4, 6.4);
        ctx.fill();
      }
      glow(ctx, L * 0.3, -w0 * 0.5, w0, FUR[0], 0.6);
      ctx.restore();
    }
    ctx.restore();
  }
}

// ---------- His pole and lantern (rig space, game px) ----------
const POLE = 23;
const poleEnds = (a, D) => {
  const q = a.lt ?? {};
  const [hx, hy] = ptOf(a, D, 'handF', D.J.handF);
  const an = q.pole ?? 1.0;
  const dx = Math.sin(an);
  const dy = -Math.cos(an);
  return { h: [hx, hy], b: [hx - dx * 3, hy - dy * 3], t: [hx + dx * POLE, hy + dy * POLE] };
};
// where the lantern hangs: below the tip, swung by its swing
const lampAt = (a, D) => {
  const { t } = poleEnds(a, D);
  const sw = a.lt?.swing ?? 0;
  return { t, c: [t[0] - Math.sin(sw) * 7.6, t[1] + Math.cos(sw) * 7.6], sw };
};
function lanternBody(ctx, a, mode, cx, cy, sw, lit) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(sw);
  // the paper: a round chochin, ribbed, with dark caps top and bottom
  smooth(ctx, [[-3.2, -4.6], [0, -5.1], [3.2, -4.6], [4.5, -2], [4.6, 1], [3.6, 4], [0, 4.8], [-3.6, 4], [-4.6, 1], [-4.5, -2]]);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, LAMP[3]);
  } else {
    ctx.fillStyle = tone(a, LAMP[2]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // lit from inside: a warm heart, brighter as the flame grows
    glow(ctx, 0, 0.4, 4.6, LAMP[0], 0.55 + lit * 0.4);
    glow(ctx, 0, 0.6, 3, '#ffffff', 0.25 + lit * 0.35);
    pen(ctx, tone(a, LAMP[3], 0.45), 0.35);
    for (const y of [-3, -1.5, 0, 1.5, 3]) {
      ctx.beginPath();
      ctx.moveTo(-5, y);
      ctx.quadraticCurveTo(0, y + 0.6, 5, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const [y, w] of [[-5.2, 2.6], [4.9, 2.8]]) {
    ctx.beginPath();
    ctx.moveTo(-w, y - 0.9);
    ctx.lineTo(w, y - 0.9);
    ctx.quadraticCurveTo(w + 0.5, y, w, y + 0.9);
    ctx.lineTo(-w, y + 0.9);
    ctx.quadraticCurveTo(-w - 0.5, y, -w, y - 0.9);
    ctx.closePath();
    if (mode === 'line') paint(ctx, a, 'line', null, LAMP_CAP, LW * 0.9);
    else {
      ctx.fillStyle = tone(a, LAMP_CAP);
      ctx.fill();
    }
  }
  ctx.restore();
}
function poleLantern(ctx, a, mode, D) {
  const q = a.lt ?? {};
  const { b, t } = poleEnds(a, D);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...b);
  ctx.lineTo(...t);
  if (mode === 'line') {
    pen(ctx, BAMBOO[2], 1.6 + LW);
    ctx.stroke();
  } else {
    pen(ctx, tone(a, BAMBOO[1]), 1.6);
    ctx.stroke();
    // its nodes and a light down it
    for (const u of [0.3, 0.62, 0.9]) {
      const x = mix(b[0], t[0], u);
      const y = mix(b[1], t[1], u);
      ell(ctx, x, y, 0.95, 0.95);
      ctx.fillStyle = tone(a, BAMBOO[2]);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(mix(b[0], t[0], 0.1) - 0.3, mix(b[1], t[1], 0.1) - 0.2);
    ctx.lineTo(mix(b[0], t[0], 0.95) - 0.3, mix(b[1], t[1], 0.95) - 0.2);
    pen(ctx, tone(a, BAMBOO[0], 0.8), 0.5);
    ctx.stroke();
  }
  // the cord to the lantern, the lantern
  const L = lampAt(a, D);
  ctx.beginPath();
  ctx.moveTo(...t);
  ctx.lineTo(L.c[0] + Math.sin(L.sw) * 5.4, L.c[1] - Math.cos(L.sw) * 5.4);
  pen(ctx, mode === 'line' ? LAMP_CAP : tone(a, '#6a5a52'), mode === 'line' ? 1.2 : 0.5);
  ctx.stroke();
  ctx.restore();
  lanternBody(ctx, a, mode, L.c[0], L.c[1], L.sw, q.lamp ?? 0.6);
}

// ---------- His act and fight ----------
const PIECES = { lamplight: 7.6, drum: 7.0, dango: 7.2, doze: 7.4 };
const ORDER = ['lamplight', 'drum', 'dango', 'doze'];
const POOL = ['swing', 'foxfire', 'drum'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tail0: 0, tail1: 0, pole: 1.0, swing: 0, lamp: 0.6, hatPop: 0, hatTilt: 0, cheek: 0, dango: -1, dangoK: 0, bite: 0, flies: 0, drumHit: -1, pon: -1, zz: 0, nose: -1, sweat: -1, trail: null, fox: -1, foxGrow: 0, rings: -1 };
  a.lt = q;
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
  // at rest: the lantern held out in front in his far paw, the near paw resting on his belly
  go({ shF: -58, elF: -40, hwF: 10, shN: -4 + br * 1.5, elN: -58, hwN: 14, tilt: -2 + walking * 2, chest: -2, head: -1 }, 1);
  const u = a.blkidU ?? a.wp ?? 0;
  q.tail0 = 0.2 + Math.sin(t * 0.9) * 0.08 + Math.sin(u) * 0.1 * walking;
  q.tail1 = 0.5 + Math.sin(t * 0.9 - 0.7) * 0.12;
  // the lantern swinging gently, a little behind each step on the walk
  q.swing = Math.sin(t * 1.2 + (m.uid ?? 0)) * 0.06 + Math.sin(u - 0.9) * 0.16 * walking;
  q.lamp = 0.6 + Math.sin(t * 2.3) * 0.05 + Math.sin(t * 3.7 + 1) * 0.04;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.ltWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.5;
  if ((wind > 0 || striking) && alive) {
    if (!st.ltAtk) {
      const pool = m.def.moves ?? POOL;
      st.ltN = (st.ltN ?? m.uid ?? 0) + 1;
      st.ltMove = m.move ?? pool[st.ltN % pool.length];
    }
    st.ltAtk = true;
  } else st.ltAtk = false;
  const mvName = st.ltAtk ? st.ltMove : null;
  const hadWind = now - (st.ltWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.ltCalm = mix(st.ltCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.ltCalm);
  let PC = st.ltPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.ltOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.ltOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.ltOrd = (st.ltOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.ltPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let doze = 0;

  if (k > 0.001 && piece === 'lamplight') {
    // the lantern lifted high, peering into the mist one way, then the other
    const lift = win(pu, 0.2, 0.9, 6.4, 7.2);
    go({ shF: -130, elF: -30, tilt: -6, head: -8 }, lift * k);
    q.pole = mix(q.pole, 0.78, lift * k);
    q.lamp += 0.25 * lift * k;
    const side = win(pu, 3.0, 3.5, 4.6, 5.1);
    add({ head: 10 * side, turnC: -0.3 * side }, k);
    say('look', win(pu, 0.8, 1.0, 3.0, 3.2) * k);
    say('lookB', side * k);
    q.flies = win(pu, 1.4, 2.6, 6.6, 7.4) * k;
    say('soft', win(pu, 5.1, 5.3, 7.0, 7.4) * k);
  }
  if (k > 0.001 && piece === 'drum') {
    // pon-poko: his near paw drumming his belly, eyes shut, swaying
    const on = win(pu, 0.3, 0.7, 5.6, 6.0);
    go({ shN: 8, elN: -96, hwN: 20, tilt: -6, chest: -6, head: -4 }, on * k);
    const beat = pu * 2.6;
    const hitU = beat % 1;
    const tap = Math.exp(-hitU * 6) * on;
    add({ elN: 18 * (1 - tap) * on - 10, hwN: -10 * tap }, k);
    add({ tilt: Math.sin(beat * Math.PI) * 3 * on, head: Math.sin(beat * Math.PI - 0.5) * 3 * on }, k);
    if (on > 0.5) q.drumHit = hitU / 2.6;
    say('drum', on * k);
    // the last big PON, a happy grin
    const big = win(pu, 5.9, 6.0, 6.3, 6.8);
    go({ shN: 30, elN: -60, tilt: -10, chest: -8 }, win(pu, 5.4, 5.8, 5.9, 6.0) * k);
    go({ shN: 4, elN: -100 }, big * k);
    if (pu > 6.0 && pu < 6.9) q.pon = pu - 6.0;
    say('happy', win(pu, 5.95, 6.0, 6.8, 7.0) * k);
  }
  if (k > 0.001 && piece === 'dango') {
    // three dango on a skewer: out of his coat, eaten one by one
    const hold = win(pu, 0.3, 0.8, 6.6, 7.1);
    go({ shN: -40, elN: -80, hwN: -10 }, hold * k);
    let eaten = 0;
    for (let i = 0; i < 3; i++) {
      const t0 = 1.4 + i * 1.6;
      const bite = win(pu, t0, t0 + 0.45, t0 + 0.7, t0 + 1.15);
      go({ shN: -86, elN: -122, head: 6 }, bite * k);
      q.bite = Math.max(q.bite, bite * k);
      eaten += sstep((pu - (t0 + 0.54)) / 0.14);
      const ch = win(pu, t0 + 0.5, t0 + 0.6, t0 + 1.3, t0 + 1.55);
      q.cheek = Math.max(q.cheek, ch * k);
      add({ head: Math.sin(pu * 16) * 1.2 * ch }, k);
      say('chew', ch * k);
    }
    q.dango = hold * k > 0.02 ? eaten : -1;
    if (hold * k > 0.02) q.dangoK = hold * k;
    say('bliss', win(pu, 6.3, 6.5, 7.0, 7.2) * k);
  }
  if (k > 0.001 && piece === 'doze') {
    // he leans on his pole and nods off; the lantern dims; a firefly lands on his nose
    doze = win(pu, 0.4, 1.6, 4.85, 5.0) * k;
    if (pu > 4.0 && pu < 5.2) q.nose = pu - 4.0;
    const start = pu > 5.0 ? clamp(boing(pu - 5.0, 9, 16), 0, 1.15) * (1 - sstep((pu - 5.7) / 0.5)) : 0;
    add({ hop: 0.07 * start, tilt: -6 * start }, k);
    q.hatPop = Math.max(q.hatPop, start);
    say('startle', win(pu, 5.0, 5.05, 5.5, 5.7) * k);
    const shy = win(pu, 5.7, 5.9, 7.0, 7.4);
    go({ shN: -110, elN: -120, head: 8 }, shy * k);
    say('sheepish', shy * k);
  }

  if (fighting && alive && !st.ltHunt) st.ltBangAt = now;
  if (!fighting && st.ltHunt && alive) st.ltLostAt = now;
  st.ltHunt = fighting && alive;
  q.bang = now - (st.ltBangAt ?? -9);
  q.huh = now - (st.ltLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  if (fighting && alive && !hurt) {
    go({ tilt: 4, head: 4, shF: -96, elF: -30, shN: -50, elN: -80 }, 1);
    q.pole = 0.86;
    q.lamp += 0.15;
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
    q.lamp -= 0.25 + Math.sin(t * 9) * 0.08;
  }
  // ----- His moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.5) / 0.5) : 0;
    const snapT = mvName === 'swing' ? 0.26 : 0.2;
    const snap = s >= 0 ? sm5(s / (hadWind ? snapT : snapT + 0.06)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'swing') {
      // wound back over his shoulder; then swung round at you
      go({ shF: 20, elF: -110, tilt: -10, head: -6, chest: -6 }, wu);
      q.pole = mix(q.pole, -0.9, wu);
      say('focus', W);
      go({ shF: -96, elF: -10, tilt: 12, head: 6, x: 0.03 }, snap * sw);
      q.pole = mix(q.pole, 2.0, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 0.7) q.trail = s;
    } else if (mvName === 'foxfire') {
      // the lantern raised, its flame swelling; three foxfire flames out of it at you
      go({ shF: -122, elF: -20, tilt: -8, head: -6, shN: -70, elN: -60 }, wu);
      q.pole = mix(q.pole, 0.92, wu);
      q.foxGrow = Math.max(q.foxGrow, wu);
      q.lamp += 0.6 * wu;
      say('puff', W);
      go({ shF: -100, elF: -20, tilt: 8, head: 4, shN: -90, elN: -10 }, snap * sw);
      q.pole = mix(q.pole, 1.1, snap * sw);
      say('grin', snap * sw);
      if (s >= 0 && s < 1.1) q.fox = s;
    } else {
      // a deep breath, belly out; then PON!
      go({ tilt: -14, chest: -10, head: -8, shN: 50, elN: -60, hwN: 20 }, wu);
      say('puff', W);
      go({ tilt: 8, chest: 2, head: 4, shN: 6, elN: -100, hwN: 0 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0.05 && s < 1.1) q.rings = s - 0.05;
    }
  }
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -10, head: 12, neckR: 4, shN: -80, elN: -110 }, kh);
    q.face = 'hurt';
    q.hatPop = Math.max(q.hatPop, Math.sin(Math.PI * clamp(ago / 0.5, 0, 1)));
    q.swing += Math.sin(ago * 14) * 0.5 * kh;
  }
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.5) / 0.5) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.28, 0.8, 1.1) * (1 - moveW);
    go({ shF: -120, elF: -30 }, kg);
    q.pole = mix(q.pole, 0.85, kg);
    q.hatTilt += -0.12 * kg;
    say('grin', kg);
  }
  st.ltNap = mix(st.ltNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  doze = Math.max(doze, sstep(st.ltNap));
  if (doze > 0.001) {
    // leaning on his pole, head nodding, the lantern lowered and dim
    go({ shF: -52, elF: -22, tilt: 6, head: 16, neckR: 3, shN: 0, elN: -60 }, doze);
    add({ head: Math.sin(now * 1.4) * 3 * doze }, 1);
    q.pole = mix(q.pole, 1.3, doze);
    q.lamp -= 0.35 * doze;
    if (doze > 0.6) {
      q.face = q.nose >= 0 && q.nose > 0.6 ? 'sleepy' : 'sleep';
      q.zz = doze;
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
    q.lamp = 0.2;
  }
  let f = q.face ?? 'calm';
  if (f !== st.ltFace) {
    st.ltFaceFrom = st.ltFace;
    st.ltFace = f;
    st.ltFaceAt = now;
  }
  const since0 = now - (st.ltFaceAt ?? -9);
  if (since0 >= 0 && since0 < 0.07 && st.ltFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.ltFaceFrom)) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.71) % 4.8;
  if (bl < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  // (the lantern hangs behind the pole's turns: it lags as the pole sweeps)
  const poleNow = q.pole;
  st.lt_poleSlow = mix(st.lt_poleSlow ?? poleNow, poleNow, ease(7));
  for (const key of ['tail0', 'tail1', 'pole', 'hatPop', 'hatTilt', 'cheek', 'lamp', 'foxGrow', 'flies', 'bite']) {
    const rate = key === 'pole' ? (mvName ? 14 : 8) : 12;
    st[`lt_${key}`] = mix(st[`lt_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`lt_${key}`];
  }
  q.swing += 0.9 * Math.tanh(((st.lt_poleSlow - q.pole) * 0.7) / 0.9);
  st.lt_swing = mix(st.lt_swing ?? q.swing, q.swing, ease(10));
  q.swing = st.lt_swing;
  q.lamp = clamp(q.lamp, 0, 1.4);
}

// ---------- Live effects (rig space, game px, his feet at 0, 0) ----------
function halo(ctx, x, y, r, al, col = LAMP[1]) {
  if (al <= 0.01) return;
  glow(ctx, x, y, r, col, al);
}
function firefly(ctx, x, y, al) {
  if (al <= 0.01) return;
  glow(ctx, x, y, 2.4, FLY[1], 0.55 * al);
  ell(ctx, x, y, 0.55, 0.55);
  ctx.fillStyle = `rgba(255,252,214,${al})`;
  ctx.fill();
}
function noteMark(ctx, x, y, s, al, fl = false) {
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
      ctx.strokeStyle = COAT[2];
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
  ctx.strokeStyle = COAT[1];
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f4f2ff';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  // his marks sit in a little paper-lantern bubble
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-4.6, -5.6], [4.6, -5.6], [6, -1], [4.6, 3.8], [1.2, 4.6], [-0.2, 7], [-1.4, 4.6], [-4.6, 3.8], [-6, -1]]);
    if (pass === 'line') {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = LAMP[3];
      ctx.stroke();
    } else {
      ctx.fillStyle = '#fff8ec';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? LAMP[2] : COAT[1];
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
// A soft foxfire flame: a rounded teal teardrop with a white heart, its tip trailing back.
function foxfire(ctx, x, y, r, back, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.4, FOX[2], 0.35);
  ctx.translate(x, y);
  const tipX = -back * r * 1.8;
  for (const [col, k] of [[FOX[3], 1.15], [FOX[2], 1], [FOX[1], 0.62], [FOX[0], 0.34]]) {
    ctx.beginPath();
    ctx.moveTo(tipX * k, -r * 1.3 * k);
    ctx.quadraticCurveTo(r * 1.1 * k, -r * 0.6 * k, r * k, r * 0.2 * k);
    ctx.arc(0, r * 0.2 * k, r * k, 0, Math.PI);
    ctx.quadraticCurveTo(-r * k, -r * 0.4 * k, tipX * k, -r * 1.3 * k);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }
  ctx.restore();
}

function dangoStick(ctx, a, D, left, al, bite = 0) {
  if (al <= 0.02) return;
  const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
  // held up in his paw; for a bite, tipped over toward his mouth
  const ang = mix(-0.35, -1.2, sstep(bite));
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(hx, hy);
  ctx.rotate(ang);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 1.6);
  ctx.lineTo(0, -9);
  pen(ctx, '#8a6a44', 1.3);
  ctx.stroke();
  pen(ctx, '#e8d0a0', 0.6);
  ctx.stroke();
  const COLS = [['#ffc8d8', '#e890a8'], ['#fff8ee', '#d8ccc0'], ['#c8e8a0', '#8ab868']];
  for (let i = 0; i < 3; i++) {
    // (the one at his mouth fades as it's eaten)
    const keep = clamp(left - i, 0, 1);
    ctx.save();
    ctx.globalAlpha *= keep;
    const y = -3.2 - i * 2.4;
    ell(ctx, 0, y, 1.45, 1.35);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = COLS[i][1];
    ctx.stroke();
    ctx.fillStyle = COLS[i][0];
    ctx.fill();
    ell(ctx, -0.45, y - 0.45, 0.45, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  tail(ctx, a, 'line', D);
  tail(ctx, a, 'fill', D);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.lt ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  const L = lampAt(a, D);
  const [lx, ly] = L.c;
  // the lantern's light: a warm soft halo, the candle's flicker in it
  const lit = clamp(q.lamp ?? 0.6, 0, 1.4);
  halo(ctx, lx, ly, 9 + lit * 4, 0.18 + lit * 0.14, LAMP[1]);
  halo(ctx, lx, ly + 0.6, 3.6, 0.3 + lit * 0.3, LAMP[0]);
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -32]);
    dizzy(ctx, hx, hy, 6, a.now ?? 0, 3);
    ctx.globalAlpha = base;
    return;
  }
  // little firefly lights drifting round the lifted lantern
  if ((q.flies ?? 0) > 0.03) {
    for (let i = 0; i < 5; i++) {
      const ph = t * (0.5 + i * 0.07) + i * 1.3;
      const r = 7 + (i % 3) * 2.4;
      firefly(ctx, lx + Math.cos(ph) * r, ly + Math.sin(ph * 1.3) * r * 0.6 - 2, q.flies * (0.6 + 0.4 * Math.sin(t * 3 + i * 2)));
    }
  }
  // the firefly light that lands on his nose while he dozes
  if ((q.nose ?? -1) >= 0 && q.nose < 1.2) {
    const [nx, ny] = headAt(a, D, [13.2, 5.6]);
    const u = sstep(q.nose / 0.8);
    const fx0 = mix(lx, nx, u) + Math.sin(q.nose * 9) * 2 * (1 - u);
    const fy0 = mix(ly - 4, ny - 1.2, u) + Math.cos(q.nose * 7) * 1.4 * (1 - u);
    firefly(ctx, fx0, fy0, 1 - sstep((q.nose - 1.0) / 0.2));
  }
  // drumming: a note off each beat and soft rings on his belly
  if ((q.drumHit ?? -1) >= 0) {
    const e = q.drumHit;
    const [bx, by] = ptOf(a, D, 'waistB', [92, 112]);
    ctx.save();
    ctx.globalAlpha *= (1 - e / 0.38) * 0.8;
    ctx.beginPath();
    ctx.arc(bx, by, 1.5 + e * 12, -0.9, 0.9);
    pen(ctx, CREAM[0], 0.6);
    ctx.stroke();
    ctx.restore();
    noteMark(ctx, bx + 5 + e * 14, by - 6 - e * 18, 0.6, Math.sin(Math.PI * clamp(e / 0.38, 0, 1)), a.flip);
  }
  if ((q.pon ?? -1) >= 0) {
    const e = q.pon / 0.9;
    const [bx, by] = ptOf(a, D, 'waistB', [92, 112]);
    ctx.save();
    ctx.globalAlpha *= 1 - e;
    for (const d of [0, 0.18]) {
      ctx.beginPath();
      ctx.arc(bx, by, 2 + clamp(e - d, 0, 1) * 16, -1, 1);
      pen(ctx, LAMP[1], 0.9);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < 2; i++) noteMark(ctx, bx + 6 + i * 4, by - 8 - e * 12 - i * 3, 0.75, Math.sin(Math.PI * e), a.flip);
  }
  if ((q.dangoK ?? 0) > 0.02) dangoStick(ctx, a, D, 3 - Math.max(0, q.dango ?? 0), q.dangoK, q.bite ?? 0);
  // ----- Lantern Swing: a ribbon of warm light behind the lantern -----
  if (q.trail !== null && q.trail !== undefined && q.trail < 0.7) {
    const e = q.trail;
    const { h } = poleEnds(a, D);
    const an = q.pole ?? 0;
    const R = POLE + 7;
    const al = 1 - sstep((e - 0.25) / 0.45);
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 10; i++) {
      const b0 = an - (i + 1) * 0.16;
      const b1 = an - i * 0.16;
      const k0 = (1 - i / 10) * al;
      ctx.beginPath();
      ctx.moveTo(h[0] + Math.sin(b0) * R, h[1] - Math.cos(b0) * R);
      ctx.lineTo(h[0] + Math.sin(b1) * R, h[1] - Math.cos(b1) * R);
      ctx.globalAlpha = base * k0 * 0.55;
      pen(ctx, LAMP[1], 4.4 * (1 - i / 12));
      ctx.stroke();
      ctx.globalAlpha = base * k0 * 0.85;
      pen(ctx, LAMP[0], 1.6 * (1 - i / 12));
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = base;
    if (e > 0.12 && e < 0.5) sparkle(ctx, lx + 3, ly, 2.4 * Math.sin(Math.PI * (e - 0.12) / 0.38), 1, '#fff6c8');
  }
  // ----- Foxfire: the flame swells, then three foxfire flames float out at you -----
  if ((q.foxGrow ?? 0) > 0.03) foxfire(ctx, lx, ly - 1, 1.2 + q.foxGrow * 1.6, 0, q.foxGrow);
  if ((q.fox ?? -1) >= 0) {
    for (let i = 0; i < 3; i++) {
      const e = clamp((q.fox - i * 0.1) / 0.9, 0, 1);
      if (e <= 0) continue;
      const x = lx + sstep(e) * (18 + i * 7);
      const y = ly + 2 - Math.sin(e * Math.PI * 1.5 + i * 1.6) * 4 + i * 3 + e * 6;
      foxfire(ctx, x, y, 2 - e * 0.6, 0.6 + (1 - e) * 0.4, sstep(e / 0.15) * (1 - sstep((e - 0.75) / 0.25)));
    }
  }
  // ----- Belly Drum: PON! warm rings rolling out along the ground -----
  if ((q.rings ?? -1) >= 0 && q.rings < 1.0) {
    const e = q.rings;
    const [bx, by] = ptOf(a, D, 'waistB', [94, 112]);
    ctx.save();
    ctx.globalAlpha *= 1 - sstep(e / 0.4);
    glow(ctx, bx + 2, by, 6, LAMP[0], 0.8);
    ctx.restore();
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const u = clamp((e - i * 0.12) / 0.8, 0, 1);
      if (u <= 0 || u >= 1) continue;
      const rx = 4 + u * 30;
      ctx.globalAlpha = base * (1 - u) * 0.9;
      ctx.beginPath();
      ctx.ellipse(6, -0.6, rx, rx * 0.22, 0, Math.PI * 1.05, Math.PI * 1.95);
      pen(ctx, LAMP[2], 1.8);
      ctx.stroke();
      pen(ctx, LAMP[0], 0.8);
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = base;
    noteMark(ctx, bx + 6, by - 8 - e * 12, 0.9, Math.sin(Math.PI * clamp(e / 0.8, 0, 1)), a.flip);
  }
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    sparkle(ctx, lx + 4 + e * 4, ly - 3 - e * 5, 1.6 * (1 - e), 1, '#fff2c8');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-19, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -34]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [16, -40]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, lx - 2 + e * 4, ly - 6 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, '#fff2c8');
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'lantertanuki',
  skin: { lt: COAT[0], base: COAT[1], sh: COAT[2], deep: COAT[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    handFskin: (ctx, a, mode, S, D) => poleLantern(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => coat(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      hat(ctx, a, mode, D);
    },
    armN: (ctx, a, mode, S, D) => cuff(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('lantern', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.5);
rig.h = Math.round(rig.h * BIG * 1.4);
export const LANTERN_TANUKI_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const LANTERN_TANUKI_SIZE = { w: 32, h: Math.round(R.H * BIG * 1.08), speed: Math.round(R.speed * BIG) };
