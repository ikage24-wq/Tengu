// The warrior paths' effects (and the skill power-ups every class shares), after MapleStory's
// warriors (docs/art/research/fx.md section 6): every hit lands on the monster as its own bright
// shape (an X of slashes, claw marks, a burst), big skills show one recognisable picture (a
// roaring lion, a winged sword of judgement, a demon's wings), buffs rise as a pillar of light
// with an emblem inside, and everything ends by breaking up into sparkles.
// Built from effect art only (fx-sprites.js; credits in assets/fx/): game-icons.net shapes made
// into glowing art at build time (`fxEmblem`), rendered flipbooks (hit flashes, blood, fire, dust,
// blasts) and light textures (beams, rings, rays, flares) moved, grown and faded here.
// The Warrior is steel blue, the Paladin gold, the Berserker blood red.
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite, fxPulse, fxEmblem } from './fx-sprites.js';

// A ring of light in a school's colour (a skill's power-up, a buff, a roar).
const RINGS = { steel: 'hdring', holy: 'hdringgold', rage: 'hdringred', wind: 'hdringwind', arcane: 'hdringarcane', ice: 'hdringice', fire: 'hdringfire', poison: 'hdringpoison', lightning: 'hdringgold', shadow: 'hdringshadow', focus: 'hdringice', gold: 'hdringgold' };
export const ringOf = (school) => RINGS[school] ?? 'hdring';
// The flare and rays at the heart of a burst, by school.
const FLARES = { holy: 'hdflaregold', gold: 'hdflaregold', lightning: 'hdflaregold', rage: 'hdflarered', fire: 'hdflarered', steel: 'hdflaresteel', ice: 'hdflaresteel', focus: 'hdflaresteel' };
export const flareOf = (school) => FLARES[school] ?? 'hdflare';
const RAYS = { holy: 'hdraysgold', gold: 'hdraysgold', lightning: 'hdraysgold', rage: 'hdraysred', fire: 'hdraysred', steel: 'hdrayssteel', ice: 'hdrayssteel', focus: 'hdrayssteel' };
export const raysOf = (school) => RAYS[school] ?? 'hdrays';
// A pillar of light (jellyfish0's painted pillar), by school.
const PILLARS = { holy: 'jpillar', gold: 'jpillar', lightning: 'jpillar', rage: 'jpillarred', fire: 'jpillarred' };
export const pillarSprite = (school) => PILLARS[school] ?? 'jpillarsteel';

// A painted pillar of light bursting up out of the ground at (x, y), about `h` tall, then
// breaking into motes.
export function lightPillar(ctx, name, x, y, p, h = 120, w = 0.55) {
  const k = h / 110;
  fxSprite(ctx, name, x, y - 55 * k, { p, scale: k, sx: w });
}
// A path's hit marks and burst.
const MARKS = { holy: ['gxgold', 'gburst'], rage: ['gxred', 'gburstred'] };
export const marksOf = (school) => MARKS[school] ?? ['gx', 'gburststeel'];

// A ring of light racing out flat along the ground to radius `r`.
export function groundRing(ctx, name, x, y, p, r, { alpha = 1, sy = 0.32 } = {}) {
  fxPulse(ctx, name, x, y, p, { from: (r / 37) * 0.25, to: r / 37, sy, hold: 0.2, alpha });
}

// A burst of light: a flare at the heart and rays spinning out around it.
export function lightBurst(ctx, school, x, y, p, size = 1, seed = 0) {
  fxPulse(ctx, raysOf(school), x, y, p, { from: size * 0.4, to: size * 1.1, rot: seed * 6 + p * 0.6, hold: 0.15 });
  fxPulse(ctx, flareOf(school), x, y, p, { from: size * 0.9, to: size * 0.5, hold: 0.1, fadeIn: 0.02 });
}

// A column of light standing on the ground at (x, y), `h` tall, shooting up and thinning out.
export function column(ctx, name, x, y, p, h, w = 1) {
  const grow = Math.min(1, p / 0.18);
  const a = p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5;
  const sy = (h / 110) * grow;
  fxSprite(ctx, name, x, y - 55 * sy, { frame: 0, sx: w * (1 - 0.4 * p), sy, alpha: a });
}

// A buff or power going up, as MapleStory draws it: a pillar of the school's light shooting up
// from the feet with the skill's emblem rising inside it, a ring racing out along the ground, and
// the emblem breaking up into sparkles at the end.
export function pillarOf(ctx, school, emblem, x, y, p, { h = 120, w = 0.5, scale = 0.5 } = {}) {
  lightPillar(ctx, pillarSprite(school), x, y, p, h, w);
  groundRing(ctx, ringOf(school), x, y, Math.min(1, p * 1.3), 46);
  if (emblem) fxEmblem(ctx, emblem, x, y - 34 - 16 * Math.min(1, p * 2), p, { scale, hold: 0.55 });
}

