// Monster art: the Sunken Aquarium Palace's bosses (docs/design/aquarium-palace.md), redrawn
// creature-first and big (2026-11-03): chibi proportions at two and a half to three times the
// hero's height, each with one signature shape that reads across the room.
//   moraymurri / morayena  The Twin Morays: great round-headed eels rearing up out of a coil on
//                          the floor, a frilled crest down the back. Murri green and spotted with
//                          a coral crown; Ena gold with fin frills at her cheeks and long lashes.
//                          They rear back, lunge and bite.
//   abyssia                Lady Abyssia, the Sea Witch: a big round octopus in a nautilus-shell
//                          witch hat with a glowing pearl staff, on eight curling arms; she raises
//                          the staff and slams her arms down in a splash of ink.
//   coralie                Queen Coralie, the Drowned Queen: a chibi mermaid queen, seafoam hair
//                          drifting up round a coral crown, a great curled tail and a trident she
//                          drives down in a wave.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, bubbles, ink, cuteFace, blob } from './critter.js';
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// ---------- The Twin Morays ----------

// Attack keys: head: where the head reaches (dx, dy from rest), gape: jaw open, coil: the floor
// coil squeezing, smear on the strike, bite: the snap.
const MORAY_ATK = [
  { head: [-14, -8], gape: 0.2, coil: 1 },
  { head: [20, 10], gape: 1, coil: -0.4, smear: 1 },
  { head: [24, 12], gape: 0, coil: -0.5, bite: 1 },
  { head: [22, 11], gape: 0.1, coil: -0.3 },
  { head: [4, 2], gape: 0.2, coil: 0.3 },
];

function moray(pose, f, mood, sis) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MORAY_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const ena = sis === 'ena';
  const skin = ramp(ena ? '#f2c45a' : '#6fc48a', { step: 10, turn: 14, sat: -4 });
  const belly = ramp(ena ? '#fff0c4' : '#e0f6c8', { step: 8 });
  const frill = ramp(ena ? '#ff9a6a' : '#3f9a7a', { step: 10 });
  const out = [];
  // The coil on the floor: two fat loops of body.
  const sq = A ? A.coil : walk ? Math.sin(TAU * q * 2) * 0.4 : breath(q) * 0.3;
  for (const [x, w, c] of [[30, 26, skin.sh], [44, 30, skin.base]]) out.push(O(x, 96 + sq, w / 2 + sq, 7 - sq, 0, c, 20), crescent(x, 96 + sq, w / 2 + sq, 7 - sq, skin.deep, { k: 0.3, a0: 40, a1: 160 }));
  out.push(F(O(44, 93 + sq, 10, 2.4, 0, skin.hi, 14)));
  // The neck: rising from the coil in an S, a travelling wave as it slithers; the head rides its
  // end (pushed by the attack).
  const ph = TAU * q * (walk ? 2 : 1);
  const amp = dead ? 0 : walk ? 12 : 7;
  const neck = chain(40, 92, -84, [12, 12, 12, 11, 10], dead ? () => 16 : (i) => (i ? 6 : 0) + amp * Math.sin(ph - i * 0.9) * (0.4 + i * 0.15));
  const [ex, ey] = A ? [neck.at(-1)[0] + A.head[0], neck.at(-1)[1] + A.head[1]] : neck.at(-1);
  const pts = neck.map((p, i) => [p[0] + ((A ? A.head[0] : 0) * i) / (neck.length - 1), p[1] + ((A ? A.head[1] : 0) * i) / (neck.length - 1)]);
  // A frilled crest down the back of the neck, fluttering.
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const fl = Math.sin(ph * 1.5 - i) * 2;
    out.push(T([[x - 7, y - 2], [x - 15 + fl, y - 8], [x - 13 + fl, y + 1], [x - 7, y + 5]], frill.base), F(T([[x - 7, y - 1], [x - 13 + fl, y - 5], [x - 8, y + 3]], frill.sh)));
  }
  out.push(strand(pts, (t) => 20 - t * 4, skin.base), strand(pts.map(([x, y]) => [x - 3, y + 1]), (t) => 7 - t * 2, skin.sh), strand(pts.map(([x, y]) => [x + 5, y]), (t) => 7 - t * 3, belly.base));
  if (!ena) for (const [i, dx, r] of [[1, -3, 2], [2, -5, 1.6], [3, -2, 2.2], [2, 2, 1.2]]) out.push(F(E(pts[i][0] + dx, pts[i][1], r, r * 0.8, skin.deep)));
  // The head: big and round, a long jaw, the face.
  const head = [];
  const hx = ex + 4;
  const hy = ey - 4;
  head.push(...blob(hx, hy, 17, 14, skin));
  head.push(F(O(hx + 6, hy + 6, 10, 6, -6, belly.base, 16)));
  const gape = dead ? 0.3 : A ? A.gape : mood === 'angry' ? 0.25 : 0.05;
  const jx = hx + 8;
  const jy = hy + 6;
  head.push(T([[jx - 8, jy], [jx + 12, jy - 3], [jx + 13, jy + 1 + gape * 9], [jx + 2, jy + 4 + gape * 9], [jx - 8, jy + 2]], '#4a1a3a'));
  if (gape > 0.3) head.push(F(O(jx + 3, jy + 2 + gape * 6, 6, 2, 0, '#ff8fab')));
  for (let i = 0; i < 4; i++) {
    const tx = jx - 4 + i * 4;
    head.push(F(T([[tx, jy - 0.6 - i * 0.6], [tx + 2, jy - 0.6 - i * 0.6], [tx + 1, jy + 2.6 - i * 0.6]], '#fffaf2')));
    if (gape > 0.3) head.push(F(T([[tx, jy + 3 + gape * 9 - i * 0.4], [tx + 2, jy + 3 + gape * 9 - i * 0.4], [tx + 1, jy + gape * 9 - i * 0.4]], '#fffaf2')));
  }
  head.push(...cuteFace(hx + 2, hy - 3, 2.2, mood, { iris: ena ? '#ff8a3a' : '#2a8a5a', gap: 4.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: skin.base, mouthDy: null, lash: ena ? 1.6 : 1.3, wing: ena ? 1.6 : 0 }));
  if (ena) {
    // Fin frills at her cheeks, and a pearl drop at her ear.
    for (const s of [-1, 1]) head.push(T([[hx - 10, hy + 2], [hx - 20, hy - 6 * s + 2], [hx - 16, hy + 4], [hx - 21, hy + 8 * s + 4], [hx - 10, hy + 7]], frill.base));
    head.push(E(hx - 12, hy + 10, 2.4, 2.4, '#f8f4ff'), F(E(hx - 12.8, hy + 9, 0.8, 0.8, '#ffffff')));
  } else {
    // Murri's coral crown: little branching prongs over the brow.
    for (const [x, h, a] of [[-8, 9, -110], [-2, 12, -92], [5, 9, -70]]) {
      const c = chain(hx + x, hy - 11, a, [h / 2, h / 2], () => 14);
      head.push(strand(c, (t) => 3 * (1 - t * 0.5), '#ff7a8a'), F(E(c.at(-1)[0], c.at(-1)[1], 1.4, 1.4, '#ffb0b8')));
    }
  }
  out.push(...spin(head, hx, hy, A ? (A.head[1] > 0 ? 12 : -10) : walk ? Math.sin(ph) * 4 : sway(q) * 3));
  if (A?.smear) out.push(smear([[hx - 34, hy - 18], [hx - 10, hy - 6], [hx + 24, hy + 6]], 10, mix(skin.hi, '#ffffff', 0.4)));
  if (A?.bite) out.push(...star(hx + 26, hy + 8, 6, '#fff6a8'), ...star(hx + 30, hy - 2, 3.4, '#ffffff'));
  if (!dead) out.push(...bubbles(hx + 18, hy - 12, q, 3, 1.4));
  const all = dead ? spin(out, 44, 100, 0) : out;
  return { w: 96, h: 106, res: 3, shapes: all };
}

