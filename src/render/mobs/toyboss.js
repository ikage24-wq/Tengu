// Monster art: the Clockwork Carnival's bosses (docs/design/clockwork-carnival.md), drawn grand to the
// queens' size.
//   leonie       Leonie, the Lioness Acrobat: a lion-girl in a spangled leotard with a mane of hair,
//                round ears, a tufted tail and a fire hoop; springs, tumbles and pounces.
//   marionetta   Madame Marionette: a tall puppeteer in velvet and lace, a control bar in each hand
//                and a little puppet of herself dancing on the strings below.
//   gearheart    Queen Gearheart, the Grand Automaton: a clockwork queen with a crown of gears, a
//                skirt like a clock face, gears turning at her shoulders and a great key in her
//                back; she moves on the tick, like her toys.
// All face right, feet at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { poseAt, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { tickAt, windKey } from './toyrig.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K, tick = false) {
  if (mood === 'dead') return K.dead;
  const at = tick ? tickAt : poseAt;
  let P;
  if (pose === 'walk') P = at(K.walk, f, 8);
  else if (pose === 'attack') P = tick ? tickAt(K.attack, f, 4, false, 0.6) : poseAt(K.attack, f, 4, false);
  else P = at(K.idle, f, 8);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  return P;
}

// ---------- Leonie, the Lioness Acrobat ----------

