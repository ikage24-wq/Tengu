// Monster art: the Clockwork Carnival's toys (docs/design/clockwork-carnival.md), all live rigs in
// toyrigs.js (remade 2026-11-18 for Chapter 6: upright, chibi, a wind-up key in most of their backs):
//   musicballerina  Music Box Ballerina      balloonseller  Balloon Seller (a balloon poodle)
//   tindrummer      Tin Drummer              jackbox        Jack-in-the-Box
//   marionette      Marionette Dancer        teddystrong    Teddy Strongbear

import { ballerinaRig, ballerinaStill, balloonRig, balloonStill, drummerRig, drummerStill, jackboxRig, jackboxStill, marionetteRig, marionetteStill, teddyRig, teddyStill } from './toyrigs.js';

export const ART = {
  musicballerina: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 220, 180], draw: ballerinaStill, rig: ballerinaRig },
  tindrummer: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 180], draw: drummerStill, rig: drummerRig },
  jackbox: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [70, 240, 180], draw: jackboxStill, rig: jackboxRig },
  marionette: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 170], draw: marionetteStill, rig: marionetteRig },
  teddystrong: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [90, 300, 220], draw: teddyStill, rig: teddyRig },
  balloonseller: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 180], draw: balloonStill, rig: balloonRig },
};
export const INFO = {
  musicballerina: { name: 'Music Box Ballerina', w: 26, h: 38 },
  tindrummer: { name: 'Tin Drummer', w: 26, h: 34 },
  jackbox: { name: 'Jack-in-the-Box', w: 26, h: 44 },
  marionette: { name: 'Marionette Dancer', w: 28, h: 34 },
  teddystrong: { name: 'Teddy Strongbear', w: 36, h: 38 },
  balloonseller: { name: 'Balloon Seller', w: 28, h: 36 },
};