// ---------- Lady Abyssia, the Sea Witch ----------

const WITCH_ATK = [
  { lift: 1, staff: -40, slam: 0, inkK: 0 },
  { lift: -0.6, staff: 30, slam: 1, inkK: 0.6, smear: 1 },
  { lift: -0.8, staff: 36, slam: 1, inkK: 1.4, hit: 1 },
  { lift: -0.5, staff: 30, slam: 0.8, inkK: 1 },
  { lift: 0.2, staff: 0, slam: 0.2, inkK: 0 },
];

function abyssia(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? WITCH_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#9a6ad8', { step: 10, turn: 14, sat: -4 });
  const spot = '#e6d4ff';
  const lift = A ? A.lift : walk ? Math.sin(TAU * q * 2) * 0.5 : breath(q) * 0.5;
  const cx = 60;
  const cy = (dead ? 80 : 46) - lift * 4;
  const out = [];
  // Eight arms curling out along the floor, rippling; the front ones rise on the wind-up and
  // slam down on the strike.
  const arms = [[-26, 160, 0], [-18, 140, 0.4], [-9, 118, 0.8], [0, 100, 1.2], [8, 82, 1.6], [16, 62, 2], [24, 40, 2.4], [30, 20, 2.8]];
  arms.forEach(([dx, deg, ph], i) => {
    const front = i >= 5;
    const far = i % 2 === 0;
    const raise = A && front ? (A.slam > 0.5 ? -10 : -70 * A.lift) : 0;
    const j = chain(cx + dx * 0.8, cy + 18, (dead ? deg * 0.5 + 45 : deg) + raise, [8, 8, 7, 6, 5], dead ? () => 6 : (k) => (k ? (dx > 0 ? -1 : 1) * (8 + k * 6) : 0) + Math.sin(TAU * q * (walk ? 2 : 1) + ph - k) * (walk ? 10 : 5));
    out.push(strand(j, (t) => 11 * (1 - t * 0.7), far ? skin.sh : skin.base));
    if (!far) for (const p of j.slice(1, 4)) out.push(F(E(p[0] + 0.6, p[1] + 3, 1.6, 1.2, spot)));
  });
  // The mantle: a big round head with spots, a face with a smug smile.
  out.push(...blob(cx, cy, 30, 26, skin));
  for (const [x, y, r] of [[-18, -10, 3], [-12, -18, 2.4], [-22, 2, 2.2], [14, -16, 1.8]]) out.push(F(E(cx + x, cy + y, r, r * 0.8, spot)));
  out.push(...cuteFace(cx + 6, cy + 4, 2.4, mood, { iris: '#ff5ab0', lip: '#c03a7a', gap: 5.2, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.5) : 0, skin: skin.base, mouthDy: 3.4, lash: 1.8, wing: 2 }));
  // The witch's hat: a wide wavy brim, a cone bending back, and its tip curled into a nautilus
  // spiral, striped like the shell.
  const hat = [];
  const sx = cx - 2;
  const sy = cy - 24;
  hat.push(O(sx, sy + 2, 30, 6, -4, '#6a3aa8', 22), F(O(sx + 2, sy, 26, 3.4, -4, '#8a5ac8', 20)));
  const cone = [[sx - 15, sy], [sx - 10, sy - 14], [sx - 6, sy - 26], [sx - 10, sy - 36], [sx + 4, sy - 34], [sx + 8, sy - 22], [sx + 13, sy - 8], [sx + 15, sy]];
  hat.push(T(cone, '#7a4ab8'), F(T([[sx + 2, sy - 30], [sx + 4, sy - 34], [sx + 8, sy - 22], [sx + 13, sy - 8], [sx + 15, sy], [sx + 6, sy]], '#5a2a98')));
  hat.push(F(T([[sx - 14, sy - 4], [sx + 14, sy - 4], [sx + 14.6, sy - 9], [sx - 12, sy - 9]], '#ffd36b')), F(E(sx + 2, sy - 6.4, 2.4, 2.4, '#ff6b9a')));
  // The nautilus curl at the tip: rings winding in, cream and coral.
  const nx0 = sx - 10;
  const ny0 = sy - 38;
  for (const [r, c] of [[7, '#f4dcb0'], [5, '#e08a5a'], [3.4, '#f4dcb0'], [1.8, '#e08a5a']]) hat.push(E(nx0 + (7 - r) * 0.5, ny0 + (7 - r) * 0.3, r, r, c));
  hat.push(F(E(nx0 - 2.4, ny0 - 2.6, 1.6, 1.2, '#ffffff')));
  out.push(...spin(hat, sx, sy, walk ? Math.sin(TAU * q * 2) * 3 : sway(q) * 2));
  // The pearl staff in a raised arm.
  const st = A ? A.staff : -10 + (walk ? Math.sin(TAU * q * 2) * 6 : sway(q) * 4);
  const bx = cx + 30;
  const by = cy + 4;
  const top = [bx + Math.cos((st - 90) * D2R) * 36, by + Math.sin((st - 90) * D2R) * 36];
  const holder = chain(cx + 20, cy + 14, -20, [8, 7], () => -20);
  out.push(strand([...holder, [bx, by]], (t) => 8 * (1 - t * 0.4), skin.base));
  out.push(...limb([bx - (top[0] - bx) * 0.3, by - (top[1] - by) * 0.3], top, 2.6, 2.4, '#7a5a3a'));
  out.push(F(E(top[0], top[1], 9, 9, '#f0e6ff')), E(top[0], top[1], 5.4, 5.4, '#fbf6ff'), crescent(top[0], top[1], 5.4, 5.4, '#d8c8f0', { k: 0.3 }), F(E(top[0] - 1.6, top[1] - 1.8, 1.8, 1.4, '#ffffff')));
  if (A && f === 0) out.push(...star(top[0] + 6, top[1] - 6, 4, '#ffe0ff'), ...star(top[0] - 6, top[1] + 4, 2.6, '#ffffff'));
  if (A?.smear) out.push(smear([[cx + 20, cy - 30], [cx + 46, cy - 6], [cx + 52, cy + 40]], 12, '#e6d4ff'));
  if (A?.inkK) out.push(...ink(cx + 54, 104, A.inkK * 2.6), ...ink(cx + 40, 108, A.inkK * 1.8));
  if (A?.hit) out.push(...star(cx + 58, 98, 7, '#fff6a8'));
  if (!dead) out.push(...bubbles(cx - 20, cy - 34, q, 3, 1.4));
  return { w: 124, h: 118, res: 3, shapes: out };
}

