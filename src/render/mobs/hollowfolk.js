// Monster art: Rootwood Hollow (the levels 10-15 group dungeon), redrawn in the clean chibi creature
// style of the other dungeons (2026-11-03, the dungeon monster redesign: the old drawings were
// scratchy and the Myconid Queen was a costumed girl). The tree has gone sour, not evil: grumpy
// root and mushroom critters with a little teal glow in their eyes and purple in their veins.
//   rootling      Root Imp: a chunky root nub with a sprout on top and stubby root feet; scratches.
//   sporecap      Myconid Shaman: a little mushroom with a purple cap and a glowing staff; a puff of
//                 spores.
//   thornback     Bramble Bear: a round bear with a bramble of thorns down its back; a heavy swipe.
//   sporeling     Spore Mite: a tiny puffball on little legs; a hop.
//   sapling       Corrupted Sapling: a tiny tree that roots in place and pulses purple (no attack).
//   mothercapper  Myconid Queen: a great pink spotted mushroom with a face under her cap, a little
//                 crown and a glowing staff; she slams the staff down in a ring of spores.
//   tuskar        Tuskar the Behemoth: a big chubby boar with a fiery bristle ridge and plated
//                 hide; he paws the ground and charges.
//   gnarlroot     Gnarlroot, the Hollow Heart: a big grumpy-sleepy old tree with a glowing heart
//                 knot, a mossy crown and root arms; he raises them and slams them down.
// Every design faces right, its lowest point on the bottom edge.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { part, put, spring, kick, blend, attackPhase, lerp, smooth, clamp } from './rig.js';

const TEAL = '#5ff0d6';
const PURP = '#b86cff';
const phase = (pose, f, boss = false) => f / (pose === 'walk' ? 8 : pose === 'attack' ? (boss ? 5 : 4) : boss ? 8 : 6);
// Spores drifting up.
function spores(x, y, q, n = 3, k = 1, c = TEAL) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = (q + i / n) % 1;
    out.push(F(E(x + Math.sin(u * 6 + i * 2) * 3 * k, y - u * 12 * k, (0.8 + u * 0.6) * k, (0.8 + u * 0.6) * k, c)));
  }
  return out;
}

// ---------- Root Imp ----------

const IMP_ATK = [
  { claw: -1, lean: -12, crouch: 2 },
  { claw: 1, lean: 14, crouch: -1, smear: 1 },
  { claw: 1.1, lean: 14, crouch: 0, hit: 1 },
  { claw: 0.2, lean: 2, crouch: 0 },
];

