// The Night Manager (2026-11-22, the player's pick from three human looks, sketched and polished
// with them first): the Queen's manager from the human world, the overtime boss of her dream. A
// lanky young office boss, chibi like the rest: soft coffee-brown hair in the hero's own "comma"
// cut with one stubborn curl on top like a wisp of steam, tired eye-bags behind big round copper
// glasses that fog up white every time he sips, a mocha sweater vest with ribbed edges over a white
// shirt with rolled sleeves, a loosened crimson tie with a gold clip, an ID badge with a photo of
// himself asleep, pressed navy trousers and brown penny loafers. His travel mug never leaves his
// near hand, held dead level; his far hand lives in his pocket until there's one more thing.
//
// How he moves (built on its own rig: every loose bit, the tie, the badge and the curl, swings on
// its own; the walk is distance-driven so his feet stay planted):
//   idle    a 10 s act: a slow sip (his glasses fog), a check of his watch, an impatient tap of
//           the foot; breathing and a little sway all the while.
//   walk    a brisk office power-walk, short quick steps, the mug arm level, the free arm swinging.
//   fight   (world/theatre.js sets m.castPose) "Just One More Thing" (memo): his clipboard waved
//           up beside his head, then the memos flung out; "Performance Review" (stamp): the giant
//           APPROVED stamp hauled up behind him, trembling, then slammed down ahead; "Coffee
//           Break" (pour): the mug to his lips, glasses fogged, then flung forward, coffee out
//           ahead; "Overtime" (files): a tower of files hoisted overhead, staggering, then heaved
//           down. A plain swing is the clipboard, swatted down.
//   beaten  he nods off where he stands, glasses sliding down his nose.

import { E, T, F, R } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, fr, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, moodOf, puff } from './rigkit.js';
import { chibiLegs } from './chibilegs.js';
import { band, curve, ovalPts, mitten, mapShape, soften } from './kidbase.js';
import { hairParts } from '../hair.js';
import { hairRamp } from '../hero.js';

const C = {
  skin: '#ffe8da', skinSh: '#f6c8b4', hair: '#4a3229', hairSh: '#33221c',
  shirt: '#f8f6f2', shirtSh: '#ddd6e6', shirtFar: '#e8e4ef', cuff: '#f1edf4', cuffFar: '#dedae8',
  vest: '#bd8758', vestSh: '#986344', trim: '#a5704a', tie: '#d24c5e', tieFold: '#bf4254', tieDk: '#a8364a',
  pants: '#474264', pantsFar: '#3e3959', crease: '#5b5582', shoes: '#6a4334', sole: '#4a2c22', shoeLit: '#93624f', strap: '#4f3027',
  frame: '#7a4630', fog: '#f7f4fb', fogLn: '#d6cfe6', iris: '#9a6232', irisDk: '#5e3518', irisLt: '#e2b272', bags: '#c4a0bb',
  ink: '#3a2430', mouth: '#9a3a4e', tongue: '#ff8a9e', blush: '#ffb3c2', gold: '#f2c14e', goldDk: '#c79a34',
  mug: '#f4efe4', mugSh: '#ddd4c4', mugBand: '#4fa79c', mugBandDk: '#3d8a80', lid: '#5d3b2f', lanyard: '#5a78c8', card: '#ffffff',
  wood: '#c58c52', woodSh: '#9c6a3c', stampBase: '#7c4b3a', stampInk: '#d4445a', paper: '#fffdf6', paperLn: '#c9c3da', clip: '#b9b9cc', board: '#b88a5a',
};
const nm = pairOf('nmgr');
const K = 0.62;
const HS = 1.1;

