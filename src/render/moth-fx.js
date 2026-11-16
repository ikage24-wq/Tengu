// The Moon Moth's effects (docs/design/moon-moth.md), in lilac and moon silver with gold eye spots:
// her mark on a monster, the clouds of moths she breaks into and re-forms from, her flight as
// moths, the wings her finisher opens, Wing Flurry's whirl, the swarm in flight, the Full Moon
// moth's nip, and Midnight Swarm's moon and pour. Strips in tools/fx-art.js (mm*), three strip
// pixels to a game pixel; each drawn out to the reach of the blow it shows.
import { fxSprite } from './fx-sprites.js';
import { onMob } from './storm-fx.js';

// Her shots in flight: the swarm rolls along its line, bobbing a little.
export function drawMothShot(ctx, f, x, y, dir) {
  if (f.shot !== 'mmswarm') return false;
  const k = Math.min(1, f.t / Math.max(0.01, f.dur * 0.2));
  fxSprite(ctx, 'celmmswarm', x, y - 4 + 3 * Math.sin(f.t * 9), { t: f.t, flip: dir < 0, scale: 0.6 + 0.35 * k });
  return true;
}

// Her bursts and her mark. (x, y): where the blow put it (her feet for most, the monster for her
// mark); `f.r` the blow's reach.
export function drawMothFx(ctx, f, x, y, p) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  switch (f.kind) {
    case 'mmhit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celmmhit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.72 : 0.58 }) || true;
    }
    case 'mmcloud':
      return fxSprite(ctx, 'celmmcloud', x, y + 2, { p, flip, scale: 0.9 }) || true;
    case 'mmflight': {
      // She flies on as moths from where she broke up to where she re-forms, eased.
      if (f.t < 0) return true;
      const u = Math.min(1, f.t / f.dur);
      const e = u * u * (3 - 2 * u);
      return fxSprite(ctx, 'celmmflight', x + (f.tx - f.x) * e, y + 2, { t: f.t, flip, scale: 0.85, alpha: Math.min(1, (1 - u) * 6) }) || true;
    }
    case 'mmwings':
      return fxSprite(ctx, 'celmmwings', x, y + 2, { p, flip, scale: 0.8 }) || true;
    case 'mmflurry':
      return fxSprite(ctx, 'celmmflurry', x, y + 2, { p, flip, scale: Math.min(1.1, Math.max(0.8, (f.r ?? 72) / 80)) }) || true;
    case 'mmnip': {
      // The Full Moon moth: off the monster her blow struck, on an arc to the one it nips.
      const u = Math.min(1, Math.max(0, f.t) / (f.dur * 0.86));
      const tx = (f.mob ? f.mob.x : f.tx) - f.x + x;
      const ty = (f.mob ? f.mob.y - (f.mob.def?.h ?? 40) * 0.55 : f.ty) - f.y + y;
      const along = (v) => {
        const e = v * v * (3 - 2 * v);
        return [x + (tx - x) * e, y + (ty - y) * e - 26 * Math.sin(Math.PI * v)];
      };
      // A little trail of its dust behind it, winking out.
      for (let j = 1; j <= 3; j++) {
        const v = u - j * 0.09;
        if (v <= 0) continue;
        const [dx, dy] = along(v);
        fxSprite(ctx, 'celmmdustfleck', dx, dy + j * 2, { t: f.t + j * 0.2, scale: 0.42 - j * 0.07, alpha: (1 - j * 0.25) * Math.min(1, (1 - p) * 5) });
      }
      const [mx, my] = along(u);
      return fxSprite(ctx, 'celmmmoth', mx, my, { t: f.t, flip: tx < x, scale: 0.42, alpha: Math.min(1, (1 - p) * 5) }) || true;
    }
    case 'mmmoon':
      // Midnight Swarm's moon rising behind her.
      return fxSprite(ctx, 'celmmmoon', x, y + 2, { p, flip }) || true;
    case 'mmpour':
      // The swarm pouring down across everything in front of her, from her feet on.
      return fxSprite(ctx, 'celmmpourbig', x, y + 2, { p, flip }) || true;
  }
  return false;
}
