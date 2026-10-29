// Window state and routing: hotkeys for windows, binding skills/items to hotkeys, and world events.

import { ITEMS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { HOTKEYS } from '../core/character.js';
import { statsWindow } from './windows.js';
import { skillsWindow } from './skills.js';
import { bagWindow } from './bag.js';
import { questsWindow } from './quests.js';
import { npcWindow, deathWindow } from './npc.js';
import { drawHud } from './hud.js';
import { worldMapWindow } from './worldmap.js';
import { createChat, chatInput, updateChat, drawChatBar } from './chat.js';
import { adminWindow } from './admin.js';
import { optionsWindow } from './options.js';
import { profileWindow } from './profile.js';
import { cashShopWindow } from './cashshop.js';
import { petWindow } from './pet.js';
import { onlineWindow } from './online.js';
import { collectionWindow } from './collection.js';
import { cookingWindow } from './cooking.js';
import { drawMenu, drawPartyPanel } from './party.js';
import { isGm } from '../world/gm.js';
import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { noteTalk, noteVisit, questState } from '../core/quests.js';
import { say } from './chat.js';
import { checkArrival } from '../world/routes.js';
import { sceneInput, drawScene, drawRadio } from './cutscene.js';
import { drawGuide } from './guide.js';

// Places quests send you: marked off on arrival (and, for a spot up high, once you climb there).
function noteVisits(world) {
  for (const id of noteVisit(world.char, world.map.id, world.body)) {
    const q = QUESTS[id];
    world.log(questState(world.char, id) === 'ready' ? `${q.name}: done! Report to ${NPCS[q.giver].name}.` : `${q.name}: you made it to ${world.map.name}.`, '#bff0dc');
  }
}

export function createUiState() {
  return {
    windows: {
      bag: { x: 300, y: 56, open: false, tab: 0, sel: -1, theme: 'peach', icon: 'bag' },
      stats: { x: 8, y: 66, open: false, theme: 'pink', icon: 'star' },
      skills: { x: 180, y: 52, open: false, theme: 'lavender', icon: 'book' },
      quests: { x: 300, y: 52, open: false, theme: 'mint', icon: 'scroll' },
      npc: { x: 170, y: 84, open: false, theme: 'pink', icon: 'chat' },
      worldmap: { x: 70, y: 6, open: false, theme: 'sky', icon: 'map' },
      admin: { x: 130, y: 40, open: false, tab: 0, theme: 'gold', icon: 'crown' },
      options: { x: 170, y: 40, open: false, tab: 0, theme: 'lavender', icon: 'gear' },
      profile: { x: 160, y: 46, open: false, tab: 0, theme: 'sky', icon: 'user' },
      cashshop: { x: 140, y: 40, open: false, theme: 'pink', icon: 'gift' },
      pet: { x: 150, y: 60, open: false, theme: 'pink', icon: 'heart' },
      online: { x: 200, y: 50, open: false, theme: 'sky', icon: 'friends' },
      collection: { x: 150, y: 40, open: false, tab: 0, theme: 'gold', icon: 'crown' },
      cook: { x: 160, y: 50, open: false, theme: 'peach', icon: 'flame' },
    },
    // Window stacking, back to front. Clicking a window brings it to the front.
    order: ['stats', 'skills', 'quests', 'bag', 'worldmap', 'cashshop', 'pet', 'online', 'collection', 'cook', 'admin', 'profile', 'options'],
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

const TOGGLES = { KeyI: 'bag', KeyC: 'stats', KeyK: 'skills', KeyL: 'quests', KeyM: 'worldmap', KeyO: 'cashshop', KeyP: 'pet', KeyN: 'online', KeyB: 'collection' };

// Handles keys and world events before the world updates. Returns whether the world should
// ignore player controls this frame.
export function routeInput(state, world, input, dt) {
  state.banner = Math.max(0, state.banner - dt);
  state.visitIn = (state.visitIn ?? 0) - dt;
  if (state.visitIn <= 0) {
    state.visitIn = 0.25;
    noteVisits(world);
  }
  for (const e of world.events) {
    if (e.type === 'talk') {
      state.npc = { id: e.npc };
      state.windows.npc.open = true;
      // Errands: someone you were sent to talk to, or to bring something to.
      for (const done of noteTalk(world.char, e.npc)) {
        const q = QUESTS[done.id];
        if (done.say) {
          say(world, e.npc, done.say);
          world.log(`${NPCS[e.npc].name}: ${done.say}`, '#ffffff');
        }
        world.log(questState(world.char, done.id) === 'ready' ? `${q.name}: done! Report to ${NPCS[q.giver].name}.` : `${q.name}: talked to ${NPCS[e.npc].name}.`, '#bff0dc');
      }
    } else if (e.type === 'cook') {
      state.windows.cook.open = true;
      state.windows.cook.stir = null;
    } else if (e.type === 'death') {
      state.death = true;
    } else if (e.type === 'admin') {
      state.windows.admin.open = isGm(world.char);
    } else if (e.type === 'map') {
      noteVisits(world);
      checkArrival(world);
      state.banner = 2.5;
      state.npc = null;
      state.windows.npc.open = false;
    }
  }
  world.events.length = 0;

  // A story scene has the controls while it plays.
  if (sceneInput(world, input)) {
    state.npc = null;
    state.windows.npc.open = false;
    return true;
  }
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

const WINDOWS = { stats: statsWindow, skills: skillsWindow, quests: questsWindow, bag: bagWindow, worldmap: worldMapWindow, admin: adminWindow, options: optionsWindow, profile: profileWindow, cashshop: cashShopWindow, pet: petWindow, online: onlineWindow, collection: collectionWindow, cook: cookingWindow };
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
const DIM = { npc: 0.2, death: 0.22, options: 0.14, cashshop: 0.14, pet: 0.1, online: 0.1, collection: 0.12, worldmap: 0.12, profile: 0.1, bag: 0.08, skills: 0.08, stats: 0.06, quests: 0.06 };

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

// How long a closing window takes to fade away (s).
const CLOSE = 0.14;

export function drawUi(ui, state, world) {
  dimWorld(ui.ctx, state);
  drawHud(ui, state, world);
  // The guide arrow and pill, while a route is set.
  drawGuide(ui, state, world);
  drawPartyPanel(ui, state, world);
  drawChatBar(ui, state.chat, world);
  const m = ui.mouse;
  const t = performance.now() / 1000;
  // A window that just opened (by hotkey, menu button, or anything else) comes to the front, so
  // it's never stuck behind one you used earlier.
  for (const key of state.order) {
    const win = state.windows[key];
    if (win.open && !win.wasOpen) state.order = [...state.order.filter((k) => k !== key), key];
    if (!win.open && win.wasOpen) win.closedAt = t;
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
      // Just closed: it shrinks a little and fades away instead of vanishing (drawn once more,
      // blind to the mouse).
      const c = (t - (win.closedAt ?? -9)) / CLOSE;
      if (c < 1 && win.w) {
        const { ctx } = ui;
        const k = 1 - 0.07 * c * c;
        const cx = win.x + win.w / 2;
        const cy = win.y + win.h / 2;
        const saved = { x: m.x, y: m.y, down: m.down, clicked: m.clicked, right: m.right, double: m.double, wheel: m.wheel, tip: ui.tooltip };
        Object.assign(m, { x: -999, y: -999, down: false, clicked: false, right: false, double: false, wheel: 0 });
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(k, k);
        ctx.translate(-cx, -cy);
        ctx.globalAlpha = 1 - c;
        win.open = true;
        try {
          WINDOWS[key](ui, state, world);
        } finally {
          win.open = false;
          win.wasOpen = false;
          ctx.restore();
          Object.assign(m, { x: saved.x, y: saved.y, down: saved.down, clicked: saved.clicked, right: saved.right, double: saved.double, wheel: saved.wheel });
          ui.tooltip = saved.tip;
        }
      }
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
  // Bramble on the root radio in Rootwood Hollow, and a story scene over everything.
  drawRadio(ui, world);
  drawScene(ui, world);
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
