// Monster art: the Dream Theatre's players (the levels 40-45 group dungeon, 2026-11, see
// docs/design/dream-theatre.md), on the stage rig (stagerig.js: every move dips first, sweeps,
// overshoots and settles into a held pose; a spotlight on the floor under each).
//   understudy   Understudy Ghost: a sheet-ghost actress in a blank mask, clutching her script; a
//                dramatic lunge.
//   chorusgirl   Chorus Girl: feather boa and fan, sequins; a high kick.
//   stagehand    Stagehand Imp: a little horned stagehand in overalls, a wrench and a coil of rope.
//   primadonna   Prima Donna: an opera singer in a vast gown; her high note rings out in rings.
//   paperdragon  Paper Dragon Dancers: two dancers under one paper dragon (their legs showing); a
//                fire puff.
//   prompter     Prompter: a hooded prompter with cue cards and a little lamp; flings cards.
// All face right, feet at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT, wisp } from './manor.js';
import { playAt, spot } from './stagerig.js';

const { within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
function keyed(pose, f, mood, K) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = playAt(K.walk, f, 8);
  else if (pose === 'attack') P = playAt(K.attack, f, 3, false);
  else P = playAt(K.idle, f, 6);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.34, hip: [P.hip[0] - 1.5, P.hip[1]] };
  return P;
}
const NOLEGS = [[0, 0], [0, 0]];
const SPOT = '#fff4c8';

// ---------- Understudy Ghost ----------

