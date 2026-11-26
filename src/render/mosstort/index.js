// The Moss Tortoise (2026-11-26, remade from scratch, the player's pick "A" of three: Tumble, the Moss
// Piglet): Mossy Woods' level 14 monster of the Forest Floor and the Branchways. A tardigrade (real
// tardigrades are called "moss piglets": they live in moss and are about the toughest animals alive),
// drawn as a cuddly peach-pink bean standing up: eight plush nubs with pink pads (its arms, two pairs
// of little side nubs, its feet), a round piglet snout with an "o" mouth, big bean eyes, and a soft
// cushion of moss on its back with three sprung tufts, a clover sprig and a flower bud. Serene and
// completely unbothered: nothing can hurt it, so it hardly notices anything. Its trick is the "tun":
// dried out (or hit hard), it pulls all its nubs in and curls up into a tight wrinkly tan barrel, and
// a drop of water plumps it back out. It moves on its own copy of the veggie base (veggiebase.js).
//   idle    a 30 s act, only while it stands about calm:
//           - the dewdrop: a drop sparkles above it; it tips its snout up, catches it with a slurp
//             and wiggles all eight nubs;
//           - the sunbeam: a warm beam finds it; a yawn; it dries and curls up into its tun; a drop
//             lands on it and it plumps back out with a happy hop;
//           - the acorn: one drops on its head and bounces off with a sparkle; it doesn't notice;
//             a moment later it slowly looks up, "?", and shrugs;
//           - the wave: a ripple runs down its nubs, twice; then a proud flex;
//           - the moss: it reaches back and pats its moss smooth, the tufts bouncing and the bud
//             opening a moment; a content blink.
//   moves   (def.moves, in turn) Tun Drop: crouched, nubs up, a hop; curled into its tun in the air,
//           down on the target (clonk), a moment curled, then it pops back plump. Eight-Nub Flurry:
//           a pitter-patter of slaps from every nub. Snout Bump: a hop into the target snout first
//           (boop).
//   habits  play: two of them chase each other, the chaser curling into a tun-bump as it catches up;
//           home: at its favourite spot it plays the dewdrop beat.
//   hit     a squeezed wince and a wobble; nap: sat back in a curl, nubs tucked, the flower open on its
//           moss; beaten: curled tight in its tun, swirly eyes.
// Everything drawn here from scratch, the face too; no animals ride along.
import { dressedVeggie } from './veggiebase.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a quick soft pulse 0..1..0 over [t0, t0 + d])
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
// (0..1 through [t0, t0 + d], else -1)
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
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

const INK = '#b0606e';
const PG = {
  lt: '#fff3ec', base: '#ffd5c6', sh: '#f3ae9e', deep: '#d98a80',
  tummy: '#fff0e4', seam: '#eea292', snout: '#ffbcad', snoutLt: '#ffdcd2', mouth: '#8a3048', tongue: '#ff8aa0',
  pad: '#ff94a8', padLt: '#ffc2cc', cheek: '#ff8f9a',
  iris0: '#3b1d3e', iris1: '#8a4688', glint: '#ffffff', lid: '#8a4a5c',
  moss: '#6ea24a', mossLt: '#a8d468', mossSh: '#4c8238', mossDeep: '#3e6e30', clover: '#5fae58', cloverLt: '#9ddc7c',
  bud: '#ffd2dc', petal: '#ffffff', petalSh: '#ffe0ea', heart: '#ffd35a',
  tun: '#dcae84', tunLine: '#b07e5a', acorn: '#b9783c', acornLt: '#dca266', cap: '#7c5a36',
  drop: '#bfe8ff', dropLt: '#ffffff', dropEdge: '#7fb8e0', beam: [255, 232, 150],
};

// ---------- Its face: bean eyes (tall soft ovals, a deep berry iris fading lighter at the bottom, a big
// round glint up front, a tiny one low behind, a thin arched lid), peach cheeks; the snout is its own
// part (over the body, so it stands out of the face's edge) ----------
const SHUT = { blink: 1, sleep: 1, happy: 1, hurt: 1, dead: 1, tun: 1, gulp: 1 };
function eye(ctx, a, K, x, y, k, f) {
  const rx = 1.7 * k;
  const ry = 2.35;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (SHUT[f]) {
    ctx.strokeStyle = K.colour(a, PG.iris0);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    if (f === 'happy' || f === 'gulp') {
      ctx.moveTo(x - rx, y + 0.4);
      ctx.quadraticCurveTo(x, y - 1.6, x + rx, y + 0.4);
    } else if (f === 'hurt' || f === 'tun') {
      // (squeezed tight: a little chevron pointing in toward the snout)
      const s = f === 'tun' ? 0.7 : 1;
      ctx.moveTo(x - rx * s, y - 1.1 * s);
      ctx.quadraticCurveTo(x + rx * 0.2, y - 0.2, x + rx * 0.75 * s, y);
      ctx.quadraticCurveTo(x + rx * 0.2, y + 0.2, x - rx * s, y + 1.1 * s);
    } else if (f === 'dead') {
      for (let i = 0; i <= 24; i++) {
        const q = (i / 24) * TAU * 1.6 + (a.t ?? 0) * 3;
        const r = 0.15 + (i / 24) * 1.35;
        const p = [x + Math.cos(q) * r * k, y + Math.sin(q) * r * 1.15];
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      }
    } else {
      // (soft shut: a gentle curve with a little lash flick at its back end)
      ctx.moveTo(x - rx, y + 0.1);
      ctx.quadraticCurveTo(x, y + 1.25, x + rx, y + 0.1);
      ctx.moveTo(x - rx, y + 0.1);
      ctx.lineTo(x - rx - 0.45, y - 0.25);
    }
    ctx.stroke();
    return;
  }
  const wide = f === 'wonder' ? 1.06 : 1;
  ell(ctx, x, y, rx * wide, ry * wide);
  const g = ctx.createLinearGradient(x, y - ry, x, y + ry);
  g.addColorStop(0, K.colour(a, PG.iris0));
  g.addColorStop(0.5, K.colour(a, PG.iris0));
  g.addColorStop(1, K.colour(a, PG.iris1));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = PG.glint;
  ell(ctx, x + rx * 0.3, y - ry * 0.4, 0.62 * k, 0.66);
  ctx.fill();
  ell(ctx, x - rx * 0.36, y + ry * 0.48, 0.28 * k, 0.28);
  ctx.fill();
  if (f === 'wonder' || f === 'proud') sparkle(ctx, x + rx * 0.4, y + ry * 0.08, 0.42);
  // the lid: a thin arch over the top, heavier toward the back; set flat when it means business
  ctx.strokeStyle = K.colour(a, PG.lid);
  ctx.lineWidth = 0.36;
  ctx.beginPath();
  if (f === 'focus') {
    ctx.moveTo(x - rx * 1.1, y - ry * 0.5);
    ctx.lineTo(x + rx * 1.05, y - ry * 0.92);
  } else {
    ctx.moveTo(x - rx * 1.15, y - ry * 0.52);
    ctx.quadraticCurveTo(x - rx * 0.2, y - ry * 1.3, x + rx * 1.0, y - ry * 0.82);
  }
  ctx.stroke();
}
function face(ctx, a, bk, K) {
  const F = K.P.face;
  K.frameAt(ctx, a, F.y);
  const lk = clamp(bk.look ?? 0, -1.2, 1.2);
  const tun = clamp(a.S?.tun ?? 0, 0, 1);
  ctx.translate(F.x + lk * 0.5 - tun * 1.2, F.y + tun * 0.6);
  const tt = a.pg ?? {};
  let f = tt.face ?? 'open';
  if (f === 'open' && ((a.t ?? 0) + 1.1) % 3.9 < 0.12) f = 'blink';
  const up = tt.up ?? 0;
  for (const [cx, cy, rx, al] of [[-5.2, 1.7, 1.5, 0.6], [3.2, 1.6, 1.1, 0.5]]) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, K.tint(a, PG.cheek, al));
    g.addColorStop(1, K.tint(a, PG.cheek, 0));
    ctx.fillStyle = g;
    ell(ctx, cx, cy, rx, rx * 0.75);
    ctx.fill();
  }
  eye(ctx, a, K, 0.9, -1.5 - up * 0.4, 0.95, f);
  eye(ctx, a, K, -3.7, -1.6 - up * 0.4, 0.72, f);
  snout(ctx, a, K, tt, f, up);
}

