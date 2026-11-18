// Monster art: the Sunken Aquarium Palace's bosses (docs/design/aquarium-palace.md), redrawn
// creature-first and big (2026-11-03): chibi proportions at two and a half to three times the
// hero's height, each with one signature shape that reads across the room.
//   moraymurri / morayena  The Twin Morays (seabossrigs.js, remade 2026-11-18)
//   abyssia                Lady Abyssia, the Sea Witch (seabossrigs.js, remade 2026-11-18)
//   coralie                Queen Coralie, the Drowned Queen: a chibi mermaid queen, seafoam hair
//                          drifting up round a coral crown, a great curled tail and a trident she
//                          drives down in a wave.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, bubbles, ink, cuteFace, blob } from './critter.js';
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';
import { murriRig, enaRig, morayStill, abyssiaRig, abyssiaStill } from './seabossrigs.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// ---------- Queen Coralie, the Drowned Queen ----------

const QUEEN_ATK = [
  { tri: -150, rise: 1, flare: 1 },
  { tri: -20, rise: -0.4, flare: 0.4, smear: 1 },
  { tri: 10, rise: -0.6, flare: 0.2, splash: 1 },
  { tri: 6, rise: -0.4, flare: 0.3, splash: 0.6 },
  { tri: -40, rise: 0.2, flare: 0.5 },
];

