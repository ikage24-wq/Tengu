// Monster art: the Sky Whale's bosses (docs/design/sky-whale.md). Each was redrawn on 2026-11-19
// (the player's picks) as a rigged character with its own module:
//   gale         Captain Gale: the Storm Admiral, a red panda sky-pirate in a sideways bicorne, a
//                sail-cloth cape, her cutlass and spyglass (galerig.js).
//   matriarch    The Barnacle Matriarch: a hermit crab queen in a barnacled whelk shell, a scallop
//                tiara, her coral staff in her big claw (matriarchrig.js).
//   whaledream   The Whale's Dream: the Sleepy Sky Whale Pup, the whale's own spirit, a round
//                see-through baby whale with stars inside, in a nightcap, asleep on a cloud
//                (whalerig.js). Since Chapter 10 she sleeps at the brow and isn't fought.
//   whalestorm   The Sulk: the storm cloud of her sadness, the brow's boss since Chapter 10; since
//                2026-11-25 the Blanket Sulk, a sulky spirit wrapped in his storm-cloud duvet
//                (render/sulk/, on the spirit base).

import { galeRig, galeStill } from './galerig.js';
import { matriarchRig, matriarchStill } from './matriarchrig.js';
import { whaleRig, whaleStill } from './whalerig.js';
import { SULK_ART, SULK_SIZE } from '../sulk/index.js';

export const ART = {
  gale: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: galeStill, rig: galeRig },
  matriarch: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 16, atkMs: [110, 180, 340, 240], draw: matriarchStill, rig: matriarchRig },
  whaledream: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [110, 180, 340, 240], draw: whaleStill, rig: whaleRig },
  whalestorm: SULK_ART,
};

export const INFO = {
  gale: { name: 'Captain Gale', w: 64, h: 100 },
  matriarch: { name: 'The Barnacle Matriarch', w: 80, h: 96 },
  whaledream: { name: "The Whale's Dream", w: 90, h: 90 },
  whalestorm: { name: 'The Sulk', ...SULK_SIZE },
};
