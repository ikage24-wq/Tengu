// The Spirit Mage's effects, in Tengu's own effect art (tools/fx-art.js, the `cel*` strips): white
// spirit light with a warm gold heart, zigzag paper streamers, scarlet cords and gold bells. Her
// bolts are wisps of light trailing streamers; hits flash and fling paper scraps; Kami's Favour
// sends a little blessing of light down on whoever it mends. The Spirit Doll's tricks: a paper-fan
// smack, a twirl of streamers, a gold bell bonked on a head.
//
// Drawn from progress `p` (0-1); (x, y) is a monster's feet for per-target effects and the
// caster's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { groundRing } from './warrior-fx.js';

export function drawSpiritFx(ctx, f, x, y, p) {
  const flip = (f.dir || 1) < 0;
  switch (f.kind) {
    case 'spirithit': {
      // A spell landing: a flash of white light on the monster, rays, streamer scraps and bell
      // sparks; heavy ones and crits add a ring of light on the ground.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celspirithit', x, cy, { p, flip, scale: big ? 0.62 : 0.42 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.45 });
      if (big) groundRing(ctx, 'celringspirit', x, y, p, 44);
      return true;
    }
    case 'spiritmend': {
      // Kami's Favour: a little column of blessing light where a spell landed, mending who's near.
      fxSprite(ctx, 'celblessing', x, y, { p, scale: 0.4 });
      return true;
    }
    case 'fanslap': {
      // The doll's paper fan smacking a monster.
      fxSprite(ctx, 'celfanslap', x, y - (f.h ?? 24) * 0.55, { p, flip, scale: f.big ? 0.42 : 0.32 });
      return true;
    }
    case 'dolltwirl': {
      // The doll's streamer twirl, whipping round her middle.
      fxSprite(ctx, 'celdolltwirl', x, y - 14, { p, flip, scale: f.big ? 0.5 : 0.4 });
      return true;
    }
    case 'bellbonk': {
      // A gold bell bonked on a head, ringing and bouncing off.
      fxSprite(ctx, 'celbellbonk', x, y, { p, flip, scale: 0.42 });
      return true;
    }
    case 'dollpop': {
      // The doll zipping off and popping back in: a flurry of streamers and light.
      fxSprite(ctx, 'celspiritstep', x, y + 22, { p, scale: 0.3 });
      return true;
    }
    default:
      return false;
  }
}

// Her bolts in flight: a wisp of white light trailing paper streamers and a scarlet cord, pointed
// along its flight; a great bolt drawn large.
export function drawSpiritShot(ctx, f, x, y, dir, time) {
  if (f.shot !== 'spiritorb' && f.shot !== 'spiritbig') return false;
  const big = f.shot === 'spiritbig';
  const ang = Math.atan2(f.ty - f.y, f.tx - f.x);
  fxSprite(ctx, 'celspiritorb', x, y, { t: time, rot: ang, scale: big ? 0.42 : 0.28 });
  return true;
}