const UG = soften({
  skin: '#f4f4ff', skinDk: '#dcdcf2', sheet: '#eef0ff', sheetDk: '#c4c8e8', mask: '#ffffff', maskDk: '#d8dcec', script: '#fff8e8', scriptDk: '#e0d4b8',
  ribbon: '#e0304e', mist: '#eef0ff', mistDk: '#c4c8e8', mistLt: '#ffffff', hair: '#c8ccec', hairDk: '#a0a4d0', hairLt: '#ffffff',
});
const UG_FACE = { skin: UG.mask, skinSh: '#e6e8f4', skinSh2: '#c8cce0', blush: '#ffc8d8', lip: '#c8ccdc', lipLine: '#8a8ea8', eye: eyes('#2a2a3a', '#0a0a1a', '#6a6a8a', { rx: 3, ry: 3.4, pupil: 'round', jewel: false }), brow: { c: '#a0a4c0', kind: 'soft', w: 0.5 }, moods: { idle: { open: 0.9, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const UG_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 44 + Math.sin((i / 4) * TAU)], lean: 0.12, tilt: 0.08, arms: [[1.2, -1.4], [0.6, -1.6]], legs: NOLEGS })),
  // Rehearsing: a hand thrown to the brow, then reading the script, then a bow.
  idle: [
    { hip: [36, 44], lean: -0.1, tilt: -0.2, arms: [[0.6, -1.4], [0.3, -2.6]], legs: NOLEGS },
    { hip: [36, 44], lean: 0.06, tilt: 0.16, arms: [[1, -1.8], [0.9, -1.8]], legs: NOLEGS },
    { hip: [36, 45], lean: 0.4, tilt: 0.24, arms: [[-0.6, -0.2], [1.6, -0.4]], legs: NOLEGS },
  ],
  attack: [
    { hip: [34, 44], lean: -0.2, tilt: -0.2, arms: [[0.8, -1.4], [-1.4, -1.4]], legs: NOLEGS },
    { hip: [42, 44], lean: 0.4, tilt: 0.16, arms: [[-0.4, -0.4], [1.7, -0.1]], legs: NOLEGS, lunge: 1 },
    { hip: [42, 44], lean: 0.36, tilt: 0.14, arms: [[-0.4, -0.4], [1.7, 0]], legs: NOLEGS, lunge: 1 },
    { hip: [37, 44], lean: 0, tilt: 0.06, arms: [[1, -1.8], [0.9, -1.8]], legs: NOLEGS },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function understudy(pose, f, mood) {
  const C = fade(UG, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, UG_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#4a4a6a');
  const shapes = drawRig(S, {
    behind: () => [...spot(S.hip[0], 76, 14, SPOT), ...wisp([S.hip[0] - 1, S.hip[1] + 12], ph, pose === 'walk' ? 1 : 0.4, 12, 12, C, f, n)],
    backArm: () => armPart(S.arms[0], C.sheetDk, C.sheetDk),
    body: () => {
      // The sheet: draped from the shoulders to a ragged hem, folds swinging.
      const g = gown(S, 14, 9, C.sheet, C.sheetDk, Math.sin(ph) * 1);
      const out = [...g.out, ...bodice(S, C.sheet, C.sheetDk)];
      const [hx, hy] = S.hip;
      for (let k = 0; k < 5; k++) out.push(...opoly([[hx - 9 + k * 4.4, hy + 13], [hx - 7 + k * 4.4, hy + 16 + (k % 2) * 2], [hx - 5 + k * 4.4, hy + 13]], C.sheet, 0.3));
      out.push(...ooval(S.chest[0] - 1, S.chest[1] + 1, 1.4, 1, C.ribbon, -0.3), ...ooval(S.chest[0] + 1.4, S.chest[1] + 1, 1.4, 1, C.ribbon, 0.3));
      return out;
    },
    head: () => headPart(S, mood, UG_FACE, BANGS, HR, 1.14, () => [...opoly(round([[-8.6, 6], [-8.6, -5], [-4, -10], [3, -10.4], [8.6, -5], [9, 6], [6, 3], [-6, 3]], 2), C.sheet)], () => [
      // The sheet's hood over her head, and the edge of the blank mask.
      ...opoly(round([[-8.6, 3], [-8.4, -5], [-4, -10.2], [3.4, -10.6], [8.4, -5], [8.8, 0], [7, -1], [6.6, -6], [2, -8.4], [-3.4, -7.6], [-6.6, -3], [-6.6, 3]], 2), C.sheet),
      fband(arcPts(2, 3, 8.2, 8.6, 200, 340, 8), 0.5, C.maskDk, 1),
    ]),
    frontArm: () => {
      const A = S.arms[1];
      // The script, rolled, clutched to her chest or flung out mid-line.
      const out = [...oband([[A.hand[0] - 3, A.hand[1] + 1], [A.hand[0] + 3, A.hand[1] - 1]], 3, C.script, 1, 0.3), line([[A.hand[0] - 2, A.hand[1]], [A.hand[0] + 2, A.hand[1] - 1]], 0.3, C.scriptDk)];
      out.push(...armPart(A, C.sheet, C.skin));
      if (P.lunge > 0.5) out.push(fband([[A.hand[0] - 14, A.hand[1]], [A.hand[0] + 12, A.hand[1]]], (t) => 3 * Math.sin(Math.PI * t), mix(C.sheet, '#ffffff', 0.5), 1), sparkle(A.hand[0] + 12, A.hand[1], 3, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Chorus Girl ----------

const CG = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#2a2a3a', hairDk: '#14141e', hairLt: '#5a5a7a',
  suit: '#ff5a8a', suitDk: '#d83a6a', sequin: '#ffd36b', boa: '#ffb3d6', boaDk: '#e080b0', feather: '#ffffff', featherDk: '#e6dcf2', tight: '#f0c8a8', shoe: '#ffd36b',
});
const CG_FACE = { skin: CG.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ff8aa8', lip: '#e0204e', lipLine: '#a8102e', eye: eyes('#2a8a6a', '#0a4a3a', '#c8f0e0', { rx: 3.4, ry: 2.7, tilt: 0.15, flicks: 3, lashLen: 1.3 }), brow: { c: '#14141e', kind: 'arched', w: 0.7 }, moods: { idle: { open: 0.8, mouth: 'grin' }, angry: { mouth: 'smirk' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const CG_K = {
  // A kick-line step: step, kick, step, kick.
  walk: [
    { hip: [36, 45], lean: 0, tilt: 0.06, arms: [[2.2, -0.4], [0.6, -1.8]], legs: [[0.05, 0.05], [-0.2, 0.3]] },
    { hip: [36, 45], lean: -0.1, tilt: -0.06, arms: [[2.4, -0.2], [0.6, -1.9]], legs: [[0.05, 0.05], [2.4, -0.1]] },
    { hip: [36, 45], lean: 0, tilt: 0.06, arms: [[2.2, -0.4], [0.6, -1.8]], legs: [[-0.2, 0.3], [0.05, 0.05]] },
    { hip: [36, 45], lean: -0.1, tilt: -0.06, arms: [[2.4, -0.2], [0.6, -1.9]], legs: [[2.2, -0.1], [0.05, 0.05]] },
  ],
  idle: [
    { hip: [36, 45], lean: -0.04, tilt: 0.12, arms: [[0.4, -2.4], [0.6, -1.8]], legs: [[-0.15, 0], [0.3, 0.3]] },
    { hip: [37, 45], lean: -0.06, tilt: -0.1, arms: [[2.6, -0.4], [0.6, -1.8]], legs: [[-0.15, 0], [0.3, 0.3]] },
    { hip: [36, 45], lean: -0.04, tilt: 0.14, arms: [[0.4, -2.4], [1.4, -1]], legs: [[-0.15, 0], [0.3, 0.3]] },
  ],
  attack: [
    { hip: [35, 46], lean: -0.1, tilt: -0.1, arms: [[2.2, -0.4], [0.4, -2.4]], legs: [[0.05, 0.05], [-0.4, 1.2]] },
    { hip: [36, 44], lean: -0.24, tilt: -0.14, arms: [[2.6, -0.2], [0.6, -2.4]], legs: [[0.05, 0.05], [2.8, -0.1]], kick: 1 },
    { hip: [36, 44], lean: -0.22, tilt: -0.12, arms: [[2.6, -0.2], [0.6, -2.4]], legs: [[0.05, 0.05], [2.8, -0.1]], kick: 1 },
    { hip: [36, 45], lean: -0.04, tilt: 0.1, arms: [[0.4, -2.4], [0.6, -1.8]], legs: [[-0.15, 0], [0.3, 0.3]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function featherFan(h, a, open, C) {
  const out = [];
  for (let k = 0; k < 7; k++) {
    const t = a - open * 0.6 + (k / 6) * open * 1.2;
    const tip = [h[0] + Math.cos(t) * 10, h[1] + Math.sin(t) * 10];
    out.push(...oband([h, [lerp(h[0], tip[0], 0.6), lerp(h[1], tip[1], 0.6)], tip], (q) => Math.sin(Math.PI * Math.min(1, q + 0.15)) * 3 + 0.4, k % 2 ? C.feather : C.featherDk, 3, 0.3));
  }
  return out;
}

function chorusgirl(pose, f, mood) {
  const C = fade(CG, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, CG_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#000010');
  const leg = (L, back) => [...limb3(L.hip, L.kn, L.ft, 2.8, 2.4, 1.8, back ? mix(C.tight, '#000000', 0.08) : C.tight), ...opoly(round([[L.ft[0] - 1.4, L.ft[1] - 1.6], [L.ft[0] + 1.6, L.ft[1] - 1.8], [L.ft[0] + 3.4, L.ft[1] - 0.2], [L.ft[0] - 1.6, L.ft[1] + 0.8]], 1), C.shoe)];
  const shapes = drawRig(S, {
    behind: () => {
      const out = [...spot(S.hip[0], 77, 14, SPOT)];
      // A huge feather plume on her head, behind, swaying.
      for (let k = 0; k < 5; k++) out.push(...oband(KIT.flowPts([S.head[0] - 2, S.head[1] - 10], -Math.PI / 2 - 0.8 + k * 0.4, 0.3, 14, ph + k, 0.15, 4), (q) => Math.sin(Math.PI * Math.min(1, q + 0.1)) * 3.4, k % 2 ? C.feather : C.boa, 3, 0.3));
      return out;
    },
    backArm: () => [...armPart(S.arms[0], C.skinDk, C.skinDk), ...featherFan(S.arms[0].hand, -Math.PI / 2 - 0.4, 1, C)],
    backLeg: () => leg(S.legs[0], true),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.4, hy - 1.4], [hx + 4.4, hy - 1.4], [hx + 3, hy + 2.6], [hx - 3, hy + 2.6]], 1), C.suit)];
      for (let k = 0; k < 6; k++) out.push(...opoly([[hx - 6 + k * 2.4, hy + 1], [hx - 4.8 + k * 2.4, hy + 5], [hx - 3.6 + k * 2.4, hy + 1]], C.sequin, 0.3));
      out.push(...bodice(S, C.suit, C.suitDk));
      for (let k = 0; k < 6; k++) out.push(dot(lerp(S.chest[0], hx, k / 6) + (k % 2 ? 2 : -1.4), lerp(S.chest[1], hy, k / 6), 0.5, C.sequin));
      // The feather boa looped round her shoulders, ends swinging.
      const [cx, cy] = S.chest;
      out.push(...oband([[cx - 6, cy + 6 + Math.sin(ph) * 1.4], [cx - 4, cy - 1], [cx + 3, cy - 1], [cx + 6, cy + 5 + Math.sin(ph + 1) * 1.4]], 3.2, C.boa, 4, 0.3));
      for (let k = 0; k < 8; k++) out.push(dot(cx - 6 + k * 1.6, cy + (k < 2 || k > 5 ? 3 : -1), 0.9, C.boaDk));
      return out;
    },
    frontLeg: () => leg(S.legs[1], false),
    head: () => headPart(S, mood, CG_FACE, BANGS, HR, 1.12, () => backHair(HR, 5), () => [
      // A sequinned headband with a jewel.
      fband(arcPts(0.4, -2, 7.6, 6.4, 200, 340, 8), 1, C.sequin, 1), ...KIT.gem(-3, -7.4, 1.3, C.suit),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.skin, C.skin)];
      if (P.kick > 0.5) out.push(fband(arcPts(S.hip[0], S.hip[1], 24, 22, -70, 10, 8), (t) => 2.6 * Math.sin(Math.PI * t), mix(C.boa, '#ffffff', 0.4), 1), sparkle(S.legs[1].ft[0] + 3, S.legs[1].ft[1], 3, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Stagehand Imp ----------

const SH = soften({
  skin: '#ffd8c8', skinDk: '#f2b8a8', hair: '#5a3a8a', hairDk: '#3a2468', hairLt: '#8a6ac0',
  horn: '#fff0dc', overall: '#3a6ab8', overallDk: '#244a8a', shirt: '#ffd36b', shirtDk: '#e0a82a', boot: '#3a2a2a', rope: '#e8c890', ropeDk: '#b89060', wrench: '#c8cce0', wrenchDk: '#8a8ea8', tail: '#5a3a8a',
});
const SH_FACE = { skin: SH.skin, skinSh: '#f2b8a8', skinSh2: '#d89a8a', blush: '#ff8a8a', lip: '#d8505e', lipLine: '#a8303e', eye: eyes('#ffb347', '#8a4a0a', '#ffe8c0', { rx: 3.6, ry: 3.4, tilt: -0.1 }), brow: { c: '#3a2468', kind: 'arched', w: 0.8 }, moods: { idle: { open: 1, mouth: 'grin' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const SH_K = {
  walk: [
    { hip: [36, 50], lean: 0.14, tilt: 0.06, arms: [[0.6, -0.4], [-0.4, -1.4]], legs: [[-0.6, 0.4], [0.5, 0.2]] },
    { hip: [36, 48], lean: 0.1, tilt: -0.06, arms: [[0, -0.4], [0.1, -1.4]], legs: [[0, 1.1], [0.1, 0.1]] },
    { hip: [36, 50], lean: 0.14, tilt: 0.06, arms: [[-0.4, -0.4], [0.5, -1.4]], legs: [[0.5, 0.2], [-0.6, 0.4]] },
    { hip: [36, 48], lean: 0.1, tilt: -0.06, arms: [[0, -0.4], [0.1, -1.4]], legs: [[0.1, 0.1], [0, 1.1]] },
  ],
  idle: [
    { hip: [36, 50], lean: 0.04, tilt: 0.1, arms: [[0.4, -0.6], [0.2, -1.8]], legs: [[-0.3, 0.3], [0.3, 0.3]] },
    { hip: [36, 50], lean: 0.06, tilt: -0.1, arms: [[0.4, -0.6], [1.6, -1.2]], legs: [[-0.3, 0.3], [0.3, 0.3]] },
    { hip: [36, 50], lean: 0.04, tilt: 0.14, arms: [[0.4, -0.6], [0.2, -1.8]], legs: [[-0.3, 0.3], [0.3, 0.3]] },
  ],
  attack: [
    { hip: [35, 50], lean: -0.14, tilt: -0.12, arms: [[0.6, -0.6], [-1.6, -1.4]], legs: [[-0.4, 0.4], [0.3, 0.3]] },
    { hip: [39, 50], lean: 0.34, tilt: 0.14, arms: [[0.2, -0.4], [1.4, 0.2]], legs: [[-0.6, 0.4], [0.5, 0.3]], bonk: 1 },
    { hip: [39, 50], lean: 0.3, tilt: 0.12, arms: [[0.2, -0.4], [1.3, 0.4]], legs: [[-0.6, 0.4], [0.5, 0.3]], bonk: 1 },
    { hip: [36, 50], lean: 0.04, tilt: 0.1, arms: [[0.4, -0.6], [0.2, -1.8]], legs: [[-0.3, 0.3], [0.3, 0.3]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function stagehand(pose, f, mood) {
  const C = fade(SH, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, SH_K);
  const S = plant(solve(P, 0.9));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a0a3a');
  const A = S.arms[1];
  const wA = A.a - Math.PI / 2 - 0.4;
  const wTip = [A.hand[0] + Math.cos(wA) * 9, A.hand[1] + Math.sin(wA) * 9];
  const shapes = drawRig(S, {
    behind: () => {
      const out = [...spot(S.hip[0], 77, 12, SPOT)];
      // A coil of rope over her back shoulder, and a little devil tail flicking.
      out.push(...[0, 1, 2].flatMap((k) => fband(arcPts(S.chest[0] - 4, S.chest[1] + 3, 4 - k * 0.6, 5 - k * 0.6, 0, 360, 14), 0.9, k % 2 ? C.ropeDk : C.rope, 1)));
      const tp = KIT.flowPts([S.hip[0] - 4, S.hip[1] + 2], Math.PI + 0.3, -1.6, 12, ph * 2, 0.4, 5);
      out.push(...oband(tp, 1, C.tail, 3, 0.3), ...opoly([[tp[5][0] - 2, tp[5][1]], [tp[5][0], tp[5][1] - 2.4], [tp[5][0] + 2, tp[5][1]], [tp[5][0], tp[5][1] + 1]], C.tail, 0.3));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.shirtDk, C.skinDk, 0.9),
    backLeg: () => legPart(S.legs[0], C.overallDk, C.boot, 0.95),
    body: () => {
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      const out = [...opoly(round([[hx - 4.4, hy - 1.4], [hx + 4.4, hy - 1.4], [hx + 5, hy + 3], [hx - 5, hy + 3]], 1), C.overall)];
      out.push(...bodice(S, C.shirt, C.shirtDk));
      // The overalls' bib and straps, a pocket with a pencil, a tool belt.
      out.push(...opoly(round([[cx - 2.6, cy + 2.6], [cx + 3, cy + 2.6], [hx + 3.6, hy - 1], [hx - 3.4, hy - 1]], 1), C.overall), line([[cx - 2.4, cy + 2.6], [cx - 3, cy - 1]], 0.7, C.overall), line([[cx + 2.8, cy + 2.6], [cx + 3, cy - 1]], 0.7, C.overall));
      out.push(...opoly([[cx - 1, cy + 4], [cx + 2, cy + 4], [cx + 2, cy + 6.4], [cx - 1, cy + 6.4]], C.overallDk), line([[cx + 1, cy + 4], [cx + 1.6, cy + 1.6]], 0.5, '#ffd36b'));
      out.push(line([[hx - 4.6, hy - 0.6], [hx + 4.6, hy - 0.6]], 1, C.ropeDk));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.overall, C.boot, 0.95),
    head: () => headPart(S, mood, SH_FACE, BANGS, HR, 1.16, () => backHair(HR, 5), () => [
      // Two little horns and a backwards cap with a headset mic.
      ...opoly([[-4.6, -8], [-6, -13], [-2.4, -9]], C.horn), ...opoly([[3, -9], [4.4, -14], [6, -8.6]], C.horn),
      ...opoly(round([[-7, -6], [6, -7], [5, -10], [-5, -10]], 2), C.overall), ...opoly([[-7, -6], [-11, -5.4], [-10.4, -7], [-6.6, -8]], C.overallDk),
      fband([[8, 0], [9, 4], [6, 7]], 0.4, '#3a3a5a', 2), dot(6, 7, 0.8, '#3a3a5a'),
    ]),
    frontArm: () => {
      const out = [...oband([A.hand, wTip], 1.2, C.wrench, 1, 0.3), ...opoly([[wTip[0] - 2, wTip[1] - 2], [wTip[0] + 2, wTip[1] - 2.4], [wTip[0] + 1, wTip[1]], [wTip[0] + 2.4, wTip[1] + 2], [wTip[0] - 2, wTip[1] + 2]], C.wrench, 0.3)];
      out.push(...armPart(A, C.shirt, C.skin, 0.9));
      if (P.bonk > 0.5) out.push(sparkle(wTip[0] + 4, wTip[1], 3, '#ffffff'), sparkle(wTip[0] + 1, wTip[1] - 5, 1.6, '#ffd36b'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Prima Donna ----------

const PD2 = soften({
  skin: '#fff0ec', skinDk: '#f2d4cc', hair: '#c8303e', hairDk: '#981a2a', hairLt: '#ff7a8a',
  gown: '#7a2a8a', gownDk: '#561a66', gownLt: '#a85ab8', lace: '#ffd36b', pearl: '#ffffff', note: '#ffd36b', ring: '#ffe8a0',
});
const PD2_FACE = { skin: PD2.skin, skinSh: '#f2d4cc', skinSh2: '#d8b0a8', blush: '#ff8a9a', lip: '#c8203e', lipLine: '#8a0a2a', eye: eyes('#7a2a8a', '#3a0a4a', '#e6c8f0', { rx: 3.4, ry: 2.6, tilt: 0.2, flicks: 3, lashLen: 1.3 }), brow: { c: '#981a2a', kind: 'arched', w: 0.8 }, moods: { idle: { open: 0.6, mouth: 'smile' }, angry: { open: 1, mouth: 'laugh' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const PD2_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 50], lean: -0.04, tilt: 0.06 + Math.sin((i / 4) * TAU) * 0.04, arms: [[0.4, -1.4], [1.6, -0.8]], legs: [[0, 0], [0, 0]] })),
  idle: [
    { hip: [36, 50], lean: -0.06, tilt: -0.12, arms: [[0.4, -1.4], [0.5, -1.8]], legs: [[0, 0], [0, 0]] },
    { hip: [36, 50], lean: -0.1, tilt: -0.2, arms: [[2.4, -0.4], [2.6, -0.4]], legs: [[0, 0], [0, 0]], sing: 1 },
    { hip: [36, 50], lean: -0.06, tilt: -0.1, arms: [[0.4, -1.4], [0.5, -1.8]], legs: [[0, 0], [0, 0]] },
  ],
  attack: [
    { hip: [35, 50], lean: -0.14, tilt: -0.2, arms: [[1.6, -0.8], [1.6, -0.8]], legs: [[0, 0], [0, 0]], sing: 1 },
    { hip: [36, 50], lean: -0.2, tilt: -0.3, arms: [[2.7, -0.2], [2.8, -0.2]], legs: [[0, 0], [0, 0]], sing: 2 },
    { hip: [36, 50], lean: -0.2, tilt: -0.3, arms: [[2.7, -0.2], [2.8, -0.2]], legs: [[0, 0], [0, 0]], sing: 2 },
    { hip: [36, 50], lean: -0.06, tilt: -0.1, arms: [[0.4, -1.4], [0.5, -1.8]], legs: [[0, 0], [0, 0]] },
  ],
  dead: { hip: [34, 62], lean: 0.5, tilt: 0.6, arms: [[0.3, 0.2], [0.4, 0.2]], legs: [[0, 0], [0, 0]] },
};

function primadonna(pose, f, mood) {
  const C = fade(PD2, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, PD2_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#4a0a1a');
  const sing = P.sing ?? 0;
  const shapes = drawRig(S, {
    behind: () => [...spot(S.hip[0], 77, 18, SPOT)],
    backArm: () => armPart(S.arms[0], C.gownDk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      // A vast bell of a gown to the floor, tiers of gold lace, a train behind.
      const g = gown(S, 27, 14, C.gown, C.gownDk, Math.sin(ph) * 0.5);
      const out = [...g.out];
      for (let t = 0; t < 3; t++) out.push(fband(arcPts(hx + 0.4, hy + 8 + t * 7, 7 + t * 3, 2, 0, 180, 10), 0.8, C.lace, 1));
      out.push(...bodice(S, C.gown, C.gownDk));
      const [cx, cy] = S.chest;
      for (let k = 0; k < 7; k++) out.push(dot(cx - 3 + k, cy + 2 + Math.sin(k * 0.9) * 0.8, 0.5, C.pearl));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 3.4, 3, C.gownLt));
      return out;
    },
    head: () => headPart(S, mood === 'angry' ? 'happy' : mood, PD2_FACE, SWEPT, HR, 1.12, () => backHair(HR, 6), () => [
      // A towering curled updo with a tiara and a single plume.
      ...ooval(-2, -10, 6, 5, C.hair), fband(arcPts(-2, -10, 4.4, 3.6, 180, 360, 8), 0.8, C.hairDk, 1), ...ooval(-6, -7, 3, 3, C.hair),
      fband(arcPts(0.4, -5.6, 6.4, 3, 200, 340, 6), 0.8, C.lace, 1), ...KIT.gem(0.4, -7.6, 1.2, C.pearl),
      ...oband([[2, -12], [5, -17], [9, -18]], taperW(2.4, 0.6), C.lace, 3, 0.3),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.gown, C.skin)];
      if (sing > 0) {
        // Her voice: rings rolling out from her open mouth, notes riding them.
        const [mx, my] = [S.head[0] + 9, S.head[1] + 4];
        const k = sing > 1.5 ? 1 : 0.5;
        for (let r = 0; r < 3; r++) out.push(fband(arcPts(mx, my, 4 + r * 6 * k + (ph % 1) * 2, 3 + r * 4 * k, -60, 60, 6), 0.8, C.ring, 1));
        for (let i = 0; i < 2; i++) out.push(...ooval(mx + 8 + i * 8 * k, my - 6 + i * 3, 1.3, 1, C.note), line([[mx + 9 + i * 8 * k, my - 6 + i * 3], [mx + 9 + i * 8 * k, my - 11 + i * 3]], 0.5, C.note));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Paper Dragon Dancers ----------

const PDR = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', paper: '#e0304e', paperDk: '#a81a36', paperLt: '#ff8a96', gold: '#ffd36b', goldDk: '#c8902a',
  trouser: '#ffd36b', trouserDk: '#e0a82a', shoe: '#2a2a3a', eye: '#ffffff', fire: '#ff8a3a', fire2: '#ffd36b', fireHot: '#ffffff', fringe: '#ffffff',
});
const PDR_K = {
  // The two dancers under the costume step in time, the dragon's body rippling over them.
  walk: [
    { hip: [40, 52], lean: 0.2, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.6, 0.6], [0.6, 0.2]] },
    { hip: [40, 50], lean: 0.2, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[0, 1.2], [0.1, 0.2]] },
    { hip: [40, 52], lean: 0.2, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[0.6, 0.2], [-0.6, 0.6]] },
    { hip: [40, 50], lean: 0.2, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[0.1, 0.2], [0, 1.2]] },
  ],
  idle: [
    { hip: [40, 52], lean: 0.1, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.3, 0.3], [0.3, 0.3]], head: 0 },
    { hip: [40, 51], lean: 0.12, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.3, 0.3], [0.3, 0.3]], head: 1 },
    { hip: [40, 52], lean: 0.1, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.3, 0.3], [0.3, 0.3]], head: -1 },
  ],
  attack: [
    { hip: [38, 53], lean: -0.1, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.4, 0.5], [0.4, 0.5]], head: -1 },
    { hip: [42, 51], lean: 0.3, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.6, 0.4], [0.6, 0.3]], head: 1, fire: 1 },
    { hip: [42, 51], lean: 0.3, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.6, 0.4], [0.6, 0.3]], head: 1, fire: 1 },
    { hip: [40, 52], lean: 0.1, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[-0.3, 0.3], [0.3, 0.3]], head: 0 },
  ],
  dead: { hip: [38, 64], lean: 0.8, tilt: 0, arms: [[0, 0], [0, 0]], legs: [[1.4, -2.4], [1.2, -2.2]], head: 0 },
};

function paperdragon(pose, f, mood) {
  const C = fade(PDR, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, PDR_K);
  // Two dancers: the front one's legs under the head, the back one's under the tail.
  const front = plant(solve(P, 0.8));
  const back = plant(solve({ ...P, hip: [P.hip[0] - 20, P.hip[1]], legs: [P.legs[1], P.legs[0]] }, 0.8));
  const legs = (S, k) => {
    const out = [];
    for (const [i, L] of S.legs.entries()) out.push(...limb3(L.hip, L.kn, L.ft, 2.8, 2.4, 2, i ? C.trouser : C.trouserDk), ...opoly(round([[L.ft[0] - 1.4, L.ft[1] - 1.4], [L.ft[0] + 2.4, L.ft[1] - 1.6], [L.ft[0] + 2.4, L.ft[1] + 0.8], [L.ft[0] - 1.4, L.ft[1] + 0.8]], 1), C.shoe));
    return out;
  };
  const headUp = P.head ?? 0;
  const out = [...spot(front.hip[0] - 10, 77, 24, SPOT), ...legs(back), ...legs(front)];
  // The dragon's body: a paper tube of red scales from the head back over both dancers, rippling.
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    pts.push([lerp(front.hip[0] + 6, back.hip[0] - 18, u), lerp(front.hip[1] - 8, back.hip[1] - 6, u) + Math.sin(ph - u * 6) * 2.4]);
  }
  out.push(...oband(pts, (t) => lerp(14, 8, t), C.paper, 4));
  const sp = KIT.spline(pts, 3);
  for (let i = 1; i < sp.length - 1; i += 2) out.push(fband(arcPts(sp[i][0], sp[i][1] - 2, 3, 2.4, 20, 160, 4), 0.6, C.gold, 1));
  for (let i = 0; i < sp.length; i += 2) out.push(...opoly([[sp[i][0] - 2, sp[i][1] - 6], [sp[i][0], sp[i][1] - 10 - (i % 4)], [sp[i][0] + 2, sp[i][1] - 6]], C.gold, 0.3));
  for (let i = 0; i < sp.length; i += 1) out.push(line([[sp[i][0], sp[i][1] + 5], [sp[i][0] + Math.sin(ph + i) * 0.6, sp[i][1] + 8]], 0.5, C.fringe));
  // The big paper head: wide eyes, a gold mane, whiskers and a mouth that opens.
  const [hx, hy] = [front.hip[0] + 12, front.hip[1] - 12 - headUp * 3];
  within(at(hx, hy, -headUp * 0.15), () => {
    const jaw = P.fire ? 4 : 1.4;
    out.push(...opoly(round([[-8, -7], [6, -9], [12, -4], [12, 0], [-6, 2]], 2), C.paper), ...opoly(round([[-4, 2], [12, 1 + jaw * 0.2], [10, 3 + jaw], [-4, 5]], 1), C.paperDk));
    out.push(...ooval(2, -4, 3, 3, C.eye), dot(3, -4, 1.4, '#2a2a3a'), dot(2.4, -4.6, 0.6, '#ffffff'));
    for (let k = 0; k < 4; k++) out.push(...oband([[-6 + k * 2, -7], [-10 + k * 2, -13 - (k % 2) * 2]], taperW(2.4, 0.6), C.gold, 2, 0.3));
    out.push(fband([[11, -1], [16, -4 + Math.sin(ph) * 1.4], [20, -2]], 0.4, C.gold, 2), fband([[11, 1], [16, 3 + Math.sin(ph + 1) * 1.4], [19, 5]], 0.4, C.gold, 2));
    out.push(...opoly([[6, -9], [8, -14], [10, -8]], C.goldDk, 0.3));
  });
  if (P.fire) for (let i = 0; i < 4; i++) out.push(...KIT.flame(hx + 16 + i * 5, hy + 3, 5, 2, 1.6, [C.fire, C.fire2, C.fireHot]));
  return { w: RW, h: RH, res: 3, shapes: out };
}

// ---------- Prompter ----------

const PR = soften({
  skin: '#fff4ec', skinDk: '#f0dccc', hair: '#e8e0f0', hairDk: '#c4b8d8', hairLt: '#ffffff',
  cloak: '#2a2a4a', cloakDk: '#1a1a34', cloakLt: '#4a4a7a', card: '#ffffff', cardDk: '#e6e0f2', ink: '#e0304e', lamp: '#ffe2a0', brass: '#ffd36b',
});
const PR_FACE = { skin: PR.skin, skinSh: '#f0dccc', skinSh2: '#d8bcac', blush: '#ffb4c4', lip: '#d8707e', lipLine: '#a8404e', eye: eyes('#7a62c8', '#3a2a8a', '#e6dcff', { rx: 3.4, ry: 3 }), brow: { c: '#c4b8d8', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const PR_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 46 + Math.abs(Math.sin((i / 4) * TAU)) * -1], lean: 0.16, tilt: 0.1, arms: [[0.9, -1.4], [1, -1.6]], legs: [[-0.4 + (i % 2) * 0.8, 0.3], [0.4 - (i % 2) * 0.8, 0.1]] })),
  idle: [
    { hip: [36, 46], lean: 0.06, tilt: 0.16, arms: [[0.9, -1.6], [1, -1.7]], legs: [[-0.2, 0.05], [0.2, 0.05]] },
    { hip: [36, 46], lean: 0.08, tilt: 0.06, arms: [[0.9, -1.6], [0.3, -2.4]], legs: [[-0.2, 0.05], [0.2, 0.05]] },
    { hip: [36, 46], lean: 0.06, tilt: 0.18, arms: [[0.9, -1.6], [1, -1.7]], legs: [[-0.2, 0.05], [0.2, 0.05]] },
  ],
  attack: [
    { hip: [35, 46], lean: -0.1, tilt: -0.1, arms: [[0.9, -1.6], [-1.4, -1.4]], legs: [[-0.3, 0.1], [0.3, 0.05]] },
    { hip: [38, 46], lean: 0.2, tilt: 0.1, arms: [[0.6, -1.4], [1.8, -0.3]], legs: [[-0.4, 0.1], [0.4, 0.05]], fling: 1 },
    { hip: [38, 46], lean: 0.16, tilt: 0.08, arms: [[0.6, -1.4], [1.9, -0.2]], legs: [[-0.4, 0.1], [0.4, 0.05]], fling: 1 },
    { hip: [36, 46], lean: 0.06, tilt: 0.12, arms: [[0.9, -1.6], [1, -1.7]], legs: [[-0.2, 0.05], [0.2, 0.05]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function prompter(pose, f, mood) {
  const C = fade(PR, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, PR_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#4a3a6a');
  const [h0, h1] = [S.arms[0].hand, S.arms[1].hand];
  const card = (x, y, a, k = 1) => within(at(x, y, a), () => [...opoly([[-3 * k, -2 * k], [3 * k, -2 * k], [3 * k, 2 * k], [-3 * k, 2 * k]], C.card, 0.3), line([[-2 * k, -0.6 * k], [2 * k, -0.6 * k]], 0.3, C.ink), line([[-2 * k, 0.8 * k], [1 * k, 0.8 * k]], 0.3, C.cardDk)]);
  const shapes = drawRig(S, {
    behind: () => {
      const out = [...spot(S.hip[0], 77, 12, SPOT)];
      // The long hooded cloak behind her, its hem stirring.
      const [cx, cy] = S.chest;
      out.push(...opoly(round([[cx - 4, cy - 2], [cx + 2, cy - 2], [S.hip[0] + 3, S.hip[1] + 20], [S.hip[0] - 10, S.hip[1] + 19 + Math.sin(ph)], [S.hip[0] - 8, S.hip[1]]], 2), C.cloakDk));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.cloakDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.cloakDk, C.cloakDk),
    body: () => {
      const g = gown(S, 16, 8, C.cloak, C.cloakDk, Math.sin(ph) * 0.6);
      const out = [...g.out, ...bodice(S, C.cloak, C.cloakDk)];
      // The prompter's little lamp hung at her belt.
      const [hx, hy] = S.hip;
      out.push(line([[hx + 3, hy], [hx + 3, hy + 3]], 0.4, C.brass), ...ooval(hx + 3, hy + 5, 1.8, 2.2, C.lamp), dot(hx + 2.6, hy + 4.4, 0.6, '#ffffff'));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.cloak, C.cloakDk),
    head: () => headPart(S, mood, PR_FACE, BANGS, HR, 1.14, () => [...opoly(round([[-8.6, 6], [-8.6, -5], [-4, -10], [3, -10.4], [8.6, -5], [9, 4], [6, 2], [-6, 2]], 2), C.cloakDk)], () => [
      ...opoly(round([[-8.6, 3], [-8.4, -5], [-4, -10.2], [3.4, -10.6], [8.4, -5], [8.8, 0], [7, -1], [6.6, -6], [2, -8.4], [-3.4, -7.6], [-6.6, -3], [-6.6, 3]], 2), C.cloak),
      // A pencil tucked behind her ear.
      line([[6.6, -2], [10, -6]], 0.7, C.brass), dot(10, -6, 0.5, C.ink),
    ]),
    frontArm: () => {
      // A fan of cue cards held up in both hands (or flung, one after another).
      const out = [];
      if (!(P.fling > 0.5)) for (let k = 0; k < 3; k++) out.push(...card(lerp(h0[0], h1[0], 0.5) + k * 1.4, lerp(h0[1], h1[1], 0.5) - 2 + k * 0.4, -0.3 + k * 0.25));
      else {
        const k = f === 1 ? 1 : 1.6;
        for (let i = 0; i < 3; i++) out.push(...card(h1[0] + 6 * k + i * 6, h1[1] - 3 + i * 3, ph * 3 + i));
      }
      out.push(...armPart(S.arms[1], C.cloak, C.skin));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

export const ART = {
  understudy: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: understudy },
  chorusgirl: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 230, 170], draw: chorusgirl },
  stagehand: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 230, 170], draw: stagehand },
  primadonna: { walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [100, 280, 200], draw: primadonna },
  paperdragon: { walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [80, 240, 180], draw: paperdragon },
  prompter: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 230, 170], draw: prompter },
};

export const INFO = {
  understudy: { name: 'Understudy Ghost', w: 26, h: 60 },
  chorusgirl: { name: 'Chorus Girl', w: 26, h: 68 },
  stagehand: { name: 'Stagehand Imp', w: 26, h: 56 },
  primadonna: { name: 'Prima Donna', w: 34, h: 66 },
  paperdragon: { name: 'Paper Dragon Dancers', w: 48, h: 50 },
  prompter: { name: 'Prompter', w: 26, h: 64 },
};
