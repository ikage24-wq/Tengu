// Monster art: the Dream Theatre's bosses (docs/design/dream-theatre.md). Each was redrawn on
// 2026-11-19 (the player's picks) as a rigged character with its own module, each standing in its
// own spotlight:
//   persona      Persona, the Two-Faced Muse: the Ballet Muse, a cat ballerina split gold and
//                blue, her masks held as fans (personarig.js).
//   directrice   Madame Directrice: the Golden-Age Star, a cockatoo director with a cape, her
//                brass megaphone and baton (directricerig.js).
//   playwright   The Phantom Playwright: the Masked Author, a pale phantom gentleman in a half-mask,
//                top hat and tailcoat, his giant quill held like a rapier (playwrightrig.js).

import { personaRig, personaStill } from './personarig.js';
import { directriceRig, directriceStill } from './directricerig.js';
import { playwrightRig, playwrightStill } from './playwrightrig.js';
import { noodleRig, noodleStill, mondayRig, mondayStill } from './dreamrigs.js';
import { nightManagerRig, nightManagerStill } from './nightmanagerrig.js';

export const ART = {
  persona: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 320, 220], draw: personaStill, rig: personaRig },
  directrice: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: directriceStill, rig: directriceRig },
  playwright: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 340, 240], draw: playwrightStill, rig: playwrightRig },
  // The Queen's dream's (Chapter 9: dreamrigs.js).
  // (The Night Manager, 2026-11-22: the Coffee Mug Boss redrawn as a human, her manager.)
  mugboss: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: nightManagerStill, rig: nightManagerRig },
  noodledragon: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: noodleStill, rig: noodleRig },
  monday: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 340, 240], draw: mondayStill, rig: mondayRig },
};

export const INFO = {
  persona: { name: 'Persona, the Two-Faced Muse', w: 60, h: 100 },
  directrice: { name: 'Madame Directrice', w: 64, h: 100 },
  playwright: { name: 'The Phantom Playwright', w: 70, h: 120 },
  mugboss: { name: 'The Night Manager', w: 64, h: 100 },
  noodledragon: { name: 'The Cup-Noodle Dragon', w: 64, h: 110 },
  monday: { name: 'Monday', w: 80, h: 140 },
};
