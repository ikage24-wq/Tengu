// Monster art: the Clockwork Carnival's bosses (docs/design/clockwork-carnival.md), all live rigs
// (all three and the Brass Mole redrawn from scratch 2026-11-27, each in its own folder):
//   leonie       Leonie, the Lioness Acrobat (redrawn from scratch 2026-11-27: render/leonie/)
//   marionetta   Madame Marionette (redrawn from scratch 2026-11-27: render/marionetta/)
//   gearheart    Queen Gearheart, the Grand Automaton (redrawn from scratch 2026-11-27: render/gearheart/)
//   gearmole     a Brass Mole, one of hers (render/gearmole/)

import { LEONIE_ART, LEONIE_SIZE } from '../leonie/index.js';
import { MADAME_ART, MADAME_SIZE } from '../marionetta/index.js';
import { GEARHEART_ART, GEARHEART_SIZE } from '../gearheart/index.js';
import { MOLE_ART, MOLE_SIZE } from '../gearmole/index.js';

export const ART = {
  leonie: LEONIE_ART,
  marionetta: MADAME_ART,
  gearheart: GEARHEART_ART,
  gearmole: MOLE_ART,
};

export const INFO = {
  leonie: { name: 'Leonie, the Lioness Acrobat', w: LEONIE_SIZE.w, h: LEONIE_SIZE.h },
  marionetta: { name: 'Madame Marionette', w: MADAME_SIZE.w, h: MADAME_SIZE.h },
  gearheart: { name: 'Queen Gearheart, the Grand Automaton', w: GEARHEART_SIZE.w, h: GEARHEART_SIZE.h },
  gearmole: { name: 'Brass Mole', w: MOLE_SIZE.w, h: MOLE_SIZE.h },
};
