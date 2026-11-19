// The Barnacle Matriarch (redrawn 2026-11-19, the player's pick "B, the Hermit Crab Matriarch"):
// queen of the barnacles that crust the Sky Whale's back, a round coral-red hermit crab living in a
// great whelk shell. The shell winds up behind her to a point, banded, crusted with barnacles and a
// pearl, kelp hanging off it; its mouth is pink. A scallop shell for a tiara, a big claw that
// pinches her coral staff (a pearl in its branches), a small claw, four short stubby legs.
//
// How she moves:
//   idle    a 10 s act: tap-tap of her staff on the deck; the small claw straightening her tiara;
//           a haughty "hmph", nose in the air.
//   walk    a trundle on her four little legs (diagonal pairs), the staff swinging like a walking
//           stick, the heavy shell rocking after her, its kelp swaying.
//   fight   (world/skywhale.js) a plain swing is a bonk of the staff; Encrust! (m.shield) she
//           pulls back into the shell's mouth, only her near eye peeking out, barnacles crusting
//           over the shell; the shell cracks (m.vulnUntil) and she flops out dizzy, the shell split;
//           Tide Crash (m.slamming) she bursts out, rears up and drives the staff down in a splash;
//           barnacle spikes (m.spikeAt) a stamp of the staff; Barnacle Knights (m.knightAt) the
//           staff raised, the small claw beckoning.
//   scene   she starts hidden in her shell and pops out on her first hop.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, faceShapes, sparkle, dot } from './rigkit.js';

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
const aim = (want, ...turns) => want - turns.reduce((v, x) => v + x, 0);
const place = (pts, x, y, deg) => {
  const r = deg * D2R;
  return pts.map(([px, py]) => [x + px * Math.cos(r) - py * Math.sin(r), y + px * Math.sin(r) + py * Math.cos(r)]);
};

const RED = ramp('#f0645a', { step: 10, turn: 10 });
const SAND = ramp('#f4dcc0', { step: 9, turn: 10 });
const PEACH = ramp('#f8c8aa', { step: 9, turn: 10 });
const CORAL = ramp('#ff7a86', { step: 10, turn: 10 });
const KELP = ramp('#5aae6e', { step: 9, turn: 10 });
const PEARL = '#fff6fa';
const BELLY = '#ff9a8a';
const SHINE = '#ffb0a0';
const mt = pairOf('mt2');

// A barnacle: a little ivory cone, its top a shade darker (no hole: nothing that reads as an eye).
const barnacle = (x, y, s, deg = 0) => {
  const P = (pts) => place(pts, x, y, deg);
  return [T(P([[-s, 0], [-s * 0.55, -s * 1.1], [s * 0.55, -s * 1.1], [s, 0]]), '#efe8dc'), F(T(P([[-s * 0.55, -s * 1.1], [s * 0.55, -s * 1.1], [s * 0.42, -s * 0.8], [-s * 0.42, -s * 0.8]]), '#cfc6b6')), F(taper(P([[-s * 0.62, -s * 0.2], [-s * 0.38, -s * 0.85]]), 0.6, 0.4, '#ffffff'))];
};
const pearl = (x, y, r) => [E(x, y, r, r, PEARL), F(E(x + r * 0.2, y + r * 0.3, r * 0.7, r * 0.5, '#f0dcea')), F(E(x - r * 0.35, y - r * 0.38, r * 0.34, r * 0.28, '#ffffff'))];

