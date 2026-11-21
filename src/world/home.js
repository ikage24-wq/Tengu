// Your island and your hut (data/home.js; docs/design/home-island.md). The island's map is built
// from how far Shelly has opened it (`char.home.stage`), fresh each time you arrive, as MAPS.home;
// the hut's inside is MAPS.home_in, and the grotto behind the falls MAPS.home_cave. Everyone's
// island is their own: the map is never shared with the bots or the server's crowd.
//
//   char.home = { stage, back: { map, x } (where the Home Shell takes you back to), placed: [...],
//                 plots: [{ id, at } | null] (the garden terrace: what's planted and when),
//                 layout (2: the tall island of the 2026-11-21 rework) }
//
// The island is tall (the 2026-11-21 rework): the beach runs along the bottom, and the rock tiers
// rise behind it (`masses`, drawn by render/terrain.js behind the beach's sand): the garden
// terrace, the summit, the rocky rise and the sea stack out in the water. You walk on their tops
// (bare ledges) and climb between them by ladder, the bouncy clam and, from the summit, the zip
// line back down to the dock. A tier Shelly hasn't opened yet is there, wild and overgrown, with
// no way up.

import { MAPS } from '../data/maps.js';
import { SPOTS, FISH } from '../data/fishing.js';
import { SPOT, TIER_LV, FIND_TIER, TIER_FINDS, NODES } from '../data/gathering.js';
import { ITEMS } from '../data/items.js';
import { HOME_STAGES, HOME_MAX, HOME_SEA_POOL, HOME_POND_POOL, HOME_GROTTO_POOL, PLOTS_AT, PLANTABLE, NIGHT_PLANTS, GROW_SECS, GROW_YIELD, NIGHT_YIELD, RAIN_GROW, ISLAND_CROPS, CROP_BY_SEED, CROP_TIER, ROOM_BY_ID } from '../data/home.js';
import { countItem, removeItem, addItem } from '../core/inventory.js';
import { stashItem } from '../core/storage.js';
import { lifeLevel, lifeAction } from '../core/life.js';
import { AT_HOME } from '../data/sweethearts.js';

// Heights: the beach, the sea's surface and bed, and the tops of the tiers.
export const G = 1240;
const WATER = G + 12;
const SEA = G + 80;
const HEIGHT = SEA + 140;
const WIDTH = 2400;
export const TIER_Y = { garden: 1060, rise: 900, summit: 620, islet: 900 };
// Where each tier's top runs (its walkable span).
export const TIER_X = { garden: [460, 980], summit: [1110, 1440], rise: [1440, 1860], islet: [2080, 2350] };
// The stage that opens each tier.
export const TIER_STAGE = { garden: 1, rise: 3, islet: 4, summit: 5 };

// The beach's fixtures.
export const CRATE_X = 340;
export const PLOT_X = [520, 600, 680, 760, 840, 920];
const PLOT_REACH = 30;
// The zip line: from the post on the summit down to the post on the dock. A rider hangs `hang`
// below the cable, so they set off standing on the summit and step off onto the dock.
export const ZIP = { x1: 1150, y1: TIER_Y.summit - 62, x2: 150, y2: G - 12 - 62, hang: 62 };

// The hut's inside: the main room (0-640) from the start, the kitchen nook to its right (stage 2),
// the loft over the main room (3) and the sunroom past the kitchen (4).
const IN_FLOOR = 360;
export const IN = { bed: 112, trunk: 532, loftY: 214, loft: [40, 290] };

const built = (s, tier) => s >= TIER_STAGE[tier];

