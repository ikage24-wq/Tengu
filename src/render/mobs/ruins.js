// Monster art: Twilight Ruins and Crystal Cave. Every one is a live rig of its own now (all six remade
// 2026-11-20, the player's picks from concept sheets); this file lists them.
//   acolyte       Ruin Acolyte: a floating hooded temple girl with a censer and a wisp living in it
//                 (2026-11-22, replaced the Will-o'-Wisp; acolyterig.js).
//   gargoyle      Gargoyle Kid: an impish little gargoyle with stone wings, horns and tail, who turns to
//                 stone for fun (2026-11-22, replaced the Imp; gargoylerig.js).
//   boneknight    Dullahan: the Kitten in the Armour, a ginger kitten driving an empty suit of armour.
//   crystalslime  Gem Mimic: a Treasure Mimic, a wooden chest with gems on its lid and little feet.
//   rockgolem     Crystal Golem: an Amethyst Owl, a stone owl golem with crystal ear tufts and a
//                 geode in its belly; it slams its stone wings down.
//   shade         Wraith: a Shadow Bunny, a hand-shadow rabbit come to life, playing in the Shade
//                 Spires; it lunges and bites with a glowing mouth.

import { kittenArmourRig, kittenArmourStill } from './kittenarmourrig.js';
import { acolyteRig, acolyteStill } from './acolyterig.js';
import { gargoyleRig, gargoyleStill } from './gargoylerig.js';
import { treasureMimicRig, treasureMimicStill } from './treasuremimicrig.js';
import { amethystOwlRig, amethystOwlStill } from './amethystowlrig.js';
import { shadowBunnyRig, shadowBunnyStill } from './shadowbunnyrig.js';

// Every design flies or walks with its own cadence: `stride` is how far it travels per cycle.
export const ART = {
  acolyte: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 40, atkMs: [80, 300, 260], draw: acolyteStill, rig: acolyteRig },
  gargoyle: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 40, atkMs: [80, 300, 260], draw: gargoyleStill, rig: gargoyleRig },
  boneknight: { pad: 17, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 270, 200], draw: kittenArmourStill, rig: kittenArmourRig },
  crystalslime: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [55, 240, 170], draw: treasureMimicStill, rig: treasureMimicRig },
  rockgolem: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [75, 330, 240], draw: amethystOwlStill, rig: amethystOwlRig },
  shade: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 58, atkMs: [60, 230, 180], draw: shadowBunnyStill, rig: shadowBunnyRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  acolyte: { name: 'Ruin Acolyte', w: 26, h: 40 },
  gargoyle: { name: 'Gargoyle Kid', w: 28, h: 38 },
  boneknight: { name: 'Dullahan', w: 26, h: 46 },
  crystalslime: { name: 'Gem Mimic', w: 28, h: 24 },
  rockgolem: { name: 'Crystal Golem', w: 46, h: 60 },
  shade: { name: 'Wraith', w: 26, h: 40 },
};
