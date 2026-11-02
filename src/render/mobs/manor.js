// Monster art: the Moonlit Manor monsters (the levels 15-20 group dungeon, 2026-11, see
// docs/design/moonlit-manor.md), built on the manor rig (manorrig.js: a new, taller humanoid
// skeleton keyed per animation and blended with eased in-betweens).
//   porcelaindoll  Porcelain Doll: a life-size ball-jointed doll with ringlets, a frilled dress and
//                  a lace parasol; stiff little doll steps, an eerie head tilt, a parasol jab.
// All face right, feet at the bottom.

import { mix, shade } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, poseAt, solve, plant, limb3, inHead, drawRig } from './manorrig.js';

const { XY, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, crownHair, bangEdge, backHair, face, faceTop, round, soften, lerp, TAU } = KIT;

// ---------- Porcelain Doll ----------

const PD = soften({
  skin: '#fff6f2', skinDk: '#f0dcd8', joint: '#f4e2de', jointDk: '#dcc4c2',
  hair: '#ffe0a0', hairDk: '#e8b860', hairLt: '#fff4d6',
  dress: '#ffb3cf', dressDk: '#ee88ae', dressLt: '#ffd6e6', frill: '#ffffff', frillDk: '#eadcf0',
  bow: '#9a7ad8', bowDk: '#7656b8', sock: '#ffffff', sockDk: '#e6e0f2', shoe: '#7a3a5a', shoeLt: '#a85a80',
  lace: '#ffffff', laceDk: '#e8dcf0', trim: '#ff8fb8', shaft: '#c99a6b', crack: '#c8a8b0',
});
// Glass doll eyes: very round, a clear sky blue with a bright ring, long lashes, a fixed little smile.
const DOLL_FACE = {
  skin: PD.skin, skinSh: '#f0dcd8', skinSh2: '#d8b4b8', blush: '#ff9fbf', lip: '#e0607e', lipLine: '#a83a58',
  eye: { nearX: 2.2, farX: 9.5, rx: 3.5, ry: 3.3, far: 0.84, tilt: -0.1, iris: '#7fbcff', irisDk: '#2a5aa8', irisLt: '#dff0ff', hot: '#ff5f8f', hotDk: '#8a1a4a', pupil: 'round', pupilC: '#1a2a5a', ink: '#3a2a4a', wing: 0.8, flicks: 3, lashLen: 1.2, crease: false, lower: '#e6c4c8', jewel: true },
  brow: { c: '#d8a860', kind: 'soft', w: 0.65 },
  moods: { idle: { open: 0.95, mouth: 'smile', gaze: [0, 0] }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } },
};
const DOLL_FRINGE = [[-2.4, -4.6, -2.6, 1.6, 3, -0.2], [-0.4, -5.6, -0.2, 0.8, 3.2, 0], [2, -5.6, 2.4, 0.8, 3.2, 0], [4.4, -5, 4.8, 1, 3, 0.2], [6.4, -3.6, 7, 2, 2.2, 0.2]];

// Keys. Arms: [back, front] as [shoulder, elbow]; legs [back, front] as [hip, knee]. The front hand
// holds the parasol over her shoulder.
const PARASOL_ARM = [0.3, -1.5];
const DOLL_WALK = [
  { hip: [36, 46], lean: 0.04, tilt: -0.06, arms: [[-0.3, -0.15], PARASOL_ARM], legs: [[-0.32, 0.12], [0.3, 0.02]], parasol: -0.62 },
  { hip: [36, 44.6], lean: 0.04, tilt: 0.02, arms: [[0, -0.2], PARASOL_ARM], legs: [[-0.05, 0.55], [0.06, 0.02]], parasol: -0.66 },
  { hip: [36, 46], lean: 0.04, tilt: 0.06, arms: [[0.3, -0.25], PARASOL_ARM], legs: [[0.3, 0.02], [-0.32, 0.12]], parasol: -0.62 },
  { hip: [36, 44.6], lean: 0.04, tilt: -0.02, arms: [[0, -0.2], PARASOL_ARM], legs: [[0.06, 0.02], [-0.05, 0.55]], parasol: -0.58 },
];
// Idle: she stands with her heels together, then her head tilts slowly over, too far, and back.
const DOLL_IDLE = [
  { hip: [36, 46], lean: 0, tilt: 0, arms: [[0.05, -0.4], PARASOL_ARM], legs: [[-0.05, 0], [0.06, 0]], parasol: -0.62 },
  { hip: [36, 46], lean: 0, tilt: 0.34, arms: [[0.05, -0.45], PARASOL_ARM], legs: [[-0.05, 0], [0.06, 0]], parasol: -0.66 },
  { hip: [36, 46], lean: 0, tilt: 0.4, arms: [[0.05, -0.45], PARASOL_ARM], legs: [[-0.05, 0], [0.06, 0]], parasol: -0.66 },
];
// Attack: she draws the parasol back, then jabs it forward like a rapier, holds, and recovers.
const DOLL_ATTACK = [
  { hip: [34, 46], lean: -0.08, tilt: -0.1, arms: [[0.4, -0.3], [-0.9, -1]], legs: [[-0.35, 0.15], [0.3, 0.05]], parasol: -2.6 },
  { hip: [39, 47], lean: 0.2, tilt: 0.12, arms: [[-0.6, -0.1], [1.45, -0.05]], legs: [[-0.5, 0.1], [0.5, 0.12]], parasol: 1.55 },
  { hip: [39, 47], lean: 0.18, tilt: 0.1, arms: [[-0.6, -0.1], [1.4, -0.08]], legs: [[-0.5, 0.1], [0.5, 0.12]], parasol: 1.5 },
  { hip: [37, 46], lean: 0.06, tilt: 0, arms: [[-0.1, -0.2], [0.8, -1.4]], legs: [[-0.2, 0.05], [0.2, 0.03]], parasol: -0.4 },
];

function dollPose(pose, f, mood) {
  // Defeated, she slumps onto her knees, head bowed, arms hanging.
  if (mood === 'dead') return { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], parasol: 1.9 };
  let P;
  if (pose === 'walk') P = poseAt(DOLL_WALK, f, 8);
  else if (pose === 'attack') P = poseAt(DOLL_ATTACK, f, 4, false);
  else P = poseAt([...DOLL_IDLE, DOLL_IDLE[0]], f, 6);
  if (mood === 'hurt') P = { ...P, lean: -0.22, tilt: -0.3, hip: [P.hip[0] - 1.5, P.hip[1]] };
  return P;
}

// A ball joint: a little porcelain sphere with a ring line, at an elbow, knee or shoulder.
const ball = (p, r, C) => [...ooval(p[0], p[1], r, r, C.joint), dot(p[0] - r * 0.3, p[1] - r * 0.35, r * 0.35, '#ffffff')];

// A ringlet: a spiral curl as a stack of shrinking coils.
function ringlet(x, y, n, r, H, sway) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const rr = r * (1 - i * 0.12);
    const cx = x + (i % 2 ? 0.5 : -0.5) + sway * i * 0.4;
    const cy = y + i * r * 1.35;
    out.push(...ooval(cx, cy, rr, rr * 0.85, H.c), fband(arcPts(cx, cy, rr * 0.7, rr * 0.55, 20, 200, 5), 0.5, H.sh, 1));
    out.push(dot(cx - rr * 0.4, cy - rr * 0.4, rr * 0.25, H.lt));
  }
  return out;
}

