// Lady Abyssia, the Sea Witch (redrawn 2026-11-19, the player's pick "A, the Ink-Cauldron Witch"):
// a round violet octopus up to her middle in a cauldron of ink, in a floppy indigo witch's hat with
// a teal band and a starfish buckle (its tip flops on its own), stirring with a coral ladle. Four
// arms: two curling up over the back of the rim, one draped over the front, one holding the ladle.
// The cauldron stands on clawed iron feet and waddles about on them.
//
// How she moves:
//   idle    a 12 s act: stirring, humming; a taste of the brew off the ladle (delighted); a
//           cackle, leaning back, arms wiggling.
//   walk    the cauldron waddles, a clawed foot at a time, rocking; she bobs in the ink.
//   fight   (world/aquarium.js) a plain swing is a bonk with the ladle; Ink (m.inkAt) the ladle
//           raised and flicked, ink flying off it; Tentacles (m.armsAt) every arm up out of the
//           pot, wriggling, then slammed down as the floor's marks land (1.6 s on); the call
//           (m.callAt) the ladle held up, its pearl shining, while the anglers come.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, moodOf, puff, dot, sparkle } from './rigkit.js';

const smoothPts = (pts, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return q;
};
const blob = (pts, c, n = 3) => T(smoothPts(pts, n), c);
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

const OCT = ramp('#9a6ad8', { step: 9, turn: 10 });
const HAT = ramp('#3a3a7a', { step: 8, turn: 8 });
const IRON = ramp('#5a5c6c', { step: 9, turn: 8 });
const BREW = '#2a2450';
const BREW_HI = '#5a4a9a';
const CORAL = ramp('#f0806a', { step: 8, turn: 8 });
const SUCKER = '#d8c4f8';
const ab = pairOf('ab2');

