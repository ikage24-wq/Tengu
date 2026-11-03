// Monster art: the Clockwork Carnival's bosses (docs/design/clockwork-carnival.md), redrawn
// creature-first and big (2026-11-03): chibi toy creatures at two and a half to three times the
// hero's height, each with one signature shape.
//   leonie       Leonie, the Lioness Acrobat: a chubby lion with a round puffy mane and a fez,
//                balancing on a star-print circus ball with a flaming hoop; she leaps through the
//                hoop and pounces.
//   marionetta   Madame Marionette: a velvet spider puppeteer with a big bow and a lace collar,
//                hanging on her thread, working two control bars with little puppets dancing below;
//                she yanks the strings and the puppets lunge.
//   gearheart    Queen Gearheart, the Grand Automaton: a grand clockwork owl with a crown of gears,
//                a clock-face belly and a great key in her back; she beats her wings on the tick and
//                slams them down in a burst of gears.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { windKey } from './toy.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);
const tick = (q, n = 8) => {
  const s = q * n;
  const i = Math.floor(s);
  return (i + Math.min(1, (s - i) * 2.4) ** 0.6) / n;
};

// A gear: a toothed ring with a hub, turned by deg.
function gear(x, y, r, deg, c, hub = '#fff4d0') {
  const pts = [];
  const n = Math.max(6, Math.round(r * 1.2));
  for (let i = 0; i < n * 2; i++) {
    const a = ((i / (n * 2)) * 360 + deg) * D2R;
    const rr = i % 2 ? r : r * 0.78;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr], [x + Math.cos(a + Math.PI / (n * 2)) * rr, y + Math.sin(a + Math.PI / (n * 2)) * rr]);
  }
  return [T(pts, c), F(E(x, y, r * 0.42, r * 0.42, hub)), F(E(x, y, r * 0.16, r * 0.16, c))];
}

// A round puffy mane: a ring of soft lobes (never spikes).
function mane(x, y, r, c, cDk) {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    out.push(E(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.78, r * 0.36, r * 0.34, i % 2 ? c : cDk));
  }
  out.push(E(x, y, r * 0.86, r * 0.82, c));
  return out;
}

// ---------- Leonie, the Lioness Acrobat ----------

// Attack keys: body offset from the ball, the hoop's place, paws reaching, pounce impact.
const LION_ATK = [
  { body: [-6, 6], hoop: [28, -6], crouch: 1 },
  { body: [26, -26], hoop: [34, -20], leap: 1 },
  { body: [44, 10], hoop: [30, -10], pounce: 1, hit: 1 },
  { body: [40, 12], hoop: [28, -8], pounce: 0.7 },
  { body: [10, 2], hoop: [26, -4] },
];

