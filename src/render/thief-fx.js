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

// Each path's movement burst (tools/fx-art.js `leapOf`).
const LEAP = { shadow: 'shadow', ink: 'ink', fox: 'fox', hawk: 'hawk', wind: 'wind', storm: 'storm' };

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
    case 'foxsign': {
      // Endless Fox-Fire: a star leaving her fox sign pops a little fox face of fox fire there.
      const pop = p < 0.25 ? 0.6 + 1.6 * p : 1;
      fxSprite(ctx, 'celembfox', x + (f.dir || 1) * 4, y, { p: 0.6, scale: 0.14 * pop, alpha: p > 0.55 ? (1 - p) / 0.45 : 1 });
      fxSprite(ctx, 'celfoxfire', x, y + 4, { t: p * 0.6, scale: 0.12, alpha: p > 0.5 ? (1 - p) / 0.5 : 1 });
      return true;
    }
    case 'inkbrush': {
      // A brush stroke of ink along her path: a blink through the line, or the Endless Blade
      // Dance's drawn cut (big), splashing ink on the ground at its end.
      fxSprite(ctx, 'celinkbrush', x, y, { p, flip, sx: Math.max(0.35, (f.len ?? 120) / 100), sy: f.big ? 1.3 : 0.8 });
      if (f.big) groundRing(ctx, 'celringink', x + (f.dir || 1) * 60, y + 24, p, 90);
      return true;
    }
    case 'leaflaunch': {
      // An arrow peeling off the Beastmaster's gale of leaves: a gust off the leaf.
      fxSprite(ctx, 'celwindhit', x, y, { p, scale: 0.3 });
      return true;
    }
    case 'tailwake': {
      // Endless Fox-Fire reaching a new stage: another tail wakes, a burst of fox fire where it
      // grows from (behind her hips) and a ring racing out at her feet.
      const pop = p < 0.3 ? p / 0.3 : 1;
      fxSprite(ctx, 'celfoxhit', x, y - 14, { p, scale: (f.big ? 0.7 : 0.5) * pop });
      groundRing(ctx, 'celringfox', x + (f.dir || 1) * 8, y, p, f.big ? 80 : 56);
      return true;
    }
    case 'wisplaunch': {
      // A star peeling off a wisp of her wheel of fox fire: a flash of it.
      fxSprite(ctx, 'celfoxhit', x, y + 6, { p, scale: 0.32 });
      return true;
    }
    case 'smokepuff': {
      // A puff of violet smoke off the hand as a fan of stars goes.
      fxSprite(ctx, 'celsmoke', x + (f.dir || 1) * 6, y + 14, { p, flip, scale: 0.55 });
      return true;
    }
    case 'leapburst': {
      // A flash jump, a shadow dash or an archer's air leap: a pop of light where she kicks off,
      // a ring standing across her path, speed lines and sparkles trailing behind her, in her
      // path's own colours.
      // (The Wind Dancer kicks off in a gust, the Blade Dancer in a ricochet's spark.)
      if (f.school === 'coral') fxSprite(ctx, 'celwdgust', x, y - 6, { p, flip: !flip, scale: 0.6 * (f.k ?? 1), rot: flip ? -0.5 : 0.5 });
      else if (f.school === 'rosegold') fxSprite(ctx, 'celbdbounce', x, y - 4, { p, flip, scale: 0.75 * (f.k ?? 1) });
      else if (f.school === 'aerial') fxSprite(ctx, 'celskyhit', x, y - 4, { p, scale: 0.5 * (f.k ?? 1) });
      else fxSprite(ctx, `celleap${LEAP[f.school] ?? 'shadow'}`, x, y, { p, flip, scale: 0.95 * (f.k ?? 1) });
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
    case 'smokeburst': {
      // A burst of white smoke where she darts off, swaps out, or vanishes.
      fxSprite(ctx, 'celsmokebomb', x, y + 6, { p, flip, scale: 0.6 });
      return true;
    }
    // A monster burning: blue fire licking up off it.
    case 'foxburn': {
      // A monster burning in fox fire: a lick of blue flame up its side as the burn bites.
      fxSprite(ctx, 'celfoxfire', x + ((f.seed ?? 0.5) - 0.5) * 16, y - 4, { t: p * 0.6, scale: 0.32, alpha: p > 0.6 ? (1 - p) / 0.4 : 1 });
      return true;
    }
    default:
      return false;
  }
}

// One star of Full Moon Volley's rain, falling (a big silver star trailing violet streaks).
export function moonRainPiece(ctx, x, y, s, time) {
  const ang = Math.atan2(2.6, 1);
  fxSprite(ctx, 'celshadowtrail', x - Math.cos(ang) * 14 * s, y - Math.sin(ang) * 14 * s, { t: time, rot: ang, scale: 0.45 * s });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 18);
  shuriken(ctx, 8 * s, '#d2cff0', '#ffffff', '#3a2d4f');
  ctx.restore();
}

// One star of Nine-Tail Blaze's rain, falling (a steel star wrapped in blue fox fire).
export function foxRainPiece(ctx, x, y, s, time) {
  const ang = Math.atan2(2.6, 1);
  fxSprite(ctx, 'celfoxtrail', x, y, { t: time, rot: ang, scale: 0.4 * s });
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(time * 18);
  shuriken(ctx, 8 * s, '#dfe8ff', '#ffffff', '#1e3a8a');
  ctx.restore();
}
