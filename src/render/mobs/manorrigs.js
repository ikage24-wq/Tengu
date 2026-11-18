// The Moonlit Manor's residents, remade from scratch for Chapter 4 (2026-11-18): the staff and the
// guests of a party that has gone on for a hundred years. Live puppets on the rig (rig.js): every
// part drawn once and placed each frame, outer outline only, faces bare; everything that grows out of
// them is rooted in them; no thin legs (they waddle on round bottoms, glide, float, or step on tiny
// feet under a hem).
//
//   topiarydryad   Topiary Swan: a hedge clipped into a swan, a pink rose on its head. Waddles on its
//                  round bottom, orange feet paddling under it; preens, shakes its leaves, looks
//                  about. Pecks.
//   lanternghost   Lantern Wisp: a little flame spirit living in an iron lantern that floats along
//                  swaying. Rises up out of the lantern's top to look about; yawns. Flares and spits.
//   porcelaindoll  Porcelain Doll: a china bunny doll in a pink frock and bonnet with a lace parasol,
//                  a wind-up key in its back. Ticks along on tiny steps; twirls the parasol, curtsies,
//                  winds down and slumps, then winds itself back up. Parasol jab.
//   ghostmaid      Ghost Maid: a little ghost cat in a maid's dress, apron and cap, a wisp for a tail,
//                  a feather duster. Floats about dusting the air; sneezes. Swats.
//   teahatter      Tea Party Hatter: a round teapot in a top hat, riding a saucer. Glides; tips its
//                  hat, its lid pops with a whistle of steam. Tips over and pours a splash of tea.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, smooth, clamp, lerp, inPart, TAU } from './rig.js';
import { D2R, fr, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, dot, puff, sparkle } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);

// =====================================================================================
// Topiary Swan
// =====================================================================================
const HEDGE = ramp('#5fae7e', { step: 9, turn: 10 });
const ROSE = ramp('#ff8fb8', { step: 9, turn: 8 });
const BEAK = '#ffb05a';
const sw = pairOf('ts');
// The body: a clipped hedge ball, leafy bumps along its back, a pointed tail, two little blossoms.
// Box 30 x 20; its joint (where it sits) at (16, 19).
const tsBody = () => [
  E(16, 11, 12.5, 8.5, HEDGE.base),
  T([[6, 8], [0.6, 3], [2.4, 10], [6, 14]], HEDGE.base),
  ...[0, 1, 2, 3, 4, 5].map((i) => E(7 + i * 3.6, 4.4 + (i % 2) * 1.2, 2.8, 2.3, HEDGE.base)),
  crescent(16, 11, 12.5, 8.5, HEDGE.sh, { k: 0.2, a0: 30, a1: 160, jag: 0.5 }),
  ...[[10, 8], [17, 6], [22, 10], [13, 13], [20, 14]].map(([x, y]) => F(E(x, y, 1.4, 1, HEDGE.hi))),
  E(4, 6, 1.4, 1.4, '#ffffff'), F(E(4, 6, 0.6, 0.6, '#ffe36b')),
  E(25, 15, 1.2, 1.2, '#ffffff'), F(E(25, 15, 0.5, 0.5, '#ffe36b')),
];
const tsWing = () => [T([[3, 1], [12, 3], [14, 7], [9, 10], [2, 6]], HEDGE.base), F(taper([[4, 3], [10, 5]], 0.8, 0.4, HEDGE.sh)), F(taper([[4, 6], [9, 8]], 0.8, 0.4, HEDGE.sh))];
// The neck: one clipped S-curve, thick at the base (hidden in the body) and thinner up to the head.
// Box 14 x 24; its base at (5, 22), the head on top at (8.4, 3).
const tsNeck = () => [
  taper([[5, 23], [7.4, 17], [5.4, 11.4], [6, 6.4], [8.4, 3]], 7.6, 5.4, HEDGE.base),
  F(taper([[5.6, 16], [4.4, 11.6], [5, 7.4]], 1, 0.6, HEDGE.hi)),
  F(taper([[9.4, 16], [8, 12]], 0.8, 0.4, HEDGE.sh)),
];
// The head: hedge, an orange beak, a rose on top. Box 17 x 13; the neck at (4.4, 11.4).
const tsHead = () => [
  E(6.4, 7.4, 6, 5.4, HEDGE.base),
  T([[11, 6.4], [16.4, 7.8], [11, 9.6]], BEAK),
  F(taper([[11.4, 8], [15.4, 8]], 0.4, 0.3, '#d8803a')),
  E(4.4, 2.8, 2.6, 2.4, ROSE.base), F(E(3.8, 2.2, 1.2, 1, ROSE.hi)),
  ov(8.6, 3.2, 2, 1, -20, HEDGE.hi),
  crescent(6.4, 7.4, 6, 5.4, HEDGE.sh, { k: 0.2, a0: 60, a1: 200 }),
];
const tsFoot = (far) => () => [T([[0.4, 2.6], [2, 0.6], [4, 0.6], [6.4, 2.6]], far ? '#d8803a' : BEAK)];
const TS_BODY = sw('body', 30, 20, tsBody);
const TS_WING = sw('wing', 14, 10, tsWing, 2);
const TS_NECK = sw('neck', 14, 24, tsNeck, 2);
const TS_HEAD = sw('head', 17, 13, tsHead, 2);
const TS_FOOT = [false, true].map((f) => sw(`foot${f ? 1 : 0}`, 7, 3, tsFoot(f), 2));
const TS_FACE = { eyes: [[8.2, 6.8, 1.5, 2, 1]], mouth: [10.6, 10.4, 0.1], blush: [[6.2, 9.6, 1.2]], iris: '#3a6a4a', lid: 0 };
const tsFace = (mood) => sm(`ts|face|${mood}`, 17, 13, () => faceShapes(mood, TS_FACE));
const tsPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `footF${tag}`, parent: null, s: TS_FOOT[1][i], pivot: [3.4, 1.4], at: (S, a) => [S.x + 3 + pawStep(a.tsU ?? 0, 0.5, 10, 0.55, 1.6)[0] * a.walkW, -1.2 - pawStep(a.tsU ?? 0, 0.5, 10, 0.55, 1.6)[1] * a.walkW] },
    { name: `neck${tag}`, parent: 'nk', s: TS_NECK[i], pivot: [5, 22] },
    { name: `body${tag}`, parent: 'hull', s: TS_BODY[i], pivot: [16, 19] },
    { name: `head${tag}`, parent: 'top', s: TS_HEAD[i], pivot: [4.4, 11.4], rot: (S) => S.head * D2R },
    { name: `wing${tag}`, parent: 'hull', s: TS_WING[i], pivot: [3, 3], at: () => [-4, -12], rot: (S) => S.wing * D2R },
    { name: `footN${tag}`, parent: null, s: TS_FOOT[0][i], pivot: [3.4, 1.4], at: (S, a) => [S.x - 3 + pawStep(a.tsU ?? 0, 0, 10, 0.55, 1.6)[0] * a.walkW, -0.8 - pawStep(a.tsU ?? 0, 0, 10, 0.55, 1.6)[1] * a.walkW] },
  ];
};
export const swanRig = makeRig({
  w: 34,
  h: 42,
  soft: true,
  stride: 10,
  recover: 0.6,
  springs: { x: [240, 20], lift: [180, 13], rock: [160, 11], n0: [110, 9], n2: [90, 8], head: [100, 8], wing: [120, 7] },
  fast: ['x', 'n0', 'n2', 'rock'],
  kick: { rock: -260, n0: -300, n2: 300, wing: 500 },
  turnKick: { rock: 140, n2: 200, wing: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 1.07;
    const t = a.t + a.uidOff;
    a.tsU = stepPhase(m, a, 'ts', 10);
    const p = a.tsU * TAU;
    const lu = t % 11;
    // (A courtly bow to the guests, its leaves shaken out, a look about.)
    const bow = hold(lu, 1, 1.6, 2.6, 3.2);
    const shake = hold(lu, 5, 5.2, 5.9, 6.1);
    const look = hold(lu, 8, 8.4, 9.4, 9.8);
    const still = 1 - a.walkW;
    a.tsShake = shake * still;
    a.tsBow = bow * still;
    const br = Math.sin(t * 1.8);
    const idle = {
      x: 0, lift: br * 0.3, rock: Math.sin(t * 18) * 9 * shake + bow * 6, n0: bow * 16 + br * 2 - look * 6, n2: bow * 26 + look * Math.sin(t * 2) * 22, head: bow * 16 - look * 8, wing: br * 4 + shake * Math.sin(t * 18 + 1) * 20 + bow * 24,
    };
    // The waddle: rocking on its round bottom, the neck swaying a beat behind.
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 0.8, rock: Math.sin(p) * 7, n0: 6 + Math.sin(p - 0.6) * 6, n2: -Math.sin(p - 1.4) * 8, head: 0, wing: Math.sin(p) * 10 };
    // The peck: neck drawn back, then shot forward and down.
    const antic = { x: -2, lift: 0, rock: -8, n0: -34, n2: -10, head: -14, wing: -10 };
    const strike = { x: 5, lift: 0.6, rock: 10, n0: 36, n2: 22, head: 10, wing: 18 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hull', parent: null, at: (S) => [S.x, -1 - S.lift], rot: (S) => S.rock * D2R },
    { name: 'nk', parent: 'hull', at: () => [7, -6], rot: (S, a) => (S.n0 + Math.sin(a.t * 1.4) * 2) * D2R },
    { name: 'top', parent: 'nk', at: () => [3.4, -19], rot: (S, a) => (S.n2 + Math.sin(a.t * 1.4 - 0.8) * 3) * D2R },
    ...tsPass(false),
    ...tsPass(true),
    { name: 'face', parent: `head`, s: (a) => tsFace(moodOf(a, a.tsBow > 0.5 ? 'happy' : null)), pivot: [4.4, 11.4] },
  ],
  fx(ctx, m, a) {
    // Leaves shaken loose.
    if (a.tsShake > 0.3) for (let k = 0; k < 5; k++) {
      const u = fr(a.t * 2 + k / 5);
      const side = k % 2 ? 1 : -1;
      ctx.save();
      ctx.globalAlpha = a.alpha * (1 - u) * a.tsShake;
      ctx.translate(side * (6 + u * 14), -14 - k * 2 + u * u * 16);
      ctx.rotate(u * 6 + k);
      ctx.fillStyle = k % 3 ? HEDGE.base : HEDGE.hi;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.4, 1.3, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  },
});
export function swanStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const bx = 0;
  const by = -1;
  const [nx, ny] = [bx + 7, by - 6];
  const [hx, hy] = [nx + 3.4, ny - 19];
  return {
    w: 36,
    h: 44,
    res: 3,
    shapes: shift([...put(tsNeck(), [5, 22], nx, ny), ...put(tsBody(), [16, 19], bx, by), ...put(tsHead(), [4.4, 11.4], hx, hy), ...put(faceShapes(fm, TS_FACE), [4.4, 11.4], hx, hy), ...put(tsWing(), [3, 3], bx - 4, by - 12), ...put(tsFoot(false)(), [3.4, 1.4], -3, -0.8)], 18, 43),
  };
}

