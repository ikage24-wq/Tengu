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

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, move, strand, star, cuteFace, blob } from './critter.js';
import { part, put, spring, kick, blend, attackPhase, lerp, smooth, clamp, makeRig, stateBlend, inPart } from './rig.js';

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
// (Redrawn 2026-11-04 as a real little creature.) A bark-skinned sprout with a face, rooted to the
// floor on six gripping roots, twig arms with leaf hands, and a tuft of leaves on its head, some
// gone sour purple. Its loop (it never walks) is feeding Gnarlroot: it sways, its roots wriggle and
// beads of sap pulse out along them. Its leaves act its moods: they bristle up when it's angry,
// droop when it's hurt or sad, and wilt grey when it's cut down. Its attack is a lunge on its roots
// with a thorny twig whip.

const SAP_ATK = [
  { lean: -10, arm: -1, y: 1 },
  { lean: 16, arm: 1, y: -1, smear: 1 },
  { lean: 18, arm: 1.2, y: -1, hit: 1 },
  { lean: 4, arm: 0.3, y: 0 },
];

function sapling(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SAP_ATK[f] : null;
  const dead = mood === 'dead';
  const angry = mood === 'angry' || Boolean(A);
  const droop = mood === 'hurt' || mood === 'sad';
  const B = ramp(dead ? '#8e8288' : '#9a7a6a', { step: 10, turn: 12 });
  const L = ramp(dead ? '#a8a49a' : '#7fc06a', { step: 10, turn: 10 });
  const S = ramp(dead ? '#9a96a0' : '#a77ad0', { step: 10, turn: 10 });
  const loop = pose === 'walk';
  const pulse = 0.5 + 0.5 * Math.sin(TAU * q * (loop ? 2 : 1));
  const cx = 15;
  const ground = 38;
  const sw = dead ? 0 : Math.sin(TAU * q) * (loop ? 1.2 : 0.8);
  const by = 26 + (A ? A.y : -breath(q) * 0.6) + (dead ? 2 : 0);
  const lean = dead ? 70 : A ? A.lean : sw * 2;
  const out = [];
  // Six roots gripping the floor, their tips wriggling as it feeds, sap beads pulsing out along them.
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const wig = loop ? Math.sin(TAU * q * 2 + i * 1.7 + (s > 0 ? 0 : 1)) * 0.8 : 0;
    const reach = (5 + i * 3.4) * (A && s > 0 ? 1.15 : 1);
    const pts = [[cx + s * (1 + i * 1.2), by + 7], [cx + s * (reach * 0.55), by + 9.6 + i * 0.4], [cx + s * reach, ground - 0.8 - Math.max(0, wig)]];
    out.push(strand(pts, (t) => (2.6 - i * 0.4) * (1 - t * 0.6), i === 1 ? B.base : B.sh));
    if (!dead && loop) {
      const u = (q * 2 + i / 3) % 1;
      const p = u < 0.5 ? [pts[0][0] + (pts[1][0] - pts[0][0]) * u * 2, pts[0][1] + (pts[1][1] - pts[0][1]) * u * 2] : [pts[1][0] + (pts[2][0] - pts[1][0]) * (u * 2 - 1), pts[1][1] + (pts[2][1] - pts[1][1]) * (u * 2 - 1)];
      out.push(F(E(p[0], p[1] - 0.3, 0.9, 0.9, mix(PURP, '#ffffff', 0.35))));
    }
  }
  const body = [];
  // The far twig arm with its leaf hand.
  const arm = A ? A.arm : loop ? Math.sin(TAU * q + 1) * 0.15 : Math.sin(TAU * q) * 0.1;
  const farHand = [cx - 7 - arm * 1.4, by - 1 + (droop ? 2 : 0) - (angry ? 1.4 : 0)];
  body.push(...limb([cx - 5, by + 1], farHand, 1.6, 1.1, B.sh), O(farHand[0] - 1, farHand[1] - 0.6, 2.2, 1.2, -30, L.sh, 10));
  // The bark body: a plump bean, bark rings, the sour crack glowing purple.
  body.push(...blob(cx, by, 7.4, 8.6, B));
  for (const y of [-3, 2, 6]) body.push(F(strand(arcPts(cx, by + y, 6.4, 1.4, 200, 340, 6), 0.5, B.sh)));
  body.push(F(strand([[cx - 4.6, by - 1], [cx - 3, by + 2], [cx - 4.4, by + 4.4], [cx - 3.2, by + 6.6]], 0.9, mix(PURP, '#ffffff', 0.15 + pulse * 0.4))));
  if (!dead) body.push(F(E(cx - 3.6, by + 2.6, 1.2 + pulse * 0.6, 1.2 + pulse * 0.6, mix(PURP, '#ffffff', 0.55))));
  // Thorns poke out when it's cross.
  if (angry && !dead) for (const [x, y, a] of [[-6.6, -3, 200], [-7, 3, 170], [6.8, 4, 10]]) body.push(T([[cx + x, by + y - 1], [cx + x + Math.cos(a * D2R) * 2.6, by + y + Math.sin(a * D2R) * 2.6], [cx + x, by + y + 1]], B.deep));
  body.push(...cuteFace(cx + 1.6, by - 1, 1, mood, { iris: TEAL, gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: B.base, mouthDy: 3.2 }));
  // The tuft on its head: two green leaves, two gone sour, one curled and wilting; it trails the
  // body's sway a beat late, bristles when angry, droops when hurt.
  const lag = dead ? 0 : Math.sin(TAU * q - 0.9) * (loop ? 10 : 7) - (A ? A.lean * 0.6 : 0);
  const spread = angry ? 1.35 : droop || dead ? 0.6 : 1;
  const tipDrop = droop ? 40 : dead ? 70 : 0;
  for (const [a0, len, sour] of [[-150, 6.4, true], [-118, 7.4, false], [-92, 8, false], [-64, 7, true], [-36, 5.6, false]]) {
    const a = -90 + (a0 + 90) * spread + lag + Math.sign(a0 + 90) * tipDrop;
    const r = (a * Math.PI) / 180;
    const base = [cx + Math.cos(r) * 2, by - 8 + Math.sin(r) * 1.4];
    const mid = [base[0] + Math.cos(r) * len * 0.55, base[1] + Math.sin(r) * len * 0.55];
    const C = sour ? S : L;
    body.push(O(mid[0], mid[1], len * 0.55, len * 0.24, a, C.base, 12), F(O(mid[0] + Math.cos(r + 1.6) * 0.6, mid[1] + Math.sin(r + 1.6) * 0.6, len * 0.4, len * 0.1, a, C.sh, 8)), F(strand([base, [base[0] + Math.cos(r) * len * 0.95, base[1] + Math.sin(r) * len * 0.95]], 0.4, C.hi)));
  }
  body.push(F(strand(arcPts(cx + 3.6, by - 10.6, 2, 2, 180, 420, 8), 1.1, S.sh)));
  // The near twig arm: a leaf hand, or the thorny whip lashing out on the attack.
  const hand = A ? [cx + 7 + A.arm * 6, by - 2 - A.arm * 3] : [cx + 7 + arm * 1.4, by + 1 + (droop ? 2 : 0) - (angry ? 2 : 0)];
  body.push(...limb([cx + 5, by + 1], hand, 1.8, 1.2, B.base));
  if (A) for (const a of [-40, 0, 40]) body.push(...limb(hand, [hand[0] + Math.cos((a - A.arm * 20) * D2R) * 3, hand[1] + Math.sin((a - A.arm * 20) * D2R) * 3], 0.9, 0.5, B.sh));
  else body.push(O(hand[0] + 1, hand[1] - 0.6, 2.4, 1.3, -20, L.base, 10), F(O(hand[0] + 1.2, hand[1] - 0.2, 1.6, 0.5, -20, L.sh, 8)));
  out.push(...spin(body, cx, by + 8, lean));
  if (A?.smear) out.push(smear([[cx + 2, by - 10], [cx + 10, by - 8], [cx + 16, by - 3]], 3.4, '#efe0ff'));
  if (A?.hit) out.push(...star(cx + 16, by - 4, 2.8, '#fff6a8'));
  if (mood === 'hurt') out.push(F(O(cx + 9, by - 12 + q * 6, 1.8, 0.8, 30 + q * 90, L.sh, 8)));
  if (!dead && !A) out.push(...spores(cx - 2, by - 10, q, 2, 0.5, mix(PURP, '#ffffff', 0.4)));
  return { w: 30, h: 40, res: 3, shapes: out };
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
  // (The staff goes behind her, so it never crosses her face; the arm holding it stays in front.)
  out.unshift(...limb([hand[0] - dir[0] * 12, hand[1] - dir[1] * 12], top, 2.4, 2, '#8a5a3a'), E(top[0], top[1], 4.4, 4.4, TEAL), F(E(top[0] - 1.2, top[1] - 1.2, 1.6, 1.6, '#ffffff')));
  out.push(...limb([cx + 14, 78 - rise], hand, 6, 5, stem.base));
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

