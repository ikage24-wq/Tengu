// The Sulk (Chapter 10, 2026-11-19, the player's pick "A"): the storm cloud of the Sky Whale's
// sadness, the boss at her brow. Everyone was scared of something so big, so nobody ever visited,
// and the sulk grew into a storm. A big puffy grey-blue thundercloud floating over the deck, its
// arms crossed in a huff, pouting, a tear on each cheek, a slim lightning curl on top, rain always
// falling under it. When the storm is cleared it turns white and fluffy (m.cine.mood 'happy').
// Live rig, outer outline only, face bare; no squash: its edge puffs bob on their own instead.
//
// How it moves:
//   idle    a 10 s act: arms crossed, sulking, a tear now and then; a big huff, turning away;
//           then a peek back over its shoulder to see if anyone noticed.
//   walk    drifting along, leaning into it, arms trailing.
//   fight   a cloud-arm slap: the near arm raised, then brought down.
//   casts   (world/skywhale.js sets m.castPose) drizzle (arms up, calling the rain), bolt (the
//           near arm thrown out at the tank), downpour (leaning in, both arms forward), grumble
//           (arms out, rumbling, trembling), forked (rising, arms high), cloudburst (rising high,
//           then slamming down), umbrella (hugging itself, turned away).

import { E, T, F, stroke } from './kit.js';
import { ramp } from './meadow.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, pairOf, faceSprite, hold, put, MOODS, sparkle, INK } from './rigkit.js';

const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const sized = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};
const K = 1.45;

