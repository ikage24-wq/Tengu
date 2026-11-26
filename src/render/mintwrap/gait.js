// The Mint Wrapper's own copy of the blank bases' legs (render/mobs/blankgait.js, 2026-11-26), the
// base left clean. One change: the leg reaching for a foot nearly out of reach eases toward straight
// instead of locking straight in one frame. Quick on short legs, with the walk's bob lifting the hips,
// their feet were out of reach for almost half of every step, and each lock and unlock snapped the
// sock and the sneaker round (tools/jitter-probe.mjs).
//
// (base) The blank bases' legs (2026-11-22): the kid walk (kidwalk.js, the hero's approved walk) grown into
// a gait for a whole move set. On top of the walk:
//   - a run: as the speed rises past a brisk walk the gait eases into a run, the stride longer, each
//     foot on the ground for less of the step (both feet off the ground between steps), the lifting
//     foot kicking up higher behind, the heel striking and the toe peeling harder;
//   - each foot of its own: `fxN`/`fyN` and `fxF`/`fyF` (game px) move the near or far foot ahead
//     or up from where the walk puts it, for kicks, lunges, stances and a tucked jump, the other
//     foot staying planted; `toeN`/`toeF` point a foot;
//   - `hop` lifts the whole body, feet and all (a jump, a flying pose);
//   - the hip sockets turn with the pelvis (`lean`), so a sway of the hips carries the legs.
// Two bones a leg, hip to knee to ankle, the knee bending forward only; a foot out of reach is put
// where the leg can reach, so the leg straightens toward it (a kick) and never comes apart.
//
//   const W = blankGait(K, { stride, kick, key, walkSpeed });
//   pose: W.step(m, a) first (it sets a[`${key}U`], the phase, and a[`${key}R`], how much it runs);
//   then W.bob(a), W.sink(a), W.headBob(a) for the body. parts: ...W.parts().

import { clamp } from '../mobs/rig.js';

const D2R = Math.PI / 180;

