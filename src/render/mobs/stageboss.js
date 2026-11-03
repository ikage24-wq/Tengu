// Monster art: the Dream Theatre's bosses (docs/design/dream-theatre.md), redrawn creature-first
// and big (2026-11-03): chibi stage creatures at two and a half to three times the hero's height,
// each with one signature shape, each in her own spotlight.
//   persona      Persona, the Two-Faced Muse: a round cat whose coat is split down the middle,
//                gold on one side and blue on the other, holding the mask of Comedy in one paw and
//                Tragedy in the other; she swings both masks round in a sweeping slash.
//   directrice   Madame Directrice: a parrot director in a beret and a long striped scarf, a
//                megaphone in one wing and the clapperboard in the other; she bellows through the
//                megaphone and snaps the board.
//   playwright   The Phantom Playwright: an ink phantom rising out of a giant inkwell, a great
//                quill in his hand and script pages whirling round him; he writes a stroke of ink
//                across the stage.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, ink, cuteFace, blob } from './critter.js';
import { spot } from './stage.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// A theatre mask: comedy (smiling, gold) or tragedy (frowning, blue), k its size.
function stageMask(x, y, k, comedy, deg = 0) {
  const c = comedy ? '#ffd36b' : '#7fa8ff';
  const d = comedy ? '#e0a83a' : '#4f78d8';
  const s = [O(x, y, 7 * k, 8 * k, 0, c, 20), crescent(x, y, 7 * k, 8 * k, d, { k: 0.3 })];
  for (const ex of [-2.6, 2.6]) s.push(F(T(arcPts(x + ex * k, y - 1.6 * k, 1.8 * k, 1.2 * k, comedy ? 200 : 20, comedy ? 340 : 160, 6).concat([[x + ex * k, y - 1.6 * k]]), '#2a1a3a')));
  s.push(F(T([...arcPts(x, y + 3 * k, 3.4 * k, 1.8 * k, comedy ? 10 : 190, comedy ? 170 : 350, 8)], '#2a1a3a')));
  if (!comedy) s.push(F(E(x + 3.4 * k, y + 1 * k, 0.8 * k, 1.4 * k, '#bff0ff')));
  s.push(strand([[x - 7 * k, y - 2 * k], [x - 10 * k, y + 2 * k], [x - 9 * k, y + 6 * k]], 1 * k, comedy ? '#ff6b9a' : '#9a5ad8'));
  return spin(s, x, y, deg);
}

// ---------- Persona, the Two-Faced Muse ----------

const CAT_ATK = [
  { swing: -1, lean: -8, rise: 2 },
  { swing: 0.6, lean: 10, rise: -1, smear: 1 },
  { swing: 1, lean: 14, rise: -2, hit: 1 },
  { swing: 1, lean: 12, rise: -1.6 },
  { swing: 0.2, lean: 2, rise: 0 },
];

