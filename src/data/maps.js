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

import { climb, lay } from './climb.js';

export const MAPS = {
  // The archers' home town, laid out in quarters from west to east: a homey corner of two-storey
  // cottages with a terraced walk up between them (Mira welcomes you at the entrance); the shop
  // street (Pip's goods and Lulu's salon side by side); the raised plaza under the giant cherry
  // tree, with the fountain, benches and the noticeboard (a branch of the tree is a ledge, up its
  // rope); then the archers' quarter: the Archer Lodge, the watchtower (its deck a ledge) and the
  // range, out to the meadow road. Nothing you need is up a ladder.
  sprout: {
    id: 'sprout', plaza: 1290, name: 'Sprout Village', theme: 'town', isTown: true, town: 'sprout', job: 'archer', world: { x: 66, y: 182 },
    // The town stove, for cooking (data/cooking.js).
    stove: 1140,
    width: 2600, height: 520, groundY: 480,
    look: { edges: 'flowers', front: 'blossoms', islands: 'planks', propKeep: 0.8 },
    terrain: [[0, 480], [1180, 480], [1220, 456], [1700, 456], [1740, 480], [2600, 480]],
    // The cottages along the street, and the plaza's own pieces (render/townhouses.js).
    cottages: [200, 470, 660, 950, 2160, 2400],
    townPieces: [['plazatree', 1470], ['noticeboard', 1630]],
    platforms: [
      // The terraced walk between the cottages.
      { x: 500, y: 400, w: 150, posts: true }, { x: 600, y: 320, w: 120, posts: true },
      // A branch of the plaza's cherry tree (the tree's own bough: nothing drawn for it).
      { x: 1360, y: 330, w: 96, bare: true },
      // The watchtower's deck (TOWER_DECK above the ground).
      { x: 1998, y: 320, w: 84 },
    ],
    ropes: [
      { x: 1440, top: 330, bottom: 456 },
      { x: 2014, top: 320, bottom: 480, ladder: true },
    ],
    portals: [
      { id: 'start', x: 140, y: 480, hidden: true },
      // The old mine road west, closing the island's ring: it comes out in the Crystal Cave.
      { id: 'west', x: 40, y: 480, to: 'cave', toPortal: 'sprout', label: 'Crystal Cave' },
      { id: 'east', x: 2540, y: 480, to: 'meadow1', toPortal: 'west' },
    ],
    npcs: [{ id: 'mira', x: 330 }, { id: 'pip', x: 800 }, { id: 'lulu', x: 1070 }, { id: 'kestrel', x: 1880 }],
    deco: [
      ['well', 760], ['archerbanner', 1780], ['watchtower', 2040], ['archerbanner', 2110],
      // The archery range: a rack of practice bows at the shooting line, targets down the lane.
      ['bowrack', 2200], ['fence', 2250], ['archtarget', 2300, 0], ['archtarget', 2360, 1], ['archtarget', 2420, 2], ['haystack', 2470, 1],
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
    width: 2400, height: 1040, groundY: 1000,
    look: { sky: ['#ffc6dd', '#ffe3d8', '#fff6e6'], far: '#f3d3e8', mid: '#bfe8b8', midTrim: '#8fd39a', light: 'morning', edges: 'flowers', front: 'blossoms', props: ['flower', 'tulip', 'flower', 'bush', 'tulip', 'tuft'] },
    zones: [
      { name: 'Petal Fields', from: Infinity, color: '#e889b4' },
      { name: 'Beehive Banks', from: 800, color: '#e0a040', look: { sky: ['#ffd9a6', '#ffecc8', '#fff8e4'], far: '#f6dcb8', mid: '#d6e6a0', midTrim: '#b2d07e', edges: 'clover', props: ['tulip', 'flower', 'tuft', 'bush'] } },
      { name: 'Blossom Boughs', from: 560, color: '#e06fa6', look: { sky: ['#ffb0d0', '#ffd2e6', '#fff0f6'], far: '#f6c2da', mid: '#f0b6d2', midTrim: '#e08cba', islands: 'planks', props: ['flower', 'tuft'] } },
      { name: 'Petal Clouds', from: 320, color: '#8fa8f0', look: { sky: ['#b8dcff', '#e0f0ff', '#fff6fc'], far: '#e8e6ff', mid: '#f4eaff', midTrim: '#d8ccf6', material: 'sky', edges: null, props: ['flower'] } },
    ],
    terrain: [[0, 1000], [560, 1000], [640, 976], [1180, 976], [1260, 1000], [2400, 1000]],
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
      // The fishing dock over the pond in the quiet east corner, a hop up from the ground: no
      // monster lives on it, so you can fish in peace.
      { x: 2195, y: 952, w: 95, posts: true },
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
      { x: 200, top: 920, bottom: 1000, ladder: true }, { x: 2160, top: 920, bottom: 1000, ladder: true },
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
      ['flowerarch', 260], ['giantflower', 900, 0], ['pond', 2235], ['picnic', 1650], ['signpost', 2060],
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


  // Clover Hills climbs a farm hillside in three zones (the tall-map rules, a light rework): the
  // Mandrake Rows at the bottom, crop fields where Mandrakes grow and Scarecrow Imps stand; the
  // Goblin Barnyard round the big barn, the Toadstool Goblins' den, swept by Kitchen Brownies; and
  // the breezy Jackalope Ridge, where Wind Ferrets dart, with a lookout on top.
  // Each zone hunts in a loop (ropes at both ends) and has a moving part: a hay-bale bounce, the
  // hayloft's chaff updraft, and a ledge drifting across the ridge. The fishing pond is in the quiet
  // west corner with a dock of its own; no monsters near the portals.
  meadow2: {
    id: 'meadow2', name: 'Clover Hills', theme: 'meadow', town: 'harbor', world: { x: 162, y: 196 },
    width: 2400, height: 1000, groundY: 960,
    look: { sky: ['#5ec8ff', '#aee8ff', '#e8fff2'], far: '#9fdf9f', mid: '#6fcf7a', midTrim: '#4fae5f', rainbow: 0, material: 'farm', edges: 'clover', light: 'noon', drift: null, props: ['tuft', 'bush', 'rock', 'tuft', 'flower'] },
    zones: [
      { name: 'Mandrake Rows', from: Infinity, color: '#5fae5f' },
      { name: 'Goblin Barnyard', from: 760, color: '#d0704a', look: { sky: ['#7fc8ff', '#c8e8ff', '#fff0d8'], far: '#b8dc9a', mid: '#8fcf7a', midTrim: '#6fae5f', props: ['tuft', 'rock', 'bush'] } },
      { name: 'Jackalope Ridge', from: 600, color: '#4f95e0', look: { sky: ['#4fb0ff', '#9fdcff', '#e8f8ff'], far: '#c8ecd0', mid: '#a8e0b0', midTrim: '#7fc88f', material: 'meadow', edges: 'flowers', props: ['flower', 'tuft', 'tulip'] } },
    ],
    terrain: [[0, 960], [950, 960], [1030, 930], [1470, 930], [1550, 960], [2400, 960]],
    platforms: [
      // Mandrake Rows (and the fishing dock over the pond by the west exit).
      { x: 300, y: 880, w: 550 }, { x: 1550, y: 880, w: 700 },
      { x: 500, y: 800, w: 1400 },
      { x: 150, y: 912, w: 95, posts: true },
      // Goblin Barnyard.
      { x: 100, y: 720, w: 900 }, { x: 1400, y: 720, w: 900 },
      { x: 450, y: 640, w: 1500 },
      // Jackalope Ridge, a ledge drifting across its gap, and the lookout.
      { x: 250, y: 560, w: 600 }, { x: 1550, y: 560, w: 600 },
      { x: 700, y: 480, w: 1000 },
      { x: 300, y: 400, w: 500 }, { x: 1600, y: 400, w: 500 },
      { x: 820, y: 400, w: 140, drift: { dx: 600, period: 12 } },
      { x: 1000, y: 320, w: 400, thick: 44 },
    ],
    ropes: [
      { x: 820, top: 880, bottom: 960, ladder: true }, { x: 2230, top: 880, bottom: 960, ladder: true },
      { x: 540, top: 800, bottom: 880 }, { x: 1860, top: 800, bottom: 880 },
      { x: 960, top: 720, bottom: 800 }, { x: 1440, top: 720, bottom: 800 },
      { x: 480, top: 640, bottom: 720 }, { x: 1920, top: 640, bottom: 720 },
      { x: 820, top: 560, bottom: 640 }, { x: 1580, top: 560, bottom: 640 },
      { x: 720, top: 480, bottom: 560 }, { x: 1640, top: 480, bottom: 560 },
      { x: 760, top: 400, bottom: 480 }, { x: 1650, top: 400, bottom: 480 },
      { x: 1050, top: 320, bottom: 480, ladder: true },
    ],
    // A hay bale on the hill bounces you up to the top row; the hayloft breathes a warm updraft of
    // chaff up past the ridge (Up to ride it).
    springs: [{ x: 1250, y: 930, up: 170, kind: 'hay' }],
    updrafts: [{ x: 1200, w: 50, top: 450, bottom: 640, kind: 'chaff' }],
    portals: [
      { id: 'west', x: 40, y: 960, to: 'meadow1', toPortal: 'east' },
      { id: 'east', x: 2340, y: 960, to: 'harbor', toPortal: 'west' },
    ],
    npcs: [],
    // A landmark per zone: the scarecrow in the rows, the barn in the barnyard, the old tree on
    // the ridge.
    deco: [['fence', 330], ['scarecrow', 600], ['cart', 1750], ['pond', 235], ['haystack', 2050, 2], ['signpost', 2180],
      ['barn', 1200, 0, 640], ['haystack', 860, 0, 640], ['fence', 1600, 1, 640], ['beehive', 250, 0, 720],
      ['bigtree', 1480, 1, 480]],
    lamps: [{ x: 200, y: 890 }, { x: 1200, y: 590 }, { x: 1200, y: 290 }, { x: 600, y: 930 }],
    spirit: { x: 1480, y: 360 },
    // The area boss (world/nest.js): after enough hunting, Old MacGoblin storms out of the barn.
    nest: { mob: 'macgoblin', x: 1200, y: 640, kills: 150, name: 'The big barn', wake: 'GET OFF MY LAND! Everyone to the Goblin Barnyard!', stirs: ['Something is stomping around in the big barn...', 'The barn doors rattle! Someone is VERY grumpy.'] },
    habitats: { sproutling: { naps: true, home: { x: 600, y: 960 } }, strawimp: { naps: true }, mushkin: { naps: true, home: { x: 1200, y: 640 } }, brownie: { home: { x: 1200, y: 640 } }, piglet: { play: true, naps: true }, kamaitachi: { play: true } },
    spawns: [
      // Mandrake Rows: Mandrakes, and Scarecrow Imps standing among them.
      ...[420, 1700].map((x) => ({ mob: 'sproutling', x, y: 960 })),
      ...[720, 1950].map((x) => ({ mob: 'strawimp', x, y: 960 })),
      ...[1100, 1400].map((x) => ({ mob: 'sproutling', x, y: 930 })),
      ...[400, 1750].map((x) => ({ mob: 'sproutling', x, y: 880 })),
      ...[700, 2050].map((x) => ({ mob: 'strawimp', x, y: 880 })),
      ...[800, 1200, 1600].map((x) => ({ mob: 'sproutling', x, y: 800 })),
      // Goblin Barnyard: Toadstool Goblins, and Kitchen Brownies sweeping round the barn.
      ...[350, 1650].map((x) => ({ mob: 'mushkin', x, y: 720 })),
      ...[750, 2000].map((x) => ({ mob: 'brownie', x, y: 720 })),
      ...[700, 1500].map((x) => ({ mob: 'mushkin', x, y: 640 })),
      ...[1000, 1800].map((x) => ({ mob: 'brownie', x, y: 640 })),
      // Jackalope Ridge: Jackalopes, and Wind Ferrets darting on the breeze.
      ...[450, 1750].map((x) => ({ mob: 'piglet', x, y: 560 })),
      ...[700, 2000].map((x) => ({ mob: 'kamaitachi', x, y: 560 })),
      ...[900].map((x) => ({ mob: 'piglet', x, y: 480 })),
      ...[1450].map((x) => ({ mob: 'kamaitachi', x, y: 480 })),
      ...[500, 1850].map((x) => ({ mob: 'piglet', x, y: 400 })),
    ],
  },


  // The thieves' home port at dusk, in quarters: the market (Marlo's cart among tall pastel canal
  // houses); the raised harbor plaza with the fountain and the Harbor Office; the back alley under
  // washing lines (Vex's Den, a rooftop hideout up on stilts behind it); then the pier, a walkable
  // boardwalk over the water with rowboats tied up, the moored ship, and the lighthouse.
  harbor: {
    id: 'harbor', plaza: 900, name: 'Pastel Harbor', theme: 'harbor', isTown: true, town: 'harbor', job: 'thief', world: { x: 222, y: 206 },
    // The town stove, for cooking (data/cooking.js).
    stove: 700,
    width: 2600, height: 520, groundY: 480,
    look: { islands: 'planks', propKeep: 0.8 },
    terrain: [[0, 480], [760, 480], [800, 460], [1240, 460], [1280, 480], [2600, 480]],
    homeStyle: 'canal',
    cottages: [180, 470, 600, 1190, 1420, 1720],
    townPieces: [['pier', 2120]],
    platforms: [
      // The rooftop hideout behind the Den, on stilts.
      { x: 1660, y: 400, w: 150, posts: true }, { x: 1740, y: 320, w: 150, posts: true },
      // The pier's deck.
      { x: 1972, y: 426, w: 296, bare: true },
    ],
    ropes: [],
    portals: [
      { id: 'start', x: 900, y: 460, hidden: true },
      { id: 'west', x: 40, y: 480, to: 'meadow2', toPortal: 'east' },
      { id: 'east', x: 2540, y: 480, to: 'woods', toPortal: 'west' },
    ],
    npcs: [{ id: 'marlo', x: 330 }, { id: 'rook', x: 1060 }, { id: 'vex', x: 1560 }],
    deco: [['crates', 120], ['barrels', 720], ['alleylamp', 1320], ['laundryline', 1470], ['alleylamp', 1880], ['crates', 1800, 0, 320], ['lighthouse', 2440]],
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
    look: { sky: ['#8fd6a8', '#c6ecc9', '#f2f8d6'], far: '#7fc79a', mid: '#5aa878', islands: 'planks', edges: 'glowcaps' },
    ...lay({
      width: 2200, ground: 1000, by: 'y', quiet: [[40, 680, 160], [2140, 680, 160], [1250, 440, 220]],
      zones: [
        { name: 'Root Tunnels', color: '#8a6656', mobs: ['boarlet', 'leafling'], nodes: [{ kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.1] }],
          look: { sky: ['#4a6a52', '#6a8a6a', '#a8c09a'], far: '#4f7a5a', mid: '#3f6a4a' } },
        { name: 'Forest Floor', color: '#4f9e55', from: 760, mobs: ['leafling', 'boarlet'], nodes: [{ kind: 'herb', pool: { clover: 1 } }] },
        { name: 'Treetops', color: '#3f9a7a', from: 640, mobs: ['mossgolem', 'leafling'], nodes: [{ kind: 'honey', pool: { honeycomb: 1 } }],
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
        { name: 'Sunken Crypt', color: '#5d5285', mobs: ['boneknight', 'wisp'], nodes: [{ kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.15] }],
          look: { sky: ['#2a2250', '#4a3a7a', '#8a7ab0'] } },
        { name: 'Collapsed Halls', color: '#4f95e0', from: 800, mobs: ['wisp', 'gloombat'], nodes: [{ kind: 'herb', pool: { clover: 1 } }],
          look: { sky: ['#5a4a98', '#8a76c0', '#c8b8e8'] } },
        { name: 'Temple Roof', color: '#c84f8a', from: 440, mobs: ['gloombat'], nodes: [{ kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' }] },
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
      terrain: [[0, 600], [400, 600], [400, 720], [800, 720], [800, 880], [1100, 880], [1100, 1000], [1500, 1000], [1500, 880], [1800, 880], [1800, 720], [2200, 720], [2200, 600], [2600, 600]],
      // Ropes down each crystal step, hanging beside it from the top.
      ropes: [{ x: 410, top: 600, bottom: 720 }, { x: 810, top: 720, bottom: 880 }, { x: 1110, top: 880, bottom: 1000 }, { x: 1490, top: 880, bottom: 1000 }, { x: 1790, top: 720, bottom: 880 }, { x: 2190, top: 600, bottom: 720 }],
      quiet: [[40, 600, 160], [500, 720, 160], [1300, 1000, 200], [2100, 480, 160], [2540, 600, 160]],
      zones: [
        { name: 'Glowcap Terraces', color: '#4fb0d8', from: 0, mobs: ['crystalslime', 'rockgolem'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.15] }] },
        { name: 'Underground Lake', color: '#8a7ab0', from: 800, mobs: ['rockgolem', 'crystalslime', 'shade'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.2] }] },
        { name: 'Shade Spires', color: '#5d5285', from: 1800, mobs: ['shade', 'rockgolem'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.25] }] },
      ],
      ledges: [
        // Glowcap Terraces: crystal shelves over the steps, and a high ledge.
        { x: 120, y: 520, w: 240 }, { x: 500, y: 560, w: 220 }, { x: 560, y: 640, w: 220 },
        // The lake: crystal outcrops over the shore.
        { x: 850, y: 800, w: 200 }, { x: 1550, y: 800, w: 200 }, { x: 1180, y: 900, w: 240 }, { x: 1150, y: 760, w: 300 },
        // Shade Spires: spires climbing out, and the ledge with the way to the sky.
        { x: 1850, y: 640, w: 220 }, { x: 2250, y: 520, w: 260 },
        { x: 1900, y: 480, w: 280, thick: 44 },
        // The crystal raft ferrying across the lake.
        { x: 1100, y: 880, w: 130, style: 'stone', drift: { dx: 270, period: 10 } },
      ],
    }),
    // A moving part per zone: a vent on the terraces, the raft across the lake, and crystal dust
    // rising in the spires (Up to ride it).
    springs: [{ x: 620, y: 720, up: 170, kind: 'gust' }],
    updrafts: [{ x: 2100, w: 50, top: 450, bottom: 720, kind: 'wisplight' }],
    portals: [
      { id: 'west', x: 40, y: 600, to: 'ruins', toPortal: 'east' },
      { id: 'east', x: 2100, y: 480, to: 'sky', toPortal: 'west' },
      { id: 'boss', x: 1300, y: 1000, to: 'bossroom', toPortal: 'west', label: 'Throne' },
      // The mine road back down to Sprout Village (the ring round the island).
      { id: 'sprout', x: 500, y: 720, to: 'sprout', toPortal: 'west', label: 'Sprout Village' },
    ],
    npcs: [],
    // A landmark per zone: glowing pools on the terraces, a great crystal by the throne's gate at
    // the lake, a crystal spire in the east.
    deco: [['glowpool', 240, 0, 600], ['glowpool', 1200, 0, 1000], ['crystalspire', 1400, 1, 1000], ['stalagmite', 950, 0, 880], ['crystalspire', 2000, 0, 720], ['stalagmite', 2400, 0, 600]],
    lamps: [{ x: 240, y: 580 }, { x: 1300, y: 960 }, { x: 2100, y: 440 }],
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
      width: 3000, ground: 1040, by: 'x', quiet: [[40, 1040, 160], [2940, 1040, 160], [2880, 320, 200]],
      zones: [
        { name: 'Cloud Meadows', color: '#ff9ec7', from: 0, mobs: ['cloudsheep'], nodes: [{ kind: 'herb', pool: { clover: 1 } }] },
        { name: 'Harpy Roost', color: '#4f95e0', from: 1000, mobs: ['windbird'], nodes: [{ kind: 'honey', pool: { honeycomb: 1 } }],
          look: { sky: ['#8fc8ff', '#c8e4ff', '#fff6ee'] } },
        { name: 'Starlit Terrace', color: '#e0b84a', from: 2050, mobs: ['starspirit'], nodes: [{ kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' }],
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
      ],
    }),
    // A moving part per zone: a blossom on the cloud sea bouncing you up into the meadows, a
    // skyward wind through the roost (Up to ride it), and the drifting cloud to the terrace.
    springs: [{ x: 470, y: 1040, up: 170, kind: 'blossom' }],
    updrafts: [{ x: 1450, w: 56, top: 450, bottom: 1040, kind: 'gust' }],
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
  // Windy Canyon climbs a canyon wall in three zones (the tall-map rules, a light rework): the
  // Canyon Floor, a dry riverbed where the Basilisk Hatchlings bask; the Basilisk Ledges, layered
  // shelves of rock with a rope bridge drifting on the wind across the gap; and the Manticore Mesa
  // on top, the Manticore Cubs' windy home, with the windmill lookout and the road on to Ember Crag
  // as the reward for the climb. Each zone hunts in a loop and has a moving part: a canyon gust up
  // from the floor, the drifting bridge, and air vents on the mesa.
  canyon: {
    id: 'canyon', name: 'Windy Canyon', theme: 'crag', town: 'crag', world: { x: 138, y: 104 },
    width: 2400, height: 1100, groundY: 1060,
    zones: [
      { name: 'Canyon Floor', from: Infinity, color: '#c97a3a' },
      { name: 'Basilisk Ledges', from: 860, color: '#b05a4a', look: { sky: ['#ffcf9e', '#ffe4c4', '#fff4e4'] } },
      { name: 'Manticore Mesa', from: 620, color: '#6a7ad0', look: { sky: ['#9fc8ff', '#cfe4ff', '#fff0e0'] } },
    ],
    terrain: [[0, 1060], [2400, 1060]],
    platforms: [
      // Canyon Floor.
      { x: 150, y: 980, w: 650 }, { x: 1500, y: 980, w: 700 },
      { x: 500, y: 900, w: 1300 },
      // Basilisk Ledges, and the rope bridge drifting across their gap.
      { x: 100, y: 820, w: 800 }, { x: 1350, y: 820, w: 900 },
      { x: 400, y: 740, w: 1500 },
      { x: 150, y: 660, w: 600 }, { x: 1500, y: 660, w: 650 },
      { x: 780, y: 660, w: 160, style: 'bridge', drift: { dx: 520, period: 11 } },
      // Manticore Mesa, and the lookout.
      { x: 300, y: 580, w: 900 },
      { x: 1000, y: 500, w: 1100 },
      { x: 200, y: 420, w: 700 },
      { x: 1300, y: 340, w: 800 },
      { x: 850, y: 260, w: 470, thick: 44 },
    ],
    ropes: [
      { x: 170, top: 980, bottom: 1060, ladder: true }, { x: 2180, top: 980, bottom: 1060, ladder: true },
      { x: 520, top: 900, bottom: 980 }, { x: 1780, top: 900, bottom: 980 },
      { x: 870, top: 820, bottom: 900 }, { x: 1380, top: 820, bottom: 900 },
      { x: 450, top: 740, bottom: 820 }, { x: 1880, top: 740, bottom: 820 },
      { x: 700, top: 660, bottom: 740 }, { x: 1520, top: 660, bottom: 740 },
      { x: 320, top: 580, bottom: 660 }, { x: 1100, top: 500, bottom: 580 }, { x: 1900, top: 500, bottom: 660 },
      { x: 350, top: 420, bottom: 580 }, { x: 1350, top: 340, bottom: 500 }, { x: 2050, top: 340, bottom: 500 },
      { x: 880, top: 260, bottom: 420, ladder: true }, { x: 1310, top: 260, bottom: 340, ladder: true },
    ],
    // A canyon gust lifts you from the floor (Up to ride it); air vents on the mesa bounce you up.
    updrafts: [{ x: 1150, w: 54, top: 800, bottom: 1060, kind: 'gust' }],
    springs: [{ x: 1500, y: 500, up: 175, kind: 'gust' }, { x: 600, y: 580, up: 175, kind: 'gust' }],
    portals: [
      { id: 'south', x: 40, y: 1060, to: 'meadow1', toPortal: 'north' },
      { id: 'north', x: 1250, y: 260, to: 'crag', toPortal: 'south' },
    ],
    npcs: [],
    // A landmark per zone: the mesa rock and the old bones on the floor, the camp tent on the
    // ledges, the windmill on the lookout.
    deco: [['mesa', 300], ['bones', 860], ['totem', 1600], ['signpost', 2100], ['tent', 1100, 0, 740], ['windmillcrag', 1050, 0, 260]],
    lamps: [{ x: 1100, y: 710 }, { x: 1050, y: 220 }, { x: 860, y: 1030 }],
    spirit: { x: 1450, y: 200 },
    habitats: { pebblet: { naps: true, home: { x: 860, y: 1060 } }, scorpip: { play: true, naps: true } },
    spawns: [
      // Canyon Floor: Basilisk Hatchlings basking.
      ...[400, 700, 1300, 1700, 2000].map((x) => ({ mob: 'pebblet', x, y: 1060 })),
      ...[400, 1650, 1950].map((x) => ({ mob: 'pebblet', x, y: 980 })),
      ...[800, 1200, 1600].map((x) => ({ mob: 'pebblet', x, y: 900 })),
      // Basilisk Ledges: both.
      { mob: 'pebblet', x: 400, y: 820 }, { mob: 'scorpip', x: 700, y: 820 }, { mob: 'pebblet', x: 1600, y: 820 }, { mob: 'scorpip', x: 2000, y: 820 },
      { mob: 'scorpip', x: 800, y: 740 }, { mob: 'pebblet', x: 1200, y: 740 }, { mob: 'scorpip', x: 1650, y: 740 },
      { mob: 'pebblet', x: 400, y: 660 }, { mob: 'scorpip', x: 1800, y: 660 },
      // Manticore Mesa: Manticore Cubs; the lookout left quiet.
      ...[700, 1000].map((x) => ({ mob: 'scorpip', x, y: 580 })),
      ...[1300, 1800].map((x) => ({ mob: 'scorpip', x, y: 500 })),
      ...[450, 750].map((x) => ({ mob: 'scorpip', x, y: 420 })),
      ...[1600, 1950].map((x) => ({ mob: 'scorpip', x, y: 340 })),
    ],
  },


  // The warriors' home under the mesas, in quarters: the training yard (dummies and a totem) by the
  // canyon road; the Warrior Hall; the raised plaza around the sparring arena; then the forge
  // street with Tora's Forge, out to the Moonlit Ridge road. The sandstone houses have flat roofs
  // you can climb onto by the ladders on their sides.
  crag: {
    id: 'crag', plaza: 1300, name: 'Ember Crag', theme: 'crag', isTown: true, town: 'crag', job: 'warrior', world: { x: 196, y: 50 },
    // The town stove, for cooking (data/cooking.js).
    stove: 1600,
    width: 2200, height: 520, groundY: 480,
    look: { propKeep: 0.8 },
    terrain: [[0, 480], [620, 480], [660, 456], [1500, 456], [1540, 480], [2200, 480]],
    homeStyle: 'adobe',
    cottages: [530, 1400, 1950],
    townPieces: [['arena', 1080]],
    platforms: [
      // The houses' flat roofs (their own art: nothing drawn for them), up the ladders.
      { x: 482, y: 360, w: 96, bare: true }, { x: 1352, y: 336, w: 96, bare: true }, { x: 1902, y: 360, w: 96, bare: true },
    ],
    ropes: [{ x: 490, top: 360, bottom: 480, ladder: true }, { x: 1360, top: 336, bottom: 456, ladder: true }, { x: 1910, top: 360, bottom: 480, ladder: true }],
    portals: [
      { id: 'start', x: 960, y: 456, hidden: true },
      { id: 'south', x: 60, y: 480, to: 'canyon', toPortal: 'north' },
      { id: 'ridge', x: 2130, y: 480, to: 'ridge', toPortal: 'west', label: 'Moonlit Ridge' },
    ],
    npcs: [{ id: 'brann', x: 780 }, { id: 'tora', x: 1720 }],
    deco: [['totem', 160], ['dummy', 300], ['dummy', 380], ['weaponrack', 450], ['brazier', 900], ['brazier', 1260]],
    spawns: [],
  },


  // The mages' home in a starry night wood, in quarters: tree homes and Nim's spell shop by the
  // woods road; the raised plaza under the great moon-lantern tree (its bough a ledge, up its
  // rope); the Mage Tower; then the study circle (the rune circle and its moonstones) by the root
  // gate to the ruins.
  grove: {
    id: 'grove', plaza: 1240, name: 'Moonleaf Grove', theme: 'grove', isTown: true, town: 'grove', job: 'mage', world: { x: 290, y: 122 },
    // The town stove, for cooking (data/cooking.js).
    stove: 820,
    width: 2400, height: 520, groundY: 480,
    look: { islands: 'planks', edges: 'glowcaps', propKeep: 0.8 },
    terrain: [[0, 480], [860, 480], [900, 456], [1340, 456], [1380, 480], [2400, 480]],
    homeStyle: 'treehome',
    cottages: [180, 640, 1980, 2180],
    townPieces: [['moontree', 1110]],
    platforms: [
      // A bough of the moon tree.
      { x: 1006, y: 324, w: 92, bare: true },
    ],
    ropes: [{ x: 1086, top: 324, bottom: 456 }],
    portals: [
      { id: 'start', x: 1240, y: 456, hidden: true },
      { id: 'west', x: 40, y: 480, to: 'woods', toPortal: 'east' },
      { id: 'east', x: 2340, y: 480, to: 'ruins', toPortal: 'west' },
    ],
    npcs: [{ id: 'nim', x: 420 }, { id: 'elowen', x: 1500 }],
    deco: [['moonstone', 1660], ['runecircle', 1800], ['moonstone', 1940], ['rootgate', 2280]],
    spawns: [],
  },

});

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
    look: { sky: ['#ffc9a8', '#ffe6cc', '#fff6e6'], far: '#ffd9c2', mid: '#ffe8c4', midTrim: '#f2cfa0', light: 'morning', islands: 'planks', material: 'beach' },
    terrain: [[0, 480], [1500, 480]],
    platforms: [{ x: 520, y: 432, w: 140 }, { x: 760, y: 360, w: 220 }],
    ropes: [{ x: 800, top: 360, bottom: 480 }],
    portals: [
      { id: 'start', x: 140, y: 480, hidden: true },
      { id: 'east', x: 1440, y: 480, to: 'trainfield', toPortal: 'west', label: 'Practice Field' },
    ],
    npcs: [{ id: 'kuro', x: 1120 }],
    deco: [['pond', 300], ['crates', 200], ['barrels', 440], ['signpost', 1360]],
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
    deco: [['scarecrow', 520], ['fence', 1100], ['signpost', 1460]],
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
    deco: [['crates', 220], ['barrels', 420], ['ship', 1000], ['lighthouse', 1240]],
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
// glowcaps to light, cages to open, and the chest at the end.
//
// Each room has an idea of its own (world/dungeon.js runs them):
//   dark       the room is pitch black but for the group and the glowcaps they light
//   bouncers   giant bounce mushrooms that launch whoever steps on them up to the high ledges
//   rootfall   roots drop from the low ceiling during fights (step out of their shadows)
//   pillars    stone pillars a charging boss smashes into (and is dazed by)
//   flood      sap surges over the floor now and then: get up on a ledge

