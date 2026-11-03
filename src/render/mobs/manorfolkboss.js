// Monster art: the Moonlit Manor's bosses (docs/design/moonlit-manor.md), redrawn creature-first
// and big (2026-11-03): chibi at two and a half to three times the hero's height, each with one
// signature shape.
//   waltzrondo    Dame Rondo, the Leading Armour: a tall slim suit of armour, a great round helm
//                 with a sweeping plume and glowing eyes, a rapier; bows, then lunges.
//   waltzminuet   Dame Minuet, the Following Armour: a wide bell-skirted armour like a ballgown of
//                 steel lames, a tiara helm and a fan-shield; she twirls and the skirt slices.
//   velvet        Madame Velvet, the Head Housekeeper: a plump plum ghost in a mob cap and
//                 half-moon spectacles, a chatelaine of keys at her waist; she hurls plates.
//   marigold      Lady Marigold, the Eternal Hostess: a giant marigold blossom spirit, her face in
//                 the flower, a gown of petals, a moon tiara and a lace fan; she sweeps a storm of
//                 petals.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// A great armour helm: a round bucket with a visor slit and two glowing eyes.
function helm(x, y, r, steel, mood, atk, plume) {
  const s = [...blob(x, y, r, r * 0.95, steel)];
  s.push(R(x - r * 0.1, y - r * 0.18, r * 1.08, r * 0.36, '#2a2440'));
  const glow = mood === 'dead' ? '#5a5070' : atk ? '#ff6a8a' : '#7ff0ff';
  if (mood === 'blink') s.push(F(R(x + r * 0.2, y - 0.4, r * 0.7, 0.8, glow)));
  else s.push(F(E(x + r * 0.28, y, r * 0.13, r * 0.11, glow)), F(E(x + r * 0.72, y, r * 0.13, r * 0.11, glow)));
  for (let i = 0; i < 4; i++) s.push(F(R(x + r * 0.05 + i * r * 0.26, y + r * 0.42, r * 0.09, r * 0.3, steel.sh)));
  s.push(F(R(x - r, y - r * 0.6, r * 2, r * 0.1, steel.hi)));
  if (plume) for (let i = 0; i < 4; i++) s.push(strand(chain(x - r * 0.2, y - r * 0.9, -120 - i * 12, [r * 0.3, r * 0.3, r * 0.3, r * 0.26], plume.bend(i)), (t) => r * 0.28 * (1 - t * 0.5), i % 2 ? plume.c : plume.c2));
  return s;
}

// ---------- Dame Rondo ----------

const RONDO_ATK = [
  { lean: -14, sword: -170, crouch: 4 },
  { lean: 18, sword: -6, crouch: -2, reach: 14, smear: 1 },
  { lean: 22, sword: -2, crouch: -2, reach: 18, hit: 1 },
  { lean: 18, sword: -4, crouch: -1, reach: 16 },
  { lean: 2, sword: -60, crouch: 0, reach: 2 },
];

