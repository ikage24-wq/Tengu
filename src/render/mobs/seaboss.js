// Monster art: the Sunken Aquarium Palace's bosses (docs/design/aquarium-palace.md), all live rigs
// in seabossrigs.js (remade 2026-11-18 for Chapter 5):
//   moraymurri / morayena  The Twin Morays
//   abyssia                Lady Abyssia, the Sea Witch
//   coralie                Queen Coralie, the Drowned Queen
//   keepsake               a Keepsake Bubble Coralie blows

import { murriRig, enaRig, morayStill, abyssiaRig, abyssiaStill, coralieRig, coralieStill, keepsakeRig, keepsakeStill } from './seabossrigs.js';

export const ART = {
  moraymurri: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: morayStill('murri'), rig: murriRig },
  morayena: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: morayStill('ena'), rig: enaRig },
  abyssia: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [100, 200, 300, 240], draw: abyssiaStill, rig: abyssiaRig },
  coralie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [110, 180, 300, 240], draw: coralieStill, rig: coralieRig },
  keepsake: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [80, 200, 160], draw: keepsakeStill, rig: keepsakeRig },
};

export const INFO = {
  moraymurri: { name: 'Murri, the Twin Moray', w: 56, h: 96 },
  morayena: { name: 'Ena, the Twin Moray', w: 56, h: 96 },
  abyssia: { name: 'Lady Abyssia, the Sea Witch', w: 80, h: 100 },
  coralie: { name: 'Queen Coralie, the Drowned Queen', w: 64, h: 124 },
  keepsake: { name: 'Keepsake Bubble', w: 36, h: 44 },
};
