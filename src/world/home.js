// Your island and your hut (data/home.js; docs/design/home-island.md). The island's map is built
// from how far Shelly has built it (`char.home.stage`), fresh each time you arrive, as MAPS.home;
// the hut's inside is MAPS.home_in. Everyone's island is their own: the map is never shared with
// the bots or the server's crowd.
//
//   char.home = { stage, back: { map, x } (where the Home Shell takes you back to), placed: [...],
//                 bag: { id: n } (furniture put away) }

import { MAPS } from '../data/maps.js';
import { SPOTS } from '../data/fishing.js';
import { SPOT } from '../data/gathering.js';
import { HOME_STAGES, HOME_MAX, HOME_SEA_POOL, HOME_POND_POOL } from '../data/home.js';
import { countItem, removeItem } from '../core/inventory.js';

const G = 540;
const SEA = 620;
const WATER = 552;
const CLIFF = 400;

// The island's map at a stage (1-5).
export function homeMap(stage = 1) {
  const s = Math.max(1, Math.min(HOME_MAX, stage));
  const width = s >= 4 ? 2350 : s === 3 ? 1720 : s === 2 ? 1460 : 1160;
  // The ground: the sea bed off the dock, up the beach, the island, (the pond), (the rocky rise),
  // (the shallows and the islet), and down into the sea at the far end.
  const t = [[0, SEA], [210, SEA], [300, G]];
  if (s >= 2) t.push([1000, G], [1040, 604], [1200, 604], [1240, G]);
  if (s >= 3) t.push([1320, G], [1360, 500], [1560, 500], [1600, G]);
  const end = s >= 4 ? 2250 : s === 3 ? 1640 : s === 2 ? 1380 : 1080;
  // The islet: a strip of beach, then a sandy cliff (up its ladder) with the shack on top.
  if (s >= 4) t.push([1640, G], [1700, SEA], [1820, SEA], [1880, G], [1958, G], [1958, CLIFF], [2190, CLIFF], [2190, G]);
  t.push([end, G], [end + 70, SEA], [width, SEA]);
  const water = [{ x1: 0, x2: 300, y: WATER }, { x1: end, x2: width, y: WATER }];
  if (s >= 2) water.push({ x1: 1004, x2: 1236, y: WATER });
  if (s >= 4) water.push({ x1: 1640, x2: 1880, y: WATER });
  const platforms = [
    // The dock, out over the water, where your skiff ties up.
    { x: 110, y: 528, w: 200, style: 'planks', dock: true },
    // The hut's roof deck, a bounce up from the clam on the beach.
    { x: 700, y: 410, w: 130, bare: true },
  ];
  const ropes = [];
  // The pond's little fishing jetty.
  if (s >= 2) platforms.push({ x: 1120, y: 528, w: 76, style: 'planks', dock: true });
  // The rope bridge over the shallows to the islet.
  if (s >= 4) platforms.push({ x: 1630, y: 524, w: 260, style: 'bridge', bare: true });
  // The ladder up the islet's cliff (and on top, at stage 5, the Sunset Terrace).
  if (s >= 4) ropes.push({ x: 1946, top: CLIFF, bottom: G, ladder: true });
  // The sea off the island's far end, from the last of the sand.
  const spots = [{ x: end - 10, y: G, face: 1, bx: end + 58, by: WATER + 2, sea: true, tier: 1, pool: HOME_SEA_POOL }];
  if (s >= 2) spots.push({ x: 1140, y: 528, face: -1, bx: 1092, by: WATER + 2, tier: 1, pool: HOME_POND_POOL });
  const nodes = [{ ...SPOT.herb(1, 'clover'), x: 935, y: G, garden: true }];
  if (s >= 3) nodes.push({ ...SPOT.ore(1), x: 1420, y: 500 }, { ...SPOT.herb(2, 'chanterelle'), x: 1520, y: 500 });
  if (s >= 4) nodes.push({ ...SPOT.fruit(1, 'cherry'), x: 1905, y: G }, { ...SPOT.fiber(1), x: 2220, y: G });
  const lamps = [{ x: 330, y: 500, c: '#ffb070' }, { x: 640, y: 500, c: '#ffb070' }, { x: 990, y: 500, c: '#ffb070' }, { x: 200, y: 500 }];
  if (s >= 3) lamps.push({ x: 1600, y: 470, c: '#ffb070' });
  if (s >= 4) lamps.push({ x: 1900, y: 500, c: '#ffb070' }, { x: 2230, y: 500, c: '#ffb070' });
  if (s >= 5) lamps.push({ x: 2175, y: 360, c: '#fff3a6' });
  const zones = [
    { name: 'The Dock', from: 0, color: '#5fb8d8' },
    { name: 'Shell Beach', from: 300, color: '#ffc896' },
    { name: 'Your Hut', from: 660, color: '#ff9ec0' },
  ];
  if (s >= 2) zones.push({ name: 'Tide Pond', from: 1000, color: '#5fd0c8' });
  if (s >= 3) zones.push({ name: 'The Rocky Rise', from: 1300, color: '#b8a088' });
  if (s >= 4) zones.push({ name: 'Coral Islet', from: 1640, color: '#ff9a8a' });
  const map = {
    id: 'home', name: 'Your Island', theme: 'harbor', isTown: true, private: true, home: true, town: 'harbor', music: 'lagoon',
    stage: s, width, height: 760, groundY: G,
    look: { sky: ['#9fd8ff', '#cdeeff', '#f2fbff'], far: '#a8e0f0', mid: '#bfe8d8', midTrim: '#8fd0c0', skyline: 'opensea', islands: 'planks', material: 'sand', propKeep: 1 },
    cottages: [],
    terrain: t, water, platforms, ropes, nodes, lamps, zonesBy: 'x', zones,
    springs: [{ x: 640, y: G, up: 150, kind: 'clam' }],
    // The island's pieces (render/island.js), left to right.
    townPieces: [
      ['skiff', 58], ['palm', 360, 1], ['conch', 470], ['palm', 600, -1], ['hut', 765, s],
      ['garden', 935], ...(s >= 2 ? [['reeds', 1015], ['reeds', 1228]] : []),
      ...(s >= 3 ? [['boulders', 1380], ['palm', 1590, -1]] : []), ...(s >= 4 ? [['ropebridge', 1760], ['palm', 1890, 1], ['islethut', 2040], ['palm', 2165, -1]] : []),
      ...(s >= 5 ? [['terrace', 2074]] : []),
      ['rockpools', end - 30],
    ],
    portals: [
      // Where you come ashore (off the skiff, or by the Home Shell), and the hut's door.
      { id: 'dock', x: 230, y: 528, hidden: true },
      { id: 'start', x: 230, y: 528, hidden: true },
      { id: 'hut', x: 765, y: G, to: 'home_in', toPortal: 'door', label: 'Your Hut', door: true },
    ],
    npcs: [{ id: 'shelly', x: 580 }],
    spawns: [],
    deco: [],
  };
  return { map, spots };
}

