// The astral rig (2026-11): the Star Observatory's sky-folk. The manor rig's skeleton, drifting on a
// slow figure-eight instead of walking, with orbiters: little moons, stars, pages or pebbles circling
// on a tilted ring that passes behind the body and then in front of it, so each monster carries its
// own small sky with it.

import { KIT } from './maidens.js';

const { TAU } = KIT;

// Things in orbit round (cx, cy): n of them on an ellipse rx by ry tilted by `tilt`, turned by `ph`.
// `draw(x, y, k, i)` draws one (k is its depth, 0 far to 1 near, for size and shade). Returns
// { back, front }: the ones behind the body and the ones in front.
export function orbit(cx, cy, n, rx, ry, tilt, ph, draw) {
  const back = [];
  const front = [];
  for (let i = 0; i < n; i++) {
    const a = ph + (i / n) * TAU;
    const ox = Math.cos(a) * rx;
    const oy = Math.sin(a) * ry;
    const x = cx + ox * Math.cos(tilt) - oy * Math.sin(tilt);
    const y = cy + ox * Math.sin(tilt) + oy * Math.cos(tilt);
    const k = 0.5 + 0.5 * Math.sin(a);
    (Math.sin(a) < 0 ? back : front).push(...draw(x, y, k, i));
  }
  return { back, front };
}

// The drift: a slow figure-eight for the hips, on the creature's own clock.
export const drift = (f, n, ax = 1.4, ay = 1.2) => {
  const t = (f / n) * TAU;
  return [Math.sin(t) * ax, Math.sin(t * 2) * ay];
};

// A five-point star.
export function star5(x, y, r, c, a = 0) {
  return KIT.opoly(Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const t = a + (i * Math.PI) / 5 - Math.PI / 2;
    return [x + Math.cos(t) * rr, y + Math.sin(t) * rr];
  }), c, 0.3);
}
