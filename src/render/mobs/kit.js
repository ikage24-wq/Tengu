// Shared toolkit for monster art. Shapes come from pixel.js (R rect, E ellipse, T polygon,
// F flat/unshaded, C casts a shadow, L lit-only); these add arcs, strokes, and the expressive face.
// Each art module (meadow.js, wilds.js, ...) exports `ART`: { key: { walk, idle, draw } } where
// draw(pose, frame, mood) returns { w, h, shapes } with the feet at the bottom center, facing right.

import { R, E, P, T, F, C, L, shade, mix, sparkLine } from '../pixel.js';

export { R, E, P, T, F, C, L, shade, mix, sparkLine };

export const INK = '#3a2d4f';
export const BLUSH = '#ff9fb8';
export const MOUTH = '#b2506c';

// ---------- Shape helpers ----------

export function arc(cx, cy, rx, ry, a0, a1, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 6; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180;
    outer.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inner.push([cx + (rx - th) * Math.cos(a), cy + (ry - th) * Math.sin(a)]);
  }
  return F(T([...outer, ...inner.reverse()], c));
}

// A polyline drawn as thin quads.
export function stroke(pts, th, c, flat = true) {
  const quad = (a, b) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (-(b[1] - a[1]) / len) * th * 0.5;
    const ny = ((b[0] - a[0]) / len) * th * 0.5;
    const t = T([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], c);
    return flat ? F(t) : t;
  };
  const out = [];
  for (let i = 1; i < pts.length; i++) out.push(quad(pts[i - 1], pts[i]));
  return out;
}

// The face. (cx, cy) is between the eyes; k scales everything.
export function face(cx, cy, k, mood, { gap = 3.4, eye = INK, ink = INK, mouth = true, blush = true } = {}) {
  const out = [];
  const g = gap * k;
  for (const s of [-1, 1]) {
    const ex = cx + s * g * 0.5;
    switch (mood) {
      case 'blink':
        out.push(arc(ex, cy - 0.2 * k, 1 * k, 0.8 * k, 20, 160, 0.5 * k, ink));
        break;
      case 'happy':
        out.push(arc(ex, cy + 0.6 * k, 1 * k, 0.9 * k, 200, 340, 0.5 * k, ink));
        break;
      case 'hurt':
        out.push(...stroke([[ex - s * 0.9 * k, cy - 0.9 * k], [ex + s * 0.7 * k, cy], [ex - s * 0.9 * k, cy + 0.9 * k]], 0.55 * k, ink));
        break;
      case 'dead':
        out.push(...stroke([[ex - 0.8 * k, cy - 0.8 * k], [ex + 0.8 * k, cy + 0.8 * k]], 0.5 * k, ink), ...stroke([[ex - 0.8 * k, cy + 0.8 * k], [ex + 0.8 * k, cy - 0.8 * k]], 0.5 * k, ink));
        break;
      default: {
        const ry = mood === 'angry' ? 1 : 1.3;
        out.push(F(E(ex, cy, 0.95 * k, ry * k, eye)), F(E(ex - 0.3 * k, cy - 0.45 * k, 0.4 * k, 0.4 * k, '#ffffff')));
        if (mood === 'angry') {
          // Fierce brows slanting down toward the middle.
          out.push(...stroke([[ex + s * 1.4 * k, cy - 2.2 * k], [ex - s * 1.1 * k, cy - 1.2 * k]], 0.6 * k, ink));
        }
      }
    }
    if (blush && mood !== 'dead') out.push(F(E(ex + s * 1.2 * k, cy + 1.6 * k, 0.9 * k, 0.45 * k, BLUSH)));
  }
  if (!mouth) return out;
  const my = cy + 1.6 * k;
  switch (mood) {
    case 'angry':
      out.push(F(T([[cx - 1.2 * k, my - 0.2 * k], [cx + 1.2 * k, my - 0.2 * k], [cx + 0.6 * k, my + 1 * k], [cx - 0.6 * k, my + 1 * k]], MOUTH)), F(T([[cx + 0.1 * k, my - 0.2 * k], [cx + 0.9 * k, my - 0.2 * k], [cx + 0.5 * k, my + 0.7 * k]], '#ffffff')));
      break;
    case 'hurt':
      out.push(F(E(cx, my + 0.3 * k, 0.6 * k, 0.75 * k, MOUTH)));
      break;
    case 'dead':
      out.push(...stroke([[cx - 0.9 * k, my + 0.3 * k], [cx - 0.3 * k, my], [cx + 0.3 * k, my + 0.3 * k], [cx + 0.9 * k, my]], 0.4 * k, ink));
      break;
    case 'happy':
      out.push(F(T([[cx - 1 * k, my - 0.2 * k], [cx + 1 * k, my - 0.2 * k], [cx, my + 1 * k]], MOUTH)));
      break;
    default:
      out.push(arc(cx, my - 0.3 * k, 0.8 * k, 0.7 * k, 25, 155, 0.4 * k, ink));
  }
  return out;
}

