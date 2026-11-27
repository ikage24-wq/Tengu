// The Pangolin Sentry (2026-11-26, the Twilight Ruins' Dullahan remade from scratch as a new creature; the
// id stays `boneknight`). Twenty years ago the Moon Maiden's temple had a guard, and the guard had a
// mascot: a little pangolin in a helmet. The war ended, the guard went home, and nobody told the
// pangolins. They still patrol the Sunken Crypt on their hind legs, the way real pangolins walk, forelimbs
// tucked up in front, tail held out for balance, wearing the old Moon Guard's dented bronze helmets with
// the crescent on the front and a pink plume on top. Armour of their own: rows of round dusk-lilac
// scales from crown to tail tip, a little moss grown on them (the ruins' moss), a pale soft belly. They
// dig in the crypt floor for old relics (bone shards, moonstones) and curl up to nap on duty.
// On his own copy of the creature base (rig.js; body.js `pangolin`: a pear of a body, a round belly,
// short sturdy legs, short arms), dressed here; his head, scales, helmet, tail and claws drawn here from
// scratch over the mannequin (never the shared face, never the hero's body).
//   look    a round head with a short tapered snout and a pink button nose; his own eyes ("sentry
//           eyes": round and earnest, a plum-brown iris warming to rose at the bottom, a big round glint
//           and a crescent-moon glint, a neat lash line with one round flick, a soft lower lid); little
//           round brows that do his acting; the helmet with its crescent and its plume (sprung); a cape of
//           round scales down his back, each lit at its rim by the dusk; a long scaled tail in three sprung
//           pieces; round ivory claws. His own soft plum outline, outer edge only, face bare.
//   walk    the base's walk at his own short-legged pace, his forelimbs held up in front of his chest,
//           his tail swaying behind for balance.
//   idle    a 31 s act in four pieces, each the next one that fits the time he has before he moves on
//           (data `rest`; world/mobs.js tells him, `m.restUntil`):
//           - salute (7.2 s): at attention, chest out, the Moon Guard's salute (claw across his heart, a
//             smart nod); the nod tips his helmet down onto his brows, he looks up at it, tosses his head
//             and it's back, a sheepish cough;
//           - dig (8.2 s): a sniff along the floor, a dig (dirt flying), and he turns up a little
//             moonstone; he holds it up, delighted, and tucks it under his scales;
//           - nap (8.6 s): a yawn, he sits down and curls up round his tail, z's... a start, a look left
//             and right, and a quick salute: he was NOT asleep;
//           - polish (7.0 s): he bows his head down to his claws and lifts his helmet off, breathes on its
//             crescent, rubs it with his forearm, holds it up to admire it, and bows to put it back on.
//   moves   Helmet Bash (a scrape of his foot, head lowered; then a charge, helmet first, CLANG); Rubble
//           Fling (a crouch, digging hard; then a clod of crypt rubble flung at you); Tail Sweep (his
//           tail cocked high over his back; then a spin, two clean mirror flips, the tail sweeping low
//           through you in a swoosh of dust).
//   else    hurt: a squeezed wince, a flinch, his helmet clanging; after landing a hit: a proud nod;
//           hunting you: brows down, head lowered, claws up; low on health: worried, a bead of sweat; a
//           nap (habitat): sat down, curled up round his tail; beaten: dizzy. His marks over his head (!, ?, z's,
//           sweat) are his own (`ownEmotes`).
// Every effect is drawn here, live, in his own soft style: dust as soft warm-lilac puffs, rubble as round
// stones, the clang as soft gold arcs and the game's curvy sparkles.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, pen, glow, sparkle, dust, rubble, sweat, dizzy } from './fx.js';

const BIG = 1.3;
const LW = 1.6 / BIG;
const INK = '#5c5088';
const SCALE = ['#efe8fb', '#c8bce2', '#9f92c6', '#776b9f'];
const RIM = '#ffd9c4';
const FACE = ['#fff7f0', '#fbe4d8', '#efc6b4', '#d9a492'];
const FACE_INK = '#b88676';
const BRONZE = ['#ffecc0', '#e4a958', '#b47638', '#7e4e26'];
const BRONZE_INK = '#6e4422';
const PLUME = ['#ffd0e0', '#e888ac', '#c0608a'];
const PLUME_INK = '#9a4068';
const CLAW = ['#fffaf0', '#efe2cc', '#cdb89a'];
const MOSS = ['#e2f6c2', '#a8d886', '#78b464', '#56904e'];
const NOSE = ['#ffb4c4', '#f07e9a', '#c85a78'];
const LASH = '#3a2440';
const IRIS = ['#3a1e2e', '#7a3e5a', '#b4688a', '#f2b6c8'];
const DUST = ['#f4ecf6', '#c4b4cc'];
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
// A bone's frame in the base's kid-box units.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const PIV2 = { tail0: 'tail0', tail1: 'tail1', tail2: 'tail2', plume: 'plume' };
const pivOf = (D, bone) => D.J[D.PIV[bone] ?? PIV2[bone]];
function enter2(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = pivOf(D, bone);
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => {
  const q = pivOf(D, bone);
  return D.at(a, bone, [(p[0] - q[0]) * D.SC, (p[1] - q[1]) * D.SC]);
};
// ---------- His head (head units about the middle of his skull, drawn 1.25x: a big chibi head) ----------
const HS = 1.25;
const HO = [1, -20];
const headK = (D, [u, v]) => [D.J.neck[0] + (HO[0] + u) * HS, D.J.neck[1] + (HO[1] + v) * HS];
const headAt = (a, D, uv) => ptOf(a, D, 'head', headK(D, uv));
function headFrame(ctx, a, D) {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
}

// ---------- His loose pieces ----------
const TAIL = [[70, 118], [57, 124], [46, 132], [37, 138]];
const PLUME_AT = [1, -27];
// (the plume's root, on top of the helmet: the body's neck joint (body.js `pangolin`) plus the head's
// offset, in kid units)
const NECK = [80.9, 88.2];
const JOINTS = { tail0: TAIL[0], tail1: TAIL[1], tail2: TAIL[2], plume: [NECK[0] + (HO[0] + PLUME_AT[0]) * HS, NECK[1] + (HO[1] + PLUME_AT[1]) * HS] };
const SOFTS = [
  { name: 'tail0', parent: 'torso', pivot: 'tail0', rot: (S, a) => a.pg?.tail0 ?? 0, soft: { k: 90, c: 8, gain: 0.35, turn: 0.6, max: 10, dir: [-10, 4] } },
  { name: 'tail1', parent: 'tail0', pivot: 'tail1', rot: (S, a) => a.pg?.tail1 ?? 0, soft: { k: 70, c: 6.6, gain: 0.45, turn: 0.8, max: 16, dir: [-8, 6] } },
  { name: 'tail2', parent: 'tail1', pivot: 'tail2', rot: (S, a) => a.pg?.tail2 ?? 0, soft: { k: 56, c: 5.6, gain: 0.5, turn: 0.85, max: 22, flutter: 2, hz: 0.5, dir: [-7, 4] } },
  { name: 'plume', parent: 'head', pivot: 'plume', soft: { k: 80, c: 5, gain: 0.55, turn: 0.9, max: 22, flutter: 3, hz: 0.6, dir: [0, -6] } },
];

// ---------- His face ----------
// eye: open | wide | happy | squeeze | shut | sleep | dizzy; gaze [x, y]; tilt the lash line's slant
// (+ cross, - worried), above the iris; brow [outer, inner] (+ lower).
const FACES = {
  calm: { e: 'open', g: [0.5, 0.3], b: [0, 0], m: 'calm' },
  proud: { e: 'open', g: [0.6, 0.1], b: [-0.6, -0.4], m: 'smile' },
  happy: { e: 'happy', b: [-0.8, -0.8], m: 'open' },
  gasp: { e: 'wide', g: [0.4, 0.6], b: [-1.6, -1.8], m: 'o' },
  up: { e: 'open', g: [0.2, -2.2], b: [-1.2, -1.6], m: 'o' },
  sheepish: { e: 'happy', b: [0.8, -1.4], m: 'wobble' },
  sniff: { e: 'shut', b: [0, -0.4], m: 'calm' },
  focus: { e: 'open', g: [1.2, 1.2], b: [-0.4, 1.4], m: 'set', tilt: 0.5 },
  fierce: { e: 'open', g: [1.4, 0.4], b: [-1, 2.2], m: 'set', tilt: 1 },
  shout: { e: 'squeeze', b: [-0.8, 2], m: 'shout' },
  hurt: { e: 'squeeze', b: [1.4, -1.8], m: 'wobble' },
  surprised: { e: 'wide', g: [0.2, -0.4], b: [-2, -2.2], m: 'o' },
  panic: { e: 'wide', g: [1.6, 0.3], b: [1, -2], m: 'wobble' },
  panicL: { e: 'wide', g: [-1.6, 0.3], b: [1, -2], m: 'wobble' },
  worried: { e: 'open', g: [0.4, 0.9], b: [1.4, -1.8], m: 'wobble', tilt: -0.7 },
  sad: { e: 'open', g: [0.2, 1.4], b: [1.6, -2], m: 'frown', tilt: -0.9 },
  yawn: { e: 'squeeze', b: [0.6, -1.2], m: 'yawn' },
  sleep: { e: 'sleep', b: [0.4, 0.4], m: 'sleep' },
  shut: { e: 'shut', b: [0, 0], m: 'calm' },
  dizzy: { e: 'dizzy', b: [1, -1.2], m: 'wobble' },
  hah: { e: 'open', g: [0.8, 0.8], b: [0, 0], m: 'o' },
  talkA: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkA' },
  talkE: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'talkE' },
  talkO: { e: 'open', g: [0.6, 0.3], b: [0, 0], m: 'o' },
};
const SHUTS = new Set(['happy', 'sheepish', 'sniff', 'shout', 'hurt', 'yawn', 'sleep', 'shut', 'dizzy']);

