// HD lighting, drawn over the world (not the interface): effects glow (bloom), light falls from
// the sky in soft rays, each map gets its own color grade, and a soft vignette frames the view.
// Only in HD graphics; the pixel-art look skips all of it.

// Per map theme: the warm light from above, the cool shade below and in the corners, and how
// strong the light rays are (0 for night and underground maps).
const LOOKS = {
  meadow: { light: '#fff1c4', shade: '#8a78d0', rays: 0.55, sun: 0.8 },
  town: { light: '#fff1c4', shade: '#8a78d0', rays: 0.45, sun: 0.8 },
  forest: { light: '#f4ffc4', shade: '#3c7a6c', rays: 0.9, sun: 0.75 },
  harbor: { light: '#d4dcff', shade: '#3e3484', rays: 0, sun: 0.8 },
  ruins: { light: '#ffcce8', shade: '#55388a', rays: 0.3, sun: 0.7 },
  cave: { light: '#c8f0ff', shade: '#2e3478', rays: 0, sun: 0.5 },
  sky: { light: '#fff8e0', shade: '#98a8ff', rays: 0.6, sun: 0.85 },
  crag: { light: '#ffd8a4', shade: '#8a4a5c', rays: 0.5, sun: 0.75 },
  grove: { light: '#e2d8ff', shade: '#4a3a8a', rays: 0.3, sun: 0.7 },
  hollow: { light: '#d8ffc0', shade: '#2c4a4a', rays: 0.25, sun: 0.6 },
  // Map looks (a map's `look.light`).
  morning: { light: '#ffe2ec', shade: '#9a7cc8', rays: 0.7, sun: 0.75 },
  noon: { light: '#fffbe0', shade: '#5c9a8a', rays: 0.35, sun: 0.85 },
  dusk: { light: '#ffc08a', shade: '#4a2f6a', rays: 0.6, sun: 0.2 },
  throne: { light: '#c9b6ff', shade: '#1f1846', rays: 0, sun: 0.5 },
};

const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// ---------- Glow ----------

// Effects are drawn as usual, and once more into a small layer (a quarter of the screen's size);
// stretched back up over the screen, that copy spreads each spark into a soft halo.
const GLOW_SHRINK = 4;
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

export function drawGlowing(ctx, draw) {
  draw(ctx);
  const c = layer('glow', Math.ceil(ctx.canvas.width / GLOW_SHRINK), Math.ceil(ctx.canvas.height / GLOW_SHRINK));
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  const m = ctx.getTransform();
  g.setTransform(m.a / GLOW_SHRINK, 0, 0, m.d / GLOW_SHRINK, m.e / GLOW_SHRINK, m.f / GLOW_SHRINK);
  g.imageSmoothingEnabled = true;
  draw(g);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.7;
  ctx.drawImage(c, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
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

// The map's light over the world: rays, the warm glow from above, and the cool shade and vignette.
export function drawLighting(ctx, map, cam, w, h, time) {
  const key = map.look?.light ?? map.theme;
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
  if (look.rays) {
    g.scale(LIGHT_W / w, LIGHT_H / h);
    drawRays(g, look, cam, w, h, time);
  }
  ctx.drawImage(c, 0, 0, w, h);
  ctx.restore();
}

// A soft shadow under feet: dark in the middle, fading out at the edges.
export function softShadow(ctx, x, y, rx, ry, strength = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 1.25);
  g.addColorStop(0, `rgba(58,45,79,${0.32 * strength})`);
  g.addColorStop(0.55, `rgba(58,45,79,${0.18 * strength})`);
  g.addColorStop(1, 'rgba(58,45,79,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 1.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- Filters ----------

// Screen filters (Options: Filter). Color changes are a CSS filter on the canvas, which the
// browser applies for free; Dreamy adds a soft glow over the world, and Retro scanlines.
export const FILTERS = {
  natural: '',
  vivid: 'saturate(1.22) contrast(1.05)',
  dreamy: 'saturate(1.1) brightness(1.03)',
  retro: 'saturate(1.12) contrast(1.12)',
};

// Dreamy: the bright parts of the scene bloom softly, like a camera with a soft-focus filter.
export function drawDreamy(ctx) {
  const shrink = 6;
  const c = layer('dream', Math.ceil(ctx.canvas.width / shrink), Math.ceil(ctx.canvas.height / shrink));
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.clearRect(0, 0, c.width, c.height);
  g.drawImage(ctx.canvas, 0, 0, c.width, c.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.24;
  ctx.drawImage(c, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

// Retro: a scanline over every row of game pixels and darker, rounded screen corners, like an
// old TV. Drawn over everything, interface included.
export function drawRetro(ctx, scale) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const key = `retro|${w}|${h}|${scale}`;
  let c = layers.get(key);
  if (!c) {
    c = layer(key, w, h);
    const g = c.getContext('2d');
    const line = Math.max(1, Math.round(scale / 3));
    g.fillStyle = 'rgba(30,20,50,0.2)';
    for (let y = scale - line; y < h; y += scale) g.fillRect(0, y, w, line);
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.55, w / 2, h / 2, w * 0.62);
    v.addColorStop(0, 'rgba(20,10,40,0)');
    v.addColorStop(1, 'rgba(20,10,40,0.3)');
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(c, 0, 0);
  ctx.restore();
}
