// Render-only particles and camera shake: footstep dust, landing puffs, hit sparks, defeat poofs,
// and ambient motes per map theme. Nothing here affects gameplay.

import { snap } from './pixel.js';
import { settings } from '../core/settings.js';
import { ITEMS } from '../data/items.js';
import { ELEMENTS } from './elements.js';
import { hasValor, hasFaith, hasRage } from '../world/melee.js';
import { needle, starFlash, shardRing, puff, crown, shock, wisp, contrast, stepped, inked, easeOut, easeIn } from './fxkit.js';

const MAX = 600;

export function createParticles() {
  return { list: [], trauma: 0, delayed: [], ambientTimer: 0, kick: { x: 0, y: 0 } };
}

function add(fx, p) {
  // The Particles setting thins or skips them; ambient motes are part of the scenery and stay.
  if (!p.ambient && settings.particles !== 'full' && (settings.particles === 'off' || Math.random() < 0.5)) return;
  if (fx.list.length >= MAX) fx.list.shift();
  // `delay` holds a particle back (unseen and still) so a burst can play in order.
  fx.list.push({ age: -(p.delay ?? 0), g: 0, drag: 0, grow: 0, shape: 'dot', alpha: 1, spin: 0, ...p });
}

// A camera kick: the view jolts a few pixels the way a blow went and springs back, on top of
// the shake (a finisher pushes it forward, a slam down, getting hit away from the hitter).
export function kick(fx, x, y) {
  fx.kick.x = Math.max(-8, Math.min(8, fx.kick.x + x));
  fx.kick.y = Math.max(-8, Math.min(8, fx.kick.y + y));
}

// Screen shake is "trauma": every jolt adds to it, it drains away over time, and the camera moves
// by its square along smooth noise, so small bumps barely register and big hits stack up into a
// real quake instead of the newest shake replacing the last. `dur` sets how long a jolt lingers.
const SHAKE_MAX = 10;
export function shake(fx, mag, dur) {
  const was = fx.trauma;
  fx.trauma = Math.min(1, fx.trauma + mag / 9);
  // Drain so this jolt lasts about `dur`, but never cut short a longer quake still running.
  const drain = fx.trauma / Math.max(0.15, dur);
  fx.drain = was > 0 ? Math.min(fx.drain, drain) : drain;
}

// Smooth noise in -1..1 from a few unrelated sines (cheap, continuous, never repeats visibly).
const wobble = (t, seed) => (Math.sin(t * 17.3 + seed) + Math.sin(t * 29.1 + seed * 2.1) * 0.6 + Math.sin(t * 47.7 + seed * 3.7) * 0.3) / 1.9;

// Camera offset for this frame.
export function shakeOffset(fx, time) {
  if (!settings.screenShake || settings.screenShake === 'off') return [0, 0];
  // Low keeps the feel of a hit with less than half the movement.
  const k = fx.trauma * fx.trauma * SHAKE_MAX * (settings.screenShake === 'low' ? 0.45 : 1);
  return [snap(wobble(time, 1) * k + fx.kick.x), snap(wobble(time, 7) * k * 0.7 + fx.kick.y)];
}

// Cel dust puffs kicked up from the ground: little two-tone lumps that pop up, drift, and
// shrink away. `dir` sends them one way (a footstep); 0 spreads them both ways.
export function dust(fx, x, y, count, dir = 0, color = '#f6ece2', shade = '#e2d2c4', soft = false) {
  for (let i = 0; i < count; i++) {
    const side = dir || (i % 2 ? 1 : -1);
    add(fx, {
      x: x + side * (2 + Math.random() * 4), y: y - 2,
      vx: side * (25 + Math.random() * 45), vy: -12 - Math.random() * 22,
      drag: 5, life: 0.32 + Math.random() * 0.18, size: (2.4 + Math.random() * 1.6) * (soft ? 2.2 : 1), shape: soft ? 'haze' : 'puff', color, shade,
    });
  }
}

