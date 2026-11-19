// Monster art: the Dream Theatre's players (the levels 40-45 group dungeon, see
// docs/design/dream-theatre.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign):
// chibi theatre creatures, each its own silhouette, every one standing in a soft spotlight pool.
//   understudy   Understudy Ghost: a round sheet ghost in a comedy half-mask, clutching its
//                script; swoops forward in a dramatic lunge.
//   chorusgirl   Chorus Flamingo: a flamingo showgirl in a feather headdress with a fan; high
//                kicks.
//   stagehand    Stagehand Mole: a chubby mole in a hard hat and overalls; swings a big wrench.
// Chapter 9 (2026-11-19) made the train and the office acts the Queen's old life; their monsters
// are live rigs in commuterigs.js (the Rush-Hour Penguin, the Sleepy Commuter Sheep, the Sticky Note
// Bird, the Stapler Croc; mob ids paperdragon, sleepysheep, prompter, primadonna). The old Prima
// Donna Frog, Paper Dragon and Prompter Bat drawings are gone.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { penguinRig, penguinStill, sleepySheepRig, sleepySheepStill, stickyBirdRig, stickyBirdStill, staplerCrocRig, staplerCrocStill } from './commuterigs.js';
import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// The spotlight pool on the floor under a player.
export const spot = (x, y, w) => [F(O(x, y, w, w * 0.18, 0, '#fff4d8', 20)), F(O(x, y, w * 0.6, w * 0.1, 0, '#fffaf0', 16))];
// A comedy half-mask (gold, smiling eyes).
function mask(x, y, k, c = '#ffd36b') {
  return [T([[x - 5 * k, y - 1.6 * k], [x - 2 * k, y - 3 * k], [x, y - 2 * k], [x + 2 * k, y - 3 * k], [x + 5 * k, y - 1.6 * k], [x + 4.4 * k, y + 1.6 * k], [x, y + 1 * k], [x - 4.4 * k, y + 1.6 * k]], c),
    F(T([...arcPts(x - 2.4 * k, y, 1.4 * k, 0.9 * k, 200, 340, 5)], '#3a2a1a')), F(T([...arcPts(x + 2.4 * k, y, 1.4 * k, 0.9 * k, 200, 340, 5)], '#3a2a1a')), F(E(x - 3.6 * k, y - 1.6 * k, 0.8 * k, 0.5 * k, '#fff6c8'))];
}

// ---------- Understudy Ghost ----------

const GHOST_ATK = [
  { dx: -3, dy: -2, lean: -14, arms: 1 },
  { dx: 7, dy: 2, lean: 18, arms: -1, smear: 1 },
  { dx: 8, dy: 2, lean: 16, arms: -1, hit: 1 },
  { dx: 2, dy: 0, lean: 2, arms: 0 },
];

