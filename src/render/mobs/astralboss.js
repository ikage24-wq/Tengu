// Monster art: the Star Observatory's bosses (docs/design/star-observatory.md), redrawn
// creature-first and big (2026-11-03): chibi at two and a half to three times the hero's height,
// each with one signature shape.
//   folio       Folio, the Archivist: a grand bookworm in round glasses, curled up on an enormous
//               open book whose pages turn; she rears up and slams the book shut.
//   eclipsesol  Sol, the Eclipse Twin: a round sun-fox with a blazing halo ring behind her and a
//               flame-tipped tail; she pounces in a flare.
//   eclipseluna Luna, the Eclipse Twin: a round moon-rabbit with a silver crescent behind her and
//               long drooping ears; she hops and stamps down a ring of moonlight.
//   astraea     Astraea, the Star Keeper: a starry stag with a coat of night sky threaded with
//               constellations, antlers of linked stars and a ring of stars in orbit; she rears and
//               brings her hooves down in a starburst.
// All face right, their lowest point on the bottom edge. Attacks are five frames: wind-up, strike,
// impact, hold, recover.

import { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, breath, sway, TAU, D2R, O, arcPts, limb, spin, strand, star, cuteFace, blob } from './critter.js';
import { star5, twinkles } from './astral.js';

const frames = (pose) => (pose === 'attack' ? 5 : 8);
const phase = (pose, f) => f / frames(pose);

// ---------- Folio, the Archivist ----------

const WORM_ATK = [
  { rear: 1, shut: 0 },
  { rear: -0.6, shut: 1, smear: 1 },
  { rear: -0.8, shut: 1, hit: 1 },
  { rear: -0.6, shut: 1 },
  { rear: 0, shut: 0.2 },
];

function folio(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? WORM_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const worm = ramp('#9fe08a', { step: 10, turn: 12 });
  const out = [];
  // The enormous book on the floor: an open spread, pages fanning, closing on the slam.
  const shut = A ? A.shut : 0;
  const bx = 54;
  const by = 100;
  const open = (1 - shut) * 34;
  out.push(T([[bx - 4, by], [bx - 44, by - 4 + shut * 2], [bx - 44, by + 6], [bx - 4, by + 8]], '#7a3a5a'), T([[bx + 4, by], [bx + 4 + open, by - 4], [bx + 4 + open, by + 6], [bx + 4, by + 8]], '#7a3a5a'));
  out.push(T([[bx, by - 2], [bx - 42, by - 6 + shut * 2], [bx - 42, by + 2], [bx, by + 4]], '#fff6e0'), T([[bx, by - 2], [bx + open, by - 6], [bx + open, by + 2], [bx, by + 4]], '#fffaf0'));
  for (let i = 1; i < 5; i++) out.push(F(R(bx - 38 + i * 6, by - 3, 4, 0.6, '#c9b8a8')), F(R(bx + 4 + i * 5 * (1 - shut), by - 3, 3 * (1 - shut) + 0.2, 0.6, '#c9b8a8')));
  if (!A) {
    const pg = (q * 4) % 1;
    out.push(...spin([T([[bx, by - 2], [bx + 28, by - 6], [bx + 28, by + 2], [bx, by + 4]], '#ffffff')], bx, by, -pg * 160));
  }
  // The worm: a chain of round segments curling up off the book, the head on top.
  const rear = A ? A.rear : walk ? Math.sin(TAU * q * 2) * 0.3 : breath(q) * 0.3;
  const segs = chain(bx - 26, by - 6, -30, [10, 10, 10, 9, 9], dead ? () => 10 : (i) => (i ? -18 - rear * 8 : 0) + Math.sin(TAU * q * 2 - i) * (walk ? 6 : 3));
  segs.forEach(([x, y], i) => {
    const r = 9 + i * 0.6;
    out.push(...blob(x, y, r, r * 0.9, worm, { lit: 0.6 }), F(R(x - r * 0.9, y - 1, r * 1.8, 1.4, worm.sh)));
    if (i > 0 && i < segs.length - 1) out.push(...limb([x + 2, y + r * 0.6], [x + 3, y + r * 0.6 + 4], 2, 1.8, worm.sh));
  });
  const [hx, hy] = segs.at(-1);
  const head = [...blob(hx, hy - 4, 16, 14, worm)];
  for (const s of [-1, 1]) {
    const an = chain(hx + s * 5, hy - 16, -90 + s * 20, [5, 5], wave(TAU * q * 2, 10, 0.8));
    head.push(strand(an, 1.4, worm.sh), E(an.at(-1)[0], an.at(-1)[1], 2.4, 2.4, '#ffd36b'));
  }
  head.push(...cuteFace(hx + 3, hy - 3, 2.2, mood, { iris: '#5a3a8a', gap: 6.4, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: worm.base, mouthDy: 3.8, lash: 1.6 }));
  for (const ex of [hx - 3.4, hx + 10]) {
    const rim = arcPts(ex, hy - 3, 5.4, 5.4, 0, 360, 16);
    for (let i = 0; i < rim.length - 1; i++) head.push(F(T([rim[i], rim[i + 1], [ex + (rim[i + 1][0] - ex) * 0.84, hy - 3 + (rim[i + 1][1] - hy + 3) * 0.84], [ex + (rim[i][0] - ex) * 0.84, hy - 3 + (rim[i][1] - hy + 3) * 0.84]], '#c8902a')));
  }
  head.push(F(R(hx + 2, hy - 3.6, 3, 1, '#c8902a')));
  out.push(...spin(head, hx, hy, A ? rear * -8 : 0));
  if (A?.smear) out.push(smear([[bx + 30, by - 40], [bx + 30, by - 20], [bx + 6, by - 2]], 10, '#fff8e6'));
  if (A?.hit) out.push(...star(bx + 4, by - 8, 7, '#fff6a8'), F(R(bx + 20, by - 18, 6, 8, '#fffaf0')), F(R(bx - 20, by - 22, 6, 8, '#fff6e0')));
  if (!dead) out.push(...twinkles(hx, hy, q, 4, 26));
  return { w: 116, h: 112, res: 3, shapes: out };
}

