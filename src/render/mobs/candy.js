// Monster art: the Candy Volcano's regulars (the levels 35-40 group dungeon, see
// docs/design/candy-volcano.md), Queen Bonbon's sweet country, remade from scratch on 2026-11-27 as new
// creatures, each on its own copy of a blank base (the old sweet rigs retired):
//   gummybear     Strawberry Calf (a strawberry-milk calf with a gumdrop cowbell; render/calf/)
//   cottoncandy   Floss Chinchilla (a chinchilla whose fur is spun sugar; render/chinchilla/)
//   lollipopwitch Swirl Chameleon (a chameleon with a swirl lollipop for a tail; render/chameleon/)
//   peppermint    Mint Wrapper (a kid still in their sweet wrapper, on the kid base, 2026-11-25,
//                 rebuilt where it fell short 2026-11-27; render/mintwrap/)
//   chocoknight   Cocoa Badger (the Licorice Mine's digger with a candle on its helmet; render/badger/)
//   jellyninja    Jelly Bean Meerkat (the mine's lookout with a slingshot; render/meerkat/)
// (The old ids stay so old saves and quest counts keep working.)

import { MINT_ART, MINT_SIZE } from '../mintwrap/index.js';
import { STRAWBERRY_CALF_ART, STRAWBERRY_CALF_SIZE } from '../calf/index.js';
import { FLOSS_CHINCHILLA_ART, FLOSS_CHINCHILLA_SIZE } from '../chinchilla/index.js';
import { SWIRL_CHAMELEON_ART, SWIRL_CHAMELEON_SIZE } from '../chameleon/index.js';
import { COCOA_BADGER_ART, COCOA_BADGER_SIZE } from '../badger/index.js';
import { JELLY_MEERKAT_ART, JELLY_MEERKAT_SIZE } from '../meerkat/index.js';

export const ART = {
  gummybear: STRAWBERRY_CALF_ART,
  cottoncandy: FLOSS_CHINCHILLA_ART,
  lollipopwitch: SWIRL_CHAMELEON_ART,
  peppermint: MINT_ART,
  chocoknight: COCOA_BADGER_ART,
  jellyninja: JELLY_MEERKAT_ART,
};

export const INFO = {
  gummybear: { name: 'Strawberry Calf', w: STRAWBERRY_CALF_SIZE.w, h: STRAWBERRY_CALF_SIZE.h },
  cottoncandy: { name: 'Floss Chinchilla', w: FLOSS_CHINCHILLA_SIZE.w, h: FLOSS_CHINCHILLA_SIZE.h },
  lollipopwitch: { name: 'Swirl Chameleon', w: SWIRL_CHAMELEON_SIZE.w, h: SWIRL_CHAMELEON_SIZE.h },
  peppermint: { name: 'Mint Wrapper', ...MINT_SIZE },
  chocoknight: { name: 'Cocoa Badger', w: COCOA_BADGER_SIZE.w, h: COCOA_BADGER_SIZE.h },
  jellyninja: { name: 'Jelly Bean Meerkat', w: JELLY_MEERKAT_SIZE.w, h: JELLY_MEERKAT_SIZE.h },
};
