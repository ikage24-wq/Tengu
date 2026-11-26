// Monster art: Petal Meadow's hive and clouds. Every one is a live rig of its own now; this file lists
// them.
//   bumble       Puffbee: the Pollen Post, a courier bee in a blue post cap with a satchel of pollen
//                letters; it reads addresses, gets lost with its map, flicks letters at you like
//                paper planes (on its own copy of the round bug base, render/puffbee/, 2026-11-25).
//   petalsprite  Dandelion Puff: the Seed Scout, a little explorer in a fluffy dandelion-clock hood
//                and cloak, drifting under a seed parachute; she puffs her cheeks and blows seeds at
//                you (seedscoutrig.js, on the blank kid base, 2026-11-24).
//   queenbee     The Queen Bee (Petal Meadow's area boss): Little Queen Honeybun, a toddler queen in a
//                bee-onesie hood ruling from a flying honey pot, with a honey-swirl lollipop for a
//                sceptre; her Royal Tantrum slam, her Royal Honey Bomb (on her own copy of the kid
//                base, render/queenbee/, 2026-11-25).

import { QUEENBEE_ART, QUEENBEE_SIZE } from '../queenbee/index.js';
import { PUFFBEE } from '../puffbee/index.js';
import { seedScoutRig, seedScoutStill } from './seedscoutrig.js';

export const ART = {
  // (Remade 2026-11-25 on the round bug base: the Pollen Post, render/puffbee/.)
  bumble: PUFFBEE.art,
  // (noHop: no little happy hops from the monster drawer: her drift and her rig carry all her motion)
  petalsprite: { pad: 4, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 240, 200], draw: seedScoutStill, rig: seedScoutRig, noHop: true },
  // (Remade 2026-11-25 on the kid base: Little Queen Honeybun, render/queenbee/.)
  queenbee: QUEENBEE_ART,
};

export const INFO = {
  bumble: { name: 'Puffbee', w: PUFFBEE.w, h: PUFFBEE.h },
  petalsprite: { name: 'Dandelion Puff', w: 24, h: 42 },
  queenbee: { name: 'The Queen Bee', w: QUEENBEE_SIZE.w, h: QUEENBEE_SIZE.h },
};
