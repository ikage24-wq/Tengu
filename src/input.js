// Keyboard and mouse input. Mouse positions are converted into the 640x360 game space.

export const VW = 640;
export const VH = 360;

const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'AltLeft', 'AltRight', 'Tab']);

export function createInput(canvas) {
  const input = {
    held: new Set(),
    pressed: new Set(),
    mouse: { x: -1, y: -1, down: false, clicked: false, double: false, released: false, right: false, wheel: 0 },
    typed: [], // printable characters typed this frame, for name entry
  };

  window.addEventListener('keydown', (e) => {
    if (!input.held.has(e.code)) input.pressed.add(e.code);
    input.held.add(e.code);
    if (e.key.length === 1) input.typed.push(e.key);
    if (e.key === 'Backspace') input.typed.push('\b');
    if (GAME_KEYS.has(e.code) || e.altKey) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => input.held.delete(e.code));
  window.addEventListener('blur', () => input.held.clear());

  const toGame = (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouse.x = ((e.clientX - r.left) / r.width) * VW;
    input.mouse.y = ((e.clientY - r.top) / r.height) * VH;
  };
  canvas.addEventListener('mousemove', toGame);
  canvas.addEventListener('mousedown', (e) => {
    toGame(e);
    if (e.button === 2) input.mouse.right = true;
    else {
      input.mouse.down = true;
      input.mouse.clicked = true;
      // The browser counts rapid clicks; the second one of a double-click has detail 2.
      if (e.detail >= 2) input.mouse.double = true;
    }
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button !== 2 && input.mouse.down) input.mouse.released = true;
    input.mouse.down = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    input.mouse.wheel += Math.sign(e.deltaY);
    e.preventDefault();
  }, { passive: false });

  return input;
}

// Call once at the end of every frame.
export function endFrame(input) {
  input.pressed.clear();
  input.typed.length = 0;
  input.mouse.clicked = false;
  input.mouse.double = false;
  input.mouse.released = false;
  input.mouse.right = false;
  input.mouse.wheel = 0;
}
