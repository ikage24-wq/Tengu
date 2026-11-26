// The Root Imp (2026-11-25, remade on the crab base, the player's pick "C" of three, Plotter the
// garden crab): Rootwood Hollow's level 10 digger, a round terracotta-clay crab with a tiny garden
// growing on its back (a cushion of moss, a curl of fern, a clover and one proud daisy that turns to
// follow the light and closes up when it naps). It fusses over its garden like a prize allotment.
// It moves on its own copy of the crab base (crabbase.js: its bones, sideways scuttle, springs and
// moves), dressed here; everything else drawn here from scratch (the face too).
//   look    terracotta shell, cream claws and legs held low and out to the sides (never in front of
//           its face at rest), big glossy plum dome eyes on short stalks with a four-point star glint
//           and the stalk-cap's skin for eyelids, a small 'w' mouth, peachy cheeks on the rim.
//   idle    a 30 s act while it stands about (see its pose below): trimming its garden snip-snip; the
//           daisy turned to the light; a pollen sneeze; a claw-clack dance; patting the moss flat;
//           watering the garden with a bubble it blows; a proud look at the finished bed.
//   moves   (def.moves order) Snip (one claw drawn back wide, a lunge and a snap), Prune Prune (both
//           claws in turn), each wound up over the fight's own wind-up.
//   burrow  (the dungeon's move, world/dungeon.js) it digs in backwards, as crabs do, throwing soil
//           out to both sides; under the floor only its garden shows, gliding along over a furrow;
//           at the spot it trembles; then it bursts up, claws high, a daisy petal flying.
//   faces   calm, happy, focused (cross) for a fight, hurt (squeezed), sad, worried when nearly
//           beaten (its daisy drooping), wide (popping up, a sneeze coming), asleep (stalks folded,
//           daisy closed, a slow bubble), soft spirals when beaten (flipped on its back, legs waving,
//           then still, its garden drooped).
import { dressedCrab } from './crabbase.js';

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
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
function sparkle(ctx, x, y, k, col, al = 1) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
  ctx.globalAlpha = 1;
}

const PL = {
  C: { lt: '#f8d2ae', base: '#e6a47c', sh: '#c8825e', deep: '#a8664a', guide: '#d08e6a', nose: '#c8825e', mouth: '#8a4a3e' },
  CC: { lt: '#fbe2c6', base: '#efc09a', sh: '#d49c76', deep: '#b47e5c' },
  ink: '#8c5444',
  seam: '#c98e6c',
  moss: ['#bfe39a', '#98ca72', '#73a856', '#5a8c44'],
  eye: '#3a2030',
  eyeLt: '#7a4a64',
  blush: '#ff9e8e',
  petal: '#fffdf4',
  petalSh: '#f0e6d2',
  heart: '#ffd45a',
  pollen: '#ffe27a',
};
// Rootwood soil, for the burrow.
const SOIL = { lt: '#a87a52', base: '#8a5e3e', sh: '#6c4630', ink: '#5a3a2a' };

