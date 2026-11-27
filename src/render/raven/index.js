// The Raven Scribe (2026-11-26, the Star Observatory's Owl Librarian remade from scratch as a new creature;
// the id stays `mothlibrarian`). A little night-blue raven, the Archive's copyist: it copies Astraea's
// thousand years of star records out fresh in starlight ink, so they never fade. Folio calls the Raven
// Scribes to her when she's in a fight. Like every raven it can't leave anything shiny alone, and it
// mimics sounds: the Archive's great clock, mostly. Its feathers are speckled with tiny stars, like the
// night sky it writes down. On its own copy of the bird base (birdbase.js: its bones, walk, springs and
// moves), the songbird grown into a stout raven that walks with a swagger; dressed here, its face and
// everything it wears drawn here from scratch.
//   look    night-blue feathers with a violet sheen, a few tiny stars twinkling on its wings; a soft
//           slate beak; its own eye ("inkdrop eye": big and round in a pale periwinkle ring, a deep plum
//           iris with a gold ring round its pupil like the rim of an ink pot, two round glints, a neat
//           lash line with one curl); a round feather brow that does its acting; a frilly white
//           scribe's ruff round its neck; a little ink pot of glowing starlight ink hung on a ribbon on
//           its breast; half-moon reading glasses perched on its beak; a long cream quill tucked behind
//           its head (in its beak when it writes). Its own soft indigo outline, outer edge only.
//   walk    the base's walk with a raven's swagger.
//   idle    a 30 s act in four pieces, each the next one that fits the time it has before it moves on
//           (data `rest`; world/mobs.js tells it, `m.restUntil`):
//           - scribble (8.4 s): the quill into its beak, a scroll unrolled at its feet; it writes,
//             its head bobbing in little jerks; it blows on the ink and admires it;
//           - shiny (7.6 s): something glints on the floor; a snap of its head; it reaches down, picks
//             it up, tosses it up, catches it, and drops it in its ink pot (plink: the ink glows);
//             a smug ruffle;
//           - specs (6.6 s): its glasses slide down its beak; a toss of its head nudges them up; they
//             slide again; a frown, another toss, chin held high and stiff; they slide; a huff;
//           - mimic (7.0 s): it does the Archive's great clock: tick... tock..., its head swinging
//             like a pendulum; then CUCKOO!, a hop and a flourish, very pleased with itself.
//   moves   Quill Jab (the quill taken in its beak, reared back; then two quick jabs, ink spattering
//           in little stars); Ink Flick (the quill dipped in its ink pot; then flicked up and out, a
//           spray of starlight ink arcing at you); Page Flurry (wings flung up wide; then one great
//           beat, a flurry of loose pages fluttering at you).
//   else    hurt: eyes squeezed, feathers puffed, a few loose pages; after landing a hit: a smug little
//           hop and ruffle; hunting you: crouched, quill in its beak, brow down; low on health: worried,
//           a bead of sweat; a nap (habitat): settled down fluffed, head tucked, z's; beaten: dizzy.
//           Its marks over its head (!, ?, z's, sweat) are its own (`ownEmotes`).
// Every effect is drawn here, live, in its own soft style: starlight ink as rounded drops and soft star
// splats (deep blue with a gold glint), pages as little cream sheets with lines of writing, sparkles
// the game's curvy stars.
import { dressedBird } from './birdbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hash = (i) => {
  const q = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return q - Math.floor(q);
};
const boing = (t, k = 7, w = 15) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
function smooth(ctx, pts) {
  const n = pts.length;
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(...mid(n - 1));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...mid(i));
  ctx.closePath();
}
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.01 || r <= 0.05) return;
  const [cr, cg, cb] = hexRgb(col);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function sparkle(ctx, x, y, s, al = 1, col = '#fff6c8') {
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

const INK = '#3a3a74';
const FEATHERS = { lt: '#7880c8', base: '#4a5096', sh: '#383d7a', deep: '#272a5c' };
const LASH = '#1e1a40';
const IRIS = ['#2a1838', '#5a3070', '#8a54a8'];
const GOLD = ['#fff4c0', '#ffd66a', '#d8a03a', '#a8742a'];
const RUFF = ['#ffffff', '#f2eefc', '#d8d2ee'];
const STARINK = ['#2a3a8a', '#3e58c0', '#7aa0ff', '#d8e6ff'];
const PAPER = ['#fffaea', '#f0e2bc', '#d4bc8c'];
const QUILL = ['#fffbf2', '#f2e6d4', '#d8c6aa'];

// ---------- Its face (the head's frame, game px) ----------
function faceOf(a) {
  return a.rv?.face ?? 'calm';
}
function stroke3(ctx, a, K, p0, c, p1, w, col = LASH) {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  ctx.strokeStyle = K.colour(a, col);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
}
// Brows by mood: [tilt (+ cross), lift].
const BROWS = { calm: [0, 0], focus: [0.8, -0.1], fierce: [1.2, -0.15], surprised: [-0.6, 0.5], wide: [-0.6, 0.5], sad: [-1, 0.2], worried: [-1, 0.2], smug: [-0.4, 0.25], happy: [-0.3, 0.3], proud: [-0.3, 0.3], frown: [1, -0.05], up: [-0.4, 0.4] };
function eye(ctx, a, K) {
  const s = K.sc;
  const f = faceOf(a);
  const x = s(2.4);
  const y = s(-1.7);
  const r = s(2.5);
  // a pale periwinkle ring round the eye, so the dark eye reads on its dark feathers
  ell(ctx, x, y, r * 1.38, r * 1.36);
  ctx.fillStyle = K.colour(a, '#c6caf0');
  ctx.fill();
  glow(ctx, x - r * 0.3, y - r * 0.5, r * 1.2, '#eef0ff', 0.6);
  const [bt, bl] = BROWS[f] ?? BROWS.calm;
  const brow = () => stroke3(ctx, a, K, [x - r * 1.1, y - r * (1.75 + bl) + bt * r * 0.35], [x, y - r * (2.15 + bl)], [x + r * 1.0, y - r * (1.7 + bl) - bt * r * 0.4], s(0.75), FEATHERS.deep);
  if (f === 'dizzy') {
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const q = u * TAU * 2;
      const p = [x + Math.cos(q) * r * 0.85 * u, y + Math.sin(q) * r * 0.85 * u];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.strokeStyle = K.colour(a, IRIS[1]);
    ctx.lineWidth = s(0.4);
    ctx.stroke();
    brow();
    return;
  }
  if (f === 'happy' || f === 'smug' || f === 'proud') {
    stroke3(ctx, a, K, [x - r * 0.95, y + r * 0.3], [x, y - r * 1.05], [x + r * 0.95, y + r * 0.3], s(0.55));
    brow();
    return;
  }
  if (f === 'hurt' || f === 'squeeze') {
    stroke3(ctx, a, K, [x + r * 0.9, y - r * 0.7], [x - r * 0.1, y - r * 0.1], [x - r * 0.8, y], s(0.5));
    stroke3(ctx, a, K, [x + r * 0.9, y + r * 0.7], [x - r * 0.1, y + r * 0.15], [x - r * 0.8, y], s(0.5));
    brow();
    return;
  }
  if (f === 'sleep' || f === 'shut') {
    stroke3(ctx, a, K, [x - r, y], [x, y + r * 0.7], [x + r, y - 0.1], s(0.55));
    stroke3(ctx, a, K, [x - r, y], [x - r * 1.3, y - r * 0.05], [x - r * 1.5, y - r * 0.45], s(0.4));
    brow();
    return;
  }
  const wide = f === 'surprised' || f === 'wide' ? 1.07 : 1;
  ell(ctx, x, y, r * wide, r * wide);
  ctx.fillStyle = K.colour(a, '#ffffff');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, r * wide, r * wide);
  ctx.clip();
  const look = f === 'up' ? [0.1, -0.35] : f === 'down' ? [0.15, 0.35] : f === 'back' ? [-0.35, 0] : [0.2, 0.05];
  const ix = x + r * look[0];
  const iy = y + r * look[1];
  const ir = wide > 1 ? 0.86 : 1;
  // the iris: deep plum, a gold ring round the pupil like the rim of an ink pot
  ell(ctx, ix, iy, r * 0.8 * ir, r * 0.82 * ir);
  ctx.fillStyle = K.colour(a, IRIS[0]);
  ctx.fill();
  ell(ctx, ix, iy + r * 0.12, r * 0.66 * ir, r * 0.66 * ir);
  ctx.fillStyle = K.colour(a, IRIS[1]);
  ctx.fill();
  ell(ctx, ix, iy + r * 0.34, r * 0.5 * ir, r * 0.32 * ir);
  ctx.fillStyle = K.colour(a, IRIS[2]);
  ctx.fill();
  ell(ctx, ix, iy, r * 0.34 * ir, r * 0.34 * ir);
  ctx.strokeStyle = K.colour(a, GOLD[2]);
  ctx.lineWidth = s(0.28);
  ctx.stroke();
  ell(ctx, ix, iy, r * 0.27 * ir, r * 0.27 * ir);
  ctx.fillStyle = K.colour(a, '#120a1e');
  ctx.fill();
  ell(ctx, ix - r * 0.32, iy - r * 0.34, r * 0.24, r * 0.22);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + r * 0.3, iy + r * 0.32, r * 0.11, r * 0.11);
  ctx.fill();
  ctx.restore();
  // a neat lash line over the top, one soft curl at the back
  ctx.beginPath();
  ctx.ellipse(x, y, r * wide * 1.02, r * wide * 1.02, 0, Math.PI * 1.08, Math.PI * 1.92);
  ctx.strokeStyle = K.colour(a, LASH);
  ctx.lineWidth = s(0.5);
  ctx.lineCap = 'round';
  ctx.stroke();
  stroke3(ctx, a, K, [x - r * 0.92, y - r * 0.42], [x - r * 1.32, y - r * 0.56], [x - r * 1.48, y - r * 0.96], s(0.42));
  brow();
}
function face(ctx, a, sk, K) {
  const s = K.sc;
  glow(ctx, s(4.6), s(2.6), s(1.8), '#ff9ccc', 0.35);
  eye(ctx, a, K);
}
// Its half-moon reading glasses, perched on its beak (the head's frame), sliding down it.
function specs(ctx, a, mode, K) {
  const s = K.sc;
  K.headFrame(ctx, a);
  const sl = a.rv?.slide ?? 0;
  const bx = s(K.P.beak.at[0] + 0.6 + sl * 2.2);
  const by = s(K.P.beak.at[1] - 1.2 + sl * 0.7);
  ell(ctx, bx, by, s(1.6), s(1.3));
  if (mode === 'line') {
    ctx.strokeStyle = K.colour(a, GOLD[3]);
    ctx.lineWidth = s(0.9);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = 'rgba(220,236,255,0.45)';
  ctx.fill();
  ctx.strokeStyle = K.colour(a, GOLD[1]);
  ctx.lineWidth = s(0.42);
  ctx.stroke();
  ell(ctx, bx - s(0.5), by - s(0.4), s(0.45), s(0.3), -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  // the little arm back toward its eye
  ctx.beginPath();
  ctx.moveTo(bx - s(1.5), by - s(0.3));
  ctx.quadraticCurveTo(bx - s(3), by - s(0.9), bx - s(3.6), by - s(0.6));
  ctx.strokeStyle = K.colour(a, GOLD[2]);
  ctx.lineWidth = s(0.3);
  ctx.stroke();
}
// The quill (the head's frame): tucked behind its head, or held in its beak.
function quillPose(a, K) {
  const s = K.sc;
  const sk = a.bk;
  const k = sstep(a.rv?.inBeak ?? 0);
  // tucked in its ruff at the back of its neck, lying back along its back (rig space)
  const bp = add(sk.nb, rot([s(-2.6), s(-0.6)], sk.th));
  const bAng = sk.th + Math.PI + 0.32;
  // held in the tip of its beak like a pen, the nib down at the beak's tip, the feather up and out in
  // front of its face (never across its eye)
  const tip = add(sk.hp, rot([s(K.P.beak.at[0] + K.P.beak.len * 0.8), s(K.P.beak.at[1] + 0.3)], sk.ha));
  const kAng = sk.ha - 1.05 + (a.rv?.quillTilt ?? 0);
  // (the angle taken the short way round)
  let d = kAng - bAng;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  // (carried over the top of its head between the two, an arc, never across its face)
  return { x: mix(bp[0], tip[0], k), y: mix(bp[1], tip[1], k) - Math.sin(Math.PI * k) * s(9), ang: bAng + d * k };
}
function quill(ctx, a, mode, K) {
  const s = K.sc;
  const q = quillPose(a, K);
  ctx.translate(q.x, q.y);
  ctx.rotate(q.ang);
  // the nib forward (at -x), the vane up the shaft behind it, a soft round tip
  const L = s(11);
  smooth(ctx, [[s(-1.6), 0], [s(1), s(-0.5)], [s(4), s(-1.6)], [L * 0.75, s(-1.8)], [L, s(-0.6)], [L * 0.98, s(0.4)], [L * 0.7, s(1.1)], [s(3.6), s(0.8)], [s(1), s(0.5)]]);
  if (mode === 'line') {
    ctx.strokeStyle = K.colour(a, '#8a7a6a');
    ctx.lineWidth = s(0.6);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = K.colour(a, QUILL[1]);
  ctx.fill();
  glow(ctx, L * 0.6, s(-0.8), s(3), QUILL[0], 0.8);
  ctx.beginPath();
  ctx.moveTo(s(-1.4), 0);
  ctx.quadraticCurveTo(L * 0.5, s(-0.2), L * 0.96, s(-0.2));
  ctx.strokeStyle = K.colour(a, QUILL[2]);
  ctx.lineWidth = s(0.3);
  ctx.stroke();
  // the nib, dipped in starlight ink
  ell(ctx, s(-1.2), 0, s(0.7), s(0.35));
  ctx.fillStyle = K.colour(a, STARINK[1]);
  ctx.fill();
}
// The scribe's ruff round its neck (at the neck's base): soft white frills.
function ruff(ctx, a, mode, K) {
  const s = K.sc;
  const sk = a.bk;
  // (just under its chin, round the bottom of its neck, where it shows below its head)
  const c = add(sk.hp, rot([s(0.6), s(K.P.head.r * 0.92)], sk.th));
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(sk.th * 0.6 - 0.15);
  const pts = [];
  const n = 9;
  for (let i = 0; i < n * 2; i++) {
    const an = (i / (n * 2)) * TAU;
    const rr = i % 2 ? 0.86 : 1.08;
    pts.push([Math.cos(an) * s(4.4) * rr, Math.sin(an) * s(2.4) * rr]);
  }
  smooth(ctx, pts);
  if (mode === 'line') {
    ctx.strokeStyle = K.colour(a, '#8a82b8');
    ctx.lineWidth = s(0.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = K.colour(a, RUFF[1]);
    ctx.fill();
    glow(ctx, s(1), s(-0.8), s(3.6), RUFF[0], 0.9);
    ctx.strokeStyle = K.colour(a, RUFF[2]);
    ctx.lineWidth = s(0.25);
    for (let i = 0; i < 5; i++) {
      const an = -1.2 + i * 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(an) * s(1.2), Math.sin(an) * s(0.6));
      ctx.lineTo(Math.cos(an) * s(3.6), Math.sin(an) * s(2));
      ctx.stroke();
    }
  }
  ctx.restore();
}
// The ink pot on its breast: a round glass bottle of glowing starlight ink, a gold cork, on a ribbon.
function inkPotAt(a, K) {
  const sk = a.bk;
  return sk.at([7.4, 1.2]);
}
function inkPot(ctx, a, mode, K) {
  const s = K.sc;
  const sk = a.bk;
  const [px, py] = inkPotAt(a, K);
  const sw = Math.sin((a.t ?? 0) * 2.1) * 0.12 + (a.rv?.potSwing ?? 0);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(sk.nb[0] + s(1.4), sk.nb[1] + s(1.6));
    ctx.quadraticCurveTo(px + s(1.6), py - s(3), px, py - s(2));
    ctx.strokeStyle = K.colour(a, '#c86a9a');
    ctx.lineWidth = s(0.45);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(sw);
  ell(ctx, 0, s(0.4), s(1.8), s(1.7));
  if (mode === 'line') {
    ctx.strokeStyle = K.colour(a, '#4a4a8a');
    ctx.lineWidth = s(0.55);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = K.colour(a, '#dfe8ff');
  ctx.fill();
  ctx.save();
  ell(ctx, 0, s(0.4), s(1.8), s(1.7));
  ctx.clip();
  const g = 0.6 + (a.rv?.inkGlow ?? 0) * 0.6;
  ctx.fillStyle = K.colour(a, STARINK[1]);
  ctx.fillRect(-s(2), s(-0.2), s(4), s(3));
  glow(ctx, 0, s(0.8), s(2.2), STARINK[2], 0.5 * g);
  ctx.restore();
  for (const [dx, dy, p] of [[-0.6, 0.9, 0], [0.7, 1.3, 2]]) sparkle(ctx, s(dx), s(dy), s(0.38) * (0.6 + 0.4 * Math.sin((a.t ?? 0) * 3 + p)) * g, 1, STARINK[3]);
  ell(ctx, -s(0.6), -s(0.3), s(0.45), s(0.3), -0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ell(ctx, 0, -s(1.6), s(0.75), s(0.6));
  ctx.fillStyle = K.colour(a, GOLD[1]);
  ctx.fill();
  ctx.restore();
}
// Tiny stars twinkling on its near wing.
function wingStars(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const w = a.bk.wings.near;
  const t = a.t ?? 0;
  for (const [u, v, ph] of [[0.45, 0.25, 0], [0.75, -0.2, 2.1], [1.25, 0.15, 4]]) {
    const base = u < 1 ? [mix(w.root[0], w.wrist[0], u), mix(w.root[1], w.wrist[1], u)] : [mix(w.wrist[0], w.tip[0], u - 1), mix(w.wrist[1], w.tip[1], u - 1)];
    const k = 0.5 + 0.5 * Math.sin(t * 1.7 + ph);
    sparkle(ctx, base[0] + w.c1[0] * K.sc(v * 3), base[1] + w.c1[1] * K.sc(v * 3), K.sc(0.5 + 0.35 * k), 0.85, GOLD[0]);
  }
}
// The scroll it writes on, unrolled on the floor before its feet (rig space).
function scroll(ctx, a, mode, K) {
  const k = sstep(a.rv?.scroll ?? 0);
  if (k < 0.02) return;
  const s = K.sc;
  const x0 = s(6);
  const len = s(14) * k;
  ctx.beginPath();
  ctx.roundRect(x0, -s(0.9), Math.max(0.5, len), s(0.9), s(0.4));
  if (mode === 'line') {
    ctx.strokeStyle = K.colour(a, '#9a845a');
    ctx.lineWidth = s(0.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = K.colour(a, PAPER[0]);
    ctx.fill();
    ctx.strokeStyle = K.colour(a, STARINK[1]);
    ctx.lineWidth = s(0.18);
    const rows = a.rv?.written ?? 0;
    for (let i = 0; i < 3; i++) {
      const w = clamp(rows * 3 - i, 0, 1) * (len - s(2));
      if (w <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(x0 + s(1), -s(0.65) + i * s(0.22));
      ctx.lineTo(x0 + s(1) + w, -s(0.65) + i * s(0.22));
      ctx.stroke();
    }
  }
  for (const x of [x0, x0 + len]) {
    ell(ctx, x, -s(0.9), s(0.9), s(0.9));
    if (mode === 'line') {
      ctx.strokeStyle = K.colour(a, '#9a845a');
      ctx.lineWidth = s(0.5);
      ctx.stroke();
    } else {
      ctx.fillStyle = K.colour(a, PAPER[1]);
      ctx.fill();
    }
  }
}

// ---------- Its moves (units: x, hop in body heights; angles in degrees) ----------
// Quill Jab: the quill taken in its beak, reared back; then two quick jabs.
const QUILLJAB = {
  anticT: 0.4,
  keys: [
    [0, { x: -0.05, pitch: -12, reach: -0.5, head: -18, tailUp: 14, fluff: 0.3, crouch: 0.2 }],
    [0.06, { x: 0.08, pitch: 14, reach: 1, head: 18, tailUp: 22 }, 'out'],
    [0.14, { x: 0.05, pitch: 6, reach: 0.3, head: 6 }, 'in'],
    [0.22, { x: 0.1, pitch: 16, reach: 1.1, head: 20, tailUp: 24 }, 'out'],
    [0.34, { x: 0.06, pitch: 4, reach: 0.2, head: 4, tailUp: 10 }, 'in'],
    [0.6, { x: 0.02, pitch: -2, reach: 0, head: -4, tailUp: 4 }, 'io'],
    [0.9, {}],
  ],
};
// Ink Flick: the quill dipped in its ink pot (head down to its breast); then flicked up and out.
const INKFLICK = {
  anticT: 0.4,
  keys: [
    [0, { pitch: 8, reach: -0.6, head: 58, fluff: 0.2, tailUp: 6 }],
    [0.08, { x: 0.05, pitch: -10, reach: 0.6, head: -36, tailUp: 20, wingN: 0.25 }, 'out'],
    [0.26, { x: 0.04, pitch: -6, reach: 0.4, head: -24, tailUp: 14, wingN: 0.15 }, 'io'],
    [0.6, { x: 0.01, pitch: -2, reach: 0.1, head: -6, tailUp: 4 }, 'io'],
    [0.9, {}],
  ],
};
// Page Flurry: wings flung up wide, fluffed; then one great beat.
const PAGES = {
  anticT: 0.42,
  keys: [
    [0, { x: -0.03, pitch: -8, wingN: 1.05, wingF: 0.95, fluff: 0.6, tailUp: 14, spread: 0.8, crouch: 0.25 }],
    [0.08, { x: 0.08, hop: 0.06, pitch: 10, wingN: -0.45, wingF: -0.2, fluff: 0.3, tailUp: -4, spread: 1 }, 'out'],
    [0.2, { x: 0.08, hop: 0, pitch: 5, wingN: 0.1, wingF: 0.1, spread: 0.4 }, 'in'],
    [0.5, { x: 0.04, pitch: 0, wingN: 0.05, tailUp: 6 }, 'io'],
    [0.9, {}],
  ],
};
// (its own flinch and its pleased hop, with nothing of the base's own effects on them)
const HURT = {
  anticT: 0,
  keys: [[0, {}], [0.05, { x: -0.05, pitch: -10, head: -16, reach: -0.3, wingN: 0.5, wingF: 0.5, fluff: 1, tailUp: 20, beak: 0.4 }, 'out'], [0.2, { x: -0.05, pitch: -6, head: -10, wingN: 0.3, wingF: 0.3, fluff: 0.8, beak: 0.2 }], [0.38, { x: -0.03, pitch: -1, wingN: 0.05, wingF: 0.05, fluff: 0.3 }, 'io'], [0.76, {}]],
};
const FLUTTER = {
  anticT: 0.1,
  keys: [
    [0, { crouch: 0.3, fluff: 0.3 }],
    [0.14, { hop: 0.12, pitch: -10, head: -16, wingN: 0.5, wingF: 0.45, spread: 0.6, tailUp: 18, fluff: 0.5 }, 'out'],
    [0.4, { hop: 0, crouch: 0.15, pitch: -6, head: -12, wingN: 0.15, wingF: 0.12, fluff: 0.7, tailUp: 10 }, 'in'],
    [0.6, { pitch: -6, head: -14, fluff: 0.2 }, 'io'],
    [1.0, {}],
  ],
};

// ---------- Its act ----------
const PIECES = { scribble: 8.4, shiny: 7.6, specs: 6.6, mimic: 7.0 };
const ORDER = ['scribble', 'shiny', 'specs', 'mimic'];
const VOWELS = [0.5, 0.2, 0.7, 0.3, 0];

const look = {
  kind: 'songbird',
  noFly: true,
  ink: INK,
  P: {
    scale: 1.05,
    gait: 'walk',
    body: [[8.8, -3.6], [6.8, -7.6], [2, -9.4], [-3.8, -8.8], [-8.6, -6.4], [-11.6, -2.8], [-11.2, 0.8], [-8.6, 4.6], [-3.8, 7], [1.8, 7.6], [6.8, 5.8], [9.6, 1.4]],
    breast: [6, 2.6, 5],
    neck: { base: [6.4, -5.6], len: 3.4, ang: -64 },
    head: { r: 7.8, rx: 8.2 },
    // (a raven's: long and stout)
    beak: { kind: 'cone', at: [7.2, 0.9], len: 6.8, h: 4.4 },
    // (a raven's long wedge of a tail)
    tail: { root: [-10.6, -1.6], ang: 194, len: 10.8, w: 4, n: 3, spread: 8 },
    moves: ['quill', 'ink', 'pages'],
  },
  C: { ...FEATHERS, guide: '#5a60a8', beak: '#6e6a98', beakSh: '#524e7a', leg: '#5c5a84' },
  moves: { quill: QUILLJAB, ink: INKFLICK, pages: PAGES, hurt: HURT, flutter: FLUTTER },
  face,
  under: {
    // (the scroll on the floor, under everything; the quill tucked behind its head, under its head)
    wingF: scroll,
    head: (ctx, a, mode, K) => {
      if ((a.rv?.inBeak ?? 0) < 0.5) quill(ctx, a, mode, K);
    },
  },
  over: {
    neck: (ctx, a, mode, K) => {
      ruff(ctx, a, mode, K);
      inkPot(ctx, a, mode, K);
    },
    head: (ctx, a, mode, K) => {
      ctx.save();
      specs(ctx, a, mode, K);
      ctx.restore();
      if ((a.rv?.inBeak ?? 0) >= 0.5) quill(ctx, a, mode, K);
    },
    wingN: wingStars,
  },
  pose: (m, a, out, K, mv, mt) => {
    const st = a.mo.rig;
    const now = a.now ?? a.t ?? 0;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const ease = (rate) => 1 - Math.exp(-dt * rate);
    const q = { face: 'calm', inBeak: 0, quillTilt: 0, slide: 0.15, scroll: 0, written: st.rvWritten ?? 0, inkGlow: 0, potSwing: 0, glint: -1, held: null, toss: -1, plink: -1, words: [], blow: 0, zz: 0, sweat: -1, jab: -1, flick: -1, pages: -1, hurtPages: -1, gloat: -1 };
    a.rv = q;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.45) q.face = f;
    };
    const name = a.bdName;
    const alive = m.hp > 0;
    const walking = clamp(a.walkW ?? 0, 0, 1);
    const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && now < (m.habit.until ?? 0)));
    const hurt = alive && (a.hurtAgo ?? 9) >= 0 && (a.hurtAgo ?? 9) < 0.5;
    const fighting = (m.aggroUntil ?? 0) > now;
    const cine = m.cine?.mood;
    // A raven's swagger at rest: chest out a little, the head held high.
    go({ pitch: -4, fluff: 0.15 }, 1 - walking);
    // ----- The act (only while it stands about calm, eased in and out) -----
    const calmGoal = !mv && !napping && !m.pose && !m.cine && !hurt && !fighting && walking < 0.05 && alive && !a.moving ? 1 : 0;
    st.rvCalm = mix(st.rvCalm ?? 0, calmGoal, ease(calmGoal ? 2 : 8));
    const k = sstep(st.rvCalm);
    let PC = st.rvPiece ?? null;
    if (PC && (now < PC.t0 - 0.25 || (k < 0.03 && !calmGoal))) PC = null;
    if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
    if (PC && !PC.name && now >= PC.until) PC = null;
    if (!PC && calmGoal) {
      const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
      st.rvOrd ??= (m.uid ?? 0) % ORDER.length;
      for (let i = 0; i < ORDER.length; i++) {
        const nm = ORDER[(st.rvOrd + i) % ORDER.length];
        if (PIECES[nm] + 0.4 <= left) {
          PC = { name: nm, t0: now + 0.2 };
          st.rvOrd = (st.rvOrd + i + 1) % ORDER.length;
          break;
        }
      }
      if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
    }
    st.rvPiece = PC;
    const piece = PC?.name ?? null;
    const pu = PC?.name ? now - PC.t0 : -1;

    if (k > 0.001 && piece === 'scribble') {
      // the quill into its beak, the scroll unrolled at its feet
      q.inBeak = win(pu, 0.2, 0.6, 7.4, 7.9) * k;
      q.scroll = win(pu, 0.5, 1.2, 7.6, 8.2) * k;
      // writing: head down to it, bobbing in little jerks along the line
      const wr = win(pu, 1.2, 1.6, 5.2, 5.6);
      const jerk = Math.floor((pu - 1.4) * 6) % 2 ? 1 : 0;
      go({ pitch: 22, reach: 0.9, head: 46 + jerk * 6, crouch: 0.35, tailUp: 14 }, wr * k);
      q.quillTilt = (jerk - 0.5) * 0.25 * wr;
      say('down', wr * k);
      if (pu > 1.6 && pu < 5.2) q.written = Math.max(q.written, (pu - 1.6) / 3.6);
      // a blow on the ink; admiring it
      const bl = win(pu, 5.4, 5.6, 6.2, 6.4);
      go({ pitch: 10, reach: 0.3, head: 26, beak: 0.3 }, bl * k);
      q.blow = bl * k;
      say('shut', bl * k);
      const ad = win(pu, 6.4, 6.6, 7.6, 7.9);
      go({ pitch: -6, head: -8, fluff: 0.4 }, ad * k);
      say('proud', ad * k);
    }
    if (k > 0.001 && piece === 'shiny') {
      // something glints on the floor ahead; a snap of its head
      if (pu > 0.2 && pu < 3.4) q.glint = pu;
      const snap = win(pu, 0.5, 0.55, 1.4, 1.6);
      go({ head: 30, reach: 0.3, pitch: 6 }, snap * k);
      say('wide', snap * k);
      // it reaches down and picks it up
      const reach = win(pu, 1.5, 2.0, 2.6, 2.9);
      go({ pitch: 26, reach: 1.15, head: 54, crouch: 0.4 }, reach * k);
      out.beak = Math.max(out.beak ?? 0, pulse(pu, 2.25, 0.3) * 0.6 * k);
      say('focus', reach * k);
      // tossed up, caught
      if (pu > 2.6 && pu < 4.4) q.held = true;
      if (pu >= 3.4 && pu < 4.0) q.toss = (pu - 3.4) / 0.6;
      const up = win(pu, 3.0, 3.3, 3.9, 4.1);
      go({ pitch: -12, head: -36, reach: 0.4 }, up * k);
      out.beak = Math.max(out.beak ?? 0, (pulse(pu, 3.35, 0.2) + pulse(pu, 3.9, 0.2)) * 0.7 * k);
      say('happy', up * k);
      // dropped in its ink pot: plink, the ink glows
      const drop = win(pu, 4.1, 4.4, 4.9, 5.2);
      go({ pitch: 4, reach: -0.6, head: 60 }, drop * k);
      if (pu > 4.6 && pu < 5.8) q.plink = pu - 4.6;
      q.inkGlow = Math.max(q.inkGlow, sstep((pu - 4.7) / 0.2) * (1 - sstep((pu - 6.4) / 1)) * k);
      // a smug ruffle
      const rf = win(pu, 5.5, 5.7, 6.4, 6.6);
      out.fluff = (out.fluff ?? 0) + rf * Math.abs(Math.sin(pu * 30)) * 0.8 * k;
      out.tailUp = (out.tailUp ?? 0) + rf * Math.sin(pu * 30) * 12 * k;
      say('smug', win(pu, 5.4, 5.6, 7.2, 7.6) * k);
    }
    if (k > 0.001 && piece === 'specs') {
      // its glasses slide down its beak; a toss of its head nudges them up; again; chin high; again
      const slide = (t0, t1) => sstep((pu - t0) / (t1 - t0));
      let sl = 0.15 + 0.85 * slide(0.3, 1.4);
      const toss1 = pulse(pu, 1.8, 0.4);
      sl = mix(sl, 0.1, sstep((pu - 1.9) / 0.15));
      sl = mix(sl, 1, slide(2.4, 3.4));
      const toss2 = pulse(pu, 3.8, 0.4);
      sl = mix(sl, 0.05, sstep((pu - 3.9) / 0.15));
      const stiff = win(pu, 4.1, 4.3, 5.3, 5.5);
      sl = mix(sl, 1, slide(4.9, 5.4));
      q.slide = mix(0.15, sl, k);
      go({ head: -22 * (toss1 + toss2), pitch: -6 * (toss1 + toss2) }, k);
      say('down', win(pu, 0.3, 0.4, 1.6, 1.7) * k);
      say('frown', win(pu, 2.6, 2.7, 3.7, 3.8) * k);
      go({ head: -20, pitch: -8, fluff: 0.3 }, stiff * k);
      say('proud', stiff * k);
      const huff = win(pu, 5.5, 5.7, 6.2, 6.5);
      out.fluff = (out.fluff ?? 0) + huff * 0.8 * k;
      say('shut', huff * k);
      if (huff > 0.3) q.blow = huff * k;
    }
    if (k > 0.001 && piece === 'mimic') {
      // tick... tock...: its head swinging like a pendulum, slowly, a beat on each side
      const tt = win(pu, 0.3, 0.6, 4.2, 4.5);
      const sw = Math.sin((pu - 0.4) * Math.PI * 1.25);
      go({ head: -10 + sw * 18, pitch: sw * 3, reach: 0.05 }, tt * k);
      for (let i = 0; i < 4; i++) {
        const t0 = 0.8 + i * 0.8;
        if (pu >= t0 && pu < t0 + 0.75) q.words.push({ text: i % 2 ? 'tock' : 'tick', e: (pu - t0) / 0.75, side: i % 2 ? -1 : 1 });
      }
      out.beak = Math.max(out.beak ?? 0, [0.8, 1.6, 2.4, 3.2].reduce((acc, t0) => acc + pulse(pu, t0, 0.2), 0) * 0.35 * k);
      say('calm', tt * k);
      // CUCKOO!: a hop and a flourish
      const ck = win(pu, 4.6, 4.7, 5.4, 5.7);
      go({ head: -30, pitch: -12, reach: 0.5, wingN: 0.8, wingF: 0.7, spread: 1, fluff: 0.5, tailUp: 20 }, ck * k);
      out.hop = (out.hop ?? 0) + pulse(pu, 4.6, 0.5) * 0.08 * k;
      out.beak = Math.max(out.beak ?? 0, (pulse(pu, 4.7, 0.3) + pulse(pu, 5.05, 0.3)) * k);
      if (pu >= 4.65 && pu < 5.9) q.words.push({ text: 'cuckoo!', e: (pu - 4.65) / 1.25, side: 1, big: true });
      say('happy', ck * k);
      say('proud', win(pu, 5.7, 5.9, 6.6, 7.0) * k);
    }
    q.calm = k;
    // (its own marks over its head: "!" as it starts hunting you, "?" when it loses you)
    if (fighting && alive && !st.rvHunt) st.rvBangAt = now;
    if (!fighting && st.rvHunt && alive) st.rvLostAt = now;
    st.rvHunt = fighting && alive;
    q.bang = now - (st.rvBangAt ?? -9);
    q.huh = now - (st.rvLostAt ?? -9);
    // ----- Hunting you: crouched, quill in its beak, brow down -----
    if (fighting && alive && !hurt && !mv) {
      go({ crouch: 0.25, pitch: 6, reach: 0.2, head: 8, fluff: 0.3, tailUp: 10 }, 1 - walking * 0.5);
      q.inBeak = 1;
      q.face = 'fierce';
    }
    const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;
    if (low && !mv) {
      if (q.face === 'calm') q.face = 'worried';
      q.sweat = ((a.t ?? 0) * 0.5) % 1;
    }
    // ----- Its moves -----
    if (mv && alive) {
      if (name === 'quill') {
        q.inBeak = 1;
        q.face = mt < 0 ? 'focus' : mt < 0.4 ? 'fierce' : 'smug';
        if (mt >= 0) q.jab = mt;
      } else if (name === 'ink') {
        q.inBeak = 1;
        q.face = mt < 0 ? 'down' : mt < 0.4 ? 'fierce' : 'smug';
        q.potSwing = mt < 0 ? 0.3 : 0;
        if (mt >= 0) q.flick = mt;
      } else if (name === 'pages') {
        q.inBeak = 1;
        q.face = mt < 0 ? 'focus' : mt < 0.35 ? 'fierce' : 'calm';
        if (mt >= 0) q.pages = mt;
      } else if (name === 'hurt') {
        q.face = 'hurt';
        q.hurtPages = mt;
      } else if (name === 'flutter') {
        q.face = 'smug';
        q.gloat = mt;
      }
    } else if (hurt) q.face = 'hurt';
    // ----- A nap (its habitat) -----
    if (napping && !mv) {
      q.face = 'sleep';
      q.zz = 1;
    }
    if (alive && !mv && !hurt && !napping) {
      if (cine === 'happy') q.face = 'happy';
      else if (cine === 'sad') q.face = 'sad';
      else if (cine === 'angry') q.face = 'fierce';
      else if (cine === 'talk' || m.talking) out.beak = Math.max(out.beak ?? 0, VOWELS[Math.floor(now * 7) % VOWELS.length]);
    }
    if (!alive) q.face = 'dizzy';
    // the face: an in-between (a blink) on every change; its own blink
    let f = q.face;
    if (f !== st.rvFace) {
      st.rvFaceFrom = st.rvFace;
      st.rvFace = f;
      st.rvFaceAt = now;
    }
    const OPEN = new Set(['calm', 'wide', 'surprised', 'focus', 'fierce', 'down', 'up', 'frown', 'worried', 'sad', 'back']);
    if (now - (st.rvFaceAt ?? -9) < 0.07 && OPEN.has(f) && OPEN.has(st.rvFaceFrom)) f = 'shut';
    if (((now + (m.uid ?? 0) * 0.63) % 4.1) < 0.12 && OPEN.has(f)) f = 'shut';
    q.face = f;
    st.rvWritten = q.written;
    // (everything soft eased, so nothing snaps)
    for (const key of ['inBeak', 'slide', 'scroll', 'inkGlow', 'quillTilt']) {
      st[`rv_${key}`] = mix(st[`rv_${key}`] ?? q[key], q[key], ease(key === 'slide' ? 18 : key === 'inBeak' ? 7 : key === 'quillTilt' ? 22 : 10));
      q[key] = st[`rv_${key}`];
    }
  },
  // Napping: settled down fluffed up, its head tucked into its ruff, a slow breath.
  after: (m, a, out) => {
    const napping = m.hp > 0 && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)));
    if (!napping) return;
    const b = Math.sin((a.t ?? 0) * 1.3);
    Object.assign(out, { x: 0, hop: 0, crouch: 0, sit: 1, sleep: 0.4, reach: -0.5, fluff: 0.8 + b * 0.06, pitch: 2, head: 16 + b * 2, beak: 0, wingN: 0, wingF: 0, flap: 0, spread: 0, tailUp: -4 });
  },
  fx: (ctx, m, a, K) => fx(ctx, m, a, K),
};

