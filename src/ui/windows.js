// Player windows: Bag (inventory + equipment), Stats, Skills, and Quests.

import { ITEMS, EQUIP_SLOTS, RARITIES } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { expToNext } from '../core/exp.js';
import { physicalRange, magicRange, accuracy, avoid } from '../core/formulas.js';
import { equipFromBag, unequip, spendAp, autoAssignAp, learnSkill, canLearn, equipBlocker, STAT_KEYS, wearOutfit, removeOutfit, wornGear } from '../core/character.js';
import { applyScroll, itemName } from '../core/items.js';
import { removeItem, TAB_SIZE } from '../core/inventory.js';
import { questState, objectiveProgress } from '../core/quests.js';
import { useItem } from '../world/world.js';
import { drawHero } from '../render/hero.js';
import { drawItemIcon, drawSkillIcon, skillTone } from '../render/icons.js';
import { COLORS, THEMES, windowFrame, button, tabs, text, box, bar, hover, clicked, tooltip, wrap, well, icon, sparkle, skillPlate, rarityCell, lighten, slotEdges, itemShadow } from './kit.js';
import { itemTooltip, skillTooltip } from './tooltips.js';

const CELL = 19;
const TAB_KEYS = ['equip', 'use', 'etc', 'cash'];

function cellsFor(char, tab) {
  return char.inventory[tab] ?? [];
}

function itemIdOf(entry) {
  return entry.id;
}

// ---------- Bag ----------

const SLOT_POS = {
  hat: [6, 26], top: [6, 50], bottom: [6, 74], shoes: [6, 98],
  weapon: [74, 26], gloves: [74, 50], cape: [74, 74], earring: [74, 98],
};

// What an empty equipment slot shows, faded.
const SLOT_GHOST = { hat: 'hat_0', top: 'top_0', bottom: 'bottom_0', shoes: 'shoes_0', weapon: 'sword_0', gloves: 'gloves_0', cape: 'cape_0', earring: 'ear_5' };