// ---------- Queen Coralie, the Drowned Queen ----------

const QUEEN_ATK = [
  { tri: -150, rise: 1, flare: 1 },
  { tri: -20, rise: -0.4, flare: 0.4, smear: 1 },
  { tri: 10, rise: -0.6, flare: 0.2, splash: 1 },
  { tri: 6, rise: -0.4, flare: 0.3, splash: 0.6 },
  { tri: -40, rise: 0.2, flare: 0.5 },
];

function coralie(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? QUEEN_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#ffe6dc', { step: 8, turn: 10, sat: -10 });
  const tail = ramp('#4fc0c8', { step: 10, turn: 14, sat: -4 });
  const fin = ramp('#9fe8f0', { step: 10 });
  const hair = ramp('#9fe8d4', { step: 10, turn: 12 });
  const rise = A ? A.rise : walk ? Math.sin(TAU * q * 2) * 0.6 : breath(q) * 0.6;
  const cx = 54;
  const hy0 = (dead ? 90 : 38) - rise * 4;
  const ph = TAU * q * (walk ? 2 : 1);
  const out = [];
  // Hair: soft seafoam locks drifting up and back in the water, each a full round-ended wave
  // (never spikes), with a lighter streak along it.
  const flare = A ? A.flare : 0.3;
  for (const [dx, deg, len, c] of [[-16, 168, 9, hair.sh], [-14, -160, 10, hair.base], [-8, -128, 10, hair.base], [-18, 140, 8, hair.sh], [-2, -104, 8, hair.base]]) {
    const j = chain(cx + dx, hy0 - 4, deg - flare * 12, [len, len, len - 1, len - 2], dead ? () => 10 : wave(ph + dx * 0.2, 8 + flare * 6, 0.8));
    out.push(strand(j, (t) => 12 * (1 - t * 0.3), c), E(j.at(-1)[0], j.at(-1)[1], 4.6, 4.6, c), strand(j.slice(0, 4).map(([x, y]) => [x + 1, y + 1.6]), (t) => 3 * (1 - t * 0.5), hair.hi));
  }
  // The tail: from her hips down and round to a great fan fin on the floor behind her.
  const hip = [cx - 2, hy0 + 40];
  const tj = chain(hip[0], hip[1], 96, [12, 12, 11, 10, 9], dead ? () => 4 : (i) => (i ? 20 : 0) + Math.sin(ph - i * 0.8) * (walk ? 8 : 4));
  out.push(strand(tj, (t) => 26 - t * 18, tail.base), strand(tj.map(([x, y]) => [x - 4, y + 1]), (t) => 8 - t * 6, tail.sh));
  for (let i = 1; i < tj.length - 1; i++) for (const s of [-1, 1]) out.push(F(O(tj[i][0] + s * 3, tj[i][1], 3, 2, 0, tail.hi, 10)));
  const ft = tj.at(-1);
  const fw = Math.sin(ph) * 8;
  out.push(T([[ft[0], ft[1]], [ft[0] - 24, ft[1] - 14 + fw], [ft[0] - 16, ft[1] + 1], [ft[0] - 26, ft[1] + 12 + fw * 0.5], [ft[0] + 2, ft[1] + 6]], fin.base), F(T([[ft[0], ft[1] + 2], [ft[0] - 18, ft[1] - 6 + fw], [ft[0] - 14, ft[1] + 2]], fin.sh)));
  // A skirt of fins at her waist.
  for (let i = 0; i < 6; i++) {
    const x = cx - 14 + i * 5.6;
    const sw = Math.sin(ph + i) * 2;
    out.push(T([[x - 3, hy0 + 36], [x + 3, hy0 + 36], [x + 2 + sw, hy0 + 46], [x - 2 + sw, hy0 + 44]], i % 2 ? fin.base : fin.sh));
  }
  // A small body: shoulders, a shell bodice, short arms.
  out.push(...blob(cx, hy0 + 30, 11, 9, skin, { lit: 0.6 }));
  for (const s of [-1, 1]) out.push(O(cx + s * 5, hy0 + 28, 5, 4, s * 20, '#ff9ab8', 14), F(O(cx + s * 5, hy0 + 27, 3.4, 2.4, s * 20, '#ffc6d8', 12)));
  out.push(E(cx, hy0 + 25, 2, 2, '#f8f4ff'));
  // The head: big and round, a face with a regal little smile, the coral crown.
  out.push(...blob(cx, hy0, 22, 20, skin, { lit: 0.8 }));
  out.push(T([...arcPts(cx - 2, hy0 - 2, 23, 21, 170, 330, 16), [cx + 18, hy0 - 4], [cx + 8, hy0 - 10], [cx - 2, hy0 - 8], [cx - 12, hy0 - 2], [cx - 20, hy0 + 6]], hair.base));
  out.push(F(T(arcPts(cx - 2, hy0 - 2, 20, 18, 220, 300, 8).concat([[cx + 4, hy0 - 12]]), hair.hi)));
  out.push(...cuteFace(cx + 6, hy0 + 6, 2.6, mood, { iris: '#3ab0c8', lip: '#e0507a', gap: 5, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: skin.base, mouthDy: 3.4, lash: 1.9, wing: 2 }));
  for (const [x, h, a] of [[-12, 14, -112], [-4, 18, -96], [4, 16, -82], [12, 12, -66]]) {
    const c = chain(cx + x, hy0 - 19, a, [h / 2, h / 2], (i) => (i ? 18 : 0));
    out.push(strand(c, (t) => 4.4 * (1 - t * 0.5), '#ff6b8a'), F(E(c.at(-1)[0], c.at(-1)[1], 2, 2, '#ffb0c0')));
    const br = chain(c[1][0], c[1][1], a + 40, [4], () => 0);
    out.push(strand(br, 2, '#ff6b8a'));
  }
  out.push(E(cx - 2, hy0 - 19, 2.6, 2.6, '#f8f4ff'), F(E(cx - 2.8, hy0 - 20, 0.9, 0.9, '#ffffff')));
  // The trident in her arm: raised high on the wind-up, driven down on the strike.
  const tr = A ? A.tri : -60 + (walk ? Math.sin(ph) * 6 : sway(q) * 5);
  const sh = [cx + 10, hy0 + 28];
  const hand = [sh[0] + Math.cos((tr + 40) * D2R) * 10, sh[1] + Math.sin((tr + 40) * D2R) * 10];
  out.push(...limb(sh, hand, 4, 3.4, skin.base));
  const dir = [Math.cos(tr * D2R), Math.sin(tr * D2R)];
  const butt = [hand[0] - dir[0] * 18, hand[1] - dir[1] * 18];
  const tip = [hand[0] + dir[0] * 34, hand[1] + dir[1] * 34];
  out.push(...limb(butt, tip, 2.6, 2.6, '#e8b84a'));
  const nx = -dir[1];
  const ny = dir[0];
  for (const s of [-1, 0, 1]) {
    const bx = tip[0] + nx * s * 5;
    const by = tip[1] + ny * s * 5;
    out.push(T([[bx - nx * 1.4, by - ny * 1.4], [bx + dir[0] * (s ? 7 : 10), by + dir[1] * (s ? 7 : 10)], [bx + nx * 1.4, by + ny * 1.4]], '#ffd36b'));
  }
  out.push(...limb([tip[0] + nx * 6, tip[1] + ny * 6], [tip[0] - nx * 6, tip[1] - ny * 6], 2.4, 2.4, '#e8b84a'));
  if (A?.smear) out.push(smear([[tip[0] - 30, tip[1] - 40], [tip[0] - 10, tip[1] - 16], [tip[0] + 6, tip[1] + 6]], 10, '#e6fbff'));
  if (A?.splash) {
    const k = A.splash;
    for (let i = 0; i < 5; i++) {
      const a = -160 + i * 35;
      out.push(F(O(tip[0] + Math.cos(a * D2R) * 10 * k, Math.min(126, tip[1] + 6) + Math.sin(a * D2R) * 8 * k, 4 * k, 2.4 * k, a, '#bff4ff')));
    }
    out.push(...star(tip[0] + 6, Math.min(122, tip[1]), 6 * k, '#fff6a8'));
  }
  if (!dead) out.push(...bubbles(cx + 20, hy0 - 22, q, 3, 1.5));
  return { w: 112, h: 132, res: 3, shapes: out };
}

