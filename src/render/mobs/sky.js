// Monster art: sky. The Sky Garden's creatures. Since 2026-11-27 each is a new creature on its own copy
// of a base in its own folder:
//   cloudsheep  the Snowpuff Hare (snowhare/): a snow-white hare whose winter coat comes in as cloud, a
//               cloud ruff and a cloud tail; it turns its ears into the wind and nibbles cloud like clover.
//   windbird    the Windsock Albatross (albatross/): a chibi albatross in a knitted windsock cap that
//               glides the roost's winds; it stoops on you, buffets you with a wingbeat and clacks its bill.
//   starspirit  the Comet Goldfish (goldfish/): a plump fancy goldfish swimming the night sky, its long
//               double tail streaming like a comet's; it snacks on falling stars and blows wish bubbles.

import { SNOWPUFF_HARE_ART, SNOWPUFF_HARE_SIZE } from '../snowhare/index.js';
import { WINDSOCK_ALBATROSS_ART, WINDSOCK_ALBATROSS_SIZE } from '../albatross/index.js';
import { COMET_GOLDFISH_ART, COMET_GOLDFISH_SIZE } from '../goldfish/index.js';

export const ART = {
  cloudsheep: SNOWPUFF_HARE_ART,
  windbird: WINDSOCK_ALBATROSS_ART,
  starspirit: COMET_GOLDFISH_ART,
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  cloudsheep: { name: 'Snowpuff Hare', w: SNOWPUFF_HARE_SIZE.w, h: SNOWPUFF_HARE_SIZE.h },
  windbird: { name: 'Windsock Albatross', w: WINDSOCK_ALBATROSS_SIZE.w, h: WINDSOCK_ALBATROSS_SIZE.h },
  starspirit: { name: 'Comet Goldfish', w: COMET_GOLDFISH_SIZE.w, h: COMET_GOLDFISH_SIZE.h },
};
