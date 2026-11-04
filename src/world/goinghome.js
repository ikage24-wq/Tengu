// The Sweethearts go home at night (docs/design/sweethearts.md, the player's pick, 2026-11-04):
// from dusk each one is in their own room (MAPS.swh_<id>), at their own corner of it, and from dawn
// back at their spot in town. If you're there when the hour turns, they walk to their door and go
// in (or come out of it and stroll to their spot), fading through the doorway, never popping. If
// you arrive later, they're simply where they'd be. Whoever lives with you is on your island
// either way, and whoever is out on a date with you stays at your side.
//
// The town and room lists of `map.npcs` are what change: everything that finds an NPC on a map
// (talking, the minimap, cutscenes, chat) follows without knowing about it.

import { MAPS } from '../data/maps.js';
import { SWEETHEARTS } from '../data/sweethearts.js';

// Where each one spends the evening in their room: by their own thing.
export const ROOM_SPOT = { poppy: 470, lark: 300, rowan: 225, yuzu: 330, celeste: 160, marlowe: 410 };
// From when it's this dark until it's lighter again, they're home.
const LATE = 0.6;
const WALK = 62;

const roomOf = (id) => MAPS[`swh_${id}`];
export const isLate = (world) => (world.night ?? 0) >= LATE;
// Which map they should be on now (null: with you, on your island or on a date).
function whereNow(world, h) {
  if (world.char.livingWith === h.id) return null;
  return isLate(world) ? roomOf(h.id) : MAPS[h.map];
}
const entryOn = (map, id) => map.npcs.find((n) => n.id === id);

// Their one entry in the map lists, made once and moved between the town and the room.
const ENTRY = {};
function entryFor(h) {
  return (ENTRY[h.id] ??= entryOn(MAPS[h.map], h.id) ?? entryOn(roomOf(h.id), h.id) ?? { id: h.id, x: h.x });
}
function moveTo(h, map) {
  const n = entryFor(h);
  for (const m of [MAPS[h.map], roomOf(h.id)]) m.npcs = m.npcs.filter((q) => q.id !== h.id);
  n.x = map === MAPS[h.map] ? h.x : ROOM_SPOT[h.id];
  delete n.cine;
  delete n.going;
  map.npcs.push(n);
  return n;
}

// The doorway on a map: the house's door in town, the room's door inside.
const doorOn = (map, h) => map.portals.find((p) => p.id === (map === MAPS[h.map] ? `swh_${h.id}` : 'door'))?.x ?? h.house;

// Puts everyone where they belong at once (arriving on a map, or the first look at the clock).
export function settleSweethearts(world) {
  for (const h of Object.values(SWEETHEARTS)) {
    if (world.date?.id === h.id) continue;
    const want = whereNow(world, h);
    if (!want) continue;
    const n = entryFor(h);
    if (!entryOn(want, h.id) || n.going) moveTo(h, want);
  }
  world.swLate = isLate(world);
}

// Each tick: when the hour turns, whoever is on your map with you walks out through their door,
// and whoever is coming onto it walks in through it; the rest just move.
export function tickGoingHome(world, dt) {
  const late = isLate(world);
  if (world.swLate === undefined) settleSweethearts(world);
  else if (late !== world.swLate) {
    world.swLate = late;
    for (const h of Object.values(SWEETHEARTS)) {
      if (world.date?.id === h.id) continue;
      const want = whereNow(world, h);
      if (!want) continue;
      const n = entryFor(h);
      const here = entryOn(world.map, h.id) === n;
      if (here && want !== world.map && !world.scene) {
        // Off home (or out): to the door, and through it.
        n.going = { out: true, to: doorOn(world.map, h), then: want };
      } else if (want === world.map && !here && !world.scene) {
        // Coming in through the door, then over to their spot.
        const at = moveTo(h, want);
        const spot = at.x;
        at.x = doorOn(want, h);
        at.going = { out: false, to: spot };
      } else if (!here) moveTo(h, want);
    }
  }
  for (const n of world.map.npcs) {
    const g = n.going;
    if (!g) continue;
    const h = SWEETHEARTS[n.id];
    const d = g.to - n.x;
    const step = Math.sign(d) * Math.min(Math.abs(d), WALK * dt);
    n.x += step;
    n.cine ??= {};
    n.cine.walk = Math.abs(d) > 1;
    if (Math.abs(d) > 1) n.cine.facing = Math.sign(d);
    // Fading through the doorway: out over the last steps to it, in over the first steps from it.
    const near = Math.min(1, Math.abs(d) / 30);
    const fromDoor = g.from ??= n.x - step;
    n.cine.alpha = g.out ? near : Math.min(1, Math.abs(n.x - fromDoor) / 30 + 0.05);
    if (Math.abs(d) <= 1) {
      if (g.out) moveTo(h, g.then);
      else {
        delete n.cine;
        delete n.going;
      }
    }
  }
}

// Whether they're at home in their room right now (for what they say when you knock late).
export const atHome = (world, id) => world.map.id === `swh_${id}`;
