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
  // (The Silkweaver's Binding Thread: a pearl bead trailing its thread.)
  if (f.shot === 'svthread') return fxSprite(ctx, 'celsvthread', x, y, { t: f.t, flip: dir < 0, scale: 0.6 }) || true;
  if (f.shot !== 'mmswarm' && f.shot !== 'ecswarm' && f.shot !== 'svswarm') return false;
  const k = Math.min(1, f.t / Math.max(0.01, f.dur * 0.2));
  fxSprite(ctx, `cel${f.shot}`, x, y - 4 + 3 * Math.sin(f.t * 9), { t: f.t, flip: dir < 0, scale: 0.6 + 0.35 * k });
  return true;
}

// A thread drawn live (the Silkweaver's Reel In and Moonspun Cocoon) from (x0, y0) to (x1, y1),
// sagging by `sag`, `u` (0-1) of the way out: a plum edge, a pearl core, a white light, a gold glint.
function liveThread(ctx, x0, y0, x1, y1, sag, u, glint, alpha) {
  if (alpha <= 0 || u <= 0) return;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + sag;
  const at = (t) => [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1];
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = 'round';
  for (const [w, c] of [[2.4, '#563a62'], [1.3, '#efe4d6'], [0.6, '#ffffff']]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const [px, py] = at((j / 12) * u);
      if (j) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  if (glint >= 0 && glint <= u) {
    const [gx, gy] = at(glint);
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath();
    ctx.arc(gx, gy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Her bursts and her mark. (x, y): where the blow put it (her feet for most, the monster for her
// mark); `f.r` the blow's reach.
// The thieves' second four, in each one's own look ('mm', 'ec', 'sv'): Moth Veil settling and a blow
// it turns aside, Dazzle Dust's cloud, the Moonlure's lantern and its pop, Wing Feint's moths.
const SECOND = /^(mm|ec|sv)(veil|dodge|dazzle|lure|lurepop|feint)$/;
function drawSecond(ctx, f, x, y, p, look, what) {
  const flip = (f.dir || 1) < 0;
  switch (what) {
    case 'veil':
      return fxSprite(ctx, `cel${look}veil`, x, y + 2, { p, flip, scale: 0.9 }) || true;
    case 'dodge':
      return fxSprite(ctx, `cel${look}dodge`, x, y + 2, { p, flip, scale: 0.8 }) || true;
    case 'dazzle':
      return fxSprite(ctx, `cel${look}dazzle`, x, y + 2, { p, flip, scale: 0.9 }) || true;
    case 'lure': {
      // The lantern, glowing for as long as it's out: it pops into place, and fades as it goes.
      const k = Math.min(1, f.t / 0.2);
      const pop = 1 - (1 - k) ** 3 + 0.12 * Math.sin(Math.min(1, f.t / 0.35) * Math.PI);
      return fxSprite(ctx, `cel${look}lure`, x, y + 2, { t: f.t, scale: 0.8 * pop, alpha: Math.min(1, (f.dur - f.t) / 0.15) }) || true;
    }
    case 'lurepop':
      return fxSprite(ctx, `cel${look}lurepop`, x, y + 2, { p, flip }) || true;
    case 'feint':
      return fxSprite(ctx, `cel${look}feint`, x, y + 2, { p, flip, scale: 0.85 }) || true;
  }
  return false;
}

export function drawMothFx(ctx, f, x, y, p) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const second = SECOND.exec(f.kind);
  if (second) return drawSecond(ctx, f, x, y, p, second[1], second[2]);
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
    case 'mmflutter': case 'ecflutter': case 'svflutter':
      // The flutter jump: a little burst of moths where she sprang off the air.
      return fxSprite(ctx, `cel${f.kind.slice(0, 2)}cloud`, x, y + 30, { p, flip, scale: 0.55 }) || true;
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
      // A little trail of its dust behind it, winking out. (In her path's look: `look`.)
      const look = f.look ?? 'mm';
      for (let j = 1; j <= 3; j++) {
        const v = u - j * 0.09;
        if (v <= 0) continue;
        const [dx, dy] = along(v);
        fxSprite(ctx, look === 'mm' ? 'celmmdustfleck' : `cel${look}dust`, dx, dy + j * 2, { t: f.t + j * 0.2, scale: 0.42 - j * 0.07, alpha: (1 - j * 0.25) * Math.min(1, (1 - p) * 5) });
      }
      const [mx, my] = along(u);
      return fxSprite(ctx, `cel${look}moth`, mx, my, { t: f.t, flip: tx < x, scale: 0.42, alpha: Math.min(1, (1 - p) * 5) }) || true;
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
    // ----- The Silkweaver's -----
    case 'svhit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celsvhit', mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.72 : 0.58 }) || true;
    }
    case 'svthreads': {
      // Her threads: a loose loop of silk round the monster for each, while they last.
      const m = f.mob;
      const n = m && m.hp > 0 ? m.threads ?? 0 : 0;
      if (!n) return true;
      const [mx, my] = onMob(f, x, y);
      const h = f.h ?? 40;
      const a = Math.min(1, (f.dur - f.t) / 0.3, f.t / 0.15);
      const sc = Math.min(1.8, Math.max(0.5, ((f.w ?? 40) * 1.15) / 35));
      for (let j = 0; j < n; j++) fxSprite(ctx, 'celsvloop', mx, my - h * (0.3 + 0.26 * j), { t: f.t + j * 0.37, scale: sc, alpha: a });
      return true;
    }
    case 'svwrapup': {
      const [mx, my] = onMob(f, x, y);
      const sc = Math.min(2.2, Math.max(0.5, Math.max(((f.w ?? 40) * 1.1) / 44, ((f.h ?? 40) * 1.05) / 61)));
      return fxSprite(ctx, 'celsvwrapup', mx, my - (f.h ?? 40) / 2, { p, scale: sc }) || true;
    }
    case 'svpop': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, 'celsvpop', mx, my - (f.h ?? 40) / 2, { p, flip, scale: Math.min(1.8, Math.max(0.6, (f.h ?? 40) / 50)) }) || true;
    }
    case 'svreel': {
      // Her threads, live: from her hand to each monster she has (Reel In hauls them in; Moonspun
      // Cocoon shoots them out, `out`), a glint running down each.
      const hx = x + dir * 9;
      const hy = y - 30;
      const u = f.out ? Math.min(1, f.t / (f.dur * 0.45)) : 1;
      const a = Math.min(1, (f.dur - f.t) / 0.12);
      (f.mobs ?? []).forEach((m, i) => {
        if (!m || m.hp <= 0) return;
        const tx = m.x - f.x + x;
        const ty = m.y - (m.air ?? 0) - (m.def?.h ?? 40) * 0.5 - f.y + y;
        liveThread(ctx, hx, hy, tx, ty, 6 * (1 - p), u, (p * 1.6 + i * 0.13) % 1, a);
      });
      return true;
    }
    case 'svknot':
      return fxSprite(ctx, 'celsvknot', x, y + 2, { p, flip, scale: 0.8 }) || true;
    case 'svlash':
      return fxSprite(ctx, 'celsvlash', x, y + 2, { p, flip }) || true;
    case 'svzipline':
      return fxSprite(ctx, 'celsvzipline', x, y + 2, { p, flip }) || true;
    case 'svswing': {
      // Silk Swing's thread, live: from the point high ahead where she cast it to her raised hand as
      // she swings (the effect follows her), a glint on the high point; once she lets go it floats up
      // and fades.
      if (f.ax == null) {
        f.ax = f.x + dir * 120;
        f.ay = f.y - 150;
      }
      const ax = f.ax - f.x + x;
      const ay = f.ay - f.y + y;
      const cast = Math.min(1, p / 0.12);
      const go = Math.max(0, (p - 0.62) / 0.38);
      const hx = x + dir * 4;
      const hy = y - 46;
      const ex = hx + (ax - hx) * go * 0.7;
      const ey = hy + (ay - 30 - hy) * go * 0.7;
      liveThread(ctx, ax, ay, ex, ey, 10 * go, cast, (p * 1.4) % 1, 1 - go);
      fxSprite(ctx, 'celsvdust', ax, ay, { t: f.t, scale: 0.6, alpha: 1 - go });
      return true;
    }
    case 'svwhirl':
      return fxSprite(ctx, 'celsvwhirl', x, y + 2, { p, flip, scale: Math.min(1.2, Math.max(0.7, (f.r ?? 130) / 140)) }) || true;
    case 'svmoon':
      return fxSprite(ctx, 'celsvmoon', x, y + 2, { p, flip }) || true;
    case 'svburst':
      return fxSprite(ctx, 'celsvburst', x, y + 2, { p, flip }) || true;
    case 'svpearlmoon':
      return fxSprite(ctx, 'celsvpearlmoon', x, y + 2, { p, flip }) || true;
    case 'svpour':
      return fxSprite(ctx, 'celsvpourbig', x, y + 2, { p, flip }) || true;
    case 'svcloud':
      return fxSprite(ctx, 'celsvcloud', x, y + 2, { p, flip, scale: 0.9 }) || true;
    case 'svflight': {
      if (f.t < 0) return true;
      const u = Math.min(1, f.t / f.dur);
      const e = u * u * (3 - 2 * u);
      return fxSprite(ctx, 'celsvflight', x + (f.tx - f.x) * e, y + 2, { t: f.t, flip, scale: 0.85, alpha: Math.min(1, (1 - u) * 6) }) || true;
    }
    case 'svflurry':
      return fxSprite(ctx, 'celsvflurry', x, y + 2, { p, flip, scale: Math.min(1.1, Math.max(0.8, (f.r ?? 72) / 80)) }) || true;
    case 'ecdiamond':
      // The diamond ring's flash racing out over the floor to the blow's reach.
      return fxSprite(ctx, 'celecdiamondbig', x, y + 2, { p, flip, scale: Math.min(1.45, Math.max(0.8, (f.r ?? 400) / 279)) }) || true;
  }
  return false;
}