// The hut's inside: one cosy room (render/island.js draws its walls and floor).
export function homeInside() {
  return {
    id: 'home_in', name: 'Your Hut', theme: 'harbor', isTown: true, private: true, home: true, indoor: true, town: 'harbor', music: 'lagoon',
    width: 640, height: 400, groundY: 360,
    look: { ceiling: true, sky: ['#ffe8d8', '#fff2e6', '#fff8f0'], material: 'parquet', propKeep: 1 },
    cottages: [],
    terrain: [[0, 360], [640, 360]],
    platforms: [{ x: 70, y: 262, w: 150, bare: true, shelf: true }, { x: 420, y: 262, w: 150, bare: true, shelf: true }],
    ropes: [],
    townPieces: [['hutroom', 320]],
    portals: [{ id: 'door', x: 320, y: 360, to: 'home', toPortal: 'hut', label: 'Outside', door: true }, { id: 'start', x: 320, y: 360, hidden: true }],
    npcs: [], spawns: [], deco: [], lamps: [{ x: 320, y: 120, c: '#ffd27a' }],
  };
}

// Puts the current island (and the hut) into the map list, with the island's fishing spots.
export function refreshHome(char) {
  const { map, spots } = homeMap(char.home?.stage ?? 1);
  MAPS.home = map;
  MAPS.home_in = homeInside();
  SPOTS.home = spots;
  return map;
}
refreshHome({});

export const hasIsland = (char) => Boolean(char.home);

// Gives the island (Captain Rook's deed): a Home Shell to get there.
export function grantIsland(char) {
  if (char.home) return false;
  char.home = { stage: 1, back: null, placed: [], bag: {} };
  return true;
}

// What the next stage needs that you haven't got: [{ id, need, have }] plus gold, or null at the top.
export function nextStageNeeds(char) {
  const stage = char.home?.stage ?? 1;
  if (stage >= HOME_MAX) return null;
  const def = HOME_STAGES[stage + 1];
  return { stage: stage + 1, def, items: Object.entries(def.needs).map(([id, need]) => ({ id, need, have: countItem(char.inventory, id) })), gold: def.gold, haveGold: char.gold };
}

// Shelly builds the next stage if you have everything. Returns the new stage or a reason string.
export function buildNext(char) {
  const n = nextStageNeeds(char);
  if (!n) return 'The island is finished!';
  if (n.haveGold < n.gold || n.items.some((i) => i.have < i.need)) return "You don't have everything she needs yet.";
  char.gold -= n.gold;
  for (const i of n.items) removeItem(char.inventory, i.id, i.need);
  char.home.stage = n.stage;
  refreshHome(char);
  return n.stage;
}
