// Monster art: the Dream Theatre's company (the levels 40-45 group dungeon, see
// docs/design/dream-theatre.md), all live rigs since Chapter 9 (2026-11-19):
//   The Grand Lobby: understudy (Understudy Ghost: the Masquerade Diva, diva/, a little ghost in the
//   leading lady's borrowed gown, on the spirit base, 2026-11-25); stagefolkrigs.js: chorusgirl
//   (Chorus Flamingo, a showgirl with a fan and a can-can kick), stagehand (Stagehand Mole,
//   overalls, a crew headset, a big wrench).
//   The train and the office, the Queen's old life (commuterigs.js): rushpenguin (mob paperdragon),
//   sleepysheep, stickybird (mob prompter), staplercroc (mob primadonna).

import { flamingoRig, flamingoStill, moleRig, moleStill } from './stagefolkrigs.js';
import { DIVA_ART, DIVA_SIZE } from '../diva/index.js';
import { penguinRig, penguinStill, sleepySheepRig, sleepySheepStill, stickyBirdRig, stickyBirdStill, staplerCrocRig, staplerCrocStill } from './commuterigs.js';

export const ART = {
  understudy: DIVA_ART,
  chorusgirl: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 7, atkMs: [70, 230, 180], draw: flamingoStill, rig: flamingoRig },
  stagehand: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 6, atkMs: [90, 260, 190], draw: moleStill, rig: moleRig },
  rushpenguin: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 6, atkMs: [80, 240, 180], draw: penguinStill, rig: penguinRig },
  sleepysheep: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 5, atkMs: [100, 280, 200], draw: sleepySheepStill, rig: sleepySheepRig },
  stickybird: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 5, atkMs: [70, 220, 170], draw: stickyBirdStill, rig: stickyBirdRig },
  staplercroc: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 6, atkMs: [90, 260, 190], draw: staplerCrocStill, rig: staplerCrocRig },
};

export const INFO = {
  understudy: { name: 'Understudy Ghost', ...DIVA_SIZE },
  chorusgirl: { name: 'Chorus Flamingo', w: 24, h: 42 },
  stagehand: { name: 'Stagehand Mole', w: 26, h: 34 },
  rushpenguin: { name: 'Rush-Hour Penguin', w: 26, h: 36 },
  sleepysheep: { name: 'Sleepy Commuter Sheep', w: 28, h: 36 },
  stickybird: { name: 'Sticky Note Bird', w: 24, h: 28 },
  staplercroc: { name: 'Stapler Croc', w: 30, h: 30 },
};
