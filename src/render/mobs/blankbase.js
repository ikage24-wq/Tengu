// The blank base (2026-11-22, the player: "just make it a base, not the girl herself, a blank T-pose
// base we can build on later"): the Meteor Maiden's body (render/mobs/meteorrig.js) with nothing on
// it: no hair, no face of its own, no clothes. Her proportions, head and ears, neck, torso, arms,
// legs and feet, drawn as a plain soft mannequin, shaded by hand from the upper left, to design new
// characters on (clothes, hair and a face drawn over it, part by part).
//
//   blankBase({ tpose: true, guides: true }) -> { groups, J }
//     groups  named layers in drawing order, in the kid base's 160 x 150 box (feet on G), the same
//             names the kid rig uses (armFu armFf handF thighF shinF footF thighN shinN footN torso
//             neck head armNu armNf handN), so a design built on it rigs like the Meteor Maiden;
//     J       her joints (standing: arms hanging), for kidKit.
//   tpose   arms straight out from the shoulders (for design sheets); false: hanging, as she stands.
//   guides  faint lines on the face (the middle, the eye line) to place a face by.

import { E, T, F } from './kit.js';
import { CX, G, band, curve, skull, HS, mapShape } from './kidbase.js';

// (The head sits a touch higher than hers, over a short neck, and nearer the middle, so the base
// stands up straight: on her it read hunched, 2026-11-22.)
const HX = CX + 1;
const NECK = 83;
const HY = NECK - 31 * HS;
const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));
function soft(pts, n = 3) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      const b = q[(i + 1) % q.length];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
const blob = (pts, c, n = 3) => T(soft(pts, n), c);

// The mannequin's tones: lit, base, shade, deep.
export const BLANK = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2' };

// Her joints (as in meteorrig.js), standing.
export const BLANK_J = {
  hip: [CX, 106], waist: [CX, 101], neck: [HX, NECK], crown: [HX, 37],
  shF: [CX - 13, 91], elF: [CX - 15, 101], wrF: [CX - 15, 109],
  shN: [CX + 13, 91], elN: [CX + 15, 101], wrN: [CX + 15, 109],
  hipF: [CX - 7, 108], kneeF: [CX - 7, 123], ankF: [CX - 7, 138],
  hipN: [CX + 7, 108], kneeN: [CX + 7, 123], ankN: [CX + 7, 138],
};
// Where the arm's joints sit in a T-pose: straight out from the shoulder, her arm's lengths kept.
function tposeArm(sh, el, wr, dir) {
  const l1 = Math.hypot(el[0] - sh[0], el[1] - sh[1]);
  const l2 = Math.hypot(wr[0] - el[0], wr[1] - el[1]);
  return [sh, [sh[0] + l1 * dir, sh[1]], [sh[0] + (l1 + l2) * dir, sh[1]]];
}

