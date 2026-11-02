// Monster art: the Star Observatory's sky-folk (the levels 30-35 group dungeon, 2026-11, see
// docs/design/star-observatory.md), on the astral rig (astralrig.js: a drifting figure-eight and
// little things in orbit passing behind and in front).
//   cometcourier   Comet Courier: a messenger girl riding her own comet tail, a satchel of letters;
//                  dashes forward.
//   nebulawitch    Nebula Witch: a dress of nebula cloud, a starry hat; a nebula burst from her wand.
//   starcarto      Star-chart Cartographer: a long scroll chart and a brass compass; flings the
//                  compass needle.
//   mothlibrarian  Moth Librarian: moth wings and feathery antennae, a little lamp; a puff of
//                  glittering scale dust.
//   meteorgolem    Meteor Golem Girl: rock gauntlets with glowing cracks; a heavy punch.
//   geminighosts   Gemini Ghosts: two little twin ghosts holding hands; a twin spin.
// All face right, the lowest part at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, poseAt, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT, wisp } from './manor.js';
import { orbit, drift, star5 } from './astralrig.js';

const { within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, TAU } = KIT;

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
function keyed(pose, f, mood, K, n) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = poseAt(K.walk, f, 8);
  else if (pose === 'attack') P = poseAt(K.attack, f, 3, false);
  else P = poseAt(K.idle, f, 6);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.22, tilt: -0.3, hip: [P.hip[0] - 1.5, P.hip[1]] };
  if (mood !== 'dead' && pose !== 'attack') {
    const [dx, dy] = drift(f, n);
    P = { ...P, hip: [P.hip[0] + dx, P.hip[1] + dy] };
  }
  return P;
}
const NOLEGS = [[0, 0], [0, 0]];
// Builds a figure with orbiters: the back ones before the rig, the front ones after.
function withOrbit(S, costume, orb) {
  return drawRig(S, { ...costume, behind: () => [...orb.back, ...(costume.behind ? costume.behind() : [])], front: () => [...(costume.front ? costume.front() : []), ...orb.front] });
}

// ---------- Comet Courier ----------

const CC = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#ffe066', hairDk: '#f0b030', hairLt: '#fff6c0',
  coat: '#5a6ad8', coatDk: '#3f4ab8', coatLt: '#8a9aec', bag: '#c99a6b', bagDk: '#985a48', letter: '#ffffff', seal: '#e0305e',
  tail: '#9fe8ff', tail2: '#ffffff', tailDk: '#5ac0e8', mist: '#dff6ff', mistDk: '#9fd8f0', mistLt: '#ffffff', star: '#fff3a6',
});
const CC_FACE = { skin: CC.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa0a8', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#4ab8ff', '#1a5aa8', '#d8f0ff', { rx: 3.4, ry: 3 }), brow: { c: '#f0b030', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.95, mouth: 'grin' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const CC_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [38, 42], lean: 0.4, tilt: 0.06, arms: [[-0.4 + Math.sin((i / 4) * TAU) * 0.2, -0.4], [1.4, -1.2]], legs: NOLEGS })),
  idle: [
    { hip: [36, 42], lean: 0.1, tilt: 0.1, arms: [[0.4, -1.4], [0.9, -1.8]], legs: NOLEGS },
    { hip: [36, 41], lean: 0.12, tilt: -0.06, arms: [[0.4, -1.4], [2.6, -0.4]], legs: NOLEGS },
    { hip: [36, 42], lean: 0.08, tilt: 0.14, arms: [[0.4, -1.4], [0.9, -1.8]], legs: NOLEGS },
  ],
  attack: [
    { hip: [32, 43], lean: -0.1, tilt: -0.12, arms: [[0.8, -1], [0.6, -1.6]], legs: NOLEGS, dash: 0 },
    { hip: [46, 42], lean: 0.7, tilt: 0.16, arms: [[-0.6, -0.2], [1.6, -0.1]], legs: NOLEGS, dash: 1 },
    { hip: [46, 42], lean: 0.6, tilt: 0.14, arms: [[-0.6, -0.2], [1.6, 0]], legs: NOLEGS, dash: 1 },
    { hip: [38, 42], lean: 0.1, tilt: 0.1, arms: [[0.4, -1.4], [0.9, -1.8]], legs: NOLEGS, dash: 0 },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function cometcourier(pose, f, mood) {
  const C = fade(CC, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, CC_K, n);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#8a5a0a');
  const dash = pose === 'attack' && P.dash > 0.5;
  const orb = orbit(S.hip[0], S.hip[1] - 4, 3, 14, 4, -0.2, ph, (x, y, k) => [...ooval(x, y, 1.6 + k, 1.2 + k * 0.6, C.letter, 0.2, 0.3), dot(x, y, 0.5, C.seal)]);
  const shapes = withOrbit(S, {
    behind: () => {
      // The comet she rides: a blazing head under her and a long streaming tail.
      const [hx, hy] = S.hip;
      const len = dash ? 40 : pose === 'walk' ? 30 : 20;
      const out = [];
      for (const [k, c, w] of [[0, C.tailDk, 12], [1, C.tail, 9], [2, C.tail2, 4.6]]) {
        const pts = KIT.flowPts([hx + 2, hy + 4 + k * 0.6], Math.PI + 0.25, 0.3, len - k * 4, ph + k, 0.12, 5);
        out.push(...oband(pts, (t) => lerp(w, 0.6, t), c, 4, k ? 0 : 0.4));
      }
      out.push(...ooval(hx + 2, hy + 4, 6.4, 5, C.tail2), ...ooval(hx + 3, hy + 3.6, 3.4, 2.6, '#ffffff'));
      for (let i = 0; i < 3; i++) out.push(...star5(hx - 12 - i * 8 + Math.sin(ph + i) * 2, hy + 1 + (i % 2) * 6, 1.3, C.star, ph + i));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.coatDk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 5, hy - 1.4], [hx + 4.4, hy - 1.4], [hx + 3, hy + 5], [hx - 8, hy + 6]], 2), C.coat), ...bodice(S, C.coat, C.coatDk)];
      const [cx, cy] = S.chest;
      // A courier's satchel across her, its flap sealed, letters peeking out.
      out.push(line([[cx + 3, cy - 1], [hx - 4, hy + 1]], 0.8, C.bagDk), ...opoly(round([[hx - 9, hy - 2], [hx - 2, hy - 2], [hx - 2, hy + 3], [hx - 9, hy + 3]], 1), C.bag));
      out.push(...opoly([[hx - 8, hy - 3.4], [hx - 4, hy - 4], [hx - 3.6, hy - 1.6], [hx - 7.6, hy - 1.4]], C.letter), dot(hx - 5.6, hy, 0.8, C.seal));
      out.push(...KIT.gem(cx + 0.4, cy + 2.4, 1, C.star));
      return out;
    },
    head: () => headPart(S, mood, CC_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 6), ...KIT.lockHair(KIT.flowPts([-6, -3], Math.PI + 0.3, 0.2, 14, ph - 0.7, 0.18, 5), 4, HR)], () => [
      // A courier's cap with a star badge and a wing on it.
      ...opoly(round([[-7, -4.6], [6.6, -5.4], [5, -9.4], [-5.6, -9]], 2), C.coat), ...opoly([[5, -5.6], [10, -5.4], [6.4, -4]], C.coatDk), ...star5(0, -7.2, 1.6, C.star, 0),
      ...opoly([[-6.6, -7.6], [-11, -10.4], [-10, -7.4], [-11.4, -6], [-7, -5.6]], '#ffffff'),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.coat, C.skin)];
      if (dash) out.push(fband([[S.hip[0] - 30, S.hip[1] - 2], [S.head[0] + 18, S.head[1] + 8]], (t) => 3 * Math.sin(Math.PI * t), mix(C.tail, '#ffffff', 0.5), 1), sparkle(S.head[0] + 18, S.head[1] + 6, 3, '#ffffff'));
      return out;
    },
  }, orb);
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Nebula Witch ----------

