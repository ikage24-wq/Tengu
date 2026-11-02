// Monster art: the Sky Whale's bosses (docs/design/sky-whale.md), on the sky rig drawn grand to the
// queens' size.
//   gale         Captain Gale: the sky pirates' captain, a huge feathered tricorn, a long coat
//                streaming in the wind, a cutlass and a spyglass, a compass at her throat.
//   matriarch    The Barnacle Matriarch: a tall lady in a gown of shell, a crown of conches, kelp
//                hair, a coral staff, barnacles grown up her gown.
//   whaledream   The Whale's Dream: the whale's own spirit, a translucent sky-blue maiden with a
//                whale-tail cape, fin sleeves and stars inside her, heavy with sleep; when she
//                "falls" she wakes, smiling.
// All face right, feet (or hem) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { solve, plant, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { driftAt, streamer, windUnder, puff, gust } from './skyrig.js';

const { grand, within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, flowPts, lockHair, gem, TAU } = KIT;

function big(w, h, k, fn) {
  return { w, h, res: 3, shapes: grand(k, w / 2 - 36 * k, h - 0.6 - 78 * k, fn) };
}
const frames = (pose) => (pose === 'attack' ? 5 : 8);
function keyed(pose, f, mood, K, float = 0) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = driftAt(K.walk, f, 8, true, float);
  else if (pose === 'attack') P = driftAt(K.attack, f, 4, false);
  else P = driftAt(K.idle, f, 8, true, float);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.32, hip: [P.hip[0] - 2, P.hip[1] + 0.6] };
  return P;
}
const NOLEGS = [[0, 0], [0, 0]];

// ---------- Captain Gale ----------

