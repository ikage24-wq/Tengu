// The Moss Owlet's owl (2026-11-25): a copy of the blank bird base (blankbird.js, its owl), kept here
// so the base itself stays clean for future builds (the player: "never edit the bases just copy the
// base and edit that"). What this copy adds: a dress, `look`, for a monster on it:
//   look.C      its own colours over the base's (lt, base, sh, deep, guide, beak, beakSh, leg)
//   look.P      its own shape over the owl's (head, beak, wing, tail, scale ...)
//   look.face   (ctx, a, sk, K) its own eyes and markings, drawn in the head's frame (the base's eye
//               guide line is gone)
//   look.over   { part: (ctx, a, mode, K) } drawn over a part, in both passes (mode 'line': its
//               outline, 'fill': itself), so anything added keeps the outer-outline-only look
//   look.under  the same, under a part
//   look.pose   (m, a, out, K, mv, mt) its own idle act on top of the base's channels
//   look.fx     (ctx, m, a, K) live extras over everything
// K, the kit handed to them: the skeleton is a.bk; C, P, colour, tint, edge, glow, sc, poly,
// headFrame(ctx, a), bodyPath(ctx, a), H; moves (the base's), poseAt, hold.
//
// The base's own notes follow.
// (base) The bird base (2026-11-23, the player: "next base animals"): a blank chibi bird made for a bird
// from the start, nothing carried over from another base; only the engine is shared (rig.js's
// springs, and blankquad.js's leg joints, drawn so a leg never shows on the body it comes out of).
// Drawn live like the other blank bases: one smooth shape over its bones, outlined only on its outer
// edge.
//
// The body, side on, facing right:
//   body    a round egg, the breast full in front, the back sloping to the tail; it tips (`pitch`),
//           crouches, settles down over its feet to perch (`sit`), fluffs its feathers (`fluff`)
//   head    big and round on a short neck held steady as the body moves, reaching forward to peck
//           (`reach`); each its own beak: a songbird's little cone, a duck's flat bill, an owl's small
//           hook in a pale facial disc; the beak opens (`beak`); a soft line where the eyes go
//   wings   folded along its sides (the near one on top, its edge soft where it lies over the body,
//           melting in at the shoulder), opening out and up (`wingN`, `wingF`), flapping (`flap`:
//           raised over the back, toward us, down under the belly; the hand lagging, then folding)
//   legs    two, a bird's: the thigh inside the body, the drumstick back down to the ankle, the
//           thin shank down to the toes (three forward, one back; webbed for a duck; big talons for
//           an owl); hopping with both feet, waddling, or walking
//   tail    a fan of feathers from the rump, tipping up (`tailUp`), flicking on a spring, spreading
//           (`spread`)
//   flight  moving fast it takes off: up off the ground, the feet tucked back, the wings beating
//           (each bird its own beat), the tail spread; landing again as it slows
// Presets: a songbird (hops; quick wingbeats), a duck (a boat of a body, a flat bill, webbed feet,
// waddles), an owl (a round barrel, a facial disc, feathered legs, big talons, walks with a roll,
// tilts its head).
// Moves (BIRD_MOVES): peck (two quick jabs), wing slap, swoop (up and down on its target, feet
// first), call (chirp, quack or hoot), jump, dash, dodge, hurt, knockdown; a happy flutter when
// pleased. Poses (m.pose): perch (settled down, fluffed), sleep (head tucked), hover.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { CHAR_LINE, sprite } from '../pixel.js';
import { legDefs as legDefsOf, placeLeg, legDrawer } from '../mobs/blankquad.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', beak: '#cbbad9', beakSh: '#ae9ec3', leg: '#b9aed0' };
const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const wrap = (x) => ((x % 1) + 1) % 1;
const hexRgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function ring(pts, n) {
  const P = [pts[pts.length - 1], ...pts, pts[0], pts[1]];
  const out = [];
  for (let i = 1; i <= pts.length; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  return out;
}

// ---------- The birds (units: game px at scale 1, about the middle of the body; x forward, y down) ----------
// body: its outline round from the top of the breast, over the back to the tail's root, under the
// belly and up the breast.
// wing: its root on the shoulder; folded and raised poses of its arm (shoulder to wrist) and hand
// (wrist to tip): [arm angle, arm length, hand angle (from the arm), hand length] in degrees and units;
// width at the shoulder, the wrist; how many feathers on its trailing edge.
const OWL = {
  name: 'Owl',
  scale: 1.1,
  gait: 'walk',
  body: [[6.4, -6.4], [4.2, -10.2], [0, -11.4], [-4.2, -10.4], [-7.2, -7], [-8.2, -2], [-7.6, 3.4], [-5.2, 7.4], [0, 9], [5, 7.6], [7.6, 3], [7.8, -2]],
  breast: [3.6, 1.4, 6],
  neck: { base: [1.4, -8.6], len: 2.6, ang: -84 },
  head: { r: 9.6, rx: 10, disc: true },
  beak: { kind: 'hook', at: [7.6, 1.6], len: 2.6, h: 2.6 },
  wing: { root: [-0.6, -5.6], far: [-1.2, -1], fold: [-264, 7.4, 6, 8.4], up: [-102, 6.8, 4, 11.4], w: [7, 7.8, 3.2], feathers: 5 },
  leg: { top: [0.8, 5.4], bones: [[1.6, 2.6], [-1.2, 2.6], [0.6, 2.2]], w: [6.6, 5.2, 3.8, 3.4] },
  far: [-2.2, -0.6],
  foot: { kind: 'talons', toe: 3.2, up: 0.9 },
  tail: { root: [-5.4, 7.2], ang: 128, len: 5, w: 3.6, n: 3, spread: 7 },
  flap: 2.9,
  flyH: 18,
  flyPitch: 34,
  moves: ['swoop', 'wingSlap', 'call'],
  call: 'hoot',
};

// ---------- The bird moves (units: x, hop in body heights; lift in px; angles in degrees) ----------
// pitch: + nose down; reach: the neck reaching forward (0..1); beak: open (0..1); wingN/wingF: the
// wings opened up (0 folded .. 1 raised); flap: beating them; tailUp: + up; spread: the tail fanned.
const BIRD_MOVES = {
  peck: {
    anticT: 0.16,
    keys: [
      [0, { x: -0.04, pitch: -8, reach: -0.3, head: -10, tailUp: 10 }],
      [0.05, { x: 0.06, pitch: 14, reach: 1, head: 24, beak: 0.5, tailUp: 24 }, 'out'],
      [0.1, { x: 0.05, pitch: 8, reach: 0.3, head: 10, beak: 0 }, 'in'],
      [0.16, { x: 0.07, pitch: 15, reach: 1, head: 26, beak: 0.5, tailUp: 26 }, 'out'],
      [0.24, { x: 0.05, pitch: 6, reach: 0.2, head: 6, beak: 0, tailUp: 14 }, 'in'],
      [0.4, { x: 0.03, pitch: -2, reach: 0, head: -3, tailUp: 4 }, 'io'],
      [0.7, {}],
    ],
    spark: [0.05, 0.16],
    sparkAt: 'beak',
  },
  wingSlap: {
    anticT: 0.18,
    keys: [
      [0, { x: -0.03, pitch: -6, wingN: 0.9, wingF: 0.5, tailUp: 10, spread: 0.6 }],
      [0.08, { x: 0.1, hop: 0.08, pitch: 8, wingN: -0.4, wingF: 0.2, flap: 0, tailUp: -4, spread: 0.8 }, 'out'],
      [0.16, { x: 0.12, hop: 0, pitch: 4, wingN: 0.2, wingF: 0.1, spread: 0.3 }, 'in'],
      [0.36, { x: 0.1, pitch: 0, wingN: 0.05, tailUp: 6 }, 'io'],
      [0.7, {}],
    ],
    spark: [0.08],
    sparkAt: 'wing',
    gust: [0.06],
  },
  swoop: {
    anticT: 0.22,
    keys: [
      [0, { crouch: 0.6, pitch: 6, wingN: 0.6, wingF: 0.6, spread: 0.4 }],
      [0.18, { x: 0.1, hop: 0.7, crouch: 0, pitch: -6, wingN: 1, wingF: 1, flap: 1, spread: 1, talon: 0.6 }, 'out'],
      [0.36, { x: 0.32, hop: 0.25, pitch: -18, wingN: 0.8, wingF: 0.8, flap: 0.3, talon: 1, spread: 1, tailUp: 14 }, 'in'],
      [0.46, { x: 0.36, hop: 0.02, pitch: -8, wingN: 0.7, wingF: 0.7, flap: 0, talon: 0.4, spread: 0.6 }, 'in'],
      [0.62, { x: 0.34, crouch: 0.3, pitch: 2, wingN: 0.3, wingF: 0.3, talon: 0, spread: 0.2 }, 'io'],
      [1, {}],
    ],
    spark: [0.42],
    sparkAt: 'feet',
    dust: [[0.46, 'feet']],
  },
  call: {
    anticT: 0.14,
    keys: [
      [0, { pitch: -6, reach: -0.2, head: -14, fluff: 0.4 }],
      [0.08, { pitch: -10, reach: 0.2, head: -26, beak: 1, fluff: 0.7, tailUp: 16 }, 'out'],
      [0.2, { pitch: -9, reach: 0.15, head: -22, beak: 0.2, fluff: 0.5 }, 'io'],
      [0.3, { pitch: -10, reach: 0.2, head: -26, beak: 1, fluff: 0.7, tailUp: 16 }, 'out'],
      [0.46, { pitch: -6, head: -16, beak: 0, fluff: 0.3 }, 'io'],
      [0.8, {}],
    ],
    sing: [0.08, 0.3],
  },
  jump: {
    anticT: 0.15,
    keys: [
      [0, { crouch: 0.7, pitch: 6, wingN: 0.2, wingF: 0.2 }],
      [0.14, { hop: 0.75, crouch: 0, pitch: -8, wingN: 1, wingF: 1, flap: 1, spread: 1, tailUp: 10 }, 'out'],
      [0.32, { hop: 0.8, pitch: 0, wingN: 0.9, wingF: 0.9, flap: 0.6, spread: 0.8 }, 'out'],
      [0.52, { hop: 0.02, pitch: 8, wingN: 0.6, wingF: 0.6, flap: 0, spread: 0.6 }, 'in'],
      [0.58, { crouch: 0.5, pitch: 4, wingN: 0.2, wingF: 0.2, spread: 0.2 }, 'out'],
      [0.74, { crouch: 0.1, pitch: -1, wingN: 0, wingF: 0, tailUp: 14 }, 'io'],
      [1.05, {}],
    ],
    dust: [[0, 'feet'], [0.55, 'feet']],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.4 }],
      [0.08, { x: 0.22, hop: 0.12, pitch: -10, wingN: 0.9, wingF: 0.9, flap: 1, spread: 0.8 }, 'out'],
      [0.3, { x: 0.26, hop: 0.06, pitch: -8, wingN: 0.8, wingF: 0.8, flap: 0.8, spread: 0.6 }],
      [0.46, { x: 0.25, crouch: 0.3, pitch: 6, wingN: 0.4, wingF: 0.4, flap: 0, tailUp: 18 }, 'io'],
      [0.82, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.4 }],
      [0.12, { hop: 0.35, x: -0.26, pitch: -16, wingN: 1, wingF: 1, flap: 1, spread: 1, fluff: 0.5 }, 'out'],
      [0.32, { x: -0.3, hop: 0.02, crouch: 0.4, pitch: 4, wingN: 0.4, wingF: 0.4, flap: 0, fluff: 0.3 }, 'in'],
      [0.48, { x: -0.29, crouch: 0.1, pitch: -2, wingN: 0, wingF: 0, tailUp: 14 }, 'io'],
      [0.84, {}],
    ],
    dust: [[0.32, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -10, head: -16, reach: -0.3, wingN: 0.5, wingF: 0.5, fluff: 1, tailUp: 20, beak: 0.5 }, 'out'], [0.2, { x: -0.05, pitch: -6, head: -10, wingN: 0.3, wingF: 0.3, fluff: 0.8, beak: 0.2 }], [0.38, { x: -0.03, pitch: -1, wingN: 0.05, wingF: 0.05, fluff: 0.3 }, 'io'], [0.76, {}]],
    feathers: [0.05],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, pitch: -14, head: -14, wingN: 0.7, wingF: 0.7, fluff: 1, beak: 0.4 }, 'out'],
      [0.38, { sit: 1, x: -0.08, pitch: 10, head: 18, wingN: 0.5, wingF: 0.5, fluff: 0.6 }, 'in'],
      [0.46, { sit: 0.95, x: -0.08, pitch: 8, head: 14, wingN: 0.45, wingF: 0.45 }, 'out'],
      [1.05, { sit: 1, x: -0.08, pitch: 10, head: 18, wingN: 0.4, wingF: 0.4 }],
      [1.32, { crouch: 0.4, x: -0.04, wingN: 0.1, wingF: 0.1 }],
      [1.6, {}],
    ],
    feathers: [0.1],
    dust: [[0.38, 'body']],
  },
  // Pleased: a happy flutter, up on its toes, the wings beating, the tail fanned and flicking.
  flutter: {
    anticT: 0.1,
    keys: [
      [0, { crouch: 0.3, fluff: 0.3 }],
      [0.14, { hop: 0.2, pitch: -10, wingN: 1, wingF: 1, flap: 1, spread: 1, tailUp: 20, fluff: 0.5, beak: 0.5 }, 'out'],
      [0.6, { hop: 0.16, pitch: -8, wingN: 0.9, wingF: 0.9, flap: 1, spread: 1, tailUp: 18, fluff: 0.5, beak: 0.3 }],
      [0.74, { hop: 0, crouch: 0.3, pitch: 2, wingN: 0.2, wingF: 0.2, flap: 0, spread: 0.3 }, 'in'],
      [1.05, {}],
    ],
    sing: [0.2],
  },
};
const BIRD_SHOW = ['peck', 'wingSlap', 'swoop', 'call', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'flutter'];
const POOL = ['peck', 'wingSlap', 'call'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: smoothstep };
function poseAt(mv, t, antic, base) {
  const keys = mv.keys.map(([kt, pose, ease]) => [kt, { ...base, ...pose }, ease]);
  if (t < 0) {
    const out = {};
    for (const k of Object.keys(base)) out[k] = base[k] + (keys[0][1][k] - base[k]) * smoothstep(antic);
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, ease] = keys[i + 1];
  const u = (EASE[ease] ?? smoothstep)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  const out = {};
  for (const k of Object.keys(p0)) out[k] = p0[k] + (p1[k] - p0[k]) * u;
  return out;
}
const since = (moments, t, len) => {
  let best = -1;
  for (const m of moments ?? []) if (typeof m === 'number' && t >= m && t <= m + len) best = (t - m) / len;
  return best;
};