// ---------- The head ----------
// His haircut is the hero's own "comma" cut, drawn exactly as hers is, blown up to his head.
const HK2 = 29 / 10.2;
function heroHair() {
  const p = hairParts('comma', hairRamp(C.hair), null, null, 'smile', 'auto');
  const f = ([x, y]) => [(x - 15.5) * HK2, (y - 15) * HK2];
  const m = (list) => list.map((sh) => mapShape(sh, f, HK2));
  const shade = m([...(p.hairline ? [F(E(15.5, 8.2, 10.4, 3.2, C.skinSh))] : []), ...p.shade]).map((s) => ({ ...s, c: C.skinSh }));
  return { back: [...m(p.hang), ...m(p.head)], front: [...m(p.front), ...m(p.top)], shade };
}
const ring = (x, y, r, w, c) => band(ovalPts(x, y, r, r * 0.95, 0, 0, Math.PI * 2, 24), w, w, c, true);
function eyeOf(x, y, mood, o) {
  const w = 4.6;
  const h = 5.6;
  const out = [];
  if (mood === 'fake' || mood === 'doze' || mood === 'blink') {
    const up = mood === 'fake' ? -1 : 1;
    out.push(...band(curve([[x - w, y + 0.6], [x, y + up * h * 0.45 + 0.6], [x + w, y + 0.6]], 3), 1.9, 1.9, C.ink, true));
    return out;
  }
  const wide = mood === 'twitch' && o < 0;
  const ww = wide ? w * 1.1 : w;
  const hh = wide ? h * 1.15 : h;
  out.push(F(E(x, y, ww, hh, C.ink)), F(E(x, y + 0.6, ww - 1.1, hh - 1.4, C.iris)), F(E(x, y - hh * 0.3, ww - 1.1, hh * 0.45, C.irisDk)));
  out.push(F(E(x, y + hh * 0.5, ww * 0.6, hh * 0.28, C.irisLt)), F(E(x + 0.4 * o, y + 0.4, wide ? ww * 0.22 : ww * 0.36, wide ? hh * 0.22 : hh * 0.36, C.ink)));
  out.push(F(E(x - ww * 0.32, y - hh * 0.2, ww * 0.3, hh * 0.22, '#ffffff')), F(E(x + ww * 0.36, y + hh * 0.42, ww * 0.16, hh * 0.12, '#ffffff')));
  // The lid: tired and heavy, straight across and slanting when cross, wide open on the twitching side.
  const lid = mood === 'angry' ? 0.05 : wide ? -0.9 : mood === 'twitch' ? 0.35 : 0.25;
  if (lid > -0.5) {
    const tilt = mood === 'angry' ? -o * 2.8 : 0;
    out.push(F(T([[x - ww * 1.35, y - hh * lid + tilt], [x + ww * 1.35, y - hh * lid - tilt], [x + ww * 1.35, y - hh * 1.6], [x - ww * 1.35, y - hh * 1.6]], C.skin)));
    out.push(...band([[x - ww * 1.1, y - hh * lid + tilt + 0.2], [x, y - hh * lid - 0.5], [x + ww * 1.1, y - hh * lid - tilt + 0.2]], 1.8, 1.8, C.ink, true));
  } else {
    out.push(...band(curve([[x - ww * 1.05, y - hh * 0.2], [x, y - hh * 1.02], [x + ww * 1.05, y - hh * 0.25]], 3), 1.6, 1.6, C.ink, true));
  }
  out.push(...band([[x + ww * 1.0 * o, y - hh * lid], [x + ww * 1.45 * o, y - hh * lid - 1.6]], 1.4, 0.5, C.ink, true));
  return out;
}
// The head's moods, by the rig's mood names.
const FACE = { idle: 'idle', blink: 'blink', happy: 'fake', angry: 'angry', shout: 'glint', hurt: 'twitch', dizzy: 'twitch', dead: 'doze', sleep: 'doze', fog: 'fog', twitch: 'twitch', fake: 'fake', glint: 'glint', doze: 'doze' };
function headShapes() {
  const hair = heroHair();
  return [
    ...hair.back,
    E(-29, 8, 4.2, 5.6, C.skinSh), E(29, 8, 4.2, 5.6, C.skin),
    E(0, 0, 29, 28, C.skin), E(0, 10, 26.5, 17, C.skin),
    F(T([[-26, 6], [-20, 20], [-11, 26], [-18, 15], [-23, 3]], C.skinSh)),
    ...hair.shade, ...hair.front,
  ];
}
function faceShapes(look) {
  const mood = FACE[look] ?? 'idle';
  const face = [
    F(E(-16, 19, 4.2, 1.6, C.blush)), F(E(17, 19, 4.2, 1.6, C.blush)),
    ...band(curve([[-17.5, 16], [-12, 18.2], [-6.5, 16]], 2), 0.9, 0.9, C.bags, true),
    ...band(curve([[6.5, 16], [12, 18.2], [17.5, 16]], 2), 0.9, 0.9, C.bags, true),
  ];
  const brow = (sx, dy0, dy1) => band(curve([[sx * 6, -2.5 + dy0], [sx * 12, -4.5], [sx * 18, -2.5 + dy1]], 2), 1.7, 1.1, C.hairSh, true);
  if (mood === 'angry') face.push(...brow(-1, 3, -2), ...brow(1, 3, -2));
  else if (mood === 'twitch') face.push(...brow(-1, -4, -3), ...brow(1, 2, -1));
  else if (mood !== 'fog') face.push(...brow(-1, -1.5, 0.6), ...brow(1, -1.5, 0.6));
  const gy = mood === 'doze' ? 5 : 0;
  if (mood !== 'fog' && mood !== 'glint') face.push(...eyeOf(-12, 9, mood, -1), ...eyeOf(12, 9, mood, 1));
  if (mood === 'glint') {
    face.push(...eyeOf(-12, 9, 'idle', -1), ...eyeOf(12, 9, 'idle', 1));
    for (const cx of [-12, 12]) face.push(F(T([[cx - 6, 7], [cx + 2, -1], [cx + 7, 2], [cx - 1, 11]], '#ffffff')), F(T([[cx + 2, 9], [cx + 6, 5], [cx + 7.5, 7], [cx + 3.5, 11]], '#ffffff')));
  }
  if (mood === 'fog') {
    for (const cx of [-12, 12]) {
      face.push(F(E(cx, 9, 9, 8.6, C.fog)));
      face.push(...band(curve([[cx - 5, 7], [cx - 1, 4], [cx + 3, 7], [cx - 1, 10], [cx + 4, 12]], 3), 0.9, 0.9, C.fogLn, true));
    }
  }
  if (mood === 'twitch') face.push(...band([[22, 2], [25, 0]], 0.8, 0.8, C.ink, true), ...band([[23, 7], [26.5, 7]], 0.8, 0.8, C.ink, true), ...band([[22, 12], [25, 14]], 0.8, 0.8, C.ink, true));
  face.push(...ring(-12, 9 + gy, 9.4, 1.9, C.frame), ...ring(12, 9 + gy, 9.4, 1.9, C.frame));
  face.push(...band(curve([[-2.8, 7 + gy], [0, 5.6 + gy], [2.8, 7 + gy]], 2), 1.6, 1.6, C.frame, true), ...band([[21.4, 7 + gy], [28, 5]], 1.5, 1.5, C.frame, true), ...band([[-21.4, 7 + gy], [-27, 5]], 1.5, 1.5, C.frame, true));
  if (mood === 'idle' || mood === 'twitch' || mood === 'angry') for (const cx of [-12, 12]) face.push(...band([[cx + 3, 3 + gy], [cx + 6, 6 + gy]], 1.3, 1.3, '#ffffff', true));
  if (mood === 'fake') face.push(...band(curve([[-7, 19.5], [-3, 23], [3, 23], [7, 19.5]], 3), 1.3, 1.3, C.ink, true), ...band([[-8, 18.2], [-7, 20.6]], 0.8, 0.8, C.ink, true), ...band([[8, 18.2], [7, 20.6]], 0.8, 0.8, C.ink, true));
  else if (mood === 'angry' || mood === 'glint') face.push(F(T([[-5.5, 19], [5.5, 19], [3.6, 25.5], [-3.6, 25.5]], C.mouth)), F(R(-4.8, 19, 9.6, 1.8, '#ffffff')), F(E(0, 24.2, 2.6, 1.2, C.tongue)));
  else if (mood === 'twitch') face.push(...band([[-5, 21.5], [-2.5, 20.4], [0, 21.6], [2.5, 20.4], [5, 21.5]], 1.1, 1.1, C.ink, true));
  else if (mood === 'doze') face.push(F(E(0, 22, 1.8, 1.5, C.mouth)));
  else if (mood === 'fog') face.push(...band(curve([[-3, 21.8], [0, 21.2], [3, 22]], 2), 1.1, 1.1, C.ink, true));
  else face.push(...band(curve([[-3.4, 21.6], [0, 21], [3.4, 21.8]], 2), 1.1, 1.1, C.ink, true));
  return face;
}
// Head space (centre 0, 0) to the head's box: scaled a tenth up, box 88 x 90 from (-44, -52).
const toHeadBox = (shapes) => shapes.map((s) => mapShape(s, ([x, y]) => [x * HS + 44, y * HS + 52], HS));
// (The neck sits 34 below the head's centre once scaled: the sketch's head centre to its neck.)
const HEAD_PIVOT = [44, 34 + 52];
const headFace = (look) => faceSprite(`nmgr|face|${FACE[look] ?? 'idle'}`, 88, 90, () => toHeadBox(faceShapes(look)));
// His curl, on its own: a wisp of steam rising off the crown. Box 28 x 28; its root at (6.3, 22.5).
const CURL = curve([[3, -25], [5, -35], [12, -41], [19, -38], [18, -32], [13, -32]], 3).map(([x, y]) => [x * HS, y * HS]);
const curlP = () => shift(band(CURL, 5.5, 2.6, C.hair), 3, 50);