// The tiers' outlines for the renderer: each from its left foot, up and over its top, down to its
// right foot. The flat top is exactly the walkable ledge.
function masses(s) {
  const [g0, g1] = TIER_X.garden;
  const [s0, s1] = TIER_X.summit;
  const [r0, r1] = TIER_X.rise;
  const [i0, i1] = TIER_X.islet;
  const gy = TIER_Y.garden;
  const sy = TIER_Y.summit;
  const ry = TIER_Y.rise;
  const iy = TIER_Y.islet;
  return [
    // The cleft behind the pond: a slope of rock set back in shadow, rising from the garden's
    // shoulder to the summit, so the island climbs as one hill and the falls pour into a nook.
    { id: 'cleft', back: true, built: true, bottom: G + 30, pts: [[g1 - 30, G + 30], [g1 - 26, gy + 40], [g1 + 10, gy - 30], [g1 + 50, gy - 120], [g1 + 90, gy - 220], [s0 - 14, sy + 190], [s0 + 10, sy + 140], [s0 + 20, G + 30]] },
    // The rocky rise, behind the summit's foot (the summit stands in front of its left end).
    { id: 'rise', built: built(s, 'rise'), bottom: G + 30, pts: [[r0 - 30, G + 30], [r0 - 20, ry + 60], [r0 - 10, ry + 8], [r0, ry], [r1, ry], [r1 + 10, ry + 12], [r1 + 16, ry + 90], [r1 + 10, ry + 200], [r1 + 22, ry + 290], [r1 + 30, G + 30]] },
    // The summit: a tall headland, its left face over the pond, its right down to the rise.
    { id: 'summit', built: built(s, 'summit'), bottom: G + 30, pts: [[s0 - 16, G + 30], [s0 - 12, G - 120], [s0 - 6, sy + 380], [s0 - 12, sy + 250], [s0 - 6, sy + 110], [s0 - 2, sy + 10], [s0 + 10, sy], [s1 - 8, sy], [s1, sy + 10], [s1 + 6, sy + 120], [s1 + 2, sy + 230], [s1 + 4, ry + 4], [s1 + 6, G + 30]] },
    // The garden terrace: a broad shoulder of rock over Shelly's workshop.
    { id: 'garden', built: true, bottom: G + 30, pts: [[g0 - 34, G + 30], [g0 - 28, G - 60], [g0 - 14, gy + 50], [g0 - 4, gy + 8], [g0 + 8, gy], [g1 - 8, gy], [g1 + 2, gy + 10], [g1 + 8, gy + 70], [g1 + 18, G - 30], [g1 + 24, G + 30]] },
    // The sea stack: a pillar of rock standing in the shallows past the beach's end.
    { id: 'islet', built: built(s, 'islet'), bottom: SEA + 10, pts: [[i0 - 22, SEA + 10], [i0 - 16, G - 70], [i0 - 8, iy + 110], [i0 - 2, iy + 10], [i0 + 10, iy], [i1 - 10, iy], [i1 + 2, iy + 12], [i1 + 10, iy + 120], [i1 + 6, G - 120], [i1 + 18, SEA + 10]] },
  ];
}

