// The warrior paths' effects (and the skill power-ups and buff casts every class shares), in
// Tengu's own effect art (tools/fx-art.js, the `cel*` strips): soft pastel shapes matched to the
// sprites' pixel size and outlines, each a short run of key drawings that pops in, holds, then
// breaks up into beads and sparkles (docs/art/README.md). The Warrior is steel blue and white, the
// Paladin gold, the Berserker rose red (and the Archer's buffs warm gold and sky blue).
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';

const SCHOOLS = new Set(['holy', 'rage', 'arcane', 'ice', 'fire', 'wind', 'poison', 'lightning', 'shadow', 'hawk']);
const tint = (school) => (SCHOOLS.has(school) ? school : school === 'gold' ? 'holy' : school === 'focus' ? 'ice' : '');
// A ring of force and a pillar of light in a school's colour (steel is the plain one).
export const ringOf = (school) => `celring${tint(school)}`;
export const pillarSprite = (school) => `celpillar${tint(school)}`;
// The emblem rising in a path's pillar.
const EMBLEMS = { holy: 'celembholy', rage: 'celembrage', steel: 'celembsteel', hawk: 'celembhawk' };

// Pixel art keeps its pixel size: effects that play large have big versions drawn large (`*big`
// strips), so scales stay near 1.
const BIG = new Set(['celring', 'celringholy', 'celringrage', 'celringwind', 'celringsight', 'celringhawk']);

// A ring of force racing out flat along the ground to radius `r`.
export function groundRing(ctx, name, x, y, p, r, { sy = 0.32 } = {}) {
  if (r > 60 && BIG.has(name)) fxSprite(ctx, `${name}big`, x, y, { p, scale: r / (38 * 2.6), sy });
  else fxSprite(ctx, name, x, y, { p, scale: r / 38, sy });
}

// A pillar of light bursting up out of the ground at (x, y), about `h` tall.
export function lightPillar(ctx, name, x, y, p, h = 100) {
  fxSprite(ctx, name, x, y, { p, scale: h / 103 });
}

// A buff or power going up, as MapleStory draws it: a pillar of the school's light from the feet,
// a ring racing out along the ground, the path's emblem rising inside.
export function pillarOf(ctx, school, x, y, p, { h = 90 } = {}) {
  groundRing(ctx, ringOf(school), x, y, Math.min(1, p * 1.3), 40);
  lightPillar(ctx, pillarSprite(school), x, y, p, h);
  const emblem = EMBLEMS[school];
  if (emblem && p > 0.15) fxSprite(ctx, emblem, x, y - 44 - 14 * Math.min(1, p * 2), { p: (p - 0.15) / 0.85, scale: 0.55 });
}

// Dust and rock thrust up where a heavy blow meets the ground, about `w` wide.
export function debris(ctx, x, y, p, w) {
  if (w > 120) fxSprite(ctx, 'celquakebig', x, y, { p, scale: w / (88 * 1.8) });
  else fxSprite(ctx, 'celquake', x, y, { p, scale: w / 88 });
}