// ---------- Parts ----------
// (Rig space: the floor at y 0, facing right. Her body's middle 24 above the floor and 14 right of
// her centre; the shell's mouth at (10, -20).)
// The whelk (box 78 x 90; its mouth (60, 66) is where it hangs): whorls winding up and back to
// its point, banded, barnacles and a pearl along them; the pink mouth.
const whorl = (cx, cy, rx, ry, band = true) => [
  E(cx, cy, rx, ry, SAND.base), crescent(cx, cy, rx, ry, SAND.sh, { k: 0.22, a0: 20, a1: 170 }),
  ...(band ? [F(taper(arcP(cx, cy, rx * 0.86, ry * 0.5, 200, 278, 6), ry * 0.24, ry * 0.2, '#f2b070'))] : []), F(E(cx - rx * 0.25, cy - ry * 0.6, rx * 0.36, ry * 0.12, '#fff4e4')),
];
const SHELL_PV = [60, 66];
const shellP = () => [
  T([[8, 4], [7, 15], [14, 12]], SAND.base),
  ...whorl(11, 15, 6.4, 5.2, false), ...whorl(18, 26, 10.4, 8), ...whorl(28, 42, 16, 12), ...whorl(42, 64, 26, 19),
  ...barnacle(14, 21, 2.4, -50), ...barnacle(20, 35, 3, -40), ...barnacle(30, 53, 3.2, -30), ...barnacle(24, 20, 2, -10), ...pearl(33, 34, 1.6),
  E(60, 66, 12, 16, '#ffb4bc'), F(E(61, 67, 9, 13, '#e88a9a')), F(E(62.4, 70, 5.6, 8, '#c86a7e')),
];
// A strand of kelp hanging off the shell (box 8 x 20 from its root (4, 2)).
const kelpP = (k) => () => [taper([[4, 2], [2.8, 7], [5, 12], [3.8, 17]], 3.4, 1.4, k ? KELP.sh : KELP.base), F(taper([[3.8, 4], [3, 8]], 0.8, 0.5, KELP.hi))];
// The near half of the shell's lip, round its mouth (box 16 x 40, the mouth's middle at (14, 20)):
// drawn over her as she backs in, so she's inside it; the shell filled in beside it, up to where
// her body is cut off.
const lipP = () => [T([[1, 3.4], ...arcP(14, 20, 12, 16, 270, 90, 14), [1, 36.6]], SAND.base), taper(arcP(14, 20, 12, 16, 92, 268, 12), 3.6, 3.6, SAND.base), F(taper(arcP(14.6, 20, 10.4, 14.4, 100, 260, 10), 1.2, 1.2, '#ffb4bc'))];
// Her body: round, coral red, a paler belly (the face is its own). Box 44 x 42 about (22, 22).
const bodyP = () => [E(22, 22, 19, 17.6, RED.base), crescent(22, 22, 19, 17.6, RED.sh, { k: 0.14, a0: 110, a1: 220 }), F(E(27, 11, 6, 2, SHINE)), F(E(23, 31.4, 11, 5.4, BELLY))];
// The scallop tiara (box 24 x 16, sat on (12, 14)).
const tiaraP = () => [blob([[2, 13], [6, 5], [12, 2], [18, 5], [22, 13], [12, 15]], PEACH.base, 2), ...[-12, -6, 0, 6, 12].flatMap((d) => line([[12, 14], [12 + d * 0.8, 5 + Math.abs(d) * 0.3]], 0.6, PEACH.sh)), ...pearl(12, 14.6, 1.8)];
// A leg, stubby and round-jointed: the upper (box 10 x 8 from (2, 4); the knee 6 on) and the lower
// with its rounded tip (box 11 x 8 from (2, 4); the tip 7 on).
const thighP = (far) => () => {
  const c = far ? RED.sh : RED.base;
  return [taper([[2, 4], [8, 4]], 5.4, 5, c), E(8, 4, 2.5, 2.5, c), F(taper([[2.6, 2.6], [7, 2.6]], 0.8, 0.6, far ? RED.base : SHINE))];
};
const shinP = (far) => () => {
  const c = far ? RED.sh : RED.base;
  return [E(2, 4, 2.5, 2.5, c), taper([[2, 4], [8.4, 4]], 5, 3.4, c), E(9, 4, 1.8, 1.8, c)];
};
// The big claw: its arm (box 10 x 8 from (2, 4); the wrist 6 on), the palm with its fixed finger
// (box 24 x 18 about the wrist (3, 9)), and the finger that pinches (box 12 x 8 hinged at (2, 4)).
const armNP = () => [taper([[2, 4], [8, 4]], 5.6, 5.2, RED.base), E(8, 4, 2.6, 2.6, RED.base)];
const palmNP = () => [E(9.4, 9, 6.8, 6, RED.base), crescent(9.4, 9, 6.8, 6, RED.sh, { k: 0.16, a0: 60, a1: 160 }), taper([[12, 11.8], [18, 11.6], [21.4, 9.8]], 4, 1.6, RED.base), F(E(8, 6.4, 2.4, 1.4, SHINE))];
const dactNP = () => [taper([[2, 4], [7, 3.2], [10.6, 5]], 4.2, 1.6, RED.base), F(taper([[3, 2.8], [7, 2.4]], 0.7, 0.5, SHINE))];
// The small claw, the same shape smaller: arm (box 12 x 7 from (2, 3.5); the wrist 8 on), palm (box
// 16 x 12 about (2, 6)), finger (box 9 x 6 hinged at (1.5, 3)).
const armFP = () => [taper([[2, 3.5], [10, 3.5]], 4.4, 4, RED.sh), E(10, 3.5, 2.1, 2.1, RED.sh)];
const palmFP = () => [E(6.4, 6, 4.6, 4, RED.sh), taper([[8.4, 7.8], [12.4, 7.6], [14.6, 6.4]], 2.8, 1.2, RED.sh), F(E(5.4, 4.4, 1.6, 0.9, RED.base))];
const dactFP = () => [taper([[1.5, 3], [5, 2.4], [7.4, 3.6]], 2.8, 1.2, RED.sh)];
// The coral staff (box 66 x 20, gripped at (19, 10)), lying along its length: the trunk, three
// branches round a big pearl at the top.
const staffP = () => [
  taper([[0.6, 10], [30, 10.6], [52, 10]], 3.4, 2.6, CORAL.base), F(taper([[3, 9], [48, 9]], 0.8, 0.6, CORAL.hi)),
  taper([[48, 10], [55, 15], [61, 16.4]], 2.2, 1.6, CORAL.base), taper([[46, 10], [53, 5], [59, 4.4]], 2.2, 1.6, CORAL.base), taper([[51, 10], [60, 10.6]], 2, 1.6, CORAL.base),
  ...[[61, 16.4], [59, 4.4], [60, 10.6]].map(([x, y]) => E(x, y, 1.4, 1.4, CORAL.base)),
  ...pearl(52.6, 10, 3.2),
];
const MT = {
  SHELL: mt('shell', 78, 90, shellP, 2), KELP: [0, 1].map((k) => mt(`kelp${k}`, 8, 20, kelpP(k), 2)), LIP: mt('lip', 16, 40, lipP, 2), BODY: mt('body', 44, 42, bodyP, 2), TIARA: mt('tiara', 24, 16, tiaraP, 2),
  THIGH: [false, true].map((f) => mt(`thigh${f ? 1 : 0}`, 10, 8, thighP(f), 2)), SHIN: [false, true].map((f) => mt(`shin${f ? 1 : 0}`, 11, 8, shinP(f), 2)),
  ARMN: mt('armN', 10, 8, armNP, 2), PALMN: mt('palmN', 24, 18, palmNP, 2), DACTN: mt('dactN', 12, 8, dactNP, 2),
  ARMF: mt('armF', 12, 7, armFP, 2), PALMF: mt('palmF', 16, 12, palmFP, 2), DACTF: mt('dactF', 9, 6, dactFP, 2),
  STAFF: mt('staff', 66, 20, staffP, 2),
};

