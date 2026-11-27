// Interactive dungeon objects for Rootwood Hollow, in the scenery's outlined chibi style: lamp
// mushrooms to light, root cages holding sprouts, thorny root seals over doorways,
// root keys, and the floor telegraphs for boss attacks with the bursts they end in. Everything is
// drawn in screen space with (x, y) the bottom center on the floor; `time` (seconds) animates.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, bark, stones } from './propkit.js';
import { art, place, face } from './scenery.js';
import { deep, inked } from './fxkit.js';
import { clamp01, sstep, easeOut, springy, pop, ready, DANGER, glowDisc, sparkle as softSparkle, cloud, ring as softRing, chevron, bang, floorMark, bandMark, hitBurst } from './mobfx.js';

const TAU = Math.PI * 2;
const INK = '#3a2d4f';
const ROOT = '#b9917e';
const ROOT_LIGHT = '#d4b09c';
const ROOT_DEEP = '#8f6a66';
const WOOD_IN = '#ecd2bc';
const MOSS = '#a6dca2';
const GOLD = '#ffd36b';
const LEAF = '#8fe6b0';
const TEAR = '#9fd8ff';

// ---------- Shared bits ----------

// A band polygon following `path`, `widthAt(u)` half as wide at each point (u = 0..1 along it).
function bandPts(path, widthAt) {
  const left = [];
  const right = [];
  path.forEach(([x, y], i) => {
    const [ax, ay] = path[Math.max(0, i - 1)];
    const [bx, by] = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / l;
    const ny = (bx - ax) / l;
    const w = widthAt(i / (path.length - 1));
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  return [...left, ...right.reverse()];
}
const band = (path, widthAt, c) => T(bandPts(path, widthAt), c);

// Points along a quadratic curve, for roots and bars.
function curve(x0, y0, cx, cy, x1, y1, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = (1 - u) * (1 - u);
    const b = 2 * u * (1 - u);
    const c = u * u;
    out.push([a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1]);
  }
  return out;
}

function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.fill();
}

