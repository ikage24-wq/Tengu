// Monster art: the Moonlit Manor's bosses (docs/design/moonlit-manor.md), all live rigs:
//   waltzrondo    Dame Rondo, the Tailcoat Penguin (2026-11-26, on her own copy of the bird base:
//                 render/waltzrondo/)
//   waltzminuet   Dame Minuet, the Upside-down Bat (2026-11-26, on her own copy of the creature
//                 base: render/waltzminuet/)
//   velvet        Madame Velvet, the Head Housekeeper (2026-11-27, remade from scratch on her own copy of
//                 the blank bases' brute: render/velvet/)
//   marigold      Lady Marigold, the Eternal Hostess (2026-11-27, remade from scratch on her own copy of
//                 the blank bases' queen: render/hostess/)

import { VELVET_ART, VELVET_SIZE } from '../velvet/index.js';
import { HOSTESS_ART, HOSTESS_SIZE } from '../hostess/index.js';
import { DAME_RONDO } from '../waltzrondo/penguin.js';
import { DAME_MINUET } from '../waltzminuet/bat.js';

export const ART = {
  waltzrondo: { ...DAME_RONDO.art, noHop: true },
  waltzminuet: { ...DAME_MINUET.art, noHop: true },
  velvet: VELVET_ART,
  marigold: HOSTESS_ART,
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Tailcoat Penguin', w: DAME_RONDO.w, h: DAME_RONDO.h },
  waltzminuet: { name: 'Dame Minuet, the Upside-down Bat', w: DAME_MINUET.w, h: DAME_MINUET.h },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: VELVET_SIZE.w, h: VELVET_SIZE.h },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: HOSTESS_SIZE.w, h: HOSTESS_SIZE.h },
};
