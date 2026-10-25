// Render-only particles and camera shake: footstep dust, landing puffs, hit sparks, defeat poofs,
// and ambient motes per map theme. Nothing here affects gameplay.

import { settings } from '../core/settings.js';
import { ITEMS } from '../data/items.js';
import { ELEMENTS } from './elements.js';
import { needle, starFlash, shardRing, puff, crown, shock, wisp, easeOut, easeIn } from './fxkit.js';

const MAX = 600;

export function createParticles() {
  return { list: [], shake: { t: 0, dur: 0, mag: 0 }, delayed: [], ambientTimer: 0 };
}

function add(fx, p) {
  // The Particles setting thins or skips them; ambient motes are part of the scenery and stay.
  if (!p.ambient && settings.particles !== 'full' && (settings.particles === 'off' || Math.random() < 0.5)) return;
  if (fx.list.length >= MAX) fx.list.shift();
  fx.list.push({ age: 0, g: 0, drag: 0, grow: 0, shape: 'dot', alpha: 1, spin: 0, ...p });
}

export function shake(fx, mag, dur) {
  if (mag >= fx.shake.mag * (1 - fx.shake.t / Math.max(0.01, fx.shake.dur))) fx.shake = { t: 0, dur, mag };
}

// Camera offset for this frame: a decaying wobble.
export function shakeOffset(fx, time) {
  const s = fx.shake;
  if (s.t >= s.dur || !settings.screenShake) return [0, 0];
  const k = (1 - s.t / s.dur) ** 2 * s.mag;
  return [Math.round(Math.sin(time * 71) * k), Math.round(Math.cos(time * 53) * k * 0.6)];
}

// Cel dust puffs kicked up from the ground: little two-tone lumps that pop up, drift, and
// shrink away. `dir` sends them one way (a footstep); 0 spreads them both ways.
export function dust(fx, x, y, count, dir = 0, color = '#f6ece2', shade = '#e2d2c4') {
  for (let i = 0; i < count; i++) {
    const side = dir || (i % 2 ? 1 : -1);
    add(fx, {
      x: x + side * (2 + Math.random() * 4), y: y - 2,
      vx: side * (25 + Math.random() * 45), vy: -12 - Math.random() * 22,
      drag: 5, life: 0.32 + Math.random() * 0.18, size: 2.4 + Math.random() * 1.6, shape: 'puff', color, shade,
    });
  }
}

// Landing: dust skids out to both sides along the ground, with puffs.
export function landing(fx, x, y, hard) {
  for (const side of [-1, 1]) add(fx, { x: x + side * 4, y, vx: side * (hard ? 70 : 45), vy: 0, drag: 6, life: hard ? 0.4 : 0.3, size: hard ? 14 : 9, h: hard ? 5 : 3.5, dir: side, shape: 'wisp', color: '#f6ece2', shade: '#e2d2c4' });
  dust(fx, x, y, hard ? 6 : 3);
}

// A hit: a star flash where it lands, teardrop sparks flying off the way the blow went (falling
// as they go), and a little shockwave. Crits flash bigger and burst a ring of shards.
export function sparks(fx, x, y, crit, dir, palette = null) {
  const hot = palette ? palette[0] : crit ? '#ffb347' : '#ffd66b';
  add(fx, { x, y, vx: 0, vy: 0, life: crit ? 0.2 : 0.14, size: crit ? 16 : 10, shape: 'flash', rot: Math.random() * Math.PI, spikes: crit ? 6 : 4, color: hot });
  const n = crit ? 12 : 7;
  for (let i = 0; i < n; i++) {
    const a = (Math.random() - 0.5) * Math.PI * 1.3 + (dir > 0 ? 0 : Math.PI);
    const sp = 140 + Math.random() * (crit ? 230 : 150);
    add(fx, {
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, g: 420, drag: 4,
      life: 0.2 + Math.random() * 0.18, size: crit ? 3 : 2.5, shape: 'needle',
      color: palette ? palette[i % palette.length] : i % 3 ? hot : '#ffffff',
    });
  }
  add(fx, { x, y, vx: 0, vy: 0, life: crit ? 0.2 : 0.13, size: 4, r1: crit ? 24 : 12, thick: crit ? 2.5 : 1.6, flat: 1, shape: 'shock', color: '#ffffff' });
  if (crit) add(fx, { x, y, vx: 0, vy: 0, life: 0.3, size: 6, r1: 30, thick: 4, shape: 'shards', n: 9, seed: Math.random(), rot: Math.random() * 6, color: hot });
}