// One eye (head units): x, y its middle; o +1 the near eye, -1 the far.
function eye(ctx, a, x, y, o, f) {
  const w = 4.6;
  const h = 5.2;
  const L = LASH;
  const kind = f.e;
  const line = (pts, wd, col) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    pen(ctx, tone(a, col), wd);
    ctx.stroke();
  };
  const curve3 = (p0, c, p1, wd, col) => {
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.quadraticCurveTo(...c, ...p1);
    pen(ctx, tone(a, col), wd);
    ctx.stroke();
  };
  if (kind === 'happy') {
    curve3([x - w, y + 1.2], [x, y - h * 1.1], [x + w, y + 1.2], 1.3, L);
    curve3([x + w * 0.8, y + 0.2], [x + w * 1.2, y - 0.6], [x + w * 1.3, y - 1.8], 0.9, L);
    return;
  }
  if (kind === 'squeeze') {
    curve3([x - w, y - 2], [x - w * 0.1, y - 0.4], [x + w * 0.9, y + 0.2], 1.3, L);
    curve3([x - w * 0.9, y + 2.2], [x, y + 1.2], [x + w * 0.9, y + 0.4], 1.1, L);
    return;
  }
  if (kind === 'shut' || kind === 'sleep') {
    const d = kind === 'sleep' ? 2.4 : 1.8;
    curve3([x - w, y], [x, y + d * 1.6], [x + w, y], 1.3, L);
    curve3([x + w * 0.96, y + 0.1], [x + w * 1.24, y - 0.4], [x + w * 1.26, y - 1.4], 0.9, L);
    return;
  }
  const big = kind === 'wide' ? 1.08 : 1;
  // the white: a round eye, a touch taller than wide
  ell(ctx, x, y, w * big, h * big);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  if (kind === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = u * TAU * 1.6 * o;
      const px = x + Math.cos(an) * u * w * 0.7;
      const py = y + Math.sin(an) * u * h * 0.66;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, tone(a, IRIS[1]), 0.8);
    ctx.stroke();
    curve3([x - w, y - h * 0.4], [x, y - h * 1.25], [x + w, y - h * 0.5], 1.4, L);
    return;
  }
  const [gx, gy] = f.g ?? [0.5, 0.3];
  const ix = x + gx;
  const iy = y + gy + 0.4;
  const ir = kind === 'wide' ? 0.82 : 1;
  const iw = w * 0.74 * ir;
  const ih = h * 0.78 * ir;
  ell(ctx, ix, iy, iw, ih);
  ctx.fillStyle = tone(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + 0.25, iw * 0.84, ih * 0.86);
  ctx.fillStyle = tone(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + ih * 0.4, iw * 0.62, ih * 0.38);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy + 0.1, iw * 0.42 * ir, ih * 0.44 * ir);
  ctx.fillStyle = tone(a, '#24101c');
  ctx.fill();
  // glints: a big round one, and his crescent moon low on the near side
  ell(ctx, ix - 1.2, iy - 1.6, 1.3 * ir, 1.2 * ir);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const cx = ix + 1.3;
  const cy = iy + 1.5;
  ell(ctx, cx, cy, 0.95, 0.95);
  ctx.fillStyle = tone(a, '#fff2d6');
  ctx.fill();
  ell(ctx, cx + 0.45, cy - 0.3, 0.8, 0.8);
  ctx.fillStyle = tone(a, IRIS[2]);
  ctx.fill();
  // the lash line: thin at the inner corner, thicker out to one round flick; above the iris always
  const ti = f.tilt ?? 0;
  const inner = o > 0 ? x - w : x + w;
  const outer = o > 0 ? x + w : x - w;
  ctx.beginPath();
  ctx.moveTo(inner, y - h * 0.3 + ti * 0.8);
  ctx.quadraticCurveTo(x, y - h * 1.24 + ti * 0.3, outer, y - h * 0.42);
  pen(ctx, tone(a, L), 1.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - o * w * 0.2, y - h * 1.0 + ti * 0.4);
  ctx.quadraticCurveTo(x + o * w * 0.6, y - h * 1.12, outer, y - h * 0.42);
  pen(ctx, tone(a, L), 1.6);
  ctx.stroke();
  curve3([outer, y - h * 0.5], [outer + o * w * 0.3, y - h * 0.7], [outer + o * w * 0.4, y - h * 0.98], 0.9, L);
  // the lower lid: a short soft line under the outer half
  curve3([x, y + h * 0.96], [x + o * w * 0.5, y + h * 0.92], [x + o * w * 0.86, y + h * 0.6], 0.55, '#b48aa6');
}
// A little round brow (head units), over an eye; its [outer, inner] lift.
function brow(ctx, a, x, y, o, b) {
  const [bo, bi] = b ?? [0, 0];
  ctx.beginPath();
  ctx.moveTo(x - o * 3.2, y + bi * 0.7);
  ctx.quadraticCurveTo(x, y - 1.2 + (bo + bi) * 0.35, x + o * 3.2, y + bo * 0.7);
  pen(ctx, tone(a, SCALE[3]), 1.5);
  ctx.stroke();
}
function mouth(ctx, a, x, y, m) {
  const LIP = '#8a3a52';
  const open = (w, h) => {
    smooth(ctx, [[x - w, y], [x, y - 0.3], [x + w, y], [x + w * 0.7, y + h], [x, y + h * 1.2], [x - w * 0.7, y + h]]);
    ctx.fillStyle = tone(a, '#8a2e4a');
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
      stroke([[x - 2, y - 0.4], [x, y + 1.4], [x + 2.2, y - 0.6]]);
      break;
    case 'open':
      open(2.2, 2.2);
      break;
    case 'o':
      ell(ctx, x, y + 0.6, 1.0, 1.2);
      ctx.fillStyle = tone(a, '#8a2e4a');
      ctx.fill();
      break;
    case 'shout':
      open(2.4, 2.8);
      break;
    case 'yawn':
      open(1.8, 3.2);
      break;
    case 'set':
      stroke([[x - 1.8, y + 0.4], [x, y - 0.2], [x + 1.8, y + 0.5]], 0.9);
      break;
    case 'wobble':
      stroke([[x - 2, y + 0.4], [x - 1, y - 0.4], [x, y + 0.3], [x + 1, y - 0.4], [x + 2, y + 0.4]], 0.75);
      break;
    case 'frown':
      stroke([[x - 1.8, y + 0.8], [x, y - 0.2], [x + 1.8, y + 0.8]]);
      break;
    case 'sleep':
      ell(ctx, x, y + 0.4, 0.7, 0.6);
      ctx.fillStyle = tone(a, '#8a2e4a');
      ctx.fill();
      break;
    case 'talkA':
      open(1.6, 1.8);
      break;
    case 'talkE':
      open(2.0, 1.0);
      break;
    default:
      // at rest: a small soft "w" of a muzzle mouth, one corner up a touch (earnest)
      stroke([[x - 1.8, y - 0.2], [x - 0.9, y + 0.9], [x, y + 0.1], [x + 0.9, y + 0.9], [x + 1.9, y - 0.5]], 0.75);
  }
}