// ---------- The pieces (each facing right) ----------
// The back of the rim and the brew's surface, behind her. Box 72 x 16; potJ at (36, 26 - 16 = 10)...
// (Both pot pieces share potJ's spot: box 72 x 46, potJ at (36, 26).)
const rimBackP = () => [E(36, 9, 34, 5.4, IRON.hi), F(E(36, 9, 30, 3.8, BREW)), F(E(24, 8.4, 6, 1.2, BREW_HI))];
// The cauldron's front: the near half of the rim, the brew's near half over her middle, the iron
// belly with a shine and a band. Box 72 x 46; potJ at (36, 26).
const potP = () => [
  blob([[6, 11], [66, 11], [70.4, 23], [64, 37], [52, 42], [20, 42], [8, 37], [1.6, 23]], IRON.base, 2), crescent(36, 26, 34, 17, IRON.sh, { k: 0.18, a0: 95, a1: 205 }),
  F(taper([[12, 20], [20, 16]], 2, 1.2, IRON.hi)), F(taper([[5, 30], [36, 34.6], [67, 30]], 1.4, 1.4, IRON.sh)),
  T(arcP(36, 9, 34, 5.4, 0, 180, 16), IRON.hi), F(T(arcP(36, 9, 30, 3.8, 0, 180, 16), BREW)), F(T(arcP(36, 9.8, 30, 2.4, 20, 160, 12), IRON.base)),
];
// A clawed iron foot. Box 14 x 15; hung from (7, 2).
const footP = (far) => () => [blob([[3, 0.6], [11, 0.6], [10, 8], [13, 12.4], [9.4, 14.4], [2.4, 14.4], [1, 11], [3.6, 7.4]], far ? IRON.sh : IRON.base, 1), F(E(4, 13.6, 1.4, 1, IRON.deep)), F(E(8, 14, 1.4, 1, IRON.deep)), F(E(11.6, 13, 1.2, 0.9, IRON.deep))];
// Her mantle: a big round head, paler spots, going on down into the ink. Box 50 x 62; headJ at (25, 26).
const headP = () => [
  R2(8, 34, 34, 26, OCT.base), E(25, 24, 21, 21, OCT.base),
  ...[[12, 14, 2.6], [20, 7, 2], [36, 10, 2.2], [41, 22, 1.8], [9, 26, 2]].map(([x, y, r]) => F(E(x, y, r, r * 0.8, OCT.hi))),
  crescent(25, 24, 21, 21, OCT.sh, { k: 0.16, a0: 110, a1: 220 }), shine(25, 22, 21, 21, '#ffffff', 0, 0.55),
];
const R2 = (x, y, w, h, c) => T([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c);
// The witch's hat: a wide floppy brim wrapping her head, a crown with a teal band and a starfish.
// Box 66 x 44; on her head at (33, 38).
const hatP = () => {
  const star = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 1.5 : 3.4;
    const q = (k / 10) * TAU - Math.PI / 2;
    star.push([37 + Math.cos(q) * r, 31.6 + Math.sin(q) * r]);
  }
  return [
    blob([[1, 38], [14, 33], [33, 31], [52, 33], [65, 37], [62, 42.6], [33, 39.4], [4, 43]], HAT.base, 2), F(taper([[6, 41], [33, 38], [60, 40.6]], 1.4, 1.4, HAT.sh)),
    blob([[17, 36], [50, 35], [45, 20], [40, 8], [33, 5], [27, 10], [22, 22]], HAT.base, 2), crescent(34, 22, 14, 16, HAT.sh, { k: 0.22, a0: 140, a1: 230 }),
    F(taper([[18.4, 32], [49, 31]], 3.6, 3.6, '#5ac8c8')), F(T(star, '#ff9a5a')), F(E(37, 31.6, 1, 1, '#ffd8b0')),
  ];
};
// The hat's floppy tip, flopping back, a little star charm on its end. Box 26 x 20; hinged at (20, 17).
const tipP = () => [blob([[16, 18], [24, 18], [22, 10], [16, 4], [8, 2], [3, 5], [6, 7], [12, 8], [15, 12]], HAT.base, 2), F(taper([[18, 15], [10, 5]], 1, 0.6, HAT.hi)), E(4, 6.4, 2.6, 2.6, '#ffd36b'), F(E(3.4, 5.6, 0.9, 0.9, '#fff6c8'))];
// An arm in two: the upper reach and the curling tip, suckers down one side. Upper: box 12 x 22,
// root at (6, 2). Tip: box 16 x 22, root at (6, 2).
const upperP = (far) => () => [taper([[6, 2], [6, 19]], 8.6, 6.6, far ? OCT.sh : OCT.base), E(6, 19, 3.3, 3.3, far ? OCT.sh : OCT.base), ...[6, 11, 16].map((y) => F(E(8.6, y, 1.1, 1.1, SUCKER)))];
const tipArmP = (far) => () => [E(6, 2, 3.3, 3.3, far ? OCT.sh : OCT.base), taper([[6, 2], [6, 11], [8, 16], [12, 18], [14, 15]], 6.6, 2.2, far ? OCT.sh : OCT.base), ...[6, 11].map((y) => F(E(8.2, y, 0.9, 0.9, SUCKER)))];
// The coral ladle: a long handle, a pearl knob on top, the bowl. Box 16 x 66; gripped at (8, 14).
const ladleP = () => [taper([[8, 4], [8, 56]], 2.8, 2.4, CORAL.base), F(taper([[7, 6], [7, 50]], 0.8, 0.8, CORAL.hi)), E(8, 3.6, 3.2, 3.2, '#f4f0ff'), F(E(7, 2.6, 1, 1, '#ffffff')), E(8, 59, 6.4, 4.6, CORAL.base), F(E(8, 57.6, 5, 2, CORAL.sh)), F(E(8, 57.4, 4.6, 1.4, BREW))];

