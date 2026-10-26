// The Bag window (I): your equipment on the left and your items on the right.
//
// Left: the hero in a well with the eight gear slots around them (or the outfit pieces worn over
// the gear, on the Outfit tab), then your gold and Cash. Hovering or picking a piece in the bag
// tries it on the hero and lights the slot it goes in.
// Right: the item tabs, a grid of larger cells (items picked up since you last closed the bag
// wear a NEW mark), how full the tab is, a Sort button, and a detail strip for the picked item:
// a big icon, what it is, its stats against what you're wearing, and what you can do with it.

import { ITEMS, RARITIES, ELEMENT_NAMES, variantsFor } from '../data/items.js';
import { equipFromBag, unequip, equipBlocker, wearOutfit, removeOutfit, wornGear, stats } from '../core/character.js';
import { applyScroll, itemName } from '../core/items.js';
import { removeItem, sortTab, moveItem, TAB_SIZE } from '../core/inventory.js';
import { useItem } from '../world/world.js';
import { drawHero } from '../render/hero.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, button, tabs, text, box, bar, hover, clicked, tooltip, wrap, well, icon, sparkle, rarityCell, slotEdges, itemShadow, fit } from './kit.js';
import { itemTooltip, sellPrice } from './tooltips.js';
import { hotkeyAt } from './hud.js';

