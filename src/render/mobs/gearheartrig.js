// Queen Gearheart, the Grand Automaton (redrawn 2026-11-19, the player's pick "A, the Wind-Up
// Ringmistress"): a porcelain doll ringmistress who has to perform while anyone is watching: gold
// ringlets, a red tailcoat over a white waistcoat with gold buttons and a clock brooch (its hands
// tick), white breeches, tall black boots, a little top hat ringed with gear teeth and a tiny crown,
// a star-tipped cane, and a great brass key in her back that turns as she goes (faster and faster
// once she's overwound, m.mech.phase 3; still when she's wound down).
//
// How she moves (everything on the tick, a little stepped, like clockwork):
//   idle    a 9 s act: a cane twirl; a bow with a tip of her hat; a tap step.
//   walk    a tick-tock march, the cane swinging.
//   fight   (world/carnival.js) a plain swing is a sweep of the cane; the ring toss (m.tossAt)
//           both arms flinging the rings up; then her bow (m.vulnUntil after a toss), deep and
//           open; off the beat (m.vulnUntil in the moles' game) she stumbles, her key wobbling;
//           overwound (phase 3) she jitters and her key steams; wound down at last (mood
//           'sleep') she sits, the key still, her head nodding.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, sparkle, puff } from './rigkit.js';
import { chibiLegs } from './chibilegs.js';

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
const star = (x, y, r, c, k = 0.45) => T(Array.from({ length: 10 }, (_, i) => { const q = (i / 10) * TAU - Math.PI / 2; const rr = i % 2 ? r * k : r; return [x + Math.cos(q) * rr, y + Math.sin(q) * rr]; }), c);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

const PORC = ramp('#fff4f0', { step: 6, turn: 8 });
const GOLDH = ramp('#f6c84a', { step: 9, turn: 8 });
const RED = ramp('#d83a4a', { step: 9, turn: 8 });
const WHITE = ramp('#faf6f2', { step: 6, turn: 8 });
const BOOT = ramp('#2e2a3a', { step: 7, turn: 8 });
const HATC = ramp('#2a2440', { step: 7, turn: 8 });
const BRASS = ramp('#f0c040', { step: 9, turn: 8 });
const gh = pairOf('gh2');

