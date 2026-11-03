// Gathering and mining (data/gathering.js). world.gathering while you work a spot:
//   { node, kind, skill, t, secs }: when t reaches secs you get its finds and it rests.
// Each spot trains a life skill (core/life.js: ore Mining, the rest Gathering) and needs its level
// (the spot's `lv`, or its `tier`'s); the skill's level and tool make the work quicker, the finds
// more and rarer, and the rest shorter, and every pick gives life EXP and character EXP.
// Walking, jumping or pressing Up again stops. The world ignores the other controls meanwhile.
// When each spot is ready again is kept per map in world.nodeRest ({ 'map:index': time }).

import { NODES, KINDS, NODE_REACH } from '../data/gathering.js';
import { addItem } from '../core/inventory.js';
import { ITEMS } from '../data/items.js';
import { isNight } from './daytime.js';
import { isCalm } from './calm.js';
import { lifeLevel, lifePerks, lifeAction, needFor, skillOfKind, withExtra, LIFE_NAMES } from '../core/life.js';
import { spotKey, startedWork, keepWorking, togetherBonus } from './coop-life.js';

const key = (mapId, i) => `${mapId}:${i}`;

// A map's spots: listed in data/gathering.js, or laid out with the map (data/climb.js).
export function nodesOf(world) {
  return NODES[world.map.id] ?? world.map.nodes ?? [];
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
  if (!kind) return 'There is nothing to gather here.';
  // A spot from a richer region needs the skill's level first.
  const skill = skillOfKind(here.node.kind, kind);
  const need = needFor(here.node);
  const have = lifeLevel(world.char, skill);
  if (have < need) return `This spot needs ${LIFE_NAMES[skill]} Lv ${need} (yours is Lv ${have}). Keep at the spots you can work and you'll get there!`;
  // (Chopping wood uses the woodaxe; other gathering the sickle.)
  const perks = lifePerks(world.char, skill, here.node.kind === 'wood' ? 'chopping' : skill);
  const secs = kind.secs * perks.time;
  world.body.facing = here.node.x >= world.body.x ? 1 : -1;
  world.body.vx = 0;
  world.gathering = { ...here, kind, skill, perks, secs, t: 0 };
  world.pose = { kind: kind.move, t: secs, dur: secs, since: world.now };
  // Party members may come and work it with you (world/coop-life.js).
  startedWork(world, { key: spotKey(world, 'node', here.i), kind: 'node', node: here.node, x: here.node.x, y: here.node.y, pose: kind.move, secs });
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
  keepWorking(world);
  const secs = g.secs ?? g.kind.secs;
  if (g.t < secs) return true;
  world.gathering = null;
  const skill = g.skill ?? skillOfKind(g.node.kind, g.kind);
  const perks = g.perks ?? lifePerks(world.char, skill, g.node?.kind === 'wood' ? 'chopping' : skill);
  const [lo, hi] = g.kind.count;
  const got = {};
  // A calm map (world/calm.js) gives one more, and the skill's level may give another.
  // Working it together with the party gives more and rarer finds (world/coop-life.js).
  const team = togetherBonus(world, spotKey(world, 'node', g.i), g.node.x, g.node.y);
  const n = withExtra(lo + Math.floor(rng() * (hi - lo + 1)) + (isCalm(world, world.map.id) ? 1 : 0) + (team?.extra ?? 0), perks, rng);
  for (let k = 0; k < n; k++) {
    const id = roll(g.node.pool, rng);
    got[id] = (got[id] ?? 0) + 1;
  }
  if (g.node.rare && rng() < g.node.rare[1] * perks.rare * (team?.rare ?? 1)) got[g.node.rare[0]] = (got[g.node.rare[0]] ?? 0) + 1;
  for (const [id, qty] of Object.entries(got)) {
    addItem(world.char.inventory, id, qty);
    world.log(`Got ${ITEMS[id].name}${qty > 1 ? ` x${qty}` : ''}.`, g.node.rare && id === g.node.rare[0] ? '#ffb3d1' : '#bff0dc');
  }
  // (For the finds popping out of the spot, render/gathering.js.)
  world.lastGathered = { x: g.node.x, y: g.node.y, items: Object.keys(got), at: world.now };
  world.nodeRest ??= {};
  world.nodeRest[key(world.map.id, g.i)] = world.now + g.kind.rest * perks.rest;
  lifeAction(world, skill, { tier: g.node.tier ?? 1, kind: skill === 'mining' ? 'mine' : 'gather', scale: team?.life ?? 1 });
  return false;
}