// ---------- Its snout: a soft round piglet snout in the middle of its face, below and between its
// eyes, an "o" mouth in it (puckered to slurp, wide to yawn) ----------
function snout(ctx, a, K, tt, f, up) {
  const pu = clamp(tt.pucker ?? 0, 0, 1);
  const sx = -1.1 + pu * 0.3;
  const sy = 2.5 - up * 0.5;
  const shape = () => ell(ctx, sx, sy, 2.35 - pu * 0.25, 1.85 + pu * 0.15);
  // (a soft shadow under it, so it stands out of the face)
  ell(ctx, sx + 0.1, sy + 0.55, 2.4, 1.85);
  ctx.fillStyle = K.tint(a, PG.deep, 0.35);
  ctx.fill();
  shape();
  ctx.fillStyle = K.colour(a, PG.snout);
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ell(ctx, sx - 0.3, sy - 0.85, 1.6, 0.75);
  ctx.fillStyle = K.tint(a, PG.snoutLt, 0.95);
  ctx.fill();
  ctx.restore();
  // the "o"
  const open = clamp(Math.max(tt.open ?? 0, a.bk.open ?? 0), 0, 1);
  const r = f === 'dead' ? 0.34 : pu > 0.3 ? 0.38 : 0.5 + open * 0.55;
  ell(ctx, sx + 0.15, sy + 0.3, r * 0.9, r);
  ctx.fillStyle = K.colour(a, PG.mouth);
  ctx.fill();
  if (open > 0.3) {
    ell(ctx, sx + 0.18, sy + 0.3 + r * 0.45, r * 0.6, r * 0.42);
    ctx.fillStyle = K.colour(a, PG.tongue);
    ctx.fill();
  }
}

// ---------- Its eight nubs. The arms and feet are the base's own (a pink pad drawn on each arm's end);
// the four side nubs are its own: two pairs between its arms and feet, each rooted inside the body
// and sprung, a pink pad at its tip; the near pair out of its front, the far pair out of its back.
// They paddle gently on their own, ripple in a wave, flail in the flurry, pull in for the tun. ----------
const NUB_ROOTS = { N: [[8.0, -7.6], [6.8, -4.4]], F: [[-8.0, -8.0], [-6.8, -4.8]] };
function nubAngles(a, side, i) {
  const S = a.S ?? {};
  const t = a.t ?? 0;
  const tun = clamp(S.tun ?? 0, 0, 1);
  const k = i + 1;
  const paddle = Math.sin(t * 2.3 + k * 1.7 + (side === 'N' ? 0 : 2)) * 7;
  const wave = (S.wave ?? 0) * Math.sin(t * 9 - k * 1.3) * 38;
  const flail = (S.flail ?? 0) * Math.sin(t * 28 + k * 2 + (side === 'N' ? 0 : 1.6)) * 42;
  return 48 - i * 14 + paddle * (1 - tun) + wave + flail + (S.nubUp ?? 0) * (62 - i * 18) - tun * 30;
}
function nubs(ctx, a, mode, K, side) {
  const bk = a.bk;
  const st = a.mo.rig;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const tun = clamp(a.S?.tun ?? 0, 0, 1);
  NUB_ROOTS[side].forEach((r, i) => {
    const root = K.at(a, r);
    const deg = nubAngles(a, side, i);
    const goal = side === 'N' ? bk.ang + (90 - deg) * D2R : bk.ang + (90 + deg) * D2R;
    const s = (st[`pgNub${side}${i}`] ??= { x: goal, v: 0 });
    // (sprung once a frame, in the outline pass; the fill pass reuses it)
    const th = mode === 'line' ? K.swing(s, goal, 420, 24, 0, dt, 0.9) : s.x;
    // (pulled in for the tun: drawn back inside the body along its own line, never shrunk)
    const len = mix(3.6, 1.1, tun);
    const tip = [root[0] + Math.cos(th) * len, root[1] + Math.sin(th) * len];
    const path = () => K.capsule(ctx, root, tip, 2.05, 1.8);
    path();
    if (mode === 'line') return K.edge(ctx);
    // (a soft shadow on the body under a near nub, so it reads standing out of it)
    if (side === 'N') {
      ctx.save();
      K.clipBody(ctx, bk);
      ell(ctx, (root[0] + tip[0]) / 2 - 0.3, (root[1] + tip[1]) / 2 + 1.7, len * 0.55, 1.4, th);
      ctx.fillStyle = K.tint(a, PG.deep, 0.32);
      ctx.fill();
      ctx.restore();
    }
    path();
    ctx.fillStyle = K.colour(a, side === 'N' ? PG.base : PG.sh);
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    // a light along its top, and its pink pad
    const n = [Math.cos(th - Math.PI / 2), Math.sin(th - Math.PI / 2)];
    ell(ctx, (root[0] + tip[0]) / 2 + n[0] * 0.9, (root[1] + tip[1]) / 2 + n[1] * 0.9, len * 0.45, 0.7, th);
    ctx.fillStyle = K.tint(a, PG.lt, 0.7);
    ctx.fill();
    pad(ctx, a, K, tip, th, 1 - tun);
    ctx.restore();
    // (where it lies over the body: a soft rim along its underside, faded out at the root)
    if (side === 'N') {
      ctx.strokeStyle = K.tint(a, PG.deep, 0.55);
      ctx.lineWidth = 0.38;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const q0 = [root[0] + Math.cos(th) * 1.6 - n[0] * 2.0, root[1] + Math.sin(th) * 1.6 - n[1] * 2.0];
      ctx.moveTo(...q0);
      ctx.quadraticCurveTo(tip[0] - n[0] * 2.3, tip[1] - n[1] * 2.3, tip[0] + Math.cos(th) * 1.9, tip[1] + Math.sin(th) * 1.9);
      ctx.stroke();
    }
  });
}
// (a pink pad on a nub's end: a soft oval with a lighter spot)
function pad(ctx, a, K, tip, th, al) {
  if (al < 0.05) return;
  const c = [tip[0] + Math.cos(th) * 0.55, tip[1] + Math.sin(th) * 0.55];
  ell(ctx, c[0], c[1], 1.15, 1.6, th);
  ctx.fillStyle = K.tint(a, PG.pad, al);
  ctx.fill();
  ell(ctx, c[0] + Math.cos(th) * 0.25 - 0.2, c[1] + Math.sin(th) * 0.25 - 0.3, 0.42, 0.5, th);
  ctx.fillStyle = K.tint(a, PG.padLt, al * 0.9);
  ctx.fill();
}
function armPad(ctx, a, mode, K, side) {
  if (mode !== 'fill') return;
  const A = a.bk.arms?.[side];
  if (!A) return;
  const tun = clamp(a.S?.tun ?? 0, 0, 1);
  ctx.save();
  K.capsule(ctx, A.S, A.Hd, K.P.arm.r[0], K.P.arm.r[1]);
  ctx.clip();
  pad(ctx, a, K, A.Hd, A.th, side === 'N' ? 1 - tun : 0.7 * (1 - tun));
  ctx.restore();
}

