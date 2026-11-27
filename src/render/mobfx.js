// The shared monster and boss effects (2026-11-27, the soft pass): every generic telegraph, landing
// and puff the engine draws for a monster or a boss, in the same soft style as the remade monsters
// (render/<id>/): rounded shapes outlined in a deeper shade of their own colour (never near-black
// ink), curvy four-point sparkles instead of specks, a few soft clouds instead of swarms, and every
// change eased with a little bounce (slightly underdamped: a small overshoot, then settled).
// Telegraphs still read at a glance: a clear edge, and a fill that grows to it by the moment of the
// hit. Nothing here changes what a zone covers: each mark is drawn exactly over its area.
// Used by render/dungeon.js (drawZone, drawZoneHit), render/effects.js (field monsters' slam),
// render/scene.js (the run's thrown shots and bumps), render/trial.js (the queens' marks),
// render/particles.js (getting hit, defeat poofs) and render/monsters.js (the vanishing puff).
// Phases come from a thing's own world place or id (`seed`), never from where it is on screen, and
// nothing reads the clock or Math.random while drawing.

import { deep, inked } from './fxkit.js';

const TAU = Math.PI * 2;
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const sstep = (u) => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};
export const easeOut = (u) => 1 - (1 - clamp01(u)) ** 3;
// Slightly underdamped: rises, passes 1 by about 6%, and settles on it (0 -> 1).
export const springy = (u) => {
  const v = clamp01(u);
  return v >= 1 ? 1 : 1 - Math.exp(-7 * v) * Math.cos(8 * v);
};
// A pop: springs open over `open` of its life, holds, then eases away over the last `close`.
export const pop = (u, open = 0.3, close = 0.6) => springy(u / open) * (1 - sstep((u - (1 - close)) / close));

// The danger marks' colours: a soft coral rose, edged in a deeper mauve of itself.
export const DANGER = { lt: '#fff2f6', fill: '#ffb8ca', mid: '#ff8fab', edge: '#f2708f', rim: '#b85a86' };

const clearCache = new Map();
// The colour at no alpha (for a glow's outer stop), cached so nothing is built per frame.
function clear(col) {
  let v = clearCache.get(col);
  if (!v) {
    const n = parseInt(col.slice(1), 16);
    v = `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},0)`;
    clearCache.set(col, v);
  }
  return v;
}

// A soft round glow (light and magic only).
export function glowDisc(ctx, x, y, r, col, al) {
  if (al <= 0.01 || r <= 0.5) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, clear(col));
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// The game's curvy four-point sparkle, outlined in a deeper shade of its colour, a white heart.
function starPath(ctx, x, y, r) {
  const k = r * 0.14;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + r, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - r, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.closePath();
}
export function sparkle(ctx, x, y, r, col, al = 1, rot = 0) {
  if (r <= 0.3 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  if (rot) {
    ctx.translate(x, y);
    ctx.rotate(rot);
    x = 0;
    y = 0;
  }
  if (r > 1.6 && inked(ctx)) {
    starPath(ctx, x, y, r + 0.6);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = deep(col);
    ctx.lineWidth = Math.max(0.9, r * 0.2);
    ctx.stroke();
  }
  starPath(ctx, x, y, r);
  ctx.fillStyle = col;
  ctx.fill();
  if (r > 2.4 && col !== '#ffffff') {
    starPath(ctx, x, y, r * 0.42);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}

// A soft cloud: four round lobes merged into one shape, outlined only round its outside in a
// deeper shade of its own colour, its light top over its shaded underside. (No holes, no bead
// rims: it goes by shrinking and fading.)
const LOBES = [[0, 0, 1], [-0.8, 0.22, 0.7], [0.82, 0.18, 0.74], [0.12, -0.55, 0.68]];
function lobes(ctx, x, y, r, grow) {
  ctx.beginPath();
  for (const [dx, dy, s] of LOBES) {
    const rr = s * r + grow;
    ctx.moveTo(x + dx * r + rr, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, rr, 0, TAU);
  }
}
export function cloud(ctx, x, y, r, light, shade, al = 1) {
  if (r <= 0.4 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  if (r > 2 && inked(ctx)) {
    lobes(ctx, x, y, r, Math.max(0.8, r * 0.12));
    ctx.fillStyle = deep(shade);
    ctx.fill();
  }
  lobes(ctx, x, y, r, 0);
  ctx.fillStyle = shade;
  ctx.fill();
  lobes(ctx, x - r * 0.1, y - r * 0.16, r * 0.82, 0);
  ctx.fillStyle = light;
  ctx.fill();
  ctx.restore();
}

// A soft ring on the floor (an ellipse stroke over a deeper rim of its own colour).
export function ring(ctx, x, y, rx, ry, w, col, al = 1) {
  if (w <= 0.15 || rx <= 0.4 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, Math.max(0.4, ry), 0, 0, TAU);
  if (w > 0.8 && inked(ctx)) {
    ctx.strokeStyle = deep(col);
    ctx.lineWidth = w + 1.4;
    ctx.stroke();
  }
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.restore();
}

// A rounded chevron pointing `dir` (1 right, -1 left, or an angle with `ang`), white over a rim.
export function chevron(ctx, x, y, s, dir, al = 1, col = '#ffffff', rim = DANGER.rim, ang = null) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang ?? (dir < 0 ? Math.PI : 0));
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, -s * 0.6);
  ctx.lineTo(s * 0.4, 0);
  ctx.lineTo(-s * 0.45, s * 0.6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (inked(ctx)) {
    ctx.strokeStyle = rim;
    ctx.lineWidth = s * 0.5 + 1.4;
    ctx.stroke();
  }
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.5;
  ctx.stroke();
  ctx.restore();
}

// A rounded "!" standing on (x, y).
export function bang(ctx, x, y, s, al = 1, col = '#ffffff', rim = DANGER.rim) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  const bar = () => {
    ctx.beginPath();
    ctx.moveTo(x, y - s * 1.5);
    ctx.lineTo(x, y - s * 0.55);
  };
  const dot = (r) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
  };
  if (inked(ctx)) {
    bar();
    ctx.strokeStyle = rim;
    ctx.lineWidth = s * 0.62 + 1.4;
    ctx.stroke();
    dot(s * 0.31 + 0.7);
    ctx.fillStyle = rim;
    ctx.fill();
  }
  bar();
  ctx.strokeStyle = col;
  ctx.lineWidth = s * 0.62;
  ctx.stroke();
  dot(s * 0.31);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}

