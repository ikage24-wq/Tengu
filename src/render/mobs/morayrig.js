// The Twin Morays, Murri and Ena (redrawn 2026-11-19, the player's pick "B, the Moray Hoodie
// Twins"): two little girls in moray-eel onesies. The hood is an eel's head with soft felt teeth
// round the face and a lower jaw under the chin that opens and snaps; a fin down the back of the
// hood, an eel's tail trailing from the onesie. Murri green with dark spots and teal bangs; Ena
// gold with frilly cheek fins on her hood and orange bangs. Every loose layer (the hood's fin,
// Ena's frills, the tail's tip) swings on its own (rig.js soft layers).
//
// How they move:
//   idle    a 12 s act: "chomp chomp", hands up like claws by her cheeks while the hood's jaw
//           snaps; chasing her own tail, a look back and a pat as it swishes up; breathing, the
//           tail waving.
//   walk    a skipping toddle, arms swinging, the tail swishing behind.
//   fight   (world/aquarium.js) a plain swing is a "Chomp!", arms up wide then clapped shut in
//           front like jaws; in her burrow (m.burrowed) she crouches and peeks, cupping her mouth
//           to spit bubbles (m.spitAt); before her lunge (m.aim) she crouches low, arms together
//           ahead like an eel's head, wiggling; the lunge itself (m.charging) a swimming dive along
//           the floor, arms ahead, legs kicking; alone (m.enraged) she stomps and huffs bubbles.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, pawStep, put, shift, MOODS, moodOf, faceShapes, puff } from './rigkit.js';

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
const SKIN = ramp('#ffe6da', { step: 7, turn: 8 });

const TWIN = {
  murri: { body: ramp('#5fb07a', { step: 9, turn: 8 }), spot: '#3f8a5a', belly: '#e4f6cc', fin: ramp('#2e7a5a', { step: 8, turn: 8 }), hair: ramp('#2e5050', { step: 7, turn: 8 }), iris: '#2a6a4a' },
  ena: { body: ramp('#ffc44a', { step: 9, turn: 8 }), spot: null, belly: '#fff4d0', fin: ramp('#ff9a4a', { step: 8, turn: 8 }), hair: ramp('#e8683a', { step: 8, turn: 8 }), iris: '#a0501a' },
};