function leonie(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? LION_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#ffc46a', { step: 10, turn: 14, sat: -4 });
  const maneC = ramp('#e8823a', { step: 10, turn: 10 });
  const out = [];
  // The circus ball: rolls as she walks (its stars turning), still in the air when she leaps.
  const roll = (walk ? q : 0) * 360;
  const bx = 34;
  const by = 92;
  const ball = [O(bx, by, 18, 18, 0, '#4f7ad8', 24), crescent(bx, by, 18, 18, '#3a5ab8', { k: 0.28 }), F(O(bx, by, 18, 5, roll * 0.2, '#ffffff', 20)), F(O(bx, by, 18, 2.4, roll * 0.2, '#ff6b8a', 20)), shine(bx, by, 18, 18, '#cfe0ff', 0, 1.1)];
  for (let i = 0; i < 3; i++) {
    const a = (roll + i * 120) * D2R;
    ball.push(...star(bx + Math.cos(a) * 11, by + Math.sin(a) * 11, 3, '#ffd36b', '#fff6c8'));
  }
  out.push(...ball);
  // Leonie: a chubby lion upright on the ball (or flying off it), tail curling.
  const off = A ? A.body : [walk ? Math.sin(TAU * q * 2) * 2 : sway(q) * 1.5, -(pose === 'idle' ? breath(q) : 0) * 1.2];
  const lx = bx + off[0];
  const ly = by - 18 + off[1] + (dead ? 18 : 0);
  const lean = dead ? 84 : A ? (A.leap ? 30 : A.pounce ? 20 : A.crouch ? -8 : 0) : walk ? Math.sin(TAU * q * 2) * 6 : 0;
  const body = [];
  const crouch = A?.crouch ? 4 : 0;
  // Tail: a long curl with a tufted round end.
  const tl = chain(lx - 10, ly - 10, 180, [6, 5, 5, 4], dead ? () => 10 : (i) => (i ? 34 : 0) + Math.sin(TAU * q * 2 - i) * 8);
  body.push(strand(tl, (t) => 3.4 * (1 - t * 0.3), fur.sh), ...mane(tl.at(-1)[0], tl.at(-1)[1], 4, maneC.base, maneC.sh));
  // Legs on the ball, paws out.
  body.push(...limb([lx - 5, ly - 8], [lx - 6, ly + crouch * 0.2], 7, 6, fur.sh), ...limb([lx + 5, ly - 8], [lx + 6, ly + crouch * 0.2], 7, 6, fur.base));
  body.push(...blob(lx, ly - 16 + crouch, 13, 12, fur), F(O(lx + 3, ly - 14 + crouch, 7, 8, 0, '#fff0d0', 16)));
  // Head with its round mane, a fez with a tassel.
  const hx = lx + 3;
  const hy = ly - 38 + crouch;
  body.push(...mane(hx, hy, 22, maneC.base, maneC.sh));
  body.push(E(hx - 9, hy - 10, 4.4, 4.4, fur.sh), E(hx + 9, hy - 11, 4.4, 4.4, fur.base), F(E(hx + 9, hy - 11, 2.4, 2.4, '#ffb0a0')));
  body.push(...blob(hx, hy, 15, 13.4, fur), F(O(hx + 5, hy + 5, 7, 5, 0, '#fff0d0', 14)), E(hx + 8, hy + 3, 2.2, 1.6, '#c0405a'));
  body.push(...cuteFace(hx + 2, hy - 1, 1.9, mood, { iris: '#ff9a2a', lip: '#c0405a', gap: 5, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: 4, lash: 1.5, wing: 1.4 }));
  body.push(T([[hx - 6, hy - 13], [hx - 5, hy - 22], [hx + 5, hy - 22], [hx + 6, hy - 13]], '#e0404a'), O(hx, hy - 22, 5, 1.6, 0, '#ff6b74', 12));
  const ts = chain(hx, hy - 22, -30, [3, 3, 2], wave(TAU * q * 2, 20, 0.8));
  body.push(strand(ts, 0.9, '#ffd36b'), E(ts.at(-1)[0], ts.at(-1)[1] + 1, 1.4, 2, '#ffd36b'));
  // Front paws: up in a ta-da at rest, reaching out on the pounce.
  const reach = A?.pounce || A?.leap ? [16, 6] : [8, -6];
  body.push(...limb([lx + 8, ly - 22 + crouch], [lx + 8 + reach[0], ly - 22 + reach[1] + crouch], 5.4, 5, fur.base), E(lx + 8 + reach[0], ly - 22 + reach[1] + crouch, 3.4, 3, fur.hi));
  out.push(...spin(body, lx, ly, lean));
  // The flaming hoop: a gold ring with fire licking round it.
  const hp = A ? [bx + A.hoop[0], by - 40 + A.hoop[1]] : [bx + 30, by - 36 + Math.sin(TAU * q) * 2];
  const ring = arcPts(hp[0], hp[1], 7, 16, 0, 360, 24);
  for (let i = 0; i < ring.length - 1; i++) out.push(F(T([ring[i], ring[i + 1], [hp[0] + (ring[i + 1][0] - hp[0]) * 0.8, hp[1] + (ring[i + 1][1] - hp[1]) * 0.86], [hp[0] + (ring[i][0] - hp[0]) * 0.8, hp[1] + (ring[i][1] - hp[1]) * 0.86]], '#e8b84a')));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + q * TAU;
    const fx = hp[0] + Math.cos(a) * 8.4;
    const fy = hp[1] + Math.sin(a) * 17.4;
    const h = 4 + Math.sin(a * 3 + q * TAU * 3) * 1.4;
    out.push(F(T([[fx - 2, fy], [fx + Math.cos(a) * h, fy + Math.sin(a) * h - 1], [fx + 2, fy]], '#ff8a3a')), F(E(fx, fy, 1.2, 1.2, '#ffe36b')));
  }
  if (A?.leap) out.push(smear([[bx - 10, by - 30], [bx + 10, by - 50], [lx + 20, ly - 34]], 10, '#fff0d0'));
  if (A?.hit) out.push(...star(lx + 26, by + 8, 7, '#fff6a8'), ...star(lx + 12, by + 14, 4, '#ffffff'));
  return { w: 104, h: 112, res: 3, shapes: out };
}

