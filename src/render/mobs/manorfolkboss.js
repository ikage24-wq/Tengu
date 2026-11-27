// Monster art: the Moonlit Manor's bosses (docs/design/moonlit-manor.md), all live rigs:
//   waltzrondo    Dame Rondo, the Tailcoat Penguin (2026-11-26, on her own copy of the bird base:
//                 render/waltzrondo/)
//   waltzminuet   Dame Minuet, the Upside-down Bat (2026-11-26, on her own copy of the creature
//                 base: render/waltzminuet/)
//   velvet        Madame Velvet, the Head Housekeeper (manorbossrigs.js)
//   marigold      Lady Marigold, the Eternal Hostess (2026-11-26, a ghost hostess on her own copy of the
//                 spirit base: render/marigold/)

import { velvetRig, velvetStill } from './manorbossrigs.js';
import { MARIGOLD_ART, MARIGOLD_SIZE } from '../marigold/index.js';
import { DAME_RONDO } from '../waltzrondo/penguin.js';
import { DAME_MINUET } from '../waltzminuet/bat.js';

export const ART = {
  waltzrondo: { ...DAME_RONDO.art, noHop: true },
  waltzminuet: { ...DAME_MINUET.art, noHop: true },
  velvet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: velvetStill, rig: velvetRig },
  marigold: MARIGOLD_ART,
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Tailcoat Penguin', w: DAME_RONDO.w, h: DAME_RONDO.h },
  waltzminuet: { name: 'Dame Minuet, the Upside-down Bat', w: DAME_MINUET.w, h: DAME_MINUET.h },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: 70, h: 100 },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: MARIGOLD_SIZE.w, h: MARIGOLD_SIZE.h },
};
