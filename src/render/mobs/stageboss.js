// Monster art: the Dream Theatre's bosses (docs/design/dream-theatre.md), on the stage rig drawn grand
// to the queens' size.
//   persona      Persona, the Two-Faced Muse: a muse in a split gown of gold and blue, the mask of
//                Comedy in one hand and Tragedy in the other (never over her own face).
//   directrice   Madame Directrice: a director in a beret and a long scarf, megaphone in one hand
//                and the clapperboard in the other.
//   playwright   The Phantom Playwright: a tall phantom in a high-collared cape lined with script
//                pages, a giant quill for a staff, pages whirling round him.
// All face right, feet (or hem) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT, wisp } from './manor.js';
import { playAt, spot } from './stagerig.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = playAt(K.walk, f, 8);
  else if (pose === 'attack') P = playAt(K.attack, f, 4, false);
  else P = playAt(K.idle, f, 8);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  return P;
}
const NOLEGS = [[0, 0], [0, 0]];
const SPOT = '#fff4c8';

// A theatre mask: Comedy (gold, smiling) or Tragedy (blue, weeping), held by its ribbon.
function mask(x, y, comedy, a = 0) {
  const c = comedy ? '#ffd36b' : '#7fb8ff';
  const cd = comedy ? '#c8902a' : '#3a6ab8';
  return within(at(x, y, a), () => [
    ...opoly(round([[-5, -5], [5, -5], [5.6, 0], [3, 5], [0, 6], [-3, 5], [-5.6, 0]], 2), c),
    ...opoly([[-3.6, -2], [-1, -2.6], [-1.4, -0.6]], cd, 0.3), ...opoly([[3.6, -2], [1, -2.6], [1.4, -0.6]], cd, 0.3),
    fband(comedy ? arcPts(0, 1.4, 3, 2.2, 10, 170, 6) : arcPts(0, 4.4, 3, 2.2, 190, 350, 6), 0.8, cd, 1),
    ...(comedy ? [] : [...ooval(-2.6, 1.4, 0.6, 1, '#dff0ff'), ...ooval(2.6, 1.8, 0.6, 1, '#dff0ff')]),
    fband([[5.4, -2], [9, 0], [10, 4]], 0.5, comedy ? '#ff7aa8' : '#c9a6ff', 2),
  ]);
}

// ---------- Persona, the Two-Faced Muse ----------

