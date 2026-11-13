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
// faster (`tire`) and slow the tired down more (`drag`); nobody stops.
const course = (start, finish, legs, slow = []) => ({ start, finish, legs, slow, total: finish - start + legs.reduce((sum, l) => sum + (l.kind === 'climb' ? l.from - l.to : 0), 0) });
// The skies: a blossom meadow, a lake, the cliffs, high among the clouds, the warm hills.
// (Calm: no petals drifting across the race and no butterflies over the runners, and since the
// course redraw (2026-11-13) no animals at all, not even fireflies at night, so the racers and
// their reactions read.)
const LOOK = { far: '#d4ecc8', mid: '#e2f2d4', midTrim: '#bfe0ac', skyline: 'mochigarden', edges: 'flowers', islands: 'planks', material: 'meadow', propKeep: 1, critters: [], drift: null, fireflies: false };
// Each course's own ground (render/terrain.js MATERIALS) and what grows along its top.
const GROUNDS = {
  sakura: { material: 'sakura', edges: 'petals' },
  lakeshore: { material: 'lakeshore', edges: 'shells' },
  cliffstone: { material: 'cliffstone', edges: 'clover' },
  maplecliff: { material: 'maplecliff', edges: 'clover' },
  snowpeak: { material: 'snowpeak', edges: 'clover' },
  sweetcake: { material: 'sweetcake', edges: 'clover' },
  kingroad: { material: 'kingroad', edges: 'clover' },
  kingstone: { material: 'kingstone', edges: 'clover' },
  kingdusk: { material: 'kingdusk', edges: 'clover' },
  cloudfloor: { material: 'cloudfloor', edges: null },
  harvest: { material: 'harvest', edges: 'flowers' },
  duskmeadow: { material: 'duskmeadow', edges: 'clover' },
  festground: { material: 'festground', edges: 'clover' },
};
const SKIES = {
  // (Sakura Sprint's, from its redraw: a fresh spring blue warming to blossom pink at the hills, so
  // the pink trees stand out against it.)
  sakura: ['#9fd2ff', '#d8eeff', '#ffe6ee'],
  // (Lily Lake's, from its redraw: a clear summer blue.)
  summer: ['#6cc4ff', '#bfe8ff', '#effaff'],
  // (Mortar Cliff's, from its redraw: a clear autumn blue, warm at the horizon.)
  autumn: ['#7cc0f2', '#fdf0dc', '#fff8ee'],
  // (Cloud Glide's, from its redraw: a cold clear blue going pink at the low winter sun.)
  winter: ['#8cc4f4', '#ffe4ee', '#fff4f8'],
  // (Long Hill Run's, from its redraw: a candy-floss sky, lavender going strawberry-milk pink to
  // cream at the horizon.)
  sweets: ['#c8b8ff', '#ffe0ea', '#fff4e8'],
  meadow: ['#ffd6e4', '#ffeadc', '#fff8f0'],
  lake: ['#cfe8ff', '#e6f4ff', '#f6fbff'],
  cliff: ['#d8d0ff', '#ebe6ff', '#f8f6ff'],
  clouds: ['#bcdcff', '#dcefff', '#f6fbff'],
  hills: ['#ffe2cc', '#fff0dc', '#fffaf0'],
  // (The Grand Mochi Course's, from its redraw: a summer dusk, violet above going rosy, then warm
  // peach at the horizon where the sun went down.)
  matsuri: ['#5a4aa0', '#f2b6b6', '#ffe0c4'],
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
function courseMap(id, name, { width, height = 640, terrain, water = [], sky, pieces, race, groundY = terrain[0][1], zones = null, ground = null, grounds = null, platforms = [], skyline = null, look = null, lamps = [], dusk = 0 }) {
  return {
    id, name, theme: 'town', isTown: true, private: true, mochiRace: true, town: 'sprout',
    width, height, groundY,
    look: { ...LOOK, sky: SKIES[sky], ...(ground ? GROUNDS[ground] : {}), ...(skyline ? { skyline, painted: null } : {}), ...(look ?? {}) },
    grounds,
    cottages: [], terrain, platforms, ropes: [], water, nodes: [],
    zonesBy: 'x',
    zones: zones ?? [{ name, from: 0, color: '#ff9ec0' }],
    townPieces: [['mr_arch', race.start, { kind: 'start' }], ...pieces, ...finishPieces(race.finish)],
    race,
    portals: [{ id: 'start', x: race.start, y: groundAtX(terrain, race.start), hidden: true }],
    lamps,
    dusk,
    npcs: [], spawns: [], deco: [],
  };
}

// Sakura Sprint: a spring festival dash under the cherry blossoms, rolling over little hills. All
// about Run. (Its redraw, 2026-11-13: render/courseart.js 'course:sakura' behind, blossom trees, the
// festival fence with its bunting and the quarter signs with their balloons beside the track.)
function sprintMap() {
  const G = 460;
  const terrain = [[0, G], [380, G], [560, G - 16], [760, G - 6], [960, G - 26], [1180, G - 10], [1400, G - 30], [1620, G - 12], [1840, G - 24], [2060, G - 6], [2200, G], [2760, G]];
  // (The fence's paper lanterns, one on each tall pole (render/courseart.js fence): lamps, so they
  // light the night.)
  const lamps = [];
  for (let p = 300; p <= 2180; p += 46 * 4) lamps.push({ x: p + 4.5, y: groundAtX(terrain, p) - 31, c: '#ffd6a0' });
  return courseMap('mrace_sprint', 'Sakura Sprint', {
    lamps,
    width: 2760, height: 560, sky: 'sakura', ground: 'sakura', skyline: 'course:sakura', look: { aerial: 0.55, clouds: false, groundArt: 'sakura', edges: 'sakura', festival: true, petalRain: true, bar: 'branch' },
    terrain,
    pieces: [['mr_sakura', 120, 0], ['mr_sakura', 590, 1], ['mr_sakura', 1100, 2], ['mr_sakura', 1580, 3], ['mr_sakura', 2010, 4],
      ['mr_fence', 300, { to: 2180 }], ['mr_sign', 740, 1], ['mr_sign', 1240, 2], ['mr_sign', 1740, 3], ['mr_starter', 322], ['mr_squad', 2120]],
    race: course(240, 2240, [{ kind: 'run', to: 2240 }]),
  });
}

// Lily Lake Swim: a dash to the shore, then right across a lily lake to the far bank. All about Swim.
// (Its redraw, 2026-11-13: a summer swimming gala, render/courseart.js 'course:lake': the far shore's
// willows and rowboats behind, a pier to dive from, a lane rope and floating quarter buoys across
// the lake, lilies and lotus that drift aside, parasols on the beaches.)
function swimMap() {
  const G = 500;
  return courseMap('mrace_swim', 'Lily Lake Swim', {
    width: 2800, sky: 'summer', ground: 'lakeshore', skyline: 'course:lake',
    look: { aerial: 0.55, clouds: false, groundArt: 'lake', edges: 'lake', festival: true, waterArt: 'lake', bar: 'lily', kicks: ['#f6e2bc', '#fff4dc', '#e8d0a0'], petals: ['#ffffff', '#c8f2ff', '#ffd0e0'] },
    terrain: [[0, G], [440, G], [452, 522], [470, 546], [500, 570], [550, 585], [610, 590], [1870, 590], [1930, 585], [1980, 570], [2010, 546], [2028, 522], [2040, G], [2800, G]],
    water: [{ x1: 440, x2: 2040, y: G, kind: 'lotus' }],
    pieces: [['mr_parasol', 80, 0], ['mr_starter', 322, 0], ['mr_pier', 384, { to: 500 }], ['mr_buoy', 725, 1], ['mr_buoy', 1230, 2], ['mr_buoy', 1735, 3], ['mr_squad', 2150, 0], ['mr_parasol', 2420, 1]],
    race: course(220, 2240, [{ kind: 'run', to: 440 }, { kind: 'swim', to: 2040, y: G }, { kind: 'run', to: 2240 }]),
  });
}

// Mortar Cliff Climb: up three climbing walls, a short ledge run between each, and along the top
// to the finish. All about Power.
// (Its redraw, 2026-11-13: an autumn mochi-pounding festival up a maple mountain,
// render/courseart.js 'course:maple': maples dropping leaves, a hot spring at the cliff's foot,
// sandstone cliffs with mochi holds and a bell at each top, Mochi pounding mochi on each ledge, a
// giant kagami mochi by the finish.)
function climbMap() {
  return courseMap('mrace_climb', 'Mortar Cliff Climb', {
    width: 2100, height: 680, sky: 'autumn', ground: 'maplecliff', skyline: 'course:maple',
    look: { aerial: 0.55, clouds: false, groundArt: 'maple', edges: 'maple', festival: true, wallArt: 'maple', bar: 'maple', leaves: true, kicks: ['#f88a5c', '#f8b456', '#f8d074', '#e87a52'], petals: ['#f88a5c', '#f8b456', '#ec7062', '#f8d074'] },
    terrain: [[0, 600], [520, 600], [520, 450], [800, 450], [800, 290], [1080, 290], [1080, 130], [2100, 130]],
    pieces: [
      ['mr_maple', 110, 0], ['mr_starter', 322, 0], ['mr_onsen', 400, 0],
      ['mr_wall', 520, { top: 450, bottom: 600 }], ['mr_pound', 556, 0], ['mr_maple', 720, 1],
      ['mr_wall', 800, { top: 290, bottom: 450 }], ['mr_pound', 836, 0], ['mr_maple', 990, 2],
      ['mr_wall', 1080, { top: 130, bottom: 290 }], ['mr_pound', 1116, 0], ['mr_squad', 1225, 0], ['mr_kagami', 1410, 0], ['mr_maple', 1470, 3],
    ],
    race: course(200, 1300, [{ kind: 'run', to: 520 }, { kind: 'climb', x: 520, from: 600, to: 450 }, { kind: 'run', to: 800 }, { kind: 'climb', x: 800, from: 450, to: 290 }, { kind: 'run', to: 1080 }, { kind: 'climb', x: 1080, from: 290, to: 130 }, { kind: 'run', to: 1300 }]),
  });
}

// Cloud Glide: a run-up along a high cliff top, a launch off its edge, and a long glide down over the
// cloud fluff (slow going for anyone who comes down in it early). All about Fly.
// (Its redraw, 2026-11-13: a winter glide off a snowy peak over a sea of clouds,
// render/courseart.js 'course:snow': snowy pines, stone lanterns, a ramp with streamers, an icy
// cliff, snow-mochi snowmen, a cocoa stall and a giant snow mochi at the landing; light snowfall.)
function glideMap() {
  return courseMap('mrace_glide', 'Cloud Glide', {
    width: 2300, height: 680, sky: 'winter', groundY: 580, ground: 'snowpeak', skyline: 'course:snow',
    look: { aerial: 0.55, clouds: false, groundArt: 'snow', edges: 'snow', festival: true, launchArt: 'snow', bar: 'snow', flakes: true, calm: true, snowfall: true, kicks: ['#ffffff', '#eef4ff', '#dce8fb'], petals: ['#ffffff', '#eef4ff', '#dce8fb', '#ffe8f0'] },
    terrain: [[0, 140], [700, 140], [700, 580], [2300, 580]],
    pieces: [
      ['mr_pine', 96, 0], ['mr_toro', 180, 0], ['mr_starter', 362, 0], ['mr_toro', 430, 0], ['mr_marker', 480, 1], ['mr_pine', 590, 1],
      ['mr_snowcliff', 700, { top: 140, bottom: 580 }], ['mr_clouds', 700, { w: 800 }], ['mr_launch', 698],
      ['mr_pine', 1180, 2], ['mr_cocoa', 1540, 0], ['mr_squad', 1625, 0], ['mr_bigsnow', 1845, 0], ['mr_snowman', 1960, 1], ['mr_pine', 2060, 3], ['mr_snowman', 2150, 0],
    ],
    race: course(240, 1700, [{ kind: 'run', to: 698 }, { kind: 'glide' }, { kind: 'run', to: 1700 }], [[700, 1500]]),
  });
}

// Long Hill Run: a long way over big rolling hills; uphill slows it and tires it, downhill flies,
// and one worn out has to stop to get its breath back. All about Stamina.
// (Its redraw, 2026-11-13: hills of Japanese sweets, render/courseart.js 'course:sweets': sponge
// cake under frosting, dango trees, picnickers on each hilltop cheering yours over, a sweets market
// and a giant dango by the finish; candy sprinkles over the podium.)
function hillsMap() {
  const G = 520;
  return courseMap('mrace_hills', 'Long Hill Run', {
    width: 2200, sky: 'sweets', ground: 'sweetcake', skyline: 'course:sweets',
    look: { aerial: 0.55, clouds: false, groundArt: 'sweets', edges: 'sweets', festival: true, bar: 'dango', calm: true, sprinkles: true, kicks: ['#ff8fb0', '#8fd3ff', '#ffd75e', '#9fe0a0', '#ffffff'], petals: ['#ff8fb0', '#8fd3ff', '#ffd75e', '#9fe0a0', '#c8a8f0', '#ffffff'] },
    terrain: [[0, G], [340, G], [520, 458], [660, 450], [820, 514], [1000, 500], [1180, 436], [1320, 428], [1500, 512], [1640, G], [2200, G]],
    pieces: [
      ['mr_dango', 100, 0], ['mr_dango', 196, 2], ['mr_starter', 322, 0], ['mr_dango', 455, 1], ['mr_sign', 565, 1], ['mr_fans', 610, 0], ['mr_dango', 742, 2],
      ['mr_sign', 890, 2], ['mr_squad', 950, 0], ['mr_dango', 1080, 0], ['mr_sign', 1215, 3], ['mr_fans', 1270, 1], ['mr_dango', 1410, 1],
      ['mr_bigdango', 1690, 0],
    ],
    race: { ...course(240, 1540, [{ kind: 'run', to: 1540 }]), tire: 1.5, drag: 3.2 },
  });
}

// The Grand Mochi Course: the meadow, the lake, a climbing wall, a glide off the top over the
// clouds, and home over the hills. Everything.
// (Its redraw, 2026-11-13: a summer festival at dusk, render/courseart.js 'course:matsuri':
// fireworks over a far town, lantern strings, lit stalls, floating lanterns on the pond, the yagura
// drum tower to climb with a drummer on top, a ramp off the far tower, a firework as yours takes
// off, a giant lantern at the finish, sparkler sparks over the podium.)
function grandMap() {
  const T = [[0, 520], [700, 520], [712, 540], [728, 562], [756, 582], [800, 596], [850, 600], [1050, 600], [1100, 596], [1144, 582], [1172, 562], [1188, 540], [1200, 520], [1450, 520], [1450, 360], [1800, 360], [1800, 520], [2350, 520], [2550, 470], [2700, 462], [2850, 520], [3500, 520]];
  // (The lanterns' light at dusk, for the night's lamps: one in the middle of each lantern string's
  // span, the stalls', a couple on the pond, the tower's, the giant lantern's.)
  const lamps = [];
  for (const [from, to] of [[250, 610], [1580, 1700], [2280, 2640]]) {
    for (let a = from; a + 120 <= to; a += 120) lamps.push({ x: a + 60, y: (groundAtX(T, a) + groundAtX(T, a + 120)) / 2 - 64, c: '#ffc890' });
  }
  lamps.push({ x: 456, y: 478, c: '#ffd6a0' }, { x: 582, y: 478, c: '#ffd6a0' }, { x: 860, y: 510, c: '#ffd090' }, { x: 1060, y: 510, c: '#ffd090' }, { x: 1420, y: 430, c: '#ffc890' }, { x: 3050, y: 398, c: '#ffb090' });
  return courseMap('mrace_grand', 'Grand Mochi Course', {
    dusk: 0.35, lamps,
    width: 3500, sky: 'matsuri', ground: 'festground', skyline: 'course:matsuri',
    look: { aerial: 0.55, clouds: false, groundArt: 'matsuri', edges: 'matsuri', face: 'moon', festival: true, wallArt: 'matsuri', launchArt: 'matsuri', bar: 'lantern', calm: true, sparks: true, kicks: ['#ffd75e', '#ff8fb0', '#8fd3ff', '#c8e8b0'], petals: ['#ffd75e', '#fff4c0', '#ff9aa8', '#ffffff'] },
    terrain: T,
    water: [{ x1: 700, x2: 1200, y: 520, kind: 'dusk', lilies: false, reeds: false }],
    pieces: [
      ['mr_chochin', 250, { to: 690 }], ['mr_starter', 322, 0], ['mr_yatai', 430, 0], ['mr_yatai', 556, 1],
      ['mr_fans', 1325, 0], ['mr_wall', 1450, { top: 360, bottom: 520 }], ['mr_taiko', 1540, 0], ['mr_chochin', 1580, { to: 1700 }], ['mr_fans', 1640, 1],
      ['mr_yaguraR', 1800, { top: 360, bottom: 520 }], ['mr_clouds', 1800, { w: 400 }], ['mr_launch', 1798],
      ['mr_chochin', 2280, { to: 2640 }], ['mr_squad', 2580, 0], ['mr_bigchochin', 3050, 0],
    ],
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
  { from: 0, name: 'Castle Town', icon: 'door', color: '#d8304a' },
  { from: 2000, name: 'The Moat', icon: 'drop', color: '#3a9a8e' },
  { from: 3480, name: 'Castle Walls', icon: 'shield', color: '#9a90a8' },
  { from: 4400, name: 'Over the Keep', icon: 'feather', color: '#f07a6a' },
  { from: 5880, name: 'The Royal Road', icon: 'crown', color: '#e0b040' },
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
  const poles = [5960, 6250, 6560, 6880, 7190, 7520, 7840, 8150];
  return courseMap('mrace_tour', 'Mochi Grand Tour', {
    width: 8900, height: 960, sky: 'meadow', ground: 'kingroad', skyline: 'course:kingdom',
    look: { aerial: 0.55, clouds: false, groundArt: 'kingdom', edges: 'kingdom', festival: true, wallArt: 'kingdom', launchArt: 'kingdom', bar: 'scroll', calm: true, confetti: true, kicks: ['#d8304a', '#ffd75e', '#ffffff', '#3a6ad8'], petals: ['#d8304a', '#ffd75e', '#ff8a9a', '#ffffff', '#ffe8a8'] },
    // (Its ground changes with it: the town's cobbled road, the moat's sandy bank and bed, the
    // castle's cut stone up top, the evening meadow home; each change hidden under water, at a wall
    // or at a cliff.)
    grounds: [{ from: 0, ...GROUNDS.kingroad }, { from: 2190, ...GROUNDS.lakeshore }, { from: 3700, ...GROUNDS.kingstone }, { from: 4560, ...GROUNDS.kingdusk }],
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
    water: [{ x1: 2100, x2: 3300, y: G, kind: 'moat', lilies: false, reeds: false }],
    // (The fork at Lily River: swim across, or take the boardwalk on its stilts beside it.)
    platforms: [{ x: 2100, y: G - 4, w: 1200, style: 'planks', dock: true, walkOn: true }],
    pieces: [
      ['mr_starter', 322, 0], ['mr_kbanner', 430, 0], ['mr_kgate', 580, 0], ['mr_kbanner', 760, 1], ['mr_ksubjects', 980, 0], ['mr_kbanner', 1140, 0], ['mr_kbanner', 1500, 1], ['mr_ksubjects', 1700, 1], ['mr_kbanner', 1860, 0],
      ['mr_checkpoint', 2000, { part: 2 }], ['mr_balloon', 2780, { y: 650, color: 1 }],
      ['mr_checkpoint', 3480, { part: 3 }], ['mr_kbanner', 3600, 1], ['mr_wall', 3700, { top: 610, bottom: G }], ['mr_ksubjects', 3880, 2], ['mr_wall', 4000, { top: 460, bottom: 610 }], ['mr_kbanner', 4120, 0],
      ['mr_checkpoint', 4400, { part: 4 }],
      ['mr_kcliff', 4560, { top: 460, bottom: V }], ['mr_clouds', 4560, { w: 700 }], ['mr_launch', 4558], ['mr_balloon', 5150, { y: 730, color: 1 }],
      ['mr_checkpoint', 5880, { part: 5 }], ['mr_ksubjects', 6120, 3], ['mr_ksubjects', 6420, 7], ['mr_ksubjects', 6760, 4], ['mr_ksubjects', 7040, 8], ['mr_ksubjects', 7380, 9], ['mr_ksubjects', 7640, 5], ['mr_ksubjects', 7900, 10], ['mr_squad', 8060, 0], ['mr_ksubjects', 8180, 6],
      ['mr_hayate', 8450, 0],
      ...poles.map((x, i) => ['mr_kpole', x, i % 4]),
      ...poles.slice(0, -1).map((x, i) => ['mr_kstring', x, { to: poles[i + 1] }]),
    ],
    race: {
      ...course(240, 8300, [{ kind: 'run', to: 2100 }, { kind: 'swim', to: 3300, y: G, alt: { kind: 'run', to: 3300, y: G - 4, slow: 0.82, name: 'the boardwalk' }, name: 'the river' }, { kind: 'run', to: 3700 }, { kind: 'climb', x: 3700, from: G, to: 610 },
        { kind: 'run', to: 4000 }, { kind: 'climb', x: 4000, from: 610, to: 460 }, { kind: 'run', to: 4558 }, { kind: 'glide' }, { kind: 'run', to: 8300 }], [[4560, 5260]]),
      parts: TOUR_PARTS, tire: 1.15, drag: 1.3, maxTime: 420,
    },
  });
}

MAPS.mochi_stadium = stadiumMap();
for (const map of [sprintMap(), swimMap(), climbMap(), glideMap(), hillsMap(), grandMap(), tourMap()]) MAPS[map.id] = map;
