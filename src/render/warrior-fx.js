// The warrior paths' effects (and the skill power-ups every class shares), built from hand-drawn
// effect sprites (fx-sprites.js; packs and credits in assets/fx/), not drawn shapes (CLAUDE.md).
// The Paladin's light: a golden burst with a column of light, an octagonal shield, light shooting
// up out of the ground, golden rings. The Berserker's rage: jets of fire, a ring of flame, a
// blood-red vortex for his moon, blood. The warrior's steel: spinning blades, rings of force, the
// ground rupturing under heavy blows.
//
// Drawn from progress `p` (0-1) and a seed; (x, y) is a monster's feet for per-target effects and
// the hero's feet otherwise. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';

// A ring of force in a school's colour (a skill's power-up, a buff, a roar).
const RINGS = { steel: 'steelring', holy: 'goldring', rage: 'redring', wind: 'windring', arcane: 'arcanering', ice: 'icering', fire: 'firering', poison: 'poisonring', lightning: 'goldring', shadow: 'shadowring', focus: 'icering', gold: 'goldring' };
export const ringOf = (school) => RINGS[school] ?? 'steelring';

export function drawWarriorFx(ctx, f, x, y, p, cam, time) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    case 'powerup': {
      // A burst of power from the feet: a ring of the skill's school bursting out (holy adds a
      // column of light, rage a ring of flame).
      fxSprite(ctx, ringOf(f.school), x, y, { p, scale: f.big ? 2.2 : 1.5 });
      if (f.school === 'holy') fxSprite(ctx, 'holyburst', x, y + 4, { p, scale: f.big ? 1.6 : 1.2 });
      if (f.school === 'rage') fxSprite(ctx, 'ragering', x, y - 20, { p, scale: f.big ? 1.6 : 1.2 });
      return true;
    }
    case 'chargetrail': {
      // A dash: dust kicked up along the path and a steel jet bursting ahead of it.
      const tx = f.tx - cam.x;
      const n = Math.max(2, Math.round(Math.abs(tx - x) / 40));
      for (let i = 0; i < n; i++) {
        const k = i / n;
        fxSprite(ctx, 'dust', x + (tx - x) * k, y + 2, { p: Math.min(1, p + k * 0.3), flip: !flip, scale: 1 });
      }
      fxSprite(ctx, f.school === 'rage' ? 'ragejet' : 'thrust', tx + dir * 10, y - 22, { p, flip, scale: 1.4 });
      return true;
    }
    case 'vortex': {
      // A whirlwind of blades over the area: rings of spinning steel stacked up through it.
      if (!box) return true;
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const a = p > 0.8 ? (1 - p) / 0.2 : 1;
      for (let i = 0; i < 3; i++) fxSprite(ctx, f.school === 'rage' ? 'firespin' : 'steelspin', cx, cy + 14 - i * 16, { t: time * (1.2 + i * 0.3) + i * 0.4, scale: (box.w / 40) * (1 - i * 0.18), sy: 0.4, alpha: a });
      fxSprite(ctx, 'dust', cx, box.y + box.h, { p, scale: box.w / 60 });
      return true;
    }
    case 'pillar': {
      // A pillar of light on the monster: light shooting up out of the ground under it and a
      // golden burst with its column.
      fxSprite(ctx, 'holypillar', x, y + 2, { p, scale: 1.5 });
      fxSprite(ctx, 'holyburst', x, y + 6, { p, scale: 1.6 });
      return true;
    }
    case 'aegis': {
      // A shield of light: the octagonal shield snapping up in front of the shove.
      fxSprite(ctx, 'holyshield', x + dir * 8, y - 22, { p, flip, scale: 1.1 });
      return true;
    }
    case 'consecrate': {
      // Hallowed ground: golden rings racing out over the floor, a burst of light where the blade
      // goes in, and light shooting up around it.
      const R = (f.r ?? 110) / 45;
      fxSprite(ctx, 'holyring', x, y, { p: Math.min(1, p * 1.3), scale: Math.min(2, R) });
      fxSprite(ctx, 'holyburst', x, y + 6, { p, scale: 1.5 });
      for (const sd of [-1, 1]) fxSprite(ctx, 'holypillar', x + sd * (f.r ?? 110) * 0.5, y + 2, { p: Math.min(1, p * 1.2), scale: 1.1 });
      return true;
    }
    case 'verdict': {
      // Grand Verdict's blow: a great burst of light with its column, light shooting up in a
      // wide ring, a golden ring racing out across the floor.
      const R = (f.r ?? 170) / 45;
      fxSprite(ctx, 'holyburst', x, y + 8, { p, scale: 2.2 });
      fxSprite(ctx, 'holyring', x, y, { p: Math.min(1, p * 1.4), scale: Math.min(2.2, R) });
      for (const sd of [-1, -0.5, 0.5, 1]) fxSprite(ctx, 'holypillar', x + sd * (f.r ?? 170) * 0.6, y + 2, { p: Math.min(1, p * 1.1 + Math.abs(sd) * 0.15), scale: 1.3 });
      return true;
    }
    case 'bloodmoon': {
      // The Berserker's moon: a blood-red vortex swelling in the sky behind the axe.
      const s = Math.min(1, p * 3) * (p > 0.85 ? (1 - p) / 0.15 : 1);
      fxSprite(ctx, 'bloodmoon', x - dir * 8, y - 120, { t: time, scale: 2.4 * s, alpha: s });
      return true;
    }
    case 'eclipse': {
      // The crash under the red moon: the ground ruptures, a ring of flame and blood
      // burst over it, a red ring races out.
      const R = (f.r ?? 175) / 45;
      for (const sd of [-0.5, 0.5]) fxSprite(ctx, 'quake', x + sd * (f.r ?? 175) * 0.6, y + 6, { p: Math.min(1, p * 1.1), scale: 1.8 });
      fxSprite(ctx, 'redring', x, y, { p, scale: Math.min(2.2, R) });
      fxSprite(ctx, 'ragering', x, y - 22, { p, scale: 1.8 });
      fxSprite(ctx, 'blood', x, y + 4, { p, scale: 1.5 });
      return true;
    }
    case 'gather': {
      // Power gathering at the weapon hand before a big blow: the charging core in the path's
      // colour, closing in until the blow lands.
      if (f.school === 'focus') return false;
      fxSprite(ctx, f.school === 'holy' ? 'holycharge' : f.school === 'rage' ? 'ragecharge' : 'holycharge', x + dir * 12, y - 20, { p, scale: f.big ? 1.2 : 0.9 });
      return true;
    }
    case 'ragehit': {
      // A Berserker's blow: a jet of fire torn through the target the way the blow went, and
      // blood on the heavy ones.
      const cy = y - (f.h ?? 24) / 2;
      fxSprite(ctx, 'ragejet', x - dir * 10, cy + 6, { p, flip, scale: f.big ? 1.5 : 1.1 });
      if (f.big) fxSprite(ctx, 'blood', x, cy + 18, { p, scale: 1.2 });
      return true;
    }
    case 'holyhit': {
      // A Paladin's blow: a golden burst of light with its column on the target.
      fxSprite(ctx, 'holyburst', x, y + 4, { p, scale: f.big ? 1.3 : 0.95 });
      return true;
    }
    case 'rageburst': {
      // Rage breaks out of the blow: a ring of flame and a red ring.
      const R = Math.min(1.8, Math.max(1.2, (f.r ?? 90) / 60));
      fxSprite(ctx, 'ragering', x, y - 20, { p, scale: R });
      fxSprite(ctx, 'redring', x, y, { p, scale: R * 1.1 });
      return true;
    }
    case 'quake': {
      // The ground ruptures: rock spikes bursting up along the area (or under the monster), and
      // dust thrown out.
      if (box) {
        const n = Math.max(1, Math.round(box.w / 80));
        for (let i = 0; i < n; i++) {
          const qx = box.x + ((i + 0.5) / n) * box.w;
          fxSprite(ctx, 'quake', qx, box.y + box.h + 6, { p: Math.min(1, p * 1.1 + i * 0.04), scale: 1.8 });
        }
        fxSprite(ctx, 'dust', box.x + box.w / 2, box.y + box.h, { p, scale: box.w / 50 });
        return true;
      }
      fxSprite(ctx, 'quake', x, y + 6, { p, scale: 1.4 });
      return true;
    }
    default:
      return false;
  }
}
