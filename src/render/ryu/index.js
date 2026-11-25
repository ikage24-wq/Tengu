// Ramen Ryu on screen (2026-11-25, the Cup-Noodle Dragon remade on the serpent base, the player's pick
// "A", "heavily heavily polish it"): the Queen's 2 a.m. dinner, a cheeky little noodle dragon still
// half in his cup. He moves on his own copy of the serpent rig (ryurig.js: its bones, slither, sway,
// moves and springs; his pieces from art.js; his noodle tail, whiskers and chopsticks drawn live),
// drawn big for a boss; this adds what floats, splashes and steams:
//   - steam always curling up off his cup's broth and his bun;
//   - his act's own bits: the noodle he slurps (zipping up into his mouth), the stir's steam, the steam
//     bath billowing round him, a hungry sparkle and a drip at his lip, the drum taps, the steam pop;
//   - his attacks: the noodle lash cracking out from his hand; the chopsticks' snap;
//   - his casts: the steam burst all round him, the lash swung round over his head and cracked, the
//     broth sprayed out over everyone, the chopsticks snapping, and "Three Minutes!": the cup boiling,
//     bubbles and broth slopping over its rim.
import { ryuRig } from './ryurig.js';
import { ryuDesign, SKIN_COLORS, NOOD, MOUTH, NAPE, BUN, LOCK_F, LOCK_N, LOCKS_ROOT, SCARF_KNOT, CUP_TOP, CHEEK_F, CHEEK_N } from './art.js';
import { clamp } from '../mobs/rig.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u) => 1 - (1 - u) ** 2;
// A soft puff of steam: a pale round cloud with a light on it, fading.
function steam(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#f2f4fa';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.arc(x + r * 0.7, y + r * 0.2, r * 0.7, 0, TAU);
  ctx.arc(x - r * 0.6, y + r * 0.3, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.42, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function twinkle(ctx, x, y, r, al, c = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A drop of broth: amber, a light on it.
function brothDrop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#c87a3a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f0b878';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A wavy noodle through points (game px), outlined, golden, a light down it.
function noodleLine(ctx, pts, w, al = 1) {
  if (pts.length < 2 || al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, ww, dy] of [['#3a2430', w + 1.4, 0], [NOOD[1], w, 0], [NOOD[0], w * 0.34, -w * 0.25]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = ww;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + dy) : ctx.moveTo(x, y + dy)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// A noodle lash from a hand: a long wavy noodle reaching `len` out along angle `an`, bending back
// with `bend`, rippling.
function lash(ctx, from, an, len, bend, t, w = 1.6) {
  const pts = [];
  let a0 = an;
  let [x, y] = from;
  for (let i = 0; i <= 16; i++) {
    const wv = Math.sin(i * 0.9 - t * 18) * 1.1 * (i / 16);
    pts.push([x - Math.sin(a0) * wv, y + Math.cos(a0) * wv]);
    a0 += bend / 16;
    x += (Math.cos(a0) * len) / 16;
    y += (Math.sin(a0) * len) / 16;
  }
  noodleLine(ctx, pts, w);
  return pts[pts.length - 1];
}

// Behind him: steam always curling up off his cup's broth (thicker in the steam bath and the stir),
// rising past his shoulders; when it boils, a low soft bank of it round the cup.
function under(ctx, m, a, S, matOf, K) {
  if (m?.hp <= 0 || !K) return;
  const c = K.through(matOf('torso'), 'cupJ', 'hip');
  const extra = (a.ryuSteam ?? 0) * 3 + (a.ryuStir ?? 0) * 1.5;
  const n = 4 + Math.round(extra);
  for (let i = 0; i < n; i++) {
    const P = 2.4 + hash(i) * 0.8;
    const u = ((a.t + i * 0.77) / P) % 1;
    const k = Math.floor((a.t + i * 0.77) / P);
    const side = i % 2 ? 1 : -1;
    const x = c[0] + side * (12 + hash(k * 3 + i) * 10) + Math.sin(u * 5 + i) * 3 + side * u * 6;
    steam(ctx, x, c[1] - 4 - u * (34 + extra * 8), 2.4 + u * 4, Math.sin(Math.PI * u) * (0.6 + extra * 0.08));
  }
  const kind = a.mo?.rig?.ryuKind;
  if (kind !== 'timer' && kind !== 'steam') return;
  for (let i = 0; i < 6; i++) {
    const u = (a.t * 0.8 + i / 6) % 1;
    steam(ctx, c[0] + (i - 2.5) * 7, c[1] - u * 26, 4 + u * 5, (1 - u) * 0.5);
  }
}

function ryuFx(ctx, m, a, S, matOf, K, H) {
  if (m?.hp <= 0) return;
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const rim = K.through(matOf('torso'), 'cupJ', 'hip');
  const bun = K.through(matOf('headJ'), 'bunJ', 'neck');
  const mo = K.through(matOf('headJ'), 'mouthR', 'neck');
  const hN = K.through(matOf('handN'), 'handN', 'wrN');
  const hF = K.through(matOf('handF'), 'handF', 'wrF');
  const kind = a.mo?.rig?.ryuKind;
  const ct = m.cast ? a.now - m.cast.t0 : 0;
  ctx.save();
  // (the cup's own steam rises behind him: under)
  {
    const u = (a.t * 0.45) % 1;
    steam(ctx, bun[0] + 2 + Math.sin(u * 6) * 2, bun[1] - 6 - u * 14, 1.4 + u * 2.4, Math.sin(Math.PI * u) * 0.5);
  }
  // the slurp: a noodle held up, then zipping up into his mouth
  const sl = a.ryuSlurp ?? -1;
  if (sl >= 0) {
    const top = [hN[0], hN[1] - 2];
    const len = sl < 0.42 ? 1 : 1 - (sl - 0.42) / 0.58;
    const pts = [];
    const from = sl < 0.42 ? top : [top[0] + (mo[0] - top[0]) * 0.2, top[1] + (mo[1] - top[1]) * 0.2];
    for (let i = 0; i <= 10; i++) {
      const u = (i / 10) * len;
      pts.push([from[0] + (mo[0] - from[0]) * (sl < 0.42 ? 0 : 1) * u + Math.sin(u * 12 + a.t * 20) * 1.4, from[1] + 22 * u * (sl < 0.42 ? 1 : 0.2) + (mo[1] - from[1]) * (sl < 0.42 ? 0 : u)]);
    }
    if (len > 0.05) noodleLine(ctx, pts, 1.3);
    if (sl > 0.42 && sl < 0.9) for (let i = 0; i < 3; i++) twinkle(ctx, mo[0] + 4 + i * 3, mo[1] - 6 - i * 2, 1.6 * (1 - (sl - 0.42) * 2), 1, '#fff6c8');
  }
  // hungry: a star in his eye glinting, a little drip at his lip
  const hu = a.ryuDrool ?? 0;
  if (hu > 0.3) {
    const u = (a.t * 0.9) % 1;
    ctx.globalAlpha = hu * (1 - u);
    ctx.fillStyle = '#d8f0ff';
    ctx.beginPath();
    ctx.arc(mo[0] + 3, mo[1] + 2 + u * 5, 0.9, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    twinkle(ctx, mo[0] + 10, mo[1] - 12, 2.4 * Math.abs(Math.sin(a.t * 4)), hu, '#fff6a8');
  }
  // the drum solo: a little flash and a note at each tap on the rim
  if ((a.ryuDrum ?? 0) > 0) {
    const bt = a.ryuDrum;
    for (const [hand, off] of [[hN, 0], [hF, Math.PI]]) {
      const v = Math.sin(bt + off);
      if (v > 0.85) twinkle(ctx, hand[0] + 6, hand[1] + 4, 2.6 * (v - 0.85) / 0.15, 1, '#fff6c8');
    }
    const u = (bt / (Math.PI * 2)) % 1;
    ctx.globalAlpha = Math.sin(Math.PI * u);
    ctx.fillStyle = '#e8304a';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText(Math.floor(bt / (Math.PI * 2)) % 2 ? '♪' : '♫', rim[0] + 12 + u * 6, rim[1] - 10 - u * 10);
    ctx.globalAlpha = 1;
  }
  // the steam pop that wakes him: one big puff bursting off the broth
  const pp = a.ryuPop ?? -1;
  if (pp >= 0) {
    steam(ctx, rim[0], rim[1] - 6 - pp * 10, 4 + ease(pp) * 9, (1 - pp) * 0.9);
    for (let i = 0; i < 5; i++) {
      const an = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.8;
      brothDrop(ctx, rim[0] + Math.cos(an) * (6 + pp * 14), rim[1] - 2 + Math.sin(an) * (6 + pp * 12) + pp * pp * 14, 1, 1 - pp);
    }
  }
  // the noodle lash (his attack): cracking out from his hand
  if (mv?.lash) {
    const u = (t - mv.lash[0]) / (mv.lash[1] - mv.lash[0]);
    if (u >= 0 && u < 1) {
      const out = Math.sin(Math.PI * Math.min(1, u * 1.4));
      const tip = lash(ctx, hN, -0.15 + (1 - out) * 0.9, 12 + out * H * 0.75, 0.6 - out * 0.7, a.t);
      if (u > 0.14 && u < 0.4) twinkle(ctx, tip[0], tip[1], 3.6 * (1 - Math.abs(u - 0.26) * 6), 1, '#fff6c8');
    }
  }
  // the chopsticks' snap (his jab): a white click at their tips
  if (mv?.jab) {
    const u = (t - mv.jab[0]) / 0.3;
    if (u >= 0 && u < 1) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 1 - u;
      for (let i = 0; i < 3; i++) {
        const an = -0.6 + i * 0.6;
        ctx.beginPath();
        ctx.moveTo(hN[0] + 20 + Math.cos(an) * (3 + u * 5), hN[1] - 6 + Math.sin(an) * (3 + u * 5));
        ctx.lineTo(hN[0] + 20 + Math.cos(an) * (6 + u * 7), hN[1] - 6 + Math.sin(an) * (6 + u * 7));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  // --- his casts ---
  if (kind === 'steam') {
    const k = Math.min(1, ct / 0.6);
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + a.t * 0.6;
      const u = (a.t * 1.2 + i / 10) % 1;
      steam(ctx, rim[0] + Math.cos(an) * (10 + u * H * 0.45), rim[1] - 10 + Math.sin(an) * (6 + u * H * 0.25) - u * 10, 3 + u * 6, k * (1 - u) * 0.8);
    }
  }
  if (kind === 'whip') {
    const cr = ct % 0.9;
    const tip = lash(ctx, hN, -Math.PI / 2 + Math.sin(ct * 9) * 1.4, H * 0.6, 0.9, a.t, 1.8);
    if (cr > 0.4 && cr < 0.55) twinkle(ctx, tip[0], tip[1], 4, 1, '#fff6c8');
  }
  if (kind === 'spit') {
    if (ct < 0.9) {
      // cheeks filling: little bubbles at his lips
      for (let i = 0; i < 2; i++) twinkle(ctx, mo[0] + 4 + i * 3, mo[1] - 2, 1.2, Math.abs(Math.sin(a.t * 8 + i)), '#f0c488');
    } else {
      const u = ((ct - 0.9) * 1.6) % 1;
      for (let i = 0; i < 12; i++) {
        const an = -0.7 + (i / 11) * 0.9;
        const d = 6 + ease((u + i * 0.07) % 1) * H * 0.9;
        brothDrop(ctx, mo[0] + Math.cos(an) * d, mo[1] + Math.sin(an) * d + d * d * 0.004, 1.2 + hash(i) * 0.8, 1 - ((u + i * 0.07) % 1) * 0.6);
      }
      steam(ctx, mo[0] + 10, mo[1] - 4, 3, 0.6);
    }
  }
  if (kind === 'snap') {
    const v = Math.abs(Math.sin(a.t * 14));
    if (v > 0.9) twinkle(ctx, hN[0] + 18, hN[1] - 10, 3, 1, '#ffffff');
  }
  if (kind === 'timer') {
    // the cup boiling: bubbles popping at the rim, broth slopping over and running down
    for (let i = 0; i < 8; i++) {
      const u = (a.t * 2 + i / 8) % 1;
      const x = rim[0] + (i - 3.5) * 6 + Math.sin(i * 3) * 2;
      ctx.globalAlpha = 1 - u;
      ctx.strokeStyle = '#f0c488';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(x, rim[1] - 2 - u * 6, 1.2 + u * 2, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const u = (a.t * 1.4 + i / 6) % 1;
      const an = i % 2 ? -0.4 : Math.PI + 0.4;
      brothDrop(ctx, rim[0] + Math.cos(an) * (16 + u * 10), rim[1] - 4 - Math.sin(Math.PI * u) * 10 + u * 20, 1.3, 1 - u);
    }
  }
  ctx.restore();
}

// (drawn big, for a boss)
const BIG = 1.85;
const J = { mouthR: MOUTH, napeJ: NAPE, locksJ: LOCKS_ROOT, bunJ: BUN, lockFJ: LOCK_F, lockNJ: LOCK_N, knotJ: SCARF_KNOT, cupJ: CUP_TOP, cheekF: CHEEK_F, cheekN: CHEEK_N };
const R = ryuRig({ design: ryuDesign, skin: SKIN_COLORS, noodle: NOOD, J, Jbase: { serp0: [128, 201], serp1: [88, 204], serp2: [50, 208] }, fx: ryuFx, under });
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG);
rig.h = Math.round(rig.h * BIG);
export const RYU_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true };
export const RYU_SIZE = { w: Math.round(40 * BIG), h: Math.round(R.H * 0.92 * BIG) };