function persona(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? CAT_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const gold = ramp('#ffd88a', { step: 10, turn: 12 });
  const blue = ramp('#9fb8f0', { step: 10, turn: 12 });
  const out = [...spot(52, 106, 34)];
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 50;
  const cy = (dead ? 74 : 66) - (A ? A.rise : walk ? Math.abs(step) * 1.6 : breath(q) * 1.4);
  const lean = dead ? 84 : A ? A.lean : walk ? step * 3 : sway(q) * 2;
  const body = [];
  // Tail: a long curl, the gold side's colour, with a bow.
  const tl = chain(cx - 18, cy + 22, 200, [7, 7, 6, 5], dead ? () => 8 : (i) => (i ? -26 : 0) + Math.sin(TAU * q * 2 - i) * 8);
  body.push(strand(tl, (t) => 6 * (1 - t * 0.4), gold.sh), T([[tl.at(-1)[0], tl.at(-1)[1]], [tl.at(-1)[0] - 5, tl.at(-1)[1] - 4], [tl.at(-1)[0] - 5, tl.at(-1)[1] + 4]], '#ff6b9a'));
  // Feet and a round body in a split gown (gold left, blue right).
  for (const [ox, s] of [[-8, step], [8, -step]]) body.push(O(cx + ox + Math.max(0, s) * 3, 104 - Math.max(0, s) * 3, 7, 3.6, 0, ox < 0 ? gold.sh : blue.base, 14));
  body.push(T([[cx - 14, cy + 14], [cx + 14, cy + 14], [cx + 22, 104], [cx - 22, 104]], '#fff4f0'));
  body.push(T([[cx - 14, cy + 14], [cx, cy + 14], [cx, 104], [cx - 22, 104]], gold.base), T([[cx, cy + 14], [cx + 14, cy + 14], [cx + 22, 104], [cx, 104]], blue.base));
  for (let i = 0; i < 8; i++) body.push(E(cx - 19 + i * 5.4, 104, 3, 2, i < 4 ? gold.hi : blue.hi));
  body.push(F(T([[cx + 8, cy + 14], [cx + 14, cy + 14], [cx + 22, 104], [cx + 14, 104]], blue.sh)));
  // The head: a big round cat head split down the middle, ears to match.
  const hx = cx + 2;
  const hy = cy - 4;
  body.push(T([[hx - 16, hy - 12], [hx - 18, hy - 32], [hx - 4, hy - 20]], gold.base), F(T([[hx - 15, hy - 14], [hx - 16, hy - 26], [hx - 7, hy - 19]], '#ffc0d0')));
  body.push(T([[hx + 16, hy - 12], [hx + 18, hy - 32], [hx + 4, hy - 20]], blue.base), F(T([[hx + 15, hy - 14], [hx + 16, hy - 26], [hx + 7, hy - 19]], '#ffc0d0')));
  body.push(T(arcPts(hx, hy, 22, 19, 90, 270, 16), gold.base), T(arcPts(hx, hy, 22, 19, 270, 450, 16), blue.base));
  body.push(crescent(hx, hy, 22, 19, blue.sh, { k: 0.26, a0: 330, a1: 440 }), shine(hx - 6, hy, 14, 16, gold.hi, 0, 1));
  body.push(...cuteFace(hx + 2, hy + 2, 2.4, mood, { iris: '#c05ad8', lip: '#a02a6a', gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: '#fff4ee', mouthDy: 3.6, lash: 1.8, wing: 2 }));
  for (const s of [-1, 1]) for (const dy of [-1, 1.6]) body.push(F(T([[hx + s * 12, hy + 4 + dy], [hx + s * 20, hy + 3 + dy * 2], [hx + s * 20, hy + 3.6 + dy * 2], [hx + s * 12, hy + 4.6 + dy]], '#ffffff')));
  // The masks in her paws: held out either side at rest; swung round together in the slash.
  const sw = A ? A.swing : walk ? step * 0.2 : sway(q) * 0.15;
  const ang = sw * 80;
  const comedyPt = [cx - 20 + sw * 30, cy + 14 - Math.abs(sw) * 16];
  const tragedyPt = [cx + 22 + sw * 18, cy + 18 - sw * 12];
  body.push(...limb([cx - 10, cy + 18], comedyPt, 5, 4, gold.base), ...limb([cx + 10, cy + 18], tragedyPt, 5, 4, blue.base));
  body.push(...stageMask(comedyPt[0] - 2, comedyPt[1] - 4, 1.2, true, -10 + ang), ...stageMask(tragedyPt[0] + 4, tragedyPt[1] - 4, 1.2, false, 10 + ang));
  out.push(...spin(body, cx, 104, lean));
  if (A?.smear) out.push(smear(arcPts(cx + 6, cy + 4, 40, 34, -110, 30, 12), 10, '#fff6e6'));
  if (A?.hit) out.push(...star(cx + 46, cy + 18, 7, '#fff6a8'), ...star(cx + 40, cy + 34, 4, '#bfe0ff'));
  return { w: 108, h: 108, res: 3, shapes: out };
}

// ---------- Madame Directrice ----------

const PARROT_ATK = [
  { mega: -30, board: -50, lean: -10, yell: 0 },
  { mega: 4, board: 10, lean: 10, yell: 0.7 },
  { mega: 6, board: 30, lean: 12, yell: 1.3, snap: 1 },
  { mega: 4, board: 26, lean: 10, yell: 1 },
  { mega: -10, board: -10, lean: 0, yell: 0 },
];

