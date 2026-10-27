// Plays the effect sprite strips (effect art from effect packs, assets/fx/; the list is
// fx-sheets.js). Effects are built from these frames rather than drawn shapes (CLAUDE.md):
// `fxSprite` draws one frame of a strip at a point, picked by progress `p` (0-1, the whole
// animation over the effect's life) or by time `t` (seconds, at the strip's own rate; looping
// strips wrap). A strip pixel is half a game pixel at scale 1, so it lands on the screen's own
// pixels in HD (the game draws at twice its logical size).

import { FX_SHEETS } from './fx-sheets.js';

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
  for (const name of Object.keys(FX_SHEETS)) image(name);
}

// The frame a strip is on at progress `p` or time `t`.
export function fxFrame(name, { p, t } = {}) {
  const s = FX_SHEETS[name];
  if (!s) return -1;
  if (t != null) {
    const f = Math.floor(t * s.fps);
    return s.loop ? ((f % s.n) + s.n) % s.n : Math.min(s.n - 1, Math.max(0, f));
  }
  return Math.min(s.n - 1, Math.max(0, Math.floor((p ?? 0) * s.n)));
}

// Draws a strip's frame with its pivot at (x, y). `scale` (1 = half a game pixel per strip pixel),
// `flip` mirrors it (face the other way), `rot` turns it (radians), `alpha` fades it. HD strips
// are drawn smoothed; light (`add` strips, or `add: true`) is added onto what's under it.
export function fxSprite(ctx, name, x, y, { p, t, frame, scale = 1, flip = false, rot = 0, alpha = 1, sx = 1, sy = 1, add } = {}) {
  const s = FX_SHEETS[name];
  const img = s && image(name);
  if (!img || alpha <= 0) return false;
  const f = frame ?? fxFrame(name, { p, t });
  if (f < 0) return false;
  const k = scale * 0.5;
  ctx.save();
  ctx.imageSmoothingEnabled = Boolean(s.hd);
  if (s.hd) ctx.imageSmoothingQuality = 'high';
  if (add ?? s.add) ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= Math.min(1, alpha);
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  ctx.scale((flip ? -k : k) * sx, k * sy);
  ctx.drawImage(img, f * s.w, 0, s.w, s.h, -s.px, -s.py, s.w, s.h);
  ctx.restore();
  return true;
}

// A texture (a one-frame HD strip) played as an effect: it grows from `from` to `to` times its size
// over the effect's life (fast at first, settling), fades in over the first `fadeIn` and holds
// until `hold`, then fades out. Other options pass to `fxSprite` (rot, flip, sx, sy, add).
export function fxPulse(ctx, name, x, y, p, { from = 0.6, to = 1.2, fadeIn = 0.06, hold = 0.25, alpha = 1, ...rest } = {}) {
  if (p < 0 || p > 1) return false;
  const e = 1 - (1 - p) ** 3;
  const a = p < fadeIn ? p / fadeIn : p < hold ? 1 : 1 - (p - hold) / (1 - hold);
  return fxSprite(ctx, name, x, y, { ...rest, frame: 0, scale: from + (to - from) * e, alpha: alpha * a });
}
