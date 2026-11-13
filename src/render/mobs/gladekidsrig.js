// The Whispering Glade's two little tanukis in disguise (2026-11-13), as live rigs on the boss rig
// (rig.js): the approved drawings (gladekids.js) cut into parts, each drawn once and turned about
// its joint every frame, the loose bits on springs. Nothing squashed or stretched. Outer outline
// only: every part is drawn outlined, then all again bare over them, so only the outer edge keeps
// a line. When one is beaten it goes up in a puff of smoke and leaves a leaf (particles.js).
//
// Puddle Kid (walks):
//   walk    little stomping steps, stepped by the distance walked on an eased speed (a planted boot
//           stays exactly put); she bobs on each step, the raincoat sways, her head nods a beat
//           behind, the lily-pad umbrella bounces on its stem.
//   idle    breathes, twirls the umbrella; now and then looks up and holds a hand out for the rain,
//           and taps a boot in her puddle.
//   attack  lifts the lily pad high behind her, then hops forward and brings it down with a splash.
// Blossom Fairy (flies):
//   idle    hovers, bobbing on slow butterfly wingbeats, legs dangling and swinging, twin tails
//           swaying, the dandelion wand drawing little circles and shedding twinkles.
//   attack  draws the wand back over her head, then swishes it forward, blowing a burst of seeds.

import { part, partBare, makeRig, stateBlend, smooth, clamp, TAU } from './rig.js';
import { gladeKidShapes, KID_BOX, KID_JOINTS, mapShape } from './gladekids.js';

const D2R = Math.PI / 180;
const SC = 1 / 3;
const BW = Math.ceil(KID_BOX.W * SC);
const BH = Math.ceil(KID_BOX.H * SC);
const scaled = (shapes) => shapes.map((sh) => mapShape(sh, ([x, y]) => [x * SC, y * SC], SC));
const FACES = new Set(['idle', 'happy', 'angry', 'hurt', 'blink']);
const moodOf = (m) => (m === 'dead' ? 'hurt' : FACES.has(m) ? m : 'idle');
// One group of a drawing as a part (outlined, or bare for the second pass).
const piece = (kind, name, mood, bare) => {
  const key = `gk|${kind}|${name}|${mood ?? ''}`;
  const shapes = () => scaled(gladeKidShapes(kind, mood ?? 'idle').groups[name] ?? []);
  return bare ? partBare(key, BW, BH, shapes, 4, 3) : part(key, BW, BH, shapes, 4, 3);
};
// A joint in the rig's space (the feet at 0, 0), and in a part's box.
const J = (kind, j) => KID_JOINTS[kind][j];
const rel = (kind, j, from) => {
  const a = J(kind, j);
  const b = from ? J(kind, from) : [KID_BOX.CX, KID_BOX.G];
  return [(a[0] - b[0]) * SC, (a[1] - b[1]) * SC];
};
const pv = (kind, j) => [J(kind, j)[0] * SC, J(kind, j)[1] * SC];

// The face for the moment: dead and hurt wince, a fierce face through an attack, a blink now and then.
const faceOf = (a, m) => {
  if (a.face === 'dead') return 'hurt';
  if (a.ph.atk) return 'angry';
  const f = moodOf(a.face);
  if (f === 'idle' && ((a.t + (m.uid % 7) * 0.61) % 4.2) < 0.13) return 'blink';
  return f;
};
// A held stretch of a loop: 0 before a, easing to 1 by b, held to c, easing back by d.
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));

// Every part twice: the outlined pass in order, then the bare pass in the same order over it.
function twoPass(list) {
  const first = list.map((p) => (p.s ? { ...p, s: (a, S) => p.s(a, S, false) } : p));
  const second = list.filter((p) => p.s).map((p) => ({ ...p, name: `${p.name}~b`, s: (a, S) => p.s(a, S, true) }));
  return [...first, ...second];
}

// ---------- The Puddle Kid ----------

const PK = 'puddle';
const STRIDE = 18;
const DUTY = 0.56;
const REACH = (STRIDE * DUTY) / 2;
// The walk, one cycle per STRIDE px, on its speed eased over a moment.
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(120, Math.abs(odo - (st.pkOdo ?? odo)) / dt);
  st.pkOdo = odo;
  st.pkV = (st.pkV ?? 0) + (raw - (st.pkV ?? 0)) * Math.min(1, dt * 5);
  st.pkU = ((st.pkU ?? 0) + (st.pkV / STRIDE) * dt) % 1;
  return st.pkU;
};
// A boot at phase u: planted (sliding back at exactly the walking speed), then lifted and set down
// ahead on an eased arc. [x off its rest, lift].
const bootAt = (u, ph) => {
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < DUTY) return [REACH - (2 * REACH * q) / DUTY, 0];
  const s = (q - DUTY) / (1 - DUTY);
  return [-REACH + 2 * REACH * smooth(s), Math.sin(Math.PI * s) * 2.2];
};
const LOOP_PK = 11;