const W = 324;
const H = 258;
const CELL = 24;
const SLOT = 21;
const TAB_KEYS = ['equip', 'use', 'etc', 'cash'];
const TAB_NAMES = ['Equip', 'Use', 'Etc', 'Cash'];
const SLOT_NAMES = { hat: 'Hat', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', weapon: 'Weapon', gloves: 'Gloves', cape: 'Cape', earring: 'Earring' };

// The paper doll: four slots down each side of the hero.
const LEFT = ['hat', 'top', 'bottom', 'shoes'];
const RIGHT = ['weapon', 'gloves', 'cape', 'earring'];

// What an empty slot shows, faded.
const SLOT_GHOST = { hat: 'hat_0', top: 'top_0', bottom: 'bottom_0', shoes: 'shoes_0', weapon: 'sword_0', gloves: 'gloves_0', cape: 'cape_0', earring: 'ear_5' };

// Short stat names for the compare line, in the order they show.
const STAT_SHORT = { watk: 'ATK', matk: 'M.ATK', wdef: 'DEF', mdef: 'M.DEF', str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK', hp: 'HP', mp: 'MP', acc: 'ACC', eva: 'AVD', speed: 'SPD', jump: 'JMP' };
const statsOf = (inst) => (inst ? inst.stats ?? ITEMS[inst.id].stats ?? {} : {});

// Every stat a piece changes against what's worn in its slot: [key, value, change].
export function compareStats(char, inst) {
  const slot = ITEMS[inst.id].slot;
  const now = statsOf(char.equipment[slot]);
  const next = statsOf(inst);
  const keys = Object.keys(STAT_SHORT).filter((k) => (next[k] ?? 0) || (now[k] ?? 0));
  return keys.map((k) => [k, next[k] ?? 0, (next[k] ?? 0) - (now[k] ?? 0)]);
}

// A key for "have I seen this": equipment by its own id, stacks by item.
const seenKey = (tab, e) => (e.uid != null ? `u${e.uid}` : `${tab}:${e.id}`);

export function bagWindow(ui, state, world) {
  const win = state.windows.bag;
  const char = world.char;
  // Whatever was in the bag when it last closed counts as seen (the first time, everything does).
  // The manager only draws open windows, so a gap since the last frame means it was closed.
  if (win.lastDrawn == null || world.now - win.lastDrawn > 0.25 || world.now < win.lastDrawn) {
    win.seen = win.lastKeys ?? allKeys(char);
    win.carry = null;
  }
  win.lastDrawn = world.now;
  win.lastKeys = allKeys(char);
  if (!windowFrame(ui, win, W, H, 'Bag')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const ox = win.x;
  const oy = win.y;
  const m = ui.mouse;

  // ---- Items (right), read first so the doll can preview the hovered or dragged piece ----
  const rx = ox + 120;
  const rw = W - 126;
  const tabWas = win.tab ?? 0;
  const tab = TAB_KEYS[tabWas];
  const list = char.inventory[tab] ?? [];
  const gx = rx + Math.floor((rw - 8 * CELL) / 2);
  const gy = oy + 46;
  const cellAt = (x, y) => {
    const c = Math.floor((x - gx) / CELL);
    const r = Math.floor((y - gy) / CELL);
    return c >= 0 && c < 8 && r >= 0 && r < TAB_SIZE / 8 ? r * 8 + c : -1;
  };
  const drag = win.carry?.live ? win.carry : null;
  const hotIndex = drag ? -1 : cellAt(m.x, m.y);
  const dragged = drag?.from === 'bag' ? list[drag.index] : null;
  const focus = dragged ?? list[hotIndex] ?? list[win.sel] ?? null;
  const focusDef = focus ? ITEMS[focus.id] : null;
  const tryOn = focus && !state.scrollMode && (tab === 'equip' || tab === 'cash') ? focus : null;

  // ---- Equipment (left) ----
  const lx = ox + 6;
  win.view = tabs(ui, lx + 8, oy + 25, ['Gear', 'Outfit'], win.view ?? 0, { w: 45, h: 13 });
  const outfit = win.view === 1;
  const doll = { x: lx, y: oy + 43, w: 108, h: 124 };
  well(ctx, doll.x, doll.y, doll.w, doll.h, th);
  // The hero, wearing whatever you're pointing at in the bag.
  let gear = wornGear(char);
  const fits = tryOn && (tab === 'cash' || !equipBlocker(char, tryOn));
  const trial = fits && tab === 'equip' ? { ...char, equipment: { ...char.equipment, [ITEMS[tryOn.id].slot]: tryOn } } : null;
  if (trial) gear = wornGear(trial);
  if (fits && tab === 'cash') gear = wornGear(char, { [ITEMS[tryOn.id].slot]: tryOn });
  // Dragging something wearable over the doll: the well lights up to take it.
  const wearable = dragged && (tab === 'equip' || tab === 'cash');
  const overDoll = hover(ui, doll.x, doll.y, doll.w, doll.h);
  if (wearable) box(ctx, doll.x + 1, doll.y + 1, doll.w - 2, doll.h - 2, { fill: overDoll ? 'rgba(255,216,79,0.22)' : null, edge: COLORS.select, r: 7, width: overDoll ? 2.5 : 1.5 });
  ctx.fillStyle = 'rgba(90,63,122,0.12)';
  ctx.beginPath();
  ctx.ellipse(lx + 54, oy + 152, 17, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  drawHero(ctx, char.appearance, gear, lx + 54, oy + 152, { pose: 'idle', time: world.now, scale: 1.15 });
  if (fits) text(ctx, wearable ? 'Drop to wear' : 'Trying on', lx + 54, oy + 52, { size: 6, bold: true, align: 'center', color: th.dark });
  const target = tryOn && ((tab === 'equip' && !outfit) || (tab === 'cash' && outfit)) ? ITEMS[tryOn.id].slot : null;
  const worn = outfit ? char.outfit ?? {} : char.equipment;
  [...LEFT.map((s, i) => [s, lx + 4, i]), ...RIGHT.map((s, i) => [s, lx + 108 - 4 - SLOT, i])].forEach(([slot, x, i]) => {
    dollSlot(ui, state, world, slot, x, oy + 48 + i * 29, worn[slot], outfit, slot === target, win);
  });

  // Your totals, and how they'd change with the piece you're trying on.
  statPanel(ui, char, trial, lx, oy + 171, 108, 50, th, world);

  // ---- Items: tabs, sort, grid, capacity ----
  // Each tab says when it holds something new.
  const fresh = TAB_KEYS.map((k) => (char.inventory[k] ?? []).some((e) => !win.seen.has(seenKey(k, e))));
  win.tab = tabs(ui, rx, oy + 25, TAB_NAMES, tabWas, { w: 38, h: 13 });
  fresh.forEach((f, i) => f && i !== win.tab && sparkle(ctx, rx + i * 40 + 35, oy + 25, 2.6, '#ff6fae'));
  if (win.tab !== tabWas) {
    win.sel = -1;
    win.carry = null;
  }
  if (button(ui, rx + rw - 32, oy + 23, 32, 16, 'Sort', { size: 7.5 })) {
    const picked = list[win.sel];
    sortTab(char.inventory, tab);
    win.sel = picked ? list.indexOf(picked) : -1;
  }
  if (hover(ui, rx + rw - 32, oy + 23, 32, 16)) tooltip(ui, [{ text: 'Sort this tab', bold: true }, { text: 'Merges stacks and lines items up by kind.', color: COLORS.muted, size: 8 }]);

  const dropCell = drag ? cellAt(m.x, m.y) : -1;
  for (let i = 0; i < TAB_SIZE; i++) {
    const x = gx + (i % 8) * CELL;
    const y = gy + Math.floor(i / 8) * CELL;
    gridCell(ui, state, world, tab, list, i, x, y, win, drag && i === Math.min(dropCell, Math.max(0, list.length - (drag.from === 'bag' ? 1 : 0))) && dropCell >= 0);
  }

  // How full the tab is.
  const cy = gy + 4 * CELL + 3;
  const full = list.length / TAB_SIZE;
  text(ctx, `${TAB_NAMES[win.tab]} ${list.length}/${TAB_SIZE}`, gx, cy + 6.5, { size: 6.5, bold: true, color: full >= 1 ? COLORS.bad : COLORS.muted });
  bar(ctx, gx + 62, cy + 1.5, 8 * CELL - 64, 4, full, full >= 1 ? COLORS.bad : full > 0.8 ? COLORS.gold : th.main, null);

  // ---- The detail strip ----
  details(ui, state, world, tab, rx, cy + 12, rw, oy + 227 - (cy + 12), focus, focusDef, drag ? -1 : hotIndex >= 0 && list[hotIndex] ? hotIndex : win.sel);

  // ---- Footer: gold, Cash, and how to move things ----
  const fy = oy + H - 22;
  pill(ctx, lx, fy, 108, 'coin', '#f0b53a', char.gold.toLocaleString(), COLORS.gold, '#fff6d6', '#f0cf7a');
  pill(ctx, lx + 108, fy, 96, 'star', '#ff6fae', `${(char.cash ?? 0).toLocaleString()} Cash`, '#d0559a', '#ffe6f2', '#ff8fc1');
  text(ctx, 'Drag items to move, wear,', ox + W - 10, fy + 6.5, { size: 6, align: 'right', color: COLORS.muted });
  text(ctx, 'or put potions on a hotkey', ox + W - 10, fy + 13.5, { size: 6, align: 'right', color: COLORS.muted });

  // ---- Dragging ----
  // A press on an item arms a drag; it starts once the mouse moves a few pixels, so clicks and
  // double-clicks still work. Letting go drops it on whatever is under the mouse.
  if (win.carry) {
    const d = win.carry;
    if (m.down) {
      if (!d.live && Math.hypot(m.x - d.x0, m.y - d.y0) > 4) d.live = true;
    } else {
      if (d.live) dropItem(world, win, d, { cell: cellAt(m.x, m.y), doll: overDoll, key: hotkeyAt(m.x, m.y), outfit });
      win.carry = null;
    }
  }
  if (win.carry?.live) {
    // The item rides the cursor, lifted, over everything in the window.
    const d = win.carry;
    const inst = d.from === 'bag' ? list[d.index] : (d.outfit ? char.outfit : char.equipment)[d.slot];
    if (!inst) win.carry = null;
    else {
      ctx.globalAlpha = 0.9;
      itemShadow(ctx, m.x, m.y + 9);
      drawItemIcon(ctx, inst.id, m.x - 8, m.y - 10, 1, inst.variant);
      ctx.globalAlpha = 1;
      const k = d.from === 'bag' && hotkeyAt(m.x, m.y) && tab === 'use' && !ITEMS[inst.id].star;
      if (k) text(ctx, 'Set hotkey', m.x, m.y - 13, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: COLORS.ink });
    }
  }
}

// Drops a dragged item: on a bag cell it moves (or merges), on the doll it's worn, on a hotkey a
// Use item is bound; a piece dragged off the doll onto the grid is taken off.
function dropItem(world, win, d, at) {
  const char = world.char;
  const tab = TAB_KEYS[win.tab];
  if (d.from === 'bag') {
    if (at.cell >= 0) {
      if (moveItem(char.inventory, tab, d.index, at.cell)) win.sel = Math.min(at.cell, char.inventory[tab].length - 1);
    } else if (at.doll && (tab === 'equip' || tab === 'cash')) {
      activate({ windows: { bag: win } }, world, tab, d.index);
    } else if (at.key && tab === 'use') {
      const entry = char.inventory.use[d.index];
      if (!entry || ITEMS[entry.id].star) return;
      const binding = { item: entry.id };
      for (const [k, b] of Object.entries(char.hotkeys)) if (b.item === entry.id) delete char.hotkeys[k];
      char.hotkeys[at.key] = binding;
      world.log(`${ITEMS[entry.id].name} set to ${at.key.replace('Key', '').replace('Digit', '')}.`, '#d4cbe8');
    }
  } else if (at.cell >= 0) {
    const ok = d.outfit ? removeOutfit(char, d.slot) : unequip(char, d.slot);
    if (!ok) world.log(d.outfit ? 'Your Cash tab is full.' : 'Your bag is full.', '#ffb3c6');
  }
}

// Totals from the stats window that gear changes, two to a row; while trying something on, each
// shows how it would change.
const PANEL_STATS = [['ATK', 'watk'], ['M.ATK', 'matk'], ['DEF', 'wdef'], ['M.DEF', 'mdef'], ['HP', 'maxHp'], ['MP', 'maxMp'], ['STR', 'str'], ['DEX', 'dex'], ['INT', 'int'], ['LUK', 'luk']];
function statPanel(ui, char, trial, x, y, w, h, th, world) {
  const { ctx } = ui;
  box(ctx, x, y, w, h, { fill: '#ffffff', edge: th.light, r: 7, width: 1.2 });
  const now = stats(char, world.now);
  const next = trial ? stats(trial, world.now) : null;
  PANEL_STATS.forEach(([label, k], i) => {
    const cx = x + 5 + (i % 2) * (w / 2);
    const cy = y + 9 + Math.floor(i / 2) * 9.2;
    const v = now[k];
    const d = next ? next[k] - v : 0;
    text(ctx, label, cx, cy, { size: 6, bold: true, color: COLORS.muted });
    const s = (d ? next[k] : v).toLocaleString();
    text(ctx, s, cx + w / 2 - 10, cy, { size: 6.5, bold: true, align: 'right', color: d > 0 ? '#2f9f58' : d < 0 ? COLORS.bad : COLORS.ink });
    if (d) text(ctx, d > 0 ? '▲' : '▼', cx + w / 2 - 9, cy, { size: 5, bold: true, color: d > 0 ? '#2f9f58' : COLORS.bad });
  });
}

function allKeys(char) {
  const keys = new Set();
  for (const k of TAB_KEYS) for (const e of char.inventory[k] ?? []) keys.add(seenKey(k, e));
  return keys;
}

function pill(ctx, x, y, w, iconName, iconColor, label, color, fill, edge) {
  box(ctx, x + 4, y, w - 8, 15, { fill, edge, r: 7.5 });
  icon(ctx, iconName, x + 13, y + 7.5, 9, iconColor);
  text(ctx, label, x + w / 2 + 4, y + 11, { size: 8.5, bold: true, align: 'center', color });
}

// One equipment slot on the doll. `lit` marks the slot the hovered bag item would go in.
function dollSlot(ui, state, world, slot, x, y, inst, outfit, lit, win) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const rare = inst?.rarity ? RARITIES[inst.rarity].color : null;
  const hot = hover(ui, x, y, SLOT, SLOT);
  if (lit) {
    const k = 0.5 + 0.5 * Math.sin(world.now * 6);
    box(ctx, x - 2, y - 2, SLOT + 4, SLOT + 4, { fill: null, edge: COLORS.select, r: 7, width: 1.5 + k });
  }
  box(ctx, x, y, SLOT, SLOT, { fill: hot ? '#ffffff' : outfit ? '#ffe6f2' : th.light, edge: state.scrollMode && inst && !outfit ? COLORS.accent : rare ?? (outfit ? '#ff8fc1' : th.main), r: 5, width: rare ? 2 : 1 });
  slotEdges(ctx, x, y, SLOT, SLOT, 5);
  if (inst) {
    itemShadow(ctx, x + SLOT / 2, y + SLOT - 3);
    drawItemIcon(ctx, inst.id, x + (SLOT - 16) / 2, y + (SLOT - 16) / 2, 1, inst.variant);
    rarityCell(ctx, x, y, SLOT, SLOT, rare, inst.rarity ?? 0, 5);
    if (inst.upgrades) text(ctx, `+${inst.upgrades}`, x + SLOT - 1.5, y + 7, { size: 5.5, bold: true, align: 'right', color: '#ffffff', outline: '#e06fa8' });
  } else {
    ctx.globalAlpha = 0.22;
    drawItemIcon(ctx, SLOT_GHOST[slot], x + (SLOT - 16) / 2, y + (SLOT - 16) / 2);
    ctx.globalAlpha = 1;
  }
  if (hot && !win.carry?.live) tooltip(ui, inst ? [...itemTooltip(char, inst.id, inst), { text: 'Double-click, or drag it into the bag, to take off', color: COLORS.muted, size: 8 }] : [{ text: `${SLOT_NAMES[slot]}${outfit ? ' outfit' : ''}`, bold: true }, { text: outfit ? 'Wear cash items from the Cash tab.' : 'Empty', size: 8, color: COLORS.muted }]);
  // Read the click once: clicked() uses it up. A press also arms a drag back into the bag.
  const press = inst && clicked(ui, x, y, SLOT, SLOT);
  const hit = press || (inst && ui.mouse.right && hot);
  if (!hit) return;
  if (press && !state.scrollMode) win.carry = { from: 'doll', slot, outfit, x0: ui.mouse.x, y0: ui.mouse.y, live: false };
  const key = `${outfit ? 'of' : 'eq'}:${slot}`;
  const dbl = ui.mouse.right || ui.mouse.double || (state.lastClick?.key === key && world.now - state.lastClick.at < 0.4);
  if (!outfit && state.scrollMode) {
    scrollOnto(state, world, inst);
    return;
  }
  if (dbl) {
    const ok = outfit ? removeOutfit(char, slot) : unequip(char, slot);
    if (!ok) world.log(outfit ? 'Your Cash tab is full.' : 'Your bag is full.', '#ffb3c6');
    state.lastClick = null;
  } else state.lastClick = { key, at: world.now };
}

// One cell of the item grid.
function gridCell(ui, state, world, tab, list, i, x, y, win, dropHere) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const entry = list[i];
  const sel = win.sel === i;
  const rare = entry?.rarity ? RARITIES[entry.rarity].color : null;
  const hot = hover(ui, x, y, CELL - 1, CELL - 1);
  const lifted = win.carry?.live && win.carry.from === 'bag' && win.carry.index === i;
  box(ctx, x, y, CELL - 1, CELL - 1, { fill: dropHere ? '#fff3c4' : sel ? '#fff3c4' : hot && entry ? '#ffffff' : '#fffdfb', edge: dropHere ? COLORS.select : sel ? COLORS.select : rare ?? th.light, r: 5, width: dropHere || sel || rare ? 2 : 1 });
  slotEdges(ctx, x, y, CELL - 1, CELL - 1, 5);
  if (!entry) return;

  const ix = x + (CELL - 1 - 16) / 2;
  const iy = y + (CELL - 1 - 16) / 2;
  itemShadow(ctx, x + (CELL - 1) / 2, y + CELL - 5);
  // A hovered item lifts a little.
  drawItemIcon(ctx, entry.id, ix, iy - (hot ? 1 : 0), 1, entry.variant);
  rarityCell(ctx, x, y, CELL - 1, CELL - 1, rare, entry.rarity ?? 0, 5);
  if (entry.qty > 1) text(ctx, `${entry.qty}`, x + CELL - 3, y + CELL - 3.5, { size: 7, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
  if (entry.upgrades) text(ctx, `+${entry.upgrades}`, x + CELL - 2.5, y + 7.5, { size: 5.5, bold: true, align: 'right', color: '#ffffff', outline: '#e06fa8' });
  const def = ITEMS[entry.id];
  if (tab === 'equip' && equipBlocker(char, entry)) {
    ctx.fillStyle = 'rgba(255,107,138,0.18)';
    ctx.fillRect(x + 1, y + 1, CELL - 3, CELL - 3);
  } else if (tab === 'equip' && compareStats(char, entry).some(([, , d]) => d > 0) && !compareStats(char, entry).some(([, , d]) => d < 0)) {
    // Better in every way than what you wear: a small green arrow.
    ctx.fillStyle = COLORS.good;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + CELL - 5);
    ctx.lineTo(x + 6.5, y + CELL - 9.5);
    ctx.lineTo(x + 10, y + CELL - 5);
    ctx.fill();
  }
  if (tab === 'use' && def.star && char.inventory.use.find((e) => ITEMS[e.id].star && char.level >= def.reqLevel) === entry) {
    text(ctx, '▶', x + 2.5, y + 8, { size: 6, bold: true, color: COLORS.accent });
  }
  // The item being dragged leaves a faded copy behind.
  if (lifted) box(ctx, x + 1, y + 1, CELL - 3, CELL - 3, { fill: 'rgba(255,253,251,0.72)', edge: null, r: 4 });
  if (!win.seen.has(seenKey(tab, entry))) {
    box(ctx, x - 1, y - 2, 15, 7, { fill: '#ff6fae', edge: '#ffffff', r: 3.5, width: 1 });
    text(ctx, 'NEW', x + 6.5, y + 3.4, { size: 4.6, bold: true, align: 'center', color: '#ffffff' });
    if (hot) win.seen.add(seenKey(tab, entry));
  }
  // No tooltip here: the detail strip under the grid shows the hovered item.
  const right = ui.mouse.right && hot;
  if (clicked(ui, x, y, CELL, CELL) || right) {
    const dbl = right || ui.mouse.double || (state.lastClick?.key === `${tab}:${i}` && world.now - state.lastClick.at < 0.4);
    win.sel = i;
    state.lastClick = { key: `${tab}:${i}`, at: world.now };
    if (!right && !state.scrollMode) win.carry = { from: 'bag', index: i, x0: ui.mouse.x, y0: ui.mouse.y, live: false };
    if (state.scrollMode && tab === 'equip') scrollOnto(state, world, entry);
    else if (dbl) activate(state, world, tab, i);
  }
}

// The strip under the grid: the hovered (or picked) item in full, and what to do with it.
function details(ui, state, world, tab, x, y, w, h, entry, def, index) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  well(ctx, x, y, w, h, th);
  if (state.scrollMode) {
    const s = ITEMS[state.scrollMode];
    drawItemIcon(ctx, s.id, x + 8, y + 8, 2);
    text(ctx, s.name, x + 46, y + 14, { size: 8.5, bold: true, color: COLORS.accent });
    wrap(ctx, 'Click a piece of equipment, in the bag or on the doll, to use it on.', x + 46, y + 25, w - 52, { size: 7, color: COLORS.muted, lineHeight: 9 });
    if (button(ui, x + w - 52, y + h - 20, 46, 15, 'Cancel', { size: 7.5 })) state.scrollMode = null;
    return;
  }
  if (!entry) {
    wrap(ctx, 'Hover an item to see it here. Double-click (or right-click) to use or equip it; pick up loot with X.', x + 8, y + 14, w - 16, { size: 7, color: COLORS.muted, lineHeight: 9.5 });
    return;
  }
  // A big icon in a cell in the item's rarity color.
  const rare = entry.rarity ? RARITIES[entry.rarity].color : null;
  box(ctx, x + 6, y + 6, 36, 36, { fill: '#ffffff', edge: rare ?? th.light, r: 7, width: rare ? 2 : 1.2 });
  drawItemIcon(ctx, entry.id, x + 8, y + 8, 2, entry.variant);
  if (entry.qty > 1) text(ctx, `x${entry.qty}`, x + 40, y + 40, { size: 7, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
  const tx = x + 48;
  const tw = w - 54;
  const name = `${itemName(entry.uid ? entry : entry.id)}${entry.upgrades ? ` +${entry.upgrades}` : ''}`;
  text(ctx, fit(ctx, name, tw, 8.5), tx, y + 13, { size: 8.5, bold: true, color: rare ?? COLORS.ink });
  let label = null;
  if (tab === 'equip') {
    const why = equipBlocker(char, entry);
    const kind = def.slot === 'weapon' ? def.weaponType[0].toUpperCase() + def.weaponType.slice(1) : SLOT_NAMES[def.slot];
    text(ctx, fit(ctx, why ? `${kind} · Can't equip: ${why}` : `${kind}${def.reqLevel ? ` · Lv ${def.reqLevel}` : ''}${entry.rarity ? ` · ${RARITIES[entry.rarity].name}` : ''}`, tw, 6.8, !!why), tx, y + 22.5, { size: 6.8, bold: !!why, color: why ? COLORS.bad : COLORS.muted });
    // Stats against what you're wearing: green up, pink down.
    let sx = tx;
    let sy = y + 33;
    for (const [k, v, d] of compareStats(char, entry)) {
      const s = `${STAT_SHORT[k]} ${v}`;
      const ds = d ? ` ${d > 0 ? '▲' : '▼'}${Math.abs(d)}` : '';
      ctx.font = '800 6.5px sans-serif';
      const cw = ctx.measureText(s + ds).width + 8;
      if (sx + cw > tx + tw - (sy > y + 40 ? 52 : 0)) {
        if (sy > y + 40) break;
        sx = tx;
        sy += 10;
      }
      box(ctx, sx, sy - 7, cw, 9.5, { fill: d > 0 ? '#e3f8ea' : d < 0 ? '#ffe6ec' : '#f4eefa', edge: null, r: 4.5 });
      text(ctx, s, sx + 4, sy, { size: 6.5, bold: true, color: COLORS.ink });
      if (ds) {
        ctx.font = '800 6.5px sans-serif';
        text(ctx, ds, sx + 4 + ctx.measureText(s).width, sy, { size: 6.5, bold: true, color: d > 0 ? '#2f9f58' : COLORS.bad });
      }
      sx += cw + 3;
    }
    // The rest of what the tooltip says: color, element, slots left, and what's worn now.
    const tint = entry.variant ? variantsFor(def)?.[entry.variant] : null;
    const bits = [tint && `◆ ${tint.name}`, def.element && `✦ ${ELEMENT_NAMES[def.element]}`, `${entry.slotsLeft ?? 7} slots`, char.equipment[def.slot] ? `vs ${itemName(char.equipment[def.slot])}` : 'nothing worn here'].filter(Boolean);
    text(ctx, fit(ctx, bits.join(' · '), tw - 52, 6, false), tx, y + h - 6, { size: 6, color: COLORS.muted });
    label = why ? null : 'Equip';
  } else if (tab === 'cash') {
    text(ctx, `Outfit · ${SLOT_NAMES[def.slot] ?? def.slot}`, tx, y + 22.5, { size: 6.8, color: '#d0559a', bold: true });
    wrap(ctx, def.cover ? 'Reskins the weapon you hold.' : "Shows over your gear's look; your gear keeps its stats.", tx, y + 32, tw - 52, { size: 6.8, color: COLORS.muted, lineHeight: 8.5 });
    label = 'Wear';
  } else {
    const desc = def.star ? `Throwing stars, attack +${def.star.watk}. The first set in your bag is thrown.` : def.desc ?? '';
    wrap(ctx, desc, tx, y + 23, tw - (tab === 'use' ? 52 : 0), { size: 6.8, color: COLORS.muted, lineHeight: 8.5 });
    if (def.price) text(ctx, `Sells for ${sellPrice(entry.id).toLocaleString()} gold each`, tx, y + h - 7, { size: 6.5, bold: true, color: COLORS.gold });
    if (tab === 'use') label = def.star ? 'Throw' : def.scroll ? 'Apply' : 'Use';
  }
  if (label && index >= 0 && button(ui, x + w - 50, y + h - 20, 44, 15, label, { primary: true, size: 7.5 })) activate(state, world, tab, index);
}

function activate(state, world, tab, index) {
  const char = world.char;
  const bag = state.windows.bag;
  const entry = char.inventory[tab][index];
  if (!entry) return;
  if (tab === 'equip') {
    const why = equipBlocker(char, entry);
    if (why) world.log(`Can't equip: ${why}.`, '#ffb3c6');
    else {
      equipFromBag(char, index);
      bag.sel = -1;
    }
  } else if (tab === 'cash') {
    wearOutfit(char, index);
    bag.sel = -1;
    bag.view = 1;
  } else if (tab === 'use') {
    const def = ITEMS[entry.id];
    if (def.star) {
      // Picks the set a gauntlet throws: it moves to the front of the tab.
      if (char.level < def.reqLevel) world.log(`${def.name} need level ${def.reqLevel}.`, '#ffb3c6');
      else {
        char.inventory.use.splice(index, 1);
        char.inventory.use.unshift(entry);
        bag.sel = 0;
        world.log(`Now throwing ${def.name}.`, def.color);
      }
    } else if (def.scroll) {
      state.scrollMode = entry.id;
      bag.tab = 0;
      bag.sel = -1;
    } else {
      useItem(world, entry.id);
    }
  }
}

function scrollOnto(state, world, inst) {
  const scroll = ITEMS[state.scrollMode];
  const r = applyScroll(inst, scroll);
  if (!r.used) {
    world.log(inst.slotsLeft <= 0 ? 'No upgrade slots left.' : "That charm doesn't fit this item.", '#ffb3c6');
    return;
  }
  removeItem(world.char.inventory, state.scrollMode, 1);
  world.log(r.ok ? `The charm worked! ${itemName(inst)} +${inst.upgrades}` : 'The charm fizzled...', r.ok ? '#7ee081' : '#ffb3c6');
  world.fx.push({ kind: 'buff', x: world.body.x, y: world.body.y, t: 0, dur: 0.7, color: r.ok ? '#7ee081' : '#ff9ec0' });
  state.scrollMode = null;
}
