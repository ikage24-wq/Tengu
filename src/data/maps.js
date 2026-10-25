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

export const MAPS = {
  sprout: {
    id: 'sprout', name: 'Sprout Village', theme: 'town', isTown: true, town: 'sprout', job: 'archer', world: { x: 66, y: 182 },
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
    width: 2200, height: 480, groundY: 440,
    platforms: [
      { x: 180, y: 360, w: 240 },
      { x: 440, y: 290, w: 200 },
      { x: 820, y: 360, w: 260 },
      { x: 1000, y: 210, w: 200 },
      { x: 1240, y: 290, w: 220 },
      { x: 1540, y: 360, w: 240 },
      { x: 1820, y: 290, w: 200 },
    ],
    ropes: [
      { x: 1100, top: 210, bottom: 440 },
      { x: 1350, top: 290, bottom: 440 },
      { x: 1920, top: 290, bottom: 440 },
    ],
    portals: [
      { id: 'west', x: 40, y: 440, to: 'sprout', toPortal: 'east' },
      { id: 'east', x: 2140, y: 440, to: 'meadow2', toPortal: 'west' },
      { id: 'north', x: 1640, y: 440, to: 'canyon', toPortal: 'south' },
    ],
    npcs: [],
    spawns: [
      { mob: 'puffle', x: 300, y: 440 }, { mob: 'puffle', x: 650, y: 440 }, { mob: 'puffle', x: 980, y: 440 },
      { mob: 'puffle', x: 1350, y: 440 }, { mob: 'puffle', x: 1700, y: 440 }, { mob: 'puffle', x: 2000, y: 440 },
      { mob: 'snailbun', x: 300, y: 360 }, { mob: 'snailbun', x: 620, y: 290 }, { mob: 'snailbun', x: 950, y: 360 },
      { mob: 'snailbun', x: 1350, y: 290 }, { mob: 'snailbun', x: 1660, y: 360 }, { mob: 'snailbun', x: 1920, y: 290 },
      { mob: 'puffle', x: 1100, y: 210 },
    ],
  },

  meadow2: {
    id: 'meadow2', name: 'Clover Hills', theme: 'meadow', town: 'harbor', world: { x: 162, y: 196 },
    width: 2400, height: 520, groundY: 480,
    platforms: [
      { x: 160, y: 400, w: 260 },
      { x: 480, y: 320, w: 220 },
      { x: 780, y: 400, w: 260 },
      { x: 1040, y: 250, w: 240 },
      { x: 1320, y: 330, w: 220 },
      { x: 1500, y: 240, w: 200 },
      { x: 1600, y: 400, w: 260 },
      { x: 1880, y: 320, w: 240 },
    ],
    ropes: [
      { x: 1160, top: 250, bottom: 480 },
      { x: 590, top: 320, bottom: 480 },
      { x: 1430, top: 330, bottom: 480 },
    ],
    portals: [
      { id: 'west', x: 40, y: 480, to: 'meadow1', toPortal: 'east' },
      { id: 'east', x: 2340, y: 480, to: 'harbor', toPortal: 'west' },
    ],
    npcs: [],
    spawns: [
      { mob: 'sproutling', x: 300, y: 480 }, { mob: 'sproutling', x: 900, y: 480 }, { mob: 'sproutling', x: 1500, y: 480 },
      { mob: 'sproutling', x: 2100, y: 480 }, { mob: 'mushkin', x: 650, y: 480 }, { mob: 'mushkin', x: 1250, y: 480 },
      { mob: 'mushkin', x: 1800, y: 480 }, { mob: 'sproutling', x: 290, y: 400 }, { mob: 'mushkin', x: 590, y: 320 },
      { mob: 'sproutling', x: 910, y: 400 }, { mob: 'piglet', x: 1160, y: 250 }, { mob: 'mushkin', x: 1430, y: 330 },
      { mob: 'piglet', x: 1600, y: 240 }, { mob: 'sproutling', x: 1730, y: 400 }, { mob: 'piglet', x: 2000, y: 320 },
    ],
  },

  harbor: {
    id: 'harbor', name: 'Pastel Harbor', theme: 'harbor', isTown: true, town: 'harbor', job: 'thief', world: { x: 222, y: 206 },
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
    platforms: [
      { x: 150, y: 520, w: 300 },
      { x: 520, y: 440, w: 260 },
      { x: 600, y: 290, w: 220 },
      { x: 860, y: 520, w: 300 },
      { x: 1000, y: 360, w: 240 },
      { x: 1300, y: 440, w: 280 },
      { x: 1360, y: 280, w: 220 },
      { x: 1640, y: 520, w: 300 },
      { x: 1720, y: 360, w: 240 },
      { x: 2040, y: 440, w: 260 },
    ],
    ropes: [
      { x: 700, top: 290, bottom: 440 },
      { x: 640, top: 440, bottom: 600 },
      { x: 1100, top: 360, bottom: 600 },
      { x: 1360, top: 440, bottom: 600 },
      { x: 1460, top: 280, bottom: 440 },
      { x: 1820, top: 360, bottom: 600 },
      { x: 2160, top: 440, bottom: 600 },
    ],
    portals: [
      { id: 'west', x: 40, y: 600, to: 'harbor', toPortal: 'east' },
      { id: 'east', x: 2540, y: 600, to: 'grove', toPortal: 'west' },
    ],
    npcs: [],
    spawns: [
      { mob: 'leafling', x: 300, y: 600 }, { mob: 'leafling', x: 800, y: 600 }, { mob: 'leafling', x: 1500, y: 600 },
      { mob: 'leafling', x: 2300, y: 600 }, { mob: 'boarlet', x: 1150, y: 600 }, { mob: 'boarlet', x: 1950, y: 600 },
      { mob: 'leafling', x: 300, y: 520 }, { mob: 'boarlet', x: 650, y: 440 }, { mob: 'leafling', x: 1010, y: 520 },
      { mob: 'mossgolem', x: 1120, y: 360 }, { mob: 'boarlet', x: 1440, y: 440 }, { mob: 'leafling', x: 1790, y: 520 },
      { mob: 'mossgolem', x: 1840, y: 360 }, { mob: 'mossgolem', x: 1470, y: 280 }, { mob: 'boarlet', x: 2170, y: 440 },
      { mob: 'leafling', x: 710, y: 290 },
    ],
  },

  ruins: {
    id: 'ruins', name: 'Twilight Ruins', theme: 'ruins', town: 'grove', world: { x: 322, y: 90 },
    width: 2600, height: 640, groundY: 600,
    platforms: [
      { x: 200, y: 510, w: 280 },
      { x: 560, y: 430, w: 240 },
      { x: 900, y: 510, w: 300 },
      { x: 1050, y: 330, w: 240 },
      { x: 1250, y: 430, w: 260 },
      { x: 1600, y: 510, w: 280 },
      { x: 1700, y: 330, w: 240 },
      { x: 1950, y: 430, w: 260 },
    ],
    ropes: [
      { x: 1150, top: 330, bottom: 510 },
      { x: 1800, top: 330, bottom: 510 },
      { x: 680, top: 430, bottom: 600 },
      { x: 1380, top: 430, bottom: 600 },
      { x: 2080, top: 430, bottom: 600 },
    ],
    portals: [
      { id: 'west', x: 40, y: 600, to: 'grove', toPortal: 'east' },
      { id: 'east', x: 2540, y: 600, to: 'cave', toPortal: 'west' },
    ],
    npcs: [],
    spawns: [
      { mob: 'boneknight', x: 400, y: 600 }, { mob: 'boneknight', x: 1100, y: 600 }, { mob: 'boneknight', x: 1800, y: 600 },
      { mob: 'boneknight', x: 2300, y: 600 }, { mob: 'boneknight', x: 340, y: 510 }, { mob: 'boneknight', x: 1050, y: 510 },
      { mob: 'boneknight', x: 1740, y: 510 }, { mob: 'wisp', x: 700, y: 430 }, { mob: 'wisp', x: 1380, y: 430 },
      { mob: 'wisp', x: 2080, y: 430 }, { mob: 'wisp', x: 1170, y: 330 }, { mob: 'gloombat', x: 500, y: 600 },
      { mob: 'gloombat', x: 1500, y: 600 }, { mob: 'gloombat', x: 2200, y: 600 }, { mob: 'gloombat', x: 1820, y: 330 },
    ],
  },

  cave: {
    id: 'cave', name: 'Crystal Cave', theme: 'cave', town: 'grove', world: { x: 336, y: 148 },
    width: 2600, height: 700, groundY: 660,
    platforms: [
      { x: 180, y: 580, w: 280 },
      { x: 540, y: 500, w: 240 },
      { x: 880, y: 580, w: 300 },
      { x: 1100, y: 400, w: 300 },
      { x: 1180, y: 300, w: 200 },
      { x: 1240, y: 500, w: 260 },
      { x: 1580, y: 580, w: 300 },
      { x: 1940, y: 500, w: 260 },
    ],
    ropes: [
      { x: 1300, top: 400, bottom: 500 },
      { x: 1280, top: 300, bottom: 400 },
      { x: 660, top: 500, bottom: 660 },
      { x: 1440, top: 500, bottom: 660 },
      { x: 2070, top: 500, bottom: 660 },
    ],
    portals: [
      { id: 'west', x: 40, y: 660, to: 'ruins', toPortal: 'east' },
      { id: 'east', x: 2540, y: 660, to: 'sky', toPortal: 'west' },
      { id: 'boss', x: 1220, y: 300, to: 'bossroom', toPortal: 'west', label: 'Throne' },
    ],
    npcs: [],
    spawns: [
      { mob: 'crystalslime', x: 400, y: 660 }, { mob: 'crystalslime', x: 1000, y: 660 }, { mob: 'crystalslime', x: 1700, y: 660 },
      { mob: 'crystalslime', x: 2300, y: 660 }, { mob: 'rockgolem', x: 1300, y: 660 }, { mob: 'rockgolem', x: 2000, y: 660 },
      { mob: 'crystalslime', x: 320, y: 580 }, { mob: 'rockgolem', x: 660, y: 500 }, { mob: 'crystalslime', x: 1030, y: 580 },
      { mob: 'crystalslime', x: 1370, y: 500 }, { mob: 'rockgolem', x: 1730, y: 580 }, { mob: 'crystalslime', x: 2070, y: 500 },
      { mob: 'shade', x: 700, y: 660 }, { mob: 'shade', x: 1500, y: 660 }, { mob: 'shade', x: 2200, y: 660 },
      { mob: 'shade', x: 1250, y: 400 },
    ],
  },

  sky: {
    id: 'sky', name: 'Sky Garden', theme: 'sky', town: 'grove', world: { x: 348, y: 36 },
    width: 2600, height: 700, groundY: 660,
    platforms: [
      { x: 200, y: 570, w: 260 },
      { x: 560, y: 480, w: 240 },
      { x: 760, y: 380, w: 220 },
      { x: 920, y: 570, w: 280 },
      { x: 1280, y: 480, w: 260 },
      { x: 1500, y: 380, w: 220 },
      { x: 1640, y: 570, w: 280 },
      { x: 2000, y: 480, w: 260 },
    ],
    ropes: [
      { x: 780, top: 380, bottom: 480 },
      { x: 1520, top: 380, bottom: 480 },
      { x: 680, top: 480, bottom: 660 },
      { x: 1400, top: 480, bottom: 660 },
      { x: 2130, top: 480, bottom: 660 },
    ],
    portals: [{ id: 'west', x: 40, y: 660, to: 'cave', toPortal: 'east' }],
    npcs: [],
    spawns: [
      { mob: 'cloudsheep', x: 400, y: 660 }, { mob: 'cloudsheep', x: 1100, y: 660 }, { mob: 'cloudsheep', x: 1800, y: 660 },
      { mob: 'cloudsheep', x: 2400, y: 660 }, { mob: 'cloudsheep', x: 330, y: 570 }, { mob: 'cloudsheep', x: 1060, y: 570 },
      { mob: 'cloudsheep', x: 1780, y: 570 }, { mob: 'windbird', x: 680, y: 480 }, { mob: 'windbird', x: 1400, y: 480 },
      { mob: 'windbird', x: 2120, y: 480 }, { mob: 'windbird', x: 870, y: 380 }, { mob: 'starspirit', x: 1610, y: 380 },
      { mob: 'starspirit', x: 2300, y: 660 }, { mob: 'starspirit', x: 1200, y: 660 },
    ],
  },

  bossroom: {
    id: 'bossroom', name: 'Crystal Throne', theme: 'cave', town: 'grove', world: { x: 360, y: 186 },
    width: 1200, height: 420, groundY: 380,
    platforms: [
      { x: 150, y: 290, w: 200 },
      { x: 850, y: 290, w: 200 },
    ],
    ropes: [],
    portals: [{ id: 'west', x: 60, y: 380, to: 'cave', toPortal: 'boss' }],
    npcs: [],
    spawns: [{ mob: 'crystalking', x: 560, y: 380, respawn: 300 }],
  },
};

