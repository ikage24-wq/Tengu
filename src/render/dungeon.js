// Interactive dungeon objects for Rootwood Hollow, in the scenery's outlined chibi style: lamp
// mushrooms to light, root cages holding sprouts, thorny root seals over doorways, treasure chests,
// root keys, and the floor telegraphs for boss attacks with the bursts they end in. Everything is
// drawn in screen space with (x, y) the bottom center on the floor; `time` (seconds) animates.

import { R, E, T, F, shade } from './pixel.js';
import { art, place, face } from './scenery.js';
import { puff, crown, shock, wisp, starFlash, easeOut } from './fxkit.js';

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
  ctx.font = 'bold 6px sans-serif';
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

function glowcapArt(lit, blink) {
  const cap = lit ? '#ffcf7a' : '#9aa8c6';
  const stalk = lit ? '#fff4e0' : '#dad8e4';
  const spot = lit ? '#c4fff2' : '#c2cadc';
  return art(`dg-glowcap|${lit}|${blink}`, 24, 36, () => [
    E(12, 35, 7.4, 1.4, stalk), R(7.4, 18, 9.2, 17, stalk),
    T([[0.8, 20], [2.2, 12], [6.4, 5.4], [12, 3], [17.6, 5.4], [21.8, 12], [23.2, 20]], cap),
    F(E(12, 20, 10.4, 1.3, shade(cap, -14))),
    F(E(6.4, 11.4, 2, 1.6, spot)), F(E(14.6, 7.4, 2.4, 1.6, spot)), F(E(18.6, 14, 1.6, 1.2, spot)), F(E(10.6, 15, 1.2, 1, spot)),
    ...face(12, 26.4, 2.2, lit ? (blink ? 'closed' : 'happy') : 'closed', lit ? 'smile' : 'o'),
  ]);
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
  place(ctx, glowcapArt(true, blinking(time, 0.3)), 0, 0);
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

function sproutArt(happy, frame) {
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

// `strain` 0..2 bows the bars outward; `j` shifts them a hair to make them shudder.
function cageArt(strain, j) {
  return art(`dg-cage|${strain}|${j}`, 32, 36, () => {
    const out = [];
    const bow = strain * 1.3;
    for (const [i, xb] of [2.6, 9.4, 22.6, 29.4].entries()) {
      const s = Math.sign(xb - 16);
      const top = 16 + (xb - 16) * 0.22;
      const jit = j && strain ? (i % 2 ? 0.5 : -0.5) : 0;
      out.push(band(curve(xb, 33, xb + s * (2 + bow) + jit, 12, top, 4.4), (u) => 1.5 - u * 0.5, i % 2 ? ROOT_LIGHT : ROOT));
    }
    // Woven cross roots and a mossy knot on top with a leaf.
    out.push(band(curve(1.6, 19, 16, 21.4 + bow, 30.4, 19), () => 1.1, ROOT_LIGHT), band(curve(5.4, 10.4, 16, 12.6 + bow * 0.6, 26.6, 10.4), () => 0.9, ROOT));
    out.push(R(1, 31.4, 30, 4.4, ROOT_DEEP), E(16, 31.4, 15, 1.6, ROOT), F(E(9, 33.6, 2.4, 0.6, shade(ROOT_DEEP, 8))), F(E(23, 33.6, 2.4, 0.6, shade(ROOT_DEEP, 8))));
    out.push(E(16, 4.4, 4, 3, ROOT), E(13.6, 2.8, 2.4, 1.4, MOSS), T([[17, 2.4], [19.6, -0.4], [22.4, 0.2], [20, 2.6]], LEAF));
    return out;
  });
}

function cageOpenArt() {
  return art('dg-cage-open', 36, 14, () => {
    const out = [];
    for (const [i, [xb, dx, len]] of [[5, -4, 8], [11, -2, 6], [18, 0.6, 7], [25, 2.4, 6], [31, 4, 9]].entries()) {
      const pts = curve(xb, 12, xb + dx * 0.4, 12 - len * 0.6, xb + dx, 12 - len, 4);
      out.push(band(pts, () => 1.5, i % 2 ? ROOT_LIGHT : ROOT));
      const [tx, ty] = pts[4];
      // Snapped ends showing pale wood inside.
      out.push(T([[tx - 1.6, ty + 0.6], [tx - 0.6, ty - 1.6], [tx + 0.2, ty], [tx + 1.2, ty - 1.4], [tx + 1.6, ty + 0.6]], WOOD_IN));
    }
    out.push(R(3, 10, 30, 4, ROOT_DEEP), E(18, 10, 15, 1.4, ROOT), E(8, 9, 3, 1.4, MOSS));
    return out;
  });
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
      const c = i % 2 ? THORN_ROOT2 : THORN_ROOT;
      out.push(band(r, (u) => (i < 2 ? 4 : 2.8) - u * (i < 2 ? 1.4 : 1), c));
      // Thorns along it, alternating sides.
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
        out.push(T([[mx + nx * base - tx * 1.8, my + ny * base - ty * 1.8], [mx + nx * (base + 4) + tx * 1.2, my + ny * (base + 4) + ty * 1.2], [mx + nx * base + tx * 1.8, my + ny * base + ty * 1.8]], THORN));
      }
    });
    // The leaf-lock: a round wooden boss with a glowing leaf and a keyhole.
    out.push(E(24, 40, 8.6, 8.6, ROOT_DEEP), E(24, 40, 6.6, 6.6, '#c99a7a'), T([[24, 33.4], [28.4, 37.6], [26.4, 43], [24, 44.6], [21.6, 43], [19.6, 37.6]], LEAF),
      F(R(23.6, 35, 0.8, 9, '#d8ffe8')), F(E(24, 46.4, 1.2, 1.2, INK)), F(T([[23.3, 46.8], [24.7, 46.8], [25.2, 49], [22.8, 49]], INK)));
    return out;
  });
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
export function drawSeal(ctx, x, y, open, time) {
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
  ctx.restore();
  glow(ctx, x, y - 37, 7 + pulse * 2, '#d8ffe8', 0.35 + pulse * 0.3);
  ctx.globalAlpha = 0.6 + 0.4 * pulse;
  sparkle(ctx, x + 6, y - 46, 1.6 + pulse, '#e6fff0');
  ctx.globalAlpha = 1;
}