// ---------- The pieces (each facing right) ----------
// Her head: porcelain, bangs of gold, and the little top hat: a ring of gear teeth round its band,
// a tiny crown on top with a star. Box 44 x 66; the neck at (22, 62), the head's middle at (22, 44).
const headP = () => {
  const teeth = Array.from({ length: 8 }, (_, i) => { const x = 13 + i * 2.6; return T([[x - 0.9, 24], [x + 0.9, 24], [x + 0.7, 21.6], [x - 0.7, 21.6]], BRASS.base); });
  return [
    E(22, 44, 15, 14.4, PORC.base), crescent(22, 44, 15, 14.4, PORC.sh, { k: 0.12, a0: 110, a1: 220 }),
    blob([[7, 42], [9, 33], [22, 30], [35, 33], [37, 42], [31, 38], [25, 40.6], [19, 37.6], [13, 40]], GOLDH.base, 2), F(taper([[12, 35], [20, 32.4]], 1.2, 0.6, GOLDH.hi)),
    blob([[5, 33], [40, 31], [40, 34.6], [5, 36.6]], HATC.base, 1),
    blob([[11, 33], [33, 32], [32, 13], [12, 13]], HATC.base, 1), F(taper([[12, 29], [32.6, 28]], 3.4, 3.4, RED.base)), ...teeth, F(taper([[12, 24.4], [32, 24.4]], 1.4, 1.4, BRASS.sh)), F(taper([[14, 16], [16, 30]], 1.2, 1, HATC.hi)),
    T([[16, 13.4], [28, 13.4], [29, 7], [26, 10], [22, 5], [18, 10], [15, 7]], BRASS.base), F(star(22, 3.6, 2.6, BRASS.hi)),
  ];
};
const FACE = { eyes: [[27.4, 45, 3.4, 4.3, 1], [17.6, 45.4, 3, 3.9, -1]], mouth: [23.4, 52, 2.4], blush: [[29.4, 49.6, 2.4], [15.2, 49.8, 2]], iris: '#3a8ad8', k: 1.7, lid: 0, lashes: 1 };
const ghFace = (mood) => faceSprite(`gh2|face|${mood}`, 44, 66, () => faceShapes(mood, FACE));
// The ringlets behind her head and a ringlet hanging at each side. Back: box 40 x 34, behind the
// head's middle at (20, 14). Ringlet: box 10 x 22, hung from (5, 1).
const hairBackP = () => [E(20, 14, 16, 14, GOLDH.sh), ...[5, 12, 28, 35].map((x, k) => E(x, 24 + (k % 2) * 2, 4.6, 4.6, GOLDH.sh))];
const ringletP = (far) => () => [0, 1, 2].map((k) => E(5, 4 + k * 6, 3.8 - k * 0.4, 3.6 - k * 0.3, far ? GOLDH.sh : GOLDH.base)).concat([F(E(4, 15, 1, 1.4, GOLDH.hi))]);
// The tailcoat's front: red, a white waistcoat, gold buttons, a clock brooch. Box 30 x 32; bodyJ at (15, 26).
const coatP = () => [
  blob([[4, 3], [26, 3], [28, 18], [26, 30], [4, 30], [2, 18]], RED.base, 2), crescent(15, 17, 13, 14, RED.sh, { k: 0.2, a0: 100, a1: 200 }),
  T([[12, 3], [20, 3], [19, 28], [13, 28]], WHITE.base), F(taper([[16, 4], [16, 27]], 0.6, 0.6, WHITE.sh)),
  ...[10, 16, 22].map((y) => F(E(21.6, y, 1.2, 1.2, BRASS.base))), E(9, 11, 4, 4, BRASS.base), F(E(9, 11, 2.8, 2.8, '#fff8e0')),
  F(taper([[3, 25], [27, 25]], 2.4, 2.4, BRASS.sh)),
];
// The tails behind her. Box 18 x 22; hung from (14, 1).
const tailsP = () => [blob([[15, 1], [4, 3], [1, 20], [6, 18], [10, 21], [15, 10]], RED.sh, 2), F(taper([[2, 19], [10, 19.4]], 1, 1, BRASS.base))];
// Legs: white breeches, tall black boots with a gold button.
const thighP = (far) => () => [taper([[4.5, 2], [4.5, 10.6]], 7.4, 7, far ? WHITE.sh : WHITE.base), E(4.5, 10.6, 3.5, 3.5, far ? WHITE.sh : WHITE.base)];
const shinP = (far) => () => [E(4.5, 2, 3.5, 3.5, far ? BOOT.sh : BOOT.base), taper([[4.5, 2], [4.5, 10]], 7, 6.6, far ? BOOT.sh : BOOT.base), F(taper([[1.4, 3.4], [7.6, 3.4]], 1.2, 1.2, BRASS.base))];
const bootP = (far) => () => [blob([[1, 0.4], [7.6, 0.4], [11.6, 3.6], [11, 6], [0.6, 6]], far ? BOOT.sh : BOOT.base, 1), F(taper([[1, 5.4], [11, 5.4]], 1.2, 1.2, BOOT.deep)), F(E(8.4, 2.4, 1.4, 0.7, '#5a5664'))];
// Arms: red sleeve, a gold cuff, a white glove. Upper: box 12 x 9 at (2, 4.5); fore: box 14 x 9 at (2, 4.5).
const upP = (far) => () => [taper([[2, 4.5], [8, 4.5]], 7, 6.4, RED.deep), E(8, 4.5, 3.3, 3.3, RED.deep), taper([[2, 4.5], [8, 4.5]], 5.6, 5, far ? RED.sh : RED.base), E(8, 4.5, 2.6, 2.6, far ? RED.sh : RED.base)];
const foreP = (far) => () => [E(2, 4.5, 3.3, 3.3, RED.deep), taper([[2, 4.5], [7, 4.5]], 6.4, 6, RED.deep), E(2, 4.5, 2.6, 2.6, far ? RED.sh : RED.base), taper([[2, 4.5], [7, 4.5]], 5, 4.6, far ? RED.sh : RED.base), F(taper([[6.6, 2.4], [6.6, 6.6]], 1.4, 1.4, BRASS.base)), E(9.8, 4.5, 3, 2.8, far ? WHITE.sh : WHITE.base)];
// The cane: gold, a star on top. Box 12 x 48; gripped at (6, 16).
const caneP = () => [taper([[6, 46], [6, 9]], 1.8, 1.6, BRASS.base), F(taper([[5.4, 44], [5.4, 11]], 0.5, 0.4, '#fff2b0')), E(6, 46, 1.4, 1.4, BRASS.sh), star(6, 5, 5, BRASS.base), F(E(5.4, 4.4, 1, 1, '#ffffff'))];
// Her great key, turning: the stem, then its bow seen at four turns (face on, turning, edge on,
// turning back). Box 28 x 20; the stem's root at (1, 10).
const KEYW = [7, 4.6, 1.4, 4.6];
const keyP = (k) => () => {
  const w = KEYW[k];
  return [
    taper([[1, 10], [14, 10]], 3, 3, BRASS.sh), F(R(9, 11.4, 3, 2.6, BRASS.sh)),
    E(20, 5.4, w, 5, BRASS.base), E(20, 14.6, w, 5, BRASS.base), ...(w > 2 ? [F(E(20, 5.4, w * 0.4, 2, BRASS.deep)), F(E(20, 14.6, w * 0.4, 2, BRASS.deep))] : []),
    F(E(20 - w * 0.4, 4, Math.max(0.6, w * 0.25), 1.2, BRASS.hi)),
  ];
};

