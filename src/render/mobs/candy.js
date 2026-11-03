// Monster art: the Candy Volcano's sweets-folk (the levels 35-40 group dungeon, see
// docs/design/candy-volcano.md). Redrawn creature-first (2026-11-03, the dungeon monster redesign:
// chibi sweets with their own silhouettes; the costumed girls on the gummy rig are retired). Every
// move still bounces and jiggles like candy.
//   gummybear     Gummy Bear Brawler: a see-through gummy bear in boxing gloves; bouncy hop-punches.
//   cottoncandy   Cotton Candy Sheep: a fluffy pink floss sheep with sugar-glass wings; a puff of
//                 floss.
//   lollipopwitch Lollipop Witch: a swirl lollipop with a face on a stick, a little witch hat; a
//                 spiral of sugar.
//   peppermint    Peppermint Spinner: a wrapped round mint whose twisted ends are its arms; a
//                 spinning slash.
//   chocoknight   Chocolate Knight: a chunky chocolate-bar knight in a foil cape with a wafer
//                 sword; a heavy slam.
//   jellyninja    Jelly Bean Ninja: a jelly bean in a headband and a candy scarf; throws a spread of
//                 star sprinkles.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// Candy hop: a bounce that squashes on landing.
const hopOf = (pose, q) => (pose === 'walk' ? Math.abs(Math.sin(TAU * q * 2)) : 0);
// A swirl candy disc (lollipops, mints).
export function swirl(x, y, r, a, b, deg) {
  const s = [O(x, y, r, r, 0, a, 22)];
  for (let i = 0; i < 4; i++) {
    const a0 = deg + i * 90;
    s.push(F(T([[x, y], ...arcPts(x, y, r, r, a0, a0 + 45, 6)], b)));
  }
  s.push(F(E(x, y, r * 0.18, r * 0.18, a)), shine(x, y, r, r, '#ffffff', 0, 0.9));
  return s;
}

// ---------- Gummy Bear Brawler ----------

const GUMMY_ATK = [
  { glove: [-6, -4], lean: -10, squash: 1 },
  { glove: [14, -2], lean: 12, squash: -0.6, smear: 1 },
  { glove: [16, -1], lean: 12, squash: -0.4, hit: 1 },
  { glove: [6, 0], lean: 2, squash: 0 },
];

function gummy(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? GUMMY_ATK[f] : null;
  const dead = mood === 'dead';
  const gum = ramp('#ff6b6b', { step: 10, turn: 10 });
  const hop = hopOf(pose, q);
  const sq = A ? A.squash : pose === 'walk' ? (hop < 0.2 ? 0.8 : -0.3) : breath(q) * 0.3;
  const cx = 18;
  const cy = (dead ? 10 : 0) - hop * 4;
  const lean = dead ? 86 : A ? A.lean : 0;
  const out = [];
  const body = [];
  // The gummy body: a pear-shaped jelly, see-through (lighter heart, a bright rim).
  for (const [ox, c] of [[-4, gum.sh], [4, gum.base]]) body.push(O(cx + ox, cy + 31, 3.4, 2.6 - sq * 0.4, 0, c, 12));
  body.push(O(cx, cy + 22 + sq, 9 + sq, 9 - sq, 0, gum.base, 20), F(O(cx + 1, cy + 22 + sq, 6, 6, 0, mix(gum.base, '#ffffff', 0.3), 16)), crescent(cx, cy + 22 + sq, 9 + sq, 9 - sq, gum.sh, { k: 0.3 }));
  // The head with round ears, a muzzle.
  const hy = cy + 9 + sq * 1.4;
  body.push(E(cx - 5, hy - 6, 2.8, 2.8, gum.sh), E(cx + 5, hy - 6.4, 2.8, 2.8, gum.base));
  body.push(...blob(cx, hy, 7.6, 6.6, gum), F(O(cx + 3, hy + 2.6, 3.4, 2.4, 0, mix(gum.base, '#ffffff', 0.35), 12)), E(cx + 5, hy + 1.6, 1, 0.8, '#a02a3a'));
  body.push(...cuteFace(cx + 1.4, hy - 0.4, 0.9, mood, { iris: '#2a1a3a', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: gum.base, mouthDy: 4, blushOn: false }));
  body.push(shine(cx, hy, 7.6, 6.6, '#ffffff', -10, 1.1), shine(cx, cy + 22, 9, 9, '#ffffff', -10, 1));
  // Boxing gloves: guard up at rest, a jab on the attack.
  const g = A ? A.glove : [6 + Math.sin(TAU * q * 2) * 1.4, -2];
  body.push(O(cx - 7, cy + 18, 3.6, 3.4, 0, '#4f7ad8', 12), ...limb([cx + 5, cy + 18], [cx + 6 + g[0], cy + 18 + g[1]], 2.6, 2.4, gum.base), O(cx + 7 + g[0], cy + 18 + g[1], 4, 3.6, 0, '#4f7ad8', 14), F(E(cx + 6 + g[0], cy + 16.6 + g[1], 1.4, 1, '#9fc0ff')));
  out.push(...spin(body, cx, 34, lean));
  if (A?.smear) out.push(smear([[cx + 2, cy + 16], [cx + 14, cy + 16], [cx + 26, cy + 16]], 4, '#ffe0e0'));
  if (A?.hit) out.push(...star(cx + 28, cy + 16, 3, '#fff6a8'));
  return { w: 46, h: 36, res: 3, shapes: out };
}

