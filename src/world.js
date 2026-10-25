// World data: towns, hunting maps, NPCs, portals, platforms, and mob spawns.
// Maps are data only; the game loop builds the scene from them.
// Platform y is the top surface. A jump from the ground reaches about 100px up.

export const MAPS = {
  town: {
    id: 'town',
    name: 'Henesys Square',
    theme: 'sunset',
    width: 2400,
    isTown: true,
    spawns: [],
    platforms: [
      { x: 260, y: 228, w: 130 },
      { x: 470, y: 184, w: 110 },
      { x: 640, y: 236, w: 140 },
      { x: 860, y: 150, w: 120 },
      { x: 1040, y: 204, w: 150 },
      { x: 1290, y: 250, w: 120 },
      { x: 1480, y: 170, w: 130 },
      { x: 1700, y: 228, w: 150 },
    ],
    npcs: [
      { id: 'shop', name: 'Shopkeeper', x: 400, role: 'shop' },
      { id: 'trainer', name: 'Skill Trainer', x: 1000, role: 'skills' },
      { id: 'smith', name: 'Blacksmith', x: 1600, role: 'upgrade' },
      { id: 'guide', name: 'Guide', x: 2100, role: 'quest' },
    ],
    portals: [
      { x: 2300, to: 'meadow', label: 'Meadow' },
      { x: 60, to: 'forest', label: 'Dark Forest' },
    ],
  },
  meadow: {
    id: 'meadow',
    name: 'Green Meadow',
    theme: 'daylight',
    width: 3000,
    isTown: false,
    platforms: [
      { x: 200, y: 236, w: 140 },
      { x: 420, y: 190, w: 120 },
      { x: 700, y: 232, w: 110 },
      { x: 930, y: 160, w: 150 },
      { x: 1200, y: 220, w: 130 },
      { x: 1500, y: 180, w: 120 },
      { x: 1750, y: 236, w: 150 },
      { x: 2050, y: 150, w: 140 },
      { x: 2300, y: 220, w: 120 },
    ],
    spawns: [
      { type: 'snail', count: 6, minLevel: 1 },
      { type: 'mushroom', count: 4, minLevel: 6, platforms: [1, 3, 5, 7] },
      { type: 'pig', count: 3, minLevel: 3, platforms: [0, 4, 6] },
    ],
    npcs: [],
    portals: [
      { x: 60, to: 'town', label: 'Henesys' },
      { x: 2940, to: 'forest', label: 'Dark Forest' },
    ],
  },
  forest: {
    id: 'forest',
    name: 'Dark Forest',
    theme: 'dusk',
    width: 3600,
    isTown: false,
    platforms: [
      { x: 300, y: 226, w: 130 },
      { x: 520, y: 172, w: 110 },
      { x: 760, y: 228, w: 120 },
      { x: 980, y: 150, w: 140 },
      { x: 1250, y: 224, w: 150 },
      { x: 1540, y: 172, w: 120 },
      { x: 1800, y: 120, w: 150 },
      { x: 2100, y: 226, w: 130 },
    ],
    spawns: [
      { type: 'mushroom', count: 6, minLevel: 8, platforms: [0, 2, 4, 6] },
      { type: 'wolf', count: 5, minLevel: 18 },
      { type: 'skeleton', count: 4, minLevel: 20, platforms: [2, 5, 7] },
      { type: 'golem', count: 2, minLevel: 30 },
    ],
    npcs: [],
    portals: [
      { x: 60, to: 'meadow', label: 'Green Meadow' },
      { x: 3540, to: 'town', label: 'Henesys' },
    ],
  },
};

export const MAP_ORDER = ['town', 'meadow', 'forest'];

export function getMap(id) {
  return MAPS[id] ?? MAPS.town;
}
