// The Axolotl Librarian's little effects kit (2026-11-26): a copy of Humphrey's copy
// (render/pumpkinbutler/fx.js); nothing changed. Its notes follow.
// Humphrey the Basset Butler (the Pumpkin Butler remade, 2026-11-26): a copy of Tuskar's little effects kit (render/tuskar/fx.js): the shared soft shapes
// (dust, sparkles, notes, steam, cues, springs) drawn live; Tuskar's own fight looks left out.
// Its notes follow.
// Tuskar's little effects (2026-11-26, the woolly mammoth calf, render/tuskar/index.js): real dust,
// rubble and root splinters, soft sparkles (never specks), dizzy stars, steam puffs, music notes and
// the spoken cues; and his fight's own looks: the Charge's lane and the Belly Flop's circle (TUSKAR_FX,
// handed out by render/dreamfx.js to render/bossfx.js) and the co-op Woolly Wall's wool clouds round
// him (woolPiece / woolBurst, render/coop.js). Every effect is a real thing in the room, never a UI
// ring.
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const mix = (a, b, u) => a + (b - a) * u;
export const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
export const hash = (i) => {
  const q = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return q - Math.floor(q);
};
export const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
export const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
export const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (a colour, whitened by a hit's flash)
export const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a?.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
export const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
// A smooth closed shape through points (each span a quadratic through the midpoints: no corners).
export function smooth(ctx, pts) {
  const n = pts.length;
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(...mid(n - 1));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...mid(i));
  ctx.closePath();
}
// An open smooth line through points.
export function sline(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(...pts[i], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  ctx.lineTo(...pts[pts.length - 1]);
}
export function pen(ctx, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
export function glow(ctx, x, y, r, col, al) {
  const [cr, cg, cb] = hexRgb(col);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// A soft four-point sparkle with a round heart (never a speck).
export function sparkle(ctx, x, y, s, al = 1, col = '#fff6c8') {
  if (al <= 0.01 || s <= 0) return;
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
// A five-point star with round tips (the dizzy ones), soft gold with a cream heart.
export function star(ctx, x, y, r, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
  }
  smooth(ctx, pts.map(([px, py], i) => (i % 2 ? [px, py] : [px * 1.06, py * 1.06])));
  pen(ctx, '#e0a43a', r * 0.22);
  ctx.stroke();
  ctx.fillStyle = '#ffd95a';
  ctx.fill();
  ell(ctx, -r * 0.12, -r * 0.14, r * 0.26, r * 0.2);
  ctx.fillStyle = '#fff6c8';
  ctx.fill();
  ctx.restore();
}
// Dizzy: little stars and sparkles wheeling round over the head.
export function dizzy(ctx, x, y, r, t, n = 3) {
  for (let i = 0; i < n; i++) {
    const an = t * 3.2 + (i * TAU) / n;
    const px = x + Math.cos(an) * r;
    const py = y + Math.sin(an) * r * 0.32;
    const front = Math.sin(an) > 0;
    if (i % 2) sparkle(ctx, px, py, r * 0.26, front ? 1 : 0.6);
    else star(ctx, px, py, r * 0.24, an, front ? 1 : 0.65);
  }
}
// A puff of real dust: soft overlapping rounds, lit on top, fading.
export function dust(ctx, x, y, r, al, c0 = '#f0dcc0', c1 = '#c8a27e') {
  if (al <= 0.01 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.fillStyle = c1;
  for (const [dx, dy, k] of [[-0.55, 0.15, 0.7], [0.5, 0.12, 0.75], [0, -0.05, 1]]) {
    ell(ctx, x + dx * r, y + dy * r + r * 0.1, r * k, r * k * 0.86);
    ctx.fill();
  }
  ctx.fillStyle = c0;
  for (const [dx, dy, k] of [[-0.55, 0.05, 0.62], [0.5, 0.02, 0.66], [0, -0.14, 0.9]]) {
    ell(ctx, x + dx * r, y + dy * r, r * k, r * k * 0.84);
    ctx.fill();
  }
  ctx.restore();
}
// A dust cloud rolling out along the floor both ways (u 0..1 through it).
export function dustRoll(ctx, x, y, w, u, n = 7, c0, c1) {
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const k = (i >> 1) / Math.max(1, (n >> 1));
    const d = (0.25 + 0.75 * sstep(u)) * w * (0.45 + k * 0.6);
    dust(ctx, x + side * d, y - 2 - k * 3 - u * 4, (3 + k * 3) * (0.7 + u * 0.6), (1 - u) * 0.95, c0, c1);
  }
}
// A chunk of stone rubble: a rounded lump, lit on top.
export function rubble(ctx, x, y, r, ang, al = 1, c = ['#d8ccbc', '#b0a08e', '#8a7a6a']) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  smooth(ctx, [[-r, -r * 0.2], [-r * 0.4, -r * 0.9], [r * 0.6, -r * 0.8], [r, 0], [r * 0.5, r * 0.8], [-r * 0.7, r * 0.6]]);
  pen(ctx, c[2], Math.max(0.6, r * 0.24));
  ctx.stroke();
  ctx.fillStyle = c[1];
  ctx.fill();
  ell(ctx, -r * 0.15, -r * 0.35, r * 0.5, r * 0.28, -0.2);
  ctx.fillStyle = c[0];
  ctx.fill();
  ctx.restore();
}
// A steam puff (a snort): white soft rounds.
export const steam = (ctx, x, y, r, al) => dust(ctx, x, y, r, al, '#ffffff', '#e6e2ee');
// A drop of sweat.
export function sweat(ctx, x, y, s, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.4);
  ctx.quadraticCurveTo(x + s, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s, y + s * 0.2, x, y - s * 1.4);
  ctx.fillStyle = '#bfe8ff';
  ctx.fill();
  pen(ctx, '#7ab8dc', s * 0.25);
  ctx.stroke();
  ctx.restore();
}
// A tear.
export const tear = (ctx, x, y, s, al = 1) => sweat(ctx, x, y, s, al);
// A spoken cue in the air: a soft round speech shape with the word in it (always reads left to
// right, whichever way the speaker faces: f is the speaker's facing).
export function cue(ctx, text, x, y, size, f = 1, tilt = 0, col = '#5a3a2a', fill = '#fffaf0') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(f, 1);
  ctx.rotate(tilt);
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = fill;
  ctx.lineWidth = size * 0.38;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = col;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
// A music note (a trumpet's toot), round-headed.
export function note(ctx, x, y, s, ang, al = 1, col = '#ffd86a') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  pen(ctx, '#b98a3a', s * 0.42);
  ctx.beginPath();
  ctx.moveTo(s * 0.62, 0);
  ctx.lineTo(s * 0.62, -s * 2.1);
  ctx.quadraticCurveTo(s * 1.3, -s * 1.8, s * 1.4, -s * 1.1);
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.78, s * 0.58, -0.4);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A splinter of root bark (from the ceiling, shaken down).
export function splinter(ctx, x, y, l, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  smooth(ctx, [[-l, 0], [-l * 0.3, -l * 0.28], [l, -l * 0.08], [l * 0.3, l * 0.24]]);
  ctx.fillStyle = '#9a6a4a';
  ctx.fill();
  ctx.restore();
}
// A leaf (shaken from the roots).
export function leaf(ctx, x, y, s, ang, al = 1, col = '#8fcf6a') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.quadraticCurveTo(0, -s * 0.7, s, 0);
  ctx.quadraticCurveTo(0, s * 0.7, -s, 0);
  ctx.fillStyle = col;
  ctx.fill();
  pen(ctx, 'rgba(60,110,50,0.5)', s * 0.12);
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, 0);
  ctx.lineTo(s * 0.8, 0);
  ctx.stroke();
  ctx.restore();
}
// A speed streak (the air rushing past a charge): a soft tapering line.
export function streak(ctx, x0, y0, x1, y1, w, al, col = '#fff6e6') {
  if (al <= 0.01) return;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const [r, gg, b] = hexRgb(col);
  g.addColorStop(0, `rgba(${r},${gg},${b},0)`);
  g.addColorStop(1, `rgba(${r},${gg},${b},${al})`);
  ctx.strokeStyle = g;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
// A damped spring kept in the rig's state (a value following its goal, overshooting, settling).
export function spring(st, key, goal, k, c, dt, kick = 0) {
  const s = (st[key] ??= { x: goal, v: 0 });
  s.v += kick;
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      s.v += (-(s.x - goal) * k - s.v * c) * (dt / n);
      s.x += s.v * (dt / n);
    }
  }
  return s.x;
}