// The island's map at a stage (1-5).
export function homeMap(stage = 1) {
  const s = Math.max(1, Math.min(HOME_MAX, stage));
  // The ground: the sea bed off the dock, up the beach, (the pond under the falls), along to the
  // beach's far end and down into the sea, where the sea stack stands.
  const t = [[0, SEA], [210, SEA], [300, G]];
  if (s >= 2) t.push([980, G], [1004, G + 50], [1084, G + 50], [1108, G]);
  t.push([1960, G], [2030, SEA], [WIDTH, SEA]);
  const water = [{ x1: 0, x2: 300, y: WATER }, { x1: 1960, x2: WIDTH, y: WATER }];
  if (s >= 2) water.push({ x1: 984, x2: 1104, y: WATER, kind: 'spring' });
  const platforms = [
    // The dock, out over the water, where the skiff ties up and the zip line comes down.
    { x: 110, y: G - 12, w: 200, style: 'planks', dock: true },
    // The garden terrace.
    { x: TIER_X.garden[0], y: TIER_Y.garden, w: TIER_X.garden[1] - TIER_X.garden[0], bare: true },
  ];
  const ropes = [{ x: 476, top: TIER_Y.garden, bottom: G, ladder: true }];
  // The pond's little fishing jetty.
  if (s >= 2) platforms.push({ x: 988, y: G - 12, w: 58, style: 'planks', dock: true });
  if (built(s, 'rise')) {
    platforms.push({ x: TIER_X.rise[0], y: TIER_Y.rise, w: TIER_X.rise[1] - TIER_X.rise[0], bare: true });
    ropes.push({ x: 1846, top: TIER_Y.rise, bottom: G, ladder: true });
  }
  if (built(s, 'islet')) {
    // The rope bridge from the rise out to the sea stack (render/island.js draws it), and its top.
    platforms.push({ x: TIER_X.rise[1], y: TIER_Y.rise, w: TIER_X.islet[0] - TIER_X.rise[1], bare: true, bridge: true });
    platforms.push({ x: TIER_X.islet[0], y: TIER_Y.islet, w: TIER_X.islet[1] - TIER_X.islet[0], bare: true });
  }
  if (built(s, 'summit')) {
    platforms.push({ x: TIER_X.summit[0], y: TIER_Y.summit, w: TIER_X.summit[1] - TIER_X.summit[0], bare: true });
    ropes.push({ x: 1452, top: TIER_Y.summit, bottom: TIER_Y.rise, ladder: true });
  }
  // Fishing: the sea off the beach's far end, and the pond from its jetty.
  const spots = [{ x: 1948, y: G, face: 1, bx: 2012, by: WATER + 2, sea: true, tier: 1, pool: HOME_SEA_POOL }];
  if (s >= 2) spots.push({ x: 1032, y: G - 12, face: 1, bx: 1078, by: WATER + 2, tier: 1, pool: HOME_POND_POOL });
  const nodes = [];
  if (built(s, 'rise')) nodes.push({ ...SPOT.ore(1), x: 1530, y: TIER_Y.rise }, { ...SPOT.herb(2, 'chanterelle'), x: 1630, y: TIER_Y.rise }, { ...SPOT.fruit(1, 'cherry'), x: 1750, y: TIER_Y.rise });
  if (built(s, 'islet')) nodes.push({ ...SPOT.fiber(1), x: 2106, y: TIER_Y.islet }, { ...SPOT.fruit(1, 'prickle_pear'), x: 2144, y: TIER_Y.islet });
  // Lamplight at night: posts on the beach, a lantern by the plots, the lighthouse's lamp.
  const lamps = [{ x: 300, y: G - 40, c: '#ffb070' }, { x: 830, y: G - 40, c: '#ffb070' }, { x: 1420, y: G - 40, c: '#ffb070' }, { x: 1620, y: G - 40, c: '#ffb070' }, { x: 560, y: TIER_Y.garden - 40, c: '#ffd07a' }];
  if (built(s, 'rise')) lamps.push({ x: 1690, y: TIER_Y.rise - 40, c: '#ffb070' });
  if (built(s, 'islet')) lamps.push({ x: 2200, y: TIER_Y.islet - 40, c: '#ffb070' });
  if (built(s, 'summit')) lamps.push({ x: 1395, y: TIER_Y.summit - 196, c: '#fff3a6' });
  // Zoned by height (no names on screen; the sky warms toward sunset as you climb to the summit).
  const zones = [
    { name: 'Shell Beach', from: HEIGHT, color: '#ffc896' },
    { name: 'The Garden Terrace', from: 1110, color: '#8ee08a' },
    { name: 'The Rocky Rise', from: 960, color: '#c8a888' },
    { name: 'Sunset Summit', from: 700, color: '#ffb48a', look: { sky: ['#ffc8a8', '#ffe2c8', '#fff4e6'] } },
  ];
  const portals = [
    // Where you come ashore (off the skiff, or by the Home Shell), and the hut's door.
    { id: 'dock', x: 230, y: G - 12, hidden: true },
    { id: 'start', x: 230, y: G - 12, hidden: true },
    { id: 'hut', x: 1290, y: G, to: 'home_in', toPortal: 'door', label: 'Your Hut', door: true },
  ];
  // The grotto, behind the falls.
  if (s >= 2) portals.push({ id: 'grotto', x: 1130, y: G, to: 'home_cave', toPortal: 'mouth', label: 'The Grotto', door: true });
  const pieces = [
    ['skiff', 58], ['crate', CRATE_X], ['palm', 404, 1], ['conch', 600], ['palm', 884, -1],
    ['plots', PLOT_X[0], s],
    // Overgrowth on the tiers that aren't open yet.
    ...(built(s, 'rise') ? [] : [['wild', 1650, TIER_Y.rise]]),
    ...(built(s, 'islet') ? [] : [['wild', 2210, TIER_Y.islet]]),
    ...(built(s, 'summit') ? [] : [['wild', 1280, TIER_Y.summit]]),
    // The falls (and, half behind them, the grotto's mouth), then the hut in front of the headland.
    ...(s >= 2 ? [['grotto', 1128], ['waterfall', 1098], ['reeds', 990]] : [['seep', 1098]]),
    ['hut', 1290, s],
    ['palm', 1520, 1], ['rockpools', 1730], ['palm', 1890, -1],
    ...(built(s, 'islet') ? [['ropebridge', TIER_X.rise[1]], ['islethut', 2222], ['tierpalm', 2338, TIER_Y.islet]] : []),
    ...(built(s, 'summit') ? [['terrace', 1262], ['isle_lighthouse', 1402], ['zipline', ZIP.x1]] : []),
  ];
  const map = {
    id: 'home', name: 'Your Island', theme: 'harbor', isTown: true, private: true, home: true, town: 'harbor', music: 'lagoon',
    stage: s, layout: 2, width: WIDTH, height: HEIGHT, groundY: G,
    look: { sky: ['#9fd8ff', '#cdeeff', '#f2fbff'], far: '#a8e0f0', mid: '#bfe8d8', midTrim: '#8fd0c0', skyline: 'opensea', islands: 'planks', material: 'sand', propKeep: 1 },
    cottages: [],
    terrain: t, water, platforms, ropes, nodes, lamps, zones,
    masses: masses(s),
    // The bouncy clam: up from the beach onto the garden terrace.
    springs: [{ x: 944, y: G, up: 212, kind: 'clam' }],
    ziplines: built(s, 'summit') ? [{ ...ZIP }] : [],
    bench: 772,
    townPieces: pieces,
    portals,
    npcs: [{ id: 'shelly', x: 700 }],
    spawns: [],
    deco: [],
  };
  return { map, spots };
}

