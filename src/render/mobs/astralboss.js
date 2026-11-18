// Monster art: the Star Observatory's bosses (docs/design/star-observatory.md), redrawn
// creature-first and big (2026-11-03): chibi at two and a half to three times the hero's height,
// each with one signature shape.
//   folio, eclipsesol, eclipseluna: Folio the snowy-owl archivist and the Eclipse Twins, remade
//               2026-11-18 for Chapter 7 as live rigs in starbossrigs.js.
//   astraea     Astraea, the Star Keeper: a starry stag with a coat of night sky threaded with
//               constellations, antlers of linked stars and a ring of stars in orbit; she rears and
//               brings her hooves down in a starburst.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { star5, twinkles } from './astral.js';
import { folioRig, folioStill, solRig, solStill, lunaRig, lunaStill } from './starbossrigs.js';
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

const STAG_ATK = [
  { rear: 1, burst: 0 },
  { rear: 0.4, burst: 0, smear: 1 },
  { rear: -0.4, burst: 1, hit: 1 },
  { rear: -0.2, burst: 1.6 },
  { rear: 0, burst: 0.4 },
];

function astraea(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? STAG_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const coat = ramp('#3a3a8a', { step: 10, turn: 10 });
  const belly = '#6a6ac8';
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const rear = A ? A.rear : 0;
  const cx = 54;
  const cy = (dead ? 60 : 50) - breath(q) - Math.abs(step) * 1.4;
  const out = [];
  // A ring of stars in orbit (behind, then in front).
  const orbit = (front) => {
    const o = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + q * TAU * 0.5;
      if ((Math.sin(a) > 0) !== front) continue;
      o.push(star5(cx + Math.cos(a) * 46, cy + 10 + Math.sin(a) * 12, 3 + (i % 2), i % 2 ? '#ffe36b' : '#ffffff'));
    }
    return o;
  };
  out.push(...orbit(false));
  const body = [];
  // Legs: slim with gold hooves; the front pair rise on the rear-up.
  for (const [ox, s, c, front] of [[-16, step, coat.sh, false], [14, -step, coat.sh, true], [-10, -step, coat.base, false], [20, step, coat.base, true]]) {
    const lift = front ? rear * 18 : 0;
    const foot = [cx + ox + Math.max(0, s) * 4 + (front ? rear * 8 : 0), 104 - Math.max(0, s) * 3 - lift];
    body.push(...limb([cx + ox, cy + 30], [(cx + ox + foot[0]) / 2, (cy + 30 + foot[1]) / 2], 5, 4, c), ...limb([(cx + ox + foot[0]) / 2, (cy + 30 + foot[1]) / 2], foot, 4, 3.4, c), O(foot[0], foot[1] + 1, 3, 2, 0, '#e8b84a', 10));
  }
  // The body: a round night-sky barrel, its coat sprinkled with a constellation.
  body.push(...blob(cx, cy + 24, 26, 14, coat), F(O(cx + 4, cy + 30, 16, 6, 0, belly, 18)));
  const cons = [[-14, 18], [-6, 14], [2, 20], [10, 15], [16, 22]];
  for (let i = 0; i < cons.length - 1; i++) body.push(F(strand([[cx + cons[i][0], cy + cons[i][1]], [cx + cons[i + 1][0], cy + cons[i + 1][1]]], 0.6, '#c8c8ff')));
  for (const [x, y] of cons) body.push(star5(cx + x, cy + y, 1.6, '#ffffff'));
  body.push(E(cx - 26, cy + 18, 4, 5, '#ffffff'));
  // Neck and head, the antlers of linked stars.
  const hx = cx + 22;
  const hy = cy - 6;
  body.push(...limb([cx + 14, cy + 18], [hx - 2, hy + 8], 12, 10, coat.base));
  const head = [...blob(hx, hy, 13, 12, coat), F(O(hx + 8, hy + 5, 7, 5, 0, belly, 14)), E(hx + 14, hy + 4, 1.8, 1.4, '#ff9ab8')];
  head.push(O(hx - 10, hy - 6, 5, 2.4, -30, coat.sh, 12), F(O(hx - 10, hy - 6, 3, 1.2, -30, '#c8a8ff', 10)));
  for (const s of [-1, 1]) {
    const tine = chain(hx - 2 + s * 4, hy - 10, -100 + s * 18, [7, 7, 6], (i) => (i ? -s * 22 : 0));
    for (let i = 0; i < tine.length - 1; i++) head.push(F(strand([tine[i], tine[i + 1]].map((p) => [p[0], p[1]]), 0.8, '#c8c8ff')));
    tine.forEach((p, i) => head.push(star5(p[0], p[1], i ? 2.6 : 1.6, i === tine.length - 1 ? '#ffe36b' : '#ffffff')));
    const br = chain(tine[1][0], tine[1][1], -60 + s * 40, [6], () => 0);
    head.push(F(strand(br, 0.8, '#c8c8ff')), star5(br.at(-1)[0], br.at(-1)[1], 2, '#ffffff'));
  }
  head.push(...cuteFace(hx + 3, hy, 2, mood, { iris: '#ffd36b', inkC: '#1a1a3a', gap: 5.4, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: coat.base, mouthDy: 4.2, lash: 1.8, wing: 1.8, blushOn: true }));
  body.push(...spin(head, hx, hy + 6, A ? rear * -14 : walk ? step * 3 : sway(q) * 3));
  out.push(...spin(body, cx - 20, 104, dead ? 80 : -rear * 12));
  out.push(...orbit(true));
  if (A?.smear) out.push(smear([[cx + 30, cy - 30], [cx + 44, cy + 10], [cx + 40, 100]], 10, '#e6e6ff'));
  if (A?.burst) {
    const k = A.burst;
    for (let i = 0; i < 8; i++) {
      const a = (-180 + i * 25) * D2R;
      out.push(star5(cx + 40 + Math.cos(a) * 18 * k, 102 + Math.sin(a) * 14 * k, 3, i % 2 ? '#ffe36b' : '#ffffff'));
    }
  }
  if (A?.hit) out.push(...star(cx + 42, 100, 7, '#fff6a8'));
  return { w: 124, h: 112, res: 3, shapes: out };
}