// Two coats: the storm (grey-blue) and, when it clears, white.
const COATS = { storm: ramp('#9aa6d0', { step: 9, turn: 9 }), clear: ramp('#f4f6ff', { step: 6, turn: 6 }) };
const HILITE = { storm: '#d8e0f8', clear: '#ffffff' };
const sk = pairOf('sulk');
// The cloud: a puffy heap of lumps, a pale top, a darker underside. Box 64 x 48; its middle at (32, 34).
const cloudP = (coat) => () => {
  const C = COATS[coat];
  return [
    ...[[18, 30, 13, 11.6], [46, 30, 13, 11.6], [22, 18, 11, 10], [42, 16, 12.6, 11], [31, 13, 12, 10.8], [32, 31, 19, 14]].map(([x, y, rx, ry]) => E(x, y, rx, ry, C.base)),
    F(E(32, 40, 20, 4.4, C.sh)), F(E(15, 35, 7, 3, C.sh)), F(E(49, 35, 7, 3, C.sh)),
    F(E(27, 9.6, 7, 3.4, HILITE[coat])), F(E(42, 11, 5, 2.4, HILITE[coat])),
  ];
};
// An edge puff that bobs on its own. Box 22 x 18; its middle at (11, 9).
const puffP = (coat) => () => [E(11, 9, 10, 8.6, COATS[coat].base), F(E(9, 6, 4.4, 2.2, HILITE[coat])), F(E(11, 14, 7, 2.2, COATS[coat].sh))];
// A cloud arm: three puffs in a row. Box 20 x 12; the shoulder at (3, 6).
const armP = (coat, far) => () => {
  const C = COATS[coat];
  const c = far ? C.sh : C.base;
  return [E(6, 6, 5.2, 4.8, c), E(11.4, 6.2, 4.8, 4.4, c), E(15.6, 6, 3.6, 3.4, c), F(E(10, 4, 3, 1.2, HILITE[coat]))];
};
// The lightning curl on top: slim, a zig and a curl. Box 14 x 22; its foot at (6, 21).
const boltP = () => [T([[6, 21], [9, 13], [5.6, 13.4], [10.6, 4.6], [13, 1.6], [11.6, 6.4], [9.6, 10.4], [13, 10], [7.4, 21]], '#ffe066'), F(T([[8.4, 12.6], [11.6, 5.4], [12.4, 3.4], [9.4, 11.6]], '#fff6c8'))];
const PARTS = Object.fromEntries(['storm', 'clear'].map((coat) => [coat, {
  CLOUD: sk(`cloud|${coat}`, 64, 48, cloudP(coat), 2),
  PUFF: sk(`puff|${coat}`, 22, 18, puffP(coat), 2),
  ARM: [false, true].map((f) => sk(`arm${f ? 1 : 0}|${coat}`, 20, 12, armP(coat, f), 2)),
}]));
const BOLT = sk('bolt', 14, 22, boltP, 2);
// Its own face: brimming eyes (navy, tears welling along the bottom, two big glints), worried brows,
// a pout with its lower lip stuck out and gloom streaks under its eyes; a tear sits on its cheek. Puffs up
// cross with red cheeks and a little bolt for an anger mark; wails with its eyes squeezed shut and tears
// streaming. Box 64 x 48 (over the cloud).
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const SU_EYES = [[37.4, 23, 1, 3.2, 3.6], [27.6, 23.4, -1, 2.7, 3.1]];
const SU_LIP = '#7a3040';
const SU_TEAR = '#a8d8ff';
const sulkShapes = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of SU_EYES) {
    const inner = mood === 'angry' ? 1.3 : mood === 'happy' ? 0.2 : -1.2;
    const lift = mood === 'shout' ? -0.6 : 0;
    if (mood !== 'dead') out.push(...oLn([[x - s * w * 0.9, y - h * 1.45 + lift + inner], [x + s * w * 0.95, y - h * 1.55 + lift - inner * 0.35]], 0.8));
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.3, w, h * 0.38, 15, 165, 8), 0.85));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 0.85));
    else if (mood === 'hurt' || mood === 'shout') out.push(...oSquint(x, y, s, w * 0.8, 0.85));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.65, '#4a5a9a', s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.75));
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.25 + (px - x) * -s * 0.55 : () => y - h * 0.9;
      const wy = (px) => y + h * 0.3 + Math.sin((px - x) * 2.2) * 0.22;
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.05, w * 0.86, h * 0.86), lid), '#3a4a8a')));
      out.push(F(T(oCut(oRing(x, y - h * 0.05, w * 0.36, h * 0.38), lid), '#1a2050')));
      // The welling tears: a wobbly band of water along the bottom of each eye.
      out.push(F(T(oCut(oCut(oRing(x, y + h * 0.05, w * 0.86, h * 0.86), lid), wy), '#6a9ae0')), ...oLn(Array.from({ length: 7 }, (_, i) => { const px = x - w * 0.62 + (i / 6) * w * 1.24; return [px, wy(px)]; }), 0.35, '#c8e8ff'));
      out.push(F(T(oCut(oRing(x + w * 0.3, y - h * 0.38, w * 0.32, w * 0.32, 0, 10), lid), '#ffffff')), F(E(x - w * 0.35, y + h * 0.02, w * 0.14, w * 0.14, '#ffffff')), F(E(x + w * 0.25, y + h * 0.55, w * 0.1, w * 0.1, '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.2), 0.9));
    }
    // Gloom streaks under each eye while it sulks.
    if (mood === 'idle' || mood === 'blink' || mood === 'sleep' || mood === 'hurt') for (const k of [-1, 0, 1]) out.push(...oLn([[x + k * w * 0.55 + 0.25, y + h * 1.3], [x + k * w * 0.55 - 0.25, y + h * 1.8]], 0.4, '#7a8ac8'));
    // Wailing: tears stream down from shut eyes.
    if (mood === 'shout') out.push(...oLn([[x + s * w * 0.2, y + h * 0.5], [x + s * w * 0.45, y + h * 1.6], [x + s * w * 0.4, y + h * 2.6]], 1, SU_TEAR), ...oLn([[x + s * w * 0.1, y + h * 0.9], [x + s * w * 0.25, y + h * 1.8]], 0.3, '#ffffff'));
  }
  if (mood === 'angry' || mood === 'happy') for (const [bx, by, r] of [[23.6, 28.4, 1.9], [41.6, 28.4, 1.7]]) {
    const k = mood === 'angry' ? 1.25 : 1;
    out.push(F(E(bx, by, r * k, r * 0.6 * k, '#f4a0b8')));
  }
  if (mood === 'angry') out.push(F(T([[44.6, 14.6], [46.6, 14.8], [45.5, 16.8], [47.2, 16.8], [44.2, 20.6], [45.1, 17.9], [43.7, 17.8]], '#ffd84a')));
  const [mx, my] = [33, 30.6];
  if (mood === 'shout') out.push(F(T(oArc(mx, my - 0.8, 2.6, 2.6, 0, 180, 8), '#5a1a2a')), F(E(mx, my + 1, 1.3, 0.55, '#ff8fab')));
  else if (mood === 'happy') out.push(...oLn(oArc(mx, my - 1.2, 1.8, 1.5, 25, 155, 6), 0.7, SU_LIP));
  else if (mood === 'angry') out.push(...oLn([[mx - 1.8, my + 0.3], [mx - 0.6, my - 0.1], [mx + 0.6, my + 0.1], [mx + 1.8, my - 0.2]], 0.7, SU_LIP));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.8, 0.6, SU_LIP));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.3, 0.7, 0.8, SU_LIP)));
  else out.push(...oLn(oArc(mx, my + 2, 2.3, 1.5, 205, 335, 7), 0.75, SU_LIP), F(T(oArc(mx, my + 0.75, 1, 0.65, 0, 180, 6), '#e88aa0')));
  if (mood === 'idle' || mood === 'blink') out.push(...oDrop(41.4, 27, 0.95, SU_TEAR));
  if (mood === 'hurt') out.push(...oDrop(41.6, 27.4, 1.05, SU_TEAR), ...oDrop(24.4, 27.8, 0.9, SU_TEAR));
  return out;
};
const sulkFace = (mood) => faceSprite(`sulk|face2|${mood}`, 64, 48, () => sulkShapes(mood));