// ---------- Live effects (rig space, game px, its feet at 0, 0) ----------
// A drop of starlight ink: deep blue, round at the bottom, a gold glint.
function inkDrop(ctx, x, y, r, al, ang = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -r * 2);
  ctx.bezierCurveTo(r * 0.35, -r * 1.4, r * 1.05, -r * 0.6, r, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.bezierCurveTo(-r * 1.05, -r * 0.6, -r * 0.35, -r * 1.4, 0, -r * 2);
  ctx.closePath();
  ctx.strokeStyle = STARINK[0];
  ctx.lineWidth = Math.max(0.3, r * 0.35);
  ctx.stroke();
  ctx.fillStyle = STARINK[1];
  ctx.fill();
  ell(ctx, -r * 0.35, -r * 0.4, r * 0.3, r * 0.4, -0.4);
  ctx.fillStyle = STARINK[3];
  ctx.fill();
  ctx.restore();
}
// An ink splat: a soft round star of ink with a gold glint at its heart.
function splat(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.55 : r;
    pts.push([x + Math.cos(an) * rr, y + Math.sin(an) * rr]);
  }
  smooth(ctx, pts);
  ctx.strokeStyle = STARINK[0];
  ctx.lineWidth = Math.max(0.3, r * 0.25);
  ctx.stroke();
  ctx.fillStyle = STARINK[1];
  ctx.fill();
  sparkle(ctx, x, y, r * 0.55, 1, GOLD[1]);
  ctx.restore();
}
// A loose page: a little cream sheet with lines of writing, turning over as it flutters.
function page(ctx, x, y, s, ang, turn, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(Math.max(0.15, Math.abs(Math.cos(turn))), 1);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.roundRect(-s * 1.3, -s, s * 2.6, s * 2, s * 0.3);
    if (pass === 'line') {
      ctx.strokeStyle = '#9a845a';
      ctx.lineWidth = Math.max(0.35, s * 0.35);
      ctx.stroke();
    } else {
      ctx.fillStyle = PAPER[0];
      ctx.fill();
    }
  }
  ctx.strokeStyle = STARINK[1];
  ctx.lineWidth = Math.max(0.2, s * 0.14);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, -s * 0.45 + i * s * 0.45);
    ctx.lineTo(s * (0.9 - (i === 2 ? 0.6 : 0)), -s * 0.45 + i * s * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}
