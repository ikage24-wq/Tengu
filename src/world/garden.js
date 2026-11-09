// Your Mochi Garden (docs/design/mochi.md, step 4): Moonmortar Garden, a valley of your own where
// your Mochi live, built like your island (world/home.js): its map is made fresh each time you
// arrive from the garden's own record, and it's yours alone (no bots, no passers-by; friends come
// visiting: net/visit.js). Shared by every character in the world file, as the island is.
//
//   char.garden = { back: { map, x } (where the Mochi Bell takes you back to), mochi: [records]
//                   (data/mochi-raise.js), eggs: [{ seed }], unlocked: { dawn, dusk } }
//
// Left to right, high on the left and dipping to a pond under a cliff:
//   Mortar Gate       the gate from Sprout Village, the egg stall, the sweet kitchen, the nursery
//   The Orchard       fruit trees down the slope, the running track, the big old tree with a swing
//   Lily Pond         the lowest point: the swimming pond, lily pads, a little fishing dock, the
//                     waterfall (and a nook behind it, the garden's secret)
//   Moonmortar Cliff  up the climbing rocks and the ropes: the glide launch over the pond, the
//                     Moonmortar (the landmark), the stadium gate (to the Race Stadium)

import { MAPS } from '../data/maps.js';
import { SPOTS } from '../data/fishing.js';
import { HOME_POND_POOL } from '../data/home.js';

const PLATEAU = 620;
const ORCHARD = 700;
const POND = 760;
const BED = 840;
const LEDGE = 560;
const TOP = 380;

// The garden's map, for the garden `g` (its unlocked areas).
export function gardenMap(g = {}) {
  const width = 3600;
  const terrain = [
    [0, PLATEAU], [880, PLATEAU], [1040, ORCHARD], [1500, ORCHARD], [1560, 684], [1650, 684], [1710, ORCHARD], [2160, ORCHARD],
    [2236, POND], [2256, BED], [2806, BED], [2826, POND], [2900, POND], [2900, LEDGE], [3002, LEDGE], [3002, TOP], [width, TOP],
  ];
  const platforms = [
    // The little fishing dock out over the pond.
    { x: 2244, y: 748, w: 112, style: 'planks', dock: true },
    // The glide launch: a board jutting out from the cliff top over the pond (the upper rope hangs
    // from it).
    { x: 2946, y: TOP - 8, w: 70, style: 'planks', bare: true }, // (drawn by mg_glide: render/garden.js)
    // The secret: a nook in behind the waterfall, a hop from the upper rope.
    { x: 2980, y: 470, w: 22, bare: true },
  ];
  const ropes = [
    { x: 2894, top: LEDGE, bottom: POND },
    { x: 2960, top: TOP - 8, bottom: LEDGE },
  ];
  const spots = [{ x: 2340, y: 748, face: 1, bx: 2430, by: POND + 2, tier: 1, pool: HOME_POND_POOL }];
  const map = {
    id: 'garden', name: 'Mochi Garden', theme: 'town', isTown: true, private: true, garden: true, town: 'sprout',
    width, height: 900, groundY: PLATEAU,
    // The sweet kitchen cooks Mochi sweets (ui/cooking.js); the garden's own data (the crop bed).
    stove: 548, gardenData: g,
    look: { sky: ['#ffd6e4', '#ffeadc', '#fff8f0'], far: '#d4ecc8', mid: '#e2f2d4', midTrim: '#bfe0ac', skyline: 'bigtrees', edges: 'flowers', islands: 'planks', material: 'meadow', propKeep: 1 },
    cottages: [],
    terrain, platforms, ropes,
    water: [{ x1: 2236, x2: 2826, y: POND }],
    nodes: [],
    zonesBy: 'x',
    zones: [
      { name: 'Mortar Gate', from: 0, color: '#ff9ec0' },
      { name: 'The Orchard', from: 960, color: '#9fd87a', look: { sky: ['#ffe2cc', '#fff0dc', '#fffaf0'] } },
      { name: 'Lily Pond', from: 2180, color: '#6fc8e0', look: { sky: ['#cfe8ff', '#e6f4ff', '#f6fbff'] } },
      { name: 'Moonmortar Cliff', from: 2850, color: '#b8a8f0', look: { sky: ['#d8d0ff', '#ebe6ff', '#f8f6ff'] } },
    ],
    // The garden's pieces (render/garden.js), left to right.
    townPieces: [
      ['mg_gate', 70], ['mg_lantern', 196, 0], ['mg_eggstall', 330], ['mg_kitchen', 548], ['mg_nursery', 760], ['mg_lantern', 872, 1],
      ['mg_track', 1090, { to: 1450 }], ['mg_fruittree', 1150, 0], ['mg_fruittree', 1380, 1], ['mg_lantern', 1478, 2], ['mg_bigtree', 1605],
      ['mg_fruittree', 1850, 2], ['mg_cropbed', 1962], ['mg_fruittree', 2070, 3], ['mg_lantern', 2150, 3],
      ['mg_reeds', 2228, 0], ['mg_lilies', 2470, 0], ['mg_lilies', 2690, 1], ['mg_reeds', 2816, 1], ['mg_falls', 3002],
      ['mg_cliffface', 2904, { top: LEDGE, bottom: POND, seed: 3, vines: 3 }], ['mg_cliffface', 3020, { top: TOP, bottom: LEDGE, seed: 7, vines: 2 }],
      ['mg_boulders', 2928], ['mg_glide', 3034], ['mg_lantern', 3110, 4], ['mg_moonmortar', 3250], ['mg_lantern', 3390, 5], ['mg_stadium', 3500],
    ],
    portals: [
      // The gate from Sprout Village (and where the Mochi Bell sets you down), and the nursery's door.
      { id: 'gate', x: 70, y: PLATEAU, to: 'sprout', toPortal: 'garden', label: 'Sprout Village' },
      { id: 'start', x: 200, y: PLATEAU, hidden: true },
      { id: 'nursery', x: 760, y: PLATEAU, to: 'garden_in', toPortal: 'door', label: 'Nursery', door: true },
      // The stadium gate at the top: the Mochi Race Stadium (world/stadium.js).
      { id: 'stadium', x: 3500, y: TOP, to: 'mochi_stadium', toPortal: 'gate', label: 'Race Stadium', door: true },
    ],
    lamps: [
      { x: 196, y: PLATEAU - 44, c: '#ffd6a0' }, { x: 872, y: PLATEAU - 44, c: '#ffd6a0' }, { x: 1478, y: ORCHARD - 44, c: '#ffd6a0' }, { x: 2150, y: ORCHARD - 44, c: '#ffd6a0' },
      { x: 3110, y: TOP - 44, c: '#ffd6a0' }, { x: 3390, y: TOP - 44, c: '#ffd6a0' }, { x: 760, y: PLATEAU - 34, c: '#ffd27a' }, { x: 548, y: PLATEAU - 40, c: '#ffd27a' },
    ],
    npcs: [],
    spawns: [],
    deco: [],
  };
  return { map, spots };
}