// ---------- Cotton Candy Sheep ----------

const SHEEP_ATK = [
  { puff: 1.3, lean: -8, floss: 0 },
  { puff: 0.8, lean: 10, floss: 0.8 },
  { puff: 0.9, lean: 10, floss: 1.5, hit: 1 },
  { puff: 1, lean: 0, floss: 0.4 },
];

function sheep(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SHEEP_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const floss = ramp('#ffb3dc', { step: 9, turn: 14 });
  const blue = '#b8e0ff';
  const bob = dead ? 0 : walk ? -Math.abs(Math.sin(TAU * q * 2)) * 2.4 : -breath(q) * 1.4;
  const cx = 18;
  const cy = (dead ? 30 : 16) + bob;
  const puff = A ? A.puff : 1;
  const out = [];
  // Sugar-glass wings, fluttering.
  const flap = Math.sin(TAU * q * 4);
  out.push(...spin([O(cx - 6, cy - 6, 6, 3.4, -30, '#e6f6ff', 14), F(O(cx - 7, cy - 7, 3, 1.4, -30, '#ffffff', 10))], cx - 2, cy - 2, flap * 20));
  // Little legs dangling, and a fluffy cloud body of floss in pink and blue.
  for (const ox of [-4, 4]) out.push(...limb([cx + ox, cy + 8], [cx + ox, cy + 13], 1.8, 1.6, '#7a5a7a'));
  for (const [dx, dy, r, c] of [[-7, 2, 6, floss.sh], [7, 2, 6, blue], [0, 4, 7, floss.base], [-4, -3, 6, floss.base], [4, -3, 6, blue], [0, -4, 6, floss.hi]]) out.push(E(cx + dx * puff, cy + dy, r * puff, r * puff * 0.9, c));
  // The face: a little lamb face poking out the front, ears.
  const hx = cx + 9;
  const hy = cy - 1;
  out.push(O(hx - 3, hy - 3, 2.6, 1.4, -30, '#e8d0e0', 10), ...blob(hx, hy, 5.4, 5, ramp('#fff4f0', { step: 8 })));
  out.push(...cuteFace(hx + 1, hy - 0.2, 0.8, mood, { iris: '#c03a8a', gap: 3.8, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: '#fff4f0', mouthDy: 3 }));
  out.push(E(hx - 2, hy - 5, 2.6, 2, floss.hi), E(hx + 1, hy - 5.6, 2.4, 2, blue));
  if (A?.floss) {
    const k = A.floss;
    for (let i = 0; i < 5; i++) out.push(E(hx + 8 + k * (6 + i * 3), hy + Math.sin(i * 2) * 3 * k, 2.6 * k, 2.2 * k, i % 2 ? floss.hi : blue));
  }
  if (A?.hit) out.push(...star(hx + 24, hy, 3, '#fff6a8'));
  return { w: 44, h: 36, res: 3, shapes: dead ? spin(out, cx, 34, 0) : out };
}

