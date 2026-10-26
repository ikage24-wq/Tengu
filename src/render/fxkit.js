// Cel-shaded effect shapes in the style of hand-drawn 2D anime effects: hard-edged shapes in two
// or three flat tones (a white-hot core inside a colored rim), no soft gradients. Effects built
// from them grow fast, hold, and then thin out, shrink, and break apart instead of fading.
// All functions draw in screen space with the current fill and alpha state saved by the caller.
//
// Bright shapes sit on an inked rim: a deeper shade of their own hue just outside the edge, so a
// white-hot flash still reads against the pale pastel skies instead of washing out. The rim is
// only drawn on the full-size canvas; the small blurred glow layer (see post.js) gets the bright
// shapes alone, so the glow stays the effect's own color.

import { mix } from './pixel.js';

const TAU = Math.PI * 2;
const INK = '#6b4f9e';

const deepCache = new Map();
// A deeper, inkier shade of a color for an effect's rim.
export function deep(color) {
  let v = deepCache.get(color);
  if (!v) {
    v = /^#[0-9a-f]{6}$/i.test(color) ? mix(color, INK, 0.5) : '#9a86c4';
    deepCache.set(color, v);
  }
  return v;
}

const duskCache = new Map();
// Halfway from a color to its deep shade: the trailing end of a smear.
export function dusk(color) {
  let v = duskCache.get(color);
  if (!v) {
    v = /^#[0-9a-f]{6}$/i.test(color) ? mix(color, deep(color), 0.55) : color;
    duskCache.set(color, v);
  }
  return v;
}

// True on the full-size canvas (the glow layer is a quarter of it, and skips the ink).
export const inked = (ctx) => ctx.canvas.width >= 600;

// Strokes the current path with a wider band of `color` under it: a hard-edged halo in place of a
// shadow blur (cheaper every frame, and it stays cel-crisp).
export function haloStroke(ctx, color) {
  const lw = ctx.lineWidth;
  const ss = ctx.strokeStyle;
  ctx.strokeStyle = color;
  ctx.lineWidth = lw + 3;
  ctx.stroke();
  ctx.strokeStyle = ss;
  ctx.lineWidth = lw;
  ctx.stroke();
}

// Holds an effect's progress on a grid of `frames` steps, so flashes and sparks pop from drawing
// to drawing like hand-timed animation instead of tweening smoothly.
export const stepped = (p, frames) => Math.min(1, Math.floor(p * frames) / frames);

