// The Mochi Race Stadium and its courses (docs/design/mochi.md step 5; the race: world/mochi-race.js).
// The stadium is through the gate at the top of your Mochi Garden: a sunny plaza, the race board (Up:
// ui/mochi-race.js) standing on its own by the gate, the stands, and the arch out to the courses. Each stage is its
// own course map, run left to right from its start arch to its finish arch along its legs (see
// `course` below), with the crowd's stands just past the line, where you watch from.
//
// Pieces (render/race.js): mr_stands (the stands, the crowd of Mochi bobbing and waving), mr_board
// (the race board), mr_arch (a start or finish arch, a chequered line under the finish), mr_marker
// (a little pennant post marking a quarter of the way), mr_wall (a climbing crag with coloured holds),
// mr_launch (a little wooden kicker at a glide's edge), mr_clouds (the cloud fluff). The courses
// borrow the Garden's blossom trees, lanterns, reeds, lily pads and rock faces (render/garden.js).

import { MAPS } from '../data/maps.js';

const FLOOR = 420;

function stadiumMap() {
  const width = 960;
  return {
    id: 'mochi_stadium', name: 'Mochi Race Stadium', theme: 'town', isTown: true, private: true, mochiRace: true, town: 'sprout',
    width, height: 520, groundY: FLOOR,
    look: { sky: ['#cfe6ff', '#e8f3ff', '#fff8f0'], far: '#d4ecc8', mid: '#e2f2d4', midTrim: '#bfe0ac', skyline: 'mochigarden', edges: 'flowers', islands: 'planks', material: 'meadow', propKeep: 1, portal: 'mochi' },
    cottages: [],
    terrain: [[0, FLOOR], [width, FLOOR]],
    platforms: [],
    ropes: [],
    water: [],
    nodes: [],
    zonesBy: 'x',
    zones: [{ name: 'Mochi Race Stadium', from: 0, color: '#ff9ec0' }],
    townPieces: [
      ['mg_lantern', 130, 1], ['mr_board', 220], ['mr_stands', 310, { w: 400 }], ['mr_arch', 800, { kind: 'gate' }], ['mg_lantern', 900, 4],
    ],
    // Up at the board: the race board (ui/mochi-race.js).
    raceBoard: 220,
    portals: [
      { id: 'gate', x: 60, y: FLOOR, to: 'garden', toPortal: 'stadium', label: 'Mochi Garden' },
      { id: 'start', x: 150, y: FLOOR, hidden: true },
      { id: 'board', x: 220, y: FLOOR, hidden: true },
    ],
    lamps: [{ x: 130, y: FLOOR - 44, c: '#ffd6a0' }, { x: 900, y: FLOOR - 44, c: '#ffd6a0' }],
    npcs: [],
    spawns: [],
    deco: [],
  };
}

