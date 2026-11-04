// HD lighting, drawn over the world (not the interface): effects glow (bloom), light falls from
// the sky in soft rays, each map gets its own color grade, and a soft vignette frames the view.
// Only in HD graphics; the pixel-art look skips all of it.

import { gfx } from './pixel.js';
import { zoneLook } from './scenery.js';

// Per map theme: the warm light from above, the cool shade below and in the corners, how strong
// the light rays are (0 for night and underground maps), and how strongly pools of light gather
// around the hero and the portals (`pool`, strongest at night and underground, tinted `warm`).
const LOOKS = {
  meadow: { light: '#fff1c4', shade: '#8a78d0', rays: 0.55, sun: 0.8, pool: 0.07 },
  town: { light: '#fff1c4', shade: '#8a78d0', rays: 0.45, sun: 0.8, pool: 0.07 },
  forest: { light: '#f4ffc4', shade: '#3c7a6c', rays: 0.9, sun: 0.75, pool: 0.08 },
  harbor: { light: '#d4dcff', shade: '#3e3484', rays: 0, sun: 0.8, pool: 0.2, warm: '#ffd9a8' },
  ruins: { light: '#ffcce8', shade: '#55388a', rays: 0.3, sun: 0.7, pool: 0.14 },
  cave: { light: '#c8f0ff', shade: '#2e3478', rays: 0, sun: 0.5, pool: 0.2 },
  sky: { light: '#fff8e0', shade: '#98a8ff', rays: 0.6, sun: 0.85, pool: 0.05 },
  crag: { light: '#ffd8a4', shade: '#8a4a5c', rays: 0.5, sun: 0.75, pool: 0.07 },
  grove: { light: '#e2d8ff', shade: '#4a3a8a', rays: 0.3, sun: 0.7, pool: 0.2, warm: '#ffe2b0' },
  hollow: { light: '#d8ffc0', shade: '#2c4a4a', rays: 0.25, sun: 0.6, pool: 0.18, warm: '#ffe0b0' },
  // Map looks (a map's `look.light`).
  morning: { light: '#ffe2ec', shade: '#9a7cc8', rays: 0.7, sun: 0.75, pool: 0.07 },
  noon: { light: '#fffbe0', shade: '#5c9a8a', rays: 0.35, sun: 0.85, pool: 0.05 },
  dusk: { light: '#ffc08a', shade: '#4a2f6a', rays: 0.6, sun: 0.2, pool: 0.15 },
  shrine: { light: '#ffd6b8', shade: '#7a4a8a', rays: 0.6, sun: 0.45, pool: 0.12, warm: '#ffd8a8' },
  ridge: { light: '#d4dcff', shade: '#262a6a', rays: 0.2, sun: 0.6, pool: 0.2, warm: '#ffe2b0' },
  springs: { light: '#fff2dc', shade: '#3c6c78', rays: 0.7, sun: 0.75, pool: 0.08 },
  snow: { light: '#ffffff', shade: '#7a8ad0', rays: 0.4, sun: 0.9, pool: 0.05 },
  starfall: { light: '#e2d8ff', shade: '#2a2266', rays: 0.15, sun: 0.6, pool: 0.18, warm: '#fff0c8' },
  throne: { light: '#c9b6ff', shade: '#1f1846', rays: 0, sun: 0.5, pool: 0.22, warm: '#e6dcff' },
};

const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// ---------- Glow ----------