// A slam's colours for each path: [rock spikes, dust, dust shade, shockwave].
const SLAM_TINTS = {
  steel: ['#c9b6ff', '#efe8fb', '#cdbfe6', '#ffffff'],
  holy: ['#ffdc78', '#f4ead8', '#cdb9a0', '#fff6d0'],
  hawk: ['#ffc94a', '#fff6d0', '#ffd9a0', '#fff1bc'],
  rage: ['#e01c3c', '#8a7470', '#4a3438', '#ff7a4e'],
};

// Embers spitting up out of the ground (a Berserker's blows), `n` of them across `w`.
function embers(fx, x, y, n, w = 30) {
  for (let i = 0; i < n; i++) add(fx, { x: x + (Math.random() - 0.5) * w, y, vx: (Math.random() - 0.5) * 60, vy: -120 - Math.random() * 120, drag: 1.8, life: 0.5 + Math.random() * 0.3, size: 2, shape: 'needle', color: ['#ff7a4e', '#ffd7a0', '#e01c3c'][i % 3] });
}

// Landing: dust skids out to both sides along the ground, with puffs.
export function landing(fx, x, y, hard) {
  for (const side of [-1, 1]) add(fx, { x: x + side * 4, y, vx: side * (hard ? 70 : 45), vy: 0, drag: 6, life: hard ? 0.4 : 0.3, size: hard ? 14 : 9, h: hard ? 5 : 3.5, dir: side, shape: 'wisp', color: '#f6ece2', shade: '#e2d2c4' });
  dust(fx, x, y, hard ? 6 : 3);
}

// A hit, drawn in order like a hand-timed impact: a dark contrast disc for a moment, then a star
// flash snapping open over it (a different spike count each time), teardrop sparks flying off
// the way the blow went (falling as they go), and a little shockwave. Crits flash bigger and
// burst a ring of shards.
export function sparks(fx, x, y, crit, dir, palette = null, real = false) {
  const hot = palette ? palette[0] : crit ? '#ffb347' : '#ffd66b';
  const lag = 1 / 60;
  // The realistic paths (`real`) only throw sparks: their own hit art is the flash.
  if (!real) {
    add(fx, { x, y, vx: 0, vy: 0, life: crit ? 0.05 : 0.034, size: crit ? 10 : 6, shape: 'contrast', color: hot });
    add(fx, { x, y, vx: 0, vy: 0, delay: lag, life: crit ? 0.2 : 0.14, size: crit ? 17 : 10, shape: 'flash', rot: Math.random() * Math.PI, spikes: crit ? 6 : 4 + Math.floor(Math.random() * 2), color: hot });
  }
  const n = crit ? 12 : 7;
  for (let i = 0; i < n; i++) {
    const a = (Math.random() - 0.5) * Math.PI * 1.3 + (dir > 0 ? 0 : Math.PI);
    const sp = 140 + Math.random() * (crit ? 230 : 150);
    add(fx, {
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, g: 420, drag: 4, delay: lag,
      life: 0.2 + Math.random() * 0.18, size: crit ? 3 : 2.5, shape: 'needle',
      color: palette ? palette[i % palette.length] : i % 3 ? hot : '#ffffff',
    });
  }
  if (real) return;
  add(fx, { x, y, vx: 0, vy: 0, delay: lag, life: crit ? 0.2 : 0.13, size: 4, r1: crit ? 24 : 12, thick: crit ? 2.5 : 1.6, flat: 1, shape: 'shock', color: '#ffffff' });
  if (crit) add(fx, { x, y, vx: 0, vy: 0, delay: lag, life: 0.3, size: 6, r1: 30, thick: 4, shape: 'shards', n: 9, seed: Math.random(), rot: Math.random() * 6, color: hot });
}

