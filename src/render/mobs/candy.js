// Monster art: the Candy Volcano's regulars (the levels 35-40 group dungeon, see
// docs/design/candy-volcano.md), Queen Bonbon's sweet country, remade from scratch on 2026-11-27 as new
// creatures, each on its own copy of a blank base (the old sweet rigs retired):
//   gummybear     Strawberry Calf (a strawberry-milk calf with a gumdrop cowbell; render/calf/)
//   cottoncandy   Floss Chinchilla (a chinchilla whose fur is spun sugar; render/chinchilla/)
//   lollipopwitch Swirl Chameleon (a chameleon with a swirl lollipop for a tail; render/chameleon/)
//   peppermint    Mint Wrapper (a kid still in their sweet wrapper, on the kid base, 2026-11-25,
//                 rebuilt where it fell short 2026-11-27; render/mintwrap/)
//   chocoknight   Bonbon Ladybug (a chocolate bonbon shell, pink icing, a cherry on top; render/bonbonbug/)
//   jellyninja    Gummy Caterpillar (a caterpillar of fruit gummies, slurps licorice; render/gummypillar/)
// (The old ids stay so old saves and quest counts keep working.)

import { MINT_ART, MINT_SIZE } from '../mintwrap/index.js';
import { STRAWBERRY_CALF_ART, STRAWBERRY_CALF_SIZE } from '../calf/index.js';
import { FLOSS_CHINCHILLA_ART, FLOSS_CHINCHILLA_SIZE } from '../chinchilla/index.js';
import { SWIRL_CHAMELEON_ART, SWIRL_CHAMELEON_SIZE } from '../chameleon/index.js';
import { BONBON_LADYBUG_ART, BONBON_LADYBUG_SIZE } from '../bonbonbug/index.js';
import { GUMMY_CATERPILLAR_ART, GUMMY_CATERPILLAR_SIZE } from '../gummypillar/index.js';

export const ART = {
  gummybear: STRAWBERRY_CALF_ART,
  cottoncandy: FLOSS_CHINCHILLA_ART,
  lollipopwitch: SWIRL_CHAMELEON_ART,
  peppermint: MINT_ART,
  chocoknight: BONBON_LADYBUG_ART,
  jellyninja: GUMMY_CATERPILLAR_ART,
};

export const INFO = {
  gummybear: { name: 'Strawberry Calf', w: STRAWBERRY_CALF_SIZE.w, h: STRAWBERRY_CALF_SIZE.h },
  cottoncandy: { name: 'Floss Chinchilla', w: FLOSS_CHINCHILLA_SIZE.w, h: FLOSS_CHINCHILLA_SIZE.h },
  lollipopwitch: { name: 'Swirl Chameleon', w: SWIRL_CHAMELEON_SIZE.w, h: SWIRL_CHAMELEON_SIZE.h },
  peppermint: { name: 'Mint Wrapper', ...MINT_SIZE },
  chocoknight: { name: 'Bonbon Ladybug', w: BONBON_LADYBUG_SIZE.w, h: BONBON_LADYBUG_SIZE.h },
  jellyninja: { name: 'Gummy Caterpillar', w: GUMMY_CATERPILLAR_SIZE.w, h: GUMMY_CATERPILLAR_SIZE.h },
};
