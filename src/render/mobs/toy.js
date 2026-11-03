// Monster art: the Clockwork Carnival's wind-up toys (the levels 25-30 group dungeon, see
// docs/design/clockwork-carnival.md). Redrawn toy-first (2026-11-03, the dungeon monster redesign:
// chibi creatures with their own silhouettes, not costumed girls on one rig). Every toy has a
// wind-up key in its back that turns as it goes.
//   musicballerina  Music Box Ballerina: a little mouse in a tutu twirling on top of her music box;
//                   a spinning kick.
//   tindrummer      Tin Drummer: a tin rabbit in a shako with a big drum on its tummy; marches and
//                   beats out rings of sound.
//   jackbox         Jack-in-the-Box: a striped box, a spring, and a round clown head in a jester's
//                   hat; boings forward and bonks.
//   marionette      Marionette Dancer: a floppy wooden puppy hanging on strings from a cross-bar;
//                   jerky puppet kicks.
//   teddystrong     Teddy Strongbear: a big round teddy in a striped strongman suit with a barbell;
//                   an overhead slam.
//   balloonseller   Balloon Seller: a balloon-animal poodle floating under a bunch of balloons;
//                   pops one at you.
// Every design faces right, its lowest point on the bottom edge. Attacks are four frames:
// wind-up (the tell), strike, impact, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';

const frames = (pose) => (pose === 'walk' ? 8 : pose === 'attack' ? 4 : 6);
const phase = (pose, f) => f / frames(pose);
// Toys move on the tick: the phase stepped into sharp beats, eased a little at each.
const tick = (q, n = 8) => {
  const s = q * n;
  const i = Math.floor(s);
  const u = s - i;
  return (i + Math.min(1, u * 2.4) ** 0.6) / n;
};

// A wind-up key: a brass shaft out of the back and a two-lobed bow, turned by q (seen edge-on as it
// turns, so its width breathes).
export function windKey(x, y, q, k = 1, dir = -1) {
  const w = Math.abs(Math.cos(q * TAU * 2)) * 4 * k + 0.8 * k;
  const brass = '#e8b84a';
  return [
    R(x + dir * 3 * k - (dir < 0 ? 0 : 0), y - 0.8 * k, 3 * k * -dir, 1.6 * k, '#c8902a'),
    E(x + dir * 4 * k, y - 2.6 * k, w * 0.6, 2.4 * k, brass), E(x + dir * 4 * k, y + 2.6 * k, w * 0.6, 2.4 * k, brass),
    F(E(x + dir * 4 * k, y - 2.6 * k, Math.max(0.3, w * 0.25), 1 * k, '#fff0b8')), E(x + dir * 4 * k, y, 1.1 * k, 1.1 * k, '#c8902a'),
  ];
}

// ---------- Music Box Ballerina ----------

const BAL_ATK = [
  { spin: -20, kick: -0.4, rise: 1.4, lean: -6 },
  { spin: 180, kick: 1, rise: -1, lean: 8 },
  { spin: 360, kick: 1.1, rise: -0.6, lean: 10, hit: 1 },
  { spin: 360, kick: 0.2, rise: 0.2, lean: 0 },
];

