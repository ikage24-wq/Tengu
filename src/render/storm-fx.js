// The Thunderguard's lightning (docs/design/thunderguard.md), in storm blue and white-gold: his mark
// on a monster, the crackle a jumping bolt leaves, bolts jumping between monsters, his spark streaks,
// static bursts and rings, bolt beams, columns of lightning, the bolt called down on a finisher, the
// thunderclap, and his skills'. Strips in tools/fx-art.js (tg*), three strip pixels to a game pixel;
// each drawn out to the reach of the blow it shows.
import { fxSprite } from './fx-sprites.js';

// His shots in flight: Storm Cleave's crescent of lightning, at chest height.
export function drawStormShot(ctx, f, x, y, dir) {
  // (The Tempest's crescent is thinner and faster: his Crimson Arc and Crimson Cleave.)
  if (f.shot !== 'tgwave' && f.shot !== 'tpwave' && f.shot !== 'bwwave') return false;
  fxSprite(ctx, `cel${f.shot}`, x, y - 6, { t: f.t, flip: dir < 0, scale: 0.75 + 0.25 * Math.min(1, f.t / Math.max(0.01, f.dur * 0.2)) });
  return true;
}

// A mark on a monster rides on it (knocked back, thrown up, or as it falls), from where it was hit.
export const onMob = (f, x, y) => (f.mob ? [x + (f.mob.x - f.x), y + (f.mob.y - (f.mob.air ?? 0)) - f.y] : [x, y]);