function coralie(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? QUEEN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#ffe6dc', { step: 8, turn: 10, sat: -10 });
  const tail = ramp('#4fc0c8', { step: 10, turn: 14, sat: -4 });
  const fin = ramp('#9fe8f0', { step: 10 });
  const hair = ramp('#9fe8d4', { step: 10, turn: 12 });
  const rise = A ? A.rise : walk ? Math.sin(TAU * q * 2) * 0.6 : breath(q) * 0.6;
  const cx = 54;
  const hy0 = (dead ? 90 : 38) - rise * 4;
  const ph = TAU * q * (walk ? 2 : 1);
  const out = [];
  // Hair: soft seafoam locks drifting up and back in the water, each a full round-ended wave
  // (never spikes), with a lighter streak along it.
  const flare = A ? A.flare : 0.3;
  for (const [dx, deg, len, c] of [[-16, 168, 9, hair.sh], [-14, -160, 10, hair.base], [-8, -128, 10, hair.base], [-18, 140, 8, hair.sh], [-2, -104, 8, hair.base]]) {
    const j = chain(cx + dx, hy0 - 4, deg - flare * 12, [len, len, len - 1, len - 2], dead ? () => 10 : wave(ph + dx * 0.2, 8 + flare * 6, 0.8));
    out.push(strand(j, (t) => 12 * (1 - t * 0.3), c), E(j.at(-1)[0], j.at(-1)[1], 4.6, 4.6, c), strand(j.slice(0, 4).map(([x, y]) => [x + 1, y + 1.6]), (t) => 3 * (1 - t * 0.5), hair.hi));
  }
  // The tail: from her hips down and round to a great fan fin on the floor behind her.
  const hip = [cx - 2, hy0 + 40];
  const tj = chain(hip[0], hip[1], 96, [12, 12, 11, 10, 9], dead ? () => 4 : (i) => (i ? 20 : 0) + Math.sin(ph - i * 0.8) * (walk ? 8 : 4));
  out.push(strand(tj, (t) => 26 - t * 18, tail.base), strand(tj.map(([x, y]) => [x - 4, y + 1]), (t) => 8 - t * 6, tail.sh));
  for (let i = 1; i < tj.length - 1; i++) for (const s of [-1, 1]) out.push(F(O(tj[i][0] + s * 3, tj[i][1], 3, 2, 0, tail.hi, 10)));
  const ft = tj.at(-1);
  const fw = Math.sin(ph) * 8;
  out.push(T([[ft[0], ft[1]], [ft[0] - 24, ft[1] - 14 + fw], [ft[0] - 16, ft[1] + 1], [ft[0] - 26, ft[1] + 12 + fw * 0.5], [ft[0] + 2, ft[1] + 6]], fin.base), F(T([[ft[0], ft[1] + 2], [ft[0] - 18, ft[1] - 6 + fw], [ft[0] - 14, ft[1] + 2]], fin.sh)));
  // A skirt of fins at her waist.
  for (let i = 0; i < 6; i++) {
    const x = cx - 14 + i * 5.6;
    const sw = Math.sin(ph + i) * 2;
    out.push(T([[x - 3, hy0 + 36], [x + 3, hy0 + 36], [x + 2 + sw, hy0 + 46], [x - 2 + sw, hy0 + 44]], i % 2 ? fin.base : fin.sh));
  }
  // A small body: shoulders, a shell bodice, short arms.
  out.push(...blob(cx, hy0 + 30, 11, 9, skin, { lit: 0.6 }));
  for (const s of [-1, 1]) out.push(O(cx + s * 5, hy0 + 28, 5, 4, s * 20, '#ff9ab8', 14), F(O(cx + s * 5, hy0 + 27, 3.4, 2.4, s * 20, '#ffc6d8', 12)));
  out.push(E(cx, hy0 + 25, 2, 2, '#f8f4ff'));
  // The head: big and round, a face with a regal little smile, the coral crown.
  out.push(...blob(cx, hy0, 22, 20, skin, { lit: 0.8 }));
  out.push(T([...arcPts(cx - 2, hy0 - 2, 23, 21, 170, 330, 16), [cx + 18, hy0 - 4], [cx + 8, hy0 - 10], [cx - 2, hy0 - 8], [cx - 12, hy0 - 2], [cx - 20, hy0 + 6]], hair.base));
  out.push(F(T(arcPts(cx - 2, hy0 - 2, 20, 18, 220, 300, 8).concat([[cx + 4, hy0 - 12]]), hair.hi)));
  out.push(...cuteFace(cx + 6, hy0 + 6, 2.6, mood, { iris: '#3ab0c8', lip: '#e0507a', gap: 5, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: skin.base, mouthDy: 3.4, lash: 1.9, wing: 2 }));
  for (const [x, h, a] of [[-12, 14, -112], [-4, 18, -96], [4, 16, -82], [12, 12, -66]]) {
    const c = chain(cx + x, hy0 - 19, a, [h / 2, h / 2], (i) => (i ? 18 : 0));
    out.push(strand(c, (t) => 4.4 * (1 - t * 0.5), '#ff6b8a'), F(E(c.at(-1)[0], c.at(-1)[1], 2, 2, '#ffb0c0')));
    const br = chain(c[1][0], c[1][1], a + 40, [4], () => 0);
    out.push(strand(br, 2, '#ff6b8a'));
  }
  out.push(E(cx - 2, hy0 - 19, 2.6, 2.6, '#f8f4ff'), F(E(cx - 2.8, hy0 - 20, 0.9, 0.9, '#ffffff')));
  // The trident in her arm: raised high on the wind-up, driven down on the strike.
  const tr = A ? A.tri : -60 + (walk ? Math.sin(ph) * 6 : sway(q) * 5);
  const sh = [cx + 10, hy0 + 28];
  const hand = [sh[0] + Math.cos((tr + 40) * D2R) * 10, sh[1] + Math.sin((tr + 40) * D2R) * 10];
  out.push(...limb(sh, hand, 4, 3.4, skin.base));
  const dir = [Math.cos(tr * D2R), Math.sin(tr * D2R)];
  const butt = [hand[0] - dir[0] * 18, hand[1] - dir[1] * 18];
  const tip = [hand[0] + dir[0] * 34, hand[1] + dir[1] * 34];
  out.push(...limb(butt, tip, 2.6, 2.6, '#e8b84a'));
  const nx = -dir[1];
  const ny = dir[0];
  for (const s of [-1, 0, 1]) {
    const bx = tip[0] + nx * s * 5;
    const by = tip[1] + ny * s * 5;
    out.push(T([[bx - nx * 1.4, by - ny * 1.4], [bx + dir[0] * (s ? 7 : 10), by + dir[1] * (s ? 7 : 10)], [bx + nx * 1.4, by + ny * 1.4]], '#ffd36b'));
  }
  out.push(...limb([tip[0] + nx * 6, tip[1] + ny * 6], [tip[0] - nx * 6, tip[1] - ny * 6], 2.4, 2.4, '#e8b84a'));
  if (A?.smear) out.push(smear([[tip[0] - 30, tip[1] - 40], [tip[0] - 10, tip[1] - 16], [tip[0] + 6, tip[1] + 6]], 10, '#e6fbff'));
  if (A?.splash) {
    const k = A.splash;
    for (let i = 0; i < 5; i++) {
      const a = -160 + i * 35;
      out.push(F(O(tip[0] + Math.cos(a * D2R) * 10 * k, Math.min(126, tip[1] + 6) + Math.sin(a * D2R) * 8 * k, 4 * k, 2.4 * k, a, '#bff4ff')));
    }
    out.push(...star(tip[0] + 6, Math.min(122, tip[1]), 6 * k, '#fff6a8'));
  }
  if (!dead) out.push(...bubbles(cx + 20, hy0 - 22, q, 3, 1.5));
  return { w: 112, h: 132, res: 3, shapes: out };
}