function ghost(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? GHOST_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const sheet = ramp('#f4f0ff', { step: 9, turn: 14 });
  const out = [...spot(18, 38, 13)];
  const bob = dead ? 0 : walk ? Math.sin(TAU * q * 2) * 1.8 : -breath(q) * 1.6;
  const cx = 18 + (A ? A.dx : 0);
  const cy = (dead ? 30 : 16) + bob + (A ? A.dy : 0);
  const lean = dead ? 90 : A ? A.lean : walk ? 10 : sway(q) * 4;
  const body = [];
  // The sheet: a round dome flowing down into a wavy hem that ripples as it floats.
  const hem = [];
  for (let i = 0; i <= 8; i++) {
    const x = cx - 10 + i * 2.5;
    hem.push([x, cy + 14 + Math.sin(TAU * q * 2 + i * 1.3) * 1.6 + (i % 2 ? 2 : 0)]);
  }
  body.push(T([...arcPts(cx, cy, 10, 10, 180, 360, 14), [cx + 10, cy + 12], ...hem.reverse(), [cx - 10, cy + 12]], sheet.base));
  body.push(crescent(cx, cy + 4, 10, 12, sheet.sh, { k: 0.3, a0: 120, a1: 230 }), shine(cx, cy, 10, 10, '#ffffff', -10, 1));
  // Little sheet arms, flung up for the wind-up, out in the lunge; the script in one.
  const ar = A ? A.arms : walk ? Math.sin(TAU * q * 2) * 0.3 : 0;
  body.push(...limb([cx - 7, cy + 4], [cx - 12, cy + 2 - ar * 6], 4, 3, sheet.sh), ...limb([cx + 7, cy + 4], [cx + 12, cy + 4 - ar * 6], 4, 3, sheet.base));
  body.push(R(cx + 9, cy + 1 - ar * 6, 6, 7, '#fff6dc'), F(R(cx + 9, cy + 1 - ar * 6, 1.2, 7, '#c88a5a')), F(R(cx + 11, cy + 3 - ar * 6, 3, 0.5, '#c9b8a8')), F(R(cx + 11, cy + 5 - ar * 6, 3, 0.5, '#c9b8a8')));
  body.push(...cuteFace(cx + 1.4, cy + 1.6, 0.9, mood, { iris: '#6a5ad8', gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: sheet.base, mouthDy: 3.6 }));
  body.push(...mask(cx + 1.4, cy - 4.4, 0.9));
  out.push(...spin(body, cx, cy + 8, lean));
  if (A?.smear) out.push(smear([[cx - 14, cy + 10], [cx, cy + 12], [cx + 16, cy + 8]], 6, '#ffffff'));
  if (A?.hit) out.push(...star(cx + 16, cy + 6, 3, '#fff6a8'));
  return { w: 40, h: 40, res: 3, shapes: out };
}

// ---------- Chorus Flamingo ----------

const FLAM_ATK = [
  { kick: -0.6, lean: -8, fan: 1 },
  { kick: 1, lean: 12, fan: 0, smear: 1 },
  { kick: 1.1, lean: 14, fan: 0, hit: 1 },
  { kick: 0.2, lean: 2, fan: 0.5 },
];