// ---------- The pieces (each drawn facing right) ----------
// The hood: an eel's head, its front bulging forward over the face, the face in its open mouth
// with felt teeth round the top, the bangs under them. Box 52 x 50; the neck at (24, 46).
const hoodP = (c) => () => {
  const C = TWIN[c];
  const teeth = arcP(28, 28.6, 14.8, 13.8, 204, 336, 6).map(([x, y]) => {
    const a = Math.atan2(28.6 - y, 28 - x);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    return F(T([[x - sa * 1.7, y + ca * 1.7], [x + sa * 1.7, y - ca * 1.7], [x + ca * 3, y + sa * 3]], '#ffffff'));
  });
  return [
    E(24, 25, 22, 21, C.body.base), E(35, 19, 13, 11, C.body.base),
    crescent(24, 25, 22, 21, C.body.sh, { k: 0.15, a0: 110, a1: 220 }), F(E(30, 8.6, 7, 2.2, C.body.hi)),
    ...(C.spot ? [[8, 20, 2.4], [6, 31, 2], [13, 10, 1.8], [16, 38, 1.6], [44, 12, 1.4]].map(([x, y, r]) => F(E(x, y, r, r * 0.9, C.spot))) : []),
    E(28, 28.6, 14.4, 13.4, SKIN.base), F(crescentFlat(28, 28.6, 14.4, 13.4)),
    blob([[13, 25], [15.6, 18], [23, 15], [32, 15.2], [40, 18.6], [43.4, 25], [39, 21.6], [34, 23.6], [29, 21.4], [23.6, 23.6], [18, 22]], C.hair.base, 2),
    F(taper([[19, 18], [26, 16.4]], 1, 0.6, C.hair.hi)),
    ...teeth,
  ];
};
// (A soft shade inside the face's top edge, where the hood hangs over it.)
const crescentFlat = (x, y, rx, ry) => crescent(x, y, rx, ry, SKIN.sh, { k: 0.3, a0: 200, a1: 340 });
// The hood's lower jaw, under her chin: three felt teeth up its edge. Box 36 x 14; hinged at (3, 4).
const jawP = (c) => () => {
  const C = TWIN[c];
  return [
    blob([[1, 2.4], [14, 4.4], [30, 3], [35, 6], [31, 11.4], [14, 12.4], [3, 9.4]], C.body.base, 2), F(taper([[6, 10.4], [30, 9.6]], 1.2, 1, C.body.sh)),
    ...[16, 23, 29.4].map((x) => F(T([[x - 1.7, 4.6], [x + 1.7, 4.4], [x, 1.4]], '#ffffff'))),
  ];
};
// The fin down the back of the hood: rooted in the hood's top. Box 24 x 28; its root at (18, 26).
const finP = (c) => () => {
  const F0 = TWIN[c].fin;
  return [blob([[13, 27], [22, 26], [20, 16], [12, 6], [3, 2], [3.4, 10], [8, 19]], F0.base, 2), ...[0, 1, 2].flatMap((k) => line([[16 - k * 3, 25], [8 - k * 2.6, 9 + k * 2]], 0.6, F0.sh))];
};
// Ena's cheek frills on her hood: back (pointing back and down) and front. Box 16 x 14; root at (13, 6).
const frillP = (c, front) => () => {
  const F0 = TWIN[c].fin;
  return [blob([[14, 3], [3, 0.6], [1, 8], [5, 13], [14, 9]], front ? F0.base : F0.sh, 2), ...line([[12, 5], [4, 4]], 0.5, F0.deep), ...line([[12, 7.4], [4.6, 9.4]], 0.5, F0.deep)];
};
// The onesie's body: a round tummy patch, a zip pull at the collar, spots. Box 30 x 30; bodyJ at (15, 24).
const torsoP = (c) => () => {
  const C = TWIN[c];
  return [
    blob([[4.6, 3], [25.4, 3], [28, 17], [26, 28], [4, 28], [2, 17]], C.body.base, 2), crescent(15, 17, 13, 13, C.body.sh, { k: 0.18, a0: 100, a1: 200 }),
    F(E(16.6, 18, 7, 7.6, C.belly)), F(E(18.6, 6.4, 1.4, 2, '#ffd36b')), F(taper([[18.6, 4], [18.6, 9]], 0.6, 0.6, '#c89a3a')),
    ...(C.spot ? [[7, 12, 1.8], [6, 23, 1.6], [24, 10, 1.4]].map(([x, y, r]) => F(E(x, y, r, r, C.spot))) : []),
  ];
};
// The tail, in two: from the onesie's seat, then on to a small fin. Root boxes: 30 x 14 at (3, 6); 28 x 14 at (2, 6).
const tail1P = (c) => () => {
  const C = TWIN[c];
  return [taper([[3, 6], [15, 6.6], [28, 7]], 10, 7, C.body.base), F(taper([[4, 2.4], [16, 3], [27, 4]], 1.8, 1.4, C.fin.base)), ...(C.spot ? [F(E(12, 7.4, 1.6, 1.4, C.spot)), F(E(21, 7.6, 1.4, 1.2, C.spot))] : [F(taper([[5, 9], [26, 9.6]], 1, 0.8, C.belly))])];
};
const tail2P = (c) => () => {
  const C = TWIN[c];
  return [blob([[19, 6], [27, 1], [26.4, 11.6]], C.fin.base, 1), taper([[2, 6], [12, 6.4], [22, 6]], 7, 2.6, C.body.base), F(taper([[3, 3], [16, 3.6]], 1.4, 0.8, C.fin.base))];
};
// A leg in the onesie: thigh and shin round at the knee on both, a soft onesie foot.
const thighP = (c, far) => () => {
  const col = far ? TWIN[c].body.sh : TWIN[c].body.base;
  return [taper([[4.5, 2], [4.5, 9]], 7.4, 7, col), E(4.5, 9, 3.5, 3.5, col)];
};
const shinP = (c, far) => () => {
  const col = far ? TWIN[c].body.sh : TWIN[c].body.base;
  return [E(4.5, 2, 3.5, 3.5, col), taper([[4.5, 2], [4.5, 8.6]], 7, 6.6, col)];
};
const footP = (c, far) => () => {
  const C = TWIN[c];
  return [blob([[1.2, 0.4], [8, 0.4], [11.4, 3.6], [10.6, 6], [0.8, 6]], far ? C.body.sh : C.body.base, 1), F(taper([[1.6, 5.2], [10.4, 5.2]], 1.4, 1.4, C.fin.base))];
};
// An arm in the onesie's sleeve: upper arm, then forearm and a mitten-round hand. The sleeves are
// darker at the edge so they show against her own body.
const upP = (c, far) => () => {
  const C = TWIN[c];
  const col = far ? C.body.sh : C.body.base;
  return [taper([[2, 4], [8, 4]], 7, 6.4, C.body.deep), E(8, 4, 3.3, 3.3, C.body.deep), taper([[2, 4], [8, 4]], 5.6, 5, col), E(8, 4, 2.6, 2.6, col)];
};
const foreP = (c, far) => () => {
  const C = TWIN[c];
  const col = far ? C.body.sh : C.body.base;
  return [E(2, 4.5, 3.3, 3.3, C.body.deep), taper([[2, 4.5], [7, 4.5]], 6.4, 6, C.body.deep), E(2, 4.5, 2.6, 2.6, col), taper([[2, 4.5], [7, 4.5]], 5, 4.6, col), F(taper([[6.6, 2.6], [6.6, 6.4]], 1.2, 1.2, C.fin.base)), E(9.6, 4.5, 3, 2.8, far ? SKIN.sh : SKIN.base)];
};