// ---------- The body ----------
// Drawn in the sketch's space (his body's pivot at (75, 135)), each part shifted into its own box.
const at = (shapes, ox, oy) => shift(shapes, -ox, -oy);
// The torso: rounded shoulders, the shirt showing only at the collar; the fitted sweater vest with
// ribbed edges over it, shaded on its far side, a welt pocket with two pens, the lanyard down to
// the badge. Box 70 x 72 from (40, 100); the body's pivot at (35, 35).
const torsoP = () => at([
  E(75, 112, 6, 5, C.skinSh),
  T(soften([[61, 111], [89, 111], [96, 115.5], [98, 124], [96.5, 142], [53.5, 142], [52, 124], [54, 115.5]], 2), C.shirt),
  T(soften([[58.5, 116.5], [91.5, 116.5], [95.5, 124], [95.2, 150], [84, 159.5], [75, 154.5], [66, 159.5], [54.8, 150], [54.5, 124]], 2), C.vest),
  F(T(soften([[55.5, 125], [60.5, 123], [60, 140], [61, 150], [57.5, 151.5], [55.5, 149]], 1), C.vestSh)),
  ...band([[66.5, 116.5], [75, 137.5], [83.5, 116.5]], 2.3, 2.3, C.trim, true),
  ...band(curve([[58.5, 117], [56, 123], [55.5, 128]], 2), 2.2, 2.2, C.trim, true),
  ...band(curve([[91.5, 117], [94, 123], [94.5, 128]], 2), 2.2, 2.2, C.trim, true),
  ...band([[55.5, 150.5], [66, 158.6], [75, 153.8], [84, 158.6], [94.5, 150.5]], 2.4, 2.4, C.trim, true),
  F(T([[67.5, 116], [82.5, 116], [75, 136]], C.shirt)), F(T([[70, 116], [80, 116], [75, 121.5]], C.shirtSh)),
  F(E(75.6, 141.5, 1.3, 1.3, C.trim)), F(E(75.8, 147, 1.3, 1.3, C.trim)),
  F(R(60.2, 125.5, 1.8, 6.5, C.lanyard)), F(E(61.1, 125.5, 0.9, 0.9, '#3f5aa0')), F(R(63, 124.5, 1.8, 7.5, C.tie)), F(E(63.9, 124.5, 0.9, 0.9, C.tieDk)),
  ...band([[58.5, 131], [67, 130.2]], 1.8, 1.8, C.trim, true),
  T(soften([[65, 110.5], [75, 115.5], [68.5, 122]], 1), C.shirt), T(soften([[85, 110.5], [75, 115.5], [81.5, 122]], 1), C.shirt),
  ...band([[66, 115], [79, 137]], 1.3, 1.3, C.lanyard, true), ...band([[84, 115], [85.5, 136]], 1.3, 1.3, C.lanyard, true),
], 40, 100);
// The trousers' seat, under the vest: no wider than it, a small notch between the legs. Box 52 x 26
// from (50, 146) in the legs' space (the body's pivot at (75, 143) there).
const seatP = () => at([T([[55, 150], [95, 150], [95.5, 166], [79.5, 167.5], [75, 164.5], [70.5, 167.5], [54.5, 166]], C.pants)], 50, 146);
// The tie: a knot, the blade folded (its far half darker), a gold clip. Box 16 x 40; hung from its knot at (6.5, 5).
const tieP = () => at([
  T([[74, 122.5], [79.5, 122.5], [83, 147], [79.5, 152], [75.5, 147]], C.tie), F(T([[74, 122.5], [76.6, 122.5], [79.2, 150], [75.5, 147]], C.tieFold)),
  T(soften([[73, 117.5], [80, 117.5], [78.8, 123.6], [74.6, 123.6]], 1), C.tie), F(T([[73.6, 118.4], [75.8, 118.2], [75.6, 123], [74.8, 123]], C.tieFold)),
  ...band([[75.5, 128], [80.5, 126]], 1.2, 1.2, C.tieDk, true), ...band([[77.4, 142], [82.4, 140]], 1.2, 1.2, C.tieDk, true),
  F(R(74.4, 134.4, 9, 1.7, C.gold)), F(R(74.4, 135.6, 9, 0.5, C.goldDk)),
], 70, 115);
// The ID badge: a clip, his photo (asleep) and a printed line. Box 14 x 18; hung from its clip at (7.5, 3).
const badgeP = () => at([
  R(80, 137, 11, 13, C.card), F(R(80, 137, 11, 3, C.lanyard)), F(R(84, 134.8, 3, 2.8, C.clip)),
  F(R(81.6, 140.6, 7.8, 7.2, '#dfe9ff')), F(R(81.6, 148.4, 7.8, 0.7, '#b7b0cc')),
  F(E(85.5, 144.5, 2.6, 2.6, C.skin)), F(T(ovalPts(85.5, 143.6, 2.8, 2.2, 0, Math.PI, Math.PI * 2, 8), C.hair)),
  ...band([[84, 145], [85, 145.4]], 0.5, 0.5, C.ink, true), ...band([[86.2, 145.4], [87.2, 145]], 0.5, 0.5, C.ink, true),
], 78, 133);