function ballerina(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? BAL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#d8d0e8', { step: 9, turn: 12 });
  const box = ramp('#ff9ab8', { step: 10 });
  const tutu = '#fff0f8';
  const out = [];
  // The music box: a round tin drum with a scalloped lid and a crank; it rolls on little feet.
  const bx = 18;
  const by = 38;
  out.push(O(bx, by - 5, 13, 5, 0, box.sh, 22), R(bx - 13, by - 12, 26, 7, box.base), O(bx, by - 12, 13, 4.4, 0, box.hi, 22));
  for (let i = 0; i < 6; i++) out.push(F(E(bx - 11 + i * 4.4, by - 8.6, 1.2, 1.2, '#ffd36b')));
  out.push(F(R(bx - 13, by - 6.4, 26, 1, box.deep)), E(bx - 9, by - 1, 2, 1.4, '#c8902a'), E(bx + 9, by - 1, 2, 1.4, '#c8902a'));
  const cr = walk ? tick(q) * TAU * 2 : q * TAU;
  out.push(...limb([bx + 13, by - 8], [bx + 13 + Math.cos(cr) * 4, by - 8 + Math.sin(cr) * 4], 1.2, 1.2, '#c8902a'), E(bx + 13 + Math.cos(cr) * 4, by - 8 + Math.sin(cr) * 4, 1.4, 1.4, '#ffd36b'));
  // The mouse dancer on top: twirling on one toe, the other leg in an arabesque.
  const rot = dead ? 80 : A ? A.spin : walk ? Math.sin(tick(q) * TAU * 2) * 10 : sway(q) * 6;
  const cy = by - 26 - (A ? A.rise : pose === 'idle' ? breath(q) * 0.8 : 0);
  const d = [];
  const leg = A ? A.kick : walk ? 0.4 + Math.sin(tick(q) * TAU * 2) * 0.3 : 0.3;
  d.push(...limb([bx, cy + 6], [bx, by - 15], 2.2, 1.6, fur.sh), F(E(bx, by - 14.6, 1.6, 1, '#ff9ab8')));
  d.push(...limb([bx, cy + 6], [bx - 7 + leg * 15, cy + 8 - leg * 4], 2.2, 1.6, fur.base), F(E(bx - 7 + leg * 15, cy + 8 - leg * 4, 1.6, 1, '#ff9ab8')));
  // The tutu: a wide frilled disc.
  d.push(O(bx, cy + 4, 9.4, 2.6, 0, tutu, 20));
  for (let i = 0; i < 9; i++) d.push(F(E(bx - 8 + i * 2, cy + 5, 1.4, 1, i % 2 ? '#ffd6ea' : tutu)));
  d.push(...blob(bx, cy, 4.4, 4.6, fur));
  // Arms up in a ring over her head.
  d.push(...limb([bx - 2, cy - 2], [bx - 3, cy - 9], 1.6, 1.4, fur.sh), ...limb([bx + 2, cy - 2], [bx + 3, cy - 9], 1.6, 1.4, fur.base));
  // Head: big round ears, a pointed little snout, a tiara.
  const hx = bx + 0.6;
  const hy = cy - 9;
  d.push(E(hx - 5, hy - 4.4, 3.4, 3.4, fur.sh), F(E(hx - 5, hy - 4.4, 2, 2, '#ffc6d8')), E(hx + 4.4, hy - 4.8, 3.4, 3.4, fur.base), F(E(hx + 4.4, hy - 4.8, 2, 2, '#ffc6d8')));
  d.push(...blob(hx, hy, 5.6, 5, fur), E(hx + 5.6, hy + 1.6, 1, 0.9, '#ff7a9a'));
  d.push(...cuteFace(hx + 1, hy + 0.2, 0.7, mood, { iris: '#7a5ad8', gap: 3.8, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: fur.base, mouthDy: 3 }));
  d.push(T([[hx - 2.4, hy - 4.6], [hx, hy - 7], [hx + 2.4, hy - 4.6]], '#ffd36b'), F(E(hx, hy - 6.2, 0.8, 0.8, '#ff6b9a')));
  out.push(...spin(d, bx, cy + 4, rot), ...windKey(bx - 13, by - 9, q));
  if (A && (f === 1 || f === 2)) out.push(smear(arcPts(bx, cy + 6, 14, 6, 150, 360, 10), 3, '#ffe6f2'));
  if (A?.hit) out.push(...star(bx + 16, cy + 4, 2.8, '#fff6a8'));
  if (!dead && pose === 'idle') out.push(F(T([[bx + 10, cy - 10], [bx + 11.6, cy - 10.4], [bx + 11.6, cy - 6], [bx + 10.6, cy - 6]], '#8f6cc4')), F(E(bx + 10, cy - 6, 1.1, 0.9, '#8f6cc4')));
  return { w: 40, h: 40, res: 3, shapes: out };
}

// ---------- Tin Drummer ----------

const DRUM_ATK = [
  { sticks: [-140, -150], lean: -6, ring: 0 },
  { sticks: [-40, -10], lean: 6, ring: 0.6 },
  { sticks: [-30, 0], lean: 4, ring: 1.2 },
  { sticks: [-90, -70], lean: 0, ring: 0 },
];

