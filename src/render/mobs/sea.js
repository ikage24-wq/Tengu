// Monster art: the Sunken Aquarium Palace's regulars (the levels 20-25 group dungeon, see
// docs/design/aquarium-palace.md). Remade from scratch on 2026-11-26 as Queen Coralie's palace
// household, each a different real sea creature with a palace job, each on its own copy of a blank
// base in its own folder, each wearing one small piece of the queen's livery (coral pink with a
// pearl); Lady Abyssia's lamplighters carry her violet instead. (The 2026-11-18 rigs, searigs.js:
// Jelly Belle, Seahorse Squire, Lantern Angler, Pearl Otter, Star Twirler and Octo Scholar, are gone.)
//   jellymaid      the Sea Bunny Bellhop: a fluffy sea bunny slug in a bellhop cap, runs the bubble lifts
//   stardancer     the Sea Angel: a soprano of the palace choir, a glowing heart and a bubble halo
//   pearldiver     the Beluga Lifeguard: on duty at the bottom of the sea, throws bubble rings
//   seahorseknight the Sailfish Fencer: the guard's fencing master, his rounded bill his épée
//   anglerlamp     the Dumbo Lamplighter: Lady Abyssia's little lamplighter, scared of the dark
//   octoscholar    the Axolotl Librarian: shushes, stamps OVERDUE, throws paper boats

import { SEA_BUNNY } from '../seabunny/index.js';
import { SEA_ANGEL } from '../seaangel/index.js';
import { BELUGA_LIFEGUARD } from '../beluga/index.js';
import { SAILFISH_FENCER } from '../sailfish/index.js';
import { DUMBO } from '../dumbo/index.js';
import { AXOLOTL_LIBRARIAN } from '../axolotl/index.js';

export const ART = {
  jellymaid: SEA_BUNNY.art,
  stardancer: SEA_ANGEL.art,
  pearldiver: BELUGA_LIFEGUARD.art,
  seahorseknight: SAILFISH_FENCER.art,
  anglerlamp: DUMBO.art,
  octoscholar: AXOLOTL_LIBRARIAN.art,
};

export const INFO = {
  jellymaid: { name: 'Sea Bunny Bellhop', w: 30, h: 25 },
  stardancer: { name: 'Sea Angel', w: 24, h: 38 },
  pearldiver: { name: 'Beluga Lifeguard', w: 35, h: 25 },
  seahorseknight: { name: 'Sailfish Fencer', w: 34, h: 23 },
  anglerlamp: { name: 'Dumbo Lamplighter', w: 28, h: 34 },
  octoscholar: { name: 'Axolotl Librarian', w: AXOLOTL_LIBRARIAN.size.w, h: AXOLOTL_LIBRARIAN.size.h },
};