// ---------- The Aquarium's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) Live skeletons (render/mobs/rig.js): the morays' necks are
// chains of five segments that a wave runs up, the head kept level at the end with a jaw that
// hinges open for the bite; Abyssia's eight arms are chains that ripple and rise; Coralie's hair
// drifts up in chains, her tail sways down to its fin. Rig space: the floor under them at (0, 0).
const DG = Math.PI / 180;

function morayRig(sis) {
  const ena = sis === 'ena';
  const skin = ramp(ena ? '#f2c45a' : '#6fc48a', { step: 10, turn: 14, sat: -4 });
  const belly = ramp(ena ? '#fff0c4' : '#e0f6c8', { step: 8 });
  const frill = ramp(ena ? '#ff9a6a' : '#3f9a7a', { step: 10 });
  const key = `moray|${sis}`;
  const SEGS = [12, 12, 12, 11, 10].map((l, i) => [l, 20 - i * 0.8, 20 - (i + 1) * 0.8]);
  const parts = {
    coil: () => part(`${key}|coil`, 64, 20, () => {
      const out = [];
      for (const [x, w, c] of [[18, 26, skin.sh], [32, 30, skin.base]]) out.push(O(x, 10, w / 2, 7, 0, c, 20), crescent(x, 10, w / 2, 7, skin.deep, { k: 0.3, a0: 40, a1: 160 }));
      out.push(F(O(32, 7, 10, 2.4, 0, skin.hi, 14)));
      return out;
    }),
    head: () => part(`${key}|head`, 64, 50, () => {
      const hx = 28;
      const hy = 26;
      const jx = hx + 8;
      const jy = hy + 6;
      const out = [...blob(hx, hy, 17, 14, skin), F(O(hx + 6, hy + 6, 10, 6, -6, belly.base, 16))];
      // The mouth's dark inside and the upper teeth; the lower jaw hinges over it.
      out.push(T([[jx - 8, jy], [jx + 12, jy - 3], [jx + 13, jy + 7], [jx + 2, jy + 9], [jx - 8, jy + 2]], '#4a1a3a'), F(O(jx + 4, jy + 5, 5, 2, 0, '#ff8fab')));
      for (let i = 0; i < 4; i++) {
        const tx = jx - 4 + i * 4;
        out.push(F(T([[tx, jy - 0.6 - i * 0.6], [tx + 2, jy - 0.6 - i * 0.6], [tx + 1, jy + 2.6 - i * 0.6]], '#fffaf2')));
      }
      if (ena) {
        for (const sd of [-1, 1]) out.push(T([[hx - 10, hy + 2], [hx - 20, hy - 6 * sd + 2], [hx - 16, hy + 4], [hx - 21, hy + 8 * sd + 4], [hx - 10, hy + 7]], frill.base));
        out.push(E(hx - 12, hy + 10, 2.4, 2.4, '#f8f4ff'), F(E(hx - 12.8, hy + 9, 0.8, 0.8, '#ffffff')));
      } else {
        for (const [x, h, a] of [[-8, 9, -110], [-2, 12, -92], [5, 9, -70]]) {
          const c = chain(hx + x, hy - 11, a, [h / 2, h / 2], () => 14);
          out.push(strand(c, (t) => 3 * (1 - t * 0.5), '#ff7a8a'), F(E(c.at(-1)[0], c.at(-1)[1], 1.4, 1.4, '#ffb0b8')));
        }
      }
      return out;
    }),
    // The lower jaw, hinged at (2, 3): closed it covers the mouth.
    jaw: () => part(`${key}|jaw`, 26, 14, () => {
      const out = [T([[2, 3], [21, 0], [22, 5], [12, 9], [2, 6]], skin.sh), F(T([[4, 5], [20, 3], [12, 8]], belly.base))];
      for (let i = 0; i < 4; i++) out.push(F(T([[5 + i * 4, 3.4], [7 + i * 4, 3.4], [6 + i * 4, 0.6]], '#fffaf2')));
      return out;
    }),
    face: (mood, atk) => part(`${key}|face|${mood}|${atk}`, 28, 18, () => cuteFace(14, 9, 2.2, mood, { iris: ena ? '#ff8a3a' : '#2a8a5a', gap: 4.6, atk, skin: skin.base, mouthDy: null, lash: ena ? 1.6 : 1.3, wing: ena ? 1.6 : 0 })),
  };
  const neckShape = (i, len, w0, w1, x0, y0) => {
    const out = [...limb([x0, y0], [x0 + len, y0], w0, w1, skin.base), F(limb([x0, y0 + w0 * 0.28], [x0 + len, y0 + w1 * 0.28], w0 * 0.36, w1 * 0.36, belly.base)[0]), F(limb([x0, y0 - w0 * 0.3], [x0 + len, y0 - w1 * 0.3], w0 * 0.3, w1 * 0.3, skin.sh)[0])];
    if (i > 0) out.push(T([[x0 + 2, y0 - w0 / 2 + 1], [x0 + 6, y0 - w0 / 2 - 7], [x0 + 9, y0 - w0 / 2 - 5], [x0 + len, y0 - w1 / 2 + 1]], frill.base));
    if (!ena && i % 2) out.push(F(E(x0 + len * 0.5, y0 - 3, 2, 1.6, skin.deep)));
    return out;
  };
  const neckAngles = (S) => [0, 1, 2, 3, 4].reduce((a, i) => a + S[`n${i}`], 0);
  return makeRig({
    w: 56,
    h: 96,
    stride: 46,
    fast: ['n0', 'n1', 'n2', 'n3', 'n4', 'gape', 'head'],
    kick: { n1: -3, n3: 4 },
    springs: { n0: [260, 20], n1: [200, 14], n2: [160, 11], n3: [130, 9], n4: [110, 8] },
    pose(m, a) {
      const t = a.t * (ena ? 1.08 : 1);
      const ph = a.walkW > 0.5 ? a.wp : t * 1.6;
      const amp = 7 + a.walkW * 5;
      const bend = (i) => ((i ? 6 : 0) + amp * Math.sin(ph - i * 0.9) * (0.4 + i * 0.15)) * DG;
      const idle = { n0: -84 * DG + bend(0), n1: bend(1), n2: bend(2), n3: bend(3), n4: bend(4), gape: a.mood === 'angry' ? 0.15 : 0.02, head: Math.sin(t * 1.3) * 0.06 };
      const antic = { n0: -100 * DG, n1: -16 * DG, n2: -12 * DG, n3: -6 * DG, n4: 4 * DG, gape: 0.25, head: -0.15 };
      const strike = { n0: -52 * DG, n1: 12 * DG, n2: 12 * DG, n3: 10 * DG, n4: 6 * DG, gape: a.ph.since >= 0 && a.ph.since < 0.08 ? 0.9 : 0, head: 0.2 };
      return stateBlend(a, idle, idle, antic, strike);
    },
    parts: [
      { name: 'coil', pivot: [26, 10], at: () => [0, -6], s: () => parts.coil() },
      ...chainParts('n', { parent: null, at: () => [0, -8], segs: SEGS, key, shape: neckShape, rot: (S, a, i) => S[`n${i}`] }),
      // The head rides the neck's end, kept level (its own small nod on top).
      { name: 'head', parent: 'n4', pivot: [22, 30], at: () => [10, 0], rot: (S) => -neckAngles(S) + S.head, s: () => parts.head() },
      { name: 'jaw', parent: 'head', pivot: [2, 3], at: () => [14, 2], rot: (S) => S.gape * 0.6, s: () => parts.jaw() },
      { name: 'face', parent: 'head', pivot: [14, 9], at: () => [8, -7], s: (a) => parts.face(a.face, a.atk) },
    ],
    fx(ctx, m, a, S, mat) {
      // Bubbles drifting up off the head.
      if (m.hp > 0) inPart(ctx, mat, 'head', () => {
        for (let k = 0; k < 3; k++) {
          const u = (a.t * 0.4 + k / 3) % 1;
          ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
          ctx.strokeStyle = '#d8f4ff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(18 + Math.sin(u * 6 + k) * 3, -14 - u * 30, 1.6 + k * 0.4, 0, TAU);
          ctx.stroke();
        }
      });
      if (a.ph.since >= 0 && a.ph.since < 0.2) inPart(ctx, mat, 'head', () => {
        ctx.globalAlpha = a.alpha * (1 - a.ph.since / 0.2);
        ctx.fillStyle = '#fff6a8';
        ctx.beginPath();
        ctx.arc(30, 4, 5, 0, TAU);
        ctx.fill();
      });
    },
  });
}

