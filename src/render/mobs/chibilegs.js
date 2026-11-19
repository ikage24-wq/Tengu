// Two-bone legs for an upright chibi boss (2026-11-19): the thigh and shin turned so each foot
// lands where it's asked, under a body at any height and tilt. Each boss gives its own sizes and
// writes its own gait with them; this only does the bending.
//
//   const L = chibiLegs({ bodyY, l1, l2, sole, hips: [[x, y] near, [x, y] far], feet: [near x, far x] });
//   L.at(lift, tilt, [near x, raised], [far x, raised])  ->  { thighN, shinN, rollN, thighF, shinF, rollF }
// (Angles in degrees: a thigh's is measured from straight down in the body's own frame, a shin's
// from its thigh; `roll` tips a raised foot's toe.)

import { clamp } from './rig.js';

const D2R = Math.PI / 180;
export function chibiLegs({ bodyY, l1, l2, sole, hips, feet, roll = 3 }) {
  const ik = (dx, dy) => {
    const d = Math.min(l1 + l2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
    const h = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const k = Math.acos(clamp((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2), -1, 1));
    return [(-Math.atan2(dx, dy) - h) / D2R, (Math.PI - k) / D2R];
  };
  const at = (lift, tilt, n = [feet[0], 0], f = [feet[1], 0]) => {
    const out = {};
    const r = tilt * D2R;
    [['N', hips[0], n], ['F', hips[1], f]].forEach(([k, [hx, hy], [fx, up]]) => {
      const hipX = hx * Math.cos(r) - hy * Math.sin(r);
      const hipY = -bodyY - lift + hx * Math.sin(r) + hy * Math.cos(r);
      const [th, sh] = ik(fx - hipX, -sole - up - hipY);
      out[`thigh${k}`] = th - tilt;
      out[`shin${k}`] = sh;
      out[`roll${k}`] = up * roll;
    });
    return out;
  };
  return { at, ik };
}
