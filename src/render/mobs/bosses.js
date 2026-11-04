// Monster art: the Crystal Dragon King (crystalking, Prismaris): a crowned crystal dragon with a
// prism scepter, its frames built on the hollow module's joint transforms, chains, ramps and shape
// helpers, and its cutout rig. (The Hollow bosses that once lived here are in hollowfolk.js.) Faces
// right, feet at the bottom.

import { F, C, mix } from './kit.js';
import { brow, deadEye, eye } from './faces.js';
import * as H from './hollow.js';
import { part, makeRig, stateBlend, chainParts } from './rig.js';

const { ID, joint, at, place, squash, ik, chainPts, footStep, timing, limb, limbR, fp, fov, pg, star, ramp, actOf } = H;
const rball = H.ball;
const rtaper = H.taper;
const rswoosh = H.swoosh;

const TAU = Math.PI * 2;

// ---------- Small math helpers ----------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Picks the attack frame's value from a list (or the fallback outside an attack).
const key = (att, list, other) => (att >= 0 ? list[Math.min(att, list.length - 1)] : other);

// A flat ring on the floor (an ellipse band) for telegraphs.
function ringPts(x, y, rx, ry, w) {
  const o = [];
  const i = [];
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * TAU;
    o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
    i.push([x + Math.cos(a) * (rx - w), y + Math.sin(a) * Math.max(0.3, ry - w * 0.3)]);
  }
  return [...o, ...i.reverse()];
}

// ---------- Prismaris, the Crystal King ----------
// A crowned crystal dragon standing upright. Signature: faceted crystal wings and crystal spines
// over a lilac body, a gold crown, and the prism scepter. Crystal is drawn as a transparent gem:
// the facet facing the light is the darkest and the far facet glows, with a glint on the lit
// edge. Rig: hips > torso (pitch) > neck chain > head > jaw and crown; torso > wing roots (arm,
// forearm, four finger spars whose tips trail), the scepter arm (IK to the hand, the scepter
// rides the hand), and the tail chain; two digitigrade IK legs with planted feet. The walk is a
// heavy royal stomp. The attack lifts the scepter overhead and back (held: the prism charges and
// the floor glows where it will land), swings it down into the floor in one arc, and holds the
// crystal burst before settling.

const DK = {
  scale: ramp('#ad9cf0', true),
  far: ramp('#8f7fdc', true),
  belly: ramp('#f1e9ff', true),
  gold: ramp('#ffd36b'),
  ermine: ramp('#fffaf4', true),
  mouth: '#3d2a6b',
  // Crystal tones: [the face toward the light (darkest), body, the far face (glowing), glint].
  ice: ['#5aa6dc', '#9fe3f8', '#dffaff', '#ffffff'],
  rose: ['#c25ba6', '#f2a0d4', '#ffe0f2', '#ffffff'],
  lilac: ['#7d6bd6', '#b9a8ff', '#ece6ff', '#ffffff'],
  mint: ['#3fae8a', '#8cecc6', '#dcfff0', '#ffffff'],
};
const LIGHT = [0.6, -0.8];
const dimK = (K) => K.map((c, i) => (i === 3 ? mix(c, '#c9c0ff', 0.4) : mix(c, '#6a5ab8', 0.28)));

// A crystal shard from (x, y) toward angle a: the facet facing the light darkest, the far facet
// glowing, a glint on the lit edge near the tip.
function prism(x, y, a, len, w, K, glint = true) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const q = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  const lit = -s * LIGHT[0] + c * LIGHT[1] > 0 ? 1 : -1;
  const out = [fp([q(-0.5, -w - 0.5), q(len * 0.62, -w - 0.5), q(len + 0.8, 0), q(len * 0.62, w + 0.5), q(-0.5, w + 0.5)], mix(K[0], '#2a2035', 0.45))];
  out.push(fp([q(0, -w), q(len * 0.62, -w), q(len, 0), q(len * 0.62, w), q(0, w)], K[1]));
  out.push(fp([q(0, lit * w), q(len * 0.62, lit * w), q(len, 0), q(0, lit * w * 0.12)], K[0]));
  out.push(fp([q(len * 0.12, -lit * w * 0.8), q(len * 0.58, -lit * w * 0.8), q(len * 0.86, -lit * w * 0.14), q(len * 0.12, -lit * w * 0.22)], K[2]));
  if (glint) out.push(fp([q(len * 0.5, lit * w * 0.85), q(len * 0.74, lit * w * 0.4), q(len * 0.56, lit * w * 0.38)], K[3]));
  return out;
}
// A round gem: dark toward the light, glowing on the far side, a glint.
const gemDot = (x, y, r, K) => [fov(x, y, r + 0.4, r + 0.4, mix(K[0], '#2a2035', 0.4), 0, 12), fov(x, y, r, r, K[1], 0, 12), fov(x + r * 0.28, y - r * 0.28, r * 0.6, r * 0.55, K[0], 0, 10), fov(x - r * 0.35, y + r * 0.38, r * 0.42, r * 0.34, K[2], 0, 8), fov(x + r * 0.3, y - r * 0.45, Math.max(0.4, r * 0.22), Math.max(0.4, r * 0.22), K[3], 0, 6)];
// A wing pane between spars (A the wrist, B the leading spar tip, C the trailing one).
function pane(A, B, C, K) {
  // A clean cut gem pane: split from the root to the outer edge into two flat facets (the one
  // toward the light darker, the far one glowing), a glowing band inside the outer edge, and one
  // straight glint along the leading edge.
  const m = (U, V, t) => [U[0] + (V[0] - U[0]) * t, U[1] + (V[1] - U[1]) * t];
  const M = m(B, C, 0.45);
  return [
    pg([A, B, C], K[1]),
    fp([A, B, M], mix(K[0], K[1], 0.35)),
    fp([m(A, M, 0.62), M, C, m(A, C, 0.7)], K[2]),
    fp([m(A, B, 0.5), m(A, B, 0.86), m(m(A, B, 0.86), M, 0.12), m(m(A, B, 0.5), M, 0.1)], K[3]),
  ];
}