// =====================================================================================
// Lantern Wisp
// =====================================================================================
const IRON = ramp('#4a3e66', { step: 9, turn: 8, lift: 18 });
const GLASS = '#ffe6b0';
const FLAME = ramp('#ff9a5a', { step: 9, turn: 8 });
const lw = pairOf('lw');
// The ring the lantern hangs from. Box 8 x 8; its bottom at (4, 7.4).
const lwRing = () => [...stroke(arcP(4, 3.6, 3, 3, 0, 360, 14), 1.2, IRON.base)];
// The lantern behind the flame: roof, glass, base. Box 18 x 26; hung at (9, 1).
const lwBack = () => [
  T([[2, 7], [9, 1.4], [16, 7]], IRON.base), F(T([[5, 6], [9, 2.6], [10, 4]], IRON.hi)), E(9, 1.4, 1.2, 1.2, '#ffd36b'),
  R(3, 7, 12, 15, GLASS), F(R(4, 8, 3, 13, '#fff6dc')),
  R(2, 22, 14, 3, IRON.base), R(5, 25, 8, 1.4, IRON.base),
];
// Its bars, in front of the flame. Same box.
const lwBars = () => [R(2.4, 6.4, 13.2, 1.4, IRON.base), R(2.4, 6.4, 1.4, 16, IRON.base), R(14.2, 6.4, 1.4, 16, IRON.base), ...stroke(arcP(9, 7.6, 4.4, 2.4, 0, 180, 8), 0.9, IRON.base), F(R(2.6, 7, 0.8, 14, IRON.hi))];
// The wisp: a plump flame with a face. Box 12 x 15; its root at (6, 14).
const lwFlame = () => [
  T([[6, 0.6], [8.6, 4], [11, 8.6], [10.4, 12.4], [6, 14.6], [1.6, 12.4], [1, 8.6], [3.4, 4], [4.6, 2.6]], FLAME.base),
  E(6, 10.6, 3.6, 3.4, '#ffd27a'),
  F(E(6, 11.4, 2, 1.8, '#fff2c0')),
  F(taper([[4, 4], [3, 8]], 0.8, 0.4, FLAME.hi)),
];
const LW_RING = lw('ring', 8, 8, lwRing, 2);
const LW_BACK = lw('back', 18, 26, lwBack, 2);
const LW_BARS = lw('bars', 18, 26, lwBars, 2);
const LW_FLAME = lw('flame', 12, 15, lwFlame, 2);
const LW_FACE = { eyes: [[4.6, 8.4, 1.3, 1.8, -1], [7.8, 8.2, 1.1, 1.6, 1]], mouth: [6.3, 11.4, 1.5], blush: [[3.2, 10.4, 1], [9, 10.2, 0.8]], iris: '#a8402a', lid: 0 };
const lwFace = (mood) => sm(`lw|face|${mood}`, 12, 15, () => faceShapes(mood, LW_FACE));
const lwPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `ring${tag}`, parent: 'hang', s: LW_RING[i], pivot: [4, 7.4], at: () => [0, 0] },
    { name: `back${tag}`, parent: 'lantern', s: LW_BACK[i], pivot: [9, 1] },
    { name: `flame${tag}`, parent: 'lantern', s: LW_FLAME[i], pivot: [6, 14], at: (S) => [S.fx, 21 - S.rise], rot: (S, a) => (Math.sin(a.t * 9) * 5 + S.flick) * D2R },
    { name: `bars${tag}`, parent: 'lantern', s: LW_BARS[i], pivot: [9, 1] },
  ];
};
export const wispRig = makeRig({
  w: 26,
  h: 40,
  soft: true,
  stride: 20,
  recover: 0.6,
  springs: { x: [200, 18], bob: [80, 8], sway: [60, 5], rise: [120, 11], fx: [140, 12], flick: [120, 8] },
  fast: ['x', 'rise', 'fx'],
  kick: { sway: 260, flick: 400 },
  turnKick: { sway: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.3;
    const t = a.t + a.uidOff;
    const lu = t % 12;
    const peek = hold(lu, 2, 2.6, 4.4, 5);
    const yawn = hold(lu, 7.6, 8, 8.8, 9.2);
    const still = 1 - a.walkW;
    a.lwYawn = yawn * still;
    a.lwPeek = peek * still;
    const lean = a.walkW * 10;
    const idle = { x: 0, bob: Math.sin(t * 2) * 2, sway: Math.sin(t * 1.4) * 5, rise: peek * 19, fx: peek * Math.sin(t * 2.2) * 3, flick: 0 };
    const walk = { x: 0, bob: Math.sin(t * 3) * 1.4, sway: -lean + Math.sin(t * 2.2) * 4, rise: 0, fx: 0, flick: -8 };
    // The spit: the flame swelling up bright, then thrown forward.
    const antic = { x: -2, bob: -2, sway: 10, rise: 7, fx: -1, flick: 0 };
    const strike = { x: 3, bob: 0, sway: -16, rise: 4, fx: 3, flick: -20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hang', parent: null, at: (S) => [S.x, -38 - S.bob] },
    { name: 'lantern', parent: 'hang', at: () => [0, 0], rot: (S) => S.sway * D2R },
    ...lwPass(false),
    ...lwPass(true),
    { name: 'face', parent: 'flame', s: (a) => lwFace(moodOf(a, a.lwYawn > 0.5 ? 'shout' : a.lwPeek > 0.6 ? 'happy' : null)), pivot: [6, 14] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const pow = Math.max(a.ph.antic, a.ph.strike);
    inPart(ctx, mat, 'flame', () => {
      const r = 12 + pow * 10;
      const g = ctx.createRadialGradient(0, -6, 1, 0, -6, r);
      g.addColorStop(0, `rgba(255,214,140,${(0.45 + pow * 0.4) * a.alpha})`);
      g.addColorStop(1, 'rgba(255,154,90,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-r, -6 - r, r * 2, r * 2);
      for (let k = 0; k < 3; k++) {
        const u = fr(a.t * 1.6 + k / 3);
        dot(ctx, a, Math.sin(u * 6 + k) * 2, -14 - u * 10, 0.8 * (1 - u) + 0.3, (1 - u) * 0.9, k % 2 ? '#ffe36b' : '#ffb03a');
      }
    });
  },
});
export function wispStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return {
    w: 26,
    h: 46,
    res: 3,
    shapes: shift([...put(lwRing(), [4, 7.4], 0, -40), ...put(lwBack(), [9, 1], 0, -40), ...put(lwFlame(), [6, 14], 0, -19), ...put(faceShapes(fm, LW_FACE), [6, 14], 0, -19), ...put(lwBars(), [9, 1], 0, -40)], 13, 45),
  };
}

// =====================================================================================
// Porcelain Doll
// =====================================================================================
const PORC = ramp('#fbf4f0', { step: 7, turn: 8, lift: 3 });
const FROCK = ramp('#ffb3c8', { step: 9, turn: 8 });
const LACE = '#fff2f8';
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const pd = pairOf('pd');
// The frock's skirt: a little bell with a lace hem and a bow. Box 20 x 14; its waist at (10, 1).
const pdSkirt = () => {
  const out = [T([[5, 0.6], [15, 0.6], [18, 9], [19.4, 13], [0.6, 13], [2, 9]], FROCK.base)];
  const hem = [];
  for (let i = 0; i <= 10; i++) hem.push([0.6 + i * 1.88, 13 + (i % 2 ? 1.2 : 0)]);
  out.push(T([[1.2, 10.6], [18.8, 10.6], ...hem.reverse()], LACE));
  out.push(crescent(10, 8, 9, 6, FROCK.sh, { k: 0.18, a0: 100, a1: 200 }), F(E(13, 4, 2, 3, FROCK.hi)));
  out.push(T([[8, 1], [5.6, -0.6], [5.6, 3], [8, 1.8], [12, 1.8], [14.4, 3], [14.4, -0.6], [12, 1]], FROCK.sh));
  return out;
};
const pdBodice = () => [T([[1.4, 8], [2, 1.6], [8, 1.6], [8.6, 8]], FROCK.base), T([[1, 2.4], [5, 0.4], [9, 2.4], [5, 3.6]], LACE), F(E(5, 5, 0.7, 0.7, '#ffffff'))];
// The head: a round china bunny face, a tiny hairline crack at the brow, a ruffled bonnet round the
// back. Box 18 x 15; the neck at (9, 14).
const pdHead = () => [
  T(arcP(8.6, 7.6, 8.2, 7.4, 120, 300, 12).concat([[8.6, 7.6]]), FROCK.base),
  ...[0, 1, 2, 3, 4].map((k) => E(8.6 + Math.cos((130 + k * 36) * D2R) * 8.2, 7.6 + Math.sin((130 + k * 36) * D2R) * 7.4, 1.8, 1.8, LACE)),
  E(9.6, 8, 6.6, 6, PORC.base),
  crescent(9.6, 8, 6.6, 6, PORC.sh, { k: 0.2, a0: 90, a1: 200 }),
  F(taper([[12.6, 3], [13.4, 4.4], [12.8, 5.2], [13.6, 6.4]], 0.35, 0.25, '#c8b8c8')),
  shine(9.6, 8, 6.6, 6, '#ffffff', 0, 0.7),
];
const pdEar = (far) => () => [T([[1.2, 11], [0.6, 4], [2.4, 0.6], [4.2, 4], [3.8, 11]], far ? PORC.sh : PORC.base), F(T([[1.8, 9], [1.6, 4.4], [2.4, 2.4], [3.2, 4.4], [3, 9]], '#ffc8d8'))];
const pdArm = (far) => () => [taper([[1, 2], [5, 2.2]], 2.6, 2.2, far ? PORC.sh : PORC.base), E(5.6, 2.2, 1.4, 1.3, far ? PORC.sh : PORC.base)];
// The parasol: a lace canopy on a stick. Box 22 x 26; held at (11, 24).
const pdParasol = () => {
  const out = [taper([[11, 25], [11, 6]], 1.2, 1, '#8a6a5a'), E(11, 25.4, 1.2, 1.2, GOLD.base)];
  const dome = arcP(11, 9, 10.4, 7.6, 180, 360, 14);
  const hem = [];
  for (let i = 0; i <= 8; i++) hem.push([0.6 + i * 2.6, 9 + (i % 2 ? 1.6 : 0)]);
  out.push(T([...dome, ...hem.reverse()], LACE));
  for (const a of [210, 250, 290, 330]) out.push(F(taper([[11, 1.6], [11 + Math.cos(a * D2R) * 10, 9 + Math.sin(a * D2R) * 1]], 0.4, 0.3, FROCK.base)));
  out.push(E(11, 1.2, 1.2, 1.2, FROCK.base));
  return out;
};
const pdKey = () => [taper([[1, 3], [4, 3]], 1.2, 1.2, GOLD.sh), ...stroke(arcP(6, 3, 2, 2.4, 0, 360, 12), 1.1, GOLD.base), E(1, 3, 1, 1.6, GOLD.base)];
const pdShoe = (far) => () => [E(2.6, 1.6, 2.4, 1.4, far ? '#c87090' : '#ff8fb0')];
const PD_SKIRT = pd('skirt', 20, 14, pdSkirt, 2);
const PD_BOD = pd('bodice', 10, 9, pdBodice, 2);
const PD_HEAD = pd('head', 18, 15, pdHead, 2);
const PD_EAR = [false, true].map((f) => pd(`ear${f ? 1 : 0}`, 5, 12, pdEar(f), 2));
const PD_ARM = [false, true].map((f) => pd(`arm${f ? 1 : 0}`, 7, 4, pdArm(f), 2));
const PD_PARASOL = pd('parasol', 22, 26, pdParasol, 2);
const PD_KEY = pd('key', 9, 6, pdKey, 2);
const PD_SHOE = [false, true].map((f) => pd(`shoe${f ? 1 : 0}`, 5, 3, pdShoe(f), 2));
const PD_FACE = { eyes: [[9.6, 8, 1.4, 1.9, -1], [13, 7.8, 1.1, 1.6, 1]], mouth: [11.6, 11.2, 1.4], blush: [[8, 10, 1.3], [14.2, 9.8, 0.9]], iris: '#7a50b8', lid: 0 };
const pdFace = (mood) => sm(`pd|face|${mood}`, 18, 15, () => faceShapes(mood, PD_FACE));
const pdPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const shoe = (k, far) => ({ name: `shoe${k}${tag}`, parent: null, s: PD_SHOE[far ? 1 : 0][i], pivot: [2.6, 1.4], at: (S, a) => { const [dx, l] = pawStep(a.pdU ?? 0, far ? 0.5 : 0, 7, 0.55, 1.2); return [S.x + (far ? 2.4 : -2) + dx * a.walkW, -1.2 - l * a.walkW]; } });
  return [
    shoe(1, true),
    { name: `parasol${tag}`, parent: 'hand', s: PD_PARASOL[i], pivot: [11, 24], rot: (S) => (S.parasol - (40 + S.armN) - S.tick) * D2R },
    { name: `key${tag}`, parent: 'hip', s: PD_KEY[i], pivot: [1, 3], at: () => [-5, -5], rot: (S) => (180 + S.key) * D2R },
    { name: `earF${tag}`, parent: 'neck', s: PD_EAR[1][i], pivot: [2.4, 11], at: () => [-2, -12], rot: (S) => (-14 + S.ear) * D2R },
    { name: `armF${tag}`, parent: 'hip', s: PD_ARM[1][i], pivot: [1, 2], at: () => [2, -6], rot: (S) => (60 + S.armF) * D2R },
    shoe(0, false),
    { name: `skirt${tag}`, parent: 'hip', s: PD_SKIRT[i], pivot: [10, 1], at: () => [0, -1], rot: (S) => S.skirt * D2R },
    { name: `bodice${tag}`, parent: 'hip', s: PD_BOD[i], pivot: [5, 8] },
    { name: `head${tag}`, parent: 'neck', s: PD_HEAD[i], pivot: [9, 14] },
    { name: `earN${tag}`, parent: 'neck', s: PD_EAR[0][i], pivot: [2.4, 11], at: () => [1.4, -13], rot: (S) => (6 + S.ear) * D2R },
    { name: `armN${tag}`, parent: 'hip', s: PD_ARM[0][i], pivot: [1, 2], at: () => [-1.4, -6], rot: (S) => (40 + S.armN) * D2R },
  ];
};
export const dollRig = makeRig({
  w: 30,
  h: 46,
  soft: true,
  stride: 7,
  recover: 0.6,
  springs: { x: [260, 20], lift: [220, 16], tick: [300, 20], head: [140, 10], ear: [120, 7], armN: [160, 11], armF: [160, 11], parasol: [120, 9], skirt: [140, 9], key: [200, 14] },
  fast: ['x', 'armN', 'parasol'],
  kick: { tick: -200, head: -260, ear: 500, parasol: 300 },
  turnKick: { ear: 300, skirt: 200, parasol: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.pdU = stepPhase(m, a, 'pd', 7);
    const p = a.pdU * TAU;
    const lu = t % 13;
    const twirl = hold(lu, 1, 1.4, 3, 3.4);
    const curtsy = hold(lu, 5, 5.5, 6.2, 6.8);
    const down = hold(lu, 8.4, 9.4, 10.2, 10.4);
    const rewind = hold(lu, 10.2, 10.4, 11, 11.4);
    const still = 1 - a.walkW;
    a.pdDown = down * still;
    a.pdRewind = rewind * still;
    const br = Math.sin(t * 2);
    // (Its key keeps turning as it goes, slowing as it winds down, fast as it winds back up.)
    const keyT = t * (6 - down * 5 + rewind * 18);
    const idle = {
      x: 0, lift: br * 0.2 - curtsy * 1.6, tick: 0, head: br * 2 + curtsy * 14 + down * 30, ear: br * 4 + down * 20, armN: -twirl * 30 + down * 40, armF: down * 40 - curtsy * 30,
      parasol: -20 + twirl * Math.sin(t * 14) * 14, skirt: curtsy * 4, key: Math.sin(keyT) * 30,
    };
    // The wind-up walk: tiny stiff steps, ticking from side to side.
    const tk = Math.sin(p);
    const walk = { x: 0, lift: Math.abs(tk) * 0.8, tick: Math.sign(tk) * Math.pow(Math.abs(tk), 0.4) * 4, head: -tk * 3, ear: -tk * 8, armN: tk * 16, armF: -tk * 16, parasol: -16 + tk * 6, skirt: -tk * 3, key: Math.sin(t * 8) * 30 };
    // The jab: parasol drawn back over the shoulder, then thrust out like a rapier.
    const antic = { x: -2, lift: 0, tick: -6, head: -6, ear: -10, armN: 80, armF: 0, parasol: -70, skirt: 4, key: 0 };
    const strike = { x: 5, lift: 0.4, tick: 8, head: 6, ear: 12, armN: -40, armF: 20, parasol: 95, skirt: -6, key: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -14 - S.lift], rot: (S) => S.tick * D2R },
    { name: 'neck', parent: 'hip', at: () => [0.6, -7], rot: (S) => (S.head - S.tick * 0.5) * D2R },
    { name: 'hand', parent: 'armN', at: () => [4.6, 0.2] },
    ...pdPass(false),
    ...pdPass(true),
    { name: 'face', parent: 'neck', s: (a) => pdFace(moodOf(a, a.pdDown > 0.5 ? 'sleep' : a.pdRewind > 0.4 ? 'shout' : null)), pivot: [9, 14] },
  ],
});
export function dollStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const [hx, hy] = [0, -14];
  return {
    w: 34,
    h: 50,
    res: 3,
    shapes: shift([
      ...put(pdParasol(), [11, 24], hx + 2, hy - 2.6, -20), ...put(pdEar(true)(), [2.4, 11], hx - 1.4, hy - 19, -14), ...put(pdArm(true)(), [1, 2], hx + 2, hy - 6, 60),
      ...put(pdSkirt(), [10, 1], hx, hy - 1), ...put(pdBodice(), [5, 8], hx, hy), ...put(pdHead(), [9, 14], hx + 0.6, hy - 7), ...put(faceShapes(fm, PD_FACE), [9, 14], hx + 0.6, hy - 7),
      ...put(pdEar(false)(), [2.4, 11], hx + 2, hy - 20, 6), ...put(pdArm(false)(), [1, 2], hx - 1.4, hy - 6, 40),
    ], 17, 49),
  };
}

