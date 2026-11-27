// Monster art: the Candy Volcano's bosses (docs/design/candy-volcano.md). Each was redrawn on
// 2026-11-19 (the player's picks) as a rigged character with her own module:
//   toffee   Toffee, the Caramel Smith: redrawn 2026-11-27 from scratch as a caramel salamander smith
//            with a hard-crack caramel hammer and her anvil on her back (render/toffee).
//   gretel   Gretel, the Gingerbread Knight: redrawn 2026-11-27 from scratch as a living gingerbread
//            cookie knight in mint fondant armour, an icing spatula and a heart cookie cutter (render/gretel).
//   bonbon   Queen Bonbon: redrawn 2026-11-25 on the queen base as the Strawberry Shortcake Queen
//            (render/bonbon).

import { TOFFEE_ART, TOFFEE_SIZE } from '../toffee/index.js';
import { GRETEL_ART, GRETEL_SIZE } from '../gretel/index.js';
import { BONBON_ART, BONBON_SIZE } from '../bonbon/index.js';

export const ART = {
  toffee: TOFFEE_ART,
  gretel: GRETEL_ART,
  bonbon: BONBON_ART,
};

export const INFO = {
  toffee: { name: 'Toffee, the Caramel Smith', w: TOFFEE_SIZE.w, h: TOFFEE_SIZE.h },
  gretel: { name: 'Gretel, the Gingerbread Knight', w: GRETEL_SIZE.w, h: GRETEL_SIZE.h },
  bonbon: { name: 'Queen Bonbon', w: 70, h: BONBON_SIZE.h },
};