// ---------- Lollipop Witch ----------

const LOLLY_ATK = [
  { lean: -16, spiral: 0 },
  { lean: 14, spiral: 0.8, smear: 1 },
  { lean: 12, spiral: 1.5, hit: 1 },
  { lean: 2, spiral: 0.4 },
];

function lollipop(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? LOLLY_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const hop = hopOf(pose, q);
  const cx = 18;
  const cy = (dead ? 10 : 0) - hop * 3;
  const lean = dead ? 86 : A ? A.lean : walk ? Math.sin(TAU * q * 2) * 6 : sway(q) * 4;
  const out = [];
  const body = [];
  // The stick body hopping on one end, two little stick arms.
  body.push(...limb([cx, cy + 34], [cx, cy + 18], 2, 2, '#fff4e6'), F(R(cx + 0.4, cy + 18, 0.6, 16, '#e8d8c8')));
  body.push(...limb([cx, cy + 24], [cx - 6, cy + 22 + Math.sin(TAU * q * 2) * 2], 1, 1, '#fff4e6'), ...limb([cx, cy + 24], [cx + 6, cy + 20], 1, 1, '#fff4e6'));
  // The candy head: a big swirl disc with the face on it, turning as it hops.
  body.push(...swirl(cx, cy + 10, 10, '#ff8ab4', '#ffffff', q * 360));
  body.push(O(cx + 1.4, cy + 11, 6.6, 5, 0, '#ffd0e4', 18));
  body.push(...cuteFace(cx + 1.6, cy + 10.4, 0.95, mood, { iris: '#7a3ad8', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: '#ffd0e4', mouthDy: 3.2, lash: 1.4, wing: 1.2 }));
  // A tiny striped witch hat, tipped.
  body.push(...spin([T([[cx - 7, cy + 1], [cx + 7, cy + 1], [cx + 2, cy - 10], [cx - 3, cy - 13], [cx - 1, cy - 8]], '#7a3ad8'), F(R(cx - 5, cy - 2, 10, 1.6, '#7fe0a8')), O(cx, cy + 1, 9, 1.8, 0, '#5a2ab8', 14)], cx, cy + 1, -12));
  out.push(...spin(body, cx, 34, lean));
  if (A?.spiral) {
    const k = A.spiral;
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const a = i * 0.7;
      pts.push([cx + 14 + i * 1.2 * k, cy + 10 + Math.sin(a) * (2 + i * 0.4) * k]);
    }
    out.push(F(strand(pts, (t) => 2.6 * (1 - t * 0.5), '#ff8ab4')), F(strand(pts.map(([x, y]) => [x, y - 1]), 0.8, '#ffffff')));
  }
  if (A?.smear) out.push(smear(arcPts(cx, cy + 22, 14, 14, -120, 0, 8), 4, '#ffe6f2'));
  if (A?.hit) out.push(...star(cx + 36, cy + 10, 3, '#fff6a8'));
  return { w: 42, h: 36, res: 3, shapes: out };
}

// ---------- Peppermint Spinner ----------

const MINT_ATK = [
  { spin: -40, dx: -2 },
  { spin: 220, dx: 6, smear: 1 },
  { spin: 400, dx: 8, hit: 1 },
  { spin: 450, dx: 2 },
];