const GA = soften({
  skin: '#f6d6c0', skinDk: '#e0b49a', hair: '#e8eef8', hairDk: '#b8c4dc', hairLt: '#ffffff',
  coat: '#2a4a8a', coatDk: '#1a3066', coatLt: '#4a6ab0', lining: '#ffd36b', shirt: '#fff6e0', shirtDk: '#e0d4b8', vest: '#c8304e', pant: '#f2ecf6', boot: '#3a2a2a',
  hat: '#2a2a3a', hatDk: '#14141e', trim: '#ffd36b', plume: '#ff7aa8', plume2: '#ffffff', blade: '#e6eef8', bladeDk: '#9aa8c8', hilt: '#ffd36b', glass: '#c8a070', lens: '#9fe8ff', compass: '#ffd36b',
});
const GA_FACE = { skin: GA.skin, skinSh: '#e0b49a', skinSh2: '#c8947a', blush: '#ff9a8a', lip: '#c8304e', lipLine: '#8a102e', eye: eyes('#3ad8c8', '#0a6a6a', '#c8fff6', { tilt: 0.3, ry: 2.5, flicks: 3, lashLen: 1.2 }), brow: { c: '#b8c4dc', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.85, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// A swaggering captain: boot up on the rail, spyglass to the horizon, cutlass twirled.
const GA_K = {
  walk: [
    { hip: [36, 46], lean: 0.08, tilt: 0.06, arms: [[0.4, -0.8], [1, -1.8]], legs: [[-0.5, 0.2], [0.5, 0.05]] },
    { hip: [36, 45], lean: 0.06, tilt: -0.06, arms: [[-0.2, -0.6], [1.1, -1.8]], legs: [[0.5, 0.05], [-0.5, 0.2]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.04, tilt: 0.08, arms: [[0.4, -0.8], [1, -1.8]], legs: [[-0.3, 0.05], [0.9, -1.2]] },
    { hip: [36, 46], lean: -0.06, tilt: -0.12, arms: [[2.3, -2.4], [1, -1.8]], legs: [[-0.3, 0.05], [0.9, -1.2]], glass: 1 },
    { hip: [36, 46], lean: -0.04, tilt: 0.06, arms: [[0.4, -0.8], [1, -1.8]], legs: [[-0.3, 0.05], [0.9, -1.2]] },
    { hip: [36, 46], lean: 0.02, tilt: 0.12, arms: [[0.4, -0.8], [2.6, -0.4]], legs: [[-0.3, 0.05], [0.4, 0.1]], twirl: 1 },
  ],
  // The cutlass drawn back over the shoulder, then a long slash with a crescent of wind.
  attack: [
    { hip: [35, 46], lean: -0.14, tilt: -0.12, arms: [[0.6, -0.8], [-0.4, -1.2]], legs: [[-0.3, 0.1], [0.4, 0.1]], wind: 1 },
    { hip: [34, 46], lean: -0.22, tilt: -0.16, arms: [[0.8, -0.8], [-0.7, -1.3]], legs: [[-0.3, 0.1], [0.4, 0.1]], wind: 1 },
    { hip: [41, 47], lean: 0.3, tilt: 0.14, arms: [[-0.4, -0.6], [1.7, -0.1]], legs: [[-0.7, 0.2], [0.7, 0.2]], slash: 1 },
    { hip: [41, 47], lean: 0.26, tilt: 0.12, arms: [[-0.4, -0.6], [1.6, 0]], legs: [[-0.7, 0.2], [0.7, 0.2]], slash: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.08, arms: [[0.4, -0.8], [1, -1.8]], legs: [[-0.3, 0.05], [0.4, 0.1]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function gale(pose, f, mood) {
  const C = fade(GA, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, GA_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#3a4a6a');
  const [B, A] = S.arms;
  const dead = mood === 'dead';
  // (Drawn back, the blade points up and behind her, never across her face.)
  const ca = P.slash ? A.a - Math.PI / 2 : P.wind > 0.5 ? -Math.PI * 0.8 : P.twirl ? -Math.PI / 2 + Math.sin(ph * 2) * 0.6 : A.a - Math.PI / 2 - 1.2;
  const tip = [A.hand[0] + Math.cos(ca) * 17, A.hand[1] + Math.sin(ca) * 17];
  return big(160, 140, 1.62, () => drawRig(S, {
    behind: () => {
      const out = [...windUnder(S.hip[0], 77, ph)];
      // The long coat's tails streaming back in the wind, gold lining flashing.
      const [hx, hy] = S.hip;
      const g = gust(ph);
      const tail = (k, c) => oband(flowPts([hx - 3, hy - 2 + k * 2], Math.PI - 0.7 + k * 0.1, -0.3 * g, 20 * g - k * 3, ph * 2 + k, 0.24, 6), taperW(6 - k, 2.4), c, 3, 0.3);
      out.push(...tail(0, C.coat), ...tail(1, C.lining), ...tail(2, C.coatDk));
      out.push(...[0, 1, 2].flatMap((k) => lockHair(flowPts([S.head[0] - 6, S.head[1] + k * 3], Math.PI * 0.75 + k * 0.08, -0.4, 20 - k * 3, ph * 2 - k * 0.7, 0.16 * gust(ph, k), 6), 5 - k, HR)));
      return out;
    },
    backArm: () => {
      const out = [...armPart(B, C.coatDk, C.skinDk)];
      if (!dead) {
        // The brass spyglass, raised to look out (held off to the side, clear of her face) or at her hip.
        const ga = P.glass ? -0.3 : B.a - Math.PI / 2 + 1.1;
        const e = [B.hand[0] + Math.cos(ga) * 10, B.hand[1] + Math.sin(ga) * 10];
        out.push(...oband([B.hand, e], taperW(1.6, 2.2), C.glass, 1, 0.3), fband([[lerp(B.hand[0], e[0], 0.5), lerp(B.hand[1], e[1], 0.5) - 1.8], [lerp(B.hand[0], e[0], 0.5), lerp(B.hand[1], e[1], 0.5) + 1.8]], 0.7, C.trim, 1), ...ooval(e[0], e[1], 1, 2.2, C.lens, ga));
      }
      return out;
    },
    backLeg: () => legPart(S.legs[0], C.pant, C.boot),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 6, hy + 4], [hx - 6, hy + 4]], 1), C.pant)];
      out.push(...bodice(S, C.vest, mix(C.vest, '#000000', 0.25)));
      const [cx, cy] = S.chest;
      // The open greatcoat over a red vest, a ruffled shirt, gold buttons, a wide belt and buckle.
      out.push(...opoly([[cx - 5, cy - 1.6], [cx - 1.6, cy + 6], [hx - 4.6, hy + 2], [hx - 6.4, hy + 1]], C.coat, 0.3), ...opoly([[cx + 5, cy - 1.6], [cx + 2.4, cy + 6], [hx + 4.6, hy + 2], [hx + 6.4, hy + 1]], C.coat, 0.3));
      out.push(fband([[cx - 5, cy - 1.6], [cx - 1.6, cy + 6]], 0.6, C.lining, 1), fband([[cx + 5, cy - 1.6], [cx + 2.4, cy + 6]], 0.6, C.lining, 1));
      for (let k = 0; k < 3; k++) out.push(...ooval(cx + 0.4, cy + 0.4 + k * 1.6, 1.8 - k * 0.3, 0.9, C.shirt, 0, 0.25));
      out.push(...oband([[hx - 5, hy - 1], [hx + 5, hy - 1.2]], 1.8, C.boot, 1, 0.3), ...opoly([[hx - 1.2, hy - 2.2], [hx + 1.4, hy - 2.2], [hx + 1.4, hy + 0.2], [hx - 1.2, hy + 0.2]], C.trim, 0.3));
      // A compass on a chain at her throat, its needle swinging.
      out.push(...ooval(cx + 0.4, cy - 1.6, 1.6, 1.6, C.compass), line([[cx + 0.4, cy - 1.6], [cx + 0.4 + Math.sin(ph) * 1.2, cy - 2.8]], 0.4, C.vest));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.pant, C.boot),
    head: () => headPart(S, mood, GA_FACE, SWEPT, HR, 1.12, () => backHair(HR, 9), () => [
      // The great tricorn, gold-trimmed, a plume of feathers streaming back off it.
      ...opoly(round([[-13, -5], [-4, -10], [9, -9], [13, -5], [6, -7.4], [-5, -7.6]], 1.4), C.hat), ...opoly(round([[-7, -8.4], [-4, -16], [6, -16], [8, -8.4]], 2.4), C.hat),
      fband([[-13, -5], [-4, -10], [9, -9], [13, -5]], 0.7, C.trim, 1), ...gem(1, -12, 1.4, C.trim),
      ...streamer([-5, -14], 16, ph, 3.4, C.plume, 1, -0.3), ...streamer([-5, -13], 13, ph, 2.4, C.plume2, 2, -0.1),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The cutlass: a curved blade, a gold basket hilt.
        const mid = [lerp(A.hand[0], tip[0], 0.55) + Math.cos(ca + Math.PI / 2) * 1.4, lerp(A.hand[1], tip[1], 0.55) + Math.sin(ca + Math.PI / 2) * 1.4];
        out.push(...oband([A.hand, mid, tip], taperW(2.2, 0.4), C.blade, 3, 0.3), fband([A.hand, mid, tip], 0.4, C.bladeDk, 2));
        out.push(...ooval(A.hand[0], A.hand[1], 2.4, 2, C.hilt, ca));
        if (P.slash) out.push(fband(arcPts(S.hip[0] + 4, S.hip[1] - 6, 30, 24, -100, 40, 12), (t) => 3.4 * Math.sin(Math.PI * t), mix('#eaf6ff', '#ffffff', 0.4), 1), sparkle(S.hip[0] + 34, S.hip[1], 3.4, '#ffffff'));
      }
      out.push(...armPart(A, C.coat, C.skin));
      return out;
    },
  }));
}

// ---------- The Barnacle Matriarch ----------

const BM = soften({
  skin: '#e8f4f2', skinDk: '#c8dcd8', hair: '#3aa06a', hairDk: '#1a6a4a', hairLt: '#8ad8a8',
  gown: '#5a9ab8', gownDk: '#3a6a8a', gownLt: '#9ad0e0', shell: '#ffd8e2', shellDk: '#e09aac', conch: '#ffe6c8', conchDk: '#e0a87a', pearl: '#ffffff',
  barn: '#ece4d4', barnDk: '#a89a80', coral: '#ff7a8a', coralDk: '#c84a5a', staffGem: '#9fe8ff',
});
const BM_FACE = { skin: BM.skin, skinSh: '#c8dcd8', skinSh2: '#a0bcb8', blush: '#ffb0c0', lip: '#c8607a', lipLine: '#8a3a5a', eye: eyes('#ff9ab0', '#8a2a4a', '#ffe0e8', { tilt: 0.25, ry: 2.6, flicks: 3, lashLen: 1.2 }), brow: { c: '#1a6a4a', kind: 'arched', w: 0.8 }, moods: { idle: { open: 0.7, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// Slow and regal: the staff planted, a hand raised to command her barnacles.
const BM_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 46], lean: 0.06, tilt: 0.04 * Math.sin((i / 4) * TAU), arms: [[0.5, -1], [0.9, -1.6]], legs: NOLEGS })),
  idle: [
    { hip: [36, 46], lean: -0.02, tilt: 0.06, arms: [[0.5, -1], [0.9, -1.6]], legs: NOLEGS },
    { hip: [36, 46], lean: -0.06, tilt: -0.08, arms: [[2.2, -0.8], [0.9, -1.6]], legs: NOLEGS, call: 1 },
    { hip: [36, 46], lean: -0.02, tilt: 0.1, arms: [[0.5, -1], [0.9, -1.6]], legs: NOLEGS },
    { hip: [36, 47], lean: 0.02, tilt: -0.04, arms: [[0.5, -1], [1.1, -1.4]], legs: NOLEGS },
  ],
  // The staff raised high, then brought down: a crash of brine.
  attack: [
    { hip: [35, 46], lean: -0.12, tilt: -0.1, arms: [[0.6, -1], [2.2, -1.4]], legs: NOLEGS },
    { hip: [34, 45], lean: -0.2, tilt: -0.14, arms: [[0.8, -1], [2.8, -0.8]], legs: NOLEGS },
    { hip: [39, 47], lean: 0.26, tilt: 0.12, arms: [[-0.2, -0.6], [1.2, -0.3]], legs: NOLEGS, crash: 1 },
    { hip: [39, 47], lean: 0.22, tilt: 0.1, arms: [[-0.2, -0.6], [1.1, -0.2]], legs: NOLEGS, crash: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.06, arms: [[0.5, -1], [0.9, -1.6]], legs: NOLEGS },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.6, arms: [[0.1, 0.2], [0.4, 0.1]], legs: NOLEGS },
};

