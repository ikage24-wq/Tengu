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
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

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

// ---------- The Theatre's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) Live skeletons (render/mobs/rig.js). Persona's split gown
// sways as its own skirt, her tail curls, and the two masks swing round on her arms in the slash.
// Madame Directrice's scarf streams behind her, her lower beak drops open when she bellows into the
// megaphone, and her clapperboard's stick snaps shut. The Phantom Playwright's ink neck sways up out
// of his inkwell, a ruff of pages at his throat, his quill raised and slashed, pages whirling round
// him. Each stands in its own spotlight. Rig space: the floor under them at (0, 0).
const DG = Math.PI / 180;
const spotPart = (key, r) => part(`stage|spot|${key}`, r * 2 + 8, 16, () => spot(r + 4, 8, r));

// Persona.
const PS = { gold: ramp('#ffd88a', { step: 10, turn: 12 }), blue: ramp('#9fb8f0', { step: 10, turn: 12 }) };
const psParts = {
  foot: (gold) => part(`persona|foot|${gold}`, 18, 10, () => [O(9, 5, 7, 3.6, 0, gold ? PS.gold.sh : PS.blue.base, 14)]),
  gown: () => part('persona|gown', 50, 30, () => {
    const cx = 25;
    const top = 2;
    const out = [T([[cx - 14, top], [cx + 14, top], [cx + 22, top + 24], [cx - 22, top + 24]], '#fff4f0'), T([[cx - 14, top], [cx, top], [cx, top + 24], [cx - 22, top + 24]], PS.gold.base), T([[cx, top], [cx + 14, top], [cx + 22, top + 24], [cx, top + 24]], PS.blue.base)];
    for (let i = 0; i < 8; i++) out.push(E(cx - 19 + i * 5.4, top + 24, 3, 2, i < 4 ? PS.gold.hi : PS.blue.hi));
    out.push(F(T([[cx + 8, top], [cx + 14, top], [cx + 22, top + 24], [cx + 14, top + 24]], PS.blue.sh)));
    return out;
  }),
  head: () => part('persona|head', 52, 56, () => {
    const hx = 26;
    const hy = 34;
    return [T([[hx - 16, hy - 12], [hx - 18, hy - 32], [hx - 4, hy - 20]], PS.gold.base), F(T([[hx - 15, hy - 14], [hx - 16, hy - 26], [hx - 7, hy - 19]], '#ffc0d0')), T([[hx + 16, hy - 12], [hx + 18, hy - 32], [hx + 4, hy - 20]], PS.blue.base), F(T([[hx + 15, hy - 14], [hx + 16, hy - 26], [hx + 7, hy - 19]], '#ffc0d0')), T(arcPts(hx, hy, 22, 19, 90, 270, 16), PS.gold.base), T(arcPts(hx, hy, 22, 19, 270, 450, 16), PS.blue.base), crescent(hx, hy, 22, 19, PS.blue.sh, { k: 0.26, a0: 330, a1: 440 }), shine(hx - 6, hy, 14, 16, PS.gold.hi, 0, 1), ...[-1, 1].flatMap((sd) => [-1, 1.6].map((dy) => F(T([[hx + sd * 12, hy + 4 + dy], [hx + sd * 20, hy + 3 + dy * 2], [hx + sd * 20, hy + 3.6 + dy * 2], [hx + sd * 12, hy + 4.6 + dy]], '#ffffff'))))];
  }),
  face: (mood, atk) => part(`persona|face|${mood}|${atk}`, 32, 22, () => cuteFace(16, 9, 2.4, mood, { iris: '#c05ad8', lip: '#a02a6a', gap: 6, atk, skin: '#fff4ee', mouthDy: 3.6, lash: 1.8, wing: 2 })),
  arm: (gold) => part(`persona|arm|${gold}`, 18, 10, () => [...limb([3, 5], [15, 5], 5, 4, gold ? PS.gold.base : PS.blue.base)]),
  mask: (comedy) => part(`persona|mask|${comedy}`, 30, 26, () => stageMask(17, 13, 1.2, comedy, 0)),
  bow: () => part('persona|bow', 10, 10, () => [T([[2, 5], [8, 1], [8, 9]], '#ff6b9a')]),
};
const personaRig = makeRig({
  w: 60,
  h: 100,
  stride: 44,
  fast: ['swing', 'lean'],
  kick: { lean: -1.6, gown: 3 },
  springs: { gown: [80, 6], tail0: [80, 6], tail1: [65, 5], tail2: [55, 4], tail3: [45, 3.5] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.3) * 0.04, rise: Math.sin(t * 2) * 1.4, swing: Math.sin(t * 1.4) * 0.15, footF: 0, footB: 0, head: Math.sin(t * 1.6) * 0.06 };
    const walk = { lean: s * 0.05, rise: Math.abs(s) * 1.6, swing: s * 0.2, footF: Math.max(0, s) * 3, footB: Math.max(0, -s) * 3, head: s * 0.06 };
    const antic = { lean: -8 * DG, rise: 2, swing: -1, footF: 0, footB: 0, head: -0.1 };
    const strike = { lean: 14 * DG, rise: -2, swing: 1, footF: 0, footB: 0, head: 0.1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ gown: -S.lean * 1.4, tail0: 200 * DG - S.lean * 2, tail1: -26 * DG + Math.sin(a.t * 3) * 0.14, tail2: -26 * DG + Math.sin(a.t * 3 - 1) * 0.14, tail3: -26 * DG + Math.sin(a.t * 3 - 2) * 0.14 }),
  parts: [
    { name: 'spot', pivot: [40, 8], at: () => [2, 0], s: () => spotPart('persona', 36) },
    { name: 'footB', pivot: [9, 5], at: (S) => [-8, -1 - S.footB], s: () => psParts.foot(true) },
    { name: 'footF', pivot: [9, 5], at: (S) => [8, -1 - S.footF], s: () => psParts.foot(false) },
    { name: 'root', at: (S) => [0, -24 - S.rise], rot: (S) => S.lean },
    ...chainParts('tail', { parent: 'root', at: () => [-18, 2], key: 'persona|tail', segs: [[7, 6, 5.4], [7, 5.4, 4.8], [6, 4.8, 4.2], [5, 4.2, 3.6]], color: PS.gold.sh, rot: (S, a, i) => S[`tail${i}`] }),
    { name: 'bow', parent: 'tail3', pivot: [2, 5], at: () => [5, 0], s: () => psParts.bow() },
    { name: 'gown', parent: 'root', pivot: [25, 2], at: () => [0, 0], rot: (S) => S.gown, s: () => psParts.gown() },
    { name: 'head', parent: 'root', pivot: [26, 44], at: () => [2, -8], rot: (S) => S.head, s: () => psParts.head() },
    { name: 'face', parent: 'head', pivot: [16, 9], at: () => [2, -8], s: (a) => psParts.face(a.face, a.atk) },
    { name: 'armL', parent: 'root', pivot: [3, 5], at: () => [-10, 4], rot: (S) => (160 - S.swing * 70) * DG, s: () => psParts.arm(true) },
    { name: 'comedy', parent: 'armL', pivot: [17, 13], at: () => [14, 0], rot: (S) => -(160 - S.swing * 70) * DG + S.swing * 1.4 - 0.2, s: () => psParts.mask(true) },
    { name: 'armR', parent: 'root', pivot: [3, 5], at: () => [10, 4], rot: (S) => (20 - S.swing * 50) * DG, s: () => psParts.arm(false) },
    { name: 'tragedy', parent: 'armR', pivot: [17, 13], at: () => [14, 0], rot: (S) => -(20 - S.swing * 50) * DG + S.swing * 1.4 + 0.2, s: () => psParts.mask(false) },
  ],
  fx(ctx, m, a) {
    if (a.ph.since >= 0 && a.ph.since < 0.3) {
      const u = a.ph.since / 0.3;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
      ctx.strokeStyle = '#fff6e6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(6, -36, 40, -1.9, 0.5);
      ctx.stroke();
    }
  },
});