// ---------- Chest ----------

function chestArt(open) {
  const lift = open ? 9 : 0;
  return art(`dg-chest|${open}`, 36, 28 + lift, () => {
    const b = 12 + lift;
    const out = [];
    if (open) {
      // The lid tipped back, seen from inside, and the treasure peeking out.
      out.push(T([[3.4, b + 1], [0.6, 1.4], [35.4, 1.4], [32.6, b + 1]], '#c98d68'), T([[5.6, b], [3.6, 4], [32.4, 4], [30.4, b]], '#8a5a48'),
        R(0.6, 0.4, 34.8, 2.6, GOLD), E(18, b - 0.6, 13.4, 4.2, GOLD), E(10, b - 1.4, 4, 2.4, '#ffe38a'), E(25, b - 2, 4.4, 2.6, '#ffe38a'),
        F(E(12, b - 2, 1.6, 0.8, '#fff6c9')), F(E(21, b - 3.4, 1.6, 0.8, '#fff6c9')), F(E(26, b - 3, 1.4, 0.7, '#fff6c9')), E(16.6, b - 3.2, 1.6, 1.6, '#ff9ec0'), F(E(16.2, b - 3.6, 0.5, 0.5, '#ffffff')));
    } else {
      out.push(T([[2, 13], [3, 6], [8, 2.4], [18, 1.4], [28, 2.4], [33, 6], [34, 13]], '#c98d68'), F(E(12, 5, 4, 1, '#e3ad88')));
    }
    out.push(R(2, b, 32, 15, '#b9805e'), F(R(4, b + 6, 28, 0.8, '#a06c50')), F(R(4, b + 10.4, 28, 0.8, '#a06c50')),
      R(6, b + (open ? 0 : -10), 2.6, open ? 15 : 25, GOLD), R(27.4, b + (open ? 0 : -10), 2.6, open ? 15 : 25, GOLD), R(1.6, b - 0.6, 32.8, 2.4, GOLD),
      T([[2, b + 15], [2, b + 10], [6, b + 13], [5, b + 15]], LEAF), T([[34, b + 15], [34, b + 10], [30, b + 13], [31, b + 15]], LEAF),
      // The leaf clasp.
      T([[18, b - 3], [21.6, b + 1.6], [18, b + 7], [14.4, b + 1.6]], GOLD), F(T([[18, b - 1], [19.8, b + 1.8], [18, b + 4.6], [16.2, b + 1.8]], LEAF)), F(R(17.7, b - 0.4, 0.6, 4.6, '#d8ffe8')));
    return out;
  });
}

