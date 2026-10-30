// Endless Fox-Fire's wheel of fox fire (kitsunebi): wisps of blue fox fire circling the Kitsune at
// chest height while she holds the barrage, more of them, wider and faster the further it builds
// (two, four, six, then nine), rising with her when she floats. From the Wheel stage on, her stars
// peel off the wisp swinging round toward the monsters (world/melee.js fire), so the same positions
// are used here for that and by the drawing (render/scene.js drawFoxWheel). The Beastmaster's gale
// of leaves (Wild Hunt) turns on the same wheel, at her feet's height (`float` false: she doesn't rise).

import { streamHover } from '../render/moves.js';

// The wheel at `t` seconds into the barrage: how many wisps, its radii, the height of its middle
// above her feet, and how fast it turns (radians a second).
export function wheelShape(heat, t, float = true) {
  const k = Math.min(1, heat / 1.6);
  const rx = 14 + 14 * k;
  return { n: heat < 0.45 ? 2 : heat < 0.9 ? 4 : heat < 1.25 ? 6 : 9, rx, ry: rx * 0.32, cy: -15 - (float ? streamHover(heat, t) : 0), spin: Math.PI * 2 * (0.45 + 1.4 * k) };
}

// The wisps, as offsets from her feet: { x, y, a (angle), front (passing in front of her), i }.
// They come round the front toward `facing`.
export function wheelWisps(heat, t, facing = 1, float = true) {
  const { n, rx, ry, cy, spin } = wheelShape(heat, t, float);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = -spin * t + (i / n) * Math.PI * 2;
    out.push({ x: facing * Math.cos(a) * rx, y: cy + Math.sin(a) * ry, a, front: Math.sin(a) > 0, i });
  }
  return out;
}

// The wisp a star leaves from: the one furthest round toward the monsters.
export const launchWisp = (heat, t, facing, float = true) => wheelWisps(heat, t, facing, float).reduce((best, w) => (w.x * facing > best.x * facing ? w : best));