// ---------- The hut's rooms (data/home.js HOME_ROOMS) ----------
// `home.rooms`: [{ id, x }] in the order Shelly built them. A side room opens off the right of what
// was there (its `x`, fixed once built, so furniture in it never moves); the loft goes over the
// main room. Islands from before rooms had their own price keep the ones the stages gave them.
export function roomsOf(home) {
  if (!home) return [];
  if (!home.rooms) {
    const s = home.stage ?? 1;
    const out = [];
    let x = 640;
    for (const [id, at] of [['kitchen', 2], ['loft', 3], ['sunroom', 4]]) {
      if (s < at) continue;
      const w = ROOM_BY_ID[id].w;
      out.push(w ? { id, x } : { id });
      if (w) x += w;
    }
    home.rooms = out;
  }
  return home.rooms;
}
export const roomOf = (home, id) => roomsOf(home).find((r) => r.id === id) ?? null;
export const hutWidth = (rooms) => 640 + rooms.reduce((n, r) => n + (ROOM_BY_ID[r.id]?.w ?? 0), 0);
// Where things stand in a side room: the stove in the kitchen, the bed in the bedroom, the
// telescope in the observatory.
export const stoveIn = (rooms) => {
  const k = rooms.find((r) => r.id === 'kitchen');
  return k ? k.x + 150 : 598;
};
export const bedroomBed = (rooms) => (rooms.find((r) => r.id === 'bedroom')?.x ?? null) == null ? null : rooms.find((r) => r.id === 'bedroom').x + 150;
export const scopeAt = (rooms) => (rooms.find((r) => r.id === 'observatory')?.x ?? null) == null ? null : rooms.find((r) => r.id === 'observatory').x + 160;

// What a room needs that you haven't got (like a stage's), whether the island's ready for it, and
// whether it's built.
export function roomNeeds(char, id) {
  const def = ROOM_BY_ID[id];
  if (!def) return null;
  return {
    def,
    built: Boolean(roomOf(char.home, id)),
    stageOk: (char.home?.stage ?? 1) >= def.stage,
    items: Object.entries(def.needs).map(([iid, need]) => ({ id: iid, need, have: countItem(char.inventory, iid) })),
    gold: def.gold,
    haveGold: char.gold,
  };
}
// Shelly builds a room if the island's ready and you have everything. Returns its name or why not.
export function buildRoom(char, id) {
  const n = roomNeeds(char, id);
  if (!n || !char.home) return 'There\'s no such room.';
  if (n.built) return `Your ${n.def.name} is already built!`;
  if (!n.stageOk) return `Shelly needs ${HOME_STAGES[n.def.stage].name} built first.`;
  if (n.haveGold < n.gold || n.items.some((i) => i.have < i.need)) return "You don't have everything she needs yet.";
  char.gold -= n.gold;
  for (const i of n.items) removeItem(char.inventory, i.id, i.need);
  const rooms = roomsOf(char.home);
  rooms.push(n.def.w ? { id, x: hutWidth(rooms) } : { id });
  refreshHome(char);
  return n.def.name;
}