const SP = {
  HEAD: gh('head', 44, 66, headP, 2), BACK: gh('hairback', 40, 34, hairBackP, 2), RING: [false, true].map((f) => gh(`ringlet${f ? 1 : 0}`, 10, 22, ringletP(f), 2)),
  COAT: gh('coat', 30, 32, coatP, 2), TAILS: gh('tails', 18, 22, tailsP, 2),
  THIGH: [false, true].map((f) => gh(`thigh${f ? 1 : 0}`, 9, 14, thighP(f), 2)), SHIN: [false, true].map((f) => gh(`shin${f ? 1 : 0}`, 9, 13, shinP(f), 2)), BOOT: [false, true].map((f) => gh(`boot${f ? 1 : 0}`, 13, 7, bootP(f), 2)),
  UP: [false, true].map((f) => gh(`up${f ? 1 : 0}`, 12, 9, upP(f), 2)), FORE: [false, true].map((f) => gh(`fore${f ? 1 : 0}`, 14, 9, foreP(f), 2)),
  CANE: gh('cane', 12, 48, caneP, 2), KEY: [0, 1, 2, 3].map((k) => gh(`key${k}`, 28, 20, keyP(k), 2)),
};

// ---------- The skeleton ----------
const BODY_Y = 25;
const L1 = 9;
const L2 = 9;
const LEGS = chibiLegs({ bodyY: BODY_Y, l1: L1, l2: L2, sole: 5, hips: [[5, 2], [-4, 2]], feet: [6, -5] });
const FEET = [6, -5];
const SHN = [8, -17];
const SHF = [-7, -17];
const NECK = [1, -22];
const UA = 7;
// (On the tick: a value that steps from beat to beat, easing quickly between.)
const ticked = (t, n) => {
  const s = t * n;
  const i = Math.floor(s);
  return (i + smooth(clamp((s - i) * 3, 0, 1))) / n;
};
export const gearheartRig = makeRig({
  w: 120, h: 140, soft: true, stride: 1e9, recover: 0.6,
  springs: {
    x: [240, 18], lift: [240, 17], tilt: [190, 13], head: [150, 11], cane: [220, 15], hat: [120, 9],
    armN: [240, 17], elbN: [240, 17], armF: [220, 16], elbF: [220, 16],
    thighN: [360, 22], thighF: [360, 22], shinN: [360, 22], shinF: [360, 22], rollN: [340, 20], rollF: [340, 20],
  },
  fast: ['x', 'lift', 'tilt', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF', 'cane'],
  kick: { tilt: -130, head: -180 },
  turnKick: { head: 60 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'gh2', 20);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const over3 = m.mech?.phase === 3 && m.hp > 0 ? 1 : 0;
    const rest = a.mood === 'sleep' ? 1 : 0;
    const lu = fr(t / 9) * 9;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const twirl = busy ? 0 : hold(lu, 1.4, 1.8, 3.4, 3.8);
    const bow = busy ? 0 : hold(lu, 5, 5.5, 6.4, 7);
    // Everything on the tick: two beats a second, four once she's overwound.
    const tk = ticked(t, 2 + over3 * 2);
    const beat = Math.sin(tk * TAU * 0.5);
    const tap = Math.max(0, beat);
    a.ghSpin = rest || m.hp <= 0 ? 0 : 1;
    a.ghKeyT = (a.ghKeyT ?? 0) + a.dt * (rest ? 0 : 3 + over3 * 6);
    const liftI = beat * 0.6 - bow * 3;
    const tiltI = beat * 2 + bow * 26;
    const idle = {
      x: 0, lift: liftI, tilt: tiltI, head: -beat * 4 + bow * 16, hat: bow * 30, cane: twirl * Math.sin(t * 8) * 100 + bow * 30,
      armN: 70 - twirl * 30 + bow * 20, elbN: -30 + twirl * 30, armF: 120 - bow * 230, elbF: -30 + bow * -40,
      ...LEGS.at(liftI, tiltI, [FEET[0] + tap * 2, tap * 3], [FEET[1] - bow * 4, 0]),
    };
    // The tick-tock march.
    const steps = [pawStep(u, 0, 20, 0.58, 4), pawStep(u, 0.5, 20, 0.58, 4)];
    const sw = Math.sin(u * TAU);
    const liftW = 0.6 + Math.abs(Math.cos(u * TAU)) * 1.4;
    const walk = {
      ...idle, lift: liftW, tilt: 3, head: -3 + sw * 3, hat: -sw * 4, cane: sw * 24, armN: 70 + sw * 30, elbN: -30, armF: 110 - sw * 30, elbF: -30,
      ...LEGS.at(liftW, 3, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]),
    };
    // The cane's sweep: wound back behind her, then swept round ahead.
    const antic = { ...idle, x: -2, lift: 0.6, tilt: -10, head: -8, hat: -6, armN: 160, elbN: -30, cane: -120, armF: 40, elbF: -30, ...LEGS.at(0.6, -10, [FEET[0] - 2, 0], [FEET[1] - 3, 0]) };
    const strike = { ...idle, x: 7, lift: -1.4, tilt: 14, head: 8, hat: 8, armN: 0, elbN: 0, cane: 90, armF: -80, elbF: -40, ...LEGS.at(-1.4, 14, [FEET[0] + 7, 0], [FEET[1] - 1, 0]) };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // The ring toss: both arms flung up as the rings go; then the deep bow, open to a hit.
    const toss = window1(now, m.tossAt, 1, 0.15, 0.4);
    over({ lift: 2, tilt: -10, head: -14, armN: -10, elbN: -40, armF: -70, elbF: -40, cane: 20 }, toss);
    const vuln = m.vulnUntil > now ? 1 : 0;
    const bowing = vuln && m.tossAt != null && now - m.tossAt < 5 ? 1 : 0;
    if (bowing) over({ lift: -3, tilt: 30, head: 18, hat: 34, armN: 80, elbN: -20, cane: 40, armF: -110, elbF: -60, ...LEGS.at(-3, 30, [FEET[0] + 3, 0], [FEET[1] - 5, 0]) }, smooth(clamp((now - m.tossAt - 1.4) / 0.4, 0, 1)));
    // Off the beat: a stumble, the key wobbling.
    if (vuln && !bowing) {
      const wob = Math.sin(now * 5);
      over({ tilt: wob * 12, head: Math.sin(now * 5 + 1) * 14, hat: wob * 10, armN: 40 + wob * 30, armF: 80 - wob * 30, ...LEGS.at(0, wob * 12, [FEET[0] + wob * 3, Math.max(0, wob) * 3], [FEET[1] + wob * 3, Math.max(0, -wob) * 3]) }, 1);
    }
    // Overwound: a jitter on every tick.
    if (over3 && !vuln) over({ tilt: S.tilt + Math.sin(now * 40) * 1.6, head: S.head + Math.sin(now * 33) * 2 }, 1);
    // Wound down: she sits, the key still, her head nodding.
    if (rest || m.hp <= 0) over({ lift: -13, tilt: -6, head: 16 + Math.sin(t * 0.8) * 4, hat: 10, armN: 60, elbN: -20, cane: 40, armF: 100, elbF: -30, ...LEGS.at(-13, -6, [FEET[0] + 12, 2], [FEET[1] + 15, 2]) }, 1);
    a.ghOver = over3;
    a.ghRest = rest;
    a.ghMood = m.hp <= 0 && !rest ? 'dead' : rest ? 'sleep' : vuln && !bowing ? 'dizzy' : bowing || twirl > 0.4 || bow > 0.4 ? 'happy' : over3 ? 'angry' : null;
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => NECK, rot: (S) => (S.head - S.tilt * 0.3) * D2R },
    { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
    { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
    { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 'handN', parent: 'foreN', at: () => [10, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const leg = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `boot${k}${tg}`, parent: `ankle${k}`, s: SP.BOOT[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
          { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [4.5, 2], rot: (S) => S[`shin${k}`] * D2R },
          { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [4.5, 2], at: () => (far ? [-4, 2] : [5, 2]), rot: (S) => S[`thigh${k}`] * D2R },
        ];
      };
      const arm = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `up${k}${tg}`, parent: 'bodyJ', s: SP.UP[j][i], pivot: [2, 4.5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
          { name: `fore${k}${tg}`, parent: `elbow${k}`, s: SP.FORE[j][i], pivot: [2, 4.5], rot: (S) => S[`elb${k}`] * D2R },
        ];
      };
      return [
        { name: `key${tg}`, parent: 'bodyJ', s: (a) => SP.KEY[a.ghSpin ? Math.floor(fr(a.ghKeyT ?? 0) * 4) : 0][i](), pivot: [1, 10], at: () => [-9, -10], rot: (S, a) => (180 + (a.ghMood === 'dizzy' ? Math.sin(a.now * 9) * 12 : 0)) * D2R },
        { name: `tails${tg}`, parent: 'bodyJ', s: SP.TAILS[i], pivot: [14, 1], at: () => [-7, 2], soft: { key: 'tails', dir: [-5, 10], k: 95, c: 6.5, gain: 0.55, turn: 0.9, hang: 0.55, max: 16 } },
        { name: `ringF${tg}`, parent: 'headJ', s: SP.RING[1][i], pivot: [5, 1], at: () => [-14, -14], soft: { key: 'ringF', dir: [0, 10], k: 70, c: 6, gain: 0.55, turn: 1, hang: 0.6, max: 18, flutter: 2.5, hz: 0.45 } },
        { name: `hairback${tg}`, parent: 'headJ', s: SP.BACK[i], pivot: [20, 14], at: () => [-1, -18] },
        ...arm(true),
        ...leg(true), ...leg(false),
        { name: `coat${tg}`, parent: 'bodyJ', s: SP.COAT[i], pivot: [15, 26] },
        { name: `ringN${tg}`, parent: 'headJ', s: SP.RING[0][i], pivot: [5, 1], at: () => [12, -12], soft: { key: 'ringN', dir: [0, 10], k: 70, c: 6, gain: 0.55, turn: 1, hang: 0.6, max: 18, flutter: 2.5, hz: 0.45 } },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [22, 62] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => ghFace(moodOf(a, a.ghMood)), pivot: [22, 62] }] : []),
        { name: `cane${tg}`, parent: 'handN', s: SP.CANE[i], pivot: [6, 16], rot: (S) => (S.cane - S.tilt - S.armN - S.elbN) * D2R },
        ...arm(false),
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a1a2a';
    ctx.beginPath();
    ctx.ellipse(0, -0.6, 22, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    // The clock brooch's hands, ticking.
    const B = mat('coat');
    const [cx, cy] = at2(B, -6, -15);
    const tick = Math.floor((a.ghKeyT ?? 0) * 2) / 2;
    ctx.globalAlpha = a.alpha;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(tick * 0.5) * 2.2, cy - Math.cos(tick * 0.5) * 2.2);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(tick * 0.04) * 1.4, cy - Math.cos(tick * 0.04) * 1.4);
    ctx.stroke();
    if (m.hp <= 0 || a.ghRest) return;
    // Overwound: steam off the key.
    if (a.ghOver) {
      const [kx, ky] = at2(mat('key'), 20, 0);
      for (let k = 0; k < 2; k++) {
        const u = fr(a.now * 1.2 + k / 2);
        puff(ctx, a, kx - u * 8, ky - u * 22, 3 + u * 5, (1 - u) * 0.6);
      }
    }
    // The cane's star flashing through the sweep.
    if (a.ph.strike > 0.15) {
      const [sx, sy] = at2(mat('cane'), 0, -11);
      sparkle(ctx, a, sx, sy, 8 * a.ph.strike, a.ph.strike, '#fff2b0');
    }
  },
});
// A still of her standing (for anywhere a sprite is wanted), her mood's face.
export function gearheartStill(pose, f, mood) {
  const by = -BODY_Y;
  const [nx, ny] = [NECK[0], by + NECK[1]];
  const Lg = LEGS.at(0, 0);
  const leg = (k, far) => {
    const [hx, hy] = far ? [-4, 2] : [5, 2];
    const th = Lg[`thigh${k}`];
    const sh = Lg[`shin${k}`];
    const kx = hx - Math.sin(th * D2R) * L1;
    const ky = by + hy + Math.cos(th * D2R) * L1;
    const ax = kx - Math.sin((th + sh) * D2R) * L2;
    const ay = ky + Math.cos((th + sh) * D2R) * L2;
    return [...put(thighP(far)(), [4.5, 2], hx, by + hy, th), ...put(shinP(far)(), [4.5, 2], kx, ky, th + sh), ...put(bootP(far)(), [4, 1], ax, ay, 0)];
  };
  const arm = (far, a1, a2) => {
    const [sx, sy] = far ? SHF : SHN;
    const ex = sx + Math.cos(a1 * D2R) * UA;
    const ey = by + sy + Math.sin(a1 * D2R) * UA;
    return [...put(upP(far)(), [2, 4.5], sx, by + sy, a1), ...put(foreP(far)(), [2, 4.5], ex, ey, a1 + a2)];
  };
  const [hx2, hy2] = [SHN[0] + Math.cos(70 * D2R) * UA + Math.cos(40 * D2R) * 10, by + SHN[1] + Math.sin(70 * D2R) * UA + Math.sin(40 * D2R) * 10];
  return {
    w: 120,
    h: 140,
    res: 2,
    shapes: shift([
      ...put(keyP(0)(), [1, 10], -9, by - 10, 180), ...put(tailsP(), [14, 1], -7, by + 2), ...put(ringletP(true)(), [5, 1], nx - 14, ny - 14), ...put(hairBackP(), [20, 14], nx - 1, ny - 18),
      ...arm(true, 120, -30), ...leg('F', true), ...leg('N', false), ...put(coatP(), [15, 26], 0, by), ...put(ringletP(false)(), [5, 1], nx + 12, ny - 12),
      ...put(headP(), [22, 62], nx, ny), ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', FACE), [22, 62], nx, ny),
      ...put(caneP(), [6, 16], hx2, hy2, 0), ...arm(false, 70, -30),
    ], 60, 136),
  };
}
