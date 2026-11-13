// The Whispering Glade's two little tanukis in disguise (2026-11-13), as live rigs on the boss rig
// (rig.js), built on the kid base (kidbase.js, kidrig.js): the drawings (gladekids.js) cut into
// layers, each drawn once and turned about its joint every frame, every loose layer swinging on its
// own physics. Nothing squashed or stretched. Outer outline
// only: every part is drawn outlined, then all again bare over them, so only the outer edge keeps
// a line. When one is beaten it goes up in a puff of smoke and leaves a leaf (particles.js).
//
// Puddle Kid (walks):
//   walk    bouncy stomping steps, stepped by the distance walked on an eased speed (a planted boot
//           stays exactly put); she springs up off each step, rocks side to side, her head nods a
//           beat behind, the lily-pad umbrella bounces on its stem. Her little legs swing from
//           boot to hip, so boots and coat stay joined.
//   idle    breathes; looks up and holds a hand out for the rain, two little hops in her puddle
//           (crouch, hop, splash), taps a boot, and a happy wiggle on her toes.
//   attack  lifts the lily pad high behind her, then hops forward and brings it down with a splash.
// Blossom Fairy (flies):
//   idle    hovers on a bouncy bob, butterfly wingbeats, legs dangling from well up under the
//           skirt, twin tails swaying; cheers with both arms up, twirls the dandelion wand, and
//           has a fit of happy kicking.
//   attack  draws the wand back over her head, then swishes it forward, blowing a burst of seeds.

import { makeRig, stateBlend, smooth, clamp, TAU } from './rig.js';
import { gladeKidShapes, KID_JOINTS, KID_BOX } from './gladekids.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';

