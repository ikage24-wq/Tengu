// Monster art: the Sky Whale's bosses (docs/design/sky-whale.md). Each was redrawn on 2026-11-19
// (the player's picks) as a rigged character with its own module:
//   gale         Captain Gale: since 2026-11-27 a young sky-pirate captain in a cranberry frock coat
//                and a navy tricorn who makes her own wind with a ship's bellows (render/gale/).
//   matriarch    The Barnacle Matriarch: since 2026-11-27 a grand old walrus dowager in a sea-teal gown
//                and a lace capelet where her barnacle children live (render/matriarch/).
//   whaledream   The Whale's Dream: the Sleepy Sky Whale Pup, the whale's own spirit, a round
//                see-through baby whale with stars inside, in a nightcap, asleep on a cloud
//                (whalerig.js). Since Chapter 10 she sleeps at the brow and isn't fought.
//   whalestorm   The Sulk: the storm cloud of her sadness, the brow's boss since Chapter 10; since
//                2026-11-25 the Blanket Sulk, a sulky spirit wrapped in his storm-cloud duvet
//                (render/sulk/, on the spirit base).

import { GALE_ART, GALE_SIZE } from '../gale/index.js';
import { MATRIARCH_ART, MATRIARCH_SIZE } from '../matriarch/index.js';
import { whaleRig, whaleStill } from './whalerig.js';
import { SULK_ART, SULK_SIZE } from '../sulk/index.js';

export const ART = {
  gale: GALE_ART,
  matriarch: MATRIARCH_ART,
  whaledream: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [110, 180, 340, 240], draw: whaleStill, rig: whaleRig },
  whalestorm: SULK_ART,
};

export const INFO = {
  gale: { name: 'Captain Gale', ...GALE_SIZE },
  matriarch: { name: 'The Barnacle Matriarch', ...MATRIARCH_SIZE },
  whaledream: { name: "The Whale's Dream", w: 90, h: 90 },
  whalestorm: { name: 'The Sulk', ...SULK_SIZE },
};
