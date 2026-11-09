// Healing, in Tengu's own effect art (tools/fx-art.js, the `cel*` strips): a mint flower of light
// opening at the feet with a column of light rising (a heal, a potion's worth of HP from a GM), and
// a small one when HP comes back to the hero.
//
// Drawn from progress `p` (0-1) at (x, y), the healed one's feet. Returns false for kinds it
// doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { groundRing } from './warrior-fx.js';

export function drawHealFx(ctx, f, x, y, p) {
  switch (f.kind) {
    case 'healbloom': case 'heal': {
      // A heal: a mint flower of light opens at the feet and a column of light rises with
      // sparkles, then petals.
      fxSprite(ctx, 'celhealbloom', x, y, { p, scale: f.kind === 'heal' ? 0.7 : 1 });
      if (f.kind === 'healbloom') groundRing(ctx, 'celringmint', x, y, p, f.r ? Math.min(140, f.r) : 90);
      return true;
    }
    case 'healglow': {
      // HP coming back to the hero: a small mint flower of light at her feet.
      fxSprite(ctx, 'celhealbloom', x, y, { p, scale: 0.55 });
      return true;
    }
    default:
      return false;
  }
}
