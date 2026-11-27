// Monster art: the Tanuki Tea Terraces (the player's pick, 2026-11-10). Every one is a live rig of its
// own now (the last two since 2026-11-20, the player's picks from concept sheets); this file lists them.
//   tanukipicker  Tanuki Picker: on his contracted tea break, on the creature base (render/tanuki/,
//                 2026-11-25): a headband, a towel, a pocketed apron, a thermos, a big steaming teacup.
//   kettletanuki  Kettle Tanuki: the terraces' own Bunbuku, a tanuki stuck halfway into a copper tea
//                 kettle he wears like a barrel, its lid for a hat (2026-11-26, rebuilt from scratch on
//                 his own copy of the creature base: render/kettletanuki/).
//   lantertanuki  Lantern Tanuki: the terraces' night watchman, a big-bellied tanuki in a straw hat
//                 and an open indigo happi coat who walks the Mist Hollow with a paper lantern on a
//                 bamboo pole (2026-11-26, rebuilt from scratch on his own copy of the creature base:
//                 render/lantertanuki/).
//   grandkettle   The Grand Kettle, the terraces' area boss and Sencha's old master, the Tea Ceremony
//                 Master: a big round formal old tanuki in kimono, haori and hakama, who swings a huge
//                 iron kettle (2026-11-26, rebuilt from scratch on his own copy of the creature base:
//                 render/grandkettle/; his fight, world/grandkettle.js).

import { GRAND_KETTLE_ART, GRAND_KETTLE_SIZE } from '../grandkettle/index.js';
import { KETTLE_TANUKI_ART, KETTLE_TANUKI_SIZE } from '../kettletanuki/index.js';
import { TANUKI_ART } from '../tanuki/index.js';
import { LANTERN_TANUKI_ART, LANTERN_TANUKI_SIZE } from '../lantertanuki/index.js';

export const ART = {
  tanukipicker: TANUKI_ART,
  kettletanuki: KETTLE_TANUKI_ART,
  lantertanuki: LANTERN_TANUKI_ART,
  grandkettle: GRAND_KETTLE_ART,
};

export const INFO = {
  tanukipicker: { name: 'Tanuki Picker', w: 26, h: 34 },
  kettletanuki: { name: 'Kettle Tanuki', w: KETTLE_TANUKI_SIZE.w, h: KETTLE_TANUKI_SIZE.h },
  lantertanuki: { name: 'Lantern Tanuki', w: LANTERN_TANUKI_SIZE.w, h: LANTERN_TANUKI_SIZE.h },
  grandkettle: { name: 'The Grand Kettle', w: GRAND_KETTLE_SIZE.w, h: GRAND_KETTLE_SIZE.h },
};