// Madame Directrice.
const DR = { red: ramp('#ff5a5a', { step: 10, turn: 10 }), wing: ramp('#4fb0ff', { step: 10 }) };
const drParts = {
  leg: () => part('direc|leg', 14, 14, () => [...limb([7, 2], [7, 9], 3, 2.6, '#e8b84a'), ...[-3, 0, 3].map((d) => E(7 + d, 10, 2, 1.2, '#c8902a'))]),
  body: () => part('direc|body', 42, 46, () => [...blob(21, 23, 20, 22, DR.red), F(O(27, 27, 10, 14, 0, '#ffd36b', 18)), F(O(28, 31, 7, 9, 0, '#ffe8a0', 14))]),
  head: () => part('direc|head', 66, 50, () => {
    const hx = 24;
    const hy = 30;
    return [...blob(hx, hy, 18, 16, DR.red), F(O(hx + 8, hy + 2, 8, 7, 0, '#fff4ee', 16)), T([[hx + 12, hy - 4], [hx + 26, hy - 2], [hx + 28, hy + 6], [hx + 22, hy + 10], [hx + 14, hy + 6]], '#3a3a4a'), F(T([[hx + 13, hy - 3], [hx + 25, hy - 1.4], [hx + 18, hy + 1]], '#6a6a7a')), O(hx - 2, hy - 14, 16, 5, -10, '#3a3060', 18), F(O(hx - 4, hy - 16, 10, 2.4, -10, '#5a4a80', 14)), E(hx - 2, hy - 19, 1.6, 2, '#3a3060')];
  }),
  // The lower beak, hinged at (1, 1).
  jaw: () => part('direc|jaw', 12, 8, () => [T([[1, 1], [9, 3], [2, 6]], '#4a4a5a')]),
  face: (mood, atk) => part(`direc|face|${mood}|${atk}`, 26, 20, () => cuteFace(13, 8, 2, mood, { iris: '#ffb020', gap: 5, atk, skin: '#fff4ee', mouthDy: null, lash: 1.8, wing: 2 })),
  wing: (dark) => part(`direc|wing|${dark}`, 14, 10, () => [...limb([3, 5], [11, 5], 6, 5, dark ? DR.wing.sh : DR.wing.base)]),
  mega: () => part('direc|mega', 24, 22, () => [T([[4, 8], [20, 2], [20, 20], [4, 14]], '#e8e8f4'), F(T([[16, 3.6], [20, 2], [20, 20], [16, 18.4]], '#b8b8d0')), R(0, 8, 5, 6, '#ff6b9a')]),
  board: () => part('direc|board', 22, 16, () => [R(2, 2, 18, 12, '#3a3a4a'), F(R(4, 6, 14, 1, '#ffffff')), F(R(4, 9, 10, 1, '#ffffff'))]),
  // The clapper stick, hinged at its left end (1, 3).
  clap: () => part('direc|clap', 22, 8, () => [R(1, 1, 18, 4, '#3a3a4a'), F(R(4, 1, 3, 4, '#ffffff')), F(R(10, 1, 3, 4, '#ffffff'))]),
};
const scarfShape = (i, len, w0, w1, x0, y0) => [...limb([x0, y0], [x0 + len, y0], 6, 6, '#ffffff'), E(x0 + len, y0, 3, 3, i % 2 ? '#ff6b9a' : '#ffffff')];
const directriceRig = makeRig({
  w: 64,
  h: 100,
  stride: 40,
  fast: ['mega', 'board', 'lean', 'yell'],
  kick: { lean: -1.6, s0: 3 },
  springs: { s0: [70, 4.5], s1: [55, 4], s2: [45, 3.5], s3: [38, 3], f0: [80, 6] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.2) * 0.03, y: -Math.sin(t * 2.2) * 1.2, mega: -20 * DG + Math.sin(t * 1.4) * 0.06, board: -30 * DG, yell: a.mood === 'angry' ? 0.3 : 0, clap: -24 * DG, legF: 0, legB: 0, head: Math.sin(t * 1.5) * 0.06 };
    const walk = { lean: s * 0.05, y: -Math.abs(s) * 2, mega: (-20 + s * 6) * DG, board: (-30 + s * 8) * DG, yell: 0, clap: -24 * DG, legF: -s * 0.3, legB: s * 0.3, head: s * 0.05 };
    const antic = { lean: -10 * DG, y: 0, mega: -30 * DG, board: -50 * DG, yell: 0.2, clap: -40 * DG, legF: 0, legB: 0, head: -0.12 };
    const strike = { lean: 12 * DG, y: 0, mega: 6 * DG, board: 30 * DG, yell: 1.3, clap: 0, legF: 0, legB: 0, head: 0.1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ s0: 170 * DG - S.lean * 2 + Math.sin(a.t * 3) * 0.15, s1: Math.sin(a.t * 3 - 1) * 0.25, s2: Math.sin(a.t * 3 - 2) * 0.25, s3: Math.sin(a.t * 3 - 3) * 0.25, f0: -S.lean * 1.5 }),
  parts: [
    { name: 'spot', pivot: [38, 8], at: () => [4, 0], s: () => spotPart('direc', 34) },
    { name: 'root', at: (S) => [0, S.y], rot: (S) => S.lean },
    ...[[150, '#ffd36b'], [162, DR.wing.base], [174, '#7fe08a']].flatMap(([deg, c], j) => chainParts(`tf${j}`, { parent: 'root', at: () => [-14, -16], key: `direc|tf|${j}`, segs: [[10, 7, 5.2], [10, 5.2, 3.4], [8, 3.4, 2.4]], color: c, rot: (S, a, i) => (i ? (6 + Math.sin(a.t * 3 - i + j) * 3) * DG : deg * DG + S.f0) })),
    { name: 'legB', parent: 'root', pivot: [7, 2], at: () => [-6, -8], rot: (S) => S.legB, s: () => drParts.leg() },
    { name: 'legF', parent: 'root', pivot: [7, 2], at: () => [6, -8], rot: (S) => S.legF, s: () => drParts.leg() },
    { name: 'body', parent: 'root', pivot: [21, 23], at: () => [0, -24], s: () => drParts.body() },
    ...chainParts('s', { parent: 'body', at: () => [-6, -18], key: 'direc|scarf', segs: [[8, 6, 6], [8, 6, 6], [8, 6, 6], [7, 6, 6]], shape: scarfShape, rot: (S, a, i) => S[`s${i}`] }),
    { name: 'wingB', parent: 'body', pivot: [3, 5], at: () => [-10, -6], rot: (S) => S.board + 160 * DG, s: () => drParts.wing(true) },
    { name: 'board', parent: 'wingB', pivot: [11, 8], at: () => [10, 0], rot: () => -160 * DG, s: () => drParts.board() },
    { name: 'clap', parent: 'board', pivot: [1, 3], at: () => [-9, -6], rot: (S) => S.clap, s: () => drParts.clap() },
    { name: 'head', parent: 'body', pivot: [24, 30], at: () => [4, -32], rot: (S) => S.head, s: () => drParts.head() },
    { name: 'jaw', parent: 'head', pivot: [1, 1], at: () => [13, 6], rot: (S) => S.yell * 0.5, s: () => drParts.jaw() },
    { name: 'face', parent: 'head', pivot: [13, 8], at: () => [6, -1], s: (a) => drParts.face(a.face, a.atk) },
    { name: 'wingF', parent: 'body', pivot: [3, 5], at: () => [12, -6], rot: (S) => S.mega - 30 * DG, s: () => drParts.wing(false) },
    { name: 'mega', parent: 'wingF', pivot: [2, 11], at: () => [10, 0], rot: (S) => 30 * DG, s: () => drParts.mega() },
  ],
  fx(ctx, m, a, S, mat) {
    // The bellow: rings of sound out of the megaphone.
    if (S.yell > 0.4) inPart(ctx, mat, 'mega', () => {
      for (const k of [1, 1.7, 2.4]) {
        ctx.globalAlpha = a.alpha * Math.min(1, S.yell - 0.4);
        ctx.strokeStyle = k > 2 ? '#ff9ab8' : '#ffd36b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(20 + S.yell * 6 * k, 0, 5 * S.yell * k, -0.9, 0.9);
        ctx.stroke();
      }
    });
  },
});

