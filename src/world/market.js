// The Mochi Market (2026-11-15): the shops that stood in a row along the top of your Mochi Garden,
// moved out to a lane of their own between Sprout Village and the garden, so the garden is left to
// the Mochi to run, swim and play in (the player: "the mochi's can chill in their own garden ...
// without the crowding").
//
// Two levels, like the rest of the world's towns:
//   Market Lane      in from Sprout Village: Kinako's shop (the keeper, the race board, the secret
//                    stall after dark), the egg stall, the clothes stall
//   Stadium Terrace  up the bank at the end of the lane: the gate to the Race Stadium, and at the
//                    far end the gate into your garden
// It sits in the same valley as the garden (the same sky and backdrop), and borrows the garden's
// pieces (render/garden.js draws them for `mochiTown` too). Private, like the garden and the
// stadium: no bots, no passers-by.

import { MAPS } from '../data/maps.js';

const LANE = 600;
const TERRACE = 470;

// Where each thing stands along the market (the world and the tests use these).
// (The show tent: the Mochi Show, world/mochi-show.js.)
export const MARKET = { shop: 330, keeper: 298, eggs: 580, wears: 820, stadium: 1360, show: 1525, garden: 1680 };

function marketMap() {
  const width = 1760;
  return {
    id: 'mochi_market', name: 'Mochi Market', theme: 'town', isTown: true, private: true, mochiTown: true, town: 'sprout',
    width, height: 780, groundY: LANE,
    look: { sky: ['#bfe4f2', '#e2f2ea', '#fdf6e2'], far: '#a8c8a0', mid: '#8fb88a', midTrim: '#7aa676', skyline: 'course:moonmortar', painted: null, groundArt: 'moonmortar', edges: 'flowers', islands: 'planks', material: 'mochifield', propKeep: 1, portal: 'mochi', critters: [] },
    cottages: [],
    // The lane, then up a grassy bank to the terrace.
    terrain: [[0, LANE], [1020, LANE], [1200, TERRACE], [width, TERRACE]],
    platforms: [],
    ropes: [],
    water: [],
    nodes: [],
    zonesBy: 'x',
    zones: [
      { name: 'Market Lane', from: 0, color: '#ff9ec0' },
      { name: 'Stadium Terrace', from: 1060, color: '#b8a8f0' },
    ],
    townPieces: [
      ['mg_lantern', 150, 2], ['mg_shop', MARKET.shop], ['mg_eggstall', MARKET.eggs], ['mg_wearstall', MARKET.wears], ['mg_lantern', 960, 3],
      // Flags strung across from each stall to the next, so the lane reads as a market street.
      ['mg_flagline', 412, { to: 516, h: 74 }], ['mg_flagline', 648, { to: 734, h: 74 }],
      // A lantern part way up the bank, lighting the way up to the terrace.
      ['mg_lantern', 1110, 1],
      ['mg_stadium', MARKET.stadium], ['mg_showtent', MARKET.show], ['mg_lantern', 1612, 4],
    ],
    // The egg stall and the clothes stall (ui/egg-stall.js, ui/wear-stall.js), and the race board at
    // Kinako's counter (her menu opens it: ui/npc.js).
    eggStall: MARKET.eggs,
    wearStall: MARKET.wears,
    raceBoard: MARKET.keeper,
    // (Up by the show tent: the Mochi Show's window, ui/mochi-show.js.)
    showTent: MARKET.show,
    portals: [
      { id: 'sprout', x: 70, y: LANE, to: 'sprout', toPortal: 'garden', label: 'Sprout Village' },
      { id: 'start', x: 200, y: LANE, hidden: true },
      { id: 'stadium', x: MARKET.stadium, y: TERRACE, to: 'mochi_stadium', toPortal: 'gate', label: 'Race Stadium', door: true },
      { id: 'garden', x: MARKET.garden, y: TERRACE, to: 'garden', toPortal: 'gate', label: 'Mochi Garden', style: 'mochi' },
    ],
    lamps: [
      { x: 150, y: LANE - 44, c: '#ffd6a0' }, { x: MARKET.shop, y: LANE - 40, c: '#ffd27a' }, { x: MARKET.wears, y: LANE - 58, c: '#ffe0c0' },
      { x: 960, y: LANE - 44, c: '#ffd6a0' }, { x: 1612, y: TERRACE - 44, c: '#ffd6a0' }, { x: MARKET.show, y: TERRACE - 60, c: '#ffc8e0' },
    ],
    // Kinako, the Garden Keeper, at her shop's counter (data/npcs.js kinako).
    npcs: [{ id: 'kinako', x: MARKET.keeper }],
    spawns: [],
    deco: [],
  };
}

MAPS.mochi_market = marketMap();
