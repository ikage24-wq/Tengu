// The craft bench in each town (the map's `bench`, data/maps.js): press Up at it to open the
// crafting window (ui/crafting.js). Pressing Craft there starts a short crafting moment:
//   world.crafting = { recipe, t, secs }: the hero works at the bench (the 'craft' move) and when
//   t reaches secs the piece is made (core/crafting.js craft). Walking, jumping or pressing Up
//   cancels it, and nothing is used up. `forWho` (a party member, world/coop-life.js): the piece
//   goes to them when it's made.

import { craft, craftBlocker, BLOCKER_TEXT } from '../core/crafting.js';
import { QUALITIES } from '../data/crafting.js';
import { itemName } from '../core/items.js';
import { groundAt } from './physics.js';
import { deliverCraft } from './coop-life.js';

export const BENCH_REACH = 30;
// How long a craft takes: a tonic or stone is quick, gear takes a proper moment.
export const CRAFT_SECS = { potion: 1.2, stone: 1.2, tool: 1.6, accessory: 1.6, gear: 2 };

export function benchHere(world, reach = BENCH_REACH) {
  const x = world.map.bench;
  const b = world.body;
  return x != null && b.onGround && Math.abs(x - b.x) < reach && Math.abs(groundAt(world.map, x) - b.y) < 8;
}

// Starts making `r` (`move` is the hero's move for it). Returns why not, or null.
export function startCrafting(world, r, move = 'craft') {
  if (world.crafting) return 'busy';
  if (!benchHere(world, BENCH_REACH + 30)) return 'bench';
  const why = craftBlocker(world.char, r);
  if (why) return why;
  const secs = CRAFT_SECS[r.cat] ?? 1.6;
  world.body.facing = world.map.bench >= world.body.x ? 1 : -1;
  world.body.vx = 0;
  world.crafting = { recipe: r, t: 0, secs, move };
  world.pose = { kind: move, t: secs, dur: secs, since: world.now };
  return null;
}

// One tick. Returns true while crafting (the world ignores the other controls meanwhile).
// When a piece is made it is left in world.lastCrafted ({ result, recipe, at }) for the window.
export function tickCrafting(world, dt, held, pressed, rng = Math.random) {
  const c = world.crafting;
  if (!c) return false;
  const quit = ['ArrowLeft', 'ArrowRight', 'Space', 'AltLeft', 'AltRight'].some((k) => held.has(k)) || pressed.has('ArrowUp') || world.dead || !benchHere(world, BENCH_REACH + 30);
  if (quit) {
    world.crafting = null;
    world.pose = null;
    world.map.benchWork = null;
    return false;
  }
  c.t += dt;
  // (The bench's sparks fly with the work: render/craftbench.js.)
  world.map.benchWork = Math.min(1, c.t / c.secs);
  if (c.t < c.secs) return true;
  world.crafting = null;
  world.map.benchWork = null;
  const result = craft(world, c.recipe, rng);
  // Made for a party member (world/coop-life.js): it goes straight to them.
  const gave = result.ok && c.forWho ? deliverCraft(world, c.forWho, result, c.recipe) : false;
  world.lastCrafted = { result, recipe: c.recipe, at: world.now, forWho: gave ? c.forWho : null };
  if (!result.ok) world.log?.(BLOCKER_TEXT[result.why] ?? "Couldn't make it.", '#ffb3c6');
  else if (gave) world.log?.(`${c.recipe.quality && result.inst ? `${QUALITIES[result.quality].name} craft! ` : ''}Made with care for ${c.forWho.name}.`, '#d8f5d0');
  else if (result.inst) {
    const q = QUALITIES[result.quality];
    world.log?.(`You crafted ${c.recipe.quality ? `a ${q.name} ` : ''}${itemName(result.inst)}!`, result.quality === 2 ? '#ffd27a' : result.quality === 1 ? '#bfe0ff' : '#d8f5d0');
  } else world.log?.(`You crafted ${itemName(c.recipe.makes)}${result.qty > 1 ? ` x${result.qty}` : ''}.`, '#d8f5d0');
  world.events?.push({ type: 'crafted', recipe: c.recipe.id, ok: result.ok, quality: result.quality });
  return false;
}
