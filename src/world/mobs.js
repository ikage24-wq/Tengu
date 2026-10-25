// Monster runtime: spawning, respawning, patrol and chase AI, knockback, and the boss slam.

import { MOBS } from '../data/mobs.js';
import { surfacesOf } from './physics.js';

const RESPAWN = 4;
// Each spawn point holds this many monsters (bosses stay single), spread a little apart.
const PER_SPAWN = 2;
const SPREAD = 50;
const AGGRO_TIME = 6;
const HOVER = 46;

let nextUid = 1;

function surfaceFor(map, x, y) {
  const fits = surfacesOf(map).filter((s) => s.y === y && x >= s.x1 && x <= s.x2);
  return fits[0] ?? surfacesOf(map)[0];
}

export function spawnMob(map, spawn) {
  const def = MOBS[spawn.mob];
  const surface = surfaceFor(map, spawn.x, spawn.y);
  // Walkers stay on their ledge; flyers roam a band around their spawn point.
  const x1 = def.fly ? Math.max(def.w, spawn.x - 180) : surface.x1 + def.w / 2;
  const x2 = def.fly ? Math.min(map.width - def.w, spawn.x + 180) : surface.x2 - def.w / 2;
  return {
    uid: nextUid++,
    def,
    spawn,
    x: Math.max(x1, Math.min(x2, spawn.x)),
    y: def.fly ? spawn.y - HOVER : surface.y,
    baseY: def.fly ? spawn.y - HOVER : surface.y,
    x1, x2,
    hp: def.hp,
    dir: Math.random() < 0.5 ? -1 : 1,
    state: 'walk',
    timer: 1 + Math.random() * 2,
    aggroUntil: 0,
    knockVx: 0,
    stagger: 0,
    flash: 0,
    phase: Math.random() * Math.PI * 2,
    special: def.special ? { timer: def.special.every, warn: 0 } : null,
    dying: 0,
    age: 0,
  };
}

export function mobBox(m) {
  return { x: m.x - m.def.w / 2, y: m.y - m.def.h, w: m.def.w, h: m.def.h };
}

export function createSpawner(map) {
  const slots = [];
  for (const s of map.spawns) {
    const copies = MOBS[s.mob].boss ? 1 : PER_SPAWN;
    // Keep copies on the same ledge as the original spawn point.
    const surface = surfaceFor(map, s.x, s.y);
    for (let i = 0; i < copies; i++) {
      const offset = (i - (copies - 1) / 2) * SPREAD;
      const x = Math.max(surface.x1 + 4, Math.min(surface.x2 - 4, s.x + offset));
      slots.push({ spawn: { ...s, x }, mob: null, respawnAt: 0 });
    }
  }
  return { slots };
}

// Fills empty spawn slots whose timers are up. Returns newly spawned mobs.
export function tickSpawner(spawner, map, now) {
  const born = [];
  for (const slot of spawner.slots) {
    if (slot.mob && slot.mob.hp > 0) continue;
    if (slot.mob && slot.mob.hp <= 0 && !slot.respawnAt) slot.respawnAt = now + (slot.spawn.respawn ?? RESPAWN);
    if (!slot.mob || (slot.respawnAt && now >= slot.respawnAt)) {
      slot.mob = spawnMob(map, slot.spawn);
      slot.respawnAt = 0;
      born.push(slot.mob);
    }
  }
  return born;
}

export function hitMob(m, damage, fromX, now) {
  m.hp = Math.max(0, m.hp - damage);
  m.flash = 0.12;
  m.aggroUntil = now + AGGRO_TIME;
  if (!m.def.boss) {
    m.stagger = 0.25;
    m.knockVx = (m.x >= fromX ? 1 : -1) * 90;
  }
  return m.hp <= 0;
}

// Moves one monster. `player` is { x, y } so aggro'd monsters can chase.
// Returns 'slam' on the frame a boss slam lands.
export function updateMob(m, player, dt, now) {
  if (m.hp <= 0) {
    m.dying += dt;
    return null;
  }
  m.flash = Math.max(0, m.flash - dt);
  m.phase += dt;
  m.age += dt;

  let event = null;
  if (m.special) {
    if (m.special.warn > 0) {
      m.special.warn -= dt;
      if (m.special.warn <= 0) {
        event = 'slam';
        m.special.timer = m.def.special.every;
      }
    } else {
      m.special.timer -= dt;
      if (m.special.timer <= 0) m.special.warn = m.def.special.warn;
    }
  }

  if (m.stagger > 0) {
    m.stagger -= dt;
    m.x += m.knockVx * dt;
    m.knockVx *= 0.85;
  } else if (m.special?.warn > 0) {
    // Bosses stand still while winding up.
  } else if (now < m.aggroUntil && m.def.aggro) {
    const dx = player.x - m.x;
    if (Math.abs(dx) > 6) m.dir = Math.sign(dx);
    m.state = 'walk';
    m.x += m.dir * m.def.speed * 1.35 * dt;
    if (m.def.fly) m.baseY += Math.sign(player.y - 30 - m.baseY) * 30 * dt;
  } else {
    m.timer -= dt;
    if (m.timer <= 0) {
      m.state = m.state === 'walk' ? 'idle' : 'walk';
      m.timer = m.state === 'walk' ? 1.5 + Math.random() * 2.5 : 0.8 + Math.random() * 1.5;
      if (m.state === 'walk' && Math.random() < 0.5) m.dir *= -1;
    }
    if (m.state === 'walk') m.x += m.dir * m.def.speed * dt;
  }

  if (m.x <= m.x1) { m.x = m.x1; m.dir = 1; }
  if (m.x >= m.x2) { m.x = m.x2; m.dir = -1; }
  if (m.def.fly) m.y = m.baseY + Math.sin(m.phase * 2.2) * 6;
  return event;
}
