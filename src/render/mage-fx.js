// The Mage's effects, in Tengu's own effect art (tools/fx-art.js, the `cel*` strips), matched to
// the sprites like every other effect (CLAUDE.md): rose pink and mint, flowers and petals. Bolts are
// pink orbs wrapped in turning petals; hits pop open a flower that scatters; heals open a mint
// flower of light at the feet; Garden of Light raises a giant flower under the monsters.
//
// Drawn from progress `p` (0-1); (x, y) is a monster's feet for per-target effects and the
// caster's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { groundRing } from './warrior-fx.js';

export function drawMageFx(ctx, f, x, y, p, cam, time) {
  const flip = (f.dir || 1) < 0;
  switch (f.kind) {
    case 'bloomhit': {
      // A spell landing: a flower pops open on the monster and scatters its petals; heavy ones
      // and crits add a pink ring on the ground.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celbloomhit', x, cy, { p, flip, scale: big ? 0.95 : 0.7 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.45 });
      if (big) groundRing(ctx, 'celringbloom', x, y, p, 46);
      return true;
    }
    case 'petalstorm': {
      // A storm of petals whirling over the monsters ahead.
      const a = p < 0.1 ? p / 0.1 : p > 0.8 ? (1 - p) / 0.2 : 1;
      fxSprite(ctx, 'celpetalstormbig', x, y + 4, { t: time, scale: 1, alpha: a });
      return true;
    }
    case 'healbloom': case 'heal': {
      // A heal: a mint flower of light opens at the feet and a column of light rises with
      // sparkles, then petals (the Mage's heal, a Rebloom, a potion's worth of HP from a GM).
      fxSprite(ctx, 'celhealbloom', x, y, { p, scale: f.kind === 'heal' ? 0.7 : 1 });
      if (f.kind === 'healbloom') groundRing(ctx, 'celringmint', x, y, p, f.r ? Math.min(140, f.r) : 90);
      return true;
    }
    case 'healglow': {
      // HP coming back to the hero: a small mint flower of light at her feet.
      fxSprite(ctx, 'celhealbloom', x, y, { p, scale: 0.55 });
      return true;
    }
    case 'healpetals': {
      // Full Bloom: petals of mint light bursting off where a spell lands, healing who's near.
      fxSprite(ctx, 'celhealbloom', x, y, { p, scale: 0.45 });
      return true;
    }
    case 'gardenbud': {
      // Garden of Light begins: a pillar of pink light with the flower emblem, petals rising.
      const a = Math.min(1, p * 3);
      fxSprite(ctx, 'celpillarbloom', x, y, { p: Math.min(1, p * 1.2), scale: 1.1 });
      fxSprite(ctx, 'celembbloom', x, y - 66 - 14 * Math.min(1, p * 2), { p, scale: 0.55 });
      fxSprite(ctx, 'celbloomaura', x, y, { t: time, scale: 1, alpha: a });
      return true;
    }
    case 'gardenbloom': {
      // The garden blooms: a giant flower of light bursts open under the monsters over a ring of
      // little flowers, then blows apart into petals; a mint ring races out.
      const r = f.r ?? 240;
      fxSprite(ctx, 'celgardenbig', x, y + 6, { p, flip, scale: r / 300 });
      groundRing(ctx, 'celringmint', x, y, p, r * 0.75);
      groundRing(ctx, 'celringbloom', x, y, Math.min(1, p * 1.4), r * 0.45);
      return true;
    }
    default:
      return false;
  }
}

// The Mage's bolts in flight: a pink orb wrapped in petals with a trail of petals behind; a
// blossom bolt is drawn large.
export function drawMageShot(ctx, f, x, y, dir, time) {
  if (f.shot !== 'petalbolt' && f.shot !== 'bloombolt') return false;
  const big = f.shot === 'bloombolt';
  const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
  fxSprite(ctx, 'celpetaltrail', x - Math.cos(ang) * (big ? 30 : 20), y - Math.sin(ang) * (big ? 30 : 20), { t: time, rot: ang, scale: big ? 0.8 : 0.55 });
  fxSprite(ctx, 'celpetalorb', x, y, { t: time, scale: big ? 0.9 : 0.55 });
  return true;
}