// The contrast frame in front of a flash: a dark disc for a moment, so the white that follows
// feels brighter (an explosion's first drawing).
export function contrast(ctx, x, y, r, color) {
  if (r <= 0.3) return;
  ctx.fillStyle = deep(deep(color));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// Fast out, slow settle; and the reverse.
export const easeOut = (p) => 1 - (1 - p) ** 3;
export const easeIn = (p) => p * p;

// A spark: a round hot head at (x, y) with a tail that tapers to a point behind it along `angle`
// (the way it's flying). The core is a smaller copy in white.
export function needle(ctx, x, y, angle, len, w, rim, core = '#ffffff') {
  const tear = (l, r) => {
    const bx = x - Math.cos(angle) * l;
    const by = y - Math.sin(angle) * l;
    const nx = -Math.sin(angle) * r;
    const ny = Math.cos(angle) * r;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(x + nx * 1.4 - Math.cos(angle) * l * 0.25, y + ny * 1.4 - Math.sin(angle) * l * 0.25, x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    ctx.quadraticCurveTo(x - nx * 1.4 - Math.cos(angle) * l * 0.25, y - ny * 1.4 - Math.sin(angle) * l * 0.25, bx, by);
    ctx.fill();
  };
  if (w > 1.6 && inked(ctx)) {
    ctx.fillStyle = deep(rim);
    tear(len + 1.2, w / 2 + 0.8);
  }
  ctx.fillStyle = rim;
  tear(len, w / 2);
  if (w > 1.2) {
    ctx.fillStyle = core;
    tear(len * 0.55, w / 4);
  }
}

// A star flash: n long thin spikes around a round core.
export function starFlash(ctx, x, y, r, n, rot, rim, core = '#ffffff', coreR = r * 0.28) {
  const spikes = (R, inner) => {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = rot + (i * Math.PI) / n;
      const rr = i % 2 ? inner : R * (i % 4 === 0 ? 1 : 0.62);
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  };
  if (r > 3 && inked(ctx)) {
    ctx.fillStyle = deep(rim);
    spikes(r + 1.6, coreR * 0.9 + 1);
    ctx.beginPath();
    ctx.arc(x, y, coreR * 1.25 + 1, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = rim;
  spikes(r, coreR * 0.9);
  ctx.beginPath();
  ctx.arc(x, y, coreR * 1.25, 0, TAU);
  ctx.fill();
  ctx.fillStyle = core;
  spikes(r * 0.55, coreR * 0.5);
  ctx.beginPath();
  ctx.arc(x, y, coreR, 0, TAU);
  ctx.fill();
}

// A holy bloom: rounded petals around a white core, the light-magic answer to a spiky flash (no
// points, nothing harsh). Petals thin as `open` passes 1 so it fades by narrowing, not dimming.
export function bloom(ctx, x, y, r, n, rot, rim, core = '#ffffff', open = 1) {
  if (r <= 0.5) return;
  const thin = open > 1 ? Math.max(0.05, 2 - open) : 1;
  const petals = (R, w) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      const px = x + Math.cos(a) * R * 0.55;
      const py = y + Math.sin(a) * R * 0.55;
      ctx.moveTo(px + Math.cos(a) * R * 0.45, py + Math.sin(a) * R * 0.45);
      ctx.ellipse(px, py, R * 0.45, w, a, 0, TAU);
    }
    ctx.fill();
  };
  if (inked(ctx)) {
    ctx.fillStyle = deep(rim);
    petals(r + 1.2, r * 0.22 * thin + 1);
  }
  ctx.fillStyle = rim;
  petals(r, r * 0.22 * thin);
  ctx.fillStyle = core;
  petals(r * 0.6, r * 0.12 * thin);
  ctx.beginPath();
  ctx.arc(x, y, r * 0.22 * Math.min(1, thin + 0.3), 0, TAU);
  ctx.fill();
}

// One afterimage of a dash ("multiples", the smear for fast moves): a flat chibi silhouette in
// one tone on an inked rim, `s` its size (1 = hero height), standing on (x, y).
export function ghost(ctx, x, y, s, color) {
  if (s <= 0.05) return;
  const shape = (g) => {
    ctx.beginPath();
    ctx.arc(x, y - 33 * s, 11 * s + g, 0, TAU);
    ctx.moveTo(x - 8 * s - g, y - 2);
    ctx.lineTo(x - 7 * s - g, y - 22 * s - g);
    ctx.quadraticCurveTo(x, y - 27 * s - g, x + 7 * s + g, y - 22 * s - g);
    ctx.lineTo(x + 8 * s + g, y - 2);
    ctx.closePath();
    ctx.fill();
  };
  if (inked(ctx)) {
    ctx.fillStyle = deep(color);
    shape(1);
  }
  ctx.fillStyle = color;
  shape(0);
}

// A ring broken into jagged shards with gaps between them, `thick` wide; it thins and scatters
// as an impact expands. `seed` keeps each ring's breaks its own.
export function shardRing(ctx, x, y, r, thick, n, seed, rot, color) {
  if (thick <= 0.2) return;
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const h = frac(Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453);
    const a0 = rot + (i / n) * TAU + h * 0.25;
    const a1 = a0 + (TAU / n) * (0.45 + h * 0.3);
    const rr = r * (0.92 + h * 0.16);
    const mid = (a0 + a1) / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr);
    ctx.lineTo(x + Math.cos(mid) * (rr + thick), y + Math.sin(mid) * (rr + thick));
    ctx.lineTo(x + Math.cos(a1) * rr, y + Math.sin(a1) * rr);
    ctx.lineTo(x + Math.cos(mid) * (rr - thick * 0.6), y + Math.sin(mid) * (rr - thick * 0.6));
    ctx.closePath();
    ctx.fill();
  }
}

// A cel smoke puff: a round lump in the light tone with a shadow crescent along its lower side.
// `holes` (0-1) punches holes through it that widen until it tears apart, the way smoke breaks
// up instead of fading; `seed` places them.
export function puff(ctx, x, y, r, light, shadow, holes = 0, seed = 0) {
  if (r <= 0.3) return;
  const lump = (cx, cy, rr) => {
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, TAU);
    if (holes > 0) {
      // Holes stay inside the lump, so the even-odd fill cuts clean gaps through it.
      for (let i = 0; i < 3; i++) {
        const a = seed * 6.3 + i * 2.1;
        const hr = r * (0.18 + 0.1 * i) * holes;
        const d = Math.min(r * 0.42, r * 0.92 - hr);
        ctx.moveTo(x + Math.cos(a) * d + hr, y + Math.sin(a) * d);
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, hr, 0, TAU);
      }
    }
    ctx.fill('evenodd');
  };
  if (r > 2 && inked(ctx)) {
    ctx.fillStyle = deep(shadow);
    lump(x, y, r + 0.9);
  }
  ctx.fillStyle = shadow;
  lump(x, y, r);
  ctx.fillStyle = light;
  lump(x - r * 0.12, y - r * 0.16, r * 0.84);
}

