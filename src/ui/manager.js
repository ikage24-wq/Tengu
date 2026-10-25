// Window state and routing: hotkeys for windows, binding skills/items to hotkeys, and world events.

import { ITEMS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { HOTKEYS } from '../core/character.js';
import { bagWindow, statsWindow, skillsWindow, questsWindow } from './windows.js';
import { npcWindow, deathWindow } from './npc.js';
import { drawHud } from './hud.js';

export function createUiState() {
  return {
    windows: {
      bag: { x: 370, y: 64, open: false, tab: 0, sel: -1 },
      stats: { x: 8, y: 92, open: false },
      skills: { x: 194, y: 60, open: false },
      quests: { x: 436, y: 60, open: false },
      npc: { x: 170, y: 84, open: false },
    },
    npc: null,
    death: false,
    scrollMode: null,
    selectedSkill: null,
    lastClick: null,
    banner: 0,
  };
}

const TOGGLES = { KeyI: 'bag', KeyC: 'stats', KeyK: 'skills', KeyL: 'quests' };

// Handles keys and world events before the world updates. Returns whether the world should
// ignore player controls this frame.
export function routeInput(state, world, input, dt) {
  state.banner = Math.max(0, state.banner - dt);
  for (const e of world.events) {
    if (e.type === 'talk') {
      state.npc = { id: e.npc };
      state.windows.npc.open = true;
    } else if (e.type === 'death') {
      state.death = true;
    } else if (e.type === 'map') {
      state.banner = 2.5;
      state.npc = null;
      state.windows.npc.open = false;
    }
  }
  world.events.length = 0;

  for (const [code, key] of Object.entries(TOGGLES)) {
    if (input.pressed.has(code)) state.windows[key].open = !state.windows[key].open;
  }
  if (input.pressed.has('Escape')) {
    if (state.scrollMode) state.scrollMode = null;
    else if (state.npc) {
      state.npc = null;
      state.windows.npc.open = false;
    } else {
      for (const w of Object.values(state.windows)) w.open = false;
    }
  }

  // Binding: a selected skill (Skills window) or Use item (Bag) goes to the hotkey you press.
  const bag = state.windows.bag;
  const bagItem = bag.open && bag.tab === 1 ? world.char.inventory.use[bag.sel] : null;
  const skill = state.windows.skills.open ? state.selectedSkill : null;
  if (skill || bagItem) {
    const code = HOTKEYS.find((k) => input.pressed.has(k));
    if (code) {
      const binding = skill ? { skill } : { item: bagItem.id };
      for (const [k, b] of Object.entries(world.char.hotkeys)) {
        if (JSON.stringify(b) === JSON.stringify(binding)) delete world.char.hotkeys[k];
      }
      world.char.hotkeys[code] = binding;
      world.log(`${skill ? SKILLS[skill].name : ITEMS[bagItem.id].name} set to ${code.replace('Key', '').replace('Digit', '')}.`, '#d4cbe8');
      input.pressed.delete(code);
      input.held.delete(code);
      state.selectedSkill = null;
    }
  }
  if (!state.windows.npc.open) state.npc = null;
  return Boolean(state.npc) || state.death;
}

export function drawUi(ui, state, world) {
  drawHud(ui, state, world);
  if (state.windows.stats.open) statsWindow(ui, state, world);
  if (state.windows.skills.open) skillsWindow(ui, state, world);
  if (state.windows.quests.open) questsWindow(ui, state, world);
  if (state.windows.bag.open) bagWindow(ui, state, world);
  if (state.npc) npcWindow(ui, state, world);
  if (state.death) deathWindow(ui, state, world);
}