const SPR = {};
const sprites = (c) => {
  if (SPR[c]) return SPR[c];
  const p = pairOf(`mh${c}`);
  SPR[c] = {
    hood: p('hood', 52, 50, hoodP(c), 2), jaw: p('jaw', 36, 14, jawP(c), 2), fin: p('fin', 24, 28, finP(c), 2), torso: p('torso', 30, 30, torsoP(c), 2),
    frill: [false, true].map((f) => p(`frill${f ? 1 : 0}`, 16, 14, frillP(c, f), 2)),
    tail1: p('tail1', 30, 14, tail1P(c), 2), tail2: p('tail2', 28, 14, tail2P(c), 2),
    thigh: [false, true].map((f) => p(`thigh${f ? 1 : 0}`, 9, 13, thighP(c, f), 2)), shin: [false, true].map((f) => p(`shin${f ? 1 : 0}`, 9, 12, shinP(c, f), 2)), foot: [false, true].map((f) => p(`foot${f ? 1 : 0}`, 12, 7, footP(c, f), 2)),
    up: [false, true].map((f) => p(`up${f ? 1 : 0}`, 12, 8, upP(c, f), 2)), fore: [false, true].map((f) => p(`fore${f ? 1 : 0}`, 14, 9, foreP(c, f), 2)),
  };
  return SPR[c];
};
const faceCfg = (c) => ({ eyes: [[32.6, 29.4, 3.4, 4.2, 1], [23.2, 29.8, 2.9, 3.8, -1]], mouth: [28.6, 36.2, 2.8], blush: [[34.4, 33.6, 2.3], [21.4, 33.8, 1.9]], iris: TWIN[c].iris, k: 1.7, lid: 0, lashes: 1 });
const faceOf = (c, mood) => faceSprite(`mh${c}|face|${mood}`, 52, 50, () => faceShapes(mood, faceCfg(c)));