// Arms: an upper sleeve from a round shoulder cap, then a forearm with its rolled cuff. Both hang
// straight down from their joint in their boxes.
const UA = 18;
const FA = 13;
const upperP = (far) => () => [
  E(8, 4, 5.8, 5.6, far ? C.shirtFar : C.shirt), ...band([[8, 4], [8, 4 + UA]], 10.5, 9.4, far ? C.shirtFar : C.shirt),
  ...band([[5.4, 4 + UA * 0.5], [10.4, 5 + UA * 0.5]], 0.9, 0.6, C.shirtSh, true),
];
const foreP = (far) => () => [
  ...band([[8, 3], [8, 3 + FA]], 7.4, 6.8, far ? C.skinSh : C.skin),
  ...band([[8, 1.4], [8, 5.8]], 11.4, 10.6, far ? C.cuffFar : C.cuff), ...band([[3, 3.6], [13, 3.6]], 0.8, 0.8, C.shirtSh, true),
];
// A hand, on its own so it can close round what it holds (drawn after the mug or prop). Box 14 x 14; the wrist at (7, 3).
const handP = (far) => () => mitten(7, 7, Math.PI / 2 + 0.3, far ? C.skinSh : C.skin, 4.7);
// The travel mug, gripped low on its side. Box 22 x 36; the grip at (6, 29).
const mugP = () => at([
  T([[103.5, 104], [118.5, 104], [119.5, 130], [102.5, 130]], C.mug),
  F(T([[103.5, 104.5], [106.4, 104.5], [105.8, 129.8], [102.6, 129.8]], C.mugSh)),
  F(R(102.8, 114, 16.4, 5, C.mugBand)), F(R(102.8, 118.2, 16.4, 0.9, C.mugBandDk)), F(R(114, 105, 2, 24, '#fbf8f1')),
  F(E(111, 124, 3, 3, C.gold)), F(T([[110, 126], [112, 126], [113, 129.5], [111, 128.5], [109, 129.5]], C.tie)),
  T([[102, 100.5], [120, 100.5], [119, 104.5], [103, 104.5]], C.lid), F(R(113, 98.5, 4, 2.5, C.lid)),
  F(R(103.5, 100.7, 15, 1.1, '#7c5446')), F(R(102.5, 103.8, 17, 0.9, '#40271f')),
], 99, 96);
// His far hand's things: the clipboard (memos), the giant APPROVED stamp, the tower of files. Each
// box has the grip where the hand closes.
const clipboardP = () => [
  T(soften([[0, 0], [16, 0], [16, 22], [0, 22]], 1), C.board), R(2, 3, 12, 17, C.paper),
  ...[7, 10, 13, 16].map((y) => F(R(4, y, 8, 0.9, C.paperLn))), F(R(5.5, -1.6, 5, 3.2, C.clip)),
]; // box 16 x 22 (+pad); grip at (3, 18)
const stampP = () => [
  ...band([[8, 40], [8, 10]], 6.5, 6.5, C.wood), E(8, 42, 6, 5.5, C.wood), F(R(6.6, 12, 1.4, 26, C.woodSh)),
  T(soften([[-11, 0], [27, 0], [27, 11], [-11, 11]], 1), C.stampBase), F(R(-11, -3, 38, 3.4, C.stampInk)),
  ...band([[2, 6], [6, 9], [14, 3]], 1.8, 1.8, '#f3e2c2', true),
]; // box spans x -11..27, y -3..48; grip at (8, 36)
const filesP = () => [
  ...[0, 1, 2, 3, 4, 5].map((k) => T([[k % 2 ? 1 : -1, k * 5], [24 + (k % 2 ? -1 : 1), k * 5], [24 + (k % 2 ? -1 : 1), k * 5 + 4.6], [k % 2 ? 1 : -1, k * 5 + 4.6]], k % 3 === 0 ? '#ffd88a' : k % 3 === 1 ? '#a8d4ff' : '#ffb8c8')),
  ...[0, 1, 2, 3, 4, 5].map((k) => F(R(3, k * 5 + 1.8, 18, 0.8, '#ffffff'))),
]; // box 24 x 30; grip at (12, 30)

