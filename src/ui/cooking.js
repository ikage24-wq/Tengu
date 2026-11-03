// The cooking window, opened at a town stove (data/cooking.js): the recipes you know, each with
// what it needs (what you have of each, in green when it's enough) and what it does, and a Cook
// button that serves the dish (SERVINGS of it) straight away.
// Cooking is a life skill (core/life.js): each dish gives Cooking EXP and some character EXP, a
// higher Cooking level sometimes serves one more, and a dish of a richer region (its `lv` or
// `tier`) needs the level first.
// The Party Feasts tab (world/coop-life.js): one big pot per region tier from a bigger batch of
// its dish ingredients, eaten by you and shared with everyone in your party on the map.

import { DISHES, SERVINGS, FEASTS } from '../data/cooking.js';
import { countItem, removeItem, addItem } from '../core/inventory.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, text, box, button, hover, tooltip, fit, tabs, sparkle, icon } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { groundAt } from '../world/physics.js';
import { lifeLevel, lifePerks, lifeAction, needFor, withExtra } from '../core/life.js';
import { playLifePose } from '../world/lifepose.js';
import { cookFeast, feastReady, feastSkilled, partyBotsHere } from '../world/coop-life.js';

const W = 320;
const H = 254;
const ROW = 34;

export const knownRecipes = (char) => DISHES.filter((d) => !d.learn || (char.recipes ?? []).includes(d.id));
const hasAll = (char, d) => Object.entries(d.needs).every(([id, n]) => countItem(char.inventory, id) >= n);
const skilled = (char, d) => lifeLevel(char, 'cooking') >= needFor(d);
const canCook = (char, d) => hasAll(char, d) && skilled(char, d);
// The region tier a dish belongs to: its own, or from how hearty it is.
export const dishTier = (d) => d.tier ?? (d.heal <= 250 ? 1 : d.heal <= 500 ? 2 : d.heal <= 1000 ? 3 : 4);

// Cooks `d`: uses the ingredients, adds the servings. Returns how many, or 0. With the world, it's
// a life action: Cooking EXP and character EXP, and the level's chance of one more serving.
export function cook(char, d, world = null, rng = Math.random) {
  if (!canCook(char, d)) return 0;
  for (const [id, n] of Object.entries(d.needs)) removeItem(char.inventory, id, n);
  const n = world ? withExtra(SERVINGS, lifePerks(char, 'cooking'), rng) : SERVINGS;
  addItem(char.inventory, d.id, n);
  if (world) lifeAction(world, 'cooking', { tier: dishTier(d), kind: 'cook' });
  return n;
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
  const tabWas = win.tab ?? 0;
  win.tab = tabs(ui, x + 2, win.y + 25, ['Dishes', 'Party Feasts'], tabWas, { w: 64, h: 14 });
  if (win.tab !== tabWas) win.scroll = 0;
  if (win.tab === 1) return feastTab(ui, win, world, x, win.y + 44, st);
  let y = win.y + 44;
  const list = knownRecipes(char);
  const rows = Math.floor((H - 68) / ROW);
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
    if (!skilled(char, d)) locked(ctx, x + W - 62, y + 7, 42, 16, needFor(d));
    else if (button(ui, x + W - 62, y + 7, 42, 16, 'Cook', { primary: ok, enabled: ok, size: 7.5 })) {
      const n = cook(char, d, world);
      // She stirs, tosses and tastes it at the stove (render/life-moves.js).
      if (n) playLifePose(world, 'cook', { at: st, find: d.id });
      world.log(n ? `You cooked ${n} ${d.name}${n > 1 ? 's' : ''}${n > SERVINGS ? ' (one extra!)' : ''}.` : 'Missing an ingredient!', n ? '#ffd6a0' : '#ffb3c6');
    }
    if (!skilled(char, d) && hover(ui, x + W - 62, y + 7, 42, 16)) tooltip(ui, [{ text: `Needs Cooking Lv ${needFor(d)}`, bold: true, color: COLORS.bad }]);
    y += ROW;
  }
  const more = DISHES.length - list.length;
  text(ctx, more ? `${more} more recipe${more === 1 ? '' : 's'} to learn: catch new fish!` : 'You know every recipe!', win.x + 12, win.y + H - 10, { size: 7, color: COLORS.muted });
}