// A defeated monster bursts into a cel smoke cloud: a flash, a ring of two-tone puffs that
// billow out and shrink away, and a few stars tossed up. Bosses go up in a huge cloud with a
// shockwave and a ring of shards.
export function poof(fx, x, y, w, h, boss) {
  const cy = y - h / 2;
  add(fx, { x, y: cy, vx: 0, vy: 0, life: boss ? 0.3 : 0.16, size: boss ? 40 : Math.max(12, w * 0.6), shape: 'flash', rot: Math.random(), spikes: boss ? 8 : 4, color: '#ffe9a8' });
  const n = boss ? 26 : 8;
  const r = Math.max(w, h) * 0.3;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const sp = (boss ? 90 : 38) + Math.random() * (boss ? 110 : 30);
    add(fx, {
      x: x + Math.cos(a) * r * 0.4, y: cy + Math.sin(a) * r * 0.4,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 18, drag: 4.5,
      life: 0.32 + Math.random() * 0.18, size: (boss ? 9 : 4.5) + Math.random() * (boss ? 6 : 3), shape: 'puff',
      color: '#ffffff', shade: i % 3 ? '#e4dcf4' : '#f6dcea',
    });
  }
  for (let i = 0; i < (boss ? 14 : 4); i++) {
    add(fx, {
      x, y: cy, vx: (Math.random() - 0.5) * 170, vy: -90 - Math.random() * 130, g: 400,
      life: 0.7 + Math.random() * 0.3, size: 2, shape: 'star', spin: 6, color: ['#ffe36b', '#ff9ec0', '#8fe3ff'][i % 3],
    });
  }
  if (boss) {
    add(fx, { x, y: cy, vx: 0, vy: 0, life: 0.5, size: 10, r1: 120, thick: 6, flat: 1, shape: 'shock', color: '#ffffff' });
    add(fx, { x, y: cy, vx: 0, vy: 0, life: 0.55, size: 14, r1: 90, thick: 7, shape: 'shards', n: 12, seed: Math.random(), rot: 0, color: '#ffe36b' });
  }
}

// Footsteps of an endgame weapon's wielder: feathers, stardust, sparks, flames, splashes, embers,
// soul wisps, light streaks, chainsaw sparks and smoke, or neon pixels.
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
    case 'demonic':
      for (let i = 0; i < 3; i++) add(fx, { x: x + (Math.random() - 0.5) * 8, y: y - 1, vx: -dir * 6 + (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 30, drag: 2, life: 0.55, size: 2 - i * 0.5, grow: -2.5, color: ['#3a0614', '#ff3b2b', '#ffb03b'][i] });
      add(fx, { x, y: y - 2, vx: (Math.random() - 0.5) * 20, vy: -50, drag: 1.5, life: 0.8, size: 0.6, color: '#ffb03b' });
      break;
    case 'bone':
      for (let i = 0; i < 2; i++) add(fx, { x: x + (Math.random() - 0.5) * 8, y: y - 2, vx: -dir * 8 + (Math.random() - 0.5) * 12, vy: -18 - Math.random() * 14, drag: 1.5, life: 0.9, size: 2.2, grow: 1.5, color: i ? '#bfffe0' : '#6bff9a', alpha: 0.45 });
      add(fx, { x, y: y - 1, vx: (Math.random() - 0.5) * 50, vy: -40, g: 300, life: 0.4, size: 0.8, color: '#f3e9cf' });
      break;
    case 'laser':
      for (let i = 0; i < 2; i++) add(fx, { x, y: y - 1 - i * 2, vx: -dir * (140 + i * 60), vy: 0, drag: 6, life: 0.25, size: 1, shape: 'streak', color: c[i] });
      add(fx, { x, y: y - 1, vx: 0, vy: -10, life: 0.4, size: 1.2, shape: 'glow', color: '#5ff3ff' });
      break;
    case 'chainsaw':
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 - dir * (0.4 + Math.random() * 0.8);
        add(fx, { x, y: y - 1, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, g: 380, drag: 2, life: 0.3, size: 0.8, shape: 'streak', color: c[i % 3] });
      }
      add(fx, { x: x - dir * 4, y: y - 3, vx: -dir * 10, vy: -14, drag: 1.5, life: 0.8, size: 2, grow: 4, color: '#9a9aa6', alpha: 0.4 });
      break;
    case 'cyber':
      for (let i = 0; i < 3; i++) add(fx, { x: x + Math.round((Math.random() - 0.5) * 10), y: y - 1, vx: 0, vy: -20 - Math.random() * 30, life: 0.6, size: 1, shape: 'pixel', color: c[i % 2] });
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
  add(fx, { x, y, vx: 0, vy: 0, life: 0.35, size, r1: size + grow * 0.35, thick: 2.5, flat: 0.2, shape: 'shock', color });
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
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.15, size: 13, shape: 'flash', rot: Math.random(), spikes: 4, color: '#ff6b8a' });
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        add(fx, { x: j.x, y: j.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, g: 380, drag: 3, life: 0.3, size: 2, shape: 'needle', color: i % 2 ? '#ff9ec0' : '#ffffff' });
      }
    } else if (j.type === 'shake') {
      if (j.delay) fx.delayed.push({ at: j.delay, mag: j.mag, dur: j.dur });
      else shake(fx, j.mag, j.dur);
    } else if (j.type === 'loot') {
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.4, size: 4, r1: 34, thick: 3, flat: 0.3, shape: 'shock', color: j.color });
      for (let i = 0; i < 8; i++) add(fx, { x: j.x + (Math.random() - 0.5) * 16, y: j.y, vx: (Math.random() - 0.5) * 30, vy: -110 - Math.random() * 90, drag: 2.5, life: 0.5, size: 1.8, shape: 'needle', color: i % 2 ? j.color : '#ffffff' });
      for (let i = 0; i < 5; i++) add(fx, { x: j.x + (Math.random() - 0.5) * 16, y: j.y, vx: 0, vy: -50 - Math.random() * 60, drag: 1, life: 0.7, size: 1.5, shape: 'star', spin: 4, color: i % 2 ? j.color : '#ffffff' });
    } else if (j.type === 'slam') {
      // A heavy stomp: rock spikes burst up, dust billows along the ground, and a shockwave rolls out.
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.3, size: 30, w: 26, n: 5, shape: 'crown', color: '#c9b6ff' });
      for (let i = 0; i < 14; i++) dust(fx, j.x + (Math.random() - 0.5) * j.range * 1.6, j.y, 1, 0, '#efe8fb', '#cdbfe6');
      landing(fx, j.x, j.y, true);
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.45, size: 16, r1: j.range * 1.3, thick: 5, flat: 0.22, shape: 'shock', color: '#ffffff' });
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