// ---------- The warrior and mage homes, and the canyon road up to the warriors ----------

Object.assign(MAPS, {
  canyon: {
    id: 'canyon', name: 'Windy Canyon', theme: 'crag', town: 'crag', world: { x: 138, y: 104 },
    width: 2200, height: 520, groundY: 480,
    platforms: [
      { x: 200, y: 400, w: 240 },
      { x: 520, y: 320, w: 220 },
      { x: 820, y: 400, w: 260 },
      { x: 1000, y: 250, w: 220 },
      { x: 1260, y: 330, w: 240 },
      { x: 1560, y: 400, w: 240 },
      { x: 1820, y: 320, w: 220 },
    ],
    ropes: [
      { x: 1100, top: 250, bottom: 480 },
      { x: 620, top: 320, bottom: 480 },
      { x: 1920, top: 320, bottom: 480 },
      { x: 1380, top: 330, bottom: 480 },
    ],
    portals: [
      { id: 'south', x: 40, y: 480, to: 'meadow1', toPortal: 'north' },
      { id: 'north', x: 2140, y: 480, to: 'crag', toPortal: 'south' },
    ],
    npcs: [],
    spawns: [
      { mob: 'mushkin', x: 320, y: 480 }, { mob: 'piglet', x: 760, y: 480 }, { mob: 'mushkin', x: 1200, y: 480 },
      { mob: 'piglet', x: 1650, y: 480 }, { mob: 'boarlet', x: 1950, y: 480 }, { mob: 'piglet', x: 320, y: 400 },
      { mob: 'mushkin', x: 620, y: 320 }, { mob: 'piglet', x: 950, y: 400 }, { mob: 'boarlet', x: 1100, y: 250 },
      { mob: 'piglet', x: 1380, y: 330 }, { mob: 'mushkin', x: 1680, y: 400 }, { mob: 'boarlet', x: 1920, y: 320 },
    ],
  },

  crag: {
    id: 'crag', name: 'Ember Crag', theme: 'crag', isTown: true, town: 'crag', job: 'warrior', world: { x: 196, y: 50 },
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
    id: 'grove', name: 'Moonleaf Grove', theme: 'grove', isTown: true, town: 'grove', job: 'mage', world: { x: 290, y: 122 },
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
