// Window state and routing: hotkeys for windows, binding skills/items to hotkeys, and world events.

import { ITEMS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { HOTKEYS } from '../core/character.js';
import { bagWindow, statsWindow, skillsWindow } from './windows.js';
import { questsWindow } from './quests.js';
import { npcWindow, deathWindow } from './npc.js';
import { drawHud } from './hud.js';
import { worldMapWindow } from './worldmap.js';
import { createChat, chatInput, updateChat, drawChatBar } from './chat.js';
import { adminWindow } from './admin.js';
import { optionsWindow } from './options.js';
import { profileWindow } from './profile.js';
import { cashShopWindow } from './cashshop.js';
import { drawMenu, drawPartyPanel } from './party.js';
import { isGm } from '../world/gm.js';

export function createUiState() {
  return {
    windows: {
      bag: { x: 370, y: 60, open: false, tab: 0, sel: -1, theme: 'peach', icon: 'bag' },
      stats: { x: 8, y: 66, open: false, theme: 'pink', icon: 'star' },
      skills: { x: 180, y: 52, open: false, theme: 'lavender', icon: 'book' },
      quests: { x: 300, y: 52, open: false, theme: 'mint', icon: 'scroll' },
      npc: { x: 170, y: 84, open: false, theme: 'pink', icon: 'chat' },
      worldmap: { x: 110, y: 26, open: false, theme: 'sky', icon: 'map' },
      admin: { x: 130, y: 40, open: false, tab: 0, theme: 'gold', icon: 'crown' },
      options: { x: 170, y: 40, open: false, tab: 0, theme: 'lavender', icon: 'gear' },
      profile: { x: 160, y: 46, open: false, tab: 0, theme: 'sky', icon: 'user' },
      cashshop: { x: 140, y: 40, open: false, theme: 'pink', icon: 'gift' },
    },
    // Window stacking, back to front. Clicking a window brings it to the front.
    order: ['stats', 'skills', 'quests', 'bag', 'worldmap', 'cashshop', 'admin', 'profile', 'options'],
    // Whose profile is open: { kind: 'self' } or { kind: 'bot', id }.
    profile: null,
    // The right-click menu on a player or yourself: { kind: 'bot' | 'self', id, x, y }.
    menu: null,
    // Set by the Options window: 'select' (change character) or 'title'. main.js acts on it.
    action: null,
    npc: null,
    chat: createChat(),
    death: false,
    scrollMode: null,
    selectedSkill: null,
    lastClick: null,
    banner: 0,
  };
}

const TOGGLES = { KeyI: 'bag', KeyC: 'stats', KeyK: 'skills', KeyL: 'quests', KeyM: 'worldmap', KeyO: 'cashshop' };

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
    } else if (e.type === 'admin') {
      state.windows.admin.open = isGm(world.char);
    } else if (e.type === 'map') {
      state.banner = 2.5;
      state.npc = null;
      state.windows.npc.open = false;
    }
  }
  world.events.length = 0;

  // While the chat bar is open it has the keyboard.
  updateChat(state.chat, world, dt);
  if (!state.npc && !state.death && chatInput(state.chat, world, input)) return true;

  if (input.pressed.has('F9') && isGm(world.char)) state.windows.admin.open = !state.windows.admin.open;
  if (!isGm(world.char)) state.windows.admin.open = false;
  for (const [code, key] of Object.entries(TOGGLES)) {
    if (input.pressed.has(code)) state.windows[key].open = !state.windows[key].open;
  }
  if (input.pressed.has('Escape')) {
    if (state.menu) state.menu = null;
    else if (state.scrollMode) state.scrollMode = null;
    else if (state.npc) {
      state.npc = null;
      state.windows.npc.open = false;
    } else if (Object.values(state.windows).some((w) => w.open)) {
      for (const w of Object.values(state.windows)) w.open = false;
    } else {
      // With nothing open, Esc brings up the Options.
      state.windows.options.open = true;
      state.order = [...state.order.filter((k) => k !== 'options'), 'options'];
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

const WINDOWS = { stats: statsWindow, skills: skillsWindow, quests: questsWindow, bag: bagWindow, worldmap: worldMapWindow, admin: adminWindow, options: optionsWindow, profile: profileWindow, cashshop: cashShopWindow };
const POP = 0.22;

// Opening windows pop in with a little overshoot.
function popScale(win, t) {
  if (!win.open) {
    win.openedAt = null;
    return 1;
  }
  win.openedAt ??= t;
  const u = Math.min(1, (t - win.openedAt) / POP);
  if (u >= 1) return 1;
  const c = 1.9;
  return 0.85 + 0.15 * (1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2));
}

function inside(win, m) {
  return win.open && win.w && m.x >= win.x && m.x < win.x + win.w && m.y >= win.y && m.y < win.y + win.h;
}

// How much the world dims behind what's open: most for dialogs that take over the controls,
// a little for the big menus, a touch for the everyday windows you keep open while playing.
const DIM = { npc: 0.2, death: 0.22, options: 0.14, cashshop: 0.14, worldmap: 0.12, profile: 0.1, bag: 0.08, skills: 0.08, stats: 0.06, quests: 0.06 };

// Darkens the world (not the HUD) toward a deep plum, easing in and out, so open windows stand
// apart from busy scenes.
function dimWorld(ctx, state) {
  let target = 0;
  for (const [key, win] of Object.entries(state.windows)) if (win.open) target = Math.max(target, DIM[key] ?? 0);
  if (state.npc) target = Math.max(target, DIM.npc);
  if (state.death) target = Math.max(target, DIM.death);
  const t = performance.now() / 1000;
  const dt = Math.min(0.1, t - (state.dimAt ?? t));
  state.dimAt = t;
  state.dim = target + ((state.dim ?? 0) - target) * Math.exp(-dt * 14);
  if (state.dim < 0.004) return;
  ctx.fillStyle = `rgba(40,22,62,${state.dim.toFixed(3)})`;
  ctx.fillRect(0, 0, 640, 360);
}

export function drawUi(ui, state, world) {
  dimWorld(ui.ctx, state);
  drawHud(ui, state, world);
  drawPartyPanel(ui, state, world);
  drawChatBar(ui, state.chat, world);
  const m = ui.mouse;
  const t = performance.now() / 1000;
  // A window that just opened (by hotkey, menu button, or anything else) comes to the front, so
  // it's never stuck behind one you used earlier.
  for (const key of state.order) {
    const win = state.windows[key];
    if (win.open && !win.wasOpen) state.order = [...state.order.filter((k) => k !== key), key];
    win.wasOpen = win.open;
  }
  // Only the frontmost window under the mouse sees its clicks, so windows behind it don't react.
  const top = [...state.order].reverse().find((k) => inside(state.windows[k], m));
  if (top && m.clicked) state.order = [...state.order.filter((k) => k !== top), top];
  const click = { clicked: m.clicked, right: m.right, double: m.double, wheel: m.wheel };
  const modal = Boolean(state.npc || state.death);
  for (const key of state.order) {
    const win = state.windows[key];
    if (!win.open) {
      win.openedAt = null;
      continue;
    }
    const mine = key === top && !modal;
    m.clicked = click.clicked && mine;
    m.right = click.right && mine;
    m.double = click.double && mine;
    m.wheel = mine ? click.wheel : 0;
    const k = popScale(win, t);
    const { ctx } = ui;
    ctx.save();
    if (k !== 1 && win.w) {
      const cx = win.x + win.w / 2;
      const cy = win.y + win.h / 2;
      ctx.translate(cx, cy);
      ctx.scale(k, k);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = Math.min(1, (k - 0.85) / 0.15 + 0.3);
    }
    WINDOWS[key](ui, state, world);
    ctx.restore();
    if (mine) click.clicked = m.clicked;
  }
  // A click no window used still reaches the dialogs and the game.
  m.clicked = top && !modal ? false : click.clicked;
  m.right = top && !modal ? false : click.right;
  m.double = top && !modal ? false : click.double;
  m.wheel = click.wheel;
  if (top && !modal) ui.used = true;
  drawMenu(ui, state, world);
  if (state.npc) withPop(ui, state.windows.npc, t, () => npcWindow(ui, state, world));
  else state.windows.npc.openedAt = null;
  if (state.death) deathWindow(ui, state, world);
}

function withPop(ui, win, t, draw) {
  const k = popScale(win, t);
  const { ctx } = ui;
  ctx.save();
  if (k !== 1 && win.w) {
    const cx = win.x + win.w / 2;
    const cy = win.y + win.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(k, k);
    ctx.translate(-cx, -cy);
  }
  draw();
  ctx.restore();
}
