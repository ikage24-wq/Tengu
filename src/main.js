// Entry point: canvas scaling, screens (title -> creator -> game), the fixed-step loop, and autosave.

import { createInput, endFrame, VW, VH } from './input.js';
import { beginUi, endUi } from './ui/kit.js';
import { titleScreen, creatorScreen, randomLook } from './ui/screens.js';
import { createUiState, routeInput, drawUi } from './ui/manager.js';
import { createCharacter } from './core/character.js';
import { addItem } from './core/inventory.js';
import { saveGame, loadGame, hasSave } from './core/save.js';
import { createWorld, updateWorld } from './world/world.js';
import { createCamera, updateCamera, drawWorld } from './render/scene.js';

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
let savePreview = hasSave() ? loadGame() : null;
let draft = null;
let world = null;
let uiState = null;
let camera = null;
let autosave = AUTOSAVE_EVERY;

function startGame(char) {
  world = createWorld(char);
  uiState = createUiState();
  camera = createCamera();
  screen = 'game';
  autosave = AUTOSAVE_EVERY;
  if (!char.quests.first_steps) world.log('Welcome! Walk up to Mira and press Up to talk.', '#ffe36b');
}

function newCharacter(name, look) {
  const char = createCharacter(name, look);
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

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  const time = now / 1000;
  ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  const ui = beginUi(ctx, input);

  if (screen === 'title') {
    const pick = titleScreen(ui, time, savePreview);
    if (pick === 'continue') startGame(loadGame());
    if (pick === 'new') {
      draft = { name: '', look: randomLook() };
      screen = 'creator';
    }
  } else if (screen === 'creator') {
    if (creatorScreen(ui, time, draft)) {
      const char = newCharacter(draft.name.trim(), draft.look);
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
      if (world.hitstop > 0) {
        world.hitstop -= TICK;
        continue;
      }
      updateWorld(world, TICK, { held: input.held, pressed: queued, locked });
      queued = new Set();
    }
    if (world.events.some((e) => e.type === 'map')) saveGame(world.char);
    autosave -= dt;
    if (autosave <= 0) {
      saveGame(world.char);
      autosave = AUTOSAVE_EVERY;
    }
    updateCamera(camera, world, dt);
    drawWorld(ctx, world, camera, time);
    drawUi(ui, uiState, world);
  }

  endUi(ui);
  endFrame(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Exposed for debugging and automated play tests.
window.twzt = {
  get world() { return world; },
  get ui() { return uiState; },
  start(name = 'Tester', look = randomLook()) {
    startGame(newCharacter(name, look));
  },
};
