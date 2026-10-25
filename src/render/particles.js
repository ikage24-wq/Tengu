// Render-only particles and camera shake: footstep dust, landing puffs, hit sparks, defeat poofs,
// and ambient motes per map theme. Nothing here affects gameplay.

import { ITEMS } from '../data/items.js';
import { ELEMENTS } from './elements.js';

const MAX = 600;

export function createParticles() {
  return { list: [], shake: { t: 0, dur: 0, mag: 0 }, delayed: [], ambientTimer: 0 };
}

function add(fx, p) {
  if (fx.list.length >= MAX) fx.list.shift();
  fx.list.push({ age: 0, g: 0, drag: 0, grow: 0, shape: 'dot', alpha: 1, spin: 0, ...p });
}

export function shake(fx, mag, dur) {
  if (mag >= fx.shake.mag * (1 - fx.shake.t / Math.max(0.01, fx.shake.dur))) fx.shake = { t: 0, dur, mag };
}

// Camera offset for this frame: a decaying wobble.
export function shakeOffset(fx, time) {
  const s = fx.shake;
  if (s.t >= s.dur) return [0, 0];
  const k = (1 - s.t / s.dur) ** 2 * s.mag;
  return [Math.round(Math.sin(time * 71) * k), Math.round(Math.cos(time * 53) * k * 0.6)];
}

export function dust(fx, x, y, count, dir = 0, color = '#f3e6da') {
  for (let i = 0; i < count; i++) {
    const side = dir || (i % 2 ? 1 : -1);
    add(fx, {
      x: x + side * (2 + Math.random() * 4), y: y - 1,
      vx: side * (20 + Math.random() * 40), vy: -10 - Math.random() * 25,
      drag: 4, life: 0.35 + Math.random() * 0.2, size: 2 + Math.random() * 1.5, grow: 4, color, alpha: 0.8,
    });
  }
}

export function sparks(fx, x, y, crit, dir, palette = null) {
  const n = crit ? 10 : 6;
  for (let i = 0; i < n; i++) {
    const a = (Math.random() - 0.5) * Math.PI * 1.2 + (dir > 0 ? 0 : Math.PI);
    const sp = 90 + Math.random() * (crit ? 170 : 110);
    add(fx, {
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: 300, drag: 3,
      life: 0.25 + Math.random() * 0.2, size: crit ? 2 : 1.5, shape: 'streak',
      color: palette ? palette[i % palette.length] : crit ? (i % 2 ? '#ffb347' : '#fff3a6') : i % 2 ? '#ffffff' : '#ffe9f5',
    });
  }
  if (crit) add(fx, { x, y, vx: 0, vy: 0, life: 0.18, size: 6, grow: 60, shape: 'ring', color: '#fff3a6' });
}

// A soft cloud of puffs and a few stars where a monster was defeated.
export function poof(fx, x, y, w, h, boss) {
  const n = boss ? 40 : 9;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (boss ? 80 : 30) + Math.random() * (boss ? 120 : 40);
    add(fx, {
      x: x + Math.cos(a) * w * 0.25, y: y - h / 2 + Math.sin(a) * h * 0.25,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, drag: 3.5,
      life: 0.45 + Math.random() * 0.3, size: 3 + Math.random() * 3, grow: 6, color: i % 3 ? '#ffffff' : '#ffe9f5', alpha: 0.9,
    });
  }
  for (let i = 0; i < (boss ? 16 : 4); i++) {
    add(fx, {
      x, y: y - h / 2, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 120, g: 380,
      life: 0.7 + Math.random() * 0.3, size: 2, shape: 'star', spin: 6, color: ['#ffe36b', '#ff9ec0', '#8fe3ff'][i % 3],
    });
  }
}

