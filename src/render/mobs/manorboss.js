// Monster art: the Moonlit Manor bosses (the levels 15-20 group dungeon, 2026-11, see
// docs/design/moonlit-manor.md). Built on the manor rig like the manor monsters, then drawn grand
// (`grand`: the whole figure, its strokes and its face scaled up together) to the queens' size.
//   waltzrondo    Dame Rondo, the leading Armour: a tall knight in silver plate with a plumed helm
//                 and a rapier, dancing the man's part of the waltz with a courtly bow and a lunge.
//   waltzminuet   Dame Minuet, the following Armour: plate made into a ballgown, a hoop skirt of
//                 steel lames, a tiara helm and a fan-shield; she twirls and the skirt slices.
//   velvet        Madame Velvet, the head housekeeper: a tall stern ghost in plum velvet with a
//                 chatelaine of keys, half-moon spectacles and her tea trolley; she hurls plates.
//   marigold      Lady Marigold, the Eternal Hostess: a floating ghost in a gown of marigold
//                 petals, hair drifting upward, a moon tiara and a lace fan; lonely more than wicked.
// All face right, feet (or hem) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { poseAt, solve, plant, limb3, inHead, drawRig } from './manorrig.js';
import { armPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT, wisp } from './manor.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

// Draw a rig figure grand: rig units (72 x 80, ground at 78) scaled by k into a w x h canvas, its
// feet on the canvas floor.
function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 4, false);
  else P = poseAt(K.idle, f, 8);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  return P;
}
// A plate limb: a steel tube with a lit ridge and a round couter or poleyn at the joint.
function plateLimb(a, b, c, w, C, back) {
  const col = back ? C.plateDk : C.plate;
  return [
    ...limb3(a, b, c, w, w * 0.86, w * 0.74, col),
    fband([lerp2(a, b, 0.15), lerp2(a, b, 0.85)], w * 0.22, back ? C.plate : C.plateLt, 1),
    fband([lerp2(b, c, 0.2), lerp2(b, c, 0.85)], w * 0.2, back ? C.plate : C.plateLt, 1),
    ...ooval(b[0], b[1], w * 0.62, w * 0.56, back ? C.plateDk : C.plateLt),
    dot(b[0], b[1], w * 0.2, C.trim),
  ];
}
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
function sabaton(L, C, back) {
  const [fx, fy] = L.ft;
  return opoly(round([[fx - 2.2, fy - 2.6], [fx + 2.2, fy - 2.8], [fx + 4.6, fy - 0.6], [fx + 4.2, fy + 0.8], [fx - 2.4, fy + 0.8]], 2), back ? C.plateDk : C.plate);
}
function gauntlet(A, C, back) {
  return [...plateLimb(A.sh, A.el, A.hand, 2.6, C, back), ...ooval(A.hand[0], A.hand[1], 1.6, 1.4, back ? C.plateDk : C.plateLt)];
}

// ---------- The Waltzing Armours ----------

const RONDO = soften({
  skin: '#fff0ea', skinDk: '#f0d4cc', hair: '#e8ecff', hairDk: '#a8b0e0', hairLt: '#ffffff',
  plate: '#cfd8f2', plateDk: '#97a2d0', plateLt: '#ffffff', trim: '#ffcf6b', trimDk: '#d89a2a',
  coat: '#5a62c8', coatDk: '#3f46a4', lining: '#ff9fc4', plume: '#7fb8ff', plumeDk: '#4a7ad8', plumeLt: '#d6ecff',
  blade: '#f4f8ff', bladeDk: '#a8b8d8', glow: '#bfe2ff', rose: '#ff7aa0', roseDk: '#d84a7a',
});
const MINUET = soften({
  skin: '#fff0ea', skinDk: '#f0d4cc', hair: '#ffb3d0', hairDk: '#e07aa4', hairLt: '#ffe0ec',
  plate: '#ffe0ec', plateDk: '#e8a8c4', plateLt: '#ffffff', trim: '#ffcf6b', trimDk: '#d89a2a',
  coat: '#ff9fc4', coatDk: '#e070a0', lining: '#a8b8ff', plume: '#ffffff', plumeDk: '#e6d6f2', plumeLt: '#ffffff',
  fan: '#fff4fa', fanDk: '#f0c4dc', blade: '#f4f8ff', bladeDk: '#a8b8d8', glow: '#ffd6ec', gem: '#7fb8ff',
});
const RONDO_FACE = { skin: RONDO.skin, skinSh: '#f0d4cc', skinSh2: '#d8b0b0', blush: '#ffa8bc', lip: '#d8607e', lipLine: '#a03a58', eye: eyes('#7fb8ff', '#2a5aa8', '#dff0ff', { tilt: 0.3, ry: 2.3, flicks: 2, lashLen: 0.9 }), brow: { c: '#a8b0e0', kind: 'straight', w: 0.9 }, moods: { idle: { open: 0.7, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'smile' } } };
const MINUET_FACE = { skin: MINUET.skin, skinSh: '#f0d4cc', skinSh2: '#d8b0b0', blush: '#ffa0c0', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#ff9fc4', '#a83a6a', '#ffe6f0', { tilt: -0.05, rx: 3.6, ry: 3.1, flicks: 2, lashLen: 0.95, ink: '#7a3a6a' }), brow: { c: '#e07aa4', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };

// The waltz: ONE-two-three, a long step down on the beat, a rise onto the toes, a close, sway
// leaning into each bar. Rondo keeps a dance frame: her back arm raised to hold her partner's hand.
const FRAME = [-1.9, -0.9];
const RONDO_K = {
  walk: [
    { hip: [36, 47], lean: 0.1, tilt: 0.06, arms: [FRAME, [0.5, -0.8]], legs: [[-0.45, 0.2], [0.55, 0.1]], blade: -0.5 },
    { hip: [36, 44], lean: 0.02, tilt: -0.06, arms: [[-2, -0.8], [0.4, -0.9]], legs: [[-0.1, 0.2], [0.15, 0.05]], blade: -0.55 },
    { hip: [36, 44.6], lean: -0.04, tilt: -0.1, arms: [[-2, -0.8], [0.4, -0.8]], legs: [[0.05, 0.05], [-0.05, 0.1]], blade: -0.45 },
    { hip: [36, 47], lean: 0.1, tilt: 0.08, arms: [FRAME, [0.5, -0.8]], legs: [[0.55, 0.1], [-0.45, 0.2]], blade: -0.5 },
    { hip: [36, 44], lean: 0.02, tilt: -0.06, arms: [[-2, -0.8], [0.4, -0.9]], legs: [[0.15, 0.05], [-0.1, 0.2]], blade: -0.55 },
    { hip: [36, 44.6], lean: -0.04, tilt: -0.1, arms: [[-2, -0.8], [0.4, -0.8]], legs: [[-0.05, 0.1], [0.05, 0.05]], blade: -0.45 },
  ],
  idle: [
    { hip: [36, 46], lean: -0.04, tilt: -0.06, arms: [[0.1, -1.6], [0.25, -0.5]], legs: [[-0.12, 0], [0.22, 0.05]], blade: 0.25 },
    { hip: [36, 45.4], lean: -0.06, tilt: 0.04, arms: [[0.1, -1.7], [0.3, -0.5]], legs: [[-0.12, 0], [0.22, 0.05]], blade: 0.3 },
    { hip: [36, 46], lean: -0.04, tilt: -0.08, arms: [[0.1, -1.6], [0.25, -0.5]], legs: [[-0.12, 0], [0.22, 0.05]], blade: 0.25 },
    // A courtly bow, sword swept aside.
    { hip: [35, 47.4], lean: 0.45, tilt: 0.25, arms: [[-0.9, -0.3], [0.9, 0.2]], legs: [[-0.3, 0.3], [0.35, 0.1]], blade: 0.9 },
    { hip: [35, 47.4], lean: 0.42, tilt: 0.2, arms: [[-0.9, -0.3], [0.9, 0.2]], legs: [[-0.3, 0.3], [0.35, 0.1]], blade: 0.9 },
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.1, -1.6], [0.25, -0.5]], legs: [[-0.12, 0], [0.22, 0.05]], blade: 0.25 },
  ],
  // A fencer's lunge: en garde, the long thrust with the back leg straight, the recovery.
  attack: [
    { hip: [33, 47], lean: -0.14, tilt: -0.1, arms: [[-1.9, -1.3], [0.9, -1.6]], legs: [[-0.5, 0.25], [0.45, 0.4]], blade: -1.4 },
    { hip: [31, 48], lean: -0.2, tilt: -0.12, arms: [[-2.2, -1.1], [0.5, -1.9]], legs: [[-0.55, 0.3], [0.5, 0.5]], blade: -1.6 },
    { hip: [43, 52], lean: 0.32, tilt: 0.14, arms: [[-2.3, 0.2], [1.6, -0.05]], legs: [[-1.05, 0.15], [0.95, -0.9]], blade: 0 },
    { hip: [43, 52], lean: 0.3, tilt: 0.12, arms: [[-2.3, 0.2], [1.62, -0.02]], legs: [[-1.05, 0.15], [0.95, -0.9]], blade: 0 },
    { hip: [37, 47], lean: 0.02, tilt: 0, arms: [FRAME, [0.5, -0.8]], legs: [[-0.3, 0.1], [0.3, 0.05]], blade: -0.5 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], blade: 1.5 },
};