// ---------- Faces (on her body; box 44 x 42 as it) ----------
const EN = [27.6, 22, 3.1];
const EF = [17.4, 22.2, 2.6];
const IRIS = '#2a6ac8';
const LIP = '#7a2a3a';
const MX = 23;
const MY = 28.2;
// An eye: a lid of `lid` over it (curved), or `angry` (a straight lid, low at the inner corner),
// a lash at the outer corner.
const eye = ([x, y, r], side, { lid = 0.28, angry = 0, small = false, look = 0 } = {}) => {
  const top = y - r * 1.1 * (1 - lid * 2);
  const yIn = top + angry * r * 0.6;
  const yOut = top - angry * r * 0.2;
  const [yL, yR] = side > 0 ? [yIn, yOut] : [yOut, yIn];
  const lidShape = angry
    ? [F(T([...arcP(x, y, r * 1.16, r * 1.26, 180, 360, 8), [x + r * 1.16, yR], [x - r * 1.16, yL]], RED.base)), ...line([[x - r * 1.1, yL], [x + r * 1.1, yR]], 0.7)]
    : lid > 0 ? [F(T([...arcP(x, y, r * 1.14, r * 1.24, 180, 360, 8), ...arcP(x, top, r * 1.14, r * 0.35, 0, 180, 8)], RED.base)), ...line(arcP(x, top, r * 1.06, r * 0.33, 15, 165, 7), 0.6)] : [];
  return [
    F(E(x, y, r, r * 1.12, INK)), F(E(x, y + r * 0.3 + look, r * 0.78, r * 0.7, IRIS)),
    ...(small ? [F(E(x, y + look, r * 0.3, r * 0.34, '#ffffff'))] : [F(E(x - r * 0.32, y - r * 0.4 + look, r * 0.4, r * 0.42, '#ffffff')), F(E(x + r * 0.3, y + r * 0.45 + look, r * 0.16, r * 0.16, '#ffffff'))]),
    ...lidShape, ...line([[x + side * r * 0.9, y - r * 0.5], [x + side * r * 1.5, y - r * 0.95]], 0.6),
  ];
};
const shut = ([x, y, r], up = false) => line(arcP(x, y + 0.6, r, r * 0.6, up ? 200 : 20, up ? 340 : 160, 7), 0.8);
const swirl = ([x, y, r]) => line(Array.from({ length: 16 }, (_, i) => [x + Math.cos(i * 0.85) * (0.2 + i * r * 0.07), y + Math.sin(i * 0.85) * (0.2 + i * r * 0.07)]), 0.6);
const blush = (k = 1) => [F(E(EN[0] + 1, EN[1] + 4.8, 2.2 * k, 1.1 * k, '#ffa8bc')), F(E(EF[0] - 1, EF[1] + 4.6, 1.8 * k, 1 * k, '#ffa8bc'))];
const smile = (dx = 0) => line(arcP(MX + dx, MY, 2.2, 1.2, 20, 160, 7), 0.7, LIP);
const MT_FACES = {
  // Regal: lids half down, a small smile.
  idle: () => [...eye(EN, 1), ...eye(EF, -1), ...smile(), ...blush()],
  blink: () => [...shut(EN), ...shut(EF), ...smile(), ...blush()],
  // Straightening her tiara: eyes shut happily.
  preen: () => [...shut(EN, true), ...shut(EF, true), ...smile(), ...blush(1.15)],
  // Hmph: eyes shut, a little pout.
  hmph: () => [...shut(EN), ...shut(EF), ...line([[MX - 1.6, MY + 0.7], [MX, MY - 0.2], [MX + 1.6, MY + 0.7]], 0.7, LIP), ...blush()],
  happy: () => [...shut(EN, true), ...shut(EF, true), F(T(arcP(MX, MY - 0.4, 2.6, 2.4, 0, 180, 9), LIP)), F(E(MX, MY + 1, 1.3, 0.6, '#ff9ab0')), ...blush(1.1)],
  angry: () => [...eye(EN, 1, { lid: 0.1, angry: 1, small: true }), ...eye(EF, -1, { lid: 0.1, angry: 1, small: true }), ...line(arcP(MX, MY + 1.4, 2, 0.8, 200, 340, 6), 0.7, LIP), ...blush(0.8)],
  shout: () => [...eye(EN, 1, { lid: 0, small: true }), ...eye(EF, -1, { lid: 0, small: true }), F(E(MX, MY + 0.8, 2.2, 2.4, LIP)), F(E(MX, MY + 2, 1.3, 0.7, '#ff9ab0')), ...blush()],
  // Hiding: eyes wide, looking up, a worried little mouth (shifted to the side that peeks out).
  hide: () => [...eye(EN, 1, { lid: 0, look: -0.5 }), ...eye(EF, -1, { lid: 0, look: -0.5 }), ...line(arcP(MX + 3, MY + 1.4, 1.6, 0.8, 200, 340, 6), 0.7, LIP), ...blush()],
  dizzy: () => [...swirl(EN), ...swirl(EF), ...line([[MX - 2.4, MY + 0.6], [MX - 1.2, MY - 0.2], [MX, MY + 0.6], [MX + 1.2, MY - 0.2], [MX + 2.4, MY + 0.6]], 0.7, LIP), ...blush()],
  hurt: () => [...line([[EN[0] - 2.4, EN[1] - 1.8], [EN[0] + 1.4, EN[1]], [EN[0] - 2.4, EN[1] + 1.8]], 0.8), ...line([[EF[0] + 2, EF[1] - 1.6], [EF[0] - 1.2, EF[1]], [EF[0] + 2, EF[1] + 1.6]], 0.8), ...line(arcP(MX, MY + 1.6, 2, 1, 200, 340, 6), 0.8, LIP), ...blush()],
  dead: () => [...line([[EN[0] - 2, EN[1] - 2], [EN[0] + 2, EN[1] + 2]], 0.8), ...line([[EN[0] + 2, EN[1] - 2], [EN[0] - 2, EN[1] + 2]], 0.8), ...line([[EF[0] - 1.6, EF[1] - 1.6], [EF[0] + 1.6, EF[1] + 1.6]], 0.7), ...line([[EF[0] + 1.6, EF[1] - 1.6], [EF[0] - 1.6, EF[1] + 1.6]], 0.7), ...line(arcP(MX, MY + 1.8, 2, 1, 200, 340, 6), 0.8, LIP)],
};
const FACE_FB = { eyes: [[EN[0], EN[1], 2.8, 3, 1], [EF[0], EF[1], 2.2, 2.4, -1]], mouth: [MX, MY, 1], blush: [[EN[0] + 1, EN[1] + 4.8, 1.4], [EF[0] - 1, EF[1] + 4.6, 1.2]], iris: IRIS, lid: 0.2, lashes: 1 };
const mtFace = (mood) => faceSprite(`mt2|face|${mood}`, 44, 42, () => (MT_FACES[mood] ?? (() => faceShapes(mood, FACE_FB)))());

