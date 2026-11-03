// The cooking window, opened at a town stove (data/cooking.js): the recipes you know, each with
// what it needs (what you have of each, in green when it's enough) and what it does, and a Cook
// button that serves the dish (SERVINGS of it) straight away.

import { DISHES, SERVINGS } from '../data/cooking.js';
import { countItem, removeItem, addItem } from '../core/inventory.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, text, box, button, hover, tooltip, fit } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { groundAt } from '../world/physics.js';
import { playLifePose } from '../world/lifepose.js';

const W = 320;
const H = 236;
const ROW = 34;

export const knownRecipes = (char) => DISHES.filter((d) => !d.learn || (char.recipes ?? []).includes(d.id));
const canCook = (char, d) => Object.entries(d.needs).every(([id, n]) => countItem(char.inventory, id) >= n);

// Cooks `d`: uses the ingredients, adds the servings. Returns how many, or 0.
export function cook(char, d) {
  if (!canCook(char, d)) return 0;
  for (const [id, n] of Object.entries(d.needs)) removeItem(char.inventory, id, n);
  addItem(char.inventory, d.id, SERVINGS);
  return SERVINGS;
}

export function cookingWindow(ui, state, world) {
  const win = state.windows.cook;
  // Walk away from the stove and the window closes.
  const st = world.map.stove;
  if (st == null || Math.abs(st - world.body.x) > 60 || Math.abs(groundAt(world.map, st) - world.body.y) > 10) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Cooking')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x = win.x + 8;
  let y = win.y + 26;
  const list = knownRecipes(char);
  const rows = Math.floor((H - 50) / ROW);
  if (hover(ui, x, y, W - 16, rows * ROW)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, list.length - rows));
  for (const d of list.slice(win.scroll, win.scroll + rows)) {
    const ok = canCook(char, d);
    box(ctx, x, y, W - 16, ROW - 3, { fill: ok ? '#fffaf0' : '#ffffff', edge: ok ? th.main : th.light, r: 8, width: 1 });
    drawItemIcon(ctx, d.id, x + 6, y + 7);
    text(ctx, fit(ctx, d.name, 130, 8, true), x + 28, y + 11, { size: 8, bold: true });
    text(ctx, fit(ctx, d.about, 130, 6.5, false), x + 28, y + 21, { size: 6.5, color: '#3f9f5f' });
    // What it needs: each ingredient's icon and have/need.
    let ix = x + 160;
    for (const [id, n] of Object.entries(d.needs)) {
      const have = countItem(char.inventory, id);
      drawItemIcon(ctx, id, ix, y + 4);
      text(ctx, `${Math.min(have, 99)}/${n}`, ix + 8, y + 27, { size: 6, bold: true, align: 'center', color: have >= n ? COLORS.good : COLORS.bad });
      if (hover(ui, ix, y + 4, 16, 16)) tooltip(ui, itemTooltip(char, id));
      ix += 22;
    }
    if (button(ui, x + W - 62, y + 7, 42, 16, 'Cook', { primary: ok, enabled: ok, size: 7.5 })) {
      const n = cook(char, d);
      // She stirs, tosses and tastes it at the stove (render/life-moves.js).
      if (n) playLifePose(world, 'cook', { at: st, find: d.id });
      world.log(n ? `You cooked ${n} ${d.name}${n > 1 ? 's' : ''}.` : 'Missing an ingredient!', n ? '#ffd6a0' : '#ffb3c6');
    }
    y += ROW;
  }
  const more = DISHES.length - list.length;
  text(ctx, more ? `${more} more recipe${more === 1 ? '' : 's'} to learn: catch new fish!` : 'You know every recipe!', win.x + 12, win.y + H - 10, { size: 7, color: COLORS.muted });
}
