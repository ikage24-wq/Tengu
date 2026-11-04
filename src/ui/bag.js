// The Bag window (I): your equipment on the left and your items on the right.
//
// Left: the hero in a well with the eight gear slots around them (or the outfit pieces worn over
// the gear, on the Outfit tab), and under them your totals. Hovering, picking or dragging a piece
// in the bag tries it on the hero, lights the slot it goes in, and shows how each total would
// change.
// Right: the item tabs and Sort, a grid of item cells (shared with every other item list through
// kit.js `itemSlot`), how full the tab is, and a detail strip for the hovered or picked item: a
// big icon, what it is, its stats against what you're wearing (or what it does, which hotkey it's
// on, which quest wants it), and what you can do with it.
// Footer: gold, Cash, and a bin to throw things away (it always asks first).
//
// Items drag: onto a cell to move or merge, onto the hero to wear, onto a hotkey to bind a
// potion, onto the bin to throw away; gear dragged off the hero into the grid comes off. A press
// arms the drag and it only starts once the mouse moves, so clicks and double-clicks still work.

import { ITEMS, RARITIES, ELEMENT_NAMES, variantsFor } from '../data/items.js';
import { equipFromBag, unequip, equipBlocker, wearOutfit, removeOutfit, wornGear, stats } from '../core/character.js';
import { itemName } from '../core/items.js';
import { sortTab, moveItem, TAB_SIZE } from '../core/inventory.js';
import { questsWanting } from '../core/quests.js';
import { useItem, dropItem as dropOnGround } from '../world/world.js';
import { drawHero } from '../render/hero.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, THEMES, windowFrame, button, tabs, text, box, bar, hover, clicked, tooltip, wrap, well, icon, sparkle, itemSlot, itemShadow, fit, textFont } from './kit.js';
import { itemTooltip, sellPrice } from './tooltips.js';
import { equipTool, toolEquipped } from '../core/crafting.js';
import { hotkeyAt } from './hud.js';

const W = 332;
const H = 264;
const CELL = 24;
const SLOT = 22;
const TAB_KEYS = ['equip', 'use', 'etc', 'cash'];
const TAB_NAMES = ['Equip', 'Use', 'Etc', 'Cash'];
const SLOT_NAMES = { hat: 'Hat', face: 'Face', top: 'Top', bottom: 'Bottom', shoes: 'Shoes', weapon: 'Weapon', gloves: 'Gloves', cape: 'Cape', earring: 'Earring', ring: 'Ring', charm: 'Charm' };
const GREEN = '#2f9f58';
const MINT = THEMES.mint;
const LAV = THEMES.lavender;

// The paper doll: four slots down each side of the hero.
// (A fifth down each side: the bench-made ring and charm, data/crafting.js.)
const LEFT = ['hat', 'top', 'bottom', 'shoes', 'ring'];
// The outfit doll has a face slot too (glasses, masks), under the hat.
const OUTFIT_LEFT = ['hat', 'face', 'top', 'bottom', 'shoes'];
const RIGHT = ['weapon', 'gloves', 'cape', 'earring', 'charm'];

// What an empty slot shows, greyed.
const SLOT_GHOST = { hat: 'hat_0', face: 'look_casual_glasses_face', top: 'top_0', bottom: 'bottom_0', shoes: 'shoes_0', weapon: 'sword_0', gloves: 'gloves_0', cape: 'cape_0', earring: 'ear_5', ring: 'ring_copper', charm: 'charm_oak' };

// Short stat names for the compare chips, in the order they show.
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

// Better than what's worn in every stat it touches (and worse in none).
const isUpgrade = (char, inst) => {
  const c = compareStats(char, inst);
  return c.some(([, , d]) => d > 0) && !c.some(([, , d]) => d < 0);
};

// The hotkey a Use item is bound to, as its label ("1", "Q"), or null.
const hotkeyOf = (char, id) => {
  const k = Object.entries(char.hotkeys ?? {}).find(([, b]) => b?.item === id)?.[0];
  return k ? k.replace('Key', '').replace('Digit', '') : null;
};

const bagOf = (state) => state.windows.bag;

// A key for "have I seen this": equipment by its own id, stacks by item.
const seenKey = (tab, e) => (e.uid != null ? `u${e.uid}` : `${tab}:${e.id}`);

function allKeys(char) {
  const keys = new Set();
  for (const k of TAB_KEYS) for (const e of char.inventory[k] ?? []) keys.add(seenKey(k, e));
  return keys;
}