function matriarch(pose, f, mood) {
  const C = fade(BM, mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, BM_K);
  const S = solve(P, 1.06);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#0a3a2a');
  const [B, A] = S.arms;
  const dead = mood === 'dead';
  const barn = (x, y, r) => [...ooval(x, y, r, r * 0.8, C.barn, 0, 0.3), ...ooval(x, y - r * 0.2, r * 0.4, r * 0.3, C.barnDk, 0, 0)];
  const sa = P.crash ? A.a - Math.PI / 2 + 0.3 : -Math.PI / 2 + 0.15;
  const foot = [A.hand[0] - Math.cos(sa) * 14, A.hand[1] - Math.sin(sa) * 14];
  const head = [A.hand[0] + Math.cos(sa) * 12, A.hand[1] + Math.sin(sa) * 12];
  return big(170, 150, 1.72, () => drawRig(S, {
    behind: () => {
      const out = [...windUnder(S.hip[0], 77, ph)];
      // Kelp hair, long and heavy, streaming back and down like weed in a current.
      out.push(...[0, 1, 2, 3].flatMap((k) => lockHair(flowPts([S.head[0] - 5, S.head[1] - 2 + k * 3], Math.PI * 0.62 + k * 0.06, -0.3, 26 - k * 3, ph * 2 - k * 0.6, 0.2 * gust(ph, k), 6), 5 - k * 0.6, HR)));
      // A fan of great scallop shell rising behind her like a throne back.
      const [cx, cy] = S.chest;
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + 0.3 + k * 0.4;
        out.push(...oband([[cx - 2, cy + 6], [cx - 2 + Math.cos(a) * 18, cy + 6 + Math.sin(a) * 18]], taperW(1.4, 4), k % 2 ? C.shell : C.shellDk, 1, 0.3));
      }
      return out;
    },
    backArm: () => {
      const out = [...armPart(B, C.gownDk, C.skinDk)];
      if (P.call) for (let k = 0; k < 3; k++) out.push(sparkle(B.hand[0] + (k - 1) * 4, B.hand[1] - 4 - k * 2 - (f % 3), 1.4, C.pearl));
      return out;
    },
    body: () => {
      // A gown of shell scales in sea-blue, flaring to a hem crusted with barnacles and coral.
      const g = gown(S, 22, 12, C.gown, C.gownDk, Math.sin(ph) * 0.5);
      const out = [...g.out, ...bodice(S, C.gown, C.gownDk)];
      const [hx, hy] = S.hip;
      for (let row = 0; row < 3; row++) for (let k = 0; k < 4 + row; k++) out.push(fband(arcPts(hx - 5 - row * 2 + k * 3.2, hy + 3 + row * 5, 1.6, 1.2, 0, 180, 5), 0.4, C.gownLt, 1));
      for (const [dx, dy, r] of [[-11, 21, 1.8], [-7, 22.6, 1.3], [-2, 22, 1.6], [4, 22.4, 1.2], [9, 21.4, 1.7], [-9, 17, 1.1], [7, 17.6, 1]]) out.push(...barn(hx + dx, hy + dy, r));
      out.push(...oband([[hx + 11, hy + 22], [hx + 13, hy + 16], [hx + 15, hy + 14]], 0.9, C.coral, 2, 0.3), ...oband([[hx + 13, hy + 17], [hx + 16, hy + 18]], 0.7, C.coralDk, 1, 0.3));
      const [cx, cy] = S.chest;
      // A collar of pearls and a cameo of a whale.
      for (let k = 0; k < 7; k++) out.push(dot(cx - 4 + k * 1.4, cy - 0.6 + Math.sin((k / 6) * Math.PI) * 2, 0.6, C.pearl));
      out.push(...ooval(cx + 0.4, cy + 3, 1.8, 1.4, C.shell), line([[cx - 0.6, cy + 3], [cx + 1.6, cy + 2.6]], 0.4, C.gownDk));
      return out;
    },
    head: () => headPart(S, mood, BM_FACE, SWEPT, HR, 1.12, () => backHair(HR, 10), () => [
      // A crown of conch shells, points up, a pearl at its brow.
      ...[-6, -1.5, 3].flatMap((x, k) => within(at(x, -9.4 - (k === 1 ? 1.4 : 0), (k - 1) * 0.3), () => [...opoly([[-2, 2], [-1, -4.4], [0, -6.6], [1, -4.4], [2, 2]], C.conch), fband([[-1.4, 0], [1.4, -1.6]], 0.4, C.conchDk, 1), fband([[-1, -2.6], [1, -3.6]], 0.4, C.conchDk, 1)])),
      ...ooval(-1.4, -7.4, 1.1, 1.1, C.pearl), ...barn(5.6, -6.4, 1),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The coral staff: a branching rod of red coral with a sea-glass orb caught in its crown.
        out.push(...oband([foot, head], taperW(1.4, 1.8), C.coral, 1, 0.3));
        out.push(...oband([[lerp(foot[0], head[0], 0.8), lerp(foot[1], head[1], 0.8)], [head[0] + Math.cos(sa - 0.8) * 5, head[1] + Math.sin(sa - 0.8) * 5]], 0.8, C.coralDk, 1, 0.3), ...oband([[lerp(foot[0], head[0], 0.85), lerp(foot[1], head[1], 0.85)], [head[0] + Math.cos(sa + 0.8) * 5, head[1] + Math.sin(sa + 0.8) * 5]], 0.8, C.coralDk, 1, 0.3));
        out.push(...ooval(head[0], head[1], 2.4, 2.4, C.staffGem), dot(head[0] - 0.8, head[1] - 0.8, 0.7, '#ffffff'));
        if (P.crash) for (let k = 0; k < 6; k++) out.push(...ooval(head[0] + 6 + k * 4, head[1] + 2 - Math.sin((k / 5) * Math.PI) * 8, 2 - k * 0.2, 1.6 - k * 0.15, k % 2 ? C.gownLt : '#ffffff', 0, 0.25));
      }
      out.push(...armPart(A, C.gown, C.skin));
      return out;
    },
  }));
}