function rondo(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? RONDO_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const steel = ramp('#c4cce0', { step: 12, turn: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 48 + (A?.reach ?? 0) * 0.4;
  const cy = (dead ? 30 : 0) + (A ? A.crouch : walk ? Math.abs(step) * -1.4 : breath(q) * -1);
  const lean = dead ? 86 : A ? A.lean : walk ? step * 3 : sway(q) * 2;
  const out = [];
  const body = [];
  // Long armoured legs in a waltz step.
  for (const [ox, s, c] of [[-6, step, steel.sh], [6, -step, steel.base]]) {
    const foot = [cx + ox + s * 8, 104 - Math.max(0, s) * 4];
    body.push(...limb([cx + ox, cy + 66], [cx + ox + s * 3, cy + 84], 7, 6, c), ...limb([cx + ox + s * 3, cy + 84], foot, 6, 5, c), O(foot[0] + 3, foot[1] + 0.4, 6, 2.6, 0, c, 14), F(E(cx + ox + s * 3, cy + 84, 3.4, 3.4, steel.hi)));
  }
  // The torso: a tall breastplate with a sash and a cape swinging behind.
  const cape = chain(cx - 10, cy + 40, 110, [12, 12, 10], wave(TAU * q * 2, walk ? 10 : 5, 0.8));
  body.push(T([[cx - 12, cy + 38], ...cape.map(([x, y], i) => [x - i * 4, y]), [cape.at(-1)[0] + 12, cape.at(-1)[1] + 4], [cx - 4, cy + 60]], '#5a3a9a'));
  body.push(...blob(cx, cy + 52, 14, 16, steel), F(T([[cx - 12, cy + 42], [cx - 8, cy + 40], [cx + 12, cy + 62], [cx + 8, cy + 64]], '#9a5ad8')));
  for (let i = 0; i < 2; i++) body.push(R(cx - 13 + i, cy + 64 + i * 3, 26 - i * 2, 3, i ? steel.sh : steel.base));
  body.push(...helm(cx + 2, cy + 26, 17, steel, mood, A && f >= 1 && f <= 3, { c: '#ff6b8a', c2: '#ffb0c8', bend: (i) => wave(TAU * q * 2 + i, 12, 0.8) }));
  // The rapier: raised in the salute on the wind-up, a long lunge on the strike.
  const sa = A ? A.sword : walk ? -40 + step * 6 : -40;
  const hand = [cx + 14 + (A?.reach ?? 0), cy + 48];
  const tip = [hand[0] + Math.cos(sa * D2R) * 40, hand[1] + Math.sin(sa * D2R) * 40];
  body.push(...limb([cx + 8, cy + 42], hand, 6, 5, steel.base), ...limb(hand, tip, 1.8, 1, '#eef4ff'), O(hand[0], hand[1], 4, 3, sa + 90, '#e8b84a'));
  out.push(...spin(body, cx, 104, lean));
  if (A?.smear) out.push(smear([[hand[0] - 30, hand[1] - 30], [hand[0] - 4, hand[1] - 6], [tip[0] + 4, tip[1]]], 8, '#eef4ff'));
  if (A?.hit) out.push(...star(tip[0] + 4, tip[1], 6, '#fff6a8'));
  return { w: 112, h: 108, res: 3, shapes: out };
}

// ---------- Dame Minuet ----------

const MINUET_ATK = [
  { spin: -30, rise: 2 },
  { spin: 160, rise: -2, smear: 1 },
  { spin: 340, rise: -2, hit: 1 },
  { spin: 360, rise: -1 },
  { spin: 360, rise: 0 },
];

function minuet(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MINUET_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const steel = ramp('#d8d0f0', { step: 12, turn: 12 });
  const gold = '#e8b84a';
  const twirl = A ? A.spin : walk ? Math.sin(TAU * q * 2) * 20 : sway(q) * 8;
  const cx = 52;
  const cy = (dead ? 30 : 0) - (A ? A.rise : breath(q));
  const out = [];
  // The hoop skirt of steel lames: tiers that fan out as she twirls (seen as their edges sliding).
  const flare = A ? 6 : 0;
  for (let i = 0; i < 4; i++) {
    const w = 16 + i * 8 + flare;
    const y = cy + 58 + i * 11;
    out.push(T([[cx - w + 4, y], [cx + w - 4, y], [cx + w + 2, y + 11], [cx - w - 2, y + 11]], i % 2 ? steel.base : steel.hi), F(T([[cx + w - 8, y], [cx + w - 4, y], [cx + w + 2, y + 11], [cx + w - 4, y + 11]], steel.sh)));
    for (let k = 0; k < 6; k++) {
      const x = cx - w + ((k + twirl / 60) % 6 + 6) % 6 * (w * 2 / 6);
      out.push(F(R(x, y + 1, 1, 9, steel.sh)));
    }
    out.push(F(R(cx - w - 2, y + 10, w * 2 + 4, 1.4, gold)));
  }
  // The bodice and the fan-shield on her arm.
  out.push(...blob(cx, cy + 50, 12, 12, steel), F(O(cx + 2, cy + 50, 4, 8, 0, '#ff9ac8', 14)));
  const fa = A ? Math.min(1, Math.abs(A.spin) / 180) : 0;
  const fx = cx + 18;
  const fy = cy + 50 - fa * 6;
  out.push(...limb([cx + 8, cy + 46], [fx, fy], 5, 4, steel.base), T([[fx, fy], ...arcPts(fx, fy, 18, 18, -100 - fa * 30, 10, 10)], '#fff0f8'));
  for (let i = 0; i < 6; i++) out.push(F(T([[fx, fy], ...arcPts(fx, fy, 18, 18, -100 - fa * 30 + i * (110 + fa * 30) / 6, -92 - fa * 30 + i * (110 + fa * 30) / 6, 2)], '#ffc6e2')));
  // The tiara helm.
  out.push(...helm(cx + 2, cy + 28, 15, steel, mood, A && f >= 1 && f <= 3, null));
  for (let i = 0; i < 5; i++) out.push(T([[cx - 8 + i * 4, cy + 14], [cx - 6 + i * 4, cy + 8 - (i === 2 ? 4 : 0)], [cx - 4 + i * 4, cy + 14]], gold));
  out.push(F(E(cx + 2, cy + 6, 1.8, 1.8, '#ff6b9a')));
  if (A?.smear) out.push(smear(arcPts(cx, cy + 90, 50, 14, -20, 160, 12), 8, '#f4eeff'));
  if (A?.hit) out.push(...star(cx + 52, cy + 92, 6, '#fff6a8'));
  return { w: 116, h: 110, res: 3, shapes: dead ? spin(out, cx, 108, 0) : out };
}

// ---------- Madame Velvet ----------

const VELVET_ATK = [
  { arm: -160, lean: -10 },
  { arm: -20, lean: 12, smear: 1, plate: 1 },
  { arm: 10, lean: 12, plate: 2, hit: 1 },
  { arm: 0, lean: 10, plate: 2.6 },
  { arm: -60, lean: 0 },
];

function velvet(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? VELVET_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const plum = ramp('#9a5aa8', { step: 10, turn: 12 });
  const ghost = ramp('#f0e8ff', { step: 9, turn: 12 });
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 2.4 : -breath(q) * 2;
  const cx = 50;
  const cy = (dead ? 70 : 52) + bob;
  const lean = dead ? 86 : A ? A.lean : walk ? 8 : sway(q) * 3;
  const out = [];
  const body = [];
  // A wispy ghost tail trailing to the floor.
  const tail = chain(cx - 6, cy + 30, 120, [8, 8, 7, 6], dead ? () => 6 : wave(TAU * q * 2, 18, 0.8));
  body.push(strand(tail, (t) => 22 * (1 - t * 0.85), plum.base));
  // The plump body in plum velvet, a white apron, the chatelaine of keys swinging.
  body.push(...blob(cx, cy + 18, 24, 20, plum));
  body.push(T([[cx - 4, cy + 4], [cx + 18, cy + 4], [cx + 20, cy + 32], [cx, cy + 34]], '#ffffff'), F(T([[cx + 14, cy + 4], [cx + 18, cy + 4], [cx + 20, cy + 32], [cx + 16, cy + 32]], '#e8e0f4')));
  const ks = Math.sin(TAU * q * 2) * 10;
  const kc = chain(cx - 8, cy + 14, 90 + ks, [6, 6], () => 0);
  body.push(strand(kc, 1, '#e8b84a'));
  for (let i = 0; i < 3; i++) body.push(...limb([kc.at(-1)[0] + (i - 1) * 3, kc.at(-1)[1]], [kc.at(-1)[0] + (i - 1) * 4, kc.at(-1)[1] + 6], 1.2, 1, '#e8b84a'), E(kc.at(-1)[0] + (i - 1) * 4, kc.at(-1)[1] + 7, 1.6, 1.6, '#e8b84a'));
  // The head: a round ghost face, half-moon spectacles, a frilly mob cap, a stern little mouth.
  const hx = cx + 4;
  const hy = cy - 12;
  body.push(...blob(hx, hy, 18, 16, ghost));
  body.push(T([...arcPts(hx - 1, hy - 4, 20, 14, 180, 360, 16)], '#ffffff'));
  for (let i = 0; i < 10; i++) body.push(E(hx - 20 + i * 4.2, hy - 4, 2.6, 2, '#ffffff'));
  body.push(F(R(hx - 18, hy - 5, 36, 1.6, '#ff8ab8')));
  body.push(...cuteFace(hx + 4, hy + 4, 2.2, mood, { iris: '#7a3aa8', gap: 5.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: ghost.base, mouthDy: 3.6, lash: 1.6 }));
  for (const ex of [hx - 2, hx + 10]) body.push(F(T([...arcPts(ex, hy + 4, 4.6, 3, 0, 180, 8), ...arcPts(ex, hy + 4, 3.6, 2, 180, 0, 8)], '#c8902a')));
  body.push(F(R(hx + 2, hy + 3.4, 4, 0.8, '#c8902a')));
  // The plate arm: drawn back for the wind-up, a plate spinning out of her hand on the throw.
  const arm = A ? A.arm : walk ? -60 + Math.sin(TAU * q * 2) * 8 : -60;
  const sh = [cx + 16, cy + 10];
  const hand = [sh[0] + Math.cos(arm * D2R) * 14, sh[1] + Math.sin(arm * D2R) * 14];
  body.push(...limb(sh, hand, 7, 6, plum.base));
  const plateAt = (x, y, r) => [O(x, y, r, r * 0.4, 0, '#ffffff', 18), F(O(x, y, r * 0.6, r * 0.24, 0, '#d0e8ff', 14)), F(O(x, y, r, r * 0.4, 0, '#ffffff', 18)), F(T([...arcPts(x, y, r, r * 0.4, 20, 160, 8), ...arcPts(x, y, r * 0.86, r * 0.32, 160, 20, 8)], '#4f7ad8'))];
  if (!A?.plate) body.push(...plateAt(hand[0], hand[1] - 2, 8));
  out.push(...spin(body, cx, cy + 20, lean));
  if (A?.smear) out.push(smear([[cx, cy - 30], [cx + 24, cy - 16], [cx + 40, cy + 6]], 8, '#f4eeff'));
  if (A?.plate) out.push(...plateAt(cx + 30 + A.plate * 12, cy + 10 + A.plate * 6, 8));
  if (A?.hit) out.push(...star(cx + 56, cy + 26, 6, '#fff6a8'), F(T([[cx + 50, cy + 30], [cx + 54, cy + 34], [cx + 49, cy + 36]], '#ffffff')), F(T([[cx + 60, cy + 30], [cx + 64, cy + 33], [cx + 59, cy + 36]], '#d0e8ff')));
  return { w: 112, h: 110, res: 3, shapes: out };
}

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

export const ART = {
  waltzrondo: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 160, 300, 220], draw: rondo },
  waltzminuet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 200, 300, 220], draw: minuet },
  velvet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: velvet },
  marigold: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 180, 340, 240], draw: marigold },
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Leading Armour', w: 60, h: 104 },
  waltzminuet: { name: 'Dame Minuet, the Following Armour', w: 70, h: 104 },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: 70, h: 100 },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: 70, h: 110 },
};
