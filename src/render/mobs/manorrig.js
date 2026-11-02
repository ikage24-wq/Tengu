// The manor rig (2026-11): a new humanoid skeleton for the Moonlit Manor monsters, the player's call
// ("make a new rig and animate it"). Taller and more elegant than the maidens: a big head on a slim
// body, about four heads tall. Poses are angles on a bone chain (forward kinematics: hips, spine,
// neck, head; shoulder, elbow, hand; hip, knee, foot), keyed per animation and blended with eased
// in-betweens, so every motion flows from key to key. Each monster supplies its costume as hooks
// that draw on the posed skeleton.
//
// Drawing goes through the maidens' low-level kit (outlined polygons and bands, the heroine faces),
// but the skeleton, proportions and motion here are new.

import { KIT } from './maidens.js';

const { XY, within, at, chain, fpoly, opoly, ooval, oband, dot, limb: inkLimb, face, faceTop, TAU, lerp, smooth } = KIT;

export const RW = 72;
export const RH = 80;
export const RGY = 78;

// Bone lengths (sprite px).
export const BONES = { spine: 15, neck: 3.4, upper: 8.6, fore: 8, thigh: 12.4, shin: 12.4, shoulderW: 4.4, hipW: 2.8 };
const BASE = BONES;

// A pose: { hip: [x, y], lean, tilt, arms: [[shoulder, elbow], [shoulder, elbow]] (back, front),
// legs: [[hip, knee], [hip, knee]] (back, front), and any extras a monster keys (a parasol's angle,
// a skirt's sway). Angles are radians, 0 straight down, + swinging forward (toward +x).
const DOWN = (a) => [Math.sin(a), Math.cos(a)];

// Blend two poses (numbers and arrays of numbers alike), t in 0..1.
export function mixPose(a, b, t) {
  if (typeof a === 'number') return lerp(a, b ?? a, t);
  if (Array.isArray(a)) return a.map((v, i) => mixPose(v, b?.[i], t));
  if (a && typeof a === 'object') {
    const out = {};
    for (const k of Object.keys(a)) out[k] = mixPose(a[k], b?.[k], t);
    return out;
  }
  return a;
}
// The pose at frame f of n, from a ring of keys spread evenly over the cycle (eased between keys).
export function poseAt(keys, f, n, loop = true) {
  const m = keys.length;
  const u = (f / n) * (loop ? m : m - 1);
  const i = Math.floor(u) % m;
  const j = loop ? (i + 1) % m : Math.min(m - 1, i + 1);
  return mixPose(keys[i], keys[j], smooth(u - Math.floor(u)));
}

// Solve a pose into joint positions. `k` scales the whole skeleton (the bosses are drawn at 1.5x
// and more on the same bones).
export function solve(P, k = 1) {
  const BONES = Object.fromEntries(Object.entries(BASE).map(([n, v]) => [n, v * k]));
  const [hx, hy] = P.hip;
  const lean = P.lean ?? 0;
  const up = [Math.sin(lean), -Math.cos(lean)];
  const chest = [hx + up[0] * BONES.spine, hy + up[1] * BONES.spine];
  const neck = [chest[0] + up[0] * BONES.neck, chest[1] + up[1] * BONES.neck];
  const side = [Math.cos(lean), Math.sin(lean)];
  const sh = (s) => [chest[0] - up[0] * 1.6 + side[0] * BONES.shoulderW * s, chest[1] - up[1] * 1.6 + side[1] * BONES.shoulderW * s];
  const hp = (s) => [hx + side[0] * BONES.hipW * s, hy + side[1] * BONES.hipW * s];
  const arm = (base, [a1, a2]) => {
    const d1 = DOWN(a1 + lean);
    const el = [base[0] + d1[0] * BONES.upper, base[1] + d1[1] * BONES.upper];
    const d2 = DOWN(a1 + a2 + lean);
    return { sh: base, el, hand: [el[0] + d2[0] * BONES.fore, el[1] + d2[1] * BONES.fore], a: a1 + a2 + lean };
  };
  const leg = (base, [a1, a2]) => {
    const d1 = DOWN(a1);
    const kn = [base[0] + d1[0] * BONES.thigh, base[1] + d1[1] * BONES.thigh];
    const d2 = DOWN(a1 + a2);
    return { hip: base, kn, ft: [kn[0] + d2[0] * BONES.shin, kn[1] + d2[1] * BONES.shin], a: a1 + a2 };
  };
  return {
    P, hip: [hx, hy], chest, neck, lean, tilt: P.tilt ?? 0,
    head: [neck[0] + up[0] * 8.6 * k + Math.sin(P.tilt ?? 0) * 1.4 * k, neck[1] + up[1] * 8.6 * k],
    k,
    arms: [arm(sh(-1), P.arms[0]), arm(sh(1), P.arms[1])],
    legs: [leg(hp(-1), P.legs[0]), leg(hp(1), P.legs[1])],
  };
}

// Plant the pose: lift or drop the whole figure so the lowest foot rests on the ground (unless the
// monster floats), so walk keys never sink or hover.
export function plant(S, ground = RGY - 0.6) {
  const low = Math.max(S.legs[0].ft[1], S.legs[1].ft[1]);
  const dy = ground - low;
  const mv = ([x, y]) => [x, y + dy];
  return {
    ...S, hip: mv(S.hip), chest: mv(S.chest), neck: mv(S.neck), head: mv(S.head),
    arms: S.arms.map((a) => ({ ...a, sh: mv(a.sh), el: mv(a.el), hand: mv(a.hand) })),
    legs: S.legs.map((l) => ({ ...l, hip: mv(l.hip), kn: mv(l.kn), ft: mv(l.ft) })),
  };
}

// A smooth outlined limb through three joints.
export const limb3 = (a, b, c, w0, w1, w2, col, col2) => inkLimb(a, b, c, w0, w1, w2, col, col2);

// The head's local space: centred on the skull, turned by the tilt, scaled up (`k`), so the faces
// and hair drawn in head units come out big and bright on this taller body.
export function inHead(S, k, fn) {
  const sc = (x, y) => [x * k, y * k];
  return within(chain(at(S.head[0], S.head[1], S.tilt + S.lean * 0.6), sc), fn);
}

// Draw a posed monster: back limbs, body, front leg, head, front arm, each by the costume's hooks.
// costume: { backArm(S), backLeg(S), body(S), frontLeg(S), head(S), frontArm(S), behind(S), front(S) }
export function drawRig(S, costume) {
  const out = [];
  for (const k of ['behind', 'backArm', 'backLeg', 'body', 'frontLeg', 'head', 'frontArm', 'front']) if (costume[k]) out.push(...costume[k](S));
  return out;
}

export { XY, within, at, fpoly, opoly, ooval, oband, dot, face, faceTop, TAU, lerp, smooth };