function plume(x, y, ph, C, len = 14, sway = 1) {
  const out = [];
  for (const [k, c, w] of [[0, C.plumeDk, 4.6], [1, C.plume, 3.6], [2, C.plumeLt, 2]]) {
    const pts = KIT.flowPts([x - k * 0.3, y + k * 0.4], -Math.PI / 2 - 0.9 - k * 0.2, -1.8 + k * 0.2, len - k * 2, ph - k * 0.4, 0.2 * sway, 5, 0.9);
    out.push(...(k === 0 ? oband(pts, (t) => lerp(w, 1, t), c, 4) : [fband(pts, (t) => lerp(w, 0.6, t), c, 3)]));
  }
  return out;
}

function waltzrondo(pose, f, mood) {
  const C = fade(RONDO, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, RONDO_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#4a4a9a');
  const A = S.arms[1];
  const sA = A.a - Math.PI / 2 + (P.blade ?? 0);
  const tip = [A.hand[0] + Math.cos(sA) * 22, A.hand[1] + Math.sin(sA) * 22];
  const tr = pose === 'walk' ? 1 : 0.4;
  const thrust = pose === 'attack' && (f === 2 || f === 3);
  return big(150, 140, 1.62, () => drawRig(S, {
    behind: () => {
      // The tailcoat of plate: two long cloth tails lined in pink, flaring on each step.
      const [hx, hy] = S.hip;
      const out = [];
      for (const k of [0, 1]) out.push(...oband([[hx - 2 + k * 1.4, hy - 3], [hx - 5 - tr * 2 - k, hy + 7 + Math.sin(ph - k) * 0.8], [hx - 8 - tr * 4 - k * 2, hy + 15 + Math.sin(ph - k - 1) * 1.2]], taperW(5.4, 2.2), k ? C.coatDk : C.coat, 3));
      out.push(fband([[hx - 3.4, hy + 2], [hx - 8 - tr * 4, hy + 14]], taperW(1.2, 0.6), C.lining, 2));
      return out;
    },
    backArm: () => gauntlet(S.arms[0], C, true),
    backLeg: () => [...plateLimb(S.legs[0].hip, S.legs[0].kn, S.legs[0].ft, 3.8, C, true), sabaton(S.legs[0], C, true)].flat(),
    body: () => {
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const out = [];
      // Tassets in overlapping lames, then the cuirass with its gold-trimmed ridge and a rose.
      for (let i = 2; i >= 0; i--) out.push(...opoly(round([[hx - 5 + i * 0.3, hy - 1 + i * 2.2], [hx + 5 - i * 0.3, hy - 1 + i * 2.2], [hx + 5.6 - i * 0.2, hy + 2.2 + i * 2.2], [hx - 5.6 + i * 0.2, hy + 2.2 + i * 2.2]], 1), i % 2 ? C.plateDk : C.plate));
      out.push(...bodice(S, C.plate, C.plateDk));
      out.push(fband([[cx + 0.6, cy - 1], [lerp(cx, hx, 0.85) + 0.6, lerp(cy, hy, 0.85)]], 0.8, C.plateLt, 1));
      out.push(fband(arcPts(cx, cy + 0.4, 4, 1.4, 190, 350, 6), 0.7, C.trim, 1), line([[hx - 4.2, hy - 1.2], [hx + 4.2, hy - 1.2]], 0.8, C.trim));
      out.push(...ooval(cx - 2.2, cy + 3, 1.6, 1.5, C.rose), fband(arcPts(cx - 2.2, cy + 3, 0.9, 0.8, 0, 300, 6), 0.4, C.roseDk, 1));
      // Pauldron with layered lames and gold rim.
      const [sx, sy] = S.arms[1].sh;
      out.push(...ooval(sx, sy + 0.6, 3.6, 3, C.plate), fband(arcPts(sx, sy + 0.6, 3.4, 2.8, 10, 170, 6), 0.7, C.trim, 1), fband(arcPts(sx, sy - 0.4, 2.2, 1.4, 200, 330, 5), 0.6, C.plateLt, 1));
      return out;
    },
    frontLeg: () => [...plateLimb(S.legs[1].hip, S.legs[1].kn, S.legs[1].ft, 3.8, C, false), sabaton(S.legs[1], C, false)].flat(),
    head: () => headPart(S, mood, RONDO_FACE, SWEPT, HR, 1.12, () => backHair(HR, 5), () => {
      // An open-faced helm: a polished cap with a nasal crest, a gold band and a tall blue plume.
      const out = [...opoly(round([[-8.2, -1], [-8, -6.4], [-4, -10.4], [2.4, -10.8], [7.6, -7.4], [8.6, -3.4], [6.6, -4.2], [3, -7.6], [-3, -7.2], [-6.4, -3.6], [-6.4, 1.4]], 2), C.plate)];
      out.push(fband(arcPts(-0.4, -4.6, 7.4, 5.8, 200, 330, 8), 0.9, C.trim, 1), fband(arcPts(-1, -6.4, 5.4, 3.6, 210, 290, 6), 0.7, C.plateLt, 1));
      out.push(...opoly([[-8.6, -1.4], [-6.2, -1.4], [-6.6, 4], [-8.8, 3]], C.plateDk), dot(-7.6, -0.4, 0.6, C.trim));
      out.push(...plume(-3, -10.4, ph, C, 15, pose === 'walk' ? 1.2 : 0.7));
      return out;
    }),
    frontArm: () => {
      const out = [];
      // The rapier: a long thin blade, a swept gold hilt with a ring guard.
      out.push(...oband([A.hand, tip], taperW(1.5, 0.4), C.blade, 1, 0.3), line([[A.hand[0] + Math.cos(sA) * 4, A.hand[1] + Math.sin(sA) * 4], tip], 0.3, C.bladeDk));
      out.push(...oband(arcPts(A.hand[0] + Math.cos(sA) * 0.6, A.hand[1] + Math.sin(sA) * 0.6, 2.6, 2.6, (sA * 180) / Math.PI + 60, (sA * 180) / Math.PI + 300, 7), 0.6, C.trim, 2, 0.3));
      out.push(dot(A.hand[0] - Math.cos(sA) * 2.4, A.hand[1] - Math.sin(sA) * 2.4, 1, C.trim));
      out.push(...gauntlet(A, C, false));
      if (thrust) {
        // The thrust's streak and a star of light at the point.
        const k = f === 2 ? 1 : 0.7;
        out.push(fband([[A.hand[0] - 6, A.hand[1]], [tip[0] + 4 * k, tip[1]]], (t) => 2.8 * Math.sin(Math.PI * t) * k, mix(C.glow, '#ffffff', 0.4), 1));
        out.push(sparkle(tip[0] + 3, tip[1], 3.2 * k, '#ffffff'), sparkle(tip[0] + 3, tip[1], 1.6 * k, C.glow));
      }
      return out;
    },
  }));
}

// Minuet follows: her steps mirror Rondo's, the hoop skirt swinging out on each turn of the bar.
const MINUET_K = {
  walk: [
    { hip: [36, 46], lean: -0.06, tilt: -0.12, arms: [[-2.2, -0.6], [0.5, -1.25]], legs: [[0.4, 0.1], [-0.3, 0.2]], sway: 1 },
    { hip: [36, 43.4], lean: -0.02, tilt: 0.08, arms: [[-2.3, -0.5], [0.6, -1.35]], legs: [[0.1, 0.05], [-0.1, 0.2]], sway: 0 },
    { hip: [36, 44], lean: 0.04, tilt: 0.14, arms: [[-2.2, -0.6], [0.5, -1.2]], legs: [[-0.05, 0.1], [0.05, 0.05]], sway: -1 },
    { hip: [36, 46], lean: -0.06, tilt: -0.12, arms: [[-2.2, -0.6], [0.5, -1.25]], legs: [[-0.3, 0.2], [0.4, 0.1]], sway: 1 },
    { hip: [36, 43.4], lean: -0.02, tilt: 0.08, arms: [[-2.3, -0.5], [0.6, -1.35]], legs: [[-0.1, 0.2], [0.1, 0.05]], sway: 0 },
    { hip: [36, 44], lean: 0.04, tilt: 0.14, arms: [[-2.2, -0.6], [0.5, -1.2]], legs: [[0.05, 0.05], [-0.05, 0.1]], sway: -1 },
  ],
  idle: [
    { hip: [36, 46], lean: 0, tilt: 0.12, arms: [[0.3, -0.7], [0.6, -2.1]], legs: [[-0.1, 0], [0.15, 0.05]], sway: 0.3, fan: 0.2 },
    { hip: [36, 45.6], lean: -0.02, tilt: 0.2, arms: [[0.3, -0.8], [0.7, -2.2]], legs: [[-0.1, 0], [0.15, 0.05]], sway: -0.3, fan: 0.9 },
    { hip: [36, 46], lean: 0, tilt: 0.1, arms: [[0.3, -0.7], [0.6, -2.1]], legs: [[-0.1, 0], [0.15, 0.05]], sway: 0.3, fan: 0.2 },
    { hip: [36, 45.6], lean: -0.02, tilt: 0.2, arms: [[0.3, -0.8], [0.7, -2.2]], legs: [[-0.1, 0], [0.15, 0.05]], sway: -0.3, fan: 0.9 },
    // A curtsey.
    { hip: [36, 50], lean: 0.12, tilt: 0.3, arms: [[-0.5, 0.2], [0.6, -0.3]], legs: [[-0.6, 1], [0.3, 0.6]], sway: 0, fan: 0 },
    { hip: [36, 46], lean: 0, tilt: 0.12, arms: [[0.3, -0.7], [0.6, -2.1]], legs: [[-0.1, 0], [0.15, 0.05]], sway: 0.3, fan: 0.2 },
  ],
  // A pirouette slash: wind the fan back, whirl (the skirt flares wide, its lames cut), fan snaps out.
  attack: [
    { hip: [34, 46], lean: -0.14, tilt: -0.14, arms: [[0.8, -0.6], [-1.6, -1.2]], legs: [[-0.2, 0.1], [0.2, 0.3]], sway: 2, fan: 0 },
    { hip: [35, 43], lean: -0.04, tilt: 0.04, arms: [[-1.5, -0.2], [1.8, -0.4]], legs: [[0.05, 0.1], [0.05, 0.8]], sway: -2.4, fan: 1 },
    { hip: [39, 44], lean: 0.16, tilt: 0.1, arms: [[-1.8, -0.1], [1.7, 0]], legs: [[-0.3, 0.1], [0.4, 0.1]], sway: -3, fan: 1 },
    { hip: [39, 45], lean: 0.12, tilt: 0.08, arms: [[-1.6, -0.2], [1.6, 0.1]], legs: [[-0.3, 0.1], [0.4, 0.1]], sway: -1.6, fan: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.1, arms: [[0.3, -0.7], [0.6, -2.1]], legs: [[-0.1, 0], [0.15, 0.05]], sway: 0.3, fan: 0.2 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], sway: 0 },
};

function fanShape(h, a, open, C, r = 7) {
  const out = [];
  const a0 = a - open * 1.1;
  const a1 = a + open * 0.25;
  const n = 6;
  const pts = [h];
  for (let i = 0; i <= n; i++) {
    const t = lerp(a0, a1, i / n);
    pts.push([h[0] + Math.cos(t) * r, h[1] + Math.sin(t) * r]);
  }
  out.push(...opoly(pts, C.fan));
  for (let i = 0; i <= n; i += 1) {
    const t = lerp(a0, a1, i / n);
    out.push(line([h, [h[0] + Math.cos(t) * r * 0.96, h[1] + Math.sin(t) * r * 0.96]], 0.3, C.fanDk));
  }
  for (let i = 0; i < n; i++) {
    const t = lerp(a0, a1, (i + 0.5) / n);
    out.push(dot(h[0] + Math.cos(t) * r * 0.78, h[1] + Math.sin(t) * r * 0.78, 0.5, i % 2 ? C.coat : C.lining));
  }
  out.push(dot(h[0], h[1], 0.7, C.trim));
  return out;
}

function waltzminuet(pose, f, mood) {
  const C = fade(MINUET, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, MINUET_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a5a');
  const A = S.arms[1];
  const sway = P.sway ?? 0;
  const whirl = pose === 'attack' && f >= 1 && f <= 3;
  return big(150, 140, 1.62, () => drawRig(S, {
    behind: () => {
      // A long ribbon from her back bow, streaming with the dance.
      const [hx, hy] = S.hip;
      const out = [];
      for (const k of [0, 1]) out.push(...oband(KIT.flowPts([hx - 4, hy - 3], Math.PI / 2 + 0.7 + k * 0.3, 0.6, 16 + k * 3 + Math.abs(sway) * 2, ph - k, 0.2, 5, 0.8), taperW(2.6, 1.2), k ? C.coatDk : C.coat, 3));
      // Long hair in a high tail, swinging.
      out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 7, S.head[1] - 6], Math.PI / 2 + 0.15, 0.3, 26, ph - 0.8, pose === 'walk' ? 0.2 : 0.12, 6), 5.6, HR));
      return out;
    },
    backArm: () => gauntlet(S.arms[0], C, true),
    backLeg: () => [...plateLimb(S.legs[0].hip, S.legs[0].kn, S.legs[0].ft, 3.2, C, true), sabaton(S.legs[0], C, true)].flat(),
    body: () => {
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const out = [];
      // The hoop skirt of steel lames: three tiers, each flaring with the sway; in the whirl they
      // fan out wide and glint like blades.
      const fl = whirl ? 5 : Math.abs(sway) * 1.2;
      for (let i = 2; i >= 0; i--) {
        const y0 = hy - 1 + i * 4;
        const w0 = 5 + i * 3 + fl * (i / 2);
        const sk = sway * (0.6 + i * 0.4);
        out.push(...opoly(round([[hx - w0 + 1.4 + sk * 0.5, y0], [hx + w0 - 1.4 + sk * 0.5, y0], [hx + w0 + 1.6 + sk, y0 + 5.4], [hx - w0 - 1.6 + sk, y0 + 5.4]], 2), i % 2 ? C.plateDk : C.plate));
        out.push(fband([[hx - w0 + 2 + sk * 0.5, y0 + 1], [hx + w0 - 2 + sk * 0.5, y0 + 1]], 0.7, C.plateLt, 1), line([[hx - w0 - 1.2 + sk, y0 + 5], [hx + w0 + 1.2 + sk, y0 + 5]], 0.6, C.trim));
        for (let k = -1; k <= 1; k++) out.push(dot(hx + k * w0 * 0.6 + sk * 0.8, y0 + 3, 0.5, C.gem));
      }
      out.push(...bodice(S, C.plate, C.plateDk));
      // A sweetheart breastplate with a heart gem, gold edges, a big bow at the back.
      out.push(fband(arcPts(cx, cy + 1.2, 3.6, 1.8, 195, 345, 6), 0.7, C.trim, 1), ...KIT.gem(cx + 0.4, cy + 4, 1.3, C.gem));
      out.push(...ooval(hx - 5.4, hy - 2.4, 2.6, 1.8, C.coat, -0.4), ...ooval(hx - 7, hy - 0.6, 2.2, 1.4, C.coat, 0.6), dot(hx - 4.6, hy - 2, 1, C.coatDk));
      const [sx, sy] = S.arms[1].sh;
      out.push(...ooval(sx, sy + 0.6, 3, 2.6, C.plate), fband(arcPts(sx, sy + 0.6, 2.8, 2.4, 10, 170, 6), 0.6, C.trim, 1));
      if (whirl) for (let k = 0; k < 5; k++) out.push(sparkle(hx - 12 + k * 6 + sway, hy + 9 + (k % 2) * 4, 1.6, '#ffffff'));
      return out;
    },
    frontLeg: () => [...plateLimb(S.legs[1].hip, S.legs[1].kn, S.legs[1].ft, 3.2, C, false), sabaton(S.legs[1], C, false)].flat(),
    head: () => headPart(S, mood, MINUET_FACE, BANGS, HR, 1.14, null, () => {
      // A tiara helm: a silver circlet rising to a crown point, a blue jewel, little wings of steel.
      const out = [...opoly(round([[-6.6, -6.4], [-3, -8.6], [0, -11.2], [3, -8.8], [6.8, -6.6], [6, -5], [0, -7.4], [-6, -4.8]], 1), C.plate)];
      out.push(...KIT.gem(0, -8.4, 1.4, C.gem), fband(arcPts(0, -3.4, 7, 4.2, 210, 330, 6), 0.6, C.trim, 1));
      out.push(...opoly([[-7, -5], [-11, -8.4], [-10, -4.8], [-8, -3.4]], C.plateLt), ...opoly([[-7.4, -3.6], [-11.2, -5], [-9.6, -2.4]], C.plateDk));
      return out;
    }),
    frontArm: () => {
      const fanA = A.a - Math.PI / 2 - 0.4;
      const out = [...fanShape(A.hand, fanA, lerp(0.4, 1.3, P.fan ?? 0.5), C, 6.4), ...gauntlet(A, C, false)];
      if (whirl) {
        // The whirl's ring of steel and petals.
        const [hx, hy] = S.hip;
        const k = f === 2 ? 1 : 0.75;
        out.push(fband(arcPts(hx + sway, hy + 6, 22 * k, 6 * k, 200, 520, 16), (t) => 2.4 * Math.sin(Math.PI * t), mix(C.plateLt, C.coat, 0.3), 1));
        for (let i = 0; i < 6; i++) out.push(...ooval(hx + Math.cos(i * 1.1 + ph) * 20 * k, hy + 6 + Math.sin(i * 1.1 + ph) * 5 * k, 1.3, 0.8, i % 2 ? C.coat : '#ffffff', i, 0.3));
      }
      return out;
    },
  }));
}

