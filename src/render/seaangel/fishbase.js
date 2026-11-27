// The Sea Angel's body (2026-11-26): a copy of the fish base (render/mobs/blankfish.js), its seahorse
// only (the upright swimmer), kept here so the base itself stays clean (the player: "never edit the
// bases just copy the base and edit that"). What this copy adds: a dress, `look`, for a monster on it
// (dressedFish(look)):
//   look.P         its own shape over the seahorse's (spine, head, pec, swim, speed, lean, turn, hover:
//                  px more it floats over the floor); head.snoutLen 0 leaves the snout off (a round head)
//   look.C         its own colours over the base's (lt, base, sh, deep); look.CW its pectorals', over C
//   look.ink       its own soft outline (never near-black)
//   look.paint     (ctx, a, sk, K) its own markings on the body, clipped to it
//   look.headPaint (ctx, a, sk, K) its own markings on the head, clipped to it, in the head's frame
//   look.face      (ctx, a, sk, K) its own face (the base's guide lines go); K.headFrame puts the canvas
//                  in the head's frame (x forward, y down, 0 at the head's middle)
//   look.over / look.under  { part: (ctx, a, mode, K) } over / under a part, in both passes (mode
//                  'line': its outline, 'fill': itself); parts pecF, body, pecN, head
//   look.pecPts    (f, a, far) its own outline points for a pectoral (f: root, ang, len, w, lag)
//   look.pecPaint  (ctx, a, f, far, K) its own markings on a pectoral, clipped to it
//   look.pecGoal   (side, { S, a, st, swim, far }) its own angle for a pectoral (degrees from the way
//                  the body points at its root, toward the head; + toward the belly), in place of the
//                  base's scull and paddle
//   look.moves     its own moves over the base's; look.pick (m, a, st) which one an attack plays;
//                  look.pleased the move played after landing a hit (else the base's wiggle)
//   look.pose      (m, a, out, K, mv, mt) its own act on the channels (d1..d8 are the dress's own;
//                  out.x and out.rise in body heights, the rest as the base's)
//   look.spot      (sk, what) its own place for an effect
//   look.fx        (ctx, m, a, K) live extras over everything (in the rig's frame, as it's shown)
//   look.quietIdle no base glances, tail flicks or playful flips: the dress has its own act
//   look.tailSway  { k, c, gain } the tail's own spring, swung on by the body's starts and stops
//   look.box       [w, h] its rig's box
// Also changed from the base: the near pectoral is drawn before the head (a fin never covers the
// face); the fins' swing eases to a soft stop instead of hitting a wall; the snout, the dorsal, the
// tail fin, the base's guides and the base's own effects are left out (the dress draws its own).
//
// (base) The fish base (2026-11-25): blank chibi swimmers that float through the air, made for a fish
// (base) from the start, nothing carried over from another base; only the engine is shared (rig.js's
// (base) springs). Drawn live like the other blank bases: one smooth shape over its bones, outlined
// (base) only on its outer edge (an outline pass, then a fill pass), in a soft ink, never near-black.
// (base)   spine   a chain of joints from the head to the tip of its tail, each with its own girth over
// (base)           the back and under the belly; the body is one smooth outline over them. It turns
// (base)           about its middle (`pitch`), curls toward the back or the belly (`bend`), nods its head
// (base)           end (`head`); the tail curls up tighter or lets go (`curl`)
// (base)   swim    a travelling wave runs down the spine from the middle to the tail, its phase run on by
// (base)           the distance swum (never the clock), so it never looks as if it slides; at rest a
// (base)           slow scull. The seahorse swims upright, leaning in
// (base)   fins    pectorals (near over the body, far behind it), each rooted inside the body and carried
// (base)           on its own damped spring, so the body's starts, stops and turns swing them on,
// (base)           overshooting and settling. Fins spread out (`fins` +), or tuck back flat (`fins` −)
// (base)   turning it mirrors round as the other bases do, but staying level and never on the spot: a
// (base)           quick swish of the tail first, the flip, then a little overshoot wiggle the new way
// (base) Moves: jump, dash, dodge, ram, hurt, knockdown, a happy wiggle; poses (m.pose): rest, curl,
// (base) sleep (sinking slowly, settled; a nap in the game is the same).

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2' };
const INK = '#7f6982'; // (the bases' shared soft ink)

const ease = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const minus = (p, q) => [p[0] - q[0], p[1] - q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const between = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const dirOf = (an) => [Math.cos(an), Math.sin(an)];
const turned = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const unit = ([x, y]) => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};
const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const frac = (v) => v - Math.floor(v);
const rgbOf = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// A closed smooth curve through every point.
function loopPath(ctx, pts) {
  const k = pts.length;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < k; i++) {
    const a0 = pts[(i + k - 1) % k];
    const a1 = pts[i];
    const a2 = pts[(i + 1) % k];
    const a3 = pts[(i + 2) % k];
    ctx.bezierCurveTo(a1[0] + (a2[0] - a0[0]) / 6, a1[1] + (a2[1] - a0[1]) / 6, a2[0] - (a3[0] - a1[0]) / 6, a2[1] - (a3[1] - a1[1]) / 6, a2[0], a2[1]);
  }
  ctx.closePath();
}
// The same through an open run of points.
function linePath(ctx, pts) {
  const k = pts.length;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < k - 1; i++) {
    const a0 = pts[Math.max(0, i - 1)];
    const a1 = pts[i];
    const a2 = pts[i + 1];
    const a3 = pts[Math.min(k - 1, i + 2)];
    ctx.bezierCurveTo(a1[0] + (a2[0] - a0[0]) / 6, a1[1] + (a2[1] - a0[1]) / 6, a2[0] - (a3[0] - a1[0]) / 6, a2[1] - (a3[1] - a1[1]) / 6, a2[0], a2[1]);
  }
}