function dragon(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = DK;
  const floor = 147;
  let by = 0;
  let pitch = 0.14;
  let headA = 0;
  let neckA = 0;
  let jaw = 0.04;
  let flap = 0;
  if (walk) {
    by = 2.2 * Math.cos(2 * p - 0.5);
    pitch = 0.16 + 0.025 * Math.sin(2 * p - 1);
    headA = -0.04 * Math.sin(2 * p - 1.8);
    flap = 0.08 * Math.sin(2 * p - 1.6);
  } else if (att >= 0) {
    by = [-1.5, -2.5, 4, 3.4, 1][att];
    pitch = [0.02, -0.04, 0.34, 0.3, 0.18][att];
    headA = [-0.2, -0.28, 0.2, 0.16, 0.02][att];
    neckA = [-0.1, -0.14, 0.12, 0.1, 0][att];
    jaw = [0.3, 0.42, 0.5, 0.35, 0.1][att];
    flap = [-0.3, -0.42, 0.25, 0.18, 0.05][att];
  } else {
    by = -0.9 * br;
    pitch = 0.14 + 0.012 * Math.sin(it - 0.6);
    headA = 0.04 * Math.sin(it - 1.4) + (f === 3 ? 0.03 : 0);
    flap = 0.06 * Math.sin(it - 1.9);
  }
  if (angry && att < 0) {
    flap -= 0.3;
    headA += 0.1;
    jaw = 0.4;
    pitch += 0.04;
  }
  if (hurt) {
    pitch -= 0.12;
    headA -= 0.3;
    jaw = 0.25;
    flap += 0.15;
  }
  if (happy && att < 0) headA -= 0.08;
  if (dead) {
    // Collapsed: slumped forward onto its belly, the neck laid along the floor, the wings
    // folded and draped down to the floor behind it, their panes gone dull.
    by = 22;
    pitch = 0.92;
    neckA = 0.3;
    headA = 0.35;
    jaw = 0.3;
  }
  const MB = joint(ID, 62, 110 + by, pitch);
  const out = [];
  const lagW = (k) => (dead ? 0 : walk ? 0.07 * Math.sin(2 * p - 1.6 - k * 0.8) : att >= 0 ? [0.1, 0.12, -0.15, -0.1, 0][att] * (k + 1) * 0.4 : 0.05 * Math.sin(it - 1.9 - k * 0.8));

  // Wings: arm and forearm from the root, four finger spars fanning back from the wrist, crystal
  // panes between them; the far wing sits higher and darker.
  const wing = (root, far) => {
    const a1 = dead ? -2.15 + (far ? 0.3 : 0) : -1.95 + flap + (far ? 0.3 : 0) + pitch * 0.5;
    const E = [root[0] + Math.cos(a1) * 18, root[1] + Math.sin(a1) * 18];
    const a2 = dead ? a1 - 1.25 : a1 + 0.5 + lagW(0) * 0.6 + flap * 0.3;
    const W = [E[0] + Math.cos(a2) * 18, E[1] + Math.sin(a2) * 18];
    const tips = (dead ? [-0.15, -0.55, -0.95, -1.35] : [-0.95, -1.5, -2.1, -2.6]).map((d, k) => {
      const a = a2 + d + lagW(k + 1);
      const l = [26, 30, 30, 26][k];
      return [clamp(W[0] + Math.cos(a) * l, 3, 147), clamp(W[1] + Math.sin(a) * l, 3, floor - 2)];
    });
    const dull = (K) => (dead ? K.map((c) => mix(c, '#a99fc6', 0.45)) : K);
    const KS = (far ? [dimK(P.lilac), dimK(P.ice), dimK(P.rose)] : [P.lilac, P.ice, P.rose]).map(dull);
    const R = far ? P.far : P.scale;
    const res = [];
    res.push(...pane(W, tips[0], tips[1], KS[0]), ...pane(W, tips[1], tips[2], KS[1]), ...pane(W, tips[2], tips[3], KS[2]), ...pane(W, tips[3], root, KS[0]));
    tips.forEach((t) => res.push(...limb([W, t], 2.4, 0.8, R.sh)));
    res.push(...limbR([root, E, W], 5, 3.4, R), ...rball(W[0], W[1], 2.6, 2.6, P.gold), ...rball(E[0], E[1], 2.2, 2.2, P.gold));
    return res;
  };
  out.push(...wing(at(MB, 2, -35), true));
  out.push(...wing(at(MB, -4, -32), false));

  // The tail: a chain that sweeps down to the floor and curls up, crystal spines along its top,
  // a shard cluster at the tip.
  {
    const t0 = at(MB, -10, 6);
    const tw = (k) => (dead ? 0 : walk ? 0.07 * Math.sin(2 * p - 2 - k * 0.7) : att >= 0 ? [-0.05, -0.08, 0.1, 0.06, 0][att] : 0.06 * Math.sin(it - 2.2 - k * 0.7));
    const { pts, a } = chainPts(t0[0], t0[1], Math.PI - 0.9 - pitch * 0.4, 6, (k) => [9, 8, 7, 6, 5.5, 5][k], (k) => (k ? 0.13 : 0) + tw(k));
    pts.forEach((q, i) => {
      q[1] = Math.min(q[1], floor - 1.5 - (13 - (10 * i) / 6) / 2);
      q[0] = Math.max(q[0], 8);
    });
    const sp = [];
    [1, 2, 3, 4].forEach((i, k) => {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const sa = Math.atan2(y1 - y0, x1 - x0);
      const up = Math.sin(sa + Math.PI / 2) < 0 ? sa + Math.PI / 2 : sa - Math.PI / 2;
      const hw = [5.4, 4.6, 3.8, 3][k];
      sp.push(...prism(x0 + Math.cos(up) * hw * 0.7, y0 + Math.sin(up) * hw * 0.7, up + (sa > Math.PI / 2 || sa < -Math.PI / 2 ? -0.45 : 0.45), [8, 7, 6, 5][k], [2.4, 2.2, 1.9, 1.6][k], k % 2 ? P.ice : P.rose, k < 2));
    });
    out.push(...sp, ...limbR(pts, 13, 3, P.scale));
    [[-0.55, 8, P.ice], [0.5, 7, P.rose], [-0.02, 10, P.lilac]].forEach(([d, l, K]) => out.push(...prism(pts[6][0], pts[6][1], clamp(a + d - 0.3, Math.PI * 0.75, Math.PI * 1.5), l, 2.3, K)));
  }

  // Legs: digitigrade, the knee forward and the hock back; the feet plant (walk: a heavy stomp).
  const leg = (sx, sy, home, q, R) => {
    const Hp = at(MB, sx, sy);
    const [ox, lift] = walk && !dead ? footStep(p + q, 7, 7) : [0, 0];
    const ft = [home + ox, floor - lift];
    const [K, A] = ik(Hp, [ft[0] - 6, ft[1] - 8], 17, 15, 1);
    const res = [...rball(Hp[0], Hp[1], 9, 11, R), ...limbR([Hp, K], 11, 8, R), ...limbR([K, A], 7, 5, R)];
    res.push(pg([[A[0] - 3.4, A[1] - 2], [A[0] + 3, A[1] - 3], [ft[0] + 5, ft[1] - 3.6], [ft[0] + 6.6, ft[1]], [A[0] - 4, ft[1]]], R.base), fp([[A[0] - 4, ft[1] - 1.4], [ft[0] + 6.6, ft[1] - 1.4], [ft[0] + 6.6, ft[1]], [A[0] - 4, ft[1]]], R.sh2));
    res.push(...prism(ft[0] + 5.6, ft[1] - 1.8, 0.35, 4.4, 1.3, P.ice, false), ...prism(ft[0] + 1.6, ft[1] - 1.6, 0.45, 3.6, 1.1, P.ice, false));
    return res;
  };
  out.push(...leg(-4, 2, 56, Math.PI, P.far));

  // Crystal spines down the back (behind the torso's edge), and the far arm tucked at the chest.
  const NB = at(MB, 10, -38);
  const nk = chainPts(NB[0], NB[1], -Math.PI / 2 + 0.55 + pitch + neckA, 3, 8, (i) => (dead ? 0.3 : -0.15) + (walk ? -0.03 * Math.sin(2 * p - 1.2 - i) : 0));
  {
    const back = -Math.PI / 2 - 0.75 + pitch;
    out.push(...prism(...at(MB, -12, -20), back - 0.15, 9, 2.6, P.ice), ...prism(...at(MB, -7, -30), back, 9, 2.6, P.rose));
    [1, 2].forEach((i) => out.push(...prism(nk.pts[i][0] - 2.4, nk.pts[i][1] - 1.4, back + 0.35 + i * 0.15 + (dead ? 0.5 : 0), 7 - i, 2.1, i % 2 ? P.ice : P.lilac, false)));
    const Sf = at(MB, 4, -30);
    const hf = [Sf[0] + 16, Sf[1] + 8];
    out.push(...limbR([Sf, [Sf[0] + 7, Sf[1] + 9], hf], 5, 3.6, P.far), ...rball(hf[0], hf[1], 2.6, 2.4, P.far));
  }

  // The torso: base, the back and underside in shadow, the belly plate with its scute lines, a
  // lit chest edge, and a gold pendant with a heart gem.
  out.push(
    ...place(MB, [
      C(pg([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [7, -41], [15, -36], [18, -22], [17, -6], [11, 8], [-2, 13]], P.scale.base)),
      fp([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [-1, -33], [-8, -21], [-11, -6], [-7, 10]], P.scale.sh),
      fp([[-7, 10], [-2, 13], [11, 8], [8, 5], [-2, 8]], P.scale.sh),
      pg([[7, -36], [14, -32], [16, -20], [14, -4], [8, 8], [2, 8], [7, -6], [9, -20], [4, -33]], P.belly.base),
      fp([[2, 8], [7, -6], [9, -20], [4, -33], [6, -34], [11, -20], [10, -6], [6, 8]], P.belly.sh),
      ...[[-18, 9.6, 15], [-10, 9.4, 15.4], [-2, 8.4, 14.4]].map(([y, x0, x1]) => F(rtaper([[x0, y], [x1, y + 1]], 0.7, 0.7, P.belly.sh))),
      fp([[7, -39], [13, -36], [12, -33], [6, -35]], P.scale.hi),
      pg([[7, -31], [15, -31], [15, -26], [11, -22], [7, -26]], P.gold.base),
      fp([[7, -27.5], [11, -24.5], [11, -22], [7, -26]], P.gold.sh),
      ...gemDot(11, -27.4, 2.3, P.rose),
    ]),
  );
  out.push(...leg(4, 4, 72, 0, P.scale));

  // The ermine collar around the neck's base: fluffy puffs with dark tail tips.
  out.push(
    ...place(MB, [
      ...[[-2, -34], [2, -37.5], [7, -39.5], [12, -39], [16.5, -36.5]].flatMap(([x, y]) => [fov(x - 0.5, y + 0.6, 3.4, 3, P.ermine.sh, 0, 12), fov(x + 0.3, y - 0.3, 2.9, 2.5, P.ermine.base, 0, 12)]),
      fov(4.6, -36, 0.9, 1.4, P.mouth, 0, 8),
      fov(14.4, -35.6, 0.9, 1.4, P.mouth, 0, 8),
    ]),
  );

  // Neck and head.
  {
    out.push(...limbR(nk.pts, 11, 8.4, P.scale), F(rtaper(nk.pts.map(([x, y]) => [x + 2.6, y + 0.6]), 4, 3, P.belly.base)));
    const top = nk.pts[3];
    const MH = joint(ID, top[0], top[1], headA + pitch * 0.3);
    const MJ = joint(MH, 2, 3, jaw);
    const h = [];
    h.push(...prism(-1, -8, -Math.PI + 0.55, 13, 2.3, dimK(P.ice)));
    h.push(...prism(-4, 2.4, Math.PI - 0.15, 8, 2, P.rose, false), ...prism(-4, 4, Math.PI + 0.35 - jaw, 6.5, 1.8, P.rose, false));
    out.push(...place(MH, h));
    out.push(fp([at(MH, 1, 3), at(MH, 22, 4), at(MJ, 20, 0), at(MJ, 0, 0)], P.mouth));
    out.push(...place(MJ, [pg([[-3, -1], [20, 0], [23, 2], [12, 6], [-2, 5]], P.scale.sh), fp([[0, 2], [18, 1.6], [12, 4.6], [0, 4]], P.belly.sh), fp([[15, -0.2], [17, -0.2], [16.2, -2.6]], '#fffaf2')]));
    const s = [];
    s.push(C(pg([[-7, -2], [-3, -9], [6, -12], [16, -9], [24, -5], [29, -2], [29, 2], [22, 4.5], [8, 5], [-3, 6]], P.scale.base)));
    s.push(fp([[-7, -2], [-3, -9], [0, -9.6], [-3, 4], [-3, 6]], P.scale.sh), fp([[-3, 6], [8, 5], [22, 4.5], [29, 2], [27, 3.2], [21, 3], [8, 3.4], [-3, 3.6]], P.scale.sh));
    s.push(fp([[14, -9.4], [24, -5.2], [22.4, -4.2], [14, -7.8]], P.scale.hi), fov(26.4, -2.4, 0.9, 0.6, P.scale.sh2, 0, 8));
    s.push(fp([[19, 4.3], [21, 4.3], [20.2, 6.6 + jaw * 4]], '#fffaf2'), fp([[13, 4.8], [14.6, 4.8], [13.8, 6.4 + jaw * 3]], '#fffaf2'));
    // The eye: a slit-pupilled dragon eye under a scaled brow ridge.
    if (dead) s.push(...deadEye(12, -4, 2.2, { c: '#7a6aa8', th: 0.8 }));
    else {
      const act = actOf(mood, { idle: { lid: 0.28 }, angry: { lid: 0.1, slant: 0.9, raise: 0.3 }, happy: { closed: 'happy' } });
      s.push(...eye(12, -4, { shape: 'sharp', custom: { animal: true }, s: 1, w: 3.4, h: 2.5, iris: ['#2c6fb8', '#46ddff', '#d4fbff'], pupil: 'slit', pupilK: att >= 0 || angry ? 0.7 : 1, look: [0.6, 0.1], lashC: '#3a2a6b', ...act, ...(att >= 0 ? { lid: 0.06, slant: 0.7, raise: 0.2, closed: undefined } : {}) }));
    }
    s.push(...brow(11.6, -7.6, { s: 1, len: 4, angle: angry || att >= 0 ? 24 : hurt ? -22 : happy ? -6 : 6, th: 1.2, c: P.scale.sh2, shape: 'flat', arch: 0.1 }));
    s.push(...prism(1, -8, -Math.PI + 0.78 + (hurt ? 0.12 : 0), 15, 2.8, P.ice));
    out.push(...place(MH, s));
    // The crown rides the head (knocked askew when hurt; fallen to the floor when defeated).
    const crown = [pg([[-6, 1.2], [6, 1.2], [6.4, 3.8], [-6.4, 3.8]], P.gold.base), fp([[-6.4, 2.8], [6.4, 2.8], [6.4, 3.8], [-6.4, 3.8]], P.gold.sh)];
    [[-5, 5], [0, 7], [5, 5]].forEach(([x, hgt]) => crown.push(pg([[x - 2, 1.4], [x, 1.4 - hgt], [x + 2, 1.4]], P.gold.base), fp([[x, 1.4 - hgt], [x + 2, 1.4], [x + 0.6, 1.4]], P.gold.sh)));
    crown.push(fp([[-1.4, 0.4 - 6], [0.2, -7], [0.4, 1]], P.gold.hi));
    crown.push(...gemDot(-5, -3.4, 1.1, P.ice), ...gemDot(5, -3.4, 1.1, P.mint), ...gemDot(0, 2.4, 1.3, P.rose));
    const MC = dead ? joint(ID, 124, floor - 4, 0.5) : joint(MH, 5, -11.6, hurt ? -0.35 : -0.08);
    out.push(...place(MC, crown));
  }

  // The scepter arm: the hand is placed by IK; the scepter rides the hand. Resting it stands
  // tall; the slam winds it overhead and back, then swings it down into the floor.
  {
    const S = at(MB, 12, -29);
    let tgt = [S[0] + 13, S[1] + 13 + (walk ? Math.sin(2 * p - 1) : 0)];
    let ang = -Math.PI / 2 + 0.12 + (walk ? 0.04 * Math.sin(2 * p - 1.4) : 0.02 * Math.sin(it - 1));
    if (dead) {
      tgt = [S[0] + 8, S[1] + 22];
      ang = 0;
    } else if (att >= 0) {
      tgt = [[S[0] - 2, S[1] - 24], [S[0] - 9, S[1] - 25], [S[0] + 26, S[1] + 24], [S[0] + 25, S[1] + 23], [S[0] + 18, S[1] + 14]][att];
      ang = [-Math.PI / 2 - 0.45, -Math.PI / 2 - 0.95, 1.2, 1.18, -Math.PI / 2 + 0.5][att];
    } else if (angry) ang += 0.3;
    if (hurt && att < 0) ang -= 0.3;
    const [El, Hd] = ik(S, tgt, 14, 14, -1);
    const sc = [];
    const d = [Math.cos(ang), Math.sin(ang)];
    const base = dead ? [96, floor - 2] : Hd;
    const dd = dead ? [1, 0] : d;
    const topP = [base[0] + dd[0] * 30, base[1] + dd[1] * 30];
    const pom = [base[0] - dd[0] * 10, base[1] - dd[1] * 10];
    if (att === 2) sc.push(...rswoosh(S[0], S[1], 52, -120, 52, 7, P.ice[1], '#ffffff'));
    sc.push(...limb([pom, topP], 2.4, 2.2, P.gold.base, P.gold.sh2), F(rtaper([[pom[0] + 0.6, pom[1] - 0.6], [topP[0] + 0.6, topP[1] - 0.6]], 0.7, 0.7, P.gold.hi)));
    sc.push(...rball(pom[0], pom[1], 2.4, 2.4, P.gold));
    const nx = -dd[1];
    const ny = dd[0];
    [-1, 1].forEach((k) => sc.push(F(rtaper([[topP[0] - dd[0] * 3, topP[1] - dd[1] * 3], [topP[0] + nx * k * 3.4, topP[1] + ny * k * 3.4], [topP[0] + dd[0] * 4 + nx * k * 3, topP[1] + dd[1] * 4 + ny * k * 3]], 1.4, 0.6, P.gold.sh))));
    const charge = att === 0 || att === 1;
    if (charge) sc.push(star(topP[0] + dd[0] * 6, topP[1] + dd[1] * 6, 7 + att * 4, mix(P.ice[2], '#ffffff', 0.3)));
    sc.push(...prism(topP[0] - dd[0], topP[1] - dd[1], Math.atan2(dd[1], dd[0]), 12, 4, P.ice));
    if (!dead) {
      out.push(...limbR([S, El], 6, 5, P.scale), ...limbR([El, Hd], 5, 4, P.scale));
      out.push(...sc);
      out.push(...rball(Hd[0], Hd[1], 3.4, 3.2, P.scale), F(rtaper([[Hd[0] - 1.4, Hd[1] - 2], [Hd[0] + 2.4, Hd[1] + 0.4]], 0.8, 0.6, P.scale.sh2)));
    } else {
      out.push(...sc, ...limbR([S, El], 6, 5, P.scale), ...limbR([El, Hd], 5, 4, P.scale), ...rball(Hd[0], Hd[1], 3.4, 3.2, P.scale));
    }
  }

  // The slam: a floor glow under the charging prism, then the crystal burst where it strikes,
  // shards erupting from the floor and shrinking back as the flash fades.
  const impX = 118;
  if (!dead && att >= 0) {
    if (att < 2) out.push(fp(ringPts(impX, floor - 1.6, 9 + att * 5, 1.8 + att * 0.6, 1.4), mix(P.ice[1], '#ffffff', 0.25 + att * 0.25)));
    else {
      const k = [0, 0, 0.2, 0.6, 1][att];
      const g = [0, 0, 1, 0.85, 0.4][att];
      const rx = Math.min(8 + k * 22, 28);
      out.push(fp(ringPts(Math.min(impX, 148 - rx), floor - 1.6 - k * 1.4, rx, 2 + k * 2.6, 2), mix(P.ice[1], '#ffffff', 0.45 - k * 0.2)));
      [[-20, -0.5, 12, P.ice], [-11, -0.25, 18, P.lilac], [-3, 0, 22, P.ice], [8, 0.2, 16, P.rose], [16, 0.45, 10, P.ice]].forEach(([ox, a, l, K]) => {
        if (l * g < 2) return;
        out.push(...prism(impX + ox, floor + 0.5, -Math.PI / 2 + a, l * g, 2.4 + l * 0.08, K));
      });
      if (att === 2) out.push(star(impX, floor - 8, 14, P.ice[2]), star(impX, floor - 8, 6.4, '#ffffff'));
      for (let i = 0; i < 3; i++) out.push(star(impX - 16 + i * 14, floor - 14 - k * 16 - (i % 2) * 6, 1.6 + (1 - k) * 1.2, i % 2 ? '#ffffff' : P.ice[2]));
    }
  }
  // A glint drifting off the wings at rest.
  if (!dead && att < 0) {
    const u = (f % (walk ? 8 : 6)) / (walk ? 8 : 6);
    out.push(star(30 + u * 20, 40 - u * 12, 1.4 + Math.sin(u * Math.PI) * 1.4, '#ffffff'));
  }
  const sq = key(att, [0.012, -0.004, -0.03, -0.015, 0], walk ? -Math.max(0, Math.cos(2 * p - 0.5)) * 0.015 : 0.006 * br);
  return { w: 150, h: 150, res: 3, shapes: squash(out, 70, floor, 1 - sq * 0.5, 1 + sq) };
}

