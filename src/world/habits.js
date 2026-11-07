// Monsters live there (the player's map rule): out of a fight, a map's monsters act like it's their
// home, by the map's `habitats` ({ monster id: { naps, home: { x }, play } }):
// (Monsters no longer nap, by day or by night: the player's call, 2026-11-07. A map's old `naps`
// is ignored.)
//   home   wander back to their favourite spot ({ x, y }: the pond, the hive) and idle there, if
//          they live on that floor
//   play   chase another of their kind along the ledge, then turn and get chased back
// Any peaceful monster (one that doesn't chase you) that's been hurt runs off to get away
// (hitMob in world/mobs.js starts that). Habits only steer the wandering: world/mobs.js moves them.

import { isNight } from './daytime.js';

const THINK = [1.2, 2.4];

const busy = (m, now) => m.hp <= 0 || m.stagger > 0 || (m.def.aggro && now < m.aggroUntil) || (m.habit && now < m.habit.until);

export function tickHabits(world, dt, rng = Math.random) {
  const habitats = world.map.habitats;
  if (!habitats || world.dungeon) return;
  const night = isNight(world);
  const now = world.now;
  for (const m of world.mobs) {
    const h = habitats[m.def.id];
    // (Bosses and the guild's elites keep their own minds: always awake, always on the prowl.)
    if (!h || m.def.boss || m.def.elite) continue;
    m.think = (m.think ?? rng() * THINK[1]) - dt;
    if (m.think > 0 || busy(m, now)) continue;
    m.think = THINK[0] + rng() * (THINK[1] - THINK[0]);
    m.habit = null;
    const r = rng();
    if (h.home && Math.abs(m.y - h.home.y) < 4 && h.home.x >= m.x1 && h.home.x <= m.x2 && r < 0.35) {
      m.habit = { kind: 'home', x: h.home.x + (rng() - 0.5) * 70, speed: 1, until: now + 8 };
    } else if (h.play && !night && r < 0.4) {
      const mate = world.mobs.find((o) => o !== m && o.def === m.def && o.hp > 0 && o.x1 === m.x1 && Math.abs(o.x - m.x) < 180 && !busy(o, now));
      if (mate) {
        const run = Math.sign(mate.x - m.x) || 1;
        m.habit = { kind: 'play', chase: mate, speed: 1.7, until: now + 2.4 };
        mate.habit = { kind: 'play', x: mate.x + run * 140, speed: 1.9, until: now + 2.4 };
        mate.think = 2.6;
      }
    }
  }
}

// Where a monster's habit steers it right now: { x, speed } to head for, 'stay' to stay put, or
// null to wander as usual.
export function habitGoal(m, now) {
  const h = m.habit;
  if (!h || now >= h.until) return null;
  if (h.kind === 'nap') return 'stay';
  return { x: h.chase ? h.chase.x : h.x, speed: h.speed };
}

export const napping = (m, now) => m.habit?.kind === 'nap' && now < m.habit.until;