// ---------- Telegraphs ----------
// How a mark breathes as its moment nears: from 72% of the way it brightens (eased in, never
// switched on) and throbs at one steady beat, phased by `seed`.
// (One shared answer, read at once by the caller, so nothing is built per frame.)
const READY = { r: 0, throb: 0 };
export function ready(p, time, seed) {
  READY.r = sstep((p - 0.72) / 0.28);
  READY.throb = READY.r * (0.5 + 0.5 * Math.sin(time * 9 + seed));
  return READY;
}

// A danger patch on the floor: an ellipse `rx` x `ry` at (x, y). Its soft tint, the fill growing
// out from the middle to the edge as `p` runs 0..1, a light lip on the fill's front, a clear edge
// over a deeper rim, and a fine white line just inside it so it reads on any floor.
export function floorMark(ctx, x, y, rx, ry, p, time, seed = 0, pal = DANGER, opts = null) {
  const born = springy(p / 0.12);
  const { r: rd, throb } = ready(p, time, seed);
  const f = clamp01(p);
  ctx.save();
  const shape = (a, b) => {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.3, a), Math.max(0.3, b), 0, 0, TAU);
  };
  ctx.globalAlpha = clamp01(born) * (0.16 + 0.1 * f + 0.12 * throb);
  ctx.fillStyle = pal.fill;
  shape(rx, ry);
  ctx.fill();
  if (f > 0.02) {
    ctx.globalAlpha = clamp01(born) * (0.3 + 0.24 * f + 0.1 * rd);
    ctx.fillStyle = pal.mid;
    shape(rx * f, ry * f);
    ctx.fill();
    ctx.globalAlpha = clamp01(born) * 0.6 * (1 - rd * 0.5);
    ctx.strokeStyle = pal.lt;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  const w = (1.5 + 0.8 * f + 0.6 * throb) * (0.6 + 0.4 * born);
  ctx.globalAlpha = clamp01(born) * (0.8 + 0.2 * f);
  shape(rx, ry);
  if (inked(ctx)) {
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = w + 1.5;
    ctx.stroke();
  }
  ctx.strokeStyle = pal.edge;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.globalAlpha = clamp01(born) * (0.45 + 0.3 * throb);
  shape(rx - w * 0.9 - 0.6, ry - w * 0.5 - 0.4);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
  // A couple of little sparkles rising inside it (none on a very small one).
  if (!opts?.bare && rx > 22) {
    const n = rx > 70 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const u = (time * 0.55 + k / n + seed * 0.013) % 1;
      const sx = x + ((k + 0.5) / n - 0.5) * rx * 1.2 + Math.sin(u * 5 + k) * 3;
      sparkle(ctx, sx, y - 2 - u * (8 + 10 * f), (1.6 + 1.4 * f) * Math.sin(u * Math.PI), k % 2 ? pal.lt : '#ffffff', clamp01(born) * (0.5 + 0.5 * f));
    }
  }
}