function porcelaindoll(pose, f, mood) {
  const C = fade(PD, mood);
  const dead = mood === 'dead';
  const P = dollPose(pose, f, mood);
  const S = plant(solve(P));
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const HR = { c: C.hair, sh: C.hairDk, sh2: mix(C.hairDk, '#8a5a3a', 0.35), lt: C.hairLt };
  const pAng = P.parasol;
  const hand = S.arms[1].hand;
  const dir = [Math.sin(pAng), -Math.cos(pAng)];
  const tip = [hand[0] + dir[0] * 17, hand[1] + dir[1] * 17];

  const legOf = (L, back) => {
    const out = [...limb3(L.hip, L.kn, L.ft, 3.4, 2.6, 2, back ? C.sockDk : C.sock)];
    out.push(...ball(L.kn, 1.5, C));
    // Mary Janes with a strap and a bow.
    const [fx, fy] = L.ft;
    out.push(...opoly(round([[fx - 1.6, fy - 1.6], [fx + 1.4, fy - 1.8], [fx + 3.4, fy - 0.4], [fx + 3.2, fy + 0.8], [fx - 1.8, fy + 0.8]], 2), back ? shade(C.shoe, -8) : C.shoe), line([[fx - 0.6, fy - 1.6], [fx + 1.6, fy - 1.4]], 0.5, C.shoeLt), dot(fx + 2.2, fy - 0.6, 0.6, C.trim));
    return out;
  };
  const armOf = (A, back) => [...limb3(A.sh, A.el, A.hand, 2.4, 2.1, 1.8, back ? C.skinDk : C.skin), ...ball(A.el, 1.3, C), ...ooval(A.hand[0], A.hand[1], 1.3, 1.2, back ? C.skinDk : C.skin)];

  const shapes = drawRig(S, {
    // The parasol's canopy behind her when held over her shoulder (in front when jabbing).
    // At rest the open parasol and its shaft stand behind her head; attacking, it is closed.
    behind: () => (pose === 'attack' || dead ? [] : [line([[hand[0] - dir[0] * 3, hand[1] - dir[1] * 3], tip], 0.7, C.shaft), ...parasol(tip, pAng, C, ph)]),
    backArm: () => [...armOf(S.arms[0], true), ...ooval(S.arms[0].sh[0], S.arms[0].sh[1] + 1, 2.4, 2.2, C.dressDk)],
    backLeg: () => legOf(S.legs[0], true),
    body: () => {
      const out = [];
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const sw = Math.sin(ph) * (pose === 'walk' ? 1 : 0.4);
      // The bell skirt in two tiers of frills, swaying, a petticoat peeking under it.
      const hem = hy + 12;
      out.push(...opoly(round([[hx - 4, hy - 1], [hx + 4, hy - 1], [hx + 10 + sw, hem], [hx - 10 + sw, hem]], 2), C.frill));
      for (let k = 0; k < 7; k++) out.push(...ooval(hx - 9 + sw + k * 3, hem + 0.4, 1.7, 1.1, C.frill, 0, 0.3));
      out.push(...opoly(round([[hx - 4.2, hy - 2], [hx + 4.2, hy - 2], [hx + 9 + sw, hem - 1.8], [hx - 9 + sw, hem - 1.8]], 2), C.dress));
      out.push(fpoly([[hx - 4.2, hy - 2], [hx - 1, hy - 2], [hx - 3 + sw, hem - 2], [hx - 9 + sw, hem - 1.8]], C.dressDk));
      for (const k of [-5, 0, 5]) out.push(line([[hx + k * 0.3, hy], [hx + k + sw, hem - 2.4]], 0.4, C.dressDk));
      for (let k = 0; k < 6; k++) out.push(...ooval(hx - 7.6 + sw + k * 3, hem - 1.6, 1.6, 1, C.dressLt, 0, 0.3));
      // Bodice with buttons, a ribbon sash, a lace collar, puffed sleeves.
      out.push(...opoly(round([[hx - 3.8, hy - 1], [hx + 3.8, hy - 1], [cx + 4.4, cy + 1], [cx + 3.4, cy - 1.6], [cx - 3.4, cy - 1.6], [cx - 4.4, cy + 1]], 1), C.dress));
      out.push(fpoly([[hx - 3.8, hy - 1], [hx - 1.4, hy - 1], [cx - 1.4, cy - 1.4], [cx - 3.4, cy - 1.6], [cx - 4.4, cy + 1]], C.dressDk));
      for (let k = 0; k < 3; k++) out.push(dot(lerp(hx, cx, 0.25 + k * 0.25) + 1, lerp(hy, cy, 0.25 + k * 0.25), 0.5, C.frill));
      out.push(...oband([[hx - 4.4, hy - 1.6], [hx + 4.4, hy - 1.6]], 1.6, C.bow, 1));
      out.push(...ooval(hx - 4.8, hy - 1.6, 2.4, 1.6, C.bow, -0.4), ...ooval(hx - 6.4, hy + 0.4, 1.8, 1.2, C.bow, 0.6), dot(hx - 4, hy - 1.4, 0.8, C.bowDk));
      for (let k = 0; k < 4; k++) out.push(...ooval(cx - 2.6 + k * 1.8, cy - 1.4, 1.1, 0.9, C.lace, 0, 0.3));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.6, 2.4, C.dress), dot(S.arms[1].sh[0] - 0.8, S.arms[1].sh[1], 0.7, C.dressLt));
      return out;
    },
    frontLeg: () => legOf(S.legs[1], false),
    head: () => [
      ...inHead(S, 1.2, () => {
        const out = [];
        // Ringlets behind, two each side, bouncing a beat behind her steps.
        const sway = Math.sin(ph - 0.8) * (pose === 'walk' ? 0.5 : 0.25);
        out.push(...backHair(HR, 6.4), ...ringlet(-6.2, 3, 4, 2.1, HR, sway), ...ringlet(-3.4, 4.6, 4, 1.9, HR, sway));
        out.push(...face(mood, { ...DOLL_FACE, bangs: bangEdge(DOLL_FRINGE) }));
        // The hairline crack in her porcelain cheek.
        if (!dead) out.push(line([[4.8, 2.6], [5.6, 3.8], [5, 4.6], [5.8, 5.6]], 0.3, C.crack));
        out.push(...ringlet(6.6, 3.2, 4, 2, HR, sway));
        out.push(...crownHair({ ...HR, fringe: DOLL_FRINGE }));
        out.push(...faceTop(mood, DOLL_FACE));
        // A big bow on top of her head.
        out.push(...ooval(-1.4, -8.6, 3.4, 2.2, C.bow, -0.3), ...ooval(4.4, -8.4, 3.2, 2.1, C.bow, 0.3), ...ooval(1.5, -8.2, 1.6, 1.6, C.bowDk), dot(-2.4, -9.4, 0.7, mix(C.bow, '#ffffff', 0.5)));
        return out;
      }),
    ],
    frontArm: () => {
      const out = [...armOf(S.arms[1], false)];
      // Her hand on the parasol's handle (the shaft rises behind her).
      if (pose !== 'attack' && !dead) out.push(dot(hand[0] - dir[0] * 0.6, hand[1] - dir[1] * 0.6, 0.9, C.trim));
      return out;
    },
    front: () => {
      if (pose !== 'attack') return [];
      // Jabbing: the closed parasol thrusts forward, a gleam at its point.
      const out = [...oband([[tip[0] - dir[0] * 10, tip[1] - dir[1] * 10], tip], taperW(3, 0.4), C.lace, 2), line([[tip[0] - dir[0] * 9, tip[1] - dir[1] * 9 - 0.6], tip], 0.4, C.trim)];
      if (f === 1) out.push(sparkle(tip[0] + 2, tip[1], 2.2, '#ffffff'), line([[tip[0] - 14, tip[1] - 2], [tip[0] - 4, tip[1] - 2]], 0.4, C.laceDk), line([[tip[0] - 12, tip[1] + 2], [tip[0] - 3, tip[1] + 2]], 0.4, C.laceDk));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// The lace parasol open behind her, a dome whose apex is the tip and whose scalloped rim hangs
// below it, rocking gently.
function parasol(tip, a, C, ph) {
  const out = [];
  const rock = Math.sin(ph) * 0.06;
  const d = [Math.sin(a + rock), -Math.cos(a + rock)];
  const pr = [-d[1], d[0]];
  const R = 11;
  const at2 = (k, drop) => [tip[0] + pr[0] * k * R - d[0] * drop, tip[1] + pr[1] * k * R - d[1] * drop];
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const k = -1 + i / 5;
    pts.push(at2(k, 6 * k * k));
  }
  for (let i = 10; i >= 0; i--) pts.push(at2(-1 + i / 5, 6.6));
  out.push(...opoly(pts, C.lace));
  for (let i = 0; i < 8; i++) {
    const p = at2(-0.875 + i * 0.25, 6.8);
    out.push(...ooval(p[0], p[1], 1.6, 1.1, i % 2 ? C.trim : C.lace, a, 0.3));
  }
  for (const k of [-0.55, 0, 0.55]) out.push(line([tip, at2(k, 6.4)], 0.35, C.laceDk));
  out.push(dot(tip[0], tip[1], 0.9, C.trim));
  return out;
}


// ---------- Shared costume pieces for the manor monsters ----------

// A bare or sleeved arm on the rig with a hand.
function armPart(A, c, cHand, w = 1) {
  return [...limb3(A.sh, A.el, A.hand, 2.4 * w, 2.1 * w, 1.8 * w, c), ...ooval(A.hand[0], A.hand[1], 1.3 * w, 1.2 * w, cHand)];
}
// A leg in a stocking with a simple shoe.
function legPart(L, c, shoe, w = 1) {
  const [fx, fy] = L.ft;
  return [...limb3(L.hip, L.kn, L.ft, 3.4 * w, 2.6 * w, 2 * w, c), ...opoly(round([[fx - 1.6 * w, fy - 1.6 * w], [fx + 1.4 * w, fy - 1.8 * w], [fx + 3.4 * w, fy - 0.4 * w], [fx + 3.2 * w, fy + 0.8 * w], [fx - 1.8 * w, fy + 0.8 * w]], 2), shoe)];
}
// A long gown from the waist to the floor (or into mist), swaying, with a shaded back panel and folds.
function gown(S, len, flare, c, cDk, sway, w = 1) {
  const [hx, hy] = S.hip;
  const hem = hy + len;
  const out = [...opoly(round([[hx - 4 * w, hy - 1.5], [hx + 4 * w, hy - 1.5], [hx + flare + sway, hem], [hx - flare + sway * 1.4, hem]], 2), c)];
  out.push(fpoly([[hx - 4 * w, hy - 1.5], [hx - 1 * w, hy - 1.5], [hx - flare * 0.4 + sway, hem], [hx - flare + sway * 1.4, hem]], cDk));
  for (const k of [-0.5, 0, 0.5]) out.push(line([[hx + k * 3 * w, hy], [hx + k * flare * 1.5 + sway, hem - 0.6]], 0.4, cDk));
  return { out, hem, hx };
}
// A bodice over the rig's torso, its back shaded.
function bodice(S, c, cDk) {
  const [hx, hy] = S.hip;
  const [cx, cy] = S.chest;
  return [
    ...opoly(round([[hx - 3.8, hy - 1], [hx + 3.8, hy - 1], [cx + 4.4, cy + 1], [cx + 3.4, cy - 1.6], [cx - 3.4, cy - 1.6], [cx - 4.4, cy + 1]], 1), c),
    fpoly([[hx - 3.8, hy - 1], [hx - 1.4, hy - 1], [cx - 1.4, cy - 1.4], [cx - 3.4, cy - 1.6], [cx - 4.4, cy + 1]], cDk),
  ];
}
// A head on the rig: back hair, the face, crown hair, the face's top layer, then `extra`.
function headPart(S, mood, look, fringe, HR, k, back, extra) {
  return inHead(S, k, () => [...(back ? back() : backHair(HR, 7)), ...face(mood, { ...look, bangs: bangEdge(fringe) }), ...crownHair({ ...HR, fringe }), ...faceTop(mood, look), ...(extra ? extra() : [])]);
}
const hairOf = (c, dk, lt, deep = '#4a3a6a') => ({ c, sh: dk, sh2: mix(dk, deep, 0.4), lt });
// A soft eye config, recoloured.
const eyes = (iris, irisDk, irisLt, o = {}) => ({ nearX: 2.3, farX: 9.6, rx: 3.4, ry: 2.8, far: 0.84, tilt: 0, iris, irisDk, irisLt, hot: '#ff6a9a', hotDk: '#8a1a4a', pupil: 'round', pupilC: '#1e1a3a', ink: '#33284a', wing: 0.9, flicks: 2, lashLen: 1, crease: false, lower: '#d8c4d0', jewel: true, ...o });
const BANGS = [[-2.4, -4.6, -3, 1, 3, -0.4], [-0.4, -5.6, -0.4, 0.6, 3.4, -0.2], [2, -5.6, 2.6, 1, 3.4, 0.3], [4.4, -5, 5.2, 0.2, 3, 0.4], [6.4, -3.6, 7.2, 2, 2.2, 0.3]];
const SWEPT = [[-2.4, -4.6, -3.4, 0.4, 3, -0.6], [-0.4, -5.6, -1.2, 0.8, 3.4, -0.5], [2, -5.6, 1, 2, 3.4, -0.3], [4.4, -5, 3.6, 2.6, 3.2, -0.2], [6.4, -3.6, 6.6, 2.8, 2.4, 0.2]];
// Pose picking with shared hurt and defeated handling.
function pick(pose, f, mood, K, opts = {}) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, opts.walk ?? 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, (opts.atk ?? 4) - 1, false);
  else P = poseAt([...K.idle, K.idle[0]], f, opts.idle ?? 6);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.22, tilt: -0.3, hip: [P.hip[0] - 1.5, P.hip[1]] };
  return P;
}
// A floating figure: hovers at its own hip height instead of standing on the ground.
const hover = (S, y) => S;
// Mist beads breaking off a wisp's tip.
function beads(tip, f, n, c) {
  const out = [];
  for (let k = 0; k < 3; k++) {
    const u = ((f / n) + k / 3) % 1;
    out.push(dot(tip[0] - 2 - u * 5, tip[1] - 1 - u * 3 + Math.sin(u * 6 + k), 0.9 * (1 - u) + 0.3, c));
  }
  return out;
}
// A ghostly wisp from `base`, curling back, rippling.
function wisp(base, ph, trail, len, w, C, f, n) {
  const pts = KIT.flowPts(base, Math.PI / 2 + 0.5 + trail * 0.3, 1.6 + trail * 0.4, len, ph * 1.3, 0.26, 6, 0.9);
  const out = [...oband(pts, (t) => lerp(w, 0.8, t ** 0.8), C.mist, 4)];
  const sp = KIT.spline(pts, 4);
  out.push(fband(sp.slice(1, Math.round(sp.length * 0.8)).map(([x, y]) => [x - 0.6, y + 0.8]), (t) => lerp(w * 0.45, 0.4, t), C.mistDk, 1));
  out.push(fband(sp.slice(0, Math.round(sp.length * 0.5)).map(([x, y]) => [x + 1.4, y - 0.6]), (t) => lerp(w * 0.22, 0.3, t), C.mistLt, 1));
  out.push(...beads(sp[sp.length - 1], f, n, C.mist));
  return out;
}