const PE = soften({
  skin: '#fff4f0', skinDk: '#f2dcd6', hair: '#2a2a4a', hairDk: '#14142e', hairLt: '#5a5a8a',
  gold: '#ffd36b', goldDk: '#c8902a', blue: '#5a7ad8', blueDk: '#3a54b0', trim: '#ffffff', star: '#fff3a6',
  mist: '#e6e0ff', mistDk: '#b8b0e8', mistLt: '#ffffff',
});
const PE_FACE = { skin: PE.skin, skinSh: '#f2dcd6', skinSh2: '#dcb4b0', blush: '#ffa8c0', lip: '#c8406e', lipLine: '#8a204e', eye: eyes('#ffd36b', '#8a5a0a', '#fff0c0', { rx: 3.5, ry: 2.9, tilt: 0.15, flicks: 3, lashLen: 1.2 }), brow: { c: '#14142e', kind: 'arched', w: 0.8 }, moods: { idle: { open: 0.75, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// She performs both parts: Comedy's mask raised and a skip, then Tragedy's raised and a swoon.
const PE_K = {
  walk: [
    { hip: [36, 46], lean: 0.1, tilt: 0.1, arms: [[2.4, -0.4], [0.6, -1]], legs: [[-0.4, 0.3], [0.5, 0.05]] },
    { hip: [36, 45], lean: 0.06, tilt: -0.06, arms: [[0.6, -1], [2.4, -0.4]], legs: [[0.5, 0.05], [-0.4, 0.3]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.06, tilt: 0.2, arms: [[2.6, -0.4], [0.5, -1.2]], legs: [[-0.2, 0], [0.3, 0.2]] },
    { hip: [36, 47], lean: 0.2, tilt: -0.24, arms: [[0.5, -1.2], [2.4, -0.8]], legs: [[-0.3, 0.3], [0.2, 0.1]] },
    { hip: [36, 46], lean: -0.06, tilt: 0.2, arms: [[2.6, -0.4], [0.5, -1.2]], legs: [[-0.2, 0], [0.3, 0.2]] },
    { hip: [36, 47], lean: 0.2, tilt: -0.24, arms: [[0.5, -1.2], [2.4, -0.8]], legs: [[-0.3, 0.3], [0.2, 0.1]] },
  ],
  attack: [
    { hip: [35, 46], lean: -0.14, tilt: -0.1, arms: [[2.6, -0.2], [-1.2, -1.4]], legs: [[-0.3, 0.1], [0.4, 0.1]] },
    { hip: [34, 45], lean: -0.2, tilt: -0.14, arms: [[2.8, -0.2], [-1.8, -1]], legs: [[-0.3, 0.1], [0.4, 0.1]] },
    { hip: [40, 47], lean: 0.26, tilt: 0.12, arms: [[-0.6, -0.4], [1.6, -0.2]], legs: [[-0.6, 0.2], [0.6, 0.2]], fling: 1 },
    { hip: [40, 47], lean: 0.22, tilt: 0.1, arms: [[-0.6, -0.4], [1.6, -0.1]], legs: [[-0.6, 0.2], [0.6, 0.2]], fling: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.12, arms: [[2.6, -0.4], [0.5, -1.2]], legs: [[-0.2, 0], [0.3, 0.2]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function persona(pose, f, mood) {
  const C = fade(PE, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, PE_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#05051a');
  const [B, A] = S.arms;
  return big(160, 140, 1.62, () => drawRig(S, {
    behind: () => [...spot(S.hip[0], 77, 18, SPOT), ...[0, 1].flatMap((k) => KIT.lockHair(KIT.flowPts([S.head[0] - 6, S.head[1] - 2 + k * 4], Math.PI / 2 + 0.4 + k * 0.2, 0.6, 20 - k * 4, ph - k * 0.6, 0.2, 5), 5 - k, HR))],
    backArm: () => [...armPart(B, C.blueDk, C.skinDk), ...mask(B.hand[0], B.hand[1] - 4, false, Math.sin(ph) * 0.2)],
    backLeg: () => legPart(S.legs[0], C.blueDk, C.blueDk),
    body: () => {
      const [hx, hy] = S.hip;
      // A split gown: Comedy's gold down one side, Tragedy's blue down the other, stars at the seam.
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 9, hy + 13], [hx - 9, hy + 13]], 2), C.gold)];
      out.push(fpoly([[hx - 4.6, hy - 1.4], [hx, hy - 1.4], [hx, hy + 13], [hx - 9, hy + 13]], C.blue));
      for (let k = 0; k < 4; k++) out.push(...KIT.gem(hx, hy + 1 + k * 3.4, 0.8, C.star));
      out.push(...bodice(S, C.gold, C.blue));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.6, 1.8, 195, 345, 6), 0.8, C.trim, 1));
      for (let k = 0; k < 6; k++) out.push(...ooval(hx - 8 + k * 3.2, hy + 13.4, 1.6, 1, k < 3 ? C.blue : C.gold, 0, 0.25));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.gold, C.goldDk),
    head: () => headPart(S, mood, PE_FACE, SWEPT, HR, 1.14, () => backHair(HR, 8), () => [
      // A half-gold, half-blue laurel circlet and a star.
      fband(arcPts(0.4, -2, 7.6, 6, 200, 270, 6), 1, C.blue, 1), fband(arcPts(0.4, -2, 7.6, 6, 270, 340, 6), 1, C.gold, 1), ...KIT.gem(0.4, -8.4, 1.2, C.star),
    ]),
    frontArm: () => {
      const out = [...armPart(A, C.gold, C.skin), ...mask(A.hand[0] + 1, A.hand[1] - 4, true, -Math.sin(ph) * 0.2)];
      if (P.fling > 0.5) {
        const k = f === 2 ? 1 : 1.5;
        for (let i = 0; i < 8; i++) out.push(...opoly([[A.hand[0] + 6 + i * 3 * k, A.hand[1] - 6 + (i % 3) * 5], [A.hand[0] + 8 + i * 3 * k, A.hand[1] - 6 + (i % 3) * 5], [A.hand[0] + 7 + i * 3 * k, A.hand[1] - 4 + (i % 3) * 5]], i % 2 ? C.gold : C.blue, 0.2));
        out.push(sparkle(A.hand[0] + 30 * k, A.hand[1], 3, '#ffffff'));
      }
      return out;
    },
  }));
}

// ---------- Madame Directrice ----------

const DI = soften({
  skin: '#ffe6d6', skinDk: '#f2c8b0', hair: '#ffb347', hairDk: '#e0802a', hairLt: '#ffd8a0',
  coat: '#2a2a3a', coatDk: '#14141e', coatLt: '#4a4a6a', scarf: '#e0304e', scarfDk: '#a81a36', beret: '#e0304e', pant: '#3a3a5a', boot: '#14141e',
  horn: '#ffd36b', hornDk: '#c8902a', slate: '#2a2a3a', slateLine: '#ffffff', stripe: '#ffffff',
});
const DI_FACE = { skin: DI.skin, skinSh: '#f2c8b0', skinSh2: '#d8a890', blush: '#ff9a8a', lip: '#c8304e', lipLine: '#8a102e', eye: eyes('#3a7ad8', '#1a3a8a', '#d0e0ff', { tilt: 0.3, ry: 2.4, flicks: 2 }), brow: { c: '#e0802a', kind: 'arched', w: 1 }, moods: { idle: { open: 0.85, mouth: 'smirk' }, angry: { open: 1, mouth: 'laugh' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// Pacing the stage, megaphone up: "Action!", the slate snapping.
const DI_K = {
  walk: [
    { hip: [36, 46], lean: 0.06, tilt: 0.04, arms: [[0.4, -1.4], [0.6, -1.8]], legs: [[-0.45, 0.2], [0.45, 0.05]] },
    { hip: [36, 45], lean: 0.04, tilt: -0.04, arms: [[0.4, -1.4], [0.7, -2]], legs: [[0.45, 0.05], [-0.45, 0.2]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.04, tilt: 0.06, arms: [[0.4, -1.4], [0.6, -1.8]], legs: [[-0.25, 0], [0.3, 0.05]] },
    { hip: [36, 46], lean: 0.1, tilt: -0.1, arms: [[1.6, -1.6], [1.2, -2.2]], legs: [[-0.25, 0], [0.4, 0.2]], shout: 1 },
    { hip: [36, 46], lean: -0.04, tilt: 0.06, arms: [[0.4, -1.4], [0.6, -1.8]], legs: [[-0.25, 0], [0.3, 0.05]] },
    { hip: [36, 46], lean: -0.04, tilt: 0.1, arms: [[2.4, -0.6], [0.6, -1.8]], legs: [[-0.25, 0], [0.3, 0.05]], clap: 1 },
  ],
  attack: [
    { hip: [35, 46], lean: -0.14, tilt: -0.12, arms: [[1.4, -1.6], [1, -2.2]], legs: [[-0.3, 0.1], [0.4, 0.1]] },
    { hip: [36, 46], lean: -0.2, tilt: -0.16, arms: [[1.6, -1.6], [1.2, -2.4]], legs: [[-0.3, 0.1], [0.4, 0.1]] },
    { hip: [39, 46], lean: 0.26, tilt: 0.12, arms: [[0.8, -1], [1.6, -0.8]], legs: [[-0.5, 0.2], [0.5, 0.15]], shout: 2 },
    { hip: [39, 46], lean: 0.22, tilt: 0.1, arms: [[0.8, -1], [1.6, -0.7]], legs: [[-0.5, 0.2], [0.5, 0.15]], shout: 2 },
    { hip: [37, 46], lean: 0, tilt: 0.06, arms: [[0.4, -1.4], [0.6, -1.8]], legs: [[-0.25, 0], [0.3, 0.05]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function directrice(pose, f, mood) {
  const C = fade(DI, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, DI_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a2a0a');
  const [B, A] = S.arms;
  const dead = mood === 'dead';
  const shout = P.shout ?? 0;
  return big(160, 140, 1.62, () => drawRig(S, {
    behind: () => {
      const tr = pose === 'walk' ? 1 : 0.4;
      // The long scarf streaming off her shoulder.
      return [...spot(S.hip[0], 77, 16, SPOT), ...oband(KIT.flowPts([S.neck[0] - 2, S.neck[1] + 1], Math.PI + 0.4, 0.4, 16 + tr * 6, ph * 1.5, 0.3, 5), taperW(3, 2), C.scarf, 3)];
    },
    backArm: () => {
      // The clapperboard in her back hand, its top snapping shut on the clap.
      const out = [...armPart(B, C.coatDk, C.skinDk)];
      if (!dead) {
        const [x, y] = B.hand;
        const open = P.clap ? 0.05 : 0.5;
        out.push(...opoly([[x - 5, y - 1], [x + 5, y - 1], [x + 5, y + 6], [x - 5, y + 6]], C.slate), line([[x - 3, y + 2], [x + 3, y + 2]], 0.4, C.slateLine), line([[x - 3, y + 4], [x + 2, y + 4]], 0.4, C.slateLine));
        within(at(x - 5, y - 1, -open), () => {
          out.push(...opoly([[0, -2.4], [10, -2.4], [10, 0], [0, 0]], C.slate));
          for (let k = 0; k < 4; k++) out.push(fpoly([[1 + k * 2.4, -2.4], [2.2 + k * 2.4, -2.4], [1.4 + k * 2.4, 0], [0.2 + k * 2.4, 0]], C.stripe));
        });
      }
      return out;
    },
    backLeg: () => legPart(S.legs[0], C.pant, C.boot),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 7, hy + 9], [hx - 7, hy + 10]], 2), C.coat), fpoly([[hx - 4.6, hy], [hx - 1, hy], [hx - 2, hy + 9.6], [hx - 7, hy + 10]], C.coatDk)];
      out.push(...bodice(S, C.coat, C.coatDk));
      const [cx, cy] = S.chest;
      out.push(...oband([[cx - 4, cy - 1], [cx + 4, cy - 1.4]], 2.6, C.scarf, 1, 0.3), ...oband([[cx + 3, cy - 1], [cx + 4, cy + 6]], taperW(2.4, 1.8), C.scarfDk, 2, 0.3));
      for (let k = 0; k < 3; k++) out.push(dot(lerp(cx, hx, 0.25 + k * 0.25) + 1.4, lerp(cy, hy, 0.25 + k * 0.25), 0.6, C.horn));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.pant, C.boot),
    head: () => headPart(S, mood, DI_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 9), ...KIT.lockHair(KIT.flowPts([-6, 0], Math.PI / 2 + 0.3, 0.3, 12, ph - 0.7, 0.14, 5), 4.4, HR)], () => [
      // A beret tipped at a jaunty angle, a pencil behind the ear.
      ...ooval(-1.6, -9, 8, 3.4, C.beret, -0.2), dot(-1, -12.2, 0.9, C.beret), line([[6.4, -3], [9.6, -7]], 0.7, C.horn),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The megaphone, from her hand out ahead, its bell toward the stage.
        const a = shout ? -0.25 : A.a - Math.PI / 2 - 0.6;
        const mouth = [A.hand[0] + Math.cos(a) * 10, A.hand[1] + Math.sin(a) * 10];
        const n = [-Math.sin(a), Math.cos(a)];
        out.push(...opoly([[A.hand[0] + n[0] * 1.4, A.hand[1] + n[1] * 1.4], [mouth[0] + n[0] * 4.4, mouth[1] + n[1] * 4.4], [mouth[0] - n[0] * 4.4, mouth[1] - n[1] * 4.4], [A.hand[0] - n[0] * 1.4, A.hand[1] - n[1] * 1.4]], C.horn));
        out.push(fband([[mouth[0] + n[0] * 4.4, mouth[1] + n[1] * 4.4], [mouth[0] - n[0] * 4.4, mouth[1] - n[1] * 4.4]], 0.9, C.hornDk, 1));
        if (shout) for (let r = 0; r < (shout > 1 ? 3 : 2); r++) out.push(fband(arcPts(mouth[0], mouth[1], 4 + r * 5, 5 + r * 5, (a * 180) / Math.PI - 50, (a * 180) / Math.PI + 50, 6), 0.9, mix(C.horn, '#ffffff', 0.4), 1));
        if (shout > 1) out.push(sparkle(mouth[0] + 20, mouth[1], 3.4, '#ffffff'));
      }
      out.push(...armPart(A, C.coat, C.skin));
      return out;
    },
  }));
}

// ---------- The Phantom Playwright ----------

const PW = soften({
  skin: '#f0eeff', skinDk: '#d8d4f2', hair: '#e8e6ff', hairDk: '#b8b4e0', hairLt: '#ffffff',
  cape: '#2a1e4a', capeDk: '#1a1236', lining: '#c8304e', liningDk: '#8a1a36', vest: '#4a3a7a', page: '#fff8ec', pageDk: '#e0d4b8', ink: '#2a1e4a',
  quill: '#ffffff', quillDk: '#d8d0f0', nib: '#ffd36b', gold: '#ffd36b', mist: '#d8d0ff', mistDk: '#9a90d8', mistLt: '#ffffff',
});
const PW_FACE = { skin: PW.skin, skinSh: '#d8d4f2', skinSh2: '#b4b0dc', blush: '#d4b4f0', lip: '#8a5aa8', lipLine: '#5a2a7a', eye: eyes('#c8304e', '#6a0a1e', '#ffd0d8', { tilt: 0.35, ry: 2.3, flicks: 2, lashLen: 1 }), brow: { c: '#b8b4e0', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.6, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { open: 0.85, mouth: 'smile' } } };
// He glides, writing in the air with his quill; the pages whirl round him.
const PW_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 46], lean: 0.08, tilt: 0.04, arms: [[0.4, -1.2], [1.2, -1.6 + Math.sin((i / 4) * TAU) * 0.3]], legs: NOLEGS })),
  idle: [
    { hip: [36, 46], lean: -0.04, tilt: 0.06, arms: [[0.4, -1.2], [1.4, -1.8]], legs: NOLEGS, write: 0 },
    { hip: [36, 45], lean: -0.04, tilt: -0.06, arms: [[0.4, -1.2], [1.8, -1.4]], legs: NOLEGS, write: 1 },
    { hip: [36, 46], lean: -0.04, tilt: 0.1, arms: [[0.4, -1.2], [1.2, -2]], legs: NOLEGS, write: 2 },
    { hip: [36, 45], lean: -0.04, tilt: -0.04, arms: [[2.2, -0.6], [1.4, -1.8]], legs: NOLEGS, write: 0 },
  ],
  // The quill raised and slashed down: a stroke of ink across the stage.
  attack: [
    { hip: [35, 46], lean: -0.14, tilt: -0.12, arms: [[0.8, -1], [-0.6, -2.4]], legs: NOLEGS },
    { hip: [34, 45], lean: -0.2, tilt: -0.16, arms: [[1, -0.8], [-1.2, -2]], legs: NOLEGS },
    { hip: [39, 46], lean: 0.24, tilt: 0.12, arms: [[-0.4, -0.6], [1.6, 0.2]], legs: NOLEGS, stroke: 1 },
    { hip: [39, 46], lean: 0.2, tilt: 0.1, arms: [[-0.4, -0.6], [1.5, 0.3]], legs: NOLEGS, stroke: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.06, arms: [[0.4, -1.2], [1.4, -1.8]], legs: NOLEGS },
  ],
  // Freed: he lays the quill down and bows to the house.
  dead: { hip: [36, 50], lean: 0.5, tilt: 0.3, arms: [[-0.6, -0.2], [1.4, -0.6]], legs: NOLEGS },
};

