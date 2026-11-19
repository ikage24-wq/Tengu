// The Clockwork Carnival's Brass Mole (the three bosses were redrawn 2026-11-19 and live in their
// own modules: leonierig.js, marionetterig.js, gearheartrig.js).

import { E, F, R } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, clamp } from './rig.js';
import { D2R, pairOf, put, shift } from './rigkit.js';

// =====================================================================================
// A Brass Mole (Queen Gearheart's whack-a-mole)
// =====================================================================================
// A little brass mole toy in goggles that pops up out of a hole in the plaza (render/carnival.js
// draws the hole), looks about, and ducks back down; whack it while it's up.
const MOLE = ramp('#e8b84a', { step: 10, turn: 8 });
const mo = pairOf('mo');
const moleBody = () => [
  E(9, 13, 8.4, 9, MOLE.base), crescent(9, 13, 8.4, 9, MOLE.sh, { k: 0.2, a0: 100, a1: 220 }), shine(9, 13, 8.4, 9, '#ffffff', 0, 0.9),
  E(15.4, 12, 3.4, 2.6, '#ffe0c8'), E(18, 11.4, 1.8, 1.5, '#ff7a9a'), F(E(17.6, 11, 0.6, 0.5, '#ffffff')),
  R(3, 6.4, 13, 2, '#6a5a8a'), E(8, 7.4, 2.8, 2.4, '#9fe6f6'), E(13.4, 7.4, 2.6, 2.2, '#9fe6f6'), F(E(7.4, 6.8, 0.8, 0.7, '#ffffff')), F(E(12.8, 6.8, 0.8, 0.7, '#ffffff')),
  E(4, 3.6, 2.4, 2.2, MOLE.sh), F(E(4, 3.8, 1.2, 1, '#ffd0a0')),
];
const molePaw = () => [E(3, 2, 3, 2, MOLE.base), ...[0, 1, 2].map((k) => F(E(1.4 + k * 1.6, 3.4, 0.6, 0.5, '#fff2d0')))];
const MOLE_B = mo('body', 18, 22, moleBody, 6);
const MOLE_P = mo('paw', 6, 4, molePaw, 2);
// How far up out of its hole it is (0..1): up in 0.3 s, down in its last 0.3 s.
const moleUp = (m, now) => {
  if (m.hp <= 0) return 0;
  const age = now - (m.popAt ?? now - 1);
  const life = m.popLife ?? 4.2;
  return Math.min(clamp(age / 0.3, 0, 1), clamp((life - age) / 0.3, 0, 1));
};
export const moleRig = makeRig({
  w: 30,
  h: 34,
  soft: true,
  stride: 10,
  springs: { up: [300, 16], look: [160, 9] },
  pose(m, a) {
    return { up: moleUp(m, a.now) * 17, look: Math.sin(a.t * 3 + m.uid) * 10 };
  },
  parts: [
    { name: 'root', parent: null, at: (S) => [0, 17 - S.up] },
    { name: 'pawF', parent: 'root', s: MOLE_P[0], pivot: [3, 2], at: () => [-6, -15], when: (a, S) => S.up > 12 },
    // (Only what's up out of the hole shows: the body is cut off at the floor.)
    { name: 'body', parent: 'root', s: MOLE_B[0], pivot: [9, 18], rot: (S) => S.look * D2R, clip: (a, S) => [-14, -26, 32, 26 - (17 - S.up)] },
    { name: 'bodyb', parent: 'root', s: MOLE_B[1], pivot: [9, 18], rot: (S) => S.look * D2R, clip: (a, S) => [-14, -26, 32, 26 - (17 - S.up)] },
    { name: 'pawN', parent: 'root', s: MOLE_P[1], pivot: [3, 2], at: () => [6, -15], when: (a, S) => S.up > 12 },
  ],
});
export function moleStill() {
  return { w: 24, h: 24, res: 3, shapes: shift([...put(moleBody(), [9, 18], 0, 0)], 12, 23) };
}