// (Redrawn 2026-11-04 to the later bosses' level: a cap with its gills showing under the rim, spots
// that wrap round the dome, a deep back edge and a lit rim; stem fibres and a veined leaf collar; a
// lace frill; toed root feet; a jewelled crown; a grained staff with a faceted crystal.)
const QK = { gill: ramp('#f7c3d6', { step: 9 }), leaf: ramp('#6fc85e', { step: 10 }), lace: ramp('#f4e8dc', { step: 8 }), gold: ramp('#ffd36b', { step: 10, turn: 10 }) };
const qParts = {
  body: () => part('queen|body', 48, 52, () => {
    const out = [...blob(24, 26, 20, 22, Q.stem)];
    // Soft fibres down the stem, a belly shine.
    for (const x of [-10, -4, 9]) out.push(F(strand([[24 + x, 12], [24 + x * 1.15, 26], [24 + x, 42]], 0.7, Q.stem.sh)));
    out.push(F(O(30, 30, 6, 9, -10, '#fffaf4', 14)));
    // The leafy collar under the cap: veined leaves, the back ones in shadow.
    for (let i = 0; i < 7; i++) {
      const x = 9 + i * 5;
      const a = (i - 3) * 16;
      const L = i % 2 ? QK.leaf : { base: QK.leaf.sh, sh: QK.leaf.deep, hi: QK.leaf.base };
      out.push(O(x, 8, 4.2, 2.6, a, L.base, 12), F(O(x, 8.8, 3.4, 1.2, a, L.sh, 10)), F(strand([[x - Math.cos(a * D2R) * 3, 8 - Math.sin(a * D2R) * 3], [x + Math.cos(a * D2R) * 3, 8 + Math.sin(a * D2R) * 3]], 0.5, L.hi)));
    }
    return out;
  }),
  skirt: () => part('queen|skirt', 44, 10, () => {
    const out = [];
    for (let i = 0; i < 9; i++) out.push(O(4 + i * 4.5, 5, 3.4, 2.6, (i - 4) * 10, i % 2 ? QK.lace.sh : QK.lace.base, 10), F(E(4 + i * 4.5, 6.4, 0.7, 0.7, '#ffffff')));
    out.push(F(strand([[2, 3.2], [22, 2.4], [42, 3.2]], 0.8, QK.lace.hi)));
    return out;
  }),
  // A root foot, its sole on the floor at the pivot (10, 9.4), little toes forward.
  foot: () => part('queen|foot', 20, 12, () => [O(10, 6, 8, 3.4, 0, Q.stem.sh, 14), F(O(8, 5, 4, 1.2, 0, Q.stem.base, 10)), E(16.6, 7.6, 2, 1.6, Q.stem.sh), E(13.4, 8.2, 1.8, 1.4, Q.stem.sh), F(R(4, 8.6, 12, 0.8, mix(Q.stem.sh, '#8a6a7a', 0.4)))]),
  face: (mood, atk) => part(`queen|face|${mood}|${atk}`, 34, 26, () => cuteFace(17, 11, 2.4, mood, { iris: '#ff5a9a', lip: '#c03a6a', gap: 6, atk, skin: Q.stem.base, mouthDy: 3.8, lash: 1.8, wing: 1.8 })),
  cap: () => part('queen|cap', 88, 40, () => {
    // Local: the middle of the cap's base at (44, 33).
    const cx = 44;
    const by = 33;
    // The gills underneath, fanning out under the rim.
    const out = [O(cx, by + 1.6, 37, 5.4, 0, QK.gill.base, 24)];
    for (let i = 0; i < 15; i++) {
      const u = (i + 0.5) / 15;
      const x = cx - 34 + u * 68;
      out.push(F(strand([[cx + (x - cx) * 0.3, by + 4.4], [x, by + 1.6]], 0.6, QK.gill.sh)));
    }
    // The dome: lit from the front, its back edge deep.
    out.push(T([...arcPts(cx, by, 40, 30, 180, 360, 26)], Q.cap.base), crescent(cx, by - 4, 40, 26, Q.cap.sh, { k: 0.26, a0: 300, a1: 380 }));
    out.push(F(T([...arcPts(cx, by, 40, 30, 180, 226, 10), ...arcPts(cx, by, 36.4, 26, 226, 180, 10)], mix(Q.cap.sh, Q.cap.deep, 0.35))));
    // Spots wrapping round the dome: each with its shadow side, smaller toward the edges.
    for (const [x, y, r] of [[-24, -10, 5], [-8, -20, 6], [10, -16, 5], [24, -8, 4], [0, -6, 3.4], [-16, -22, 3], [32, -2, 2.6], [-33, -3, 2.6]]) {
      const sq = 1 - Math.abs(x) / 70;
      out.push(O(cx + x, by + y, r * sq, r * 0.8, 0, '#ffffff', 14), F(crescent(cx + x, by + y, r * sq, r * 0.8, '#ffd8e6', { k: 0.34, a0: 20, a1: 200 })));
    }
    // The scalloped rim, then a band of light along the top.
    for (let i = 0; i < 16; i++) out.push(E(cx - 38 + i * 5.1, by + 0.6, 3, 2, i % 2 ? '#ffd0e0' : '#ffb8d0'));
    out.push(shine(cx, by - 14, 40, 24, '#ffffff', -10, 1), F(strand(arcPts(cx, by, 38, 28, 250, 320, 10), 1.2, Q.cap.hi)));
    return out;
  }),
  crown: () => part('queen|crown', 26, 18, () => {
    // Local: the middle of the band's foot at (13, 15).
    const out = [];
    for (let i = 0; i < 5; i++) {
      const tip = [5 + i * 5, 6 - (i === 2 ? 4 : 0)];
      out.push(T([[3 + i * 5, 14], tip, [7 + i * 5, 14]], QK.gold.base), F(T([[5 + i * 5, 14], tip, [7 + i * 5, 14]], QK.gold.sh)), F(E(tip[0], tip[1], 1, 1, i % 2 ? '#ff9ac8' : '#ffffff')));
    }
    out.push(R(3, 12, 22, 3, QK.gold.sh), F(R(3, 12, 22, 1, QK.gold.hi)), F(E(14, 10, 2.2, 2.2, TEAL)), F(E(13.4, 9.4, 0.8, 0.8, '#ffffff')), F(E(8, 13.4, 1, 1, '#ff9ac8')), F(E(20, 13.4, 1, 1, '#ff9ac8')));
    return out;
  }),
  // An arm: from the shoulder at (4, 5) out along +x to a round hand.
  arm: (back) => part(`queen|arm|${back ? 'b' : 'f'}`, 20, 10, () => {
    const c = back ? Q.stem.sh : Q.stem.base;
    return [...limb([4, 5], [4 + Q.arm, 5], 6, 5.6, c), O(4 + Q.arm, 5, 3.8, 3.6, 0, c, 14), F(O(4 + Q.arm + 0.6, 4, 1.6, 1, 0, back ? Q.stem.base : '#ffffff', 8))];
  }),
  // The staff, upright: the grip at (6, 30), the crystal at the top.
  staff: () => part('queen|staff', 14, 46, () => [
    ...limb([7, 43], [7, 9], 2.8, 2.2, Q.wood), F(R(6.2, 12, 1, 28, '#b07a52')), F(strand([[6, 18], [8.4, 22], [6, 26]], 0.6, '#5a3a2a')),
    ...limb([4, 13], [10, 13], 1.6, 1.6, '#7fd06a'), F(O(11, 12, 2, 1, -30, '#7fd06a', 8)),
    T([[7, 1.6], [11, 6], [9.6, 11], [4.4, 11], [3, 6]], TEAL), F(T([[7, 1.6], [11, 6], [7, 7]], '#c8fff2')), F(T([[3, 6], [7, 7], [4.4, 11]], '#2fb8a0')), F(E(6, 4.4, 0.9, 0.9, '#ffffff')),
  ]),
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
  put(ctx, qParts.foot(), [10, 9.4], -10 + footB, -P.liftB, 0, look);
  put(ctx, qParts.foot(), [10, 9.4], 10 + footF, -P.liftF, 0, look);
  body(() => {
    // The staff in her hand goes behind her (so it never crosses her face in the slam); the arm
    // holding it is drawn over everything.
    const hx = Q.shoulderF[0] + Math.cos(armF) * Q.arm;
    const hy = Q.shoulderF[1] + Math.sin(armF) * Q.arm;
    put(ctx, qParts.staff(), [7, 31], hx, hy, staff, look);
    // The crystal's glow, drawn live so it can pulse (and flare in the slam).
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(staff);
    const glow = ctx.createRadialGradient(0, -25, 1, 0, -25, 10 + a.ph.strike * 6);
    glow.addColorStop(0, `rgba(160,255,236,${(0.45 + 0.15 * Math.sin(a.t * 3) + a.ph.antic * 0.3) * a.alpha})`);
    glow.addColorStop(1, 'rgba(95,240,214,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-18, -43, 36, 36);
    ctx.restore();
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
// (Redrawn 2026-11-04 to the later bosses' level: a heavy shoulder hump and haunch under the
// barrel, shaggy fur edges and strokes, riveted armour plates that overlap, a three-tone fiery
// ridge, a proper snout disc, curved two-tone tusks, a mane and notched ears, cloven hooves.) The
// still frames and the rig are drawn from the same builders.

const TK = {
  hide: ramp('#9a6a7a', { step: 10, turn: 12 }),
  mane: ramp('#6e4a68', { step: 9, turn: 12 }),
  plate: ramp('#5a6ab8', { step: 10, turn: 10 }),
  belly: '#d8b0c0',
  snout: ramp('#e8a8b8', { step: 9 }),
  tusk: ramp('#fffaf2', { step: 9 }),
  hoof: '#3a2a3a',
  fire: ['#ff6a3a', '#ffb03a', '#ffe36b'],
};

// Shaggy tufts hanging along an ellipse's lower edge (angles in degrees, 90 = straight down).
function tufts(cx, cy, rx, ry, a0, a1, n, len, c) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (a0 + ((a1 - a0) * (i + 0.5)) / n) * D2R;
    const x = cx + Math.cos(a) * rx;
    const y = cy + Math.sin(a) * ry;
    const l = len * (0.75 + 0.25 * Math.sin(i * 2.3));
    out.push(T([[x - 2.6, y - 1], [x + Math.cos(a) * l - 1, y + Math.sin(a) * l], [x + 2.6, y - 1]], c));
  }
  return out;
}

// The barrel with its hump, haunch, plates and fiery ridge, centred at (cx, cy). `fl` flickers
// the flames (0..1).
function tkBody(cx, cy, fl = 0) {
  const H = TK.hide;
  const P = TK.plate;
  const out = [];
  // Haunch at the back and the great shoulder hump at the front give him his heavy shape.
  out.push(O(cx - 22, cy + 2, 18, 18, 0, H.base, 22), crescent(cx - 22, cy + 2, 18, 18, H.sh, { k: 0.3, a0: 60, a1: 220, jag: 1.6 }));
  out.push(O(cx + 19, cy - 3, 22, 21, 0, H.base, 24));
  out.push(O(cx, cy + 3, 38, 20, 0, H.base, 28), crescent(cx, cy + 3, 38, 20, H.sh, { k: 0.3, a0: 25, a1: 175, jag: 2.2 }));
  out.push(...tufts(cx, cy + 3, 36, 19, 40, 150, 9, 4, H.sh));
  // The soft belly, fur strokes over the flank, a rim of light along the back.
  out.push(F(O(cx + 4, cy + 12, 24, 7, 0, TK.belly, 20)), F(O(cx + 6, cy + 11, 14, 3, 0, mix(TK.belly, '#ffffff', 0.35), 14)));
  for (const [x, y, a] of [[-26, 8, 200], [-14, 12, 205], [10, 4, 195], [22, 10, 200], [-4, 6, 198]]) out.push(F(strand(arcPts(cx + x, cy + y, 5, 2, a, a + 70, 5), 0.8, H.deep)));
  out.push(F(strand(arcPts(cx + 2, cy + 2, 36, 19, 205, 300, 10), 1.2, H.hi)));
  // Riveted armour plates down his back, overlapping from the rump forward.
  for (let i = 0; i < 4; i++) {
    const a = (205 + i * 30) * D2R;
    const px = cx - 2 + Math.cos(a) * 30;
    const py = cy + 1 + Math.sin(a) * 14;
    const tang = (Math.atan2(14 * Math.cos(a), -30 * Math.sin(a)) * 180) / Math.PI;
    out.push(O(px, py, 13, 8, tang, P.base, 18), crescent(px, py, 13, 8, P.sh, { k: 0.34, a0: 20, a1: 160, rot: tang }));
    // (Its leading edge lifts off the plate in front: a dark seam, then a bright lip.)
    out.push(F(strand(arcPts(px, py, 12.6, 7.6, 300 + tang, 400 + tang, 6), 1.4, P.deep)), F(strand(arcPts(px, py, 11, 6.4, 310 + tang, 380 + tang, 5), 0.8, mix(P.hi, '#ffffff', 0.3))));
    out.push(F(strand(arcPts(px, py, 11, 6, 200 + tang, 300 + tang, 6), 1, P.hi)));
    for (const k of [-1, 1]) out.push(F(E(px + Math.cos((tang * Math.PI) / 180) * k * 8, py + Math.sin((tang * Math.PI) / 180) * k * 8 + 2, 1.1, 1.1, '#ffd36b')));
  }
  // The fiery bristle ridge: curling tongues of flame, three tones each.
  for (let i = 0; i < 8; i++) {
    const a = (198 + i * 20) * D2R;
    const x = cx - 2 + Math.cos(a) * 34;
    const y = cy - 2 + Math.sin(a) * 18;
    const h = 9 + (i % 3) * 1.6 + Math.sin(fl * TAU + i * 1.7) * 1.8;
    const dx = Math.cos(a - 0.35);
    const dy = Math.sin(a - 0.35);
    const tip = [x + dx * h, y + dy * h];
    const curl = [tip[0] - 3, tip[1] + 1.4];
    out.push(T([[x - 3.6, y + 2], [x - 3 + dx * h * 0.5, y + dy * h * 0.5], curl, tip, [x + 3 + dx * h * 0.45, y + dy * h * 0.45], [x + 3.6, y + 2]], TK.fire[0]));
    out.push(F(T([[x - 2.2, y + 2], [x + dx * h * 0.72 - 1, y + dy * h * 0.72], [x + 2.2, y + 2]], TK.fire[1])), F(T([[x - 1, y + 2], [x + dx * h * 0.42, y + dy * h * 0.42], [x + 1, y + 2]], TK.fire[2])));
  }
  return out;
}

// The head centred at (hx, hy), facing right (eyes drawn separately at about (hx + 2, hy - 2)).
function tkHead(hx, hy) {
  const H = TK.hide;
  const out = [];
  // Far ear and the shaggy mane behind the skull.
  out.push(T([[hx - 12, hy - 10], [hx - 10, hy - 23], [hx - 3, hy - 13]], H.sh));
  out.push(T([[hx - 6, hy - 15], [hx - 14, hy - 17], [hx - 12, hy - 11], [hx - 19, hy - 9], [hx - 15, hy - 4], [hx - 20, hy + 1], [hx - 14, hy + 4], [hx - 17, hy + 9], [hx - 9, hy + 9]], TK.mane.base), F(T([[hx - 13, hy - 9], [hx - 17, hy], [hx - 12, hy + 5], [hx - 9, hy - 2]], TK.mane.sh)));
  // The skull, shaded underneath with fur tufts at the cheek, a heavy brow.
  out.push(O(hx, hy, 16, 15, 0, H.base, 24), crescent(hx, hy, 16, 15, H.sh, { k: 0.3, a0: 40, a1: 200, jag: 1.6 }), shine(hx, hy, 16, 15, H.hi, 0, 1));
  out.push(...tufts(hx - 2, hy + 2, 14, 12, 95, 160, 4, 3.6, H.sh));
  out.push(F(O(hx + 3, hy - 8.4, 10, 2.6, -6, H.sh, 14)));
  // The snout: its side, then the round disc with nostrils.
  out.push(O(hx + 12, hy + 6, 9, 7.4, 0, H.base, 18), crescent(hx + 12, hy + 6, 9, 7.4, H.sh, { k: 0.3, a0: 40, a1: 170 }));
  out.push(O(hx + 18, hy + 5.6, 4.6, 6.2, 0, TK.snout.base, 16), crescent(hx + 18, hy + 5.6, 4.6, 6.2, TK.snout.sh, { k: 0.3, a0: 20, a1: 170 }), F(O(hx + 17.4, hy + 3.4, 2, 1.4, 0, TK.snout.hi, 10)));
  out.push(F(E(hx + 16.8, hy + 5.6, 0.9, 1.7, '#6a2a3e')), F(E(hx + 19.6, hy + 5.6, 0.9, 1.7, '#6a2a3e')));
  // Curved two-tone tusks, sweeping up past the snout.
  for (const [x, s] of [[5, 1.2], [10.6, 1]]) {
    const o = arcPts(hx + x + 7 * s, hy + 11, 7 * s, 11 * s, 180, 265, 7);
    const i = arcPts(hx + x + 7 * s, hy + 11, 4.4 * s, 9.4 * s, 265, 180, 7);
    out.push(T([...o, ...i], TK.tusk.base), F(T([...arcPts(hx + x + 7 * s, hy + 11, 5.6 * s, 10.2 * s, 180, 250, 6), ...i.slice(1)], TK.tusk.sh)), F(R(hx + x - 0.4, hy + 9.6, 3, 1.4, '#c8b0a8')));
  }
  // The near ear: notched, pink inside, flopping forward a little.
  out.push(T([[hx - 6, hy - 11], [hx - 1, hy - 25], [hx + 3, hy - 21], [hx + 1.6, hy - 18], [hx + 4, hy - 12]], H.base), F(T([[hx - 3.6, hy - 12], [hx - 0.6, hy - 21.6], [hx + 1.6, hy - 13]], '#e8a0b4')));
  return out;
}

// A leg hanging from (x, y): a thick thigh, the shin, a fetlock tuft and a cloven hoof; the
// hoof's sole is 26 below the joint.
function tkLeg(x, y, front) {
  const c = front ? TK.hide.base : TK.hide.sh;
  const d = front ? TK.hide.sh : TK.hide.deep;
  return [
    O(x, y + 5, 7.4, 8.4, 0, c, 16), F(crescent(x, y + 5, 7.4, 8.4, d, { k: 0.3, a0: 300, a1: 420 })),
    ...limb([x, y + 9], [x + 0.6, y + 21], 7.4, 5.8, c),
    T([[x - 4, y + 18], [x - 1, y + 23.6], [x + 1.6, y + 18.6], [x + 4.4, y + 23.4], [x + 4.6, y + 18]], d),
    T([[x - 4.8, y + 21.4], [x + 5.6, y + 21.4], [x + 6.2, y + 26], [x - 5.2, y + 26]], TK.hoof),
    F(R(x + 0.2, y + 22, 0.9, 4, '#1c121c')), F(R(x - 3.8, y + 21.8, 7, 1, '#6a5a6e')),
  ];
}

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
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 52 + (A ? A.dx * 0.5 : 0);
  const cy = (dead ? 6 : 0) - Math.abs(step) * 2 - breath(q);
  const lean = dead ? 60 : A ? A.lean : walk ? step * 2 : 0;
  const out = [];
  const body = [];
  const leg = (ox, s, front, near) => {
    const pawUp = front && near && A?.paw ? -6 + Math.sin(q * TAU * 6) * 3 : 0;
    return spin(move(tkLeg(cx + ox, cy + 46 + pawUp, near), 0, 0), cx + ox, cy + 46, -s * 22);
  };
  // Far legs, then the body and head, then the near legs in front.
  body.push(...leg(-24, step, false, false), ...leg(18, -step, true, false));
  body.push(T([[cx - 38, cy + 34], [cx - 46, cy + 30], [cx - 44, cy + 36]], TK.hide.sh));
  body.push(...tkBody(cx, cy + 40, q));
  body.push(...leg(-16, -step, false, true), ...leg(26, step, true, true));
  const hx = cx + 36;
  const hy = cy + 36;
  body.push(...tkHead(hx, hy));
  body.push(...cuteFace(hx + 2, hy - 2, 1.8, mood, { iris: TEAL, gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: TK.hide.base, mouthDy: null }));
  out.push(...spin(body, cx, 72, lean));
  if (A?.smear) out.push(smear([[cx - 30, cy + 40], [cx, cy + 36], [cx + 60, cy + 40]], 14, '#f0e0e8'));
  if (A?.hit) out.push(...star(cx + 62, cy + 40, 8, '#fff6a8'), F(E(cx - 30, 72, 6, 2, '#e8dccc')), F(E(cx - 40, 72, 4, 1.4, '#e8dccc')));
  if (A?.paw) out.push(F(E(cx + 22, 73, 5, 1.6, '#e8dccc')));
  return { w: 132, h: 76, res: 3, shapes: out };
}

// ---------- Gnarlroot, the Hollow Heart ----------
// (Redrawn 2026-11-04 to the later bosses' level: a flared, pot-bellied trunk lit from the front with
// bark ridges and a knot hole, moss on his shoulders and feet, bracket fungi, the heart crystal set
// in a hollow with a bark lip, a face plate rimmed in bark under a mossy brow, a canopy of shaded
// leaf clumps with sour purple leaves and glowing buds, gnarled branch arms with an elbow knot and
// twig fingers, and roots that grip the floor.) The still frames and the rig share the builders.

const GN = {
  bark: ramp('#8a6a5a', { step: 10, turn: 12 }),
  moss: ramp('#7fc06a', { step: 10, turn: 10 }),
  leaf: ramp('#6fbf5a', { step: 11, turn: 12 }),
  sour: ramp('#a77ad0', { step: 10, turn: 10 }),
  fungus: ramp('#ff8a6a', { step: 9, turn: 10 }),
  hollow: '#3a2238',
};

// Moss: a soft clump of rounds with light flecks.
function moss(x, y, w, k = 1) {
  const out = [];
  for (let i = 0; i < 4; i++) out.push(E(x - w / 2 + (i + 0.5) * (w / 4), y - (i % 2) * 1.6 * k, (w / 5) * 1.1, 2.6 * k, i % 2 ? GN.moss.base : GN.moss.sh));
  out.push(F(E(x - w * 0.15, y - 2 * k, 1, 0.8, GN.moss.hi)), F(E(x + w * 0.2, y - 1.4 * k, 0.8, 0.7, GN.moss.hi)));
  return out;
}

// The trunk in a 72 x 90 box, its foot at (36, 86), its top at y 4.
function gnTrunk() {
  const B = GN.bark;
  const cx = 36;
  const out = [];
  const outline = [[cx - 35, 86], [cx - 28, 78], [cx - 30, 62], [cx - 31, 44], [cx - 27, 24], [cx - 20, 8], [cx - 8, 3], [cx + 9, 4], [cx + 21, 9], [cx + 28, 24], [cx + 32, 44], [cx + 31, 62], [cx + 28, 78], [cx + 36, 86]];
  out.push(T(outline, B.base));
  // The back of the trunk in shadow, deepest at the edge; the belly catching the light.
  out.push(F(T([[cx - 35, 86], [cx - 28, 78], [cx - 30, 62], [cx - 31, 44], [cx - 27, 24], [cx - 20, 8], [cx - 13, 6], [cx - 18, 24], [cx - 21, 44], [cx - 19, 64], [cx - 16, 86]], B.sh)));
  out.push(F(T([[cx - 35, 86], [cx - 28, 78], [cx - 30, 62], [cx - 31, 44], [cx - 27, 24], [cx - 24, 22], [cx - 26, 44], [cx - 25, 64], [cx - 24, 86]], B.deep)));
  out.push(F(O(cx + 12, 46, 10, 22, -4, B.hi, 18)), F(O(cx + 14, 44, 4, 14, -4, mix(B.hi, '#ffffff', 0.25), 14)));
  // Bark ridges running up the trunk, forking, each with a lit edge on its front side.
  for (const [x, w] of [[-14, 1.6], [-4, 1.4], [6, 1.2], [18, 1]]) {
    const r = [[cx + x - 1, 84], [cx + x + 1.6, 66], [cx + x - 0.6, 48], [cx + x + 1, 30], [cx + x * 0.6, 12]];
    out.push(F(strand(r, w, B.deep)), F(strand(r.map(([px, py]) => [px + w + 0.6, py]), 0.6, B.hi)));
    out.push(F(strand([[cx + x + 1.2, 58], [cx + x + 5, 52]], 0.8, B.deep)));
  }
  // A knot hole up on the shoulder.
  out.push(O(cx - 12, 26, 4, 5, 0, B.deep, 12), F(O(cx - 11.6, 26.6, 2.4, 3.4, 0, GN.hollow, 10)), F(strand(arcPts(cx - 12, 26, 4.6, 5.6, 200, 330, 6), 0.8, B.hi)));
  // The heart's hollow: a dark socket with a lip of bark, the crystal glowing inside.
  out.push(O(cx + 2, 62, 10, 12, 0, B.deep, 18), O(cx + 2, 62.6, 8, 10, 0, GN.hollow, 16), F(strand(arcPts(cx + 2, 62, 10.4, 12.4, 160, 380, 12), 1.2, B.hi)));
  out.push(T([[cx + 2, 53], [cx + 7.4, 59], [cx + 6.4, 67], [cx + 2, 71], [cx - 3, 66.6], [cx - 3.6, 58.6]], PURP), F(T([[cx + 2, 53], [cx + 7.4, 59], [cx + 2, 62]], mix(PURP, '#ffffff', 0.45))), F(T([[cx - 3.6, 58.6], [cx + 2, 62], [cx - 3, 66.6]], mix(PURP, '#2a1040', 0.3))), F(E(cx + 0.6, 58, 1.4, 2, '#ffffff')));
  // Bracket fungi stepping up the back, moss on the shoulders and over the feet.
  for (const [x, y, r] of [[-26, 56, 5], [-27, 64, 4], [24, 72, 4.4], [-22, 74, 3.4]]) {
    out.push(T([...arcPts(cx + x, y, r, r * 0.7, 180, 360, 9)], GN.fungus.base), F(T([...arcPts(cx + x, y, r, r * 0.7, 180, 250, 5), [cx + x, y]], GN.fungus.hi)), F(R(cx + x - r, y - 0.6, r * 2, 1.2, GN.fungus.sh)));
  }
  out.push(...moss(cx - 14, 9, 16), ...moss(cx + 12, 9, 14), ...moss(cx - 26, 84, 14, 0.9), ...moss(cx + 22, 85, 12, 0.9));
  return out;
}

// The face plate in a 50 x 34 box, centred at (25, 16).
function gnFace(mood, atk) {
  const B = GN.bark;
  const out = [O(25, 17, 21, 15, 0, B.deep, 22), O(25, 16, 19.4, 13.6, 0, mix(B.base, '#ffffff', 0.16), 22)];
  out.push(F(crescent(25, 16, 19.4, 13.6, B.base, { k: 0.3, a0: 40, a1: 200 })), F(strand([[10, 22], [8, 26]], 0.8, B.deep)), F(strand([[41, 21], [44, 25]], 0.8, B.deep)));
  out.push(...cuteFace(25, 16, 2.6, mood === 'idle' && !atk ? 'blink' : mood, { iris: TEAL, inkC: '#2a1a1a', gap: 6, atk, skin: B.base, mouthDy: 3.6, blushOn: true }));
  // The mossy brow, heavy and grumpy, with a leaf sprouting from it.
  out.push(F(strand([[11, 8], [18, 5.4], [26, 5.6], [34, 5], [42, 7]], 3.4, GN.moss.base)), F(strand([[14, 6.4], [24, 4.6], [36, 4.4]], 1, GN.moss.hi)));
  out.push(F(O(36, 2.4, 3.6, 1.6, -30, GN.leaf.base, 10)), F(O(37, 2, 1.8, 0.6, -30, GN.leaf.hi, 8)));
  return out;
}

// A clump of leaves: three shaded rounds, sour (purple) ones mixed in.
function leaves(x, y, k, sour, glow) {
  const L = sour ? GN.sour : GN.leaf;
  const out = [];
  for (const [dx, dy, r] of [[-4.4, 1, 4.6], [4.4, 1.4, 4.4], [0, -2.4, 5.4]]) out.push(O(x + dx * k, y + dy * k, r * k, r * 0.86 * k, 0, L.base, 14), crescent(x + dx * k, y + dy * k, r * k, r * 0.86 * k, L.sh, { k: 0.3, a0: 30, a1: 200 }));
  out.push(F(O(x - 1 * k, y - 4.4 * k, 2.4 * k, 1.2 * k, -15, L.hi, 10)));
  if (glow) out.push(F(E(x + 1.4 * k, y - 0.6 * k, 1.4, 1.4, TEAL)), F(E(x + 1, y - 1, 0.6, 0.6, '#ffffff')));
  return out;
}

// The crown in a 96 x 44 box, its foot at (48, 38): forked branches under a canopy of leaf clumps.
function gnCrown() {
  const B = GN.bark;
  const out = [];
  const tips = [];
  for (const [a, l, sour] of [[-152, 20, false], [-124, 24, true], [-92, 26, false], [-62, 24, false], [-30, 20, true]]) {
    const br = chain(48 + Math.cos(a * D2R) * 12, 38, a, [l / 2, l / 2], (k) => (k ? (a < -90 ? -14 : 14) : 0));
    out.push(strand(br, (t) => 6 * (1 - t * 0.6), B.sh), F(strand(br, (t) => 1.6 * (1 - t * 0.7), B.deep)));
    const mid = br[1];
    const fork = [mid[0] + Math.cos((a + (a < -90 ? 34 : -34)) * D2R) * 9, mid[1] + Math.sin((a + (a < -90 ? 34 : -34)) * D2R) * 9];
    out.push(strand([[mid[0], mid[1]], fork], (t) => 3 * (1 - t * 0.6), B.sh));
    tips.push([...br.at(-1), sour], [fork[0], fork[1], 0, false]);
  }
  tips.forEach(([x, y, , sour], i) => out.push(...leaves(x, y, i % 2 ? 0.8 : 1.05, sour, i % 3 === 0)));
  // Moss trailing from the lowest branches.
  out.push(F(strand([[30, 30], [28, 36], [29, 41]], 1.6, GN.moss.sh)), F(strand([[68, 30], [70, 35], [69, 40]], 1.4, GN.moss.sh)));
  return out;
}

// An arm in a 22 x 42 box, hanging from the shoulder at (11, 4): an upper limb, an elbow knot, the
// forearm, and three twig fingers.
function gnArm(back) {
  const B = GN.bark;
  const c = back ? B.sh : B.base;
  const d = back ? B.deep : B.sh;
  const out = [strand([[11, 4], [13, 12], [12.4, 18]], (t) => 9 * (1 - t * 0.25), c), O(12.6, 19, 5, 4.4, 20, c, 14), strand([[12.4, 20], [10.4, 28], [11, 35]], (t) => 6.6 * (1 - t * 0.35), c)];
  out.push(F(strand([[8, 6], [9.4, 13], [9.6, 18]], 1.2, d)), F(strand([[9, 22], [8.4, 28], [9, 33]], 1, d)), F(E(13.6, 18.4, 1.4, 1.1, d)));
  for (const a of [60, 92, 124]) {
    const k = [11 + Math.cos(a * D2R) * 4, 36 + Math.sin(a * D2R) * 4];
    const tip = [k[0] + Math.cos((a + (a - 92) * 0.6) * D2R) * 4, k[1] + Math.sin((a + (a - 92) * 0.6) * D2R) * 4];
    out.push(...limb([11, 35], k, 2.8, 2.2, c), ...limb(k, tip, 2.2, 1.2, c));
  }
  if (!back) out.push(...moss(13, 8, 9, 0.7), F(O(16, 26, 2.6, 1.2, -40, GN.leaf.base, 10)));
  return out;
}

// Roots in a 132 x 26 box, the trunk's foot at (66, 22) on the floor: they spread and grip it.
// (`side` draws one half only, -1 behind or 1 in front, so the rig can step them in turn.)
function gnRoots(side = 0) {
  const B = GN.bark;
  const out = [];
  for (const s of side ? [side] : [-1, 1]) for (let i = 0; i < 3; i++) {
    const pts = [[66 + s * (8 + i * 6), 12 + i * 2], [66 + s * (20 + i * 9), 12.6 + i * 1.6], [66 + s * (32 + i * 12), 18.4], [66 + s * (44 + i * 14), 20.8]];
    out.push(strand(pts, (t) => (8 - i) * (1 - t * 0.75), i === 1 ? B.base : B.sh), F(strand(pts.map(([x, y]) => [x, y - 1.4]), (t) => 1.4 * (1 - t), B.hi)));
    if (i === 1) out.push(...limb(pts[1], [pts[1][0] + s * 5, 21], 2, 1.2, B.sh));
  }
  return out;
}

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
  const rise = A ? A.rise : breath(q) * 1.4;
  const cx = 60;
  const out = [];
  // Root foot at (cx, 134); the trunk drawn from its box (foot at (36, 86)).
  const tx = cx - 36;
  const ty = 48 - rise * 0.3;
  const ar = A ? A.arms : walk ? Math.sin(TAU * q * 2) * 0.1 : 0;
  // (Arm angles as the rig's: hanging is 0, raised high is about 2.7 radians.)
  const armB = (ar < 0 ? 2.7 * -ar : 0.4 - ar * 0.9) * (180 / Math.PI);
  const armF = (ar < 0 ? -2.7 * -ar : -0.4 - ar * 0.5) * (180 / Math.PI);
  out.push(...move(gnRoots(), cx - 66, 112 + (walk ? Math.sin(TAU * q * 2) : 0)));
  out.push(...spin(move(gnArm(true), tx + 36 - 28 - 11, ty + 44 - rise - 4), tx + 36 - 28, ty + 44 - rise, armB));
  out.push(...move(gnTrunk(), tx, ty));
  out.push(...move(gnCrown(), tx + 36 - 48, ty + 8 - rise - 38));
  out.push(...move(gnFace(mood, A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0), tx + 40 - 25, ty + 22 - rise * 0.8 - 16));
  out.push(...spin(move(gnArm(false), tx + 36 + 28 - 11, ty + 44 - rise - 4), tx + 36 + 28, ty + 44 - rise, armF));
  if (A?.smear) out.push(smear([[cx + 30, ty - 30], [cx + 50, ty + 10], [cx + 56, 120]], 12, '#e6dcff'));
  if (A?.hit) out.push(...star(cx + 58, 128, 9, '#fff6a8'), ...star(cx - 50, 128, 6, '#e6dcff'), ...spores(cx + 40, 124, q, 4, 1.6, PURP));
  if (!dead) out.push(...spores(cx - 40, ty, q, 3, 1.4));
  return { w: 132, h: 140, res: 3, shapes: out };
}

