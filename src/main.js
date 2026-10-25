// Entry point: canvas setup, input capture, class select, and the fixed-timestep loop.

import { createGame, update } from './game.js';
import { drawGame, drawSelect } from './render.js';
import { CLASSES } from './classes.js';

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
let game = null;

function selectClassFromInput() {
  for (const [key, classId] of Object.entries(CLASS_KEYS)) {
    if (pressed.has(key) && CLASSES[classId]) {
      game = createGame(classId);
      return;
    }
  }
}

let accumulator = 0;
let last = performance.now();

function frame(now) {
  accumulator += Math.min((now - last) / 1000, 0.25);
  last = now;

  if (!game) {
    selectClassFromInput();
    pressed.clear();
    drawSelect(ctx, canvas.width, canvas.height);
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