// A root-wood treasure chest about 36 wide and 28 tall, trimmed in gold with a leaf clasp.
// Closed, sparkles twinkle on it; open, the lid tips back and golden light pours out.
export function drawChest(ctx, x, y, open, time) {
  shadow(ctx, x, y, 17);
  if (!open) {
    place(ctx, chestArt(false), x, y);
    for (let k = 0; k < 3; k++) {
      const tw = Math.max(0, Math.sin(time * 2.6 + k * 2.1));
      ctx.globalAlpha = tw;
      sparkle(ctx, x + [-11, 9, 15][k], y - [22, 26, 12][k], 1 + tw * 2, k === 1 ? '#ffffff' : '#fff1a6');
    }
    ctx.globalAlpha = 1;
    return;
  }
  const oy = y - 17;
  glow(ctx, x, oy, 28, '#ffe38a', 0.55);
  place(ctx, chestArt(true), x, y);
  // Beams fanning up out of the chest.
  ctx.save();
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k - 2) * 0.3 + Math.sin(time * 0.9 + k) * 0.05;
    const len = 34 + Math.sin(time * 2 + k * 1.7) * 5 + (k % 2 ? 0 : 8);
    const g = ctx.createLinearGradient(x, oy, x + Math.cos(a) * len, oy + Math.sin(a) * len);
    g.addColorStop(0, 'rgba(255,240,170,0.6)');
    g.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = g;
    const half = 0.09;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 3, oy);
    ctx.lineTo(x + Math.cos(a - half) * len, oy + Math.sin(a - half) * len);
    ctx.lineTo(x + Math.cos(a + half) * len, oy + Math.sin(a + half) * len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  for (let k = 0; k < 5; k++) {
    const u = (time * 0.7 + k / 5) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI);
    sparkle(ctx, x + Math.sin(k * 2.3 + u * 3) * 12, oy - 4 - u * 30, 1.4 + (k % 2), k % 2 ? '#ffffff' : '#ffe36b');
  }
  ctx.globalAlpha = 1;
}

// ---------- Root key ----------

const rootKeyArt = () => art('dg-rootkey', 12, 22, () => [
  band([[6, 9], [5.6, 12], [6.4, 16], [6, 21]], () => 1.3, ROOT), R(6.6, 15.6, 3.2, 1.6, ROOT), R(6.6, 18.8, 2.4, 1.6, ROOT),
  T([[5.4, 13], [3, 12.4], [2.6, 14]], MOSS),
  T([[6, 0.4], [10.4, 3.6], [10.4, 7], [6, 10], [1.6, 7], [1.6, 3.6]], LEAF), F(E(6, 5.2, 1.8, 2.2, '#5fbf8a')), F(E(6, 5.2, 0.9, 1.2, '#d8ffe8')),
]);

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
  ctx.globalAlpha = 1;
}

// ---------- Boss attack telegraphs ----------

const WARN = '#ff7f9a';
const WARN_SOFT = '#ff9fb8';
const WARN_HOT = '#fff0f4';