// ---------- Madame Velvet, the head housekeeper ----------

const MV = soften({
  skin: '#f0eeff', skinDk: '#d6d2f2', hair: '#4a3a7a', hairDk: '#2e2456', hairLt: '#8a78c8',
  dress: '#7a3a8a', dressDk: '#56246a', dressLt: '#a860b4', collar: '#ffffff', collarDk: '#e0dcf2', apron: '#f4f0ff', apronDk: '#d8d0f0',
  brass: '#ffd36b', brassDk: '#c8902a', key: '#ffe08a', glass: '#dff0ff', mist: '#e6e0ff', mistDk: '#c4b8f0', mistLt: '#ffffff',
  wood: '#c98a6b', woodDk: '#985a48', woodLt: '#e6b090', cloth: '#ffffff', china: '#ffffff', chinaDk: '#d8d4ea', chinaTrim: '#a860b4', tea: '#e8a070', cloche: '#e6ecf6', clocheDk: '#a8b4c8',
});
const MV_FACE = { skin: MV.skin, skinSh: '#d6d2f2', skinSh2: '#b4acdc', blush: '#d4b4f0', lip: '#a8508a', lipLine: '#6a2a5a', eye: eyes('#c890ff', '#5a2aa8', '#ecdcff', { tilt: 0.38, ry: 2.1, rx: 3.3, flicks: 2, lashLen: 1.1 }), brow: { c: '#4a3a7a', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.55, mouth: 'calm' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'smirk' } } };
const PUSH = [[0.95, -0.55], [1.05, -0.65]];
const MV_K = {
  // She glides behind her trolley, straight-backed, the hem rippling; the keys swing.
  walk: [0, 1, 2, 3].map((i) => ({ hip: [30, 44 + Math.sin((i / 4) * TAU) * 0.7], lean: 0.08, tilt: -0.04 + Math.sin((i / 4) * TAU) * 0.03, arms: PUSH, legs: [[0, 0], [0, 0]], keys: Math.sin((i / 4) * TAU) * 0.5 })),
  idle: [
    { hip: [30, 44], lean: -0.03, tilt: -0.06, arms: [[0.2, -1.9], [0.7, -0.9]], legs: [[0, 0], [0, 0]], keys: 0.1, watch: 0 },
    { hip: [30, 43.4], lean: -0.04, tilt: 0.06, arms: [[0.2, -2], [0.9, -1.6]], legs: [[0, 0], [0, 0]], keys: -0.1, watch: 1 },
    { hip: [30, 43.4], lean: -0.04, tilt: 0.1, arms: [[0.2, -2], [0.9, -1.7]], legs: [[0, 0], [0, 0]], keys: 0, watch: 1 },
    { hip: [30, 44], lean: -0.03, tilt: -0.06, arms: [[0.2, -1.9], [0.7, -0.9]], legs: [[0, 0], [0, 0]], keys: 0.1, watch: 0 },
  ],
  // She snatches a stack of plates from the trolley and flings them spinning.
  attack: [
    { hip: [29, 44], lean: -0.12, tilt: -0.14, arms: [[0.4, -0.8], [-0.9, -2.2]], legs: [[0, 0], [0, 0]], keys: 0.6, plates: 1 },
    { hip: [27, 44], lean: -0.22, tilt: -0.2, arms: [[0.6, -0.6], [-1.6, -1.6]], legs: [[0, 0], [0, 0]], keys: 0.9, plates: 1 },
    { hip: [34, 44], lean: 0.24, tilt: 0.12, arms: [[-0.4, -0.4], [1.7, -0.1]], legs: [[0, 0], [0, 0]], keys: -0.8, plates: 0 },
    { hip: [34, 44], lean: 0.2, tilt: 0.1, arms: [[-0.4, -0.4], [1.8, 0]], legs: [[0, 0], [0, 0]], keys: -0.5, plates: 0 },
    { hip: [31, 44], lean: 0.04, tilt: 0, arms: PUSH, legs: [[0, 0], [0, 0]], keys: 0, plates: 0 },
  ],
  dead: { hip: [28, 62], lean: 0.5, tilt: 0.6, arms: [[0.3, 0.2], [0.6, 0.2]], legs: [[0, 0], [0, 0]], keys: 0.6 },
};

