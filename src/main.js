// Entry point: canvas setup, input capture, screen flow, and the fixed-timestep loop.
// Flow: character creator -> class select -> play.

import { createGame, update } from './game.js';
import { drawAppearance, drawGame, drawSelect } from './render.js';
import { CLASSES } from './classes.js';
import { APPEARANCE_FIELDS, cycleAppearance, defaultAppearance } from './appearance.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TICK = 1 / 60;

// Keys currently held, and keys pressed since the last tick.
const held = new Set();
const pressed = new Set();
window.addEventListener('keydown', (e) => {
  if (!held.has(e.code)) pressed.add(e.code);
  held.add(e.code);
  // Stop arrow keys and space from scrolling the page.
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => held.delete(e.code));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const CLASS_KEYS = { Digit1: 'warrior', Digit2: 'mage', Digit3: 'archer' };
const SCREEN = { APPEARANCE: 'appearance', CLASS: 'class', PLAY: 'play' };

let screen = SCREEN.APPEARANCE;
let appearance = defaultAppearance();
let row = 0;
let game = null;

function updateAppearanceScreen() {
  if (pressed.has('ArrowDown')) row = (row + 1) % APPEARANCE_FIELDS.length;
  if (pressed.has('ArrowUp')) row = (row - 1 + APPEARANCE_FIELDS.length) % APPEARANCE_FIELDS.length;
  const key = APPEARANCE_FIELDS[row].key;
  if (pressed.has('ArrowRight')) appearance = cycleAppearance(appearance, key, 1);
  if (pressed.has('ArrowLeft')) appearance = cycleAppearance(appearance, key, -1);
  if (pressed.has('Enter') || pressed.has('NumpadEnter')) screen = SCREEN.CLASS;
}

function updateClassScreen() {
  for (const [key, classId] of Object.entries(CLASS_KEYS)) {
    if (pressed.has(key) && CLASSES[classId]) {
      game = createGame(classId, appearance);
      screen = SCREEN.PLAY;
      return;
    }
  }
}

let accumulator = 0;
let last = performance.now();

function frame(now) {
  accumulator += Math.min((now - last) / 1000, 0.25);
  last = now;
  const time = now / 1000;

  if (screen === SCREEN.APPEARANCE) {
    updateAppearanceScreen();
    drawAppearance(ctx, canvas.width, canvas.height, appearance, row, time);
    pressed.clear();
  } else if (screen === SCREEN.CLASS) {
    updateClassScreen();
    drawSelect(ctx, canvas.width, canvas.height, time);
    pressed.clear();
  } else {
    // A press is consumed by the first fixed tick that sees it; frames with no tick keep it.
    while (accumulator >= TICK) {
      update(game, TICK, { held, pressed });
      pressed.clear();
      accumulator -= TICK;
    }
    drawGame(ctx, game, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