// ---------- The Eclipse Twins ----------

const SOL_ATK = [
  { crouch: 4, leap: 0, flare: 0.6 },
  { crouch: -4, leap: 1, flare: 1.4, smear: 1 },
  { crouch: 0, leap: 1.4, flare: 1.8, hit: 1 },
  { crouch: 0, leap: 1.2, flare: 1.2 },
  { crouch: 1, leap: 0.2, flare: 0.6 },
];

function sol(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? SOL_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#ffb84a', { step: 10, turn: 12 });
  const step = walk ? Math.sin(TAU * q * 2) : 0;
  const cx = 50 + (A ? A.leap * 10 : 0);
  const cy = (dead ? 40 : 30) + (A ? A.crouch - A.leap * 12 : -Math.abs(step) * 2 - breath(q) * 1);
  const out = [];
  // The halo: a blazing ring behind her, flaring on the attack.
  const fl = A ? A.flare : 0.6 + breath(q) * 0.2;
  const hx = cx - 6;
  const hy = cy + 18;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + q * TAU * 0.25;
    const r1 = 34;
    const r2 = 34 + (i % 2 ? 6 : 10) * fl;
    out.push(F(T([[hx + Math.cos(a - 0.12) * r1, hy + Math.sin(a - 0.12) * r1], [hx + Math.cos(a) * r2, hy + Math.sin(a) * r2], [hx + Math.cos(a + 0.12) * r1, hy + Math.sin(a + 0.12) * r1]], i % 2 ? '#ffd36b' : '#ff9a3a')));
  }
  const ring = arcPts(hx, hy, 34, 34, 0, 360, 32);
  for (let i = 0; i < ring.length - 1; i++) out.push(F(T([ring[i], ring[i + 1], [hx + (ring[i + 1][0] - hx) * 0.9, hy + (ring[i + 1][1] - hy) * 0.9], [hx + (ring[i][0] - hx) * 0.9, hy + (ring[i][1] - hy) * 0.9]], '#ffe8a0')));
  const body = [];
  // The fox: a big fluffy flame-tipped tail, a round body, legs.
  const tl = chain(cx - 16, cy + 30, 200, [8, 8, 7], dead ? () => 10 : (i) => (i ? -30 : 0) + Math.sin(TAU * q * 2 - i) * 8);
  body.push(strand(tl, (t) => 12 * (1 - t * 0.2), fur.base), E(tl.at(-1)[0], tl.at(-1)[1], 7, 7, '#fff4e0'), ...[0, 1, 2].map((i) => F(T([[tl.at(-1)[0] - 4 + i * 3, tl.at(-1)[1] - 4], [tl.at(-1)[0] - 3 + i * 3 + Math.sin(q * TAU * 3 + i) * 1.4, tl.at(-1)[1] - 12], [tl.at(-1)[0] - 1 + i * 3, tl.at(-1)[1] - 4]], '#ff8a3a'))));
  for (const [ox, s, c] of [[-8, step, fur.sh], [8, -step, fur.base]]) body.push(...limb([cx + ox, cy + 36], [cx + ox + Math.max(0, s) * 4, Math.min(106, cy + 50) - Math.max(0, s) * 3], 6, 5, c), E(cx + ox + 1 + Math.max(0, s) * 4, Math.min(106, cy + 50) - Math.max(0, s) * 3, 4, 2.6, '#fff4e0'));
  body.push(...blob(cx, cy + 30, 16, 13, fur), F(O(cx + 6, cy + 32, 8, 8, 0, '#fff4e0', 16)));
  // Head with big pointed ears and a white muzzle, a sun mark on her brow.
  const head = [];
  head.push(T([[cx - 12, cy + 2], [cx - 16, cy - 16], [cx - 2, cy - 4]], fur.sh), T([[cx + 10, cy], [cx + 14, cy - 18], [cx + 2, cy - 6]], fur.base), F(T([[cx + 10, cy - 2], [cx + 12, cy - 12], [cx + 5, cy - 5]], '#fff4e0')));
  head.push(...blob(cx, cy + 6, 17, 14, fur), F(O(cx + 9, cy + 11, 9, 6, 0, '#fff4e0', 16)), E(cx + 17, cy + 9, 2, 1.6, '#4a2a2a'));
  head.push(...cuteFace(cx + 4, cy + 4, 2.2, mood, { iris: '#ff7a1a', lip: '#c04a3a', gap: 5.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: 4, lash: 1.7, wing: 1.8 }));
  head.push(star(cx + 2, cy - 6, 3, '#ffe36b')[0]);
  body.push(...head);
  out.push(...spin(body, cx, cy + 30, A ? A.leap * 14 : dead ? 80 : 0));
  if (A?.smear) out.push(smear([[cx - 40, cy + 40], [cx - 10, cy + 20], [cx + 30, cy + 26]], 10, '#fff0c8'));
  if (A?.hit) out.push(...star(cx + 34, cy + 36, 7, '#fff6a8'));
  return { w: 116, h: 110, res: 3, shapes: out };
}

