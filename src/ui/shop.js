// An NPC's shop, opened from their dialog: Buy and Sell tabs, a list on the left and the picked
// item in full on the right, like the Bag.
//
// The list shows each item in its cell with its name, what it is, its price, and how many you
// already have. The detail pane tries gear on your hero, compares its stats with what you wear,
// lets you pick a color before buying, and sets how many with a stepper (or the wheel), showing
// the total before you pay. Gold changes float off the gold pill. Double-clicking a row buys or
// sells one at once; Shift makes that ten.

import { NPCS, shopStock } from '../data/npcs.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { addItem, removeItem, countItem, TAB_SIZE, STACK_MAX } from '../core/inventory.js';
import { makeEquip, itemName, itemColors } from '../core/items.js';
import { equipBlocker, wornGear } from '../core/character.js';
import { shade } from '../render/pixel.js';
import { drawHero } from '../render/hero.js';
import { COLORS, windowFrame, button, tabs, text, box, hover, clicked, tooltip, wrap, well, icon, fit, itemSlot, font } from './kit.js';
import { itemTooltip, sellPrice } from './tooltips.js';
import { questsWanting } from '../core/quests.js';
import { knownRecipes } from './cooking.js';
import { compareStats } from './bag.js';

const W = 396;
const H = 250;
const LIST_W = 220;
const ROW = 24;
const GREEN = '#2f9f58';
const SLOT_NAMES = { hat: 'Hat', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', weapon: 'Weapon', gloves: 'Gloves', cape: 'Cape', earring: 'Earring' };
const STAT_SHORT = { watk: 'ATK', matk: 'M.ATK', wdef: 'DEF', mdef: 'M.DEF', str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', hp: 'HP', mp: 'MP', acc: 'ACC', eva: 'AVD', speed: 'SPD', jump: 'JMP' };

// A variant's color, darkened enough to read on the pale window.
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
}
const readable = (c) => shade(c, lum(c) > 0.75 ? -45 : -8);

// A shop piece, for its stats and tooltip before you buy it (stats as sold).
const previews = new Map();
function makePreview(id) {
  if (!previews.has(id)) previews.set(id, makeEquip(id));
  return previews.get(id);
}

// What one costs to buy, and what one sells for.
const unitCost = (def) => def.price;
const unitGain = (def, e) => sellPrice(e.id, e.inst);

const kindOf = (def) => {
  if (def.type === 'equip') return def.slot === 'weapon' ? def.weaponType[0].toUpperCase() + def.weaponType.slice(1) : SLOT_NAMES[def.slot];
  return def.type === 'use' ? 'Consumable' : 'Material';
};

// The rows of a tab. Buying: the shop's stock in a category. Selling: your bag tab, with
// stackables gathered into one row per item.
function entriesOf(npc, char, dlg) {
  if (dlg.tab === 0) {
    const kind = (id) => (ITEMS[id].type !== 'equip' ? 3 : ITEMS[id].slot === 'weapon' ? 2 : 1);
    return shopStock(npc, char).filter((id) => !dlg.buyTab || kind(id) === dlg.buyTab).map((id) => ({ id, key: `b:${id}` }));
  }
  const tab = ['equip', 'use', 'etc'][dlg.sellTab ?? 0];
  const out = [];
  char.inventory[tab].forEach((e, index) => {
    // Quest items stay with you.
    if (ITEMS[e.id].quest) return;
    if (tab === 'equip') out.push({ id: e.id, inst: e, index, tab, key: `u${e.uid}` });
    else {
      const have = out.find((o) => o.id === e.id);
      if (have) have.qty += e.qty;
      else out.push({ id: e.id, qty: e.qty, tab, key: `i:${e.id}` });
    }
  });
  return out;
}

export function shopWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  // The shop is bigger than the talk box it opens from, so it starts centred above the HUD.
  if (!dlg.placedShop) {
    win.x = Math.round((640 - W) / 2);
    win.y = Math.max(20, 326 - H - 8);
    dlg.placedShop = true;
  }
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Shop`, { theme: 'peach', icon: 'shop' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const shift = ui.input.held.has('ShiftLeft') || ui.input.held.has('ShiftRight');
  const was = `${dlg.tab}|${dlg.sellTab}|${dlg.buyTab}`;
  dlg.tab = tabs(ui, win.x + 9, win.y + 26, ['Buy', 'Sell'], dlg.tab ?? 0, { w: 40, h: 14 });
  if (dlg.tab === 0) dlg.buyTab = tabs(ui, win.x + 99, win.y + 26, ['All', 'Gear', 'Arms', 'Other'], dlg.buyTab ?? 0, { w: 30, h: 14 });
  else dlg.sellTab = tabs(ui, win.x + 99, win.y + 26, ['Equip', 'Use', 'Etc'], dlg.sellTab ?? 0, { w: 40, h: 14 });
  const entries = entriesOf(npc, char, dlg);
  // A new list starts at the top, with its first row picked.
  if (was !== `${dlg.tab}|${dlg.sellTab}|${dlg.buyTab}`) Object.assign(dlg, { scroll: 0, sel: null, qty: 1 });
  dlg.pick ??= {};
  if (!entries.some((e) => e.key === dlg.sel)) dlg.sel = entries[0]?.key ?? null;
  const picked = entries.find((e) => e.key === dlg.sel) ?? null;

  // ---- The list ----
  const lx = win.x + 8;
  const ly = win.y + 47;
  const rows = 7;
  dlg.scroll = Math.max(0, dlg.scroll ?? 0);
  if (hover(ui, lx, ly, LIST_W, rows * ROW)) dlg.scroll += ui.mouse.wheel;
  dlg.scroll = Math.min(dlg.scroll, Math.max(0, entries.length - rows));
  const sb = entries.length > rows;
  const rw = LIST_W - (sb ? 6 : 0);
  entries.slice(dlg.scroll, dlg.scroll + rows).forEach((e, i) => {
    const y = ly + i * ROW;
    if (listRow(ui, world, dlg, e, lx, y, rw, th)) {
      const again = state.lastClick?.key === `shop:${e.key}` && world.now - state.lastClick.at < 0.4;
      if (dlg.sel !== e.key) dlg.qty = 1;
      dlg.sel = e.key;
      state.lastClick = { key: `shop:${e.key}`, at: world.now };
      // Double-click: buy or sell one at once (ten with Shift).
      if (ui.mouse.double || again) trade(world, dlg, e, shift ? 10 : 1);
    }
  });
  if (sb) {
    const trackH = rows * ROW - 3;
    box(ctx, lx + LIST_W - 3, ly, 3, trackH, { fill: th.light, edge: null, r: 1.5 });
    box(ctx, lx + LIST_W - 3, ly + (trackH * dlg.scroll) / entries.length, 3, (trackH * rows) / entries.length, { fill: th.main, edge: null, r: 1.5 });
  }
  if (!entries.length) {
    icon(ctx, 'bag', lx + LIST_W / 2, ly + 60, 18, th.light);
    text(ctx, dlg.tab === 0 ? 'Nothing for you here yet.' : 'Nothing in this tab to sell.', lx + LIST_W / 2, ly + 84, { size: 8, bold: true, align: 'center', color: COLORS.muted });
  }

  // ---- The picked item ----
  const dx = lx + LIST_W + 6;
  details(ui, world, dlg, picked, dx, win.y + 26, win.x + W - 8 - dx, rows * ROW + 21, th, shift);

  // ---- Footer: your gold (changes float off it), bag room, and Back ----
  const fy = win.y + H - 23;
  const gw = 112;
  box(ctx, lx, fy, gw, 16, { fill: '#fff6d6', edge: '#f0cf7a', r: 8 });
  icon(ctx, 'coin', lx + 10, fy + 8, 9, '#f0b53a');
  text(ctx, char.gold.toLocaleString(), lx + gw / 2 + 5, fy + 11.5, { size: 8.5, bold: true, align: 'center', color: COLORS.gold });
  const f = dlg.flash;
  if (f && world.now - f.at < 0.9) {
    const k = (world.now - f.at) / 0.9;
    ctx.globalAlpha = 1 - k * k;
    text(ctx, f.text, lx + gw - 6, fy - 2 - k * 12, { size: 8, bold: true, align: 'right', color: f.color, outline: '#ffffff' });
    ctx.globalAlpha = 1;
  }
  const bagTab = picked ? ITEMS[picked.id].type : ['equip', 'use', 'etc'][dlg.sellTab ?? 0];
  const used = char.inventory[bagTab]?.length ?? 0;
  text(ctx, `Bag (${bagTab[0].toUpperCase() + bagTab.slice(1)}) ${used}/${TAB_SIZE}`, lx + gw + 8, fy + 11.5, { size: 7, bold: true, color: used >= TAB_SIZE ? COLORS.bad : COLORS.muted });
  // Selling: everything that's only worth gold, in one go.
  if (dlg.tab === 1) {
    const junk = junkOf(char);
    const gain = junk.reduce((n, o) => n + o.gain, 0);
    const jx = win.x + W - 136;
    if (button(ui, jx, fy, 70, 16, 'Sell junk', { size: 7.5, primary: gain > 0, enabled: gain > 0, theme: 'peach', iconName: 'coin' })) {
      const got = sellJunk(char);
      dlg.flash = { at: world.now, text: `+${got.toLocaleString()}g`, color: GREEN };
      world.log(`Sold ${junk.reduce((n, o) => n + o.qty, 0)} monster drops for ${got.toLocaleString()} gold.`, '#ffe36b');
    }
    if (hover(ui, jx, fy, 70, 16)) {
      tooltip(ui, gain ? [{ text: `Sell for ${gain.toLocaleString()} gold`, bold: true }, ...junk.slice(0, 8).map((o) => ({ text: `${ITEMS[o.id].name} x${o.qty}`, size: 7 })), ...(junk.length > 8 ? [{ text: `and ${junk.length - 8} more`, size: 7, color: COLORS.muted }] : []), { text: 'Keeps what your quests and recipes need.', size: 7, color: COLORS.muted }]
        : [{ text: 'No junk to sell', bold: true }, { text: 'Monster drops your quests and recipes need are kept.', size: 7, color: COLORS.muted }]);
    }
  } else text(ctx, 'Double-click: buy or sell one · Shift: 10', win.x + W - 70, fy + 11.5, { size: 6.5, align: 'right', color: COLORS.muted });
  if (button(ui, win.x + W - 62, fy, 54, 16, 'Back', { size: 8 })) dlg.mode = null;
}

// Junk: monster drops in your bag that no quest you're on wants and no recipe you know uses.
// [{ id, qty, gain }] (what each stack sells for).
export function junkOf(char) {
  const cooking = new Set(knownRecipes(char).flatMap((d) => Object.keys(d.needs)));
  const out = [];
  for (const e of char.inventory.etc) {
    if (!ITEMS[e.id].loot || cooking.has(e.id) || questsWanting(char, e.id).length) continue;
    const have = out.find((o) => o.id === e.id);
    if (have) have.qty += e.qty;
    else out.push({ id: e.id, qty: e.qty });
  }
  for (const o of out) o.gain = sellPrice(o.id) * o.qty;
  return out;
}

// Sells all the junk at once. Returns the gold it made.
export function sellJunk(char) {
  let gold = 0;
  for (const o of junkOf(char)) {
    removeItem(char.inventory, o.id, o.qty);
    gold += o.gain;
  }
  char.gold += gold;
  return gold;
}

// One row: the item's cell, its name (in its color), what it is, how many you have, and its price.
function listRow(ui, world, dlg, e, x, y, w, th) {
  const { ctx } = ui;
  const char = world.char;
  const def = ITEMS[e.id];
  const on = dlg.sel === e.key;
  const hot = hover(ui, x, y, w, ROW - 2);
  const variant = e.inst?.variant ?? null;
  const shown = e.inst ?? { id: e.id, variant };
  const rare = e.inst?.rarity ? RARITIES[e.inst.rarity].color : null;
  box(ctx, x, y, w, ROW - 2, { fill: on ? th.light : hot ? '#ffffff' : 'rgba(255,255,255,0.7)', edge: on ? th.main : rare ?? th.light, r: 7, width: on || rare ? 1.5 : 1 });
  itemSlot(ctx, x + 2, y + 1, 20, { id: e.id, variant, rarity: e.inst?.rarity }, { shadow: false, count: false, r: 5 });
  const color = rare ?? (variant ? readable(itemColors(shown).main) : COLORS.ink);
  const priceW = 56;
  text(ctx, fit(ctx, itemName(shown), w - priceW - 30, 7.5), x + 26, y + 9.5, { size: 7.5, bold: true, color });
  // What it is, and whether you can use it.
  let sub = kindOf(def);
  let subColor = COLORS.muted;
  if (def.type === 'equip') {
    if (def.reqLevel) sub += ` · Lv ${def.reqLevel}`;
    if (char.level < def.reqLevel) subColor = COLORS.bad;
  }
  const have = dlg.tab === 0 && def.type !== 'equip' ? countItem(char.inventory, e.id) : e.qty;
  if (have && def.type !== 'equip') sub += dlg.tab === 0 ? ` · have ${have}` : ` · x${have}`;
  text(ctx, fit(ctx, sub, w - priceW - 30, 6.5, false), x + 26, y + 18, { size: 6.5, color: subColor });
  // The price: what one costs (or sells for); red when you can't afford it.
  const price = dlg.tab === 0 ? unitCost(def, variant) : unitGain(def, e);
  const afford = dlg.tab === 1 || char.gold >= price;
  icon(ctx, 'coin', x + w - priceW + 4, y + 11, 7, '#f0b53a');
  text(ctx, price.toLocaleString(), x + w - 5, y + 13.5, { size: 7.5, bold: true, align: 'right', color: afford ? COLORS.gold : COLORS.bad });
  if (hot) tooltip(ui, itemTooltip(char, e.id, e.inst ?? null));
  return clicked(ui, x, y, w, ROW - 2);
}

// How many of the picked item the stepper can go up to.
function maxQty(char, dlg, e, def, variant) {
  if (def.type === 'equip') return 1;
  if (dlg.tab === 1) return e.qty;
  const each = unitCost(def, variant);
  return Math.max(1, Math.min(STACK_MAX, Math.floor(char.gold / Math.max(1, each))));
}

// Buys or sells `qty` of an entry. Returns true when it went through.
function trade(world, dlg, e, qty) {
  const char = world.char;
  const def = ITEMS[e.id];
  const variant = e.inst?.variant ?? null;
  qty = Math.max(1, Math.min(qty, maxQty(char, dlg, e, def, variant)));
  if (dlg.tab === 0) {
    const cost = unitCost(def, variant) * qty;
    if (char.gold < cost) {
      world.log('Not enough gold.', '#ffb3c6');
      return false;
    }
    const item = def.type === 'equip' ? makeEquip(e.id) : e.id;
    // Stars come by the full set; addItem splits them into sets.
    if (!addItem(char.inventory, item, def.type === 'equip' ? 1 : qty)) {
      world.log('Your bag is full.', '#ffb3c6');
      return false;
    }
    char.gold -= cost;
    dlg.flash = { at: world.now, text: `-${cost.toLocaleString()}g`, color: COLORS.bad };
    world.log(`Bought ${itemName(def.type === 'equip' ? item : e.id)}${qty > 1 ? ` x${qty}` : ''}.`, itemColors(def.type === 'equip' ? item : { id: e.id }).main);
    return true;
  }
  let gain;
  if (e.inst) {
    char.inventory.equip.splice(char.inventory.equip.indexOf(e.inst), 1);
    gain = sellPrice(e.id, e.inst);
  } else {
    removeItem(char.inventory, e.id, qty);
    gain = sellPrice(e.id) * qty;
  }
  char.gold += gain;
  dlg.flash = { at: world.now, text: `+${gain.toLocaleString()}g`, color: GREEN };
  world.log(`Sold ${itemName(e.inst ?? e.id)}${qty > 1 ? ` x${qty}` : ''} for ${gain.toLocaleString()} gold.`, COLORS.gold);
  dlg.qty = 1;
  return true;
}

// The picked item in full: its cell, name and kind; gear tried on your hero with its stats
// against yours, and its colors; otherwise what it does. Then how many, the total, and Buy/Sell.
function details(ui, world, dlg, e, x, y, w, h, th, shift) {
  const { ctx } = ui;
  const char = world.char;
  well(ctx, x, y, w, h, th);
  if (!e) return;
  const def = ITEMS[e.id];
  const variant = e.inst?.variant ?? null;
  const shown = e.inst ?? (def.type === 'equip' ? makePreview(e.id) : { id: e.id, variant });
  const rare = e.inst?.rarity ? RARITIES[e.inst.rarity].color : null;
  itemSlot(ctx, x + 6, y + 6, 36, { id: e.id, variant, rarity: e.inst?.rarity }, { scale: 2, shadow: false });
  const tx = x + 47;
  const tw = w - 53;
  const color = rare ?? (variant ? readable(itemColors(shown).main) : COLORS.ink);
  const name = itemName(e.inst ?? { id: e.id, variant });
  ctx.font = font(8.5, true);
  const lines = ctx.measureText(name).width > tw ? 2 : 1;
  let ny = wrap(ctx, name, tx, y + 15, tw, { size: 8.5, bold: true, color, lineHeight: 9.5 });
  if (lines === 1) ny = y + 25;
  const why = def.type === 'equip' ? equipBlocker(char, shown) : null;
  text(ctx, fit(ctx, why ? `Can't use: ${why}` : `${kindOf(def)}${def.reqLevel ? ` · Lv ${def.reqLevel}` : ''}`, tw, 6.5, Boolean(why)), tx, ny + 1, { size: 6.5, bold: Boolean(why), color: why ? COLORS.bad : COLORS.muted });

  let cy = y + 48;
  if (def.type === 'equip') {
    // Your hero wearing it, and its stats against what you wear.
    box(ctx, x + 6, cy, 40, 52, { fill: '#ffffff', edge: th.light, r: 7, width: 1 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 6, cy, 40, 52);
    ctx.clip();
    drawHero(ctx, char.appearance, wornGear({ ...char, equipment: { ...char.equipment, [def.slot]: shown } }), x + 26, cy + 47, { pose: 'idle', time: world.now, scale: 0.85 });
    ctx.restore();
    let sx = x + 51;
    let sy = cy + 8;
    for (const [k, v, d] of compareStats(char, shown)) {
      const s = `${STAT_SHORT[k]} ${v}`;
      const ds = d ? ` ${d > 0 ? '+' : ''}${d}` : '';
      ctx.font = font(6.5, true);
      const sw = ctx.measureText(s).width;
      const cw = sw + (ds ? ctx.measureText(ds).width : 0) + 7;
      if (sx + cw > x + w - 5) {
        sx = x + 51;
        sy += 11;
        if (sy > cy + 50) break;
      }
      box(ctx, sx, sy - 7, cw, 9.5, { fill: d > 0 ? '#e3f8ea' : d < 0 ? '#ffe6ec' : '#f4eefa', edge: null, r: 4.75 });
      text(ctx, s, sx + 3.5, sy, { size: 6.5, bold: true, color: COLORS.ink });
      if (ds) text(ctx, ds, sx + 3.5 + sw, sy, { size: 6.5, bold: true, color: d > 0 ? GREEN : COLORS.bad });
      sx += cw + 2.5;
    }
    if (!char.equipment[def.slot]) text(ctx, `Nothing worn as ${SLOT_NAMES[def.slot].toLowerCase()}`, x + 51, cy + 50, { size: 6, color: COLORS.muted });
    cy += 58;
  } else {
    const desc = def.desc ?? '';
    cy = wrap(ctx, desc, x + 7, cy + 2, w - 14, { size: 7, color: COLORS.ink, lineHeight: 9 }) + 2;
    const have = countItem(char.inventory, e.id);
    text(ctx, have ? `You have ${have}` : "You don't have any", x + 7, cy + 2, { size: 6.5, bold: true, color: have ? th.dark : COLORS.muted });
    cy += 8;
  }

  // How many, and the total.
  const max = maxQty(char, dlg, e, def, variant);
  dlg.qty = Math.max(1, Math.min(max, dlg.qty ?? 1));
  const by = y + h - 21;
  if (max > 1) {
    const sy = by - 21;
    const step = shift ? 10 : 1;
    if (button(ui, x + 6, sy, 16, 15, '−', { size: 9 })) dlg.qty -= step;
    box(ctx, x + 25, sy, 34, 13, { fill: '#ffffff', edge: th.light, r: 6.5, width: 1.2 });
    text(ctx, `${dlg.qty}`, x + 42, sy + 9.5, { size: 8, bold: true, align: 'center', color: COLORS.ink });
    if (hover(ui, x + 25, sy, 34, 13)) dlg.qty -= ui.mouse.wheel;
    if (button(ui, x + 62, sy, 16, 15, '+', { size: 9 })) dlg.qty += step;
    if (button(ui, x + 81, sy, 26, 15, 'Max', { size: 6.5 })) dlg.qty = max;
    dlg.qty = Math.max(1, Math.min(max, dlg.qty));
  }
  const each = dlg.tab === 0 ? unitCost(def, variant) : unitGain(def, e);
  const total = each * dlg.qty;
  const afford = dlg.tab === 1 || char.gold >= total;
  text(ctx, dlg.tab === 0 ? 'Total' : 'You get', x + 7, by + 6, { size: 6.5, bold: true, color: COLORS.muted });
  icon(ctx, 'coin', x + 11, by + 12.5, 7, '#f0b53a');
  text(ctx, total.toLocaleString(), x + 17, by + 15, { size: 8.5, bold: true, color: afford ? COLORS.gold : COLORS.bad });
  const label = dlg.tab === 0 ? 'Buy' : 'Sell';
  if (button(ui, x + w - 52, by, 46, 16, label, { enabled: afford, primary: dlg.tab === 0, theme: dlg.tab === 1 ? 'peach' : null, size: 8 })) trade(world, dlg, e, dlg.qty);
}
