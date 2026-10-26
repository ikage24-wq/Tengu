// Comic-book impact balloons for heavy blows (POW!, WHAM!, YEET!): a jagged starburst with chunky
// text that pops in, holds, then drifts up and fades. Drawn from progress `p` (0-1) at (x, y), the
// top of the monster in screen space.

import { easeOut, easeIn } from './fxkit.js';

const TAU = Math.PI * 2;
const INK = '#3a2d4f';
const FONT = '"Arial Black", "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function hashStr(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Fill the current path, then outline it in ink.
function inked(ctx, fill, lw = 2.5) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.stroke();
}

// A soft four-pointed twinkle.
function twinkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

const COMIC_COLORS = ['#ff8fc7', '#ffd84d', '#8fe3ff', '#b9f28c', '#c6a8ff', '#ffb37a'];

function comicBalloon(ctx, f, x, y, p) {
  const text = String(f.text ?? 'POW!');
  const h = hashStr(text + (f.seed ?? ''));
  const big = f.big ? 1.5 : 1;
  const color = f.color ?? COMIC_COLORS[h % COMIC_COLORS.length];
  // Pop in with an overshoot, hold, then drift up and fade.
  let s;
  if (p < 0.09) s = 1.25 * easeOut(p / 0.09);
  else if (p < 0.15) s = lerp(1.25, 1, (p - 0.09) / 0.06);
  else s = 1 + Math.sin(p * 30) * 0.015;
  const drift = easeIn(seg(p, 0.55, 1)) * 16;
  const alpha = 1 - easeIn(seg(p, 0.6, 1));
  if (s <= 0.01 || alpha <= 0) return;
  const size = Math.round(15 * big);
  ctx.save();
  ctx.font = `900 ${size}px ${FONT}`;
  const tw = ctx.measureText(text).width;
  ctx.globalAlpha = alpha;
  ctx.translate(x, y - 20 * big - drift);
  ctx.rotate(((h % 7) - 3) * 0.055);
  ctx.scale(s, s);
  // The jagged starburst: white with an inner colored burst.
  const rx = tw / 2 + 16 * big;
  const ry = 19 * big;
  const n = 16;
  const burst = (k) => {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * TAU + (h % 5) * 0.07;
      const j = rand(h + i * 1.7);
      const rr = i % 2 ? 0.78 + j * 0.06 : 1.05 + j * 0.28;
      ctx.lineTo(Math.cos(a) * rx * rr * k, Math.sin(a) * ry * rr * k);
    }
    ctx.closePath();
  };
  ctx.lineJoin = 'round';
  burst(1);
  inked(ctx, '#ffffff', 3);
  burst(0.8);
  ctx.fillStyle = color;
  ctx.fill();
  // Chunky text: drop shadow, thick ink outline, white-cream fill.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.fillStyle = INK;
  ctx.fillText(text, 1.5, 3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5 * big;
  ctx.strokeText(text, 0, 1);
  ctx.fillStyle = '#fffdf2';
  ctx.fillText(text, 0, 1);
  // A tiny shine sparkle on the corner.
  twinkle(ctx, rx * 0.72, -ry * 0.7, 4 * big, '#ffffff');
  ctx.restore();
}

export function drawComic(ctx, f, x, y, p) {
  ctx.save();
  comicBalloon(ctx, f, x, y, Math.max(0, Math.min(1, p)));
  ctx.restore();
}
