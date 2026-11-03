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
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

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

// ---------- The Volcano's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) Live skeletons (render/mobs/rig.js). Toffee waddles with her
// tail wagging and her bandana knot fluttering, and swings her great hammer from high overhead
// down onto the floor, the caramel always dripping straight down off its head. Gretel marches on
// her chunky cookie legs, plume bobbing, and charges with her lance couched. Queen Bonbon's three
// tiers each hang on the one below, so she wobbles like a jelly, one tier after another, as she
// stirs and flings frosting with her spoon. Rig space: the floor under them at (0, 0).
const DG = Math.PI / 180;

// Toffee.
const TF = { fur: ramp('#b8784a', { step: 10, turn: 10 }) };
const tfParts = {
  tail: () => part('toffee|tail', 32, 16, () => [O(16, 8, 14, 6, 0, '#7a4a3a', 18), F(R(6, 6, 20, 0.8, '#5a3a2a')), F(R(8, 9, 16, 0.8, '#5a3a2a'))]),
  leg: (back) => part(`toffee|leg|${back}`, 22, 20, () => [...limb([10, 3], [10, 14], 9, 8, back ? TF.fur.sh : TF.fur.base), O(13, 15, 8, 3.4, 0, TF.fur.deep, 14)]),
  body: () => part('toffee|body', 52, 48, () => {
    const cx = 26;
    const cy = 24;
    return [...blob(cx, cy, 24, 22, TF.fur), T([[cx - 10, cy - 18], [cx + 18, cy - 18], [cx + 22, cy + 20], [cx - 6, cy + 22]], '#8a5a3a'), F(T([[cx + 14, cy - 18], [cx + 18, cy - 18], [cx + 22, cy + 20], [cx + 18, cy + 20]], '#6a4028')), R(cx - 2, cy, 12, 9, '#6a4028'), ...limb([cx + 1, cy], [cx + 2, cy - 6], 1, 1, '#b8c0d8'), ...limb([cx + 6, cy], [cx + 8, cy - 5], 1.6, 1.2, '#e8b84a')];
  }),
  head: () => part('toffee|head', 52, 44, () => {
    const hx = 28;
    const hy = 24;
    return [E(hx - 14, hy - 12, 5, 5, TF.fur.sh), E(hx + 12, hy - 13, 5, 5, TF.fur.base), ...blob(hx, hy, 19, 17, TF.fur), F(O(hx + 8, hy + 7, 11, 8, 0, '#f4dcc0', 16)), E(hx + 16, hy + 3, 3, 2.4, '#4a2a2a'), R(hx + 7, hy + 10, 6, 6, '#fffaf2'), F(R(hx + 9.6, hy + 10, 0.8, 6, '#e0d8d0')), T([...arcPts(hx - 1, hy - 4, 20, 16, 190, 345, 14)], '#e0404a'), ...[0, 1, 2, 3, 4].map((i) => F(E(hx - 14 + i * 7, hy - 12 + Math.abs(2 - i) * 2, 1.2, 1.2, '#ffffff')))];
  }),
  knot: () => part('toffee|knot', 14, 14, () => [T([[12, 4], [3, 0], [5, 8]], '#e0404a'), T([[12, 5], [4, 11], [9, 12]], '#c0303a')]),
  face: (mood, atk) => part(`toffee|face|${mood}|${atk}`, 30, 22, () => cuteFace(15, 9, 2.3, mood, { iris: '#c0602a', gap: 5.6, atk, skin: TF.fur.base, mouthDy: null, lash: 1.6, wing: 1.4 })),
  arm: () => part('toffee|arm', 20, 12, () => [...limb([4, 6], [16, 6], 9, 8, TF.fur.base)]),
  // The hammer along +x from the grip at (8, 15): the handle, then the iron head across its end.
  hammer: () => part('toffee|hammer', 54, 30, () => [...limb([2, 15], [38, 15], 3.4, 3.4, '#8a5a3a'), R(36, 3, 16, 24, '#6a6a80'), F(R(36, 3, 3, 24, '#9a9ab0')), F(R(48, 3, 4, 24, '#4a4a60'))]),
};
const toffeeRig = makeRig({
  w: 70,
  h: 100,
  stride: 40,
  fast: ['hammer', 'lean', 'crouch'],
  kick: { lean: -1.4, knot: 4 },
  springs: { tail: [80, 6], knot: [50, 3.5] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { lean: Math.sin(t * 1.1) * 0.02, crouch: -Math.sin(t * 2.2), hammer: -70 * DG + Math.sin(t * 1.3) * 0.07, legF: 0, legB: 0, head: Math.sin(t * 1.4) * 0.04 };
    const walk = { lean: s * 0.07, crouch: -Math.abs(s) * 2, hammer: (-70 + s * 8) * DG, legF: -s * 0.35, legB: s * 0.35, head: s * 0.05 };
    const antic = { lean: -10 * DG, crouch: 3, hammer: -170 * DG, legF: -0.1, legB: 0.15, head: -0.1 };
    const strike = { lean: 16 * DG, crouch: 4, hammer: 32 * DG, legF: -0.3, legB: 0.2, head: 0.12 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ tail: Math.sin(a.t * (2 + a.walkW * 6)) * 0.15 - S.lean, knot: -S.lean * 1.5 + Math.sin(a.t * 4) * 0.1 }),
  parts: [
    { name: 'root', rot: (S) => S.lean },
    { name: 'tail', parent: 'root', pivot: [26, 8], at: (S) => [-12, -9 + S.crouch * 0.5], rot: (S) => S.tail, s: () => tfParts.tail() },
    { name: 'legB', parent: 'root', pivot: [10, 3], at: (S) => [-10, -15 + S.crouch * 0.3], rot: (S) => S.legB, s: () => tfParts.leg(true) },
    { name: 'legF', parent: 'root', pivot: [10, 3], at: (S) => [10, -15 + S.crouch * 0.3], rot: (S) => S.legF, s: () => tfParts.leg(false) },
    { name: 'body', parent: 'root', pivot: [26, 24], at: (S) => [0, -30 + S.crouch], s: () => tfParts.body() },
    { name: 'knot', parent: 'body', pivot: [12, 4], at: () => [-15, -38], rot: (S) => S.knot, s: () => tfParts.knot() },
    { name: 'head', parent: 'body', pivot: [28, 36], at: () => [4, -22], rot: (S) => S.head, s: () => tfParts.head() },
    { name: 'face', parent: 'head', pivot: [15, 9], at: () => [4, -11], s: (a) => tfParts.face(a.face, a.atk) },
    { name: 'arm', parent: 'body', pivot: [4, 6], at: () => [20, -10], rot: (S) => S.hammer, s: () => tfParts.arm() },
    { name: 'hammer', parent: 'arm', pivot: [8, 15], at: () => [12, 0], s: () => tfParts.hammer() },
  ],
  fx(ctx, m, a, S, mat) {
    // Caramel dripping straight down off the hammer's head, whichever way it's held.
    const M = mat('hammer');
    const at = (x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
    ctx.globalAlpha = a.alpha;
    ctx.fillStyle = '#e8963a';
    for (let i = 0; i < 4; i++) {
      const [x, y] = at(36 + i * 5 - 8, 10 - 15);
      const l = 3 + ((i * 7) % 4) + Math.sin(a.t * 2 + i) * 1.2;
      ctx.fillRect(x - 1.2, y, 2.4, l);
      ctx.beginPath();
      ctx.arc(x, y + l, 1.6, 0, TAU);
      ctx.fill();
    }
    if (a.ph.since >= 0 && a.ph.since < 0.5) {
      const u = a.ph.since / 0.5;
      ctx.globalAlpha = a.alpha * (1 - u);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(40 + i * 7, -4 - Math.abs(2 - i) * 4 - u * 8, 3, 2.4, 0, 0, TAU);
        ctx.fill();
      }
    }
  },
});

