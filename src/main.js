// Entry point: canvas setup, fixed-timestep loop, input wiring.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TICK = 1 / 60;
const GRAVITY = 1800;
const MOVE_SPEED = 260;
const JUMP_VELOCITY = -620;
const FLOOR_Y = 520;

const keys = new Set();
window.addEventListener('keydown', (e) => keys.add(e.code));
window.addEventListener('keyup', (e) => keys.delete(e.code));

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const player = { x: 100, y: FLOOR_Y - 48, w: 28, h: 48, vx: 0, vy: 0, onGround: false };

function update(dt) {
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  player.vx = (right - left) * MOVE_SPEED;

  if ((keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) && player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  }

  player.vy += GRAVITY * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.y + player.h >= FLOOR_Y) {
    player.y = FLOOR_Y - player.h;
    player.vy = 0;
    player.onGround = true;
  }
}

function render() {
  ctx.fillStyle = '#1b2030';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#3a5a3a';
  ctx.fillRect(0, FLOOR_Y, canvas.width, canvas.height - FLOOR_Y);

  ctx.fillStyle = '#e0b060';
  ctx.fillRect(player.x, player.y, player.w, player.h);
}

let accumulator = 0;
let last = performance.now();

function frame(now) {
  accumulator += Math.min((now - last) / 1000, 0.25);
  last = now;
  while (accumulator >= TICK) {
    update(TICK);
    accumulator -= TICK;
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