// One blast of a defeat, in Saint11's layers: a dark contrast disc, a white flash, quick warm
// fire puffs that burn out fast, then pale smoke that billows, curls, and tears apart slowly.
function blast(fx, x, y, r, n, delay, big) {
  add(fx, { x, y, vx: 0, vy: 0, delay, life: big ? 0.06 : 0.04, size: r * 0.7, shape: 'contrast', color: '#ffb38a' });
  add(fx, { x, y, vx: 0, vy: 0, delay: delay + 1 / 60, life: big ? 0.26 : 0.16, size: r * 1.3, shape: 'flash', rot: Math.random(), spikes: big ? 8 : 4 + Math.floor(Math.random() * 3), color: '#ffe9a8' });
  for (let i = 0; i < Math.ceil(n / 2); i++) {
    const a = (i / Math.ceil(n / 2)) * Math.PI * 2 + Math.random() * 0.6;
    const sp = r * (3 + Math.random() * 2);
    add(fx, {
      x: x + Math.cos(a) * r * 0.2, y: y + Math.sin(a) * r * 0.2, delay: delay + 1 / 60,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - 10, drag: 6,
      life: 0.15 + Math.random() * 0.1, size: r * (0.45 + Math.random() * 0.2), shape: 'puff', color: '#fff6c9', shade: '#ffb38a',
    });
  }
  const drift = (Math.random() - 0.5) * 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
    const sp = r * (3 + Math.random() * 2.5);
    add(fx, {
      x: x + Math.cos(a) * r * 0.35, y: y + Math.sin(a) * r * 0.35, delay: delay + 2 / 60,
      vx: Math.cos(a) * sp + drift, vy: Math.sin(a) * sp * 0.6 - 14, drag: 3.5, curl: 18, phase: Math.random() * 6,
      life: 0.5 + Math.random() * 0.3, size: r * (0.5 + Math.random() * 0.3), shape: 'puff', holes: true, seed: Math.random(),
      color: '#ffffff', shade: i % 3 ? '#e4dcf4' : '#f6dcea',
    });
  }
}