// ---------- The moss cushion on its back: a soft rounded mound hugging its upper back (its base inside
// the body), three round tufts on springs, a clover sprig and a little flower bud that opens ----------
const MOUND = [[-9.0, -9.2], [-11.0, -11.2], [-11.7, -14.6], [-10.8, -18.2], [-8.4, -21.2], [-4.8, -23.2], [-1.2, -23.4], [0.8, -21.4], [-1.2, -17.6], [-4.0, -13.6], [-6.6, -10.4]];
const TUFTS = [[-10.8, -12.6, -172, 1.3], [-10.4, -16.6, -150, 1.55], [-8.8, -19.8, -134, 1.35], [-6.0, -22.0, -112, 1.5], [-2.4, -23.0, -92, 1.2]];
function smoothLoop(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (i === 0) ctx.moveTo(...p1);
    ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, ...p2);
  }
  ctx.closePath();
}
function tufts(a, K) {
  if (a.pgTuftFrame === a.bk) return a.pgTufts;
  a.pgTuftFrame = a.bk;
  const st = a.mo.rig;
  const bk = a.bk;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const m = a.vgM ?? {};
  const sx = a.flip ? -1 : 1;
  const top = K.at(a, [-6, -21]);
  const acc = K.feel(st, 'pgMossF', [top[0] + sx * (m.x ?? 0), top[1] + (m.y ?? 0)], dt, a.flip);
  const pat = clamp(a.S?.pat ?? 0, 0, 1);
  a.pgTufts = TUFTS.map(([x, y, rest, r], i) => {
    const root = K.at(a, [x, y]);
    const goal = bk.ang + (rest + Math.sin((a.t ?? 0) * 1.5 + i * 2.1) * 6 + pat * Math.sin((a.t ?? 0) * 14 + i) * 22) * D2R;
    const s = (st[`pgTuft${i}`] ??= { x: goal, v: 0 });
    const th = K.swing(s, goal, 220, 12, K.shove(s.x, acc, 0.3), dt, 0.8);
    return { root, tip: [root[0] + Math.cos(th) * 1.5, root[1] + Math.sin(th) * 1.5], r, th };
  });
  return a.pgTufts;
}
function moss(ctx, a, mode, K) {
  const bk = a.bk;
  const tun = clamp(a.S?.tun ?? 0, 0, 1);
  const pts = MOUND.map((p) => K.at(a, p));
  const T = tufts(a, K);
  if (mode === 'line') {
    smoothLoop(ctx, pts);
    for (const q of T) {
      ctx.moveTo(q.tip[0] + q.r, q.tip[1]);
      ctx.arc(q.tip[0], q.tip[1], q.r, 0, TAU);
    }
    return K.edge(ctx);
  }
  const dry = tun * 0.45;
  const top = K.at(a, [-6.4, -21.6]);
  const low = K.at(a, [-9.4, -10.4]);
  const g = ctx.createLinearGradient(top[0], top[1], low[0], low[1]);
  g.addColorStop(0, K.colour(a, PG.mossLt));
  g.addColorStop(0.55, K.colour(a, PG.moss));
  g.addColorStop(1, K.colour(a, PG.mossSh));
  smoothLoop(ctx, pts);
  ctx.fillStyle = g;
  ctx.fill();
  // the tufts: soft round puffs, a light on each
  for (const q of T) {
    ell(ctx, q.tip[0], q.tip[1], q.r, q.r);
    ctx.fillStyle = K.colour(a, PG.moss);
    ctx.fill();
    ell(ctx, q.tip[0] - 0.25, q.tip[1] - 0.45, q.r * 0.6, q.r * 0.48);
    ctx.fillStyle = K.tint(a, PG.mossLt, 0.95);
    ctx.fill();
  }
  // a soft light along the top of the mound
  ctx.save();
  smoothLoop(ctx, pts);
  ctx.clip();
  ell(ctx, ...K.at(a, [-7.0, -19.0]), 1.8, 0.9, bk.ang - 0.9);
  ctx.fillStyle = K.tint(a, '#e4ffc0', 0.35);
  ctx.fill();
  // (soft little rosettes of star moss, a shade lighter, round the cushion)
  for (const [x, y, r] of [[-8.6, -15.4, 0.9], [-5.4, -19.2, 0.8], [-3.2, -16.8, 0.7], [-7.2, -11.8, 0.75], [-2.0, -20.6, 0.6]]) {
    const c0 = K.at(a, [x, y]);
    for (let i = 0; i < 5; i++) {
      const q = (i / 5) * TAU + x;
      ell(ctx, c0[0] + Math.cos(q) * r * 0.55, c0[1] + Math.sin(q) * r * 0.55, r * 0.42, r * 0.3, q);
      ctx.fillStyle = K.tint(a, PG.mossLt, 0.75);
      ctx.fill();
    }
  }
  ctx.restore();
  if (dry > 0.02) {
    smoothLoop(ctx, pts);
    ctx.fillStyle = K.tint(a, '#c9b878', dry);
    ctx.fill();
  }
  ctx.fillStyle = K.tint(a, '#ffffff', 0.85 * (1 - tun));
  sparkle(ctx, ...K.at(a, [-9.0, -14.2]), 0.6);
  // the clover: a stem from inside the top of the mound, swaying on a spring; three round leaves
  const st = a.mo.rig;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const root = K.at(a, [-5.4, -22.2]);
  const goal = bk.ang - Math.PI / 2 + 0.25 + Math.sin((a.t ?? 0) * 1.3) * 0.12;
  const s = (st.pgClover ??= { x: goal, v: 0 });
  const th = K.swing(s, goal, 160, 9, 0, dt, 1.2);
  const tip = [root[0] + Math.cos(th) * 3.4, root[1] + Math.sin(th) * 3.4];
  ctx.strokeStyle = K.colour(a, PG.mossDeep);
  ctx.lineWidth = 0.55;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...root);
  ctx.quadraticCurveTo(root[0] + Math.cos(th - 0.5) * 2, root[1] + Math.sin(th - 0.5) * 2, ...tip);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const q = th - 1.7 + i * 1.7;
    const c = [tip[0] + Math.cos(q) * 1.0, tip[1] + Math.sin(q) * 1.0];
    ell(ctx, c[0], c[1], 1.15, 0.95, q);
    ctx.fillStyle = K.colour(a, i === 1 ? PG.cloverLt : PG.clover);
    ctx.fill();
  }
  // the flower: a closed pink bud on the moss, opening into a little white flower (napping, or as it
  // pats its moss)
  const bl = clamp(a.pg?.bloom ?? 0, 0, 1);
  const c = K.at(a, [-10.6, -12.6]);
  if (bl < 0.98) {
    ell(ctx, c[0], c[1] - 0.2, 0.75 * (1 - bl), 1.0 * (1 - bl), bk.ang);
    ctx.fillStyle = K.colour(a, PG.bud);
    ctx.fill();
  }
  if (bl > 0.02) {
    for (let i = 0; i < 5; i++) {
      const q = (i / 5) * TAU + 0.3;
      ell(ctx, c[0] + Math.cos(q) * 0.85 * bl, c[1] + Math.sin(q) * 0.85 * bl, 0.7 * bl, 0.5 * bl, q);
      ctx.fillStyle = K.colour(a, i % 2 ? PG.petalSh : PG.petal);
      ctx.fill();
    }
    ell(ctx, c[0], c[1], 0.42 * bl, 0.42 * bl);
    ctx.fillStyle = K.colour(a, PG.heart);
    ctx.fill();
  }
}