// ---------- The Observatory's bosses, rigged ----------
// (2026-11-03, the boss reanimation.) A live skeleton (render/mobs/rig.js): Astraea walks on jointed
// legs, rears on her hind hooves and stamps, stars orbiting her. Rig space: the floor under her at (0, 0).
const DG = Math.PI / 180;

// Astraea.
const AS = { coat: ramp('#3a3a8a', { step: 10, turn: 10 }), belly: '#6a6ac8' };
const asParts = {
  thigh: (back) => part(`astraea|thigh|${back}`, 12, 20, () => [...limb([6, 3], [6, 16], 5, 4, back ? AS.coat.sh : AS.coat.base)]),
  shin: (back) => part(`astraea|shin|${back}`, 12, 22, () => [...limb([6, 3], [6, 17], 4, 3.4, back ? AS.coat.sh : AS.coat.base), O(6, 18, 3, 2, 0, '#e8b84a', 10)]),
  body: () => part('astraea|body', 60, 34, () => {
    const cx = 30;
    const cy = 17;
    const out = [...blob(cx, cy, 26, 14, AS.coat), F(O(cx + 4, cy + 6, 16, 6, 0, AS.belly, 18)), E(cx - 26, cy - 6, 4, 5, '#ffffff')];
    const cons = [[-14, -6], [-6, -10], [2, -4], [10, -9], [16, -2]];
    for (let i = 0; i < cons.length - 1; i++) out.push(F(strand([[cx + cons[i][0], cy + cons[i][1]], [cx + cons[i + 1][0], cy + cons[i + 1][1]]], 0.6, '#c8c8ff')));
    for (const [x, y] of cons) out.push(star5(cx + x, cy + y, 1.6, '#ffffff'));
    return out;
  }),
  neck: () => part('astraea|neck', 18, 30, () => [...limb([6, 26], [10, 6], 12, 10, AS.coat.base)]),
  head: () => part('astraea|head', 52, 52, () => {
    const hx = 22;
    const hy = 34;
    const out = [...blob(hx, hy, 13, 12, AS.coat), F(O(hx + 8, hy + 5, 7, 5, 0, AS.belly, 14)), E(hx + 14, hy + 4, 1.8, 1.4, '#ff9ab8'), O(hx - 10, hy - 6, 5, 2.4, -30, AS.coat.sh, 12), F(O(hx - 10, hy - 6, 3, 1.2, -30, '#c8a8ff', 10))];
    for (const sd of [-1, 1]) {
      const tine = chain(hx - 2 + sd * 4, hy - 10, -100 + sd * 18, [7, 7, 6], (i) => (i ? -sd * 22 : 0));
      for (let i = 0; i < tine.length - 1; i++) out.push(F(strand([tine[i], tine[i + 1]].map((pt) => [pt[0], pt[1]]), 0.8, '#c8c8ff')));
      tine.forEach((pt, i) => out.push(star5(pt[0], pt[1], i ? 2.6 : 1.6, i === tine.length - 1 ? '#ffe36b' : '#ffffff')));
      const br = chain(tine[1][0], tine[1][1], -60 + sd * 40, [6], () => 0);
      out.push(F(strand(br, 0.8, '#c8c8ff')), star5(br.at(-1)[0], br.at(-1)[1], 2, '#ffffff'));
    }
    return out;
  }),
  face: (mood, atk) => part(`astraea|face|${mood}|${atk}`, 26, 20, () => cuteFace(13, 8, 2, mood, { iris: '#ffd36b', inkC: '#1a1a3a', gap: 5.4, atk, skin: AS.coat.base, mouthDy: 4.2, lash: 1.8, wing: 1.8, blushOn: true })),
};
const AS_LEGS = [['lB1', -16, true, false], ['lF1', 14, true, true], ['lB2', -10, false, false], ['lF2', 20, false, true]];
const astraeaRig = makeRig({
  w: 80,
  h: 104,
  stride: 56,
  fast: ['rear', 'head', 'lF1', 'lF2'],
  kick: { rear: -1.5, head: -3 },
  pose(m, a) {
    const t = a.t;
    const s = Math.sin(a.wp);
    const idle = { rear: 0, y: -Math.sin(t * 2) * 1, head: Math.sin(t * 1.2) * 0.05, lB1: 0, lF1: 0, lB2: 0, lF2: 0, kF: 0 };
    const walk = { rear: 0, y: -Math.abs(s) * 1.4, head: s * 0.05, lB1: -s * 0.4, lF1: s * 0.4, lB2: s * 0.4, lF2: -s * 0.4, kF: Math.max(0, s) * 0.5 };
    const antic = { rear: 1, y: 0, head: -0.2, lB1: 0.2, lF1: -0.9, lB2: 0.2, lF2: -1.1, kF: 1.2 };
    const strike = { rear: -0.4, y: 2, head: 0.25, lB1: -0.1, lF1: -0.3, lB2: -0.1, lF2: -0.2, kF: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    // She rears about her hind hooves.
    { name: 'hind', at: () => [-20, 0], rot: (S) => -S.rear * 12 * DG },
    { name: 'root', parent: 'hind', at: (S) => [20, -30 + S.y] },
    ...AS_LEGS.flatMap(([n, x, back, front]) => [
      { name: n, parent: 'root', pivot: [6, 3], at: () => [x, 4], rot: (S) => S[n], s: () => asParts.thigh(back) },
      { name: `${n}s`, parent: n, pivot: [6, 3], at: () => [0, 13], rot: (S) => (front ? S.kF : 0), s: () => asParts.shin(back) },
    ]),
    { name: 'body', parent: 'root', pivot: [30, 17], at: () => [0, 0], s: () => asParts.body() },
    { name: 'neck', parent: 'body', pivot: [6, 26], at: () => [14, -6], s: () => asParts.neck() },
    { name: 'head', parent: 'neck', pivot: [22, 40], at: () => [10, -20], rot: (S) => S.head, s: () => asParts.head() },
    { name: 'face', parent: 'head', pivot: [13, 8], at: () => [3, -6], s: (a) => asParts.face(a.face, a.atk) },
  ],
  fx(ctx, m, a) {
    // The ring of stars in orbit round her, and the starburst of her stamp.
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * TAU + a.t * 0.8;
      const x = Math.cos(ang) * 46;
      const y = -40 + Math.sin(ang) * 12;
      ctx.globalAlpha = a.alpha * (Math.sin(ang) > 0 ? 1 : 0.5);
      ctx.fillStyle = i % 2 ? '#ffe36b' : '#ffffff';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 1.4 : 3.4 + (i % 2);
        const q = (k / 10) * TAU - Math.PI / 2;
        ctx[k ? 'lineTo' : 'moveTo'](x + Math.cos(q) * r, y + Math.sin(q) * r);
      }
      ctx.fill();
    }
    if (a.ph.since >= 0 && a.ph.since < 0.6) {
      const u = a.ph.since / 0.6;
      for (let i = 0; i < 8; i++) {
        const ang = (-180 + i * 25) * DG;
        ctx.globalAlpha = a.alpha * (1 - u);
        ctx.fillStyle = i % 2 ? '#ffe36b' : '#ffffff';
        ctx.beginPath();
        ctx.arc(40 + Math.cos(ang) * 18 * (0.4 + u), -2 + Math.sin(ang) * 14 * (0.4 + u), 2.4, 0, TAU);
        ctx.fill();
      }
    }
  },
});

export const ART = {
  folio: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 240], draw: folioStill, rig: folioRig },
  eclipsesol: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 300, 220], draw: solStill, rig: solRig },
  eclipseluna: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 300, 220], draw: lunaStill, rig: lunaRig },
  astraea: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 320, 240], draw: astraea, rig: astraeaRig },
};

export const INFO = {
  folio: { name: 'Folio, the Archivist', w: 70, h: 96 },
  eclipsesol: { name: 'Sol, the Eclipse Twin', w: 60, h: 90 },
  eclipseluna: { name: 'Luna, the Eclipse Twin', w: 60, h: 90 },
  astraea: { name: 'Astraea, the Star Keeper', w: 80, h: 104 },
};
