// Entry point: canvas scaling, screens (title -> character select -> creator -> game), the fixed-step loop, and autosave.

import { createInput, endFrame, VW, VH } from './input.js';
import { beginUi, endUi } from './ui/kit.js';
import { titleScreen, selectScreen, creatorScreen, randomLook } from './ui/screens.js';
import { createUiState, routeInput, drawUi } from './ui/manager.js';
import { createCharacter } from './core/character.js';
import { addItem } from './core/inventory.js';
import { saveGame, loadGame, hasSave, deleteSave, SLOTS } from './core/save.js';
import { createWorld, updateWorld } from './world/world.js';
import { createCamera, updateCamera, drawWorld } from './render/scene.js';
import { settings, loadSettings } from './core/settings.js';
import { setHd, gfx } from './render/pixel.js';
import { FILTERS, drawRetro } from './render/post.js';
import { createBots, updateBots, botsIn } from './world/bots.js';
import { partyMembers, shareKill } from './world/party.js';
import { openMenu } from './ui/party.js';
import { openProfile } from './ui/profile.js';

loadSettings();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

// Render at the display's pixel density so text stays sharp; the game itself is 640x360.
let pixelScale = 1;
function fit() {
  const fitScale = Math.min(window.innerWidth / VW, window.innerHeight / VH);
  canvas.style.width = `${Math.floor(VW * fitScale)}px`;
  canvas.style.height = `${Math.floor(VH * fitScale)}px`;
  pixelScale = Math.max(1, Math.round(fitScale * (window.devicePixelRatio || 1)));
  canvas.width = VW * pixelScale;
  canvas.height = VH * pixelScale;
}
window.addEventListener('resize', fit);
fit();

const TICK = 1 / 60;
const AUTOSAVE_EVERY = 20;

let screen = 'title';
let chars = [];
const lobby = { slot: 0, confirm: false };
let draft = null;
let world = null;
let uiState = null;
let camera = null;
let autosave = AUTOSAVE_EVERY;

function startGame(char) {
  world = createWorld(char);
  world.settings = settings;
  world.bots = createBots(world);
  world.onKill = (m) => shareKill(world.bots, world, m);
  uiState = createUiState();
  camera = createCamera();
  screen = 'game';
  autosave = AUTOSAVE_EVERY;
  if (!char.quests.first_steps) world.log('Welcome! Walk up to Mira and press Up to talk.', '#ffe36b');
}

function loadChars() {
  chars = Array.from({ length: SLOTS }, (_, i) => (hasSave(i) ? loadGame(i) : null));
}

function newCharacter(name, look, slot = 0) {
  const char = createCharacter(name, look);
  char.slot = slot;
  addItem(char.inventory, 'red_potion', 3);
  char.hotkeys.Digit1 = { item: 'red_potion' };
  char.hotkeys.Digit2 = { item: 'blue_potion' };
  return char;
}

window.addEventListener('visibilitychange', () => {
  if (document.hidden && world) saveGame(world.char);
});

let last = performance.now();
let acc = 0;
let queued = new Set();

// HD drops its costliest extras (the glow, then the lighting) on a device that can't keep up.
const perf = { frames: 0, time: 0 };
function watchSpeed(raw) {
  if (!settings.hdGraphics || raw > 0.25) return;
  perf.frames++;
  perf.time += raw;
  if (perf.time < 4) return;
  if (perf.frames / perf.time < 40) {
    if (!gfx.noGlow) gfx.noGlow = true;
    else gfx.noLight = true;
  }
  perf.frames = 0;
  perf.time = 0;
}