// ---------- The Aquarium's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) A live skeleton (render/mobs/rig.js): Coralie's hair drifts
// up in chains, her tail sways down to its fin. Rig space: the floor under her at (0, 0).
const DG = Math.PI / 180;

// Queen Coralie.
const CR = { skin: ramp('#ffe6dc', { step: 8, turn: 10, sat: -10 }), tail: ramp('#4fc0c8', { step: 10, turn: 14, sat: -4 }), fin: ramp('#9fe8f0', { step: 10 }), hair: ramp('#9fe8d4', { step: 10, turn: 12 }) };
const CR_LOCKS = [[-16, 168, 9, 'sh'], [-14, -160, 10, 'base'], [-8, -128, 10, 'base'], [-18, 140, 8, 'sh'], [-2, -104, 8, 'base']];
const crParts = {
  body: () => part('coralie|body', 30, 26, () => {
    const out = [...blob(15, 13, 11, 9, CR.skin, { lit: 0.6 })];
    for (const sd of [-1, 1]) out.push(O(15 + sd * 5, 11, 5, 4, sd * 20, '#ff9ab8', 14), F(O(15 + sd * 5, 10, 3.4, 2.4, sd * 20, '#ffc6d8', 12)));
    out.push(E(15, 8, 2, 2, '#f8f4ff'));
    return out;
  }),
  skirt: () => part('coralie|skirt', 40, 16, () => Array.from({ length: 6 }, (_, i) => T([[6 + i * 5.6 - 3, 2], [6 + i * 5.6 + 3, 2], [6 + i * 5.6 + 2, 12], [6 + i * 5.6 - 2, 10]], i % 2 ? CR.fin.base : CR.fin.sh))),
  head: () => part('coralie|head', 56, 66, () => {
    const cx = 28;
    const hy = 40;
    const out = [...blob(cx, hy, 22, 20, CR.skin, { lit: 0.8 })];
    out.push(T([...arcPts(cx - 2, hy - 2, 23, 21, 170, 330, 16), [cx + 18, hy - 4], [cx + 8, hy - 10], [cx - 2, hy - 8], [cx - 12, hy - 2], [cx - 20, hy + 6]], CR.hair.base));
    out.push(F(T(arcPts(cx - 2, hy - 2, 20, 18, 220, 300, 8).concat([[cx + 4, hy - 12]]), CR.hair.hi)));
    for (const [x, h, a] of [[-12, 14, -112], [-4, 18, -96], [4, 16, -82], [12, 12, -66]]) {
      const c = chain(cx + x, hy - 19, a, [h / 2, h / 2], (i) => (i ? 18 : 0));
      out.push(strand(c, (t) => 4.4 * (1 - t * 0.5), '#ff6b8a'), F(E(c.at(-1)[0], c.at(-1)[1], 2, 2, '#ffb0c0')));
      out.push(strand(chain(c[1][0], c[1][1], a + 40, [4], () => 0), 2, '#ff6b8a'));
    }
    out.push(E(cx - 2, hy - 19, 2.6, 2.6, '#f8f4ff'), F(E(cx - 2.8, hy - 20, 0.9, 0.9, '#ffffff')));
    return out;
  }),
  face: (mood, atk) => part(`coralie|face|${mood}|${atk}`, 32, 24, () => cuteFace(16, 9, 2.6, mood, { iris: '#3ab0c8', lip: '#e0507a', gap: 5, atk, skin: CR.skin.base, mouthDy: 3.4, lash: 1.9, wing: 2 })),
  fin: () => part('coralie|fin', 32, 30, () => [T([[28, 14], [4, 0], [12, 15], [2, 26], [30, 20]], CR.fin.base), F(T([[28, 16], [10, 8], [14, 16]], CR.fin.sh))]),
  arm: () => part('coralie|arm', 16, 8, () => [...limb([3, 4], [13, 4], 4, 3.4, CR.skin.base)]),
  trident: () => part('coralie|trident', 64, 18, () => {
    const out = [...limb([2, 9], [54, 9], 2.6, 2.6, '#e8b84a'), ...limb([54, 3], [54, 15], 2.4, 2.4, '#e8b84a')];
    for (const sd of [-1, 0, 1]) out.push(T([[54, 9 + sd * 5 - 1.4], [54 + (sd ? 7 : 10), 9 + sd * 5], [54, 9 + sd * 5 + 1.4]], '#ffd36b'));
    return out;
  }),
};
const tailShape = (i, len, w0, w1, x0, y0) => {
  const out = [...limb([x0, y0], [x0 + len, y0], w0, w1, CR.tail.base), F(limb([x0, y0 - w0 * 0.25], [x0 + len, y0 - w1 * 0.25], w0 * 0.3, w1 * 0.3, CR.tail.sh)[0])];
  for (const sd of [-1, 1]) out.push(F(O(x0 + len * 0.5, y0 + sd * 3, 3, 2, 0, CR.tail.hi, 10)));
  return out;
};
const lockShape = (c) => (i, len, w0, w1, x0, y0) => {
  const out = [...limb([x0, y0], [x0 + len, y0], w0, w1, c)];
  if (i === 2) out.push(E(x0 + len, y0, 4.6, 4.6, c));
  if (i === 0) out.push(F(limb([x0, y0 + 1.6], [x0 + len, y0 + 1.6], 3, 2.4, CR.hair.hi)[0]));
  return out;
};
const coralieRig = makeRig({
  w: 64,
  h: 124,
  stride: 50,
  fast: ['tri', 'rise', 'lean'],
  kick: { lean: -1.6, t1: 3 },
  springs: { t0: [160, 11], t1: [120, 8], t2: [90, 6], t3: [70, 5], t4: [55, 4], hair: [50, 4], skirt: [90, 6] },
  pose(m, a) {
    const t = a.t;
    const ph = a.walkW > 0.5 ? a.wp : t * 1.5;
    const amp = 4 + a.walkW * 4;
    const tb = (i) => ((i ? 20 : 0) + Math.sin(ph - i * 0.8) * amp) * DG;
    const idle = { rise: Math.sin(t * 1.6) * 2.4, lean: Math.sin(t * 1.1) * 0.04, tri: -60 * DG + Math.sin(t * 1.2) * 0.08, t0: 96 * DG + tb(0), t1: tb(1), t2: tb(2), t3: tb(3), t4: tb(4), flare: 0.3 };
    const antic = { rise: 4, lean: -0.12, tri: -150 * DG, t0: 100 * DG, t1: 26 * DG, t2: 26 * DG, t3: 22 * DG, t4: 20 * DG, flare: 1 };
    const strike = { rise: -2, lean: 0.12, tri: 10 * DG, t0: 92 * DG, t1: 14 * DG, t2: 18 * DG, t3: 20 * DG, t4: 22 * DG, flare: 0.2 };
    return stateBlend(a, idle, idle, antic, strike);
  },
  follow: (S, a) => ({ hair: -S.lean * 1.5 - S.flare * 0.2 + Math.sin(a.t * 1.3) * 0.12, skirt: -S.lean * 1.1 }),
  parts: [
    { name: 'root', at: (S) => [0, -54 - S.rise], rot: (S) => S.lean },
    ...CR_LOCKS.flatMap(([dx, deg, len, c], j) => chainParts(`lock${j}`, {
      parent: 'root', at: () => [dx, -44], key: `coralie|lock|${len}|${c}`,
      segs: [[len, 12, 10.8], [len, 10.8, 9.6], [len - 1, 9.6, 8.4]],
      shape: lockShape(CR.hair[c]),
      rot: (S, a, k) => (k ? (8 + 6 * Math.sin(a.t * 1.6 + j + k)) * DG : deg * DG - S.flare * 12 * DG + S.hair),
    })),
    ...chainParts('tail', { parent: 'root', at: () => [-2, 0], key: 'coralie|tail', segs: [[12, 26, 22.4], [12, 22.4, 18.8], [11, 18.8, 15.2], [10, 15.2, 11.6], [9, 11.6, 8]], shape: tailShape, rot: (S, a, k) => S[`t${k}`] - (k ? 0 : S.lean) }),
    { name: 'fin', parent: 'tail4', pivot: [28, 14], at: () => [9, 0], rot: (S) => -(S.t0 + S.t1 + S.t2 + S.t3 + S.t4) + S.lean + Math.sin(S.t4 * 3) * 0.3, s: () => crParts.fin() },
    { name: 'skirt', parent: 'root', pivot: [20, 2], at: () => [0, -4], rot: (S) => S.skirt, s: () => crParts.skirt() },
    { name: 'body', parent: 'root', pivot: [15, 13], at: () => [0, -10], s: () => crParts.body() },
    // (The trident passes behind the head, so it never crosses the face in a swing.)
    { name: 'arm', parent: 'body', pivot: [3, 4], at: () => [10, -2], rot: (S) => S.tri + 40 * DG, s: () => crParts.arm() },
    { name: 'trident', parent: 'arm', pivot: [20, 9], at: () => [10, 0], rot: (S) => -40 * DG, s: () => crParts.trident() },
    { name: 'head', parent: 'body', pivot: [28, 40], at: () => [0, -30], rot: (S, a) => Math.sin(a.t * 1.2) * 0.04, s: () => crParts.head() },
    { name: 'face', parent: 'head', pivot: [16, 9], at: () => [6, 0], s: (a) => crParts.face(a.face, a.atk) },
  ],
  fx(ctx, m, a) {
    // The burst of sea where the trident is driven down.
    if (a.ph.since >= 0 && a.ph.since < 0.5) {
      const u = a.ph.since / 0.5;
      ctx.globalAlpha = a.alpha * (1 - u);
      ctx.fillStyle = '#bff4ff';
      for (let i = 0; i < 6; i++) {
        const ang = (-160 + i * 30) * DG;
        ctx.beginPath();
        ctx.ellipse(44 + Math.cos(ang) * 14 * (0.5 + u), -4 + Math.sin(ang) * 10 * (0.5 + u), 3.6 * (1 - u) + 1, 2, ang, 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  moraymurri: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: morayStill('murri'), rig: murriRig },
  morayena: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: morayStill('ena'), rig: enaRig },
  abyssia: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [100, 200, 300, 240], draw: abyssiaStill, rig: abyssiaRig },
  coralie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [110, 180, 300, 240], draw: coralie, rig: coralieRig },
};

export const INFO = {
  moraymurri: { name: 'Murri, the Twin Moray', w: 56, h: 96 },
  morayena: { name: 'Ena, the Twin Moray', w: 56, h: 96 },
  abyssia: { name: 'Lady Abyssia, the Sea Witch', w: 80, h: 100 },
  coralie: { name: 'Queen Coralie, the Drowned Queen', w: 64, h: 124 },
};
