// Monster art: the folk of the Sky Whale's Back (the levels 45-50 group dungeon, see
// docs/design/sky-whale.md), who also live on Starfall Heights. Since 2026-11-27 each is a new creature on its
// own copy of the creature base in its own folder:
//   kiterider       the Sky Seahorse (skyhorse/): a seahorse that swims the sky, a cloud mane, a sunrise belly.
//   shepherdess     the Airbloom Lamb (bloomlamb/): a lamb of the Lung Gardens, air-blooms opening in its fleece.
//   gunner          Blunderpuss (blunderpuss/): Captain Gale's kitten gunner, a blunderbuss loaded with cloud.
//   barnacleknight  the Turtle Squire (turtlesquire/): the Barnacle Matriarch's sea-turtle squire, a scallop shield.
//   harpist         the Stormsong Frog (treefrog/): a tree frog busker in a rain slicker with a storm harp.
//   monk            the Bell-Cap Monk (bellcap/): a mushroom monk whose cap is a temple bell; it rings the whale awake.

import { SKY_SEAHORSE_ART, SKY_SEAHORSE_SIZE } from '../skyhorse/index.js';
import { AIRBLOOM_LAMB_ART, AIRBLOOM_LAMB_SIZE } from '../bloomlamb/index.js';
import { BLUNDERPUSS_ART, BLUNDERPUSS_SIZE } from '../blunderpuss/index.js';
import { TURTLE_SQUIRE_ART, TURTLE_SQUIRE_SIZE } from '../turtlesquire/index.js';
import { STORM_FROG_ART, STORM_FROG_SIZE } from '../treefrog/index.js';
import { BELLCAP_MONK_ART, BELLCAP_MONK_SIZE } from '../bellcap/index.js';

export const ART = {
  kiterider: SKY_SEAHORSE_ART,
  shepherdess: AIRBLOOM_LAMB_ART,
  gunner: BLUNDERPUSS_ART,
  barnacleknight: TURTLE_SQUIRE_ART,
  harpist: STORM_FROG_ART,
  monk: BELLCAP_MONK_ART,
};

export const INFO = {
  kiterider: { name: 'Sky Seahorse', w: SKY_SEAHORSE_SIZE.w, h: SKY_SEAHORSE_SIZE.h },
  shepherdess: { name: 'Airbloom Lamb', w: AIRBLOOM_LAMB_SIZE.w, h: AIRBLOOM_LAMB_SIZE.h },
  gunner: { name: 'Blunderpuss', w: BLUNDERPUSS_SIZE.w, h: BLUNDERPUSS_SIZE.h },
  barnacleknight: { name: 'Turtle Squire', w: TURTLE_SQUIRE_SIZE.w, h: TURTLE_SQUIRE_SIZE.h },
  harpist: { name: 'Stormsong Frog', w: STORM_FROG_SIZE.w, h: STORM_FROG_SIZE.h },
  monk: { name: 'Bell-Cap Monk', w: BELLCAP_MONK_SIZE.w, h: BELLCAP_MONK_SIZE.h },
};