// Built on the kid base (kidbase.js, kidrig.js): every layer of each outfit is its own part, and
// the loose ones (coat panels, pocket flaps, collar points, hood, hair, fringe, skirt, petals,
// waist leaves, pigtails, dangling legs, lily pad, dandelion puff) swing on their own physics.
const KITS = {
  puddle: kidKit('puddle', (mood) => gladeKidShapes('puddle', mood), KID_JOINTS.puddle),
  fairy: kidKit('fairy', (mood) => gladeKidShapes('fairy', mood), KID_JOINTS.fairy),
};
const rel = (kind, j, from) => KITS[kind].rel(j, from);
const pv = (kind, j) => KITS[kind].pv(j);
const through = (M, kind, j, pivot) => KITS[kind].through(M, j, pivot);
// A water drop (a round bottom, a point on top, a glint) and the little splash of one landing.
function drop(ctx, x, y, r, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#9ad8f0';
  ctx.strokeStyle = '#4f9ec4';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 2.3);
  ctx.quadraticCurveTo(x + r * 1.1, y - r * 0.6, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.quadraticCurveTo(x - r * 1.1, y - r * 0.6, x, y - r * 2.3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - r * 0.45, y - r * 0.5, r * 0.4, r * 0.5);
}
function splash(ctx, x, y, u, alpha) {
  if (u < 0 || u > 1) return;
  ctx.globalAlpha = alpha * (1 - u);
  ctx.fillStyle = '#bfe8f8';
  for (const d of [-1, 1]) {
    const px = x + d * (0.8 + u * 2.4);
    const py = y - Math.sin(u * Math.PI) * 2.2;
    ctx.beginPath();
    ctx.arc(px, py, 0.45 * (1 - u * 0.5), 0, TAU);
    ctx.fill();
  }
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
const LOOP_PK = 15;
// A small steady hash for where each raindrop lands.
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// The water of her puddle, alive (in the rig's space, the feet at 0, 0): rain rings popping up
// all over it, a ring round each boot as it plants, wide rings when she lands a hop or splashes
// the lily pad down, the boots' blue mirrored under them, and a slow shimmer sliding across.
function paintPuddle(ctx, a, S) {
  const base = ctx.globalAlpha;
  const t = a.t + (a.m?.uid ?? 0) * 0.71;
  // The raindrop streaking down just before each rain ring (behind her: the parts after cover it).
  ctx.strokeStyle = '#bfe8f8';
  ctx.lineWidth = 0.45;
  for (let i = 0; i < 3; i++) {
    const P = 1.5 + i * 0.23;
    const k = (t + i * 0.57) / P;
    const n = Math.floor(k) + 1;
    const left = (n - k) * P;
    if (left > 0.28) continue;
    const x = -12 + hash(n * 3 + i) * 24;
    const y = -0.9 + hash(n * 7 + i) * 0.7 - (left / 0.28) * 36;
    ctx.globalAlpha = base * 0.85;
    ctx.beginPath();
    ctx.moveTo(x, y - 2.6);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(-2, -0.67, 12.6, 1.6, 0, 0, TAU);
  ctx.ellipse(4, -0.53, 10.8, 1.45, 0, 0, TAU);
  ctx.clip();
  const ring = (x, y, u, size, alpha) => {
    if (u < 0 || u > 1) return;
    const rx = 0.5 + smooth(u) * size;
    ctx.globalAlpha = base * alpha * (1 - u) * (1 - u * 0.4);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.3, 0, 0, TAU);
    ctx.stroke();
  };
  ctx.lineWidth = 0.55;
  // The boots mirrored in the water, fading as a boot lifts.
  for (const k of ['F', 'N']) {
    const [ax, ay] = ankleOf(S, a, k);
    const up = clamp((rel(PK, `ank${k}`)[1] - ay) / 2.5, 0, 1);
    ctx.globalAlpha = base * 0.5 * (1 - up);
    ctx.fillStyle = k === 'F' ? '#2a5e9e' : '#3a7ec4';
    ctx.beginPath();
    ctx.ellipse(ax + 1, 0.15, 3.2 * (1 - up * 0.4), 0.5, 0, 0, TAU);
    ctx.fill();
  }
  // The shimmer.
  ctx.fillStyle = '#ffffff';
  for (const [x0, sp, ph, w] of [[-6, 0.6, 0, 4.4], [8, 0.8, 2, 3]]) {
    ctx.globalAlpha = base * (0.45 + 0.25 * Math.sin(t * 1.3 + ph));
    ctx.beginPath();
    ctx.ellipse(x0 + Math.sin(t * sp + ph) * 2.5, -1.15, w, 0.32, 0, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = '#ffffff';
  // Rain: three drops at a time, each landing somewhere new.
  for (let i = 0; i < 3; i++) {
    const P = 1.5 + i * 0.23;
    const k = (t + i * 0.57) / P;
    const n = Math.floor(k);
    const u = (k - n) * P / 0.9;
    const x = -12 + hash(n * 3 + i) * 24;
    const y = -0.9 + hash(n * 7 + i) * 0.7;
    ring(x, y, u, 3.4, 1);
    ring(x, y, u - 0.25, 2, 0.7);
  }
  // A ring round each boot as it plants.
  const st = a.mo?.rig ?? {};
  const v = Math.max(1, st.pkV ?? 0);
  if (a.walkW > 0.2) {
    for (const k of ['F', 'N']) {
      const q = ((((a.pkU ?? 0) + (k === 'F' ? 0.5 : 0)) % 1) + 1) % 1;
      if (q < DUTY) ring(rel(PK, `ank${k}`)[0] + REACH * a.walkW + 1, -0.2, (q * STRIDE) / v / 0.55, 4.2, 0.95 * a.walkW);
    }
  }
  // Wide rings on a hop's landing and on the lily pad's splash.
  const hop = a.pkSplash ?? -1;
  if (hop >= 0) for (const k of ['F', 'N']) ring(rel(PK, `ank${k}`)[0] + 1, -0.2, hop / 0.7, 6, 1);
  if (a.ph.since >= 0) ring(2, -0.4, a.ph.since / 0.8, 11, 1);
  ctx.restore();
  ctx.globalAlpha = base;
}
// Two little hops in her puddle in the idle loop: [take-off, landing] in loop seconds.
const HOPS = [[6.7, 7.08], [7.28, 7.66]];
const hopAt = (lu) => {
  for (const [a, b] of HOPS) if (lu >= a && lu <= b) return Math.sin(Math.PI * ((lu - a) / (b - a))) * 3.4;
  return 0;
};
// Seconds since the last hop landed (for the splash), or -1.
const sinceLanding = (lu) => {
  for (let i = HOPS.length - 1; i >= 0; i--) if (lu >= HOPS[i][1]) return lu - HOPS[i][1];
  return -1;
};
// Where the torso puts a hip socket, and where a boot's ankle is, in the rig's space: each leg is
// swung from one to the other (never stretched; its top just tucks deeper under the coat).
const socketOf = (S, k) => {
  const [hx, hy] = rel(PK, 'hip');
  const [ox, oy] = rel(PK, `sock${k}`, 'hip');
  const r = S.tilt * D2R;
  return [hx + S.x + ox * Math.cos(r) - oy * Math.sin(r), hy - S.lift - S.hop + ox * Math.sin(r) + oy * Math.cos(r)];
};
const ankleOf = (S, a, k) => {
  const [dx, lift] = bootAt(a.pkU ?? 0, k === 'F' ? 0.5 : 0);
  const [x, y] = rel(PK, `ank${k}`);
  return [x + dx * a.walkW + S.x * 0.5, y - lift * a.walkW - (k === 'N' ? S.tapN : 0) - S.hop];
};

const PKK = KITS.puddle;
export const puddleKidRig = makeRig({
  w: PKK.BW,
  h: PKK.BH,
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
    umb: [55, 5],
    tapN: [260, 18],
    hop: [420, 30],
  },
  fast: ['x', 'lift', 'tilt', 'armF', 'armN', 'hop'],
  kick: { tilt: -260, head: 460, x: -40 },
  turnKick: { tilt: 140, head: 140, lift: -30 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.13;
    a.pkU = stepPhase(m, a);
    const lu = t % LOOP_PK;
    const catchRain = hold(lu, 2, 2.6, 4.6, 5.3);
    // A crouch before each hop and a soft knee-give on each landing.
    const crouch = hold(lu, 6.35, 6.6, 6.62, 6.72) + hold(lu, 7.04, 7.12, 7.2, 7.3) + hold(lu, 7.62, 7.72, 7.8, 8.05);
    const hop = hopAt(lu);
    const tap = hold(lu, 9.4, 9.6, 10.6, 10.8);
    // A happy wiggle: little bounces on her toes, rocking side to side, the lily pad bobbing.
    const wig = hold(lu, 12, 12.4, 13.8, 14.3);
    const breath = Math.sin(t * 1.6);
    const bounce = Math.abs(Math.sin(t * 6.4));
    const idle = {
      x: 0,
      lift: breath * 0.12 - crouch * 1.1 + wig * (bounce * 1.3 - 0.3),
      hop,
      tilt: breath * 0.6 + wig * Math.sin(t * 3.2) * 6 + (hop > 0 ? 3 : 0),
      head: -catchRain * 9 + Math.sin(t * 0.7) * 2 - wig * Math.sin(t * 3.2 - 0.6) * 7 + crouch * 5,
      armN: -catchRain * 26 + breath * 2 - (hop > 0 ? 34 : 0) + crouch * 14 - wig * 22 + wig * Math.sin(t * 6.4) * 10,
      armF: Math.sin(t * 0.9) * 3 - (hop > 0 ? 10 : 0),
      tapN: tap * Math.max(0, Math.sin((lu - 9.6) * 9)) * 1.6,
    };
    a.pkSplash = 1 - a.walkW > 0.5 && !a.ph.atk ? sinceLanding(lu) : -1;
    a.pkCatch = catchRain * (1 - a.walkW) * (a.ph.atk ? 0 : 1);
    a.pkT = t;
    // Bouncy stomping steps: she springs up off each planted boot and drops onto the next, rocks
    // side to side, the head nodding a beat late, the free arm pumping.
    const p = a.pkU * TAU;
    const spring = Math.pow(Math.abs(Math.sin(p)), 0.65);
    const walk = { x: 0, lift: 0.2 + spring * 2.3, hop: 0, tilt: Math.sin(p) * 4.2, head: 3 + Math.sin(p * 2 - 1.4) * 4.5, armN: Math.sin(p) * 22, armF: -Math.sin(p) * 6, tapN: 0 };
    // Lifting the lily pad high behind her, crouched; then the hop forward and the splash down.
    const antic = { x: -1.5, lift: -1.4, hop: 0, tilt: -10, head: -11, armN: 30, armF: -44, tapN: 0 };
    const strike = { x: 4, lift: 0, hop: 1.2, tilt: 12, head: 9, armN: -30, armF: 60, tapN: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  fx(ctx, m, a, S, matOf) {
    // Drips swell at the lily pad's two tips and fall off; in the rain-catching stretch of her
    // idle, drops fall into her palm and bounce off it.
    const base = a.alpha ?? 1;
    const t = a.pkT ?? a.t;
    const M = matOf('umbrella');
    ctx.lineWidth = 0.3;
    ['tipL', 'tipR'].forEach((j, i) => {
      const [tx, ty] = through(M, PK, j, 'grip');
      const P = 2.3 + i * 0.8;
      const f = (((t + i * 1.3) % P) + P) % P / P;
      const swell = 0.7;
      const r = 0.25 + 0.6 * smooth(Math.min(1, f / swell));
      let y = ty + r;
      if (f > swell) y += 0.5 * 240 * ((f - swell) * P) ** 2;
      if (y < 0) drop(ctx, tx, y, r, base);
      else if (y - 0 < 6) splash(ctx, tx, 0, (y - 0) / 6, base);
    });
    const catching = a.pkCatch ?? 0;
    if (catching > 0.05) {
      const [px, py] = through(matOf('nearArm'), PK, 'palm', 'shN');
      for (let i = 0; i < 2; i++) {
        const P = 0.9;
        const f = (((t + i * 0.45) % P) + P) % P / P;
        if (f < 0.42) drop(ctx, px + i * 1.2 - 0.6, py - 3 - 20 * (1 - (f / 0.42) ** 2), 0.55, base * catching);
        else splash(ctx, px + i * 1.2 - 0.6, py - 2.6, (f - 0.42) / 0.58, base * catching);
      }
    }
  },
  under(ctx, m, a) {
    // A splash out of her puddle when the lily pad comes down, or when she lands a hop: drops
    // thrown up and out.
    const atk = a.ph.since;
    const hop = a.pkSplash ?? -1;
    const since = atk >= 0 && atk <= 0.5 ? atk : hop >= 0 && hop <= 0.4 ? hop * 1.25 : -1;
    if (since < 0) return;
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
  // Every layer, back to front. The soft ones swing on their own (rig.js, Soft layers).
  parts: twoPass([
    { name: 'puddle', parent: null, s: (a, S, b) => PKK.piece('puddle', null, b), pivot: [KID_BOX.CX / 3, KID_BOX.G / 3], paint: paintPuddle },
    PKK.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel(PK, 'hip')[0] + S.x, rel(PK, 'hip')[1] - S.lift - S.hop], rot: (S) => S.tilt * D2R }),
    PKK.layer('farArm', { parent: 'torso', pivot: 'shF', rot: (S) => S.armF * D2R }),
    // The lily pad bobs on its stem in her hand.
    PKK.layer('umbrella', { parent: 'farArm', pivot: 'grip', soft: { ...SOFT.PROP, gain: 1.1, k: 70 } }),
    PKK.layer('hood', { parent: 'torso', pivot: 'neck', soft: SOFT.HOOD }),
    PKK.layer('hairBack', { parent: 'head', from: 'neck', pivot: 'crown', soft: SOFT.HAIR }),
    ...['F', 'N'].map((k) => ({
      name: `leg${k}`,
      parent: null,
      s: (a, S, b) => PKK.piece(`leg${k}`, null, b),
      pivot: pv(PK, `ank${k}`),
      at: (S, a) => ankleOf(S, a, k),
      rot: (S, a) => {
        const [ax, ay] = ankleOf(S, a, k);
        const [sx, sy] = socketOf(S, k);
        return Math.atan2(sx - ax, ay - sy);
      },
    })),
    ...['F', 'N'].map((k) => ({
      name: `boot${k}`,
      parent: null,
      s: (a, S, b) => PKK.piece(`boot${k}`, null, b),
      pivot: pv(PK, `ank${k}`),
      at: (S, a) => ankleOf(S, a, k),
      rot: (S, a) => (bootAt(a.pkU ?? 0, k === 'F' ? 0.5 : 0)[1] * -6 * a.walkW - (k === 'N' ? S.tapN * 8 : 0)) * D2R,
    })),
    // The raincoat: the yoke, its lining, the two front panels swinging open and shut from the top
    // of the placket, a flap on each pocket, the two collar points, the chin's shadow.
    PKK.layer('body', { parent: 'torso', pivot: 'hip' }),
    PKK.layer('lining', { parent: 'torso', pivot: 'hip', from: 'hip' }),
    PKK.layer('coatL', { parent: 'torso', pivot: 'hemL', from: 'hip', soft: { ...SOFT.CLOTH, max: 14 } }),
    PKK.layer('flapL', { parent: 'coatL', pivot: 'flapL', soft: SOFT.FLAP }),
    PKK.layer('coatR', { parent: 'torso', pivot: 'hemR', from: 'hip', soft: { ...SOFT.CLOTH, max: 14, k: 105 } }),
    PKK.layer('flapR', { parent: 'coatR', pivot: 'flapR', soft: { ...SOFT.FLAP, k: 185 } }),
    PKK.layer('collarL', { parent: 'torso', pivot: 'colL', from: 'hip', soft: { ...SOFT.FLAP, gain: 0.2, max: 18 } }),
    PKK.layer('collarR', { parent: 'torso', pivot: 'colR', from: 'hip', soft: { ...SOFT.FLAP, gain: 0.2, max: 18, k: 190 } }),
    PKK.layer('chin', { parent: 'head', pivot: 'neck', from: 'neck' }),
    PKK.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R, face: true }),
    PKK.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE, face: true }),
    PKK.layer('nearArm', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.armN * D2R }),
  ]),
});

