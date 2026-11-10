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
function courseMap(id, name, { width, height = 640, terrain, water = [], sky, pieces, race, groundY = terrain[0][1] }) {
  return {
    id, name, theme: 'town', isTown: true, private: true, mochiRace: true, town: 'sprout',
    width, height, groundY,
    look: { ...LOOK, sky: SKIES[sky] },
    cottages: [], terrain, platforms: [], ropes: [], water, nodes: [],
    zonesBy: 'x',
    zones: [{ name, from: 0, color: '#ff9ec0' }],
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
    width: 2760, height: 560, sky: 'meadow',
    terrain: [[0, G], [380, G], [560, G - 16], [760, G - 6], [960, G - 26], [1180, G - 10], [1400, G - 30], [1620, G - 12], [1840, G - 24], [2060, G - 6], [2200, G], [2760, G]],
    pieces: [['mg_fruittree', 110, 0], ['mg_fruittree', 520, 2], ['mr_marker', 740, 1], ['mg_fruittree', 1010, 0], ['mr_marker', 1240, 2], ['mg_fruittree', 1500, 2], ['mr_marker', 1740, 3], ['mg_fruittree', 1960, 0]],
    race: course(240, 2240, [{ kind: 'run', to: 2240 }]),
  });
}

// Lily Lake Swim: a dash to the shore, then right across a lily lake to the far bank. All about Swim.
function swimMap() {
  const G = 500;
  return courseMap('mrace_swim', 'Lily Lake Swim', {
    width: 2800, sky: 'lake',
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
    width: 2100, height: 680, sky: 'cliff',
    terrain: [[0, 600], [520, 600], [520, 450], [800, 450], [800, 290], [1080, 290], [1080, 130], [2100, 130]],
    pieces: [['mg_fruittree', 100, 1], ['mr_wall', 520, { top: 450, bottom: 600 }], ['mr_wall', 800, { top: 290, bottom: 450 }], ['mr_wall', 1080, { top: 130, bottom: 290 }]],
    race: course(200, 1300, [{ kind: 'run', to: 520 }, { kind: 'climb', x: 520, from: 600, to: 450 }, { kind: 'run', to: 800 }, { kind: 'climb', x: 800, from: 450, to: 290 }, { kind: 'run', to: 1080 }, { kind: 'climb', x: 1080, from: 290, to: 130 }, { kind: 'run', to: 1300 }]),
  });
}

// Cloud Glide: a run-up along a high cliff top, a launch off its edge, and a long glide down over the
// cloud fluff (slow going for anyone who comes down in it early). All about Fly.
function glideMap() {
  return courseMap('mrace_glide', 'Cloud Glide', {
    width: 2300, height: 680, sky: 'clouds', groundY: 580,
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
    width: 2200, sky: 'hills',
    terrain: [[0, G], [340, G], [520, 458], [660, 450], [820, 514], [1000, 500], [1180, 436], [1320, 428], [1500, 512], [1640, G], [2200, G]],
    pieces: [['mg_fruittree', 120, 0], ['mr_marker', 565, 1], ['mg_fruittree', 660, 3], ['mr_marker', 890, 2], ['mr_marker', 1215, 3], ['mg_fruittree', 1320, 1]],
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

MAPS.mochi_stadium = stadiumMap();
for (const map of [sprintMap(), swimMap(), climbMap(), glideMap(), hillsMap(), grandMap()]) MAPS[map.id] = map;