// ---------- Ghost Maid ----------
// A translucent maid floating on a curl of mist, feather duster in hand and a tray with a teacup.

const GM = soften({
  skin: '#f2f2ff', skinDk: '#dcdcf6', hair: '#cfc6f2', hairDk: '#a99cdc', hairLt: '#f2eeff',
  dress: '#7a68b8', dressDk: '#5a4a96', dressLt: '#9a8ad0', apron: '#ffffff', apronDk: '#e2e0f6', lace: '#ffffff',
  mist: '#e6ecff', mistDk: '#c4cff4', mistLt: '#ffffff', ribbon: '#ff9fc8', ribbonDk: '#e0709e',
  duster: '#ffd0e4', dusterDk: '#f0a0c4', handle: '#c99a6b', tray: '#e8e6f6', trayDk: '#c8c4e2', cup: '#ffffff', tea: '#e8b088',
});
const GM_FACE = { skin: GM.skin, skinSh: '#dcdcf6', skinSh2: '#b8b4e6', blush: '#c8b4ff', lip: '#9a7ad0', lipLine: '#6a52a8', eye: eyes('#9fb4ff', '#4a5aa8', '#e2eaff'), brow: { c: '#9a8ad0', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.72, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const TRAY = [0.9, -1.7];
const GM_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 42 + Math.sin((i / 4) * TAU) * 1], lean: 0.14, tilt: 0.04, arms: [TRAY, [0.7 + Math.sin((i / 4) * TAU) * 0.15, -1]], legs: [[0, 0], [0, 0]], duster: -1.1 })),
  idle: [
    { hip: [36, 41], lean: 0.02, tilt: 0.06, arms: [TRAY, [0.6, -1.1]], legs: [[0, 0], [0, 0]], duster: -1.2 },
    { hip: [36, 39.6], lean: 0.02, tilt: 0.1, arms: [TRAY, [0.9, -1.4]], legs: [[0, 0], [0, 0]], duster: -0.8 },
    { hip: [36, 40.4], lean: 0.02, tilt: 0.02, arms: [TRAY, [0.5, -0.9]], legs: [[0, 0], [0, 0]], duster: -1.4 },
  ],
  attack: [
    { hip: [34, 41], lean: -0.1, tilt: -0.1, arms: [[-0.4, -0.6], [-0.4, -2.4]], legs: [[0, 0], [0, 0]], duster: -2.6 },
    { hip: [39, 41], lean: 0.18, tilt: 0.12, arms: [[-0.6, -0.4], [1.5, -0.2]], legs: [[0, 0], [0, 0]], duster: 0.1 },
    { hip: [39, 41], lean: 0.14, tilt: 0.1, arms: [[-0.6, -0.4], [1.6, 0]], legs: [[0, 0], [0, 0]], duster: 0.3 },
    { hip: [37, 41], lean: 0.04, tilt: 0, arms: [TRAY, [0.8, -1]], legs: [[0, 0], [0, 0]], duster: -0.8 },
  ],
  dead: { hip: [32, 64], lean: 0.6, tilt: 0.5, arms: [[0.2, 0.2], [0.4, 0.2]], legs: [[0, 0], [0, 0]], duster: 1.4 },
};