// ---------- the garden on its back ----------
// A piece of the garden painted in its pass: its outline in the outline pass, its colour in the fill.
function paint(ctx, a, K, mode, fill, lw = 1.4) {
  if (mode === 'line') {
    ctx.strokeStyle = PL.ink;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else {
    ctx.fillStyle = K.tone(a, fill);
    ctx.fill();
  }
}
// The shell's own frame: the hull's points turned back into the body's upright frame about its pivot,
// so the garden sits on the dome however the body rolls (and lies under it, flipped on its back).
function domeFrame(sk) {
  const [px, py] = sk.pivot;
  const c = Math.cos(-sk.roll);
  const s = Math.sin(-sk.roll);
  const loc = sk.hull.map(([x, y]) => [(x - px) * c - (y - py) * s, (x - px) * s + (y - py) * c]);
  let top = Infinity;
  for (const p of loc) top = Math.min(top, p[1]);
  return { loc, top };
}
function garden(ctx, a, mode, K) {
  const sk = a.bk;
  const g = a.ri;
  if (!sk?.hull || !g) return;
  const s = K.sc(1);
  const { loc, top } = domeFrame(sk);
  const cut = top + s * 5.6;
  const xs = loc.filter((p) => p[1] <= cut).map((p) => p[0]);
  if (!xs.length) return;
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const tufts = [];
  loc.forEach((p, i) => {
    if (p[1] <= cut - s * 0.6 && i % 2 === 0) tufts.push([p[0], p[1] + s * 0.3, s * 1.25]);
  });
  const n = 7;
  for (let i = 0; i <= n; i++) tufts.push([mix(x0 + s * 0.8, x1 - s * 0.8, i / n), cut - s * 0.6 + (i % 2 ? s * 0.4 : 0), s * 1.45]);
  const path = () => {
    ctx.beginPath();
    for (const [x, y, r] of tufts) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  };
  ctx.save();
  ctx.translate(...sk.pivot);
  ctx.rotate(sk.roll);
  // the moss: a cushion over the top of the shell, soft round tufts along its top and its edge; a
  // pat ruffles it
  if (mode === 'line') {
    path();
    K.outline(ctx);
  } else {
    ctx.save();
    ctx.rotate(-sk.roll);
    ctx.translate(-sk.pivot[0], -sk.pivot[1]);
    K.pathOf(ctx, [sk.hull]);
    ctx.restore();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = K.tone(a, PL.moss[1]);
    ctx.fillRect(x0 - 10, top - 10, x1 - x0 + 20, cut - top + 10);
    ctx.restore();
    path();
    ctx.fillStyle = K.tone(a, PL.moss[1]);
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    ctx.fillStyle = K.tone(a, PL.moss[0]);
    ell(ctx, mix(x0, x1, 0.42), top + s * 0.6, (x1 - x0) * 0.32, s * 1.7);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = K.tone(a, PL.moss[2]);
    for (let i = 0; i < 4; i++) {
      ell(ctx, mix(x0, x1, 0.18 + i * 0.22), cut - s * 0.2 - (i % 2) * s * 0.7, s * 0.6, s * 0.38);
      ctx.fill();
    }
  }
  // (the plants: hidden under it while it lies on its back)
  if (g.upside > 0.5) {
    ctx.restore();
    return;
  }
  const gs = s * 1.3;
  const at = (u) => [mix(x0, x1, u), top + s * 0.9];
  const droop = g.droop;
  // a curl of fern at the back
  {
    const [bx, by] = at(0.2);
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(gs, gs);
    ctx.rotate(-0.35 + Math.sin(a.t * 1.6) * 0.06 - droop * 0.6);
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      if (u < 0.45) pts.push([u * 1.2, -u * 9]);
      else {
        const v = (u - 0.45) / 0.55;
        const an = Math.PI + v * 3.6;
        const r = 2 * (1 - v * 0.6);
        pts.push([2.54 + Math.cos(an) * r, -4.25 + Math.sin(an) * r]);
      }
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.strokeStyle = mode === 'line' ? PL.ink : K.tone(a, PL.moss[2]);
    ctx.lineWidth = mode === 'line' ? 1.4 : 0.6;
    ctx.stroke();
    ctx.restore();
  }
  // a clover (a leaf of it snipped off and growing back over the act)
  {
    const [bx, by] = at(0.46);
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(gs, gs);
    ctx.rotate(Math.sin(a.t * 2 + 1) * 0.08 + droop * 0.5);
    for (const an of [-1, 0, 1]) {
      ctx.save();
      ctx.translate(0, -2 + droop * 0.6);
      ctx.rotate(an * (1 + droop * 0.3));
      ell(ctx, 0, -1.15, 1.1, 1.2);
      paint(ctx, a, K, mode, PL.moss[2], 1.3);
      if (mode !== 'line') {
        ctx.fillStyle = K.tone(a, PL.moss[0]);
        ell(ctx, 0, -1.25, 0.7, 0.75);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  // the daisy: a stem, a ring of petals round a yellow heart, turned toward the light (or closed,
  // or drooped)
  {
    const [bx, by] = at(0.74);
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(gs, gs);
    const sway = Math.sin(a.t * 1.7) * 0.07 * (1 - droop) + g.daisy + droop * 1.2;
    const len = 6.4 * (1 - droop * 0.25);
    const head = [Math.sin(sway) * len, -Math.cos(sway) * len];
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0.6);
    ctx.quadraticCurveTo(head[0] * 0.2 - 0.8 + droop * 1.5, head[1] * 0.55 - droop, head[0], head[1]);
    ctx.strokeStyle = mode === 'line' ? PL.ink : K.tone(a, PL.moss[2]);
    ctx.lineWidth = mode === 'line' ? 1.4 : 0.6;
    ctx.stroke();
    ctx.save();
    ctx.translate(head[0] * 0.2 - 0.4, head[1] * 0.4);
    ctx.rotate(0.7 + droop * 0.6);
    ell(ctx, 1.2, 0, 1.4, 0.55);
    paint(ctx, a, K, mode, PL.moss[1], 1.2);
    ctx.restore();
    ctx.translate(...head);
    ctx.rotate(sway * 0.8);
    const open = 1 - g.closed;
    const np = 9;
    for (let i = 0; i < np; i++) {
      // (petals lost to the pop: one gap where it flew off, grown back by the next)
      if (i === 2 && g.lost > 0.5) continue;
      ctx.save();
      ctx.rotate((i / np) * TAU);
      const pl = mix(1.3, 2.5, open);
      ell(ctx, 0, -pl * 0.62 - 0.4 * open, mix(0.5, 0.62, open), pl * 0.55);
      paint(ctx, a, K, mode, i % 2 ? PL.petal : PL.petalSh, 1.1);
      ctx.restore();
    }
    if (mode !== 'line') {
      const k = mix(0.7, 1, open);
      ctx.fillStyle = K.tone(a, PL.heart);
      ell(ctx, 0, 0, 1.05 * k, 1.05 * k);
      ctx.fill();
      ctx.fillStyle = K.tone(a, '#fff2b0');
      ell(ctx, -0.3, -0.3, 0.45, 0.4);
      ctx.fill();
    }
    ctx.restore();
    // (where its heart is in the rig's own space, for the pollen and the sunlight)
    const lx = bx + head[0] * gs;
    const ly = by + head[1] * gs;
    const c = Math.cos(sk.roll);
    const sn = Math.sin(sk.roll);
    g.daisyAt = [sk.pivot[0] + lx * c - ly * sn, sk.pivot[1] + lx * sn + ly * c];
  }
  ctx.restore();
}
// (the daisy's heart, where the garden last drew it)
const daisyPt = (ctx, a) => a.ri?.daisyAt ?? null;

// ---------- its face ----------
// Its eyes: big glossy plum domes on the stalk caps, a four-point star glint and a round one, the
// cap's own skin for lids. f: calm, blink, happy, focus, hurt, sad, worried, wide, sleep, dead.
function eyes(ctx, a, K) {
  const sk = a.bk;
  const f = a.ri?.face ?? 'calm';
  const cap = K.sc(K.P.eyes.cap);
  const fold = sk.eyeFold ?? 0;
  sk.eyes.forEach((e, i) => {
    const [x, y] = e.tip;
    ctx.save();
    ctx.translate(x, y);
    const s = cap / 3;
    ctx.scale(s, s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PL.eye;
    if (f === 'dead') {
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let k = 0; k <= 22; k++) {
        const an = k * 0.6 * (i ? -1 : 1);
        const r = 0.2 + k * 0.09;
        if (k) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
        else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
      }
      ctx.stroke();
    } else if (f === 'hurt') {
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      const d = i ? -1 : 1;
      ctx.moveTo(-1.6 * d, -1.2);
      ctx.lineTo(1.4 * d, 0);
      ctx.lineTo(-1.6 * d, 1.2);
      ctx.stroke();
    } else if (f === 'happy') {
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-1.8, 0.7);
      ctx.quadraticCurveTo(0, -1.6, 1.8, 0.7);
      ctx.stroke();
    } else if (f === 'sleep' || f === 'blink' || fold > 0.6) {
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.moveTo(-1.8, 0);
      ctx.quadraticCurveTo(0, 1.3, 1.8, 0);
      ctx.stroke();
    } else {
      const r = f === 'wide' ? 2.5 : 2.25;
      const gx = a.ri?.gaze ?? 0;
      ctx.fillStyle = K.tone(a, PL.eye);
      ell(ctx, 0.2, 0.1, r, r * 1.08);
      ctx.fill();
      ctx.fillStyle = K.tone(a, PL.eyeLt);
      ell(ctx, 0.3 + gx * 0.4, 0.9, r * 0.62, r * 0.42);
      ctx.fill();
      sparkle(ctx, -0.5 + gx * 0.3, -0.8, f === 'wide' ? 1.3 : 1.05, '#ffffff');
      ctx.fillStyle = '#ffffff';
      ell(ctx, 0.95 + gx * 0.3, 0.85, 0.36, 0.34);
      ctx.fill();
      // the lid: the cap's skin, a touch down at rest; focused, hard and slanting in toward the
      // middle; sad or worried, slanting the other way
      const lid = { focus: 0.95, sad: 0.7, worried: 0.55, wide: 0 }[f] ?? 0.2;
      const sl = f === 'focus' ? (i === 0 ? -0.9 : 0.9) : f === 'sad' || f === 'worried' ? (i === 0 ? 0.8 : -0.8) : 0;
      if (lid > 0) {
        ctx.save();
        ell(ctx, 0.2, 0.1, r * 1.04, r * 1.12);
        ctx.clip();
        const edge = -r * 1.1 + lid * r * 1.05;
        ctx.beginPath();
        ctx.moveTo(-r * 1.3, -r * 1.4);
        ctx.lineTo(r * 1.3, -r * 1.4);
        ctx.lineTo(r * 1.3, edge + sl);
        ctx.quadraticCurveTo(0, edge + 0.4, -r * 1.3, edge - sl);
        ctx.closePath();
        ctx.fillStyle = K.tone(a, PL.C.lt);
        ctx.fill();
        ctx.strokeStyle = PL.ink;
        ctx.lineWidth = 0.45;
        ctx.beginPath();
        ctx.moveTo(r * 1.3, edge + sl);
        ctx.quadraticCurveTo(0, edge + 0.4, -r * 1.3, edge - sl);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  });
}
// Its mouth: a small 'w' under the rim, a round 'o' open, a wobble when it's sad or hurt; peachy
// cheeks on the rim.
function mouth(ctx, a, sk, K) {
  const [mx, my] = sk.mouth;
  const s = K.sc(1);
  const f = a.ri?.face ?? 'calm';
  ctx.save();
  ctx.translate(mx, my);
  ctx.rotate(sk.roll);
  ctx.fillStyle = PL.blush;
  ctx.globalAlpha = f === 'happy' || f === 'wide' ? 0.75 : 0.5;
  ell(ctx, -3.6 * s, -1.1 * s, 1.6 * s, 0.9 * s);
  ctx.fill();
  ell(ctx, 3.4 * s, -1.1 * s, 1.6 * s, 0.9 * s);
  ctx.fill();
  ctx.globalAlpha = 1;
  const op = sk.mouthOpen;
  ctx.strokeStyle = K.tone(a, PL.C.mouth);
  ctx.lineWidth = 0.45 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (op > 0.15) {
    ctx.fillStyle = K.tone(a, '#9a4a4a');
    ell(ctx, 0, 0.5 * s, 1.1 * s, (0.4 + 1.1 * op) * s);
    ctx.fill();
    ctx.fillStyle = K.tone(a, '#f08a8a');
    ell(ctx, 0, (0.7 + 0.6 * op) * s, 0.7 * s, 0.4 * op * s);
    ctx.fill();
  } else if (f === 'sad' || f === 'hurt' || f === 'worried' || f === 'dead') {
    ctx.beginPath();
    ctx.moveTo(-1.5 * s, 0.4 * s);
    ctx.quadraticCurveTo(-0.75 * s, -0.3 * s, 0, 0.2 * s);
    ctx.quadraticCurveTo(0.75 * s, -0.3 * s, 1.5 * s, 0.4 * s);
    ctx.stroke();
  } else if (f === 'focus') {
    ctx.beginPath();
    ctx.moveTo(-1.2 * s, 0.1 * s);
    ctx.lineTo(1.2 * s, 0.1 * s);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-1.5 * s, -0.1 * s);
    ctx.quadraticCurveTo(-0.75 * s, 0.8 * s, 0, 0);
    ctx.quadraticCurveTo(0.75 * s, 0.8 * s, 1.5 * s, -0.1 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- its moves (the crab base's form; x, hop in body heights; angles in degrees) ----------
// Each wound up over the fight's own wind-up (0.35 s), the blow on its release.
// Snip: the lead claw drawn back wide open and up, a sideways lunge, and it snaps shut.
const SNIP = {
  anticT: 0.35,
  keys: [
    [0, { x: -0.06, crouch: 0.3, tilt: -6, lR: -0.35, lU: 0.5, lO: 1, lA: -44, tU: 0, eyeL: 0.3, mouth: 0 }],
    [0.05, { x: 0.1, crouch: 0.05, tilt: 6, lR: 1.25, lU: 0.05, lO: 0.95, lA: -6 }, 'out'],
    [0.09, { x: 0.11, crouch: 0.05, tilt: 7, lR: 1.3, lU: 0.05, lO: 0, lA: 2 }, 'out'],
    [0.24, { x: 0.08, tilt: 3, lR: 1.05, lU: 0.05, lO: 0.05, lA: 0 }],
    [0.5, { x: 0.03, tilt: 1, lR: 0.35, lO: 0.25 }],
    [0.78, {}],
  ],
  spark: [0.09],
  sparkAt: 'lead',
};
// Prune Prune: both claws up and open, then one snip and the other, like garden shears.
const PRUNE = {
  anticT: 0.35,
  keys: [
    [0, { crouch: 0.3, tilt: -4, lR: -0.2, tR: -0.2, lU: 0.45, tU: 0.45, lO: 1, tO: 1, lA: -34, tA: -38 }],
    [0.06, { x: 0.06, tilt: 4, lR: 1.05, lU: 0.1, lO: 0, lA: -4, tR: 0.1, tU: 0.4, tO: 1, tA: -38 }, 'out'],
    [0.18, { x: 0.05, tilt: 1, lR: 0.45, lU: 0.35, lO: 0.8, lA: -20, tR: 0.9, tU: 0.2, tO: 1, tA: -10 }, 'io'],
    [0.24, { x: 0.09, tilt: 5, lR: 0.4, lU: 0.35, lO: 0.8, tR: 1.1, tU: 0.1, tO: 0, tA: -2 }, 'out'],
    [0.44, { x: 0.05, tilt: 1, lR: 0.35, tR: 0.55, lO: 0.25, tO: 0.2, lU: 0.15, tU: 0.1 }],
    [0.76, {}],
  ],
  spark: [0.06, 0.24],
  sparkAt: ['lead', 'trail'],
};

// ---------- the burrow (world/dungeon.js: dig 0.45 s, under to the spot, a warning, pop 0.7 s) ----------
const DIG = 0.45;
const POP = 0.7;
// How far it's sunk (0 up .. 1 only its garden showing), and its burrow's own moment.
function burrowOf(m, a) {
  const mv = m.move?.kind === 'burrow' ? m.move : null;
  if (!mv || m.hp <= 0) return null;
  if (mv.phase === 'dig') return { phase: 'dig', u: clamp((mv.t ?? 0) / DIG, 0, 1), sink: sstep((mv.t ?? 0) / DIG) };
  if (mv.phase === 'under') return { phase: 'under', u: 0, sink: 1, moving: m.state === 'walk', waiting: m.state !== 'walk' };
  const u = clamp(((a.now ?? 0) - (mv.popAt ?? a.now ?? 0)) / POP, 0, 1);
  return { phase: 'pop', u, sink: 1 - sstep(u / 0.22) };
}

// ---------- the dress ----------
// (the claws held low and out to the sides, the hands pointing ahead, so its face stays clear)
const CLAWS = {
  lead: { root: [9.6, -0.8, 5.2], rest: [13.2, -0.6, 7.4], arm: [3.4, 3.2], w: [4.2, 3.6, 3.9], hand: [8.4, 6.4], ang: -26 },
  trail: { root: [-9.6, -0.8, 5.2], rest: [-14.6, -0.8, 7.6], arm: [3.4, 3.2], w: [4.2, 3.6, 3.9], hand: [8.4, 6.4], ang: -34 },
  reach: [7, 1.5],
  up: [0, 6, -1.2],
};
const look = {
  C: PL.C,
  CC: PL.CC,
  ink: PL.ink,
  seam: PL.seam,
  P: {
    eyes: { x: 3, z: 0.62, len: 3.4, w: 2.4, cap: 2.9, splay: 18 },
    claws: CLAWS,
    // (a longer sideways step than the base's: a brisk scuttle with its feet planted, about two
    // steps a second each foot at its roaming pace)
    gait: { half: 3.2, lift: 2.8, duty: 0.56 },
    moves: ['snip', 'prune'],
  },
  moves: { snip: SNIP, prune: PRUNE },
  mouth,
  over: {
    body: garden,
    eyes(ctx, a, mode, K) {
      if (mode !== 'line') eyes(ctx, a, K);
    },
  },
  // Its act on the base's channels (x, lift, hop, crouch, tilt, flip, turn, lR/lU/lO/lA, tR/tU/tO/tA,
  // eyeF, eyeL, fold, tuckL, wave, mouth), its face and its garden (a.ri).
  pose(m, a, out, K, mv) {
    const g = { face: 'calm', daisy: Math.sin((a.t ?? 0) * 0.4) * 0.12 - 0.12, closed: 0, droop: 0, upside: 0, lost: 0, gaze: 0, snip: -1, sneeze: -1, pollen: 0, pat: -1, bubble: -1, proud: 0, clack: [], burrow: null, daisyAt: a.ri?.daisyAt };
    a.ri = g;
    const mood = m.cine?.mood ?? a.mood;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const low = m.hp > 0 && m.hp < m.def.hp * 0.25;
    const blink = ((a.t ?? 0) + (m.uid % 5) * 0.7) % 3.9 < 0.12;
    // its face, from the moment
    if (m.hp <= 0) g.face = 'dead';
    else if ((a.hurtAgo ?? 9) < 0.45 || mv === K.moves.hurt || mv === K.moves.knockdown) g.face = 'hurt';
    else if (napping || mood === 'sleep') g.face = 'sleep';
    else if (mv === K.moves.dance || mood === 'happy') g.face = 'happy';
    else if (mv || a.ph?.antic > 0 || a.face === 'angry' || mood === 'angry') g.face = 'focus';
    else if (mood === 'sad') g.face = 'sad';
    else if (low) g.face = 'worried';
    else if (blink || mood === 'blink') g.face = 'blink';
    if (low) g.droop = 0.55;
    if (napping || mood === 'sleep') g.closed = 1;
    if (mood === 'talk' && m.hp > 0) out.mouth += Math.max(0, Math.sin((a.t ?? 0) * 13)) * 0.5;
    // The burrow: dug in backwards (rolled back, rear first, claws up digging the soil out to the
    // sides); under, only the garden; trembling at the spot; popping up claws high.
    const b = burrowOf(m, a);
    g.burrow = b;
    if (b) {
      if (b.phase === 'dig') {
        Object.assign(out, { tilt: -16 * Math.sin(Math.PI * Math.min(1, b.u * 1.4)), crouch: 1, lU: 0.7, tU: 0.7, lO: 0.5 + 0.5 * Math.sin(b.u * 30), tO: 0.5 + 0.5 * Math.sin(b.u * 30 + 1.5), lA: -60, tA: -60, lR: -0.2, tR: -0.2, eyeF: 0.4 * b.u, fold: 0.3 });
        out.x += -0.12 * sstep(b.u);
        g.face = 'focus';
      } else if (b.phase === 'under') {
        Object.assign(out, { crouch: 1, fold: 1, eyeF: 1, lU: -0.3, tU: -0.3, lO: 0, tO: 0, tilt: b.waiting ? Math.sin((a.t ?? 0) * 40) * 2.5 : 0 });
        g.daisy = b.moving ? 0.28 : Math.sin((a.t ?? 0) * 26) * 0.18;
        g.face = 'sleep';
      } else {
        const up = pulse(b.u, 0.02, 0.5);
        Object.assign(out, { crouch: -0.2 * up, lU: 1.4, tU: 1.4, lO: 1, tO: 1, lA: -100, tA: -86, lR: 0.1, tR: 0.2, mouth: 0.8 * (1 - b.u), eyeF: 0 });
        out.hop += up * 0.55;
        g.daisy = -0.5 * (1 - b.u);
        g.lost = b.u > 0.15 ? 1 : 0;
        g.face = b.u < 0.7 ? 'wide' : 'happy';
      }
      a.sink = b.sink * K.sc(15.5);
      return;
    }
    a.sink = 0;
    if (m.hp <= 0 || napping || mv || m.pose || m.cine) return;
    // (its act only while it stands about: never while it walks, fights or is posed)
    const calm = clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1), 0, 1);
    if (calm < 0.02) return;
    const lu = ((((a.t ?? 0) + (m.uid % 7) * 4.3) % 30) + 30) % 30;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) g.face = f;
    };
    // 1. trimming the garden: up on its toes, the back claw reaching up over its shell to the fern,
    //    two snips; a clipped frond flutters down; its eyes turned up to watch; pleased
    const trim = win(lu, 0.5, 1.1, 3.6, 4.2) * calm;
    go({ tilt: -5, crouch: -0.1, tR: -0.1, tU: 1.25, tO: 0.7, tA: -95, lU: 0.05, eyeL: -0.8 }, trim);
    const snips = (pulse(lu, 1.6, 0.35) + pulse(lu, 2.3, 0.35)) * calm;
    out.tO -= snips * 0.7;
    g.gaze = Math.min(g.gaze, -trim);
    say('happy', trim * (lu >= 2.7 ? 1 : 0));
    g.snip = lu >= 2.3 && lu < 4.3 ? (lu - 2.3) / 2 : -1;
    // 2. the daisy turned to the light: its stalks follow it up, a sigh, content
    const sun = win(lu, 5, 5.8, 8.2, 9) * calm;
    g.daisy = mix(g.daisy, -0.55, sun);
    go({ eyeL: -0.9, tilt: -3, lift: 0.4 }, sun);
    say('happy', sun * (lu > 6.2 ? 1 : 0));
    g.gaze = -sun;
    // 3. a pollen sneeze: its eyes turned back to the daisy, a tickle, "a-a-", ACHOO (a jolt, a puff
    //    of pollen), a sniffle
    const sniff = win(lu, 10, 10.4, 11.4, 11.6) * calm;
    go({ eyeL: -1.2, tilt: -4, crouch: 0.1 }, sniff);
    g.pollen = sniff;
    const ah = win(lu, 11.4, 11.8, 12.2, 12.25) * calm;
    go({ tilt: -9, lift: 0.8, mouth: 0.5, lU: 0.4, tU: 0.4 }, ah);
    say('wide', Math.max(sniff * 0.5, ah));
    const choo = win(lu, 12.2, 12.26, 12.4, 12.9) * calm;
    go({ tilt: 12, crouch: 0.4, mouth: 1, lU: -0.2, tU: -0.2, lO: 0.9, tO: 0.9 }, choo);
    say('hurt', choo);
    g.sneeze = lu >= 12.2 && lu < 13.2 ? lu - 12.2 : -1;
    const sniffle = win(lu, 12.9, 13.1, 13.6, 13.9) * calm;
    out.tilt += sniffle * Math.sin(lu * 20) * 2;
    say('happy', sniffle);
    // 4. a claw-clack dance: both claws high, clacking, rocking from side to side
    const dance = win(lu, 14.5, 14.8, 17.6, 18) * calm;
    const ph = (lu - 14.8) * 2.5 * Math.PI;
    go({ lU: 1.2, tU: 1.2, lA: -92, tA: -80, lR: 0.1, tR: 0.2, crouch: 0.15 }, dance);
    out.x += dance * Math.sin(ph) * 0.05;
    out.tilt += dance * Math.sin(ph) * 5;
    out.lift += dance * Math.abs(Math.sin(ph)) * 1.2;
    out.lO = mix(out.lO, 0.5 + 0.5 * Math.cos(ph * 2), dance);
    out.tO = mix(out.tO, 0.5 + 0.5 * Math.cos(ph * 2 + 0.6), dance);
    say('happy', dance);
    if (dance > 0.5) for (let i = 0; i < 4; i++) {
      const t0 = 14.8 + (i + 0.5) / 1.25;
      if (lu >= t0 && lu < t0 + 0.3) g.clack.push((lu - t0) / 0.3);
    }
    // 5. patting the moss flat: the trail claw up over its back, three pats, a little puff of moss
    const pat = win(lu, 19, 19.5, 21.6, 22) * calm;
    go({ tR: 0.15, tU: 1.1, tA: -70, tO: 0.1, tilt: -3, eyeL: -0.5 }, pat);
    const pats = (pulse(lu, 19.7, 0.3) + pulse(lu, 20.3, 0.3) + pulse(lu, 20.9, 0.3)) * calm;
    out.tU -= pats * 0.3;
    for (const t0 of [19.85, 20.45, 21.05]) if (lu >= t0 && lu < t0 + 0.5) g.pat = (lu - t0) / 0.5;
    say('happy', pat);
    // 6. watering the garden: it blows one big bubble, watches it float up over its back and pop,
    //    sprinkling the daisy
    const blow = win(lu, 23, 23.4, 24, 24.3) * calm;
    go({ mouth: 0.55, crouch: 0.15, tilt: 2 }, blow);
    const watch = win(lu, 24, 24.4, 25.6, 26) * calm;
    go({ eyeL: -1, tilt: -4 }, watch);
    g.bubble = lu >= 23.3 && lu < 26.2 ? (lu - 23.3) / 2.9 : -1;
    say('blink', blow * (lu > 23.4 && lu < 23.9 ? 1 : 0));
    say('happy', watch * (lu > 25.3 ? 1 : 0));
    // 7. a proud look at the finished bed: claws out to the sides, puffed up, a twinkle on the daisy
    const proud = win(lu, 26.8, 27.3, 29, 29.6) * calm;
    go({ lU: 0.35, tU: 0.35, lR: 0.3, tR: 0.3, lA: -50, tA: -60, lift: 0.8, tilt: -2 }, proud);
    say('happy', proud);
    g.proud = proud;
    if (g.face === 'calm' && blink) g.face = 'blink';
  },
  // Beaten: flipped over onto its back, its legs waving, then still, its garden drooped; asleep, its
  // daisy closed (the base folds it down and blows its slow bubble).
  after(m, a, out, K) {
    const st = a.mo.rig;
    const g = a.ri;
    if (m.hp > 0) {
      st.riDead = null;
      return;
    }
    st.riDead ??= a.now ?? 0;
    const k = (a.now ?? 0) - st.riDead;
    // (a fallen monster stays half a second: over by 0.2 s, legs waving, still by the poof)
    const over = sstep(k / 0.2);
    Object.assign(out, { flip: over, crouch: 0.4, fold: 0, tuckL: 0, wave: over * (1 - sstep((k - 0.26) / 0.12)), lU: 0.4, tU: 0.4, lO: 0.5, tO: 0.5, eyeF: 1, mouth: 0.3, hide: 0 });
    out.hop += pulse(k, 0, 0.2) * 0.2;
    if (g) {
      g.droop = 1;
      g.closed = 0.5;
      g.upside = over;
    }
  },
  fx(ctx, m, a, K) {
    const sk = a.bk;
    const g = a.ri;
    if (!sk || !g) return;
    const s = K.sc(1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const dz = daisyPt(ctx, a);
    // a snipped clover leaf fluttering down from its claw, a twinkle
    if (g.snip >= 0) {
      const u = g.snip;
      const [x0, y0] = sk.spots.trail;
      const x = x0 - s * 2 - Math.sin(u * 7) * s * 1.6;
      const y = y0 + s * 2 + u * s * 14;
      ctx.globalAlpha = 1 - sstep((u - 0.7) / 0.3);
      ctx.fillStyle = PL.moss[1];
      ctx.strokeStyle = PL.ink;
      ctx.lineWidth = 0.35;
      ell(ctx, x, y, s * 1, s * 0.7, u * 6);
      ctx.stroke();
      ctx.fill();
      ctx.globalAlpha = 1;
      sparkle(ctx, x0 + s * 2.5, y0 - s * 2.5, s * 1.1 * (1 - u), '#ffffff', 1 - u);
    }
    // sunlight on the daisy as it turns to the light
    if (dz && g.daisy < -0.3 && !g.burrow) {
      const k = clamp((-g.daisy - 0.3) / 0.25, 0, 1);
      sparkle(ctx, dz[0] + s * 2.2, dz[1] - s * 2.4, s * (0.9 + 0.3 * Math.sin((a.t ?? 0) * 5)), '#fff6c8', k);
    }
    // pollen: motes drifting from the daisy to its eyes; the sneeze a burst of them
    if (dz && g.pollen > 0.05) {
      for (let i = 0; i < 3; i++) {
        const u = (((a.t ?? 0) * 0.6 + i / 3) % 1);
        const e = sk.eyes[0].tip;
        ctx.globalAlpha = g.pollen * Math.sin(Math.PI * u) * 0.9;
        ctx.fillStyle = PL.pollen;
        ell(ctx, mix(dz[0], e[0], u) + Math.sin(u * 9 + i) * s, mix(dz[1], e[1], u) - Math.sin(Math.PI * u) * s * 2, s * 0.45, s * 0.45);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (g.sneeze >= 0) {
      const u = g.sneeze;
      const [mx, my] = sk.spots.mouth;
      const e = 1 - (1 - u) ** 2;
      for (let i = 0; i < 6; i++) {
        const q = -0.9 + i * 0.36;
        const d = s * (2 + e * 7) * (0.7 + 0.3 * hash(i));
        ctx.globalAlpha = (1 - u) * 0.9;
        ctx.fillStyle = i % 2 ? PL.pollen : '#fff6d8';
        ell(ctx, mx + Math.cos(q) * d + s * 2, my + Math.sin(q) * d * 0.6 - e * s * 2, s * (0.6 + 0.5 * e), s * (0.6 + 0.5 * e));
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      sparkle(ctx, mx + s * (5 + e * 4), my - s * (2 + e * 3), s * 1.1, '#ffffff', 1 - u);
    }
    // the dance's clacks: two small sparkles at the claw tips
    for (const u of g.clack) {
      for (const k of ['lead', 'trail']) {
        const [x, y] = sk.spots[k];
        sparkle(ctx, x, y - s * 1.5, s * (0.8 + u), u < 0.5 ? '#ffffff' : '#fff2a8', 1 - u);
      }
    }
    // a pat: a soft puff of moss dust off the cushion
    if (g.pat >= 0) {
      const [x, y] = sk.spots.trail;
      const u = g.pat;
      for (const d of [-1, 1]) {
        ctx.globalAlpha = (1 - u) * 0.7;
        ctx.fillStyle = PL.moss[0];
        ell(ctx, x + d * s * (1.5 + u * 3), y + s * (1 - u * 2), s * (0.7 + u * 0.6), s * (0.6 + u * 0.5));
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // watering: a big glossy bubble from its mouth, floating up over its back; popping over the
    // daisy into a sprinkle of droplets
    if (g.bubble >= 0 && dz) {
      const u = g.bubble;
      const [mx, my] = sk.spots.mouth;
      const k = clamp(u / 0.18, 0, 1);
      const fl = sstep((u - 0.18) / 0.62);
      const bx = mix(mx + s * 2, dz[0], fl) + Math.sin(u * 9) * s * 0.8 * fl;
      const by = mix(my - s * 1.5, dz[1] - s * 7, fl);
      if (u < 0.82) {
        const r = s * (0.8 + 1.6 * k);
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = '#bfe4ff';
        ctx.lineWidth = 0.5;
        ell(ctx, bx, by, r, r);
        ctx.fillStyle = 'rgba(220,240,255,0.35)';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ell(ctx, bx - r * 0.35, by - r * 0.35, r * 0.25, r * 0.2);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        const v = (u - 0.82) / 0.18;
        for (let i = 0; i < 5; i++) {
          const q = (i / 5) * TAU;
          ctx.globalAlpha = 1 - v;
          ctx.fillStyle = '#9fd4ff';
          ell(ctx, bx + Math.cos(q) * s * (1 + v * 2), by + Math.sin(q) * s * (1 + v * 2) + v * v * s * 5, s * 0.4, s * 0.55);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        sparkle(ctx, bx, by, s * 1.4 * (1 - v), '#ffffff', 1 - v);
      }
    }
    // proud: a twinkle on the daisy
    if (g.proud > 0.4 && dz) sparkle(ctx, dz[0] - s * 2.4, dz[1] - s * 2.6, s * 1.2 * g.proud, '#ffffff', g.proud);
    // popping up: a daisy petal flung off, spinning down
    if (g.burrow?.phase === 'pop' && dz) {
      const u = g.burrow.u;
      const x = dz[0] + s * (2 + u * 9);
      const y = dz[1] - s * (5 * Math.sin(Math.PI * Math.min(1, u * 1.3))) + u * u * s * 6;
      ctx.globalAlpha = 1 - sstep((u - 0.75) / 0.25);
      ctx.fillStyle = PL.petal;
      ctx.strokeStyle = PL.ink;
      ctx.lineWidth = 0.4;
      ell(ctx, x, y, s * 0.7, s * 1.4, u * 9);
      ctx.stroke();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  },
};

const ROOT = dressedCrab(look);
const base = ROOT.art.rig;
// The soil over its burrow, in its own space (mirrored with it facing left): a mound over it as it
// digs and while it's under, clods thrown out to both sides, a furrow running back behind it as it
// goes, crumbs trembling at the spot, the hole bursting open as it pops up.
function clod(ctx, x, y, r, spin, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const an = spin + (i / 7) * TAU;
    const rr = r * (0.82 + 0.18 * hash(i * 3.1 + spin * 7));
    if (i) ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.86);
    else ctx.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.86);
  }
  ctx.closePath();
  ctx.strokeStyle = SOIL.ink;
  ctx.lineWidth = Math.max(0.35, r * 0.32);
  ctx.stroke();
  ctx.fillStyle = SOIL.base;
  ctx.fill();
  ctx.fillStyle = SOIL.lt;
  ell(ctx, x - r * 0.2, y - r * 0.28, r * 0.5, r * 0.32);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function mound(ctx, x, w, h, seed, al) {
  if (al <= 0.01 || h <= 0.05) return;
  ctx.globalAlpha = al;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, 0.6);
  ctx.bezierCurveTo(x - w * 0.36, -h * 0.9, x - w * 0.16, -h * 1.02, x, -h);
  ctx.bezierCurveTo(x + w * 0.18, -h * 1.02, x + w * 0.38, -h * 0.86, x + w / 2, 0.6);
  ctx.closePath();
  ctx.strokeStyle = SOIL.ink;
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = SOIL.base;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = SOIL.lt;
  ell(ctx, x - w * 0.1, -h * 0.7, w * 0.3, h * 0.36);
  ctx.fill();
  ctx.fillStyle = SOIL.sh;
  for (let i = 0; i < 4; i++) {
    ell(ctx, x - w * 0.36 + hash(seed + i) * w * 0.72, -h * (0.15 + 0.6 * hash(seed * 3 + i)), 0.55, 0.42);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
function soil(ctx, m, a, b) {
  const al = a.alpha ?? 1;
  ctx.save();
  if (a.flip) ctx.scale(-1, 1);
  ctx.lineJoin = 'round';
  if (b.phase === 'dig') {
    const u = b.u;
    mound(ctx, 0, 22 * sstep(u * 1.6), 2.8 * sstep(u * 1.6), 6, al);
    // clods thrown out to both sides as it scrabbles in
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const v = (u * 2.2 + i * 0.17) % 1;
      const d = 10 + v * 10;
      clod(ctx, side * d, -2 - Math.sin(Math.PI * v) * (6 + (i % 3) * 2), 1.2 - (i % 3) * 0.15, i + v * 4, al * (1 - v * 0.6));
    }
  } else if (b.phase === 'under') {
    // the furrow behind it (and the mound it pushes along under its garden)
    for (let i = 1; i < 5; i++) mound(ctx, -8 - i * 6.5, 7 - i * 0.6, 2.4 - i * 0.4, i * 4, al * (b.moving ? 1 - i * 0.15 : 0.6 - i * 0.12));
    mound(ctx, 0, 22, 2.6, 6, al);
    const t = a.t ?? 0;
    if (b.moving) {
      for (let k = 0; k < 3; k++) {
        const v = (t * 2.6 + k / 3) % 1;
        clod(ctx, -12 - v * 10, -2 - Math.sin(v * Math.PI) * 6, 0.9, k + t, al * (1 - v));
      }
    } else {
      // trembling at the spot, crumbs jumping on the mound: it's about to come up
      for (let k = 0; k < 4; k++) {
        const v = (t * 3.4 + k / 4) % 1;
        clod(ctx, (k - 1.5) * 5, -2.6 - Math.sin(v * Math.PI) * 3.5, 0.75, k, al * Math.sin(v * Math.PI));
      }
    }
  } else {
    const u = b.u;
    // the hole bursting open: soil heaped either side, clods thrown out round it
    const open = 1 - sstep((u - 0.6) / 0.4);
    mound(ctx, -12, 10, 3.4 * open, 3, al);
    mound(ctx, 12, 10, 3.4 * open, 5, al);
    for (let i = 0; i < 7; i++) {
      const an = (-165 + i * 25) * D2R;
      const d = 8 + u * 16;
      clod(ctx, Math.cos(an) * d, -3 + Math.sin(an) * d * 0.7 + u * u * 14, 1.2, i + u * 5, al * (1 - sstep((u - 0.55) / 0.45)));
    }
  }
  ctx.restore();
}
// Its rig: the crab, clipped at the floor while it's down in its burrow, the soil over it.
const rig = {
  w: Math.round(ROOT.w * 1.05),
  h: base.h,
  draw(ctx, m, a) {
    const b = m.hp > 0 && !(m.air > 0) ? burrowOf(m, a) : null;
    if (!b || b.sink < 0.01) {
      base.draw(ctx, m, a);
      if (b) soil(ctx, m, a, b);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(-200, -200, 400, 199.7);
    ctx.clip();
    base.draw(ctx, m, a);
    ctx.restore();
    soil(ctx, m, a, b);
  },
};

// Its art entry, size (its body and garden as drawn) and roaming pace.
export const ROOTIMP = { art: { ...ROOT.art, rig, noHop: true }, w: ROOT.w, h: Math.round(ROOT.h * 1.45), speed: ROOT.speed };