function flamingo(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? FLAM_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const pink = ramp('#ff8ab4', { step: 10, turn: 12 });
  const leg = '#ff6b8a';
  const out = [...spot(18, 44, 12)];
  // A strutting can-can step: one leg kicks high each stride; idle she sways her fan.
  const kick = A ? A.kick : walk ? Math.max(0, Math.sin(TAU * q * 2)) : 0;
  const cx = 17;
  const cy = (dead ? 34 : 24) - (walk ? Math.abs(Math.sin(TAU * q * 2)) : breath(q) * 0.6);
  const lean = dead ? 86 : A ? A.lean : walk ? 4 : sway(q) * 3;
  const body = [];
  // Legs: one planted, one kicking forward, with knobbly knees.
  body.push(...limb([cx - 1, cy + 6], [cx - 1, cy + 13], 1.6, 1.4, leg), ...limb([cx - 1, cy + 13], [cx - 1, 44 - (dead ? 6 : 0)], 1.4, 1.2, leg), F(E(cx + 0.4, 44.2 - (dead ? 6 : 0), 2, 0.8, leg)));
  const kx = cx + 3 + kick * 10;
  const ky = 44 - kick * 16;
  body.push(...limb([cx + 2, cy + 6], [cx + 3 + kick * 4, cy + 13 - kick * 6], 1.6, 1.4, leg), ...limb([cx + 3 + kick * 4, cy + 13 - kick * 6], [kx, ky], 1.4, 1.2, leg), F(E(kx + 1, ky, 2, 0.8, leg)));
  // Body: a round pink puff with a frilly feather skirt.
  body.push(...blob(cx, cy, 8.4, 7, pink));
  for (let i = 0; i < 6; i++) body.push(E(cx - 8 + i * 3, cy + 5.6 + (i % 2), 2.6, 2, i % 2 ? '#ffd0e4' : pink.hi));
  // The neck: a long S curve up to a round head with a dark-tipped bill.
  const neck = chain(cx + 5, cy - 4, -70, [4, 4, 4], dead ? () => 20 : (i) => (i === 1 ? -50 : i === 2 ? 60 : 0) + (walk ? Math.sin(TAU * q * 2 - i) * 6 : 0));
  body.push(strand(neck, 3, pink.base));
  const [hx, hy] = neck.at(-1);
  body.push(...blob(hx, hy - 2, 5, 4.6, pink), T([[hx + 4, hy - 2], [hx + 10, hy], [hx + 8, hy + 2], [hx + 4, hy + 1]], '#fff0d4'), F(T([[hx + 8, hy - 0.6], [hx + 10, hy], [hx + 8, hy + 2]], '#3a2a3a')));
  body.push(...cuteFace(hx + 0.6, hy - 2.4, 0.7, mood, { iris: '#c03a7a', gap: 3.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: pink.base, mouthDy: null, lash: 1.4, wing: 1.2 }));
  // The showgirl headdress: a fan of plumes over the head.
  for (let i = 0; i < 5; i++) {
    const a = -150 + i * 22;
    const pl = chain(hx - 1, hy - 6, a, [3, 3, 2.6], wave(TAU * q * 2 + i, 8, 0.8));
    body.push(strand(pl, (t) => 2.6 * (1 - t * 0.3), i % 2 ? '#ffe36b' : '#ffffff'));
  }
  body.push(E(hx - 1, hy - 6, 1.6, 1.6, '#7fd8ff'));
  // The wing holds a folding fan, open and fluttering.
  const fan = A ? A.fan : 0.5 + Math.sin(TAU * q) * 0.3;
  const fx = cx - 4;
  const fy = cy - 2 - fan * 3;
  body.push(T([[fx, fy + 4], ...arcPts(fx, fy + 4, 7, 7, 200, 320, 6)], '#c9a6ff'));
  for (let i = 0; i < 5; i++) body.push(F(T([[fx, fy + 4], ...arcPts(fx, fy + 4, 7, 7, 204 + i * 24, 214 + i * 24, 2)], '#e6dcff')));
  body.push(...blob(cx - 3, cy + 1, 4, 3.4, pink, { lit: 0 }));
  out.push(...spin(body, cx, 44, lean));
  if (A?.smear) out.push(smear([[cx + 4, 42], [cx + 10, 34], [cx + 14, 26]], 4, '#ffe0ee'));
  if (A?.hit) out.push(...star(cx + 15, 27, 3, '#fff6a8'));
  return { w: 36, h: 46, res: 3, shapes: out };
}

// ---------- Stagehand Mole ----------

const MOLE_ATK = [
  { swing: -160, lean: -10 },
  { swing: -30, lean: 10, smear: 1 },
  { swing: 20, lean: 12, hit: 1 },
  { swing: -60, lean: 0 },
];