// The hut's inside: the main room, and the rooms Shelly has built off it (render/island.js).
export function homeInside(stage = 1, rooms = []) {
  const s = Math.max(1, Math.min(HOME_MAX, stage));
  const width = hutWidth(rooms);
  const platforms = [{ x: 70, y: 262, w: 150, bare: true, shelf: true }, { x: 420, y: 262, w: 150, bare: true, shelf: true }];
  const ropes = [];
  if (rooms.some((r) => r.id === 'loft')) {
    // The loft: a gallery over the main room on brackets, up a ladder against the left wall (clear
    // of the bed and the door).
    platforms.push({ x: IN.loft[0], y: IN.loftY, w: IN.loft[1] - IN.loft[0], bare: true, loft: true });
    ropes.push({ x: IN.loft[0] - 14, top: IN.loftY, bottom: IN_FLOOR, ladder: true });
  }
  return {
    id: 'home_in', name: 'Your Hut', theme: 'harbor', isTown: true, private: true, home: true, indoor: true, town: 'harbor', music: 'lagoon',
    stage: s, rooms, width, height: 400, groundY: IN_FLOOR,
    look: { ceiling: true, floor: 'painted', sky: ['#ffe8d8', '#fff2e6', '#fff8f0'], material: 'parquet', propKeep: 1 },
    cottages: [],
    terrain: [[0, IN_FLOOR], [width, IN_FLOOR]],
    platforms,
    ropes,
    stove: stoveIn(rooms),
    townPieces: [['hutroom', 320, rooms]],
    portals: [{ id: 'door', x: 320, y: IN_FLOOR, to: 'home', toPortal: 'hut', label: 'Outside', door: true }, { id: 'start', x: 320, y: IN_FLOOR, hidden: true }],
    npcs: [], spawns: [], deco: [],
    lamps: [{ x: 320, y: 120, c: '#ffd27a' }, ...rooms.filter((r) => r.x != null).map((r) => ({ x: r.x + (ROOM_BY_ID[r.id].w / 2), y: 120, c: r.id === 'observatory' ? '#c8d8ff' : '#ffd27a' }))],
  };
}

// The grotto behind the falls (stage 2): a little sea cave round a glowing pool, the island's secret.
// Its legend only rises at night.
const GROTTO_FLOOR = 420;
export function homeGrotto() {
  const F = GROTTO_FLOOR;
  return {
    // (A cave like the Crystal Cave, in sea-cave teal: no sky, no weather; not a room, and nothing
    // to decorate in it.)
    id: 'home_cave', name: 'The Grotto', theme: 'cave', isTown: true, private: true, home: true, noDecor: true, town: 'harbor', music: 'lagoon',
    width: 900, height: 560, groundY: F,
    look: { sky: ['#123a4a', '#1d5662', '#2f7a80'], far: '#1e4e5a', mid: '#2a6670', midTrim: '#3f8a8a', skyline: 'crystals', underground: true, light: 'cave', stars: false, face: null, clouds: false, rainbow: 0, ceiling: true, material: 'searock', drift: 'sparkle', critters: [], props: [], propKeep: 1 },
    cottages: [],
    // The mouth on the left, a ledge down to the pool, the pool, and the back of the cave.
    terrain: [[0, F], [300, F], [330, F + 30], [360, F + 70], [660, F + 70], [700, F + 30], [730, F], [900, F]],
    water: [{ x1: 330, x2: 700, y: F + 20, kind: 'cave' }],
    platforms: [],
    ropes: [],
    townPieces: [['grottopool', 515]],
    portals: [{ id: 'mouth', x: 90, y: F, to: 'home', toPortal: 'grotto', label: 'Outside', door: true }, { id: 'start', x: 90, y: F, hidden: true }],
    npcs: [], spawns: [], deco: [],
    lamps: [{ x: 515, y: F + 10, c: '#9ff0e0' }],
  };
}

