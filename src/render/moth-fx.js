// The Moon Moth's effects (docs/design/moon-moth.md), in lilac and moon silver with little gold crescents:
// her mark on a monster, the clouds of moths she breaks into and re-forms from, her flight as
// moths, the wings her finisher opens, Wing Flurry's whirl, the swarm in flight, the Full Moon
// moth's nip, and Midnight Swarm's moon and pour. Strips in tools/fx-art.js (mm*), three strip
// pixels to a game pixel; each drawn out to the reach of the blow it shows. And the Eclipse's
// (docs/design/eclipse.md, ec*): her marks (little eclipses) riding on monsters, Eye of the Night in
// flight, the eclipse that forms on her Pierce, her ring of corona, discs of shadow, Umbral Edge, marks going off, her dark
// moths, the New Moon, and Total Eclipse darkening the world behind everyone.
import { fxSprite } from './fx-sprites.js';
import { onMob } from './storm-fx.js';

// Her shots in flight: the swarm rolls along its line, bobbing a little.
export function drawMothShot(ctx, f, x, y, dir) {
  if (f.shot === 'eceye') return fxSprite(ctx, 'celeceye', x, y, { t: f.t, flip: dir < 0, scale: 0.6 }) || true;
  if (f.shot !== 'mmswarm' && f.shot !== 'ecswarm') return false;
  const k = Math.min(1, f.t / Math.max(0.01, f.dur * 0.2));
  fxSprite(ctx, f.shot === 'ecswarm' ? 'celecswarm' : 'celmmswarm', x, y - 4 + 3 * Math.sin(f.t * 9), { t: f.t, flip: dir < 0, scale: 0.6 + 0.35 * k });
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
    case 'mmflutter': case 'ecflutter':
      // The flutter jump: a little burst of moths where she sprang off the air.
      return fxSprite(ctx, f.kind === 'ecflutter' ? 'celeccloud' : 'celmmcloud', x, y + 30, { p, flip, scale: 0.55 }) || true;
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
    // ----- The Eclipse's -----
    case 'echit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celechit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.72 : 0.58 }) || true;
    }
    case 'ecmark': {
      // Her marks: one little eclipse for each, in a row over the monster's head, while they last.
      const m = f.mob;
      const n = m && m.hp > 0 ? m.marks ?? 0 : 0;
      if (!n) return true;
      const [mx, my] = onMob(f, x, y);
      const a = Math.min(1, (f.dur - f.t) / 0.3, f.t / 0.12);
      for (let j = 0; j < n; j++) fxSprite(ctx, 'celecmarkeye', mx + (j - (n - 1) / 2) * 17, my - (f.h ?? 40) - 13, { t: f.t + j * 0.31, scale: 0.46, alpha: a });
      return true;
    }
    case 'ecpop': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celecpop', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: 0.55 + 0.08 * (f.n ?? 1) }) || true;
    }
    case 'eceyeopen':
      return fxSprite(ctx, 'celeceyeopen', x, y - 28, { p, flip, scale: 0.75 }) || true;
    case 'ecring':
      // Her ring of corona round her body, as wide as the blow reaches.
      return fxSprite(ctx, 'celecringbig', x, y - 28, { p, flip, scale: Math.min(1.3, Math.max(0.5, (f.r ?? 76) / 66)) }) || true;
    case 'ecringbig':
      return fxSprite(ctx, 'celecringhuge', x, y - 28, { p, flip, scale: Math.min(1.3, Math.max(0.8, (f.r ?? 150) / 125)) }) || true;
    case 'ecportal':
      return fxSprite(ctx, 'celecportal', x, y + 2, { p, flip, scale: 0.9 }) || true;
    case 'ecedge':
      return fxSprite(ctx, 'celecedge', x, y - 28, { p, flip, scale: 0.85 }) || true;
    case 'eccloud':
      return fxSprite(ctx, 'celeccloud', x, y + 2, { p, flip, scale: 0.9 }) || true;
    case 'ecflight': {
      if (f.t < 0) return true;
      const u = Math.min(1, f.t / f.dur);
      const e = u * u * (3 - 2 * u);
      return fxSprite(ctx, 'celecflight', x + (f.tx - f.x) * e, y + 2, { t: f.t, flip, scale: 0.85, alpha: Math.min(1, (1 - u) * 6) }) || true;
    }
    case 'ecflurry':
      return fxSprite(ctx, 'celecflurry', x, y + 2, { p, flip, scale: Math.min(1.1, Math.max(0.8, (f.r ?? 72) / 80)) }) || true;
    case 'ecnewmoon':
      return fxSprite(ctx, 'celecnewmoon', x, y + 2, { p, flip }) || true;
    case 'ecpour':
      return fxSprite(ctx, 'celecpourbig', x, y + 2, { p, flip }) || true;
    case 'ectotal': {
      // The world goes dark behind everyone (a ground effect: the fighters stay lit), and the
      // eclipse hangs high over her.
      const dark = 0.55 * Math.min(1, p / 0.14, (1 - p) / 0.2);
      if (dark > 0) {
        ctx.save();
        ctx.globalAlpha = dark;
        ctx.fillStyle = '#120a2a';
        ctx.fillRect(x - 2000, y - 2000, 4000, 4000);
        ctx.restore();
      }
      return fxSprite(ctx, 'celectotalbig', x, y + 2, { p, flip }) || true;
    }
    case 'ecdiamond':
      // The diamond ring's flash racing out over the floor to the blow's reach.
      return fxSprite(ctx, 'celecdiamondbig', x, y + 2, { p, flip, scale: Math.min(1.45, Math.max(0.8, (f.r ?? 400) / 279)) }) || true;
  }
  return false;
}