function mint(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? MINT_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const hop = hopOf(pose, q);
  const cx = 18 + (A ? A.dx : 0);
  const cy = (dead ? 26 : 20) - hop * 3 - (pose === 'idle' ? breath(q) : 0);
  const rot = A ? A.spin : walk ? q * 360 : 0;
  const out = [];
  // Little feet under the wrapper.
  for (const ox of [-4, 4]) out.push(O(cx + ox, 34, 3, 1.4, 0, '#c03a4a', 12));
  out.push(...limb([cx - 3, cy + 8], [cx - 4, 33], 1.4, 1.4, '#c03a4a'), ...limb([cx + 3, cy + 8], [cx + 4, 33], 1.4, 1.4, '#c03a4a'));
  // The wrapper ends twist out as arms, flaring with the spin.
  const fl = A ? 1.3 : 1 + Math.sin(TAU * q * 2) * 0.1;
  for (const s of [-1, 1]) out.push(T([[cx + s * 8, cy - 2], [cx + s * 16 * fl, cy - 6], [cx + s * 15 * fl, cy + 2], [cx + s * 16 * fl, cy + 6], [cx + s * 8, cy + 2]], '#f4f8ff'), F(T([[cx + s * 8, cy - 1], [cx + s * 14 * fl, cy - 3], [cx + s * 13 * fl, cy + 1], [cx + s * 8, cy + 1]], '#ffffff')));
  // The mint itself: a red-and-white swirl disc, spinning; the face stays upright on top.
  out.push(...swirl(cx, cy, 9, '#ffffff', '#ff4d5a', rot));
  out.push(O(cx + 1, cy + 0.6, 5.4, 4.2, 0, '#fff4f4', 16));
  out.push(...cuteFace(cx + 1.2, cy, 0.8, mood, { iris: '#c03a4a', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: '#fff4f4', mouthDy: 3 }));
  if (A?.smear) out.push(smear(arcPts(cx, cy, 16, 14, -160, 40, 12), 4, '#ffe0e4'));
  if (A?.hit) out.push(...star(cx + 18, cy, 3, '#fff6a8'));
  return { w: 46, h: 36, res: 3, shapes: dead ? spin(out, cx, 34, 0) : out };
}

// ---------- Chocolate Knight ----------

const CHOCO_ATK = [
  { sword: -160, lean: -8, crouch: 2 },
  { sword: -20, lean: 12, crouch: -1, smear: 1 },
  { sword: 30, lean: 14, crouch: 2, hit: 1 },
  { sword: -40, lean: 2, crouch: 0 },
];