// Legs: pressed navy trousers (the far leg a shade darker, away from the light), a crease down each,
// the hem covered by a penny loafer.
const L1 = 23;
const L2 = 23.5;
const SOLE = 9;
const thighP = (far) => () => [...band([[8, 4], [8, 4 + L1]], 12.6, 12, far ? C.pantsFar : C.pants), E(8, 4 + L1, 6, 6, far ? C.pantsFar : C.pants), ...band([[9.5, 9], [9.5, 4 + L1]], 0.7, 0.7, C.crease, true)];
const shinP = (far) => () => [E(8, 4, 6, 6, far ? C.pantsFar : C.pants), ...band([[8, 4], [8, 4 + L2]], 12, 11.5, far ? C.pantsFar : C.pants), ...band([[9.5, 4], [9.5, 1 + L2]], 0.7, 0.7, C.crease, true)];
const footP = (far) => () => [
  T(soften([[4, 4], [15, 3.5], [21, 7], [22.5, 11.5], [21, 15], [3, 15], [2, 10]], 2), far ? '#5a3a2c' : C.shoes),
  F(T([[3, 13.8], [21.5, 13.8], [21, 15.4], [3, 15.4]], C.sole)),
  F(E(17.5, 8.2, 2.6, 1.1, C.shoeLit)), ...band([[9.5, 5.2], [16, 6.4]], 1.5, 1.5, C.strap, true),
]; // box 24 x 16; the ankle (the hem's middle) at (11, 6); the sole on its bottom edge

const SP = {
  TORSO: nm('torso', 70, 72, torsoP, 6), SEAT: nm('seat', 52, 26, seatP, 3), TIE: nm('tie', 16, 40, tieP, 3), BADGE: nm('badge', 14, 18, badgeP, 3),
  HEAD: nm('head', 88, 90, () => toHeadBox(headShapes()), 6), CURL: nm('curl', 28, 28, curlP, 4),
  UPPER: [false, true].map((f) => nm(`upper${f ? 1 : 0}`, 16, 26, upperP(f), 4)), FORE: [false, true].map((f) => nm(`fore${f ? 1 : 0}`, 16, 20, foreP(f), 4)),
  HAND: [false, true].map((f) => nm(`hand${f ? 1 : 0}`, 14, 14, handP(f), 3)),
  MUG: nm('mug', 22, 36, mugP, 3), CLIPBOARD: nm('clipboard', 16, 22, clipboardP, 4), STAMP: nm('stamp', 40, 48, () => shift(stampP(), 11, 3), 4), FILES: nm('files', 26, 32, () => shift(filesP(), 1, 0), 4),
  THIGH: [false, true].map((f) => nm(`thigh${f ? 1 : 0}`, 16, 34, thighP(f), 3)), SHIN: [false, true].map((f) => nm(`shin${f ? 1 : 0}`, 16, 32, shinP(f), 3)), FOOT: [false, true].map((f) => nm(`foot${f ? 1 : 0}`, 24, 16, footP(f), 3)),
};