function trolley(x, y, ph, C, wob, stocked) {
  // A two-tier tea trolley: brass rails, a lace cloth, teapot, cups and a cloche on top, a cake
  // stand below, little wheels.
  const out = [];
  const top = y - 22;
  const mid = y - 10;
  out.push(line([[x - 13, top], [x - 13, y - 2]], 1, C.brassDk), line([[x + 11, top], [x + 11, y - 2]], 1, C.brassDk));
  out.push(...oband([[x - 18, top - 6], [x - 16, top - 1], [x - 13, top]], 0.9, C.brass, 2, 0.3));
  for (const yy of [top, mid]) out.push(...opoly(round([[x - 15, yy - 1], [x + 13, yy - 1], [x + 13, yy + 1.4], [x - 15, yy + 1.4]], 1), C.wood), fband([[x - 14, yy - 0.4], [x + 12, yy - 0.4]], 0.5, C.woodLt, 1));
  for (let k = 0; k < 7; k++) out.push(...ooval(x - 13 + k * 4, top + 2.2, 1.6, 1.1, C.cloth, 0, 0.25));
  for (const wx of [x - 12, x + 10]) out.push(...ooval(wx, y - 1.6, 2, 2, C.woodDk), dot(wx, y - 1.6, 0.7, C.brass));
  if (stocked) {
    // The teapot, steam curling from its spout.
    out.push(...ooval(x - 6, top - 4.2, 4.4, 3.6, C.china), fband(arcPts(x - 6, top - 3.6, 4, 2.6, 20, 160, 6), 0.6, C.chinaTrim, 1), ...opoly([[x - 2.4, top - 4.6], [x + 1.6, top - 8], [x + 2.2, top - 7.2], [x - 2, top - 3]], C.china), ...ooval(x - 6, top - 8, 2.2, 0.9, C.chinaDk), dot(x - 6, top - 9, 0.8, C.chinaTrim));
    for (let k = 0; k < 3; k++) out.push(dot(x + 2 + Math.sin(ph + k) * 0.8, top - 10 - k * 2.2, 0.7 - k * 0.12, C.mistLt));
    // The cloche, its dome catching the light.
    out.push(...opoly(round([[x + 3, top - 1], [x + 3.6, top - 5.6], [x + 7.4, top - 7.8], [x + 11.2, top - 5.6], [x + 11.8, top - 1]], 2), C.cloche), fband(arcPts(x + 7.4, top - 2, 3.4, 4.6, 200, 260, 4), 0.6, '#ffffff', 1), dot(x + 7.4, top - 8.4, 0.9, C.clocheDk));
    // Cake stand and stacked plates below.
    out.push(...ooval(x - 5, mid - 3.4, 4, 1, C.china), line([[x - 5, mid - 3], [x - 5, mid]], 0.6, C.chinaDk), ...ooval(x - 5, mid - 5, 2, 1.4, '#ffb3cf'), dot(x - 5, mid - 6.4, 0.6, '#ff5f8f'));
    for (let k = 0; k < 4; k++) out.push(...ooval(x + 6, mid - 1 - k * 1.1, 4.2, 0.9, C.china, 0, 0.3));
  }
  return within(at(x, y, wob), () => out);
}