// A danger band on the floor: a rounded strip from x0, `w` wide and `h` tall, centred on y. The fill
// grows from `from` (-1 the left end, 1 the right end, 0 the middle out).
export function bandMark(ctx, x0, y, w, h, p, time, seed = 0, from = -1, pal = DANGER) {
  const born = clamp01(springy(p / 0.12));
  const { r: rd, throb } = ready(p, time, seed);
  const f = clamp01(p);
  const rr = Math.min(h / 2, 7);
  const shape = (a, b) => {
    ctx.beginPath();
    ctx.roundRect(a, y - h / 2, Math.max(0.5, b), h, Math.min(rr, b / 2));
  };
  ctx.save();
  ctx.globalAlpha = born * (0.16 + 0.1 * f + 0.12 * throb);
  ctx.fillStyle = pal.fill;
  shape(x0, w);
  ctx.fill();
  if (f > 0.02) {
    const fw = w * f;
    const fx = from < 0 ? x0 : from > 0 ? x0 + w - fw : x0 + (w - fw) / 2;
    ctx.globalAlpha = born * (0.3 + 0.24 * f + 0.1 * rd);
    ctx.fillStyle = pal.mid;
    shape(fx, fw);
    ctx.fill();
    ctx.globalAlpha = born * 0.6 * (1 - rd * 0.5);
    ctx.strokeStyle = pal.lt;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  const lw = (1.5 + 0.8 * f + 0.6 * throb) * (0.6 + 0.4 * born);
  ctx.globalAlpha = born * (0.8 + 0.2 * f);
  shape(x0, w);
  if (inked(ctx)) {
    ctx.strokeStyle = pal.rim;
    ctx.lineWidth = lw + 1.5;
    ctx.stroke();
  }
  ctx.strokeStyle = pal.edge;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.globalAlpha = born * (0.45 + 0.3 * throb);
  ctx.beginPath();
  ctx.roundRect(x0 + lw, y - h / 2 + lw * 0.8, Math.max(0.5, w - lw * 2), Math.max(0.5, h - lw * 1.6), Math.max(0.5, rr - lw));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
  return born;
}

// A field monster's slam warning (render/effects.js): the patch it will slam, and a soft white
// ring gathering in from the edge to land on the monster just as it comes down.
export function monsterWarn(ctx, x, y, r, q, time, seed) {
  floorMark(ctx, x, y, r, 12, q, time, seed);
  const k = 1 - q * q;
  ring(ctx, x, y, Math.max(6, r * k), Math.max(2, 12 * k), 1.2 + 2 * q, '#ffffff', 0.45 + 0.5 * sstep(q / 0.3));
}

// ---------- Landings ----------
// The burst where a marked blow lands (a marker, a raid, a donut, a band): a soft glow, one big
// sparkle springing open and closing, a ring rolling out to the mark's edge, and three little
// sparkles tossed up. `r` the reach, `col` the burst's colour.
export function hitBurst(ctx, x, y, r, u, col, seed = 0) {
  const e = easeOut(u);
  const fade = 1 - sstep((u - 0.45) / 0.55);
  glowDisc(ctx, x, y - 8, 16 + 22 * springy(u / 0.3), col, 0.55 * fade);
  sparkle(ctx, x, y - 10, 13 * pop(u, 0.22, 0.6), col, 1, 0.2 * springy(u / 0.3));
  ring(ctx, x, y, r * e, Math.max(2, Math.min(r * 0.26, 40) * e), 3.4 * (1 - u) + 0.4, col, fade);
  ring(ctx, x, y, r * e * 0.8, Math.max(1.5, Math.min(r * 0.2, 30) * e), 1.6 * (1 - u) + 0.3, '#ffffff', fade * 0.8);
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k - 1) * 0.7 + Math.sin(seed + k) * 0.15;
    const d = 10 + easeOut(u * 1.3) * (14 + Math.min(r, 80) * 0.3);
    sparkle(ctx, x + Math.cos(a) * d * 1.4, y - 10 + Math.sin(a) * d + u * u * 10, 3.2 * pop(u, 0.25, 0.55), k === 1 ? '#ffffff' : col);
  }
}

