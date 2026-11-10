// Your Mochi Garden (docs/design/mochi.md, step 4): Moonmortar Garden, a valley of your own where
// your Mochi live, built like your island (world/home.js): its map is made fresh each time you
// arrive from the garden's own record, and it's yours alone (no bots, no passers-by; friends come
// visiting: net/visit.js). Shared by every character in the world file, as the island is.
//
//   char.garden = { back: { map, x } (where the Mochi Bell takes you back to), mochi: [records]
//                   (data/mochi-raise.js), eggs: [{ seed }], unlocked: { dawn, dusk } }
//
// Left to right, high on the left and dipping to a pond under a cliff:
//   Mortar Gate       the Mochi gate from Sprout Village, the egg stall, the sweet kitchen, the nursery
//   The Orchard       fruit trees down the slope, the running track, the big old tree with a swing
//   Lily Pond         the lowest point: the swimming pond, lily pads, a little fishing dock, the
//                     waterfall (and a nook behind it, the garden's secret)
//   Moonmortar Cliff  up the climbing rocks and the ropes: the glide launch over the pond, the
//                     Moonmortar (the landmark), the stadium gate (to the Race Stadium)

import { MAPS } from '../data/maps.js';
import { RACE_STAGES, RANK_ORDER } from '../data/mochi-race.js';
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
  const width = 3200;
  const terrain = [
    // The square by the gate, then down into the orchard (the big tree on its rise).
    [0, PLATEAU], [1320, PLATEAU], [1440, ORCHARD], [1540, ORCHARD], [1600, 684], [1700, 684], [1760, ORCHARD], [2100, ORCHARD],
    // (The pond: a bowl, its banks shelving gently down to the bed.)
    [2176, POND], [2190, 784], [2212, 808], [2246, 828], [2300, BED], [2460, BED], [2512, 830], [2546, 810], [2570, 786], [2586, POND],
    [2660, POND], [2660, LEDGE], [2762, LEDGE], [2762, TOP], [width, TOP],
  ];
  const platforms = [
    // The little fishing dock out over the pond, from the bank where it's level with the grass.
    { x: 2161, y: 748, w: 119, style: 'planks', dock: true, walkOn: true },
    // The glide launch: a board jutting out from the cliff top over the pond (the upper rope hangs
    // from it).
    // (Level with the cliff top and ending at its edge, so you walk straight on: drawn by mg_glide,
    // render/garden.js, its back end weighted on the lip.)
    { x: 2706, y: TOP, w: 56, style: 'planks', bare: true },
  ];
  const ropes = [
    { x: 2654, top: LEDGE, bottom: POND },
    { x: 2720, top: TOP, bottom: LEDGE },
  ];
  const spots = [{ x: 2280, y: 748, face: 1, bx: 2370, by: POND + 2, tier: 1, pool: HOME_POND_POOL }];
  const map = {
    id: 'garden', name: 'Mochi Garden', theme: 'town', isTown: true, private: true, garden: true, town: 'sprout',
    // (`groundY` is where the backdrop's land sits: the valley floor, not the gate's plateau high up
    // it, or the far hills and trees would hang in the sky.)
    width, height: 900, groundY: 730,
    // The sweet kitchen cooks Mochi sweets (ui/cooking.js); the garden's own data (the crop bed).
    stove: 760, gardenData: g,
    look: { sky: ['#ffd6e4', '#ffeadc', '#fff8f0'], far: '#d4ecc8', mid: '#e2f2d4', midTrim: '#bfe0ac', skyline: 'mochigarden', edges: 'flowers', islands: 'planks', material: 'meadow', propKeep: 1, portal: 'mochi', critters: [] },
    // (No birds or butterflies: the Garden's life is your Mochi.)
    cottages: [],
    terrain, platforms, ropes,
    // (Its own lilies and reeds: render/garden.js.)
    water: [{ x1: 2176, x2: 2586, y: POND, kind: 'pond', lilies: false, reeds: false }],
    nodes: [],
    zonesBy: 'x',
    zones: [
      { name: 'Mortar Square', from: 0, color: '#ff9ec0' },
      { name: 'The Orchard', from: 1320, color: '#9fd87a', look: { sky: ['#ffe2cc', '#fff0dc', '#fffaf0'] } },
      { name: 'Lily Pond', from: 2100, color: '#6fc8e0', look: { sky: ['#cfe8ff', '#e6f4ff', '#f6fbff'] } },
      { name: 'Moonmortar Cliff', from: 2620, color: '#b8a8f0', look: { sky: ['#d8d0ff', '#ebe6ff', '#f8f6ff'] } },
    ],
    // The garden's pieces (render/garden.js), left to right: the square (the keeper's shop, the egg
    // stall, the sweet kitchen, the nursery and the gate to the Race Stadium, side by side), the
    // orchard (fruit trees to shake, the big tree with its swing, the crop bed), the pond, the cliff.
    townPieces: [
      ['mg_lantern', 150, 0], ['mg_shop', 300], ['mg_eggstall', 520], ['mg_kitchen', 760], ['mg_nursery', 990], ['mg_stadium', 1190], ['mg_lantern', 1290, 1],
      ['mg_fruittree', 1480, 0], ['mg_toybox', 1528], ['mg_bigtree', 1650], ['mg_fruittree', 1830, 2], ['mg_cropbed', 1920], ['mg_fruittree', 2016, 3], ['mg_lantern', 2072, 3],
      ['mg_reeds', 2168, 0], ['mg_lilies', 2330, 0], ['mg_lilies', 2480, 1], ['mg_reeds', 2576, 1],
      ['mg_rockface', 2660, { top: LEDGE, bottom: POND, seed: 3, vines: 4, vineLen: 60 }], ['mg_rockface', 2762, { top: TOP, bottom: LEDGE, seed: 7, vines: 6, vineLen: 90 }], ['mg_falls', 2762],
      ['mg_boulders', 2688], ['mg_glide', 2794], ['mg_moonmortar', 2960], ['mg_lantern', 3110, 5],
    ],
    portals: [
      // The gate from Sprout Village (and where the Mochi Bell sets you down), and the nursery's door.
      { id: 'gate', x: 70, y: PLATEAU, to: 'sprout', toPortal: 'garden', label: 'Sprout Village' },
      { id: 'start', x: 200, y: PLATEAU, hidden: true },
      { id: 'nursery', x: 990, y: PLATEAU, to: 'garden_in', toPortal: 'door', label: 'Nursery', door: true },
      // The gate to the Race Stadium, at the end of the square (world/stadium.js).
      { id: 'stadium', x: 1190, y: PLATEAU, to: 'mochi_stadium', toPortal: 'gate', label: 'Race Stadium', door: true },
    ],
    lamps: [
      { x: 150, y: PLATEAU - 44, c: '#ffd6a0' }, { x: 1290, y: PLATEAU - 44, c: '#ffd6a0' }, { x: 2072, y: ORCHARD - 44, c: '#ffd6a0' }, { x: 3110, y: TOP - 44, c: '#ffd6a0' },
      { x: 990, y: PLATEAU - 34, c: '#ffd27a' }, { x: 760, y: PLATEAU - 40, c: '#ffd27a' }, { x: 300, y: PLATEAU - 40, c: '#ffd27a' },
    ],
    // The garden keeper, at her shop's counter (data/npcs.js kinako).
    npcs: [{ id: 'kinako', x: 268 }],
    // The race board is at Kinako's counter (her menu opens it: ui/npc.js).
    raceBoard: 268,
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
    look: { ceiling: true, floor: 'painted', sky: ['#ffe8e0', '#fff2ea', '#fff8f2'], material: 'parquet', propKeep: 1, critters: [] },
    cottages: [],
    terrain: [[0, 360], [760, 360]],
    platforms: [],
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
  // The nursery's trophy shelf: a cup for each course won, in its best rank's metal.
  MAPS.garden_in.trophies = trophiesOf(owner);
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

// Each race course and the best rank `char` has won it at (null if not yet), in the board's order.
export function trophiesOf(char) {
  const wins = char.raceWins ?? {};
  return Object.keys(RACE_STAGES).map((id) => ({ id, rank: [...RANK_ORDER].reverse().find((r) => wins[`${id}|${r}`]) ?? null }));
}

// The first time you walk in: the garden is yours, with two eggs waiting by the egg stall and a Mochi
// Bell to ring you back here from anywhere. Returns true if it was new.
export function grantGarden(char, seed = Date.now()) {
  if (char.garden) return false;
  char.garden = { back: null, mochi: [], eggs: [{ seed: Math.floor(seed % 1e9) }, { seed: Math.floor((seed * 7 + 13) % 1e9) }], unlocked: {} };
  return true;
}
