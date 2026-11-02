// Monster art: the Sunken Aquarium Palace's swimmers (the levels 20-25 group dungeon, 2026-11, see
// docs/design/aquarium-palace.md), on the fin rig (searig.js: the manor rig's upper body on a
// mermaid tail a swim wave runs down). Nothing here walks: they swim, drift, pulse and kick.
//   jellymaid      Jellyfish Maiden: a jelly-bell hat, a skirt of ribbon tentacles pulsing as she
//                  drifts; stings with a lash of ribbons.
//   seahorseknight Seahorse Knight: a curled seahorse tail, coral armour and a horn lance; bobs
//                  upright and thrusts.
//   anglerlamp     Anglerfish Lamp Girl: a lure on a stalk over her head, a toothy grin; flashes the
//                  lure and lunges.
//   pearldiver     Pearl Diver: a ghostly diver girl in a glass bubble helmet with flippers and a
//                  net of pearls; frog-kicks and throws a pearl.
//   stardancer     Starfish Dancer: a mermaid with starfish clips who swims in pirouettes; a
//                  spinning tail slap.
//   octoscholar    Octopus Scholar: an octopus girl on six curling arms with round glasses,
//                  juggling books; flings a book in a puff of ink.
// All face right, the tail tip (or lowest arm) at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, poseAt, solve, plant, limb3, inHead, drawRig } from './manorrig.js';
import { armPart, legPart, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { tailChain, drawTail, bubbles } from './searig.js';

const { within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const NOLEGS = [[0, 0], [0, 0]];
const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
function keyed(pose, f, mood, K) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 3, false);
  else P = poseAt(K.idle, f, 6);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.22, tilt: -0.3, hip: [P.hip[0] - 1.5, P.hip[1]] };
  return P;
}
// Swimming keys: the hip bobbing on the swim's beat, arms sculling.
const swim = (y, lean, arms, extra = {}) => [0, 1, 2, 3].map((i) => {
  const s = Math.sin((i / 4) * TAU);
  return { hip: [36, y + s * 1.4], lean: lean + s * 0.03, tilt: 0.05 - s * 0.05, arms: arms(s), legs: NOLEGS, ...extra };
});

// ---------- Jellyfish Maiden ----------

