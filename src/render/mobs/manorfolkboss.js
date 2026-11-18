// Monster art: the Moonlit Manor's bosses (docs/design/moonlit-manor.md).
//   waltzrondo    Dame Rondo, the Leading Armour (manorbossrigs.js, remade 2026-11-18)
//   waltzminuet   Dame Minuet, the Following Armour (manorbossrigs.js, remade 2026-11-18)
//   velvet        Madame Velvet, the Head Housekeeper (manorbossrigs.js, remade 2026-11-18)
//   marigold      Lady Marigold, the Eternal Hostess: a giant marigold blossom spirit, her face in
//                 the flower, a gown of petals, a moon tiara and a lace fan; she sweeps a storm of
//                 petals.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { part, makeRig, stateBlend, inPart } from './rig.js';
import { rondoRig, rondoStill, minuetRig, minuetStill, velvetRig, velvetStill } from './manorbossrigs.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// ---------- Lady Marigold ----------

const MARIGOLD_ATK = [
  { fan: -60, lean: -8, storm: 0 },
  { fan: 40, lean: 10, storm: 0.6, smear: 1 },
  { fan: 60, lean: 12, storm: 1.2, hit: 1 },
  { fan: 50, lean: 10, storm: 1.4 },
  { fan: 0, lean: 0, storm: 0.3 },
];