function directrice(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? PARROT_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const red = ramp('#ff5a5a', { step: 10, turn: 10 });
  const wingC = ramp('#4fb0ff', { step: 10 });
  const out = [...spot(54, 108, 34)];
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 50;
  const cy = (dead ? 80 : 60) - (walk ? Math.abs(step) * 2 : breath(q) * 1.2);
  const lean = dead ? 84 : A ? A.lean : walk ? step * 3 : sway(q) * 2;
  const body = [];
  // Tail feathers: long blue and yellow plumes fanning behind.
  for (const [a, c] of [[150, '#ffd36b'], [162, wingC.base], [174, '#7fe08a']]) {
    const tf = chain(cx - 14, cy + 30, a, [10, 10, 8], (i) => (i ? 6 : 0) + Math.sin(TAU * q * 2 - i) * 3);
    body.push(strand(tf, (t) => 7 * (1 - t * 0.6), c));
  }
  // Legs: scaly yellow, the feet gripping the floor.
  for (const [ox, s] of [[-6, step], [6, -step]]) body.push(...limb([cx + ox, cy + 38], [cx + ox + Math.max(0, s) * 3, 106 - Math.max(0, s) * 3], 3, 2.6, '#e8b84a'), ...[-3, 0, 3].map((d) => E(cx + ox + d + Math.max(0, s) * 3, 107 - Math.max(0, s) * 3, 2, 1.2, '#c8902a')));
  // A round red body, a green-and-yellow chest.
  body.push(...blob(cx, cy + 22, 20, 22, red), F(O(cx + 6, cy + 26, 10, 14, 0, '#ffd36b', 18)), F(O(cx + 7, cy + 30, 7, 9, 0, '#ffe8a0', 14)));
  // The long striped scarf, trailing behind and blowing.
  const sc = chain(cx - 6, cy + 4, 170, [8, 8, 8, 7], wave(TAU * q * 2, walk ? 14 : 8, 0.8));
  body.push(strand(sc, 6, '#ffffff'));
  for (let i = 1; i < sc.length; i += 1) body.push(F(E(sc[i][0], sc[i][1], 3, 3, i % 2 ? '#ff6b9a' : '#ffffff')));
  // The head: big round, a big hooked beak, a beret with a stalk.
  const hx = cx + 4;
  const hy = cy - 10;
  body.push(...blob(hx, hy, 18, 16, red));
  body.push(F(O(hx + 8, hy + 2, 8, 7, 0, '#fff4ee', 16)));
  const yell = A ? A.yell : mood === 'angry' ? 0.3 : 0;
  body.push(T([[hx + 12, hy - 4], [hx + 26, hy - 2], [hx + 28, hy + 6], [hx + 22, hy + 10], [hx + 14, hy + 6]], '#3a3a4a'), F(T([[hx + 13, hy - 3], [hx + 25, hy - 1.4], [hx + 18, hy + 1]], '#6a6a7a')));
  body.push(T([[hx + 13, hy + 6 + yell * 4], [hx + 21, hy + 8 + yell * 6], [hx + 14, hy + 11 + yell * 6]], '#4a4a5a'));
  body.push(...cuteFace(hx + 6, hy - 1, 2, mood, { iris: '#ffb020', gap: 5, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: '#fff4ee', mouthDy: null, lash: 1.8, wing: 2 }));
  body.push(O(hx - 2, hy - 14, 16, 5, -10, '#3a3060', 18), F(O(hx - 4, hy - 16, 10, 2.4, -10, '#5a4a80', 14)), E(hx - 2, hy - 19, 1.6, 2, '#3a3060'));
  // Wings as arms: the megaphone up to the beak, the clapperboard in the other.
  const mg = A ? A.mega : walk ? -20 + step * 6 : -20;
  const mx = cx + 20;
  const my = cy + 8;
  body.push(...spin([T([[mx, my - 3], [mx + 16, my - 9], [mx + 16, my + 9], [mx, my + 3]], '#e8e8f4'), F(T([[mx + 12, my - 7.4], [mx + 16, my - 9], [mx + 16, my + 9], [mx + 12, my + 7.4]], '#b8b8d0')), R(mx - 4, my - 3, 5, 6, '#ff6b9a')], mx, my, mg));
  body.push(...limb([cx + 12, cy + 16], [mx - 2, my + 1], 6, 5, wingC.base));
  const bd = A ? A.board : walk ? -30 + step * 8 : -30;
  const bx = cx - 18;
  const by = cy + 14;
  const board = [R(bx - 9, by - 2, 18, 12, '#3a3a4a'), F(R(bx - 7, by + 2, 14, 1, '#ffffff')), F(R(bx - 7, by + 5, 10, 1, '#ffffff'))];
  const clap = spin([R(bx - 9, by - 6, 18, 4, '#3a3a4a'), F(R(bx - 6, by - 6, 3, 4, '#ffffff')), F(R(bx, by - 6, 3, 4, '#ffffff'))], bx - 9, by - 2, A?.snap ? 0 : -24);
  body.push(...limb([cx - 10, cy + 16], [bx + 2, by + 2], 6, 5, wingC.sh), ...spin([...board, ...clap], bx, by + 4, bd));
  out.push(...spin(body, cx, 106, lean));
  if (A?.yell) for (const k of [1, 1.7, 2.4]) out.push(F(T([...arcPts(mx + 22 + A.yell * 6 * k, my - 2, 4 * A.yell * k, 6 * A.yell * k, -60, 60, 10), ...arcPts(mx + 22 + A.yell * 6 * k, my - 2, 3 * A.yell * k, 4.6 * A.yell * k, 60, -60, 10)], k > 2 ? '#ff9ab8' : '#ffd36b')));
  if (A?.snap) out.push(...star(cx - 18, cy + 4, 6, '#fff6a8'));
  return { w: 112, h: 110, res: 3, shapes: out };
}

