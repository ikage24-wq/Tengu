// Monster art: the Star Observatory's bosses (docs/design/star-observatory.md), each a live rig in its
// own folder (all three remade 2026-11-27 for Chapter 7):
//   folio        Folio, the Archivist (remade 2026-11-27 from scratch on her own copy of the winged
//                base: a prim young snowy owl of a librarian, render/folio/)
//   eclipsesol   Sol, the Eclipse Twin   } remade 2026-11-27 from scratch on their own copies of the maiden
//   eclipseluna  Luna, the Eclipse Twin  } base: a fox-eared sun girl and a rabbit-eared moon girl, render/eclipse/
//   astraea      Astraea, the Star Keeper (remade 2026-11-27 from scratch on her own copy of the maiden
//                base: a small, gentle star keeper in a night-sky cloak with her star abacus, render/astraea/)

import { SOL_ART, SOL_SIZE, LUNA_ART, LUNA_SIZE } from '../eclipse/index.js';
import { FOLIO_ART, FOLIO_SIZE } from '../folio/index.js';
import { ASTRAEA_ART, ASTRAEA_SIZE } from '../astraea/index.js';

export const ART = {
  folio: FOLIO_ART,
  eclipsesol: SOL_ART,
  eclipseluna: LUNA_ART,
  astraea: ASTRAEA_ART,
};

export const INFO = {
  folio: { name: 'Folio, the Archivist', w: FOLIO_SIZE.w, h: FOLIO_SIZE.h },
  eclipsesol: { name: 'Sol, the Eclipse Twin', w: SOL_SIZE.w, h: SOL_SIZE.h },
  eclipseluna: { name: 'Luna, the Eclipse Twin', w: LUNA_SIZE.w, h: LUNA_SIZE.h },
  astraea: { name: 'Astraea, the Star Keeper', w: ASTRAEA_SIZE.w, h: ASTRAEA_SIZE.h },
};