const LN = soften({
  skin: '#ffe6d0', skinDk: '#f2c8a8', hair: '#ffb347', hairDk: '#e0802a', hairLt: '#ffe0a0', mane: '#ff9a3a', maneDk: '#d86a1a',
  leo: '#e0304e', leoDk: '#a81a36', leoLt: '#ff7a8a', spangle: '#ffe36b', tights: '#ffd0b0', boot: '#ffffff', bootDk: '#e6e0f2',
  hoop: '#ffd36b', hoopDk: '#c8902a', fire: '#ff8a3a', fire2: '#ffd36b', fireHot: '#ffffff', tuft: '#a85a2a',
});
const LN_FACE = { skin: LN.skin, skinSh: '#f2c8a8', skinSh2: '#d8a888', blush: '#ff9a8a', lip: '#e0505e', lipLine: '#a8303e', eye: eyes('#ffb347', '#a85a0a', '#fff0c8', { tilt: 0.3, ry: 2.6, pupil: 'slit' }), brow: { c: '#d86a1a', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.85, mouth: 'smirk' }, angry: { mouth: 'snarl' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const LN_K = {
  // A prowling cat-walk: low and loose, the hoop swinging at her side.
  walk: [
    { hip: [36, 48], lean: 0.18, tilt: 0.06, arms: [[0.6, -0.4], [-0.2, -0.6]], legs: [[-0.55, 0.3], [0.55, 0.05]] },
    { hip: [36, 46.4], lean: 0.14, tilt: -0.04, arms: [[0.2, -0.5], [0.2, -0.6]], legs: [[0, 0.9], [0.15, 0.05]] },
    { hip: [36, 48], lean: 0.18, tilt: 0.06, arms: [[-0.2, -0.4], [0.6, -0.6]], legs: [[0.55, 0.05], [-0.55, 0.3]] },
    { hip: [36, 46.4], lean: 0.14, tilt: -0.04, arms: [[0.2, -0.5], [0.2, -0.6]], legs: [[0.15, 0.05], [0, 0.9]] },
  ],
  // Showing off: a hip-out pose, the hoop twirled on one finger, a flick of the tail.
  idle: [
    { hip: [36, 47], lean: -0.06, tilt: 0.1, arms: [[0.4, -2], [2.8, -0.4]], legs: [[-0.3, 0.1], [0.35, 0.2]], twirl: 0 },
    { hip: [37, 46.6], lean: -0.08, tilt: 0.16, arms: [[0.4, -2], [2.9, -0.3]], legs: [[-0.3, 0.1], [0.4, 0.3]], twirl: 1 },
    { hip: [36, 47], lean: -0.06, tilt: 0.06, arms: [[0.4, -2], [2.8, -0.4]], legs: [[-0.3, 0.1], [0.35, 0.2]], twirl: 2 },
    { hip: [35, 47.4], lean: -0.04, tilt: 0.12, arms: [[0.5, -1.9], [2.7, -0.4]], legs: [[-0.25, 0.1], [0.3, 0.15]], twirl: 3 },
  ],
  // Crouch, spring, a pounce with claws out, land in a crouch.
  attack: [
    { hip: [33, 56], lean: 0.4, tilt: 0.1, arms: [[1, -0.6], [0.6, -0.6]], legs: [[-1.2, 1.9], [0.4, 1.9]] },
    { hip: [38, 40], lean: 0.6, tilt: 0.2, arms: [[2.4, -0.4], [2.6, -0.3]], legs: [[-1.4, 0.4], [-0.6, 0.6]] },
    { hip: [46, 50], lean: 0.7, tilt: 0.24, arms: [[1.5, -0.1], [1.7, 0]], legs: [[-1.2, 0.6], [0.6, 1.2]], claw: 1 },
    { hip: [46, 52], lean: 0.6, tilt: 0.2, arms: [[1.4, -0.1], [1.6, 0]], legs: [[-1.1, 1.4], [0.7, 1.6]], claw: 1 },
    { hip: [38, 48], lean: 0.12, tilt: 0.06, arms: [[0.6, -0.4], [-0.2, -0.6]], legs: [[-0.4, 0.2], [0.4, 0.1]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function hoopShape(c, r, C, f, lit = true) {
  const out = [fband(arcPts(c[0], c[1], r, r, 0, 360, 24), 1.4, C.hoopDk, 1), fband(arcPts(c[0], c[1], r, r, 0, 360, 24), 0.8, C.hoop, 1)];
  if (lit) for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + f * 0.4;
    out.push(...KIT.flame(c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, 3.4, 1.2, Math.sin(f + k) * 0.6, [C.fire, C.fire2, C.fireHot]));
  }
  return out;
}

function leonie(pose, f, mood) {
  const C = fade(LN, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, LN_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a2a0a');
  const dead = mood === 'dead';
  const legC = (L, back) => [...limb3(L.hip, L.kn, L.ft, 3.2, 2.6, 2, back ? mix(C.tights, '#000000', 0.08) : C.tights), ...opoly(round([[L.ft[0] - 2, L.ft[1] - 4], [L.ft[0] + 2, L.ft[1] - 4], [L.ft[0] + 3.6, L.ft[1] + 0.6], [L.ft[0] - 2, L.ft[1] + 0.6]], 1), back ? C.bootDk : C.boot)];
  return big(160, 140, 1.62, () => drawRig(S, {
    behind: () => {
      const out = [];
      // The mane: a big wild mass of hair behind her head and shoulders.
      for (let k = 0; k < 7; k++) {
        const a = Math.PI / 2 + 0.3 + k * 0.32;
        out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 3, S.head[1] - 3], a, 0.6, 12 + (k % 3) * 3, ph - k * 0.5, 0.2, 4), 4.4, { ...HR, c: k % 2 ? C.mane : C.hair }));
      }
      // The tail, swishing, with its dark tuft.
      const tp = KIT.flowPts([S.hip[0] - 4, S.hip[1] + 1], Math.PI + 0.4, -1.4, 22, ph * (pose === 'idle' ? 1 : 2), 0.4, 6);
      out.push(...oband(tp, taperW(1.8, 1.2), C.hair, 4, 0.3), ...ooval(tp[6][0], tp[6][1], 2.6, 2.2, C.tuft));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.skinDk, C.skinDk),
    backLeg: () => legC(S.legs[0], true),
    body: () => {
      const out = [...bodice(S, C.leo, C.leoDk)];
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      out.push(...opoly(round([[hx - 4.4, hy - 1.4], [hx + 4.4, hy - 1.4], [hx + 3, hy + 2.6], [hx - 3, hy + 2.6]], 1), C.leo));
      // Spangles, a star on the chest, a short sparkly skirt frill.
      for (let k = 0; k < 6; k++) out.push(dot(lerp(cx, hx, k / 6) + (k % 2 ? 2 : -1.6), lerp(cy, hy, k / 6), 0.55, C.spangle));
      out.push(...KIT.gem(cx + 0.4, cy + 3, 1.4, C.spangle));
      for (let k = 0; k < 5; k++) out.push(...opoly([[hx - 5 + k * 2.4, hy + 1], [hx - 3.8 + k * 2.4, hy + 4.4], [hx - 2.6 + k * 2.4, hy + 1]], k % 2 ? C.leoLt : C.spangle, 0.3));
      return out;
    },
    frontLeg: () => legC(S.legs[1], false),
    head: () => headPart(S, mood, LN_FACE, BANGS, HR, 1.12, () => backHair(HR, 7), () => [
      // Round lion ears, a ringmaster's tiny tilted cap with a feather.
      ...ooval(-6.6, -8.6, 3, 3, C.hair), ...ooval(-6.6, -8.2, 1.6, 1.6, C.leoLt, 0, 0.25), ...ooval(5.6, -9.4, 3, 3, C.hair), ...ooval(5.6, -9, 1.6, 1.6, C.leoLt, 0, 0.25),
      ...within(at(0, -9.6, 0.2), () => [...opoly([[-3.6, 0], [3.6, 0], [3, -4], [-3, -4]], C.leo), line([[-3.6, -1], [3.6, -1]], 0.6, C.spangle), ...oband([[2, -4], [4, -8], [7, -9]], taperW(1.4, 0.4), '#ffffff', 3, 0.3)]),
    ]),
    frontArm: () => {
      const A = S.arms[1];
      const out = [];
      // The fire hoop, twirled on her finger at rest, held out ahead in the pounce.
      if (!dead) {
        const c = pose === 'idle' ? [A.hand[0] + 1, A.hand[1] - 7] : [A.hand[0] + 4, A.hand[1] + 2];
        out.push(...hoopShape(c, pose === 'idle' ? 6.5 : 7, C, f + (P.twirl ?? 0), pose !== 'walk'));
      }
      out.push(...armPart(A, C.skin, C.skin));
      if (P.claw > 0.5) {
        for (let k = 0; k < 3; k++) out.push(fband([[A.hand[0] + 4 + k * 2, A.hand[1] - 6 + k * 2], [A.hand[0] + 16 + k * 2, A.hand[1] + 4 + k * 2]], (t) => 1.6 * Math.sin(Math.PI * t), mix(C.fire2, '#ffffff', 0.4), 1));
        out.push(sparkle(A.hand[0] + 18, A.hand[1] + 2, 3, '#ffffff'));
      }
      return out;
    },
  }));
}

// ---------- Madame Marionette ----------

const MM = soften({
  skin: '#f6eaff', skinDk: '#dccaf2', hair: '#2a1e4e', hairDk: '#160e30', hairLt: '#5a4a8a',
  dress: '#5a2a7a', dressDk: '#3e1a5a', dressLt: '#8a5aaa', lace: '#ffffff', laceDk: '#e6dcf2', ribbon: '#e0305e',
  bar: '#c99a6b', barDk: '#985a48', thread: '#f2ecff', puppet: '#ffb3cf', puppetDk: '#e07aa4', joint: '#e0c4b0',
});
const MM_FACE = { skin: MM.skin, skinSh: '#dccaf2', skinSh2: '#b8a4dc', blush: '#e0a0c8', lip: '#a82a5a', lipLine: '#6a1a3a', eye: eyes('#e0305e', '#6a0a2a', '#ffd0dc', { tilt: 0.38, ry: 2.3, flicks: 3, lashLen: 1.2 }), brow: { c: '#2a1e4e', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.55, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// Both arms up working the bars, the puppet below dancing to them.
const MM_K = {
  walk: [0, 1, 2, 3].map((i) => {
    const s = Math.sin((i / 4) * TAU);
    return { hip: [36, 58.0 + s * 0.6], lean: 0.04, tilt: s * 0.05, arms: [[1.4 + s * 0.3, -1.6], [1.6 - s * 0.3, -1.6]], legs: [[0, 0], [0, 0]], pup: s };
  }),
  idle: [
    { hip: [36, 58.0], lean: -0.03, tilt: 0.08, arms: [[1.4, -1.6], [1.8, -1.4]], legs: [[0, 0], [0, 0]], pup: 0 },
    { hip: [36, 57.6], lean: -0.04, tilt: -0.06, arms: [[1.8, -1.4], [1.4, -1.8]], legs: [[0, 0], [0, 0]], pup: 1 },
    { hip: [36, 58.0], lean: -0.03, tilt: 0.1, arms: [[1.5, -1.6], [2, -1.2]], legs: [[0, 0], [0, 0]], pup: -1 },
    { hip: [36, 57.6], lean: -0.04, tilt: -0.04, arms: [[2, -1.2], [1.5, -1.6]], legs: [[0, 0], [0, 0]], pup: 0.5 },
  ],
  // Bars raised, then flung forward: the strings lash out across the floor.
  attack: [
    { hip: [35, 58.0], lean: -0.12, tilt: -0.12, arms: [[2.6, -0.6], [2.8, -0.4]], legs: [[0, 0], [0, 0]], pup: 1 },
    { hip: [34, 57.0], lean: -0.18, tilt: -0.16, arms: [[2.9, -0.3], [3, -0.2]], legs: [[0, 0], [0, 0]], pup: 1 },
    { hip: [39, 58.0], lean: 0.2, tilt: 0.12, arms: [[1.3, -0.2], [1.5, -0.1]], legs: [[0, 0], [0, 0]], pup: -1, lash: 1 },
    { hip: [39, 58.0], lean: 0.16, tilt: 0.1, arms: [[1.3, -0.2], [1.5, -0.1]], legs: [[0, 0], [0, 0]], pup: -1, lash: 1 },
    { hip: [37, 58.0], lean: 0, tilt: 0.06, arms: [[1.4, -1.6], [1.8, -1.4]], legs: [[0, 0], [0, 0]], pup: 0 },
  ],
  dead: { hip: [34, 62], lean: 0.5, tilt: 0.6, arms: [[0.3, 0.2], [0.6, 0.2]], legs: [[0, 0], [0, 0]], pup: 0 },
};

function marionetta(pose, f, mood) {
  const C = fade(MM, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, MM_K);
  const S = solve(P, 1.06);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#05020e');
  const dead = mood === 'dead';
  const bar = (A, a) => [...oband([[A.hand[0] - Math.cos(a) * 6, A.hand[1] - Math.sin(a) * 6], [A.hand[0] + Math.cos(a) * 6, A.hand[1] + Math.sin(a) * 6]], 1.3, C.bar, 1, 0.3), ...oband([[A.hand[0], A.hand[1] - 4], [A.hand[0], A.hand[1] + 3]], 1.1, C.barDk, 1, 0.3)];
  return big(170, 140, 1.62, () => drawRig(S, {
    behind: () => {
      // Her long hair in two drill curls down her back.
      const out = [];
      for (const s of [0, 1]) {
        const root = [S.head[0] - 5 + s * 2, S.head[1] + 1];
        for (let k = 0; k < 5; k++) out.push(...ooval(root[0] - 1 + Math.sin(ph + k + s) * 0.6, root[1] + 3 + k * 3.4, 3 - k * 0.3, 2.2, k % 2 ? C.hair : C.hairDk));
      }
      return out;
    },
    backArm: () => [...(dead ? [] : bar(S.arms[0], 0.3)), ...armPart(S.arms[0], C.dressDk, C.skinDk)],
    body: () => {
      const g = gown(S, 18, 11, C.dress, C.dressDk, Math.sin(ph) * 0.8);
      const out = [...g.out];
      const [hx, hy] = S.hip;
      // Tiers of black-and-white lace frills down the skirt, a corset laced with red ribbon.
      for (let t = 0; t < 3; t++) for (let k = 0; k < 6; k++) out.push(...ooval(hx - 7 - t * 1.4 + k * (2.8 + t * 0.5), hy + 6 + t * 5, 1.4, 1, t % 2 ? C.lace : C.laceDk, 0, 0.25));
      out.push(...bodice(S, C.dress, C.dressDk));
      const [cx, cy] = S.chest;
      for (let k = 0; k < 4; k++) out.push(line([[lerp(cx, hx, 0.15 + k * 0.2) - 1.4, lerp(cy, hy, 0.15 + k * 0.2)], [lerp(cx, hx, 0.25 + k * 0.2) + 1.6, lerp(cy, hy, 0.25 + k * 0.2)]], 0.5, C.ribbon));
      for (let k = 0; k < 7; k++) out.push(...ooval(cx - 4.2 + k * 1.4, cy - 1.4, 1.2, 1, C.lace, 0, 0.25));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 3, 2.8, C.dressLt));
      return out;
    },
    head: () => headPart(S, mood, MM_FACE, SWEPT, HR, 1.12, () => backHair(HR, 6), () => [
      // A lace headdress with a big ribbon bow and a fall of lace at the back.
      ...oband(arcPts(0.4, -0.6, 7.6, 7.4, 205, 320, 8), 1.6, C.lace, 2, 0.3),
      ...ooval(-5.6, -6.6, 2.6, 1.8, C.ribbon, -0.5), ...ooval(-7.2, -4.2, 2.2, 1.6, C.ribbon, 0.6), dot(-5.6, -5.4, 0.9, mix(C.ribbon, '#000000', 0.2)),
    ]),
    frontArm: () => {
      const A = S.arms[1];
      const out = [];
      if (!dead) {
        // The little puppet of herself, dancing below the bars on its strings.
        const pup = P.pup ?? 0;
        const px = (S.arms[0].hand[0] + A.hand[0]) / 2 + 12;
        const py = 64 + Math.abs(pup) * -2;
        for (const h of [S.arms[0].hand, A.hand]) out.push(line([h, [px + (h === A.hand ? 2 : -2), py - 8]], 0.3, C.thread));
        out.push(...ooval(px, py - 9, 2.4, 2.4, C.joint), ...opoly(round([[px - 3, py - 6], [px + 3, py - 6], [px + 4, py + 1], [px - 4, py + 1]], 1), C.puppet));
        out.push(line([[px - 1.4, py + 1], [px - 2 - pup * 2, py + 6]], 0.8, C.joint), line([[px + 1.4, py + 1], [px + 2 + pup * 2, py + 5 - pup]], 0.8, C.joint), line([[px - 3, py - 5], [px - 6, py - 7 + pup * 2]], 0.7, C.joint), line([[px + 3, py - 5], [px + 6, py - 7 - pup * 2]], 0.7, C.joint));
        out.push(...bar(A, -0.3));
      }
      out.push(...armPart(A, C.dress, C.skin), ...ooval(lerp(A.el[0], A.hand[0], 0.75), lerp(A.el[1], A.hand[1], 0.75), 1.8, 1.3, C.lace, 0, 0.25));
      if (P.lash > 0.5) for (let k = 0; k < 4; k++) out.push(fband(KIT.flowPts(A.hand, 0.2 + k * 0.12, -0.2, 24, ph + k, 0.3, 6), 0.5, C.thread, 2), sparkle(A.hand[0] + 24, A.hand[1] + 4 + k * 3, 1.4, '#ffffff'));
      return out;
    },
  }));
}

// ---------- Queen Gearheart, the Grand Automaton ----------

const QG = soften({
  skin: '#fff8f4', skinDk: '#ecdcd6', joint: '#e6d0c8', hair: '#ffe0a0', hairDk: '#e8b860', hairLt: '#fff6dc',
  brass: '#ffd36b', brassDk: '#c8902a', brassLt: '#fff2b0', gown: '#7fd8c8', gownDk: '#4ab0a0', gownLt: '#c4f4ec',
  face: '#fffaf0', faceDk: '#e6dcc8', hand: '#3a3466', gem: '#ff7aa8', key: '#ffd36b', copper: '#e0905a',
});
const QG_FACE = { skin: QG.skin, skinSh: '#ecdcd6', skinSh2: '#d0bcb4', blush: '#ffb0c0', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#4ac8b8', '#1a6a6a', '#d8fff6', { rx: 3.5, ry: 3, tilt: 0.12, flicks: 3, lashLen: 1.1 }), brow: { c: '#e8b860', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.75, mouth: 'calm' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { open: 0.9, mouth: 'smile' } } };
// She moves on the tick, like her toys: a grand processional step, sceptre raised.
const QG_K = {
  walk: [
    { hip: [36, 57.0], lean: 0.02, tilt: 0.06, arms: [[0.6, -1.6], [1.3, -1.3]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [36, 56.0], lean: -0.02, tilt: -0.04, arms: [[0.7, -1.7], [1.25, -1.25]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [36, 57.0], lean: 0.02, tilt: 0.08, arms: [[0.6, -1.6], [1.3, -1.3]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [36, 56.0], lean: -0.02, tilt: -0.06, arms: [[0.7, -1.7], [1.25, -1.25]], legs: [[0, 0], [0, 0]], spin: 0 },
  ],
  idle: [
    { hip: [36, 57.0], lean: -0.03, tilt: 0.08, arms: [[0.6, -1.6], [1.3, -1.35]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [36, 56.4], lean: -0.04, tilt: -0.08, arms: [[0.7, -1.7], [1.35, -1.4]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [36, 57.0], lean: -0.03, tilt: 0.12, arms: [[1.6, -0.8], [1.3, -1.35]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [36, 56.4], lean: -0.04, tilt: -0.04, arms: [[0.7, -1.7], [1.35, -1.4]], legs: [[0, 0], [0, 0]], spin: 0 },
  ],
  // The sceptre swung down: a gear flung spinning from its head.
  attack: [
    { hip: [35, 57.0], lean: -0.12, tilt: -0.12, arms: [[1, -1], [-0.6, -2.2]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [34, 56.0], lean: -0.18, tilt: -0.16, arms: [[1.2, -0.8], [-1.2, -1.8]], legs: [[0, 0], [0, 0]], spin: 0 },
    { hip: [39, 57.0], lean: 0.2, tilt: 0.12, arms: [[-0.4, -0.6], [1.5, -0.3]], legs: [[0, 0], [0, 0]], spin: 0, fling: 1 },
    { hip: [39, 57.0], lean: 0.16, tilt: 0.1, arms: [[-0.4, -0.6], [1.5, -0.2]], legs: [[0, 0], [0, 0]], spin: 0, fling: 1 },
    { hip: [37, 57.0], lean: 0, tilt: 0.06, arms: [[0.6, -1.6], [1.3, -1.35]], legs: [[0, 0], [0, 0]], spin: 0 },
  ],
  // Wound down at last: she sinks to sit, hands folded, smiling, the key stopped.
  dead: { hip: [36, 58], lean: 0.1, tilt: 0.24, arms: [[0.9, -1.8], [0.8, -1.9]], legs: [[0, 0], [0, 0]], spin: 0 },
};

function gearShape(x, y, r, teeth, a, c, cDk) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const t = a + (i / (teeth * 2)) * TAU;
    const rr = i % 2 ? r : r * 0.78;
    pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]);
    pts.push([x + Math.cos(t + Math.PI / (teeth * 2)) * rr, y + Math.sin(t + Math.PI / (teeth * 2)) * rr]);
  }
  return [...opoly(pts, c, 0.35), ...ooval(x, y, r * 0.42, r * 0.42, cDk, 0, 0.3), dot(x, y, r * 0.16, c)];
}

function gearheart(pose, f, mood) {
  const C = fade(QG, mood === 'dead' ? 'happy' : mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, QG_K, true);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a5a1a');
  const down = mood === 'dead';
  const fmood = down ? 'happy' : mood;
  const turn = down ? 0 : ph;
  return big(180, 156, 1.86, () => drawRig(S, {
    behind: () => {
      const out = [];
      // The great wind-up key in her back, turning a notch per tick (still once she's wound down).
      out.push(...windKey(S.chest[0] - 6, S.chest[1] + 4, down ? 0.4 : f * 1.4, C.key, C.brassDk), ...windKey(S.chest[0] - 9, S.chest[1] + 3, down ? 0.4 : f * 1.4, C.key, C.brassDk));
      // Gears turning behind her shoulders, meshing.
      out.push(...gearShape(S.chest[0] - 8, S.chest[1] - 3, 5, 8, turn * 0.5, C.brass, C.brassDk), ...gearShape(S.chest[0] - 13, S.chest[1] + 4, 3.4, 6, -turn * 0.75, C.copper, C.brassDk));
      for (const k of [0, 1]) out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 6, S.head[1] - 1 + k * 4], Math.PI / 2 + 0.3 + k * 0.2, 0.4, 20 - k * 4, ph - k * 0.6, 0.12, 5), 5 - k, HR));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.gownDk, C.joint),
    body: () => {
      const [hx, hy] = S.hip;
      const g = gown(S, 18, 13, C.gown, C.gownDk, 0);
      const out = [...g.out];
      // The skirt's front is a great clock face: numerals as dots, two hands ticking round.
      const cx = hx + 1;
      const cy = hy + 10;
      out.push(...ooval(cx, cy, 8.6, 7.4, C.face), fband(arcPts(cx, cy, 8.6, 7.4, 0, 360, 24), 0.9, C.brass, 1));
      for (let k = 0; k < 12; k++) out.push(dot(cx + Math.cos((k / 12) * TAU) * 7, cy + Math.sin((k / 12) * TAU) * 6, k % 3 ? 0.35 : 0.6, C.hand));
      const hA = down ? -Math.PI / 2 : (f / n) * TAU - Math.PI / 2;
      out.push(line([[cx, cy], [cx + Math.cos(hA) * 5.4, cy + Math.sin(hA) * 4.6]], 0.6, C.hand), line([[cx, cy], [cx + Math.cos(hA / 12 - 1) * 3.4, cy + Math.sin(hA / 12 - 1) * 3]], 0.8, C.hand), dot(cx, cy, 0.8, C.gem));
      out.push(...bodice(S, C.gown, C.gownDk));
      const [bx, by] = S.chest;
      out.push(fband(arcPts(bx, by + 1.4, 3.8, 1.8, 195, 345, 6), 0.8, C.brass, 1), ...gearShape(bx + 0.4, by + 4, 2, 8, turn, C.brass, C.brassDk));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 3, 2.8, C.brass), ...ball(S.arms[1].el, 1.2));
      return out;
    },
    head: () => headPart(S, fmood, QG_FACE, SWEPT, HR, 1.16, () => backHair(HR, 9), () => {
      // A crown of gears, the largest in the middle, turning slowly; a porcelain seam at the temple.
      const out = [...opoly(round([[-6.6, -6], [6.6, -6.4], [6.2, -4.6], [-6.2, -4.2]], 1), C.brass)];
      out.push(...gearShape(-4, -8.6, 2.6, 6, -turn * 0.6, C.copper, C.brassDk), ...gearShape(4.2, -8.8, 2.6, 6, -turn * 0.6, C.copper, C.brassDk), ...gearShape(0, -10.6, 3.8, 8, turn * 0.4, C.brass, C.brassDk));
      out.push(...KIT.gem(0, -10.6, 1, C.gem), line([[8, -2], [9, 2]], 0.3, C.faceDk));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const out = [];
      if (!down) {
        // The sceptre: a brass rod crowned with a spinning gear.
        // (Held upright out at her side, its gear clear of her face.)
        const a = pose === 'attack' ? A.a - Math.PI / 2 - 0.6 : -Math.PI / 2 + 0.3;
        const top = [A.hand[0] + Math.cos(a) * 14, A.hand[1] + Math.sin(a) * 14];
        out.push(...oband([[A.hand[0] - Math.cos(a) * 6, A.hand[1] - Math.sin(a) * 6], top], 1.1, C.brass, 1, 0.3), ...gearShape(top[0], top[1], 3.4, 8, turn * 2, C.brass, C.brassDk));
        if (P.fling > 0.5) {
          const k = f === 2 ? 1 : 1.6;
          const gx = top[0] + 12 * k;
          out.push(...gearShape(gx, top[1] + 4 * k, 4, 10, turn * 4, C.copper, C.brassDk), fband([[top[0] + 2, top[1] + 1], [gx - 4, top[1] + 4 * k]], (t) => 2 * t, mix(C.brassLt, '#ffffff', 0.4), 1));
        }
      }
      out.push(...armPart(A, C.gown, C.joint), ...ball(A.el, 1.3));
      if (down) for (let i = 0; i < 4; i++) out.push(sparkle(S.head[0] - 14 + i * 9, S.head[1] - 14 + (i % 2) * 6 - f, 1.4 + (i % 2), '#ffffff'));
      return out;
    },
  }));
  function ball(p, r) {
    return ooval(p[0], p[1], r, r, C.joint, 0, 0.3);
  }
}

export const ART = {
  leonie: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 36, atkMs: [100, 160, 280, 220], draw: leonie },
  marionetta: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [100, 200, 300, 220], draw: marionetta },
  gearheart: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 240], draw: gearheart },
};

export const INFO = {
  leonie: { name: 'Leonie, the Lioness Acrobat', w: 50, h: 112 },
  marionetta: { name: 'Madame Marionette', w: 56, h: 120 },
  gearheart: { name: 'Queen Gearheart, the Grand Automaton', w: 64, h: 130 },
};
