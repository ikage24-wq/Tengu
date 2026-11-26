// The Rockhound Kid (2026-11-25, remade on the hoofed base, the player's pick "C" of three, Yodel):
// Windy Canyon's level 9 monster of the Dry Riverbed and the Cliff Shelves: a fluffy cream cliff goat
// kid with honey horn nubs, long soft ears, a little chin tuft and big honey eyes with soft, wide,
// kind goat pupils, in a hand-woven poncho striped like a canyon sunset (cream, teal with gold
// diamonds, magenta; gold tassels on its scalloped hem) and a brass bell on a red cord. It loves the
// sound of its own voice coming back off the canyon walls. It moves on its own copy of the hoofed
// base (hoofbase.js: its goat kid's bones, walk, springs and moves), drawn at 0.88.
//   idle    a 31 s act (see its pose below), only while it stands about:
//           - the yodel: it plants its hooves, fills its chest, lifts its chin and yodels (three
//             swells of "yo-de-lay", notes tumbling out ahead); then quiet: ears perking one by one
//             as smaller notes drift back from behind it, the echo; delighted, a spring-jump;
//           - a tumbleweed rolls in on the wind: a startled hop; it sniffs it, nibbles a twig,
//             chewing happily... and the wind takes it rolling away; a little pout;
//           - canyon dust drifts past its nose: "ah... ah..." (squinting, chin rising twice) and a
//             big sneeze that snaps its head down and clangs the bell; then a whole-body shake, ears,
//             tassels and bell all flapping;
//           - headbutt practice: a cocky look, a paw at the ground, two butts at nothing and a big
//             third that overshoots: a stumble, swirly eyes and little stars round its head; it
//             shakes it off with a grin;
//           - king of the cliff: up on its hind legs, chin high, poncho in the wind; then a huge
//             yawn and a sleepy blink.
//   moves   (def.moves order) the headbutt (rocks back pawing, charges head down, a clonk of
//           sparkles), the yodel blast (chest puffed, then a burst of notes and soft sound rings out
//           ahead), the buck (weight onto the forelegs, both hinds kick out, the bell clangs).
//   faces   content, singing, listening, startled, curious, chewing, pouting, squinting, sneezing,
//           cocky, dizzy, proud, yawning, sleepy, happy, hurt (squeezed shut), asleep (lying down,
//           legs folded, the poncho tucked round it, a sunset-orange "z"), and soft swirl eyes when
//           it is beaten.
// Everything drawn here from scratch (the face too). No animals of any kind ride along.
import { dressedHoof } from './hoofbase.js';