// Shapes drawn as solid cel art (see fxkit.js).
const CEL = new Set(['needle', 'flash', 'shock', 'shards', 'puff', 'crown', 'wisp']);

export function drawParticles(ctx, fx, cam, time) {
  ctx.save();
  for (const p of fx.list) {
    const t = p.age / p.life;
    // Ambient motes fade in and out; most effects fade out, and cel shapes stay solid and shrink
    // or break apart instead, only fading right at the end.
    const a = p.ambient ? Math.min(1, t * 5, (1 - t) * 4) * (p.shape === 'glow' ? 0.5 + 0.5 * Math.sin(time * 4 + p.phase) : 1) : CEL.has(p.shape) ? Math.min(1, (1 - t) / 0.2) : 1 - t;
    ctx.globalAlpha = Math.max(0, a * p.alpha);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    const x = p.x - cam.x;
    const y = p.y - cam.y;
    switch (p.shape) {
      case 'needle': {
        const sp = Math.hypot(p.vx, p.vy);
        needle(ctx, x, y, Math.atan2(p.vy, p.vx), Math.max(2, Math.min(10, sp * 0.05)) * (1 - t * 0.5), p.size * (1 - t * 0.7), p.color);
        break;
      }
      case 'flash': {
        // Snaps open in the first quarter, then the spikes pull in and thin out.
        const k = t < 0.25 ? easeOut(t / 0.25) : 1 - (t - 0.25) / 0.75 * 0.55;
        starFlash(ctx, x, y, p.size * k, p.spikes ?? 4, p.rot ?? 0, p.color, '#ffffff', p.size * 0.3 * (1 - t * 0.8));
        break;
      }
      case 'shock': {
        // Expands fast and thins out; a flat ring never gets thicker than it is tall.
        const r = p.size + (p.r1 - p.size) * easeOut(t);
        shock(ctx, x, y, r, r * (p.flat ?? 1), Math.min(p.thick * (1 - t) ** 1.3, r * (p.flat ?? 1) * 0.8), p.color);
        break;
      }
      case 'shards':
        shardRing(ctx, x, y, p.size + (p.r1 - p.size) * easeOut(t), p.thick * (1 - t) ** 1.2, p.n, p.seed, p.rot + t * 0.6, p.color);
        break;
      case 'puff': {
        // Billows out fast, then shrinks away.
        const k = t < 0.25 ? easeOut(t / 0.25) : 1 - ((t - 0.25) / 0.75) ** 0.8;
        puff(ctx, x, y, p.size * k, p.color, p.shade ?? '#e4dcf4');
        break;
      }
      case 'crown': {
        const k = t < 0.18 ? easeOut(t / 0.18) : 1 - easeIn((t - 0.18) / 0.82);
        crown(ctx, x, y, p.size * k, p.w, p.n, p.color);
        break;
      }
      case 'wisp': {
        const k = easeOut(Math.min(1, t * 3)) * (1 - easeIn(t));
        wisp(ctx, x, y, p.size * k, p.h * (1 - t * 0.5), p.dir, p.color, p.shade);
        break;
      }
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
      case 'pixel':
        ctx.fillRect(Math.round(x), Math.round(y), p.size * 2, p.size * 2);
        break;
      default:
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0.3, p.size), 0, Math.PI * 2);
        ctx.fill();
    }
  }
  ctx.restore();
}