// ---------- The Phantom Playwright ----------

const PHANTOM_ATK = [
  { quill: -150, rise: 6, lean: -8 },
  { quill: -40, rise: -2, lean: 12, smear: 1 },
  { quill: 10, rise: -4, lean: 14, splash: 1 },
  { quill: 6, rise: -3, lean: 12, splash: 0.6 },
  { quill: -60, rise: 1, lean: 2 },
];

function playwright(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? PHANTOM_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const inkC = ramp('#4a3a8a', { step: 10, turn: 10 });
  const glass = ramp('#5a7ad8', { step: 10 });
  const out = [...spot(56, 122, 38)];
  // The inkwell: a squat glass pot with a brass collar; it slides along.
  const wx = 54;
  out.push(O(wx, 112, 26, 12, 0, glass.sh, 24), R(wx - 26, 96, 52, 16, glass.base), O(wx, 96, 26, 8, 0, glass.hi, 24));
  out.push(F(R(wx + 14, 96, 6, 16, glass.sh)), F(R(wx - 20, 98, 4, 12, '#bfd0ff')), R(wx - 16, 86, 32, 10, '#e8b84a'), O(wx, 86, 16, 4, 0, '#ffd36b', 18), O(wx, 86, 13, 3, 0, '#2a2048', 16));
  // The phantom: a body of ink rising from the pot, swaying like smoke, with wispy arms.
  const rise = A ? A.rise : walk ? Math.sin(TAU * q * 2) * 2 : breath(q) * 2;
  const cx = wx;
  const cy = (dead ? 84 : 46) - rise;
  const lean = dead ? 0 : A ? A.lean : walk ? Math.sin(TAU * q * 2) * 4 : sway(q) * 3;
  const body = [];
  const neck = chain(wx, 86, -90, [12, 12, 12], dead ? () => 0 : (i) => Math.sin(TAU * q * 2 - i) * 6);
  body.push(strand(neck, (t) => 22 - t * 6, inkC.base), strand(neck.map(([x, y]) => [x - 4, y]), (t) => 6 - t * 2, inkC.sh));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + q * TAU;
    body.push(F(E(cx + Math.cos(a) * 12, 80 + Math.sin(a) * 3, 2, 3, inkC.hi)));
  }
  // A collar of script pages like a high Elizabethan ruff.
  for (let i = 0; i < 9; i++) {
    const a = (180 + i * 22.5) * D2R;
    body.push(...spin([R(cx - 3 + Math.cos(a) * 16, cy + 12 + Math.sin(a) * 8, 7, 9, i % 2 ? '#fffaf0' : '#f0e6d4'), F(R(cx - 2 + Math.cos(a) * 16, cy + 15 + Math.sin(a) * 8, 5, 0.6, '#c9b8a8'))], cx + Math.cos(a) * 16, cy + 16 + Math.sin(a) * 8, (i - 4) * 18));
  }
  // The head: a big round ink head with a pale face plate and a floppy poet's beret with a plume.
  body.push(...blob(cx, cy, 22, 20, inkC));
  body.push(F(O(cx + 4, cy + 2, 14, 13, 0, '#f4f0ff', 20)));
  body.push(...cuteFace(cx + 5, cy + 2, 2.4, mood, { iris: '#ff5a8a', lip: '#8a3a6a', gap: 5.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: '#f4f0ff', mouthDy: 3.6, lash: 1.6, wing: 1.6 }));
  body.push(O(cx - 4, cy - 18, 22, 7, -8, '#7a3a8a', 20), F(O(cx - 6, cy - 20, 14, 3, -8, '#9a5aaa', 16)));
  const pl = chain(cx - 18, cy - 20, -140, [6, 6, 5], wave(TAU * q * 2, 10, 0.8));
  body.push(strand(pl, (t) => 5 * (1 - t * 0.4), '#ffd36b'));
  // The giant quill, raised to write and slashed down across the stage.
  const qa = A ? A.quill : walk ? -70 + Math.sin(TAU * q * 2) * 6 : -70 + sway(q) * 6;
  const hand = [cx + 20, cy + 22];
  const dir = [Math.cos(qa * D2R), Math.sin(qa * D2R)];
  const tip = [hand[0] - dir[0] * 10, hand[1] - dir[1] * 10];
  const top = [hand[0] + dir[0] * 34, hand[1] + dir[1] * 34];
  body.push(...limb([cx + 10, cy + 20], hand, 7, 6, inkC.base));
  const nx = -dir[1];
  const ny = dir[0];
  body.push(T([[tip[0], tip[1]], [hand[0] + nx * 3, hand[1] + ny * 3], [top[0] + nx * 7, top[1] + ny * 7], [top[0], top[1]], [hand[0] - nx * 2, hand[1] - ny * 2]], '#fffaf0'));
  for (let k = 1; k < 6; k++) body.push(F(T([[hand[0] + dir[0] * k * 5, hand[1] + dir[1] * k * 5], [hand[0] + dir[0] * k * 5 + nx * 6, hand[1] + dir[1] * k * 5 + ny * 6 - 2], [hand[0] + dir[0] * (k * 5 + 1), hand[1] + dir[1] * (k * 5 + 1)]], '#e0d4c0')));
  body.push(...limb(tip, hand, 1.2, 1.6, '#3a2a5a'));
  out.push(...spin(body, wx, 86, lean));
  // Pages whirling round him.
  if (!dead) for (let i = 0; i < 4; i++) {
    const a = q * TAU + (i / 4) * TAU;
    const px = cx + Math.cos(a) * 40;
    const py = cy + 10 + Math.sin(a) * 14;
    out.push(...spin([R(px - 3, py - 4, 6, 8, '#fffaf0'), F(R(px - 2, py - 2, 4, 0.6, '#c9b8a8')), F(R(px - 2, py, 3, 0.6, '#c9b8a8'))], px, py, a * 40));
  }
  if (A?.smear) out.push(smear([[cx + 10, cy - 30], [cx + 40, cy], [cx + 50, cy + 50]], 10, '#e6e0ff'));
  if (A?.splash) out.push(...ink(cx + 50, 114, 3.4 * A.splash), ...ink(cx + 30, 118, 2.4 * A.splash), ...star(cx + 52, 104, 6 * A.splash, '#fff6a8'));
  return { w: 120, h: 126, res: 3, shapes: out };
}

export const ART = {
  persona: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 320, 220], draw: persona },
  directrice: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: directrice },
  playwright: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 340, 240], draw: playwright },
};

export const INFO = {
  persona: { name: 'Persona, the Two-Faced Muse', w: 60, h: 100 },
  directrice: { name: 'Madame Directrice', w: 64, h: 100 },
  playwright: { name: 'The Phantom Playwright', w: 70, h: 120 },
};
