// Plays the effect sprite strips (Tengu's own effect art, assets/fx/; the list is fx-sheets.js).
// Effects are built from these frames rather than drawn shapes (CLAUDE.md): `fxSprite` draws one
// frame of a strip at a point, picked by progress `p` (0-1, the whole animation over the effect's
// life) or by time `t` (seconds, at the strip's own rate; looping strips wrap). The strips are drawn
// in HD with a soft glow (`d` strip pixels per game pixel) and shown smoothed, and between two
// drawings the next one fades in over the last, so effects flow instead of stepping.

import { FX_SHEETS } from './fx-sheets.js';
import { gfx } from './pixel.js';

const images = {};
function image(name) {
  if (typeof Image === 'undefined') return null;
  if (!images[name]) {
    const img = new Image();
    img.src = new URL(`../../assets/fx/${name}.png`, import.meta.url).href;
    images[name] = img;
  }
  return images[name].complete && images[name].naturalWidth ? images[name] : null;
}

// Starts loading every strip, so the first use of an effect never shows a blank frame.
export function preloadFxSprites() {
  for (const [name, s] of Object.entries(FX_SHEETS)) if (!s.of) image(name);
}

// A big version ({ of, k }) plays its effect's strip k times larger.
function sheetOf(name) {
  const s = FX_SHEETS[name];
  return s?.of ? { name: s.of, s: FX_SHEETS[s.of], k: s.k } : { name, s, k: 1 };
}

// Where a strip is at progress `p` or time `t`, in frames (with the fraction toward the next).
function framePos(s, { p, t } = {}) {
  if (t != null) {
    const f = t * s.fps;
    return s.loop ? ((f % s.n) + s.n) % s.n : Math.min(s.n - 1, Math.max(0, f));
  }
  return Math.min(s.n - 1, Math.max(0, (p ?? 0) * s.n));
}

// Draws a strip's frame with its pivot at (x, y). `scale` (1 = the effect's own size), `flip`
// mirrors it (face the other way), `rot` turns it (radians), `alpha` fades it, `sx`/`sy` stretch
// it. A `frame` picks one drawing and holds it; otherwise the next drawing blends in as the
// effect moves toward it.
export function fxSprite(ctx, name, x, y, { p, t, frame, scale = 1, flip = false, rot = 0, alpha = 1, sx = 1, sy = 1 } = {}) {
  const { name: strip, s, k: big } = sheetOf(name);
  const img = s && image(strip);
  if (!img || alpha <= 0) return false;
  // The strips carry their own glow: the screen's glow pass leaves them out.
  if (gfx.glowPass) return true;
  const pos = frame ?? framePos(s, { p, t });
  if (pos < 0) return false;
  const f = Math.floor(pos);
  const k = (scale * big) / s.d;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const a = ctx.globalAlpha * Math.min(1, alpha);
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale((flip ? -k : k) * sx, k * sy);
  // The in-between: both drawings full for the middle of the step, each fading at its own end.
  const next = s.loop ? (f + 1) % s.n : f + 1;
  const frac = frame == null && next < s.n ? pos - f : 0;
  ctx.globalAlpha = a * Math.min(1, 2 * (1 - frac));
  ctx.drawImage(img, f * s.w, 0, s.w, s.h, -s.px, -s.py, s.w, s.h);
  if (frac > 0) {
    ctx.globalAlpha = a * Math.min(1, 2 * frac);
    ctx.drawImage(img, next * s.w, 0, s.w, s.h, -s.px, -s.py, s.w, s.h);
  }
  ctx.restore();
  return true;
}