function drummer(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? DRUM_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const tin = ramp('#9fc8e8', { step: 11, turn: 10 });
  const coat = ramp('#e0505a', { step: 10 });
  const drumC = ramp('#ffe8c0', { step: 9 });
  const tq = tick(q);
  // A stiff wind-up march: knees high, on the tick.
  const step = walk ? Math.sin(tq * TAU * 2) : 0;
  const bx = 16;
  const by = (dead ? 8 : 0) - (walk ? Math.abs(step) * 1.4 : pose === 'idle' ? breath(q) * 0.6 : 0);
  const lean = dead ? 86 : A ? A.lean : walk ? 3 : 0;
  const out = [];
  for (const [ox, s, c] of [[-2.4, step, tin.sh], [2.4, -step, tin.base]]) {
    const knee = Math.max(0, s) * 4;
    out.push(...limb([bx + ox, by + 27], [bx + ox + knee * 0.6, by + 33 - knee], 3.4, 3, c), O(bx + ox + knee * 0.6 + 1, by + 34.4 - knee, 2.8, 1.4, 0, '#3a3a5a', 12));
  }
  const body = [];
  // Body: a round tin rabbit, a red coat with gold buttons.
  body.push(...blob(bx, by + 21, 7.6, 7.6, coat));
  for (let i = 0; i < 3; i++) body.push(F(E(bx + 4.6, by + 17 + i * 3, 0.9, 0.9, '#ffd36b')));
  // The drum on its tummy: a short cylinder with a lit skin and zigzag cords.
  body.push(O(bx + 5, by + 25, 6, 2.4, 0, drumC.sh, 16), R(bx - 1, by + 20, 12, 5, '#4f7ad8'), O(bx + 5, by + 20, 6, 2.4, 0, drumC.base, 16), F(O(bx + 4.4, by + 19.6, 3.6, 1.2, 0, '#ffffff', 12)));
  for (let i = 0; i < 4; i++) body.push(F(T([[bx - 0.4 + i * 3, by + 21.4], [bx + 1 + i * 3, by + 23.6], [bx + 1.4 + i * 3, by + 23.6], [bx + 0 + i * 3, by + 21.4]], '#ffd36b')));
  // Head: a round tin rabbit head, long ears out of the shako.
  const hx = bx + 1;
  const hy = by + 9;
  for (const [x, a, c] of [[-2, -112, tin.sh], [2, -96, tin.base]]) {
    const ear = chain(hx + x, hy - 6, a, [4, 4], walk ? (i) => (i ? Math.sin(tq * TAU * 2) * 8 : 0) : () => 6);
    body.push(strand(ear, (t) => 3.6 * (1 - t * 0.3), c), F(strand(ear.map(([x2, y2]) => [x2 + 0.4, y2]), (t) => 1.4 * (1 - t * 0.4), '#ffc6d8')));
  }
  body.push(...blob(hx, hy, 6.6, 6, tin));
  // Shako: a tall red hat with a gold band, a plume and a chin strap.
  body.push(R(hx - 4.4, hy - 13, 8.8, 8, coat.base), F(R(hx + 2.4, hy - 13, 2, 8, coat.sh)), R(hx - 5, hy - 6, 10, 1.6, '#ffd36b'), O(hx, hy - 13, 4.4, 1.4, 0, coat.hi, 12));
  body.push(E(hx - 1, hy - 16, 1.6, 2.6, '#ffffff'));
  body.push(...cuteFace(hx + 1.6, hy + 0.8, 0.85, mood, { iris: '#3a5ad8', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: tin.base, mouthDy: 3 }));
  // Sticks in both paws: up for the wind-up, down hard on the strike, a roll as it marches.
  const st = A ? A.sticks : walk ? [-60 + Math.sin(tq * TAU * 4) * 30, -60 - Math.sin(tq * TAU * 4) * 30] : [-50, -70];
  st.forEach((a, i) => {
    const sx = bx + (i ? 6 : 2);
    const sy = by + 18;
    const hand = [sx + 2, sy + 1];
    const tip = [hand[0] + Math.cos(a * D2R) * 9, hand[1] + Math.sin(a * D2R) * 9];
    body.push(...limb([sx - 2, sy - 1], hand, 2.6, 2.2, i ? tin.base : tin.sh), ...limb(hand, tip, 0.9, 0.9, '#c8902a'), E(tip[0], tip[1], 1.3, 1.3, '#fff4e6'));
  });
  out.push(...spin(body, bx, by + 30, lean), ...windKey(bx - 7, by + 21, q));
  if (A?.ring) for (const k of [1, 1.8]) out.push(...ringArc(bx + 14 + A.ring * 6 * k, by + 21, 4 * A.ring * k, '#ffd36b'));
  return { w: 40, h: 36, res: 3, shapes: out };
}