// The nursery inside: one cosy room under the dome (render/garden.js): the hearth where the eggs
// rest in their mortars, little basket beds for the Mochi, a round window, a rug, a toy shelf.
export function gardenInside() {
  return {
    id: 'garden_in', name: 'The Nursery', theme: 'town', isTown: true, private: true, garden: true, indoor: true, town: 'sprout',
    width: 760, height: 400, groundY: 360,
    look: { ceiling: true, floor: 'painted', sky: ['#ffe8e0', '#fff2ea', '#fff8f2'], material: 'parquet', propKeep: 1 },
    cottages: [],
    terrain: [[0, 360], [760, 360]],
    platforms: [{ x: 520, y: 262, w: 150, bare: true, shelf: true }],
    ropes: [],
    townPieces: [['mg_nurseryroom', 380]],
    portals: [{ id: 'door', x: 80, y: 360, to: 'garden', toPortal: 'nursery', label: 'Outside', door: true }, { id: 'start', x: 80, y: 360, hidden: true }],
    npcs: [], spawns: [], deco: [], lamps: [{ x: 300, y: 140, c: '#ffd27a' }, { x: 560, y: 160, c: '#ffd27a' }],
  };
}

// Puts the garden (and the nursery) into the map list, with its fishing spot. A visitor's `guest`
// is the friend whose garden it is (net/visit.js).
export function refreshGarden(char, guest = null) {
  const owner = guest ?? char;
  const { map, spots } = gardenMap(owner.garden ?? {});
  MAPS.garden = map;
  MAPS.garden_in = gardenInside();
  if (guest) {
    map.guestOf = guest;
    MAPS.garden_in.guestOf = guest;
    map.name = `${guest.name}'s Mochi Garden`;
    MAPS.garden_in.name = `${guest.name}'s Nursery`;
  }
  SPOTS.garden = spots;
  return map;
}
refreshGarden({});

export const hasGarden = (char) => Boolean(char.garden);

// The first time you walk in: the garden is yours, with two eggs waiting by the gate and a Mochi
// Bell to ring you back here from anywhere. Returns true if it was new.
export function grantGarden(char, seed = Date.now()) {
  if (char.garden) return false;
  char.garden = { back: null, mochi: [], eggs: [{ seed: Math.floor(seed % 1e9) }, { seed: Math.floor((seed * 7 + 13) % 1e9) }], unlocked: {} };
  return true;
}