// Lady Abyssia.
const AB = { skin: ramp('#9a6ad8', { step: 10, turn: 14, sat: -4 }), spot: '#e6d4ff' };
const ABY_ARMS = [[-26, 160, 0], [-18, 140, 0.4], [-9, 118, 0.8], [0, 100, 1.2], [8, 82, 1.6], [16, 62, 2], [24, 40, 2.4], [30, 20, 2.8]];
const abParts = {
  mantle: () => part('abyssia|mantle', 64, 56, () => {
    const out = [...blob(32, 28, 30, 26, AB.skin)];
    for (const [x, y, r] of [[-18, -10, 3], [-12, -18, 2.4], [-22, 2, 2.2], [14, -16, 1.8]]) out.push(F(E(32 + x, 28 + y, r, r * 0.8, AB.spot)));
    return out;
  }),
  face: (mood, atk) => part(`abyssia|face|${mood}|${atk}`, 30, 26, () => cuteFace(15, 10, 2.4, mood, { iris: '#ff5ab0', lip: '#c03a7a', gap: 5.2, atk, skin: AB.skin.base, mouthDy: 3.4, lash: 1.8, wing: 2 })),
  hat: () => part('abyssia|hat', 64, 52, () => {
    const sx = 32;
    const sy = 44;
    const out = [O(sx, sy + 2, 30, 6, -4, '#6a3aa8', 22), F(O(sx + 2, sy, 26, 3.4, -4, '#8a5ac8', 20))];
    const cone = [[sx - 15, sy], [sx - 10, sy - 14], [sx - 6, sy - 26], [sx - 10, sy - 36], [sx + 4, sy - 34], [sx + 8, sy - 22], [sx + 13, sy - 8], [sx + 15, sy]];
    out.push(T(cone, '#7a4ab8'), F(T([[sx + 2, sy - 30], [sx + 4, sy - 34], [sx + 8, sy - 22], [sx + 13, sy - 8], [sx + 15, sy], [sx + 6, sy]], '#5a2a98')));
    out.push(F(T([[sx - 14, sy - 4], [sx + 14, sy - 4], [sx + 14.6, sy - 9], [sx - 12, sy - 9]], '#ffd36b')), F(E(sx + 2, sy - 6.4, 2.4, 2.4, '#ff6b9a')));
    for (const [r, c] of [[7, '#f4dcb0'], [5, '#e08a5a'], [3.4, '#f4dcb0'], [1.8, '#e08a5a']]) out.push(E(sx - 10 + (7 - r) * 0.5, sy - 38 + (7 - r) * 0.3, r, r, c));
    return out;
  }),
  staff: () => part('abyssia|staff', 22, 60, () => [...limb([11, 56], [11, 12], 2.6, 2.4, '#7a5a3a'), E(11, 10, 5.4, 5.4, '#fbf6ff'), crescent(11, 10, 5.4, 5.4, '#d8c8f0', { k: 0.3 }), F(E(9.4, 8.2, 1.8, 1.4, '#ffffff'))]),
};
const armShape = (dark) => (i, len, w0, w1, x0, y0) => {
  const out = [...limb([x0, y0], [x0 + len, y0], w0, w1, dark ? AB.skin.sh : AB.skin.base)];
  if (!dark) out.push(F(E(x0 + len * 0.5, y0 + w0 * 0.25, 1.6, 1.2, AB.spot)));
  return out;
};
const abyssiaRig = makeRig({
  w: 80,
  h: 100,
  stride: 40,
  fast: ['lift', 'staff', 'raise'],
  kick: { lift: -3, hat: 4 },
  springs: { hat: [60, 4.5], a0: [180, 12], a1: [140, 9], a2: [110, 7] },
  pose(m, a) {
    const t = a.t;
    const ph = a.walkW > 0.5 ? a.wp : t * 1.4;
    const amp = 5 + a.walkW * 5;
    const idle = { lift: Math.sin(t * 1.6) * 2, staff: -10 * DG + Math.sin(t * 1.2) * 0.06, raise: 0, a0: Math.sin(ph) * amp * DG, a1: Math.sin(ph - 1) * amp * DG, a2: Math.sin(ph - 2) * amp * DG, tilt: Math.sin(t * 1.1) * 0.04 };
    const antic = { lift: 6, staff: -40 * DG, raise: -70 * DG, a0: -6 * DG, a1: -6 * DG, a2: -4 * DG, tilt: -0.08 };
    const strike = { lift: -4, staff: 32 * DG, raise: -10 * DG, a0: 8 * DG, a1: 6 * DG, a2: 4 * DG, tilt: 0.1 };
    return stateBlend(a, idle, idle, antic, strike);
  },
  follow: (S) => ({ hat: -S.tilt * 1.6 + S.lift * 0.02 }),
  parts: [
    { name: 'root', at: (S) => [0, -48 - S.lift], rot: (S) => S.tilt },
    ...ABY_ARMS.flatMap(([dx, deg, off], i) => chainParts(`arm${i}`, {
      parent: 'root', at: () => [dx * 0.8, 18], key: `abyssia|arm|${i % 2}`,
      segs: [[16, 11, 8.4], [13, 8.4, 5.6], [10, 5.6, 3.3]],
      shape: armShape(i % 2 === 0),
      rot: (S, a, k) => {
        const curl = (dx > 0 ? -1 : 1) * (8 + k * 6) * DG;
        const wave = S[`a${k}`] * Math.cos(off);
        if (k === 0) return deg * DG + (i >= 5 ? S.raise : 0) + wave - S.tilt;
        return curl + wave;
      },
    })),
    { name: 'mantle', parent: 'root', pivot: [32, 28], at: () => [0, 0], s: () => abParts.mantle() },
    { name: 'face', parent: 'mantle', pivot: [15, 10], at: () => [6, 0], s: (a) => abParts.face(a.face, a.atk) },
    { name: 'hat', parent: 'mantle', pivot: [32, 44], at: () => [-2, -24], rot: (S) => S.hat, s: () => abParts.hat() },
    ...chainParts('holder', { parent: 'mantle', at: () => [20, 14], key: 'abyssia|holder', segs: [[8, 8, 6.4], [7, 6.4, 4.8]], color: AB.skin.base, rot: (S, a, k) => (k ? -20 * DG : -20 * DG) }),
    { name: 'staff', parent: 'holder1', pivot: [11, 44], at: () => [7, 0], rot: (S) => 40 * DG + S.staff, s: () => abParts.staff() },
  ],
  fx(ctx, m, a, S, mat) {
    // The pearl's glow, and the ink where the slam lands.
    inPart(ctx, mat, 'staff', () => {
      // (Part space: the grip at the origin, the pearl 34 px up the staff.)
      const g = ctx.createRadialGradient(0, -34, 1, 0, -34, 12 + a.ph.antic * 6);
      g.addColorStop(0, `rgba(250,240,255,${(0.5 + a.ph.antic * 0.4) * a.alpha})`);
      g.addColorStop(1, 'rgba(240,230,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-19, -53, 38, 38);
    });
    if (a.ph.since >= 0 && a.ph.since < 0.6) {
      const u = a.ph.since / 0.6;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.85;
      for (const [x, r] of [[54, 8], [42, 6], [64, 5]]) {
        ctx.fillStyle = '#3a2d5a';
        ctx.beginPath();
        ctx.arc(x, -4, r * (0.6 + u), 0, TAU);
        ctx.fill();
      }
    }
  },
});

// Queen Coralie.
const CR = { skin: ramp('#ffe6dc', { step: 8, turn: 10, sat: -10 }), tail: ramp('#4fc0c8', { step: 10, turn: 14, sat: -4 }), fin: ramp('#9fe8f0', { step: 10 }), hair: ramp('#9fe8d4', { step: 10, turn: 12 }) };
const CR_LOCKS = [[-16, 168, 9, 'sh'], [-14, -160, 10, 'base'], [-8, -128, 10, 'base'], [-18, 140, 8, 'sh'], [-2, -104, 8, 'base']];
const crParts = {
  body: () => part('coralie|body', 30, 26, () => {
    const out = [...blob(15, 13, 11, 9, CR.skin, { lit: 0.6 })];
    for (const sd of [-1, 1]) out.push(O(15 + sd * 5, 11, 5, 4, sd * 20, '#ff9ab8', 14), F(O(15 + sd * 5, 10, 3.4, 2.4, sd * 20, '#ffc6d8', 12)));
    out.push(E(15, 8, 2, 2, '#f8f4ff'));
    return out;
  }),
  skirt: () => part('coralie|skirt', 40, 16, () => Array.from({ length: 6 }, (_, i) => T([[6 + i * 5.6 - 3, 2], [6 + i * 5.6 + 3, 2], [6 + i * 5.6 + 2, 12], [6 + i * 5.6 - 2, 10]], i % 2 ? CR.fin.base : CR.fin.sh))),
  head: () => part('coralie|head', 56, 66, () => {
    const cx = 28;
    const hy = 40;
    const out = [...blob(cx, hy, 22, 20, CR.skin, { lit: 0.8 })];
    out.push(T([...arcPts(cx - 2, hy - 2, 23, 21, 170, 330, 16), [cx + 18, hy - 4], [cx + 8, hy - 10], [cx - 2, hy - 8], [cx - 12, hy - 2], [cx - 20, hy + 6]], CR.hair.base));
    out.push(F(T(arcPts(cx - 2, hy - 2, 20, 18, 220, 300, 8).concat([[cx + 4, hy - 12]]), CR.hair.hi)));
    for (const [x, h, a] of [[-12, 14, -112], [-4, 18, -96], [4, 16, -82], [12, 12, -66]]) {
      const c = chain(cx + x, hy - 19, a, [h / 2, h / 2], (i) => (i ? 18 : 0));
      out.push(strand(c, (t) => 4.4 * (1 - t * 0.5), '#ff6b8a'), F(E(c.at(-1)[0], c.at(-1)[1], 2, 2, '#ffb0c0')));
      out.push(strand(chain(c[1][0], c[1][1], a + 40, [4], () => 0), 2, '#ff6b8a'));
    }
    out.push(E(cx - 2, hy - 19, 2.6, 2.6, '#f8f4ff'), F(E(cx - 2.8, hy - 20, 0.9, 0.9, '#ffffff')));
    return out;
  }),
  face: (mood, atk) => part(`coralie|face|${mood}|${atk}`, 32, 24, () => cuteFace(16, 9, 2.6, mood, { iris: '#3ab0c8', lip: '#e0507a', gap: 5, atk, skin: CR.skin.base, mouthDy: 3.4, lash: 1.9, wing: 2 })),
  fin: () => part('coralie|fin', 32, 30, () => [T([[28, 14], [4, 0], [12, 15], [2, 26], [30, 20]], CR.fin.base), F(T([[28, 16], [10, 8], [14, 16]], CR.fin.sh))]),
  arm: () => part('coralie|arm', 16, 8, () => [...limb([3, 4], [13, 4], 4, 3.4, CR.skin.base)]),
  trident: () => part('coralie|trident', 64, 18, () => {
    const out = [...limb([2, 9], [54, 9], 2.6, 2.6, '#e8b84a'), ...limb([54, 3], [54, 15], 2.4, 2.4, '#e8b84a')];
    for (const sd of [-1, 0, 1]) out.push(T([[54, 9 + sd * 5 - 1.4], [54 + (sd ? 7 : 10), 9 + sd * 5], [54, 9 + sd * 5 + 1.4]], '#ffd36b'));
    return out;
  }),
};
const tailShape = (i, len, w0, w1, x0, y0) => {
  const out = [...limb([x0, y0], [x0 + len, y0], w0, w1, CR.tail.base), F(limb([x0, y0 - w0 * 0.25], [x0 + len, y0 - w1 * 0.25], w0 * 0.3, w1 * 0.3, CR.tail.sh)[0])];
  for (const sd of [-1, 1]) out.push(F(O(x0 + len * 0.5, y0 + sd * 3, 3, 2, 0, CR.tail.hi, 10)));
  return out;
};
const lockShape = (c) => (i, len, w0, w1, x0, y0) => {
  const out = [...limb([x0, y0], [x0 + len, y0], w0, w1, c)];
  if (i === 2) out.push(E(x0 + len, y0, 4.6, 4.6, c));
  if (i === 0) out.push(F(limb([x0, y0 + 1.6], [x0 + len, y0 + 1.6], 3, 2.4, CR.hair.hi)[0]));
  return out;
};
const coralieRig = makeRig({
  w: 64,
  h: 124,
  stride: 50,
  fast: ['tri', 'rise', 'lean'],
  kick: { lean: -1.6, t1: 3 },
  springs: { t0: [160, 11], t1: [120, 8], t2: [90, 6], t3: [70, 5], t4: [55, 4], hair: [50, 4], skirt: [90, 6] },
  pose(m, a) {
    const t = a.t;
    const ph = a.walkW > 0.5 ? a.wp : t * 1.5;
    const amp = 4 + a.walkW * 4;
    const tb = (i) => ((i ? 20 : 0) + Math.sin(ph - i * 0.8) * amp) * DG;
    const idle = { rise: Math.sin(t * 1.6) * 2.4, lean: Math.sin(t * 1.1) * 0.04, tri: -60 * DG + Math.sin(t * 1.2) * 0.08, t0: 96 * DG + tb(0), t1: tb(1), t2: tb(2), t3: tb(3), t4: tb(4), flare: 0.3 };
    const antic = { rise: 4, lean: -0.12, tri: -150 * DG, t0: 100 * DG, t1: 26 * DG, t2: 26 * DG, t3: 22 * DG, t4: 20 * DG, flare: 1 };
    const strike = { rise: -2, lean: 0.12, tri: 10 * DG, t0: 92 * DG, t1: 14 * DG, t2: 18 * DG, t3: 20 * DG, t4: 22 * DG, flare: 0.2 };
    return stateBlend(a, idle, idle, antic, strike);
  },
  follow: (S, a) => ({ hair: -S.lean * 1.5 - S.flare * 0.2 + Math.sin(a.t * 1.3) * 0.12, skirt: -S.lean * 1.1 }),
  parts: [
    { name: 'root', at: (S) => [0, -54 - S.rise], rot: (S) => S.lean },
    ...CR_LOCKS.flatMap(([dx, deg, len, c], j) => chainParts(`lock${j}`, {
      parent: 'root', at: () => [dx, -44], key: `coralie|lock|${len}|${c}`,
      segs: [[len, 12, 10.8], [len, 10.8, 9.6], [len - 1, 9.6, 8.4]],
      shape: lockShape(CR.hair[c]),
      rot: (S, a, k) => (k ? (8 + 6 * Math.sin(a.t * 1.6 + j + k)) * DG : deg * DG - S.flare * 12 * DG + S.hair),
    })),
    ...chainParts('tail', { parent: 'root', at: () => [-2, 0], key: 'coralie|tail', segs: [[12, 26, 22.4], [12, 22.4, 18.8], [11, 18.8, 15.2], [10, 15.2, 11.6], [9, 11.6, 8]], shape: tailShape, rot: (S, a, k) => S[`t${k}`] - (k ? 0 : S.lean) }),
    { name: 'fin', parent: 'tail4', pivot: [28, 14], at: () => [9, 0], rot: (S) => -(S.t0 + S.t1 + S.t2 + S.t3 + S.t4) + S.lean + Math.sin(S.t4 * 3) * 0.3, s: () => crParts.fin() },
    { name: 'skirt', parent: 'root', pivot: [20, 2], at: () => [0, -4], rot: (S) => S.skirt, s: () => crParts.skirt() },
    { name: 'body', parent: 'root', pivot: [15, 13], at: () => [0, -10], s: () => crParts.body() },
    { name: 'head', parent: 'body', pivot: [28, 40], at: () => [0, -30], rot: (S, a) => Math.sin(a.t * 1.2) * 0.04, s: () => crParts.head() },
    { name: 'face', parent: 'head', pivot: [16, 9], at: () => [6, 0], s: (a) => crParts.face(a.face, a.atk) },
    { name: 'arm', parent: 'body', pivot: [3, 4], at: () => [10, -2], rot: (S) => S.tri + 40 * DG, s: () => crParts.arm() },
    { name: 'trident', parent: 'arm', pivot: [20, 9], at: () => [10, 0], rot: (S) => -40 * DG, s: () => crParts.trident() },
  ],
  fx(ctx, m, a) {
    // The burst of sea where the trident is driven down.
    if (a.ph.since >= 0 && a.ph.since < 0.5) {
      const u = a.ph.since / 0.5;
      ctx.globalAlpha = a.alpha * (1 - u);
      ctx.fillStyle = '#bff4ff';
      for (let i = 0; i < 6; i++) {
        const ang = (-160 + i * 30) * DG;
        ctx.beginPath();
        ctx.ellipse(44 + Math.cos(ang) * 14 * (0.5 + u), -4 + Math.sin(ang) * 10 * (0.5 + u), 3.6 * (1 - u) + 1, 2, ang, 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  moraymurri: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: (p, f, m) => moray(p, f, m, 'murri'), rig: morayRig('murri') },
  morayena: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: (p, f, m) => moray(p, f, m, 'ena'), rig: morayRig('ena') },
  abyssia: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [100, 200, 300, 240], draw: abyssia, rig: abyssiaRig },
  coralie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [110, 180, 300, 240], draw: coralie, rig: coralieRig },
};

export const INFO = {
  moraymurri: { name: 'Murri, the Twin Moray', w: 56, h: 96 },
  morayena: { name: 'Ena, the Twin Moray', w: 56, h: 96 },
  abyssia: { name: 'Lady Abyssia, the Sea Witch', w: 80, h: 100 },
  coralie: { name: 'Queen Coralie, the Drowned Queen', w: 64, h: 124 },
};
