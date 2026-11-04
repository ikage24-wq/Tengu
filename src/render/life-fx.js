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

// Working a spot together (world/coop-life.js), or a feast served: a small shared sparkle. A mint
// ring blooms out from the spot, a leaf wisp curls up for each one working it (two to four, round
// the spot), and motes drift off as it fades.
function drawTogether(ctx, f, x, y, p) {
  const t = f.t;
  const n = Math.max(2, Math.min(4, f.n ?? 2));
  groundRing(ctx, 'celringmint', x, y, Math.min(1, p * 2.2), 40);
  const rise = easeOut(Math.min(1, t / 0.9));
  const fade = 1 - smooth(0.6, 1, p);
  for (let i = 0; i < n; i++) {
    const a = t * 6 + (i / n) * Math.PI * 2;
    fxSprite(ctx, 'celleafwisp', x + Math.cos(a) * 12 * (1 - rise * 0.5), y - 6 - rise * 34 + Math.sin(a) * 2.5, { t: t + i * 0.2, scale: 0.42, alpha: fade });
  }
  fxSprite(ctx, 'celmotes', x, y - 8 - rise * 10, { t, scale: 0.42, alpha: fade * smooth(0, 0.15, t) });
  return true;
}

export function drawLifeFx(ctx, f, x, y, p) {
  // A Sweetheart pleased with you: little hearts float up and fade (ui/sweetheart.js).
  if (f.kind === 'hearts') {
    for (let i = 0; i < (f.n ?? 3); i++) {
      const k = Math.min(1, Math.max(0, p * 1.3 - i * 0.12));
      if (k <= 0 || k >= 1) continue;
      const hx = x + (i - ((f.n ?? 3) - 1) / 2) * 9 + Math.sin(k * 6 + i) * 3;
      const hy = y - k * 34;
      const r = 3.4 * (k < 0.2 ? k / 0.2 : 1);
      ctx.save();
      ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
      ctx.fillStyle = i % 2 ? '#ffb3cf' : '#ff6b9a';
      ctx.strokeStyle = '#c84a7a';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(hx, hy + r * 0.9);
      ctx.bezierCurveTo(hx - r * 1.2, hy, hx - r * 0.9, hy - r * 0.9, hx, hy - r * 0.25);
      ctx.bezierCurveTo(hx + r * 0.9, hy - r * 0.9, hx + r * 1.2, hy, hx, hy + r * 0.9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - r * 0.5, hy - r * 0.3, r * 0.35, r * 0.35);
      ctx.restore();
    }
    return true;
  }
  // Getting on or off a mount: a ring of pastel puffs and sparkles (world/mount.js).
  if (f.kind === 'mountpoof') {
    fxSprite(ctx, 'celmountpoof', x, y + 2, { p, scale: 0.42 });
    return true;
  }
  if (f.kind === 'together') return drawTogether(ctx, f, x, y, p);
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