export function blankGait(K, { stride = 15, kick = 3, key = 'bg', walkSpeed = 20, run = 1.75, lean = null } = {}) {
  const { rel, pv } = K;
  const LT = (K.J('kneeN')[1] - K.J('hipN')[1]) * K.SC;
  const LS = (K.J('ankN')[1] - K.J('kneeN')[1]) * K.SC;
  const L = LT + LS;
  const U = `${key}U`;
  const R = `${key}R`;
  // (`${key}K`: how much longer its steps are than `stride`, for a quick monster on short legs)
  const SK = `${key}K`;
  // The gait at run weight `r`, steps `k` times its stride.
  const par = (r, k = 1) => {
    const duty = 0.52 - 0.17 * r;
    const st = stride * k * (1 + (run - 1) * r);
    return { duty, reach: (st * duty) / 2, kk: kick * (1 + 1.3 * r), strike: 16 + 8 * r, peel: 30 + 22 * r, st };
  };
  // [x off its rest, lift, roll in degrees (+ the heel up)] for a foot at phase u (+ ph).
  function footAt(u, ph, r = 0, k = 1) {
    const { duty, reach, kk, strike, peel } = par(r, k);
    const q = (((u + ph) % 1) + 1) % 1;
    if (q < duty) {
      const s = q / duty;
      const pl = s > 0.7 ? (s - 0.7) / 0.3 : 0;
      return [reach - 2 * reach * s, 0.6 * pl * (kk / 3), s < 0.15 ? -strike * (1 - s / 0.15) : peel * pl];
    }
    const v = (q - duty) / (1 - duty);
    // (Running, the lifting foot folds up high behind early in its swing, then reaches ahead.)
    const lift = kk * Math.sin(Math.PI * v ** (0.7 - 0.2 * r));
    return [-reach + 2 * reach * (0.5 - 0.5 * Math.cos(Math.PI * v)), lift, peel * (1 - v) ** 2 - strike * 0.9 * v ** 3];
  }
  const bobWalk = (u, lag = 0) => {
    const w = (((2 * u - 0.08 - lag) % 1) + 1) % 1;
    const tri = 1 - Math.abs(w - 0.5) * 2;
    return tri * tri * (3 - 2 * tri) * 0.4 + tri * 0.6;
  };
  // (Running: lowest as a foot takes the weight, highest in the air between steps.)
  const bobRun = (u, lag = 0) => 0.5 - 0.5 * Math.cos(Math.PI * 4 * (u - 0.18 - lag / 2) + Math.PI);
  const bobAt = (u, r, lag = 0) => bobWalk(u, lag) * (1 - r) + bobRun(u, lag) * r;
  const sinkAt = (u, r, k = 1) => {
    let s = 0;
    for (const ph of [0, 0.5]) {
      const [dx, lift] = footAt(u, ph, r, k);
      if (lift > 0.05) continue;
      s = Math.max(s, L - Math.sqrt(Math.max(0, L * L - dx * dx)));
    }
    return s;
  };
  const socketOf = (S, k) => {
    const [hx, hy] = rel('hip');
    const [ox, oy] = rel(`hip${k}`, 'hip');
    // (The hip sockets turn with the pelvis: `lean(S)`, its angle, or the body's tilt.)
    const r = (lean ? lean(S) : (S.tilt ?? 0)) * D2R;
    return [hx + (S.x ?? 0) + ox * Math.cos(r) - oy * Math.sin(r), hy - (S.lift ?? 0) - (S.hop ?? 0) + ox * Math.sin(r) + oy * Math.cos(r)];
  };
  const goalOf = (S, a, k) => {
    const [dx, lift] = footAt(a[U] ?? 0, k === 'F' ? 0.5 : 0, a[R] ?? 0, a[SK] ?? 1);
    const [x, y] = rel(`ank${k}`);
    const w = a.walkW ?? 0;
    // (A planted foot never follows the body's sway; `fx`/`fy` move one foot of its own.)
    return [x + dx * w + (S.x ?? 0) * 0.4 * (1 - w) + (S[`fx${k}`] ?? 0), y - lift * w - (S.hop ?? 0) - (S[`fy${k}`] ?? 0)];
  };
  function legOf(S, a, k) {
    const hip = socketOf(S, k);
    const goal = goalOf(S, a, k);
    const dx = goal[0] - hip[0];
    const dy = goal[1] - hip[1];
    const d0 = Math.hypot(dx, dy) || 1;
    // (the last stretch of its reach eased: past 90% the leg straightens ever more slowly, the
    // foot a hair short of a goal out of reach rather than the knee snapping straight)
    const s0 = L * 0.9;
    const d = Math.max(0.4, d0 <= s0 ? d0 : s0 + (L - 0.001 - s0) * (1 - Math.exp(-(d0 - s0) / (L - s0))));
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
    L,
    footAt,
    // The phase, from the distance walked on an eased speed, and how much it runs. Call first.
    step(m, a) {
      const st = (a.mo.rig ??= {});
      // (a rig drawn bigger or smaller than its own units, `a.gaitScale`: the ground it walks is
      // measured in its units, or its planted feet would slide)
      const odo = (m.odo ?? 0) / (a.gaitScale ?? 1);
      const dt = Math.max(1e-3, a.dt);
      const raw = Math.min(400, Math.abs(odo - (st[`${key}Odo`] ?? odo)) / dt);
      st[`${key}Odo`] = odo;
      st[`${key}V`] = (st[`${key}V`] ?? 0) + (raw - (st[`${key}V`] ?? 0)) * Math.min(1, dt * 5);
      const v = st[`${key}V`];
      // (2026-11-25: at its own roaming pace a monster always walks; it runs only faster, chasing.
      // A quick one on short legs takes longer steps, up to half again, rather than a blur of them.)
      const roam = (m.def?.speed ?? 0) / (a.gaitScale ?? 1);
      const ws = Math.max(walkSpeed, roam / 1.15);
      const k = clamp(roam / (stride * 2.6), 1, 1.5);
      // (Past a brisk walk it runs; a moment to ease into it and out.)
      const goal = a.moving ? clamp((v - ws * 1.2) / (ws * 0.55), 0, 1) : 0;
      st[R] = (st[R] ?? 0) + (goal - (st[R] ?? 0)) * Math.min(1, dt * 4);
      st[U] = ((st[U] ?? 0) + (v / par(st[R], k).st) * dt) % 1;
      a[U] = st[U];
      a[R] = st[R];
      a[SK] = k;
      // (what the gait is doing, for the checks: how much it runs, at what speed, its steps a second)
      a.gait = { run: st[R], v, walkSpeed: ws, k, cadence: v / par(st[R], k).st };
      return st[U];
    },
    bob: (a, lag = 0) => bobAt(a[U] ?? 0, a[R] ?? 0, lag),
    sink: (a) => sinkAt(a[U] ?? 0, a[R] ?? 0, a[SK] ?? 1),
    headBob: (a) => bobAt(a[U] ?? 0, a[R] ?? 0) - bobAt(a[U] ?? 0, a[R] ?? 0, 0.14),
    legsOf,
    ankle: (S, a, k) => legsOf(S, a)[k].ankle,
    planted: (a, k) => footAt(a[U] ?? 0, k === 'F' ? 0.5 : 0, a[R] ?? 0, a[SK] ?? 1)[1] < 0.05,
    parts() {
      return ['F', 'N'].flatMap((k) => [
        { name: `thigh${k}`, parent: null, s: (a, S, b) => K.piece(`thigh${k}`, null, b), pivot: pv(`hip${k}`), at: (S, a) => legsOf(S, a)[k].hip, rot: (S, a) => aim(legsOf(S, a)[k].hip, legsOf(S, a)[k].knee) },
        { name: `shin${k}`, parent: null, s: (a, S, b) => K.piece(`shin${k}`, null, b), pivot: pv(`knee${k}`), at: (S, a) => legsOf(S, a)[k].knee, rot: (S, a) => aim(legsOf(S, a)[k].knee, legsOf(S, a)[k].ankle) },
        { name: `foot${k}`, parent: null, s: (a, S, b) => K.piece(`foot${k}`, null, b), pivot: pv(`ank${k}`), at: (S, a) => legsOf(S, a)[k].ankle, rot: (S, a) => (footAt(a[U] ?? 0, k === 'F' ? 0.5 : 0, a[R] ?? 0, a[SK] ?? 1)[2] * (a.walkW ?? 0) + (S[`toe${k}`] ?? 0)) * D2R },
      ]);
    },
  };
}
