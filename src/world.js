// World data: towns, hunting maps, NPCs, and portals.
// Maps are data only; the game loop builds the scene from them.

export const MAPS = {
  town: {
    id: 'town',
    name: 'Henesys Square',
    width: 2400,
    isTown: true,
    spawns: [],
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
    width: 3000,
    isTown: false,
    spawns: [
      { type: 'snail', count: 6, minLevel: 1 },
      { type: 'mushroom', count: 4, minLevel: 6 },
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
    width: 3600,
    isTown: false,
    spawns: [
      { type: 'mushroom', count: 6, minLevel: 8 },
      { type: 'wolf', count: 5, minLevel: 18 },
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
