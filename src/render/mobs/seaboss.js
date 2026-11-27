// Monster art: the Sunken Aquarium Palace's bosses (docs/design/aquarium-palace.md), all live rigs
// (the bubble in seabossrigs.js; remade from scratch 2026-11-26: the Twin Morays as two moray eel sisters,
// render/moray/; Lady Abyssia as a little octopus sea witch, render/abyssia/; Queen Coralie as a young
// mermaid queen in her livery, render/coralie/):
//   moraymurri / morayena  The Twin Morays, Murri and Ena
//   abyssia                Lady Abyssia, the Sea Witch
//   coralie                Queen Coralie, the Drowned Queen
//   keepsake               a Keepsake Bubble Coralie blows

import { MURRI, ENA } from '../moray/index.js';
import { ABYSSIA_ART, ABYSSIA_SIZE } from '../abyssia/index.js';
import { CORALIE_ART, CORALIE_SIZE } from '../coralie/index.js';
import { keepsakeRig, keepsakeStill } from './seabossrigs.js';

export const ART = {
  moraymurri: MURRI.art,
  morayena: ENA.art,
  abyssia: ABYSSIA_ART,
  coralie: CORALIE_ART,
  keepsake: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [80, 200, 160], draw: keepsakeStill, rig: keepsakeRig },
};

export const INFO = {
  moraymurri: { name: 'Murri, the Twin Moray', w: MURRI.w, h: MURRI.h },
  morayena: { name: 'Ena, the Twin Moray', w: ENA.w, h: ENA.h },
  abyssia: { name: 'Lady Abyssia, the Sea Witch', w: ABYSSIA_SIZE.w, h: ABYSSIA_SIZE.h },
  coralie: { name: 'Queen Coralie, the Drowned Queen', w: CORALIE_SIZE.w, h: CORALIE_SIZE.h },
  keepsake: { name: 'Keepsake Bubble', w: 36, h: 44 },
};