// The soft glow (the player's pick, the same as the effect strips' own, `FXHD` in tools/fx-art.js):
// effects are drawn once more into a small layer (a quarter of the screen's size). Only the bright
// parts of that copy are kept, so dark outlines never smudge; it is blurred and stacked up small,
// laid down in one stretch, and the effects are drawn over their glow. When nothing bright is on
// screen the glow is skipped. The effect strips carry their glow already, so they sit the small
// copy out (`gfx.glowPass`).
const GLOW_SHRINK = 4;
const GLOW = 3.5;
const layers = new Map();
function layer(key, w, h) {
  let c = layers.get(key);
  if (!c) layers.set(key, (c = document.createElement('canvas')));
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

// Keeps only the bright parts of the layer; says whether anything is left.
function brightOnly(c) {
  const g = c.getContext('2d', { willReadFrequently: true });
  const img = g.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  let any = false;
  for (let i = 3; i < d.length; i += 4) {
    if (!d[i]) continue;
    const k = (Math.max(d[i - 3], d[i - 2], d[i - 1]) - 100) / 90;
    d[i] = k <= 0 ? 0 : k >= 1 ? d[i] : d[i] * k;
    if (d[i]) any = true;
  }
  if (any) g.putImageData(img, 0, 0);
  return any;
}

export function drawGlowing(ctx, draw) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const m = ctx.getTransform();
  const c = layer('glow', Math.ceil(W / GLOW_SHRINK), Math.ceil(H / GLOW_SHRINK));
  const g = c.getContext('2d', { willReadFrequently: true });
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  g.setTransform(m.a / GLOW_SHRINK, 0, 0, m.d / GLOW_SHRINK, m.e / GLOW_SHRINK, m.f / GLOW_SHRINK);
  g.imageSmoothingEnabled = true;
  gfx.glowPass = true;
  try {
    draw(g);
  } finally {
    gfx.glowPass = false;
  }
  if (brightOnly(c)) {
    const soft = layer('glowsoft', c.width, c.height);
    const s = soft.getContext('2d');
    s.clearRect(0, 0, soft.width, soft.height);
    s.filter = `blur(${(GLOW * m.a) / GLOW_SHRINK}px) brightness(1.18)`;
    s.drawImage(c, 0, 0);
    s.filter = 'none';
    // Three soft passes, stacked while small, then stretched over the screen once.
    const sum = layer('glowsum', c.width, c.height);
    const u = sum.getContext('2d');
    u.clearRect(0, 0, sum.width, sum.height);
    u.globalAlpha = 0.9;
    for (let i = 0; i < 3; i++) u.drawImage(soft, 0, 0);
    u.globalAlpha = 1;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(sum, 0, 0, W, H);
    ctx.restore();
  }
  draw(ctx);
}

// ---------- Light ----------

// Light is baked small (gradients stay smooth stretched up) into two cached overlays per map
// theme: a brightening one (warm light from above, the sun's glow) and a darkening one (cool shade
// at the bottom and a soft vignette).
const LIGHT_W = 320;
const LIGHT_H = 180;
function bake(key, paint) {
  let c = layers.get(key);
  if (!c) {
    c = layer(key, LIGHT_W, LIGHT_H);
    const g = c.getContext('2d');
    g.scale(LIGHT_W / 640, LIGHT_H / 360);
    paint(g, 640, 360);
  }
  return c;
}

function brightOf(theme, look) {
  return bake(`bright|${theme}`, (g, w, h) => {
    const top = g.createLinearGradient(0, 0, 0, h * 0.55);
    top.addColorStop(0, rgba(look.light, 0.22));
    top.addColorStop(1, rgba(look.light, 0));
    g.fillStyle = top;
    g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * look.sun, -20, 0, w * look.sun, -20, h * 0.9);
    sun.addColorStop(0, rgba(look.light, 0.3));
    sun.addColorStop(1, rgba(look.light, 0));
    g.fillStyle = sun;
    g.fillRect(0, 0, w, h);
  });
}

function shadeOf(theme, look) {
  return bake(`shade|${theme}`, (g, w, h) => {
    const low = g.createLinearGradient(0, h * 0.6, 0, h);
    low.addColorStop(0, rgba(look.shade, 0));
    low.addColorStop(1, rgba(look.shade, 0.16));
    g.fillStyle = low;
    g.fillRect(0, 0, w, h);
    const v = g.createRadialGradient(w / 2, h * 0.45, h * 0.45, w / 2, h * 0.45, w * 0.68);
    v.addColorStop(0, rgba(look.shade, 0));
    v.addColorStop(1, rgba(look.shade, 0.24));
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
  });
}