function velvet(pose, f, mood) {
  const C = fade(MV, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, MV_K);
  const S = solve(P, 1.04);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a1238');
  const dead = mood === 'dead';
  const A = S.arms[1];
  const tr = pose === 'walk' ? 1 : 0.4;
  return big(170, 140, 1.62, () => drawRig(S, {
    behind: () => {
      const out = [...wisp([S.hip[0] - 1, S.hip[1] + 18], ph, tr, dead ? 10 : 15, 14, C, f, n)];
      // A tall bun with a key-shaped hairpin, behind the head.
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    body: () => {
      const g = gown(S, 20, 10, C.dress, C.dressDk, Math.sin(ph) * 0.7);
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const out = [...g.out];
      // Velvet sheen down the skirt, a long apron, a lace hem dissolving into mist.
      out.push(fband([[hx + 2, hy + 2], [hx + 5 + Math.sin(ph) * 0.6, hy + 19]], taperW(1, 2), C.dressLt, 1));
      out.push(...opoly(round([[hx - 2.6, hy - 1], [hx + 3.6, hy - 1], [hx + 5, hy + 16], [hx - 3, hy + 16]], 2), C.apron), fpoly([[hx - 2.6, hy - 0.8], [hx - 0.6, hy - 0.8], [hx - 1, hy + 15.8], [hx - 3, hy + 15.8]], C.apronDk));
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - 2.2 + k * 1.75, hy + 16.4, 1, 0.8, C.collar, 0, 0.25));
      out.push(...bodice(S, C.dress, C.dressDk));
      // Buttons up the bodice, a high white collar with a cameo.
      for (let k = 0; k < 4; k++) out.push(dot(lerp(hx, cx, 0.15 + k * 0.22) + 1.6, lerp(hy, cy, 0.15 + k * 0.22), 0.5, C.brass));
      out.push(...opoly(round([[cx - 3, cy - 1.8], [cx + 3.2, cy - 1.8], [cx + 2.4, cy - 4.4], [cx - 2.2, cy - 4.4]], 1), C.collar), ...ooval(cx + 0.4, cy - 0.6, 1.3, 1.5, C.dressLt), dot(cx + 0.4, cy - 0.6, 0.6, C.collar));
      // The chatelaine: a ring of keys on chains swinging from her belt.
      const ka = P.keys ?? 0;
      const kx = hx + 3.6;
      const ky = hy - 0.4;
      out.push(line([[hx - 4, hy - 1.2], [hx + 4.2, hy - 1.2]], 1, C.dressDk), ...ooval(kx, ky, 1, 1, C.brass));
      within(at(kx, ky, ka * 0.5), () => {
        out.push(line([[0, 0], [0, 4]], 0.4, C.brassDk), ...ooval(0, 5.4, 2, 2, C.brass), dot(0, 5.4, 1.2, C.dress));
        for (let k = 0; k < 4; k++) {
          const a = -0.6 + k * 0.4;
          const e = [Math.sin(a) * 6, 5.4 + Math.cos(a) * 6];
          out.push(line([[Math.sin(a) * 2, 5.4 + Math.cos(a) * 2], e], 0.6, C.key), ...ooval(e[0], e[1], 0.9, 0.9, C.key), line([[e[0] - 0.6, e[1] - 1.6], [e[0] - 1.4, e[1] - 1.6]], 0.4, C.key));
        }
      });
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.8, 2.6, C.dressLt), fband(arcPts(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, 2.2, 200, 340, 5), 0.6, C.dress, 1));
      return out;
    },
    head: () => headPart(S, mood, MV_FACE, SWEPT, HR, 1.12, () => {
      // The tall bun and its key hairpin.
      const out = [...backHair(HR, 4), ...ooval(-5, -9, 5, 4.6, C.hair), fband(arcPts(-5, -9, 3.6, 3.2, 180, 330, 6), 0.7, C.hairDk, 1), fband(arcPts(-5.4, -9.6, 2.2, 1.6, 200, 300, 4), 0.6, C.hairLt, 1)];
      out.push(line([[-11, -12], [0, -6]], 0.8, C.brass), ...ooval(-11.4, -12.2, 1.2, 1.2, C.brass), dot(-11.4, -12.2, 0.5, C.hair));
      return out;
    }, () => {
      // Half-moon spectacles on a chain, perched on the nose.
      const out = [fband(arcPts(6.6, 3.2, 2.2, 1.4, 0, 180, 6), 0.55, C.brass, 1), fband(arcPts(1.4, 3.2, 1.7, 1.2, 0, 180, 6), 0.5, C.brass, 1)];
      out.push(line([[3.1, 3], [4.4, 3]], 0.4, C.brass), fband([[-0.4, 3.2], [-3, 6], [-4, 10]], 0.3, C.brassDk, 2));
      return out;
    }),
    frontArm: () => {
      const out = [];
      const ap = P.plates ?? 0;
      // The trolley stands ahead of her: she pushes it on the walk; it rocks to a stop.
      const wob = pose === 'walk' ? Math.sin(ph * 2) * 0.012 : 0;
      if (!dead) out.push(...trolley(S.hip[0] + 30, 78, ph, C, wob, true));
      if (pose === 'idle' && P.watch > 0.3) {
        // A pocket watch, checked with a sniff.
        const [wx, wy] = A.hand;
        out.push(...ooval(wx + 1, wy - 1, 2, 2, C.brass), ...ooval(wx + 1, wy - 1, 1.4, 1.4, C.glass), line([[wx + 1, wy - 1], [wx + 1.2, wy - 2]], 0.3, '#3a2a4a'), fband([[wx + 1, wy + 1], [S.hip[0] + 3, S.hip[1] - 1]], 0.3, C.brassDk, 2));
      }
      if (pose === 'attack' && ap > 0.5) {
        // A stack of plates held high, ready.
        const [px, py] = A.hand;
        for (let k = 0; k < 4; k++) out.push(...ooval(px, py - 1 - k * 1.1, 4.2, 0.9, C.china, 0, 0.3));
      }
      if (pose === 'attack' && (f === 2 || f === 3)) {
        // The plates flying out spinning, one after another.
        const k = f === 2 ? 1 : 1.5;
        for (let i = 0; i < 3; i++) {
          const x = A.hand[0] + 6 + i * 7 * k;
          const y = A.hand[1] - 1 + i * 1.4;
          out.push(...ooval(x, y, 3.6, 1.2 + (i % 2) * 0.8, C.china, 0.2 * i), fband(arcPts(x, y, 2.6, 0.8 + (i % 2) * 0.5, 0, 360, 10), 0.4, C.chinaTrim, 1));
          out.push(line([[x - 5, y + 0.4], [x - 9, y + 0.6]], 0.4, C.mistLt));
        }
      }
      out.push(...armPart(A, C.dress, C.skin));
      out.push(...ooval(lerp(A.el[0], A.hand[0], 0.78), lerp(A.el[1], A.hand[1], 0.78), 1.6, 1.2, C.collar, 0, 0.25));
      return out;
    },
  }));
}

