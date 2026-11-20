// Monster art: sky. The Sky Garden's creatures, all three live rigs of their own since 2026-11-20 (the
// player's picks from concept sheets); this file just lists them.
//   cloudsheep  Pegasus Foal: a chibi cream foal with a pastel mane, little white wings and cloud
//               hooves; it grazes, hops, and rears up to kick.
//   windbird    Sky Harpy: a swift courier in a green postie cap with a satchel of letters; it loops
//               the loop and dive-bombs you in a flurry of letters.
//   starspirit  Star Seraph: a sky jellyfish of starlight with a halo and stardust ribbons; it pulses
//               and sends a shower of little stars.

import { pegasusFoalRig, pegasusFoalStill } from './pegasusfoalrig.js';
import { swiftCourierRig, swiftCourierStill } from './swiftcourierrig.js';
import { starJellyRig, starJellyStill } from './starjellyrig.js';

export const ART = {
  cloudsheep: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [60, 250, 180], draw: pegasusFoalStill, rig: pegasusFoalRig },
  windbird: { walk: 8, idle: 6, attack: 4, stride: 45, atkMs: [45, 200, 140], draw: swiftCourierStill, rig: swiftCourierRig },
  starspirit: { walk: 8, idle: 6, attack: 4, stride: 60, atkMs: [60, 240, 180], draw: starJellyStill, rig: starJellyRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  cloudsheep: { name: 'Pegasus Foal', w: 40, h: 32 },
  windbird: { name: 'Sky Harpy', w: 36, h: 30 },
  starspirit: { name: 'Star Seraph', w: 34, h: 36 },
};