// ---------- The rig ----------
const BODY = 69;
const HIPS = [[9, 15], [-9, 15]];
const FEET = [11, -13];
const LEGS = chibiLegs({ bodyY: BODY, l1: L1, l2: L2, sole: SOLE, hips: HIPS, feet: FEET });
const SH = [[18, -17], [-18, -17]];
// The walk in his own units: the rig is drawn at K, so a world stride is 1/K of his.
const STRIDE = 24;
const st = (o, fN = [0, 0], fF = [0, 0]) => ({ x: 0, lift: 0, tilt: 0, head: 0, armN: 22, elbN: 117, armF: -19, elbF: 39, mugT: 0, pocket: 0, ...o, ...LEGS.at(o.lift ?? 0, o.tilt ?? 0, [FEET[0] + fN[0], fN[1]], [FEET[1] + fF[0], fF[1]]) });
// His casts: [wind-up, blow, held through the cast (a function of the time into it)].
const MOVES = {
  memo: [st({ lift: 1, tilt: -6, armF: 204, elbF: 14, head: -4 }), st({ x: 4, tilt: 10, armF: 62, elbF: 6, head: 4 }, [4, 0]),
    (t) => st({ lift: 1 + Math.abs(Math.sin(t * 3)) * 1.5, tilt: -3, armF: 198 + Math.sin(t * 9) * 8, elbF: 16, head: -3 + Math.sin(t * 3) * 2 })],
  stamp: [st({ lift: 2, tilt: -12, armF: 178, elbF: 66, head: -6 }), st({ x: 8, tilt: 18, armF: 70, elbF: 4, head: 6 }, [8, 0], [-2, 0]),
    (t) => st({ lift: 1, tilt: -8 - Math.min(1, t / 1.4) * 6, armF: 172 + Math.sin(t * 15) * 3, elbF: 62 + Math.sin(t * 15 + 1) * 3, head: -5 })],
  pour: [st({ tilt: -10, armN: 70, elbN: 150, mugT: -70, head: -8 }), st({ x: 8, tilt: 14, armN: 98, elbN: 18, mugT: 112, head: 6 }, [6, 0], [-3, 0]),
    (t) => st({ lift: 0.5, tilt: -6 + Math.sin(t * 2.4) * 2, armN: 62, elbN: 148, mugT: -62 - Math.sin(t * 2.4) * 6, head: -7 })],
  files: [st({ lift: -2, tilt: -6, armF: 200, elbF: 10, head: 3 }), st({ x: 6, tilt: 14, armF: 74, elbF: 4 }, [5, 0], [-2, 0]),
    (t) => st({ lift: -3 + Math.abs(Math.sin(t * 4.4)) * 1.2, tilt: Math.sin(t * 4.4) * 7, armF: 198 + Math.sin(t * 4.4) * 5, elbF: 12, head: Math.sin(t * 4.4 + 0.6) * 4 })],
};
const MOOD = { memo: 'happy', stamp: 'shout', pour: 'fog', files: 'hurt' };
const PROP = { memo: 'clipboard', stamp: 'stamp', pour: null, files: 'files' };
// A named cast (m.castPose): the pose eases into the cast's own held move, then its own wind-up and blow.
function castMove(m, a, idle) {
  const mo = a.mo ?? {};
  const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
  if (m.castPose && MOVES[m.castPose]) mo.nmKind = m.castPose;
  else if (!active) mo.nmKind = null;
  const kind = mo.nmKind;
  const mv = kind ? MOVES[kind] : null;
  if (!mv) return [idle, null, null, 0, null];
  const cast = m.cast && m.castPose ? clamp((a.now - m.cast.t0) / 0.45, 0, 1) : 0;
  const hold = mv[2](m.cast ? a.now - m.cast.t0 : 0);
  const base = cast > 0 ? Object.fromEntries(Object.keys(idle).map((key) => [key, idle[key] + ((hold[key] ?? idle[key]) - idle[key]) * cast])) : idle;
  return [base, mv[0], mv[1], cast, kind];
}
const shadow = (ctx, m, a) => {
  ctx.globalAlpha = a.alpha * 0.22;
  ctx.fillStyle = '#1a1626';
  ctx.beginPath();
  ctx.ellipse(0, -0.6, 30, 5, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a.alpha;
};
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

function legParts(i) {
  const tg = i ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [8, 4], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [8, 4], at: () => HIPS[j], rot: (S) => S[`thigh${k}`] * D2R },
      { name: `foot${k}${tg}`, parent: `ankle${k}`, s: SP.FOOT[j][i], pivot: [11, 6], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
    ];
  };
  return { far: leg(true), near: leg(false) };
}
const propOf = (a) => a.nmProp ?? null;

