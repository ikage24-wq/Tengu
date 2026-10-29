// The Thief's effects, in Tengu's own effect art (tools/fx-art.js, the `cel*` strips), matched to
// the sprites like every other effect (CLAUDE.md): violet and midnight with moonlight silver. Dagger
// cuts are thin violet swipes and X-slashes, steps and vanishes are puffs of violet smoke, thrown
// stars trail violet streaks, and the finishers bring the night: a moon, and a giant crescent moon
// cutting the line. Code draws only the stars themselves (the real throwing stars from the bag).
//
// Drawn from progress `p` (0-1); (x, y) is a monster's feet for per-target effects and the hero's
// feet (or the bow hand, for muzzle puffs) otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { groundRing } from './warrior-fx.js';
import { wash } from './fxkit.js';

// A four-point throwing star around the origin: plum-outlined steel blades, each with a lit half,
// and a hole in the middle. Without an outline it's a flat silhouette (for afterimages).
export function shuriken(ctx, r, body, lit, ink) {
  const pt = (k, d, off = 0) => {
    const a = (k * Math.PI) / 2 - Math.PI / 2 + off;
    return [Math.cos(a) * d, Math.sin(a) * d];
  };
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const p = [pt(k, r), pt(k, r * 0.5, 0.4), pt(k, r * 0.3, Math.PI / 4)];
    p.forEach(([px, py], i) => (k || i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  }
  ctx.closePath();
  if (ink) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.fillStyle = body;
  ctx.fill();
  if (!ink) return;
  // The lit half of each blade.
  ctx.fillStyle = lit;
  for (let k = 0; k < 4; k++) {
    const [tx, ty] = pt(k, r - 0.8);
    const [ix, iy] = pt(k, r * 0.3, -Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tx, ty);
    ctx.lineTo(ix, iy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#8a92a3';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
}

export function drawThiefFx(ctx, f, x, y, p, cam, time) {
  const flip = (f.dir || 1) < 0;
  switch (f.kind) {
    case 'shadowhit': {
      // A Thief's star landing: the violet X with a silver glint; heavy ones and crits add a ring.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celshadowhit', x, cy, { p, flip, scale: big ? 1 : 0.75 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.45 });
      if (big) groundRing(ctx, 'celringshadow', x, y, p, 46);
      return true;
    }
    case 'smokepuff': {
      // A puff of violet smoke off the hand as a fan of stars goes.
      fxSprite(ctx, 'celsmoke', x + (f.dir || 1) * 6, y + 14, { p, flip, scale: 0.55 });
      return true;
    }
    case 'blinksmoke': {
      // A blink: a puff of violet smoke at the feet where she melts away or steps out.
      fxSprite(ctx, 'celsmoke', x, y + 6, { p, flip, scale: 0.85 });
      return true;
    }
    case 'moonslash': {
      // Moonlit Assassination on each monster: a puff of smoke where the thief blinks in, and a big
      // violet X cut across it.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'celsmoke', x - 14, y, { p: Math.min(1, p * 1.5), scale: 0.45 });
      fxSprite(ctx, 'celxslash', x, cy, { p, scale: 0.75, rot: ((f.seed ?? 0.5) - 0.5) * 0.8 });
      return true;
    }
    case 'nightfall': {
      // Night falls for the dagger finisher: the world darkens to midnight under a moon, and the
      // thief vanishes in a burst of smoke.
      const a = Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.save();
      ctx.globalAlpha = 0.42 * a;
      ctx.fillStyle = '#1c1240';
      wash(ctx);
      ctx.restore();
      fxSprite(ctx, 'celmoon', x - (f.dir || 1) * 30, y - 150, { frame: p < 0.12 ? 1 : 2, scale: 0.7, alpha: a });
      fxSprite(ctx, 'celsmoke', x, y, { p: Math.min(1, p * 2), scale: 0.9 });
      return true;
    }
    case 'fullmoon': {
      // The gauntlet finisher's moon: the stars spin up into a full moon over the monsters ahead,
      // held, then it bursts into falling stars.
      const mx = x + (f.dir || 1) * 170;
      const frame = p < 0.68 ? Math.min(3, Math.floor(p / 0.12)) : p < 0.84 ? 4 : 5;
      ctx.save();
      ctx.globalAlpha = 0.3 * Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.fillStyle = '#1c1240';
      wash(ctx);
      ctx.restore();
      fxSprite(ctx, 'celmoon', mx, y - 120, { frame, scale: 1.15 });
      return true;
    }
    case 'crescentcut': {
      // The finishers' last blow: a giant crescent moon cutting through the line, a ring racing
      // out along the ground.
      const r = f.r ?? 200;
      fxSprite(ctx, 'celcrescentbig', x, y - 34, { p, flip, scale: r / 230 });
      groundRing(ctx, 'celringshadow', x, y, p, r);
      return true;
    }
    // ---------- The Assassin ----------
    case 'crowburst': {
      // Crows burst up and away from a heavy cut.
      fxSprite(ctx, 'celcrowburst', x, y - 10, { p, flip, scale: 0.8 });
      return true;
    }
    case 'deathmark': {
      // A mark for death: a crimson ring turning over the marked monster for as long as it lasts.
      const m = f.mob;
      if (!m || m.hp <= 0) return true;
      const mx = m.x - cam.x;
      const my = m.y - (m.air ?? 0) - m.def.h - 18 - cam.y;
      fxSprite(ctx, 'celdeathmark', mx, my, { t: time, scale: 0.5, alpha: p > 0.9 ? (1 - p) / 0.1 : 1 });
      return true;
    }
    case 'crowcut': {
      // Blood Moon Requiem on each monster: black smoke where she steps out behind it, a crimson X
      // cut across it, feathers.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'celsmoke', x + (f.dir || 1) * 16, y, { p: Math.min(1, p * 1.5), scale: 0.45 });
      fxSprite(ctx, 'celcrowx', x, cy, { p, scale: 0.75, rot: ((f.seed ?? 0.5) - 0.5) * 0.8 });
      return true;
    }
    case 'execute': {
      // An execution: a big crimson X and a burst of black feathers on the monster.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'celcrowx', x, cy, { p, scale: 0.9 });
      fxSprite(ctx, 'celcrowhit', x, cy, { p, scale: 1.2, flip });
      return true;
    }
    case 'bloodmoonrise': {
      // The blood moon: the world darkens, a red moon swells in the sky and crows stream across it;
      // the assassin vanishes in smoke.
      const a = Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.save();
      ctx.globalAlpha = 0.45 * a;
      ctx.fillStyle = '#2a0a18';
      wash(ctx);
      ctx.restore();
      fxSprite(ctx, 'celredmoon', x - (f.dir || 1) * 30, y - 150, { frame: p < 0.12 ? 1 : 2, scale: 0.75, alpha: a });
      fxSprite(ctx, 'celcrows', x + (f.dir || 1) * (-120 + p * 300), y - 150, { t: time, flip, scale: 0.8, alpha: a });
      fxSprite(ctx, 'celsmoke', x, y, { p: Math.min(1, p * 2), scale: 0.9 });
      return true;
    }
    case 'redcrescent': {
      // The requiem's last cut: a crimson crescent tearing through the line, crows scattering.
      const r = f.r ?? 210;
      fxSprite(ctx, 'celredcrescentbig', x, y - 34, { p, flip, scale: r / 230 });
      groundRing(ctx, 'celringcrimson', x, y, p, r);
      fxSprite(ctx, 'celcrowburst', x, y - 20, { p, flip, scale: 1 });
      return true;
    }
    // ---------- The Night Lord ----------
    case 'starhit': {
      // A star landing: a gold star in an indigo ring; heavy ones and crits add a ring on the ground.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big || f.crit;
      fxSprite(ctx, 'celstarhit', x, cy, { p, scale: big ? 0.95 : 0.7 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, cy, { p, scale: 0.45 });
      if (big) groundRing(ctx, 'celringnight', x, y, p, 46);
      return true;
    }
    case 'starpop': {
      // A stuck star bursting.
      fxSprite(ctx, 'celstarpop', x, y - (f.h ?? 24) / 2, { p, scale: 0.9 });
      groundRing(ctx, 'celringnight', x, y, p, 60);
      return true;
    }
    case 'stuckstar': {
      // A star stuck in a monster, glowing brighter until it bursts.
      const m = f.mob;
      if (!m || m.hp <= 0) return true;
      fxSprite(ctx, 'celstuckstar', m.x - cam.x, m.y - (m.air ?? 0) - m.def.h / 2 - cam.y, { t: time * (1 + p * 2), scale: 0.6 + 0.3 * p });
      return true;
    }
    case 'constellation': {
      // Galaxy Fall: the night sky darkens and a great constellation joins up over the monsters,
      // then streaks down onto them.
      const cx = x + (f.dir || 1) * 170;
      const a = Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.save();
      ctx.globalAlpha = 0.35 * a;
      ctx.fillStyle = '#10103a';
      wash(ctx);
      ctx.restore();
      fxSprite(ctx, 'celconstellationbig', cx, y - 140, { p, scale: 0.75 });
      return true;
    }
    case 'galaxyburst': {
      // The constellation lands: a ring of starlight racing out, a great gold star bursting.
      const r = f.r ?? 210;
      groundRing(ctx, 'celringnight', x, y, p, r);
      groundRing(ctx, 'celringstarlight', x, y, Math.min(1, p * 1.4), r * 0.6);
      fxSprite(ctx, 'celstarpop', x, y - 40, { p, scale: 1.6 });
      return true;
    }
    default:
      return false;
  }
}

// One star of Full Moon Volley's rain, falling (a big silver star trailing violet streaks).
export function moonRainPiece(ctx, x, y, s, time, gold = false) {
  const ang = Math.atan2(2.6, 1);
  fxSprite(ctx, gold ? 'celnighttrail' : 'celshadowtrail', x - Math.cos(ang) * 14 * s, y - Math.sin(ang) * 14 * s, { t: time, rot: ang, scale: 0.45 * s });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 18);
  shuriken(ctx, 8 * s, gold ? '#ffe17a' : '#d2cff0', '#ffffff', '#3a2d4f');
  ctx.restore();
}