// Gretel.
const GT = { gb: ramp('#d9944a', { step: 10, turn: 8 }) };
const gtParts = {
  leg: (back) => part(`gretel|leg|${back}`, 18, 30, () => [...limb([9, 3], [9, 24], 12, 11, back ? GT.gb.sh : GT.gb.base), F(strand(arcPts(9, 22, 5, 2, 200, 340, 6), 1.2, '#ffffff'))]),
  body: () => part('gretel|body', 44, 44, () => {
    const cx = 22;
    const cy = 22;
    const out = [...blob(cx, cy, 20, 20, GT.gb), F(strand(arcPts(cx + 2, cy, 14, 16, 200, 520, 22), 1.4, '#ffffff'))];
    for (const [y, c] of [[-10, '#ff6b9a'], [0, '#7fd8ff'], [10, '#ffd36b']]) out.push(E(cx + 4, cy + y, 3, 2.6, c), F(E(cx + 3, cy + y - 1, 1, 0.8, '#ffffff')));
    out.push(F(strand([[cx - 14, cy + 16], [cx - 9, cy + 14], [cx - 4, cy + 16], [cx + 1, cy + 14], [cx + 6, cy + 16], [cx + 11, cy + 14], [cx + 16, cy + 16]], 1.2, '#ffffff')));
    return out;
  }),
  head: () => part('gretel|head', 40, 40, () => {
    const hx = 20;
    const hy = 24;
    const out = [...blob(hx, hy, 17, 16, GT.gb), F(strand(arcPts(hx, hy, 15, 14, 195, 345, 14), 1.4, '#ffffff')), T([...arcPts(hx - 1, hy - 6, 16, 10, 180, 360, 14)], '#ff6b9a'), F(T([...arcPts(hx - 1, hy - 6, 16, 10, 200, 240, 6), [hx - 4, hy - 6]], '#ffb0c8')), R(hx - 17, hy - 7, 32, 3, '#ffffff')];
    for (let i = 0; i < 5; i++) out.push(F(R(hx - 15 + i * 7, hy - 6.6, 3, 2.2, i % 2 ? '#ff6b9a' : '#ffffff')));
    return out;
  }),
  face: (mood, atk) => part(`gretel|face|${mood}|${atk}`, 28, 22, () => cuteFace(14, 9, 2.2, mood, { iris: '#3a2a1a', inkC: '#2a1a1a', lip: '#c03a4a', gap: 5.4, atk, skin: GT.gb.base, mouthDy: 3.6, lash: 1.6, wing: 1.4 })),
  shield: () => part('gretel|shield', 28, 30, () => [O(14, 15, 12, 13, 0, GT.gb.sh, 22), F(O(14, 15, 9, 10, 0, '#ffe0ec', 20)), star(14, 15, 5, '#ff6b9a', '#ffd0e0')[0]]),
  arm: () => part('gretel|arm', 14, 12, () => [...limb([3, 6], [10, 6], 9, 8, GT.gb.base)]),
  // The lance along +x from the grip at (14, 5): butt behind, tip far ahead, striped.
  lance: () => part('gretel|lance', 60, 10, () => {
    const out = [...limb([2, 5], [56, 5], 5, 3, '#ffffff')];
    for (let i = 0; i < 9; i++) out.push(F(O(4 + i * 6, 5, 1.4, 3.6 - (i / 9) * 1.4, 60, '#e0303e', 8)));
    return out;
  }),
};
const gretelRig = makeRig({
  w: 64,
  h: 100,
  stride: 44,
  fast: ['dx', 'lean', 'lance'],
  kick: { lean: -1.4, plume0: 4 },
  springs: { plume0: [70, 5], plume1: [55, 4], plume2: [45, 3.5], shield: [120, 9] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { dx: 0, lean: 0, y: -Math.sin(t * 2.2), lance: -24 * DG + Math.sin(t * 1.3) * 0.04, legF: 0, legB: 0, shieldUp: 0 };
    const walk = { dx: 0, lean: s * 0.05, y: -Math.abs(s) * 2, lance: (-24 + s * 4) * DG, legF: -s * 0.4, legB: s * 0.4, shieldUp: 0 };
    const antic = { dx: -6, lean: -8 * DG, y: 2, lance: -40 * DG, legF: -0.2, legB: 0.3, shieldUp: 1 };
    const strike = { dx: 20, lean: 16 * DG, y: 0, lance: -2 * DG, legF: -0.6, legB: 0.5, shieldUp: 0.4 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S, a) => ({ plume0: -120 * DG - S.lean * 2 + Math.sin(a.t * 3) * 0.1, plume1: 14 * DG, plume2: 14 * DG, shield: -S.shieldUp * 0.5 - S.lean }),
  parts: [
    { name: 'root', at: (S) => [S.dx, 0], rot: (S) => S.lean },
    { name: 'legB', parent: 'root', pivot: [9, 3], at: (S) => [-10, -24 + S.y * 0.3], rot: (S) => S.legB, s: () => gtParts.leg(true) },
    { name: 'legF', parent: 'root', pivot: [9, 3], at: (S) => [10, -24 + S.y * 0.3], rot: (S) => S.legF, s: () => gtParts.leg(false) },
    { name: 'shield', parent: 'root', pivot: [14, 15], at: (S) => [-18, -38 + S.y - S.shieldUp * 8], rot: (S) => S.shield, s: () => gtParts.shield() },
    { name: 'body', parent: 'root', pivot: [22, 22], at: (S) => [0, -34 + S.y], s: () => gtParts.body() },
    ...chainParts('plume', { parent: 'body', at: () => [-2, -48], key: 'gretel|plume', segs: [[5, 4, 3.2], [5, 3.2, 2.6], [5, 2.6, 2.2]], color: '#7fe0a8', rot: (S, a, i) => S[`plume${i}`] }),
    { name: 'head', parent: 'body', pivot: [20, 24], at: () => [2, -32], s: () => gtParts.head() },
    { name: 'face', parent: 'head', pivot: [14, 9], at: () => [4, 0], s: (a) => gtParts.face(a.face, a.atk) },
    { name: 'lance', parent: 'body', pivot: [14, 5], at: () => [14, -4], rot: (S) => S.lance, s: () => gtParts.lance() },
    { name: 'arm', parent: 'body', pivot: [3, 6], at: () => [9, -8], rot: (S) => S.lance + 0.5, s: () => gtParts.arm() },
  ],
  fx(ctx, m, a) {
    if (a.ph.since >= 0 && a.ph.since < 0.4) {
      const u = a.ph.since / 0.4;
      ctx.globalAlpha = a.alpha * (1 - u);
      ctx.fillStyle = '#c07a4a';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(-10 - i * 4 - u * 20, -2 - Math.sin(u * Math.PI + i) * 8, 3, 3);
      }
    }
  },
});