// ---------- The skeleton ----------
const BODY_Y = 20;
const L1 = 7;
const L2 = 7;
const SOLE = 5;
const HIPS = [[5, 2], [-4, 2]];
const FEET = [6, -5];
const UA = 6;
const FA = 6;
const SHN = [7, -15];
const SHF = [-6, -15];
const NECK = [1, -20];
function legIK(dx, dy) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(3, Math.hypot(dx, dy)));
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const k = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - h) / D2R, (Math.PI - k) / D2R];
}
// The legs reaching their feet on the floor (each foot: [x, raised]) under a body at `lift`, `tilt`.
const legsAt = (lift, tilt, n = [FEET[0], 0], f = [FEET[1], 0]) => {
  const out = {};
  const r = tilt * D2R;
  [['N', HIPS[0], n], ['F', HIPS[1], f]].forEach(([k, [hx, hy], [fx, up]]) => {
    const hipX = hx * Math.cos(r) - hy * Math.sin(r);
    const hipY = -BODY_Y - lift + hx * Math.sin(r) + hy * Math.cos(r);
    const [th, sh] = legIK(fx - hipX, -SOLE - up - hipY);
    out[`thigh${k}`] = th - tilt;
    out[`shin${k}`] = sh;
    out[`roll${k}`] = up * 3;
  });
  return out;
};