// ---------- Lady Marigold, the Eternal Hostess ----------

const LM = soften({
  skin: '#fff6f0', skinDk: '#f2dcd6', hair: '#ffe0a0', hairDk: '#f0b860', hairLt: '#fff6dc',
  petal: '#ffb347', petalDk: '#f08a2a', petalLt: '#ffd98a', petal2: '#ff8a5a', petal2Dk: '#e0603e',
  bodice: '#fff0d0', bodiceDk: '#f0d0a0', lace: '#ffffff', moon: '#fff8d8', moonDk: '#e8d48a', gem: '#c8a8ff',
  fan: '#fffaf0', fanDk: '#f0dcc0', coat: '#c8a8ff', lining: '#ff9fc4', trim: '#ffd36b',
  mist: '#fff2e0', mistDk: '#f0d8c0', mistLt: '#ffffff', cup: '#ffffff', cupTrim: '#ff9f6a',
});
const LM_FACE = { skin: LM.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ffa8a0', lip: '#e86a6a', lipLine: '#b03a4a', eye: eyes('#ffb347', '#a8520a', '#fff0c8', { rx: 3.6, ry: 2.9, tilt: 0.12, flicks: 3, lashLen: 1.35 }), brow: { c: '#e0a050', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.66, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { open: 0.9, mouth: 'grin' } } };
const LM_K = {
  // She drifts, gown rippling like a flower in water, one hand on the fan, the other offered.
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 40 + Math.sin((i / 4) * TAU) * 1.2], lean: 0.1, tilt: 0.06 + Math.sin((i / 4) * TAU) * 0.04, arms: [[-0.9 + Math.sin((i / 4) * TAU) * 0.15, -0.6], [0.9, -1.9]], legs: [[0, 0], [0, 0]], fan: 0.3 })),
  idle: [
    { hip: [36, 40], lean: -0.02, tilt: 0.14, arms: [[0.4, -0.9], [0.8, -2.2]], legs: [[0, 0], [0, 0]], fan: 1 },
    { hip: [36, 38.6], lean: -0.04, tilt: 0.2, arms: [[0.4, -1], [1, -2.3]], legs: [[0, 0], [0, 0]], fan: 0.7 },
    { hip: [36, 39.4], lean: -0.02, tilt: 0.1, arms: [[0.4, -0.9], [0.8, -2.2]], legs: [[0, 0], [0, 0]], fan: 1 },
    { hip: [36, 38.6], lean: -0.04, tilt: 0.18, arms: [[0.4, -1], [1, -2.3]], legs: [[0, 0], [0, 0]], fan: 0.7 },
  ],
  // A sweep of the fan that throws a gust of petals and teacups.
  attack: [
    { hip: [34, 40], lean: -0.14, tilt: -0.1, arms: [[0.8, -0.8], [-0.7, -0.5]], legs: [[0, 0], [0, 0]], fan: 1 },
    { hip: [33, 38], lean: -0.2, tilt: -0.16, arms: [[1, -0.6], [-1.2, -0.3]], legs: [[0, 0], [0, 0]], fan: 1 },
    { hip: [39, 40], lean: 0.22, tilt: 0.12, arms: [[-0.6, -0.4], [1.7, -0.3]], legs: [[0, 0], [0, 0]], fan: 1 },
    { hip: [39, 40], lean: 0.18, tilt: 0.1, arms: [[-0.6, -0.4], [1.8, -0.2]], legs: [[0, 0], [0, 0]], fan: 1 },
    { hip: [37, 40], lean: 0.02, tilt: 0.1, arms: [[0.4, -0.9], [0.8, -2.2]], legs: [[0, 0], [0, 0]], fan: 0.8 },
  ],
  // Freed: she sinks, hands clasped, at peace.
  dead: { hip: [36, 52], lean: 0.12, tilt: 0.24, arms: [[0.9, -1.8], [0.8, -1.9]], legs: [[0, 0], [0, 0]], fan: 0 },
};