// =====================================================================================
// Ghost Maid
// =====================================================================================
const GHOST = ramp('#f2eaff', { step: 8, turn: 8, lift: 3 });
const DRESS = ramp('#5a4a7a', { step: 9, turn: 8, lift: 14 });
const gm = pairOf('gm');
// The ghost cat: a round head and body in one, narrowing to where the wisp tail starts, a maid's
// dress over the lower half with a white apron and collar. Box 22 x 24; its tail root at (11, 23).
const gmBody = () => [
  E(11, 9.6, 9.6, 8.8, GHOST.base),
  T([[3, 12], [19, 12], [15, 23], [7, 23]], GHOST.base),
  T([[3.4, 13], [18.6, 13], [16.4, 21], [11, 23.4], [5.6, 21]], DRESS.base),
  T([[8, 13.4], [15, 13.4], [14.6, 20], [11.6, 21.6], [8.4, 20]], '#ffffff'),
  ...[0, 1, 2, 3].map((k) => F(E(8.6 + k * 2, 20.2 + (k % 2) * 0.6, 1.2, 0.9, '#ffffff'))),
  T([[6, 12.4], [11, 15], [16, 12.4], [11, 11.4]], '#ffffff'), E(11, 13.6, 1, 1, '#ff8fb8'),
  crescent(11, 9.6, 9.6, 8.8, GHOST.sh, { k: 0.2, a0: 90, a1: 220 }),
  shine(11, 9, 9.6, 8.8, '#ffffff', 0, 0.8),
];
const gmEar = (far) => () => [T([[0.6, 6], [2.6, 0.6], [5.4, 6]], far ? GHOST.sh : GHOST.base), F(T([[1.8, 5.2], [2.8, 2.4], [4, 5.2]], '#ffc8d8'))];
const gmCap = () => [T([[1, 4], [3, 0.8], [11, 0.8], [13, 4]], '#ffffff'), ...[0, 1, 2, 3, 4].map((k) => E(2 + k * 2.5, 4, 1.4, 1.2, '#ffffff')), F(R(3, 2, 8, 1, '#ff8fb8'))];
const gmArm = (far) => () => [taper([[1, 2], [5, 2.2]], 3, 2.4, far ? GHOST.sh : GHOST.base), E(5.4, 2.2, 1.6, 1.5, far ? GHOST.sh : GHOST.base)];
// A segment of the wisp tail, round at the joints (the last one ends in a point). Box 13 x 8; its
// root at (3.4, 4), the next segment 5.6 along.
const GM_TW = [6, 4.6, 3, 0.8];
const gmTail = (k) => () => [E(3.4, 4, GM_TW[k] / 2, GM_TW[k] / 2, GHOST.base), taper([[3.4, 4], [9, 4]], GM_TW[k], GM_TW[k + 1], GHOST.base), ...(k < 2 ? [E(9, 4, GM_TW[k + 1] / 2, GM_TW[k + 1] / 2, GHOST.base)] : [])];
// The feather duster. Box 8 x 22; held at (4, 17).
const gmDuster = () => [taper([[4, 21], [4, 9]], 1.4, 1.2, '#8a6a5a'), E(4, 6, 4, 5.4, '#ffc8d8'), E(2.6, 4, 2.6, 3, '#ffffff'), E(5.8, 3.4, 2.4, 2.8, '#ff9fc0'), F(E(3, 3, 1, 0.8, '#ffffff'))];
const GM_BODY = gm('body', 22, 24, gmBody, 2);
const GM_EAR = [false, true].map((f) => gm(`ear${f ? 1 : 0}`, 6, 6, gmEar(f), 2));
const GM_CAP = gm('cap', 14, 5, gmCap, 2);
const GM_ARM = [false, true].map((f) => gm(`arm${f ? 1 : 0}`, 7, 4, gmArm(f), 2));
const GM_TAIL = [0, 1, 2].map((k) => gm(`tail${k}`, 13, 8, gmTail(k), 2));
const GM_DUSTER = gm('duster', 8, 22, gmDuster, 2);
const GM_FACE = { eyes: [[11.6, 8.4, 1.5, 2, -1], [15.4, 8, 1.2, 1.7, 1]], mouth: [13.8, 11.4, 1.6], blush: [[10, 10.6, 1.3], [16.6, 10.2, 0.9]], iris: '#6a8ad8', lid: 0 };
const gmFace = (mood) => sm(`gm|face|${mood}`, 22, 24, () => faceShapes(mood, GM_FACE));
const gmPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({ name: `tail${k}${tag}`, parent: k ? `tail${k - 1}${tag}` : 'float', s: GM_TAIL[k][i], pivot: [3.4, 4], at: k ? () => [5.6, 0] : () => [-1, -2], rot: (S, a) => ((k ? 48 : 118) + Math.sin(a.t * 3 - k * 0.9) * 12 + S.tail * (k + 1) * 0.5) * D2R })),
    { name: `earF${tag}`, parent: 'float', s: GM_EAR[1][i], pivot: [3, 5.6], at: () => [-5, -19], rot: (S) => (-14 + S.ear) * D2R },
    { name: `armF${tag}`, parent: 'float', s: GM_ARM[1][i], pivot: [1, 2], at: () => [2, -9], rot: (S) => (60 + S.armF) * D2R },
    { name: `body${tag}`, parent: 'float', s: GM_BODY[i], pivot: [11, 23] },
    { name: `earN${tag}`, parent: 'float', s: GM_EAR[0][i], pivot: [3, 5.6], at: () => [3.4, -20], rot: (S) => (10 + S.ear) * D2R },
    { name: `cap${tag}`, parent: 'float', s: GM_CAP[i], pivot: [7, 4], at: () => [0, -19], rot: (S) => S.cap * D2R },
    { name: `duster${tag}`, parent: 'hand', s: GM_DUSTER[i], pivot: [4, 17], rot: (S) => (S.duster - (50 + S.armN)) * D2R },
    { name: `armN${tag}`, parent: 'float', s: GM_ARM[0][i], pivot: [1, 2], at: () => [-1, -8], rot: (S) => (50 + S.armN) * D2R },
  ];
};
export const maidRig = makeRig({
  w: 30,
  h: 40,
  soft: true,
  stride: 26,
  recover: 0.55,
  springs: { x: [220, 18], bob: [80, 8], lean: [120, 10], tail: [60, 6], ear: [120, 7], cap: [90, 6], armN: [150, 10], armF: [140, 10], duster: [140, 9] },
  fast: ['x', 'armN', 'duster', 'lean'],
  kick: { lean: -260, ear: 500, cap: 400, tail: 300 },
  turnKick: { tail: 300, ear: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 1.17;
    const t = a.t + a.uidOff;
    const lu = t % 10;
    const dusting = hold(lu, 1, 1.4, 3.6, 4);
    const sneeze = hold(lu, 4.3, 4.6, 4.8, 5.4);
    const tidy = hold(lu, 7, 7.3, 8, 8.4);
    const still = 1 - a.walkW;
    a.gmDust = dusting * still;
    a.gmSneeze = sneeze * still;
    const br = Math.sin(t * 2.2);
    const wig = Math.sin(t * 16);
    const idle = {
      x: 0, bob: br * 2, lean: -sneeze * 14 + (lu > 4.6 && lu < 5 ? 18 : 0), tail: br * 6, ear: br * 4 - sneeze * 20, cap: tidy * Math.sin(t * 10) * 10 + sneeze * 10,
      armN: dusting * (-100 + wig * 15), armF: -tidy * 120, duster: 60 - dusting * 15 + dusting * wig * 25,
    };
    const walk = { x: 0, bob: Math.sin(t * 3) * 1.4, lean: 10, tail: -12, ear: -8, cap: -4, armN: 10, armF: -10, duster: 70 };
    // The swat: duster raised high, then down hard.
    const antic = { x: -2, bob: 1, lean: -10, tail: 10, ear: -16, cap: 0, armN: -130, armF: -20, duster: -20 };
    const strike = { x: 5, bob: 0, lean: 14, tail: -16, ear: 20, cap: 6, armN: 20, armF: 10, duster: 110 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'float', parent: null, at: (S) => [S.x, -14 - S.bob], rot: (S) => S.lean * D2R },
    { name: 'hand', parent: 'armN', at: () => [4.4, 0.2] },
    ...gmPass(false),
    ...gmPass(true),
    { name: 'face', parent: 'float', s: (a) => gmFace(moodOf(a, a.gmSneeze > 0.5 ? 'sleep' : a.gmDust > 0.5 ? 'happy' : null)), pivot: [11, 23] },
  ],
  fx(ctx, m, a, S, mat) {
    // Dust puffing off the duster, and feathers flying off it in a swat.
    if (a.gmDust > 0.3 || a.ph.since >= 0) inPart(ctx, mat, 'duster', () => {
      for (let k = 0; k < 3; k++) {
        const u = fr(a.t * 2.4 + k / 3);
        dot(ctx, a, Math.sin(u * 7 + k) * 5, -12 - u * 8, 1.2 + u * 2.4, (1 - u) * 0.6 * Math.max(a.gmDust, a.ph.strike));
      }
    });
    if (a.gmSneeze > 0.6) dot(ctx, a, 14, -24, 4, 0.5);
  },
});
export function maidStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return {
    w: 34,
    h: 44,
    res: 3,
    shapes: shift([
      ...put(gmTail(0)(), [3.4, 4], -1, -16, 118), ...put(gmEar(true)(), [3, 5.6], -5, -33, -14), ...put(gmArm(true)(), [1, 2], 2, -23, 60), ...put(gmBody(), [11, 23], 0, -14),
      ...put(gmEar(false)(), [3, 5.6], 3.4, -34, 10), ...put(gmCap(), [7, 4], 0, -33), ...put(faceShapes(fm, GM_FACE), [11, 23], 0, -14), ...put(gmDuster(), [4, 17], 1.8, -18.6, 60), ...put(gmArm(false)(), [1, 2], -1, -22, 50),
    ], 18, 42),
  };
}

