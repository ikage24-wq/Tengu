// The Myconid Queen's effects (2026-11-26, Hazel Hoardwell the Pantry Hamster): her props and the
// looks of her moves, drawn live in her own shapes and colours (seeds, her prize acorn, the
// garden's glowcaps, golden seed-fluff), every piece outlined in a deeper tone of its own colour.
//   props     seed (a striped sunflower seed), acorn (her prize acorn), glowcap (the garden's lamps),
//             heap (her hoard: a mound of seeds and fluff), fluff (a soft round of seed-fluff),
//             fog (a rolling bank of fluff along the floor), cue (a floating word, never mirrored)
//   zones     (render/bossfx.js through render/dreamfx.js: a zone's `look`, world/dungeon.js)
//               seedspit    Seed Spit: a seed whistling down onto each patch, bouncing and rolling
//               seedsprout  the same after the lights first go out: the seed splits and sprouts
//               whirl       Hoarder's Whirl: seeds whirling round the ring, then flung out
//               pouchburst  Pouch Burst: seed-fluff gathering along the floor, then a golden tide
//                           rolling out both ways from her
//   co-op     (render/coop.js) the Biggest Acorn falling onto the shared ring and crashing down;
//             the Pantry Twins' seed, passed along their tether and fed to a fallen twin

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const mix = (a, b, u) => a + (b - a) * u;
export const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const eout = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
export const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const rgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

