// World maps. Coordinates are in world pixels; y grows downward.
//
//   groundY    top of the floor that runs the full width
//   platforms  one-way ledges {x, y, w}; y is the top surface. A jump reaches about 100px.
//   ropes      climbable {x, top, bottom}; taller ledges always have one
//   portals    {id, x, y, to, toPortal}; press Up to use. `hidden` portals are spawn points only.
//   npcs       {id, x}; they stand on the ground
//   spawns     {mob, x, y}; y is the surface the monster patrols (flyers hover above it)
//   town       the town you respawn in after dying here
//   world      where the map sits on the world map (in its 400x240 frame)
//   job        towns that are a job's home, where its instructor lives
//   plaza      in towns, where the fountain stands

import { SWEETHEARTS } from './sweethearts.js';
import { climb, lay, settleSpots, clearArrivals } from './climb.js';
import { MOBS } from './mobs.js';
import { SPOTS } from './fishing.js';
import { SPOT, NODES } from './gathering.js';

// An underground zone's look (a cellar, root tunnels, a crypt): earth or stone all round instead
// of sky, lit by its own glow: no sun, moon, stars, clouds or rainbow, no butterflies, birds or
// bunnies (fireflies and spores instead), no weather and no light rays from above.
const underground = (look) => ({ skyline: 'roots', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'], painted: null, face: null, stars: false, shooting: false, rainbow: 0, critters: ['firefly'], drift: 'spore', light: 'cave', underground: true, ...look });

export const MAPS = {
  // Sprout Village (rebuilt 2026-11-03): a countryside farm village round a great windmill whose
  // sails have all but stopped (the wind has gone quiet: the story's first clue). Clean and
  // spacious, one landmark per district, nothing important up a ladder. Left to right: Gate Lane,
  // under the flowering gate arch, where Mira welcomes you, past two thatched cottages; Market
  // Lane (Lulu's salon, Pip's goods, the craft workshop); Windmill Square, a gentle step up, the
  // capsule machine, the windmill (its balcony up a ladder is a lookout), the stove and the
  // fountain; Pond Garden, with the Party Board by the duck pond; and the Archers' Range, Kestrel,
  // the watchtower and the targets, out to the meadow road.
  sprout: {
    id: 'sprout', plaza: 1800, fountain: 2050, name: 'Sprout Village', theme: 'town', isTown: true, town: 'sprout', job: 'archer', world: { x: 66, y: 182 },
    // The town stove (data/cooking.js), the craft bench (data/crafting.js) in its workshop, and the
    // capsule machine (data/outfits-gacha.js), all round the square.
    stove: 1950,
    bench: 1410,
    workshed: true,
    gacha: 1655,
    width: 3200, height: 520, groundY: 480,
    look: { edges: 'flowers', islands: 'planks', propKeep: 0.86 },
    // The square is a gentle step up in the middle of the street.
    // (The duck pond in Pond Garden is sunk into the lawn under a little footbridge.)
    terrain: [[0, 480], [1460, 480], [1500, 456], [2100, 456], [2140, 480], [2168, 480], [2196, 516], [2276, 516], [2304, 480], [3200, 480]],
    water: [{ x1: 2168, x2: 2304, y: 490, kind: 'pond' }],
    // Thatched cottages and a farmhouse along Gate Lane (render/townhouses.js).
    cottages: [[600, 'farmhouse']],
    townPieces: [['gatearch', 205], ['windmill', 1800]],
    platforms: [
      // The windmill's balcony (drawn with the windmill), up the ladder on its west side.
      { x: 1740, y: 308, w: 120, bare: true },
      // The watchtower's deck.
      { x: 2578, y: 320, w: 84 },
      // The footbridge over the duck pond.
      { x: 2168, y: 480, w: 136, style: 'planks', walkOn: true },
    ],
    ropes: [
      { x: 1748, top: 308, bottom: 456, ladder: true },
      { x: 2594, top: 320, bottom: 480, ladder: true },
    ],
    portals: [
      { id: 'start', x: 140, y: 480, hidden: true },
      // The old mine road west, closing the island's ring: it comes out in the Crystal Cave.
      { id: 'west', x: 40, y: 480, to: 'cave', toPortal: 'sprout', label: 'Crystal Cave' },
      { id: 'east', x: 3150, y: 480, to: 'meadow1', toPortal: 'west' },
    ],
    npcs: [{ id: 'mira', x: 330 }, { id: 'lulu', x: 1105 }, { id: 'pip', x: 1260 }, { id: 'posy', x: 2152 }, { id: 'clover', x: 2340 }, { id: 'kestrel', x: 2480 }],
    // Its districts, left to right, each named as you walk in.
    zonesBy: 'x',
    zones: [
      { name: 'Gate Lane', from: 0, color: '#7fc89a' },
      { name: 'Market Lane', from: 1000, color: '#e0a040', look: { sky: ['#ffd9b0', '#ffecd0', '#fff8ea'] } },
      { name: 'Windmill Square', from: 1460, color: '#ff7fb6' },
      { name: 'Pond Garden', from: 2140, color: '#4fb0d8', look: { sky: ['#bfe8ff', '#e2f4ff', '#f8fff2'] } },
      { name: "Archers' Range", from: 2420, color: '#4f9e55' },
    ],
    // Street lamps that glow at night (world/daytime.js).
    lamps: [{ x: 320, y: 440 }, { x: 960, y: 440 }, { x: 1450, y: 440 }, { x: 1600, y: 416 }, { x: 2000, y: 416 }, { x: 2270, y: 440 }, { x: 2620, y: 290 }, { x: 2960, y: 440 }],
    deco: [
      ['archerbanner', 2540], ['watchtower', 2620], ['archerbanner', 2700],
      // The archery range: a rack of practice bows at the shooting line, targets down the lane.
      ['bowrack', 2740], ['fence', 2825], ['archtarget', 2880, 0], ['archtarget', 2940, 1], ['archtarget', 3000, 2], ['haystack', 3050, 1],
    ],
    spawns: [],
  },


  // Petal Meadow climbs one hillside of blossom in four zones (the map style the player picked:
  // tall, zoned, exits on different floors). Petal Fields at the bottom, where the Moss Tortoises
  // graze by the giant flower (the fishing pond is in the quiet east corner); Beehive Banks, where the Bumbles buzz round the giant hive; the
  // Blossom Boughs of the great cherry tree, the Kitsune Kits' playground; and the Petal Clouds on
  // top, where Petal Sprites drift, with a quiet lookout with the road to Windy Canyon as the reward for the climb. Each zone hunts in a loop:
  // ropes at both ends, a long floor between, gaps to drop through. No monsters near the portals.
  meadow1: {
    id: 'meadow1', name: 'Petal Meadow', theme: 'meadow', town: 'sprout', world: { x: 118, y: 160 },
    width: 2400, height: 1080, groundY: 1000,
    look: { sky: ['#ffc6dd', '#ffe3d8', '#fff6e6'], far: '#f3d3e8', mid: '#bfe8b8', midTrim: '#8fd39a', light: 'morning', edges: 'flowers', props: ['flower', 'tulip', 'flower', 'bush', 'tulip', 'tuft'] },
    zones: [
      { name: 'Petal Fields', from: Infinity, color: '#e889b4' },
      { name: 'Beehive Banks', from: 800, color: '#e0a040', look: { sky: ['#ffd9a6', '#ffecc8', '#fff8e4'], far: '#f6dcb8', mid: '#d6e6a0', midTrim: '#b2d07e', edges: 'clover', props: ['tulip', 'flower', 'tuft', 'bush'] } },
      { name: 'Blossom Boughs', from: 560, color: '#e06fa6', look: { sky: ['#ffb0d0', '#ffd2e6', '#fff0f6'], far: '#f6c2da', mid: '#f0b6d2', midTrim: '#e08cba', islands: 'planks', props: ['flower', 'tuft'] } },
      { name: 'Petal Clouds', from: 320, color: '#8fa8f0', look: { sky: ['#b8dcff', '#e0f0ff', '#fff6fc'], far: '#e8e6ff', mid: '#f4eaff', midTrim: '#d8ccf6', material: 'sky', edges: null, props: ['flower'] } },
    ],
    // (In the east corner the lily pond is sunk into the meadow between two low stone lips.)
    terrain: [[0, 1000], [560, 1000], [640, 976], [1180, 976], [1260, 1000], [2140, 1000], [2140, 992], [2172, 992], [2200, 1036], [2280, 1036], [2308, 992], [2340, 992], [2340, 1000], [2400, 1000]],
    water: [{ x1: 2172, x2: 2308, y: 1010, kind: 'pond' }],
    platforms: [
      // Petal Fields.
      { x: 180, y: 920, w: 880 }, { x: 1300, y: 920, w: 880 },
      { x: 560, y: 840, w: 1280 },
      // Beehive Banks: an open middle to drop back down through.
      { x: 100, y: 760, w: 700 }, { x: 1600, y: 760, w: 700 },
      { x: 420, y: 680, w: 1560 },
      { x: 200, y: 600, w: 640 }, { x: 1560, y: 600, w: 640 },
      // Blossom Boughs.
      { x: 300, y: 520, w: 800 }, { x: 1300, y: 520, w: 800 },
      { x: 700, y: 440, w: 1000 },
      { x: 250, y: 360, w: 500 }, { x: 1650, y: 360, w: 500 },
      // Petal Clouds: two banks of cloud with a drifting one between, and the lookout on top.
      { x: 500, y: 280, w: 500 }, { x: 1400, y: 280, w: 500 },
      { x: 1000, y: 280, w: 150, drift: { dx: 250, period: 9 } },
      // The footbridge over the lily pond in the quiet east corner: the tortoises never cross the
      // pond's stone lips, so you can fish from it in peace.
      { x: 2172, y: 992, w: 136, style: 'planks', walkOn: true },
      { x: 900, y: 200, w: 400, thick: 44 },
    ],
    // A moving part per zone: bounce blossoms in the fields (one up the hill, one at the end of the
    // top floor, two floors high), the hive's warm pollen updraft on the banks, the petal whirl
    // round the cherry tree in the boughs, and the drifting cloud on top.
    // How its monsters live (world/habits.js): the tortoises doze (most of the night) and amble
    // over to the giant flower on the hill; the Bumbles buzz home to their hive and chase each other; the fox kits play
    // chase in the boughs and curl up at night; the Petal Sprites doze on the clouds at night.
    habitats: { snailbun: { naps: true, home: { x: 900, y: 976 } }, bumble: { home: { x: 1200, y: 680 }, play: true }, puffle: { naps: true, play: true }, petalsprite: { naps: true } },
    // The area boss (world/nest.js): after enough hunting, the Queen Bee bursts out of the hive.
    nest: { mob: 'queenbee', x: 1200, y: 680, kills: 150, name: 'The giant hive', wake: 'Her Majesty is NOT amused. Everyone to Beehive Banks!', stirs: ['The giant hive is buzzing...', 'The giant hive is shaking! Something big is waking up.'] },
    // The meadow's spirit floats by the cherry tree's crown when the map is calm (world/calm.js).
    spirit: { x: 1010, y: 380 },
    // At night (world/daytime.js) warm light glows at the arch, the picnic, the hive and the lookout.
    lamps: [{ x: 260, y: 950 }, { x: 2245, y: 930 }, { x: 1200, y: 640, c: '#ffd970' }, { x: 1100, y: 170 }],
    springs: [{ x: 1150, y: 976, up: 170, kind: 'blossom' }, { x: 1720, y: 840, up: 190, kind: 'blossom' }],
    updrafts: [
      { x: 1200, w: 50, top: 500, bottom: 680, kind: 'pollen' },
      { x: 1200, w: 60, top: 250, bottom: 440, kind: 'petals' },
    ],
    ropes: [
      { x: 200, top: 920, bottom: 1000, ladder: true }, { x: 2110, top: 920, bottom: 1000, ladder: true },
      { x: 600, top: 840, bottom: 920 }, { x: 1800, top: 840, bottom: 920 },
      { x: 760, top: 760, bottom: 840 }, { x: 1640, top: 760, bottom: 840 },
      { x: 460, top: 680, bottom: 760 }, { x: 1960, top: 680, bottom: 760 },
      { x: 800, top: 600, bottom: 680 }, { x: 1600, top: 600, bottom: 680 },
      { x: 560, top: 520, bottom: 600 }, { x: 1900, top: 520, bottom: 600 },
      { x: 760, top: 440, bottom: 520 }, { x: 1640, top: 440, bottom: 520 },
      { x: 720, top: 360, bottom: 440 }, { x: 1680, top: 360, bottom: 440 },
      { x: 700, top: 280, bottom: 360 }, { x: 1700, top: 280, bottom: 360 },
      { x: 960, top: 200, bottom: 280, ladder: true },
    ],
    portals: [
      { id: 'west', x: 40, y: 1000, to: 'sprout', toPortal: 'east' },
      { id: 'east', x: 2340, y: 1000, to: 'meadow2', toPortal: 'west' },
      { id: 'north', x: 1220, y: 200, to: 'canyon', toPortal: 'south' },
    ],
    npcs: [],
    // A landmark per zone: the giant flower and the fishing pond in the fields, the hive on the banks, the
    // cherry tree's crown in the boughs, the cloud pillar by the lookout.
    deco: [
      ['flowerarch', 260], ['giantflower', 820, 0], ['picnic', 1650], ['signpost', 2060],
      ['beehive', 1200, 0, 680], ['giantflower', 300, 1, 760],
      ['sakura', 1200, 0, 440],
      ['cloudpillar', 880, 0, 280],
    ],
    spawns: [
      // Petal Fields: Moss Tortoises.
      ...[380, 1300, 1950].map((x) => ({ mob: 'snailbun', x, y: 1000 })),
      ...[760, 1060].map((x) => ({ mob: 'snailbun', x, y: 976 })),
      ...[400, 800, 1500, 1950].map((x) => ({ mob: 'snailbun', x, y: 920 })),
      ...[900, 1500].map((x) => ({ mob: 'snailbun', x, y: 840 })),
      // Beehive Banks: Bumbles round their hive.
      ...[350, 2000].map((x) => ({ mob: 'bumble', x, y: 760 })),
      ...[650, 950, 1450, 1750].map((x) => ({ mob: 'bumble', x, y: 680 })),
      ...[500, 1880].map((x) => ({ mob: 'bumble', x, y: 600 })),
      // Blossom Boughs: the Kitsune Kits' playground under the great tree.
      ...[620, 950, 1750].map((x) => ({ mob: 'puffle', x, y: 520 })),
      ...[900, 1500].map((x) => ({ mob: 'puffle', x, y: 440 })),
      ...[450, 1900].map((x) => ({ mob: 'puffle', x, y: 360 })),
      // Petal Clouds: Petal Sprites drifting, the lookout left quiet.
      ...[700, 850, 1500, 1700].map((x) => ({ mob: 'petalsprite', x, y: 280 })),
    ],
  },


  // Clover Hills is a surface-and-underground farm (data/climb.js lay(), zones by height): the
  // Farm Fields along the top, where the Scarecrow Imps stand and the Toadstool Goblins keep the
  // big barn (Old MacGoblin's nest), broken by holes into the Root Cellar below, where the
  // Mandrakes grow in the dark, the Kitchen Brownies keep house, and a quiet underground spring is
  // good for fishing; and the Hayloft Ridge above, where the Jackalopes play and the Wind Ferrets
  // dart. A hay bale bounces you up from the fields, chaff rises from the cellar through a hole,
  // and a ledge drifts along the ridge.
  meadow2: {
    id: 'meadow2', name: 'Clover Hills', theme: 'meadow', town: 'harbor', world: { x: 162, y: 196 },
    look: { sky: ['#5ec8ff', '#aee8ff', '#e8fff2'], far: '#9fdf9f', mid: '#6fcf7a', midTrim: '#4fae5f', rainbow: 0, material: 'farm', edges: 'clover', light: 'noon', drift: null, props: ['tuft', 'bush', 'rock', 'tuft', 'flower'] },
    ...lay({
      width: 2400, ground: 1000, by: 'y', quiet: [[40, 700, 160], [2340, 700, 160], [90, 1000, 320], [90, 1036, 320], [90, 920, 280], [90, 840, 280]],
      // The cellar's spring, sunk into its floor against the west wall behind a stone lip.
      terrain: [[0, 1036], [160, 1036], [196, 992], [230, 992], [230, 1000], [2400, 1000]],
      zones: [
        { name: 'Root Cellar', color: '#8a6a52', mobs: ['sproutling', 'brownie'], nodes: [SPOT.ore(1), SPOT.ore(1)],
          look: underground({ sky: ['#4a3a34', '#6a5248', '#8a6e5e'], far: '#5a463c', mid: '#6e5648', midTrim: '#8a6e58' }) },
        { name: 'Farm Fields', color: '#5fae5f', from: 780, mobs: ['strawimp', 'mushkin'], nodes: [SPOT.fruit(1, 'wild_strawberry'), SPOT.fiber(1), SPOT.herb(1, 'clover'), SPOT.fruit(1, 'wild_strawberry')] },
        { name: 'Hayloft Ridge', color: '#4f95e0', from: 660, mobs: ['piglet', 'kamaitachi'], nodes: [SPOT.honey(1), SPOT.wood(1), SPOT.night(1)],
          look: { sky: ['#4fb0ff', '#9fdcff', '#e8f8ff'], far: '#c8ecd0', mid: '#a8e0b0', midTrim: '#7fc88f', material: 'meadow', edges: 'flowers', props: ['flower', 'tuft', 'tulip'] } },
      ],
      ledges: [
        // The Farm Fields, with two holes into the cellar.
        { x: 0, y: 700, w: 700 }, { x: 800, y: 700, w: 900 }, { x: 1800, y: 700, w: 600 },
        // Shelves in the Root Cellar, and the dock at its underground spring.
        { x: 300, y: 920, w: 300 }, { x: 950, y: 920, w: 400 }, { x: 1900, y: 920, w: 300 },
        { x: 600, y: 840, w: 240 }, { x: 1400, y: 840, w: 260 },
        { x: 104, y: 992, w: 92, style: 'stone', walkOn: true },
        // The Hayloft Ridge, and the old tree's hilltop.
        { x: 250, y: 620, w: 300 }, { x: 1800, y: 620, w: 300 },
        { x: 550, y: 540, w: 300 }, { x: 1500, y: 540, w: 300 },
        { x: 900, y: 460, w: 600 }, { x: 1100, y: 380, w: 300, thick: 44 },
        // The ledge drifting along the ridge.
        { x: 860, y: 540, w: 120, drift: { dx: 500, period: 11 } },
      ],
    }),
    // A moving part per zone: chaff rising from the cellar through a hole (Up to ride it), a hay
    // bale bouncing you up from the fields, and the ledge drifting along the ridge.
    updrafts: [{ x: 750, w: 50, top: 670, bottom: 1000, kind: 'chaff' }],
    springs: [{ x: 1500, y: 700, up: 170, kind: 'hay' }],
    water: [{ x1: 0, x2: 196, y: 1010, kind: 'spring', open: [0] }],
    portals: [
      { id: 'west', x: 40, y: 700, to: 'meadow1', toPortal: 'east' },
      { id: 'east', x: 2340, y: 700, to: 'harbor', toPortal: 'west' },
    ],
    npcs: [],
    // A landmark per zone: the spring pool in the cellar, the scarecrow and the barn in the fields,
    // the old tree on the ridge.
    deco: [['scarecrow', 400, 0, 700], ['barn', 1200, 0, 700], ['haystack', 900, 0, 700], ['fence', 1600, 1, 700], ['cart', 2000, 0, 700], ['signpost', 2200, 0, 700], ['beehive', 1900, 0, 620], ['bigtree', 1200, 1, 460]],
    lamps: [{ x: 110, y: 930 }, { x: 1200, y: 650 }, { x: 1250, y: 340 }],
    spirit: { x: 1700, y: 420 },
    // The area boss (world/nest.js): after enough hunting, Old MacGoblin storms out of the barn.
    nest: { mob: 'macgoblin', x: 1200, y: 700, kills: 150, name: 'The big barn', wake: 'GET OFF MY LAND! Everyone to the barn!', stirs: ['Something is stomping around in the big barn...', 'The barn doors rattle! Someone is VERY grumpy.'] },
    habitats: { sproutling: { naps: true, home: { x: 1100, y: 1000 } }, brownie: { home: { x: 1100, y: 1000 } }, strawimp: { naps: true }, mushkin: { naps: true, home: { x: 1200, y: 700 } }, piglet: { play: true, naps: true }, kamaitachi: { play: true } },
  },



  // Pastel Harbor (rebuilt 2026-11-03): the thieves' home port at dusk, round one landmark, a great
  // pastel galleon moored at the docks with its sails furled (no wind to sail by). Left to right:
  // the Fish Market (Marlo's cart and a fish stall among tall canal houses); Harbor Square, a
  // gentle step up, with the fountain, the Harbor Office, the Party Board, the stove and the craft
  // workshop; Dancers' Alley under washing lines (Vex's Wind Dance Hall, and the warehouse you can climb); then
  // the Docks: a boardwalk pier with rowboats (fishing off its end) and the galleon, whose stern
  // deck, main deck and crow's nest you can climb, up its gangway ladder.
  harbor: {
    id: 'harbor', plaza: 900, name: 'Pastel Harbor', theme: 'harbor', isTown: true, town: 'harbor', job: 'thief', world: { x: 222, y: 206 },
    // The town stove (data/cooking.js) and the craft bench (data/crafting.js) in its workshop.
    stove: 700,
    bench: 1180,
    workshed: true,
    width: 2900, height: 520, groundY: 480,
    look: { islands: 'planks', propKeep: 0.8 },
    terrain: [[0, 480], [760, 480], [800, 460], [1240, 460], [1280, 480], [2900, 480]],
    homeStyle: 'canal',
    // Canal houses wall to wall, each with its own gable, and the warehouse (render/townhouses.js).
    cottages: [[150, 'canal-neck'], [234, 'canal-bell'], [1420, 'canal-bell'], [1775, 'warehouse']],
    townPieces: [['fishstall', 470], ['pier', 2080]],
    // The Docks lie on the sea (render/quay.js): the walkway is the quay, the sea beyond its kerb,
    // the galleon and the rowboats riding in it, the pier's legs standing in it.
    quay: { x1: 1880, x2: 2900, sea: 30, kerb: 'wood', piles: [1905, 2745], under: [[1932, 2228]],
      boats: [{ kind: 'rowboat', x: 2276, color: '#8fd3ff' }, { kind: 'galleon', x: 2520 }, { kind: 'steamer', x: 2830 }] },
    platforms: [
      // The warehouse's loading gallery and its roof (drawn with the warehouse).
      { x: 1661, y: 400, w: 228, bare: true }, { x: 1680, y: 320, w: 190, bare: true },
      // The pier's deck.
      { x: 1932, y: 426, w: 296, bare: true },
      // The galleon: its stern deck, main deck and crow's nest (drawn with the ship).
      { x: 2330, y: 352, w: 110, bare: true }, { x: 2446, y: 392, w: 238, bare: true }, { x: 2530, y: 272, w: 40, bare: true },
    ],
    ropes: [
      // The gangway up to the stern deck, and the line up the mainmast to the crow's nest.
      { x: 2322, top: 352, bottom: 480, ladder: true },
      { x: 2550, top: 272, bottom: 392 },
    ],
    portals: [
      { id: 'start', x: 900, y: 460, hidden: true },
      { id: 'west', x: 40, y: 480, to: 'meadow2', toPortal: 'east' },
      { id: 'east', x: 2868, y: 480, to: 'woods', toPortal: 'west' },
    ],
    npcs: [{ id: 'marlo', x: 340 }, { id: 'posy', x: 870 }, { id: 'rook', x: 1060 }, { id: 'vex', x: 1560 }],
    // Its districts, left to right, each named as you walk in (the town rules).
    zonesBy: 'x',
    zones: [
      { name: 'Fish Market', from: 0, color: '#6aa8d8' },
      { name: 'Harbor Square', from: 760, color: '#ffb38a', look: { sky: ['#ffd8c0', '#ffe8d8', '#fff4ea'] } },
      { name: "Dancers' Alley", from: 1280, color: '#8f6cc4', look: { sky: ['#c8b8e8', '#e0d4f4', '#f6f0ff'] } },
      { name: 'The Docks', from: 1930, color: '#4fb0d8', look: { sky: ['#a8dcff', '#d0ecff', '#f2fbff'] } },
    ],
    // Lamps that glow at night (world/daytime.js): the market, the square, the alley, the pier, the ship.
    lamps: [{ x: 330, y: 440 }, { x: 700, y: 440 }, { x: 1060, y: 420 }, { x: 1320, y: 430 }, { x: 2000, y: 400 }, { x: 2120, y: 400 }, { x: 2390, y: 330 }],
    deco: [['alleylamp', 1320], ['laundryline', 1470]],
    spawns: [],
  },


  // Mossy Woods is a surface-and-underground map (data/climb.js lay(), zones by height): the Forest
  // Floor is a long walk through the trees, broken by holes where the roots have fallen in; below it
  // run the Root Tunnels, the Wargs' warrens, lit by glowing spores that rise up through the holes;
  // and above it the Treetops, where the old Treants doze, with a log drifting between the boughs
  // and, on the highest one, the way on to the Whispering Glade. A bouncy mushroom on the floor
  // springs you up into the trees.
  woods: {
    id: 'woods', name: 'Mossy Woods', theme: 'forest', town: 'harbor', world: { x: 254, y: 166 },
    look: { sky: ['#8fd6a8', '#c6ecc9', '#f2f8d6'], far: '#7fc79a', mid: '#5aa878', islands: 'branch', edges: 'glowcaps' },
    ...lay({
      width: 2200, ground: 1000, by: 'y', quiet: [[40, 680, 160], [2140, 680, 160], [1250, 440, 220]],
      zones: [
        { name: 'Root Tunnels', color: '#8a6656', mobs: ['boarlet', 'leafling'], nodes: [SPOT.ore(2), SPOT.ore(2)],
          look: underground({ sky: ['#2e3e36', '#46584a', '#62765e'], far: '#3a4c40', mid: '#4a5e4e', midTrim: '#6a8a6a' }) },
        { name: 'Forest Floor', color: '#4f9e55', from: 760, mobs: ['leafling', 'boarlet'], nodes: [SPOT.herb(2, 'chanterelle'), SPOT.wood(2), SPOT.fiber(2)] },
        { name: 'Treetops', color: '#3f9a7a', from: 640, mobs: ['mossgolem', 'leafling'], nodes: [SPOT.honey(2), SPOT.wood(2), SPOT.night(2)],
          look: { sky: ['#a8e0c0', '#d8f2d8', '#fbfbe6'], far: '#9fd8b0', mid: '#7fc898' } },
      ],
      ledges: [
        // The Forest Floor: a long walk with two holes fallen through to the tunnels.
        { x: 0, y: 680, w: 600 }, { x: 700, y: 680, w: 700 }, { x: 1500, y: 680, w: 700 },
        // Root shelves down in the tunnels.
        { x: 150, y: 920, w: 300 }, { x: 900, y: 920, w: 400 }, { x: 1700, y: 920, w: 300 },
        { x: 480, y: 840, w: 260 }, { x: 1280, y: 840, w: 300 },
        // The Treetops, and the highest bough with the way to the glade.
        { x: 200, y: 600, w: 300 }, { x: 900, y: 600, w: 400 }, { x: 1700, y: 600, w: 300 },
        { x: 500, y: 520, w: 300 }, { x: 1300, y: 520, w: 300 },
        { x: 850, y: 440, w: 500, thick: 44 },
        // A twig off to the side of the highest bough, half hidden in the leaves, where the Ivy Gecko
        // suns itself (the map's secret: a mount, data/mounts.js).
        { x: 1450, y: 432, w: 76 },
        // The log drifting between the boughs.
        { x: 810, y: 520, w: 120, style: 'planks', drift: { dx: 360, period: 10 } },
      ],
    }),
    // A moving part per zone: glowing spores rising from the tunnels up through a hole (Up to ride
    // them), a bouncy mushroom on the floor, and the drifting log in the treetops.
    updrafts: [{ x: 650, w: 56, top: 650, bottom: 1000, kind: 'spores' }],
    springs: [{ x: 1100, y: 680, up: 170, kind: 'shroom' }],
    portals: [
      { id: 'west', x: 40, y: 680, to: 'harbor', toPortal: 'east' },
      { id: 'east', x: 2140, y: 680, to: 'grove', toPortal: 'west' },
    ],
    npcs: [],
    // A landmark per zone: the mushroom ring in the tunnels, the great trees and the hollow log on
    // the floor, the stump house on the highest bough.
    deco: [['mushring', 1100], ['bigtree', 380, 0, 680], ['hollowlog', 1000, 0, 680], ['giantshroom', 1900, 1, 680], ['stumphouse', 1050, 0, 440]],
    lamps: [{ x: 1100, y: 970 }, { x: 1050, y: 400 }, { x: 650, y: 980 }],
    spirit: { x: 1500, y: 400 },
    finds: [{ x: 1488, y: 432, mount: 'gecko', say: 'It scurried up your arm and settled on your shoulder.' }],
    habitats: { leafling: { naps: true }, boarlet: { play: true, naps: true, home: { x: 1100, y: 1000 } }, mossgolem: { naps: true } },
  },



  // Twilight Ruins is a descent into a sunken temple (data/climb.js lay(), zones by height): you
  // arrive on the Temple Roof, broken rooftops where the Imps nest and a vent bounces you up; drop
  // down through the Collapsed Halls, storeys whose floors have fallen through, where the Wisps
  // drift, a slab of stone floats across the gap and the way to the Fox Shrine Path leads off; to
  // the Sunken Crypt at the bottom, where the Dullahans keep their watch and the way on to Crystal
  // Cave runs underground. A great column of wisp-light rises from the crypt through every hole,
  // all the way back up to the roof (Up to ride it).
  ruins: {
    id: 'ruins', name: 'Twilight Ruins', theme: 'ruins', town: 'grove', world: { x: 322, y: 90 },
    look: { islands: 'stone' },
    ...lay({
      width: 2600, ground: 1120, by: 'y', quiet: [[40, 300, 160], [2380, 700, 200], [2540, 1120, 160]],
      zones: [
        { name: 'Sunken Crypt', color: '#5d5285', mobs: ['boneknight', 'wisp'], nodes: [SPOT.ore(2), SPOT.ore(2, { gem: 0.14 })],
          look: underground({ sky: ['#1e1a3a', '#2e2852', '#46406e'], far: '#2c2650', mid: '#3a3462', midTrim: '#5a5288', skyline: 'columns', drift: 'sparkle' }) },
        { name: 'Collapsed Halls', color: '#4f95e0', from: 800, mobs: ['wisp', 'gloombat'], nodes: [SPOT.herb(2, 'temple_mint'), SPOT.fiber(2), SPOT.wood(2)],
          look: { sky: ['#5a4a98', '#8a76c0', '#c8b8e8'] } },
        { name: 'Temple Roof', color: '#c84f8a', from: 440, mobs: ['gloombat'], nodes: [SPOT.herb(2, 'temple_mint'), SPOT.night(2)] },
      ],
      ledges: [
        // The Temple Roof, broken in the middle.
        { x: 0, y: 300, w: 900 }, { x: 1000, y: 340, w: 600 }, { x: 1700, y: 300, w: 900 },
        // The Collapsed Halls: two storeys with their floors fallen through.
        { x: 100, y: 520, w: 700 }, { x: 950, y: 520, w: 400 }, { x: 1500, y: 520, w: 900 },
        { x: 300, y: 700, w: 600 }, { x: 1100, y: 700, w: 500 }, { x: 1750, y: 700, w: 700 },
        // Shelves in the crypt.
        { x: 200, y: 900, w: 400 }, { x: 1000, y: 900, w: 500 }, { x: 1900, y: 900, w: 400 },
        // The slab of stone floating across the halls.
        { x: 1360, y: 620, w: 120, style: 'stone', drift: { dx: 300, period: 10 } },
      ],
    }),
    // A moving part per zone: a vent on the roof, the floating slab in the halls, and the column of
    // wisp-light rising from the crypt through every hole to the roof.
    updrafts: [{ x: 930, w: 50, top: 330, bottom: 1120, kind: 'wisplight' }],
    springs: [{ x: 1250, y: 340, up: 160, kind: 'gust' }],
    portals: [
      { id: 'west', x: 40, y: 300, to: 'grove', toPortal: 'east' },
      { id: 'east', x: 2540, y: 1120, to: 'cave', toPortal: 'west' },
    ],
    npcs: [],
    // A landmark per zone: pillars and a statue on the roof, the great arch in the halls, the
    // statues and arch of the crypt.
    deco: [['ruinpillar', 400, 0, 300], ['statue', 2100, 0, 300], ['ruinarch', 1150, 0, 520], ['ruinarch', 300], ['statue', 860], ['ruinpillar', 1660]],
    lamps: [{ x: 1150, y: 480 }, { x: 860, y: 1080 }, { x: 930, y: 1100 }],
    spirit: { x: 1300, y: 240 },
    habitats: { boneknight: { naps: true, home: { x: 860, y: 1120 } }, wisp: { play: true }, gloombat: { play: true, naps: true } },
  },



  // Crystal Cave is a cavern valley round an underground lake (data/climb.js lay(), zones side by
  // side): the Glowcap Terraces step down from the west, the Crystal Slimes' glowing shelves, where
  // the mine road home leaves and a vent bounces you up to a crystal ledge; the Underground Lake
  // lies at the bottom, the Rock Golems' shore, with a crystal raft ferrying across the water and
  // the gate to the Crystal Throne by the lake; and the Shade Spires climb out to the east, where
  // crystal dust floats you up to the ledge with the way to the Sky Garden, and the tunnel to
  // Serpent Springs leaves from the east rim.
  cave: {
    id: 'cave', name: 'Crystal Cave', theme: 'cave', town: 'grove', world: { x: 336, y: 148 },
    look: { ceiling: true },
    ...lay({
      width: 2600, ground: 1000, by: 'x',
      terrain: [[0, 600], [400, 600], [400, 720], [800, 720], [800, 880], [1000, 880], [1000, 944], [1600, 944], [1600, 880], [1800, 880], [1800, 720], [2200, 720], [2200, 600], [2600, 600]],
      // Ropes down each crystal step, hanging beside it from the top (and out of the lake).
      ropes: [{ x: 410, top: 600, bottom: 720 }, { x: 810, top: 720, bottom: 880 }, { x: 1010, top: 880, bottom: 944 }, { x: 1590, top: 880, bottom: 944 }, { x: 1790, top: 720, bottom: 880 }, { x: 2190, top: 600, bottom: 720 }],
      quiet: [[40, 600, 160], [500, 720, 160], [1300, 944, 320], [1300, 872, 120], [1300, 760, 200], [1700, 880, 120], [2100, 480, 160], [2540, 600, 160], [350, 440, 140], [1300, 600, 140], [2420, 420, 130]],
      zones: [
        { name: 'Glowcap Terraces', color: '#4fb0d8', from: 0, mobs: ['crystalslime', 'rockgolem'], nodes: [SPOT.ore(3), SPOT.herb(3, 'crystal_truffle')] },
        { name: 'Underground Lake', color: '#8a7ab0', from: 800, mobs: ['rockgolem', 'crystalslime', 'shade'], nodes: [SPOT.ore(3), SPOT.herb(3, 'crystal_truffle')] },
        { name: 'Shade Spires', color: '#5d5285', from: 1800, mobs: ['shade', 'rockgolem'], nodes: [SPOT.ore(3, { gem: 0.18 }), SPOT.herb(3, 'crystal_truffle')] },
      ],
      ledges: [
        // Glowcap Terraces: long crystal shelves over the steps, and the high ledges (rebuilt
        // 2026-11-05 wider and more of them, so the terraces hunt in a loop).
        { x: 40, y: 520, w: 330 }, { x: 200, y: 440, w: 380 }, { x: 440, y: 640, w: 320 }, { x: 470, y: 560, w: 300 }, { x: 600, y: 480, w: 240 },
        // The lake: crystal outcrops over each shore, an arch of crystal over the water, and the
        // crystal islet in the middle where you fish (only the raft goes there).
        { x: 820, y: 800, w: 300 }, { x: 1480, y: 800, w: 300 }, { x: 1150, y: 760, w: 300 },
        { x: 800, y: 640, w: 320 }, { x: 1480, y: 640, w: 320 }, { x: 1140, y: 600, w: 320 },
        { x: 860, y: 540, w: 260 }, { x: 1480, y: 540, w: 260 }, { x: 1100, y: 460, w: 400 },
        { x: 1140, y: 680, w: 320 },
        { x: 1245, y: 872, w: 110, style: 'stone' },
        // Shade Spires: spires climbing out, and the ledge with the way to the sky.
        { x: 1830, y: 640, w: 320 }, { x: 1820, y: 560, w: 260 }, { x: 2250, y: 520, w: 300 }, { x: 2280, y: 420, w: 280 },
        { x: 1900, y: 480, w: 280, thick: 44 },
        // The crystal raft ferrying across the lake, shore to shore past the islet.
        { x: 1000, y: 880, w: 130, style: 'stone', drift: { dx: 470, period: 14 } },
      ],
    }),
    // A moving part per zone: a vent on the terraces, the raft across the lake, and crystal dust
    // rising in the spires (Up to ride it).
    springs: [{ x: 620, y: 720, up: 170, kind: 'gust' }],
    updrafts: [{ x: 2100, w: 50, top: 450, bottom: 720, kind: 'wisplight' }],
    portals: [
      { id: 'west', x: 40, y: 600, to: 'ruins', toPortal: 'east' },
      { id: 'east', x: 2100, y: 480, to: 'sky', toPortal: 'west' },
      { id: 'boss', x: 1700, y: 880, to: 'bossroom', toPortal: 'west', label: 'Throne' },
      // The mine road back down to Sprout Village (the ring round the island).
      { id: 'sprout', x: 500, y: 720, to: 'sprout', toPortal: 'west', label: 'Sprout Village' },
    ],
    npcs: [],
    // A landmark per zone: glowing pools on the terraces, a great crystal by the throne's gate at
    // the lake, a crystal spire in the east.
    // The underground lake fills the cavern's floor, lit from below (render/water.js).
    water: [{ x1: 1000, x2: 1600, y: 900, kind: 'cave' }],
    deco: [['glowpool', 240, 0, 600], ['crystalspire', 1760, 1, 880], ['stalagmite', 900, 0, 880], ['crystalspire', 1940, 0, 720], ['stalagmite', 2400, 0, 600]],
    lamps: [{ x: 240, y: 580 }, { x: 1300, y: 850 }, { x: 2100, y: 440 }],
    spirit: { x: 1300, y: 640 },
    habitats: { crystalslime: { naps: true, home: { x: 240, y: 600 } }, rockgolem: { naps: true }, shade: { play: true } },
  },



  // Sky Garden is a chain of floating islands over a sea of cloud (a sky-islands layout, its zones
  // side by side, data/climb.js lay()): the Cloud Meadows in the west, low flowered islands where
  // the Pegasus Foals graze and a blossom bounces you up off the cloud sea; the Harpy Roost in the
  // middle, islands stacked round the cloud pillars, where a skyward wind lifts you; and the Starlit
  // Terrace in the east, the Star Seraphs' high islands, reached by a drifting cloud, with the way
  // up to Starfall Heights on the highest of them. Frozen Peak is down on the cloud sea's far end.
  sky: {
    id: 'sky', name: 'Sky Garden', theme: 'sky', town: 'grove', world: { x: 348, y: 36 },
    ...lay({
      width: 3000, ground: 1040, by: 'x', quiet: [[40, 1040, 160], [2940, 1040, 160], [2880, 320, 200], [2620, 1040, 260]],
      // In the quiet east corner the cloud parts on the open sky below: a gap to fish.
      terrain: [[0, 1040], [2496, 1040], [2524, 1078], [2616, 1078], [2644, 1040], [3000, 1040]],
      zones: [
        { name: 'Cloud Meadows', color: '#ff9ec7', from: 0, mobs: ['cloudsheep'], nodes: [SPOT.fruit(4, 'cloudberry'), SPOT.fiber(4)] },
        { name: 'Harpy Roost', color: '#4f95e0', from: 1000, mobs: ['windbird'], nodes: [SPOT.fruit(4, 'cloudberry'), SPOT.wood(4), SPOT.fiber(4)],
          look: { sky: ['#8fc8ff', '#c8e4ff', '#fff6ee'] } },
        { name: 'Starlit Terrace', color: '#e0b84a', from: 2050, mobs: ['starspirit'], nodes: [SPOT.herb(4, 'star_anise'), SPOT.wood(4), SPOT.night(4)],
          look: { sky: ['#6a6ad0', '#a8a0e8', '#fff0d8'], stars: true } },
      ],
      ledges: [
        // Cloud Meadows: low islands stepping up from the cloud sea.
        { x: 100, y: 960, w: 320 }, { x: 560, y: 960, w: 340 },
        { x: 260, y: 880, w: 360 },
        { x: 80, y: 800, w: 300 }, { x: 520, y: 800, w: 360 },
        { x: 300, y: 720, w: 340 },
        { x: 700, y: 640, w: 300 },
        // Harpy Roost: islands round the cloud pillars.
        { x: 1000, y: 720, w: 300 }, { x: 1250, y: 640, w: 300 },
        { x: 1050, y: 560, w: 300 },
        { x: 1400, y: 480, w: 300 },
        { x: 1750, y: 560, w: 300 },
        // Starlit Terrace: the high islands, the topmost with the way to Starfall.
        { x: 2100, y: 640, w: 300 }, { x: 2300, y: 560, w: 300 },
        { x: 2050, y: 480, w: 300 },
        { x: 2400, y: 400, w: 300 },
        { x: 2650, y: 320, w: 300, thick: 44 },
        // The drifting cloud from the roost over to the terrace.
        { x: 1710, y: 480, w: 140, drift: { dx: 200, period: 9 } },
        // A little cloud dock out over the gap in the quiet east corner, for fishing: no monster
        // drifts down to it.
        { x: 2570, y: 1040, w: 76, walkOn: true },
      ],
    }),
    // A moving part per zone: a blossom on the cloud sea bouncing you up into the meadows, a
    // skyward wind through the roost (Up to ride it), and the drifting cloud to the terrace.
    springs: [{ x: 470, y: 1040, up: 170, kind: 'blossom' }],
    updrafts: [{ x: 1450, w: 56, top: 450, bottom: 1040, kind: 'gust' }],
    water: [{ x1: 2496, x2: 2644, y: 1054, kind: 'cloud' }],
    portals: [
      { id: 'west', x: 40, y: 1040, to: 'cave', toPortal: 'east' },
      { id: 'peak', x: 2940, y: 1040, to: 'peak', toPortal: 'east', label: 'Frozen Peak' },
      { id: 'starfall', x: 2880, y: 320, to: 'starfall', toPortal: 'west', label: 'Starfall Heights' },
    ],
    npcs: [],
    // A landmark per zone: a giant flower in the meadows, the cloud pillars and the gazebo in the
    // roost, the gazebo on the terrace's high island.
    deco: [['giantflower', 450, 1, 880], ['cloudpillar', 1150, 0], ['cloudpillar', 1850, 1], ['skygazebo', 1200, 0, 560], ['skygazebo', 2750, 0, 320]],
    lamps: [{ x: 1200, y: 520 }, { x: 2750, y: 280 }, { x: 450, y: 840 }],
    spirit: { x: 2550, y: 260 },
    habitats: { cloudsheep: { naps: true, play: true }, windbird: { play: true }, starspirit: { naps: true } },
  },


  bossroom: {
    id: 'bossroom', name: 'Crystal Throne', theme: 'cave', town: 'grove', world: { x: 360, y: 186 },
    width: 1200, height: 420, groundY: 380,
    look: { sky: ['#1f1a4a', '#3a2f7a', '#5a47a6'], far: '#3f3480', mid: '#4f4296', material: 'throne', ceiling: true, light: 'throne', islands: 'stone', skyline: 'columns', aerial: 1.8 },
    platforms: [
      { x: 150, y: 290, w: 200 },
      { x: 850, y: 290, w: 200 },
    ],
    ropes: [{ x: 250, top: 290, bottom: 380, ladder: true }, { x: 950, top: 290, bottom: 380, ladder: true }],
    portals: [{ id: 'west', x: 60, y: 380, to: 'cave', toPortal: 'boss' }],
    npcs: [],
    deco: [['crystalspire', 420, 1], ['crystalspire', 760, 0], ['throne', 600]],
    spawns: [{ mob: 'crystalking', x: 560, y: 380, respawn: 300 }],
  },
};

// ---------- The warrior and mage homes, and the canyon road up to the warriors ----------

Object.assign(MAPS, {
  // Windy Canyon is a trek across, side by side (data/climb.js lay()): the West Mesa where you
  // arrive, the Basilisk Hatchlings' sunny plateau with a vent to bounce you up; the Gorge, a long
  // rope bridge swaying over a deep canyon whose floor below is the Hatchlings' and Manticore Cubs'
  // hunting ground, with the way into Rootwood Hollow down there and a gust to carry you back up to
  // the bridge; and the East Mesa, the Manticore Cubs' crags, with the windmill lookout high above
  // and the road on to Ember Crag beside it.
  canyon: {
    id: 'canyon', name: 'Windy Canyon', theme: 'crag', town: 'crag', world: { x: 138, y: 104 },
    ...lay({
      width: 2400, ground: 1000, by: 'x',
      terrain: [[0, 600], [700, 600], [700, 1000], [1700, 1000], [1700, 560], [2400, 560]],
      // Ropes down both canyon walls, hanging beside them from the top.
      ropes: [{ x: 710, top: 600, bottom: 1000 }, { x: 1690, top: 560, bottom: 1000 }],
      quiet: [[40, 600, 160], [1450, 1000, 200], [2130, 300, 200]],
      zones: [
        { name: 'West Mesa', color: '#c97a3a', from: 0, mobs: ['pebblet'], nodes: [SPOT.fruit(1, 'prickle_pear'), SPOT.ore(1)] },
        { name: 'The Gorge', color: '#b05a4a', from: 700, mobs: ['pebblet', 'scorpip'], nodes: [SPOT.ore(1), SPOT.ore(1, { gem: 0.12 })],
          look: { sky: ['#ffcf9e', '#ffe4c4', '#fff4e4'] } },
        { name: 'East Mesa', color: '#6a7ad0', from: 1700, mobs: ['scorpip'], nodes: [SPOT.fruit(1, 'prickle_pear'), SPOT.ore(1, { gem: 0.14 }), SPOT.ore(1, { gem: 0.3, night: true })],
          look: { sky: ['#9fc8ff', '#cfe4ff', '#fff0e0'] } },
      ],
      ledges: [
        // The West Mesa's rocks, stacked up to a high shelf.
        { x: 150, y: 520, w: 300 }, { x: 470, y: 520, w: 220 }, { x: 300, y: 440, w: 280 },
        // The rope bridge over the gorge, and ledges down both its walls to hunt round.
        { x: 700, y: 600, w: 990, style: 'bridge' },
        { x: 750, y: 900, w: 260 }, { x: 1450, y: 880, w: 220 }, { x: 900, y: 790, w: 240 }, { x: 1300, y: 770, w: 240 },
        { x: 1100, y: 880, w: 260 }, { x: 760, y: 700, w: 240 }, { x: 1420, y: 680, w: 240 },
        // The East Mesa's crags and the windmill lookout.
        { x: 1900, y: 460, w: 300 }, { x: 2160, y: 380, w: 230 }, { x: 2000, y: 300, w: 260, thick: 44 },
      ],
    }),
    // A moving part per zone: a vent on the west mesa, a gust from the gorge floor back up to the
    // bridge (Up to ride it), and a vent on the east mesa up to the crags.
    springs: [{ x: 400, y: 600, up: 175, kind: 'gust' }, { x: 1960, y: 560, up: 120, kind: 'gust' }],
    updrafts: [{ x: 1100, w: 54, top: 570, bottom: 1000, kind: 'gust' }],
    portals: [
      { id: 'south', x: 40, y: 600, to: 'meadow1', toPortal: 'north' },
      { id: 'north', x: 2200, y: 300, to: 'crag', toPortal: 'south' },
    ],
    npcs: [],
    // A landmark per zone: the mesa rock and the camp tent in the west, the old bones and the totem
    // on the gorge floor, the windmill on the lookout.
    deco: [['mesa', 550], ['tent', 300, 0, 520], ['bones', 790], ['totem', 1300], ['signpost', 2300, 0, 560], ['windmillcrag', 2100, 0, 300]],
    lamps: [{ x: 300, y: 480 }, { x: 1000, y: 970 }, { x: 2100, y: 260 }],
    spirit: { x: 1200, y: 500 },
    habitats: { pebblet: { naps: true, home: { x: 1000, y: 1000 } }, scorpip: { play: true, naps: true } },
  },



  // Ember Crag (rebuilt 2026-11-03): the warriors' home under the mesas, round one landmark, the
  // Great Forge, whose giant bellows hang slack (no wind to work them) so its fire burns low. Left
  // to right: the Training Yard (dummies and a totem) by the canyon road, with a sandstone house;
  // the Arena Plateau, a step up, with the Warrior Hall, the Party Board and the sparring arena;
  // then Forge Row: Tora's Forge, the stove, the craft bench and the Great Forge, whose roof
  // terrace (up its ladder) and chimney lookout you can climb, out to the Moonlit Ridge road.
  crag: {
    // (Its plaza's centrepiece is the hearth, a great fire-bowl, not a fountain.)
    id: 'crag', plaza: 1300, fountain: false, name: 'Ember Crag', theme: 'crag', isTown: true, town: 'crag', job: 'warrior', world: { x: 196, y: 50 },
    // The town stove, for cooking (data/cooking.js).
    stove: 1600,
    // The craft bench (data/crafting.js), on Forge Row, by Tora's forge.
    bench: 1858,
    width: 2600, height: 520, groundY: 480,
    look: { propKeep: 0.8 },
    terrain: [[0, 480], [620, 480], [660, 456], [1500, 456], [1540, 480], [2600, 480]],
    homeStyle: 'adobe',
    // Two sandstone houses (each flat roof a ledge up the ladder at its side), the sparring arena,
    // and the Great Forge (render/townhouses.js).
    cottages: [530, 1400],
    townPieces: [['arena', 1080], ['greatforge', 2150]],
    platforms: [
      // The houses' flat roofs (their own art: nothing drawn for them), up the ladders.
      { x: 482, y: 360, w: 96, bare: true }, { x: 1352, y: 336, w: 96, bare: true },
      // The Great Forge's roof terrace and its chimney lookout (drawn with the forge).
      { x: 2030, y: 362, w: 176, bare: true }, { x: 2200, y: 244, w: 58, bare: true },
    ],
    ropes: [
      { x: 490, top: 360, bottom: 480, ladder: true }, { x: 1360, top: 336, bottom: 456, ladder: true },
      { x: 2034, top: 362, bottom: 480, ladder: true }, { x: 2202, top: 244, bottom: 362, ladder: true },
    ],
    portals: [
      { id: 'start', x: 960, y: 456, hidden: true },
      { id: 'south', x: 60, y: 480, to: 'canyon', toPortal: 'north' },
      { id: 'ridge', x: 2540, y: 480, to: 'ridge', toPortal: 'west', label: 'Moonlit Ridge' },
    ],
    npcs: [{ id: 'brann', x: 780 }, { id: 'posy', x: 1215 }, { id: 'tora', x: 1720 }],
    // Its districts, left to right, each named as you walk in (the town rules).
    zonesBy: 'x',
    zones: [
      { name: 'Training Yard', from: 0, color: '#c97a3a' },
      { name: 'Arena Plateau', from: 640, color: '#d0504a', look: { sky: ['#ffc8a0', '#ffe0c4', '#fff2e2'] } },
      { name: 'Forge Row', from: 1520, color: '#e0703a', look: { sky: ['#ffb890', '#ffd8b8', '#fff0e0'] } },
    ],
    // Lamps that glow at night (world/daytime.js): the yard, the arena's braziers, the forge.
    lamps: [{ x: 300, y: 440 }, { x: 900, y: 420 }, { x: 1260, y: 420 }, { x: 1720, y: 440, c: '#ffb070' }, { x: 2340, y: 440 }, { x: 2229, y: 220, c: '#ffb070' }],
    deco: [['totem', 160], ['dummy', 300], ['dummy', 380], ['weaponrack', 450], ['brazier', 900], ['emberhearth', 1300]],
    spawns: [],
  },


  // Moonleaf Grove (rebuilt 2026-11-03): the mages' home in a starry night wood, round one
  // landmark, the Starchime Tower, whose crystal wind chimes hang silent (no wind to ring them).
  // Left to right: Lantern Lane by the woods road, with a tree home, Nim's spell shop and a
  // glowcap home; the raised Moon Tree Plaza under the great lantern tree (its bough a ledge, up its
  // rope); then the Rune Garden: the rune circle and its moonstones, and the Starchime Tower, whose
  // balcony and top deck (up the ladders at its side) you can climb, by the root gate to the ruins.
  grove: {
    // (Its plaza's centrepiece is the moon dial, a rune stone under a floating moon crystal.)
    id: 'grove', plaza: 1240, fountain: false, name: 'Moonleaf Grove', theme: 'grove', isTown: true, town: 'grove', job: 'mage', world: { x: 290, y: 122 },
    // The town stove, for cooking (data/cooking.js).
    stove: 820,
    // The craft bench (data/crafting.js), on the plaza, under the moon tree's boughs.
    bench: 1000,
    width: 2400, height: 520, groundY: 480,
    look: { islands: 'planks', edges: 'glowcaps', propKeep: 0.8 },
    terrain: [[0, 480], [860, 480], [900, 456], [1340, 456], [1380, 480], [2400, 480]],
    homeStyle: 'treehome',
    // A tree home and a glowcap home on Lantern Lane, the moon tree, and the Starchime Tower
    // (render/townhouses.js).
    cottages: [180, [712, 'mushhome']],
    townPieces: [['moontree', 1110], ['starchime', 2020]],
    platforms: [
      // A bough of the moon tree.
      { x: 1006, y: 324, w: 92, bare: true },
      // The Starchime Tower's balcony and its top deck (drawn with the tower).
      { x: 1938, y: 350, w: 164, bare: true }, { x: 1960, y: 250, w: 120, bare: true },
    ],
    ropes: [
      { x: 1086, top: 324, bottom: 456 },
      { x: 1946, top: 350, bottom: 480, ladder: true }, { x: 2074, top: 250, bottom: 350, ladder: true },
    ],
    portals: [
      { id: 'start', x: 1240, y: 456, hidden: true },
      { id: 'west', x: 40, y: 480, to: 'woods', toPortal: 'east' },
      { id: 'east', x: 2340, y: 480, to: 'ruins', toPortal: 'west' },
    ],
    npcs: [{ id: 'nim', x: 600 }, { id: 'posy', x: 1300 }, { id: 'elowen', x: 1500 }],
    // Its districts, left to right, each named as you walk in (the town rules).
    zonesBy: 'x',
    zones: [
      { name: 'Lantern Lane', from: 0, color: '#bfe6ff' },
      { name: 'Moon Tree Plaza', from: 880, color: '#c9a6ff', look: { sky: ['#8a7ad0', '#b8a8e8', '#e8e0ff'] } },
      { name: 'Rune Garden', from: 1380, color: '#9fe0b0', look: { sky: ['#7ac8b0', '#a8e0d0', '#e0f8ee'] } },
    ],
    // Lamps that glow at night (world/daytime.js): the lane, the moon tree, the rune circle, the
    // tower's windows and its moon crystal.
    lamps: [{ x: 300, y: 440 }, { x: 760, y: 440 }, { x: 1110, y: 400, c: '#e6dcff' }, { x: 1740, y: 440, c: '#bfe6ff' }, { x: 2020, y: 400 }, { x: 2020, y: 210, c: '#bfe6ff' }],
    deco: [['moondial', 1232], ['moonstone', 1620], ['runecircle', 1740], ['moonstone', 1860], ['rootgate', 2290]],
    spawns: [],
  },

});

// ---------- Lantern Lagoon: the fishing town you sail to from Pastel Harbor ----------
// Off the world map, across the sea: you get there on Captain Bobbin's little paddle steamer, the
// Sea Biscuit (world/voyage.js), which runs on steam, not wind, so it still sails. A cozy island
// village with no monsters at all, only fishing. Left to right and low to high: Shell Cove, a
// sandy beach where the steamer moors in the surf, with rock pools to fish; stairs up to the Stilt
// Village, a lantern-strung boardwalk over the turquoise lagoon (the water and the stilts show
// beneath its planks: render/lagoon.js), with Mister Brine's tackle shop, Lantern Square and
// Nori's derby board, a bridge and net lofts overhead, and the twins' noodle stall; then a ladder
// up the cliff to Lighthouse Point, where Granny Kelp keeps the light (its gallery you can climb)
// and the deep water off the point holds the biggest fish.
Object.assign(MAPS, {
  lagoon: {
    id: 'lagoon', plaza: 1200, fountain: false, name: 'Lantern Lagoon', theme: 'harbor', isTown: true, town: 'lagoon', music: 'lagoon',
    // The noodle stall's stove, for cooking your catch (data/cooking.js).
    stove: 1580,
    width: 2400, height: 760, groundY: 620,
    look: { sky: ['#ffb8a8', '#ffd8c0', '#fff0e0'], far: '#8fd8e0', mid: '#bfe8d8', midTrim: '#8fd0c0', skyline: 'lagoon', islands: 'planks', material: 'beach', propKeep: 0.75 },
    // (The cove's sand runs down into the sea at the west end, and the tide pool is sunk in it.)
    terrain: [[0, 746], [90, 746], [172, 700], [345, 700], [357, 714], [458, 714], [470, 700], [500, 700], [620, 620], [1880, 620], [1880, 440], [2400, 440]],
    // The sea lapping up the cove's sand, where the Sea Biscuit rides, and the tide pool.
    water: [{ x1: 0, x2: 174, y: 708, kind: 'sea', sunk: false, open: [0, 174] }, { x1: 345, x2: 470, y: 704, kind: 'sea', sunk: false }],
    // The lagoon under the boardwalk and the sea at the foot of the point (render/lagoon.js draws
    // them, with the stilts, the stairs and the cliff).
    lagoon: { cove: [0, 640], deck: [620, 1880], cliff: [1880, 2400], sea: [2300, 2400], seaTop: 520 },
    // Where the other players stroll: the cove and the boardwalk (the point is up a cliff).
    walkSpan: [150, 1850],
    cottages: [],
    townPieces: [['palm', 170, 1], ['palm', 520, -1], ['beachspot', 316], ['sandcastle', 286], ['steamer', 70], ['rockpools', 420], ['lookout', 1970], ['stilthouse', 760], ['tackleshop', 880], ['stilthouse', 1040], ['lanternpole', 1200], ['derbyboard', 1260], ['stilthouse', 1360], ['noodlestall', 1530], ['stilthouse', 1720], ['lighthouse', 2080]],
    platforms: [
      // The Lantern Bridge between two stilt houses, a net loft, and a rooftop deck.
      { x: 975, y: 486, w: 130, bare: true }, { x: 1300, y: 500, w: 126, bare: true }, { x: 1650, y: 470, w: 140, bare: true },
      // The top of the cliff ladder, and the lighthouse's gallery.
      { x: 1844, y: 440, w: 34, bare: true }, { x: 2030, y: 262, w: 100, bare: true },
    ],
    ropes: [
      { x: 990, top: 486, bottom: 620 }, { x: 1412, top: 500, bottom: 620 }, { x: 1662, top: 470, bottom: 620 },
      { x: 1866, top: 440, bottom: 620, ladder: true }, { x: 2118, top: 262, bottom: 440, ladder: true },
    ],
    portals: [
      { id: 'start', x: 1200, y: 620, hidden: true },
      // Where the Sea Biscuit puts you ashore; Captain Bobbin sails you back (a sea road for the
      // guide: world/routes.js).
      { id: 'pier', x: 260, y: 700, hidden: true, to: 'harbor', toPortal: 'ferry', ferry: true },
    ],
    npcs: [{ id: 'bobbin', x: 220 }, { id: 'brine', x: 880 }, { id: 'nori', x: 1200 }, { id: 'coral', x: 1520 }, { id: 'kelp', x: 2255 }],
    zonesBy: 'x',
    zones: [
      { name: 'Shell Cove', from: 0, color: '#ffd6a0' },
      { name: 'Stilt Village', from: 580, color: '#5fd0c8', look: { sky: ['#ffb0b8', '#ffd0c8', '#fff0e6'] } },
      { name: 'Lighthouse Point', from: 1880, color: '#8fa8ff', look: { sky: ['#a8c0ff', '#d0dcff', '#f4f6ff'] } },
    ],
    // Lanterns that glow at night (world/daytime.js): the cove, the boardwalk's strings, the
    // square's pole, the stall, the lighthouse's lamp.
    lamps: [{ x: 300, y: 660 }, { x: 700, y: 580 }, { x: 1000, y: 470 }, { x: 1200, y: 540, c: '#ffd27a' }, { x: 1530, y: 560, c: '#ffb070' }, { x: 1760, y: 450 }, { x: 2080, y: 150, c: '#fff3a6' }],
    deco: [],
    spawns: [],
  },
  // The voyage there and back on the Sea Biscuit: the steamer's deck is the map, and the sea runs
  // past (render/lagoon.js). No monsters; fish off the stern while you sail. world/voyage.js
  // brings you in to port after `dur` seconds.
  ...Object.fromEntries([['voyage_out', 'lagoon', 'pier', 'To Lantern Lagoon'], ['voyage_home', 'harbor', 'ferry', 'To Pastel Harbor'], ['voyage_isle', 'home', 'dock', 'To Your Island']].map(([id, to, toPortal, name]) => [id, {
    id, name: `The Sea Biscuit: ${name}`, theme: 'harbor', town: to === 'home' ? 'harbor' : to, music: 'voyage',
    voyage: { to, toPortal, dur: id === 'voyage_isle' ? 30 : 55, ...(id === 'voyage_isle' ? { calls: 'isle' } : {}) },
    width: 760, height: 520, groundY: 420,
    look: { sky: ['#9fd8ff', '#cdeeff', '#f2fbff'], far: '#a8e0f0', mid: '#bfe8f6', midTrim: '#9fd8e8', skyline: 'opensea', islands: 'planks', material: 'parquet', propKeep: 1 },
    terrain: [[0, 420], [760, 420]],
    platforms: [{ x: 470, y: 330, w: 120, bare: true }],
    ropes: [{ x: 480, top: 330, bottom: 420, ladder: true }],
    portals: [{ id: 'deck', x: 380, y: 420, hidden: true }],
    npcs: [{ id: 'bobbin', x: 690 }],
    deco: [],
    spawns: [],
  }])),
});
// Captain Bobbin waits at the end of Pastel Harbor's quay with the Sea Biscuit.
MAPS.harbor.npcs.push({ id: 'bobbin', x: 2768 });
MAPS.harbor.portals.push({ id: 'ferry', x: 2768, y: 480, hidden: true, to: 'lagoon', toPortal: 'pier', ferry: true });
MAPS.harbor.townPieces.push(['ferryjetty', 2815]);

// Towns in world-map order, for fast travel.
export const TOWNS = ['sprout', 'harbor', 'crag', 'grove'];

// ---------- Dawnlight Isle: the tutorial island (world/tutorial.js walks you through it) ----------
// Three small maps, west to east: the beach you wake up on (ledges to jump to and a rope to
// climb), the practice field (a few harmless Kitsune Kits), and the dock with the boat to Sprout
// Village. Kuro, a young tengu, waits on each to show you the next thing. None of it is on the
// world map: the island is off the coast.
Object.assign(MAPS, {
  dawnbeach: {
    id: 'dawnbeach', name: 'Dawnlight Beach', theme: 'harbor', town: 'sprout',
    width: 1500, height: 560, groundY: 480,
    look: { sky: ['#ffc9a8', '#ffe6cc', '#fff6e6'], far: '#ffd9c2', mid: '#ffe8c4', midTrim: '#f2cfa0', light: 'morning', skyline: 'opensea', islands: 'planks', material: 'sand' },
    // The sand runs down into the sea at the west end, where a little jetty reaches out.
    terrain: [[0, 556], [150, 556], [270, 480], [1500, 480]],
    water: [{ x1: 0, x2: 272, y: 492, kind: 'sea', sunk: false, open: [0, 272] }],
    platforms: [{ x: 520, y: 432, w: 140 }, { x: 760, y: 360, w: 220 }, { x: 96, y: 474, w: 176, style: 'planks', walkOn: true }],
    ropes: [{ x: 800, top: 360, bottom: 480 }],
    portals: [
      { id: 'start', x: 330, y: 480, hidden: true },
      { id: 'east', x: 1440, y: 480, to: 'trainfield', toPortal: 'west', label: 'Practice Field' },
    ],
    npcs: [{ id: 'kuro', x: 1120 }],
    deco: [['crates', 420], ['barrels', 470], ['signpost', 1360]],
    spawns: [],
  },
  trainfield: {
    id: 'trainfield', name: 'Practice Field', theme: 'meadow', town: 'sprout',
    width: 1600, height: 560, groundY: 480,
    look: { sky: ['#ffc6dd', '#ffe3d8', '#fff6e6'], far: '#f3d3e8', mid: '#bfe8b8', midTrim: '#8fd39a', light: 'morning', edges: 'flowers', props: ['flower', 'tulip', 'tuft'] },
    terrain: [[0, 480], [1600, 480]],
    platforms: [],
    ropes: [],
    portals: [
      { id: 'west', x: 40, y: 480, to: 'dawnbeach', toPortal: 'east' },
      { id: 'east', x: 1540, y: 480, to: 'dock', toPortal: 'west', label: 'Sunny Dock' },
    ],
    npcs: [{ id: 'kuro', x: 260 }],
    deco: [['scarecrow', 520], ['fence', 1100], ['signpost', 1500]],
    spawns: [{ mob: 'puffle', x: 640, y: 480 }, { mob: 'puffle', x: 860, y: 480 }, { mob: 'puffle', x: 1060, y: 480 }, { mob: 'puffle', x: 1280, y: 480 }],
  },
  dock: {
    id: 'dock', name: 'Sunny Dock', theme: 'harbor', town: 'sprout',
    width: 1300, height: 560, groundY: 480,
    look: { islands: 'planks' },
    terrain: [[0, 480], [1300, 480]],
    platforms: [],
    ropes: [],
    portals: [
      { id: 'west', x: 40, y: 480, to: 'trainfield', toPortal: 'east' },
      { id: 'boat', x: 1180, y: 480, to: 'sprout', toPortal: 'start', label: 'Boat to Sprout Village' },
    ],
    npcs: [{ id: 'kuro', x: 760 }],
    deco: [['crates', 220], ['barrels', 420], ['lighthouse', 1240]],
    // The boat to Sprout Village rides at the quay (render/quay.js).
    quay: { x1: 560, x2: 1300, sea: 26, kerb: 'wood', piles: [640, 1130], boats: [{ kind: 'ship', x: 960 }] },
    spawns: [],
  },
});

export function getMap(id) {
  return MAPS[id] ?? MAPS.sprout;
}

// ---------- Rootwood Hollow: the gate off Windy Canyon, and the dungeon's six rooms ----------
//
// Dungeon rooms (`dungeon` set) hold exactly the monsters listed (no copies, no respawns).
// Monsters sharing a `pack` fight together. A `sealed` portal opens once the room is cleared:
// every monster down and the room's `task` done. `objects` are things to use with Up:
// glowcaps to light, and cages to open.
//
// Each room has an idea of its own (world/dungeon.js runs them):
//   dark       the room is pitch black but for the group and the glowcaps they light
//   bouncers   giant bounce mushrooms that launch whoever steps on them up to the high ledges
//   rootfall   roots drop from the low ceiling during fights (step out of their shadows)
//   pillars    stone pillars a charging boss smashes into (and is dazed by)
//   flood      sap surges over the floor now and then: get up on a ledge

const G = 380; // every room's floor
const pack = (id, x, ...mobs) => mobs.map((mob, i) => ({ mob, x: x + (i - (mobs.length - 1) / 2) * 34, y: G, pack: id }));
// What every Hollow room's backdrop shares: root silhouettes, the hollow's own earth, fireflies.
const ROOTS = { skyline: 'roots', material: 'hollow', critters: ['firefly'] };
const packAt = (id, x, y, ...mobs) => mobs.map((mob, i) => ({ mob, x: x + (i - (mobs.length - 1) / 2) * 34, y, pack: id }));

MAPS.canyon.portals.push({ id: 'hollow', x: 1450, y: 1000, to: 'hollow_gate', toPortal: 'south', label: 'Rootwood Hollow' });

Object.assign(MAPS, {
  hollow_gate: {
    id: 'hollow_gate', name: 'Hollow Gate', theme: 'forest', town: 'crag', world: { x: 168, y: 132 },
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#ff9f7a', '#d48ab8', '#6a4f9a'], far: '#9a6a9a', mid: '#7a5a8a', midTrim: '#9a7aa8', skyline: 'roots', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'], material: 'hollow', light: 'dusk', drift: 'spore', critters: ['firefly'], face: null, edges: 'glowcaps' },
    terrain: [[0, G], [300, G], [380, G - 40], [560, G - 40], [640, G], [1200, G]],
    platforms: [{ x: 400, y: G - 120, w: 160 }],
    ropes: [],
    deco: [['bigtree', 262, 0], ['mushring', 520], ['giantshroom', 700, 2], ['signpost', 120], ['rootgate', 1080]],
    portals: [
      { id: 'start', x: 760, y: G, hidden: true },
      { id: 'south', x: 60, y: G, to: 'canyon', toPortal: 'hollow' },
      { id: 'door', x: 1080, y: G, to: 'hollow1', toPortal: 'start', label: 'Rootwood Hollow', dungeon: 'hollow' },
    ],
    npcs: [{ id: 'bramble', x: 900 }],
    spawns: [],
  },

  // The Canopy Door: the way into Rootwood Hollow starts high in the great tree and goes down. In
  // the dark the group lands on a canopy branch by a giant owl's nest, crosses on a drifting leaf
  // (or climbs down), drops into the hollow limb, and reaches the trunk floor where the way on is.
  // One glowcap waits on each level; ropes join every level so nobody is ever stuck.
  hollow1: {
    id: 'hollow1', name: 'The Canopy Door', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 1900, ground: 860, by: 'y',
      ledges: [
        { x: 40, y: 260, w: 700 }, { x: 780, y: 250, w: 120, style: 'leaf', drift: { dx: 300, period: 9 } }, { x: 1200, y: 300, w: 560 },
        { x: 960, y: 480, w: 760 }, { x: 140, y: 580, w: 700 },
        { x: 900, y: 720, w: 160 },
        { x: 1780, y: 216, w: 100 },
      ],
      zones: [
        { name: 'Trunk Floor', color: '#8fe0c8', mobs: [], look: { sky: ['#1e1a2e', '#33284a', '#4a3a5a'] } },
        { name: 'Hollow Limb', color: '#b08ad8', from: 640, mobs: [], look: { sky: ['#2a2a4a', '#45406a', '#6a5a80'] } },
        { name: 'Canopy', color: '#9fd88a', from: 380, mobs: [], look: { sky: ['#1e3a5a', '#3a6a7a', '#8ab8a8'] } },
      ],
    }),
    look: { sky: ['#1e3a5a', '#3a6a7a', '#8ab8a8'], far: '#2a4a4a', mid: '#3a5a4a', midTrim: '#5a8a6a', skyline: 'bigtrees', light: 'ridge', drift: 'leaf', critters: ['firefly'] },
    task: { kind: 'light', label: 'Light the glowcaps' },
    dark: true,
    darkDepth: [0.45, 1],
    deco: [['owlnest', 520, 0, 260], ['hollowlog', 1350, 0, 480], ['giantshroom', 700, 0], ['mushring', 300]],
    portals: [
      { id: 'out', x: 60, y: 260, to: 'hollow_gate', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 160, y: 260, hidden: true },
      { id: 'east', x: 1850, y: 860, to: 'hollow2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'glowcap', x: 1660, y: 300 }, { kind: 'glowcap', x: 240, y: 580 }, { kind: 'glowcap', x: 1500, y: 860 }],
    npcs: [],
    spawns: [...packAt('a', 1420, 300, 'rootling', 'sporecap'), ...packAt('b', 560, 580, 'rootling', 'rootling', 'rootling'), ...packAt('c', 1060, 860, 'rootling', 'sporecap', 'rootling', 'sporecap')],
  },

  // Capper's Garden: a sunken bowl of giant mushrooms, tiers rising up both walls and a great cap
  // standing in the middle. The Myconid Queen holds the floor; bounce caps throw you up out of
  // her Spore Tide, and the tiers give the group somewhere to be when it floods.
  hollow2: {
    id: 'hollow2', name: "Capper's Garden", theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 1400, ground: 540,
      ledges: [
        { x: 60, y: 460, w: 230 }, { x: 60, y: 380, w: 160 }, { x: 170, y: 300, w: 210 },
        { x: 1110, y: 460, w: 230 }, { x: 1180, y: 380, w: 160 }, { x: 1020, y: 300, w: 210 },
        { x: 600, y: 320, w: 200 },
        { x: 90, y: 220, w: 100 },
      ],
      zones: [{ name: "Capper's Garden", color: '#ffb0d0', mobs: [] }],
    }),
    look: { sky: ['#4a2a5a', '#8a4a80', '#d890b8'], far: '#5a3460', mid: '#8a5480', midTrim: '#c890b8', ...ROOTS, light: 'grove', drift: 'spore', shrooms: ['#ff9ec8', '#ffd0e8', '#c9a6ff'] },
    bouncers: [{ x: 440 }, { x: 960 }],
    deco: [['mushring', 610], ['giantshroom', 200, 2, 300], ['giantshroom', 1120, 0, 300], ['glowpool', 700, 0, 320]],
    portals: [
      { id: 'west', x: 40, y: 540, to: 'hollow1', toPortal: 'east' },
      { id: 'east', x: 1360, y: 540, to: 'hollow3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'mothercapper', x: 760, y: 540 }],
  },

  // Bramble Tunnels: a root floor on top with holes dropping into the tunnels beneath. The trapped
  // Sprouts are caged on both levels; spores rise through the first hole to carry you back up, the
  // Sprouts' stump house stands on top, and roots fall from the low tunnel roof in a fight.
  hollow3: {
    id: 'hollow3', name: 'Bramble Tunnels', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 2400, ground: 700, by: 'y',
      ledges: [
        { x: 40, y: 420, w: 560 }, { x: 700, y: 420, w: 620 }, { x: 1420, y: 420, w: 560 }, { x: 2060, y: 420, w: 300 },
        { x: 1080, y: 580, w: 160 },
      ],
      zones: [
        { name: 'The Tunnels', color: '#b08ad8', mobs: [], look: { sky: ['#1e1418', '#2e2026', '#45302e'] } },
        { name: 'The Root Floor', color: '#9fd88a', from: 500, mobs: [], look: { sky: ['#2a3a2a', '#45583a', '#6a7a4a'] } },
      ],
    }),
    look: { sky: ['#1e1418', '#2e2026', '#45302e'], far: '#2e2226', mid: '#4a3434', midTrim: '#6a4a44', ...ROOTS, light: 'cave', drift: 'spore' },
    task: { kind: 'free', label: 'Free the trapped Sprouts' },
    rootfall: true,
    updrafts: [{ x: 650, w: 56, top: 400, bottom: 700, kind: 'spores' }],
    deco: [['stumphouse', 1560, 0, 420], ['hollowlog', 420, 0], ['giantshroom', 2240, 1, 420], ['mushring', 1640]],
    portals: [
      { id: 'west', x: 60, y: 420, to: 'hollow2', toPortal: 'east' },
      { id: 'east', x: 2350, y: 700, to: 'hollow4', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'cage', x: 320, y: 420 }, { kind: 'cage', x: 880, y: 700 }, { kind: 'cage', x: 1780, y: 420 }, { kind: 'cage', x: 2160, y: 700 }],
    npcs: [],
    spawns: [...packAt('a', 1000, 420, 'rootling', 'thornback', 'rootling'), ...packAt('b', 1340, 700, 'sporecap', 'rootling', 'sporecap'), ...packAt('c', 1880, 700, 'thornback', 'sporecap', 'rootling')],
  },

  // Boar Den: a long, low den, room for Tuskar's charges, with a mud wallow, old bones, two stone
  // pillars to trick him into, and raised side ledges to dodge onto.
  hollow4: {
    id: 'hollow4', name: 'Boar Den', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 1500, ground: 460,
      ledges: [{ x: 60, y: 380, w: 200 }, { x: 1240, y: 380, w: 200 }, { x: 660, y: 340, w: 180 }, { x: 1360, y: 300, w: 100 }],
      zones: [{ name: 'Boar Den', color: '#d8a878', mobs: [] }],
    }),
    look: { sky: ['#3a2420', '#6a4232', '#a8704e'], far: '#4a2e26', mid: '#6a4636', midTrim: '#9a6a4e', ...ROOTS, light: 'dusk', drift: 'spore' },
    pillars: [{ x: 420 }, { x: 1250 }],
    deco: [['bones', 300], ['pond', 980], ['bones', 1180, 1], ['hollowlog', 560]],
    portals: [
      { id: 'west', x: 40, y: 460, to: 'hollow3', toPortal: 'east' },
      { id: 'east', x: 1460, y: 460, to: 'hollow5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'tuskar', x: 900, y: 460 }],
  },

  // The Root Gate: a tall climb out of the sap. The sap surges over the floor now and then, so the
  // group climbs: the Sap Pools, the Root Stair, then the Gate Ledge with the Root Gate on top. The
  // keys are on the Thornbacks, one on each level, and a column of spores lifts you up the middle.
  hollow5: {
    id: 'hollow5', name: 'The Root Gate', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 2000, ground: 1000, by: 'y',
      ledges: [
        { x: 80, y: 920, w: 360 }, { x: 1500, y: 920, w: 420 }, { x: 560, y: 860, w: 300 }, { x: 1080, y: 850, w: 320 },
        { x: 200, y: 770, w: 260 }, { x: 1340, y: 760, w: 300 }, { x: 760, y: 720, w: 240 }, { x: 100, y: 680, w: 300 }, { x: 1600, y: 680, w: 280 },
        { x: 520, y: 620, w: 260 }, { x: 1220, y: 610, w: 240 }, { x: 820, y: 530, w: 420, thick: 44 },
        { x: 120, y: 600, w: 130 },
      ],
      zones: [
        { name: 'The Sap Pools', color: '#e8c070', mobs: [], look: { sky: ['#4a2a14', '#8a5220', '#d8903a'] } },
        { name: 'The Root Stair', color: '#b08ad8', from: 800, mobs: [] },
        { name: 'The Gate Ledge', color: '#9fd88a', from: 650, mobs: [], look: { sky: ['#3a3a2a', '#6a6a3a', '#b8b060'] } },
      ],
    }),
    look: { sky: ['#4a2e1a', '#9a6028', '#e8a850'], far: '#5a3a20', mid: '#7a5030', midTrim: '#b88048', ...ROOTS, light: 'crag', drift: 'spore' },
    task: { kind: 'keys', label: 'Find the Root Keys', count: 3 },
    flood: { every: 24, warn: 3, last: 7, damage: 40 },
    updrafts: [{ x: 1040, w: 60, top: 540, bottom: 1000, kind: 'spores' }],
    deco: [['rootgate', 1160, 0, 530], ['giantshroom', 230, 2], ['mushring', 1590]],
    portals: [
      { id: 'west', x: 40, y: 1000, to: 'hollow4', toPortal: 'east' },
      { id: 'east', x: 1160, y: 530, to: 'hollow6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 800, 1000, 'rootling', 'thornback', 'sporecap'), ...packAt('b', 1240, 850, 'sporecap', 'thornback', 'rootling', 'rootling'),
      ...packAt('c', 1740, 680, 'rootling', 'sporecap', 'thornback', 'sporecap'),
    ].map((sp) => (sp.mob === 'thornback' ? { ...sp, key: true } : sp)),
  },

  // Heart of the Hollow: the round chamber under the great tree's glowing heart, ringed with two
  // tiers of ledges. Gnarlroot's heart opens above him in his last phase: strike it from up high.
  hollow6: {
    id: 'hollow6', name: 'Heart of the Hollow', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 1500, height: 420, groundY: G,
    platforms: [
      { x: 140, y: 300, w: 170 }, { x: 560, y: 300, w: 150 }, { x: 900, y: 300, w: 150 }, { x: 1220, y: 300, w: 170 },
      { x: 640, y: 220, w: 120 }, { x: 860, y: 220, w: 120 }, { x: 250, y: 220, w: 140 }, { x: 1060, y: 220, w: 140 },
      { x: 1180, y: 140, w: 100 },
    ],
    ropes: [],
    look: { sky: ['#14242e', '#1e4a4a', '#5ac0a8'], far: '#1e3a3a', mid: '#2e5a52', midTrim: '#5aa088', ...ROOTS, light: 'hollow', drift: 'spore', shrooms: ['#7fe6d6', '#c4f6ee', '#9fffb0'] },
    deco: [['glowpool', 380], ['giantshroom', 1250, 1], ['glowpool', 1120], ['mushring', 760]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow5', toPortal: 'east' },
      { id: 'out', x: 1450, y: G, to: 'hollow_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'gnarlroot', x: 860, y: G }],
  },
});

// ---------- Moonlit Manor (the levels 15-20 group dungeon, docs/design/moonlit-manor.md) ----------
//
// Each room has an idea of its own (world/manor.js runs them), and no two share a shape:
//   fountains   garden fountains spout on a beat and throw whoever stands in the basin up high
//   puzzle      the gallery's portraits turn; set all four to the family crest (`crest` shows it)
//   chandelier  the ballroom's chandelier comes down mid-fight
//   storms      page storms blow through one floor of the library at a time
//   chase       the hallway's tea trolley rolls after the group; `doors` bar the way until their
//               levers are pulled

// What every manor room's look shares: moonlit violet, its own backdrop, the manor's own stone.
const MANOR_OUT = { skyline: 'manor', material: 'manorgarden', critters: ['firefly'], drift: 'mote', face: 'moon', light: 'dusk' };
const MANOR_IN = { skyline: 'manorhall', material: 'manor', critters: [], drift: 'mote', face: null, light: 'cave', ceiling: 'manor' };

MAPS.woods.portals.push({ id: 'manor', x: 910, y: 440, to: 'manor_gate', toPortal: 'south', label: 'Moonlit Manor' });

Object.assign(MAPS, {
  // Manor Hill: the garden path up from the treetops of Mossy Woods to the manor's iron gates, where
  // old Mr. Pumpkins keeps the gate and finds groups. The manor looms on the hill behind.
  manor_gate: {
    id: 'manor_gate', name: 'Manor Hill', theme: 'manor', town: 'harbor', world: { x: 262, y: 150 }, music: 'manor',
    width: 1300, height: 420, groundY: G,
    look: { sky: ['#3a3270', '#7a62b0', '#e0a8c8'], far: '#5a4a8a', mid: '#7a6aa8', midTrim: '#c9a6ff', ...MANOR_OUT },
    terrain: [[0, G], [340, G], [420, G - 30], [1300, G - 30]],
    platforms: [{ x: 520, y: G - 110, w: 160 }],
    ropes: [],
    deco: [['signpost', 180]],
    portals: [
      { id: 'start', x: 760, y: G - 30, hidden: true },
      { id: 'south', x: 60, y: G, to: 'woods', toPortal: 'manor' },
      { id: 'door', x: 1180, y: G - 30, to: 'manor1', toPortal: 'start', label: 'Moonlit Manor', dungeon: 'manor' },
    ],
    npcs: [{ id: 'pumpkins', x: 960 }],
    spawns: [],
  },

  // The Moonlit Garden: hedges and topiaries climbing in terraces to the front steps. The fountains
  // spout on a beat and throw you up a terrace (the first one, by the gate, up to a hidden ledge).
  // Light the three garden lanterns; the front door waits at the top.
  manor1: {
    id: 'manor1', name: 'The Moonlit Garden', theme: 'manor', town: 'harbor', dungeon: 'manor', ownLight: true,
    ...lay({
      width: 2200, ground: 760,
      ledges: [
        { x: 520, y: 640, w: 520 }, { x: 1040, y: 520, w: 520 }, { x: 1560, y: 400, w: 640, thick: 44 },
        { x: 120, y: 570, w: 110 },
      ],
      zones: [
        { name: 'The Lantern Walk', color: '#ffd88a', mobs: [] },
        { name: 'The Fountain Terraces', color: '#8fd8e8', from: 900, mobs: [] },
        { name: 'The Front Steps', color: '#c9a6ff', from: 1560, mobs: [] },
      ],
    }),
    look: { sky: ['#2a2458', '#5a4a96', '#c890c8'], far: '#4a3a7a', mid: '#5a7a6a', midTrim: '#9ad8a0', ...MANOR_OUT },
    task: { kind: 'light', object: 'lantern', label: 'Light the garden lanterns' },
    fountains: [{ x: 200, y: 760, every: 6 }, { x: 960, y: 640, every: 7 }, { x: 1500, y: 520, every: 6.5 }],
    portals: [
      { id: 'out', x: 50, y: 760, to: 'manor_gate', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 110, y: 760, hidden: true },
      { id: 'east', x: 2140, y: 400, to: 'manor2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'lantern', x: 440, y: 760 }, { kind: 'lantern', x: 760, y: 640 }, { kind: 'lantern', x: 1300, y: 520 }],
    npcs: [],
    spawns: [
      ...packAt('a', 640, 760, 'topiarydryad', 'lanternghost', 'topiarydryad'),
      ...packAt('b', 880, 640, 'porcelaindoll', 'topiarydryad', 'lanternghost'),
      ...packAt('c', 1220, 520, 'topiarydryad', 'porcelaindoll', 'lanternghost', 'topiarydryad'),
      ...packAt('d', 1800, 400, 'porcelaindoll', 'lanternghost', 'porcelaindoll'),
    ],
  },

  // The Portrait Gallery: a tall hall on four floors with the family's portraits on every wall. The
  // puzzle: four of them turn (one on each floor); set each to its picture in the family crest over
  // the stair. Picture frames drift across the gap on the top floor.
  manor2: {
    id: 'manor2', name: 'The Portrait Gallery', theme: 'manor', town: 'harbor', dungeon: 'manor',
    ...lay({
      width: 1400, ground: 900, by: 'y',
      ledges: [
        { x: 60, y: 740, w: 560 }, { x: 780, y: 740, w: 560 },
        { x: 200, y: 580, w: 1000 },
        { x: 60, y: 420, w: 420 }, { x: 900, y: 420, w: 440 },
        { x: 520, y: 410, w: 100, drift: { dx: 220, period: 8 } },
        { x: 650, y: 300, w: 90 },
      ],
      zones: [
        { name: 'The Entrance Hall', color: '#c9a6ff', mobs: [] },
        { name: 'The Long Gallery', color: '#ffb3cf', from: 760, mobs: [] },
        { name: 'The Family Wing', color: '#ffd88a', from: 600, mobs: [] },
      ],
    }),
    look: { sky: ['#1e1a3e', '#3a2e66', '#7a62b0'], far: '#3a2e5e', mid: '#5a4a86', midTrim: '#ffd36b', ...MANOR_IN },
    task: { kind: 'light', object: 'portrait', label: 'Set the portraits to the crest' },
    puzzle: true,
    crest: { x: 700, y: 580 },
    portals: [
      { id: 'west', x: 50, y: 900, to: 'manor1', toPortal: 'east' },
      { id: 'east', x: 1300, y: 420, to: 'manor3', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'portrait', slot: 0, x: 340, y: 900 }, { kind: 'portrait', slot: 1, x: 1160, y: 740 },
      { kind: 'portrait', slot: 2, x: 320, y: 580 }, { kind: 'portrait', slot: 3, x: 1060, y: 420 },
    ],
    npcs: [],
    spawns: [
      ...packAt('a', 820, 900, 'ghostmaid', 'porcelaindoll', 'ghostmaid'),
      ...packAt('b', 420, 740, 'teahatter', 'ghostmaid'),
      ...packAt('c', 880, 580, 'porcelaindoll', 'teahatter', 'porcelaindoll'),
      ...packAt('d', 260, 420, 'ghostmaid', 'teahatter'),
    ],
  },

  // The Ballroom: a grand round floor under a chandelier, a balcony each side reached by little
  // landings. The Waltzing Armours hold the floor.
  manor3: {
    id: 'manor3', name: 'The Ballroom', theme: 'manor', town: 'harbor', dungeon: 'manor',
    width: 1500, height: 420, groundY: G,
    platforms: [
      { x: 80, y: 260, w: 220 }, { x: 1200, y: 260, w: 220 },
      { x: 340, y: 310, w: 100 }, { x: 1060, y: 310, w: 100 },
      { x: 700, y: 170, w: 100 },
    ],
    // The chandelier's chain: climb it to the ledge in the dome (the room's secret).
    ropes: [{ x: 750, top: 170, bottom: G }],
    look: { sky: ['#2a1e4e', '#5a3a86', '#c48ad0'], far: '#40306a', mid: '#6a4a96', midTrim: '#ffd36b', ...MANOR_IN, skyline: 'manorball' },
    chandelier: { x: 750 },
    portals: [
      { id: 'west', x: 40, y: G, to: 'manor2', toPortal: 'east' },
      { id: 'east', x: 1460, y: G, to: 'manor4', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'waltzrondo', x: 690, y: G, pack: 'pair' }, { mob: 'waltzminuet', x: 810, y: G, pack: 'pair' }],
  },

  // The Library: shelves to the ceiling on five floors joined by rolling ladders. The three lost
  // books flutter along the shelves (catch them); page storms blow through one floor at a time.
  manor4: {
    id: 'manor4', name: 'The Library', theme: 'manor', town: 'harbor', dungeon: 'manor',
    ...lay({
      width: 1500, ground: 1000, by: 'y',
      ledges: [
        { x: 80, y: 840, w: 640 }, { x: 860, y: 840, w: 560 },
        { x: 300, y: 680, w: 900 },
        { x: 80, y: 520, w: 520 }, { x: 760, y: 520, w: 660 },
        { x: 400, y: 380, w: 1020, thick: 44 },
        { x: 80, y: 270, w: 100 },
      ],
      zones: [
        { name: 'The Reading Room', color: '#ffd88a', mobs: [] },
        { name: 'The Stacks', color: '#c9a6ff', from: 760, mobs: [] },
        { name: 'The Rare Books', color: '#8fd8e8', from: 450, mobs: [] },
      ],
    }),
    look: { sky: ['#20183a', '#3e2e5e', '#8a6aa0'], far: '#3a2a4a', mid: '#6a4a5a', midTrim: '#ffd36b', ...MANOR_IN, skyline: 'library' },
    task: { kind: 'light', object: 'book', label: 'Catch the lost books' },
    storms: true,
    portals: [
      { id: 'west', x: 40, y: 1000, to: 'manor3', toPortal: 'east' },
      { id: 'east', x: 1380, y: 380, to: 'manor5', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'book', x: 400, y: 840, dx: 50, period: 7 }, { kind: 'book', x: 1000, y: 680, dx: 60, period: 8 }, { kind: 'book', x: 1100, y: 520, dx: 50, period: 6.5 },
    ],
    npcs: [],
    spawns: [
      ...packAt('a', 700, 1000, 'teahatter', 'lanternghost', 'ghostmaid'),
      ...packAt('b', 1100, 840, 'lanternghost', 'teahatter', 'lanternghost'),
      ...packAt('c', 520, 680, 'ghostmaid', 'porcelaindoll', 'teahatter', 'ghostmaid'),
      ...packAt('d', 340, 520, 'teahatter', 'lanternghost'),
    ],
  },

  // The Endless Hallway: a long, long corridor of rugs, side tables and grandfather clocks. Past the
  // start line Madame Velvet's tea trolley comes rolling; three doors bar the way until their levers
  // are pulled. At the far end the trolley stops, and its owner is waiting.
  manor5: {
    id: 'manor5', name: 'The Endless Hallway', theme: 'manor', town: 'harbor', dungeon: 'manor',
    width: 3600, height: 420, groundY: G,
    platforms: [{ x: 640, y: 320, w: 80 }, { x: 1460, y: 320, w: 80 }, { x: 2360, y: 320, w: 80 }, { x: 3200, y: 300, w: 90 }, { x: 3330, y: 230, w: 90 }],
    ropes: [],
    look: { sky: ['#1e1838', '#3e2e60', '#7a5aa0'], far: '#36284e', mid: '#5a3e6a', midTrim: '#ffb3cf', ...MANOR_IN, skyline: 'hallway' },
    task: { kind: 'light', object: 'lever', label: 'Pull the door levers' },
    chase: { start: 300, from: -40, to: 3000, speed: 80, speedUp: 4, top: 128, damage: 120, plates: 3.6 },
    doors: [{ x: 1120, lever: 0 }, { x: 2040, lever: 1 }, { x: 2860, lever: 2 }],
    portals: [
      { id: 'west', x: 40, y: G, to: 'manor4', toPortal: 'east' },
      { id: 'east', x: 3560, y: G, to: 'manor6', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'lever', x: 1060, y: G }, { kind: 'lever', x: 1980, y: G }, { kind: 'lever', x: 2800, y: G }],
    npcs: [],
    spawns: [{ mob: 'velvet', x: 3330, y: G }],
  },

  // The Moonlit Rooftop: the slate roof under a moon far too big, chimneys to stand on, a
  // weathervane at the top, and a long party table laid for a hundred. Lady Marigold is waiting.
  manor6: {
    id: 'manor6', name: 'The Moonlit Rooftop', theme: 'manor', town: 'harbor', dungeon: 'manor', ownLight: true,
    width: 1600, height: 420, groundY: G,
    platforms: [
      { x: 230, y: 296, w: 74 }, { x: 560, y: 300, w: 74 }, { x: 966, y: 300, w: 74 }, { x: 1296, y: 296, w: 74 },
      { x: 760, y: 220, w: 80 },
    ],
    // The weathervane's pole, up to the little platform at its foot (the room's secret).
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#1a1e4e', '#3a3a86', '#a890d8'], far: '#2e2e66', mid: '#4a4a86', midTrim: '#ffd36b', ...MANOR_OUT, material: 'manor', face: null, bigMoon: true },
    portals: [
      { id: 'west', x: 40, y: G, to: 'manor5', toPortal: 'east' },
      { id: 'out', x: 1560, y: G, to: 'manor_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'marigold', x: 800, y: G }],
  },
});

// ---------- Sunken Aquarium Palace (the levels 20-25 group dungeon, docs/design/aquarium-palace.md) ----------
//
// A dive: every room deeper and darker than the last. Each has an idea of its own (world/aquarium.js
// runs them):
//   updrafts (kind 'bubbles')  bubble lifts: press Up in one to rise
//   currents   [{ x1, x2, y, dir, every, last }]: a floor's water flows one way for `last` seconds
//              every `every` seconds, carrying whoever is on it
//   clams      objects of kind 'clam' with a `mark`: the bell rings an order; open them in it
//   burrows    [x, x]: the moray sisters' holes in the grotto walls
//   flood      (as in the Hollow) the tide surging up the abyss: `color: 'sea'` draws it as water

const SEA_LOOK = { skyline: 'reef', material: 'reef', critters: [], drift: 'bubble', face: null, light: 'cave', ceiling: false };

MAPS.harbor.portals.push({ id: 'pier', x: 2180, y: 480, to: 'tidepool_pier', toPortal: 'west', label: 'Tidepool Pier' });

Object.assign(MAPS, {
  // Tidepool Pier: a little pier off the east end of Pastel Harbor, over water glowing from below,
  // where Marina the diver keeps her bubble charm and finds groups.
  tidepool_pier: {
    id: 'tidepool_pier', name: 'Tidepool Pier', theme: 'harbor', town: 'harbor', world: { x: 236, y: 214 }, music: 'aquarium',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#5a8ad8', '#9ac8e8', '#ffd8c0'], far: '#6a9ad0', mid: '#ffffff', midTrim: '#8fd3ff', skyline: 'sea', light: 'dusk', critters: ['gull'] },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'harbor', toPortal: 'pier' },
      { id: 'door', x: 1110, y: G, to: 'aquarium1', toPortal: 'start', label: 'Sunken Aquarium Palace', dungeon: 'aquarium' },
    ],
    npcs: [{ id: 'marina', x: 860 }],
    spawns: [],
  },

  // The Coral Gate: down the palace's outer wall, floor by floor, from the surface gate to the sea
  // floor. Bubble lifts carry you back up; three lantern corals to light on the way down.
  aquarium1: {
    id: 'aquarium1', name: 'The Coral Gate', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    ...lay({
      width: 1600, ground: 1100, by: 'y',
      ledges: [
        { x: 40, y: 300, w: 700 }, { x: 900, y: 420, w: 660 }, { x: 100, y: 560, w: 760 },
        { x: 960, y: 700, w: 600 }, { x: 60, y: 840, w: 820 }, { x: 980, y: 960, w: 580 },
        { x: 1440, y: 280, w: 110 },
      ],
      zones: [
        { name: 'The Sea Floor', color: '#5ac8c8', mobs: [], look: { sky: ['#0e2e4e', '#1a4a6e', '#2a6a8a'] } },
        { name: 'The Coral Wall', color: '#ff9ab8', from: 900, mobs: [], look: { sky: ['#1a4a6e', '#2a6a8a', '#4a9ab0'] } },
        { name: 'The Surface Gate', color: '#9fe8ff', from: 520, mobs: [], look: { sky: ['#3a8ab0', '#6ab8d0', '#bfe6f0'] } },
      ],
    }),
    look: { sky: ['#1a4a6e', '#2a6a8a', '#4a9ab0'], far: '#1e5a7a', mid: '#2a7a8a', midTrim: '#ff9ab8', ...SEA_LOOK },
    task: { kind: 'light', object: 'coral', label: 'Light the lantern corals' },
    updrafts: [{ x: 1500, w: 56, top: 280, bottom: 420, kind: 'bubbles' }, { x: 920, w: 56, top: 560, bottom: 1100, kind: 'bubbles' }],
    portals: [
      { id: 'out', x: 50, y: 300, to: 'tidepool_pier', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 120, y: 300, hidden: true },
      { id: 'east', x: 1540, y: 1100, to: 'aquarium2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'coral', x: 300, y: 560 }, { kind: 'coral', x: 1200, y: 700 }, { kind: 'coral', x: 500, y: 1100 }],
    npcs: [],
    spawns: [
      ...packAt('a', 1200, 420, 'jellymaid', 'stardancer'),
      ...packAt('b', 560, 560, 'pearldiver', 'jellymaid', 'stardancer'),
      ...packAt('c', 420, 840, 'jellymaid', 'pearldiver', 'stardancer'),
      ...packAt('d', 1280, 960, 'stardancer', 'jellymaid'),
      ...packAt('e', 1060, 1100, 'pearldiver', 'jellymaid', 'stardancer'),
    ],
  },

  // The Kelp Gardens: a long swim through the palace gardens, the sea floor below and a path along
  // the kelp tops above. Currents sweep a floor at a time; a bubble lift at the far end leads up to
  // a hidden grotto.
  aquarium2: {
    id: 'aquarium2', name: 'The Kelp Gardens', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    ...lay({
      width: 2800, ground: 700,
      ledges: [{ x: 300, y: 560, w: 500 }, { x: 950, y: 560, w: 600 }, { x: 1700, y: 560, w: 700 }, { x: 2640, y: 420, w: 120 }],
      zones: [
        { name: 'The Kelp Shallows', color: '#7fd8a8', mobs: [] },
        { name: 'The Seagrass Meadow', color: '#9fe8d8', from: 1400, mobs: [] },
      ],
    }),
    look: { sky: ['#0e3a4a', '#1a5a5a', '#3a8a7a'], far: '#1a4a4a', mid: '#2a6a5a', midTrim: '#7fd8a8', ...SEA_LOOK },
    currents: [{ x1: 120, x2: 1350, y: 700, dir: 1, every: 7, last: 4 }, { x1: 1500, x2: 2600, y: 560, dir: -1, every: 8, last: 4 }],
    updrafts: [{ x: 2700, w: 56, top: 420, bottom: 700, kind: 'bubbles' }],
    portals: [
      { id: 'west', x: 40, y: 700, to: 'aquarium1', toPortal: 'east' },
      { id: 'east', x: 2560, y: 700, to: 'aquarium3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 700, 700, 'seahorseknight', 'stardancer', 'jellymaid'),
      ...packAt('b', 560, 560, 'octoscholar', 'seahorseknight'),
      ...packAt('c', 1250, 560, 'jellymaid', 'stardancer', 'octoscholar'),
      ...packAt('d', 1700, 700, 'seahorseknight', 'octoscholar', 'seahorseknight'),
      ...packAt('e', 2050, 560, 'stardancer', 'jellymaid', 'seahorseknight'),
    ],
  },

  // The Pearl Vault: three floors of giant clams. The tide bell rings an order as you come in (a
  // new one each run); open the four clams in it. A wrong one snaps them all shut.
  aquarium3: {
    id: 'aquarium3', name: 'The Pearl Vault', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    ...lay({
      width: 1300, ground: 860, by: 'y',
      ledges: [{ x: 420, y: 700, w: 460 }, { x: 100, y: 540, w: 400 }, { x: 800, y: 540, w: 400 }, { x: 580, y: 420, w: 140 }],
      zones: [
        { name: 'The Vault Floor', color: '#ffe6f2', mobs: [] },
        { name: 'The Pearl Galleries', color: '#bfeeff', from: 620, mobs: [] },
      ],
    }),
    look: { sky: ['#1a2a5a', '#2a4a7a', '#6a8ac0'], far: '#22346a', mid: '#3a5a8a', midTrim: '#ffe6f2', ...SEA_LOOK },
    task: { kind: 'light', object: 'clam', label: 'Open the clams in the bell\'s order' },
    bell: { x: 650, y: 420 },
    portals: [
      { id: 'west', x: 40, y: 860, to: 'aquarium2', toPortal: 'east' },
      { id: 'east', x: 1160, y: 540, to: 'aquarium4', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'clam', mark: 'Conch', x: 300, y: 860 }, { kind: 'clam', mark: 'Star', x: 1000, y: 860 },
      { kind: 'clam', mark: 'Pearl', x: 650, y: 700 }, { kind: 'clam', mark: 'Wave', x: 300, y: 540 },
    ],
    npcs: [],
    spawns: [
      ...packAt('a', 650, 860, 'octoscholar', 'pearldiver', 'seahorseknight'),
      ...packAt('b', 760, 700, 'pearldiver', 'octoscholar'),
      ...packAt('c', 1000, 540, 'seahorseknight', 'pearldiver', 'octoscholar'),
    ],
  },

  // The Moray Grotto: a cave riddled with holes, a burrow in each wall. The sisters wait.
  aquarium4: {
    id: 'aquarium4', name: 'The Moray Grotto', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    width: 1500, height: 420, groundY: G,
    platforms: [{ x: 300, y: 300, w: 140 }, { x: 1060, y: 300, w: 140 }, { x: 650, y: 300, w: 200 }],
    ropes: [],
    // A sea cave under the palace, not one of its halls: dark sea rock all round, crystals and weed.
    look: { sky: ['#0a2232', '#163848', '#2a5a62'], far: '#14343e', mid: '#1e4650', midTrim: '#7fe6d6', ...SEA_LOOK, skyline: 'crystals', material: 'searock' },
    burrows: [120, 1380],
    portals: [
      { id: 'west', x: 40, y: G, to: 'aquarium3', toPortal: 'east' },
      { id: 'east', x: 1460, y: G, to: 'aquarium5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'moraymurri', x: 760, y: G, pack: 'twins' }, { mob: 'morayena', x: 1380, y: G, pack: 'twins' }],
  },

  // The Ink Abyss: a deep shaft of ledges, the tide surging up it now and then. Lady Abyssia waits
  // at the bottom in her ink.
  aquarium5: {
    id: 'aquarium5', name: 'The Ink Abyss', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    ...lay({
      width: 1400, ground: 900, by: 'y',
      ledges: [
        { x: 80, y: 820, w: 260 }, { x: 1060, y: 820, w: 260 }, { x: 420, y: 750, w: 200 }, { x: 780, y: 750, w: 200 },
        { x: 120, y: 680, w: 240 }, { x: 1040, y: 680, w: 240 }, { x: 560, y: 620, w: 280 },
      ],
      zones: [
        { name: 'The Ink Floor', color: '#8a6ad8', mobs: [] },
        { name: 'The Shaft', color: '#5ae0c8', from: 780, mobs: [] },
      ],
    }),
    look: { sky: ['#0a0e2a', '#14183e', '#2a2a5a'], far: '#121836', mid: '#1e244a', midTrim: '#5ae0c8', ...SEA_LOOK },
    flood: { every: 24, warn: 3, last: 6, damage: 70, color: 'sea', name: 'The Tide Surges!' },
    portals: [
      { id: 'west', x: 40, y: 900, to: 'aquarium4', toPortal: 'east' },
      { id: 'east', x: 1360, y: 900, to: 'aquarium6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'abyssia', x: 700, y: 900 }],
  },

  // The Throne of Tides: the great throne room on the sea floor, two sea-glass pillars to stand on,
  // the coral throne at the back. Queen Coralie sleeps on it.
  aquarium6: {
    id: 'aquarium6', name: 'The Throne of Tides', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 300, y: 300, w: 90 }, { x: 1210, y: 300, w: 90 }, { x: 560, y: 300, w: 90 }, { x: 950, y: 300, w: 90 }, { x: 760, y: 220, w: 80 }],
    // The throne's banner rope, up to a ledge over the throne (the room's secret).
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#0e2a4e', '#1e4a7a', '#5a9ad0'], far: '#183a66', mid: '#2a5a8a', midTrim: '#ff9ab8', ...SEA_LOOK },
    portals: [
      { id: 'west', x: 40, y: G, to: 'aquarium5', toPortal: 'east' },
      { id: 'out', x: 1560, y: G, to: 'tidepool_pier', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'coralie', x: 800, y: G }],
  },
});

// ---------- Clockwork Carnival (the levels 25-30 group dungeon, docs/design/clockwork-carnival.md) ----------
//
// A loop round the rides. Each room has an idea of its own (world/carnival.js runs them):
//   drifting ledges  the carousel horses, riding back and forth
//   springs (kind 'spring')  the Funhouse's springboards
//   coaster    { every, speed, damage }: the coaster runs the ground track, one way then the other
//   conveyors  [{ x1, x2, y, dir }]: belts that carry whoever stands on them
//   trapezes   [x]: where Leonie swings above the ring (drawn)

const FAIR_OUT = { skyline: 'carnival', material: 'carnival', critters: ['firefly'], drift: 'confetti', face: 'moon', light: 'dusk', stars: true };
const FAIR_IN = { skyline: 'bigtop', material: 'carnival', critters: [], drift: 'confetti', face: null, light: 'cave' };


Object.assign(MAPS, {
  // The Carnival Gates: past the last torii of the Fox Shrine Path, a striped arch strung with
  // lights where Tock, a runaway tin soldier, finds groups.
  carnival_gate: {
    id: 'carnival_gate', name: 'Carnival Gates', theme: 'carnival', town: 'grove', world: { x: 400, y: 104 }, music: 'carnival',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#2a2a6a', '#7a4aa8', '#ff9ab8'], far: '#4a3a8a', mid: '#6a4aa8', midTrim: '#ffd36b', ...FAIR_OUT },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'shrine', toPortal: 'carnival' },
      { id: 'door', x: 1110, y: G, to: 'carnival1', toPortal: 'start', label: 'Clockwork Carnival', dungeon: 'carnival' },
    ],
    npcs: [{ id: 'tock', x: 860 }],
    spawns: [],
  },

  // The Midway: a long avenue of stalls with the carousel in the middle. Its horses ride back and
  // forth at two heights, carrying you up to the high stalls; wind the three music boxes.
  carnival1: {
    id: 'carnival1', name: 'The Midway', theme: 'carnival', town: 'grove', dungeon: 'carnival',
    ...lay({
      width: 2600, ground: 600,
      ledges: [
        { x: 900, y: 520, w: 90, style: 'planks', drift: { dx: 240, period: 6 } }, { x: 1400, y: 500, w: 90, style: 'planks', drift: { dx: 260, period: 7 } },
        { x: 1150, y: 440, w: 300 }, { x: 300, y: 500, w: 360 }, { x: 1900, y: 500, w: 420 }, { x: 2420, y: 400, w: 110 },
      ],
      zones: [
        { name: 'The Ticket Stalls', color: '#ff9ab8', mobs: [] },
        { name: 'The Carousel', color: '#ffd36b', from: 850, mobs: [] },
        { name: 'The Prize Booths', color: '#7fd8ff', from: 1800, mobs: [] },
      ],
    }),
    look: { sky: ['#2a2a6a', '#7a4aa8', '#ff9ab8'], far: '#4a3a8a', mid: '#6a4aa8', midTrim: '#ffd36b', ...FAIR_OUT, skyline: 'midway' },
    task: { kind: 'light', object: 'windbox', label: 'Wind the music boxes' },
    portals: [
      { id: 'out', x: 50, y: 600, to: 'carnival_gate', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 110, y: 600, hidden: true },
      { id: 'east', x: 2560, y: 600, to: 'carnival2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'windbox', x: 480, y: 500 }, { kind: 'windbox', x: 1300, y: 440 }, { kind: 'windbox', x: 2100, y: 600 }],
    npcs: [],
    spawns: [
      ...packAt('a', 650, 600, 'musicballerina', 'balloonseller', 'musicballerina'),
      ...packAt('b', 1250, 600, 'tindrummer', 'musicballerina', 'tindrummer'),
      ...packAt('c', 2050, 500, 'balloonseller', 'tindrummer'),
      ...packAt('d', 1750, 600, 'musicballerina', 'tindrummer', 'balloonseller'),
    ],
  },

  // The Funhouse: a tall maze of crooked floors and springboards. Bounce up from floor to floor and
  // pop the five prize balloons; the way out is at the top.
  carnival2: {
    id: 'carnival2', name: 'The Funhouse', theme: 'carnival', town: 'grove', dungeon: 'carnival',
    ...lay({
      width: 1300, ground: 1000, by: 'y',
      ledges: [
        { x: 80, y: 840, w: 500 }, { x: 760, y: 840, w: 460 }, { x: 300, y: 680, w: 700 },
        { x: 60, y: 520, w: 420 }, { x: 820, y: 520, w: 420 }, { x: 360, y: 360, w: 860 }, { x: 60, y: 260, w: 110 },
      ],
      zones: [
        { name: 'The Crooked Hall', color: '#ff9ab8', mobs: [] },
        { name: 'The Mirror Floors', color: '#c9a6ff', from: 760, mobs: [] },
        { name: 'The Top Floor', color: '#ffd36b', from: 440, mobs: [] },
      ],
    }),
    look: { sky: ['#3a1e5a', '#7a3a8a', '#e07ab0'], far: '#5a2a6a', mid: '#8a4a8a', midTrim: '#7fd8ff', ...FAIR_IN },
    task: { kind: 'light', object: 'prize', label: 'Pop the prize balloons' },
    springs: [{ x: 640, y: 1000, up: 170, kind: 'spring' }, { x: 380, y: 840, up: 170, kind: 'spring' }, { x: 900, y: 680, up: 170, kind: 'spring' }, { x: 300, y: 520, up: 170, kind: 'spring' }, { x: 110, y: 520, up: 270, kind: 'spring' }],
    portals: [
      { id: 'west', x: 40, y: 1000, to: 'carnival1', toPortal: 'east' },
      { id: 'east', x: 1180, y: 360, to: 'carnival3', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'prize', x: 1100, y: 1000 }, { kind: 'prize', x: 200, y: 840 }, { kind: 'prize', x: 700, y: 680 },
      { kind: 'prize', x: 1100, y: 520 }, { kind: 'prize', x: 600, y: 360 },
    ],
    npcs: [],
    spawns: [
      ...packAt('a', 860, 1000, 'jackbox', 'marionette'),
      ...packAt('b', 960, 840, 'marionette', 'balloonseller', 'jackbox'),
      ...packAt('c', 450, 680, 'jackbox', 'marionette'),
      ...packAt('d', 960, 520, 'balloonseller', 'jackbox', 'marionette'),
      ...packAt('e', 900, 360, 'marionette', 'jackbox'),
    ],
  },

  // The Coaster Yard: a long yard under the tracks, raised walkways all along it. The coaster runs
  // the ground track on a timer, one way then back: when the rail lights up, get off it.
  carnival3: {
    id: 'carnival3', name: 'The Coaster Yard', theme: 'carnival', town: 'grove', dungeon: 'carnival',
    width: 2600, height: 420, groundY: G,
    platforms: [
      { x: 160, y: 300, w: 180 }, { x: 560, y: 300, w: 220 }, { x: 1000, y: 300, w: 200 }, { x: 1420, y: 300, w: 220 },
      { x: 1860, y: 300, w: 200 }, { x: 2280, y: 300, w: 180 }, { x: 1180, y: 220, w: 120 },
    ],
    ropes: [{ x: 1240, top: 220, bottom: G }],
    look: { sky: ['#1e2a5a', '#5a3a8a', '#ff8a8a'], far: '#3a3070', mid: '#5a4a90', midTrim: '#ff7aa8', ...FAIR_OUT, skyline: 'coaster' },
    coaster: { every: 9, speed: 520, damage: 180 },
    portals: [
      { id: 'west', x: 40, y: G, to: 'carnival2', toPortal: 'east' },
      { id: 'east', x: 2560, y: G, to: 'carnival4', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 660, G, 'teddystrong', 'tindrummer'),
      ...packAt('b', 1100, 300, 'jackbox', 'tindrummer'),
      ...packAt('c', 1500, G, 'teddystrong', 'jackbox', 'tindrummer'),
      ...packAt('d', 1960, 300, 'tindrummer', 'teddystrong'),
      ...packAt('e', 2200, G, 'jackbox', 'teddystrong', 'jackbox'),
    ],
  },

  // The Big Top: a round ring of sawdust under the tent, two trapezes overhead, a balcony each side.
  carnival4: {
    id: 'carnival4', name: 'The Big Top', theme: 'carnival', town: 'grove', dungeon: 'carnival',
    width: 1500, height: 420, groundY: G,
    platforms: [{ x: 80, y: 300, w: 200 }, { x: 1220, y: 300, w: 200 }, { x: 680, y: 220, w: 140 }],
    ropes: [{ x: 750, top: 220, bottom: G }],
    look: { sky: ['#4a1e3a', '#8a2a4a', '#e05a6a'], far: '#5a2440', mid: '#8a3450', midTrim: '#ffd36b', ...FAIR_IN },
    trapezes: [450, 1050],
    portals: [
      { id: 'west', x: 40, y: G, to: 'carnival3', toPortal: 'east' },
      { id: 'east', x: 1460, y: G, to: 'carnival5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'leonie', x: 760, y: G }],
  },

  // The Toy Workshop: the factory floor where the toys are made, conveyor belts on every floor.
  // Madame Marionette waits among the half-built puppets.
  carnival5: {
    id: 'carnival5', name: 'The Toy Workshop', theme: 'carnival', town: 'grove', dungeon: 'carnival',
    ...lay({
      width: 1500, ground: 700, by: 'y',
      ledges: [{ x: 80, y: 600, w: 300 }, { x: 1120, y: 600, w: 300 }, { x: 520, y: 560, w: 460 }, { x: 680, y: 470, w: 140 }],
      zones: [{ name: 'The Workshop Floor', color: '#ffd36b', mobs: [] }, { name: 'The Gantries', color: '#c9a6ff', from: 620, mobs: [] }],
    }),
    look: { sky: ['#2a1e3a', '#4a3456', '#8a6a7a'], far: '#3a2a46', mid: '#5a4060', midTrim: '#ffd36b', ...FAIR_IN, skyline: 'workshop' },
    conveyors: [{ x1: 60, x2: 1440, y: 700, dir: 1 }, { x1: 520, x2: 980, y: 560, dir: -1 }],
    portals: [
      { id: 'west', x: 40, y: 700, to: 'carnival4', toPortal: 'east' },
      { id: 'east', x: 1460, y: 700, to: 'carnival6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'marionetta', x: 760, y: 700 }],
  },

  // The Ferris Wheel: the plaza under the great wheel, its parked cars to stand on. Queen Gearheart
  // turns slowly at its foot.
  carnival6: {
    id: 'carnival6', name: 'The Ferris Wheel', theme: 'carnival', town: 'grove', dungeon: 'carnival',
    width: 1700, height: 420, groundY: G,
    platforms: [{ x: 240, y: 300, w: 90 }, { x: 560, y: 300, w: 90 }, { x: 1050, y: 300, w: 90 }, { x: 1370, y: 300, w: 90 }, { x: 800, y: 220, w: 100 }],
    // The wheel's spoke ladder, up to a car at its hub (the room's secret).
    ropes: [{ x: 850, top: 220, bottom: G }],
    look: { sky: ['#1a1a4a', '#4a2a7a', '#c86aa8'], far: '#2e2a66', mid: '#4a3a86', midTrim: '#ffd36b', ...FAIR_OUT, skyline: 'ferris' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'carnival5', toPortal: 'east' },
      { id: 'out', x: 1660, y: G, to: 'carnival_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'gearheart', x: 850, y: G }],
  },
});

// ---------- Star Observatory (the levels 30-35 group dungeon, docs/design/star-observatory.md) ----------
//
// A climb up the tower, floor by floor. Each room has an idea of its own (world/observatory.js):
//   meteors        { every, damage }: meteor showers on whoever's floors
//   constellation  [[a, b], ...]: which star lamps are joined (using one flips it and its neighbours)
//   lowGravity     0..1: how much lighter everyone falls in the air
//   eclipse        the hall split into a sunlit and a shadowed half (the Eclipse Twins' fight)

const STAR_OUT = { skyline: 'stars', material: 'starstone', critters: ['firefly'], drift: 'sparkle', face: 'moon', light: 'ridge', stars: true };
const STAR_IN = { skyline: 'starhall', material: 'starstone', critters: [], drift: 'sparkle', face: null, light: 'cave', ceiling: 'manor' };

Object.assign(MAPS, {
  // The Observatory Steps: the top of Moonlit Ridge, where a tower that only appears on clear nights
  // stands against the stars. Professor Lumen has the key.
  observatory_steps: {
    id: 'observatory_steps', name: 'Observatory Steps', theme: 'observatory', town: 'crag', world: { x: 232, y: 92 }, music: 'observatory',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#0e1440', '#2a2a7a', '#6a5ab0'], far: '#1e2a5a', mid: '#2e3a72', midTrim: '#fff3a6', ...STAR_OUT },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'ridge', toPortal: 'observatory' },
      { id: 'door', x: 1110, y: G, to: 'observatory1', toPortal: 'start', label: 'Star Observatory', dungeon: 'observatory' },
    ],
    npcs: [{ id: 'lumen', x: 860 }],
    spawns: [],
  },

  // The Starlit Stair: up the tower's outside, a zig-zag of landings under the open sky. Meteor
  // showers fall on the landings now and then; three star lamps to light on the way.
  observatory1: {
    id: 'observatory1', name: 'The Starlit Stair', theme: 'observatory', town: 'crag', dungeon: 'observatory',
    ...lay({
      width: 1500, ground: 1100, by: 'y',
      ledges: [
        { x: 700, y: 980, w: 700 }, { x: 80, y: 860, w: 700 }, { x: 760, y: 740, w: 660 }, { x: 100, y: 620, w: 660 },
        { x: 740, y: 500, w: 680 }, { x: 80, y: 380, w: 700, thick: 44 }, { x: 1300, y: 300, w: 110 },
      ],
      zones: [
        { name: 'The Tower Foot', color: '#c9b6ff', mobs: [] },
        { name: 'The Winding Stair', color: '#9fd8ff', from: 900, mobs: [] },
        { name: 'The Star Landing', color: '#fff3a6', from: 560, mobs: [] },
      ],
    }),
    look: { sky: ['#0e1440', '#2a2a7a', '#6a5ab0'], far: '#1e2a5a', mid: '#2e3a72', midTrim: '#fff3a6', ...STAR_OUT },
    task: { kind: 'light', object: 'starlamp1', label: 'Light the star lamps' },
    meteors: { every: 10, damage: 170 },
    portals: [
      { id: 'out', x: 50, y: 1100, to: 'observatory_steps', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 110, y: 1100, hidden: true },
      { id: 'east', x: 140, y: 380, to: 'observatory2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'starlamp1', x: 1200, y: 980 }, { kind: 'starlamp1', x: 300, y: 620 }, { kind: 'starlamp1', x: 1300, y: 500 }],
    npcs: [],
    spawns: [
      ...packAt('a', 700, 1100, 'cometcourier', 'starcarto', 'cometcourier'),
      ...packAt('b', 500, 860, 'starcarto', 'geminighosts'),
      ...packAt('c', 1050, 740, 'cometcourier', 'geminighosts', 'starcarto'),
      ...packAt('d', 500, 620, 'geminighosts', 'cometcourier'),
      ...packAt('e', 1000, 500, 'starcarto', 'cometcourier', 'geminighosts'),
    ],
  },

  // The Constellation Hall: a wide hall, five star lamps set in the pattern of a constellation (on
  // the floor and on two balconies). Using one flips it and the lamps joined to it: light all five.
  observatory2: {
    id: 'observatory2', name: 'The Constellation Hall', theme: 'observatory', town: 'crag', dungeon: 'observatory',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 480, y: 300, w: 160 }, { x: 960, y: 300, w: 160 }, { x: 740, y: 220, w: 120 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#14183e', '#2a2a66', '#5a4a96'], far: '#1e2050', mid: '#2e3070', midTrim: '#fff3a6', ...STAR_IN },
    task: { kind: 'light', object: 'starlamp', label: 'Light all five star lamps' },
    constellation: [[0, 1], [1, 2], [2, 3], [3, 4], [1, 3]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'observatory1', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'observatory3', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'starlamp', x: 300, y: G }, { kind: 'starlamp', x: 560, y: 300 }, { kind: 'starlamp', x: 800, y: G },
      { kind: 'starlamp', x: 1040, y: 300 }, { kind: 'starlamp', x: 1300, y: G },
    ],
    npcs: [],
    spawns: [...packAt('a', 560, G, 'nebulawitch', 'mothlibrarian'), ...packAt('b', 1060, G, 'mothlibrarian', 'nebulawitch', 'meteorgolem')],
  },

  // The Weightless Reading Room: shelves floating far apart in a room with almost no weight to it.
  // Every jump is long and floaty.
  observatory3: {
    id: 'observatory3', name: 'The Weightless Reading Room', theme: 'observatory', town: 'crag', dungeon: 'observatory',
    ...lay({
      width: 2400, ground: 700,
      ledges: [
        { x: 300, y: 560, w: 260 }, { x: 720, y: 450, w: 240 }, { x: 1120, y: 560, w: 260 }, { x: 1520, y: 440, w: 260 },
        { x: 1940, y: 540, w: 260 }, { x: 1000, y: 330, w: 200 }, { x: 2250, y: 380, w: 110 },
      ],
      zones: [{ name: 'The Quiet Stacks', color: '#c9b6ff', mobs: [] }, { name: 'The Floating Shelves', color: '#9fd8ff', from: 1200, mobs: [] }],
    }),
    look: { sky: ['#1a1440', '#3a2a6a', '#7a5aa8'], far: '#22184a', mid: '#3a2a66', midTrim: '#fff3a6', ...STAR_IN },
    lowGravity: 0.55,
    portals: [
      { id: 'west', x: 40, y: 700, to: 'observatory2', toPortal: 'east' },
      { id: 'east', x: 2360, y: 700, to: 'observatory4', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 650, 700, 'mothlibrarian', 'nebulawitch', 'mothlibrarian'),
      ...packAt('b', 840, 450, 'geminighosts', 'mothlibrarian'),
      ...packAt('c', 1350, 700, 'meteorgolem', 'nebulawitch', 'meteorgolem'),
      ...packAt('d', 1650, 440, 'nebulawitch', 'geminighosts'),
      ...packAt('e', 2000, 700, 'meteorgolem', 'mothlibrarian', 'nebulawitch'),
    ],
  },

  // The Archive: a long hall of bookcases to the ceiling. Folio keeps it, very quietly.
  observatory4: {
    id: 'observatory4', name: 'The Archive', theme: 'observatory', town: 'crag', dungeon: 'observatory',
    width: 1800, height: 420, groundY: G,
    platforms: [{ x: 200, y: 300, w: 180 }, { x: 1420, y: 300, w: 180 }, { x: 830, y: 220, w: 140 }],
    ropes: [{ x: 900, top: 220, bottom: G }],
    look: { sky: ['#1e1436', '#3a2850', '#7a5a7a'], far: '#2a1e3e', mid: '#4a3456', midTrim: '#ffd36b', ...STAR_IN, skyline: 'archive' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'observatory3', toPortal: 'east' },
      { id: 'east', x: 1760, y: G, to: 'observatory5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'folio', x: 900, y: G }],
  },

  // The Orrery: brass planets orbiting a sun of glass, ridden like moving ledges. The Eclipse Twins
  // float at its heart; the hall is half in light and half in shadow.
  observatory5: {
    id: 'observatory5', name: 'The Orrery', theme: 'observatory', town: 'crag', dungeon: 'observatory',
    width: 1600, height: 420, groundY: G,
    platforms: [
      { x: 200, y: 300, w: 90, drift: { dx: 260, period: 8 } }, { x: 1100, y: 300, w: 90, drift: { dx: 260, period: 9 } },
      { x: 740, y: 230, w: 120 },
    ],
    ropes: [{ x: 800, top: 230, bottom: G }],
    look: { sky: ['#140e30', '#2e1e56', '#6a4a96'], far: '#1e1446', mid: '#2e2260', midTrim: '#ffd36b', ...STAR_IN, skyline: 'orrery' },
    eclipse: true,
    portals: [
      { id: 'west', x: 40, y: G, to: 'observatory4', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'observatory6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'eclipsesol', x: 680, y: G, pack: 'twins' }, { mob: 'eclipseluna', x: 920, y: G, pack: 'twins' }],
  },

  // The Telescope Crown: the open dome at the top of the tower, the great telescope pointing straight
  // up at stars that don't move. Astraea waits beneath it.
  observatory6: {
    id: 'observatory6', name: 'The Telescope Crown', theme: 'observatory', town: 'crag', dungeon: 'observatory',
    width: 1700, height: 420, groundY: G,
    platforms: [{ x: 240, y: 300, w: 90 }, { x: 560, y: 300, w: 90 }, { x: 1050, y: 300, w: 90 }, { x: 1370, y: 300, w: 90 }, { x: 800, y: 220, w: 100 }],
    // The telescope's ladder, up to its eyepiece (the room's secret).
    ropes: [{ x: 850, top: 220, bottom: G }],
    look: { sky: ['#06082a', '#1a1a5a', '#4a3a90'], far: '#121a4a', mid: '#1e2a66', midTrim: '#fff3a6', ...STAR_OUT, material: 'starstone' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'observatory5', toPortal: 'east' },
      { id: 'out', x: 1660, y: G, to: 'observatory_steps', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'astraea', x: 850, y: G }],
  },
});

// ---------- Candy Volcano (the levels 35-40 group dungeon, docs/design/candy-volcano.md) ----------
//
// Down a candy valley and the mines beneath it, then up the cone. Each room has an idea of its own
// (world/volcano.js runs them):
//   sticky     [{ x1, x2, y }]: sticky taffy that halves your pace
//   hotFloor   [[x1, x2]]: hot caramel on the ground floor there that burns
//   dispensers objects of kind 'dispenser' with a `colour`: the kitchen's recipe puzzle
//   lateFlood  the crater's caramel (its `flood`) only rises once the queen calls it

const SUGAR = { skyline: 'candy', material: 'candy', critters: ['butterfly'], drift: 'sprinkle', face: 'sun', light: 'dusk' };
const SUGAR_IN = { skyline: 'candycave', material: 'candy', critters: [], drift: 'sprinkle', face: null, light: 'cave' };

Object.assign(MAPS, {
  // The Sugar Trail: past the steam of Serpent Springs, a path of candy stones up to the foot of a
  // mountain that smells of caramel. Chef Praline finds groups here.
  sugar_trail: {
    id: 'sugar_trail', name: 'Sugar Trail', theme: 'candy', town: 'grove', world: { x: 270, y: 30 }, music: 'volcano',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#ff9ab8', '#ffc8a0', '#fff0c8'], far: '#e08aa8', mid: '#f0a8c0', midTrim: '#ffd36b', ...SUGAR },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'springs', toPortal: 'volcano' },
      { id: 'door', x: 1110, y: G, to: 'volcano1', toPortal: 'start', label: 'Candy Volcano', dungeon: 'volcano' },
    ],
    npcs: [{ id: 'praline', x: 860 }],
    spawns: [],
  },

  // The Gumdrop Valley: down from the ridge into a valley of gumdrop hills and up the far side.
  // Sticky taffy pools in the low ground; three sugar crystals to gather.
  volcano1: {
    id: 'volcano1', name: 'The Gumdrop Valley', theme: 'candy', town: 'grove', dungeon: 'volcano',
    ...lay({
      width: 2600, ground: 680,
      terrain: [[0, 520], [400, 520], [400, 600], [680, 600], [680, 680], [1900, 680], [1900, 600], [2200, 600], [2200, 520], [2600, 520]],
      ledges: [{ x: 900, y: 620, w: 260 }, { x: 1420, y: 620, w: 260 }, { x: 1150, y: 540, w: 300 }, { x: 1240, y: 430, w: 120 }],
      zones: [
        { name: 'The Gumdrop Hills', color: '#ff9ab8', mobs: [] },
        { name: 'The Taffy Hollow', color: '#ffd36b', from: 680, mobs: [] },
        { name: 'The Far Slope', color: '#9ae66a', from: 1900, mobs: [] },
      ],
    }),
    look: { sky: ['#ff9ab8', '#ffc8a0', '#fff0c8'], far: '#e08aa8', mid: '#f0a8c0', midTrim: '#ffd36b', ...SUGAR },
    task: { kind: 'light', object: 'crystal', label: 'Gather the sugar crystals' },
    sticky: [{ x1: 760, x2: 1060, y: 680 }, { x1: 1500, x2: 1840, y: 680 }],
    portals: [
      { id: 'out', x: 50, y: 520, to: 'sugar_trail', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 110, y: 520, hidden: true },
      { id: 'east', x: 2550, y: 520, to: 'volcano2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'crystal', x: 560, y: 600 }, { kind: 'crystal', x: 1300, y: 540 }, { kind: 'crystal', x: 2050, y: 600 }],
    npcs: [],
    spawns: [
      ...packAt('a', 300, 520, 'gummybear', 'cottoncandy'),
      ...packAt('b', 900, 680, 'gummybear', 'lollipopwitch', 'gummybear'),
      ...packAt('c', 1300, 680, 'cottoncandy', 'lollipopwitch', 'gummybear'),
      ...packAt('d', 1680, 680, 'lollipopwitch', 'gummybear', 'cottoncandy'),
      ...packAt('e', 2350, 520, 'gummybear', 'lollipopwitch'),
    ],
  },

  // The Licorice Mine: tunnels under the valley, licorice beams overhead, and a long pit of hot
  // caramel in the middle of the floor. Minecarts ride the rails across it; ledges run above.
  volcano2: {
    id: 'volcano2', name: 'The Licorice Mine', theme: 'candy', town: 'grove', dungeon: 'volcano',
    width: 2600, height: 420, groundY: G,
    platforms: [
      { x: 140, y: 300, w: 300 }, { x: 820, y: 300, w: 100, style: 'planks', drift: { dx: 420, period: 7 } }, { x: 1440, y: 300, w: 100, style: 'planks', drift: { dx: 420, period: 8 } },
      { x: 2100, y: 300, w: 360 }, { x: 1250, y: 220, w: 140 },
    ],
    ropes: [{ x: 1320, top: 220, bottom: G }],
    look: { sky: ['#3a1e2a', '#5a2e3e', '#8a4a5a'], far: '#3e2230', mid: '#5a3240', midTrim: '#ff7aa8', ...SUGAR_IN },
    hotFloor: [[700, 1950]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'volcano1', toPortal: 'east' },
      { id: 'east', x: 2560, y: G, to: 'volcano3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 360, G, 'chocoknight', 'jellyninja', 'chocoknight'),
      ...packAt('b', 300, 300, 'jellyninja', 'peppermint'),
      ...packAt('c', 2250, 300, 'peppermint', 'jellyninja'),
      ...packAt('d', 2250, G, 'chocoknight', 'peppermint', 'jellyninja'),
    ],
  },

  // The Candy Kitchen: a great kitchen on two floors around a bubbling cauldron. Four dispensers of
  // candy; add exactly what the recipe asks, and the oven door opens.
  volcano3: {
    id: 'volcano3', name: 'The Candy Kitchen', theme: 'candy', town: 'grove', dungeon: 'volcano',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 200, y: 300, w: 300 }, { x: 1100, y: 300, w: 300 }, { x: 720, y: 220, w: 160 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#4a2a3a', '#7a4a5a', '#c88a8a'], far: '#5a3040', mid: '#7a4656', midTrim: '#ffd36b', ...SUGAR_IN },
    task: { kind: 'light', object: 'dispenser', label: 'Cook the recipe' },
    cauldron: { x: 800 },
    portals: [
      { id: 'west', x: 40, y: G, to: 'volcano2', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'volcano4', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'dispenser', colour: 'red', x: 300, y: 300 }, { kind: 'dispenser', colour: 'yellow', x: 520, y: G },
      { kind: 'dispenser', colour: 'green', x: 1080, y: G }, { kind: 'dispenser', colour: 'blue', x: 1300, y: 300 },
    ],
    npcs: [],
    spawns: [...packAt('a', 300, G, 'lollipopwitch', 'peppermint', 'cottoncandy'), ...packAt('b', 1300, G, 'cottoncandy', 'jellyninja', 'lollipopwitch')],
  },

  // The Caramel Forge: a forge hall over cooling caramel, the anvil in the middle, bellows at the
  // back. Toffee is hammering.
  volcano4: {
    id: 'volcano4', name: 'The Caramel Forge', theme: 'candy', town: 'grove', dungeon: 'volcano',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 180, y: 300, w: 200 }, { x: 1220, y: 300, w: 200 }, { x: 720, y: 220, w: 160 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#4a1a1a', '#8a3a2a', '#e08a4a'], far: '#5a2420', mid: '#7a3a2a', midTrim: '#ffd36b', ...SUGAR_IN, skyline: 'forge' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'volcano3', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'volcano5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'toffee', x: 800, y: G }],
  },

  // The Gingerbread Ramparts: a long gingerbread wall-walk between candy towers, the volcano's cone
  // rising behind. Gretel holds the wall.
  volcano5: {
    id: 'volcano5', name: 'The Gingerbread Ramparts', theme: 'candy', town: 'grove', dungeon: 'volcano',
    width: 2000, height: 420, groundY: G,
    platforms: [{ x: 160, y: 300, w: 160 }, { x: 900, y: 300, w: 200 }, { x: 1680, y: 300, w: 160 }, { x: 950, y: 220, w: 100 }],
    ropes: [{ x: 1000, top: 220, bottom: G }],
    look: { sky: ['#ff8a6a', '#ffb88a', '#ffe8c0'], far: '#c86a5a', mid: '#e08a6a', midTrim: '#ffffff', ...SUGAR, skyline: 'ramparts', material: 'gingerbread', props: ['barrel', 'flower', 'crate', 'flower'] },
    portals: [
      { id: 'west', x: 40, y: G, to: 'volcano4', toPortal: 'east' },
      { id: 'east', x: 1960, y: G, to: 'volcano6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'gretel', x: 1000, y: G }],
  },

  // The Crater: islands of rock candy in a lake of caramel, the sky glowing. Queen Bonbon stirs it.
  volcano6: {
    id: 'volcano6', name: 'The Crater', theme: 'candy', town: 'grove', dungeon: 'volcano',
    width: 1700, height: 420, groundY: G,
    platforms: [
      { x: 160, y: 300, w: 160 }, { x: 520, y: 300, w: 140 }, { x: 1040, y: 300, w: 140 }, { x: 1380, y: 300, w: 160 },
      { x: 790, y: 220, w: 120 },
    ],
    ropes: [{ x: 850, top: 220, bottom: G }],
    look: { sky: ['#5a1a2a', '#c84a4a', '#ffb06a'], far: '#7a2a2a', mid: '#a04040', midTrim: '#ffd36b', ...SUGAR, skyline: 'crater', material: 'rockcandy', critters: [], props: ['crystal', 'rock', 'crystal'] },
    flood: { every: 18, warn: 3, last: 6, damage: 80, color: 'caramel', name: 'The caramel rises!' },
    lateFlood: true,
    portals: [
      { id: 'west', x: 40, y: G, to: 'volcano5', toPortal: 'east' },
      { id: 'out', x: 1660, y: G, to: 'sugar_trail', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'bonbon', x: 850, y: G }],
  },
});

// ---------- The Dream Theatre (levels 40-45, docs/design/dream-theatre.md) ----------
//
// A theatre floating on a cloud off the Sky Garden: the lobby, then a stage whose set changes act by
// act, then backstage, then the final curtain. Each room has an idea of its own (world/theatre.js):
//   spotlights [{ x, span, period }]: beams sweeping the floor; a monster caught in one takes more
//   rocking    { period, push }: the ship's deck rolls, sliding everyone on the floor one way then back
//   cannons    { every, damage }: cannon fire on marked spots round the group
//   cue lamps  objects of kind 'cue' with a `colour`: the forest act's sequence puzzle
//   mast       on a ledge: a lantern hangs there and swings with the deck's roll

const STAGE = { material: 'stage', critters: [], drift: 'sparkle', face: null, light: 'cave' };

Object.assign(MAPS, {
  // Theatre Row: a street of lamp posts and poster pillars on the clouds, the playhouse floating
  // beyond. Madame Encore finds groups here.
  theatre_row: {
    id: 'theatre_row', name: 'Theatre Row', theme: 'theatre', town: 'grove', world: { x: 362, y: 28 }, music: 'theatre',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#4a2a6a', '#a05a9a', '#ffb0a0'], far: '#6a3a7a', mid: '#8a4a7a', midTrim: '#ffd36b', skyline: 'theatre', material: 'stage', critters: [], drift: 'sparkle', face: 'moon', stars: true },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'sky', toPortal: 'theatre' },
      { id: 'door', x: 1110, y: G, to: 'theatre1', toPortal: 'start', label: 'Dream Theatre', dungeon: 'theatre' },
    ],
    npcs: [{ id: 'encore', x: 860 }],
    spawns: [],
  },

  // The Grand Lobby: a long lobby of carpeted floor, balconies above on gilt stairs, spotlights
  // sweeping from the chandeliers. Three lost tickets to find.
  theatre1: {
    id: 'theatre1', name: 'The Grand Lobby', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 2400, height: 420, groundY: G,
    platforms: [
      { x: 260, y: 300, w: 320 }, { x: 900, y: 300, w: 320 }, { x: 1540, y: 300, w: 320 },
      { x: 1080, y: 220, w: 140 }, { x: 2040, y: 300, w: 220 },
    ],
    ropes: [{ x: 1150, top: 220, bottom: G }, { x: 420, top: 300, bottom: G }, { x: 1700, top: 300, bottom: G }],
    look: { sky: ['#3a1a3a', '#6a2a4a', '#9a4a5a'], far: '#4a2038', mid: '#6a2a48', midTrim: '#ffd36b', ...STAGE, skyline: 'stagehall' },
    task: { kind: 'light', object: 'ticket', label: 'Find the lost tickets' },
    spotlights: [{ x: 600, span: 220, period: 7 }, { x: 1300, span: 260, period: 9 }, { x: 1950, span: 220, period: 8 }],
    portals: [
      { id: 'out', x: 50, y: G, to: 'theatre_row', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 110, y: G, hidden: true },
      { id: 'east', x: 2360, y: G, to: 'theatre2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'ticket', x: 700, y: G }, { kind: 'ticket', x: 1700, y: 300 }, { kind: 'ticket', x: 2150, y: 300 }],
    npcs: [],
    spawns: [
      ...packAt('a', 520, G, 'understudy', 'chorusgirl'),
      ...packAt('b', 420, 300, 'stagehand', 'understudy'),
      ...packAt('c', 1060, 300, 'chorusgirl', 'stagehand'),
      ...packAt('d', 1300, G, 'understudy', 'chorusgirl', 'stagehand'),
      ...packAt('e', 1700, 300, 'stagehand', 'chorusgirl'),
      ...packAt('f', 2000, G, 'chorusgirl', 'understudy', 'stagehand'),
    ],
  },

  // Act I: The Pirate Ship. A ship set on a rocking stage: masts and yards to climb, a crow's nest,
  // painted waves rolling in front. Cannons fire at marked spots.
  theatre2: {
    id: 'theatre2', name: 'Act I: The Pirate Ship', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 2200, height: 420, groundY: G,
    platforms: [
      { x: 200, y: 300, w: 260 }, { x: 760, y: 300, w: 240, mast: true }, { x: 1320, y: 300, w: 240, mast: true },
      { x: 820, y: 220, w: 120, mast: true }, { x: 1380, y: 220, w: 120 }, { x: 1820, y: 300, w: 240 },
    ],
    ropes: [{ x: 880, top: 220, bottom: G }, { x: 1440, top: 220, bottom: G }, { x: 330, top: 300, bottom: G }],
    look: { sky: ['#ff8a6a', '#ffb08a', '#ffe0a0'], far: '#5a3a5a', mid: '#7a4a5a', midTrim: '#ffd36b', ...STAGE, skyline: 'pirate' },
    rocking: { period: 7, push: 55 },
    cannons: { every: 9, damage: 190 },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre1', toPortal: 'east' },
      { id: 'east', x: 2160, y: G, to: 'theatre3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 420, G, 'stagehand', 'paperdragon'),
      ...packAt('b', 330, 300, 'understudy', 'stagehand'),
      ...packAt('c', 880, 300, 'chorusgirl', 'stagehand'),
      ...packAt('d', 1100, G, 'paperdragon', 'understudy', 'chorusgirl'),
      ...packAt('e', 1440, 300, 'stagehand', 'chorusgirl'),
      ...packAt('f', 1800, G, 'paperdragon', 'stagehand', 'understudy'),
    ],
  },

  // Act II: The Fairy Forest. Cardboard trees under a paper moon; four coloured cue lamps at the
  // edge of the stage. Watch the sequence they flash, then play it back.
  theatre3: {
    id: 'theatre3', name: 'Act II: The Fairy Forest', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 200, y: 300, w: 280 }, { x: 1120, y: 300, w: 280 }, { x: 720, y: 220, w: 160 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#1e2a4a', '#2a4a5a', '#4a7a6a'], far: '#22384a', mid: '#2e4a50', midTrim: '#8ff0c8', ...STAGE, skyline: 'fairy' },
    task: { kind: 'light', object: 'cue', label: 'Play back the cues' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre2', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'theatre4', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'cue', colour: 'rose', x: 340, y: 300 }, { kind: 'cue', colour: 'gold', x: 620, y: G },
      { kind: 'cue', colour: 'mint', x: 980, y: G }, { kind: 'cue', colour: 'violet', x: 1260, y: 300 },
    ],
    npcs: [],
    spawns: [...packAt('a', 300, G, 'prompter', 'primadonna', 'chorusgirl'), ...packAt('b', 1300, G, 'primadonna', 'prompter', 'understudy')],
  },

  // Act III: The Masked Ball. A ballroom set of mirrors and chandeliers; Persona dances alone.
  theatre4: {
    id: 'theatre4', name: 'Act III: The Masked Ball', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 180, y: 300, w: 200 }, { x: 1220, y: 300, w: 200 }, { x: 720, y: 220, w: 160 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#2a1a4a', '#5a3a7a', '#a07ab0'], far: '#3a2450', mid: '#5a3a6a', midTrim: '#ffd36b', ...STAGE, skyline: 'ballroom' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre3', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'theatre5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'persona', x: 800, y: G }],
  },

  // Backstage: ropes, sandbags and stacked flats. Madame Directrice runs the show from here.
  theatre5: {
    id: 'theatre5', name: 'Backstage', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1800, height: 420, groundY: G,
    platforms: [{ x: 160, y: 300, w: 180 }, { x: 800, y: 300, w: 200 }, { x: 1460, y: 300, w: 180 }, { x: 850, y: 220, w: 100 }],
    ropes: [{ x: 900, top: 220, bottom: G }, { x: 250, top: 300, bottom: G }, { x: 1550, top: 300, bottom: G }],
    look: { sky: ['#1a1a24', '#2a2a3a', '#4a3a4a'], far: '#24202e', mid: '#3a3040', midTrim: '#ffd36b', ...STAGE, skyline: 'backstage' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre4', toPortal: 'east' },
      { id: 'east', x: 1760, y: G, to: 'theatre6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'directrice', x: 900, y: G }],
  },

  // The Final Curtain: the great stage under a star cloth, velvet curtains drawn back. The Phantom
  // Playwright waits at his desk.
  theatre6: {
    id: 'theatre6', name: 'The Final Curtain', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1800, height: 420, groundY: G,
    platforms: [
      { x: 160, y: 300, w: 160 }, { x: 560, y: 300, w: 140 }, { x: 1100, y: 300, w: 140 }, { x: 1480, y: 300, w: 160 },
      { x: 840, y: 220, w: 120 },
    ],
    ropes: [{ x: 900, top: 220, bottom: G }],
    look: { sky: ['#140e2a', '#2a1a4a', '#5a2a5a'], far: '#1e1434', mid: '#3a1e44', midTrim: '#ffd36b', ...STAGE, skyline: 'greatstage' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre5', toPortal: 'east' },
      { id: 'out', x: 1760, y: G, to: 'theatre_row', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'playwright', x: 900, y: G }],
  },
});
// ---------- The Sky Whale's Back (levels 45-50, docs/design/sky-whale.md) ----------
//
// A town on a giant whale swimming through the sky, crossed from tail to brow. Each room has an idea
// of its own (world/skywhale.js):
//   tailflip  { every, push }: the tail flips; after a warning everyone on the ground floor slides
//   gusts     { every, dur, push }: the wind shoves everyone one way for a few seconds
//   geysers   [{ x, w, every, up }]: blowholes erupting on a beat, throwing you `up` px high
//   breath    { period, pull }: the lungs breathe in (a pull to the middle) and out (a push outward)
//   moorings and air-blooms: objects of kind 'mooring' and 'airbloom' (blooms open on the breath out)

const WHALE = { skyline: 'whaleback', material: 'whaleskin', critters: ['gull'], drift: 'sparkle', face: 'sun' };

Object.assign(MAPS, {
  // Cloudcatch Pier: a wooden pier off the east rim of Starfall Heights, the whale swimming close
  // beyond the clouds. Skipper Nimbus finds groups here.
  cloudcatch_pier: {
    id: 'cloudcatch_pier', name: 'Cloudcatch Pier', theme: 'skywhale', town: 'grove', world: { x: 400, y: 30 }, music: 'skywhale',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#5a9ae0', '#9fd0ff', '#fff0d8'], far: '#8ab8e8', mid: '#b8d8f6', midTrim: '#ffffff', skyline: 'whale', material: 'dockwood', critters: ['gull'], drift: 'sparkle', face: 'sun' },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'starfall', toPortal: 'whale' },
      { id: 'door', x: 1110, y: G, to: 'skywhale1', toPortal: 'start', label: "Sky Whale's Back", dungeon: 'skywhale' },
    ],
    npcs: [{ id: 'nimbus', x: 860 }],
    spawns: [],
  },

  // The Tail Docks: long docks built along the whale's tail, crates and moorings. The tail flips.
  skywhale1: {
    id: 'skywhale1', name: 'The Tail Docks', theme: 'skywhale', town: 'grove', dungeon: 'skywhale',
    width: 2400, height: 420, groundY: G,
    platforms: [
      { x: 240, y: 300, w: 300 }, { x: 900, y: 300, w: 320 }, { x: 1600, y: 300, w: 300 },
      { x: 1180, y: 220, w: 140 }, { x: 2040, y: 300, w: 240 },
    ],
    ropes: [{ x: 390, top: 300, bottom: G }, { x: 1250, top: 220, bottom: G }, { x: 1750, top: 300, bottom: G }, { x: 2160, top: 300, bottom: G }],
    look: { sky: ['#5a9ae0', '#9fd0ff', '#fff0d8'], far: '#8ab8e8', mid: '#b8d8f6', midTrim: '#ffffff', ...WHALE, skyline: 'tail', material: 'dockwood' },
    task: { kind: 'light', object: 'mooring', label: 'Tie down the moorings' },
    tailflip: { every: 13, push: 150 },
    portals: [
      { id: 'out', x: 50, y: G, to: 'cloudcatch_pier', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 110, y: G, hidden: true },
      { id: 'east', x: 2360, y: G, to: 'skywhale2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'mooring', x: 600, y: G }, { kind: 'mooring', x: 1060, y: 300 }, { kind: 'mooring', x: 2000, y: G }],
    npcs: [],
    spawns: [
      ...packAt('a', 420, G, 'kiterider', 'shepherdess'),
      ...packAt('b', 390, 300, 'gunner', 'kiterider'),
      ...packAt('c', 1060, 300, 'shepherdess', 'gunner'),
      ...packAt('d', 1300, G, 'kiterider', 'shepherdess', 'gunner'),
      ...packAt('e', 1750, 300, 'gunner', 'kiterider'),
      ...packAt('f', 1900, G, 'shepherdess', 'kiterider', 'gunner'),
    ],
  },

  // The Spine Market: tents and stalls along the whale's spine, blowholes in the street, gusts.
  skywhale2: {
    id: 'skywhale2', name: 'The Spine Market', theme: 'skywhale', town: 'grove', dungeon: 'skywhale',
    width: 2600, height: 420, groundY: G,
    platforms: [
      { x: 200, y: 300, w: 280 }, { x: 760, y: 300, w: 220 }, { x: 1240, y: 300, w: 240 }, { x: 1760, y: 300, w: 220 }, { x: 2200, y: 300, w: 260 },
      { x: 1300, y: 210, w: 120 },
    ],
    ropes: [{ x: 340, top: 300, bottom: G }, { x: 1360, top: 210, bottom: G }, { x: 2330, top: 300, bottom: G }],
    look: { sky: ['#4a8ad8', '#8ac8ff', '#ffe8d0'], far: '#7aa8e0', mid: '#a8ccf0', midTrim: '#ffd36b', ...WHALE, skyline: 'market' },
    gusts: { every: 11, dur: 3, push: 70 },
    geysers: [{ x: 700, w: 54, every: 6, up: 170 }, { x: 1700, w: 54, every: 7, up: 170 }],
    portals: [
      { id: 'west', x: 40, y: G, to: 'skywhale1', toPortal: 'east' },
      { id: 'east', x: 2560, y: G, to: 'skywhale3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 400, G, 'gunner', 'monk'),
      ...packAt('b', 340, 300, 'harpist', 'kiterider'),
      ...packAt('c', 1000, G, 'monk', 'harpist', 'gunner'),
      ...packAt('d', 1360, 300, 'kiterider', 'monk'),
      ...packAt('e', 2000, G, 'harpist', 'gunner', 'monk'),
      ...packAt('f', 2330, 300, 'monk', 'harpist'),
    ],
  },

  // The Lung Gardens: a greenhouse of glowing ribs inside the whale, which breathes. Three air-blooms
  // open only on the breath out.
  skywhale3: {
    id: 'skywhale3', name: 'The Lung Gardens', theme: 'skywhale', town: 'grove', dungeon: 'skywhale',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 200, y: 300, w: 280 }, { x: 1120, y: 300, w: 280 }, { x: 720, y: 220, w: 160 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#3a5a8a', '#6a9ac8', '#c8e8f6'], far: '#4a6a98', mid: '#6a8ab8', midTrim: '#9fe8ff', ...WHALE, skyline: 'lungs', face: null, light: 'cave', critters: [] },
    task: { kind: 'light', object: 'airbloom', label: 'Tend the air-blooms' },
    breath: { period: 10, pull: 45 },
    portals: [
      { id: 'west', x: 40, y: G, to: 'skywhale2', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'skywhale4', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'airbloom', x: 320, y: 300 }, { kind: 'airbloom', x: 800, y: G }, { kind: 'airbloom', x: 1260, y: 300 }],
    npcs: [],
    spawns: [...packAt('a', 340, G, 'shepherdess', 'monk', 'harpist'), ...packAt('b', 1260, G, 'harpist', 'shepherdess', 'monk')],
  },

  // The Blowhole Deck: a pirate airship moored over the great blowhole. Captain Gale's ship.
  skywhale4: {
    id: 'skywhale4', name: 'The Blowhole Deck', theme: 'skywhale', town: 'grove', dungeon: 'skywhale',
    width: 1700, height: 420, groundY: G,
    platforms: [{ x: 160, y: 300, w: 200 }, { x: 1340, y: 300, w: 200 }, { x: 620, y: 230, w: 120 }, { x: 960, y: 230, w: 120 }],
    ropes: [{ x: 260, top: 300, bottom: G }, { x: 1440, top: 300, bottom: G }, { x: 650, top: 230, bottom: G }, { x: 1050, top: 230, bottom: G }],
    look: { sky: ['#4a7ad0', '#8ab8f0', '#ffe0c0'], far: '#6a90d0', mid: '#98c0ec', midTrim: '#ffffff', ...WHALE, skyline: 'deck', material: 'dockwood' },
    geysers: [{ x: 850, w: 80, every: 9, up: 190 }],
    portals: [
      { id: 'west', x: 40, y: G, to: 'skywhale3', toPortal: 'east' },
      { id: 'east', x: 1660, y: G, to: 'skywhale5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'gale', x: 850, y: G }],
  },

  // The Barnacle Fortress: walls of shell and coral grown over the whale's back.
  skywhale5: {
    id: 'skywhale5', name: 'The Barnacle Fortress', theme: 'skywhale', town: 'grove', dungeon: 'skywhale',
    width: 1800, height: 420, groundY: G,
    platforms: [{ x: 160, y: 300, w: 180 }, { x: 800, y: 300, w: 200 }, { x: 1460, y: 300, w: 180 }, { x: 850, y: 220, w: 100 }],
    ropes: [{ x: 900, top: 220, bottom: G }, { x: 250, top: 300, bottom: G }, { x: 1550, top: 300, bottom: G }],
    look: { sky: ['#3a6ab0', '#7aa8e0', '#d8f0f0'], far: '#5a80b8', mid: '#7aa0c8', midTrim: '#ffd8e2', ...WHALE, skyline: 'fortress' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'skywhale4', toPortal: 'east' },
      { id: 'east', x: 1760, y: G, to: 'skywhale6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'matriarch', x: 900, y: G }],
  },

  // The Whale's Brow: the top of its head, open to the wind above the clouds.
  skywhale6: {
    id: 'skywhale6', name: "The Whale's Brow", theme: 'skywhale', town: 'grove', dungeon: 'skywhale',
    width: 1800, height: 420, groundY: G,
    platforms: [
      { x: 160, y: 300, w: 160 }, { x: 560, y: 300, w: 140 }, { x: 1100, y: 300, w: 140 }, { x: 1480, y: 300, w: 160 },
      { x: 840, y: 220, w: 120 },
    ],
    ropes: [{ x: 900, top: 220, bottom: G }],
    look: { sky: ['#2a3a7a', '#7a6ac8', '#ffc8a0'], far: '#4a5aa0', mid: '#6a7ac0', midTrim: '#fff3a6', ...WHALE, skyline: 'brow', stars: true },
    gusts: { every: 13, dur: 2.5, push: 60 },
    portals: [
      { id: 'west', x: 40, y: G, to: 'skywhale5', toPortal: 'east' },
      { id: 'out', x: 1760, y: G, to: 'cloudcatch_pier', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'whaledream', x: 900, y: G }],
  },
});

MAPS.sky.portals.push({ id: 'theatre', x: 2800, y: 1040, to: 'theatre_row', toPortal: 'west', label: 'Theatre Row' });

// ---------- The far regions (levels 19-50) ----------
//
// Off the ring road: the Whispering Glade past Mossy Woods, the Fox Shrine Path past the Twilight
// Ruins, Moonlit Ridge above Ember Crag, and the climb from the Crystal Cave through Serpent
// Springs and Frozen Peak to the Sky Garden, with Starfall Heights over its top.

// `n` monsters evenly along a surface from x1 to x2 at height y, taking turns from `mobs`.
const along = (y, x1, x2, n, ...mobs) => Array.from({ length: n }, (_, i) => ({ mob: mobs[i % mobs.length], x: Math.round(x1 + ((i + 0.5) / n) * (x2 - x1)), y }));

MAPS.woods.portals.push({ id: 'glade', x: 1250, y: 440, to: 'glade', toPortal: 'west', label: 'Whispering Glade' });
// The way to the shrine leads off the collapsed halls.
MAPS.ruins.portals.push({ id: 'shrine', x: 2380, y: 700, to: 'shrine', toPortal: 'west', label: 'Fox Shrine Path' });
// The tunnel to the springs leaves from the cave's east rim.
MAPS.cave.portals.push({ id: 'springs', x: 2540, y: 600, to: 'springs', toPortal: 'west', label: 'Serpent Springs' });

Object.assign(MAPS, {
  // The Whispering Glade is a walk across, side by side (data/climb.js lay()): the Flower Meadow in
  // the west, low and rolling among giant flowers, where blossoms bounce you up; the Waterfall Pool
  // in the middle, where the falls pour down a cliff into a sunken pool you can wade, behind a mossy
  // bank no Treant climbs (the fishing dock juts from the bank over the water, a quiet nook of its
  // own) and the mist floats you up the cliff; and the Sylph Grove on the high plateau to the east,
  // where Sylvana roams, treetop ledges with a leaf drifting between them, and her Bower at the far
  // end of the glade.
  glade: {
    id: 'glade', name: 'Whispering Glade', theme: 'forest', town: 'harbor', world: { x: 278, y: 160 },
    look: { sky: ['#8fe0d0', '#d2f4e2', '#fffbe0'], far: '#8fd6b4', mid: '#6cc498', midTrim: '#4fae7f', light: 'morning', edges: 'flowers', props: ['flower', 'chime', 'tuft', 'bush', 'tulip', 'flower'], drift: 'leaf', rainbow: 0.3, islands: 'branch' },
    ...lay({
      width: 2400, ground: 880, by: 'x',
      // The meadow, the mossy bank (a step up), the pool's bed sunk below it, and the cliff.
      terrain: [[0, 880], [720, 880], [720, 840], [800, 840], [800, 920], [1000, 920], [1000, 640], [2400, 640]],
      ropes: [{ x: 990, top: 640, bottom: 920 }],
      quiet: [[40, 880, 160], [900, 920, 300], [760, 840, 100], [900, 800, 260], [900, 720, 260], [2340, 640, 160]],
      zones: [
        { name: 'Flower Meadow', color: '#e889b4', from: 0, mobs: ['mossgolem', 'sylph'], nodes: [SPOT.fruit(2, 'whisperberry'), SPOT.fiber(2)] },
        { name: 'Waterfall Pool', color: '#4fb0d8', from: 800, mobs: ['sylph'], nodes: [SPOT.ore(2)],
          look: { sky: ['#9fe4f0', '#d8f4f6', '#fffbe8'], far: '#9fd8c8', mid: '#7fc8b0' } },
        { name: 'Sylph Grove', color: '#6fae5f', from: 1300, mobs: ['sylph', 'mossgolem'], nodes: [SPOT.honey(2), SPOT.wood(2), SPOT.fruit(2, 'whisperberry'), SPOT.night(2)],
          look: { sky: ['#b8ecd8', '#e2f8e8', '#fffbe6'], far: '#b0e4c4', mid: '#90d4a8' } },
      ],
      ledges: [
        // The Flower Meadow: low flower ledges.
        { x: 150, y: 800, w: 260 }, { x: 300, y: 720, w: 240 }, { x: 600, y: 640, w: 200 },
        // The Waterfall Pool: steps up beside the falls, and the fishing dock off the bank.
        { x: 450, y: 800, w: 240 }, { x: 650, y: 720, w: 240 },
        { x: 796, y: 840, w: 104, posts: true, walkOn: true },
        // The Sylph Grove: treetop ledges over the plateau.
        { x: 1200, y: 560, w: 300 }, { x: 1600, y: 480, w: 320 }, { x: 2000, y: 560, w: 280 },
        { x: 1400, y: 400, w: 280 }, { x: 1850, y: 320, w: 300 },
        // The leaf drifting between the treetops.
        { x: 1510, y: 560, w: 120, drift: { dx: 360, period: 9 } },
      ],
    }),
    // A moving part per zone: blossoms bouncing you up in the meadow, the waterfall's mist floating
    // you up the cliff (Up to ride it), and the drifting leaf in the grove.
    springs: [{ x: 420, y: 880, up: 170, kind: 'blossom' }],
    updrafts: [{ x: 955, w: 50, top: 610, bottom: 920, kind: 'mist' }],
    // The pool under the falls, waist-deep on its bed.
    water: [{ x1: 800, x2: 1000, y: 894, kind: 'spring' }],
    portals: [{ id: 'west', x: 40, y: 880, to: 'woods', toPortal: 'glade' }],
    npcs: [],
    // A landmark per zone: the giant flowers in the meadow, the waterfall and its pool, the great
    // tree in the grove.
    deco: [['giantflower', 260, 0], ['giantflower', 640, 2], ['waterfall', 958, 240, 894], ['bigtree', 1680, 1, 640], ['giantflower', 2150, 1, 640]],
    lamps: [{ x: 900, y: 810 }, { x: 1700, y: 600 }, { x: 2300, y: 610 }],
    spirit: { x: 2200, y: 400 },
    habitats: { sylph: { play: true, naps: true }, mossgolem: { naps: true, home: { x: 260, y: 880 } } },
  },



  // The Fox Shrine Path climbs a sacred hill in three zones (the tall-map rules, a light rework,
  // data/climb.js): the Torii Steps, where the Nekomata lounge under the great gates and blossoms
  // bounce you up; the Lantern Terraces, where foxfire rises to carry you higher; and the Hokora
  // Heights, the Kitsune Miko's terraces, with a petal cloud drifting across the gap and the shrine
  // on the top terrace, where the way into Tamamo's Sanctum opens at the end of the path.
  shrine: {
    id: 'shrine', name: 'Fox Shrine Path', theme: 'shrine', town: 'grove', world: { x: 378, y: 86 },
    ...climb({
      width: 2600, ground: 880, quiet: [[40, 880, 160]],
      zones: [
        { name: 'Torii Steps', color: '#e0504a', rows: ['split', 'long'], mobs: ['nekomata'], nodes: [SPOT.wood(3), SPOT.fruit(3, 'shrine_plum')] },
        { name: 'Lantern Terraces', color: '#e0a040', rows: ['splitwide', 'tri', 'long'], mobs: ['nekomata', 'kitsunemiko'], nodes: [SPOT.fruit(3, 'cherry'), SPOT.wood(3), SPOT.fruit(3, 'shrine_plum')],
          look: { sky: ['#ffb8a8', '#ffd8c8', '#fff0e4'] } },
        { name: 'Hokora Heights', color: '#8f6cc4', rows: ['split', 'middle'], mobs: ['kitsunemiko'], nodes: [SPOT.ore(3), SPOT.night(3)],
          look: { sky: ['#c8a8e0', '#e8d0f0', '#fff0f4'] } },
      ],
    }),
    // A moving part per zone: blossoms that bounce you up the steps, foxfire rising through the
    // terraces (Up to ride it), and a petal cloud drifting across the heights' gap.
    springs: [{ x: 1300, y: 880, up: 170, kind: 'blossom' }],
    updrafts: [{ x: 1180, w: 56, top: 450, bottom: 720, kind: 'foxfire' }],
    portals: [{ id: 'west', x: 40, y: 880, to: 'ruins', toPortal: 'shrine' }],
    npcs: [],
    // A landmark per zone: the three great gates on the steps, the cherry trees on the terraces,
    // the hokora shrine on the top terrace.
    deco: [['torii', 380], ['foxstatue', 290, 0], ['foxstatue', 470, 1], ['torii', 1220], ['foxstatue', 1130, 0], ['foxstatue', 1310, 1], ['torii', 1900], ['foxstatue', 1820, 0], ['foxstatue', 1980, 1],
      ['sakura', 700, 0, 480], ['sakura', 1860, 1, 480], ['hokora', 1200, 0, 240]],
    lamps: [{ x: 1200, y: 200 }, { x: 700, y: 440 }, { x: 1220, y: 850 }],
    spirit: { x: 1700, y: 200 },
    habitats: { nekomata: { naps: true, play: true, home: { x: 1220, y: 880 } }, kitsunemiko: { naps: true } },
  },


  // Moonlit Ridge is a walk along a ridgeline, side by side (data/climb.js lay()): the ground itself
  // rises and falls. The Moonlit Meadow in the west, a low saddle among the moonstones where a
  // moonbeam lifts you; the Wolf Den on the rocky knoll and the dip beyond it, the Lupina's home,
  // with a ledge drifting over the dip; and the Howling Rock in the east, the high summit where
  // fallen stars have woken as Meteor Golems (the observatory's road leaves from it), and a vent
  // bounces you up onto the great howling rock itself.
  ridge: {
    id: 'ridge', name: 'Moonlit Ridge', theme: 'ridge', town: 'crag', world: { x: 246, y: 104 },
    ...lay({
      width: 2400, ground: 880, by: 'x',
      terrain: [[0, 880], [600, 880], [600, 760], [1000, 760], [1000, 840], [1400, 840], [1400, 700], [1800, 700], [1800, 560], [2400, 560]],
      // Ropes down each rock face, hanging beside it from the top.
      ropes: [{ x: 590, top: 760, bottom: 880 }, { x: 1010, top: 760, bottom: 840 }, { x: 1390, top: 700, bottom: 840 }, { x: 1790, top: 560, bottom: 700 }],
      quiet: [[40, 880, 160]],
      zones: [
        { name: 'Moonlit Meadow', color: '#6a8ad0', from: 0, mobs: ['lupina'], nodes: [SPOT.herb(3, 'moon_thyme'), SPOT.wood(3)] },
        { name: 'Wolf Den', color: '#8a7ab0', from: 600, mobs: ['lupina', 'meteorgolem'], nodes: [SPOT.ore(3), SPOT.ore(3, { gem: 0.16 })],
          look: { sky: ['#2a2e6a', '#4a4e8a', '#8a8ac0'] } },
        { name: 'Howling Rock', color: '#a8b8e0', from: 1400, mobs: ['meteorgolem', 'lupina'], nodes: [SPOT.herb(3, 'moon_thyme'), SPOT.night(3)],
          look: { sky: ['#1e2058', '#3a3c7a', '#6a6aa8'] } },
      ],
      ledges: [
        // The meadow's rocks.
        { x: 150, y: 800, w: 300 }, { x: 250, y: 720, w: 260 },
        // Ledges on the den's knoll, and over the dip.
        { x: 650, y: 680, w: 300 }, { x: 800, y: 600, w: 260 }, { x: 1080, y: 760, w: 260 },
        // The rise, the howling rock on the summit, and a perch above it.
        { x: 1450, y: 620, w: 280 },
        { x: 2000, y: 480, w: 300 }, { x: 2100, y: 400, w: 200 },
        // The ledge drifting over the dip.
        { x: 1010, y: 700, w: 120, drift: { dx: 260, period: 9 } },
      ],
    }),
    // A moving part per zone: a moonbeam rising in the meadow (Up to ride it), the ledge drifting
    // over the dip, and a vent up onto the howling rock.
    updrafts: [{ x: 520, w: 50, top: 690, bottom: 880, kind: 'wisplight' }],
    springs: [{ x: 2060, y: 560, up: 120, kind: 'gust' }],
    portals: [{ id: 'west', x: 40, y: 880, to: 'crag', toPortal: 'ridge' }],
    npcs: [],
    // A landmark per zone: the moonstones in the meadow, a howling rock on the knoll, the great
    // howling rock on the summit.
    deco: [['moonstone', 400], ['moonstone', 1200, 0, 840], ['howlrock', 800, 0, 760], ['howlrock', 2150, 0, 480], ['moonstone', 1650, 1, 700]],
    lamps: [{ x: 400, y: 850 }, { x: 800, y: 720 }, { x: 2150, y: 440 }],
    spirit: { x: 1700, y: 480 },
    habitats: { lupina: { play: true, home: { x: 800, y: 760 } }, meteorgolem: { naps: true } },
  },



  // Serpent Springs climbs a steaming mountainside in three zones (the tall-map rules, a light
  // rework, data/climb.js): the Hot Spring Pools, where the Lamias bask and steam lifts you up; the
  // Waterfall Steps, with a ledge drifting across the gap and, behind the waterfall, the way into
  // Lilith's Rose Grotto; and the Steam Heights, the Wraiths' crags, where steam vents bounce you up
  // to the lookout and the road on to Frozen Peak. The hot-spring fishing spot is in the quiet east
  // corner with a dock of its own.
  springs: {
    id: 'springs', name: 'Serpent Springs', theme: 'springs', town: 'grove', world: { x: 256, y: 40 },
    ...climb({
      width: 2400, ground: 880, quiet: [[40, 880, 160], [2200, 880, 320], [2200, 800, 260], [2200, 720, 260], [1560, 560, 200]],
      zones: [
        { name: 'Hot Spring Pools', color: '#e0705a', rows: ['wide', 'split'], mobs: ['lamia'], nodes: [SPOT.herb(3, 'steam_ginger'), SPOT.fiber(3)] },
        { name: 'Waterfall Steps', color: '#4fb0d8', rows: ['tri', 'long', 'splitwide'], mobs: ['lamia', 'shade'], nodes: [SPOT.ore(3), SPOT.wood(3), SPOT.fiber(3)],
          look: { sky: ['#9fd8e8', '#cfeef0', '#fff4ea'] } },
        { name: 'Steam Heights', color: '#8a86b0', rows: ['split', 'middle'], mobs: ['shade', 'lamia'], nodes: [SPOT.herb(3, 'steam_ginger'), SPOT.night(3)],
          look: { sky: ['#c8c4e0', '#e4e0f0', '#fff4f0'] } },
      ],
    }),
    // A moving part per zone: steam rising off the pools (Up to ride it), a ledge drifting across
    // the steps' gap, and steam vents in the heights.
    updrafts: [{ x: 1050, w: 56, top: 610, bottom: 880, kind: 'mist' }],
    springs: [{ x: 960, y: 480, up: 175, kind: 'gust' }],
    portals: [
      { id: 'west', x: 40, y: 880, to: 'cave', toPortal: 'springs' },
      { id: 'east', x: 1350, y: 240, to: 'peak', toPortal: 'west' },
    ],
    npcs: [],
    // A landmark per zone: the hot springs on the pools floor (the east one with the fishing dock),
    // the waterfall on the steps, a spring at the top.
    deco: [['hotspring', 860], ['hotspring', 1620], ['waterfall', 1500, 80, 560], ['hotspring', 1100, 0, 240]],
    lamps: [{ x: 2150, y: 840 }, { x: 1500, y: 520 }, { x: 1100, y: 200 }],
    spirit: { x: 1600, y: 200 },
    habitats: { lamia: { naps: true, home: { x: 860, y: 880 } }, shade: { play: true } },
  },


  // Frozen Peak is a descent (data/climb.js lay()): you arrive on the windswept Summit, where the
  // Yuki-onna drift in the snow and a frost vent bounces you up to the lookout, and work your way
  // down the Icefall Crevasse, ice ledges zig-zagging down its walls with a floe drifting across the
  // gap and a howling wind to ride back up, to the Frozen Lake at the bottom, the Pegasus Foals'
  // snowfield, with an ice-fishing dock in its quiet corner and the way out to the Sky Garden's sea
  // of cloud.
  peak: {
    id: 'peak', name: 'Frozen Peak', theme: 'snow', town: 'grove', world: { x: 312, y: 18 },
    ...lay({
      width: 2200, ground: 1120, by: 'y', quiet: [[40, 280, 200], [2140, 1120, 160], [1950, 1120, 320], [1990, 1136, 160], [1950, 1040, 260], [2000, 960, 260]],
      // The frozen lake lies sunk in the snowfield in the quiet east corner, behind snowy lips.
      terrain: [[0, 1120], [1840, 1120], [1840, 1112], [1880, 1112], [1880, 1136], [2100, 1136], [2100, 1120], [2200, 1120]],
      zones: [
        { name: 'Frozen Lake', color: '#7ab8e8', mobs: ['cloudsheep', 'yukionna'], nodes: [SPOT.fruit(4, 'snow_peach'), SPOT.ore(4)] },
        { name: 'Icefall Crevasse', color: '#8f8ad0', from: 760, mobs: ['yukionna', 'cloudsheep'], nodes: [SPOT.ore(4), SPOT.ore(4, { gem: 0.3, night: true })],
          look: { sky: ['#9fb8e8', '#c8d8f4', '#eef4ff'] } },
        { name: 'Summit', color: '#e8f4ff', from: 480, mobs: ['yukionna'], nodes: [SPOT.ore(4, { gem: 0.2 }), SPOT.ore(4), SPOT.fruit(4, 'snow_peach')],
          look: { sky: ['#6a8ad0', '#a8c4f0', '#f0f6ff'] } },
      ],
      ledges: [
        // The Summit: the plateau you arrive on, and its lookout.
        { x: 0, y: 280, w: 560 }, { x: 640, y: 340, w: 420 }, { x: 1140, y: 300, w: 380 },
        { x: 760, y: 220, w: 300, thick: 44 },
        // The Icefall Crevasse, zig-zagging down.
        { x: 1500, y: 420, w: 480 }, { x: 1100, y: 500, w: 420 }, { x: 500, y: 580, w: 520 },
        { x: 150, y: 660, w: 400 }, { x: 620, y: 740, w: 500 }, { x: 1200, y: 800, w: 520 },
        { x: 1700, y: 880, w: 420 }, { x: 1150, y: 960, w: 440 }, { x: 500, y: 1040, w: 520 },
        // The ice floe drifting across the crevasse.
        { x: 1040, y: 660, w: 130, drift: { dx: 300, period: 10 } },
      ],
    }),
    // A moving part per zone: a frost vent on the summit, the drifting floe in the crevasse, and a
    // howling wind up from the lake (Up to ride it).
    springs: [{ x: 1040, y: 340, up: 160, kind: 'gust' }],
    updrafts: [{ x: 1050, w: 56, top: 470, bottom: 1120, kind: 'gust' }],
    // The lake's ice (drawn as a frozen sheet: you stand on it and fish through a hole).
    water: [{ x1: 1880, x2: 2100, y: 1136, kind: 'ice' }],
    portals: [
      { id: 'west', x: 40, y: 280, to: 'springs', toPortal: 'east' },
      { id: 'east', x: 2140, y: 1120, to: 'sky', toPortal: 'peak' },
    ],
    npcs: [],
    // A landmark per zone: the great pine on the summit, a snowman on the crevasse ledges, the
    // snowmen and pines round the frozen lake.
    deco: [['snowpine', 420, 0, 280], ['snowman', 900, 0, 740], ['snowman', 640], ['snowpine', 1000, 1], ['snowpine', 1480, 0], ['snowman', 1700]],
    lamps: [{ x: 900, y: 180 }, { x: 1950, y: 1100 }, { x: 900, y: 710 }],
    spirit: { x: 1800, y: 300 },
    habitats: { yukionna: { play: true, naps: true }, cloudsheep: { naps: true, home: { x: 640, y: 1120 } } },
  },


  // Starfall Heights is a valley (data/climb.js lay(), its zones side by side): you arrive high on
  // the West Rim, where the Sky Harpies wheel and a star pool by its lower steps is a quiet place to
  // fish; step down the cliff terraces into the Fallen Star Crater, where the Star Seraphs gather
  // round the fallen stars, Selene walks, and starlight rises to lift you; and climb out up the
  // East Rim to the high island where the way to the Moon Terrace opens. A star-cloud ferry glides
  // the whole width of the valley, rim to rim.
  starfall: {
    id: 'starfall', name: 'Starfall Heights', theme: 'sky', music: 'starfall', town: 'grove', world: { x: 390, y: 34 },
    look: { sky: ['#1d1b48', '#4a3f8c', '#a68ad6'], sun: '#e6dcff', far: '#5a4f9e', mid: '#6a5fa8', midTrim: '#8a7cc8', face: 'moon', stars: true, shooting: true, rainbow: 0, light: 'starfall', material: 'starcloud', props: ['cloudpuff', 'star', 'flower', 'cloudpuff'], drift: 'sparkle', ground: '#e6e0fa', groundDeep: '#c4b8ec', ledge: '#ece6ff', ledgeShade: '#c4b8ec' },
    ...lay({
      width: 2600, ground: 1040, by: 'x',
      terrain: [[0, 520], [460, 520], [460, 640], [760, 640], [760, 800], [846, 800], [870, 840], [950, 840], [974, 800], [1000, 800], [1000, 1040], [1600, 1040], [1600, 800], [1840, 800], [1840, 640], [2140, 640], [2140, 520], [2600, 520]],
      // Ropes down each cliff step, hanging beside the wall from its top.
      ropes: [{ x: 470, top: 520, bottom: 640 }, { x: 770, top: 640, bottom: 800 }, { x: 1010, top: 800, bottom: 1040 }, { x: 1590, top: 800, bottom: 1040 }, { x: 1830, top: 640, bottom: 800 }, { x: 2130, top: 520, bottom: 640 }],
      quiet: [[40, 520, 200], [880, 800, 260], [910, 840, 120], [820, 640, 320], [2500, 440, 200]],
      zones: [
        { name: 'West Rim', color: '#8fa8f0', from: 0, mobs: ['windbird'], nodes: [SPOT.night(4), SPOT.herb(4, 'star_anise')] },
        { name: 'Fallen Star Crater', color: '#e0b84a', from: 1000, mobs: ['starspirit', 'windbird'], nodes: [SPOT.ore(4), SPOT.ore(4, { gem: 0.2 })],
          look: { sky: ['#2a1e58', '#5a3f8c', '#c08ad6'] } },
        { name: 'East Rim', color: '#c8b8ff', from: 1600, mobs: ['starspirit'], nodes: [SPOT.herb(4, 'star_anise'), SPOT.wood(4)],
          look: { sky: ['#141238', '#3a2f7c', '#8a7ad0'] } },
      ],
      ledges: [
        // Islands floating over the crater, in tiers either side of the starlight column (rebuilt
        // 2026-11-05 with more and wider star-cloud floors, so the heights hunt like a real map).
        { x: 1030, y: 960, w: 240 }, { x: 1330, y: 960, w: 240 },
        { x: 1150, y: 880, w: 300 },
        { x: 1020, y: 800, w: 240 }, { x: 1340, y: 800, w: 240 },
        { x: 1020, y: 560, w: 220 }, { x: 1360, y: 560, w: 220 },
        // Star-cloud terraces over the west rim and its steps (none over the star pool).
        { x: 60, y: 440, w: 380 }, { x: 240, y: 360, w: 380 },
        { x: 500, y: 560, w: 300 }, { x: 560, y: 480, w: 360 },
        // The east rim: clouds over its steps, and its high island with the way to the terrace.
        { x: 1620, y: 720, w: 200 }, { x: 1640, y: 480, w: 300 }, { x: 1880, y: 560, w: 240 },
        { x: 2160, y: 360, w: 300 },
        { x: 2250, y: 440, w: 300, thick: 44 },
        // The star-cloud ferry, gliding rim to rim across the valley.
        { x: 760, y: 640, w: 150, drift: { dx: 930, period: 16 } },
        // The cloud dock out over the star pool on the west steps.
        { x: 840, y: 800, w: 70, walkOn: true },
      ],
    }),
    // A moving part per zone: the ferry on the west rim's steps, starlight rising from the crater
    // (Up to ride it, and catch the ferry going over), and a vent up to the east rim's island.
    updrafts: [{ x: 1300, w: 56, top: 610, bottom: 1040, kind: 'wisplight' }],
    springs: [{ x: 2300, y: 520, up: 120, kind: 'gust' }],
    // The star pool sunk in the west rim's lower step: night sky in the cloud.
    water: [{ x1: 846, x2: 974, y: 812, kind: 'star' }],
    portals: [{ id: 'west', x: 40, y: 520, to: 'sky', toPortal: 'starfall' }, { id: 'whale', x: 2550, y: 520, to: 'cloudcatch_pier', toPortal: 'west', label: 'Cloudcatch Pier' }],
    npcs: [],
    // A landmark per zone: a cloud pillar on the west rim, the moonstones round the crater, the
    // gazebo on the east rim's island.
    deco: [['cloudpillar', 300], ['moonstone', 1200], ['moonstone', 1450], ['cloudpillar', 2000], ['skygazebo', 2380, 0, 440]],
    lamps: [{ x: 860, y: 730 }, { x: 1300, y: 1000 }, { x: 2380, y: 400 }],
    spirit: { x: 1300, y: 760 },
    habitats: { windbird: { play: true }, starspirit: { naps: true, home: { x: 1300, y: 1040 } } },
  },

});

// ---------- The queens' trial arenas ----------
//
// Each queen waits in her own arena at the end of her region (story chapters 3-6): one open floor
// with a ledge on each side to get up on when the floor itself is about to be hit. `trial` names
// the queen's trial (data/story.js); the arena is yours alone. After her trial she also comes back
// on her region's map now and then (the spawn `after` her trial quest).
const arena = (id, name, theme, town, world, look, deco, back) => ({
  id, name, theme, town, world, trial: id, look,
  width: 1400, height: 560, groundY: 480,
  terrain: [[0, 480], [1400, 480]],
  platforms: [{ x: 120, y: 400, w: 300 }, { x: 980, y: 400, w: 300 }, { x: 560, y: 330, w: 280, thick: 40 }],
  ropes: [{ x: 600, top: 330, bottom: 480, ladder: true }],
  portals: [{ id: 'west', x: 40, y: 480, to: back[0], toPortal: back[1] }],
  npcs: [],
  deco,
  spawns: [],
});

Object.assign(MAPS, {
  // Sylvana's bower: white flowers and green light under one enormous tree.
  bower: arena('bower', "Sylvana's Bower", 'forest', 'harbor', { x: 294, y: 168 },
    { sky: ['#7fd6b8', '#c8f0d8', '#fff6e0'], far: '#7fc99e', mid: '#5fb88a', light: 'morning', edges: 'flowers', props: ['flower', 'tulip', 'flower', 'chime'], drift: 'leaf', rainbow: 0 },
    [['bigtree', 700, 0], ['giantflower', 240, 1], ['giantflower', 1160, 2]], ['glade', 'bower']),
  // Tamamo's sanctum: foxfire lanterns round a great gate, at dusk.
  sanctum: arena('sanctum', "Tamamo's Sanctum", 'shrine', 'grove', { x: 388, y: 100 },
    { sky: ['#6a4a9a', '#e88ab0', '#ffd0a8'], light: 'dusk' },
    [['torii', 700], ['foxstatue', 560, 0], ['foxstatue', 840, 1], ['sakura', 200, 0], ['sakura', 1200, 1]], ['shrine', 'sanctum']),
  // Lilith's grotto behind the waterfall: a night garden of warm roses.
  grotto: arena('grotto', 'Rose Grotto', 'springs', 'grove', { x: 244, y: 30 },
    { sky: ['#3a2450', '#7a3f74', '#d87aa0'], far: '#5a3a6a', mid: '#7a4a7e', midTrim: '#a86a9a', stars: true, face: 'moon', light: 'dusk', drift: 'petal', props: ['flower', 'tulip', 'reed', 'flower'] },
    [['hotspring', 700], ['giantflower', 260, 0], ['giantflower', 1140, 0]], ['springs', 'grotto']),
  // Selene's moon terrace: the moon close overhead, stars falling slowly.
  terrace: arena('terrace', 'Moon Terrace', 'sky', 'grove', { x: 396, y: 22 },
    { sky: ['#14123a', '#3a3184', '#8a74c8'], sun: '#e6dcff', far: '#4a3f8e', mid: '#5a4f9e', midTrim: '#7a6cc0', face: 'moon', stars: true, shooting: true, rainbow: 0, light: 'starfall', material: 'starcloud', props: ['cloudpuff', 'star'], drift: 'sparkle' },
    [['moonstone', 700], ['cloudpillar', 260], ['cloudpillar', 1140]], ['starfall', 'terrace']),
});

// Lilith's grotto behind the waterfall keeps its own rose-lit dusk, day or night.
MAPS.grotto.ownLight = true;
MAPS.glade.portals.push({ id: 'bower', x: 2340, y: 640, to: 'bower', toPortal: 'west', label: "Sylvana's Bower" });
// The shrine path's petal cloud.
MAPS.shrine.platforms.push({ x: 975, y: 400, w: 150, drift: { dx: 500, period: 11 } });
// The way to the Clockwork Carnival (its rooms are with the dungeons above).
MAPS.springs.portals.push({ id: 'volcano', x: 2340, y: 880, to: 'sugar_trail', toPortal: 'west', label: 'Candy Volcano' });
MAPS.ridge.portals.push({ id: 'observatory', x: 2360, y: 560, to: 'observatory_steps', toPortal: 'west', label: 'Star Observatory' });
MAPS.shrine.portals.push({ id: 'carnival', x: 2400, y: 880, to: 'carnival_gate', toPortal: 'west', label: 'Clockwork Carnival' });
MAPS.shrine.portals.push({ id: 'sanctum', x: 1450, y: 240, to: 'sanctum', toPortal: 'west', label: "Tamamo's Sanctum" });
// The Crystal Cave's gathering spots, on the quiet ledges kept for them round the lake (its floors
// are busy with monsters, so they're placed by hand).
MAPS.cave.nodes.push(
  { ...SPOT.ore(3), x: 350, y: 440 }, { ...SPOT.herb(3, 'crystal_truffle'), x: 1300, y: 600 },
  { ...SPOT.herb(3, 'duskcap', { night: true }), x: 1300, y: 760 }, { ...SPOT.ore(3, { gem: 0.18 }), x: 2420, y: 420 },
);
// Serpent Springs' drifting ledge and fishing dock; the grotto is behind the waterfall.
MAPS.springs.platforms.push({ x: 1035, y: 480, w: 130, drift: { dx: 200, period: 9 } }, { x: 1990, y: 872, w: 120, style: 'stone', walkOn: true });
// The hot spring sunk into the east corner of the pools floor, behind a stone lip the Lamias never
// cross: you fish it from a flat stone jutting out over the water.
MAPS.springs.terrain = [[0, 880], [1960, 880], [1960, 872], [1990, 872], [2024, 920], [2300, 920], [2300, 880], [2400, 880]];
MAPS.springs.height = 960;
MAPS.springs.water = [{ x1: 1990, x2: 2300, y: 894, kind: 'hot' }];
for (const r of MAPS.springs.ropes) if (r.bottom === 880 && r.x > 1940 && r.x < 2320) r.x = 1930;
MAPS.springs.portals.push({ id: 'grotto', x: 1560, y: 560, to: 'grotto', toPortal: 'west', label: 'Rose Grotto' });
// Cloud cotton on the high cloud by the Moon Terrace, a quiet spot above the busy east rim
// (placed by hand: the rim's own floors are full of monsters).
MAPS.starfall.nodes.push({ ...SPOT.fiber(4), x: 2240, y: 360 });
MAPS.starfall.portals.push({ id: 'terrace', x: 2500, y: 440, to: 'terrace', toPortal: 'west', label: 'Moon Terrace' });

// The queens roam their regions as field bosses (from the start: the story is optional), back
// every ten minutes or so after they fall.
MAPS.glade.spawns.push({ mob: 'sylvana', x: 1800, y: 640, respawn: 600 });
MAPS.shrine.spawns.push({ mob: 'tamamo', x: 1300, y: 720, respawn: 600 });
MAPS.springs.spawns.push({ mob: 'lilith', x: 500, y: 400, respawn: 600 });
MAPS.starfall.spawns.push({ mob: 'selene', x: 1300, y: 1040, respawn: 600 });

// A shortcut home (the map rules): a homestone on a ledge at each big hunting map's far end, far
// from the way you came in from town. Step up to it and it carries you straight back to town (one
// way), so a long map never means a long walk back.
const HOMESTONES = {
  meadow1: [1900, 360], meadow2: [200, 700], woods: [1950, 920], ruins: [2220, 900], cave: [2380, 520],
  sky: [2460, 400], canyon: [410, 520], glade: [2140, 560], shrine: [2164, 560], ridge: [2200, 400],
  springs: [1992, 640], peak: [2040, 880], starfall: [2290, 440],
};
for (const [id, [x, y]] of Object.entries(HOMESTONES)) {
  const m = MAPS[id];
  m.portals.push({ id: 'homestone', x, y, to: m.town, toPortal: 'start', homestone: true, label: `Home: ${MAPS[m.town].name}` });
}

// Safe arrival (the map rules): no monster starts near a way in, a homestone or where you appear.
for (const m of Object.values(MAPS)) if (!m.dungeon && m.spawns?.length) clearArrivals(m, MOBS, NODES[m.id]);

// Every map's gathering spots, settled clear of what was added after its layout (data/climb.js).
for (const m of Object.values(MAPS)) settleSpots(m, SPOTS[m.id]);

// ---------- Interiors (the interior rule, docs/art/art-bible.md) ----------
// Every room that is inside something is built like a room: a ceiling over it, a floor of its own
// material, ledges that belong to the building (galleries hung on chains in halls, iron or timber
// catwalks in workshops, forges, mines and backstage; the Hollow keeps its root ledges), and
// indoor things on its floor instead of grass and flowers. Rooms that are outdoors (the manor's
// garden and rooftop, the reef, the midway, the stage acts painted as outdoor sets) stay as they are.
const GALLERY_PROPS = { props: ['candle', 'books', 'column', 'candle', 'orb'], ledgeProp: 'candle' };
const SEA_HALL = { islands: 'gallery', material: 'marble', ceiling: 'manor', trim: '#bfeeff', ceilingTint: { band: '#2e5a86', trim: '#bfeeff', swag: '#4fb8c0', lamp: '#d8fbff' }, props: ['column', 'crystal', 'orb', 'crystal'], ledgeProp: 'crystal', edges: null };
const THEATRE_HALL = { islands: 'gallery', material: 'parquet', ceiling: 'curtain', trim: '#ffd36b', props: ['column', 'lamp', 'poster', 'candle'], ledgeProp: 'candle', edges: null };
const INTERIORS = {
  // Inside the great tree: an earthen, root-hung ceiling over the root ledges.
  hollow2: { ceiling: true }, hollow3: { ceiling: true }, hollow4: { ceiling: true }, hollow5: { ceiling: true }, hollow6: { ceiling: true },
  // The manor's halls: galleries on gilded chains.
  manor2: { islands: 'gallery', ...GALLERY_PROPS }, manor3: { islands: 'gallery', ...GALLERY_PROPS },
  manor4: { islands: 'gallery', ...GALLERY_PROPS, props: ['books', 'books', 'candle', 'column'] }, manor5: { islands: 'gallery', ...GALLERY_PROPS },
  // The palace's inner halls in sea-glass marble; the grotto is a cave.
  aquarium3: SEA_HALL, aquarium6: SEA_HALL, aquarium4: { ceiling: true, props: ['rock', 'crystal', 'rock'], ledgeProp: 'crystal' },
  // The carnival's buildings: the funhouse, the big top's ring, the toy workshop.
  carnival2: { islands: 'gallery', material: 'parquet', ceiling: 'beams', trim: '#ff9ab8', ceilingTint: { band: '#a0507a', lamp: '#ffe2a0' }, props: ['poster', 'lantern', 'barrel'], ledgeProp: null, edges: null },
  carnival4: { islands: 'catwalk', material: 'sawdust', ceiling: 'tent', metal: '#c06a8a', props: ['barrel', 'poster', 'crate', 'lantern'], ledgeProp: null, edges: null },
  carnival5: { islands: 'catwalk', material: 'parquet', ceiling: 'beams', metal: '#8a7aa8', props: ['crate', 'barrel', 'books', 'lantern'], ledgeProp: null, edges: null },
  // The observatory's halls: galleries on brass chains.
  observatory2: { islands: 'gallery', ...GALLERY_PROPS }, observatory3: { islands: 'gallery', ...GALLERY_PROPS, props: ['books', 'orb', 'books', 'candle'] },
  observatory4: { islands: 'gallery', ...GALLERY_PROPS, props: ['books', 'books', 'candle'] }, observatory5: { islands: 'gallery', ...GALLERY_PROPS, props: ['orb', 'column', 'candle'] },
  // The volcano's insides: the mine (timber catwalks under rock), the kitchen and the forge.
  volcano2: { islands: 'catwalk', ceiling: true, metal: '#9a6a4a', props: ['crate', 'barrel', 'torch', 'crystal'], ledgeProp: null, edges: null },
  volcano3: { islands: 'gallery', material: 'parquet', ceiling: 'beams', trim: '#ff9ab8', ceilingTint: { band: '#9a6048' }, props: ['barrel', 'crate', 'lantern'], ledgeProp: null, edges: null },
  volcano4: { islands: 'catwalk', ceiling: 'beams', metal: '#7a5a5a', ceilingTint: { band: '#6a3a3a', lamp: '#ffb070' }, props: ['barrel', 'torch', 'crate'], ledgeProp: null, edges: null },
  // The theatre: its halls under the red valance; backstage under bare beams on catwalks; the
  // acts are painted sets, so only the valance changes over them.
  theatre1: THEATRE_HALL, theatre4: THEATRE_HALL, theatre6: THEATRE_HALL,
  theatre2: { ceiling: 'curtain' }, theatre3: { ceiling: 'curtain' },
  theatre5: { islands: 'catwalk', material: 'parquet', ceiling: 'beams', metal: '#6a6080', props: ['crate', 'rack', 'poster', 'lantern'], ledgeProp: null, edges: null },
};
for (const [id, look] of Object.entries(INTERIORS)) MAPS[id].look = { ...MAPS[id].look, ...look };

// The Sweethearts live in their towns (data/sweethearts.js), each by their own house
// (render/sweethouses.js), whose door leads into their room: a cosy inside like your hut's.
const groundOf = (map, x) => {
  const t = map.terrain;
  if (!t) return map.groundY;
  for (let i = 1; i < t.length; i++) {
    if (x <= t[i][0]) return t[i - 1][1] + (t[i][1] - t[i - 1][1]) * ((x - t[i - 1][0]) / (t[i][0] - t[i - 1][0] || 1));
  }
  return t[t.length - 1][1];
};
// Where each room's door stands (render/sweethouses.js draws it in the house's own style).
const ROOM_DOOR = { poppy: 608, lark: 450, rowan: 605, yuzu: 60, celeste: 420, marlowe: 605 };
for (const h of Object.values(SWEETHEARTS)) {
  const town = MAPS[h.map];
  town.npcs.push({ id: h.id, x: h.x });
  (town.townPieces ??= []).push([`swhouse_${h.id}`, h.house]);
  town.portals.push({ id: `swh_${h.id}`, x: h.house, y: Math.round(groundOf(town, h.house)), to: `swh_${h.id}`, toPortal: 'door', label: `${h.name}'s House`, door: true });
  MAPS[`swh_${h.id}`] = {
    id: `swh_${h.id}`, name: `${h.name}'s House`, theme: town.theme, isTown: true, private: true, indoor: true, town: town.town, music: town.music,
    // (Just tall enough that the camera shows the whole wall up to the ceiling line, with you on
    // the floor above the status bar.)
    width: 640, height: 372, groundY: 344,
    // (Its floor is painted with the room, render/sweethouses.js: no ground strip of its own.)
    look: { ceiling: true, floor: 'painted', sky: ['#ffe8d8', '#fff2e6', '#fff8f0'], material: 'parquet', propKeep: 1 },
    cottages: [],
    terrain: [[0, 344], [640, 344]],
    platforms: [], ropes: [],
    townPieces: [[`swroom_${h.id}`, 320]],
    portals: [{ id: 'door', x: ROOM_DOOR[h.id], y: 344, to: h.map, toPortal: `swh_${h.id}`, label: 'Outside', door: true }, { id: 'start', x: ROOM_DOOR[h.id], y: 344, hidden: true }],
    npcs: [], spawns: [], deco: [], lamps: [{ x: 320, y: 120, c: '#ffd27a' }],
  };
}