const JM = soften({
  skin: '#f4f0ff', skinDk: '#dcd4f6', hair: '#c9b6ff', hairDk: '#9a84e0', hairLt: '#f0e8ff',
  bell: '#ffb3e0', bellDk: '#e07ab8', bellLt: '#ffe6f6', rib: '#c9b6ff', ribDk: '#9a84e0', rib2: '#9fe8ff',
  dress: '#ffd6f0', dressDk: '#f0a8d0', glow: '#fff0fa', spot: '#ffffff',
});
const JM_FACE = { skin: JM.skin, skinSh: '#dcd4f6', skinSh2: '#b8acdc', blush: '#ffa8d8', lip: '#e07ab8', lipLine: '#a84a8a', eye: eyes('#ff9fd8', '#a83a8a', '#ffe6f6', { rx: 3.6, ry: 3.2 }), brow: { c: '#9a84e0', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.75, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const JM_K = {
  walk: swim(36, 0.06, (s) => [[0.9 + s * 0.4, -0.9], [1.1 - s * 0.4, -1.1]]),
  idle: [
    { hip: [36, 37], lean: 0, tilt: 0.12, arms: [[1, -1], [1.2, -1.2]], legs: NOLEGS, pulse: 0 },
    { hip: [36, 34.6], lean: 0, tilt: 0.18, arms: [[0.6, -0.6], [0.7, -0.7]], legs: NOLEGS, pulse: 1 },
    { hip: [36, 35.6], lean: 0, tilt: 0.06, arms: [[1.1, -1.2], [1.3, -1.4]], legs: NOLEGS, pulse: 0.4 },
  ],
  attack: [
    { hip: [34, 35], lean: -0.12, tilt: -0.1, arms: [[0.8, -1], [-0.8, -1.6]], legs: NOLEGS, lash: 0 },
    { hip: [39, 36], lean: 0.18, tilt: 0.1, arms: [[0.4, -0.6], [1.6, -0.2]], legs: NOLEGS, lash: 1 },
    { hip: [39, 36], lean: 0.14, tilt: 0.08, arms: [[0.4, -0.6], [1.7, -0.1]], legs: NOLEGS, lash: 1 },
    { hip: [37, 36], lean: 0.02, tilt: 0.06, arms: [[1, -1], [1.2, -1.2]], legs: NOLEGS, lash: 0 },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function jellymaid(pose, f, mood) {
  const C = fade(JM, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, JM_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#4a3a8a');
  const lash = pose === 'attack' ? P.lash ?? 0 : 0;
  // The pulse: the skirt opens and closes like a bell as she drifts.
  const pulse = 0.5 + 0.5 * Math.sin(ph * (pose === 'walk' ? 2 : 1));
  const shapes = drawRig(S, {
    behind: () => {
      const out = [];
      const [hx, hy] = S.hip;
      // Ribbon tentacles trailing behind and below her, rippling, two colours.
      for (let k = 0; k < 6; k++) {
        const x0 = hx - 5 + k * 2.2;
        const pts = KIT.flowPts([x0, hy + 6], Math.PI / 2 + 0.25 + k * 0.05 + (pose === 'walk' ? 0.3 : 0), 0.4, 22 + (k % 3) * 6 - pulse * 3, ph - k * 0.7, 0.4, 6, 0.9);
        out.push(...oband(pts, (t) => lerp(1.8, 0.5, t), k % 2 ? C.rib : C.rib2, 4, 0.3));
      }
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [];
      // The skirt: a jelly bell that opens and closes, scalloped, dotted.
      const w = 7 + pulse * 2;
      out.push(...opoly(round([[hx - 4, hy - 1.4], [hx + 4, hy - 1.4], [hx + w, hy + 6 - pulse], [hx + w - 2, hy + 8], [hx - w + 2, hy + 8], [hx - w, hy + 6 - pulse]], 2), C.bell));
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - w + 2 + k * ((w * 2 - 4) / 4), hy + 8.2, 1.4, 0.9, C.bellLt, 0, 0.25));
      for (const [dx, dy] of [[-3, 3], [2, 4.4], [-0.4, 1.4]]) out.push(dot(hx + dx, hy + dy, 0.6, C.spot));
      out.push(...bodice(S, C.dress, C.dressDk));
      const [cx, cy] = S.chest;
      out.push(...ooval(cx + 0.2, cy + 2.6, 1.3, 1.3, C.bell), dot(cx, cy + 2.3, 0.45, '#ffffff'));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, 2.2, C.bellLt));
      return out;
    },
    head: () => headPart(S, mood, JM_FACE, BANGS, HR, 1.15, null, () => {
      // The jelly-bell hat: translucent dome with a glow and dots, its frilled rim lifting.
      const lift = pulse * 0.8;
      const out = [...opoly(round([[-9, -2 - lift], [-8, -8], [-3, -12.4], [3, -12.6], [8, -8.6], [9.4, -3 - lift], [6, -4], [2, -3.2], [-2, -3.4], [-6, -3]], 3), C.bell)];
      out.push(fband(arcPts(-0.4, -7, 6, 4, 200, 300, 6), 0.9, C.bellLt, 1), dot(-3, -9, 0.7, C.spot), dot(2.6, -10, 0.6, C.spot), dot(5.4, -7, 0.5, C.spot));
      for (let k = 0; k < 6; k++) out.push(...ooval(-8 + k * 3.4, -3 - lift * (k % 2) + 0.4, 1.4, 0.9, C.bellDk, 0, 0.25));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const out = [...armPart(A, C.dress, C.skin)];
      if (lash > 0.5) {
        // A lash of stinging ribbons out ahead, crackling.
        for (let k = 0; k < 3; k++) {
          const pts = KIT.flowPts(A.hand, -0.1 + k * 0.18, -0.3, 18 + k * 3, ph + k, 0.3, 5);
          out.push(...oband(pts, taperW(1.6, 0.4), k % 2 ? C.rib : C.rib2, 3, 0.3));
        }
        out.push(sparkle(A.hand[0] + 20, A.hand[1] - 1, 2, '#ffffff'), sparkle(A.hand[0] + 15, A.hand[1] + 5, 1.2, '#fff0fa'));
      }
      if (mood !== 'dead') out.push(...bubbles(S.head[0] + 7, S.head[1] - 10, f, n, '#eaf6ff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Seahorse Knight ----------

const SK = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ffcf6b', hairDk: '#e0a040', hairLt: '#fff0c0',
  tail: '#ffb35a', tailDk: '#e0802a', tailLt: '#ffe0a8', fin: '#7fe0d0', finDk: '#4ab8a8',
  armor: '#ff8a8a', armorDk: '#d85a6a', armorLt: '#ffd0d0', lance: '#fff6e6', lanceDk: '#d8c8b0', pearl: '#ffffff',
});
const SK_FACE = { skin: SK.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa8b8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#4ab8a8', '#1a6a6a', '#c8f6ee', { tilt: 0.25, ry: 2.5 }), brow: { c: '#e0a040', kind: 'straight', w: 0.8 }, moods: { idle: { open: 0.9, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const SK_K = {
  // Upright, bobbing in hops like a seahorse, the tail curling under.
  walk: [0, 1, 2, 3].map((i) => {
    const s = Math.sin((i / 4) * TAU);
    return { hip: [36, 40 - Math.abs(s) * 2.4], lean: 0.04, tilt: 0, arms: [[0.3, -1.4], [0.5, -1.6]], legs: NOLEGS, lance: -1.1 };
  }),
  idle: [
    { hip: [36, 40], lean: -0.04, tilt: -0.04, arms: [[0.3, -1.4], [0.4, -1.5]], legs: NOLEGS, lance: -1.15 },
    { hip: [36, 38.8], lean: -0.05, tilt: 0.04, arms: [[0.3, -1.5], [0.5, -1.6]], legs: NOLEGS, lance: -1.1 },
    { hip: [36, 39.6], lean: -0.04, tilt: -0.06, arms: [[0.3, -1.4], [0.4, -1.5]], legs: NOLEGS, lance: -1.2 },
  ],
  attack: [
    { hip: [32, 40], lean: -0.16, tilt: -0.1, arms: [[0.6, -1.2], [-0.6, -1.4]], legs: NOLEGS, lance: -0.2 },
    { hip: [42, 41], lean: 0.24, tilt: 0.12, arms: [[-0.4, -0.6], [1.5, -0.2]], legs: NOLEGS, lance: 0 },
    { hip: [42, 41], lean: 0.2, tilt: 0.1, arms: [[-0.4, -0.6], [1.55, -0.1]], legs: NOLEGS, lance: 0 },
    { hip: [37, 40], lean: 0.02, tilt: 0, arms: [[0.3, -1.4], [0.4, -1.5]], legs: NOLEGS, lance: -1 },
  ],
  dead: { hip: [34, 60], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS, lance: 1.4 },
};

function seahorseknight(pose, f, mood) {
  const C = fade(SK, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, SK_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a4a2a');
  const A = S.arms[1];
  const lA = A.a - Math.PI / 2 + (P.lance ?? 0);
  const tip = [A.hand[0] + Math.cos(lA) * 20, A.hand[1] + Math.sin(lA) * 20];
  const shapes = drawRig(S, {
    behind: () => {
      // The seahorse tail: down, then curling forward into a spiral under her.
      const chain = tailChain([S.hip[0], S.hip[1] + 4], { base: 0.1, curl: -3.4, wave: 0.25, len: 34, n: 7 }, ph);
      const out = [...oband(chain.pts, (t) => lerp(8, 1.6, t), C.tail, 4)];
      const sp = KIT.spline(chain.pts, 4);
      for (let i = 2; i < sp.length - 2; i += 2) out.push(fband([[sp[i][0] - 2, sp[i][1]], [sp[i][0] + 2, sp[i][1] + 0.6]], 0.5, C.tailDk, 1));
      // A dorsal fin fluttering on her back.
      const [hx, hy] = S.hip;
      out.push(...opoly(round([[hx - 4, hy - 6], [hx - 9 - Math.sin(ph * 2), hy - 2], [hx - 8, hy + 4], [hx - 4, hy + 2]], 1), C.fin));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.armorDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.armor, C.armorDk)];
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      // Coral armour: a scalloped skirt of plates, a shell breastplate, a coral pauldron.
      for (let k = 0; k < 4; k++) out.push(...ooval(hx - 4.4 + k * 2.9, hy + 2.2, 2, 2.6, k % 2 ? C.armor : C.armorLt));
      for (let k = 0; k < 4; k++) out.push(fband(arcPts(cx + 0.4, cy + 4.2, 1 + k * 0.9, 1 + k * 0.7, 200, 340, 5), 0.4, C.armorDk, 1));
      const [sx, sy] = S.arms[1].sh;
      out.push(...ooval(sx, sy + 0.6, 3, 2.6, C.armor), ...oband([[sx - 1, sy - 1], [sx + 1, sy - 4], [sx + 3, sy - 5]], taperW(1.2, 0.5), C.armorLt, 2, 0.3));
      return out;
    },
    head: () => headPart(S, mood, SK_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 6), ...KIT.lockHair(KIT.flowPts([-6, -2], Math.PI / 2 + 0.3, 0.3, 12, ph - 0.7, 0.16, 5), 4, HR)], () => {
      // A seahorse-crest helm: a coral ridge of fins along the crown and a snout visor tipped up.
      const out = [...opoly(round([[-7.6, -2], [-7, -7.6], [-2.4, -10.6], [3.6, -10.4], [7.6, -6.6], [8, -4], [5, -5.6], [0, -7.4], [-5, -5.4], [-5.6, -1]], 2), C.armor)];
      for (let k = 0; k < 4; k++) out.push(...opoly([[-4 + k * 2.6, -10 + Math.abs(k - 1.5) * 0.6], [-3 + k * 2.6, -13.4 + Math.abs(k - 1.5)], [-1.6 + k * 2.6, -10.2 + Math.abs(k - 1.5) * 0.6]], C.fin));
      out.push(fband(arcPts(0, -5, 6.6, 4.4, 210, 330, 6), 0.6, C.armorLt, 1));
      return out;
    }),
    frontArm: () => {
      // The narwhal-horn lance, twisted, a pearl at the guard.
      const out = [...oband([A.hand, tip], taperW(2.2, 0.3), C.lance, 1, 0.3)];
      for (let k = 1; k < 6; k++) {
        const u = k / 6;
        const p = [lerp(A.hand[0], tip[0], u), lerp(A.hand[1], tip[1], u)];
        out.push(line([[p[0] - Math.sin(lA) * 1.4, p[1] + Math.cos(lA) * 1.4], [p[0] + Math.cos(lA) * 1.2 + Math.sin(lA) * 1.2, p[1] + Math.sin(lA) * 1.2 - Math.cos(lA) * 1.2]], 0.35, C.lanceDk));
      }
      out.push(...ooval(A.hand[0] + Math.cos(lA) * 1.4, A.hand[1] + Math.sin(lA) * 1.4, 1.6, 1.6, C.pearl), ...armPart(A, C.armor, C.skin));
      if (pose === 'attack' && (f === 1 || f === 2)) {
        out.push(fband([[A.hand[0] - 4, A.hand[1]], [tip[0] + 4, tip[1]]], (t) => 2.4 * Math.sin(Math.PI * t), mix(C.fin, '#ffffff', 0.5), 1));
        out.push(sparkle(tip[0] + 2, tip[1], 2.4, '#ffffff'), ...bubbles(tip[0] - 6, tip[1] + 2, f, n, '#eaf6ff', 4));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Anglerfish Lamp Girl ----------

const AL = soften({
  skin: '#c8d0ff', skinDk: '#a8b0e8', hair: '#3a3a8a', hairDk: '#24246a', hairLt: '#6a6ac8',
  tail: '#4a4aa8', tailDk: '#30307e', tailLt: '#7a7ad0', fin: '#6a8ae0', finDk: '#4a62c0',
  dress: '#30307e', dressDk: '#22225e', lure: '#fff3a6', lureHot: '#ffffff', lureGlow: '#ffe066', stalk: '#6a6ac8', tooth: '#ffffff',
});
const AL_FACE = { skin: AL.skin, skinSh: '#a8b0e8', skinSh2: '#8890d0', blush: '#a8a0ff', lip: '#6a5ac8', lipLine: '#3a2a8a', eye: eyes('#fff066', '#a88a0a', '#ffffd0', { rx: 3.7, ry: 3.4, pupil: 'slit' }), brow: { c: '#24246a', kind: 'arched', w: 0.8 }, moods: { idle: { open: 0.95, mouth: 'grin' }, angry: { mouth: 'snarl' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const AL_K = {
  walk: swim(37, 0.18, (s) => [[1.4 + s * 0.3, -0.9], [0.9 - s * 0.3, -1.2]]),
  idle: [
    { hip: [36, 38], lean: 0.08, tilt: 0.1, arms: [[0.6, -1.4], [0.8, -1.6]], legs: NOLEGS, lure: 0 },
    { hip: [36, 36.6], lean: 0.1, tilt: 0.16, arms: [[0.6, -1.5], [0.9, -1.8]], legs: NOLEGS, lure: 1 },
    { hip: [36, 37.6], lean: 0.06, tilt: 0.06, arms: [[0.6, -1.4], [0.8, -1.5]], legs: NOLEGS, lure: 0.4 },
  ],
  // The lure flares, then she lunges jaws first.
  attack: [
    { hip: [33, 37], lean: -0.16, tilt: -0.14, arms: [[0.8, -1.6], [0.6, -1.8]], legs: NOLEGS, lure: 1.5 },
    { hip: [43, 38], lean: 0.32, tilt: 0.16, arms: [[-0.6, -0.4], [1.3, -0.4]], legs: NOLEGS, lure: 0.6 },
    { hip: [43, 38], lean: 0.28, tilt: 0.14, arms: [[-0.6, -0.4], [1.4, -0.3]], legs: NOLEGS, lure: 0.4 },
    { hip: [37, 38], lean: 0.08, tilt: 0.06, arms: [[0.6, -1.4], [0.8, -1.6]], legs: NOLEGS, lure: 0.2 },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS, lure: 0 },
};

function anglerlamp(pose, f, mood) {
  const C = fade(AL, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, AL_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#10104a');
  const glowK = mood === 'dead' ? 0 : P.lure ?? 0.3;
  const shapes = drawRig(S, {
    behind: () => drawTail(tailChain([S.hip[0], S.hip[1] + 4], { base: 0.35, curl: 0.9, wave: 0.55, len: 34 }, ph), 9, C, ph),
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.dress, C.dressDk)];
      const [cx, cy] = S.chest;
      // Little glowing spots down the front like the deep-sea fish.
      for (let k = 0; k < 4; k++) out.push(dot(cx + 1.6, cy + 1.4 + k * 3, 0.55, mix(C.lure, C.dress, 0.3)));
      out.push(...ooval(S.arms[1].sh[0], S.arms[1].sh[1] + 1, 2.4, 2.2, C.dress));
      return out;
    },
    head: () => headPart(S, mood, AL_FACE, BANGS, HR, 1.18, () => backHair(HR, 9), () => {
      // The lure: a stalk from her crown curving out over her face, the lamp at its end glowing.
      const sw = Math.sin(ph) * 1.2;
      const lx = 10 + sw;
      const ly = -14 + Math.cos(ph) * 0.8;
      const out = [...oband([[-1, -8], [2, -16], [7, -18 + sw * 0.4], [lx, ly]], taperW(1.4, 0.7), C.stalk, 4, 0.3)];
      out.push(...ooval(lx, ly + 2, 2.4 + glowK * 0.6, 2.6 + glowK * 0.6, C.lure), ...ooval(lx - 0.4, ly + 1.6, 1.1, 1.2, C.lureHot));
      if (glowK > 0.8) out.push(sparkle(lx, ly + 2, 4 + glowK * 2, '#ffffff'));
      // Two fin-ears and a row of tiny fang teeth showing at the grin.
      out.push(...opoly([[-8, -2], [-12, -6 + sw * 0.3], [-11, 0]], C.fin), ...opoly([[-7.6, 1], [-11.4, 0.6], [-9, 3]], C.finDk));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const out = [...armPart(A, C.dress, C.skin)];
      if (pose === 'attack' && (f === 1 || f === 2)) {
        // The chomp: a bite mark of teeth snapping shut ahead of her.
        const [x, y] = [S.head[0] + 16, S.head[1] + 2];
        out.push(...opoly([[x - 6, y - 5], [x + 6, y - 5], [x + 6, y - 3], [x - 6, y - 3]], C.tooth), ...opoly([[x - 6, y + 3], [x + 6, y + 3], [x + 6, y + 5], [x - 6, y + 5]], C.tooth));
        for (let k = 0; k < 4; k++) out.push(fpoly([[x - 6 + k * 3, y - 3], [x - 4.5 + k * 3, y - 0.6], [x - 3 + k * 3, y - 3]], C.tooth), fpoly([[x - 6 + k * 3, y + 3], [x - 4.5 + k * 3, y + 0.6], [x - 3 + k * 3, y + 3]], C.tooth));
        out.push(sparkle(x + 8, y, 2, C.lure));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Pearl Diver ----------

const PV = soften({
  skin: '#eaf6ff', skinDk: '#cce0f2', hair: '#9fe8ff', hairDk: '#6ac0e0', hairLt: '#e6fbff',
  suit: '#5ac8c8', suitDk: '#3a9aa8', suitLt: '#9ae6e0', glass: '#dff6ff', glassLt: '#ffffff', brass: '#ffd36b', brassDk: '#c8902a',
  flip: '#ff9f6a', flipDk: '#e0703a', net: '#e8dcc8', pearl: '#ffffff', pearl2: '#ffe6f2',
});
const PV_FACE = { skin: PV.skin, skinSh: '#cce0f2', skinSh2: '#a8c4e0', blush: '#ffb4c4', lip: '#e07a8a', lipLine: '#a84a5a', eye: eyes('#5ac8c8', '#1a7a7a', '#d0f6f6', { rx: 3.5, ry: 3 }), brow: { c: '#6ac0e0', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const PV_K = {
  // A frog kick: legs fold, then shoot back straight, the body gliding forward between kicks.
  walk: [
    { hip: [36, 42], lean: 0.5, tilt: 0.1, arms: [[2.2, -0.2], [2.4, -0.2]], legs: [[-1, 0.2], [-1.1, 0.2]] },
    { hip: [38, 41], lean: 0.55, tilt: 0.12, arms: [[1.2, -0.6], [1.4, -0.6]], legs: [[-0.2, 1.8], [-0.3, 1.9]] },
    { hip: [36, 42], lean: 0.52, tilt: 0.08, arms: [[0.4, -0.2], [0.6, -0.2]], legs: [[-1.3, 0.1], [-1.25, 0.1]] },
    { hip: [35, 42], lean: 0.5, tilt: 0.1, arms: [[1.6, -0.4], [1.8, -0.4]], legs: [[-1.2, 0.1], [-1.15, 0.2]] },
  ],
  idle: [
    { hip: [36, 42], lean: 0.05, tilt: 0.1, arms: [[0.6, -0.8], [0.4, -1.4]], legs: [[0.1, 0.6], [-0.3, 0.9]] },
    { hip: [36, 40.6], lean: 0.05, tilt: 0.16, arms: [[0.7, -0.9], [0.5, -1.5]], legs: [[0.3, 0.9], [-0.1, 0.6]] },
    { hip: [36, 41.4], lean: 0.05, tilt: 0.06, arms: [[0.6, -0.8], [0.4, -1.4]], legs: [[0.1, 0.6], [-0.3, 0.9]] },
  ],
  attack: [
    { hip: [34, 42], lean: -0.1, tilt: -0.1, arms: [[0.4, -0.8], [-1.6, -1.6]], legs: [[0.2, 0.6], [-0.4, 0.8]], throw: 1 },
    { hip: [38, 42], lean: 0.2, tilt: 0.1, arms: [[-0.4, -0.4], [1.8, -0.4]], legs: [[-0.3, 0.6], [0.3, 0.4]], throw: 0 },
    { hip: [38, 42], lean: 0.16, tilt: 0.08, arms: [[-0.4, -0.4], [1.9, -0.3]], legs: [[-0.3, 0.6], [0.3, 0.4]], throw: 0 },
    { hip: [37, 42], lean: 0.05, tilt: 0.06, arms: [[0.6, -0.8], [0.4, -1.4]], legs: [[0.1, 0.6], [-0.3, 0.9]], throw: 0 },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: [[1.2, -1.4], [1, -1.2]] },
};

function flipperLeg(L, C, back) {
  const out = [...limb3(L.hip, L.kn, L.ft, 3.2, 2.6, 2, back ? C.suitDk : C.suit)];
  const a = Math.atan2(L.ft[1] - L.kn[1], L.ft[0] - L.kn[0]);
  const [fx, fy] = L.ft;
  const ex = fx + Math.cos(a) * 7;
  const ey = fy + Math.sin(a) * 7;
  out.push(...opoly(round([[fx - Math.sin(a) * 1.6, fy + Math.cos(a) * 1.6], [ex - Math.sin(a) * 3, ey + Math.cos(a) * 3], [ex + Math.sin(a) * 3, ey - Math.cos(a) * 3], [fx + Math.sin(a) * 1.6, fy - Math.cos(a) * 1.6]], 1), back ? C.flipDk : C.flip));
  return out;
}

function pearldiver(pose, f, mood) {
  const C = fade(PV, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, PV_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a5a7a');
  const A = S.arms[1];
  const shapes = drawRig(S, {
    behind: () => {
      // The net of pearls slung at her back, swinging.
      const [hx, hy] = S.hip;
      const sw = Math.sin(ph) * 1.4;
      const out = [...ooval(hx - 5 + sw, hy + 1, 4, 3.6, C.net)];
      for (let k = 0; k < 4; k++) out.push(...ooval(hx - 6.4 + sw + (k % 2) * 2.6, hy - 0.4 + Math.floor(k / 2) * 2.4, 1.2, 1.2, k % 2 ? C.pearl : C.pearl2, 0, 0.25));
      out.push(line([[hx - 5 + sw, hy - 2.6], [S.chest[0], S.chest[1]]], 0.5, C.net));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.suitDk, C.skinDk),
    backLeg: () => flipperLeg(S.legs[0], C, true),
    body: () => {
      const out = [...bodice(S, C.suit, C.suitDk)];
      const [hx, hy] = S.hip;
      const [cx, cy] = S.chest;
      out.push(...opoly(round([[hx - 4, hy - 1.4], [hx + 4, hy - 1.4], [hx + 4.4, hy + 2.6], [hx - 4.4, hy + 2.6]], 1), C.suit));
      // A brass belt and a stripe down the suit, a little air tank on her back.
      out.push(line([[hx - 4, hy - 1], [hx + 4, hy - 1]], 1, C.brass), fband([[cx + 1.4, cy - 1], [hx + 1.6, hy - 1]], 0.7, C.suitLt, 1));
      out.push(...opoly(round([[cx - 5.6, cy - 1], [cx - 3, cy - 1], [cx - 3, hy - 3], [cx - 5.6, hy - 3]], 2), C.brass));
      return out;
    },
    frontLeg: () => flipperLeg(S.legs[1], C, false),
    head: () => headPart(S, mood, PV_FACE, BANGS, HR, 1.12, () => [...backHair(HR, 6), ...KIT.lockHair(KIT.flowPts([-5, -3], Math.PI + 0.2, 0.6, 12, ph - 0.7, 0.3, 5), 3.6, HR)], () => {
      // The glass bubble helmet: a clear dome over the whole head, a brass collar and a shine.
      const out = [fband(arcPts(0, -1.4, 11, 11.4, 0, 360, 24), 0.9, C.glass, 1)];
      out.push(fband(arcPts(-2, -4, 7.6, 7.6, 200, 250, 6), 1.2, C.glassLt, 1), dot(5.6, -7.6, 0.9, C.glassLt));
      out.push(...opoly(round([[-9, 8], [9, 8], [8, 11], [-8, 11]], 1), C.brass), dot(-5, 9.4, 0.6, C.brassDk), dot(0, 9.6, 0.6, C.brassDk), dot(5, 9.4, 0.6, C.brassDk));
      return out;
    }),
    frontArm: () => {
      const out = [...armPart(A, C.suit, C.skin)];
      if (pose === 'attack' && P.throw > 0.5) out.push(...ooval(A.hand[0], A.hand[1] - 1, 2, 2, C.pearl), dot(A.hand[0] - 0.6, A.hand[1] - 1.6, 0.6, '#ffffff'));
      if (pose === 'attack' && (f === 1 || f === 2)) {
        const k = f === 1 ? 1 : 1.6;
        const px = A.hand[0] + 8 * k;
        out.push(...ooval(px, A.hand[1] - 1, 2.2, 2.2, C.pearl), dot(px - 0.7, A.hand[1] - 1.8, 0.7, '#ffffff'), fband([[px - 9, A.hand[1]], [px - 2, A.hand[1] - 1]], (t) => 1.6 * t, mix(C.pearl2, '#ffffff', 0.4), 1));
      }
      if (mood !== 'dead') out.push(...bubbles(S.head[0] + 6, S.head[1] - 13, f, n, '#eaf6ff', 3));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Starfish Dancer ----------

const SD = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ff9a8a', hairDk: '#e06a6a', hairLt: '#ffd4c8',
  tail: '#ff8fb8', tailDk: '#e0608e', tailLt: '#ffd0e2', fin: '#ffd36b', finDk: '#f0a82a',
  top: '#ffd36b', topDk: '#e0a82a', star: '#ff9a5a', starDk: '#e0703a', shell: '#fff4f0',
});
const SD_FACE = { skin: SD.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa0a8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#ff8f6a', '#a8401a', '#ffe0d0', { rx: 3.5, ry: 2.9, tilt: 0.1 }), brow: { c: '#e06a6a', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.9, mouth: 'grin' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const SD_K = {
  // She swims in a dancer's line: arms up in fifth, then sweeping open, the tail rolling.
  walk: swim(37, 0.1, (s) => [[2.4 - s * 0.6, -0.6], [2.6 + s * 0.4, -0.5]]),
  idle: [
    { hip: [36, 38], lean: -0.04, tilt: 0.12, arms: [[2.6, -0.4], [2.8, -0.5]], legs: NOLEGS, spin: 0 },
    { hip: [36, 36.6], lean: -0.06, tilt: 0.2, arms: [[1.4, -0.4], [1.6, -0.4]], legs: NOLEGS, spin: 0 },
    { hip: [36, 37.4], lean: -0.02, tilt: 0.06, arms: [[2.6, -0.4], [2.8, -0.5]], legs: NOLEGS, spin: 0 },
  ],
  // A spin (a clean mirror flip at the half turn) and a tail slap.
  attack: [
    { hip: [34, 37], lean: -0.1, tilt: -0.1, arms: [[2.8, -0.2], [2.9, -0.3]], legs: NOLEGS, spin: 0 },
    { hip: [38, 36], lean: 0.1, tilt: 0.1, arms: [[1.6, 0], [1.6, 0]], legs: NOLEGS, spin: 1 },
    { hip: [39, 37], lean: 0.16, tilt: 0.1, arms: [[1.2, -0.4], [1.8, -0.2]], legs: NOLEGS, spin: 0, slap: 1 },
    { hip: [37, 37], lean: 0, tilt: 0.08, arms: [[2.6, -0.4], [2.8, -0.5]], legs: NOLEGS, spin: 0 },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function starShape(x, y, r, c, a = 0) {
  return opoly(Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 ? r * 0.45 : r;
    const t = a + (i * Math.PI) / 5 - Math.PI / 2;
    return [x + Math.cos(t) * rr, y + Math.sin(t) * rr];
  }), c, 0.3);
}

function stardancer(pose, f, mood) {
  const C = fade(SD, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, SD_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a2a3a');
  const slap = pose === 'attack' && f === 2;
  const draw = () => drawRig(S, {
    behind: () => {
      const out = drawTail(tailChain([S.hip[0], S.hip[1] + 4], { base: slap ? -0.9 : 0.4, curl: slap ? -1.6 : 1.2, wave: 0.6, len: 36 }, ph), 9, C, ph);
      for (const k of [0, 1]) out.push(...KIT.lockHair(KIT.flowPts([S.head[0] - 7, S.head[1] - 2 + k * 3], Math.PI / 2 + 0.6 + k * 0.2, 0.5, 18 - k * 4, ph - k * 0.6, 0.3, 5), 4.4 - k, HR));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.skinDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.top, C.topDk)];
      const [cx, cy] = S.chest;
      out.push(...ooval(cx - 1.4, cy + 2.2, 1.8, 1.6, C.shell), ...ooval(cx + 2, cy + 2.2, 1.8, 1.6, C.shell));
      for (let k = 0; k < 6; k++) out.push(dot(S.hip[0] - 3.6 + k * 1.4, S.hip[1] - 1.6 + Math.sin(k) * 0.3, 0.45, '#ffffff'));
      return out;
    },
    head: () => headPart(S, mood, SD_FACE, SWEPT, HR, 1.15, null, () => [...starShape(-4.4, -7.4, 3, C.star, 0.2), ...starShape(2, -9, 2.2, C.starDk, -0.3), dot(-4.4, -7.4, 0.6, '#ffffff')]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.skin, C.skin)];
      if (pose === 'attack' && f === 1) for (let k = 0; k < 5; k++) out.push(...starShape(S.hip[0] + Math.cos(k * 1.26) * 16, S.hip[1] - 6 + Math.sin(k * 1.26) * 10, 1.6, k % 2 ? C.star : C.fin, k));
      if (slap) out.push(fband(arcPts(S.hip[0] + 4, S.hip[1] + 14, 18, 12, -60, 40, 8), (t) => 3 * Math.sin(Math.PI * t), mix(C.tailLt, '#ffffff', 0.4), 1), sparkle(S.hip[0] + 20, S.hip[1] + 10, 2.4, '#ffffff'));
      return out;
    },
  });
  // The spin: the whole figure flips cleanly at the half turn (never squeezed).
  const shapes = P.spin > 0.5 ? within((x, y) => [72 - x, y], draw) : draw();
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Octopus Scholar ----------

const OS = soften({
  skin: '#ffe6f0', skinDk: '#f2c8d8', hair: '#c86a9a', hairDk: '#a04a7a', hairLt: '#f0a8c8',
  arm: '#ff9ab8', armDk: '#e0709a', armLt: '#ffd0e0', sucker: '#fff0f4',
  coat: '#7a6ad8', coatDk: '#5a4ab8', lens: '#dff0ff', rim: '#ffd36b', book: '#7fd8a8', book2: '#ffb35a', book3: '#9fb8ff', page: '#fff8ec', ink: '#3a2a5a',
});
const OS_FACE = { skin: OS.skin, skinSh: '#f2c8d8', skinSh2: '#dca8bc', blush: '#ff9ab8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#a86ad8', '#4a2a8a', '#ecdcff', { rx: 3.2, ry: 2.8 }), brow: { c: '#a04a7a', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const OS_K = {
  walk: swim(42, 0.04, (s) => [[0.8, -1.6 + s * 0.3], [0.9, -1.8 - s * 0.3]]),
  idle: [
    { hip: [36, 42], lean: -0.03, tilt: 0.08, arms: [[0.8, -1.8], [0.9, -2]], legs: NOLEGS },
    { hip: [36, 41], lean: -0.04, tilt: 0.14, arms: [[0.9, -1.9], [1, -2.1]], legs: NOLEGS },
    { hip: [36, 41.6], lean: -0.02, tilt: 0.04, arms: [[0.8, -1.8], [0.9, -2]], legs: NOLEGS },
  ],
  attack: [
    { hip: [34, 42], lean: -0.12, tilt: -0.12, arms: [[0.8, -1.6], [-1.2, -1.8]], legs: NOLEGS },
    { hip: [38, 42], lean: 0.18, tilt: 0.1, arms: [[0.4, -1], [1.8, -0.5]], legs: NOLEGS },
    { hip: [38, 42], lean: 0.14, tilt: 0.08, arms: [[0.4, -1], [1.9, -0.4]], legs: NOLEGS },
    { hip: [37, 42], lean: 0, tilt: 0.06, arms: [[0.8, -1.8], [0.9, -2]], legs: NOLEGS },
  ],
  dead: { hip: [34, 64], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function bookShape(x, y, a, c, C) {
  return within(at(x, y, a), () => [...opoly([[-3, -2.2], [3, -2.2], [3, 2.2], [-3, 2.2]], c), fpoly([[-2.4, -1.6], [2.4, -1.6], [2.4, 1.4], [-2.4, 1.4]], C.page), line([[0, -2.2], [0, 2.2]], 0.5, c)]);
}

function octoscholar(pose, f, mood) {
  const C = fade(OS, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, OS_K);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#5a1a4a');
  const [hx, hy] = S.hip;
  // Six arms curling out under her, each with its own wave, back three darker.
  const arm = (k, back) => {
    const side = (k - 2.5) / 2.5;
    const pts = [[hx + side * 3, hy + 2]];
    // (Angles measured from straight down, + toward the front; each arm curls up at its tip.)
    let a = -side * 0.45;
    let [x, y] = pts[0];
    for (let i = 1; i <= 6; i++) {
      a += Math.sin(ph * (pose === 'walk' ? 2 : 1) - i * 0.9 + k) * 0.16 - side * 0.12 + (i > 3 ? -side * 0.25 : 0);
      x -= Math.sin(a) * 4.8;
      y += Math.cos(a) * 4.8;
      pts.push([x, Math.min(y, 78)]);
    }
    const out = [...oband(pts, (t) => lerp(4.6, 1, t), back ? C.armDk : C.arm, 4, 0.4)];
    const sp = KIT.spline(pts, 3);
    for (let i = 2; i < sp.length - 2; i += 2) out.push(dot(sp[i][0] + 1, sp[i][1], 0.55, C.sucker));
    return out;
  };
  const juggle = (k) => {
    const u = ((f / n) + k / 3) % 1;
    return [S.head[0] + 11 + Math.cos(u * TAU) * 6, S.head[1] - 9 - Math.abs(Math.sin(u * Math.PI)) * 5];
  };
  const shapes = drawRig(S, {
    behind: () => [arm(0, true), arm(2, true), arm(4, true)].flat(),
    backArm: () => armPart(S.arms[0], C.coatDk, C.skinDk),
    body: () => {
      const out = [...bodice(S, C.coat, C.coatDk)];
      const [cx, cy] = S.chest;
      // A scholar's short cape and a ribbon bow, a quill behind her ear later.
      out.push(...opoly(round([[cx - 5, cy - 1.6], [cx + 5, cy - 1.6], [cx + 6, cy + 4], [cx - 6, cy + 4]], 2), C.coatDk), ...ooval(cx, cy - 0.6, 1.6, 1, C.rim, 0), dot(cx, cy - 0.6, 0.5, C.coat));
      out.push(...[1, 3, 5].map((k) => arm(k, false)).flat());
      return out;
    },
    head: () => headPart(S, mood, OS_FACE, BANGS, HR, 1.14, () => backHair(HR, 7), () => {
      // Round glasses and a tiny mortarboard tipped on her curls.
      const out = [fband(arcPts(2.4, 3, 2.4, 2.4, 0, 360, 14), 0.5, C.rim, 1), fband(arcPts(8.6, 3, 2, 2.2, 0, 360, 14), 0.5, C.rim, 1), line([[4.8, 3], [6.6, 3]], 0.4, C.rim)];
      out.push(...within(at(1, -9.6, -0.2), () => [...opoly([[-6, 0], [6, 0], [7, -2.4], [-5, -2.4]], C.ink), ...opoly([[-2, 0], [3, 0], [3, 2], [-2, 2]], C.ink), line([[5, -1.2], [7, 3]], 0.4, C.rim), dot(7, 3.2, 0.7, C.rim)]));
      return out;
    }),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.coat, C.skin)];
      // Three books juggled over her head (in the attack, one is flung).
      const live = pose === 'attack' && f >= 1 ? 2 : 3;
      for (let k = 0; k < live; k++) {
        const [bx, by] = juggle(k);
        out.push(...bookShape(bx, by, ph + k * 2, [C.book, C.book2, C.book3][k], C));
      }
      if (pose === 'attack' && (f === 1 || f === 2)) {
        const A = S.arms[1];
        const k = f === 1 ? 1 : 1.7;
        out.push(...bookShape(A.hand[0] + 10 * k, A.hand[1] - 2, ph * 3, C.book3, C));
        for (let i = 0; i < 4; i++) out.push(...ooval(A.hand[0] + 4 + i * 3, A.hand[1] + 4 + Math.sin(i) * 2, 2.2 - i * 0.3, 1.8 - i * 0.2, C.ink, 0, 0.3));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

export const ART = {
  jellymaid: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 230, 170], draw: jellymaid },
  seahorseknight: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 190], draw: seahorseknight },
  anglerlamp: { walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [80, 240, 170], draw: anglerlamp },
  pearldiver: { walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [70, 230, 170], draw: pearldiver },
  stardancer: { walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 200, 180], draw: stardancer },
  octoscholar: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 240, 180], draw: octoscholar },
};

export const INFO = {
  jellymaid: { name: 'Jellyfish Maiden', w: 26, h: 60 },
  seahorseknight: { name: 'Seahorse Knight', w: 26, h: 62 },
  anglerlamp: { name: 'Anglerfish Lamp Girl', w: 26, h: 62 },
  pearldiver: { name: 'Pearl Diver', w: 30, h: 56 },
  stardancer: { name: 'Starfish Dancer', w: 26, h: 62 },
  octoscholar: { name: 'Octopus Scholar', w: 30, h: 60 },
};