export const puddleKidRig = makeRig({
  w: BW,
  h: BH,
  soft: true,
  stride: STRIDE,
  recover: 0.6,
  springs: {
    x: [200, 18],
    lift: [190, 11],
    tilt: [140, 11],
    head: [70, 7],
    armN: [120, 11],
    armF: [130, 12],
    umb: [60, 6],
    tapN: [260, 18],
  },
  fast: ['x', 'lift', 'tilt', 'armF', 'armN'],
  kick: { tilt: -260, head: 420, umb: 380 },
  turnKick: { tilt: 140, umb: 200, head: 120 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.13;
    a.pkU = stepPhase(m, a);
    const lu = t % LOOP_PK;
    const catchRain = hold(lu, 2, 2.6, 4.6, 5.3);
    const tap = hold(lu, 7.2, 7.4, 8.4, 8.6);
    const breath = Math.sin(t * 1.6);
    const idle = {
      x: 0, lift: breath * 0.12, tilt: breath * 0.6, head: -catchRain * 9 + Math.sin(t * 0.7) * 2,
      armN: -catchRain * 26 + breath * 2, armF: Math.sin(t * 0.9) * 3, tapN: tap * Math.max(0, Math.sin((lu - 7.4) * 9)) * 1.6,
    };
    // Stomping steps: a bob up off each planted boot, a sway from side to side.
    const p = a.pkU * TAU;
    const walk = { x: 0, lift: 0.3 + (0.5 - 0.5 * Math.cos(p * 2)) * 1.1, tilt: Math.sin(p) * 3.2, head: 3 + Math.sin(p * 2 - 1.2) * 3, armN: Math.sin(p) * 14, armF: -Math.sin(p) * 4, tapN: 0 };
    // Lifting the lily pad high behind her, crouched; then the hop forward and the splash down.
    const antic = { x: -1.5, lift: -1, tilt: -9, head: -10, armN: 30, armF: -42, tapN: 0 };
    const strike = { x: 4, lift: 0, tilt: 12, head: 8, armN: -30, armF: 60, tapN: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S) {
    // The umbrella rides its stem a beat behind every move.
    return { umb: -S.tilt * 1.4 - S.x * 2 - S.lift * 4 + S.armF * 0.2 };
  },
  under(ctx, m, a) {
    // A splash out of her puddle when the lily pad comes down: drops thrown up and out.
    const since = a.ph.since;
    if (since < 0 || since > 0.5) return;
    const u = since / 0.5;
    ctx.globalAlpha = (a.alpha ?? 1) * (1 - u);
    for (let i = 0; i < 7; i++) {
      const dir = i < 4 ? 1 : -1;
      const sp = 9 + (i % 4) * 4;
      const x = 6 + dir * sp * u * (1 + (i % 3) * 0.3);
      const y = -(18 + (i % 2) * 8) * u + 30 * u * u;
      ctx.fillStyle = i % 2 ? '#d2f2fc' : '#9ad8f0';
      ctx.beginPath();
      ctx.arc(x, Math.min(0, y), 1.1 - u * 0.4, 0, TAU);
      ctx.fill();
    }
  },
  parts: twoPass([
    { name: 'puddle', parent: null, s: (a, S, b) => piece(PK, 'puddle', null, b), pivot: [KID_BOX.CX * SC, KID_BOX.G * SC] },
    { name: 'torso', parent: null, at: (S) => [rel(PK, 'hip')[0] + S.x, rel(PK, 'hip')[1] - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'farArm', parent: 'torso', s: (a, S, b) => piece(PK, 'farArm', null, b), pivot: pv(PK, 'shF'), at: () => rel(PK, 'shF', 'hip'), rot: (S) => S.armF * D2R },
    { name: 'umbrella', parent: 'farArm', s: (a, S, b) => piece(PK, 'umbrella', null, b), pivot: pv(PK, 'grip'), at: () => rel(PK, 'grip', 'shF'), rot: (S) => S.umb * D2R },
    { name: 'hood', parent: 'torso', s: (a, S, b) => piece(PK, 'hood', null, b), pivot: pv(PK, 'hip') },
    { name: 'hairBack', parent: 'torso', s: (a, S, b) => piece(PK, 'hairBack', null, b), pivot: pv(PK, 'neck'), at: () => rel(PK, 'neck', 'hip'), rot: (S) => S.head * D2R },
    ...['F', 'N'].map((k) => ({
      name: `boot${k}`,
      parent: null,
      s: (a, S, b) => piece(PK, `boot${k}`, null, b),
      pivot: pv(PK, `ank${k}`),
      at: (S, a) => {
        const [dx, lift] = bootAt(a.pkU ?? 0, k === 'F' ? 0.5 : 0);
        const [x, y] = rel(PK, `ank${k}`);
        return [x + dx * a.walkW + S.x * 0.5, y - lift * a.walkW - (k === 'N' ? S.tapN : 0)];
      },
      rot: (S, a) => (bootAt(a.pkU ?? 0, k === 'F' ? 0.5 : 0)[1] * -6 * a.walkW - (k === 'N' ? S.tapN * 8 : 0)) * D2R,
    })),
    { name: 'body', parent: 'torso', s: (a, S, b) => piece(PK, 'body', null, b), pivot: pv(PK, 'hip') },
    { name: 'head', parent: 'torso', s: (a, S, b) => piece(PK, 'head', faceOf(a, a.m), b), pivot: pv(PK, 'neck'), at: () => rel(PK, 'neck', 'hip'), rot: (S) => S.head * D2R },
    { name: 'nearArm', parent: 'torso', s: (a, S, b) => piece(PK, 'nearArm', null, b), pivot: pv(PK, 'shN'), at: () => rel(PK, 'shN', 'hip'), rot: (S) => S.armN * D2R },
  ]),
});

// ---------- The Blossom Fairy ----------

const BF = 'fairy';
const LOOP_BF = 9;

export const blossomFairyRig = makeRig({
  w: BW,
  h: BH,
  soft: true,
  stride: 40,
  recover: 0.55,
  springs: {
    x: [160, 14],
    lift: [60, 9],
    tilt: [110, 10],
    head: [80, 8],
    armN: [130, 11],
    armF: [110, 10],
    legF: [50, 5],
    legN: [50, 5],
    tails: [40, 5],
  },
  fast: ['x', 'tilt', 'armN'],
  kick: { tilt: -240, head: 380, legF: 300, legN: 260, tails: 200 },
  turnKick: { tilt: 120, legF: 160, legN: 140, tails: 160 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.83;
    const lu = t % LOOP_BF;
    const twirl = hold(lu, 3, 3.5, 5.5, 6.2);
    const hover = Math.sin(t * 2.2);
    const idle = { x: 0, lift: 2.2 + hover * 1.4, tilt: Math.sin(t * 1.1) * 2, head: Math.sin(t * 0.8) * 3 - twirl * 4, armN: Math.sin(t * 2.4) * 8 - twirl * 16, armF: Math.sin(t * 1.3) * 6 };
    const walk = { ...idle, tilt: idle.tilt + 7, head: idle.head - 4, armF: idle.armF + 10 };
    // The wand drawn back over her head; then the swish forward and the burst of seeds.
    const antic = { x: -2, lift: 3.4, tilt: -11, head: -8, armN: -24, armF: 12 };
    const strike = { x: 3, lift: 2, tilt: 10, head: 6, armN: 34, armF: -10 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  follow(S, a) {
    // Dangling legs and the twin tails trail every move and swing on the hover.
    const t = a.t;
    return {
      legF: -S.tilt * 1.3 - S.x * 3 + Math.sin(t * 2.2 - 1.2) * 5,
      legN: -S.tilt * 1.3 - S.x * 3 + Math.sin(t * 2.2 - 0.6) * 7,
      tails: -S.tilt * 1.4 - S.x * 3 + Math.sin(t * 1.4) * 3,
    };
  },
  fx(ctx, m, a, S, matOf) {
    // Twinkles shed from the wand, and the seeds blown off it on the swish.
    const M = matOf('nearArm');
    const [px, py] = pv(BF, 'puff');
    const wx = M[0] * px + M[2] * py + M[4];
    const wy = M[1] * px + M[3] * py + M[5];
    const base = a.alpha ?? 1;
    for (let i = 0; i < 3; i++) {
      const k = ((a.t * 0.7 + i / 3) % 1);
      ctx.globalAlpha = base * Math.sin(k * Math.PI) * 0.9;
      ctx.fillStyle = '#fff2a0';
      const x = wx - 2 - k * 6 + Math.sin(k * 7 + i) * 2;
      const y = wy + k * 9;
      const r = 1.2 * (1 - k * 0.5);
      ctx.fillRect(x - r, y - 0.3, r * 2, 0.6);
      ctx.fillRect(x - 0.3, y - r, 0.6, r * 2);
    }
    const since = a.ph.since;
    if (since >= 0 && since < 0.6) {
      const u = since / 0.6;
      for (let i = 0; i < 6; i++) {
        const ang = -0.5 + i * 0.2;
        const d = 4 + u * (16 + (i % 3) * 5);
        const x = wx + Math.cos(ang) * d;
        const y = wy + Math.sin(ang) * d + Math.sin(u * 6 + i) * 1.2;
        ctx.globalAlpha = base * (1 - u);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#c8d0dc';
        ctx.fillRect(x - Math.cos(ang) * 1.6, y - Math.sin(ang) * 1.6, 0.5, 0.5);
      }
    }
  },
  parts: twoPass([
    { name: 'torso', parent: null, at: (S) => [rel(BF, 'hip')[0] + S.x, rel(BF, 'hip')[1] - S.lift], rot: (S) => S.tilt * D2R },
    // Wings: slow butterfly beats, the far pair a touch behind the near.
    ...[['wingFU', -16, 0.25], ['wingFL', 9, 0.4], ['wingNU', -18, 0], ['wingNL', 10, 0.15]].map(([name, amp, lag]) => ({
      name,
      parent: 'torso',
      s: (a, S, b) => piece(BF, name, null, b),
      pivot: pv(BF, 'wing'),
      at: () => rel(BF, 'wing', 'hip'),
      rot: (S, a) => (amp * (0.5 + 0.5 * Math.sin((a.t + (a.m?.uid ?? 0) * 0.37) * TAU * 1.5 - lag * TAU)) - amp * 0.3) * D2R,
    })),
    { name: 'tails', parent: 'torso', s: (a, S, b) => piece(BF, 'tails', null, b), pivot: pv(BF, 'neck'), at: () => rel(BF, 'neck', 'hip'), rot: (S) => (S.head + S.tails) * D2R },
    { name: 'hairBack', parent: 'torso', s: (a, S, b) => piece(BF, 'hairBack', null, b), pivot: pv(BF, 'neck'), at: () => rel(BF, 'neck', 'hip'), rot: (S) => S.head * D2R },
    { name: 'farArm', parent: 'torso', s: (a, S, b) => piece(BF, 'farArm', null, b), pivot: pv(BF, 'shF'), at: () => rel(BF, 'shF', 'hip'), rot: (S) => S.armF * D2R },
    { name: 'legF', parent: 'torso', s: (a, S, b) => piece(BF, 'legF', null, b), pivot: pv(BF, 'hipF'), at: () => rel(BF, 'hipF', 'hip'), rot: (S) => S.legF * D2R },
    { name: 'legN', parent: 'torso', s: (a, S, b) => piece(BF, 'legN', null, b), pivot: pv(BF, 'hipN'), at: () => rel(BF, 'hipN', 'hip'), rot: (S) => S.legN * D2R },
    { name: 'body', parent: 'torso', s: (a, S, b) => piece(BF, 'body', null, b), pivot: pv(BF, 'hip') },
    { name: 'head', parent: 'torso', s: (a, S, b) => piece(BF, 'head', faceOf(a, a.m), b), pivot: pv(BF, 'neck'), at: () => rel(BF, 'neck', 'hip'), rot: (S) => S.head * D2R },
    { name: 'nearArm', parent: 'torso', s: (a, S, b) => piece(BF, 'nearArm', null, b), pivot: pv(BF, 'shN'), at: () => rel(BF, 'shN', 'hip'), rot: (S) => S.armN * D2R },
  ]),
});

// ---------- Stills (portraits, the book) ----------

const still = (kind) => (pose, f, mood) => ({ w: BW, h: BH, res: 3, shapes: scaled(gladeKidShapes(kind, moodOf(mood)).shapes.filter(Boolean)) });
export const puddleKidStill = still(PK);
export const blossomFairyStill = still(BF);
// (The rigs read the monster through `a.m`.)
for (const rig of [puddleKidRig, blossomFairyRig]) {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => draw(ctx, m, Object.assign(a, { m }));
}
