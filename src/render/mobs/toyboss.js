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
import { part, makeRig, stateBlend, inPart, chainParts, smooth } from './rig.js';

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

// ---------- The Carnival's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) Live skeletons (render/mobs/rig.js). Leonie balances on a
// ball that really rolls, her tail and fez tassel swinging, and leaps off it in an arc to pounce,
// her flaming hoop flickering. Madame Marionette swings on her thread like a pendulum, working the
// bars so her two puppets dangle and kick on their strings. Queen Gearheart is clockwork: she moves
// on the tick, her clock's hands and crown of gears turning, her key spinning, her wings beating.
// Rig space: the floor under them at (0, 0).
const DG = Math.PI / 180;

// Leonie.
const LN = { fur: ramp('#ffc46a', { step: 10, turn: 14, sat: -4 }), mane: ramp('#e8823a', { step: 10, turn: 10 }) };
const lnParts = {
  ball: () => part('leonie|ball', 40, 40, () => {
    const out = [O(20, 20, 18, 18, 0, '#4f7ad8', 24), crescent(20, 20, 18, 18, '#3a5ab8', { k: 0.28 }), F(O(20, 20, 18, 5, 0, '#ffffff', 20)), F(O(20, 20, 18, 2.4, 0, '#ff6b8a', 20))];
    for (let i = 0; i < 3; i++) out.push(...star(20 + Math.cos(i * 2.09) * 11, 20 + Math.sin(i * 2.09) * 11, 3, '#ffd36b', '#fff6c8'));
    return out;
  }),
  ballShine: () => part('leonie|ballshine', 40, 40, () => [shine(20, 20, 18, 18, '#cfe0ff', 0, 1.1)]),
  hoop: () => part('leonie|hoop', 20, 38, () => {
    const out = [];
    const ring = arcPts(10, 19, 7, 16, 0, 360, 24);
    for (let i = 0; i < ring.length - 1; i++) out.push(T([ring[i], ring[i + 1], [10 + (ring[i + 1][0] - 10) * 0.8, 19 + (ring[i + 1][1] - 19) * 0.86], [10 + (ring[i][0] - 10) * 0.8, 19 + (ring[i][1] - 19) * 0.86]], '#e8b84a'));
    return out;
  }),
  leg: (back) => part(`leonie|leg|${back}`, 12, 14, () => [...limb([6, 3], [5, 11], 7, 6, back ? LN.fur.sh : LN.fur.base)]),
  torso: () => part('leonie|torso', 30, 28, () => [...blob(15, 14, 13, 12, LN.fur), F(O(18, 16, 7, 8, 0, '#fff0d0', 16))]),
  head: () => part('leonie|head', 50, 50, () => {
    const hx = 25;
    const hy = 26;
    return [...mane(hx, hy, 22, LN.mane.base, LN.mane.sh), E(hx - 9, hy - 10, 4.4, 4.4, LN.fur.sh), E(hx + 9, hy - 11, 4.4, 4.4, LN.fur.base), F(E(hx + 9, hy - 11, 2.4, 2.4, '#ffb0a0')), ...blob(hx, hy, 15, 13.4, LN.fur), F(O(hx + 5, hy + 5, 7, 5, 0, '#fff0d0', 14)), E(hx + 8, hy + 3, 2.2, 1.6, '#c0405a')];
  }),
  face: (mood, atk) => part(`leonie|face|${mood}|${atk}`, 28, 24, () => cuteFace(14, 9, 1.9, mood, { iris: '#ff9a2a', lip: '#c0405a', gap: 5, atk, skin: LN.fur.base, mouthDy: 4, lash: 1.5, wing: 1.4 })),
  fez: () => part('leonie|fez', 16, 14, () => [T([[2, 12], [3, 3], [13, 3], [14, 12]], '#e0404a'), O(8, 3, 5, 1.6, 0, '#ff6b74', 12)]),
  tuft: () => part('leonie|tuft', 12, 12, () => mane(6, 6, 4, LN.mane.base, LN.mane.sh)),
  paw: () => part('leonie|paw', 18, 10, () => [...limb([3, 5], [14, 5], 5.4, 5, LN.fur.base), E(14, 5, 3.4, 3, LN.fur.hi)]),
};
const leonieRig = makeRig({
  w: 60,
  h: 100,
  stride: 1e9,
  recover: 0.6,
  fast: ['lean', 'reach'],
  kick: { lean: -1.6, tail0: 3 },
  springs: { tail0: [90, 6], tail1: [70, 5], tail2: [55, 4], tassel: [50, 3.5], hoopY: [60, 5] },
  pose(m, a) {
    const t = a.t;
    const b = Math.sin(t * 2.2);
    const idle = { lean: Math.sin(t * 1.3) * 0.04, crouch: -b * 1.2, reach: 0, head: Math.sin(t * 1.5) * 0.05, hoopX: 30, hoopY: -54 + Math.sin(t * 1.6) * 2 };
    const walk = { lean: Math.sin(t * 7) * 0.08, crouch: -Math.abs(Math.sin(t * 7)) * 1.6, reach: 0, head: Math.sin(t * 7) * 0.05, hoopX: 32, hoopY: -54 };
    const antic = { lean: -8 * DG, crouch: 5, reach: 0, head: 0.12, hoopX: 28, hoopY: -60 };
    const strike = { lean: 24 * DG, crouch: 0, reach: 1, head: -0.1, hoopX: 34, hoopY: -64 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow: (S) => ({ tail0: (180 + 34) * DG - S.lean * 2, tail1: 34 * DG - S.lean, tail2: 34 * DG, tassel: -30 * DG - S.lean * 2 }),
  parts: [
    { name: 'ball', pivot: [20, 20], at: () => [0, -18], rot: (S, a) => (a.m?.odo ?? 0) / 18, s: () => lnParts.ball() },
    { name: 'ballShine', pivot: [20, 20], at: () => [0, -18], s: () => lnParts.ballShine() },
    // She leaps off the ball in an arc on the strike: forward, up and down onto the target.
    { name: 'lion', at: (S, a) => {
      const k = a.ph.strike;
      return [44 * k, -36 + S.crouch + 10 * k - Math.sin(k * Math.PI) * 30];
    }, rot: (S) => S.lean },
    ...chainParts('tail', { parent: 'lion', at: () => [-10, -10], key: 'leonie|tail', segs: [[6, 3.4, 3.2], [5, 3.2, 2.9], [5, 2.9, 2.6]], color: LN.fur.sh, rot: (S, a, i) => S[`tail${i}`] }),
    { name: 'tuft', parent: 'tail2', pivot: [6, 6], at: () => [5, 0], s: () => lnParts.tuft() },
    { name: 'legB', parent: 'lion', pivot: [6, 3], at: () => [-5, -8], s: () => lnParts.leg(true) },
    { name: 'legF', parent: 'lion', pivot: [6, 3], at: () => [5, -8], s: () => lnParts.leg(false) },
    { name: 'torso', parent: 'lion', pivot: [15, 14], at: () => [0, -16], s: () => lnParts.torso() },
    { name: 'head', parent: 'torso', pivot: [25, 36], at: () => [3, -12], rot: (S) => S.head, s: () => lnParts.head() },
    { name: 'face', parent: 'head', pivot: [14, 9], at: () => [2, -11], s: (a) => lnParts.face(a.face, a.atk) },
    { name: 'fez', parent: 'head', pivot: [8, 12], at: () => [0, -23], s: () => lnParts.fez() },
    ...chainParts('tas', { parent: 'fez', at: () => [0, -9], key: 'leonie|tassel', segs: [[3, 1, 1], [3, 1, 1], [2, 1, 1]], color: '#ffd36b', rot: (S, a, i) => (i ? 0.3 : S.tassel) }),
    { name: 'paw', parent: 'torso', pivot: [3, 5], at: () => [8, -6], rot: (S) => (-40 + S.reach * 60) * DG, s: () => lnParts.paw() },
    { name: 'hoop', pivot: [10, 19], at: (S) => [S.hoopX, S.hoopY], s: () => lnParts.hoop() },
  ],
  fx(ctx, m, a, S, mat) {
    // Flames licking round the hoop.
    inPart(ctx, mat, 'hoop', () => {
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * TAU + a.t * 2;
        const x = Math.cos(ang) * 8.4;
        const y = Math.sin(ang) * 17.4;
        const h = 4 + Math.sin(ang * 3 + a.t * 9) * 1.6;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = '#ff8a3a';
        ctx.beginPath();
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x + Math.cos(ang) * h, y + Math.sin(ang) * h - 1);
        ctx.lineTo(x + 2, y);
        ctx.fill();
        ctx.fillStyle = '#ffe36b';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    });
  },
});
// (The rig reads the monster for the ball's roll.)
const leonieDraw = leonieRig.draw;
leonieRig.draw = (ctx, m, a) => leonieDraw(ctx, m, { ...a, m });

// Madame Marionette.
const MN = { velvet: ramp('#7a4ab0', { step: 10, turn: 12 }), skin: ramp('#f4ecff', { step: 8 }), lace: '#fff8fc' };
const mrParts = {
  abdomen: () => part('marion|abdomen', 36, 32, () => {
    const out = [...blob(18, 16, 16, 14, MN.velvet)];
    for (const [x, y] of [[-4, -4], [2, 4], [-6, 6]]) out.push(F(E(18 + x, 16 + y, 1.6, 1.6, MN.lace)));
    out.push(F(T([[16, 12], [20, 8], [24, 12], [20, 18]], '#ff9ac8')));
    return out;
  }),
  head: () => part('marion|head', 40, 44, () => {
    const hx = 20;
    const hy = 26;
    const out = [...blob(hx, hy, 15, 14, MN.skin)];
    for (let i = 0; i < 8; i++) out.push(F(E(hx - 12 + i * 3.6, hy + 13, 2.2, 1.6, MN.lace)));
    for (const sx of [-1, 1]) out.push(T([[hx - 2, hy - 13], [hx - 2 + sx * 12, hy - 20], [hx - 2 + sx * 11, hy - 8]], '#e0407a'), F(T([[hx - 2, hy - 13], [hx - 2 + sx * 9, hy - 17], [hx - 2 + sx * 8, hy - 11]], '#ff6b9a')));
    out.push(E(hx - 2, hy - 13, 3, 3, '#ff8ab0'), F(E(hx + 1, hy - 8, 1.4, 1.4, '#ffd36b')));
    return out;
  }),
  face: (mood, atk) => part(`marion|face|${mood}|${atk}`, 28, 22, () => cuteFace(14, 9, 1.9, mood, { iris: '#c03a8a', lip: '#a02a6a', gap: 5.4, atk, skin: MN.skin.base, mouthDy: 4, lash: 1.6, wing: 1.8 })),
  bar: () => part('marion|bar', 22, 6, () => [...limb([3, 3], [19, 3], 2, 2, '#a87a4a')]),
  doll: (k) => part(`marion|doll|${k}`, 12, 18, () => [R(3, 7, 6, 7, k ? '#ff9ac8' : '#9fd8ff'), E(6, 4, 3.6, 3.4, '#f4dcc0'), F(E(7, 3.6, 0.6, 0.8, '#3a2a3a')), F(E(4.8, 3.6, 0.5, 0.7, '#3a2a3a')), E(6, 1, 3.6, 1.6, k ? '#e0407a' : '#4f7ad8')]),
  dollLeg: (k) => part(`marion|dleg|${k}`, 8, 12, () => [...limb([4, 2], [4, 9], 2, 1.8, k ? '#e8b888' : '#d8a878')]),
};
const legShape = (c) => (i, len, w0, w1, x0, y0) => [...limb([x0, y0], [x0 + len, y0], w0, w1, c), ...(i === 2 ? [E(x0 + len, y0, 1.8, 1.8, MN.lace)] : [])];
const BACK_LEGS = [[-150, 0], [-170, 0.3], [160, 0.6], [140, 0.9]];
const marionRig = makeRig({
  w: 70,
  h: 100,
  stride: 1e9,
  fast: ['bars', 'drop'],
  kick: { swing: 2, p0: 3, p1: -3 },
  springs: { swing: [14, 1.6], p0: [30, 2], p1: [26, 1.8], kick: [200, 10] },
  pose(m, a) {
    const t = a.t;
    // (She moves in little marionette ticks.)
    const tk = (q, n = 8) => {
      const sv = q * n;
      const i = Math.floor(sv);
      return (i + Math.min(1, (sv - i) * 2.4) ** 0.6) / n;
    };
    const tq = tk((t * 0.25) % 1);
    const idle = { bars: Math.sin(tq * TAU * 2) * 8 * DG, drop: Math.sin(t * 1.6) * 2, legs: Math.sin(t * 2) * 8 * DG, kick: Math.sin(tq * TAU * 4) * 0.6, swingGoal: Math.sin(t * 0.8) * 0.06 };
    const antic = { bars: -14 * DG, drop: -8, legs: -12 * DG, kick: -0.5, swingGoal: -0.08 };
    const strike = { bars: 20 * DG, drop: 8, legs: 12 * DG, kick: 1.2, swingGoal: 0.06 };
    return stateBlend(a, idle, idle, antic, strike);
  },
  follow: (S) => ({ swing: S.swingGoal, p0: -S.swingGoal * 2 + S.bars * 0.6, p1: -S.swingGoal * 2 - S.bars * 0.6 }),
  parts: [
    // Hung from her thread far above: the whole of her swings from there.
    { name: 'top', at: () => [0, -150], rot: (S) => S.swing },
    { name: 'hang', parent: 'top', at: (S) => [0, 86 + S.drop] },
    ...BACK_LEGS.flatMap(([deg, off], i) => chainParts(`leg${i}`, { parent: 'hang', at: () => [-6, 2], key: `marion|leg|${i % 2}`, segs: [[10, 4.4, 3.4], [9, 3.4, 2.6], [7, 2.6, 2.2]], shape: legShape(i % 2 ? MN.velvet.base : MN.velvet.sh), rot: (S, a, k) => (k ? -36 * DG - Math.sin(a.t * 2 + off) * 8 * DG : deg * DG + S.legs) })),
    { name: 'abdomen', parent: 'hang', pivot: [18, 16], at: () => [-10, 8], s: () => mrParts.abdomen() },
    { name: 'head', parent: 'hang', pivot: [20, 26], at: () => [10, -4], s: () => mrParts.head() },
    { name: 'face', parent: 'head', pivot: [14, 9], at: () => [2, 0], s: (a) => mrParts.face(a.face, a.atk) },
    ...[0, 1].flatMap((k) => {
      const sd = k ? 1 : -1;
      return [
        ...chainParts(`fl${k}`, { parent: 'hang', at: () => [4 + k * 6, 6], key: 'marion|fl', segs: [[9, 4, 3.2], [9, 3.2, 2.4]], color: MN.velvet.base, rot: (S, a, i) => (i ? -30 * sd * DG : (60 - sd * 20) * DG) }),
        { name: `bar${k}`, parent: `fl${k}1`, pivot: [11, 3], at: () => [9, 0], rot: (S) => -((60 - sd * 20) - 30 * sd) * DG - S.swing + S.bars * sd, s: () => mrParts.bar() },
        // The puppet hangs on its strings from the bar, swinging on its own.
        { name: `pup${k}`, parent: `bar${k}`, at: () => [0, 0], rot: (S) => -S.bars * sd + S[`p${k}`] },
        { name: `doll${k}`, parent: `pup${k}`, pivot: [6, 0], at: () => [k ? 4 : -3, 24], s: () => mrParts.doll(k) },
        { name: `dl${k}a`, parent: `doll${k}`, pivot: [4, 2], at: () => [-1, 14], rot: (S) => -S.kick * 0.5 * sd, s: () => mrParts.dollLeg(k) },
        { name: `dl${k}b`, parent: `doll${k}`, pivot: [4, 2], at: () => [1, 14], rot: (S) => -S.kick * 0.9, s: () => mrParts.dollLeg(k) },
      ];
    }),
  ],
  under(ctx, m, a, S, mat) {
    // Her silk thread, from far above down to her.
    const [A, B, C, D, E, F] = mat('hang');
    ctx.globalAlpha = a.alpha * 0.9;
    ctx.strokeStyle = '#f6f0ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mat('top')[4], mat('top')[5]);
    ctx.lineTo(E, F - 20);
    ctx.stroke();
  },
  fx(ctx, m, a, S, mat) {
    // The puppets' strings, from each end of a bar to the doll's head and hands.
    ctx.globalAlpha = a.alpha * 0.8;
    ctx.strokeStyle = '#f6f0ff';
    ctx.lineWidth = 0.6;
    for (const k of [0, 1]) {
      const bar = mat(`bar${k}`);
      const doll = mat(`doll${k}`);
      const at = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
      for (const [bx, dx, dy] of [[-8, -3, 1], [8, 3, 1], [-8, -4, 9], [8, 4, 9]]) {
        const p = at(bar, bx, 0);
        const q = at(doll, dx, dy);
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(q[0], q[1]);
        ctx.stroke();
      }
    }
  },
});

// Queen Gearheart.
const GH = { brass: ramp('#e8b84a', { step: 10, turn: 10 }), teal: ramp('#5ac8b8', { step: 10, turn: 12 }), cream: ramp('#fff4dc', { step: 8 }) };
const tickOf = (t, n = 8) => {
  const sv = t * n;
  const i = Math.floor(sv);
  return (i + Math.min(1, (sv - i) * 2.4) ** 0.6) / n;
};
const ghParts = {
  foot: () => part('gear|foot', 14, 18, () => [...limb([7, 2], [7, 14], 4, 3.4, GH.brass.sh), ...[-3, 0, 3].map((d) => E(7 + d + 1, 15.4, 1.8, 1.2, GH.brass.base))]),
  key: (i) => part(`gear|key|${i}`, 20, 16, () => windKey(16, 8, i / 16, 3)),
  wing: (sd) => part(`gear|wing|${sd}`, 22, 46, () => {
    const wx = sd < 0 ? 20 : 2;
    const wy = 14;
    const out = [T([[wx, wy - 12], [wx + sd * 16, wy - 2], [wx + sd * 18, wy + 20], [wx + sd * 8, wy + 30], [wx, wy + 24]], sd < 0 ? GH.teal.sh : GH.teal.base)];
    for (let i = 0; i < 3; i++) out.push(F(T([[wx, wy - 6 + i * 9], [wx + sd * (16 - i * 2), wy + i * 9], [wx + sd * (16 - i * 2), wy + 2 + i * 9], [wx, wy - 4 + i * 9]], GH.brass.base)));
    return out;
  }),
  body: () => part('gear|body', 60, 64, () => {
    const cx = 30;
    const cy = 34;
    const out = [...blob(cx, cy, 28, 30, GH.teal), O(cx + 2, cy + 8, 16, 16, 0, GH.brass.base, 24), O(cx + 2, cy + 8, 14, 14, 0, GH.cream.base, 24)];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * TAU;
      out.push(F(E(cx + 2 + Math.cos(ang) * 11.4, cy + 8 + Math.sin(ang) * 11.4, i % 3 ? 0.7 : 1.3, i % 3 ? 0.7 : 1.3, '#5a4a3a')));
    }
    // Ear tufts and the face disc.
    const fx = cx + 4;
    const fy = cy - 20;
    out.push(T([[fx - 20, fy - 10], [fx - 26, fy - 26], [fx - 12, fy - 16]], GH.teal.sh), T([[fx + 18, fy - 12], [fx + 24, fy - 28], [fx + 10, fy - 18]], GH.teal.base));
    out.push(O(fx, fy, 22, 17, 0, GH.cream.base, 24), crescent(fx, fy, 22, 17, GH.cream.sh, { k: 0.3, a0: 60, a1: 200 }));
    out.push(T([[fx + 2, fy + 4], [fx + 7, fy + 6], [fx + 3, fy + 11]], '#ffb040'), F(T([[fx + 2, fy + 4], [fx + 7, fy + 6], [fx + 4, fy + 6.6]], '#ffd080')));
    return out;
  }),
  face: (mood, atk) => part(`gear|face|${mood}|${atk}`, 34, 22, () => cuteFace(17, 9, 2.4, mood, { iris: '#2ab0a0', lip: '#a05a3a', gap: 6, atk, skin: GH.cream.base, mouthDy: null, lash: 1.8, wing: 1.8 })),
  gear: (r) => part(`gear|cog|${r}`, r * 2 + 4, r * 2 + 4, () => gear(r + 2, r + 2, r, 0, GH.brass.base)),
};
const gearheartRig = makeRig({
  w: 70,
  h: 120,
  stride: 40,
  fast: ['wings', 'lift'],
  kick: { lean: -1.4, wings: 2 },
  springs: { lean: [300, 26] },
  pose(m, a) {
    const t = a.t;
    // Everything on the tick: a stepped clock, eased into each step.
    const tq = tickOf((t * 0.25) % 1);
    const tock = Math.sin(tq * TAU * 2);
    const s = Math.sin(a.wp);
    const idle = { lean: tock * 0.05, lift: Math.abs(tock) * 1.2, wings: Math.sin(t * 1.2) * 4 * DG, footF: 0, footB: 0 };
    const walk = { lean: s * 0.08, lift: Math.abs(s) * 2, wings: s * 10 * DG, footF: Math.max(0, s) * 4, footB: Math.max(0, -s) * 4 };
    const antic = { lean: -0.06, lift: 6, wings: -70 * DG, footF: 0, footB: 0 };
    const strike = { lean: 0.08, lift: -5, wings: 55 * DG, footF: 0, footB: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'footB', pivot: [7, 2], at: (S) => [-10, -8 - S.footB], s: () => ghParts.foot() },
    { name: 'footF', pivot: [7, 2], at: (S) => [10, -8 - S.footF], s: () => ghParts.foot() },
    { name: 'root', at: (S) => [0, -10 - S.lift], rot: (S) => S.lean },
    { name: 'key', parent: 'root', pivot: [16, 8], at: () => [-30, -32], s: (a) => ghParts.key(Math.floor(tickOf((a.t * 0.5) % 1, 16) * 16) % 16) },
    { name: 'wingB', parent: 'root', pivot: [20, 2], at: () => [-24, -40], rot: (S) => S.wings, s: () => ghParts.wing(-1) },
    { name: 'body', parent: 'root', pivot: [30, 62], at: () => [0, 0], s: () => ghParts.body() },
    { name: 'face', parent: 'body', pivot: [17, 9], at: () => [4, -50], s: (a) => ghParts.face(a.face, a.atk) },
    ...[[-12, -18, 6, 1], [0, -24, 8, -1], [12, -18, 6, 1]].map(([dx, dy, r, dir], i) => ({ name: `cog${i}`, parent: 'body', pivot: [r + 2, r + 2], at: () => [4 + dx, -48 + dy], rot: (S, a) => tickOf((a.t * 0.25) % 1) * TAU * 2 * dir, s: () => ghParts.gear(r) })),
    { name: 'wingF', parent: 'root', pivot: [2, 2], at: () => [24, -40], rot: (S) => -S.wings, s: () => ghParts.wing(1) },
  ],
  fx(ctx, m, a, S, mat) {
    // The clock's hands telling the tick, and the jewel in her crown.
    inPart(ctx, mat, 'body', () => {
      const cx = 2;
      const cy = -20;
      const tq = tickOf((a.t * 0.25) % 1);
      ctx.globalAlpha = a.alpha;
      ctx.strokeStyle = '#3a3050';
      ctx.lineCap = 'round';
      for (const [len, ang, w] of [[9, tq * TAU * 2 - Math.PI / 2, 1.4], [6, a.t * 0.06 - Math.PI / 2, 2]]) {
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.stroke();
      }
      ctx.fillStyle = '#e8b84a';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.6, 0, TAU);
      ctx.fill();
    });
    // The slam's burst of little gears.
    if (a.ph.since >= 0 && a.ph.since < 0.6) {
      const u = a.ph.since / 0.6;
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.translate(40 + u * (10 + i * 8), -40 + i * 8 - Math.sin(u * Math.PI) * 14);
        ctx.rotate(u * 8 + i);
        ctx.globalAlpha = a.alpha * (1 - u);
        ctx.drawImage(ghParts.gear(i % 2 ? 4 : 3).canvas, -6 - 6, -6 - 6, 24, 24);
        ctx.restore();
      }
    }
  },
});

export const ART = {
  leonie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 36, atkMs: [90, 160, 280, 220], draw: leonie, rig: leonieRig },
  marionetta: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [90, 200, 300, 220], draw: marionetta, rig: marionRig },
  gearheart: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 240], draw: gearheart, rig: gearheartRig },
};

export const INFO = {
  leonie: { name: 'Leonie, the Lioness Acrobat', w: 60, h: 100 },
  marionetta: { name: 'Madame Marionette', w: 70, h: 100 },
  gearheart: { name: 'Queen Gearheart, the Grand Automaton', w: 70, h: 120 },
};