const NW = soften({
  skin: '#f0e6ff', skinDk: '#d8c8f2', hair: '#ff9ad8', hairDk: '#d860a8', hairLt: '#ffd8f0',
  cloud: '#8a6ae0', cloud2: '#e07ad8', cloud3: '#6ac0f0', cloudDk: '#5a3aa8', hat: '#3a2a7a', hatDk: '#24185a', star: '#fff3a6', wand: '#ffd36b',
  mist: '#c8a8ff', mistDk: '#8a6ae0', mistLt: '#ffffff',
});
const NW_FACE = { skin: NW.skin, skinSh: '#d8c8f2', skinSh2: '#b8a4dc', blush: '#ffa8d8', lip: '#c8508a', lipLine: '#8a2a5a', eye: eyes('#c87aff', '#5a2aa8', '#f0dcff', { tilt: 0.25, ry: 2.6, flicks: 3, lashLen: 1.1 }), brow: { c: '#d860a8', kind: 'arched', w: 0.7 }, moods: { idle: { open: 0.7, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const NW_K = {
  walk: [0, 1, 2, 3].map(() => ({ hip: [36, 44], lean: 0.08, tilt: 0.06, arms: [[0.6, -1], [1, -1.8]], legs: NOLEGS })),
  idle: [
    { hip: [36, 44], lean: 0, tilt: 0.12, arms: [[0.6, -1], [0.8, -2]], legs: NOLEGS },
    { hip: [36, 43], lean: -0.04, tilt: -0.06, arms: [[1.4, -0.6], [0.8, -2.1]], legs: NOLEGS },
    { hip: [36, 44], lean: 0, tilt: 0.16, arms: [[0.6, -1], [0.8, -2]], legs: NOLEGS },
  ],
  attack: [
    { hip: [35, 44], lean: -0.12, tilt: -0.1, arms: [[0.8, -1], [-0.8, -1.8]], legs: NOLEGS },
    { hip: [38, 44], lean: 0.16, tilt: 0.1, arms: [[0.4, -0.6], [1.7, -0.3]], legs: NOLEGS, burst: 1 },
    { hip: [38, 44], lean: 0.14, tilt: 0.08, arms: [[0.4, -0.6], [1.8, -0.2]], legs: NOLEGS, burst: 1 },
    { hip: [36, 44], lean: 0, tilt: 0.1, arms: [[0.6, -1], [0.8, -2]], legs: NOLEGS },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function cloudPuffs(cx, cy, w, h, ph, C, n = 9) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = cx - w + u * w * 2 + Math.sin(ph + i) * 1;
    const y = cy + Math.sin(u * Math.PI) * h + Math.cos(ph * 1.3 + i) * 0.8;
    const c = [C.cloud, C.cloud2, C.cloud3][i % 3];
    out.push(...ooval(x, y, 3.4 + (i % 2), 3 + (i % 3) * 0.4, c, 0, 0.3));
  }
  return out;
}

function nebulawitch(pose, f, mood) {
  const C = fade(NW, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, NW_K, n);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#5a1a4a');
  const orb = orbit(S.chest[0], S.chest[1] + 4, 4, 13, 4.4, 0.25, ph, (x, y, k, i) => star5(x, y, 1.1 + k * 0.8, i % 2 ? C.star : '#ffffff', ph + i));
  const shapes = withOrbit(S, {
    behind: () => wisp([S.hip[0] - 1, S.hip[1] + 14], ph, pose === 'walk' ? 1 : 0.4, 12, 12, C, f, n),
    backArm: () => armPart(S.arms[0], C.cloudDk, C.skinDk),
    body: () => {
      const [hx, hy] = S.hip;
      const g = gown(S, 14, 9, C.cloudDk, mix(C.cloudDk, '#000000', 0.2), Math.sin(ph) * 0.8);
      // The nebula dress: swirls of cloud in three colours over a deep body, stars caught in it.
      const out = [...g.out, ...cloudPuffs(hx, hy + 4, 7, 3, ph, C, 7), ...cloudPuffs(hx, hy + 10, 9, 3, ph + 1, C, 9)];
      for (const [dx, dy] of [[-4, 8], [3, 6], [0, 12], [-6, 13]]) out.push(sparkle(hx + dx, hy + dy, 1, '#ffffff'));
      out.push(...bodice(S, C.cloudDk, mix(C.cloudDk, '#000000', 0.2)));
      out.push(...cloudPuffs(S.chest[0], S.chest[1] - 1, 4.4, 0.6, ph, C, 5));
      return out;
    },
    head: () => headPart(S, mood, NW_FACE, BANGS, HR, 1.14, () => [...backHair(HR, 8), ...KIT.lockHair(KIT.flowPts([-6, 0], Math.PI / 2 + 0.4, 0.5, 14, ph - 0.7, 0.18, 5), 4, HR)], () => {
      // A witch's hat, its tip curled, a band of stars, the brim rippling.
      const flop = Math.sin(ph - 0.8) * 0.4;
      const out = [...opoly(round([[-11, -4.6], [11, -6.4], [8, -3.4], [-8, -2.2]], 2), C.hat)];
      out.push(...oband([[-4, -5.4], [-1, -12], [4 + flop * 3, -17], [9 + flop * 4, -15]], taperW(9, 1.2), C.hat, 4), fband([[-4.6, -6.6], [5.4, -7.6]], 1.2, C.cloud2, 1));
      out.push(...star5(9 + flop * 4, -15, 1.8, C.star, ph), ...star5(1, -9.6, 1.1, '#ffffff', 0));
      return out;
    }),
    frontArm: () => {
      const A = S.arms[1];
      const a = A.a - Math.PI / 2 - 0.5;
      const tip = [A.hand[0] + Math.cos(a) * 9, A.hand[1] + Math.sin(a) * 9];
      const out = [...oband([A.hand, tip], 0.8, C.wand, 1, 0.3), ...star5(tip[0], tip[1], 2, C.star, ph), ...armPart(A, C.cloudDk, C.skin)];
      if (P.burst > 0.5) {
        const k = f === 1 ? 1 : 1.5;
        out.push(...cloudPuffs(tip[0] + 10 * k, tip[1], 6 * k, 2 * k, ph * 2, C, 7));
        for (let i = 0; i < 4; i++) out.push(...star5(tip[0] + 6 + i * 4 * k, tip[1] - 4 + (i % 2) * 7, 1.4, '#ffffff', i));
      }
      return out;
    },
  }, orb);
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Star-chart Cartographer ----------

const SC = soften({
  skin: '#fff0e6', skinDk: '#f2d6c6', hair: '#7a5a3a', hairDk: '#5a3a2a', hairLt: '#a8885a',
  coat: '#3a6a8a', coatDk: '#244e6a', coatLt: '#6a9ab8', vest: '#ffd36b', scroll: '#fff2d6', scrollDk: '#e6d0a8', ink: '#3a4a8a', brass: '#ffd36b', brassDk: '#c8902a', star: '#fff3a6',
  sock: '#ffffff', boot: '#5a3a2a',
});
const SC_FACE = { skin: SC.skin, skinSh: '#f2d6c6', skinSh2: '#dcb0a6', blush: '#ffa8a0', lip: '#e0607e', lipLine: '#a83a58', eye: eyes('#4a8ab8', '#1a3a6a', '#d0e6f6', { rx: 3.2, ry: 2.8 }), brow: { c: '#5a3a2a', kind: 'soft', w: 0.8 }, moods: { idle: { open: 0.85, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// She walks on air as on a floor, studying her chart; the scroll trails out behind.
const SC_K = {
  walk: [
    { hip: [36, 42], lean: 0.04, tilt: 0.12, arms: [[0.9, -1.6], [1, -1.7]], legs: [[-0.4, 0.2], [0.4, 0.1]] },
    { hip: [36, 41], lean: 0.04, tilt: 0.1, arms: [[0.9, -1.6], [1, -1.7]], legs: [[0, 0.6], [0.1, 0.1]] },
    { hip: [36, 42], lean: 0.04, tilt: 0.12, arms: [[0.9, -1.6], [1, -1.7]], legs: [[0.4, 0.1], [-0.4, 0.2]] },
    { hip: [36, 41], lean: 0.04, tilt: 0.1, arms: [[0.9, -1.6], [1, -1.7]], legs: [[0.1, 0.1], [0, 0.6]] },
  ],
  idle: [
    { hip: [36, 42], lean: -0.04, tilt: 0.16, arms: [[0.9, -1.6], [1, -1.7]], legs: [[0.1, 0.4], [-0.2, 0.6]] },
    { hip: [36, 41], lean: -0.02, tilt: 0.02, arms: [[0.9, -1.6], [0.3, -2.4]], legs: [[0.1, 0.4], [-0.2, 0.6]] },
    { hip: [36, 42], lean: -0.04, tilt: 0.16, arms: [[0.9, -1.6], [1, -1.7]], legs: [[0.1, 0.4], [-0.2, 0.6]] },
  ],
  attack: [
    { hip: [35, 42], lean: -0.1, tilt: -0.1, arms: [[0.9, -1.6], [-1.4, -1.4]], legs: [[0.1, 0.4], [-0.2, 0.6]] },
    { hip: [38, 42], lean: 0.18, tilt: 0.1, arms: [[0.6, -1.4], [1.8, -0.3]], legs: [[0.1, 0.4], [-0.2, 0.6]], fling: 1 },
    { hip: [38, 42], lean: 0.14, tilt: 0.08, arms: [[0.6, -1.4], [1.9, -0.2]], legs: [[0.1, 0.4], [-0.2, 0.6]], fling: 1 },
    { hip: [36, 42], lean: 0, tilt: 0.1, arms: [[0.9, -1.6], [1, -1.7]], legs: [[0.1, 0.4], [-0.2, 0.6]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function starcarto(pose, f, mood) {
  const C = fade(SC, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, SC_K, n);
  const S = mood === 'dead' ? plant(solve(P)) : solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#2a1a10');
  const dead = mood === 'dead';
  const orb = orbit(S.head[0], S.head[1] - 2, 3, 13, 3.4, -0.15, ph * 0.7, (x, y, k, i) => [...ooval(x, y, 1.4 + k * 0.8, 1.4 + k * 0.8, i === 0 ? '#e8ecff' : i === 1 ? '#ffb38a' : '#9fd8ff', 0, 0.3), ...(i === 1 ? [fband(arcPts(x, y, 3 + k, 0.8, 0, 360, 10), 0.4, C.brass, 1)] : [])]);
  const [h0, h1] = [S.arms[0].hand, S.arms[1].hand];
  const shapes = withOrbit(S, {
    behind: () => {
      if (dead) return [];
      // The chart: a scroll held between her hands, its long end trailing down behind her.
      const tail = KIT.flowPts([h0[0], h0[1] + 2], Math.PI / 2 + 0.6, 0.6, 20, ph, 0.18, 5);
      const out = [...oband(tail, 4, C.scrollDk, 3, 0.4)];
      out.push(...oband([h0, h1], 5, C.scroll, 1, 0.4));
      for (const [u, v] of [[0.3, -1], [0.55, 0.8], [0.75, -0.6]]) out.push(dot(lerp(h0[0], h1[0], u), lerp(h0[1], h1[1], u) + v, 0.6, C.ink));
      out.push(line([[lerp(h0[0], h1[0], 0.3), lerp(h0[1], h1[1], 0.3) - 1], [lerp(h0[0], h1[0], 0.55), lerp(h0[1], h1[1], 0.55) + 0.8], [lerp(h0[0], h1[0], 0.75), lerp(h0[1], h1[1], 0.75) - 0.6]], 0.3, C.ink));
      return out;
    },
    backArm: () => armPart(S.arms[0], C.coatDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.sock, C.boot, 0.9),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 6, hy + 8], [hx - 7, hy + 9]], 2), C.coat), fpoly([[hx - 4.6, hy], [hx - 1, hy], [hx - 2, hy + 8.6], [hx - 7, hy + 9]], C.coatDk)];
      out.push(...bodice(S, C.vest, mix(C.vest, '#000000', 0.15)));
      const [cx, cy] = S.chest;
      out.push(...opoly([[cx - 3.6, cy - 1.6], [cx - 1, cy - 1], [hx - 2, hy + 1], [hx - 4.4, hy]], C.coat), ...opoly([[cx + 3.6, cy - 1.6], [cx + 1.6, cy - 1], [hx + 3.4, hy - 0.6], [hx + 4.6, hy - 1]], C.coat));
      // A brass compass hanging at her belt.
      out.push(...ooval(hx + 3.6, hy + 2.6, 2.2, 2.2, C.brass), ...ooval(hx + 3.6, hy + 2.6, 1.4, 1.4, '#ffffff'), line([[hx + 3.6, hy + 2.6], [hx + 4.4, hy + 1.6]], 0.4, C.seal ?? '#e0305e'));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.sock, C.boot, 0.9),
    head: () => headPart(S, mood, SC_FACE, SWEPT, HR, 1.12, () => backHair(HR, 7), () => [
      // A tricorne with a star cockade and a quill; round reading glasses pushed up on the brim.
      ...opoly(round([[-9, -4], [9, -5], [6, -9.6], [0, -8], [-6, -9.4]], 1), C.coatDk), ...star5(-4.6, -6.4, 1.4, C.star, 0),
      ...oband([[2, -8], [4, -14], [8, -16]], taperW(1.6, 0.4), '#ffffff', 3, 0.3),
      fband(arcPts(2.6, -5.2, 1.6, 1.4, 0, 360, 10), 0.4, C.brass, 1), fband(arcPts(6.4, -5.4, 1.6, 1.4, 0, 360, 10), 0.4, C.brass, 1),
    ]),
    frontArm: () => {
      const out = [...armPart(S.arms[1], C.coat, C.skin)];
      if (P.fling > 0.5) {
        const k = f === 1 ? 1 : 1.6;
        const x = h1[0] + 10 * k;
        out.push(...oband([[x - 5, h1[1]], [x + 5, h1[1] - 1]], taperW(1.6, 0.3), '#e0305e', 1, 0.3), fband([[h1[0], h1[1]], [x - 6, h1[1]]], (t) => 1.4 * t, mix(C.brass, '#ffffff', 0.4), 1), sparkle(x + 6, h1[1] - 1, 2, '#ffffff'));
      }
      return out;
    },
  }, orb);
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Moth Librarian ----------

const ML = soften({
  skin: '#fff6ec', skinDk: '#f0e0cc', hair: '#e8dcc8', hairDk: '#c8b494', hairLt: '#fffaf0',
  wing: '#d8c8a8', wingDk: '#a8946a', wingLt: '#fff4dc', eyeSpot: '#8a6ae0', fur: '#ffffff', furDk: '#e6dcd0',
  dress: '#8a7a6a', dressDk: '#6a5a4a', lamp: '#ffe2a0', lampHot: '#ffffff', dust: '#fff6c0', book: '#7a62c8',
});
const ML_FACE = { skin: ML.skin, skinSh: '#f0e0cc', skinSh2: '#d8c4a8', blush: '#ffb4a8', lip: '#d8707e', lipLine: '#a8404e', eye: eyes('#2a2a3a', '#0a0a1a', '#6a6a8a', { rx: 3.8, ry: 3.6, pupil: 'round' }), brow: { c: '#c8b494', kind: 'soft', w: 0.6 }, moods: { idle: { open: 1, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const ML_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 42 - Math.abs(Math.sin((i / 4) * TAU)) * 1.6], lean: 0.12, tilt: 0.06, arms: [[0.6, -1.2], [0.9, -1.6]], legs: [[0.4, 0.6], [0.1, 0.3]], wing: i % 2 })),
  idle: [
    { hip: [36, 42], lean: 0, tilt: 0.1, arms: [[0.6, -1.2], [0.9, -1.8]], legs: [[0.3, 0.5], [0, 0.3]], wing: 0 },
    { hip: [36, 41], lean: 0, tilt: 0.16, arms: [[0.6, -1.2], [1, -1.9]], legs: [[0.3, 0.5], [0, 0.3]], wing: 1 },
    { hip: [36, 42], lean: 0, tilt: 0.06, arms: [[0.6, -1.2], [0.9, -1.8]], legs: [[0.3, 0.5], [0, 0.3]], wing: 0.5 },
  ],
  attack: [
    { hip: [35, 42], lean: -0.1, tilt: -0.1, arms: [[0.8, -1], [-0.6, -1.6]], legs: [[0.3, 0.5], [0, 0.3]], wing: 1 },
    { hip: [38, 42], lean: 0.16, tilt: 0.1, arms: [[0.4, -0.6], [1.6, -0.4]], legs: [[0.3, 0.5], [0, 0.3]], wing: 0, dust: 1 },
    { hip: [38, 42], lean: 0.12, tilt: 0.08, arms: [[0.4, -0.6], [1.7, -0.3]], legs: [[0.3, 0.5], [0, 0.3]], wing: 0.3, dust: 1 },
    { hip: [36, 42], lean: 0, tilt: 0.1, arms: [[0.6, -1.2], [0.9, -1.8]], legs: [[0.3, 0.5], [0, 0.3]], wing: 0 },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]], wing: 0 },
};

function mothlibrarian(pose, f, mood) {
  const C = fade(ML, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, ML_K, n);
  const S = mood === 'dead' ? plant(solve(P)) : solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a5a3a');
  const lamp = S.arms[1].hand;
  const orb = orbit(lamp[0] + 2, lamp[1] + 2, 3, 6, 3, 0.4, ph * 2, (x, y, k) => [...ooval(x, y, 0.8 + k * 0.6, 0.5 + k * 0.4, C.dust, 0.4, 0.25)]);
  const shapes = withOrbit(S, {
    behind: () => {
      // Two pairs of soft moth wings, beating slowly, eye-spots on the big ones.
      const [cx, cy] = S.chest;
      const beat = P.wing ?? 0;
      const out = [];
      for (const [s, big, c] of [[0, 1, C.wingDk], [1, 1, C.wing], [0, 0, C.wingDk], [1, 0, C.wing]]) {
        const span = (big ? 16 : 11) * (0.75 + 0.25 * (1 - beat));
        const up = big ? -12 : 6;
        const ox = cx - 3 - s * 1.5;
        const pts = [[ox, cy + 1], [ox - span * 0.5, cy + up - 4], [ox - span, cy + up + (big ? 2 : 4)], [ox - span * 0.7, cy + up + (big ? 10 : 9)], [ox - 2, cy + (big ? 4 : 8)]];
        out.push(...opoly(round(pts, 3), c));
        if (big) out.push(...ooval(ox - span * 0.6, cy + up + 2, 2.4, 2.2, C.eyeSpot), dot(ox - span * 0.6, cy + up + 1.6, 0.9, '#ffffff'));
        out.push(fband([[ox, cy + 1], [ox - span * 0.8, cy + up + 2]], 0.4, C.wingLt, 1));
      }
      return out;
    },
    backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.dressDk, C.dressDk, 0.9),
    body: () => {
      const g = gown(S, 10, 7, C.dress, C.dressDk, Math.sin(ph) * 0.6);
      const out = [...g.out, ...bodice(S, C.dress, C.dressDk)];
      // A fluffy white ruff of moth fur at the collar.
      const [cx, cy] = S.chest;
      for (let k = 0; k < 7; k++) out.push(...ooval(cx - 4.2 + k * 1.4, cy - 0.8 + Math.abs(k - 3) * 0.3, 1.6, 1.4, k % 2 ? C.fur : C.furDk, 0, 0.25));
      out.push(...opoly(round([[S.hip[0] + 2, S.hip[1] + 2], [S.hip[0] + 7, S.hip[1] + 1], [S.hip[0] + 7, S.hip[1] + 6], [S.hip[0] + 2, S.hip[1] + 7]], 1), C.book));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.dress, C.dressDk, 0.9),
    head: () => headPart(S, mood, ML_FACE, BANGS, HR, 1.14, () => backHair(HR, 7), () => [
      // Feathery antennae curling back, a fluffy fringe of fur, little round spectacles.
      ...oband([[-2, -8], [-6, -14], [-11, -15]], taperW(1, 0.4), C.wingDk, 3, 0.3), ...oband([[2, -8.4], [0, -15], [-4, -18]], taperW(1, 0.4), C.wingDk, 3, 0.3),
      ...[0, 1, 2, 3].map((k) => line([[-6 - k * 1.4, -14 + k * 0.2], [-6.6 - k * 1.4, -12.4 + k * 0.2]], 0.4, C.wingDk)),
      fband(arcPts(3.4, 3.4, 1.8, 1.8, 0, 360, 12), 0.4, C.wingDk, 1), fband(arcPts(8.6, 3.4, 1.6, 1.8, 0, 360, 12), 0.4, C.wingDk, 1),
    ]),
    frontArm: () => {
      const out = [line([lamp, [lamp[0], lamp[1] + 2]], 0.4, C.wingDk), ...ooval(lamp[0], lamp[1] + 5, 2.6, 3.2, C.lamp), ...ooval(lamp[0] - 0.6, lamp[1] + 4.4, 1, 1.4, C.lampHot)];
      out.push(...armPart(S.arms[1], C.dress, C.skin));
      if (P.dust > 0.5) for (let i = 0; i < 8; i++) out.push(sparkle(lamp[0] + 6 + i * 2.4, lamp[1] - 4 + Math.sin(i * 1.7) * 6, 0.8 + (i % 3) * 0.5, i % 2 ? C.dust : '#ffffff'));
      return out;
    },
  }, orb);
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Meteor Golem Girl ----------

const MG = soften({
  skin: '#ffe6d6', skinDk: '#f2c8b0', hair: '#ff6a4a', hairDk: '#c8402a', hairLt: '#ffb08a',
  rock: '#6a5a7a', rockDk: '#4a3e5a', rockLt: '#9a8aa8', glow: '#ff9a3a', glowHot: '#ffe066', suit: '#3a3a5a', suitDk: '#24243e',
});
const MG_FACE = { skin: MG.skin, skinSh: '#f2c8b0', skinSh2: '#d8a890', blush: '#ff9a8a', lip: '#d8505e', lipLine: '#a8303e', eye: eyes('#ff9a3a', '#a84a0a', '#ffe0c0', { tilt: 0.3, ry: 2.5 }), brow: { c: '#c8402a', kind: 'straight', w: 1 }, moods: { idle: { open: 0.9, mouth: 'smirk' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const MG_K = {
  walk: [
    { hip: [36, 46], lean: 0.06, tilt: 0.04, arms: [[0.4, -0.9], [-0.2, -1.2]], legs: [[-0.45, 0.2], [0.45, 0.05]] },
    { hip: [36, 44.6], lean: 0.04, tilt: -0.02, arms: [[0.1, -1], [0.1, -1.1]], legs: [[0, 0.8], [0.1, 0.05]] },
    { hip: [36, 46], lean: 0.06, tilt: 0.04, arms: [[-0.2, -0.9], [0.4, -1.2]], legs: [[0.45, 0.05], [-0.45, 0.2]] },
    { hip: [36, 44.6], lean: 0.04, tilt: -0.02, arms: [[0.1, -1], [0.1, -1.1]], legs: [[0.1, 0.05], [0, 0.8]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.3, -1.4], [0.6, -1.8]], legs: [[-0.25, 0], [0.28, 0]] },
    { hip: [36, 46.6], lean: 0, tilt: 0.04, arms: [[0.3, -1.4], [0.7, -2]], legs: [[-0.25, 0.1], [0.28, 0.1]] },
    { hip: [36, 46], lean: -0.02, tilt: -0.04, arms: [[0.3, -1.4], [0.6, -1.8]], legs: [[-0.25, 0], [0.28, 0]] },
  ],
  attack: [
    { hip: [34, 47], lean: -0.16, tilt: -0.1, arms: [[0.6, -1], [-1.2, -1.6]], legs: [[-0.4, 0.3], [0.4, 0.2]] },
    { hip: [40, 47], lean: 0.3, tilt: 0.12, arms: [[-0.4, -0.6], [1.6, -0.1]], legs: [[-0.6, 0.2], [0.6, 0.2]], punch: 1 },
    { hip: [40, 47], lean: 0.26, tilt: 0.1, arms: [[-0.4, -0.6], [1.6, 0]], legs: [[-0.6, 0.2], [0.6, 0.2]], punch: 1 },
    { hip: [36, 46], lean: 0, tilt: -0.04, arms: [[0.3, -1.4], [0.6, -1.8]], legs: [[-0.25, 0], [0.28, 0]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function meteorgolem(pose, f, mood) {
  const C = fade(MG, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, MG_K, n);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a1a0a');
  const pulse = 0.5 + 0.5 * Math.sin(ph * 2);
  const orb = orbit(S.chest[0], S.chest[1] + 2, 4, 12, 3.6, 0.1, ph, (x, y, k, i) => [...opoly(round([[x - 1.6 - k, y - 1], [x, y - 1.8 - k], [x + 1.8 + k, y - 0.4], [x + 0.6, y + 1.6 + k], [x - 1.2, y + 1.2]], 1), i % 2 ? C.rock : C.rockLt, 0.3)]);
  const rockLimb = (A, back) => {
    const out = [...limb3(A.sh, A.el, A.hand, 3.6, 3.4, 3.2, back ? C.rockDk : C.rock)];
    out.push(...ooval(A.hand[0], A.hand[1], 4, 3.6, back ? C.rockDk : C.rock), line([[A.el[0], A.el[1]], [lerp(A.el[0], A.hand[0], 0.7), lerp(A.el[1], A.hand[1], 0.7) + 1]], 0.7, mix(C.glow, C.glowHot, pulse)));
    out.push(dot(A.hand[0] + 1, A.hand[1] - 1, 1, mix(C.glow, C.glowHot, pulse)));
    return out;
  };
  const shapes = withOrbit(S, {
    backArm: () => rockLimb(S.arms[0], true),
    backLeg: () => legPart(S.legs[0], C.suitDk, C.rockDk, 1.1),
    body: () => {
      const out = [...opoly(round([[S.hip[0] - 5, S.hip[1] - 1.4], [S.hip[0] + 5, S.hip[1] - 1.4], [S.hip[0] + 5.6, S.hip[1] + 4], [S.hip[0] - 5.6, S.hip[1] + 4]], 2), C.suit)];
      out.push(...bodice(S, C.suit, C.suitDk));
      const [cx, cy] = S.chest;
      // A rock breastplate cracked with glowing seams, and a big rock pauldron.
      out.push(...opoly(round([[cx - 4.4, cy], [cx + 4.4, cy - 0.4], [cx + 3.6, cy + 6], [cx - 3.6, cy + 6.4]], 2), C.rock), line([[cx - 2, cy + 1], [cx, cy + 3], [cx + 2.6, cy + 2]], 0.6, mix(C.glow, C.glowHot, pulse)));
      out.push(...opoly(round([[S.arms[1].sh[0] - 4, S.arms[1].sh[1] + 2], [S.arms[1].sh[0] - 2, S.arms[1].sh[1] - 4], [S.arms[1].sh[0] + 4, S.arms[1].sh[1] - 3], [S.arms[1].sh[0] + 4, S.arms[1].sh[1] + 3]], 2), C.rockLt));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.suit, C.rock, 1.1),
    head: () => headPart(S, mood, MG_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 6), ...[0, 1, 2].flatMap((k) => KIT.lockHair(KIT.flowPts([-5 + k, -6 + k * 2], -Math.PI / 2 - 1.2 - k * 0.3, -0.6, 8, ph + k, 0.3, 4), 3, HR))], () => [
      // Her hair burns up at the tips like a meteor's trail; a little rock tiara.
      ...opoly(round([[-6, -7], [-3, -9.6], [0, -8.4], [3.4, -10], [6, -7.6]], 1), C.rockLt), dot(0, -8.4, 1, mix(C.glow, C.glowHot, pulse)),
    ]),
    frontArm: () => {
      const out = [...rockLimb(S.arms[1], false)];
      if (P.punch > 0.5) {
        const h = S.arms[1].hand;
        out.push(...KIT.flame(h[0] + 8, h[1] + 1, 7, 3, 1.5, [C.glow, C.glowHot, '#ffffff']), sparkle(h[0] + 12, h[1], 3.4, '#ffffff'));
        for (let i = 0; i < 4; i++) out.push(...ooval(h[0] + 8 + Math.cos(i * 1.6) * 8, h[1] + Math.sin(i * 1.6) * 6, 1.4, 1.2, C.rockLt, i, 0.3));
      }
      return out;
    },
  }, orb);
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Gemini Ghosts ----------

const GG = soften({
  skin: '#f4f8ff', skinDk: '#dce6f6', hairA: '#9fd8ff', hairADk: '#6aa8e0', hairB: '#ffb3d6', hairBDk: '#e080b0', hairLt: '#ffffff',
  dressA: '#c8e6ff', dressB: '#ffe0f0', dressDk: '#a8b8e0', mist: '#eef4ff', mistDk: '#c8d4f4', mistLt: '#ffffff', star: '#fff3a6',
});
const ggFace = (iris) => ({ skin: GG.skin, skinSh: '#dce6f6', skinSh2: '#b8c4e6', blush: '#c8b4ff', lip: '#9a7ad0', lipLine: '#6a52a8', eye: eyes(iris, mix(iris, '#000000', 0.5), mix(iris, '#ffffff', 0.6), { rx: 3.8, ry: 3.6 }), brow: { c: '#a8b8e0', kind: 'soft', w: 0.5 }, moods: { idle: { open: 1, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } });
const GG_FACE_A = ggFace('#6aa8e0');
const GG_FACE_B = ggFace('#e080b0');
// Two little ghosts: drawn small (k 0.72), side by side, holding hands; they circle each other in the
// spin.
const GG_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 46 + Math.sin((i / 4) * TAU)], lean: 0.1, tilt: 0.1, arms: [[0.8, -0.6], [1.2, -0.4]], legs: NOLEGS, swap: 0 })),
  idle: [
    { hip: [36, 46], lean: 0, tilt: 0.16, arms: [[0.6, -0.6], [1.2, -0.4]], legs: NOLEGS, swap: 0 },
    { hip: [36, 44.6], lean: 0, tilt: -0.12, arms: [[0.8, -0.8], [1.3, -0.4]], legs: NOLEGS, swap: 0 },
    { hip: [36, 45.4], lean: 0, tilt: 0.2, arms: [[0.6, -0.6], [1.2, -0.4]], legs: NOLEGS, swap: 0 },
  ],
  attack: [
    { hip: [35, 45], lean: -0.1, tilt: -0.1, arms: [[0.8, -0.6], [1.2, -0.4]], legs: NOLEGS, swap: 0 },
    { hip: [38, 44], lean: 0.1, tilt: 0.1, arms: [[2.4, 0], [2.4, 0]], legs: NOLEGS, swap: 0.5, spin: 1 },
    { hip: [39, 45], lean: 0.12, tilt: 0.1, arms: [[2.4, 0], [2.4, 0]], legs: NOLEGS, swap: 1, spin: 1 },
    { hip: [36, 46], lean: 0, tilt: 0.12, arms: [[0.6, -0.6], [1.2, -0.4]], legs: NOLEGS, swap: 1 },
  ],
  dead: { hip: [34, 64], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS, swap: 0 },
};

function geminighosts(pose, f, mood) {
  const C = fade(GG, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, GG_K, n);
  const twin = (dx, dy, hair, hairDk, dress, face, flip) => {
    const Q = { ...P, hip: [P.hip[0] + dx, P.hip[1] + dy] };
    const S = solve(Q, 0.72);
    const HR = hairOf(hair, hairDk, C.hairLt, '#3a3a6a');
    const draw = () => drawRig(S, {
      behind: () => wisp([S.hip[0] - 0.4, S.hip[1] + 5], ph + dx, pose === 'walk' ? 1 : 0.4, 9, 8, C, f, n),
      backArm: () => armPart(S.arms[0], C.dressDk, C.skinDk, 0.8),
      body: () => [...gown(S, 6, 5, dress, C.dressDk, Math.sin(ph + dx) * 0.6, 0.8).out, ...bodice(S, dress, C.dressDk)],
      head: () => headPart(S, mood, face, BANGS, HR, 1.1, () => [...backHair(HR, 6), ...[-1, 1].flatMap((s) => KIT.lockHair(KIT.flowPts([s * 5.6, -4], Math.PI / 2 + s * 0.6, s * 0.4, 8, ph - 0.7 + s, 0.2, 4), 2.8, HR))], () => star5(-4.6, -6.6, 1.6, C.star, ph)),
      frontArm: () => armPart(S.arms[1], dress, C.skin, 0.8),
    });
    return flip ? within((x, y) => [2 * S.hip[0] - x, y], draw) : draw();
  };
  // The spin: the twins trade places round each other, held by the hand.
  const sw = P.swap ?? 0;
  const a = sw * Math.PI;
  const ax = Math.cos(a) * -10;
  const bx = Math.cos(a) * 10;
  const behindFirst = Math.sin(a) >= 0;
  const A = twin(ax, -Math.sin(a) * 2, C.hairA, C.hairADk, C.dressA, GG_FACE_A, false);
  const B = twin(bx, Math.sin(a) * 2, C.hairB, C.hairBDk, C.dressB, GG_FACE_B, true);
  const shapes = behindFirst ? [...A, ...B] : [...B, ...A];
  if (P.spin > 0.5) shapes.push(fband(arcPts(P.hip[0], P.hip[1] - 4, 18, 6, 180, 520, 16), (t) => 2.2 * Math.sin(Math.PI * t), mix(C.hairA, '#ffffff', 0.5), 1), sparkle(P.hip[0] + 18, P.hip[1] - 6, 2.4, '#ffffff'));
  return { w: RW, h: RH, res: 3, shapes };
}

export const ART = {
  cometcourier: { walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [70, 230, 170], draw: cometcourier },
  nebulawitch: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: nebulawitch },
  starcarto: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 230, 170], draw: starcarto },
  mothlibrarian: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: mothlibrarian },
  meteorgolem: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 300, 220], draw: meteorgolem },
  geminighosts: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 230, 170], draw: geminighosts },
};

export const INFO = {
  cometcourier: { name: 'Comet Courier', w: 30, h: 60 },
  nebulawitch: { name: 'Nebula Witch', w: 28, h: 68 },
  starcarto: { name: 'Star-chart Cartographer', w: 26, h: 66 },
  mothlibrarian: { name: 'Moth Librarian', w: 30, h: 66 },
  meteorgolem: { name: 'Meteor Golem Girl', w: 30, h: 64 },
  geminighosts: { name: 'Gemini Ghosts', w: 32, h: 50 },
};