// Sun rays slanting down from the sky, swaying slowly; they drift with the camera a little.
function drawRays(g, look, cam, w, h, time) {
  const sx = w * look.sun - cam.x * 0.05;
  for (let i = 0; i < 5; i++) {
    const a = 0.42 + i * 0.13 + Math.sin(time * 0.35 + i * 1.7) * 0.05;
    const width = 26 + ((i * 37) % 30);
    const len = h * 1.5;
    const x0 = sx - i * 70;
    const fade = (0.5 + 0.5 * Math.sin(time * 0.5 + i * 2.1)) * 0.14 * look.rays;
    const grad = g.createLinearGradient(x0, 0, x0 - Math.sin(a) * len, Math.cos(a) * len);
    grad.addColorStop(0, rgba(look.light, fade));
    grad.addColorStop(0.7, rgba(look.light, fade * 0.35));
    grad.addColorStop(1, rgba(look.light, 0));
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x0, -10);
    g.lineTo(x0 + width, -10);
    g.lineTo(x0 + width - Math.sin(a) * len * 1.2, Math.cos(a) * len);
    g.lineTo(x0 - Math.sin(a) * len, Math.cos(a) * len);
    g.closePath();
    g.fill();
  }
}

// Pools of light: each cuts a soft hole in the shade and adds a gentle glow, so the eye goes to
// the hero and the ways out (Octopath and Eastward light their scenes to steer the eye).
function drawPools(g, look, lights, w, h) {
  g.setTransform(LIGHT_W / w, 0, 0, LIGHT_H / h, 0, 0);
  for (const l of lights) {
    if (l.x < -l.r || l.x > w + l.r || l.y < -l.r || l.y > h + l.r) continue;
    const k = look.pool * (l.k ?? 1);
    g.globalCompositeOperation = 'destination-out';
    const hole = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 1.3);
    hole.addColorStop(0, `rgba(0,0,0,${Math.min(0.9, k * 3)})`);
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hole;
    g.fillRect(l.x - l.r * 1.3, l.y - l.r * 1.3, l.r * 2.6, l.r * 2.6);
    g.globalCompositeOperation = 'source-over';
    const pool = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    pool.addColorStop(0, rgba(l.c ?? look.warm ?? look.light, k));
    pool.addColorStop(1, rgba(l.c ?? look.warm ?? look.light, 0));
    g.fillStyle = pool;
    g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}

// The map's light over the world: rays, the warm glow from above, the cool shade and vignette,
// and pools of light at `lights` ({ x, y, r, k?, c? } in screen space).
export function drawLighting(ctx, map, cam, w, h, time, lights = []) {
  // (A zone can bring its own light: an underground zone has no rays from above.)
  const key = zoneLook(map, cam.y + h * 0.6, cam.x + w / 2)?.light ?? map.look?.light ?? map.theme;
  const theme = LOOKS[key] ? key : 'meadow';
  const look = LOOKS[theme];
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  // Shade, warm light, and rays are put together on one small layer, laid over the world once.
  const c = layer('light', LIGHT_W, LIGHT_H);
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, LIGHT_W, LIGHT_H);
  g.drawImage(shadeOf(theme, look), 0, 0);
  g.drawImage(brightOf(theme, look), 0, 0);
  if (look.pool && lights.length) drawPools(g, look, lights, w, h);
  if (look.rays) {
    g.scale(LIGHT_W / w, LIGHT_H / h);
    drawRays(g, look, cam, w, h, time);
  }
  ctx.drawImage(c, 0, 0, w, h);
  ctx.restore();
}


// Night (world/daytime.js): a deep blue dusk laid over the world, `k` deep (0-1), with soft holes
// where the lights are and a warm glow round each ({ x, y, r, c? } in screen space).
export function drawNight(ctx, w, h, k, lights = []) {
  if (k <= 0) return;
  const c = layer('night', LIGHT_W, LIGHT_H);
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, LIGHT_W, LIGHT_H);
  g.fillStyle = rgba('#1c1650', 0.42 * k);
  g.fillRect(0, 0, LIGHT_W, LIGHT_H);
  g.setTransform(LIGHT_W / w, 0, 0, LIGHT_H / h, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const r = l.r * 1.25;
    const hole = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    hole.addColorStop(0, 'rgba(0,0,0,0.85)');
    hole.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hole;
    g.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  }
  g.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(c, 0, 0, w, h);
  // The warm glow, added on top.
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    const glow = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
    glow.addColorStop(0, rgba(l.c ?? '#ffd9a0', 0.16 * k));
    glow.addColorStop(1, rgba(l.c ?? '#ffd9a0', 0));
    ctx.fillStyle = glow;
    ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  ctx.restore();
}

// ---------- The screen's color ----------

// The game's colors, a little richer than drawn: a CSS filter on the canvas, which the browser
// applies for free.
export const VIVID = 'saturate(1.22) contrast(1.05)';
