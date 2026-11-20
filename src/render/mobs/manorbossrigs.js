// The Moonlit Manor's bosses, remade from scratch for Chapter 4 (2026-11-18). Live puppets on the rig
// (rig.js), chibi, outer outline only, faces bare; everything that grows out of them is rooted in
// them (plumes and ribbons at their sockets, capes at the shoulders, keys at the belt).
//
//   waltzrondo   Dame Rondo, the Leading Armour: a plump suit of armour, haunted (a ghost's glowing
//                face in her helm's dark window, 2026-11-19), a sweeping plume, a short blue cape, a rapier.
//                Short legs in sabatons under her plated skirt. Salutes, bows, taps the time.
//   waltzminuet  Dame Minuet, the Following Armour: a short steel tutu over legs in pink sabatons
//                (redrawn 2026-11-19 from a floor-length gown), a heart-shaped window in her helm with a
//                ghost's glowing face, a tiara, a ribbon, a steel fan.
//                Flutters the fan, curtsies, pirouettes.
//   velvet       Madame Velvet, the Head Housekeeper: a plump ghost cat, a plum velvet bodice and short
//                peplum with an apron, her ghost body tapering into a wisp (redrawn 2026-11-19), mob
//                cap, half-moon spectacles, keys at her belt, a teapot always in hand.
//
// The Armours show their fight: taking hold (facing each other, hand to hand, swaying in three),
// the Grand Waltz wound up (en garde) and swept (turning as she goes, moonlight trailing her), a
// guard (the parry when her partner takes a hit), and dancing alone (huffing steam). Madame
// Velvet pours tea high when "Tea is served!", spins and flings plates along the floor, and
// rings a bell for the maids.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, inPart, TAU } from './rig.js';
import { D2R, INK, fr, ov, arcP, taper, pairOf, faceSprite, hold, window1, put, shift, MOODS, moodOf, dot, puff, sparkle, note } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
// A closed shape through these points, its corners rounded (corner cutting).
const blob = (pts, c, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return T(q, c);
};
const STEEL = ramp('#cbd8f2', { step: 8, turn: 8, lift: 4 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const GLOW = '#eef4ff';
// Moves a pose toward another by k (0..1); the springs then ease it.
const blendIn = (o, k, pose) => {
  if (k <= 0) return;
  for (const key of Object.keys(pose)) o[key] = (o[key] ?? 0) + (pose[key] - (o[key] ?? 0)) * k;
};
// A heart's outline.
const heartP = (cx, cy, s, n = 26) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    out.push([cx + (16 * Math.sin(t) ** 3 * s) / 16, cy - ((13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s) / 16]);
  }
  return out;
};
// A ghost's face of light in a dark helm window (the Armours, redrawn 2026-11-19 as the player's pick
// "A, Knight & Lady"): glowing eyes and mouth, about (cx, cy), s its size, for each mood.
const GHOST_GLOW = '#bfefff';
const ghostFaceShapes = (mood, cx, cy, s = 1) => {
  const g = GHOST_GLOW;
  const EN = [cx + 4.2 * s, cy - 0.6 * s];
  const EF = [cx - 3.8 * s, cy - 0.4 * s];
  const MX = cx + 0.4 * s;
  const MY = cy + 4.6 * s;
  const glowEye = ([x, y], k) => [F(E(x, y, 1.9 * s * k, 2.6 * s * k, g)), F(E(x - 0.5 * s, y - 0.9 * s, 0.7 * s, 0.8 * s, '#ffffff'))];
  const arc = ([x, y], up) => stroke(arcP(x, y, 2 * s, 1.3 * s, up ? 200 : 20, up ? 340 : 160, 7), 0.9 * s, g);
  const smile = (k = 1) => stroke(arcP(MX, MY, 2.2 * s * k, 1.2 * s * k, 20, 160, 7), 0.9 * s, g);
  if (mood === 'blink' || mood === 'sleep') return [...arc(EN, false), ...arc(EF, false), ...smile()];
  if (mood === 'happy') return [...arc(EN, true), ...arc(EF, true), F(T(arcP(MX, MY - 0.4 * s, 2.4 * s, 2.2 * s, 0, 180, 9), g))];
  if (mood === 'angry') return [F(T([[EN[0] - 2 * s, EN[1] - 1.2 * s], [EN[0] + 2 * s, EN[1] - 2.6 * s], [EN[0] + 1.8 * s, EN[1] + 2 * s], [EN[0] - 1.8 * s, EN[1] + 2 * s]], g)), F(T([[EF[0] - 1.6 * s, EF[1] - 2.2 * s], [EF[0] + 1.6 * s, EF[1] - 1 * s], [EF[0] + 1.5 * s, EF[1] + 1.8 * s], [EF[0] - 1.5 * s, EF[1] + 1.8 * s]], g)), ...stroke(arcP(MX, MY + 1.2 * s, 2 * s, 0.9 * s, 200, 340, 6), 0.9 * s, g)];
  if (mood === 'shout') return [...glowEye(EN, 0.9), ...glowEye(EF, 0.9), F(E(MX, MY + 0.6 * s, 1.8 * s, 2.2 * s, g))];
  if (mood === 'hurt') return [...stroke([[EN[0] - 1.8 * s, EN[1] - 1.6 * s], [EN[0] + 1.2 * s, EN[1]], [EN[0] - 1.8 * s, EN[1] + 1.6 * s]], 0.9 * s, g), ...stroke([[EF[0] + 1.6 * s, EF[1] - 1.4 * s], [EF[0] - 1 * s, EF[1]], [EF[0] + 1.6 * s, EF[1] + 1.4 * s]], 0.9 * s, g), ...stroke(arcP(MX, MY + 1.4 * s, 1.8 * s, 0.8 * s, 200, 340, 6), 0.9 * s, g)];
  if (mood === 'dead') return [...[EN, EF].flatMap(([x, y]) => [...stroke([[x - 1.5 * s, y - 1.5 * s], [x + 1.5 * s, y + 1.5 * s]], 0.9 * s, g), ...stroke([[x + 1.5 * s, y - 1.5 * s], [x - 1.5 * s, y + 1.5 * s]], 0.9 * s, g)]), ...stroke(arcP(MX, MY + 1.4 * s, 1.8 * s, 0.8 * s, 200, 340, 6), 0.9 * s, g)];
  if (mood === 'dizzy') return [...[EN, EF].flatMap(([x, y]) => stroke(Array.from({ length: 12 }, (_, i) => [x + Math.cos(i * 0.9) * (0.2 + i * 0.16) * s, y + Math.sin(i * 0.9) * (0.2 + i * 0.16) * s]), 0.7 * s, g)), ...stroke([[MX - 2 * s, MY], [MX - 0.7 * s, MY - 0.6 * s], [MX + 0.7 * s, MY], [MX + 2 * s, MY - 0.6 * s]], 0.8 * s, g)];
  return [...glowEye(EN, 1), ...glowEye(EF, 0.86), ...smile()];
};
const WINDOW = '#1e2440';
// A turn: the whole of her mirrored for half of each turn (wraps a rig's draw).
const spinWrap = (rig, spinning) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => draw(ctx, m, spinning(m, a) ? { ...a, flip: !a.flip, spun: true } : a);
  return rig;
};
// Moonlight trailing a sweep: ribbons curling off behind, twinkles on the floor.
function sweepTrail(ctx, a, side, c1, c2) {
  ctx.lineCap = 'round';
  for (let k = 0; k < 3; k++) {
    const u = fr(a.now * 3 + k / 3);
    ctx.globalAlpha = a.alpha * (0.55 - k * 0.14) * (0.6 + Math.sin(u * Math.PI) * 0.4);
    ctx.strokeStyle = k % 2 ? c2 : c1;
    ctx.lineWidth = 3.4 - k * 0.8;
    ctx.beginPath();
    const cx = side * (8 + k * 12);
    const a0 = side < 0 ? Math.PI * 0.55 : -Math.PI * 0.45;
    ctx.ellipse(cx, -36 + k * 8, 22 - k * 2, 30 - k * 6, 0, a0, a0 + Math.PI * 0.9);
    ctx.stroke();
  }
  for (let k = 0; k < 6; k++) {
    const u = fr(a.now * 1.8 + k / 6);
    sparkle(ctx, a, side * (14 + u * 60), -3 - u * 10 - (k % 3) * 4, 3 * (1 - u) + 0.6, (1 - u) * 0.9, k % 2 ? c1 : c2);
  }
}

