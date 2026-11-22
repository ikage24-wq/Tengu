// The kid walk (2026-11-22, the player's pick after five tries: the hero's own approved walk, on a
// kid monster's legs). Any kid-base rig that walks gets its legs from here, so every one steps the
// same well-made way and shows its own character in the body, arms and face instead:
//   - a planted foot lands heel first with the toe up, rolls flat, then onto its toe, the ankle
//     rising as the heel peels, and stays exactly put (it slides back at the walking speed);
//   - a lifting foot kicks up high behind (the lift peaks early in the swing, so the shin folds back
//     from a forward knee, never marching the knee up) and swings through low, reaching heel first;
//   - two bones a leg, hip to knee to ankle, the knee bending forward only; the hips sink just as far
//     as the planted feet need, so the legs never stretch and never come apart (an ankle out of
//     reach for a moment is put where the leg can reach);
//   - a walk's bob as a sharpened triangle (a sine reads floaty), and a lagged copy for the head.
// The stride is eased from the distance actually walked, so starting and stopping never snaps.
//
//   const W = kidWalk(K, { stride: 15, kick: 3, key: 'rh' });
//   pose: W.step(m, a) first; then W.bob(a), W.sink(a), W.headBob(a) for the body.
//   channels it reads: x, lift, tilt, hop (the body); feet (a stance spread), toeF/toeN (extra
//   roll), upF/upN (one foot lifted of its own).
//   parts: ...W.parts() (far leg then near: thigh, shin, foot), drawn from groups thighF, shinF,
//   footF, thighN, shinN, footN; joints hipF/kneeF/ankF and hipN/kneeN/ankN (legs hanging straight
//   down at rest), and 'hip' (the torso's pivot).

import { smooth, clamp } from './rig.js';

const D2R = Math.PI / 180;

