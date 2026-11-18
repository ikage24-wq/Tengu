// Monster art: the Clockwork Carnival's toys (docs/design/clockwork-carnival.md), all live rigs in
// toyrigs.js (remade 2026-11-18 for Chapter 6: upright, chibi, a wind-up key in most of their backs):
//   musicballerina  Music Box Ballerina      balloonseller  Balloon Seller (a balloon poodle)
//   tindrummer      Tin Drummer              jackbox        Jack-in-the-Box
//   marionette      Marionette Dancer        teddystrong    Teddy Strongbear

import { E, R, F, TAU } from './critter.js';
import { ballerinaRig, ballerinaStill, balloonRig, balloonStill, drummerRig, drummerStill, jackboxRig, jackboxStill, marionetteRig, marionetteStill, teddyRig, teddyStill } from './toyrigs.js';

// A wind-up key seen from the side, turning (q, 0..1): Queen Gearheart's (toyboss.js).
export function windKey(x, y, q, k = 1, dir = -1) {
  const w = Math.abs(Math.cos(q * TAU * 2)) * 4 * k + 0.8 * k;
  const brass = '#e8b84a';
  return [
    R(x + dir * 3 * k - (dir < 0 ? 0 : 0), y - 0.8 * k, 3 * k * -dir, 1.6 * k, '#c8902a'),
    E(x + dir * 4 * k, y - 2.6 * k, w * 0.6, 2.4 * k, brass), E(x + dir * 4 * k, y + 2.6 * k, w * 0.6, 2.4 * k, brass),
    F(E(x + dir * 4 * k, y - 2.6 * k, Math.max(0.3, w * 0.25), 1 * k, '#fff0b8')), E(x + dir * 4 * k, y, 1.1 * k, 1.1 * k, '#c8902a'),
  ];
}

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