// ---------- Skeleton ----------
const BODY = [14, -24];
const L1 = 6;
const L2 = 7;
const UAN = 6;
const UAF = 8;
const SHN = [15, 2];
const SHF = [-14, -2];
const HINGE_N = [10, -2.6];
const GRIP_N = [13, 0.4];
const HINGE_F = [7, -1.6];
const STRIDE = 14;
// Each leg: its hip on her body ([x, y] about the body's middle), which way the knee bends (1 out
// in front, -1 out behind), and where its foot rests on the floor (rig x).
const LEGS = { nF: [8, 13, 1, 27], nB: [1, 15, -1, 11], fF: [4, 13, 1, 22], fB: [-5, 14, -1, 5] };
function ik(hx, hy, fx, fy, sgn) {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = clamp(Math.hypot(dx, dy), 2, L1 + L2 - 0.05);
  const base = Math.atan2(dy, dx);
  const h = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const th1 = base - sgn * h;
  const kx = hx + L1 * Math.cos(th1);
  const ky = hy + L1 * Math.sin(th1);
  return [th1 / D2R, (Math.atan2(fy - ky, fx - kx) - th1) / D2R];
}
// Her four legs for a pose P ({ x, lift, hide, bdx, lean, tilt }) with each foot stepped by
// steps[k] = [dx along the floor, up]: the feet planted, the knees bent; tucked in her shell as she
// hides.
function legSet(P, steps = null) {
  const bx = P.x + BODY[0] - HIDE_DX * P.hide + P.bdx;
  const by = -P.lift + BODY[1] + HIDE_DY * P.hide;
  const r = -(P.lean + P.tilt) * D2R;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const out = {};
  for (const [k, [hx, hy, sgn, foot]] of Object.entries(LEGS)) {
    const [dx, up] = steps?.[k] ?? [0, 0];
    const wx = foot + P.x + dx - bx;
    const wy = -up - by;
    let fx = wx * c - wy * s;
    let fy = wx * s + wy * c;
    fx += (hx + sgn * 2.4 - fx) * P.hide;
    fy += (hy + 5 - fy) * P.hide;
    const [th, sh] = ik(hx, hy, fx, fy, sgn);
    out[`t${k}`] = th;
    out[`s${k}`] = sh;
  }
  return out;
}
const full = (base, o) => {
  const q = { ...base, ...o };
  return { ...q, ...legSet(q) };
};
// Where her body is cut off by the shell's mouth as she backs in (body space): the mouth's near
// edge and its top, from the moment she starts (the lip is drawn over the seam).
const HIDE_DX = 14;
const HIDE_DY = 5;
const bodyAt = (S) => [BODY[0] - HIDE_DX * S.hide + S.bdx, BODY[1] + HIDE_DY * S.hide];
const clipOf = (a, S) => {
  if (S.hide < 0.02) return [-40, -40, 90, 80];
  const [x, y] = bodyAt(S);
  return [-2 - x, -36 - y, 90, 32];
};
const hidden = (a, S) => 1 - smooth(clamp((S.hide - 0.3) / 0.5, 0, 1));