// ---------- Madame Marionette ----------

const SPIDER_ATK = [
  { bars: -10, drop: -8, kick: -0.5 },
  { bars: 16, drop: 6, kick: 1, smear: 1 },
  { bars: 20, drop: 8, kick: 1.2, hit: 1 },
  { bars: 18, drop: 7, kick: 1 },
  { bars: 4, drop: 2, kick: 0.2 },
];

function marionetta(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SPIDER_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const velvet = ramp('#7a4ab0', { step: 10, turn: 12 });
  const skin = ramp('#f4ecff', { step: 8 });
  const lace = '#fff8fc';
  const tq = tick(q);
  const sw = walk ? Math.sin(TAU * q * 2) * 4 : sway(q) * 3;
  const cx = 58 + sw;
  const cy = (dead ? 96 : 40) + (A ? A.drop : 0) + (pose === 'idle' ? breath(q) * 2 : 0);
  const out = [];
  // Her silk thread from above.
  if (!dead) out.push(F(T([[cx - 0.5, -4], [cx + 0.5, -4], [cx + 0.5, cy - 20], [cx - 0.5, cy - 20]], '#f6f0ff')));
  // Eight legs: the back four curled up behind, the front four working the control bars.
  const legC = (i) => (i % 2 ? velvet.base : velvet.sh);
  [[-150, 0], [-170, 0.3], [160, 0.6], [140, 0.9]].forEach(([a, ph], i) => {
    const j = chain(cx - 6, cy + 2, a, [10, 9, 7], (k) => (k ? -36 - Math.sin(TAU * q + ph) * 8 : 0));
    out.push(strand(j, (t) => 4.4 * (1 - t * 0.5), legC(i)), E(j.at(-1)[0], j.at(-1)[1], 1.8, 1.8, lace));
  });
  // The abdomen: a big velvet round with a lace heart pattern.
  out.push(...blob(cx - 10, cy + 8, 16, 14, velvet));
  for (const [x, y] of [[-14, 4], [-8, 12], [-16, 14]]) out.push(F(E(cx + x, cy + y, 1.6, 1.6, lace)));
  out.push(F(T([[cx - 12, cy + 4], [cx - 8, cy], [cx - 4, cy + 4], [cx - 8, cy + 10]], '#ff9ac8')));
  // The head: big, pale, a lace collar, a huge bow, the face.
  const hx = cx + 10;
  const hy = cy - 4;
  out.push(...blob(hx, hy, 15, 14, skin));
  for (let i = 0; i < 8; i++) out.push(F(E(hx - 12 + i * 3.6, hy + 13, 2.2, 1.6, lace)));
  out.push(...cuteFace(hx + 2, hy, 1.9, mood, { iris: '#c03a8a', lip: '#a02a6a', gap: 5.4, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: skin.base, mouthDy: 4, lash: 1.6, wing: 1.8 }));
  for (const sx of [-1, 1]) out.push(T([[hx - 2, hy - 13], [hx - 2 + sx * 12, hy - 20], [hx - 2 + sx * 11, hy - 8]], '#e0407a'), F(T([[hx - 2, hy - 13], [hx - 2 + sx * 9, hy - 17], [hx - 2 + sx * 8, hy - 11]], '#ff6b9a')));
  out.push(E(hx - 2, hy - 13, 3, 3, '#ff8ab0'));
  // Six little eyes? No: two big ones (the face); a dot of jewel on her brow instead.
  out.push(F(E(hx + 1, hy - 8, 1.4, 1.4, '#ffd36b')));
  // Front legs and the two control bars, the strings and the puppets dancing under them.
  const barA = A ? A.bars : walk ? Math.sin(tq * TAU * 2) * 12 : sway(q) * 6;
  const kick = A ? A.kick : walk ? Math.sin(tq * TAU * 2) : 0;
  [[-1, cx + 4, 0], [1, cx + 28, 1]].forEach(([s, bxx, k]) => {
    const by2 = cy + 22 + (k ? 4 : 0);
    const leg = chain(cx + 4 + k * 6, cy + 6, 60 - s * 20, [9, 9], () => -30 * s);
    out.push(strand(leg, (t) => 4 * (1 - t * 0.4), velvet.base));
    const end = leg.at(-1);
    const a = (barA * s) * D2R;
    const p1 = [end[0] - Math.cos(a) * 8, end[1] - Math.sin(a) * 8];
    const p2 = [end[0] + Math.cos(a) * 8, end[1] + Math.sin(a) * 8];
    out.push(...limb(p1, p2, 2, 2, '#a87a4a'));
    // The puppet: a little wooden doll on four strings, kicking.
    const px = end[0] + (k ? 6 : -4);
    const py = by2 + 28 + (A ? A.drop * 0.6 : 0);
    for (const [sx2, tx, ty] of [[p1, px - 3, py - 12], [p2, px + 3, py - 12], [p1, px - 4, py - 4], [p2, px + 4, py - 2]]) out.push(F(T([[sx2[0] - 0.2, sx2[1]], [sx2[0] + 0.2, sx2[1]], [tx + 0.2, ty], [tx - 0.2, ty]], '#f6f0ff')));
    const doll = [];
    doll.push(...limb([px - 1, py - 4], [px - 3 - kick * 4 * (k ? 1 : -1), py + 4], 2, 1.8, '#d8a878'), ...limb([px + 1, py - 4], [px + 3 + kick * 6, py + 3 - Math.max(0, kick) * 3], 2, 1.8, '#e8b888'));
    doll.push(R(px - 3, py - 10, 6, 7, k ? '#ff9ac8' : '#9fd8ff'), E(px, py - 13, 3.6, 3.4, '#f4dcc0'), F(E(px + 1, py - 13.4, 0.6, 0.8, '#3a2a3a')), F(E(px - 1.2, py - 13.4, 0.5, 0.7, '#3a2a3a')), E(px, py - 16, 3.6, 1.6, k ? '#e0407a' : '#4f7ad8'));
    out.push(...spin(doll, px, py - 8, kick * 10));
  });
  if (A?.smear) out.push(smear([[cx + 10, cy + 40], [cx + 30, cy + 50], [cx + 50, cy + 48]], 8, '#f0e6ff'));
  if (A?.hit) out.push(...star(cx + 48, cy + 50, 6, '#fff6a8'));
  return { w: 116, h: 120, res: 3, shapes: dead ? spin(out, cx, 110, 0) : out };
}

