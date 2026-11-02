// Monster art: the folk of the Sky Whale's Back (the levels 45-50 group dungeon, 2026-11, see
// docs/design/sky-whale.md), on the sky rig (skyrig.js: everything streams back in the wind, poses
// glide key to key, and wind lines pass beneath them).
//   kiterider       Kite Rider: a girl hanging from a big diamond kite, boots dangling; a diving
//                   two-footed kick.
//   shepherdess     Cloud Shepherdess: a fluffy wool dress, a crook, a little cloud sheep bobbing
//                   beside her; the crook hooks.
//   gunner          Sky Pirate Gunner: a tricorn with goggles pushed up on it, a bell-mouthed
//                   blunderbuss; a shot and a puff of smoke.
//   barnacleknight  Barnacle Knight: armour grown over with barnacles and shells, a coral lance; a
//                   heavy thrust.
//   harpist         Storm Harpist: a storm-cloud gown, a harp strung with lightning; a strum.
//   monk            Feather Monk: robes, folded feather wings, prayer beads; a palm strike that
//                   rings out a gust.
// All face right, feet at the bottom.

import { mix } from './kit.js';
import { KIT } from './maidens.js';
import { RW, RH, solve, plant, limb3, drawRig } from './manorrig.js';
import { armPart, legPart, gown, bodice, headPart, hairOf, eyes, BANGS, SWEPT } from './manor.js';
import { driftAt, streamer, windUnder, puff, gust } from './skyrig.js';

const { within, at, fpoly, opoly, ooval, dot, arcPts, oband, fband, taperW, line, sparkle, fade, backHair, round, soften, lerp, flowPts, lockHair, gem, TAU } = KIT;

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
function keyed(pose, f, mood, K, float = 0) {
  if (mood === 'dead') return K.dead;
  let P;
  if (pose === 'walk') P = driftAt(K.walk, f, 8, true, float);
  else if (pose === 'attack') P = driftAt(K.attack, f, 3, false);
  else P = driftAt(K.idle, f, 6, true, float);
  if (mood === 'hurt') P = { ...P, lean: (P.lean ?? 0) - 0.24, tilt: -0.34, hip: [P.hip[0] - 1.5, P.hip[1]] };
  return P;
}
const NOLEGS = [[0, 0], [0, 0]];
const AIR = '#eaf6ff';

// Hair blown back in the wind: a few long locks off the back of the head, streaming.
const blown = (HR, ph, n = 3, len = 13, w = 3.6) => [0, 1, 2, 3].slice(0, n).flatMap((k) => lockHair(flowPts([-5 + k, -4 + k * 2.6], Math.PI - 0.45 - k * 0.12, -0.25, len - k * 2, ph * 2 - k * 0.6, 0.16 * gust(ph, k), 5), w - k * 0.5, HR));

// ---------- Kite Rider ----------

