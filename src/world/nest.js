// Area boss nests (the player's map rule): hunt enough on a map and its own boss wakes at its nest,
// a shared moment for everyone there. A map's `nest` is { mob, x, y (the floor it wakes over),
// kills (how many monsters must fall first), name (what stirs) }. The count is kept per map in
// world.nestKills; it rises with every monster that falls there, warns as it gets close, and starts
// again once the boss is beaten. Other players gather for it like any field boss (world/raids.js).

import { MOBS } from '../data/mobs.js';
import { spawnMob } from './mobs.js';

const WARN = [0.5, 0.85];

export const nestBoss = (world) => world.mobs.find((m) => m.nested && m.hp > 0) ?? null;

export function nestKill(world, m) {
  const nest = world.map.nest;
  if (!nest || world.dungeon) return;
  world.nestKills ??= {};
  // The boss itself falling starts the count again.
  if (m.nested) {
    world.nestKills[world.map.id] = 0;
    world.log(`${m.def.name} is beaten! ${nest.name} settles down again.`, '#ffe36b');
    return;
  }
  if (nestBoss(world)) return;
  const was = world.nestKills[world.map.id] ?? 0;
  const now = was + 1;
  world.nestKills[world.map.id] = now;
  for (const w of WARN) {
    if (was < nest.kills * w && now >= nest.kills * w) world.log(w < 0.8 ? `${nest.name} is buzzing...` : `${nest.name} is shaking! Something big is waking up.`, '#ffd65a');
  }
  if (now >= nest.kills) wakeNest(world);
}

export function wakeNest(world) {
  const nest = world.map.nest;
  const boss = spawnMob(world.map, { mob: nest.mob, x: nest.x, y: nest.y });
  boss.nested = true;
  boss.aggroUntil = world.now + 6;
  world.mobs.push(boss);
  world.nestKills[world.map.id] = 0;
  world.callout = { title: `${MOBS[nest.mob].name} wakes!`, sub: nest.wake, color: '#ffc83a', at: world.now };
  world.juice.push({ type: 'shake', mag: 5, dur: 0.6 });
  world.log(`${MOBS[nest.mob].name} bursts out of ${nest.name.toLowerCase()}!`, '#ffc83a');
  return boss;
}