// Its cast moves: [antic, strike, hold]. `hold(t)` is the pose it takes up for the whole cast, acted
// out (t: seconds into the cast), so each cast reads as its own (2026-11-19: they barely differed).
// Its cloud arms mostly hide inside its body, so the whole cloud tells the cast:
//   drizzle     floating high and tipped back, puffs drooping, sobbing up and down: calling the rain
//   bolt        reared right back, crackling, its lightning tuft flicking
//   downpour    tipped hard forward over you, pumping
//   grumble     sunk low and puffed up fat, trembling and rumbling
//   forked      risen high, rocking side to side
//   cloudburst  risen higher still, swelling bigger as it builds
//   umbrella    sunk down small, hugging itself, shivering
const st = (o) => ({ x: 0, lift: 0, tilt: 0, aN: 170, aF: 10, pL: 0, pR: 0, pT: 0, bolt: 0, ...o });
const MOVES = {
  drizzle: [st({ lift: 4, tilt: -4, aN: -70, aF: -110, pT: -2 }), st({ lift: 1, tilt: 6, aN: 20, aF: -20 }),
    (t) => st({ lift: 10 + Math.abs(Math.sin(t * 3.4)) * 3, tilt: -12, aN: -62 + Math.sin(t * 6) * 16, aF: -118 - Math.sin(t * 6 + 1.3) * 16, pL: -2.6, pR: -2.6, pT: -2.6 })],
  bolt: [st({ x: -3, lift: 3, tilt: -8, aN: -120, aF: 30, bolt: -20 }), st({ x: 8, tilt: 12, aN: -10, aF: 20, bolt: 20 }),
    (t) => st({ x: Math.sin(t * 31) * 1, lift: 4, tilt: -20, aN: -128 + Math.sin(t * 17) * 6, aF: 62, bolt: -26 + Math.sin(t * 17) * 12 })],
  downpour: [st({ x: -2, lift: 2, tilt: -10, aN: -40, aF: -60 }), st({ x: 8, tilt: 16, aN: 10, aF: 20 }),
    (t) => st({ x: 3, lift: 2, tilt: 24 + Math.sin(t * 6) * 3, aN: -8 + Math.sin(t * 6) * 14, aF: -28 + Math.sin(t * 6 + 1) * 14 })],
  grumble: [st({ lift: -2, aN: -15, aF: -165, pL: -2, pR: -2, pT: -3 }), st({ lift: 3, tilt: 0, aN: -40, aF: -140, pL: 2, pR: 2, pT: 2 }),
    (t) => st({ x: Math.sin(t * 40) * 1.6, lift: -3, tilt: Math.sin(t * 27) * 1.4, aN: 34, aF: 146, pL: 4.5, pR: 4.5, pT: 4.5 })],
  forked: [st({ lift: 8, tilt: -6, aN: -100, aF: -80, bolt: -14 }), st({ lift: 2, tilt: 8, aN: -30, aF: -40, bolt: 14 }),
    (t) => st({ lift: 14, tilt: Math.sin(t * 2.4) * 12, aN: -100 + Math.sin(t * 2.4) * 12, aF: -78 - Math.sin(t * 2.4) * 12, bolt: -14 })],
  cloudburst: [st({ lift: 16, tilt: -4, aN: -90, aF: -90, pT: -3 }), st({ lift: -4, tilt: 10, aN: 50, aF: 130, pL: 3, pR: 3 }),
    (t) => st({ lift: 20 + Math.sin(t * 1.6) * 2, tilt: -4, aN: -86, aF: -94, pL: 1 + Math.min(1, t / 2) * 5, pR: 1 + Math.min(1, t / 2) * 5, pT: 1 + Math.min(1, t / 2) * 5 })],
  umbrella: [st({ tilt: -10, aN: 175, aF: 5, x: -2 }), st({ x: 4, tilt: 8, aN: 120, aF: 60 }),
    (t) => st({ x: -2 + Math.sin(t * 20) * 0.7, lift: -2, tilt: 8, aN: 176, aF: 4, pL: -2.4, pR: -2.4, pT: -3 })],
};
const MOOD = { drizzle: 'hurt', bolt: 'angry', downpour: 'angry', grumble: 'shout', forked: 'angry', cloudburst: 'shout', umbrella: 'hurt' };

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const coat = (a) => (a.sulkClear ? 'clear' : 'storm');
  return [
    { name: `pL${tag}`, parent: 'trunk', s: (a) => PARTS[coat(a)].PUFF[i](), pivot: [11, 9], at: (S) => [-25, -2 + S.pL] },
    { name: `pR${tag}`, parent: 'trunk', s: (a) => PARTS[coat(a)].PUFF[i](), pivot: [11, 9], at: (S) => [25, -4 + S.pR] },
    { name: `pT${tag}`, parent: 'trunk', s: (a) => PARTS[coat(a)].PUFF[i](), pivot: [11, 9], at: (S) => [-8, -22 + S.pT] },
    { name: `bolt${tag}`, parent: 'trunk', s: BOLT[i], pivot: [6, 21], at: () => [6, -21], rot: (S) => S.bolt * D2R, when: (a) => !a.sulkClear },
    { name: `cloud${tag}`, parent: 'trunk', s: (a) => PARTS[coat(a)].CLOUD[i](), pivot: [32, 34] },
    { name: `armF${tag}`, parent: 'trunk', s: (a) => PARTS[coat(a)].ARM[1][i](), pivot: [3, 6], at: () => [-12, 0], rot: (S) => S.aF * D2R },
    { name: `armN${tag}`, parent: 'trunk', s: (a) => PARTS[coat(a)].ARM[0][i](), pivot: [3, 6], at: () => [12, -1], rot: (S) => S.aN * D2R },
  ];
};