// ---------- Tuskar, rigged ----------
// (2026-11-03, the boss reanimation; redrawn 2026-11-04.) A barrel body on four legs that swing in
// a trot, a head on its own neck with the tusks and snout, a fiery bristle ridge shedding embers, and
// a curly little tail that wags. He paws the ground with a front hoof as he winds up, head lowered,
// then lunges with his legs reaching and his head driving the tusks up. Rig space: hooves on the
// floor under his middle.
const tkParts = {
  leg: (front) => part(`tusk|leg|${front ? 'f' : 'b'}`, 20, 34, () => tkLeg(10, 4, front)),
  // The barrel centred at (46, 30) (the ridge's life comes from the embers drawn live over it).
  body: () => part('tusk|body', 92, 56, () => tkBody(46, 30), 12),
  // The head centred at (24, 22); the neck joint is at (12, 26).
  head: () => part('tusk|head', 48, 46, () => tkHead(24, 22), 8),
  face: (mood, atk) => part(`tusk|face|${mood}|${atk}`, 26, 16, () => cuteFace(13, 8, 1.8, mood, { iris: TEAL, gap: 6, atk, skin: TK.hide.base, mouthDy: null })),
  tail: () => part('tusk|tail', 18, 16, () => [...limb([2, 10], [9, 6], 2.8, 2.2, TK.hide.sh), O(11, 6, 3.2, 3.2, 0, TK.hide.sh, 12), F(O(11, 6, 1.4, 1.4, 0, TK.hide.base, 10)), T([[12, 4], [16, 1], [15, 5], [17, 7], [13, 8]], TK.mane.base)]),
};
const TUSK_LEGS = [['legB1', -24, false], ['legF1', 18, false], ['legB2', -16, true], ['legF2', 26, true]];
const tuskarRig = makeRig({
  w: 110,
  h: 72,
  stride: 60,
  fast: ['x', 'tilt', 'head', 'legF1', 'legF2', 'legB1', 'legB2'],
  kick: { tilt: -1.6, head: -3 },
  springs: { legF1: [500, 30], legF2: [500, 30], legB1: [500, 30], legB2: [500, 30], tail: [60, 4] },
  pose(m, a) {
    const t = a.t;
    const b = Math.sin(t * 2.2);
    const s = Math.sin(a.wp);
    const paw = Math.sin(t * 15);
    const idle = { x: 0, y: -b * 0.8 - 0.4, tilt: 0, head: Math.sin(t * 1.3) * 0.04, legF1: 0, legF2: 0, legB1: 0, legB2: 0, tail: Math.sin(t * 3) * 0.35 };
    const walk = { x: 0, y: -Math.abs(s) * 2.4, tilt: s * 0.03, head: -s * 0.06, legF1: s * 0.45, legF2: -s * 0.45, legB1: -s * 0.45, legB2: s * 0.45, tail: Math.sin(t * 9) * 0.5 };
    const antic = { x: -6, y: 0.6, tilt: -0.08, head: 0.28, legF1: 0.1, legF2: -0.5 + paw * 0.45, legB1: 0.15, legB2: 0.2, tail: Math.sin(t * 14) * 0.6 };
    const strike = { x: 14, y: -1.6, tilt: 0.08, head: -0.35, legF1: -0.55, legF2: -0.6, legB1: 0.5, legB2: 0.55, tail: -0.6 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    // (The far legs and the tail go behind the body, the near legs and head in front.)
    { name: 'tail', parent: 'body', pivot: [2, 10], at: () => [-40, -6], rot: (S) => -0.4 + S.tail, s: () => tkParts.tail() },
    ...TUSK_LEGS.slice(0, 2).map(([n, x, f]) => ({ name: n, parent: 'body', pivot: [10, 4], at: () => [x, 5], rot: (S) => S[n], s: () => tkParts.leg(f) })),
    // (The body sits so the hooves rest on the floor: joint 26 above the soles.)
    { name: 'body', pivot: [46, 30], at: (S) => [S.x, -31 + S.y], rot: (S) => S.tilt, s: () => tkParts.body() },
    ...TUSK_LEGS.slice(2).map(([n, x, f]) => ({ name: n, parent: 'body', pivot: [10, 4], at: () => [x, 5], rot: (S) => S[n], s: () => tkParts.leg(f) })),
    { name: 'head', parent: 'body', pivot: [12, 26], at: () => [24, 0], rot: (S) => S.head, s: () => tkParts.head() },
    { name: 'face', parent: 'head', pivot: [13, 8], at: () => [14, -6], s: (a) => tkParts.face(a.face, a.atk) },
  ],
  fx(ctx, m, a, S, mat) {
    // Embers lifting off the fiery ridge.
    if (m.hp > 0) inPart(ctx, mat, 'body', () => {
      for (let k = 0; k < 4; k++) {
        const u = (a.t * 0.7 + k / 4) % 1;
        ctx.globalAlpha = a.alpha * (1 - u) * 0.85;
        ctx.fillStyle = k % 2 ? '#ffb03a' : '#ffe36b';
        ctx.beginPath();
        ctx.arc(-26 + k * 15 + Math.sin(u * 6 + k) * 3, -20 - u * 22, 1.3 * (1 - u) + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // Dust kicked up by the pawing hoof, and puffs behind the lunge.
    if (a.ph.antic > 0.2) for (let k = 0; k < 3; k++) {
      const u = (a.t * 2.2 + k / 3) % 1;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.6 * a.ph.antic;
      ctx.fillStyle = '#e8dccc';
      ctx.beginPath();
      ctx.arc(30 - u * 26 - k * 4, -2 - u * 6, 2 + u * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (a.ph.since >= 0 && a.ph.since < 0.4) {
      const u = a.ph.since / 0.4;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.7;
      ctx.fillStyle = '#e8dccc';
      for (const dx of [-30, -40, -22]) {
        ctx.beginPath();
        ctx.arc(dx - u * 14, -3 - u * 4, 3 + u * 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
});

// ---------- Gnarlroot, rigged ----------
// (2026-11-03, the boss reanimation; redrawn 2026-11-04.) A big round-bellied trunk on spreading
// roots, a sleepy-grumpy face set in the bark, a leafy crown of branches that trails the trunk on a
// spring, and two branch arms on shoulders. He sways and breathes, his heart crystal pulsing; he
// shuffles his roots to walk; for the slam he rears back with both arms high, then brings them
// crashing down in front.
const gnParts = {
  roots: (side) => part(`gnarl|roots|${side}`, 132, 26, () => gnRoots(side)),
  trunk: () => part('gnarl|trunk', 72, 90, gnTrunk, 8),
  face: (mood, atk) => part(`gnarl|face|${mood}|${atk}`, 50, 34, () => gnFace(mood, atk)),
  crown: () => part('gnarl|crown', 96, 44, gnCrown, 10),
  arm: (back) => part(`gnarl|arm|${back ? 'b' : 'f'}`, 22, 42, () => gnArm(back)),
};

// Where a root half sits as he walks: planted for half the step cycle, then lifted and carried
// forward a stride's worth (the body covers `stride` a cycle, so a planted half drifts back by half
// that against the body).
const GN_STRIDE = 44;
function gnStep(a, off) {
  const u = ((a.wp / TAU + off) % 1 + 1) % 1;
  const w = a.walkW;
  if (u < 0.5) return [(0.25 - u) * GN_STRIDE * w, 0];
  const v = (u - 0.5) * 2;
  const e = v * v * (3 - 2 * v);
  return [(-0.25 + e * 0.5) * GN_STRIDE * w, -Math.sin(v * Math.PI) * 3.4 * w];
}

const gnarlRig = makeRig({
  w: 100,
  h: 136,
  stride: GN_STRIDE,
  fast: ['armF', 'armB', 'tilt', 'y'],
  kick: { tilt: -1.2, crown: 3 },
  springs: { crown: [70, 5] },
  pose(m, a) {
    const t = a.t;
    const b = Math.sin(t * 1.8);
    const s = Math.sin(a.wp);
    const idle = { tilt: Math.sin(t * 0.9) * 0.03, y: -b * 1.4, armF: -0.4 + Math.sin(t * 1.1) * 0.06, armB: 0.4 + Math.sin(t * 1.3) * 0.06 };
    // Walking, he rocks onto the root half that's planted and his arms swing against it.
    const walk = { tilt: -s * 0.045, y: -Math.abs(Math.cos(a.wp)) * 2.2, armF: -0.4 + s * 0.22, armB: 0.4 + s * 0.22 };
    // The wind-up: drawn up tall and leaning back, both arms high over his crown, trembling as he
    // gathers himself (more and more as the slam comes).
    const shiver = Math.sin(t * 38) * 0.05 * a.ph.antic * a.ph.antic;
    const antic = { tilt: -0.1 + shiver * 0.3, y: -7, armF: -2.85 + shiver, armB: 2.85 - shiver };
    // The slam: both arms crash down wide at his sides, palms flat on the floor, his whole top
    // sinking into the blow.
    const strike = { tilt: 0.03, y: 12, armF: -0.82, armB: 0.82 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  // (The crown trails his lean, and whips down after his arms as they come crashing in.)
  follow: (S) => ({ crown: -S.tilt * 0.8 + Math.max(0, S.y) * 0.025 }),
  parts: [
    // The roots step in turn: one half grips the floor (sliding back under him exactly as far as
    // he moves, so it stays put) while the other lifts and reaches forward.
    { name: 'rootB', pivot: [66, 22], at: (S, a) => gnStep(a, 0), s: () => gnParts.roots(-1) },
    { name: 'rootF', pivot: [66, 22], at: (S, a) => gnStep(a, 0.5), s: () => gnParts.roots(1) },
    { name: 'armB', parent: 'trunk', pivot: [11, 4], at: (S) => [-28, -42 + S.y], rot: (S) => S.armB, s: () => gnParts.arm(true) },
    // (Lifted as he rocks, so the flared foot's corners never dig into the floor.)
    { name: 'trunk', pivot: [36, 86], at: (S) => [0, Math.min(0, S.y * 0.3) - 34 * (Math.hypot(S.tilt, 0.02) - 0.02)], rot: (S) => S.tilt, s: () => gnParts.trunk() },
    { name: 'crown', parent: 'trunk', pivot: [48, 38], at: (S) => [0, -78 + S.y], rot: (S) => S.crown, s: () => gnParts.crown() },
    { name: 'face', parent: 'trunk', pivot: [25, 16], at: (S) => [4, -64 + S.y * 0.8], s: (a) => gnParts.face(a.face, a.atk) },
    { name: 'armF', parent: 'trunk', pivot: [11, 4], at: (S) => [28, -42 + S.y], rot: (S) => S.armF, s: () => gnParts.arm(false) },
  ],
  fx(ctx, m, a, S, mat) {
    // The heart knot's glow, pulsing.
    if (m.hp > 0) inPart(ctx, mat, 'trunk', () => {
      const p = 0.5 + 0.5 * Math.sin(a.t * 3);
      const g = ctx.createRadialGradient(2, -24, 2, 2, -24, 16 + p * 4);
      g.addColorStop(0, `rgba(220,170,255,${(0.45 + 0.25 * p) * a.alpha})`);
      g.addColorStop(1, 'rgba(184,108,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-22, -48, 48, 48);
    });
    // The slam: dust bursting out from under both palms, then a shock of leaves and purple spores
    // out along the floor.
    if (a.ph.since >= 0.04 && a.ph.since < 0.6) {
      const u = (a.ph.since - 0.04) / 0.56;
      const e = 1 - (1 - u) * (1 - u);
      for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
        ctx.globalAlpha = a.alpha * (1 - u) * 0.75;
        ctx.fillStyle = k % 2 ? '#e8dccc' : '#d8c8b4';
        ctx.beginPath();
        ctx.arc(side * (54 + e * (8 + k * 7)), -3 - e * (3 + k * 2.5), 2.6 + e * (3 + k), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (a.ph.since >= 0 && a.ph.since < 0.5) {
      const u = a.ph.since / 0.5;
      ctx.globalAlpha = a.alpha * (1 - u);
      for (let k = 0; k < 8; k++) {
        const sx = (k % 2 ? 1 : -1) * (20 + u * 50 + k * 4);
        ctx.fillStyle = k % 3 ? PURP : '#7fc06a';
        ctx.beginPath();
        ctx.arc(sx, -4 - Math.sin(u * Math.PI) * (10 + k * 2), 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  rootling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [45, 190, 140], draw: imp },
  sporecap: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [65, 250, 190], draw: shaman },
  thornback: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 310, 230], draw: bear },
  sporeling: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [40, 170, 120], draw: mite },
  sapling: { pad: 6, walk: 8, idle: 6, attack: 4, cycle: 2.4, atkMs: [60, 240, 180], draw: sapling },
  mothercapper: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [80, 150, 420, 220], draw: myconidQueen, rig: { w: 90, h: 100, draw: drawQueen } },
  tuskar: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [70, 150, 380, 220], draw: boar, rig: tuskarRig },
  gnarlroot: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 22, atkMs: [90, 160, 520, 260], draw: gnarl, rig: gnarlRig },
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
