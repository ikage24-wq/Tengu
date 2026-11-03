// Monster art: the Candy Volcano's bosses (docs/design/candy-volcano.md), redrawn creature-first and
// big (2026-11-03): chibi sweets at two and a half to three times the hero's height, each with one
// signature shape.
//   toffee   Toffee, the Caramel Smith: a chubby beaver smith in a leather apron and bandana, a
//            great hammer with caramel dripping off its head; she raises it high and slams it down.
//   gretel   Gretel, the Gingerbread Knight: a gingerbread girl iced with armour piping, gumdrop
//            buttons, a candy-cane lance and an iced cookie shield; she charges with the lance.
//   bonbon   Queen Bonbon: a giant three-tier cake with a face, caramel dripping from each tier,
//            a candy crown with a cherry, and a great spoon for a sceptre; she scoops and flings a
//            dollop of frosting.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);
// Caramel drips hanging under an edge.
function drips(x0, x1, y, q, c, n = 5, k = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i + 0.5) * (x1 - x0)) / n;
    const l = (3 + ((i * 7) % 5) + Math.sin(q * TAU + i) * 1.2) * k;
    out.push(R(x - 1.2 * k, y - 1, 2.4 * k, l, c), E(x, y + l - 1, 1.6 * k, 1.8 * k, c));
  }
  return out;
}

// ---------- Toffee, the Caramel Smith ----------

const TOFFEE_ATK = [
  { hammer: -170, lean: -10, crouch: 3 },
  { hammer: -40, lean: 12, crouch: -2, smear: 1 },
  { hammer: 30, lean: 16, crouch: 4, hit: 1 },
  { hammer: 26, lean: 14, crouch: 3 },
  { hammer: -60, lean: 0, crouch: 0 },
];

function toffee(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? TOFFEE_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#b8784a', { step: 10, turn: 10 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 50;
  const cy = (dead ? 30 : 30) + (A ? A.crouch : 0) - Math.abs(step) * 2 - breath(q);
  const lean = dead ? 84 : A ? A.lean : walk ? step * 4 : 0;
  const out = [];
  const body = [];
  // A flat beaver tail behind, crosshatched.
  body.push(...spin([O(cx - 22, cy + 66, 14, 6, 0, '#7a4a3a', 18), F(R(cx - 32, cy + 64, 20, 0.8, '#5a3a2a')), F(R(cx - 30, cy + 67, 16, 0.8, '#5a3a2a'))], cx - 12, cy + 66, walk ? step * 10 : 0));
  for (const [ox, s, c] of [[-10, step, fur.sh], [10, -step, fur.base]]) body.push(...limb([cx + ox, cy + 60], [cx + ox + Math.max(0, s) * 4, 104 - Math.max(0, s) * 3], 9, 8, c), O(cx + ox + 3 + Math.max(0, s) * 4, 105 - Math.max(0, s) * 3, 8, 3.4, 0, fur.deep, 14));
  // A round tummy in a leather apron with a pocket of tools.
  body.push(...blob(cx, cy + 46, 24, 22, fur));
  body.push(T([[cx - 10, cy + 28], [cx + 18, cy + 28], [cx + 22, cy + 66], [cx - 6, cy + 68]], '#8a5a3a'), F(T([[cx + 14, cy + 28], [cx + 18, cy + 28], [cx + 22, cy + 66], [cx + 18, cy + 66]], '#6a4028')));
  body.push(R(cx - 2, cy + 46, 12, 9, '#6a4028'), ...limb([cx + 1, cy + 46], [cx + 2, cy + 40], 1, 1, '#b8c0d8'), ...limb([cx + 6, cy + 46], [cx + 8, cy + 41], 1.6, 1.2, '#e8b84a'));
  // The head: round, big buck teeth, a red bandana, little round ears.
  const hx = cx + 4;
  const hy = cy + 12;
  body.push(E(hx - 14, hy - 12, 5, 5, fur.sh), E(hx + 12, hy - 13, 5, 5, fur.base));
  body.push(...blob(hx, hy, 19, 17, fur), F(O(hx + 8, hy + 7, 11, 8, 0, '#f4dcc0', 16)), E(hx + 16, hy + 3, 3, 2.4, '#4a2a2a'));
  body.push(R(hx + 7, hy + 10, 6, 6, '#fffaf2'), F(R(hx + 9.6, hy + 10, 0.8, 6, '#e0d8d0')));
  body.push(T([...arcPts(hx - 1, hy - 4, 20, 16, 190, 345, 14)], '#e0404a'), ...[0, 1, 2, 3, 4].map((i) => F(E(hx - 14 + i * 7, hy - 12 + Math.abs(2 - i) * 2, 1.2, 1.2, '#ffffff'))));
  body.push(T([[hx - 19, hy - 4], [hx - 28, hy - 8], [hx - 26, hy]], '#e0404a'), T([[hx - 19, hy - 3], [hx - 27, hy + 3], [hx - 22, hy + 4]], '#c0303a'));
  body.push(...cuteFace(hx + 4, hy + 1, 2.3, mood, { iris: '#c0602a', gap: 5.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: null, lash: 1.6, wing: 1.4 }));
  // The great hammer with caramel dripping off its head.
  const ha = A ? A.hammer : walk ? -70 + step * 8 : -70 + sway(q) * 4;
  const sh = [cx + 20, cy + 36];
  const dir = [Math.cos(ha * D2R), Math.sin(ha * D2R)];
  const hand = [sh[0] + dir[0] * 12, sh[1] + dir[1] * 12];
  const head = [hand[0] + dir[0] * 28, hand[1] + dir[1] * 28];
  body.push(...limb(sh, hand, 9, 8, fur.base), ...limb([hand[0] - dir[0] * 6, hand[1] - dir[1] * 6], head, 3.4, 3.4, '#8a5a3a'));
  const hammer = [R(head[0] - 12, head[1] - 8, 24, 16, '#6a6a80'), F(R(head[0] - 12, head[1] - 8, 24, 3, '#9a9ab0')), F(R(head[0] + 8, head[1] - 8, 4, 16, '#4a4a60')), ...drips(head[0] - 12, head[1] + 12, head[1] + 8, q, '#e8963a', 5, 1.2)];
  body.push(...spin(hammer, head[0], head[1], ha + 90));
  out.push(...spin(body, cx, 104, lean));
  if (A?.smear) out.push(smear([[cx + 10, cy - 30], [cx + 46, cy - 6], [cx + 56, cy + 50]], 12, '#ffe8c8'));
  if (A?.hit) {
    out.push(...star(cx + 54, 100, 8, '#fff6a8'));
    for (let i = 0; i < 5; i++) out.push(E(cx + 40 + i * 7, 100 - Math.abs(2 - i) * 4, 3, 2.4, '#e8963a'));
  }
  return { w: 120, h: 110, res: 3, shapes: out };
}