export function kidWalk(K, { stride = 15, duty = 0.52, kick = 3, key = 'kw', strike = 16, peel = 30, foot = 1 } = {}) {
  const { rel, pv } = K;
  const LT = (K.J('kneeN')[1] - K.J('hipN')[1]) * K.SC;
  const LS = (K.J('ankN')[1] - K.J('kneeN')[1]) * K.SC;
  const L = LT + LS;
  const reach = (stride * duty) / 2;
  const U = `${key}U`;

  // [x off its rest, lift, roll in degrees (+ the heel up)] for a foot at walk phase u (+ ph).
  function footAt(u, ph) {
    const q = (((u + ph) % 1) + 1) % 1;
    if (q < duty) {
      const s = q / duty;
      const pl = s > 0.7 ? (s - 0.7) / 0.3 : 0;
      return [reach - 2 * reach * s, 0.6 * pl * (kick / 3), s < 0.15 ? -strike * (1 - s / 0.15) : peel * pl];
    }
    const v = (q - duty) / (1 - duty);
    return [-reach + 2 * reach * (0.5 - 0.5 * Math.cos(Math.PI * v)), kick * Math.sin(Math.PI * v ** 0.7), peel * (1 - v) ** 2 - strike * 0.9 * v ** 3];
  }
  const bobAt = (u, lag = 0) => {
    const w = (((2 * u - 0.08 - lag) % 1) + 1) % 1;
    const tri = 1 - Math.abs(w - 0.5) * 2;
    return tri * tri * (3 - 2 * tri) * 0.4 + tri * 0.6;
  };
  const sinkAt = (u) => {
    let s = 0;
    for (const ph of [0, 0.5]) {
      const [dx, lift] = footAt(u, ph);
      if (lift > 0.05) continue;
      s = Math.max(s, L - Math.sqrt(Math.max(0, L * L - dx * dx)));
    }
    return s;
  };
  const socketOf = (S, k) => {
    const [hx, hy] = rel('hip');
    const [ox, oy] = rel(`hip${k}`, 'hip');
    const r = (S.tilt ?? 0) * D2R;
    return [hx + (S.x ?? 0) + ox * Math.cos(r) - oy * Math.sin(r), hy - (S.lift ?? 0) - (S.hop ?? 0) + ox * Math.sin(r) + oy * Math.cos(r)];
  };
  const goalOf = (S, a, k) => {
    const [dx, lift] = footAt(a[U] ?? 0, k === 'F' ? 0.5 : 0);
    const [x, y] = rel(`ank${k}`);
    const w = a.walkW ?? 0;
    // (A planted foot never follows the body's sway; standing, `S.feet` spreads or shifts them.)
    // (`S.upN` / `S.upF` lift one foot of its own: a tapping toe, a step up.)
    return [x + dx * w + (S.x ?? 0) * 0.4 * (1 - w) + (k === 'N' ? (S.feet ?? 0) : -(S.feet ?? 0) * 0.5), y - lift * w - (S.hop ?? 0) - (S[`up${k}`] ?? 0)];
  };
  function legOf(S, a, k) {
    const hip = socketOf(S, k);
    const goal = goalOf(S, a, k);
    const dx = goal[0] - hip[0];
    const dy = goal[1] - hip[1];
    const d0 = Math.hypot(dx, dy) || 1;
    const d = Math.min(L - 0.001, Math.max(0.4, d0));
    const ankle = [hip[0] + (dx / d0) * d, hip[1] + (dy / d0) * d];
    const phi = Math.atan2(dy, dx);
    const ang = Math.acos(clamp((LT * LT + d * d - LS * LS) / (2 * LT * d), -1, 1));
    return { hip, knee: [hip[0] + LT * Math.cos(phi - ang), hip[1] + LT * Math.sin(phi - ang)], ankle };
  }
  const legsOf = (S, a) => {
    const c = a[`${key}Legs`];
    if (c?.S === S) return c;
    return (a[`${key}Legs`] = { S, F: legOf(S, a, 'F'), N: legOf(S, a, 'N') });
  };
  const aim = (p, q) => Math.atan2(-(q[0] - p[0]), q[1] - p[1]);

  return {
    reach,
    footAt,
    // The walk's phase, from the distance walked on an eased speed. Call first in pose().
    step(m, a) {
      const st = (a.mo.rig ??= {});
      const odo = m.odo ?? 0;
      const dt = Math.max(1e-3, a.dt);
      const raw = Math.min(160, Math.abs(odo - (st[`${key}Odo`] ?? odo)) / dt);
      st[`${key}Odo`] = odo;
      st[`${key}V`] = (st[`${key}V`] ?? 0) + (raw - (st[`${key}V`] ?? 0)) * Math.min(1, dt * 5);
      st[U] = ((st[U] ?? 0) + (st[`${key}V`] / stride) * dt) % 1;
      a[U] = st[U];
      return st[U];
    },
    bob: (a, lag = 0) => bobAt(a[U] ?? 0, lag),
    sink: (a) => sinkAt(a[U] ?? 0),
    // (The head's bob: its lag behind the body's, to add to the head's tilt.)
    headBob: (a) => bobAt(a[U] ?? 0) - bobAt(a[U] ?? 0, 0.14),
    legsOf,
    // Where a foot is planted or lifted now (for dust, splashes), in the rig's space.
    ankle: (S, a, k) => legsOf(S, a)[k].ankle,
    planted: (a, k) => footAt(a[U] ?? 0, k === 'F' ? 0.5 : 0)[1] < 0.05,
    // The six leg parts, far leg first: thigh (socket to knee), shin (knee to ankle), foot.
    parts(opts = {}) {
      const roll = opts.roll ?? foot;
      return ['F', 'N'].flatMap((k) => [
        { name: `thigh${k}`, parent: null, s: (a, S, b) => K.piece(`thigh${k}`, null, b), pivot: pv(`hip${k}`), at: (S, a) => legsOf(S, a)[k].hip, rot: (S, a) => aim(legsOf(S, a)[k].hip, legsOf(S, a)[k].knee) },
        { name: `shin${k}`, parent: null, s: (a, S, b) => K.piece(`shin${k}`, null, b), pivot: pv(`knee${k}`), at: (S, a) => legsOf(S, a)[k].knee, rot: (S, a) => aim(legsOf(S, a)[k].knee, legsOf(S, a)[k].ankle) },
        { name: `foot${k}`, parent: null, s: (a, S, b) => K.piece(`foot${k}`, null, b), pivot: pv(`ank${k}`), at: (S, a) => legsOf(S, a)[k].ankle, rot: (S, a) => (footAt(a[U] ?? 0, k === 'F' ? 0.5 : 0)[2] * (a.walkW ?? 0) * roll + (S[`toe${k}`] ?? 0)) * D2R },
      ]);
    },
  };
}

// The springs a walk needs (a walk's beats come quicker than a soft idle spring can follow): pass
// as makeRig's `walkStiff`, with extra channels of the rig's own.
export const WALK_STIFF = { x: [500, 44], lift: [1400, 75], tilt: [400, 38], head: [260, 28], shN: [320, 32], shF: [320, 32], elN: [200, 22], elF: [200, 22] };