const mtPass = (bare) => {
  const i = bare ? 1 : 0;
  const t = bare ? 'b' : '';
  const leg = (k) => {
    const far = k[0] === 'f' ? 1 : 0;
    return [
      { name: `t${k}${t}`, parent: 'bodyJ', s: MT.THIGH[far][i], pivot: [2, 4], at: () => LEGS[k].slice(0, 2), rot: (S) => S[`t${k}`] * D2R, alpha: hidden },
      { name: `s${k}${t}`, parent: `knee${k}`, s: MT.SHIN[far][i], pivot: [2, 4], rot: (S) => S[`s${k}`] * D2R, alpha: hidden },
    ];
  };
  return [
    { name: `shell${t}`, parent: 'base', s: MT.SHELL[i], pivot: SHELL_PV, at: () => [10, -20], rot: (S) => S.shell * D2R },
    ...[0, 1].map((k) => ({ name: `kelp${k}${t}`, parent: 'shellJ', s: MT.KELP[k][i], pivot: [4, 2], at: () => (k ? [-38, -32] : [-26, -34]), rot: (S) => S[`kelp${k}`] * D2R })),
    ...leg('fB'), ...leg('fF'),
    { name: `armF${t}`, parent: 'bodyJ', s: MT.ARMF[i], pivot: [2, 3.5], at: () => SHF, rot: (S) => S.armF * D2R, alpha: hidden },
    { name: `palmF${t}`, parent: 'wristF', s: MT.PALMF[i], pivot: [2, 6], rot: (S) => S.clawF * D2R, alpha: hidden },
    { name: `dactF${t}`, parent: 'hingeF', s: MT.DACTF[i], pivot: [1.5, 3], rot: (S) => S.pinchF * D2R, alpha: hidden },
    ...leg('nB'), ...leg('nF'),
    { name: `body${t}`, parent: 'bodyJ', s: MT.BODY[i], pivot: [22, 22], clip: clipOf },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => mtFace(a.mtMood ?? 'idle'), pivot: [22, 22], clip: clipOf }] : []),
    // (The lip on the bare pass only: no outline round the shell filled in beside it.)
    ...(bare ? [{ name: 'lip', parent: 'shellJ', s: MT.LIP[1], pivot: [14, 20], alpha: (a, S) => smooth(clamp((S.hide - 0.02) / 0.12, 0, 1)) }] : []),
    { name: `tiara${t}`, parent: 'bodyJ', s: MT.TIARA[i], pivot: [12, 14], at: () => [1, -15.6], rot: (S) => S.tiara * D2R, alpha: (a, S) => 1 - clamp((S.hide - 0.2) / 0.5, 0, 1) },
    { name: `staff${t}`, parent: 'gripN', s: MT.STAFF[i], pivot: [19, 10], rot: (S) => S.staff * D2R },
    { name: `armN${t}`, parent: 'bodyJ', s: MT.ARMN[i], pivot: [2, 4], at: () => SHN, rot: (S) => S.armN * D2R },
    { name: `palmN${t}`, parent: 'wristN', s: MT.PALMN[i], pivot: [3, 9], rot: (S) => S.clawN * D2R },
    { name: `dactN${t}`, parent: 'hingeN', s: MT.DACTN[i], pivot: [2, 4], rot: (S) => S.pinch * D2R },
  ];
};