// A sound ring: an arc band opening forward.
const ringArc = (x, y, r, c) => [F(T([...arcPts(x, y, r, r * 1.4, -60, 60, 10), ...arcPts(x, y, r * 0.75, r * 1.1, 60, -60, 10)], c))];

// ---------- Jack-in-the-Box ----------

const JACK_ATK = [
  { spring: 0.2, reach: -4, lean: -16, bonk: -60 },
  { spring: 1.4, reach: 12, lean: 24, bonk: 30 },
  { spring: 1.3, reach: 13, lean: 30, bonk: 60, hit: 1 },
  { spring: 0.8, reach: 4, lean: 6, bonk: -10 },
];

function jackbox(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? JACK_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const box = ramp('#7fb8ff', { step: 10 });
  const face = ramp('#fff4ee', { step: 8 });
  const tq = tick(q);
  // The box hops along on its corners; the head bobs on the spring a beat behind.
  const hop = walk ? Math.abs(Math.sin(tq * TAU * 2)) * 2.6 : 0;
  const out = [];
  const bx = 16;
  const by = 40 - hop;
  // The box: striped sides, a flap of lid swung back, a star on the front.
  out.push(R(bx - 10, by - 16, 20, 16, box.base), F(R(bx + 6, by - 16, 4, 16, box.sh)));
  for (let i = 0; i < 3; i++) out.push(F(R(bx - 10 + i * 7, by - 16, 3, 16, '#ffe36b')));
  out.push(...star(bx - 1, by - 8, 3.4, '#ff6b9a', '#ffd0e0'));
  out.push(T([[bx - 10, by - 16], [bx - 18, by - 22], [bx - 16, by - 24], [bx - 8, by - 17]], box.sh));
  // The spring: zigzag coils from the box up to the head.
  const ext = A ? A.spring : walk ? 0.6 + Math.sin(tq * TAU * 2 - 1) * 0.25 : 0.5 + breath(q) * 0.2;
  const reach = A ? A.reach : 0;
  const top = [bx + reach, by - 16 - 8 - ext * 8];
  const coils = 6;
  const pts = [];
  for (let i = 0; i <= coils * 2; i++) {
    const u = i / (coils * 2);
    pts.push([bx + reach * u + (i % 2 ? 3 : -3), by - 16 - (by - 16 - top[1]) * u]);
  }
  for (let i = 0; i < pts.length - 1; i++) out.push(...limb(pts[i], pts[i + 1], 1, 1, i % 2 ? '#b8b8c8' : '#d8d8e8'));
  // The head: a round clown face with a red nose, a jester's hat with bells.
  const lean = dead ? 70 : A ? A.lean : walk ? Math.sin(tq * TAU * 2) * 12 : sway(q) * 8;
  const h = [];
  const [hx, hy] = top;
  h.push(...blob(hx, hy - 6, 7.4, 7, face));
  h.push(...cuteFace(hx + 1.6, hy - 6.4, 0.95, mood, { iris: '#2a8a5a', gap: 4.4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: face.base, mouthDy: 3.6 }));
  h.push(E(hx + 6.6, hy - 4.6, 1.8, 1.8, '#ff4d6d'), F(E(hx + 6.2, hy - 5.2, 0.6, 0.6, '#ffffff')));
  h.push(F(O(hx, hy + 0.4, 7.6, 2, 0, '#ffffff', 16)));
  for (let i = 0; i < 7; i++) h.push(F(E(hx - 6 + i * 2, hy + 0.8, 1.2, 1, i % 2 ? '#ffd0e0' : '#ffffff')));
  for (const [a, c] of [[-150, '#9a5ad8'], [-40, '#ffb020']]) {
    const tip = chain(hx, hy - 11, a, [4, 4, 3], dead ? () => 20 : wave(tq * TAU * 2, 14, 0.8));
    h.push(T([[hx - 4, hy - 11], [tip[1][0], tip[1][1]], [tip.at(-1)[0], tip.at(-1)[1]], [tip[1][0] + 1, tip[1][1] + 2], [hx + 4, hy - 11]], c), E(tip.at(-1)[0], tip.at(-1)[1], 1.6, 1.6, '#ffd36b'));
  }
  // A squeaky mallet in a little gloved hand off the spring.
  const ba = A ? A.bonk : -30 + Math.sin(q * TAU) * 10;
  const grip = [hx + 6, hy + 4];
  const head = [grip[0] + Math.cos(ba * D2R) * 8, grip[1] + Math.sin(ba * D2R) * 8];
  h.push(...limb(grip, head, 1, 1, '#c8902a'), O(head[0], head[1], 3.4, 2.4, ba + 90, '#ff6b9a'), F(O(head[0] - 0.6, head[1] - 0.6, 1.6, 1, ba + 90, '#ffc6d8')), E(grip[0], grip[1], 1.8, 1.8, '#ffffff'));
  out.push(...spin(h, hx, hy, lean), ...windKey(bx - 10, by - 8, q));
  if (A && f === 1) out.push(smear([[hx - 6, hy - 14], [hx + 4, hy - 8], [head[0] + 2, head[1]]], 3, '#fff0f6'));
  if (A?.hit) out.push(...star(head[0] + 4, head[1] + 2, 3, '#fff6a8'));
  return { w: 44, h: 54, res: 3, shapes: dead ? spin(out, bx, 40, 0) : out };
}