// =====================================================================================
// Tea Party Hatter
// =====================================================================================
const POT = ramp('#c8e2ff', { step: 8, turn: 8, lift: 3 });
const HAT = ramp('#4a3a5e', { step: 9, turn: 8, lift: 16 });
const th = pairOf('th');
// The saucer it rides. Box 26 x 5; its middle on the ground at (13, 4.6).
const thSaucer = () => [E(13, 2.6, 12.4, 2.2, '#f8f4ff'), F(E(13, 2, 9, 1, '#ffffff')), F(E(13, 3.6, 10, 0.8, '#d8d0e8'))];
// The pot: round, porcelain blue with pink flowers, a spout out in front, a handle behind. Box 30 x
// 21; it sits on the saucer at (14, 20).
const thPot = () => [
  ...stroke(arcP(5, 10, 4.4, 5, 100, 260, 10), 2.2, POT.sh),
  taper([[20, 13], [24, 10], [27, 5], [29, 3.4]], 4, 2.2, POT.base),
  E(14, 11.6, 10.4, 8.6, POT.base),
  R(8, 18.6, 12, 2, POT.sh),
  ...[[9, 8], [17, 14], [12, 15], [19, 8]].flatMap(([x, y]) => [...[0, 1, 2, 3, 4].map((k) => F(E(x + Math.cos(k * 72 * D2R) * 1, y + Math.sin(k * 72 * D2R) * 1, 0.8, 0.8, '#ffb3c8'))), F(E(x, y, 0.5, 0.5, '#ffe36b'))]),
  crescent(14, 11.6, 10.4, 8.6, POT.sh, { k: 0.2, a0: 30, a1: 170 }),
  shine(14, 11, 10.4, 8.6, '#ffffff', 0, 0.8),
];
// The top hat on its lid, a pink band and a little card in it. Box 16 x 16; it sits at (8, 15).
const thHat = () => [
  E(8, 14.6, 7.4, 1.8, HAT.base),
  R(3, 3, 10, 11.6, HAT.base), F(R(4, 3, 2.4, 11, HAT.hi)),
  E(8, 3, 5, 1.4, HAT.base),
  R(3, 10.6, 10, 2.4, '#ff8fb8'),
  T([[11, 6], [15, 4.6], [15.6, 9], [11.6, 10]], '#fff6e0'),
];
const TH_SAUCER = th('saucer', 26, 5, thSaucer, 2);
const TH_POT = th('pot', 30, 21, thPot, 2);
const TH_HAT = th('hat', 16, 16, thHat, 2);
const TH_FACE = { eyes: [[14.4, 10, 1.5, 2, -1], [18.2, 9.6, 1.2, 1.7, 1]], mouth: [16.6, 13.6, 1.8], blush: [[12.8, 12.4, 1.4], [19.4, 12, 1]], iris: '#4a7ab8', lid: 0 };
const thFace = (mood) => sm(`th|face|${mood}`, 30, 21, () => faceShapes(mood, TH_FACE));
const thPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `saucer${tag}`, parent: null, s: TH_SAUCER[i], pivot: [13, 4.6], at: (S) => [S.x, 0] },
    { name: `pot${tag}`, parent: 'base', s: TH_POT[i], pivot: [14, 20] },
    { name: `hat${tag}`, parent: 'base', s: TH_HAT[i], pivot: [8, 15], at: (S) => [-0.6, -17.4 - S.hatUp], rot: (S) => (S.hat + S.hatLag) * D2R },
  ];
};
export const teapotRig = makeRig({
  w: 36,
  h: 42,
  soft: true,
  stride: 22,
  recover: 0.65,
  springs: { x: [220, 18], lift: [180, 13], rock: [150, 11], hat: [100, 7], hatUp: [160, 10] },
  fast: ['x', 'rock'],
  kick: { rock: -200, hat: 400, hatUp: 60 },
  turnKick: { rock: 120, hat: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.21;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'th', 22);
    const p = u * TAU;
    const lu = t % 11;
    const tip = hold(lu, 1.4, 1.8, 2.8, 3.2);
    const pop = hold(lu, 5.6, 5.7, 6.2, 6.8);
    const hum = hold(lu, 8, 8.4, 9.6, 10);
    const still = 1 - a.walkW;
    a.thPop = pop * still;
    a.thHum = hum * still;
    const br = Math.sin(t * 1.8);
    const idle = { x: 0, lift: 1.4 + br * 0.4, rock: hum * Math.sin(t * 4) * 5, hat: -tip * 22 + hum * Math.sin(t * 4 + 0.6) * 6, hatUp: tip * 4 + pop * 7 };
    // The glide: riding the saucer, rocking gently, the hat a beat behind.
    const walk = { x: 0, lift: 1.4 + Math.abs(Math.sin(p)) * 0.6, rock: Math.sin(p) * 5 + 4, hat: -Math.sin(p - 0.8) * 6, hatUp: 0 };
    // The pour: rocked back, then tipped right over, tea splashing out of the spout.
    const antic = { x: -1, lift: 1.4, rock: -18, hat: 10, hatUp: 1 };
    const strike = { x: 3, lift: 2.4, rock: 46, hat: -20, hatUp: 2 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ hatLag: -S.rock * 0.5 }),
  parts: [
    // (It rocks on the saucer about its round bottom.)
    { name: 'base', parent: null, at: (S) => [S.x, -S.lift], rot: (S) => S.rock * D2R },
    ...thPass(false),
    ...thPass(true),
    { name: 'face', parent: 'base', s: (a) => thFace(moodOf(a, a.thHum > 0.5 ? 'happy' : a.thPop > 0.5 ? 'shout' : null)), pivot: [14, 20] },
  ],
  fx(ctx, m, a, S, mat) {
    inPart(ctx, mat, 'base', () => {
      // Steam curling from the spout, and a whoosh of it from under the hat when the lid pops.
      for (let k = 0; k < 3; k++) {
        const u = fr(a.t * 0.7 + k / 3);
        puff(ctx, a, 15 + u * 3 + Math.sin(u * 5 + k) * 2, -18 - u * 13, 2 + u * 3.4, Math.sin(u * Math.PI) * 0.5);
      }
      if (a.thPop > 0.05) for (let k = 0; k < 5; k++) {
        const ang = (-160 + k * 35) * D2R;
        const d = 4 + a.thPop * 8;
        puff(ctx, a, -0.6 + Math.cos(ang) * d, -19 + Math.sin(ang) * d * 0.5, 2 + a.thPop * 2.6, a.thPop * 0.7);
      }
    });
    // The tea it pours: a splash on the floor where the spout points, drops leaping out of it.
    if (a.ph.strike > 0.05) {
      const c = Math.cos(S.rock * D2R);
      const s = Math.sin(S.rock * D2R);
      const sx = S.x + 15 * c + 16.6 * s + 3;
      const k0 = a.ph.strike;
      ctx.globalAlpha = a.alpha * k0 * 0.85;
      ctx.fillStyle = '#c8864a';
      ctx.beginPath();
      ctx.ellipse(sx, -0.6, 3 + k0 * 5, 1.2 + k0 * 0.6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#e8b47a';
      ctx.beginPath();
      ctx.ellipse(sx - 1, -0.9, 1.6 + k0 * 2, 0.5, 0, 0, TAU);
      ctx.fill();
      for (let k = 0; k < 6; k++) {
        const q = fr(a.t * 2.6 + k / 6);
        const side = (k - 2.5) / 2.5;
        dot(ctx, a, sx + side * q * 9, -Math.sin(q * Math.PI) * (5 + (k % 3) * 2.4), 1.1 * (1 - q * 0.6), k0 * (1 - q * 0.5), k % 2 ? '#c8864a' : '#e8b47a');
      }
    }
    if (a.thHum > 0.5) {
      const u = fr(a.t * 0.7);
      ctx.globalAlpha = a.alpha * (1 - u) * a.thHum;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('♪', 8 + u * 6, -34 - u * 10);
    }
  },
});
export function teapotStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 34, h: 42, res: 3, shapes: shift([...put(thSaucer(), [13, 4.6], 0, 0), ...put(thPot(), [14, 20], 0, -1.4), ...put(faceShapes(fm, TH_FACE), [14, 20], 0, -1.4), ...put(thHat(), [8, 15], -0.6, -18.8)], 16, 41) };
}

