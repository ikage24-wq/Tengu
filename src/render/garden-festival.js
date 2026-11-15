// The garden's festivals, drawn (world/garden-festival.js has when and where).
//
// Moon Viewing: the harvest moon
// rising behind the far hills at dusk, round and golden with a sleepy smile; silver pampas grass
// along the fences; a string of round moon lanterns over the orchard, glowing as it gets dark; the
// offering table laid with a pyramid of white dango and a vase of pampas; the wooden mortar in the
// square, its mallet leant against it - or in a Mochi's paws, the mochi splatting at each strike;
// maple leaves drifting down across everything; and in the Mochi Market, the festival stall.
//
// The Snow Lantern Festival: a soft aurora rippling over the night sky; snow lanterns along the
// paths, dark by day and candle-lit once a Mochi has been round to light them (all of them by full
// night), glowing warm on the snow; warm lanterns strung over the orchard; snowballs flying between
// friends and bursting where they land; a few flakes drifting down.
//
// Blossom Day: the garden's own trees in pink bloom (an overlay laid on each canopy's clumps, render/
// garden.js's own shapes), petals drifting everywhere, pink-and-white lanterns over the orchard, the
// red picnic mat in the square with its lunch box and teapot between two pink lanterns on posts.
//
// Lantern Night: red-and-white lanterns strung over the orchard, wind chimes swinging on its poles,
// the lantern boats the Mochi set afloat drifting across the lily pond, glowing; and from dusk,
// fireworks bursting over the cliff.

import { FEST } from '../world/garden-festival.js';
import { groundAt } from '../world/physics.js';
import { signText } from './signfont.js';
import { art, place } from './scenery.js';
import { E, F as FLAT, snap } from './pixel.js';
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
  if (F.id === 'snow') return aurora(ctx, cam, width, y0, time, F.eve);
  if (F.id === 'lantern') return fireworks(ctx, cam, width, y0, time, F.eve);
  if (F.id !== 'moon') return;
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