const CH = ['x', 'lift', 'hop', 'pitch', 'crouch', 'sit', 'sleep', 'fluff', 'reach', 'head', 'beak', 'wingN', 'wingF', 'flap', 'tailUp', 'spread', 'talon', 'hover'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
// (a smooth hump over [s, e] of a cycle)
const bump = (u, s0, e0) => {
  const f = wrap(u - s0);
  const len = e0 - s0;
  return f < len ? (1 - Math.cos((TAU * f) / len)) / 2 : 0;
};
const herm = (p0, p1, m0, m1, v) => {
  const v2 = v * v;
  const v3 = v2 * v;
  return (2 * v3 - 3 * v2 + 1) * p0 + (v3 - 2 * v2 + v) * m0 + (-2 * v3 + 3 * v2) * p1 + (v3 - v2) * m1;
};
// A foot at stride u: planted (sliding back under the body as it goes on), or lifted and carried
// forward, leaving and landing gently.
function footAt(u, start, duty, cyc, liftH) {
  const q = wrap(u - start);
  const reach = (cyc * duty) / 2;
  if (q < duty) {
    const t = q / duty;
    return { dx: reach - 2 * reach * t, lift: 0, s: t, v: -1 };
  }
  const v = (q - duty) / (1 - duty);
  const m = (-2 * reach * (1 - duty)) / duty;
  return { dx: herm(-reach, reach, m, m, v), lift: liftH * Math.sin(Math.PI * v) ** 1.4, s: -1, v };
}

// ---------- One rig for a preset ----------
function owlRig(look = {}) {
  // (the dress, by a name the base's own code never uses: its pose has a `look` of its own)
  const DRESS = look;
  const LP = look.P ?? {};
  const P = { ...OWL, ...LP, head: { ...OWL.head, ...(LP.head ?? {}) }, beak: { ...OWL.beak, ...(LP.beak ?? {}) }, wing: { ...OWL.wing, ...(LP.wing ?? {}) }, tail: { ...OWL.tail, ...(LP.tail ?? {}) } };
  const C = { ...C0, ...(look.C ?? {}) };
  const s = P.scale;
  const sc = (v) => v * s;
  // (the two legs, near and far, both "hind" in the joints' sense: the knee forward inside the body,
  // the ankle back)
  const legSpec = { fore: P.leg, hind: P.leg, far: P.far };
  const defs = legDefsOf(legSpec, sc);
  const legDefs = { legN: defs.hindN, legF: defs.hindF };
  const hb = sc(legDefs.legN.rest[3][1] + P.foot.up);
  const LL = legDefs.legN.lens.reduce((x, y) => x + y, 0);
  const xs = P.body.map((p) => p[0]);
  const bodyLen = sc(Math.max(...xs) - Math.min(...xs));
  const H = hb + sc(-Math.min(...P.body.map((p) => p[1])) + P.neck.len + P.head.r * 1.7);
  const stride = LL * (P.gait === 'hop' ? 1.5 : 1.15);
  const walkSpeed = stride * (P.gait === 'hop' ? 1.6 : 1.3);
  const cycle = (r) => stride * (1 + 0.6 * r);
  const BELLY = Math.max(...P.body.map((p) => p[1]));

  function skeleton(S, a) {
    const t = a.t;
    const w = a.walkW ?? 0;
    const st = a.mo.rig;
    const fly = clamp(Math.max(st.bdFly ?? 0, S.hover), 0, 1);
    const u = st.bdU ?? 0;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const sit = clamp(S.sit, 0, 1);
    // (following a beat behind and settling, never snapping)
    const F = (st.bdF ??= {});
    const follow = (key, goal, k, c) => {
      const f = (F[key] ??= [goal, 0]);
      for (let n = 0; n < 2; n++) {
        f[1] += ((goal - f[0]) * k - f[1] * c) * (dt / 2);
        f[0] += f[1] * (dt / 2);
      }
      return f[0];
    };
    // On the ground: its own gait. A songbird hops with both feet together (a crouch, a spring, a
    // little flight, a landing that tips it nose down and flicks its tail up); a duck waddles (each
    // step rocking it, the body swaying over the planted foot); an owl walks with a slow roll.
    const gw = w * (1 - fly);
    const steps = {};
    let bob = 0;
    let rock = 0;
    let tailKick = 0;
    if (P.gait === 'hop') {
      const duty = 0.42;
      for (const [k, ph] of [['legN', 0], ['legF', 0.03]]) steps[k] = footAt(u, ph, duty, cycle(0), LL * 0.25);
      const fl = wrap(u - duty);
      const air = fl < 1 - duty ? Math.sin((Math.PI * fl) / (1 - duty)) : 0;
      bob = air * LL * 0.5 - bump(u, -0.06, 0.24) * LL * 0.12 + bump(u, duty - 0.16, duty + 0.04) * LL * 0.06;
      rock = bump(u, duty - 0.14, duty + 0.18) * -8 + bump(u, 0.9, 1.22) * 10;
      tailKick = bump(u, -0.02, 0.3) * 22;
    } else {
      const duty = P.gait === 'waddle' ? 0.6 : 0.62;
      for (const [k, ph] of [['legN', 0], ['legF', 0.5]]) steps[k] = footAt(u, ph, duty, cycle(0), LL * (P.gait === 'waddle' ? 0.3 : 0.22));
      // (rising over each planted foot, lowest as the weight changes feet; a waddle rocks forward
      // and back with each step, a walk only a little)
      bob = (0.5 - 0.5 * Math.cos(TAU * 2 * u)) * LL * 0.06;
      rock = Math.sin(TAU * 2 * u) * (P.gait === 'waddle' ? 7 : 3);
      tailKick = Math.sin(TAU * 2 * u - 0.6) * (P.gait === 'waddle' ? 10 : 3);
    }
    // In the air: the wings beat (each bird its own beat), the body lifting on each downstroke.
    const beat = (st.bdBeat = (st.bdBeat ?? 0) + dt * P.flap * (0.9 + 0.3 * fly));
    const flapAmt = clamp(Math.max(fly, S.flap), 0, 1);
    const flyBob = fly * (sc(P.flyH) + Math.sin(TAU * beat - 1.2) * sc(1.2));
    const bobS = follow('bob', bob * gw, 260, 24);
    // (a songbird or a duck flies level; the upright owl leans well forward into its flight, and
    // stays upright hovering)
    const rockS = follow('rock', rock * gw + clamp(st.bdFly ?? 0, 0, 1) * P.flyPitch, 220, 22);
    let pH = hb + S.lift - clamp(S.crouch, 0, 1.2) * hb * 0.32;
    pH = lerp(pH, sc(BELLY) * 0.96 + sc(0.4), sit);
    const pivot = [S.x, -pH - S.hop - bobS - flyBob];
    const th = (S.pitch + rockS) * D2R;
    const at = (p) => add(pivot, rot([sc(p[0]), sc(p[1])], th));
    // The head: on its short neck, reaching forward to peck, held steadier than the body; tucked
    // back into the feathers asleep.
    const nb = at(P.neck.base);
    const sleep = clamp(S.sleep, 0, 1);
    const na = th * 0.5 + (P.neck.ang + 70 * clamp(S.reach, -1, 1.2) - sleep * 60) * D2R;
    const len = sc(P.neck.len) * (1 + Math.max(0, S.reach) * 0.7 - sleep * 0.5);
    const hp = add(nb, [Math.cos(na) * len, Math.sin(na) * len]);
    const ha = follow('head', th * 0.4 + (S.head + sleep * 70) * D2R + (a.bdTilt ?? 0) * D2R, 220, 23);
    const beakTip = add(hp, rot([sc(P.beak.at[0] + P.beak.len), sc(P.beak.at[1])], ha));
    // The legs: stepping on the ground; tucked back under the tail in flight; talons forward to
    // strike; hidden under the body perched.
    const ground = -sc(P.foot.up);
    const Lg = {};
    for (const [k, L] of Object.entries(legDefs)) {
      const g = steps[k];
      const T = at(L.top);
      let foot = [sc(L.rest[3][0]) + S.x * 0.35 * (1 - w) + g.dx * gw, ground - g.lift * gw - S.hop - flyBob];
      let a3 = L.a3 + (g.v < 0 ? lerp(0.1, -0.35, g.s) * gw : lerp(-0.6, 0.15, smoothstep(g.v)) * gw);
      const to = (q, an, k2) => {
        if (!(k2 > 0)) return;
        foot = lerp2(foot, q, k2);
        a3 = lerp(a3, an, k2);
      };
      to(add(T, [-LL * 0.5, LL * 0.42]), -1.2, Math.max(fly, clamp(S.hop / (hb * 0.6), 0, 1) * 0.6));
      to(add(T, [LL * 0.55, LL * 0.62]), 0.9, clamp(S.talon, 0, 1));
      to([T[0] + sc(0.6), ground], L.a3, sit);
      const bones = placeLeg(L, T, foot, a3);
      Lg[k] = { hind: true, ...bones, rot: (a3 - L.a3) * 0.6, w: L.w, grip: clamp(S.talon, 0, 1) };
    }
    // The wings: each from its shoulder, folded along the side, opening up and out; beating.
    // (Beating, seen from the side: each wing swings from raised over the back, through pointing
    // at us (short, only its width showing), to lowered under the belly; its width always runs
    // front to back, the feather tips behind; the hand lags the arm on the downstroke and folds in
    // on the upstroke. The downstroke a little quicker; a soft hold at the top and the bottom.)
    const W0 = P.wing;
    const wings = {};
    const DOWN = 0.45;
    const phiAt = (q) => {
      const r = wrap(q);
      return Math.PI * (r < DOWN ? smoothstep(r / DOWN) : 1 - smoothstep((r - DOWN) / (1 - DOWN)));
    };
    const phi = phiAt(beat);
    const dphi = (phiAt(beat + 0.01) - phiAt(beat - 0.01)) / 0.02;
    const phiH = clamp(phi - clamp(dphi * 0.06, -0.7, 0.55), -0.25, Math.PI + 0.35);
    const back = [-Math.cos(th), -Math.sin(th)];
    for (const [side, open0] of [['near', S.wingN], ['far', S.wingF]]) {
      const open = clamp(open0, -0.6, 1.2);
      const root = side === 'near' ? at(W0.root) : at(add(W0.root, W0.far));
      const k = smoothstep(clamp(open, 0, 1));
      // (held still: folded, raised, or swung down by a negative `open`)
      const s1 = th + (lerp(W0.fold[0], W0.up[0], k) + (open < 0 ? open * 110 : 0)) * D2R;
      const s2 = s1 + (lerp(W0.fold[2], W0.up[2], k) - (side === 'far' ? 4 : 0)) * D2R;
      const l1 = sc(lerp(W0.fold[1], W0.up[1], k));
      const l2 = sc(lerp(W0.fold[3], W0.up[3], k));
      let wrist = add(root, [Math.cos(s1) * l1, Math.sin(s1) * l1]);
      let tip = add(wrist, [Math.cos(s2) * l2, Math.sin(s2) * l2]);
      // (beating: the span swings round the shoulder, seen from the side)
      const f = smoothstep(flapAmt);
      if (f > 0) {
        const L1 = sc(W0.up[1]) * 1.12;
        const L2 = sc(W0.up[3]) * 1.12;
        const wF = add(root, rot([-0.3 * L1, -Math.cos(phi) * L1], th));
        const tF = add(wF, rot([-0.55 * L2, -Math.cos(phiH) * L2], th));
        wrist = lerp2(wrist, wF, f);
        tip = lerp2(tip, tF, f);
      }
      const a1 = Math.atan2(wrist[1] - root[1], wrist[0] - root[0]);
      const a2 = Math.atan2(tip[1] - wrist[1], tip[0] - wrist[0]);
      // (which way its width runs: folded, across the arm; opened or beating, front to back)
      const kc = Math.max(k, f);
      const across = (an) => {
        const rel = (((((an - th) / D2R + 90) % 360) - 360) % 360);
        const ca = th + lerp(rel, -180, kc) * D2R;
        return [Math.cos(ca), Math.sin(ca)];
      };
      wings[side] = { root, wrist, tip, a1, a2, c1: across(s1), c2: across(s2), open: Math.max(k, f), phi: f > 0 ? phi : -1 };
    }
    // The tail: a fan from the rump, flicking on a spring, tipping with the step, fanned open.
    const tailGoal = th + (P.tail.ang + S.tailUp + tailKick * gw - fly * 8) * D2R;
    const ta = follow('tail', tailGoal, 160, 14);
    const tail = { root: at(P.tail.root), ang: ta, spread: clamp(Math.max(S.spread, fly * 0.8), 0, 1) };
    return { pivot, th, at, legs: Lg, nb, hp, ha, beakTip, beak: clamp(S.beak, 0, 1), wings, tail, fluff: clamp(S.fluff, 0, 1), sit, sleep };
  }

  // ---------- Drawing ----------
  const colour = (a, c) => {
    const k = Math.min(0.85, (a.flash ?? 0) * 6);
    if (k <= 0) return c;
    const [r, g, b] = hexRgb(c);
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  };
  const tint = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = hexRgb(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const edge = (ctx) => {
    ctx.strokeStyle = CHAR_LINE;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const QD = legDrawer({ C, edge });
  const { tubePath, tubeInto, poly } = QD;
  const outline = ring(P.body, 4);
  const bodyPtsOf = (sk) => (sk.pts ??= outline.map(sk.at));
  const glow = (ctx, c, r, k, col) => {
    const [cr, cg, cb] = hexRgb(col);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  // A leg: thin and scaly below the feathers (a duck's webbed foot, an owl's feathered drumstick and
  // big talons, a songbird's three toes forward and one back).
  function drawLeg(ctx, a, mode, k) {
    const sk = a.bk;
    const Lg = sk.legs[k];
    const far = k === 'legF';
    const F0 = P.foot;
    const toe = sc(F0.toe);
    const curl = Lg.grip * 0.9;
    const toes = (c2, grow = 0) => {
      const base = Lg.P;
      const r0 = Lg.rot;
      if (F0.kind === 'web') {
        // a webbed paddle, fanning forward
        const pts = [[0, -0.6], [toe * 0.5, -0.4], [toe * 1.05, 0.6], [toe * 0.9, 1.6], [toe * 0.35, 1.4], [-0.6, 0.9]].map((p) => add(base, rot(p.map((v) => v + Math.sign(v) * grow * 0.5), r0)));
        const sm = ring(pts, 2);
        c2.moveTo(...sm[0]);
        for (const p of sm.slice(1)) c2.lineTo(...p);
        c2.closePath();
        return;
      }
      const tw = sc(F0.kind === 'talons' ? 1.3 : 0.9) + grow;
      for (const [an, l] of [[-0.42, 0.9], [0.02, 1], [0.42, 0.85], [Math.PI + 0.2, 0.5]]) {
        const dir = r0 + an * (1 - curl * 0.5) + (an < 3 ? curl * 0.9 : -curl * 0.5);
        const p1 = add(base, [Math.cos(dir) * toe * l, Math.sin(dir) * toe * l * 0.45 + sc(0.6)]);
        tubeInto(c2, [base, p1], [tw * 1.1, tw * (F0.kind === 'talons' ? 0.55 : 0.8)]);
      }
    };
    const dark = (c2) => {
      if (F0.kind !== 'talons') tubeInto(c2, [lerp2(Lg.J2, Lg.P, 0.1), Lg.P], [Math.max(0.6, Lg.w[2] - 1), Math.max(0.6, Lg.w[3] - 1)]);
      toes(c2, -0.5);
    };
    QD.drawLeg(ctx, mode, Lg, { far, colour: (c) => colour(a, c), tint: (c, al) => tint(a, c, al), bodyPts: far ? null : bodyPtsOf(sk), foot: { path: toes, dark, darkColour: [C.leg, C.deep] }, unit: s * 0.7 });
  }
  // The body: the egg; the back lit, the breast pale and full, the belly soft in shade, feathers
  // fluffed as a soft scalloped edge round its outline.
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    const pts = bodyPtsOf(sk);
    const fl = sk.fluff;
    poly(ctx, pts);
    if (fl > 0.02) {
      // (fluffed: soft little rounds of feathers just outside the edge, along the belly and back)
      for (let i = 0; i < pts.length; i += 3) {
        const [x, y] = pts[i];
        const r = sc(1.1) * fl;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
    }
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const top = sk.at([-1, -9]);
    glow(ctx, top, sc(9), 0.7, C.lt);
    glow(ctx, sk.at(P.breast), sc(P.breast[2]) * 1.3, 0.95, C.lt);
    glow(ctx, sk.at([-4, BELLY + 1]), sc(7), 0.55, C.sh);
    ctx.restore();
  }
  // The head: round, on its short neck; the beak; the owl's facial disc; the soft eye line.
  function drawNeck(ctx, a, mode) {
    const sk = a.bk;
    const pts = [sk.nb, lerp2(sk.nb, sk.hp, 0.5), sk.hp];
    const wl = pts.map(() => sc(P.head.r) * 1.1);
    tubePath(ctx, pts, wl);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
  }
  function beakPath(c2, open, lower) {
    const B = P.beak;
    const [bx, by] = B.at.map(sc);
    const L = sc(B.len);
    const h = sc(B.h);
    c2.beginPath();
    if (B.kind === 'bill') {
      // a duck's: long, flat, rounded at the end, the lower half dropping open
      if (!lower) {
        c2.moveTo(bx - sc(0.6), by - h * 0.55);
        c2.quadraticCurveTo(bx + L * 0.5, by - h * 0.62, bx + L * 0.95, by - h * 0.22);
        c2.quadraticCurveTo(bx + L * 1.08, by + h * 0.06, bx + L * 0.9, by + h * 0.08);
        c2.lineTo(bx - sc(0.4), by + h * 0.06);
      } else {
        c2.moveTo(bx - sc(0.4), by + h * 0.02);
        c2.lineTo(bx + L * 0.88, by + h * 0.04);
        c2.quadraticCurveTo(bx + L * 0.96, by + h * 0.4, bx + L * 0.78, by + h * 0.44);
        c2.quadraticCurveTo(bx + L * 0.3, by + h * 0.46, bx - sc(0.2), by + h * 0.36);
      }
    } else if (B.kind === 'hook') {
      // an owl's: small, hooked down at the tip
      if (!lower) {
        c2.moveTo(bx - sc(0.2), by - h * 0.5);
        c2.quadraticCurveTo(bx + L * 0.9, by - h * 0.5, bx + L, by + h * 0.25);
        c2.quadraticCurveTo(bx + L * 0.8, by + h * 0.2, bx + L * 0.55, by + h * 0.05);
        c2.lineTo(bx - sc(0.2), by + h * 0.1);
      } else {
        c2.moveTo(bx, by + h * 0.05);
        c2.lineTo(bx + L * 0.55, by + h * 0.08);
        c2.quadraticCurveTo(bx + L * 0.5, by + h * 0.4, bx, by + h * 0.4);
      }
    } else {
      // a songbird's: a little cone
      if (!lower) {
        c2.moveTo(bx - sc(0.2), by - h * 0.5);
        c2.quadraticCurveTo(bx + L * 0.5, by - h * 0.42, bx + L, by + h * 0.02);
        c2.lineTo(bx - sc(0.2), by + h * 0.08);
      } else {
        c2.moveTo(bx - sc(0.2), by + h * 0.04);
        c2.lineTo(bx + L * 0.9, by + h * 0.06);
        c2.quadraticCurveTo(bx + L * 0.45, by + h * 0.42, bx - sc(0.2), by + h * 0.46);
      }
    }
    c2.closePath();
  }
  // The beak: the lower half dropping open about its root, the upper over it; on the face (an
  // owl's), a soft deeper edge instead of the outline.
  function drawBeak(ctx, a, mode, sk, bx, by) {
    for (const lower of [true, false]) {
      ctx.save();
      if (lower) {
        ctx.translate(bx, by);
        ctx.rotate(sk.beak * 0.42);
        ctx.translate(-bx, -by);
      }
      beakPath(ctx, sk.beak, lower);
      if (mode === 'line') edge(ctx);
      else {
        if (mode === 'face') {
          ctx.strokeStyle = colour(a, C.beakSh);
          ctx.lineWidth = 1.2;
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
        ctx.fillStyle = colour(a, lower ? C.beakSh : C.beak);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  function drawHead(ctx, a, mode) {
    const sk = a.bk;
    const Hd = P.head;
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    const [bx, by] = P.beak.at.map(sc);
    const onFace = P.beak.kind === 'hook';
    // (an owl's beak sits in its facial disc, drawn over the face below; the others stand out from
    // the head, their roots under it)
    if (!onFace) drawBeak(ctx, a, mode, sk, bx, by);
    // the head
    ctx.beginPath();
    ctx.ellipse(0, 0, sc(Hd.rx), sc(Hd.r), 0, 0, TAU);
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, sc(Hd.rx), sc(Hd.r), 0, 0, TAU);
    ctx.clip();
    glow(ctx, [-sc(Hd.rx) * 0.15, -sc(Hd.r) * 0.45], sc(Hd.rx) * 0.85, 0.95, C.lt);
    glow(ctx, [-sc(Hd.rx) * 0.6, sc(Hd.r) * 0.35], sc(Hd.r) * 0.6, 0.45, C.sh);
    if (Hd.disc) {
      // an owl's facial disc: a pale round 'D' on the front of the face, its rim a soft deeper line
      // round its back
      const c = [sc(Hd.rx) * 0.4, sc(Hd.r) * 0.12];
      const [drx, dry] = [sc(Hd.r) * 0.66, sc(Hd.r) * 0.8];
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], drx, dry, 0, 0, TAU);
      ctx.fillStyle = tint(a, C.lt, 0.92);
      ctx.fill();
      ctx.strokeStyle = colour(a, C.sh);
      ctx.lineWidth = Math.max(0.6, sc(0.9));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(c[0], c[1], drx, dry, 0, Math.PI * 0.55, Math.PI * 1.45);
      ctx.stroke();
      glow(ctx, [c[0] + drx * 0.3, c[1] + dry * 0.1], drx * 0.7, 0.6, '#ffffff');
    }
    ctx.restore();
    if (onFace) drawBeak(ctx, a, 'face', sk, bx, by);
    // its own face (the dress)
    DRESS.face?.(ctx, a, sk, KIT);
    ctx.restore();
  }
  // A wing: a soft leaf of feathers along its arm and hand, the leading edge smooth, the trailing
  // edge in rounded feather tips; pale coverts near the shoulder, the long flight feathers' lines.
  function wingPts(wg) {
    const W0 = P.wing;
    const [w0, w1, w2] = W0.w.map(sc);
    const n1 = wg.c1;
    const n2 = wg.c2;
    // (the leading edge on one side, the feathered trailing edge on the other)
    const lead = [add(wg.root, n1.map((v) => -v * w0 * 0.35)), add(wg.wrist, n1.map((v) => -v * w1 * 0.3)), add(lerp2(wg.wrist, wg.tip, 0.6), n2.map((v) => -v * w2 * 0.45)), wg.tip];
    const trail = [];
    const n = W0.feathers;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      // feather tips from the tip back along the hand and the arm to the shoulder
      const along = u < 0.5 ? lerp2(wg.tip, wg.wrist, u / 0.5) : lerp2(wg.wrist, wg.root, (u - 0.5) / 0.5);
      const nn = u < 0.5 ? n2 : n1;
      const ww = u < 0.5 ? lerp(w2, w1, u / 0.5) : lerp(w1, w0, (u - 0.5) / 0.5);
      trail.push(add(along, nn.map((v) => v * ww * 0.75)));
      if (i < n) {
        const u2 = (i + 0.5) / n;
        const along2 = u2 < 0.5 ? lerp2(wg.tip, wg.wrist, u2 / 0.5) : lerp2(wg.wrist, wg.root, (u2 - 0.5) / 0.5);
        const nn2 = u2 < 0.5 ? n2 : n1;
        const ww2 = u2 < 0.5 ? lerp(w2, w1, u2 / 0.5) : lerp(w1, w0, (u2 - 0.5) / 0.5);
        trail.push(add(along2, nn2.map((v) => v * ww2 * 0.5)));
      }
    }
    return ring([...lead, ...trail.slice(1)], 3);
  }
  function drawWing(ctx, a, mode, side) {
    const sk = a.bk;
    const wg = sk.wings[side];
    const far = side === 'far';
    const pts = wingPts(wg);
    poly(ctx, pts);
    if (mode === 'line') return edge(ctx);
    if (!far) {
      // (the near wing lies over the body: where it does, its edge is a soft deeper line, faded out
      // at the shoulder where it grows from the body)
      ctx.save();
      poly(ctx, bodyPtsOf(sk));
      ctx.clip();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      ctx.moveTo(wg.root[0] + sc(3.4), wg.root[1]);
      ctx.arc(wg.root[0], wg.root[1], sc(3.4), 0, TAU);
      ctx.clip('evenodd');
      poly(ctx, pts);
      ctx.strokeStyle = colour(a, C.deep);
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
      // (and where it lies over the head, raised: a firmer line, the head being a separate shape)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(sk.hp[0], sk.hp[1], sc(P.head.rx), sc(P.head.r), sk.ha, 0, TAU);
      ctx.clip();
      poly(ctx, bodyPtsOf(sk));
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      ctx.clip('evenodd');
      poly(ctx, pts);
      ctx.strokeStyle = colour(a, C.deep);
      ctx.lineWidth = 1.9;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    poly(ctx, pts);
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    glow(ctx, lerp2(wg.root, wg.wrist, 0.6), sc(P.wing.w[1]) * 0.9, far ? 0.25 : 0.7, C.lt);
    // the flight feathers' lines, fanning from the wrist to the trailing edge
    ctx.strokeStyle = colour(a, far ? C.deep : C.sh);
    ctx.lineWidth = Math.max(0.4, sc(0.5));
    ctx.lineCap = 'round';
    const n2 = wg.c2;
    for (let i = 1; i <= 3; i++) {
      const p0 = lerp2(wg.wrist, wg.tip, 0.15 + i * 0.12);
      const p1 = add(lerp2(wg.wrist, wg.tip, 0.25 + i * 0.18), n2.map((v) => v * sc(P.wing.w[2]) * 0.55));
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      ctx.stroke();
    }
    ctx.restore();
  }
  // The tail: a fan of rounded feathers from the rump, opening as it spreads.
  function drawTail(ctx, a, mode) {
    const sk = a.bk;
    const T0 = P.tail;
    const { root, ang, spread } = sk.tail;
    const n = T0.n;
    const fan = (T0.spread + spread * T0.spread * 1.6) * D2R;
    ctx.beginPath();
    const feathers = [];
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0 : i / (n - 1) - 0.5;
      const an = ang + f * fan;
      const L = sc(T0.len) * (1 - Math.abs(f) * 0.18);
      const tip = add(root, [Math.cos(an) * L, Math.sin(an) * L]);
      feathers.push([root, tip, an]);
      tubeInto(ctx, [root, lerp2(root, tip, 0.6), tip], [sc(T0.w) * 0.8, sc(T0.w), sc(T0.w) * 0.85]);
    }
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.sh);
    ctx.fill('nonzero');
    // (each feather's own soft light down its middle)
    for (const [r0, tip] of feathers) {
      tubePath(ctx, [lerp2(r0, tip, 0.25), tip], [sc(T0.w) * 0.35, sc(T0.w) * 0.45]);
      ctx.fillStyle = colour(a, C.base);
      ctx.fill('nonzero');
    }
  }

  // ---------- Effects: sparkles, a gust, notes for a call, loose feathers, dust, speed lines ----------
  const star = (ctx, x, y, r, an, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.32 : r;
      const q = an + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const puffAt = (ctx, x, y, r, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const note = (ctx, x, y, r, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.75, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillRect(x + r * 0.7, y - r * 3, r * 0.35, r * 3);
    ctx.beginPath();
    ctx.moveTo(x + r * 1.05, y - r * 3);
    ctx.quadraticCurveTo(x + r * 2.2, y - r * 2.4, x + r * 1.6, y - r * 1.4);
    ctx.lineWidth = r * 0.35;
    ctx.strokeStyle = fill;
    ctx.stroke();
  };
  const feather = (ctx, x, y, r, an, fill) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.38, 0, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.3, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();
    ctx.restore();
  };
  const spot = (sk, what) => {
    if (what === 'beak') return sk.beakTip;
    if (what === 'wing') return sk.wings.near.tip;
    if (what === 'feet') return lerp2(sk.legs.legN.P, sk.legs.legF.P, 0.5);
    if (what === 'body') return add(sk.pivot, [0, sc(6)]);
    return sk.hp;
  };
  function drawFx(ctx, m, a) {
    const sk = a.bk;
    const mv = a.bdMove?.mv;
    const t = a.bdMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    for (const s0 of mv.spark ?? []) {
      const sp = since([s0], t, 0.22);
      if (sp < 0) continue;
      const [sx, sy] = spot(sk, mv.sparkAt);
      const e = 1 - (1 - sp) ** 3;
      ctx.globalAlpha = 1 - sp;
      star(ctx, sx, sy, H * 0.1 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
      star(ctx, sx, sy, H * 0.05 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.6;
        star(ctx, sx + Math.cos(q) * H * 0.14 * e, sy + Math.sin(q) * H * 0.14 * e, H * 0.026, q, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    for (const g0 of mv.gust ?? []) {
      const gp = since([g0], t, 0.3);
      if (gp < 0) continue;
      const [gx, gy] = sk.wings.near.tip;
      ctx.globalAlpha = (1 - gp) * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.lineWidth = sc(0.9);
        ctx.beginPath();
        const y = gy + sc((i - 1) * 3);
        ctx.arc(gx + sc(4 + gp * 10), y, sc(3 + i), -0.9, 0.9);
        ctx.stroke();
      }
    }
    for (const n0 of mv.sing ?? []) {
      const np = since([n0], t, 0.7);
      if (np < 0) continue;
      const [nx, ny] = sk.beakTip;
      ctx.globalAlpha = 1 - np;
      if (P.call === 'hoot') {
        // a hoot: soft rings rolling out
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = sc(0.9);
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.arc(nx, ny, sc(3 + np * 9 + i * 3), -0.7, 0.7);
          ctx.stroke();
        }
      } else note(ctx, nx + sc(2 + np * 6), ny - sc(np * 9), sc(P.call === 'quack' ? 1.4 : 1.1), P.call === 'quack' ? '#fff2a8' : '#ffc8de');
    }
    for (const f0 of mv.feathers ?? []) {
      const fp = since([f0], t, 0.9);
      if (fp < 0) continue;
      ctx.globalAlpha = 1 - fp;
      const [cx, cy] = sk.pivot;
      for (let i = 0; i < 3; i++) {
        const dir = -2.2 + i * 1.1;
        feather(ctx, cx + Math.cos(dir) * sc(6 + fp * 8), cy - sc(4) + Math.sin(dir) * sc(4) + fp * sc(6), sc(1.8), Math.sin(fp * 6 + i) * 0.8, '#f3eefa');
      }
    }
    for (const [d0, where] of mv.dust ?? []) {
      const dp = since([d0], t, 0.4);
      if (dp < 0) continue;
      const [gx] = spot(sk, where);
      const e = 1 - (1 - dp) ** 2;
      for (let i = 0; i < 4; i++) {
        const dir = i < 2 ? -1 : 1;
        puffAt(ctx, gx + dir * sc(2 + (i % 2) * 3) * (0.4 + e), -sc(1 + (i % 2)) - e * sc(2.4), sc(1.3 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - dp) * 0.85);
      }
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.9);
      for (let i = 0; i < 3; i++) {
        const y = sk.pivot[1] + sc((i - 1) * 4);
        ctx.beginPath();
        ctx.moveTo(sk.pivot[0] - sc(13) - sc(6) * k, y);
        ctx.lineTo(sk.pivot[0] - sc(23) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && BIRD_MOVES[m.act.name]) {
      const mv = BIRD_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.bdAtk) {
        const pool = m.def.moves ?? POOL;
        st.bdN = (st.bdN ?? m.uid) + 1;
        st.bdPick = m.move ?? pool[st.bdN % pool.length];
      }
      st.bdAtk = true;
      const mv = BIRD_MOVES[st.bdPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.bdAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(BIRD_MOVES.hurt)) return [BIRD_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(BIRD_MOVES.flutter)) return [BIRD_MOVES.flutter, gl, 1];
    return [null, 0, 0];
  }
  // (the dress's kit, and its hooks round each part)
  const KIT = {
    C, P, colour, tint, edge, glow, sc, poly, H, moves: BIRD_MOVES, poseAt, hold,
    headFrame: (ctx, a) => {
      ctx.translate(...a.bk.hp);
      ctx.rotate(a.bk.ha);
    },
    bodyPath: (ctx, a) => poly(ctx, bodyPtsOf(a.bk)),
  };
  const live = (name, draw) => ({
    name,
    draw: (ctx, a, mode) => {
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
    },
  });
  const seq = [
    live('wingF', (ctx, a, mode) => drawWing(ctx, a, mode, 'far')),
    live('tail', drawTail),
    live('legF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'legF')),
    live('body', drawBody),
    live('legN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'legN')),
    live('neck', drawNeck),
    live('head', drawHead),
    live('wingN', (ctx, a, mode) => drawWing(ctx, a, mode, 'near')),
  ];
  const parts = [...seq.map((p) => ({ name: p.name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'line') })), ...seq.map((p) => ({ name: `${p.name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'fill') }))];
  const rig = makeRig({
    w: Math.ceil(bodyLen * 3 + sc(40)),
    h: Math.ceil(H * 1.6 + sc(P.flyH)),
    soft: true,
    stride,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'beak' ? [420, 30] : c === 'head' || c === 'reach' ? [200, 24] : c === 'wingN' || c === 'wingF' ? [190, 22] : [170, 21]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], head: [260, 28] },
    fast: CH.filter((c) => !['head', 'tailUp', 'spread', 'fluff'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.bdActive),
    kick: { pitch: -40, head: 40, fluff: 4 },
    turnKick: { pitch: 14 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      const dt = Math.max(1e-3, a.dt);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.bdOdo ?? odo)) / dt);
      st.bdOdo = odo;
      st.bdV = (st.bdV ?? 0) + (raw - (st.bdV ?? 0)) * Math.min(1, dt * 5);
      const v = st.bdV;
      // (moving fast it takes off and flies; slowing, it lands)
      const flyGoal = a.moving ? clamp((v - walkSpeed * 1.4) / (walkSpeed * 0.6), 0, 1) : 0;
      st.bdFly = (st.bdFly ?? 0) + (flyGoal - (st.bdFly ?? 0)) * Math.min(1, dt * 3);
      st.bdU = ((st.bdU ?? 0) + (v / cycle(0)) * dt * (1 - st.bdFly)) % 1;
      // Standing about: breathing, quick glances (birds look in little jerks, then hold), a tail
      // flick now and then, a fluff and settle; an owl tilts its head this way and that.
      const breath = Math.sin(t * 3);
      const rnd = (n) => {
        const q = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return q - Math.floor(q);
      };
      const per = P.gait === 'hop' ? 1.6 : 2.6;
      const blk = Math.floor(t / per);
      const turn = smoothstep(((t / per) % 1) / 0.1);
      const look = lerp(rnd(blk - 1), rnd(blk), turn) * 2 - 1;
      a.bdTilt = P.head.disc ? lerp(rnd(blk + 40), rnd(blk + 41), smoothstep(((t / per) % 1) / 0.25)) * 36 - 18 : 0;
      const flick = hold(t % 4.3, 1, 1.06, 1.12, 1.3);
      const fluffUp = hold(t % 12, 5, 5.4, 5.9, 6.6);
      const idle = {
        x: 0, lift: breath * 0.12, hop: 0, pitch: -2, crouch: 0, sit: 0, sleep: 0, fluff: fluffUp * 0.7, reach: 0, head: look * 10, beak: 0,
        wingN: fluffUp * 0.15, wingF: fluffUp * 0.15, flap: 0, tailUp: flick * 18, spread: fluffUp * 0.4, talon: 0, hover: 0,
      };
      const walk = { ...idle, fluff: 0, head: look * 4, wingN: P.gait === 'walk' ? 0.12 : 0, wingF: P.gait === 'walk' ? 0.12 : 0, tailUp: 0, spread: 0 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      if (m.pose === 'perch') Object.assign(out, { sit: 1, fluff: 0.5 + breath * 0.05, pitch: 0, head: look * 6, wingN: 0, wingF: 0 });
      else if (m.pose === 'sleep') Object.assign(out, { sit: 1, sleep: 1, fluff: 0.8 + breath * 0.08, pitch: 4, head: 0, wingN: 0, wingF: 0, tailUp: -4 });
      else if (m.pose === 'hover') Object.assign(out, { hover: 1, pitch: -6, spread: 0.9 });
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      if (m.hp <= 0) Object.assign(out, { sit: 1, pitch: 12, head: 20, wingN: 0.4, wingF: 0.4, fluff: 0.4, beak: 0.2 });
      st.bdActive = Boolean(mv);
      a.bdMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.bk = skeleton(S, a);
    },
    parts,
    fx: (ctx, m, a) => {
      drawFx(ctx, m, a);
      DRESS.fx?.(ctx, m, a, KIT);
    },
  });
  const still = () => ({ w: Math.ceil(bodyLen * 3 + sc(40)), h: Math.ceil(H * 1.6 + sc(P.flyH)), res: 3, shapes: [E(bodyLen * 1.5, H * 1.6 + sc(P.flyH) - hb, bodyLen * 0.5, sc(7), C.base), E(bodyLen * 1.5 + sc(7), H * 1.6 + sc(P.flyH) - hb - sc(12), sc(P.head.rx), sc(P.head.r), C.base)] });
  return { rig, still, stride, speed: walkSpeed, H, w: Math.round(bodyLen * 1.5), h: Math.round(H * 1.1), moves: P.moves };
}

// One dressed owl: its art entry (for ARTS), its size and its walking pace.
export function dressedOwl(look) {
  const r = owlRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, speed: r.speed, bodyH: r.H, moves: r.moves };
}