// =====================================================================================
// Dame Rondo
// =====================================================================================
const SASH = ramp('#4a6ad8', { step: 9, turn: 8, lift: 10 });
const PLUME = ramp('#ff7a9a', { step: 9, turn: 8 });
const CAPE = ramp('#3e4cb0', { step: 9, turn: 8, lift: 12 });
const rd = pairOf('rd');
// A sabaton. Box 16 x 9; the ankle at (6, 2.4), the sole 6 below.
const rdBoot = (far) => () => {
  const c = far ? STEEL.sh : STEEL.base;
  return [T([[2, 1], [10, 1], [13, 4], [15.4, 7], [14.6, 8.4], [1, 8.4], [0.6, 4]], c), F(E(13.4, 6.6, 1.6, 1.2, GOLD.base)), F(R(2.4, 2.2, 7, 1, far ? STEEL.base : STEEL.hi))];
};
// A short stubby leg, a knee cop. Box 10 x 18; the hip at (5, 1), the ankle 16 below.
const rdLeg = (far) => () => {
  const c = far ? STEEL.sh : STEEL.base;
  return [taper([[5, 1], [5, 16.4]], 8, 7, c), E(5, 9.4, 4.4, 3.4, c), F(E(5, 9.4, 1.6, 1.2, GOLD.base))];
};
// The plated skirt (faulds) under the cuirass, a sash tail over it. Box 40 x 14; the waist at (20, 1).
const rdFaulds = () => [
  T([[7, 0.6], [33, 0.6], [36.4, 6.6], [3.6, 6.6]], STEEL.base),
  T([[3.6, 6], [36.4, 6], [39.4, 12.8], [0.6, 12.8]], STEEL.base),
  F(R(4, 6, 32, 0.9, STEEL.sh)),
  F(R(1.4, 11.6, 37.2, 1.1, GOLD.base)),
  F(T([[3.6, 6.6], [8, 6.6], [6, 12.6], [0.8, 12.6]], STEEL.sh)),
  T([[24, 0.8], [29, 0.8], [30.6, 13.4], [27.6, 11.8], [25, 13.4]], SASH.base),
];
// The cuirass: round and plump, a blue sash across it with a rose medal, a gold belt. Box 40 x 34;
// its bottom (the waist) at (20, 33).
const rdBody = () => [
  E(20, 17, 17, 16, STEEL.base),
  F(taper([[26.4, 5.4], [10.6, 28]], 6, 6, SASH.base)),
  F(taper([[26.4, 5.4], [10.6, 28]], 1, 1, SASH.hi)),
  F(E(18.6, 16.4, 2.8, 2.8, GOLD.base)), F(E(18.6, 16.4, 1.3, 1.3, PLUME.base)),
  F(R(9.6, 28.4, 20.8, 2.6, GOLD.sh)),
  ...stroke(arcP(20, 3.4, 7, 2.6, 0, 180, 8), 1, GOLD.base),
  crescent(20, 17, 17, 16, STEEL.sh, { k: 0.2, a0: 90, a1: 210 }),
  shine(20, 17, 17, 16, '#ffffff', 0, 0.7),
];
// A pauldron: two round lames. Box 18 x 14; on the shoulder at (9, 5).
const rdPaul = (far) => () => {
  const c = far ? STEEL.sh : STEEL.base;
  return [E(9, 9.4, 7, 3.4, c), E(9, 5.6, 8, 5, c), ...stroke(arcP(9, 6, 7, 4, 20, 160, 8), 0.8, GOLD.base)];
};
// An arm in a gauntlet. Box 18 x 10; the shoulder at (3, 5), the fist 11 along.
const rdArm = (far) => () => {
  const c = far ? STEEL.sh : STEEL.base;
  return [taper([[3, 5], [13, 5]], 6.4, 5.6, c), E(14, 5, 4, 3.8, c), F(R(10.6, 1.6, 1.3, 6.8, GOLD.base)), F(E(14.6, 3.8, 1.4, 1, far ? STEEL.base : STEEL.hi))];
};
// The rapier, a cup hilt. Box 12 x 57; gripped at (6, 47), the point 45 above.
const rdRapier = () => [
  taper([[6, 46], [6, 2]], 2.2, 0.6, '#eef4ff'),
  F(taper([[6, 44], [6, 6]], 0.6, 0.2, '#ffffff')),
  ...stroke(arcP(6, 45.4, 4.6, 3.6, 180, 360, 10), 1.2, GOLD.base, false),
  E(6, 46.6, 5, 1.4, GOLD.base),
  taper([[6, 47.4], [6, 53]], 2, 2, '#6a4a5a'),
  E(6, 54.2, 1.8, 1.8, GOLD.base),
];
// The great round helm, a window in front with the pale light of her face in it, a plume socket on
// top. Box 50 x 46; the neck at (25, 44).
const rdHelm = () => [
  T([[14, 36], [36, 36], [34, 45], [16, 45]], STEEL.sh),
  E(25, 22.4, 22, 20.6, STEEL.base),
  E(21, 2.8, 4.4, 2.6, GOLD.base),
  ov(34.6, 26, 10.4, 9.4, 0, WINDOW, 22),
  ...stroke(arcP(34.6, 26, 10.4, 9.4, 0, 360, 22), 1.2, GOLD.sh),
  F(E(12, 24, 1.6, 1.6, GOLD.base)), F(E(12.6, 30, 1.2, 1.2, GOLD.base)),
  ...stroke(arcP(25, 22.4, 18, 16, 200, 250, 6), 1, STEEL.hi),
  crescent(25, 22.4, 22, 20.6, STEEL.sh, { k: 0.18, a0: 110, a1: 230 }),
  shine(25, 22.4, 22, 20.6, '#ffffff', 0, 0.6),
];
// A plume feather, sweeping back from its socket. Box 38 x 18; rooted at (35, 14).
const rdPlume = (k) => () => [
  taper([[35, 14], [27, 7.6], [16, 5], [6, 7], [1.6, 11.4]], 5.4 - k * 0.6, 1.4, k === 1 ? '#ffffff' : PLUME.base),
  F(taper([[33, 12.6], [24, 7.4], [12, 6.6]], 0.8, 0.3, k === 1 ? '#ffe0ea' : PLUME.hi)),
];
// The cape, hung from the back of her shoulders, pink lining at its edge. Box 32 x 42; its top at (25, 2).
const rdCape = () => [
  T([[20, 0.8], [29, 0.8], [29.4, 12], [27, 40], [16, 38.4], [8, 40.6], [1.4, 36], [10, 14]], CAPE.base),
  F(T([[26, 4], [28.6, 4], [28.4, 14], [26.6, 37], [24.4, 37]], '#ff8fb0')),
  ...stroke([[27, 40], [16, 38.4], [8, 40.6], [1.4, 36]], 1.2, GOLD.base),
  F(taper([[12, 18], [6, 34]], 1, 1.4, CAPE.sh)),
  F(taper([[20, 14], [17, 35]], 1, 1.4, CAPE.sh)),
];
const RD_BOOT = [false, true].map((f) => rd(`boot${f ? 1 : 0}`, 16, 9, rdBoot(f)));
const RD_LEG = [false, true].map((f) => rd(`leg${f ? 1 : 0}`, 10, 18, rdLeg(f)));
const RD_FAULDS = rd('faulds', 40, 14, rdFaulds);
const RD_BODY = rd('body', 40, 34, rdBody);
const RD_PAUL = [false, true].map((f) => rd(`paul${f ? 1 : 0}`, 18, 14, rdPaul(f)));
const RD_ARM = [false, true].map((f) => rd(`arm${f ? 1 : 0}`, 18, 10, rdArm(f)));
const RD_RAPIER = rd('rapier', 12, 57, rdRapier);
const RD_HELM = rd('helm', 50, 46, rdHelm);
const RD_PLUME = [0, 1, 2].map((k) => rd(`plume${k}`, 38, 18, rdPlume(k)));
const RD_CAPE = rd('cape', 32, 42, rdCape);
const RD_FACE = { eyes: [[30.4, 25, 2.4, 3.2, -1], [38.6, 24.6, 2, 2.8, 1]], mouth: [35, 31, 2.6], blush: [[27.6, 29.2, 2], [41.6, 28.6, 1.4]], iris: '#4a6ad8', k: 2, lid: 0 };
const rdFace = (mood) => sm(`rd|gface|${mood}`, 50, 46, () => ghostFaceShapes(mood, 34.6, 26, 1.05));
const rdPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (near) => ({ name: `leg${near ? 'N' : 'F'}${tag}`, parent: 'waist', s: RD_LEG[near ? 0 : 1][i], pivot: [5, 1], at: () => [near ? 4 : -4, 8], rot: (S) => (near ? S.legN : S.legF) * D2R });
  const boot = (near) => ({
    name: `boot${near ? 'N' : 'F'}${tag}`, parent: `leg${near ? 'N' : 'F'}${tag}`, s: RD_BOOT[near ? 0 : 1][i], pivot: [6, 2.4], at: () => [0, 16],
    rot: (S) => (-(near ? S.legN : S.legF) - S.lean + (near ? S.toe : 0)) * D2R,
  });
  return [
    { name: `cape${tag}`, parent: 'waist', s: RD_CAPE[i], pivot: [25, 2], at: () => [-7, -27], rot: (S) => clamp(S.cape, -6, 60) * D2R },
    ...[2, 1, 0].map((k) => ({ name: `plume${k}${tag}`, parent: 'neck', s: RD_PLUME[k][i], pivot: [35, 14], at: () => [-4, -41.4], rot: (S, a) => (-16 + k * 16 + clamp(S.plume, -30, 40) * (0.6 + k * 0.25) + Math.sin(a.t * 2.4 - k) * 3) * D2R })),
    leg(false),
    boot(false),
    { name: `armF${tag}`, parent: 'waist', s: RD_ARM[1][i], pivot: [3, 5], at: () => [-5, -23], rot: (S) => (60 + S.armF) * D2R },
    { name: `paulF${tag}`, parent: 'waist', s: RD_PAUL[1][i], pivot: [9, 5], at: () => [-6, -25], rot: (S) => S.armF * 0.15 * D2R },
    leg(true),
    boot(true),
    { name: `faulds${tag}`, parent: 'waist', s: RD_FAULDS[i], pivot: [20, 1], at: () => [0, -1] },
    { name: `body${tag}`, parent: 'waist', s: RD_BODY[i], pivot: [20, 33] },
    { name: `helm${tag}`, parent: 'neck', s: RD_HELM[i], pivot: [25, 44] },
    { name: `rapier${tag}`, parent: 'hand', s: RD_RAPIER[i], pivot: [6, 47], rot: (S) => (S.rapier - (60 + S.armN) - S.lean) * D2R },
    { name: `armN${tag}`, parent: 'waist', s: RD_ARM[0][i], pivot: [3, 5], at: () => [6, -22], rot: (S) => (60 + S.armN) * D2R },
    { name: `paulN${tag}`, parent: 'waist', s: RD_PAUL[0][i], pivot: [9, 5], at: () => [6, -24], rot: (S) => S.armN * 0.15 * D2R },
  ];
};
// The fight's states, shared by both Armours.
const armourStates = (m, a) => ({
  holdK: m.holdUntil > a.now ? 1 : 0,
  aimK: m.aim ? 1 : 0,
  chargeK: m.charging ? 1 : 0,
  guardK: window1(a.now, m.guardAt, 0.7, 0.06, 0.4),
  aloneK: m.mech?.alone ? 1 : 0,
});
// The Armours' extras: notes while they hold each other, moonlight trailing the sweep, steam when
// one dances alone.
function armourFx(ctx, m, a, S, mat, o) {
  if (m.hp <= 0) return;
  if (a.amHold > 0) for (let k = 0; k < 2; k++) {
    const u = fr(a.t * 0.55 + k / 2);
    note(ctx, a, 10 + Math.sin(u * 5 + k) * 7, o.top - 6 - u * 22, Math.sin(u * Math.PI) * 0.9 * a.amHold, k ? '#ffe36b' : '#ffffff', 9);
  }
  if (a.amCharge > 0) sweepTrail(ctx, a, -(m.charging?.dir ?? 1) * (a.flip ? -1 : 1), o.c1, o.c2);
  if (a.amAlone > 0) for (let k = 0; k < 3; k++) {
    const u = fr(a.t * 0.9 + k / 3);
    puff(ctx, a, -6 + k * 7 + u * 4, o.top + 4 - u * 16, 3 + u * 5, Math.sin(u * Math.PI) * 0.5);
  }
}
export const rondoRig = spinWrap(makeRig({
  w: 112,
  h: 126,
  soft: true,
  stride: 34,
  recover: 0.8,
  springs: {
    x: [180, 18], lift: [160, 14], lean: [120, 12], head: [120, 10], legN: [160, 13], legF: [160, 13], toe: [260, 16], armN: [140, 12], armF: [120, 11], rapier: [130, 11],
    cape: [50, 5], plume: [60, 5],
  },
  fast: ['x', 'lean', 'armN', 'rapier', 'legN', 'legF'],
  kick: { lean: -120, head: -200, plume: 400, cape: 200 },
  turnKick: { plume: 220, cape: 180 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const br = Math.sin(t * 1.6);
    const lu = t % 12;
    const still = 1 - a.walkW;
    // (Between the dances: a salute with the rapier, a bow, a foot tapping the time.)
    const salute = hold(lu, 1.4, 2, 3.2, 3.8) * still;
    const bow = hold(lu, 5.4, 6, 7, 7.6) * still;
    const tap = hold(lu, 9, 9.3, 10.8, 11.2) * still;
    const idle = {
      x: 0, lift: br * 0.5 - bow * 1.5, lean: bow * 16, head: bow * 10 + tap * Math.sin(t * TAU) * 3,
      legN: -4 + bow * 6, legF: 6 - bow * 4, toe: -tap * 14 * Math.max(0, Math.sin(fr(t * 2) * TAU)),
      armN: 10 - salute * 120 - bow * 10, armF: 20 + bow * 40, rapier: 158 - salute * 158 - bow * 40,
    };
    // The walk: a gliding waltz step.
    const p = a.wp;
    const walk = { x: 0, lift: Math.abs(Math.cos(p)) * 1.4, lean: 5, head: Math.sin(p) * 2, legN: Math.sin(p) * 18, legF: -Math.sin(p) * 18, toe: 0, armN: 20 + Math.sin(p) * 6, armF: 20 - Math.sin(p) * 10, rapier: 150 };
    // The lunge: drawn back, then thrust out on a long step.
    const antic = { x: -3, lift: -2, lean: -10, head: -4, legN: 12, legF: -8, toe: 0, armN: 70, armF: -10, rapier: 130 };
    const strike = { x: 8, lift: -3, lean: 16, head: 4, legN: 34, legF: -26, toe: 0, armN: -64, armF: 50, rapier: 90 };
    const out = stateBlend(a, idle, walk, antic, strike);
    const s = armourStates(m, a);
    const sway = Math.sin(t * Math.PI * 1.4);
    // Taking hold: hand held out to her partner, rapier raised, swaying in three.
    blendIn(out, s.holdK, { lift: 1 + Math.abs(sway) * 1.2, lean: sway * 4, head: -sway * 4, legN: sway * 12, legF: -sway * 12, armN: -100, armF: -62, rapier: -16, toe: 0 });
    // En garde before the Grand Waltz; then the sweep, leaning into it, point first.
    blendIn(out, s.aimK, { x: -2, lift: -3, lean: -9, head: -3, legN: 22, legF: -16, armN: 50, armF: 30, rapier: 96 });
    blendIn(out, s.chargeK, { x: 0, lift: 1.5, lean: 12, head: 2, legN: 22, legF: -22, armN: -56, armF: 40, rapier: 90 });
    // The parry when her partner shields her.
    blendIn(out, s.guardK, { lean: -6, armN: -80, rapier: 14, head: -4 });
    if (m.hp <= 0) blendIn(out, 1, { lean: 8, head: 18, armN: 40, armF: 50, rapier: 176, lift: -2 });
    a.amHold = s.holdK;
    a.amAim = s.aimK;
    a.amCharge = s.chargeK;
    a.amGuard = s.guardK;
    a.amAlone = s.aloneK;
    a.amMood = s.holdK || bow > 0.4 ? 'happy' : s.aimK || s.chargeK || s.aloneK ? 'angry' : null;
    return out;
  },
  follow: (S, a) => ({ cape: 12 - S.lean * 0.8 + a.walkW * 10 + (a.amCharge ?? 0) * 34, plume: -S.lean * 0.8 + (a.amCharge ?? 0) * 26 + (a.amAim ?? 0) * 14 }),
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -30 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'waist', at: () => [1, -30], rot: (S) => S.head * D2R },
    { name: 'hand', parent: 'armN', at: () => [11, 0] },
    ...rdPass(false),
    ...rdPass(true),
    { name: 'face', parent: 'neck', s: (a) => rdFace(moodOf(a, a.amMood)), pivot: [25, 44] },
  ],
  fx(ctx, m, a, S, mat) {
    armourFx(ctx, m, a, S, mat, { top: -112, c1: '#eef4ff', c2: '#a8c0ff' });
    if (m.hp <= 0) return;
    // A glint along the blade en garde, and sparks off it in a parry.
    if (a.amAim > 0 || a.amGuard > 0) inPart(ctx, mat, 'rapier', () => {
      sparkle(ctx, a, 0, -45, 4 + Math.sin(a.now * 12) * 1.4, a.amAim * 0.95);
      for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 3 + k / 4);
        sparkle(ctx, a, Math.cos(k * 1.7) * u * 10, -24 + Math.sin(k * 2.3) * u * 10, 3 * (1 - u) + 0.5, a.amGuard * (1 - u), k % 2 ? '#ffe36b' : '#ffffff');
      }
    });
  },
}), (m, a) => Boolean(m.charging) && m.hp > 0 && fr(a.now * 2.6) > 0.5);
export function rondoStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const wy = -30;
  const [nx, ny] = [1, wy - 30];
  const hand = [6 + Math.cos(70 * D2R) * 11, wy - 22 + Math.sin(70 * D2R) * 11];
  return {
    w: 100,
    h: 124,
    res: 2,
    shapes: shift([
      ...put(rdCape(), [25, 2], -7, wy - 27, 12),
      ...[2, 1, 0].flatMap((k) => put(rdPlume(k)(), [35, 14], nx - 4, ny - 41.4, -16 + k * 16)),
      ...put(rdLeg(true)(), [5, 1], -4, wy + 8), ...put(rdBoot(true)(), [6, 2.4], -4, wy + 24),
      ...put(rdArm(true)(), [3, 5], -5, wy - 23, 80), ...put(rdPaul(true)(), [9, 5], -6, wy - 25),
      ...put(rdLeg(false)(), [5, 1], 4, wy + 8), ...put(rdBoot(false)(), [6, 2.4], 4, wy + 24),
      ...put(rdFaulds(), [20, 1], 0, wy - 1), ...put(rdBody(), [20, 33], 0, wy),
      ...put(rdHelm(), [25, 44], nx, ny), ...put(ghostFaceShapes(fm, 34.6, 26, 1.05), [25, 44], nx, ny),
      ...put(rdRapier(), [6, 47], hand[0], hand[1], 158), ...put(rdArm(false)(), [3, 5], 6, wy - 22, 70), ...put(rdPaul(false)(), [9, 5], 6, wy - 24),
    ], 50, 122),
  };
}