// A field monster's slam landing (render/effects.js 'slam'): a lavender ring rolling out to its
// reach along the floor, a white one inside it, and soft dust clouds bouncing up along it.
export function monsterSlam(ctx, x, y, range, p) {
  const e = easeOut(p);
  const fade = 1 - sstep((p - 0.4) / 0.6);
  ring(ctx, x, y, range * e, 14 * e, 6 * (1 - p) + 0.5, '#d9c8ff', fade);
  ring(ctx, x, y, range * e * 0.72, 10 * e, 2.6 * (1 - p) + 0.3, '#ffffff', fade);
  for (const s of [-1, 1]) {
    // (two a side, of different sizes, so they never read as a row of beads)
    for (let i = 0; i < 2; i++) {
      const d = range * (0.25 + 0.4 * i) * e;
      const k = pop(clamp01(p * 1.25 - i * 0.1), 0.3, 0.6);
      cloud(ctx, x + s * d, y - 3 - p * 6 - k * (2 + i * 2), (7.5 - i * 2.6) * k, '#fbf6ff', '#e2d6f4');
    }
  }
}

// ---------- Run bits (render/scene.js) ----------
// A monster's thrown shot with no look of its own: a soft lilac orb with a sparkle in it, a short
// soft tail behind.
export function shotOrb(ctx, x, y, p, d) {
  glowDisc(ctx, x, y, 9, '#e0c8ff', 0.5);
  for (let k = 2; k >= 1; k--) cloud(ctx, x - d * k * 4.5, y + Math.sin(p * 9 + k) * 0.8, 2.4 - k * 0.5, '#f4eaff', '#d6c0f4', 0.5);
  cloud(ctx, x, y, 3.8, '#f8f0ff', '#c9a8f0');
  sparkle(ctx, x - 0.6, y - 0.8, 2.2, '#ffffff', 0.9, p * 4);
}

// A charger crashing into a pillar or a wall: a soft burst of dizzy stars and a dust cloud.
export function crashBurst(ctx, x, y, p) {
  const fade = 1 - sstep((p - 0.4) / 0.6);
  glowDisc(ctx, x, y - 30, 30, '#fff3b8', 0.5 * fade);
  sparkle(ctx, x, y - 30, 16 * pop(p, 0.22, 0.6), '#ffe36b', 1, 0.3 * p);
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k - 1) * 0.9;
    const d = 12 + easeOut(p) * 24;
    sparkle(ctx, x + Math.cos(a) * d * 1.2, y - 30 + Math.sin(a) * d, 4 * pop(p, 0.25, 0.55), k === 1 ? '#ffffff' : '#ffd36b');
  }
  const k = pop(p, 0.3, 0.6);
  cloud(ctx, x - 9, y - 7 - p * 6, 8 * k, '#fbf3e8', '#e6d0b8');
  cloud(ctx, x + 10, y - 5 - p * 5, 6.5 * k, '#fbf3e8', '#e6d0b8');
}

// A party healer's heal over the group: a soft mint ring rolling out and a few rounded plus signs
// floating up.
function plus(ctx, x, y, s, al) {
  if (s <= 0.3 || al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s, y);
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s);
  if (inked(ctx)) {
    ctx.strokeStyle = '#4f9a6e';
    ctx.lineWidth = s * 0.8 + 1.4;
    ctx.stroke();
  }
  ctx.strokeStyle = '#b8f2c8';
  ctx.lineWidth = s * 0.8;
  ctx.stroke();
  ctx.restore();
}
export function healRing(ctx, x, y, p) {
  const e = easeOut(p);
  const fade = 1 - sstep((p - 0.35) / 0.65);
  ring(ctx, x, y - 4, 30 + e * 120, 6 + e * 18, 3 * (1 - p) + 0.6, '#8fe0a0', fade);
  glowDisc(ctx, x, y - 20, 26, '#c8f8d4', 0.4 * fade);
  for (let k = 0; k < 3; k++) {
    const u = clamp01(p * 1.3 - k * 0.12);
    plus(ctx, x + (k - 1) * 16, y - 26 - u * 22 - (k === 1 ? 6 : 0), 3.4 * pop(u, 0.3, 0.5), 1);
  }
}
