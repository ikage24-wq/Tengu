// Cel-shaded effect shapes in the style of hand-drawn 2D anime effects: hard-edged shapes in two
// or three flat tones (a white-hot core inside a colored rim), no soft gradients. Effects built
// from them grow fast, hold, and then thin out, shrink, and break apart instead of fading.
// All functions draw in screen space with the current fill and alpha state saved by the caller.

const TAU = Math.PI * 2;

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
export function puff(ctx, x, y, r, light, shadow) {
  if (r <= 0.3) return;
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(x - r * 0.12, y - r * 0.16, r * 0.84, 0, TAU);
  ctx.fill();
}

// A smear: a filled crescent along a circle from angle a0 to a1 (radians, either direction), thick
// in the middle and tapering to points at both ends, with a white core along its outer edge.
export function crescent(ctx, cx, cy, r, a0, a1, thick, rim, core = '#ffffff') {
  if (Math.abs(a1 - a0) < 0.02 || thick < 0.3) return;
  const steps = 14;
  const band = (outer, inner) => {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const a = a0 + (a1 - a0) * u;
      const w = Math.sin(u * Math.PI) ** 0.7;
      ctx.lineTo(cx + Math.cos(a) * (r + outer * w), cy + Math.sin(a) * (r + outer * w));
    }
    for (let i = steps; i >= 0; i--) {
      const u = i / steps;
      const a = a0 + (a1 - a0) * u;
      const w = Math.sin(u * Math.PI) ** 0.7;
      ctx.lineTo(cx + Math.cos(a) * (r - inner * w), cy + Math.sin(a) * (r - inner * w));
    }
    ctx.closePath();
    ctx.fill();
  };
  ctx.fillStyle = rim;
  band(thick * 0.5, thick * 0.5);
  ctx.fillStyle = core;
  band(thick * 0.35, -thick * 0.05);
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
