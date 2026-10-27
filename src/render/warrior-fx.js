// The warrior paths' effects (and the skill power-ups every class shares), built from smooth HD
// effect art (fx-sprites.js; packs and credits in assets/fx/), never pixel effects or drawn
// shapes (CLAUDE.md). Rendered flipbooks (hit flashes, blood, fire, smoke, blasts) play as they
// are; light textures (flares, rays, rings, beams, sigils, twirls) are moved, turned, grown and
// faded here, the way a particle system plays them.
// The Paladin's light: gold flares and rays, columns of light, a sigil shield, a magic circle on
// the ground. The Berserker's rage: real fire, blood bursts, a blood-red vortex for his moon. The
// warrior's steel: steel-blue light, whirling twirls, dust and debris thrown up by heavy blows.
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite, fxPulse } from './fx-sprites.js';

// A ring of light in a school's colour (a skill's power-up, a buff, a roar).
const RINGS = { steel: 'hdring', holy: 'hdringgold', rage: 'hdringred', wind: 'hdringwind', arcane: 'hdringarcane', ice: 'hdringice', fire: 'hdringfire', poison: 'hdringpoison', lightning: 'hdringgold', shadow: 'hdringshadow', focus: 'hdringice', gold: 'hdringgold' };
export const ringOf = (school) => RINGS[school] ?? 'hdring';
// The flare and rays at the heart of a burst, by school.
const FLARES = { holy: 'hdflaregold', gold: 'hdflaregold', lightning: 'hdflaregold', rage: 'hdflarered', fire: 'hdflarered', steel: 'hdflaresteel', ice: 'hdflaresteel', focus: 'hdflaresteel' };
export const flareOf = (school) => FLARES[school] ?? 'hdflare';
const RAYS = { holy: 'hdraysgold', gold: 'hdraysgold', lightning: 'hdraysgold', rage: 'hdraysred', fire: 'hdraysred', steel: 'hdrayssteel', ice: 'hdrayssteel', focus: 'hdrayssteel' };
export const raysOf = (school) => RAYS[school] ?? 'hdrays';

// A ring of light racing out flat along the ground to radius `r`.
export function groundRing(ctx, name, x, y, p, r, { alpha = 1, sy = 0.32 } = {}) {
  fxPulse(ctx, name, x, y, p, { from: (r / 37) * 0.25, to: r / 37, sy, hold: 0.2, alpha });
}

// A burst of light: a flare at the heart and rays spinning out around it.
export function lightBurst(ctx, school, x, y, p, size = 1, seed = 0) {
  fxPulse(ctx, raysOf(school), x, y, p, { from: size * 0.4, to: size * 1.1, rot: seed * 6 + p * 0.6, hold: 0.15 });
  fxPulse(ctx, flareOf(school), x, y, p, { from: size * 0.9, to: size * 0.5, hold: 0.1, fadeIn: 0.02 });
}

// A column of light standing on the ground at (x, y), `h` tall.
export function column(ctx, name, x, y, p, h, w = 1) {
  const grow = Math.min(1, p / 0.18);
  const a = p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5;
  const sy = (h / 110) * grow;
  fxSprite(ctx, name, x, y - 55 * sy, { frame: 0, sx: w * (1 - 0.4 * p), sy, alpha: a });
}