// A smear: a filled crescent along a circle from angle a0 to a1 (radians, either direction), thick
// in the middle and tapering to points at both ends. Three tones run along it: a white core on the
// outer edge of the leading part, the rim color, and a darker tail where it trails off.
export function crescent(ctx, cx, cy, r, a0, a1, thick, rim, core = '#ffffff') {
  if (Math.abs(a1 - a0) < 0.02 || thick < 0.3) return;
  const steps = 14;
  const band = (outer, inner, u0 = 0, u1 = 1) => {
    const n = Math.max(2, Math.round(steps * (u1 - u0)));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = u0 + ((u1 - u0) * i) / n;
      const a = a0 + (a1 - a0) * u;
      const w = Math.sin(u * Math.PI) ** 0.7;
      ctx.lineTo(cx + Math.cos(a) * (r + outer * w), cy + Math.sin(a) * (r + outer * w));
    }
    for (let i = n; i >= 0; i--) {
      const u = u0 + ((u1 - u0) * i) / n;
      const a = a0 + (a1 - a0) * u;
      const w = Math.sin(u * Math.PI) ** 0.7;
      ctx.lineTo(cx + Math.cos(a) * (r - inner * w), cy + Math.sin(a) * (r - inner * w));
    }
    ctx.closePath();
    ctx.fill();
  };
  if (thick > 2 && inked(ctx)) {
    ctx.fillStyle = deep(rim);
    band(thick * 0.5 + 1.1, thick * 0.5 + 1.1);
  }
  ctx.fillStyle = rim;
  band(thick * 0.5, thick * 0.5);
  ctx.fillStyle = dusk(rim);
  band(thick * 0.5, thick * 0.5, 0, 0.3);
  ctx.fillStyle = core;
  band(thick * 0.35, -thick * 0.05, 0.22, 1);
}

// Spikes bursting up from the ground at (x, y): the splash of something heavy landing.
export function crown(ctx, x, y, h, w, n, rim, core = '#ffffff') {
  if (h <= 0.5) return;
  const spikes = (H, W) => {
    ctx.beginPath();
    ctx.moveTo(x - W, y);
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const sx = x - W + u * W * 2;
      const tall = H * (0.55 + 0.45 * Math.sin(u * Math.PI)) * (i % 2 ? 0.75 : 1);
      const lean = (u - 0.5) * W * 0.9;
      ctx.lineTo(sx - W / n, y);
      ctx.lineTo(sx + lean, y - tall);
      ctx.lineTo(sx + W / n, y);
    }
    ctx.lineTo(x + W, y);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = rim;
  spikes(h, w);
  ctx.fillStyle = core;
  spikes(h * 0.6, w * 0.55);
}

// A shockwave: an ellipse outline `thick` wide (it should thin as it grows).
export function shock(ctx, x, y, rx, ry, thick, color) {
  if (thick <= 0.15 || rx <= 0.3) return;
  if (thick > 1 && inked(ctx)) {
    ctx.strokeStyle = deep(color);
    ctx.lineWidth = thick + 1.6;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, Math.max(0.3, ry), 0, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, Math.max(0.3, ry), 0, 0, TAU);
  ctx.stroke();
}

// A dust skid: a low wedge that trails back from (x, y) along the ground, `dir` the way it slides.
export function wisp(ctx, x, y, len, h, dir, light, shadow) {
  if (len <= 0.5) return;
  const shape = (L, H, dy) => {
    ctx.beginPath();
    ctx.moveTo(x + dir * L * 0.25, y + dy);
    ctx.quadraticCurveTo(x, y - H + dy, x - dir * L * 0.4, y - H * 0.6 + dy);
    ctx.quadraticCurveTo(x - dir * L * 0.8, y - H * 0.45 + dy, x - dir * L, y + dy);
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = shadow;
  shape(len, h, 0);
  ctx.fillStyle = light;
  shape(len * 0.8, h * 0.8, -h * 0.15);
}

function frac(v) {
  return v - Math.floor(v);
}