// ---------- The seahorse (units: game px at scale 1; x forward, y down; about the middle) ----------
// spine: joints from the head to its tail's tip: [x, y, girth over the back, girth under the belly];
//   `pivot` the joint it turns about; `tailFrom` the joint the tail's curl starts at.
// head: at [x, y] from the first joint, rx, ry, snout (degrees), snoutLen (0: none), w0, w1, crown,
//   bump (px).
// pec: the pectoral fins: [along, off] root, length, width, rest angle, scull, tucked and spread angles.
// swim: amp (degrees each joint bends at the tail), lag (radians between joints), beats (a second at
//   its speed), idle (beats a second at rest), scull, paddle, recoil, bob.
// turn: [seconds of the swish before the flip, seconds of the wiggle after, degrees of swish].
const SEAHORSE = {
  name: 'Seahorse',
  scale: 1,
  upright: true,
  spine: [[1.4, -12.6, 3.3, 3.3], [-0.6, -8.8, 2.8, 3], [-0.6, -4.4, 3.1, 4.6], [0, 0.2, 3.3, 6], [-0.6, 4.6, 3, 5], [-1.8, 8.4, 2.5, 3.1], [-2.6, 11.8, 2.05, 2.25], [-2.3, 14.8, 1.7, 1.8], [-0.8, 17.1, 1.4, 1.45], [1.5, 17.8, 1.15, 1.2], [3.2, 16.6, 0.95, 1], [3.4, 14.8, 0.8, 0.8], [2.3, 13.9, 0.62, 0.62]],
  pivot: 3,
  tailFrom: 5,
  head: { at: [1.4, -2.4], rx: 4.9, ry: 3.9, snout: 16, snoutLen: 5.6, w0: 2.9, w1: 2.4, crown: -108, bump: 1.3 },
  pec: { at: [6.2, -0.6], len: 3.6, w: 2.5, ang: -142, scull: 16, tuck: -165, out: -100 },
  swim: { amp: 6, lag: 0.7, beats: 1.1, idle: 0.35, scull: 1.6, paddle: 26, recoil: 4.5, bob: 0.7 },
  speed: 16,
  lean: 9,
  hover: 0,
  moveTilt: 0.45,
  turn: [0.12, 0.38, 30],
  moves: ['ram'],
};

// ---------- The moves (units: x, rise in body heights; angles in degrees) ----------
// pitch: + nose down; bend: + the tail curling up over the back; head: + nodding down; fins: +
// spread out, − tucked back; thrash: beating the tail hard; curl: the tail tighter (+) or let go (−);
// tumble: whole turns over (− backward), not on a spring.
export const FISH_MOVES = {
  ram: {
    anticT: 0.26,
    keys: [
      [0, { x: -0.13, pitch: -6, head: -8, fins: 0.8, thrash: 0.5, curl: 0.3 }],
      [0.1, { x: 0.38, pitch: 6, head: 8, fins: -1, thrash: 1, curl: -0.4 }, 'out'],
      [0.17, { x: 0.3, pitch: -10, head: -12, fins: 0.6, thrash: 0.3, curl: 0.2 }, 'out'],
      [0.34, { x: 0.25, pitch: -2, head: 0, fins: 0.2, thrash: 0, curl: 0 }, 'io'],
      [0.72, {}],
    ],
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { rise: -0.08, pitch: 12, bend: -20, fins: -0.2 }],
      [0.16, { rise: 0.7, pitch: -38, bend: 26, fins: -0.8, thrash: 0.7, curl: -0.3 }, 'out'],
      [0.36, { rise: 0.86, pitch: 0, bend: 0, fins: -0.6, thrash: 0.2, curl: 0 }, 'io'],
      [0.56, { rise: 0.16, pitch: 30, bend: -14, fins: 0.1, curl: 0.3 }, 'in'],
      [0.66, { rise: -0.06, pitch: 6, bend: 12, fins: 0.8 }, 'out'],
      [0.94, {}, 'io'],
    ],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { x: -0.03, fins: 0.5, bend: -8 }],
      [0.08, { x: 0.24, pitch: 4, fins: -1, thrash: 1, curl: -0.3 }, 'out'],
      [0.3, { x: 0.28, pitch: 2, fins: -0.8, thrash: 0.7 }],
      [0.46, { x: 0.26, pitch: -6, fins: 0.8, thrash: 0, bend: 14, curl: 0.2 }, 'io'],
      [0.82, {}],
    ],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { fins: 0.4 }],
      [0.12, { x: -0.28, rise: 0.22, pitch: -22, bend: -30, fins: 1, thrash: 0.6, curl: 0.5 }, 'out'],
      [0.32, { x: -0.3, rise: 0.08, pitch: -4, bend: 6, fins: 0.5, thrash: 0 }, 'in'],
      [0.5, { x: -0.28, rise: 0, pitch: 2, bend: 0, fins: 0.2, curl: 0 }, 'io'],
      [0.84, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.06, pitch: -16, head: -10, bend: 30, fins: 1, curl: 0.4 }, 'out'],
      [0.2, { x: -0.06, pitch: -9, bend: 12, fins: 0.6 }],
      [0.4, { x: -0.03, pitch: -2, bend: 0, fins: 0.2, curl: 0 }, 'io'],
      [0.76, {}],
    ],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.08, { x: -0.06, pitch: -10, bend: 30, fins: 1 }, 'out'],
      [0.52, { x: -0.16, rise: -0.12, pitch: 14, bend: -16, fins: -0.7, curl: -0.5, tumble: -1 }, 'io'],
      [0.62, { rise: -0.09, pitch: 11, tumble: -1 }, 'out'],
      [1.1, { x: -0.16, rise: -0.14, pitch: 16, bend: -18, fins: -0.7, curl: -0.5, tumble: -1 }, 'io'],
      [1.38, { x: -0.08, rise: 0.02, pitch: -6, bend: 10, fins: 0.8, thrash: 0.6, tumble: -1 }, 'io'],
      [1.7, { tumble: -1 }, 'io'],
    ],
  },
  wiggle: {
    anticT: 0.1,
    keys: [
      [0, { rise: -0.03, fins: 0.4 }],
      [0.14, { rise: 0.16, pitch: -12, fins: 1, thrash: 1, curl: -0.3 }, 'out'],
      [0.6, { rise: 0.12, pitch: -9, fins: 0.9, thrash: 1, curl: -0.2 }],
      [0.76, { rise: 0, pitch: 2, fins: 0.2, thrash: 0, curl: 0 }, 'in'],
      [1.05, {}],
    ],
  },
};
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASES = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: ease };
// A move's pose at t (before 0: easing from the rest pose into its first key by `antic`).
function poseIn(mv, t, antic, rest) {
  const keys = mv.keys.map(([kt, pose, how]) => [kt, { ...rest, ...pose }, how]);
  const out = {};
  if (t < 0) {
    for (const k of Object.keys(rest)) out[k] = mix(rest[k], keys[0][1][k], ease(antic));
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, how] = keys[i + 1];
  const u = (EASES[how] ?? ease)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  for (const k of Object.keys(p0)) out[k] = mix(p0[k], p1[k], u);
  return out;
}