export function bagWindow(ui, state, world) {
  const win = state.windows.bag;
  const char = world.char;
  // Whatever was in the bag when it last closed counts as seen (the first time, everything does).
  // The manager only draws open windows, so a gap since the last frame means it was closed.
  if (win.lastDrawn == null || world.now - win.lastDrawn > 0.25 || world.now < win.lastDrawn) {
    win.seen = win.lastKeys ?? allKeys(char);
    win.carry = null;
    win.confirm = null;
    win.dropAsk = null;
  }
  win.lastDrawn = world.now;
  win.lastKeys = allKeys(char);
  if (!windowFrame(ui, win, W, H, 'Bag')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const ox = win.x;
  const oy = win.y;
  const m = ui.mouse;

  // ---- Layout ----
  const lx = ox + 7;
  const lw = 110;
  const rx = ox + 124;
  const rw = W - 131;
  const gx = rx + Math.floor((rw - 8 * CELL) / 2);
  const gy = oy + 45;
  const doll = { x: lx, y: oy + 45, w: lw, h: 126 };
  const fy = oy + H - 23;
  const bin = { x: ox + W - 31, y: fy - 1, w: 22, h: 18 };
  const cellAt = (x, y) => {
    const c = Math.floor((x - gx) / CELL);
    const r = Math.floor((y - gy) / CELL);
    return c >= 0 && c < 8 && r >= 0 && r < TAB_SIZE / 8 ? r * 8 + c : -1;
  };

  // ---- What the mouse is on, read first so the doll can preview it ----
  const tabWas = win.tab ?? 0;
  const tab = TAB_KEYS[tabWas];
  const list = char.inventory[tab] ?? [];
  const drag = win.carry?.live ? win.carry : null;
  const hotIndex = drag ? -1 : cellAt(m.x, m.y);
  const dragged = drag?.from === 'bag' ? list[drag.index] : null;
  const focusIndex = dragged ? drag.index : list[hotIndex] ? hotIndex : win.sel;
  const focus = list[focusIndex] ?? null;
  const tryOn = focus && (tab === 'equip' || tab === 'cash') ? focus : null;

  // ---- Equipment (left) ----
  win.view = tabs(ui, lx + 9, oy + 26, ['Gear', 'Outfit'], win.view ?? 0, { w: 45, h: 13 });
  const outfit = win.view === 1;
  well(ctx, doll.x, doll.y, doll.w, doll.h, th);
  // The hero, wearing whatever you're pointing at in the bag.
  let gear = wornGear(char);
  const fits = tryOn && (tab === 'cash' || !equipBlocker(char, tryOn));
  const trial = fits && tab === 'equip' ? { ...char, equipment: { ...char.equipment, [ITEMS[tryOn.id].slot]: tryOn } } : null;
  if (trial) gear = wornGear(trial);
  if (fits && tab === 'cash') gear = wornGear(char, { [ITEMS[tryOn.id].slot]: tryOn });
  // Dragging something wearable: the well lights up to take it.
  const wearable = dragged && (tab === 'equip' || tab === 'cash');
  const overDoll = hover(ui, doll.x, doll.y, doll.w, doll.h);
  if (wearable) box(ctx, doll.x + 1, doll.y + 1, doll.w - 2, doll.h - 2, { fill: overDoll ? 'rgba(255,216,79,0.22)' : null, edge: COLORS.select, r: 7, width: overDoll ? 2.5 : 1.5 });
  // A soft spotlight on the floor, then the hero.
  const cx = lx + lw / 2;
  const g = ctx.createRadialGradient(cx, oy + 108, 2, cx, oy + 108, 46);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(lx + 26, oy + 60, lw - 52, 104);
  ctx.fillStyle = 'rgba(90,63,122,0.13)';
  ctx.beginPath();
  ctx.ellipse(cx, oy + 160, 17, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  drawHero(ctx, char.appearance, gear, cx, oy + 160, { pose: 'idle', time: world.now, scale: 1.2 });
  if (fits) {
    const label = wearable ? (overDoll ? 'Drop to wear' : 'Drag here to wear') : 'Trying on';
    ctx.font = textFont(6.5, true);
    const tw = ctx.measureText(label).width + 10;
    box(ctx, cx - tw / 2, oy + 48, tw, 10, { fill: th.main, edge: null, r: 5 });
    text(ctx, label, cx, oy + 55.6, { size: 6.5, bold: true, align: 'center', color: '#ffffff', outline: th.ink });
  }
  const target = tryOn && ((tab === 'equip' && !outfit) || (tab === 'cash' && outfit)) ? ITEMS[tryOn.id].slot : null;
  const worn = outfit ? char.outfit ?? {} : char.equipment;
  const left = outfit ? OUTFIT_LEFT : LEFT;
  const step = 24;
  // (The outfit doll has no ring or charm.)
  const right = outfit ? RIGHT.filter((s) => s !== 'charm') : RIGHT;
  [...left.map((s, i) => [s, lx + 4, i]), ...right.map((s, i) => [s, lx + lw - 4 - SLOT, i])].forEach(([slot, x, i]) => {
    dollSlot(ui, state, world, slot, x, oy + 51 + i * step, worn[slot], outfit, slot === target, win);
  });

  // Your totals, and how they'd change with the piece you're trying on.
  statPanel(ui, char, trial, lx, oy + 175, lw, 61, th, world);

  // ---- Items: tabs, sort, grid, capacity ----
  // Tabs holding something new sparkle.
  const fresh = TAB_KEYS.map((k) => (char.inventory[k] ?? []).some((e) => !win.seen.has(seenKey(k, e))));
  win.tab = tabs(ui, rx + 2, oy + 26, TAB_NAMES, tabWas, { w: 37, h: 13 });
  fresh.forEach((f, i) => f && i !== win.tab && sparkle(ctx, rx + 2 + i * 39 + 34, oy + 26, 2.6, '#ff6fae'));
  if (win.tab !== tabWas) Object.assign(win, { sel: -1, carry: null, confirm: null, dropAsk: null });
  const sortX = rx + rw - 34;
  if (button(ui, sortX, oy + 24, 34, 16, 'Sort', { size: 7.5 })) {
    const picked = list[win.sel];
    sortTab(char.inventory, tab);
    win.sel = picked ? list.indexOf(picked) : -1;
  }
  if (hover(ui, sortX, oy + 24, 34, 16)) tooltip(ui, [{ text: 'Sort this tab', bold: true }, { text: 'Merges stacks and lines items up by kind.', color: COLORS.muted, size: 8 }]);

  const dropCell = drag ? cellAt(m.x, m.y) : -1;
  // Dropping past the last item lands it at the end, so that's the cell that lights.
  const dropAt = dropCell < 0 ? -1 : Math.min(dropCell, Math.max(0, list.length - (drag?.from === 'bag' ? 1 : 0)));
  for (let i = 0; i < TAB_SIZE; i++) {
    gridCell(ui, state, world, tab, list, i, gx + (i % 8) * CELL, gy + Math.floor(i / 8) * CELL, win, i === dropAt);
  }

  // How full the tab is.
  const cy = gy + 4 * CELL + 2;
  const full = list.length / TAB_SIZE;
  text(ctx, `${list.length}/${TAB_SIZE}`, gx + 1, cy + 7, { size: 7, bold: true, color: full >= 1 ? COLORS.bad : th.ink });
  text(ctx, full >= 1 ? 'full!' : 'slots used', gx + 26, cy + 7, { size: 6.5, color: full >= 1 ? COLORS.bad : COLORS.muted });
  bar(ctx, gx + 72, cy + 2.5, 8 * CELL - 74, 4.5, full, full >= 1 ? COLORS.bad : full > 0.8 ? COLORS.gold : th.main, null);

  // ---- The detail strip ----
  const dy = cy + 12;
  details(ui, state, world, tab, rx, dy, rw, fy - 5 - dy, focus, drag ? -1 : focusIndex);

  // ---- Footer: gold, Cash, the bin ----
  pill(ctx, lx, fy, lw, 'coin', '#f0b53a', char.gold.toLocaleString(), COLORS.gold, '#fff6d6', '#f0cf7a');
  pill(ctx, rx - 4, fy, 104, 'star', '#ff6fae', `${(char.cash ?? 0).toLocaleString()} Cash`, '#d0559a', '#ffe6f2', '#ff8fc1');
  const overBin = hover(ui, bin.x, bin.y, bin.w, bin.h);
  const binLit = dragged && overBin;
  box(ctx, bin.x, bin.y, bin.w, bin.h, { fill: binLit ? '#ffe0e8' : overBin ? '#ffffff' : '#fbf5fd', edge: dragged ? COLORS.bad : '#e6d6ef', r: 6, width: dragged ? 1.5 : 1 });
  icon(ctx, 'trash', bin.x + bin.w / 2, bin.y + bin.h / 2 + (binLit ? -1 : 0), 11, dragged ? COLORS.bad : COLORS.muted);
  text(ctx, 'Drag out to drop', bin.x - 5, fy + 7, { size: 6.5, align: 'right', color: COLORS.muted });
  text(ctx, 'Bin: throw away', bin.x - 5, fy + 14.5, { size: 6.5, align: 'right', color: COLORS.muted });
  if (overBin && !drag) tooltip(ui, [{ text: 'Throw away', bold: true }, { text: 'Drag an item here, or pick one and click.', size: 8, color: COLORS.muted }, { text: 'You will be asked first.', size: 8, color: COLORS.muted }]);
  if (!drag && clicked(ui, bin.x, bin.y, bin.w, bin.h) && list[win.sel]) Object.assign(win, { confirm: { tab, entry: list[win.sel] }, dropAsk: null });

  // ---- Dragging ----
  if (win.carry) {
    const d = win.carry;
    if (m.down) {
      if (!d.live && Math.hypot(m.x - d.x0, m.y - d.y0) > 4) d.live = true;
    } else {
      if (d.live) placeCarried(world, win, d, { cell: cellAt(m.x, m.y), doll: overDoll, key: hotkeyAt(m.x, m.y), bin: overBin, ground: overGround(ui, state, win) });
      win.carry = null;
    }
  }
  if (win.carry?.live) {
    // The item rides the cursor, lifted, over everything in the window.
    const d = win.carry;
    const inst = d.from === 'bag' ? list[d.index] : (d.outfit ? char.outfit : char.equipment)?.[d.slot];
    if (!inst) win.carry = null;
    else {
      itemShadow(ctx, m.x, m.y + 10);
      drawItemIcon(ctx, inst.id, m.x - 8, m.y - 11, 1, inst.variant);
      const ground = d.from === 'bag' && overGround(ui, state, win);
      const hint = d.from === 'bag' && hotkeyAt(m.x, m.y) && tab === 'use' ? 'Set hotkey' : d.from === 'bag' && overBin ? 'Throw away?' : ground ? (tab === 'cash' ? "Can't drop Cash items" : 'Drop on the ground') : null;
      if (hint) {
        ctx.font = textFont(6.5, true);
        const tw = ctx.measureText(hint).width + 10;
        const fill = hint === 'Set hotkey' ? LAV.main : hint === 'Drop on the ground' ? THEMES.peach.dark : COLORS.bad;
        box(ctx, m.x - tw / 2, m.y - 25, tw, 10, { fill, edge: null, r: 5 });
        text(ctx, hint, m.x, m.y - 17.5, { size: 6.5, bold: true, align: 'center', color: '#ffffff' });
      }
    }
  }
}

// Is the mouse over the game world: outside every open window and above the HUD bar? A bag
// item let go there drops on the ground.
function overGround(ui, state, win) {
  const m = ui.mouse;
  if (m.y >= 326 || m.y < 0 || m.x < 0 || m.x >= 640) return false;
  return !Object.values(state.windows).some((w) => w.open && w.w && m.x >= w.x && m.x < w.x + w.w && m.y >= w.y && m.y < w.y + w.h);
}

// Drops the bag item in cell `index` on the ground: one item goes at once; for a stack, the
// detail strip asks how many first.
function askDrop(world, win, tab, index) {
  const entry = world.char.inventory[tab]?.[index];
  if (!entry) return;
  if (tab === 'cash') world.log("Cash items are yours to keep: they can't be dropped.", '#ffb3c6');
  else if (entry.qty > 1) Object.assign(win, { confirm: null, dropAsk: { tab, entry, qty: entry.qty } });
  else if (dropOnGround(world, tab, index)) win.sel = -1;
}

// Lets go of a dragged item: on a bag cell it moves (or merges), on the doll it's worn, on a
// hotkey a Use item is bound, on the bin it asks to throw it away, and out over the world it
// drops on the ground; a piece dragged off the doll onto the grid is taken off.
function placeCarried(world, win, d, at) {
  const char = world.char;
  const tab = TAB_KEYS[win.tab];
  if (d.from === 'bag') {
    const entry = char.inventory[tab][d.index];
    if (!entry) return;
    if (at.cell >= 0) {
      if (moveItem(char.inventory, tab, d.index, at.cell)) win.sel = Math.min(at.cell, char.inventory[tab].length - 1);
    } else if (at.doll && (tab === 'equip' || tab === 'cash')) {
      activate({ windows: { bag: win } }, world, tab, d.index);
    } else if (at.bin) {
      Object.assign(win, { confirm: { tab, entry }, dropAsk: null });
    } else if (at.key && tab === 'use') {
      for (const [k, b] of Object.entries(char.hotkeys)) if (b?.item === entry.id) delete char.hotkeys[k];
      char.hotkeys[at.key] = { item: entry.id };
      world.log(`${ITEMS[entry.id].name} set to ${at.key.replace('Key', '').replace('Digit', '')}.`, '#d4cbe8');
    } else if (at.ground) {
      askDrop(world, win, tab, d.index);
    }
  } else if (at.cell >= 0) {
    const ok = d.outfit ? removeOutfit(char, d.slot) : unequip(char, d.slot);
    if (!ok) world.log(d.outfit ? 'Your Cash tab is full.' : 'Your bag is full.', '#ffb3c6');
  }
}

function pill(ctx, x, y, w, iconName, iconColor, label, color, fill, edge) {
  box(ctx, x, y, w, 16, { fill, edge, r: 8 });
  icon(ctx, iconName, x + 10, y + 8, 9, iconColor);
  text(ctx, label, x + w / 2 + 5, y + 11.5, { size: 8.5, bold: true, align: 'center', color });
}

// Totals that gear changes, two to a row; while trying something on, each shows its change.
const PANEL_STATS = [['ATK', 'watk'], ['M.ATK', 'matk'], ['DEF', 'wdef'], ['M.DEF', 'mdef'], ['HP', 'maxHp'], ['MP', 'maxMp'], ['STR', 'str'], ['DEX', 'dex'], ['INT', 'int'], ['LUK', 'luk']];
function statPanel(ui, char, trial, x, y, w, h, th, world) {
  const { ctx } = ui;
  box(ctx, x, y, w, h, { fill: '#ffffff', edge: th.light, r: 7, width: 1.2 });
  box(ctx, x + w / 2 - 0.5, y + 5, 1, h - 10, { fill: th.light, edge: null, r: 0.5 });
  const now = stats(char, world.now);
  const next = trial ? stats(trial, world.now) : null;
  const cw = w / 2;
  PANEL_STATS.forEach(([label, k], i) => {
    const cx = x + (i % 2) * cw;
    const ry = y + 11 + Math.floor(i / 2) * 11;
    const d = next ? next[k] - now[k] : 0;
    text(ctx, label, cx + 6, ry, { size: 6.5, bold: true, color: COLORS.muted });
    text(ctx, (next ? next[k] : now[k]).toLocaleString(), cx + cw - (d ? 19 : 6), ry, { size: 7, bold: true, align: 'right', color: d > 0 ? GREEN : d < 0 ? COLORS.bad : COLORS.ink });
    if (d) text(ctx, `${d > 0 ? '+' : ''}${d}`, cx + cw - 17.5, ry, { size: 6, bold: true, color: d > 0 ? GREEN : COLORS.bad });
  });
}

// One equipment slot on the doll. `lit` marks the slot the hovered bag item would go in.
function dollSlot(ui, state, world, slot, x, y, inst, outfit, lit, win) {
  const { ctx } = ui;
  const char = world.char;
  const hot = hover(ui, x, y, SLOT, SLOT);
  if (lit) {
    const k = 0.5 + 0.5 * Math.sin(world.now * 6);
    box(ctx, x - 2, y - 2, SLOT + 4, SLOT + 4, { fill: null, edge: COLORS.select, r: 7, width: 1.5 + k });
  }
  itemSlot(ctx, x, y, SLOT, inst, { state: hot ? 'hot' : null, ghost: SLOT_GHOST[slot], fill: outfit ? '#fff0f7' : '#fffdfb', edge: outfit ? '#f6c6de' : '#eadcf3' });
  if (hot && !win.carry?.live) tooltip(ui, inst ? [...itemTooltip(char, inst.id, inst), { text: 'Double-click, or drag it into the bag, to take off', color: COLORS.muted, size: 8 }] : [{ text: `${SLOT_NAMES[slot]}${outfit ? ' outfit' : ''}`, bold: true }, { text: outfit ? 'Wear cash items from the Cash tab.' : 'Nothing worn here', size: 8, color: COLORS.muted }]);
  // Read the click once: clicked() uses it up. A press also arms a drag back into the bag.
  const press = inst && clicked(ui, x, y, SLOT, SLOT);
  const hit = press || (inst && ui.mouse.right && hot);
  if (!hit) return;
  if (press) win.carry = { from: 'doll', slot, outfit, x0: ui.mouse.x, y0: ui.mouse.y, live: false };
  const key = `${outfit ? 'of' : 'eq'}:${slot}`;
  const dbl = ui.mouse.right || ui.mouse.double || (state.lastClick?.key === key && world.now - state.lastClick.at < 0.4);
  if (dbl) {
    const ok = outfit ? removeOutfit(char, slot) : unequip(char, slot);
    if (!ok) world.log(outfit ? 'Your Cash tab is full.' : 'Your bag is full.', '#ffb3c6');
    state.lastClick = null;
  } else state.lastClick = { key, at: world.now };
}

// A small badge in a cell's top-left corner.
function chip(ctx, x, y, label, fill) {
  ctx.font = textFont(5, true);
  const w = Math.max(8, ctx.measureText(label).width + 5);
  box(ctx, x - 1, y - 2, w, 7.5, { fill, edge: '#ffffff', r: 3.75, width: 1 });
  text(ctx, label, x - 1 + w / 2, y + 3.6, { size: 5, bold: true, align: 'center', color: '#ffffff' });
}

// One cell of the item grid.
function gridCell(ui, state, world, tab, list, i, x, y, win, dropHere) {
  const { ctx } = ui;
  const char = world.char;
  const entry = list[i];
  const hot = hover(ui, x, y, CELL - 1, CELL - 1) && !win.carry?.live;
  const lifted = win.carry?.live && win.carry.from === 'bag' && win.carry.index === i;
  itemSlot(ctx, x, y, CELL - 1, entry, { state: dropHere ? 'target' : win.sel === i ? 'selected' : hot ? 'hot' : null });
  if (!entry) return;
  const def = ITEMS[entry.id];
  // The item being dragged leaves a faded copy behind.
  if (lifted) box(ctx, x + 1, y + 1, CELL - 3, CELL - 3, { fill: 'rgba(255,253,251,0.72)', edge: null, r: 4 });
  if (tab === 'equip' && equipBlocker(char, entry)) {
    // Can't wear it (yet): a pink wash.
    box(ctx, x + 1, y + 1, CELL - 3, CELL - 3, { fill: 'rgba(255,107,138,0.16)', edge: null, r: 4 });
  } else if (tab === 'equip' && isUpgrade(char, entry)) {
    // Better in every way than what you wear: a green arrow badge.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 5.5, y + CELL - 6.5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.good;
    ctx.beginPath();
    ctx.arc(x + 5.5, y + CELL - 6.5, 3.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 3.6, y + CELL - 5.6);
    ctx.lineTo(x + 5.5, y + CELL - 8.6);
    ctx.lineTo(x + 7.4, y + CELL - 5.6);
    ctx.fill();
  }
  // One badge in the top-left corner, most important first.
  const key = tab === 'use' ? hotkeyOf(char, entry.id) : null;
  if (!win.seen.has(seenKey(tab, entry))) {
    chip(ctx, x, y, 'NEW', '#ff6fae');
    if (hot) win.seen.add(seenKey(tab, entry));
  } else if (tab === 'etc' && questsWanting(char, entry.id).length) chip(ctx, x, y, '!', MINT.dark);
  else if (key) chip(ctx, x, y, key, LAV.main);
  // No tooltip here: the detail strip under the grid shows the hovered item.
  const right = ui.mouse.right && hot;
  if (clicked(ui, x, y, CELL, CELL) || right) {
    const dbl = right || ui.mouse.double || (state.lastClick?.key === `${tab}:${i}` && world.now - state.lastClick.at < 0.4);
    win.sel = i;
    win.confirm = null;
    win.dropAsk = null;
    state.lastClick = { key: `${tab}:${i}`, at: world.now };
    if (!right) win.carry = { from: 'bag', index: i, x0: ui.mouse.x, y0: ui.mouse.y, live: false };
    if (dbl) activate(state, world, tab, i);
  }
}

// The strip under the grid: the hovered (or picked) item in full, and what to do with it.
function details(ui, state, world, tab, x, y, w, h, entry, index) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  well(ctx, x, y, w, h, th);

  // Dropping a stack on the ground: how many?
  const ask = bagOf(state).dropAsk;
  if (ask) {
    const list = char.inventory[ask.tab];
    const at = list.indexOf(ask.entry);
    if (at < 0) bagOf(state).dropAsk = null;
    else {
      const max = ask.entry.qty;
      ask.qty = Math.max(1, Math.min(max, ask.qty));
      itemSlot(ctx, x + 6, y + 6, 40, { ...ask.entry, qty: ask.qty }, { scale: 2, shadow: false, edge: THEMES.peach.main });
      text(ctx, 'Drop how many?', x + 52, y + 15, { size: 8.5, bold: true, color: THEMES.peach.ink });
      text(ctx, fit(ctx, `${itemName(ask.entry.id)} (you have ${max})`, w - 58, 7), x + 52, y + 25, { size: 7, color: COLORS.muted });
      // A stepper: - [n] +, then All; the wheel works over the number too.
      const sx = x + 52;
      const sy = y + 31;
      if (button(ui, sx, sy, 16, 15, '−', { size: 9 })) ask.qty -= ui.input.held?.has('ShiftLeft') ? 10 : 1;
      box(ctx, sx + 19, sy, 40, 13, { fill: '#ffffff', edge: THEMES.peach.light, r: 6.5, width: 1.2 });
      text(ctx, `${ask.qty}`, sx + 39, sy + 9.5, { size: 8.5, bold: true, align: 'center', color: COLORS.ink });
      if (hover(ui, sx + 19, sy, 40, 13)) ask.qty -= ui.mouse.wheel;
      if (button(ui, sx + 62, sy, 16, 15, '+', { size: 9 })) ask.qty += ui.input.held?.has('ShiftLeft') ? 10 : 1;
      // (Ten at a tap, for a phone with no Shift key.)
      if (button(ui, sx + 81, sy, 24, 15, '+10', { size: 6.5 })) ask.qty += 10;
      if (button(ui, sx + 108, sy, 26, 15, 'All', { size: 7 })) ask.qty = max;
      ask.qty = Math.max(1, Math.min(max, ask.qty));
      text(ctx, ui.input?.touch ? 'It stays on the ground for a while; Loot picks it back up.' : 'It stays on the ground for a while; X picks it back up.', x + 52, y + h - 26, { size: 6, color: COLORS.muted });
      if (button(ui, x + w - 104, y + h - 20, 50, 15, 'Cancel', { size: 7.5 })) bagOf(state).dropAsk = null;
      if (button(ui, x + w - 50, y + h - 20, 44, 15, 'Drop', { theme: 'peach', size: 7.5 })) {
        if (dropOnGround(world, ask.tab, at, ask.qty)) bagOf(state).sel = -1;
        bagOf(state).dropAsk = null;
      }
      return;
    }
  }
  // Throwing something away always asks first.
  const c = bagOf(state).confirm;
  if (c) {
    const list = char.inventory[c.tab];
    const at = list.indexOf(c.entry);
    if (at < 0) {
      bagOf(state).confirm = null;
    } else {
      itemSlot(ctx, x + 6, y + 6, 40, c.entry, { scale: 2, shadow: false, edge: COLORS.bad });
      text(ctx, 'Throw this away?', x + 52, y + 15, { size: 8.5, bold: true, color: COLORS.bad });
      const name = `${itemName(c.entry.uid ? c.entry : c.entry.id)}${c.entry.qty > 1 ? ` x${c.entry.qty}` : ''}`;
      text(ctx, fit(ctx, name, w - 58, 7.5), x + 52, y + 26, { size: 7.5, bold: true, color: COLORS.ink });
      wrap(ctx, c.tab === 'cash' ? "It's gone for good, Cash and all." : "It's gone for good. Shops pay for most things instead.", x + 52, y + 36, w - 58, { size: 6.5, color: COLORS.muted, lineHeight: 8.5 });
      if (button(ui, x + w - 104, y + h - 20, 50, 15, 'Keep it', { size: 7.5 })) bagOf(state).confirm = null;
      if (button(ui, x + w - 50, y + h - 20, 44, 15, 'Throw', { theme: 'pink', size: 7.5 })) {
        list.splice(at, 1);
        world.log(`Threw away ${name}.`, '#ffb3c6');
        bagOf(state).confirm = null;
        bagOf(state).sel = -1;
      }
      return;
    }
  }
  if (!entry) {
    icon(ctx, 'bag', x + w / 2, y + h / 2 - 10, 16, th.light);
    const touch = ui.input?.touch;
    text(ctx, touch ? 'Tap an item to see it here.' : 'Hover an item to see it here.', x + w / 2, y + h / 2 + 8, { size: 7.5, bold: true, align: 'center', color: COLORS.muted });
    text(ctx, touch ? 'Double-tap to use or equip · Loot picks up drops' : 'Double-click to use or equip · X picks up loot', x + w / 2, y + h / 2 + 18, { size: 6.5, align: 'center', color: COLORS.muted });
    return;
  }
  const def = ITEMS[entry.id];
  // A big icon in a cell ringed in the item's rarity.
  itemSlot(ctx, x + 6, y + 6, 40, entry, { scale: 2, shadow: false });
  const tx = x + 52;
  const tw = w - 58;
  const rare = entry.rarity ? RARITIES[entry.rarity].color : null;
  const name = itemName(entry.uid ? entry : entry.id);
  text(ctx, fit(ctx, name, tw, 9), tx, y + 15, { size: 9, bold: true, color: rare ?? COLORS.ink });
  const by = y + h - 20;
  let label = null;
  let foot = null;
  if (tab === 'equip') {
    const why = equipBlocker(char, entry);
    const kind = def.slot === 'weapon' ? def.weaponType[0].toUpperCase() + def.weaponType.slice(1) : SLOT_NAMES[def.slot];
    const sub = why ? `${kind} · Can't equip: ${why}` : `${kind}${def.reqLevel ? ` · Lv ${def.reqLevel}` : ''}${entry.rarity ? ` · ${RARITIES[entry.rarity].name}` : ''}`;
    text(ctx, fit(ctx, sub, tw, 7, Boolean(why)), tx, y + 25, { size: 7, bold: Boolean(why), color: why ? COLORS.bad : COLORS.muted });
    // Stats against what you're wearing, as chips: green up, pink down.
    let sx = tx;
    let sy = y + 37;
    for (const [k, v, d] of compareStats(char, entry)) {
      const s = `${STAT_SHORT[k]} ${v}`;
      const ds = d ? ` ${d > 0 ? '+' : ''}${d}` : '';
      ctx.font = textFont(7, true);
      const sw = ctx.measureText(s).width;
      const cw = sw + (ds ? ctx.measureText(ds).width : 0) + 8;
      // A second row keeps clear of the buttons.
      if (sx + cw > tx + tw - (sy > y + 40 ? 74 : 0)) {
        if (sy > y + 40) break;
        sx = tx;
        sy += 11;
      }
      box(ctx, sx, sy - 7.5, cw, 10, { fill: d > 0 ? '#e3f8ea' : d < 0 ? '#ffe6ec' : '#f4eefa', edge: null, r: 5 });
      text(ctx, s, sx + 4, sy, { size: 7, bold: true, color: COLORS.ink });
      if (ds) text(ctx, ds, sx + 4 + sw, sy, { size: 7, bold: true, color: d > 0 ? GREEN : COLORS.bad });
      sx += cw + 3;
    }
    // The rest of what the tooltip says: color, element, and what it replaces.
    const tint = entry.variant ? variantsFor(def)?.[entry.variant] : null;
    foot = [tint && `◆ ${tint.name}`, def.element && `✦ ${ELEMENT_NAMES[def.element]}`, char.equipment[def.slot] ? `vs ${itemName(char.equipment[def.slot])}` : 'nothing worn here'].filter(Boolean).join(' · ');
    label = why ? null : 'Equip';
  } else if (tab === 'cash') {
    text(ctx, `Outfit · ${SLOT_NAMES[def.slot] ?? def.slot}`, tx, y + 25, { size: 7, color: '#d0559a', bold: true });
    wrap(ctx, def.cover ? 'Reskins the weapon you hold; its stats stay the same.' : "Shows over your gear's look; your gear keeps its stats.", tx, y + 36, tw, { size: 7, color: COLORS.muted, lineHeight: 9 });
    label = 'Wear';
  } else {
    const kind = tab === 'use' ? 'Consumable' : 'Material';
    text(ctx, `${kind}${entry.qty > 1 ? ` · ${entry.qty} in the bag` : ''}`, tx, y + 25, { size: 7, color: COLORS.muted });
    const desc = def.desc ?? '';
    let ly = wrap(ctx, desc, tx, y + 36, tw, { size: 7, color: COLORS.ink, lineHeight: 9 });
    // Which hotkey it's on, and which quests want it.
    const key = tab === 'use' ? hotkeyOf(char, entry.id) : null;
    if (key) {
      chip(ctx, tx + 1, ly - 4.5, key, LAV.main);
      text(ctx, 'On your hotkey bar', tx + 12, ly + 1, { size: 6.5, bold: true, color: LAV.dark });
      ly += 9;
    }
    for (const q of questsWanting(char, entry.id).slice(0, 1)) {
      chip(ctx, tx + 1, ly - 4.5, '!', MINT.dark);
      text(ctx, fit(ctx, `${q.name}: ${q.have}/${q.count}`, tw - 80, 6.5), tx + 12, ly + 1, { size: 6.5, bold: true, color: MINT.ink });
    }
    if (def.price) foot = `Sells for ${sellPrice(entry.id).toLocaleString()} gold each`;
    if (tab === 'use') label = 'Use';
    // A life tool (data/crafting.js): equip it for its skill.
    if (def.life) label = toolEquipped(char, entry.id) ? null : 'Equip';
    if (def.life && toolEquipped(char, entry.id)) foot = 'In use for its skill';
  }
  if (foot) text(ctx, fit(ctx, foot, tw - (label ? 74 : 24) - (tab !== 'cash' ? 21 : 0), 6.5, false), tx, by + 11, { size: 6.5, color: tab === 'equip' ? COLORS.muted : COLORS.gold, bold: tab !== 'equip' });
  // Actions, right to left: the main one, drop on the ground, and the bin (which asks first).
  if (index >= 0) {
    let bx = x + w - (label ? 50 : 6);
    if (label && button(ui, bx, by, 44, 15, label, { primary: true, size: 7.5 })) activate(state, world, tab, index);
    if (tab !== 'cash') {
      bx -= 21;
      if (button(ui, bx, by, 18, 15, '', { size: 7.5 })) askDrop(world, bagOf(state), tab, index);
      icon(ctx, 'ground', bx + 9, by + 6.5, 9, THEMES.peach.dark);
      if (hover(ui, bx, by, 18, 15)) tooltip(ui, [{ text: 'Drop on the ground', bold: true }, { text: 'Or drag it out of the bag. X picks it back up.', size: 8, color: COLORS.muted }]);
    }
    bx -= 21;
    if (button(ui, bx, by, 18, 15, '', { size: 7.5 })) Object.assign(bagOf(state), { confirm: { tab, entry }, dropAsk: null });
    icon(ctx, 'trash', bx + 9, by + 6.5, 9, COLORS.muted);
    if (hover(ui, bx, by, 18, 15)) tooltip(ui, [{ text: 'Throw away', bold: true }, { text: 'You will be asked first.', size: 8, color: COLORS.muted }]);
  }
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
    useItem(world, entry.id);
  } else if (ITEMS[entry.id]?.life && equipTool(char, entry.id)) {
    world.log(`Now using your ${ITEMS[entry.id].name}.`, '#d8f5d0');
  }
}