// A hit landing on a monster in a path's colour: the Warrior's cross of blades, the Paladin's
// star of light, the Berserker's claw marks, a burst for anyone else.
export function hitMark(ctx, school, x, y, p, { big = false, seed = 0.5, dir = 1 } = {}) {
  const k = big ? 1.15 : 0.85;
  if (school === 'holy') fxSprite(ctx, 'celholyhit', x, y, { p, scale: k });
  else if (school === 'rage') fxSprite(ctx, 'celclaw', x, y, { p, scale: k, flip: dir < 0 });
  else fxSprite(ctx, 'celcross', x, y, { p, scale: k, rot: (seed - 0.5) * 0.8 });
}

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const seed = f.seed ?? 0.5;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    case 'powerup': {
      // Power bursting out as a skill begins: a pillar of the path's light with its emblem, and a
      // ring of fire for rage.
      pillarOf(ctx, f.school, x, y, p, { h: f.big ? 110 : 85 });
      if (f.school === 'rage') fxSprite(ctx, 'celragefire', x, y, { t: time, scale: f.big ? 0.8 : 0.6, alpha: p < 0.8 ? 1 : (1 - p) / 0.2 });
      return true;
    }
    case 'chargetrail': {
      // A dash: speed streaks along the path, dust kicked up behind, a burst where it ends.
      const tx = f.tx - cam.x;
      const len = Math.abs(tx - x);
      fxSprite(ctx, f.school === 'rage' ? 'celstreakred' : 'celstreak', (x + tx) / 2, y - 18, { p, flip, sx: len / 100 });
      fxSprite(ctx, 'celdust', x, y, { p, flip: !flip, scale: 0.8 });
      fxSprite(ctx, f.school === 'rage' ? 'celhitred' : 'celhit', tx + dir * 10, y - 22, { p, scale: 0.8 });
      return true;
    }
    case 'vortex': {
      // A whirlwind of blades over the area: spin slashes turning through it, stacked up.
      if (!box) return true;
      const cx = box.x + box.w / 2;
      const name = f.school === 'rage' ? 'celspinredbig' : 'celspinbig';
      for (let i = 0; i < 3; i++) fxSprite(ctx, name, cx, box.y + box.h - 10 - i * 20, { t: time * (1 + i * 0.3) + i * 0.2, scale: (box.w / 164) * (1 - i * 0.12), sy: 0.35, flip: i % 2 === 1 });
      return true;
    }
    case 'pillar': {
      // A pillar of light on the monster, a star of light bursting in it.
      lightPillar(ctx, 'celpillarholy', x, y, p, 120);
      fxSprite(ctx, 'celholyhit', x, y - 26, { p: Math.min(1, p * 1.4), scale: 0.8 });
      return true;
    }
    case 'aegis': {
      // A shield of light snapping up in front of the shove, then shattering into hexes.
      fxSprite(ctx, 'celshield', x + dir * 20, y - 28, { p, scale: 0.75, sx: 0.7 });
      return true;
    }
    case 'consecrate': {
      // Hallowed ground: the golden magic circle on the floor, a ring racing out, pillars of light
      // at its edges and diamonds of light rising.
      const r = f.r ?? 110;
      const a = (p < 0.1 ? p / 0.1 : 1) * (p > 0.75 ? (1 - p) / 0.25 : 1);
      fxSprite(ctx, 'celcirclebig', x, y, { frame: 0, scale: r / 105, sy: 0.3, alpha: a });
      groundRing(ctx, 'celringholy', x, y, p, r);
      for (const sd of [-1, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * 0.55, y, Math.min(1, p * 1.2), 90);
      fxSprite(ctx, 'celmotes', x, y, { t: time, scale: r / 60, alpha: a });
      return true;
    }
    case 'verdict': {
      // Grand Verdict: a great sword of light drives down out of the sky into the ground and
      // shatters, a cross of light bursts where it lands, over the blazing magic circle, with
      // pillars of light in a wide ring and a ring racing out.
      const r = f.r ?? 170;
      const a = (p < 0.08 ? p / 0.08 : 1) * (p > 0.75 ? (1 - p) / 0.25 : 1);
      fxSprite(ctx, 'celcirclebig', x, y, { frame: 0, scale: r / 105, sy: 0.3, alpha: a });
      groundRing(ctx, 'celringholy', x, y, p, r * 1.1);
      for (const sd of [-1, -0.5, 0.5, 1]) lightPillar(ctx, 'celpillarholy', x + sd * r * 0.6, y, Math.min(1, p * 1.1 + Math.abs(sd) * 0.08), 110);
      const fall = Math.min(1, p / 0.12);
      fxSprite(ctx, 'celsword', x, y + 4 - 160 * (1 - fall * fall), { p: p < 0.3 ? 0 : (p - 0.3) / 0.7, scale: 0.8 });
      if (p > 0.1) fxSprite(ctx, 'cellightcross', x, y - 40, { p: (p - 0.1) / 0.9, scale: 1.1 });
      return true;
    }
    case 'titanrise': {
      // Titan Breaker's leap: steel light bursting up from the ground he leaps from, and a giant
      // sword of steel flying together out of shards high over him, held there until he crashes
      // down (the crash, 'titanbreak', drives it into the ground).
      groundRing(ctx, 'celring', x, y, Math.min(1, p * 1.6), 70);
      if (p < 0.5) lightPillar(ctx, 'celpillar', x, y, p * 2, 120);
      const form = Math.min(1, p / 0.35);
      if (p < 0.66) fxSprite(ctx, 'celswordform', x, y - 92, { frame: Math.min(4, Math.floor(form * 4.99)), scale: 1, alpha: p > 0.6 ? (0.66 - p) / 0.06 : 1 });
      return true;
    }
    case 'titanbreak': {
      // The crash: the steel sword drives down into the ground and shatters, a cross of steel light
      // bursts where it lands, and the ground splits open wide with blades of light bursting up
      // out of it, a ring racing out.
      const r = f.r ?? 170;
      const fall = Math.min(1, p / 0.1);
      fxSprite(ctx, 'celsteelsword', x, y + 6 - 120 * (1 - fall * fall), { p: p < 0.25 ? 0 : (p - 0.25) / 0.75, scale: 1.05 });
      fxSprite(ctx, 'celfissurebig', x, y, { p, scale: r / 230 });
      debris(ctx, x, y, p, r * 0.8);
      if (p > 0.06) fxSprite(ctx, 'celsteelcross', x, y - 44, { p: (p - 0.06) / 0.94, scale: 1.1 });
      groundRing(ctx, 'celring', x, y, p, r * 1.1);
      return true;
    }
    case 'titanwave': {
      // The aftershock: rings of steel racing out along the ground, dust thrown both ways.
      const r = f.r ?? 180;
      groundRing(ctx, 'celring', x, y, p, r);
      groundRing(ctx, 'celring', x, y, Math.min(1, p * 1.5), r * 0.6);
      for (const sd of [-1, 1]) fxSprite(ctx, 'celdust', x + sd * r * 0.35, y + 2, { p, flip: sd < 0, scale: 1 });
      return true;
    }
    case 'bloodmoon': {
      // The Berserker's moon: a crimson eclipse swelling in the sky behind the axe.
      const s = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      fxSprite(ctx, 'celeclipse', x - dir * 8, y - 130, { t: time, scale: 1.1 * s, alpha: s });
      return true;
    }
    case 'eclipse': {
      // The crash under the moon: claw marks torn huge across the ground, the ground thrust up,
      // fire bursting and a rose-red ring racing out.
      const r = f.r ?? 175;
      fxSprite(ctx, 'celclawbig', x, y - 40, { p, scale: 0.95, flip });
      debris(ctx, x, y, p, r * 0.9);
      fxSprite(ctx, 'celragefire', x, y, { t: time, scale: 1, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      groundRing(ctx, 'celringrage', x, y, p, r);
      return true;
    }
    case 'gather': {
      // Power gathering at the weapon hand before a big blow: lines of the path's light rushing
      // in to a swelling diamond.
      if (f.school === 'focus') return false;
      const name = f.school === 'holy' ? 'celchargegold' : f.school === 'rage' ? 'celchargered' : 'celcharge';
      fxSprite(ctx, name, x + dir * 12, y - 20, { t: time, scale: f.big ? 0.9 : 0.7, alpha: p < 0.15 ? p / 0.15 : 1 });
      return true;
    }
    case 'ragehit': {
      // A Berserker's blow: claw marks torn across the target, drops flying on the heavy ones.
      const cy = y - (f.h ?? 24) / 2;
      hitMark(ctx, 'rage', x, cy, p, { big: f.big, seed, dir });
      if (f.big) fxSprite(ctx, 'celblood', x + dir * 6, cy, { p, scale: 0.8, flip });
      return true;
    }
    case 'holyhit': {
      // A Paladin's blow: a star of light bursting on the target.
      hitMark(ctx, 'holy', x, y - (f.h ?? 24) / 2, p, { big: f.big, seed, dir });
      return true;
    }
    case 'rageburst': {
      // Rage breaks out of the blow: fire bursting up, a rose-red ring racing out.
      const r = Math.min(150, Math.max(70, f.r ?? 90));
      fxSprite(ctx, 'celragefire', x, y, { t: time, scale: r / 90, alpha: p < 0.7 ? 1 : (1 - p) / 0.3 });
      groundRing(ctx, 'celringrage', x, y, p, r);
      return true;
    }
    case 'quake': {
      // The ground ruptures: rock thrust up along the area (or under the monster) with dust.
      if (box) {
        const n = Math.max(1, Math.round(box.w / 90));
        for (let i = 0; i < n; i++) debris(ctx, box.x + ((i + 0.5) / n) * box.w, box.y + box.h, Math.min(1, p * 1.1 + i * 0.04), Math.min(110, box.w / n));
        return true;
      }
      debris(ctx, x, y, p, 70);
      return true;
    }
    default:
      return false;
  }
}