// A word in the air (the clock it mimics): soft round letters with a white rim, always the right
// way round.
function word(ctx, a, text, x, y, size, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.34;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = '#5a5aa8';
  ctx.fillText(text, 0, 0);
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
  ctx.strokeStyle = '#5a5aa8';
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#f0f2ff';
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
    smooth(ctx, [[-5.4, -5], [5.4, -5.2], [5.8, 3.4], [1.2, 4.6], [-0.4, 7.2], [-1.6, 4.6], [-5.6, 3.4]]);
    if (pass === 'line') {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? '#e8608e' : '#5a5aa8';
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
function dizzy(ctx, x, y, r, t) {
  for (let i = 0; i < 3; i++) {
    const an = t * 3.2 + (i * TAU) / 3;
    const px = x + Math.cos(an) * r;
    const py = y + Math.sin(an) * r * 0.32;
    if (i % 2) sparkle(ctx, px, py, r * 0.26, Math.sin(an) > 0 ? 1 : 0.6, GOLD[1]);
    else splat(ctx, px, py, r * 0.22, Math.sin(an) > 0 ? 1 : 0.65);
  }
}

function fx(ctx, m, a, K) {
  const q = a.rv;
  const bk = a.bk;
  if (!q || !bk) return;
  const s = K.sc;
  const t = (a.now ?? a.t ?? 0) + (m.uid ?? 0) * 0.47;
  const top = add(bk.hp, [s(0), -s(13)]);
  if (m.hp <= 0) {
    dizzy(ctx, top[0], top[1] + s(3), s(6), a.now ?? 0);
    return;
  }
  const tip = bk.beakTip;
  // blowing on the ink: a soft puff off its beak
  if ((q.blow ?? 0) > 0.2) {
    for (let i = 0; i < 2; i++) {
      const f = (t * 1.8 + i * 0.5) % 1;
      ctx.save();
      ctx.globalAlpha *= q.blow * Math.sin(Math.PI * f) * 0.8;
      ell(ctx, tip[0] + s(1) + f * s(4), tip[1] + f * s(2), s(0.8) + f * s(0.6), s(0.7) + f * s(0.5));
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  }
  // the shiny thing: a glint on the floor ahead, then in its beak, tossed and caught, dropped in the pot
  if ((q.glint ?? -1) >= 0 && !q.held) sparkle(ctx, s(16), -s(0.6), s(1.1) * (0.7 + 0.3 * Math.sin(t * 9)), 1, GOLD[1]);
  if (q.held) {
    let p = tip;
    if ((q.toss ?? -1) >= 0) p = add(tip, [s(0.5), -Math.sin(Math.PI * q.toss) * s(8)]);
    if ((q.plink ?? -1) < 0) sparkle(ctx, p[0], p[1], s(0.9), 1, GOLD[1]);
  }
  if ((q.plink ?? -1) >= 0 && q.plink < 1.2) {
    const [px, py] = inkPotAt(a, K);
    const e = q.plink;
    if (e < 0.25) sparkle(ctx, mix(tip[0], px, e / 0.25), mix(tip[1], py - s(1.6), e / 0.25), s(0.8), 1, GOLD[1]);
    else for (let i = 0; i < 3; i++) sparkle(ctx, px + (i - 1) * s(1.4) * (e - 0.25) * 3, py - s(2) - (e - 0.25) * s(5) - (i % 2) * s(1), s(0.5) * (1 - (e - 0.25) / 0.95), 1, STARINK[3]);
  }
  // the clock it mimics: tick... tock... CUCKOO!
  for (const w of q.words ?? []) {
    const al = Math.min(1, w.e * 8, (1 - w.e) * 4);
    const size = w.big ? s(4.4) : s(2.8);
    const pop = 1 + (w.big ? 0.25 * Math.sin(Math.min(1, w.e * 5) * Math.PI) : 0);
    word(ctx, a, w.text, bk.hp[0] + s(4) * w.side + s(2), bk.hp[1] - s(11) - w.e * s(3), size * pop, al);
  }
  // ----- Quill Jab: ink spattering at each jab -----
  if ((q.jab ?? -1) >= 0) {
    for (const t0 of [0.06, 0.22]) {
      const e = (q.jab - t0) / 0.4;
      if (e < 0 || e > 1) continue;
      splat(ctx, tip[0] + s(1.5), tip[1], s(1.1) * (0.6 + 0.4 * Math.sin(Math.PI * Math.min(1, e * 2))), 1 - sstep((e - 0.5) / 0.5));
      for (let i = 0; i < 3; i++) {
        const an = -0.7 + i * 0.7;
        inkDrop(ctx, tip[0] + s(1.5) + Math.cos(an) * e * s(6), tip[1] + Math.sin(an) * e * s(5) + e * e * s(4), s(0.45), 1 - e, an + Math.PI / 2);
      }
    }
  }
  // ----- Ink Flick: a spray of starlight ink arcing out at you, splatting where it lands -----
  if ((q.flick ?? -1) >= 0 && q.flick < 1.0) {
    const e0 = q.flick;
    if (!a.mo.rvFlick || e0 < 0.03) a.mo.rvFlick = [...tip];
    const [ox, oy] = a.mo.rvFlick;
    for (let i = 0; i < 6; i++) {
      const u = clamp((e0 - 0.04 - i * 0.03) / 0.55, 0, 1);
      if (u <= 0) continue;
      const x = ox + (s(14) + i * s(3.4)) * u;
      const y = oy + (-s(10) - (i % 3) * s(2)) * u + s(26) * u * u;
      if (y >= -s(0.4)) splat(ctx, x, -s(0.4), s(0.9), 1 - sstep((e0 - 0.7) / 0.3));
      else inkDrop(ctx, x, y, s(0.6), 1, Math.atan2(-s(10) + s(52) * u, s(14)) + Math.PI / 2);
    }
  } else a.mo.rvFlick = null;
  // ----- Page Flurry: loose pages fluttering out at you -----
  if ((q.pages ?? -1) >= 0 && q.pages < 1.0) {
    const e0 = q.pages;
    const w = bk.wings.near;
    for (let i = 0; i < 6; i++) {
      const u = clamp((e0 - 0.06 - i * 0.04) / 0.8, 0, 1);
      if (u <= 0) continue;
      const x = w.wrist[0] + sstep(u) * (s(16) + i * s(4));
      const y = w.wrist[1] - s(2) + Math.sin(u * 8 + i) * s(2) + u * s(4) * (i % 2 ? 1 : -0.5);
      page(ctx, x, y, s(1.2), Math.sin(u * 6 + i) * 0.5, u * 9 + i, 1 - sstep((u - 0.75) / 0.25));
    }
  }
  // hurt: a couple of loose pages flutter off it
  if ((q.hurtPages ?? -1) >= 0 && q.hurtPages < 0.7) {
    const e = q.hurtPages / 0.7;
    for (let i = 0; i < 2; i++) page(ctx, bk.pivot[0] - s(3) + i * s(5) - e * s(4) * (i ? -1 : 1), bk.pivot[1] - s(6) - e * s(6), s(1), e * 3 * (i ? 1 : -1), e * 7 + i, 1 - e);
  }
  if ((q.gloat ?? -1) >= 0 && q.gloat < 0.9) sparkle(ctx, top[0] - s(4), top[1] + s(4) - q.gloat * s(4), s(1.4) * Math.sin(Math.PI * q.gloat / 0.9), 1, GOLD[1]);
  if ((q.sweat ?? -1) >= 0) sweat(ctx, bk.hp[0] - s(5), bk.hp[1] - s(4) + (q.sweat % 1) * s(2), s(0.8), Math.sin(Math.PI * (q.sweat % 1)));
  if ((q.zz ?? 0) > 0.05) {
    for (let i = 0; i < 2; i++) {
      const f = ((a.now ?? 0) * 0.4 + i * 0.5) % 1;
      zee(ctx, top[0] + s(3) + f * s(4), top[1] + s(4) - f * s(6), 0.6 + f * 0.5, q.zz * Math.sin(Math.PI * f), a.flip);
    }
  }
  if (q.bang >= 0 && q.bang < 1.1) bubble(ctx, top[0] + s(3), top[1], '!', q.bang, 1.1, a.flip);
  else if (q.huh >= 0 && q.huh < 1.4) bubble(ctx, top[0] + s(3), top[1], '?', q.huh, 1.4, a.flip);
}

const BIRD = dressedBird(look);
// (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: its marks over its head left
// to it, drawn here in its own style)
export const RAVEN_SCRIBE_ART = { ...BIRD.art, pad: 12, noHop: true, ownEmotes: true };
export const RAVEN_SCRIBE_SIZE = { w: BIRD.w, h: Math.round(BIRD.bodyH * 1.05), speed: BIRD.speed };