function shadow(ctx, x, y, rx, alpha = 0.16) {
  ctx.fillStyle = `rgba(58,45,79,${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, Math.max(1, rx * 0.22), 0, 0, TAU);
  ctx.fill();
}

function zzz(ctx, x, y, time) {
  ctx.save();
  ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = '#c9b8ff';
  for (let k = 0; k < 2; k++) {
    const u = (time * 0.45 + k / 2) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI);
    ctx.fillText('z', x + u * 6 + k * 2, y - u * 10);
  }
  ctx.restore();
}

const blinking = (time, seed) => ((time * 0.35 + seed * 7.3) % 1) < 0.05;

// ---------- Glowcap: a lamp mushroom the party lights ----------

// Hand-shaded under the world light from the upper left: the cap's lit crown and shaded right
// flank, gills in shadow under the rim, a fibrous stalk in the cap's shade. `g` (0 ... 2) is how
// brightly the spots glow in the pulse.
function glowcapArt(lit, blink, g = 0) {
  const cap = lit ? '#ffcf7a' : '#9aa8c6';
  const stalk = lit ? '#fff4e0' : '#dad8e4';
  const cr = ramp(cap, 0.8);
  const sr = ramp(stalk, 0.6);
  const spot = lit ? mix('#c4fff2', '#ffffff', g * 0.3) : '#c2cadc';
  return art(`dg-glowcap|${lit}|${blink}|${g}`, 24, 36, () => [
    E(12, 35, 7.4, 1.4, stalk), R(7.4, 18, 9.2, 17, stalk),
    F(R(7.4, 18, 2.2, 17, sr.hi)), F(R(13.8, 18, 2.8, 17, sr.sh)), F(R(7.4, 19.6, 9.2, 3, sr.sh)), F(R(10.6, 24, 0.6, 9, sr.sh)),
    T([[0.8, 20], [2.2, 12], [6.4, 5.4], [12, 3], [17.6, 5.4], [21.8, 12], [23.2, 20]], cap),
    F(T([[16, 6.6], [17.6, 5.4], [21.8, 12], [23.2, 20], [18.2, 20], [19.4, 13]], cr.sh)),
    F(T([[3, 13.4], [5.8, 7.2], [10, 4.4], [13, 4.2], [8.6, 7.6], [5.8, 13.6]], cr.hi)),
    F(E(12, 20, 10.4, 1.4, cr.sh)), F(E(12, 20.5, 8.6, 0.8, cr.deep)),
    F(E(6.4, 11.4, 2, 1.6, spot)), F(E(14.6, 7.4, 2.4, 1.6, spot)), F(E(18.6, 14, 1.6, 1.2, spot)), F(E(10.6, 15, 1.2, 1, spot)),
    ...(lit && g ? [F(E(6, 11, 0.8, 0.6, '#ffffff')), F(E(14.2, 7, 0.9, 0.6, '#ffffff'))] : []),
    ...face(12, 26.4, 2.2, lit ? (blink ? 'closed' : 'happy') : 'closed', lit ? 'smile' : 'o'),
  ], false);
}

// A lamp mushroom about 24 wide and 36 tall: dull and dozing until lit, then a warm glowing cap
// with a happy face and a gentle pulse.
export function drawGlowcap(ctx, x, y, lit, time) {
  shadow(ctx, x, y, 10);
  if (!lit) {
    place(ctx, glowcapArt(false, false), x, y);
    zzz(ctx, x + 9, y - 30, time);
    return;
  }
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
  glow(ctx, x, y - 22, 34 + pulse * 6, '#ffd68a', 0.5 + pulse * 0.15);
  glow(ctx, x, y - 26, 16, '#c4fff2', 0.35 + pulse * 0.15);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 + pulse * 0.03, 1 - pulse * 0.025);
  place(ctx, glowcapArt(true, blinking(time, 0.3), Math.round(pulse * 2)), 0, 0);
  ctx.restore();
  // Spores of light drifting up off the cap.
  for (let k = 0; k < 3; k++) {
    const u = (time * 0.5 + k / 3) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    sparkle(ctx, x + Math.sin(u * 6 + k * 2) * 6 + (k - 1) * 6, y - 34 - u * 16, 1.6, k % 2 ? '#c4fff2' : '#fff1c4');
  }
  ctx.globalAlpha = 1;
}

// ---------- Cage: woven roots holding a sprout ----------

export function sproutArt(happy, frame) {
  return art(`dg-sprout|${happy}|${frame}`, 16, 16, () => {
    const up = frame ? -1.4 : 0;
    const out = [
      R(7.4, 1.8, 1.2, 4.4, '#7fcf88'), T([[8, 3.4], [3.6, 0.8], [2.6, 3.4], [6, 4.6]], LEAF), T([[8, 3], [12.4, 0.4], [13.4, 3], [10, 4.4]], LEAF),
      E(2.4, 10.6 + up, 1.6, 1.3, '#c8f0b8'), E(13.6, 10.6 + up, 1.6, 1.3, '#c8f0b8'),
      E(8, 10.6, 6, 5, '#c8f0b8'), F(E(6, 7.6, 1.8, 0.8, '#ecfbe6')),
      ...face(8, 10.4, 2.2, happy ? 'happy' : 'open', happy ? 'smile' : 'o'),
    ];
    if (!happy) out.push(F(E(5.2, 12.6 + frame * 0.8, 0.6, 1.1, TEAR)), F(E(10.8, 12.6 + (1 - frame) * 0.8, 0.6, 1.1, TEAR)));
    return out;
  });
}

const ROOT_R = ramp(ROOT, 0.8);
const ROOT_LIGHT_R = ramp(ROOT_LIGHT, 0.8);
const PLINTH = ramp('#a497b8', 0.7);
const IRON = ramp('#8d92b4', 0.9);

// A mossy stone plinth the cage stands on.
const plinth = (x, y, w, h) => [...stones(x, y, w, h, PLINTH, 2, { rowH: h, blockW: 8 }), F(E(x + w * 0.27, y + 0.4, 4, 1, MOSS)), F(E(x + w * 0.76, y + 0.3, 3, 0.9, MOSS))];

// `strain` 0..2 bows the bars outward; `j` shifts them a hair to make them shudder. Roots are
// bark (grain, lit left flank, shaded right); an iron padlock with a three-step shine hangs on
// the door bar.
function cageArt(strain, j) {
  return art(`dg-cage|${strain}|${j}`, 32, 36, () => {
    const out = [];
    const bow = strain * 1.3;
    for (const [i, xb] of [2.6, 9.4, 22.6, 29.4].entries()) {
      const s = Math.sign(xb - 16);
      const top = 16 + (xb - 16) * 0.22;
      const jit = j && strain ? (i % 2 ? 0.5 : -0.5) : 0;
      out.push(...bark(curve(xb, 33, xb + s * (2 + bow) + jit, 12, top, 4.4), (u) => 1.5 - u * 0.5, i % 2 ? ROOT_LIGHT_R : ROOT_R, i, 1));
    }
    // Woven cross roots and a mossy knot on top with a leaf.
    out.push(...bark(curve(1.6, 19, 16, 21.4 + bow, 30.4, 19), () => 1.1, ROOT_LIGHT_R, 5, 1), ...bark(curve(5.4, 10.4, 16, 12.6 + bow * 0.6, 26.6, 10.4), () => 0.9, ROOT_R, 6, 1));
    out.push(...plinth(1, 31, 30, 5));
    out.push(E(16, 4.4, 4, 3, ROOT), F(E(16.8, 5.2, 3, 2, ROOT_R.sh)), F(E(15.2, 3.8, 2.4, 1.6, ROOT_LIGHT)), E(13.6, 2.8, 2.4, 1.4, MOSS), T([[17, 2.4], [19.6, -0.4], [22.4, 0.2], [20, 2.6]], LEAF), F(T([[19.6, -0.4], [22.4, 0.2], [20, 2.6]], '#6fc994')));
    // The padlock on the right-hand door bar.
    const lx = 22.2 + bow * 0.6;
    out.push(band(curve(lx - 1.6, 23, lx, 19.8, lx + 1.6, 23, 4), () => 0.55, IRON.sh), R(lx - 2.4, 22.6, 4.8, 4, IRON.base), F(R(lx - 2.4, 22.6, 4.8, 1, IRON.hi)), F(R(lx + 0.9, 23.6, 1.5, 3, IRON.sh)), F(R(lx - 1.8, 23.2, 0.8, 0.8, '#ffffff')), F(R(lx - 0.3, 24, 0.6, 1.6, IRON.deep)));
    return out;
  }, false);
}

function cageOpenArt() {
  return art('dg-cage-open', 36, 14, () => {
    const out = [];
    for (const [i, [xb, dx, len]] of [[5, -4, 8], [11, -2, 6], [18, 0.6, 7], [25, 2.4, 6], [31, 4, 9]].entries()) {
      const pts = curve(xb, 12, xb + dx * 0.4, 12 - len * 0.6, xb + dx, 12 - len, 4);
      out.push(...bark(pts, () => 1.5, i % 2 ? ROOT_LIGHT_R : ROOT_R, i, 0));
      const [tx, ty] = pts[4];
      // Snapped ends showing pale wood inside.
      out.push(T([[tx - 1.6, ty + 0.6], [tx - 0.6, ty - 1.6], [tx + 0.2, ty], [tx + 1.2, ty - 1.4], [tx + 1.6, ty + 0.6]], WOOD_IN));
    }
    out.push(...plinth(3, 10, 30, 4));
    return out;
  }, false);
}

// A cage of woven roots, about 32 wide and 36 tall, with a sprout trapped inside crying. While
// being freed (0 < progress < 1) the roots strain and a ring above fills; once open the cage
// is broken stubs and the sprout bounces for joy.
export function drawCage(ctx, x, y, open, progress, time) {
  shadow(ctx, x, y, 15);
  if (open) {
    place(ctx, cageOpenArt(), x, y + 1);
    const hop = Math.abs(Math.sin(time * 5)) * 7;
    place(ctx, sproutArt(true, Math.floor(time * 5) % 2), x, y - 2 - hop);
    for (let k = 0; k < 2; k++) {
      const u = (time * 0.6 + k / 2) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      heart(ctx, x + (k ? 8 : -9) + Math.sin(u * 5) * 2, y - 20 - u * 14, 2.2, k ? '#ffb0d0' : '#ff8fb4');
    }
    ctx.globalAlpha = 1;
    return;
  }
  const freeing = progress > 0 && progress < 1;
  const wig = Math.sin(time * (freeing ? 14 : 7)) * (freeing ? 1.4 : 0.8);
  place(ctx, sproutArt(false, Math.floor(time * 4) % 2), x + wig, y - 3);
  const strain = freeing ? 1 + (progress > 0.5 ? 1 : 0) : 0;
  const shake = freeing ? Math.sin(time * 40) * 0.5 * strain : 0;
  place(ctx, cageArt(strain, Math.floor(time * 18) % 2), x + shake, y);
  if (freeing) ring(ctx, x, y - 46, 7, progress, '#8fe6a8');
}

// A small progress ring: a pale disc with a track and a filling arc.
function ring(ctx, x, y, r, p, color) {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#e6dcef';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.5, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r - 0.5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, p));
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(58,45,79,0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, TAU);
  ctx.stroke();
  sparkle(ctx, x, y, 2.2, color);
}

// ---------- Seal: thorny roots barring a doorway ----------

const THORN_ROOT = '#8e5e72';
const THORN_ROOT2 = '#ac788a';
const THORN = '#f3d6d0';

const THORN_R = ramp(THORN_ROOT, 0.8);
const THORN_R2 = ramp(THORN_ROOT2, 0.8);
const SEAL_STONE = ramp('#9a8fb0', 0.8);
// Rune glyphs carved round the leaf-lock, as strokes in a unit box (x0, y0, x1, y1).
const RUNES = [
  [[0, -1, 0, 1], [0, 0, 0.8, -0.7]],
  [[-0.6, -1, 0.6, 1], [0.6, -1, -0.6, 1]],
  [[0, -1, 0, 1], [-0.8, -0.4, 0, 0.2], [0.8, -0.4, 0, 0.2]],
  [[-0.7, 1, 0, -1], [0, -1, 0.7, 1]],
  [[0, -1, 0, 1], [0, -1, 0.7, -0.4], [0.7, -0.4, 0, 0.2]],
  [[-0.7, -0.7, 0.7, -0.7], [0, -0.7, 0, 1]],
];
const runeAt = (i) => {
  const a = -Math.PI / 2 + (i * TAU) / RUNES.length;
  return [Math.cos(a) * 10.4, Math.sin(a) * 10.4];
};

function sealArt(f) {
  return art(`dg-seal|${f}`, 48, 76, () => {
    const out = [];
    const ph = (f * Math.PI) / 2;
    const w = (k) => Math.sin(k + ph) * 1.4;
    // Roots: the two posts, then crossing tangles.
    const roots = [
      [[4, 76], [3 + w(0), 50], [6 + w(1), 24], [14, 6], [24, 2]],
      [[44, 76], [45 + w(2), 50], [42 + w(3), 24], [34, 6], [24, 2]],
      [[2, 70], [16 + w(1), 52], [30 + w(4), 30], [44, 10]],
      [[46, 72], [32 + w(2), 54], [18 + w(5), 30], [4, 12]],
      [[0, 44], [14 + w(3), 38 + w(1)], [34 + w(6), 46], [48, 38]],
      [[2, 26], [18 + w(4), 22], [32 + w(2), 18], [46, 26]],
      [[8, 76], [20 + w(5), 64 + w(2)], [36, 70], [44, 60]],
    ];
    roots.forEach((r, i) => {
      out.push(...bark(r, (u) => (i < 2 ? 4 : 2.8) - u * (i < 2 ? 1.4 : 1), i % 2 ? THORN_R2 : THORN_R, i, i < 2 ? 2 : 1));
      // Thorns along it, alternating sides, lit on their upper-left face.
      for (let k = 1; k < r.length; k++) {
        const [ax, ay] = r[k - 1];
        const [bx, by] = r[k];
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const l = Math.hypot(bx - ax, by - ay) || 1;
        const s = k % 2 ? 1 : -1;
        const nx = (-(by - ay) / l) * s;
        const ny = ((bx - ax) / l) * s;
        const tx = (bx - ax) / l;
        const ty = (by - ay) / l;
        const base = i < 2 ? 3.4 : 2.4;
        const tip = [mx + nx * (base + 4) + tx * 1.2, my + ny * (base + 4) + ty * 1.2];
        out.push(T([[mx + nx * base - tx * 1.8, my + ny * base - ty * 1.8], tip, [mx + nx * base + tx * 1.8, my + ny * base + ty * 1.8]], THORN));
        out.push(F(T([[mx + nx * base + tx * 0.2, my + ny * base + ty * 0.2], tip, [mx + nx * base + tx * 1.8, my + ny * base + ty * 1.8]], '#d9b0b4')));
      }
    });
    // The leaf-lock: a ring of carved stone, a round wooden boss with a glowing leaf, a keyhole.
    out.push(E(24, 40, 13, 13, SEAL_STONE.base), F(E(25, 41.2, 12, 12, SEAL_STONE.sh)), F(E(23.4, 39.4, 11.6, 11.6, SEAL_STONE.base)), F(E(21, 33.4, 5, 2.2, SEAL_STONE.hi)));
    RUNES.forEach((g, i) => {
      const [rx, ry] = runeAt(i);
      for (const [x0, y0, x1, y1] of g) out.push(F(band([[24 + rx + x0 * 1.6, 40 + ry + y0 * 1.6], [24 + rx + x1 * 1.6, 40 + ry + y1 * 1.6]], () => 0.4, SEAL_STONE.deep)));
    });
    out.push(E(24, 40, 7.6, 7.6, ROOT_DEEP), E(24, 40, 6, 6, '#c99a7a'), F(E(25, 41, 5, 5, '#ad7f64')), F(E(23.4, 39.4, 4.8, 4.8, '#c99a7a')), T([[24, 34], [28, 37.8], [26.2, 42.6], [24, 44], [21.8, 42.6], [20, 37.8]], LEAF),
      F(T([[24, 34], [28, 37.8], [26.2, 42.6], [24, 44]], '#6fc994')), F(R(23.6, 35.4, 0.8, 8, '#d8ffe8')), F(E(24, 46.4, 1.2, 1.2, INK)), F(T([[23.3, 46.8], [24.7, 46.8], [25.2, 49], [22.8, 49]], INK)));
    return out;
  }, false);
}

// The runes round the seal's lock light one after another, a glow running round the ring.
function sealRunes(ctx, x, y, time) {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  RUNES.forEach((g, i) => {
    const [rx, ry] = runeAt(i);
    const on = Math.pow(Math.max(0, Math.cos(time * 2.2 - (i * TAU) / RUNES.length)), 3);
    const cx = x + rx;
    const cy = y - 36 + ry;
    if (on > 0.4) glow(ctx, cx, cy, 5, '#9ff0c8', on * 0.6);
    ctx.globalAlpha = 0.3 + 0.7 * on;
    ctx.strokeStyle = on > 0.6 ? '#f0fff6' : '#9ff0c8';
    ctx.beginPath();
    for (const [x0, y0, x1, y1] of g) {
      ctx.moveTo(cx + x0 * 1.6, cy + y0 * 1.6);
      ctx.lineTo(cx + x1 * 1.6, cy + y1 * 1.6);
    }
    ctx.stroke();
  });
  ctx.restore();
}

function sealOpenArt() {
  return art('dg-seal-open', 52, 14, () => {
    const out = [];
    for (const [i, [xb, dir, len]] of [[4, 1, 10], [13, -1, 7], [22, 1, 6], [31, -1, 8], [40, 1, 7], [48, -1, 10]].entries()) {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        const a = Math.PI / 2 + u * Math.PI * 1.3;
        const r = len * 0.45 * (1 - u * 0.55);
        pts.push([xb + dir * (Math.cos(a) * r + u * 2), 14 - u * len * 0.5 - (1 + Math.sin(a)) * r * 0.6]);
      }
      out.push(band(pts, (u) => 2.2 * (1 - u) + 0.6, i % 2 ? THORN_ROOT2 : THORN_ROOT));
    }
    out.push(E(26, 13, 25, 1.6, THORN_ROOT), T([[17, 10], [20, 6.6], [22.4, 7.4], [20, 10.4]], LEAF), T([[34, 10.4], [33, 6.4], [35.6, 6], [36, 10]], LEAF));
    return out;
  });
}

// A wall of tangled thorny roots, about 48 wide and 76 tall, sealing a doorway, with a glowing
// leaf-lock in the middle; it writhes a little. Open, only retracted stubs remain at the bottom.
// (Rootwood Hollow's: the other dungeons each close theirs their own way, `kind` the dungeon.)
export function drawSeal(ctx, x, y, open, time, kind = 'hollow') {
  if (THEMED_SEALS[kind]) {
    drawThemedSeal(ctx, kind, x, y, open, time);
    return;
  }
  if (open) {
    place(ctx, sealOpenArt(), x, y + 1);
    return;
  }
  shadow(ctx, x, y, 24, 0.2);
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
  const f = Math.floor(time * 3.2) % 4;
  glow(ctx, x, y - 38, 26 + pulse * 5, '#9ff0c8', 0.55 + pulse * 0.3);
  ctx.save();
  ctx.translate(Math.round(Math.sin(time * 1.3) * 0.6), 0);
  place(ctx, sealArt(f), x, y);
  sealRunes(ctx, x, y, time);
  ctx.restore();
  glow(ctx, x, y - 37, 7 + pulse * 2, '#d8ffe8', 0.35 + pulse * 0.3);
  ctx.globalAlpha = 0.6 + 0.4 * pulse;
  sparkle(ctx, x + 6, y - 46, 1.6 + pulse, '#e6fff0');
  ctx.globalAlpha = 1;
}

// ---------- Root key ----------

const rootKeyArt = () => art('dg-rootkey', 12, 22, () => [
  ...bark([[6, 9], [5.6, 12], [6.4, 16], [6, 21]], () => 1.3, ROOT_R, 3, 1), R(6.6, 15.6, 3.2, 1.6, ROOT), F(R(6.6, 16.6, 3.2, 0.6, ROOT_R.sh)), R(6.6, 18.8, 2.4, 1.6, ROOT), F(R(6.6, 19.8, 2.4, 0.6, ROOT_R.sh)),
  T([[5.4, 13], [3, 12.4], [2.6, 14]], MOSS),
  T([[6, 0.4], [10.4, 3.6], [10.4, 7], [6, 10], [1.6, 7], [1.6, 3.6]], LEAF), F(T([[6, 0.4], [10.4, 3.6], [10.4, 7], [6, 10]], '#6fc994')), F(T([[2.4, 4], [6, 1.4], [6, 2.6], [3.2, 5]], '#c8f7dc')),
  F(E(6, 5.2, 1.8, 2.2, '#5fbf8a')), F(E(6, 5.2, 0.9, 1.2, '#d8ffe8')),
], false);

// A small floating key of root with a glowing leaf bow, about 12 wide and 22 tall, bobbing
// above its spot on the ground.
export function drawRootKey(ctx, x, y, time) {
  const bob = (Math.sin(time * 2.6) + 1) * 2;
  shadow(ctx, x, y, 6 - bob * 0.4, 0.18);
  const ky = y - 4 - bob;
  glow(ctx, x, ky - 17, 13, '#9ff0c8', 0.55 + 0.2 * Math.sin(time * 3));
  place(ctx, rootKeyArt(), x, ky);
  const a = time * 2.4;
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(a * 2);
  sparkle(ctx, x + Math.cos(a) * 9, ky - 14 + Math.sin(a) * 5, 1.6, '#ffffff');
  // Now and then a glint runs over the leaf bow.
  const gl = (time * 0.45) % 1;
  if (gl < 0.14) {
    ctx.globalAlpha = Math.sin((gl / 0.14) * Math.PI);
    sparkle(ctx, x - 3 + (gl / 0.14) * 6, ky - 20 + (gl / 0.14) * 3, 2.2, '#ffffff');
  }
  ctx.globalAlpha = 1;
}

// ---------- Boss attack telegraphs ----------

// (The marks and landings are drawn in the remade monsters' soft style, render/mobfx.js, 2026-11-27:
// rounded marks on a deeper rim of their own colour, the fill growing to the edge by the moment of
// the hit, breathing and eased, never blinking. Each covers exactly the floor its blow hits.)
const MARKER_COL = { buster: '#ff6f86', stack: '#f6bd3c', spread: '#b48af6' };
const HIT_COL = { buster: '#ff9aae', stack: '#ffd77a', spread: '#d4b4ff' };
const DIRT = ['#fbf3ea', '#e2cbb8'];

// A root tip `tall` high on (x, y), leaning `lean`: a soft rounded spike over a rim of its own colour.
function rootTip(ctx, x, y, tall, lean, half) {
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - half, y);
    ctx.bezierCurveTo(x - half * 0.9, y - tall * 0.55, x - half * 0.35 + lean, y - tall, x + lean, y - tall);
    ctx.bezierCurveTo(x + half * 0.35 + lean, y - tall, x + half * 0.9, y - tall * 0.55, x + half, y);
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  path();
  if (inked(ctx)) {
    ctx.strokeStyle = deep(THORN_ROOT);
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.fillStyle = THORN_ROOT;
  ctx.fill();
  if (tall > 5) {
    ctx.beginPath();
    ctx.moveTo(x - half * 0.45, y - tall * 0.2);
    ctx.quadraticCurveTo(x - half * 0.4 + lean * 0.5, y - tall * 0.7, x + lean * 0.7 - 0.3, y - tall + 1.6);
    ctx.strokeStyle = THORN;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

// A floor warning for a boss attack. `kind`: 'circle' (a spore patch w wide centered on x),
// 'lane' (a charge path from x to x + w; a negative w charges left), 'floor' (the floor from x to
// x + w is about to be slammed), 'thorns' (spikes will erupt from x to x + w), 'band' (a cleave
// or a line from x to x + w), 'donut' (a ring with a safe middle), 'raid' (everyone), or a marker
// on a member ('buster', 'stack', 'spread'). `progress` 0..1 fills it in as the attack winds up.
export function drawZone(ctx, kind, x, y, w, progress, time, z = null) {
  const p = clamp01(progress);
  // (Phased by the zone's own place in the world, never by where it sits on screen.)
  const seed = z ? z.x * 0.05 + (z.n ?? 0) : 0;
  ctx.save();
  if (kind === 'circle') {
    floorMark(ctx, x, y, w / 2, 7, p, time, seed);
  } else if (kind === 'lane') {
    const x0 = Math.min(x, x + w);
    const len = Math.abs(w);
    const dir = w < 0 ? -1 : 1;
    // The fill runs from the charger down the lane; soft chevrons slide the way it will go.
    const born = bandMark(ctx, x0, y, len, 12, p, time, seed, dir > 0 ? -1 : 1);
    const step = 22;
    const shift = (time * 26) % step;
    for (let cx = step / 2 + shift; cx < len - 4; cx += step) {
      const px = dir > 0 ? x0 + cx : x0 + len - cx;
      chevron(ctx, px, y, 6, dir, born * (0.55 + 0.45 * p) * clamp01(Math.min(cx, len - cx) / 12));
    }
  } else if (kind === 'floor') {
    const h = 16;
    const born = bandMark(ctx, x, y, w, h, p, time, seed, 0);
    // Soft ripples rolling out from the middle at one steady pace.
    for (let k = 0; k < 2; k++) {
      const u = (time * 1.1 + k / 2 + seed * 0.01) % 1;
      softRing(ctx, x + w / 2, y, Math.max(1, (w / 2) * u), Math.max(0.5, (h / 2 - 1.5) * u), 1.3, '#ffffff', born * Math.sin(u * Math.PI) * (0.35 + 0.45 * p));
    }
    // Rounded "!" marks along it, bobbing each on its own beat.
    for (let mx = x + 40, i = 0; mx < x + w - 20; mx += 80, i++) bang(ctx, mx, y + 5 - Math.sin(time * 4 + i * 1.3 + seed) * 0.6 * p, 4.2, born * (0.55 + 0.45 * p));
  } else if (kind === 'thorns') {
    bandMark(ctx, x, y, w, 10, p, time, seed, 0);
    // Root tips peeking up through the dirt, rising and swaying a little as it nears.
    // (each its own height, as the spikes that follow will be)
    const tip = easeOut(p);
    for (let tx = x + 6, i = 0; tx < x + w - 3; tx += 12, i++) {
      ctx.globalAlpha = 0.65 + 0.35 * p;
      rootTip(ctx, tx, y + 1.5, 1 + (2.6 + (i % 3) * 1.4) * tip, Math.sin(time * 2.6 + i * 0.9 + seed) * 0.5 * p, 2.2 + (i % 3) * 0.4);
    }
  } else if (kind === 'band') {
    // A cleave or a line: filling from the boss's end, chevrons sliding the way it swings.
    const dir = z?.dir < 0 ? -1 : 1;
    const born = bandMark(ctx, x, y, w, 14, p, time, seed, dir > 0 ? -1 : 1);
    const step = 34;
    const shift = (time * 30) % step;
    for (let cx = step / 2 + shift; cx < w - 4; cx += step) {
      const px = dir > 0 ? x + cx : x + w - cx;
      chevron(ctx, px, y, 5.4, dir, born * (0.45 + 0.5 * p) * clamp01(Math.min(cx, w - cx) / 12));
    }
  } else if (kind === 'donut') {
    // A ring round the boss with a safe middle: the ring fills in from outside, the middle stays
    // clear, softly mint and edged in calm white.
    const rx = w / 2;
    const ri = z?.inner ?? rx * 0.35;
    const ry = 9;
    const iry = ry * (ri / rx);
    const born = clamp01(springy(p / 0.12));
    const { r: rd, throb } = ready(p, time, seed);
    const annulus = (a, b) => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
      ctx.ellipse(x, y, a, b, 0, 0, TAU, true);
    };
    ctx.globalAlpha = born * (0.16 + 0.1 * p + 0.12 * throb);
    ctx.fillStyle = DANGER.fill;
    annulus(ri, iry);
    ctx.fill('evenodd');
    const fr = ri + (rx - ri) * (1 - p);
    ctx.globalAlpha = born * (0.3 + 0.24 * p + 0.1 * rd);
    ctx.fillStyle = DANGER.mid;
    annulus(fr, (ry * fr) / rx);
    ctx.fill('evenodd');
    ctx.globalAlpha = born * 0.22;
    ctx.fillStyle = '#dcfbe8';
    ctx.beginPath();
    ctx.ellipse(x, y, ri, iry, 0, 0, TAU);
    ctx.fill();
    const lw = (1.5 + 0.8 * p + 0.6 * throb) * (0.6 + 0.4 * born);
    ctx.globalAlpha = 1;
    softRing(ctx, x, y, rx, ry, lw, DANGER.edge, born * (0.8 + 0.2 * p));
    softRing(ctx, x, y, ri, iry, 1.4, '#ffffff', born * 0.9);
  } else if (kind === 'raid') {
    // A hit on everyone: soft rings sweeping out from the boss right across the room, each fading
    // in and out on its way, and a warm glow gathering on the boss.
    glowDisc(ctx, x, y - 20, 34 + 18 * p, '#ffd0dc', 0.2 + 0.3 * p);
    for (let k = 0; k < 3; k++) {
      const u = (time * 0.7 + k / 3 + seed * 0.01) % 1;
      softRing(ctx, x, y - 10, 30 + u * 420, 8 + u * 40, (2 + 2 * p) * (1 - u * 0.6), k % 2 ? '#ffd0dc' : '#ffb8ca', Math.sin(u * Math.PI) * (0.35 + 0.5 * p));
    }
  } else if (kind === 'buster' || kind === 'stack' || kind === 'spread') {
    // A marker on a member: a ring round them with arrows turning on it and an icon over their
    // head. Rose with arrows in for a tankbuster, gold with arrows in for a stack, violet with
    // arrows out for a spread.
    const col = MARKER_COL[kind];
    const rim = deep(col);
    const rx = w / 2;
    const ry = 7;
    const born = clamp01(springy(p / 0.12));
    ctx.globalAlpha = born * (0.16 + 0.2 * p);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    softRing(ctx, x, y, rx, ry, 1.6 + p, col, born * (0.65 + 0.35 * p));
    const out = kind === 'spread';
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + time * 0.6 * (out ? 1 : -1) + seed;
      const ang = Math.atan2(Math.sin(a) * ry, Math.cos(a) * rx);
      chevron(ctx, x + Math.cos(a) * (rx + (out ? 3 : -3)), y + Math.sin(a) * (ry + (out ? 1 : -1)), 4.4, 1, born * (0.7 + 0.3 * p), col, rim, out ? ang : ang + Math.PI);
    }
    // The icon over their head: a soft white disc on a ring of the marker's colour.
    const iy = y - 54 + Math.sin(time * 5 + seed) * 1.5;
    const ir = 10 * (0.8 + 0.2 * springy(p / 0.18));
    ctx.globalAlpha = born;
    ctx.beginPath();
    ctx.arc(x, iy, ir, 0, TAU);
    ctx.fillStyle = '#fffafc';
    ctx.fill();
    if (inked(ctx)) {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    if (kind === 'buster') {
      for (let k = 0; k < 2; k++) chevron(ctx, x, iy - 3.4 + k * 5.6, 4.2, 1, 1, col, rim, Math.PI / 2);
    } else {
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + Math.PI / 4;
        const d = out ? 5.8 : 5.2;
        chevron(ctx, x + Math.cos(a) * d, iy + Math.sin(a) * d, 3, 1, 1, col, rim, out ? a : a + Math.PI);
      }
    }
  }
  ctx.restore();
}

// The moment a telegraphed attack goes off; `t` runs 0..1 over about half a second.
export function drawZoneHit(ctx, kind, x, y, w, t, time) {
  const u = clamp01(t);
  ctx.save();
  // (world/bossfight.js's patterns: a soft burst and a ring rolling out where each one lands.)
  if (kind === 'raid' || kind === 'buster' || kind === 'stack' || kind === 'spread' || kind === 'donut' || kind === 'band') {
    hitBurst(ctx, kind === 'band' ? x + w / 2 : x, y, kind === 'raid' ? 360 : w / 2, u, HIT_COL[kind] ?? '#ff9fb8');
    ctx.restore();
    return;
  }
  const fade = 1 - sstep((u - 0.5) / 0.5);
  if (kind === 'circle') {
    // A burst of pink-violet spore clouds billowing out and up, a sparkle in the middle.
    const rx = w / 2;
    glowDisc(ctx, x, y - 8, rx * 0.6 + 10, '#f6c8ec', 0.45 * fade);
    const grow = easeOut(Math.min(1, u * 1.6));
    for (let k = 0; k < 4; k++) {
      const a = Math.PI + ((k + 0.5) / 4) * Math.PI;
      const s = pop(clamp01(u * 1.1 - k * 0.04), 0.3, 0.6);
      cloud(ctx, x + Math.cos(a) * rx * 0.75 * grow, y - 4 + Math.sin(a) * 10 * grow - u * 8, (5 + (k % 2) * 2.5) * s, k % 2 ? '#fbe4f6' : '#efe0fc', k % 2 ? '#e8bce2' : '#d6c0f2');
    }
    cloud(ctx, x, y - 8 - u * 10, 9 * pop(u, 0.3, 0.6), '#fdeefa', '#e6c0ea');
    softSparkle(ctx, x, y - 12 - u * 6, 9 * pop(u, 0.22, 0.6), '#f6b8ec');
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI * (0.25 + k * 0.25);
      const d = 6 + easeOut(u) * (rx + 8);
      softSparkle(ctx, x + Math.cos(a) * d, y - 6 + Math.sin(a) * d * 0.6, 2.8 * pop(u, 0.25, 0.55), k % 2 ? '#ffd0e6' : '#e4d0ff');
    }
  } else if (kind === 'lane') {
    // A soft dust trail rolling down the lane behind the charge, with rounded speed lines.
    const x0 = Math.min(x, x + w);
    const len = Math.abs(w);
    const dir = w < 0 ? -1 : 1;
    const head = easeOut(Math.min(1, u * 1.5));
    const hx = dir > 0 ? x0 + len * head : x0 + len * (1 - head);
    const s = springy(Math.min(1, u * 4)) * fade;
    for (let k = 0; k < 4; k++) cloud(ctx, hx - dir * (k * (len / 5) * head + 6), y - 3 - k * 0.6, (7.5 - k * 1.3) * s, DIRT[0], DIRT[1]);
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const ly = y - 6 - k * 4.5;
      const l = (24 + k * 10) * head;
      const sx = hx - dir * 10;
      ctx.globalAlpha = 0.85 * fade;
      ctx.beginPath();
      ctx.moveTo(sx, ly);
      ctx.lineTo(sx - dir * l, ly);
      if (inked(ctx)) {
        ctx.strokeStyle = '#cdbfe0';
        ctx.lineWidth = 2.8;
        ctx.stroke();
      }
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  } else if (kind === 'floor') {
    // A slam rolling out along the floor: a soft ring, dust clouds bouncing up behind its front,
    // and a rounded hump of floor pushed up at each edge of it.
    const cx = x + w / 2;
    const e = easeOut(u);
    const front = (w / 2) * e;
    glowDisc(ctx, cx, y - 6, 34, '#ffd6e2', 0.5 * fade * (1 - u));
    softSparkle(ctx, cx, y - 10, 12 * pop(u, 0.2, 0.6), '#ffc2d2');
    softRing(ctx, cx, y, front, 5 + e * 4, 4 * (1 - u) + 0.4, '#ffffff', fade);
    softRing(ctx, cx, y, front * 0.82, 4 + e * 3, 2 * (1 - u) + 0.3, '#ffb3c6', fade);
    for (let mx = 16; mx < w / 2; mx += 44) {
      const age = (front - mx) / (w / 2);
      if (age <= 0) continue;
      const k = pop(clamp01(age * 2.2), 0.3, 0.7) * (1 - u * 0.3);
      for (const s of [-1, 1]) cloud(ctx, cx + s * mx, y - 3 - age * 6, 5.5 * k, DIRT[0], DIRT[1]);
    }
    // (a soft dust crest riding each front, growing in as the front leaves the middle)
    const crest = 7 * (1 - u) * sstep(front / 24);
    for (const s of [-1, 1]) cloud(ctx, cx + s * front, y - 3, crest, '#fff4f6', '#f2c8d6');
  } else if (kind === 'thorns') {
    // Root spikes springing up out of the floor, holding, then sinking back down; soft dirt puffs.
    const rise = u < 0.22 ? springy(u / 0.22) : u < 0.6 ? 1 : 1 - sstep((u - 0.6) / 0.4);
    for (let tx = x + 6, i = 0; tx < x + w - 3; tx += 12, i++) {
      const tall = (14 + (i % 3) * 5) * rise;
      if (tall > 0.5) rootTip(ctx, tx, y + 1, tall, (i % 2 ? 1 : -1) * 1.4, 3.6);
    }
    if (u < 0.5) for (let tx = x + 14, i = 0; tx < x + w - 6; tx += 44, i++) cloud(ctx, tx + (i % 2) * 8, y - 1 - (i % 2), (3.6 + (i % 3) * 1.2) * pop(u / 0.5, 0.3, 0.6), '#f6e6da', '#d9bfae');
  }
  ctx.restore();
}

// ---------- Each dungeon's own seal (2026-11-22) ----------
// The roots belong to Rootwood Hollow; every other dungeon closes its exit its own way, the same
// size (48 wide, 76 tall), stirring a little over four drawings. Open, it's simply gone.

const SEAL_GLOW = { manor: '#c9a6ff', aquarium: '#9ff0f0', carnival: '#ffe08a', observatory: '#bcc8ff', volcano: '#ffb3d9', theatre: '#ffd36b', skywhale: '#cde8ff' };
const twinkle = (x, y, r, k = 0.34) => Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
});
// A board or rope from (x0, y0) to (x1, y1), `w` half wide, cut into `n` lengths coloured in turn.
function segments(x0, y0, x1, y1, w, n, cols) {
  const l = Math.hypot(x1 - x0, y1 - y0);
  const nx = (-(y1 - y0) / l) * w;
  const ny = ((x1 - x0) / l) * w;
  const out = [];
  for (let k = 0; k < n; k++) {
    const a = k / n;
    const b = (k + 1) / n;
    const p = (u) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
    const [ax, ay] = p(a);
    const [bx, by] = p(b);
    out.push(T([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]], cols[k % cols.length]));
  }
  return out;
}

const THEMED_SEALS = {
  // Moonlit Manor: a wrought-iron gate of spear-topped bars and a lilac padlock that sways.
  manor(f) {
    const iron = ramp('#4a3e66', 0.8);
    const out = [];
    for (const x of [6, 15, 24, 33, 42]) out.push(T([[x - 2.6, 10], [x, 2], [x + 2.6, 10]], iron.base), R(x - 1.2, 8, 2.4, 68, iron.base), F(R(x + 0.4, 8, 0.8, 68, iron.sh)));
    for (const y of [14, 66]) out.push(R(3, y, 42, 3, iron.base), F(R(3, y + 2, 42, 1, iron.sh)));
    for (const x of [10.5, 19.5, 28.5, 37.5]) out.push(T([[x, 19], [x + 2.6, 22], [x, 25], [x - 2.6, 22]], iron.base), T([[x, 58], [x + 2.6, 61], [x, 64], [x - 2.6, 61]], iron.base));
    const s = [0, 0.7, 0, -0.7][f];
    const lock = ramp('#c9a6ff', 0.8);
    out.push(band([[20 + s, 37], [20 + s, 31], [24 + s, 27.4], [28 + s, 31], [28 + s, 37]], () => 1.2, '#b8a8d8'));
    out.push(R(17.6 + s, 35, 12.8, 12, lock.base), F(R(27.4 + s, 35, 3, 12, lock.sh)), F(R(18.6 + s, 36, 1.2, 10, lock.hi)), F(E(24 + s, 39.6, 1.4, 1.4, '#3a3050')), F(T([[23.2 + s, 40.2], [24.8 + s, 40.2], [24 + s, 44], [24 + s, 44]], '#3a3050')));
    return out;
  },
  // The Sunken Aquarium Palace: kelp grown across the doorway, swaying, bubbles rising, a closed
  // clam holding its pearl in the middle.
  aquarium(f) {
    const ph = (f * Math.PI) / 2;
    const w = (k) => Math.sin(k + ph) * 1.6;
    const k1 = ramp('#5fc8a0', 0.8);
    const k2 = ramp('#8fe0b0', 0.8);
    const out = [];
    const strands = [
      [[5, 76], [3 + w(0), 56], [9 + w(1), 36], [5 + w(2), 16], [9, 2]],
      [[43, 76], [45 + w(1), 56], [39 + w(2), 36], [43 + w(3), 16], [39, 2]],
      [[2, 74], [16 + w(2), 58], [30 + w(3), 34], [46, 12]],
      [[46, 74], [32 + w(3), 58], [18 + w(4), 34], [2, 12]],
      [[24, 76], [22 + w(4), 60], [26 + w(5), 46], [22 + w(0), 24], [24, 4]],
    ];
    strands.forEach((p, i) => {
      const r = i % 2 ? k2 : k1;
      out.push(band(p, (u) => 2.6 - u * 1.2, r.base), F(band(p.map(([x, y]) => [x + 0.9, y]), (u) => 1 - u * 0.5, r.sh)));
    });
    for (const [x, y] of [[8, 66], [40, 60], [14, 22], [36, 26], [30, 70]]) {
      const yy = y - ((f * 3 + x) % 12);
      out.push(E(x, yy, 1.6, 1.6, '#e8fbff'), F(E(x - 0.5, yy - 0.5, 0.6, 0.6, '#ffffff')));
    }
    const P = Math.PI;
    const shell = ramp('#ffd6e0', 0.8);
    const arcPts = (y, r, a0, a1) => Array.from({ length: 9 }, (_, i) => [24 + Math.cos(a0 + ((a1 - a0) * i) / 8) * r, y + Math.sin(a0 + ((a1 - a0) * i) / 8) * r * 0.8]);
    out.push(T([[24, 41], ...arcPts(41, 10, P, 2 * P)], shell.base), T([[24, 41], ...arcPts(41, 10, 0, P)], shell.sh));
    for (let k = 1; k < 6; k++) {
      const a = P + (k * P) / 6;
      out.push(F(band([[24, 40.4], [24 + Math.cos(a) * 9, 41 + Math.sin(a) * 7.2]], () => 0.45, shell.sh)));
    }
    out.push(F(E(24, 41, 3.2 + (f % 2) * 0.3, 1.6, '#fbf6ff')), F(E(23.2, 40.6, 1, 0.6, '#ffffff')));
    return out;
  },
  // The Clockwork Carnival: two striped boards nailed across in an X, a ticket hung on them that
  // swings.
  carnival(f) {
    const red = '#ff6f7a';
    const cream = '#fff6e8';
    const out = [...segments(4, 8, 44, 70, 3.6, 8, [red, cream]), ...segments(44, 8, 4, 70, 3.6, 8, [cream, red])];
    for (const [x, y] of [[6, 11], [42, 11], [6, 67], [42, 67]]) out.push(F(E(x, y, 0.9, 0.9, '#7a5a6a')));
    const s = [0, 1, 0, -1][f];
    out.push(band([[24, 22], [17 + s, 32]], () => 0.4, '#7a5a6a'), band([[24, 22], [31 + s, 32]], () => 0.4, '#7a5a6a'), E(24, 22, 1, 1, '#ffd36b'));
    const t = [[14 + s, 32], [34 + s, 32], [34 + s, 35], [32.6 + s, 36.5], [34 + s, 38], [34 + s, 46], [14 + s, 46], [14 + s, 38], [15.4 + s, 36.5], [14 + s, 35]];
    out.push(T(t, '#ffe9b0'), F(R(17 + s, 34, 14, 10, '#fff6dc')));
    out.push(F(T(twinkle(24 + s, 39, 4.4, 0.45), '#ff6f7a')), F(E(24 + s, 39, 1.2, 1.2, '#ffd36b')));
    for (let k = 0; k < 6; k++) out.push(F(R(15.4 + s + k * 3.3, 44, 1.4, 0.8, '#e8c890')));
    return out;
  },
  // The Star Observatory: a net of starlight strung across the doorway, its stars twinkling in
  // turn, a ringed star holding it shut.
  observatory(f) {
    const pts = [[5, 6], [24, 3], [43, 6], [9, 26], [39, 24], [24, 40], [5, 50], [43, 52], [14, 72], [34, 72]];
    const links = [[0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 5], [1, 5], [3, 6], [4, 7], [5, 8], [5, 9], [6, 8], [7, 9], [8, 9], [3, 4]];
    const out = [];
    for (const [a, b] of links) out.push(F(band([pts[a], pts[b]], () => 0.55, '#9fb0ff')), F(band([pts[a], pts[b]], () => 0.22, '#e8eeff')));
    pts.forEach(([x, y], i) => {
      if (i === 5) return;
      const big = (i + f) % 4 === 0;
      out.push(T(twinkle(x, y, big ? 4 : 2.6), '#fff3a6'), F(E(x, y, 0.8, 0.8, '#ffffff')));
    });
    const brass = ramp('#e8b85a', 0.85);
    out.push(E(24, 40, 8, 8, brass.base), F(E(24.6, 40.6, 6.4, 6.4, brass.sh)), F(E(24, 40, 5.8, 5.8, '#3a3a7a')), F(T(twinkle(24, 40, 4.6 + (f % 2) * 0.4, 0.4), '#fff3a6')), F(E(24, 40, 1, 1, '#ffffff')));
    return out;
  },
  // The Candy Volcano: candy-cane bars, two licorice whips twisted across them, a wrapped sweet
  // for a lock that sways.
  volcano(f) {
    const out = [];
    for (const x of [8, 24, 40]) {
      out.push(R(x - 3, 6, 6, 70, '#fffaf6'), F(R(x + 1.6, 6, 1.4, 70, '#efe2ec')), E(x, 6, 3, 2, '#fffaf6'));
      for (let y = 8; y < 74; y += 7) out.push(F(T([[x - 3, y + 3], [x + 3, y], [x + 3, y + 3], [x - 3, y + 6]], '#ff6f8a')));
    }
    const lic = ['#7a3a5a', '#9a4a6a'];
    out.push(...segments(2, 16, 46, 60, 2.4, 12, lic), ...segments(46, 16, 2, 60, 2.4, 12, lic));
    const s = [0, 0.7, 0, -0.7][f];
    const sweet = ramp('#ffb3d9', 0.8);
    out.push(T([[15 + s, 34], [19 + s, 38], [15 + s, 42]], '#c9a6ff'), T([[33 + s, 34], [29 + s, 38], [33 + s, 42]], '#c9a6ff'));
    out.push(E(24 + s, 38, 6.4, 5, sweet.base), F(E(25 + s, 39, 5, 3.6, sweet.sh)), F(E(23.6 + s, 37.4, 5, 3.4, sweet.base)), F(band([[20 + s, 36], [24 + s, 40], [28 + s, 36]], () => 0.6, '#ffffff')), F(E(21.6 + s, 35.8, 1.2, 0.8, '#ffffff')));
    return out;
  },
  // The Dream Theatre: the curtain is down. Red velvet in deep folds that stir, a gold valance and
  // fringe, a gold star where the two halves meet.
  theatre(f) {
    const velvet = ramp('#c8304e', 0.85);
    const gold = ramp('#f2c14e', 0.8);
    const ph = (f * Math.PI) / 2;
    const out = [];
    // Each half hangs inside the doorway, flaring a little to a scalloped hem at the floor.
    for (const s of [-1, 1]) {
      const X = (v) => 24 + s * v;
      const hem = Array.from({ length: 7 }, (_, i) => [X(18.4 - i * 3.1), 73.4 + (i % 2) * 1.4]);
      out.push(T([[X(0), 9], [X(16.4), 9], [X(16.8), 40], ...hem, [X(0), 74]], velvet.base));
      for (let k = 0; k < 3; k++) {
        const x = 3 + k * 5.4;
        const sway = Math.sin(ph + k * 1.7 + (s > 0 ? 1 : 0)) * 0.8;
        out.push(F(T([[X(x), 10], [X(x + 1.4), 10], [X(x + 2.2 + k * 0.4) + sway, 72], [X(x - 0.6) + sway, 72]], velvet.sh)));
        out.push(F(T([[X(x + 3), 11], [X(x + 3.6), 11], [X(x + 4.4 + k * 0.4) + sway, 70], [X(x + 3.4) + sway, 70]], velvet.hi)));
      }
      for (let i = 0; i < 6; i++) {
        const [hx, hy] = hem[i];
        out.push(F(R(Math.min(hx, hem[i + 1][0]), hy - 0.6, 3.1, 1.2, gold.base)));
      }
    }
    out.push(F(R(23.5, 9, 1, 65, velvet.deep)));
    out.push(R(5, 4, 38, 6, gold.base), F(R(5, 8.6, 38, 1.4, gold.sh)), F(R(5, 4, 38, 1, gold.hi)));
    for (let k = 0; k < 5; k++) out.push(E(8.8 + k * 7.6, 10.4, 3.8, 2.6, velvet.base), F(E(8.8 + k * 7.6, 11, 3, 1.6, velvet.sh)));
    out.push(E(24, 38, 6, 6, gold.base), F(E(24.6, 38.6, 4.6, 4.6, gold.sh)), F(E(24, 38, 4.4, 4.4, gold.base)), F(T(twinkle(24, 38, 3.8, 0.45), '#fff3a6')));
    return out;
  },
  // Cloudcatch Pier and the Sky Whale: a cargo net hooked across the doorway, its knots, a brass
  // bell hung in the middle that swings.
  skywhale(f) {
    const rope = ramp('#e8d29a', 0.8);
    const out = [];
    const sag = (y) => Math.sin((y / 76) * Math.PI) * [1, 1.6, 1, 0.4][f];
    const lines = [];
    for (let c = -40; c <= 48; c += 11) for (const s of [0.6, -0.6]) {
      const c0 = s > 0 ? c : c + 46;
      let y0 = 4;
      let y1 = 74;
      const ya = (3 - c0) / s;
      const yb = (45 - c0) / s;
      y0 = Math.max(y0, Math.min(ya, yb));
      y1 = Math.min(y1, Math.max(ya, yb));
      if (y1 - y0 < 4) continue;
      lines.push([c0, s, y0, y1]);
      out.push(band([[c0 + s * y0 + sag(y0), y0], [c0 + s * y1 + sag(y1), y1]], () => 0.8, rope.base));
    }
    for (const [ca, sa] of lines) for (const [cb, sb] of lines) {
      if (sa <= 0 || sb >= 0) continue;
      const y = (cb - ca) / (sa - sb);
      const x = ca + sa * y;
      if (y > 5 && y < 73 && x > 3 && x < 45) out.push(E(x + sag(y), y, 1.3, 1.1, rope.sh));
    }
    out.push(R(1, 2, 46, 3, '#b48a6a'), F(R(1, 4, 46, 1, '#8a6a5a')));
    const s = [0, 1.2, 0, -1.2][f];
    const brass = ramp('#e8b85a', 0.85);
    out.push(band([[24, 5], [24 + s * 0.4, 30]], () => 0.5, '#8a6a5a'));
    out.push(T([[20 + s, 40], [21 + s, 32], [24 + s, 30], [27 + s, 32], [28 + s, 40], [29.4 + s, 42], [18.6 + s, 42]], brass.base), F(T([[24 + s, 30], [27 + s, 32], [28 + s, 40], [29.4 + s, 42], [24 + s, 42]], brass.sh)), F(R(21.6 + s, 33, 1, 7, brass.hi)), E(24 + s * 1.3, 43.4, 1.6, 1.4, brass.deep));
    return out;
  },
};
const themedSealArt = (kind, f) => art(`dg-seal-${kind}|${f}`, 48, 76, () => THEMED_SEALS[kind](f).filter(Boolean), false);

function drawThemedSeal(ctx, kind, x, y, open, time) {
  if (open) return;
  const c = SEAL_GLOW[kind];
  shadow(ctx, x, y, 24, 0.2);
  const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
  const f = Math.floor(time * 3.2) % 4;
  glow(ctx, x, y - 38, 26 + pulse * 5, c, 0.4 + pulse * 0.25);
  place(ctx, themedSealArt(kind, f), x, y);
  glow(ctx, x, y - 38, 7 + pulse * 2, '#ffffff', 0.25 + pulse * 0.25);
  ctx.globalAlpha = 0.6 + 0.4 * pulse;
  sparkle(ctx, x + 6, y - 46, 1.6 + pulse, '#ffffff');
  ctx.globalAlpha = 1;
}