function twinRig(c) {
  const S0 = sprites(c);
  const pass = (bare) => {
    const i = bare ? 1 : 0;
    const t = bare ? 'b' : '';
    const leg = (far) => {
      const k = far ? 'F' : 'N';
      const j = far ? 1 : 0;
      return [
        { name: `foot${k}${t}`, parent: `ankle${k}`, s: S0.foot[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
        { name: `shin${k}${t}`, parent: `knee${k}`, s: S0.shin[j][i], pivot: [4.5, 2], rot: (S) => S[`shin${k}`] * D2R },
        { name: `thigh${k}${t}`, parent: 'bodyJ', s: S0.thigh[j][i], pivot: [4.5, 2], at: () => HIPS[j], rot: (S) => S[`thigh${k}`] * D2R },
      ];
    };
    const arm = (far) => {
      const k = far ? 'F' : 'N';
      const j = far ? 1 : 0;
      return [
        { name: `up${k}${t}`, parent: 'bodyJ', s: S0.up[j][i], pivot: [2, 4], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
        { name: `fore${k}${t}`, parent: `elbow${k}`, s: S0.fore[j][i], pivot: [2, 4.5], rot: (S) => S[`elb${k}`] * D2R },
      ];
    };
    return [
      { name: `tail2${t}`, parent: 'tailEnd', s: S0.tail2[i], pivot: [2, 6], rot: (S) => S.tail2 * D2R, soft: { key: 'tail2', dir: [20, 0], k: 90, c: 6, gain: 0.5, turn: 0.8, max: 22 } },
      { name: `tail1${t}`, parent: 'bodyJ', s: S0.tail1[i], pivot: [3, 6], at: () => [-9, 1], rot: (S) => S.tail * D2R },
      { name: `fin${t}`, parent: 'headJ', s: S0.fin[i], pivot: [18, 26], at: () => [-12, -34], soft: { key: 'fin', dir: [-8, -12], k: 75, c: 6, gain: 0.55, turn: 0.9, hang: 0.3, max: 18 } },
      ...(c === 'ena' ? [{ name: `frillF${t}`, parent: 'headJ', s: S0.frill[0][i], pivot: [13, 6], at: () => [-18, -16], rot: () => -10 * D2R, soft: { key: 'frillF', dir: [-7, 1], k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 } }] : []),
      ...arm(true),
      ...leg(true), ...leg(false),
      { name: `torso${t}`, parent: 'bodyJ', s: S0.torso[i], pivot: [15, 24] },
      { name: `hood${t}`, parent: 'headJ', s: S0.hood[i], pivot: [24, 46] },
      ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => faceOf(c, a.mhMood ?? 'idle'), pivot: [24, 46] }] : []),
      ...(c === 'ena' ? [{ name: `frillN${t}`, parent: 'headJ', s: S0.frill[1][i], pivot: [13, 6], at: () => [-10, -6], rot: () => -35 * D2R, soft: { key: 'frillN', dir: [-7, 1], k: 170, c: 6, gain: 0.28, turn: 0.7, max: 24 } }] : []),
      { name: `jaw${t}`, parent: 'headJ', s: S0.jaw[i], pivot: [3, 4], at: () => [-12, -4], rot: (S) => S.jaw * D2R },
      ...arm(false),
    ];
  };
  return makeRig({
    w: 130, h: 110, soft: true, stride: 1e9, recover: 0.6,
    springs: {
      x: [220, 16], lift: [220, 16], tilt: [170, 13], head: [150, 11], jaw: [300, 15], tail: [90, 8], tail2: [80, 7],
      armN: [240, 17], elbN: [240, 17], armF: [220, 16], elbF: [220, 16],
      thighN: [340, 20], thighF: [340, 20], shinN: [340, 20], shinF: [340, 20], rollN: [340, 20], rollF: [340, 20],
    },
    fast: ['x', 'lift', 'tilt', 'armN', 'elbN', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF', 'jaw'],
    kick: { tilt: -120, head: -160, tail: 160 },
    turnKick: { tail: 200, head: 60 },
    pose(m, a) {
      a.uidOff = (m.uid % 7) * 1.7 + (c === 'ena' ? 3.1 : 0);
      const t = a.t + a.uidOff;
      const now = a.now;
      const u = stepPhase(m, a, 'mh', 18);
      const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
      const walkW = a.walkW ?? 0;
      const still = 1 - walkW;
      const burrow = m.burrowed ? 1 : 0;
      const aim = m.aim ? 1 : 0;
      const dive = m.charging ? 1 : 0;
      const mad = m.enraged ? 1 : 0;
      const lu = fr(t / 12) * 12;
      const busy = active || aim || dive || burrow || walkW > 0.05 || m.cine || m.aggroUntil === Infinity || mad;
      const chomp = busy ? 0 : hold(lu, 2, 2.4, 4, 4.4);
      const chase = busy ? 0 : hold(lu, 7.2, 7.7, 9.4, 9.9);
      const breath = Math.sin(t * 1.4);
      const snap = Math.abs(Math.sin(t * 7));
      const liftI = breath * 0.5;
      const tiltI = breath * 1 + chase * -8;
      const idle = {
        x: 0, lift: liftI, tilt: tiltI, head: Math.sin(t * 1.1) * 3 - chomp * 4 + chase * 16, jaw: 4 + chomp * snap * 26,
        tail: 150 + Math.sin(t * 1.6) * 6 + chase * 60 + chase * Math.sin(t * 5) * 12, tail2: 22 + Math.sin(t * 1.6 - 1) * 10 - chase * 40,
        armN: 75 - chomp * 150, elbN: -10 - chomp * 70, armF: 100 - chomp * 160 + chase * 50, elbF: -8 - chomp * 60 + chase * 10,
        ...legsAt(liftI, tiltI),
      };
      const steps = [pawStep(u, 0, 18, 0.6, 3.4), pawStep(u, 0.5, 18, 0.6, 3.4)];
      const sw = Math.sin(u * TAU);
      const bounce = Math.abs(Math.cos(u * TAU));
      const liftW = 0.4 + bounce * 1.6;
      const tiltW = 5 + sw * 2;
      const walk = {
        ...idle, lift: liftW, tilt: tiltW, head: -3 + sw * 2, jaw: 6, tail: 160 + sw * 14, tail2: 14 - sw * 18,
        armN: 70 + sw * 40, elbN: -20, armF: 100 - sw * 40, elbF: -20,
        ...legsAt(liftW, tiltW, [FEET[0] + steps[0][0], steps[0][1]], [FEET[1] + steps[1][0], steps[1][1]]),
      };
      // "Chomp!": arms flung up wide, the hood's jaw open, then clapped shut ahead like jaws.
      const antic = { ...idle, x: -3, lift: 0.6, tilt: -12, head: -10, jaw: 30, tail: 130, tail2: 30, armN: -120, elbN: -30, armF: -140, elbF: -20, ...legsAt(0.6, -12, [FEET[0] - 2, 0], [FEET[1] - 2, 0]) };
      const strike = { ...idle, x: 7, lift: -1.4, tilt: 16, head: 6, jaw: 0, tail: 170, tail2: 0, armN: 14, elbN: -6, armF: 30, elbF: -8, ...legsAt(-1.4, 16, [FEET[0] + 6, 0], [FEET[1] - 1, 0]) };
      const S = stateBlend(a, idle, walk, antic, strike);
      const over = (P, w) => {
        if (w <= 0.001) return;
        for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
      };
      // In her burrow: crouched, peeking, swaying; cupping her mouth to spit bubbles.
      const spit = window1(now, m.spitAt, 0.9, 0.12, 0.4);
      if (burrow) {
        const sway = Math.sin(t * 1.5);
        over({ x: 0, lift: -5, tilt: 8 + sway * 3 + spit * 8, head: -4 + sway * 5 - spit * 6, jaw: 8 + spit * 18, tail: 160, tail2: 30, armN: -40 - spit * 30, elbN: -110, armF: -30 - spit * 40, elbF: -110, ...legsAt(-5, 8 + sway * 3, [FEET[0] + 3, 0], [FEET[1] - 2, 0]) }, 1);
      }
      // Before her lunge: crouched low, arms together ahead like an eel's head, hips wiggling.
      if (aim) {
        const wig = Math.sin(now * 12);
        over({ x: -3, lift: -6, tilt: 26, head: -22, jaw: 22, tail: 170 + wig * 20, tail2: wig * 30, armN: -4, elbN: 0, armF: 4, elbF: 0, ...legsAt(-6, 26, [FEET[0] + 2, 0], [FEET[1] - 6, 0]) }, 1);
      }
      // The lunge: a swimming dive along the floor, arms ahead, legs kicking.
      if (dive) {
        const kick = Math.sin(now * 22);
        over({ x: 0, lift: -9, tilt: 76, head: -46, jaw: 30, tail: 106, tail2: kick * 16, armN: -78, elbN: 0, armF: -72, elbF: 0, thighN: 6 + kick * 14, shinN: 8, thighF: 6 - kick * 14, shinF: 8, rollN: 0, rollF: 0 }, 1);
      }
      // Alone and furious: stomping and huffing.
      if (mad && !dive && !aim && !active && walkW < 0.5) {
        const st = Math.sin(now * 9);
        over({ tilt: 4, head: -6 + st * 3, jaw: 10 + Math.abs(st) * 10, armN: 40 + st * 30, elbN: -90, armF: 50 - st * 30, elbF: -90, ...legsAt(0, 4, [FEET[0], Math.max(0, st) * 4], [FEET[1], Math.max(0, -st) * 4]) }, 1);
      }
      if (m.hp <= 0) over({ lift: -12, tilt: -10, head: 16, jaw: 20, armN: 60, elbN: 30, armF: 120, elbF: 20, ...legsAt(-12, -10, [FEET[0] + 10, 2], [FEET[1] + 14, 2]) }, 1);
      a.mhSpit = burrow ? spit : 0;
      a.mhMad = mad;
      a.mhDive = dive;
      a.mhMood = m.hp <= 0 ? 'dead' : moodOf(a, burrow && spit > 0.3 ? 'shout' : aim || dive || mad ? 'angry' : chomp > 0.4 ? 'happy' : chase > 0.5 ? 'happy' : null);
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
      { name: 'tailEnd', parent: 'tail1', at: () => [25, 0] },
      ...pass(false),
      ...pass(true),
    ],
    under(ctx, m, a) {
      ctx.globalAlpha = a.alpha * 0.2;
      ctx.fillStyle = '#1a3040';
      ctx.beginPath();
      ctx.ellipse(-8, -0.6, 26, 3.4, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = a.alpha;
    },
    fx(ctx, m, a, S, mat) {
      if (m.hp <= 0) return;
      // Bubbles: spat from her cupped hands in the burrow, huffed when she's furious, a wake
      // behind her dive.
      const mouth = (() => {
        const M = mat('headJ');
        return [M[0] * 6 + M[2] * -10 + M[4], M[1] * 6 + M[3] * -10 + M[5]];
      })();
      const k0 = Math.max(a.mhSpit, a.mhMad * 0.6);
      if (k0 > 0.05) for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 1.6 + k / 4);
        ctx.globalAlpha = a.alpha * (1 - u) * k0;
        ctx.strokeStyle = '#e8fcff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(mouth[0] + 8 + u * 22, mouth[1] - u * 18 + Math.sin(u * 8 + k) * 3, 1.6 + u * 3, 0, TAU);
        ctx.stroke();
      }
      if (a.mhDive) for (let k = 0; k < 6; k++) {
        const u = fr(a.now * 3 + k / 6);
        ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
        ctx.strokeStyle = '#e8fcff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-30 - u * 50, -8 - (k % 3) * 8, 1.6 + u * 3.4, 0, TAU);
        ctx.stroke();
      }
      if (a.mhDive) for (let k = 0; k < 3; k++) puff(ctx, a, -20 - k * 14, -2, 5 + k * 2, 0.25, '200,230,255');
    },
  });
}
export const murriRig = twinRig('murri');
export const enaRig = twinRig('ena');