// Dust and clods of earth thrown up where a heavy blow meets the ground, `w` wide.
export function debris(ctx, x, y, p, w, seed = 0) {
  fxSprite(ctx, 'hddust', x, y - 18 * (w / 80), { p, scale: (w / 80) * 1.1, sy: 0.75 });
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const d = (0.3 + ((seed * 7 + i * 0.37) % 1) * 0.5) * w * 0.5;
    const up = 40 + i * 12;
    fxSprite(ctx, 'hddirt', x + side * d * p, y - up * p + 90 * p * p, { frame: 0, scale: 0.28 + i * 0.05, rot: i + p * 4 * side, alpha: 1 - p });
  }
}

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const seed = f.seed ?? 0.5;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    case 'powerup': {
      // Power bursting out from the feet: a ring of the skill's school racing out over the floor
      // and a burst of its light at the chest (holy adds a column of light, rage fire).
      const big = f.big ? 1.3 : 1;
      groundRing(ctx, ringOf(f.school), x, y, p, 60 * big);
      lightBurst(ctx, f.school, x, y - 22, p, 0.8 * big, seed);
      if (f.school === 'holy') column(ctx, 'hdbeam', x, y, p, 130 * big, 1.1);
      if (f.school === 'rage') fxSprite(ctx, 'hdfire', x, y - 22, { p, scale: 0.75 * big });
      return true;
    }
    case 'chargetrail': {
      // A dash: streaks of light along the path, dust kicked up behind, a flare ahead.
      const tx = f.tx - cam.x;
      const len = Math.abs(tx - x);
      const a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
      const cx = (x + tx) / 2;
      const streak = f.school === 'rage' ? 'hdbeamred' : 'hdstreak';
      for (const [dy, k] of [[-30, 1], [-18, 0.7], [-8, 0.85]]) fxSprite(ctx, streak, cx, y + dy, { frame: 0, rot: Math.PI / 2, sx: 0.5 * k, sy: (len / 100) * k, alpha: a * k });
      fxSprite(ctx, 'hddust', x, y - 14, { p, scale: 0.8, sy: 0.7 });
      fxPulse(ctx, f.school === 'rage' ? 'hdflarered' : 'hdflaresteel', tx + dir * 10, y - 24, p, { from: 0.9, to: 0.4 });
      return true;
    }
    case 'vortex': {
      // A whirlwind of blades over the area: twirls of steel light spinning, stacked up through it.
      if (!box) return true;
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const a = (p < 0.1 ? p / 0.1 : 1) * (p > 0.8 ? (1 - p) / 0.2 : 1);
      for (let i = 0; i < 3; i++) fxSprite(ctx, f.school === 'rage' ? 'hdtwirlred' : 'hdtwirl', cx, cy + 16 - i * 18, { frame: 0, rot: time * (9 + i * 3) * (i % 2 ? -1 : 1), scale: (box.w / 95) * (1 - i * 0.15), sy: 0.35, alpha: a * 0.9 });
      fxSprite(ctx, 'hdsmoke', cx, box.y + box.h - 14, { p, scale: box.w / 110, sy: 0.6, alpha: 0.6 });
      return true;
    }
    case 'pillar': {
      // A pillar of light on the monster: a column of light shooting up out of the ground, a
      // golden ring at its foot and a flash of light.
      column(ctx, 'hdbeam', x, y, p, 170, 1.4);
      groundRing(ctx, 'hdringgold', x, y, p, 34);
      fxPulse(ctx, 'hdflaregold', x, y - 20, p, { from: 1.1, to: 0.5 });
      fxSprite(ctx, 'hdholyhit', x, y - 26, { p: Math.min(1, p * 1.6), scale: 0.6 });
      return true;
    }
    case 'aegis': {
      // A shield of light: a golden sigil snapping up in front of the shove, a flare at its heart.
      const s = p < 0.15 ? 0.6 + (p / 0.15) * 0.5 : 1.1 - 0.1 * p;
      const a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
      fxSprite(ctx, 'hdsigil', x + dir * 16, y - 26, { frame: 0, scale: s * 0.62, sx: 0.55, rot: p * 0.4, alpha: a });
      fxPulse(ctx, 'hdflaregold', x + dir * 14, y - 26, p, { from: 0.9, to: 0.5 });
      return true;
    }
    case 'consecrate': {
      // Hallowed ground: a golden magic circle on the floor, a ring of light racing out, columns
      // of light at its edges and light flaring where the blade goes in.
      const r = f.r ?? 110;
      const a = (p < 0.1 ? p / 0.1 : 1) * (p > 0.7 ? (1 - p) / 0.3 : 1);
      fxSprite(ctx, 'hdcircle', x, y, { frame: 0, scale: r / 47, sy: 0.28, alpha: a * 0.9 });
      groundRing(ctx, 'hdringgold', x, y, p, r);
      for (const sd of [-1, 1]) column(ctx, 'hdbeam', x + sd * r * 0.55, y, Math.min(1, p * 1.2), 120, 1);
      lightBurst(ctx, 'holy', x, y - 16, p, 1.1, seed);
      return true;
    }
    case 'verdict': {
      // Grand Verdict's blow: a great burst of light, a magic circle blazing on the floor, columns
      // of light in a wide ring and rings of light racing out across it.
      const r = f.r ?? 170;
      const a = (p < 0.08 ? p / 0.08 : 1) * (p > 0.7 ? (1 - p) / 0.3 : 1);
      fxSprite(ctx, 'hdcircle', x, y, { frame: 0, scale: r / 47, sy: 0.28, alpha: a });
      groundRing(ctx, 'hdringgold', x, y, p, r * 1.1);
      groundRing(ctx, 'hdring', x, y, Math.min(1, p * 1.4), r * 0.8, { alpha: 0.8 });
      for (const sd of [-1, -0.5, 0.5, 1]) column(ctx, 'hdbeam', x + sd * r * 0.6, y, Math.min(1, p * 1.1 + Math.abs(sd) * 0.08), 150, 1.2);
      column(ctx, 'hdbeam', x, y, p, 230, 2.4);
      lightBurst(ctx, 'holy', x, y - 30, p, 1.8, seed);
      return true;
    }
    case 'bloodmoon': {
      // The Berserker's moon: a blood-red vortex swelling in the sky behind the axe.
      const s = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      const mx = x - dir * 8;
      const my = y - 130;
      fxSprite(ctx, 'hdmoon', mx, my, { frame: 0, scale: 0.9 * s, alpha: s * 0.75 });
      fxSprite(ctx, 'hdtwirlred', mx, my, { frame: 0, rot: time * 3, scale: 1.4 * s, alpha: s });
      fxSprite(ctx, 'hdvortex', mx, my, { frame: 0, rot: time * 2.2 + 1, scale: 1.7 * s, alpha: s });
      fxSprite(ctx, 'hdtwirlred', mx, my, { frame: 0, rot: -time * 2 + 2, scale: 0.9 * s, alpha: s * 0.9 });
      return true;
    }
    case 'eclipse': {
      // The crash under the red moon: a blast of fire, blood bursting over it, the ground torn up
      // and a red ring racing out.
      const r = f.r ?? 175;
      fxSprite(ctx, 'hdexplode', x, y - 40, { p, scale: 1.3 });
      fxSprite(ctx, 'hdbloodx', x, y - 34, { p: Math.min(1, p * 1.5), scale: 1.2 });
      groundRing(ctx, 'hdringred', x, y, p, r);
      debris(ctx, x, y, p, r * 0.9, seed);
      fxPulse(ctx, 'hdraysred', x, y - 30, p, { from: 0.6, to: 1.6, rot: seed * 6, hold: 0.15 });
      return true;
    }
    case 'gather': {
      // Power gathering at the weapon hand before a big blow: rays of the path's light closing in
      // on a flare, until the blow lands.
      if (f.school === 'focus') return false;
      const school = f.school === 'holy' || f.school === 'rage' ? f.school : 'steel';
      const k = f.big ? 1.2 : 0.9;
      const a = p < 0.15 ? p / 0.15 : 1;
      fxSprite(ctx, raysOf(school), x + dir * 12, y - 20, { frame: 0, rot: -time * 3, scale: k * (1.1 - 0.8 * p), alpha: a });
      fxSprite(ctx, flareOf(school), x + dir * 12, y - 20, { frame: 0, scale: k * (0.4 + 0.4 * p), alpha: a });
      return true;
    }
    case 'ragehit': {
      // A Berserker's blow: a burst of blood torn through the target, more on the heavy ones.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'hdbloodstar', x, cy, { p, scale: f.big ? 0.95 : 0.7, rot: seed * 2 - 1 });
      if (f.big) fxSprite(ctx, 'hdblood', x + dir * 6, cy + 4, { p, scale: 0.9 });
      return true;
    }
    case 'holyhit': {
      // A Paladin's blow: a flash of gold light and a slim column of light on the target.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'hdholyhit', x, cy, { p, scale: f.big ? 0.8 : 0.6 });
      column(ctx, 'hdbeam', x, y, p, f.big ? 110 : 80, f.big ? 0.9 : 0.6);
      return true;
    }
    case 'rageburst': {
      // Rage breaks out of the blow: fire bursting up, a red ring racing out, red rays.
      const r = Math.min(150, Math.max(70, f.r ?? 90));
      fxSprite(ctx, 'hdfire', x, y - 30, { p, scale: r / 90 });
      groundRing(ctx, 'hdringred', x, y, p, r);
      fxPulse(ctx, 'hdraysred', x, y - 24, p, { from: 0.5, to: r / 80, rot: seed * 6, hold: 0.15 });
      return true;
    }
    case 'quake': {
      // The ground ruptures: dust blasting up along the area (or under the monster) with clods of
      // earth thrown out.
      if (box) {
        const n = Math.max(1, Math.round(box.w / 90));
        for (let i = 0; i < n; i++) debris(ctx, box.x + ((i + 0.5) / n) * box.w, box.y + box.h, Math.min(1, p * 1.1 + i * 0.04), Math.min(110, box.w / n), seed + i);
        return true;
      }
      debris(ctx, x, y, p, 70, seed);
      return true;
    }
    default:
      return false;
  }
}