const TAU = Math.PI * 2;
const S = 0.88;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const frac = (v) => v - Math.floor(v);
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a quick soft pulse 0..1..0 over [t0, t0 + d])
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
// (0..1 through [t0, t0 + d], else -1)
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const hexRgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const blend = (p, q, u) => {
  const A = hexRgb(p);
  const B = hexRgb(q);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, '0')).join('')}`;
};
// (a colour, washed toward white while it flashes from a hit)
const tone = (a, hex, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  const f = (v) => Math.round(v + (255 - v) * k);
  const [r, g, b] = hexRgb(hex);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
const glow = (ctx, c, r, al, hex) => {
  const [cr, cg, cb] = hexRgb(hex);
  const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], Math.max(0.01, r));
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
};
const sparkle = (ctx, x, y, k) => {
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
};
// (a line through points: outline pass a fat stroke of the ink, fill pass the line itself)
function strand(ctx, mode, pts, w, col, ink) {
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = mode === 'line' ? ink : col;
  ctx.lineWidth = mode === 'line' ? w + 2 : w;
  ctx.stroke();
}

const INK = '#8c6a70';
const YD = {
  fur: '#fbf2e6', furLt: '#ffffff', furSh: '#e9dac8', furDeep: '#cdb7a4', nose: '#eca6a2',
  poncho: '#ee7d55', ponchoLt: '#ffa77a', ponchoSh: '#cc5c43', stripe: ['#fff0d2', '#3c9c9a', '#d9507a', '#f6c24c'],
  bell: '#f2c14e', bellLt: '#fff1b0', bellSh: '#bb8530', cord: '#c9465a',
  iris0: '#8a4a12', iris1: '#e0962e', iris2: '#ffe08a', pupil: '#3a2412', lid: '#6c4650', lowLid: '#efd6c6', blush: '#ffa0a6', mouth: '#8c3c4c', tongue: '#ff8a9e',
  notes: ['#ff8a5c', '#f6b23c', '#e86a9a', '#4fb0ac'], weed: '#d9a86c', weedSh: '#b78450', weedInk: '#9a6a4a', dust: '#f3dcc0', zed: '#e0704c', star: '#ffd86a',
};

// ---------- Its face ----------
// Open eyes: [lid (0 wide .. 1 shut), gaze x (+ toward the snout), gaze y (+ down), brow (+ the lid
// slanting down toward the snout: cocky; - up toward it: worried), pupil size].
const EYES = {
  open: [0, 0.08, 0, 0, 1],
  listen: [0, -0.85, -0.1, -0.2, 1],
  startled: [-0.15, 0.05, -0.05, -0.4, 0.72],
  curious: [0, 0.35, 0.45, -0.15, 1.05],
  pout: [0.3, 0.3, 0.3, -0.7, 1],
  squint: [0.62, 0.2, -0.3, 0.1, 0.9],
  cocky: [0.44, 0.3, 0.05, 0.75, 0.95],
  sleepy: [0.6, 0.1, 0.2, -0.2, 1],
  proud: [0.5, 0.25, -0.2, 0.35, 1],
};
// Closed eyes, by face: a happy arc, a soft shut curve, a tight squeeze, a swirl.
const SHUT = { sing: 'happy', happy: 'happy', chew: 'happy', blink: 'shut', sleep: 'shut', yawn: 'squeeze', sneeze: 'squeeze', hurt: 'squeeze', dizzy: 'swirl', dead: 'swirl' };
function closed(ctx, col, x, y, rx, ry, kind, w, t) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'happy') {
    ctx.moveTo(x - rx, y + ry * 0.25);
    ctx.quadraticCurveTo(x, y - ry * 0.8, x + rx, y + ry * 0.25);
  } else if (kind === 'squeeze') {
    ctx.moveTo(x - rx * 0.85, y - ry * 0.45);
    ctx.quadraticCurveTo(x + rx * 0.1, y - ry * 0.1, x + rx * 0.6, y + ry * 0.02);
    ctx.quadraticCurveTo(x + rx * 0.1, y + ry * 0.14, x - rx * 0.85, y + ry * 0.5);
  } else if (kind === 'swirl') {
    // (a soft spiral, turning slowly)
    for (let i = 0; i <= 26; i++) {
      const q = (i / 26) * TAU * 1.6 + t * 4;
      const r = (i / 26) * rx * 0.95;
      const p = [x + Math.cos(q) * r, y + Math.sin(q) * r * (ry / rx)];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
  } else {
    ctx.moveTo(x - rx, y + ry * 0.05);
    ctx.quadraticCurveTo(x, y + ry * 0.62, x + rx, y);
  }
  ctx.stroke();
}
// The eye, honey goat: big and round, a warm honey iris lit gold at the bottom, a soft wide rounded
// pupil (a goat's, but plump and kind), a big round glint over it and a little one; a curved upper
// lid with a thick lash line and two lashes swept back; a pale lower lid.
function eye(ctx, a, x, y, k, face, t) {
  const rx = 1.75 * k;
  const ry = 1.95;
  const ink = tone(a, YD.lid);
  if (SHUT[face]) return closed(ctx, ink, x, y, rx, ry * 0.8, SHUT[face], 0.45, t);
  const [lid, gx, gy, brow, pk] = EYES[face] ?? EYES.open;
  const ryE = ry * (1 + Math.max(0, -lid) * 0.5);
  ell(ctx, x, y, rx, ryE);
  ctx.fillStyle = tone(a, '#fffdf8');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, rx, ryE);
  ctx.clip();
  const ix = x + rx * (0.08 + gx * 0.3);
  const iy = y + ry * (0.04 + gy * 0.25);
  const ir = 0.92 * (Math.max(0, -lid) > 0 ? 0.86 : 1);
  const g = ctx.createRadialGradient(ix, iy + ry * 0.7, 0, ix, iy, ry);
  g.addColorStop(0, tone(a, YD.iris2));
  g.addColorStop(0.5, tone(a, YD.iris1));
  g.addColorStop(1, tone(a, YD.iris0));
  ell(ctx, ix, iy, rx * ir, ry * ir);
  ctx.fillStyle = g;
  ctx.fill();
  // (the pupil: a soft wide capsule)
  const pw = rx * 0.62 * pk;
  const ph = ry * 0.3 * pk;
  ctx.beginPath();
  ctx.moveTo(ix - pw + ph, iy - ph);
  ctx.lineTo(ix + pw - ph, iy - ph);
  ctx.arc(ix + pw - ph, iy, ph, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(ix - pw + ph, iy + ph);
  ctx.arc(ix - pw + ph, iy, ph, Math.PI / 2, Math.PI * 1.5);
  ctx.fillStyle = tone(a, YD.pupil);
  ctx.fill();
  glow(ctx, [x, y - ry * 1.05], ry * 0.75, 0.5, YD.iris0);
  // (the lid coming down, slanting with the brow)
  const ly = y - ryE + 2 * ryE * Math.max(0, lid);
  const sl = brow * ry * 0.45;
  if (lid > 0.15) {
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.5, y - ryE * 2);
    ctx.lineTo(x + rx * 1.5, y - ryE * 2);
    ctx.lineTo(x + rx * 1.5, ly + sl);
    ctx.quadraticCurveTo(x, ly - ry * 0.2, x - rx * 1.5, ly - sl);
    ctx.closePath();
    ctx.fillStyle = tone(a, YD.fur);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  const gy0 = Math.max(iy - ry * 0.36, ly + ry * 0.35);
  ell(ctx, ix - rx * 0.28, gy0, rx * 0.32, rx * 0.32);
  ctx.fill();
  ell(ctx, ix + rx * 0.4, iy + ry * 0.4, rx * 0.13, rx * 0.13);
  ctx.fill();
  // the upper lid line (with its two lashes at the back corner)
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  let back;
  if (lid > 0.15) {
    ctx.moveTo(x - rx * 1.02, ly - sl * 0.7 + ry * 0.05);
    ctx.quadraticCurveTo(x, ly - ry * 0.18, x + rx * 1.0, ly + sl * 0.7 + ry * 0.05);
    back = [x - rx * 1.0, ly - sl * 0.7];
  } else {
    ctx.ellipse(x, y, rx * 1.03, ryE * 1.02, 0, Math.PI * 1.04, Math.PI * 1.92);
    back = [x - rx, y - ryE * 0.2];
  }
  ctx.stroke();
  if (k > 0.8) {
    ctx.lineWidth = 0.36;
    for (const [dx, dy, ex, ey] of [[0, 0, -0.55, -0.3], [0.1, -0.35, -0.42, -0.8]]) {
      ctx.beginPath();
      ctx.moveTo(back[0] + rx * dx, back[1] + ry * dy);
      ctx.quadraticCurveTo(back[0] + rx * (dx - 0.32), back[1] + ry * (dy - 0.02), back[0] + rx * ex, back[1] + ry * (dy + ey));
      ctx.stroke();
    }
  }
  ctx.strokeStyle = tone(a, YD.lowLid);
  ctx.lineWidth = 0.32;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.97, ryE * 1.0, 0, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}
// Its mouth, by face: a small smile, a little "o", the yodel (opening wide with `open`), chewing a
// twig, a pout, a cocky smirk, a yawn, a tight sneeze, a wobble when hurt.
function mouth(ctx, a, face, open, t, Y) {
  ctx.strokeStyle = tone(a, YD.mouth);
  ctx.lineWidth = 0.4;
  ctx.lineCap = 'round';
  const oval = (x, y, rx, ry, tongue = true) => {
    ell(ctx, x, y, rx, ry);
    ctx.fillStyle = tone(a, YD.mouth);
    ctx.fill();
    if (tongue && ry > 0.5) {
      ell(ctx, x, y + ry * 0.45, rx * 0.66, ry * 0.42);
      ctx.fillStyle = tone(a, YD.tongue);
      ctx.fill();
    }
  };
  if (open > 0.05) return oval(8.4, 5.7, 0.9 + open * 0.45, 0.5 + open * 1.05);
  if (face === 'yawn') return oval(8.3, 5.9, 1.3, 1.6);
  if (face === 'listen' || face === 'startled' || face === 'squint' || face === 'dead') return oval(8.6, 5.6, 0.55, face === 'squint' ? 0.4 + 0.2 * Math.sin(t * 9) : 0.6, false);
  if (face === 'hurt') return oval(8.5, 5.7, 0.8, 0.75);
  ctx.beginPath();
  if (face === 'chew') {
    const c = Math.sin(t * 13) * 0.3;
    ctx.moveTo(9.2, 5.3 + c * 0.4);
    ctx.quadraticCurveTo(8.5, 6.0 + c, 7.8, 5.4);
    ctx.stroke();
    // the twig it's nibbling, poking out of the corner of its mouth
    ctx.strokeStyle = tone(a, YD.weedSh);
    ctx.lineWidth = 0.45;
    ctx.beginPath();
    ctx.moveTo(8.6, 5.6);
    ctx.lineTo(11.2, 5.0 + c);
    ctx.moveTo(10.2, 5.2 + c * 0.8);
    ctx.lineTo(10.9, 4.3 + c);
    ctx.stroke();
    return;
  }
  if (face === 'pout') {
    ctx.moveTo(9.3, 5.8);
    ctx.quadraticCurveTo(8.6, 5.2, 7.9, 5.8);
  } else if (face === 'sneeze') {
    ctx.moveTo(9.4, 5.4);
    ctx.lineTo(7.8, 5.6);
  } else if (face === 'cocky' || face === 'proud') {
    ctx.moveTo(9.5, 4.8);
    ctx.quadraticCurveTo(8.9, 6.0, 7.6, 5.6);
    ctx.quadraticCurveTo(7.3, 5.4, 7.2, 5.1);
  } else if (face === 'dizzy') {
    ctx.moveTo(9.4, 5.4);
    ctx.quadraticCurveTo(9.0, 5.0 + Y, 8.6, 5.5);
    ctx.quadraticCurveTo(8.2, 6.0 - Y, 7.8, 5.5);
  } else if (face === 'happy' || face === 'sing') {
    ctx.moveTo(9.5, 4.9);
    ctx.quadraticCurveTo(8.7, 6.4, 7.5, 5.4);
  } else {
    ctx.moveTo(9.4, 5.0);
    ctx.quadraticCurveTo(8.7, 6.0, 7.6, 5.4);
  }
  ctx.stroke();
}
function face(ctx, a) {
  const L = a.yd ?? {};
  const f = L.face ?? 'open';
  const t = a.t ?? 0;
  ctx.save();
  ctx.scale(S, S);
  glow(ctx, [4.6, 3.0], 2.4, f === 'proud' || f === 'happy' ? 0.75 : 0.55, YD.blush);
  eye(ctx, a, 7.4, -1.0, 0.56, f, t);
  eye(ctx, a, 3.4, -0.5, 1, f, t);
  // the nose at the muzzle's tip (wrinkling as a sneeze builds)
  const wr = f === 'squint' ? 0.15 * Math.sin(t * 20) : 0;
  ell(ctx, 10.2, 3.5 + wr, 0.75, 0.55, 0.5);
  ctx.fillStyle = tone(a, YD.nose);
  ctx.fill();
  mouth(ctx, a, f, L.mouth ?? 0, t, Math.sin(t * 6) * 0.3);
  ctx.restore();
}
// The beard: a little tuft under the chin, rooted inside it, swaying.
function beard(ctx, a, mode, K) {
  const L = a.yd ?? {};
  K.headFrame(ctx, a);
  ctx.scale(S, S);
  const t = a.t ?? 0;
  const sw = Math.sin(t * 2.1) * 0.15 + (L.mouth ?? 0) * Math.sin(t * 22) * 0.12 + (L.jingle ?? 0) * Math.sin(t * 18) * 0.3;
  const root = [7.2, 6.4];
  const tip = [root[0] - 0.6 + sw * 2, root[1] + 3.2];
  ctx.beginPath();
  ctx.moveTo(root[0] - 1.3, root[1] - 0.4);
  ctx.quadraticCurveTo(root[0] - 1.4, root[1] + 1.8, tip[0], tip[1]);
  ctx.quadraticCurveTo(root[0] + 1.2, root[1] + 1.6, root[0] + 1.1, root[1] - 0.4);
  ctx.closePath();
  if (mode === 'line') {
    ctx.strokeStyle = tone(a, INK);
    ctx.lineWidth = 2 / S;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = tone(a, YD.fur);
  ctx.fill();
  ctx.strokeStyle = tone(a, YD.furSh);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.moveTo(root[0] - 0.2, root[1] + 0.6);
  ctx.quadraticCurveTo(root[0] - 0.4, root[1] + 1.8, tip[0] + 0.1, tip[1] - 0.6);
  ctx.stroke();
}

// ---------- Its poncho and bell ----------
// The poncho: draped over the withers and the chest, woven stripes near its hem, a scalloped hem
// with tassels swinging under it; drawn over the near foreleg so the leg comes out from under it.
// (It follows the body's own outline points, so it rides every bend, rear and lie-down.)
function poncho(ctx, a, mode, K) {
  const L = a.yd ?? {};
  const sk = K.skel(a);
  const t = a.t ?? 0;
  const B = K.P.body;
  const P = (i, dx, dy) => sk.bodyPt([B[i][0] + dx, B[i][1] + dy, B[i][2], B[i][3], B[i][4]]);
  const hemF = sk.bodyPt([9.6, 4.2, 0.6, 0, 0]);
  const hemB = sk.at([-4.6, 0.6]);
  const top = [P(3, 0.2, -0.7), P(2, 0, -0.8), P(1, 0, -0.85), P(0, 0.2, -0.8), P(16, 0.7, -0.4), P(15, 0.8, 0), P(14, 0.8, 0.2), P(13, 0.6, 0.3)];
  const N = 6;
  const hem = [];
  // (the wind lifts the hem a touch at the back)
  const lift = (L.wind ?? 0) * (0.8 + 0.4 * Math.sin(t * 9));
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    hem.push([mix(hemF[0], hemB[0], u) - u * lift * 0.8, mix(hemF[1], hemB[1], u) - u * u * lift * 1.6]);
  }
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...top[0]);
    for (let i = 1; i < top.length; i++) {
      const p = top[i - 1];
      const q = top[i];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.lineTo(...top[top.length - 1]);
    ctx.lineTo(...hem[0]);
    for (let i = 1; i <= N; i++) {
      const p = hem[i - 1];
      const q = hem[i];
      ctx.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 1.3, q[0], q[1]);
    }
    const back = sk.at([-4.4, -4.4]);
    ctx.quadraticCurveTo(back[0] - 0.8, back[1], top[0][0], top[0][1]);
    ctx.closePath();
  };
  // tassels from every other scallop point, swinging (harder as it jingles or the wind blows)
  const jig = (L.jingle ?? 0) + (L.wind ?? 0) * 0.6;
  const tassels = hem.slice(1, N).filter((_, i) => i % 2 === 0).map((p, i) => {
    const sw = Math.sin(t * 3.2 + i * 1.3) * 0.5 + jig * Math.sin(t * 14 + i) * 0.9 - (L.wind ?? 0) * 0.8;
    return [[p[0], p[1] + 0.6], [p[0] + sw * 0.6, p[1] + 2.0], [p[0] + sw, p[1] + 3.0]];
  });
  if (mode === 'line') {
    path();
    ctx.strokeStyle = tone(a, INK);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    for (const tp of tassels) strand(ctx, 'line', tp, 0.9, null, tone(a, INK));
    return;
  }
  for (const tp of tassels) {
    strand(ctx, 'fill', tp, 0.9, tone(a, YD.stripe[3]), null);
    ell(ctx, tp[2][0], tp[2][1], 0.75, 0.9);
    ctx.fillStyle = tone(a, YD.stripe[3]);
    ctx.fill();
  }
  path();
  ctx.fillStyle = tone(a, YD.poncho);
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  const band = (off, w, col) => {
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const p = hem[i];
      if (i) ctx.lineTo(p[0], p[1] - off);
      else ctx.moveTo(p[0], p[1] - off);
    }
    ctx.strokeStyle = tone(a, col);
    ctx.lineWidth = w;
    ctx.stroke();
  };
  band(1.5, 0.7, YD.stripe[0]);
  band(2.9, 1.6, YD.stripe[1]);
  band(4.3, 0.7, YD.stripe[0]);
  band(5.6, 0.9, YD.stripe[2]);
  for (let i = 0; i < N; i++) {
    const p = [(hem[i][0] + hem[i + 1][0]) / 2, (hem[i][1] + hem[i + 1][1]) / 2 - 2.9];
    ctx.beginPath();
    ctx.moveTo(p[0] - 0.7, p[1]);
    ctx.lineTo(p[0], p[1] - 0.55);
    ctx.lineTo(p[0] + 0.7, p[1]);
    ctx.lineTo(p[0], p[1] + 0.55);
    ctx.closePath();
    ctx.fillStyle = tone(a, YD.stripe[3]);
    ctx.fill();
  }
  glow(ctx, top[2], 6, 0.6, YD.ponchoLt);
  glow(ctx, [hem[3][0], hem[3][1] + 1], 6, 0.45, YD.ponchoSh);
  ctx.restore();
}
// The bell on its cord, round the neck where it meets the chest; it swings with the body and clangs.
function bellAt(sk) {
  const c = [sk.nb[0] + (sk.hp[0] - sk.nb[0]) * 0.28, sk.nb[1] + (sk.hp[1] - sk.nb[1]) * 0.28];
  return { c, b: [c[0] + 2.0, c[1] + 1.6] };
}
function bell(ctx, a, mode, K) {
  const L = a.yd ?? {};
  const sk = K.skel(a);
  const t = a.t ?? 0;
  const { c, b } = bellAt(sk);
  const sw = Math.sin(t * 2.6) * 0.18 + (L.jingle ?? 0) * Math.sin(t * 16) * 0.55;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-0.9, 0);
    ctx.quadraticCurveTo(-1.1, 1.6, -1.8, 2.5);
    ctx.lineTo(1.8, 2.5);
    ctx.quadraticCurveTo(1.1, 1.6, 0.9, 0);
    ctx.quadraticCurveTo(0, -0.7, -0.9, 0);
    ctx.closePath();
  };
  ctx.save();
  ctx.translate(...b);
  ctx.rotate(sw);
  if (mode === 'line') {
    shape();
    ctx.strokeStyle = tone(a, INK);
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.restore();
  ctx.beginPath();
  ctx.ellipse(c[0], c[1], 3.4, 1.2, Math.atan2(sk.hp[1] - sk.nb[1], sk.hp[0] - sk.nb[0]) + Math.PI / 2, 0.15 * Math.PI, 1.1 * Math.PI);
  ctx.strokeStyle = tone(a, YD.cord);
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.save();
  ctx.translate(...b);
  ctx.rotate(sw);
  shape();
  ctx.fillStyle = tone(a, YD.bell);
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  glow(ctx, [-0.6, 0.6], 1.6, 0.95, YD.bellLt);
  glow(ctx, [1.2, 2.4], 1.8, 0.6, YD.bellSh);
  ctx.restore();
  ell(ctx, Math.sin(t * 16) * 0.3 * (L.jingle ?? 0), 2.7, 0.5, 0.45);
  ctx.fillStyle = tone(a, YD.bellSh);
  ctx.fill();
  ctx.restore();
}

// ---------- Little drawn things for its act and moves ----------
// A note: a round head, a stem and a little flag, in its own colour with a soft rim of its own; kept
// the right way round when it faces left (the rig's space is mirrored then).
function note(ctx, a, x, y, k, col, al, tilt = 0) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.rotate(tilt);
  ctx.scale(k, k);
  const rim = blend(col, '#6c4650', 0.45);
  for (const pass of [0, 1]) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.25 + (pass ? 0 : 0.45), 0.95 + (pass ? 0 : 0.45), -0.4, 0, TAU);
    ctx.fillStyle = pass ? col : rim;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1.0, -0.3);
    ctx.lineTo(1.0, -3.6);
    ctx.quadraticCurveTo(2.4, -2.9, 2.5, -1.6);
    ctx.strokeStyle = pass ? col : rim;
    ctx.lineWidth = pass ? 0.6 : 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ell(ctx, -0.35, -0.3, 0.4, 0.28, -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.restore();
}
// A tumbleweed: a loose round tangle of dry twigs, rolling.
function tumbleweed(ctx, x, y, r, spin, al) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(spin);
  ell(ctx, 0, 0, r + 0.5, r + 0.5);
  ctx.fillStyle = 'rgba(217,168,108,0.28)';
  ctx.fill();
  ctx.lineCap = 'round';
  for (const [w, col] of [[1.3, YD.weedInk], [0.55, YD.weed]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    for (let i = 0; i < 7; i++) {
      const q = (i / 7) * TAU;
      ctx.beginPath();
      ctx.ellipse(Math.cos(q) * r * 0.25, Math.sin(q) * r * 0.25, r * 0.85, r * 0.45, q * 1.7, 0, Math.PI * 1.3);
      ctx.stroke();
    }
  }
  ctx.restore();
}
// A soft puff of canyon dust.
function puff(ctx, x, y, r, al) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = YD.dust;
  for (const [dx, dy, k] of [[0, 0, 1], [r * 0.8, r * 0.2, 0.75], [-r * 0.7, r * 0.25, 0.7]]) {
    ell(ctx, x + dx, y + dy, r * k, r * k * 0.8);
    ctx.fill();
  }
  ctx.restore();
}
// A soft sound ring: an arc opening ahead, its own colour.
function ring(ctx, x, y, r, al, col) {
  if (al <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  for (const [w, c] of [[2.0, blend(col, '#6c4650', 0.35)], [1.0, col]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(x, y, r, -0.7, 0.7);
    ctx.stroke();
  }
  ctx.restore();
}
// A point in the head's own frame (its face's units), in the rig's space.
const headPt = (sk, p) => {
  const q = turn([p[0] * S, p[1] * S], sk.ha);
  return [sk.hp[0] + q[0], sk.hp[1] + q[1]];
};

// ---------- Its moves ----------
// The headbutt: rocks back pawing the ground, then charges head down; a clonk at the brow.
const HEADBUTT = {
  name: 'headbutt',
  anticT: 0.34,
  keys: [
    [0, { x: -0.08, crouch: 0.3, pitch: -4, hipLift: -3, neck: 6, head: 24, ears: -0.7, paw: 1, tailUp: -12 }],
    [0.09, { x: 0.22, crouch: 0.1, pitch: 10, neck: 34, head: 44, ears: -1, fly: 0.3, tailUp: -34 }, 'out'],
    [0.16, { x: 0.24, crouch: 0.08, pitch: 11, neck: 36, head: 48, ears: -1, fly: 0.12, tailUp: -34 }, 'out'],
    [0.3, { x: 0.15, pitch: -3, neck: 2, head: 2, ears: -0.2, tailUp: -12 }, 'out'],
    [0.66, {}],
  ],
  spark: [0.15],
  sparkAt: 'brow',
  dust: [[0.05, 'hinds']],
};
// The yodel blast: the chest puffed, chin tucked; then the head thrown up and forward and a burst
// of notes and sound rings out ahead.
const YODEL = {
  name: 'yodel',
  anticT: 0.42,
  keys: [
    [0, { lift: 1.0, arch: 5, crouch: 0, neck: -6, head: 10, ears: 0.3, x: -0.04 }],
    [0.08, { x: 0.06, crouch: 0.22, pitch: 2, neck: 4, head: -16, ears: -0.6, tailUp: -30 }, 'out'],
    [0.34, { x: 0.06, crouch: 0.18, pitch: 2, neck: 2, head: -12, ears: -0.5, tailUp: -26 }],
    [0.5, { x: 0.02, neck: 0, head: -4, ears: 0 }, 'io'],
    [0.76, {}],
  ],
  dust: [[0.08, 'all']],
};
// The buck: the weight thrown onto the forelegs, both hinds kicking out behind; the bell clangs.
const BUCK = {
  name: 'buck',
  anticT: 0.26,
  keys: [
    [0, { x: 0.03, crouch: 0.34, pitch: 4, neck: 12, head: 12, ears: -0.6 }],
    [0.11, { kick: 1, crouch: 0.12, neck: 18, head: 16, ears: -1, tailUp: -70 }, 'out'],
    [0.22, { kick: 0.82, crouch: 0.1, neck: 16, head: 14, ears: -1, tailUp: -60 }],
    [0.38, { kick: 0, crouch: 0.34, pitch: 2, neck: 6, head: 6, ears: -0.3, tailUp: -12 }, 'in'],
    [0.74, {}],
  ],
  spark: [0.11],
  sparkAt: 'hinds',
  dust: [[0.38, 'hinds']],
};

// ---------- Its act ----------
const CYCLE = 31;
const LOOK = {
  kind: 'goatkid',
  ink: INK,
  quietIdle: true,
  P: { scale: S, moves: ['headbutt', 'yodel', 'buck'] },
  C: { lt: YD.furLt, base: YD.fur, sh: YD.furSh, deep: YD.furDeep, guide: YD.furSh, nose: YD.nose, hoofN: '#a88a86', hoofF: '#8f7270' },
  moves: { headbutt: HEADBUTT, yodel: YODEL, buck: BUCK },
  face,
  over: {
    foreN: poncho,
    neck: bell,
    head: beard,
  },
  pose: (m, a, out, K, mv, mt) => {
    const st = a.mo.rig;
    const t = a.t ?? 0;
    const L = { face: 'open', mouth: 0, jingle: 0, wind: 0, notes: -1, echo: -1, weed: -1, dust: -1, choo: -1, whoosh: [], stars: 0, z: 0, gleam: -1, mv: mv?.name ?? null, mt };
    a.yd = L;
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const mood = m.cine?.mood ?? a.mood;
    // (its act, only while it stands about: eased in and out on a spring, so starting to walk or
    // fight never snaps a pose; never while it walks, fights (or has just fought), naps or is posed
    // in a scene)
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    const goal = clamp((1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine || mv || napping || fighting || m.hp <= 0 ? 0 : 1), 0, 1);
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    st.ydCalm = Number.isFinite(st.ydCalm) ? st.ydCalm + (goal - st.ydCalm) * Math.min(1, dt * 8) : goal;
    const calm = mv ? 0 : st.ydCalm;
    // faces and poses outside the act
    if (m.hp <= 0) L.face = 'dead';
    else if ((a.hurtAgo ?? 9) < 0.45 || mv === K.moves.hurt || mv === K.moves.knockdown) L.face = 'hurt';
    else if (napping || mood === 'sleep') {
      // lying down, legs folded, the poncho tucked round it, a little "z"
      L.face = 'sleep';
      L.z = 1;
      if (!napping) Object.assign(out, { lie: 1, sleep: 1, ears: -0.7, swish: 0, paw: 0 });
    } else if (mv && (L.mv === 'headbutt' || L.mv === 'yodel' || L.mv === 'buck')) {
      // its own moves: cocky and focused winding up; then each its own
      L.face = 'cocky';
      if (L.mv === 'headbutt') {
        if (mt >= 0.06 && mt < 0.3) L.face = 'sneeze';
        L.jingle = mt > 0 ? Math.max(0, 1 - mt / 0.6) : 0.3;
      } else if (L.mv === 'yodel') {
        if (mt < 0) {
          L.face = 'squint';
          L.mouth = 0;
        } else {
          L.face = mt < 0.5 ? 'sing' : 'happy';
          L.mouth = mt < 0.5 ? 1 - 0.25 * Math.abs(Math.sin(mt * 22)) : Math.max(0, 1 - (mt - 0.5) / 0.15);
          L.notes = span(mt, 0.06, 0.62);
        }
        L.jingle = mt > 0 ? 0.6 : 0;
      } else if (L.mv === 'buck') {
        if (mt >= 0.08 && mt < 0.3) L.face = 'sneeze';
        L.jingle = mt > 0.08 ? Math.max(0, 1.6 - mt * 1.8) : 0;
        L.gleam = span(mt, 0.11, 0.4);
        if (mt > 0.4) L.face = 'cocky';
      }
    } else if (mv === K.moves.pronk) {
      L.face = 'happy';
      L.jingle = 0.8;
    } else if (mv) L.face = 'cocky';
    else if (a.face === 'angry' || mood === 'angry') L.face = 'cocky';
    else if (mood === 'happy') L.face = 'happy';
    else if (mood === 'sad') L.face = 'pout';
    else if (a.face === 'blink' || (t + (m.uid ?? 0) * 0.37) % 4.4 < 0.13) L.face = 'blink';
    if (mood === 'talk' && m.hp > 0) L.mouth = Math.max(0, Math.sin(t * 11)) * 0.35;
    if (calm < 0.02) return;
    const lu = (((t + ((m.uid ?? 0) % 7) * 4.4) % CYCLE) + CYCLE) % CYCLE;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) L.face = f;
    };
    // 1. the yodel: hooves planted, a breath in (it rises, chest out); chin up and three swells
    //    of "yo-de-lay", notes tumbling out ahead; then quiet: listening back over its shoulder, ears
    //    perking one by one as the echo drifts back; delighted, a spring-jump
    const inhale = win(lu, 0.4, 0.9, 1.0, 1.2) * calm;
    go({ lift: 0.7, arch: 4, neck: -8, head: 4 }, inhale);
    say('open', inhale);
    const sing = win(lu, 1.0, 1.25, 3.2, 3.5) * calm;
    go({ neck: -26, head: -20, ears: 0.4, lift: 0.3 }, sing);
    L.mouth = Math.max(L.mouth, sing * (0.45 + 0.55 * Math.abs(Math.sin((lu - 1.0) * Math.PI * 1.35))));
    L.jingle = Math.max(L.jingle, sing * 0.5);
    say('sing', sing);
    L.notes = lu > 1.0 && lu < 4.2 && calm > 0.3 ? (lu - 1.0) / 3.2 : -1;
    const listen = win(lu, 3.5, 3.8, 5.3, 5.6) * calm;
    go({ neck: -6, head: 8, ears: 0.6 }, listen);
    out.ears += listen * 0.6 * (pulse(lu, 3.95, 0.4) + pulse(lu, 4.45, 0.4) + pulse(lu, 4.95, 0.4));
    out.head += listen * 4 * (pulse(lu, 3.95, 0.5) - pulse(lu, 4.45, 0.5));
    say('listen', listen);
    L.echo = lu > 3.6 && lu < 5.4 && calm > 0.3 ? (lu - 3.6) / 1.8 : -1;
    const pt = lu - 5.75;
    if (pt > -K.moves.pronk.anticT && pt < 1 && calm > 0.3) {
      go(K.keyPose(K.moves.pronk, pt, 1 + pt / K.moves.pronk.anticT, out), calm);
      L.jingle = 0.9;
      L.face = 'happy';
    }
    say('happy', win(lu, 6.7, 6.8, 7.2, 7.4) * calm);
    // 2. a tumbleweed rolls in on the wind behind it: a startled hop as it bumps past its legs; it
    //    sniffs at it, nibbles a twig, chewing happily... and the wind takes it rolling away; a pout
    L.weed = lu > 7.8 && lu < 13.4 ? lu - 7.8 : -1;
    const jump = win(lu, 8.55, 8.65, 8.85, 9.05) * calm;
    out.lift += jump * 1.4;
    go({ ears: 1, neck: -8, head: -4 }, jump);
    say('startled', win(lu, 8.5, 8.6, 9.1, 9.3) * calm);
    const sniff = win(lu, 9.4, 9.9, 11.9, 12.2) * calm;
    go({ neck: 30, head: 22, ears: 0.3, pitch: 2 }, sniff);
    out.head += sniff * Math.sin(lu * 14) * 1.5 * win(lu, 9.9, 10.0, 10.5, 10.6);
    say('curious', sniff);
    say('chew', win(lu, 10.6, 10.7, 11.8, 11.9) * calm);
    const after = win(lu, 12.1, 12.4, 13.3, 13.7) * calm;
    go({ neck: -4, head: 6, ears: -0.4 }, after);
    L.wind = Math.max(L.wind, win(lu, 11.9, 12.1, 12.8, 13.2) * calm);
    say('pout', after);
    // 3. canyon dust drifts past its nose: "ah... ah..." (squinting, chin rising in two steps), a
    //    big sneeze that snaps its head down and clangs the bell; then a whole-body shake
    L.dust = lu > 14.0 && lu < 16.2 ? (lu - 14.0) / 2.2 : -1;
    const ah1 = win(lu, 15.0, 15.3, 15.5, 16.2) * calm;
    const ah2 = win(lu, 15.6, 15.9, 16.05, 16.2) * calm;
    go({ neck: -10, head: -12, ears: 0.3 }, ah1);
    go({ neck: -18, head: -22, ears: 0.5 }, ah2);
    say('squint', Math.max(ah1, ah2));
    const choo = win(lu, 16.2, 16.28, 16.45, 16.9) * calm;
    go({ neck: 26, head: 24, ears: -1, crouch: 0.3, x: -0.03 }, choo);
    say('sneeze', choo);
    L.choo = span(lu, 16.22, 0.7);
    const shake = win(lu, 17.1, 17.25, 17.95, 18.2) * calm;
    out.head += shake * Math.sin(lu * 34) * 12;
    out.neck += shake * Math.sin(lu * 34 + 0.6) * 5;
    out.pitch += shake * Math.sin(lu * 34 + 1.2) * 2.5;
    out.ears += shake * Math.sin(lu * 34) * 0.9;
    L.jingle = Math.max(L.jingle, choo * 1.2, shake * 1.4);
    say('sneeze', shake);
    say('happy', win(lu, 18.2, 18.35, 18.9, 19.1) * calm);
    // 4. headbutt practice: a cocky look, a paw at the ground; two butts at nothing and a big third
    //    that overshoots: a stumble, swirly eyes and stars round its head; it shakes it off, grinning
    const ready = win(lu, 19.6, 20.0, 22.3, 22.5) * calm;
    go({ neck: 8, head: 16, ears: -0.4, crouch: 0.15 }, ready);
    out.paw = Math.max(out.paw ?? 0, win(lu, 19.8, 20.0, 20.5, 20.7) * calm);
    say('cocky', ready);
    const butts = [[20.9, 0.7], [21.6, 0.7], [22.35, 1.15]];
    for (const [b0, k] of butts) {
      const back = pulse(lu, b0 - 0.25, 0.3) * calm;
      const hit = pulse(lu, b0, 0.32) * calm;
      go({ x: -0.05 * k, crouch: 0.3, neck: 2, head: 18 }, back);
      go({ x: 0.14 * k, pitch: 8 * k, neck: 30, head: 42, ears: -1, fly: 0.2 * k }, hit);
      if (hit > 0.5) L.face = 'sneeze';
      const w0 = span(lu, b0 + 0.08, 0.35);
      if (w0 >= 0) L.whoosh.push([w0, k]);
    }
    const stumble = win(lu, 22.6, 22.75, 22.95, 23.3) * calm;
    go({ x: 0.06, pitch: 10, crouch: 0.35, neck: 24, head: 20 }, stumble);
    const dizzy = win(lu, 22.7, 22.95, 24.4, 24.7) * calm;
    out.head += dizzy * Math.sin(lu * 5.5) * 9;
    out.neck += dizzy * Math.cos(lu * 5.5) * 6;
    out.x = (out.x ?? 0) + dizzy * Math.sin(lu * 2.75) * 0.025;
    L.stars = dizzy;
    say('dizzy', dizzy);
    const shook = win(lu, 24.6, 24.7, 25.1, 25.3) * calm;
    out.head += shook * Math.sin(lu * 36) * 10;
    L.jingle = Math.max(L.jingle, shook);
    say('cocky', win(lu, 25.2, 25.35, 25.9, 26.1) * calm);
    // 5. king of the cliff: up on its hind legs, chin high, poncho in the wind, a gleam off the
    //    bell; then a huge yawn and a sleepy blink
    const proud = win(lu, 26.3, 26.8, 27.9, 28.3) * calm;
    go({ rear: 0.62, neck: -14, head: -12, ears: -0.3, tailUp: -30, crouch: 0.15 }, proud);
    L.wind = Math.max(L.wind, proud);
    L.jingle = Math.max(L.jingle, proud * 0.4);
    say('proud', proud);
    L.gleam = Math.max(L.gleam, span(lu, 27.0, 0.6));
    const yawn = win(lu, 28.5, 29.0, 29.5, 29.9) * calm;
    go({ neck: -10, head: -20, lift: 0.5, arch: 3, ears: -0.5 }, yawn);
    say('yawn', yawn);
    say('sleepy', win(lu, 29.8, 29.9, 30.4, 30.8) * calm);
  },
  // Effects, in the rig's own space: the yodel's notes and the echo, the tumbleweed, the dust and
  // the sneeze, the practice whooshes, the dizzy stars, the bell's gleam and clang, the nap's "z".
  fx: (ctx, m, a, S2, K) => {
    const L = a.yd;
    if (!L) return;
    const sk = K.skel(a);
    if (!sk) return;
    const t = a.t ?? 0;
    const hp = sk.hp;
    const mo = headPt(sk, [8.6, 5.7]);
    const nose = headPt(sk, [10.4, 3.4]);
    const crown = headPt(sk, [1.5, -7]);
    const front = Math.max(sk.legs.foreN.P[0], sk.legs.foreF.P[0]);
    const rear = Math.min(sk.legs.hindN.P[0], sk.legs.hindF.P[0]);
    ctx.save();
    // the yodel's notes, each born at its mouth, tumbling up and ahead
    if (L.notes >= 0 && L.mv !== 'yodel') {
      const T = L.notes * 3.2;
      [0.1, 0.55, 1.0, 1.45].forEach((t0, i) => {
        const q = (T - t0) / 1.6;
        if (q <= 0 || q >= 1) return;
        const x = mo[0] + 2 + q * 11 + Math.sin(q * 6 + i) * 1.2;
        const y = mo[1] - 3 - q * 9 - i * 1.0;
        note(ctx, a, x, y, 0.9 - q * 0.15, YD.notes[i % 4], Math.sin(Math.PI * Math.min(1, q * 1.3)) ** 0.6, Math.sin(q * 5 + i) * 0.3);
      });
    }
    // the echo: smaller notes drifting back in from behind it, each fading with a twinkle as it
    // reaches an ear
    if (L.echo >= 0) {
      const T = L.echo * 1.8;
      [0.1, 0.6, 1.1].forEach((t0, i) => {
        const q = (T - t0) / 0.7;
        if (q <= 0 || q >= 1) return;
        const ear = headPt(sk, [-3.5, -3.5]);
        const x = mix(rear - 8, ear[0] - 1, q);
        const y = mix(ear[1] - 6 - i * 1.5, ear[1] - 2, q) + Math.sin(q * 7) * 0.8;
        note(ctx, a, x, y, 0.72 - i * 0.12, YD.notes[(i + 1) % 4], Math.sin(Math.PI * q) * (0.95 - i * 0.15), -0.2);
        if (q > 0.8) {
          ctx.globalAlpha = (1 - q) * 5;
          ctx.fillStyle = '#fff4c0';
          sparkle(ctx, x + 1.5, y - 1, 1.1);
          ctx.globalAlpha = 1;
        }
      });
    }
    // the tumbleweed: rolling in from behind on the wind, bumping past its legs, sitting in front
    // of its nose (a twig nibbled off), then blown away rolling ahead
    if (L.weed >= 0) {
      const u = L.weed;
      const r = 3.0;
      let x;
      let al = 1;
      if (u < 1.2) {
        x = mix(rear - 14, front + 6, sstep(u / 1.2));
        al = Math.min(1, u * 3);
      } else if (u < 4.1) x = front + 6;
      else {
        const v = (u - 4.1) / 1.4;
        x = front + 6 + sstep(v) * 12;
        al = 1 - sstep((v - 0.55) / 0.45);
      }
      const hopY = u < 1.2 ? Math.abs(Math.sin(u * 7)) * 2.2 * (1 - u / 1.2) : u > 4.1 ? Math.abs(Math.sin(u * 8)) * 1.6 : 0;
      tumbleweed(ctx, x, -r - hopY, r, x / r, al);
      // (the wind that brings it and takes it: two soft streaks)
      const gust = Math.max(win(u, 0, 0.2, 0.9, 1.3), win(u, 4.0, 4.2, 4.8, 5.2));
      if (gust > 0.02) {
        ctx.globalAlpha = gust * 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.6;
        ctx.lineCap = 'round';
        for (const k of [0, 1]) {
          const y = -6 - k * 5;
          const f = frac(t * 1.5 + k * 0.5);
          const x0 = x - 9 - k * 3 + f * 4;
          // (each streak fading out at the end of its drift and back in at its start, never
          // jumping back 4 px in plain sight, 2026-11-26)
          ctx.globalAlpha = gust * 0.6 * Math.sin(Math.PI * f);
          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.quadraticCurveTo(x0 + 3, y - 1, x0 + 6, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    // the dust: soft puffs drifting past its nose
    if (L.dust >= 0) {
      const u = L.dust;
      for (let i = 0; i < 3; i++) {
        const v = clamp(u * 1.4 - i * 0.18, 0, 1);
        if (v <= 0 || v >= 1) continue;
        puff(ctx, mix(nose[0] + 9, nose[0] - 3, v), nose[1] - 1 + Math.sin(v * 6 + i) * 1.2 - i, 0.9 + i * 0.2, Math.sin(Math.PI * v) * 0.8);
      }
    }
    // the sneeze: a burst of dust out of its nose, and sparkles
    if (L.choo >= 0) {
      const u = L.choo;
      const e = 1 - (1 - u) ** 2;
      for (let i = 0; i < 3; i++) puff(ctx, nose[0] + 2 + e * (3 + i * 2), nose[1] + 1 + e * (i - 1) * 2, 0.8 + e * 1.2, (1 - u) * 0.85);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = Math.sin(Math.PI * u);
      sparkle(ctx, nose[0] + 4 + e * 6, nose[1] - 2 - e * 2, 1);
      sparkle(ctx, nose[0] + 2 + e * 4, nose[1] + 3 + e * 1.5, 0.7);
      ctx.globalAlpha = 1;
    }
    // the practice butts: a soft whoosh off its brow
    for (const [u, k] of L.whoosh) {
      const b = sk.brow;
      ctx.globalAlpha = (1 - u) * 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 2; i++) {
        const r = 3 + u * 4 * k + i * 1.6;
        ctx.beginPath();
        ctx.arc(b[0] + 1, b[1] + 2, r, -0.9, 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // dizzy: little stars circling over its head
    if (L.stars > 0.02) {
      for (let i = 0; i < 3; i++) {
        const q = t * 4 + (i / 3) * TAU;
        const p = [crown[0] + Math.cos(q) * 4.5, crown[1] + Math.sin(q) * 1.4];
        ctx.globalAlpha = L.stars * (Math.sin(q) < 0 ? 0.55 : 1);
        ctx.fillStyle = i % 2 ? YD.star : '#ffffff';
        sparkle(ctx, p[0], p[1], 1.2);
      }
      ctx.globalAlpha = 1;
    }
    // the bell: a gleam (proud) or a clang (the buck)
    if (L.gleam >= 0) {
      const { b } = bellAt(sk);
      const u = L.gleam;
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, b[0] + 1.5, b[1] + 0.5, 1.4 * (0.6 + 0.4 * Math.sin(Math.PI * u)));
      if (L.mv === 'buck') {
        ctx.strokeStyle = YD.bellLt;
        ctx.lineWidth = 0.7;
        ctx.lineCap = 'round';
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(b[0], b[1] + 1.5, 3 + u * 3, s > 0 ? -0.7 : Math.PI - 0.7, s > 0 ? 0.7 : Math.PI + 0.7);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    // the yodel blast: a burst of notes and three soft sound rings out ahead
    if (L.mv === 'yodel' && L.notes >= 0) {
      const u = L.notes;
      for (let i = 0; i < 3; i++) {
        const v = clamp(u * 1.6 - i * 0.24, 0, 1);
        if (v <= 0 || v >= 1) continue;
        ring(ctx, mo[0] + 1 + v * 13, mo[1] - 1, 2.5 + v * 6, (1 - v) ** 0.7, YD.notes[i]);
      }
      // (the notes fan out: up, ahead, down, each its own size, wobbling as they go)
      [[-0.75, 1.0, 0], [-0.3, 0.8, 0.1], [0.05, 0.95, 0.04], [0.42, 0.75, 0.16], [-0.5, 0.65, 0.22]].forEach(([sp, k, d], i) => {
        const v = clamp((u - d) * 1.5, 0, 1);
        if (v <= 0 || v >= 1) return;
        const r = v * 19;
        note(ctx, a, mo[0] + 2 + r * Math.cos(sp), mo[1] - 1 + r * Math.sin(sp) + Math.sin(v * 12 + i) * 0.8, k, YD.notes[i % 4], 1 - sstep((v - 0.65) / 0.35), Math.sin(v * 9 + i) * 0.4);
      });
    }
    // napping: a little sunset-orange "z" drifting up from its head
    if (L.z > 0) {
      for (let i = 0; i < 2; i++) {
        const u = frac(t * 0.32 + i * 0.5);
        const k = 0.75 + u * 0.45;
        const x = crown[0] + 1 + u * 4 + Math.sin(u * 5) * 0.6;
        const y = crown[1] - 1 - u * 7;
        ctx.globalAlpha = Math.sin(Math.PI * u);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const [w, col] of [[k * 0.8, '#ffffff'], [k * 0.4, YD.zed]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(x - k, y - k);
          ctx.lineTo(x + k, y - k);
          ctx.lineTo(x - k, y + k);
          ctx.lineTo(x + k, y + k);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  },
};

export const PEBBLET = dressedHoof(LOOK);
PEBBLET.art.noHop = true;
