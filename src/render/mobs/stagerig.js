// The stage rig (2026-11): the Dream Theatre's players. The manor rig played big for the back row:
// every move between keys dips the other way first (anticipation), sweeps across, overshoots a
// little and settles into a held pose, all eased. A soft spotlight follows each performer.

import { KIT } from './maidens.js';
import { mixPose } from './manorrig.js';

// Ease with a dip before and an overshoot after (both small), then held.
const dramatic = (t) => {
  if (t < 0.15) return -Math.sin((t / 0.15) * Math.PI) * 0.08;
  if (t < 0.7) {
    const u = (t - 0.15) / 0.55;
    return u * u * (3 - 2 * u) * 1.08;
  }
  return 1.08 - 0.08 * Math.sin(((t - 0.7) / 0.3) * (Math.PI / 2));
};

// The pose at frame f of n, played dramatically from key to key.
export function playAt(keys, f, n, loop = true) {
  const m = keys.length;
  const u = (f / n) * (loop ? m : m - 1);
  const i = Math.floor(u) % m;
  const j = loop ? (i + 1) % m : Math.min(m - 1, i + 1);
  return mixPose(keys[i], keys[j], dramatic(u - Math.floor(u)));
}

// The spotlight pool on the floor under a performer (a soft warm oval, its rim brighter).
export function spot(x, y, w, c) {
  return [KIT.fpoly(KIT.ovalPts(x, y, w, w * 0.18, 20), c), KIT.fband(KIT.arcPts(x, y, w, w * 0.18, 180, 360, 12), 0.6, '#ffffff', 1)];
}