// A defeated monster bursts into a cel smoke cloud, and a few stars tossed up after it. Bosses
// go up in a chain of blasts across their body, then a huge shockwave and a ring of shards.
export function poof(fx, x, y, w, h, boss) {
  const cy = y - h / 2;
  const r = Math.max(w, h) * 0.3;
  if (boss) {
    for (let k = 0; k < 5; k++) {
      const a = k * 2.4;
      blast(fx, x + Math.cos(a) * w * 0.3 * (k ? 1 : 0), cy + Math.sin(a) * h * 0.3 * (k ? 1 : 0), Math.max(14, r * (k === 4 ? 0.9 : 0.6)), k === 4 ? 14 : 6, k * 0.08, k === 4);
    }
    add(fx, { x, y: cy, vx: 0, vy: 0, delay: 0.34, life: 0.5, size: 10, r1: 120, thick: 6, flat: 1, shape: 'shock', color: '#ffffff' });
    add(fx, { x, y: cy, vx: 0, vy: 0, delay: 0.34, life: 0.55, size: 14, r1: 90, thick: 7, shape: 'shards', n: 12, seed: Math.random(), rot: 0, color: '#ffe36b' });
  } else {
    blast(fx, x, cy, Math.max(9, r), 7, 0, false);
  }
  for (let i = 0; i < (boss ? 14 : 4); i++) {
    add(fx, {
      x, y: cy, vx: (Math.random() - 0.5) * 170, vy: -90 - Math.random() * 130, g: 400, delay: boss ? 0.4 : 0.05,
      life: 0.7 + Math.random() * 0.3, size: 2, shape: 'star', spin: 6, color: ['#ffe36b', '#ff9ec0', '#8fe3ff'][i % 3],
    });
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

// The paths drawn as real light, fire and lightning (the Paladin, the Berserker, the Stormcaller):
// their hits throw only sparks of their own colour, no cartoon star or ring.
const REAL_SPARKS = { holy: ['#fff3c4', '#ffd36a', '#ffffff'], rage: ['#ffd27a', '#ff7a3a', '#e0301c'], storm: ['#efe4ff', '#b48cff', '#ffffff'], steel: ['#ffffff', '#ffc070', '#e6f4ff'] };
// A blow's school when the hit doesn't say: a warrior's path (the Warrior's steel is his alone; a
// Thief's blade is drawn the old way still).
const blowSchool = (j, char) => j.school ?? (hasFaith(char) ? 'holy' : hasRage(char) ? 'rage' : hasValor(char) ? 'steel' : null);
const realOf = (j, char) => {
  const school = blowSchool(j, char);
  return school === 'steel' && !hasValor(char) ? null : REAL_SPARKS[school];
};

// Handles the world's game-feel cues.
export function absorbJuice(fx, world) {
  for (const j of world.juice) {
    if (j.type === 'hit') sparks(fx, j.x, j.y, j.crit, j.dir, realOf(j, world.char) ?? elementOf(world)?.sparks, Boolean(realOf(j, world.char)));
    else if (j.type === 'kill') {
      poof(fx, j.x, j.y, j.w, j.h, j.boss);
      if (j.boss) {
        // The boss stop: a white flash over everything, a quake, and the world easing into slow
        // motion for a moment while the blasts go off.
        shake(fx, 7, 0.8);
        kick(fx, 0, 4);
        if (settings.screenShake === 'full' || settings.screenShake === true) add(fx, { x: 0, y: 0, vx: 0, vy: 0, life: 0.12, size: 1, shape: 'screenflash', color: '#ffffff' });
        world.slowmo = Math.max(world.slowmo ?? 0, 0.75);
      }
    } else if (j.type === 'screenflash') {
      // A wash of colour over the whole screen for a beat (a finisher's big impacts).
      if (settings.screenShake === 'full' || settings.screenShake === true) add(fx, { x: 0, y: 0, vx: 0, vy: 0, life: j.life ?? 0.14, size: 1, shape: 'screenflash', color: j.color ?? '#ffffff' });
    } else if (j.type === 'shockring') {
      // A flat shockwave ring racing out along the ground from (x, y).
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, delay: j.delay ?? 0, life: j.life ?? 0.5, size: j.r0 ?? 10, r1: j.r1 ?? 140, thick: j.thick ?? 8, flat: j.flat ?? 0.3, shape: 'shock', color: j.color ?? '#ffffff' });
    } else if (j.type === 'hurt') {
      shake(fx, 3, 0.22);
      // Jolt the view away from whatever hit you.
      const near = world.mobs.reduce((a, m) => (m.hp > 0 && (!a || Math.abs(m.x - j.x) < Math.abs(a.x - j.x)) ? m : a), null);
      kick(fx, near ? -Math.sign(near.x - j.x) * 2.5 : 0, 1);
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.04, size: 8, shape: 'contrast', color: '#ff6b8a' });
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, delay: 1 / 60, life: 0.15, size: 13, shape: 'flash', rot: Math.random(), spikes: 4, color: '#ff6b8a' });
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        add(fx, { x: j.x, y: j.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, g: 380, drag: 3, delay: 1 / 60, life: 0.3, size: 2, shape: 'needle', color: i % 2 ? '#ff9ec0' : '#ffffff' });
      }
    } else if (j.type === 'dust') {
      // A companion's footwork (a lunge, a planted heel): dust kicked up from under a foot.
      dust(fx, j.x, j.y, j.count ?? 3, j.dir ?? 0);
    } else if (j.type === 'oniimpact') {
      // The oni's club landing: a hot starburst, shards flung out, and on a big blow a red flash
      // over the whole screen and the view kicked down.
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: j.big ? 0.26 : 0.16, size: j.big ? 30 : 16, shape: 'flash', rot: Math.random(), spikes: j.big ? 8 : 5, color: '#ff6a3a' });
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: j.big ? 0.4 : 0.25, size: 6, r1: j.big ? 56 : 30, thick: j.big ? 6 : 4, shape: 'shards', n: j.big ? 11 : 7, seed: Math.random(), rot: Math.random() * 6, color: '#ffd0a0' });
      if (j.big) {
        add(fx, { x: 0, y: 0, vx: 0, vy: 0, life: 0.12, size: 1, shape: 'screenflash', color: '#ff4a2a' });
        kick(fx, 0, 3);
      } else kick(fx, 0, 1.4);
    } else if (j.type === 'confetti') {
      // A shower of confetti over (x, y), `w` wide: little paper bits tumbling down (a wedding, a
      // festival, a winner).
      const colors = j.colors ?? ['#ff8fc1', '#ffe36b', '#8fd3ff', '#9be08f', '#c9a6ff', '#ffffff'];
      for (let i = 0; i < (j.count ?? 40); i++) {
        add(fx, { x: j.x + (Math.random() - 0.5) * (j.w ?? 160), y: j.y - Math.random() * 40, vx: (Math.random() - 0.5) * 40, vy: -40 - Math.random() * 60, g: 60, drag: 1.5, delay: Math.random() * 0.4, life: 2 + Math.random() * 1.2, size: 1.6 + Math.random(), shape: 'petal', spin: 6 + Math.random() * 6, phase: Math.random() * 6, color: colors[i % colors.length] });
      }
    } else if (j.type === 'firework') {
      // A firework: a streak climbing, then a ring of sparks bursting and drifting down.
      const color = j.color ?? '#ffe36b';
      const up = j.rise ?? 120;
      add(fx, { x: j.x, y: j.y, vx: 0, vy: -up / 0.6, life: 0.6, size: 1.2, shape: 'pixel', color: '#fff3c4', delay: j.delay ?? 0 });
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const sp = 70 + Math.random() * 40;
        add(fx, { x: j.x, y: j.y - up, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 50, drag: 1.6, delay: (j.delay ?? 0) + 0.6, life: 1.1 + Math.random() * 0.4, size: 1 + Math.random() * 0.8, shape: i % 3 ? 'glow' : 'star', spin: 4, color: i % 4 ? color : '#ffffff' });
      }
    } else if (j.type === 'hearts') {
      // Hearts floating up and away (a wedding kiss).
      for (let i = 0; i < (j.count ?? 10); i++) {
        add(fx, { x: j.x + (Math.random() - 0.5) * 30, y: j.y, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 30, drag: 0.5, delay: Math.random() * 0.8, life: 1.6 + Math.random(), size: 2.4 + Math.random() * 1.2, shape: 'heart', color: i % 3 ? '#ff8fc1' : '#ff6b8a' });
      }
    } else if (j.type === 'kick') {
      kick(fx, j.x ?? 0, j.y ?? 0);
    } else if (j.type === 'shake') {
      if (j.delay) fx.delayed.push({ at: j.delay, mag: j.mag, dur: j.dur });
      else shake(fx, j.mag, j.dur);
    } else if (j.type === 'loot') {
      add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.4, size: 4, r1: 34, thick: 3, flat: 0.3, shape: 'shock', color: j.color });
      for (let i = 0; i < 8; i++) add(fx, { x: j.x + (Math.random() - 0.5) * 16, y: j.y, vx: (Math.random() - 0.5) * 30, vy: -110 - Math.random() * 90, drag: 2.5, life: 0.5, size: 1.8, shape: 'needle', color: i % 2 ? j.color : '#ffffff' });
      for (let i = 0; i < 5; i++) add(fx, { x: j.x + (Math.random() - 0.5) * 16, y: j.y, vx: 0, vy: -50 - Math.random() * 60, drag: 1, life: 0.7, size: 1.5, shape: 'star', spin: 4, color: i % 2 ? j.color : '#ffffff' });
    } else if (j.type === 'stomp') {
      // A warrior plants a foot to put their weight into a big move: a puff of dust skids out
      // from under it, the view dips, and a heavy move adds a small ring on the ground.
      // The realistic jobs' (the Warrior and his paths) kicks up soft earthy dust, no outline.
      const soft = hasValor(world.char) || hasFaith(world.char) || hasRage(world.char);
      const [, puff, puffShade] = soft ? [null, '#d8cec4', '#b0a69e'] : SLAM_TINTS[j.school] ?? SLAM_TINTS.steel;
      dust(fx, j.x - j.dir * 4, j.y, j.big ? 6 : 3, -j.dir, puff, puffShade, soft);
      dust(fx, j.x + j.dir * 4, j.y, j.big ? 3 : 1, j.dir, puff, puffShade, soft);
      kick(fx, 0, j.big ? 2 : 1);
      if (j.big && j.school === 'rage') embers(fx, j.x, j.y, 6);
      else if (j.big && !soft) add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.3, size: 6, r1: 34, thick: 3, flat: 0.22, shape: 'shock', color: '#ffffff' });
    } else if (j.type === 'slam') {
      // A heavy stomp: rock spikes burst up, dust billows along the ground, and a shockwave rolls out
      // in lavender rock; the paths' are real light and fire (render/warrior-fx.js draws their
      // burst), so a Paladin's throws up specks of light and a Berserker's embers instead.
      const real = j.school === 'steel' && hasValor(world.char);
      const [spike, puff, puffShade, ring] = real ? ['#ffffff', '#e8e2dc', '#b0a69e', '#ffffff'] : SLAM_TINTS[j.school] ?? SLAM_TINTS.steel;
      if (real) {
        // The Warrior's: hot sparks off the struck ground (his burst is drawn in warrior-fx.js).
        for (let i = 0; i < 12; i++) add(fx, { x: j.x + (Math.random() - 0.5) * j.range * 0.6, y: j.y, vx: (Math.random() - 0.5) * 160, vy: -80 - Math.random() * 140, g: 420, drag: 2, life: 0.4 + Math.random() * 0.3, size: 1.8, shape: 'needle', color: i % 3 ? '#ffc070' : '#ffffff' });
      } else if (j.school === 'holy') {
        for (let i = 0; i < 12; i++) add(fx, { x: j.x + (Math.random() - 0.5) * j.range, y: j.y, vx: (Math.random() - 0.5) * 40, vy: -90 - Math.random() * 110, drag: 1.6, life: 0.6 + Math.random() * 0.3, size: 1.8, shape: 'needle', color: i % 3 ? '#ffe9a0' : '#ffffff' });
      } else if (j.school !== 'rage') add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.3, size: 30, w: 26, n: 5, shape: 'crown', color: spike });
      const soft = real || j.school === 'holy' || j.school === 'rage';
      for (let i = 0; i < 14; i++) dust(fx, j.x + (Math.random() - 0.5) * j.range * 1.6, j.y, 1, 0, soft ? '#d8cec4' : puff, puffShade, soft);
      if (!soft) landing(fx, j.x, j.y, true);
      kick(fx, 0, 3);
      // A Berserker's has no smooth ring (his shockwaves are jagged; render/warrior-fx.js): embers
      // spit up out of the torn ground instead.
      if (j.school === 'rage') embers(fx, j.x, j.y, 14, j.range);
      else if (j.school !== 'holy' && !real) add(fx, { x: j.x, y: j.y, vx: 0, vy: 0, life: 0.45, size: 16, r1: j.range * 1.3, thick: 5, flat: 0.22, shape: 'shock', color: ring });
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
  shrine: { rate: 3, make: (x, y) => ({ x, y, vx: 12, vy: 10 + Math.random() * 6, life: 7, size: 1.5, shape: 'petal', color: Math.random() < 0.6 ? '#ffc6de' : '#ffffff', spin: 2, sway: 20 }) },
  ridge: { rate: 2, make: (x, y) => ({ x, y, vx: 2, vy: -4, life: 6, size: 1.2, shape: 'glow', color: '#cfe0ff', sway: 10 }) },
  springs: { rate: 2, make: (x, y) => ({ x, y, vx: 2, vy: -8, life: 5, size: 1.5, shape: 'glow', color: '#ffffff', sway: 12 }) },
  snow: { rate: 4, make: (x, y) => ({ x, y, vx: 6, vy: 14 + Math.random() * 8, life: 7, size: 1.4, shape: 'glow', color: '#ffffff', sway: 16 }) },
};