export function blankBase({ tpose = true, guides = true } = {}) {
  const J = BLANK_J;
  const C = BLANK;
  const groups = {};
  const use = (n) => (groups[n] ??= []);
  // An arm: the upper arm from a round shoulder to the elbow, the elbow one smooth round, the
  // forearm to the wrist, a mitten hand; shaded along its underside (`far`: the far side, in shade).
  const arm = (k, far) => {
    let [sh, el, wr] = [J[`sh${k}`], J[`el${k}`], J[`wr${k}`]];
    const dir = k === 'F' ? -1 : 1;
    if (tpose) [sh, el, wr] = tposeArm(sh, el, wr, dir);
    const c = far ? C.sh : C.base;
    const s = far ? C.deep : C.sh;
    // (Which side is "under": down the arm hanging, along its bottom when it's held out.)
    const ux = tpose ? 0 : -1;
    const uy = tpose ? 1 : 0;
    use(`arm${k}u`).push(E(sh[0], sh[1], 4.4, 4.4, c), ...band([sh, el], 7.4, 6.6, c), ...band([[sh[0] + ux * 2.2, sh[1] + uy * 2.2], [el[0] + ux * 2, el[1] + uy * 2]], 2, 1.6, s, true));
    use(`arm${k}f`).push(E(el[0], el[1], 3.5, 3.5, c), ...band([el, wr], 6.6, 5.6, c), ...band([[el[0] + ux * 1.8, el[1] + uy * 1.8], [wr[0] + ux * 1.6, wr[1] + uy * 1.6]], 1.6, 1.4, s, true));
    use(`arm${k}f`).push(...band(curve([[el[0] + (tpose ? -0.6 * dir : -1.4), el[1] + (tpose ? 1.6 : 0.4)], [el[0] + (tpose ? 0.4 * dir : 0), el[1] + (tpose ? 2.4 : 1.2)], [el[0] + (tpose ? 1.4 * dir : 1.4), el[1] + (tpose ? 1.6 : 0.4)]], 2), 0.5, 0.5, s, true));
    if (!far) use(`arm${k}f`).push(...band([[el[0] - uy * 2 * dir, el[1] - ux * 2], [wr[0] - uy * 1.8 * dir, wr[1] - ux * 1.8]], 1, 0.8, C.lt, true));
    const [hx, hy] = tpose ? [wr[0] + 4 * dir, wr[1] + 0.4] : [wr[0], wr[1] + 4];
    use(`hand${k}`).push(E(hx, hy, 4.2, 4, c), E(hx + (tpose ? -1.4 * dir : 3), hy + (tpose ? -3 : -1.4), 1.7, 1.6, c), F(E(hx + (tpose ? 0.4 * dir : -0.6), hy + 1.6, 2.4, 1.3, s)));
    use(`hand${k}`).push(...band(tpose ? [[hx + 1.6 * dir, hy - 1.6], [hx + 1.6 * dir, hy + 1.6]] : [[hx - 1.8, hy + 1.6], [hx + 1.6, hy + 1.6]], 0.5, 0.5, s, true));
  };
  arm('F', true);
  // Legs: the thigh running up under the hip, the knee one smooth round, the shin, a plain rounded
  // foot (turned to the right, as she stands).
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const c = far ? C.sh : C.base;
    const s = far ? C.deep : C.sh;
    use(`thigh${k}`).push(blob([[hx - 4.8, 100], [hx + 4.8, 100], [kx + 4, ky], [kx + 3.4, ky + 3.4], [kx - 3.4, ky + 3.4], [kx - 4, ky]], c, 2), F(blob([[hx - 4.6, 104], [hx - 2.2, 104], [kx - 2.4, ky + 1], [kx - 3.8, ky + 1]], s, 1)));
    use(`shin${k}`).push(E(kx, ky + 0.4, 3.9, 3.7, c), blob([[kx - 3.8, ky], [kx + 3.8, ky], [ax + 3.5, ay + 1], [ax - 3.5, ay + 1]], c, 2), F(blob([[kx - 3.6, ky + 1.6], [kx - 1.6, ky + 1.6], [ax - 1.6, ay + 0.6], [ax - 3.3, ay + 0.6]], s, 1)));
    if (!far) use(`shin${k}`).push(F(E(kx + 1.2, ky - 0.4, 1.4, 1, C.lt)));
    use(`foot${k}`).push(blob([[ax - 4.2, ay - 1.6], [ax + 3.2, ay - 1.8], [ax + 8.6, ay + 3], [ax + 8.6, ay + 6.6], [ax - 4.4, ay + 6.8]], c), F(blob([[ax - 4.2, ay + 4.6], [ax + 8.6, ay + 4.6], [ax + 8.6, ay + 6.6], [ax - 4.4, ay + 6.8]], s, 1)));
  }
  // The torso, standing up straight, in two pieces that bend at the waist (blankrigs.js): the chest
  // (the base of the neck, shoulders sloping down to where the arms join, a soft chest, down past
  // the waist to a round bottom) over the pelvis (from just above the waist out to the hips); each
  // runs on under the other, so a bend or a sway of the hips never opens a seam. Gentle shading on
  // the far side, a light on the near; collarbones, a waist line.
  use('pelvis').push(blob([[CX + 11, 97.6], [CX + 11.8, 101], [CX + 14.4, 108], [CX + 12.8, 114], [CX + 4.6, 117.4], [CX - 4.6, 117.4], [CX - 12.8, 114], [CX - 14.4, 108], [CX - 11.8, 101], [CX - 11, 97.6]], C.base));
  use('pelvis').push(F(blob([[CX - 11, 98.6], [CX - 9.6, 101], [CX - 11.2, 108], [CX - 10, 114.6], [CX - 12.6, 113.6], [CX - 14, 108], [CX - 11.6, 101]], C.sh, 2)));
  use('pelvis').push(...band(curve([[CX + 11.6, 100], [CX + 12.6, 104], [CX + 13.4, 108]], 2), 0.8, 0.7, C.lt, true));
  use('pelvis').push(...band(curve([[CX - 12.6, 111], [CX - 3, 114.4], [CX, 117]], 2), 0.5, 0.5, C.sh, true), ...band(curve([[CX + 12.6, 111], [CX + 3, 114.4], [CX, 117]], 2), 0.5, 0.5, C.sh, true));
  use('chest').push(blob([[HX - 4.8, 83.6], [HX + 4.8, 83.6], [CX + 10.6, 86.6], [CX + 13.8, 88.6], [CX + 15.2, 92], [CX + 14.4, 96.6], [CX + 11.8, 101], [CX + 11.6, 103.6], [CX + 7, 105.6], [CX - 7, 105.6], [CX - 11.6, 103.6], [CX - 11.8, 101], [CX - 14.4, 96.6], [CX - 15.2, 92], [CX - 13.8, 88.6], [CX - 10.6, 86.6]], C.base));
  use('chest').push(F(blob([[CX - 13.4, 89.6], [CX - 10.4, 89.6], [CX - 9.6, 101], [CX - 9.8, 104.2], [CX - 11.4, 103.4], [CX - 11.6, 101], [CX - 14, 96.6], [CX - 14.8, 92]], C.sh, 2)));
  use('chest').push(...band(curve([[CX + 13.8, 91], [CX + 13.6, 96.4], [CX + 11.4, 101], [CX + 11.2, 103.4]], 2), 0.9, 0.7, C.lt, true));
  for (const s2 of [-1, 1]) use('chest').push(...band(curve([[HX + 2.6 * s2, 87.6], [HX + 6.6 * s2, 88.4], [HX + 10.6 * s2, 88]], 2), 0.5, 0.4, C.sh, true));
  use('chest').push(...band(curve([[CX - 11.6, 101.4], [CX, 102.6], [CX + 11.6, 101.4]], 2), 0.5, 0.5, C.sh, true));
  // The neck: short, a soft shadow under the chin.
  use('neck').push(blob([[HX - 4, 75], [HX + 4, 75], [HX + 4.8, 85], [HX - 4.8, 85]], C.base, 1), F(blob([[HX - 4, 78], [HX + 4, 78], [HX + 4.2, 81], [HX - 4.2, 81]], C.sh, 1)));
  // The head: her skull with its ears, no hair; a faint middle line and eye line to place a face by.
  const head = place(skull(0, 0).slice(0, 4)).map((sh) => ({ ...sh, c: sh.c === '#f6c8b4' ? C.sh : C.base }));
  use('head').push(...head, ...place([F(E(-24, 14, 6, 10, C.sh)), F(E(-21.4, 13, 5.4, 10, C.base))]));
  if (guides) {
    use('head').push(...place([...band([[0, -26], [0, 28]], 0.6, 0.6, C.guide, true), ...band(curve([[-29, 10.6], [0, 12.4], [29, 10.6]], 3), 0.6, 0.6, C.guide, true)]));
  }
  arm('N', false);
  return { groups, J };
}
// The layers in the order they're drawn.
// Its shape for the smooth skinned body (blankskin.js), at rest: the torso's outline down each
// side, the ribs and navel, the neck, the arms', legs' and feet's sizes.
export function blankSkinSpec() {
  // (The shoulder line runs down to the top of the round shoulder and in under it, as on the other
  // bases: blankbases.js skinSpec.)
  const right = [[HX + 4.8, 83.6], [CX + 8.6, 85.2], [CX + 12.1, 86.9], [CX + 14.6, 90.7], [CX + 14.3, 97.4], [CX + 11.8, 101], [CX + 14.4, 108], [CX + 12.8, 114], [CX + 4.6, 117.4]];
  return {
    right,
    left: [[HX - 4.8, 83.6], ...right.slice(1).map(([x, y]) => [2 * CX - x, y])],
    cx: CX,
    stern: [CX, 85.8],
    ribs: [CX, 98.6],
    navel: [CX, 103.4],
    shoulder: { y: 91, w: 13, neckW: 4.8 },
    lines: { chest: 97.8, hip: 106.2, top: 87.6, bottom: 116 },
    neck: { base: [HX, 86], top: [HX, 75], chin: 81, w: 8.4 },
    arm: { aw0: 7.4, ew: 6.6, aw1: 5.6, hr: 4.2, ball: 4.1 },
    leg: { tw: 9.6, kw: 7.8, anw: 7, top: 100, heel: 4.4, toe: 8.6, ftop: 1.8, fbot: 6.8 },
    collar: [-1, 1].map((s2) => [[HX + 2.8 * s2, 87.4], [HX + 6.6 * s2, 88.2], [HX + 10.2 * s2, 87.8]]),
    belly: null,
    fine: 0.5,
    legs: true,
  };
}

export const BLANK_ORDER = ['armFu', 'armFf', 'handF', 'thighF', 'shinF', 'footF', 'thighN', 'shinN', 'footN', 'pelvis', 'chest', 'neck', 'head', 'armNu', 'armNf', 'handN'];