const rig = makeRig({
  w: 170, h: 230, soft: true, stride: 1e9, recover: 0.6,
  springs: { x: [220, 16], lift: [220, 15], tilt: [170, 12], head: [150, 12], armN: [200, 15], elbN: [200, 15], armF: [220, 14], elbF: [220, 14], mugT: [180, 14], pocket: [90, 14],
    thighN: [340, 21], thighF: [340, 21], shinN: [340, 21], shinF: [340, 21], rollN: [320, 20], rollF: [320, 20] },
  // (While he walks his legs follow their steps exactly, so a planted foot never drifts: a soft
  // leg spring lagging the step slid every foot along the floor.)
  walkStiff: { lift: [420, 22], tilt: [380, 22], armF: [380, 22], head: [300, 20], thighN: [3000, 110], thighF: [3000, 110], shinN: [3000, 110], shinF: [3000, 110], rollN: [3000, 110], rollF: [3000, 110] },
  fast: ['x', 'lift', 'armF', 'elbF', 'armN', 'elbN', 'mugT', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -110, head: 90 },
  turnKick: { tilt: 70, head: 60 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'nmgr', STRIDE);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 10) * 10;
    const busy = active || (m.cast && m.castPose) || walkW > 0.05 || m.cine;
    // His act: a slow sip (glasses fog), a check of the watch on his far wrist, a tapped foot.
    const sip = busy ? 0 : hold(lu, 0.8, 1.5, 2.9, 3.6);
    const watch = busy ? 0 : hold(lu, 4.8, 5.3, 6.6, 7.1);
    const tap = busy ? 0 : hold(lu, 7.9, 8.2, 9.3, 9.6);
    const tapUp = tap * Math.max(0, Math.sin(t * 9)) * 3.4;
    const br = Math.sin(t * 1.4);
    const idle = st({
      lift: Math.max(0, br) * 0.7, tilt: br * 1.2 - sip * 3, head: -sip * 7 + watch * 9 + Math.sin(t * 0.9) * 1.2,
      armN: 22 + sip * 40, elbN: 117 + sip * 33, mugT: -sip * 62,
      armF: -19 + watch * 44, elbF: 39 + watch * 74, pocket: 1 - watch,
    }, [tap * 1.5, tapUp]);
    // A brisk office power-walk: short quick steps, leaning in, the mug arm level, the free arm swinging.
    const stride = STRIDE / K;
    const steps = [pawStep(u, 0, stride, 0.6, 5), pawStep(u, 0.5, stride, 0.6, 5)];
    const sw = Math.sin(u * TAU);
    const bob = Math.abs(Math.cos(u * TAU));
    const walk = st({ lift: bob * 1.8, tilt: 5 + sw * 1.5, head: -2 + bob * 1.5, armN: 24 + sw * 4, elbN: 114, armF: sw * -26, elbF: 30 + Math.max(0, -sw) * 16, pocket: 0 },
      [steps[0][0], steps[0][1]], [steps[1][0], steps[1][1]]);
    // A plain swing: the clipboard drawn back over his shoulder, then swatted down ahead.
    const antic = st({ lift: 2, tilt: -8, armF: 200, elbF: 22, head: -4 });
    const strike = st({ x: 6, tilt: 12, armF: 64, elbF: 6, head: 5 }, [5, 0], [-2, 0]);
    const [base, an, sk, cast, kind] = castMove(m, a, idle);
    const S = stateBlend(a, base, walk, an ?? antic, sk ?? strike);
    if (m.hp <= 0) Object.assign(S, st({ lift: -7, tilt: 9, head: 20, armN: 8, elbN: 40, armF: -6, elbF: 12, mugT: -10, pocket: 0 }, [2, 0], [0, 0]));
    // What his far hand holds, and his face.
    a.nmProp = kind ? PROP[kind] : active ? 'clipboard' : null;
    a.nmSip = sip;
    a.nmMood = m.hp <= 0 ? 'dead' : moodOf(a, cast > 0 ? MOOD[kind] : sip > 0.6 ? 'fog' : tap > 0.5 ? 'hurt' : null);
    if (kind === 'pour' && a.ph.strike > 0.25) a.nmMood = 'shout';
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'neck', parent: 'bodyJ', at: () => [0, -23], rot: (S) => S.head * D2R },
    { name: 'shN', parent: 'bodyJ', at: () => SH[0], rot: (S) => -S.armN * D2R },
    { name: 'elbN', parent: 'shN', at: () => [0, UA], rot: (S) => -S.elbN * D2R },
    { name: 'wristN', parent: 'elbN', at: () => [0, FA + 1] },
    { name: 'gripN', parent: 'elbN', at: () => [0, FA + 5] },
    { name: 'shF', parent: 'bodyJ', at: () => SH[1], rot: (S) => -S.armF * D2R },
    { name: 'elbF', parent: 'shF', at: () => [0, UA], rot: (S) => -S.elbF * D2R },
    { name: 'wristF', parent: 'elbF', at: () => [0, FA + 1] },
    { name: 'gripF', parent: 'elbF', at: () => [0, FA + 5] },
    ...[0, 1].flatMap((i) => {
      const tg = i ? 'b' : '';
      const L = legParts(i);
      // The far arm goes behind him at rest (the hand in his pocket) and in front of him when it
      // swings a prop up (a planned layer change, eased by its own alpha).
      const farFront = (a) => Boolean(propOf(a));
      const farArm = (front) => [
        { name: `upF${tg}${front}`, parent: 'shF', s: SP.UPPER[1][i], pivot: [8, 4], when: (a) => farFront(a) === front },
        { name: `foreF${tg}${front}`, parent: 'elbF', s: SP.FORE[1][i], pivot: [8, 3], when: (a) => farFront(a) === front },
        { name: `clip${tg}${front}`, parent: 'gripF', s: SP.CLIPBOARD[i], pivot: [3, 18], rot: () => Math.PI - 0.25, when: (a) => front && propOf(a) === 'clipboard' },
        { name: `stamp${tg}${front}`, parent: 'gripF', s: SP.STAMP[i], pivot: [19, 39], rot: () => Math.PI, when: (a) => front && propOf(a) === 'stamp' },
        { name: `files${tg}${front}`, parent: 'gripF', s: SP.FILES[i], pivot: [13, 30], rot: () => Math.PI, when: (a) => front && propOf(a) === 'files' },
        { name: `handF${tg}${front}`, parent: 'wristF', s: SP.HAND[1][i], pivot: [7, 3], alpha: (a, S) => (front ? 1 : 1 - clamp(S.pocket, 0, 1)), when: (a) => farFront(a) === front },
      ];
      return [
        ...farArm(false),
        ...L.far, ...L.near,
        { name: `seat${tg}`, parent: 'bodyJ', s: SP.SEAT[i], pivot: [25, -3], at: () => [0, 0] },
        { name: `torso${tg}`, parent: 'bodyJ', s: SP.TORSO[i], pivot: [35, 35] },
        { name: `tie${tg}`, parent: 'bodyJ', s: SP.TIE[i], pivot: [6.5, 5], at: () => [1.5, -15], soft: { key: 'nmtie', dir: [0, 1], k: 120, c: 7, gain: 1, turn: 0.6, max: 22, flutter: 2, hz: 0.8 } },
        { name: `badge${tg}`, parent: 'bodyJ', s: SP.BADGE[i], pivot: [7.5, 3], at: () => [10.5, 1], soft: { key: 'nmbadge', dir: [0, 1], k: 130, c: 7, gain: 1, turn: 0.6, max: 14 } },
        { name: `head${tg}`, parent: 'neck', s: SP.HEAD[i], pivot: HEAD_PIVOT },
        { name: `curl${tg}`, parent: 'neck', s: SP.CURL[i], pivot: [6.3, 22.5], at: () => [3.3, -61.5], soft: { key: 'nmcurl', dir: [0.3, -1], k: 160, c: 8, gain: 1.2, turn: 0.7, max: 18, flutter: 3, hz: 0.6 } },
        ...(i ? [{ name: 'face', parent: 'neck', s: (a) => headFace(a.nmMood ?? 'idle'), pivot: HEAD_PIVOT }] : []),
        ...farArm(true),
        { name: `upN${tg}`, parent: 'shN', s: SP.UPPER[0][i], pivot: [8, 4] },
        { name: `foreN${tg}`, parent: 'elbN', s: SP.FORE[0][i], pivot: [8, 3] },
        // The mug stays level in his hand (it turns back against the arm), tipped only on purpose.
        { name: `mug${tg}`, parent: 'gripN', s: SP.MUG[i], pivot: [6, 29], rot: (S) => (S.armN + S.elbN - S.tilt + S.mugT) * D2R },
        { name: `handN${tg}`, parent: 'wristN', s: SP.HAND[0][i], pivot: [7, 3] },
      ];
    }),
  ],
  under: shadow,
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Steam curling off his coffee; on a sip it puffs up round his glasses.
    const M = mat('mug');
    for (let k = 0; k < 3; k++) {
      const u = fr(a.now * 0.45 + k / 3);
      const [x, y] = at2(M, 10 + Math.sin(u * 6 + k) * 3, -4 - u * 22);
      puff(ctx, a, x, y, 2 + u * 4, (1 - u) * 0.4, '255,255,255');
    }
    const fog = Math.max(a.nmSip ?? 0, a.nmMood === 'fog' ? 1 : 0);
    if (fog > 0.3) {
      const H = mat('neck');
      for (let k = 0; k < 3; k++) {
        const u = fr(a.now * 0.7 + k / 3);
        const [x, y] = at2(H, -14 + k * 14, -40 - u * 18);
        puff(ctx, a, x, y, 3 + u * 5, (1 - u) * 0.35 * fog, '255,255,255');
      }
    }
  },
});
// Drawn at his game size (the parts are built at the sketch's scale).
const draw = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(K, K);
  draw(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * K);