// =====================================================================================
// Dame Minuet
// =====================================================================================
const LILAC = ramp('#dcd6f8', { step: 8, turn: 8, lift: 4 });
const ROSE = ramp('#ff9fc0', { step: 9, turn: 8 });
const mn = pairOf('mn');
// (Redrawn 2026-11-19: her floor-length gown of steel tiers became a short tutu over two legs.)
const MN_TW = [[26, 42], [38, 50], [50, 64]];
// Her short steel tutu: lames down it, a rose-trimmed hem (the old gown's top tier, short).
// Box 66 x 18; hung at its top (33, 1).
const mnTier = (k) => () => {
  const [w0, w1] = MN_TW[k];
  const cx = 33;
  const h = 16;
  const dip = 2.6 + k * 0.4;
  const hemAt = (f) => [cx - w1 / 2 + w1 * f, h - dip + Math.sin(f * Math.PI) * dip];
  const hem = [];
  for (let i = 0; i <= 12; i++) hem.push(hemAt(i / 12));
  const out = [T([[cx - w0 / 2, 0.6], [cx + w0 / 2, 0.6], ...hem.slice().reverse()], LILAC.base)];
  out.push(F(T([[cx - w0 / 2, 0.6], [cx - w0 / 2 + 4, 0.6], hemAt(0.09), hemAt(0)], LILAC.sh)));
  for (let i = 1; i < 6; i++) {
    const f = i / 6;
    const [hx, hy] = hemAt(f);
    out.push(F(taper([[cx - w0 / 2 + w0 * f, 1.4], [hx, hy - 1.4]], 0.7, 0.9, LILAC.sh)));
  }
  out.push(...stroke(hem.map(([x, y]) => [x, y - 1.3]).slice(1, -1), 1.3, k === 2 ? GOLD.base : ROSE.base));
  return out;
};
// The bodice: a steel corset, a pink lacing panel, a rose brooch. Box 30 x 26; the waist at (15, 25).
const mnBodice = () => [
  E(15, 10, 11.6, 9.4, LILAC.base),
  T([[5, 12], [25, 12], [20, 25.4], [10, 25.4]], LILAC.base),
  ...stroke(arcP(15, 2.6, 7, 2.6, 0, 180, 8), 1, GOLD.base),
  F(T([[13.4, 13], [16.6, 13], [16, 25], [14, 25]], ROSE.base)),
  F(E(16, 9, 2.8, 2.8, ROSE.base)), F(E(16, 9, 1.2, 1.2, GOLD.base)),
  crescent(15, 10, 11.6, 9.4, LILAC.sh, { k: 0.2, a0: 100, a1: 210 }),
  shine(15, 10, 11.6, 9.4, '#ffffff', 0, 0.6),
];
// Her helm: a heart-shaped window with her face's pale light in it, a tiara, a bow at the back. Box
// 44 x 42; the neck at (22, 40).
const MN_HEART = heartP(28, 22.6, 9.4);
const mnHelm = () => [
  T([[13, 33], [31, 33], [29, 41], [15, 41]], LILAC.sh),
  E(22, 21, 19, 18, LILAC.base),
  T([[13, 7], [15, 1.4], [18.4, 4.6], [22, 0.6], [25.6, 4.6], [29, 1.4], [31, 7]], GOLD.base),
  F(E(22, 4, 1.6, 1.6, ROSE.base)), F(E(15.4, 4.4, 0.9, 0.9, ROSE.hi)), F(E(28.6, 4.4, 0.9, 0.9, ROSE.hi)),
  T([[7, 20.4], [1.6, 15.6], [0.8, 21], [2, 25.4]], ROSE.base), E(6.6, 20.4, 2.2, 2.2, ROSE.sh),
  T(MN_HEART, WINDOW),
  ...stroke([...MN_HEART, MN_HEART[0]], 1.1, GOLD.sh),
  crescent(22, 21, 19, 18, LILAC.sh, { k: 0.18, a0: 110, a1: 230 }),
  shine(22, 21, 19, 18, '#ffffff', 0, 0.6),
];
// The ribbon from the bow at the back of her helm. Box 14 x 44; tied at (7, 2).
const mnRibbon = () => [taper([[7, 2], [5, 14], [8, 27], [6, 37]], 4.4, 5, ROSE.base), T([[3, 36], [9, 36], [10.4, 42.6], [6, 40], [2, 42.6]], ROSE.base), F(taper([[6.4, 4], [4.6, 14], [7.4, 26]], 0.8, 0.6, ROSE.hi))];
// An arm: a puffed steel sleeve, a slim gauntlet. Box 18 x 10; the shoulder at (3, 5), the hand 11 along.
const mnArm = (far) => () => {
  const c = far ? LILAC.sh : LILAC.base;
  return [taper([[6, 5], [13, 5]], 4.4, 4, c), E(14, 5, 3.2, 3, c), F(R(10.6, 2.4, 1.2, 5.2, GOLD.base)), E(4.4, 5, 4.4, 4.2, far ? ROSE.sh : ROSE.base), F(E(3.4, 3.4, 1.6, 1, ROSE.hi))];
};
// The steel fan, open, half open and shut. Gripped at its rivet.
const mnFan = (spread) => () => {
  const a0 = 270 - spread / 2;
  const rim = arcP(16, 18, 15, 15.6, a0, a0 + spread, 14);
  const out = [T([[16, 18], ...rim], LILAC.base)];
  const n = Math.max(2, Math.round(spread / 24));
  for (let i = 0; i <= n; i++) {
    const ang = (a0 + 4 + ((spread - 8) * i) / n) * D2R;
    out.push(F(taper([[16, 17], [16 + Math.cos(ang) * 13.6, 18 + Math.sin(ang) * 14]], 0.7, 0.5, LILAC.sh)));
  }
  out.push(...stroke(rim, 1.4, ROSE.base));
  out.push(E(16, 18, 1.8, 1.8, GOLD.base));
  return out;
};
const mnFanShut = () => [taper([[4, 20], [4, 3]], 3.6, 2.2, LILAC.base), F(taper([[4, 18], [4, 5]], 0.6, 0.4, ROSE.base)), E(4, 20, 1.8, 1.8, GOLD.base)];
// A slim leg in steel, a knee cop with a rose rivet. Box 10 x 18; the hip at (5, 1), the ankle 16 below.
const mnLeg = (far) => () => {
  const c = far ? LILAC.sh : LILAC.base;
  return [taper([[5, 1], [5, 16.4]], 7, 6, c), E(5, 9.4, 4, 3.2, c), F(E(5, 9.4, 1.4, 1.1, ROSE.base)), F(taper([[3.2, 3], [3.2, 7]], 0.7, 0.5, far ? LILAC.base : '#ffffff'))];
};
// A pink sabaton with a little bow. Box 16 x 9; the ankle at (6, 2.4), the sole 6 below.
const mnBoot = (far) => () => {
  const c = far ? ROSE.sh : ROSE.base;
  return [T([[2, 1], [10, 1], [13, 4], [15.4, 7], [14.6, 8.4], [1, 8.4], [0.6, 4]], c), F(E(7, 2.2, 1.8, 1.2, '#ffffff')), F(R(2.4, 2.2, 6, 1, far ? ROSE.base : ROSE.hi))];
};
const MN_TIER = [0].map((k) => mn(`tutu${k}`, 66, 18, mnTier(k)));
const MN_LEG = [false, true].map((f) => mn(`leg${f ? 1 : 0}`, 10, 18, mnLeg(f)));
const MN_BOOT = [false, true].map((f) => mn(`boot${f ? 1 : 0}`, 16, 9, mnBoot(f)));
const MN_BOD = mn('bodice', 30, 26, mnBodice);
const MN_HELM = mn('helm', 44, 42, mnHelm);
const MN_RIBBON = mn('ribbon', 14, 44, mnRibbon);
const MN_ARM = [false, true].map((f) => mn(`arm${f ? 1 : 0}`, 18, 10, mnArm(f)));
const MN_FANS = [mn('fanshut', 8, 22, mnFanShut), mn('fanhalf', 32, 20, mnFan(70)), mn('fanopen', 32, 20, mnFan(150))];
const MN_FAN_PIV = [[4, 20], [16, 18], [16, 18]];
const mnFanOf = (a) => (a.mnOpen < 0.3 ? 0 : a.mnOpen < 0.7 ? 1 : 2);
const MN_FACE = { eyes: [[24.6, 23, 2.2, 3, -1], [31.6, 22.6, 1.9, 2.7, 1]], mouth: [28.4, 28.2, 2.4], blush: [[22, 26.2, 1.8], [34, 25.8, 1.4]], iris: '#c860a0', k: 1.8, lid: 0, lashes: 1 };
const mnFace = (mood) => sm(`mn|gface|${mood}`, 44, 42, () => ghostFaceShapes(mood, 28, 22.6, 0.92));
const mnPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `ribbon${tag}`, parent: 'neck', s: MN_RIBBON[i], pivot: [7, 2], at: () => [-16, -20], rot: (S) => clamp(S.ribbon, -10, 75) * D2R },
    { name: `armF${tag}`, parent: 'waist', s: MN_ARM[1][i], pivot: [3, 5], at: () => [-6, -18], rot: (S) => (60 + S.armF) * D2R },
    ...[false, true].flatMap((near) => [
      { name: `leg${near ? 'N' : 'F'}${tag}`, parent: 'waist', s: MN_LEG[near ? 0 : 1][i], pivot: [5, 1], at: () => [near ? 4 : -4, 8], rot: (S) => (near ? S.legN : S.legF) * D2R },
      { name: `boot${near ? 'N' : 'F'}${tag}`, parent: `leg${near ? 'N' : 'F'}${tag}`, s: MN_BOOT[near ? 0 : 1][i], pivot: [6, 2.4], at: () => [0, 16], rot: (S) => (-(near ? S.legN : S.legF) - S.lean) * D2R },
    ]),
    { name: `tutu${tag}`, parent: 'sk0', s: MN_TIER[0][i], pivot: [33, 1] },
    { name: `bodice${tag}`, parent: 'waist', s: MN_BOD[i], pivot: [15, 25] },
    { name: `helm${tag}`, parent: 'neck', s: MN_HELM[i], pivot: [22, 40] },
    { name: `fan${tag}`, parent: 'hand', s: (a) => MN_FANS[mnFanOf(a)][i](), pivot: (a) => MN_FAN_PIV[mnFanOf(a)], rot: (S) => (S.fan - (60 + S.armN) - S.lean) * D2R },
    { name: `armN${tag}`, parent: 'waist', s: MN_ARM[0][i], pivot: [3, 5], at: () => [7, -17], rot: (S) => (60 + S.armN) * D2R },
  ];
};
// (Her little pirouette between dances.)
const mnPirouette = (m, a) => {
  const lu = (a.t + (m.uid % 7) * 1.7) % 13;
  return !a.moving && lu > 9.6 && lu < 10.6;
};
export const minuetRig = spinWrap(makeRig({
  w: 112,
  h: 120,
  soft: true,
  stride: 34,
  recover: 0.8,
  springs: { x: [180, 18], lift: [140, 13], lean: [120, 12], head: [120, 10], sk: [120, 9], armN: [140, 12], armF: [120, 11], fan: [140, 11], open: [320, 26], ribbon: [50, 5], legN: [160, 13], legF: [160, 13] },
  fast: ['x', 'lean', 'armN', 'fan', 'open', 'legN', 'legF'],
  kick: { lean: -120, head: -200, sk: 300, ribbon: 300 },
  turnKick: { sk: 200, ribbon: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.7;
    const t = a.t + a.uidOff;
    const br = Math.sin(t * 1.5);
    const lu = t % 13;
    const still = 1 - a.walkW;
    // (Between the dances: a flutter of the fan, a curtsy, a pirouette.)
    const flutter = hold(lu, 1, 1.4, 3.4, 3.8) * still;
    const curtsy = hold(lu, 5.4, 6, 7, 7.6) * still;
    const pir = hold(lu, 9.4, 9.6, 10.6, 10.8) * still;
    const idle = {
      x: 0, lift: br * 0.4 - curtsy * 1.4, lean: curtsy * 4 + pir * 3, head: curtsy * 12 + flutter * Math.sin(t * 2) * 4, sk: curtsy * 1.6 - pir * 3,
      armN: 30 - flutter * 130 + curtsy * 10 - pir * 60, armF: 30 + curtsy * 30 - pir * 80, fan: 30 - flutter * 30 + flutter * Math.sin(t * 16) * 12, open: Math.max(flutter, pir),
      // (A curtsy: the near foot slides back behind the other; a pirouette up on her toes.)
      legN: -4 - curtsy * 16 + pir * 4, legF: 6 + curtsy * 4,
    };
    const p = a.wp;
    const walk = { x: 0, lift: Math.abs(Math.cos(p)) * 1.4, lean: 5, head: Math.sin(p) * 2, sk: -4 + Math.sin(p) * 2, armN: 30 + Math.sin(p) * 8, armF: 20 - Math.sin(p) * 8, fan: 40, open: 0, legN: Math.sin(p) * 18, legF: -Math.sin(p) * 18 };
    // The fan stroke: snapped shut and raised, then swept open across.
    const antic = { x: -2, lift: 0, lean: -8, head: -4, sk: 4, armN: 100, armF: 10, fan: -60, open: 0, legN: 10, legF: -6 };
    const strike = { x: 6, lift: 0.6, lean: 12, head: 4, sk: -6, armN: -40, armF: 40, fan: 100, open: 1, legN: 26, legF: -20 };
    const out = stateBlend(a, idle, walk, antic, strike);
    const s = armourStates(m, a);
    const sway = Math.sin(t * Math.PI * 1.4);
    blendIn(out, s.holdK, { lift: 1 + Math.abs(sway), lean: sway * 4, head: sway * 4, sk: -sway * 3, armN: -100, armF: -60, fan: -10, open: 1, legN: -sway * 12, legF: sway * 12 });
    blendIn(out, s.aimK, { lift: -2, lean: -10, head: -4, sk: 5, armN: -50, armF: 50, fan: 80, open: 1, legN: 20, legF: -14 });
    blendIn(out, s.chargeK, { lift: 1.4, lean: 6, head: 2, sk: -4, armN: -50, armF: -30, fan: 90, open: 1, legN: 22, legF: -22 });
    blendIn(out, s.guardK, { lean: -6, armN: -60, fan: 40, open: 1 });
    if (m.hp <= 0) blendIn(out, 1, { lean: 6, head: 16, armN: 50, armF: 50, fan: 170, open: 0, lift: -1 });
    a.amHold = s.holdK;
    a.amAim = s.aimK;
    a.amCharge = s.chargeK;
    a.amGuard = s.guardK;
    a.amAlone = s.aloneK;
    a.amMood = s.holdK || curtsy > 0.4 || flutter > 0.5 ? 'happy' : s.aimK || s.chargeK || s.aloneK ? 'angry' : null;
    return out;
  },
  follow: (S, a) => ({ ribbon: 14 - S.lean * 1 + a.walkW * 16 + (a.amCharge ?? 0) * 40 }),
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -30 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'waist', at: () => [1, -23], rot: (S) => S.head * D2R },
    { name: 'hand', parent: 'armN', at: () => [11, 0] },
    // (The tutu, bobbing a beat behind her.)
    { name: 'sk0', parent: 'waist', at: () => [0, -1], rot: (S, a) => (S.sk * 0.6 + Math.sin(a.t * 2.2) * 1) * D2R },
    ...mnPass(false),
    ...mnPass(true),
    { name: 'face', parent: 'neck', s: (a) => mnFace(moodOf(a, a.amMood)), pivot: [22, 40] },
  ],
  fx(ctx, m, a, S, mat) {
    a.mnOpen = S.open;
    armourFx(ctx, m, a, S, mat, { top: -110, c1: '#ffe0f0', c2: '#ff9fc0' });
    if (m.hp <= 0) return;
    if (a.amGuard > 0 || a.amAim > 0) inPart(ctx, mat, 'fan', () => {
      for (let k = 0; k < 5; k++) {
        const u = fr(a.now * 2.6 + k / 5);
        sparkle(ctx, a, Math.cos(k * 1.3 + 3.6) * (8 + u * 8), -8 + Math.sin(k * 1.3 + 3.6) * (8 + u * 8), 2.6 * (1 - u) + 0.5, Math.max(a.amGuard, a.amAim * 0.6) * (1 - u), k % 2 ? '#ffe36b' : '#ffffff');
      }
    });
  },
}), (m, a) => m.hp > 0 && ((Boolean(m.charging) && fr(a.now * 2.6) > 0.5) || (mnPirouette(m, a) && fr((a.t + (m.uid % 7) * 1.7) * 2) > 0.5)));
// (The fan's sprite is picked from how open it is, which the springs know only after the pose; it is
// read from last frame's, so it is sprung too.)
const mnDraw = minuetRig.draw;
minuetRig.draw = (ctx, m, a) => {
  a.mnOpen = a.mo.rig?.open?.x ?? 0;
  mnDraw(ctx, m, a);
};
export function minuetStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const wy = -31;
  const [nx, ny] = [1, wy - 23];
  const hand = [7 + Math.cos(90 * D2R) * 11, wy - 17 + Math.sin(90 * D2R) * 11];
  return {
    w: 100,
    h: 120,
    res: 2,
    shapes: shift([
      ...put(mnRibbon(), [7, 2], nx - 16, ny - 20, 14), ...put(mnArm(true)(), [3, 5], -6, wy - 18, 90),
      ...put(mnLeg(true)(), [5, 1], -4, wy + 8, 6), ...put(mnBoot(true)(), [6, 2.4], -4 - 1.7, wy + 24),
      ...put(mnLeg(false)(), [5, 1], 4, wy + 8, -4), ...put(mnBoot(false)(), [6, 2.4], 4 + 1.1, wy + 24),
      ...put(mnTier(0)(), [33, 1], 0, wy - 1),
      ...put(mnBodice(), [15, 25], 0, wy), ...put(mnHelm(), [22, 40], nx, ny), ...put(ghostFaceShapes(fm, 28, 22.6, 0.92), [22, 40], nx, ny),
      ...put(mnFanShut(), [4, 20], hand[0], hand[1], 30), ...put(mnArm(false)(), [3, 5], 7, wy - 17, 90),
    ], 50, 118),
  };
}