// Footsteps of an endgame weapon's wielder: feathers, stardust, sparks, flames, or splashes.
export function elementStep(fx, x, y, element, dir) {
  const c = ELEMENTS[element].sparks;
  switch (element) {
    case 'holy':
      for (let i = 0; i < 2; i++) add(fx, { x: x + (Math.random() - 0.5) * 8, y: y - 2, vx: -dir * 10 + (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 20, drag: 2.5, life: 0.9, size: 1.5, shape: 'petal', spin: 3, sway: 10, phase: i, color: '#ffffff' });
      add(fx, { x, y: y - 1, vx: 0, vy: -20, drag: 2, life: 0.6, size: 0.5, shape: 'star', spin: 0, color: '#ffe36b' });
      break;
    case 'cosmic':
      for (let i = 0; i < 3; i++) add(fx, { x: x + (Math.random() - 0.5) * 10, y: y - 1, vx: -dir * 15 + (Math.random() - 0.5) * 20, vy: -25 - Math.random() * 30, drag: 2, life: 0.8, size: 0.5 + (i % 2), shape: 'star', spin: 0, color: c[i % c.length] });
      break;
    case 'storm':
      for (let i = 0; i < 4; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2;
        add(fx, { x, y: y - 1, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, g: 200, drag: 4, life: 0.22, size: 1, shape: 'streak', color: c[i % 2] });
      }
      break;
    case 'fire':
      for (let i = 0; i < 3; i++) add(fx, { x: x + (Math.random() - 0.5) * 8, y: y - 1, vx: -dir * 8 + (Math.random() - 0.5) * 10, vy: -35 - Math.random() * 25, drag: 2, life: 0.5, size: 2.2 - i * 0.5, grow: -2, color: c[i % 3] });
      break;
    case 'water':
      for (let i = 0; i < 4; i++) add(fx, { x, y: y - 1, vx: (Math.random() - 0.5) * 70, vy: -60 - Math.random() * 50, g: 420, life: 0.45, size: 1, color: i % 2 ? '#ffffff' : '#8fe3ff' });
      ring(fx, x, y, '#c9f6ff', 2, 26);
      break;
  }
  // A brief glowing footprint.
  add(fx, { x, y, vx: 0, vy: 0, life: 0.5, size: 3, grow: 2, shape: 'flatring', color: ELEMENTS[element].color, alpha: 0.7 });
}

// Sparkles drifting up around someone holding an endgame weapon. Call every frame.
export function elementAura(fx, x, y, element, dt) {
  fx.auraTimer = (fx.auraTimer ?? 0) - dt * 14;
  const c = ELEMENTS[element].sparks;
  while (fx.auraTimer <= 0) {
    fx.auraTimer += 1;
    add(fx, {
      x: x + (Math.random() - 0.5) * 30, y: y - Math.random() * 48, vx: (Math.random() - 0.5) * 6, vy: -12 - Math.random() * 16,
      life: 0.7 + Math.random() * 0.5, size: Math.random() < 0.3 ? 1 : 0.4, shape: 'star', spin: 0, color: c[Math.floor(Math.random() * c.length)],
    });
  }
}

export function ring(fx, x, y, color, size, grow) {
  add(fx, { x, y, vx: 0, vy: 0, life: 0.35, size, grow, shape: 'flatring', color });
}

// The player's weapon element, so hits spark in its colors.
function elementOf(world) {
  const w = world.char.equipment.weapon;
  const el = w ? ITEMS[w.id].element : null;
  return el ? ELEMENTS[el] : null;
}

// Handles the world's game-feel cues.
export function absorbJuice(fx, world) {
  for (const j of world.juice) {
    if (j.type === 'hit') sparks(fx, j.x, j.y, j.crit, j.dir, elementOf(world)?.sparks);
    else if (j.type === 'kill') {
      poof(fx, j.x, j.y, j.w, j.h, j.boss);
      if (j.boss) shake(fx, 7, 0.8);
    } else if (j.type === 'hurt') {
      shake(fx, 3, 0.22);
      for (let i = 0; i < 5; i++) add(fx, { x: j.x, y: j.y, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 60, g: 300, life: 0.4, size: 2, shape: 'star', color: '#ff9ec0', spin: 5 });
    } else if (j.type === 'shake') {
      if (j.delay) fx.delayed.push({ at: j.delay, mag: j.mag, dur: j.dur });
      else shake(fx, j.mag, j.dur);
    } else if (j.type === 'loot') {
      ring(fx, j.x, j.y, j.color, 4, 60);
      for (let i = 0; i < 10; i++) add(fx, { x: j.x + (Math.random() - 0.5) * 16, y: j.y, vx: 0, vy: -50 - Math.random() * 60, drag: 1, life: 0.7, size: 1.5, shape: 'star', spin: 4, color: i % 2 ? j.color : '#ffffff' });
    } else if (j.type === 'slam') {
      for (let i = 0; i < 18; i++) dust(fx, j.x + (Math.random() - 0.5) * j.range * 1.6, j.y, 1, 0, '#d9ccef');
      ring(fx, j.x, j.y, '#ffffff', 10, j.range * 2.5);
    }
  }
  world.juice.length = 0;
}

// Floating motes that give each kind of map its mood.
const AMBIENT = {
  town: { rate: 3, make: (x, y) => ({ x, y, vx: 14 + Math.random() * 10, vy: 12 + Math.random() * 8, life: 7, size: 1.5, shape: 'petal', color: '#ffc2d6', spin: 2, sway: 18 }) },
  meadow: { rate: 3, make: (x, y) => ({ x, y, vx: 10, vy: 8 + Math.random() * 6, life: 7, size: 1.5, shape: 'petal', color: Math.random() < 0.5 ? '#ffffff' : '#ffe36b', spin: 2, sway: 22 }) },
  harbor: { rate: 2, make: (x, y) => ({ x, y, vx: 6, vy: -4, life: 6, size: 1, shape: 'glint', color: '#ffffff', sway: 8 }) },
  forest: { rate: 3, make: (x, y) => ({ x, y, vx: 0, vy: -3, life: 6, size: 1.5, shape: 'glow', color: '#d8ff8a', sway: 14 }) },
  ruins: { rate: 2, make: (x, y) => ({ x, y, vx: 3, vy: -5, life: 6, size: 1, shape: 'glow', color: '#c9a6ff', sway: 10 }) },
  cave: { rate: 3, make: (x, y) => ({ x, y, vx: 0, vy: -6, life: 5, size: 1, shape: 'glint', color: '#8fe3ff', sway: 6 }) },
  sky: { rate: 3, make: (x, y) => ({ x, y, vx: 18, vy: 2, life: 7, size: 1.5, shape: 'glint', color: '#fff3a6', sway: 10 }) },
};

export function updateParticles(fx, dt, world, cam, viewW, viewH) {
  fx.shake.t += dt;
  for (const d of fx.delayed) {
    d.at -= dt;
    if (d.at <= 0) shake(fx, d.mag, d.dur);
  }
  fx.delayed = fx.delayed.filter((d) => d.at > 0);

  const amb = AMBIENT[world.map.theme];
  if (amb) {
    fx.ambientTimer -= dt * amb.rate;
    while (fx.ambientTimer <= 0) {
      fx.ambientTimer += 1;
      const x = cam.x - 40 + Math.random() * (viewW + 40);
      const y = cam.y + Math.random() * viewH;
      add(fx, { ...amb.make(x, y), ambient: true, phase: Math.random() * 6 });
    }
  }

  for (const p of fx.list) {
    p.age += dt;
    p.vy += p.g * dt;
    const k = Math.exp(-p.drag * dt);
    p.vx *= k;
    p.vy *= k;
    p.x += p.vx * dt + (p.sway ? Math.sin(p.age * 1.6 + p.phase) * p.sway * dt : 0);
    p.y += p.vy * dt;
    p.size += p.grow * dt;
  }
  fx.list = fx.list.filter((p) => p.age < p.life);
}

export function drawParticles(ctx, fx, cam, time) {
  ctx.save();
  for (const p of fx.list) {
    const t = p.age / p.life;
    // Ambient motes fade in and out; effects fade out.
    const a = p.ambient ? Math.min(1, t * 5, (1 - t) * 4) * (p.shape === 'glow' ? 0.5 + 0.5 * Math.sin(time * 4 + p.phase) : 1) : 1 - t;
    ctx.globalAlpha = Math.max(0, a * p.alpha);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    const x = p.x - cam.x;
    const y = p.y - cam.y;
    switch (p.shape) {
      case 'streak': {
        const len = Math.min(6, Math.hypot(p.vx, p.vy) * 0.03);
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - (p.vx / (Math.hypot(p.vx, p.vy) || 1)) * len, y - (p.vy / (Math.hypot(p.vx, p.vy) || 1)) * len);
        ctx.stroke();
        break;
      }
      case 'ring':
      case 'flatring':
        ctx.lineWidth = 2 * (1 - t) + 0.5;
        ctx.beginPath();
        ctx.ellipse(x, y, Math.max(0.3, p.size), Math.max(0.3, p.shape === 'flatring' ? p.size * 0.18 : p.size), 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'star': {
        const r = p.size + 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.age * p.spin);
        ctx.fillRect(-r, -0.5, r * 2, 1.5);
        ctx.fillRect(-0.5, -r, 1.5, r * 2);
        ctx.restore();
        break;
      }
      case 'petal':
        ctx.beginPath();
        ctx.ellipse(x, y, p.size + 0.5, p.size * (0.4 + 0.4 * Math.abs(Math.sin(p.age * p.spin + p.phase))), p.age, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'glow':
        ctx.globalAlpha *= 0.35;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha /= 0.35;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        break;
      case 'glint': {
        const tw = Math.abs(Math.sin(time * 3 + p.phase));
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        if (tw > 0.7) {
          ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1);
          ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3);
        }
        break;
      }
      default:
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.3, p.size), 0, Math.PI * 2);
        ctx.fill();
    }
  }
  ctx.restore();
}