export function bagWindow(ui, state, world) {
  const win = state.windows.bag;
  const W = 262;
  const H = 196;
  if (!windowFrame(ui, win, W, H, 'Bag')) return;
  const { ctx } = ui;
  const char = world.char;
  const ox = win.x;
  const oy = win.y;

  // Equipment panel with a live preview of the hero.
  const th = ui.theme;
  well(ctx, ox + 4, oy + 22, 96, 104, th);
  drawHero(ctx, char.appearance, wornGear(char), ox + 52, oy + 104, { pose: 'idle', time: world.now });
  // The slots show your gear or your outfit (the cash pieces worn over it).
  const outfit = win.view === 1;
  const worn = outfit ? char.outfit ?? {} : char.equipment;
  for (const slot of EQUIP_SLOTS) {
    const [sx, sy] = SLOT_POS[slot];
    const x = ox + sx;
    const y = oy + sy;
    const inst = worn[slot];
    const rare = inst?.rarity ? RARITIES[inst.rarity].color : null;
    box(ctx, x, y, CELL, CELL, { fill: hover(ui, x, y, CELL, CELL) ? '#ffffff' : outfit ? '#ffe6f2' : th.light, edge: state.scrollMode && inst && !outfit ? COLORS.accent : rare ?? (outfit ? '#ff8fc1' : th.main), r: 5, width: rare ? 2 : 1 });
    slotEdges(ctx, x, y, CELL, CELL, 5);
    if (inst) {
      itemShadow(ctx, x + 9.5, y + 16);
      drawItemIcon(ctx, inst.id, x + 1.5, y + 1.5, 1, inst.variant);
      rarityCell(ctx, x, y, CELL, CELL, rare, inst.rarity ?? 0, 5);
    }
    else {
      // An empty slot shows a faded outline of what goes there.
      ctx.globalAlpha = 0.25;
      drawItemIcon(ctx, SLOT_GHOST[slot], x + 1.5, y + 1.5);
      ctx.globalAlpha = 1;
    }
    if (hover(ui, x, y, CELL, CELL)) tooltip(ui, inst ? [...itemTooltip(char, inst.id, inst), { text: 'Double-click (or right-click) to take off', color: COLORS.muted, size: 8 }] : [{ text: `${slot[0].toUpperCase() + slot.slice(1)}${outfit ? ' outfit' : ''}`, bold: true }, ...(outfit ? [{ text: 'Wear cash items from the Cash tab.', size: 8, color: COLORS.muted }] : [])]);
    // Read the click once: clicked() uses it up.
    const hit = inst && (clicked(ui, x, y, CELL, CELL) || (ui.mouse.right && hover(ui, x, y, CELL, CELL)));
    const dbl = hit && (ui.mouse.right || ui.mouse.double);
    if (hit && outfit) {
      if (dbl || (state.lastClick?.key === `of:${slot}` && world.now - state.lastClick.at < 0.4)) {
        if (!removeOutfit(char, slot)) world.log('Your Cash tab is full.', '#ffb3c6');
        state.lastClick = null;
      } else state.lastClick = { key: `of:${slot}`, at: world.now };
    } else if (hit) {
      if (state.scrollMode) {
        scrollOnto(state, world, inst);
      } else if (dbl || (state.lastClick?.key === `eq:${slot}` && world.now - state.lastClick.at < 0.4)) {
        if (!unequip(char, slot)) world.log('Your bag is full.', '#ffb3c6');
        state.lastClick = null;
      } else {
        state.lastClick = { key: `eq:${slot}`, at: world.now };
      }
    }
  }
  box(ctx, ox + 10, oy + 131, 84, 15, { fill: '#fff6d6', edge: '#f0cf7a', r: 7.5 });
  icon(ctx, 'coin', ox + 19, oy + 138.5, 9, '#f0b53a');
  text(ctx, char.gold.toLocaleString(), ox + 56, oy + 142, { size: 9, bold: true, align: 'center', color: COLORS.gold });
  win.view = tabs(ui, ox + 9, oy + 154, ['Gear', 'Outfit'], win.view ?? 0, { w: 41, h: 12 });
  box(ctx, ox + 10, oy + 172, 84, 15, { fill: '#ffe6f2', edge: '#ff8fc1', r: 7.5 });
  icon(ctx, 'star', ox + 19, oy + 179.5, 9, '#ff6fae');
  text(ctx, `${(char.cash ?? 0).toLocaleString()} Cash`, ox + 56, oy + 183, { size: 8.5, bold: true, align: 'center', color: '#d0559a' });

  // Tabs and grid.
  const gx = ox + 106;
  const tabWas = win.tab ?? 0;
  win.tab = tabs(ui, gx, oy + 22, ['Equip', 'Use', 'Etc', 'Cash'], tabWas, { w: 35 });
  // A selection belongs to its tab.
  if (win.tab !== tabWas) win.sel = -1;
  const tab = TAB_KEYS[win.tab];
  const list = cellsFor(char, tab);
  for (let i = 0; i < TAB_SIZE; i++) {
    const x = gx + (i % 8) * CELL;
    const y = oy + 40 + Math.floor(i / 8) * CELL;
    const entry = list[i];
    const sel = win.sel === i;
    const rare = tab === 'equip' && entry?.rarity ? RARITIES[entry.rarity].color : null;
    const hot = hover(ui, x, y, CELL - 1, CELL - 1);
    box(ctx, x, y, CELL - 1, CELL - 1, { fill: sel ? '#fff3c4' : hot ? '#ffffff' : '#fffdfb', edge: sel ? COLORS.select : rare ?? th.light, r: 4, width: sel || rare ? 2 : 1 });
    slotEdges(ctx, x, y, CELL - 1, CELL - 1);
    if (!entry) continue;
    itemShadow(ctx, x + 9, y + 15.5);
    drawItemIcon(ctx, itemIdOf(entry), x + 1, y + 1, 1, entry.variant);
    rarityCell(ctx, x, y, CELL - 1, CELL - 1, rare, entry.rarity ?? 0);
    if (entry.qty > 1) text(ctx, `${entry.qty}`, x + CELL - 3, y + CELL - 3, { size: 7, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
    if (tab === 'equip' && equipBlocker(char, entry)) {
      ctx.fillStyle = 'rgba(255,107,138,0.18)';
      ctx.fillRect(x, y, CELL - 1, CELL - 1);
    }
    if (hover(ui, x, y, CELL, CELL)) {
      const hint = tab === 'equip' ? 'Double-click to equip' : tab === 'cash' ? 'Double-click to wear' : tab === 'use' ? (ITEMS[entry.id].star ? 'Double-click to throw this set' : 'Double-click to use · press a hotkey to bind') : null;
      tooltip(ui, [...itemTooltip(char, entry.id, tab === 'equip' || tab === 'cash' ? entry : null), ...(hint ? [{ text: hint, color: COLORS.muted, size: 8 }] : [])]);
    }
    const right = ui.mouse.right && hover(ui, x, y, CELL, CELL);
    if (clicked(ui, x, y, CELL, CELL) || right) {
      const dbl = right || ui.mouse.double || (state.lastClick?.key === `${tab}:${i}` && world.now - state.lastClick.at < 0.4);
      win.sel = i;
      state.lastClick = { key: `${tab}:${i}`, at: world.now };
      if (state.scrollMode && tab === 'equip') scrollOnto(state, world, entry);
      else if (dbl) activate(state, world, tab, i);
    }
  }

  // Info strip for the selection.
  const selEntry = list[win.sel];
  const iy = oy + 122;
  well(ctx, gx, iy, 152, 66, th);
  if (state.scrollMode) {
    wrap(ctx, `Click a piece of equipment to use ${ITEMS[state.scrollMode].name}.`, gx + 6, iy + 13, 140, { size: 8, color: COLORS.accent });
    if (button(ui, gx + 6, iy + 46, 60, 14, 'Cancel')) state.scrollMode = null;
  } else if (selEntry) {
    const def = ITEMS[selEntry.id];
    text(ctx, itemName(selEntry.uid ? selEntry : selEntry.id), gx + 6, iy + 13, { size: 9, bold: true });
    const about = tab === 'equip' ? (equipBlocker(char, selEntry) ?? 'Ready to equip.') : tab === 'cash' ? `Outfit for your ${def.slot}. Wear it over your gear's look.` : def.desc ?? '';
    wrap(ctx, about, gx + 6, iy + 25, 140, { size: 8, color: COLORS.muted });
    const label = tab === 'equip' ? 'Equip' : tab === 'cash' ? 'Wear' : tab === 'use' ? (def.star ? 'Throw' : 'Use') : null;
    if (label && button(ui, gx + 6, iy + 46, 50, 14, label, { primary: true })) activate(state, world, tab, win.sel);
  } else {
    wrap(ctx, 'Pick up loot with X. Double-click (or right-click) an item to use it.', gx + 6, iy + 13, 140, { size: 8, color: COLORS.muted });
  }
}

function activate(state, world, tab, index) {
  const char = world.char;
  const entry = char.inventory[tab][index];
  if (!entry) return;
  if (tab === 'equip') {
    const why = equipBlocker(char, entry);
    if (why) world.log(`Can't equip: ${why}.`, '#ffb3c6');
    else {
      equipFromBag(char, index);
      state.windows.bag.sel = -1;
    }
  } else if (tab === 'cash') {
    wearOutfit(char, index);
    state.windows.bag.sel = -1;
    state.windows.bag.view = 1;
  } else if (tab === 'use') {
    const def = ITEMS[entry.id];
    if (def.star) {
      // Picks the set a gauntlet throws: it moves to the front of the tab.
      if (char.level < def.reqLevel) world.log(`${def.name} need level ${def.reqLevel}.`, '#ffb3c6');
      else {
        char.inventory.use.splice(index, 1);
        char.inventory.use.unshift(entry);
        state.windows.bag.sel = 0;
        world.log(`Now throwing ${def.name}.`, def.color);
      }
    } else if (def.scroll) {
      state.scrollMode = entry.id;
      state.windows.bag.tab = 0;
      state.windows.bag.sel = -1;
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

// ---------- Stats ----------

const STAT_COLORS = { str: '#ff7a6b', dex: '#3fc48a', int: '#5aa8ff', luk: '#f0b53a' };

export function statsWindow(ui, state, world) {
  const win = state.windows.stats;
  const W = 180;
  const H = 232;
  if (!windowFrame(ui, win, W, H, 'Stats')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const s = world.stats;
  const x = win.x + 8;
  let y = win.y + 33;
  text(ctx, char.name, x, y, { size: 11, bold: true });
  box(ctx, x + 164 - 70, y - 10, 70, 13, { fill: th.light, edge: null, r: 6.5 });
  text(ctx, `${JOBS[char.job].name} · Lv ${char.level}`, x + 164 - 35, y - 0.5, { size: 7, bold: true, align: 'center', color: th.ink });
  y += 6;
  const need = expToNext(char.level);
  bar(ctx, x, y, 164, 9, Number.isFinite(need) ? char.exp / need : 1, COLORS.exp, Number.isFinite(need) ? `EXP ${(100 * char.exp / need).toFixed(1)}%` : 'MAX', { textColor: '#ffffff' });
  y += 12;
  bar(ctx, x, y, 80, 9, char.hp / s.maxHp, COLORS.hp, `${char.hp}/${s.maxHp}`);
  bar(ctx, x + 84, y, 80, 9, char.mp / s.maxMp, COLORS.mp, `${char.mp}/${s.maxMp}`);
  y += 24;
  // Unspent points glow and bounce a little to say "spend me".
  const bounce = char.ap ? Math.abs(Math.sin(world.now * 4)) * 1.5 : 0;
  box(ctx, x, y - 11 - bounce, 92, 15, { fill: char.ap ? th.main : COLORS.cell, edge: char.ap ? th.dark : null, r: 7.5 });
  text(ctx, `${char.ap} Ability Points`, x + 46, y - 0.5 - bounce, { size: 8, bold: true, align: 'center', color: char.ap ? '#ffffff' : COLORS.muted, outline: char.ap ? th.ink : null });
  if (char.ap) sparkle(ctx, x + 90, y - 11 - bounce, 2 + bounce, '#ffffff');
  if (button(ui, x + 116, y - 12, 48, 16, 'Auto', { enabled: char.ap > 0, size: 8 })) autoAssignAp(char);
  y += 4;
  for (const k of STAT_KEYS) {
    y += 16;
    box(ctx, x, y - 11, 164, 14, { fill: '#ffffff', edge: th.light, r: 7 });
    box(ctx, x + 1, y - 10, 34, 12, { fill: STAT_COLORS[k], edge: null, r: 6 });
    text(ctx, k.toUpperCase(), x + 18, y - 1, { size: 8, bold: true, align: 'center', color: '#ffffff' });
    const bonus = s[k] - char.base[k];
    text(ctx, `${s[k]}`, x + 42, y, { size: 9, bold: true });
    if (bonus) text(ctx, `(${char.base[k]} + ${bonus})`, x + 62, y, { size: 7, color: COLORS.good });
    if (button(ui, x + 146, y - 11, 17, 14, '+', { enabled: char.ap > 0, primary: char.ap > 0, size: 9 })) {
      spendAp(char, k, ui.input.held.has('ShiftLeft') ? 5 : 1);
    }
  }
  y += 10;
  const phys = physicalRange(s, s.weaponType, 100);
  const mag = magicRange(s, 100);
  const family = JOBS[char.job].family;
  const rows = [
    ['Attack', `${Math.round(phys.min)} ~ ${Math.round(phys.max)}`],
    ['Magic', family === 'mage' ? `${Math.round(mag.min)} ~ ${Math.round(mag.max)}` : `${Math.floor(s.int / 2) + s.matk}`],
    ['Defense', `${s.wdef} / ${s.mdef}`],
    ['Accuracy', `${accuracy(family, s, char.level)}`],
    ['Avoid', `${avoid(s)}`],
    ['Critical', `${Math.round((0.05 + s.critRate) * 100)}%`],
    ['Speed', `${s.speed}%`],
  ];
  well(ctx, x, y - 4, 164, rows.length * 10 + 6, th);
  y += 6;
  for (const [k, v] of rows) {
    text(ctx, k, x + 6, y, { size: 7.5, color: COLORS.muted });
    text(ctx, v, x + 158, y, { size: 7.5, bold: true, align: 'right' });
    y += 10;
  }
}

// ---------- Skills ----------

export function skillsWindow(ui, state, world) {
  const win = state.windows.skills;
  const W = 256;
  const H = 216;
  if (!windowFrame(ui, win, W, H, 'Skills')) return;
  const { ctx } = ui;
  const char = world.char;
  const chain = jobChain(char.job);
  win.tab = Math.min(win.tab ?? chain.length - 1, chain.length - 1);
  // Tabs share the window width, so four job books still fit.
  const tabW = Math.min(64, Math.floor((W - 64) / chain.length) - 2);
  win.tab = tabs(ui, win.x + 6, win.y + 22, chain.map((j) => JOBS[j].short ?? JOBS[j].name), win.tab, { w: tabW });
  const job = chain[win.tab];
  const th = ui.theme;
  box(ctx, win.x + W - 50, win.y + 22, 44, 15, { fill: char.sp ? th.main : COLORS.cell, edge: char.sp ? th.dark : null, r: 7.5 });
  text(ctx, `${char.sp} SP`, win.x + W - 28, win.y + 33, { size: 8, bold: true, align: 'center', color: char.sp ? '#ffffff' : COLORS.muted, outline: char.sp ? th.ink : null });
  const all = Object.values(SKILLS).filter((s) => s.job === job);
  // Five rows show at once; the wheel scrolls longer books.
  const ROWS = 5;
  win.scroll ??= {};
  if (hover(ui, win.x + 6, win.y + 42, W - 12, ROWS * 33)) win.scroll[job] = (win.scroll[job] ?? 0) + ui.mouse.wheel;
  const top = (win.scroll[job] = Math.max(0, Math.min(all.length - ROWS, win.scroll[job] ?? 0)));
  const list = all.slice(top, top + ROWS);
  if (all.length > ROWS) {
    const trackH = ROWS * 33 - 6;
    box(ctx, win.x + W - 5, win.y + 44, 3, trackH, { fill: COLORS.cell, edge: null, r: 1.5 });
    box(ctx, win.x + W - 5, win.y + 44 + (trackH * top) / all.length, 3, (trackH * ROWS) / all.length, { fill: th.main, edge: null, r: 1.5 });
  }
  let y = win.y + 42;
  for (const s of list) {
    const lv = char.skills[s.id] ?? 0;
    const sel = state.selectedSkill === s.id;
    const hot = hover(ui, win.x + 6, y, W - 40, 30);
    // A skill you could put a point into now breathes; one you can't reach yet is greyed out.
    const open = canLearn(char, s.id);
    const breathe = open && !sel ? 0.5 + 0.5 * Math.sin(world.now * 4) : 0;
    box(ctx, win.x + 6, y, W - 12, 30, { fill: sel ? '#fff3c4' : hot ? '#ffffff' : '#fffdfb', edge: sel ? COLORS.select : lv || open ? th.main : th.light, r: 8, width: sel ? 2 : 1.2 + breathe });
    // The icon sits on a plate in its own hue, shaped by its kind: round for passives, cut corners
    // for buffs, a rounded square for everything you cast.
    const kind = s.type === 'passive' ? 'passive' : s.type === 'buff' ? 'buff' : 'active';
    const [toneLight, toneDeep] = skillTone(s.id) ?? [th.light, th.dark];
    skillPlate(ctx, win.x + 20, y + 15, 11.5, kind, lv ? lighten(toneLight, 0.35) : COLORS.cell, lv ? toneDeep : '#d8cce6');
    // Icon states over the one drawing: brighter under the mouse, grey when out of reach.
    if (hot && lv) ctx.filter = 'brightness(1.12) saturate(1.15)';
    ctx.globalAlpha = lv || open ? 1 : 0.6;
    drawSkillIcon(ctx, s.id, win.x + 12, y + 7);
    ctx.filter = 'none';
    if (!lv && !open) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#808080';
      ctx.fillRect(win.x + 12, y + 7, 16, 16);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    // A little level gauge under the name, in the skill's hue.
    box(ctx, win.x + 35, y + 21, 70, 3, { fill: COLORS.cell, edge: null, r: 1.5 });
    if (lv) box(ctx, win.x + 35, y + 21, Math.max(3, (70 * lv) / s.maxLevel), 3, { fill: toneDeep, edge: null, r: 1.5 });
    ctx.globalAlpha = lv ? 1 : 0.55;
    text(ctx, s.name, win.x + 35, y + 13, { size: 9, bold: true });
    text(ctx, kind === 'passive' ? 'Passive' : kind === 'buff' ? 'Buff' : 'Active', win.x + 109, y + 25, { role: 'minor' });
    ctx.globalAlpha = 1;
    text(ctx, `${lv}/${s.maxLevel}`, win.x + W - 34, y + 19, { size: 9, bold: true, align: 'right', color: lv ? COLORS.ink : COLORS.muted });
    if (button(ui, win.x + W - 28, y + 7, 17, 16, '+', { enabled: open, primary: open })) {
      learnSkill(char, s.id);
    }
    if (hover(ui, win.x + 6, y, W - 40, 30)) tooltip(ui, [...skillTooltip(char, s.id), ...(lv && s.type !== 'passive' ? [{ text: 'Click, then press a hotkey to bind', color: COLORS.muted, size: 8 }] : [])]);
    if (clicked(ui, win.x + 6, y, W - 40, 30) && lv && s.type !== 'passive') state.selectedSkill = sel ? null : s.id;
    y += 33;
  }
  if (job === 'novice' && char.level >= 10) {
    wrap(ctx, 'You can choose a job! Kestrel (archer) is in Sprout Village, Vex (thief) in Pastel Harbor, Brann (warrior) in Ember Crag, and Elowen (mage) in Moonleaf Grove. Press M for the world map.', win.x + 10, y + 10, W - 20, { size: 8, color: COLORS.accent });
  }
}

// ---------- Quests ----------

export function questsWindow(ui, state, world) {
  const win = state.windows.quests;
  const W = 196;
  const H = 210;
  if (!windowFrame(ui, win, W, H, 'Quests')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const ids = Object.keys(QUESTS);
  const active = ids.filter((id) => ['active', 'ready'].includes(questState(char, id)));
  const available = ids.filter((id) => questState(char, id) === 'available');
  const x = win.x + 8;
  const w = W - 16;
  let y = win.y + 26;
  const heading = (label, n) => {
    box(ctx, x, y, w, 14, { fill: th.light, edge: null, r: 7 });
    text(ctx, label, x + 8, y + 10, { size: 8, bold: true, color: th.ink });
    text(ctx, `${n}`, x + w - 8, y + 10, { size: 8, bold: true, align: 'right', color: th.ink });
    y += 18;
  };
  heading('In progress', active.length);
  if (!active.length) {
    text(ctx, 'Nothing yet. Talk to villagers with Up.', x + 4, y + 8, { size: 7.5, color: COLORS.muted });
    y += 16;
  }
  for (const id of active) {
    const q = QUESTS[id];
    const ready = questState(char, id) === 'ready';
    const objs = objectiveProgress(char, id);
    const h = 18 + objs.length * 11;
    box(ctx, x, y, w, h, { fill: ready ? '#effcf3' : '#ffffff', edge: ready ? COLORS.good : th.light, r: 7 });
    text(ctx, `${ready ? '✓ ' : ''}${q.name}`, x + 6, y + 11, { size: 8.5, bold: true, color: ready ? '#2f8f52' : COLORS.ink });
    text(ctx, ready ? `Back to ${NPCS[q.giver].name}` : NPCS[q.giver].name, x + w - 6, y + 11, { size: 6.5, align: 'right', color: COLORS.muted });
    let oy = y + 22;
    for (const o of objs) {
      const name = o.type === 'kill' ? `Defeat ${MOBS[o.mob].name}` : ITEMS[o.item].name;
      text(ctx, name, x + 8, oy, { size: 7, color: COLORS.muted });
      bar(ctx, x + w - 62, oy - 6, 56, 7, o.have / o.count, o.have >= o.count ? COLORS.good : th.main, `${o.have}/${o.count}`, { size: 6 });
      oy += 11;
    }
    y += h + 4;
  }
  y += 4;
  heading('Available', available.length);
  for (const id of available.slice(0, 4)) {
    const hot = hover(ui, x, y, w, 14);
    box(ctx, x, y, w, 14, { fill: hot ? '#ffffff' : '#fffdfb', edge: th.light, r: 7 });
    box(ctx, x + 3, y + 2.5, 9, 9, { fill: COLORS.select, edge: null, r: 4.5 });
    text(ctx, '!', x + 7.5, y + 10, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: '#c99a1f' });
    text(ctx, QUESTS[id].name, x + 16, y + 10, { size: 8 });
    text(ctx, NPCS[QUESTS[id].giver].name, x + w - 6, y + 10, { size: 6.5, align: 'right', color: COLORS.muted });
    y += 17;
  }
}
