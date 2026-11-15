// The Mochi Garden's weather, painted (world/garden-weather.js has what it is, and when).
//
// Rain: grey clouds rolling in over the valley and the light going dim; the rain itself, soft short
// streaks slanting down in front of everything, locked to the world so it drifts by as you walk;
// little crowns of splash springing up off the grass; rings spreading on the pond; and puddles in
// the open grass (world/garden-life.js PUDDLES) that fill as it rains and shrink as the ground dries,
// raindrops ringing in them. A Mochi jumping in one throws the water up in a crown round its feet.
// After a shower in daylight: a rainbow, pastel, arching behind the far hills.
//
// Everything here is drawn fresh each frame from the clock (no sprites to repaint), by position and
// time alone, so nothing needs keeping between frames.

import { SKY } from '../world/garden-weather.js';
import { PUDDLES, SNOWMAN_X, WIND_DIR } from '../world/garden-life.js';
import { groundAt } from '../world/physics.js';
import { VW, VH } from '../input.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
// (The pond's water, x from bank to bank, and its surface: world/garden.js.)
const POND = [2192, 2572];
const POND_Y = 760;
// (Where the grass is that rain splashes off: the square and the orchard, not the pond or the cliff.)
const LAND = [0, 2176];

// ---------- The sky (from the garden's backdrop, render/gardenart.js) ----------
// Drawn behind the far hills: a rainbow, then over the sky the grey of a rain cloud bank.
export function drawWeatherSky(ctx, cam, width, y0, time) {
  const W = SKY.now;
  if (!W) return;
  if (W.rainbow > 0.01) drawRainbow(ctx, cam, width, y0, W.rainbow);
  const grey = W.kind === 'rain' || W.kind === 'snow' ? W.k : 0;
  if (grey < 0.01) return;
  const snow = W.kind === 'snow';
  const g = ctx.createLinearGradient(0, 0, 0, y0 + 30);
  g.addColorStop(0, snow ? `rgba(206,212,226,${0.75 * grey})` : `rgba(140,152,172,${0.72 * grey})`);
  g.addColorStop(1, snow ? `rgba(226,230,238,${0.45 * grey})` : `rgba(190,198,210,${0.4 * grey})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, y0 + 30);
  // The cloud bank: big soft puffs along the top of the sky, rolling slowly by.
  const base = snow ? '#c4cad8' : '#a2acbe';
  const lit = snow ? '#e2e6ee' : '#c2cad8';
  const span = width + 160;
  const puffs = [];
  for (let i = 0; i < Math.ceil(span / 46); i++) {
    const x = ((((i * 46 - cam.x * 0.04 - time * 2.4) % span) + span) % span) - 80;
    const y = 4 + hash(i * 3.1) * 16;
    const r = 18 + hash(i * 1.7) * 14;
    puffs.push([x, y, r], [x + r * 0.7, y + 6, r * 0.7]);
  }
  // (A thick cloud rolled over the sun, so it's gone behind them as the rain comes on: the sky's own
  // sun sits at 0.8 of the way across, 56 down, render/scenery.js.)
  for (const [dx, dy, r] of [[-30, 2, 26], [-6, -8, 30], [20, 0, 28], [40, 8, 22], [-2, 18, 24], [-40, 16, 18]]) puffs.push([width * 0.8 + dx, 56 + dy, r]);
  ctx.globalAlpha = Math.min(1, grey * 1.1);
  ctx.fillStyle = base;
  for (const [x, y, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = lit;
  for (const [x, y, r] of puffs) {
    ctx.beginPath();
    ctx.arc(x - r * 0.15, y - r * 0.25, r * 0.7, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// A rainbow over the valley: seven soft pastel bands, its feet behind the far hills.
const BOW = ['#ffb3c6', '#ffd2a6', '#fff2a6', '#c8f2c8', '#b8e2ff', '#c4c8ff', '#e2c4ff'];
function drawRainbow(ctx, cam, width, y0, k) {
  const cx = width * 0.58 - cam.x * 0.015;
  const cy = y0 + 46;
  ctx.save();
  ctx.lineWidth = 3.4;
  ctx.globalAlpha = 0.6 * k;
  BOW.forEach((c, i) => {
    ctx.strokeStyle = c;
    ctx.beginPath();
    ctx.arc(cx, cy, 168 - i * 3.2, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
  });
  // (A soft glow along it.)
  ctx.globalAlpha = 0.12 * k;
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 158, Math.PI * 1.06, Math.PI * 1.94);
  ctx.stroke();
  ctx.restore();
}

// ---------- On the ground (render/garden.js drawGardenLife, behind the Mochi) ----------
// Snow lying on the grass: a soft white blanket along the top of the ground (the square and the
// orchard), as deep as it lies, its edge a little uneven, a cool shade under it.
function drawSnowCover(ctx, map, cam, W) {
  const th = 4.2 * W.snow;
  if (th < 0.2) return;
  const pts = [];
  for (let sx = -6; sx <= VW + 6; sx += 3) {
    const wx = Math.max(LAND[0], Math.min(LAND[1] - 8, sx + cam.x));
    const gy = groundAt(map, wx) - cam.y;
    pts.push([wx - cam.x, gy, th * (0.85 + 0.15 * Math.sin(wx * 0.09) + 0.08 * Math.sin(wx * 0.31))]);
  }
  for (const [col, dy] of [['#d6e2f2', 0.9], ['#f6f9ff', 0]]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([x, gy, t], i) => (i ? ctx.lineTo(x, gy - t + dy) : ctx.moveTo(x, gy - t + dy)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 1.2);
    ctx.closePath();
    ctx.fill();
  }
}
// The snow-mochi the Mochi build by the square: two snowballs, a dot face with rosy cheeks, a little
// green sprout on top like theirs and twig arms - growing as the snow lies, and melting away after.
function drawSnowMochi(ctx, map, cam, W, time) {
  const k = Math.max(0, Math.min(1, (W.snow - 0.25) / 0.6));
  if (k < 0.04) return;
  const size = k * k * (3 - 2 * k);
  const x = SNOWMAN_X - cam.x;
  if (x < -30 || x > VW + 30) return;
  const gy = groundAt(map, SNOWMAN_X) - cam.y - 2;
  // (About as tall as the Mochi who build it.)
  const r1 = 11 * size;
  const r2 = 7.8 * size;
  const by = gy - r1 * 0.88;
  const hy = by - r1 * 0.72 - r2 * 0.72;
  ctx.strokeStyle = '#8a6a50';
  ctx.lineWidth = 0.9;
  ctx.lineCap = 'round';
  if (size > 0.5) {
    ctx.beginPath();
    ctx.moveTo(x - r1 * 0.8, by - r1 * 0.2);
    ctx.lineTo(x - r1 * 1.5, by - r1 * 0.75);
    ctx.lineTo(x - r1 * 1.7, by - r1 * 0.55);
    ctx.moveTo(x + r1 * 0.8, by - r1 * 0.2);
    ctx.lineTo(x + r1 * 1.5, by - r1 * 0.8);
    ctx.lineTo(x + r1 * 1.4, by - r1);
    ctx.stroke();
  }
  for (const [cy, r] of [[by, r1], [hy, r2]]) {
    ctx.fillStyle = '#c4d0e2';
    ctx.beginPath();
    ctx.arc(x, cy, r + 0.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fbfdff';
    ctx.beginPath();
    ctx.arc(x, cy, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e4ecf8';
    ctx.beginPath();
    ctx.arc(x + r * 0.15, cy + r * 0.25, r * 0.78, 0.1 * Math.PI, 0.95 * Math.PI);
    ctx.fill();
  }
  if (size > 0.45) {
    ctx.fillStyle = '#3a2d4f';
    ctx.fillRect(x - r2 * 0.42, hy - r2 * 0.12, 1.3, 1.6);
    ctx.fillRect(x + r2 * 0.26, hy - r2 * 0.12, 1.3, 1.6);
    ctx.fillStyle = '#ffb3c6';
    ctx.fillRect(x - r2 * 0.68, hy + r2 * 0.22, 1.4, 0.8);
    ctx.fillRect(x + r2 * 0.42, hy + r2 * 0.22, 1.4, 0.8);
    ctx.fillStyle = '#3a2d4f';
    ctx.fillRect(x - 0.6, hy + r2 * 0.3, 1.2, 0.6);
    // Its sprout, nodding.
    const nod = Math.sin(time * 1.6) * 0.15;
    ctx.save();
    ctx.translate(x, hy - r2 + 0.4);
    ctx.rotate(nod);
    ctx.fillStyle = '#4e9a62';
    ctx.fillRect(-0.4, -3.2, 0.8, 3.4);
    ctx.fillStyle = '#7cc488';
    ctx.beginPath();
    ctx.ellipse(-1.8, -3.4, 1.8, 0.9, -0.4, 0, TAU);
    ctx.ellipse(1.8, -3.8, 1.8, 0.9, 0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}
export function drawWeatherGround(ctx, world, cam, time) {
  const W = world.gardenWeather;
  if (!W) return;
  const map = world.map;
  if (W.snow > 0.01) {
    drawSnowCover(ctx, map, cam, W);
    drawSnowMochi(ctx, map, cam, W, time);
  }
  const raining = W.kind === 'rain' ? W.k : 0;
  // The puddles, as full as the ground is wet.
  if (W.wet > 0.02) {
    for (const [px, r] of PUDDLES) {
      const x = px - cam.x;
      if (x < -30 || x > VW + 30) continue;
      const gy = groundAt(map, px) - cam.y;
      const rr = r * (0.3 + 0.7 * W.wet);
      const ry = rr * 0.26;
      ctx.fillStyle = 'rgba(70,96,120,0.32)';
      ctx.beginPath();
      ctx.ellipse(x, gy - 0.4, rr + 1, ry + 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#b4d2e8';
      ctx.beginPath();
      ctx.ellipse(x, gy - 0.6, rr, ry, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e6f3fc';
      ctx.beginPath();
      ctx.ellipse(x - rr * 0.32, gy - 0.6 - ry * 0.35, rr * 0.34, Math.max(0.4, ry * 0.22), 0, 0, TAU);
      ctx.fill();
      // Raindrops ringing in it.
      if (raining > 0.05) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        for (let j = 0; j < 3; j++) {
          const t = time * 2.2 + hash(px + j * 9);
          const slot = Math.floor(t);
          const u = t - slot;
          if (hash(px * 0.3 + slot * 1.7 + j) > raining) continue;
          ctx.globalAlpha = 0.8 * (1 - u);
          ctx.beginPath();
          ctx.ellipse(x + (hash(px * 3 + slot + j * 5) - 0.5) * rr * 1.2, gy - 0.6, 0.6 + u * rr * 0.32, 0.25 + u * ry * 0.4, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  }
  if (raining > 0.02) {
    // Little crowns of splash springing up off the grass.
    ctx.fillStyle = '#eef6ff';
    const n = Math.round(30 * raining);
    for (let i = 0; i < n; i++) {
      const t = time / 0.22 + hash(i * 1.3);
      const slot = Math.floor(t);
      const u = t - slot;
      const wx = cam.x - 20 + hash(i * 7.1 + slot * 1.3) * (VW + 40);
      if (wx < LAND[0] || wx > LAND[1]) continue;
      const x = wx - cam.x;
      const gy = groundAt(map, wx) - cam.y;
      ctx.globalAlpha = 0.85 * (1 - u);
      const h = Math.sin(Math.PI * u) * 2.2;
      ctx.fillRect(x - 1.6 - u * 1.4, gy - 1 - h, 0.8, 0.8);
      ctx.fillRect(x - 0.4, gy - 1.6 - h * 1.3, 0.8, 0.8);
      ctx.fillRect(x + 0.8 + u * 1.4, gy - 1 - h, 0.8, 0.8);
    }
    // Rings spreading on the pond.
    const py = POND_Y - cam.y;
    ctx.strokeStyle = '#eaf6ff';
    ctx.lineWidth = 0.6;
    const m = Math.round(16 * raining);
    for (let i = 0; i < m; i++) {
      const t = time * 1.1 + hash(i * 2.3);
      const slot = Math.floor(t);
      const u = t - slot;
      const wx = POND[0] + hash(i * 5.3 + slot * 2.1) * (POND[1] - POND[0]);
      const x = wx - cam.x;
      if (x < -20 || x > VW + 20) continue;
      ctx.globalAlpha = 0.75 * (1 - u);
      ctx.beginPath();
      ctx.ellipse(x, py + 1 + hash(i * 9.1 + slot) * 3, 0.8 + u * 6, 0.3 + u * 1.6, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// A Mochi jumping in a puddle (render/mochi-anim.js 'splash': it lands at 0.55 and again, smaller,
// at 0.92 of each go): a ring spreading round its feet and the water thrown up either side in a
// crown of drops, falling back.
const SPLASH_LOOP = [0.1, 1.1];
export function drawSplashes(ctx, world, cam, time) {
  for (const e of world.gardenLife?.mochi ?? []) {
    const a = e.m?.action;
    if (a?.name !== 'splash' || a.t0 == null || e.hidden || e.x == null) continue;
    const el = time - a.t0;
    const t = el < SPLASH_LOOP[0] ? el : SPLASH_LOOP[0] + ((el - SPLASH_LOOP[0]) % (SPLASH_LOOP[1] - SPLASH_LOOP[0]));
    const x = e.x - cam.x;
    const gy = e.y - cam.y;
    const k = e.m.size === 'baby' ? 0.7 : 1;
    for (const [at, big] of [[0.55, 1], [0.92, 0.55]]) {
      let u = t - at;
      if (u < 0) u += SPLASH_LOOP[1] - SPLASH_LOOP[0];
      if (u > 0.42 || el < at) continue;
      const q = u / 0.42;
      ctx.strokeStyle = '#eaf6ff';
      ctx.lineWidth = 0.7;
      ctx.globalAlpha = 0.85 * (1 - q);
      ctx.beginPath();
      ctx.ellipse(x, gy - 0.5, (4 + q * 15) * big * k, (1 + q * 3) * big * k, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#e2f2ff';
      for (let i = 0; i < 10; i++) {
        const side = i % 2 ? 1 : -1;
        const sp = (0.6 + hash(i * 3.7) * 0.6) * big * k;
        const dx = side * (3 + (8 + i) * q * sp * 1.4);
        const dy = -(Math.sin(Math.PI * Math.min(1, q * 1.15)) * (10 + hash(i * 1.9) * 10) * sp);
        const sz = i < 4 ? 1.8 : 1.2;
        ctx.fillRect(x + dx - sz / 2, gy - 1 + dy - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- In front of everything (drawGardenLife's front layer) ----------
// The rain itself: soft short streaks slanting down, a few bigger drops among them.
export function drawWeatherFront(ctx, world, cam, time) {
  const W = world.gardenWeather;
  if (!W || !W.kind || W.k < 0.01) return;
  if (W.kind === 'snow') return drawSnowfall(ctx, cam, W, time);
  if (W.kind === 'wind') return drawWind(ctx, cam, W, time);
  const n = Math.round(170 * W.k);
  const span = VW + 60;
  const fall = VH + 40;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sp = 260 + hash(i * 3.1) * 110;
    const y = ((time * sp + hash(i * 7.7) * fall) % fall) - 20;
    const x = ((((hash(i * 1.9) * 4000 - cam.x - y * 0.16) % span) + span) % span) - 30;
    const big = i % 9 === 0;
    const len = big ? 8 : 5.5 + hash(i * 2.3) * 2.5;
    ctx.strokeStyle = big ? 'rgba(230,242,255,0.9)' : 'rgba(214,232,252,0.78)';
    ctx.lineWidth = big ? 1.3 : 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * 0.16, y - len);
    ctx.stroke();
  }
  ctx.restore();
}
// Snow falling: soft round flakes, the near ones bigger, drifting down slowly and swaying as they go.
function drawSnowfall(ctx, cam, W, time) {
  const n = Math.round(110 * W.k);
  const span = VW + 60;
  const fall = VH + 40;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const near = hash(i * 2.3);
    const sp = 14 + near * 22;
    const y = ((time * sp + hash(i * 7.7) * fall) % fall) - 20;
    const sway = Math.sin(time * (0.8 + near) + i * 1.7) * (3 + near * 4);
    const x = ((((hash(i * 1.9) * 4000 - cam.x * (0.8 + near * 0.3) + sway + WIND_DIR * y * 0.12) % span) + span) % span) - 30;
    const r = 0.6 + near * 1.2;
    ctx.globalAlpha = 0.65 + near * 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// The wind: leaves, petals and dandelion fluff tumbling through on the gusts, and a few soft wisps of
// breeze sweeping across.
const LEAVES = ['#6cb85e', '#a8d468', '#f0c45a', '#ffb3c8', '#ffd0dc', '#ffffff'];
function drawWind(ctx, cam, W, time) {
  const span = VW + 80;
  const n = Math.round(34 * W.k);
  for (let i = 0; i < n; i++) {
    const sp = (80 + hash(i * 2.1) * 80) * (0.7 + 0.3 * W.k);
    const x = ((((hash(i * 4.4) * 4000 + WIND_DIR * time * sp - cam.x) % span) + span) % span) - 40;
    const y = 30 + hash(i * 3.7) * (VH * 0.7) + Math.sin(time * (1.4 + hash(i)) + i) * 9 + ((time * 6 + i * 13) % 40);
    const kind = i % 3;
    const spin = time * (2.5 + hash(i * 5.5) * 4) + i;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    if (kind === 2) {
      // Dandelion fluff: a tiny seed on its little white star.
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let q = 0; q < 8; q++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos((q / 8) * TAU) * 3, Math.sin((q / 8) * TAU) * 3);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 1.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#c8b48c';
      ctx.fillRect(-0.5, 1, 1, 2.2);
    } else {
      // A leaf (or a petal), turning over as it tumbles.
      const c = LEAVES[(i * 7) % LEAVES.length];
      ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(spin * 0.7)));
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, kind ? 2.3 : 3.6, kind ? 1.7 : 1.8, 0, 0, TAU);
      ctx.fill();
      if (!kind) {
        ctx.strokeStyle = 'rgba(60,110,60,0.6)';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(-3.3, 0);
        ctx.lineTo(3.3, 0);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // Wisps of breeze.
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.3;
  for (let j = 0; j < 5; j++) {
    const u = (time * 0.42 + j / 5 + hash(j * 9)) % 1;
    const x = WIND_DIR < 0 ? VW + 60 - u * (VW + 160) : -60 + u * (VW + 160);
    const y = 40 + j * 52 + Math.sin(time * 0.6 + j) * 12;
    ctx.globalAlpha = Math.sin(Math.PI * u) * 0.7 * W.k;
    // (A long soft stroke of breeze, curling up at its tail.)
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - WIND_DIR * 30, y - 6, x - WIND_DIR * 58, y);
    ctx.quadraticCurveTo(x - WIND_DIR * 70, y + 3, x - WIND_DIR * 68, y + 8);
    ctx.quadraticCurveTo(x - WIND_DIR * 63, y + 11, x - WIND_DIR * 59, y + 7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