// ---------- Gretel, the Gingerbread Knight ----------

const GRETEL_ATK = [
  { lance: -40, dx: -6, lean: -8 },
  { lance: -4, dx: 14, lean: 14, smear: 1 },
  { lance: -2, dx: 20, lean: 16, hit: 1 },
  { lance: -2, dx: 18, lean: 14 },
  { lance: -20, dx: 4, lean: 2 },
];

function gretel(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? GRETEL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const gb = ramp('#d9944a', { step: 10, turn: 8 });
  const icing = '#ffffff';
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 46 + (A ? A.dx : 0);
  const cy = (dead ? 30 : 26) - Math.abs(step) * 2 - breath(q);
  const lean = dead ? 86 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  const body = [];
  // The gingerbread shape: a classic cookie figure, chunky legs and arms, iced trims.
  for (const [ox, s, c] of [[-10, step, gb.sh], [10, -step, gb.base]]) {
    const foot = [cx + ox + s * 5, 104 - Math.max(0, s) * 4];
    body.push(...limb([cx + ox, cy + 54], foot, 12, 11, c), F(strand(arcPts(foot[0], foot[1] - 3, 5, 2, 200, 340, 6), 1.2, icing)));
  }
  body.push(...blob(cx, cy + 44, 20, 20, gb));
  // Icing armour: a breastplate outline, piping squiggles, gumdrop buttons.
  body.push(F(strand(arcPts(cx + 2, cy + 44, 14, 16, 200, 520, 22), 1.4, icing)));
  for (const [y, c] of [[34, '#ff6b9a'], [44, '#7fd8ff'], [54, '#ffd36b']]) body.push(E(cx + 4, cy + y, 3, 2.6, c), F(E(cx + 3, cy + y - 1, 1, 0.8, '#ffffff')));
  body.push(F(strand([[cx - 14, cy + 60], [cx - 9, cy + 58], [cx - 4, cy + 60], [cx + 1, cy + 58], [cx + 6, cy + 60], [cx + 11, cy + 58], [cx + 16, cy + 60]], 1.2, icing)));
  // The head: a round cookie head, iced hair swirls and a candy helm with a plume.
  const hx = cx + 2;
  const hy = cy + 12;
  body.push(...blob(hx, hy, 17, 16, gb));
  body.push(F(strand(arcPts(hx, hy, 15, 14, 195, 345, 14), 1.4, icing)));
  body.push(...cuteFace(hx + 4, hy + 2, 2.2, mood, { iris: '#3a2a1a', inkC: '#2a1a1a', lip: '#c03a4a', gap: 5.4, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: gb.base, mouthDy: 3.6, lash: 1.6, wing: 1.4 }));
  body.push(T([...arcPts(hx - 1, hy - 6, 16, 10, 180, 360, 14)], '#ff6b9a'), F(T([...arcPts(hx - 1, hy - 6, 16, 10, 200, 240, 6), [hx - 4, hy - 6]], '#ffb0c8')), R(hx - 17, hy - 7, 32, 3, '#ffffff'));
  for (let i = 0; i < 5; i++) body.push(F(R(hx - 15 + i * 7, hy - 6.6, 3, 2.2, i % 2 ? '#ff6b9a' : '#ffffff')));
  body.push(strand(chain(hx - 4, hy - 16, -120, [5, 5, 5], wave(TAU * q * 2, 12, 0.8)), (t) => 4 * (1 - t * 0.4), '#7fe0a8'));
  // The iced cookie shield on her far arm.
  body.push(O(cx - 18, cy + 40, 12, 13, 0, gb.sh, 22), F(O(cx - 18, cy + 40, 9, 10, 0, '#ffe0ec', 20)), star(cx - 18, cy + 40, 5, '#ff6b9a', '#ffd0e0')[0]);
  // The candy-cane lance couched under her arm.
  const la = A ? A.lance : -24 + (walk ? step * 4 : 0);
  const sh = [cx + 14, cy + 40];
  const dir = [Math.cos(la * D2R), Math.sin(la * D2R)];
  const butt = [sh[0] - dir[0] * 12, sh[1] - dir[1] * 12];
  const tip = [sh[0] + dir[0] * 42, sh[1] + dir[1] * 42];
  body.push(...limb(butt, tip, 5, 3, '#ffffff'));
  for (let i = 0; i < 9; i++) {
    const u = i / 9;
    const x = butt[0] + (tip[0] - butt[0]) * u;
    const y = butt[1] + (tip[1] - butt[1]) * u;
    body.push(F(O(x, y, 1.4, 3.6 - u * 1.4, la + 60, '#e0303e', 8)));
  }
  body.push(...limb([cx + 10, cy + 36], sh, 9, 8, gb.base));
  out.push(...spin(body, cx, 104, lean));
  if (A?.smear) out.push(smear([[cx - 30, cy + 40], [cx, cy + 34], [tip[0] + 6, tip[1]]], 10, '#fff0e0'));
  if (A?.hit) out.push(...star(tip[0] + 6, tip[1], 7, '#fff6a8'));
  return { w: 120, h: 110, res: 3, shapes: out };
}

