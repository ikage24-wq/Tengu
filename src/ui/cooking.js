// The cooking window, opened at a town stove (data/cooking.js): the recipes you know, each with
// what it needs (what you have of each, in green when it's enough) and what it does, and a Cook
// button. Cooking is a stir: a spoon swings across the pot; stop it (Stop, or Z) in the middle for
// Perfect (three dishes), near it for Great (two), anywhere else for Good (one).

import { DISHES, QUALITY } from '../data/cooking.js';
import { countItem, removeItem, addItem } from '../core/inventory.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, text, box, button, hover, tooltip, fit } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { groundAt } from '../world/physics.js';

const W = 320;
const H = 236;
const ROW = 34;

export const knownRecipes = (char) => DISHES.filter((d) => !d.learn || (char.recipes ?? []).includes(d.id));
const canCook = (char, d) => Object.entries(d.needs).every(([id, n]) => countItem(char.inventory, id) >= n);

// How a stop at spoon position `u` (0..1) went: 2 Perfect, 1 Great, 0 Good.
export const stirQuality = (u) => (Math.abs(u - 0.5) < 0.07 ? 2 : Math.abs(u - 0.5) < 0.2 ? 1 : 0);

// Cooks `d` at quality `q`: uses the ingredients, adds the servings. Returns how many, or 0.
export function cook(char, d, q) {
  if (!canCook(char, d)) return 0;
  for (const [id, n] of Object.entries(d.needs)) removeItem(char.inventory, id, n);
  const n = QUALITY[q].servings;
  addItem(char.inventory, d.id, n);
  return n;
}

export function cookingWindow(ui, state, world) {
  const win = state.windows.cook;
  // Walk away from the stove and the window closes.
  const st = world.map.stove;
  if (st == null || Math.abs(st - world.body.x) > 60 || Math.abs(groundAt(world.map, st) - world.body.y) > 10) {
    win.open = false;
    win.stir = null;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Cooking')) {
    win.stir = null;
    return;
  }
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x = win.x + 8;
  let y = win.y + 26;
  if (win.stir) return stir(ui, win, world, x, y);
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
    if (button(ui, x + W - 62, y + 7, 42, 16, 'Cook', { primary: ok, enabled: ok, size: 7.5 })) win.stir = { dish: d.id, t: 0, stop: null };
    y += ROW;
  }
  const more = DISHES.length - list.length;
  text(ctx, more ? `${more} more recipe${more === 1 ? '' : 's'} to learn: catch new fish!` : 'You know every recipe!', win.x + 12, win.y + H - 10, { size: 7, color: COLORS.muted });
}

// The stir: the pot, the spoon swinging across the bar, the sweet spot in the middle.
function stir(ui, win, world, x, y) {
  const { ctx } = ui;
  const s = win.stir;
  const d = DISHES.find((o) => o.id === s.dish);
  s.t += 1 / 60;
  text(ctx, `Stirring ${d.name}...`, win.x + W / 2, y + 14, { size: 9, bold: true, align: 'center' });
  const bx = win.x + 30;
  const bw = W - 60;
  const by = y + 70;
  box(ctx, bx, by, bw, 18, { fill: '#f6eefb', edge: '#e2d3f0', r: 9 });
  box(ctx, bx + bw * 0.3, by, bw * 0.4, 18, { fill: '#d2f5e4', edge: null, r: 0 });
  box(ctx, bx + bw * 0.43, by, bw * 0.14, 18, { fill: '#ffe08a', edge: null, r: 0 });
  text(ctx, 'Perfect', bx + bw * 0.5, by + 30, { size: 7, bold: true, align: 'center', color: '#c99a1f' });
  // The spoon swings faster for the fancier dishes.
  const speed = 1 + Object.keys(d.needs).length * 0.25;
  const u = s.stop ?? 0.5 + 0.5 * Math.sin(s.t * Math.PI * speed);
  const sx = bx + bw * u;
  ctx.fillStyle = '#c99a6b';
  ctx.fillRect(sx - 2, by - 14, 4, 30);
  ctx.beginPath();
  ctx.ellipse(sx, by + 18, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (s.stop == null) {
    if (button(ui, win.x + W / 2 - 40, by + 44, 80, 20, 'Stop!', { primary: true, size: 9 }) || ui.input.pressed?.has('KeyZ') || ui.input.pressed?.has('Space')) {
      s.stop = u;
      s.q = stirQuality(u);
      const n = cook(world.char, d, s.q);
      world.log(n ? `${QUALITY[s.q].name}! You cooked ${n} ${d.name}${n > 1 ? 's' : ''}.` : 'Missing an ingredient!', n ? QUALITY[s.q].color : '#ffb3c6');
      s.until = s.t + 1.2;
    }
    return;
  }
  const q = QUALITY[s.q];
  text(ctx, `${q.name}! x${q.servings}`, win.x + W / 2, by + 58, { size: 14, bold: true, align: 'center', color: q.color, outline: '#ffffff' });
  drawItemIcon(ctx, d.id, win.x + W / 2 - 8, by - 50, 1.5);
  if (s.t >= s.until) win.stir = null;
}