rig.h = Math.round(rig.h * K);
export const nightManagerRig = rig;

// The still (portraits, previews): standing at ease, mug in hand, at his game size. Box 120 x 150,
// feet at (60, 146).
export function nightManagerStill(pose, f, mood) {
  const P = LEGS.at(0, 0);
  const by = -BODY;
  const legPieces = (k, far) => {
    const j = far ? 1 : 0;
    const [hx, hy] = HIPS[j];
    const th = P[`thigh${k}`];
    const sh = P[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = by + hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(shinP(far)(), [8, 4], kx, ky, th + sh), ...put(thighP(far)(), [8, 4], hx, by + hy, th), ...put(footP(far)(), [11, 6], ax, ay, 0)];
  };
  const arm = (j, a1, a2) => {
    const [sx, sy] = SH[j];
    const ex = sx - Math.sin(-a1 * D2R) * UA;
    const ey = by + sy + Math.cos(-a1 * D2R) * UA;
    const wx = ex - Math.sin(-(a1 + a2) * D2R) * (FA + 1);
    const wy = ey + Math.cos(-(a1 + a2) * D2R) * (FA + 1);
    return { up: put(upperP(j === 1)(), [8, 4], sx, by + sy, -a1), fore: put(foreP(j === 1)(), [8, 3], ex, ey, -(a1 + a2)), wrist: [wx, wy] };
  };
  const aN = arm(0, 22, 117);
  const aF = arm(1, -19, 39);
  const look = FACE[mood] ? mood : 'idle';
  const shapes = [
    ...aF.up, ...aF.fore,
    ...legPieces('F', true), ...legPieces('N', false),
    ...put(seatP(), [25, -3], 0, by), ...put(torsoP(), [35, 35], 0, by), ...put(tieP(), [6.5, 5], 1.5, by - 15), ...put(badgeP(), [7.5, 3], 10.5, by + 1),
    ...put(toHeadBox(headShapes()), HEAD_PIVOT, 0, by - 23), ...put(curlP(), [6.3, 22.5], 3.3, by - 23 - 61.5), ...put(toHeadBox(faceShapes(look)), HEAD_PIVOT, 0, by - 23),
    ...aN.up, ...aN.fore, ...put(mugP(), [6, 29], aN.wrist[0], aN.wrist[1], 0), ...put(handP(false)(), [7, 3], aN.wrist[0], aN.wrist[1], 0),
  ];
  return { w: 120, h: 150, res: 2, shapes: shift(shapes.map((s) => mapShape(s, ([x, y]) => [x * K, y * K], K)), 60, 146) };
}
