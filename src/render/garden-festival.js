// The Moon Viewing festival, drawn (world/garden-festival.js has when and where): the harvest moon
// rising behind the far hills at dusk, round and golden with a sleepy smile; silver pampas grass
// along the fences; a string of round moon lanterns over the orchard, glowing as it gets dark; the
// offering table laid with a pyramid of white dango and a vase of pampas; the wooden mortar in the
// square, its mallet leant against it - or in a Mochi's paws, the mochi splatting at each strike;
// maple leaves drifting down across everything; and in the Mochi Market, the festival stall.

import { FEST } from '../world/garden-festival.js';
import { groundAt } from '../world/physics.js';
import { signText } from './signfont.js';
import { VW, VH } from '../input.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const glowAt = (ctx, x, y, r, rgb, a) => {
  if (a <= 0.005) return;
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

// ---------- The harvest moon (from the garden's backdrop, before the far hills) ----------
// It comes up from behind the hills a little left of where the sky's own sun sits, climbing on a
// gentle arc, and stays up there for the night (the sky's own little moon stays away tonight).
export function drawFestivalSky(ctx, cam, width, y0, time) {
  const F = FEST.now;
  if (!F || F.eve <= 0.01) return;
  const k = smooth(Math.min(1, F.eve * 1.5));
  const x = width * (0.6 + 0.06 * k) - cam.x * 0.01;
  const y = y0 + 34 - (y0 + 34 - 70) * k;
  const R = 26;
  // Its halo, warm.
  glowAt(ctx, x, y, 110, '255,220,150', 0.28 * k);
  glowAt(ctx, x, y, 52, '255,236,190', 0.4 * k);
  // The disc: gold, lit toward its upper left.
  const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
  g.addColorStop(0, '#fff6d2');
  g.addColorStop(0.7, '#ffe49a');
  g.addColorStop(1, '#f6c870');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, R, 0, TAU);
  ctx.fill();
  // Soft seas on its face.
  ctx.fillStyle = 'rgba(232,176,96,0.35)';
  for (const [dx, dy, rx, ry] of [[-9, -10, 5, 3.6], [10, -4, 6, 4.4], [-4, 11, 7, 3.4], [13, 12, 3, 2.4]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y + dy, rx, ry, 0.3, 0, TAU);
    ctx.fill();
  }
  // A sleepy, happy face: closed eyes, rosy cheeks, a small smile.
  ctx.strokeStyle = '#b8783a';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 7, y - 1, 3, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x, y + 4, 3, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = 'rgba(255,140,140,0.4)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + side * 12, y + 4, 3.4, 2, 0, 0, TAU);
    ctx.fill();
  }
}

// ---------- In the garden, behind the Mochi ----------
// Pampas along the fences and the orchard's edge (world x), and the moon lanterns' string.
const PAMPAS = [356, 604, 744, 1250, 1404, 2046];
const STRING = { x0: 1442, x1: 1628, h: 88, n: 6 };
export function drawFestivalBack(ctx, world, cam, time, spots, pounding) {
  const F = FEST.now;
  if (!F || F.k <= 0.01) return;
  const map = world.map;
  const night = Math.max(map.night ?? 0, (F.eve ?? 0) * 0.6);
  ctx.save();
  ctx.globalAlpha = F.k;
  for (const [i, wx] of PAMPAS.entries()) pampas(ctx, wx - cam.x, groundAt(map, wx) - cam.y, time, i);
  lanternString(ctx, map, cam, time, night);
  if (spots) {
    offering(ctx, spots.offering - cam.x, groundAt(map, spots.offering) - cam.y, time, night);
    mortar(ctx, spots.mortar - cam.x, groundAt(map, spots.mortar) - cam.y, time, pounding);
  }
  ctx.restore();
}