// Puts the current island (and the hut and the grotto) into the map list, with the island's
// fishing spots. A visitor's `guest` is the friend whose island it is (net/visit.js): their stage,
// their furniture.
export function refreshHome(char, guest = null) {
  const stage = (guest ?? char).home?.stage ?? 1;
  const { map, spots } = homeMap(stage);
  // Whoever lives here with you (world/sweethearts.js) spends their day on the island.
  const partner = (guest ?? char).livingWith;
  if (partner && AT_HOME[partner]) map.npcs.push({ id: partner, x: AT_HOME[partner].x });
  // (The plots' crops, live: render/island.js draws what's growing in each.)
  const home = (guest ?? char).home;
  if (home) home.plots ??= [];
  map.plots = home?.plots ?? [];
  // (A friend who hasn't been home since the tall rework: their outdoor furniture stood on the old
  // strip, so it isn't shown until they move in themselves.)
  if (guest?.home && guest.home.layout !== 2) guest.home.placed = (guest.home.placed ?? []).filter((p) => p.map !== 'home');
  MAPS.home = map;
  MAPS.home_in = homeInside(stage, roomsOf(home));
  // (The aquarium room's tanks show the biggest of each fish caught: render/island.js.)
  MAPS.home_in.fishBook = (guest ?? char).fishBook ?? {};
  MAPS.home_cave = homeGrotto();
  if (guest) {
    map.guestOf = guest;
    MAPS.home_in.guestOf = guest;
    MAPS.home_cave.guestOf = guest;
    map.name = `${guest.name}'s Island`;
    MAPS.home_in.name = `${guest.name}'s Hut`;
    map.portals.find((p) => p.id === 'hut').label = `${guest.name}'s Hut`;
  }
  SPOTS.home = spots;
  // (The grotto's pool, fished from the bank by the mouth.)
  SPOTS.home_cave = [{ x: 298, y: GROTTO_FLOOR, face: 1, bx: 392, by: GROTTO_FLOOR + 22, tier: 1, pool: HOME_GROTTO_POOL }];
  return map;
}
refreshHome({});

export const hasIsland = (char) => Boolean(char.home);

