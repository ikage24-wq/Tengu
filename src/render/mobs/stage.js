// Monster art: the Dream Theatre's players (the levels 40-45 group dungeon, see
// docs/design/dream-theatre.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign):
// chibi theatre creatures, each its own silhouette, every one standing in a soft spotlight pool.
//   understudy   Understudy Ghost: a round sheet ghost in a comedy half-mask, clutching its
//                script; swoops forward in a dramatic lunge.
//   chorusgirl   Chorus Flamingo: a flamingo showgirl in a feather headdress with a fan; high
//                kicks.
//   stagehand    Stagehand Mole: a chubby mole in a hard hat and overalls; swings a big wrench.
//   primadonna   Prima Donna Frog: a round diva frog in a pearl necklace and a ruffled gown; her
//                high note rings out in rings.
//   paperdragon  Paper Dragon: a chibi paper-lantern dragon with a big round head and a short
//                accordion body on two pairs of stubby legs; puffs fire.
//   prompter     Prompter Bat: a little bat in a hood with a lamp and cue cards; flings a card.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

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

// ---------- Prima Donna Frog ----------

const FROG_ATK = [
  { breath: 1.2, lean: -8, ring: 0 },
  { breath: -0.4, lean: 6, ring: 0.6 },
  { breath: -0.6, lean: 8, ring: 1.2 },
  { breath: 0.1, lean: 0, ring: 0 },
];

function frog(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? FROG_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#7fd08a', { step: 10, turn: 12 });
  const gown = ramp('#9a5ad8', { step: 10 });
  const out = [...spot(20, 40, 15)];
  const puff = A ? A.breath : pose === 'idle' ? breath(q) * 0.6 : 0;
  const cx = 20;
  const cy = (dead ? 14 : 0) - (walk ? Math.abs(Math.sin(TAU * q * 2)) * 1.4 : 0);
  const lean = dead ? 84 : A ? A.lean : walk ? Math.sin(TAU * q * 2) * 4 : 0;
  const body = [];
  // The gown: a wide ruffled bell to the floor, swishing.
  const sw = walk ? Math.sin(TAU * q * 2) * 1.6 : 0;
  body.push(T([[cx - 6, cy + 20], [cx + 6, cy + 20], [cx + 14 + sw, cy + 39], [cx - 14 + sw, cy + 39]], gown.base), F(T([[cx + 3, cy + 20], [cx + 6, cy + 20], [cx + 14 + sw, cy + 39], [cx + 6 + sw, cy + 39]], gown.sh)));
  for (let i = 0; i < 7; i++) body.push(E(cx - 12 + i * 4 + sw, cy + 38.6, 2.6, 1.6, i % 2 ? '#c9a6ff' : gown.hi));
  for (const y of [27, 33]) body.push(F(R(cx - 10 + (y - 27) * -0.4, cy + y, 20 + (y - 27) * 0.8, 0.8, '#ffd36b')));
  // A round frog body puffing up, a pearl necklace.
  body.push(...blob(cx, cy + 15, 10 + puff * 1.6, 8 + puff, skin));
  body.push(F(O(cx + 3, cy + 18, 5 + puff, 4, 0, '#e8f6c8', 14)));
  for (let i = 0; i < 7; i++) body.push(E(cx - 6 + i * 2, cy + 10.6 + Math.sin(i / 6 * Math.PI) * 2, 1.1, 1.1, '#f8f4ff'));
  // Head: wide, with big eyes on top and a wide mouth, open on the high note.
  const hx = cx + 1;
  const hy = cy + 5;
  body.push(E(hx - 4, hy - 4, 3.6, 3.6, skin.base), E(hx + 4, hy - 4.4, 3.6, 3.6, skin.base));
  body.push(...blob(hx, hy, 9, 6, skin));
  body.push(...cuteFace(hx + 0.4, hy - 3.6, 1, mood, { iris: '#ffb020', gap: 8, atk: 0, skin: skin.base, mouthDy: null, lash: 1.6, wing: 1.6 }));
  const open = A ? Math.max(0, -A.breath) * 3 + (A.ring ? 1 : 0) : mood === 'happy' ? 1 : 0;
  body.push(open > 0.5 ? O(hx + 2, hy + 2.4, 3.4, 1 + open, 0, '#8a2a4a', 12) : T([...arcPts(hx + 1, hy + 1.4, 5, 1.6, 10, 170, 8)], '#3a6a3a'));
  // Little arms: one at the heart, one flung out for the note; a tiara.
  body.push(...limb([cx + 8, cy + 14], [cx + 14 - (A ? 0 : 4), cy + 8 + (A ? -4 : 4)], 2.8, 2.4, skin.base), ...limb([cx - 7, cy + 14], [cx - 2, cy + 15], 2.8, 2.4, skin.sh));
  body.push(T([[hx - 3, hy - 6], [hx, hy - 10], [hx + 3, hy - 6]], '#ffd36b'), F(E(hx, hy - 8, 0.9, 0.9, '#ff6b9a')));
  out.push(...spin(body, cx, 40, lean));
  if (A?.ring) for (const k of [1, 1.8, 2.6]) out.push(F(T([...arcPts(cx + 12 + A.ring * 5 * k, cy + 8, 3 * A.ring * k, 4 * A.ring * k, -60, 60, 10), ...arcPts(cx + 12 + A.ring * 5 * k, cy + 8, 2.2 * A.ring * k, 3 * A.ring * k, 60, -60, 10)], k > 2 ? '#c9a6ff' : '#ffd36b')));
  if (A?.ring > 1) out.push(F(T([[cx + 16, cy + 2], [cx + 17.4, cy + 1.6], [cx + 17.4, cy + 6], [cx + 16.4, cy + 6]], '#8f6cc4')), F(E(cx + 16, cy + 6, 1.2, 1, '#8f6cc4')));
  return { w: 44, h: 42, res: 3, shapes: out };
}