const LUNA_ATK = [
  { hop: 0, crouch: 4, ring: 0 },
  { hop: 1, crouch: -2, ring: 0 },
  { hop: 0, crouch: 3, ring: 1, hit: 1 },
  { hop: 0, crouch: 2, ring: 1.6 },
  { hop: 0, crouch: 0, ring: 0.4 },
];

function luna(pose, f, mood) {
  const q = phase(pose, f);
  const A = pose === 'attack' ? LUNA_ATK[f] : null;
  const dead = mood === 'dead';
  const walk = pose === 'walk';
  const fur = ramp('#e8ecfa', { step: 9, turn: 14 });
  const hopW = walk ? Math.abs(Math.sin(TAU * q * 2)) : 0;
  const cx = 52;
  const cy = (dead ? 44 : 34) - (A ? A.hop * 20 - A.crouch : hopW * 8 + breath(q));
  const out = [];
  // The crescent behind her: a silver moon, cratered.
  const mx = cx - 4;
  const my = cy + 14;
  out.push(T([...arcPts(mx, my, 34, 34, 60, 300, 24), ...arcPts(mx + 14, my - 2, 28, 30, 290, 70, 24)], '#dfe6ff'), F(T([...arcPts(mx, my, 31, 31, 80, 280, 20), ...arcPts(mx + 12, my - 2, 27, 28, 270, 90, 20)], '#f4f6ff')));
  for (const [dx, dy, r] of [[-26, 0, 3], [-18, 20, 2.4], [-14, -22, 2]]) out.push(F(E(mx + dx, my + dy, r, r, '#c8d0f0')));
  const body = [];
  // Round rabbit body, big hind feet, a puff tail.
  body.push(E(cx - 15, cy + 30, 5, 5, '#ffffff'));
  body.push(O(cx - 2, Math.min(106, cy + 46), 10, 3.4, 0, fur.sh, 14), O(cx + 8, Math.min(106, cy + 46), 10, 3.4, 0, fur.base, 14));
  body.push(...blob(cx, cy + 30, 16, 14, fur), F(O(cx + 6, cy + 32, 8, 9, 0, '#ffffff', 16)));
  // Head with long drooping ears that lift as she hops.
  const lift = A ? A.hop * 30 : hopW * 20;
  for (const [x, c, d] of [[-6, fur.sh, -1], [4, fur.base, 1]]) {
    const ear = chain(cx + x, cy - 4, -110 + lift * 0.4 + d * 6, [8, 8, 7], (i) => (i ? 26 - lift * 0.3 : 0));
    body.push(strand(ear, (t) => 8 * (1 - t * 0.2), c), strand(ear.map(([x2, y2]) => [x2 + 0.6, y2 + 0.6]), (t) => 3.4 * (1 - t * 0.3), '#ffd0e0'));
  }
  body.push(...blob(cx, cy + 6, 16, 14, fur));
  body.push(...cuteFace(cx + 4, cy + 6, 2.2, mood, { iris: '#5a6ad8', lip: '#a05a7a', gap: 5.6, atk: A ? (f >= 1 && f <= 3 ? 1 : 0.4) : 0, skin: fur.base, mouthDy: 4, lash: 1.7, wing: 1.8 }));
  body.push(T([...arcPts(cx - 2, cy - 4, 4, 4, 100, 330, 8), ...arcPts(cx - 0.6, cy - 4.6, 3, 3, 330, 100, 8)], '#c8d0f0'));
  out.push(...spin(body, cx, cy + 30, dead ? 80 : 0));
  if (A?.ring) {
    const k = A.ring;
    out.push(F(T([...arcPts(cx + 8, 106, 20 * k, 5 * k, 180, 360, 16), ...arcPts(cx + 8, 106, 16 * k, 3.6 * k, 360, 180, 16)], '#e6ecff')));
  }
  if (A?.hit) out.push(...star(cx + 24, 100, 6, '#ffffff'), ...star(cx - 8, 102, 4, '#e6ecff'));
  return { w: 112, h: 110, res: 3, shapes: out };
}

// ---------- Astraea, the Star Keeper ----------

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

export const ART = {
  folio: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 320, 240], draw: folio },
  eclipsesol: { pad: 14, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 300, 220], draw: sol },
  eclipseluna: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [100, 180, 300, 220], draw: luna },
  astraea: { pad: 12, walk: 8, idle: 8, attack: 5, stride: 32, atkMs: [110, 180, 320, 240], draw: astraea },
};

export const INFO = {
  folio: { name: 'Folio, the Archivist', w: 70, h: 96 },
  eclipsesol: { name: 'Sol, the Eclipse Twin', w: 60, h: 90 },
  eclipseluna: { name: 'Luna, the Eclipse Twin', w: 60, h: 90 },
  astraea: { name: 'Astraea, the Star Keeper', w: 80, h: 104 },
};