// The Phantom Playwright.
const PW = { ink: ramp('#4a3a8a', { step: 10, turn: 10 }), glass: ramp('#5a7ad8', { step: 10 }) };
const pwParts = {
  well: () => part('playwright|well', 58, 44, () => {
    const wx = 29;
    return [O(wx, 30, 26, 12, 0, PW.glass.sh, 24), R(wx - 26, 14, 52, 16, PW.glass.base), O(wx, 14, 26, 8, 0, PW.glass.hi, 24), F(R(wx + 14, 14, 6, 16, PW.glass.sh)), F(R(wx - 20, 16, 4, 12, '#bfd0ff')), R(wx - 16, 4, 32, 10, '#e8b84a'), O(wx, 4, 16, 4, 0, '#ffd36b', 18), O(wx, 4, 13, 3, 0, '#2a2048', 16)];
  }),
  ruff: () => part('playwright|ruff', 48, 26, () => {
    const out = [];
    for (let i = 0; i < 9; i++) {
      const ang = (180 + i * 22.5) * D2R;
      out.push(...spin([R(24 - 3 + Math.cos(ang) * 16, 8 + Math.sin(ang) * 8, 7, 9, i % 2 ? '#fffaf0' : '#f0e6d4'), F(R(24 - 2 + Math.cos(ang) * 16, 11 + Math.sin(ang) * 8, 5, 0.6, '#c9b8a8'))], 24 + Math.cos(ang) * 16, 12 + Math.sin(ang) * 8, (i - 4) * 18));
    }
    return out;
  }),
  head: () => part('playwright|head', 56, 52, () => [...blob(28, 30, 22, 20, PW.ink), F(O(32, 32, 14, 13, 0, '#f4f0ff', 20)), O(24, 12, 22, 7, -8, '#7a3a8a', 20), F(O(22, 10, 14, 3, -8, '#9a5aaa', 16))]),
  face: (mood, atk) => part(`playwright|face|${mood}|${atk}`, 30, 22, () => cuteFace(15, 9, 2.4, mood, { iris: '#ff5a8a', lip: '#8a3a6a', gap: 5.6, atk, skin: '#f4f0ff', mouthDy: 3.6, lash: 1.6, wing: 1.6 })),
  arm: () => part('playwright|arm', 16, 12, () => [...limb([3, 6], [13, 6], 7, 6, PW.ink.base)]),
  // The quill along +x from the grip at (12, 9): the nib behind, the feather ahead.
  quill: () => part('playwright|quill', 52, 18, () => {
    const out = [T([[2, 9], [12, 6], [48, 2], [48, 9], [12, 11]], '#fffaf0')];
    for (let k = 1; k < 6; k++) out.push(F(T([[12 + k * 6, 8], [12 + k * 6 + 2, 3], [13 + k * 6, 8]], '#e0d4c0')));
    out.push(...limb([2, 9], [12, 9], 1.2, 1.6, '#3a2a5a'));
    return out;
  }),
};
const neckShape = (i, len, w0, w1, x0, y0) => [...limb([x0, y0], [x0 + len, y0], w0, w1, PW.ink.base), F(limb([x0, y0 - w0 * 0.25], [x0 + len, y0 - w1 * 0.25], w0 * 0.28, w1 * 0.28, PW.ink.sh)[0])];
const playwrightRig = makeRig({
  w: 70,
  h: 120,
  stride: 40,
  fast: ['quill', 'n0', 'n1', 'n2'],
  kick: { n1: -3, plume0: 4 },
  springs: { n0: [160, 11], n1: [130, 9], n2: [110, 8], plume0: [60, 4], plume1: [50, 3.5], plume2: [42, 3] },
  pose(m, a) {
    const t = a.t;
    const ph = a.walkW > 0.5 ? a.wp : t * 1.5;
    const w = (i) => Math.sin(ph - i) * (6 + a.walkW * 4) * DG;
    const idle = { n0: -90 * DG + w(0), n1: w(1), n2: w(2), quill: -70 * DG + Math.sin(t * 1.2) * 0.1, rise: Math.sin(t * 1.6) * 2 };
    const antic = { n0: -98 * DG, n1: -6 * DG, n2: -4 * DG, quill: -150 * DG, rise: 6 };
    const strike = { n0: -76 * DG, n1: 8 * DG, n2: 6 * DG, quill: 10 * DG, rise: -3 };
    return stateBlend(a, idle, idle, antic, strike);
  },
  follow: (S, a) => ({ plume0: -140 * DG - S.n1 * 2 + Math.sin(a.t * 3) * 0.12, plume1: 10 * DG, plume2: 10 * DG }),
  parts: [
    { name: 'spot', pivot: [42, 8], at: () => [2, 0], s: () => spotPart('playwright', 38) },
    ...chainParts('n', { parent: null, at: (S) => [0, -38 - S.rise * 0.5], key: 'playwright|neck', segs: [[12, 22, 20], [12, 20, 18], [12, 18, 16]], shape: neckShape, rot: (S, a, i) => S[`n${i}`] }),
    { name: 'well', pivot: [29, 42], at: () => [0, 0], s: () => pwParts.well() },
    { name: 'headJ', parent: 'n2', at: () => [12, 0], rot: (S) => -(S.n0 + S.n1 + S.n2) },
    { name: 'ruff', parent: 'headJ', pivot: [24, 12], at: () => [0, 14], s: () => pwParts.ruff() },
    ...chainParts('plume', { parent: 'headJ', at: () => [-18, -22], key: 'playwright|plume', segs: [[6, 5, 4], [6, 4, 3.2], [5, 3.2, 2.6]], color: '#ffd36b', rot: (S, a, i) => S[`plume${i}`] }),
    { name: 'head', parent: 'headJ', pivot: [28, 30], at: () => [0, -4], s: () => pwParts.head() },
    { name: 'face', parent: 'head', pivot: [15, 9], at: () => [5, 2], s: (a) => pwParts.face(a.face, a.atk) },
    { name: 'arm', parent: 'headJ', pivot: [3, 6], at: () => [10, 16], rot: (S) => S.quill + 40 * DG, s: () => pwParts.arm() },
    { name: 'quill', parent: 'arm', pivot: [12, 9], at: () => [10, 0], rot: () => -40 * DG, s: () => pwParts.quill() },
  ],
  fx(ctx, m, a, S, mat) {
    // Script pages whirling round him, and the ink thrown off the quill's slash.
    const [, , , , hx, hy] = mat('headJ');
    for (let i = 0; i < 4; i++) {
      const ang = a.t * 1.2 + (i / 4) * TAU;
      ctx.save();
      ctx.translate(hx + Math.cos(ang) * 40, hy + 10 + Math.sin(ang) * 14);
      ctx.rotate(ang * 0.7);
      ctx.globalAlpha = a.alpha * (Math.sin(ang) > 0 ? 1 : 0.6);
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(-3, -4, 6, 8);
      ctx.fillStyle = '#c9b8a8';
      ctx.fillRect(-2, -2, 4, 0.6);
      ctx.fillRect(-2, 0, 3, 0.6);
      ctx.restore();
    }
    if (a.ph.since >= 0 && a.ph.since < 0.6) {
      const u = a.ph.since / 0.6;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.9;
      ctx.fillStyle = '#3a2d5a';
      for (const [x, r] of [[50, 7], [34, 5], [62, 4]]) {
        ctx.beginPath();
        ctx.arc(x, -6, r * (0.6 + u * 0.8), 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  persona: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 320, 220], draw: persona, rig: personaRig },
  directrice: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: directrice, rig: directriceRig },
  playwright: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 340, 240], draw: playwright, rig: playwrightRig },
};

export const INFO = {
  persona: { name: 'Persona, the Two-Faced Muse', w: 60, h: 100 },
  directrice: { name: 'Madame Directrice', w: 64, h: 100 },
  playwright: { name: 'The Phantom Playwright', w: 70, h: 120 },
};