// ---------- The Whale's Dream ----------

const WD = soften({
  skin: '#e6f4ff', skinDk: '#c4dcf2', hair: '#7ab8f0', hairDk: '#4a88d0', hairLt: '#c8e8ff',
  body: '#9fd0ff', bodyDk: '#6aa0e0', belly: '#eef8ff', bellyDk: '#c8e0f6', fin: '#7ab8f0', finDk: '#4a88d0', star: '#fff3a6', starLt: '#ffffff', glow: '#e6f6ff',
  mist: '#c8e4ff', mistDk: '#8ab8e8', mistLt: '#ffffff',
});
const WD_FACE = { skin: WD.skin, skinSh: '#c4dcf2', skinSh2: '#a0c0e6', blush: '#c8c4ff', lip: '#7a8ad8', lipLine: '#4a5aa8', eye: eyes('#4a6ae0', '#1a2a8a', '#d8e4ff', { rx: 3.4, ry: 2.6, tilt: -0.1, flicks: 2, lashLen: 1.3 }), brow: { c: '#4a88d0', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.4, mouth: 'soft' }, angry: { open: 0.6, mouth: 'pout' }, hurt: { open: 0.8, mouth: 'gasp' }, happy: { open: 1, mouth: 'laugh' } } };
// Drifting asleep: rolling slowly in the air as if in deep water, arms floating.
const WD_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 44], lean: 0.14 + Math.sin((i / 4) * TAU) * 0.04, tilt: 0.1, arms: [[1.2, -0.6], [1.6, -0.6]], legs: NOLEGS })),
  idle: [
    { hip: [36, 44], lean: -0.04, tilt: 0.2, arms: [[1.4, -1], [0.8, -1.2]], legs: NOLEGS },
    { hip: [36, 43], lean: -0.12, tilt: 0.3, arms: [[2.2, -0.6], [1.2, -1.4]], legs: NOLEGS },
    { hip: [36, 44], lean: -0.04, tilt: 0.16, arms: [[1.4, -1], [1.6, -0.8]], legs: NOLEGS },
    { hip: [36, 45], lean: 0.06, tilt: 0.24, arms: [[1, -1.2], [0.8, -1.2]], legs: NOLEGS },
  ],
  // She sings: arms open wide, a slow wave of song rolling out.
  attack: [
    { hip: [36, 44], lean: -0.06, tilt: 0.06, arms: [[0.8, -1.4], [0.8, -1.4]], legs: NOLEGS },
    { hip: [35, 43], lean: -0.16, tilt: -0.1, arms: [[0.4, -1.6], [0.4, -1.8]], legs: NOLEGS },
    { hip: [38, 44], lean: 0.16, tilt: 0.04, arms: [[2.4, -0.2], [2, -0.1]], legs: NOLEGS, song: 1 },
    { hip: [38, 44], lean: 0.14, tilt: 0.04, arms: [[2.5, -0.1], [2.1, 0]], legs: NOLEGS, song: 1 },
    { hip: [36, 44], lean: -0.04, tilt: 0.16, arms: [[1.4, -1], [0.8, -1.2]], legs: NOLEGS },
  ],
  // Woken: she stretches, arms up, wide awake and smiling.
  dead: { hip: [36, 44], lean: -0.06, tilt: -0.06, arms: [[2.8, -0.3], [2.6, -0.2]], legs: NOLEGS },
};

