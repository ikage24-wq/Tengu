// Monster art: the Moonlit Manor's bosses (docs/design/moonlit-manor.md), all live rigs:
//   waltzrondo    Dame Rondo and Dame Minuet, the Mirror Twins (2026-11-28, remade from scratch as twin
//   waltzminuet   ghost ladies on their own copy of the blank bases' maiden: render/twins/)
//   velvet        Madame Velvet, the Head Housekeeper (2026-11-27, remade from scratch on her own copy of
//                 the blank bases' brute: render/velvet/)
//   marigold      Lady Marigold, the Eternal Hostess (2026-11-27, remade from scratch on her own copy of
//                 the blank bases' queen: render/hostess/)

import { VELVET_ART, VELVET_SIZE } from '../velvet/index.js';
import { HOSTESS_ART, HOSTESS_SIZE } from '../hostess/index.js';
import { RONDO_ART, RONDO_SIZE, MINUET_ART, MINUET_SIZE } from '../twins/index.js';

export const ART = {
  waltzrondo: RONDO_ART,
  waltzminuet: MINUET_ART,
  velvet: VELVET_ART,
  marigold: HOSTESS_ART,
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Mirror Twin', w: RONDO_SIZE.w, h: RONDO_SIZE.h },
  waltzminuet: { name: 'Dame Minuet, the Upside-down Twin', w: MINUET_SIZE.w, h: MINUET_SIZE.h },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: VELVET_SIZE.w, h: VELVET_SIZE.h },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: HOSTESS_SIZE.w, h: HOSTESS_SIZE.h },
};
