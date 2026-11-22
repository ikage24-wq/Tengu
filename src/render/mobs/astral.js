// Monster art: the Star Observatory's sky-folk (the levels 30-35 group dungeon, see
// docs/design/star-observatory.md), all live rigs in astralrigs.js (remade 2026-11-18 for Chapter 7:
// Astraea's thousand-year household, upright and chibi, no bugs):
//   cometcourier   Comet Courier (a sparrow postman)   nebulawitch    Nebula Witch (a cloud puff)
//   starcarto      Telescope Crab                      mothlibrarian  Owl Librarian (an owlet)
//   meteormaiden   Meteor Maiden                       geminighosts   Gemini Ghosts
// (The id mothlibrarian stays so old saves and quest counts keep working.) Also two little star
// helpers the sky bosses draw with.

import { T, TAU, D2R, star } from './critter.js';
import { meteorMaidenRig, meteorMaidenStill } from './meteorrig.js';
import { cometRig, cometStill, nebulaRig, nebulaStill, crabRig, crabStill, owlRig, owlStill, twinsRig, twinsStill } from './astralrigs.js';

// A five-point star.
export function star5(x, y, r, c, deg = -90) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (deg + i * 36) * D2R;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
}
// A few little stars twinkling round a point, on the phase.
export function twinkles(x, y, q, n = 3, rad = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + q * TAU * 0.5;
    const k = 0.5 + 0.5 * Math.sin(q * TAU * 2 + i * 2);
    if (k > 0.25) out.push(...star(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.6, 1.4 * k + 0.4, '#fff6c8'));
  }
  return out;
}

export const ART = {
  cometcourier: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [70, 220, 170], draw: cometStill, rig: cometRig },
  nebulawitch: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: nebulaStill, rig: nebulaRig },
  starcarto: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 170], draw: crabStill, rig: crabRig },
  mothlibrarian: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: owlStill, rig: owlRig },
  // (The Meteor Golem was wiped 2026-11-22; the Meteor Maiden took its place, meteorrig.js.)
  meteormaiden: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 15, atkMs: [80, 300, 260], draw: meteorMaidenStill, rig: meteorMaidenRig },
  geminighosts: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: twinsStill, rig: twinsRig },
};
export const INFO = {
  cometcourier: { name: 'Comet Courier', w: 26, h: 30 },
  nebulawitch: { name: 'Nebula Witch', w: 26, h: 36 },
  starcarto: { name: 'Telescope Crab', w: 32, h: 30 },
  mothlibrarian: { name: 'Owl Librarian', w: 28, h: 34 },
  meteormaiden: { name: 'Meteor Maiden', w: 28, h: 38 },
  geminighosts: { name: 'Gemini Ghosts', w: 32, h: 30 },
};
