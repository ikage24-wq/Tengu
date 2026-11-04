// Shared touches for the asset library, so every piece carries the same finish: wood grain, fabric
// stitching, glossy sheens, bark, and little shine sparkles.

import { R, E, T, F, shade, mix } from '../pixel.js';

// Wood grain: thin darker lines running along a board, with a knot now and then.
export function grain(x, y, w, h, c, seed = 0, along = 'x') {
  const out = [];
  const dark = shade(c, -14);
  const n = Math.max(1, Math.round((along === 'x' ? h : w) / 2.6));
  for (let i = 0; i < n; i++) {
    const k = Math.sin(seed * 9.1 + i * 3.7) * 0.5 + 0.5;
    if (along === 'x') out.push(F(R(x + k * w * 0.3, y + 1 + i * 2.6, w * (0.4 + k * 0.4), 0.45, dark)));
    else out.push(F(R(x + 1 + i * 2.6, y + k * h * 0.3, 0.45, h * (0.4 + k * 0.4), dark)));
  }
  if (Math.sin(seed * 5.3) > 0.2) out.push(F(E(x + w * 0.62, y + h * 0.5, Math.min(1.2, w * 0.1), Math.min(0.8, h * 0.2), dark)));
  return out;
}

// A row of stitches along a seam.
export function stitch(x0, y0, x1, y1, c, step = 2) {
  const out = [];
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.floor(len / step);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.25) / n;
    out.push(F(R(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 0.9, 0.4, c)));
  }
  return out;
}

// A glossy sheen on something round: a soft light ellipse and a bright spot at its upper left.
export function sheen(cx, cy, rx, ry, c) {
  return [F(E(cx - rx * 0.3, cy - ry * 0.35, rx * 0.45, ry * 0.3, mix(c, '#ffffff', 0.45))), F(E(cx - rx * 0.45, cy - ry * 0.5, rx * 0.14, ry * 0.12, '#ffffff'))];
}

// Bark on a trunk: short curved grooves and a lit edge.
export function barkLines(x, y0, y1, w, c, seed = 0) {
  const out = [];
  const dark = shade(c, -18);
  for (let i = 0; i < 6; i++) {
    const k = Math.sin(seed * 4.1 + i * 2.3) * 0.5 + 0.5;
    const yy = y0 + ((y1 - y0) * (i + 0.5)) / 6;
    out.push(F(T([[x - w * 0.3 + k * w * 0.5, yy], [x - w * 0.2 + k * w * 0.5, yy + 4], [x - w * 0.16 + k * w * 0.5, yy + 0.4]], dark)));
  }
  return out;
}

// A four-pointed twinkle.
export function twinkle(x, y, r, c = '#ffffff') {
  const q = r * 0.28;
  return F(T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c));
}

// A soft ground shadow (solid: the art system takes plain colours only).
export const ground = (cx, cy, rx, ry = 1.3) => F(E(cx, cy, rx, ry, '#ddd0ec'));