// ---------- His head ----------
// The skull and snout as one soft outline (head units, facing right).
const SKULL = [[-19, -4], [-18, -12], [-12, -18], [-2, -20], [8, -18], [15, -12], [18, -4], [21, 1], [25, 4.6], [26.4, 7.6], [24.4, 10.6], [19, 12], [12, 15], [4, 18], [-6, 17.4], [-14, 13], [-18.6, 5]];
// The helmet: a round bronze cap (head units, about its own middle), its brim and crescent.
const HELM = [[-18, -9], [-17, -15], [-12.6, -21], [-5, -24.6], [4, -25], [11.4, -22], [16.6, -16], [18.4, -9.6], [19.6, -6.4], [-18.8, -6.4]];
function helmet(ctx, a, mode, D) {
  const q = a.pg ?? {};
  ctx.save();
  // (lifted off in his near hand: drawn along a blend from his head to his hand)
  smooth(ctx, HELM);
  if (mode === 'line') {
    paint(ctx, a, 'line', null, BRONZE_INK, LW / HS * 1.2);
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, BRONZE[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 14, -10, 12, BRONZE[3], 0.55);
  glow(ctx, -7, -19, 10, BRONZE[0], 0.95);
  // a dent on its far side, a metal sheen streak, the ridge along its crown
  ell(ctx, -10.6, -14, 2.8, 1.8, -0.5);
  ctx.fillStyle = tone(a, BRONZE[2], 0.7);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.quadraticCurveTo(-8, -20, -2, -22.6);
  pen(ctx, 'rgba(255,255,255,0.75)', 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-12, -19.4);
  ctx.quadraticCurveTo(0, -28.6, 13, -20);
  pen(ctx, tone(a, BRONZE[2]), 1.1);
  ctx.stroke();
  // the brim band
  ctx.fillStyle = tone(a, BRONZE[2]);
  ctx.fillRect(-24, -10, 48, 3.8);
  ctx.fillStyle = tone(a, BRONZE[1]);
  ctx.fillRect(-24, -10, 48, 1.1);
  ctx.restore();
  // the crescent on its front, catching the light (a glint after he polishes it)
  ctx.save();
  ctx.translate(8, -16.4);
  ctx.rotate(-0.5);
  ctx.beginPath();
  ctx.arc(0, 0, 3.8, -Math.PI * 0.62, Math.PI * 0.62, true);
  ctx.quadraticCurveTo(-0.6, 0, Math.cos(-Math.PI * 0.62) * 3.8, Math.sin(-Math.PI * 0.62) * 3.8);
  ctx.closePath();
  ctx.fillStyle = tone(a, '#fff6d8');
  ctx.fill();
  pen(ctx, tone(a, BRONZE[3]), 0.5);
  ctx.stroke();
  ctx.restore();
  if ((q.shine ?? 0) > 0.02) sparkle(ctx, 10, -19, 3.4 * q.shine, q.shine, '#ffffff');
  ctx.restore();
}
// The plume: a soft round tuft of three lobes (in its own sprung frame, head units about its root).
function plume(ctx, a, mode) {
  const pts = [[-2.6, 1], [-4.6, -3], [-4, -7.4], [-1.4, -9.6], [1, -12], [4, -11], [5.4, -8], [7.6, -6], [7, -2.4], [3, 1]];
  smooth(ctx, pts);
  if (mode === 'line') return paint(ctx, a, 'line', null, PLUME_INK, LW / HS * 1.2);
  ctx.fillStyle = tone(a, PLUME[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, -1, -8, 6, PLUME[0], 0.9);
  glow(ctx, 5, -2, 5, PLUME[2], 0.6);
  ctx.restore();
}
// Rows of round scales (head or kid units): each a soft U plate, lit at its rim, in rows that overlap
// downward; `rows` [[y, x0, x1, size], ...].
function scales(ctx, a, rows, col = SCALE, rim = 0.5) {
  rows.forEach(([y, x0, x1, sz], ri) => {
    const n = Math.max(1, Math.round((x1 - x0) / (sz * 1.6)));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n + (ri % 2 ? sz * 0.8 : 0);
      if (x > x1 + sz * 0.3) continue;
      // a round shingle: flat colour, its lower edge a deeper line, the dusk catching its rim
      ctx.beginPath();
      ctx.moveTo(x - sz, y - sz * 0.4);
      ctx.quadraticCurveTo(x - sz, y + sz * 1.05, x, y + sz * 1.1);
      ctx.quadraticCurveTo(x + sz, y + sz * 1.05, x + sz, y - sz * 0.4);
      ctx.closePath();
      ctx.fillStyle = tone(a, ri === 0 ? col[1] : mixHex(col[1], col[2], Math.min(0.6, ri * 0.15)));
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - sz * 0.9, y + sz * 0.2);
      ctx.quadraticCurveTo(x - sz * 0.88, y + sz * 1.0, x, y + sz * 1.04);
      ctx.quadraticCurveTo(x + sz * 0.88, y + sz * 1.0, x + sz * 0.9, y + sz * 0.2);
      pen(ctx, tone(a, col[3]), sz * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - sz * 0.45, y + sz * 0.82);
      ctx.quadraticCurveTo(x, y + sz * 0.94, x + sz * 0.5, y + sz * 0.8);
      pen(ctx, tone(a, RIM, rim), sz * 0.16);
      ctx.stroke();
    }
  });
}
const mixHex = (c0, c1, u) => {
  const p = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const A = p(c0);
  const B = p(c1);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join('')}`;
};
function head(ctx, a, mode, D) {
  const q = a.pg ?? {};
  const f = FACES[q.face] ?? FACES.calm;
  ctx.save();
  headFrame(ctx, a, D);
  // his little round ear, low at the back of his head
  ell(ctx, -17.4, 4.4, 3.6, 3.2);
  paint(ctx, a, mode, FACE[2], FACE_INK);
  smooth(ctx, SKULL);
  paint(ctx, a, mode, SCALE[2]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, SKULL);
    ctx.clip();
    // his pale face: the cheeks, round his eyes and down the snout; the scaled crown above
    smooth(ctx, [[-16, 0], [-10, -6.4], [0, -8.6], [12, -7], [19, -2], [24, 3], [27, 8], [24, 12], [14, 16.6], [2, 19], [-10, 17], [-17, 10]]);
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    glow(ctx, 2, -2, 14, FACE[0], 0.8);
    glow(ctx, -14, 12, 10, FACE[2], 0.6);
    glow(ctx, 22, 9, 6, FACE[2], 0.4);
    // the scales of his crown, rows down to his brow
    scales(ctx, a, [[-22, -12, 12, 4.6], [-16.4, -15, 13, 4.4], [-11, -17, -6, 4]]);
    ell(ctx, -17.4, 4.4, 2, 1.8);
    ctx.fillStyle = tone(a, NOSE[0], 0.8);
    ctx.fill();
    ctx.restore();
    // cheeks
    for (const [cx, k] of [[-6, 0.75], [15, 1]]) {
      ell(ctx, cx, 8.4, 3.2, 1.9);
      ctx.fillStyle = tone(a, '#ff9cb0', 0.55 * k);
      ctx.fill();
    }
    eye(ctx, a, -5.4, 1.4, -1, f);
    eye(ctx, a, 9.6, 1.2, 1, f);
    brow(ctx, a, -5.6, -6.6, -1, f.b);
    brow(ctx, a, 9.6, -6.8, 1, f.b);
    // the nose: a pink button at the snout's tip, twitching when he sniffs
    const tw = q.sniff ? Math.sin((a.now ?? 0) * 30) * 0.35 : 0;
    ell(ctx, 24.6 + tw, 6.8, 2.3, 1.8, -0.2);
    ctx.fillStyle = tone(a, NOSE[1]);
    ctx.fill();
    ell(ctx, 24 + tw, 6.1, 0.9, 0.55, -0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    mouth(ctx, a, 17.6, 12.6, f.m);
  }
  ctx.restore();
}
// The helmet and its plume, on his head or lifted off in his near hand (blended between).
function helmetOn(ctx, a, mode, D) {
  const q = a.pg ?? {};
  const off = sstep(q.helmOff ?? 0);
  ctx.save();
  // (on his head, or lifted off in his near hand: the head's frame and the hand's, blended)
  let M = headMat(a, D, q);
  if (off > 0.001) {
    const Mn = handMat(a, D);
    M = M.map((v, i) => mix(v, Mn[i], off));
  }
  ctx.transform(...M);
  helmet(ctx, a, mode, D);
  // the plume, on top of the helmet wherever it is, swinging on its own spring
  const d = Math.atan2(a.blMat('plume')[1], a.blMat('plume')[0]) - Math.atan2(a.blMat('head')[1], a.blMat('head')[0]);
  ctx.translate(PLUME_AT[0], PLUME_AT[1] + 2);
  ctx.rotate(Math.atan2(Math.sin(d), Math.cos(d)));
  plume(ctx, a, mode);
  ctx.restore();
}
// The helmet's frame: the head's, slipped forward and down when it slips.
function headMat(a, D, q) {
  const M = a.blMat('head');
  const n = D.J.neck;
  const p = D.J[D.PIV.head];
  const sc = D.SC;
  // (head units: about the head's middle, its slip down over his brow and its tilt)
  const ox = (n[0] - p[0] + HO[0] * HS) * sc;
  const oy = (n[1] - p[1] + (HO[1] + (q.slip ?? 0) * 4) * HS) * sc;
  const r = (q.slip ?? 0) * 0.22 + (q.clank ?? 0);
  const c = Math.cos(r) * HS * sc;
  const s = Math.sin(r) * HS * sc;
  return mulM(M, [c, s, -s, c, ox, oy]);
}
function handMat(a, D) {
  // (held upright by its brim in his claws: placed in the rig's own space at his hand, not turned with it)
  const M = a.blMat('handN');
  const sc = D.SC;
  const [hx, hy] = ptOf(a, D, 'handN', D.J.handN);
  const k = Math.hypot(M[0], M[1]) * HS * sc * 0.92;
  // (the brim, 8 head units under the helmet's middle, sits just over his claws)
  return [k, 0, 0, k, hx + 1, hy - 1 + 8 * k];
}
const mulM = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];

// ---------- His body ----------
// His pale soft belly, the cape of scales down his back (each bone its own rows, so it bends with him).
function bodyDress(ctx, a, mode, D) {
  // belly (chest and waist): the front of him, pale and soft
  ctx.save();
  enter(ctx, a, D, 'waistB');
  smooth(ctx, [[82, 104], [92, 104], [100, 112], [101, 120], [96, 126.6], [86, 127.6], [80, 120]]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 95, 112, 8, FACE[0], 0.9);
    glow(ctx, 86, 125, 7, FACE[2], 0.7);
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'chest');
  smooth(ctx, [[84, 92], [92, 92.4], [97, 98], [98.4, 106], [90, 108], [82, 104]]);
  if (mode === 'fill') {
    ctx.fillStyle = tone(a, FACE[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    glow(ctx, 93, 97, 6, FACE[0], 0.9);
    ctx.restore();
  }
  ctx.restore();
  if (mode !== 'fill') return;
  // the scales down his back: the waist's rows, then the chest's over them
  ctx.save();
  enter(ctx, a, D, 'waistB');
  ctx.save();
  smooth(ctx, [[60, 104], [84, 103], [84, 116], [80, 126], [70, 128], [61, 124], [58, 114]]);
  ctx.clip();
  scales(ctx, a, [[104, 60, 82, 6], [112, 59, 80, 6], [120, 60, 76, 5.6]]);
  ctx.restore();
  // a little moss grown on his back
  mossPad(ctx, a, [[64, 113, 2.4], [67.4, 113.8, 3], [70.6, 113, 2.2]]);
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, 'chest');
  ctx.save();
  smooth(ctx, [[64, 92], [72, 88], [84, 88], [84, 100], [82, 106], [62, 106], [60, 98]]);
  ctx.clip();
  scales(ctx, a, [[87, 62, 84, 6], [95, 60, 82, 6], [103, 60, 80, 6]]);
  ctx.restore();
  ctx.restore();
}
function mossPad(ctx, a, list) {
  for (const [x, y, r] of list) {
    ell(ctx, x, y + 0.4, r + 0.5, r * 0.7 + 0.5);
    ctx.fillStyle = tone(a, MOSS[3]);
    ctx.fill();
  }
  for (const [x, y, r] of list) {
    ell(ctx, x, y, r, r * 0.7);
    ctx.fillStyle = tone(a, MOSS[2]);
    ctx.fill();
    ell(ctx, x - r * 0.15, y - r * 0.2, r * 0.7, r * 0.44);
    ctx.fillStyle = tone(a, MOSS[1]);
    ctx.fill();
  }
}
// A scale plate over the outside of an arm (in the bone's frame, p0 to p1, game px).
function armPlate(ctx, a, mode, p0, p1, w) {
  const mx = mix(p0[0], p1[0], 0.45);
  const my = mix(p0[1], p1[1], 0.45);
  const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(an - Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(-w, -w * 0.6);
  ctx.quadraticCurveTo(-w, w * 1.1, 0, w * 1.2);
  ctx.quadraticCurveTo(w, w * 1.1, w, -w * 0.6);
  ctx.closePath();
  if (mode === 'line') paint(ctx, a, 'line', null, INK, LW * 0.8);
  else {
    ctx.fillStyle = tone(a, SCALE[1]);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-w * 0.5, w * 0.9);
    ctx.quadraticCurveTo(0, w * 1.08, w * 0.55, w * 0.88);
    pen(ctx, tone(a, RIM, 0.6), w * 0.22);
    ctx.stroke();
    ell(ctx, -w * 0.25, 0, w * 0.4, w * 0.26);
    ctx.fillStyle = tone(a, SCALE[0], 0.8);
    ctx.fill();
  }
  ctx.restore();
}
function arm(ctx, a, mode, D, k) {
  for (const [bone, from, to, w] of [[`arm${k}u`, `sh${k}`, `el${k}`, 1.6], [`arm${k}f`, `el${k}`, `wr${k}`, 1.5]]) {
    ctx.save();
    D.frame(ctx, a, bone);
    armPlate(ctx, a, mode, D.loc(from, bone), D.loc(to, bone), w);
    ctx.restore();
  }
}
// Three round ivory claws curving down from a hand (kid units, in the hand's frame).
function claws(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const h = D.J[k === 'N' ? 'handN' : 'handF'];
  for (const [dx, len, ang] of [[-2.6, 6.4, 0.25], [0, 7.4, 0.05], [2.6, 6.2, -0.15]]) {
    ctx.save();
    ctx.translate(h[0] + dx, h[1] + 3);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-1.3, 0);
    ctx.quadraticCurveTo(-1.4, len * 0.7, 0.6, len);
    ctx.quadraticCurveTo(1.6, len * 0.95, 1.3, len * 0.6);
    ctx.quadraticCurveTo(1.3, len * 0.2, 1.2, 0);
    ctx.closePath();
    if (mode === 'line') paint(ctx, a, 'line', null, CLAW[2], LW * 0.9);
    else {
      ctx.fillStyle = tone(a, CLAW[1]);
      ctx.fill();
      ell(ctx, -0.3, len * 0.35, 0.4, len * 0.22);
      ctx.fillStyle = tone(a, CLAW[0]);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
// Toe claws on a foot (kid units, in the foot's frame).
function toes(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const x = D.J[`ank${k}`][0];
  for (const [dx, len] of [[4.2, 3.6], [6.8, 3.2]]) {
    ctx.save();
    ctx.translate(x + dx, 144.6);
    ctx.beginPath();
    ctx.moveTo(-1.2, -1.2);
    ctx.quadraticCurveTo(len * 0.6, -1.8, len, 0.4);
    ctx.quadraticCurveTo(len * 0.5, 1.4, -1.2, 1.0);
    ctx.closePath();
    if (mode === 'line') paint(ctx, a, 'line', null, CLAW[2], LW * 0.8);
    else {
      ctx.fillStyle = tone(a, CLAW[1]);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
// His tail: three scaled pieces, each a tapered round shape with plates along it, the tip curling up.
function tail(ctx, a, mode, D) {
  const W = [16, 13, 10, 6.4];
  // (from the tip back to the root, so each piece lies over the one beyond it)
  for (let i = 2; i >= 0; i--) {
    ctx.save();
    enter2(ctx, a, D, `tail${i}`);
    const p0 = TAIL[i];
    const p1 = TAIL[i + 1];
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const L = Math.hypot(dx, dy);
    ctx.translate(p0[0], p0[1]);
    ctx.rotate(Math.atan2(dy, dx));
    const w0 = W[i] / 2;
    const w1 = W[i + 1] / 2;
    ctx.beginPath();
    ctx.moveTo(-2, -w0);
    ctx.quadraticCurveTo(L * 0.5, -(w0 + w1) / 2 - 0.6, L, -w1);
    ctx.arc(L, 0, w1, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(L * 0.5, (w0 + w1) / 2 + 0.4, -2, w0);
    ctx.arc(-2, 0, w0, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    if (mode === 'line') paint(ctx, a, 'line');
    else {
      ctx.fillStyle = tone(a, SCALE[2]);
      ctx.fill();
      ctx.save();
      ctx.clip();
      glow(ctx, L * 0.4, -w0 * 0.6, w0 * 1.6, SCALE[1], 0.8);
      // plates along its top, overlapping toward the tip
      for (let k2 = 0; k2 < 3; k2++) {
        const u = (k2 + 0.4) / 3;
        const s = mix(w0, w1, u) * 0.9;
        ctx.save();
        ctx.translate(L * u, -mix(w0, w1, u) * 0.25);
        ctx.rotate(-Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.quadraticCurveTo(-s, s * 1.2, 0, s * 1.25);
        ctx.quadraticCurveTo(s, s * 1.2, s, 0);
        ctx.closePath();
        ctx.fillStyle = tone(a, SCALE[1]);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, s * 0.3);
        ctx.quadraticCurveTo(-s * 0.8, s * 1.1, 0, s * 1.12);
        ctx.quadraticCurveTo(s * 0.8, s * 1.1, s * 0.8, s * 0.3);
        pen(ctx, tone(a, SCALE[3]), s * 0.22);
        ctx.stroke();
        ctx.restore();
      }
      // the dusk on its top edge
      ctx.beginPath();
      ctx.moveTo(0, -w0 + 0.8);
      ctx.quadraticCurveTo(L * 0.5, -(w0 + w1) / 2 + 0.2, L, -w1 + 0.8);
      pen(ctx, tone(a, RIM, 0.5), 0.8);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}
// The moonstone he digs up (game px about its middle).
function moonstone(ctx, a, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.86);
  ctx.fillStyle = tone(a, '#8ac4e8');
  ctx.fill();
  pen(ctx, '#5a7ab0', r * 0.25);
  ctx.stroke();
  ell(ctx, x, y + r * 0.2, r * 0.7, r * 0.5);
  ctx.fillStyle = tone(a, '#c8ecff');
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// ---------- His act and fight ----------
const PIECES = { salute: 7.2, dig: 8.2, nap: 8.6, polish: 7.0 };
const ORDER = ['salute', 'dig', 'nap', 'polish'];
const POOL = ['bash', 'dig', 'tail'];
const VOWELS = ['talkA', 'talkE', 'talkO', 'talkE', 'calm'];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const ease = (rate) => 1 - Math.exp(-dt * rate);
  const q = { face: null, tail0: 0, tail1: 0, tail2: 0, slip: 0, clank: 0, helmOff: 0, shine: 0, sniff: false, curl: 0, stone: 0, dig: -1, fog: -1, sweat: -1, zz: 0, sparkle: -1, bash: -1, fling: -1, sweep: -1, gather: 0, spin: false };
  a.pg = q;
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
  // Standing (and walking): his forelimbs tucked up in front of his chest, claws hanging; a lean
  // forward, his tail out behind for balance, swaying with his steps.
  const br = c.breath ?? 0;
  go({ shN: -46 + br * 2, elN: -104, hwN: 34, shF: -36 + br * 1.5, elF: -100, hwF: 30, tilt: 5 + walking * 3, head: -2 }, 1);
  const u = a.blkidU ?? a.wp ?? 0;
  q.tail0 = Math.sin(t * 0.9) * 0.05 + Math.sin(u) * 0.06 * walking;
  q.tail1 = Math.sin(t * 0.9 - 0.6) * 0.07 + Math.sin(u - 0.8) * 0.08 * walking;
  q.tail2 = 0.25 + Math.sin(t * 0.9 - 1.2) * 0.1;

  // ----- The fight -----
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.pgWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.0;
  if ((wind > 0 || striking) && alive) {
    if (!st.pgAtk) {
      const pool = m.def.moves ?? POOL;
      st.pgN = (st.pgN ?? m.uid ?? 0) + 1;
      st.pgMove = m.move ?? pool[st.pgN % pool.length];
    }
    st.pgAtk = true;
  } else st.pgAtk = false;
  const mvName = st.pgAtk ? st.pgMove : null;
  const hadWind = now - (st.pgWindAt ?? -9) < Math.max(0, since) + 0.15;
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
  st.pgCalm = mix(st.pgCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
  const cw = sstep(st.pgCalm);
  let PC = st.pgPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.pgOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.pgOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.pgOrd = (st.pgOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.pgPiece = PC;
  const piece = PC?.name ?? null;
  const pu = PC?.name ? now - PC.t0 : -1;
  const k = cw;
  let curl = 0;

  if (k > 0.001 && piece === 'salute') {
    // at attention: chest out, arms down at his sides
    const att = win(pu, 0, 0.5, 6.4, 7.0);
    go({ tilt: -3, chest: -5, head: -3, shN: 8, elN: -14, hwN: 0, shF: 6, elF: -12, hwF: 0 }, att * k);
    say('proud', win(pu, 0.3, 0.5, 2.6, 2.8) * k);
    // the salute: the Moon Guard's, his near claw across his heart and a smart little nod
    const sal = win(pu, 0.9, 1.3, 2.6, 3.0);
    go({ shN: 4, elN: -116, hwN: -10 }, sal * k);
    add({ head: 10 * win(pu, 1.4, 1.6, 1.8, 2.1) }, k);
    // the nod tips the helmet down onto his brows; he looks up at it; a toss of his head and it's back
    q.slip = Math.max(q.slip, win(pu, 1.7, 1.95, 3.7, 4.0) * k);
    say('up', win(pu, 2.9, 3.0, 3.7, 3.8) * k);
    const toss = win(pu, 3.55, 3.75, 3.9, 4.3);
    go({ head: -16, neckR: -4, tilt: -4 }, toss * k);
    say('sheepish', win(pu, 4.4, 4.6, 5.8, 6.0) * k);
    add({ chest: Math.sin(pu * 18) * 2 * win(pu, 4.8, 4.9, 5.3, 5.5), head: Math.sin(pu * 18) * 1.6 * win(pu, 4.8, 4.9, 5.3, 5.5) }, k);
  }
  if (k > 0.001 && piece === 'dig') {
    // a sniff along the floor
    const sn = win(pu, 0, 0.5, 1.0, 1.2);
    go({ tilt: 16, head: 14, neckR: 4 }, sn * k);
    say('sniff', sn * k);
    q.sniff = sn > 0.4;
    // digging: crouched, claws scraping the floor in turn, dirt flying out behind
    const dg = win(pu, 1.0, 1.4, 3.6, 3.9);
    go({ tilt: 30, head: 14, lift: -0.06, shN: -10, elN: -30, shF: -6, elF: -30 }, dg * k);
    add({ shN: Math.sin(pu * 11) * 22 * dg, shF: -Math.sin(pu * 11) * 22 * dg }, k);
    say('focus', dg * k);
    if (dg > 0.3) q.dig = pu;
    // the moonstone: up, held high, delighted
    const hold = win(pu, 3.8, 4.2, 6.2, 6.6);
    go({ tilt: -4, head: -8, shN: -150, elN: -40, hwN: -20, lift: 0.01 }, hold * k);
    q.stone = win(pu, 3.7, 3.9, 6.8, 7.2) * k;
    say('gasp', win(pu, 3.9, 4.0, 4.5, 4.6) * k);
    say('happy', win(pu, 4.6, 4.7, 6.2, 6.4) * k);
    if (pu > 4.2 && pu < 6.2) q.sparkle = pu - 4.2;
    // tucked away under his scales
    const tuck = win(pu, 6.5, 6.9, 7.4, 7.9);
    go({ shN: 10, elN: -110, hwN: 20, head: 4 }, tuck * k);
    say('proud', win(pu, 6.8, 7.0, 7.8, 8.1) * k);
  }
  if (k > 0.001 && piece === 'nap') {
    say('yawn', win(pu, 0, 0.2, 0.8, 1.0) * k);
    go({ shN: -130, elN: -60, shF: -120, elF: -60, head: -8, tilt: -4 }, win(pu, 0.1, 0.4, 0.8, 1.0) * k);
    // curled into a ball, z's
    curl = Math.max(curl, win(pu, 0.9, 1.6, 5.4, 5.7) * k);
    say('sleep', win(pu, 1.4, 1.5, 5.5, 5.6) * k);
    q.zz = Math.max(q.zz, win(pu, 1.8, 2.2, 5.2, 5.5) * k);
    // a start: uncurled with a bounce, a look left and right, a quick salute
    const jolt = pu > 5.55 ? clamp(boing(pu - 5.55, 9, 18), 0, 1.15) * (1 - sstep((pu - 6.2) / 0.4)) : 0;
    add({ hop: 0.06 * jolt }, k);
    say('surprised', win(pu, 5.55, 5.6, 6.0, 6.1) * k);
    const lk = win(pu, 6.1, 6.2, 7.2, 7.3);
    const left = Math.floor((pu - 6.1) / 0.36) % 2 === 0;
    say(left ? 'panicL' : 'panic', lk * k);
    add({ head: (left ? -5 : 5) * lk, neckR: (left ? -2 : 2) * lk }, k);
    const sal = win(pu, 7.3, 7.6, 8.1, 8.5);
    go({ shN: 4, elN: -116, hwN: -10, chest: -4 }, sal * k);
    say('proud', sal * k);
  }
  if (k > 0.001 && piece === 'polish') {
    // his near claw up to the helmet, and it comes off
    // (his arms are short: he bows his head down to his raised claws to take it off)
    const reach = win(pu, 0, 0.5, 0.9, 1.4);
    go({ shN: -140, elN: -56, hwN: -20, tilt: 20, head: 30, neckR: 6 }, reach * k);
    q.helmOff = sstep((pu - 0.6) / 0.6) * (1 - sstep((pu - 5.4) / 0.6)) * k;
    const hold = win(pu, 1.0, 1.5, 5.0, 5.4);
    go({ shN: -8, elN: -70, hwN: -10, head: 8 }, hold * k);
    // a breath on its crescent ("hah"), a rub with his far forearm
    say('hah', win(pu, 1.5, 1.6, 2.1, 2.2) * k);
    if (pu > 1.6 && pu < 2.8) q.fog = pu - 1.6;
    const rub = win(pu, 2.2, 2.4, 3.7, 3.9);
    go({ shF: -64, elF: -110, hwF: -10 }, rub * k);
    add({ shF: Math.sin(pu * 14) * 14 * rub }, k);
    say('focus', rub * k);
    // held up to admire: a glint
    const adm = win(pu, 3.9, 4.2, 5.0, 5.3);
    go({ shN: -50, elN: -50, head: -6 }, adm * k);
    q.shine = win(pu, 4.1, 4.3, 4.6, 5.0) * k;
    say('proud', adm * k);
    // back on, a pat
    const on = win(pu, 5.1, 5.4, 6.0, 6.4);
    go({ shN: -140, elN: -56, hwN: -20, tilt: 20, head: 30, neckR: 6 }, on * k);
    say('happy', win(pu, 6.1, 6.2, 6.8, 7.0) * k);
  }

  // (his own marks over his head)
  if (fighting && alive && !st.pgHunt) st.pgBangAt = now;
  if (!fighting && st.pgHunt && alive) st.pgLostAt = now;
  st.pgHunt = fighting && alive;
  q.bang = now - (st.pgBangAt ?? -9);
  q.huh = now - (st.pgLostAt ?? -9);
  q.hurtT = hurt ? ago : -1;
  q.gloatT = now - (m.gloatAt ?? -9);
  // ----- Hunting you: brows down, head lowered, claws up -----
  if (fighting && alive && !hurt) {
    go({ tilt: 10, head: 8, shN: -70, elN: -96, hwN: 20 }, 1);
    q.face = 'fierce';
  }
  if (low && !busy) {
    q.face = q.face ?? 'worried';
    q.sweat = (t * 0.5) % 1;
  }
  // ----- His moves -----
  if (mvName && alive) {
    const sw = s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 0;
    // (his claws' fling comes through over a touch longer, so they never leap)
    const snapT = mvName === 'dig' ? 0.22 : 0.14;
    const snap = s >= 0 ? sstep(s / (hadWind ? snapT : snapT + 0.04)) : 0;
    const wu = sstep(W) * (1 - snap);
    if (mvName === 'bash') {
      // head lowered, a scrape of his near foot; then a charge, helmet first
      go({ tilt: 16, head: 20, x: -0.05, lift: -0.03, shN: 20, elN: -60, shF: 24, elF: -60 }, wu);
      add({ fxN: -0.12 + Math.sin(now * 14) * 0.12 * wu, fyN: Math.max(0, Math.sin(now * 14)) * 0.08 * wu }, wu);
      say('fierce', W);
      go({ tilt: 24, head: 16, x: 0.26, shN: 30, elN: -40, shF: 34, elF: -40, fxF: -0.2 }, snap * sw);
      say('shout', snap * sw);
      q.clank = snap * sw * 0.1 * Math.sin(Math.max(0, s) * 30) * Math.exp(-Math.max(0, s) * 6);
      if (s >= 0 && s < 0.9) q.bash = s;
    } else if (mvName === 'dig') {
      // crouched, digging hard; then the clod flung up and at you
      go({ tilt: 30, head: 14, lift: -0.07, shN: -10, elN: -30, shF: -6, elF: -30 }, wu);
      add({ shN: Math.sin(now * 9) * 18 * wu, shF: -Math.sin(now * 9) * 18 * wu }, 1);
      q.gather = wu;
      say('focus', W);
      go({ tilt: -6, head: -6, lift: 0, shN: -118, elN: -36, shF: -104, elF: -36 }, snap * sw);
      say('shout', snap * sw);
      if (s >= 0 && s < 1.0) q.fling = s;
    } else {
      // his tail cocked high over his back, a look back; then a spin (two clean mirror flips), the
      // tail sweeping low through you
      go({ tilt: 8, head: -4, neckR: -4, lift: -0.03, shN: -60, elN: -110 }, wu);
      q.tail0 += 0.75 * wu;
      q.tail1 += 0.5 * wu;
      q.tail2 += 0.3 * wu;
      say('focus', W);
      const spin = s >= 0 && s < 0.36;
      q.spin = spin;
      go({ tilt: 4, lift: -0.04 }, snap * sw);
      q.tail0 -= 0.25 * snap * sw;
      q.tail1 -= 0.2 * snap * sw;
      say('shout', snap * sw);
      if (s >= 0 && s < 0.9) q.sweep = s;
    }
  }
  // ----- Hurt: a squeezed wince, a flinch, his helmet clanging -----
  if (hurt && !mvName) {
    const kh = sstep(1 - ago / 0.6);
    go({ tilt: -10, head: 12, neckR: 4, shN: -90, elN: -120, shF: -80, elF: -120, lift: -0.02 }, kh);
    q.face = 'hurt';
    q.clank += Math.sin(ago * 34) * Math.exp(-ago * 7) * 0.12;
  }
  // ----- After landing a hit: a proud little nod -----
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.45) / 0.45) : 1) : 0;
  const gl = q.gloatT;
  if (gl >= 0 && gl < 1.1 && alive && !hurt) {
    const kg = win(gl, 0, 0.28, 0.8, 1.1) * (1 - moveW);
    go({ chest: -4, head: 6 + Math.sin(gl * 10) * 3, tilt: -2 }, kg);
    say('proud', kg);
  }
  // ----- A nap (his habitat): curled up in a ball -----
  st.pgNap = mix(st.pgNap ?? 0, napping && !busy ? 1 : 0, ease(napping ? 2.2 : 6));
  const nw = sstep(st.pgNap);
  if (nw > 0.001) {
    curl = Math.max(curl, nw);
    if (nw > 0.6) {
      q.face = 'sleep';
      q.zz = nw;
    }
  }
  // curled up: sat down low, bent forward over his knees, head drooped, his tail wrapped round in front
  if (curl > 0.001) {
    const br2 = Math.sin(now * 1.6) * 0.012;
    go({ tilt: 20, waist: 8, chest: 10, head: 22, neckR: 5, lift: -0.13 + br2, shN: -24, elN: -120, hwN: 20, shF: -20, elF: -120, fxN: 0.26, fyN: 0.06, fxF: 0.2, fyF: 0.05 }, curl);
    q.tail0 += 0.12 * curl;
    q.tail1 -= 0.3 * curl;
    q.tail2 += 0.45 * curl;
  }
  q.curl = curl;
  if (alive && !busy && !hurt) {
    if (cine === 'happy') q.face = 'happy';
    else if (cine === 'sad') q.face = 'sad';
    else if (cine === 'angry') q.face = 'fierce';
    else if (cine === 'talk' || m.talking) q.face = VOWELS[Math.floor(now * 7) % VOWELS.length];
  }
  if (!alive) q.face = 'dizzy';
  // ----- The face: an in-between (a blink) on every change; his own blink rhythm -----
  let f = q.face ?? 'calm';
  if (f !== st.pgFace) {
    st.pgFaceFrom = st.pgFace;
    st.pgFace = f;
    st.pgFaceAt = now;
  }
  const since0 = now - (st.pgFaceAt ?? -9);
  if (since0 >= 0 && since0 < 0.07 && st.pgFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.pgFaceFrom)) f = 'shut';
  const bl = (now + (m.uid ?? 0) * 0.61) % 4.6;
  if (bl < 0.12 && !SHUTS.has(f)) f = 'shut';
  q.face = f;
  for (const key of ['tail0', 'tail1', 'tail2', 'slip', 'helmOff']) {
    st[`pg_${key}`] = mix(st[`pg_${key}`] ?? q[key], q[key], ease(key.startsWith('tail') ? 10 : 14));
    q[key] = st[`pg_${key}`];
  }
  st.pgSpin = q.spin && alive;
}

// ---------- Live effects (rig space, game px, his feet at 0, 0) ----------
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
const STONES = ['#e6dcec', '#b8a8c4', '#8a7a9c'];
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
// The clang: soft gold arcs ringing out from his helmet, a sparkle in the middle.
function clang(ctx, x, y, u) {
  if (u <= 0 || u >= 1) return;
  for (let i = 0; i < 2; i++) {
    const v = clamp(u * 1.4 - i * 0.25, 0, 1);
    if (v <= 0 || v >= 1) continue;
    ctx.save();
    ctx.globalAlpha *= 1 - v;
    ctx.lineCap = 'round';
    for (const [col, w] of [['#c89a4c', 2.2], ['#fff2c4', 1.0]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(x, y, 3 + v * 9, side * 0.9 - 0.4, side * 0.9 + 0.4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  sparkle(ctx, x, y, 3.2 * Math.sin(Math.PI * clamp(u * 1.6, 0, 1)), 1, '#fff6c8');
}

function under2(ctx, m, a, S, matOf, D) {
  for (const p of SOFTS) a.blMat(p.name);
  tail(ctx, a, 'line', D);
  tail(ctx, a, 'fill', D);
}

function fx(ctx, m, a, S, matOf, D) {
  const q = a.pg ?? {};
  const base = ctx.globalAlpha;
  const t = (a.now ?? a.t) + (m.uid ?? 0) * 0.47;
  if (m.hp <= 0) {
    const [hx, hy] = headAt(a, D, [0, -30]);
    dizzy(ctx, hx, hy, 6, a.now ?? 0, 3);
    return;
  }
  // digging: dirt and pebbles flying out behind him
  if ((q.dig ?? -1) >= 0 || (q.gather ?? 0) > 0.1) {
    const al = q.gather > 0.1 ? q.gather : 1;
    const [hx] = ptOf(a, D, 'handN', D.J.handN);
    const L = [];
    for (let i = 0; i < 4; i++) {
      const f = (t * 2.2 + i / 4) % 1;
      const n = Math.floor(t * 2.2 + i / 4);
      const x = hx - 4 - f * (14 + hash(n + i) * 8);
      const y = -1 - Math.sin(Math.PI * f) * (7 + hash(n * 3 + i) * 5);
      if (i % 2) rubble(ctx, x, y, 0.8, f * 9 + i, al * (1 - f), STONES);
      else L.push([x, y, 1.0 + f * 0.8, al * Math.sin(Math.PI * f) * 0.85]);
    }
    cloud(ctx, L);
  }
  // the moonstone in his claws
  if ((q.stone ?? 0) > 0.02) {
    const [sx, sy] = ptOf(a, D, 'handN', [D.J.handN[0] + 2, D.J.handN[1] + 2]);
    moonstone(ctx, a, sx, sy - 1.2, 1.6, q.stone);
  }
  if ((q.sparkle ?? -1) >= 0) {
    const [sx, sy] = ptOf(a, D, 'handN', [D.J.handN[0] + 2, D.J.handN[1] - 2]);
    for (let i = 0; i < 4; i++) {
      const f = clamp(q.sparkle * 0.9 - i * 0.18, 0, 1);
      const an = -Math.PI / 2 + (i - 1.5) * 0.9;
      sparkle(ctx, sx + Math.cos(an) * (2 + f * 5), sy + Math.sin(an) * (2 + f * 5), (i % 2 ? 1.0 : 1.5) * Math.sin(Math.PI * f), 1, i % 2 ? '#fff6c8' : '#ffffff');
    }
  }
  // a breath fogging the crescent
  if ((q.fog ?? -1) >= 0 && q.fog < 1.2) {
    const [mx, my] = headAt(a, D, [22, 14]);
    const L = [];
    for (let i = 0; i < 3; i++) {
      const f = clamp(q.fog / 1.0 - i * 0.12, 0, 1);
      L.push([mx + 2 + f * 5 + i, my - f * 3 - i, 0.8 + f * 0.8, (1 - f) * 0.7]);
    }
    cloud(ctx, L);
  }
  // ----- Helmet Bash: a puff and the clang where his helmet lands -----
  if ((q.bash ?? -1) >= 0) {
    const s = q.bash;
    if (s > 0.06 && s < 0.7) clang(ctx, 24, -20, (s - 0.06) / 0.6);
    if (s < 0.5) {
      const L = [];
      for (let i = 0; i < 4; i++) {
        const f = clamp(s / 0.5 - i * 0.1, 0, 1);
        L.push([-4 - f * 10 - i * 3, -1 - Math.sin(Math.PI * f) * 3, 1.2 + f, 1 - f]);
      }
      cloud(ctx, L);
    }
  }
  // ----- Rubble Fling: a clod of crypt rubble in an arc, bursting where it lands -----
  if ((q.fling ?? -1) >= 0 && q.fling < 1.0) {
    const s = q.fling;
    const u = clamp(s / 0.55, 0, 1);
    const x = 8 + u * 30;
    const y = -18 - Math.sin(Math.PI * u) * 14 + u * 17;
    if (u < 1) {
      for (let i = 0; i < 3; i++) rubble(ctx, x - i * 2.6 * (1 - u), y + i * 1.2, 1.4 - i * 0.3, s * 12 + i, 1, STONES);
      cloud(ctx, [1, 2, 3].map((i) => [x - i * 4, y + i * 1.4, 0.9, (1 - i * 0.25) * 0.6]));
    }
    if (s > 0.5) {
      const v = clamp((s - 0.5) / 0.45, 0, 1);
      const L = [];
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI + (i / 5) * Math.PI;
        L.push([38 + Math.cos(an) * (2 + v * 8), -1.5 + Math.sin(an) * (1 + v * 5), 1.4 + (i % 2) * 0.5, 1 - v]);
      }
      cloud(ctx, L);
      for (let i = 0; i < 4; i++) rubble(ctx, 38 + (i - 1.5) * (2 + v * 6), -Math.sin(Math.PI * v) * (3 + i) - 0.5, 0.8, v * 7 + i, 1 - v, STONES);
    }
  }
  // ----- Tail Sweep: a low swoosh of dust round him as the tail goes through -----
  if ((q.sweep ?? -1) >= 0 && q.sweep < 0.9) {
    const s = q.sweep;
    const v = clamp(s / 0.5, 0, 1);
    ctx.save();
    ctx.globalAlpha *= 1 - sstep((s - 0.4) / 0.4);
    for (const [col, w] of [[DUST[1], 3.2], ['#ffffff', 1.4]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(4, -4, 26, 5, 0, Math.PI * (1.1 - v * 1.0), Math.PI * (1.1 - v * 1.0) + 1.2);
      ctx.stroke();
    }
    ctx.restore();
    const L = [];
    for (let i = 0; i < 5; i++) {
      const f = clamp(s / 0.6 - i * 0.08, 0, 1);
      L.push([10 + i * 5 + f * 6, -1.4 - Math.sin(Math.PI * f) * 3, 1.3 + f * 0.6, (1 - f) * 0.9]);
    }
    cloud(ctx, L);
  }
  // hurt: a little star off his helmet
  if ((q.hurtT ?? -1) >= 0 && q.hurtT < 0.5) {
    const [hx, hy] = headAt(a, D, [-6, -26]);
    sparkle(ctx, hx - q.hurtT * 10, hy - q.hurtT * 6, 2.2 * (1 - q.hurtT / 0.5), 1, '#fff6c8');
  }
  if ((q.sweat ?? -1) >= 0) {
    const [hx, hy] = headAt(a, D, [-18, -8]);
    sweat(ctx, hx, hy + (q.sweat % 1) * 3, 1.0, Math.sin(Math.PI * (q.sweat % 1)));
  }
  if ((q.zz ?? 0) > 0.05) {
    const [hx, hy] = headAt(a, D, [10, -30]);
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.45 + i * 0.5) % 1;
      zee(ctx, hx + f * 6 + Math.sin(f * 5) * 1.4, hy - f * 9, 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  const [bx, by] = headAt(a, D, [14, -40]);
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, bx, by, '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, bx, by, '?', q.huh, 1.4, a.flip);
  if (q.gloatT >= 0 && q.gloatT < 1.0) {
    const e = q.gloatT;
    sparkle(ctx, bx - 4 + e * 4, by + 8 - e * 6, 1.6 * Math.sin(Math.PI * e), 1, '#fff6c8');
  }
  ctx.globalAlpha = base;
}

const DRESS = {
  id: 'pangolin',
  skin: { lt: '#e8e2f6', base: SCALE[1], sh: SCALE[2], deep: SCALE[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['tail'],
  joints: { ...JOINTS },
  softParts: SOFTS,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => bodyDress(ctx, a, mode, D),
    armF: (ctx, a, mode, S, D) => arm(ctx, a, mode, D, 'F'),
    handFskin: (ctx, a, mode, S, D) => claws(ctx, a, mode, D, 'F'),
    footFskin: (ctx, a, mode, S, D) => toes(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => toes(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D);
      helmetOn(ctx, a, mode, D);
    },
    armN: (ctx, a, mode, S, D) => arm(ctx, a, mode, D, 'N'),
    handNskin: (ctx, a, mode, S, D) => claws(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('pangolin', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  // (his Tail Sweep spin: a clean mirror flip, never a squeeze)
  const flip0 = a.flip;
  if (a.mo.rig?.pgSpin && m.hp > 0) a.flip = !a.flip;
  draw0(ctx, m, a);
  a.flip = flip0;
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
// (`noHop`: none of the monster drawer's hops or idle notes over him; `ownEmotes`: its marks over his
// head left to him, drawn here in his own style)
export const PANGOLIN_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const PANGOLIN_SIZE = { w: 30, h: Math.round(R.H * BIG * 1.05), speed: Math.round(R.speed * BIG) };