// ---------- The courses ----------
// A course's race: from `start` to `finish`, along its `legs` (world/mochi-race.js): `{ kind: 'run',
// to }` along the ground; `{ kind: 'swim', to, y }` across the water at its surface; `{ kind:
// 'climb', x, from, to }` up the climbing wall at x, from its foot to its top, and over onto the
// ledge; `{ kind: 'glide' }` off the edge, down until it lands. `slow`: stretches of cloud fluff
// that everyone wades through at much the same slow pace ([from, to]). `total`: how far it is,
// along the ground and up the walls (for the race's progress bar). A hard course can tire them
// faster (`tire`) and make the worn-out stop to rest (`restAt`: how tired; `rest`: for how long).
const course = (start, finish, legs, slow = []) => ({ start, finish, legs, slow, total: finish - start + legs.reduce((sum, l) => sum + (l.kind === 'climb' ? l.from - l.to : 0), 0) });
// The skies: a blossom meadow, a lake, the cliffs, high among the clouds, the warm hills.
// (Calm: no petals drifting across the race and no butterflies over the runners, just a few birds
// on the grass, so the racers and their reactions read.)
const LOOK = { far: '#d4ecc8', mid: '#e2f2d4', midTrim: '#bfe0ac', skyline: 'mochigarden', edges: 'flowers', islands: 'planks', material: 'meadow', propKeep: 1, critters: ['bird'], drift: null };
// Each course's own ground (render/terrain.js MATERIALS) and what grows along its top.
const GROUNDS = {
  sakura: { material: 'sakura', edges: 'petals' },
  lakeshore: { material: 'lakeshore', edges: 'shells' },
  cliffstone: { material: 'cliffstone', edges: 'clover' },
  cloudfloor: { material: 'cloudfloor', edges: null },
  harvest: { material: 'harvest', edges: 'flowers' },
  duskmeadow: { material: 'duskmeadow', edges: 'clover' },
};
const SKIES = {
  meadow: ['#ffd6e4', '#ffeadc', '#fff8f0'],
  lake: ['#cfe8ff', '#e6f4ff', '#f6fbff'],
  cliff: ['#d8d0ff', '#ebe6ff', '#f8f6ff'],
  clouds: ['#bcdcff', '#dcefff', '#f6fbff'],
  hills: ['#ffe2cc', '#fff0dc', '#fffaf0'],
};
// (The ground's height at x along a terrain line, for placing things before the map exists.)
function groundAtX(terrain, x) {
  for (let i = 1; i < terrain.length; i++) {
    const [x0, y0] = terrain[i - 1];
    const [x1, y1] = terrain[i];
    if (x <= x1 && x1 > x0) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return terrain[terrain.length - 1][1];
}
// The finish: its arch (pennants strung under it), the stands where you watch from just past it, a
// lantern.
const finishPieces = (x) => [['mr_arch', x, { kind: 'finish' }], ['mr_stands', x + 250, { w: 260 }]];
// (`groundY`: where the land's horizon sits, the backdrop's hills along it; the start's height unless
// most of the course is lower.)
function courseMap(id, name, { width, height = 640, terrain, water = [], sky, pieces, race, groundY = terrain[0][1], zones = null, ground = null, grounds = null }) {
  return {
    id, name, theme: 'town', isTown: true, private: true, mochiRace: true, town: 'sprout',
    width, height, groundY,
    look: { ...LOOK, sky: SKIES[sky], ...(ground ? GROUNDS[ground] : {}) },
    grounds,
    cottages: [], terrain, platforms: [], ropes: [], water, nodes: [],
    zonesBy: 'x',
    zones: zones ?? [{ name, from: 0, color: '#ff9ec0' }],
    townPieces: [['mr_arch', race.start, { kind: 'start' }], ...pieces, ...finishPieces(race.finish)],
    race,
    portals: [{ id: 'start', x: race.start, y: groundAtX(terrain, race.start), hidden: true }],
    lamps: [],
    npcs: [], spawns: [], deco: [],
  };
}

// Sakura Sprint: a blossom meadow, rolling over little hills. All about Run.
function sprintMap() {
  const G = 460;
  return courseMap('mrace_sprint', 'Sakura Sprint', {
    width: 2760, height: 560, sky: 'meadow', ground: 'sakura',
    terrain: [[0, G], [380, G], [560, G - 16], [760, G - 6], [960, G - 26], [1180, G - 10], [1400, G - 30], [1620, G - 12], [1840, G - 24], [2060, G - 6], [2200, G], [2760, G]],
    pieces: [['mg_fruittree', 110, 0], ['mg_fruittree', 520, 2], ['mr_marker', 740, 1], ['mg_fruittree', 1010, 0], ['mr_marker', 1240, 2], ['mg_fruittree', 1500, 2], ['mr_marker', 1740, 3], ['mg_fruittree', 1960, 0]],
    race: course(240, 2240, [{ kind: 'run', to: 2240 }]),
  });
}

// Lily Lake Swim: a dash to the shore, then right across a lily lake to the far bank. All about Swim.
function swimMap() {
  const G = 500;
  return courseMap('mrace_swim', 'Lily Lake Swim', {
    width: 2800, sky: 'lake', ground: 'lakeshore',
    terrain: [[0, G], [440, G], [452, 522], [470, 546], [500, 570], [550, 585], [610, 590], [1870, 590], [1930, 585], [1980, 570], [2010, 546], [2028, 522], [2040, G], [2800, G]],
    water: [{ x1: 440, x2: 2040, y: G, kind: 'pond', lilies: false, reeds: false }],
    pieces: [['mg_fruittree', 100, 0], ['mg_reeds', 432, 0], ['mg_lilies', 660, 0], ['mg_lilies', 940, 1], ['mg_lilies', 1220, 0], ['mg_lilies', 1500, 1], ['mg_lilies', 1790, 0], ['mg_reeds', 2050, 1], ['mg_fruittree', 2130, 2]],
    race: course(220, 2240, [{ kind: 'run', to: 440 }, { kind: 'swim', to: 2040, y: G }, { kind: 'run', to: 2240 }]),
  });
}

// Mortar Cliff Climb: up three climbing walls, a short ledge run between each, and along the top
// to the finish. All about Power.
function climbMap() {
  return courseMap('mrace_climb', 'Mortar Cliff Climb', {
    width: 2100, height: 680, sky: 'cliff', ground: 'cliffstone',
    terrain: [[0, 600], [520, 600], [520, 450], [800, 450], [800, 290], [1080, 290], [1080, 130], [2100, 130]],
    pieces: [['mg_fruittree', 100, 1], ['mr_wall', 520, { top: 450, bottom: 600 }], ['mr_wall', 800, { top: 290, bottom: 450 }], ['mr_wall', 1080, { top: 130, bottom: 290 }]],
    race: course(200, 1300, [{ kind: 'run', to: 520 }, { kind: 'climb', x: 520, from: 600, to: 450 }, { kind: 'run', to: 800 }, { kind: 'climb', x: 800, from: 450, to: 290 }, { kind: 'run', to: 1080 }, { kind: 'climb', x: 1080, from: 290, to: 130 }, { kind: 'run', to: 1300 }]),
  });
}

// Cloud Glide: a run-up along a high cliff top, a launch off its edge, and a long glide down over the
// cloud fluff (slow going for anyone who comes down in it early). All about Fly.
function glideMap() {
  return courseMap('mrace_glide', 'Cloud Glide', {
    width: 2300, height: 680, sky: 'clouds', groundY: 580, ground: 'cloudfloor',
    terrain: [[0, 140], [700, 140], [700, 580], [2300, 580]],
    pieces: [['mg_fruittree', 110, 2], ['mr_marker', 480, 1], ['mg_rockface', 700, { top: 140, bottom: 580, seed: 5, flip: true }], ['mr_clouds', 700, { w: 800 }], ['mr_launch', 698]],
    race: course(240, 1700, [{ kind: 'run', to: 698 }, { kind: 'glide' }, { kind: 'run', to: 1700 }], [[700, 1500]]),
  });
}

// Long Hill Run: a long way over big rolling hills; uphill slows it and tires it, downhill flies,
// and one worn out has to stop to get its breath back. All about Stamina.
function hillsMap() {
  const G = 520;
  return courseMap('mrace_hills', 'Long Hill Run', {
    width: 2200, sky: 'hills', ground: 'harvest',
    terrain: [[0, G], [340, G], [520, 458], [660, 450], [820, 514], [1000, 500], [1180, 436], [1320, 428], [1500, 512], [1640, G], [2200, G]],
    pieces: [['mg_fruittree', 120, 0], ['mr_marker', 565, 1], ['mg_fruittree', 615, 3], ['mr_marker', 890, 2], ['mr_marker', 1215, 3], ['mg_fruittree', 1265, 1]],
    race: { ...course(240, 1540, [{ kind: 'run', to: 1540 }]), tire: 1.5, restAt: 0.6, rest: 2.2 },
  });
}

// The Grand Mochi Course: the meadow, the lake, a climbing wall, a glide off the top over the
// clouds, and home over the hills. Everything.
function grandMap() {
  return courseMap('mrace_grand', 'Grand Mochi Course', {
    width: 3500, sky: 'meadow',
    terrain: [[0, 520], [700, 520], [712, 540], [728, 562], [756, 582], [800, 596], [850, 600], [1050, 600], [1100, 596], [1144, 582], [1172, 562], [1188, 540], [1200, 520], [1450, 520], [1450, 360], [1800, 360], [1800, 520], [2350, 520], [2550, 470], [2700, 462], [2850, 520], [3500, 520]],
    water: [{ x1: 700, x2: 1200, y: 520, kind: 'pond', lilies: false, reeds: false }],
    pieces: [['mg_fruittree', 110, 0], ['mg_fruittree', 470, 2], ['mg_reeds', 692, 0], ['mg_lilies', 860, 0], ['mg_lilies', 1060, 1], ['mg_reeds', 1208, 1], ['mr_wall', 1450, { top: 360, bottom: 520 }],
      ['mg_fruittree', 1650, 1], ['mg_rockface', 1800, { top: 360, bottom: 520, seed: 9, flip: true }], ['mr_clouds', 1800, { w: 400 }], ['mr_launch', 1798], ['mg_fruittree', 2620, 3]],
    race: course(240, 2900, [{ kind: 'run', to: 700 }, { kind: 'swim', to: 1200, y: 520 }, { kind: 'run', to: 1450 }, { kind: 'climb', x: 1450, from: 520, to: 360 }, { kind: 'run', to: 1798 }, { kind: 'glide' }, { kind: 'run', to: 2900 }], [[1800, 2200]]),
  });
}

// The Mochi Grand Tour: the longest race of all, five parts in a day, each through its own arch
// with its name on a sign, under its own sky (the backdrop eases from one to the next): Blossom
// Meadow in the pink of the morning, past the big swing tree; Lily River, a long
// swim; Cotton Cliffs in the warm afternoon, up two walls to a high meadow where a hot-air balloon
// floats; off the edge into Sunset Clouds, a long glide over the fluff; and Lantern Hills at dusk,
// rolling home under strings of lights to the finish. Everything, and Stamina most of all.
const TOUR_PARTS = [
  { from: 0, name: 'Blossom Meadow', icon: 'leaf', color: '#ff8fb8' },
  { from: 2000, name: 'Lily River', icon: 'drop', color: '#5aa8e8' },
  { from: 3480, name: 'Cotton Cliffs', icon: 'hammer', color: '#e0904a' },
  { from: 4400, name: 'Sunset Clouds', icon: 'feather', color: '#f07a6a' },
  { from: 5880, name: 'Lantern Hills', icon: 'moon', color: '#8a6ad0' },
];
const TOUR_SKIES = [
  { sky: ['#ffd0e2', '#ffe6e0', '#fff8f0'], far: '#d4ecc8', mid: '#e2f2d4', midTrim: '#bfe0ac' },
  { sky: ['#bcdcff', '#dcefff', '#f4fbff'], far: '#c8e8d4', mid: '#daf2e0', midTrim: '#b4dcc0' },
  { sky: ['#ffd2b0', '#ffe4c8', '#fff4e4'], far: '#e4dcb8', mid: '#eee8cc', midTrim: '#d4c8a0' },
  { sky: ['#ff9a90', '#ffbca0', '#ffe2c4'], far: '#f0c4b4', mid: '#f6d6c4', midTrim: '#e4b4a0' },
  { sky: ['#3e3480', '#8a62b0', '#ffaea0'], far: '#8e7cbc', mid: '#a894c8', midTrim: '#8470b4', stars: true, face: 'moon', glow: 1 },
];
function tourMap() {
  const G = 760;
  const V = 840;
  const lanterns = [5960, 6250, 6560, 6880, 7190, 7520, 7840, 8150];
  return courseMap('mrace_tour', 'Mochi Grand Tour', {
    width: 8900, height: 960, sky: 'meadow', ground: 'sakura',
    // (Its ground changes with it: rosy meadow, the river's sandy bed and banks, cliff stone up top,
    // the evening meadow from the cloud valley home; each change hidden under water, at a wall or a cliff.)
    grounds: [{ from: 0, ...GROUNDS.sakura }, { from: 2190, ...GROUNDS.lakeshore }, { from: 3700, ...GROUNDS.cliffstone }, { from: 4560, ...GROUNDS.duskmeadow }],
    zones: TOUR_PARTS.map((p, i) => ({ name: p.name, from: p.from, color: p.color, look: TOUR_SKIES[i] })),
    terrain: [
      // Blossom Meadow: little rises, a flat green for the big tree.
      [0, G], [420, G], [600, G - 14], [800, G - 6], [980, G - 20], [1120, G - 18], [1480, G - 18], [1640, G - 8], [1840, G], [2100, G],
      // Lily River: down the bank, the riverbed, up the far bank.
      [2112, 780], [2130, 802], [2160, 822], [2210, 836], [2270, 840], [3150, 840], [3200, 836], [3240, 822], [3268, 802], [3288, 780], [3300, G],
      // Cotton Cliffs: a stretch of shore, two walls up to the high meadow.
      [3700, G], [3700, 610], [4000, 610], [4000, 460], [4560, 460],
      // Sunset Clouds: off the edge, down to the valley floor under the fluff.
      [4560, V], [5900, V],
      // Lantern Hills: rolling home.
      [6100, 806], [6300, 798], [6500, 828], [6700, 820], [6900, 788], [7100, 782], [7300, 812], [7500, 820], [7700, 804], [7900, 812], [8100, 820], [8900, 820],
    ],
    water: [{ x1: 2100, x2: 3300, y: G, kind: 'pond', lilies: false, reeds: false }],
    pieces: [
      ['mg_fruittree', 110, 0], ['mg_fruittree', 500, 2], ['mg_bigtree', 1300], ['mg_fruittree', 1740, 1],
      ['mr_checkpoint', 2000, { part: 2 }], ['mg_reeds', 2092, 0], ['mg_lilies', 2240, 1], ['mg_lilies', 2400, 0], ['mg_reeds', 2560, 1], ['mg_lilies', 2690, 1], ['mg_lilies', 2860, 0], ['mr_balloon', 2780, { y: 650, color: 1 }], ['mg_lilies', 3020, 1], ['mg_lilies', 3170, 0], ['mg_reeds', 3308, 1],
      ['mr_checkpoint', 3480, { part: 3 }], ['mg_fruittree', 3600, 3], ['mr_wall', 3700, { top: 610, bottom: G }], ['mg_fruittree', 3850, 0], ['mr_wall', 4000, { top: 460, bottom: 610 }],
      ['mr_balloon', 4180, { y: 365 }], ['mr_checkpoint', 4400, { part: 4 }],
      ['mg_rockface', 4560, { top: 460, bottom: V, seed: 7, flip: true, vines: 3 }], ['mr_clouds', 4560, { w: 700 }], ['mr_launch', 4558], ['mr_balloon', 5150, { y: 730, color: 1 }],
      ['mr_checkpoint', 5880, { part: 5 }],
      ...lanterns.map((x, i) => ['mg_lantern', x, i % 5]),
      ...lanterns.slice(0, -1).map((x, i) => ['mr_lights', x, { to: lanterns[i + 1] }]),
    ],
    race: {
      ...course(240, 8300, [{ kind: 'run', to: 2100 }, { kind: 'swim', to: 3300, y: G }, { kind: 'run', to: 3700 }, { kind: 'climb', x: 3700, from: G, to: 610 },
        { kind: 'run', to: 4000 }, { kind: 'climb', x: 4000, from: 610, to: 460 }, { kind: 'run', to: 4558 }, { kind: 'glide' }, { kind: 'run', to: 8300 }], [[4560, 5260]]),
      parts: TOUR_PARTS, tire: 1.15, restAt: 0.75, rest: 1.8, maxTime: 420,
    },
  });
}

MAPS.mochi_stadium = stadiumMap();
for (const map of [sprintMap(), swimMap(), climbMap(), glideMap(), hillsMap(), grandMap(), tourMap()]) MAPS[map.id] = map;
