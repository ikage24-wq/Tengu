// The sky rig (2026-11): the Sky Whale's folk, built for the wind. Everyone stands in a steady wind
// from ahead (they face right, so it blows from the right), with gusts riding on it: hair, scarves,
// sashes, cloth and feathers stream back and ripple. Poses glide key to key with a long ease and a
// float that carries on between them (nothing snaps), and wind lines and wisps pass under the feet.

import { KIT } from './maidens.js';
import { mixPose } from './manorrig.js';

const { oband, fband, ooval, taperW, flowPts, TAU } = KIT;

// A long ease in and out (no dip, no overshoot): drifting, not stepping.
const glide = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

// The wind's strength at phase ph: a steady push with gusts on it (0.55..1.15).
export const gust = (ph, k = 0) => 0.85 + 0.2 * Math.sin(ph + k) + 0.1 * Math.sin(ph * 2 + k * 1.7);

// The pose at frame f of n, glided from key to key; `float` adds a slow bob that never stops.
export function driftAt(keys, f, n, loop = true, float = 0) {
  const m = keys.length;
  const u = (f / n) * (loop ? m : m - 1);
  const i = Math.floor(u) % m;
  const j = loop ? (i + 1) % m : Math.min(m - 1, i + 1);
  const P = mixPose(keys[i], keys[j], glide(u - Math.floor(u)));
  if (!float) return P;
  return { ...P, hip: [P.hip[0], P.hip[1] + Math.sin((f / n) * TAU) * float] };
}

// A streamer blowing back off `root` in the wind: scarves, sashes, ribbons, feathers' trails.
// `lift` tips it up (-) or lets it hang (+); `w` its width at the root; it tapers to a point.
export function streamer(root, len, ph, w, c, k = 0, lift = 0.3, n = 6) {
  const g = gust(ph, k);
  return oband(flowPts(root, Math.PI - lift, -0.3 * g, len * g, ph * 2 + k, 0.26 + 0.12 * g, n), taperW(w, 0.4), c, 3, 0.3);
}

// The wind passing under a figure: two or three streaks and a wisp of cloud, drifting back.
export function windUnder(x, y, ph, c = '#ffffff') {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const u = ((ph / TAU) * 1.5 + k / 3) % 1;
    const sx = x + 16 - u * 34;
    out.push(fband([[sx, y - 1 - k * 2.4], [sx - 7 - k * 2, y - 1 - k * 2.4]], (t) => 0.7 * Math.sin(Math.PI * t), c, 1));
  }
  const u = ((ph / TAU) + 0.5) % 1;
  out.push(...ooval(x + 10 - u * 26, y + 0.4, 3.6, 1.2, c, 0, 0.2));
  return out;
}

// A cloud puff: three overlapping rounds, a lit top.
export function puff(x, y, r, c, lit) {
  return [...ooval(x - r * 0.8, y + r * 0.2, r * 0.7, r * 0.6, c, 0, 0.3), ...ooval(x + r * 0.8, y + r * 0.2, r * 0.7, r * 0.6, c, 0, 0.3), ...ooval(x, y - r * 0.15, r, r * 0.8, c, 0, 0.3), ...ooval(x - r * 0.25, y - r * 0.4, r * 0.45, r * 0.3, lit, 0, 0)];
}