// Queen Bonbon.
const BB_TIERS = [[34, 20, '#ffd0e0', '#ff9ab8'], [26, 18, '#fff0d8', '#ffc078'], [18, 16, '#e8d8ff', '#c9a6ff']];
const bbParts = {
  tier: (i) => {
    const [w, h, c, trim] = BB_TIERS[i];
    // Bottom middle at (w + 4, h + 6).
    return part(`bonbon|tier|${i}`, w * 2 + 8, h + 14, () => {
      const x = w + 4;
      const y = 6;
      const out = [R(x - w, y, w * 2, h, c), F(R(x + w - 6, y, 6, h, mix(c, '#000000', 0.08))), O(x, y, w, 4, 0, mix(c, '#ffffff', 0.4), 22)];
      out.push(...drips(x - w + 2, x + w - 2, y + 2, i * 0.3, trim, 6, 1));
      for (let k = 0; k < 8; k++) out.push(F(E(x - w + 3 + k * ((w * 2 - 6) / 7), y + h - 2, 1.8, 1.4, '#ffffff')));
      return out;
    });
  },
  face: (mood, atk) => part(`bonbon|face|${mood}|${atk}`, 34, 22, () => cuteFace(17, 9, 2.4, mood, { iris: '#c03a8a', lip: '#c03a6a', gap: 6, atk, skin: '#fff0d8', mouthDy: 3.4, lash: 2, wing: 2 })),
  crown: () => part('bonbon|crown', 30, 34, () => {
    const tx = 15;
    const ty = 30;
    const out = [];
    for (let i = 0; i < 5; i++) out.push(T([[tx - 12 + i * 5, ty - 2], [tx - 10 + i * 5, ty - 10 - (i === 2 ? 4 : 0)], [tx - 8 + i * 5, ty - 2]], '#ffd36b'));
    out.push(R(tx - 12, ty - 4, 24, 3, '#e8b84a'), E(tx + 2, ty - 18, 5, 5, '#e0303e'), F(E(tx + 0.6, ty - 19.4, 1.6, 1.4, '#ffb0b8')), strand([[tx + 2, ty - 22], [tx + 5, ty - 28]], 1, '#5aa04a'));
    return out;
  }),
  arm: () => part('bonbon|arm', 14, 10, () => [...limb([3, 5], [11, 5], 6, 5, '#fff0d8')]),
  // The spoon along +x from the grip at (2, 6), the bowl at the far end, a dollop of frosting in it.
  spoon: (full) => part(`bonbon|spoon|${full}`, 44, 16, () => [...limb([2, 8], [32, 8], 2.6, 2.6, '#c8c8e0'), O(36, 8, 7, 4.6, 0, '#d8d8ee', 16), F(O(35, 7, 4, 2, 0, '#ffffff', 12)), ...(full ? [E(36, 5, 4.6, 3.6, '#ffb0d8'), F(E(35, 3.6, 1.6, 1, '#ffffff'))] : [])]),
};
const bonbonRig = makeRig({
  w: 80,
  h: 100,
  stride: 40,
  fast: ['spoon', 'rise'],
  kick: { t1: 3, t2: 4 },
  springs: { t0: [160, 7], t1: [120, 5], t2: [90, 4] },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { spoon: -60 * DG + Math.sin(t * 1.6) * 0.1, rise: Math.sin(t * 1.8) * 0.8, base: 0, stir: Math.sin(t * 1.2) * 0.04 };
    const walk = { spoon: (-60 + s * 8) * DG, rise: 0, base: -Math.abs(s) * 2, stir: s * 0.08 };
    const antic = { spoon: -170 * DG, rise: 3, base: 0, stir: -0.08 };
    const strike = { spoon: 4 * DG, rise: -2, base: 0, stir: 0.1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  // Each tier wobbles a beat after the one under it.
  follow: (S) => ({ t0: S.stir * 0.5, t1: S.stir * 1.1, t2: S.stir * 1.6 }),
  parts: [
    { name: 'tier0', pivot: [38, 26], at: (S) => [0, S.base], rot: (S) => S.t0, s: () => bbParts.tier(0) },
    { name: 'tier1', parent: 'tier0', pivot: [30, 24], at: (S) => [0, -20 - S.rise * 0.6], rot: (S) => S.t1 - S.t0, s: () => bbParts.tier(1) },
    { name: 'face', parent: 'tier1', pivot: [17, 9], at: () => [6, -9], s: (a) => bbParts.face(a.face, a.atk) },
    { name: 'tier2', parent: 'tier1', pivot: [22, 22], at: (S) => [0, -18 - S.rise * 0.6], rot: (S) => S.t2 - S.t1, s: () => bbParts.tier(2) },
    { name: 'crown', parent: 'tier2', pivot: [15, 30], at: () => [0, -16], s: () => bbParts.crown() },
    { name: 'armL', parent: 'tier1', pivot: [3, 5], at: () => [-22, -10], rot: (S, a) => 2.5 + Math.sin(a.t * 2) * 0.2, s: () => bbParts.arm() },
    { name: 'arm', parent: 'tier1', pivot: [3, 5], at: () => [24, -10], rot: (S) => S.spoon, s: () => bbParts.arm() },
    { name: 'spoon', parent: 'arm', pivot: [2, 8], at: () => [8, 0], s: (a) => bbParts.spoon(!(a.ph.since >= 0 && a.ph.since < 0.9)) },
  ],
  fx(ctx, m, a) {
    // The flung dollop of frosting, and sprinkles drifting up off her.
    if (a.ph.since >= 0 && a.ph.since < 0.5) {
      const u = a.ph.since / 0.5;
      ctx.globalAlpha = a.alpha * (u > 0.8 ? (1 - u) * 5 : 1);
      ctx.fillStyle = '#ffb0d8';
      ctx.beginPath();
      ctx.ellipse(50 + u * 30, -60 + u * 50 + u * u * 20, 6, 5, 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      const u = (a.t * 0.3 + i / 3) % 1;
      ctx.globalAlpha = a.alpha * (1 - u);
      ctx.fillStyle = i % 2 ? '#ff9ab8' : '#ffd36b';
      ctx.fillRect(-30 + i * 30, -74 - u * 16, 2, 2);
    }
  },
});

export const ART = {
  toffee: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [110, 180, 340, 240], draw: toffee, rig: toffeeRig },
  gretel: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 220], draw: gretel, rig: gretelRig },
  bonbon: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 26, atkMs: [110, 180, 340, 240], draw: bonbon, rig: bonbonRig },
};

export const INFO = {
  toffee: { name: 'Toffee, the Caramel Smith', w: 70, h: 100 },
  gretel: { name: 'Gretel, the Gingerbread Knight', w: 64, h: 100 },
  bonbon: { name: 'Queen Bonbon', w: 80, h: 110 },
};
