// The Tide Mage's effects (docs/design/tide-mage.md), in her own sea teal and foam: her whip of
// water, the waves she sends rolling along the floor (bigger the fuller her Tide: `swell`), her
// bubbles, the splash, geyser, whirlpool and waterfall her blows throw up, and her mark on a
// monster. Strips in tools/fx-art.js (tm*), three strip pixels to a game pixel; each drawn out to
// the reach of the blow it shows.
import { fxSprite } from './fx-sprites.js';

// Her shots in flight. A wave rolls along the floor under where it was aimed (`floorY`), its foot
// on the ground; a bubble floats, bobbing, along its line.
export function drawTideShot(ctx, f, x, y, dir, cam) {
  const flip = dir < 0;
  const swell = f.swell ?? 1;
  switch (f.shot) {
    case 'tmwave': case 'tmwavebig': {
      // (It rises out of the floor a little ahead of her and swells up as it goes, so it never
      // stands over her as it leaves the staff.)
      const big = f.shot === 'tmwavebig';
      const gy = f.floorY != null ? f.floorY - cam.y : y + 16;
      const k = Math.min(1, f.t / Math.max(0.01, f.dur * 0.25));
      fxSprite(ctx, big ? 'celtmwavebig' : 'celtmwave', x + dir * (big ? 34 : 22) * swell, gy, { t: f.t, flip, scale: swell * (0.6 + 0.4 * k), alpha: Math.min(1, 0.3 + k) });
      return true;
    }
    case 'tmgreat':
      // Her finisher's: the great wave, rising out of the floor ahead of her as it goes.
      fxSprite(ctx, 'celtmgreatbig', x + dir * 60, f.floorY != null ? f.floorY - cam.y : y + 16, { t: f.t, flip, scale: 0.75 + 0.25 * Math.min(1, f.t / Math.max(0.01, f.dur * 0.2)) });
      return true;
    case 'tmbubble':
      fxSprite(ctx, 'celtmbubble', x, y + 3 * Math.sin(f.t * 14), { t: f.t, flip, scale: 0.8 });
      return true;
  }
  return false;
}

// Her bursts and her mark. (x, y): where the blow put it (her feet for most, the monster for her
// mark); `f.r` the blow's reach.
export function drawTideFx(ctx, f, x, y, p) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  switch (f.kind) {
    case 'tmlash':
      // Out level from the head of the staff to the end of the whip's reach.
      // (Level with her hands, the staff's head, so it never runs across her face.)
      return fxSprite(ctx, 'celtmlash', x, y - 15, { p, flip, scale: ((f.r ?? 118) * 0.8) / 120 }) || true;
    case 'tmsplash':
      return fxSprite(ctx, 'celtmsplash', x, y + 2, { p, flip, scale: Math.max(0.8, (f.r ?? 80) / 90) }) || true;
    case 'tmsplashbig':
      return fxSprite(ctx, 'celtmsplashbig', x, y + 2, { p, flip }) || true;
    case 'tmgeyser':
      return fxSprite(ctx, 'celtmgeyser', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 130) / 130)) }) || true;
    case 'tmwhirl':
      // Flat round her feet, out to the reach it drags them in from.
      return fxSprite(ctx, 'celtmwhirlbig', x, y + 2, { p, flip, scale: (f.r ?? 104) / 108 }) || true;
    case 'tmfall':
      return fxSprite(ctx, 'celtmfall', x, y + 2, { p, flip }) || true;
    case 'tmfallbig':
      return fxSprite(ctx, 'celtmfallbig', x, y + 2, { p, flip }) || true;
    case 'tmpool': {
      // The pool stays where she planted the staff, lapping, and drains away at the end.
      const fade = Math.min(1, (f.dur - f.t) / 0.8, f.t / 0.3);
      return fxSprite(ctx, 'celtmpool', x, y + 2, { t: f.t, alpha: Math.max(0, fade) }) || true;
    }
    case 'tmshieldfx':
      return fxSprite(ctx, 'celtmshieldfx', x, y + 2, { p, scale: 0.9 }) || true;
    case 'tmhit':
      return fxSprite(ctx, 'celtmhit', x, y - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.75 : 0.6 }) || true;
  }
  return false;
}
