// Monster art: the Clockwork Carnival's bosses (docs/design/clockwork-carnival.md), redrawn
// creature-first and big (2026-11-03): chibi toy creatures at two and a half to three times the
// hero's height, each with one signature shape.
//   leonie       Leonie, the Lioness Acrobat, and
//   marionetta   Madame Marionette: remade 2026-11-18 (Chapter 6), rigs in carnivalbossrigs.js.
//   gearheart    Queen Gearheart, the Grand Automaton: a grand clockwork owl with a crown of gears,
//                a clock-face belly and a great key in her back; she beats her wings on the tick and
//                slams them down in a burst of gears.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { windKey } from './toy.js';
import { leonieRig, leonieStill, madameRig, madameStill } from './carnivalbossrigs.js';
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
  leonie: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 36, atkMs: [90, 160, 280, 220], draw: leonieStill, rig: leonieRig },
  marionetta: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 28, atkMs: [90, 200, 300, 220], draw: madameStill, rig: madameRig },
  gearheart: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [100, 180, 320, 240], draw: gearheart, rig: gearheartRig },
};

export const INFO = {
  leonie: { name: 'Leonie, the Lioness Acrobat', w: 60, h: 100 },
  marionetta: { name: 'Madame Marionette', w: 70, h: 100 },
  gearheart: { name: 'Queen Gearheart, the Grand Automaton', w: 70, h: 120 },
};