// ---------- Marionette Dancer ----------

const PUP_ATK = [
  { bar: -10, kick: -0.6, lift: 3 },
  { bar: 20, kick: 1, lift: -1 },
  { bar: 24, kick: 1.2, lift: -1.4, hit: 1 },
  { bar: 0, kick: 0.2, lift: 0.4 },
];

function marionette(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? PUP_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const wood = ramp('#e8b888', { step: 10, turn: 12 });
  const vest = ramp('#9a5ad8', { step: 10 });
  const tq = tick(q);
  // The cross-bar floats overhead, tipping, and the puppy jerks on its strings.
  const bar = A ? A.bar : walk ? Math.sin(tq * TAU * 2) * 14 : sway(q) * 6;
  const lift = A ? A.lift : walk ? Math.abs(Math.sin(tq * TAU * 2)) * 2 : breath(q) * 1;
  const bx = 18;
  const barY = 4;
  const by = (dead ? 14 : 0) - lift;
  const out = [];
  const c = Math.cos(bar * D2R);
  const s = Math.sin(bar * D2R);
  const barPt = (u) => [bx + u * c * 10, barY + u * s * 10];
  // The puppy: a jointed wooden body, a floppy-eared head, four peg legs.
  const hip = [bx - 2, by + 30];
  const chest = [bx + 4, by + 28];
  const kick = A ? A.kick : walk ? Math.sin(tq * TAU * 2) : 0;
  const legs = [[hip, -1, wood.sh], [chest, 1, wood.sh], [hip, 1, wood.base], [chest, -1, wood.base]];
  if (!dead) legs.forEach(([p, s2, col], i) => {
    const k = s2 * kick * (i < 2 ? 0.6 : 1);
    const foot = [p[0] + k * 6 + (i === 3 && A ? A.kick * 6 : 0), p[1] + 8 - Math.max(0, k) * 2];
    out.push(...limb(p, [(p[0] + foot[0]) / 2, (p[1] + foot[1]) / 2 + 0.6], 2.6, 2.4, col), ...limb([(p[0] + foot[0]) / 2, (p[1] + foot[1]) / 2 + 0.6], foot, 2.4, 2, col), E(foot[0], foot[1], 1.8, 1.8, col));
  });
  out.push(...blob(bx + 1, by + 27, 7.6, 5, wood), R(bx - 3, by + 23, 9, 7, vest.base), F(R(bx + 4, by + 23, 2, 7, vest.sh)), F(E(bx + 1, by + 24.6, 1, 1, '#ffd36b')));
  out.push(strand(chain(hip[0] - 1, hip[1] - 2, 200, [3, 3], () => -20), (t) => 2 * (1 - t * 0.5), wood.sh));
  const hx = bx + 7;
  const hy = by + 19;
  const head = [];
  head.push(...blob(hx, hy, 6.4, 5.8, wood), E(hx + 6, hy + 1.6, 3.4, 2.6, wood.base), F(E(hx + 8.6, hy + 0.8, 1.4, 1.2, '#4a2a2a')));
  for (const [x, a, col] of [[-4, 110, wood.sh], [2, 80, '#c8885a']]) {
    const ear = chain(hx + x, hy - 3, a, [3.6, 3.6], wave(tq * TAU * 2, 18, 0.8));
    head.push(strand(ear, (t) => 3.4 * (1 - t * 0.2), col));
  }
  head.push(...cuteFace(hx + 1, hy - 0.6, 0.85, mood, { iris: '#5a3a2a', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: wood.base, mouthDy: 3.6 }));
  // Peg joints: little dark dots where the wood is pinned.
  for (const p of [hip, chest]) head.push(F(E(p[0], p[1], 0.8, 0.8, '#8a5a3a')));
  out.push(...spin(head, hx, hy + 4, A ? A.bar * 0.6 : bar * 0.4));
  // The strings from the bar to head, back and paws, then the bar itself.
  if (!dead) for (const [u, p] of [[-1, [hip[0], hip[1] - 2]], [-0.2, [bx + 1, by + 23]], [0.4, [hx, hy - 4]], [1, [chest[0] + 4, chest[1] + 4]]]) {
    const a = barPt(u);
    out.push(F(T([[a[0] - 0.2, a[1]], [a[0] + 0.2, a[1]], [p[0] + 0.2, p[1]], [p[0] - 0.2, p[1]]], '#f6f0ff')));
  }
  out.push(...limb(barPt(-1.1), barPt(1.1), 2, 2, '#8a5a3a'), ...limb([bx - s * 4, barY + c * 4 - 6], [bx + s * 4, barY - c * 4 + 2], 1.6, 1.6, '#a87a4a'));
  out.push(...windKey(bx - 6, by + 26, q));
  if (A && f === 1) out.push(smear([[bx, by + 34], [bx + 10, by + 34], [bx + 20, by + 30]], 3, '#fff4e6'));
  if (A?.hit) out.push(...star(bx + 20, by + 31, 2.8, '#fff6a8'));
  return { w: 40, h: 46, res: 3, shapes: out };
}

