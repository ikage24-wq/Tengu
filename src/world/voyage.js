// The voyage to Lantern Lagoon and back on Captain Bobbin's paddle steamer, the Sea Biscuit
// (data/maps.js voyage_out and voyage_home). Captain Bobbin (ui/npc.js, his 'ferry' role) sets
// sail from Pastel Harbor's quay or Shell Cove: the steamer's deck is the map, the sea runs past
// (render/lagoon.js), and after the map's `voyage.dur` seconds she comes in to port. You can
// fish off the stern on the way. Once you've made the trip, Bobbin can take you straight there.

import { loadMap } from './world.js';

// Where Bobbin sails from each port.
export const ROUTES = {
  harbor: { voyage: 'voyage_out', to: 'lagoon', toPortal: 'pier', name: 'Lantern Lagoon' },
  lagoon: { voyage: 'voyage_home', to: 'harbor', toPortal: 'ferry', name: 'Pastel Harbor' },
};

// The route from where you are, or null.
export const routeFrom = (world) => ROUTES[world.map.id] ?? null;
export const hasSailed = (char) => (char.voyages ?? 0) > 0;

// Sets sail: the long way (on deck, with the sea going by), or straight there.
export function setSail(world, { quick = false } = {}) {
  const route = routeFrom(world);
  if (!route) return false;
  if (quick && hasSailed(world.char)) {
    arrive(world, route.to, route.toPortal);
    return true;
  }
  loadMap(world, route.voyage, 'deck');
  world.voyage = { t: 0 };
  world.log(`All aboard the Sea Biscuit! Next stop: ${route.name}.`, '#9fe8ff');
  return true;
}

function arrive(world, to, toPortal) {
  world.voyage = null;
  world.char.voyages = (world.char.voyages ?? 0) + 1;
  loadMap(world, to, toPortal);
  world.log(`The Sea Biscuit docks at ${world.map.name}.`, '#9fe8ff');
}

// How far along the voyage is (0-1), for the drawing; null when not sailing.
export function voyageProgress(world) {
  const v = world.map.voyage;
  if (!v) return null;
  return Math.min(1, (world.voyage?.t ?? 0) / v.dur);
}

// Each frame. While on the steamer, the clock runs and Bobbin calls out the sights; at the end
// she docks (once you've reeled in, if you're mid-cast).
export function tickVoyage(world, dt) {
  const v = world.map.voyage;
  if (!v) return;
  world.voyage ??= { t: 0 };
  const s = world.voyage;
  const before = s.t;
  s.t += dt;
  // (For the drawing: how far along she is.)
  world.map.voyageAt = Math.min(1, s.t / v.dur);
  for (const [at, line] of CALLS) {
    if (before >= at * v.dur || s.t < at * v.dur) continue;
    (world.bubbles ??= {}).bobbin = { text: line, t: 5 };
    world.log(`Captain Bobbin: ${line}`, '#ffe9a6');
  }
  if (s.t >= v.dur && !(world.fishing && world.fishing.phase !== 'wait' && world.fishing.phase !== 'cast')) arrive(world, v.to, v.toPortal);
}

// What Bobbin calls out on the way (at that share of the trip).
const CALLS = [
  [0.08, "Cast off! Feel free to fish off the stern, the open sea's full of biters."],
  [0.35, 'Dolphins off the bow! They race us every trip. They always win.'],
  [0.62, 'Whale to starboard! Wave, she likes that.'],
  [0.9, 'Land ho! Mind the gangplank, it wobbles.'],
];