function mole(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MOLE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#8a7a9a', { step: 10, turn: 12 });
  const denim = ramp('#4f7ad8', { step: 10 });
  const out = [...spot(18, 36, 13)];
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 17;
  const cy = (dead ? 10 : 0) - Math.abs(step) * 0.8 + (pose === 'idle' ? -breath(q) * 0.6 : 0);
  const lean = dead ? 84 : A ? A.lean : walk ? step * 4 : 0;
  const body = [];
  for (const [ox, s, c] of [[-3, step, denim.sh], [3, -step, denim.base]]) body.push(...limb([cx + ox, cy + 27], [cx + ox + Math.max(0, s) * 2, 34 - Math.max(0, s) * 1.6], 4, 3.6, c), O(cx + ox + 1 + Math.max(0, s) * 2, 35 - Math.max(0, s) * 1.6, 3, 1.4, 0, '#5a4a3a', 12));
  body.push(...blob(cx, cy + 21, 9, 8, fur));
  body.push(R(cx - 7, cy + 18, 14, 10, denim.base), F(R(cx + 5, cy + 18, 2, 10, denim.sh)), R(cx - 4, cy + 14, 8, 5, denim.base), F(E(cx - 2.6, cy + 15, 0.8, 0.8, '#ffd36b')), F(E(cx + 2.6, cy + 15, 0.8, 0.8, '#ffd36b')));
  // Head: round, a long pink snout, big digging paws.
  const hx = cx + 1;
  const hy = cy + 9;
  body.push(...blob(hx, hy, 7.4, 6.6, fur), ...limb([hx + 5, hy + 2], [hx + 10, hy + 3], 3.6, 2.4, '#ffb8c8'), F(E(hx + 10.4, hy + 3, 1.2, 1, '#ff6b8a')));
  body.push(...cuteFace(hx + 1.4, hy - 0.4, 0.8, mood, { iris: '#3a2a3a', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fur.base, mouthDy: 4.2 }));
  // Hard hat with a lamp.
  body.push(T([...arcPts(hx - 0.4, hy - 2, 7.4, 6.4, 180, 360, 12)], '#ffd36b'), R(hx - 9, hy - 2.4, 18, 1.8, '#e8b84a'), E(hx + 4, hy - 6, 1.8, 1.8, '#fff6c8'));
  // The wrench: a big spanner swung overhead and down.
  const sw = A ? A.swing : walk ? -70 + step * 8 : -70 + sway(q) * 6;
  const sh = [cx + 6, cy + 17];
  const hand = [sh[0] + Math.cos(sw * D2R) * 6, sh[1] + Math.sin(sw * D2R) * 6];
  const tip = [hand[0] + Math.cos(sw * D2R) * 12, hand[1] + Math.sin(sw * D2R) * 12];
  body.push(...limb(sh, hand, 3.4, 3, fur.base), ...limb(hand, tip, 2.2, 2.4, '#b8c0d8'), O(tip[0], tip[1], 3.4, 3.4, sw, '#b8c0d8'), F(O(tip[0] + Math.cos(sw * D2R) * 1.4, tip[1] + Math.sin(sw * D2R) * 1.4, 1.6, 1.6, sw, '#f4f0ff')), E(hand[0], hand[1], 2.4, 2.2, '#ffb8c8'));
  out.push(...spin(body, cx, 34, lean));
  if (A?.smear) out.push(smear([[cx - 2, cy - 6], [cx + 12, cy + 2], [tip[0] + 2, tip[1]]], 5, '#f0f4ff'));
  if (A?.hit) out.push(...star(tip[0] + 3, tip[1] + 2, 3, '#fff6a8'));
  return { w: 38, h: 38, res: 3, shapes: out };
}

export const ART = {
  understudy: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 180], draw: ghost },
  chorusgirl: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 210, 170], draw: flamingo },
  stagehand: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [60, 210, 170], draw: mole },
  rushpenguin: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 6, atkMs: [80, 240, 180], draw: penguinStill, rig: penguinRig },
  sleepysheep: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 5, atkMs: [100, 280, 200], draw: sleepySheepStill, rig: sleepySheepRig },
  stickybird: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 5, atkMs: [70, 220, 170], draw: stickyBirdStill, rig: stickyBirdRig },
  staplercroc: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 6, atkMs: [90, 260, 190], draw: staplerCrocStill, rig: staplerCrocRig },
};

export const INFO = {
  understudy: { name: 'Understudy Ghost', w: 26, h: 34 },
  chorusgirl: { name: 'Chorus Flamingo', w: 24, h: 42 },
  stagehand: { name: 'Stagehand Mole', w: 26, h: 34 },
  rushpenguin: { name: 'Rush-Hour Penguin', w: 26, h: 36 },
  sleepysheep: { name: 'Sleepy Commuter Sheep', w: 28, h: 36 },
  stickybird: { name: 'Sticky Note Bird', w: 24, h: 28 },
  staplercroc: { name: 'Stapler Croc', w: 30, h: 30 },
};