export const sulkRig = sized(makeRig({
  w: 96, h: 96, soft: true, stride: 1e9, recover: 0.6,
  springs: { x: [180, 14], lift: [120, 10], tilt: [140, 11], aN: [200, 12], aF: [200, 12], pL: [90, 7], pR: [90, 7], pT: [90, 7], bolt: [160, 8] },
  fast: ['x', 'aN', 'aF'],
  kick: { tilt: -120, bolt: 260 },
  turnKick: { tilt: 90, bolt: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const clear = m.cine?.mood === 'happy';
    a.sulkClear = clear;
    const lu = t % 10;
    const busy = active || (m.cast && m.castPose) || walkW > 0.05 || m.cine;
    // Its act: arms crossed in a sulk; a big huff, turning away; a peek back to see if anyone
    // noticed. The puffs at its edges bob all the while, each on its own beat.
    const huff = busy ? 0 : hold(lu, 3.4, 3.8, 5.2, 5.8);
    const peek = busy ? 0 : hold(lu, 6.6, 7, 8, 8.4);
    const bob = Math.sin(t * 1.6);
    const b1 = Math.sin(t * 2.1 + 1);
    const b2 = Math.sin(t * 1.8 + 2.4);
    const b3 = Math.sin(t * 2.4 + 4);
    const idle = st({ lift: 4 + bob * 2 + huff * 3, tilt: bob * 2 - huff * 12 + peek * 6, aN: 170 + huff * 6, aF: 10 - huff * 6, pL: b1 * 1.4 - huff * 2, pR: b2 * 1.4 - huff * 2, pT: b3 * 1.2 - huff * 2, bolt: Math.sin(t * 3) * 6 });
    // Drifting along: leaning in, arms trailing behind.
    const walk = st({ lift: 4 + bob * 1.4, tilt: 9, aN: 150, aF: 160, pL: b1, pR: b2, pT: b3, bolt: -10 });
    // A slap of the near arm: raised, then down.
    const antic0 = st({ x: -2, lift: 6, tilt: -8, aN: -110, aF: 20, pT: -2 });
    const strike0 = st({ x: 8, lift: 2, tilt: 12, aN: 40, aF: 30 });
    // A named cast takes up its own move.
    if (m.castPose && MOVES[m.castPose]) mo.sulkKind = m.castPose;
    else if (!active) mo.sulkKind = null;
    const kind = mo.sulkKind;
    const mv = kind ? MOVES[kind] : null;
    const cast = mv && m.cast && m.castPose ? clamp((a.now - m.cast.t0) / 0.45, 0, 1) : 0;
    let base = idle;
    if (cast > 0) {
      const hold = mv[2](a.now - m.cast.t0);
      base = Object.fromEntries(Object.keys(idle).map((key) => [key, idle[key] + (hold[key] - idle[key]) * cast]));
    }
    const S = stateBlend(a, base, walk, mv ? mv[0] : antic0, mv ? mv[1] : strike0);
    if (clear) Object.assign(S, st({ lift: 6 + bob * 2, tilt: bob * 3, aN: -60 + Math.sin(t * 3) * 10, aF: -120 + Math.sin(t * 3 + 1) * 10, pL: b1 * 1.4, pR: b2 * 1.4, pT: b3 * 1.4 }));
    else if (m.hp <= 0) Object.assign(S, st({ lift: -6, tilt: 14, aN: 100, aF: 80, pL: 2, pR: 2, pT: 2 }));
    a.sulkMood = clear ? 'happy' : m.hp <= 0 ? 'dizzy' : cast > 0 ? MOOD[kind] : peek > 0.5 ? 'blink' : null;
    a.sulkHuff = huff;
    return S;
  },
  under(ctx, m, a, S) {
    // Its shadow, and the rain always falling under it (none once it has cleared).
    ctx.globalAlpha = 0.2 * a.alpha;
    ctx.fillStyle = '#1a2240';
    ctx.beginPath();
    ctx.ellipse(S.x, -0.5, 26 - S.lift * 0.3, 3, 0, 0, TAU);
    ctx.fill();
    if (a.sulkClear || m.hp <= 0) {
      ctx.globalAlpha = 1;
      return;
    }
    ctx.strokeStyle = '#9fd0ff';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    const top = -14 - S.lift;
    for (let k = 0; k < 9; k++) {
      const u = (a.t * 1.6 + k * 0.37) % 1;
      const x = S.x - 22 + k * 5.5 - u * 3;
      const y = top + u * (-top);
      ctx.globalAlpha = a.alpha * 0.7 * Math.min(1, (1 - u) * 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 1.2, y + 5);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
    ctx.globalAlpha = 1;
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -24 - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
    { name: 'face', parent: 'trunk', s: (a) => sulkFace(a.sulkMood ?? (MOODS.has(a.face) && a.face !== 'idle' ? a.face : 'idle')), pivot: [32, 34] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 || a.sulkClear) return;
    const B = mat('trunk');
    // A tear rolling off its cheek now and then.
    const u = (a.t * 0.35 + (m.uid % 5) * 0.2) % 1;
    if (u < 0.6) {
      const [tx, ty] = at2(B, 6.4, -6 + u * 22);
      ctx.globalAlpha = a.alpha * Math.min(1, (0.6 - u) * 4);
      ctx.fillStyle = '#bfe4ff';
      ctx.beginPath();
      ctx.ellipse(tx, ty, 1, 1.5, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // The lightning curl crackles.
    const [bx, by] = at2(mat('bolt'), 10, 4);
    if (Math.sin(a.t * 7 + 1) > 0.85 || a.ph.strike > 0.2) sparkle(ctx, a, bx + 2, by - 2, 1.8, a.alpha, '#fff6a8');
  },
}), K);

export function sulkStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const k = K;
  const sc = (shapes, pv, x, y, deg = 0) => put(shapes, pv, x, y, deg).map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * k, py * k]) } : { ...s, x: s.x * k, y: s.y * k, rx: s.rx * k, ry: s.ry * k }));
  const ty = -28;
  return { w: 140, h: 120, res: 2, shapes: [
    ...sc(puffP('storm')(), [11, 9], -25, ty - 2), ...sc(puffP('storm')(), [11, 9], 25, ty - 4), ...sc(puffP('storm')(), [11, 9], -8, ty - 22), ...sc(boltP(), [6, 21], 6, ty - 21),
    ...sc(cloudP('storm')(), [32, 34], 0, ty), ...sc(sulkShapes(fm), [32, 34], 0, ty),
    ...sc(armP('storm', true)(), [3, 6], -12, ty, 10), ...sc(armP('storm', false)(), [3, 6], 12, ty - 1, 170),
  ].map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px + 70, py + 116]) } : { ...s, x: s.x + 70, y: s.y + 116 })) };
}