// =====================================================================================
// Pumpkin Butler (added 2026-11-18): Lady Marigold's staff, who cut in on the dance
// =====================================================================================
// A round pumpkin for a head (painted face, a curly stem and a leaf), a black tailcoat with tails
// that swing from the back of the waist, an orange bow tie, white gloves, short stubby legs. He
// carries a silver tray with a cloche. Waltzes along; bows; lifts the cloche to offer a cupcake;
// polishes the tray. Bonks with the tray.
const PUMP = ramp('#ff9a3a', { step: 9, turn: 8 });
const COAT = ramp('#3a3048', { step: 8, turn: 8, lift: 14 });
const SILVER = ramp('#dfe6f2', { step: 8, turn: 8, lift: 3 });
const GOLDB = ramp('#ffd36b', { step: 10, turn: 8 });
const pb = pairOf('pb');
// The pumpkin. Box 30 x 24; the neck at (15, 23).
const pbHead = () => [
  E(8.6, 13.4, 7.4, 8.6, PUMP.base), E(21.4, 13.4, 7.4, 8.6, PUMP.base), E(15, 13, 9.4, 9.6, PUMP.base),
  F(taper([[11, 5.6], [10, 13], [11, 21]], 0.7, 0.7, PUMP.sh)), F(taper([[19, 5.6], [20, 13], [19, 21]], 0.7, 0.7, PUMP.sh)),
  crescent(15, 13, 13.6, 9.4, PUMP.sh, { k: 0.18, a0: 100, a1: 220 }),
  shine(15, 12, 13.6, 9.4, '#ffffff', 0, 0.6),
  taper([[15, 5], [16.4, 0.8]], 2.4, 1.8, '#8a5a3a'),
  T([[16.4, 2.4], [23, 0.6], [25.4, 3.6], [20, 5.4]], '#7cc46a'), F(taper([[17, 3], [23.4, 2]], 0.5, 0.3, '#5a9a4a')),
  ...stroke([[14.6, 3], [12.4, 1.4], [10.6, 2.4], [11.4, 4]], 0.7, '#7cc46a'),
];
// The coat: round, a white shirt front, an orange bow tie, gold buttons. Box 24 x 22; the hip at (12, 21).
const pbCoat = () => [
  E(12, 11, 10.6, 10, COAT.base),
  F(T([[12, 2], [17.4, 3.4], [14, 18], [10, 18], [6.6, 3.4]], '#ffffff')),
  F(T([[12, 4.4], [8.4, 2.4], [8.4, 6.4]], PUMP.base)), F(T([[12, 4.4], [15.6, 2.4], [15.6, 6.4]], PUMP.base)), F(E(12, 4.4, 1.2, 1.2, PUMP.sh)),
  F(E(12, 10, 0.8, 0.8, GOLDB.base)), F(E(12, 13.6, 0.8, 0.8, GOLDB.base)),
  crescent(12, 11, 10.6, 10, COAT.sh, { k: 0.2, a0: 100, a1: 220 }),
];
// The coat tails, from the back of the waist. Box 12 x 16; hung at (9, 1).
const pbTails = () => [T([[9, 0.6], [11, 1], [10, 9.6], [8.4, 13], [7, 10.4], [5.4, 13], [4, 9], [5.6, 2]], COAT.base), F(taper([[7.4, 3], [6.8, 10]], 0.6, 0.4, COAT.hi))];
// A stubby leg in black trousers. Box 8 x 10; the hip at (4, 1), the ankle 7 below.
const pbLeg = (far) => () => [taper([[4, 1], [4, 8]], 6.4, 5.6, far ? COAT.sh : '#4a4058')];
const pbShoe = (far) => () => [E(3.6, 2, 3.4, 1.8, far ? '#1e1a26' : '#2a2434'), F(E(4.6, 1.4, 1, 0.5, '#6a6080'))];
// An arm: black sleeve, white glove. Box 16 x 8; the shoulder at (3, 4), the hand 10 along.
const pbArm = (far) => () => [taper([[3, 4], [10, 4]], 4.6, 4, far ? COAT.sh : COAT.base), E(12, 4, 3, 2.8, far ? '#e8e4f0' : '#ffffff'), F(R(9, 1.6, 1.2, 4.8, '#ffffff'))];
// The tray, and its cloche (which lifts). Tray box 28 x 6, held at (14, 4.6); cloche box 18 x 12, sits at (9, 11).
const pbTray = () => [E(14, 3, 13, 2.2, SILVER.base), F(E(14, 2.4, 11, 1.2, '#ffffff')), F(E(14, 4.2, 12, 0.7, SILVER.sh))];
const pbCloche = () => [E(9, 10, 8.4, 1.4, SILVER.base), T(arcP(9, 10, 7.6, 8, 180, 360, 14), SILVER.base), E(9, 2.2, 1.4, 1.2, GOLDB.base), shine(9, 7, 7.6, 7, '#ffffff', 0, 0.6), F(taper([[4, 7], [5.4, 3.4]], 0.7, 0.4, '#ffffff'))];
const pbCake = () => [T([[3.6, 9.8], [10.4, 9.8], [9.4, 6], [4.6, 6]], '#ffb3c8'), E(7, 5.4, 3.4, 2, '#fff8ec'), E(7, 3.4, 1.2, 1.2, '#ff4a6a')];
const PB_HEAD = pb('head', 30, 24, pbHead);
const PB_COAT = pb('coat', 24, 22, pbCoat);
const PB_TAILS = pb('tails', 12, 16, pbTails);
const PB_LEG = [false, true].map((f) => pb(`leg${f ? 1 : 0}`, 8, 10, pbLeg(f)));
const PB_SHOE = [false, true].map((f) => pb(`shoe${f ? 1 : 0}`, 8, 4, pbShoe(f)));
const PB_ARM = [false, true].map((f) => pb(`arm${f ? 1 : 0}`, 16, 8, pbArm(f)));
const PB_TRAY = pb('tray', 28, 6, pbTray);
const PB_CLOCHE = pb('cloche', 18, 12, pbCloche);
const PB_CAKE = pb('cake', 14, 11, pbCake);
const PB_FACE = { eyes: [[16.8, 13, 1.8, 2.4, -1], [22.2, 12.6, 1.5, 2.1, 1]], mouth: [19.6, 17.6, 2], blush: [[14.6, 15.8, 1.6], [24, 15.2, 1.2]], iris: '#6a4a2a', lid: 0, k: 1.3 };
const pbFace = (mood) => sm(`pb|face|${mood}`, 30, 24, () => faceShapes(mood, PB_FACE));
const pbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (near) => ({ name: `leg${near ? 'N' : 'F'}${tag}`, parent: 'hip', s: PB_LEG[near ? 0 : 1][i], pivot: [4, 1], at: () => [near ? 3 : -3, 0], rot: (S) => (near ? S.legN : S.legF) * D2R });
  const shoe = (near) => ({ name: `shoe${near ? 'N' : 'F'}${tag}`, parent: `leg${near ? 'N' : 'F'}${tag}`, s: PB_SHOE[near ? 0 : 1][i], pivot: [2.6, 1.2], at: () => [0, 7.4], rot: (S) => (-(near ? S.legN : S.legF) - S.lean) * D2R });
  return [
    { name: `tails${tag}`, parent: 'hip', s: PB_TAILS[i], pivot: [9, 1], at: () => [-6, -3], rot: (S) => clamp(S.tails, -10, 50) * D2R },
    { name: `armF${tag}`, parent: 'hip', s: PB_ARM[1][i], pivot: [3, 4], at: () => [-4, -15], rot: (S) => (120 + S.armF) * D2R },
    leg(false), shoe(false), leg(true), shoe(true),
    { name: `coat${tag}`, parent: 'hip', s: PB_COAT[i], pivot: [12, 21], at: () => [0, 1] },
    { name: `head${tag}`, parent: 'neck', s: PB_HEAD[i], pivot: [15, 23] },
    { name: `tray${tag}`, parent: 'hand', s: PB_TRAY[i], pivot: [14, 4.6], at: () => [2, -1], rot: (S) => (S.tray - (S.armN - 30) - S.lean) * D2R },
    { name: `cake${tag}`, parent: `tray${tag}`, s: PB_CAKE[i], pivot: [7, 10.4], at: () => [3, -1.6], alpha: (a) => a.pbOffer ?? 0 },
    { name: `cloche${tag}`, parent: `tray${tag}`, s: PB_CLOCHE[i], pivot: [9, 11], at: (S) => [3, -1.4 - S.lid], rot: (S) => -S.lid * 2 * D2R },
    { name: `armN${tag}`, parent: 'hip', s: PB_ARM[0][i], pivot: [3, 4], at: () => [4, -14], rot: (S) => (S.armN - 30) * D2R },
  ];
};
export const butlerRig = makeRig({
  w: 40,
  h: 56,
  soft: true,
  stride: 12,
  recover: 0.6,
  springs: { x: [240, 20], lift: [200, 15], lean: [160, 12], head: [140, 10], legN: [200, 15], legF: [200, 15], armN: [160, 12], armF: [140, 11], tray: [160, 12], lid: [140, 11], tails: [60, 6] },
  fast: ['x', 'armN', 'tray', 'legN', 'legF'],
  kick: { lean: -200, head: -260, tails: 300, lid: 6 },
  turnKick: { tails: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.97;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'pb', 12);
    const p = u * TAU;
    const lu = t % 12;
    const bow = hold(lu, 1, 1.5, 2.4, 2.9);
    const offer = hold(lu, 5, 5.5, 7.4, 7.9);
    const polish = hold(lu, 9, 9.3, 10.6, 11);
    const still = 1 - a.walkW;
    a.pbOffer = offer * still;
    a.pbPolish = polish * still;
    const br = Math.sin(t * 1.8);
    const idle = {
      x: 0, lift: br * 0.3 - bow * 1, lean: bow * 22, head: bow * 10 + offer * -6, legN: 0, legF: 0,
      armN: 70 - offer * 30 + polish * Math.sin(t * 12) * 6, armF: bow * -20, tray: polish * Math.sin(t * 10) * 6, lid: offer * 9,
    };
    // A waltz walk: little gliding steps, a dip in each.
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 1.2, lean: 6, head: Math.sin(p) * 3, legN: Math.sin(p) * 22, legF: -Math.sin(p) * 22, armN: 70, armF: 0, tray: Math.sin(p) * 4, lid: 0 };
    // The bonk: the tray swung up overhead, then down.
    const antic = { x: -2, lift: 0, lean: -10, head: -6, legN: 8, legF: -6, armN: -130, armF: 0, tray: -60, lid: 0 };
    const strike = { x: 5, lift: 0.6, lean: 16, head: 6, legN: 18, legF: -14, armN: 20, armF: 0, tray: 70, lid: 3 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ tails: 4 - S.lean * 0.9 + a.walkW * 16 }),
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -10.4 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'hip', at: () => [1, -19], rot: (S) => S.head * D2R },
    { name: 'hand', parent: 'armN', at: () => [10, 0] },
    ...pbPass(false),
    ...pbPass(true),
    { name: 'face', parent: 'neck', s: (a) => pbFace(moodOf(a, a.pbOffer > 0.5 ? 'happy' : null)), pivot: [15, 23] },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.pbPolish > 0.4) inPart(ctx, mat, 'tray', () => sparkle(ctx, a, 6, -2, 2.6 + Math.sin(a.now * 9), a.pbPolish));
  },
});
export function butlerStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const hy = -10.4;
  return {
    w: 40,
    h: 52,
    res: 3,
    shapes: shift([
      ...put(pbTails(), [9, 1], -6, hy - 3, 4), ...put(pbArm(true)(), [3, 4], -4, hy - 15, 120),
      ...put(pbLeg(true)(), [4, 1], -3, hy), ...put(pbShoe(true)(), [2.6, 1.2], -3, hy + 7.4), ...put(pbLeg(false)(), [4, 1], 3, hy), ...put(pbShoe(false)(), [2.6, 1.2], 3, hy + 7.4),
      ...put(pbCoat(), [12, 21], 0, hy + 1), ...put(pbHead(), [15, 23], 1, hy - 19), ...put(faceShapes(fm, PB_FACE), [15, 23], 1, hy - 19),
      ...put(pbTray(), [14, 4.6], 13.7, hy - 8.6), ...put(pbCloche(), [9, 11], 16.7, hy - 10), ...put(pbArm(false)(), [3, 4], 4, hy - 14, 40),
    ], 20, 50),
  };
}