export function updateParticles(fx, dt, world, cam, viewW, viewH) {
  fx.trauma = Math.max(0, fx.trauma - (fx.drain ?? 1) * dt);
  // A kick springs back fast.
  const spring = Math.exp(-16 * dt);
  fx.kick.x *= spring;
  fx.kick.y *= spring;
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
    if (p.age < 0) continue;
    p.vy += p.g * dt;
    // Smoke curls as it drifts.
    if (p.curl) p.vx += Math.sin(p.age * 4 + p.phase) * p.curl * dt * 4;
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
const CEL = new Set(['needle', 'flash', 'shock', 'shards', 'puff', 'crown', 'wisp', 'contrast']);

export function drawParticles(ctx, fx, cam, time) {
  ctx.save();
  for (const p of fx.list) {
    if (p.age < 0) continue;
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
      case 'contrast':
        contrast(ctx, x, y, p.size, p.color);
        break;
      case 'screenflash':
        // Full-screen washes go on the main canvas only (on the glow layer too they'd blow out).
        if (!inked(ctx)) break;
        ctx.globalAlpha = 0.3 * (1 - t);
        ctx.fillRect(0, 0, 640, 360);
        break;
      case 'flash': {
        // Opens tiny-to-huge in one jump, then the spikes pull in and thin out, held on twos
        // (30 drawings a second) so it pops like hand-timed animation.
        const st = stepped(t, Math.max(3, Math.round(p.life * 30)));
        const k = st === 0 ? 0.45 : st < 0.3 ? 1.12 : 1 - ((st - 0.3) / 0.7) * 0.55;
        starFlash(ctx, x, y, p.size * k, p.spikes ?? 4, p.rot ?? 0, p.color, '#ffffff', p.size * 0.3 * (1 - st * 0.8));
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
      case 'haze': {
        // Soft dust, no outline (the realistic jobs' stomps): a blurred cloud that swells and thins.
        const k = t < 0.2 ? easeOut(t / 0.2) : 1;
        const r = p.size * (0.6 + 0.6 * t) * k;
        ctx.save();
        for (const [rr, al] of [[1, 0.18], [0.65, 0.22], [0.35, 0.2]]) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = al * (1 - t);
          ctx.beginPath();
          ctx.arc(x, y, r * rr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }
      case 'puff': {
        // Billows out fast, then shrinks away.
        const k = t < 0.25 ? easeOut(t / 0.25) : 1 - ((t - 0.25) / 0.75) ** 0.8;
        puff(ctx, x, y, p.size * k, p.color, p.shade ?? '#e4dcf4', p.holes && t > 0.45 ? (t - 0.45) / 0.55 : 0, p.seed ?? 0);
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
        ctx.fillRect(snap(x), snap(y), 1, 1);
        break;
      case 'glint': {
        const tw = Math.abs(Math.sin(time * 3 + p.phase));
        ctx.fillRect(snap(x), snap(y), 1, 1);
        if (tw > 0.7) {
          ctx.fillRect(snap(x) - 1, snap(y), 3, 1);
          ctx.fillRect(snap(x), snap(y) - 1, 1, 3);
        }
        break;
      }
      case 'pixel':
        ctx.fillRect(snap(x), snap(y), p.size * 2, p.size * 2);
        break;
      case 'heart': {
        const r = p.size;
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.4, x, y - r * 0.4);
        ctx.bezierCurveTo(x + r * 0.6, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r);
        ctx.fill();
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
