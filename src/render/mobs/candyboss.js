// Monster art: the Candy Volcano's bosses (docs/design/candy-volcano.md). Each was redrawn on
// 2026-11-19 (the player's picks) as a rigged character with her own module:
//   toffee   Toffee, the Caramel Smith: the Master Smith, a beaver in a leather apron (toffeerig.js).
//   gretel   Gretel, the Gingerbread Knight: the Peppermint Lancer (gretelrig.js).
//   bonbon   Queen Bonbon: the Walking Cake, three tiers on stubby legs (bonbonrig.js).

import { toffeeRig, toffeeStill } from './toffeerig.js';
import { gretelRig, gretelStill } from './gretelrig.js';
import { bonbonRig, bonbonStill } from './bonbonrig.js';

export const ART = {
  toffee: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [110, 180, 340, 240], draw: toffeeStill, rig: toffeeRig },
  gretel: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: gretelStill, rig: gretelRig },
  bonbon: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [110, 180, 340, 240], draw: bonbonStill, rig: bonbonRig },
};

export const INFO = {
  toffee: { name: 'Toffee, the Caramel Smith', w: 70, h: 100 },
  gretel: { name: 'Gretel, the Gingerbread Knight', w: 64, h: 100 },
  bonbon: { name: 'Queen Bonbon', w: 80, h: 110 },
};
