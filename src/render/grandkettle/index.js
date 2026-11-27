// The Grand Kettle (2026-11-26, rebuilt from scratch on the creature base; the id stays `grandkettle`).
// The Tea Terraces' area boss and Sencha's old master, the Tea Ceremony Master, kept as the player
// picked him: a big, round, formal old tanuki in kimono, haori and hakama, who swings a huge iron
// kettle. Woken in the giant teapot hut (world/nest.js), he fights the way he makes tea: by the
// forty-seven steps (world/grandkettle.js; his telegraphs, render/grandkettle/looks.js). On his own
// copy of the creature base (rig.js; body.js `grandtanuki`, big and round): the base's own skin is
// his indigo kimono (so it fits and folds with every pose); over it, cut from the body's own
// outline, his black haori with its crest, collar and ties, his obi with a red fan, the top of his
// hakama; his wide haori sleeves, hakama legs, tabi and zori, paws, tail, head, hair and kettle all
// drawn here from scratch (never the shared face, never the hero's hair).
//   look    old silvery fur, the dark mask joined across his nose, cream muzzle; white hair: a round
//           topknot tied with a red cord on his crown, big fluffy white cheek ruffs, bushy cloud
//           brows, a little round goatee; his own eyes ("ember eyes": round and dark, lit warm from
//           below like coals under a kettle, a big rounded glint and a small one, a strong upper
//           lash with a short flick, a soft lower lid, two smile creases at the corners); the
//           huge black iron tetsubin hanging from his paw, studded, a gold knob, steam at its spout.
//           His own soft plum-grey outline, outer edge only, face bare.
//   walk    slow and dignified, his hakama swinging, the kettle swaying from his paw.
//   idle    a 27 s act in four pieces, each the next one that fits the time he has (data `rest`):
//           - bow (6.4 s): a formal tea master's bow, eyes shut, and up again;
//           - sniff (7.2 s): the kettle lifted to his nose, a long breath of the brew, content;
//           - stamp (6.0 s): something isn't right: a grumpy stamp of his foot, "hmph", arms folded;
//           - sip (7.4 s): a tiny cup from his sleeve, a sip, a sigh, bliss.
//   fight   his casts (m.cast, world/story.js rotationTurn: `m.castPose` which, acted through the
//           cast, winding up in its last half second, landing as it ends):
//           - entrance (Morning Tea): sipping, eyes shut; one eye opens on you; the cup away, the
//             kettle up over his head and down, BOOM, a cloud of steam;
//           - whisk (Purify the Utensils): a huge bamboo whisk out of his sleeve, whisked round and
//             round, then flourished down;
//           - pour (Pour the Water): the kettle lifted out and tipped, a stream from its spout;
//           - lids (Kettle Lids): three lids flung up high one after another, then a point down;
//           - steam (Steam Vents): its lid off, the kettle held up belching steam; a stamp;
//           - wave (Tea Wave): the kettle up in both paws and tipped right over;
//           - cups (A Thousand Cups): cups flung up out of his sleeve, again and again;
//           - infusion (Grand Infusion): the kettle set down glowing hot, both arms up, then down;
//           and when you get too close, a swing of the kettle (Kettle Swing).
//   else    hurt: a squeeze, his topknot bobbing, the kettle swinging; after landing a hit: a
//           satisfied "hmph", eyes shut, nose up; hunting you: stern; low on health: flustered,
//           sweat; beaten: sat back, dizzy, the kettle dropped on its side. His marks over his head
//           are his own (`ownEmotes`).
// Every effect is drawn here, live, in his own soft style: steam as soft white puffs, tea as round
// amber drops, iron's clang as soft gold rings, sparkles the game's curvy stars.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, sweat, dizzy, hash } from './fx.js';

const BIG = 2.6;
const LW = 1.6 / BIG;
const INK = '#5a4a5e';
const FUR = ['#f6efe8', '#c8b4a2', '#a08a78', '#6e5c50'];
const WHITE = ['#ffffff', '#f4f0ec', '#dcd4cc', '#b8aea4'];
const MASK = '#52423e';
const CREAM = ['#fffaf2', '#f2e4d4', '#dcc8b2'];
const KIMONO = ['#5a6aa4', '#34447c', '#283664', '#1c284e'];
const HAORI = ['#5a5a70', '#34344a', '#26263a', '#1a1a2a'];
const HAKAMA = ['#d4d6e4', '#aeb0c4', '#8e90a8', '#6c6e88'];
const OBI = ['#5a4a6a', '#3a2e48'];
const FAN = ['#ff9a8a', '#d8483e', '#9a2e2a'];
const GOLD = ['#fff2b4', '#f2c14e', '#b8862a'];
const IRON = ['#7c7c96', '#4e4e66', '#34344a', '#222234'];
const CORD = ['#ff8a7a', '#d8463c'];
const ZORI = ['#f0dca0', '#c8a86a', '#987a44'];
const LASH = '#2a2028';
const IRIS = ['#1e1410', '#4a3024', '#c8642e', '#ffb060'];
const STEAM = ['#ffffff', '#f4f0f8', '#d8d0e4'];
const TEA = ['#fff0c4', '#f0bc62', '#c8843a'];
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
const HS = 1.25;
const HO = [1, -15];
const headK = ([u, v], n) => [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS];
const headAt = (a, D, uv) => ptOf(a, D, 'head', headK(uv, D.J.neck));
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(HO[0], HO[1]);
}
// a closed soft curve through rig-space points
function loop(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  ctx.moveTo(...mid(0));
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(...pts[i % n], ...mid(i));
  ctx.closePath();
}

// ---------- His loose pieces ----------
const TAIL = [[64, 121], [52, 121], [40, 116]];
const JOINTS = { tail0: TAIL[0], tail1: TAIL[1] };
const SOFTS = [
  { name: 'tail0', parent: 'torso', pivot: 'tail0', rot: (S, a) => a.gk?.tail0 ?? 0, soft: { k: 70, c: 7, gain: 0.35, turn: 0.7, max: 10, dir: [-10, 0] } },
  { name: 'tail1', parent: 'tail0', pivot: 'tail1', rot: (S, a) => a.gk?.tail1 ?? 0, soft: { k: 54, c: 5.6, gain: 0.45, turn: 0.85, max: 16, flutter: 2, hz: 0.4, dir: [-8, -4] } },
];

