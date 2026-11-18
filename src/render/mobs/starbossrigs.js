// The Star Observatory's keepers, remade for Chapter 7 (2026-11-18): upright, chibi, rigged on
// rig.js, outer outline only, faces bare, everything that grows out of them rooted in them.
//
//   folio        Folio, the Archivist: a grand snowy owl in a long scholar's robe and half-moon
//                spectacles, reading an enormous book; she shushes, turns pages; slams the book
//                shut on you (the owl librarians are her students: world/observatory.js).
//   eclipsesol   Sol, the Eclipse Twin: a little sun fox standing tall, a ring of sunrays rooted
//                behind her head, a sun disc in her paws; bright and bouncy. A sun-disc swipe.
//   eclipseluna  Luna, the Eclipse Twin: a moon bunny, a crescent moon held like a shield, a starry
//                veil; dreamy and slow. A crescent swipe. Alone (her sister down), each one droops.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, sparkle, puff } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const STARC = '#fff3a6';
const star5 = (x, y, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
// A boss drawn a size up, evenly (nothing stretched), about her feet.
const sized = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};

// =====================================================================================
// Folio, the Archivist
// =====================================================================================
const SNOW = ramp('#f4f0ff', { step: 7, turn: 10, lift: 3 });
const ROBE = ramp('#4a3a8a', { step: 10, turn: 8, lift: 14 });
const BOOK = ramp('#a84a5a', { step: 10, turn: 8 });
const fo = pairOf('fo');
// The robe: long, to the floor, gold trim, a starry hem. Box 40 x 40; the waist at (20, 1).
const foRobe = () => {
  const hem = [];
  for (let k = 0; k <= 8; k++) hem.push([1 + k * 4.75, 38 + (k % 2 ? 1.4 : 0)]);
  return [T([[11, 1], [29, 1], [37, 22], [39, 38], ...hem.reverse(), [1, 38], [3, 22]], ROBE.base), F(T([[11, 1], [15, 1], [6, 38], [2, 38]], ROBE.hi)), R(1, 34, 38, 2, GOLD.base), ...[8, 20, 32].map((x) => F(star5(x, 28, 1.6, STARC))), crescent(20, 20, 18, 18, ROBE.sh, { k: 0.2, a0: 10, a1: 90 })];
};
// The body: a big round snowy owl chest above the robe. Box 30 x 26; the waist at (15, 25).
const foBody = () => [E(15, 13, 14, 12.4, SNOW.base), ...[0, 1, 2, 3].map((k) => F(T([[9 + (k % 2) * 6, 9 + k * 3], [10.4 + (k % 2) * 6, 11 + k * 3], [8 + (k % 2) * 6, 11 + k * 3]], '#c8c0e0'))), crescent(15, 13, 14, 12.4, SNOW.sh, { k: 0.2, a0: 110, a1: 210 }), T([[3, 18], [8, 10], [10, 25], [3, 25]], ROBE.base), T([[27, 18], [22, 10], [20, 25], [27, 25]], ROBE.base)];
// The head: round, two soft ear tufts, a beak, half-moon spectacles on a chain. Box 30 x 26; the neck at (15, 25).
const foHead = () => [
  // Feathery ear tufts, each two soft points.
  T([[4, 8], [2.4, 1], [5.6, 4], [7, 0.6], [9.6, 5]], '#d8d0f0'), T([[26, 8], [27.6, 1], [24.4, 4], [23, 0.6], [20.4, 5]], '#d8d0f0'),
  E(15, 14, 13, 11.4, SNOW.base), crescent(15, 14, 13, 11.4, SNOW.sh, { k: 0.18, a0: 110, a1: 200 }),
  // The owl's face: a heart-shaped disc with a soft rim, a big hooked beak.
  T([[15, 21.6], [6, 17], [4.4, 11], [8, 7.6], [15, 10], [22, 7.6], [25.6, 11], [24, 17]], '#d8d0f0'),
  T([[15, 20.4], [7, 16.4], [5.8, 11.4], [8.6, 9], [15, 11.4], [21.4, 9], [24.2, 11.4], [23, 16.4]], '#ffffff'),
  T([[13.2, 15.6], [16.8, 15.6], [16, 19.6], [15, 21], [14, 19.6]], '#ffb03a'), F(T([[13.6, 15.8], [15, 15.8], [14.4, 18.4]], '#ffd38a')),
  // Half-moon spectacles, on a chain.
  ...stroke(arcP(10.4, 14.6, 4.6, 3.6, 0, 180, 8), 1.1, GOLD.base), ...stroke(arcP(19.6, 14.6, 4.6, 3.6, 0, 180, 8), 1.1, GOLD.base), ...stroke([[5.8, 14.6], [15, 14], [24.2, 14.6]], 0.8, GOLD.base),
  ...stroke([[5.8, 14.6], [4, 20], [6, 24]], 0.5, GOLD.sh),
];
const foWing = (far) => () => [T([[1, 1], [11, 2], [14, 9], [8, 13], [1, 8]], far ? ROBE.sh : ROBE.base), F(taper([[3, 4], [11, 8]], 0.8, 0.4, SNOW.base)), E(13, 10, 2.4, 2.2, far ? SNOW.sh : SNOW.base)];
// The great book, open: two pages fanned up, its spine down; or shut (closed). Box 34 x 22; held at its spine (17, 20).
const foBook = (shut) => () => (shut
  ? [R(3, 6, 28, 14, BOOK.base), F(R(3, 6, 28, 2, BOOK.hi)), R(3, 6, 3, 14, BOOK.sh), R(5, 17, 26, 2.4, '#fff4e0'), F(star5(18, 13, 3, GOLD.base))]
  : [T([[17, 20], [1, 14], [3, 3], [17, 9]], '#fff4e0'), T([[17, 20], [33, 14], [31, 3], [17, 9]], '#fff8ec'), T([[17, 21], [0, 15], [1, 13], [17, 19]], BOOK.base), T([[17, 21], [34, 15], [33, 13], [17, 19]], BOOK.base), ...[5, 8, 11].map((y) => F(taper([[5, y + 2], [14, y + 4]], 0.3, 0.3, '#c8b8a8'))), ...[5, 8, 11].map((y) => F(taper([[20, y + 4], [29, y + 2]], 0.3, 0.3, '#c8b8a8'))), F(star5(24, 6, 1.6, '#a8a0e0'))]);
