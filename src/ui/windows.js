// Player windows: Bag (inventory + equipment), Stats, Skills, and Quests.

import { ITEMS, EQUIP_SLOTS, RARITIES } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { expToNext } from '../core/exp.js';
import { physicalRange, magicRange, accuracy, avoid } from '../core/formulas.js';
import { equipFromBag, unequip, spendAp, autoAssignAp, learnSkill, canLearn, equipBlocker, STAT_KEYS } from '../core/character.js';
import { applyScroll } from '../core/items.js';
import { removeItem, TAB_SIZE } from '../core/inventory.js';
import { questState, objectiveProgress } from '../core/quests.js';
import { useItem } from '../world/world.js';
import { drawHero } from '../render/hero.js';
import { drawItemIcon, drawSkillIcon } from '../render/icons.js';
import { COLORS, windowFrame, button, tabs, text, box, bar, hover, clicked, tooltip, wrap } from './kit.js';
import { itemTooltip, skillTooltip } from './tooltips.js';

const CELL = 19;
const TAB_KEYS = ['equip', 'use', 'etc'];

function cellsFor(char, tab) {
  return char.inventory[tab];
}

function itemIdOf(entry) {
  return entry.id;
}

// ---------- Bag ----------

const SLOT_POS = {
  hat: [6, 26], top: [6, 50], bottom: [6, 74], shoes: [6, 98],
  weapon: [74, 26], gloves: [74, 50], cape: [74, 74], earring: [74, 98],
};

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
  box(ctx, ox + 4, oy + 22, 96, 104, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  drawHero(ctx, char.appearance, char.equipment, ox + 52, oy + 104, { pose: 'idle', time: world.now });
  for (const slot of EQUIP_SLOTS) {
    const [sx, sy] = SLOT_POS[slot];
    const x = ox + sx;
    const y = oy + sy;
    const inst = char.equipment[slot];
    const rare = inst?.rarity ? RARITIES[inst.rarity].color : null;
    box(ctx, x, y, CELL, CELL, { fill: COLORS.cell, edge: state.scrollMode && inst ? COLORS.accent : rare ?? COLORS.cellEdge, r: 4, width: rare ? 2 : 1 });
    if (inst) drawItemIcon(ctx, inst.id, x + 1.5, y + 1.5);
    else text(ctx, slot[0].toUpperCase(), x + CELL / 2, y + 12, { size: 7, align: 'center', color: '#cdb8e0' });
    if (hover(ui, x, y, CELL, CELL)) tooltip(ui, inst ? [...itemTooltip(char, inst.id, inst), { text: 'Double-click to take off', color: COLORS.muted, size: 8 }] : [{ text: slot[0].toUpperCase() + slot.slice(1), bold: true }]);
    if (clicked(ui, x, y, CELL, CELL) && inst) {
      if (state.scrollMode) {
        scrollOnto(state, world, inst);
      } else if (ui.mouse.double || (state.lastClick?.key === `eq:${slot}` && world.now - state.lastClick.at < 0.4)) {
        if (!unequip(char, slot)) world.log('Your bag is full.', '#ffb3c6');
        state.lastClick = null;
      } else {
        state.lastClick = { key: `eq:${slot}`, at: world.now };
      }
    }
  }
  text(ctx, `${char.gold.toLocaleString()} gold`, ox + 52, oy + 140, { size: 9, bold: true, align: 'center', color: COLORS.gold });

  // Tabs and grid.
  const gx = ox + 106;
  win.tab = tabs(ui, gx, oy + 22, ['Equip', 'Use', 'Etc'], win.tab ?? 0, { w: 48 });
  const tab = TAB_KEYS[win.tab];
  const list = cellsFor(char, tab);
  for (let i = 0; i < TAB_SIZE; i++) {
    const x = gx + (i % 8) * CELL;
    const y = oy + 40 + Math.floor(i / 8) * CELL;
    const entry = list[i];
    const sel = win.sel === i;
    const rare = tab === 'equip' && entry?.rarity ? RARITIES[entry.rarity].color : null;
    box(ctx, x, y, CELL - 1, CELL - 1, { fill: sel ? '#fff3c4' : COLORS.cell, edge: sel ? COLORS.select : rare ?? COLORS.cellEdge, r: 3, width: sel || rare ? 2 : 1 });
    if (!entry) continue;
    drawItemIcon(ctx, itemIdOf(entry), x + 1, y + 1);
    if (entry.qty > 1) text(ctx, `${entry.qty}`, x + CELL - 3, y + CELL - 3, { size: 7, bold: true, align: 'right', color: '#ffffff', outline: COLORS.ink });
    if (tab === 'equip' && equipBlocker(char, entry)) {
      ctx.fillStyle = 'rgba(255,107,138,0.18)';
      ctx.fillRect(x, y, CELL - 1, CELL - 1);
    }
    if (hover(ui, x, y, CELL, CELL)) {
      const hint = tab === 'equip' ? 'Double-click to equip' : tab === 'use' ? 'Double-click to use · press a hotkey to bind' : null;
      tooltip(ui, [...itemTooltip(char, entry.id, tab === 'equip' ? entry : null), ...(hint ? [{ text: hint, color: COLORS.muted, size: 8 }] : [])]);
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
  box(ctx, gx, iy, 152, 66, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  if (state.scrollMode) {
    wrap(ctx, `Click a piece of equipment to use ${ITEMS[state.scrollMode].name}.`, gx + 6, iy + 13, 140, { size: 8, color: COLORS.accent });
    if (button(ui, gx + 6, iy + 46, 60, 14, 'Cancel')) state.scrollMode = null;
  } else if (selEntry) {
    const def = ITEMS[selEntry.id];
    text(ctx, def.name, gx + 6, iy + 13, { size: 9, bold: true });
    wrap(ctx, tab === 'equip' ? (equipBlocker(char, selEntry) ?? 'Ready to equip.') : def.desc ?? '', gx + 6, iy + 25, 140, { size: 8, color: COLORS.muted });
    const label = tab === 'equip' ? 'Equip' : tab === 'use' ? 'Use' : null;
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
    else equipFromBag(char, index);
  } else if (tab === 'use') {
    const def = ITEMS[entry.id];
    if (def.scroll) {
      state.scrollMode = entry.id;
      state.windows.bag.tab = 0;
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
  world.log(r.ok ? `The charm worked! ${ITEMS[inst.id].name} +${inst.upgrades}` : 'The charm fizzled...', r.ok ? '#7ee081' : '#ffb3c6');
  world.fx.push({ kind: 'buff', x: world.body.x, y: world.body.y, t: 0, dur: 0.7, color: r.ok ? '#7ee081' : '#ff9ec0' });
  state.scrollMode = null;
}

// ---------- Stats ----------

export function statsWindow(ui, state, world) {
  const win = state.windows.stats;
  const W = 180;
  const H = 226;
  if (!windowFrame(ui, win, W, H, 'Stats')) return;
  const { ctx } = ui;
  const char = world.char;
  const s = world.stats;
  const x = win.x + 8;
  let y = win.y + 32;
  text(ctx, char.name, x, y, { size: 10, bold: true });
  text(ctx, `${JOBS[char.job].name}  ·  Lv ${char.level}`, x + 164, y, { size: 8, align: 'right', color: COLORS.muted });
  y += 8;
  const need = expToNext(char.level);
  bar(ctx, x, y, 164, 8, Number.isFinite(need) ? char.exp / need : 1, COLORS.exp, Number.isFinite(need) ? `EXP ${(100 * char.exp / need).toFixed(1)}%` : 'MAX', { textColor: '#ffffff' });
  y += 12;
  bar(ctx, x, y, 80, 8, char.hp / s.maxHp, COLORS.hp, `${char.hp}/${s.maxHp}`);
  bar(ctx, x + 84, y, 80, 8, char.mp / s.maxMp, COLORS.mp, `${char.mp}/${s.maxMp}`);
  y += 20;
  text(ctx, `Ability Points: ${char.ap}`, x, y, { size: 9, bold: true, color: char.ap ? COLORS.accent : COLORS.muted });
  if (button(ui, x + 116, y - 9, 48, 12, 'Auto', { enabled: char.ap > 0, size: 8 })) autoAssignAp(char);
  y += 6;
  for (const k of STAT_KEYS) {
    y += 15;
    box(ctx, x, y - 10, 164, 13, { fill: COLORS.cell, edge: null, r: 4 });
    text(ctx, k.toUpperCase(), x + 5, y, { size: 9, bold: true });
    const bonus = s[k] - char.base[k];
    text(ctx, `${s[k]}${bonus ? ` (${char.base[k]}+${bonus})` : ''}`, x + 50, y, { size: 9 });
    if (button(ui, x + 146, y - 9, 16, 11, '+', { enabled: char.ap > 0, primary: char.ap > 0, size: 9 })) {
      spendAp(char, k, ui.input.held.has('ShiftLeft') ? 5 : 1);
    }
  }
  y += 18;
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
  for (const [k, v] of rows) {
    text(ctx, k, x + 4, y, { size: 8, color: COLORS.muted });
    text(ctx, v, x + 160, y, { size: 8, bold: true, align: 'right' });
    y += 11;
  }
}

// ---------- Skills ----------

export function skillsWindow(ui, state, world) {
  const win = state.windows.skills;
  const W = 236;
  const H = 216;
  if (!windowFrame(ui, win, W, H, 'Skills')) return;
  const { ctx } = ui;
  const char = world.char;
  const chain = jobChain(char.job);
  win.tab = Math.min(win.tab ?? chain.length - 1, chain.length - 1);
  // Tabs share the window width, so four job books still fit.
  const tabW = Math.min(70, Math.floor((W - 60) / chain.length) - 2);
  win.tab = tabs(ui, win.x + 6, win.y + 22, chain.map((j) => JOBS[j].name), win.tab, { w: tabW });
  const job = chain[win.tab];
  text(ctx, `SP: ${char.sp}`, win.x + W - 10, win.y + 32, { size: 9, bold: true, align: 'right', color: char.sp ? COLORS.accent : COLORS.muted });
  const list = Object.values(SKILLS).filter((s) => s.job === job);
  let y = win.y + 42;
  for (const s of list) {
    const lv = char.skills[s.id] ?? 0;
    const sel = state.selectedSkill === s.id;
    box(ctx, win.x + 6, y, W - 12, 30, { fill: sel ? '#fff3c4' : COLORS.cell, edge: sel ? COLORS.select : COLORS.cellEdge, r: 6, width: sel ? 2 : 1 });
    drawSkillIcon(ctx, s.id, win.x + 11, y + 7);
    ctx.globalAlpha = lv ? 1 : 0.55;
    text(ctx, s.name, win.x + 32, y + 13, { size: 9, bold: true });
    text(ctx, s.type === 'passive' ? 'Passive' : s.type === 'buff' ? 'Buff' : 'Active', win.x + 32, y + 24, { size: 7, color: COLORS.muted });
    ctx.globalAlpha = 1;
    text(ctx, `${lv}/${s.maxLevel}`, win.x + W - 34, y + 19, { size: 9, bold: true, align: 'right', color: lv ? COLORS.ink : COLORS.muted });
    if (button(ui, win.x + W - 28, y + 8, 16, 14, '+', { enabled: canLearn(char, s.id), primary: canLearn(char, s.id) })) {
      learnSkill(char, s.id);
    }
    if (hover(ui, win.x + 6, y, W - 40, 30)) tooltip(ui, [...skillTooltip(char, s.id), ...(lv && s.type !== 'passive' ? [{ text: 'Click, then press a hotkey to bind', color: COLORS.muted, size: 8 }] : [])]);
    if (clicked(ui, win.x + 6, y, W - 40, 30) && lv && s.type !== 'passive') state.selectedSkill = sel ? null : s.id;
    y += 33;
  }
  if (job === 'novice' && char.level >= 10) {
    wrap(ctx, 'You can choose a job! Talk to an instructor in Pastel Harbor.', win.x + 10, y + 10, W - 20, { size: 8, color: COLORS.accent });
  }
}

// ---------- Quests ----------

export function questsWindow(ui, state, world) {
  const win = state.windows.quests;
  const W = 196;
  const H = 200;
  if (!windowFrame(ui, win, W, H, 'Quests')) return;
  const { ctx } = ui;
  const char = world.char;
  const ids = Object.keys(QUESTS);
  const active = ids.filter((id) => ['active', 'ready'].includes(questState(char, id)));
  const available = ids.filter((id) => questState(char, id) === 'available');
  let y = win.y + 34;
  text(ctx, 'In progress', win.x + 10, y, { size: 9, bold: true, color: COLORS.accent });
  y += 4;
  if (!active.length) {
    y += 12;
    text(ctx, 'Nothing yet. Talk to villagers with Up.', win.x + 12, y, { size: 8, color: COLORS.muted });
  }
  for (const id of active) {
    const q = QUESTS[id];
    y += 13;
    const ready = questState(char, id) === 'ready';
    text(ctx, `${ready ? '✓ ' : ''}${q.name}`, win.x + 12, y, { size: 9, bold: true, color: ready ? '#3f9f5f' : COLORS.ink });
    text(ctx, ready ? `Return to ${NPCS[q.giver].name}` : NPCS[q.giver].name, win.x + W - 10, y, { size: 7, align: 'right', color: COLORS.muted });
    for (const o of objectiveProgress(char, id)) {
      y += 11;
      const name = o.type === 'kill' ? `Defeat ${MOBS[o.mob].name}` : ITEMS[o.item].name;
      text(ctx, `${name}: ${o.have}/${o.count}`, win.x + 20, y, { size: 8, color: o.have >= o.count ? '#3f9f5f' : COLORS.muted });
    }
  }
  y += 18;
  text(ctx, 'Available', win.x + 10, y, { size: 9, bold: true, color: COLORS.accent });
  for (const id of available.slice(0, 4)) {
    y += 13;
    text(ctx, `! ${QUESTS[id].name}`, win.x + 12, y, { size: 9 });
    text(ctx, NPCS[QUESTS[id].giver].name, win.x + W - 10, y, { size: 7, align: 'right', color: COLORS.muted });
  }
}
