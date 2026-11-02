// Monster art: the Clockwork Carnival's wind-up toys (the levels 25-30 group dungeon, 2026-11, see
// docs/design/clockwork-carnival.md), on the toy rig (toyrig.js: the manor rig's skeleton on
// clockwork timing, a wind-up key in every back).
//   musicballerina  Music Box Ballerina: twirls on one toe atop the music box she rides; a
//                   spinning kick.
//   tindrummer      Tin Drummer Girl: marches knees-high in a shako, drum at her hip; a drumstick
//                   flurry.
//   jackbox         Jack-in-the-Box Jester: a jester on a spring out of her box; boings forward and
//                   bonks with a squeaky mallet.
//   marionette      Marionette Dancer: hangs from strings off a cross-bar, toes trailing; jerky
//                   kicks.
//   teddystrong     Teddy Strongwoman: a girl in a teddy-bear suit with a barbell; an overhead slam.
//   balloonseller   Balloon Seller: floats under a bunch of balloons; pops one at you.
// All face right, feet (or box) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { tickAt, windKey } from './toyrig.js';

const { within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
function keyed(pose, f, mood, K) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = tickAt(K.walk, f, 8);
  else if (pose === 'attack') P = tickAt(K.attack, f, 3, false, 0.6);
  else P = tickAt(K.idle, f, 6);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.22, tilt: -0.3, hip: [P.hip[0] - 1.5, P.hip[1]] };
  return P;
}
const keyAngle = (f, n) => (f / n) * TAU * 2;
const TIN = { key: '#ffd36b', keyDk: '#c8902a' };
const ball = (p, r, c) => ooval(p[0], p[1], r, r, c, 0, 0.35);

// ---------- Music Box Ballerina ----------

