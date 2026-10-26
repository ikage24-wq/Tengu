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
  sprout: {
    id: 'sprout', plaza: 1040, name: 'Sprout Village', theme: 'town', isTown: true, town: 'sprout', job: 'archer', world: { x: 66, y: 182 },
    width: 1600, height: 400, groundY: 360,
    platforms: [
      { x: 280, y: 280, w: 180 },
      { x: 520, y: 210, w: 160 },
      { x: 1080, y: 280, w: 200 },
    ],
    ropes: [{ x: 600, top: 210, bottom: 360 }],
    portals: [
      { id: 'start', x: 140, y: 360, hidden: true },
      { id: 'east', x: 1520, y: 360, to: 'meadow1', toPortal: 'west' },
    ],
    npcs: [{ id: 'mira', x: 360 }, { id: 'kestrel', x: 720 }, { id: 'pip', x: 860 }, { id: 'lulu', x: 1200 }],
    spawns: [],
  },

  meadow1: {
    id: 'meadow1', name: 'Petal Meadow', theme: 'meadow', town: 'sprout', world: { x: 118, y: 160 },
    width: 2200, height: 520, groundY: 480,
    terrain: [[0, 480], [460, 480], [560, 430], [820, 430], [900, 470], [1180, 470], [1180, 400], [1500, 400], [1500, 440], [1560, 440], [1620, 480], [2200, 480]],
    platforms: [
      { x: 120, y: 400, w: 200 },
      { x: 260, y: 320, w: 170 },
      { x: 600, y: 350, w: 200 },
      { x: 660, y: 270, w: 150 },
      { x: 930, y: 390, w: 200 },
      { x: 1220, y: 320, w: 220 },
      { x: 1300, y: 240, w: 170 },
      { x: 1760, y: 400, w: 220 },
      { x: 1880, y: 320, w: 200 },
      { x: 1980, y: 240, w: 160 },
    ],
    ropes: [{ x: 1360, top: 240, bottom: 320, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 480, to: 'sprout', toPortal: 'east' },
      { id: 'east', x: 2140, y: 480, to: 'meadow2', toPortal: 'west' },
      { id: 'north', x: 1700, y: 480, to: 'canyon', toPortal: 'south' },
    ],
    npcs: [],
    deco: [['bigtree', 380, 1], ['well', 760], ['flowerarch', 1040], ['giantshroom', 1400], ['signpost', 1640], ['bigtree', 2010]],
    spawns: [
      { mob: 'puffle', x: 300, y: 480 }, { mob: 'puffle', x: 700, y: 430 }, { mob: 'snailbun', x: 1000, y: 470 },
      { mob: 'puffle', x: 1350, y: 400 }, { mob: 'puffle', x: 1850, y: 480 }, { mob: 'snailbun', x: 220, y: 400 },
      { mob: 'puffle', x: 340, y: 320 }, { mob: 'snailbun', x: 700, y: 350 }, { mob: 'puffle', x: 730, y: 270 },
      { mob: 'snailbun', x: 1030, y: 390 }, { mob: 'puffle', x: 1330, y: 320 }, { mob: 'snailbun', x: 1380, y: 240 },
      { mob: 'snailbun', x: 1980, y: 320 }, { mob: 'puffle', x: 2060, y: 240 },
    ],
  },

  meadow2: {
    id: 'meadow2', name: 'Clover Hills', theme: 'meadow', town: 'harbor', world: { x: 162, y: 196 },
    width: 2400, height: 560, groundY: 520,
    terrain: [[0, 520], [380, 520], [520, 450], [700, 450], [820, 500], [1000, 500], [1120, 430], [1360, 430], [1480, 520], [1700, 520], [1700, 450], [1980, 450], [2100, 520], [2400, 520]],
    platforms: [
      { x: 120, y: 440, w: 220 },
      { x: 200, y: 360, w: 180 },
      { x: 520, y: 370, w: 200 },
      { x: 580, y: 290, w: 160 },
      { x: 820, y: 420, w: 200 },
      { x: 1140, y: 350, w: 220 },
      { x: 1200, y: 270, w: 180 },
      { x: 1260, y: 190, w: 140 },
      { x: 1500, y: 440, w: 180 },
      { x: 1740, y: 370, w: 200 },
      { x: 1820, y: 290, w: 180 },
      { x: 2140, y: 440, w: 180 },
    ],
    ropes: [{ x: 1330, top: 190, bottom: 270, ladder: true }, { x: 1690, top: 450, bottom: 520, ladder: true }],
    portals: [
      { id: 'west', x: 40, y: 520, to: 'meadow1', toPortal: 'east' },
      { id: 'east', x: 2340, y: 520, to: 'harbor', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['giantshroom', 290, 0], ['flowerarch', 610], ['well', 900], ['bigtree', 1240, 1], ['giantshroom', 1860, 2], ['signpost', 2260]],
    spawns: [
      { mob: 'sproutling', x: 250, y: 520 }, { mob: 'mushkin', x: 610, y: 450 }, { mob: 'sproutling', x: 900, y: 500 },
      { mob: 'mushkin', x: 1240, y: 430 }, { mob: 'sproutling', x: 1580, y: 520 }, { mob: 'mushkin', x: 1850, y: 450 },
      { mob: 'sproutling', x: 2250, y: 520 }, { mob: 'sproutling', x: 230, y: 440 }, { mob: 'mushkin', x: 280, y: 360 },
      { mob: 'sproutling', x: 620, y: 370 }, { mob: 'piglet', x: 660, y: 290 }, { mob: 'mushkin', x: 920, y: 420 },
      { mob: 'piglet', x: 1250, y: 350 }, { mob: 'piglet', x: 1290, y: 270 }, { mob: 'piglet', x: 1840, y: 370 },
      { mob: 'sproutling', x: 1900, y: 290 },
    ],
  },

  harbor: {
    id: 'harbor', plaza: 760, name: 'Pastel Harbor', theme: 'harbor', isTown: true, town: 'harbor', job: 'thief', world: { x: 222, y: 206 },
    width: 1800, height: 420, groundY: 380,
    platforms: [
      { x: 200, y: 300, w: 200 },
      { x: 1350, y: 300, w: 220 },
    ],
    ropes: [],
    portals: [
      { id: 'start', x: 860, y: 380, hidden: true },
      { id: 'west', x: 40, y: 380, to: 'meadow2', toPortal: 'east' },
      { id: 'east', x: 1740, y: 380, to: 'woods', toPortal: 'west' },
    ],
    npcs: [{ id: 'vex', x: 420 }, { id: 'rook', x: 1100 }, { id: 'marlo', x: 1460 }],
    spawns: [],
  },

  woods: {
    id: 'woods', name: 'Mossy Woods', theme: 'forest', town: 'harbor', world: { x: 254, y: 166 },
    width: 2600, height: 640, groundY: 600,
    terrain: [[0, 600], [560, 600], [680, 530], [900, 530], [900, 600], [1100, 600], [1100, 520], [1380, 520], [1500, 560], [1700, 560], [1820, 600], [2600, 600]],
    platforms: [
      { x: 120, y: 520, w: 220 },
      { x: 300, y: 440, w: 200 },
      { x: 150, y: 360, w: 180 },
      { x: 660, y: 450, w: 220 },
      { x: 720, y: 370, w: 180 },
      { x: 640, y: 290, w: 160 },
      { x: 920, y: 520, w: 160 },
      { x: 1130, y: 440, w: 220 },
      { x: 1180, y: 360, w: 200 },
      { x: 1260, y: 280, w: 180 },
      { x: 1160, y: 200, w: 160 },
      { x: 1500, y: 480, w: 200 },
      { x: 1560, y: 400, w: 180 },
      { x: 1860, y: 520, w: 220 },
      { x: 1960, y: 440, w: 200 },
      { x: 2100, y: 360, w: 200 },
      { x: 2300, y: 280, w: 180 },
      { x: 2260, y: 520, w: 200 },
    ],
    ropes: [
      { x: 230, top: 360, bottom: 600 },
      { x: 1090, top: 520, bottom: 600, ladder: true },
      { x: 1290, top: 200, bottom: 280, ladder: true },
    ],
    portals: [
      { id: 'west', x: 40, y: 600, to: 'harbor', toPortal: 'east' },
      { id: 'east', x: 2540, y: 600, to: 'grove', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['bigtree', 470, 0], ['giantshroom', 800, 1], ['bigtree', 1250, 1], ['giantshroom', 1620, 0], ['bigtree', 2000, 0], ['signpost', 2470]],
    spawns: [
      { mob: 'leafling', x: 300, y: 600 }, { mob: 'leafling', x: 780, y: 530 }, { mob: 'boarlet', x: 1000, y: 600 },
      { mob: 'mossgolem', x: 1250, y: 520 }, { mob: 'leafling', x: 1600, y: 560 }, { mob: 'boarlet', x: 2000, y: 600 },
      { mob: 'leafling', x: 2400, y: 600 }, { mob: 'leafling', x: 230, y: 520 }, { mob: 'boarlet', x: 770, y: 450 },
      { mob: 'leafling', x: 800, y: 370 }, { mob: 'mossgolem', x: 1240, y: 440 }, { mob: 'boarlet', x: 1280, y: 360 },
      { mob: 'leafling', x: 1240, y: 200 }, { mob: 'mossgolem', x: 1600, y: 480 }, { mob: 'leafling', x: 2060, y: 440 },
      { mob: 'mossgolem', x: 2200, y: 360 }, { mob: 'leafling', x: 2380, y: 280 },
    ],
  },

  ruins: {
    id: 'ruins', name: 'Twilight Ruins', theme: 'ruins', town: 'grove', world: { x: 322, y: 90 },
    width: 2600, height: 640, groundY: 600,
    terrain: [[0, 600], [500, 600], [500, 540], [760, 540], [760, 480], [1040, 480], [1040, 540], [1200, 540], [1200, 600], [1500, 600], [1500, 520], [1800, 520], [1920, 600], [2600, 600]],
    platforms: [
      { x: 140, y: 520, w: 220 },
      { x: 240, y: 440, w: 180 },
      { x: 540, y: 460, w: 180 },
      { x: 800, y: 400, w: 200 },
      { x: 860, y: 320, w: 180 },
      { x: 900, y: 240, w: 140 },
      { x: 1060, y: 460, w: 120 },
      { x: 1240, y: 520, w: 220 },
      { x: 1520, y: 440, w: 220 },
      { x: 1600, y: 360, w: 180 },
      { x: 1980, y: 520, w: 220 },
      { x: 2060, y: 440, w: 200 },
      { x: 2240, y: 360, w: 200 },
      { x: 2300, y: 520, w: 200 },
    ],
    ropes: [
      { x: 980, top: 240, bottom: 320, ladder: true },
      { x: 1490, top: 520, bottom: 600, ladder: true },
    ],
    portals: [
      { id: 'west', x: 40, y: 600, to: 'grove', toPortal: 'east' },
      { id: 'east', x: 2540, y: 600, to: 'cave', toPortal: 'west' },
    ],
    npcs: [],
    deco: [['ruinarch', 300], ['ruinpillar', 640], ['statue', 900], ['ruinpillar', 1120], ['ruinarch', 1350], ['statue', 1650], ['ruinpillar', 2000], ['ruinarch', 2250]],
    spawns: [
      { mob: 'boneknight', x: 300, y: 600 }, { mob: 'gloombat', x: 640, y: 540 }, { mob: 'boneknight', x: 900, y: 480 },
      { mob: 'gloombat', x: 1350, y: 600 }, { mob: 'boneknight', x: 1650, y: 520 }, { mob: 'boneknight', x: 2100, y: 600 },
      { mob: 'gloombat', x: 2400, y: 600 }, { mob: 'boneknight', x: 250, y: 520 }, { mob: 'wisp', x: 320, y: 440 },
      { mob: 'boneknight', x: 880, y: 400 }, { mob: 'wisp', x: 950, y: 320 }, { mob: 'wisp', x: 960, y: 240 },
      { mob: 'boneknight', x: 1340, y: 520 }, { mob: 'wisp', x: 1600, y: 440 }, { mob: 'boneknight', x: 1680, y: 360 },
      { mob: 'wisp', x: 2120, y: 440 }, { mob: 'boneknight', x: 2320, y: 360 },
    ],
  },

  cave: {
    id: 'cave', name: 'Crystal Cave', theme: 'cave', town: 'grove', world: { x: 336, y: 148 },
    width: 2600, height: 700, groundY: 660,
    terrain: [[0, 660], [420, 660], [540, 600], [700, 600], [820, 660], [1000, 660], [1000, 590], [1260, 590], [1380, 640], [1620, 640], [1620, 570], [1880, 570], [2000, 660], [2600, 660]],
    platforms: [
      { x: 120, y: 580, w: 220 },
      { x: 220, y: 500, w: 180 },
      { x: 520, y: 520, w: 200 },
      { x: 600, y: 440, w: 160 },
      { x: 820, y: 580, w: 160 },
      { x: 1020, y: 510, w: 220 },
      { x: 1080, y: 430, w: 180 },
      { x: 1040, y: 350, w: 200 },
      { x: 1400, y: 560, w: 200 },
      { x: 1440, y: 480, w: 180 },
      { x: 1650, y: 490, w: 200 },
      { x: 1700, y: 410, w: 180 },
      { x: 2060, y: 580, w: 220 },
      { x: 2160, y: 500, w: 200 },
      { x: 2320, y: 420, w: 180 },
    ],
    ropes: [
      { x: 1180, top: 350, bottom: 430, ladder: true },
      { x: 990, top: 590, bottom: 660 },
    ],
    portals: [
      { id: 'west', x: 40, y: 660, to: 'ruins', toPortal: 'east' },
      { id: 'east', x: 2540, y: 660, to: 'sky', toPortal: 'west' },
      { id: 'boss', x: 1100, y: 350, to: 'bossroom', toPortal: 'west', label: 'Throne' },
    ],
    npcs: [],
    deco: [['crystalspire', 280, 0], ['stalagmite', 620], ['crystalspire', 900, 1], ['stalagmite', 1300], ['crystalspire', 1520, 0], ['stalagmite', 1760], ['crystalspire', 2200, 1], ['stalagmite', 2450]],
    spawns: [
      { mob: 'crystalslime', x: 300, y: 660 }, { mob: 'shade', x: 620, y: 600 }, { mob: 'crystalslime', x: 900, y: 660 },
      { mob: 'rockgolem', x: 1150, y: 590 }, { mob: 'crystalslime', x: 1500, y: 640 }, { mob: 'shade', x: 1750, y: 570 },
      { mob: 'rockgolem', x: 2200, y: 660 }, { mob: 'crystalslime', x: 2450, y: 660 }, { mob: 'crystalslime', x: 230, y: 580 },
      { mob: 'rockgolem', x: 300, y: 500 }, { mob: 'crystalslime', x: 620, y: 520 }, { mob: 'shade', x: 680, y: 440 },
      { mob: 'crystalslime', x: 1130, y: 510 }, { mob: 'shade', x: 1160, y: 430 }, { mob: 'crystalslime', x: 1500, y: 560 },
      { mob: 'rockgolem', x: 1750, y: 490 }, { mob: 'crystalslime', x: 2170, y: 580 }, { mob: 'rockgolem', x: 2400, y: 420 },
    ],
  },

  sky: {
    id: 'sky', name: 'Sky Garden', theme: 'sky', town: 'grove', world: { x: 348, y: 36 },
    width: 2600, height: 700, groundY: 660,
    terrain: [[0, 660], [500, 660], [620, 600], [860, 600], [980, 650], [1200, 650], [1200, 580], [1480, 580], [1600, 640], [1800, 640], [1920, 580], [2160, 580], [2280, 660], [2600, 660]],
    platforms: [
      { x: 140, y: 580, w: 220 },
      { x: 240, y: 500, w: 180 },
      { x: 620, y: 520, w: 220 },
      { x: 680, y: 440, w: 180 },
      { x: 600, y: 360, w: 160 },
      { x: 980, y: 570, w: 200 },
      { x: 1220, y: 500, w: 220 },
      { x: 1280, y: 420, w: 200 },
      { x: 1340, y: 340, w: 160 },
      { x: 1600, y: 560, w: 200 },
      { x: 1930, y: 500, w: 200 },
      { x: 2000, y: 420, w: 180 },
      { x: 2320, y: 580, w: 200 },
      { x: 2380, y: 500, w: 180 },
    ],
    ropes: [{ x: 1190, top: 580, bottom: 650 }],
    portals: [{ id: 'west', x: 40, y: 660, to: 'cave', toPortal: 'east' }],
    npcs: [],
    deco: [['cloudpillar', 420], ['skygazebo', 740], ['cloudpillar', 1100], ['skygazebo', 1340], ['cloudpillar', 2050], ['skygazebo', 2450]],
    spawns: [
      { mob: 'cloudsheep', x: 300, y: 660 }, { mob: 'cloudsheep', x: 740, y: 600 }, { mob: 'starspirit', x: 1100, y: 650 },
      { mob: 'cloudsheep', x: 1340, y: 580 }, { mob: 'windbird', x: 1700, y: 640 }, { mob: 'cloudsheep', x: 2040, y: 580 },
      { mob: 'starspirit', x: 2450, y: 660 }, { mob: 'cloudsheep', x: 250, y: 580 }, { mob: 'windbird', x: 330, y: 500 },
      { mob: 'cloudsheep', x: 730, y: 520 }, { mob: 'windbird', x: 760, y: 440 }, { mob: 'starspirit', x: 680, y: 360 },
      { mob: 'cloudsheep', x: 1320, y: 500 }, { mob: 'windbird', x: 1380, y: 420 }, { mob: 'starspirit', x: 1420, y: 340 },
      { mob: 'cloudsheep', x: 1700, y: 560 }, { mob: 'windbird', x: 2080, y: 420 }, { mob: 'cloudsheep', x: 2420, y: 500 },
    ],
  },

  bossroom: {
    id: 'bossroom', name: 'Crystal Throne', theme: 'cave', town: 'grove', world: { x: 360, y: 186 },
    width: 1200, height: 420, groundY: 380,
    platforms: [
      { x: 150, y: 290, w: 200 },
      { x: 850, y: 290, w: 200 },
    ],
    ropes: [{ x: 250, top: 290, bottom: 380, ladder: true }, { x: 950, top: 290, bottom: 380, ladder: true }],
    portals: [{ id: 'west', x: 60, y: 380, to: 'cave', toPortal: 'boss' }],
    npcs: [],
    deco: [['crystalspire', 420, 1], ['crystalspire', 760, 0]],
    spawns: [{ mob: 'crystalking', x: 560, y: 380, respawn: 300 }],
  },
};

// ---------- The warrior and mage homes, and the canyon road up to the warriors ----------

Object.assign(MAPS, {
  canyon: {
    id: 'canyon', name: 'Windy Canyon', theme: 'crag', town: 'crag', world: { x: 138, y: 104 },
    width: 2200, height: 560, groundY: 520,
    terrain: [[0, 520], [360, 520], [360, 450], [640, 450], [700, 480], [900, 480], [900, 520], [1100, 520], [1100, 440], [1400, 440], [1400, 380], [1600, 380], [1700, 450], [1800, 450], [1800, 520], [2200, 520]],
    platforms: [
      { x: 120, y: 440, w: 200 },
      { x: 400, y: 370, w: 200 },
      { x: 460, y: 290, w: 160 },
      { x: 960, y: 440, w: 120 },
      { x: 1130, y: 360, w: 220 },
      { x: 1200, y: 280, w: 180 },
      { x: 1420, y: 300, w: 160 },
      { x: 1450, y: 220, w: 140 },
      { x: 1840, y: 440, w: 200 },
      { x: 1920, y: 360, w: 180 },
    ],
    ropes: [
      { x: 1090, top: 440, bottom: 520, ladder: true },
      { x: 1530, top: 220, bottom: 300 },
    ],
    portals: [
      { id: 'south', x: 40, y: 520, to: 'meadow1', toPortal: 'north' },
      { id: 'north', x: 2140, y: 520, to: 'crag', toPortal: 'south' },
    ],
    npcs: [],
    deco: [['mesa', 230], ['totem', 520], ['tent', 1000], ['totem', 1260], ['mesa', 1960], ['signpost', 2070]],
    spawns: [
      { mob: 'pebblet', x: 250, y: 520 }, { mob: 'scorpip', x: 500, y: 450 }, { mob: 'pebblet', x: 1000, y: 520 },
      { mob: 'scorpip', x: 1250, y: 440 }, { mob: 'pebblet', x: 1500, y: 380 }, { mob: 'scorpip', x: 2000, y: 520 },
      { mob: 'pebblet', x: 220, y: 440 }, { mob: 'scorpip', x: 500, y: 370 }, { mob: 'pebblet', x: 530, y: 290 },
      { mob: 'pebblet', x: 1240, y: 360 }, { mob: 'scorpip', x: 1290, y: 280 }, { mob: 'scorpip', x: 1500, y: 300 },
      { mob: 'pebblet', x: 1900, y: 440 }, { mob: 'scorpip', x: 2000, y: 360 },
    ],
  },

  crag: {
    id: 'crag', plaza: 760, name: 'Ember Crag', theme: 'crag', isTown: true, town: 'crag', job: 'warrior', world: { x: 196, y: 50 },
    width: 1600, height: 420, groundY: 380,
    platforms: [
      { x: 240, y: 300, w: 220 },
      { x: 1100, y: 300, w: 240 },
    ],
    ropes: [],
    portals: [
      { id: 'start', x: 800, y: 380, hidden: true },
      { id: 'south', x: 60, y: 380, to: 'canyon', toPortal: 'north' },
    ],
    npcs: [{ id: 'brann', x: 520 }, { id: 'tora', x: 1000 }],
    spawns: [],
  },

  grove: {
    id: 'grove', plaza: 790, name: 'Moonleaf Grove', theme: 'grove', isTown: true, town: 'grove', job: 'mage', world: { x: 290, y: 122 },
    width: 1600, height: 420, groundY: 380,
    platforms: [
      { x: 220, y: 300, w: 220 },
      { x: 1140, y: 300, w: 220 },
    ],
    ropes: [],
    portals: [
      { id: 'start', x: 800, y: 380, hidden: true },
      { id: 'west', x: 40, y: 380, to: 'woods', toPortal: 'east' },
      { id: 'east', x: 1540, y: 380, to: 'ruins', toPortal: 'west' },
    ],
    npcs: [{ id: 'elowen', x: 560 }, { id: 'nim', x: 1020 }],
    spawns: [],
  },
});

// Towns in world-map order, for fast travel.
export const TOWNS = ['sprout', 'harbor', 'crag', 'grove'];

export function getMap(id) {
  return MAPS[id] ?? MAPS.sprout;
}

// ---------- Rootwood Hollow: the gate off Windy Canyon, and the dungeon's six rooms ----------
//
// Dungeon rooms (`dungeon` set) hold exactly the monsters listed (no copies, no respawns).
// Monsters sharing a `pack` fight together. A `sealed` portal opens once the room is cleared:
// every monster down and the room's `task` done. `objects` are things to use with Up:
// glowcaps to light, cages to open, and the chest at the end.

const G = 380; // every room's floor
const pack = (id, x, ...mobs) => mobs.map((mob, i) => ({ mob, x: x + (i - (mobs.length - 1) / 2) * 34, y: G, pack: id }));

MAPS.canyon.portals.push({ id: 'hollow', x: 780, y: 480, to: 'hollow_gate', toPortal: 'south', label: 'Rootwood Hollow' });

Object.assign(MAPS, {
  hollow_gate: {
    id: 'hollow_gate', name: 'Hollow Gate', theme: 'forest', town: 'crag', world: { x: 168, y: 132 },
    width: 1200, height: 420, groundY: G,
    terrain: [[0, G], [300, G], [380, G - 40], [560, G - 40], [640, G], [1200, G]],
    platforms: [{ x: 400, y: G - 120, w: 160 }],
    ropes: [],
    deco: [['bigtree', 470, 0], ['giantshroom', 700, 2], ['signpost', 180]],
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
    platforms: [{ x: 640, y: 300, w: 180 }, { x: 1360, y: 300, w: 200 }],
    ropes: [],
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
    platforms: [{ x: 120, y: 300, w: 180 }, { x: 1000, y: 300, w: 180 }],
    ropes: [],
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
    platforms: [{ x: 500, y: 300, w: 200 }, { x: 1180, y: 300, w: 220 }, { x: 1800, y: 300, w: 180 }],
    ropes: [],
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
    ropes: [],
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
    platforms: [{ x: 420, y: 300, w: 200 }, { x: 1100, y: 300, w: 200 }],
    ropes: [],
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
    platforms: [{ x: 140, y: 300, w: 170 }, { x: 560, y: 300, w: 150 }, { x: 900, y: 300, w: 150 }, { x: 1220, y: 300, w: 170 }],
    ropes: [],
    portals: [
      { id: 'west', x: 40, y: G, to: 'hollow5', toPortal: 'east' },
      { id: 'out', x: 1450, y: G, to: 'hollow_gate', toPortal: 'start', label: 'Exit', sealed: true },
    ],
    objects: [{ kind: 'chest', x: 1330, after: 'clear' }],
    npcs: [],
    spawns: [{ mob: 'gnarlroot', x: 860, y: G }],
  },
});
