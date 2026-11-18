// Monster art: the Moonlit Manor's bosses (docs/design/moonlit-manor.md), all live rigs in
// manorbossrigs.js (remade 2026-11-18 for Chapter 4):
//   waltzrondo    Dame Rondo, the Leading Armour
//   waltzminuet   Dame Minuet, the Following Armour
//   velvet        Madame Velvet, the Head Housekeeper
//   marigold      Lady Marigold, the Eternal Hostess

import { rondoRig, rondoStill, minuetRig, minuetStill, velvetRig, velvetStill, marigoldRig, marigoldStill } from './manorbossrigs.js';

export const ART = {
  waltzrondo: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 160, 300, 220], draw: rondoStill, rig: rondoRig },
  waltzminuet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 200, 300, 220], draw: minuetStill, rig: minuetRig },
  velvet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: velvetStill, rig: velvetRig },
  marigold: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 180, 340, 240], draw: marigoldStill, rig: marigoldRig },
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Leading Armour', w: 60, h: 104 },
  waltzminuet: { name: 'Dame Minuet, the Following Armour', w: 70, h: 104 },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: 70, h: 100 },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: 70, h: 110 },
};