function playwright(pose, f, mood) {
  const C = fade(PW, mood === 'dead' ? 'happy' : mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, PW_K);
  const S = solve(P, 1.06);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#3a3a6a');
  const freed = mood === 'dead';
  const A = S.arms[1];
  return big(180, 156, 1.82, () => drawRig(S, {
    behind: () => {
      const out = [...spot(S.hip[0], 77, 20, SPOT)];
      // The cape: a great sweep of night-purple lined in red, its hem rippling, pages caught in it.
      const [cx, cy] = S.chest;
      const tr = pose === 'walk' ? 1 : 0.4;
      const pts = [[cx - 6, cy - 3], [cx + 3, cy - 3], [S.hip[0] + 6, S.hip[1] + 24], [S.hip[0] - 4, S.hip[1] + 26 + Math.sin(ph)], [S.hip[0] - 14 - tr * 4, S.hip[1] + 22 + Math.sin(ph - 1) * 1.4], [S.hip[0] - 10, S.hip[1]]];
      out.push(...opoly(round(pts, 3), C.cape), fpoly([[cx - 4, cy - 2], [cx - 1, cy - 2], [S.hip[0] - 8 - tr * 3, S.hip[1] + 22], [S.hip[0] - 12 - tr * 4, S.hip[1] + 21]], C.lining));
      // The high collar framing his head.
      out.push(...opoly([[S.neck[0] - 7, S.neck[1] + 2], [S.neck[0] - 9, S.neck[1] - 8], [S.neck[0] - 2, S.neck[1] - 2], [S.neck[0] + 1, S.neck[1] + 2]], C.lining));
      // Pages whirling round him, turning over as they go.
      for (let k = 0; k < 6; k++) {
        const a = ph * 0.5 + (k / 6) * TAU;
        const x = S.chest[0] + Math.cos(a) * 20;
        const y = S.chest[1] + 2 + Math.sin(a) * 6;
        if (Math.sin(a) > 0) continue;
        out.push(...within(at(x, y, a), () => [...opoly([[-2.4, -3], [2.4, -3], [2.4, 3], [-2.4, 3]], C.page, 0.3), line([[-1.6, -1], [1.6, -1]], 0.3, C.pageDk), line([[-1.6, 1], [1, 1]], 0.3, C.pageDk)]));
      }
      return out;
    },
    backArm: () => armPart(S.arms[0], C.capeDk, C.skinDk),
    body: () => {
      const g = gown(S, 22, 9, C.capeDk, mix(C.capeDk, '#000000', 0.2), Math.sin(ph) * 0.6);
      const out = [...g.out, ...bodice(S, C.vest, C.capeDk)];
      const [cx, cy] = S.chest;
      // A cravat of ruffled lace, a gold watch chain, a rose in the lapel.
      for (let k = 0; k < 3; k++) out.push(...ooval(cx + 0.4, cy + 0.6 + k * 1.6, 2 - k * 0.3, 1, '#ffffff', 0, 0.25));
      out.push(fband([[cx + 2, cy + 6], [S.hip[0] + 3, S.hip[1] - 2]], 0.4, C.gold, 2), ...ooval(cx - 3, cy + 2, 1.4, 1.3, C.lining), dot(cx - 3, cy + 2, 0.6, C.liningDk));
      return out;
    },
    head: () => headPart(S, mood === 'dead' ? 'happy' : mood, PW_FACE, SWEPT, HR, 1.14, () => backHair(HR, 9), () => [
      // A laurel of quill feathers swept back from his brow.
      ...[0, 1, 2, 3].flatMap((k) => oband([[-4 + k * 2, -8], [-8 + k * 1.4, -13 - k], [-12 + k, -14 - k * 0.6]], taperW(2, 0.4), k % 2 ? C.quill : C.quillDk, 3, 0.3)),
    ]),
    frontArm: () => {
      const out = [];
      // The giant quill: a long white feather, its gold nib dripping ink.
      const a = P.stroke ? A.a - Math.PI / 2 - 0.4 : freed ? Math.PI / 2 - 0.2 : -Math.PI / 2 + 0.3;
      const tip = [A.hand[0] - Math.cos(a) * 6, A.hand[1] - Math.sin(a) * 6];
      const top = [A.hand[0] + Math.cos(a) * 18, A.hand[1] + Math.sin(a) * 18];
      out.push(...oband([tip, top], (t) => Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)) * 5 + 0.4, C.quill, 4));
      out.push(fband([tip, top], 0.4, C.quillDk, 1), ...opoly([[tip[0] - 1, tip[1]], [tip[0] + 1, tip[1]], [tip[0] - Math.cos(a) * 3, tip[1] - Math.sin(a) * 3]], C.nib, 0.3));
      if (!freed) out.push(dot(tip[0] - Math.cos(a) * 4, tip[1] - Math.sin(a) * 4 + (f % 4) * 0.8, 0.7, C.ink));
      out.push(...armPart(A, C.cape, C.skin));
      if (P.stroke) out.push(fband(arcPts(S.hip[0] + 6, S.hip[1] + 4, 26, 14, -80, 40, 10), (t) => 3 * Math.sin(Math.PI * t), C.ink, 1), sparkle(S.hip[0] + 30, S.hip[1] + 10, 3, C.lining));
      if (freed) for (let i = 0; i < 4; i++) out.push(sparkle(S.head[0] - 14 + i * 9, S.head[1] - 14 + (i % 2) * 6 - f, 1.4 + (i % 2), '#ffffff'));
      return out;
    },
  }));
}

export const ART = {
  persona: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 320, 220], draw: persona },
  directrice: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 220], draw: directrice },
  playwright: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [120, 180, 340, 240], draw: playwright },
};

export const INFO = {
  persona: { name: 'Persona, the Two-Faced Muse', w: 54, h: 112 },
  directrice: { name: 'Madame Directrice', w: 54, h: 112 },
  playwright: { name: 'The Phantom Playwright', w: 64, h: 130 },
};