const MB = soften({
  skin: '#fff4f0', skinDk: '#f2dcd6', hair: '#ffd0e6', hairDk: '#f0a0c4', hairLt: '#fff0f8',
  tutu: '#ffb3d6', tutuDk: '#f088b8', tutuLt: '#ffe0f0', bodice: '#ffffff', bodiceDk: '#f0e0ec', tight: '#fff0f4', shoe: '#ff9ac0',
  box: '#9a7ad8', boxDk: '#7656b8', boxLt: '#c8b0f0', trim: '#ffd36b', trimDk: '#c8902a', mirror: '#dff6ff', note: '#ff7aa8',
});
const MB_FACE = { skin: MB.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ffa8c8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#ff8fc0', '#a8306a', '#ffe0f0', { rx: 3.4, ry: 2.6, tilt: 0.1, flicks: 3, lashLen: 1.1 }), brow: { c: '#f0a0c4', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.5, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// On one toe atop the box: the standing leg straight down, the other in arabesque or retiré.
const MB_K = {
  walk: [
    { hip: [36, 39], lean: 0.04, tilt: 0.05, arms: [[2.6, -0.3], [2.7, -0.3]], legs: [[-1.4, 0.1], [0, 0]], flip: 0 },
    { hip: [36, 39], lean: 0, tilt: 0, arms: [[1.6, -0.6], [1.6, -0.6]], legs: [[0.6, 1.8], [0, 0]], flip: 0 },
    { hip: [36, 39], lean: -0.04, tilt: -0.05, arms: [[2.6, -0.3], [2.7, -0.3]], legs: [[-1.4, 0.1], [0, 0]], flip: 1 },
    { hip: [36, 39], lean: 0, tilt: 0, arms: [[1.6, -0.6], [1.6, -0.6]], legs: [[0.6, 1.8], [0, 0]], flip: 1 },
  ],
  idle: [
    { hip: [36, 39], lean: 0, tilt: 0.1, arms: [[2.7, -0.4], [2.8, -0.4]], legs: [[0.6, 1.8], [0, 0]] },
    { hip: [36, 39], lean: 0.02, tilt: 0.16, arms: [[1.2, -1.2], [2.8, -0.4]], legs: [[-1.2, 0.1], [0, 0]] },
    { hip: [36, 39], lean: 0, tilt: 0.06, arms: [[2.7, -0.4], [2.8, -0.4]], legs: [[0.6, 1.8], [0, 0]] },
  ],
  // A fouetté whip: wind the leg in, then lash it out at the side in a kick.
  attack: [
    { hip: [35, 39], lean: -0.1, tilt: -0.1, arms: [[1.6, -0.4], [0.8, -0.8]], legs: [[0.8, 2], [0, 0]] },
    { hip: [37, 39], lean: -0.2, tilt: 0.1, arms: [[2.2, -0.2], [-0.6, -0.4]], legs: [[2, -0.1], [0, 0]], kick: 1 },
    { hip: [37, 39], lean: -0.22, tilt: 0.1, arms: [[2.2, -0.2], [-0.6, -0.4]], legs: [[2.1, -0.1], [0, 0]], kick: 1 },
    { hip: [36, 39], lean: 0, tilt: 0.06, arms: [[2.7, -0.4], [2.8, -0.4]], legs: [[0.6, 1.8], [0, 0]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function musicBox(C, f, n, open) {
  const out = [...opoly(round([[18, 78], [54, 78], [54, 64], [18, 64]], 1), C.box), fpoly([[18, 64], [24, 64], [24, 78], [18, 78]], C.boxDk)];
  out.push(line([[18, 66], [54, 66]], 1, C.trim), line([[18, 76], [54, 76]], 1, C.trim));
  for (const x of [26, 36, 46]) out.push(...ooval(x, 71, 1.6, 1.6, C.trim, 0, 0.3));
  // The lid open behind her, its little mirror catching light, and the crank turning.
  if (open) out.push(...opoly([[20, 64], [52, 64], [50, 50], [22, 50]], C.boxLt), fpoly([[26, 62], [46, 62], [44, 53], [28, 53]], C.mirror));
  const a = (f / n) * TAU;
  out.push(line([[54, 70], [57, 70]], 0.9, C.trimDk), line([[57, 70], [57 + Math.cos(a) * 3, 70 + Math.sin(a) * 3]], 0.9, C.trimDk), dot(57 + Math.cos(a) * 3, 70 + Math.sin(a) * 3, 0.9, C.trim));
  return out;
}

function musicballerina(pose, f, mood) {
  const C = fade(MB, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, MB_K);
  const S = mood === 'dead' ? plant(solve(P)) : solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a5a');
  const dead = mood === 'dead';
  const leg = (L, c) => [...limb3(L.hip, L.kn, L.ft, 2.8, 2.2, 1.6, c), ...ooval(L.ft[0], L.ft[1], 1.4, 1.8, C.shoe, 0, 0.3)];
  const draw = () => drawRig(S, {
    behind: () => [...(dead ? [] : musicBox(C, f, n, true)), ...windKey(S.chest[0] - 4, S.chest[1] + 2, keyAngle(f, n), TIN.key, TIN.keyDk)],
    backArm: () => armPart(S.arms[0], C.skinDk, C.skinDk),
    backLeg: () => leg(S.legs[0], C.tight),
    body: () => {
      const [hx, hy] = S.hip;
      // A stiff platter tutu in three layers of tulle, scalloped.
      const out = [];
      for (const [w, c] of [[11, C.tutuDk], [10, C.tutu], [8, C.tutuLt]]) out.push(...opoly(round([[hx - w, hy + 1.6], [hx - w * 0.4, hy - 1.6], [hx + w * 0.4, hy - 1.6], [hx + w, hy + 1.6], [hx + w * 0.4, hy + 3.2], [hx - w * 0.4, hy + 3.2]], 2), c));
      for (let k = 0; k < 6; k++) out.push(dot(hx - 9 + k * 3.6, hy + 2.2, 0.5, '#ffffff'));
      out.push(...bodice(S, C.bodice, C.bodiceDk));
      const [cx, cy] = S.chest;
      out.push(...ooval(cx, cy + 3, 1.4, 1.2, C.tutu), dot(cx, cy + 2.8, 0.5, '#ffffff'));
      return out;
    },
    frontLeg: () => leg(S.legs[1], C.tight),
    head: () => headPart(S, mood, MB_FACE, SWEPT, HR, 1.12, () => backHair(HR, 5), () => [
      // A neat bun with a ring of tiny roses, a tiara of pearls.
      ...ooval(-4.6, -8.4, 3.6, 3.4, C.hair), fband(arcPts(-4.6, -8.4, 2.6, 2.4, 180, 330, 6), 0.5, C.hairDk, 1),
      ...[0, 1, 2, 3].flatMap((k) => ooval(-4.6 + Math.cos(k * 1.6) * 3.6, -8.4 + Math.sin(k * 1.6) * 3.4, 0.9, 0.9, C.note, 0, 0.25)),
      ...[0, 1, 2, 3, 4].map((k) => dot(-3 + k * 2.2, -8 - Math.sin((k / 4) * Math.PI) * 1.6, 0.55, '#ffffff')),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.skin, C.skin)];
      if (!dead) out.push(...ooval(S.head[0] + 12, S.head[1] - 6 + Math.sin(ph) * 2, 1.2, 1, C.note), line([[S.head[0] + 13, S.head[1] - 6 + Math.sin(ph) * 2], [S.head[0] + 13, S.head[1] - 11 + Math.sin(ph) * 2]], 0.5, C.note));
      if (P.kick > 0.5 && f === 1) out.push(fband(arcPts(S.hip[0], S.hip[1], 22, 12, -40, 60, 8), (t) => 2.6 * Math.sin(Math.PI * t), mix(C.tutuLt, '#ffffff', 0.4), 1), sparkle(S.legs[0].ft[0] + 2, S.legs[0].ft[1], 2.2, '#ffffff'));
      return out;
    },
  });
  // Her twirl: a clean mirror flip at each half turn, never a squeeze.
  const shapes = P.flip > 0.5 ? within((x, y) => [72 - x, y], draw) : draw();
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Tin Drummer Girl ----------

const TD = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ff8a5a', hairDk: '#d8603a', hairLt: '#ffc0a0',
  coat: '#e04a5a', coatDk: '#b8303e', coatLt: '#ff8a96', braid: '#ffd36b', pants: '#ffffff', pantsDk: '#e0dcec', boot: '#3a3466',
  shako: '#3a4aa8', shakoDk: '#2a3480', plume: '#ffffff', drum: '#fff4e0', drumDk: '#e8d0b0', rim: '#ffd36b', rimDk: '#c8902a', stick: '#c99a6b',
});
const TD_FACE = { skin: TD.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ff9aa8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#4a7ae0', '#1a3a8a', '#d0e0ff', { rx: 3.3, ry: 3 }), brow: { c: '#d8603a', kind: 'straight', w: 0.8 }, moods: { idle: { open: 0.95, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// A parade march: one knee snapped up high, held, then the other.
const TD_K = {
  walk: [
    { hip: [36, 45], lean: 0, tilt: 0, arms: [[0.9, -1.6], [0.7, -1.8]], legs: [[-0.1, 0.1], [1.5, -1.6]], beat: 0 },
    { hip: [36, 46], lean: 0, tilt: 0.02, arms: [[0.7, -1.8], [0.9, -1.6]], legs: [[0.05, 0.05], [0.05, 0.05]], beat: 1 },
    { hip: [36, 45], lean: 0, tilt: 0, arms: [[0.9, -1.6], [0.7, -1.8]], legs: [[1.5, -1.6], [-0.1, 0.1]], beat: 0 },
    { hip: [36, 46], lean: 0, tilt: -0.02, arms: [[0.7, -1.8], [0.9, -1.6]], legs: [[0.05, 0.05], [0.05, 0.05]], beat: 1 },
  ],
  idle: [
    { hip: [36, 46], lean: -0.03, tilt: -0.04, arms: [[0.8, -1.7], [0.8, -1.7]], legs: [[-0.1, 0], [0.12, 0]], beat: 0 },
    { hip: [36, 46], lean: -0.03, tilt: 0.04, arms: [[0.5, -2.2], [0.9, -1.6]], legs: [[-0.1, 0], [0.12, 0]], beat: 1 },
    { hip: [36, 46], lean: -0.03, tilt: -0.04, arms: [[0.9, -1.6], [0.5, -2.2]], legs: [[-0.1, 0], [0.12, 0]], beat: 1 },
  ],
  // A drumroll flurry: sticks up, then a thunder of beats with sound rings pounding out.
  attack: [
    { hip: [35, 46], lean: -0.1, tilt: -0.1, arms: [[0.1, -2.8], [0.1, -2.8]], legs: [[-0.3, 0.1], [0.3, 0.05]], beat: 0 },
    { hip: [37, 46], lean: 0.12, tilt: 0.08, arms: [[1, -1.4], [0.6, -1.9]], legs: [[-0.3, 0.1], [0.3, 0.05]], beat: 1 },
    { hip: [37, 46], lean: 0.12, tilt: 0.06, arms: [[0.6, -1.9], [1, -1.4]], legs: [[-0.3, 0.1], [0.3, 0.05]], beat: 1 },
    { hip: [36, 46], lean: 0, tilt: 0, arms: [[0.8, -1.7], [0.8, -1.7]], legs: [[-0.1, 0], [0.12, 0]], beat: 0 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function tindrummer(pose, f, mood) {
  const C = fade(TD, mood);
  const n = frames(pose);
  const P = keyed(pose, f, mood, TD_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a1a');
  const [hx, hy] = S.hip;
  const drumC = [hx + 6, hy + 1];
  const stick = (A) => {
    const a = A.a - Math.PI / 2 - 0.6;
    return [...oband([A.hand, [A.hand[0] + Math.cos(a) * 9, A.hand[1] + Math.sin(a) * 9]], taperW(1.1, 0.7), C.stick, 1, 0.3), dot(A.hand[0] + Math.cos(a) * 9, A.hand[1] + Math.sin(a) * 9, 1.1, '#ffffff')];
  };
  const shapes = drawRig(S, {
    behind: () => windKey(S.chest[0] - 5, S.chest[1] + 3, keyAngle(f, n), TIN.key, TIN.keyDk),
    backArm: () => [...stick(S.arms[0]), ...armPart(S.arms[0], C.coatDk, C.skinDk)],
    backLeg: () => legPart(S.legs[0], C.pantsDk, C.boot),
    body: () => {
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 5.4, hy + 3.6], [hx - 5.4, hy + 3.6]], 1), C.coat)];
      out.push(...bodice(S, C.coat, C.coatDk));
      const [cx, cy] = S.chest;
      // Gold frogging across the jacket, epaulettes, a white crossbelt.
      for (let k = 0; k < 4; k++) out.push(line([[lerp(cx, hx, 0.15 + k * 0.2) - 2.4, lerp(cy, hy, 0.15 + k * 0.2) + 1], [lerp(cx, hx, 0.15 + k * 0.2) + 2.6, lerp(cy, hy, 0.15 + k * 0.2) + 1]], 0.6, C.braid));
      out.push(line([[cx - 3.4, cy], [hx + 4, hy - 1]], 1, C.pants));
      const [sx, sy] = S.arms[1].sh;
      out.push(...ooval(sx, sy, 2.8, 1.6, C.braid), ...[0, 1, 2].map((k) => line([[sx - 2 + k * 2, sy + 1], [sx - 2.2 + k * 2, sy + 3]], 0.5, C.braid)));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.pants, C.boot),
    head: () => headPart(S, mood, TD_FACE, BANGS, HR, 1.1, () => backHair(HR, 7), () => {
      // A tall shako with a gold plate, a chin strap and a white plume.
      const out = [...opoly(round([[-6.6, -5], [6.6, -5.6], [5.6, -16], [-5.4, -15.4]], 1), C.shako), fpoly([[-6.6, -5], [-2.6, -5.2], [-2.4, -15.6], [-5.4, -15.4]], C.shakoDk)];
      out.push(...opoly([[-7.6, -4], [7.6, -4.6], [7.4, -6], [-7.4, -5.6]], C.shakoDk), ...KIT.gem(1, -9.6, 1.8, C.rim), fband(arcPts(0.4, -15.6, 5.6, 1, 180, 360, 6), 0.6, C.braid, 1));
      out.push(...oband([[0, -16], [-1, -21], [-3, -24]], taperW(2.4, 0.6), C.plume, 3, 0.3));
      return out;
    }),
    frontArm: () => {
      const out = [];
      // The drum slung at her hip: a white shell, gold rims and zigzag cords.
      out.push(...opoly(round([[drumC[0] - 5, drumC[1] - 3], [drumC[0] + 5, drumC[1] - 3], [drumC[0] + 5, drumC[1] + 5], [drumC[0] - 5, drumC[1] + 5]], 1), C.drum));
      out.push(...ooval(drumC[0], drumC[1] - 3, 5, 1.6, C.drumDk), line([[drumC[0] - 5, drumC[1] - 2.6], [drumC[0] + 5, drumC[1] - 2.6]], 0.8, C.rim), line([[drumC[0] - 5, drumC[1] + 4.6], [drumC[0] + 5, drumC[1] + 4.6]], 0.8, C.rim));
      for (let k = 0; k < 4; k++) out.push(line([[drumC[0] - 4.6 + k * 3, drumC[1] - 2], [drumC[0] - 3 + k * 3, drumC[1] + 4]], 0.4, C.coat));
      out.push(...stick(S.arms[1]), ...armPart(S.arms[1], C.coat, C.skin));
      if (P.beat > 0.5 && pose !== 'walk') {
        // Beats ring out off the drumhead.
        const k = pose === 'attack' ? 1.4 : 0.7;
        for (let r = 0; r < 2; r++) out.push(fband(arcPts(drumC[0] + 4, drumC[1] - 4, 5 * k + r * 4, 3 * k + r * 3, -70, 50, 6), 0.7, mix(C.braid, '#ffffff', 0.4), 1));
        if (pose === 'attack') out.push(sparkle(drumC[0] + 16, drumC[1] - 8, 2.4, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Jack-in-the-Box Jester ----------

const JB = soften({
  skin: '#fff4f0', skinDk: '#f2dcd6', hair: '#c9a6ff', hairDk: '#9a7ad8', hairLt: '#f0e6ff',
  suit: '#ff7aa8', suitDk: '#e0507e', suit2: '#7fd8ff', suit2Dk: '#4aa8e0', ruff: '#ffffff', ruffDk: '#e6e0f2', bell: '#ffd36b',
  box: '#ffd36b', boxDk: '#e0a82a', boxLt: '#fff0b0', spring: '#d8e2f6', springDk: '#a8b4d8', mallet: '#ff9ab8', handle: '#c99a6b',
});
const JB_FACE = { skin: JB.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ff9ab8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#9a6ae0', '#4a2a8a', '#ece0ff', { rx: 3.6, ry: 3.2, tilt: -0.1 }), brow: { c: '#9a7ad8', kind: 'arched', w: 0.7 }, moods: { idle: { open: 1, mouth: 'grin' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// Her hips ride the top of the spring; the spring's coil length is `rise`.
const JB_K = {
  walk: [
    { hip: [36, 46], lean: 0.08, tilt: 0.1, arms: [[1.2, -1.6], [1.4, -1.8]], legs: [[0, 0], [0, 0]], rise: 0.4, box: 0 },
    { hip: [36, 35], lean: -0.06, tilt: -0.12, arms: [[2.4, -0.6], [2.6, -0.6]], legs: [[0, 0], [0, 0]], rise: 1, box: -3 },
    { hip: [36, 46], lean: 0.08, tilt: 0.1, arms: [[1.2, -1.6], [1.4, -1.8]], legs: [[0, 0], [0, 0]], rise: 0.4, box: 0 },
    { hip: [36, 38], lean: 0, tilt: 0, arms: [[1.8, -1.2], [2, -1.2]], legs: [[0, 0], [0, 0]], rise: 0.7, box: 0 },
  ],
  idle: [
    { hip: [36, 40], lean: 0, tilt: 0.1, arms: [[0.6, -1.8], [0.8, -2]], legs: [[0, 0], [0, 0]], rise: 0.7, box: 0 },
    { hip: [36, 36], lean: 0.04, tilt: -0.12, arms: [[0.8, -2], [1, -2.2]], legs: [[0, 0], [0, 0]], rise: 0.85, box: 0 },
    { hip: [36, 42], lean: -0.04, tilt: 0.16, arms: [[0.6, -1.8], [0.8, -2]], legs: [[0, 0], [0, 0]], rise: 0.6, box: 0 },
  ],
  // The spring crouches down into the box, then launches her forward for a squeaky bonk.
  attack: [
    { hip: [34, 50], lean: -0.14, tilt: -0.12, arms: [[0.4, -1], [-1.2, -1.6]], legs: [[0, 0], [0, 0]], rise: 0.2, box: 0 },
    { hip: [46, 38], lean: 0.6, tilt: 0.2, arms: [[-0.4, -0.4], [2.6, -0.6]], legs: [[0, 0], [0, 0]], rise: 1, box: 0 },
    { hip: [46, 39], lean: 0.5, tilt: 0.18, arms: [[-0.4, -0.4], [1.4, -0.2]], legs: [[0, 0], [0, 0]], rise: 1, box: 0, bonk: 1 },
    { hip: [36, 40], lean: 0, tilt: 0.1, arms: [[0.6, -1.8], [0.8, -2]], legs: [[0, 0], [0, 0]], rise: 0.7, box: 0 },
  ],
  dead: { hip: [36, 62], lean: 0.8, tilt: 0.6, arms: [[0.3, 0.2], [0.5, 0.2]], legs: [[0, 0], [0, 0]], rise: 0, box: 0 },
};

function jackbox(pose, f, mood) {
  const C = fade(JB, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, JB_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#3a2a6a');
  const by = 78 + (P.box ?? 0);
  const shapes = drawRig(S, {
    behind: () => {
      // The box, its lid flung open behind her, a crank turning at its side.
      const out = [...opoly([[24, by - 14], [48, by - 14], [44, by - 26], [20, by - 22]], C.boxLt)];
      out.push(...opoly(round([[22, by], [50, by], [50, by - 14], [22, by - 14]], 1), C.box), fpoly([[22, by - 14], [27, by - 14], [27, by], [22, by]], C.boxDk));
      for (const [x, y, c] of [[31, by - 7, '#ff7aa8'], [41, by - 7, '#7fd8ff']]) out.push(...opoly([[x - 3, y], [x, y - 3.4], [x + 3, y], [x, y + 3.4]], c, 0.3));
      const a = (f / n) * TAU;
      out.push(line([[50, by - 7], [53, by - 7]], 0.9, C.boxDk), dot(53 + Math.cos(a) * 2.4, by - 7 + Math.sin(a) * 2.4, 1, C.boxDk));
      // The spring: a coil from the box up to her hips, its turns spreading as it rises.
      const [hx, hy] = S.hip;
      const base = [36, by - 14];
      const coils = 6;
      const pts = [];
      for (let i = 0; i <= coils * 2; i++) {
        const u = i / (coils * 2);
        pts.push([lerp(base[0], hx, u) + (i % 2 ? 4 : -4), lerp(base[1], hy + 4, u)]);
      }
      out.push(fband(pts, 1.4, C.springDk, 1), fband(pts.map(([x, y]) => [x - 0.4, y - 0.4]), 0.6, C.spring, 1));
      out.push(...windKey(S.chest[0] - 5, S.chest[1] + 3, keyAngle(f, n), TIN.key, TIN.keyDk));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.suit2Dk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      // A harlequin suit in diamonds, a puffed jester skirt of points, a big ruff.
      const out = [];
      for (let k = 0; k < 5; k++) out.push(...opoly([[hx - 6 + k * 3, hy - 1], [hx - 4.5 + k * 3, hy + 5 + (k % 2)], [hx - 3 + k * 3, hy - 1]], k % 2 ? C.suit : C.suit2, 0.4));
      out.push(...bodice(S, C.suit, C.suitDk));
      for (let k = 0; k < 3; k++) out.push(fpoly([[lerp(cx, hx, 0.2 + k * 0.28), lerp(cy, hy, 0.2 + k * 0.28) - 1.6], [lerp(cx, hx, 0.2 + k * 0.28) + 1.6, lerp(cy, hy, 0.2 + k * 0.28)], [lerp(cx, hx, 0.2 + k * 0.28), lerp(cy, hy, 0.2 + k * 0.28) + 1.6], [lerp(cx, hx, 0.2 + k * 0.28) - 1.6, lerp(cy, hy, 0.2 + k * 0.28)]], C.suit2));
      for (let k = 0; k < 7; k++) out.push(...ooval(cx - 4.2 + k * 1.4, cy - 1.2 + Math.abs(k - 3) * 0.2, 1.3, 1.1, k % 2 ? C.ruff : C.ruffDk, 0, 0.25));
      return out;
    },
    head: () => headPart(S, mood, JB_FACE, BANGS, HR, 1.14, () => backHair(HR, 6), () => {
      // A jester's cap with two floppy points, a bell on each, bobbing a beat behind her.
      const flop = Math.sin(ph - 1) * 0.25;
      const out = [...opoly(round([[-7.6, -4], [7.4, -4.6], [6, -9], [-6, -8.6]], 1), C.suit)];
      out.push(...oband([[-4, -8.4], [-9, -12 + flop * 4], [-12 + flop * 3, -6 + flop * 6]], taperW(4.4, 1), C.suit2, 3), ...oband([[3, -8.6], [8, -13 - flop * 4], [12 - flop * 3, -8 - flop * 6]], taperW(4.4, 1), C.suit, 3));
      out.push(...ooval(-12 + flop * 3, -5.4 + flop * 6, 1.4, 1.4, C.bell), ...ooval(12 - flop * 3, -7.4 - flop * 6, 1.4, 1.4, C.bell));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const a = A.a - Math.PI / 2 - 0.4;
      const head = [A.hand[0] + Math.cos(a) * 9, A.hand[1] + Math.sin(a) * 9];
      const out = [...oband([A.hand, head], 0.9, C.handle, 1, 0.3), ...opoly(round([[head[0] - 3, head[1] - 2.4], [head[0] + 3, head[1] - 2.4], [head[0] + 3, head[1] + 2.4], [head[0] - 3, head[1] + 2.4]], 2), C.mallet)];
      out.push(...armPart(A, C.suit2, C.skin));
      if (P.bonk > 0.5) out.push(sparkle(head[0] + 5, head[1], 3, '#ffffff'), sparkle(head[0] + 2, head[1] - 5, 1.6, C.bell), sparkle(head[0] + 6, head[1] + 5, 1.4, '#ff7aa8'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Marionette Dancer ----------

const MR = soften({
  skin: '#ffe8d6', skinDk: '#ecc8b0', joint: '#e0b896', hair: '#a85a3a', hairDk: '#7a3a2a', hairLt: '#d8906a',
  dress: '#7fd8a8', dressDk: '#4ab888', dressLt: '#c0f0d8', apron: '#ffffff', sock: '#ffffff', shoe: '#e0507e',
  bar: '#c99a6b', barDk: '#985a48', thread: '#f2ecff', cheek: '#ff8a8a',
});
const MR_FACE = { skin: MR.skin, skinSh: '#ecc8b0', skinSh2: '#d0a088', blush: '#ff8a8a', blushK: 1.4, lip: '#e0505e', lipLine: '#a8303e', eye: eyes('#4a3a2a', '#1a1010', '#a88a6a', { rx: 3, ry: 3, pupil: 'round', jewel: false }), brow: { c: '#7a3a2a', kind: 'soft', w: 0.7 }, moods: { idle: { open: 1, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// She hangs from the cross-bar: limbs dangle loose, then a string jerks one up and it drops back.
const MR_K = {
  walk: [
    { hip: [36, 44], lean: 0.06, tilt: 0.1, arms: [[0.6, 0.2], [1.6, -1.2]], legs: [[-0.3, 0.6], [0.9, -0.2]] },
    { hip: [36, 42], lean: -0.04, tilt: -0.08, arms: [[1.6, -1.2], [0.6, 0.2]], legs: [[0.9, -0.2], [-0.3, 0.6]] },
    { hip: [36, 44], lean: 0.06, tilt: 0.1, arms: [[0.6, 0.2], [1.6, -1.2]], legs: [[-0.3, 0.6], [0.9, -0.2]] },
    { hip: [36, 42], lean: -0.04, tilt: -0.08, arms: [[1.6, -1.2], [0.6, 0.2]], legs: [[0.9, -0.2], [-0.3, 0.6]] },
  ],
  idle: [
    { hip: [36, 44], lean: 0, tilt: 0.3, arms: [[0.2, 0.3], [0.3, 0.3]], legs: [[0.1, 0.3], [-0.1, 0.4]] },
    { hip: [36, 43], lean: 0, tilt: -0.2, arms: [[2.2, -0.6], [0.3, 0.3]], legs: [[0.1, 0.3], [-0.1, 0.4]] },
    { hip: [36, 44], lean: 0, tilt: 0.2, arms: [[0.2, 0.3], [2.4, -0.4]], legs: [[0.8, -1.2], [-0.1, 0.4]] },
  ],
  attack: [
    { hip: [35, 42], lean: -0.1, tilt: -0.1, arms: [[1.2, -0.4], [1.2, -0.4]], legs: [[0.1, 0.2], [-0.4, 1.8]] },
    { hip: [38, 42], lean: -0.2, tilt: 0.12, arms: [[2, 0], [-0.4, 0]], legs: [[0.1, 0.2], [1.8, -0.1]] },
    { hip: [38, 42], lean: -0.2, tilt: 0.12, arms: [[2, 0], [-0.4, 0]], legs: [[0.1, 0.2], [1.85, -0.1]] },
    { hip: [36, 44], lean: 0, tilt: 0.3, arms: [[0.2, 0.3], [0.3, 0.3]], legs: [[0.1, 0.3], [-0.1, 0.4]] },
  ],
  dead: { hip: [36, 60], lean: 0.2, tilt: 0.8, arms: [[0.1, 0.2], [0.2, 0.2]], legs: [[1.4, -2.6], [1.2, -2.4]] },
};

function marionette(pose, f, mood) {
  const C = fade(MR, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, MR_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#3a1a10');
  const dead = mood === 'dead';
  // The cross-bar sways above her, a little behind each move.
  const bx = S.head[0] + Math.sin(ph - 1) * 2;
  const bar = [bx, 2 + Math.cos(ph) * 0.6];
  const woodLimb = (a, b, c, col, w) => [...limb3(a, b, c, w, w * 0.8, w * 0.7, col), ...ball(b, w * 0.55, C.joint)];
  const shapes = drawRig(S, {
    behind: () => {
      const out = [];
      if (!dead) {
        // The strings, from the bar to her head, wrists and knees.
        for (const p of [S.head, S.arms[0].hand, S.arms[1].hand, S.legs[0].kn, S.legs[1].kn]) out.push(line([[bar[0] + (p[0] - bar[0]) * 0.15, bar[1]], [p[0], p[1] - (p === S.head ? 9 : 0)]], 0.3, C.thread));
      }
      out.push(...windKey(S.chest[0] - 5, S.chest[1] + 3, keyAngle(f, n), TIN.key, TIN.keyDk));
      return out;
    },
    backArm: () => woodLimb(S.arms[0].sh, S.arms[0].el, S.arms[0].hand, C.skinDk, 2.2),
    backLeg: () => [...woodLimb(S.legs[0].hip, S.legs[0].kn, S.legs[0].ft, C.sock, 2.6), ...ooval(S.legs[0].ft[0] + 0.8, S.legs[0].ft[1], 2, 1.2, C.shoe, 0, 0.3)],
    body: () => {
      const g = gown(S, 9, 7, C.dress, C.dressDk, Math.sin(ph) * 1.2);
      const out = [...g.out, ...bodice(S, C.dress, C.dressDk)];
      const [hx, hy] = S.hip;
      out.push(...opoly(round([[hx - 2.4, hy - 1], [hx + 3, hy - 1], [hx + 4, hy + 7], [hx - 3, hy + 7]], 2), C.apron));
      for (let k = 0; k < 4; k++) out.push(...ooval(hx - 2.6 + k * 2.2, hy + 7.4, 1, 0.7, C.apron, 0, 0.25));
      out.push(...ball(S.arms[1].sh, 1.6, C.joint));
      return out;
    },
    frontLeg: () => [...woodLimb(S.legs[1].hip, S.legs[1].kn, S.legs[1].ft, C.sock, 2.6), ...ooval(S.legs[1].ft[0] + 0.8, S.legs[1].ft[1], 2, 1.2, C.shoe, 0, 0.3)],
    head: () => headPart(S, mood, MR_FACE, BANGS, HR, 1.14, () => [...backHair(HR, 6), ...[-1, 1].flatMap((s) => KIT.lockHair([[s * 6.4, 0], [s * 7.6, 5], [s * 7, 9]], 3, HR))], () => [
      // Painted round cheeks, a ribbon bow, the seam line of a wooden jaw.
      ...ooval(-5.6, -5.4, 2.2, 1.6, C.dressLt, -0.4), ...ooval(-7.4, -4, 1.8, 1.2, C.dressLt, 0.6), dot(-5, -5, 0.7, C.dressDk),
      line([[2.6, 9], [3.6, 12.2]], 0.35, C.skinDk), line([[9.6, 8.6], [9, 11.6]], 0.35, C.skinDk),
    ]),
    frontArm: () => {
      const out = [...woodLimb(S.arms[1].sh, S.arms[1].el, S.arms[1].hand, C.skin, 2.2)];
      if (!dead) out.push(...oband([[bar[0] - 9, bar[1]], [bar[0] + 9, bar[1]]], 1.6, C.bar, 1, 0.3), ...oband([[bar[0], bar[1] - 5], [bar[0], bar[1] + 3]], 1.4, C.barDk, 1, 0.3));
      if (pose === 'attack' && (f === 1 || f === 2)) out.push(fband(arcPts(S.hip[0], S.hip[1] + 6, 20, 12, -50, 30, 8), (t) => 2.4 * Math.sin(Math.PI * t), mix(C.dressLt, '#ffffff', 0.4), 1), sparkle(S.legs[1].ft[0] + 3, S.legs[1].ft[1], 2.2, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Teddy Strongwoman ----------

const TB = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#8a5a3a', hairDk: '#5a3a2a', hairLt: '#b8885a',
  fur: '#c9905a', furDk: '#a06a3a', furLt: '#f0c890', belly: '#ffe6c8', bow: '#ff7aa8', bar: '#8a90a8', barDk: '#5a607a', weight: '#3a3466', weightLt: '#6a62a8', star: '#ffd36b',
});
const TB_FACE = { skin: TB.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa0a0', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#8a5a3a', '#3a1a0a', '#e6c8a8', { rx: 3.2, ry: 2.9 }), brow: { c: '#5a3a2a', kind: 'straight', w: 1 }, moods: { idle: { open: 0.9, mouth: 'grin' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// A heavy stomp: wide steps, body rocking side to side, the barbell on her shoulders.
const BARU = [[-0.1, -2.6], [0.2, -2.6]];
const TB_K = {
  walk: [
    { hip: [36, 47], lean: 0.02, tilt: 0.08, arms: BARU, legs: [[-0.5, 0.2], [0.4, 0.05]] },
    { hip: [36, 45.6], lean: 0, tilt: -0.04, arms: BARU, legs: [[0, 0.8], [0.1, 0.05]] },
    { hip: [36, 47], lean: 0.02, tilt: -0.08, arms: BARU, legs: [[0.4, 0.05], [-0.5, 0.2]] },
    { hip: [36, 45.6], lean: 0, tilt: 0.04, arms: BARU, legs: [[0.1, 0.05], [0, 0.8]] },
  ],
  idle: [
    { hip: [36, 47], lean: -0.03, tilt: 0.06, arms: BARU, legs: [[-0.25, 0], [0.28, 0]] },
    { hip: [36, 48], lean: -0.02, tilt: -0.06, arms: [[-0.1, -2.7], [0.2, -2.7]], legs: [[-0.3, 0.2], [0.32, 0.2]] },
    { hip: [36, 47], lean: -0.03, tilt: 0.06, arms: BARU, legs: [[-0.25, 0], [0.28, 0]] },
  ],
  // The barbell hoisted overhead, then slammed down ahead of her: the floor jumps.
  attack: [
    { hip: [35, 48], lean: -0.1, tilt: -0.08, arms: [[-0.8, -2.2], [-0.6, -2.2]], legs: [[-0.4, 0.4], [0.4, 0.4]] },
    { hip: [35, 46], lean: -0.16, tilt: -0.12, arms: [[-2.6, -0.4], [-2.4, -0.4]], legs: [[-0.3, 0.1], [0.3, 0.1]] },
    { hip: [39, 49], lean: 0.4, tilt: 0.14, arms: [[1.2, -0.3], [1.4, -0.3]], legs: [[-0.6, 0.5], [0.5, 0.5]], slam: 1 },
    { hip: [36, 47], lean: -0.03, tilt: 0.06, arms: BARU, legs: [[-0.25, 0], [0.28, 0]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function teddystrong(pose, f, mood) {
  const C = fade(TB, mood);
  const n = frames(pose);
  const P = keyed(pose, f, mood, TB_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#2a1a10');
  const [h0, h1] = [S.arms[0].hand, S.arms[1].hand];
  const dead = mood === 'dead';
  const barbell = () => {
    const d = [h1[0] - h0[0], h1[1] - h0[1]];
    const l = Math.hypot(...d) || 1;
    const u = [d[0] / l, d[1] / l];
    const a = [h0[0] - u[0] * 9, h0[1] - u[1] * 9];
    const b = [h1[0] + u[0] * 9, h1[1] + u[1] * 9];
    const out = [...oband([a, b], 1.2, C.bar, 1, 0.3)];
    for (const p of [a, b]) out.push(...ooval(p[0], p[1], 3.4, 4.6, C.weight, Math.atan2(u[1], u[0])), dot(p[0] - 0.8, p[1] - 1.2, 1, C.weightLt));
    return out;
  };
  const furLimb = (A, back) => [...limb3(A.sh, A.el, A.hand, 3.4, 3, 2.6, back ? C.furDk : C.fur), ...ooval(A.hand[0], A.hand[1], 2, 1.8, C.furLt)];
  const furLeg = (L, back) => [...limb3(L.hip, L.kn, L.ft, 4, 3.6, 3, back ? C.furDk : C.fur), ...ooval(L.ft[0] + 1, L.ft[1] - 0.4, 3, 1.6, C.furLt)];
  const shapes = drawRig(S, {
    behind: () => [...windKey(S.chest[0] - 6, S.chest[1] + 3, keyAngle(f, n), TIN.key, TIN.keyDk), ...(dead ? [] : barbell())],
    backArm: () => furLimb(S.arms[0], true),
    backLeg: () => furLeg(S.legs[0], true),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 6, hy - 2], [hx + 6, hy - 2], [hx + 6.4, hy + 4], [hx - 6.4, hy + 4]], 3), C.fur)];
      out.push(...bodice(S, C.fur, C.furDk));
      const [cx, cy] = S.chest;
      // The round belly patch with a star stitched on, a pink bow at the collar, a little tail.
      out.push(...ooval(lerp(cx, hx, 0.55) + 1, lerp(cy, hy, 0.55), 4.4, 5.6, C.belly), ...KIT.gem(lerp(cx, hx, 0.5) + 1, lerp(cy, hy, 0.5), 1.4, C.star));
      out.push(...ooval(cx - 1.6, cy - 0.6, 1.8, 1.2, C.bow, -0.4), ...ooval(cx + 1.6, cy - 0.6, 1.8, 1.2, C.bow, 0.4), dot(cx, cy - 0.6, 0.8, mix(C.bow, '#000000', 0.2)));
      out.push(...ooval(hx - 6.6, hy + 1, 2, 2, C.furLt));
      return out;
    },
    frontLeg: () => furLeg(S.legs[1], false),
    head: () => headPart(S, mood, TB_FACE, BANGS, HR, 1.12, () => backHair(HR, 5), () => {
      // The bear hood: round ears with pink insides, a muzzle-shaped brim over the brow.
      const out = [...opoly(round([[-8.4, 2], [-8.6, -5], [-4, -10.4], [3.4, -10.6], [8.4, -6], [8.8, 0], [6.6, -2], [6, -6.6], [1.6, -8.4], [-3.4, -7.8], [-6.6, -3.4], [-6.6, 2]], 2), C.fur)];
      for (const [x, y] of [[-6, -10], [5, -10.6]]) out.push(...ooval(x, y, 3, 3, C.fur), ...ooval(x, y + 0.4, 1.6, 1.6, C.bow, 0, 0.25));
      return out;
    }),
    frontArm: () => {
      const out = [...furLimb(S.arms[1], false)];
      if (P.slam > 0.5) {
        const x = S.hip[0] + 22;
        out.push(...barbell());
        for (let r = 0; r < 2; r++) out.push(fband(arcPts(x, 77, 10 + r * 7, 3 + r * 2, 180, 360, 10), 1, mix(C.star, '#ffffff', 0.3), 1));
        out.push(sparkle(x, 70, 3, '#ffffff'), sparkle(x + 10, 72, 1.6, C.star), sparkle(x - 9, 73, 1.4, C.star));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Balloon Seller ----------

const BS = soften({
  skin: '#fff4f0', skinDk: '#f2dcd6', hair: '#7fd8a8', hairDk: '#4ab888', hairLt: '#c8f6dc',
  dress: '#ffd36b', dressDk: '#e0a82a', dressLt: '#fff0b0', stripe: '#ff7aa8', sock: '#ffffff', shoe: '#7a62c8', string: '#f2ecff',
  b1: '#ff7aa8', b2: '#7fd8ff', b3: '#ffd36b', b4: '#9ae6a8', b5: '#c9a6ff',
});
const BS_FACE = { skin: BS.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ffa8c4', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#ff9a5a', '#a84a1a', '#ffe6d0', { rx: 3.5, ry: 3.1 }), brow: { c: '#4ab888', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.95, mouth: 'grin' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// She floats, legs dangling and kicking idly, her balloon arm up.
const BS_K = {
  walk: [0, 1, 2, 3].map((i) => {
    const s = Math.sin((i / 4) * TAU);
    return { hip: [36, 46 + s * 1.6], lean: 0.08, tilt: s * 0.06, arms: [[0.6, -0.8], [2.5, -0.5]], legs: [[0.4 + s * 0.3, 0.8], [0.1 - s * 0.3, 0.6]] };
  }),
  idle: [
    { hip: [36, 46], lean: 0, tilt: 0.08, arms: [[0.6, -0.8], [2.5, -0.5]], legs: [[0.2, 0.7], [-0.1, 0.4]] },
    { hip: [36, 44.6], lean: 0, tilt: -0.06, arms: [[0.8, -1], [2.6, -0.5]], legs: [[0.6, 1.2], [0, 0.3]] },
    { hip: [36, 45.4], lean: 0, tilt: 0.1, arms: [[0.6, -0.8], [2.5, -0.5]], legs: [[0.2, 0.7], [0.5, 1]] },
  ],
  attack: [
    { hip: [35, 45], lean: -0.1, tilt: -0.1, arms: [[-0.8, -1.4], [2.5, -0.5]], legs: [[0.2, 0.7], [-0.1, 0.4]] },
    { hip: [38, 46], lean: 0.18, tilt: 0.1, arms: [[1.8, -0.4], [2.5, -0.5]], legs: [[0.4, 0.9], [0, 0.3]], pop: 1 },
    { hip: [38, 46], lean: 0.14, tilt: 0.08, arms: [[1.9, -0.3], [2.5, -0.5]], legs: [[0.4, 0.9], [0, 0.3]], pop: 1 },
    { hip: [36, 46], lean: 0, tilt: 0.08, arms: [[0.6, -0.8], [2.5, -0.5]], legs: [[0.2, 0.7], [-0.1, 0.4]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function balloon(x, y, r, c) {
  return [...ooval(x, y, r, r * 1.15, c), dot(x - r * 0.35, y - r * 0.45, r * 0.25, '#ffffff'), ...opoly([[x - 0.8, y + r * 1.15], [x + 0.8, y + r * 1.15], [x, y + r * 1.15 + 1.4]], c, 0.3)];
}

function balloonseller(pose, f, mood) {
  const C = fade(BS, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, BS_K);
  const S = mood === 'dead' ? plant(solve(P)) : solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a5a3a');
  const dead = mood === 'dead';
  const hand = S.arms[1].hand;
  const bunch = [[-6, -13, C.b1], [0, -17, C.b2], [6, -14, C.b3], [-3, -8, C.b4], [4, -8, C.b5]];
  const shapes = drawRig(S, {
    behind: () => {
      const out = [...windKey(S.chest[0] - 5, S.chest[1] + 3, keyAngle(f, n), TIN.key, TIN.keyDk)];
      if (dead) return out;
      // The bunch of balloons bobbing above her hand, each on its own rhythm.
      bunch.forEach(([dx, dy, c], k) => {
        const bx = hand[0] + dx + Math.sin(ph + k) * 1.2;
        const by = Math.max(6, hand[1] + dy + Math.cos(ph * 1.3 + k) * 1.2);
        out.push(line([hand, [bx, by + 6]], 0.3, C.string), ...balloon(bx, by, 4.2, c));
      });
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.sock, C.shoe, 0.9),
    body: () => {
      const g = gown(S, 9, 8, C.dress, C.dressDk, Math.sin(ph) * 1.2);
      const out = [...g.out];
      const [hx, hy] = S.hip;
      for (let k = 0; k < 4; k++) out.push(line([[hx - 5 + k * 3.4, hy], [hx - 7 + k * 4.6, hy + 8]], 1, C.stripe));
      out.push(...bodice(S, C.dress, C.dressDk));
      const [cx, cy] = S.chest;
      out.push(...ooval(cx, cy - 0.8, 2.4, 1.2, C.stripe), ...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, 2.2, C.dressLt));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.sock, C.shoe, 0.9),
    head: () => headPart(S, mood, BS_FACE, BANGS, HR, 1.14, () => [...backHair(HR, 5), ...[-1, 1].flatMap((s) => KIT.lockHair(KIT.flowPts([s * 6, -2], Math.PI / 2 + s * 0.4, s * 0.3, 10, ph - 0.7, 0.2, 4), 3.4, HR))], () => [
      // A striped vendor's cap with a pompom.
      ...opoly(round([[-7, -5], [7, -5.6], [5, -10], [-5, -10]], 2), C.dressLt), ...[0, 1, 2].map((k) => line([[-4 + k * 4, -5.2], [-3 + k * 3.4, -9.8]], 0.9, C.stripe)), ...ooval(0, -11, 1.8, 1.8, C.stripe),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.dress, C.skin)];
      if (P.pop > 0.5) {
        // One balloon let go and popped at you: a burst of confetti and a bang star.
        const k = f === 1 ? 1 : 1.6;
        const x = S.arms[0].hand[0] + 10 * k;
        const y = S.arms[0].hand[1] - 2;
        if (f === 1) out.push(...balloon(x, y, 4, C.b1));
        else {
          out.push(sparkle(x, y, 5, '#ffffff'));
          for (let i = 0; i < 6; i++) out.push(...opoly([[x + Math.cos(i) * 6 - 1, y + Math.sin(i) * 5], [x + Math.cos(i) * 6 + 1, y + Math.sin(i) * 5], [x + Math.cos(i) * 6, y + Math.sin(i) * 5 + 1.6]], [C.b1, C.b2, C.b3][i % 3], 0.3));
        }
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

export const ART = {
  musicballerina: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 240, 180], draw: musicballerina },
  tindrummer: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: tindrummer },
  jackbox: { walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [90, 240, 180], draw: jackbox },
  marionette: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 230, 170], draw: marionette },
  teddystrong: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 300, 220], draw: teddystrong },
  balloonseller: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 230, 180], draw: balloonseller },
};

export const INFO = {
  musicballerina: { name: 'Music Box Ballerina', w: 30, h: 70 },
  tindrummer: { name: 'Tin Drummer Girl', w: 26, h: 70 },
  jackbox: { name: 'Jack-in-the-Box Jester', w: 30, h: 66 },
  marionette: { name: 'Marionette Dancer', w: 26, h: 64 },
  teddystrong: { name: 'Teddy Strongwoman', w: 30, h: 64 },
  balloonseller: { name: 'Balloon Seller', w: 28, h: 70 },
};
