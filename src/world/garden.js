// Your Mochi Garden (docs/design/mochi.md, step 4): Moonmortar Garden, a valley of your own where
// your Mochi live, built like your island (world/home.js): its map is made fresh each time you
// arrive from the garden's own record, and it's yours alone (no bots, no passers-by; friends come
// visiting: net/visit.js). Shared by every character in the world file, as the island is.
//
//   char.garden = { back: { map, x } (where the Mochi Bell takes you back to), mochi: [records]
//                   (data/mochi-raise.js), eggs: [{ seed }], unlocked: { dawn, dusk } }
//
// Left to right, high on the left and dipping to a pond under a cliff:
//   Mortar Gate       the gate from the Mochi Market (world/market.js, where the shops are now),
//                     the nest of eggs, the nursery (its hearth is the sweet kitchen)
//   The Orchard       fruit trees down the slope, the running track, the big old tree with a swing
//   Lily Pond         the lowest point: the swimming pond, lily pads, a little fishing dock, the
//                     waterfall (and a nook behind it, the garden's secret)
//   Moonmortar Cliff  up the climbing rocks and the ropes: the glide launch over the pond, the
//                     Moonmortar (the landmark)

import { MAPS } from '../data/maps.js';
import { RACE_STAGES, RANK_ORDER } from '../data/mochi-race.js';
import { SPOTS } from '../data/fishing.js';
import { HOME_POND_POOL } from '../data/home.js';
// (The way in is through the Mochi Market.)
import './market.js';

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
    [0, PLATEAU], [1320, PLATEAU], [1440, ORCHARD], [1596, ORCHARD], [1620, 684], [1700, 684], [1724, ORCHARD], [2100, ORCHARD],
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
    // The garden's own data (the crop bed). (The sweet kitchen is the nursery's hearth now.)
    gardenData: g,
    look: { sky: ['#bfe4f2', '#e2f2ea', '#fdf6e2'], far: '#a8c8a0', mid: '#8fb88a', midTrim: '#7aa676', skyline: 'course:moonmortar', painted: null, groundArt: 'moonmortar', edges: 'flowers', islands: 'planks', material: 'mochifield', propKeep: 1, portal: 'mochi', critters: [] },
    // (No birds or butterflies: the Garden's life is your Mochi.)
    cottages: [],
    terrain, platforms, ropes,
    // (Its own lilies and reeds: render/garden.js.)
    water: [{ x1: 2176, x2: 2586, y: POND, kind: 'pond', lilies: false, reeds: false }],
    nodes: [],
    zonesBy: 'x',
    zones: [
      { name: 'Mortar Square', from: 0, color: '#ff9ec0' },
      { name: 'The Orchard', from: 1320, color: '#9fd87a', look: { sky: ['#b6e0ee', '#ddefe4', '#fbf2dc'] } },
      { name: 'Lily Pond', from: 2100, color: '#6fc8e0', look: { sky: ['#a6d6ee', '#d2ebeb', '#f4f4e8'] } },
      { name: 'Moonmortar Cliff', from: 2620, color: '#b8a8f0', look: { sky: ['#8ec6e8', '#bee0e8', '#eef6ec'] } },
    ],
    // The garden's pieces (render/garden.js), left to right: the square (the vegetable patch, the
    // flower beds, the well, the nursery), the orchard (fruit trees to shake, the big tree with its
    // swing), the pond, the cliff. (The
    // shops, the egg and clothes stalls and the stadium gate moved out to the Mochi Market,
    // 2026-11-15, so the garden is the Mochi's.)
    townPieces: [
      // The garden square: a low picket fence with climbing roses along the back of it (first, so
      // all the rest stands in front), the mailbox by the nest, the vegetable patch (the crop bed
      // and the bean frame), a flower bed and the well, the nursery, another flower bed, and the
      // lantern at the top of the slope.
      ['mg_fence', 248, { to: 872 }], ['mg_fence', 1092, { to: 1284 }], ['mg_mailbox', 226],
      // Paper lanterns strung over the square on two poles, lit at dusk; the Mochi gather under
      // them before bed.
      ['mg_lanternline', 318, { to: 862, h: 82, skip: [[484, 574], [756, 826]] }],
      ['mg_cropbed', 440], ['mg_beanframe', 528], ['mg_flowerbed', 680, 0], ['mg_well', 790],
      ['mg_nursery', 990], ['mg_flowerbed', 1170, 1], ['mg_lantern', 1290, 1],
      // The play meadow (the orchard): a fruit tree at the foot of the slope, the toy box, the big tree
      // with its swing, the slide and the bouncy mushroom, and the far fruit tree by the pond. The
      // Mochi play on all of them (world/garden-life.js rides). (The wash line and the crates went,
      // 2026-11-15: the meadow is for running about in.)
      // (The see-saw on the flat at the foot of the slope, 2026-11-15: world/garden-life.js SEESAW.)
      ['mg_seesaw', 1468], ['mg_fruittree', 1537, 0], ['mg_toybox', 1582], ['mg_bigtree', 1660],
      ['mg_slide', 1830], ['mg_mushroom', 1965], ['mg_fruittree', 2074, 2],
      ['mg_reeds', 2168, 0], ['mg_lilies', 2330, 0], ['mg_lilies', 2480, 1], ['mg_reeds', 2576, 1],
      ['mg_earthwall', 2711, { left: 2662, right: 2760, top: 562, bottom: 900, seed: 4 }], ['mg_earthwall', 2982, { left: 2764, right: 3200, top: 382, bottom: 900, seed: 9, burrow: [70, 250] }], ['mg_rockface', 2660, { top: LEDGE, bottom: POND, seed: 3, vines: 4, vineLen: 60 }], ['mg_rockface', 2762, { top: TOP, bottom: LEDGE, seed: 7, vines: 6, vineLen: 90 }], ['mg_falls', 2762],
      ['mg_boulders', 2688], ['mg_glide', 2794], ['mg_moonmortar', 2960], ['mg_lantern', 3110, 5],
    ],
    portals: [
      // The gate from the Mochi Market (and where the Mochi Bell sets you down), and the nursery's door.
      { id: 'gate', x: 70, y: PLATEAU, to: 'mochi_market', toPortal: 'garden', label: 'Mochi Market' },
      { id: 'start', x: 200, y: PLATEAU, hidden: true },
      { id: 'nursery', x: 990, y: PLATEAU, to: 'garden_in', toPortal: 'door', label: 'Nursery', door: true },
    ],
    lamps: [
      { x: 1290, y: PLATEAU - 44, c: '#ffd6a0' }, { x: 1608, y: 552, c: '#ffd6a0' }, { x: 3110, y: TOP - 44, c: '#ffd6a0' },
      { x: 990, y: PLATEAU - 34, c: '#ffd27a' },
      // (The strung lanterns over the square.)
      { x: 420, y: PLATEAU - 70, c: '#ffc87a' }, { x: 590, y: PLATEAU - 66, c: '#ffb8d0' }, { x: 760, y: PLATEAU - 70, c: '#ffc87a' },
    ],
    // (Kinako keeps shop in the Mochi Market now; she is only here in a friend's garden, by the
    // nest, to take the presents you leave them: refreshGarden.)
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
    // The sweet kitchen is the hearth: you cook at the kettle on its hearthstone (ui/cooking.js), and
    // the room draws its own fire and steam (`ownStove`: no town stove set down in front of it).
    stove: 250, ownStove: true,
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
  MAPS.garden_in.showCup = showCupOf(owner);
  if (guest) {
    map.guestOf = guest;
    // Kinako by the nest, minding your friend's garden: leave them an egg or some sweets.
    map.npcs = [{ id: 'kinako', x: 262 }];
    MAPS.garden_in.guestOf = guest;
    map.name = `${guest.name}'s Mochi Garden`;
    MAPS.garden_in.name = `${guest.name}'s Nursery`;
  }
  SPOTS.garden = spots;
  return map;
}
refreshGarden({});

export const hasGarden = (char) => Boolean(char.garden);

// The best rank of the Mochi Show `char` has won (world/mochi-show.js), or null: its cup stands at the
// end of the trophy shelf.
export function showCupOf(char) {
  return ['master', 'challenge', 'beginner'].find((r) => char.showWins?.[r]) ?? null;
}
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