// ---------- Its moves ----------
// Tun Drop: crouched, nubs up, eyes on its target; a hop; curled into its hard tun in the air; down on
// the target (clonk); a moment curled; then it pops back plump.
const TUNDROP = {
  anticT: 0.42,
  keys: [
    [0, { crouch: 0.85, lean: -12, bend: -5, armN: 125, armF: 115, nubUp: 1, look: -0.4, mouth: 0.2 }],
    [0.1, { hop: 6.5, x: 4.2, tuck: 1, lean: 40, bend: 6, tun: 1, armN: 8, armF: 8, nubUp: 0 }, 'out'],
    [0.2, { hop: 0.2, x: 7.6, tuck: 1, lean: 58, bend: 7, tun: 1, armN: 4, armF: 4, crouch: 0.4 }, 'in'],
    [0.5, { hop: 0, x: 7.2, tuck: 0.8, lean: 48, bend: 5, tun: 0.95, crouch: 0.55 }, 'io'],
    [0.7, { hop: 1.4, x: 4.6, tuck: 0.2, lean: -6, tun: 0, armN: 120, armF: 110, nubUp: 1, crouch: 0 }, 'out'],
    [0.86, { hop: 0, x: 2.8, lean: -2, armN: 40, armF: 36, nubUp: 0, crouch: 0.3 }, 'in'],
    [1.15, {}, 'io'],
  ],
  dust: [[0.2, 'feet'], [0.86, 'feet']],
};
// Eight-Nub Flurry: leaning in, every nub up; a pitter-patter of slaps (the arms swapping as fast as
// they go, the side nubs flailing), a little shuffle forward; a last double pat; settled.
const FLURRY = {
  anticT: 0.3,
  keys: [
    [0, { lean: -8, bend: -3, crouch: 0.3, armN: 105, armF: 100, nubUp: 0.8, look: -0.2 }],
    [0.06, { lean: 14, bend: 4, x: 3.2, armN: 70, armF: 70, flail: 1, mouth: 0.5, crouch: 0 }, 'out'],
    [0.5, { lean: 16, bend: 5, x: 4.4, armN: 70, armF: 70, flail: 1, mouth: 0.5 }, 'io'],
    [0.62, { lean: 20, bend: 6, x: 4.8, armN: 120, armF: 112, flail: 0.3, mouth: 0.2 }, 'out'],
    [0.7, { lean: 18, x: 4.8, armN: 30, armF: 26, flail: 0, mouth: 0 }, 'in'],
    [1.0, {}, 'io'],
  ],
};
// Snout Bump: drawn back, snout puckered; a hop forward snout first (boop); bounced off, home.
const SNOUTBUMP = {
  anticT: 0.32,
  keys: [
    [0, { lean: -14, bend: -6, crouch: 0.55, armN: 20, armF: 70, nubUp: 0.3 }],
    [0.08, { lean: 26, bend: 8, hop: 2.4, x: 5.6, tuck: 0.8, armN: 10, armF: 80, nubUp: 0 }, 'out'],
    [0.15, { lean: 22, bend: 6, hop: 1.8, x: 6.0, tuck: 0.8, armN: 16, armF: 70 }, 'io'],
    [0.3, { lean: -10, hop: 0.6, x: 3.8, tuck: 0.5, armN: 40, armF: 30 }, 'io'],
    [0.42, { lean: -3, hop: 0, x: 3.4, tuck: 0, crouch: 0.4 }, 'in'],
    [0.62, { hop: 1.4, x: 1.2, tuck: 0.6, crouch: 0 }, 'out'],
    [0.74, { hop: 0, x: 0, tuck: 0, crouch: 0.3 }, 'in'],
    [0.96, {}, 'io'],
  ],
  dust: [[0.42, 'feet'], [0.74, 'feet']],
};
const MINE = { tundrop: TUNDROP, flurry: FLURRY, snoutbump: SNOUTBUMP };

