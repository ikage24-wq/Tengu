// Class definitions: base stats, per-level growth, and skill trees.
// Skills are data-only here; combat code interprets them.

export const CLASSES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    baseStats: { maxHp: 200, maxMp: 50, atk: 12 },
    growth: { hp: 30, mp: 4, atk: 3 },
    skills: [
      { id: 'slash', name: 'Slash', unlockLevel: 1, mpCost: 5, damageMult: 1.4, cooldown: 0.6, aoe: { w: 90, h: 70 } },
      { id: 'whirlwind', name: 'Whirlwind', unlockLevel: 10, mpCost: 15, damageMult: 1.1, cooldown: 3, aoe: { w: 200, h: 120 } },
      { id: 'earthquake', name: 'Earthquake', unlockLevel: 25, mpCost: 30, damageMult: 2.2, cooldown: 8, aoe: { w: 360, h: 140 } },
    ],
  },
  mage: {
    id: 'mage',
    name: 'Mage',
    baseStats: { maxHp: 120, maxMp: 150, atk: 9 },
    growth: { hp: 14, mp: 12, atk: 4 },
    skills: [
      { id: 'magicBolt', name: 'Magic Bolt', unlockLevel: 1, mpCost: 6, damageMult: 1.5, cooldown: 0.5, aoe: { w: 60, h: 60 } },
      { id: 'flameBurst', name: 'Flame Burst', unlockLevel: 10, mpCost: 20, damageMult: 1.2, cooldown: 4, aoe: { w: 240, h: 200 } },
      { id: 'thunderStorm', name: 'Thunder Storm', unlockLevel: 25, mpCost: 40, damageMult: 2.5, cooldown: 10, aoe: { w: 420, h: 260 } },
    ],
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    baseStats: { maxHp: 150, maxMp: 90, atk: 11 },
    growth: { hp: 20, mp: 7, atk: 4 },
    skills: [
      { id: 'arrow', name: 'Arrow', unlockLevel: 1, mpCost: 4, damageMult: 1.3, cooldown: 0.4, aoe: { w: 80, h: 40 } },
      { id: 'arrowRain', name: 'Arrow Rain', unlockLevel: 10, mpCost: 18, damageMult: 1.0, cooldown: 3.5, aoe: { w: 320, h: 180 } },
      { id: 'stormArrow', name: 'Storm Arrow', unlockLevel: 25, mpCost: 35, damageMult: 2.0, cooldown: 9, aoe: { w: 480, h: 220 } },
    ],
  },
};