// A recipe your Cooking level can't make yet: not a button at all but a flat, dashed tag with a
// lock and the level, so it never reads like a greyed-out Cook.
function locked(ctx, x, y, w, h, lv) {
  ctx.save();
  ctx.setLineDash([2, 2]);
  box(ctx, x, y + 1, w, h - 2, { fill: 'rgba(255,240,244,0.9)', edge: '#e8a0b4', r: (h - 2) / 2, width: 1 });
  ctx.restore();
  icon(ctx, 'lock', x + 9, y + h / 2, 7, COLORS.bad);
  text(ctx, `Lv ${lv}`, x + w / 2 + 5, y + h / 2 + 2.6, { size: 7.5, bold: true, align: 'center', color: COLORS.bad });
}

// The Party Feasts tab: each tier's feast, what it needs, what it gives, and who it would feed.
function feastTab(ui, win, world, x, y, st) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const party = partyBotsHere(world).length + (world.net?.partyFriends?.() ?? []).filter((g) => g.map === world.map.id).length;
  for (const f of FEASTS) {
    const ok = feastReady(char, f);
    box(ctx, x, y, W - 16, ROW + 9, { fill: ok ? '#fff6e0' : '#ffffff', edge: ok ? '#f0b53a' : th.light, r: 8, width: ok ? 1.5 : 1 });
    drawItemIcon(ctx, f.id, x + 6, y + 6);
    if (ok) sparkle(ctx, x + 22, y + 6, 2.4 + Math.sin(world.now * 4 + y) * 0.6, '#ffd65a');
    if (hover(ui, x + 6, y + 6, 16, 16)) tooltip(ui, itemTooltip(char, f.id));
    text(ctx, fit(ctx, f.name, 126, 8, true), x + 28, y + 11, { size: 8, bold: true });
    text(ctx, fit(ctx, f.about, 126, 6.5, false), x + 28, y + 21, { size: 6.5, color: '#3f9f5f' });
    text(ctx, `Tier ${f.tier} · ${Math.round(f.secs / 60)} min · whole party`, x + 28, y + 30, { size: 6, color: COLORS.muted });
    let ix = x + 158;
    for (const [id, n] of Object.entries(f.needs)) {
      const have = countItem(char.inventory, id);
      drawItemIcon(ctx, id, ix, y + 6);
      text(ctx, `${Math.min(have, 99)}/${n}`, ix + 8, y + 30, { size: 6, bold: true, align: 'center', color: have >= n ? COLORS.good : COLORS.bad });
      if (hover(ui, ix, y + 6, 16, 16)) tooltip(ui, itemTooltip(char, id));
      ix += 19;
    }
    const skilled = feastSkilled(char, f);
    if (!skilled) locked(ctx, x + W - 58, y + 11, 40, 16, needFor(f));
    else if (button(ui, x + W - 58, y + 11, 40, 16, 'Cook', { primary: ok, enabled: ok, size: 7.5 })) {
      const n = cookFeast(world, f);
      if (n) playLifePose(world, 'cook', { at: st, find: f.id });
      world.log(n ? `You cooked a ${f.name}! Eat it to serve the whole party.` : 'Missing an ingredient!', n ? '#ffd6a0' : '#ffb3c6');
    }
    if (!skilled && hover(ui, x + W - 58, y + 11, 40, 16)) tooltip(ui, [{ text: `Needs Cooking Lv ${needFor(f)}`, bold: true, color: COLORS.bad }]);
    y += ROW + 12;
  }
  text(ctx, party ? `Eat a feast and all ${party + 1} of your party here share it.` : 'A feast feeds your whole party on the map: bring friends!', win.x + 12, win.y + H - 10, { size: 7, color: party ? '#3f9f5f' : COLORS.muted, bold: Boolean(party) });
}