// ---------- Its act, its fights and its habits, on the base's channels (x, lift, hop, lean, bend,
// crouch, sit, lie, armN, armF, mouth, look, wiggle, shake, tuck; its own tun, nubUp, wave, flail,
// pat), its face and props (a.pg) ----------
function pose(m, a, out, K, cur) {
  const pg = { face: 'open', up: 0, pucker: 0, open: 0, bloom: 0, drop: null, beam: 0, acorn: -1, q: -1, spark: [], boing: -1, lu: -1 };
  a.pg = pg;
  const st = a.mo.rig;
  const now = a.now ?? 0;
  const napping = m.habit?.kind === 'nap' && now < (m.habit.until ?? 0);
  const name = cur?.name;
  const mood = m.cine?.mood ?? a.mood;
  const go = (p, w) => {
    if (w > 0.001) for (const [k, v] of Object.entries(p)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
  };
  // (its stubby arms angled out from its belly, not hanging)
  if (!cur && m.hp > 0) {
    out.armN += 40;
    out.armF += 40;
  }
  // (a hit: a squeezed wince and a wobble it shrugs off)
  const hurt = a.hurtAgo ?? 9;
  if (m.hp > 0 && hurt < 0.7) out.lean += Math.sin(hurt * 26) * (1 - hurt / 0.7) * 7;
  if (m.hp <= 0) pg.face = 'dead';
  else if (hurt < 0.45 || name === 'hurt' || name === 'knockdown') pg.face = 'hurt';
  else if (napping || mood === 'sleep') {
    pg.face = 'sleep';
    pg.bloom = 1;
  } else if (name === 'tundrop') pg.face = cur.t < 0 ? 'focus' : cur.t < 0.62 ? 'tun' : 'happy';
  else if (name === 'flurry') {
    pg.face = cur.t < 0 ? 'focus' : 'happy';
    // (the arms swapping as fast as they go, through the pitter-patter)
    const f = cur.t >= 0.04 && cur.t < 0.56 ? 1 : 0;
    out.armN += f * Math.sin(cur.t * 44) * 55;
    out.armF -= f * Math.sin(cur.t * 44) * 55;
  } else if (name === 'snoutbump') {
    pg.face = cur.t < 0.2 ? 'focus' : 'happy';
    pg.pucker = cur.t < 0.18 ? 1 : 0;
  } else if (name === 'cheer') pg.face = 'happy';
  else if (cur) pg.face = 'focus';
  else if (mood === 'happy') pg.face = 'happy';
  else if (mood === 'sad') pg.face = 'blink';
  if (mood === 'talk' && m.hp > 0) pg.open = Math.max(0, Math.sin((a.t ?? 0) * 13)) * 0.6;
  if (m.hp <= 0 || napping || cur) return;
  // Play: the chaser curls into a tun-bump as it catches up; the chased glances back with a hop.
  if (m.habit?.kind === 'play' && now < (m.habit.until ?? 0)) {
    pg.face = 'happy';
    const mate = m.habit.chase;
    if (mate) {
      const close = Math.abs((mate.x ?? 0) - (m.x ?? 0)) < 16;
      if (close && now - (st.pgBumpAt ?? -9) > 1.2) st.pgBumpAt = now;
      const u = span(now, st.pgBumpAt ?? -9, 0.6);
      if (u >= 0) {
        const w = Math.sin(Math.PI * u);
        go({ tun: 1, lean: 40, tuck: 1, armN: 6, armF: 6 }, w);
        out.hop += w * 3;
        pg.face = 'tun';
        pg.boing = u;
      }
    } else {
      out.look -= 0.6;
      out.hop += Math.abs(Math.sin(now * 7)) * 0.8;
    }
    return;
  }
  // (its act only while it stands about calm: never while it walks, fights or is posed)
  const calm = clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
  if (calm < 0.02) return;
  let lu = (((a.t ?? 0) % 30) + 30) % 30;
  // (at home, at its favourite mossy spot, it plays the dewdrop beat over and over)
  if (m.habit?.kind === 'home' && now < (m.habit.until ?? 0)) {
    if (st.pgHome !== m.habit) {
      st.pgHome = m.habit;
      st.pgHomeAt = now;
    }
    lu = 0.4 + ((now - st.pgHomeAt) % 5.6);
  }
  pg.lu = lu;
  const say = (f, w) => {
    if (w > 0.4) pg.face = f;
  };
  // 1. the dewdrop: a drop sparkles into being above it and falls; it tips its snout up, opens wide,
  //    catches it with a slurp, then wiggles all eight nubs with joy
  const look1 = win(lu, 0.9, 1.4, 2.0, 2.4) * calm;
  go({ look: -0.9, lean: -12, bend: -6, nubUp: 0.4 }, look1);
  pg.up = Math.max(pg.up, look1);
  pg.open = Math.max(pg.open, win(lu, 1.5, 1.8, 2.0, 2.1) * calm);
  say('wonder', look1 * (lu < 2.0 ? 1 : 0));
  if (lu >= 0.6 && lu < 2.05) pg.drop = { u: clamp((lu - 1.55) / 0.45, 0, 1), born: clamp((lu - 0.6) / 0.4, 0, 1), on: 'snout' };
  if (lu >= 2.0 && lu < 2.5) pg.spark.push(['snout', (lu - 2.0) / 0.5]);
  const gulp = win(lu, 2.0, 2.1, 2.5, 2.7) * calm;
  say('gulp', gulp);
  const wig = win(lu, 2.6, 2.8, 4.2, 4.6) * calm;
  out.flail = (out.flail ?? 0) + wig * 0.45;
  out.hop += wig * Math.abs(Math.sin(lu * 9)) * 0.7;
  out.armN += wig * (40 + Math.sin(lu * 18) * 30);
  out.armF += wig * (40 - Math.sin(lu * 18) * 30);
  say('happy', wig);
  // 2. the sunbeam: a warm beam finds it; a yawn; it dries and curls up into its tun; a drop lands on
  //    it, and it plumps back out with a happy hop
  pg.beam = win(lu, 6.4, 7.0, 10.8, 11.8) * calm;
  const yawn = win(lu, 7.0, 7.3, 7.6, 7.9) * calm;
  go({ lean: -10, bend: -5, armN: 120, armF: 110 }, yawn);
  pg.open = Math.max(pg.open, yawn);
  say('blink', yawn);
  const tun = win(lu, 7.7, 8.6, 10.3, 10.6) * calm;
  go({ tun: 1, lean: 34, bend: 9, crouch: 0.55, armN: 4, armF: 4, nubUp: 0, look: 0.3 }, tun);
  say('tun', tun);
  if (lu >= 9.7 && lu < 10.35) pg.drop = { u: clamp((lu - 9.95) / 0.4, 0, 1), born: clamp((lu - 9.7) / 0.25, 0, 1), on: 'top' };
  if (lu >= 10.3 && lu < 10.8) pg.spark.push(['top', (lu - 10.3) / 0.5]);
  const plump = pulse(lu, 10.5, 0.55) * calm;
  out.hop += plump * 3.2;
  out.tuck += plump * 0.5;
  go({ armN: 140, armF: 130, nubUp: 1 }, plump);
  say('happy', win(lu, 10.5, 10.6, 11.3, 11.6) * calm);
  // 3. the acorn: it drops onto its head and bounces off with a sparkle; not noticed at all; then,
  //    late, a slow look up, "?"; a happy shrug
  pg.acorn = lu >= 13 && lu < 15.6 ? lu - 13 : -1;
  const bonk = win(lu, 13.38, 13.45, 13.52, 13.8) * calm;
  out.lean += bonk * 5;
  out.bend += bonk * 4;
  const up = win(lu, 15.0, 15.6, 16.4, 16.8) * calm;
  go({ look: -0.9, lean: -10, bend: -5 }, up);
  pg.up = Math.max(pg.up, up);
  say('wonder', up);
  pg.q = lu >= 15.3 && lu < 16.8 ? (lu - 15.3) / 1.5 : -1;
  const shrug = win(lu, 16.6, 16.85, 17.2, 17.5) * calm;
  go({ armN: 70, armF: 64, nubUp: 0.6 }, shrug);
  say('happy', shrug);
  // 4. the wave: a ripple running down its nubs, twice; then a proud flex, arms up, a sparkle
  const wave = win(lu, 18.6, 19.0, 22.0, 22.4) * calm;
  out.wave = (out.wave ?? 0) + wave;
  out.armN += wave * Math.sin((a.t ?? 0) * 9) * 38;
  out.armF += wave * Math.sin((a.t ?? 0) * 9 - 0.6) * 38;
  say('happy', wave);
  const flex = win(lu, 22.5, 22.8, 23.6, 24.0) * calm;
  go({ armN: 150, armF: 142, nubUp: 1, lean: -6, bend: -3, lift: 0.4 }, flex);
  say('proud', flex);
  if (lu >= 22.8 && lu < 23.6) pg.spark.push(['flex', (lu - 22.8) / 0.8]);
  // 5. the moss: it reaches round and pats its moss smooth, the tufts bouncing and the bud opening a
  //    moment; a content blink and a tiny sparkle
  const reach = win(lu, 25.0, 25.5, 28.0, 28.5) * calm;
  go({ armF: 168, lean: 6, bend: 3, look: 0.5 }, reach);
  const pat = win(lu, 25.5, 25.7, 27.8, 28.0) * calm;
  out.armF += pat * Math.sin(lu * 14) * 14;
  out.pat = (out.pat ?? 0) + pat;
  pg.bloom = Math.max(pg.bloom, win(lu, 26.0, 26.6, 28.4, 29.2) * calm);
  say('happy', reach);
  if (lu >= 28.4 && lu < 29.2) pg.spark.push(['moss', (lu - 28.4) / 0.8]);
}

// ---------- Its extras: dewdrops, the sunbeam, the acorn and its "?", sparkles; in a fight the Tun
// Drop's clonk, the flurry's pats and the snout's boop; the play tun-bump's boing ----------
function drop(ctx, x, y, k, al) {
  ctx.globalAlpha = al;
  ctx.beginPath();
  ctx.moveTo(x, y - 1.6 * k);
  ctx.quadraticCurveTo(x + 1.1 * k, y - 0.1 * k, x + 0.9 * k, y + 0.5 * k);
  ctx.arc(x, y + 0.5 * k, 0.9 * k, 0, Math.PI);
  ctx.quadraticCurveTo(x - 1.1 * k, y - 0.1 * k, x, y - 1.6 * k);
  ctx.fillStyle = PG.drop;
  ctx.fill();
  ctx.strokeStyle = PG.dropEdge;
  ctx.lineWidth = 0.3;
  ctx.stroke();
  ctx.fillStyle = PG.dropLt;
  ell(ctx, x - 0.3 * k, y + 0.2 * k, 0.3 * k, 0.42 * k);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function fx(ctx, m, a, S, K) {
  const bk = a.bk;
  const pg = a.pg;
  if (!bk || !pg) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const F = K.P.face;
  const top = K.at(a, [-1, -23.4]);
  const tip = K.at(a, [F.x - 0.9, F.y + 2.6]);
  const where = (w) => (w === 'snout' ? tip : w === 'top' ? K.at(a, [-4, -23.6]) : w === 'flex' ? K.at(a, [9, -19]) : K.at(a, [-9, -21]));
  // the sunbeam: a soft warm column slanting down onto it, motes drifting in it
  if (pg.beam > 0.01) {
    const x0 = top[0];
    const y0 = top[1] - 10;
    ctx.save();
    ctx.globalAlpha = pg.beam;
    const [r, g, b] = PG.beam;
    const gr = ctx.createLinearGradient(0, y0, 0, 0);
    gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gr.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0.4)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(x0 - 4, y0);
    ctx.lineTo(x0 + 6, y0);
    ctx.lineTo(x0 + 13, 0);
    ctx.lineTo(x0 - 10, 0);
    ctx.closePath();
    ctx.fill();
    for (let j = 0; j < 4; j++) {
      const u = (((a.t ?? 0) * 0.25 + j / 4) % 1);
      ctx.globalAlpha = pg.beam * Math.sin(Math.PI * u) * 0.9;
      ctx.fillStyle = j % 2 ? '#fff3b0' : '#ffffff';
      sparkle(ctx, x0 - 3 + j * 3 + Math.sin(u * 6 + j), y0 + 3 + u * 22, 0.5 + (j % 2) * 0.25);
    }
    ctx.restore();
  }
  // a dewdrop: sparkling into being above, then falling onto its snout (or its head)
  if (pg.drop) {
    const { u, born, on } = pg.drop;
    const at = on === 'snout' ? tip : K.at(a, [-4, -23.6]);
    const y = at[1] - 11 + 11 * u * u;
    if (born < 1) {
      ctx.globalAlpha = Math.sin(Math.PI * born);
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, at[0] + 1.2, at[1] - 12, 1.1);
      ctx.globalAlpha = 1;
    }
    drop(ctx, at[0], y, 0.9, clamp(born * 1.5, 0, 1));
  }
  // little sparkles (a caught drop, the proud flex, the moss patted smooth)
  for (const [w, u] of pg.spark) {
    const p = where(w);
    ctx.globalAlpha = Math.sin(Math.PI * u);
    ctx.fillStyle = '#ffffff';
    sparkle(ctx, p[0] + 1.5 + u * 1.5, p[1] - 1.5 - u * 2.5, 1.2);
    ctx.fillStyle = w === 'top' || w === 'snout' ? PG.drop : '#ffe58a';
    sparkle(ctx, p[0] - 1.8 - u, p[1] - 0.6 - u * 1.8, 0.8);
    ctx.globalAlpha = 1;
  }
  // the acorn: falling from just above, a bonk, bouncing off up and behind, rolling to a stop
  if (pg.acorn >= 0) {
    const u = pg.acorn;
    const xb = top[0] - 0.5;
    let p;
    let rot = 0;
    if (u < 0.42) p = [xb, top[1] - 12 + 12 * (u / 0.42) ** 2];
    else if (u < 1.3) {
      const v = (u - 0.42) / 0.88;
      p = [xb - v * 12, mix(top[1], -1.8, v) - Math.sin(Math.PI * v) * 7];
      rot = -v * 6;
    } else {
      const v = clamp((u - 1.3) / 0.6, 0, 1);
      p = [xb - 12 - sstep(v) * 2.5, -1.8];
      rot = -6 - sstep(v) * 2;
    }
    ctx.globalAlpha = 1 - sstep((u - 2.2) / 0.4);
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(rot);
    ell(ctx, 0, 0.5, 1.6, 1.9);
    ctx.fillStyle = K.colour(a, PG.acorn);
    ctx.fill();
    ell(ctx, -0.4, 0.2, 0.6, 0.9);
    ctx.fillStyle = K.tint(a, PG.acornLt, 0.9);
    ctx.fill();
    ell(ctx, 0, -0.9, 1.9, 1.05);
    ctx.fillStyle = K.colour(a, PG.cap);
    ctx.fill();
    ctx.strokeStyle = K.colour(a, PG.cap);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -1.8);
    ctx.lineTo(0.4, -2.6);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    if (u > 0.38 && u < 0.88) {
      const v = (u - 0.38) / 0.5;
      ctx.globalAlpha = 1 - v;
      ctx.strokeStyle = '#fff6d8';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(xb, top[1] + 0.5, 2 + v * 5, 0.8 + v * 2, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, xb + 3 + v * 2, top[1] - 2 - v * 3, 1.3);
      ctx.fillStyle = '#ffe58a';
      sparkle(ctx, xb - 3 - v * 2, top[1] - 1.5 - v * 2, 0.9);
      ctx.globalAlpha = 1;
    }
  }
  // the late "?" (un-mirrored, so it reads right facing either way)
  if (pg.q >= 0) {
    const v = pg.q;
    ctx.globalAlpha = Math.sin(Math.PI * clamp(v * 1.2, 0, 1));
    ctx.save();
    ctx.translate(top[0] + 5, top[1] - 3 - v * 2);
    if (a.flip) ctx.scale(-1, 1);
    const qm = () => {
      ctx.beginPath();
      ctx.moveTo(-1.1, -1.4);
      ctx.quadraticCurveTo(-1, -3, 0.4, -3);
      ctx.quadraticCurveTo(1.7, -3, 1.5, -1.6);
      ctx.quadraticCurveTo(1.3, -0.6, 0.2, -0.2);
      ctx.lineTo(0.2, 0.6);
      ctx.stroke();
    };
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    qm();
    ctx.strokeStyle = '#c05a78';
    ctx.lineWidth = 0.6;
    qm();
    ctx.fillStyle = '#c05a78';
    ell(ctx, 0.2, 1.9, 0.42, 0.42);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  const cur = a.vgMove;
  const front = K.at(a, [11, -8]);
  // the Tun Drop's clonk: a ring on the ground ahead and bright sparkles off its hard tun
  if (cur?.name === 'tundrop' && cur.t >= 0.18 && cur.t < 0.62) {
    const v = (cur.t - 0.18) / 0.44;
    const c = K.at(a, [10, -6]);
    ctx.globalAlpha = 1 - v;
    ctx.strokeStyle = '#fff4d0';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(c[0] + 2, -0.5, 4 + v * 9, 1 + v * 2, 0, Math.PI, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    sparkle(ctx, c[0] + 4 + v * 4, c[1] - 6 - v * 5, 1.8 * (1 - v * 0.4));
    ctx.fillStyle = '#ffd86a';
    sparkle(ctx, c[0] + 7 + v * 5, c[1] - 1 - v * 2, 1.2);
    sparkle(ctx, c[0] - 1, c[1] - 9 - v * 4, 0.9);
    ctx.globalAlpha = 1;
  }
  // the flurry: soft round pats popping in front, up and down as the nubs land
  if (cur?.name === 'flurry' && cur.t >= 0.05 && cur.t < 0.78) {
    for (let i = 0; i < 6; i++) {
      const t0 = 0.05 + i * 0.1;
      const v = (cur.t - t0) / 0.18;
      if (v < 0 || v > 1) continue;
      const p = [front[0] + 2 + (i % 2) * 1.5 + v * 2, front[1] + ((i % 3) - 1) * 3.4];
      ctx.globalAlpha = 1 - v;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 0.8 + v * 1.8, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = i % 2 ? PG.padLt : '#ffffff';
      sparkle(ctx, p[0] + 0.6, p[1] - 0.6, 0.8 * (1 - v * 0.5));
    }
    ctx.globalAlpha = 1;
  }
  // the snout bump: a soft "boop" ring off the tip of its snout, and a sparkle
  if (cur?.name === 'snoutbump' && cur.t >= 0.07 && cur.t < 0.45) {
    const v = (cur.t - 0.07) / 0.38;
    ctx.globalAlpha = 1 - v;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.8;
    for (const k of [0, 1]) {
      ctx.beginPath();
      ctx.arc(tip[0] + 1.5, tip[1], 1.6 + v * 4 + k * 1.6, -1.1, 1.1);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd86a';
    sparkle(ctx, tip[0] + 4 + v * 3, tip[1] - 3 - v * 2, 1.1);
    ctx.globalAlpha = 1;
  }
  // the play tun-bump: a soft boing ring
  if (pg.boing >= 0) {
    const v = pg.boing;
    ctx.globalAlpha = Math.sin(Math.PI * v) * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(front[0], front[1], 1.5 + v * 3, 2 + v * 4, 0, -1.2, 1.2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

const look = {
  kind: 'root',
  ink: INK,
  C: { lt: PG.lt, base: PG.base, sh: PG.sh, deep: PG.deep },
  CLeg: { lt: PG.lt, base: PG.base, sh: PG.sh, deep: PG.deep },
  DIRT: { top: '#9ec27a', clod: '#7fa65c', crumb: '#b9d89a', dust: '#f4f1e2', dustEdge: '#d6d2b8' },
  dirtInk: '#5f8a48',
  P: {
    body: [[0.4, -22.4], [5.6, -21.2], [9.2, -17.6], [10.5, -12.4], [10.2, -7.4], [8.4, -3.2], [4.8, -0.6], [0.4, 0.2], [-4.4, -0.3], [-8.2, -2.8], [-10.2, -7.6], [-10.4, -12.8], [-8.6, -17.8], [-4.6, -21.4]],
    top: 22.4,
    hb: 3.2,
    hip: { N: [1.8, -2.0], F: [-1.4, -2.2] },
    foot: { N: 1.4, F: -1.2 },
    leg: { l1: 2.3, l2: 2.2, r: [2.3, 2.1, 1.9], foot: [2.7, 1.7] },
    ankle: 1.5,
    arm: { N: [8.0, -10.8], F: [-7.8, -11.2], up: { N: [8.0, -15.0], F: [-7.8, -15.4] }, len: 4.4, r: [2.25, 2.0] },
    face: { x: 4.4, y: -15.8, h: 6.4 },
    crownH: 4.6,
    leaves: null,
    tail: null,
    gait: { cycle: 9.5, duty: 0.6, bob: 0.5, rock: 4.2, swing: 20, lift: 1.1 },
    speed: 20,
    moves: ['tundrop', 'flurry', 'snoutbump'],
  },
  moves: MINE,
  channels: { tun: [120, 16], nubUp: [150, 16], wave: [90, 14], flail: [160, 18], pat: [120, 14] },
  quietIdle: ['stretch', 'shake', 'sway'],
  // its markings: a soft cream tummy and two faint tone-on-tone seams round its back, like a plush
  // toy's panels; dried into its tun, a tan wash and a few soft wrinkles
  paint: (ctx, a, bk, K) => {
    const tun = clamp(a.S?.tun ?? 0, 0, 1);
    K.blob(ctx, a, PG.tummy, K.at(a, [4.6, -7.4]), 6.0, 7.2, bk.ang, 0.7 * (1 - tun * 0.6));
    ctx.lineCap = 'round';
    ctx.strokeStyle = K.tint(a, PG.seam, 0.28 * (1 - tun));
    ctx.lineWidth = 0.7;
    for (const [y0, y1] of [[-16.8, -14.6], [-8.8, -7.0]]) {
      const q = [[-10.6, y0], [-6.6, y0 + 2.4], [-2.4, y1 + 1.6]].map((p) => K.at(a, p));
      ctx.beginPath();
      ctx.moveTo(...q[0]);
      ctx.quadraticCurveTo(...q[1], ...q[2]);
      ctx.stroke();
    }
    if (tun > 0.02) {
      K.blob(ctx, a, PG.tun, K.at(a, [0, -11]), 13, 14, bk.ang, 0.6 * tun);
      ctx.strokeStyle = K.tint(a, PG.tunLine, 0.55 * tun);
      ctx.lineWidth = 0.42;
      for (const y of [-17.5, -12, -6.5]) {
        const q = [[-9, y + 0.5], [-3, y + 1.6], [3, y - 0.6], [9, y + 0.8]].map((p) => K.at(a, p));
        ctx.beginPath();
        ctx.moveTo(...q[0]);
        ctx.bezierCurveTo(...q[1], ...q[2], ...q[3]);
        ctx.stroke();
      }
    }
  },
  face,
  under: {
    body: (ctx, a, mode, K) => nubs(ctx, a, mode, K, 'F'),
  },
  over: {
    body: (ctx, a, mode, K) => {
      moss(ctx, a, mode, K);
      nubs(ctx, a, mode, K, 'N');
    },
    armN: (ctx, a, mode, K) => armPad(ctx, a, mode, K, 'N'),
    armF: (ctx, a, mode, K) => armPad(ctx, a, mode, K, 'F'),
  },
  pose,
  // napping: sat back in a little curl, nubs tucked, a slow breath (the flower open on its moss);
  // beaten: slumped forward onto its tummy, curled up tight in its tun (rolled onto its back, its moss
  // would sink into the ground)
  after: (m, a, out) => {
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0) && m.hp > 0;
    const b = Math.sin((a.t ?? 0) * 0.95);
    if (napping) Object.assign(out, { sit: 1, lean: 14 + b * 1.5, bend: 6 + b, armN: 6, armF: 6, tun: 0.35, nubUp: 0, wave: 0, flail: 0, mouth: 0, look: 0.2 });
    if (m.hp <= 0) Object.assign(out, { lie: 0, sit: 1, lean: 46, bend: 9, tun: 1, tuck: 0, crouch: 0, armN: 6, armF: 6, nubUp: 0, wave: 0, flail: 0 });
  },
  fx,
};

export const MOSSTORT = dressedVeggie(look);
// (`noHop`, 2026-11-26: none of the monster drawer's little happy hops, a bounce on a sine's hard
// corner, wrong on a heavy little tortoise; it shows its moods in its own act and face, as the
// Turnip Tot and the Porcelain Doll do)
MOSSTORT.art.noHop = true;
