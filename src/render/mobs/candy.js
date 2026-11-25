// Monster art: the Candy Volcano's sweets-folk (the levels 35-40 group dungeon, see
// docs/design/candy-volcano.md), all live rigs in sweetrigs.js (remade from scratch 2026-11-19 for
// Chapter 8: Queen Bonbon's bakery household, upright and chibi):
//   gummybear     Gummy Bear Brawler (a see-through gummy cub in boxing gloves)
//   cottoncandy   Cotton Candy Sheep (a lamb in a cloud of floss)
//   lollipopwitch Lollipop Witch (a lemon drop with a swirl-lollipop staff)
//   peppermint    Peppermint Spinner: the Mint Wrapper (mintwrap/, a kid still in their sweet
//                 wrapper, on the kid base, 2026-11-25)
//   chocoknight   Chocolate Knight (a chocolate bar with a wafer sword and a cookie shield)
//   jellyninja    Jelly Bean Ninja (a jelly bean in a headband, four flavours)

import { gummyRig, gummyStill, sheepRig, sheepStill, witchRig, witchStill, knightRig, knightStill, ninjaRig, ninjaStill } from './sweetrigs.js';
import { MINT_ART, MINT_SIZE } from '../mintwrap/index.js';

export const ART = {
  gummybear: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: gummyStill, rig: gummyRig },
  cottoncandy: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: sheepStill, rig: sheepRig },
  lollipopwitch: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 240, 180], draw: witchStill, rig: witchRig },
  peppermint: MINT_ART,
  chocoknight: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 300, 220], draw: knightStill, rig: knightRig },
  jellyninja: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [60, 210, 160], draw: ninjaStill, rig: ninjaRig },
};

export const INFO = {
  gummybear: { name: 'Gummy Bear Brawler', w: 24, h: 34 },
  cottoncandy: { name: 'Cotton Candy Sheep', w: 30, h: 30 },
  lollipopwitch: { name: 'Lollipop Witch', w: 24, h: 36 },
  peppermint: { name: 'Peppermint Spinner', ...MINT_SIZE },
  chocoknight: { name: 'Chocolate Knight', w: 26, h: 36 },
  jellyninja: { name: 'Jelly Bean Ninja', w: 24, h: 34 },
};