// Gives the island (Captain Rook's deed): a Home Shell to get there.
export function grantIsland(char) {
  if (char.home) return false;
  char.home = { stage: 1, back: null, placed: [], plots: [], rooms: [], layout: 2 };
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

// ---------- Moving in to the tall island (saves from before the 2026-11-21 rework) ----------
// The old island was one long strip at a different height, so furniture set down outside goes
// back into your bag to place again (inside the hut it stays: the main room didn't move).
// Returns how many pieces came back.
export function settleHome(char) {
  const h = char.home;
  if (!h || h.layout === 2) return 0;
  h.layout = 2;
  h.plots ??= [];
  delete h.bag;
  let n = 0;
  h.placed = (h.placed ?? []).filter((p) => {
    if (p.map !== 'home') return true;
    if (!ITEMS[p.id] || !addItem(char.inventory, p.id, 1)) return true;
    n++;
    return false;
  });
  // (Anything that wouldn't fit in the bag stays outside, set down on the beach.)
  for (const p of h.placed) if (p.map === 'home') Object.assign(p, { y: G, x: Math.max(1500, Math.min(1900, p.x + 1400)) });
  return n;
}

// ---------- The garden terrace's plots ----------

const nowSecs = () => Date.now() / 1000;
export const plotCount = (char) => PLOTS_AT[Math.max(1, Math.min(HOME_MAX, char.home?.stage ?? 1))];
// How long a plot takes: a rained-on one (`wet`) ripens sooner.
const growSecs = (plot) => GROW_SECS * (plot?.wet ? RAIN_GROW : 1);
// How grown a plot is (0 just planted, 1 ripe), or null if it's empty.
export function plotGrowth(plot, now = nowSecs()) {
  if (!plot?.id) return null;
  return Math.max(0, Math.min(1, (now - plot.at) / growSecs(plot)));
}
export const plotYield = (id) => (NIGHT_PLANTS.includes(id) ? NIGHT_YIELD : GROW_YIELD);
// The Gathering level a plant needs (its tier's, like picking it wild; an island seed, its crop's).
export const plantLevel = (id) => TIER_LV[CROP_BY_SEED[id]?.tier ?? FIND_TIER[id] ?? 1];
// The island stage a seed needs (Sun Pineapples want the rise's sun...), or 1.
const seedStage = (id) => CROP_BY_SEED[id]?.stage ?? 1;

// The plot you're standing at on your own island: its index, or -1.
export function plotHere(world) {
  if (world.map.id !== 'home' || world.map.guestOf) return -1;
  const b = world.body;
  if (Math.abs(b.y - TIER_Y.garden) > 2) return -1;
  const n = plotCount(world.char);
  let best = -1;
  for (let i = 0; i < n; i++) if (Math.abs(PLOT_X[i] - b.x) <= PLOT_REACH && (best < 0 || Math.abs(PLOT_X[i] - b.x) < Math.abs(PLOT_X[best] - b.x))) best = i;
  return best;
}

// What you could plant from your bag: Shelly's island seeds first, then what you gathered.
// [{ id, n, ok (you can plant it now), stage (the island stage it waits for, when that's why) }].
const SEEDS = ISLAND_CROPS.map((c) => c.seed.id);
export function plantables(char) {
  const have = new Map();
  for (const e of char.inventory.etc ?? []) if (PLANTABLE.includes(e.id) || SEEDS.includes(e.id)) have.set(e.id, (have.get(e.id) ?? 0) + e.qty);
  const stage = char.home?.stage ?? 1;
  return [...SEEDS, ...PLANTABLE].filter((id) => have.has(id)).map((id) => {
    const early = stage < seedStage(id);
    return { id, n: have.get(id), ok: !early && lifeLevel(char, 'gathering') >= plantLevel(id), stage: early ? seedStage(id) : null };
  });
}

// Plants one of `id` (a gathered find, or one of Shelly's seeds) in plot i. Returns a reason it
// can't, or null.
export function plant(char, i, id, now = nowSecs()) {
  const h = char.home;
  if (!h || i < 0 || i >= plotCount(char)) return 'There\'s no plot there.';
  const crop = CROP_BY_SEED[id];
  if (!PLANTABLE.includes(id) && !crop) return 'That won\'t grow in a garden.';
  h.plots ??= [];
  if (h.plots[i]?.id) return 'Something is already growing there.';
  if ((h.stage ?? 1) < seedStage(id)) return `${crop.name}s need ${HOME_STAGES[crop.stage].name} built first.`;
  if (lifeLevel(char, 'gathering') < plantLevel(id)) return `You need Gathering Lv ${plantLevel(id)} to grow ${crop?.name ?? ITEMS[id].name}.`;
  if (countItem(char.inventory, id) < 1) return `You don't have any ${ITEMS[id].name}.`;
  removeItem(char.inventory, id, 1);
  h.plots[i] = { id: crop?.id ?? id, at: now };
  return null;
}

// ---------- Rain on the island, and whoever lives with you ----------

// Each frame on your island: while it rains (world/lives.js rolls the island's weather) the pond
// under the falls fills a little (and drains again after, easing, never snapping), and whatever's
// growing on the terrace gets watered, so it ripens sooner.
const POND_RISE = 8;
export function homeTick(world, dt) {
  const map = world.map;
  // (Indoors a room has no night of its own; the observatory's skylight shows the real sky.)
  if (map.id === 'home_in') map.skyNight = world.night ?? 0;
  if (map.id !== 'home') return;
  const rain = world.weather === 'rain';
  const pond = map.water?.find((w) => w.kind === 'spring');
  if (pond) {
    pond.base ??= pond.y;
    const want = pond.base - (rain ? POND_RISE : 0);
    pond.y += (want - pond.y) * Math.min(1, dt * 0.5);
  }
  if (rain && !map.guestOf) for (const p of world.char.home?.plots ?? []) if (p?.id && !p.wet) p.wet = true;
}

// Coming home with someone living with you: while you were away they picked whatever was ripe on
// the terrace and put it in the trunk (your storage: `w`, the world file's). Returns what they
// picked: [{ id, n }]. (A plot whose crop won't fit in storage they leave for you.)
export function helperPicks(char, w, now = nowSecs()) {
  if (!char.livingWith || !char.home || !w) return [];
  const got = [];
  (char.home.plots ?? []).forEach((plot, i) => {
    if (plotGrowth(plot, now) !== 1) return;
    const n = plotYield(plot.id);
    if (!stashItem(w, plot.id, n)) return;
    got.push({ id: plot.id, n });
    char.home.plots[i] = null;
  });
  return got;
}

// Up at a plot: pick it when it's ripe (kneeling and tugging, like the Mochi Garden's crop bed), say
// how long is left while it grows, or ask what to plant when it's empty. Returns true if handled.
const HARVEST_SECS = 1.5;
export function tendPlot(world) {
  const i = plotHere(world);
  if (i < 0) return false;
  const char = world.char;
  const plot = char.home.plots?.[i];
  const k = plotGrowth(plot);
  if (k == null) {
    if (!plantables(char).length) world.log('Nothing to plant. Bring herbs, fruit or fibre you\'ve gathered, or Shelly\'s island seeds, and they\'ll grow here.', '#ffb3c6');
    else world.events.push({ type: 'plant', plot: i });
    return true;
  }
  if (k < 1) {
    const mins = Math.ceil((growSecs(plot) * (1 - k)) / 60);
    world.log(`Your ${ITEMS[plot.id].name} is still growing. Ripe in about ${mins} minute${mins === 1 ? '' : 's'}.`, '#cfe8ff');
    return true;
  }
  if (world.gathering) return true;
  const b = world.body;
  const x = PLOT_X[i];
  b.facing = x >= b.x ? 1 : -1;
  b.vx = 0;
  const id = plot.id;
  const n = plotYield(id);
  world.gathering = {
    node: { x, y: b.y, kind: 'herb', pool: { [id]: 1 } },
    i: -1,
    kind: { verb: 'Pick', move: 'gather', secs: HARVEST_SECS, rest: 0, count: [n, n] },
    skill: 'gathering',
    secs: HARVEST_SECS,
    t: 0,
    free: () => {
      world.lastGathered = { x, y: b.y, items: [id], at: world.now };
    },
    done: () => {
      if (!addItem(char.inventory, id, n)) {
        world.log('Your bag is full. Make some room and pick it again.', '#ffb3c6');
        return;
      }
      char.home.plots[i] = null;
      world.log(`You pick ${n} ${ITEMS[id].name} from your garden.`, '#d6f5b0');
      lifeAction(world, 'gathering', { tier: FIND_TIER[id] ?? CROP_TIER[id] ?? 1, kind: 'gather' });
    },
  };
  world.pose = { kind: 'gather', t: HARVEST_SECS, dur: HARVEST_SECS, since: world.now };
  return true;
}

// ---------- The beach's and the hut's fixtures ----------

const onFloor = (world, y) => Math.abs(world.body.y - y) < 4;
// Your own island only: a visitor can look, but the crate, trunk and plots are yours.
const own = (world) => world.map.home && !world.map.guestOf;
export const crateHere = (world) => own(world) && world.map.id === 'home' && Math.abs(world.body.x - CRATE_X) < 26 && onFloor(world, G);
export const trunkHere = (world) => own(world) && world.map.id === 'home_in' && Math.abs(world.body.x - IN.trunk) < 26 && onFloor(world, IN_FLOOR);
// The main room's bed nook, or the bedroom's bed ('bedroom'); false if neither.
export function bedHere(world) {
  if (!own(world) || world.map.id !== 'home_in' || !onFloor(world, IN_FLOOR)) return false;
  const big = bedroomBed(world.map.rooms ?? []);
  if (big != null && Math.abs(world.body.x - big) < 44) return 'bedroom';
  return Math.abs(world.body.x - IN.bed) < 40 ? 'nook' : false;
}
// The observatory's telescope.
export const scopeHere = (world) => {
  const x = own(world) && world.map.id === 'home_in' ? scopeAt(world.map.rooms ?? []) : null;
  return x != null && Math.abs(world.body.x - x) < 30 && onFloor(world, IN_FLOOR);
};
// What the telescope tells you: the night-only fish you haven't caught yet and where they bite,
// and where the night flowers bloom. Lines for the log.
export function stargaze(char) {
  const book = char.fishBook ?? {};
  const where = (pred) => Object.entries(SPOTS).find(([, list]) => list.some(pred))?.[0];
  const fish = FISH.filter((f) => f.when === 'night' && !(book[f.id]?.n > 0)).map((f) => {
    const m = where((s) => s.pool[f.id]);
    return m && MAPS[m] ? `${f.name} (${MAPS[m].name})` : null;
  }).filter(Boolean);
  const flowers = [];
  for (const t of [1, 2, 3, 4]) {
    const id = TIER_FINDS[t].night;
    const m = Object.keys(MAPS).find((mid) => [...(NODES[mid] ?? []), ...(MAPS[mid].nodes ?? [])].some((n) => n.night && n.pool?.[id]));
    if (m) flowers.push(`${ITEMS[id].name} (${MAPS[m].name})`);
  }
  return [
    'You put your eye to the telescope. The stars are out over the sea...',
    fish.length ? `Night fish you haven't caught yet: ${fish.slice(0, 6).join(', ')}${fish.length > 6 ? `, and ${fish.length - 6} more` : ''}.` : 'You\'ve caught every fish that only bites at night. The stars look impressed.',
    flowers.length ? `Night flowers bloom at: ${flowers.join(', ')}.` : '',
  ].filter(Boolean);
}
