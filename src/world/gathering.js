// Gathering and mining (data/gathering.js). world.gathering while you work a spot:
//   { node, kind, t, secs }: when t reaches secs you get its finds and it rests.
// Walking, jumping or pressing Up again stops. The world ignores the other controls meanwhile.
// When each spot is ready again is kept per map in world.nodeRest ({ 'map:index': time }).

import { NODES, KINDS, NODE_REACH } from '../data/gathering.js';
import { addItem } from '../core/inventory.js';
import { ITEMS } from '../data/items.js';
import { isNight } from './daytime.js';
import { isCalm } from './calm.js';

const key = (mapId, i) => `${mapId}:${i}`;

export function nodesOf(world) {
  return NODES[world.map.id] ?? [];
}

// A night spot (`night: true`) is only there at night.
export function nodeOpen(world, n) {
  return !n.night || isNight(world);
}

export function nodeReady(world, i) {
  return (world.nodeRest?.[key(world.map.id, i)] ?? -Infinity) <= world.now;
}

// The spot you're standing at (ready or resting), as { node, i }, or null.
export function nodeHere(world) {
  const b = world.body;
  if (!b.onGround) return null;
  const list = nodesOf(world);
  const i = list.findIndex((n) => nodeOpen(world, n) && Math.abs(n.x - b.x) < NODE_REACH && Math.abs(n.y - b.y) < 6);
  return i < 0 ? null : { node: list[i], i };
}

// Starts gathering at the spot you're on. Returns why not, or null.
export function startGathering(world) {
  const here = nodeHere(world);
  if (!here) return 'There is nothing to gather here.';
  if (!nodeReady(world, here.i)) return 'Already picked clean. It will grow back soon.';
  const kind = KINDS[here.node.kind];
  world.body.facing = here.node.x >= world.body.x ? 1 : -1;
  world.body.vx = 0;
  world.gathering = { ...here, kind, t: 0 };
  world.pose = { kind: kind.move, t: kind.secs, dur: kind.secs, since: world.now };
  return null;
}

function roll(pool, rng) {
  const entries = Object.entries(pool);
  let r = rng() * entries.reduce((n, [, w]) => n + w, 0);
  for (const [id, w] of entries) if ((r -= w) < 0) return id;
  return entries[0][0];
}

// One tick. Returns true while gathering.
export function tickGathering(world, dt, held, pressed, rng = Math.random) {
  const g = world.gathering;
  if (!g) return false;
  const quit = ['ArrowLeft', 'ArrowRight', 'Space', 'AltLeft', 'AltRight'].some((k) => held.has(k)) || pressed.has('ArrowUp') || world.dead;
  if (quit) {
    world.gathering = null;
    world.pose = null;
    return false;
  }
  g.t += dt;
  if (g.t < g.kind.secs) return true;
  world.gathering = null;
  const [lo, hi] = g.kind.count;
  const got = {};
  // A calm map (world/calm.js) gives one more.
  const n = lo + Math.floor(rng() * (hi - lo + 1)) + (isCalm(world, world.map.id) ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const id = roll(g.node.pool, rng);
    got[id] = (got[id] ?? 0) + 1;
  }
  if (g.node.rare && rng() < g.node.rare[1]) got[g.node.rare[0]] = (got[g.node.rare[0]] ?? 0) + 1;
  for (const [id, qty] of Object.entries(got)) {
    addItem(world.char.inventory, id, qty);
    world.log(`Got ${ITEMS[id].name}${qty > 1 ? ` x${qty}` : ''}.`, g.node.rare && id === g.node.rare[0] ? '#ffb3d1' : '#bff0dc');
  }
  // (For the finds popping out of the spot, render/gathering.js.)
  world.lastGathered = { x: g.node.x, y: g.node.y, items: Object.keys(got), at: world.now };
  world.nodeRest ??= {};
  world.nodeRest[key(world.map.id, g.i)] = world.now + g.kind.rest;
  return false;
}
