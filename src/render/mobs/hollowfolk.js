// Monster art: Rootwood Hollow (the levels 10-15 group dungeon). All of its monsters were remade from
// scratch for Chapter 3 (2026-11-18) as live rigs; this file only lists them. The great tree was woken
// in the night and everything in it is sleepy and grumpy about it.
//   rootling      Root Imp: a peach root bulb with a sprout; waddles; burrows (hollowrigs.js)
//   sporecap      Myconid Shaman: droopy violet cap, tall glowing staff; Sleepy Spores (hollowrigs.js)
//   thornback     Bramble Bear: an upright cub in a bramble hood and cape; Bramble Roll (hollowrigs.js)
//   sporeling     Spore Mite: a pink puffball (hollowrigs.js)
//   mothercapper  The Myconid Queen: pink cap, crown, babies napping on her brim (hollowbossrigs.js)
//   tuskar        Tuskar: an upright boar gate guard in an acorn helmet (hollowbossrigs.js)
//   gnarlroot     Gnarlroot, the oldest tree, Elder Yomogi tangled in his roots (gnarlrig.js)
//   sapling       Root Tendril: a root curled up out of the floor, holding Yomogi (gnarlrig.js)

import { rootlingRig, rootlingStill, sporecapRig, sporecapStill, thornbackRig, thornbackStill, sporelingRig, sporelingStill } from './hollowrigs.js';
import { queenRig, queenStill, tuskarRig, tuskarStill } from './hollowbossrigs.js';
import { gnarlRig, gnarlStill, tendrilRig, tendrilStill } from './gnarlrig.js';

export const ART = {
  rootling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [45, 190, 140], draw: rootlingStill, rig: rootlingRig },
  sporecap: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [65, 250, 190], draw: sporecapStill, rig: sporecapRig },
  thornback: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [70, 310, 230], draw: thornbackStill, rig: thornbackRig },
  sporeling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [40, 170, 120], draw: sporelingStill, rig: sporelingRig },
  sapling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 240, 180], draw: tendrilStill, rig: tendrilRig },
  mothercapper: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [80, 150, 420, 220], draw: queenStill, rig: queenRig },
  tuskar: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 24, atkMs: [70, 150, 380, 220], draw: tuskarStill, rig: tuskarRig },
  gnarlroot: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 22, atkMs: [90, 160, 520, 260], draw: gnarlStill, rig: gnarlRig },
};

export const INFO = {
  rootling: { name: 'Root Imp', w: 22, h: 30 },
  sporecap: { name: 'Myconid Shaman', w: 26, h: 34 },
  thornback: { name: 'Bramble Bear', w: 36, h: 48 },
  sporeling: { name: 'Spore Mite', w: 18, h: 14 },
  sapling: { name: 'Root Tendril', w: 18, h: 50 },
  mothercapper: { name: 'Myconid Queen', w: 80, h: 100 },
  tuskar: { name: 'Tuskar the Behemoth', w: 84, h: 100 },
  gnarlroot: { name: 'Gnarlroot, the Oldest Tree', w: 120, h: 150 },
};