const AB = {
  RIMB: ab('rimback', 72, 16, rimBackP, 2), POT: ab('pot', 72, 46, potP, 2), FOOT: [false, true].map((f) => ab(`foot${f ? 1 : 0}`, 14, 15, footP(f), 2)),
  HEAD: ab('head', 50, 62, headP, 2), HAT: ab('hat', 66, 44, hatP, 2), TIP: ab('tip', 26, 20, tipP, 2),
  UP: [false, true].map((f) => ab(`up${f ? 1 : 0}`, 12, 22, upperP(f), 2)), TIPA: [false, true].map((f) => ab(`tipa${f ? 1 : 0}`, 16, 22, tipArmP(f), 2)),
  LADLE: ab('ladle', 16, 66, ladleP, 2),
};
// Her own face: a sea-witch octopus's. Gold eyes with an octopus's bar pupils under heavy violet lids,
// a winged flick of liner, sucker freckles on her cheeks and a knowing smirk; she cackles to shout.
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
const AB_EYES = [[30.4, 30, 1, 3.8, 4.8], [19.6, 30.4, -1, 3.3, 4.3]];
const AB_LID = '#6a3aa8';
const AB_MOUTH = '#5a1a40';
const abOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of AB_EYES) {
    const flick = (yy) => oLn([[x + s * w * 0.8, yy], [x + s * w * 1.55, yy - h * 0.45]], 0.85);
    if (mood === 'blink' || mood === 'sleep') out.push(F(T([...oArc(x, y, w * 1.05, h * 0.75, 180, 360, 10), ...oArc(x, y, w * 1.05, h * 0.38, 0, 180, 10)], AB_LID)), ...oLn(oArc(x, y, w * 1.05, h * 0.38, 0, 180, 10), 1), ...flick(y - h * 0.05));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.75, 200, 340, 8), 1), ...flick(y - h * 0.15));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 0.95));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.75, AB_LID, s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.85));
    else {
      // Heavy-lidded and knowing; slanted down to glare; thrown wide to cackle.
      const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.6 : mood === 'shout' ? () => -99 : () => y - h * 0.38;
      const wide = mood === 'shout';
      out.push(F(T(oRing(x, y - 0.4, w * 1.1, h * 1.06), AB_LID)));
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.1, w * 0.8, h * 0.8), lid), '#ffb83a')), F(T(oCut(oRing(x, y + h * 0.48, w * 0.58, h * 0.36), lid), '#ffe08a')));
      out.push(F(T(oCut(oRing(x, y + h * 0.18, w * (wide ? 0.3 : 0.56), h * (wide ? 0.13 : 0.2)), lid), INK)));
      if (!wide) out.push(F(T(oCut(oRing(x + w * 0.3, y - h * 0.08, w * 0.22, w * 0.22, 0, 8), lid), '#ffffff')), F(E(x - w * 0.32, y + h * 0.55, w * 0.1, w * 0.1, '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.3), 1.05), ...flick(y - h * 0.2));
    }
  }
  // Sucker freckles over a violet blush.
  if (mood !== 'dead') for (const [bx, by, k] of [[32.8, 35.6, 1], [17.2, 36, 0.85]]) {
    out.push(F(E(bx, by, 2.4 * k, 1.2 * k, '#b884e4')));
    for (const [dx, dy, r] of [[-1, -0.1, 0.62], [0.75, -0.45, 0.5], [0.3, 0.75, 0.42]]) out.push(F(E(bx + dx * k, by + dy * k, r * k, r * k, SUCKER)));
  }
  const [mx, my] = [25.8, 38];
  if (mood === 'shout') out.push(F(E(mx, my + 0.8, 2.3, 2.7, AB_MOUTH)), F(E(mx, my + 2.4, 1.4, 0.8, '#ff8fb0')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.4, 2.8, 2.6, 0, 180, 8), AB_MOUTH)), F(E(mx + 0.3, my + 1.3, 1.3, 0.6, '#ff8fb0')));
  else if (mood === 'angry') out.push(...oLn(oArc(mx, my + 1.6, 2.4, 1.4, 200, 340, 6), 0.8), F(T([[mx + 0.5, my + 0.35], [mx + 1.4, my + 0.5], [mx + 0.9, my + 1.4]], '#ffffff')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 2, 0.65));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.4, 0.9, 1.1, AB_MOUTH)));
  else out.push(...oLn([[mx - 2.2, my - 0.1], [mx - 0.8, my + 0.55], [mx + 0.9, my + 0.45], [mx + 2.3, my - 0.7]], 0.8), ...oLn([[mx + 2.2, my - 1.2], [mx + 2.7, my - 0.4]], 0.55));
  if (mood === 'hurt') out.push(...oDrop(33.8, 33, 1));
  return out;
};
const abFace = (mood) => faceSprite(`ab2|face|${mood}`, 50, 62, () => abOwnFace(mood));

