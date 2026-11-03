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

export const ART = {
  moraymurri: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: (p, f, m) => moray(p, f, m, 'murri') },
  morayena: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [90, 160, 280, 220], draw: (p, f, m) => moray(p, f, m, 'ena') },
  abyssia: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [100, 200, 300, 240], draw: abyssia },
  coralie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 34, atkMs: [110, 180, 300, 240], draw: coralie },
};

export const INFO = {
  moraymurri: { name: 'Murri, the Twin Moray', w: 56, h: 96 },
  morayena: { name: 'Ena, the Twin Moray', w: 56, h: 96 },
  abyssia: { name: 'Lady Abyssia, the Sea Witch', w: 80, h: 100 },
  coralie: { name: 'Queen Coralie, the Drowned Queen', w: 64, h: 124 },
};
