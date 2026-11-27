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
import { NOODLE_ART, NOODLE_SIZE } from '../noodle/index.js';
import { MONDAY_ART, MONDAY_SIZE } from '../monday/index.js';
import { MANAGER_ART, MANAGER_SIZE } from '../manager/index.js';

export const ART = {
  persona: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 320, 220], draw: personaStill, rig: personaRig },
  directrice: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: directriceStill, rig: directriceRig },
  playwright: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 340, 240], draw: playwrightStill, rig: playwrightRig },
  // The Queen's dream's (Chapter 9).
  // (The Night Manager, remade 2026-11-27 from scratch on his own copy of the grown-up base, render/manager/.)
  mugboss: MANAGER_ART,
  // (The Cup-Noodle Dragon, remade 2026-11-27 from scratch on his own copy of the serpent base, render/noodle/.)
  noodledragon: NOODLE_ART,
  // (Monday, remade 2026-11-27 from scratch on her own copy of the kid base, render/monday/.)
  monday: MONDAY_ART,
};

export const INFO = {
  persona: { name: 'Persona, the Two-Faced Muse', w: 60, h: 100 },
  directrice: { name: 'Madame Directrice', w: 64, h: 100 },
  playwright: { name: 'The Phantom Playwright', w: 70, h: 120 },
  mugboss: { name: 'The Night Manager', w: MANAGER_SIZE.w, h: MANAGER_SIZE.h },
  noodledragon: { name: 'The Cup-Noodle Dragon', w: NOODLE_SIZE.w, h: NOODLE_SIZE.h },
  monday: { name: 'Monday', w: MONDAY_SIZE.w, h: MONDAY_SIZE.h },
};