// ---------- Queen Bonbon ----------

const BONBON_ATK = [
  { spoon: -170, rise: 3, dollop: 0 },
  { spoon: -60, rise: -1, dollop: 0.6, smear: 1 },
  { spoon: 0, rise: -2, dollop: 1.4, hit: 1 },
  { spoon: 4, rise: -1, dollop: 1.8 },
  { spoon: -80, rise: 0, dollop: 0 },
];

function bonbon(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? BONBON_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const wob = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 56;
  const base = 104 - (walk ? Math.abs(wob) * 2 : 0);
  const rise = A ? A.rise : breath(q) * 0.8;
  const out = [];
  // Three tiers of cake, wobbling one after another, caramel dripping from each.
  const tiers = [[0, 34, 20, '#ffd0e0', '#ff9ab8'], [1, 26, 18, '#fff0d8', '#ffc078'], [2, 18, 16, '#e8d8ff', '#c9a6ff']];
  let y = base;
  const tops = [];
  for (const [i, w, h, c, trim] of tiers) {
    const sway2 = Math.sin(TAU * q * 2 - i * 0.8) * (walk ? 2 : 0.8);
    const x = cx + sway2;
    y -= h + (i ? rise * 0.6 : 0);
    out.push(R(x - w, y, w * 2, h, c), F(R(x + w - 6, y, 6, h, mix(c, '#000000', 0.08))), O(x, y, w, 4, 0, mix(c, '#ffffff', 0.4), 22));
    out.push(...drips(x - w + 2, x + w - 2, y + 2, q + i, trim, 6, 1));
    for (let k = 0; k < 8; k++) out.push(F(E(x - w + 3 + k * ((w * 2 - 6) / 7), y + h - 2, 1.8, 1.4, '#ffffff')));
    tops.push([x, y]);
  }
  // Her face on the middle tier.
  const [fx, fy] = tops[1];
  out.push(...cuteFace(fx + 6, fy + 9, 2.4, mood, { iris: '#c03a8a', lip: '#c03a6a', gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: '#fff0d8', mouthDy: 3.4, lash: 2, wing: 2 }));
  // The crown and a cherry on top.
  const [tx, ty] = tops[2];
  for (let i = 0; i < 5; i++) out.push(T([[tx - 12 + i * 5, ty - 2], [tx - 10 + i * 5, ty - 10 - (i === 2 ? 4 : 0)], [tx - 8 + i * 5, ty - 2]], '#ffd36b'));
  out.push(R(tx - 12, ty - 4, 24, 3, '#e8b84a'), E(tx + 2, ty - 18, 5, 5, '#e0303e'), F(E(tx + 0.6, ty - 19.4, 1.6, 1.4, '#ffb0b8')), strand([[tx + 2, ty - 22], [tx + 5, ty - 28]], 1, '#5aa04a'));
  // Little frosting arms off the middle tier, and the great spoon.
  const sa = A ? A.spoon : walk ? -60 + wob * 8 : -60 + sway(q) * 6;
  const sh = [fx + 24, fy + 8];
  const dir = [Math.cos(sa * D2R), Math.sin(sa * D2R)];
  const hand = [sh[0] + dir[0] * 8, sh[1] + dir[1] * 8];
  const bowl = [hand[0] + dir[0] * 30, hand[1] + dir[1] * 30];
  out.push(...limb(sh, hand, 6, 5, '#fff0d8'), ...limb(hand, bowl, 2.6, 2.6, '#c8c8e0'), O(bowl[0], bowl[1], 7, 4.6, sa, '#d8d8ee', 16), F(O(bowl[0] - 1, bowl[1] - 1, 4, 2, sa, '#ffffff', 12)));
  if (!A || A.dollop < 1) out.push(E(bowl[0], bowl[1] - 2, 4.6, 3.6, '#ffb0d8'), F(E(bowl[0] - 1, bowl[1] - 3.4, 1.6, 1, '#ffffff')));
  out.push(...limb([fx - 22, fy + 8], [fx - 30, fy + 14 + wob * 2], 6, 5, '#fff0d8'));
  if (A?.smear) out.push(smear(arcPts(fx + 24, fy + 8, 38, 38, -150, -10, 10), 10, '#fff0f6'));
  if (A?.dollop >= 1) {
    const k = A.dollop;
    out.push(E(bowl[0] + 10 + k * 8, bowl[1] + k * 10, 6, 5, '#ffb0d8'), F(E(bowl[0] + 8 + k * 8, bowl[1] + k * 10 - 2, 2, 1.4, '#ffffff')));
  }
  if (A?.hit) out.push(...star(bowl[0] + 16, bowl[1] + 12, 7, '#fff6a8'));
  if (!dead) for (let i = 0; i < 3; i++) out.push(F(E(cx - 30 + i * 30, 30 - ((q * 20 + i * 7) % 16), 1.2, 1.2, i % 2 ? '#ff9ab8' : '#ffd36b')));
  return { w: 124, h: 112, res: 3, shapes: dead ? spin(out, cx, 104, 0) : out };
}

export const ART = {
  toffee: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [110, 180, 340, 240], draw: toffee },
  gretel: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: gretel },
  bonbon: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [110, 180, 340, 240], draw: bonbon },
};

export const INFO = {
  toffee: { name: 'Toffee, the Caramel Smith', w: 70, h: 100 },
  gretel: { name: 'Gretel, the Gingerbread Knight', w: 64, h: 100 },
  bonbon: { name: 'Queen Bonbon', w: 80, h: 110 },
};