function imp(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? IMP_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const bark = ramp('#b8845a', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 15;
  const cy = (dead ? 8 : 0) + (A ? A.crouch : 0) - Math.abs(step) * 1.4;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 4 : sway(q) * 2;
  const out = [];
  const body = [];
  // Stubby root feet, scurrying.
  for (const [ox, s, c] of [[-3, step, bark.sh], [3, -step, bark.base]]) body.push(...limb([cx + ox, cy + 24], [cx + ox + s * 3, 30 - Math.max(0, s) * 1.6], 2.4, 2, c), ...limb([cx + ox + s * 3, 30 - Math.max(0, s) * 1.6], [cx + ox + s * 3 + 2, 30.4 - Math.max(0, s) * 1.6], 1.4, 1, c));
  // A chunky root nub body, rings of bark, a purple vein.
  body.push(...blob(cx, cy + 17, 8, 9, bark));
  for (const y of [13, 18, 22]) body.push(F(strand(arcPts(cx, cy + y, 7, 1.4, 200, 340, 6), 0.6, bark.sh)));
  body.push(F(strand([[cx - 5, cy + 12], [cx - 3, cy + 16], [cx - 5, cy + 20]], 0.7, PURP)));
  // The sprout on top, twitching.
  const sp = chain(cx, cy + 8, -90, [3, 3], wave(TAU * q * 2, walk ? 16 : 8, 0.8));
  body.push(strand(sp, 1, '#5aa04a'));
  for (const a of [-40, 40]) body.push(O(sp.at(-1)[0] + Math.cos((sp.at(-1)[2] + a) * D2R) * 2.4, sp.at(-1)[1] + Math.sin((sp.at(-1)[2] + a) * D2R) * 2.4, 2.6, 1.3, sp.at(-1)[2] + a, '#7fd06a', 10));
  body.push(...cuteFace(cx + 2, cy + 15, 0.9, mood, { iris: TEAL, gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: bark.base, mouthDy: 3.2 }));
  // Twiggy little arms, raking forward on the scratch.
  const c = A ? A.claw : walk ? step * 0.2 : 0;
  body.push(...limb([cx - 6, cy + 16], [cx - 9, cy + 20], 1.6, 1.2, bark.sh), ...limb([cx + 6, cy + 15], [cx + 9 + c * 5, cy + 16 - c * 3], 1.6, 1.2, bark.base));
  for (const a of [-30, 0, 30]) body.push(...limb([cx + 9 + c * 5, cy + 16 - c * 3], [cx + 9 + c * 5 + Math.cos(a * D2R) * 2.4, cy + 16 - c * 3 + Math.sin(a * D2R) * 2.4], 0.8, 0.5, bark.sh));
  out.push(...spin(body, cx, 30, lean));
  if (A?.smear) out.push(smear([[cx + 2, cy + 8], [cx + 12, cy + 12], [cx + 18, cy + 20]], 3.4, '#e0fff8'));
  if (A?.hit) out.push(...star(cx + 18, cy + 16, 2.8, '#fff6a8'));
  return { w: 36, h: 32, res: 3, shapes: out };
}

// ---------- Myconid Shaman ----------

const SHAMAN_ATK = [
  { staff: -150, puff: 0 },
  { staff: -20, puff: 0.7 },
  { staff: 10, puff: 1.4, hit: 1 },
  { staff: -50, puff: 0.4 },
];

function shaman(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SHAMAN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const stem = ramp('#fff0dc', { step: 8, turn: 12 });
  const cap = ramp('#9a6ad8', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 16;
  const cy = (dead ? 8 : 0) - Math.abs(step) * 1 - (pose === 'idle' ? breath(q) * 0.6 : 0);
  const lean = dead ? 86 : walk ? step * 4 : sway(q) * 3;
  const out = [];
  const body = [];
  for (const [ox, s] of [[-3, step], [3, -step]]) body.push(O(cx + ox + Math.max(0, s) * 2, 33 - Math.max(0, s) * 1.4, 3, 1.6, 0, stem.sh, 12));
  // A plump stem body with a leafy skirt, the face on it.
  body.push(...blob(cx, cy + 25, 7, 7.6, stem));
  for (let i = 0; i < 5; i++) body.push(O(cx - 6 + i * 3, cy + 30, 2.4, 1.4, (i - 2) * 20, '#7fd06a', 10));
  body.push(...cuteFace(cx + 1.6, cy + 23, 0.9, mood, { iris: TEAL, gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: stem.base, mouthDy: 3 }));
  // The cap: a big round purple dome with glowing spots, a frilly gill rim.
  body.push(T([...arcPts(cx, cy + 18, 13, 12, 180, 360, 18)], cap.base), crescent(cx, cy + 14, 13, 10, cap.sh, { k: 0.26, a0: 300, a1: 380 }));
  for (let i = 0; i < 9; i++) body.push(E(cx - 12 + i * 3, cy + 18.4, 1.7, 1.2, i % 2 ? '#e8dcff' : '#d0c0f0'));
  for (const [x, y, r] of [[-6, 11, 2], [0, 8, 1.6], [6, 12, 1.8], [-1, 14, 1.2]]) body.push(F(E(cx + x, cy + y, r, r, '#e6fff8')), F(E(cx + x, cy + y, r * 0.5, r * 0.5, TEAL)));
  body.push(shine(cx, cy + 12, 13, 9, '#ffffff', -10, 0.9));
  // The glowing staff.
  const sa = A ? A.staff : walk ? -70 + step * 6 : -70;
  const hand = [cx + 7, cy + 24];
  const top = [hand[0] + Math.cos(sa * D2R) * 14, hand[1] + Math.sin(sa * D2R) * 14];
  body.push(...limb([cx + 5, cy + 23], hand, 2, 1.8, stem.base), ...limb([hand[0] - Math.cos(sa * D2R) * 6, hand[1] - Math.sin(sa * D2R) * 6], top, 1.2, 1.2, '#8a5a3a'), E(top[0], top[1], 2.4, 2.4, TEAL), F(E(top[0] - 0.6, top[1] - 0.6, 1, 1, '#ffffff')));
  out.push(...spin(body, cx, 34, lean));
  if (A?.puff) for (let i = 0; i < 5; i++) {
    const a = (-60 + i * 30) * D2R;
    out.push(F(E(top[0] + 6 + Math.cos(a) * 6 * A.puff, top[1] + Math.sin(a) * 6 * A.puff, 2 * A.puff, 2 * A.puff, i % 2 ? TEAL : '#e6fff8')));
  }
  if (A?.hit) out.push(...star(top[0] + 12, top[1], 3, '#fff6a8'));
  if (!dead && !A) out.push(...spores(top[0], top[1] - 2, q, 2, 0.6));
  return { w: 38, h: 36, res: 3, shapes: out };
}

// ---------- Bramble Bear ----------

const BEAR_ATK = [
  { paw: [-4, -12], lean: -10, rear: 4 },
  { paw: [14, -2], lean: 10, rear: -1, smear: 1 },
  { paw: [16, 4], lean: 12, rear: -1, hit: 1 },
  { paw: [8, 4], lean: 2, rear: 0 },
];

function bear(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? BEAR_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#9a7a5a', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 24;
  const cy = (dead ? 6 : 0) - (A ? A.rear : 0) - Math.abs(step) * 1;
  const lean = dead ? 70 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  const body = [];
  // Four stubby legs on all fours, a plodding step.
  for (const [ox, s, c] of [[-10, step, fur.sh], [8, -step, fur.sh], [-6, -step, fur.base], [12, step, fur.base]]) body.push(...limb([cx + ox, cy + 22], [cx + ox + Math.max(0, s) * 2, 33 - Math.max(0, s) * 1.6], 5, 4.6, c), O(cx + ox + 1 + Math.max(0, s) * 2, 33.4 - Math.max(0, s) * 1.6, 3.4, 1.4, 0, fur.deep, 12));
  // A round barrel body with a bramble of thorns down the back, a few berries in it.
  body.push(O(cx, cy + 18, 16, 10, 0, fur.base, 24), crescent(cx, cy + 18, 16, 10, fur.sh, { k: 0.28 }), F(O(cx + 4, cy + 22, 9, 4, 0, '#d8b898', 16)));
  body.push(strand(arcPts(cx - 1, cy + 14, 13, 8, 200, 340, 12), 3.4, '#6a8a4a'));
  for (let i = 0; i < 6; i++) {
    const a = (205 + i * 25) * D2R;
    const x = cx - 1 + Math.cos(a) * 13;
    const y = cy + 14 + Math.sin(a) * 8;
    body.push(T([[x - 1.6, y + 1], [x + Math.cos(a) * 5, y + Math.sin(a) * 5], [x + 1.6, y + 1]], '#e8d8b8'));
  }
  for (const [x, y] of [[-6, 7], [4, 6]]) body.push(E(cx + x, cy + y, 1.6, 1.6, PURP), F(E(cx + x - 0.4, cy + y - 0.4, 0.6, 0.6, '#ffffff')));
  // Head: round ears, a muzzle.
  const hx = cx + 14;
  const hy = cy + 12;
  body.push(E(hx - 5, hy - 6, 3, 3, fur.sh), E(hx + 3, hy - 6.6, 3, 3, fur.base), F(E(hx + 3, hy - 6.6, 1.6, 1.6, '#d8b898')));
  body.push(...blob(hx, hy, 7.6, 7, fur), F(O(hx + 4, hy + 2.4, 4, 3, 0, '#d8b898', 12)), E(hx + 7.4, hy + 1.2, 1.4, 1.1, '#3a2a2a'));
  body.push(...cuteFace(hx + 1, hy - 0.6, 0.9, mood, { iris: TEAL, gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fur.base, mouthDy: 4 }));
  // The swiping front paw.
  if (A) body.push(...limb([cx + 10, cy + 18], [cx + 10 + A.paw[0], cy + 18 + A.paw[1]], 5, 4.6, fur.base), O(cx + 11 + A.paw[0], cy + 18 + A.paw[1], 3.6, 3, 0, fur.hi, 12));
  out.push(...spin(body, cx, 33, lean));
  if (A?.smear) out.push(smear([[cx + 8, cy], [cx + 22, cy + 6], [cx + 30, cy + 20]], 5, '#f0e8e0'));
  if (A?.hit) out.push(...star(cx + 30, cy + 22, 3.4, '#fff6a8'));
  return { w: 56, h: 36, res: 3, shapes: out };
}

// ---------- Spore Mite ----------

function mite(pose, f, mood) {
  const q = phase(pose, f);
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const A = pose === 'attack' ? [0, 1, 0.6, 0][f] : 0;
  const puff = ramp('#e8d0ff', { step: 9, turn: 14 });
  const hop = walk ? Math.abs(Math.sin(TAU * q * 3)) * 3 : A * 4;
  const cx = 10 + A * 4;
  const cy = (dead ? 13 : 10) - hop;
  const out = [];
  for (const ox of [-3, 3]) out.push(...limb([cx + ox, cy + 4], [cx + ox, 15], 1, 1, '#8a6a9a'));
  out.push(...blob(cx, cy, 6.4, 5.6, puff));
  for (const [x, y] of [[-3, -2], [2, -3.6], [3.4, 0]]) out.push(F(E(cx + x, cy + y, 0.9, 0.9, PURP)));
  out.push(...cuteFace(cx + 1, cy + 0.6, 0.7, mood, { iris: TEAL, gap: 3.4, atk: A ? 1 : 0, skin: puff.base, mouthDy: 2.6 }));
  if (!dead) out.push(...spores(cx - 2, cy - 4, q, 2, 0.5, '#d8b8ff'));
  if (A === 1) out.push(...star(cx + 8, cy + 2, 2, '#fff6a8'));
  return { w: 22, h: 16, res: 3, shapes: dead ? spin(out, cx, 15, 0) : out };
}

// ---------- Corrupted Sapling ----------

function sapling(pose, f, mood) {
  const q = phase(pose, f);
  const dead = mood === 'dead';
  const bark = ramp('#9a7a6a', { step: 10, turn: 12 });
  const pulse = 0.5 + 0.5 * Math.sin(TAU * q);
  const cx = 10;
  const out = [];
  // Roots gripping the floor, a thin trunk with a purple vein, a leafy head that sways.
  for (const a of [150, 120, 60, 30]) out.push(strand(chain(cx, 34, a, [3, 3], () => 20 * (a < 90 ? -1 : 1)), (t) => 1.6 * (1 - t * 0.6), bark.sh));
  out.push(...limb([cx, 34], [cx + sway(q), 18], 3, 2, bark.base), F(strand([[cx, 32], [cx + 0.6, 26], [cx - 0.4, 20]], 0.8, mix(PURP, '#ffffff', 0.2 * pulse))));
  const sw = dead ? 30 : Math.sin(TAU * q) * 6;
  const head = [];
  for (const [x, y, r] of [[-5, 14, 4], [4, 14, 4], [0, 10, 4.6], [-2, 15, 3.4]]) head.push(E(cx + x, y, r, r * 0.9, x > 0 ? '#5aa04a' : '#7fc06a'));
  head.push(...cuteFace(cx + 1, 14, 0.7, dead ? 'dead' : 'blink', { iris: TEAL, gap: 3.4, skin: '#7fc06a', mouthDy: 2.4 }));
  head.push(F(E(cx, 12, 4 + pulse * 2, 4 + pulse * 2, mix(PURP, '#ffffff', 0.5))));
  out.push(...spin(head, cx, 18, sw));
  out.push(F(E(cx, 26, 2 + pulse, 2 + pulse, PURP)));
  return { w: 22, h: 36, res: 3, shapes: out };
}

// ---------- Myconid Queen ----------

const QUEEN_ATK = [
  { staff: -170, rise: 4, ring: 0 },
  { staff: -40, rise: -2, ring: 0, smear: 1 },
  { staff: 10, rise: -3, ring: 1, hit: 1 },
  { staff: 6, rise: -2, ring: 1.6 },
  { staff: -60, rise: 0, ring: 0.4 },
];

function myconidQueen(pose, f, mood) {
  const q = phase(pose, f, true);
  const A = pose === 'attack' ? QUEEN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const stem = ramp('#fff0e4', { step: 8, turn: 12 });
  const cap = ramp('#ff7aa8', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const rise = A ? A.rise : breath(q) * 1.2;
  const cx = 54;
  const out = [];
  // The stem body: a big round plump stem on a skirt of gills and little root feet.
  for (const [ox, s] of [[-10, step], [10, -step]]) out.push(O(cx + ox + Math.max(0, s) * 3, 103 - Math.max(0, s) * 2, 8, 3.4, 0, stem.sh, 14));
  out.push(...blob(cx, 80 - rise, 20, 22, stem));
  for (let i = 0; i < 9; i++) out.push(O(cx - 18 + i * 4.6, 100, 3.4, 2.4, (i - 4) * 10, i % 2 ? '#e8d8c8' : '#f4e8dc', 10));
  // A leafy collar and her face on the stem.
  for (let i = 0; i < 7; i++) out.push(O(cx - 15 + i * 5, 62 - rise, 4, 2.4, (i - 3) * 16, i % 2 ? '#7fd06a' : '#5aa04a', 12));
  out.push(...cuteFace(cx + 4, 76 - rise, 2.4, mood, { iris: '#ff5a9a', lip: '#c03a6a', gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: stem.base, mouthDy: 3.8, lash: 1.8, wing: 1.8 }));
  // The great cap: a wide pink dome with white spots and a frilled gill rim, a little crown on top.
  const cy = 50 - rise;
  out.push(T([...arcPts(cx, cy + 10, 40, 30, 180, 360, 24)], cap.base), crescent(cx, cy + 6, 40, 26, cap.sh, { k: 0.26, a0: 300, a1: 380 }));
  for (let i = 0; i < 16; i++) out.push(E(cx - 38 + i * 5.1, cy + 10.6, 3, 2, i % 2 ? '#ffd0e0' : '#ffb8d0'));
  for (const [x, y, r] of [[-24, 0, 5], [-8, -10, 6], [10, -6, 5], [24, 2, 4], [0, 4, 3.4], [-16, -12, 3]]) out.push(E(cx + x, cy + y, r, r * 0.8, '#ffffff'), F(E(cx + x - r * 0.3, cy + y - r * 0.3, r * 0.3, r * 0.2, '#fff6fa')));
  out.push(shine(cx, cy - 4, 40, 24, '#ffffff', -10, 1));
  for (let i = 0; i < 5; i++) out.push(T([[cx - 10 + i * 5, cy - 18], [cx - 8 + i * 5, cy - 26 - (i === 2 ? 4 : 0)], [cx - 6 + i * 5, cy - 18]], '#ffd36b'));
  out.push(R(cx - 10, cy - 20, 22, 3, '#e8b84a'), F(E(cx + 1, cy - 24, 1.8, 1.8, TEAL)));
  // The staff: a gnarled stick with a glowing crystal, raised and slammed down.
  const sa = A ? A.staff : walk ? -70 + step * 6 : -70 + sway(q) * 4;
  const hand = [cx + 20, 80 - rise];
  const dir = [Math.cos(sa * D2R), Math.sin(sa * D2R)];
  const top = [hand[0] + dir[0] * 30, hand[1] + dir[1] * 30];
  out.push(...limb([cx + 14, 78 - rise], hand, 6, 5, stem.base), ...limb([hand[0] - dir[0] * 12, hand[1] - dir[1] * 12], top, 2.4, 2, '#8a5a3a'), E(top[0], top[1], 4.4, 4.4, TEAL), F(E(top[0] - 1.2, top[1] - 1.2, 1.6, 1.6, '#ffffff')));
  if (A?.smear) out.push(smear([[cx + 20, 10], [cx + 44, 40], [top[0] + 4, top[1]]], 10, '#e6fff8'));
  if (A?.ring) out.push(F(T([...arcPts(cx + 30, 104, 24 * A.ring, 6 * A.ring, 180, 360, 16), ...arcPts(cx + 30, 104, 18 * A.ring, 4 * A.ring, 360, 180, 16)], TEAL)), ...spores(cx + 30, 100, q, 4, 1.4));
  if (A?.hit) out.push(...star(top[0] + 4, top[1] + 4, 7, '#fff6a8'));
  if (!dead) out.push(...spores(cx - 30, cy + 4, q, 3, 1.2, '#ffd0e8'));
  return { w: 112, h: 108, res: 3, shapes: dead ? spin(out, cx, 104, 0) : out };
}

// ---------- The Myconid Queen, rigged ----------
// (2026-11-03, the boss reanimation.) The same queen, cut into parts on a skeleton: root feet, a
// plump stem body with a leafy collar and a skirt of gills, her face, a great spotted cap with a
// little crown, a staff arm and a free arm. She breathes with her cap swaying a beat behind; she
// waddles, planting her staff like a walking stick, the cap bouncing and settling; for the slam she
// leans back and lifts the staff high over her head with her other hand flung up, then whips it
// down so the cap snaps forward and a ring of spores bursts from the floor; a blow rocks her back
// with the cap and crown wobbling after. Rig space: feet on the floor at (0, 0), facing right.

const Q = {
  stem: ramp('#fff0e4', { step: 8, turn: 12 }),
  cap: ramp('#ff7aa8', { step: 10, turn: 12 }),
  wood: '#8a5a3a',
  // Where things hang on the body (body-local, from the bottom of the stem).
  face: [4, -28],
  capAt: [0, -45],
  shoulderF: [19, -15],
  shoulderB: [-13, -33],
  skirt: [0, -4],
  arm: 7,
};

const qParts = {
  body: () => part('queen|body', 48, 52, () => {
    const out = [...blob(24, 26, 20, 22, Q.stem)];
    // A soft belly shine and the leafy collar under the cap.
    out.push(F(O(30, 30, 6, 9, -10, '#fffaf4', 14)));
    for (let i = 0; i < 7; i++) out.push(O(9 + i * 5, 8, 4, 2.4, (i - 3) * 16, i % 2 ? '#7fd06a' : '#5aa04a', 12));
    return out;
  }),
  skirt: () => part('queen|skirt', 44, 10, () => Array.from({ length: 9 }, (_, i) => O(4 + i * 4.5, 5, 3.4, 2.4, (i - 4) * 10, i % 2 ? '#e8d8c8' : '#f4e8dc', 10))),
  foot: () => part('queen|foot', 20, 10, () => [O(10, 6, 8, 3.4, 0, Q.stem.sh, 14), F(O(8, 5, 4, 1.2, 0, Q.stem.base, 10))]),
  face: (mood, atk) => part(`queen|face|${mood}|${atk}`, 34, 26, () => cuteFace(17, 11, 2.4, mood, { iris: '#ff5a9a', lip: '#c03a6a', gap: 6, atk, skin: Q.stem.base, mouthDy: 3.8, lash: 1.8, wing: 1.8 })),
  cap: () => part('queen|cap', 88, 38, () => {
    // Local: the middle of the cap's base at (44, 33).
    const cx = 44;
    const by = 33;
    const out = [T([...arcPts(cx, by, 40, 30, 180, 360, 26)], Q.cap.base), crescent(cx, by - 4, 40, 26, Q.cap.sh, { k: 0.26, a0: 300, a1: 380 })];
    for (let i = 0; i < 16; i++) out.push(E(cx - 38 + i * 5.1, by + 0.6, 3, 2, i % 2 ? '#ffd0e0' : '#ffb8d0'));
    for (const [x, y, r] of [[-24, -10, 5], [-8, -20, 6], [10, -16, 5], [24, -8, 4], [0, -6, 3.4], [-16, -22, 3]]) out.push(E(cx + x, by + y, r, r * 0.8, '#ffffff'), F(E(cx + x - r * 0.3, by + y - r * 0.3, r * 0.3, r * 0.2, '#fff6fa')));
    out.push(shine(cx, by - 14, 40, 24, '#ffffff', -10, 1));
    return out;
  }),
  crown: () => part('queen|crown', 26, 18, () => {
    // Local: the middle of the band's foot at (13, 15).
    const out = [];
    for (let i = 0; i < 5; i++) out.push(T([[3 + i * 5, 14], [5 + i * 5, 6 - (i === 2 ? 4 : 0)], [7 + i * 5, 14]], '#ffd36b'));
    out.push(R(3, 12, 22, 3, '#e8b84a'), F(E(14, 8, 1.8, 1.8, TEAL)), F(R(3, 12, 22, 1, '#fff0b0')));
    return out;
  }),
  // An arm: from the shoulder at (4, 5) out along +x to a round hand.
  arm: (back) => part(`queen|arm|${back ? 'b' : 'f'}`, 20, 10, () => {
    const c = back ? Q.stem.sh : Q.stem.base;
    return [...limb([4, 5], [4 + Q.arm, 5], 6, 5.6, c), O(4 + Q.arm, 5, 3.8, 3.6, 0, c, 14)];
  }),
  // The staff, upright: the grip at (6, 30), the crystal at the top.
  staff: () => part('queen|staff', 12, 44, () => [...limb([6, 42], [6, 8], 2.6, 2.2, Q.wood), F(R(5.2, 12, 1, 26, '#b07a52')), E(6, 7, 4.6, 4.6, TEAL), F(E(4.6, 5.6, 1.6, 1.6, '#ffffff'))]),
};

// Poses: numbers only, blended by weight. tilt (body lean, + forward), y (body drop), armF / armB
// (arm angle from +x, radians), staff (staff lean from upright, + forward), cap (cap's own tilt),
// footF / footB (foot x offsets), liftF / liftB (foot lifts).
function queenPose(m, a) {
  const t = a.t;
  const breath = Math.sin(t * 2.4);
  const idle = { tilt: Math.sin(t * 1.2) * 0.025, y: -breath * 1.2, armF: 0.35, staff: 0.35 + Math.sin(t * 1.2) * 0.05, armB: 2.0 + Math.sin(t * 1.5) * 0.1, cap: 0, footF: 0, footB: 0, liftF: 0, liftB: 0 };
  if (a.mood === 'happy') idle.y -= Math.abs(Math.sin(t * 7)) * 1.2;
  if (a.mood === 'angry') idle.cap += 0.06;
  const wp = ((m.odo ?? 0) / 58) * Math.PI * 2;
  const s = Math.sin(wp);
  const c = Math.cos(wp);
  const walk = { tilt: s * 0.07, y: -Math.abs(s) * 2.2, armF: 0.35 - s * 0.25, staff: 0.2 + s * 0.32, armB: 2.0 + s * 0.4, cap: 0, footF: s * 6, footB: -s * 6, liftF: Math.max(0, c) * 3, liftB: Math.max(0, -c) * 3 };
  // The slam: leaning back with the staff high overhead and the free hand flung up...
  const antic = { tilt: -0.17, y: 2.5, armF: -1.25, staff: -0.85, armB: -1.0, cap: 0.1, footF: 2, footB: -2, liftF: 0, liftB: 0 };
  // ...then whipped down and forward, the free arm thrown back.
  const strike = { tilt: 0.22, y: 1.5, armF: 0.45, staff: 1.6, armB: 2.7, cap: -0.12, footF: 4, footB: -3, liftF: 0, liftB: 0 };
  const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
  const base = blend([[idle, 1 - a.walkW], [walk, a.walkW]]);
  return blend([[base, rest], [antic, a.ph.antic], [strike, a.ph.strike]]);
}

function drawQueen(ctx, m, a) {
  const st = (a.mo.rig ??= {});
  const dt = a.dt;
  a.walkW = spring(st, 'walk', a.moving ? 1 : 0, 60, 16, dt);
  a.ph = attackPhase(m, a.now);
  const P = queenPose(m, a);
  // A new blow rocks her back; the cap and crown wobble after.
  if (a.mo.hitT !== st.hitT) {
    st.hitT = a.mo.hitT;
    if (m.hp > 0) {
      kick(st, 'tilt', -2.2);
      kick(st, 'cap', 3);
    }
  }
  const fast = a.ph.strike > 0 || a.ph.antic > 0.8;
  const tilt = spring(st, 'tilt', P.tilt, fast ? 700 : 220, fast ? 40 : 18, dt);
  const y = spring(st, 'y', P.y, 300, 26, dt);
  const armF = spring(st, 'armF', P.armF, fast ? 900 : 200, fast ? 46 : 20, dt);
  const staff = spring(st, 'staff', P.staff, fast ? 900 : 180, fast ? 44 : 18, dt);
  const armB = spring(st, 'armB', P.armB, 120, 9, dt);
  // The cap trails the body: it eases toward leaning against the body's tilt, and overshoots.
  const cap = spring(st, 'cap', P.cap - tilt * 0.55, 90, 7, dt);
  const crown = spring(st, 'crown', -cap * 0.6, 150, 5, dt);
  const skirt = spring(st, 'skirt', -tilt * 0.5, 110, 8, dt);
  const footF = spring(st, 'footF', P.footF, 400, 30, dt);
  const footB = spring(st, 'footB', P.footB, 400, 30, dt);
  const look = { flash: a.flash, alpha: a.alpha };
  const mood = m.hp <= 0 ? 'dead' : a.ph.atk ? 'angry' : a.mood;
  const atk = a.ph.atk ? 1 : 0;

  ctx.save();
  if (a.flip) ctx.scale(-1, 1);
  // Ambient spores drifting up off the back of her cap.
  if (m.hp > 0) for (let k = 0; k < 3; k++) {
    const u = (a.t * 0.32 + k / 3) % 1;
    ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
    ctx.fillStyle = k % 2 ? '#ffd0e8' : '#ffe8f2';
    ctx.beginPath();
    ctx.arc(-34 + k * 7 + Math.sin(u * 7 + k) * 3, -58 - u * 34, 1.6 + u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The free arm, behind her (body-local, so it turns with her).
  const body = (fn) => {
    ctx.save();
    ctx.translate(0, y);
    ctx.rotate(tilt);
    fn();
    ctx.restore();
  };
  body(() => put(ctx, qParts.arm(true), [4, 5], Q.shoulderB[0], Q.shoulderB[1], armB, look));
  // Root feet on the floor.
  put(ctx, qParts.foot(), [10, 6], -10 + footB, -P.liftB, 0, look);
  put(ctx, qParts.foot(), [10, 6], 10 + footF, -P.liftF, 0, look);
  body(() => {
    put(ctx, qParts.body(), [24, 50], 0, 0, 0, look);
    put(ctx, qParts.skirt(), [22, 5], Q.skirt[0], Q.skirt[1], skirt, look);
    put(ctx, qParts.face(mood, atk), [17, 11], Q.face[0], Q.face[1], 0, look);
    // The cap and its crown.
    ctx.save();
    ctx.translate(Q.capAt[0], Q.capAt[1]);
    ctx.rotate(cap);
    put(ctx, qParts.cap(), [44, 33], 0, 0, 0, look);
    put(ctx, qParts.crown(), [13, 15], 0, -28, crown, look);
    ctx.restore();
    // The staff in her hand, then the arm over it.
    const hx = Q.shoulderF[0] + Math.cos(armF) * Q.arm;
    const hy = Q.shoulderF[1] + Math.sin(armF) * Q.arm;
    put(ctx, qParts.staff(), [6, 30], hx, hy, staff, look);
    // The crystal's glow, drawn live so it can pulse (and flare in the slam).
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(staff);
    const glow = ctx.createRadialGradient(0, -23, 1, 0, -23, 10 + a.ph.strike * 6);
    glow.addColorStop(0, `rgba(160,255,236,${(0.45 + 0.15 * Math.sin(a.t * 3) + a.ph.antic * 0.3) * a.alpha})`);
    glow.addColorStop(1, 'rgba(95,240,214,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-18, -41, 36, 36);
    ctx.restore();
    put(ctx, qParts.arm(false), [4, 5], Q.shoulderF[0], Q.shoulderF[1], armF, look);
    // A sweep of light behind the staff head as it comes down.
    if (a.ph.since >= 0 && a.ph.since < 0.14) {
      // (A short arc along the crystal's path, thinning out behind it.)
      const u = a.ph.since / 0.14;
      ctx.strokeStyle = '#e6fff8';
      ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = a.alpha * (1 - u) * (0.55 - k * 0.15);
        ctx.lineWidth = 4 - k;
        ctx.beginPath();
        ctx.arc(Q.shoulderF[0], Q.shoulderF[1], Q.arm + 22, -1.3 + k * 0.15, 0.55);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  });
  // The ring of spores where the staff struck the floor.
  if (a.ph.since >= 0 && a.ph.since < 0.6) {
    const u = a.ph.since / 0.6;
    const r = 8 + smooth(u) * 30;
    ctx.globalAlpha = a.alpha * (1 - u) * 0.9;
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 3 * (1 - u) + 1;
    ctx.beginPath();
    ctx.ellipse(38, -1, r, r * 0.24, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2;
      ctx.fillStyle = k % 2 ? TEAL : '#ffd0e8';
      ctx.beginPath();
      ctx.arc(38 + Math.cos(ang) * r, -2 + Math.sin(ang) * r * 0.24 - u * 18, 1.8 * (1 - u) + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------- Tuskar the Behemoth ----------

const BOAR_ATK = [
  { dx: -8, lean: -10, paw: 1 },
  { dx: 16, lean: 10, paw: 0, smear: 1 },
  { dx: 22, lean: 12, paw: 0, hit: 1 },
  { dx: 20, lean: 10, paw: 0 },
  { dx: 4, lean: 0, paw: 0 },
];

function boar(pose, f, mood) {
  const q = phase(pose, f, true);
  const A = pose === 'attack' ? BOAR_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const hide = ramp('#9a6a7a', { step: 10, turn: 12 });
  const plate = ramp('#5a6ab8', { step: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 52 + (A ? A.dx * 0.5 : 0);
  const cy = (dead ? 6 : 0) - Math.abs(step) * 2 - breath(q);
  const lean = dead ? 60 : A ? A.lean : walk ? step * 2 : 0;
  const out = [];
  const body = [];
  // Four sturdy legs, a front hoof pawing the ground on the wind-up.
  for (const [ox, s, c, front] of [[-24, step, hide.sh, false], [18, -step, hide.sh, true], [-16, -step, hide.base, false], [26, step, hide.base, true]]) {
    const pawUp = front && A?.paw ? -6 + Math.sin(q * TAU * 6) * 3 : 0;
    body.push(...limb([cx + ox, cy + 48], [cx + ox + Math.max(0, s) * 3, 72 - Math.max(0, s) * 3 + pawUp], 9, 8, c), O(cx + ox + 1 + Math.max(0, s) * 3, 73 - Math.max(0, s) * 3 + pawUp, 6, 2.6, 0, '#3a2a3a', 14));
  }
  // The big barrel body, plated with blue armour, a fiery bristle ridge.
  body.push(O(cx, cy + 40, 40, 22, 0, hide.base, 28), crescent(cx, cy + 40, 40, 22, hide.sh, { k: 0.28 }), F(O(cx + 6, cy + 50, 26, 8, 0, '#d8b0c0', 20)));
  body.push(T([...arcPts(cx - 2, cy + 38, 36, 18, 190, 340, 16), ...arcPts(cx - 2, cy + 42, 32, 14, 340, 190, 16)], plate.base));
  for (let i = 0; i < 4; i++) body.push(F(strand(arcPts(cx - 2, cy + 38, 36, 18, 200 + i * 36, 220 + i * 36, 3), 1, plate.hi)));
  for (let i = 0; i < 7; i++) {
    const a = (200 + i * 22) * D2R;
    const x = cx - 2 + Math.cos(a) * 34;
    const y = cy + 38 + Math.sin(a) * 17;
    const h = 8 + Math.sin(q * TAU * 2 + i) * 1.6;
    body.push(T([[x - 3, y + 2], [x + Math.cos(a) * h - 2, y + Math.sin(a) * h], [x + 3, y + 2]], i % 2 ? '#ff7a3a' : '#ffb03a'), F(T([[x - 1, y + 2], [x + Math.cos(a) * h * 0.6, y + Math.sin(a) * h * 0.6], [x + 1, y + 2]], '#ffe36b')));
  }
  // The head: a big round snout, tusks, small ears, a cross little face.
  const hx = cx + 36;
  const hy = cy + 36;
  body.push(T([[hx - 10, hy - 14], [hx - 6, hy - 24], [hx - 2, hy - 13]], hide.sh));
  body.push(...blob(hx, hy, 16, 15, hide), O(hx + 13, hy + 6, 7, 6, 0, '#e8a8b8', 16), F(E(hx + 12, hy + 5, 1.4, 2, '#7a3a4a')), F(E(hx + 16, hy + 5, 1.4, 2, '#7a3a4a')));
  for (const [x, l] of [[5, 10], [10, 8]]) body.push(T([[hx + x, hy + 10], [hx + x + 2, hy + 10], [hx + x + 6, hy + 10 - l], [hx + x + 4, hy + 10 - l + 1]], '#fffaf2'));
  body.push(...cuteFace(hx + 2, hy - 2, 1.8, mood, { iris: TEAL, gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: hide.base, mouthDy: null }));
  out.push(...spin(body, cx, 72, lean));
  if (A?.smear) out.push(smear([[cx - 30, cy + 40], [cx, cy + 36], [cx + 60, cy + 40]], 14, '#f0e0e8'));
  if (A?.hit) out.push(...star(cx + 62, cy + 40, 8, '#fff6a8'), F(E(cx - 30, 72, 6, 2, '#e8dccc')), F(E(cx - 40, 72, 4, 1.4, '#e8dccc')));
  if (A?.paw) out.push(F(E(cx + 22, 73, 5, 1.6, '#e8dccc')));
  return { w: 132, h: 76, res: 3, shapes: out };
}

// ---------- Gnarlroot, the Hollow Heart ----------

const TREE_ATK = [
  { arms: -1, rise: 4 },
  { arms: 0.4, rise: 0, smear: 1 },
  { arms: 1, rise: -4, hit: 1 },
  { arms: 1, rise: -3 },
  { arms: 0, rise: 0 },
];

function gnarl(pose, f, mood) {
  const q = phase(pose, f, true);
  const A = pose === 'attack' ? TREE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const bark = ramp('#8a6a5a', { step: 10, turn: 12 });
  const rise = A ? A.rise : breath(q) * 1.4;
  const cx = 60;
  const out = [];
  // Root feet spreading over the floor, shuffling.
  for (let i = 0; i < 6; i++) {
    const a = 180 - i * 36;
    const r = chain(cx + (i - 2.5) * 6, 132, a, [8, 8], (k) => (k ? (a > 90 ? -1 : 1) * 24 : 0) + (walk ? Math.sin(TAU * q * 2 + i) * 4 : 0));
    out.push(strand(r, (t) => 7 * (1 - t * 0.7), i % 2 ? bark.sh : bark.base));
  }
  // The trunk: a big round-bellied trunk with bark lines, a glowing heart knot, little mushrooms.
  const ty = 92 - rise;
  out.push(T([[cx - 30, 134], [cx - 32, ty - 10], [cx - 26, ty - 40], [cx + 26, ty - 40], [cx + 32, ty - 10], [cx + 30, 134]], bark.base), F(T([[cx + 18, ty - 40], [cx + 26, ty - 40], [cx + 32, ty - 10], [cx + 30, 134], [cx + 20, 134]], bark.sh)));
  for (const x of [-20, -8, 6]) out.push(F(strand([[cx + x, 130], [cx + x + 2, ty + 10], [cx + x - 1, ty - 20]], 1.2, bark.deep)));
  const pulse = 0.5 + 0.5 * Math.sin(TAU * q * 2);
  out.push(F(O(cx + 2, ty + 18, 10 + pulse * 2, 12 + pulse * 2, 0, mix(PURP, '#ffffff', 0.4), 18)), O(cx + 2, ty + 18, 7, 9, 0, PURP, 16), F(E(cx, ty + 15, 2.4, 3, '#ffffff')));
  for (const [x, y] of [[-26, 104], [24, 112], [-22, 120]]) out.push(T([...arcPts(cx + x, ty + y - 92, 4, 3, 180, 360, 8)], '#ff8a6a'), R(cx + x - 1, ty + y - 92, 2, 3, '#fff0e0'));
  // The face: big, sleepy-grumpy, set in the bark, a mossy unibrow.
  const fy = ty - 20;
  out.push(O(cx + 4, fy, 20, 14, 0, mix(bark.base, '#ffffff', 0.15), 20));
  out.push(...cuteFace(cx + 4, fy, 2.6, mood === 'idle' && !A ? 'blink' : mood, { iris: TEAL, inkC: '#2a1a1a', gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: bark.base, mouthDy: 3.6, blushOn: true }));
  out.push(F(strand([[cx - 12, fy - 7], [cx, fy - 9], [cx + 16, fy - 8]], 3, '#7fc06a')));
  // The crown: mossy branches with leaves and a few glowing buds.
  const crown = ty - 40;
  for (const [a, l] of [[-150, 18], [-120, 22], [-90, 24], [-60, 22], [-30, 18]]) {
    const br = chain(cx + Math.cos(a * D2R) * 12, crown + 4, a, [l / 2, l / 2], wave(TAU * q, 8, 0.8));
    out.push(strand(br, (t) => 5 * (1 - t * 0.6), bark.sh));
    out.push(...[0, 1, 2].map((k) => E(br.at(-1)[0] + (k - 1) * 4, br.at(-1)[1] - k % 2 * 3, 5, 4, k % 2 ? '#5aa04a' : '#7fc06a')));
    out.push(F(E(br.at(-1)[0], br.at(-1)[1] - 2, 1.4, 1.4, TEAL)));
  }
  // Root arms: hanging at his sides, raised high, then slammed down.
  const ar = A ? A.arms : walk ? Math.sin(TAU * q * 2) * 0.1 : 0;
  for (const s of [-1, 1]) {
    const arm = chain(cx + s * 28, ty - 26, s < 0 ? 120 - ar * 80 : 60 + ar * -10, [12, 12, 10], (k) => (k ? s * (ar < 0 ? 30 : -20) : 0));
    out.push(strand(arm, (t) => 9 * (1 - t * 0.5), s < 0 ? bark.sh : bark.base));
    const hd = arm.at(-1);
    for (const a of [-30, 0, 30]) out.push(...limb([hd[0], hd[1]], [hd[0] + Math.cos((hd[2] + a) * D2R) * 6, hd[1] + Math.sin((hd[2] + a) * D2R) * 6], 2.4, 1.4, bark.base));
  }
  if (A?.smear) out.push(smear([[cx + 30, ty - 70], [cx + 50, ty - 30], [cx + 56, 120]], 12, '#e6dcff'));
  if (A?.hit) out.push(...star(cx + 58, 128, 9, '#fff6a8'), ...star(cx - 50, 128, 6, '#e6dcff'), ...spores(cx + 40, 124, q, 4, 1.6, PURP));
  if (!dead) out.push(...spores(cx - 40, crown, q, 3, 1.4));
  return { w: 132, h: 140, res: 3, shapes: dead ? spin(out, cx, 134, 0) : out };
}

export const ART = {
  rootling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [45, 190, 140], draw: imp },
  sporecap: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [65, 250, 190], draw: shaman },
  thornback: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 310, 230], draw: bear },
  sporeling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [40, 170, 120], draw: mite },
  sapling: { pad: 6, walk: 8, idle: 6, attack: 4, cycle: 2.4, atkMs: [60, 240, 180], draw: sapling },
  mothercapper: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [80, 150, 420, 220], draw: myconidQueen, rig: { w: 90, h: 100, draw: drawQueen } },
  tuskar: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [70, 150, 380, 220], draw: boar },
  gnarlroot: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 22, atkMs: [90, 160, 520, 260], draw: gnarl },
};

export const INFO = {
  rootling: { name: 'Root Imp', w: 22, h: 30 },
  sporecap: { name: 'Myconid Shaman', w: 26, h: 34 },
  thornback: { name: 'Bramble Bear', w: 46, h: 32 },
  sporeling: { name: 'Spore Mite', w: 18, h: 14 },
  sapling: { name: 'Corrupted Sapling', w: 18, h: 34 },
  mothercapper: { name: 'Myconid Queen', w: 80, h: 100 },
  tuskar: { name: 'Tuskar the Behemoth', w: 110, h: 72 },
  gnarlroot: { name: 'Gnarlroot, the Hollow Heart', w: 100, h: 136 },
};