// ---------- Paper Dragon ----------

const DRAGON_ATK = [
  { rear: 1, gape: 0.2, fire: 0 },
  { rear: -0.4, gape: 1, fire: 0.6 },
  { rear: -0.6, gape: 1, fire: 1.2, hit: 1 },
  { rear: 0, gape: 0.2, fire: 0.3 },
];

function dragon(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? DRAGON_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const red = ramp('#ff5a6a', { step: 10, turn: 10 });
  const gold = ramp('#ffd36b', { step: 10 });
  const out = [...spot(26, 40, 20)];
  const ph = TAU * q * 2;
  // The accordion body: lantern segments in a wave, each with a gold rim, on stubby legs.
  const segs = 4;
  const by = dead ? 34 : 26;
  for (let i = 0; i < segs; i++) {
    const x = 8 + i * 6;
    const y = by + Math.sin(ph - i * 0.9) * (walk ? 2 : 1);
    if (i % 2 === 0 && !dead) {
      const st = walk ? Math.sin(ph - i) * 3 : 0;
      out.push(...limb([x, y + 4], [x + st, 40], 2.4, 2.2, gold.sh), E(x + st + 1, 40.2, 2, 1, gold.base));
    }
    out.push(O(x, y, 4.4, 6, 0, i % 2 ? red.base : red.sh, 16), F(R(x - 4.4, y - 0.4, 8.8, 0.8, gold.base)));
  }
  // Tail tuft of paper streamers.
  const tl = chain(6, by - 2, 190, [3, 3, 3], wave(ph, 18, 0.8));
  out.push(strand(tl, (t) => 3 * (1 - t * 0.4), gold.base), strand(chain(6, by + 1, 170, [3, 3], wave(ph - 1, 18, 0.8)), 2, red.hi));
  // The big round head: a paper lantern face, gold whiskers and horns, a hinged jaw.
  const rear = A ? A.rear : pose === 'idle' ? breath(q) * 0.4 : walk ? Math.sin(ph) * 0.3 : 0;
  const hx = 34 + (A ? -A.rear * 2 : 0);
  const hy = by - 8 - rear * 4;
  const head = [];
  head.push(...blob(hx, hy, 11, 10, red));
  for (const yy of [-6, 0, 6]) head.push(F(T([...arcPts(hx, hy + yy, 10.4, 1.2, 190, 350, 8)], gold.base)));
  for (const s of [-1, 1]) head.push(...limb([hx - 2 + s * 3, hy - 9], [hx - 6 + s * 5, hy - 16], 2, 1.4, gold.base), E(hx - 6 + s * 5, hy - 16.6, 1.6, 1.6, gold.hi));
  const gape = A ? A.gape : 0.1;
  head.push(T([[hx + 4, hy + 3], [hx + 14, hy + 2], [hx + 14, hy + 4 + gape * 5], [hx + 4, hy + 6 + gape * 5]], '#5a1a2a'));
  head.push(T([[hx + 3, hy + 5 + gape * 5], [hx + 15, hy + 4 + gape * 5], [hx + 13, hy + 8 + gape * 5], [hx + 4, hy + 8 + gape * 5]], red.sh));
  for (let i = 0; i < 3; i++) head.push(F(T([[hx + 6 + i * 3, hy + 2.6], [hx + 7.4 + i * 3, hy + 2.6], [hx + 6.7 + i * 3, hy + 4.4]], '#fffaf2')));
  head.push(...cuteFace(hx + 2, hy - 2.4, 1.1, mood, { iris: '#ffb020', gap: 5, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: red.base, mouthDy: null }));
  for (const s of [-1, 1]) head.push(strand(chain(hx + 10, hy + 1, s * 20 + 10, [4, 4], wave(ph + s, 14, 0.8)), 0.8, gold.base));
  out.push(...spin(head, hx, hy + 4, dead ? 40 : A ? -A.rear * 8 : 0));
  if (A?.fire) {
    const k = A.fire;
    out.push(F(O(hx + 18 + k * 4, hy + 6, 5 * k, 3.4 * k, 0, '#ff8a3a', 16)), F(O(hx + 17 + k * 4, hy + 6, 3.4 * k, 2.2 * k, 0, '#ffe36b', 14)), F(E(hx + 16 + k * 4, hy + 6, 1.4 * k, 1 * k, '#ffffff')));
  }
  if (A?.hit) out.push(...star(hx + 26, hy + 4, 3.4, '#fff6a8'));
  return { w: 54, h: 42, res: 3, shapes: out };
}