// ---------- His face ----------
const FACES = {
  stern: { e: 'open', g: [0.6, 0.3], b: [0.4, 0.8], m: 'set' },
  calm: { e: 'open', g: [0.6, 0.2], b: [0, 0], m: 'calm' },
  content: { e: 'happy', b: [-0.6, -0.8], m: 'smile' },
  bliss: { e: 'happy', b: [-0.4, -0.6], m: 'smile' },
  peek: { e: 'peek', g: [1.6, 0.2], b: [-1.2, 0.6], m: 'calm' },
  cross: { e: 'open', g: [1.4, 0.4], b: [-0.6, 2], m: 'frown' },
  hmph: { e: 'shut', b: [-0.4, 1.6], m: 'frown' },
  bow: { e: 'shut', b: [0, 0], m: 'calm' },
  focus: { e: 'open', g: [1.6, 0.5], b: [-0.4, 1.6], m: 'set' },
  grin: { e: 'open', g: [1.2, 0.2], b: [-0.6, 0.6], m: 'grin' },
  shout: { e: 'squeeze', b: [-0.8, 2.2], m: 'shout' },
  puff: { e: 'open', g: [1.2, -0.2], b: [-0.6, 1.4], m: 'puff' },
  up: { e: 'open', g: [0.8, -1.8], b: [-1.2, -1], m: 'o' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  flustered: { e: 'open', g: [0.4, 0.9], b: [1.4, -1.8], m: 'wobble' },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'calm' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['content', 'bliss', 'hmph', 'bow', 'shout', 'hurt', 'sleep', 'shut', 'dizzy']);
// (shut, his eyes are pale lines on the dark of his mask, so they read)
const SHUT_LINE = '#f4ebe2';
function curve3(ctx, a, p0, c, p1, wd, col) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  pen(ctx, tone(a, col), wd);
  ctx.stroke();
}
// His ember eyes: round and dark, lit warm from below like coals under a kettle.
function eye(ctx, a, x, y, o, f, near) {
  const w = 4.1;
  const h = 4.6;
  let kind = f.e;
  if (kind === 'peek') kind = near ? 'open' : 'shut';
  if (kind === 'happy') {
    curve3(ctx, a, [x - w, y + 1.4], [x, y - h * 1.0], [x + w, y + 1.4], 1.5, SHUT_LINE);
    return;
  }
  if (kind === 'squeeze') {
    curve3(ctx, a, [x - w * o, y - 1.8], [x + w * 0.2 * o, y - 0.2], [x + w * o, y + 0.4], 1.5, SHUT_LINE);
    curve3(ctx, a, [x - w * o, y + 2.2], [x + w * 0.1 * o, y + 1.2], [x + w * o, y + 0.5], 1.3, SHUT_LINE);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    curve3(ctx, a, [x - w, y + 0.4], [x, y + (kind === 'sleep' ? 3.4 : 2.8)], [x + w, y + 0.4], 1.5, SHUT_LINE);
    return;
  }
  ell(ctx, x, y, w, h);
  ctx.fillStyle = tone(a, '#fffdf8');
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
    pen(ctx, tone(a, IRIS[2]), 0.8);
    ctx.stroke();
    return;
  }
  const [gx, gy] = f.g ?? [0.6, 0.3];
  const ix = x + gx * 0.8;
  const iy = y + gy * 0.8 + 0.3;
  const iw = w * 0.76;
  const ih = h * 0.8;
  ctx.save();
  ell(ctx, x, y, w, h);
  ctx.clip();
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.2, iw * 0.86, ih * 0.86);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  // the ember glow, warm from below
  ell(ctx, ix, iy + ih * 0.48, iw * 0.64, ih * 0.36);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.58, iw * 0.36, ih * 0.18);
  ctx.fillStyle = tone(a, IRIS[3], 0.9);
  ctx.fill();
  ell(ctx, ix, iy - 0.3, iw * 0.42, ih * 0.44);
  ctx.fillStyle = tone(a, '#0e0a08');
  ctx.fill();
  ctx.restore();
  // a big rounded glint and a small one
  ell(ctx, ix - 1.2, iy - 1.7, 1.3, 1.15);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + 1.3, iy + 0.6, 0.5, 0.5);
  ctx.fill();
  // the strong upper lash with its short flick; the soft lower lid; two smile creases (he's old)
  ctx.beginPath();
  ctx.moveTo(x - w * 0.98, y - h * 0.2);
  ctx.quadraticCurveTo(x, y - h * 1.24, x + w * 0.98, y - h * 0.2);
  pen(ctx, tone(a, LASH), 1.55);
  ctx.stroke();
  const ox = x + o * w * 0.96;
  curve3(ctx, a, [ox, y - h * 0.26], [ox + o * 0.8, y - h * 0.4], [ox + o * 1.5, y - h * 0.62], 0.9, LASH);
  curve3(ctx, a, [x - w * 0.55 * o, y + h * 0.98], [x + w * 0.15 * o, y + h * 1.08], [x + w * 0.78 * o, y + h * 0.74], 0.55, '#a8968e');
  for (const k of [0, 1]) curve3(ctx, a, [x + o * (w + 1.4), y + 0.2 + k * 1.8], [x + o * (w + 2.4), y + 0.8 + k * 1.8], [x + o * (w + 3.2), y + 0.4 + k * 2.4], 0.5, SHUT_LINE);
}
// His bushy white brows: three soft round clouds each, lifting, dropping and tilting.
function brow(ctx, a, mode, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.save();
  ctx.translate(x, y + (bo + bi) * 0.4);
  ctx.rotate((bi - bo) * 0.12 * o);
  smooth(ctx, [[-4.6 * o, 1], [-4.4 * o, -1.2], [-2 * o, -2.6], [0.6 * o, -2.4], [2.8 * o, -3], [4.8 * o, -1.4], [4.6 * o, 1.2], [1.6 * o, 2], [-1.6 * o, 2]]);
  if (mode === 'line') paint(ctx, a, 'line', null, WHITE[3], 0.9);
  else {
    ctx.fillStyle = tone(a, WHITE[1]);
    ctx.fill();
    ell(ctx, -0.6 * o, -0.8, 2.6, 1.2);
    ctx.fillStyle = tone(a, WHITE[0]);
    ctx.fill();
  }
  ctx.restore();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#5e3a3a';
  const stroke = (pts, w = 0.85) => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length - 1; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    pen(ctx, tone(a, LIP), w);
    ctx.stroke();
  };
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#6e2a32');
    ctx.fill();
    ell(ctx, x, y + h * 0.75, w * 0.6, h * 0.36);
    ctx.fillStyle = tone(a, '#f08a98');
    ctx.fill();
  };
  switch (m) {
    case 'grin':
      stroke([[x - 2.8, y - 0.4], [x, y + 2], [x + 3, y - 0.6]]);
      break;
    case 'smile':
      stroke([[x - 2.4, y - 0.2], [x, y + 1.5], [x + 2.6, y - 0.4]]);
      break;
    case 'o':
      ell(ctx, x + 0.4, y + 0.8, 1.2, 1.4);
      ctx.fillStyle = tone(a, '#6e2a32');
      ctx.fill();
      break;
    case 'puff':
      ell(ctx, x + 0.4, y + 0.6, 0.8, 0.6);
      ctx.fillStyle = tone(a, '#6e2a32');
      ctx.fill();
      break;
    case 'shout':
      open(3, 3.2);
      break;
    case 'set':
      stroke([[x - 2.4, y + 0.4], [x, y - 0.2], [x + 2.4, y + 0.4]], 1);
      break;
    case 'frown':
      stroke([[x - 2.4, y + 1], [x, y - 0.3], [x + 2.4, y + 1]], 0.95);
      break;
    case 'wobble':
      stroke([[x - 2.4, y + 0.4], [x - 1.2, y - 0.4], [x, y + 0.3], [x + 1.2, y - 0.4], [x + 2.4, y + 0.4]], 0.8);
      break;
    case 'talkA':
      open(2, 2.2);
      break;
    case 'talkE':
      open(2.4, 1.2);
      break;
    default:
      stroke([[x - 2.2, y - 0.1], [x - 1.1, y + 1.0], [x, y + 0.1], [x + 1.1, y + 1.0], [x + 2.2, y - 0.1]], 0.8);
  }
}
const SKULL = [[-21, -4], [-18, -12.6], [-11, -18], [0, -19.6], [10, -18.6], [17, -13.6], [21, -5], [23, 2], [23.6, 8], [20, 13], [12, 17], [0, 18], [-10, 17], [-18, 13], [-22.4, 5]];
function ear(ctx, a, mode, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, 0, r, r * 0.88);
  paint(ctx, a, mode, MASK);
  if (mode === 'fill') {
    ell(ctx, 0.3, 0.8, r * 0.56, r * 0.48);
    ctx.fillStyle = tone(a, FUR[2]);
    ctx.fill();
  }
  ctx.restore();
}
// His white cheek ruffs: big round tufts out past his jaw each side (rounded bumps, never points).
const RUFF_F = [[-16, 2], [-22, 4], [-26, 9], [-25, 14.4], [-20.4, 17.4], [-14, 17], [-10, 12]];
const RUFF_N = [[16, 2], [23, 4], [27.4, 9], [26.4, 14.6], [21.6, 17.6], [15, 17.2], [11, 12]];
// His topknot: a round white bun tied with a red cord, on a cap of white hair over his crown.
function hairCap(ctx, a, mode) {
  const q = a.gk ?? {};
  smooth(ctx, [[-16.4, -12], [-14, -17], [-7, -20.2], [2, -21.2], [11, -19.8], [16.4, -15.4], [17.6, -12], [12, -15.4], [2, -16.8], [-8, -16.2]]);
  paint(ctx, a, mode, WHITE[1], WHITE[3]);
  if (mode === 'fill') {
    ctx.save();
    ctx.clip();
    glow(ctx, -2, -19, 9, WHITE[0], 0.9);
    glow(ctx, 15, -12, 6, WHITE[2], 0.7);
    ctx.restore();
    // one shine band across it, soft
    ctx.beginPath();
    ctx.moveTo(-8, -18.4);
    ctx.quadraticCurveTo(0, -20, 8, -18.6);
    pen(ctx, 'rgba(255,255,255,0.85)', 1.1);
    ctx.stroke();
  }
  // the bun, nodding on its own a little
  ctx.save();
  ctx.translate(1, -21);
  ctx.rotate((q.bun ?? 0) * 0.25);
  ell(ctx, 0, -4.2, 5.4, 4.4);
  paint(ctx, a, mode, WHITE[1], WHITE[3]);
  if (mode === 'fill') {
    ell(ctx, -1.2, -5.4, 2.6, 1.6);
    ctx.fillStyle = tone(a, WHITE[0]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3.6, -0.6);
    ctx.quadraticCurveTo(0, 0.6, 3.6, -0.6);
    pen(ctx, tone(a, CORD[1]), 1.4);
    ctx.stroke();
    ell(ctx, 3.8, -0.4, 0.9, 0.8);
    ctx.fillStyle = tone(a, CORD[0]);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gk ?? {};
  const f = FACES[q.face] ?? FACES.stern;
  ctx.save();
  headFrame(ctx, a, D);
  ear(ctx, a, mode, -16, -12.4, 5.2, -0.5);
  ear(ctx, a, mode, 15.4, -13.4, 5.4, 0.45);
  for (const R of [RUFF_F, RUFF_N]) {
    smooth(ctx, R);
    paint(ctx, a, mode, WHITE[1], WHITE[3]);
  }
  smooth(ctx, SKULL);
  paint(ctx, a, mode, FUR[1]);
  // the round goatee under his chin
  ctx.save();
  ctx.translate(6, 16.6);
  ctx.rotate(q.beard ?? 0);
  smooth(ctx, [[-4.6, -1], [4.6, -1], [4.4, 3], [1.6, 6.2], [-1.6, 6.2], [-4.4, 3]]);
  paint(ctx, a, mode, WHITE[1], WHITE[3]);
  if (mode === 'fill') {
    ell(ctx, -0.8, 1.6, 2, 2.4);
    ctx.fillStyle = tone(a, WHITE[0]);
    ctx.fill();
  }
  ctx.restore();
  if (mode === 'fill') {
    for (const R of [RUFF_F, RUFF_N]) {
      ctx.save();
      smooth(ctx, R);
      ctx.clip();
      glow(ctx, R[3][0] * 0.9, 10, 7, WHITE[0], 0.9);
      ctx.restore();
    }
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    glow(ctx, -3, -11, 15, FUR[0], 0.75);
    glow(ctx, -19, 9, 9, FUR[2], 0.5);
    // the mask: round about each eye, joined across his nose, drooping a little at the outsides
    smooth(ctx, [[-13, -2.6], [-9, -6], [-2.4, -5.4], [2.6, -2.6], [7.4, -5.8], [14, -6.2], [17.6, -2.4], [17.4, 3.6], [14.4, 7.6], [9.6, 6.6], [3.2, 3.4], [-1.6, 6.8], [-7.6, 7.4], [-12.6, 4.6]]);
    ctx.fillStyle = tone(a, MASK);
    ctx.fill();
    ctx.restore();
    eye(ctx, a, -6, -0.4, -1, f, false);
    eye(ctx, a, 10.6, -0.8, 1, f, true);
  }
  brow(ctx, a, mode, -6.4, -8.6, -1, f.b);
  brow(ctx, a, mode, 10.8, -9, 1, f.b);
  if (mode === 'fill') {
    // the muzzle, his big round nose, the mouth
    smooth(ctx, [[2.6, 8], [5, 4.8], [10, 4], [15.6, 5], [18.4, 8.6], [16.6, 12.6], [10.6, 14.4], [4.6, 13]]);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    glow(ctx, 9.4, 6.6, 5, CREAM[0], 0.9);
    ell(ctx, 14, 5.6, 2.9, 2.2);
    ctx.fillStyle = tone(a, '#2a2024');
    ctx.fill();
    ell(ctx, 13.2, 4.8, 1, 0.6, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, 12.4, 10.4, f.m);
    ell(ctx, -14.4, 6.6, 2.6, 1.4);
    ctx.fillStyle = 'rgba(255,150,150,0.22)';
    ctx.fill();
  }
  hairCap(ctx, a, mode);
  ctx.restore();
}

// ---------- His clothes ----------
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
function robes(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const T = (p) => ptOf(a, D, 'torso', p);
  const poly = (pts) => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
  };
  ctx.save();
  if (!torsoPath(ctx, a)) {
    ctx.restore();
    return;
  }
  ctx.clip();
  // the hakama's top, from his obi down: pale grey, striped, pleated
  poly([W([40, 112]), W([120, 112]), T([120, 140]), T([40, 140])]);
  ctx.fillStyle = tone(a, HAKAMA[1]);
  ctx.fill();
  pen(ctx, tone(a, HAKAMA[3], 0.55), 0.5);
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(...W([58 + i * 5, 113]));
    ctx.lineTo(...T([57 + i * 5.4, 132]));
    ctx.stroke();
  }
  const hm = T([92, 118]);
  glow(ctx, hm[0], hm[1], 4, HAKAMA[0], 0.7);
  // the haori over everything above it, open down the front on the kimono and its crossed collar
  poly([C([30, 70]), C([130, 70]), W([130, 113]), W([30, 113])]);
  ctx.fillStyle = tone(a, HAORI[1]);
  ctx.fill();
  const hg = C([90, 96]);
  glow(ctx, hg[0], hg[1], 6, HAORI[0], 0.6);
  // (the open front: the kimono in a V down to the obi)
  poly([C([80.6, 87]), C([92, 88]), W([94.6, 112.4]), W([80.6, 112.4])]);
  ctx.fillStyle = tone(a, KIMONO[1]);
  ctx.fill();
  // the kimono's white collar crossed left over right, and the haori's own black lapel bands
  for (const [p0, p1, col, wd] of [[C([82, 87.4]), W([90, 104]), WHITE[1], 1.3], [C([90.6, 87.6]), W([86, 104]), WHITE[2], 1.1], [C([80, 86.6]), W([80, 112]), HAORI[3], 1.4], [C([92.6, 87.6]), W([95.6, 112]), HAORI[3], 1.4]]) {
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    pen(ctx, tone(a, col), wd);
    ctx.stroke();
  }
  // the white leaf crest on the haori's chest
  const [cx, cy] = C([72, 95]);
  ell(ctx, cx, cy, 1.5, 1.5);
  pen(ctx, tone(a, WHITE[1]), 0.4);
  ctx.stroke();
  ell(ctx, cx, cy, 0.7, 1.05, 0.4);
  ctx.fillStyle = tone(a, WHITE[1]);
  ctx.fill();
  // the obi: a dark band round his waist, the red fan tucked in it
  poly([W([40, 107.6]), W([120, 107.6]), W([120, 113.4]), W([40, 113.4])]);
  ctx.fillStyle = tone(a, OBI[1]);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(...W([40, 109.4]));
  ctx.lineTo(...W([120, 109.4]));
  pen(ctx, tone(a, OBI[0]), 0.4);
  ctx.stroke();
  ctx.restore();
  // (the fan and the haori's white tie, over the edge of him)
  // (the closed fan: a short red stick, wider at its top, tucked in the obi)
  const f0 = W([89.6, 111]);
  const f1 = W([91.6, 103.4]);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...f0);
  ctx.lineTo(...f1);
  pen(ctx, tone(a, FAN[2]), 1.7);
  ctx.stroke();
  pen(ctx, tone(a, FAN[1]), 1);
  ctx.stroke();
  ell(ctx, f1[0], f1[1], 1.1, 0.8);
  ctx.fillStyle = tone(a, FAN[0]);
  ctx.fill();
  ctx.restore();
  const tie = C([87, 96]);
  for (const s of [-1, 1]) {
    ell(ctx, tie[0] + s * 0.9, tie[1], 0.8, 0.8);
    ctx.fillStyle = tone(a, WHITE[0]);
    ctx.fill();
  }
}
// A wide haori sleeve on an arm: a soft tube over the upper arm and past the elbow, and its deep
// pouch hanging down from the elbow whatever way the arm points (rig space; outlined round the two
// together, so only their outer edge shows).
function sleeve(ctx, a, mode, D, k) {
  const q = a.gk ?? {};
  const S = ptOf(a, D, `arm${k}u`, D.J[`sh${k}`]);
  const E = ptOf(a, D, `arm${k}f`, D.J[`el${k}`]);
  const Wr = ptOf(a, D, `arm${k}f`, D.J[`wr${k}`]);
  const M = [mix(E[0], Wr[0], 0.35), mix(E[1], Wr[1], 0.35)];
  const w = 3.3;
  const sw = (q[`sway${k}`] ?? 0) * 1.4;
  const P = [E[0] + sw * 0.5, E[1] + 3.6];
  const tube = () => {
    ctx.beginPath();
    ctx.moveTo(...S);
    ctx.lineTo(...E);
    ctx.lineTo(...M);
  };
  const pouch = () => {
    ctx.beginPath();
    ctx.moveTo(P[0] - 2.8, P[1] - 3.4);
    ctx.quadraticCurveTo(P[0] - 3.6 + sw * 0.3, P[1] + 3, P[0] + sw * 0.4, P[1] + 4.2);
    ctx.quadraticCurveTo(P[0] + 3.4 + sw * 0.4, P[1] + 3.2, P[0] + 3, P[1] - 3.4);
    ctx.closePath();
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mode === 'line') {
    tube();
    pen(ctx, INK, w * 2 + LW * 2);
    ctx.stroke();
    pouch();
    pen(ctx, INK, LW * 2);
    ctx.stroke();
  } else {
    pouch();
    ctx.fillStyle = tone(a, HAORI[1]);
    ctx.fill();
    tube();
    pen(ctx, tone(a, HAORI[1]), w * 2);
    ctx.stroke();
    // a soft light along its top, the pouch shaded low
    glow(ctx, P[0], P[1] + 3, 3.4, HAORI[3], 0.6);
    ctx.beginPath();
    ctx.moveTo(mix(S[0], E[0], 0.15), mix(S[1], E[1], 0.15) - 1.6);
    ctx.lineTo(mix(S[0], E[0], 0.8), mix(S[1], E[1], 0.8) - 1.6);
    pen(ctx, tone(a, HAORI[0], 0.5), 1.4);
    ctx.stroke();
  }
  ctx.restore();
}
// A hakama leg: wide and pleated from hip to ankle, flaring (rig space, round the leg's bones).
function hakamaLeg(ctx, a, mode, D, k) {
  const H = ptOf(a, D, `thigh${k}`, D.J[`hip${k}`]);
  const K = ptOf(a, D, `shin${k}`, D.J[`knee${k}`]);
  const A = ptOf(a, D, `foot${k}`, D.J[`ank${k}`]);
  const side = (P, Q, w) => {
    const dx = Q[0] - P[0];
    const dy = Q[1] - P[1];
    const L = Math.hypot(dx, dy) || 1;
    return [-dy / L * w, dx / L * w];
  };
  const n0 = side(H, K, 5.4);
  const n1 = side(H, A, 6.2);
  const n2 = side(K, A, 7);
  const B = [A[0], A[1] - 0.8];
  const pts = [[H[0] + n0[0], H[1] + n0[1] - 2], [K[0] + n1[0], K[1] + n1[1]], [B[0] + n2[0], B[1] + n2[1]], [B[0], B[1] + 1.4], [B[0] - n2[0], B[1] - n2[1]], [K[0] - n1[0], K[1] - n1[1]], [H[0] - n0[0], H[1] - n0[1] - 2]];
  loop(ctx, pts);
  if (mode === 'line') {
    paint(ctx, a, 'line');
    return;
  }
  ctx.fillStyle = tone(a, k === 'F' ? HAKAMA[2] : HAKAMA[1]);
  ctx.fill();
  ctx.save();
  loop(ctx, pts);
  ctx.clip();
  // its pleats and stripes, following the leg
  pen(ctx, tone(a, HAKAMA[3], 0.6), 0.45);
  for (const u of [-0.6, -0.2, 0.2, 0.6]) {
    ctx.beginPath();
    ctx.moveTo(H[0] + n0[0] * u, H[1] + n0[1] * u);
    ctx.quadraticCurveTo(K[0] + n1[0] * u * 1.05, K[1] + n1[1] * u * 1.05, B[0] + n2[0] * u, B[1] + n2[1] * u);
    ctx.stroke();
  }
  glow(ctx, K[0] + n1[0] * 0.4, K[1] - 2, 4, HAKAMA[0], k === 'F' ? 0.3 : 0.6);
  ctx.restore();
}
// White tabi and a straw zori on each foot.
function zori(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const an = D.J[`ank${k}`];
  // the sandal under it
  smooth(ctx, [[an[0] - 7, an[1] + 4.6], [an[0] + 11.6, an[1] + 4.6], [an[0] + 12, an[1] + 7.2], [an[0] - 7.4, an[1] + 7.2]]);
  paint(ctx, a, mode, ZORI[1], ZORI[2]);
  // the foot in its tabi
  smooth(ctx, [[an[0] - 6, an[1] - 3], [an[0] - 1, an[1] - 4.6], [an[0] + 5, an[1] - 2.4], [an[0] + 11, an[1] + 1], [an[0] + 11, an[1] + 4.8], [an[0] - 6.2, an[1] + 4.8]]);
  paint(ctx, a, mode, WHITE[1], WHITE[3]);
  if (mode === 'fill') {
    glow(ctx, an[0] + 3, an[1] - 1, 5, WHITE[0], 0.8);
    // the thong over the toes
    ctx.beginPath();
    ctx.moveTo(an[0] + 7, an[1] + 4.6);
    ctx.quadraticCurveTo(an[0] + 6, an[1] + 0.6, an[0] + 3.4, an[1] + 0.2);
    pen(ctx, tone(a, KIMONO[2]), 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const h = D.J[`hand${k}`];
  ell(ctx, h[0], h[1] + 0.6, 6.4, 6.6);
  if (mode === 'line') paint(ctx, a, 'line');
  else {
    ctx.fillStyle = tone(a, MASK);
    ctx.fill();
    glow(ctx, h[0] - 1.4, h[1] - 1.6, 4.4, FUR[2], 0.7);
  }
  ctx.restore();
}
// His bushy tail: two fluffy pieces, a paler underside, a silver tip.
function tail(ctx, a, mode, D) {
  for (let i = 1; i >= 0; i--) {
    ctx.save();
    enter(ctx, a, D, `tail${i}`);
    const p0 = TAIL[i];
    const p1 = TAIL[i + 1];
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    ctx.translate(p0[0], p0[1]);
    ctx.rotate(Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
    const w0 = i === 0 ? 8 : 9;
    const w1 = i === 0 ? 9 : 6.4;
    smooth(ctx, [[-2, -w0], [L * 0.5, -w1 - 1.2], [L + w1 * 0.8, -w1 * 0.4], [L + w1 * 0.8, w1 * 0.4], [L * 0.5, w1 + 1.2], [-2, w0]]);
    if (mode === 'line') paint(ctx, a, 'line');
    else {
      ctx.fillStyle = tone(a, FUR[2]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ell(ctx, L * 0.5, w1 * 0.8, L, w1 * 0.6);
      ctx.fillStyle = tone(a, FUR[1]);
      ctx.fill();
      ctx.fillStyle = tone(a, MASK);
      ctx.fillRect(L * 0.42, -12, 3.6, 24);
      if (i === 1) {
        ell(ctx, L + 3, 0, 6, 7.2);
        ctx.fillStyle = tone(a, WHITE[2]);
        ctx.fill();
      }
      glow(ctx, L * 0.3, -w0 * 0.5, w0, FUR[0], 0.5);
      ctx.restore();
    }
    ctx.restore();
  }
}

// ---------- His kettle (rig space, game px) ----------
// Where it hangs: its handle in his near paw, its body below, swung by its swing and tipped by its tilt.
const KH = 2.8;
const KR = [6.6, 5.4];
// Held up (kHold) it sits out in front of him on his paw, clear of his face; set down (kPlace) it stands on the floor in front of
// him; beaten, it lies dropped on its side.
function kettleAt(a, D) {
  const q = a.gk ?? {};
  const h = ptOf(a, D, 'handN', D.J.handN);
  const [bx] = ptOf(a, D, 'torso', D.J.hip);
  if (q.dropped) return { h, c: [bx + 15, -KR[0] * 0.92], ang: 1.45 };
  const sw = q.kSwing ?? 0;
  const tilt = q.kTilt ?? 0;
  const hold = clamp(q.kHold ?? 0, 0, 1);
  const place = clamp(q.kPlace ?? 0, 0, 1);
  const ch = [h[0] - Math.sin(sw) * (KH + KR[1]), h[1] + Math.cos(sw) * (KH + KR[1])];
  const co = [h[0] + KR[0] + 3, h[1] - 0.6];
  const cp = [bx + 14, -KR[1] * 0.98];
  const c = [mix(mix(ch[0], co[0], hold), cp[0], place), mix(mix(ch[1], co[1], hold), cp[1], place)];
  // (never through the floor: lowered too far, it rests on it)
  c[1] = Math.min(c[1], -KR[1] * 0.96);
  return { h, c, ang: mix(mix(sw + tilt, tilt, hold), 0, place) };
}
const spoutOf = (K) => {
  const ca = Math.cos(K.ang);
  const sa = Math.sin(K.ang);
  const p = [KR[0] + 3, -KR[1] * 1.05];
  return [K.c[0] + p[0] * ca - p[1] * sa, K.c[1] + p[0] * sa + p[1] * ca];
};
function kettle(ctx, a, mode, D) {
  const q = a.gk ?? {};
  const K = kettleAt(a, D);
  ctx.save();
  ctx.translate(...K.c);
  ctx.rotate(K.ang);
  const [rx, ry] = KR;
  const line = mode === 'line';
  // the handle (behind the lid, arching up to his paw)
  ctx.beginPath();
  ctx.moveTo(-rx * 0.62, -ry * 0.62);
  ctx.bezierCurveTo(-rx * 0.7, -ry - KH * 1.2, rx * 0.7, -ry - KH * 1.2, rx * 0.62, -ry * 0.62);
  pen(ctx, line ? IRON[3] : tone(a, IRON[2]), line ? 1.4 + LW * 2 : 1.4);
  ctx.stroke();
  // the spout, rooted inside the body, curving up and out
  smooth(ctx, [[rx * 0.6, -ry * 0.05], [rx + 1.8, -ry * 0.45], [rx + 3.3, -ry * 0.98], [rx + 2.6, -ry * 1.2], [rx + 1, -ry * 0.92], [rx * 0.45, -ry * 0.66]]);
  paint(ctx, a, mode, IRON[2], IRON[3]);
  // the body: a squat round iron pot
  smooth(ctx, [[-rx, -ry * 0.2], [-rx * 0.82, -ry * 0.8], [0, -ry], [rx * 0.82, -ry * 0.8], [rx, -ry * 0.2], [rx * 0.9, ry * 0.5], [rx * 0.5, ry * 0.92], [0, ry], [-rx * 0.5, ry * 0.92], [-rx * 0.9, ry * 0.5]]);
  if (line) paint(ctx, a, 'line', null, IRON[3]);
  else {
    ctx.fillStyle = tone(a, IRON[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, -rx * 0.4, -ry * 0.4, rx * 0.8, IRON[0], 0.75);
    glow(ctx, rx * 0.5, ry * 0.6, rx * 0.7, IRON[3], 0.7);
    // red-hot from inside when he heats it
    if ((q.hot ?? 0) > 0.02) glow(ctx, 0, ry * 0.3, rx * 1.1, '#ff7a3a', 0.7 * q.hot);
    // the hail studs (arare), in rows round it
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 7; i++) {
        const px = -rx * 0.75 + i * rx * 0.25 + (r % 2) * rx * 0.12;
        const py = -ry * 0.45 + r * ry * 0.38;
        ell(ctx, px, py, 0.42, 0.42);
        ctx.fillStyle = tone(a, IRON[0], 0.9);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  // its lid (rattling, or lifted off on its own) and gold knob
  const lift = q.lidUp ?? 0;
  ctx.save();
  ctx.translate(0, -ry * 0.92 - lift * 3);
  ctx.rotate((q.lidRattle ?? 0) + lift * 0.3);
  ell(ctx, 0, 0, rx * 0.55, ry * 0.2);
  paint(ctx, a, mode, IRON[2], IRON[3]);
  ell(ctx, 0, -ry * 0.22, 1.1, 0.8);
  paint(ctx, a, mode, GOLD[1], GOLD[2]);
  ctx.restore();
  ctx.restore();
}
// The little props in his far paw: a tiny teacup (his tea), the great bamboo whisk.
function nearCup(ctx, a, mode, D) {
  const q = a.gk ?? {};
  const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
  if ((q.cup ?? 0) > 0.02) {
    ctx.save();
    ctx.globalAlpha *= q.cup;
    ctx.translate(hx + 0.6, hy - 2.2);
    smooth(ctx, [[-2.2, -1.6], [2.2, -1.6], [1.8, 1.4], [-1.8, 1.4]]);
    paint(ctx, a, mode, '#fff8ee', '#a89880');
    if (mode === 'fill') {
      ell(ctx, 0, -1.5, 2, 0.5);
      ctx.fillStyle = tone(a, '#9ac46a');
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2, -0.9);
      ctx.lineTo(2, -0.9);
      pen(ctx, tone(a, KIMONO[1]), 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}
function farProp(ctx, a, mode, D) {
  const q = a.gk ?? {};
  const [hx, hy] = ptOf(a, D, 'handF', D.J.handF);
  if ((q.whisk ?? 0) > 0.02) {
    ctx.save();
    ctx.globalAlpha *= q.whisk;
    ctx.translate(hx, hy);
    ctx.rotate(q.whiskAng ?? 0);
    // the handle out of his paw, then the round bulb of tines
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, -6);
    pen(ctx, mode === 'line' ? ZORI[2] : tone(a, ZORI[1]), mode === 'line' ? 1.8 + LW * 2 : 1.8);
    ctx.stroke();
    smooth(ctx, [[-2.4, -6], [2.4, -6], [3.6, -9], [3, -12.4], [0, -14], [-3, -12.4], [-3.6, -9]]);
    paint(ctx, a, mode, ZORI[0], ZORI[2]);
    if (mode === 'fill') {
      pen(ctx, tone(a, ZORI[1]), 0.35);
      for (const x of [-2, -1, 0, 1, 2]) {
        ctx.beginPath();
        ctx.moveTo(x * 0.8, -6.2);
        ctx.quadraticCurveTo(x * 1.6, -10, x * 0.9, -13.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

// ---------- His act and fight ----------
const PIECES = { bow: 6.4, sniff: 7.2, stamp: 6.0, sip: 7.4 };
const ORDER = ['bow', 'sniff', 'stamp', 'sip'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tail0: 0, tail1: 0, kSwing: 0, kTilt: 0, kHold: 0, kPlace: 0, lidUp: 0, lidRattle: 0, hot: 0, cup: 0, whisk: 0, whiskAng: 0, bun: 0, beard: 0, swayN: 0, swayF: 0, dropped: false, fling: null, burst: -1, pourK: 0, sweat: -1, steamUp: 0, sniff: 0, zz: 0, stampT: -1, slamT: -1, sipT: -1 };
  a.gk = q;
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
  // at rest: upright and formal, the kettle held a little out from him, the far paw at his obi
  go({ shN: -14 + br * 1.5, elN: -54, hwN: 10, shF: -20, elF: -70, hwF: 10, tilt: -3, chest: -3, head: -2 }, 1);
  const u = a.blkidU ?? a.wp ?? 0;
  q.tail0 = 0.15 + Math.sin(t * 0.8) * 0.07 + Math.sin(u) * 0.08 * walking;
  q.tail1 = 0.45 + Math.sin(t * 0.8 - 0.7) * 0.1;
  q.kSwing = Math.sin(t * 1.1 + 0.5) * 0.04 + Math.sin(u - 0.9) * 0.12 * walking;
  q.swayN = Math.sin(u - 1.2) * walking * 0.8 + Math.sin(t * 1.1) * 0.15;
  q.swayF = Math.sin(u + 1.9) * walking * 0.8 + Math.sin(t * 1.1 + 1) * 0.15;
  q.bun = Math.sin(t * 1.3) * 0.06 + Math.sin(u * 2) * 0.08 * walking;

  // ----- Casting (world/story.js rotationTurn) and his kettle swing -----
  const casting = alive && m.cast && m.castPose;
  if (casting) {
    if (st.gkCastT0 !== m.cast.t0) {
      st.gkCastT0 = m.cast.t0;
      st.gkMove = m.castPose;
    }
  }
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.4;
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  // (a wound-up swing of the kettle outside a cast: the game's own wind-up, in a dungeon or a scene)
  const winding = alive && !casting && m.windup > 0;
  if (winding) {
    if (!(now - (st.gkWindAt ?? -9) < 0.2)) st.gkMove = 'swing';
    st.gkWindAt = now;
  }
  // (a swing of the kettle when you touch him: not after a cast)
  if (!casting && striking && alive && st.gkAtkAt !== m.attackAt) {
    st.gkAtkAt = m.attackAt;
    const afterCast = st.gkCastT0 != null && m.attackAt - st.gkCastT0 < 6 && m.attackAt >= st.gkCastT0 && st.gkLastStrike !== st.gkCastT0;
    if (afterCast) st.gkLastStrike = st.gkCastT0;
    else if (!(now - (st.gkWindAt ?? -9) < 0.2)) st.gkMove = 'swing';
  }
  const hadWind = now - (st.gkWindAt ?? -9) < Math.max(0, since) + 0.15;
  const mv = alive && (casting || striking || winding) ? st.gkMove : null;
  const cu = casting ? clamp((now - m.cast.t0) / m.cast.dur, 0, 1) : 1;
  const ct = casting ? now - m.cast.t0 : 99;
  let W = 1;
  if (casting) W = m.windup > 0 ? clamp(1 - m.windup / 0.5, 0, 1) : 0;
  else if (winding) W = clamp(1 - m.windup / total, 0, 1);
  else if (mv === 'swing' && !hadWind) W = since < 0.35 ? sstep(since / 0.35) : 1;
  const s = casting || winding ? -1 : mv === 'swing' && !hadWind ? since - 0.35 : since;
  const busy = Boolean(mv) || !alive;
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const cine = m.cine?.mood;
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;

  // ----- The act -----
  const calmGoal = !busy && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive ? 1 : 0;
  st.gkCalm = mix(st.gkCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.gkCalm);
  let PC = st.gkPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.gkOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.gkOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.gkOrd = (st.gkOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.gkPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  if (k > 0.001 && piece === 'bow') {
    // a formal bow, eyes shut, slow down and slow up
    const b = win(pu, 0.4, 1.8, 3.6, 5.0);
    go({ tilt: 26, chest: 10, head: 14, shF: 0, elF: -60, shN: -40, elN: -90 }, b * k);
    say('bow', b * k);
    say('calm', win(pu, 5.0, 5.2, 6.0, 6.4) * k);
  }
  if (k > 0.001 && piece === 'sniff') {
    // the kettle lifted to his nose, a long breath of the brew, content
    const lift = win(pu, 0.3, 1.2, 5.6, 6.6);
    go({ shN: -56, elN: -84, hwN: -20, head: 4, tilt: -2 }, lift * k);
    const breathe = win(pu, 1.4, 3.6, 4.0, 5.0);
    add({ chest: -5 * breathe, head: -6 * breathe }, k);
    q.sniff = breathe * k;
    say('content', win(pu, 1.3, 1.5, 6.0, 6.6) * k);
    q.steamUp = lift * k;
  }
  if (k > 0.001 && piece === 'stamp') {
    // something isn't right: arms folded, a stamp of his near foot, "hmph"
    const fold = win(pu, 0.3, 0.8, 5.0, 5.6);
    go({ shF: -60, elF: -110, tilt: -4 }, fold * k);
    say('cross', win(pu, 0.4, 0.6, 1.6, 1.8) * k);
    const up = win(pu, 1.6, 2.0, 2.2, 2.35);
    add({ fyN: -0.32 * up, tilt: -3 * up }, k);
    if (pu > 2.3 && pu < 3.1) q.stampT = pu - 2.3;
    const hm = win(pu, 2.4, 2.6, 4.6, 5.0);
    go({ head: -10, neckR: -4 }, hm * k);
    say('hmph', hm * k);
  }
  if (k > 0.001 && piece === 'sip') {
    // a tiny cup out of his sleeve, a sip, a sigh, bliss
    q.kPlace = Math.max(q.kPlace, win(pu, 0.2, 0.9, 6.6, 7.3) * k);
    q.cup = win(pu, 0.8, 1.2, 6.2, 6.6) * k;
    go({ shN: -50, elN: -90 }, win(pu, 0.8, 1.3, 6.2, 6.8) * k);
    const sip = win(pu, 1.6, 2.2, 3.6, 4.2);
    go({ shN: -96, elN: -124, head: -8 }, sip * k);
    say('bliss', win(pu, 1.8, 2.0, 6.2, 6.8) * k);
    if (pu > 4.2 && pu < 5.4) q.sipT = pu - 4.2;
  }

  if (fighting && alive && !st.gkHunt) st.gkBangAt = now;
  if (!fighting && st.gkHunt && alive) st.gkLostAt = now;
  st.gkHunt = fighting && alive;
  q.bang = now - (st.gkBangAt ?? -9);
  q.huh = now - (st.gkLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  if (fighting && alive && !hurt && !mv) {
    go({ tilt: 2, shN: -26, elN: -50, shF: -50, elF: -96 }, 1);
    q.face = 'stern';
  }
  if (low && !busy) {
    q.face = q.face ?? 'flustered';
    q.sweat = (t * 0.6) % 1;
  }

  // ----- His casts: acted out through the cast (cu), winding up at its end (W), landing (s) -----
  if (mv && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.55) / 0.55) : 0;
    const snap = s >= 0 ? sm5(s / (mv === 'swing' ? 0.32 : 0.22)) : 0;
    const wu = sstep(W) * (1 - snap);
    // (acted through the cast, and eased away with the landing after it)
    const perf = casting ? sstep(ct / 0.4) : s >= 0 ? sw : 0;
    if (mv === 'entrance') {
      // sipping, eyes shut; one eye opens on you; the cup away; the kettle up over his head; BOOM
      const sip = perf * (1 - sstep((cu - 0.5) / 0.12));
      q.cup = Math.max(q.cup, casting ? 1 - sstep((cu - 0.6) / 0.06) : 0);
      q.kPlace = Math.max(q.kPlace, casting ? 1 - sstep((cu - 0.7) / 0.06) : snap * sw * sstep((s - 0.1) / 0.1));
      go({ shN: -96, elN: -124, head: -6, tilt: -2 }, sip);
      say('bliss', casting && cu < 0.45 ? 1 : 0);
      say('peek', casting && cu >= 0.45 && cu < 0.62 ? 1 : 0);
      // (down for the kettle, then up with it)
      const reach = casting ? win(cu, 0.6, 0.68, 0.72, 0.8) : 0;
      go({ shN: -10, elN: -20, tilt: 10, head: 4 }, reach);
      const up = casting ? sstep((cu - 0.74) / 0.12) : 0;
      q.kHold = Math.max(q.kHold, up);
      go({ shN: -96, elN: -16, tilt: -6, head: -6 }, up * (1 - wu));
      say('cross', casting && cu >= 0.62 ? 1 : 0);
      go({ shN: -118, elN: -12, shF: -140, elF: -20, tilt: -12, head: -8, lift: -0.04 }, wu);
      q.kHold = Math.max(q.kHold, wu);
      say('puff', W > 0.05 ? 1 : 0);
      go({ shN: -30, elN: -16, shF: -30, elF: -40, tilt: 14, head: 8, lift: -0.06 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0.15 && s < 1.3) q.slamT = s - 0.15;
    } else if (mv === 'whisk') {
      // the great whisk out of his sleeve, whisked round and round, then flourished down
      q.whisk = Math.max(q.whisk, casting ? perf : sw);
      const r = ct * 9;
      go({ shF: -132 + Math.sin(r) * 30, elF: -50 + Math.cos(r) * 24, tilt: 2 + Math.sin(r) * 2 }, perf * (1 - wu));
      q.whiskAng = 0.3 + Math.sin(r) * 0.6;
      say('focus', perf);
      go({ shF: -170, elF: -10, tilt: -8 }, wu);
      go({ shF: 30, elF: -20, tilt: 14, head: 6 }, snap * sw);
      say('shout', snap * sw);
    } else if (mv === 'pour') {
      // the kettle lifted out and tipped: a stream from its spout
      go({ shN: -86, elN: -26, tilt: -4, shF: -60, elF: -70 }, Math.max(perf, sw));
      q.kTilt = 0.9 * Math.max(perf, sw) * (casting ? sstep(cu / 0.6) : 1);
      q.pourK = casting ? sstep((cu - 0.3) / 0.3) : sw;
      say('focus', perf);
      go({ tilt: 8, head: 4 }, snap * sw);
      say('grin', snap * sw);
    } else if (mv === 'lids') {
      // three lids flung up high, one after another, then a point down
      const throws = casting ? ct : 9;
      const ph = (throws % 0.55) / 0.55;
      const n = Math.floor(throws / 0.55);
      const on = 1 - sstep((throws - 1.5) / 0.35);
      // (each throw: the arm flung up, then back down for the next, never snapping round)
      go({ shF: mix(30, -170, sm5(ph / 0.45) * (1 - sm5((ph - 0.5) / 0.5))) }, perf * on);
      go({ elF: -30 }, perf * on);
      if (n < 3 && ph < 0.9) q.fling = { kind: 'lid', u: ph, n };
      go({ shF: -150, elF: -20, head: -14 }, perf * (1 - on) * (1 - wu));
      say('up', perf * (1 - on));
      say('grin', perf * on);
      go({ shF: -60, elF: -10, tilt: 8, head: 6 }, Math.max(wu, snap * sw));
      say('shout', Math.max(wu, snap * sw));
    } else if (mv === 'steam') {
      // its lid off, the kettle held up belching steam; a stamp
      go({ shN: -100, elN: -14, tilt: -6, head: -4 }, perf);
      q.kHold = Math.max(q.kHold, perf * (1 - snap * sw));
      q.lidUp = perf;
      q.steamUp = Math.max(q.steamUp, perf);
      say('grin', perf);
      add({ fyN: -0.34 * wu }, 1);
      go({ tilt: 10 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 0.9) q.stampT = s;
    } else if (mv === 'wave') {
      // the kettle up in both paws and tipped right over
      go({ shN: -104, elN: -12, shF: -120, elF: -30, tilt: -8, head: -6 }, Math.max(perf, sw));
      q.kHold = Math.max(q.kHold, Math.max(perf, sw));
      q.kTilt = (casting ? 1.1 * sstep(cu / 0.8) : 1.5) * Math.max(perf, sw);
      q.pourK = casting ? sstep((cu - 0.5) / 0.3) : sw;
      say('puff', perf);
      go({ tilt: 16, head: 8 }, snap * sw);
      say('shout', snap * sw);
    } else if (mv === 'cups') {
      // cups flung up out of his sleeve, again and again
      const ph = (ct % 0.4) / 0.4;
      const n = Math.floor(ct / 0.4);
      go({ shF: mix(30, -170, sm5(ph / 0.45) * (1 - sm5((ph - 0.5) / 0.5))), elF: -30 }, perf * (1 - wu));
      if (casting && ph < 0.9) q.fling = { kind: 'cup', u: ph, n };
      say('grin', perf);
      go({ shF: -110, elF: -10, shN: -70, elN: -20 }, Math.max(wu, snap * sw));
      say('shout', snap * sw);
    } else if (mv === 'infusion') {
      // the kettle set down glowing hot, both arms up; then down
      q.hot = casting ? sstep(cu / 0.6) : sw;
      q.lidRattle = Math.sin(now * 30) * 0.12 * q.hot;
      q.kHold = Math.max(q.kHold, perf * (1 - snap));
      go({ shN: -100, elN: -14, shF: -165, elF: -20, tilt: -8, head: -10 }, perf);
      q.kPlace = Math.max(q.kPlace, snap * sw * sstep((s - 0.08) / 0.1));
      say('shout', perf);
      go({ shN: -40, elN: -10, shF: -40, elF: -10, tilt: 16, head: 10, lift: -0.06 }, snap * sw);
      if (s >= 0.1 && s < 1.3) q.slamT = s - 0.1;
    } else {
      // Kettle Swing: wound back, then round at you
      go({ shN: 60, elN: -40, tilt: -8, head: -4 }, wu);
      say('focus', W);
      go({ shN: -120, elN: -10, tilt: 10, x: 0.03 }, snap * sw);
      say('shout', snap * sw);
      q.kSwing += -0.8 * wu + 1.0 * snap * sw;
    }
  }
  if (hurt && !mv) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -10, head: 12, neckR: 4, shF: -80, elF: -110 }, kh);
    q.face = 'hurt';
    q.bun += Math.sin(ago * 16) * 0.5 * kh;
    q.kSwing += Math.sin(ago * 12) * 0.4 * kh;
  }
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.2 && alive && !hurt && !mv) {
    const kg = win(gl, 0, 0.3, 0.8, 1.2);
    go({ head: -12, tilt: -4, shF: -60, elF: -110 }, kg);
    say('hmph', kg);
  }
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'content';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'cross';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) {
    q.face = 'dizzy';
    q.dropped = true;
  }
  let f = q.face ?? 'calm';
  if (f !== st.gkFace) {
    st.gkFaceFrom = st.gkFace;
    st.gkFace = f;
    st.gkFaceAt = now;
  }
  const since0 = now - (st.gkFaceAt ?? -9);
  if (since0 >= 0 && since0 < 0.07 && st.gkFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.gkFaceFrom) && f !== 'peek' && st.gkFaceFrom !== 'peek') f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.71) % 5.2;
  if (bl < 0.12 && !SHUTS.has(f) && f !== 'peek') f = 'shut';
  q.face = f;
  q.beard = -(out.head ?? 0) * 0.004 + Math.sin(t * 1.2) * 0.03;
  for (const key of ['tail0', 'tail1', 'kSwing', 'kTilt', 'kHold', 'kPlace', 'lidUp', 'hot', 'cup', 'whisk', 'whiskAng', 'bun', 'pourK', 'steamUp', 'sniff']) {
    const rate = key === 'kSwing' ? (mv ? 9 : 7) : key === 'whiskAng' ? 18 : 10;
    st[`gk_${key}`] = mix(st[`gk_${key}`] ?? q[key], q[key], ease(rate));
    q[key] = st[`gk_${key}`];
  }
}

// ---------- Live effects (rig space, game px, his feet at 0, 0) ----------
function puff(ctx, x, y, r, al, pass) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.88);
  if (pass === 'line') {
    ctx.lineWidth = Math.max(0.3, r * 0.25);
    ctx.strokeStyle = STEAM[2];
    ctx.stroke();
  } else {
    ctx.fillStyle = STEAM[1];
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
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = HAORI[1];
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = '#f6f2ff';
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, mark, e, dur, fl = false) {
  const k = Math.max(0, boing(e, 9, 18)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  // his marks sit in a little steam cloud
  for (const pass of ['line', 'fill']) {
    smooth(ctx, [[-4, -5.6], [0, -6.6], [4, -5.6], [6.2, -2.4], [5.6, 2.4], [2, 4.4], [0, 7], [-1.6, 4.4], [-5.6, 2.6], [-6.4, -1.8]]);
    if (pass === 'line') {
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.lineCap = 'round';
  ctx.strokeStyle = mark === '!' ? FAN[1] : HAORI[1];
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
function clangRings(ctx, x, y, u, s = 1) {
  if (u <= 0 || u >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - u;
  ctx.lineCap = 'round';
  for (const [col, w] of [[GOLD[2], 1.6], [GOLD[0], 0.7]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x, y, (3 + u * 10) * s, side * 0.9 - 0.45 - Math.PI / 2 + Math.PI / 2, side * 0.9 + 0.45);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function flyingLid(ctx, a, x, y, spin, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.6, 1.4, 0, 0, TAU);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = IRON[3];
  ctx.stroke();
  ctx.fillStyle = IRON[1];
  ctx.fill();
  ell(ctx, 0, -1, 0.7, 0.5);
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  ctx.restore();
}
function flyingCup(ctx, x, y, spin, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(spin);
  smooth(ctx, [[-1.8, -1.4], [1.8, -1.4], [1.5, 1.2], [-1.5, 1.2]]);
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = '#a89880';
  ctx.stroke();
  ctx.fillStyle = '#fff8ee';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-1.7, -0.7);
  ctx.lineTo(1.7, -0.7);
  ctx.lineWidth = 0.45;
  ctx.strokeStyle = KIMONO[1];
  ctx.stroke();
  ctx.restore();
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  tail(ctx, a, 'line', D);
  tail(ctx, a, 'fill', D);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.gk ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  const K = kettleAt(a, D);
  const sp = spoutOf(K);
  // (kept for the dev checks: where the kettle is this frame)
  q.kc = K.c;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -34]);
    dizzy(ctx, hx, hy, 8, a.now ?? 0, 3);
    cloud(ctx, [0, 1].map((i) => {
      const f = ((a.now ?? 0) * 0.4 + i * 0.5) % 1;
      return [sp[0] + f * 3, sp[1] - f * 8, 0.8 + f * 1.2, 0.5 * Math.sin(Math.PI * f)];
    }));
    ctx.globalAlpha = base;
    return;
  }
  // steam curling from the spout always (more when its lid is off, or when he heats it)
  {
    const L = [];
    const more = Math.max(q.steamUp ?? 0, q.hot ?? 0);
    for (let i = 0; i < 3 + Math.round(more * 3); i++) {
      const f = (t * (0.45 + more * 0.4) + i / (3 + Math.round(more * 3))) % 1;
      L.push([sp[0] + f * 3 + Math.sin(f * 5 + i) * 1.2, sp[1] - 1 - f * (10 + more * 14), 0.7 + f * 1.4 + more * 0.8, (0.35 + more * 0.6) * Math.sin(Math.PI * f) * 0.85]);
    }
    if ((q.lidUp ?? 0) > 0.05) {
      for (let i = 0; i < 4; i++) {
        const f = (t * 0.9 + i / 4) % 1;
        L.push([K.c[0] + Math.sin(f * 6 + i) * 2, K.c[1] - KR[1] - 2 - f * 22, 1.4 + f * 2.6, q.lidUp * Math.sin(Math.PI * f)]);
      }
    }
    cloud(ctx, L);
  }
  // the brew breathed in: the steam drawn up toward his nose
  if ((q.sniff ?? 0) > 0.05) {
    const [nx, ny] = headAt(a, D, [14, 6]);
    for (let i = 0; i < 3; i++) {
      const f = (t * 0.6 + i / 3) % 1;
      puff(ctx, mix(sp[0], nx, f), mix(sp[1], ny, f) - Math.sin(Math.PI * f) * 2, 0.7 + (1 - f) * 0.6, q.sniff * Math.sin(Math.PI * f) * 0.8, 'fill');
    }
  }
  // a sigh after the sip
  if ((q.sipT ?? -1) >= 0) {
    const [mx, my] = headAt(a, D, [18, 10]);
    const e = q.sipT / 1.2;
    cloud(ctx, [0, 1, 2].map((i) => [mx + 2 + e * 6 + i, my - e * 4 - i * 1.5, 0.8 + e * 1.2, (1 - e) * 0.8]));
  }
  // pouring: a stream of tea from the spout down to the floor
  if ((q.pourK ?? 0) > 0.05) {
    const x1 = sp[0] + 10;
    ctx.save();
    ctx.globalAlpha *= q.pourK;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...sp);
    ctx.quadraticCurveTo(sp[0] + 8, sp[1] - 1, x1, 0);
    ctx.globalAlpha *= 0.8;
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = 'rgba(232,170,90,0.85)';
    ctx.stroke();
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = '#fff6dc';
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const f = (t * 2.4 + i / 4) % 1;
      const dx = x1 - sp[0];
      ell(ctx, sp[0] + dx * f + Math.sin(i * 2) * 0.8, mix(sp[1], 0, f * f) - 0.6, 0.55, 0.65);
      ctx.fillStyle = `rgba(255,236,190,${0.9 * q.pourK * Math.sin(Math.PI * f)})`;
      ctx.fill();
    }
    cloud(ctx, [0, 1, 2].map((i) => {
      const f = (t * 1.2 + i / 3) % 1;
      return [x1 + (i - 1) * 2.4, -1 - f * 6, 0.8 + f, q.pourK * Math.sin(Math.PI * f) * 0.8];
    }));
  }
  // lids and cups flung up out of his far paw
  if (q.fling) {
    const [hx, hy] = ptOf(a, D, 'handF', D.J.handF);
    const e = q.fling.u;
    const y = hy - sstep(e / 0.9) * 60;
    const x = hx + (q.fling.n % 3 - 1) * 4 * e;
    if (q.fling.kind === 'lid') flyingLid(ctx, a, x, y, e * 14, 1 - sstep((e - 0.7) / 0.2));
    else flyingCup(ctx, x, y, e * 10 + q.fling.n, 1 - sstep((e - 0.7) / 0.2));
  }
  // the whisk's froth flicking off it
  if ((q.whisk ?? 0) > 0.3) {
    const [hx, hy] = ptOf(a, D, 'handF', D.J.handF);
    const an = q.whiskAng ?? 0;
    const tx = hx + Math.sin(an) * 12;
    const ty = hy - Math.cos(an) * 12;
    for (let i = 0; i < 3; i++) {
      const f = (t * 2 + i / 3) % 1;
      puff(ctx, tx + Math.cos(i * 2.1 + t * 6) * (2 + f * 6), ty + Math.sin(i * 2.1 + t * 6) * (2 + f * 4), 0.6 + f * 0.6, (1 - f) * q.whisk * 0.9, 'fill');
    }
  }
  // the stamp: a puff of dust-steam at his foot
  if ((q.stampT ?? -1) >= 0 && q.stampT < 0.8) {
    const e = q.stampT / 0.8;
    const [fx0] = ptOf(a, D, 'footN', D.J.ankN);
    cloud(ctx, [-1, 1].map((d) => [fx0 + d * (2 + e * 9), -1.2, 1.4 * (1 - e * 0.4), 1 - e]));
    clangRings(ctx, fx0, -2, e, 0.8);
  }
  // the slam (his entrance's BOOM, the infusion's): the kettle down, a burst of steam and gold rings
  if ((q.slamT ?? -1) >= 0 && q.slamT < 1.2) {
    const e = q.slamT / 1.2;
    const x = K.c[0];
    const y = Math.min(0, K.c[1] + KR[1]);
    cloud(ctx, Array.from({ length: 8 }, (_, i) => {
      const an = Math.PI * (1.05 + (i / 7) * 0.9);
      const d = 4 + sstep(e / 0.6) * 22;
      return [x + Math.cos(an) * d, y - 2 + Math.sin(an) * d * 0.5, 2 + e * 3, 1 - e];
    }));
    clangRings(ctx, x, y - 4, Math.min(1, e * 1.4), 1.6);
  }
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const e = q.hurtT / 0.5;
    cloud(ctx, [0, 1].map((i) => [sp[0] + i * 3 - 1, sp[1] - 2 - e * 6, 1 + e, 1 - e]));
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-20, -6]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.2, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [12, -36]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.42 + i * 0.5) % 1;
      zee(ctx, hx + f * 6, hy - f * 9, 0.7 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [16, -42]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.2) {
    const e = q.gloatT / 1.2;
    const [hx, hy] = headAt(a, D, [22, 10]);
    cloud(ctx, [[hx + 2 + e * 5, hy - e * 3, 0.9 + e, 1 - e]]);
    sparkle(ctx, bx - 6 + e * 4, by + 10 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, '#fff2c8');
  }
  ctx.globalAlpha = base;
  void hash;
}

const DRESS = {
  id: 'grandkettle',
  skin: { lt: KIMONO[0], base: KIMONO[1], sh: KIMONO[2], deep: KIMONO[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: JOINTS,
  softParts: SOFTS,
  under2,
  under: {
    handNskin: (ctx, a, mode, S, D) => kettle(ctx, a, mode, D),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => robes(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => {
      paw(ctx, a, mode, D, 'F');
      farProp(ctx, a, mode, D);
    },
    legF: (ctx, a, mode, S, D) => hakamaLeg(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => zori(ctx, a, mode, D, 'F'),
    legN: (ctx, a, mode, S, D) => hakamaLeg(ctx, a, mode, D, 'N'),
    footNskin: (ctx, a, mode, S, D) => zori(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => {
      paw(ctx, a, mode, D, 'N');
      nearCup(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('grandtanuki', DRESS);
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
rig.h = Math.round(rig.h * BIG * 1.45);
export const GRAND_KETTLE_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const GRAND_KETTLE_SIZE = { w: 70, h: Math.round(R.H * BIG * 1.06), speed: Math.round(R.speed * BIG) };