function petalTier(cx, y, rx, n, C, alt, sway, ph, len = 6) {
  // One tier: long petals hanging from a curved line, splaying outward at the sides, their tips
  // lifting and curling in turn as she drifts. Back ones first so the front overlaps.
  const out = [];
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(b - (n - 1) / 2) - Math.abs(a - (n - 1) / 2));
  for (const i of order) {
    const t = i / (n - 1);
    const u = t - 0.5;
    const x = cx + u * rx * 2 + sway * (1 - Math.abs(u));
    const yy = y - Math.abs(u) * 2;
    const a = u * 1.1 + Math.sin(ph + i * 0.9) * 0.08;
    const c = (i + alt) % 2 ? C.petal : C.petal2;
    const cd = (i + alt) % 2 ? C.petalDk : C.petal2Dk;
    const tip = [x + Math.sin(a) * len, yy + Math.cos(a) * len];
    out.push(...oband([[x, yy - 1], [lerp(x, tip[0], 0.55), lerp(yy, tip[1], 0.55)], tip], (q) => Math.sin(Math.PI * Math.min(1, q * 1.15 + 0.08)) * 4.6 + 0.4, c, 3));
    out.push(fband([[x, yy], [lerp(x, tip[0], 0.8), lerp(yy, tip[1], 0.8)]], 0.45, cd, 2), fband([[x - 1, yy], [lerp(x, tip[0], 0.45) - 1.2, lerp(yy, tip[1], 0.45)]], 0.7, C.petalLt, 1));
  }
  return out;
}