// The aurora: three soft curtains of light - mint, lavender, pink - rippling slowly across the top of
// the night sky, brightest at their lower hems.
function aurora(ctx, cam, width, y0, time, k) {
  const a = smooth(Math.min(1, (k - 0.2) / 0.6));
  if (a <= 0) return;
  for (const [i, rgb] of [[0, '150,240,200'], [1, '200,176,255'], [2, '255,190,224']].entries()) {
    const top = 14 + rgb[0] * 16;
    const base = top + 46;
    const hem = (x) => base + Math.sin(x * 0.012 + time * 0.25 + rgb[0] * 2) * 10 + Math.sin(x * 0.031 - time * 0.4 + rgb[0]) * 4;
    const g = ctx.createLinearGradient(0, top, 0, base + 14);
    g.addColorStop(0, `rgba(${rgb[1]},0)`);
    g.addColorStop(0.7, `rgba(${rgb[1]},${0.32 * a})`);
    g.addColorStop(1, `rgba(${rgb[1]},${0.6 * a})`);
    ctx.fillStyle = g;
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    const off = -cam.x * 0.02;
    ctx.moveTo(0, top);
    for (let x = 0; x <= width; x += 16) ctx.lineTo(x, top + Math.sin(x * 0.01 + time * 0.2 + i) * 6);
    for (let x = width; x >= 0; x -= 16) ctx.lineTo(x, hem(x + off));
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Fireworks: one goes up every 1.1 s or so somewhere over the right of the sky - a rising spark, then a
// burst of a hundred-odd sparks in one colour falling away and fading, a few crackling after.
const FIRE = ['255,120,150', '255,210,110', '140,220,255', '190,150,255', '150,240,170', '255,170,90'];
function fireworks(ctx, cam, width, y0, time, eve) {
  const k = smooth(Math.min(1, (eve - 0.45) / 0.35));
  if (k <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const every = 0.8;
  const now = Math.floor(time / every);
  for (let n = now - 3; n <= now; n++) {
    const age = time - n * every;
    if (age < 0) continue;
    const bx = width * (0.35 + 0.6 * hash(n * 1.7)) - cam.x * 0.01;
    const by = 24 + hash(n * 3.1) * 40;
    const rgb = FIRE[Math.floor(hash(n * 5.3) * FIRE.length)];
    const rise = 0.45;
    if (age < rise) {
      const u = age / rise;
      ctx.fillStyle = `rgba(255,240,210,${0.9 * k})`;
      ctx.fillRect(bx - 0.6, y0 + 20 + (by - y0 - 20) * u - 0.6, 1.2, 2.4);
      continue;
    }
    const a = age - rise;
    if (a > 2.4) continue;
    const fade = Math.max(0, 1 - a / 2.4);
    const R = 38 * (1 - Math.exp(-a * 3.2));
    if (a < 0.4) {
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, 54);
      g.addColorStop(0, `rgba(${rgb},${0.45 * k * (1 - a / 0.4)})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(bx - 54, by - 54, 108, 108);
    }
    // Streaks out from the middle, drooping as they fall, each with a bright spark at its head; a
    // smaller inner ring in white.
    ctx.lineCap = 'round';
    for (const [ring, count, r0, c, wdt] of [[0, 44, 1, rgb, 1.6], [1, 18, 0.5, '255,250,235', 1.2]]) {
      ctx.strokeStyle = `rgba(${c},${0.9 * fade * k})`;
      ctx.lineWidth = wdt;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * TAU + hash(n * 3 + i + ring) * 0.12;
        const rr = R * r0 * (0.9 + 0.2 * hash(n + i * 1.3));
        const hx = bx + Math.cos(ang) * rr;
        const hy = by + Math.sin(ang) * rr + a * a * 10;
        const tx = bx + Math.cos(ang) * rr * 0.62;
        const ty = by + Math.sin(ang) * rr * 0.62 + a * a * 6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(hx, hy);
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';
    if (a > 1 && a < 1.8) {
      ctx.fillStyle = `rgba(255,250,230,${0.8 * k * (Math.sin(a * 40) > 0 ? 1 : 0.2)})`;
      for (let i = 0; i < 6; i++) ctx.fillRect(bx + (hash(n * 9 + i) - 0.5) * 60, by + (hash(n * 7 + i) - 0.3) * 50, 1, 1);
    }
  }
  ctx.restore();
}

// ---------- In the garden, behind the Mochi ----------
// Pampas along the fences and the orchard's edge (world x), and the moon lanterns' string.
const PAMPAS = [356, 604, 744, 1250, 1404, 2046];
const STRING = { x0: 1442, x1: 1628, h: 88, n: 6 };
export function drawFestivalBack(ctx, world, cam, time, spots, pounding, extras = {}) {
  const F = FEST.now;
  if (!F || F.k <= 0.01) return;
  const map = world.map;
  const night = Math.max(map.night ?? 0, (F.eve ?? 0) * 0.6);
  ctx.save();
  ctx.globalAlpha = F.k;
  if (F.id === 'blossom') {
    blooms(ctx, map, cam);
    lanternString(ctx, map, cam, time, night, BLOSSOM_STRING);
    if (spots) mat(ctx, spots.mat - cam.x, groundAt(map, spots.mat) - cam.y, time, night);
    ctx.restore();
    return;
  }
  if (F.id === 'lantern') {
    lanternString(ctx, map, cam, time, night, SUMMER_STRING);
    chimes(ctx, map, cam, time);
    for (const b of extras.boats ?? []) lanternBoat(ctx, b, cam, time, map, night);
    ctx.restore();
    return;
  }
  if (F.id === 'snow') {
    lanternString(ctx, map, cam, time, night, SNOW_STRING);
    for (const wx of extras.lanterns ?? []) snowLantern(ctx, wx - cam.x, groundAt(map, wx) - cam.y, time, extras.lit?.has(wx) || F.eve > 0.8, wx);
    for (const s of extras.snowballs ?? []) snowball(ctx, s, cam, map);
    ctx.restore();
    return;
  }
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
const MOON_STRING = { body: '#fff6e6', lit: '#fff0c8', band: '#e05a3a', mark: '#f2b84a' };
const SNOW_STRING = { body: '#fffaf2', lit: '#fff2d0', band: '#5a8ad8', mark: '#a8d0f8' };
const BLOSSOM_STRING = { body: '#ffe4ee', lit: '#fff0f4', band: '#ff8fb4', mark: '#ffffff' };
const SUMMER_STRING = { body: '#ff6a5a', lit: '#ff9a7a', band: '#2a2a3a', mark: '#ffffff' };
function lanternString(ctx, map, cam, time, night, P = MOON_STRING) {
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
    ctx.fillStyle = night > 0.3 ? P.lit : P.body;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 4.2, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = P.band;
    ctx.fillRect(lx - 2.6, ly - 5, 5.2, 1.2);
    ctx.fillRect(lx - 2.6, ly + 3.8, 5.2, 1.2);
    ctx.fillStyle = P.mark;
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
  if (F.id === 'snow') return flakes(ctx, time, F.k);
  if (F.id === 'blossom') return petals(ctx, time, F.k);
  if (F.id !== 'moon') return;
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

// ---------- The Snow Lantern Festival's pieces ----------
// A snow lantern: a little mound of packed snow with a roof slab on top and an arched window; lit, a
// candle flickers in it and it glows warm on the snow round it.
function snowLantern(ctx, x0, gy0, time, lit, seed) {
  // (Drawn a quarter larger than its own sizes, about knee-high on a Mochi.)
  ctx.save();
  ctx.translate(x0, gy0);
  ctx.scale(1.25, 1.25);
  const x = 0;
  const gy = 0;
  snowLanternAt(ctx, x, gy, time, lit, seed);
  ctx.restore();
}
function snowLanternAt(ctx, x, gy, time, lit, seed) {
  if (lit) {
    const fl = 0.85 + 0.15 * Math.sin(time * 9 + seed) * Math.sin(time * 5.3 + seed * 2);
    glowAt(ctx, x, gy - 7, 22, '255,200,120', 0.5 * fl);
  }
  ctx.fillStyle = '#d4e0f4';
  ctx.beginPath();
  ctx.ellipse(x, gy, 8.4, 2.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f4f8ff';
  ctx.beginPath();
  ctx.moveTo(x - 7, gy);
  ctx.quadraticCurveTo(x - 7.6, gy - 9, x - 4, gy - 11);
  ctx.lineTo(x + 4, gy - 11);
  ctx.quadraticCurveTo(x + 7.6, gy - 9, x + 7, gy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#dce6f6';
  ctx.beginPath();
  ctx.moveTo(x + 3, gy - 11);
  ctx.quadraticCurveTo(x + 7.6, gy - 9, x + 7, gy);
  ctx.lineTo(x + 4, gy);
  ctx.closePath();
  ctx.fill();
  // Its roof: a fat slab of snow.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x, gy - 12, 8.6, 3, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e6eefa';
  ctx.fillRect(x - 7, gy - 11.6, 14, 1);
  // The window: dark, or the candle's warm light.
  const wy = gy - 8.6;
  ctx.fillStyle = lit ? '#ffcc6a' : '#5a6a8a';
  ctx.beginPath();
  ctx.moveTo(x - 2.6, gy - 3.4);
  ctx.lineTo(x - 2.6, wy);
  ctx.quadraticCurveTo(x, wy - 2.6, x + 2.6, wy);
  ctx.lineTo(x + 2.6, gy - 3.4);
  ctx.closePath();
  ctx.fill();
  if (lit) {
    ctx.fillStyle = '#fff6d6';
    const fl = Math.sin(time * 11 + seed) * 0.4;
    ctx.beginPath();
    ctx.ellipse(x + fl * 0.4, gy - 6.4, 0.9, 1.6 + fl * 0.3, 0, 0, TAU);
    ctx.fill();
  }
}
// A snowball in flight between two friends (`s`: from, to, k along), and the splat where it lands.
function snowball(ctx, s, cam, map) {
  if (s.k < 1) {
    const x = s.x0 + (s.x1 - s.x0) * s.k - cam.x;
    const y = s.y0 + (s.y1 - s.y0) * s.k - 12 * Math.sin(Math.PI * s.k) - cam.y;
    ctx.fillStyle = '#c8d4ea';
    ctx.beginPath();
    ctx.arc(x + 0.4, y + 0.4, 2.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, TAU);
    ctx.fill();
    return;
  }
  const u = Math.min(1, (s.k - 1) / 1.2);
  if (u >= 1) return;
  ctx.fillStyle = `rgba(255,255,255,${0.95 * (1 - u)})`;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    const r = 2 + u * 9;
    ctx.beginPath();
    ctx.arc(s.x1 - cam.x + Math.cos(a) * r, s.y1 - cam.y + Math.sin(a) * r * 0.7 - u * 3, 1.4 * (1 - u * 0.5), 0, TAU);
    ctx.fill();
  }
}
// A few flakes drifting down in front.
function flakes(ctx, time, k) {
  ctx.save();
  for (let i = 0; i < 26; i++) {
    const fall = 10 + hash(i * 1.7) * 12;
    const y = ((hash(i * 5.3) * (VH + 20) + time * fall) % (VH + 20)) - 10;
    const x = ((hash(i * 2.9) * (VW + 20) + Math.sin(time * 0.8 + i * 1.3) * 10 + time * 3) % (VW + 20)) - 10;
    ctx.globalAlpha = k * (0.5 + 0.4 * hash(i * 3.3));
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 0.9 + hash(i * 7.7) * 1.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Blossom Day's pieces ----------
// The bloom laid over the garden's own trees: on each canopy clump (the same clumps render/garden.js
// grows its trees from - keep them in step), pale pink puffs and little five-petalled flowers.
const BIG_CLUMPS = [
  [60, 88, 30, 21], [96, 100, 28, 19], [168, 96, 30, 20], [206, 92, 28, 19],
  [78, 62, 34, 23], [128, 86, 34, 22], [182, 64, 33, 22],
  [108, 46, 36, 24], [152, 44, 34, 23], [130, 24, 30, 20],
];
const FRUIT_SHAPE = [{ lean: -3, h: 118 }, { lean: 4, h: 128 }, { lean: -5, h: 112 }, { lean: 3, h: 124 }];
const fruitClumps = (v) => {
  const f = FRUIT_SHAPE[v % 4];
  const top = 150 - f.h;
  const c = [[60 + f.lean, top + 26, 40, 26], [36 + f.lean, top + 40, 24, 18], [86 + f.lean, top + 38, 26, 19]];
  if (v % 2) c.push([62 + f.lean, top + 8, 24, 16]);
  return c;
};
function bloomOn(clumps, seed) {
  const out = [];
  for (const [i, [cx, cy, rx, ry]] of clumps.entries()) {
    const n = Math.round((rx * ry) / 34);
    for (let j = 0; j < n; j++) {
      const a = hash(seed + i * 13 + j * 1.7) * TAU;
      const r = Math.sqrt(hash(seed * 3 + i * 7 + j * 2.9));
      const px = cx + Math.cos(a) * rx * 0.85 * r;
      const py = cy + Math.sin(a) * ry * 0.8 * r;
      if (j % 3 === 0) out.push(FLAT(E(px, py, 4.2, 3.2, '#ffd6e4')));
      else {
        const pr = 1.3;
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * TAU + j;
          out.push(FLAT(E(px + Math.cos(pa) * pr, py + Math.sin(pa) * pr, 1.3, 1.3, j % 2 ? '#ffc2d6' : '#ffe4ee')));
        }
        out.push(FLAT(E(px, py, 0.7, 0.7, '#ff7aa6')));
      }
    }
  }
  return out;
}
const bigBloom = () => art('fest-bloom-big', 260, 236, () => bloomOn(BIG_CLUMPS, 3));
const fruitBloom = (v) => art(`fest-bloom-f${v}`, 120, 150, () => bloomOn(fruitClumps(v), 7 + v));
function blooms(ctx, map, cam) {
  for (const [kind, wx, extra] of map.townPieces ?? []) {
    const x = wx - cam.x;
    if (x < -150 || x > VW + 150) continue;
    if (kind === 'mg_bigtree') place(ctx, bigBloom(), snap(x), groundAt(map, wx) - cam.y + 4);
    if (kind === 'mg_fruittree') {
      const foot = Math.max(groundAt(map, wx - 9), groundAt(map, wx + 9)) - cam.y;
      place(ctx, fruitBloom(extra ?? 0), snap(x), foot + 5);
    }
  }
}
// The picnic mat: red with a white border, a stacked lunch box tied in a cloth, a teapot and cups; a
// pink lantern on a post at either end, lit at dusk.
function mat(ctx, x, gy, time, night) {
  for (const side of [-1, 1]) {
    const px = x + side * 36;
    if (night > 0.05) glowAt(ctx, px, gy - 24, 18, '255,190,210', 0.5 * night);
    ctx.fillStyle = '#8a5a34';
    ctx.fillRect(px - 0.8, gy - 20, 1.6, 20);
    ctx.fillStyle = night > 0.3 ? '#fff0f4' : '#ffe4ee';
    ctx.fillRect(px - 3.6, gy - 30, 7.2, 10);
    ctx.fillStyle = '#ff8fb4';
    ctx.fillRect(px - 4.2, gy - 31, 8.4, 1.6);
    ctx.fillRect(px - 4.2, gy - 21, 8.4, 1.2);
    ctx.fillStyle = 'rgba(255,143,180,0.5)';
    ctx.fillRect(px - 1, gy - 27, 2, 4);
  }
  ctx.fillStyle = '#c8303a';
  ctx.beginPath();
  ctx.moveTo(x - 28, gy + 1);
  ctx.lineTo(x + 28, gy + 1);
  ctx.lineTo(x + 25, gy - 3);
  ctx.lineTo(x - 25, gy - 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2e8e0';
  ctx.fillRect(x - 27, gy, 54, 0.9);
  ctx.fillRect(x - 25, gy - 3, 50, 0.7);
  // The lunch box: three tiers, lacquer black and red, wrapped in a pink cloth knotted on top.
  const bx = x + 8;
  ctx.fillStyle = '#2a1e2a';
  ctx.fillRect(bx - 5, gy - 11, 10, 8);
  ctx.fillStyle = '#c8303a';
  ctx.fillRect(bx - 5, gy - 8.4, 10, 0.8);
  ctx.fillRect(bx - 5, gy - 5.6, 10, 0.8);
  ctx.fillStyle = '#ffb3c8';
  ctx.fillRect(bx - 1.4, gy - 11, 2.8, 8);
  ctx.beginPath();
  ctx.ellipse(bx - 2, gy - 12, 2, 1.2, -0.4, 0, TAU);
  ctx.ellipse(bx + 2, gy - 12, 2, 1.2, 0.4, 0, TAU);
  ctx.fill();
  // The teapot and two cups.
  const tx = x - 10;
  ctx.fillStyle = '#6a8a6a';
  ctx.beginPath();
  ctx.ellipse(tx, gy - 6, 4, 3.4, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(tx + 3, gy - 7, 3, 1);
  ctx.fillStyle = '#4a6a4a';
  ctx.fillRect(tx - 1, gy - 10, 2, 1.2);
  ctx.fillStyle = '#f4f0e8';
  ctx.fillRect(tx - 9, gy - 5, 3, 2.4);
  ctx.fillRect(tx + 9.4, gy - 5, 3, 2.4);
  // A wisp of steam.
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(tx + 6, gy - 8);
  ctx.quadraticCurveTo(tx + 8 + Math.sin(time * 2) * 1.4, gy - 11, tx + 6, gy - 14);
  ctx.stroke();
}
// Petals drifting down in front, plenty of them.
function petals(ctx, time, k) {
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const fall = 10 + hash(i * 2.7) * 10;
    const y = ((hash(i * 4.1) * (VH + 40) + time * fall) % (VH + 40)) - 20;
    const x = ((hash(i * 6.3) * (VW + 60) + time * (8 + hash(i) * 10) + Math.sin(time * 1.1 + i * 1.9) * 16) % (VW + 60)) - 30;
    ctx.globalAlpha = k * 0.9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * (0.8 + hash(i * 5) * 1.4) + i);
    ctx.scale(Math.cos(time * (1.6 + hash(i * 9)) + i), 1);
    ctx.fillStyle = i % 3 ? '#ffc2d6' : '#ffe4ee';
    ctx.beginPath();
    ctx.moveTo(0, -3.2);
    ctx.quadraticCurveTo(2.6, -1, 0, 2.6);
    ctx.quadraticCurveTo(-2.6, -1, 0, -3.2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ---------- Lantern Night's pieces ----------
// Wind chimes on the lantern string's poles: a glass bell painted with a little sun, its paper strip
// swinging under it - harder in a wind.
function chimes(ctx, map, cam, time) {
  for (const [i, wx] of [STRING.x0, STRING.x1].entries()) {
    const x = wx - cam.x + (i ? -4 : 4);
    const gy = groundAt(map, wx) - cam.y - STRING.h + 6;
    const sw = Math.sin(time * 2.4 + i * 1.7) * 0.25 + Math.sin(time * 5.1 + i) * 0.08;
    ctx.save();
    ctx.translate(x, gy);
    ctx.rotate(sw * 0.4);
    ctx.fillStyle = 'rgba(220,240,255,0.85)';
    ctx.beginPath();
    ctx.arc(0, 3, 3.4, Math.PI, TAU);
    ctx.lineTo(3.4, 4.4);
    ctx.lineTo(-3.4, 4.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e05a3a';
    ctx.beginPath();
    ctx.arc(0, 2, 1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, 4.4);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.rotate(sw);
    ctx.fillStyle = '#fff6d6';
    ctx.fillRect(-1.2, 8, 2.4, 7);
    ctx.fillStyle = '#5a8ad8';
    ctx.fillRect(-1.2, 10, 2.4, 0.8);
    ctx.restore();
  }
}
// A lantern boat on the pond (`b`: set afloat at t0 from x0), drifting off across it on the little
// current, bobbing, its paper glowing, fading as it reaches the far reeds.
function lanternBoat(ctx, b, cam, time, map, night) {
  const age = time - b.t0;
  if (age < 0) return;
  // (Set down at the top of the bank, it slides down to the water, then drifts off across it.)
  const pond = map.water?.[0];
  const start = pond?.x1 ?? 2176;
  const water = pond?.y ?? 760;
  const slide = Math.max(0, (start + 4 - b.x0) / 40);
  const wx = age < slide ? b.x0 + age * 40 : start + 4 + (age - slide) * (5 + (b.seed % 7) * 0.4);
  if (wx > 2570) return;
  const x = wx - cam.x;
  const y = (age < slide ? Math.min(water, groundAt(map, wx)) : water) - cam.y + (age < slide ? 0 : Math.sin(time * 1.6 + b.seed) * 0.8) - 1;
  const fade = Math.min(1, age / 0.6) * Math.max(0, Math.min(1, (2570 - wx) / 60));
  ctx.save();
  ctx.globalAlpha *= fade;
  glowAt(ctx, x, y - 4, 14, '255,200,120', 0.35 + 0.4 * night);
  ctx.fillStyle = 'rgba(255,200,120,0.25)';
  ctx.fillRect(x - 3, y + 1.4, 6, 3);
  ctx.fillStyle = '#c8945a';
  ctx.beginPath();
  ctx.moveTo(x - 4.4, y - 1);
  ctx.lineTo(x + 4.4, y - 1);
  ctx.lineTo(x + 3.2, y + 1);
  ctx.lineTo(x - 3.2, y + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff2d6';
  ctx.fillRect(x - 2.6, y - 6.6, 5.2, 5.6);
  ctx.fillStyle = '#e05a3a';
  ctx.fillRect(x - 2.6, y - 7, 5.2, 1);
  const fl = 0.7 + 0.3 * Math.sin(time * 9 + b.seed);
  ctx.fillStyle = `rgba(255,190,90,${0.7 * fl})`;
  ctx.fillRect(x - 1, y - 5, 2, 2.6);
  ctx.restore();
}

// ---------- The festival stall, in the Mochi Market (render/garden.js 'mg_moonstall') ----------
// Up only on a festival day: a little wooden cart under an indigo awning with a gold moon on it,
// paper lanterns at its corners, a pyramid of dango on the counter, and its sign: DANGO.
const STALLS = {
  moon: { awning: ['#2e3a7a', '#3a4a8a'], sign: 'DANGO', ink: '#2e3a7a', emblem: 'moon', goods: 'dango' },
  snow: { awning: ['#3a6ab0', '#4a7ac4'], sign: 'SNOW', ink: '#3a6ab0', emblem: 'flake', goods: 'snowballs' },
  blossom: { awning: ['#e0659f', '#f07ab0'], sign: 'PETALS', ink: '#c0407a', emblem: 'flower', goods: 'dango3' },
  lantern: { awning: ['#c8303a', '#e04a4a'], sign: 'RINGS', ink: '#c8303a', emblem: 'flake', goods: 'rings' },
};
export function drawFestivalStall(ctx, x, gy, time, wx) {
  const F = FEST.now;
  if (!F || F.k <= 0.3) return;
  const S = STALLS[F.id] ?? STALLS.moon;
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
  ctx.fillStyle = S.awning[0];
  ctx.fillRect(x - 32, gy - 62, 64, 9);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? S.awning[1] : S.awning[0];
    ctx.beginPath();
    ctx.moveTo(x - 32 + i * 8, gy - 53);
    ctx.lineTo(x - 24 + i * 8, gy - 53);
    ctx.lineTo(x - 28 + i * 8, gy - 49 + Math.sin(time * 2 + i + wx) * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  if (S.emblem === 'moon') {
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(x, gy - 57.6, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = S.awning[0];
    ctx.beginPath();
    ctx.arc(x + 1.4, gy - 58.4, 2.8, 0, TAU);
    ctx.fill();
  } else if (S.emblem === 'flower') {
    ctx.fillStyle = '#ffffff';
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * TAU - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * 2, gy - 57.6 + Math.sin(a) * 2, 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd86a';
    ctx.beginPath();
    ctx.arc(x, gy - 57.6, 1, 0, TAU);
    ctx.fill();
  } else {
    // A snowflake (or, for Lantern Night, a little firework): three crossed strokes.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * 3.6, gy - 57.6 - Math.sin(a) * 3.6);
      ctx.lineTo(x + Math.cos(a) * 3.6, gy - 57.6 + Math.sin(a) * 3.6);
      ctx.stroke();
    }
  }
  // The sign along the counter's front.
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(x - 17, gy - 21, 34, 8);
  signText(ctx, S.sign, x, gy - 18.6, { align: 'center', color: S.ink });
  // On the counter: a pyramid of dango (or snowballs), and a jar of skewers.
  for (const [row, n] of [[0, 3], [1, 2], [2, 1]]) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = S.goods === 'snowballs' ? '#f4f8ff' : '#fffcf4';
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