const DRESS_CH = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];
const CH = ['x', 'rise', 'lift', 'sink', 'pitch', 'head', 'bend', 'curl', 'fins', 'thrash', ...DRESS_CH];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
const merge = (P0, LP) => {
  const P = { ...P0 };
  for (const [k, v] of Object.entries(LP ?? {})) P[k] = v && typeof v === 'object' && !Array.isArray(v) && P[k] && typeof P[k] === 'object' && !Array.isArray(P[k]) ? { ...P[k], ...v } : v;
  return P;
};

// ---------- One rig for a dress ----------
function fishRig(look = {}) {
  const DRESS = look;
  const P = merge(SEAHORSE, look.P);
  const C = { ...C0, ...(look.C ?? {}) };
  const CW = { ...C, ...(look.CW ?? {}) };
  const INKD = look.ink ?? INK;
  const s = P.scale;
  const sc = (v) => v * s;
  const REST = P.spine.map(([x, y]) => [sc(x), sc(y)]);
  const n = REST.length;
  const pv = P.pivot;
  const LEN = [];
  const ANG = [];
  for (let i = 0; i < n - 1; i++) {
    LEN.push(Math.hypot(REST[i + 1][0] - REST[i][0], REST[i + 1][1] - REST[i][1]));
    ANG.push(Math.atan2(REST[i + 1][1] - REST[i][1], REST[i + 1][0] - REST[i][0]));
  }
  const REL = [0];
  for (let j = 1; j < n - 1; j++) REL.push(wrapPi(ANG[j] - ANG[j - 1]));
  const SJ = [0];
  for (let i = 0; i < n - 1; i++) SJ.push(SJ[i] + LEN[i]);
  const BACK = P.spine.map((r) => sc(r[2]));
  const BELLY = P.spine.map((r) => sc(r[3]));
  const tailFrom = P.tailFrom ?? pv + 1;
  const WAVEW = REST.map((_, j) => (j > pv ? ((j - pv) / (n - 1 - pv)) ** 1.2 : 0));
  // (a bend down the long tail more evenly, so it swings from the belly as a whole)
  const BENDW = REST.map((_, j) => (j > pv ? ((j - pv) / (n - 1 - pv)) ** 0.35 : 0));
  const BSUM = BENDW.reduce((x, y) => x + y, 0) + 1;
  // Its size at rest: how high its middle floats so the lowest of it clears the floor, its height.
  const restN = REST.map((_, j) => {
    const d0 = dirOf(ANG[Math.max(0, j - 1)]);
    const d1 = dirOf(ANG[Math.min(n - 2, j)]);
    const d = unit(plus(d0, d1));
    return [-d[1], d[0]];
  });
  let top = Infinity;
  let bottom = -Infinity;
  let fore = -Infinity;
  let aft = Infinity;
  REST.forEach((q, j) => {
    for (const r of [BACK[j], -BELLY[j]]) {
      const e = plus(q, times(restN[j], r));
      top = Math.min(top, e[1]);
      bottom = Math.max(bottom, e[1]);
      fore = Math.max(fore, e[0]);
      aft = Math.min(aft, e[0]);
    }
  });
  const HD = P.head;
  top = Math.min(top, REST[0][1] + sc(HD.at[1] - HD.ry - HD.bump));
  fore = Math.max(fore, REST[0][0] + sc(HD.at[0] + HD.rx + HD.snoutLen * 0.9));
  const FLOAT = bottom - REST[pv][1] + sc(2.4) + sc(P.hover ?? 0);
  const H = FLOAT + (REST[pv][1] - top);
  const bodyLen = fore - aft;
  const CYC = P.speed / P.swim.beats;

  // (a damped spring swung on by the body's moves, easing into a soft stop near `max` instead of
  // hitting a wall; sub-stepped, so any frame rate swings it the same)
  function swingOf(FS, key, u, k, c, gain, lag, acc, dt, max = 0.7) {
    const f = (FS[key] ??= { o: 0, w: 0 });
    if (!(dt > 0)) return f.o;
    const [ax, ay, al] = acc;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    const push = gain * (u[1] * ax - u[0] * ay) - lag * al;
    const z = max * 0.6;
    for (let i = 0; i < steps; i++) {
      let a = -k * f.o - c * f.w + push;
      const over = Math.abs(f.o) - z;
      if (over > 0) a -= Math.sign(f.o) * k * 5 * over + c * 6 * Math.min(1, over / (max - z)) * f.w;
      f.w += a * h;
      f.o += f.w * h;
    }
    if (!Number.isFinite(f.o) || Math.abs(f.o) > max * 3) Object.assign(f, { o: 0, w: 0 });
    return f.o;
  }

  // ---------- The skeleton: the posed spine, its outline, the fins ----------
  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const TB = st.fsTB ?? 0;
    const swim = ease(st.fsSwim ?? 0);
    const ph = st.fsPh ?? 0;
    const thr = clamp(S.thrash, 0, 1.5);
    const amp = (P.swim.amp * mix(0.35, 1, swim) + P.swim.amp * 0.9 * thr) * (st.fsCalm ?? 1) * D2R;
    const tumble = (a.fsTumble ?? 0) * TAU;
    const recoil = -P.swim.recoil * D2R * Math.sin(ph + 0.6) * mix(0.35, 1, swim);
    const swimBob = Math.sin(ph * 2 - 0.4) * sc(P.swim.bob) * swim;
    const px = REST[pv][0] + S.x;
    const py = REST[pv][1] - FLOAT - S.rise - S.lift - swimBob + S.sink;
    const angP = ANG[pv] + (S.pitch + (st.fsTP ?? 0)) * D2R + tumble + recoil;
    // ---------- The body's push (its acceleration, worked out in the world, turned into the rig's
    // way round): it swings the fins and the tail on ----------
    const flipS = st.fsShown ? -1 : 1;
    const wx = (m.x ?? 0) + flipS * px;
    const wy = (m.y ?? 0) + py;
    let acc = [0, 0, 0];
    const steady = dt > 0 && st.fsW !== undefined && Math.hypot(wx - st.fsW[0], wy - st.fsW[1]) < 30;
    if (steady) {
      const vx = (wx - st.fsW[0]) / dt;
      const vy = (wy - st.fsW[1]) / dt;
      const om = wrapPi(angP - st.fsA) / dt;
      if (st.fsVel) {
        const f = Math.min(1, dt * 20);
        st.fsAcc = [mix(st.fsAcc[0], clamp((vx - st.fsVel[0]) / dt, -1800, 1800), f), mix(st.fsAcc[1], clamp((vy - st.fsVel[1]) / dt, -1800, 1800), f), mix(st.fsAcc[2], clamp((om - st.fsVel[2]) / dt, -300, 300), f)];
        acc = [st.fsAcc[0] * flipS, st.fsAcc[1], st.fsAcc[2]];
      }
      st.fsVel = [vx, vy, om];
    } else {
      st.fsVel = null;
      st.fsAcc = [0, 0, 0];
    }
    st.fsW = [wx, wy];
    st.fsA = angP;
    const FS = (st.fsFin ??= {});
    // (the tail's own sway: left behind as the body speeds up, swinging on past it as it stops)
    const TS = DRESS.tailSway;
    const tailSw = TS ? swingOf(FS, 'tailSway', [0, 1], TS.k ?? 70, TS.c ?? 8, TS.gain ?? 0.02, TS.lag ?? 0.4, acc, dt, 0.6) : 0;
    const curl = clamp(S.curl, -1, 1.5);
    const curlK = curl >= 0 ? 1 + curl * 0.45 : 1 + curl;
    const relAt = (j) => {
      if (j > pv) {
        const restBend = REL[j] * (j >= tailFrom ? curlK : 1);
        return restBend + ((S.bend + TB) * D2R * BENDW[j]) / BSUM + (tailSw * 1.6 * BENDW[j]) / BSUM + amp * WAVEW[j] * Math.sin(ph - P.swim.lag * (j - pv));
      }
      return REL[j] - (S.head * D2R) / Math.max(1, pv);
    };
    const ang = new Array(n - 1);
    ang[pv] = angP;
    for (let j = pv + 1; j < n - 1; j++) ang[j] = ang[j - 1] + relAt(j);
    for (let i = pv - 1; i >= 0; i--) ang[i] = ang[i + 1] - relAt(i + 1);
    const pos = new Array(n);
    pos[pv] = [px, py];
    for (let j = pv; j < n - 1; j++) pos[j + 1] = plus(pos[j], times(dirOf(ang[j]), LEN[j]));
    for (let i = pv - 1; i >= 0; i--) pos[i] = minus(pos[i + 1], times(dirOf(ang[i]), LEN[i]));
    const dirs = ang.map(dirOf);
    const nrm = pos.map((_, j) => {
      const d = unit(plus(dirs[Math.max(0, j - 1)], dirs[Math.min(n - 2, j)]));
      return [-d[1], d[0]];
    });
    const back = BACK;
    const belly = BELLY;
    const sk = { pos, dirs, nrm, back, belly, ang, swim, ph, S, SJ, acc };
    sk.along = (sPos, off) => {
      if (sPos <= 0) return plus(plus(pos[0], times(dirs[0], sPos)), times(nrm[0], off));
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      const u = Math.min(1.4, (sPos - SJ[i]) / LEN[i]);
      const q = between(pos[i], pos[i + 1], u);
      const nn = unit(between(nrm[i], nrm[i + 1], Math.min(1, u)));
      return plus(q, times(nn, off));
    };
    sk.girth = (sPos, side) => {
      const R = side > 0 ? back : belly;
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      return mix(R[i], R[i + 1], clamp((sPos - SJ[i]) / LEN[i], 0, 1));
    };
    sk.fwdAt = (sPos) => {
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      return times(dirs[i], -1);
    };
    sk.angAt = (sPos) => {
      let i = 0;
      while (i < n - 2 && sPos > SJ[i + 1]) i++;
      return ang[i];
    };
    // The outline: down the back to the tail's tip, round it, back up the belly, round the top (the
    // head covers it).
    const outl = [];
    for (let j = 0; j < n; j++) outl.push(plus(pos[j], times(nrm[j], back[j])));
    const dl = dirs[n - 2];
    outl.push(plus(pos[n - 1], times(dl, Math.min(back[n - 1], belly[n - 1]) * 0.9)));
    for (let j = n - 1; j >= 0; j--) outl.push(plus(pos[j], times(nrm[j], -belly[j])));
    const f0 = times(dirs[0], -1);
    for (let deg = -72; deg <= 72; deg += 18) {
      const r = deg * D2R;
      outl.push(plus(plus(pos[0], times(f0, sc(1.6) * Math.cos(r))), times(nrm[0], Math.sin(r) * (r > 0 ? back[0] : belly[0]))));
    }
    sk.outline = outl;

    // ---------- The fins: each on its own damped spring ----------
    const fins = clamp(S.fins, -1, 1.2);
    const pecs = {};
    if (P.pec) {
      const F = P.pec;
      const fp = st.fsFp ?? 0;
      for (const side of ['near', 'far']) {
        const far = side === 'far';
        let goal;
        if (DRESS.pecGoal) goal = DRESS.pecGoal(side, { S, a, st, swim, far });
        else {
          const stroke = Math.sin(fp + (far ? 2.1 : 0)) * F.scull * (1 - swim) * (st.fsCalm ?? 1) + Math.sin(ph - 1.2 + (far ? 1.4 : 0)) * P.swim.paddle * swim + Math.sin(ph * 2) * 10 * thr;
          goal = mix(F.ang, F.tuck, swim * 0.4) + stroke;
          goal = fins > 0 ? mix(goal, F.out, fins * 0.75) : mix(goal, F.tuck, -fins);
          goal += far ? -9 : 0;
        }
        goal += (st.fsTF ?? 0) * 30;
        const root = sk.along(sc(F.at[0] - (far ? 0.7 : 0)), sc(F.at[1] + (far ? 1.1 : 0)));
        const fwd = sk.fwdAt(sc(F.at[0]));
        let an = Math.atan2(fwd[1], fwd[0]) + goal * D2R;
        const lagA = swingOf(FS, `pec${side}`, dirOf(an), 150, 11, 0.03, 0.5, acc, dt);
        an += lagA;
        pecs[side] = { root, ang: an, len: sc(F.len) * (far ? (F.farLen ?? 1) : 1), w: sc(F.w) * (far ? (F.farLen ?? 1) : 1), lag: lagA, far };
      }
    }
    sk.pecs = pecs;
    // The head: a round skull (and the seahorse's tube snout, unless it has none); it nods.
    {
      const Hd = HD;
      const hA = wrapPi(ang[0] - ANG[0]) + S.head * D2R;
      const centre = plus(pos[0], turned([sc(Hd.at[0]), sc(Hd.at[1])], hA));
      const sn = hA + Hd.snout * D2R;
      const cr = hA + Hd.crown * D2R;
      const rx = sc(Hd.rx);
      const ry = sc(Hd.ry);
      const onSkull = (al2, grow = 0) => plus(centre, turned([Math.cos(al2 - hA) * (rx + grow), Math.sin(al2 - hA) * (ry + grow)], hA));
      // (round the skull, flowing down into the neck in front (the throat) and behind (the nape), so
      // the head and the neck are one shape with no crease)
      const pts = [];
      const snout = Hd.snoutLen > 0;
      const gap = snout ? 0.62 : 0;
      const K = snout ? 15 : 18;
      const under = hA + Math.PI / 2;
      const throat = plus(pos[1], times(nrm[1], -belly[1] * 0.92));
      const nape = plus(pos[1], times(nrm[1], back[1] * 0.92));
      const neckW = Hd.neckGap ?? 1.05;
      let neckIn = false;
      for (let i = 0; i < K; i++) {
        const al2 = sn + gap + ((TAU - 2 * gap) * i) / (snout ? K - 1 : K);
        if (Math.abs(wrapPi(al2 - under)) < neckW) {
          if (!neckIn) pts.push(throat, nape);
          neckIn = true;
          continue;
        }
        const bump = sc(Hd.bump) * Math.exp(-((wrapPi(al2 - cr) / 0.42) ** 2));
        pts.push(onSkull(al2, bump));
      }
      if (!neckIn) pts.unshift(throat, nape);
      const sd = dirOf(sn);
      const sv = [sd[1], -sd[0]];
      let tip = plus(centre, times(sd, rx));
      if (snout) {
        const r0 = plus(centre, times(sd, Math.min(rx, ry) * 0.72));
        tip = plus(r0, times(sd, sc(Hd.snoutLen)));
        const w0 = sc(Hd.w0) / 2;
        const w1 = sc(Hd.w1) / 2;
        pts.push(plus(between(r0, tip, 0.1), times(sv, w0 * 1.05)), plus(between(r0, tip, 0.6), times(sv, w1 * 0.92)), plus(tip, times(sv, w1)), plus(tip, times(sd, w1 * 0.85)), plus(tip, times(sv, -w1)), plus(between(r0, tip, 0.6), times(sv, -w1 * 0.95)), plus(between(r0, tip, 0.1), times(sv, -w0 * 1.1)));
      }
      sk.head = { pts, centre, hA, sn, tip, sd, sv, rx, ry };
      sk.mouthPt = tip;
      sk.nosePt = tip;
    }
    sk.tailPt = pos[n - 2];
    sk.tipPt = pos[n - 1];
    sk.pivot = pos[pv];
    sk.fwd = times(dirs[pv], -1);
    return sk;
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return al >= 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const edge = (ctx, w = 2) => {
    ctx.strokeStyle = INKD;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const soft = (ctx, at, r, col, al) => {
    if (al <= 0.003 || r <= 0.01) return;
    const [cr, cg, cb] = rgbOf(col);
    const g = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(at[0] - r, at[1] - r, r * 2, r * 2);
  };
  const bodyPath = (ctx, sk) => {
    ctx.beginPath();
    loopPath(ctx, sk.outline);
  };
  const headPath = (ctx, sk) => {
    ctx.beginPath();
    loopPath(ctx, sk.head.pts);
  };
  const headFrame = (ctx, a) => {
    const Hh = a.fk.head;
    ctx.translate(...Hh.centre);
    ctx.rotate(Hh.hA);
  };
  // The body: one smooth shape; lit along the back, softly shaded low.
  function drawBody(ctx, a, mode) {
    const sk = a.fk;
    bodyPath(ctx, sk);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip();
    const big = Math.max(...BACK);
    soft(ctx, sk.along(SJ[2], -sk.belly[2] * 0.25), big * 1.8, C.lt, 0.9);
    soft(ctx, sk.along(SJ[pv + 1], sk.back[pv + 1] * 0.5), big * 1.3, C.lt, 0.5);
    soft(ctx, sk.along(SJ[n - 3], 0), big * 1.6, C.sh, 0.45);
    if (DRESS.paint) {
      ctx.save();
      DRESS.paint(ctx, a, sk, KIT);
      ctx.restore();
    }
    ctx.restore();
  }
  function drawHead(ctx, a, mode) {
    const sk = a.fk;
    const Hh = sk.head;
    headPath(ctx, sk);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    headPath(ctx, sk);
    ctx.clip();
    soft(ctx, plus(Hh.centre, turned([-Hh.rx * 0.1, -Hh.ry * 0.5], Hh.hA)), Hh.rx * 1.05, C.lt, 0.95);
    soft(ctx, plus(Hh.centre, turned([-Hh.rx * 0.5, Hh.ry * 0.7], Hh.hA)), Hh.ry * 0.9, C.sh, 0.4);
    if (DRESS.headPaint) {
      ctx.save();
      headFrame(ctx, a);
      DRESS.headPaint(ctx, a, sk, KIT);
      ctx.restore();
    }
    ctx.restore();
    if (DRESS.face) {
      ctx.save();
      headFrame(ctx, a);
      DRESS.face(ctx, a, sk, KIT);
      ctx.restore();
    }
  }
  // A pectoral fin: a rounded paddle from its root inside the body (or the dress's own shape).
  const leafPts = (f) => {
    const u = dirOf(f.ang);
    const v = [-u[1], u[0]];
    const at = (x, y) => plus(f.root, plus(times(u, x * f.len), times(v, y * f.w)));
    return [at(-0.3, 0), at(0.02, -0.44), at(0.5, -0.5), at(0.88, -0.32), at(1, 0.02), at(0.86, 0.36), at(0.48, 0.5), at(0.02, 0.42)];
  };
  function drawPec(ctx, a, mode, side) {
    const sk = a.fk;
    const f = sk.pecs[side];
    if (!f) return;
    const far = side === 'far';
    const pts = DRESS.pecPts ? DRESS.pecPts(f, a, far) : leafPts(f);
    ctx.beginPath();
    loopPath(ctx, pts);
    if (mode === 'line') return edge(ctx);
    if (!far) {
      // (lying over the body: a soft deeper edge where it does, fading out at its root)
      ctx.save();
      bodyPath(ctx, sk);
      loopPath(ctx, sk.head.pts);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      const hole = plus(f.root, times(dirOf(f.ang), f.len * 0.12));
      ctx.moveTo(hole[0] + f.len * 0.42, hole[1]);
      ctx.arc(hole[0], hole[1], f.len * 0.42, 0, TAU);
      ctx.clip('evenodd');
      ctx.beginPath();
      loopPath(ctx, pts);
      ctx.strokeStyle = tone(a, CW.deep);
      ctx.lineWidth = 1.1;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.fillStyle = tone(a, far ? CW.sh : CW.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.clip();
    if (DRESS.pecPaint) DRESS.pecPaint(ctx, a, f, far, KIT);
    else if (!far) soft(ctx, plus(f.root, times(dirOf(f.ang), f.len * 0.3)), f.len * 0.6, CW.lt, 0.75);
    ctx.restore();
  }

  // ---------- The rig ----------
  const table = { ...FISH_MOVES, ...(look.moves ?? {}) };
  const pleased = look.pleased ?? 'wiggle';
  function moveNow(m, a, st) {
    if (m.act && table[m.act.name]) {
      const mv = table[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.fsAtk) {
        const pool = m.def.moves ?? P.moves;
        st.fsN = (st.fsN ?? m.uid ?? 0) + 1;
        st.fsPick = DRESS.pick ? DRESS.pick(m, a, st) : typeof m.move === 'string' && table[m.move] ? m.move : pool[st.fsN % pool.length];
      }
      st.fsAtk = true;
      const mv = table[st.fsPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.fsAtk = false;
    const ago = a.hurtAgo ?? 9;
    if (m.hp > 0 && ago >= 0 && ago < lengthOf(table.hurt)) return [table.hurt, ago, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(table[pleased])) return [table[pleased], gl, 1];
    return [null, 0, 0];
  }
  // Turning round: it mirrors like the other bases, staying level, but not on the spot: the way
  // it's shown lags the way it faces for a moment while its tail swishes, then it flips and a
  // little overshoot wiggle plays the new way and settles.
  const [PRE, POST, SWISH] = P.turn;
  function turning(st, a, m, dt) {
    if (st.fsShown === undefined || m.hp <= 0) {
      st.fsShown = a.flip;
      st.fsTt = null;
      st.fsTB = st.fsTP = st.fsTF = 0;
      return;
    }
    if (!(dt > 0)) return;
    if (st.fsTt == null ? a.flip !== st.fsShown : st.fsTt >= PRE && a.flip !== st.fsShown) st.fsTt = 0;
    let tb = 0;
    let tp = 0;
    let tf = 0;
    if (st.fsTt != null) {
      const t0 = st.fsTt;
      st.fsTt += dt;
      if (t0 < PRE && st.fsTt >= PRE) st.fsShown = a.flip;
      const tt = st.fsTt;
      if (tt < PRE) {
        const h = Math.sin(Math.PI * ease(tt / PRE));
        tb = SWISH * h;
        tp = -6 * h;
        tf = 0.7 * h;
      } else if (tt < PRE + POST) {
        const q = (tt - PRE) / POST;
        const decay = (1 - q) ** 1.4;
        tb = -SWISH * 0.75 * Math.sin(TAU * q) * decay;
        tp = 5 * Math.sin(TAU * q) * decay;
        tf = 0.5 * Math.sin(Math.PI * q) * decay;
      } else st.fsTt = null;
    }
    const f = Math.min(1, dt * 40);
    st.fsTB = mix(st.fsTB ?? 0, tb, f);
    st.fsTP = mix(st.fsTP ?? 0, tp, f);
    st.fsTF = mix(st.fsTF ?? 0, tf, f);
  }
  const mirrored = (a) => a.mo.rig?.fsShown !== undefined && a.mo.rig.fsShown !== a.flip;
  const seq = [
    ['pecF', (ctx, a, mode) => drawPec(ctx, a, mode, 'far')],
    ['body', drawBody],
    ['pecN', (ctx, a, mode) => drawPec(ctx, a, mode, 'near')],
    ['head', drawHead],
  ];
  const paintOf = (name, draw, mode) => (ctx, a) => {
    if (!a.fk) return;
    const back = mirrored(a);
    if (back) {
      ctx.save();
      ctx.scale(-1, 1);
    }
    if (DRESS.under?.[name]) {
      ctx.save();
      DRESS.under[name](ctx, a, mode, KIT);
      ctx.restore();
    }
    draw(ctx, a, mode);
    if (DRESS.over?.[name]) {
      ctx.save();
      DRESS.over[name](ctx, a, mode, KIT);
      ctx.restore();
    }
    if (back) ctx.restore();
  };
  const parts = [];
  for (const mode of ['line', 'fill']) for (const [name, draw] of seq) parts.push({ name: `${name}~${mode}`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: paintOf(name, draw, mode) });
  const BOX_W = look.box?.[0] ?? Math.ceil(bodyLen * 2.6 + sc(30));
  const BOX_H = look.box?.[1] ?? Math.ceil(H * 1.9 + sc(16));
  const KIT = {
    C, CW, P, H, SJ, ink: INKD, tone, edge, soft, loopPath, linePath, bodyPath: (ctx, a) => bodyPath(ctx, a.fk), headPath: (ctx, a) => headPath(ctx, a.fk), headFrame,
    mix, ease, plus, minus, times, turned, dirOf, unit, between, moves: table,
    // (whether it is shown facing left on screen: the flip the game asks for, with the turn's lag)
    left: (a) => Boolean(a.mo.rig?.fsShown ?? a.flip),
  };
  const rig = makeRig({
    w: BOX_W,
    h: BOX_H,
    soft: true,
    stride: CYC,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, { sink: [10, 6.4], lift: [90, 14], bend: [150, 17], curl: [110, 15], fins: [190, 19], thrash: [110, 18], head: [190, 22] }[c] ?? [170, 21]])),
    fast: CH.filter((c) => !['sink', 'lift'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.fsActive),
    kick: look.kick ?? { pitch: -50, bend: 160, fins: 4 },
    turnKick: {},
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
      turning(st, a, m, dt);
      // How fast it's swimming: from the distance it has travelled.
      const odo = m.odo ?? 0;
      const step = Math.min(30, Math.abs(odo - (st.fsOdo ?? odo)));
      st.fsOdo = odo;
      if (dt > 0) st.fsV = (st.fsV ?? 0) + (step / dt - (st.fsV ?? 0)) * Math.min(1, dt * 6);
      const swimGoal = clamp((st.fsV ?? 0) / (P.speed * 0.55), 0, 1);
      st.fsSwim = (st.fsSwim ?? 0) + (swimGoal - (st.fsSwim ?? 0)) * Math.min(1, dt * 4);
      const swim = ease(st.fsSwim);
      const nap = m.hp > 0 && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && a.now < m.habit.until));
      const calm = nap ? 0.3 : m.pose === 'rest' ? 0.55 : 1;
      st.fsCalm = mix(st.fsCalm ?? calm, calm, Math.min(1, dt * 2));
      const mx = st.x?.x ?? 0;
      const moved = Math.min(20, Math.abs(mx - (st.fsMx ?? mx)));
      st.fsMx = mx;
      const thr = clamp(st.thrash?.x ?? 0, 0, 1.5);
      const cm = st.fsCalm;
      st.fsPh = ((st.fsPh ?? (m.uid ?? 0) * 1.3) + TAU * ((step + moved) / CYC + dt * (P.swim.idle * (1 - swim) * cm + thr * P.swim.beats * 1.6))) % (TAU * 1000);
      st.fsFp = ((st.fsFp ?? 0) + TAU * ((step / CYC) * 0.5 + dt * (P.swim.scull * (1 - swim) * cm + thr * 2))) % (TAU * 1000);
      // At rest: breathing, a slow bob, an easy glance up or down, a flick of the tail now and then,
      // and every so often a playful little flip (none of these for a quiet dress).
      const breath = Math.sin(t * (nap ? 1.2 : 2.1));
      const q = DRESS.quietIdle ? 0 : 1;
      const rnd = (k) => frac(Math.sin(k * 12.9898 + ((m.uid ?? 0) % 97) * 78.233) * 43758.5453);
      const per = 3.1;
      const blk = Math.floor(t / per);
      const look0 = (mix(rnd(blk - 1), rnd(blk), ease(((t / per) % 1) / 0.4)) * 2 - 1) * q;
      const flick = hold(t % 6.3, 3, 3.14, 3.3, 3.9) * q;
      const flip = hold(t % 14.3, 9.2, 9.45, 9.65, 10.4) * q;
      const idle = { x: 0, rise: flip * sc(2.2), lift: Math.sin(t * 1.15) * sc(0.8) + breath * sc(0.18), sink: 0, pitch: look0 * 2 - flip * 5, head: look0 * 6 - flip * 10, bend: flick * 6, curl: breath * 0.05 + flick * 0.25 - flip * 0.35, fins: 0.1, thrash: 0 };
      const cruise = { ...idle, rise: 0, lift: 0, pitch: P.lean, head: 0, bend: 0, curl: 0, fins: 0 };
      for (const c of DRESS_CH) idle[c] = cruise[c] = 0;
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = { tumble: 0 };
      for (const c of CH) base[c] = mix(idle[c], cruise[c], swim);
      base.x /= H;
      base.rise /= H;
      const out = mv ? poseIn(mv, mt, anticW, base) : { ...base };
      if (mv && P.moveTilt) out.pitch = base.pitch + (out.pitch - base.pitch) * P.moveTilt;
      a.fsTumble = mv ? out.tumble ?? 0 : 0;
      if (m.pose === 'rest') Object.assign(out, { pitch: 1 + look0, head: look0 * 2, fins: 0.05, bend: 0, lift: Math.sin(t * 0.6) * sc(0.9) });
      else if (m.pose === 'curl') Object.assign(out, { curl: 1.5, head: 22, pitch: 6, bend: -20, fins: -0.2 });
      if (nap) Object.assign(out, { sink: sc(2.4) + H * 0.1, pitch: 4, head: 12, bend: 4, curl: 0.6, fins: -0.35, lift: Math.sin(t * 0.7) * sc(0.25) });
      if (m.cine?.mood === 'sad' && m.hp > 0) Object.assign(out, { pitch: 8, head: 10, fins: -0.6 });
      if (m.hp <= 0) Object.assign(out, { pitch: 16, head: 6, bend: -16, fins: -0.8, thrash: 0, curl: -0.4 });
      st.fsActive = Boolean(mv);
      a.fsMove = mv ? { mv, t: mt } : null;
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = (out.x ?? 0) * H;
      res.rise = (out.rise ?? 0) * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.fk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => {
      if (!a.fk || !DRESS.fx) return;
      if (mirrored(a)) ctx.scale(-1, 1);
      DRESS.fx(ctx, m, a, KIT);
    },
  });
  // (a still for the Monster Book: the body plain)
  const still = () => ({
    w: BOX_W,
    h: BOX_H,
    res: 3,
    shapes: [E(BOX_W / 2, BOX_H - FLOAT, sc(4.6), sc(7), C.base), E(BOX_W / 2 + sc(1.4), BOX_H - FLOAT - sc(14), sc(HD.rx), sc(HD.ry), C.base)],
  });
  return { rig, still, stride: CYC, speed: P.speed, H, KIT };
}

// One dressed seahorse: its art entry (for ARTS), its size and its swimming pace.
export function dressedFish(look) {
  const r = fishRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: Math.round(look.size?.[0] ?? 16), h: Math.round(look.size?.[1] ?? r.H * 1.05), speed: r.speed, bodyH: r.H, KIT: r.KIT };
}
