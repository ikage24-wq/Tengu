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
    // ---------- The Shinobi (ink, red seals, white smoke) ----------
    case 'inkhit': {
      // A heavy blow's splash of ink on the monster (or where it lands).
      fxSprite(ctx, 'celinkhit', x, y - (f.h ?? 30) / 2, { p, flip, scale: f.big ? 1.1 : 0.85, rot: ((f.seed ?? 0.5) - 0.5) * 0.8 });
      return true;
    }
    case 'sealtag': {
      // A seal tag slapped on the monster: it glows red, then bursts (the burst is its own blow).
      fxSprite(ctx, 'celseal', x, y - (f.h ?? 30) / 2, { frame: Math.min(3, Math.floor(p * 4)), scale: 0.4 });
      return true;
    }
    case 'sealburst': {
      // The seal bursting: a red circle of light, scraps of paper, a ring along the ground.
      fxSprite(ctx, 'celseal', x, y - 26, { frame: 3 + Math.min(3, p * 4), scale: 1 });
      groundRing(ctx, 'celringink', x, y, p, 60);
      return true;
    }
    case 'smokeburst': {
      // A burst of white smoke where she darts off, swaps out, or vanishes.
      fxSprite(ctx, 'celsmokebomb', x, y + 6, { p, flip, scale: 0.6 });
      return true;
    }
    case 'logpoof': {
      // Log Swap: a log drops where she stood, in a burst of smoke.
      fxSprite(ctx, 'cellog', x, y + 2, { p: Math.min(1, p * 1.6), flip, scale: 0.42, alpha: p > 0.8 ? (1 - p) / 0.2 : 1 });
      fxSprite(ctx, 'celsmokebomb', x, y + 6, { p, scale: 0.65 });
      return true;
    }
    case 'inkwash': {
      // Thousand Cuts: ink spills over the world, it darkens to a wash of ink on paper, and she
      // vanishes in a burst of white smoke.
      const a = Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.save();
      ctx.globalAlpha = 0.42 * a;
      ctx.fillStyle = '#14101a';
      wash(ctx);
      ctx.restore();
      fxSprite(ctx, 'celsmokebomb', x, y + 6, { p: Math.min(1, p * 2), scale: 0.9 });
      return true;
    }
    case 'inkcut': {
      // Thousand Cuts on each monster: she steps out of white smoke and a brush stroke of ink
      // cuts across it, splashing.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'celsmokebomb', x - 14, y + 4, { p: Math.min(1, p * 1.5), scale: 0.3 });
      fxSprite(ctx, 'celinkhit', x, cy, { p, scale: 0.9, rot: ((f.seed ?? 0.5) - 0.5) * 1.6 });
      return true;
    }
    case 'inkfoxsweep': {
      // The last blow: a giant fox of ink sweeps through the whole line, a ring of ink racing out.
      const r = f.r ?? 220;
      fxSprite(ctx, 'celinkfoxbig', x + (f.dir || 1) * 30, y + 10, { p, flip, scale: r / 300 });
      groundRing(ctx, 'celringink', x, y, p, r);
      return true;
    }
    // ---------- The Kitsune (gold and blue fox fire) ----------
    case 'foxhit': {
      // A fox-fire star landing: blue flame bursting up off the monster with gold sparks.
      fxSprite(ctx, 'celfoxhit', x, y - (f.h ?? 24) / 2 + 10, { p, scale: f.big || f.crit ? 0.85 : 0.6 });
      if (f.crit) fxSprite(ctx, 'celcrit', x, y - (f.h ?? 24) / 2, { p, scale: 0.45 });
      if (f.big) groundRing(ctx, 'celringfox', x, y, p, 46);
      return true;
    }
    case 'foxburn': {
      // A monster burning in fox fire: a lick of blue flame up its side as the burn bites.
      fxSprite(ctx, 'celfoxfire', x + ((f.seed ?? 0.5) - 0.5) * 16, y - 4, { t: p * 0.6, scale: 0.32, alpha: p > 0.6 ? (1 - p) / 0.4 : 1 });
      return true;
    }
    case 'foxtrap': {
      // A ring of fox fire burning on the ground ahead, flaring as the trap closes.
      const tx = x + (f.dir || 1) * 110;
      fxSprite(ctx, 'celfoxtrapring', tx, y + 4, { t: p * 1.4, scale: 0.7, alpha: Math.min(1, p * 6) * (p > 0.9 ? (1 - p) / 0.1 : 1) });
      return true;
    }
    case 'foxtrapburst': {
      fxSprite(ctx, 'celfoxhit', x, y - 10, { p, scale: 1.3 });
      groundRing(ctx, 'celringfox', x, y, p, 110);
      return true;
    }
    case 'foxdecoy': {
      // Fox Hop: the decoy of fox fire she leaves behind, bursting.
      fxSprite(ctx, 'celfoxhit', x, y - 10, { p, scale: 1 });
      groundRing(ctx, 'celringfox', x, y, p, 60);
      return true;
    }
    case 'foxnight': {
      // Nine-Tail Blaze: night falls, and nine fox-fire stars spin up over the monsters ahead.
      const a = Math.min(1, p * 5) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      ctx.save();
      ctx.globalAlpha = 0.38 * a;
      ctx.fillStyle = '#0c1440';
      wash(ctx);
      ctx.restore();
      const cx = x + (f.dir || 1) * 150;
      for (let k = 0; k < 9; k++) {
        const ang = (k / 9) * Math.PI * 2 + p * 9;
        const rr = 60 * Math.min(1, p * 3);
        fxSprite(ctx, 'celfoxfire', cx + Math.cos(ang) * rr, y - 130 + Math.sin(ang) * rr * 0.5, { t: time + k * 0.1, scale: 0.35, alpha: a });
      }
      return true;
    }
    case 'flamefoxpounce': {
      // The last blow: the giant fox of blue fire pounces through the line, a ring of fox fire
      // racing out.
      const r = f.r ?? 220;
      fxSprite(ctx, 'celflamefoxbig', x + (f.dir || 1) * 30, y + 10, { p, flip, scale: r / 300 });
      groundRing(ctx, 'celringfox', x, y, p, r);
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