function choco(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? CHOCO_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const choc = ramp('#9a5a3a', { step: 10, turn: 8 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 18;
  const cy = (dead ? 10 : 0) + (A ? A.crouch : 0) - Math.abs(step) * 0.8;
  const lean = dead ? 86 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  const body = [];
  for (const [ox, s, c] of [[-4, step, choc.sh], [4, -step, choc.base]]) body.push(...limb([cx + ox, cy + 28], [cx + ox + Math.max(0, s) * 2, 34 - Math.max(0, s) * 1.6], 3.6, 3.4, c), O(cx + ox + 1 + Math.max(0, s) * 2, 35 - Math.max(0, s) * 1.6, 3, 1.4, 0, choc.deep, 12));
  // The foil cape behind.
  const cape = chain(cx - 6, cy + 12, 120, [6, 6, 5], wave(TAU * q * 2, walk ? 14 : 6, 0.8));
  body.push(T([[cx - 6, cy + 10], ...cape.map(([x, y], i) => [x - i * 2, y]), [cape.at(-1)[0] + 8, cape.at(-1)[1] + 2], [cx + 2, cy + 22]], '#c8c8e0'), F(T([[cx - 6, cy + 11], ...cape.slice(1).map(([x, y], i) => [x - i * 2 + 2, y - 1]), [cx, cy + 18]], '#f0f0ff')));
  // The chocolate-bar body: a chunky block scored into squares, a bite out of one corner.
  body.push(R(cx - 9, cy + 6, 18, 23, choc.base), F(R(cx + 6, cy + 6, 3, 23, choc.sh)));
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) body.push(F(R(cx - 8 + c * 5.6, cy + 7 + r * 5.6, 5, 5, c === 2 ? choc.sh : choc.hi)), F(R(cx - 7.4 + c * 5.6, cy + 7.6 + r * 5.6, 3.8, 3.8, choc.base)));
  body.push(E(cx + 9, cy + 6, 3, 3, '#f8f4ff'));
  body.push(F(T([[cx - 9, cy + 18], [cx + 9, cy + 18], [cx + 9, cy + 23], [cx - 9, cy + 23]], '#e8b84a')), F(R(cx - 9, cy + 20, 18, 0.8, '#ffd36b')));
  body.push(O(cx + 1, cy + 13, 6, 4, 0, '#f4dcc0', 14));
  body.push(...cuteFace(cx + 1.4, cy + 12.6, 0.85, mood, { iris: '#5a2a1a', gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: '#f4dcc0', mouthDy: 2.8 }));
  // A little helmet with a cream swirl on top.
  body.push(T([...arcPts(cx, cy + 6, 9.4, 6, 180, 360, 12)], choc.sh), ...[0, 1, 2].map((i) => E(cx - 1 + i * 0.6, cy - 1 - i * 2, 3 - i * 0.8, 1.8, '#fff4e6')));
  // The wafer sword: a long striped wafer, swung overhead and down.
  const sa = A ? A.sword : walk ? -50 + step * 6 : -50;
  const hand = [cx + 9, cy + 16];
  const tip = [hand[0] + Math.cos(sa * D2R) * 18, hand[1] + Math.sin(sa * D2R) * 18];
  body.push(...limb([cx + 7, cy + 14], hand, 3, 2.8, choc.base), ...limb(hand, tip, 3.6, 3.2, '#f0c888'));
  for (let i = 1; i < 6; i++) {
    const x = hand[0] + (tip[0] - hand[0]) * (i / 6);
    const y = hand[1] + (tip[1] - hand[1]) * (i / 6);
    body.push(F(E(x, y, 0.6, 0.6, '#c8904a')));
  }
  out.push(...spin(body, cx, 34, lean));
  if (A?.smear) out.push(smear([[cx, cy - 4], [cx + 14, cy + 2], [tip[0] + 2, tip[1]]], 5, '#fff0e0'));
  if (A?.hit) out.push(...star(tip[0] + 2, tip[1], 3.2, '#fff6a8'), F(E(tip[0] - 4, tip[1] + 3, 1.4, 1, choc.base)));
  return { w: 44, h: 38, res: 3, shapes: out };
}

// ---------- Jelly Bean Ninja ----------

const NINJA_ATK = [
  { arm: -150, lean: -12 },
  { arm: -10, lean: 14, throw: 1 },
  { arm: 10, lean: 12, throw: 1.8, hit: 1 },
  { arm: -40, lean: 0 },
];

function bean(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? NINJA_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const skin = ramp('#7fe08a', { step: 10, turn: 12 });
  const run = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 18;
  const cy = (dead ? 12 : 0) - Math.abs(run) * 1.6;
  const lean = dead ? 90 : A ? A.lean : walk ? 14 : sway(q) * 2;
  const out = [];
  const body = [];
  // A quick sneaky run on little legs.
  for (const [ox, s, c] of [[-3, run, skin.sh], [3, -run, skin.base]]) body.push(...limb([cx + ox, cy + 27], [cx + ox + s * 3, 34 - Math.max(0, s) * 2], 2.6, 2.4, c), O(cx + ox + s * 3 + 1, 35 - Math.max(0, s) * 2, 2.4, 1.2, 0, '#3a3050', 10));
  // The scarf trailing out behind in candy stripes.
  const sc = chain(cx - 5, cy + 12, 180, [5, 5, 5, 4], wave(TAU * q * 2, walk ? 20 : 8, 0.8));
  body.push(strand(sc, 3.4, '#ff6b9a'));
  for (let i = 1; i < sc.length; i++) body.push(F(E(sc[i][0], sc[i][1], 1.6, 1.6, i % 2 ? '#ffffff' : '#ffd36b')));
  // The bean: a glossy kidney-shaped body tilted forward, speckled.
  body.push(...spin([O(cx, cy + 17, 9, 12, 0, skin.base, 22), crescent(cx, cy + 17, 9, 12, skin.sh, { k: 0.3 }), F(O(cx - 9, cy + 17, 2.6, 4, 0, skin.sh, 10)), shine(cx, cy + 17, 9, 12, '#ffffff', -20, 1.2)], cx, cy + 17, 12));
  for (const [x, y] of [[-4, 22], [3, 25], [-2, 11]]) body.push(F(E(cx + x, cy + y, 0.8, 0.8, skin.deep)));
  // The headband with its tails, the face.
  body.push(R(cx - 8, cy + 8, 17, 3.4, '#3a3050'), F(E(cx + 3, cy + 9.7, 1.4, 1.4, '#ff6b9a')));
  for (const d of [-1, 1]) body.push(strand(chain(cx - 8, cy + 9.6, 170 + d * 16, [3, 3], wave(TAU * q * 2 + d, 18, 0.8)), 1.4, '#3a3050'));
  body.push(...cuteFace(cx + 2.4, cy + 14.6, 0.95, mood, { iris: '#2a6a2a', gap: 4.6, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: skin.base, mouthDy: 3.4 }));
  const arm = A ? A.arm : walk ? 150 + run * 20 : -40;
  const hand = [cx + 6 + Math.cos(arm * D2R) * 6, cy + 18 + Math.sin(arm * D2R) * 6];
  body.push(...limb([cx + 6, cy + 18], hand, 2.4, 2.2, skin.base));
  out.push(...spin(body, cx, 34, lean));
  if (A?.throw) for (let i = 0; i < 3; i++) {
    const k = A.throw;
    const sx = cx + 12 + k * 8 + i * 2;
    const sy = cy + 14 + (i - 1) * 6 * k;
    out.push(...spin([T([[sx, sy - 3], [sx + 1, sy - 1], [sx + 3, sy], [sx + 1, sy + 1], [sx, sy + 3], [sx - 1, sy + 1], [sx - 3, sy], [sx - 1, sy - 1]], ['#ff6b9a', '#ffd36b', '#7fd8ff'][i]), F(E(sx, sy, 0.8, 0.8, '#ffffff'))], sx, sy, k * 180 + i * 30));
  }
  if (A?.hit) out.push(...star(cx + 32, cy + 14, 3, '#fff6a8'));
  return { w: 46, h: 38, res: 3, shapes: out };
}

export const ART = {
  gummybear: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 170], draw: gummy },
  cottoncandy: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 240, 180], draw: sheep },
  lollipopwitch: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 240, 180], draw: lollipop },
  peppermint: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 210, 170], draw: mint },
  chocoknight: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [100, 300, 220], draw: choco },
  jellyninja: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [60, 210, 160], draw: bean },
};

export const INFO = {
  gummybear: { name: 'Gummy Bear Brawler', w: 24, h: 34 },
  cottoncandy: { name: 'Cotton Candy Sheep', w: 30, h: 30 },
  lollipopwitch: { name: 'Lollipop Witch', w: 24, h: 36 },
  peppermint: { name: 'Peppermint Spinner', w: 28, h: 30 },
  chocoknight: { name: 'Chocolate Knight', w: 26, h: 36 },
  jellyninja: { name: 'Jelly Bean Ninja', w: 24, h: 34 },
};
