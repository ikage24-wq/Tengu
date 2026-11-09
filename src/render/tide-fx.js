// The Tide Mage's effects (docs/design/tide-mage.md), in her own sea teal and foam: her whip of
// water, the waves she sends rolling along the floor (bigger the fuller her Tide: `swell`), her
// bubbles, the splash, geyser, whirlpool and waterfall her blows throw up, and her mark on a
// monster. And the Maelstrom's (docs/design/maelstrom.md), the deep sea: spears, vortex bolts,
// glowing bubbles, vortex funnels, beams, black water slammed down, her slash and her mark. And the
// Tidecaller's (docs/design/tidecaller.md), the moon's tide: pearls, shells, crescents, ribbons,
// pillars of moonlight, showers of drops and her healing. Strips in tools/fx-art.js (tm*, ms*, tc*), three strip pixels to a game pixel; each drawn out to the
// reach of the blow it shows.
import { fxSprite } from './fx-sprites.js';
import { onMob } from './storm-fx.js';

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
    case 'msspear': case 'msspearbig':
      // (Laid along its flight, but never tipped steeply: it reads as a spear thrown, not dropped.)
      fxSprite(ctx, f.shot === 'msspear' ? 'celmsspear' : 'celmsspearbig', x, y, { t: f.t, flip, rot: Math.max(-0.5, Math.min(0.5, Math.atan2(f.ty - f.y, Math.abs(f.tx - f.x)))) * (flip ? -1 : 1) });
      return true;
    case 'msblackwave': {
      // Black Wave: rising out of the floor ahead of her, as the Tide Mage's does.
      const k = Math.min(1, f.t / Math.max(0.01, f.dur * 0.25));
      fxSprite(ctx, 'celmsblackwave', x + dir * 34, f.floorY != null ? f.floorY - cam.y : y + 16, { t: f.t, flip, scale: 0.6 + 0.4 * k, alpha: Math.min(1, 0.3 + k) });
      return true;
    }
    case 'msblacktide':
      fxSprite(ctx, 'celmsblacktidebig', x + dir * 60, f.floorY != null ? f.floorY - cam.y : y + 16, { t: f.t, flip, scale: 0.75 + 0.25 * Math.min(1, f.t / Math.max(0.01, f.dur * 0.2)) });
      return true;
    case 'msbolt':
      fxSprite(ctx, 'celmsbolt', x, y, { t: f.t, flip, scale: 0.85 });
      return true;
    case 'msglow':
      fxSprite(ctx, 'celmsglow', x, y + 3 * Math.sin(f.t * 10), { t: f.t, flip, scale: 1.1 });
      return true;
    // The Tidecaller's: a pearl spinning in its ring of water, a shell skipping, a crescent rolling.
    case 'tcpearl':
      fxSprite(ctx, 'celtcpearl', x, y, { t: f.t, flip, scale: 0.95 });
      return true;
    case 'tcshell':
      fxSprite(ctx, 'celtcshell', x, y, { t: f.t, flip, scale: 0.9 });
      return true;
    case 'tccrescent': case 'tccrescentbig':
      fxSprite(ctx, f.shot === 'tccrescent' ? 'celtccrescent' : 'celtccrescentbig', x, y - (f.shot === 'tccrescent' ? 4 : 10), { t: f.t, flip, scale: 0.8 + 0.2 * Math.min(1, f.t / Math.max(0.01, f.dur * 0.2)) });
      return true;
    case 'tcsilverwave': {
      // Silver Wave: rising out of the floor ahead of her, as the Tide Mage's does.
      const k = Math.min(1, f.t / Math.max(0.01, f.dur * 0.25));
      fxSprite(ctx, 'celtcsilverwave', x + dir * 34, f.floorY != null ? f.floorY - cam.y : y + 16, { t: f.t, flip, scale: 0.6 + 0.4 * k, alpha: Math.min(1, 0.3 + k) });
      return true;
    }
    case 'tcsilvertide':
      fxSprite(ctx, 'celtcsilvertidebig', x + dir * 60, f.floorY != null ? f.floorY - cam.y : y + 16, { t: f.t, flip, scale: 0.75 + 0.25 * Math.min(1, f.t / Math.max(0.01, f.dur * 0.2)) });
      return true;
    case 'tcbubble':
      fxSprite(ctx, 'celtcbubble', x, y + 3 * Math.sin(f.t * 12), { t: f.t, flip, scale: 0.8 });
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
    // The Maelstrom's.
    case 'mshit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celmshit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.75 : 0.6 }) || true;
    }
    case 'msvortex':
      // Standing on the floor out where the blow reaches, as tall as it.
      return fxSprite(ctx, 'celmsvortex', x, y + 2, { p, flip, scale: Math.min(1.3, Math.max(0.8, (f.r ?? 150) / 150)) }) || true;
    case 'msvortexsmall':
      // (The Abyss: on the monster it shreds, following it.)
      return fxSprite(ctx, 'celmsvortexsmall', f.mob ? x + (f.mob.x - f.x) : x, (f.mob ? y + (f.mob.y - f.y) : y) + 2, { p, flip }) || true;
    case 'msbeam':
      // Out level from the staff's head to the end of the blow's reach.
      return fxSprite(ctx, 'celmsbeam', x, y - 15, { p, flip, scale: (f.r ?? 280) / 253 }) || true;
    case 'msslam':
      return fxSprite(ctx, 'celmsslam', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.7, (f.r ?? 130) / 130)) }) || true;
    case 'msbeambig':
      return fxSprite(ctx, 'celmsbeambig', x, y - 15, { p, flip, scale: (f.r ?? 340) / 456 }) || true;
    case 'msmaelstrom':
      // Her finisher's whirlpool, standing on the floor ahead of her.
      return fxSprite(ctx, 'celmsmaelstrombig', x, y + 2, { p, flip }) || true;
    case 'msshellfx':
      return fxSprite(ctx, 'celmsshellfx', x, y + 2, { p, scale: 0.9 }) || true;
    case 'mspool': {
      const fade = Math.min(1, (f.dur - f.t) / 0.8, f.t / 0.3);
      return fxSprite(ctx, 'celmspool', x, y + 2, { t: f.t, alpha: Math.max(0, fade) }) || true;
    }
    case 'msglowpop': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celmsglowpop', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: 0.7 }) || true;
    }
    case 'msslash':
      return fxSprite(ctx, 'celmsslash', x, y - 10, { p, flip, scale: (f.r ?? 120) / 110 }) || true;
    case 'tmhit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celtmhit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.75 : 0.6 }) || true;
    }
    // The Tidecaller's.
    case 'tchit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celtchit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.75 : 0.6 }) || true;
    }
    case 'tcbubblepop': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celtcbubblepop', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: 0.6 }) || true;
    }
    case 'tcribbon':
      // Out ahead of the staff's head to the end of the blow's reach, level with her hands.
      return fxSprite(ctx, 'celtcribbon', x, y - 16, { p, flip, scale: ((f.r ?? 128) * 0.92) / 127 }) || true;
    case 'tcpillar':
      // Standing on the floor out where it lands.
      return fxSprite(ctx, 'celtcpillar', x, y + 2, { p, flip, scale: Math.min(1, Math.max(0.75, (f.r ?? 170) / 200)) }) || true;
    case 'tcdrops': case 'tcdropsbig':
      return fxSprite(ctx, f.kind === 'tcdrops' ? 'celtcdrops' : 'celtcdropsbig', x, y + 2, { p, flip, scale: Math.min(1.1, Math.max(0.8, (f.r ?? 120) / 120)) }) || true;
    case 'tcspring':
      return fxSprite(ctx, 'celtcspring', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 150) / 140)) }) || true;
    case 'tcsplash':
      return fxSprite(ctx, 'celtcsplash', x, y + 2, { p, flip, scale: Math.max(0.8, (f.r ?? 88) / 90) }) || true;
    case 'tcdrop':
      // Spring Tide's droplet, on whoever it mends.
      return fxSprite(ctx, 'celtcdrop', x, y + 2, { p, scale: Math.max(0.8, (f.h ?? 40) / 48) }) || true;
    case 'tcrevive':
      return fxSprite(ctx, 'celtcrevive', x, y + 2, { p }) || true;
    // Her skills.
    case 'tcrain': {
      // Healing Rain: over her and the party while it lasts, following her, fading in and out.
      const fade = Math.min(1, (f.dur - f.t) / 0.6, f.t / 0.4);
      return fxSprite(ctx, 'celtcrain', x, y + 2, { t: f.t, scale: 1.35, alpha: Math.max(0, fade) }) || true;
    }
    case 'tcsurge':
      return fxSprite(ctx, 'celtcsurge', x, y + 2, { p, scale: 1.1 }) || true;
    case 'tcbless':
      return fxSprite(ctx, 'celtcbless', x, y + 2, { p, scale: 1.1 }) || true;
    case 'tcmoonfall':
      return fxSprite(ctx, 'celtcmoonfall', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 240) / 200)) }) || true;
    case 'tcmoontide':
      // Her finisher's tide, round her, across the screen.
      return fxSprite(ctx, 'celtcmoontidebig', x, y + 2, { p, flip, scale: 1.15 }) || true;
    case 'tcglint':
      return fxSprite(ctx, 'celtcglint', x, y - 30, { p, scale: 0.8 }) || true;
    case 'tcshellfx':
      return fxSprite(ctx, 'celtcshellfx', x, y + 2, { p, scale: 0.9 }) || true;
    case 'tcpool': {
      const fade = Math.min(1, (f.dur - f.t) / 0.8, f.t / 0.3);
      return fxSprite(ctx, 'celtcpool', x, y + 2, { t: f.t, alpha: Math.max(0, fade) }) || true;
    }
    case 'tcwhirl':
      return fxSprite(ctx, 'celtcwhirl', x, y + 2, { p, flip, scale: (f.r ?? 104) / 108 }) || true;
    case 'tcsplashbig':
      return fxSprite(ctx, 'celtcsplashbig', x, y + 2, { p, flip }) || true;
  }
  return false;
}
