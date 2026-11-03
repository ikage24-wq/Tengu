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
import { part, makeRig, stateBlend, inPart } from './rig.js';

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

// ---------- The Manor's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) Each is cut into parts on a skeleton and posed live
// (render/mobs/rig.js): Rondo's legs bend at the knee in a waltz step, her cape and plume trail;
// Minuet's skirt is four tiers hung one from the next, so it ripples down; Velvet floats with her
// keys swinging and throws a real spinning plate; Marigold's petal gown ripples row by row and her
// blossom head sways. Rig space: feet (or the floor under a floater) at (0, 0), facing right.

const STEEL = ramp('#c4cce0', { step: 12, turn: 10 });
const STEEL2 = ramp('#d8d0f0', { step: 12, turn: 12 });
const D = Math.PI / 180;

// Dame Rondo.
const rdParts = {
  thigh: (back) => part(`rondo|thigh|${back}`, 14, 24, () => [...limb([7, 3], [7, 20], 7, 6, back ? STEEL.sh : STEEL.base), F(E(7, 20, 3.4, 3.4, STEEL.hi))]),
  shin: (back) => part(`rondo|shin|${back}`, 22, 26, () => {
    const c = back ? STEEL.sh : STEEL.base;
    return [...limb([7, 3], [7, 21], 6, 5, c), O(10, 21.6, 6, 2.6, 0, c, 14)];
  }),
  cape: () => part('rondo|cape', 34, 40, () => {
    const cape = chain(26, 3, 110, [12, 12, 10], () => 0);
    return [T([[24, 1], ...cape.map(([x, y], i) => [x - i * 4, y]), [cape.at(-1)[0] + 12, cape.at(-1)[1] + 4], [32, 23]], '#5a3a9a')];
  }),
  torso: () => part('rondo|torso', 34, 36, () => [...blob(17, 14, 14, 16, STEEL), F(T([[5, 4], [9, 2], [29, 24], [25, 26]], '#9a5ad8')), R(4, 26, 26, 3, STEEL.base), R(5, 29, 24, 3, STEEL.sh)]),
  helm: (mood, atk) => part(`rondo|helm|${mood}|${atk}`, 40, 40, () => helm(20, 22, 17, STEEL, mood, atk, null)),
  plume: () => part('rondo|plume', 30, 30, () => Array.from({ length: 4 }, (_, i) => strand(chain(24, 26, -120 - i * 12, [5, 5, 5, 4.4], () => 4), (t) => 4.8 * (1 - t * 0.5), i % 2 ? '#ff6b8a' : '#ffb0c8'))),
  arm: () => part('rondo|arm', 14, 10, () => [...limb([3, 5], [11, 5], 6, 5, STEEL.base)]),
  rapier: () => part('rondo|rapier', 48, 10, () => [...limb([3, 5], [44, 5], 1.8, 1, '#eef4ff'), O(3, 5, 4, 3, 90, '#e8b84a', 12), F(R(6, 4.4, 30, 0.6, '#ffffff'))]),
};
const rondoRig = makeRig({
  w: 60,
  h: 104,
  stride: 52,
  fast: ['lean', 'sword', 'reach', 'crouch'],
  kick: { lean: -2, plume: 4 },
  springs: { cape: [50, 4], plume: [70, 5] },
  pose(m, a) {
    const t = a.t;
    const b = Math.sin(t * 2.2);
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.1) * 0.03, crouch: -b * 0.8, reach: 0, sword: -40 * D, thighF: 0.05, thighB: -0.05, shinF: 0, shinB: 0, head: Math.sin(t * 1.4) * 0.04 };
    const walk = { lean: s * 0.05, crouch: -Math.abs(s) * 1.4, reach: 0, sword: (-40 + s * 6) * D, thighF: -s * 0.45, thighB: s * 0.45, shinF: Math.max(0, s) * 0.5, shinB: Math.max(0, -s) * 0.5, head: -s * 0.04 };
    // The salute: rapier swept up past her helm, leaning back on a bent knee...
    const antic = { lean: -14 * D, crouch: 4, reach: -2, sword: -170 * D, thighF: -0.25, thighB: 0.35, shinF: 0.5, shinB: 0.2, head: -0.1 };
    // ...then the long lunge.
    const strike = { lean: 20 * D, crouch: -2, reach: 16, sword: -4 * D, thighF: -0.8, thighB: 0.55, shinF: 0.4, shinB: 0, head: 0.08 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ cape: -S.lean * 1.2 - S.reach * 0.02, plume: -S.lean * 0.9 }),
  parts: [
    { name: 'root', at: (S) => [S.reach * 0.5, 0], rot: (S) => S.lean },
    { name: 'cape', parent: 'root', pivot: [24, 1], at: (S) => [-10, -64 + S.crouch], rot: (S) => S.cape, s: () => rdParts.cape() },
    { name: 'thighB', parent: 'root', pivot: [7, 3], at: (S) => [-6, -38 + S.crouch], rot: (S) => S.thighB, s: () => rdParts.thigh(true) },
    { name: 'shinB', parent: 'thighB', pivot: [7, 3], at: () => [0, 17], rot: (S) => S.shinB, s: () => rdParts.shin(true) },
    { name: 'thighF', parent: 'root', pivot: [7, 3], at: (S) => [6, -38 + S.crouch], rot: (S) => S.thighF, s: () => rdParts.thigh(false) },
    { name: 'shinF', parent: 'thighF', pivot: [7, 3], at: () => [0, 17], rot: (S) => S.shinF, s: () => rdParts.shin(false) },
    { name: 'torso', parent: 'root', pivot: [17, 28], at: (S) => [0, -38 + S.crouch], s: () => rdParts.torso() },
    { name: 'plume', parent: 'torso', pivot: [24, 26], at: () => [-2, -40], rot: (S) => S.plume, s: () => rdParts.plume() },
    { name: 'helm', parent: 'torso', pivot: [20, 22], at: () => [2, -36], rot: (S) => S.head, s: (a) => rdParts.helm(a.face, a.atk) },
    { name: 'arm', parent: 'torso', pivot: [3, 5], at: () => [8, -14], rot: () => 0.6, s: () => rdParts.arm() },
    { name: 'rapier', parent: 'arm', pivot: [3, 5], at: () => [8, 0], rot: (S) => S.sword - 0.6, s: () => rdParts.rapier() },
  ],
  fx(ctx, m, a, S, mat) {
    // A gleam along the blade on the lunge.
    if (a.ph.since >= 0 && a.ph.since < 0.18) inPart(ctx, mat, 'rapier', () => {
      ctx.globalAlpha = a.alpha * (1 - a.ph.since / 0.18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(8, 4.6, 36, 0.8);
    });
  },
});