// ---------- Prismaris, the Crystal King, rigged ----------
// (2026-11-03, the boss reanimation.) A live skeleton (render/mobs/rig.js) on the same bones as his
// frames: crystal wings that beat and fold back on springs, a six-segment tail with crystal spines
// that sways a beat behind, digitigrade legs whose feet stay planted (two-bone reach, live), a
// three-segment neck carrying his head, a jaw that drops open, a crown that wobbles, and his
// scepter arm, also reaching live, winding the scepter overhead and smashing it down so crystals
// erupt from the floor. Rig space: the floor at (0, 0), his hips' joint above it.
const DKP = (key, w, h, ox, oy, shapes) => part(`crystal|${key}`, w, h, () => place(joint(ID, ox, oy), shapes()));
const dragonWing = (far) => {
  const P = DK;
  const a1 = -1.95 + (far ? 0.3 : 0);
  const E = [Math.cos(a1) * 18, Math.sin(a1) * 18];
  const a2 = a1 + 0.5;
  const W = [E[0] + Math.cos(a2) * 18, E[1] + Math.sin(a2) * 18];
  const tips = [-0.95, -1.5, -2.1, -2.6].map((d, k) => {
    const a = a2 + d;
    const l = [26, 30, 30, 26][k];
    return [W[0] + Math.cos(a) * l, W[1] + Math.sin(a) * l];
  });
  const KS = far ? [dimK(P.lilac), dimK(P.ice), dimK(P.rose)] : [P.lilac, P.ice, P.rose];
  const R = far ? P.far : P.scale;
  const root = [0, 0];
  const res = [...pane(W, tips[0], tips[1], KS[0]), ...pane(W, tips[1], tips[2], KS[1]), ...pane(W, tips[2], tips[3], KS[2]), ...pane(W, tips[3], root, KS[0])];
  tips.forEach((t) => res.push(...limb([W, t], 2.4, 0.8, R.sh)));
  res.push(...limbR([root, E, W], 5, 3.4, R), ...rball(W[0], W[1], 2.6, 2.6, P.gold), ...rball(E[0], E[1], 2.2, 2.2, P.gold));
  return res;
};
const CK = {
  wing: (far) => DKP(`wing|${far}`, 72, 84, 58, 74, () => dragonWing(far)),
  tailSeg: (i, len, w0, w1) => DKP(`tail|${i}`, len + w0 + 14, w0 + 22, w0 / 2 + 2, w0 / 2 + 14, () => {
    const out = [];
    if (i >= 1 && i <= 4) out.push(...prism(len * 0.2, 4 + w0 * 0.35, Math.PI / 2 - 0.45, [8, 7, 6, 5][i - 1], [2.4, 2.2, 1.9, 1.6][i - 1], i % 2 ? DK.rose : DK.ice, i < 3));
    out.push(...limbR([[0, 0], [len, 0]], w0, w1, DK.scale));
    return out;
  }),
  tailTip: () => DKP('tailtip', 30, 30, 4, 15, () => [[-0.55, 8, DK.ice], [0.5, 7, DK.rose], [-0.02, 10, DK.lilac]].flatMap(([d, l, K]) => prism(0, 0, d, l, 2.3, K))),
  thigh: (far) => DKP(`thigh|${far}`, 34, 26, 11, 13, () => {
    const R = far ? DK.far : DK.scale;
    return [...rball(0, 0, 9, 11, R), ...limbR([[0, 0], [17, 0]], 11, 8, R)];
  }),
  shin: (far) => DKP(`shin|${far}`, 26, 14, 5, 7, () => [...limbR([[0, 0], [15, 0]], 7, 5, far ? DK.far : DK.scale)]),
  // The foot, level, from the ankle at its origin; the toe on the floor 8 px below.
  foot: (far) => DKP(`foot|${far}`, 24, 16, 6, 4, () => {
    const R = far ? DK.far : DK.scale;
    return [pg([[-3.4, -2], [3, -3], [11, 4.4], [12.6, 8], [-4, 8]], R.base), fp([[-4, 6.6], [12.6, 6.6], [12.6, 8], [-4, 8]], R.sh2), ...prism(11.6, 6.2, 0.35, 4.4, 1.3, DK.ice, false), ...prism(7.6, 6.4, 0.45, 3.6, 1.1, DK.ice, false)];
  }),
  // The far arm tucked at his chest and the crystal spines down his back (behind the torso).
  back: () => DKP('back', 50, 50, 24, 44, () => {
    const backA = -Math.PI / 2 - 0.75;
    const Sf = [4, -30];
    const hf = [Sf[0] + 16, Sf[1] + 8];
    return [...prism(-12, -20, backA - 0.15, 9, 2.6, DK.ice), ...prism(-7, -30, backA, 9, 2.6, DK.rose), ...limbR([Sf, [Sf[0] + 7, Sf[1] + 9], hf], 5, 3.6, DK.far), ...rball(hf[0], hf[1], 2.6, 2.4, DK.far)];
  }),
  torso: () => DKP('torso', 44, 62, 21, 46, () => [
    C(pg([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [7, -41], [15, -36], [18, -22], [17, -6], [11, 8], [-2, 13]], DK.scale.base)),
    fp([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [-1, -33], [-8, -21], [-11, -6], [-7, 10]], DK.scale.sh),
    fp([[-7, 10], [-2, 13], [11, 8], [8, 5], [-2, 8]], DK.scale.sh),
    pg([[7, -36], [14, -32], [16, -20], [14, -4], [8, 8], [2, 8], [7, -6], [9, -20], [4, -33]], DK.belly.base),
    fp([[2, 8], [7, -6], [9, -20], [4, -33], [6, -34], [11, -20], [10, -6], [6, 8]], DK.belly.sh),
    ...[[-18, 9.6, 15], [-10, 9.4, 15.4], [-2, 8.4, 14.4]].map(([y, x0, x1]) => F(rtaper([[x0, y], [x1, y + 1]], 0.7, 0.7, DK.belly.sh))),
    fp([[7, -39], [13, -36], [12, -33], [6, -35]], DK.scale.hi),
    pg([[7, -31], [15, -31], [15, -26], [11, -22], [7, -26]], DK.gold.base),
    fp([[7, -27.5], [11, -24.5], [11, -22], [7, -26]], DK.gold.sh),
    ...gemDot(11, -27.4, 2.3, DK.rose),
    ...[[-2, -34], [2, -37.5], [7, -39.5], [12, -39], [16.5, -36.5]].flatMap(([x, y]) => [fov(x - 0.5, y + 0.6, 3.4, 3, DK.ermine.sh, 0, 12), fov(x + 0.3, y - 0.3, 2.9, 2.5, DK.ermine.base, 0, 12)]),
    fov(4.6, -36, 0.9, 1.4, DK.mouth, 0, 8),
    fov(14.4, -35.6, 0.9, 1.4, DK.mouth, 0, 8),
  ]),
  neckSeg: (i, len, w0, w1) => DKP(`neck|${i}`, len + w0 + 4, w0 + 4, w0 / 2 + 2, w0 / 2 + 2, () => [...limbR([[0, 0], [len, 0]], w0, w1, DK.scale), F(rtaper([[0, w0 * 0.24], [len, w1 * 0.24]], 4, 3, DK.belly.base))]),
  headBack: () => DKP('headback', 34, 30, 26, 18, () => [...prism(-1, -8, -Math.PI + 0.55, 13, 2.3, dimK(DK.ice)), ...prism(-4, 2.4, Math.PI - 0.15, 8, 2, DK.rose, false), ...prism(-4, 4, Math.PI + 0.35, 6.5, 1.8, DK.rose, false)]),
  // The jaw from its hinge, with the mouth's dark inside above it (shown as it drops open).
  jaw: () => DKP('jaw', 30, 16, 5, 8, () => [fp([[0, -5], [21, -4], [20, 0], [0, 0]], DK.mouth), pg([[-3, -1], [20, 0], [23, 2], [12, 6], [-2, 5]], DK.scale.sh), fp([[0, 2], [18, 1.6], [12, 4.6], [0, 4]], DK.belly.sh), fp([[15, -0.2], [17, -0.2], [16.2, -2.6]], '#fffaf2')]),
  head: (mood, atk) => DKP(`head|${mood}|${atk}`, 50, 38, 14, 26, () => {
    const out = [];
    const angry = mood === 'angry' || atk;
    out.push(C(pg([[-7, -2], [-3, -9], [6, -12], [16, -9], [24, -5], [29, -2], [29, 2], [22, 4.5], [8, 5], [-3, 6]], DK.scale.base)));
    out.push(fp([[-7, -2], [-3, -9], [0, -9.6], [-3, 4], [-3, 6]], DK.scale.sh), fp([[-3, 6], [8, 5], [22, 4.5], [29, 2], [27, 3.2], [21, 3], [8, 3.4], [-3, 3.6]], DK.scale.sh));
    out.push(fp([[14, -9.4], [24, -5.2], [22.4, -4.2], [14, -7.8]], DK.scale.hi), fov(26.4, -2.4, 0.9, 0.6, DK.scale.sh2, 0, 8));
    out.push(fp([[19, 4.3], [21, 4.3], [20.2, 6.8]], '#fffaf2'), fp([[13, 4.8], [14.6, 4.8], [13.8, 6.6]], '#fffaf2'));
    if (mood === 'dead') out.push(...deadEye(12, -4, 2.2, { c: '#7a6aa8', th: 0.8 }));
    else {
      const act = actOf(mood, { idle: { lid: 0.28 }, angry: { lid: 0.1, slant: 0.9, raise: 0.3 }, happy: { closed: 'happy' } });
      out.push(...eye(12, -4, { shape: 'sharp', custom: { animal: true }, s: 1, w: 3.4, h: 2.5, iris: ['#2c6fb8', '#46ddff', '#d4fbff'], pupil: 'slit', pupilK: angry ? 0.7 : 1, look: [0.6, 0.1], lashC: '#3a2a6b', ...act, ...(atk ? { lid: 0.06, slant: 0.7, raise: 0.2, closed: undefined } : {}) }));
    }
    out.push(...brow(11.6, -7.6, { s: 1, len: 4, angle: angry ? 24 : mood === 'hurt' ? -22 : mood === 'happy' ? -6 : 6, th: 1.2, c: DK.scale.sh2, shape: 'flat', arch: 0.1 }));
    out.push(...prism(1, -8, -Math.PI + 0.78, 15, 2.8, DK.ice));
    return out;
  }),
  crown: () => DKP('crown', 18, 16, 8, 10, () => {
    const crown = [pg([[-6, 1.2], [6, 1.2], [6.4, 3.8], [-6.4, 3.8]], DK.gold.base), fp([[-6.4, 2.8], [6.4, 2.8], [6.4, 3.8], [-6.4, 3.8]], DK.gold.sh)];
    [[-5, 5], [0, 7], [5, 5]].forEach(([x, hgt]) => crown.push(pg([[x - 2, 1.4], [x, 1.4 - hgt], [x + 2, 1.4]], DK.gold.base), fp([[x, 1.4 - hgt], [x + 2, 1.4], [x + 0.6, 1.4]], DK.gold.sh)));
    crown.push(...gemDot(-5, -3.4, 1.1, DK.ice), ...gemDot(5, -3.4, 1.1, DK.mint), ...gemDot(0, 2.4, 1.3, DK.rose));
    return crown;
  }),
  upper: () => DKP('upper', 22, 12, 4, 6, () => [...limbR([[0, 0], [14, 0]], 6, 5, DK.scale)]),
  fore: () => DKP('fore', 22, 12, 4, 6, () => [...limbR([[0, 0], [14, 0]], 5, 4, DK.scale), ...rball(14, 0, 3.4, 3.2, DK.scale)]),
  // The scepter along +x from the grip: the gold pom behind, the crystal-topped head ahead.
  scepter: () => DKP('scepter', 64, 18, 14, 9, () => {
    const out = [...limb([[-10, 0], [30, 0]], 2.4, 2.2, DK.gold.base, DK.gold.sh2), ...rball(-10, 0, 2.4, 2.4, DK.gold)];
    [-1, 1].forEach((k) => out.push(F(rtaper([[27, 0], [30, k * 3.4], [34, k * 3]], 1.4, 0.6, DK.gold.sh))));
    out.push(...prism(29, 0, 0, 12, 4, DK.ice));
    return out;
  }),
};
const CK_SHOULDER = [12, -29];
const CK_HIPS = [[-4, 2, -6], [4, 4, 10]];
const crystalRig = makeRig({
  w: 100,
  h: 130,
  stride: 1e9,
  fast: ['by', 'pitch', 'headA', 'neckA', 'jaw', 'sc', 'up', 'fo'],
  kick: { pitch: -1.4, crown: 4, flapF: 3 },
  springs: { crown: [80, 5], flapF: [70, 5], flapN: [80, 6], t0: [120, 9], t1: [100, 8], t2: [85, 7], t3: [70, 6], t4: [60, 5], t5: [50, 4.5] },
  pose(m, a) {
    const t = a.t;
    const wp = t * 4.2;
    const idle = { by: -0.9 * Math.sin(t * 2), pitch: 0.14 + 0.012 * Math.sin(t * 1.2 - 0.6), headA: 0.04 * Math.sin(t * 1.2 - 1.4), neckA: 0, jaw: 0.04, flap: 0.06 * Math.sin(t * 1.2 - 1.9), arm: 0, stepA: 0 };
    const walk = { by: 2.2 * Math.cos(2 * wp - 0.5), pitch: 0.16 + 0.025 * Math.sin(2 * wp - 1), headA: -0.04 * Math.sin(2 * wp - 1.8), neckA: 0, jaw: 0.04, flap: 0.08 * Math.sin(2 * wp - 1.6), arm: 0, stepA: 1 };
    const antic = { by: -2.5, pitch: -0.04, headA: -0.28, neckA: -0.14, jaw: 0.42, flap: -0.42, arm: -1, stepA: 0 };
    const strike = { by: 4, pitch: 0.34, headA: 0.2, neckA: 0.12, jaw: 0.5, flap: 0.25, arm: 1, stepA: 0 };
    const P = stateBlend(a, idle, walk, antic, strike);
    // The legs and the scepter arm reach live (two-bone), for where the body is now.
    const c = Math.cos(P.pitch);
    const sn = Math.sin(P.pitch);
    const bodyY = -37 + P.by;
    const toWorld = ([x, y]) => [x * c - y * sn, bodyY + x * sn + y * c];
    const toBody = ([x, y]) => {
      const dy = y - bodyY;
      return [x * c + dy * sn, -x * sn + dy * c];
    };
    CK_HIPS.forEach(([hx, hy, home], k) => {
      const ph = wp + (k ? 0 : Math.PI);
      const ox = P.stepA * Math.sin(ph) * 7;
      const lift = P.stepA * Math.max(0, Math.cos(ph)) * 7;
      const hip = toWorld([hx, hy]);
      const [kn, an] = ik(hip, [home + ox - 6, -8 - lift], 17, 15, 1);
      const th = Math.atan2(kn[1] - hip[1], kn[0] - hip[0]);
      const sh = Math.atan2(an[1] - kn[1], an[0] - kn[0]);
      P[`th${k}`] = th - P.pitch;
      P[`sh${k}`] = sh - th;
      P[`ft${k}`] = -sh;
    });
    // The scepter hand's target from the shoulder, and the scepter's own angle, by the arm's state.
    const k = P.arm;
    const tgt = k < 0 ? [lerp(13, -9, -k), lerp(13, -25, -k)] : [lerp(13, 26, k), lerp(13, 24, k)];
    const S = CK_SHOULDER;
    const [El, Hd] = ik(S, [S[0] + tgt[0], S[1] + tgt[1]], 14, 14, -1);
    P.up = Math.atan2(El[1] - S[1], El[0] - S[0]);
    P.fo = Math.atan2(Hd[1] - El[1], Hd[0] - El[0]) - P.up;
    P.sc = k < 0 ? lerp(-Math.PI / 2 + 0.12, -Math.PI / 2 - 0.95, -k) : lerp(-Math.PI / 2 + 0.12, 1.2, k);
    P.sc -= P.up + P.fo;
    return P;
  },
  follow: (S, a) => {
    const tw = (k) => 0.06 * Math.sin(a.t * 1.2 - 2.2 - k * 0.7) - S.pitch * 0.2;
    return { flapF: S.flap + 0.06 * Math.sin(a.t * 1.2 - 2.4), flapN: S.flap, crown: -0.08 - S.headA * 0.6, t0: Math.PI - 0.9 - S.pitch * 1.4, t1: 0.13 + tw(1), t2: 0.13 + tw(2), t3: 0.13 + tw(3), t4: 0.13 + tw(4), t5: 0.13 + tw(5) };
  },
  parts: [
    { name: 'body', at: (S) => [0, -37 + S.by], rot: (S) => S.pitch },
    { name: 'wingF', parent: 'body', pivot: [58, 74], at: () => [2, -35], rot: (S) => S.flapF, s: () => CK.wing(true) },
    ...chainParts('t', { parent: 'body', at: () => [-10, 6], key: 'crystal|tail', segs: [9, 8, 7, 6, 5.5, 5].map((l, i) => [l, 13 - (10 * i) / 6, 13 - (10 * (i + 1)) / 6]), rot: (S, a, i) => S[`t${i}`] }).map((p, i) => {
      const len = [9, 8, 7, 6, 5.5, 5][i];
      const w0 = 13 - (10 * i) / 6;
      const w1 = 13 - (10 * (i + 1)) / 6;
      return { ...p, pivot: [w0 / 2 + 2, w0 / 2 + 14], s: () => CK.tailSeg(i, len, w0, w1) };
    }),
    { name: 'tailTip', parent: 't5', pivot: [4, 15], at: () => [5, 0], s: () => CK.tailTip() },
    { name: 'th0', parent: 'body', pivot: [11, 13], at: () => [-4, 2], rot: (S) => S.th0, s: () => CK.thigh(true) },
    { name: 'sh0', parent: 'th0', pivot: [5, 7], at: () => [17, 0], rot: (S) => S.sh0, s: () => CK.shin(true) },
    { name: 'ft0', parent: 'sh0', pivot: [6, 4], at: () => [15, 0], rot: (S) => S.ft0, s: () => CK.foot(true) },
    { name: 'back', parent: 'body', pivot: [24, 44], at: () => [0, 0], s: () => CK.back() },
    { name: 'torso', parent: 'body', pivot: [21, 46], at: () => [0, 0], s: () => CK.torso() },
    { name: 'th1', parent: 'body', pivot: [11, 13], at: () => [4, 4], rot: (S) => S.th1, s: () => CK.thigh(false) },
    { name: 'sh1', parent: 'th1', pivot: [5, 7], at: () => [17, 0], rot: (S) => S.sh1, s: () => CK.shin(false) },
    { name: 'ft1', parent: 'sh1', pivot: [6, 4], at: () => [15, 0], rot: (S) => S.ft1, s: () => CK.foot(false) },
    { name: 'wingN', parent: 'body', pivot: [58, 74], at: () => [-4, -32], rot: (S) => S.flapN, s: () => CK.wing(false) },
    ...[0, 1, 2].map((i) => ({ name: `n${i}`, parent: i ? `n${i - 1}` : 'body', pivot: [[11, 10.1, 9.2][i] / 2 + 2, [11, 10.1, 9.2][i] / 2 + 2], at: i ? () => [8, 0] : () => [10, -38], rot: (S) => (i ? -0.15 : -Math.PI / 2 + 0.55 + S.neckA), s: () => CK.neckSeg(i, 8, [11, 10.1, 9.2][i], [10.1, 9.2, 8.4][i]) })),
    { name: 'headJ', parent: 'n2', at: () => [8, 0], rot: (S) => S.headA - 0.7 * S.pitch - (-Math.PI / 2 + 0.55 + S.neckA - 0.3) },
    { name: 'headBack', parent: 'headJ', pivot: [26, 18], at: () => [0, 0], s: () => CK.headBack() },
    { name: 'jaw', parent: 'headJ', pivot: [5, 8], at: () => [2, 3], rot: (S) => S.jaw, s: () => CK.jaw() },
    { name: 'head', parent: 'headJ', pivot: [14, 26], at: () => [0, 0], s: (a) => CK.head(a.face, a.atk) },
    { name: 'crown', parent: 'headJ', pivot: [8, 10], at: () => [5, -11.6], rot: (S) => S.crown, s: () => CK.crown() },
    { name: 'up', parent: 'body', pivot: [4, 6], at: () => CK_SHOULDER, rot: (S) => S.up, s: () => CK.upper() },
    { name: 'fo', parent: 'up', pivot: [4, 6], at: () => [14, 0], rot: (S) => S.fo, s: () => CK.fore() },
    { name: 'scepter', parent: 'fo', pivot: [14, 9], at: () => [14, 0], rot: (S) => S.sc, s: () => CK.scepter() },
  ],
  fx(ctx, m, a) {
    // The slam: a glowing ring on the floor and crystals erupting where the scepter strikes.
    const x0 = 52;
    if (a.ph.antic > 0.2) {
      ctx.globalAlpha = a.alpha * a.ph.antic * 0.6;
      ctx.fillStyle = '#dffaff';
      ctx.beginPath();
      ctx.ellipse(x0, -1, 9 + a.ph.antic * 6, 2 + a.ph.antic, 0, 0, TAU);
      ctx.fill();
    }
    if (a.ph.since >= 0 && a.ph.since < 0.7) {
      const u = a.ph.since / 0.7;
      const g = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
      for (const [ox, ang, l, c] of [[-20, -0.5, 12, '#9fe3f8'], [-11, -0.25, 18, '#b9a8ff'], [-3, 0, 22, '#9fe3f8'], [8, 0.2, 16, '#f2a0d4'], [16, 0.45, 10, '#9fe3f8']]) {
        const len = l * g;
        if (len < 2) continue;
        const d = -Math.PI / 2 + ang;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x0 + ox - 2.4, 0);
        ctx.lineTo(x0 + ox + Math.cos(d) * len, Math.sin(d) * len);
        ctx.lineTo(x0 + ox + 2.4, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x0 + ox + Math.cos(d) * len * 0.6 - 0.5, Math.sin(d) * len * 0.6, 1, 2);
      }
    }
  },
});

export const ART = {
  crystalking: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 450, 240], draw: dragon, rig: crystalRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  crystalking: { name: 'Prismaris, the Crystal King', w: 100, h: 130 },
};
