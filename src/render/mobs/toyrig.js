// The toy rig (2026-11): the Clockwork Carnival's wind-up toys. The manor rig's skeleton driven by
// clockwork timing: each key pose is reached with a quick tick and a small eased overshoot that
// settles, then held until the next tick (tick... tock...), so the toys move like clockwork
// without ever snapping. A wind-up key turns in every toy's back, a notch per tick.

import { KIT } from './maidens.js';
import { mixPose } from './manorrig.js';

const { opoly, ooval, dot, oband, round, fband, line, lerp } = KIT;

// Back-out easing: past the mark by about 8%, then settling back.
const backOut = (t) => {
  const c = 1.6;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

// The pose at frame f of n: a quick tick into each key over the first `move` of its slot, then held.
export function tickAt(keys, f, n, loop = true, move = 0.5) {
  const m = keys.length;
  const u = (f / n) * (loop ? m : m - 1);
  const i = Math.floor(u) % m;
  const j = loop ? (i + 1) % m : Math.min(m - 1, i + 1);
  const t = u - Math.floor(u);
  return mixPose(keys[i], keys[j], t < move ? backOut(t / move) : 1);
}

// The wind-up key in a toy's back at (x, y): a stem and a two-lobed bow, turned `a` (it reads as a
// turn by showing the bow face-on, edge-on, then face-on again).
export function windKey(x, y, a, c, cDk) {
  const w = Math.abs(Math.cos(a));
  const out = [line([[x, y], [x - 4, y - 1]], 1, cDk)];
  for (const s of [-1, 1]) out.push(...ooval(x - 6, y - 1 + s * 2.6 * w, 1.8, 1.6 * Math.max(0.35, w), c, 0, 0.3));
  out.push(dot(x - 6, y - 1, 0.9, cDk));
  return out;
}

export { opoly, ooval, dot, oband, round, fband, line, lerp };