// Dame Minuet.
const mnParts = {
  tier: (i) => part(`minuet|tier|${i}`, 76, 16, () => {
    const w = 16 + i * 8;
    const cx = 38;
    const out = [T([[cx - w + 4, 2], [cx + w - 4, 2], [cx + w + 2, 13], [cx - w - 2, 13]], i % 2 ? STEEL2.base : STEEL2.hi), F(T([[cx + w - 8, 2], [cx + w - 4, 2], [cx + w + 2, 13], [cx + w - 4, 13]], STEEL2.sh))];
    for (let k = 0; k < 6; k++) out.push(F(R(cx - w + k * ((w * 2) / 6) + 2, 3, 1, 9, STEEL2.sh)));
    out.push(F(R(cx - w - 2, 12, w * 2 + 4, 1.4, '#e8b84a')));
    return out;
  }),
  bodice: () => part('minuet|bodice', 28, 28, () => [...blob(14, 14, 12, 12, STEEL2), F(O(16, 14, 4, 8, 0, '#ff9ac8', 14))]),
  helm: (mood, atk) => {
    return part(`minuet|helm|${mood}|${atk}`, 36, 44, () => {
      const out = [...helm(18, 26, 15, STEEL2, mood, atk, null)];
      for (let i = 0; i < 5; i++) out.push(T([[8 + i * 4, 12], [10 + i * 4, 6 - (i === 2 ? 4 : 0)], [12 + i * 4, 12]], '#e8b84a'));
      out.push(F(E(18, 4, 1.8, 1.8, '#ff6b9a')));
      return out;
    });
  },
  arm: () => part('minuet|arm', 16, 10, () => [...limb([3, 5], [13, 5], 5, 4, STEEL2.base)]),
  fan: () => part('minuet|fan', 24, 24, () => {
    const out = [T([[4, 20], ...arcPts(4, 20, 18, 18, -100, 10, 10)], '#fff0f8')];
    for (let i = 0; i < 6; i++) out.push(F(T([[4, 20], ...arcPts(4, 20, 18, 18, -100 + i * 18.3, -92 + i * 18.3, 2)], '#ffc6e2')));
    return out;
  }),
};
const minuetRig = makeRig({
  w: 70,
  h: 104,
  stride: 50,
  fast: ['lean', 'fan', 'spin'],
  kick: { lean: -1.6, t0: 3 },
  springs: { t0: [120, 8], t1: [100, 7], t2: [85, 6], t3: [70, 5] },
  pose(m, a) {
    const t = a.t;
    const b = Math.sin(t * 2.2);
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.3) * 0.03, y: -b * 1, fan: -0.4 + Math.sin(t * 1.6) * 0.1, head: Math.sin(t * 1.4) * 0.05, spin: 0 };
    const walk = { lean: s * 0.06, y: -Math.abs(s) * 1.6, fan: -0.4 + s * 0.2, head: s * 0.05, spin: 0 };
    const antic = { lean: -0.12, y: 2, fan: -1.4, head: -0.08, spin: 0 };
    const strike = { lean: 0.12, y: -2, fan: 0.9, head: 0.05, spin: 1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  // The tiers swing out one after another, the lowest the loosest.
  follow: (S) => ({ t0: -S.lean * 0.5, t1: -S.lean * 0.8, t2: -S.lean * 1.1, t3: -S.lean * 1.4 }),
  parts: [
    // (Her twirl: mirrored halfway through the spin, while the skirt flares.)
    { name: 'root', at: (S, a) => [0, S.y], rot: (S) => S.lean },
    { name: 'tier0', parent: 'root', pivot: [38, 2], at: () => [0, -50], rot: (S) => S.t0, s: () => mnParts.tier(0) },
    { name: 'tier1', parent: 'tier0', pivot: [38, 2], at: () => [0, 11], rot: (S) => S.t1 - S.t0, s: () => mnParts.tier(1) },
    { name: 'tier2', parent: 'tier1', pivot: [38, 2], at: () => [0, 11], rot: (S) => S.t2 - S.t1, s: () => mnParts.tier(2) },
    { name: 'tier3', parent: 'tier2', pivot: [38, 2], at: () => [0, 11], rot: (S) => S.t3 - S.t2, s: () => mnParts.tier(3) },
    { name: 'bodice', parent: 'root', pivot: [14, 22], at: () => [0, -50], s: () => mnParts.bodice() },
    { name: 'helm', parent: 'bodice', pivot: [18, 26], at: () => [2, -30], rot: (S) => S.head, s: (a) => mnParts.helm(a.face, a.atk) },
    { name: 'arm', parent: 'bodice', pivot: [3, 5], at: () => [8, -12], rot: (S) => S.fan * 0.4, s: () => mnParts.arm() },
    { name: 'fan', parent: 'arm', pivot: [4, 20], at: () => [11, 0], rot: (S) => S.fan, s: () => mnParts.fan() },
  ],
  fx(ctx, m, a, S) {
    // The spin's sweep of steel along the floor.
    if (a.ph.since >= 0 && a.ph.since < 0.3) {
      const u = a.ph.since / 0.3;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.7;
      ctx.strokeStyle = '#f4eeff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, -8, 30 + u * 24, 8 + u * 4, 0, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
  },
});
// Her twirl reads as a turn: the whole of her mirrored for the middle of the spin.
const minuetDraw = minuetRig.draw;
minuetRig.draw = (ctx, m, a) => {
  const sp = a.now - (m.attackAt ?? -9);
  const flip = sp >= 0.03 && sp < 0.17;
  minuetDraw(ctx, m, flip ? { ...a, flip: !a.flip } : a);
};

// Madame Velvet.
const PLUM = ramp('#9a5aa8', { step: 10, turn: 12 });
const GHOST = ramp('#f0e8ff', { step: 9, turn: 12 });
const plateAt = (x, y, r) => [O(x, y, r, r * 0.4, 0, '#ffffff', 18), F(O(x, y, r * 0.6, r * 0.24, 0, '#d0e8ff', 14)), F(T([...arcPts(x, y, r, r * 0.4, 20, 160, 8), ...arcPts(x, y, r * 0.86, r * 0.32, 160, 20, 8)], '#4f7ad8'))];
const vvParts = {
  tail: () => part('velvet|tail', 40, 44, () => [strand(chain(30, 4, 120, [8, 8, 7, 6], () => 10), (t) => 22 * (1 - t * 0.85), PLUM.base)]),
  body: () => part('velvet|body', 52, 44, () => [...blob(26, 22, 24, 20, PLUM), T([[22, 8], [44, 8], [46, 36], [26, 38]], '#ffffff'), F(T([[40, 8], [44, 8], [46, 36], [42, 36]], '#e8e0f4'))]),
  keys: () => part('velvet|keys', 14, 20, () => {
    const out = [...limb([7, 2], [7, 12], 1, 1, '#e8b84a')];
    for (let i = 0; i < 3; i++) out.push(...limb([7 + (i - 1) * 3, 12], [7 + (i - 1) * 4, 17], 1.2, 1, '#e8b84a'), E(7 + (i - 1) * 4, 18, 1.6, 1.6, '#e8b84a'));
    return out;
  }),
  head: (mood, atk) => part(`velvet|head|${mood}|${atk}`, 46, 40, () => {
    const hx = 23;
    const hy = 22;
    const out = [...blob(hx, hy, 18, 16, GHOST), T([...arcPts(hx - 1, hy - 4, 20, 14, 180, 360, 16)], '#ffffff')];
    for (let i = 0; i < 10; i++) out.push(E(hx - 20 + i * 4.2, hy - 4, 2.6, 2, '#ffffff'));
    out.push(F(R(hx - 18, hy - 5, 36, 1.6, '#ff8ab8')));
    out.push(...cuteFace(hx + 4, hy + 4, 2.2, mood, { iris: '#7a3aa8', gap: 5.6, atk, skin: GHOST.base, mouthDy: 3.6, lash: 1.6 }));
    for (const ex of [hx - 2, hx + 10]) out.push(F(T([...arcPts(ex, hy + 4, 4.6, 3, 0, 180, 8), ...arcPts(ex, hy + 4, 3.6, 2, 180, 0, 8)], '#c8902a')));
    out.push(F(R(hx + 2, hy + 3.4, 4, 0.8, '#c8902a')));
    return out;
  }),
  arm: () => part('velvet|arm', 20, 10, () => [...limb([3, 5], [16, 5], 7, 6, PLUM.base)]),
  plate: () => part('velvet|plate', 20, 10, () => plateAt(10, 5, 8)),
};
const velvetRig = makeRig({
  w: 70,
  h: 100,
  stride: 60,
  recover: 0.6,
  fast: ['arm', 'lean'],
  kick: { lean: -1.8, keys: 5 },
  springs: { keys: [40, 3], tail: [40, 4] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.1) * 0.04, y: Math.sin(t * 1.7) * 2.2, arm: -60 * D + Math.sin(t * 1.5) * 0.08, head: Math.sin(t * 1.2) * 0.05 };
    const walk = { lean: 0.12, y: Math.sin(a.wp * 2) * 2.4, arm: (-60 + s * 8) * D, head: 0.02 };
    const antic = { lean: -0.18, y: 0, arm: -165 * D, head: -0.1 };
    const strike = { lean: 0.22, y: -1, arm: 15 * D, head: 0.1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ keys: -S.lean * 1.5 - S.y * 0.04, tail: -S.lean * 1.2 }),
  parts: [
    { name: 'root', at: (S) => [0, -34 + S.y], rot: (S) => S.lean },
    { name: 'tail', parent: 'root', pivot: [30, 4], at: () => [-6, 12], rot: (S) => S.tail, s: () => vvParts.tail() },
    { name: 'body', parent: 'root', pivot: [26, 22], at: () => [0, 0], s: () => vvParts.body() },
    { name: 'keys', parent: 'body', pivot: [7, 2], at: () => [-8, -4], rot: (S) => S.keys, s: () => vvParts.keys() },
    { name: 'head', parent: 'body', pivot: [23, 22], at: () => [4, -30], rot: (S) => S.head, s: (a) => vvParts.head(a.face, a.atk) },
    { name: 'arm', parent: 'body', pivot: [3, 5], at: () => [16, -8], rot: (S) => S.arm, s: () => vvParts.arm() },
    // The plate in her hand, until it's thrown.
    { name: 'plate', parent: 'arm', pivot: [10, 7], at: () => [15, 0], rot: (S) => -S.arm, s: () => vvParts.plate(), when: (a) => !(a.ph.since >= 0) },
  ],
  fx(ctx, m, a) {
    // The thrown plate, spinning out ahead of her.
    if (a.ph.since >= 0 && a.ph.since < 0.45) {
      const u = a.ph.since / 0.45;
      ctx.save();
      ctx.translate(26 + u * 50, -50 + u * 30);
      ctx.rotate(u * 9);
      ctx.globalAlpha = a.alpha * (u > 0.8 ? (1 - u) * 5 : 1);
      ctx.drawImage(vvParts.plate().canvas, -10 - 6, -5 - 6, 32, 22);
      ctx.restore();
    }
  },
});

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
    { name: 'root', at: (S) => [0, -40 + S.y], rot: (S) => S.lean },
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
        ctx.ellipse(40 + Math.cos(ang) * r * 0.6, -36 + Math.sin(ang) * r * 0.5, 3, 1.6, ang, 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  waltzrondo: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 160, 300, 220], draw: rondo, rig: rondoRig },
  waltzminuet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 200, 300, 220], draw: minuet, rig: minuetRig },
  velvet: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: velvet, rig: velvetRig },
  marigold: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [100, 180, 340, 240], draw: marigold, rig: marigoldRig },
};

export const INFO = {
  waltzrondo: { name: 'Dame Rondo, the Leading Armour', w: 60, h: 104 },
  waltzminuet: { name: 'Dame Minuet, the Following Armour', w: 70, h: 104 },
  velvet: { name: 'Madame Velvet, the Head Housekeeper', w: 70, h: 100 },
  marigold: { name: 'Lady Marigold, the Eternal Hostess', w: 70, h: 110 },
};