// ---------- Prompter Bat ----------

const BAT_ATK = [
  { arm: -150, lean: -10, card: 1 },
  { arm: -10, lean: 10, card: 1, fling: 1 },
  { arm: 20, lean: 8, card: 0, hit: 1 },
  { arm: -40, lean: 0, card: 0 },
];

function bat(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? BAT_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#a898d8', { step: 10, turn: 12 });
  const hood = ramp('#6a5aa0', { step: 10 });
  const out = [...spot(18, 38, 12)];
  // It hovers low, wings flapping, lamp swinging on a hook.
  const flap = Math.sin(TAU * q * (walk ? 4 : 2));
  const cx = 18;
  const cy = (dead ? 30 : 18) + (dead ? 0 : -flap * 1.4);
  const lean = dead ? 90 : A ? A.lean : walk ? 8 : 0;
  const body = [];
  for (const s of [-1, 1]) {
    const tip = [cx + s * 13, cy - 4 - flap * 5];
    const wing = [[cx + s * 3, cy - 2], tip, [cx + s * 12, cy + 4 - flap * 2], [cx + s * 9, cy + 2], [cx + s * 7, cy + 6], [cx + s * 4, cy + 4]];
    body.push(T(wing, s < 0 ? fur.sh : fur.base), F(T([[cx + s * 3, cy - 1], tip, [cx + s * 6, cy + 1]], mix(fur.base, '#ffffff', 0.15))));
  }
  // The hooded cloak and round head.
  body.push(T([[cx - 5, cy - 2], [cx + 5, cy - 2], [cx + 7, cy + 12], [cx - 7, cy + 12]], hood.base), F(T([[cx + 2, cy - 2], [cx + 5, cy - 2], [cx + 7, cy + 12], [cx + 3, cy + 12]], hood.sh)));
  body.push(...blob(cx + 1, cy - 4, 6.6, 6, fur));
  body.push(T([...arcPts(cx + 0.4, cy - 4, 7.8, 7.4, 150, 250, 10), [cx - 2, cy - 6], [cx - 3, cy + 1]], hood.base));
  body.push(T([[cx - 4, cy - 10], [cx - 7, cy - 16], [cx - 1, cy - 11]], fur.sh), T([[cx + 4, cy - 10.4], [cx + 6, cy - 16.6], [cx + 7, cy - 9]], fur.base));
  body.push(...cuteFace(cx + 2, cy - 3.6, 0.9, mood, { iris: '#ffd36b', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fur.base, mouthDy: 3.4 }));
  body.push(F(T([[cx + 1, cy - 0.2], [cx + 1.8, cy - 0.2], [cx + 1.4, cy + 1.4]], '#ffffff')));
  // The lamp on a hook, swinging, and a fan of cue cards in its hand.
  const ls = Math.sin(TAU * q) * 10;
  const lx = cx - 6 + Math.sin(ls * D2R) * 6;
  body.push(...limb([cx - 5, cy + 6], [lx, cy + 12], 0.7, 0.7, '#8a7aa0'), R(lx - 2, cy + 12, 4, 5, '#ffd36b'), F(R(lx - 1.2, cy + 13, 2.4, 3, '#fff6c8')));
  const arm = A ? A.arm : walk ? -30 + flap * 6 : -30;
  const hand = [cx + 5 + Math.cos(arm * D2R) * 6, cy + 4 + Math.sin(arm * D2R) * 6];
  body.push(...limb([cx + 5, cy + 4], hand, 2.4, 2, fur.base));
  if (!A || A.card) for (let i = 0; i < 3; i++) body.push(...spin([R(hand[0], hand[1] - 5, 5, 6.6, i === 2 ? '#ffffff' : '#fff4dc'), F(R(hand[0] + 1, hand[1] - 3, 3, 0.6, '#c9b8a8')), F(R(hand[0] + 1, hand[1] - 1.6, 2.4, 0.6, '#c9b8a8'))], hand[0], hand[1], -20 + i * 14));
  out.push(...spin(body, cx, cy + 6, lean));
  if (A?.fling) out.push(smear([[cx, cy - 10], [cx + 10, cy - 6], [cx + 20, cy + 2]], 3, '#fffaf0'), ...spin([R(cx + 21, cy - 1, 5, 6.6, '#ffffff'), F(R(cx + 22, cy + 1, 3, 0.6, '#ff6b9a'))], cx + 23, cy + 2, 30));
  if (A?.hit) out.push(...star(cx + 26, cy + 4, 3, '#fff6a8'));
  return { w: 38, h: 40, res: 3, shapes: out };
}

export const ART = {
  understudy: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 180], draw: ghost },
  chorusgirl: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 210, 170], draw: flamingo },
  stagehand: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [60, 210, 170], draw: mole },
  primadonna: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [90, 280, 200], draw: frog },
  paperdragon: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [70, 230, 180], draw: dragon },
  prompter: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [60, 210, 170], draw: bat },
};

export const INFO = {
  understudy: { name: 'Understudy Ghost', w: 26, h: 34 },
  chorusgirl: { name: 'Chorus Flamingo', w: 24, h: 42 },
  stagehand: { name: 'Stagehand Mole', w: 26, h: 34 },
  primadonna: { name: 'Prima Donna Frog', w: 30, h: 38 },
  paperdragon: { name: 'Paper Dragon', w: 44, h: 36 },
  prompter: { name: 'Prompter Bat', w: 26, h: 34 },
};
