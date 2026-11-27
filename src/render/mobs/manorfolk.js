// Monster art: the Moonlit Manor's residents (the levels 15-20 group dungeon, see
// docs/design/moonlit-manor.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign:
// chibi creatures with their own silhouettes; the old costumed girls on the manor rig are retired,
// the rig itself stays for the other dungeons that still use it).
//   porcelaindoll  Porcelain Doll: Pinsworth, a crimson velvet pincushion in a china thimble who fences
//                  with a sewing needle, on its own copy of the veggie base (render/porcelaindoll/, 2026-11-26)
//   ghostmaid      Ghost Maid: Lacey, a moon-jelly parlourmaid whose frilled bell is her lace mob cap, a
//                  feather duster and a silver service bell in her ribbon arms, on her own copy of the
//                  jellyfish (render/ghostmaid/, 2026-11-26)
//   candlebride    Candle Bride: the Candelabra Bride, a gothic bride in black lace with a brass
//                  candelabra, on the maiden base; she thrusts it and throws a flame (render/bride/, 2026-11-24)
//   topiarydryad   Topiary Hedgehog: Topsy, a round little hedgehog whose prickles are a clipped box
//                  hedge, a rose tucked in the top; rolls about like a topiary ball, on his own copy of the
//                  rodent base (render/topiarydryad/, 2026-11-26)
//   lanternghost   Lantern Wisp: the Lamplighter Wisp, a little ghost lamplighter with her pole and
//                  lantern, on the spirit base (render/wisp/, 2026-11-24)
//   teahatter      Teacup Hermit: Pemberton, a rose-pink hermit crab living in a porcelain teacup, a
//                  monocle and a curly moustache, on his own copy of the crab base (render/teahatter/, 2026-11-26)
//   pumpkinbutler  Basset Butler: Humphrey, Lady Marigold's red-and-white basset hound butler, a silver
//                  tray and cloche (a pumpkin tart under it), on his own copy of the creature base
//                  (render/pumpkinbutler/, 2026-11-26)
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { WISP_ART, WISP_SIZE } from '../wisp/index.js';
import { BRIDE_ART, BRIDE_SIZE } from '../bride/index.js';
import { PORCELAIN_DOLL } from '../porcelaindoll/index.js';
import { GHOST_MAID } from '../ghostmaid/index.js';
import { TOPIARY_HEDGEHOG } from '../topiarydryad/index.js';
import { TEACUP_HERMIT } from '../teahatter/index.js';
import { BUTLER_ART, BUTLER_SIZE } from '../pumpkinbutler/index.js';

export const ART = {
  porcelaindoll: PORCELAIN_DOLL.art,
  ghostmaid: GHOST_MAID.art,
  candlebride: BRIDE_ART,
  topiarydryad: TOPIARY_HEDGEHOG.art,
  lanternghost: WISP_ART,
  teahatter: TEACUP_HERMIT.art,
  pumpkinbutler: BUTLER_ART,
};

export const INFO = {
  porcelaindoll: { name: 'Porcelain Doll', w: PORCELAIN_DOLL.w, h: PORCELAIN_DOLL.h },
  ghostmaid: { name: 'Ghost Maid', w: GHOST_MAID.w, h: GHOST_MAID.h },
  candlebride: { name: 'Candle Bride', ...BRIDE_SIZE },
  topiarydryad: { name: 'Topiary Hedgehog', w: TOPIARY_HEDGEHOG.w, h: TOPIARY_HEDGEHOG.h },
  lanternghost: { name: 'Lantern Wisp', ...WISP_SIZE },
  teahatter: { name: 'Teacup Hermit', w: TEACUP_HERMIT.w, h: TEACUP_HERMIT.h },
  pumpkinbutler: { name: 'Basset Butler', w: BUTLER_SIZE.w, h: BUTLER_SIZE.h },
};
