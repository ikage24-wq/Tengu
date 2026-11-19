// Monster art: the folk of the Sky Whale's Back (the levels 45-50 group dungeon, see
// docs/design/sky-whale.md). All six are live rigs of their own since 2026-11-20 (the player's picks
// from concept sheets); this file just lists them.
//   kiterider       Kite Rider: a duckling in a flying cap hanging under a kite; a diving kick.
//   shepherdess     Cloud Shepherd: a cloud-wool lamb with a crook and a bell, herding three tiny
//                   rain clouds that rush over you and rain.
//   gunner          Sky Pirate Gunner: a seagull pirate in a red tricorn with a brass blunderbuss;
//                   the kick hops it back.
//   barnacleknight  Barnacle Knight: a round penguin in a barnacle-shell helm with a coral-tipped
//                   lance; it flops on its belly and toboggans in, lance first.
//   harpist         Storm Harpist: a little thundercloud with gold bolt horns and a golden harp,
//                   drizzling; it strums and a bolt of lightning snaps out.
//   monk            Feather Monk: a puffin in saffron robes with prayer beads, meditating off the
//                   ground; a palm push that rolls out rings of wind.

import { kiteDuckRig, kiteDuckStill } from './kiteduckrig.js';
import { lambShepherdRig, lambShepherdStill } from './lambshepherdrig.js';
import { gullGunnerRig, gullGunnerStill } from './gullgunnerrig.js';
import { penguinLancerRig, penguinLancerStill } from './penguinlancerrig.js';
import { thundercloudRig, thundercloudStill } from './thundercloudrig.js';
import { puffinMonkRig, puffinMonkStill } from './puffinmonkrig.js';

export const ART = {
  kiterider: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [80, 240, 180], draw: kiteDuckStill, rig: kiteDuckRig },
  shepherdess: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: lambShepherdStill, rig: lambShepherdRig },
  gunner: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: gullGunnerStill, rig: gullGunnerRig },
  barnacleknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 280, 200], draw: penguinLancerStill, rig: penguinLancerRig },
  harpist: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [90, 260, 190], draw: thundercloudStill, rig: thundercloudRig },
  monk: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: puffinMonkStill, rig: puffinMonkRig },
};

export const INFO = {
  kiterider: { name: 'Kite Rider', w: 28, h: 30 },
  shepherdess: { name: 'Cloud Shepherd', w: 26, h: 34 },
  gunner: { name: 'Sky Pirate Gunner', w: 26, h: 34 },
  barnacleknight: { name: 'Barnacle Knight', w: 30, h: 36 },
  harpist: { name: 'Storm Harpist', w: 28, h: 32 },
  monk: { name: 'Feather Monk', w: 26, h: 34 },
};
