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

export const MAPS = {
  // The archers' home town, laid out in quarters from west to east: a homey corner of two-storey
  // cottages with a terraced walk up between them (Mira welcomes you at the entrance); the shop
  // street (Pip's goods and Lulu's salon side by side); the raised plaza under the giant cherry
  // tree, with the fountain, benches and the noticeboard (a branch of the tree is a ledge, up its
  // rope); then the archers' quarter: the Archer Lodge, the watchtower (its deck a ledge) and the
  // range, out to the meadow road. Nothing you need is up a ladder.
  sprout: {
    id: 'sprout', plaza: 1290, name: 'Sprout Village', theme: 'town', isTown: true, town: 'sprout', job: 'archer', world: { x: 66, y: 182 },
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

  // Three long floors 90px apart, joined by ropes at alternating ends so you hunt in a zig-zag
  // loop; a lookout on top, and the canyon portal at the top right as the reward for the climb.
  // No monsters near the side portals.
  meadow1: {
    id: 'meadow1', name: 'Petal Meadow', theme: 'meadow', town: 'sprout', world: { x: 118, y: 160 },
    width: 2400, height: 760, groundY: 720,
    look: { sky: ['#ffc6dd', '#ffe3d8', '#fff6e6'], far: '#f3d3e8', mid: '#bfe8b8', midTrim: '#8fd39a', light: 'morning', edges: 'flowers', front: 'blossoms', props: ['flower', 'tulip', 'flower', 'bush', 'tulip', 'tuft'] },
    terrain: [[0, 720], [620, 720], [700, 690], [1500, 690], [1580, 720], [2400, 720]],
    platforms: [
      { x: 160, y: 630, w: 820 },
      { x: 1240, y: 630, w: 900 },
      { x: 80, y: 550, w: 640 },
      { x: 900, y: 550, w: 600 },
      { x: 1700, y: 550, w: 620 },
      { x: 300, y: 470, w: 760 },
      { x: 1340, y: 470, w: 760 },
      { x: 900, y: 390, w: 320, thick: 44 },
    ],
    ropes: [
      { x: 940, top: 630, bottom: 690, ladder: true },
      { x: 1280, top: 630, bottom: 690, ladder: true },
      { x: 130, top: 550, bottom: 720 },
      { x: 2270, top: 550, bottom: 720 },
      { x: 960, top: 470, bottom: 550 },
      { x: 1420, top: 470, bottom: 550 },
      { x: 1040, top: 390, bottom: 470, ladder: true },
    ],
    portals: [
      { id: 'west', x: 40, y: 720, to: 'sprout', toPortal: 'east' },
      { id: 'east', x: 2340, y: 720, to: 'meadow2', toPortal: 'west' },
      { id: 'north', x: 2040, y: 470, to: 'canyon', toPortal: 'south' },
    ],
    npcs: [],
    deco: [['flowerarch', 200], ['beehive', 560], ['giantflower', 1110, 0], ['bigtree', 1160, 1, 390], ['picnic', 1640], ['signpost', 2200]],
    spawns: [
      { mob: 'puffle', x: 494, y: 720 }, { mob: 'snailbun', x: 842, y: 690 }, { mob: 'puffle', x: 1190, y: 690 }, { mob: 'snailbun', x: 1538, y: 704 },
      { mob: 'puffle', x: 1886, y: 720 }, { mob: 'puffle', x: 307, y: 630 }, { mob: 'snailbun', x: 570, y: 630 }, { mob: 'puffle', x: 833, y: 630 },
      { mob: 'puffle', x: 1401, y: 630 }, { mob: 'snailbun', x: 1690, y: 630 }, { mob: 'puffle', x: 1979, y: 630 }, { mob: 'snailbun', x: 248, y: 550 },
      { mob: 'puffle', x: 552, y: 550 }, { mob: 'puffle', x: 1058, y: 550 }, { mob: 'snailbun', x: 1342, y: 550 }, { mob: 'puffle', x: 1863, y: 550 },
      { mob: 'snailbun', x: 2157, y: 550 }, { mob: 'puffle', x: 498, y: 470 }, { mob: 'snailbun', x: 862, y: 470 }, { mob: 'snailbun', x: 1558, y: 470 },
    ],
  },

  // Farm terraces climbing from both sides to a long hilltop field with the barn: up one side,
  // across the top, down the other. Mandrakes low, mushrooms in the middle, piglets on top.
  meadow2: {
    id: 'meadow2', name: 'Clover Hills', theme: 'meadow', town: 'harbor', world: { x: 162, y: 196 },
    width: 2400, height: 720, groundY: 680,
    look: { sky: ['#5ec8ff', '#aee8ff', '#e8fff2'], far: '#9fdf9f', mid: '#6fcf7a', midTrim: '#4fae5f', rainbow: 0, material: 'farm', edges: 'clover', light: 'noon', drift: null, props: ['tuft', 'bush', 'rock', 'tuft', 'flower'] },
    terrain: [[0, 680], [900, 680], [1000, 650], [1500, 650], [1600, 680], [2400, 680]],
    platforms: [
      { x: 120, y: 600, w: 640 }, { x: 1640, y: 600, w: 640 },
      { x: 360, y: 520, w: 620 }, { x: 1420, y: 520, w: 620 },
      { x: 620, y: 440, w: 1160 },
    ],
    ropes: [{ x: 140, top: 600, bottom: 680, ladder: true }, { x: 2260, top: 600, bottom: 680, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 680, to: 'meadow1', toPortal: 'east' },
      { id: 'east', x: 2340, y: 680, to: 'harbor', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['fence', 240], ['scarecrow', 560], ['barn', 1200, 0, 440], ['haystack', 900, 0, 440], ['fence', 1500, 1, 440], ['cart', 1250], ['pond', 2000], ['haystack', 2150, 2], ['signpost', 2200]],
    spawns: [
      { mob: 'sproutling', x: 465, y: 680 }, { mob: 'sproutling', x: 755, y: 680 }, { mob: 'sproutling', x: 1045, y: 650 }, { mob: 'sproutling', x: 1335, y: 650 },
      { mob: 'sproutling', x: 1625, y: 680 }, { mob: 'sproutling', x: 1915, y: 680 }, { mob: 'sproutling', x: 288, y: 600 }, { mob: 'mushkin', x: 592, y: 600 },
      { mob: 'mushkin', x: 1808, y: 600 }, { mob: 'sproutling', x: 2112, y: 600 }, { mob: 'mushkin', x: 523, y: 520 }, { mob: 'piglet', x: 817, y: 520 },
      { mob: 'piglet', x: 1583, y: 520 }, { mob: 'mushkin', x: 1877, y: 520 }, { mob: 'piglet', x: 777, y: 440 }, { mob: 'mushkin', x: 1059, y: 440 },
      { mob: 'piglet', x: 1341, y: 440 }, { mob: 'mushkin', x: 1623, y: 440 },
    ],
  },

  // The thieves' home port at dusk, in quarters: the market (Marlo's cart among tall pastel canal
  // houses); the raised harbor plaza with the fountain and the Harbor Office; the back alley under
  // washing lines (Vex's Den, a rooftop hideout up on stilts behind it); then the pier, a walkable
  // boardwalk over the water with rowboats tied up, the moored ship, and the lighthouse.
  harbor: {
    id: 'harbor', plaza: 900, name: 'Pastel Harbor', theme: 'harbor', isTown: true, town: 'harbor', job: 'thief', world: { x: 222, y: 206 },
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


  // A tall forest hunted vertically: five floors of branches between three giant trees, with a
  // rope up each trunk. Moss golems hold the wide middle branch.
  woods: {
    id: 'woods', name: 'Mossy Woods', theme: 'forest', town: 'harbor', world: { x: 254, y: 166 },
    width: 2200, height: 960, groundY: 920,
    look: { sky: ['#8fd6a8', '#c6ecc9', '#f2f8d6'], far: '#7fc79a', mid: '#5aa878', islands: 'planks', edges: 'glowcaps' },
    terrain: [[0, 920], [1000, 920], [1060, 900], [1180, 900], [1240, 920], [2200, 920]],
    platforms: [
      { x: 120, y: 840, w: 840 }, { x: 1240, y: 840, w: 840 },
      { x: 260, y: 760, w: 500 }, { x: 900, y: 760, w: 400 }, { x: 1440, y: 760, w: 500 },
      { x: 120, y: 680, w: 500 }, { x: 760, y: 680, w: 680 }, { x: 1580, y: 680, w: 500 },
      { x: 300, y: 600, w: 600 }, { x: 1300, y: 600, w: 600 },
      { x: 200, y: 520, w: 360 }, { x: 900, y: 520, w: 400 }, { x: 1640, y: 520, w: 360 },
    ],
    ropes: [
      { x: 380, top: 520, bottom: 920 }, { x: 1100, top: 520, bottom: 680 }, { x: 1820, top: 520, bottom: 920 },
      { x: 1000, top: 760, bottom: 920, ladder: true },
    ],
    portals: [
      { id: 'west', x: 40, y: 920, to: 'harbor', toPortal: 'east' },
      { id: 'east', x: 2140, y: 920, to: 'grove', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['bigtree', 380, 0], ['bigtree', 1100, 1], ['bigtree', 1820, 0], ['hollowlog', 640], ['mushring', 1500], ['giantshroom', 2060, 1], ['stumphouse', 1100, 0, 520]],
    spawns: [
      { mob: 'leafling', x: 513, y: 920 }, { mob: 'boarlet', x: 898, y: 920 }, { mob: 'leafling', x: 1283, y: 920 }, { mob: 'boarlet', x: 1668, y: 920 },
      { mob: 'leafling', x: 338, y: 840 }, { mob: 'boarlet', x: 742, y: 840 }, { mob: 'leafling', x: 1458, y: 840 }, { mob: 'boarlet', x: 1862, y: 840 },
      { mob: 'leafling', x: 393, y: 760 }, { mob: 'leafling', x: 627, y: 760 }, { mob: 'mossgolem', x: 1100, y: 760 }, { mob: 'leafling', x: 1573, y: 760 },
      { mob: 'leafling', x: 1807, y: 760 }, { mob: 'boarlet', x: 370, y: 680 }, { mob: 'mossgolem', x: 938, y: 680 }, { mob: 'mossgolem', x: 1262, y: 680 },
      { mob: 'boarlet', x: 1830, y: 680 }, { mob: 'leafling', x: 458, y: 600 }, { mob: 'leafling', x: 742, y: 600 }, { mob: 'leafling', x: 1458, y: 600 },
      { mob: 'leafling', x: 1742, y: 600 }, { mob: 'leafling', x: 380, y: 520 }, { mob: 'leafling', x: 1100, y: 520 }, { mob: 'leafling', x: 1820, y: 520 },
    ],
  },

  // Long stone floors broken by gaps: drop through a gap to the floor below, jump back up. Bats
  // and wisps hover in the gaps; an arch stands on the throne terrace at the top.
  ruins: {
    id: 'ruins', name: 'Twilight Ruins', theme: 'ruins', town: 'grove', world: { x: 322, y: 90 },
    width: 2600, height: 800, groundY: 760,
    look: { islands: 'stone' },
    terrain: [[0, 760], [2600, 760]],
    platforms: [
      { x: 100, y: 680, w: 1000 }, { x: 1220, y: 680, w: 1280 },
      { x: 200, y: 600, w: 600 }, { x: 920, y: 600, w: 680 }, { x: 1720, y: 600, w: 680 },
      { x: 400, y: 520, w: 600 }, { x: 1120, y: 520, w: 680 }, { x: 1920, y: 520, w: 380 },
      { x: 1000, y: 440, w: 500, thick: 44 },
    ],
    ropes: [{ x: 150, top: 680, bottom: 760, ladder: true }, { x: 2450, top: 680, bottom: 760, ladder: true }, { x: 1460, top: 440, bottom: 520, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 760, to: 'grove', toPortal: 'east' },
      { id: 'east', x: 2540, y: 760, to: 'cave', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['ruinarch', 300], ['ruinpillar', 1160], ['statue', 860], ['ruinpillar', 1660], ['ruinarch', 1250, 0, 440], ['statue', 2200]],
    spawns: [
      { mob: 'boneknight', x: 482, y: 760 }, { mob: 'gloombat', x: 805, y: 760 }, { mob: 'boneknight', x: 1128, y: 760 }, { mob: 'gloombat', x: 1452, y: 760 },
      { mob: 'boneknight', x: 1775, y: 760 }, { mob: 'gloombat', x: 2098, y: 760 }, { mob: 'boneknight', x: 277, y: 680 }, { mob: 'boneknight', x: 600, y: 680 },
      { mob: 'boneknight', x: 923, y: 680 }, { mob: 'boneknight', x: 1392, y: 680 }, { mob: 'gloombat', x: 1704, y: 680 }, { mob: 'boneknight', x: 2016, y: 680 },
      { mob: 'gloombat', x: 2328, y: 680 }, { mob: 'wisp', x: 358, y: 600 }, { mob: 'wisp', x: 642, y: 600 }, { mob: 'wisp', x: 1098, y: 600 },
      { mob: 'boneknight', x: 1422, y: 600 }, { mob: 'wisp', x: 1898, y: 600 }, { mob: 'wisp', x: 2222, y: 600 }, { mob: 'gloombat', x: 558, y: 520 },
      { mob: 'gloombat', x: 842, y: 520 }, { mob: 'boneknight', x: 1298, y: 520 }, { mob: 'boneknight', x: 1622, y: 520 }, { mob: 'gloombat', x: 2110, y: 520 },
      { mob: 'wisp', x: 1133, y: 440 }, { mob: 'wisp', x: 1367, y: 440 },
    ],
  },

  // A low tunnel with three glowing pits (slimes live in them), two rows of galleries above, and
  // the throne door on a raised alcove in the middle.
  cave: {
    id: 'cave', name: 'Crystal Cave', theme: 'cave', town: 'grove', world: { x: 336, y: 148 },
    width: 2600, height: 760, groundY: 640,
    look: { ceiling: true },
    terrain: [[0, 640], [500, 640], [500, 720], [700, 720], [700, 640], [1300, 640], [1300, 720], [1560, 720], [1560, 640], [2100, 640], [2100, 720], [2300, 720], [2300, 640], [2600, 640]],
    platforms: [
      { x: 150, y: 560, w: 330 }, { x: 720, y: 560, w: 560 }, { x: 1580, y: 560, w: 500 }, { x: 2320, y: 560, w: 180 },
      { x: 300, y: 480, w: 600 }, { x: 1100, y: 480, w: 600 }, { x: 1900, y: 480, w: 500 },
      { x: 1100, y: 400, w: 300, thick: 44 },
    ],
    ropes: [{ x: 1240, top: 400, bottom: 480, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 640, to: 'ruins', toPortal: 'east' },
      { id: 'east', x: 2540, y: 640, to: 'sky', toPortal: 'west' },
      { id: 'boss', x: 1300, y: 400, to: 'bossroom', toPortal: 'west', label: 'Throne' },
      // The mine road back down to Sprout Village (the ring round the island).
      { id: 'sprout', x: 1000, y: 640, to: 'sprout', toPortal: 'west', label: 'Sprout Village' },
    ],
    npcs: [],
    deco: [['glowpool', 600], ['glowpool', 1430], ['glowpool', 2200], ['crystalspire', 380, 0], ['stalagmite', 1000], ['crystalspire', 1800, 1], ['stalagmite', 2450]],
    spawns: [
      { mob: 'rockgolem', x: 402, y: 640 }, { mob: 'crystalslime', x: 600, y: 720 }, { mob: 'rockgolem', x: 858, y: 640 }, { mob: 'rockgolem', x: 1142, y: 640 },
      { mob: 'crystalslime', x: 1430, y: 720 }, { mob: 'crystalslime', x: 1703, y: 640 }, { mob: 'rockgolem', x: 1957, y: 640 }, { mob: 'crystalslime', x: 2200, y: 720 },
      { mob: 'crystalslime', x: 315, y: 560 }, { mob: 'crystalslime', x: 868, y: 560 }, { mob: 'crystalslime', x: 1132, y: 560 }, { mob: 'crystalslime', x: 1713, y: 560 },
      { mob: 'crystalslime', x: 1947, y: 560 }, { mob: 'shade', x: 458, y: 480 }, { mob: 'shade', x: 742, y: 480 }, { mob: 'rockgolem', x: 1258, y: 480 },
      { mob: 'rockgolem', x: 1542, y: 480 }, { mob: 'shade', x: 2033, y: 480 }, { mob: 'shade', x: 2267, y: 480 },
    ],
  },

  // Five layers of floating islands held up by cloud pillars, climbing to the gazebo garden at
  // the top. Sheep graze low; birds and star spirits fly higher.
  sky: {
    id: 'sky', name: 'Sky Garden', theme: 'sky', town: 'grove', world: { x: 348, y: 36 },
    width: 2400, height: 1000, groundY: 960,
    terrain: [[0, 960], [2400, 960]],
    platforms: [
      { x: 100, y: 880, w: 600 }, { x: 1000, y: 880, w: 600 }, { x: 1900, y: 880, w: 400 },
      { x: 400, y: 800, w: 700 }, { x: 1500, y: 800, w: 600 },
      { x: 150, y: 720, w: 500 }, { x: 900, y: 720, w: 600 }, { x: 1800, y: 720, w: 500 },
      { x: 500, y: 640, w: 700 }, { x: 1500, y: 640, w: 500 },
      { x: 900, y: 560, w: 600, thick: 44 },
    ],
    ropes: [{ x: 1150, top: 560, bottom: 640 }, { x: 200, top: 720, bottom: 960 }, { x: 2250, top: 720, bottom: 960 }],
    portals: [{ id: 'west', x: 40, y: 960, to: 'cave', toPortal: 'east' }],
    npcs: [],
    deco: [['cloudpillar', 850], ['cloudpillar', 1750], ['skygazebo', 1200, 0, 560], ['giantflower', 300, 1, 880], ['skygazebo', 2100, 0, 880]],
    spawns: [
      { mob: 'cloudsheep', x: 526, y: 960 }, { mob: 'cloudsheep', x: 939, y: 960 }, { mob: 'cloudsheep', x: 1352, y: 960 }, { mob: 'cloudsheep', x: 1765, y: 960 },
      { mob: 'cloudsheep', x: 2178, y: 960 }, { mob: 'cloudsheep', x: 258, y: 880 }, { mob: 'cloudsheep', x: 542, y: 880 }, { mob: 'cloudsheep', x: 1158, y: 880 },
      { mob: 'cloudsheep', x: 1442, y: 880 }, { mob: 'windbird', x: 2100, y: 880 }, { mob: 'windbird', x: 583, y: 800 }, { mob: 'windbird', x: 917, y: 800 },
      { mob: 'cloudsheep', x: 1658, y: 800 }, { mob: 'cloudsheep', x: 1942, y: 800 }, { mob: 'cloudsheep', x: 400, y: 720 }, { mob: 'starspirit', x: 1058, y: 720 },
      { mob: 'starspirit', x: 1342, y: 720 }, { mob: 'cloudsheep', x: 2050, y: 720 }, { mob: 'starspirit', x: 683, y: 640 }, { mob: 'starspirit', x: 1017, y: 640 },
      { mob: 'windbird', x: 1750, y: 640 }, { mob: 'starspirit', x: 1058, y: 560 }, { mob: 'starspirit', x: 1342, y: 560 },
    ],
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
  // One long climb north to Ember Crag: the ground steps up in cliffs, with cliff paths, a long
  // rope bridge, and a windmill lookout at the top.
  canyon: {
    id: 'canyon', name: 'Windy Canyon', theme: 'crag', town: 'crag', world: { x: 138, y: 104 },
    width: 2400, height: 760, groundY: 720,
    terrain: [[0, 720], [600, 720], [600, 640], [1100, 640], [1100, 560], [1700, 560], [1700, 480], [2400, 480]],
    platforms: [
      { x: 100, y: 640, w: 460 },
      { x: 300, y: 560, w: 760 },
      { x: 700, y: 480, w: 960, style: 'bridge' },
      { x: 1200, y: 400, w: 1100 },
      { x: 1800, y: 320, w: 450 },
    ],
    ropes: [{ x: 640, top: 560, bottom: 640 }, { x: 1250, top: 400, bottom: 560, ladder: true }],
    portals: [
      { id: 'south', x: 40, y: 720, to: 'meadow1', toPortal: 'north' },
      { id: 'north', x: 2340, y: 480, to: 'crag', toPortal: 'south' },
    ],
    npcs: [],
    deco: [['mesa', 250], ['bones', 860], ['totem', 950], ['tent', 1500, 0, 400], ['windmillcrag', 2025, 0, 320], ['signpost', 2280]],
    spawns: [
      { mob: 'pebblet', x: 452, y: 720 }, { mob: 'scorpip', x: 733, y: 640 }, { mob: 'scorpip', x: 967, y: 640 }, { mob: 'pebblet', x: 1258, y: 560 },
      { mob: 'pebblet', x: 1542, y: 560 }, { mob: 'scorpip', x: 1888, y: 480 }, { mob: 'pebblet', x: 223, y: 640 }, { mob: 'pebblet', x: 437, y: 640 },
      { mob: 'scorpip', x: 498, y: 560 }, { mob: 'pebblet', x: 862, y: 560 }, { mob: 'scorpip', x: 1206, y: 480 }, { mob: 'pebblet', x: 1498, y: 480 },
      { mob: 'pebblet', x: 1394, y: 400 }, { mob: 'scorpip', x: 1750, y: 400 }, { mob: 'pebblet', x: 2106, y: 400 }, { mob: 'scorpip', x: 2025, y: 320 },
    ],
  },

  // The warriors' home under the mesas, in quarters: the training yard (dummies and a totem) by the
  // canyon road; the Warrior Hall; the raised plaza around the sparring arena; then the forge
  // street with Tora's Forge, out to the Moonlit Ridge road. The sandstone houses have flat roofs
  // you can climb onto by the ladders on their sides.
  crag: {
    id: 'crag', plaza: 1300, name: 'Ember Crag', theme: 'crag', isTown: true, town: 'crag', job: 'warrior', world: { x: 196, y: 50 },
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
    deco: [['crates', 260], ['barrels', 420], ['signpost', 1360]],
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

MAPS.canyon.portals.push({ id: 'hollow', x: 780, y: 480, to: 'hollow_gate', toPortal: 'south', label: 'Rootwood Hollow' });

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

MAPS.woods.portals.push({ id: 'glade', x: 1650, y: 920, to: 'glade', toPortal: 'west', label: 'Whispering Glade' });
MAPS.ruins.portals.push({ id: 'shrine', x: 2000, y: 760, to: 'shrine', toPortal: 'west', label: 'Fox Shrine Path' });
MAPS.crag.portals.push({ id: 'ridge', x: 1580, y: 480, to: 'ridge', toPortal: 'west', label: 'Moonlit Ridge' });
MAPS.cave.portals.push({ id: 'springs', x: 1660, y: 640, to: 'springs', toPortal: 'west', label: 'Serpent Springs' });
MAPS.sky.portals.push({ id: 'peak', x: 2340, y: 960, to: 'peak', toPortal: 'east', label: 'Frozen Peak' });
MAPS.sky.portals.push({ id: 'starfall', x: 1420, y: 560, to: 'starfall', toPortal: 'west', label: 'Starfall Heights' });

Object.assign(MAPS, {
  // A sunny clearing deep in the woods where the wind never stops: wind chimes in every tree,
  // giant flowers, a waterfall off the high ledge. Sylphs ride the breeze; Treants stand guard.
  glade: {
    id: 'glade', name: 'Whispering Glade', theme: 'forest', town: 'harbor', world: { x: 278, y: 160 },
    width: 2200, height: 760, groundY: 720,
    look: { sky: ['#8fe0d0', '#d2f4e2', '#fffbe0'], far: '#8fd6b4', mid: '#6cc498', midTrim: '#4fae7f', light: 'morning', edges: 'flowers', props: ['flower', 'chime', 'tuft', 'bush', 'tulip', 'flower'], drift: 'leaf', rainbow: 0.3 },
    terrain: [[0, 720], [2200, 720]],
    platforms: [
      { x: 160, y: 640, w: 700 }, { x: 1000, y: 640, w: 600 }, { x: 1720, y: 640, w: 360 },
      { x: 320, y: 560, w: 480 }, { x: 1100, y: 560, w: 520 },
      { x: 560, y: 480, w: 720 }, { x: 1500, y: 480, w: 420 },
      { x: 900, y: 400, w: 380, thick: 44 },
    ],
    ropes: [{ x: 1880, top: 480, bottom: 720 }, { x: 1180, top: 400, bottom: 480, ladder: true }],
    portals: [{ id: 'west', x: 40, y: 720, to: 'woods', toPortal: 'glade' }],
    npcs: [],
    deco: [['giantflower', 260, 0], ['bigtree', 940, 1], ['giantflower', 1450, 2], ['waterfall', 1000, 0, 400], ['pond', 1700], ['giantflower', 2120, 1]],
    spawns: [
      ...along(720, 140, 2160, 6, 'mossgolem', 'sylph'), ...along(640, 180, 840, 3, 'sylph', 'mossgolem'), ...along(640, 1020, 1580, 3, 'mossgolem', 'sylph'),
      ...along(560, 340, 780, 2, 'sylph'), ...along(560, 1120, 1600, 2, 'sylph', 'mossgolem'), ...along(480, 580, 1260, 3, 'mossgolem', 'sylph', 'sylph'), ...along(480, 1520, 1900, 2, 'sylph'),
    ],
  },

  // A stone path climbing through cherry trees at sunset under one vermilion gate after another,
  // fox guardians at each, a little roadside shrine on the terrace. Nekomata prowl the lower
  // path; Kitsune Miko keep the upper terraces.
  shrine: {
    id: 'shrine', name: 'Fox Shrine Path', theme: 'shrine', town: 'grove', world: { x: 378, y: 86 },
    width: 2600, height: 840, groundY: 800,
    terrain: [[0, 800], [700, 800], [780, 780], [1500, 780], [1580, 760], [2600, 760]],
    // Each great gate stands in the open, with the terraces climbing between them.
    platforms: [
      { x: 520, y: 720, w: 500 }, { x: 1360, y: 700, w: 540 }, { x: 2200, y: 680, w: 340 },
      { x: 140, y: 640, w: 440 }, { x: 860, y: 630, w: 560 }, { x: 1700, y: 610, w: 620 },
      { x: 420, y: 560, w: 520 }, { x: 1300, y: 540, w: 520 },
      { x: 2000, y: 520, w: 420, thick: 44 },
    ],
    ropes: [{ x: 2380, top: 520, bottom: 760 }, { x: 200, top: 640, bottom: 800 }],
    portals: [{ id: 'west', x: 40, y: 800, to: 'ruins', toPortal: 'shrine' }],
    npcs: [],
    deco: [['torii', 380], ['foxstatue', 290, 0], ['foxstatue', 470, 1], ['torii', 1220], ['foxstatue', 1130, 0], ['foxstatue', 1300, 1], ['torii', 2070], ['foxstatue', 1990, 0], ['foxstatue', 2150, 1],
      ['sakura', 690, 0, 560], ['sakura', 1560, 1, 540], ['hokora', 2210, 0, 520]],
    spawns: [
      ...along(800, 100, 690, 2, 'nekomata'), ...along(780, 800, 1480, 3, 'nekomata', 'kitsunemiko'), ...along(760, 1600, 2560, 3, 'nekomata', 'kitsunemiko'),
      ...along(720, 540, 1000, 2, 'nekomata'), ...along(700, 1380, 1880, 2, 'kitsunemiko', 'nekomata'), ...along(680, 2220, 2520, 1, 'kitsunemiko'),
      ...along(640, 160, 560, 1, 'nekomata'), ...along(630, 880, 1400, 2, 'kitsunemiko', 'nekomata'), ...along(610, 1720, 2300, 2, 'kitsunemiko'),
      ...along(560, 440, 920, 2, 'kitsunemiko'), ...along(540, 1320, 1800, 2, 'kitsunemiko'),
    ],
  },

  // High on the mountain above Ember Crag at night: blue rock and pines under a huge moon, the
  // howling rock at the top where Lupina's pack sings. Crystal Golems wander down from the cave.
  ridge: {
    id: 'ridge', name: 'Moonlit Ridge', theme: 'ridge', town: 'crag', world: { x: 246, y: 104 },
    width: 2400, height: 840, groundY: 800,
    terrain: [[0, 800], [600, 800], [700, 770], [1300, 770], [1400, 740], [2400, 740]],
    platforms: [
      { x: 160, y: 720, w: 400 }, { x: 760, y: 690, w: 480 }, { x: 1460, y: 660, w: 820 },
      { x: 320, y: 640, w: 560 }, { x: 1000, y: 610, w: 400 }, { x: 1600, y: 580, w: 560 },
      { x: 640, y: 560, w: 440 }, { x: 1240, y: 530, w: 420 },
      { x: 1880, y: 500, w: 380, thick: 44 },
    ],
    ropes: [{ x: 2220, top: 500, bottom: 740 }, { x: 340, top: 640, bottom: 800 }],
    portals: [{ id: 'west', x: 40, y: 800, to: 'crag', toPortal: 'ridge' }],
    npcs: [],
    deco: [['howlrock', 2060, 0, 500], ['moonstone', 900], ['howlrock', 480], ['moonstone', 1700]],
    spawns: [
      ...along(800, 120, 580, 2, 'lupina'), ...along(770, 720, 1280, 3, 'lupina', 'rockgolem'), ...along(740, 1420, 2360, 4, 'lupina', 'rockgolem'),
      ...along(720, 180, 540, 2, 'lupina'), ...along(690, 780, 1220, 2, 'rockgolem', 'lupina'), ...along(660, 1480, 2260, 3, 'lupina'),
      ...along(640, 340, 860, 2, 'lupina', 'rockgolem'), ...along(610, 1020, 1380, 2, 'lupina'), ...along(580, 1620, 2140, 2, 'rockgolem', 'lupina'),
      ...along(560, 660, 1060, 2, 'lupina'), ...along(530, 1260, 1640, 2, 'lupina'),
    ],
  },

  // A misty gorge off the Crystal Cave full of steaming turquoise pools, bamboo and reeds. Lamia
  // bask in the warm water; Wraiths drift in the steam.
  springs: {
    id: 'springs', name: 'Serpent Springs', theme: 'springs', town: 'grove', world: { x: 256, y: 40 },
    width: 2400, height: 800, groundY: 760,
    terrain: [[0, 760], [2400, 760]],
    platforms: [
      { x: 140, y: 680, w: 620 }, { x: 960, y: 680, w: 560 }, { x: 1700, y: 680, w: 560 },
      { x: 360, y: 600, w: 500 }, { x: 1160, y: 600, w: 560 },
      { x: 120, y: 520, w: 420 }, { x: 760, y: 520, w: 560 }, { x: 1600, y: 520, w: 520 },
      { x: 1040, y: 440, w: 400, thick: 44 },
    ],
    ropes: [{ x: 160, top: 520, bottom: 760 }, { x: 2060, top: 520, bottom: 760 }, { x: 1080, top: 440, bottom: 520, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 760, to: 'cave', toPortal: 'springs' },
      { id: 'east', x: 2340, y: 760, to: 'peak', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['hotspring', 860], ['hotspring', 1620], ['waterfall', 1240, 0, 440], ['hotspring', 2200]],
    spawns: [
      ...along(760, 120, 2280, 5, 'lamia', 'shade'), ...along(680, 160, 740, 1, 'lamia'), ...along(680, 980, 1500, 2, 'lamia', 'shade'), ...along(680, 1720, 2240, 1, 'lamia'),
      ...along(600, 380, 840, 1, 'shade'), ...along(600, 1180, 1700, 2, 'lamia'), ...along(520, 140, 520, 1, 'shade'), ...along(520, 780, 1300, 1, 'lamia'),
      ...along(520, 1620, 2100, 1, 'lamia'),
    ],
  },

  // The mountain's snowy shoulder between the springs and the Sky Garden: snowfields, laden pines,
  // a snowman someone built, icicles under every ledge. Yuki-onna glide over the snow; Pegasus
  // Foals graze the high drifts.
  peak: {
    id: 'peak', name: 'Frozen Peak', theme: 'snow', town: 'grove', world: { x: 312, y: 18 },
    width: 2200, height: 1000, groundY: 960,
    terrain: [[0, 960], [2200, 960]],
    platforms: [
      { x: 120, y: 880, w: 640 }, { x: 900, y: 880, w: 520 }, { x: 1560, y: 880, w: 520 },
      { x: 300, y: 800, w: 520 }, { x: 1100, y: 800, w: 600 },
      { x: 140, y: 720, w: 480 }, { x: 760, y: 720, w: 520 }, { x: 1440, y: 720, w: 560 },
      { x: 420, y: 640, w: 560 }, { x: 1160, y: 640, w: 560 },
      { x: 760, y: 560, w: 520, thick: 44 },
    ],
    ropes: [{ x: 180, top: 720, bottom: 960 }, { x: 1960, top: 720, bottom: 960 }, { x: 800, top: 560, bottom: 640, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 960, to: 'springs', toPortal: 'east' },
      { id: 'east', x: 2140, y: 960, to: 'sky', toPortal: 'peak' },
    ],
    npcs: [],
    deco: [['snowpine', 280, 0], ['snowman', 640], ['snowpine', 1000, 1], ['snowpine', 1480, 0], ['snowman', 1020, 0, 560], ['snowpine', 1900, 1]],
    spawns: [
      ...along(960, 120, 2080, 6, 'yukionna', 'cloudsheep'), ...along(880, 140, 740, 2, 'yukionna'), ...along(880, 920, 1400, 2, 'cloudsheep', 'yukionna'), ...along(880, 1580, 2060, 2, 'yukionna'),
      ...along(800, 320, 800, 2, 'cloudsheep'), ...along(800, 1120, 1680, 2, 'yukionna', 'cloudsheep'), ...along(720, 160, 600, 1, 'yukionna'), ...along(720, 780, 1260, 2, 'cloudsheep', 'yukionna'),
      ...along(720, 1460, 1980, 2, 'yukionna'), ...along(640, 440, 960, 2, 'cloudsheep'), ...along(640, 1180, 1700, 2, 'yukionna', 'cloudsheep'),
    ],
  },

  // Above the Sky Garden, where the night comes early: lavender cloud islands under a sky full of
  // shooting stars, the moon close enough to touch. Star Seraphs and Sky Harpies.
  starfall: {
    id: 'starfall', name: 'Starfall Heights', theme: 'sky', town: 'grove', world: { x: 390, y: 34 },
    width: 2400, height: 900, groundY: 860,
    look: { sky: ['#1d1b48', '#4a3f8c', '#a68ad6'], sun: '#e6dcff', far: '#5a4f9e', mid: '#6a5fa8', midTrim: '#8a7cc8', face: 'moon', stars: true, shooting: true, rainbow: 0, light: 'starfall', material: 'starcloud', props: ['cloudpuff', 'star', 'flower', 'cloudpuff'], drift: 'sparkle', ground: '#e6e0fa', groundDeep: '#c4b8ec', ledge: '#ece6ff', ledgeShade: '#c4b8ec' },
    terrain: [[0, 860], [2400, 860]],
    platforms: [
      { x: 140, y: 780, w: 560 }, { x: 900, y: 780, w: 600 }, { x: 1700, y: 780, w: 560 },
      { x: 400, y: 700, w: 600 }, { x: 1300, y: 700, w: 600 },
      { x: 160, y: 620, w: 460 }, { x: 860, y: 620, w: 560 }, { x: 1660, y: 620, w: 560 },
      { x: 1000, y: 540, w: 420, thick: 44 },
    ],
    ropes: [{ x: 200, top: 620, bottom: 860 }, { x: 2180, top: 620, bottom: 860 }, { x: 1040, top: 540, bottom: 620, ladder: true }],
    portals: [{ id: 'west', x: 40, y: 860, to: 'sky', toPortal: 'starfall' }],
    npcs: [],
    deco: [['cloudpillar', 700], ['moonstone', 1200], ['cloudpillar', 1600], ['skygazebo', 1210, 0, 540], ['moonstone', 2100]],
    spawns: [
      ...along(860, 120, 2300, 6, 'starspirit', 'windbird'), ...along(780, 160, 680, 2, 'windbird'), ...along(780, 920, 1480, 2, 'starspirit', 'windbird'), ...along(780, 1720, 2240, 2, 'starspirit'),
      ...along(700, 420, 980, 2, 'starspirit'), ...along(700, 1320, 1880, 2, 'windbird', 'starspirit'), ...along(620, 180, 600, 1, 'starspirit'), ...along(620, 880, 1400, 2, 'windbird', 'starspirit'),
      ...along(620, 1680, 2200, 2, 'starspirit'),
    ],
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

MAPS.glade.portals.push({ id: 'bower', x: 2140, y: 720, to: 'bower', toPortal: 'west', label: "Sylvana's Bower" });
MAPS.shrine.portals.push({ id: 'sanctum', x: 2560, y: 760, to: 'sanctum', toPortal: 'west', label: "Tamamo's Sanctum" });
MAPS.springs.portals.push({ id: 'grotto', x: 1500, y: 760, to: 'grotto', toPortal: 'west', label: 'Rose Grotto' });
MAPS.starfall.portals.push({ id: 'terrace', x: 2340, y: 860, to: 'terrace', toPortal: 'west', label: 'Moon Terrace' });

// After their trials, the queens come back to their regions every ten minutes or so.
MAPS.glade.spawns.push({ mob: 'sylvana', x: 1300, y: 720, respawn: 600, after: 'story_3_2' });
MAPS.shrine.spawns.push({ mob: 'tamamo', x: 2200, y: 760, respawn: 600, after: 'story_4_3' });
MAPS.springs.spawns.push({ mob: 'lilith', x: 1900, y: 760, respawn: 600, after: 'story_5_3' });
MAPS.starfall.spawns.push({ mob: 'selene', x: 1200, y: 860, respawn: 600, after: 'story_6_3' });