function ghostmaid(pose, f, mood) {
  const C = fade(GM, mood);
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const P = pick(pose, f, mood, GM_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt);
  const trail = pose === 'walk' ? 1 : 0.4;
  const hand = S.arms[1].hand;
  const dA = P.duster;
  const tipD = [hand[0] + Math.cos(dA) * 9, hand[1] + Math.sin(dA) * 9];
  const tray = S.arms[0].hand;
  const shapes = drawRig(S, {
    behind: () => wisp([S.hip[0] - 0.6, S.hip[1] + 7], ph, trail, mood === 'dead' ? 9 : 17, 10, C, f, n),
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    body: () => {
      const g = gown(S, 8, 7, C.dress, C.dressDk, Math.sin(ph) * 0.6);
      const [hx, hy] = S.hip;
      const out = [...g.out, ...bodice(S, C.dress, C.dressDk)];
      // Apron with its frilled hem, the bib and its straps, a big bow behind.
      out.push(...opoly(round([[hx - 2.6, hy - 1.4], [hx + 3.2, hy - 1.4], [hx + 4.4, hy + 6], [hx - 3.4, hy + 6]], 2), C.apron), fpoly([[hx - 2.6, hy - 1.2], [hx - 0.8, hy - 1.2], [hx - 1.6, hy + 5.8], [hx - 3.4, hy + 5.8]], C.apronDk));
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - 2.8 + k * 1.75, hy + 6.2, 1, 0.7, C.lace, 0, 0.25));
      const [cx, cy] = S.chest;
      out.push(...opoly(round([[cx - 1.2, cy + 4], [cx + 3.6, cy + 4], [cx + 3.2, hy - 1.6], [cx - 1, hy - 1.6]], 1), C.apron), line([[cx - 1.2, cy + 4], [cx - 2.8, cy]], 0.6, C.apron), line([[cx + 3.4, cy + 4], [cx + 3.2, cy]], 0.6, C.apron));
      out.push(...ooval(hx - 5, hy - 1.6, 2.2, 1.5, C.ribbon, -0.3), ...ooval(hx - 6.4, hy, 1.8, 1.2, C.ribbon, 0.6), dot(hx - 4.2, hy - 1.4, 0.8, C.ribbonDk));
      for (let k = 0; k < 4; k++) out.push(...ooval(cx - 2.6 + k * 1.8, cy - 1.4, 1, 0.8, C.lace, 0, 0.25));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, 2.2, C.dressLt));
      return out;
    },
    head: () => headPart(S, mood, GM_FACE, BANGS, HR, 1.15, null, () => {
      const out = [...KIT.lockHair(KIT.flowPts([5.8, 1], Math.PI / 2 - 0.1, 0.3, 9, ph - 0.7, 0.14, 4), 2.6, HR)];
      out.push(...oband(arcPts(0.4, -0.6, 7.4, 7.2, 222, 318, 8), 1.3, C.lace, 2, 0.3));
      for (let k = 0; k < 6; k++) {
        const a = ((224 + k * 18) * Math.PI) / 180;
        out.push(...ooval(0.4 + Math.cos(a) * 8.2, -0.6 + Math.sin(a) * 8, 0.9, 0.8, C.lace, 0, 0.25));
      }
      out.push(...ooval(-5.6, -4.4, 1.6, 1.2, C.ribbon, -0.5), ...ooval(-6.2, -2.8, 1.4, 1, C.ribbon, 0.5));
      return out;
    }),
    frontArm: () => {
      const out = [];
      if (pose !== 'attack' && mood !== 'dead') {
        const [tx, ty] = tray;
        out.push(...opoly(round([[tx - 4.4, ty - 0.6], [tx + 4.4, ty - 0.6], [tx + 4, ty + 0.6], [tx - 4, ty + 0.6]], 1), C.tray), ...opoly(round([[tx - 1.6, ty - 3], [tx + 1.6, ty - 3], [tx + 1.2, ty - 0.6], [tx - 1.2, ty - 0.6]], 1), C.cup), line([[tx - 1.3, ty - 2.7], [tx + 1.3, ty - 2.7]], 0.5, C.tea));
        out.push(dot(tx + Math.sin(ph) * 0.5, ty - 4.6, 0.5, C.mistLt), dot(tx - 0.4 + Math.sin(ph + 1) * 0.6, ty - 6, 0.4, C.mistLt));
      }
      out.push(line([hand, tipD], 0.8, C.handle));
      for (let k = 0; k < 5; k++) {
        const a = dA - 0.9 + k * 0.45;
        out.push(...ooval(tipD[0] + Math.cos(a) * 1.4, tipD[1] + Math.sin(a) * 1.4, 2, 1.2, k % 2 ? C.duster : C.dusterDk, a, 0.3));
      }
      out.push(...armPart(S.arms[1], C.dress, C.skin), ...ooval(lerp(S.arms[1].el[0], hand[0], 0.8), lerp(S.arms[1].el[1], hand[1], 0.8), 1.3, 1, C.lace, 0, 0.25));
      if (pose === 'attack' && f >= 1) {
        const k = f === 1 ? 0.5 : f === 2 ? 1 : 0.6;
        for (let i = 0; i < 5; i++) out.push(dot(tipD[0] + 3 + i * 1.8 * k, tipD[1] - 1 + Math.cos(i * 1.7) * 2 * k, 1.4 * k + 0.4, C.mistLt));
        out.push(sparkle(tipD[0] + 7 * k, tipD[1] - 3, 1.2 + k, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Candle Bride ----------
// A ghostly bride gliding in a lace gown, her long veil drifting, holding up a three-branched
// candelabra whose flames flicker; she thrusts it forward in a gout of wax-fire.

const CB = soften({
  skin: '#fff4f6', skinDk: '#ecd8e0', hair: '#f6eaff', hairDk: '#c8b4e6', hairLt: '#ffffff',
  gown: '#fffaff', gownDk: '#e2d8f2', lace: '#ffffff', veil: '#f4f0ff', veilDk: '#d8d0f0',
  wax: '#fff6e0', waxDk: '#e8d6b8', brass: '#ffd36b', brassDk: '#c8902a', flame: '#ffb35a', flame2: '#ffe9a0', flameHot: '#ffffff',
  rose: '#ff9fbf', roseDk: '#e06a90', mist: '#f2eeff', mistDk: '#d6ccf2', mistLt: '#ffffff',
});
const CB_FACE = { skin: CB.skin, skinSh: '#ecd8e0', skinSh2: '#d4b4c4', blush: '#ffb4cc', lip: '#e07a9a', lipLine: '#a84a6a', eye: eyes('#c4a8ff', '#5a3aa8', '#f0e6ff', { ry: 2.4, tilt: 0.2, flicks: 3, lashLen: 1.2 }), brow: { c: '#c8b4e6', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.62, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const CANDLE = [1.15, -0.75];
const CB_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 46 + Math.sin((i / 4) * TAU) * 0.6], lean: 0.06, tilt: 0.05 + Math.sin((i / 4) * TAU) * 0.03, arms: [[0.6, -1.6], CANDLE], legs: [[0, 0], [0, 0]] })),
  idle: [
    { hip: [36, 46], lean: 0, tilt: 0.12, arms: [[0.5, -1.6], CANDLE], legs: [[0, 0], [0, 0]] },
    { hip: [36, 45.4], lean: -0.02, tilt: 0.2, arms: [[0.5, -1.7], [1.25, -0.85]], legs: [[0, 0], [0, 0]] },
    { hip: [36, 45.8], lean: 0, tilt: 0.06, arms: [[0.5, -1.5], CANDLE], legs: [[0, 0], [0, 0]] },
  ],
  attack: [
    { hip: [34, 46], lean: -0.1, tilt: -0.05, arms: [[0.3, -1.4], [0.5, -0.4]], legs: [[0, 0], [0, 0]] },
    { hip: [39, 46], lean: 0.16, tilt: 0.1, arms: [[0.2, -1.2], [1.55, -0.2]], legs: [[0, 0], [0, 0]] },
    { hip: [39, 46], lean: 0.14, tilt: 0.08, arms: [[0.2, -1.2], [1.6, -0.1]], legs: [[0, 0], [0, 0]] },
    { hip: [37, 46], lean: 0.04, tilt: 0.06, arms: [[0.5, -1.5], CANDLE], legs: [[0, 0], [0, 0]] },
  ],
  dead: { hip: [34, 66], lean: 0.6, tilt: 0.6, arms: [[0.2, 0.2], [0.5, 0.2]], legs: [[0, 0], [0, 0]] },
};

function candelabra(h, a, C, f, n, lit = true) {
  const d = [Math.sin(a), -Math.cos(a)];
  const top = [h[0] + d[0] * 6, h[1] + d[1] * 6];
  const pr = [-d[1], d[0]];
  const out = [line([h, top], 0.9, C.brass)];
  const arm = (k) => [top[0] + pr[0] * k * 4, top[1] + pr[1] * k * 4];
  out.push(...oband([arm(-1), [top[0] - d[0] * 1.2, top[1] - d[1] * 1.2], arm(1)], 0.8, C.brass, 2, 0.3));
  for (const k of [-1, 0, 1]) {
    const b = k === 0 ? [top[0] + d[0] * 1.4, top[1] + d[1] * 1.4] : arm(k);
    const t = [b[0] + d[0] * 4, b[1] + d[1] * 4];
    out.push(...oband([b, t], 1.6, C.wax, 1, 0.3), dot(b[0] + pr[0] * 0.8 + d[0], b[1] + pr[1] * 0.8 + d[1], 0.6, C.waxDk));
    if (lit) {
      const fl = Math.sin(((f + k * 2) / n) * TAU * 2) * 0.6;
      out.push(...KIT.flame(t[0], t[1] + 0.4, 4.2 + Math.abs(fl), 1.4, fl, [C.flame, C.flame2, C.flameHot]));
    }
  }
  return out;
}

function candlebride(pose, f, mood) {
  const C = fade(CB, mood);
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const P = pick(pose, f, mood, CB_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a5a9a');
  const trail = pose === 'walk' ? 1 : 0.4;
  const dead = mood === 'dead';
  const shapes = drawRig(S, {
    behind: () => {
      // The long veil streaming back from her crown, rippling, lace along its edge.
      const root = S.head;
      const pts = KIT.flowPts([root[0] - 5, root[1] - 5], Math.PI / 2 + 0.3 + trail * 0.12, 0.5, dead ? 16 : 26, ph, 0.12, 6, 0.6);
      const out = [...oband(pts, (t) => lerp(5, 11, t ** 0.7), C.veil, 4)];
      const sp = KIT.spline(pts, 4);
      out.push(fband(sp.slice(1).map(([x, y]) => [x - 1, y + 1]), (t) => lerp(2, 6, t), C.veilDk, 1));
      for (let i = 4; i < sp.length; i += 3) out.push(dot(sp[i][0] - 5, sp[i][1] + 5, 0.7, C.lace));
      // Her gown's train fades into mist.
      out.push(...wisp([S.hip[0] - 2, S.hip[1] + 14], ph, trail, dead ? 8 : 12, 12, C, f, n));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.gownDk, C.skinDk),
    body: () => {
      const g = gown(S, 17, 9, C.gown, C.gownDk, Math.sin(ph) * 0.8);
      const [hx, hy] = S.hip;
      const out = [...g.out];
      // Lace tiers dripping like wax down the skirt.
      for (let t = 0; t < 3; t++) for (let k = 0; k < 6; k++) out.push(...ooval(hx - 6 - t + k * (2.4 + t * 0.4) + Math.sin(ph) * 0.6, hy + 4 + t * 4.4, 1.1, 0.9 + (k % 2) * 0.4, C.lace, 0, 0.25));
      out.push(...bodice(S, C.gown, C.gownDk));
      const [cx, cy] = S.chest;
      // A sweetheart neckline, a rose at the waist, pearls.
      out.push(fband(arcPts(cx, cy + 1.6, 3.2, 1.6, 200, 340, 6), 0.5, C.gownDk, 1));
      out.push(...ooval(hx + 2.4, hy - 1.6, 2, 1.8, C.rose), ...ooval(hx + 2.4, hy - 1.6, 1.1, 1, C.roseDk), dot(hx + 2, hy - 2.2, 0.5, '#ffffff'));
      for (let k = 0; k < 5; k++) out.push(dot(cx - 2 + k * 1.1, cy + 2.6 + Math.sin(k) * 0.4, 0.45, '#ffffff'));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, 2.2, C.lace));
      return out;
    },
    head: () => headPart(S, mood, CB_FACE, SWEPT, HR, 1.15, null, () => {
      const out = [];
      // A wreath of little roses and the veil's comb.
      for (let k = 0; k < 6; k++) {
        const a = ((210 + k * 22) * Math.PI) / 180;
        out.push(...ooval(0.4 + Math.cos(a) * 7.8, -0.8 + Math.sin(a) * 7.6, 1.3, 1.2, k % 2 ? C.rose : '#ffffff'), dot(0.4 + Math.cos(a) * 7.8, -0.8 + Math.sin(a) * 7.6, 0.5, k % 2 ? C.roseDk : C.rose));
      }
      // A long lock over her shoulder.
      out.push(...KIT.lockHair(KIT.flowPts([6, 1.4], Math.PI / 2, 0.2, 12, ph - 0.6, 0.1, 4), 2.8, HR));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const a = pose === 'attack' ? [0, 1.4, 1.5, 0.4][f] : -0.1 + Math.sin(ph) * 0.05;
      const out = [...candelabra(A.hand, dead ? 1.8 : a, C, f, n, !dead), ...armPart(A, C.gown, C.skin)];
      if (pose === 'attack' && (f === 1 || f === 2)) {
        // A gout of wax-fire thrown ahead.
        const k = f === 1 ? 0.7 : 1;
        for (let i = 0; i < 4; i++) out.push(...KIT.flame(A.hand[0] + 9 + i * 4 * k, A.hand[1] + 2, 5 * k, 2 * k, 1.5, [C.flame, C.flame2, C.flameHot]));
        out.push(sparkle(A.hand[0] + 22 * k, A.hand[1] - 3, 1.6, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Topiary Dryad ----------
// A garden spirit grown from trimmed hedge: a dress of clipped leaves, rose-bud hair, a pair of
// garden shears. Skips along on light feet; snips with a snap of the blades.

const TD = soften({
  skin: '#e8f6dc', skinDk: '#cce4bc', hair: '#ff9fbf', hairDk: '#e0709a', hairLt: '#ffd0e0',
  leaf: '#7fd08a', leafDk: '#4fae6a', leafLt: '#b6ecb0', bark: '#a8826a', barkDk: '#7a5a4a',
  rose: '#ff7aa0', roseDk: '#d84a7a', blade: '#e6ecf6', bladeDk: '#a8b4c8', handle: '#ffb35a',
});
const TD_FACE = { skin: TD.skin, skinSh: '#cce4bc', skinSh2: '#a8c898', blush: '#ffa8c4', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#ffb35a', '#a8520a', '#ffe9b0', { tilt: 0.1 }), brow: { c: '#d86a90', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.92, mouth: 'grin' }, angry: { mouth: 'snarl' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const TD_K = {
  walk: [
    { hip: [36, 44], lean: 0.08, tilt: 0.04, arms: [[0.5, -0.4], [-0.3, -0.8]], legs: [[-0.5, 0.3], [0.5, 0.05]] },
    { hip: [36, 41.4], lean: 0.06, tilt: -0.04, arms: [[0.1, -0.6], [0.1, -0.9]], legs: [[0.1, 1.1], [0.2, 0.1]] },
    { hip: [36, 44], lean: 0.08, tilt: 0.04, arms: [[-0.3, -0.4], [0.5, -0.8]], legs: [[0.5, 0.05], [-0.5, 0.3]] },
    { hip: [36, 41.4], lean: 0.06, tilt: -0.04, arms: [[0.1, -0.6], [0.1, -0.9]], legs: [[0.2, 0.1], [0.1, 1.1]] },
  ],
  idle: [
    { hip: [36, 46], lean: 0, tilt: 0.1, arms: [[0.2, -0.3], [0.6, -1.2]], legs: [[-0.1, 0], [0.12, 0]] },
    { hip: [36, 45.2], lean: 0.02, tilt: -0.08, arms: [[0.2, -0.4], [0.9, -1.4]], legs: [[-0.1, 0], [0.4, 0.4]] },
    { hip: [36, 46], lean: 0, tilt: 0.12, arms: [[0.2, -0.3], [0.6, -1.2]], legs: [[-0.1, 0], [0.12, 0]] },
  ],
  attack: [
    { hip: [34, 45], lean: -0.08, tilt: -0.1, arms: [[0.4, -0.4], [-0.6, -1.6]], legs: [[-0.4, 0.1], [0.3, 0.05]] },
    { hip: [39, 45.6], lean: 0.18, tilt: 0.1, arms: [[-0.5, -0.2], [1.5, -0.1]], legs: [[-0.5, 0.1], [0.5, 0.1]] },
    { hip: [39, 45.6], lean: 0.16, tilt: 0.08, arms: [[-0.5, -0.2], [1.55, 0]], legs: [[-0.5, 0.1], [0.5, 0.1]] },
    { hip: [37, 45.4], lean: 0.04, tilt: 0, arms: [[0.2, -0.3], [0.7, -1.2]], legs: [[-0.2, 0.05], [0.2, 0.03]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function leafClump(x, y, r, C, a = 0) {
  return [...ooval(x, y, r, r * 0.8, C.leaf, a), fband(arcPts(x, y + r * 0.2, r * 0.7, r * 0.4, 20, 160, 5), 0.5, C.leafDk, 1), dot(x - r * 0.3, y - r * 0.35, r * 0.25, C.leafLt)];
}

function topiarydryad(pose, f, mood) {
  const C = fade(TD, mood);
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const P = pick(pose, f, mood, TD_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a5a');
  const A = S.arms[1];
  const open = pose === 'attack' ? [0.9, 0.1, 0.05, 0.5][f] : 0.25 + Math.max(0, Math.sin(ph * 2)) * 0.3;
  const shapes = drawRig(S, {
    backArm: () => armPart(S.arms[0], C.leafDk, C.skinDk),
    backLeg: () => [...limb3(S.legs[0].hip, S.legs[0].kn, S.legs[0].ft, 3, 2.4, 1.8, C.barkDk), ...leafClump(S.legs[0].ft[0] + 1, S.legs[0].ft[1] - 0.6, 1.8, C)],
    body: () => {
      const [hx, hy] = S.hip;
      const out = [];
      // A skirt of clipped leaf clumps, round like a topiary, with roses tucked in it.
      const sw = Math.sin(ph) * (pose === 'walk' ? 0.8 : 0.3);
      for (let t = 0; t < 3; t++) for (let k = 0; k < 4 + t; k++) out.push(...leafClump(hx - 4.6 - t * 1.6 + k * (3.2 + t * 0.2) + sw * t * 0.4, hy + 1 + t * 3.2, 2.6 + t * 0.3, C));
      out.push(...ooval(hx - 3, hy + 5, 1.4, 1.3, C.rose), ...ooval(hx + 4, hy + 8, 1.4, 1.3, C.rose), dot(hx - 3, hy + 5, 0.6, C.roseDk), dot(hx + 4, hy + 8, 0.6, C.roseDk));
      out.push(...bodice(S, C.leaf, C.leafDk));
      const [cx, cy] = S.chest;
      for (let k = 0; k < 4; k++) out.push(...leafClump(cx - 3 + k * 2, cy + 3 + (k % 2), 1.6, C));
      out.push(...leafClump(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, C));
      return out;
    },
    frontLeg: () => [...limb3(S.legs[1].hip, S.legs[1].kn, S.legs[1].ft, 3, 2.4, 1.8, C.bark), ...leafClump(S.legs[1].ft[0] + 1, S.legs[1].ft[1] - 0.6, 1.8, C)],
    head: () => headPart(S, mood, TD_FACE, BANGS, HR, 1.15, null, () => {
      const out = [];
      // Rose-bud hair: roses blooming in her hair, a leafy crown, two twig antlers of hedge.
      for (const [x, y, r] of [[-5, -5, 1.8], [-2, -7.4, 1.6], [2.4, -7.6, 1.7], [-6.6, -1, 1.5]]) out.push(...ooval(x, y, r, r * 0.92, C.rose), fband(arcPts(x, y, r * 0.55, r * 0.5, 0, 300, 6), 0.4, C.roseDk, 1));
      for (const [x, y] of [[-0.4, -8.6], [4.6, -6.8], [-4, -7.6]]) out.push(...leafClump(x, y, 1.4, C));
      out.push(...KIT.lockHair(KIT.flowPts([5.6, 1], Math.PI / 2 - 0.2, 0.5, 8, ph - 0.6, 0.12, 4), 2.6, HR));
      return out;
    }),
    frontArm: () => {
      // Garden shears, blades opening and snapping shut.
      const h = A.hand;
      const a = A.a - Math.PI / 2;
      const out = [];
      for (const s of [-1, 1]) {
        const ba = a + s * open * 0.5;
        const tip = [h[0] + Math.cos(ba) * 10, h[1] + Math.sin(ba) * 10];
        out.push(...oband([h, tip], taperW(1.6, 0.3), C.blade, 1, 0.3), line([[h[0] + Math.cos(ba) * 2, h[1] + Math.sin(ba) * 2], [tip[0] - Math.cos(ba) * 0.6, tip[1] - Math.sin(ba) * 0.6]], 0.35, C.bladeDk));
        const hb = [h[0] - Math.cos(ba) * 3.4, h[1] - Math.sin(ba) * 3.4];
        out.push(...oband([h, hb], 1.4, C.handle, 1, 0.3));
      }
      out.push(dot(h[0], h[1], 0.7, C.bladeDk), ...armPart(A, C.leaf, C.skin));
      if (pose === 'attack' && f === 1) for (let i = 0; i < 5; i++) out.push(...leafClump(h[0] + 10 + i * 2, h[1] - 4 + (i % 2) * 6, 0.9, C, i));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Lantern Ghost Girl ----------
// A little hooded ghost who tiptoes on air with a lantern of cold blue fire; she swings it and the
// fire bursts out in a ring.

const LG = soften({
  skin: '#eef4ff', skinDk: '#d4e0f6', hair: '#b8d8ff', hairDk: '#80a8e8', hairLt: '#eef6ff',
  cloak: '#5a6ab8', cloakDk: '#3f4a96', cloakLt: '#8a9ad8', lining: '#ffd6ec', dress: '#eaf2ff', dressDk: '#c8d6f2',
  brass: '#ffd36b', brassDk: '#c8902a', fire: '#7fd8ff', fire2: '#c4f0ff', fireHot: '#ffffff', glass: '#dff6ff',
  mist: '#e2ecff', mistDk: '#c0d0f4', mistLt: '#ffffff', star: '#fff3a6',
});
const LG_FACE = { skin: LG.skin, skinSh: '#d4e0f6', skinSh2: '#b0c0e8', blush: '#a8c4ff', lip: '#7a8ad8', lipLine: '#4a5ab0', eye: eyes('#7fd8ff', '#2a6aa8', '#e6f8ff', { rx: 3.6, ry: 3.2 }), brow: { c: '#80a8e8', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.95, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const LG_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 40 + Math.abs(Math.sin((i / 4) * TAU)) * -1.4], lean: 0.1, tilt: 0.06, arms: [[0.4 - Math.sin((i / 4) * TAU) * 0.3, -0.4], [0.4, -0.6]], legs: [[0.5 + Math.sin((i / 4) * TAU) * 0.3, -1.2], [0.1 - Math.sin((i / 4) * TAU) * 0.3, -0.5]] })),
  idle: [
    { hip: [36, 41], lean: 0, tilt: 0.14, arms: [[0.3, -0.5], [0.3, -0.5]], legs: [[0.3, -0.9], [0.05, -0.3]] },
    { hip: [36, 39.6], lean: 0, tilt: 0.2, arms: [[0.3, -0.6], [0.5, -0.8]], legs: [[0.4, -1], [0.1, -0.4]] },
    { hip: [36, 40.4], lean: 0, tilt: 0.08, arms: [[0.3, -0.5], [0.3, -0.4]], legs: [[0.3, -0.8], [0.05, -0.3]] },
  ],
  attack: [
    { hip: [34, 40], lean: -0.1, tilt: -0.1, arms: [[0.4, -0.5], [-1.2, -0.4]], legs: [[0.6, -1.2], [0.3, -0.5]] },
    { hip: [38, 40], lean: 0.12, tilt: 0.1, arms: [[0.2, -0.4], [1.8, -0.2]], legs: [[0.3, -0.8], [0.1, -0.2]] },
    { hip: [38, 40], lean: 0.1, tilt: 0.06, arms: [[0.2, -0.4], [1.9, -0.1]], legs: [[0.3, -0.8], [0.1, -0.2]] },
    { hip: [36, 40.4], lean: 0.02, tilt: 0.04, arms: [[0.3, -0.5], [0.5, -0.5]], legs: [[0.3, -0.9], [0.05, -0.3]] },
  ],
  dead: { hip: [32, 64], lean: 0.6, tilt: 0.6, arms: [[0.3, 0.1], [0.5, 0.1]], legs: [[1.2, -1.5], [1, -1.3]] },
};

function lanternghost(pose, f, mood) {
  const C = fade(LG, mood);
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const P = pick(pose, f, mood, LG_K);
  const S = solve(P, 0.88);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#2a3a8a');
  const A = S.arms[1];
  const dead = mood === 'dead';
  const lamp = [A.hand[0], A.hand[1] + 4];
  const swing = pose === 'attack' ? 0 : Math.sin(ph - 0.7) * 0.15;
  const glowK = 0.6 + 0.4 * Math.sin(ph * 2);
  const shapes = drawRig(S, {
    behind: () => {
      // The cloak's back falling behind her, its hem rippling, little stars embroidered.
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const tr = pose === 'walk' ? 1 : 0.4;
      const pts = [[cx - 3, cy - 2], [cx + 2, cy - 2], [hx + 3, hy + 6], [hx - 2 - tr * 2, hy + 9 + Math.sin(ph) * 0.6], [hx - 7 - tr * 3, hy + 7 + Math.sin(ph - 1)], [hx - 6 - tr * 2, hy - 2]];
      return [...opoly(round(pts, 2), C.cloakDk), dot(hx - 4, hy + 4, 0.5, C.star), dot(hx - 1, hy + 6, 0.4, C.star)];
    },
    backArm: () => armPart(S.arms[0], C.cloakDk, C.skinDk, 0.9),
    backLeg: () => legPart(S.legs[0], C.skinDk, C.skinDk, 0.85),
    body: () => {
      const g = gown(S, 7, 5.4, C.dress, C.dressDk, Math.sin(ph) * 0.5, 0.88);
      const out = [...g.out, ...bodice(S, C.cloak, C.cloakDk)];
      const [hx, hy] = S.hip;
      for (let k = 0; k < 4; k++) out.push(...ooval(hx - 4.2 + k * 2.8, hy + 7.2, 1.3, 0.8, C.dress, 0, 0.25));
      // The cloak's front edges and a star brooch.
      const [cx, cy] = S.chest;
      out.push(line([[cx - 0.6, cy - 1], [hx - 1.4, hy + 2]], 0.6, C.lining), ...KIT.gem(cx + 0.6, cy + 0.4, 0.9, C.star));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.skin, C.skin, 0.85),
    head: () => headPart(S, mood, LG_FACE, BANGS, HR, 1.2, null, () => {
      // The hood up over her head, its point flopping with her steps, lined in pink.
      const flop = Math.sin(ph - 1) * (pose === 'walk' ? 0.3 : 0.15);
      const out = [...opoly(round([[-8.4, 3], [-8.6, -5], [-4, -10], [3, -10.4], [8.4, -5], [8.6, 0], [7, -1], [6.6, -6], [2, -8.4], [-3.4, -7.6], [-6.6, -3], [-6.6, 3]], 2), C.cloak)];
      out.push(...oband([[-4, -10], [-9 + flop * 4, -13], [-12 + flop * 8, -10]], taperW(4, 1), C.cloak, 2), dot(-12 + flop * 8, -10, 1.2, C.star));
      out.push(fband(arcPts(0, -1, 7.4, 8.2, 200, 340, 8), 0.7, C.lining, 1));
      return out;
    }),
    frontArm: () => {
      const out = [];
      // The lantern on its ring, swinging from her hand, the cold fire inside breathing.
      const [lx, ly] = lamp;
      within(at(A.hand[0], A.hand[1], swing), () => {
        out.push(line([[0, 0], [0, 2]], 0.4, C.brassDk));
        out.push(...opoly(round([[-3, 2], [3, 2], [3.4, 9], [-3.4, 9]], 1), C.glass), ...opoly([[-3.6, 1.4], [3.6, 1.4], [2.4, 0], [-2.4, 0]], C.brass), ...opoly([[-3.8, 9], [3.8, 9], [3, 10.6], [-3, 10.6]], C.brass));
        if (!dead) out.push(...KIT.flame(0, 8.4, 5 * glowK + 1, 1.8, Math.sin(ph * 2) * 0.6, [C.fire, C.fire2, C.fireHot]));
        out.push(line([[-3.2, 2.2], [-3.4, 8.8]], 0.4, C.brassDk), line([[3.2, 2.2], [3.4, 8.8]], 0.4, C.brassDk));
      });
      out.push(...armPart(A, C.cloak, C.skin, 0.9));
      if (pose === 'attack' && (f === 1 || f === 2)) {
        // The cold fire bursts out in a ring of blue flames and sparks.
        const k = f === 1 ? 0.7 : 1;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          out.push(...KIT.flame(lx + 8 + Math.cos(a) * 7 * k, ly + 4 + Math.sin(a) * 5 * k, 4 * k, 1.5 * k, 0, [C.fire, C.fire2, C.fireHot]));
        }
        out.push(sparkle(lx + 8, ly + 3, 2 * k, '#ffffff'));
      }
      if (!dead) out.push(dot(lx + 3, ly - 2 + Math.sin(ph) * 1.4, 0.5, C.fire2), dot(lx - 3, ly - 5 + Math.cos(ph) * 1.4, 0.4, C.fire2));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Armour Knight Girl ----------
// A knight in pastel plate whose plumed helmet floats beside her head like a loyal pet; she
// marches in step and brings her sword round in a heavy slash, shield up.

const AK = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ffcf6b', hairDk: '#e0a040', hairLt: '#fff0c0',
  plate: '#d8e2f6', plateDk: '#a8b4d8', plateLt: '#ffffff', trim: '#ff9fbf', trimDk: '#d86a90',
  cloth: '#8a7ad8', clothDk: '#6a5ab8', plume: '#ff7aa0', plumeDk: '#d84a7a', blade: '#eef4ff', bladeDk: '#a8b8d8', hilt: '#ffd36b', shield: '#ffb3cf',
});
const AK_FACE = { skin: AK.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa8b8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#5ac8a8', '#1a7a6a', '#c8f6e6', { tilt: 0.25, ry: 2.4 }), brow: { c: '#d89040', kind: 'straight', w: 0.8 }, moods: { idle: { open: 0.88, mouth: 'smirk' }, angry: { mouth: 'snarl' }, hurt: { mouth: 'grit' }, happy: { mouth: 'grin' } } };
const AK_K = {
  walk: [
    { hip: [36, 46], lean: 0.02, tilt: 0, arms: [[0.4, -0.8], [-0.3, -1.2]], legs: [[-0.4, 0.15], [0.4, 0.05]] },
    { hip: [36, 44.8], lean: 0.02, tilt: 0.02, arms: [[0.2, -0.8], [-0.1, -1.2]], legs: [[0, 0.7], [0.05, 0.02]] },
    { hip: [36, 46], lean: 0.02, tilt: 0, arms: [[0, -0.8], [0.1, -1.2]], legs: [[0.4, 0.05], [-0.4, 0.15]] },
    { hip: [36, 44.8], lean: 0.02, tilt: -0.02, arms: [[0.2, -0.8], [-0.1, -1.2]], legs: [[0.05, 0.02], [0, 0.7]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.4, -0.9], [-0.2, -1.3]], legs: [[-0.18, 0], [0.2, 0]] },
    { hip: [36, 45.6], lean: -0.03, tilt: 0.04, arms: [[0.4, -0.9], [-0.1, -1.4]], legs: [[-0.18, 0], [0.2, 0]] },
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.4, -0.9], [-0.2, -1.3]], legs: [[-0.18, 0], [0.2, 0]] },
  ],
  attack: [
    { hip: [34, 46], lean: -0.12, tilt: -0.1, arms: [[0.6, -1], [-1.8, -1.6]], legs: [[-0.4, 0.15], [0.4, 0.05]] },
    { hip: [39, 47], lean: 0.2, tilt: 0.12, arms: [[0.2, -0.9], [1.2, 0.2]], legs: [[-0.55, 0.1], [0.55, 0.15]] },
    { hip: [39, 47], lean: 0.18, tilt: 0.1, arms: [[0.2, -0.9], [0.9, 0.5]], legs: [[-0.55, 0.1], [0.55, 0.15]] },
    { hip: [37, 46], lean: 0.04, tilt: 0, arms: [[0.4, -0.9], [-0.1, -1.2]], legs: [[-0.2, 0.05], [0.2, 0.03]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function armourknight(pose, f, mood) {
  const C = fade(AK, mood);
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const P = pick(pose, f, mood, AK_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a4a2a');
  const A = S.arms[1];
  const sA = A.a - Math.PI / 2 + (pose === 'attack' ? [-1.2, 0.2, 0.6, -0.6][f] : -0.9);
  const tipS = [A.hand[0] + Math.cos(sA) * 15, A.hand[1] + Math.sin(sA) * 15];
  const plateLeg = (L, back) => {
    const c = back ? C.plateDk : C.plate;
    const out = [...limb3(L.hip, L.kn, L.ft, 3.6, 3, 2.6, c)];
    out.push(...ooval(L.kn[0], L.kn[1], 2, 1.8, back ? C.plateDk : C.plateLt), dot(L.kn[0], L.kn[1], 0.6, C.trim));
    const [fx, fy] = L.ft;
    out.push(...opoly(round([[fx - 2, fy - 2.2], [fx + 2, fy - 2.4], [fx + 4, fy - 0.4], [fx + 3.6, fy + 0.8], [fx - 2.2, fy + 0.8]], 2), c));
    return out;
  };
  const shapes = drawRig(S, {
    behind: () => {
      // A short cape at her back, and the floating helmet bobbing beside her head.
      const [cx, cy] = S.chest;
      const tr = pose === 'walk' ? 1 : 0.4;
      const out = [...opoly(round([[cx - 3, cy - 1], [cx + 1, cy - 1], [S.hip[0] - 1, S.hip[1] + 6], [S.hip[0] - 7 - tr * 2, S.hip[1] + 5 + Math.sin(ph)]], 2), C.cloth)];
      const hx = S.head[0] - 15;
      const hy = S.head[1] - 6 + Math.sin(ph - 0.5) * 1.6;
      out.push(...ooval(hx, hy, 6, 5.6, C.plate), fband(arcPts(hx, hy, 5.4, 5, 200, 340, 6), 0.8, C.plateLt, 1), ...opoly([[hx - 1, hy - 0.6], [hx + 6.2, hy - 0.6], [hx + 6.2, hy + 1.2], [hx - 1, hy + 1.2]], C.plateDk), line([[hx + 1, hy + 0.3], [hx + 5.6, hy + 0.3]], 0.6, '#3a3466'));
      out.push(...oband([[hx, hy - 5.4], [hx - 4, hy - 9 + Math.sin(ph) * 0.6], [hx - 9, hy - 7 + Math.sin(ph - 1)]], taperW(3.4, 0.6), C.plume, 2), dot(hx + 2.4, hy - 2.4, 0.6, C.trim));
      return out;
    },
    backArm: () => {
      // The shield on her back arm, a heart on its face.
      const B = S.arms[0];
      const out = [...armPart(B, C.plateDk, C.plateDk)];
      const [sx, sy] = B.hand;
      out.push(...opoly(round([[sx - 4, sy - 5], [sx + 4, sy - 5], [sx + 4, sy + 1], [sx, sy + 6], [sx - 4, sy + 1]], 1), C.shield), ...KIT.ooval(sx - 0.9, sy - 1.6, 1.4, 1.4, C.trim), ...KIT.ooval(sx + 0.9, sy - 1.6, 1.4, 1.4, C.trim), fpoly([[sx - 2.2, sy - 1.2], [sx + 2.2, sy - 1.2], [sx, sy + 1.8]], C.trim));
      return out;
    },
    backLeg: () => plateLeg(S.legs[0], true),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [];
      // A pleated tabard skirt over plate tassets.
      out.push(...opoly(round([[hx - 4.4, hy - 1], [hx + 4.4, hy - 1], [hx + 6, hy + 6.4], [hx - 6, hy + 6.4]], 1), C.cloth));
      for (const k of [-3, 0, 3]) out.push(line([[hx + k * 0.6, hy], [hx + k * 1.6, hy + 6]], 0.4, C.clothDk));
      out.push(...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 5, hy + 2], [hx - 5, hy + 2]], 1), C.plate));
      // The breastplate, a heart engraved, pauldrons with pink trim.
      out.push(...bodice(S, C.plate, C.plateDk));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 3, 3.4, 2, 200, 340, 6), 0.6, C.plateLt, 1), ...KIT.ooval(cx, cy + 4.2, 1.2, 1.2, C.trim));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 0.6, 3, 2.6, C.plate), fband(arcPts(S.arms[1].sh[0], S.arms[1].sh[1] + 0.6, 2.8, 2.4, 20, 160, 5), 0.6, C.trim, 1));
      return out;
    },
    frontLeg: () => plateLeg(S.legs[1], false),
    head: () => headPart(S, mood, AK_FACE, SWEPT, HR, 1.15, () => [...backHair(HR, 6), ...KIT.lockHair(KIT.flowPts([-6, -3], Math.PI / 2 + 0.6, 0.6, 12, ph - 0.8, pose === 'walk' ? 0.25 : 0.14, 5), 4.4, HR)], () => [...ooval(-5.6, -4.6, 1.4, 1.2, C.trim), dot(-5.8, -5, 0.5, '#ffffff')]),
    frontArm: () => {
      const out = [...oband([A.hand, tipS], taperW(2.2, 0.6), C.blade, 1, 0.3), line([[A.hand[0] + Math.cos(sA) * 3, A.hand[1] + Math.sin(sA) * 3], tipS], 0.4, C.bladeDk)];
      const g = [-Math.sin(sA) * 3, Math.cos(sA) * 3];
      out.push(line([[A.hand[0] - g[0], A.hand[1] - g[1]], [A.hand[0] + g[0], A.hand[1] + g[1]]], 1.1, C.hilt), dot(A.hand[0] - Math.cos(sA) * 2.6, A.hand[1] - Math.sin(sA) * 2.6, 0.9, C.trim));
      out.push(...armPart(A, C.plate, C.plateLt));
      if (pose === 'attack' && (f === 1 || f === 2)) {
        // The slash's arc.
        const c = S.chest;
        out.push(fband(arcPts(c[0] + 2, c[1] + 4, 16, 14, -70, 50, 10), (t) => 2.6 * Math.sin(Math.PI * t), mix(C.blade, C.trim, 0.3), 1), sparkle(c[0] + 14, c[1] + 12, 1.8, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Tea Party Hatter ----------
// A tea-mad hostess in a giant top hat and a tailcoat, teapot in hand; a jaunty skipping walk, and
// she flings a scalding arc of tea.

const TH = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ff8a6a', hairDk: '#d8604a', hairLt: '#ffc6a8',
  coat: '#5ac8b8', coatDk: '#3a9a8a', coatLt: '#9ae6d8', vest: '#ffd36b', vestDk: '#e0a82a', shirt: '#ffffff', shirtDk: '#e6e0f0',
  hat: '#7a5ab8', hatDk: '#5a3a96', band: '#ff8fb8', card: '#ffffff', stocking: '#ff8fb8', stockingDk: '#d8608e', shoe: '#5a3a5a',
  pot: '#ffffff', potDk: '#d8d4ea', potTrim: '#ff8fb8', tea: '#e8a070', teaLt: '#ffd0a8',
});
const TH_FACE = { skin: TH.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa0b4', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#b88aff', '#5a2aa8', '#ecdcff', { rx: 3.5, ry: 3, tilt: -0.05 }), brow: { c: '#d8604a', kind: 'arched', w: 0.8 }, moods: { idle: { open: 1, mouth: 'grin' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const POT = [0.6, -1.2];
const TH_K = {
  walk: [
    { hip: [36, 44.6], lean: 0.06, tilt: 0.08, arms: [[0.6, -0.3], POT], legs: [[-0.5, 0.2], [0.45, 0.05]] },
    { hip: [36, 41.8], lean: 0.02, tilt: -0.06, arms: [[0.1, -0.5], [0.8, -1.3]], legs: [[0.1, 1.2], [0.15, 0.1]] },
    { hip: [36, 44.6], lean: 0.06, tilt: 0.08, arms: [[-0.4, -0.3], POT], legs: [[0.45, 0.05], [-0.5, 0.2]] },
    { hip: [36, 41.8], lean: 0.02, tilt: -0.06, arms: [[0.1, -0.5], [0.8, -1.3]], legs: [[0.15, 0.1], [0.1, 1.2]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.04, tilt: 0.1, arms: [[0.1, -1.6], POT], legs: [[-0.2, 0], [0.3, 0.1]] },
    { hip: [36, 45.6], lean: -0.05, tilt: -0.1, arms: [[0.1, -1.7], [0.8, -1.5]], legs: [[-0.2, 0], [0.3, 0.1]] },
    { hip: [36, 46], lean: -0.04, tilt: 0.14, arms: [[0.1, -1.6], POT], legs: [[-0.2, 0], [0.3, 0.1]] },
  ],
  attack: [
    { hip: [34, 46], lean: -0.14, tilt: -0.12, arms: [[0.4, -0.5], [-0.9, -1.2]], legs: [[-0.4, 0.15], [0.35, 0.05]] },
    { hip: [39, 46], lean: 0.16, tilt: 0.1, arms: [[-0.4, -0.4], [1.7, -0.6]], legs: [[-0.5, 0.1], [0.5, 0.12]] },
    { hip: [39, 46], lean: 0.12, tilt: 0.1, arms: [[-0.4, -0.4], [1.8, -0.4]], legs: [[-0.5, 0.1], [0.5, 0.12]] },
    { hip: [37, 46], lean: 0.02, tilt: 0.04, arms: [[0.1, -1.4], POT], legs: [[-0.2, 0.05], [0.2, 0.03]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function teahatter(pose, f, mood) {
  const C = fade(TH, mood);
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6;
  const ph = (f / n) * TAU;
  const P = pick(pose, f, mood, TH_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a3a');
  const A = S.arms[1];
  const tr = pose === 'walk' ? 1 : 0.4;
  const shapes = drawRig(S, {
    behind: () => {
      // The tailcoat's two long tails flicking behind her.
      const [hx, hy] = S.hip;
      const out = [];
      for (const k of [0, 1]) out.push(...oband([[hx - 2 + k, hy - 2], [hx - 5 - tr * 2 - k, hy + 6 + Math.sin(ph - k) * 0.8], [hx - 7 - tr * 3 - k * 2, hy + 12 + Math.sin(ph - k - 1)]], taperW(4, 1.6), k ? C.coatDk : C.coat, 3));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.coatDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.stockingDk, C.shoe),
    body: () => {
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const out = [];
      // A short puffed skirt, a waistcoat with buttons, a big bow tie, the coat open over it.
      out.push(...opoly(round([[hx - 4.2, hy - 1.4], [hx + 4.2, hy - 1.4], [hx + 6.6, hy + 4.4], [hx - 6.6, hy + 4.4]], 2), C.shirt));
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - 5.6 + k * 2.8, hy + 4.6, 1.5, 0.9, C.coatLt, 0, 0.25));
      out.push(...bodice(S, C.vest, C.vestDk));
      for (let k = 0; k < 3; k++) out.push(dot(lerp(hx, cx, 0.2 + k * 0.25) + 1, lerp(hy, cy, 0.2 + k * 0.25), 0.5, '#ffffff'));
      out.push(...opoly([[cx - 3.6, cy - 1.4], [cx - 1, cy - 1], [hx - 2, hy + 1], [hx - 4.4, hy]], C.coat), ...opoly([[cx + 3.6, cy - 1.4], [cx + 1.8, cy - 1], [hx + 3.6, hy - 0.6], [hx + 4.6, hy - 1]], C.coat));
      out.push(...ooval(cx - 1.6, cy - 0.8, 1.6, 1.1, C.band, -0.4), ...ooval(cx + 1.6, cy - 0.8, 1.6, 1.1, C.band, 0.4), dot(cx, cy - 0.8, 0.7, mix(C.band, '#000000', 0.2)));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.6, 2.4, C.coat));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.stocking, C.shoe),
    head: () => headPart(S, mood, TH_FACE, SWEPT, HR, 1.15, () => [...backHair(HR, 8), ...KIT.lockHair(KIT.flowPts([-6.4, 0], Math.PI / 2 + 0.3, 0.3, 10, ph - 0.7, 0.16, 4), 3.4, HR)], () => {
      // The giant top hat, tipped at an angle, a pink band, a card tucked in, bobbing on her head.
      const bob = Math.sin(ph * 2) * (pose === 'walk' ? 0.6 : 0.2);
      const out = [];
      within(at(1, -7.6 + bob, -0.18), () => {
        out.push(...opoly([[-10, 1.4], [10, 1.4], [9, 3], [-9, 3]], C.hatDk), ...opoly(round([[-6, 1.6], [6, 1.6], [7.4, -14], [-7, -14]], 1), C.hat));
        out.push(fpoly([[-6, 1.6], [-3, 1.6], [-3.6, -14], [-7, -14]], C.hatDk), ...opoly([[-6.4, -1.4], [6.6, -1.4], [6.8, 1], [-6.2, 1]], C.band));
        out.push(...opoly([[3, -4], [6.4, -4.4], [6.8, 0], [3.4, 0.4]], C.card), dot(5, -2.2, 0.7, '#e0303e'));
        out.push(fband(arcPts(0, -14, 7.2, 1.2, 180, 360, 6), 0.5, mix(C.hat, '#ffffff', 0.3), 1));
      });
      return out;
    }),
    frontArm: () => {
      // The teapot, spout forward; tipped up in the attack to fling a scalding arc.
      const [px, py] = A.hand;
      const tip = pose === 'attack' ? [0, -0.6, -0.8, 0][f] : 0;
      const out = [];
      within(at(px, py + 3, tip), () => {
        out.push(...ooval(0, 0, 5, 4, C.pot), fband(arcPts(0, 0, 4.4, 3.4, 30, 150, 6), 0.6, C.potDk, 1), ...opoly([[4, -1], [9, -4], [9.6, -3], [5, 1]], C.pot), fband(arcPts(-5.4, 0, 2.4, 2.6, 90, 270, 6), 0.8, C.pot, 1), ...ooval(0, -4.4, 2.6, 1, C.potDk), dot(0, -5.4, 0.9, C.potTrim));
        out.push(fband(arcPts(0, 0.6, 4.8, 3, 200, 340, 6), 0.7, C.potTrim, 1), dot(-1.8, -1.6, 1, '#ffffff'));
      });
      out.push(...armPart(A, C.coat, C.skin));
      if (pose === 'attack' && (f === 1 || f === 2)) {
        // The tea flung out in a steaming arc.
        const k = f === 1 ? 0.6 : 1;
        out.push(fband(arcPts(px + 9, py + 12, 14 * k, 10 * k, -110, -10, 8), (t) => 2.4 * Math.sin(Math.PI * t) + 0.4, C.tea, 1));
        for (let i = 0; i < 4; i++) out.push(dot(px + 12 + i * 4 * k, py - 2 + i * 3 * k, 0.9, C.teaLt));
        out.push(dot(px + 18 * k, py - 6, 1.2, '#ffffff'), dot(px + 22 * k, py - 9, 0.9, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// Shared with the manor bosses (manorboss.js).
export { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT, pick, wisp, beads, candelabra };

export const ART = {
  porcelaindoll: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 230, 180], draw: porcelaindoll },
  ghostmaid: { walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [60, 230, 170], draw: ghostmaid },
  candlebride: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 260, 200], draw: candlebride },
  topiarydryad: { walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [50, 200, 150], draw: topiarydryad },
  lanternghost: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 230, 170], draw: lanternghost },
  armourknight: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 260, 200], draw: armourknight },
  teahatter: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 240, 180], draw: teahatter },
};

export const INFO = {
  porcelaindoll: { name: 'Porcelain Doll', w: 26, h: 66 },
  ghostmaid: { name: 'Ghost Maid', w: 26, h: 62 },
  candlebride: { name: 'Candle Bride', w: 28, h: 66 },
  topiarydryad: { name: 'Topiary Dryad', w: 26, h: 64 },
  lanternghost: { name: 'Lantern Ghost', w: 24, h: 56 },
  armourknight: { name: 'Armour Knight', w: 28, h: 66 },
  teahatter: { name: 'Tea Party Hatter', w: 28, h: 72 },
};
