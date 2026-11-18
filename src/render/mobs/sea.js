// Monster art: the Sunken Aquarium Palace's swimmers (the levels 20-25 group dungeon, see
// docs/design/aquarium-palace.md). All remade from scratch as live rigs for Chapter 5 (2026-11-18):
// render/mobs/searigs.js has them all.
//   jellymaid      Jelly Belle: a round pink jelly bell with a face and a flower, ribbon tentacles
//   seahorseknight Seahorse Squire: a chubby seahorse in a plumed helmet with a little lance
//   anglerlamp     Lantern Angler: a round little anglerfish with a glowing lure (Lady Abyssia's)
//   pearldiver     Pearl Otter: an otter in a glass bubble helmet hugging a big pearl
//   stardancer     Star Twirler: a starfish with a bow, skipping on tiptoe
//   octoscholar    Octo Scholar: an octopus in glasses and a mortarboard with a book

import { jellyRig, jellyStill, seahorseRig, seahorseStill, anglerRig, anglerStill, otterRig, otterStill, starRig, starStill, octoRig, octoStill } from './searigs.js';

export const ART = {
  jellymaid: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: jellyStill, rig: jellyRig },
  seahorseknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 190], draw: seahorseStill, rig: seahorseRig },
  anglerlamp: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 210, 170], draw: anglerStill, rig: anglerRig },
  pearldiver: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [80, 210, 170], draw: otterStill, rig: otterRig },
  stardancer: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 180, 170], draw: starStill, rig: starRig },
  octoscholar: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 220, 180], draw: octoStill, rig: octoRig },
};

export const INFO = {
  jellymaid: { name: 'Jelly Belle', w: 26, h: 34 },
  seahorseknight: { name: 'Seahorse Squire', w: 26, h: 42 },
  anglerlamp: { name: 'Lantern Angler', w: 34, h: 30 },
  pearldiver: { name: 'Pearl Otter', w: 26, h: 34 },
  stardancer: { name: 'Star Twirler', w: 26, h: 32 },
  octoscholar: { name: 'Octo Scholar', w: 30, h: 34 },
};