// The fill and edge strength for a warning `p` of the way to going off; the last 15% flashes.
function warnStyle(p, time) {
  const flash = p > 0.85 && Math.floor(time * 14) % 2 === 0;
  return { fill: flash ? WARN_HOT : WARN_SOFT, fillA: 0.26 + p * 0.26 + (flash ? 0.25 : 0), edgeA: 0.55 + p * 0.45, edgeW: 1 + p * 0.8, flash };
}

// A dashed "stitched" outline that marches slowly, with a soft white under-stroke.
function stitched(ctx, path, s, time) {
  ctx.save();
  ctx.globalAlpha = s.edgeA * 0.6;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = s.edgeW + 1.6;
  path();
  ctx.stroke();
  ctx.globalAlpha = s.edgeA;
  ctx.strokeStyle = s.flash ? '#ff5f80' : WARN;
  ctx.lineWidth = s.edgeW;
  ctx.setLineDash([4, 2.6]);
  ctx.lineDashOffset = -time * 8;
  path();
  ctx.stroke();
  ctx.restore();
}

// A floor warning for a boss attack. `kind`: 'circle' (a spore patch w wide centered on x),
// 'lane' (a charge path from x to x + w; a negative w charges left), 'floor' (the floor from x to
// x + w is about to be slammed), or 'thorns' (spikes will erupt from x to x + w). `progress` 0..1
// fills it in as the attack winds up.
export function drawZone(ctx, kind, x, y, w, progress, time) {
  const p = Math.max(0, Math.min(1, progress));
  const s = warnStyle(p, time);
  ctx.save();
  if (kind === 'circle') {
    const rx = w / 2;
    const ry = 7;
    const shape = () => {
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    };
    ctx.globalAlpha = s.fillA;
    ctx.fillStyle = s.fill;
    shape();
    ctx.fill();
    // The inner patch grows toward the edge.
    ctx.globalAlpha = 0.25 + p * 0.35;
    ctx.fillStyle = WARN;
    ctx.beginPath();
    ctx.ellipse(x, y, rx * p, ry * p, 0, 0, TAU);
    ctx.fill();
    stitched(ctx, shape, s, time);
    // Little spores bubbling up.
    for (let k = 0; k < 4; k++) {
      const u = (time * 0.8 + k / 4) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI) * (0.4 + p * 0.6);
      ctx.fillStyle = k % 2 ? '#f6b8ec' : '#d8a6f0';
      ctx.beginPath();
      ctx.arc(x + (k - 1.5) * rx * 0.45, y - u * (6 + p * 8), 1.2 + p, 0, TAU);
      ctx.fill();
    }
  } else if (kind === 'lane') {
    const x0 = Math.min(x, x + w);
    const len = Math.abs(w);
    const dir = w < 0 ? -1 : 1;
    const h = 12;
    const shape = () => {
      ctx.beginPath();
      ctx.roundRect(x0, y - h / 2, len, h, h / 2);
    };
    ctx.globalAlpha = s.fillA;
    ctx.fillStyle = s.fill;
    shape();
    ctx.fill();
    // The fill runs from the start down the lane.
    ctx.globalAlpha = 0.22 + p * 0.3;
    ctx.fillStyle = WARN;
    ctx.beginPath();
    ctx.roundRect(dir > 0 ? x0 : x0 + len * (1 - p), y - h / 2, len * p, h, h / 2);
    ctx.fill();
    stitched(ctx, shape, s, time);
    // Chevrons sliding the way the charge will go.
    ctx.globalAlpha = 0.5 + p * 0.5;
    ctx.fillStyle = '#ffffff';
    const step = 18;
    const shift = (time * 30) % step;
    for (let cx = step / 2 + shift; cx < len - 4; cx += step) {
      const px = dir > 0 ? x0 + cx : x0 + len - cx;
      ctx.beginPath();
      ctx.moveTo(px - dir * 3, y - 3.4);
      ctx.lineTo(px + dir * 1.6, y);
      ctx.lineTo(px - dir * 3, y + 3.4);
      ctx.lineTo(px - dir * 1.4, y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (kind === 'floor') {
    const h = 16;
    const shape = () => {
      ctx.beginPath();
      ctx.roundRect(x, y - h / 2, w, h, 6);
    };
    ctx.globalAlpha = s.fillA;
    ctx.fillStyle = s.fill;
    shape();
    ctx.fill();
    ctx.globalAlpha = 0.2 + p * 0.3;
    ctx.fillStyle = WARN;
    ctx.beginPath();
    ctx.roundRect(x + (w / 2) * (1 - p), y - h / 2, w * p, h, 6);
    ctx.fill();
    // Ripples pulsing out from the middle, faster as it nears.
    const n = 3;
    for (let k = 0; k < n; k++) {
      const u = (time * (0.8 + p * 1.4) + k / n) % 1;
      ctx.globalAlpha = (1 - u) * (0.4 + p * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y, Math.max(1, (w / 2) * u), Math.max(0.5, (h / 2 - 1) * u), 0, 0, TAU);
      ctx.stroke();
    }
    stitched(ctx, shape, s, time);
    // Bold "!" marks along it.
    ctx.globalAlpha = 0.45 + p * 0.55;
    ctx.fillStyle = s.flash ? '#ff5f80' : '#ffffff';
    for (let mx = x + 40; mx < x + w - 20; mx += 80) {
      ctx.fillRect(Math.round(mx - 1), Math.round(y - 5), 2, 6);
      ctx.fillRect(Math.round(mx - 1), Math.round(y + 2.4), 2, 2);
    }
  } else if (kind === 'thorns') {
    const h = 10;
    const shape = () => {
      ctx.beginPath();
      ctx.roundRect(x, y - h / 2, w, h, 4);
    };
    ctx.globalAlpha = s.fillA;
    ctx.fillStyle = s.fill;
    shape();
    ctx.fill();
    stitched(ctx, shape, s, time);
    // Thorn tips poking up through the dirt, rising and trembling as it nears.
    const tip = 1 + p * 4;
    for (let tx = x + 6; tx < x + w - 3; tx += 10) {
      const shake = p > 0.6 ? Math.sin(time * 50 + tx) * 0.6 : 0;
      ctx.globalAlpha = 0.6 + p * 0.4;
      ctx.fillStyle = THORN_ROOT;
      ctx.beginPath();
      ctx.moveTo(tx - 2.4 + shake, y + 1);
      ctx.lineTo(tx + shake, y + 1 - tip);
      ctx.lineTo(tx + 2.4 + shake, y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6a4a50';
      ctx.beginPath();
      ctx.ellipse(tx, y + 1.4, 3.4, 1.2, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

// The moment a telegraphed attack goes off; `t` runs 0..1 over about half a second.
export function drawZoneHit(ctx, kind, x, y, w, t, time) {
  const u = Math.max(0, Math.min(1, t));
  ctx.save();
  if (kind === 'circle') {
    // A burst of pink-violet spore puffs billowing out and up.
    const rx = w / 2;
    if (u < 0.25) starFlash(ctx, x, y - 6, 10 + u * 40, 6, 0.3, '#f6b8ec', '#ffffff');
    const grow = easeOut(Math.min(1, u * 1.6));
    const fade = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
    for (let k = 0; k < 7; k++) {
      const a = Math.PI + (k / 6) * Math.PI;
      const px = x + Math.cos(a) * rx * 0.8 * grow;
      const py = y - 4 + Math.sin(a) * 12 * grow - u * 8;
      puff(ctx, px, py, (5 + (k % 3) * 2) * fade * (0.5 + grow * 0.6), k % 2 ? '#f7d0f0' : '#e4c4fa', '#c79ae0');
    }
    puff(ctx, x, y - 8 - u * 10, 9 * fade * (0.4 + grow * 0.7), '#fbe0f6', '#d6a6e6');
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI * (0.1 + (k / 5) * 0.8);
      const d = 6 + easeOut(u) * (rx + 10);
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = k % 2 ? '#ffb0d0' : '#c9a6ff';
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y - 6 + Math.sin(a) * d * 0.6, 1.6, 0, TAU);
      ctx.fill();
    }
  } else if (kind === 'lane') {
    // A dust streak tearing down the lane behind the charge.
    const x0 = Math.min(x, x + w);
    const len = Math.abs(w);
    const dir = w < 0 ? -1 : 1;
    const head = easeOut(Math.min(1, u * 1.5));
    const fade = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
    const hx = dir > 0 ? x0 + len * head : x0 + len * (1 - head);
    for (let k = 0; k < 6; k++) {
      const back = k * (len / 7) * head;
      const bx = hx - dir * back;
      wisp(ctx, bx, y + 1, (30 - k * 2) * fade, (13 - k * 1.2) * fade, dir, '#fff4ea', '#d8b8aa');
      puff(ctx, bx - dir * 8, y - 3, (5 - k * 0.5) * fade, '#fff4ea', '#d8b8aa');
    }
    ctx.globalAlpha = 0.8 * fade;
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 4; k++) {
      const ly = y - 4 - k * 4;
      const l = (30 + k * 10) * head;
      ctx.fillRect(Math.round(dir > 0 ? hx - l - 8 : hx + 8), Math.round(ly), Math.round(l), 1);
    }
  } else if (kind === 'floor') {
    // A slam shockwave rippling out along the floor, kicking up a dust crown at its front and
    // leaving puffs behind.
    const cx = x + w / 2;
    const e = easeOut(u);
    const front = (w / 2) * e;
    if (u < 0.2) starFlash(ctx, cx, y - 4, 12 + u * 50, 8, 0.2, '#ffd0dc', '#ffffff');
    for (let k = 0; k < 2; k++) {
      const v = Math.max(0, e - k * 0.2);
      shock(ctx, cx, y, (w / 2) * v, 5 + v * 4, (1 - u) * (5 - k * 2), k ? '#ffb3c6' : '#ffffff');
    }
    for (let mx = 12; mx < w / 2; mx += 26) {
      const age = (front - mx) / (w / 2);
      if (age <= 0) continue;
      const r = 5 * Math.max(0, 1 - age * 2.2) * (1 - u * 0.4);
      for (const s of [-1, 1]) puff(ctx, cx + s * mx, y - 2 - age * 6, r, '#fff4ea', '#d8b8aa');
    }
    for (const s of [-1, 1]) crown(ctx, cx + s * front, y + 1, 14 * (1 - u), 6, 4, '#ffc2d2', '#ffffff');
  } else if (kind === 'thorns') {
    // Root spikes stabbing up out of the floor, holding, then sinking back down.
    const rise = u < 0.2 ? easeOut(u / 0.2) : u < 0.6 ? 1 : 1 - easeOut((u - 0.6) / 0.4);
    for (let tx = x + 6, i = 0; tx < x + w - 3; tx += 10, i++) {
      const tall = (14 + (i % 3) * 5) * rise;
      if (tall < 0.5) continue;
      const lean = (i % 2 ? 1 : -1) * 1.4;
      ctx.fillStyle = THORN_ROOT;
      ctx.strokeStyle = '#5a3a48';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(tx - 3.4, y + 1);
      ctx.quadraticCurveTo(tx - 1.6 + lean * 0.4, y - tall * 0.5, tx + lean, y - tall);
      ctx.quadraticCurveTo(tx + 1.6 + lean * 0.4, y - tall * 0.5, tx + 3.4, y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = THORN;
      ctx.beginPath();
      ctx.moveTo(tx - 1, y - tall * 0.25);
      ctx.quadraticCurveTo(tx - 0.4 + lean * 0.3, y - tall * 0.6, tx + lean, y - tall + 1);
      ctx.lineTo(tx + 0.2, y - tall * 0.25);
      ctx.closePath();
      ctx.fill();
    }
    if (u < 0.45) {
      for (let tx = x + 6; tx < x + w - 3; tx += 20) crown(ctx, tx + 5, y + 1, 6 * (1 - u / 0.45), 5, 3, '#d9bfae', '#f6e6da');
    }
  }
  ctx.restore();
}