// (x, y): where the blow put it (his feet for most, the monster for his mark); `f.r` the blow's reach.
export function drawStormFx(ctx, f, x, y, p, cam) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  switch (f.kind) {
    case 'tghit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celtghit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.7 : 0.55 }) || true;
    }
    case 'tgspark': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celtgspark', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: 0.55 }) || true;
    }
    case 'tgchain': {
      // A bolt jumping from one monster to the next: laid along the line between them, stretched to
      // its length (the strip is 100 px long).
      if (f.tx == null) return true;
      const tx = f.tx - cam.x;
      const ty = f.ty - cam.y;
      const len = Math.hypot(tx - x, ty - y);
      if (len < 4) return true;
      return fxSprite(ctx, 'celtgchain', x, y, { p, rot: Math.atan2(ty - y, tx - x), sx: len / 100 }) || true;
    }
    case 'tgdart':
      // A streak of sparks behind a lunge, from her hands out to the end of its reach.
      return fxSprite(ctx, 'celtgdart', x, y - 16, { p, flip, scale: ((f.r ?? 94) * 0.95) / 100 }) || true;
    case 'tgburst':
      return fxSprite(ctx, 'celtgburst', x, y - 22, { p, flip, scale: 0.8 }) || true;
    case 'tgfloor':
      return fxSprite(ctx, 'celtgfloor', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 86) / 90)) }) || true;
    case 'tgring':
      // A ring of static racing out round his feet to the reach of the spin.
      return fxSprite(ctx, 'celtgring', x, y + 2, { p, flip, scale: (f.r ?? 78) / 80 }) || true;
    case 'tgbeam':
      // Level out from his hands to the end of the thrust's reach.
      return fxSprite(ctx, 'celtgbeam', x, y - 18, { p, flip, scale: (f.r ?? 124) / 120 }) || true;
    case 'tgcolumn':
      return fxSprite(ctx, 'celtgcolumn', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 90) / 90)) }) || true;
    case 'tgbolt':
      // Called down out of the sky onto where the blow lands.
      return fxSprite(ctx, 'celtgbolt', x, y + 2, { p, flip, scale: Math.min(1, Math.max(0.8, (f.r ?? 96) / 110)) }) || true;
    case 'tgclap':
      return fxSprite(ctx, 'celtgclap', x, y + 2, { p, flip, scale: Math.min(1.25, Math.max(0.85, (f.r ?? 100) / 100)) }) || true;
    case 'tgflash':
      // The streak a flash cut leaves along the way it came.
      return fxSprite(ctx, 'celtgflash', x, y - 18, { p, flip }) || true;
    // The Tempest's (red lightning).
    case 'tphit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celtphit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.7 : 0.55 }) || true;
    }
    case 'tpline':
      return fxSprite(ctx, 'celtpline', x, y - 18, { p, flip, scale: ((f.r ?? 100) * 0.95) / 100 }) || true;
    case 'tpflashstep': {
      // From where he was to where he is.
      if (f.tx == null) return true;
      const tx = f.tx - cam.x;
      const ty = f.ty - cam.y;
      const len = Math.hypot(tx - x, ty - y);
      if (len < 4) return true;
      return fxSprite(ctx, 'celtpflashstep', x, y, { p, rot: Math.atan2(ty - y, tx - x), sx: len / 100 }) || true;
    }
    case 'tpwhirlfx':
      return fxSprite(ctx, 'celtpwhirlfx', x, y + 2, { p, flip, scale: Math.max(0.8, (f.r ?? 86) / 90) }) || true;
    case 'tpfloor':
      return fxSprite(ctx, 'celtpfloor', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 86) / 90)) }) || true;
    case 'tpbolt':
      return fxSprite(ctx, 'celtpbolt', x, y + 2, { p, flip, scale: Math.min(0.95, Math.max(0.75, (f.r ?? 96) / 115)) }) || true;
    case 'tpcuts':
      return fxSprite(ctx, 'celtpcuts', x, y - 20, { p, flip }) || true;
    case 'tprush':
      return fxSprite(ctx, 'celtprush', x, y - 20, { p, flip }) || true;
    case 'tpflashburst':
      return fxSprite(ctx, 'celtpflashburst', x, y - 24, { p, flip, scale: 0.75 }) || true;
    case 'tpclapbig':
      return fxSprite(ctx, 'celtpclapbig', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.85, (f.r ?? 220) / 220)) }) || true;
    case 'tpboltbig':
      return fxSprite(ctx, 'celtpboltbig', x, y + 2, { p, flip }) || true;
    case 'tpstormcloud':
      return fxSprite(ctx, 'celtpstormcloud', x, y + 2, { p, scale: 1.1 }) || true;
    case 'tpguardshell': {
      const fade = Math.min(1, (f.dur - f.t) / 0.5, f.t / 0.25);
      return fxSprite(ctx, 'celtpguardshell', x, y + 2, { t: f.t, scale: 0.7, alpha: Math.max(0, fade) }) || true;
    }
    // The Stormwall's (indigo and gold; the storm as a fortress).
    case 'bwhit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celbwhit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.72 : 0.58 }) || true;
    }
    case 'bwrain':
      return fxSprite(ctx, 'celbwrain', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 96) / 100)) }) || true;
    case 'bwplate':
      return fxSprite(ctx, 'celbwplate', x, y - 2, { p, flip, scale: 0.55 }) || true;
    case 'bwfield':
      // Field lines fanning out from him to the end of the pull's reach, level with his waist.
      return fxSprite(ctx, 'celbwfield', x, y - 18, { p, flip, scale: (f.r ?? 140) / 100 }) || true;
    case 'bwcage':
      return fxSprite(ctx, 'celbwcage', x, y + 2, { p, flip, scale: (f.r ?? 110) / 72 }) || true;
    case 'bwwall':
      return fxSprite(ctx, 'celbwwall', x, y + 2, { p, flip, scale: 0.8 }) || true;
    case 'bwboltdown':
      return fxSprite(ctx, 'celbwboltdown', x, y + 2, { p, flip, scale: Math.min(1, Math.max(0.8, (f.r ?? 110) / 120)) }) || true;
    case 'bwroll':
      return fxSprite(ctx, 'celbwroll', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.8, (f.r ?? 110) / 110)) }) || true;
    case 'bwspout':
      return fxSprite(ctx, 'celbwspout', x, y + 2, { p, flip }) || true;
    case 'bwcagebig':
      return fxSprite(ctx, 'celbwcagebig', x, y + 2, { p, flip, scale: (f.r ?? 200) / 73 }) || true;
    case 'bwwallbig':
      return fxSprite(ctx, 'celbwwallbig', x, y + 2, { p, flip, scale: 0.8 }) || true;
    case 'bwfieldbig':
      return fxSprite(ctx, 'celbwfieldbig', x, y - 18, { p, flip, scale: (f.r ?? 300) / 160 }) || true;
    case 'bwovercastfx':
      return fxSprite(ctx, 'celbwovercastfx', x, y + 2, { p, scale: 1.1 }) || true;
    case 'bwsquallfx':
      return fxSprite(ctx, 'celbwsquallfx', x, y + 2, { p, flip, scale: Math.max(0.8, (f.r ?? 96) / 110) }) || true;
    case 'bwstormcloud':
      return fxSprite(ctx, 'celbwstormcloud', x, y + 2, { p, scale: 1.1 }) || true;
    case 'bwclapbig':
      return fxSprite(ctx, 'celbwclapbig', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.85, (f.r ?? 220) / 220)) }) || true;
    case 'bwboltbig':
      return fxSprite(ctx, 'celbwboltbig', x, y + 2, { p, flip }) || true;
    case 'bwguardshell': {
      const fade = Math.min(1, (f.dur - f.t) / 0.5, f.t / 0.25);
      return fxSprite(ctx, 'celbwguardshell', x, y + 2, { t: f.t, scale: 0.72, alpha: Math.max(0, fade) }) || true;
    }
    // His skills.
    case 'tgrush':
      return fxSprite(ctx, 'celtgrush', x, y - 20, { p, flip }) || true;
    case 'tgcyclone':
      // Round him all through the spin, following him.
      return fxSprite(ctx, 'celtgcyclone', x, y + 2, { p, flip, scale: Math.max(0.8, (f.r ?? 96) / 110) }) || true;
    case 'tgrodfx':
      return fxSprite(ctx, 'celtgrodfx', x, y + 2, { p, flip }) || true;
    case 'tgclapbig':
      return fxSprite(ctx, 'celtgclapbig', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.85, (f.r ?? 220) / 220)) }) || true;
    case 'tgboltbig':
      return fxSprite(ctx, 'celtgboltbig', x, y + 2, { p, flip }) || true;
    case 'tgguardshell': {
      // Static Guard: the shell round him while it lasts, fading in and out.
      const fade = Math.min(1, (f.dur - f.t) / 0.5, f.t / 0.25);
      return fxSprite(ctx, 'celtgguardshell', x, y + 2, { t: f.t, scale: 0.7, alpha: Math.max(0, fade) }) || true;
    }
    case 'tgstormcloud':
      // Thunderfall's storm gathering high over him.
      return fxSprite(ctx, 'celtgstormcloud', x, y + 2, { p, scale: 1.1 }) || true;
  }
  return false;
}