function frame(now) {
  const raw = (now - last) / 1000;
  const dt = Math.min(0.1, raw);
  last = now;
  watchSpeed(raw);
  const time = now / 1000;
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  setHd(settings.hdGraphics, pixelScale);
  const ui = beginUi(ctx, input);

  if (screen === 'title') {
    if (titleScreen(ui, time)) {
      loadChars();
      lobby.slot = Math.max(0, chars.findIndex(Boolean));
      lobby.confirm = false;
      screen = 'select';
    }
  } else if (screen === 'select') {
    const pick = selectScreen(ui, time, chars, lobby);
    if (pick === 'back') screen = 'title';
    if (pick === 'start') startGame(loadGame(lobby.slot));
    if (pick === 'delete') {
      deleteSave(lobby.slot);
      loadChars();
    }
    if (pick === 'create') {
      draft = { name: '', look: randomLook() };
      screen = 'creator';
    }
  } else if (screen === 'creator') {
    const pick = creatorScreen(ui, time, draft);
    if (pick === 'back') screen = 'select';
    if (pick === 'start') {
      const char = newCharacter(draft.name.trim(), draft.look, lobby.slot);
      saveGame(char);
      startGame(char);
    }
  } else {
    const locked = routeInput(uiState, world, input, dt);
    acc += dt;
    for (const code of input.pressed) queued.add(code);
    while (acc >= TICK) {
      acc -= TICK;
      // Hitstop: a few frozen ticks on big hits. Presses wait for the next real tick.
      if (!settings.hitStop) world.hitstop = 0;
      if (world.hitstop > 0) {
        world.hitstop -= TICK;
        continue;
      }
      updateWorld(world, TICK, { held: input.held, pressed: queued, locked });
      queued = new Set();
    }
    updateBots(world.bots, world, dt);
    if (world.events.some((e) => e.type === 'map')) saveGame(world.char);
    autosave -= dt;
    if (autosave <= 0) {
      saveGame(world.char);
      autosave = AUTOSAVE_EVERY;
    }
    updateCamera(camera, world, dt);
    drawWorld(ctx, world, camera, time);
    drawUi(ui, uiState, world);
    npcPointer(ui);
    // The Options window can send you back to character select or the title.
    if (uiState.action) {
      const action = uiState.action;
      saveGame(world.char);
      lobby.slot = world.char.slot ?? 0;
      world = null;
      uiState = null;
      canvas.style.cursor = '';
      if (action === 'select') {
        loadChars();
        lobby.confirm = false;
        screen = 'select';
      } else {
        screen = 'title';
      }
    }
  }

  if (settings.filter === 'retro') drawRetro(ctx, pixelScale);
  const filter = FILTERS[settings.filter] ?? '';
  if (canvas.style.filter !== filter) canvas.style.filter = filter;
  endUi(ui);
  endFrame(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Clicking people: an NPC to talk to them (a setting), another player or yourself to see their
// profile. Hovering highlights whoever is under the mouse and shows a hand cursor.
function npcPointer(ui) {
  const m = input.mouse;
  let npc = null;
  let bot = null;
  let self = false;
  if (!uiState.npc && !uiState.death && !ui.used) {
    const wx = m.x + camera.x;
    const wy = m.y + camera.y;
    const gy = world.map.groundY;
    if (settings.npcClick) npc = world.map.npcs.find((n) => Math.abs(n.x - wx) < 14 && wy > gy - 50 && wy < gy + 14) ?? null;
    // Party members, wherever they are on the map.
    if (!npc) bot = partyMembers(world.bots).find((b) => b.body && b.map === world.map.id && Math.abs(b.body.x - wx) < 13 && wy > b.body.y - 46 && wy < b.body.y + 13) ?? null;
    if (!npc && !bot && settings.showCrowd && world.map.isTown) {
      bot = botsIn(world.bots, world.map.id).find((b) => (Math.abs(b.x - wx) < 13 && wy > gy - 46 && wy < gy + 22) || (b.shop && Math.abs(b.x - wx) < 40 && wy > gy - 76 && wy < gy - 58)) ?? null;
    }
    const b = world.body;
    if (!npc && !bot) self = Math.abs(b.x - wx) < 12 && wy > b.y - 46 && wy < b.y + 13;
  }
  world.hoverNpc = npc?.id ?? null;
  world.hoverBot = bot?.id ?? null;
  world.hoverSelf = self;
  canvas.style.cursor = npc || bot || self ? 'pointer' : '';
  // Right-click a player or yourself for the menu (invite to party, profile, leave).
  if (m.right && (bot || self)) {
    openMenu(uiState, bot ? { kind: 'bot', id: bot.id, x: m.x + 4, y: m.y } : { kind: 'self', x: m.x + 4, y: m.y });
    m.right = false;
    return;
  }
  if (!m.clicked) return;
  if (npc) world.events.push({ type: 'talk', npc: npc.id });
  else if (bot) openProfile(uiState, { kind: 'bot', id: bot.id, shop: Boolean(bot.shop) });
  else if (self) openProfile(uiState, { kind: 'self' });
  if (npc || bot || self) m.clicked = false;
}

// Exposed for debugging and automated play tests.
window.twzt = {
  get world() { return world; },
  get ui() { return uiState; },
  start(name = 'Tester', look = randomLook()) {
    startGame(newCharacter(name, look));
  },
};