// =====================================================================================
// Madame Velvet
// =====================================================================================
const PLUM = ramp('#8a4a9a', { step: 9, turn: 8, lift: 12 });
const GHOSTV = ramp('#f0eaff', { step: 8, turn: 8, lift: 3 });
const vv = pairOf('vv');
// Below the waist (redrawn 2026-11-19, the player's pick "A, Ghost Cat Housekeeper": her long dress
// became this): a short velvet peplum with a lace edge and a short apron over her ghost body, which
// tapers away into the wisp her tail curls from. Box 62 x 40; the waist at (31, 1).
const vvDress = () => {
  const out = [blob([[13, 0.6], [49, 0.6], [47, 13], [40, 26], [33, 35], [28, 35], [22, 24], [16, 12]], GHOSTV.base, 2)];
  out.push(crescent(31, 16, 17, 19, GHOSTV.sh, { k: 0.16, a0: 100, a1: 220 }), F(taper([[38, 6], [36, 24]], 1.6, 1, '#ffffff')));
  out.push(T([[15, 0.6], [47, 0.6], [51, 9], [11, 9]], PLUM.base), F(T([[15, 0.6], [19, 0.6], [15, 9], [11, 9]], PLUM.sh)));
  for (let i = 0; i < 11; i++) out.push(E(12 + i * 3.8, 9.6 + (i % 2) * 0.6, 2.2, 1.8, '#fff2f8'));
  out.push(T([[27, 2], [41, 2], [43, 15], [25, 15]], '#ffffff'), F(R(30, 6, 8, 4, '#f2ecf8')), F(R(30, 6, 8, 0.8, '#d8d0e8')));
  for (let i = 0; i < 5; i++) out.push(E(26 + i * 4, 15.4, 1.8, 1.4, '#ffffff'));
  return out;
};
// The bodice: plump, a white apron bib, gold buttons, a white collar. Box 44 x 28; the waist at (22, 27).
const vvTorso = () => [
  E(22, 15, 18, 12.4, PLUM.base),
  F(T([[22, 4], [34, 7], [38, 18], [30, 27], [24, 27]], '#ffffff')),
  ...[0, 1, 2].map((k) => F(E(27, 10 + k * 5, 1, 1, GOLD.base))),
  T([[10, 4], [22, 0.8], [34, 4], [30, 7.4], [22, 5.4], [14, 7.4]], '#ffffff'),
  crescent(22, 15, 18, 12.4, PLUM.sh, { k: 0.2, a0: 100, a1: 220 }),
];
// Her big round ghost-cat head, fluffy cheeks, whiskers. Box 54 x 46; the neck at (27, 44).
const vvHead = () => [
  E(27, 23, 23.4, 20.6, GHOSTV.base),
  E(10, 33, 6, 4.6, GHOSTV.base), E(45, 32, 6, 4.6, GHOSTV.base),
  ...stroke([[44, 30], [51, 28.6]], 0.6, '#c8b8d8'), ...stroke([[44, 32.4], [51, 33]], 0.6, '#c8b8d8'),
  crescent(27, 23, 23.4, 20.6, GHOSTV.sh, { k: 0.2, a0: 100, a1: 220 }),
  shine(27, 22, 23.4, 20.6, '#ffffff', 0, 0.7),
];
const vvEar = (far) => () => [T([[1, 13], [4, 1], [13, 13]], far ? GHOSTV.sh : GHOSTV.base), F(T([[3.6, 11.6], [5, 4.4], [10, 11.6]], '#ffc8d8'))];
// The mob cap: a white frilled cap, a plum ribbon round it. Box 46 x 18; sits at (23, 15).
const vvCap = () => {
  const out = [E(23, 9, 17, 7.6, '#ffffff')];
  for (let i = 0; i < 9; i++) out.push(E(5 + i * 4.5, 14 + (i % 2) * 0.6, 2.6, 2.2, '#ffffff'));
  out.push(F(R(8, 10.4, 30, 2, PLUM.base)), F(T([[33, 11.4], [39, 8], [39.6, 14.6]], PLUM.hi)), F(E(33, 11.4, 1.4, 1.4, PLUM.sh)));
  return out;
};
// Half-moon spectacles (drawn bare over her face). Same box as the head.
const vvSpecs = () => [
  ...stroke(arcP(31, 24.6, 4.4, 4, 0, 180, 10), 1, GOLD.base), ...stroke([[26.6, 24.6], [35.4, 24.6]], 0.9, GOLD.base),
  ...stroke(arcP(41.4, 24, 3.8, 3.6, 0, 180, 10), 1, GOLD.base), ...stroke([[37.6, 24], [45.2, 24]], 0.9, GOLD.base),
  ...stroke([[35.4, 24.6], [37.6, 24]], 0.8, GOLD.base),
  F(E(30, 26.6, 1.6, 0.8, '#ffffff')),
];
// A plump arm in a velvet sleeve, a white cuff, a ghostly paw. Box 24 x 14; the shoulder at (4, 7),
// the paw 14.6 along.
const vvArm = (far) => () => [taper([[4, 7], [15, 7]], 9.6, 8, far ? PLUM.sh : PLUM.base), F(R(13.4, 3.2, 2, 7.6, '#ffffff')), E(18.6, 7, 4.6, 4.4, far ? GHOSTV.sh : GHOSTV.base)];
// Her teapot, held by the handle. Box 26 x 18; gripped at (4, 9), its spout's tip at (24.6, 3.6).
const vvPot = () => [
  ...stroke(arcP(6, 9, 3.4, 4.4, 90, 270, 8), 1.8, '#e8e0f8', false),
  taper([[19, 10], [23, 6], [24.6, 3.6]], 3, 1.6, '#f4f0ff'),
  E(13.6, 10, 8, 6.6, '#f4f0ff'),
  E(13.6, 3.6, 4.6, 1.8, '#e8e0f8'), E(13.6, 2, 1.4, 1.4, GOLD.base),
  ...[[10, 9], [16, 12], [12, 13.4]].flatMap(([x, y]) => [F(E(x, y, 1.4, 1.4, '#c89ae8')), F(E(x, y, 0.6, 0.6, GOLD.base))]),
  shine(13.6, 10, 8, 6.6, '#ffffff', 0, 0.7),
];
// The handbell she calls the maids with. Box 12 x 18; held at (6, 2), hanging down.
const vvBell = () => [taper([[6, 1], [6, 6.4]], 2, 2, '#8a6a5a'), T([[3.6, 6], [8.4, 6], [10.4, 13], [11.4, 15.4], [0.6, 15.4], [1.6, 13]], GOLD.base), F(taper([[4.6, 8], [3, 14]], 0.9, 0.6, GOLD.hi)), E(6, 16.2, 1.3, 1.3, GOLD.sh)];
// The keys at her belt on their ring. Box 16 x 20; hung at (8, 2).
const vvKeys = () => [
  ...stroke(arcP(8, 4, 3, 3, 0, 360, 12), 1.1, GOLD.base, false),
  ...[[-3, 15], [0, 17], [3.4, 14]].flatMap(([dx, len]) => [taper([[8 + dx * 0.3, 6.4], [8 + dx, len]], 1.2, 1, GOLD.base), R(8 + dx, len - 2.4, 2, 1.2, GOLD.base), E(8 + dx * 0.3, 6.6, 1.2, 1.2, GOLD.sh)]),
];
// A wisp of her tail, curling out from under her hem. Box 20 x 14; root at (6, 7), the next 10 along.
const VV_TW = [11, 8.4, 5.6, 1.4];
const vvTail = (k) => () => [E(6, 7, VV_TW[k] / 2, VV_TW[k] / 2, GHOSTV.base), taper([[6, 7], [16, 7]], VV_TW[k], VV_TW[k + 1], GHOSTV.base), ...(k < 2 ? [E(16, 7, VV_TW[k + 1] / 2, VV_TW[k + 1] / 2, GHOSTV.base)] : [])];
const VV_DRESS = vv('dress', 62, 40, vvDress);
const VV_TORSO = vv('torso', 44, 28, vvTorso);
const VV_HEAD = vv('head', 54, 46, vvHead);
const VV_EAR = [false, true].map((f) => vv(`ear${f ? 1 : 0}`, 14, 14, vvEar(f)));
const VV_CAP = vv('cap', 46, 18, vvCap);
const VV_ARM = [false, true].map((f) => vv(`arm${f ? 1 : 0}`, 24, 14, vvArm(f)));
const VV_POT = vv('pot', 26, 18, vvPot);
const VV_BELL = vv('bell', 12, 18, vvBell);
const VV_KEYS = vv('keys', 16, 20, vvKeys);
const VV_TAIL = [0, 1, 2].map((k) => vv(`tail${k}`, 20, 14, vvTail(k)));
const vvSpecsSprite = () => sm('vv|specs', 54, 46, vvSpecs);
// Her own face, a stern ghost cat's: heavy lids level with the top of her half-moon specs, violet eyes
// with slit pupils peering down through them, one fine brow raised, a little pink nose and a prim cat
// mouth; she hisses with her fangs out when cross and rings out wide-eyed. Box 54 x 46.
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const VV_EYES = [[31, 26.4, -1, 2.6, 3.2], [41.4, 25.8, 1, 2.2, 2.8]];
const VV_BROW = '#9a7ab8';
const VV_MOUTH = '#6a2a4a';
const vvFang = (x, y) => F(T([[x - 0.45, y], [x + 0.45, y], [x, y + 0.9]], '#ffffff'));
const vvOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of VV_EYES) {
    // Fine brows: the far one raised (she doubts you), both down to scold, both up when pleased.
    const raise = mood === 'angry' ? 0 : mood === 'happy' || mood === 'shout' ? -0.8 : s > 0 ? -1.1 : 0;
    const inner = mood === 'angry' ? 1.1 : mood === 'hurt' ? -0.8 : 0;
    out.push(...oLn([[x - s * w * 1, y - h * 1.25 + raise + inner], [x + s * w * 0.1, y - h * 1.48 + raise], [x + s * w * 1.05, y - h * 1.32 + raise * 0.6]], 0.6, VV_BROW));
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.2, w, h * 0.3, 15, 165, 8), 0.85));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 0.85));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 0.85));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.7, '#8a5ac8', s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.8));
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.4 + (px - x) * -s * 0.55 : mood === 'shout' ? () => -99 : () => y - h * 0.56;
      const wide = mood === 'shout';
      const dy = wide ? 0 : h * 0.15;
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.08, w * 0.82, h * 0.84), lid), '#8a5ac8')), F(T(oCut(oRing(x, y + h * 0.45, w * 0.62, h * 0.4), lid), '#c8a8f0')));
      out.push(F(T(oCut(oRing(x, y + dy, w * (wide ? 0.3 : mood === 'angry' ? 0.12 : 0.18), h * (wide ? 0.34 : 0.6)), lid), INK)));
      out.push(F(T(oCut(oRing(x + w * 0.32, y + dy - h * 0.12, w * 0.2, w * 0.2, 0, 8), lid), '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.25), 0.95));
    }
  }
  if (mood !== 'dead') for (const [bx, by, r] of [[27, 31, 2.2], [45, 30.4, 1.6]]) out.push(F(E(bx, by, r, r * 0.5, '#f4b4d4')));
  const [mx, my] = [37, 33];
  out.push(F(T([[mx - 0.65, my - 1.6], [mx + 0.65, my - 1.6], [mx, my - 0.85]], '#ff9ab8')));
  const omega = (k = 0) => [...oLn([[mx - 1.6, my - 0.3 - k], [mx - 0.8, my + 0.4], [mx, my - 0.15]], 0.5), ...oLn([[mx, my - 0.15], [mx + 0.8, my + 0.4], [mx + 1.6, my - 0.3 - k]], 0.5)];
  if (mood === 'shout') out.push(F(E(mx, my + 0.9, 1.6, 1.8, VV_MOUTH)), F(E(mx, my + 1.9, 0.9, 0.45, '#ff8fab')), vvFang(mx - 0.8, my - 0.7), vvFang(mx + 0.8, my - 0.7));
  else if (mood === 'angry') out.push(F(T(oArc(mx, my - 0.2, 1.8, 1.6, 0, 180, 8), VV_MOUTH)), vvFang(mx - 0.9, my - 0.15), vvFang(mx + 0.9, my - 0.15));
  else if (mood === 'happy') out.push(...omega(0.5), F(E(mx, my + 0.75, 0.55, 0.45, '#c84a7a')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.6, 0.5));
  else if (mood === 'dead') out.push(...oLn([[mx - 1.2, my + 0.2], [mx + 1.2, my + 0.2]], 0.5));
  else out.push(...omega());
  if (mood === 'hurt') out.push(...oDrop(25.6, 28.6, 0.9));
  return out;
};
const vvFace = (mood) => sm(`vv|face|${mood}`, 54, 46, () => vvOwnFace(mood));
const vvPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({ name: `tail${k}${tag}`, parent: k ? `tail${k - 1}${tag}` : 'float', s: VV_TAIL[k][i], pivot: [6, 7], at: k ? () => [10, 0] : () => [-1.6, 0], rot: (S, a) => ((k ? 40 : 112) + Math.sin(a.t * 2.4 - k * 0.9) * 10 + S.tail * (k + 1) * 0.5) * D2R })),
    { name: `earF${tag}`, parent: 'neck', s: VV_EAR[1][i], pivot: [7, 13], at: () => [-13, -37], rot: (S) => (-16 + S.ear) * D2R },
    { name: `armF${tag}`, parent: 'waist', s: VV_ARM[1][i], pivot: [4, 7], at: () => [-8, -19], rot: (S) => (60 + S.armF) * D2R },
    { name: `dress${tag}`, parent: 'waist', s: VV_DRESS[i], pivot: [31, 1], rot: (S) => S.skirt * D2R },
    { name: `keys${tag}`, parent: 'waist', s: VV_KEYS[i], pivot: [8, 2], at: () => [13, 2], rot: (S) => clamp(S.keys, -40, 40) * D2R },
    { name: `torso${tag}`, parent: 'waist', s: VV_TORSO[i], pivot: [22, 27] },
    { name: `head${tag}`, parent: 'neck', s: VV_HEAD[i], pivot: [27, 44] },
    { name: `cap${tag}`, parent: 'neck', s: VV_CAP[i], pivot: [23, 15], at: () => [0, -34], rot: (S) => S.cap * D2R },
    { name: `earN${tag}`, parent: 'neck', s: VV_EAR[0][i], pivot: [7, 13], at: () => [11, -38], rot: (S) => (12 + S.ear) * D2R },
    { name: `pot${tag}`, parent: 'hand', s: VV_POT[i], pivot: [4, 9], alpha: (a) => 1 - (a.vvBell ?? 0), rot: (S) => (S.pot - (60 + S.armN) - S.lean) * D2R },
    { name: `bell${tag}`, parent: 'hand', s: VV_BELL[i], pivot: [6, 2], alpha: (a) => a.vvBell ?? 0, rot: (S, a) => (-(60 + S.armN) - S.lean + Math.sin(a.now * 26) * 34 * (a.vvBell ?? 0)) * D2R },
    { name: `armN${tag}`, parent: 'waist', s: VV_ARM[0][i], pivot: [4, 7], at: () => [9, -18], rot: (S) => (60 + S.armN) * D2R },
  ];
};
// The plates she flings: a stream of them skimming out along the floor both ways.
function vvPlates(ctx, m, a) {
  const start = m.slamming - 1.6;
  const s = a.now - start;
  if (s < 0.3 || s > 1.6) return;
  for (let k = 0; k < 8; k++) {
    const u = clamp((s - 0.3 - (k >> 1) * 0.16) / 1.0, 0, 1);
    if (u <= 0 || u >= 1) continue;
    const side = k % 2 ? 1 : -1;
    const x = side * (24 + u * 230);
    const y = -6 - Math.sin(u * Math.PI * 3) * 3;
    const rx = 7;
    const ry = Math.max(1.4, Math.abs(Math.cos(a.now * 18 + k)) * 6);
    const al = a.alpha * Math.min(1, (1 - u) * 4);
    ctx.globalAlpha = al;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6a8ad8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c8d8ff';
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.5, ry * 0.5, 0, 0, TAU);
    ctx.fill();
    puff(ctx, a, x - side * 10, -3, 5, 0.25 * (1 - u));
  }
}
export const velvetRig = spinWrap(makeRig({
  w: 120,
  h: 126,
  soft: true,
  stride: 30,
  recover: 0.8,
  springs: {
    x: [160, 16], bob: [80, 8], lean: [110, 11], head: [120, 10], ear: [120, 7], cap: [90, 7], armN: [150, 12], armF: [130, 11], pot: [140, 11], skirt: [100, 8], specY: [140, 12],
    keys: [60, 5], tail: [60, 6],
  },
  fast: ['x', 'lean', 'armN', 'pot'],
  kick: { lean: -120, head: -200, ear: 400, cap: 300, keys: 400, tail: 200 },
  turnKick: { ear: 260, keys: 300, skirt: 160, tail: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.1;
    const t = a.t + a.uidOff;
    const now = a.now;
    const br = Math.sin(t * 1.8);
    const lu = t % 12;
    const still = 1 - a.walkW;
    // (Between moves: a tsk-tsk with a shake of the head, polishing her teapot, a glance about over
    // her spectacles.)
    const tsk = hold(lu, 1.4, 1.7, 3, 3.4) * still;
    const polish = hold(lu, 5, 5.5, 7, 7.5) * still;
    const glance = hold(lu, 9, 9.4, 10.4, 10.8) * still;
    const tea = window1(now, m.teaAt, 1.9, 0.3, 0.4);
    const bell = window1(now, m.callAt, 1.7, 0.2, 0.35);
    const plates = m.slamming > now ? 1 : 0;
    const wind = plates && m.slamming - now > 1.3 ? 1 : 0;
    a.vvTea = tea;
    a.vvBell = bell;
    a.vvPlates = plates;
    a.vvPolish = polish;
    const idle = {
      x: 0, bob: br * 2, lean: 0, head: tsk * Math.sin(t * 9) * 7 - glance * 8, ear: br * 3 + tsk * 10, cap: 0, skirt: br * 1.4,
      armN: 30 - polish * 90, armF: 40 - tsk * 20, pot: polish * (-10 + Math.sin(t * 4) * 16), specY: glance * 1.6,
    };
    const walk = { x: 0, bob: Math.sin(t * 3) * 1.6, lean: 8, head: -2, ear: -10, cap: -4, skirt: -6, armN: 40, armF: 50, pot: 10, specY: 0 };
    // Her slap of tea: the pot drawn back, then flung forward, splashing.
    const antic = { x: -2, bob: 1, lean: -8, head: -6, ear: -12, cap: 4, skirt: 4, armN: 70, armF: 20, pot: -40, specY: 0 };
    const strike = { x: 6, bob: 0, lean: 10, head: 6, ear: 14, cap: -4, skirt: -6, armN: -70, armF: 50, pot: 95, specY: 0.6 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // "Tea is served!": the pot raised high and poured, a hostess's smile.
    blendIn(out, tea, { lean: -6, head: -6, armN: -110, pot: 72, ear: 6 });
    // The bell rung over her head.
    blendIn(out, bell, { lean: -4, head: -8, armN: -130, ear: -16, cap: 6 });
    // Plates: arms crossed to wind up, then flung wide as she spins.
    blendIn(out, plates, wind ? { lean: -6, bob: -2, armN: 90, armF: 90, pot: 0, head: 4 } : { lean: 0, bob: 3, armN: -60, armF: -60, pot: 20, head: -4, skirt: 8 });
    if (m.hp <= 0) blendIn(out, 1, { lean: 10, head: 18, armN: 60, armF: 60, pot: 120, bob: -4 });
    a.vvMood = bell > 0.3 ? 'shout' : tea > 0.3 || polish > 0.5 ? 'happy' : plates || tsk > 0.4 ? 'angry' : null;
    return out;
  },
  follow: (S, a) => ({ keys: -S.lean * 1.6 + a.walkW * 14 + Math.sin(a.t * 7) * 6 * a.walkW, tail: a.walkW * -18 + S.lean * 0.6 }),
  parts: [
    // (Floating 16 px higher, 2026-11-19: her ghost tail sank through the floor.)
    { name: 'float', parent: null, at: (S) => [S.x, -26 - S.bob], rot: (S) => S.lean * D2R },
    { name: 'waist', parent: 'float', at: () => [0, -34] },
    { name: 'neck', parent: 'waist', at: () => [1, -23], rot: (S) => S.head * D2R },
    { name: 'hand', parent: 'armN', at: () => [14.6, 0] },
    ...vvPass(false),
    ...vvPass(true),
    { name: 'face', parent: 'neck', s: (a) => vvFace(moodOf(a, a.vvMood)), pivot: [27, 44] },
    { name: 'specs', parent: 'neck', s: vvSpecsSprite, pivot: [27, 44], at: (S) => [0, S.specY] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The tea: poured from the spout in an arc, steam off it.
    const pourK = Math.max(a.vvTea, a.ph.strike);
    if (pourK > 0.05 && (a.vvBell ?? 0) < 0.5) {
      const M = mat('pot');
      const [lx, ly] = [20.6, -5.4];
      const sx = M[0] * lx + M[2] * ly + M[4];
      const sy = M[1] * lx + M[3] * ly + M[5];
      ctx.lineCap = 'round';
      ctx.globalAlpha = a.alpha * pourK * 0.9;
      ctx.strokeStyle = '#c8864a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      for (let i = 1; i <= 8; i++) {
        const q = i / 8;
        ctx.lineTo(sx + q * 26, sy + q * q * Math.max(8, -sy - 6));
      }
      ctx.stroke();
      for (let k = 0; k < 5; k++) {
        const u = fr(a.now * 2.4 + k / 5);
        dot(ctx, a, sx + u * 26 + Math.sin(k * 3) * 2, sy + u * u * Math.max(8, -sy - 6), 1.4 * (1 - u * 0.5), pourK * 0.9, k % 2 ? '#e8b47a' : '#c8864a');
        puff(ctx, a, sx + u * 20, sy - 4 - u * 16, 2.4 + u * 4, pourK * 0.35 * Math.sin(u * Math.PI));
      }
    }
    // The bell's ring: little arcs flying off it, notes.
    if (a.vvBell > 0.2) inPart(ctx, mat, 'bell', () => {
      ctx.strokeStyle = '#fff6c0';
      ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) {
        const u = fr(a.now * 3 + k / 3);
        ctx.globalAlpha = a.alpha * a.vvBell * (1 - u);
        ctx.beginPath();
        ctx.arc(0, 10, 8 + u * 12, -0.6 + Math.PI, 0.6 + Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 10, 8 + u * 12, -0.6, 0.6);
        ctx.stroke();
      }
    });
    if (a.vvBell > 0.2) for (let k = 0; k < 2; k++) {
      const u = fr(a.now * 1.2 + k / 2);
      note(ctx, a, 16 + k * 8 + Math.sin(u * 6) * 3, -100 - u * 20, Math.sin(u * Math.PI) * a.vvBell, k ? '#ffe36b' : '#ffffff', 9);
    }
    if (a.vvPlates) vvPlates(ctx, m, a);
    // Her polishing makes the pot shine.
    if (a.vvPolish > 0.4) inPart(ctx, mat, 'pot', () => sparkle(ctx, a, 12, -6, 3 + Math.sin(a.now * 9) * 1.2, a.vvPolish));
  },
}), (m, a) => m.hp > 0 && m.slamming > a.now && m.slamming - a.now < 1.3 && fr(a.now * 3) > 0.5);
export function velvetStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const fy = -10;
  const wy = fy - 34;
  const [nx, ny] = [1, wy - 23];
  const hand = [9 + Math.cos(90 * D2R) * 14.6, wy - 18 + Math.sin(90 * D2R) * 14.6];
  return {
    w: 110,
    h: 124,
    res: 2,
    shapes: shift([
      ...put(vvTail(0)(), [6, 7], -1.6, fy, 112), ...put(vvEar(true)(), [7, 13], nx - 13, ny - 37, -16), ...put(vvArm(true)(), [4, 7], -8, wy - 19, 100),
      ...put(vvDress(), [31, 1], 0, wy), ...put(vvKeys(), [8, 2], 13, wy + 2), ...put(vvTorso(), [22, 27], 0, wy),
      ...put(vvHead(), [27, 44], nx, ny), ...put(vvCap(), [23, 15], nx, ny - 34), ...put(vvEar(false)(), [7, 13], nx + 11, ny - 38, 12),
      ...put(vvOwnFace(fm), [27, 44], nx, ny), ...put(vvSpecs(), [27, 44], nx, ny),
      ...put(vvPot(), [4, 9], hand[0], hand[1], 0), ...put(vvArm(false)(), [4, 7], 9, wy - 18, 90),
    ], 55, 122),
  };
}