const KR = soften({
  skin: '#ffe8d8', skinDk: '#f2c8b0', hair: '#ff9a3a', hairDk: '#d8701a', hairLt: '#ffc890',
  jacket: '#3aa0e0', jacketDk: '#2a74b0', scarf: '#ffd36b', scarfDk: '#e0a82a', short: '#2a3a5a', boot: '#8a5a3a', bootDk: '#5a3a2a',
  kite: '#ff5a7a', kiteDk: '#d83a5a', kite2: '#ffffff', spar: '#8a5a3a', tail: '#ffd36b', tail2: '#3aa0e0', goggle: '#9fe8ff',
});
const KR_FACE = { skin: KR.skin, skinSh: '#f2c8b0', skinSh2: '#d8a890', blush: '#ff9a8a', lip: '#e0504e', lipLine: '#a8302e', eye: eyes('#3a8ae0', '#1a4a9a', '#c8e8ff', { rx: 3.4, ry: 3.2 }), brow: { c: '#d8701a', kind: 'soft', w: 0.8 }, moods: { idle: { open: 1, mouth: 'grin' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
// Hanging from the kite bar: legs swinging like a swing, kicking, tucking.
// Strapped in a harness under the kite, hands on the control bar at her chest: legs swinging like a
// swing, kicking, tucking; one hand waves.
const KR_K = {
  walk: [
    { hip: [36, 46], lean: 0.12, tilt: 0.06, arms: [[1.5, -1.3], [1.7, -1.2]], legs: [[0.5, 0.4], [0.1, 0.6]] },
    { hip: [36, 47], lean: 0.06, tilt: -0.04, arms: [[1.5, -1.3], [1.7, -1.2]], legs: [[0.1, 0.6], [0.5, 0.4]] },
  ],
  idle: [
    { hip: [36, 46], lean: -0.02, tilt: 0.1, arms: [[1.5, -1.3], [1.7, -1.2]], legs: [[0.3, 0.6], [0.6, 0.2]] },
    { hip: [36, 47], lean: 0.08, tilt: -0.06, arms: [[1.5, -1.3], [1.7, -1.2]], legs: [[-0.2, 0.9], [0.1, 0.8]] },
    { hip: [36, 46], lean: 0, tilt: 0.14, arms: [[1.5, -1.3], [2.3, -0.4]], legs: [[0.6, 0.3], [0.4, 0.5]], wave: 1 },
  ],
  // Swing back, then both boots forward in a dive.
  attack: [
    { hip: [32, 45], lean: -0.3, tilt: -0.1, arms: [[1.3, -1.3], [1.5, -1.2]], legs: [[-0.6, 1.4], [-0.4, 1.4]] },
    { hip: [42, 49], lean: -0.5, tilt: 0.1, arms: [[1.9, -1.2], [2.1, -1.1]], legs: [[1.7, 0.1], [1.6, 0.1]], kick: 1 },
    { hip: [42, 49], lean: -0.46, tilt: 0.1, arms: [[1.9, -1.2], [2.1, -1.1]], legs: [[1.6, 0.15], [1.5, 0.15]], kick: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.06, arms: [[1.5, -1.3], [1.7, -1.2]], legs: [[0.3, 0.6], [0.6, 0.2]] },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function kiterider(pose, f, mood) {
  const C = fade(KR, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, KR_K, 1);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#6a2a0a');
  const dead = mood === 'dead';
  const [B, A] = S.arms;
  const bar = [(B.hand[0] + A.hand[0]) / 2, (B.hand[1] + A.hand[1]) / 2];
  const shapes = drawRig(S, {
    behind: () => {
      const out = [...windUnder(S.hip[0], 77, ph)];
      if (dead) return out;
      // The kite: a big diamond tilted into the wind behind her shoulders (never over her face),
      // harness lines down to her back and the control bar, a ribbon tail streaming.
      const kx = S.chest[0] - 13;
      const ky = S.chest[1] - 8 + Math.sin(ph) * 1.2;
      const tilt = -0.7 + Math.sin(ph) * 0.06;
      out.push(...within(at(kx, ky, tilt), () => [
        ...opoly([[0, -14], [11, 0], [0, 9], [-11, 0]], C.kite), fpoly([[0, -14], [11, 0], [0, 0]], C.kite2), fpoly([[0, 9], [-11, 0], [0, 0]], C.kite2),
        line([[0, -14], [0, 9]], 0.6, C.spar), line([[-11, 0], [11, 0]], 0.6, C.spar), ...gem(0, 0, 1.4, C.scarf),
      ]));
      out.push(line([[kx + 3, ky + 3], S.chest], 0.4, C.spar), line([[kx + 2, ky + 5], [S.hip[0] - 1, S.hip[1] - 2]], 0.4, C.spar), line([[kx + 4, ky + 1], bar], 0.3, C.spar));
      const tail = flowPts([kx - 6, ky + 6], Math.PI * 0.8, 0.2, 22 * gust(ph), ph * 2.4, 0.4, 7);
      out.push(fband(tail, 0.6, C.spar, 2));
      for (let k = 1; k < tail.length; k += 2) out.push(...opoly([[tail[k][0] - 1.6, tail[k][1]], [tail[k][0], tail[k][1] - 1.4], [tail[k][0] + 1.6, tail[k][1]], [tail[k][0], tail[k][1] + 1.4]], k % 4 === 1 ? C.tail : C.tail2, 0.3));
      out.push(...streamer([S.neck[0] - 1, S.neck[1] + 1], 16, ph, 2.6, C.scarf));
      return out;
    },
    backArm: () => armPart(B, C.jacketDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.skinDk, C.bootDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.4, hy - 1.4], [hx + 4.4, hy - 1.4], [hx + 5, hy + 3.4], [hx - 5, hy + 3.4]], 1), C.short)];
      out.push(...bodice(S, C.jacket, C.jacketDk));
      const [cx, cy] = S.chest;
      out.push(...oband([[cx - 4, cy - 1], [cx + 4, cy - 1.2]], 2.4, C.scarf, 1, 0.3), line([[cx + 1, cy + 1], [hx + 1, hy - 1.4]], 0.5, C.jacketDk));
      out.push(dot(cx + 3, cy + 4, 0.7, C.scarf), dot(cx + 3, cy + 6.4, 0.7, C.scarf));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.skin, C.boot),
    head: () => headPart(S, mood, KR_FACE, BANGS, HR, 1.14, () => [...backHair(HR, 4), ...blown(HR, ph, 3, 12)], () => [
      // Flying goggles pushed up on her brow (never over the eyes), the strap round the head.
      fband(arcPts(0.4, -2, 7.6, 6.4, 196, 344, 8), 0.9, C.short, 1), ...ooval(-2.4, -7.6, 2.2, 1.8, C.goggle), ...ooval(2.6, -7.8, 2.2, 1.8, C.goggle), dot(-3, -8.2, 0.6, '#ffffff'),
    ]),
    frontArm: () => {
      const out = [...armPart(A, C.jacket, C.skin)];
      if (P.kick > 0.5) {
        const ft = S.legs[1].ft;
        out.push(fband(arcPts(S.hip[0], S.hip[1], 22, 16, -40, 50, 8), (t) => 2.6 * Math.sin(Math.PI * t), mix(AIR, '#ffffff', 0.5), 1), sparkle(ft[0] + 4, ft[1], 3, '#ffffff'));
      }
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Cloud Shepherdess ----------

const CS = soften({
  skin: '#fff4ee', skinDk: '#f2d8cc', hair: '#c8a8f0', hairDk: '#9a7ad0', hairLt: '#ece0ff',
  wool: '#ffffff', woolDk: '#d8e2f6', dress: '#9fd0ff', dressDk: '#6aa0e0', apron: '#fff6e0', crook: '#c8a070', crookDk: '#8a6a3a', ribbon: '#ff8ab0', boot: '#6a5a8a',
  sheep: '#ffffff', sheepDk: '#d8e2f6', sheepFace: '#5a5a7a',
});
const CS_FACE = { skin: CS.skin, skinSh: '#f2d8cc', skinSh2: '#dcb8ac', blush: '#ffa8c0', lip: '#e0708e', lipLine: '#a8405e', eye: eyes('#7a6ad8', '#3a2a8a', '#e0d8ff', { rx: 3.2, ry: 3.4, tilt: -0.05 }), brow: { c: '#9a7ad0', kind: 'soft', w: 0.6 }, moods: { idle: { open: 0.7, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
const CS_K = {
  walk: [
    { hip: [36, 46], lean: 0.06, tilt: 0.06, arms: [[0.4, -0.6], [0.9, -1.6]], legs: [[-0.4, 0.3], [0.4, 0.05]] },
    { hip: [36, 45], lean: 0.04, tilt: -0.04, arms: [[-0.2, -0.4], [1, -1.6]], legs: [[0.4, 0.05], [-0.4, 0.3]] },
  ],
  // Leaning on the crook, then calling the sheep, then a hand shading her eyes.
  idle: [
    { hip: [36, 46], lean: 0.02, tilt: 0.1, arms: [[0.3, -0.6], [0.8, -1.6]], legs: [[-0.2, 0], [0.3, 0.1]] },
    { hip: [36, 46], lean: -0.06, tilt: -0.1, arms: [[2, -1.6], [0.8, -1.6]], legs: [[-0.2, 0], [0.3, 0.1]] },
    { hip: [36, 46], lean: 0.04, tilt: 0.14, arms: [[0.3, -0.6], [0.9, -1.8]], legs: [[-0.25, 0.1], [0.3, 0.1]] },
  ],
  // The crook swung up and over, hooking down.
  attack: [
    { hip: [35, 46], lean: -0.16, tilt: -0.12, arms: [[0.4, -0.6], [-0.6, -2]], legs: [[-0.3, 0.1], [0.4, 0.1]] },
    { hip: [39, 46], lean: 0.3, tilt: 0.14, arms: [[0.2, -0.4], [1.9, -0.2]], legs: [[-0.5, 0.2], [0.5, 0.15]], hook: 1 },
    { hip: [39, 46], lean: 0.26, tilt: 0.12, arms: [[0.2, -0.4], [1.7, 0]], legs: [[-0.5, 0.2], [0.5, 0.15]], hook: 1 },
    { hip: [37, 46], lean: 0, tilt: 0.08, arms: [[0.3, -0.6], [0.8, -1.6]], legs: [[-0.2, 0], [0.3, 0.1]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

// The little cloud sheep: a fluffy round body, a dark face, stubby legs, bobbing.
function cloudSheep(x, y, ph, C) {
  const b = Math.sin(ph * 2) * 1.2;
  return [
    ...[[-2.4, 0.2], [2.4, 0.4]].flatMap(([dx]) => line([[x + dx, y + 3 + b], [x + dx, y + 6 + b]], 0.9, C.sheepFace)),
    ...puff(x, y + b, 4.4, C.sheep, '#ffffff'), ...ooval(x + 4.6, y - 0.4 + b, 2, 2.2, C.sheepFace), ...ooval(x + 3.6, y - 2.4 + b, 1, 0.6, C.sheepFace, 0.4), dot(x + 5.2, y - 0.8 + b, 0.5, '#ffffff'),
  ];
}

function shepherdess(pose, f, mood) {
  const C = fade(CS, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, CS_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#4a2a7a');
  const A = S.arms[1];
  const ca = P.hook ? A.a - Math.PI / 2 - 0.2 : -Math.PI / 2 + 0.1;
  const foot = [A.hand[0] - Math.cos(ca) * 10, A.hand[1] - Math.sin(ca) * 10];
  const top = [A.hand[0] + Math.cos(ca) * 12, A.hand[1] + Math.sin(ca) * 12];
  const shapes = drawRig(S, {
    behind: () => [...windUnder(S.hip[0], 77, ph), ...streamer([S.chest[0] - 2, S.chest[1] + 1], 12, ph, 1.6, C.ribbon, 1), ...(mood === 'dead' ? [] : cloudSheep(S.hip[0] - 16, 66 + Math.sin(ph) * 2, ph, C))],
    backArm: () => armPart(S.arms[0], C.woolDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.dressDk, C.boot),
    body: () => {
      // A wool dress puffed like a cloud, an apron, a ribbon at the waist streaming back.
      const g = gown(S, 13, 8, C.dress, C.dressDk, Math.sin(ph) * 0.8 - 0.6 * gust(ph));
      const out = [...g.out];
      const [hx, hy] = S.hip;
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - 8 + k * 4, hy + 12.4 + (k % 2) * 0.6, 2.4, 1.8, C.wool, 0, 0.25));
      out.push(...opoly(round([[hx - 3, hy], [hx + 3.4, hy], [hx + 4, hy + 9], [hx - 3.4, hy + 9]], 1), C.apron, 0.3));
      out.push(...bodice(S, C.dress, C.dressDk));
      const [cx, cy] = S.chest;
      for (let k = 0; k < 4; k++) out.push(...ooval(cx - 4 + k * 2.6, cy - 1 + Math.abs(k - 1.5) * 0.4, 1.6, 1.4, C.wool, 0, 0.25));
      out.push(...ooval(hx - 4, hy, 1.4, 1, C.ribbon), ...streamer([hx - 5, hy], 10, ph, 1.4, C.ribbon, 2, 0.3));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.dress, C.boot),
    head: () => headPart(S, mood, CS_FACE, BANGS, HR, 1.14, () => [...backHair(HR, 7), ...blown(HR, ph, 2, 11)], () => [
      // A woolly bonnet with little sheep ears and a ribbon tie.
      ...ooval(-0.6, -8.6, 8.4, 3.4, C.wool, -0.1), ...ooval(-7.6, -6, 2, 1.2, C.sheepDk, 0.6), ...ooval(6.4, -7, 2, 1.2, C.sheepDk, -0.6), dot(-3, -10.4, 1, C.ribbon),
    ]),
    frontArm: () => {
      // The shepherd's crook: a long staff with a curl, a bell tied under the curl.
      const out = [...oband([foot, top], 0.9, C.crook, 1, 0.3)];
      const curl = arcPts(top[0] + Math.cos(ca + Math.PI / 2) * 3, top[1] + Math.sin(ca + Math.PI / 2) * 3, 3, 3, (ca * 180) / Math.PI - 90, (ca * 180) / Math.PI + 140, 8);
      out.push(...oband(curl, 0.9, C.crook, 1, 0.3), ...ooval(top[0] + 1, top[1] + 2.4, 1.2, 1.4, '#ffd36b'));
      out.push(...armPart(A, C.wool, C.skin));
      if (P.hook) out.push(fband(arcPts(S.hip[0] + 4, S.hip[1] - 6, 24, 18, -90, 40, 8), (t) => 2.4 * Math.sin(Math.PI * t), mix(C.dress, '#ffffff', 0.5), 1), sparkle(top[0] + 4, top[1], 3, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Sky Pirate Gunner ----------

const GU = soften({
  skin: '#f6d2b8', skinDk: '#e0b090', hair: '#2a2a3a', hairDk: '#14141e', hairLt: '#5a5a7a',
  coat: '#c8304e', coatDk: '#8a1a36', shirt: '#fff6e0', shirtDk: '#e0d4b8', sash: '#ffd36b', pant: '#2a3a5a', boot: '#3a2a2a',
  hat: '#2a2a3a', hatDk: '#14141e', trim: '#ffd36b', goggle: '#9fe8ff', gun: '#c8a070', gunDk: '#8a6a3a', brass: '#ffd36b', brassDk: '#c8902a', smoke: '#e6e6f0',
});
const GU_FACE = { skin: GU.skin, skinSh: '#e0b090', skinSh2: '#c89070', blush: '#ff9a8a', lip: '#c8504e', lipLine: '#8a302e', eye: eyes('#2aa08a', '#0a5a4a', '#c8f0e0', { tilt: 0.25, ry: 2.6, flicks: 2 }), brow: { c: '#14141e', kind: 'arched', w: 0.9 }, moods: { idle: { open: 0.85, mouth: 'smirk' }, angry: { mouth: 'grin' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'laugh' } } };
const GU_K = {
  walk: [
    { hip: [36, 46], lean: 0.1, tilt: 0.04, arms: [[0.6, -1], [1, -1.6]], legs: [[-0.45, 0.2], [0.45, 0.05]] },
    { hip: [36, 45], lean: 0.08, tilt: -0.04, arms: [[-0.1, -0.8], [1, -1.7]], legs: [[0.45, 0.05], [-0.45, 0.2]] },
  ],
  // Gun on the shoulder, spinning a coin, then sighting down the barrel.
  idle: [
    { hip: [36, 46], lean: -0.04, tilt: 0.08, arms: [[0.4, -1], [2.4, -2.2]], legs: [[-0.3, 0.05], [0.35, 0.05]] },
    { hip: [36, 46], lean: -0.06, tilt: -0.08, arms: [[1.6, -1.4], [2.4, -2.2]], legs: [[-0.3, 0.05], [0.35, 0.05]], coin: 1 },
    { hip: [36, 46], lean: 0.04, tilt: 0.04, arms: [[1.3, -0.2], [1.5, -0.3]], legs: [[-0.35, 0.05], [0.4, 0.1]], aim: 1 },
  ],
  attack: [
    { hip: [36, 46], lean: -0.04, tilt: 0.02, arms: [[1.3, -0.2], [1.5, -0.3]], legs: [[-0.35, 0.05], [0.4, 0.1]], aim: 1 },
    { hip: [33, 46], lean: -0.24, tilt: -0.16, arms: [[1.5, -0.6], [1.9, -0.8]], legs: [[-0.5, 0.1], [0.3, 0.1]], aim: 1, fire: 1 },
    { hip: [34, 46], lean: -0.16, tilt: -0.1, arms: [[1.4, -0.4], [1.7, -0.5]], legs: [[-0.45, 0.1], [0.35, 0.1]], aim: 1, fire: 0.6 },
    { hip: [36, 46], lean: -0.04, tilt: 0.08, arms: [[0.4, -1], [2.4, -2.2]], legs: [[-0.3, 0.05], [0.35, 0.05]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function gunner(pose, f, mood) {
  const C = fade(GU, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, GU_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#000010');
  const A = S.arms[1];
  const dead = mood === 'dead';
  const ga = P.aim > 0.5 ? A.a - Math.PI / 2 + (P.fire ?? 0) * -0.3 : A.a - Math.PI / 2 + 0.9;
  const butt = [A.hand[0] - Math.cos(ga) * 6, A.hand[1] - Math.sin(ga) * 6];
  const muzzle = [A.hand[0] + Math.cos(ga) * 13, A.hand[1] + Math.sin(ga) * 13];
  const nrm = [-Math.sin(ga), Math.cos(ga)];
  const shapes = drawRig(S, {
    behind: () => [...windUnder(S.hip[0], 77, ph), ...streamer([S.hip[0] - 4, S.hip[1] - 1], 9, ph, 1.6, C.sash, 0, 0.5), ...streamer([S.hip[0] - 5, S.hip[1] + 3], 10, ph, 3.6, C.coatDk, 1, 0.7)],
    backArm: () => {
      const out = [...armPart(S.arms[0], C.coatDk, C.skinDk)];
      if (P.coin > 0.5) out.push(...ooval(S.arms[0].hand[0], S.arms[0].hand[1] - 4 - Math.abs(Math.sin(ph * 2)) * 3, 1.3 * Math.abs(Math.cos(ph * 3)) + 0.3, 1.3, C.brass));
      return out;
    },
    backLeg: () => legPart(S.legs[0], C.pant, C.boot),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 7.6, hy + 9], [hx - 7, hy + 10]], 2), C.coat), fpoly([[hx - 1, hy], [hx + 2, hy], [hx + 3, hy + 9.4], [hx - 1.4, hy + 9.6]], C.shirtDk)];
      out.push(...bodice(S, C.shirt, C.shirtDk));
      const [cx, cy] = S.chest;
      out.push(...opoly([[cx - 4.6, cy - 1], [cx - 1, cy + 7], [hx - 4, hy - 1], [hx - 5, hy - 1]], C.coat, 0.3), ...opoly([[cx + 4.6, cy - 1], [cx + 1.6, cy + 7], [hx + 4, hy - 1], [hx + 5, hy - 1]], C.coat, 0.3));
      out.push(...oband([[hx - 4.6, hy - 1], [hx + 4.6, hy - 1.2]], 2, C.sash, 1, 0.3), ...KIT.gem(hx, hy - 1.1, 1, C.brass));
      // A bandolier of little brass shells.
      for (let k = 0; k < 5; k++) out.push(dot(lerp(cx + 4, hx - 3, k / 4), lerp(cy - 1, hy - 1.6, k / 4), 0.7, C.brass));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.pant, C.boot),
    head: () => headPart(S, mood, GU_FACE, SWEPT, HR, 1.12, () => [...backHair(HR, 6), ...blown(HR, ph, 2, 10)], () => [
      // A tricorn with gold trim, goggles riding on its brim (clear of the eyes), a feather streaming.
      ...opoly(round([[-11, -6], [-3, -9.6], [8, -8], [11, -5.6], [5, -7], [-4, -7.4]], 1.4), C.hat), ...opoly(round([[-6, -8], [-3, -14], [5, -14], [7, -8]], 2), C.hat),
      fband([[-11, -6], [-3, -9.6], [8, -8], [11, -5.6]], 0.6, C.trim, 1),
      ...ooval(-1.6, -10.4, 2.2, 1.8, C.goggle), ...ooval(2.8, -10.6, 2.2, 1.8, C.goggle), line([[0.6, -10.6], [0.6, -10.4]], 0.6, C.brassDk),
      ...streamer([-3, -13], 9, ph, 1.8, '#ffffff', 3, -0.4, 5),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The blunderbuss: a wooden stock, a brass barrel flaring to a bell mouth.
        out.push(...oband([butt, A.hand], 2, C.gun, 1, 0.3));
        out.push(...opoly([[A.hand[0] + nrm[0] * 1.2, A.hand[1] + nrm[1] * 1.2], [muzzle[0] + nrm[0] * 2.6, muzzle[1] + nrm[1] * 2.6], [muzzle[0] - nrm[0] * 2.6, muzzle[1] - nrm[1] * 2.6], [A.hand[0] - nrm[0] * 1.2, A.hand[1] - nrm[1] * 1.2]], C.brass));
        out.push(fband([[muzzle[0] + nrm[0] * 2.6, muzzle[1] + nrm[1] * 2.6], [muzzle[0] - nrm[0] * 2.6, muzzle[1] - nrm[1] * 2.6]], 0.8, C.brassDk, 1));
        if (P.fire > 0.5) {
          const fx = muzzle[0] + Math.cos(ga) * 4;
          const fy = muzzle[1] + Math.sin(ga) * 4;
          out.push(...opoly([[fx - 2, fy - 3], [fx + 6, fy - 1], [fx + 9, fy], [fx + 6, fy + 1], [fx - 2, fy + 3]], '#ffd36b', 0.3), sparkle(fx + 8, fy, 3.4, '#ffffff'));
        }
        if (P.fire > 0.3) out.push(...puff(muzzle[0] + 2 - (1 - P.fire) * 8, muzzle[1] - 4 - (1 - P.fire) * 6, 3 + (1 - P.fire) * 3, C.smoke, '#ffffff'));
      }
      out.push(...armPart(A, C.coat, C.skin));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Barnacle Knight ----------

const BK = soften({
  skin: '#e8f2f0', skinDk: '#c8dcd8', hair: '#3a8a8a', hairDk: '#1a5a5a', hairLt: '#7ad0c8',
  plate: '#7ab0c0', plateDk: '#4a7a8a', plateLt: '#b8e0e8', barn: '#e8e0d0', barnDk: '#a89a80', shell: '#ffb3c6', shellDk: '#d87a96',
  coral: '#ff7a8a', coralDk: '#c84a5a', kelp: '#3aa06a', kelpDk: '#1a6a4a', boot: '#2a4a5a',
});
const BK_FACE = { skin: BK.skin, skinSh: '#c8dcd8', skinSh2: '#a0bcb8', blush: '#ff9ab0', lip: '#a85a7a', lipLine: '#6a3a5a', eye: eyes('#ff7a8a', '#8a1a2a', '#ffd8dc', { tilt: 0.2, ry: 2.5 }), brow: { c: '#1a5a5a', kind: 'thick', w: 1 }, moods: { idle: { open: 0.8, mouth: 'calm' }, angry: { mouth: 'grit' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'smile' } } };
// A heavy, slow guard: lance couched, shield of shell up.
const BK_K = {
  walk: [
    { hip: [36, 46], lean: 0.12, tilt: 0.04, arms: [[0.9, -1.6], [1, -1.2]], legs: [[-0.5, 0.25], [0.5, 0.05]] },
    { hip: [36, 45], lean: 0.1, tilt: -0.04, arms: [[0.9, -1.6], [1.1, -1.2]], legs: [[0.5, 0.05], [-0.5, 0.25]] },
  ],
  idle: [
    { hip: [36, 46], lean: 0.02, tilt: 0.04, arms: [[0.9, -1.6], [0.6, -0.8]], legs: [[-0.35, 0.05], [0.4, 0.1]] },
    { hip: [36, 46], lean: -0.04, tilt: -0.06, arms: [[0.9, -1.6], [0.7, -0.9]], legs: [[-0.35, 0.05], [0.4, 0.1]] },
    { hip: [36, 47], lean: 0.06, tilt: 0.1, arms: [[0.9, -1.4], [0.6, -0.8]], legs: [[-0.4, 0.15], [0.45, 0.2]] },
  ],
  attack: [
    { hip: [33, 47], lean: -0.14, tilt: -0.1, arms: [[0.9, -1.6], [0.4, -1.4]], legs: [[-0.55, 0.3], [0.3, 0.2]] },
    { hip: [43, 46], lean: 0.36, tilt: 0.12, arms: [[0.6, -1.4], [1.6, -0.1]], legs: [[-0.8, 0.3], [0.8, 0.3]], thrust: 1 },
    { hip: [43, 46], lean: 0.32, tilt: 0.1, arms: [[0.6, -1.4], [1.6, 0]], legs: [[-0.8, 0.3], [0.8, 0.3]], thrust: 1 },
    { hip: [37, 46], lean: 0.02, tilt: 0.04, arms: [[0.9, -1.6], [0.6, -0.8]], legs: [[-0.35, 0.05], [0.4, 0.1]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

const barnacle = (x, y, r, C) => [...ooval(x, y, r, r * 0.8, C.barn, 0, 0.3), ...ooval(x, y - r * 0.2, r * 0.4, r * 0.3, C.barnDk, 0, 0)];

function barnacleknight(pose, f, mood) {
  const C = fade(BK, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, BK_K);
  const S = plant(solve(P, 1.04));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#0a2a2a');
  const [B, A] = S.arms;
  const la = P.thrust ? 0 : -0.25;
  const tip = [A.hand[0] + Math.cos(la) * 20, A.hand[1] + Math.sin(la) * 20];
  const back = [A.hand[0] - Math.cos(la) * 8, A.hand[1] - Math.sin(la) * 8];
  const shapes = drawRig(S, {
    behind: () => [...windUnder(S.hip[0], 77, ph), ...streamer([S.chest[0] - 3, S.chest[1] - 1], 16, ph, 3, C.kelp, 0, 0.4), ...streamer([S.chest[0] - 2, S.chest[1] + 2], 12, ph, 2, C.kelpDk, 2, 0.6)],
    backArm: () => {
      // A round shield made of a great scallop shell.
      const out = [...armPart(B, C.plateDk, C.plateDk)];
      const [x, y] = B.hand;
      out.push(...ooval(x + 2, y - 1, 6, 6.6, C.shell));
      for (let k = -2; k <= 2; k++) out.push(line([[x + 2, y + 5], [x + 2 + k * 2.4, y - 6]], 0.5, C.shellDk));
      out.push(...barnacle(x + 5, y + 2, 1.4, C));
      return out;
    },
    backLeg: () => legPart(S.legs[0], C.plateDk, C.boot, 1.1),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 5, hy - 1.4], [hx + 5, hy - 1.4], [hx + 6.4, hy + 6], [hx - 6.4, hy + 6]], 1), C.plate)];
      for (let k = 0; k < 4; k++) out.push(...opoly([[hx - 6 + k * 3.4, hy + 5.6], [hx - 4.4 + k * 3.4, hy + 9], [hx - 2.8 + k * 3.4, hy + 5.6]], C.plateDk, 0.3));
      out.push(...bodice(S, C.plate, C.plateDk));
      const [cx, cy] = S.chest;
      // Pauldrons and a breastplate grown over with barnacles, a pink shell at the heart.
      out.push(...ooval(cx - 4.6, cy - 0.4, 3, 2.4, C.plateLt), ...ooval(cx + 4.6, cy - 0.6, 3, 2.4, C.plateLt));
      for (const [dx, dy, r] of [[-5, -1, 1.2], [-3.4, 0.6, 0.9], [4, -1.4, 1], [2, 5, 1.1], [-1.4, 7, 0.9]]) out.push(...barnacle(cx + dx, cy + dy, r, C));
      out.push(...within(at(cx + 0.4, cy + 2.6, 0), () => [...opoly([[-2, 1.4], [0, -2], [2, 1.4]], C.shell, 0.3), line([[0, -1.4], [0, 1.2]], 0.3, C.shellDk)]));
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.plate, C.boot, 1.1),
    head: () => headPart(S, mood, BK_FACE, SWEPT, HR, 1.1, () => [...backHair(HR, 5), ...blown(HR, ph, 2, 10, 3)], () => [
      // An open helm (the face clear) crested with a fin of coral, barnacles on the brow.
      ...opoly(round([[-9, 0], [-8.6, -7], [-3, -11], [4, -11], [8.6, -6], [9, -2], [6.6, -3], [6, -7.4], [-5, -7.6], [-7, -1]], 1.6), C.plate),
      ...opoly([[-5, -11], [-2, -17 + Math.sin(ph) * 0.6], [1, -12], [3, -16], [5, -11]], C.coral), ...barnacle(-6, -7, 1.2, C), ...barnacle(5.6, -7.6, 1, C),
    ]),
    frontArm: () => {
      // The coral lance: a branched spear of red coral, couched under the arm.
      const out = [...oband([back, tip], taperW(2.2, 0.6), C.coral, 1, 0.3)];
      out.push(...oband([[lerp(back[0], tip[0], 0.55), lerp(back[1], tip[1], 0.55)], [lerp(back[0], tip[0], 0.7) + 1, lerp(back[1], tip[1], 0.7) - 4]], 0.7, C.coralDk, 1, 0.3));
      out.push(...armPart(A, C.plate, C.plateDk, 1.1));
      if (P.thrust) out.push(fband([[tip[0] - 26, tip[1]], [tip[0] + 6, tip[1]]], (t) => 2.4 * Math.sin(Math.PI * t), mix(C.coral, '#ffffff', 0.5), 1), sparkle(tip[0] + 4, tip[1], 3.4, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Storm Harpist ----------

const SHP = soften({
  skin: '#f4f0ff', skinDk: '#dcd6f2', hair: '#5a6a9a', hairDk: '#3a4a7a', hairLt: '#9aaad8',
  gown: '#6a7aa8', gownDk: '#4a5888', cloud: '#c8d0e8', cloudLt: '#eef2ff', harp: '#ffd36b', harpDk: '#c8902a', bolt: '#fff3a6', boltDk: '#7fd8ff',
  mist: '#c8d0e8', mistDk: '#8a96c0', mistLt: '#ffffff',
});
const SHP_FACE = { skin: SHP.skin, skinSh: '#dcd6f2', skinSh2: '#b8b0dc', blush: '#c8b4f0', lip: '#7a6ab0', lipLine: '#4a3a8a', eye: eyes('#7fd8ff', '#1a5a9a', '#e0f6ff', { tilt: 0.1, ry: 2.8, flicks: 2 }), brow: { c: '#3a4a7a', kind: 'soft', w: 0.7 }, moods: { idle: { open: 0.65, mouth: 'smile' }, angry: { mouth: 'pout' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// She floats on her own little storm cloud, harp in the crook of her arm.
const SHP_K = {
  walk: [0, 1, 2, 3].map((i) => ({ hip: [36, 44], lean: 0.1, tilt: 0.06 * Math.sin((i / 4) * TAU), arms: [[1, -1.6], [0.9, -1.2]], legs: NOLEGS })),
  idle: [
    { hip: [36, 44], lean: -0.02, tilt: 0.1, arms: [[1, -1.6], [0.9, -1.2]], legs: NOLEGS, pluck: 0 },
    { hip: [36, 43], lean: 0.02, tilt: -0.06, arms: [[1, -1.6], [1.2, -1]], legs: NOLEGS, pluck: 1 },
    { hip: [36, 44], lean: -0.02, tilt: 0.14, arms: [[1, -1.6], [0.8, -1.4]], legs: NOLEGS, pluck: 0 },
  ],
  attack: [
    { hip: [35, 44], lean: -0.1, tilt: -0.1, arms: [[1, -1.6], [0.2, -2]], legs: NOLEGS },
    { hip: [38, 44], lean: 0.16, tilt: 0.1, arms: [[1, -1.6], [1.6, -0.4]], legs: NOLEGS, strum: 1 },
    { hip: [38, 44], lean: 0.14, tilt: 0.08, arms: [[1, -1.6], [1.7, -0.3]], legs: NOLEGS, strum: 1 },
    { hip: [36, 44], lean: 0, tilt: 0.06, arms: [[1, -1.6], [0.9, -1.2]], legs: NOLEGS },
  ],
  dead: { hip: [34, 62], lean: 0.6, tilt: 0.5, arms: [[0.3, 0.2], [0.4, 0.2]], legs: NOLEGS },
};

function bolt(a, b, k, c) {
  const pts = [a];
  for (let i = 1; i < 4; i++) pts.push([lerp(a[0], b[0], i / 4) + ((i + k) % 2 ? 1.6 : -1.6), lerp(a[1], b[1], i / 4) + ((i + k) % 2 ? -1 : 1)]);
  pts.push(b);
  return fband(pts, 0.7, c, 1);
}

function harpist(pose, f, mood) {
  const C = fade(SHP, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, SHP_K, 1);
  const S = solve(P);
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#1a2a4a');
  const [B, A] = S.arms;
  const dead = mood === 'dead';
  // The harp sits in the crook of her back arm: a gold frame, strings of lightning.
  const hb = [B.hand[0] + 4, B.hand[1] + 2];
  const shapes = drawRig(S, {
    behind: () => {
      const out = [...windUnder(S.hip[0], 77, ph, C.cloudLt)];
      // Her storm cloud under her, rumbling.
      if (!dead) out.push(...puff(S.hip[0], S.hip[1] + 16 + Math.sin(ph) * 0.8, 9, C.cloud, C.cloudLt), ...puff(S.hip[0] - 8, S.hip[1] + 18, 5, C.mistDk, C.cloud));
      out.push(...[0, 1, 2].flatMap((k) => lockHair(flowPts([S.head[0] - 5, S.head[1] - 1 + k * 3], Math.PI * 0.72 + k * 0.08, -0.5, 18 - k * 3, ph * 2 - k, 0.18 * gust(ph, k), 5), 4.4 - k, HR)));
      return out;
    },
    backArm: () => armPart(B, C.gownDk, C.skinDk),
    body: () => {
      const g = gown(S, 15, 9, C.gown, C.gownDk, Math.sin(ph) * 0.8 - 0.8 * gust(ph));
      const out = [...g.out, ...bodice(S, C.gown, C.gownDk)];
      const [hx, hy] = S.hip;
      // The hem frays into storm cloud; little bolts flicker in it.
      for (let k = 0; k < 5; k++) out.push(...ooval(hx - 9 + k * 4.4, hy + 14.6 + (k % 2), 2.8, 2, C.cloud, 0, 0.25));
      if (!dead && f % 3 === 0) out.push(bolt([hx - 4, hy + 15], [hx - 1, hy + 19], f, C.bolt));
      const [cx, cy] = S.chest;
      out.push(fband(arcPts(cx, cy + 1.4, 3.6, 1.8, 195, 345, 6), 0.8, C.cloudLt, 1));
      return out;
    },
    head: () => headPart(S, mood, SHP_FACE, SWEPT, HR, 1.14, () => backHair(HR, 9), () => [
      // A circlet with a lightning bolt.
      fband(arcPts(0.4, -2, 7.6, 6, 200, 340, 8), 0.8, C.harp, 1), ...opoly([[-0.6, -11], [1.6, -11], [0.4, -8.6], [2, -8.6], [-1, -5.4], [0, -8], [-1.6, -8]], C.bolt, 0.3),
    ]),
    frontArm: () => {
      const out = [];
      if (!dead) {
        // The harp's frame: a gold neck curling over, a pillar, the soundboard.
        const top = [hb[0] + 2, hb[1] - 14];
        out.push(...oband([hb, [hb[0] - 1, hb[1] - 8], top], 1.2, C.harp, 2, 0.3), ...oband([top, [hb[0] + 8, hb[1] - 10], [hb[0] + 10, hb[1] - 2]], 1, C.harp, 2, 0.3), ...oband([hb, [hb[0] + 10, hb[1] - 2]], 1.2, C.harpDk, 1, 0.3));
        for (let k = 1; k < 5; k++) {
          const a = [lerp(hb[0], hb[0] + 10, k / 5), lerp(hb[1], hb[1] - 2, k / 5)];
          const b = [lerp(top[0], hb[0] + 10, k / 5) + 0.4, lerp(top[1], hb[1] - 2, k / 5) - 0.6];
          out.push(P.strum || P.pluck ? bolt(a, b, k + f, C.bolt) : line([a, b], 0.35, C.boltDk));
        }
        if (P.strum) for (let k = 0; k < 3; k++) out.push(bolt([hb[0] + 10, hb[1] - 6], [hb[0] + 24 + k * 6, hb[1] - 12 + k * 6], k + f, k % 2 ? C.boltDk : C.bolt), sparkle(hb[0] + 26 + k * 6, hb[1] - 12 + k * 6, 2.4, '#ffffff'));
      }
      out.push(...armPart(A, C.gown, C.skin));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

// ---------- Feather Monk ----------

const FM = soften({
  skin: '#ffe8d8', skinDk: '#f2c8b0', hair: '#f2f0ea', hairDk: '#c8c4b8', hairLt: '#ffffff',
  robe: '#ffb347', robeDk: '#d8802a', under: '#fff6e0', underDk: '#e0d4b8', sash: '#c8304e', wing: '#ffffff', wingDk: '#d8e2f6', wingTip: '#9fd0ff',
  bead: '#8a5a3a', beadLt: '#c8906a', ring: '#eaf6ff',
});
const FM_FACE = { skin: FM.skin, skinSh: '#f2c8b0', skinSh2: '#d8a890', blush: '#ffa890', lip: '#c8604e', lipLine: '#8a3a2e', eye: eyes('#c8902a', '#6a4a0a', '#fff0c8', { rx: 3.2, ry: 2.4, tilt: -0.05 }), brow: { c: '#c8c4b8', kind: 'soft', w: 0.8 }, moods: { idle: { open: 0.45, mouth: 'smile' }, angry: { open: 0.9, mouth: 'calm' }, hurt: { mouth: 'grimace' }, happy: { mouth: 'grin' } } };
// Calm: a meditative stance, palms pressed, then the palm strike.
const FM_K = {
  walk: [
    { hip: [36, 46], lean: 0.06, tilt: 0.02, arms: [[0.4, -1.6], [0.5, -1.7]], legs: [[-0.4, 0.2], [0.4, 0.05]] },
    { hip: [36, 45], lean: 0.04, tilt: -0.02, arms: [[0.4, -1.6], [0.5, -1.7]], legs: [[0.4, 0.05], [-0.4, 0.2]] },
  ],
  idle: [
    { hip: [36, 47], lean: 0, tilt: 0.04, arms: [[0.4, -1.6], [0.5, -1.7]], legs: [[-0.45, 0.3], [0.45, 0.3]] },
    { hip: [36, 46], lean: -0.04, tilt: -0.04, arms: [[1.6, -0.6], [-0.2, -1.6]], legs: [[-0.45, 0.3], [0.45, 0.3]] },
    { hip: [36, 47], lean: 0, tilt: 0.06, arms: [[0.4, -1.6], [0.5, -1.7]], legs: [[-0.45, 0.3], [0.45, 0.3]] },
  ],
  attack: [
    { hip: [34, 48], lean: -0.1, tilt: -0.06, arms: [[0.6, -1.4], [-0.6, -1.8]], legs: [[-0.6, 0.5], [0.5, 0.4]] },
    { hip: [41, 47], lean: 0.3, tilt: 0.1, arms: [[-0.4, -1], [1.6, -0.05]], legs: [[-0.9, 0.3], [0.7, 0.4]], palm: 1 },
    { hip: [41, 47], lean: 0.26, tilt: 0.08, arms: [[-0.4, -1], [1.6, 0]], legs: [[-0.9, 0.3], [0.7, 0.4]], palm: 1 },
    { hip: [37, 47], lean: 0, tilt: 0.04, arms: [[0.4, -1.6], [0.5, -1.7]], legs: [[-0.45, 0.3], [0.45, 0.3]] },
  ],
  dead: { hip: [34, 60], lean: 0.5, tilt: 0.55, arms: [[0.1, 0.2], [0.3, 0.1]], legs: [[1.5, -2.7], [1.3, -2.5]] },
};

function wing(root, ph, open, C, back) {
  const out = [];
  for (let k = 0; k < 5; k++) {
    const a = Math.PI + 0.9 - k * 0.32 - open * 0.3 + Math.sin(ph * 2 - k * 0.5) * 0.05;
    const len = 14 - k * 1.4 + open * 4;
    const tip = [root[0] + Math.cos(a) * len, root[1] + Math.sin(a) * len];
    out.push(...oband([root, [lerp(root[0], tip[0], 0.5), lerp(root[1], tip[1], 0.5) - 1], tip], (t) => Math.sin(Math.PI * Math.min(1, t + 0.2)) * 2.6 + 0.4, back ? C.wingDk : k === 0 ? C.wingTip : C.wing, 3, 0.3));
  }
  return out;
}

function monk(pose, f, mood) {
  const C = fade(FM, mood);
  const n = frames(pose);
  const ph = (f / n) * TAU;
  const P = keyed(pose, f, mood, FM_K);
  const S = plant(solve(P));
  const HR = hairOf(C.hair, C.hairDk, C.hairLt, '#5a5a5a');
  const A = S.arms[1];
  const open = P.palm ?? 0;
  const shapes = drawRig(S, {
    behind: () => [...windUnder(S.hip[0], 77, ph), ...wing([S.chest[0] - 3, S.chest[1] + 1], ph, open, C, true), ...wing([S.chest[0] - 1, S.chest[1] + 2], ph + 0.4, open, C, false), ...streamer([S.hip[0] - 4, S.hip[1] - 1], 16, ph, 2.4, C.sash, 0, 0.3)],
    backArm: () => armPart(S.arms[0], C.robeDk, C.skinDk),
    backLeg: () => legPart(S.legs[0], C.robeDk, C.underDk),
    body: () => {
      const [hx, hy] = S.hip;
      const out = [...opoly(round([[hx - 4.6, hy - 1.4], [hx + 4.6, hy - 1.4], [hx + 7, hy + 7], [hx - 7, hy + 7.4]], 2), C.robe)];
      out.push(...bodice(S, C.under, C.underDk));
      const [cx, cy] = S.chest;
      // The robe wrapped over one shoulder, a sash, and prayer beads swinging.
      out.push(...opoly([[cx + 4.6, cy - 1.4], [cx + 1, cy - 1.4], [hx - 4, hy - 1], [hx + 2, hy - 1]], C.robe, 0.3));
      out.push(...oband([[hx - 4.6, hy - 1], [hx + 4.6, hy - 1.2]], 1.8, C.sash, 1, 0.3));
      for (let k = 0; k < 9; k++) {
        const t = k / 8;
        out.push(dot(cx - 3 + t * 6 + Math.sin(ph + t * 2) * 0.4, cy - 0.6 + Math.sin(Math.PI * t) * 7, 0.8, k === 4 ? C.sash : k % 2 ? C.bead : C.beadLt));
      }
      return out;
    },
    frontLeg: () => legPart(S.legs[1], C.robe, C.under),
    head: () => headPart(S, mood, FM_FACE, SWEPT, HR, 1.1, () => [...backHair(HR, 4), ...lockHair(flowPts([-4, -7], Math.PI + 0.2, 0.2, 11, ph * 2, 0.16 * gust(ph), 5), 3, HR)], () => [
      // A topknot tied with a feather, the feather streaming.
      ...ooval(-1, -10.4, 2.6, 2.2, C.hair), fband(arcPts(-1, -9.4, 2.4, 1, 200, 340, 5), 0.7, C.sash, 1),
      ...oband(flowPts([-2, -11], Math.PI + 0.5, 0.3, 9, ph * 2.4, 0.2, 4), (t) => Math.sin(Math.PI * Math.min(1, t + 0.15)) * 1.8 + 0.3, C.wing, 3, 0.3),
    ]),
    frontArm: () => {
      const out = [...armPart(A, C.robe, C.skin)];
      if (P.palm) for (let r = 0; r < 3; r++) out.push(fband(arcPts(A.hand[0] + 2 + r * 4, A.hand[1], 3 + r * 4, 4 + r * 4.6, -60, 60, 7), 1 - r * 0.2, r % 2 ? C.wingTip : C.ring, 1), sparkle(A.hand[0] + 18, A.hand[1], 3, '#ffffff'));
      return out;
    },
  });
  return { w: RW, h: RH, res: 3, shapes };
}

export const ART = {
  kiterider: { walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [80, 240, 180], draw: kiterider },
  shepherdess: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 240, 180], draw: shepherdess },
  gunner: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 230, 170], draw: gunner },
  barnacleknight: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 280, 200], draw: barnacleknight },
  harpist: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [90, 260, 190], draw: harpist },
  monk: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 230, 170], draw: monk },
};

export const INFO = {
  kiterider: { name: 'Kite Rider', w: 28, h: 64 },
  shepherdess: { name: 'Cloud Shepherdess', w: 28, h: 64 },
  gunner: { name: 'Sky Pirate Gunner', w: 28, h: 66 },
  barnacleknight: { name: 'Barnacle Knight', w: 32, h: 68 },
  harpist: { name: 'Storm Harpist', w: 28, h: 64 },
  monk: { name: 'Feather Monk', w: 28, h: 64 },
};
