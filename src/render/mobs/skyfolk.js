// Monster art: the folk of the Sky Whale's Back (the levels 45-50 group dungeon, see
// docs/design/sky-whale.md), who also live on Starfall Heights. Since 2026-11-27 each is a new creature on its
// own copy of the creature base in its own folder:
//   kiterider       the Kite Pika (pika/): a pika in a flight jacket, a paper diamond kite strapped to its back.
//   shepherdess     the Cloudherd Samoyed (samoyed/): a sheepdog pup in a smock who herds one small cloud.
//   gunner          Blunderpuss (blunderpuss/): Captain Gale's kitten gunner, a blunderbuss loaded with cloud.
//   barnacleknight  the Turtle Squire (turtlesquire/): the Barnacle Matriarch's sea-turtle squire, a scallop shield.
//   harpist         the Stormsong Frog (treefrog/): a tree frog busker in a rain slicker with a storm harp.
//   monk            the Mantra Lemur (lemur/): a ring-tailed lemur monk with a singing bowl.

import { KITE_PIKA_ART, KITE_PIKA_SIZE } from '../pika/index.js';
import { CLOUD_SAMOYED_ART, CLOUD_SAMOYED_SIZE } from '../samoyed/index.js';
import { BLUNDERPUSS_ART, BLUNDERPUSS_SIZE } from '../blunderpuss/index.js';
import { TURTLE_SQUIRE_ART, TURTLE_SQUIRE_SIZE } from '../turtlesquire/index.js';
import { STORM_FROG_ART, STORM_FROG_SIZE } from '../treefrog/index.js';
import { MANTRA_LEMUR_ART, MANTRA_LEMUR_SIZE } from '../lemur/index.js';

export const ART = {
  kiterider: KITE_PIKA_ART,
  shepherdess: CLOUD_SAMOYED_ART,
  gunner: BLUNDERPUSS_ART,
  barnacleknight: TURTLE_SQUIRE_ART,
  harpist: STORM_FROG_ART,
  monk: MANTRA_LEMUR_ART,
};

export const INFO = {
  kiterider: { name: 'Kite Pika', w: KITE_PIKA_SIZE.w, h: KITE_PIKA_SIZE.h },
  shepherdess: { name: 'Cloudherd Samoyed', w: CLOUD_SAMOYED_SIZE.w, h: CLOUD_SAMOYED_SIZE.h },
  gunner: { name: 'Blunderpuss', w: BLUNDERPUSS_SIZE.w, h: BLUNDERPUSS_SIZE.h },
  barnacleknight: { name: 'Turtle Squire', w: TURTLE_SQUIRE_SIZE.w, h: TURTLE_SQUIRE_SIZE.h },
  harpist: { name: 'Stormsong Frog', w: STORM_FROG_SIZE.w, h: STORM_FROG_SIZE.h },
  monk: { name: 'Mantra Lemur', w: MANTRA_LEMUR_SIZE.w, h: MANTRA_LEMUR_SIZE.h },
};