// ---------- Queen Gearheart, the Grand Automaton ----------

const OWL_ATK = [
  { wings: -70, lift: 6, gears: 0 },
  { wings: 40, lift: -4, gears: 0.5, smear: 1 },
  { wings: 60, lift: -6, gears: 1.2, hit: 1 },
  { wings: 50, lift: -4, gears: 1 },
  { wings: 0, lift: 0, gears: 0 },
];

function gearheart(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? OWL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const tq = tick(q);
  const brass = ramp('#e8b84a', { step: 10, turn: 10 });
  const teal = ramp('#5ac8b8', { step: 10, turn: 12 });
  const cream = ramp('#fff4dc', { step: 8 });
  const step = walk ? Math.sin(tq * TAU * 2) : 0;
  const lift = A ? A.lift : walk ? Math.abs(step) * 2 : breath(q) * 1.2;
  const cx = 56;
  const cy = (dead ? 96 : 86) - lift;
  const lean = dead ? 80 : walk ? step * 4 : 0;
  const out = [];
  // Feet: brass talons, stepping on the tick.
  for (const [ox, s] of [[-10, step], [10, -step]]) out.push(...limb([cx + ox, cy + 30], [cx + ox + Math.max(0, s) * 4, 122 - Math.max(0, s) * 4], 4, 3.4, brass.sh), ...[-3, 0, 3].map((d) => E(cx + ox + d + Math.max(0, s) * 4 + 1, 123.4 - Math.max(0, s) * 4, 1.8, 1.2, brass.base)));
  const body = [];
  // The great key in her back, turning.
  body.push(...windKey(cx - 30, cy - 4, q, 3));
  // Wings at her sides: teal panels with brass ribs, raised on the wind-up, beating down on the slam.
  const wa = A ? A.wings : walk ? Math.sin(tq * TAU * 2) * 10 : Math.sin(q * TAU) * 4;
  for (const s of [-1, 1]) {
    const wing = [];
    const wx = cx + s * 24;
    const wy = cy - 6;
    wing.push(T([[wx, wy - 14], [wx + s * 16, wy - 4], [wx + s * 18, wy + 18], [wx + s * 8, wy + 28], [wx, wy + 22]], s < 0 ? teal.sh : teal.base));
    for (let i = 0; i < 3; i++) wing.push(F(T([[wx, wy - 8 + i * 9], [wx + s * (16 - i * 2), wy - 2 + i * 9], [wx + s * (16 - i * 2), wy + i * 9], [wx, wy - 6 + i * 9]], brass.base)));
    body.push(...spin(wing, wx, wy - 12, s * -wa));
  }
  // The body: a big round owl, a clock face on her belly with hands telling the tick.
  body.push(...blob(cx, cy, 28, 30, teal));
  body.push(O(cx + 2, cy + 8, 16, 16, 0, brass.base, 24), O(cx + 2, cy + 8, 14, 14, 0, cream.base, 24));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    body.push(F(E(cx + 2 + Math.cos(a) * 11.4, cy + 8 + Math.sin(a) * 11.4, i % 3 ? 0.7 : 1.3, i % 3 ? 0.7 : 1.3, '#5a4a3a')));
  }
  const hand = (len, ang, w) => limb([cx + 2, cy + 8], [cx + 2 + Math.cos(ang) * len, cy + 8 + Math.sin(ang) * len], w, w * 0.6, '#3a3050');
  body.push(...hand(9, tq * TAU * 2 - Math.PI / 2, 1.4), ...hand(6, q * TAU * 0.25 - Math.PI / 2, 2), E(cx + 2, cy + 8, 1.6, 1.6, brass.base));
  // The face: a round owl face disc, big cute eyes, a little beak; tufted ears.
  const fx = cx + 4;
  const fy = cy - 20;
  body.push(T([[fx - 20, fy - 10], [fx - 26, fy - 26], [fx - 12, fy - 16]], teal.sh), T([[fx + 18, fy - 12], [fx + 24, fy - 28], [fx + 10, fy - 18]], teal.base));
  body.push(O(fx, fy, 22, 17, 0, cream.base, 24), crescent(fx, fy, 22, 17, cream.sh, { k: 0.3, a0: 60, a1: 200 }));
  body.push(...cuteFace(fx, fy - 2, 2.4, mood, { iris: '#2ab0a0', lip: '#a05a3a', gap: 6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: cream.base, mouthDy: null, lash: 1.8, wing: 1.8 }));
  body.push(T([[fx + 2, fy + 4], [fx + 7, fy + 6], [fx + 3, fy + 11]], '#ffb040'), F(T([[fx + 2, fy + 4], [fx + 7, fy + 6], [fx + 4, fy + 6.6]], '#ffd080')));
  // The crown of gears, turning on the tick.
  for (const [dx, dy, r, dir] of [[-12, -18, 6, 1], [0, -24, 8, -1], [12, -18, 6, 1]]) body.push(...gear(fx + dx, fy + dy, r, tq * 360 * dir, brass.base));
  body.push(F(E(fx, fy - 24, 2.4, 2.4, '#ff6b9a')));
  out.push(...spin(body, cx, cy + 28, lean));
  // The slam: wings beat down and a burst of little gears flies out in front.
  if (A?.smear) out.push(smear([[cx + 20, cy - 40], [cx + 44, cy - 8], [cx + 46, cy + 30]], 10, '#e6fff8'));
  if (A?.gears) for (let i = 0; i < 4; i++) out.push(...gear(cx + 40 + A.gears * (8 + i * 6), cy + 20 - i * 10 + A.gears * 4, 3 + (i % 2), tq * 720 + i * 40, i % 2 ? brass.base : '#c8c8d8'));
  if (A?.hit) out.push(...star(cx + 54, cy + 40, 7, '#fff6a8'));
  return { w: 116, h: 126, res: 3, shapes: out };
}

export const ART = {
  leonie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 36, atkMs: [90, 160, 280, 220], draw: leonie },
  marionetta: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [90, 200, 300, 220], draw: marionetta },
  gearheart: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 240], draw: gearheart },
};

export const INFO = {
  leonie: { name: 'Leonie, the Lioness Acrobat', w: 60, h: 100 },
  marionetta: { name: 'Madame Marionette', w: 70, h: 100 },
  gearheart: { name: 'Queen Gearheart, the Grand Automaton', w: 70, h: 120 },
};