function marigold(pose, f, mood) {
  const C = fade(LM, mood === 'dead' ? 'happy' : mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, LM_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#a8603a');
  const A = S.arms[1];
  const freed = mood === 'dead';
  const sweep = pose === 'attack' && (f === 2 || f === 3);
  const fmood = freed ? 'happy' : mood;
  return big(176, 156, 1.86, () => drawRig(S, {
    behind: () => {
      const out = [];
      // The moon behind her, faint, and her long hair drifting upward like it's under water.
      for (const [k, len, w] of [[0, 26, 6], [1, 22, 5.2], [2, 18, 4.4]]) {
        const root = [S.head[0] - 5 - k * 1.5, S.head[1] - 2 + k * 2.4];
        out.push(...KIT.lockHair(KIT.flowPts(root, Math.PI / 2 + 0.1 + k * 0.12, 0.35, len, ph - k * 0.7, 0.16, 6), w, HR));
      }
      return out;
    },
    backArm: () => armPart(S.arms[0], C.bodiceDk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const sway = Math.sin(ph) * (pose === 'walk' ? 1.4 : 0.6) + (sweep ? -2 : 0);
      const out = [];
      // The marigold gown: tiers of petals, the widest at the hem, curling and lifting as she drifts,
      // then a mist train where her feet should be.
      out.push(...wisp([hx - 3, hy + 22], ph, pose === 'walk' ? 1 : 0.4, freed ? 8 : 12, 14, C, f, n));
      const g = gown(S, 20, 12, C.bodice, C.bodiceDk, sway);
      out.push(...g.out);
      out.push(...petalTier(hx + sway * 0.5, hy + 14, 13, 9, C, 0, sway * 1.4, ph, 8));
      out.push(...petalTier(hx + sway * 0.35, hy + 8, 10, 7, C, 1, sway, ph + 1, 7.4));
      out.push(...petalTier(hx + sway * 0.2, hy + 2.6, 7, 6, C, 0, sway * 0.6, ph + 2, 6.6));
      out.push(...petalTier(hx, hy - 1.6, 4.6, 5, C, 1, sway * 0.3, ph + 3, 4.6));
      // Lace bodice, a pearl girdle, a marigold corsage, a sweetheart neckline.
      out.push(...bodice(S, C.bodice, C.bodiceDk));
      out.push(fband(arcPts(cx, cy + 1.4, 3.6, 1.8, 195, 345, 6), 0.6, C.petalDk, 1));
      for (let k = 0; k < 6; k++) out.push(dot(hx - 3.6 + k * 1.5, hy - 1.4 + Math.sin(k) * 0.3, 0.5, '#ffffff'));
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + ph * 0.2;
        out.push(...ooval(cx - 2.4 + Math.cos(a) * 1.6, cy + 3.4 + Math.sin(a) * 1.6, 1.3, 0.9, k % 2 ? C.petal : C.petal2, a, 0.3));
      }
      out.push(dot(cx - 2.4, cy + 3.4, 0.8, C.petalDk));
      // Puffed sleeves of petals.
      const [sx, sy] = S.arms[1].sh;
      for (let k = 0; k < 3; k++) out.push(...ooval(sx - 1.4 + k * 1.4, sy + 0.6 + (k % 2) * 0.6, 2, 2.6, k % 2 ? C.petal : C.petalLt, 0.3 * (k - 1)));
      return out;
    },
    head: () => headPart(S, fmood, LM_FACE, SWEPT, HR, 1.16, () => backHair(HR, 9), () => {
      // A crescent-moon tiara, a fall of pearls, a marigold behind the ear.
      const out = [...opoly(round([[-4, -8], [-1, -10.6], [2.6, -11.2], [5.8, -9.4], [3.4, -9.6], [0.6, -9], [-2.6, -7.2]], 1), C.moon), fband(arcPts(0.6, -5.4, 6.4, 3.8, 210, 330, 6), 0.7, C.moonDk, 1)];
      out.push(...KIT.gem(1.4, -9.8, 1.1, C.gem));
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU;
        out.push(...ooval(-6.4 + Math.cos(a) * 1.8, -2 + Math.sin(a) * 1.8, 1.3, 0.9, k % 2 ? C.petal : C.petal2, a, 0.3));
      }
      out.push(dot(-6.4, -2, 0.9, C.petalDk));
      out.push(...KIT.lockHair(KIT.flowPts([6, 1], Math.PI / 2 - 0.15, 0.4, 12, ph - 0.6, 0.12, 4), 3, HR));
      return out;
    }),
    frontArm: () => {
      const fanA = A.a - Math.PI / 2 - 0.5;
      const out = [];
      if (!freed) out.push(...fanShape(A.hand, fanA, lerp(0.3, 1.25, P.fan ?? 0.5), { ...C, coat: C.petal, lining: C.gem }, 9));
      out.push(...armPart(A, C.bodice, C.skin), ...ooval(lerp(A.el[0], A.hand[0], 0.8), lerp(A.el[1], A.hand[1], 0.8), 1.5, 1.1, C.lace, 0, 0.25));
      if (sweep) {
        // A gust of petals and spinning teacups.
        const k = f === 2 ? 1 : 1.4;
        out.push(fband(arcPts(A.hand[0] + 6, A.hand[1] + 6, 16 * k, 10 * k, -120, 10, 10), (t) => 3 * Math.sin(Math.PI * t), mix(C.petalLt, '#ffffff', 0.4), 1));
        for (let i = 0; i < 7; i++) out.push(...ooval(A.hand[0] + 8 + i * 3.4 * k, A.hand[1] - 4 + Math.sin(i * 1.7) * 6, 1.4, 0.9, i % 2 ? C.petal : C.petal2, i, 0.3));
        for (let i = 0; i < 2; i++) {
          const x = A.hand[0] + 14 + i * 10 * k;
          const y = A.hand[1] + 2 - i * 5;
          out.push(...opoly(round([[x - 2.4, y - 2], [x + 2.4, y - 2], [x + 1.8, y + 1.6], [x - 1.8, y + 1.6]], 1), C.cup), fband(arcPts(x + 2.6, y - 0.2, 1.2, 1.4, -90, 90, 4), 0.5, C.cup, 1), line([[x - 2, y - 1.4], [x + 2, y - 1.4]], 0.5, C.cupTrim));
        }
      }
      if (freed) for (let i = 0; i < 4; i++) out.push(sparkle(S.head[0] - 14 + i * 9, S.head[1] - 14 + (i % 2) * 6 - f, 1.4 + (i % 2), '#ffffff'));
      return out;
    },
  }));
}

// The tea trolley on its own (the hallway chase): frame f of 4, rattling, steam curling.
export function trolleyArt(f) {
  const ph = (f / 4) * TAU;
  return { w: 70, h: 64, res: 3, shapes: grand(1.62, 35 - 0 * 1.62, 64 - 0.6 - 78 * 1.62, () => trolley(0, 78, ph, MV, Math.sin(ph * 2) * 0.03, true)) };
}

export const ART = {
  waltzrondo: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [120, 160, 300, 220], draw: waltzrondo },
  waltzminuet: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 200, 300, 220], draw: waltzminuet },
  velvet: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [120, 180, 320, 220], draw: velvet },
  marigold: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 180, 340, 240], draw: marigold },
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Leading Armour', w: 44, h: 112 },
  waltzminuet: { name: 'Dame Minuet, the Following Armour', w: 48, h: 108 },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: 50, h: 116 },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: 60, h: 128 },
};
