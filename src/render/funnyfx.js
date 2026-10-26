// Silly skill effects: comic-book impact balloons, a giant squeaky hammer, a falling rubber duck,
// a spinning baguette, banana peels, a disco ball, and a frying-pan bonk. Cosmetic only; the game
// logic does the damage. Flat pastel tones with thick plum outlines, drawn from progress `p` (0-1).
// (x, y) is f.x/f.y minus the camera; any other positions in `f` are world coords.

import { starFlash, puff, crescent, shock, easeOut, easeIn } from './fxkit.js';

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
// Overshoot ease: past 1 then back (for pops and landings).
const easeBack = (u) => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2;

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

// A chunky outlined five-pointed cartoon star.
function cuteStar(ctx, x, y, r, rot, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  inked(ctx, fill, Math.max(1.2, r * 0.28));
}

// Straight speed lines trailing behind a moving thing along angle `a`.
function speedLines(ctx, x, y, a, n, len, spread, seed, color = '#ffffff') {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  for (let i = 0; i < n; i++) {
    const off = (i / Math.max(1, n - 1) - 0.5) * spread;
    const back = 6 + rand(seed + i) * 10;
    const l = len * (0.6 + rand(seed + i * 3.1) * 0.6);
    const sx = x - ca * back - sa * off;
    const sy = y - sa * back + ca * off;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - ca * l, sy - sa * l);
    ctx.stroke();
  }
}

// A ring of dust puffs spreading out along the ground from (x, y).
function dustRing(ctx, x, y, u, rx, seed) {
  if (u <= 0 || u >= 1) return;
  const r = 9 * (1 - u) + 2;
  const k = easeOut(u);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + rand(seed + i) * 0.4;
    const px = x + Math.cos(a) * rx * k * (0.8 + rand(seed + i * 2) * 0.4);
    const py = y - 3 + Math.sin(a) * rx * 0.22 * k - Math.max(0, -Math.sin(a)) * 4 * k;
    puff(ctx, px, py, r * (0.7 + rand(seed + i * 5) * 0.6), '#fff8f2', '#e2d2e6');
  }
}

/* ---------------- 1. comic balloon ---------------- */

const COMIC_COLORS = ['#ff8fc7', '#ffd84d', '#8fe3ff', '#b9f28c', '#c6a8ff', '#ffb37a'];

function drawComic(ctx, f, x, y, p) {
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

/* ---------------- 2. squeaky hammer ---------------- */

const PINK = '#ffa3cd';
const PINK_DK = '#f27db5';
const PINK_LT = '#ffd8ea';
const YELLOW = '#ffe27a';

// The hammer in its own frame: pivot (grip end) at the origin, handle along +x for `reach`, the
// barrel head centered at (reach, 0) lying across the handle. sx/sy squash the head.
function squeakyHammer(ctx, reach, sx, sy) {
  const hw = 22; // head half-width along the handle
  const hl = 32; // head half-length across it
  // Handle: yellow with pink candy stripes, clipped to its rounded shape.
  const hEnd = reach - hw * sx + 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-6, -5, hEnd + 6, 10, 5);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = YELLOW;
  ctx.fillRect(-6, -5, hEnd + 6, 10);
  ctx.fillStyle = '#ffb3d4';
  for (let s = -10; s < hEnd; s += 12) {
    ctx.beginPath();
    ctx.moveTo(s, 5);
    ctx.lineTo(s + 5, 5);
    ctx.lineTo(s + 11, -5);
    ctx.lineTo(s + 6, -5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Grip knob at the end.
  ctx.beginPath();
  ctx.arc(-6, 0, 6, 0, TAU);
  inked(ctx, PINK);
  ctx.restore();

  // Head (squashed about its bottom-facing side).
  ctx.save();
  ctx.translate(reach, 0);
  ctx.scale(sx, sy);
  ctx.lineJoin = 'round';
  // Yellow squeaker cap on the back face.
  ctx.beginPath();
  ctx.ellipse(hw + 2, 0, 6, 9, 0, 0, TAU);
  inked(ctx, YELLOW, 2.5 / sx);
  // Barrel body.
  ctx.beginPath();
  ctx.roundRect(-hw, -hl, hw * 2, hl * 2, 9);
  inked(ctx, PINK, 3 / Math.min(sx, sy));
  // Darker end caps (the striking faces), lighter middle band, shine.
  ctx.fillStyle = PINK_DK;
  ctx.beginPath();
  ctx.roundRect(-hw + 1.5, -hl + 1.5, hw * 2 - 3, 9, [7, 7, 2, 2]);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-hw + 1.5, hl - 10.5, hw * 2 - 3, 9, [2, 2, 7, 7]);
  ctx.fill();
  ctx.fillStyle = PINK_LT;
  ctx.fillRect(-hw + 1.5, -7, hw * 2 - 3, 14);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-hw, -hl + 10.5);
  ctx.lineTo(hw, -hl + 10.5);
  ctx.moveTo(-hw, hl - 10.5);
  ctx.lineTo(hw, hl - 10.5);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha *= 0.85;
  ctx.beginPath();
  ctx.roundRect(-hw + 5, -hl + 13, 4, hl * 2 - 26, 2);
  ctx.fill();
  ctx.restore();
}