const FO_ROBE = fo('robe', 40, 40, foRobe, 2);
const FO_BODY = fo('body', 30, 26, foBody, 2);
const FO_HEAD = fo('head', 30, 26, foHead, 2);
const FO_WING = [false, true].map((f) => fo(`wing${f ? 1 : 0}`, 15, 14, foWing(f), 2));
const FO_BOOK = [false, true].map((sh) => fo(`book${sh ? 1 : 0}`, 34, 22, foBook(sh), 2));
const FO_FACE = { eyes: [[19.6, 12.6, 2.3, 2.6, 1], [10.4, 12.6, 2.3, 2.6, -1]], mouth: [15, 23.4, 0.6], blush: [[7.4, 17.4, 1.6], [22.6, 17.4, 1.6]], iris: '#e8a030', lid: 0.3, lashes: 1 };
const foFace = (mood) => sm(`fo|face|${mood}`, 30, 26, () => faceShapes(mood, FO_FACE));
const foPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `wingF${tag}`, parent: 'chest', s: FO_WING[1][i], pivot: [1, 1], at: () => [-12, -18], rot: (S) => S.wingF * D2R },
    { name: `robe${tag}`, parent: 'waist', s: FO_ROBE[i], pivot: [20, 1], rot: (S) => S.robe * D2R },
    { name: `bodyp${tag}`, parent: 'chest', s: FO_BODY[i], pivot: [15, 25] },
    { name: `head${tag}`, parent: 'nk', s: FO_HEAD[i], pivot: [15, 25] },
    { name: `book${tag}`, parent: 'chest', s: (a) => FO_BOOK[a.foShut ? 1 : 0][i](), pivot: [17, 20], at: (S) => [10 + S.bookX, -6 - S.bookY], rot: (S) => S.book * D2R },
    { name: `wingN${tag}`, parent: 'chest', s: FO_WING[0][i], pivot: [1, 1], at: () => [8, -17], rot: (S) => S.wingN * D2R },
  ];
};
export const folioRig = sized(makeRig({
  w: 90, h: 110, soft: true, stride: 30, recover: 0.65,
  springs: { x: [220, 16], lift: [200, 14], tilt: [160, 10], head: [130, 8], robe: [100, 7], wingN: [200, 12], wingF: [180, 11], book: [220, 14], bookX: [220, 14], bookY: [220, 14] },
  fast: ['x', 'book', 'bookY', 'wingN'],
  kick: { tilt: -140, head: -200, robe: 260 },
  turnKick: { robe: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const lu = t % 10;
    const shush = hold(lu, 4, 4.4, 5.4, 5.8);
    const turnp = hold(lu, 7.4, 7.6, 8, 8.2);
    const br = Math.sin(t * 1.4);
    a.foShut = a.ph.strike > 0.15 || (a.ph.antic > 0.6);
    a.foShush = shush;
    const idle = { x: 0, lift: br * 0.6, tilt: br * 1.4 + shush * 6, head: -br * 2 - 6 + shush * 8, robe: br * 2, wingN: 30 - shush * 110 + turnp * 30, wingF: 40 + turnp * 20, book: -6 + turnp * 6, bookX: 0, bookY: 0 };
    const s1 = Math.sin(t * 4);
    const walk = { x: 0, lift: Math.abs(s1) * 1, tilt: 6, head: -8, robe: -6, wingN: 34, wingF: 46, book: -10, bookX: 0, bookY: 0 };
    // The slam: the book up over her head, then shut and down on you.
    const antic = { x: -3, lift: 2, tilt: -12, head: -14, robe: 8, wingN: -120, wingF: -100, book: -30, bookX: -6, bookY: 28 };
    const strike = { x: 6, lift: 0, tilt: 16, head: 12, robe: -10, wingN: 60, wingF: 50, book: 70, bookX: 18, bookY: -6 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'waist', parent: null, at: (S) => [S.x, -40 - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'waist', at: () => [0, 1], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [1, -22], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    ...foPass(false),
    ...foPass(true),
    { name: 'face', parent: 'nk', s: (a) => foFace(moodOf(a, a.foShush > 0.5 ? 'sleep' : null)), pivot: [15, 25] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Loose pages drifting off the open book; a puff when it slams.
    if (!a.foShut) {
      for (let k = 0; k < 2; k++) {
        const u = fr(a.now * 0.3 + k / 2 + (m.uid % 7) * 0.1);
        const [px, py] = at2(mat('book'), -6 + k * 12, -16);
        // (Solid paper with ink lines, fading only at the very ends: a half-faded plain cream
        // square read as a grey block, 2026-11-18.)
        ctx.globalAlpha = a.alpha * Math.min(1, Math.sin(u * Math.PI) * 4);
        ctx.save();
        ctx.translate(px + Math.sin(u * 6 + k) * 6, py - u * 30);
        ctx.rotate(Math.sin(u * 8 + k) * 0.8);
        ctx.fillStyle = '#d8c8b0';
        ctx.fillRect(-3.2, -3.9, 6.4, 7.8);
        ctx.fillStyle = '#fffaf0';
        ctx.fillRect(-2.8, -3.5, 5.6, 7);
        ctx.fillStyle = '#9a8ab8';
        for (let l = 0; l < 3; l++) ctx.fillRect(-1.9, -2 + l * 1.9, l === 2 ? 2.4 : 3.8, 0.6);
        ctx.restore();
      }
    } else if (a.ph.strike > 0.3) {
      const [bx, by] = at2(mat('book'), 0, -4);
      puff(ctx, a, bx + 6, by + 6, 8 * a.ph.strike, a.alpha * a.ph.strike * 0.6);
    }
  },
}), 1.25);
export function folioStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const wy = -40;
  const cy = wy + 1;
  return { w: 90, h: 110, res: 2, shapes: shift([
    ...put(foWing(true)(), [1, 1], -12, cy - 18, 40), ...put(foRobe(), [20, 1], 0, wy), ...put(foBody(), [15, 25], 0, cy), ...put(foHead(), [15, 25], 1, cy - 22), ...put(faceShapes(fm, FO_FACE), [15, 25], 1, cy - 22),
    ...put(foBook(false)(), [17, 20], 10, cy - 6, -6), ...put(foWing(false)(), [1, 1], 8, cy - 17, 30),
  ], 45, 109) };
}

// =====================================================================================
// The Eclipse Twins: Sol and Luna
// =====================================================================================
const FOX = ramp('#ffa04a', { step: 9, turn: 10 });
const BUN = ramp('#eceaff', { step: 7, turn: 10, lift: 3 });
const SUNC = '#ffd36b';
const MOONC = '#d8e4ff';
const tw = pairOf('tw');
// Sol's head: a fox face, big ears, a cream muzzle. Box 28 x 26; the neck at (14, 25).
const solHead = () => [
  T([[4, 12], [3, 0.6], [11, 7]], FOX.base), F(T([[5, 10], [4.4, 3], [9, 7.4]], '#fff0e0')), T([[24, 12], [25, 0.6], [17, 7]], FOX.base), F(T([[23, 10], [23.6, 3], [19, 7.4]], '#fff0e0')),
  E(14, 15, 11, 10, FOX.base), T([[5, 17], [14, 25], [23, 17], [14, 21]], '#fff4e8'), crescent(14, 15, 11, 10, FOX.sh, { k: 0.18, a0: 100, a1: 200 }), E(14, 19.6, 1.6, 1.2, '#4a2a2a'),
];
// Luna's head: a round bunny face, long ears with pink insides (their own parts). Box 26 x 24; the neck at (13, 23).
const lunaHead = () => [E(13, 13, 10.6, 9.6, BUN.base), crescent(13, 13, 10.6, 9.6, BUN.sh, { k: 0.18, a0: 100, a1: 200 }), E(13, 17.6, 1.2, 0.9, '#ff9ab8')];
const lunaEar = (far) => () => [E(4, 9, 3.6, 9, far ? BUN.sh : BUN.base), F(E(4, 9.6, 1.6, 6.6, '#ffc8dc'))];
// Bodies: a little dress, sun-gold or moon-blue. Box 20 x 22; the hips at (10, 21).
const twBody = (c) => () => {
  const hem = [];
  for (let k = 0; k <= 5; k++) hem.push([1 + k * 3.6, 20 + (k % 2 ? 1.4 : 0)]);
  return [T([[6, 1], [14, 1], [19, 20], ...hem.reverse(), [1, 20]], c), F(T([[6, 1], [8, 1], [3, 20], [1, 20]], '#ffffff')), E(10, 1.6, 4, 1.6, '#ffffff')];
};
const twArm = (c, far) => () => [taper([[1, 2], [7, 2.4]], 3, 2.6, far ? ramp(c).sh : c), E(8, 2.4, 2, 1.9, far ? '#e8e0f0' : '#ffffff')];
const twLeg = (c, far) => () => [taper([[2.5, 0], [2.5, 5]], 3, 2.8, far ? ramp(c).sh : c), E(3, 5.6, 2.4, 1.4, far ? '#a8a0c0' : '#ffffff')];
// Sol's rays: a ring of sun petals rooted behind her head. Box 46 x 46; centred at (23, 23).
const solRays = () => {
  const out = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    out.push(T([[23 + Math.cos(a - 0.18) * 13, 23 + Math.sin(a - 0.18) * 13], [23 + Math.cos(a) * 22, 23 + Math.sin(a) * 22], [23 + Math.cos(a + 0.18) * 13, 23 + Math.sin(a + 0.18) * 13]], k % 2 ? '#ffb84a' : SUNC));
  }
  out.push(E(23, 23, 14, 14, '#ffe8a0'));
  return out;
};
const solDisc = () => [E(9, 9, 8.6, 8.6, SUNC), E(9, 9, 6.4, 6.4, '#fff2b0'), F(E(6.6, 6.6, 2, 1.4, '#ffffff'))];
// Luna's crescent: held like a shield, a star on its tip. Box 22 x 26; held at (6, 13).
const lunaMoon = () => [T([...arcP(11, 13, 10, 12, 90, 270, 14), ...arcP(15, 13, 7, 10, 270, 90, 14).reverse()], MOONC), F(T([...arcP(11, 13, 8.6, 10.6, 110, 200, 8), [8, 12]], '#ffffff')), star5(3, 2, 2, STARC)];
const lunaVeil = () => [T([[2, 0], [20, 0], [24, 22], [12, 26], [0, 22]], '#c8d2ff'), ...[[6, 8], [16, 12], [10, 18], [19, 20]].map(([x, y]) => F(star5(x, y, 1.2, '#ffffff')))];
const SOL = {
  HEAD: tw('solhead', 28, 26, solHead, 2), BODY: tw('solbody', 20, 22, twBody('#ffd36b'), 2), RAYS: tw('solrays', 46, 46, solRays, 2), DISC: tw('soldisc', 18, 18, solDisc, 2),
  ARM: [false, true].map((f) => tw(`solarm${f ? 1 : 0}`, 10, 5, twArm('#ffd36b', f), 2)), LEG: [false, true].map((f) => tw(`solleg${f ? 1 : 0}`, 6, 7, twLeg(FOX.base, f), 2)),
  TAIL: tw('soltail', 20, 14, () => [taper([[1, 12], [8, 9], [14, 4], [19, 3]], 4, 6, FOX.base), E(17, 3.4, 4, 3, '#fff4e8')], 2),
};
const LUNA = {
  HEAD: tw('lunahead', 26, 24, lunaHead, 2), BODY: tw('lunabody', 20, 22, twBody('#a8b8f0'), 2), MOON: tw('lunamoon', 22, 26, lunaMoon, 2), VEIL: tw('lunaveil', 24, 26, lunaVeil, 2),
  EAR: [false, true].map((f) => tw(`lunaear${f ? 1 : 0}`, 8, 19, lunaEar(f), 2)),
  ARM: [false, true].map((f) => tw(`lunaarm${f ? 1 : 0}`, 10, 5, twArm('#a8b8f0', f), 2)), LEG: [false, true].map((f) => tw(`lunaleg${f ? 1 : 0}`, 6, 7, twLeg(BUN.base, f), 2)),
};
const SOL_FACE = { eyes: [[17.6, 14.6, 1.8, 2.4, 1], [10.6, 14.6, 1.6, 2.2, -1]], mouth: [14, 22, 1.4], blush: [[7.4, 18, 1.6], [20.6, 18, 1.6]], iris: '#e85a2a', lid: 0, lashes: 1 };
const LUNA_FACE = { eyes: [[16.4, 12.6, 1.8, 2.4, 1], [9.6, 12.6, 1.6, 2.2, -1]], mouth: [13, 18.6, 1.2], blush: [[6.4, 16, 1.6], [19.6, 16, 1.6]], iris: '#6a7ad8', lid: 0.4, lashes: 1 };
const solFace = (mood) => sm(`tw|sol|${mood}`, 28, 26, () => faceShapes(mood, SOL_FACE));
const lunaFace = (mood) => sm(`tw|luna|${mood}`, 26, 24, () => faceShapes(mood, LUNA_FACE));
const twinPose = (m, a, bouncy) => {
  a.uidOff = (m.uid % 13) * 0.93;
  const t = a.t + a.uidOff;
  const u = stepPhase(m, a, 'tw', 12);
  const alone = m.mech?.alone ? 1 : 0;
  a.twAlone = alone;
  const br = Math.sin(t * (bouncy ? 2.6 : 1.4));
  const s1 = Math.sin(u * TAU);
  const idle = { x: 0, lift: (bouncy ? Math.abs(br) * 2 : 3 + br * 1.6) - alone * 2, tilt: br * 3 + alone * 10, head: -br * 4 + alone * 16, armN: 40 + br * 10 - alone * 20, armF: -40 - br * 10 + alone * 60, legN: 0, legF: 0, prop: br * 6, extra: Math.sin(t * 1.2) * 10 };
  const walk = { x: 0, lift: bouncy ? Math.abs(s1) * 2.4 : 3 + Math.abs(s1), tilt: 6, head: -4, armN: 30 + s1 * 16, armF: -30 - s1 * 16, legN: s1 * 26, legF: -s1 * 26, prop: s1 * 6, extra: -10 };
  const antic = { x: -3, lift: 2, tilt: -12, head: -10, armN: -130, armF: -60, legN: 14, legF: -10, prop: -40, extra: 10 };
  const strike = { x: 6, lift: 1, tilt: 16, head: 10, armN: 50, armF: 30, legN: -16, legF: 14, prop: 60, extra: -14 };
  return stateBlend(a, idle, walk, antic, strike);
};
const twSprings = { x: [240, 18], lift: [220, 14], tilt: [180, 12], head: [150, 9], armN: [200, 13], armF: [200, 13], legN: [260, 16], legF: [260, 16], prop: [200, 12], extra: [100, 6] };
const legPart = (P, k, far, tag, i) => ({ name: `leg${k}${tag}`, parent: 'hip', s: P.LEG[far ? 1 : 0][i], pivot: [2.5, 0], at: () => [far ? -2.6 : 2.6, -1], rot: (S) => (far ? S.legF : S.legN) * D2R });
const solPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `rays${tag}`, parent: 'nk', s: SOL.RAYS[i], pivot: [23, 23], at: () => [0, -14], rot: (S, a) => (a.t * 20 + S.extra) * D2R },
    { name: `tail${tag}`, parent: 'hip', s: SOL.TAIL[i], pivot: [1, 12], at: () => [-6, -4], rot: (S) => (-20 + S.extra) * D2R },
    { name: `armF${tag}`, parent: 'hip', s: SOL.ARM[1][i], pivot: [1, 2], at: () => [-2, -17], rot: (S) => S.armF * D2R },
    legPart(SOL, 1, true, tag, i), legPart(SOL, 0, false, tag, i),
    { name: `body${tag}`, parent: 'hip', s: SOL.BODY[i], pivot: [10, 21] },
    { name: `head${tag}`, parent: 'nk', s: SOL.HEAD[i], pivot: [14, 25] },
    { name: `disc${tag}`, parent: 'handN', s: SOL.DISC[i], pivot: [9, 9], rot: (S) => S.prop * D2R },
    { name: `armN${tag}`, parent: 'hip', s: SOL.ARM[0][i], pivot: [1, 2], at: () => [2.6, -16], rot: (S) => S.armN * D2R },
  ];
};
const lunaPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `veil${tag}`, parent: 'nk', s: LUNA.VEIL[i], pivot: [12, 2], at: () => [-4, -18], rot: (S) => (14 + S.extra) * D2R, alpha: () => 0.55 },
    { name: `earF${tag}`, parent: 'nk', s: LUNA.EAR[1][i], pivot: [4, 17], at: () => [-4, -18], rot: (S) => (-14 - S.extra * 0.6 - S.head * 0.4) * D2R },
    { name: `armF${tag}`, parent: 'hip', s: LUNA.ARM[1][i], pivot: [1, 2], at: () => [-2, -17], rot: (S) => S.armF * D2R },
    legPart(LUNA, 1, true, tag, i), legPart(LUNA, 0, false, tag, i),
    { name: `body${tag}`, parent: 'hip', s: LUNA.BODY[i], pivot: [10, 21] },
    { name: `head${tag}`, parent: 'nk', s: LUNA.HEAD[i], pivot: [13, 23] },
    { name: `earN${tag}`, parent: 'nk', s: LUNA.EAR[0][i], pivot: [4, 17], at: () => [3, -19], rot: (S) => (8 - S.extra * 0.6 - S.head * 0.4) * D2R },
    { name: `moon${tag}`, parent: 'handN', s: LUNA.MOON[i], pivot: [6, 13], rot: (S) => S.prop * D2R },
    { name: `armN${tag}`, parent: 'hip', s: LUNA.ARM[0][i], pivot: [1, 2], at: () => [2.6, -16], rot: (S) => S.armN * D2R },
  ];
};
const twinRig = (pass, face, bouncy, glowC) => sized(makeRig({
  w: 80, h: 100, soft: true, stride: 12, recover: 0.6,
  springs: twSprings,
  fast: ['x', 'armN', 'prop'],
  kick: { tilt: -160, head: -220, extra: 300 },
  turnKick: { extra: 260 },
  pose: (m, a) => twinPose(m, a, bouncy),
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -7 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'hip', at: () => [0.6, -19], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'handN', parent: 'armN', at: () => [8, 2.4] },
    ...pass(false),
    ...pass(true),
    { name: 'face', parent: 'nk', s: (a) => face(moodOf(a, a.twAlone ? 'hurt' : null)), pivot: bouncy ? [14, 25] : [13, 23] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const [hx, hy] = at2(mat('handN'), 0, 0);
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18);
    g.addColorStop(0, `rgba(${glowC},${0.3 * a.alpha})`);
    g.addColorStop(1, `rgba(${glowC},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(hx - 18, hy - 18, 36, 36);
    if (a.ph.strike > 0.2) sparkle(ctx, a, hx + 10, hy, 7 * a.ph.strike, a.alpha * a.ph.strike, bouncy ? '#fff2b0' : '#e8f0ff');
  },
}), 1.6);
export const solRig = twinRig(solPass, solFace, true, '255,211,107');
export const lunaRig = twinRig(lunaPass, lunaFace, false, '216,228,255');
export function solStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const hy = -7;
  const ny = hy - 19;
  return { w: 80, h: 90, res: 2, shapes: shift([
    ...put(solRays(), [23, 23], 0.6, ny - 14), ...put(SOLTAIL(), [1, 12], -6, hy - 4, -20), ...put(twLeg(FOX.base, true)(), [2.5, 0], -2.6, hy - 1), ...put(twLeg(FOX.base, false)(), [2.5, 0], 2.6, hy - 1),
    ...put(twBody('#ffd36b')(), [10, 21], 0, hy), ...put(solHead(), [14, 25], 0.6, ny), ...put(faceShapes(fm, SOL_FACE), [14, 25], 0.6, ny), ...put(solDisc(), [9, 9], 10, hy - 14), ...put(twArm('#ffd36b', false)(), [1, 2], 2.6, hy - 16, 40),
  ], 40, 89) };
}
const SOLTAIL = () => [taper([[1, 12], [8, 9], [14, 4], [19, 3]], 4, 6, FOX.base), E(17, 3.4, 4, 3, '#fff4e8')];
export function lunaStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const hy = -10;
  const ny = hy - 19;
  return { w: 80, h: 90, res: 2, shapes: shift([
    ...put(lunaEar(true)(), [4, 17], -3.4, ny - 18, -14), ...put(twLeg(BUN.base, true)(), [2.5, 0], -2.6, hy - 1), ...put(twLeg(BUN.base, false)(), [2.5, 0], 2.6, hy - 1),
    ...put(twBody('#a8b8f0')(), [10, 21], 0, hy), ...put(lunaHead(), [13, 23], 0.6, ny), ...put(faceShapes(fm, LUNA_FACE), [13, 23], 0.6, ny), ...put(lunaEar(false)(), [4, 17], 3.6, ny - 19, 8),
    ...put(lunaMoon(), [6, 13], 10, hy - 14), ...put(twArm('#a8b8f0', false)(), [1, 2], 2.6, hy - 16, 40),
  ], 40, 89) };
}