// A clump of pampas grass: thin arching stalks, each with a feathery silver plume, swaying.
function pampas(ctx, x, gy, time, seed) {
  for (let s = 0; s < 6; s++) {
    const h = hash(seed * 7 + s);
    const lean = (s - 2.5) * 0.12 + (h - 0.5) * 0.1;
    const len = 22 + h * 12;
    const sway = Math.sin(time * 1.3 + seed * 2 + s * 0.7) * 0.06;
    const a = lean + sway;
    const tx = x + Math.sin(a) * len;
    const ty = gy - Math.cos(a) * len;
    ctx.strokeStyle = '#b8b07a';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + (s - 2.5) * 1.2, gy);
    ctx.quadraticCurveTo(x + Math.sin(a) * len * 0.5, gy - Math.cos(a) * len * 0.55, tx, ty);
    ctx.stroke();
    // The plume: a soft drooping tuft along the stalk's tip.
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a + 0.5 * Math.sign(lean || 1));
    ctx.fillStyle = '#ddd2b8';
    ctx.beginPath();
    ctx.ellipse(0.3, 4.9, 1.9, 5.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f8f2e4';
    ctx.beginPath();
    ctx.ellipse(-0.2, 4.2, 1.5, 4.8, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // A few long leaves at its foot.
  ctx.strokeStyle = '#8aa86a';
  ctx.lineWidth = 0.9;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.quadraticCurveTo(x + side * 6, gy - 8, x + side * 11, gy - 4);
    ctx.stroke();
  }
}
// The moon lanterns' string across the orchard: two bamboo poles, a sagging cord, round cream
// lanterns each with a little gold moon, lit warm as it gets dark.
function lanternString(ctx, map, cam, time, night) {
  const { x0, x1, h, n } = STRING;
  const g0 = groundAt(map, x0) - cam.y;
  const g1 = groundAt(map, x1) - cam.y;
  const ax = x0 - cam.x;
  const bx = x1 - cam.x;
  const ay = g0 - h;
  const by = g1 - h;
  ctx.fillStyle = '#b8a060';
  ctx.fillRect(ax - 1, ay - 2, 2, h + 2);
  ctx.fillRect(bx - 1, by - 2, 2, h + 2);
  ctx.fillStyle = '#d0b878';
  ctx.fillRect(ax - 1, ay - 2, 0.8, h + 2);
  ctx.fillRect(bx - 1, by - 2, 0.8, h + 2);
  const sag = (u) => 16 * Math.sin(Math.PI * u);
  ctx.strokeStyle = '#6a4a2a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const px = ax + (bx - ax) * u;
    const py = ay + (by - ay) * u + sag(u);
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const px = ax + (bx - ax) * u;
    const py = ay + (by - ay) * u + sag(u);
    const sw = Math.sin(time * 1.4 + i * 1.3) * 0.06;
    const lx = px + Math.sin(sw) * 7;
    const ly = py + 7;
    if (night > 0.05) glowAt(ctx, lx, ly, 16, '255,214,140', 0.45 * night);
    ctx.strokeStyle = '#6a4a2a';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(lx, ly - 4);
    ctx.stroke();
    ctx.fillStyle = night > 0.3 ? '#fff0c8' : '#fff6e6';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 4.2, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e05a3a';
    ctx.fillRect(lx - 2.6, ly - 5, 5.2, 1.2);
    ctx.fillRect(lx - 2.6, ly + 3.8, 5.2, 1.2);
    ctx.fillStyle = '#f2b84a';
    ctx.beginPath();
    ctx.arc(lx, ly, 1.7, 0, TAU);
    ctx.fill();
  }
}
// The offering: a little wooden stand laid with white paper and a pyramid of white dango - four, three,
// two, one - and beside it a blue vase of pampas. A soft light on it once the moon's up.
function offering(ctx, x, gy, time, night) {
  if (night > 0.05) glowAt(ctx, x, gy - 14, 26, '255,236,190', 0.35 * night);
  // The stand: a tray on a box with a round hole cut in its side.
  ctx.fillStyle = '#c8a06a';
  ctx.fillRect(x - 9, gy - 9, 18, 9);
  ctx.fillStyle = '#8a6440';
  ctx.beginPath();
  ctx.ellipse(x, gy - 4.6, 3.6, 2.8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e2c08a';
  ctx.fillRect(x - 12, gy - 12, 24, 3);
  ctx.fillStyle = '#b08858';
  ctx.fillRect(x - 12, gy - 9.6, 24, 0.8);
  // The paper, its corners hanging down over the tray's edge.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 10, gy - 13, 20, 1.4);
  ctx.beginPath();
  ctx.moveTo(x - 10, gy - 12);
  ctx.lineTo(x - 12, gy - 8.6);
  ctx.lineTo(x - 9, gy - 11.6);
  ctx.closePath();
  ctx.moveTo(x + 10, gy - 12);
  ctx.lineTo(x + 12, gy - 8.6);
  ctx.lineTo(x + 9, gy - 11.6);
  ctx.closePath();
  ctx.fill();
  // The dango, stacked.
  const r = 2.4;
  for (const [row, count] of [[0, 4], [1, 3], [2, 2], [3, 1]]) {
    for (let i = 0; i < count; i++) {
      const bx = x + (i - (count - 1) / 2) * r * 2;
      const by = gy - 13 - r - row * r * 1.7;
      ctx.fillStyle = '#e6dece';
      ctx.beginPath();
      ctx.arc(bx + 0.3, by + 0.3, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fffcf4';
      ctx.beginPath();
      ctx.arc(bx, by, r * 0.94, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(bx - 1.2, by - 1.2, 0.9, 0.8);
    }
  }
  // The vase of pampas, to its right.
  const vx = x + 16;
  ctx.fillStyle = '#3a5a9a';
  ctx.beginPath();
  ctx.moveTo(vx - 2, gy - 12);
  ctx.quadraticCurveTo(vx - 5, gy - 5, vx - 3.4, gy);
  ctx.lineTo(vx + 3.4, gy);
  ctx.quadraticCurveTo(vx + 5, gy - 5, vx + 2, gy - 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a7ac0';
  ctx.fillRect(vx - 2.6, gy - 13, 5.2, 1.4);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(vx - 2.4, gy - 9, 0.9, 6);
  for (let s = 0; s < 4; s++) {
    const a = (s - 1.5) * 0.22 + Math.sin(time * 1.2 + s) * 0.05;
    const len = 24 + s * 2;
    const tx = vx + Math.sin(a) * len;
    const ty = gy - 12 - Math.cos(a) * len;
    ctx.strokeStyle = '#b8b07a';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(vx, gy - 12);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(a + 0.4 * Math.sign(a || 1));
    ctx.fillStyle = '#f6efe0';
    ctx.beginPath();
    ctx.ellipse(0, 4, 1.7, 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
// The mortar: a stout wooden usu with a round of mochi in it. Its mallet leans on it while nobody's
// pounding; while someone is (`pounding`: the strikes' clock - the moment of the latest, and how
// hard), the mochi splats flat and wide at each and springs back.
function mortar(ctx, x, gy, time, pounding) {
  if (!pounding) {
    // The mallet, leant on its left side.
    ctx.save();
    ctx.translate(x - 13, gy);
    ctx.rotate(-0.38);
    ctx.fillStyle = '#c8945a';
    ctx.fillRect(-0.9, -24, 1.8, 24);
    ctx.fillStyle = '#a8763e';
    ctx.fillRect(-4.6, -30, 9.2, 6.4);
    ctx.fillStyle = '#c8945a';
    ctx.fillRect(-4.6, -30, 9.2, 1.4);
    ctx.restore();
  }
  // The usu.
  ctx.fillStyle = '#a8703e';
  ctx.beginPath();
  ctx.moveTo(x - 12, gy - 13);
  ctx.lineTo(x + 12, gy - 13);
  ctx.lineTo(x + 9.6, gy);
  ctx.lineTo(x - 9.6, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a4e2a';
  ctx.fillRect(x - 11, gy - 9, 22, 1.4);
  ctx.fillRect(x - 10.2, gy - 4.4, 20.4, 1.4);
  ctx.fillStyle = '#c8915a';
  ctx.beginPath();
  ctx.ellipse(x, gy - 13, 12, 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5a3a20';
  ctx.beginPath();
  ctx.ellipse(x, gy - 13, 9.4, 1.8, 0, 0, TAU);
  ctx.fill();
  // The mochi: a soft white dome, splatted at each strike.
  const since = pounding ? pounding.since : 9;
  const squash = since < 0.3 ? 1 - 0.4 * Math.sin((since / 0.3) * Math.PI) * (1 - since / 0.3) : 1;
  const wob = since > 0.3 && since < 0.6 ? 0.12 * Math.sin((since - 0.3) * 40) * (1 - (since - 0.3) / 0.3) : 0;
  const ry = 3.6 * squash * (1 + wob);
  const rx = 7.4 * (2 - squash) ** 0.5;
  ctx.fillStyle = '#fbf7f0';
  ctx.beginPath();
  ctx.ellipse(x, gy - 13, rx, ry, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(x - 3, gy - 13 - ry * 0.7, 2, 0.8);
  // Flour puffing out at a strike.
  if (since < 0.35) {
    const u = since / 0.35;
    ctx.fillStyle = `rgba(255,252,240,${0.7 * (1 - u)})`;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + side * (9 + u * 8), gy - 14 - u * 4, 1.4 + u * 2.4, 0, TAU);
      ctx.fill();
    }
  }
}

// ---------- In front: maple leaves drifting down ----------
const LEAF_COLORS = ['#e8503a', '#f07a3a', '#f2a83a', '#d8402e', '#f2c04a'];
export function drawFestivalFront(ctx, time) {
  const F = FEST.now;
  if (!F || F.k <= 0.01) return;
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const fall = 12 + hash(i * 2.3) * 14;
    const y = ((hash(i * 7.1) * (VH + 40) + time * fall) % (VH + 40)) - 20;
    const x = ((hash(i * 3.9) * (VW + 60) + time * (6 + hash(i) * 8) + Math.sin(time * 0.9 + i * 1.7) * 18) % (VW + 60)) - 30;
    ctx.globalAlpha = F.k * 0.9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * (0.6 + hash(i * 5) * 1.2) + i);
    ctx.scale(Math.cos(time * (1.4 + hash(i * 9)) + i), 1);
    ctx.fillStyle = LEAF_COLORS[i % LEAF_COLORS.length];
    // A five-pointed maple leaf, with its stalk.
    const s = 3.4 + hash(i * 1.1) * 1.8;
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const r = p % 2 ? s * 0.45 : s * (p === 4 || p === 6 ? 0.8 : 1);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-0.3, s * 0.4, 0.6, s * 0.7);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- The festival stall, in the Mochi Market (render/garden.js 'mg_moonstall') ----------
// Up only on a festival day: a little wooden cart under an indigo awning with a gold moon on it,
// paper lanterns at its corners, a pyramid of dango on the counter, and its sign: DANGO.
export function drawFestivalStall(ctx, x, gy, time, wx) {
  const F = FEST.now;
  if (!F || F.k <= 0.3) return;
  const night = F.eve ?? 0;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (F.k - 0.3) / 0.4);
  // Wheels, and the cart's body.
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#6a4628';
    ctx.beginPath();
    ctx.arc(x + side * 20, gy - 5, 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#c8945a';
    ctx.beginPath();
    ctx.arc(x + side * 20, gy - 5, 1.6, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#d8a86a';
  ctx.fillRect(x - 28, gy - 24, 56, 16);
  ctx.fillStyle = '#c08a50';
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 27 + i * 11.4, gy - 24, 0.8, 16);
  ctx.fillStyle = '#ecc890';
  ctx.fillRect(x - 30, gy - 26, 60, 3);
  // Posts and the awning.
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(x - 27, gy - 58, 2, 32);
  ctx.fillRect(x + 25, gy - 58, 2, 32);
  ctx.fillStyle = '#2e3a7a';
  ctx.fillRect(x - 32, gy - 62, 64, 9);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#3a4a8a' : '#2e3a7a';
    ctx.beginPath();
    ctx.moveTo(x - 32 + i * 8, gy - 53);
    ctx.lineTo(x - 24 + i * 8, gy - 53);
    ctx.lineTo(x - 28 + i * 8, gy - 49 + Math.sin(time * 2 + i + wx) * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.arc(x, gy - 57.6, 3.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2e3a7a';
  ctx.beginPath();
  ctx.arc(x + 1.4, gy - 58.4, 2.8, 0, TAU);
  ctx.fill();
  // The sign along the counter's front.
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(x - 17, gy - 21, 34, 8);
  signText(ctx, 'DANGO', x, gy - 18.6, { align: 'center', color: '#2e3a7a' });
  // The dango on the counter: a pyramid, and a jar of skewers.
  for (const [row, n] of [[0, 3], [1, 2], [2, 1]]) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = '#fffcf4';
      ctx.beginPath();
      ctx.arc(x - 12 + (i - (n - 1) / 2) * 4.2, gy - 28.6 - row * 3.6, 2.1, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#c8945a';
  ctx.fillRect(x + 8, gy - 33, 7, 7);
  ctx.strokeStyle = '#d8b07a';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 9 + i * 1.6, gy - 33);
    ctx.lineTo(x + 8.4 + i * 2.2, gy - 40);
    ctx.stroke();
  }
  // Lanterns at its corners.
  for (const side of [-1, 1]) {
    const lx = x + side * 26;
    const ly = gy - 46 + Math.sin(time * 1.6 + side + wx) * 0.4;
    if (night > 0.05) glowAt(ctx, lx, ly, 14, '255,214,140', 0.5 * night);
    ctx.fillStyle = '#fff2d6';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 3.4, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e05a3a';
    ctx.fillRect(lx - 2.2, ly - 4.4, 4.4, 1);
    ctx.fillRect(lx - 2.2, ly + 3.4, 4.4, 1);
  }
  ctx.restore();
}
