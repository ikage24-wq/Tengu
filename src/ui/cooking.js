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
import { MOCHI_SWEETS, GARDEN_CROPS } from '../data/mochi-raise.js';
import { STAT_ORDER, STAT_INFO, statIcon, tag } from './mochi-kit.js';
import { roundRect, clicked } from './kit.js';

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
  // (What you just made, for a cooking date: world/dates.js.)
  if (world) world.lastCooked = { id: d.id, at: world.now };
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
  if (!windowFrame(ui, win, W, H, world.map.garden ? 'Sweet Kitchen' : 'Cooking')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const x = win.x + 8;
  // Your Mochi Garden's kitchen cooks Mochi sweets.
  if (world.map.garden) return sweetsList(ui, win, world, x, st);
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

// The Sweet Kitchen (your Mochi Garden): every Mochi sweet, in tabs by the stat it trains (All, and
// one per stat), each a card: the sweet, its name, what it trains as stat stickers (+points), sweet
// or spicy (sweet leans a Mochi angelic, spicy devilish), what it needs (what you have, green when
// it's enough), and Cook, which makes SWEET_BATCH of it.
const SWEET_BATCH = 2;
const KITCHEN_TABS = ['all', ...STAT_ORDER];
function sweetsList(ui, win, world, x, st) {
  const { ctx } = ui;
  const char = world.char;
  // The tabs: All, then a stat sticker each.
  const ty = win.y + 26;
  const tw = (W - 16) / KITCHEN_TABS.length;
  KITCHEN_TABS.forEach((k, i) => {
    const on = (win.sweetTab ?? 'all') === k;
    const hx = x + i * tw;
    const over = hover(ui, hx, ty, tw - 3, 15);
    ctx.fillStyle = on ? '#ffe0ec' : over ? '#fff4f8' : '#ffffff';
    roundRect(ctx, hx, ty, tw - 3, 15, 7.5);
    ctx.fill();
    ctx.strokeStyle = on ? '#ff8fb8' : '#f0d8e4';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (k === 'all') text(ctx, 'All', hx + (tw - 3) / 2, ty + 10.4, { size: 7, bold: true, align: 'center', color: on ? '#d0507a' : COLORS.ink });
    else {
      statIcon(ctx, k, hx + 9, ty + 7.5, 4.6);
      text(ctx, STAT_INFO[k].name, hx + 16, ty + 10.4, { size: 6.5, bold: on, color: on ? '#d0507a' : COLORS.ink });
    }
    if (clicked(ui, hx, ty, tw - 3, 15)) {
      win.sweetTab = k;
      win.scroll = 0;
    }
  });
  const tab = win.sweetTab ?? 'all';
  // (What you can cook now comes first.)
  const list = MOCHI_SWEETS.filter((sw) => tab === 'all' || sw.trains[tab]).sort((a, b) => Number(hasAll(char, b)) - Number(hasAll(char, a)));
  let y = win.y + 46;
  const rows = Math.floor((H - 66) / ROW);
  if (hover(ui, x, y, W - 16, rows * ROW)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, list.length - rows));
  for (const sw of list.slice(win.scroll, win.scroll + rows)) {
    const ok = hasAll(char, sw);
    const spicy = sw.taste === 'spicy';
    ctx.fillStyle = 'rgba(70,40,90,0.08)';
    roundRect(ctx, x + 1, y + 1.5, W - 16, ROW - 3, 9);
    ctx.fill();
    ctx.fillStyle = ok ? '#fff4f8' : '#ffffff';
    roundRect(ctx, x, y, W - 16, ROW - 3, 9);
    ctx.fill();
    ctx.strokeStyle = ok ? '#ff8fb0' : '#f0dce6';
    ctx.lineWidth = ok ? 1.3 : 1;
    ctx.stroke();
    // The sweet on a round plate.
    ctx.fillStyle = spicy ? '#ffe4dc' : '#fff0f6';
    ctx.beginPath();
    ctx.arc(x + 15, y + 15, 12, 0, Math.PI * 2);
    ctx.fill();
    drawItemIcon(ctx, sw.id, x + 7, y + 7);
    if (hover(ui, x + 3, y + 3, 24, 24)) tooltip(ui, itemTooltip(char, sw.id));
    text(ctx, fit(ctx, sw.name, 92, 8, true), x + 31, y + 11, { size: 8, bold: true });
    tag(ctx, spicy ? 'Spicy' : 'Sweet', x + 31 + Math.min(92, (ctx.measureText(sw.name).width || 0)) + 4, y + 8, spicy ? '#e8604a' : '#ff8fb8', { size: 5.5 });
    // What it trains: a sticker per stat and its points.
    if (sw.heart) text(ctx, 'Two in bloom make an egg', x + 31, y + 23, { size: 6.5, color: '#d0507a' });
    else {
      // (Up to five stats: closer together when there are many, so they never run into the ingredients.)
      const trains = Object.entries(sw.trains);
      const gap = Math.min(30, 124 / trains.length);
      let sx = x + 31;
      for (const [k, n] of trains) {
        statIcon(ctx, k, sx + 4.5, y + 21, 4.5);
        text(ctx, `+${n}`, sx + 10.5, y + 23.4, { size: gap < 28 ? 5.5 : 6.5, bold: true, color: STAT_INFO[k].color });
        sx += gap;
      }
    }
    let ix = x + 160;
    for (const [id, n] of Object.entries(sw.needs)) {
      const have = countItem(char.inventory, id);
      drawItemIcon(ctx, id, ix, y + 4);
      text(ctx, `${Math.min(have, 99)}/${n}`, ix + 8, y + 27, { size: 6, bold: true, align: 'center', color: have >= n ? COLORS.good : COLORS.bad });
      if (hover(ui, ix, y + 4, 16, 16)) tooltip(ui, itemTooltip(char, id));
      ix += 22;
    }
    if (button(ui, x + W - 62, y + 7, 42, 16, 'Cook', { primary: ok, enabled: ok, size: 7.5, iconName: 'flame' })) {
      for (const [id, n] of Object.entries(sw.needs)) removeItem(char.inventory, id, n);
      addItem(char.inventory, sw.id, SWEET_BATCH);
      lifeAction(world, 'cooking', { tier: 1, kind: 'cook' });
      playLifePose(world, 'cook', { at: st, find: sw.id });
      world.log(`You made ${SWEET_BATCH} ${sw.name}! Up beside a Mochi to feed it.`, '#ffc2d4');
    }
    y += ROW;
  }
  const crops = Object.values(GARDEN_CROPS).map((c) => c.name).join(', ');
  text(ctx, fit(ctx, `${crops}: from the crop bed in the orchard.`, W - 30, 6.5, false), win.x + 16, win.y + H - 10, { size: 6.5, color: COLORS.muted });
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