export const matriarchRig = sized(makeRig({
  w: 104, h: 94, soft: true, stride: STRIDE, recover: 0.6,
  springs: {
    x: [200, 16], lift: [200, 15], tilt: [160, 12], lean: [150, 12], hide: [70, 11], bdx: [160, 14], shell: [80, 6], kelp0: [40, 3], kelp1: [36, 2.8], tiara: [120, 7],
    armN: [240, 17], clawN: [240, 17], pinch: [300, 18], staff: [220, 16], armF: [200, 15], clawF: [200, 15], pinchF: [300, 18],
    ...Object.fromEntries(Object.keys(LEGS).flatMap((k) => [[`t${k}`, [400, 22]], [`s${k}`, [400, 22]]])),
  },
  fast: ['x', 'lift', 'lean', 'armN', 'clawN', 'staff', 'pinch', 'armF', 'clawF', ...Object.keys(LEGS).flatMap((k) => [`t${k}`, `s${k}`])],
  kick: { lean: -120, shell: 160, kelp0: 220, kelp1: -200, tiara: 220 },
  turnKick: { shell: 120, kelp0: 260, kelp1: -260, tiara: 180, lean: -60 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.87;
    const t = a.t + a.uidOff;
    const mo = a.mo ?? {};
    const now = a.now;
    const u = stepPhase(m, a, 'mt2', STRIDE * 1.1);
    const act = (at, wind, dur) => {
      if (at == null || now < at - wind || now >= at + dur) return null;
      if (now < at) return { antic: smooth(1 - (at - now) / wind), strike: 0 };
      const s = now - at < 0.07 ? smooth((now - at) / 0.07) : 1 - smooth(clamp((now - at - 0.3) / (dur - 0.3), 0, 1));
      return { antic: now - at < 0.07 ? 1 - s : 0, strike: s };
    };
    // (In her scene she starts hidden in her shell, and pops out on her first hop.)
    if (m.cine && (m.cine.lift ?? 0) > 1) mo.mtOut = true;
    const cineHide = Boolean(m.cine) && !mo.mtOut;
    if (m.shield && mo.mtCrustT == null) mo.mtCrustT = now;
    if (!m.shield) mo.mtCrustT = null;
    a.mtCrust = m.shield ? clamp((now - mo.mtCrustT) / 1.4, 0, 1) : 0;
    const vuln = m.vulnUntil > now ? smooth(clamp((m.vulnUntil - now) / 0.5, 0, 1)) : 0;
    const slamA = act(m.slamming, 1.8, 1.1);
    const spikeA = act(m.spikeAt, 0.35, 0.9);
    const knightA = act(m.knightAt, 0.35, 1.6);
    const hideT = (m.shield || cineHide) && !slamA && vuln < 0.1 ? 1 : 0;
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const still = 1 - walkW;
    // Her idle, a 10 s act: tap-tap of the staff; straightening her tiara; hmph.
    const lu = fr(t / 10) * 10;
    const busy = active || hideT || vuln > 0.05 || slamA || spikeA || knightA || walkW > 0.05 || m.cine;
    const tap = busy ? 0 : hold(lu, 0.4, 0.7, 2.4, 2.7);
    const preen = busy ? 0 : hold(lu, 3.6, 4.1, 5.6, 6.1);
    const hmph = busy ? 0 : hold(lu, 7, 7.4, 8.4, 8.8);
    const tapK = tap * Math.max(0, Math.sin(t * 7));
    a.mtAct = { preen: preen * still, hmph: hmph * still };
    const sway = Math.sin(t * 1.3);
    const leanI = Math.sin(t * 1.1) * 1.4 - hmph * 9 + tapK * 1.2;
    const armNI = 30 - tapK * 40;
    const clawNI = -30 + tapK * 40;
    const armFI = 150 - preen * 260;
    const clawFI = 40 - preen * 70;
    const rest = { x: 0, lift: sway * 0.3 + tapK * 0.6, tilt: 0, lean: leanI, hide: 0, bdx: 0 };
    const idle = full(rest, {
      shell: Math.sin(t * 1.1 + 1) * 1.2 - leanI * 0.3, kelp0: Math.sin(t * 1.7) * 8, kelp1: Math.sin(t * 1.5 + 1) * 9, tiara: Math.sin(t * 1.4) * 1.5 + preen * (10 + Math.sin(t * 6) * 4) - hmph * 4,
      armN: armNI, clawN: clawNI, pinch: 0, staff: aim(-90, leanI, armNI, clawNI), armF: armFI, clawF: clawFI, pinchF: preen * Math.sin(t * 9) * 14,
    });
    // A trundle on four little legs (diagonal pairs), the staff a walking stick, the shell rocking.
    const lead = ((mo.rig?.mt2V ?? 0) / (STRIDE * 1.1)) * 0.04;
    const steps = Object.fromEntries([['nF', 0], ['fB', 0.08], ['nB', 0.5], ['fF', 0.58]].map(([k, p]) => [k, pawStep(u + lead, p, STRIDE, 0.62, 3)]));
    const w2 = u * TAU * 2;
    const sw = Math.sin(u * TAU);
    const land = (1 + Math.cos(w2)) / 2;
    const leanW = 3 + sw * 1.4;
    const armNW = 34 + sw * 8;
    const clawNW = -34 - sw * 8;
    const walkRest = { x: 0, lift: 0.6 - land * 1.2, tilt: Math.sin(w2) * 0.8, lean: leanW, hide: 0, bdx: 0 };
    const walk = {
      ...walkRest, ...legSet(walkRest, steps),
      shell: Math.sin(w2 - 1) * 2.4 - 1, kelp0: 14 + Math.sin(w2 - 1) * 10, kelp1: 16 + Math.sin(w2 - 1.6) * 12, tiara: Math.sin(w2 - 0.6) * 3,
      armN: armNW, clawN: clawNW, pinch: 0, staff: aim(-84 + sw * 5, leanW, armNW, clawNW), armF: 150 + sw * 10, clawF: 40, pinchF: 0,
    };
    // A bonk of the staff: back over her shoulder, then down in front of her.
    const antic = full(idle, { lift: 1, lean: -7, armN: -40, clawN: -10, staff: aim(-140, -7, -40, -10), armF: 120, clawF: 20 });
    const strike = full(idle, { lift: -1.2, lean: 10, bdx: 2, armN: 50, clawN: -10, staff: aim(8, 10, 50, -10), armF: 160, clawF: 50 });
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    let kind = active ? 'bonk' : null;
    let ph = active ? a.ph : { antic: 0, strike: 0 };
    // Encrust!: backed into the shell's mouth, the big claw folded before it, the staff planted.
    // (Bonking from inside the shell: only the body and legs tuck; the claw keeps its swing.)
    if (hideT) {
      const H = full(idle, { hide: 1, lean: 0, lift: 0, bdx: 0, armN: 40, clawN: -60, pinch: 0, staff: aim(-90, 0, 40, -60), armF: 150, clawF: 40, tiara: 0, kelp0: 4, kelp1: 6 });
      over(active ? Object.fromEntries(Object.entries(H).filter(([k]) => /^(hide|bdx|tiara|kelp|[ts](n|f)[FB])/.test(k))) : H, 1);
    }
    // The shell cracks: flopped out, dizzy, swaying, the staff drooping, the tiara askew.
    if (vuln > 0.001) {
      const lv = 10 + Math.sin(t * 5) * 5;
      over(full(idle, { hide: 0, lean: lv, lift: -2, tilt: Math.sin(t * 5 + 1) * 2, bdx: 2, armN: 80, clawN: 40, pinch: -10, staff: aim(-50 + Math.sin(t * 5) * 10, lv, 80, 40), armF: 130, clawF: 30, pinchF: -20, tiara: 22 }), vuln);
    }
    const special = (A, Sx, P, k) => {
      if (!P) return;
      over(A, P.antic);
      over(Sx, P.strike);
      if (!active) {
        kind = k;
        ph = P;
      }
    };
    // Barnacle spikes: the staff raised and stamped.
    special(full(idle, { lift: 1, lean: -5, armN: -30, clawN: 30, staff: aim(-90, -5, -30, 30) }), full(idle, { lift: -1.6, lean: 6, armN: 46, clawN: -46, staff: aim(-88, 6, 46, -46) }), spikeA, 'spike');
    // Barnacle Knights!: the staff raised high, the small claw beckoning.
    special(full(idle, { lean: -3, armN: 0, clawN: 0, staff: aim(-90, -3) }), full(idle, { lean: -8, lift: 1.4, armN: -64, clawN: 64, staff: aim(-92, -8, -64, 64), armF: -110 + Math.sin(t * 12) * 16, clawF: -40, pinchF: Math.sin(t * 24) * 20 - 10 }), knightA, 'knight');
    // Tide Crash: burst out of the shell, rear up, staff and small claw high; then the staff driven
    // down onto the deck.
    special(full(idle, { hide: 0, lift: 3, lean: -12, armN: -70, clawN: 30, staff: aim(-100, -12, -70, 30), armF: -140, clawF: -10, pinchF: -30, tiara: -8 }), full(idle, { hide: 0, lift: -2, lean: 14, bdx: 3, armN: 50, clawN: -20, staff: aim(22, 14, 50, -20), armF: 60, clawF: 20, tiara: 10 }), slamA, 'slam');
    a.mtKind = kind;
    a.mtPh = ph;
    a.mtVuln = vuln;
    a.mtHide = S.hide;
    a.mtMood = mtMood(a, m);
    return S;
  },
  parts: [
    { name: 'base', parent: null, at: (S) => [S.x, -S.lift], rot: (S) => S.tilt * D2R },
    { name: 'shellJ', parent: 'base', at: () => [10, -20], rot: (S) => S.shell * D2R },
    { name: 'bodyJ', parent: 'base', at: bodyAt, rot: (S) => S.lean * D2R },
    ...Object.keys(LEGS).flatMap((k) => [{ name: `knee${k}`, parent: `t${k}`, at: () => [L1, 0] }]),
    { name: 'wristN', parent: 'armN', at: () => [UAN, 0] },
    { name: 'hingeN', parent: 'palmN', at: () => HINGE_N },
    { name: 'gripN', parent: 'palmN', at: () => GRIP_N },
    { name: 'wristF', parent: 'armF', at: () => [UAF, 0] },
    { name: 'hingeF', parent: 'palmF', at: () => HINGE_F },
    ...mtPass(false),
    ...mtPass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#2a3a6a';
    ctx.beginPath();
    ctx.ellipse(-2, -0.6, 40, 4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const ph = a.mtPh ?? a.ph;
    const kind = a.mtKind;
    const [px, py] = at2(mat('staff'), 33.6, 0);
    const [fx0, fy0] = at2(mat('staff'), -19, 0);
    // Encrust!: barnacles crusting over the shell as she hides.
    if (a.mtCrust > 0.01) {
      const M = mat('shellJ');
      ctx.save();
      ctx.transform(...M);
      CRUST.forEach(([x, y, s, deg], k) => {
        const g = clamp(a.mtCrust * 1.6 - k * 0.07, 0, 1);
        if (g <= 0) return;
        const r = deg * D2R;
        const c = Math.cos(r);
        const sn = Math.sin(r);
        const P = (u, v) => [x + u * c - v * sn, y + u * sn + v * c];
        const z = s * smooth(g);
        const poly = (pts, fill, edge) => {
          ctx.beginPath();
          pts.forEach(([qx, qy], i) => (i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
          ctx.closePath();
          ctx.fillStyle = fill;
          ctx.fill();
          if (edge) {
            ctx.strokeStyle = edge;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        };
        ctx.globalAlpha = a.alpha;
        // (A little dome, its plates a shade darker on top.)
        const dome = (rx, ry, oy) => Array.from({ length: 9 }, (_, i) => P(-rx * Math.cos((i / 8) * Math.PI), oy - ry * Math.sin((i / 8) * Math.PI)));
        poly([P(-z, 0.6), ...dome(z, z * 1.1, 0.4), P(z, 0.6)], '#efe8dc', '#6a5a5a');
        poly(dome(z * 0.5, z * 0.4, -z * 0.7), '#cfc6b6');
      });
      ctx.restore();
    }
    // The shell cracked: split lines across it, and stars round her head.
    if ((a.mtVuln ?? 0) > 0.05) {
      const M = mat('shellJ');
      ctx.save();
      ctx.transform(...M);
      ctx.globalAlpha = a.alpha * a.mtVuln;
      ctx.strokeStyle = '#6a4a3a';
      ctx.lineWidth = 0.9;
      ctx.lineJoin = 'round';
      for (const crack of CRACKS) {
        ctx.beginPath();
        crack.forEach(([qx, qy], i) => (i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
        ctx.stroke();
      }
      ctx.restore();
      const [hx, hy] = at2(mat('bodyJ'), 0, -24);
      for (let k = 0; k < 3; k++) {
        const ang = a.now * 4 + (k * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 12, hy + Math.sin(ang) * 3.4, 2.4, a.mtVuln * (0.6 + 0.4 * Math.sin(ang)), '#fff3a0');
      }
    }
    // A bonk: shells and spray rolling out from the pearl.
    if (kind === 'bonk' && ph.strike > 0.2) {
      const q = 1 - ph.strike;
      for (let k = 0; k < 4; k++) dot(ctx, a, px + 4 + q * 16 + k * 5, py - 2 - Math.abs(1.5 - k) * 3 * (1 - q), 1.8, ph.strike * 0.9, k % 2 ? '#f4dcc0' : '#bfeeff');
    }
    // Spikes: barnacle bits popping at the staff's foot.
    if (kind === 'spike' && ph.strike > 0.2) {
      const q = 1 - ph.strike;
      for (let k = 0; k < 5; k++) {
        const ang = Math.PI + (k / 4) * Math.PI;
        dot(ctx, a, fx0 + Math.cos(ang) * (4 + q * 12), fy0 + Math.sin(ang) * (2 + q * 9), 1.3, ph.strike, '#efe8dc');
      }
    }
    // Knights: the pearl glinting as she calls them.
    if (kind === 'knight' && ph.strike > 0.2) sparkle(ctx, a, px, py, 3 + Math.sin(a.now * 10) * 1.4, ph.strike, '#ffffff');
    // Tide Crash: the pearl glowing as she rears up; then a splash both ways along the deck.
    if (kind === 'slam' && ph.antic > 0.3) sparkle(ctx, a, px, py, 2.4 + ph.antic * 2, ph.antic, '#bfeeff');
    if (kind === 'slam' && ph.strike > 0.1) {
      const q = 1 - ph.strike;
      ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) {
        const sd = k ? 1 : -1;
        ctx.globalAlpha = a.alpha * ph.strike * 0.8;
        ctx.strokeStyle = '#bfeeff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(px + sd * (6 + q * 26), -2, 6 + q * 6, sd > 0 ? Math.PI * 1.1 : Math.PI * 1.4, sd > 0 ? Math.PI * 1.6 : Math.PI * 1.9);
        ctx.stroke();
      }
      for (let k = 0; k < 7; k++) {
        const ang = Math.PI * (1.08 + (k / 6) * 0.84);
        dot(ctx, a, px + Math.cos(ang) * (4 + q * 20), py - 2 + Math.sin(ang) * (4 + q * 18) + q * q * 10, 1.4, ph.strike, k % 2 ? '#ffffff' : '#9fdcff');
      }
    }
    ctx.globalAlpha = a.alpha;
  },
}), 1.1);
// (Shell space, about the mouth: where the crust grows, [x, y, size, tilt]; the cracks' lines.)
const CRUST = [[-18, -2, 26, 19, [-62, -100, -138, 176]], [-32, -24, 16, 12, [-60, -110]], [-42, -40, 10.4, 8, [-100]]].flatMap(([cx, cy, rx, ry, angs]) => angs.map((d) => {
  const th = d * D2R;
  const n = Math.atan2(Math.sin(th) / ry, Math.cos(th) / rx);
  return [cx + rx * 0.9 * Math.cos(th), cy + ry * 0.9 * Math.sin(th), rx > 20 ? 3 : 2.5, n / D2R + 90];
}));
const CRACKS = [[[-30, -24], [-26, -18], [-29, -12], [-24, -6], [-27, 0]], [[-14, -14], [-18, -9], [-14, -4]], [[-40, -36], [-36, -32], [-38, -26]]];
function mtMood(a, m) {
  if (m.hp <= 0) return 'dead';
  if ((a.mtVuln ?? 0) > 0.3) return 'dizzy';
  const ph = a.mtPh ?? a.ph;
  const kind = a.mtKind;
  if (kind === 'slam') return 'shout';
  if (kind === 'knight' && ph.strike > 0.2) return 'shout';
  if ((a.mtHide ?? 0) > 0.5) return 'hide';
  if (ph.strike > 0.25) return 'shout';
  if (a.ph.atk || ph.antic > 0.3) return 'angry';
  if (a.mood === 'hurt' || a.face === 'hurt') return 'hurt';
  if (m.cine?.mood === 'angry') return 'angry';
  if (m.cine?.mood === 'happy') return 'happy';
  const act = a.mtAct ?? {};
  if (act.preen > 0.4) return 'preen';
  if (act.hmph > 0.4) return 'hmph';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.6 < 0.13) return 'blink';
  return 'idle';
}

// ---------- The still (portraits) ----------
export function matriarchStill(pose, f, mood) {
  const fm = MT_FACES[mood] ? mood : MOODS.has(mood) ? mood : 'idle';
  const P = { x: 0, lift: 0, hide: 0, bdx: 0, lean: 0, tilt: 0 };
  const lg = legSet(P);
  const [bx, by] = BODY;
  const rot = ([x, y], deg) => [x * Math.cos(deg * D2R) - y * Math.sin(deg * D2R), x * Math.sin(deg * D2R) + y * Math.cos(deg * D2R)];
  const legAt = (k) => {
    const far = k[0] === 'f';
    const [hx, hy] = LEGS[k];
    const th = lg[`t${k}`];
    const sh = lg[`s${k}`];
    const [kx, ky] = [bx + hx + Math.cos(th * D2R) * L1, by + hy + Math.sin(th * D2R) * L1];
    return [...put(thighP(far)(), [2, 4], bx + hx, by + hy, th), ...put(shinP(far)(), [2, 4], kx, ky, th + sh)];
  };
  // The big claw: arm 30, palm level, the staff upright; the small claw resting behind.
  const sN = [bx + SHN[0], by + SHN[1]];
  const wN = [sN[0] + Math.cos(30 * D2R) * UAN, sN[1] + Math.sin(30 * D2R) * UAN];
  const hN = rot(HINGE_N, 0);
  const gN = rot(GRIP_N, 0);
  const sF = [bx + SHF[0], by + SHF[1]];
  const wF = [sF[0] + Math.cos(150 * D2R) * UAF, sF[1] + Math.sin(150 * D2R) * UAF];
  const hF = rot(HINGE_F, 190);
  return { w: 104, h: 92, res: 2, shapes: shift([
    ...put(shellP(), SHELL_PV, 10, -20),
    ...put(kelpP(0)(), [4, 2], 10 - 26, -20 - 34, 8), ...put(kelpP(1)(), [4, 2], 10 - 38, -20 - 32, 10),
    ...legAt('fB'), ...legAt('fF'),
    ...put(armFP(), [2, 3.5], sF[0], sF[1], 150), ...put(palmFP(), [2, 6], wF[0], wF[1], 190), ...put(dactFP(), [1.5, 3], wF[0] + hF[0], wF[1] + hF[1], 190),
    ...legAt('nB'), ...legAt('nF'),
    ...put(bodyP(), [22, 22], bx, by), ...put((MT_FACES[fm] ?? MT_FACES.idle)(), [22, 22], bx, by),
    ...put(tiaraP(), [12, 14], bx + 1, by - 15.6),
    ...put(staffP(), [19, 10], wN[0] + gN[0], wN[1] + gN[1], -90),
    ...put(armNP(), [2, 4], sN[0], sN[1], 30), ...put(palmNP(), [3, 9], wN[0], wN[1], 0), ...put(dactNP(), [2, 4], wN[0] + hN[0], wN[1] + hN[1], 0),
  ], 54, 90) };
}
