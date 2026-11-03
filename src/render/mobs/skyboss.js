// Monster art: the Sky Whale's bosses (docs/design/sky-whale.md), redrawn creature-first and big
// (2026-11-03): chibi at two and a half to three times the hero's height, each with one signature
// shape.
//   gale         Captain Gale: a red panda sky-pirate captain, a huge feathered tricorn, a long coat
//                streaming in the wind, a cutlass and a spyglass, a compass at her throat; a wide
//                cutlass sweep.
//   matriarch    The Barnacle Matriarch: a grand snail queen in a barnacle-crusted conch shell, a
//                kelp crown and a coral staff; she raises the staff and a wave of shells rolls out.
//   whaledream   The Whale's Dream: the whale's own spirit, a translucent baby sky whale with stars
//                inside her, heavy with sleep, drifting; she rolls and slaps down her tail.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { windLines, cloudPuff } from './skyfolk.js';
import { star5 } from './astral.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// ---------- Captain Gale ----------

const GALE_ATK = [
  { blade: -170, lean: -10 },
  { blade: -60, lean: 10, smear: 1 },
  { blade: 30, lean: 16, hit: 1 },
  { blade: 40, lean: 14 },
  { blade: -40, lean: 2 },
];

function gale(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? GALE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#e0603a', { step: 10, turn: 10 });
  const coat = ramp('#3a4a8a', { step: 10, turn: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 50;
  const cy = (dead ? 30 : 26) - Math.abs(step) * 2 - breath(q);
  const lean = dead ? 86 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  if (!dead) out.push(...windLines(cx - 34, cy + 40, q, 4, 18));
  const body = [];
  // A ringed tail streaming behind.
  const tl = chain(cx - 16, cy + 56, 190, [8, 8, 7, 6], wave(TAU * q * 2, 14, 0.8));
  body.push(strand(tl, (t) => 11 * (1 - t * 0.2), fur.base));
  for (let i = 1; i < tl.length; i++) body.push(F(E(tl[i][0], tl[i][1], 4.6, 4.6, i % 2 ? '#8a3a2a' : '#f0a070')));
  for (const [ox, s, c] of [[-8, step, '#3a2a2a'], [8, -step, '#4a3a3a']]) body.push(...limb([cx + ox, cy + 62], [cx + ox + Math.max(0, s) * 4, 104 - Math.max(0, s) * 3], 8, 7, c), O(cx + ox + 3 + Math.max(0, s) * 4, 105 - Math.max(0, s) * 3, 7, 3, 0, '#2a1a1a', 14));
  // The long coat, its tails streaming in the wind; gold buttons; a compass at her throat.
  const ct = chain(cx - 10, cy + 50, 150, [10, 10], wave(TAU * q * 2, 10, 0.8));
  body.push(T([[cx - 16, cy + 30], [cx + 16, cy + 30], [cx + 18, cy + 66], [ct.at(-1)[0], ct.at(-1)[1]], [cx - 18, cy + 64]], coat.base), F(T([[cx + 10, cy + 30], [cx + 16, cy + 30], [cx + 18, cy + 66], [cx + 12, cy + 66]], coat.sh)));
  body.push(...blob(cx + 2, cy + 44, 14, 16, ramp('#fff0e0', { step: 8 })), F(R(cx - 2, cy + 30, 3, 34, '#e8b84a')));
  for (let i = 0; i < 4; i++) body.push(F(E(cx + 6, cy + 34 + i * 8, 1.6, 1.6, '#ffd36b')));
  body.push(E(cx + 4, cy + 30, 4, 4, '#e8b84a'), F(E(cx + 4, cy + 30, 2.6, 2.6, '#fff6dc')), F(T([[cx + 4, cy + 28], [cx + 5, cy + 30], [cx + 4, cy + 32], [cx + 3, cy + 30]], '#e0303e')));
  // Head: a round red panda face with white cheek marks and round ears, the great tricorn.
  const hx = cx + 4;
  const hy = cy + 10;
  body.push(E(hx - 14, hy - 10, 5, 5, fur.sh), F(E(hx - 14, hy - 10, 2.6, 2.6, '#fff0e0')), E(hx + 13, hy - 11, 5, 5, fur.base), F(E(hx + 13, hy - 11, 2.6, 2.6, '#fff0e0')));
  body.push(...blob(hx, hy, 18, 16, fur), F(O(hx + 8, hy + 6, 9, 6, 0, '#fff0e0', 14)), F(O(hx - 6, hy + 4, 4, 3, 0, '#fff0e0', 12)), E(hx + 16, hy + 3, 2, 1.6, '#2a1a1a'));
  body.push(...cuteFace(hx + 4, hy, 2.2, mood, { iris: '#3a7ad8', gap: 5.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: 3.8, lash: 1.6, wing: 1.6 }));
  body.push(T([[hx - 26, hy - 8], [hx, hy - 30], [hx + 26, hy - 8], [hx, hy - 14]], '#2a2a40'), F(T([[hx - 22, hy - 10], [hx, hy - 27], [hx + 22, hy - 10], [hx, hy - 15]], '#3a3a58')), F(R(hx - 16, hy - 16, 32, 2, '#e8b84a')));
  const plume = chain(hx - 6, hy - 24, -140, [8, 8, 7], wave(TAU * q * 2, 14, 0.8));
  body.push(strand(plume, (t) => 7 * (1 - t * 0.5), '#ffffff'), strand(plume.map(([x, y]) => [x + 1, y + 1.6]), (t) => 2.4 * (1 - t), '#d8e0ff'));
  // The spyglass on her belt, and the cutlass swung in a wide sweep.
  body.push(...limb([cx - 14, cy + 50], [cx - 4, cy + 54], 3, 3, '#e8b84a'));
  const ba = A ? A.blade : walk ? -50 + step * 6 : -50 + sway(q) * 4;
  const hand = [cx + 18, cy + 38];
  const dir = [Math.cos(ba * D2R), Math.sin(ba * D2R)];
  const tip = [hand[0] + dir[0] * 34, hand[1] + dir[1] * 34];
  body.push(...limb([cx + 10, cy + 34], hand, 7, 6, coat.base), T([[hand[0] - dir[1] * 3, hand[1] + dir[0] * 3], [tip[0] + dir[1] * 2, tip[1] - dir[0] * 2], [tip[0], tip[1]], [hand[0] + dir[1] * 1, hand[1] - dir[0] * 1]], '#eef4ff'), F(T([[hand[0], hand[1]], [tip[0], tip[1]], [hand[0] + dir[1] * 1, hand[1] - dir[0] * 1]], '#ffffff')));
  body.push(strand(arcPts(hand[0], hand[1], 5, 5, ba + 90, ba + 270, 8), 1.6, '#e8b84a'));
  out.push(...spin(body, cx, 104, lean));
  if (A?.smear) out.push(smear(arcPts(hand[0] - 4, hand[1], 36, 36, -150, 20, 12), 10, '#eef4ff'));
  if (A?.hit) out.push(...star(tip[0] + 4, tip[1], 7, '#fff6a8'));
  return { w: 118, h: 110, res: 3, shapes: out };
}

// ---------- The Barnacle Matriarch ----------

const SNAIL_ATK = [
  { staff: -140, rise: 4, wave: 0 },
  { staff: -20, rise: -1, wave: 0.6, smear: 1 },
  { staff: 10, rise: -2, wave: 1.2, hit: 1 },
  { staff: 0, rise: -1, wave: 1.6 },
  { staff: -60, rise: 0, wave: 0.3 },
];

function matriarch(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SNAIL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#9fd8c8', { step: 10, turn: 12 });
  const shell = ramp('#f4c8a0', { step: 10, turn: 10 });
  const slide = walk ? Math.sin(TAU * q * 2) : 0;
  const rise = A ? A.rise : breath(q);
  const cx = 52;
  const out = [];
  // The foot: a long soft body along the floor, rippling as she glides.
  const foot = [];
  for (let i = 0; i <= 12; i++) {
    const x = cx - 40 + i * 6;
    foot.push([x, 100 - Math.sin(i * 0.9 - TAU * q * 2) * (walk ? 1.4 : 0.6)]);
  }
  out.push(T([...foot, [cx + 32, 106], [cx - 40, 106]], skin.base), F(T([...foot.map(([x, y]) => [x, y + 3]), [cx + 32, 106], [cx - 40, 106]], skin.sh)));
  // The great conch shell on her back: a spiral, striped, crusted with barnacles.
  const sx = cx - 14;
  const sy = 66 - rise;
  out.push(O(sx, sy, 30, 30, 0, shell.base, 28), crescent(sx, sy, 30, 30, shell.sh, { k: 0.26 }));
  for (const [r, c] of [[22, shell.sh], [15, shell.base], [9, shell.sh], [4, shell.hi]]) out.push(F(O(sx + (30 - r) * 0.3, sy + (30 - r) * 0.2, r, r, 0, c, 22)));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    out.push(F(strand(arcPts(sx, sy, 28 - i, 28 - i, (a * 180) / Math.PI, (a * 180) / Math.PI + 30, 4), 1.6, '#e89070')));
  }
  for (const [x, y, r] of [[-18, -14, 4], [-24, 4, 3.4], [-6, -24, 3], [12, -16, 2.6], [-14, 18, 3]]) out.push(E(sx + x, sy + y, r, r, '#f0ece0'), F(E(sx + x, sy + y - 0.6, r * 0.4, r * 0.4, '#8a7a6a')));
  out.push(shine(sx, sy, 30, 30, '#ffffff', -10, 1));
  // Her body rising out of the shell's mouth, head on top with eye-stalk curls and a kelp crown.
  const bx = cx + 14;
  const by = 66 - rise;
  out.push(...limb([bx, 100], [bx + 2, by + 10], 20, 16, skin.base));
  out.push(...blob(bx + 2, by, 17, 16, skin));
  for (const s of [-1, 1]) {
    const st = chain(bx + s * 6, by - 14, -90 + s * 16, [6, 6], wave(TAU * q * 2 + s, 10, 0.8));
    out.push(strand(st, 3, skin.base), E(st.at(-1)[0], st.at(-1)[1], 3, 3, skin.hi));
  }
  for (let i = 0; i < 5; i++) out.push(strand(chain(bx - 10 + i * 5, by - 14, -100 + i * 6, [5, 5], wave(TAU * q * 2 + i, 12, 0.8)), (t) => 3.4 * (1 - t * 0.4), i % 2 ? '#3a9a6a' : '#5ac08a'));
  out.push(T([[bx - 9, by - 14], [bx - 7, by - 22], [bx - 3, by - 16], [bx + 1, by - 24], [bx + 5, by - 16], [bx + 9, by - 22], [bx + 11, by - 14]], '#ffd36b'), F(E(bx + 1, by - 17, 1.6, 1.6, '#ff8aa8')));
  out.push(...cuteFace(bx + 6, by + 2, 2.2, mood, { iris: '#2a8a8a', lip: '#c05a7a', gap: 5.4, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: skin.base, mouthDy: 3.6, lash: 1.8, wing: 1.8 }));
  // The coral staff in a small arm.
  const sa = A ? A.staff : -70 + (walk ? slide * 4 : sway(q) * 4);
  const hand = [bx + 16, by + 16];
  const dir = [Math.cos(sa * D2R), Math.sin(sa * D2R)];
  const top = [hand[0] + dir[0] * 30, hand[1] + dir[1] * 30];
  out.push(...limb([bx + 8, by + 14], hand, 5, 4.4, skin.base), ...limb([hand[0] - dir[0] * 10, hand[1] - dir[1] * 10], top, 3, 2, '#ff7a8a'));
  for (const [u, a] of [[0.6, 50], [0.85, -40], [1, 30]]) {
    const x = hand[0] + dir[0] * 30 * u;
    const y = hand[1] + dir[1] * 30 * u;
    out.push(...limb([x, y], [x + Math.cos((sa + a) * D2R) * 6, y + Math.sin((sa + a) * D2R) * 6], 2, 1.4, '#ff9aa8'));
  }
  if (A?.smear) out.push(smear([[bx + 10, by - 30], [bx + 30, by - 10], [bx + 40, by + 30]], 8, '#ffe6ea'));
  if (A?.wave) {
    const k = A.wave;
    for (let i = 0; i < 4; i++) out.push(O(cx + 40 + k * 10 + i * 7, 100 - Math.abs(1.5 - i) * 3 * k, 4, 3, i * 30, i % 2 ? '#f4c8a0' : '#9fe0f0', 12));
    out.push(F(T([...arcPts(cx + 50 + k * 10, 104, 16 * k, 10 * k, 180, 360, 12)], '#bff0ff')));
  }
  if (A?.hit) out.push(...star(cx + 60, 98, 7, '#fff6a8'));
  return { w: 124, h: 108, res: 3, shapes: dead ? spin(out, cx, 106, 0) : out };
}

// ---------- The Whale's Dream ----------

const WHALE_ATK = [
  { roll: -20, rise: 8, tail: -40 },
  { roll: 20, rise: -4, tail: 40, smear: 1 },
  { roll: 26, rise: -6, tail: 60, hit: 1 },
  { roll: 18, rise: -4, tail: 40 },
  { roll: 0, rise: 0, tail: 0 },
];

function whaledream(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? WHALE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const blue = ramp('#9fd0ff', { step: 10, turn: 14 });
  const drift = walk ? Math.sin(TAU * q * 2) * 3 : -breath(q) * 3;
  const cx = 60;
  const cy = (dead ? 76 : 56) + (A ? -A.rise : drift);
  const roll = dead ? 20 : A ? A.roll : walk ? Math.sin(TAU * q * 2) * 4 : sway(q) * 3;
  const out = [];
  // Clouds she drifts through, below her.
  if (!dead) out.push(...cloudPuff(cx - 20, 98, 10, '#f0f6ff'), ...cloudPuff(cx + 26, 100, 8, '#f0f6ff'));
  const body = [];
  // The tail: a fluke on a curving stock, slapping down on the attack.
  const ta = A ? A.tail : Math.sin(TAU * q * 2) * 10;
  const stock = chain(cx - 30, cy + 4, 180, [10, 10], (i) => (i ? -ta * 0.5 : ta * 0.3));
  body.push(strand(stock, (t) => 18 - t * 10, blue.sh));
  const tp = stock.at(-1);
  body.push(...spin([T([[tp[0], tp[1]], [tp[0] - 16, tp[1] - 12], [tp[0] - 10, tp[1]], [tp[0] - 16, tp[1] + 12]], blue.base), F(T([[tp[0], tp[1]], [tp[0] - 12, tp[1] - 8], [tp[0] - 8, tp[1]]], blue.hi))], tp[0], tp[1], ta * 0.4));
  // The body: a big round baby whale, a pale belly with grooves, translucent with stars inside.
  body.push(O(cx, cy, 36, 26, 0, blue.base, 30), crescent(cx, cy, 36, 26, blue.sh, { k: 0.26, a0: 40, a1: 200 }));
  body.push(F(T([...arcPts(cx + 4, cy + 4, 32, 21, 10, 170, 16)], '#e6f4ff')));
  for (let i = 0; i < 4; i++) body.push(F(strand(arcPts(cx + 6, cy + 6, 26 - i * 3, 14 - i * 2, 30, 150, 10), 0.8, '#c8e0f8')));
  for (const [x, y, r] of [[-18, -10, 2.6], [-6, -16, 2], [8, -12, 2.4], [-24, 2, 1.8], [18, -4, 1.6]]) body.push(star5(cx + x, cy + y, r, r > 2.2 ? '#ffe36b' : '#ffffff'));
  body.push(shine(cx, cy, 36, 26, '#ffffff', -10, 1.2));
  // A little flipper, and her sleepy face up front; a blowhole spray of stars.
  body.push(...spin([O(cx + 6, cy + 18, 10, 4, 30, blue.sh, 16)], cx + 2, cy + 16, Math.sin(TAU * q * 2) * 16));
  const sleepy = mood === 'idle' && !A ? 'blink' : mood;
  body.push(...cuteFace(cx + 20, cy + 2, 2.4, A ? mood : sleepy, { iris: '#3a7ad8', gap: 7, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: blue.base, mouthDy: 4, lash: 1.6 }));
  if (!dead) for (let i = 0; i < 3; i++) {
    const u = (q + i / 3) % 1;
    body.push(star5(cx + 4 + Math.sin(u * 6 + i) * 4, cy - 26 - u * 16, 1.6 + u, '#ffffff'));
  }
  if (!A && mood === 'idle' && !dead) for (let i = 0; i < 2; i++) body.push(F(T([[cx + 38 + i * 5, cy - 14 - i * 6], [cx + 42 + i * 5, cy - 14 - i * 6], [cx + 38 + i * 5, cy - 10 - i * 6], [cx + 42 + i * 5, cy - 10 - i * 6]], '#c8d8ff')));
  out.push(...spin(body, cx, cy, roll));
  if (A?.smear) out.push(smear(arcPts(cx - 34, cy, 30, 30, -100, 60, 10), 10, '#e6f4ff'));
  if (A?.hit) out.push(...star(cx - 30, cy + 30, 8, '#fff6a8'), ...cloudPuff(cx - 34, 98, 8, '#ffffff'));
  return { w: 132, h: 112, res: 3, shapes: out };
}

export const ART = {
  gale: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 320, 220], draw: gale },
  matriarch: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [110, 180, 340, 240], draw: matriarch },
  whaledream: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [110, 180, 340, 240], draw: whaledream },
};

export const INFO = {
  gale: { name: 'Captain Gale', w: 64, h: 100 },
  matriarch: { name: 'The Barnacle Matriarch', w: 80, h: 96 },
  whaledream: { name: "The Whale's Dream", w: 90, h: 90 },
};