// A still of her standing (for anywhere a sprite is wanted), her mood's face.
export function morayStill(c) {
  return (pose, f, mood) => {
    const by = -BODY_Y;
    const [nx, ny] = [NECK[0], by + NECK[1]];
    const L = legsAt(0, 0);
    const leg = (k, j, far) => {
      const [hx, hy] = HIPS[j];
      const th = L[`thigh${k}`];
      const sh = L[`shin${k}`];
      const kx = hx - Math.sin(th * D2R) * L1;
      const ky = by + hy + Math.cos(th * D2R) * L1;
      const ax = kx - Math.sin((th + sh) * D2R) * L2;
      const ay = ky + Math.cos((th + sh) * D2R) * L2;
      return [...put(thighP(c, far)(), [4.5, 2], hx, by + hy, th), ...put(shinP(c, far)(), [4.5, 2], kx, ky, th + sh), ...put(footP(c, far)(), [4, 1], ax, ay, 0)];
    };
    const tx = -9;
    const ty = by + 1;
    return {
      w: 130,
      h: 110,
      res: 2,
      shapes: shift([
        ...put(tail2P(c)(), [2, 6], tx + Math.cos(150 * D2R) * 25, ty + Math.sin(150 * D2R) * 25, 172), ...put(tail1P(c)(), [3, 6], tx, ty, 150),
        ...put(finP(c)(), [18, 26], nx - 12, ny - 34),
        ...put(upP(c, true)(), [2, 4], SHF[0], by + SHF[1], 100), ...put(foreP(c, true)(), [2, 4.5], SHF[0] + Math.cos(100 * D2R) * UA, by + SHF[1] + Math.sin(100 * D2R) * UA, 92),
        ...leg('F', 1, true), ...leg('N', 0, false),
        ...put(torsoP(c)(), [15, 24], 0, by), ...put(hoodP(c)(), [24, 46], nx, ny),
        ...put(faceShapes(MOODS.has(mood) ? mood : 'idle', faceCfg(c)), [24, 46], nx, ny),
        ...put(jawP(c)(), [3, 4], nx - 12, ny - 4, 4),
        ...put(upP(c, false)(), [2, 4], SHN[0], by + SHN[1], 75), ...put(foreP(c, false)(), [2, 4.5], SHN[0] + Math.cos(75 * D2R) * UA, by + SHN[1] + Math.sin(75 * D2R) * UA, 65),
      ], 70, 106),
    };
  };
}
