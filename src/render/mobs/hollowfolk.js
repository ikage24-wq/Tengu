// Monster art: Rootwood Hollow (the levels 10-15 group dungeon). All of its monsters were remade from
// scratch for Chapter 3 (2026-11-18) as live rigs; this file only lists them. The great tree was woken
// in the night and everything in it is sleepy and grumpy about it.
//   rootling      Root Imp: a peach root bulb with a sprout; waddles; burrows (hollowrigs.js)
//   sporecap      Myconid Shaman: droopy violet cap, tall glowing staff; Sleepy Spores (hollowrigs.js)
//   thornback     Bramble Bear: an upright cub in a bramble hood and cape; Bramble Roll (hollowrigs.js)
//   sporeling     Spore Mite: the Puffball Mouse, a fluffy cream mouse with a mushroom sprouting from
//                 its crown and a puffball tail; sneezes spores (sporemiterig.js, 2026-11-24)
//   mothercapper  The Myconid Queen: the Puffball Granny, a round puffball in a lace bonnet and a
//                 pink shawl, a root cane and a basket of baby puffballs (myconidrig.js, 2026-11-19)
//   tuskar        Tuskar: the Sumo Champ, an upright boar wrestler in a moss belt with a topknot
//                 (tuskarrig.js, 2026-11-19)
//   gnarlroot     Gnarlroot: Old Mossbeard, a huge gentle treeherd on the brute base: a canopy of leaves
//                 for hair, knothole eyes glowing amber, a long moss beard; Elder Yomogi in his roots
//                 (render/gnarlroot/, 2026-11-25)
//   sapling       Root Tendril: the Rootling Dryad, a dreamy dryad on the serpent base whose lower body
//                 is a living root along the floor (render/dryad/, 2026-11-24); she's also the
//   leafling      field monster Rootling Dryad: the same rig, with her vine lash, petal gust and root snare

import { rootlingRig, rootlingStill, sporecapRig, sporecapStill, thornbackRig, thornbackStill } from './hollowrigs.js';
import { SPORE_MITE } from './sporemiterig.js';
import { tuskarRig, tuskarStill } from './tuskarrig.js';
import { myconidRig, myconidStill } from './myconidrig.js';
import { DRYAD_ART, DRYAD_SIZE } from '../dryad/index.js';
import { GNARL_ART } from '../gnarlroot/index.js';

export const ART = {
  rootling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [45, 190, 140], draw: rootlingStill, rig: rootlingRig },
  sporecap: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [65, 250, 190], draw: sporecapStill, rig: sporecapRig },
  thornback: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [70, 310, 230], draw: thornbackStill, rig: thornbackRig },
  sporeling: SPORE_MITE.art,
  sapling: DRYAD_ART,
  leafling: DRYAD_ART,
  mothercapper: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 16, atkMs: [80, 150, 420, 220], draw: myconidStill, rig: myconidRig },
  tuskar: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 18, atkMs: [70, 150, 380, 220], draw: tuskarStill, rig: tuskarRig },
  gnarlroot: GNARL_ART,
};

export const INFO = {
  rootling: { name: 'Root Imp', w: 22, h: 30 },
  sporecap: { name: 'Myconid Shaman', w: 26, h: 34 },
  thornback: { name: 'Bramble Bear', w: 36, h: 48 },
  sporeling: { name: 'Spore Mite', w: SPORE_MITE.w, h: SPORE_MITE.h },
  sapling: { name: 'Root Tendril', w: DRYAD_SIZE.w, h: DRYAD_SIZE.h },
  leafling: { name: 'Rootling Dryad', w: DRYAD_SIZE.w, h: DRYAD_SIZE.h },
  mothercapper: { name: 'Myconid Queen', w: 80, h: 100 },
  tuskar: { name: 'Tuskar the Behemoth', w: 84, h: 100 },
  gnarlroot: { name: 'Gnarlroot, the Oldest Tree', w: 120, h: 150 },
};