// ---------- The skeleton ----------
const POT_Y = 20;
// Where each arm roots in the brew (bodyJ), back two then front two (the last holds the ladle).
const ARMX = [[-20, 2], [18, 1], [-15, 4], [15, 3]];
const LEN1 = 17;
const LEN2 = 15;
const FOOTX = [16, -16];
// The rest pose of each arm: [upper turn, tip turn] (0 = straight down, 90 = back, -90 = ahead).
const REST = [[150, -40], [-150, 40], [70, -55], [-120, -50]];
export const abyssiaRig = makeRig({
  w: 150, h: 140, soft: true, stride: 1e9, recover: 0.7,
  springs: {
    x: [160, 15], lift: [200, 15], tilt: [150, 12], rise: [140, 12], lean: [130, 11], head: [120, 10], hat: [90, 8],
    a0: [160, 12], b0: [140, 11], a1: [160, 12], b1: [140, 11], a2: [160, 12], b2: [140, 11], a3: [200, 15], b3: [200, 15], ladle: [200, 15],
    footN: [300, 20], footF: [300, 20], upN: [300, 20], upF: [300, 20],
  },
  fast: ['x', 'lift', 'a3', 'b3', 'ladle', 'footN', 'footF', 'upN', 'upF'],
  kick: { lean: -100, head: -140, hat: 200 },
  turnKick: { hat: 200, lean: -60 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.4;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'ab2', 26);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 12) * 12;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const taste = busy ? 0 : hold(lu, 4, 4.5, 6, 6.5);
    const cackle = busy ? 0 : hold(lu, 9, 9.4, 10.6, 11);
    const st = Math.sin(t * 2.2);
    const sc = Math.cos(t * 2.2);
    const wig = (k) => Math.sin(t * 2 + k * 1.3) * 8;
    const idle = {
      x: 0, lift: 0, tilt: Math.sin(t * 1.1) * 1.2 + cackle * Math.sin(t * 16) * 1.6, rise: Math.sin(t * 1.4) * 1.4 + cackle * 3, lean: st * 2 - cackle * 10, head: Math.sin(t * 0.9) * 3 - cackle * 8 + taste * 6, hat: Math.sin(t * 1.2) * 3,
      a0: REST[0][0] + wig(0) + cackle * Math.sin(t * 12) * 20, b0: REST[0][1] + wig(1), a1: REST[1][0] + wig(2) - cackle * Math.sin(t * 12 + 1) * 20, b1: REST[1][1] + wig(3),
      a2: REST[2][0] + wig(4) * 0.6, b2: REST[2][1] + wig(5) * 0.6,
      // Stirring: the hand going round over the rim, the ladle's bowl in the brew.
      a3: REST[3][0] + st * 8 + taste * 10, b3: REST[3][1] + sc * 10 + taste * 10, ladle: 32 + st * 6 + taste * 143,
      footN: 0, footF: 0, upN: 0, upF: 0,
    };
    // The waddle: a clawed foot up at a time, the pot rocking onto the other, a little hop.
    const steps = [pawStep(u, 0, 14, 0.55, 5), pawStep(u, 0.5, 14, 0.55, 5)];
    const sw = Math.sin(u * TAU);
    const walk = {
      ...idle, lift: Math.abs(Math.cos(u * TAU)) * 2, tilt: 4 + sw * 5, rise: Math.abs(sw) * 2, lean: 4 - sw * 3, head: -2, hat: -8 - sw * 4,
      a0: REST[0][0] + sw * 10, a1: REST[1][0] - sw * 10, a2: REST[2][0] + sw * 8, a3: -120, b3: -50, ladle: 32,
      footN: steps[0][0] * 0.6, upN: steps[0][1], footF: steps[1][0] * 0.6, upF: steps[1][1],
    };
    // A bonk with the ladle: raised high behind, then down ahead.
    const antic = { ...idle, x: -3, tilt: -6, rise: 4, lean: -12, head: -8, hat: 10, a3: 160, b3: 40, ladle: 200 };
    const strike = { ...idle, x: 6, tilt: 8, rise: -1, lean: 12, head: 6, hat: -10, a3: -100, b3: -40, ladle: -60 };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // Ink: the ladle up and flicked ahead, ink flying off it.
    const ink = window1(now, m.inkAt, 1.6, 0.2, 0.4);
    const flick = ink > 0 ? smooth(clamp((now - m.inkAt - 0.55) / 0.2, 0, 1)) : 0;
    over({ lean: -8 + flick * 14, head: -8, rise: 4, a3: 170 - flick * 210, b3: 30 - flick * 50, ladle: 190 - flick * 230 }, ink);
    // Tentacles: every arm up out of the pot, wriggling, then slammed down.
    const sl = m.armsAt == null ? null : now - m.armsAt;
    if (sl != null && sl > -0.1 && sl < 2.4) {
      const w = Math.sin(now * 14);
      if (sl < 1.6) over({ rise: 8, lean: -6, head: -10, tilt: Math.sin(now * 20) * 1.4, a0: 175 + w * 10, b0: 20 - w * 30, a1: -175 - w * 10, b1: -20 + w * 30, a2: 112 + w * 10, b2: 40 - w * 20, a3: -150 + w * 8, b3: -20, ladle: 205 }, smooth(clamp((sl + 0.1) / 0.3, 0, 1)));
      else over({ rise: -2, lean: 6, head: 8, a0: 50, b0: 40, a1: -50, b1: -40, a2: 30, b2: 30, a3: -60, b3: -30, ladle: 200, lift: sl < 1.75 ? 3 : 0 }, 1 - smooth(clamp((sl - 2) / 0.4, 0, 1)));
    }
    // The call: the ladle held up high, the pearl shining.
    const call = window1(now, m.callAt, 2, 0.3, 0.5);
    over({ rise: 6, lean: -6, head: -10, a3: -150, b3: -20, ladle: 200, a2: 120, b2: 40 }, call);
    if (m.hp <= 0) over({ rise: -8, lean: 10, head: 18, hat: 16, a0: 100, b0: 40, a1: -100, b1: -40, a2: 50, b2: 20, a3: -40, b3: 20, ladle: 60 }, 1);
    a.abInk = ink;
    a.abFlick = flick;
    a.abCall = call;
    a.abSlam = sl != null && sl > 1.6 && sl < 2.1 ? 1 - (sl - 1.6) / 0.5 : 0;
    a.abMood = m.hp <= 0 ? 'dead' : moodOf(a, call > 0.3 || cackle > 0.4 || taste > 0.5 ? 'happy' : ink > 0.3 || (sl != null && sl > 0 && sl < 2.1) ? 'angry' : null);
    return S;
  },
  follow: (S) => ({ hatLag: -S.lean * 0.5 }),
  parts: [
    { name: 'potJ', parent: null, at: (S) => [S.x, -POT_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'bodyJ', parent: 'potJ', at: (S) => [0, -16 - S.rise], rot: (S) => S.lean * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [0, -22], rot: (S) => S.head * D2R },
    { name: 'hatJ', parent: 'headJ', at: () => [0, -12], rot: (S) => (S.hat + (S.hatLag ?? 0)) * D2R },
    ...[0, 1, 2, 3].map((k) => ({ name: `elb${k}`, parent: `up${k}`, at: () => [0, LEN1] })),
    { name: 'hand', parent: 'tipa3', at: () => [3, LEN2 - 1] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const arm = (k) => {
        const far = k === 0 || k === 2;
        return [
          { name: `up${k}${tg}`, parent: 'bodyJ', s: AB.UP[far ? 1 : 0][i], pivot: [6, 2], at: () => ARMX[k], rot: (S) => (S[`a${k}`] - S.lean) * D2R },
          { name: `tipa${k}${tg}`, parent: `elb${k}`, s: AB.TIPA[far ? 1 : 0][i], pivot: [6, 2], rot: (S) => S[`b${k}`] * D2R },
        ];
      };
      const foot = (far) => ({ name: `foot${far ? 'F' : 'N'}${tg}`, parent: 'potJ', s: AB.FOOT[far ? 1 : 0][i], pivot: [7, 2], at: (S) => [FOOTX[far ? 1 : 0] + S[far ? 'footF' : 'footN'], 8 - S[far ? 'upF' : 'upN']], rot: (S) => -S.tilt * D2R });
      return [
        foot(true),
        { name: `rimb${tg}`, parent: 'potJ', s: AB.RIMB[i], pivot: [36, 26] },
        ...arm(0), ...arm(1),
        { name: `head${tg}`, parent: 'headJ', s: AB.HEAD[i], pivot: [25, 26] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => abFace(a.abMood ?? 'idle'), pivot: [25, 26] }] : []),
        { name: `tip${tg}`, parent: 'hatJ', s: AB.TIP[i], pivot: [20, 17], at: () => [2, -33], soft: { key: 'tip', dir: [-10, -8], k: 75, c: 6, gain: 0.55, turn: 0.9, hang: 0.3, max: 18 } },
        { name: `hat${tg}`, parent: 'hatJ', s: AB.HAT[i], pivot: [33, 38] },
        { name: `ladle${tg}`, parent: 'hand', s: AB.LADLE[i], pivot: [8, 14], rot: (S) => (S.ladle - S.tilt - S.lean - S.a3 + S.lean - S.b3) * D2R },
        { name: `pot${tg}`, parent: 'potJ', s: AB.POT[i], pivot: [36, 26] },
        foot(false),
        ...arm(2), ...arm(3),
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#10182a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 32, 4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The brew glooping: a bubble swelling on the surface now and then and popping.
    const P = mat('potJ');
    for (let k = 0; k < 2; k++) {
      const u = fr(a.now * 0.5 + k * 0.5);
      if (u < 0.6) {
        const [bx, by] = at2(P, -16 + k * 30, -18);
        const r = 1 + (u / 0.6) * 3;
        ctx.globalAlpha = a.alpha * 0.9;
        ctx.fillStyle = BREW_HI;
        ctx.beginPath();
        ctx.arc(bx, by - r * 0.6, r, 0, TAU);
        ctx.fill();
      } else if (u < 0.75) for (let j = 0; j < 4; j++) {
        const [bx, by] = at2(P, -16 + k * 30, -18);
        const q = (u - 0.6) / 0.15;
        dot(ctx, a, bx + Math.cos(j * 1.6) * q * 6, by - 2 - Math.abs(Math.sin(j * 1.6)) * q * 6, 0.9, 1 - q, BREW_HI);
      }
    }
    // The pearl on the ladle: a soft glow, bright when she calls.
    const [px, py] = at2(mat('ladle'), 0, -10.4);
    puff(ctx, a, px, py, 7, 0.2 + 0.06 * Math.sin(a.now * 2), '232,252,255');
    if (a.abCall > 0.05) {
      const [qx, qy] = at2(mat('ladle'), 0, 44);
      puff(ctx, a, qx, qy, 10 + a.abCall * 22, a.abCall, '232,252,255');
    }
    if (a.abCall > 0.3) { const [qx, qy] = at2(mat('ladle'), 0, 44); for (let k = 0; k < 3; k++) sparkle(ctx, a, qx + Math.cos(a.now * 2 + k * 2.1) * 14, qy + Math.sin(a.now * 2 + k * 2.1) * 10, 2.4, a.abCall); }
    // Ink flung off the ladle's bowl as she flicks it.
    if (a.abFlick > 0 && a.abInk > 0.05) {
      const [lx, ly] = at2(mat('ladle'), 0, 45);
      for (let k = 0; k < 6; k++) {
        const q = clamp(a.abFlick * 1.4 - k * 0.08, 0, 1);
        dot(ctx, a, lx + q * (18 + k * 6), ly - Math.sin(q * Math.PI) * (10 + k * 2) + q * 10, 2 - k * 0.2, a.abInk * (1 - q * 0.6), BREW_HI);
      }
    }
    // The slam's splash at each side of the pot.
    if (a.abSlam > 0) for (let k = 0; k < 6; k++) puff(ctx, a, -46 + (k % 3) * 8 + (k >= 3 ? 70 : 0), -4 - (k % 2) * 6, 6 + (k % 3) * 2, a.abSlam * 0.5, '170,150,230');
  },
});
// A still of her stirring (for anywhere a sprite is wanted), her mood's face.
export function abyssiaStill(pose, f, mood) {
  const py = -POT_Y;
  const by = py - 16;
  const hy = by - 22;
  const armAt = (k) => {
    const [ax, ay] = ARMX[k];
    const [r1, r2] = REST[k];
    const ex = ax - Math.sin(r1 * D2R) * LEN1;
    const ey = by + ay + Math.cos(r1 * D2R) * LEN1;
    return [...put(upperP(k === 0 || k === 2)(), [6, 2], ax, by + ay, r1), ...put(tipArmP(k === 0 || k === 2)(), [6, 2], ex, ey, r1 + r2)];
  };
  return {
    w: 150,
    h: 140,
    res: 2,
    shapes: shift([
      ...put(footP(true)(), [7, 2], FOOTX[1], py + 8), ...put(rimBackP(), [36, 26], 0, py), ...armAt(0), ...armAt(1),
      ...put(headP(), [25, 26], 0, hy), ...put(abOwnFace(MOODS.has(mood) ? mood : 'idle'), [25, 26], 0, hy),
      ...put(tipP(), [20, 17], 2, hy - 45), ...put(hatP(), [33, 38], 0, hy - 12),
      ...put(potP(), [36, 26], 0, py), ...put(footP(false)(), [7, 2], FOOTX[0], py + 8), ...armAt(2), ...armAt(3),
    ], 75, 136),
  };
}