// =====================================================================================
// Lady Marigold, the Eternal Hostess (remade 2026-11-18)
// =====================================================================================
// A marigold blossom spirit: her face in the flower (two rings of petals that breathe and spin), a
// crescent-moon tiara, a cream bodice with a leaf collar, a gown of three petal skirts, a lace fan.
// She waltzes all the time, on the music's beat (m.beat from world/manor.js). Her moves (stamps
// from world/manor.js): the Petal Twirl (m.twirlAt, when it lands), Three Steps (m.stepsAt, the
// first stamp; one on each beat), Tea for Two (m.cupsAt), floating out of reach while the butlers
// cut in (m.mech.aloft), dizzy when they're gone (m.vulnUntil), and the Last Waltz (m.slamming).
const PETAL = [ramp('#ffb03a', { step: 9, turn: 8 }), ramp('#ff962a', { step: 9, turn: 8 }), ramp('#ff8226', { step: 9, turn: 8 })];
const LEAF = ramp('#7cc46a', { step: 9, turn: 8 });
const CREAM = ramp('#fff2dc', { step: 7, turn: 8, lift: 3 });
const mg = pairOf('mg');
// (Redrawn 2026-11-19, the player's pick "A, Marigold Fairy": a girl with a bob of marigold petals
// round her face, a leaf bodice, a short two-tier petal skirt, legs in green slippers and wings;
// her long three-tier petal gown and her face in a flower are gone.)
const MG_TW = [[24, 34], [32, 44], [50, 66]];
// A petal skirt: its hem a row of round petals. Box 70 x 20; hung at (35, 1), the next 7 below.
const mgTier = (k) => () => {
  const [w0, w1] = MG_TW[k];
  const cx = 35;
  const h = 9;
  const dip = 2 + k * 0.4;
  const hemAt = (f) => [cx - w1 / 2 + w1 * f, h - dip + Math.sin(f * Math.PI) * dip];
  const P = PETAL[k];
  const out = [T([[cx - w0 / 2, 0.6], [cx + w0 / 2, 0.6], hemAt(1), hemAt(0)], P.base)];
  const n = Math.round(w1 / 7);
  for (let i = 0; i <= n; i++) {
    const [px, py] = hemAt(i / n);
    out.push(E(px, py + 0.6, 4, 3.4, P.base));
  }
  for (let i = 0; i <= n; i++) {
    const [px, py] = hemAt(i / n);
    out.push(F(E(px - 0.6, py - 0.2, 1.8, 1.2, P.hi)));
  }
  for (let i = 1; i < 5; i++) {
    const f = i / 5;
    const [hx, hy] = hemAt(f);
    out.push(F(taper([[cx - w0 / 2 + w0 * f, 1.6], [hx, hy - 2]], 0.6, 0.9, P.sh)));
  }
  out.push(F(T([[cx - w0 / 2, 0.6], [cx - w0 / 2 + 4, 0.6], hemAt(0.08), hemAt(0)], P.sh)));
  return out;
};
// The bodice: leaf green, a cream petal collar, an orange rose, a gold sash. Box 30 x 28; the waist at (15, 27).
const mgBodice = () => [
  E(15, 12, 11, 10, LEAF.base),
  T([[5, 13], [25, 13], [20, 27.4], [10, 27.4]], LEAF.base), F(taper([[15, 3], [14, 26]], 0.8, 0.8, LEAF.sh)),
  T([[15, 4], [3.4, 1], [7.4, 8.4]], CREAM.base), T([[15, 4], [26.6, 1], [22.6, 8.4]], CREAM.base),
  F(taper([[14, 4], [6, 2.6]], 0.6, 0.3, CREAM.sh)), F(taper([[16, 4], [24, 2.6]], 0.6, 0.3, CREAM.sh)),
  F(E(16, 11, 3, 3, PETAL[0].base)), F(E(16, 11, 1.4, 1.4, '#ffe08a')),
  F(R(9, 23, 12, 3, GOLD.base)),
  crescent(15, 12, 11, 10, LEAF.sh, { k: 0.2, a0: 100, a1: 210 }),
];
// An arm: a leafy puff sleeve, a cream glove. Box 18 x 10; the shoulder at (3, 5), the hand 11 along.
const MG_SKIN = ramp('#ffe4d0', { step: 7, turn: 8 });
const mgArm = (far) => () => {
  const c = far ? MG_SKIN.sh : MG_SKIN.base;
  return [taper([[6, 5], [13, 5]], 5.2, 4.8, '#e0a890'), E(14, 5, 3.6, 3.4, '#e0a890'), taper([[6, 5], [13, 5]], 4, 3.6, c), E(14, 5, 3, 2.8, c), E(4.4, 5, 4.4, 4, far ? LEAF.sh : LEAF.base), F(E(3.4, 3.4, 1.6, 1, LEAF.hi))];
};
// A leg in a pale stocking, a green slipper. Box 10 x 20; the hip at (5, 1), the ankle 17 below.
const mgLeg = (far) => () => {
  const c = far ? '#f0e4f0' : '#fff6fa';
  return [taper([[5, 1], [5, 17]], 5.6, 4.6, c), E(5, 9, 2.6, 2.6, c), blob([[2.4, 15.6], [7, 15.6], [10.4, 18], [10, 20], [2, 20]], far ? LEAF.sh : LEAF.base, 1), F(E(8.6, 17.6, 1, 0.8, '#ffe08a'))];
};
// A wing: see-through, pale veins (box 30 x 24; rooted at (27, 20) at her back).
const mgWing = (k) => () => [blob([[27, 20], [16, 6], [4, 2], [1, 10], [10, 20]], k ? '#d8eeff' : '#e8f6ff', 2), F(taper([[26, 19], [12, 8]], 0.7, 0.4, '#ffffff')), F(taper([[26, 19], [8, 14]], 0.6, 0.3, '#ffffff'))];
// Her lace fan: cream lace, orange edged; open, half open, shut. Gripped at its rivet.
const mgFan = (spread) => () => {
  const a0 = 270 - spread / 2;
  const rim = arcP(16, 18, 15, 15.6, a0, a0 + spread, 14);
  const out = [T([[16, 18], ...rim], '#fff8ec')];
  const n = Math.max(2, Math.round(spread / 24));
  for (let i = 0; i <= n; i++) {
    const ang = (a0 + 4 + ((spread - 8) * i) / n) * D2R;
    out.push(F(taper([[16, 17], [16 + Math.cos(ang) * 13.6, 18 + Math.sin(ang) * 14]], 0.6, 0.4, '#e8d8c0')));
    out.push(F(E(16 + Math.cos(ang) * 9, 18 + Math.sin(ang) * 9.4, 1, 1, '#ffd8b0')));
  }
  out.push(...stroke(rim, 1.4, PETAL[1].base));
  out.push(E(16, 18, 1.8, 1.8, GOLD.base));
  return out;
};
const mgFanShut = () => [taper([[4, 20], [4, 3]], 3.6, 2.2, '#fff8ec'), F(taper([[4, 18], [4, 5]], 0.6, 0.4, PETAL[1].base)), E(4, 20, 1.8, 1.8, GOLD.base)];
// The blossom: a back ring of twelve deep petals, a front ring of ten bright ones, her face's disc.
// Box 64 x 64; the blossom's middle at (32, 32).
// Her hair: a bob of marigold petals behind her face, round the top and down past her cheeks (none
// under her chin).
const mgPetalsBack = () => {
  const out = [E(32, 29, 16, 15, PETAL[2].base)];
  for (let i = 0; i < 11; i++) {
    const a = 150 + i * 24;
    const r = a > 330 || a < 210 ? 15 : 17;
    out.push(ov(32 + Math.cos(a * D2R) * r, 31 + Math.sin(a * D2R) * r, 7.4, 5.4, a, i % 2 ? PETAL[1].base : PETAL[2].base));
  }
  out.push(ov(17.6, 42, 5.4, 6.6, 100, PETAL[1].base), ov(47, 41.4, 5, 6.4, 80, PETAL[1].base));
  return out;
};
// Bangs: a row of small petals across her brow, above her eyes.
const mgPetalsFront = () => {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const a = 200 + i * 23;
    out.push(ov(32.6 + Math.cos(a * D2R) * 12.6, 32 + Math.sin(a * D2R) * 11.6, 4.6, 3.4, a, i % 2 ? PETAL[0].base : PETAL[1].base));
  }
  for (let i = 0; i < 7; i++) {
    const a = 200 + i * 23;
    out.push(F(ov(32.6 + Math.cos(a * D2R) * 13, 32 + Math.sin(a * D2R) * 12, 2, 1.2, a, PETAL[0].hi)));
  }
  return out;
};
const mgDisc = () => [E(32.6, 33, 12.6, 12, MG_SKIN.base), crescent(32.6, 33, 12.6, 12, MG_SKIN.sh, { k: 0.16, a0: 100, a1: 220 })];
// The crescent-moon tiara. Box 20 x 16; set on the blossom's top at (10, 15).
const mgTiara = () => [
  crescent(10, 7.4, 6.4, 6.4, GOLD.base, { k: 0.5, a0: 100, a1: 330, n: 20 }),
  E(10, 14.2, 2.6, 1.6, GOLD.base),
  F(E(10, 14, 1.2, 0.9, '#ff9ab8')),
  F(E(5.4, 9.6, 1, 0.8, GOLD.hi)),
];
// The gold sash from the bow at the back of her waist. Box 14 x 42; tied at (7, 2).
const mgSash = () => [taper([[7, 2], [5, 14], [8, 27], [6, 37]], 4, 4.6, GOLD.base), T([[3, 36], [9, 36], [10.4, 41.4], [6, 39], [2, 41.4]], GOLD.base), F(taper([[6.4, 4], [4.6, 14], [7.4, 26]], 0.8, 0.6, GOLD.hi))];
const MG_TIER = [0, 1].map((k) => mg(`ftier${k}`, 70, 14, mgTier(k)));
const MG_LEG = [false, true].map((f) => mg(`leg${f ? 1 : 0}`, 12, 21, mgLeg(f)));
const MG_WING = [0, 1].map((k) => mg(`wing${k}`, 30, 24, mgWing(k)));
const MG_BOD = mg('bodice', 30, 28, mgBodice);
const MG_ARM = [false, true].map((f) => mg(`arm${f ? 1 : 0}`, 18, 10, mgArm(f)));
const MG_FANS = [mg('fanshut', 8, 22, mgFanShut), mg('fanhalf', 32, 20, mgFan(70)), mg('fanopen', 32, 20, mgFan(150))];
const MG_FAN_PIV = [[4, 20], [16, 18], [16, 18]];
const MG_BACK = mg('hairback', 64, 64, mgPetalsBack);
const MG_FRONT = mg('bangs', 64, 64, mgPetalsFront);
const MG_DISC = mg('fdisc', 64, 64, mgDisc);
const MG_TIARA = mg('tiara', 20, 16, mgTiara);
// Her neck: from inside the collar up under her chin. Box 8 x 14; the base at (4, 12).
const MG_NECK_SHAPES = () => [R(1.4, 0, 5.2, 13, MG_SKIN.base), F(E(4, 1.4, 2.6, 1.6, MG_SKIN.sh))];
const MG_NECK = mg('neck', 8, 14, MG_NECK_SHAPES);
const MG_SASH = mg('sash', 14, 42, mgSash);
// Her own face, a marigold's: warm amber eyes with a little white flower of light in each, two lashes at
// the corner, fine orange brows, a petal-pink blush dusted with gold pollen and a sunny smile. Her sad
// face (for her scenes): brows tipped up in the middle, brimming eyes, a small frown. Box 64 x 64.
const MG_EYES = [[28.6, 32, -1, 2.6, 3.4], [36.8, 31.6, 1, 2.3, 3.1]];
const MG_BROW = '#c8702a';
const MG_MOUTH = '#a83a3a';
const mgFlower = (x, y, r) => [...[0, 1, 2, 3, 4].map((i) => F(E(x + Math.cos(i * 1.2566 - 1.57) * r, y + Math.sin(i * 1.2566 - 1.57) * r, r * 0.62, r * 0.62, '#ffffff'))), F(E(x, y, r * 0.45, r * 0.45, '#ffe48a'))];
const mgFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of MG_EYES) {
    const inner = mood === 'sad' || mood === 'hurt' ? -1.1 : mood === 'angry' ? 1 : 0;
    const lift = mood === 'shout' ? -0.7 : mood === 'happy' ? -0.4 : 0;
    out.push(...oLn([[x - s * w * 0.95, y - h * 1.32 + lift + inner], [x + s * w * 0.1, y - h * 1.52 + lift], [x + s * w * 1.05, y - h * 1.38 + lift - inner * 0.3]], 0.6, MG_BROW));
    const lashes = (yy) => [...oLn([[x + s * w * 0.85, yy - h * 0.5], [x + s * w * 1.45, yy - h * 0.95]], 0.6), ...oLn([[x + s * w * 0.45, yy - h * 0.82], [x + s * w * 0.75, yy - h * 1.35]], 0.55)];
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.4, w, h * 0.35, 15, 165, 8), 0.9), ...oLn([[x + s * w * 0.9, y + 0.6], [x + s * w * 1.4, y + 1.3]], 0.55));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 0.9), ...lashes(y + h * 0.3));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 0.85));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.7, '#e0801e', s));
    else if (mood === 'dead') out.push(...oLn(oArc(x, y + 0.4, w, h * 0.3, 15, 165, 8), 0.8));
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.3 + (px - x) * -s * 0.5 : mood === 'sad' ? (px) => y - h * 0.5 + (px - x) * s * 0.3 : mood === 'shout' ? () => -99 : () => y - h * 0.82;
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.08, w * 0.84, h * 0.84), lid), '#e0801e')), F(T(oCut(oRing(x, y + h * 0.45, w * 0.64, h * 0.4), lid), '#ffc040')));
      out.push(F(T(oCut(oRing(x, y + h * 0.08, w * (mood === 'shout' ? 0.24 : 0.36), h * (mood === 'shout' ? 0.26 : 0.38)), lid), '#5a2a10')));
      out.push(...mgFlower(x + w * 0.32, y - h * 0.22, w * 0.2), F(E(x - w * 0.36, y + h * 0.48, w * 0.1, w * 0.1, '#ffffff')));
      if (mood === 'sad') out.push(...oLn(oArc(x, y + h * 0.1, w * 0.86, h * 0.86, 30, 150, 8), 0.45, '#bfeaff'));
      out.push(...oLn(oCut(oArc(x, y, w * 1.03, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.25), 0.95), ...lashes(Math.max(y, lid(x + s * w * 0.85) + h * 0.5)));
    }
  }
  if (mood !== 'dead') for (const [bx, by, k] of [[25.6, 35.6, 1], [39.6, 35, 0.8]]) {
    out.push(F(E(bx, by, 2 * k, 1 * k, '#ffa8b8')));
    for (const [dx, dy] of [[-0.9, -0.2], [0.2, 0.35], [1, -0.3]]) out.push(F(E(bx + dx * k, by + dy * k, 0.3, 0.3, '#f0b030')));
  }
  const [mx, my] = [33, 37.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.5, 1.4, 1.8, MG_MOUTH)), F(E(mx, my + 1.4, 0.8, 0.45, '#ff9ab0')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.5, 2.2, 2, 0, 180, 8), MG_MOUTH)), F(E(mx, my + 0.8, 1.1, 0.5, '#ff9ab0')));
  else if (mood === 'sad') out.push(...oLn(oArc(mx, my + 1.4, 1.4, 1, 205, 335, 6), 0.75));
  else if (mood === 'angry') out.push(...oLn([[mx - 1.4, my + 0.5], [mx, my], [mx + 1.4, my + 0.5]], 0.7));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.5, 0.55));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.3, 0.6, 0.7, MG_MOUTH)));
  else out.push(F(T(oArc(mx, my - 0.4, 1.6, 1.3, 0, 180, 8), MG_MOUTH)), F(E(mx, my + 0.4, 0.8, 0.35, '#ff9ab0')));
  if (mood === 'hurt') out.push(...oDrop(25, 33, 0.9));
  return out;
};
const mgFace = (mood) => sm(`mg|face|${mood}`, 64, 64, () => mgFaceShapes(mood));
const mgFanOf = (a) => (a.mgOpen < 0.3 ? 0 : a.mgOpen < 0.7 ? 1 : 2);
const mgPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    // (Her wings flutter at her back, rooted inside her bodice.)
    ...[1, 0].map((k) => ({ name: `wing${k}${tag}`, parent: 'waist', s: MG_WING[k][i], pivot: [27, 20], at: () => [-3, -16 + k * 2], rot: (S, a) => ((k ? 16 : -6) + Math.sin(a.t * 14 + k) * 12 + S.lean * 0.3) * D2R })),
    { name: `sash${tag}`, parent: 'waist', s: MG_SASH[i], pivot: [7, 2], at: () => [-10, -2], rot: (S) => clamp(S.sash, -10, 75) * D2R },
    { name: `armF${tag}`, parent: 'waist', s: MG_ARM[1][i], pivot: [3, 5], at: () => [-6, -19], rot: (S) => (60 + S.armF) * D2R },
    ...[false, true].map((near) => ({ name: `leg${near ? 'N' : 'F'}${tag}`, parent: 'waist', s: MG_LEG[near ? 0 : 1][i], pivot: [5, 1], at: () => [near ? 4 : -3, 10], rot: (S, a) => ((near ? -6 : 8) + Math.sin(a.t * 2.4 + (near ? 0 : 1.4)) * 6 + (near ? 1 : -1) * S.lean * 0.4 + a.walkW * Math.sin(a.wp) * (near ? 16 : -16)) * D2R })),
    ...[1, 0].map((k) => ({ name: `tier${k}${tag}`, parent: `sk${k}`, s: MG_TIER[k][i], pivot: [35, 1] })),
    { name: `neck${tag}`, parent: 'neckJ', s: MG_NECK[i], pivot: [4, 12], at: () => [0, 3] },
    { name: `bodice${tag}`, parent: 'waist', s: MG_BOD[i], pivot: [15, 27] },
    { name: `back${tag}`, parent: 'bloom', s: MG_BACK[i], pivot: [32, 32] },
    { name: `front${tag}`, parent: 'bloom2', s: MG_FRONT[i], pivot: [32, 32] },
    { name: `disc${tag}`, parent: 'head', s: MG_DISC[i], pivot: [32, 32] },
    { name: `tiara${tag}`, parent: 'head', s: MG_TIARA[i], pivot: [10, 15], at: () => [0, -24] },
    { name: `fan${tag}`, parent: 'hand', s: (a) => MG_FANS[mgFanOf(a)][i](), pivot: (a) => MG_FAN_PIV[mgFanOf(a)], rot: (S) => (S.fan - (60 + S.armN) - S.lean) * D2R },
    { name: `armN${tag}`, parent: 'waist', s: MG_ARM[0][i], pivot: [3, 5], at: () => [7, -18], rot: (S) => (60 + S.armN) * D2R },
  ];
};
// Where in the waltz she is: 0..1 through the bar.
const mgBar = (m, a) => {
  const b = m.beat;
  const bar = b?.bar ?? 0.947;
  return { u: fr((a.now - (b?.t0 ?? 0)) / bar), bar };
};
// A stamp's window: seconds from the moment `at`, or null outside [from, to] around it.
const around = (now, at, from, to) => (at == null || now - at < from || now - at > to ? null : now - at);
export const marigoldRig = spinWrap(makeRig({
  w: 130,
  h: 150,
  soft: true,
  stride: 34,
  recover: 0.8,
  springs: {
    x: [160, 16], lift: [120, 12], lean: [110, 11], head: [110, 10], sk: [110, 9], armN: [140, 12], armF: [120, 11], fan: [140, 11], open: [320, 26], bloom: [70, 8], sash: [50, 5],
  },
  fast: ['x', 'lean', 'armN', 'fan', 'open', 'lift'],
  kick: { lean: -100, head: -160, sk: 260, sash: 300, bloom: 200 },
  turnKick: { sk: 200, sash: 260, bloom: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const now = a.now;
    const { u, bar } = mgBar(m, a);
    // (Always waltzing: a dip on ONE, up on two-three.)
    const dip = u < 1 / 3 ? Math.sin(u * 3 * Math.PI) : 0;
    const sway = Math.sin(u * TAU);
    const lu = t % 12;
    const still = 1 - a.walkW;
    const flutter = hold(lu, 1, 1.4, 3.2, 3.6) * still;
    const glance = hold(lu, 6, 6.6, 7.8, 8.4) * still;
    const idle = {
      x: 0, lift: 4 - dip * 2.4, lean: sway * 4 + glance * -6, head: -sway * 4 + glance * -14, sk: -sway * 3, bloom: sway * 6,
      armN: 30 - flutter * 130, armF: 30 + sway * 10, fan: 30 - flutter * 30 + flutter * Math.sin(t * 16) * 12, open: flutter,
    };
    const walk = { x: 0, lift: 5 - dip * 2.4, lean: 6 + sway * 3, head: -sway * 3, sk: -5 + sway * 2, bloom: 8, armN: 20, armF: -40, fan: 40, open: 0 };
    // Her fan slap.
    const antic = { x: -2, lift: 4, lean: -8, head: -4, sk: 4, bloom: -10, armN: 100, armF: 10, fan: -60, open: 0 };
    const strike = { x: 6, lift: 4, lean: 12, head: 4, sk: -6, bloom: 20, armN: -40, armF: 40, fan: 100, open: 1 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // The Petal Twirl: arms up as it's marked, a whirl as it lands.
    const tw = around(now, m.twirlAt, -2 * bar, 0.8);
    if (tw != null) blendIn(out, 1, tw < 0 ? { lean: -4, armN: -150, armF: -150, fan: 0, open: 1, lift: 6, bloom: 30 } : { lean: 0, armN: -70, armF: -70, fan: 60, open: 1, lift: 8, bloom: 120, sk: 6 });
    // Three Steps: a stamp of her heel on each beat, fan raised.
    const st = around(now, m.stepsAt, -1.5 * bar, bar + 0.3);
    if (st != null) {
      const k = st < 0 ? 0 : 1 - fr(st / (bar / 3));
      blendIn(out, 1, { lean: 8, head: 6, armN: -120, fan: 20, open: 1, armF: 40, lift: 2 + k * 6, sk: -k * 4, bloom: -k * 10 });
    }
    // Tea for Two: a toast raised to her guests.
    const cu = around(now, m.cupsAt, -2 * bar, 0.6);
    if (cu != null) blendIn(out, 1, { lean: -6, head: -8, armN: -90, armF: -110, fan: -10, open: 1, lift: 6 });
    // Out of reach while the butlers cut in: floating up high, hugging herself.
    if (m.mech?.aloft) blendIn(out, 1, { lift: 70 + Math.sin(t * 1.6) * 4, lean: 0, head: 10, armN: 80, armF: 80, fan: 120, open: 0, bloom: Math.sin(t * 1.2) * 10 });
    // Dizzy once they're gone.
    if (m.vulnUntil > now) blendIn(out, 1, { lift: 0, lean: Math.sin(t * 5) * 12, head: Math.sin(t * 5 + 1) * 14, armN: 60, armF: 60, fan: 140, open: 0, bloom: Math.sin(t * 3) * 40 });
    // The Last Waltz: arms flung open, the moon behind her.
    if (m.slamming > now) blendIn(out, 1, { lift: 12, lean: -10, head: -12, armN: -150, armF: -150, fan: -20, open: 1, bloom: 60 });
    if (m.hp <= 0) blendIn(out, 1, { lean: 4, head: 14, armN: 70, armF: 70, fan: 160, open: 0 });
    a.mgTwirl = tw;
    a.mgLast = m.slamming > now ? 1 : 0;
    a.mgAloft = m.mech?.aloft ? 1 : 0;
    a.mgMood = m.vulnUntil > now ? 'dizzy' : a.mgAloft ? 'sad' : st != null || a.mgLast ? 'angry' : tw != null || cu != null || flutter > 0.5 ? 'happy' : glance > 0.4 ? 'sad' : null;
    return out;
  },
  follow: (S, a) => ({ sash: 14 - S.lean * 1 + a.walkW * 16 + (a.mgTwirl != null ? 40 : 0) }),
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -44 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neckJ', parent: 'waist', at: () => [1, -25], rot: (S) => S.head * D2R },
    { name: 'head', parent: 'neckJ', at: () => [0, -19] },
    // (The petal rings turn about her face: the back one with the bloom, the front a little against it.)
    { name: 'bloom', parent: 'head', rot: (S) => clamp(S.bloom, -60, 60) * 0.06 * D2R },
    { name: 'bloom2', parent: 'head', rot: (S) => -clamp(S.bloom, -60, 60) * 0.04 * D2R },
    { name: 'hand', parent: 'armN', at: () => [11, 0] },
    { name: 'sk0', parent: 'waist', at: () => [0, -1], rot: (S, a) => (S.sk * 0.6 + Math.sin(a.t * 2.2) * 1) * D2R },
    { name: 'sk1', parent: 'sk0', at: () => [0, 7], rot: (S, a) => (S.sk * 0.5 + Math.sin(a.t * 2.2 - 0.9) * 1.4) * D2R },
    ...mgPass(false),
    ...mgPass(true),
    { name: 'face', parent: 'head', s: (a) => mgFace(a.face === 'dead' ? 'dead' : a.ph.strike > 0.25 ? 'shout' : a.mgMood === 'sad' || MOODS.has(a.mgMood) ? a.mgMood : moodOf(a)), pivot: [32, 32] },
  ],
  fx(ctx, m, a, S) {
    a.mgOpen = S.open;
    if (m.hp <= 0) return;
    // Petals always drifting off her, a note on each bar.
    for (let k = 0; k < 4; k++) {
      const u = fr(a.t * 0.35 + k / 4);
      ctx.save();
      // (They shrink away rather than fade: a fading orange goes brown on the dark halls.)
      const z = Math.sin(u * Math.PI);
      ctx.globalAlpha = a.alpha * Math.min(1, z * 3) * 0.95;
      ctx.translate(-20 + k * 14 + Math.sin(u * 6 + k) * 8, -60 - S.lift + u * 56);
      ctx.rotate(u * 7 + k);
      ctx.scale(z, z);
      ctx.fillStyle = k % 2 ? '#ffb03a' : '#ff8a2a';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.6, 2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffe08a';
      ctx.beginPath();
      ctx.ellipse(-1, -0.5, 1.6, 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const { u } = mgBar(m, a);
    if (!a.mgAloft) note(ctx, a, 18, -128 - S.lift - u * 10, (1 - u) * 0.8, '#ffe36b', 9);
    // The twirl's whirl of petals; the moon's glow in the Last Waltz.
    if (a.mgTwirl != null && a.mgTwirl > -0.4) for (let k = 0; k < 10; k++) {
      const ang = a.now * 7 + (k / 10) * TAU;
      const r = 26 + (k % 3) * 9;
      dot(ctx, a, Math.cos(ang) * r, -34 + Math.sin(ang) * r * 0.35, 2.4, 0.9, k % 2 ? '#ffb03a' : '#ffe08a');
    }
    if (a.mgLast) puff(ctx, a, 0, -100 - S.lift, 46, 0.35, '255,246,200');
  },
}), (m, a) => m.hp > 0 && m.twirlAt != null && a.now - m.twirlAt > 0 && a.now - m.twirlAt < 0.8 && fr(a.now * 3) > 0.5);
// (The fan's sprite is picked from last frame's sprung openness, like Minuet's.)
const mgDraw = marigoldRig.draw;
marigoldRig.draw = (ctx, m, a) => {
  a.mgOpen = a.mo.rig?.open?.x ?? 0;
  mgDraw(ctx, m, a);
};
export function marigoldStill(pose, f, mood) {
  const fm = MOODS.has(mood) || mood === 'sad' ? mood : 'idle';
  const wy = -48;
  const [nx, ny] = [1, wy - 25];
  const [hx, hy] = [nx, ny - 19];
  const hand = [7 + Math.cos(90 * D2R) * 11, wy - 18 + Math.sin(90 * D2R) * 11];
  return {
    w: 110,
    h: 150,
    res: 2,
    shapes: shift([
      ...put(mgWing(1)(), [27, 20], -3, wy - 14, 16), ...put(mgWing(0)(), [27, 20], -3, wy - 16, -6),
      ...put(mgSash(), [7, 2], -10, wy - 2, 14), ...put(mgArm(true)(), [3, 5], -6, wy - 19, 90),
      ...put(mgLeg(true)(), [5, 1], -3, wy + 10, 8), ...put(mgLeg(false)(), [5, 1], 4, wy + 10, -6),
      ...put(mgTier(1)(), [35, 1], 0, wy + 6), ...put(mgTier(0)(), [35, 1], 0, wy - 1),
      ...put(MG_NECK_SHAPES(), [4, 12], nx, ny + 3), ...put(mgBodice(), [15, 27], 0, wy), ...put(mgPetalsBack(), [32, 32], hx, hy), ...put(mgPetalsFront(), [32, 32], hx, hy), ...put(mgDisc(), [32, 32], hx, hy),
      ...put(mgTiara(), [10, 15], hx, hy - 24), ...put(mgFaceShapes(fm), [32, 32], hx, hy),
      ...put(mgFanShut(), [4, 20], hand[0], hand[1], 30), ...put(mgArm(false)(), [3, 5], 7, wy - 18, 90),
    ], 55, 146),
  };
}
