// A life skill's level up (core/life.js), in Tengu's own effect art and the job-neutral mint of
// life skills: a mint ring blooms out along the ground, two leaf wisps spiral up round the hero
// with a drift of motes, and the skill's own picture (a rod, a clover, a lump of ore, a dish) pops
// up over their head with a little overshoot, bobs, and floats off as it fades.
//
// Drawn from progress `p` (0-1) at (x, y), the hero's feet. Returns false for kinds it doesn't draw.

import { fxSprite } from './fx-sprites.js';
import { groundRing } from './warrior-fx.js';
import { drawItemIcon } from './icons.js';
import { ITEMS } from '../data/items.js';
import { easeOut } from './fxkit.js';

// The picture for each skill (the first one that exists).
export const LIFE_ICON = {
  fishing: ['fishing_rod'],
  gathering: ['clover'],
  mining: ['copper_ore'],
  cooking: ['dish_clovertea', 'dish_grilled'],
  crafting: ['rose_quartz', 'copper_ore'],
};
export const lifeIcon = (skill) => (LIFE_ICON[skill] ?? []).find((id) => ITEMS[id]) ?? null;

const smooth = (a, b, v) => {
  const k = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
const backOut = (k) => 1 + 2.4 * (k - 1) ** 3 + 1.4 * (k - 1) ** 2;

export function drawLifeFx(ctx, f, x, y, p) {
  if (f.kind !== 'lifelevel') return false;
  const t = f.t;
  // The ring: out along the ground in the first half.
  groundRing(ctx, 'celringmint', x, y, Math.min(1, p * 1.8), 64);
  // Leaf wisps spiralling up either side, easing out as they climb.
  const rise = easeOut(Math.min(1, t / 1.1));
  const fade = 1 - smooth(0.65, 1, p);
  for (const side of [-1, 1]) {
    const a = t * 7 + (side < 0 ? Math.PI : 0);
    fxSprite(ctx, 'celleafwisp', x + Math.cos(a) * 16 * (1 - rise * 0.4), y - 8 - rise * 56 + Math.sin(a) * 3, { t: t + (side < 0 ? 0.3 : 0), scale: 0.6, alpha: fade });
  }
  fxSprite(ctx, 'celmotes', x, y + 2, { t, scale: 0.55, alpha: fade * smooth(0, 0.12, t) });
  // The skill's picture over the head.
  const id = lifeIcon(f.skill);
  if (id) {
    const pop = backOut(smooth(0.12, 0.42, t));
    if (pop > 0.01) {
      const s = 1.4 * pop;
      const lift = 62 + Math.sin(t * 5) * 1.5 + smooth(0.7, 1, p) * 10;
      ctx.save();
      ctx.globalAlpha *= fade;
      drawItemIcon(ctx, id, x - 8 * s, y - lift - 8 * s, s);
      ctx.restore();
    }
  }
  return true;
}
