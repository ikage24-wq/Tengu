// Entry point: virtual canvas, input capture, screen flow, and the fixed-timestep loop.
// Flow: character creator -> class select -> play.

import { createGame, update } from './game.js';
import { VW, VH, drawAppearance, drawGame, drawSelect } from './render.js';
import { CLASSES } from './classes.js';
import { APPEARANCE_FIELDS, cycleAppearance, defaultAppearance } from './appearance.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// The game draws at a fixed size and the canvas is scaled up with crisp pixels.
canvas.width = VW;
canvas.height = VH;
function fit() {
  const s = Math.min(window.innerWidth / VW, window.innerHeight / VH);
  canvas.style.width = `${Math.floor(VW * s)}px`;
  canvas.style.height = `${Math.floor(VH * s)}px`;
}
window.addEventListener('resize', fit);
fit();

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
    drawAppearance(ctx, VW, VH, appearance, row, time);
    pressed.clear();
  } else if (screen === SCREEN.CLASS) {
    updateClassScreen();
    drawSelect(ctx, VW, VH, time);
    pressed.clear();
  } else {
    // A press is consumed by the first fixed tick that sees it; frames with no tick keep it.
    while (accumulator >= TICK) {
      update(game, TICK, { held, pressed });
      pressed.clear();
      accumulator -= TICK;
    }
    drawGame(ctx, game, VW, VH);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