function drawSqueaky(ctx, f, x, y, p) {
  const dir = f.dir < 0 ? -1 : 1;
  const w = f.w ?? 110;
  const seed = (f.seed ?? 0) + 3;
  const reachEnd = Math.max(56, w / 2 + 6);
  // Angle of the handle from the pivot (in the facing-right frame): starts high behind the caster,
  // winds up a touch, slams to horizontal at p=0.35, rebounds, and settles.
  const aStart = Math.atan2(-110, -26);
  let a;
  let reach;
  if (p < 0.1) {
    a = aStart - 0.25 * easeOut(p / 0.1);
    reach = 112;
  } else if (p < 0.35) {
    const u = easeIn((p - 0.1) / 0.25);
    a = lerp(aStart - 0.25, 0, u);
    reach = lerp(112, reachEnd, u);
  } else {
    const u = (p - 0.35) / 0.65;
    a = -Math.abs(Math.sin(u * Math.PI * 2.2)) * 0.55 * Math.exp(-u * 3.2);
    reach = reachEnd;
  }
  // Squash on impact, wobbling back to round.
  const hitU = seg(p, 0.35, 0.6);
  const sq = p >= 0.35 ? Math.cos(hitU * Math.PI * 3) * (1 - hitU) * 0.32 : 0;
  const sy = 1 - sq;
  const sx = 1 + sq * 0.8;
  const alpha = 1 - easeIn(seg(p, 0.72, 1));
  const px = 0;
  const py = y - 32;
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  // Speed arcs trailing the head during the swing.
  if (p > 0.15 && p < 0.42) {
    const sweep = Math.min(0.9, (a - aStart) * 0.5);
    ctx.save();
    ctx.globalAlpha = alpha * 0.85 * (1 - seg(p, 0.35, 0.42));
    crescent(ctx, px, py, reach + 10, a - sweep, a - 0.08, 12, '#ffd8ea');
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(px, py, reach + 28 + i * 7, a - 0.15 - sweep * (0.8 - i * 0.2), a - 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Dust ring and ground shadow on impact.
  const hx = reachEnd;
  dustRing(ctx, hx, y, seg(p, 0.35, 0.8), 40 + w * 0.25, seed);
  if (p >= 0.35) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - seg(p, 0.35, 0.6));
    shock(ctx, hx, y - 1, 20 + seg(p, 0.35, 0.6) * (w * 0.5), 5 + seg(p, 0.35, 0.6) * 7, 3 * (1 - seg(p, 0.35, 0.6)) + 0.5, '#ffffff');
    ctx.restore();
  }
  // The hammer, with the head kept on the ground while squashed.
  ctx.save();
  ctx.translate(px, py + 32 * (1 - sy) * Math.cos(a));
  ctx.rotate(a);
  squeakyHammer(ctx, reach, sx, sy);
  ctx.restore();
  // Squeak stars and a little "squeak!" popping out of the impact.
  const su = seg(p, 0.35, 0.75);
  if (su > 0 && su < 1) {
    for (let i = 0; i < 5; i++) {
      const ang = -Math.PI * (0.1 + 0.8 * (i / 4)) + (rand(seed + i) - 0.5) * 0.3;
      const d = 30 + easeOut(su) * (34 + rand(seed + i * 2) * 20);
      cuteStar(ctx, hx + Math.cos(ang) * d, y - 30 + Math.sin(ang) * d * 0.9, 5 * (1 - su * 0.6), su * 4 + i, i % 2 ? '#fff3a6' : '#ffd8ea');
    }
    ctx.save();
    ctx.globalAlpha = alpha * (1 - easeIn(su));
    ctx.translate(hx + 26, y - 74 - su * 14);
    ctx.scale(dir, 1);
    ctx.rotate(-0.15 * dir);
    const ps = su < 0.15 ? easeBack(su / 0.15) : 1;
    ctx.scale(ps, ps);
    ctx.font = `900 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.strokeText('squeak!', 0, 0);
    ctx.fillStyle = '#ffd8ea';
    ctx.fillText('squeak!', 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------- 3. rubber duck ---------------- */

const DUCK = '#ffe066';
const DUCK_DK = '#f5bf3a';
const BEAK = '#ff9a4a';

// A rubber duck facing right; origin at the bottom center of its body, about 110 wide.
function rubberDuck(ctx) {
  const shapes = [
    () => ctx.ellipse(-4, -30, 54, 30, 0, 0, TAU), // body
    () => {
      ctx.moveTo(-40, -44);
      ctx.quadraticCurveTo(-62, -58, -60, -76);
      ctx.quadraticCurveTo(-44, -62, -24, -56);
      ctx.closePath();
    }, // tail flick
    () => ctx.arc(22, -74, 27, 0, TAU), // head
  ];
  // Thick shared outline: stroke every part, then fill them all on top.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  for (const s of shapes) {
    ctx.beginPath();
    s();
    ctx.stroke();
  }
  // Beak (outlined on its own so it sits in front).
  ctx.beginPath();
  ctx.moveTo(40, -78);
  ctx.quadraticCurveTo(64, -84, 66, -72);
  ctx.quadraticCurveTo(62, -66, 44, -66);
  ctx.quadraticCurveTo(62, -64, 58, -58);
  ctx.quadraticCurveTo(48, -54, 40, -62);
  ctx.closePath();
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = BEAK;
  ctx.fill();
  ctx.fillStyle = DUCK;
  for (const s of shapes) {
    ctx.beginPath();
    s();
    ctx.fill();
  }
  // Belly shade, wing, and the mouth line on the beak.
  ctx.fillStyle = DUCK_DK;
  ctx.beginPath();
  ctx.ellipse(-4, -12, 46, 12, 0, 0, Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-30, -36);
  ctx.quadraticCurveTo(-6, -50, 14, -34);
  ctx.quadraticCurveTo(-4, -18, -30, -36);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(44, -66);
  ctx.lineTo(60, -66);
  ctx.stroke();
  // Eye with a shine, rosy cheek, and soft highlights.
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(30, -82, 4.5, 5.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(31.5, -84, 1.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffa3b8';
  ctx.beginPath();
  ctx.ellipse(28, -68, 6, 3.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(10, -88, 9, 5, -0.6, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-28, -42, 12, 4.5, -0.25, 0, TAU);
  ctx.fill();
}

// Light-blue droplets flung up from (x, y), arcing out and falling.
function splash(ctx, x, y, u, spread, n, seed) {
  if (u <= 0 || u >= 1) return;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const vx = side * (0.3 + rand(seed + i) * 0.7) * spread;
    const vy = 60 + rand(seed + i * 3) * 60;
    const dx = x + vx * u;
    const dy = y - vy * u + 150 * u * u;
    if (dy > y + 2) continue;
    const r = (3 + rand(seed + i * 7) * 3) * (1 - u * 0.5);
    const ang = Math.atan2(-vy + 300 * u, vx);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(r * 2, 0);
    ctx.quadraticCurveTo(0, -r * 1.2, -r, 0);
    ctx.quadraticCurveTo(0, r * 1.2, r * 2, 0);
    inked(ctx, '#a8e2ff', 1.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-r * 0.1, -r * 0.3, r * 0.3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// A puddle ripple on the ground: a pale blue ellipse with rings moving out.
function ripple(ctx, x, y, u, w) {
  if (u <= 0 || u >= 1) return;
  ctx.save();
  ctx.globalAlpha *= 1 - easeIn(u);
  ctx.fillStyle = 'rgba(168,226,255,0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y, (w / 2) * (0.5 + easeOut(u) * 0.5), 7 + 3 * u, 0, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 2; i++) {
    const k = clamp01(u * 1.3 - i * 0.25);
    shock(ctx, x, y, (w / 2) * (0.3 + easeOut(k) * 0.8), 5 + 6 * k, 2.5 * (1 - k), '#ffffff');
  }
  ctx.restore();
}

function drawDuck(ctx, f, x, y, p) {
  const w = f.w ?? 140;
  const seed = (f.seed ?? 0) + 11;
  const top = -30; // screen y of the duck's feet when it starts (off the top)
  let by; // body bottom
  let sx = 1;
  let sy = 1;
  let rot = 0;
  if (p < 0.35) {
    const u = easeIn(p / 0.35);
    by = lerp(top, y, u);
    sy = 1 + u * 0.18;
    sx = 1 - u * 0.1;
    rot = Math.sin(p * 30) * 0.08;
  } else if (p < 0.47) {
    const u = (p - 0.35) / 0.12;
    by = y;
    const s = Math.sin(u * Math.PI) * 0.35;
    sy = 1 - s;
    sx = 1 + s * 0.8;
  } else if (p < 0.64) {
    const u = (p - 0.47) / 0.17;
    by = y - Math.sin(u * Math.PI) * 34;
    sy = 1 + Math.sin(u * Math.PI) * 0.08;
    rot = Math.sin(u * TAU) * 0.08;
  } else if (p < 0.74) {
    const u = (p - 0.64) / 0.1;
    by = y;
    const s = Math.sin(u * Math.PI) * 0.18;
    sy = 1 - s;
    sx = 1 + s * 0.7;
  } else {
    // Hop up and away off the top, stretching as it goes.
    const u = (p - 0.74) / 0.26;
    by = y - easeIn(u) * (y + 160);
    sy = 1 + Math.min(0.25, u * 0.6);
    sx = 1 - Math.min(0.15, u * 0.4);
    rot = -u * 0.3;
  }
  ctx.save();
  // Ground shadow growing as it falls.
  const near = clamp01(1 - (y - by) / Math.max(60, y - top));
  ctx.globalAlpha = 0.18 * near;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y, 50 * (0.4 + near * 0.6) * sx, 7, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ripple(ctx, x, y, seg(p, 0.35, 0.95), w);
  ripple(ctx, x, y, seg(p, 0.64, 1), w * 0.6);
  // Speed lines above it while falling.
  if (p < 0.35 && by > 10) {
    ctx.globalAlpha = 0.9;
    speedLines(ctx, x, by - 105, Math.PI / 2, 5, 30, 90, seed);
    ctx.globalAlpha = 1;
  }
  ctx.save();
  ctx.translate(x, by);
  ctx.rotate(rot);
  ctx.scale(sx, sy);
  rubberDuck(ctx);
  ctx.restore();
  splash(ctx, x, y - 4, seg(p, 0.35, 0.75), w * 0.75, 14, seed);
  splash(ctx, x, y - 4, seg(p, 0.64, 0.92), w * 0.5, 8, seed + 40);
  ctx.restore();
}

/* ---------------- 4. baguette ---------------- */

// A baguette centered at the origin lying along x, `len` long.
function baguette(ctx, len) {
  const L = len / 2;
  const H = 8;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-L, 0);
  ctx.bezierCurveTo(-L + 4, -H - 2, -L + 14, -H, 0, -H);
  ctx.bezierCurveTo(L - 14, -H, L - 4, -H - 2, L, 0);
  ctx.bezierCurveTo(L - 4, H + 1, L - 14, H, 0, H);
  ctx.bezierCurveTo(-L + 14, H, -L + 4, H + 1, -L, 0);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#e9a958';
  ctx.fillRect(-L, -H - 2, len, H * 2 + 4);
  ctx.fillStyle = '#c7843c';
  ctx.fillRect(-L, H * 0.35, len, H);
  ctx.fillStyle = '#f7c98a';
  ctx.fillRect(-L + 6, -H + 2, len - 12, 3);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Scored diagonal slashes.
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const sx = -L + 12 + i * ((len - 24) / 4);
    ctx.beginPath();
    ctx.moveTo(sx - 4, 3);
    ctx.quadraticCurveTo(sx, -1, sx + 4, -5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#fde6b8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawBaguette(ctx, f, x, y, p) {
  const dir = f.dir < 0 ? -1 : 1;
  const len = f.len ?? 220;
  const seed = (f.seed ?? 0) + 23;
  const travel = (u) => len * (u * 0.85 + easeOut(u) * 0.15);
  const bx = x + dir * travel(p);
  const by = y - Math.sin(p * Math.PI) * 10;
  const alpha = 1 - easeIn(seg(p, 0.78, 1));
  ctx.save();
  ctx.globalAlpha = alpha;
  // Crumb specks dropped along the path, falling and fading.
  for (let i = 0; i < 16; i++) {
    const at = (i + rand(seed + i)) / 16;
    if (at > p) break;
    const age = (p - at) * 3;
    if (age > 1) continue;
    const cx = x + dir * travel(at) + (rand(seed + i * 2) - 0.5) * 16;
    const cy = y - Math.sin(at * Math.PI) * 10 + (rand(seed + i * 5) - 0.5) * 12 + age * age * 26;
    const r = 1.5 + rand(seed + i * 9) * 2;
    ctx.globalAlpha = alpha * (1 - age);
    ctx.fillStyle = i % 3 ? '#e9a958' : '#fde6b8';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = alpha * 0.9;
  speedLines(ctx, bx - dir * 26, by, dir > 0 ? 0 : Math.PI, 4, 28, 30, seed);
  ctx.globalAlpha = alpha;
  // Whoosh ring around the spinning loaf.
  ctx.save();
  ctx.globalAlpha = alpha * 0.5;
  shock(ctx, bx, by, 36, 36, 2, '#ffffff');
  ctx.restore();
  ctx.translate(bx, by);
  ctx.rotate(p * TAU * 2.6 * dir);
  baguette(ctx, 70);
  ctx.restore();
}

/* ---------------- 5. banana peels ---------------- */

// A splayed banana peel resting on the ground at the origin; `open` 0-1 spreads its flaps.
function bananaPeel(ctx, open) {
  const flap = (ang, len) => {
    ctx.save();
    ctx.translate(0, -9);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-6, len * 0.6, -1, len);
    ctx.quadraticCurveTo(2, len + 3, 4, len - 1);
    ctx.quadraticCurveTo(6, len * 0.5, 4, 0);
    ctx.closePath();
    inked(ctx, '#ffe36b', 2);
    // Brown tip.
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.arc(1.5, len - 1, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  };
  const s = 0.4 + open * 0.6;
  flap(-1.25 * s, 14); // back-left flop
  flap(1.25 * s, 14); // right flop
  flap(-0.35 * s, 11);
  // The middle hump and its stem.
  ctx.beginPath();
  ctx.ellipse(0, -7, 6, 8, 0, Math.PI, TAU);
  ctx.lineTo(6, -2);
  ctx.lineTo(-6, -2);
  ctx.closePath();
  inked(ctx, '#ffd84a', 2);
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(-3, -12, 2, 6);
  ctx.beginPath();
  ctx.roundRect(-1.5, -19, 3, 5, 1);
  inked(ctx, '#8b5a2b', 1.5);
  flap(0.4 * s, 10);
}

function drawBanana(ctx, f, x, y, p) {
  const dir = f.dir < 0 ? -1 : 1;
  const w = f.w ?? 160;
  const seed = (f.seed ?? 0) + 31;
  const n = 5;
  const alpha = 1 - easeIn(seg(p, 0.82, 1));
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const t0 = i * 0.045;
    const t1 = 0.4 - (n - 1 - i) * 0.02;
    const u = seg(p, t0, t1);
    if (p < t0) continue;
    const tx = x + dir * w * (0.12 + 0.88 * (i / (n - 1))) + (rand(seed + i) - 0.5) * 14;
    const sx = x + dir * 6;
    const sy = y - 34;
    const hgt = 40 + rand(seed + i * 3) * 40 + i * 6;
    const px = lerp(sx, tx, u);
    const py = lerp(sy, y, u) - Math.sin(u * Math.PI) * hgt;
    ctx.save();
    ctx.translate(px, py);
    if (u < 1) {
      ctx.rotate(u * TAU * (1.5 + rand(seed + i * 7)) * dir);
      bananaPeel(ctx, 0.2);
    } else {
      // Landed: a little splat-bounce, then lie there looking slippery.
      const lu = seg(p, t1, t1 + 0.1);
      const sq = Math.sin(lu * Math.PI) * 0.3;
      ctx.scale(1 + sq, 1 - sq);
      ctx.scale(dir * (rand(seed + i * 11) > 0.5 ? 1 : -1), 1);
      bananaPeel(ctx, easeOut(lu));
      if (lu > 0.3 && p < 0.8) {
        twinkle(ctx, 9, -16, 3 + Math.sin(p * 40 + i) * 1.2, '#ffffff');
      }
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------- 6. disco ball ---------------- */

const DISCO = ['#ff9ccf', '#8ff0cf', '#c6a8ff', '#ffe36b'];

// A mirror ball of radius r at the origin, its facets turning with `spin` (radians).
function discoBall(ctx, r, spin, time) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = '#9d97b2';
  ctx.fill();
  ctx.clip();
  const rows = 7;
  const cols = 12;
  const step = TAU / cols;
  const off = ((spin % step) + step) % step;
  for (let j = 0; j < rows; j++) {
    const l0 = -Math.PI / 2 + (j / rows) * Math.PI;
    const l1 = -Math.PI / 2 + ((j + 1) / rows) * Math.PI;
    for (let k = -1; k < cols / 2 + 1; k++) {
      const a0 = -Math.PI / 2 + k * step + off;
      const a1 = a0 + step;
      if (a1 < -Math.PI / 2 || a0 > Math.PI / 2) continue;
      const c0 = Math.max(-Math.PI / 2, a0);
      const c1 = Math.min(Math.PI / 2, a1);
      const id = j * 31 + Math.round((spin - off) / step) * -1 + k;
      const lit = Math.cos((c0 + c1) / 2 + 0.5) * Math.cos((l0 + l1) / 2 + 0.4);
      const tone = lit > 0.7 ? '#efecf6' : lit > 0.35 ? '#cfcadd' : '#aaa4be';
      ctx.fillStyle = (id + j) % 2 ? tone : lit > 0.5 ? '#dedaea' : '#b9b3cb';
      ctx.beginPath();
      ctx.moveTo(Math.sin(c0) * Math.cos(l0) * r, Math.sin(l0) * r);
      ctx.lineTo(Math.sin(c1) * Math.cos(l0) * r, Math.sin(l0) * r);
      ctx.lineTo(Math.sin(c1) * Math.cos(l1) * r, Math.sin(l1) * r);
      ctx.lineTo(Math.sin(c0) * Math.cos(l1) * r, Math.sin(l1) * r);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,45,79,0.35)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Twinkling glints.
  for (let i = 0; i < 4; i++) {
    const g = (Math.sin(time * 7 + i * 2.1) + 1) / 2;
    const a = i * 1.7 + 0.3;
    twinkle(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55 - 2, 2 + g * 4, '#ffffff');
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.22, r * 0.12, -0.7, 0, TAU);
  ctx.fill();
  // Cap and ring on top.
  ctx.beginPath();
  ctx.roundRect(-5, -r - 5, 10, 7, 2);
  inked(ctx, '#d6d1e3', 2);
}

// A music note ♪ (or a beamed pair) drawn with paths at (x, y), the note head's center.
function musicNote(ctx, x, y, s, color, pair) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 3.6, -0.4, 0, TAU);
  if (pair) ctx.ellipse(12, -3, 5, 3.6, -0.4, 0, TAU);
  ctx.rect(3.2, -16, 2.6, 16);
  if (pair) {
    ctx.rect(15.2, -19, 2.6, 16);
    ctx.moveTo(3.2, -16);
    ctx.lineTo(17.8, -19);
    ctx.lineTo(17.8, -14);
    ctx.lineTo(3.2, -11);
    ctx.closePath();
  } else {
    ctx.moveTo(5.8, -16);
    ctx.quadraticCurveTo(13, -12, 10, -4);
    ctx.quadraticCurveTo(10, -10, 5.8, -10);
    ctx.closePath();
  }
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawDisco(ctx, f, x, y, p, time) {
  const r = f.r ?? 140;
  const dur = f.dur ?? 4;
  const t = p * dur;
  const alpha = Math.min(1, p / 0.05) * (1 - easeIn(seg(p, 0.85, 1)));
  if (alpha <= 0) return;
  const bx = x;
  const byEnd = y - 110;
  const by = lerp(-30, byEnd, easeBack(Math.min(1, t / 0.5))) + Math.sin(time * 2) * 2;
  const R = 20;
  const spin = time * 1.6;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Colored dots of light sliding around on the ground.
  for (let i = 0; i < 14; i++) {
    const a = spin * (i % 2 ? 0.7 : -0.5) + i * 1.9;
    const dx = Math.cos(a) * r * (0.25 + rand(i) * 0.75);
    const dy = 2 + Math.sin(a) * 6;
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = DISCO[i % 4];
    ctx.beginPath();
    ctx.ellipse(bx + dx, y + dy, 6, 2.6, 0, 0, TAU);
    ctx.fill();
  }
  // Light beams sweeping out of the ball.
  ctx.globalAlpha = alpha * 0.3;
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 2 + Math.sin(time * 1.3 + i * 0.8) * 1.2 + (i - 3.5) * 0.18;
    const l = r * (0.9 + 0.2 * Math.sin(time * 3 + i));
    const hw = 0.07;
    ctx.fillStyle = DISCO[i % 4];
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(a - hw) * l, by + Math.sin(a - hw) * l);
    ctx.lineTo(bx + Math.cos(a + hw) * l, by + Math.sin(a + hw) * l);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
  // Sparkles floating around the beams.
  for (let i = 0; i < 8; i++) {
    const a = i * 0.8 + time * 0.6;
    const d = r * (0.3 + rand(i + 5) * 0.6);
    const g = (Math.sin(time * 5 + i * 1.3) + 1) / 2;
    twinkle(ctx, bx + Math.cos(a) * d, by + 30 + Math.abs(Math.sin(a)) * d * 0.45, 1 + g * 3.5, i % 2 ? '#ffffff' : DISCO[i % 4]);
  }
  // String and ball.
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bx, Math.min(0, by - 100));
  ctx.lineTo(bx, by - R - 4);
  ctx.stroke();
  ctx.save();
  ctx.translate(bx, by);
  discoBall(ctx, R, spin, time);
  ctx.restore();
  // Music notes bobbing up around the caster.
  for (let i = 0; i < 6; i++) {
    const per = 1.6;
    const ph = (t / per + i / 6) % 1;
    const life = t - ph * per;
    if (life < 0 && t < per) continue;
    const side = i % 2 ? 1 : -1;
    const nx = bx + side * (22 + rand(i * 3) * r * 0.45) + Math.sin(ph * TAU + i) * 8;
    const ny = y - 20 - ph * 90;
    const fa = Math.min(1, ph * 6) * (1 - easeIn(ph));
    ctx.globalAlpha = alpha * fa;
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(Math.sin(time * 4 + i) * 0.25);
    musicNote(ctx, 0, 0, 0.9 + rand(i) * 0.3, DISCO[i % 4], i % 3 === 0);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------------- 7. frying-pan bonk ---------------- */

// A frying pan in its own frame: the handle grip at the origin, pan centered at (34, 0).
function fryingPan(ctx) {
  ctx.lineJoin = 'round';
  // Wooden handle.
  ctx.beginPath();
  ctx.roundRect(-4, -4, 24, 8, 4);
  inked(ctx, '#c98a52', 2.5);
  ctx.fillStyle = '#e3aa72';
  ctx.fillRect(0, -2.5, 16, 2);
  ctx.beginPath();
  ctx.arc(0, 0, 1.6, 0, TAU);
  ctx.fillStyle = INK;
  ctx.fill();
  // Metal neck.
  ctx.beginPath();
  ctx.rect(18, -2.5, 6, 5);
  inked(ctx, '#7d7891', 2);
  // Pan: dark rim, darker inside, a shine arc.
  ctx.beginPath();
  ctx.ellipse(36, 0, 14, 17, 0, 0, TAU);
  inked(ctx, '#6d6880', 3);
  ctx.fillStyle = '#4f4a63';
  ctx.beginPath();
  ctx.ellipse(37, 0, 10.5, 13, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(37, 0, 7, 9, 0, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(41, 6, 1.6, 0, TAU);
  ctx.fill();
}

function drawBonk(ctx, f, x, y, p, time) {
  const dir = f.dir < 0 ? -1 : 1;
  const px = 10;
  const py = y - 30;
  // Swing: from back-up, accelerating to forward at p=0.3, then following through and down.
  const a0 = -2.5;
  let a;
  if (p < 0.3) a = lerp(a0, 0, easeIn(p / 0.3));
  else a = lerp(0, 0.75, easeOut(seg(p, 0.3, 0.7)));
  const alpha = 1 - easeIn(seg(p, 0.6, 1));
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  // Swing smear.
  if (p > 0.08 && p < 0.5) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - seg(p, 0.3, 0.5));
    const tail = Math.max(a0, a - 1.4);
    crescent(ctx, px, py, 36, tail, a - 0.1, 14, '#e6e2ef');
    ctx.restore();
  }
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  // Thwack wobble on impact.
  const wob = p >= 0.3 ? Math.sin(seg(p, 0.3, 0.55) * Math.PI * 4) * (1 - seg(p, 0.3, 0.55)) * 0.12 : 0;
  ctx.scale(1 - wob, 1 + wob);
  fryingPan(ctx);
  ctx.restore();
  // Impact flash and dizzy stars.
  const hx = 46;
  const hy = y - 32;
  const iu = seg(p, 0.3, 0.55);
  if (iu > 0 && iu < 1) {
    ctx.save();
    ctx.globalAlpha = alpha * (1 - iu);
    starFlash(ctx, hx + 6, hy, 26 * (0.6 + easeOut(iu) * 0.6), 8, iu * 0.6, '#fff3a6');
    ctx.restore();
  }
  const du = seg(p, 0.3, 1);
  if (du > 0) {
    for (let i = 0; i < 3; i++) {
      const a2 = time * 6 + (i / 3) * TAU;
      const sx = hx + 8 + Math.cos(a2) * 16;
      const sy = hy - 24 + Math.sin(a2) * 5;
      ctx.save();
      ctx.globalAlpha = alpha * Math.min(1, du * 6);
      cuteStar(ctx, sx, sy, 4.5 + Math.sin(a2) * 1, a2, i % 2 ? '#ffe36b' : '#ffd8ea');
      ctx.restore();
    }
  }
  ctx.restore();
}

/* ---------------- dispatcher ---------------- */

// Draw a funny effect; returns false for kinds this file doesn't know.
export function drawFunny(ctx, f, x, y, p, cam, time) {
  const pp = clamp01(p);
  const t = time ?? 0;
  switch (f.kind) {
    case 'comic':
      ctx.save();
      drawComic(ctx, f, x, y, pp);
      ctx.restore();
      return true;
    case 'squeaky':
      ctx.save();
      drawSqueaky(ctx, f, x, y, pp);
      ctx.restore();
      return true;
    case 'duck':
      ctx.save();
      drawDuck(ctx, f, x, y, pp);
      ctx.restore();
      return true;
    case 'baguette':
      ctx.save();
      drawBaguette(ctx, f, x, y, pp);
      ctx.restore();
      return true;
    case 'banana':
      ctx.save();
      drawBanana(ctx, f, x, y, pp);
      ctx.restore();
      return true;
    case 'disco':
      ctx.save();
      drawDisco(ctx, f, x, y, pp, t);
      ctx.restore();
      return true;
    case 'bonk':
      ctx.save();
      drawBonk(ctx, f, x, y, pp, t);
      ctx.restore();
      return true;
    default:
      return false;
  }
}