// ---------- The Blossom Fairy ----------

const BF = 'fairy';
const LOOP_BF = 9;

const BFK = KITS.fairy;
export const blossomFairyRig = makeRig({
  w: BFK.BW,
  h: BFK.BH,
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
  },
  fast: ['x', 'tilt', 'armN'],
  kick: { tilt: -240, head: 400, x: -40 },
  turnKick: { tilt: 120, lift: -30 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.83;
    const lu = t % LOOP_BF;
    // Her idle loop: a cheer (both arms up, a hop up into the air), a twirl of the wand, then a
    // fit of happy kicking, swinging her feet in turn.
    const cheer = hold(lu, 0.6, 0.85, 1.6, 2.1);
    const twirl = hold(lu, 3.4, 3.9, 5.4, 6);
    a.bfKick = hold(lu, 7, 7.3, 9.4, 9.9);
    a.bfT = t;
    // The hover bounces: it springs off the bottom of each bob like a ball, never a slow sine.
    const bob = Math.pow(Math.abs(Math.sin(t * 2.1)), 0.7);
    const idle = {
      x: 0,
      lift: 1.6 + bob * 2.4 + cheer * 2.4,
      tilt: Math.sin(t * 1.1) * 2 + twirl * Math.sin(t * 4.2) * 4,
      head: Math.sin(t * 0.8) * 3 - twirl * 4 - cheer * 6 + a.bfKick * Math.sin(t * 4.5) * 5,
      armN: Math.sin(t * 2.4) * 8 - twirl * (16 + Math.sin(t * 8.4) * 18) - cheer * 30,
      armF: Math.sin(t * 1.3) * 6 + cheer * 100 + a.bfKick * 8,
    };
    const walk = { ...idle, tilt: idle.tilt + 7, head: idle.head - 4, armF: idle.armF + 10 };
    // The wand drawn back over her head; then the swish forward and the burst of seeds.
    const antic = { x: -2, lift: 3.4, tilt: -11, head: -8, armN: -24, armF: 12 };
    const strike = { x: 3, lift: 2, tilt: 10, head: 6, armN: 34, armF: -10 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  fx(ctx, m, a, S, matOf) {
    // Twinkles shed from the wand, seeds drifting off the puff now and then, and the burst of
    // seeds blown off it on the swish.
    const [wx, wy] = through(matOf('puff'), BF, 'puff', 'stem');
    const base = a.alpha ?? 1;
    const tt = a.bfT ?? a.t;
    for (let i = 0; i < 3; i++) {
      const P = 3.1 + i * 0.6;
      const k = (tt + i * 1.37) / P;
      const n = Math.floor(k);
      const f = k - n;
      const ang = -2.4 + hash(n * 5 + i) * 1.8;
      const x = wx + Math.cos(ang) * 3.6 + f * (2 + hash(n * 11 + i) * 5) + Math.sin(f * 7 + i) * 1.4;
      const y = wy + Math.sin(ang) * 3.6 - f * 13;
      ctx.globalAlpha = base * Math.sin(Math.PI * Math.min(1, f * 1.4)) * 0.95;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 0.75, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#b8c2d0';
      ctx.fillRect(x - 0.15, y + 0.6, 0.3, 1.3);
    }
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
  // Every layer, back to front. The soft ones swing on their own (rig.js, Soft layers).
  parts: twoPass([
    BFK.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel(BF, 'hip')[0] + S.x, rel(BF, 'hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    // Wings: slow butterfly beats, the far pair a touch behind the near, and each wing also
    // lagging the body's bobs a little.
    ...[['wingFU', -16, 0.25], ['wingFL', 9, 0.4], ['wingNU', -18, 0], ['wingNL', 10, 0.15]].map(([name, amp, lag]) =>
      BFK.layer(name, {
        parent: 'torso',
        pivot: 'wing',
        from: 'hip',
        rot: (S, a) => (amp * (0.5 + 0.5 * Math.sin((a.t + (a.m?.uid ?? 0) * 0.37) * TAU * 1.5 - lag * TAU)) - amp * 0.3) * D2R,
        soft: { k: 120, c: 8, gain: 0.45, turn: 0.5, max: 10 },
      }),
    ),
    // The pigtails hang from the head, each from its own root under its bun.
    ...['tailL', 'tailR'].map((k, i) => BFK.layer(k, { parent: 'head', from: 'neck', pivot: k, soft: { ...SOFT.HAIR, k: 60 + i * 8, flutter: 4, hz: 0.5 + i * 0.12 } })),
    BFK.layer('hairBack', { parent: 'head', from: 'neck', pivot: 'crown', soft: { ...SOFT.HAIR, max: 5, flutter: 1 } }),
    BFK.layer('farArm', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.armF * D2R }),
    // Dangling legs: heavy pendulums from inside the skirt; in her happy fit they kick in turn.
    ...[['legF', 'hipF', 0], ['legN', 'hipN', Math.PI]].map(([k, j, ph]) =>
      BFK.layer(k, {
        parent: 'torso',
        pivot: j,
        from: 'hip',
        rot: (S, a) => (a.bfKick ?? 0) * (1 - a.walkW) * Math.sin((a.bfT ?? a.t) * 9 + ph) * 26 * D2R,
        soft: { ...SOFT.LIMB, flutter: 5, hz: 0.75 + (ph ? 0.1 : 0) },
      }),
    ),
    // The bellflower skirt swings from her waist; each of its petals flutters on its own.
    BFK.layer('skirt', { parent: 'torso', pivot: 'waist', from: 'hip', soft: SOFT.CLOTH }),
    ...[0, 1, 2, 3, 4].map((k) => BFK.layer(`petal${k}`, { parent: 'skirt', pivot: `petal${k}`, from: 'waist', soft: { ...SOFT.PETAL, k: 110 + k * 9, hz: 0.7 + k * 0.08 } })),
    BFK.layer('body', { parent: 'torso', pivot: 'hip' }),
    // The ring of leaves at her waist rustles, and the rosebud sits over them.
    ...[0, 1, 2, 3, 4].map((k) => BFK.layer(`leaf${k}`, { parent: 'torso', pivot: `leaf${k}`, from: 'hip', soft: { ...SOFT.PETAL, gain: 0.22, k: 170 + k * 11, max: 18, flutter: 2, hz: 0.9 + k * 0.07 } })),
    BFK.layer('rose', { parent: 'torso', pivot: 'hip', from: 'hip' }),
    BFK.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R, face: true }),
    BFK.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE, face: true }),
    BFK.layer('nearArm', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.armN * D2R }),
    // The dandelion puff nods on the end of its stem.
    // (Stiffer than a lily pad: at a softer spring it rocked in time with her hover and built up.)
    BFK.layer('puff', { parent: 'nearArm', pivot: 'stem', soft: { ...SOFT.PROP, k: 150, c: 8 } }),
  ]),
});

// ---------- Stills (portraits, the book) ----------

export const puddleKidStill = KITS.puddle.still;
export const blossomFairyStill = KITS.fairy.still;
// (The rigs read the monster through `a.m`.)
for (const rig of [puddleKidRig, blossomFairyRig]) {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => draw(ctx, m, Object.assign(a, { m }));
}
