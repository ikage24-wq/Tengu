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
    id: 'sprout', plaza: 1800, fountain: 2050, name: 'Sprout Village', theme: 'town', isTown: true, town: 'sprout', job: 'archer', world: { x: 66, y: 182 }, amb: 'village',
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
    terrain: [[0, 480], [1460, 480], [1500, 456], [2100, 456], [2140, 480], [2168, 480], [2196, 504], [2276, 504], [2304, 480], [3200, 480]],
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
      // (No road west: the old mine road to the Crystal Cave was closed 2026-11-10, a Lv 27-35 cave
      // one step from the first town. The cave is reached the long way, past Twilight Ruins.)
      { id: 'east', x: 3150, y: 480, to: 'meadow1', toPortal: 'west' },
    ],
    npcs: [{ id: 'mira', x: 330 }, { id: 'lulu', x: 1105 }, { id: 'pip', x: 1260 }, { id: 'posy', x: 2152 }, { id: 'clover', x: 2390 }, { id: 'kestrel', x: 2480 }, { id: 'malvina', x: 1530 }],
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
    lamps: [{ x: 139, y: 372 }, { x: 271, y: 372 }, { x: 320, y: 440 }, { x: 960, y: 440 }, { x: 1450, y: 440 }, { x: 1600, y: 416 }, { x: 2000, y: 416 }, { x: 2270, y: 440 }, { x: 2620, y: 290 }, { x: 2960, y: 440 }],
    deco: [
      // An empty Mochi cushion on every doorstep: the Mochi blew away on festival night.
      ['mochicushion', 372, 0], ['mochicushion', 1140, 1], ['mochicushion', 1298, 2], ['mochicushion', 2112, 3], ['mochicushion', 2428, 0], ['mochicushion', 2516, 2],
      ['archerbanner', 2540], ['watchtower', 2620], ['archerbanner', 2700],
      // The archery range: a rack of practice bows at the shooting line, targets down the lane.
      ['bowrack', 2740], ['fence', 2825], ['archtarget', 2880, 0], ['archtarget', 2940, 1], ['archtarget', 3000, 2], ['haystack', 3050, 1],
    ],
    spawns: [],
  },


  // Petal Meadow (made smaller and simpler 2026-11-10, the player's call: the old ten-floor
  // hillside was too big and twisty for the first field). A cosy meadow you read at a glance, in
  // three zones by height: the Petal Fields on the ground and the first ledges, where the Moss
  // Snails graze round the giant flower (the lily pond in the quiet east corner); the Beehive
  // Banks, one wide ledge round the giant hive, where the Puffbees buzz; and the Blossom Boughs up in
  // the great cherry tree, the Blossom Kits' playground, with the Dandelion Puffs drifting round its
  // crown and the lookout on top, where the road to Windy Canyon starts. Exits: Sprout to the west,
  // Clover Hills to the east, the canyon from the lookout.
  meadow1: {
    id: 'meadow1', name: 'Petal Meadow', theme: 'meadow', town: 'sprout', world: { x: 118, y: 160 },
    width: 1700, height: 720, groundY: 640,
    // One monster a spot, not two (2026-11-10: the player found the meadow crowded).
    perSpawn: 1,
    look: { meadowStyle: 'petal', material: 'petal', spots: 'cute', propKeep: 0.8, ledgeKeep: 0.86, critters: ['butterfly'], rabbits: 2, rabbitsAt: [690, 1190], bees: 0, sky: ['#ffc6dd', '#ffe3d8', '#fff6e6'], far: '#f3d3e8', mid: '#bfe8b8', midTrim: '#8fd39a', light: 'morning', edges: null, props: ['flower', 'tulip', 'tuft'] },
    zones: [
      { name: 'Petal Fields', from: Infinity, color: '#e889b4' },
      { name: 'Beehive Banks', from: 520, color: '#e0a040', look: { sky: ['#ffd9a6', '#ffecc8', '#fff8e4'], far: '#f6dcb8', mid: '#d6e6a0', midTrim: '#b2d07e', edges: null, props: ['tulip', 'flower', 'tuft'] } },
      { name: 'Blossom Boughs', from: 360, color: '#e06fa6', look: { sky: ['#ffb0d0', '#ffd2e6', '#fff0f6'], far: '#f6c2da', mid: '#f0b6d2', midTrim: '#e08cba', islands: 'planks', props: ['flower', 'tuft'] } },
    ],
    // (In the east corner the lily pond is sunk into the meadow between two low stone lips.)
    terrain: [[0, 640], [1420, 640], [1420, 632], [1452, 632], [1480, 664], [1560, 664], [1588, 632], [1620, 632], [1620, 640], [1700, 640]],
    water: [{ x1: 1452, x2: 1588, y: 650, kind: 'pond' }],
    platforms: [
      // Petal Fields: two ledges either side of the giant flower.
      { x: 150, y: 560, w: 520 }, { x: 1030, y: 560, w: 400 },
      // Beehive Banks: two ledges with the giant sunflower rising between them, the hive on the right.
      { x: 420, y: 480, w: 340 }, { x: 940, y: 480, w: 340 },
      // Blossom Boughs: two boughs, the crown, and the lookout on top. The crown is two grassy
      // islands joined by a plank footbridge: the great sakura stands on the west one and the cherry
      // tree on the east (2026-11-19: trees never grow out of planks).
      { x: 120, y: 400, w: 460 }, { x: 1120, y: 400, w: 460 },
      { x: 460, y: 320, w: 320, style: 'earth' }, { x: 780, y: 320, w: 160 }, { x: 940, y: 320, w: 300, style: 'earth' },
      { x: 720, y: 240, w: 260, thick: 44 },
      // A cloud drifting by the crown (a real cloud, not planks).
      { x: 1120, y: 240, w: 130, drift: { dx: 200, period: 9 }, style: 'earth', material: 'sky' },
      // A little jetty out over the lily pond: the snails never cross the pond's stone lips, so
      // you can fish off its end in peace.
      { x: 1452, y: 632, w: 64, style: 'planks', walkOn: true },
    ],
    // How its monsters live (world/habits.js): the snails doze and creep over to the giant
    // flower; the Puffbees bob about their hive; the fox kits play chase in the boughs; the Petal
    // Sprites doze round the crown at night.
    habitats: { snailbun: { naps: true, home: { x: 850, y: 640 } }, bumble: { play: true }, puffle: { naps: true, play: true }, petalsprite: { naps: true } },
    // The area boss (world/nest.js): after enough hunting, the Queen Bee bursts out of the hive.
    nest: { mob: 'queenbee', x: 1110, y: 480, kills: 150, name: 'The giant hive', wake: 'Her Majesty is NOT amused. Everyone to Beehive Banks!', stirs: ['The giant hive is buzzing...', 'The giant hive is shaking! Something big is waking up.'] },
    spirit: { x: 850, y: 280 },
    lamps: [{ x: 200, y: 610 }, { x: 1520, y: 600 }, { x: 1110, y: 440, c: '#ffd970' }, { x: 850, y: 210 }],
    // Moving parts: two bounce blossoms in the fields and the drifting cloud by the crown (the
    // pollen updraft was cut 2026-11-11: the map is small enough without it).
    springs: [{ x: 960, y: 640, up: 170, kind: 'blossom' }, { x: 1300, y: 560, up: 170, kind: 'blossom' }],
    ropes: [
      { x: 180, top: 560, bottom: 640, ladder: true }, { x: 1380, top: 560, bottom: 640, ladder: true },
      { x: 620, top: 480, bottom: 560 }, { x: 1070, top: 480, bottom: 560 },
      { x: 460, top: 400, bottom: 480 }, { x: 1240, top: 400, bottom: 480 },
      { x: 520, top: 320, bottom: 400 }, { x: 1180, top: 320, bottom: 400 },
      { x: 760, top: 240, bottom: 320, ladder: true },
    ],
    portals: [
      { id: 'west', x: 40, y: 640, to: 'sprout', toPortal: 'east' },
      { id: 'east', x: 1660, y: 640, to: 'meadow2', toPortal: 'west' },
      { id: 'north', x: 900, y: 240, to: 'canyon', toPortal: 'south' },
    ],
    npcs: [],
    // A landmark per zone: the giant flower and the pond in the fields, the hive on the banks, the
    // cherry tree's crown in the boughs.
    deco: [['meadowsun', 850, 0], ['meadowhive', 1110, 0, 480], ['meadowcherry', 600, 0, 320]],
    spawns: [
      // Petal Fields: Bud Snails.
      ...[440, 700, 940, 1150].map((x) => ({ mob: 'snailbun', x, y: 640 })),
      ...[300].map((x) => ({ mob: 'snailbun', x, y: 560 })),
      ...[1150, 1300].map((x) => ({ mob: 'snailbun', x, y: 560 })),
      // Beehive Banks: Puffbees round their hive.
      ...[520, 680, 1110, 1240].map((x) => ({ mob: 'bumble', x, y: 480 })),
      // Blossom Boughs: the Blossom Kits' playground.
      ...[300, 480].map((x) => ({ mob: 'puffle', x, y: 400 })),
      ...[1210, 1380].map((x) => ({ mob: 'puffle', x, y: 400 })),
      ...[500].map((x) => ({ mob: 'puffle', x, y: 320 })),
      // Dandelion Puffs drifting round the boughs (clear of the lookout's way out).
      ...[300, 500, 1300, 1480].map((x) => ({ mob: 'petalsprite', x, y: 400 })),
      ...[460].map((x) => ({ mob: 'petalsprite', x, y: 480 })),
    ],
  },


  // Clover Hills (made smaller and tidier 2026-11-11, the player's call, like Petal Meadow): a
  // cosy farm you read at a glance, zoned by height. The Farm Fields along the top, where the
  // Strawhogs scurry about and the Pumpkin Goblins keep the big barn (Old MacGoblin's nest), with
  // two holes down into the Root Cellar, where the Turnip Tots hop about, the Chicklings
  // peck about and a quiet spring is good for fishing; and the Hayloft Ridge above, where
  // the Lambkins frolic and the Harvest Mice scurry round the old tree. A hay bale bounces you up
  // from the fields and chaff rises from the cellar through the west hole.
  meadow2: {
    id: 'meadow2', name: 'Clover Hills', theme: 'meadow', town: 'harbor', world: { x: 162, y: 196 }, perSpawn: 2,
    look: { sky: ['#5ec8ff', '#aee8ff', '#e8fff2'], far: '#9fdf9f', mid: '#6fcf7a', midTrim: '#4fae5f', rainbow: 0, meadowStyle: 'clover', material: 'clover', edges: 'clover', light: 'noon', drift: null, props: ['tuft', 'flower', 'tuft'], propKeep: 0.8, ledgeKeep: 0.86, critters: ['butterfly'], spots: 'cute', rabbits: 2, rabbitsAt: [690, 1560], bees: 0 },
    ...lay({
      width: 1700, ground: 1000, by: 'y', quiet: [[40, 700, 160], [1660, 700, 160], [90, 1000, 320], [90, 920, 280], [610, 1000, 90]],
      // The cellar's spring, sunk into its floor against the west wall behind a stone lip.
      terrain: [[0, 1036], [160, 1036], [196, 992], [230, 992], [230, 1000], [1700, 1000]],
      zones: [
        { name: 'Root Cellar', color: '#8a6a52', mobs: ['sproutling', 'brownie'], nodes: [SPOT.ore(1), SPOT.ore(1)],
          // (One sky over the whole map, the player's call 2026-11-11: each zone changes only its floors.)
          look: { material: 'clover', edges: 'clover', props: ['tuft', 'rock'] } },
        { name: 'Farm Fields', color: '#5fae5f', from: 780, mobs: ['strawhog', 'pumpgob'], nodes: [SPOT.fruit(1, 'wild_strawberry'), SPOT.fiber(1), SPOT.herb(1, 'clover')] },
        { name: 'Hayloft Ridge', color: '#4f95e0', from: 660, mobs: ['lambkin', 'harvmouse'], nodes: [SPOT.honey(1), SPOT.wood(1), SPOT.night(1)],
          look: { material: 'clover', edges: 'flowers', props: ['flower', 'tuft', 'tulip'] } },
      ],
      ledges: [
        // The Farm Fields, with two holes down into the cellar.
        { x: 0, y: 700, w: 560 }, { x: 660, y: 700, w: 520 }, { x: 1280, y: 700, w: 420 },
        // Shelves in the Root Cellar, and the stone lip by its spring.
        { x: 320, y: 920, w: 300 }, { x: 1100, y: 920, w: 320 }, { x: 760, y: 840, w: 240 },
        { x: 104, y: 992, w: 92, style: 'stone', walkOn: true },
        // The Hayloft Ridge: two shoulders, two banks, and the old tree's hilltop.
        { x: 220, y: 620, w: 300 }, { x: 1200, y: 620, w: 300 },
        { x: 470, y: 540, w: 260 }, { x: 990, y: 540, w: 260 },
        { x: 650, y: 460, w: 420 },
      ],
    }),
    // Its monsters, placed by hand (two each: perSpawn; 2026-11-20, the hunting pace), clear of the ladders,
    // the gathering spots and the spring.
    spawns: [
      // Root Cellar: Turnip Tots and Chicklings.
      ...[[500, 1000], [680, 1000], [1300, 1000], [520, 920]].map(([x, y]) => ({ mob: 'sproutling', x, y })),
      ...[[850, 1000], [1560, 1000], [1260, 920], [800, 840]].map(([x, y]) => ({ mob: 'brownie', x, y })),
      // Farm Fields: Strawhogs out in the fields, a Pumpkin Goblin by the barn. (Its east
      // field is the way in from the harbour road, so it's kept clear.)
      ...[480, 1010].map((x) => ({ mob: 'strawhog', x, y: 700 })),
      { mob: 'pumpgob', x: 690, y: 700 },
      // Hayloft Ridge: Lambkins and Harvest Mice round the old tree.
      ...[[330, 620], [520, 540], [900, 460]].map(([x, y]) => ({ mob: 'lambkin', x, y })),
      ...[[1340, 620], [1120, 540]].map(([x, y]) => ({ mob: 'harvmouse', x, y })),
    ],
    // Its gathering spots, placed by hand round the barn (left of the fields' ladder) and the tree.
    nodes: [
      { ...SPOT.ore(1), x: 1060, y: 1000 }, { ...SPOT.ore(1), x: 370, y: 920 },
      { ...SPOT.fruit(1, 'wild_strawberry'), x: 360, y: 700 }, { ...SPOT.herb(1, 'clover'), x: 1130, y: 700 }, { ...SPOT.fiber(1), x: 1480, y: 700 },
      { ...SPOT.honey(1), x: 1460, y: 620 }, { ...SPOT.wood(1), x: 640, y: 540 }, { ...SPOT.night(1), x: 760, y: 460 },
    ],
    // A moving part: a hay bale bouncing you up from the fields. (The chaff updraft was cut
    // 2026-11-11, like Petal Meadow's: the ladders are enough on a map this size.)
    springs: [{ x: 1380, y: 700, up: 170, kind: 'hay' }],
    water: [{ x1: 0, x2: 196, y: 1010, kind: 'spring', open: [0] }],
    portals: [
      { id: 'west', x: 40, y: 700, to: 'meadow1', toPortal: 'east' },
      { id: 'east', x: 1660, y: 700, to: 'harbor', toPortal: 'west' },
    ],
    npcs: [],
    // A landmark per zone: the spring pool in the cellar, the scarecrow and the barn in the fields,
    // the old tree on the ridge.
    deco: [['cloverscarecrow', 1570, 0, 700], ['cloverbarn', 920, 0, 700], ['cloveroak', 860, 0, 460]],
    lamps: [{ x: 110, y: 930 }, { x: 920, y: 650 }, { x: 860, y: 420 }],
    spirit: { x: 1100, y: 440 },
    // The area boss (world/nest.js): after enough hunting, Old MacGoblin storms out of the barn.
    nest: { mob: 'macgoblin', x: 920, y: 700, kills: 150, name: 'The big barn', wake: 'GET OFF MY LAND! Everyone to the barn!', stirs: ['Something is stomping around in the big barn...', 'The barn doors rattle! Someone is VERY grumpy.'] },
    habitats: { sproutling: { naps: true, home: { x: 900, y: 1000 } }, brownie: { home: { x: 900, y: 1000 } }, strawhog: { naps: true }, pumpgob: { naps: true, home: { x: 920, y: 700 } }, lambkin: { play: true, naps: true }, harvmouse: { play: true } },
  },



  // Pastel Harbor (rebuilt 2026-11-03): the thieves' home port at dusk, round one landmark, a great
  // pastel galleon moored at the docks with its sails furled (no wind to sail by). Left to right:
  // the Fish Market (Marlo's cart and a fish stall among tall canal houses); Harbor Square, a
  // gentle step up, with the fountain, the Harbor Office, the Party Board, the stove and the craft
  // workshop; Dancers' Alley under washing lines (Vex's Wind Dance Hall, and the warehouse you can climb); then
  // the Docks: a boardwalk pier with rowboats (fishing off its end) and the galleon, whose stern
  // deck, main deck and crow's nest you can climb, up its gangway ladder.
  harbor: {
    id: 'harbor', plaza: 900, name: 'Pastel Harbor', theme: 'harbor', isTown: true, town: 'harbor', job: 'thief', world: { x: 222, y: 206 }, amb: 'port',
    // The town stove (data/cooking.js) and the craft bench (data/crafting.js) in its workshop.
    stove: 700,
    bench: 1180,
    workshed: true,
    // The capsule machine stands on the Docks, between the pier's lamps, the sea behind it.
    gacha: 2056,
    width: 2900, height: 520, groundY: 480,
    look: { islands: 'planks', material: 'quay', propKeep: 0.8 },
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
  // and above it the Treetops, where the Red Pandas doze, with a log drifting between the boughs
  // and, on the highest one, the way on to the Whispering Glade. A bouncy mushroom on the floor
  // springs you up into the trees.
  // Mossy Woods (remade 2026-11-12, the player's call: a wood built from giant trees, not floating
  // islands). A solid mossy forest floor along the bottom (the way from the harbour to the grove),
  // where three giant trees stand. Their branches step up round each trunk, a ladder up every trunk;
  // level rope bridges join the three crowns, all at one height, into a walk across the canopy. Zones by height: the Forest Floor, the
  // Branchways, the Canopy, with the stump house on the middle crown and the ways to the manor and
  // the glade on the outer ones.
  woods: {
    id: 'woods', name: 'Mossy Woods', theme: 'forest', town: 'harbor', world: { x: 254, y: 166 }, perSpawn: 2,
    look: { sky: ['#6fc6f0', '#b6e6f0', '#eafbe4'], far: '#86cc9c', mid: '#58b474', midTrim: '#479a62', forestStyle: 'mossy', material: 'mossy', edges: 'mossy', islands: 'branch', props: ['tuft'], propKeep: 0.4, ledgeKeep: 0.3, critters: [], drift: null, noAmbient: true, spots: 'cute' },
    ...lay({
      width: 1800, ground: 1000, by: 'y', quiet: [[40, 1000, 160], [1760, 1000, 160]],
      zones: [
        { name: 'Forest Floor', color: '#4f9e55', mobs: ['mosstort', 'mossowlet'], look: { material: 'mossy', edges: 'mossy', props: ['tuft'] } },
        { name: 'Branchways', color: '#8a6656', from: 900, mobs: ['mossowlet', 'mosstort'] },
        { name: 'Canopy', color: '#3f9a7a', from: 540, mobs: ['redpanda', 'mossowlet'], look: { edges: 'flowers' } },
      ],
      // Each giant tree's branches step up round its trunk, 120px apart, each crossing the trunk
      // (so the ladder up the trunk stops at every one); its crown platform on top.
      ledges: [
        // (`root`: the end that grows out of the trunk, tucked inside it, a twig on the other end.)
        // The west tree (x 360).
        { x: 342, y: 880, w: 268, root: 'left', noRope: true }, { x: 110, y: 760, w: 268, root: 'right', noRope: true }, { x: 342, y: 640, w: 268, root: 'left', noRope: true }, { x: 220, y: 520, w: 280, root: 'mid', noRope: true },
        // The middle tree (x 900).
        { x: 640, y: 840, w: 278, root: 'right', noRope: true }, { x: 882, y: 720, w: 298, root: 'left', noRope: true }, { x: 640, y: 600, w: 278, root: 'right', noRope: true }, { x: 720, y: 520, w: 360, root: 'mid', noRope: true },
        // The east tree (x 1440).
        { x: 1422, y: 880, w: 268, root: 'left', noRope: true }, { x: 1190, y: 760, w: 268, root: 'right', noRope: true }, { x: 1422, y: 640, w: 268, root: 'left', noRope: true }, { x: 1300, y: 520, w: 280, root: 'mid', noRope: true },
        // Rope bridges joining the crowns, level with them, end to end (nothing grows on the planks).
        { x: 500, y: 520, w: 220, style: 'bridge', noProps: true, noRope: true }, { x: 1080, y: 520, w: 220, style: 'bridge', noProps: true, noRope: true },
        // A twig off the east crown, half hidden in the leaves, where the Ivy Gecko suns itself (the
        // map's secret: a mount, data/mounts.js).
        { x: 1580, y: 508, w: 70, noRope: true },
      ],
      // The ladders up the trunks, a stretch between each branch and the next.
      ropes: [
        ...[[880, 1000], [760, 880], [640, 760], [520, 640]].map(([top, bottom]) => ({ x: 360, top, bottom })),
        ...[[840, 1000], [720, 840], [600, 720], [520, 600]].map(([top, bottom]) => ({ x: 900, top, bottom })),
        ...[[880, 1000], [760, 880], [640, 760], [520, 640]].map(([top, bottom]) => ({ x: 1440, top, bottom })),
      ],
    }),
    // Its monsters, placed by hand (one each), spread out, none near the ways in or out.
    spawns: [
      // The Forest Floor, between the trees.
      { mob: 'mosstort', x: 620, y: 1000 }, { mob: 'mosstort', x: 960, y: 1000 }, { mob: 'mosstort', x: 1180, y: 1000 },
      // The Branchways.
      { mob: 'mossowlet', x: 520, y: 880 }, { mob: 'mosstort', x: 200, y: 760 }, { mob: 'mossowlet', x: 1060, y: 720 }, { mob: 'mossowlet', x: 1280, y: 760 },
      { mob: 'mossowlet', x: 720, y: 840 }, { mob: 'mossowlet', x: 1480, y: 880 }, { mob: 'redpanda', x: 480, y: 640 },
      // The Canopy (and the Red Panda that likes the east tree's top branch).
      { mob: 'redpanda', x: 800, y: 520 }, { mob: 'redpanda', x: 1000, y: 520 }, { mob: 'redpanda', x: 1540, y: 640 },
    ],
    // Its gathering spots, placed by hand, clear of the trunks, the doors and the ladders.
    nodes: [
      { ...SPOT.ore(2), x: 230, y: 1000 }, { ...SPOT.wood(2), x: 500, y: 1000 }, { ...SPOT.herb(2, 'chanterelle'), x: 1300, y: 1000 },
      { ...SPOT.fiber(2), x: 180, y: 760 }, { ...SPOT.honey(2), x: 760, y: 600 }, { ...SPOT.wood(2), x: 1650, y: 640 },
      { ...SPOT.night(2), x: 420, y: 520 },
    ],
    // A bouncy mushroom on the floor springs you up onto the middle tree's first branch.
    springs: [{ x: 760, y: 1000, up: 170, kind: 'shroom' }],
    portals: [
      { id: 'west', x: 40, y: 1000, to: 'harbor', toPortal: 'east' },
      { id: 'east', x: 1760, y: 1000, to: 'grove', toPortal: 'west' },
    ],
    npcs: [],
    // The three giant trees (standing on the ground, behind their branches), the stump house on the
    // middle crown, the hollow log on the floor. (No mushroom ring: its glowing pastel caps looked
    // out of place on the forest floor, the player's call 2026-11-12.)
    deco: [['woodtree', 360, 0], ['woodtree', 900, 1], ['woodtree', 1440, 2], ['hollowlog', 1620], ['stumphouse', 990, 0, 520]],
    lamps: [{ x: 360, y: 470 }, { x: 900, y: 470 }, { x: 1440, y: 470 }],
    spirit: { x: 620, y: 440 },
    finds: [{ x: 1615, y: 508, mount: 'gecko', say: 'It scurried up your arm and settled on your shoulder.' }],
    habitats: { mossowlet: { naps: true }, mosstort: { play: true, naps: true, home: { x: 1060, y: 1000 } }, redpanda: { naps: true } },
  },



  // Twilight Ruins (its makeover, 2026-11-20): a smaller sunken temple at dusk, built round three
  // landmarks (render/ruinsart.js) the way Mossy Woods is built round its giant trees, zones by
  // height. In the west the bell tower: you arrive from Moonleaf Grove on its belfry floor, and its
  // balconies step down round it, a ladder up the inside. In the middle the Moon Maiden, a giant
  // statue asleep on her plinth in the crypt: her level forearm and her crescent crown are ledges,
  // a vine climbs her robe, and the column of wisp-light rises beside the lantern she holds up. In
  // the east the portico, its floors fallen in, the way to the Fox Shrine Path off its far pillar.
  // Broken roof spans join the three tops into the Temple Roof (a gust vent on the first); a slab
  // drifts across the Collapsed Halls; the Sunken Crypt's floor runs under it all, with tombs, to
  // the way on to the Tanuki Tea Terraces.
  ruins: {
    id: 'ruins', name: 'Twilight Ruins', theme: 'ruins', town: 'grove', world: { x: 322, y: 90 },
    look: { painted: 'ruins', noFace: true, light: 'dusk', sky: ['#5e4e9e', '#a888cc', '#f2c6d6'], far: '#9a88c8', mid: '#7a6aa8', midTrim: '#9a8ac0', islands: 'temple', material: 'crypt', ropes: 'vine', props: [], ledgeKeep: 1, critters: [], drift: 'sparkle' },
    ...lay({
      width: 1800, ground: 1040, by: 'y', quiet: [[40, 300, 160], [1750, 580, 150], [1760, 1040, 160]],
      zones: [
        // (The crypt is the open floor of the pit now: the dusk sky, only deeper.)
        { name: 'Sunken Crypt', color: '#5d5285', mobs: ['boneknight', 'wisp'],
          look: { sky: ['#3e3478', '#6e5ca6', '#b494cc'], far: '#7a6aac', mid: '#5e4e90' } },
        { name: 'Collapsed Halls', color: '#4f95e0', from: 860, mobs: ['wisp', 'gloombat'] },
        { name: 'Temple Roof', color: '#c84f8a', from: 460, mobs: ['gloombat'] },
      ],
      ledges: [
        // The bell tower (x 300): the belfry floor where you arrive, its balconies stepping down
        // round it, each growing out of the stone (`root`), the ladder up the inside.
        { x: 0, y: 300, w: 420, noRope: true },
        { x: 282, y: 440, w: 240, root: 'left', noRope: true }, { x: 78, y: 560, w: 240, root: 'right', noRope: true }, { x: 282, y: 680, w: 240, root: 'left', noRope: true },
        { x: 78, y: 800, w: 240, root: 'right', noRope: true }, { x: 282, y: 920, w: 240, root: 'left', noRope: true },
        // The Temple Roof: broken spans joining the belfry, the Maiden's crown and the portico.
        { x: 460, y: 330, w: 360, noRope: true }, { x: 984, y: 350, w: 256, noRope: true }, { x: 1650, y: 330, w: 150, root: 'left', noRope: true },
        // The Moon Maiden (x 900): her crown, her forearm, her plinth (drawn with her).
        { x: 856, y: 340, w: 88, bare: true, noProps: true, noRope: true }, { x: 798, y: 640, w: 156, bare: true, noProps: true, noRope: true }, { x: 768, y: 960, w: 264, bare: true, noProps: true, noRope: true },
        // A fallen pillar's stub beside her lantern-light, and the hall floor on to the portico.
        { x: 958, y: 668, w: 82, noRope: true }, { x: 1086, y: 712, w: 206, noRope: true },
        // The portico (x 1450): its entablature (drawn with it), its fallen floors, the top one running
        // on out past its far pillar to the way to the Fox Shrine Path.
        { x: 1262, y: 360, w: 376, bare: true, noProps: true, noRope: true },
        { x: 1300, y: 880, w: 190, root: 'left', noRope: true }, { x: 1420, y: 740, w: 180, root: 'right', noRope: true }, { x: 1300, y: 580, w: 500, root: 'left', noRope: true },
        // The slab of stone drifting across the halls, between the tower and the Maiden.
        { x: 500, y: 520, w: 110, drift: { dx: 140, period: 9 } },
      ],
      ropes: [
        // The ladder up inside the tower.
        ...[[920, 1040], [800, 920], [680, 800], [560, 680], [440, 560], [300, 440]].map(([top, bottom]) => ({ x: 300, top, bottom, ladder: true })),
        // A vine up the Maiden's robe to her forearm.
        { x: 814, top: 640, bottom: 960 },
        // Vines hanging inside the portico.
        { x: 1360, top: 880, bottom: 1040 }, { x: 1452, top: 740, bottom: 880 }, { x: 1470, top: 580, bottom: 740 }, { x: 1330, top: 360, bottom: 580 },
        // A vine down from the Fox Shrine ledge to the crypt floor.
        { x: 1700, top: 580, bottom: 1040 },
      ],
    }),
    // Its monsters, placed by hand, few and spread out, none near the ways in or out.
    spawns: [
      // The Temple Roof.
      { mob: 'gloombat', x: 660, y: 330 }, { mob: 'gloombat', x: 1100, y: 350 }, { mob: 'gloombat', x: 1580, y: 360 },
      // The Collapsed Halls.
      { mob: 'wisp', x: 420, y: 680 }, { mob: 'wisp', x: 1270, y: 712 }, { mob: 'gloombat', x: 1400, y: 580 }, { mob: 'wisp', x: 1520, y: 740 },
      // The Sunken Crypt.
      { mob: 'boneknight', x: 560, y: 1040 }, { mob: 'boneknight', x: 1180, y: 1040 }, { mob: 'boneknight', x: 1580, y: 1040 }, { mob: 'wisp', x: 400, y: 920 },
      { mob: 'boneknight', x: 160, y: 1040 }, { mob: 'boneknight', x: 900, y: 960 }, { mob: 'wisp', x: 200, y: 800 }, { mob: 'wisp', x: 880, y: 640 }, { mob: 'gloombat', x: 420, y: 440 },
    ],
    // Its gathering spots, placed by hand, clear of the ladders and the ways.
    nodes: [
      { ...SPOT.ore(2), x: 470, y: 1040 }, { ...SPOT.ore(2, { gem: 0.14 }), x: 1330, y: 1040 },
      { ...SPOT.herb(2, 'temple_mint'), x: 160, y: 560 }, { ...SPOT.herb(2, 'temple_mint'), x: 480, y: 330 },
      { ...SPOT.wood(2), x: 150, y: 800 }, { ...SPOT.fiber(2), x: 1132, y: 712 }, { ...SPOT.night(2), x: 1420, y: 360 },
    ],
    // A moving part per zone: the gust vent on the roof span and the bell swinging in the belfry,
    // the drifting slab in the halls, and the column of wisp-light rising from the crypt beside the
    // Maiden's lantern, all the way up to the roof (Up to ride it).
    updrafts: [{ x: 1074, w: 46, top: 330, bottom: 1040, kind: 'wisplight' }],
    springs: [{ x: 700, y: 330, up: 150, kind: 'gust' }],
    portals: [
      { id: 'west', x: 40, y: 300, to: 'grove', toPortal: 'east' },
      { id: 'east', x: 1760, y: 1040, to: 'tea', toPortal: 'west', label: 'Tanuki Tea Terraces' },
    ],
    npcs: [],
    // The three landmarks, standing on the crypt floor behind their ledges, and two tombs.
    deco: [['ruintower', 300, 0], ['moonmaiden', 900, 0], ['ruinportico', 1450, 0], ['ruintomb', 590], ['ruintomb', 1230, 1]],
    lamps: [{ x: 300, y: 500, c: '#ffe2a0' }, { x: 300, y: 740, c: '#ffe2a0' }, { x: 1024, y: 432, c: '#fff0c0' }, { x: 1450, y: 480, c: '#ffd6a8' }, { x: 590, y: 1020 }, { x: 1230, y: 1020 }],
    spirit: { x: 1100, y: 250 },
    habitats: { boneknight: { naps: true, home: { x: 1180, y: 1040 } }, wisp: { play: true }, gloombat: { play: true, naps: true } },
  },



  // Crystal Cave (its makeover, 2026-11-20): a smaller cavern built round its landmarks
  // (render/cavecrystal.js), zones side by side. The Glowcap Terraces in the west: giant glowing
  // mushrooms on the shelf where you come in from the Tea Terraces, their caps the high ledges (a
  // bouncy glowcap springs you up onto the first), a small one down on the shore by the door to the
  // Dark Throne. The Underground Lake in the middle, and sat in it a giant geode cracked open: its
  // rim, a crystal shelf inside it and its lower lip (where you fish) are ledges, stepping stones
  // lead out to it, and a crystal shard drifts between the small glowcap and its rim. The Shade
  // Spires in the east: two great crystal columns on the east shelf, shelves growing out of them,
  // crystal dust rising between (Up to ride it), the way up to the Sky Garden on the taller one's
  // top, the tunnel to Serpent Springs off its high shelf, and the Crystal Throne's door on the east shore.
  cave: {
    id: 'cave', name: 'Crystal Cave', theme: 'cave', town: 'grove', world: { x: 336, y: 148 },
    look: { ceiling: true, painted: 'crystalcave', islands: 'geode', sky: ['#1a1432', '#2a224c', '#40346c'], far: '#3e3268', mid: '#2e2650', props: [], ledgeKeep: 1, critters: [] },
    ...lay({
      width: 2000, ground: 960, by: 'x',
      terrain: [[0, 640], [470, 640], [470, 800], [780, 800], [780, 960], [1220, 960], [1220, 800], [1500, 800], [1500, 640], [2000, 640]],
      quiet: [[40, 640, 160], [560, 800, 140], [1380, 800, 140], [1960, 400, 120], [1860, 302, 120], [1640, 362, 100]],
      zones: [
        { name: 'Glowcap Terraces', color: '#4fb0d8', from: 0, mobs: ['crystalslime', 'rockgolem'] },
        { name: 'Underground Lake', color: '#8a7ab0', from: 760, mobs: ['rockgolem', 'crystalslime', 'shade'] },
        { name: 'Shade Spires', color: '#5d5285', from: 1480, mobs: ['shade', 'rockgolem'] },
      ],
      ledges: [
        // The glowcaps' caps (drawn with them): the big teal one, the tall pink one, the small one.
        { x: 70, y: 426, w: 168, bare: true, noProps: true, noRope: true }, { x: 272, y: 346, w: 136, bare: true, noProps: true, noRope: true },
        { x: 577, y: 666, w: 114, bare: true, noProps: true, noRope: true },
        // The geode (drawn with it): its rim, the crystal shelf inside, its lower lip.
        { x: 930, y: 640, w: 140, bare: true, noProps: true, noRope: true }, { x: 924, y: 800, w: 152, bare: true, noProps: true, noRope: true },
        { x: 900, y: 898, w: 200, bare: true, noProps: true, noRope: true },
        // Stepping stones out to it from either shore.
        { x: 818, y: 880, w: 72, noRope: true }, { x: 1110, y: 880, w: 72, noRope: true },
        // The crystal columns' sheared tops (drawn with them), and the shelves growing out of them.
        { x: 1600, y: 362, w: 80, bare: true, noProps: true, noRope: true }, { x: 1820, y: 302, w: 80, bare: true, noProps: true, noRope: true },
        { x: 1652, y: 560, w: 120, root: 'left', noRope: true }, { x: 1540, y: 480, w: 88, root: 'right', noRope: true },
        { x: 1772, y: 500, w: 78, root: 'right', noRope: true }, { x: 1872, y: 400, w: 118, root: 'left', noRope: true },
        // A long crystal walkway across the top of the cavern, from the tall pink glowcap to the first
        // crystal column, and crystal shelves across under it above the geode, stepping up off the
        // drifting shard.
        { x: 420, y: 420, w: 480, noRope: true }, { x: 1080, y: 420, w: 456, noRope: true },
        { x: 720, y: 570, w: 180, noRope: true }, { x: 900, y: 490, w: 180, noRope: true }, { x: 1080, y: 570, w: 220, noRope: true },
        // The crystal shard drifting from the small glowcap to the geode's rim.
        { x: 660, y: 650, w: 80, drift: { dx: 190, period: 10 } },
      ],
      ropes: [
        // Down each step of the cave floor, beside the drop.
        { x: 480, top: 640, bottom: 800 }, { x: 790, top: 800, bottom: 960 }, { x: 1210, top: 800, bottom: 960 }, { x: 1490, top: 640, bottom: 800 },
        // Down the big and the small glowcaps' stems; inside the geode.
        { x: 100, top: 426, bottom: 640 }, { x: 596, top: 666, bottom: 800 }, { x: 960, top: 800, bottom: 898 }, { x: 1040, top: 640, bottom: 800 },
        // Down the crystal columns.
        { x: 1612, top: 362, bottom: 480 }, { x: 1835, top: 302, bottom: 500 },
        // From the high shelf down to the geode's rim, and from the east shelf down to the east shore.
        { x: 1000, top: 490, bottom: 640 }, { x: 1270, top: 570, bottom: 800 },
      ],
    }),
    // Its monsters, placed by hand, few and spread out, well away from the five ways in (the
    // arrival rule): up on the glowcaps' caps, on the geode's rim, and up the crystal columns.
    spawns: [
      { mob: 'crystalslime', x: 150, y: 426 }, { mob: 'rockgolem', x: 340, y: 346 }, { mob: 'crystalslime', x: 634, y: 666 },
      { mob: 'rockgolem', x: 560, y: 420 }, { mob: 'crystalslime', x: 760, y: 420 }, { mob: 'shade', x: 1200, y: 420 }, { mob: 'rockgolem', x: 1420, y: 420 },
      { mob: 'shade', x: 1000, y: 640 }, { mob: 'rockgolem', x: 800, y: 570 }, { mob: 'crystalslime', x: 960, y: 490 }, { mob: 'shade', x: 1170, y: 570 },
      { mob: 'shade', x: 1585, y: 480 }, { mob: 'crystalslime', x: 1810, y: 500 }, { mob: 'rockgolem', x: 1600, y: 640 }, { mob: 'crystalslime', x: 1880, y: 640 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes and ways.
    nodes: [
      { ...SPOT.ore(3), x: 420, y: 640 }, { ...SPOT.herb(3, 'crystal_truffle'), x: 260, y: 640 }, { ...SPOT.herb(3, 'crystal_truffle'), x: 720, y: 800 }, { ...SPOT.herb(3, 'crystal_truffle'), x: 1000, y: 800 },
      { ...SPOT.herb(3, 'duskcap', { night: true }), x: 915, y: 898 }, { ...SPOT.ore(3, { gem: 0.18 }), x: 1712, y: 560 }, { ...SPOT.ore(3), x: 1560, y: 480 },
    ],
    // A moving part per zone: the bouncy glowcap on the terraces, the drifting shard over the lake,
    // the crystal dust rising between the columns.
    springs: [{ x: 120, y: 640, up: 230, kind: 'shroom' }],
    updrafts: [{ x: 1760, w: 44, top: 300, bottom: 640, kind: 'wisplight' }],
    portals: [
      { id: 'west', x: 40, y: 640, to: 'tea', toPortal: 'east', label: 'Tanuki Tea Terraces' },
      { id: 'east', x: 1860, y: 302, to: 'sky', toPortal: 'west' },
      { id: 'boss', x: 1380, y: 800, to: 'bossroom', toPortal: 'west', label: 'Throne' },
    ],
    npcs: [],
    // The underground lake fills the cave's floor between the shores, lit from below (render/water.js).
    water: [{ x1: 780, x2: 1220, y: 924, kind: 'cave' }],
    // The landmarks, standing on the floors behind their ledges.
    deco: [['glowcap', 160, 0], ['glowcap', 330, 1], ['glowcap', 640, 2], ['geode', 1000, 0], ['crystalcolumn', 1640, 0], ['crystalcolumn', 1860, 1]],
    lamps: [{ x: 154, y: 440, c: '#9ff0ff' }, { x: 340, y: 360, c: '#ffd0e6' }, { x: 634, y: 680, c: '#9ff0ff' }, { x: 1000, y: 780, c: '#e8c8ff' }, { x: 1640, y: 500, c: '#9ff0ff' }, { x: 1860, y: 440, c: '#9ff0ff' }],
    spirit: { x: 1000, y: 560 },
    habitats: { crystalslime: { naps: true, home: { x: 1000, y: 800 } }, rockgolem: { naps: true }, shade: { play: true } },
  },



  // Sky Garden (its makeover, 2026-11-20): a smaller sky built round its landmarks
  // (render/skyart.js), zones side by side over the cloud sea. The Cloud Meadows in the west: a big
  // floating garden island pouring a waterfall into the clouds, a small one above it, a blossom on
  // the cloud sea bouncing you up, the Pegasus Foals grazing. A rainbow arches from the meadows over
  // to the Harpy Roost, little clouds riding it for steps. The Harpy Roost in the middle: a round
  // birdhouse on a tall pillar of cloud, its perches stepping up round the pillar to the balcony,
  // the skyward wind rising beside it (Up to ride it). The Starlit Terrace in the east: floating
  // terrace islands stepping up to the gazebo and the way to Starfall Heights, a cloud drifting to
  // the top one; down on the cloud sea, a gap to fish and the ways to Theatre Row and Frozen Peak.
  sky: {
    id: 'sky', name: 'Sky Garden', theme: 'sky', town: 'grove', world: { x: 348, y: 36 }, perSpawn: 3,
    ...lay({
      width: 2200, ground: 1040, by: 'x', quiet: [[40, 1040, 160], [2040, 1040, 120], [2140, 1040, 120], [2080, 330, 160], [1800, 1040, 200]],
      // In the quiet east corner the cloud parts on the open sky below: a gap to fish.
      terrain: [[0, 1040], [1700, 1040], [1728, 1078], [1820, 1078], [1848, 1040], [2200, 1040]],
      zones: [
        { name: 'Cloud Meadows', color: '#ff9ec7', from: 0, mobs: ['cloudsheep'] },
        { name: 'Harpy Roost', color: '#4f95e0', from: 880, mobs: ['windbird'], look: { sky: ['#8fc8ff', '#c8e4ff', '#fff6ee'] } },
        { name: 'Starlit Terrace', color: '#e0b84a', from: 1560, mobs: ['starspirit'], look: { sky: ['#6a6ad0', '#a8a0e8', '#fff0d8'], stars: true } },
      ],
      ledges: [
        // The floating islands' tops (drawn with them): the big one, the small one above it.
        { x: 120, y: 860, w: 560, bare: true, noProps: true, noRope: true }, { x: 180, y: 700, w: 240, bare: true, noProps: true, noRope: true },
        // A long cloud bank over the meadows, off the rainbow's top.
        { x: 380, y: 570, w: 520, noRope: true },
        // Little clouds riding the rainbow, up over its top and down to the roost.
        { x: 660, y: 790, w: 70, noRope: true }, { x: 730, y: 715, w: 70, noRope: true }, { x: 830, y: 650, w: 70, noRope: true }, { x: 910, y: 630, w: 70, noRope: true },
        { x: 1010, y: 660, w: 70, noRope: true }, { x: 1110, y: 720, w: 70, noRope: true }, { x: 1200, y: 790, w: 70, noRope: true },
        // The roost's perches stepping up round its pillar, and its balcony (drawn with it).
        { x: 1400, y: 960, w: 160, style: 'planks', root: 'left', noRope: true }, { x: 1240, y: 880, w: 160, style: 'planks', root: 'right', noRope: true },
        { x: 1400, y: 800, w: 160, style: 'planks', root: 'left', noRope: true }, { x: 1240, y: 720, w: 160, style: 'planks', root: 'right', noRope: true },
        { x: 1400, y: 640, w: 160, style: 'planks', root: 'left', noRope: true },
        { x: 1328, y: 456, w: 144, bare: true, noProps: true, noRope: true },
        // The Starlit Terrace's islands (drawn with them), stepping up to the gazebo's.
        { x: 1600, y: 760, w: 320, bare: true, noProps: true, noRope: true }, { x: 1800, y: 600, w: 320, bare: true, noProps: true, noRope: true },
        { x: 1560, y: 440, w: 320, bare: true, noProps: true, noRope: true }, { x: 1870, y: 330, w: 240, bare: true, noProps: true, noRope: true },
        // The cloud drifting from the third terrace up to the gazebo's.
        { x: 1800, y: 390, w: 90, drift: { dx: 140, period: 9 } },
        // A little cloud dock out over the gap, for fishing: no monster drifts down to it.
        { x: 1772, y: 1040, w: 76, walkOn: true },
      ],
      ropes: [
        // Vines off the islands.
        { x: 140, top: 860, bottom: 1040 }, { x: 250, top: 700, bottom: 860 }, { x: 400, top: 570, bottom: 700 },
        // Up the roost's pillar from the top perch to the balcony.
        { x: 1430, top: 456, bottom: 640 },
        // Between the terraces, and down from the first to the cloud sea.
        { x: 1900, top: 760, bottom: 1040 }, { x: 1860, top: 600, bottom: 760 }, { x: 1840, top: 440, bottom: 600 },
      ],
    }),
    // Its monsters, placed by hand, well away from the ways in (the arrival rule), three a spot.
    spawns: [
      // The Cloud Meadows: on the islands and the cloud sea.
      { mob: 'cloudsheep', x: 220, y: 860 }, { mob: 'cloudsheep', x: 420, y: 860 }, { mob: 'cloudsheep', x: 620, y: 860 }, { mob: 'cloudsheep', x: 240, y: 700 },
      { mob: 'cloudsheep', x: 640, y: 1040 }, { mob: 'cloudsheep', x: 880, y: 1040 }, { mob: 'cloudsheep', x: 1120, y: 1040 }, { mob: 'cloudsheep', x: 1360, y: 1040 }, { mob: 'cloudsheep', x: 1580, y: 1040 },
      // The Harpy Roost: on the cloud bank, round its perches and on its balcony.
      { mob: 'windbird', x: 560, y: 570 }, { mob: 'windbird', x: 780, y: 570 },
      { mob: 'windbird', x: 1480, y: 960 }, { mob: 'windbird', x: 1320, y: 880 }, { mob: 'windbird', x: 1480, y: 800 }, { mob: 'windbird', x: 1320, y: 720 }, { mob: 'windbird', x: 1480, y: 640 }, { mob: 'windbird', x: 1400, y: 456 },
      // The Starlit Terrace.
      { mob: 'starspirit', x: 1680, y: 760 }, { mob: 'starspirit', x: 1860, y: 760 }, { mob: 'starspirit', x: 1880, y: 600 }, { mob: 'starspirit', x: 2060, y: 600 }, { mob: 'starspirit', x: 1620, y: 440 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes and ways (several on the
    // rainbow's clouds).
    nodes: [
      { ...SPOT.fruit(4, 'cloudberry'), x: 380, y: 700 }, { ...SPOT.fiber(4), x: 765, y: 715 }, { ...SPOT.night(4), x: 945, y: 630 },
      { ...SPOT.fruit(4, 'cloudberry'), x: 1145, y: 720 }, { ...SPOT.wood(4), x: 760, y: 1040 }, { ...SPOT.herb(4, 'star_anise'), x: 1780, y: 440 },
    ],
    // A moving part per zone: the blossom bouncing you up onto the big island, the skyward wind by
    // the roost, the cloud drifting up to the gazebo.
    springs: [{ x: 560, y: 1040, up: 200, kind: 'blossom' }],
    updrafts: [{ x: 1610, w: 50, top: 440, bottom: 1040, kind: 'gust' }],
    water: [{ x1: 1700, x2: 1848, y: 1054, kind: 'cloud' }],
    portals: [
      { id: 'west', x: 40, y: 1040, to: 'cave', toPortal: 'east' },
      { id: 'peak', x: 2140, y: 1040, to: 'peak', toPortal: 'east', label: 'Frozen Peak' },
      { id: 'starfall', x: 2080, y: 330, to: 'starfall', toPortal: 'west', label: 'Starfall Heights' },
    ],
    npcs: [],
    // The landmarks: the islands, the rainbow, the roost, and the gazebo on the top terrace.
    deco: [['skyisland', 400, 0, 1030], ['skyisland', 300, 1, 810], ['rainbowarch', 940, 0, 940], ['roosttower', 1400, 0, 1040],
      ['skyisland', 1760, 2, 890], ['skyisland', 1960, 2, 730], ['skyisland', 1720, 2, 570], ['skyisland', 1990, 1, 440], ['skygazebo', 2010, 0, 330]],
    lamps: [{ x: 1400, y: 420 }, { x: 2010, y: 290 }, { x: 400, y: 840 }],
    spirit: { x: 1100, y: 560 },
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
  // Windy Canyon (remade 2026-11-18 for Chapter 3) is a tall canyon built out of its own rock
  // (data/climb.js lay(), zones by height; the art in render/canyon.js): a canyon wall at each end,
  // two rock spires and the Great Arch between them, and every ledge a sandstone shelf jutting out of
  // one of them, so nothing floats. At the bottom the Dry Riverbed, where the Basilisk Hatchlings sun
  // themselves and the way into Rootwood Hollow opens at the east wall's foot; up the Cliff Shelves,
  // stepping round the spires (a ladder up each), where the Manticore Cubs start; and on the Windy
  // Top a walk across the whole canyon over the spires' caps, the arch and pennant-strung rope
  // bridges, to the windmill lookout and the road to Ember Crag. The wind howls up the canyon
  // beside the arch from the riverbed (Up to ride it) and a vent on the east spire's high shelf puffs
  // you up to its cap.
  canyon: {
    id: 'canyon', name: 'Windy Canyon', theme: 'crag', town: 'crag', world: { x: 138, y: 104 }, perSpawn: 3,
    look: { painted: 'canyon', light: 'canyon', faceAt: 0.32, sky: ['#ffa37e', '#ffd0a4', '#ffecd2'], far: '#e8b2a4', mid: '#dc946c', material: 'canyon', islands: 'shelf', drift: null, props: [], ledgeKeep: 1, critters: ['hawk'] },
    ...lay({
      width: 2200, ground: 1000, by: 'y',
      // (The riverbed sinks a little under the arch, where the water used to run.)
      terrain: [[0, 1000], [960, 1000], [990, 1012], [1210, 1012], [1240, 1000], [2200, 1000]],
      quiet: [[60, 1000, 160], [2100, 1000, 160], [2170, 520, 160]],
      zones: [
        { name: 'Dry Riverbed', color: '#c97a3a', mobs: ['pebblet'] },
        { name: 'Cliff Shelves', color: '#b05a4a', from: 900, mobs: ['pebblet', 'scorpip'], look: { sky: ['#ffc39a', '#ffe0b8', '#fff4e2'] } },
        { name: 'Windy Top', color: '#6a7ad0', from: 600, mobs: ['scorpip'], look: { sky: ['#8fc4ff', '#cfe6ff', '#fff2e0'] } },
      ],
      // (`root`: the end that grows out of the rock, tucked into it; 'cap' sits on top, free both ends.
      // Each spire's shelves cross its middle, so the ladder up it stops at every one.)
      ledges: [
        // The west wall's shelves and its top.
        { x: 150, y: 880, w: 290, root: 'left', noRope: true }, { x: 150, y: 680, w: 228, root: 'left', noRope: true }, { x: 0, y: 520, w: 262, root: 'left', noRope: true },
        // The west spire (x 600) and its cap.
        { x: 582, y: 880, w: 250, root: 'left', noRope: true }, { x: 368, y: 780, w: 250, root: 'right', noRope: true }, { x: 582, y: 660, w: 230, root: 'left', noRope: true },
        { x: 510, y: 520, w: 180, root: 'cap', noRope: true },
        // The Great Arch's top.
        { x: 876, y: 520, w: 448, root: 'cap', noRope: true },
        // The east spire (x 1650) and its cap.
        { x: 1418, y: 880, w: 250, root: 'right', noRope: true }, { x: 1632, y: 780, w: 250, root: 'left', noRope: true }, { x: 1438, y: 660, w: 230, root: 'right', noRope: true },
        { x: 1560, y: 520, w: 180, root: 'cap', noRope: true },
        // The east wall's shelves and its top, the windmill's lookout above.
        { x: 1760, y: 880, w: 290, root: 'right', noRope: true }, { x: 1822, y: 680, w: 228, root: 'right', noRope: true }, { x: 1938, y: 520, w: 262, root: 'right', noRope: true },
        { x: 1990, y: 400, w: 120, root: 'cap', thick: 44, noRope: true },
        // Rope bridges between them all along the windy top (nothing grows on the planks).
        { x: 262, y: 520, w: 248, style: 'bridge', noProps: true, noRope: true }, { x: 690, y: 520, w: 186, style: 'bridge', noProps: true, noRope: true },
        { x: 1324, y: 520, w: 236, style: 'bridge', noProps: true, noRope: true }, { x: 1740, y: 520, w: 198, style: 'bridge', noProps: true, noRope: true },
      ],
      // Ladders lashed up both walls' faces and up both spires, a stretch between each shelf and the next.
      ropes: [
        ...[[880, 1000], [680, 880], [520, 680]].map(([top, bottom]) => ({ x: 214, top, bottom, ladder: true })),
        ...[[880, 1000], [780, 880], [660, 780], [520, 660]].map(([top, bottom]) => ({ x: 600, top, bottom, ladder: true })),
        ...[[880, 1000], [780, 880], [660, 780], [520, 660]].map(([top, bottom]) => ({ x: 1650, top, bottom, ladder: true })),
        ...[[880, 1000], [680, 880], [520, 680]].map(([top, bottom]) => ({ x: 1986, top, bottom, ladder: true })),
        // (And up the rock the windmill stands on.)
        { x: 2016, top: 400, bottom: 520, ladder: true },
      ],
    }),
    // Its monsters, placed by hand (one each), spread out, none near the ways in or out.
    spawns: [
      // The Dry Riverbed.
      { mob: 'pebblet', x: 380, y: 1000 }, { mob: 'pebblet', x: 800, y: 1000 }, { mob: 'pebblet', x: 1300, y: 1000 }, { mob: 'pebblet', x: 1500, y: 1000 }, { mob: 'pebblet', x: 1800, y: 1000 },
      // The Cliff Shelves.
      { mob: 'pebblet', x: 350, y: 880 }, { mob: 'scorpip', x: 290, y: 680 }, { mob: 'scorpip', x: 730, y: 880 }, { mob: 'pebblet', x: 450, y: 780 }, { mob: 'scorpip', x: 720, y: 660 },
      { mob: 'pebblet', x: 1520, y: 880 }, { mob: 'scorpip', x: 1780, y: 780 }, { mob: 'pebblet', x: 1860, y: 880 }, { mob: 'scorpip', x: 1900, y: 680 },
      // The Windy Top.
      { mob: 'scorpip', x: 960, y: 520 }, { mob: 'scorpip', x: 1240, y: 520 }, { mob: 'scorpip', x: 1440, y: 520 }, { mob: 'scorpip', x: 390, y: 520 }, { mob: 'scorpip', x: 1810, y: 520 },
    ],
    // Its gathering spots, placed by hand on open, flat ground with room round them (clear of the
    // walls' and spires' feet, the ladders, the vent, the wind and the monsters, so nothing slides
    // them): copper on the open sand past the west wall, a gem seam in the dry riverbed under the
    // arch, the prickly pear before the east wall, gems on the east spire's high shelf, and at night
    // a glittering seam on top of the arch.
    nodes: [
      { ...SPOT.ore(1), x: 300, y: 1000 }, { ...SPOT.ore(1, { gem: 0.12 }), x: 1100, y: 1012 }, { ...SPOT.fruit(1, 'prickle_pear'), x: 1840, y: 1000 },
      { ...SPOT.ore(1, { gem: 0.14 }), x: 1500, y: 660 }, { ...SPOT.ore(1, { gem: 0.3, night: true }), x: 1100, y: 520 },
    ],
    springs: [{ x: 1600, y: 660, up: 175, kind: 'gust' }],
    updrafts: [{ x: 1372, w: 44, top: 490, bottom: 1000, kind: 'whirl' }],
    portals: [
      { id: 'south', x: 60, y: 1000, to: 'meadow1', toPortal: 'north' },
      { id: 'north', x: 2170, y: 520, to: 'crag', toPortal: 'south' },
    ],
    npcs: [],
    // The rock it's built from (render/canyon.js): the walls (seed 0 west, 1 east), the spires, the
    // arch, the Hollow's cave mouth in the east wall's foot, the dry riverbed's stones; the old bones
    // half buried in it; the windmill on its lookout and the signpost to Ember Crag.
    deco: [
      ['canyonwall', 82, 0], ['canyonspire', 600, 0], ['canyonarch', 1100, 0], ['canyonspire', 1650, 1], ['canyonwall', 2118, 1], ['canyonstub', 2050, 2, 520, { under: true }],
      ['canyoncave', 2100], ['riverbed', 1100, 2], ['bones', 760],
      ['windmillcrag', 2072, 0, 400], ['signpost', 2130, 0, 520],
    ],
    // Pennants strung along the rope bridges, a pair of wind chimes hung under the arch.
    pennants: [[262, 494, 510, 494, 0], [690, 494, 876, 494, 2], [1324, 494, 1560, 494, 4], [1740, 494, 1938, 494, 1]],
    chimes: [[1068, 591, 0], [1132, 591, 3]],
    // (Night light only where something gives it: the homestone's runes, the Hollow's cave mouth.)
    lamps: [{ x: 110, y: 500 }, { x: 2100, y: 968, c: '#9fe8d8' }],
    spirit: { x: 1100, y: 430 },
    habitats: { pebblet: { naps: true, home: { x: 1300, y: 1000 } }, scorpip: { naps: true } },
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
    // The capsule machine stands on Forge Row, between the smithing bench and the great forge.
    gacha: 1972,
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
    // The capsule machine stands in the Rune Garden under the Starchime Tower, by the root gate.
    gacha: 2172,
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
    // The capsule machine stands out on Lighthouse Point, at the cliff's end, looking out to sea.
    gacha: 2330,
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

// ---------- Coinbridge, the canal trading town (render/coinbridge.js) ----------
// Down the road from Sprout Village's Gate Lane, a merchant port climbing a hillside in four
// terraces joined by grand stairs, a canal with an arched bridge on the docks and the market.
// Bottom to top: the Canal Docks (the town gate, the crane, crates, a moored gondola), the Market
// Canals (the domed Auction House and Madame Ledger, the stalls where players set up shop), the
// Lantern Terraces (the Gilded Kettle inn, the stove and the bench), and Guild Heights (the
// Adventurers' Guild with Guildmaster Halvard, Penny's Trade Hall office, the bell tower). No
// monsters anywhere.
Object.assign(MAPS, {
  coinbridge: {
    id: 'coinbridge', plaza: 2450, fountain: false, name: 'Coinbridge', theme: 'harbor', isTown: true, town: 'coinbridge', world: { x: 40, y: 194 }, amb: 'port',
    stove: 2860,
    bench: 2950,
    width: 3960, height: 1200, groundY: 1120,
    // (No props scattered on its streets: every lamp and crate stands where it would, by hand.)
    look: { sky: ['#ffcfa0', '#ffe4c4', '#fff6e8'], far: '#f0c8a8', mid: '#f8dcc0', midTrim: '#e8b898', islands: 'planks', material: 'quay', propKeep: 1 },
    // The docks, the grand stairs, the market, the stairs, the terraces, the stairs, the heights;
    // the two canals sunk into the street.
    // (The street runs level over the canals, on their bridges: everyone crosses there, no one
    // wades. The water shows below the deck: render/coinbridge.js.)
    // The capsule machine stands at the Night Market on the docks, by the Masked Moth.
    gacha: 424,
    terrain: [[0, 1120], [820, 1120], [1210, 860], [2050, 860], [2440, 600], [3100, 600], [3490, 340], [3960, 340]],
    walkSpan: [1250, 2040],
    cottages: [],
    townPieces: [
      // The docks: the gate, crates waiting on the quay, the crane at the canal's edge with its load
      // swinging out over the water, a gondola moored under the bridge.
      ['cb_gate', 170], ['cb_crates', 300, 1], ['cb_lamp', 360], ['cb_crane', 508], ['cb_canal', 580, { w: 118, depth: 30 }], ['cb_bridge', 580, { w: 140 }], ['cb_gondola', 580, { w: 118, dir: -1, lanterns: true }], ['cb_crates', 720, 2], ['cb_lamp', 790],
      // The Night Market, out after dusk where the cargo stood by day: two traders' stalls, lanterns
      // strung across the quay, fireflies (render/coinbridge.js; the Masked Moth, world/nightmarket.js).
      ['cb_nightstall', 300, 1], ['cb_nightstall', 722, 2], ['cb_lanterns', 232, { to: 356, h: 64 }], ['cb_lanterns', 654, { to: 786, h: 64 }], ['cb_fireflies', 60, { w: 740 }],
      // The market: a lamp between the Auction House and the canal, and one past the stalls.
      ['cb_palazzo', 1262, 3], ['cb_auction', 1472], ['cb_lamp', 1633], ['cb_canal', 1710, { w: 118, depth: 30 }], ['cb_bridge', 1710, { w: 140 }], ['cb_gondola', 1710, { w: 118 }], ['cb_lamp', 2030],
      ['cb_stall', 1830, 1], ['cb_stall', 1900, 2], ['cb_stall', 1970, 'yours'],
      // The terrace: a lamp between the inn and the stove, lighting the way to the bench.
      ['cb_palazzo', 2494, 5], ['cb_inn', 2662], ['cb_lamp', 2800], ['cb_palazzo', 3040, 8],
      // The heights: a lamp where the stair comes up, the guild, the office beside it, the tower.
      ['cb_lamp', 3506], ['cb_guild', 3650], ['cb_office', 3840], ['cb_tower', 3926],
      // The grand stairs between the terraces.
      ['cb_stairs', 820, { to: 1210 }], ['cb_stairs', 2050, { to: 2440 }], ['cb_stairs', 3100, { to: 3490 }],
      // Each terrace's retaining wall.
      ['cb_wall', 1210, { w: 436 }], ['cb_wall', 1638, { w: 144, drop: 78 }], ['cb_wall', 1774, { w: 276 }], ['cb_wall', 2440, { w: 660 }], ['cb_wall', 3490, { w: 470 }],
    ],
    platforms: [],
    ropes: [],
    portals: [
      { id: 'start', x: 240, y: 1120, hidden: true },
      // The road back up to Sprout Village.
      { id: 'west', x: 40, y: 1120, to: 'sprout', toPortal: 'coin', label: 'Sprout Village' },
      { id: 'inn', x: 2662, y: 600, to: 'coin_inn', toPortal: 'door', label: 'The Gilded Kettle', door: true },
    ],
    npcs: [{ id: 'moth', x: 486 }, { id: 'ledger', x: 1552 }, { id: 'halvard', x: 3570 }, { id: 'penny', x: 3808 }],
    zonesBy: 'x',
    zones: [
      { name: 'Canal Docks', from: 0, color: '#5fc4c4' },
      { name: 'Market Canals', from: 1100, color: '#e0a040', look: { sky: ['#ffc8a0', '#ffe0c0', '#fff4e6'] } },
      { name: 'Lantern Terraces', from: 2300, color: '#ff8fb0', look: { sky: ['#ffb8b0', '#ffd8c8', '#fff0e6'] } },
      { name: 'Guild Heights', from: 3350, color: '#8fa8ff', look: { sky: ['#b8c8ff', '#d8e0ff', '#f4f4ff'] } },
    ],
    // The night lights sit on the lanterns: the street lamps, the gate's, the bridges'.
    lamps: [{ x: 120, y: 1072 }, { x: 220, y: 1072 }, { x: 360, y: 1074 }, { x: 515, y: 1087 }, { x: 645, y: 1087 }, { x: 790, y: 1074 }, { x: 1633, y: 814 }, { x: 1645, y: 827 }, { x: 1775, y: 827 }, { x: 2030, y: 814 }, { x: 2662, y: 540, c: '#ffc870' }, { x: 2800, y: 554 }, { x: 3506, y: 294 }],
    deco: [],
    spawns: [],
  },
  // Inside the Gilded Kettle: the bar, the fire and its kettle, the card table, the stair up to
  // the rooms (render/coinbridge.js). Juniper keeps it; Old Wendell has a stool; Tilly deals cards.
  coin_inn: {
    id: 'coin_inn', name: 'The Gilded Kettle', theme: 'harbor', isTown: true, indoor: true, town: 'coinbridge', amb: 'port',
    width: 640, height: 372, groundY: 344,
    look: { ceiling: true, floor: 'painted', sky: ['#ffe8cc', '#fff0dc', '#fff8f0'], material: 'parquet', propKeep: 1 },
    cottages: [],
    terrain: [[0, 344], [640, 344]],
    platforms: [], ropes: [],
    townPieces: [['cb_innroom', 320]],
    portals: [{ id: 'door', x: 60, y: 344, to: 'coinbridge', toPortal: 'inn', label: 'Outside', door: true }, { id: 'start', x: 60, y: 344, hidden: true }],
    npcs: [{ id: 'juniper', x: 492 }, { id: 'wendell', x: 412 }, { id: 'tilly', x: 200 }],
    spawns: [], deco: [], lamps: [{ x: 300, y: 210, c: '#ffd27a' }, { x: 500, y: 120, c: '#ffd27a' }],
  },
});
// The road down to Coinbridge leaves Sprout Village's Gate Lane, past the farmhouse.
MAPS.sprout.portals.push({ id: 'coin', x: 470, y: 480, to: 'coinbridge', toPortal: 'west', label: 'Coinbridge' });
// The path up the hill at the village's west end, to the Mochi palace and the Queen's Bedchamber.
MAPS.sprout.portals.push({ id: 'palace', x: 84, y: 480, to: 'royal_bed', toPortal: 'door', label: "Queen's Palace", style: 'mochi' });
// The lane to the Mochi Market and your own Mochi Garden beyond it (world/market.js), at the far
// end of the Pond Garden.
MAPS.sprout.portals.push({ id: 'garden', x: 2336, y: 480, to: 'mochi_market', toPortal: 'sprout', label: 'Mochi Market', style: 'mochi' });

// The prologue's two rooms (render/prologue.js), off every road: a story scene cuts to them
// (world/cast.js sets). Hayate's flat in the human world at 2 a.m., and the Queen's Bedchamber on
// the hill above Sprout Village, where she woke up a queen.
Object.assign(MAPS, {
  pr_flat: {
    id: 'pr_flat', name: 'Somewhere Far Away', theme: 'harbor', isTown: true, private: true, indoor: true, set: true, town: 'sprout', quiet: true, amb: 'flat',
    width: 640, height: 372, groundY: 344,
    look: { ceiling: true, floor: 'painted', sky: ['#1c2140', '#262b52', '#343a6a'], material: 'parquet', light: 'harbor', propKeep: 1 },
    cottages: [], terrain: [[0, 344], [640, 344]], platforms: [], ropes: [],
    townPieces: [['pr_flat', 320]],
    portals: [{ id: 'start', x: 320, y: 344, hidden: true }],
    npcs: [], spawns: [], deco: [], lamps: [],
  },
  pr_sea: {
    id: 'pr_sea', name: 'The Open Sea', theme: 'harbor', isTown: true, private: true, indoor: true, set: true, town: 'sprout', quiet: true, amb: 'nightsea',
    width: 640, height: 372, groundY: 344,
    look: { ceiling: false, floor: 'painted', sky: ['#141838', '#262a58', '#33306a'], material: 'planks', light: 'harbor', propKeep: 1 },
    cottages: [], terrain: [[0, 344], [640, 344]], platforms: [], ropes: [],
    townPieces: [['pr_sea', 320]],
    portals: [{ id: 'start', x: 320, y: 344, hidden: true }],
    npcs: [], spawns: [], deco: [], lamps: [],
  },
  royal_bed: {
    id: 'royal_bed', name: "The Queen's Bedchamber", theme: 'meadow', isTown: true, private: true, indoor: true, set: true, town: 'sprout', music: 'town', amb: 'palace',
    width: 640, height: 372, groundY: 344,
    look: { ceiling: true, floor: 'painted', sky: ['#ffe8f4', '#fff2f8', '#fff8fc'], material: 'parquet', light: 'throne', propKeep: 1 },
    cottages: [], terrain: [[0, 344], [640, 344]], platforms: [], ropes: [],
    townPieces: [['pr_bedchamber', 320]],
    portals: [{ id: 'door', x: 608, y: 344, to: 'sprout', toPortal: 'palace', label: 'Sprout Village', door: true }, { id: 'start', x: 320, y: 344, hidden: true }],
    npcs: [], spawns: [], deco: [], lamps: [{ x: 186, y: 180, c: '#ffd27a' }, { x: 466, y: 180, c: '#ffd27a' }],
  },
});

// Towns in world-map order, for fast travel.
export const TOWNS = ['sprout', 'harbor', 'crag', 'grove'];

// ---------- Dawnlight Isle: the tutorial island (world/tutorial.js walks you through it) ----------
// Three small maps, west to east: the beach you wake up on (ledges to jump to and a rope to
// climb), the practice field (a few harmless Blossom Kits), and the dock with the boat to Sprout
// Village. Kuro, a young tengu, waits on each to show you the next thing. None of it is on the
// world map: the island is off the coast.
Object.assign(MAPS, {
  dawnbeach: {
    id: 'dawnbeach', name: 'Dawnlight Beach', theme: 'harbor', town: 'sprout', amb: 'beach',
    width: 1500, height: 560, groundY: 480,
    look: { sky: ['#ffc9a8', '#ffe6cc', '#fff6e6'], far: '#ffd9c2', mid: '#ffe8c4', midTrim: '#f2cfa0', light: 'morning', skyline: 'opensea', islands: 'planks', material: 'sand',
      // A beach's own things on the sand (pebbles, rocks, dune grass), not the harbour's lamps and alley cats.
      props: ['pebble', 'rock', 'reed', 'pebble', 'rock'] },
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
    id: 'dock', name: 'Sunny Dock', theme: 'harbor', town: 'sprout', amb: 'dock',
    width: 1300, height: 560, groundY: 480,
    look: { islands: 'planks', material: 'dockwood' },
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
const packAt = (id, x, y, ...mobs) => mobs.map((mob, i) => ({ mob, x: x + (i - (mobs.length - 1) / 2) * 34, y, pack: id }));

MAPS.canyon.portals.push({ id: 'hollow', x: 2100, y: 1000, to: 'hollow_gate', toPortal: 'south', label: 'Rootwood Hollow', mouth: 38, labelAt: 104 });

Object.assign(MAPS, {
  // The Hollow Gate (remade 2026-11-18 for Chapter 3; art in render/hollowgate.js): where Windy
  // Canyon ends at the foot of the oldest tree. You come in past the canyon's last sandstone wall; a
  // giant root of the tree arches out of the ground (its top is the ledge, drawn by the root); Bramble keeps his post by his mushroom house; and the great tree rises off the top of
  // the screen, its buttress roots framing the glowing doorway down into Rootwood Hollow. High on its
  // bark it sleeps; when the night rumbles come it scrunches its eyes, and they're loudest here.
  hollow_gate: {
    id: 'hollow_gate', name: 'Hollow Gate', theme: 'forest', town: 'crag', world: { x: 168, y: 132 },
    width: 1200, height: 420, groundY: G,
    look: { painted: 'hollowgate', sky: ['#ffae86', '#e294b4', '#7a5aa4'], far: '#9a6a9a', mid: '#7a5a8a', midTrim: '#9a7aa8', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'], material: 'hollow', light: 'dusk', drift: 'spore', critters: ['firefly'], face: null, edges: null, props: ['tuft'], propKeep: 0.86 },
    // (The mound's top runs flat right under both of the root arch's feet.)
    terrain: [[0, G], [244, G], [316, G - 40], [644, G - 40], [712, G], [1200, G]],
    platforms: [{ x: 400, y: G - 120, w: 160, bare: true }],
    ropes: [],
    deco: [['canyonwalllow', 40, 0], ['signpost', 120], ['rootarch', 480], ['giantshroom', 720, 2], ['greattree', 1080]],
    portals: [
      // (Where you come back out of the Hollow: on the step by its door.)
      { id: 'start', x: 990, y: G, hidden: true },
      { id: 'south', x: 60, y: G, to: 'canyon', toPortal: 'hollow' },
      { id: 'door', x: 1080, y: G, to: 'hollow1', toPortal: 'start', label: 'Rootwood Hollow', dungeon: 'hollow', mouth: 50, labelAt: 108 },
    ],
    npcs: [{ id: 'bramble', x: 900 }],
    // (Night light from Bramble's lantern on its peg and the glowing doorway.)
    lamps: [{ x: 1010, y: 292, c: '#ffd68a' }, { x: 1080, y: 336, c: '#9fe8d8' }],
    spawns: [],
  },

  // The Canopy Door (remade 2026-11-18 for Chapter 3; art in render/hollowrooms.js): inside the great
  // tree's hollow trunk. The group climbs in by the opening far above, where the moonlight pours
  // down, onto a branch grown out of the trunk's west wall by a giant owl's nest, crosses on a
  // drifting leaf (or climbs down the hanging vines), drops onto the branches below and reaches the
  // trunk floor, where an old stump stands and the way on is. Every ledge is a branch grown out of
  // one of the trunk's walls. One glowcap waits on each level; vines join every level so nobody is
  // ever stuck.
  hollow1: {
    id: 'hollow1', name: 'The Canopy Door', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 1900, ground: 860, by: 'y',
      ledges: [
        { x: 40, y: 260, w: 700, root: 'left' }, { x: 780, y: 250, w: 120, style: 'leaf', drift: { dx: 300, period: 9 } }, { x: 1200, y: 300, w: 660, root: 'right' },
        { x: 960, y: 480, w: 900, root: 'right' }, { x: 40, y: 580, w: 800, root: 'left' },
        // (The old stump's top: the stump draws it.)
        { x: 900, y: 720, w: 160, bare: true },
        { x: 1780, y: 216, w: 80, root: 'right' },
      ],
      zones: [
        { name: 'Trunk Floor', color: '#8fe0c8', mobs: [], look: { sky: ['#1e1a2e', '#33284a', '#4a3a5a'] } },
        { name: 'Hollow Limb', color: '#b08ad8', from: 640, mobs: [], look: { sky: ['#2a2a4a', '#45406a', '#6a5a80'] } },
        { name: 'Canopy', color: '#9fd88a', from: 380, mobs: [], look: { sky: ['#1e3a5a', '#3a6a7a', '#8ab8a8'] } },
      ],
    }),
    look: { painted: 'hollowtrunk', sky: ['#1e3a5a', '#3a6a7a', '#8ab8a8'], far: '#2a4a4a', mid: '#3a5a4a', midTrim: '#5a8a6a', material: 'rootfloor', islands: 'limb', ropes: 'vine', props: [], clouds: false, light: 'ridge', drift: 'leaf', critters: ['firefly'] },
    task: { kind: 'light', label: 'Light the glowcaps' },
    dark: true,
    darkDepth: [0.45, 1],
    deco: [['trunkwall', 5, 0], ['trunkwall', 1895, 1], ['hollowstump', 980], ['owlnest', 520, 0, 260]],
    portals: [
      { id: 'out', x: 60, y: 260, to: 'hollow_gate', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 160, y: 260, hidden: true },
      { id: 'east', x: 1850, y: 860, to: 'hollow2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'glowcap', x: 1660, y: 300 }, { kind: 'glowcap', x: 240, y: 580 }, { kind: 'glowcap', x: 1500, y: 860 }],
    npcs: [],
    spawns: [...packAt('a', 1420, 300, 'rootling', 'sporecap'), ...packAt('b', 560, 580, 'rootling', 'rootling', 'rootling'), ...packAt('c', 1060, 860, 'rootling', 'sporecap', 'rootling', 'sporecap')],
  },

  // Capper's Garden (remade 2026-11-18; art in render/hollowrooms.js): a root chamber under the trunk
  // where the Myconid Queen keeps her garden, lit pink by it. Root shelves step up both earthen walls
  // (the high ones hang from the roots above), and her great mushroom stands in the middle, its broad
  // cap the middle ledge; bounce caps throw you up out of her Spore Tide.
  hollow2: {
    id: 'hollow2', name: "Capper's Garden", theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 1400, ground: 540,
      ledges: [
        { x: 60, y: 460, w: 230, root: 'left' }, { x: 60, y: 380, w: 160, root: 'left' }, { x: 170, y: 300, w: 210, hang: true },
        { x: 1110, y: 460, w: 230, root: 'right' }, { x: 1180, y: 380, w: 160, root: 'right' }, { x: 1020, y: 300, w: 210, hang: true },
        // (The great mushroom's cap: the mushroom draws it.)
        { x: 600, y: 320, w: 200, bare: true },
        { x: 90, y: 220, w: 100, hang: true },
      ],
      zones: [{ name: "Capper's Garden", color: '#ffb0d0', mobs: [] }],
    }),
    look: { painted: 'rootroom', glow: '#ff9ec8', glowAt: [700, 540], sky: ['#4a2a5a', '#8a4a80', '#d890b8'], far: '#5a3460', mid: '#8a5480', midTrim: '#c890b8', material: 'rootfloor', islands: 'rootshelf', ropes: 'root', props: [], clouds: false, critters: ['firefly'], light: 'grove', drift: 'spore', shrooms: ['#ff9ec8', '#ffd0e8', '#c9a6ff'] },
    bouncers: [{ x: 440 }, { x: 960 }],
    deco: [['rootwall', 30, 0], ['rootwall', 1370, 1], ['rootceiling', 210, 0, 96, { under: true }], ['rootceiling', 630, 1, 96, { under: true }], ['rootceiling', 1050, 2, 96, { under: true }], ['rootceiling', 1470, 3, 96, { under: true }], ['greatcap', 700]],
    portals: [
      { id: 'west', x: 40, y: 540, to: 'hollow1', toPortal: 'east' },
      { id: 'east', x: 1360, y: 540, to: 'hollow3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'mothercapper', x: 760, y: 540 }],
  },

  // Bramble Tunnels (remade 2026-11-18): a floor of great roots on top, held up on root pillars, with
  // holes dropping into the earthen tunnels beneath. The trapped Sprouts are caged on both levels;
  // spores rise through the first hole to carry you back up, the Sprouts' stump house stands on top,
  // and roots fall from the low tunnel roof in a fight.
  hollow3: {
    id: 'hollow3', name: 'Bramble Tunnels', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 2400, ground: 700, by: 'y',
      ledges: [
        { x: 40, y: 420, w: 560, root: 'left' }, { x: 700, y: 420, w: 620 }, { x: 1420, y: 420, w: 560 }, { x: 2060, y: 420, w: 300, root: 'right' },
        { x: 1080, y: 580, w: 160, hang: true },
      ],
      zones: [
        { name: 'The Tunnels', color: '#b08ad8', mobs: [], look: { sky: ['#1e1418', '#2e2026', '#45302e'] } },
        { name: 'The Root Floor', color: '#9fd88a', from: 500, mobs: [], look: { sky: ['#2a3a2a', '#45583a', '#6a7a4a'] } },
      ],
    }),
    look: { painted: 'rootroom', glow: '#e8b070', glowAt: [1200, 700], sky: ['#1e1418', '#2e2026', '#45302e'], far: '#2e2226', mid: '#4a3434', midTrim: '#6a4a44', material: 'rootfloor', islands: 'rootshelf', ropes: 'root', props: [], clouds: false, critters: ['firefly'], light: 'cave', drift: 'spore', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'] },
    task: { kind: 'free', label: 'Free the trapped Sprouts' },
    rootfall: true,
    updrafts: [{ x: 650, w: 56, top: 400, bottom: 700, kind: 'spores' }],
    deco: [['rootwall', 10, 2], ['rootwall', 2390, 3], ['rootceiling', 210, 0, 96, { under: true }], ['rootceiling', 630, 1, 96, { under: true }], ['rootceiling', 1050, 2, 96, { under: true }], ['rootceiling', 1470, 3, 96, { under: true }], ['rootceiling', 1890, 0, 96, { under: true }], ['rootceiling', 2310, 1, 96, { under: true }], ['rootpillar', 760], ['rootpillar', 1040], ['rootpillar', 1500], ['rootpillar', 1920], ['stumphouse', 1560, 0, 420]],
    portals: [
      { id: 'west', x: 60, y: 420, to: 'hollow2', toPortal: 'east' },
      { id: 'east', x: 2350, y: 700, to: 'hollow4', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'cage', x: 320, y: 420 }, { kind: 'cage', x: 880, y: 700 }, { kind: 'cage', x: 1780, y: 420 }, { kind: 'cage', x: 2160, y: 700 }],
    npcs: [],
    spawns: [...packAt('a', 1000, 420, 'rootling', 'thornback', 'rootling'), ...packAt('b', 1340, 700, 'sporecap', 'rootling', 'sporecap'), ...packAt('c', 1880, 700, 'thornback', 'sporecap', 'rootling')],
  },

  // Boar Den (remade 2026-11-18): a long, low den dug in under the roots, warm and earthy, room for
  // Tuskar's charges: his mud wallow, old bones, two stone pillars to trick him into, a root arching
  // up out of the floor in the middle and root shelves along both walls to dodge onto.
  hollow4: {
    id: 'hollow4', name: 'Boar Den', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 1500, ground: 460,
      ledges: [{ x: 60, y: 380, w: 200, root: 'left' }, { x: 1240, y: 380, w: 200, root: 'right' }, { x: 660, y: 340, w: 180, bare: true }, { x: 1360, y: 300, w: 100, root: 'right' }],
      zones: [{ name: 'Boar Den', color: '#d8a878', mobs: [] }],
    }),
    look: { painted: 'rootroom', glow: '#ffb070', glowAt: [750, 460], sky: ['#3a2420', '#6a4232', '#a8704e'], far: '#4a2e26', mid: '#6a4636', midTrim: '#9a6a4e', material: 'rootfloor', islands: 'rootshelf', ropes: 'root', props: [], clouds: false, critters: ['firefly'], light: 'dusk', drift: 'spore', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'] },
    pillars: [{ x: 420 }, { x: 1250 }],
    deco: [['rootwall', 30, 0], ['rootwall', 1470, 1], ['rootceiling', 210, 0, 96, { under: true }], ['rootceiling', 630, 1, 96, { under: true }], ['rootceiling', 1050, 2, 96, { under: true }], ['rootceiling', 1470, 3, 96, { under: true }], ['rootarch', 750, 120], ['bones', 300], ['pond', 980]],
    portals: [
      { id: 'west', x: 40, y: 460, to: 'hollow3', toPortal: 'east' },
      { id: 'east', x: 1460, y: 460, to: 'hollow5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'tuskar', x: 900, y: 460 }],
  },

  // The Root Gate (remade 2026-11-18): a tall climb out of the sap, through a chamber lit amber from
  // below. The sap surges over the floor now and then, so the group climbs root shelves hung from the
  // roots above (the Sap Pools, the Root Stair, then the Gate Ledge with the Root Gate on top). The
  // keys are on the Thornbacks, one on each level, and a column of spores lifts you up the middle.
  hollow5: {
    id: 'hollow5', name: 'The Root Gate', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    ...lay({
      width: 2000, ground: 1000, by: 'y',
      ledges: [
        { x: 80, y: 920, w: 360, root: 'left' }, { x: 1500, y: 920, w: 420, root: 'right' }, { x: 560, y: 860, w: 300, hang: true }, { x: 1080, y: 850, w: 320, hang: true },
        { x: 200, y: 770, w: 260, hang: true }, { x: 1340, y: 760, w: 300, hang: true }, { x: 760, y: 720, w: 240, hang: true }, { x: 100, y: 680, w: 300, root: 'left' }, { x: 1600, y: 680, w: 280, hang: true },
        { x: 520, y: 620, w: 260, hang: true }, { x: 1220, y: 610, w: 240, hang: true }, { x: 820, y: 530, w: 420, thick: 44, hang: true },
        { x: 120, y: 600, w: 130, root: 'left' },
      ],
      zones: [
        { name: 'The Sap Pools', color: '#e8c070', mobs: [], look: { sky: ['#4a2a14', '#8a5220', '#d8903a'] } },
        { name: 'The Root Stair', color: '#b08ad8', from: 800, mobs: [] },
        { name: 'The Gate Ledge', color: '#9fd88a', from: 650, mobs: [], look: { sky: ['#3a3a2a', '#6a6a3a', '#b8b060'] } },
      ],
    }),
    look: { painted: 'rootroom', glow: '#ffc860', glowAt: [1000, 1000], sky: ['#4a2e1a', '#9a6028', '#e8a850'], far: '#5a3a20', mid: '#7a5030', midTrim: '#b88048', material: 'rootfloor', islands: 'rootshelf', ropes: 'root', props: [], clouds: false, critters: ['firefly'], light: 'crag', drift: 'spore', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'] },
    task: { kind: 'keys', label: 'Find the Root Keys', count: 3 },
    flood: { every: 24, warn: 3, last: 7, damage: 40 },
    updrafts: [{ x: 1040, w: 60, top: 540, bottom: 1000, kind: 'spores' }],
    deco: [['rootwall', 60, 2], ['rootwall', 1950, 3], ['rootceiling', 210, 0, 96, { under: true }], ['rootceiling', 630, 1, 96, { under: true }], ['rootceiling', 1050, 2, 96, { under: true }], ['rootceiling', 1470, 3, 96, { under: true }], ['rootceiling', 1890, 0, 96, { under: true }], ['rootgate', 1160, 0, 530]],
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

  // Heart of the Hollow (remade 2026-11-18): the round chamber under the great tree's glowing heart,
  // lit teal, ringed with two tiers of root shelves hung from the roots above. Gnarlroot's heart
  // opens above him in his last phase: strike it from up high.
  hollow6: {
    id: 'hollow6', name: 'Heart of the Hollow', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 1500, height: 420, groundY: G,
    platforms: [
      { x: 140, y: 300, w: 170, hang: true }, { x: 560, y: 300, w: 150, hang: true }, { x: 900, y: 300, w: 150, hang: true }, { x: 1220, y: 300, w: 170, hang: true },
      { x: 640, y: 220, w: 120, hang: true }, { x: 860, y: 220, w: 120, hang: true }, { x: 250, y: 220, w: 140, hang: true }, { x: 1060, y: 220, w: 140, hang: true },
      { x: 1180, y: 140, w: 100, hang: true },
    ],
    ropes: [],
    look: { painted: 'rootroom', glow: '#7fe6d6', glowAt: [860, 260], sky: ['#14242e', '#1e4a4a', '#5ac0a8'], far: '#1e3a3a', mid: '#2e5a52', midTrim: '#5aa088', material: 'rootfloor', islands: 'rootshelf', ropes: 'root', props: [], clouds: false, critters: ['firefly'], light: 'hollow', drift: 'spore', shrooms: ['#7fe6d6', '#c4f6ee', '#9fffb0'] },
    deco: [['rootwall', 0, 0], ['rootwall', 1500, 1], ['rootceiling', 210, 0, 96, { under: true }], ['rootceiling', 630, 1, 96, { under: true }], ['rootceiling', 1050, 2, 96, { under: true }], ['rootceiling', 1470, 3, 96, { under: true }], ['glowpool', 380], ['glowpool', 1120]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow5', toPortal: 'east' },
      { id: 'out', x: 1450, y: G, to: 'hollow_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'gnarlroot', x: 860, y: G }],
  },
});

// (Up the great mushroom's stalk in Capper's Garden you climb a vine, not a root.)
for (const r of MAPS.hollow2.ropes) if (r.x === 700) r.style = 'vine';

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

MAPS.woods.portals.push({ id: 'manor', x: 250, y: 520, to: 'manor_gate', toPortal: 'south', label: 'Moonlit Manor' });

Object.assign(MAPS, {
  // Manor Hill: the garden path up from the treetops of Mossy Woods to the manor's iron gates, where
  // old Mr. Pumpkins keeps the gate and finds groups. The manor looms on the hill behind.
  // Manor Hill (remade 2026-11-18, Chapter 4): the road up to Lady Marigold's manor, where the party
  // has gone on for a hundred years with no guests. The road climbs the hill in two slopes to the
  // gates at the top (Mr. Pumpkins, the door into the garden); stone terraces stand over the road on
  // ivy-covered retaining walls; lamp posts strung with paper lanterns; the pumpkin coach waits at
  // the turn. (render/manorhill.js)
  manor_gate: {
    id: 'manor_gate', name: 'Manor Hill', theme: 'manor', town: 'harbor', world: { x: 262, y: 150 }, music: 'manor',
    ...lay({
      width: 1500, ground: 780, by: 'x',
      terrain: [[0, 780], [260, 780], [700, 650], [900, 650], [1180, 540], [1500, 540]],
      ledges: [
        { x: 990, y: 452, w: 170 },
        { x: 560, y: 560, w: 170 },
        { x: 250, y: 690, w: 160 },
      ],
      zones: [
        { name: 'The Hill Road', color: '#c9a6ff', mobs: [] },
        { name: 'The Carriage Turn', color: '#ffb36b', from: 700, mobs: [] },
        { name: 'The Gates', color: '#ffd88a', from: 1180, mobs: [] },
      ],
    }),
    look: {
      painted: 'manorhill', sky: ['#2e2860', '#6a54a8', '#e8a8c8'], far: '#5a4a8a', mid: '#6e5aa0', midTrim: '#c9a6ff', ...MANOR_OUT,
      material: 'manorhill', islands: 'terrace', ropes: 'vine', clouds: false, stars: true, faceAt: 0.24, props: [],
    },
    deco: [
      ['signpost', 180, 0, 780],
      ['partylamp', 236, 1, 780], ['partylamp', 520, 2, 703], ['partylamp', 740, 3, 650], ['partylamp', 1010, 4, 607], ['partylamp', 1250, 5, 540],
      ['rosehedge', 300, 1, 690],
      ['topiary', 600, 0, 560], ['topiary', 690, 0, 560],
      ['pumpkincoach', 840, 0, 650],
      ['topiary', 1015, 0, 452],
      ['rosehedge', 1340, 3, 540],
      ['manorgates', 1410, 0, 540],
    ],
    portals: [
      { id: 'start', x: 1200, y: 540, hidden: true },
      { id: 'south', x: 60, y: 780, to: 'woods', toPortal: 'manor' },
      { id: 'door', x: 1410, y: 540, to: 'manor1', toPortal: 'start', label: 'Moonlit Manor', dungeon: 'manor', mouth: 46, labelAt: 150 },
    ],
    npcs: [{ id: 'pumpkins', x: 1300 }],
    spawns: [],
    nodes: [{ x: 382, y: 690, kind: 'herb' }, { x: 610, y: 560, kind: 'night' }, { x: 1120, y: 452, kind: 'fiber' }],
  },

  // The Moonlit Garden: hedges and topiaries climbing in terraces to the front steps. The fountains
  // spout on a beat and throw you up a terrace (the first one, by the gate, up to a hidden ledge).
  // Light the three garden lanterns; the front door waits at the top. (Remade 2026-11-18: stone
  // terraces on retaining walls like a giant garden staircase, party lights strung across them, the
  // manor facade lit up behind with one figure waltzing alone past its windows: render/manorhill.js.)
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
    look: {
      painted: 'manorgarden', sky: ['#2a2458', '#5a4a96', '#c890c8'], far: '#4a3a7a', mid: '#5a7a6a', midTrim: '#9ad8a0', ...MANOR_OUT,
      material: 'manorhill', islands: 'terrace', ropes: 'vine', clouds: false, stars: true, faceAt: 0.12, props: [],
    },
    deco: [
      ['rosehedge', 300, 1, 760], ['partylamp', 360, 1, 760],
      ['partylamp', 560, 2, 640], ['topiary', 700, 0, 640], ['topiary', 860, 0, 640], ['partylamp', 1010, 3, 640],
      ['partylamp', 1080, 4, 520], ['topiary', 1180, 0, 520], ['rosehedge', 1400, 3, 520], ['partylamp', 1530, 5, 520],
      ['partylamp', 1600, 6, 400], ['topiary', 1700, 0, 400], ['rosehedge', 1830, 4, 400], ['topiary', 1960, 0, 400], ['partylamp', 2060, 7, 400],
    ],
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
      ...packAt('a', 820, 900, 'ghostmaid', 'candlebride', 'ghostmaid'),
      ...packAt('b', 420, 740, 'teahatter', 'ghostmaid'),
      ...packAt('c', 880, 580, 'porcelaindoll', 'teahatter', 'candlebride'),
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
  // weathervane at the top. Lady Marigold is waiting, and at a little tea table by the far chimney
  // her one guest, Elder Sakura, who got lost in her ballroom on festival night (render/manor.js).
  manor6: {
    id: 'manor6', name: 'The Moonlit Rooftop', theme: 'manor', town: 'harbor', dungeon: 'manor', ownLight: true,
    width: 1600, height: 420, groundY: G,
    platforms: [
      { x: 230, y: 296, w: 74 }, { x: 560, y: 300, w: 74 }, { x: 966, y: 300, w: 74 }, { x: 1296, y: 296, w: 74 },
      { x: 760, y: 220, w: 80 },
    ],
    // The weathervane's pole, up to the little platform at its foot (the room's secret).
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { painted: 'manorroof', sky: ['#1a1e4e', '#3a3a86', '#a890d8'], far: '#2e2e66', mid: '#4a4a86', midTrim: '#ffd36b', ...MANOR_OUT, material: 'slate', face: null, bigMoon: true,
      // On the roof (remade 2026-11-18): every ledge is the cap of a brick chimney standing up out of
      // the slates (the tall one carries the weathervane); behind, the manor's other roofs under the
      // big moon and the party's sky lanterns rising; cats up here instead of the hall's candles.
      islands: 'chimney', clouds: false, props: ['cat', 'lantern'], ledgeProp: null },
    portals: [
      { id: 'west', x: 40, y: G, to: 'manor5', toPortal: 'east' },
      { id: 'out', x: 1560, y: G, to: 'manor_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    teaParty: { x: 1420 },
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
  // where Marina the diver keeps her bubble charm and finds groups. (Remade 2026-11-18: the palace's
  // domes glow up through the sea behind, and a diving bell hangs from a crane at the pier's end to
  // take you down: render/aquapalace.js.)
  tidepool_pier: {
    id: 'tidepool_pier', name: 'Tidepool Pier', theme: 'harbor', town: 'harbor', world: { x: 236, y: 214 }, music: 'aquarium',
    width: 1200, height: 420, groundY: G,
    look: { painted: 'tidepier', sky: ['#5a8ad8', '#9ac8e8', '#ffd8c0'], far: '#6a9ad0', mid: '#ffffff', midTrim: '#8fd3ff', skyline: 'sea', light: 'dusk', critters: ['gull'] },
    platforms: [{ x: 420, y: G - 80, w: 140, style: 'planks', posts: true }],
    ropes: [],
    deco: [['signpost', 160], ['shellpile', 300, 0], ['divingbell', 1000]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'harbor', toPortal: 'pier' },
      { id: 'door', x: 1110, y: G, to: 'aquarium1', toPortal: 'start', label: 'Sunken Aquarium Palace', dungeon: 'aquarium' },
    ],
    npcs: [{ id: 'marina', x: 860 }],
    spawns: [],
  },

  // The Coral Gate: down the palace's outer wall, floor by floor, from the surface gate to the sea
  // floor. Bubble lifts carry you back up; three lantern corals to light on the way down. (Remade
  // 2026-11-18: every floor a coral shelf on coral trunks rooted below; the palace wall behind with
  // its towers, shell domes and lit portholes, the light from the surface slanting down.)
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
    look: { painted: 'aquagate', sky: ['#1a4a6e', '#2a6a8a', '#4a9ab0'], far: '#1e5a7a', mid: '#2a7a8a', midTrim: '#ff9ab8', ...SEA_LOOK, material: 'seasand', islands: 'coral', props: [] },
    deco: [
      ['kelpclump', 200, 0, 1100], ['coralclump', 380, 0, 1100], ['shellpile', 700, 0, 1100], ['coralclump', 820, 1, 1100], ['kelpclump', 1300, 2, 1100], ['coralclump', 1460, 2, 1100],
      ['coralclump', 640, 2, 840], ['shellpile', 1400, 0, 960], ['kelpclump', 1060, 1, 700], ['shellpile', 200, 0, 560], ['coralclump', 1300, 1, 420],
    ],
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
  // a hidden grotto. (Remade 2026-11-18: the upper path is sea rocks crowned with kelp, standing on
  // boulder pillars; a kelp forest sways behind under the garden's glass dome.)
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
    look: { painted: 'aquakelp', sky: ['#0e3a4a', '#1a5a5a', '#3a8a7a'], far: '#1a4a4a', mid: '#2a6a5a', midTrim: '#7fd8a8', ...SEA_LOOK, material: 'seasand', islands: 'kelprock', props: [] },
    deco: [
      ['kelpclump', 150, 0, 700], ['coralclump', 440, 0, 700], ['shellpile', 700, 0, 700], ['kelpclump', 880, 1, 700], ['coralclump', 1300, 1, 700],
      ['kelpclump', 1620, 2, 700], ['shellpile', 1900, 0, 700], ['coralclump', 2120, 2, 700], ['kelpclump', 2460, 0, 700],
    ],
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
  // new one each run); open the four clams in it. A wrong one snaps them all shut. (Remade
  // 2026-11-18: the galleries are Queen Coralie's display tanks on sea-glass stands; the walls are
  // shelves of little tanks and pearls between arched windows on the deep.)
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
    look: { painted: 'aquahall', hall: 'vault', sky: ['#1a2a5a', '#2a4a7a', '#6a8ac0'], far: '#22346a', mid: '#3a5a8a', midTrim: '#ffe6f2', ...SEA_LOOK },
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
  // at the bottom in her ink. (Remade 2026-11-18: basalt ledges on basalt columns, glowing with
  // anemones; far back in the dark a great sleepy whale drifts by, and jellies rise glowing.)
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
    look: { painted: 'aquaabyss', sky: ['#0a0e2a', '#14183e', '#2a2a5a'], far: '#121836', mid: '#1e244a', midTrim: '#5ae0c8', ...SEA_LOOK, material: 'abyssfloor', islands: 'abyss', props: [] },
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
  // the coral throne at the back. Queen Coralie holds court on it, among her tanks. (Remade 2026-11-18: the ledges are
  // display tanks on stands, the walls lined with tanks, and behind the throne the biggest tank of
  // all.)
  aquarium6: {
    id: 'aquarium6', name: 'The Throne of Tides', theme: 'aquarium', town: 'harbor', dungeon: 'aquarium',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 300, y: 300, w: 90 }, { x: 1210, y: 300, w: 90 }, { x: 560, y: 300, w: 90 }, { x: 950, y: 300, w: 90 }, { x: 760, y: 220, w: 80 }],
    // The throne's banner rope, up to a ledge over the throne (the room's secret).
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { painted: 'aquahall', hall: 'throne', sky: ['#0e2a4e', '#1e4a7a', '#5a9ad0'], far: '#183a66', mid: '#2a5a8a', midTrim: '#ff9ab8', ...SEA_LOOK },
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
  // lights where Tock, a runaway tin soldier, finds groups. (Remade 2026-11-18, Chapter 6, like the
  // rooms inside: render/fairground.js. The whole fair lit up beyond, a ticket booth to climb.)
  carnival_gate: {
    id: 'carnival_gate', name: 'Carnival Gates', theme: 'carnival', town: 'grove', world: { x: 400, y: 104 }, music: 'carnival',
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#2a2a6a', '#7a4aa8', '#ff9ab8'], far: '#4a3a8a', mid: '#6a4aa8', midTrim: '#ffd36b', ...FAIR_OUT, painted: 'fairgate', islands: 'booth', props: [], ledgeProp: null },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160], ['popcorncart', 270], ['balloonstand', 700, 1], ['fairarch', 1060]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'shrine', toPortal: 'carnival' },
      { id: 'door', x: 1060, y: G, to: 'carnival1', toPortal: 'start', label: 'Clockwork Carnival', dungeon: 'carnival' },
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
        { x: 900, y: 520, w: 90, style: 'pony', drift: { dx: 150, period: 6 } }, { x: 1460, y: 520, w: 90, style: 'pony', drift: { dx: 220, period: 7 } },
        { x: 1150, y: 440, w: 300, style: 'carousel' }, { x: 300, y: 500, w: 360 }, { x: 1900, y: 500, w: 420 }, { x: 2420, y: 400, w: 110, style: 'trestle' },
      ],
      zones: [
        { name: 'The Ticket Stalls', color: '#ff9ab8', mobs: [] },
        { name: 'The Carousel', color: '#ffd36b', from: 850, mobs: [] },
        { name: 'The Prize Booths', color: '#7fd8ff', from: 1800, mobs: [] },
      ],
    }),
    look: { sky: ['#2a2a6a', '#7a4aa8', '#ff9ab8'], far: '#4a3a8a', mid: '#6a4aa8', midTrim: '#ffd36b', ...FAIR_OUT, skyline: 'midway', painted: 'midway', islands: 'booth', props: [], ledgeProp: null },
    deco: [['popcorncart', 760], ['balloonstand', 1850, 2]],
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
    look: { sky: ['#3a1e5a', '#7a3a8a', '#e07ab0'], far: '#5a2a6a', mid: '#8a4a8a', midTrim: '#7fd8ff', ...FAIR_IN, skyline: 'funhouse' },
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
      { x: 1860, y: 300, w: 200 }, { x: 2280, y: 300, w: 180 }, { x: 1214, y: 220, w: 110 },
    ],
    ropes: [{ x: 1268, top: 220, bottom: G }],
    look: { sky: ['#1e2a5a', '#5a3a8a', '#ff8a8a'], far: '#3a3070', mid: '#5a4a90', midTrim: '#ff7aa8', ...FAIR_OUT, skyline: 'coaster', painted: 'coasteryard', islands: 'trestle', props: [], ledgeProp: null },
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
    look: { sky: ['#1a1a4a', '#4a2a7a', '#c86aa8'], far: '#2e2a66', mid: '#4a3a86', midTrim: '#ffd36b', ...FAIR_OUT, skyline: 'ferris', painted: 'ferriswheel', islands: 'gondola', props: [], ledgeProp: null },
    deco: [['popcorncart', 180], ['fairbench', 1250], ['balloonstand', 1530, 3]],
    // (Queen Gearheart's whack-a-mole holes: world/carnival.js.)
    holes: [400, 490, 725, 975, 1170, 1330],
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
    look: { sky: ['#0e1440', '#2a2a7a', '#6a5ab0'], far: '#1e2a5a', mid: '#2e3a72', midTrim: '#fff3a6', ...STAR_OUT, painted: 'stargate', islands: 'starbalcony', props: [], ledgeProp: null },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160], ['starscope', 660], ['stararch', 1070]],
    portals: [
      { id: 'start', x: 640, y: G, hidden: true },
      { id: 'west', x: 50, y: G, to: 'ridge', toPortal: 'observatory' },
      { id: 'door', x: 1070, y: G, to: 'observatory1', toPortal: 'start', label: 'Star Observatory', dungeon: 'observatory' },
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
    look: { sky: ['#0e1440', '#2a2a7a', '#6a5ab0'], far: '#1e2a5a', mid: '#2e3a72', midTrim: '#fff3a6', ...STAR_OUT, painted: 'starstair', islands: 'starbalcony', props: [], ledgeProp: null },
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
      { x: 200, y: 300, w: 90, style: 'planet', drift: { dx: 260, period: 8 } }, { x: 1100, y: 300, w: 90, style: 'planet', drift: { dx: 260, period: 9 } },
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
    look: { sky: ['#06082a', '#1a1a5a', '#4a3a90'], far: '#121a4a', mid: '#1e2a66', midTrim: '#fff3a6', ...STAR_OUT, material: 'starstone', painted: 'starcrown', islands: 'gantry', props: [], ledgeProp: null, clouds: false },
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
    look: { sky: ['#ff9ab8', '#ffc8a0', '#fff0c8'], far: '#e08aa8', mid: '#f0a8c0', midTrim: '#ffd36b', ...SUGAR, painted: 'gumdropvale', islands: 'wafer', material: 'cocoacake', props: [], ledgeProp: null },
    platforms: [{ x: 420, y: G - 80, w: 140 }],
    ropes: [],
    deco: [['signpost', 160], ['gumdrop', 300], ['lollipop', 640], ['gumdrop', 700], ['sugararch', 1110]],
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
    look: { sky: ['#ff9ab8', '#ffc8a0', '#fff0c8'], far: '#e08aa8', mid: '#f0a8c0', midTrim: '#ffd36b', ...SUGAR, painted: 'gumdropvale', islands: 'wafer', material: 'cocoacake', props: [], ledgeProp: null },
    deco: [['lollipop', 250], ['gumdrop', 720], ['gumdrop', 1870], ['lollipop', 2300], ['gumdrop', 2420]],
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
      { x: 140, y: 300, w: 300 }, { x: 820, y: 300, w: 100, style: 'minecart', drift: { dx: 420, period: 7 } }, { x: 1440, y: 300, w: 100, style: 'minecart', drift: { dx: 420, period: 8 } },
      { x: 2100, y: 300, w: 360 }, { x: 1250, y: 220, w: 140 },
    ],
    ropes: [{ x: 1320, top: 220, bottom: G }],
    look: { sky: ['#3a1e2a', '#5a2e3e', '#8a4a5a'], far: '#3e2230', mid: '#5a3240', midTrim: '#ff7aa8', ...SUGAR_IN, painted: 'licoricemine', material: 'chocrock' },
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
    platforms: [{ x: 200, y: 300, w: 300 }, { x: 1100, y: 300, w: 300 }, { x: 720, y: 220, w: 160, style: 'potrack' }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#4a2a3a', '#7a4a5a', '#c88a8a'], far: '#5a3040', mid: '#7a4656', midTrim: '#ffd36b', ...SUGAR_IN, skyline: 'kitchen', painted: 'candykitchen' },
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
    platforms: [{ x: 180, y: 300, w: 200 }, { x: 1220, y: 300, w: 200 }, { x: 720, y: 220, w: 160, style: 'hangdeck' }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#4a1a1a', '#8a3a2a', '#e08a4a'], far: '#5a2420', mid: '#7a3a2a', midTrim: '#ffd36b', ...SUGAR_IN, skyline: 'forge', painted: 'caramelforge', material: 'toffeeflag' },
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
    look: { sky: ['#ff8a6a', '#ffb88a', '#ffe8c0'], far: '#c86a5a', mid: '#e08a6a', midTrim: '#ffffff', ...SUGAR, skyline: 'ramparts', material: 'gingerbread', painted: 'gingerwall', islands: 'turret', props: [], ledgeProp: null },
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
    look: { sky: ['#5a1a2a', '#c84a4a', '#ffb06a'], far: '#7a2a2a', mid: '#a04040', midTrim: '#ffd36b', ...SUGAR, skyline: 'crater', material: 'rockcandy', critters: [], painted: 'crater', islands: 'rockpillar', props: [], ledgeProp: null },
    flood: { every: 18, warn: 3, last: 6, damage: 80, color: 'frosting', name: 'The frosting floods in!' },
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

  // Act I: The Morning Train (Chapter 9, the Queen's dream: render/dreamsets.js). A packed commuter
  // carriage, rocking on the rails, the town rushing past its windows; luggage racks along the walls,
  // and when it lurches, bags tumble off them onto marked spots.
  theatre2: {
    id: 'theatre2', name: 'Act I: The Morning Train', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 2200, height: 420, groundY: G,
    platforms: [
      { x: 200, y: 300, w: 260 }, { x: 760, y: 300, w: 240 }, { x: 1320, y: 300, w: 240 },
      { x: 820, y: 220, w: 120 }, { x: 1380, y: 220, w: 120 }, { x: 1820, y: 300, w: 240 },
    ],
    ropes: [{ x: 880, top: 220, bottom: G }, { x: 1440, top: 220, bottom: G }, { x: 330, top: 300, bottom: G }],
    look: { sky: ['#ff8a6a', '#ffb08a', '#ffe0a0'], far: '#5a3a5a', mid: '#7a4a5a', midTrim: '#ffd36b', ...STAGE, skyline: 'pirate', painted: 'dreamtrain', islands: 'luggagerack', clouds: false, props: [], ledgeProp: null, edges: null },
    train: true,
    rocking: { period: 7, push: 55 },
    cannons: { every: 9, damage: 190, look: 'bags', call: 'Bags off the racks!', tip: 'Step out from under them!' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre1', toPortal: 'east' },
      { id: 'east', x: 2160, y: G, to: 'theatre3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...packAt('a', 420, G, 'sleepysheep', 'paperdragon'),
      ...packAt('b', 330, 300, 'paperdragon', 'sleepysheep'),
      ...packAt('c', 880, 300, 'sleepysheep', 'paperdragon'),
      ...packAt('d', 1100, G, 'paperdragon', 'sleepysheep', 'paperdragon'),
      ...packAt('e', 1440, 300, 'sleepysheep', 'paperdragon'),
      ...packAt('f', 1800, G, 'paperdragon', 'sleepysheep', 'sleepysheep'),
    ],
  },

  // Act II: The Office (Chapter 9, the Queen's dream). Nine in the morning, rows of desks, the city
  // through the windows; filing cabinets and a tower of copy-paper boxes to climb. Four desk phones
  // ring in a sequence: answer them in the same order.
  theatre3: {
    id: 'theatre3', name: 'Act II: The Office', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 200, y: 300, w: 280, style: 'cabinets' }, { x: 1120, y: 300, w: 280, style: 'cabinets' }, { x: 720, y: 220, w: 160, style: 'boxstack' }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#1e2a4a', '#2a4a5a', '#4a7a6a'], far: '#22384a', mid: '#2e4a50', midTrim: '#8ff0c8', ...STAGE, skyline: 'fairy', painted: 'dreamoffice', clouds: false, props: [], ledgeProp: null, edges: null },
    task: { kind: 'light', object: 'cue', label: 'Answer the phones in order' },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre2', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'theatre4', toPortal: 'west', sealed: true },
    ],
    objects: [
      { kind: 'cue', colour: 'rose', x: 340, y: 300, phone: true }, { kind: 'cue', colour: 'gold', x: 620, y: G, phone: true },
      { kind: 'cue', colour: 'mint', x: 980, y: G, phone: true }, { kind: 'cue', colour: 'violet', x: 1260, y: 300, phone: true },
    ],
    npcs: [],
    spawns: [...packAt('a', 300, G, 'prompter', 'primadonna', 'prompter'), ...packAt('b', 1300, G, 'primadonna', 'prompter', 'primadonna')],
  },

  // Act III: Overtime (Chapter 9, the Queen's dream). The same office at a quarter to midnight, the
  // monitors glowing, one lamp still on, the paperwork piled to the ceiling.
  theatre4: {
    id: 'theatre4', name: 'Act III: Overtime', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1600, height: 420, groundY: G,
    platforms: [{ x: 180, y: 300, w: 200 }, { x: 1220, y: 300, w: 200 }, { x: 720, y: 220, w: 160 }],
    ropes: [{ x: 800, top: 220, bottom: G }],
    look: { sky: ['#2a1a4a', '#5a3a7a', '#a07ab0'], far: '#3a2450', mid: '#5a3a6a', midTrim: '#ffd36b', ...STAGE, skyline: 'ballroom', painted: 'dreamovertime', islands: 'paperstack', clouds: false, props: [], ledgeProp: null, edges: null },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre3', toPortal: 'east' },
      { id: 'east', x: 1560, y: G, to: 'theatre5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'mugboss', x: 800, y: G }],
  },

  // The Convenience Store, 2 a.m. (Chapter 9, the Queen's dream). Fluorescent and humming, the
  // fridges glowing along the back, rain on the street outside; shop shelving and drink crates.
  theatre5: {
    id: 'theatre5', name: 'The Convenience Store, 2 a.m.', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1800, height: 420, groundY: G,
    platforms: [{ x: 160, y: 300, w: 180 }, { x: 800, y: 300, w: 200 }, { x: 1460, y: 300, w: 180 }, { x: 850, y: 220, w: 100, style: 'crates' }],
    ropes: [{ x: 900, top: 220, bottom: G }, { x: 250, top: 300, bottom: G }, { x: 1550, top: 300, bottom: G }],
    look: { sky: ['#1a1a24', '#2a2a3a', '#4a3a4a'], far: '#24202e', mid: '#3a3040', midTrim: '#ffd36b', ...STAGE, skyline: 'backstage', painted: 'dreamstore', islands: 'storeshelf', clouds: false, props: [], ledgeProp: null, edges: null },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre4', toPortal: 'east' },
      { id: 'east', x: 1760, y: G, to: 'theatre6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'noodledragon', x: 900, y: G }],
  },

  // The Final Curtain: Her Flat (Chapter 9, the Queen's dream). Two in the morning, rain on the
  // window, Mr. Prickles on the sill, the calendar with Monday circled; her bookshelf, wardrobe,
  // fridge and loft bed to climb, a shelf on the wall.
  theatre6: {
    id: 'theatre6', name: 'The Final Curtain: Her Flat', theme: 'theatre', town: 'grove', dungeon: 'theatre',
    width: 1800, height: 420, groundY: G,
    platforms: [
      { x: 160, y: 300, w: 160, style: 'bookshelf' }, { x: 560, y: 300, w: 140, style: 'wardrobe' }, { x: 1100, y: 300, w: 140, style: 'fridge' }, { x: 1480, y: 300, w: 160, style: 'loftbed' },
      { x: 840, y: 220, w: 120, style: 'wallshelf' },
    ],
    ropes: [{ x: 900, top: 220, bottom: G }],
    look: { sky: ['#140e2a', '#2a1a4a', '#5a2a5a'], far: '#1e1434', mid: '#3a1e44', midTrim: '#ffd36b', ...STAGE, skyline: 'greatstage', painted: 'dreamflat', material: 'parquet', clouds: false, props: [], ledgeProp: null, edges: null },
    portals: [
      { id: 'west', x: 40, y: G, to: 'theatre5', toPortal: 'east' },
      { id: 'out', x: 1760, y: G, to: 'theatre_row', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'monday', x: 1000, y: G }],
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
    spawns: [{ mob: 'whalestorm', x: 900, y: G }],
  },
});

MAPS.sky.portals.push({ id: 'theatre', x: 2040, y: 1040, to: 'theatre_row', toPortal: 'west', label: 'Theatre Row' });

// ---------- The far regions (levels 19-50) ----------
//
// Off the ring road: the Whispering Glade past Mossy Woods, the Fox Shrine Path past the Twilight
// Ruins, Moonlit Ridge above Ember Crag, and the climb from the Crystal Cave through Serpent
// Springs and Frozen Peak to the Sky Garden, with Starfall Heights over its top.

// `n` monsters evenly along a surface from x1 to x2 at height y, taking turns from `mobs`.
const along = (y, x1, x2, n, ...mobs) => Array.from({ length: n }, (_, i) => ({ mob: mobs[i % mobs.length], x: Math.round(x1 + ((i + 0.5) / n) * (x2 - x1)), y }));

MAPS.woods.portals.push({ id: 'glade', x: 1540, y: 520, to: 'glade', toPortal: 'west', label: 'Whispering Glade' });
// The way to the shrine leads off the collapsed halls.
MAPS.ruins.portals.push({ id: 'shrine', x: 1750, y: 580, to: 'shrine', toPortal: 'west', label: 'Fox Shrine Path' });
// The tunnel to the springs leaves from the cave's east rim.
MAPS.cave.portals.push({ id: 'springs', x: 1960, y: 400, to: 'springs', toPortal: 'west', label: 'Serpent Springs' });

Object.assign(MAPS, {
  // The Whispering Glade (remade 2026-11-12, the player's pick: small, two tiers): a little valley
  // in the woods. Below, the Flower Meadow round a pool, with the fishing dock out over it and the
  // way back to Mossy Woods in the west. A low mossy cliff stands either side, a step part-way up
  // each, and on top the Fairy Grove: the two cliff tops and the rock lip between them that the
  // waterfall pours off into the pool. The falls' mist lifts you (Up to ride it) to the leaf above,
  // where the Blossom Fairies keep their hoard and the way on to Sylvana's Bower is. (Its little folk
  // are tanukis in disguise: the Puddle Kids below, the Blossom Fairies up top.)
  glade: {
    id: 'glade', name: 'Whispering Glade', theme: 'forest', town: 'harbor', world: { x: 278, y: 160 }, perSpawn: 3,
    look: { sky: ['#8fe0d8', '#d2f4ea', '#fffbe8'], far: '#8fd6bc', mid: '#6cc4a0', midTrim: '#4fae86', light: 'morning', forestStyle: 'glade', material: 'glade', edges: 'flowers', props: ['flower', 'tuft', 'tulip'], propKeep: 0.45, ledgeKeep: 0.35, drift: null, critters: [], noAmbient: true, rainbow: 0.35 },
    ...lay({
      width: 1000, ground: 900, by: 'y',
      // The meadow, and the pool sunk in the middle under the falls.
      terrain: [[0, 900], [380, 900], [380, 940], [620, 940], [620, 900], [1000, 900]],
      // (No monsters in the pool, on the dock, the lip or the leaf.)
      quiet: [[500, 940, 140], [380, 900, 60], [500, 480, 120]],
      zones: [
        { name: 'Flower Meadow', color: '#e889b4', mobs: ['puddlekid', 'blossomfairy'], nodes: [SPOT.fruit(2, 'whisperberry'), SPOT.fiber(2), SPOT.ore(2)] },
        { name: 'Fairy Grove', color: '#6fae5f', from: 700, mobs: ['blossomfairy'], nodes: [SPOT.honey(2), SPOT.fruit(2, 'whisperberry'), SPOT.night(2)],
          look: { sky: ['#b8ecd8', '#e2f8e8', '#fffbe6'], far: '#b0e4c4', mid: '#90d4a8' } },
      ],
      ledges: [
        // A step part-way up each cliff, then its top.
        { x: 170, y: 780, w: 170, noRope: true }, { x: 660, y: 780, w: 170, noRope: true },
        { x: 0, y: 660, w: 400, noRope: true }, { x: 600, y: 660, w: 400, noRope: true },
        // A little footbridge between the cliff tops, the falls pouring down behind it (one walk
        // across the top).
        { x: 400, y: 660, w: 200, style: 'bridge', noProps: true, noRope: true },
        // The leaf above the falls, with the fairies' hoard.
        { x: 400, y: 480, w: 200, style: 'leaf', noProps: true, noRope: true },
        // The fishing dock off the bank, out over the pool.
        { x: 380, y: 900, w: 80, posts: true, walkOn: true },
      ],
    }),
    // Its monsters, placed by hand (three each: perSpawn; 2026-11-20, the hunting pace): Puddle Kids on the meadow, Blossom Fairies up the cliffs.
    // (Kept clear of the arrivals: the way in from the woods in the west, and the way back down
    // from Sylvana's Bower on the leaf.)
    spawns: [
      { mob: 'puddlekid', x: 800, y: 900 }, { mob: 'puddlekid', x: 940, y: 900 },
      { mob: 'blossomfairy', x: 90, y: 660 }, { mob: 'blossomfairy', x: 740, y: 780 }, { mob: 'blossomfairy', x: 910, y: 660 }, { mob: 'blossomfairy', x: 500, y: 660 },
    ],
    // Its gathering spots, placed by hand.
    nodes: [
      { ...SPOT.fruit(2, 'whisperberry'), x: 250, y: 900 }, { ...SPOT.ore(2), x: 670, y: 900 }, { ...SPOT.fiber(2), x: 230, y: 780 },
      { ...SPOT.fruit(2, 'whisperberry'), x: 310, y: 660 }, { ...SPOT.honey(2), x: 700, y: 660 }, { ...SPOT.night(2), x: 455, y: 480 },
    ],
    // Mossy vines to climb: off the meadow onto each cliff's step, on up to its top, and from the lip
    // up to the leaf.
    ropes: [{ x: 320, top: 780, bottom: 900 }, { x: 680, top: 780, bottom: 900 }, { x: 190, top: 660, bottom: 780 }, { x: 810, top: 660, bottom: 780 }, { x: 410, top: 480, bottom: 660 }],
    // A blossom on the meadow to bounce you up, and the falls' mist to float you up to the leaf.
    springs: [{ x: 90, y: 900, up: 170, kind: 'blossom' }],
    updrafts: [{ x: 600, w: 40, top: 440, bottom: 900, kind: 'mist' }],
    // The pool under the falls, waist-deep on its bed.
    water: [{ x1: 380, x2: 620, y: 914, kind: 'spring' }],
    portals: [{ id: 'west', x: 40, y: 900, to: 'woods', toPortal: 'glade' }],
    npcs: [],
    // The two low cliffs (gladecliff: 0 west, 1 east), the mossy rock pillar rising out of the pool
    // that the falls spring from (2), and the waterfall down from the cleft near its top: one
    // stretch to the footbridge, one on from under its planks into the pool (so the bridge reads
    // as crossing in front of the water).
    deco: [['gladecliff', 150, 0], ['gladecliff', 850, 1], ['gladecliff', 500, 2], ['waterfall', 500, 116, 656, { under: true }], ['waterfall', 500, 258, 914, { under: true }]],
    lamps: [{ x: 260, y: 850 }, { x: 760, y: 850 }, { x: 500, y: 440 }],
    spirit: { x: 500, y: 420 },
    // (The fairies nap but don't play: playing pulls them off their own ledges.)
    habitats: { blossomfairy: { naps: true }, puddlekid: { naps: true, home: { x: 820, y: 900 } } },
  },



  // The Tanuki Tea Terraces (2026-11-10, the player's pick for levels 24-28) are a valley: you
  // arrive high on the west rim from the Twilight Ruins and come down the terraces into a misty
  // hollow, then climb out the east side to the Crystal Cave. The Upper Rows, the tea rows on the
  // west rim, where the Tanuki Pickers work and a kettle lid bounces you up; the Kettle Steps, the
  // terraced slope down, where the Kettle Tanuki sit steaming and vents puff you up the steps; the
  // Mist Hollow at the bottom, round the pond and the giant teapot hut, where the Lantern Tanuki
  // drift (and a tea tray floats over the pond); and the Sunrise Rows, the climb out of the east
  // side, pickers and kettles together, with the way on to the cave at the top and a homestone.
  tea: {
    id: 'tea', name: 'Tanuki Tea Terraces', theme: 'tea', town: 'grove', world: { x: 330, y: 120 },
    ...lay({
      width: 3000, ground: 1040, by: 'x',
      // The valley: the west rim, three terraces down, the hollow (a pond sunk in it), three up.
      terrain: [[0, 560], [900, 560], [900, 680], [1100, 680], [1100, 800], [1300, 800], [1300, 920], [1500, 920], [1500, 1040],
        [1600, 1040], [1624, 1078], [1736, 1078], [1760, 1040], [2300, 1040], [2300, 900], [2500, 900], [2500, 760], [2700, 760], [2700, 620], [3000, 620]],
      // Ropes down each terrace face, on its low side.
      ropes: [{ x: 912, top: 560, bottom: 680 }, { x: 1112, top: 680, bottom: 800 }, { x: 1312, top: 800, bottom: 920 }, { x: 1512, top: 920, bottom: 1040 },
        { x: 2288, top: 900, bottom: 1040 }, { x: 2488, top: 760, bottom: 900 }, { x: 2688, top: 620, bottom: 760 }],
      quiet: [[40, 560, 340], [2960, 620, 200], [1650, 1000, 60]],
      zones: [
        { name: 'Upper Rows', color: '#7cb86a', from: 0, mobs: ['tanukipicker'], nodes: [SPOT.fruit(3, 'shrine_plum'), SPOT.fiber(3), SPOT.wood(3)] },
        { name: 'Kettle Steps', color: '#6a7486', from: 900, mobs: ['kettletanuki', 'tanukipicker'], nodes: [SPOT.ore(3), SPOT.herb(3, 'steam_ginger')],
          look: { sky: ['#cfe6c4', '#eef4d8', '#fff4e0'] } },
        { name: 'Mist Hollow', color: '#c8463c', from: 1500, mobs: ['lantertanuki', 'lantertanuki', 'kettletanuki'], nodes: [SPOT.herb(3, 'duskcap', { night: true }), SPOT.night(3), SPOT.fiber(3)],
          look: { sky: ['#b4c8c4', '#dce6dc', '#f4f2e6'] } },
        { name: 'Sunrise Rows', color: '#e0a040', from: 2300, mobs: ['tanukipicker', 'kettletanuki'], nodes: [SPOT.fruit(3, 'cherry'), SPOT.wood(3)],
          look: { sky: ['#ffd6a8', '#ffe8c8', '#fff6e8'] } },
      ],
      ledges: [
        // The Upper Rows: tea terraces stepping up above the rim.
        { x: 160, y: 480, w: 300 }, { x: 520, y: 480, w: 260 }, { x: 300, y: 400, w: 280 }, { x: 640, y: 400, w: 200 }, { x: 420, y: 320, w: 240 },
        // The Kettle Steps: a ledge over each terrace.
        { x: 940, y: 600, w: 140 }, { x: 1140, y: 720, w: 140 }, { x: 1340, y: 840, w: 140 },
        // The Mist Hollow: ledges round the teapot hut and a high perch above it (the secret).
        { x: 1790, y: 960, w: 180 }, { x: 1830, y: 880, w: 170 }, { x: 1870, y: 800, w: 150 }, { x: 1900, y: 720, w: 110 },
        // The Sunrise Rows.
        { x: 2340, y: 820, w: 140 }, { x: 2540, y: 680, w: 140 }, { x: 2760, y: 540, w: 180 },
        // The tea tray drifting over the pond and up toward the perch.
        { x: 1560, y: 960, w: 110, drift: { dx: 200, period: 10 } },
      ],
    }),
    // A moving part per zone: a big kettle lid that bounces you up the rows, steam vents up the
    // steps, the tea tray floating over the pond, and a vent on the sunrise climb.
    springs: [{ x: 780, y: 560, up: 170, kind: 'kettle' }, { x: 1200, y: 800, up: 170, kind: 'gust' }, { x: 2400, y: 900, up: 170, kind: 'gust' }],
    water: [{ x1: 1600, x2: 1760, y: 1046, kind: 'spring' }],
    portals: [
      { id: 'west', x: 40, y: 560, to: 'ruins', toPortal: 'east' },
      { id: 'east', x: 2960, y: 620, to: 'cave', toPortal: 'west' },
      // The shortcut home: a homestone back to Moonleaf Grove at the far end.
      { id: 'homestone', x: 2850, y: 540, to: 'grove', toPortal: 'start', homestone: true, label: 'Home: Moonleaf Grove' },
    ],
    // Master Sencha keeps his tea stall on the rim, where you arrive, clear of the rows.
    npcs: [{ id: 'sencha', x: 260 }],
    // A landmark per zone: the tea bush clipped into a sleeping tanuki on the rim, the tower of
    // kettles on the steps, the giant teapot hut in the hollow, a smaller clipped tanuki up the
    // sunrise rows.
    deco: [['teatopiary', 480, 0, 560], ['kettlestack', 1200, 0, 800], ['teapothut', 2130, 0, 1040], ['teatopiary', 2600, 1, 760], ['stonelamp', 1560, 0, 1040], ['stonelamp', 2262, 0, 1040]],
    lamps: [{ x: 1560, y: 1010 }, { x: 2262, y: 1010 }, { x: 2168, y: 970 }, { x: 600, y: 530 }],
    spirit: { x: 1700, y: 900 },
    habitats: { tanukipicker: { naps: true, play: true }, kettletanuki: { naps: true, home: { x: 1200, y: 800 } }, lantertanuki: { play: true, home: { x: 2130, y: 1040 } } },
    // The area boss (world/nest.js): after enough hunting, the Grand Kettle steps out of his hut.
    nest: { mob: 'grandkettle', x: 2130, y: 1040, kills: 150, name: 'The giant teapot hut', wake: 'WHO is rattling MY kettles?! Everyone to the teapot hut!', stirs: ['Steam is puffing out of the giant teapot hut...', "The teapot hut's lid is rattling! Someone very old and very round is waking up."] },
  },

  // The Fox Shrine Path (its makeover, 2026-11-20): a sacred hill built round its landmarks
  // (render/shrineart.js), zones by height. The Torii Steps on the ground: you come in by the
  // five-tier pagoda (its roofs are the steps up it, a jump apart) and walk under the giant sacred
  // cherry with the straw rope round its trunk, foxfire rising between them (Up to ride it to the
  // cherry's crown); a great gate opens the steep stone stair climbing the hill under a tunnel of
  // vermilion gates. The Lantern Terraces: the pagoda's middle roofs, a lantern bridge from its
  // fourth roof across to the cherry's boughs. The Hokora Heights: the pagoda's top roof, the
  // cherry's crown (the homestone stands in it, by the foxfire) and the summit, where the Fox Shrine stands (its doorway is the way into
  // Tamamo's Sanctum) and the road to the Clockwork Carnival leaves.
  shrine: {
    id: 'shrine', name: 'Fox Shrine Path', theme: 'shrine', town: 'grove', world: { x: 378, y: 86 }, perSpawn: 2,
    // (The hill is soft earth under a grass cap, Petal Meadow's, not the old path's stone slabs.)
    look: { material: 'petal', props: [], ledgeKeep: 1 },
    ...lay({
      width: 2000, ground: 960, by: 'y',
      // The ground, the stair up the hill (render/shrineart.js TS_RUN x TS_RISE) and the summit.
      terrain: [[0, 960], [1000, 960], [1480, 520], [2000, 520]],
      // Up the cherry: from the ground to its low bough, on to its mid bough, on to its crown.
      ropes: [{ x: 610, top: 800, bottom: 960 }, { x: 880, top: 640, bottom: 800 }, { x: 700, top: 480, bottom: 640 }],
      quiet: [[40, 960, 200], [1965, 520, 120], [1720, 520, 90]],
      zones: [
        { name: 'Torii Steps', color: '#e0504a', mobs: ['nekomata'] },
        { name: 'Lantern Terraces', color: '#e0a040', from: 800, mobs: ['nekomata', 'kitsunemiko'], look: { sky: ['#ffb8a8', '#ffd8c8', '#fff0e4'] } },
        { name: 'Hokora Heights', color: '#8f6cc4', from: 560, mobs: ['kitsunemiko'], look: { sky: ['#c8a8e0', '#e8d0f0', '#fff0f4'] } },
      ],
      ledges: [
        // The pagoda's five roofs, a jump apart (drawn with it).
        { x: 220, y: 880, w: 280, bare: true, noProps: true, noRope: true }, { x: 235, y: 800, w: 250, bare: true, noProps: true, noRope: true },
        { x: 250, y: 720, w: 220, bare: true, noProps: true, noRope: true }, { x: 265, y: 640, w: 190, bare: true, noProps: true, noRope: true },
        { x: 280, y: 560, w: 160, bare: true, noProps: true, noRope: true },
        // The lantern bridge from the pagoda's fourth roof to the cherry's mid bough.
        { x: 452, y: 640, w: 131, style: 'bridge', noProps: true, noRope: true },
        // The cherry's low bough, mid bough and crown (drawn with it).
        { x: 580, y: 800, w: 400, bare: true, noProps: true, noRope: true }, { x: 580, y: 640, w: 320, bare: true, noProps: true, noRope: true },
        { x: 584, y: 480, w: 376, bare: true, noProps: true, noRope: true },
      ],
    }),
    // Its monsters, placed by hand, three a spot, well away from the way in (the arrival rule).
    spawns: [
      { mob: 'nekomata', x: 500, y: 960 }, { mob: 'nekomata', x: 820, y: 960 }, { mob: 'nekomata', x: 1240, y: 740 },
      { mob: 'nekomata', x: 440, y: 880 }, { mob: 'kitsunemiko', x: 340, y: 720 }, { mob: 'kitsunemiko', x: 330, y: 640 }, { mob: 'kitsunemiko', x: 360, y: 560 },
      { mob: 'nekomata', x: 760, y: 800 }, { mob: 'kitsunemiko', x: 760, y: 640 }, { mob: 'kitsunemiko', x: 800, y: 480 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes, foxfire and ways.
    nodes: [
      { ...SPOT.wood(3), x: 300, y: 960 }, { ...SPOT.fruit(3, 'shrine_plum'), x: 680, y: 960 }, { ...SPOT.night(3), x: 940, y: 800 },
      { ...SPOT.fruit(3, 'cherry'), x: 640, y: 640 }, { ...SPOT.fruit(3, 'cherry'), x: 920, y: 480 }, { ...SPOT.ore(3), x: 1530, y: 520 },
    ],
    // A moving part per zone: foxfire rising between the pagoda and the cherry (Up to ride it to the
    // cherry's crown), the petals drifting off the cherry, the paper lanterns on the bridge.
    updrafts: [{ x: 560, w: 44, top: 450, bottom: 960, kind: 'foxfire' }],
    portals: [{ id: 'west', x: 40, y: 960, to: 'ruins', toPortal: 'shrine' }],
    npcs: [],
    // The landmarks: the pagoda, the sacred cherry, the great gate and the torii stair, the Fox
    // Shrine with its fox guardians and a stone lantern.
    deco: [['pagoda', 360, 0], ['sacredtree', 780, 0], ['toriistair', 1000, 0, 960], ['torii', 950], ['foxshrine', 1720, 0, 520],
      ['foxstatue', 1610, 0, 520], ['foxstatue', 1830, 1, 520], ['stonelamp', 1506, 0, 520]],
    lamps: [{ x: 360, y: 930 }, { x: 604, y: 836 }, { x: 956, y: 836 }, { x: 1720, y: 470 }, { x: 1544, y: 390 }, { x: 1896, y: 390 }],
    spirit: { x: 1100, y: 300 },
    habitats: { nekomata: { naps: true, play: true, home: { x: 780, y: 960 } }, kitsunemiko: { naps: true } },
  },

  // Moonlit Ridge (its makeover, 2026-11-20): a walk up a ridgeline built round its landmarks
  // (render/ridgeart.js), zones side by side. The Moonlit Meadow where you come in: the moon gate,
  // two standing moonstones with a capstone across them, the moonbeam rising between them (Up to
  // ride it onto the capstone). The Wolf Den on the knoll: the Lupinas' den, a mound of mossy
  // boulders with a warm doorway, a lantern and a campfire (climb its side boulder to its roof), and
  // a cloud ferrying you over the dip beyond it. The Howling Rock on the summit: a great rock shaped
  // like a wolf howling at the moon (a gust at its foot bounces you onto its crown, the top of
  // Howling Rock for the quests; the homestone stands on its chest), and the road to the
  // observatory at the summit's end.
  ridge: {
    id: 'ridge', name: 'Moonlit Ridge', theme: 'ridge', town: 'crag', world: { x: 246, y: 104 }, perSpawn: 3,
    // (The ridge is soft night earth under a grass lip, not the old heavy cobbles.)
    look: { material: 'grove', props: [], ledgeKeep: 1 },
    ...lay({
      width: 2000, ground: 900, by: 'x',
      // The meadow, the knoll, the dip, the summit.
      terrain: [[0, 900], [640, 900], [640, 780], [1000, 780], [1000, 880], [1320, 880], [1320, 640], [2000, 640]],
      // Down each rock face, beside it from the top.
      ropes: [{ x: 630, top: 780, bottom: 900 }, { x: 1010, top: 780, bottom: 880 }, { x: 1310, top: 640, bottom: 880 }],
      quiet: [[40, 900, 200], [1960, 640, 120]],
      zones: [
        { name: 'Moonlit Meadow', color: '#6a8ad0', from: 0, mobs: ['lupina'] },
        { name: 'Wolf Den', color: '#8a7ab0', from: 640, mobs: ['lupina', 'meteorgolem'], look: { sky: ['#2a2e6a', '#4a4e8a', '#8a8ac0'] } },
        { name: 'Howling Rock', color: '#a8b8e0', from: 1320, mobs: ['meteorgolem', 'lupina'], look: { sky: ['#1e2058', '#3a3c7a', '#6a6aa8'] } },
      ],
      ledges: [
        // The moon gate's capstone (drawn with it) and a rock shelf up to the knoll.
        { x: 270, y: 740, w: 220, bare: true, noProps: true, noRope: true },
        { x: 500, y: 820, w: 132, root: 'right', noProps: true, noRope: true },
        // The den's side boulder and its roof (drawn with it).
        { x: 670, y: 720, w: 76, bare: true, noProps: true, noRope: true }, { x: 730, y: 660, w: 220, bare: true, noProps: true, noRope: true },
        // The Howling Rock's crown and its chest (drawn with it).
        { x: 1620, y: 480, w: 100, bare: true, noProps: true, noRope: true }, { x: 1750, y: 560, w: 84, bare: true, noProps: true, noRope: true },
        // The cloud ferrying you over the dip, knoll to summit.
        { x: 1004, y: 720, w: 110, drift: { dx: 206, period: 9 }, style: 'earth', material: 'sky' },
      ],
    }),
    // Its monsters, placed by hand, three a spot, well away from the ways in (the arrival rule).
    spawns: [
      { mob: 'lupina', x: 520, y: 900 }, { mob: 'lupina', x: 380, y: 740 }, { mob: 'lupina', x: 560, y: 820 },
      { mob: 'lupina', x: 740, y: 780 }, { mob: 'meteorgolem', x: 980, y: 780 }, { mob: 'lupina', x: 880, y: 660 },
      { mob: 'meteorgolem', x: 1110, y: 880 }, { mob: 'meteorgolem', x: 1500, y: 640 }, { mob: 'meteorgolem', x: 1670, y: 480 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes, moonbeam and ways.
    nodes: [
      { ...SPOT.wood(3), x: 170, y: 900 }, { ...SPOT.herb(3, 'moon_thyme'), x: 260, y: 900 }, { ...SPOT.ore(3), x: 860, y: 780 },
      { ...SPOT.ore(3, { gem: 0.16 }), x: 760, y: 660 }, { ...SPOT.night(3), x: 1240, y: 880 }, { ...SPOT.herb(3, 'moon_thyme'), x: 1380, y: 640 },
    ],
    // A moving part per zone: the moonbeam rising through the moon gate, the cloud over the dip,
    // a gust at the Howling Rock's foot.
    updrafts: [{ x: 380, w: 50, top: 700, bottom: 900, kind: 'wisplight' }],
    springs: [{ x: 1598, y: 640, up: 180, kind: 'gust' }],
    portals: [{ id: 'west', x: 40, y: 900, to: 'crag', toPortal: 'ridge' }],
    npcs: [],
    // The landmarks: the moon gate, the den, the Howling Rock, and moonstones by the dip and the road.
    deco: [['moongate', 380, 0], ['wolfden', 840, 0, 780], ['wolfrock', 1650, 0, 640], ['moonstone', 1200, 0, 880], ['moonstone', 1880, 1, 640]],
    lamps: [{ x: 380, y: 860 }, { x: 840, y: 740 }, { x: 944, y: 760 }, { x: 1650, y: 600 }],
    spirit: { x: 1200, y: 600 },
    habitats: { lupina: { play: true, home: { x: 840, y: 780 } }, meteorgolem: { naps: true } },
  },



  // Serpent Springs (its makeover, 2026-11-20): an onsen hillside built round its landmarks
  // (render/springart.js), zones by height. The Hot Spring Pools on the ground: you come in by the
  // bathhouse (steam off its chimney lifts you onto its roof, Up to ride it), the quiet hot pool
  // beside it where you fish (the Lamias never come down into it), and the first of the white
  // mineral terraces. The Waterfall Steps: the terraces climbing the hill, a steaming pool on every
  // step, up to the top basin, where the falls pour off the summit in front of the rose-grown arch
  // into Lilith's Rose Grotto. The Steam Heights: the wooden aqueduct on stilts over the terraces
  // (a rope down from its west end, a hop up to it from the top basin), and the summit, where the
  // Serpent Stone coils (the homestone on its lower coil) and the roads to the Candy Volcano and
  // Frozen Peak leave.
  springs: {
    id: 'springs', name: 'Serpent Springs', theme: 'springs', town: 'grove', world: { x: 256, y: 40 }, perSpawn: 3,
    // (The hill is warm mineral earth under a white crust, no grass over the pools; mountains behind,
    // not the gorge's tall cliffs, which read as windows.)
    look: { material: 'onsen', skyline: 'peaks', props: [], ledgeKeep: 1 },
    ...lay({
      width: 2200, ground: 900, by: 'y',
      // The ground with the hot pool sunk in it, the terraces' steps (render/springart.js
      // TV_STEPS), the top basin under the falls, the cliff and the summit.
      terrain: [[0, 900], [440, 900], [456, 920], [624, 920], [644, 892], [664, 892], [664, 900], [860, 900], [860, 820], [1040, 820], [1040, 740], [1220, 740], [1220, 660], [1400, 660], [1400, 580], [1680, 580], [1680, 420], [2200, 420]],
      // Down from the bathhouse roof's corner; from the aqueduct's west end to the first terrace;
      // down the cliff beside the falls.
      ropes: [{ x: 356, top: 770, bottom: 900 }, { x: 920, top: 500, bottom: 820 }, { x: 1670, top: 420, bottom: 580 }],
      quiet: [[40, 900, 200], [432, 900, 80], [1610, 580, 90], [1760, 420, 90], [2160, 420, 120]],
      zones: [
        { name: 'Hot Spring Pools', color: '#e0705a', mobs: ['lamia'] },
        { name: 'Waterfall Steps', color: '#4fb0d8', from: 780, mobs: ['lamia', 'shade'], look: { sky: ['#9fd8e8', '#cfeef0', '#fff4ea'] } },
        { name: 'Steam Heights', color: '#8a86b0', from: 520, mobs: ['shade', 'lamia'], look: { sky: ['#c8c4e0', '#e4e0f0', '#fff4f0'] } },
      ],
      ledges: [
        // The bathhouse's roof walk, the aqueduct's deck, the Serpent Stone's coils (drawn with them).
        { x: 230, y: 770, w: 140, bare: true, noProps: true, noRope: true },
        { x: 900, y: 500, w: 620, bare: true, noProps: true, noRope: true },
        { x: 1880, y: 340, w: 220, bare: true, noProps: true, noRope: true }, { x: 1922, y: 260, w: 156, bare: true, noProps: true, noRope: true },
      ],
    }),
    // The hot pool beside the bathhouse, where you fish (a stone lip on its far bank the Lamias never cross).
    water: [{ x1: 450, x2: 630, y: 912, kind: 'hot' }],
    // Its monsters, placed by hand, three a spot, well away from the ways in and the fishing spot.
    spawns: [
      { mob: 'lamia', x: 300, y: 770 }, { mob: 'lamia', x: 800, y: 900 }, { mob: 'lamia', x: 1000, y: 820 }, { mob: 'lamia', x: 1150, y: 740 },
      { mob: 'shade', x: 1280, y: 660 }, { mob: 'shade', x: 1000, y: 500 }, { mob: 'lamia', x: 1240, y: 500 }, { mob: 'shade', x: 2000, y: 260 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes, steam and ways.
    nodes: [
      { ...SPOT.fiber(3), x: 170, y: 900 }, { ...SPOT.herb(3, 'steam_ginger'), x: 680, y: 900 }, { ...SPOT.wood(3), x: 870, y: 820 },
      { ...SPOT.herb(3, 'steam_ginger'), x: 1120, y: 500 }, { ...SPOT.fiber(3), x: 1460, y: 500 }, { ...SPOT.ore(3), x: 1880, y: 420 },
    ],
    // A moving part per zone: steam off the bathhouse chimney (Up to ride it onto the roof), the
    // falls, the steam rising off every pool and the aqueduct.
    updrafts: [{ x: 252, w: 56, top: 740, bottom: 900, kind: 'mist' }],
    portals: [
      { id: 'west', x: 40, y: 900, to: 'cave', toPortal: 'springs' },
      { id: 'east', x: 2160, y: 420, to: 'peak', toPortal: 'west' },
    ],
    npcs: [],
    // The landmarks: the bathhouse, the terraces, the rose arch and the falls in front of it, the
    // aqueduct over the terraces, the Serpent Stone.
    deco: [['bathhouse', 300, 0], ['terraces', 860, 0, 900], ['rosearch', 1610, 0, 580], ['waterfall', 1650, 160, 580], ['aqueduct', 1210, 0, 500], ['serpentstone', 1990, 0, 420]],
    lamps: [{ x: 300, y: 860 }, { x: 250, y: 830 }, { x: 1020, y: 530 }, { x: 1380, y: 530 }, { x: 1610, y: 540 }, { x: 1990, y: 220 }],
    spirit: { x: 1300, y: 300 },
    habitats: { lamia: { naps: true, home: { x: 800, y: 900 } }, shade: { play: true } },
  },


  // Frozen Peak (its makeover, 2026-11-20): a real mountain (render/peakart.js), zones by height.
  // You arrive on the windswept Summit by the Yuki-onna's little snow shrine; the mountain's snowy
  // mass runs down from it to a mid shelf and then the frozen lake. A rope bridge crosses from the
  // summit to the glacier lip of the Great Icefall, a giant frozen waterfall: the Icefall Crevasse
  // is its ice shelves stepping down either side of it, an ice ladder cut up its middle, a floe
  // drifting over from the mid shelf, and the howling wind beside it to ride back up. The Frozen
  // Lake at the bottom: igloos on the shore, the ice-fishing hole, a frost vent bouncing you onto
  // the first shelf, a high ledge with the homestone, and the way out to the Sky Garden.
  peak: {
    id: 'peak', name: 'Frozen Peak', theme: 'snow', town: 'grove', world: { x: 312, y: 18 }, perSpawn: 3,
    // (The mountain's mass is packed snow, not the snowfield's slabs.)
    look: { material: 'snowpeak' },
    ...lay({
      width: 1800, ground: 1120, by: 'y', quiet: [[40, 280, 200], [1760, 1120, 160], [1550, 1120, 200]],
      // The mountain: the summit, a cliff down to the mid shelf, a cliff down to the lake's shore;
      // the frozen lake lies sunk in the shore behind snowy lips.
      terrain: [[0, 280], [460, 280], [460, 700], [760, 700], [760, 1120], [1420, 1120], [1420, 1112], [1450, 1112], [1450, 1136], [1650, 1136], [1650, 1120], [1800, 1120]],
      zones: [
        { name: 'Frozen Lake', color: '#7ab8e8', mobs: ['cloudsheep', 'yukionna'] },
        { name: 'Icefall Crevasse', color: '#8f8ad0', from: 820, mobs: ['yukionna', 'cloudsheep'], look: { sky: ['#9fb8e8', '#c8d8f4', '#eef4ff'] } },
        { name: 'Summit', color: '#e8f4ff', from: 460, mobs: ['yukionna'], look: { sky: ['#6a8ad0', '#a8c4f0', '#f0f6ff'] } },
      ],
      ledges: [
        // The rope bridge from the summit to the glacier lip (drawn with the icefall).
        { x: 460, y: 300, w: 530, style: 'bridge', noProps: true, noRope: true }, { x: 990, y: 246, w: 220, bare: true, noProps: true, noRope: true },
        // The ice shelves stepping down either side of the icefall, each growing out of the ice.
        { x: 820, y: 400, w: 290, root: 'right', noRope: true }, { x: 1090, y: 520, w: 210, root: 'left', noRope: true },
        { x: 820, y: 640, w: 290, root: 'right', noRope: true }, { x: 1090, y: 760, w: 290, root: 'left', noRope: true },
        { x: 820, y: 880, w: 290, root: 'right', noRope: true }, { x: 1090, y: 1000, w: 290, root: 'left', noRope: true },
        // Two long ice ridges and a high ledge (with the homestone) jutting from the east cliff.
        { x: 1340, y: 420, w: 460, root: 'right', noRope: true }, { x: 1300, y: 640, w: 500, root: 'right', noRope: true },
        { x: 1560, y: 880, w: 240, root: 'right', noRope: true },
        // The ice floe drifting from the mid shelf over to the icefall.
        { x: 762, y: 680, w: 70, drift: { dx: 70, period: 6 } },
      ],
      ropes: [
        // Down the cliffs, beside them.
        { x: 470, top: 280, bottom: 700 }, { x: 770, top: 700, bottom: 1120 },
        // The ice ladder up the icefall's middle, a stretch between each shelf.
        ...[[1000, 1120], [880, 1000], [760, 880], [640, 760], [520, 640], [400, 520], [246, 400]].map(([top, bottom]) => ({ x: 1100, top, bottom, ladder: true })),
        // Down from the high ledge, and between the ridges and the ledge.
        { x: 1690, top: 880, bottom: 1120 }, { x: 1500, top: 420, bottom: 640 }, { x: 1640, top: 640, bottom: 880 },
      ],
    }),
    // Its monsters, placed by hand, three a spot, well away from the ways in (the arrival rule).
    spawns: [
      { mob: 'yukionna', x: 600, y: 300 }, { mob: 'yukionna', x: 840, y: 300 }, { mob: 'yukionna', x: 1160, y: 246 },
      { mob: 'yukionna', x: 940, y: 400 }, { mob: 'yukionna', x: 1240, y: 520 }, { mob: 'cloudsheep', x: 940, y: 640 },
      { mob: 'cloudsheep', x: 1260, y: 760 }, { mob: 'yukionna', x: 940, y: 880 }, { mob: 'cloudsheep', x: 1260, y: 1000 },
      { mob: 'cloudsheep', x: 600, y: 700 }, { mob: 'cloudsheep', x: 940, y: 1120 }, { mob: 'yukionna', x: 1200, y: 1120 },
      { mob: 'yukionna', x: 1440, y: 420 }, { mob: 'yukionna', x: 1680, y: 420 }, { mob: 'cloudsheep', x: 1400, y: 640 }, { mob: 'yukionna', x: 1720, y: 640 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes and ways.
    nodes: [
      { ...SPOT.ore(4), x: 160, y: 280 }, { ...SPOT.fruit(4, 'snow_peach'), x: 290, y: 280 }, { ...SPOT.ore(4, { gem: 0.3, night: true }), x: 420, y: 280 },
      { ...SPOT.ore(4), x: 1340, y: 1120 }, { ...SPOT.ore(4, { gem: 0.2 }), x: 1600, y: 880 },
    ],
    // A moving part per zone: the drifting floe, the howling wind up beside the icefall (Up to ride
    // it), and a frost vent on the shore bouncing you onto the first shelf.
    springs: [{ x: 1250, y: 1120, up: 160, kind: 'gust' }],
    updrafts: [{ x: 792, w: 44, top: 250, bottom: 1120, kind: 'gust' }],
    // The lake's ice (drawn as a frozen sheet: you stand on it and fish through a hole).
    water: [{ x1: 1450, x2: 1650, y: 1136, kind: 'ice' }],
    portals: [
      { id: 'west', x: 40, y: 280, to: 'springs', toPortal: 'east' },
      { id: 'east', x: 1760, y: 1120, to: 'sky', toPortal: 'peak' },
    ],
    npcs: [],
    // The landmarks: the snow shrine and a great pine on the summit, the icefall, a snowman on the
    // mid shelf, igloos on the shore.
    deco: [['snowshrine', 250, 0, 280], ['snowpine', 440, 0, 280], ['icefall', 1100, 0], ['snowman', 690, 0, 700], ['igloo', 1360, 0], ['igloo', 1540, 1]],
    lamps: [{ x: 362, y: 250 }, { x: 1326, y: 1100 }, { x: 1506, y: 1100 }, { x: 1100, y: 1080 }],
    spirit: { x: 1400, y: 400 },
    habitats: { yukionna: { play: true, naps: true }, cloudsheep: { naps: true, home: { x: 940, y: 1120 } } },
  },



  // Starfall Heights (its makeover, 2026-11-20): a smaller valley round its landmarks
  // (render/starfallart.js), zones side by side. The West Rim where you arrive, a crescent moon
  // hung over it on golden chains like a hammock (its cradle is the top of the heights), a long
  // star-cloud bank and the steps down past the star pool. The Fallen Star Crater: the Fallen Star
  // itself resting on the crater floor, asleep, its upper arms ledges, vines down from
  // its arms, the starlight rising behind it (Up to ride it), Selene walking its floor and a
  // star-cloud ferry gliding over it rim to rim. The East Rim: a long star-cloud bank, the steps
  // up, little stars stepping up to the floating island with the gazebo, the way to the Moon
  // Terrace and the homestone, and the way to Cloudcatch Pier at the rim's end.
  starfall: {
    id: 'starfall', name: 'Starfall Heights', theme: 'sky', music: 'starfall', town: 'grove', world: { x: 390, y: 34 }, perSpawn: 4,
    look: { sky: ['#1d1b48', '#4a3f8c', '#a68ad6'], sun: '#e6dcff', far: '#5a4f9e', mid: '#6a5fa8', midTrim: '#8a7cc8', face: 'moon', stars: true, shooting: true, rainbow: 0, light: 'starfall', material: 'starcloud', props: [], ledgeKeep: 1 },
    ...lay({
      width: 2200, ground: 1040, by: 'x',
      // The valley: the rims, a step down either side (the star pool sunk in the west one), the crater.
      terrain: [[0, 520], [440, 520], [440, 700], [530, 700], [544, 712], [636, 712], [650, 700], [720, 700], [720, 1040], [1480, 1040], [1480, 700], [1760, 700], [1760, 520], [2200, 520]],
      ropes: [
        // Down each cliff step, beside the wall.
        { x: 450, top: 520, bottom: 700 }, { x: 730, top: 700, bottom: 1040 }, { x: 1470, top: 700, bottom: 1040 }, { x: 1750, top: 520, bottom: 700 },
        // Down from the moon's cradle; vines down from the star's arms.
        { x: 230, top: 382, bottom: 520 }, { x: 900, top: 759, bottom: 1040 }, { x: 1300, top: 759, bottom: 1040 },
      ],
      quiet: [[40, 520, 200], [2160, 520, 160], [2140, 380, 140], [500, 700, 120]],
      zones: [
        { name: 'West Rim', color: '#8fa8f0', from: 0, mobs: ['windbird', 'shepherdess', 'kiterider'] },
        { name: 'Fallen Star Crater', color: '#e0b84a', from: 720, mobs: ['starspirit', 'monk', 'windbird'], look: { sky: ['#2a1e58', '#5a3f8c', '#c08ad6'] } },
        { name: 'East Rim', color: '#c8b8ff', from: 1480, mobs: ['starspirit', 'harpist', 'monk'], look: { sky: ['#141238', '#3a2f7c', '#8a7ad0'] } },
      ],
      ledges: [
        // The moon's cradle (drawn with it).
        { x: 220, y: 382, w: 120, bare: true, noProps: true, noRope: true },
        // The long star-cloud banks either side of the crater.
        { x: 446, y: 560, w: 374, noRope: true }, { x: 1380, y: 560, w: 374, noRope: true },
        // The Fallen Star's upper arms (drawn with it).
        { x: 885, y: 759, w: 153, bare: true, noProps: true, noRope: true }, { x: 1162, y: 759, w: 153, bare: true, noProps: true, noRope: true },
        // Little stars stepping up to the gazebo's island (drawn with it as an island).
        { x: 1800, y: 460, w: 80, noRope: true }, { x: 1880, y: 380, w: 320, bare: true, noProps: true, noRope: true },
        // The star-cloud ferry, gliding across the crater rim to rim.
        { x: 720, y: 700, w: 130, drift: { dx: 630, period: 16 } },
      ],
    }),
    // Its monsters, placed by hand, three a spot, well away from the ways in (the arrival rule).
    spawns: [
      { mob: 'windbird', x: 500, y: 560 }, { mob: 'kiterider', x: 740, y: 560 },
      { mob: 'shepherdess', x: 780, y: 1040 }, { mob: 'monk', x: 1000, y: 1040 }, { mob: 'starspirit', x: 1200, y: 1040 }, { mob: 'harpist', x: 1420, y: 1040 },
      { mob: 'monk', x: 958, y: 759 }, { mob: 'starspirit', x: 1242, y: 759 },
      { mob: 'harpist', x: 1440, y: 560 }, { mob: 'starspirit', x: 1700, y: 560 }, { mob: 'monk', x: 1680, y: 700 },
    ],
    // Its gathering spots, placed by hand, clear of the monsters, ropes and ways.
    nodes: [
      { ...SPOT.night(4), x: 280, y: 382 }, { ...SPOT.herb(4, 'star_anise'), x: 620, y: 560 }, { ...SPOT.ore(4), x: 690, y: 700 },
      { ...SPOT.ore(4, { gem: 0.2 }), x: 1530, y: 700 }, { ...SPOT.wood(4), x: 1570, y: 560 }, { ...SPOT.fiber(4), x: 1840, y: 460 },
    ],
    // A moving part per zone: the moon swaying on its chains, starlight rising behind the Fallen
    // Star up past its tip (Up to ride it, and catch the ferry going over), and the ferry itself.
    updrafts: [{ x: 1100, w: 56, top: 600, bottom: 1040, kind: 'wisplight' }],
    // The star pool sunk in the west step: night sky in the cloud.
    water: [{ x1: 544, x2: 636, y: 712, kind: 'star' }],
    portals: [{ id: 'west', x: 40, y: 520, to: 'sky', toPortal: 'starfall' }, { id: 'whale', x: 2160, y: 520, to: 'cloudcatch_pier', toPortal: 'west', label: 'Cloudcatch Pier' }],
    npcs: [],
    // The landmarks: the moon cradle, the Fallen Star, the gazebo's island and the gazebo.
    deco: [['mooncradle', 280, 0, 424], ['fallenstar', 1100, 0], ['skyisland', 2040, 2, 510], ['skygazebo', 2020, 0, 380]],
    lamps: [{ x: 1100, y: 840 }, { x: 2020, y: 340 }, { x: 280, y: 360 }],
    spirit: { x: 1100, y: 520 },
    habitats: { windbird: { play: true }, starspirit: { naps: true, home: { x: 1100, y: 1040 } }, shepherdess: { naps: true }, monk: { naps: true }, kiterider: { play: true } },
    // Its flyers keep over the floors they live on, not out over the open crater (world/mobs.js).
    flyersStay: true,
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

// Prismaris's dark throne (Chapter 10's trial, 2026-11-19): his throne room with every light drunk
// but the glowing alarm clock he hugs; Elder Shiratama sits by the throne with a candle
// (render/trial.js). Through its own door beside the Crystal Throne's.
MAPS.nightthrone = arena('nightthrone', 'The Dark Throne', 'cave', 'grove', { x: 366, y: 190 },
  { sky: ['#0a0820', '#1a1440', '#2f2766'], far: '#241e58', mid: '#2f2870', material: 'throne', ceiling: true, light: 'throne', islands: 'stone', skyline: 'columns', props: [] },
  [['throne', 700], ['crystalspire', 320, 1], ['crystalspire', 1080, 0]], ['cave', 'nightthrone']);
MAPS.cave.portals.push({ id: 'nightthrone', x: 560, y: 800, to: 'nightthrone', toPortal: 'west', label: 'The Dark Throne' });
// (Who waits there, for a quest's "where to go": core/quests.js mobPlaces.)
MAPS.nightthrone.trialBoss = 'nightking';

// The Palace at Dawn (Chapter 10's finale, 2026-11-19): the lawn before the Mochi palace on its hill,
// the sun coming up behind it (render/dawnpalace.js), where the Queen's alarm clock rings itself
// giant. Up the path past the palace door in Sprout Village.
MAPS.dawnpalace = arena('dawnpalace', 'The Palace at Dawn', 'meadow', 'sprout', { x: 60, y: 176 },
  { sky: ['#9a8ad8', '#ffb0c8', '#ffe0a8'], painted: 'dawnpalace', light: 'morning', edges: 'flowers', props: ['flower', 'tulip', 'flower'], clouds: false, rainbow: 0 },
  [['sakura', 220, 0], ['sakura', 1180, 1]], ['sprout', 'dawnpalace']);
MAPS.dawnpalace.trialBoss = 'alarm';
// (Always dawn there, and never rain: its own light, whatever the clock.)
MAPS.dawnpalace.ownLight = true;
MAPS.sprout.portals.push({ id: 'dawnpalace', x: 200, y: 480, to: 'dawnpalace', toPortal: 'west', label: 'Palace Lawn' });

// Lilith's grotto behind the waterfall keeps its own rose-lit dusk, day or night.
MAPS.grotto.ownLight = true;
MAPS.glade.portals.push({ id: 'bower', x: 580, y: 480, to: 'bower', toPortal: 'west', label: "Sylvana's Bower" });
// The way to the Clockwork Carnival (its rooms are with the dungeons above).
MAPS.springs.portals.push({ id: 'volcano', x: 1760, y: 420, to: 'sugar_trail', toPortal: 'west', label: 'Candy Volcano' });
MAPS.ridge.portals.push({ id: 'observatory', x: 1960, y: 640, to: 'observatory_steps', toPortal: 'west', label: 'Star Observatory' });
MAPS.shrine.portals.push({ id: 'carnival', x: 1965, y: 520, to: 'carnival_gate', toPortal: 'west', label: 'Clockwork Carnival' });
MAPS.shrine.portals.push({ id: 'sanctum', x: 1720, y: 520, to: 'sanctum', toPortal: 'west', label: "Tamamo's Sanctum", mouth: 48, labelAt: 150 });
// The Tea Terraces' fishing stone over the pond.
MAPS.tea.platforms.push({ x: 1620, y: 1000, w: 60, style: 'stone', walkOn: true });
// Serpent Springs: the grotto is through the rose arch behind the waterfall.
MAPS.springs.portals.push({ id: 'grotto', x: 1610, y: 580, to: 'grotto', toPortal: 'west', label: 'Rose Grotto', mouth: 44, labelAt: 140 });
// Cloud cotton on the high cloud by the Moon Terrace, a quiet spot above the busy east rim
// (placed by hand: the rim's own floors are full of monsters).
MAPS.starfall.portals.push({ id: 'terrace', x: 2140, y: 380, to: 'terrace', toPortal: 'west', label: 'Moon Terrace' });

// The queens roam their regions as field bosses (from the start: the story is optional), back
// every ten minutes or so after they fall.
MAPS.glade.spawns.push({ mob: 'sylvana', x: 760, y: 900, respawn: 600 });
MAPS.shrine.spawns.push({ mob: 'tamamo', x: 780, y: 960, respawn: 600 });
MAPS.springs.spawns.push({ mob: 'lilith', x: 1300, y: 500, respawn: 600 });
MAPS.starfall.spawns.push({ mob: 'selene', x: 1200, y: 1040, respawn: 600 });

// A shortcut home (the map rules): a homestone on a ledge at each big hunting map's far end, far
// from the way you came in from town. Step up to it and it carries you straight back to town (one
// way), so a long map never means a long walk back.
const HOMESTONES = {
  meadow1: [1555, 400], meadow2: [200, 700], woods: [1650, 880], ruins: [1764, 330], cave: [1660, 362],
  sky: [1920, 330], canyon: [110, 520], glade: [880, 900], shrine: [620, 480], ridge: [1800, 560],
  springs: [2080, 340], peak: [1740, 880], starfall: [1920, 380],
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
const SEA_HALL = { islands: 'gallery', material: 'marble', ceiling: 'manor', trim: '#bfeeff', ceilingTint: { band: '#2e5a86', trim: '#bfeeff', swag: '#4fb8c0', lamp: '#d8fbff' }, props: ['crystal', 'orb', 'crystal'], ledgeProp: 'crystal', edges: null, propKeep: 0.64 };
// (The manor's halls: candles, books and crystal balls, kept sparse; no empty stub pedestals.)
const MANOR_HALL_PROPS = { props: ['candle', 'books', 'orb', 'candle'], ledgeProp: 'candle', propKeep: 0.66 };
const THEATRE_HALL = { islands: 'gallery', material: 'parquet', ceiling: 'curtain', trim: '#ffd36b', props: ['column', 'lamp', 'poster', 'candle'], ledgeProp: 'candle', edges: null };
const INTERIORS = {
  // (Rootwood Hollow's rooms draw their own root ceiling as scenery, not the cave's stone one.)
  // The manor's halls: galleries on gilded chains.
  // (The gallery, ballroom and hallway's ledges are marble balconies on columns, 2026-11-18.)
  manor2: { islands: 'balcony', ...MANOR_HALL_PROPS }, manor3: { islands: 'balcony', ...MANOR_HALL_PROPS },
  manor4: { islands: 'gallery', ...MANOR_HALL_PROPS, props: ['books', 'books', 'candle'] }, manor5: { islands: 'balcony', ...MANOR_HALL_PROPS },
  // The palace's inner halls in sea-glass marble, their ledges Queen Coralie's display tanks; the
  // grotto is a cave.
  aquarium3: { ...SEA_HALL, islands: 'tank', ledgeProp: null }, aquarium6: { ...SEA_HALL, islands: 'tank', ledgeProp: null }, aquarium4: { ceiling: true, props: ['rock', 'crystal', 'rock'], ledgeProp: 'crystal' },
  // The carnival's buildings: the funhouse, the big top's ring, the toy workshop.
  // (The Funhouse's floors are crooked candy slabs on striped stilts: render/fairground.js, 2026-11-18.)
  carnival2: { islands: 'funfloor', material: 'parquet', ceiling: 'beams', trim: '#ff9ab8', ceilingTint: { band: '#a0507a', lamp: '#ffe2a0' }, props: ['poster', 'lantern'], ledgeProp: null, edges: null, propKeep: 0.66 },
  carnival4: { islands: 'catwalk', material: 'sawdust', ceiling: 'tent', metal: '#c06a8a', props: ['barrel', 'poster', 'crate', 'lantern'], ledgeProp: null, edges: null },
  carnival5: { islands: 'catwalk', material: 'parquet', ceiling: 'beams', metal: '#8a7aa8', props: ['crate', 'barrel', 'books', 'lantern'], ledgeProp: null, edges: null },
  // The observatory's halls: galleries on brass chains.
  // (Their props sparse, and no empty stub pedestals among them: 2026-11-18.)
  observatory2: { islands: 'gallery', ...GALLERY_PROPS, props: ['candle', 'orb', 'books', 'candle'], propKeep: 0.66 }, observatory3: { islands: 'gallery', ...GALLERY_PROPS, props: ['books', 'orb', 'books', 'candle'], propKeep: 0.66 },
  observatory4: { islands: 'gallery', ...GALLERY_PROPS, props: ['books', 'books', 'candle'] }, observatory5: { islands: 'gallery', ...GALLERY_PROPS, props: ['orb', 'candle'], propKeep: 0.66 },
  // The volcano's insides (remade 2026-11-19, render/sugarworks.js): the mine's licorice trestles
  // under rock, the kitchen's tables under beams, the forge's iron grates on toffee-brick piers.
  volcano2: { islands: 'licorice', ceiling: true, props: [], ledgeProp: null, edges: null },
  volcano3: { islands: 'table', material: 'parquet', ceiling: 'beams', trim: '#ff9ab8', ceilingTint: { band: '#9a6048' }, props: [], ledgeProp: null, edges: null },
  volcano4: { islands: 'forgepier', ceiling: 'beams', ceilingTint: { band: '#6a3a3a', lamp: '#ffb070' }, props: [], ledgeProp: null, edges: null },
  // The theatre: its halls under the red valance; backstage under bare beams on catwalks; the
  // acts are painted sets, so only the valance changes over them.
  // (The acts of the Queen's dream are painted sets under the valance: render/dreamsets.js.)
  theatre1: THEATRE_HALL, theatre4: { ceiling: 'curtain' }, theatre6: { ceiling: 'curtain' },
  theatre2: { ceiling: 'curtain' }, theatre3: { ceiling: 'curtain' }, theatre5: { ceiling: 'curtain' },
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