// ---------- Light and small shapes ----------
// A soft round light (added onto what's under it).
export function light(ctx, x, y, r, al, col = '#fff2c8') {
  if (al <= 0.005 || r <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb(col)},${al})`);
  g.addColorStop(0.5, `rgba(${rgb(col)},${al * 0.4})`);
  g.addColorStop(1, `rgba(${rgb(col)},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
// A four-pointed twinkle.
export function twinkle(ctx, x, y, r, al, col = '#ffffff') {
  if (al <= 0.01 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r * 0.72, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r * 0.72, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}
// A soft round of seed-fluff (or dust), its own deeper edge under it.
export function fluff(ctx, x, y, r, al, col = '#fff2d0', edge = '#d8a860') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = edge;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.7, 0, TAU);
  ctx.fill();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.32, r * 0.38, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// A sweat drop, its own soft blue.
export function sweat(ctx, x, y, s, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#9fd4f2';
  ctx.strokeStyle = '#5f9cc4';
  ctx.lineWidth = Math.max(0.5, s * 0.18);
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.3);
  ctx.quadraticCurveTo(x + s * 0.95, y + s * 0.1, x, y + s * 0.75);
  ctx.quadraticCurveTo(x - s * 0.95, y + s * 0.1, x, y - s * 1.3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x - s * 0.22, y + s * 0.05, s * 0.16, s * 0.28, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// Dizzy: little stars circling about (x, y).
export function dizzy(ctx, x, y, rx, t, al = 1) {
  const cols = ['#fff3a0', '#ffd0e8', '#ffffff'];
  for (let i = 0; i < 3; i++) {
    const an = t * 4 + (i / 3) * TAU;
    twinkle(ctx, x + Math.cos(an) * rx, y + Math.sin(an) * rx * 0.3, rx * 0.34, al * (0.55 + 0.45 * Math.sin(an)), cols[i]);
  }
}
// A soft speed streak from p to q, fading at its tail.
export function streak(ctx, p, q, w, col, al = 1) {
  ctx.save();
  const g = ctx.createLinearGradient(p[0], p[1], q[0], q[1]);
  g.addColorStop(0, `rgba(${rgb(col)},0)`);
  g.addColorStop(1, `rgba(${rgb(col)},${al})`);
  ctx.strokeStyle = g;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...p);
  ctx.lineTo(...q);
  ctx.stroke();
  ctx.restore();
}
// A floating word, upright and readable whichever way she faces: `flip` the rig's mirror (-1 when
// the drawing is mirrored), undone about the word's own spot.
export function cue(ctx, text, x, y, size, flip = 1, rot = 0, fill = '#fff6e0', edge = '#b8743e') {
  ctx.save();
  ctx.translate(x, y);
  if (flip < 0) ctx.scale(-1, 1);
  ctx.rotate(rot);
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.28;
  ctx.strokeStyle = edge;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ---------- Her props ----------
const SEED = { base: '#5e4a3a', stripe: '#efe2c8', edge: '#3e3028' };
// A sunflower seed: a dark teardrop with two pale stripes, outlined in its own deeper brown.
export function seed(ctx, x, y, r, an = 0, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(an);
  ctx.beginPath();
  ctx.moveTo(-r * 1.2, 0);
  ctx.quadraticCurveTo(-r * 0.6, -r * 0.75, r * 0.2, -r * 0.62);
  ctx.quadraticCurveTo(r * 1.25, -r * 0.3, r * 1.25, 0);
  ctx.quadraticCurveTo(r * 1.25, r * 0.3, r * 0.2, r * 0.62);
  ctx.quadraticCurveTo(-r * 0.6, r * 0.75, -r * 1.2, 0);
  ctx.fillStyle = SEED.base;
  ctx.fill();
  ctx.strokeStyle = SEED.edge;
  ctx.lineWidth = Math.max(0.4, r * 0.18);
  ctx.stroke();
  ctx.strokeStyle = SEED.stripe;
  ctx.lineWidth = Math.max(0.3, r * 0.14);
  for (const yy of [-0.28, 0.28]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, yy * r * 0.6);
    ctx.quadraticCurveTo(0, yy * r * 1.1, r * 0.9, yy * r * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
// Her prize acorn: a round glossy nut under a scaly cap with a little stem.
export function acorn(ctx, x, y, r, an = 0, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(an);
  ctx.lineWidth = Math.max(0.6, r * 0.13);
  ctx.strokeStyle = '#7a4a24';
  ctx.fillStyle = '#d0904c';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 0.8, r * 0.95, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,210,0.6)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, r * 0.08, r * 0.2, r * 0.42, 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#8a5a30';
  ctx.beginPath();
  ctx.moveTo(-r * 0.98, -r * 0.3);
  ctx.bezierCurveTo(-r * 0.98, -r * 1.05, r * 0.98, -r * 1.05, r * 0.98, -r * 0.3);
  ctx.quadraticCurveTo(0, -r * 0.08, -r * 0.98, -r * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,170,0.45)';
  ctx.lineWidth = Math.max(0.4, r * 0.08);
  for (const k of [-0.45, 0, 0.45]) {
    ctx.beginPath();
    ctx.arc(k * r, -r * 0.5, r * 0.18, Math.PI * 0.1, Math.PI * 0.9);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a4a24';
  ctx.lineWidth = Math.max(0.6, r * 0.16);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.quadraticCurveTo(r * 0.05, -r * 1.15, r * 0.25, -r * 1.3);
  ctx.stroke();
  ctx.restore();
}
// A glowcap (the garden's lamps): a round pink cap with pale spots, a pale stalk, its glow `k`.
export function glowcap(ctx, x, y, r, tilt = 0, k = 1) {
  if (k > 0.02) light(ctx, x, y - r * 0.4, r * 3, 0.45 * k, '#ff9ec8');
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.lineWidth = Math.max(0.5, r * 0.13);
  ctx.strokeStyle = '#c87a9a';
  ctx.fillStyle = '#fff2ec';
  ctx.beginPath();
  ctx.roundRect(-r * 0.32, -r * 0.2, r * 0.64, r * 1.1, r * 0.3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = k > 0.3 ? '#ff9ec8' : '#c890ac';
  ctx.beginPath();
  ctx.moveTo(-r, -r * 0.2);
  ctx.bezierCurveTo(-r, -r * 1.15, r, -r * 1.15, r, -r * 0.2);
  ctx.quadraticCurveTo(0, r * 0.08, -r, -r * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffe2f0';
  for (const [sx, sy, s] of [[-0.45, -0.6, 0.16], [0.2, -0.76, 0.12], [0.56, -0.42, 0.1]]) {
    ctx.beginPath();
    ctx.arc(sx * r, sy * r, s * r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// Her hoard: a mound of seeds and golden fluff, `w` wide, its top `h` high; a few glowcaps asleep
// in it.
export function heap(ctx, x, y, w, h, t = 0, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#b8844a';
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2 + 1.5, h + 1.5, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8c07a';
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, h, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,240,200,0.75)';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.12, y - h * 0.62, w * 0.22, h * 0.2, -0.1, 0, TAU);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 18; i++) {
    const an = Math.PI + hash(i * 1.7) * Math.PI;
    const rr = 0.3 + 0.62 * hash(i * 3.3);
    seed(ctx, x + Math.cos(an) * (w / 2) * rr, y + Math.sin(an) * h * rr - 0.6, Math.max(1, w * 0.024), i * 0.9 + t * 0, al);
  }
  for (let i = 0; i < 3; i++) glowcap(ctx, x - w * 0.3 + i * w * 0.3, y - 1 - (i % 2) * h * 0.22, Math.max(2, w * 0.04), (i - 1) * 0.25, 0.4 * al);
}
// A rolling bank of golden seed-fluff along the floor from x0 to x1, `h` high: soft overlapping
// billows lit on top, over a band hugging the floor; no hard edge, so it reads as a drift of fluff.
export function fog(ctx, x0, x1, y, h, roll, al = 1, seedN = 1, cols = ['#d89a48', '#ffd68a', '#fff4d0']) {
  if (al <= 0.01 || x1 - x0 < 2) return;
  const [shade, body, lit] = cols;
  const rgbA = (c, k) => `rgba(${rgb(c)},${k})`;
  ctx.save();
  ctx.globalAlpha *= al;
  const band = ctx.createLinearGradient(0, y - h * 0.7, 0, y);
  band.addColorStop(0, rgbA(body, 0));
  band.addColorStop(0.5, rgbA(body, 0.75));
  band.addColorStop(1, rgbA(shade, 0.9));
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.quadraticCurveTo(x0 + h * 0.4, y - h * 0.7, x0 + h, y - h * 0.7);
  ctx.lineTo(x1 - h, y - h * 0.7);
  ctx.quadraticCurveTo(x1 - h * 0.4, y - h * 0.7, x1, y);
  ctx.closePath();
  ctx.fill();
  const n = Math.max(4, Math.round((x1 - x0) / (h * 0.55)));
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const taper = Math.sin(Math.PI * clamp(u * 1.1 - 0.05, 0, 1)) ** 0.6;
      const bx = x0 + (x1 - x0) * u + Math.sin(roll + i * 1.7 + seedN + layer) * h * 0.2;
      const r = h * (0.45 + 0.35 * hash(i * 3.1 + seedN + layer * 9)) * (0.4 + 0.6 * taper) * (1 + 0.1 * Math.sin(roll * 1.3 + i));
      const by = y - r * (layer ? 0.75 : 0.45) - h * 0.1 * hash(i * 7.7 + seedN);
      const g = ctx.createRadialGradient(bx - r * 0.2, by - r * 0.3, r * 0.05, bx, by, r);
      g.addColorStop(0, rgbA(lit, layer ? 0.9 : 0.6));
      g.addColorStop(0.45, rgbA(body, layer ? 0.75 : 0.65));
      g.addColorStop(0.8, rgbA(shade, 0.3));
      g.addColorStop(1, rgbA(shade, 0));
      ctx.fillStyle = g;
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
    }
  }
  ctx.restore();
}
// A little sprout curling up out of the floor: a stem and two round seed-leaves, `k` grown.
export function sprout(ctx, x, y, s, k, sway = 0) {
  if (k <= 0.02) return;
  const h = s * 2.2 * k;
  const tip = [x + sway * s * 0.4, y - h];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3e7a48';
  ctx.lineWidth = s * 0.42 + 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - s * 0.3, y - h * 0.5, ...tip);
  ctx.stroke();
  ctx.strokeStyle = '#7cc46a';
  ctx.lineWidth = s * 0.42;
  ctx.stroke();
  for (const side of [-1, 1]) {
    const c = [tip[0] + side * s * 0.62 * k, tip[1] - s * 0.18 * k];
    ctx.fillStyle = '#3e7a48';
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], s * 0.66 * k + 0.7, s * 0.4 * k + 0.7, side * -0.35, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#9adc7e';
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], s * 0.66 * k, s * 0.4 * k, side * -0.35, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her zones' looks (screen space; (x, y) the zone's spot, a floor's left end) ----------
// Seed Spit: a seed whistling down from high over the patch (its shadow gathering under it), a
// soft white streak behind it; it lands with a bounce in a puff of dust, and rolls to a stop. After
// the lights first go out (`seedsprout`) it splits and a sprout curls up out of it.
function spitWarn(ctx, z, x, y, p, time) {
  const f = clamp((p - 0.35) / 0.65, 0, 1);
  const sy = y - 140 + f * f * 132;
  const sx = x + (1 - f) * 18 * (hash(z.x) > 0.5 ? 1 : -1);
  ctx.globalAlpha = 0.2 + 0.4 * f;
  ctx.fillStyle = '#5a3a28';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 4 + f * 9, 1.5 + f * 2.4, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  if (f > 0.02) {
    streak(ctx, [sx, sy - 22], [sx, sy - 4], 2.2, '#ffffff', 0.6 * f);
    seed(ctx, sx, sy, 3.6, time * 14, Math.min(1, f * 3));
  }
}
function spitHit(ctx, z, x, y, u, e, fade, time, grow) {
  const b = Math.abs(Math.sin(u * Math.PI * 2.2)) * (1 - u) * 9;
  for (let k = 0; k < 4; k++) {
    const side = k % 2 ? 1 : -1;
    fluff(ctx, x + side * (6 + k * 4) * e, y - 2 - e * (3 + k), 3.4 * (1 - u) + 0.5, fade * 0.9, '#f6e8d0', '#c8a880');
  }
  if (!grow) seed(ctx, x + e * 8, y - 3 - b, 3.6, 1.2 + e * 5, fade);
  else {
    // the husk split open on the floor, the sprout curling up out of it
    seed(ctx, x - 4, y - 2, 3, -0.3, fade);
    seed(ctx, x + 4, y - 2, 3, Math.PI + 0.3, fade);
    sprout(ctx, x, y - 2, 6, eout(u / 0.6), Math.sin(time * 4) * 0.4);
    twinkle(ctx, x, y - 16 * e, 3 * (1 - u), fade, '#e8ffd8');
  }
}
// Hoarder's Whirl: seeds whirling round the ring's rim, faster as it nears; then flung out from it
// in every direction, tumbling, with puffs of fluff.
function whirlWarn(ctx, z, x, y, p, time) {
  const R = z.w / 2;
  const n = 10;
  for (let k = 0; k < n; k++) {
    const an = (k / n) * TAU + time * (2 + p * 6);
    const sx = x + Math.cos(an) * R * 0.92;
    const sy = y - 8 + Math.sin(an) * 9;
    seed(ctx, sx, sy, 2.8, an + Math.PI / 2, 0.35 + 0.65 * p);
  }
}
function whirlHit(ctx, z, x, y, u, e, fade, time) {
  const R = z.w / 2;
  for (let k = 0; k < 12; k++) {
    const an = (k / 12) * TAU + 0.2;
    const d = R * (0.4 + 0.8 * e);
    const sx = x + Math.cos(an) * d;
    const sy = y - 8 + Math.sin(an) * d * 0.22 - Math.sin(u * Math.PI) * 14;
    seed(ctx, sx, sy, 3, an + u * 12, fade);
    if (k % 3 === 0) fluff(ctx, x + Math.cos(an) * d * 0.8, y - 3, 4 * (1 - u) + 0.5, fade * 0.8, '#fff0d0', '#c8a070');
  }
}
// Pouch Burst: while it gathers, fluff stirs and lifts off the floor all along it, glinting; then a
// golden tide of seed-fluff rolls out from her both ways, seeds tumbling along its crest.
function burstWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const n = 26;
  for (let k = 0; k < n; k++) {
    const fx = x + ((k + 0.5) / n) * w + Math.sin(time * 2 + k) * 4;
    const lift = (Math.sin(time * 3 + k * 1.7) * 0.5 + 0.5) * (2 + p * 6);
    fluff(ctx, fx, y - 2 - lift, 1.2 + p * 2.2, (0.3 + 0.6 * p) * (0.6 + 0.4 * hash(k)), '#fff0c8', '#d8a860');
    if (k % 4 === 0) twinkle(ctx, fx, y - 8 - lift * 2, 1.4 + p * 1.6, p * (0.5 + 0.5 * Math.sin(time * 6 + k)), '#fff8d8');
  }
}
function burstHit(ctx, z, x, y, u, e, fade, time) {
  const bx = z.from ? z.from.x + x - (z.x ?? 0) : x + z.w / 2;
  const front = Math.max(bx - x, x + z.w - bx) * e;
  const h = 22 * (1 - u * 0.5);
  fog(ctx, Math.max(x, bx - front), bx, y + 1, h, time * 1.6, fade, 3);
  fog(ctx, bx, Math.min(x + z.w, bx + front), y + 1, h, time * 1.6 + 2, fade, 7);
  for (const side of [-1, 1]) {
    const cx = bx + side * front;
    for (let k = 0; k < 4; k++) seed(ctx, cx - side * k * 8, y - h * 0.9 - Math.sin(time * 9 + k) * 3, 2.8, time * 10 * side + k, fade);
  }
}
export const HAZEL_FX = {
  seedspit: { warn: spitWarn, hit: (ctx, z, x, y, u, e, fade, time) => spitHit(ctx, z, x, y, u, e, fade, time, false) },
  seedsprout: { warn: spitWarn, hit: (ctx, z, x, y, u, e, fade, time) => spitHit(ctx, z, x, y, u, e, fade, time, true) },
  whirl: { warn: whirlWarn, hit: whirlHit },
  pouchburst: { warn: burstWarn, hit: burstHit },
};
// How long each landing plays (s) (world/bossfight.js LOOK_HOLD).
export const HAZEL_HOLD = { seedspit: 0.7, seedsprout: 1, whirl: 0.8, pouchburst: 1.3 };

// ---------- Co-op (render/coop.js) ----------
// The Biggest Acorn's ring: seeds laid round the rim, turning slowly; the acorn's shadow gathering
// in the middle as it comes; for the last stretch of the warning the acorn itself drops in from
// high above, spinning slowly. (x, y) the ring's middle on the floor, `w` its width.
export function acornRing(ctx, x, y, w, p, born, time) {
  const R = w / 2;
  const n = 14;
  ctx.save();
  ctx.globalAlpha = born * 0.5;
  ctx.fillStyle = '#ffe28a';
  ctx.beginPath();
  ctx.ellipse(x, y, R, R * 0.26, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = born * (0.25 + 0.45 * p);
  ctx.fillStyle = '#6a4020';
  ctx.beginPath();
  ctx.ellipse(x, y, 10 + p * R * 0.5, (10 + p * R * 0.5) * 0.26, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  for (let k = 0; k < n; k++) {
    const an = (k / n) * TAU + time * 0.4;
    seed(ctx, x + Math.cos(an) * R * 0.94, y + Math.sin(an) * R * 0.24, 2.6, an + Math.PI / 2, born);
  }
  const f = clamp((p - 0.55) / 0.45, 0, 1);
  if (f > 0) {
    const ay = y - 18 - 190 * (1 - f * f);
    streak(ctx, [x, ay - 40], [x, ay - 14], 4, '#ffffff', 0.5 * f);
    acorn(ctx, x, ay, 15, Math.sin(time * 3) * 0.3 + f * 0.4, Math.min(1, f * 4) * born);
  }
}
// The acorn crashing down: a thump of dust, the acorn bouncing once and settling as it fades, its
// cap popping off; seeds scattering out of the ring.
export function acornCrash(ctx, x, y, p, w) {
  const e = eout(p);
  const fade = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  const R = w / 2;
  for (let k = 0; k < 8; k++) {
    const side = k % 2 ? 1 : -1;
    fluff(ctx, x + side * (10 + k * 7) * e, y - 3 - e * (4 + (k % 3) * 3), 6 * (1 - p) + 1, fade, '#fff0d8', '#c8a070');
  }
  for (let k = 0; k < 10; k++) {
    const an = Math.PI + 0.2 + (k / 9) * (Math.PI - 0.4);
    seed(ctx, x + Math.cos(an) * R * e, y - 6 + Math.sin(an) * 26 * e + p * p * 30, 2.6, k + p * 9, fade);
  }
  const b = Math.abs(Math.sin(Math.min(1, p * 1.6) * Math.PI)) * (1 - p) * 16;
  acorn(ctx, x, y - 14 - b, 15, 0.3 * (1 - p), fade);
}
// The Pantry Twins' seed: carried back and forth along their tether between the two (each taking
// a nibble); once one falls, it hops along to the fallen twin, faster as the call-back nears.
// `pts` the tether's points, `alone` 0..1 toward the call-back (-1 while both stand), `to` which end
// the fallen twin is (0 or 1).
export function pantrySeed(ctx, pts, time, alone, to) {
  if (!pts.length) return;
  let u = 0.5 + 0.5 * Math.sin(time * 1.4);
  if (alone >= 0) u = mix(0.5, to, sstep(alone * 1.4));
  const i = Math.min(pts.length - 1, Math.round(u * (pts.length - 1)));
  const q = pts[i];
  const hop = Math.abs(Math.sin(time * (alone >= 0 ? 9 : 4))) * 4;
  seed(ctx, q.x, q.y - 5 - hop, 3.4, Math.sin(time * 3) * 0.4);
  if (alone >= 0) twinkle(ctx, q.x + 5, q.y - 12 - hop, 2.4, 0.6 + 0.4 * Math.sin(time * 10), '#fff4c0');
}