// ---------- Teddy Strongbear ----------

// paw: where both paws hold the bar (from the body's centre): hoisted high over the head, down
// in front on the slam.
const TED_ATK = [
  { paw: [-2, -10], squat: 2.4, lean: -6 },
  { paw: [12, 14], squat: -1, lean: 10, smear: 1 },
  { paw: [14, 26], squat: 2, lean: 8, hit: 1 },
  { paw: [8, 20], squat: 0.6, lean: 0 },
];

function teddy(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? TED_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#c8946a', { step: 10, turn: 12, sat: -6 });
  const muzzle = ramp('#f4dcc0', { step: 8 });
  const tq = tick(q);
  const step = walk ? Math.sin(tq * TAU * 2) : 0;
  const squat = A ? A.squat : walk ? Math.abs(step) * 0.8 : breath(q) * 0.6;
  const bx = 20;
  const by = (dead ? 10 : 0) + squat;
  const lean = dead ? 84 : A ? A.lean : walk ? step * 3 : 0;
  const out = [];
  // Stubby legs, plodding on the tick.
  for (const [ox, s, col] of [[-4, step, fur.sh], [4, -step, fur.base]]) out.push(...limb([bx + ox, by + 30], [bx + ox + Math.max(0, s) * 2, 39 - Math.max(0, s) * 2], 5.4, 5, col), F(E(bx + ox + 1 + Math.max(0, s) * 2, 39.4 - Math.max(0, s) * 2, 2.6, 1.2, muzzle.sh)));
  const body = [];
  // A big round tummy in a striped strongman suit.
  body.push(...blob(bx, by + 24, 11, 10, fur));
  body.push(T([...arcPts(bx, by + 24, 11, 10, -40, 220, 18)], '#ff6b8a'));
  for (let i = 0; i < 4; i++) body.push(F(T([...arcPts(bx, by + 24, 11, 10, -30 + i * 64, -6 + i * 64, 4), [bx, by + 24]], '#ffffff')));
  body.push(F(O(bx + 2, by + 26, 6, 5, 0, muzzle.base, 16)));
  // The barbell held in both paws: hoisted overhead for the wind-up, slammed down in front.
  // (At rest the bar sits across its tummy.)
  const po = A ? A.paw : [7, 22 + (walk ? step : breath(q)) * 0.8];
  const sh = [bx + 2, by + 18];
  const paw = [bx + po[0], by + po[1]];
  const arms = [...limb([bx - 6, by + 18], [paw[0] - 2, paw[1]], 4.4, 3.6, fur.sh), ...limb(sh, paw, 4.4, 3.6, fur.base)];
  const bar = [[paw[0] - 12, paw[1]], [paw[0] + 12, paw[1]]];
  arms.push(...limb(bar[0], bar[1], 1.6, 1.6, '#8a8aa0'));
  for (const [x, y] of bar) arms.push(O(x, y, 3.4, 5.4, 0, '#3a3a5a', 14), F(O(x - 0.8, y - 1.4, 1.2, 2.4, 0, '#6a6a8a', 10)));
  // (Overhead, the arms and bar go behind the head; otherwise in front of the tummy.)
  const over = paw[1] < by + 12;
  if (over) body.push(...arms);
  // The head: round ears, a muzzle, a stitched patch.
  const hx = bx + 1;
  const hy = by + 9;
  body.push(E(hx - 6.6, hy - 5.6, 3.4, 3.4, fur.sh), F(E(hx - 6.6, hy - 5.6, 1.8, 1.8, muzzle.sh)), E(hx + 6, hy - 6, 3.4, 3.4, fur.base), F(E(hx + 6, hy - 6, 1.8, 1.8, muzzle.base)));
  body.push(...blob(hx, hy, 8.4, 7.6, fur), F(O(hx + 3, hy + 3, 4, 3, 0, muzzle.base, 14)), E(hx + 5.6, hy + 1.8, 1.4, 1.1, '#4a2a2a'));
  body.push(F(R(hx - 6, hy - 1, 3, 3, '#e8a0b0')), F(R(hx - 6.2, hy - 0.2, 3.4, 0.4, '#8a4a5a')));
  body.push(...cuteFace(hx + 1, hy - 1, 1, mood, { iris: '#4a2a1a', gap: 5, atk: A ? (f === 1 || f === 2 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: 4.6 }));
  if (!over) body.push(...arms);
  out.push(...spin(body, bx, by + 32, lean), ...windKey(bx - 11, by + 22, q));
  if (A?.smear) out.push(smear([[paw[0] - 6, by - 14], [paw[0] + 6, by + 2], [paw[0] + 4, by + 22]], 6, '#fff0e0'));
  if (A?.hit) out.push(...star(paw[0] + 8, 36, 4, '#fff6a8'), ...star(paw[0] - 10, 37, 2.6, '#ffffff'));
  return { w: 46, h: 40, res: 3, shapes: out };
}

// ---------- Balloon Seller ----------

const BALLOON_ATK = [
  { lean: -10, pop: 0, aim: 1 },
  { lean: 8, pop: 1 },
  { lean: 6, pop: 1.4 },
  { lean: 0, pop: 0 },
];

function balloonpoodle(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? BALLOON_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const pink = ramp('#ff9ac8', { step: 10, turn: 12 });
  const bob = dead ? 0 : (walk ? Math.sin(TAU * q * 2) * 2 : -breath(q) * 1.6);
  const bx = 18;
  const by = (dead ? 18 : 0) + bob;
  const lean = dead ? 0 : A ? A.lean : walk ? Math.sin(TAU * q * 2) * 6 : sway(q) * 4;
  const out = [];
  // The balloon bunch overhead on strings tied to its tail, swaying.
  const tail = [bx - 9, by + 24];
  if (!dead) {
    const bunch = [[-6, -18, '#ffd36b'], [2, -21, '#7fd8ff'], [-1, -14, '#9fe0a8'], [6, -15, '#c9a6ff']];
    bunch.forEach(([dx, dy, c], i) => {
      const sw = Math.sin(TAU * q + i) * 1.5;
      const p = [tail[0] + dx + sw, tail[1] + dy - 6];
      out.push(F(T([[tail[0], tail[1]], [tail[0] + 0.3, tail[1]], [p[0] + 0.2, p[1] + 5], [p[0] - 0.2, p[1] + 5]], '#f6f0ff')));
      out.push(E(p[0], p[1], 4.2, 5, c), F(E(p[0] - 1.4, p[1] - 1.8, 1.1, 1.6, '#ffffff')), F(T([[p[0] - 0.8, p[1] + 5.6], [p[0] + 0.8, p[1] + 5.6], [p[0], p[1] + 4.4]], c)));
    });
  }
  // The poodle: twisted balloon segments (each a glossy oval with a pinched join).
  const seg = (x, y, rx, ry, a) => [O(x, y, rx, ry, a, pink.base, 16), crescent(x, y, rx, ry, pink.sh, { k: 0.3, rot: a }), shine(x, y, rx, ry, '#ffffff', a, 0.9)];
  const kick = walk ? Math.sin(TAU * q * 2) * 10 : 0;
  const body = [];
  for (const [x, a] of [[-5, 100 + kick], [5, 80 - kick]]) body.push(...seg(bx + x + Math.cos(a * D2R) * 4, by + 30 + Math.sin(a * D2R) * 4, 1.8, 4.4, a + 90));
  body.push(...seg(bx, by + 26, 8, 3.6, 0));
  body.push(...seg(tail[0] - 2, tail[1] - 2, 1.8, 3.6, -30), E(tail[0] - 3.4, tail[1] - 5.4, 2.4, 2.4, pink.hi));
  body.push(...seg(bx + 6, by + 20, 2.4, 4.6, 20));
  const hx = bx + 8;
  const hy = by + 13;
  body.push(...seg(hx, hy, 6, 5.4, 0), ...seg(hx + 6.4, hy + 1.6, 3.2, 2, 0));
  body.push(E(hx - 5, hy + 1, 2.6, 3.6, pink.sh), E(hx - 2, hy - 5.4, 3, 2.6, pink.hi));
  body.push(...cuteFace(hx + 1, hy - 0.4, 0.85, mood, { iris: '#ff4d8a', gap: 4, atk: A ? (f === 1 || f === 2 ? 1 : 0.3) : 0, skin: pink.base, mouthDy: 3.2 }));
  body.push(F(E(hx + 9.4, hy + 1.2, 1, 1, '#c03a7a')));
  out.push(...spin(body, bx, by + 26, lean), ...windKey(bx - 8, by + 26, q));
  // The attack: aims a little balloon, then it pops in front of it with a star of confetti.
  if (A?.aim) out.push(E(hx + 10, hy - 4, 3, 3.6, '#ff6b6b'), F(E(hx + 9, hy - 5.4, 0.8, 1.2, '#ffffff')));
  if (A?.pop) {
    const k = A.pop;
    out.push(...star(hx + 14 + k * 3, hy - 2, 3.2 * k, '#fff6a8'));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      out.push(F(O(hx + 14 + k * 3 + Math.cos(a) * 5 * k, hy - 2 + Math.sin(a) * 5 * k, 1, 0.6, i * 40, ['#ff6b6b', '#ffd36b', '#7fd8ff'][i % 3])));
    }
  }
  return { w: 40, h: 42, res: 3, shapes: out };
}

export const ART = {
  musicballerina: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [70, 220, 180], draw: ballerina },
  tindrummer: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 180], draw: drummer },
  jackbox: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 26, atkMs: [70, 240, 180], draw: jackbox },
  marionette: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [70, 220, 170], draw: marionette },
  teddystrong: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [90, 300, 220], draw: teddy },
  balloonseller: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [70, 220, 180], draw: balloonpoodle },
};

export const INFO = {
  musicballerina: { name: 'Music Box Ballerina', w: 26, h: 38 },
  tindrummer: { name: 'Tin Drummer', w: 26, h: 34 },
  jackbox: { name: 'Jack-in-the-Box', w: 26, h: 44 },
  marionette: { name: 'Marionette Dancer', w: 28, h: 34 },
  teddystrong: { name: 'Teddy Strongbear', w: 36, h: 38 },
  balloonseller: { name: 'Balloon Seller', w: 28, h: 36 },
};