const G = 380; // every room's floor
const pack = (id, x, ...mobs) => mobs.map((mob, i) => ({ mob, x: x + (i - (mobs.length - 1) / 2) * 34, y: G, pack: id }));

MAPS.canyon.portals.push({ id: 'hollow', x: 2260, y: 1060, to: 'hollow_gate', toPortal: 'south', label: 'Rootwood Hollow' });

Object.assign(MAPS, {
  hollow_gate: {
    id: 'hollow_gate', name: 'Hollow Gate', theme: 'forest', town: 'crag', world: { x: 168, y: 132 },
    width: 1200, height: 420, groundY: G,
    look: { sky: ['#ff9f7a', '#d48ab8', '#6a4f9a'], far: '#9a6a9a', mid: '#7a5a8a', midTrim: '#9a7aa8', skyline: 'roots', shrooms: ['#7fe6d6', '#ffb0d0', '#ffd68a'], material: 'hollow', light: 'dusk', drift: 'spore', front: 'roots', critters: ['firefly'], face: null, edges: 'glowcaps' },
    terrain: [[0, G], [300, G], [380, G - 40], [560, G - 40], [640, G], [1200, G]],
    platforms: [{ x: 400, y: G - 120, w: 160 }],
    ropes: [],
    deco: [['bigtree', 262, 0], ['mushring', 520], ['giantshroom', 700, 2], ['signpost', 168], ['rootgate', 1080]],
    portals: [
      { id: 'start', x: 760, y: G, hidden: true },
      { id: 'south', x: 60, y: G, to: 'canyon', toPortal: 'hollow' },
      { id: 'door', x: 1080, y: G, to: 'hollow1', toPortal: 'start', label: 'Rootwood Hollow', dungeon: 'hollow' },
    ],
    npcs: [{ id: 'bramble', x: 900 }],
    spawns: [],
  },

  hollow1: {
    id: 'hollow1', name: 'Hollow Entrance', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 2000, height: 420, groundY: G,
    task: { kind: 'light', label: 'Light the glowcaps' },
    dark: true,
    platforms: [{ x: 640, y: 300, w: 180 }, { x: 1360, y: 300, w: 200 }, { x: 820, y: 230, w: 160 }, { x: 1560, y: 230, w: 140 }],
    ropes: [],
    deco: [['giantshroom', 860, 0], ['hollowlog', 1400], ['mushring', 230]],
    portals: [
      { id: 'out', x: 40, y: G, to: 'hollow_gate', toPortal: 'door', label: 'Leave' },
      { id: 'start', x: 140, y: G, hidden: true },
      { id: 'east', x: 1950, y: G, to: 'hollow2', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'glowcap', x: 330 }, { kind: 'glowcap', x: 1180 }, { kind: 'glowcap', x: 1840 }],
    npcs: [],
    spawns: [...pack('a', 560, 'rootling', 'sporecap'), ...pack('b', 1000, 'rootling', 'rootling', 'rootling'), ...pack('c', 1560, 'rootling', 'sporecap', 'rootling', 'sporecap')],
  },

  hollow2: {
    id: 'hollow2', name: "Capper's Garden", theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 1300, height: 420, groundY: G,
    platforms: [{ x: 120, y: 300, w: 180 }, { x: 1000, y: 300, w: 180 }, { x: 180, y: 220, w: 160 }, { x: 960, y: 220, w: 160 }],
    bouncers: [{ x: 360 }, { x: 900 }],
    ropes: [],
    deco: [['mushring', 560], ['giantshroom', 1220, 2]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow1', toPortal: 'east' },
      { id: 'east', x: 1260, y: G, to: 'hollow3', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'mothercapper', x: 820, y: G }],
  },

  hollow3: {
    id: 'hollow3', name: 'Bramble Tunnels', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 2200, height: 420, groundY: G,
    task: { kind: 'free', label: 'Free the trapped Sprouts' },
    rootfall: true,
    platforms: [{ x: 500, y: 300, w: 200 }, { x: 1180, y: 300, w: 220 }, { x: 1800, y: 300, w: 180 }],
    ropes: [],
    deco: [['hollowlog', 700], ['giantshroom', 1140, 1], ['stumphouse', 1720]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow2', toPortal: 'east' },
      { id: 'east', x: 2150, y: G, to: 'hollow4', toPortal: 'west', sealed: true },
    ],
    objects: [{ kind: 'cage', x: 420 }, { kind: 'cage', x: 980 }, { kind: 'cage', x: 1480 }, { kind: 'cage', x: 2040 }],
    npcs: [],
    spawns: [...pack('a', 700, 'rootling', 'thornback', 'rootling'), ...pack('b', 1260, 'sporecap', 'rootling', 'sporecap'), ...pack('c', 1800, 'thornback', 'sporecap', 'rootling')],
  },

  hollow4: {
    id: 'hollow4', name: 'Boar Den', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 1400, height: 420, groundY: G,
    platforms: [{ x: 160, y: 300, w: 160 }, { x: 620, y: 300, w: 160 }, { x: 1080, y: 300, w: 160 }],
    pillars: [{ x: 420 }, { x: 1250 }],
    ropes: [],
    deco: [['bones', 300], ['hollowlog', 560], ['bones', 1180, 1]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow3', toPortal: 'east' },
      { id: 'east', x: 1360, y: G, to: 'hollow5', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [{ mob: 'tuskar', x: 900, y: G }],
  },

  hollow5: {
    id: 'hollow5', name: 'The Root Gate', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 2000, height: 420, groundY: G,
    task: { kind: 'keys', label: 'Find the Root Keys', count: 3 },
    flood: { every: 24, warn: 3, last: 7, damage: 40 },
    platforms: [
      { x: 160, y: 300, w: 200 }, { x: 420, y: 300, w: 200 }, { x: 760, y: 300, w: 220 }, { x: 1100, y: 300, w: 200 }, { x: 1440, y: 300, w: 220 }, { x: 1720, y: 300, w: 160 },
      { x: 560, y: 220, w: 160 }, { x: 1240, y: 220, w: 160 },
    ],
    ropes: [],
    deco: [['giantshroom', 760, 2], ['mushring', 1360], ['rootgate', 1900]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow4', toPortal: 'east' },
      { id: 'east', x: 1950, y: G, to: 'hollow6', toPortal: 'west', sealed: true },
    ],
    objects: [],
    npcs: [],
    spawns: [
      ...pack('a', 520, 'rootling', 'thornback', 'sporecap'), ...pack('b', 1040, 'sporecap', 'thornback', 'rootling', 'rootling'),
      ...pack('c', 1580, 'rootling', 'sporecap', 'thornback', 'sporecap'),
    ].map((s) => (s.mob === 'thornback' ? { ...s, key: true } : s)),
  },

  hollow6: {
    id: 'hollow6', name: 'Heart of the Hollow', theme: 'hollow', town: 'crag', dungeon: 'hollow',
    width: 1500, height: 420, groundY: G,
    // Gnarlroot's heart opens above him in his last phase: strike it from the high ledges.
    platforms: [{ x: 140, y: 300, w: 170 }, { x: 560, y: 300, w: 150 }, { x: 900, y: 300, w: 150 }, { x: 1220, y: 300, w: 170 }, { x: 640, y: 220, w: 120 }, { x: 860, y: 220, w: 120 }],
    ropes: [],
    deco: [['glowpool', 380], ['giantshroom', 1160, 1]],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow5', toPortal: 'east' },
      { id: 'out', x: 1450, y: G, to: 'hollow_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [{ kind: 'chest', x: 1330, after: 'clear' }],
    npcs: [],
    spawns: [{ mob: 'gnarlroot', x: 860, y: G }],
  },
});

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
  // the west, low and rolling among giant flowers, where blossoms bounce you up and Sylvana roams;
  // the Waterfall Pool in the middle, where the falls pour down a cliff into a pool (the fishing
  // dock sits at its quiet edge) and the mist floats you up the cliff; and the Sylph Grove on the
  // high plateau to the east, treetop ledges with a leaf drifting between them, and Sylvana's Bower
  // at the far end of the glade.
  glade: {
    id: 'glade', name: 'Whispering Glade', theme: 'forest', town: 'harbor', world: { x: 278, y: 160 },
    look: { sky: ['#8fe0d0', '#d2f4e2', '#fffbe0'], far: '#8fd6b4', mid: '#6cc498', midTrim: '#4fae7f', light: 'morning', edges: 'flowers', props: ['flower', 'chime', 'tuft', 'bush', 'tulip', 'flower'], drift: 'leaf', rainbow: 0.3 },
    ...lay({
      width: 2400, ground: 880, by: 'x',
      terrain: [[0, 880], [1000, 880], [1000, 640], [2400, 640]],
      ropes: [{ x: 990, top: 640, bottom: 880 }],
      quiet: [[40, 880, 160], [900, 880, 300], [900, 800, 260], [900, 720, 260], [2340, 640, 160]],
      zones: [
        { name: 'Flower Meadow', color: '#e889b4', from: 0, mobs: ['mossgolem', 'sylph'], nodes: [{ kind: 'herb', pool: { clover: 1 } }] },
        { name: 'Waterfall Pool', color: '#4fb0d8', from: 800, mobs: ['sylph'], nodes: [{ kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.12] }],
          look: { sky: ['#9fe4f0', '#d8f4f6', '#fffbe8'], far: '#9fd8c8', mid: '#7fc8b0' } },
        { name: 'Sylph Grove', color: '#6fae5f', from: 1300, mobs: ['sylph', 'mossgolem'], nodes: [{ kind: 'honey', pool: { honeycomb: 1 } }],
          look: { sky: ['#b8ecd8', '#e2f8e8', '#fffbe6'], far: '#b0e4c4', mid: '#90d4a8' } },
      ],
      ledges: [
        // The Flower Meadow: low flower ledges.
        { x: 150, y: 800, w: 260 }, { x: 300, y: 720, w: 240 }, { x: 600, y: 640, w: 200 },
        // The Waterfall Pool: steps up beside the falls, and the fishing dock at the pool.
        { x: 450, y: 800, w: 300 }, { x: 650, y: 720, w: 240 },
        { x: 860, y: 832, w: 95, posts: true },
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
    updrafts: [{ x: 950, w: 50, top: 610, bottom: 880, kind: 'mist' }],
    portals: [{ id: 'west', x: 40, y: 880, to: 'woods', toPortal: 'glade' }],
    npcs: [],
    // A landmark per zone: the giant flowers in the meadow, the waterfall and its pool, the great
    // tree in the grove.
    deco: [['giantflower', 260, 0], ['giantflower', 700, 2], ['pond', 940], ['waterfall', 1000, 0, 640], ['bigtree', 1700, 1, 640], ['giantflower', 2150, 1, 640]],
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
        { name: 'Torii Steps', color: '#e0504a', rows: ['split', 'long'], mobs: ['nekomata'], nodes: [{ kind: 'herb', pool: { clover: 1 } }] },
        { name: 'Lantern Terraces', color: '#e0a040', rows: ['splitwide', 'tri', 'long'], mobs: ['nekomata', 'kitsunemiko'], nodes: [{ kind: 'fruit', pool: { cherry: 1 } }],
          look: { sky: ['#ffb8a8', '#ffd8c8', '#fff0e4'] } },
        { name: 'Hokora Heights', color: '#8f6cc4', rows: ['split', 'middle'], mobs: ['kitsunemiko'], nodes: [{ kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.2] }],
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
    deco: [['torii', 380], ['foxstatue', 290, 0], ['foxstatue', 470, 1], ['torii', 1220], ['foxstatue', 1130, 0], ['foxstatue', 1310, 1], ['torii', 2070], ['foxstatue', 1990, 0], ['foxstatue', 2150, 1],
      ['sakura', 700, 0, 480], ['sakura', 1800, 1, 480], ['hokora', 1200, 0, 240]],
    lamps: [{ x: 1200, y: 200 }, { x: 700, y: 440 }, { x: 1220, y: 850 }],
    spirit: { x: 1700, y: 200 },
    habitats: { nekomata: { naps: true, play: true, home: { x: 1220, y: 880 } }, kitsunemiko: { naps: true } },
  },


  // Moonlit Ridge is a walk along a ridgeline, side by side (data/climb.js lay()): the ground itself
  // rises and falls. The Moonlit Meadow in the west, a low saddle among the moonstones where a
  // moonbeam lifts you; the Wolf Den on the rocky knoll and the dip beyond it, the Lupina's home,
  // with a ledge drifting over the dip; and the Howling Rock in the east, the high summit of the
  // Rock Golems, where a vent bounces you up onto the great howling rock itself.
  ridge: {
    id: 'ridge', name: 'Moonlit Ridge', theme: 'ridge', town: 'crag', world: { x: 246, y: 104 },
    ...lay({
      width: 2400, ground: 880, by: 'x',
      terrain: [[0, 880], [600, 880], [600, 760], [1000, 760], [1000, 840], [1400, 840], [1400, 700], [1800, 700], [1800, 560], [2400, 560]],
      // Ropes down each rock face, hanging beside it from the top.
      ropes: [{ x: 590, top: 760, bottom: 880 }, { x: 1010, top: 760, bottom: 840 }, { x: 1390, top: 700, bottom: 840 }, { x: 1790, top: 560, bottom: 700 }],
      quiet: [[40, 880, 160]],
      zones: [
        { name: 'Moonlit Meadow', color: '#6a8ad0', from: 0, mobs: ['lupina'], nodes: [{ kind: 'herb', pool: { clover: 1 } }] },
        { name: 'Wolf Den', color: '#8a7ab0', from: 600, mobs: ['lupina', 'rockgolem'], nodes: [{ kind: 'ore', pool: { copper_ore: 1 }, rare: ['rose_quartz', 0.2] }],
          look: { sky: ['#2a2e6a', '#4a4e8a', '#8a8ac0'] } },
        { name: 'Howling Rock', color: '#a8b8e0', from: 1400, mobs: ['rockgolem', 'lupina'], nodes: [{ kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' }],
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
    habitats: { lupina: { play: true, home: { x: 800, y: 760 } }, rockgolem: { naps: true } },
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
        { name: 'Hot Spring Pools', color: '#e0705a', rows: ['wide', 'split'], mobs: ['lamia'], nodes: [{ kind: 'herb', pool: { clover: 1 } }] },
        { name: 'Waterfall Steps', color: '#4fb0d8', rows: ['tri', 'long', 'splitwide'], mobs: ['lamia', 'shade'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.2] }],
          look: { sky: ['#9fd8e8', '#cfeef0', '#fff4ea'] } },
        { name: 'Steam Heights', color: '#8a86b0', rows: ['split', 'middle'], mobs: ['shade', 'lamia'], nodes: [{ kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' }],
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
    deco: [['hotspring', 860], ['hotspring', 1620], ['hotspring', 2250], ['waterfall', 1500, 0, 560], ['hotspring', 1100, 0, 240]],
    lamps: [{ x: 2230, y: 810 }, { x: 1500, y: 520 }, { x: 1100, y: 200 }],
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
      width: 2200, ground: 1120, by: 'y', quiet: [[40, 280, 200], [2140, 1120, 160], [1950, 1120, 320], [1950, 1040, 260], [2000, 960, 260]],
      zones: [
        { name: 'Frozen Lake', color: '#7ab8e8', mobs: ['cloudsheep', 'yukionna'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.2] }] },
        { name: 'Icefall Crevasse', color: '#8f8ad0', from: 760, mobs: ['yukionna', 'cloudsheep'], nodes: [{ kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' }],
          look: { sky: ['#9fb8e8', '#c8d8f4', '#eef4ff'] } },
        { name: 'Summit', color: '#e8f4ff', from: 480, mobs: ['yukionna'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.3] }],
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
        // The ice-fishing dock on the lake.
        { x: 1900, y: 1072, w: 95, posts: true },
      ],
    }),
    // A moving part per zone: a frost vent on the summit, the drifting floe in the crevasse, and a
    // howling wind up from the lake (Up to ride it).
    springs: [{ x: 1040, y: 340, up: 160, kind: 'gust' }],
    updrafts: [{ x: 1050, w: 56, top: 470, bottom: 1120, kind: 'gust' }],
    portals: [
      { id: 'west', x: 40, y: 280, to: 'springs', toPortal: 'east' },
      { id: 'east', x: 2140, y: 1120, to: 'sky', toPortal: 'peak' },
    ],
    npcs: [],
    // A landmark per zone: the great pine on the summit, a snowman on the crevasse ledges, the
    // snowmen and pines round the frozen lake.
    deco: [['snowpine', 420, 0, 280], ['snowman', 900, 0, 740], ['snowman', 640], ['snowpine', 1000, 1], ['snowpine', 1480, 0], ['snowman', 1700]],
    lamps: [{ x: 900, y: 180 }, { x: 1950, y: 1050 }, { x: 900, y: 710 }],
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
      terrain: [[0, 520], [460, 520], [460, 640], [760, 640], [760, 800], [1000, 800], [1000, 1040], [1600, 1040], [1600, 800], [1840, 800], [1840, 640], [2140, 640], [2140, 520], [2600, 520]],
      // Ropes down each cliff step, hanging beside the wall from its top.
      ropes: [{ x: 470, top: 520, bottom: 640 }, { x: 770, top: 640, bottom: 800 }, { x: 1010, top: 800, bottom: 1040 }, { x: 1590, top: 800, bottom: 1040 }, { x: 1830, top: 640, bottom: 800 }, { x: 2130, top: 520, bottom: 640 }],
      quiet: [[40, 520, 200], [880, 800, 260], [820, 640, 320], [2500, 440, 200]],
      zones: [
        { name: 'West Rim', color: '#8fa8f0', from: 0, mobs: ['windbird'], nodes: [{ kind: 'herb', pool: { moonpetal: 1 }, night: true, look: 'moonpetal' }] },
        { name: 'Fallen Star Crater', color: '#e0b84a', from: 1000, mobs: ['starspirit', 'windbird'], nodes: [{ kind: 'ore', pool: { silver_ore: 1 }, rare: ['rose_quartz', 0.3] }],
          look: { sky: ['#2a1e58', '#5a3f8c', '#c08ad6'] } },
        { name: 'East Rim', color: '#c8b8ff', from: 1600, mobs: ['starspirit'], nodes: [{ kind: 'herb', pool: { clover: 1 } }],
          look: { sky: ['#141238', '#3a2f7c', '#8a7ad0'] } },
      ],
      ledges: [
        // Islands floating over the crater.
        { x: 1050, y: 960, w: 220 }, { x: 1330, y: 960, w: 220 },
        { x: 1150, y: 880, w: 300 },
        // A ledge over the west rim, and the east rim's high island with the way to the terrace.
        { x: 100, y: 440, w: 260 },
        { x: 2250, y: 440, w: 300, thick: 44 },
        // The star-cloud ferry, gliding rim to rim across the valley.
        { x: 760, y: 640, w: 150, drift: { dx: 930, period: 16 } },
        // The fishing dock by the star pool on the west steps.
        { x: 800, y: 752, w: 95, posts: true },
      ],
    }),
    // A moving part per zone: the ferry on the west rim's steps, starlight rising from the crater
    // (Up to ride it, and catch the ferry going over), and a vent up to the east rim's island.
    updrafts: [{ x: 1300, w: 56, top: 610, bottom: 1040, kind: 'wisplight' }],
    springs: [{ x: 2300, y: 520, up: 120, kind: 'gust' }],
    portals: [{ id: 'west', x: 40, y: 520, to: 'sky', toPortal: 'starfall' }],
    npcs: [],
    // A landmark per zone: a cloud pillar on the west rim, the moonstones round the crater, the
    // gazebo on the east rim's island.
    deco: [['cloudpillar', 300], ['glowpool', 900], ['moonstone', 1200], ['moonstone', 1450], ['cloudpillar', 2000], ['skygazebo', 2380, 0, 440]],
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

MAPS.glade.portals.push({ id: 'bower', x: 2340, y: 640, to: 'bower', toPortal: 'west', label: "Sylvana's Bower" });
// The shrine path's petal cloud.
MAPS.shrine.platforms.push({ x: 975, y: 400, w: 150, drift: { dx: 500, period: 11 } });
MAPS.shrine.portals.push({ id: 'sanctum', x: 1450, y: 240, to: 'sanctum', toPortal: 'west', label: "Tamamo's Sanctum" });
// Serpent Springs' drifting ledge and fishing dock; the grotto is behind the waterfall.
MAPS.springs.platforms.push({ x: 1035, y: 480, w: 130, drift: { dx: 200, period: 9 } }, { x: 2180, y: 832, w: 95, posts: true });
MAPS.springs.portals.push({ id: 'grotto', x: 1560, y: 560, to: 'grotto', toPortal: 'west', label: 'Rose Grotto' });
MAPS.starfall.portals.push({ id: 'terrace', x: 2500, y: 440, to: 'terrace', toPortal: 'west', label: 'Moon Terrace' });

// The queens roam their regions as field bosses (from the start: the story is optional), back
// every ten minutes or so after they fall.
MAPS.glade.spawns.push({ mob: 'sylvana', x: 600, y: 880, respawn: 600 });
MAPS.shrine.spawns.push({ mob: 'tamamo', x: 2200, y: 880, respawn: 600 });
MAPS.springs.spawns.push({ mob: 'lilith', x: 1300, y: 880, respawn: 600 });
MAPS.starfall.spawns.push({ mob: 'selene', x: 1300, y: 1040, respawn: 600 });