// Dust and clods of earth thrown up where a heavy blow meets the ground, `w` wide.
export function debris(ctx, x, y, p, w, seed = 0) {
  fxSprite(ctx, 'hddust', x, y - 12 * (w / 80), { p, scale: (w / 80) * 0.7, sy: 0.7, alpha: 0.85 });
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const d = (0.3 + ((seed * 7 + i * 0.37) % 1) * 0.5) * w * 0.5;
    const up = 40 + i * 12;
    fxSprite(ctx, 'hddirt', x + side * d * p, y - up * p + 90 * p * p, { frame: 0, scale: 0.28 + i * 0.05, rot: i + p * 4 * side, alpha: 1 - p });
  }
}

// A hit landing on a monster: the path's X of slashes struck across it (turned a little each
// time, so a combo never repeats), a flash behind it, and on heavy blows a burst too.
export function hitMark(ctx, school, x, y, p, { big = false, seed = 0.5, dir = 1 } = {}) {
  const [x0, burst] = marksOf(school);
  if (school === 'holy') fxSprite(ctx, 'jholy', x, y, { p, scale: big ? 0.7 : 0.5, flip: dir < 0 });
  else if (school === 'rage') fxSprite(ctx, 'hdbloodstar', x, y, { p, scale: big ? 0.75 : 0.55 });
  else fxSprite(ctx, 'jhitcyan', x, y, { p, scale: big ? 0.8 : 0.6 });
  fxEmblem(ctx, x0, x, y, p, { scale: big ? 0.8 : 0.6, rot: (seed - 0.5) * 1.4, flip: dir < 0, hold: 0.35, pop: 0.08 });
  if (big) fxEmblem(ctx, burst, x, y, p, { scale: 0.75, rot: seed * 3, hold: 0.25, pop: 0.06 });
}

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const seed = f.seed ?? 0.5;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    case 'powerup': {
      // Power bursting out as a skill begins: a pillar of the path's light with its emblem
      // (crossed swords, the holy symbol, a horned skull), and fire for rage.
      const emblem = { steel: 'gswords', holy: 'gholy', rage: 'gskull' }[f.school];
      pillarOf(ctx, f.school, emblem, x, y, p, { h: f.big ? 150 : 120, scale: f.big ? 0.55 : 0.45 });
      if (f.school === 'rage') fxSprite(ctx, 'hdfire', x, y - 22, { p, scale: f.big ? 0.9 : 0.7 });
      return true;
    }
    case 'chargetrail': {
      // A dash: streaks of light along the path, dust kicked up behind, a burst where it ends.
      const tx = f.tx - cam.x;
      const len = Math.abs(tx - x);
      const a = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
      const cx = (x + tx) / 2;
      const streak = f.school === 'rage' ? 'hdbeamred' : 'hdbeamsteel';
      for (const [dy, k] of [[-30, 1], [-18, 0.7], [-8, 0.85]]) fxSprite(ctx, streak, cx, y + dy, { frame: 0, rot: Math.PI / 2, sx: 0.45 * k, sy: (len / 100) * k, alpha: a * k });
      fxSprite(ctx, 'hddust', x, y - 14, { p, scale: 0.8, sy: 0.7 });
      fxEmblem(ctx, f.school === 'rage' ? 'gburstred' : 'gburststeel', tx + dir * 10, y - 24, p, { scale: 0.7, hold: 0.3 });
      return true;
    }
    case 'vortex': {
      // A whirlwind of blades over the area: a whirlwind of steel light spinning through it.
      if (!box) return true;
      const cx = box.x + box.w / 2;
      const a = (p < 0.1 ? p / 0.1 : 1) * (p > 0.8 ? (1 - p) / 0.2 : 1);
      for (let i = 0; i < 3; i++) fxSprite(ctx, f.school === 'rage' ? 'hdtwirlred' : 'hdtwirl', cx, box.y + box.h - 10 - i * 22, { frame: 0, rot: time * (9 + i * 3) * (i % 2 ? -1 : 1), scale: (box.w / 95) * (0.8 + i * 0.12), sy: 0.32, alpha: a * 0.9 });
      fxEmblem(ctx, 'gwhirl', cx, box.y + box.h - 44, p, { scale: Math.min(0.9, box.w / 150), hold: 0.7, flip });
      return true;
    }
    case 'pillar': {
      // A pillar of light on the monster, the holy symbol rising in it.
      pillarOf(ctx, 'holy', 'gholy', x, y, p, { h: 160, w: 0.55, scale: 0.4 });
      fxSprite(ctx, 'hdholyhit', x, y - 26, { p: Math.min(1, p * 1.6), scale: 0.6 });
      return true;
    }
    case 'aegis': {
      // A shield of light snapping up in front of the shove, then breaking into sparkles.
      fxSprite(ctx, 'jorb', x + dir * 18, y - 28, { t: time, scale: 0.5 * Math.min(1, p / 0.12), sx: 0.55, alpha: p < 0.6 ? 0.85 : 0.85 * (1 - (p - 0.6) / 0.4) });
      fxEmblem(ctx, 'gaegis', x + dir * 18, y - 28, p, { scale: 0.5, hold: 0.55, flip });
      return true;
    }
    case 'consecrate': {
      // Hallowed ground: a golden magic circle on the floor, the sun's emblem rising out of it,
      // columns of light at its edges and a ring racing out.
      const r = f.r ?? 110;
      const a = (p < 0.1 ? p / 0.1 : 1) * (p > 0.7 ? (1 - p) / 0.3 : 1);
      fxSprite(ctx, 'jcircle', x, y, { t: time, scale: r / 57, sy: 0.3, alpha: a });
      groundRing(ctx, 'hdringgold', x, y, p, r);
      for (const sd of [-1, 1]) lightPillar(ctx, 'jpillar', x + sd * r * 0.55, y, Math.min(1, p * 1.2), 110, 0.4);
      fxEmblem(ctx, 'gsun', x, y - 40 - 20 * Math.min(1, p * 2), p, { scale: 0.55, hold: 0.55 });
      return true;
    }
    case 'verdict': {
      // Grand Verdict, a sword of judgement: a great winged sword drives down out of the sky into
      // the ground, then wings of light spread behind it, columns of light rise in a wide ring and
      // rings race out over a blazing magic circle.
      const r = f.r ?? 170;
      const a = (p < 0.08 ? p / 0.08 : 1) * (p > 0.7 ? (1 - p) / 0.3 : 1);
      fxSprite(ctx, 'jcircle', x, y, { t: time, scale: r / 57, sy: 0.3, alpha: a });
      groundRing(ctx, 'hdringgold', x, y, p, r * 1.1);
      for (const sd of [-1, 1]) lightPillar(ctx, 'jpillar', x + sd * r * 0.62, y, Math.min(1, p * 1.1 + 0.05), 140, 0.4);
      fxEmblem(ctx, 'gwings', x, y - 70, Math.max(0, (p - 0.1) / 0.9), { scale: 1.0, hold: 0.5, alpha: 0.9 });
      const fall = Math.min(1, p / 0.12);
      fxEmblem(ctx, 'gverdict', x, y - 70 - 140 * (1 - fall * fall), p, { scale: 0.9, hold: 0.55, pop: 0.02 });
      if (p > 0.1) lightBurst(ctx, 'holy', x, y - 20, (p - 0.1) / 0.9, 1.1, seed);
      return true;
    }
    case 'bloodmoon': {
      // The Berserker's moon: a blood-red vortex swelling in the sky, a horned skull glaring out
      // of it.
      const s = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      const mx = x - dir * 8;
      const my = y - 130;
      fxSprite(ctx, 'hdmoon', mx, my, { frame: 0, scale: 0.9 * s, alpha: s * 0.75 });
      fxSprite(ctx, 'hdtwirlred', mx, my, { frame: 0, rot: time * 3, scale: 1.4 * s, alpha: s });
      fxSprite(ctx, 'hdvortex', mx, my, { frame: 0, rot: time * 2.2 + 1, scale: 1.7 * s, alpha: s });
      fxEmblem(ctx, 'gskull', mx, my, p, { scale: 0.5, hold: 0.8 });
      return true;
    }
    case 'eclipse': {
      // The crash under the red moon: demon wings flare up behind the blow, a blast of fire and a
      // red burst, the ground torn up and a red ring racing out.
      const r = f.r ?? 175;
      fxEmblem(ctx, 'gdemonwings', x, y - 70, p, { scale: 1.3, hold: 0.5 });
      fxSprite(ctx, 'hdexplode', x, y - 40, { p, scale: 1.2 });
      fxEmblem(ctx, 'gburstred', x, y - 34, p, { scale: 1.3, hold: 0.3 });
      groundRing(ctx, 'hdringred', x, y, p, r);
      debris(ctx, x, y, p, r * 0.9, seed);
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
      // A Berserker's blow: painted claw marks of blood torn across the target, blood spraying.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'jclaw', x, cy, { p, scale: f.big ? 0.85 : 0.65, rot: (seed - 0.5) * 0.8, flip });
      fxSprite(ctx, f.big ? 'hdblood' : 'hdbloodstar', x + dir * 6, cy + 4, { p, scale: f.big ? 0.9 : 0.6 });
      return true;
    }
    case 'holyhit': {
      // A Paladin's blow: a gold crescent of light bursting on the target, a cross of golden
      // slashes and a slim column of light.
      const cy = y - (f.h ?? 24) / 2;
      column(ctx, 'hdbeam', x, y, p, f.big ? 110 : 80, f.big ? 0.9 : 0.6);
      hitMark(ctx, 'holy', x, cy, p, { big: f.big, seed, dir });
      return true;
    }
    case 'rageburst': {
      // Rage breaks out of the blow: fire bursting up, a red burst, a red ring racing out.
      const r = Math.min(150, Math.max(70, f.r ?? 90));
      fxSprite(ctx, 'hdfire', x, y - 30, { p, scale: r / 90 });
      fxEmblem(ctx, 'gburstred', x, y - 30, p, { scale: r / 110, hold: 0.3 });
      groundRing(ctx, 'hdringred', x, y, p, r);
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
