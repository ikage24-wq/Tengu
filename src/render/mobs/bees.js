// Monster art: Petal Meadow's hive and clouds. Every one is a live rig of its own now; this file lists
// them.
//   bumble       Puffbee: the Fluffball Bee, a round ball of yellow fuzz with a cream collar and
//                pom-pom antennae; it waggle-dances, and darts at you (fluffbeerig.js, 2026-11-20).
//   petalsprite  Dandelion Puff: the Puff Spirit, a floating dandelion clock with leaf arms and a
//                stem tail; it puffs its cheeks and blows seeds at you (puffspiritrig.js, 2026-11-20).
//   queenbee     The Queen Bee (Petal Meadow's area boss), redrawn 2026-11-19 as the Royal Bumble:
//                her rig is in queenbeerig.js.

import { queenBeeRig, queenBeeStill } from './queenbeerig.js';
import { fluffBeeRig, fluffBeeStill } from './fluffbeerig.js';
import { puffSpiritRig, puffSpiritStill } from './puffspiritrig.js';

export const ART = {
  bumble: { walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [60, 220, 160], draw: fluffBeeStill, rig: fluffBeeRig },
  petalsprite: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 240, 200], draw: puffSpiritStill, rig: puffSpiritRig },
  queenbee: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [120, 420, 200, 240], draw: queenBeeStill, rig: queenBeeRig },
};

export const INFO = {
  bumble: { name: 'Puffbee', w: 24, h: 24 },
  petalsprite: { name: 'Dandelion Puff', w: 22, h: 26 },
  queenbee: { name: 'The Queen Bee', w: 60, h: 64 },
};