function marigold(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MARIGOLD_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const petal = ramp('#ffb03a', { step: 10, turn: 10 });
  const petal2 = ramp('#ff8a2a', { step: 10, turn: 10 });
  const skin = ramp('#fff2e0', { step: 8 });
  const stem = ramp('#6fc06a', { step: 10 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 2 : -breath(q) * 2;
  const cx = 56;
  const cy = (dead ? 76 : 48) + bob;
  const lean = dead ? 80 : A ? A.lean : walk ? 6 : sway(q) * 3;
  const out = [];
  const body = [];
  // The petal gown: layered rows of marigold petals flaring down to a wispy hem off the floor.
  for (let row = 0; row < 4; row++) {
    const y = cy + 26 + row * 12;
    const w = 14 + row * 7;
    for (let i = 0; i < 6 + row; i++) {
      const x = cx - w + (i * (w * 2)) / (5 + row);
      const sw = Math.sin(TAU * q * 2 + i + row) * 1.4;
      body.push(O(x + sw, y + 6, 4.4, 8, (x - cx) * 0.8, row % 2 ? petal.base : petal2.base, 14));
    }
  }
  body.push(...blob(cx, cy + 22, 12, 9, stem));
  for (const s of [-1, 1]) body.push(O(cx + s * 12, cy + 26, 9, 3, s * 30, stem.base, 14), F(O(cx + s * 12, cy + 25, 6, 1, s * 30, stem.hi, 12)));
  // The head: a giant marigold blossom, two rings of ruffled petals round her round face.
  const hx = cx + 2;
  const hy = cy - 8;
  for (const [r, n, c, off] of [[26, 16, petal2, 0], [20, 14, petal, 0.5]]) {
    for (let i = 0; i < n; i++) {
      const a = ((i + off) / n) * TAU + Math.sin(TAU * q) * 0.05;
      body.push(O(hx + Math.cos(a) * r * 0.78, hy + Math.sin(a) * r * 0.72, r * 0.3, r * 0.18, (a * 180) / Math.PI, i % 2 ? c.base : c.hi, 12), F(O(hx + Math.cos(a) * r * 0.86, hy + Math.sin(a) * r * 0.8, r * 0.1, r * 0.06, (a * 180) / Math.PI, c.sh, 8)));
    }
  }
  body.push(...blob(hx, hy, 15, 14, skin));
  body.push(...cuteFace(hx + 2, hy + 1, 2.3, mood, { iris: '#ff8a2a', lip: '#c05a3a', gap: 5.4, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: skin.base, mouthDy: 3.6, lash: 1.9, wing: 2 }));
  body.push(T([[hx - 6, hy - 14], [hx - 2, hy - 24], [hx + 6, hy - 14]], '#fff6c8'), F(T([...arcPts(hx - 1, hy - 19, 4, 4, 100, 320, 8), ...arcPts(hx + 0.4, hy - 19.6, 3, 3, 320, 100, 8)], '#ffd36b')));
  // The lace fan in her leaf hand: fanned out and swept on the attack.
  const fa = A ? A.fan : walk ? Math.sin(TAU * q * 2) * 10 : sway(q) * 8;
  const fx = cx + 20;
  const fy = cy + 16;
  const fan = [T([[fx, fy], ...arcPts(fx, fy, 16, 16, -110 + fa, -10 + fa, 10)], '#ffffff')];
  for (let i = 0; i < 6; i++) fan.push(F(E(fx + Math.cos((-104 + fa + i * 17) * D2R) * 13, fy + Math.sin((-104 + fa + i * 17) * D2R) * 13, 1.4, 1.4, '#ffd6a8')));
  body.push(...limb([cx + 10, cy + 20], [fx, fy], 4, 3.4, stem.base), ...fan);
  out.push(...spin(body, cx, cy + 20, lean));
  if (A?.smear) out.push(smear(arcPts(cx + 20, cy + 16, 30, 26, -100, 40, 12), 8, '#fff0d8'));
  if (A?.storm) for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + q * TAU;
    const r = 18 + A.storm * 16 + (i % 3) * 4;
    out.push(O(cx + 40 + Math.cos(a) * r * 0.6, cy + 30 + Math.sin(a) * r * 0.5, 3, 1.6, a * 60, i % 2 ? '#ffb03a' : '#ff8a2a', 10));
  }
  if (A?.hit) out.push(...star(cx + 56, cy + 30, 6, '#fff6a8'));
  return { w: 118, h: 116, res: 3, shapes: out };
}

// ---------- Lady Marigold, rigged ----------
// (2026-11-03, the boss reanimation.) Cut into parts on a skeleton and posed live
// (render/mobs/rig.js): her petal gown ripples row by row and her blossom head sways. Rig space:
// the floor under her at (0, 0), facing right.


// Lady Marigold.
const MG = { petal: ramp('#ffb03a', { step: 10, turn: 10 }), petal2: ramp('#ff8a2a', { step: 10, turn: 10 }), skin: ramp('#fff2e0', { step: 8 }), stem: ramp('#6fc06a', { step: 10 }) };
const mgParts = {
  row: (row) => part(`marigold|row|${row}`, 80, 22, () => {
    const out = [];
    const w = 14 + row * 7;
    for (let i = 0; i < 6 + row; i++) {
      const x = 40 - w + (i * (w * 2)) / (5 + row);
      out.push(O(x, 10, 4.4, 8, (x - 40) * 0.8, row % 2 ? MG.petal.base : MG.petal2.base, 14));
    }
    return out;
  }),
  bodice: () => part('marigold|bodice', 50, 24, () => {
    const out = [...blob(25, 10, 12, 9, MG.stem)];
    for (const sd of [-1, 1]) out.push(O(25 + sd * 12, 14, 9, 3, sd * 30, MG.stem.base, 14), F(O(25 + sd * 12, 13, 6, 1, sd * 30, MG.stem.hi, 12)));
    return out;
  }),
  bloom: () => part('marigold|bloom', 60, 58, () => {
    const out = [];
    for (const [r, n, c, off] of [[26, 16, MG.petal2, 0], [20, 14, MG.petal, 0.5]]) {
      for (let i = 0; i < n; i++) {
        const ang = ((i + off) / n) * TAU;
        out.push(O(30 + Math.cos(ang) * r * 0.78, 30 + Math.sin(ang) * r * 0.72, r * 0.3, r * 0.18, (ang * 180) / Math.PI, i % 2 ? c.base : c.hi, 12), F(O(30 + Math.cos(ang) * r * 0.86, 30 + Math.sin(ang) * r * 0.8, r * 0.1, r * 0.06, (ang * 180) / Math.PI, c.sh, 8)));
      }
    }
    return out;
  }),
  face: (mood, atk) => part(`marigold|face|${mood}|${atk}`, 34, 34, () => [
    ...blob(17, 18, 15, 14, MG.skin),
    ...cuteFace(19, 19, 2.3, mood, { iris: '#ff8a2a', lip: '#c05a3a', gap: 5.4, atk, skin: MG.skin.base, mouthDy: 3.6, lash: 1.9, wing: 2 }),
  ]),
  tiara: () => part('marigold|tiara', 16, 14, () => [T([[3, 12], [7, 2], [15, 12]], '#fff6c8'), F(T([...arcPts(8, 7, 4, 4, 100, 320, 8), ...arcPts(9.4, 6.4, 3, 3, 320, 100, 8)], '#ffd36b'))]),
  arm: () => part('marigold|arm', 16, 8, () => [...limb([3, 4], [13, 4], 4, 3.4, MG.stem.base)]),
  fan: () => part('marigold|fan', 22, 22, () => {
    const out = [T([[4, 18], ...arcPts(4, 18, 16, 16, -110, -10, 10)], '#ffffff')];
    for (let i = 0; i < 6; i++) out.push(F(E(4 + Math.cos((-104 + i * 17) * D2R) * 13, 18 + Math.sin((-104 + i * 17) * D2R) * 13, 1.4, 1.4, '#ffd6a8')));
    return out;
  }),
};
const marigoldRig = makeRig({
  w: 70,
  h: 110,
  stride: 60,
  fast: ['fan', 'lean'],
  kick: { lean: -1.6, bloom: 3, r0: 3 },
  springs: { r0: [110, 7], r1: [90, 6], r2: [75, 5], r3: [60, 4.5], bloom: [80, 6] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.1) * 0.05, y: Math.sin(t * 1.6) * 2, fan: -0.3 + Math.sin(t * 1.4) * 0.14, head: Math.sin(t * 1.2) * 0.07 };
    const walk = { lean: 0.1, y: Math.sin(a.wp * 2) * 2, fan: -0.3 + s * 0.2, head: s * 0.05 };
    const antic = { lean: -0.14, y: 1, fan: -1.3, head: -0.12 };
    const strike = { lean: 0.2, y: -1, fan: 1.1, head: 0.1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ r0: -S.lean * 0.6, r1: -S.lean * 0.9, r2: -S.lean * 1.2, r3: -S.lean * 1.5, bloom: S.head - S.lean * 0.5 }),
  parts: [
    { name: 'root', at: (S) => [0, -53 + S.y - Math.min(9, (S.lean + S.r3) ** 2 * 160 + S.lean ** 2 * 60)], rot: (S) => S.lean },
    { name: 'r0', parent: 'root', pivot: [40, 4], at: () => [0, 2], rot: (S) => S.r0, s: () => mgParts.row(0) },
    { name: 'r1', parent: 'r0', pivot: [40, 4], at: () => [0, 12], rot: (S) => S.r1 - S.r0, s: () => mgParts.row(1) },
    { name: 'r2', parent: 'r1', pivot: [40, 4], at: () => [0, 12], rot: (S) => S.r2 - S.r1, s: () => mgParts.row(2) },
    { name: 'r3', parent: 'r2', pivot: [40, 4], at: () => [0, 12], rot: (S) => S.r3 - S.r2, s: () => mgParts.row(3) },
    { name: 'bodice', parent: 'root', pivot: [25, 10], at: () => [0, 0], s: () => mgParts.bodice() },
    { name: 'bloom', parent: 'bodice', pivot: [30, 30], at: () => [2, -30], rot: (S) => S.bloom, s: () => mgParts.bloom() },
    { name: 'face', parent: 'bloom', pivot: [17, 18], at: () => [0, 0], rot: (S) => S.head - S.bloom, s: (a) => mgParts.face(a.face, a.atk) },
    { name: 'tiara', parent: 'face', pivot: [8, 12], at: () => [-1, -14], s: () => mgParts.tiara() },
    { name: 'arm', parent: 'bodice', pivot: [3, 4], at: () => [10, -2], rot: (S) => S.fan * 0.35 - 0.3, s: () => mgParts.arm() },
    { name: 'fan', parent: 'arm', pivot: [4, 18], at: () => [11, 0], rot: (S) => S.fan, s: () => mgParts.fan() },
  ],
  fx(ctx, m, a) {
    // The storm of petals off the fan's sweep.
    if (a.ph.since >= 0 && a.ph.since < 0.7) {
      const u = a.ph.since / 0.7;
      for (let i = 0; i < 9; i++) {
        const ang = (i / 9) * TAU + u * 5;
        const r = 18 + u * 26 + (i % 3) * 4;
        ctx.globalAlpha = a.alpha * (1 - u);
        ctx.fillStyle = i % 2 ? '#ffb03a' : '#ff8a2a';
        ctx.beginPath();
        ctx.ellipse(40 + Math.cos(ang) * r * 0.6, -49 + Math.sin(ang) * r * 0.5, 3, 1.6, ang, 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  waltzrondo: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 160, 300, 220], draw: rondoStill, rig: rondoRig },
  waltzminuet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 200, 300, 220], draw: minuetStill, rig: minuetRig },
  velvet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: velvetStill, rig: velvetRig },
  marigold: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 180, 340, 240], draw: marigold, rig: marigoldRig },
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Leading Armour', w: 60, h: 104 },
  waltzminuet: { name: 'Dame Minuet, the Following Armour', w: 70, h: 104 },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: 70, h: 100 },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: 70, h: 110 },
};
