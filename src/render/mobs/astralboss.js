// Monster art: the Star Observatory's bosses (docs/design/star-observatory.md), all live rigs in
// starbossrigs.js (remade 2026-11-18 for Chapter 7):
//   folio        Folio, the Archivist (a snowy owl)
//   eclipsesol   Sol, the Eclipse Twin (a sun fox)
//   eclipseluna  Luna, the Eclipse Twin (a moon bunny)
//   astraea      Astraea, the Star Keeper (an upright moon-fawn in a night-sky gown)
//   starpoint    a wandering star from her constellation fight

import { astraeaRig, astraeaStill, starRig, starStill } from './starbossrigs.js';
import { solRig, solStill, lunaRig, lunaStill } from './twinsrig.js';
import { folioRig, folioStill } from './foliorig.js';

export const ART = {
  folio: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 240], draw: folioStill, rig: folioRig },
  eclipsesol: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 300, 220], draw: solStill, rig: solRig },
  eclipseluna: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 300, 220], draw: lunaStill, rig: lunaRig },
  astraea: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 320, 240], draw: astraeaStill, rig: astraeaRig },
  starpoint: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 200, 160], draw: starStill, rig: starRig },
};

export const INFO = {
  folio: { name: 'Folio, the Archivist', w: 70, h: 96 },
  eclipsesol: { name: 'Sol, the Eclipse Twin', w: 60, h: 90 },
  eclipseluna: { name: 'Luna, the Eclipse Twin', w: 60, h: 90 },
  astraea: { name: 'Astraea, the Star Keeper', w: 80, h: 130 },
  starpoint: { name: 'Wandering Star', w: 22, h: 22 },
};