function whaledream(pose, f, mood) {
  const woke = mood === 'dead';
  const C = fade(WD, woke ? 'happy' : mood);
  const ph = (f / frames(pose)) * TAU;
  const P = keyed(pose, f, mood, WD_K, 1.2);
  const S = solve(P, 1.08);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a3a8a');
  const [B, A] = S.arms;
  const fin = (Arm, c) => {
    // A fin sleeve: a long translucent fin trailing from the forearm, rippling.
    const e = Arm.el;
    const h = Arm.hand;
    const back = [h[0] - 8 - Math.sin(ph) * 1.4, h[1] + 4];
    return opoly(round([e, h, [h[0] - 2, h[1] + 3], back, [lerp(e[0], back[0], 0.5) - 2, lerp(e[1], back[1], 0.5) + 2]], 1.6), c, 0.3);
  };
  return big(190, 168, 1.92, () => drawRig(S, {
    behind: () => {
      const out = [];
      // A soft halo of light and a few stars drifting round her.
      // (Soft wisps of dream-mist round her rather than a hard halo.)
      for (let k = 0; k < 4; k++) out.push(...puff(S.chest[0] - 14 + k * 9 + Math.sin(ph + k) * 2, S.chest[1] + 22 - (k % 2) * 16, 4 + (k % 2), C.mist, C.mistLt));
      for (let k = 0; k < 6; k++) {
        const a = ph * 0.4 + (k / 6) * TAU;
        out.push(sparkle(S.chest[0] + Math.cos(a) * 22, S.chest[1] + 6 + Math.sin(a) * 18, 1.2 + (k % 2), k % 2 ? C.star : C.starLt));
      }
      // The whale-tail cape: a long body of sky blue sweeping back to two great flukes.
      const [hx, hy] = S.hip;
      const g = gust(ph);
      const sp = flowPts([S.chest[0] - 2, S.chest[1] + 2], Math.PI * 0.82, -0.5, 30 * g, ph * 1.5, 0.18, 6);
      out.push(...oband(sp, taperW(9, 3), C.body, 4, 0.3), fband(sp.map(([x, y]) => [x + 0.6, y + 2.6]), taperW(4, 1.4), C.belly, 4));
      const t = sp[sp.length - 1];
      const flap = Math.sin(ph * 1.5) * 0.3;
      out.push(...within(at(t[0], t[1], Math.PI * 0.82 + flap), () => [...opoly(round([[0, 0], [6, -8], [10, -9], [7, -3], [3, 0], [7, 3], [10, 9], [6, 8]], 1.4), C.fin), fband([[1, 0], [8, -7]], 0.5, C.finDk, 1), fband([[1, 0], [8, 7]], 0.5, C.finDk, 1)]));
      // Her hair, long and floating like seaweed in slow water.
      out.push(...[0, 1, 2, 3].flatMap((k) => lockHair(flowPts([S.head[0] - 5, S.head[1] - 3 + k * 3], Math.PI * 0.7 + k * 0.08, -0.5, 26 - k * 3, ph * 1.5 - k * 0.6, 0.2, 6), 5.4 - k * 0.7, HR)));
      return out;
    },
    backArm: () => [...fin(B, C.finDk), ...armPart(B, C.bodyDk, C.skinDk)],
    body: () => {
      // A flowing gown of whale-blue with a pale belly front and grooves like a whale's throat,
      // stars glowing inside it.
      const g = gown(S, 24, 12, C.body, C.bodyDk, Math.sin(ph) * 1);
      const out = [...g.out, ...bodice(S, C.body, C.bodyDk)];
      const [hx, hy] = S.hip;
      out.push(...opoly(round([[hx - 2.6, hy - 1], [hx + 3, hy - 1], [hx + 6, hy + 23], [hx - 3, hy + 23]], 2), C.belly, 0.3));
      for (let k = 0; k < 5; k++) out.push(line([[hx - 1.4 + k * 1.4, hy + 2], [hx - 1.4 + k * 2, hy + 21]], 0.35, C.bellyDk));
      for (const [dx, dy, r] of [[-6, 6, 1.4], [-8, 15, 1], [7, 10, 1.2], [-3, 19, 1.6], [9, 19, 1]]) out.push(sparkle(hx + dx, hy + dy, r * (0.8 + 0.3 * Math.sin(ph * 2 + dx)), C.star));
      for (let k = 0; k < 7; k++) out.push(...ooval(hx - 11 + k * 3.8, hy + 23.4 + Math.sin(ph + k) * 0.6, 2.4, 1.4, k % 2 ? C.mist : C.mistLt, 0, 0.2));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.8, 1.8, 195, 345, 6), 0.8, C.belly, 1), ...gem(cx + 0.4, cy + 2.6, 1.3, C.star));
      return out;
    },
    head: () => headPart(S, woke ? 'happy' : mood, woke ? { ...WD_FACE, moods: { ...WD_FACE.moods, happy: { open: 1, mouth: 'laugh' } } } : WD_FACE, BANGS, HR, 1.14, () => backHair(HR, 11), () => [
      // A little crown of a whale's spout: a spray of water drops and a star, rising and falling.
      ...[-2, 0, 2].flatMap((dx, k) => ooval(dx * 1.6, -11 - Math.abs(Math.sin(ph + k)) * 2.4 - (k === 1 ? 1.6 : 0), 1, 1.4, k === 1 ? C.starLt : C.mist, 0, 0.25)),
      ...gem(0, -9, 1.4, C.star),
      ...(woke ? [] : [sparkle(9, -10 - (f % 4), 1, C.starLt), sparkle(11, -13 - (f % 4), 1.4, C.starLt)]),
    ]),
    frontArm: () => {
      const out = [...fin(A, C.fin), ...armPart(A, C.body, C.skin)];
      if (P.song) for (let r = 0; r < 4; r++) out.push(fband(arcPts(S.chest[0] + 4, S.chest[1] + 2, 8 + r * 7, 10 + r * 8, -55, 55, 9), 1.1 - r * 0.2, r % 2 ? C.star : C.mistLt, 1));
      if (woke) for (let i = 0; i < 5; i++) out.push(sparkle(S.head[0] - 18 + i * 9, S.head[1] - 16 + (i % 2) * 6 - f, 1.4 + (i % 2), i % 2 ? C.star : '#ffffff'));
      return out;
    },
  }));
}

export const ART = {
  gale: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 320, 220], draw: gale },
  matriarch: { pad: 8, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [120, 180, 340, 240], draw: matriarch },
  whaledream: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [120, 180, 340, 240], draw: whaledream },
};

export const INFO = {
  gale: { name: 'Captain Gale', w: 54, h: 112 },
  matriarch: { name: 'The Barnacle Matriarch', w: 58, h: 120 },
  whaledream: { name: "The Whale's Dream", w: 70, h: 140 },
};
