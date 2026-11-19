// Monster art: the Clockwork Carnival's bosses (docs/design/clockwork-carnival.md), all live rigs
// (redrawn 2026-11-19: leonierig.js, marionetterig.js, gearheartrig.js; the mole in carnivalbossrigs.js):
//   leonie       Leonie, the Lioness Acrobat
//   marionetta   Madame Marionette
//   gearheart    Queen Gearheart, the Grand Automaton
//   gearmole     a Brass Mole from her whack-a-mole

import { leonieRig, leonieStill } from './leonierig.js';
import { marionetteRig as madameRig, marionetteStill as madameStill } from './marionetterig.js';
import { gearheartRig, gearheartStill } from './gearheartrig.js';
import { moleRig, moleStill } from './carnivalbossrigs.js';

export const ART = {
  leonie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 36, atkMs: [90, 160, 280, 220], draw: leonieStill, rig: leonieRig },
  marionetta: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [90, 200, 300, 220], draw: madameStill, rig: madameRig },
  gearheart: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 240], draw: gearheartStill, rig: gearheartRig },
  gearmole: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 200, 160], draw: moleStill, rig: moleRig },
};

export const INFO = {
  leonie: { name: 'Leonie, the Lioness Acrobat', w: 60, h: 100 },
  marionetta: { name: 'Madame Marionette', w: 70, h: 100 },
  gearheart: { name: 'Queen Gearheart, the Grand Automaton', w: 70, h: 120 },
  gearmole: { name: 'Brass Mole', w: 26, h: 26 },
};
