// The four-legged skeleton the game's animals stand on (render/critters.js: the town's dog and
// cats; render/mounts.js: Puff Bun, Ivy Gecko and Shell Skipper). A leg is two bones from the
// shoulder or hip to the paw, solved so the paw lands where the gait puts it: fore legs fold at
// the wrist (the joint toward the front), hind legs at the hock (toward the back). A gait is
// timed by distance, never a clock: over a paw's stance it slides back exactly as far as the
// ground goes by, so it stays planted while the body travels over it, then it lifts and swings
// forward to land again.

import { E, T, F } from './pixel.js';

export const INK = '#3a2d4f';
export const ss = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// Rotates points about (cx, cy).
export const rot = (pts, cx, cy, a) => {
  if (!a) return pts;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};

// A paw over one stride. `ph` (0-1) is how far through the stride it is; for the first `duty` of it
// the paw is planted and slides back by 2 * reach (the ground covered then: reach is
// stride * duty / 2), then it lifts up to `lift` and swings forward. Returns [dx, up].
export function pawCycle(ph, duty, reach, lift) {
  const u = ((ph % 1) + 1) % 1;
  if (u < duty) return [reach * (1 - (2 * u) / duty), 0];
  const v = (u - duty) / (1 - duty);
  return [-reach + 2 * reach * (0.5 - 0.5 * Math.cos(Math.PI * v)), Math.sin(Math.PI * v) * lift];
}

// Two bones from the root (hx, hy) to the paw (px, py), lengths a then b. `bend` picks which way
// the joint points: +1 toward the front (+x), -1 toward the back, or 'up' (a lizard's sprawl). A
// paw out of reach is pulled in along the line to it.
export function ik(hx, hy, px, py, a, b, bend) {
  let dx = px - hx;
  let dy = py - hy;
  let d = Math.hypot(dx, dy) || 0.001;
  const max = a + b - 0.05;
  if (d > max) {
    dx *= max / d;
    dy *= max / d;
    d = max;
    px = hx + dx;
    py = hy + dy;
  }
  const base = Math.atan2(dy, dx);
  const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const k1 = [hx + Math.cos(base + off) * a, hy + Math.sin(base + off) * a];
  const k2 = [hx + Math.cos(base - off) * a, hy + Math.sin(base - off) * a];
  const knee = bend === 'up' ? (k1[1] < k2[1] ? k1 : k2) : (k1[0] - k2[0]) * bend > 0 ? k1 : k2;
  return { knee, paw: [px, py] };
}

// A bone as a tapered band from p0 (width w0) to p1 (width w1).
export function bone(p0, p1, w0, w1, c) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * 0.5;
  const ny = (dx / L) * 0.5;
  return T([[p0[0] + nx * w0, p0[1] + ny * w0], [p1[0] + nx * w1, p1[1] + ny * w1], [p1[0] - nx * w1, p1[1] - ny * w1], [p0[0] - nx * w0, p0[1] - ny * w0]], c);
}

// A whole leg: the upper bone, the joint, the lower bone and the paw (in `sock` colour), the paw
// set a little ahead of the ankle so it reads as a foot.
export function limb(root, knee, paw, { w0, w1, w2, c, sock = c, pawRx = 1.6, pawRy = 1.1, toe = 0.5 }) {
  return [
    E(root[0], root[1], w0 / 2, w0 / 2, c),
    bone(root, knee, w0, w1, c),
    E(knee[0], knee[1], w1 / 2, w1 / 2, c),
    bone(knee, paw, w1, w2, sock),
    E(paw[0] + toe, paw[1] + 0.1, pawRx, pawRy, sock),
  ];
}

// Every number of `target` followed on a damped spring (state kept on `st`), so ears, tails and
// heads lag, settle and overshoot.
export function follow(st, target, dt, k = 220, damp = 0.65) {
  if (!st.P) {
    st.P = { ...target };
    st.V = {};
    return st.P;
  }
  const c = 2 * Math.sqrt(k) * damp;
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  for (const key of Object.keys(target)) {
    let x = st.P[key] ?? target[key];
    let v = st.V[key] ?? 0;
    for (let i = 0; i < n; i++) {
      v += ((target[key] - x) * k - v * c) * h;
      x += v * h;
    }
    st.P[key] = x;
    st.V[key] = v;
  }
  return st.P;
}

// A shiny round eye (open > 0.6), half shut, or a shut curve.
export const eye = (x, y, open, s = 1) =>
  open > 0.6
    ? [F(E(x, y, 1.1 * s, 1.45 * s, INK)), F(E(x + 0.35 * s, y - 0.55 * s, 0.45 * s, 0.45 * s, '#ffffff'))]
    : open > 0.2
      ? [F(E(x, y + 0.3 * s, 1.1 * s, 0.75 * s, INK))]
      : [F(T([[x - 1.3 * s, y + 0.2], [x + 1.3 * s, y + 0.2], [x + 1.1 * s, y + 0.85], [x - 1.1 * s, y + 0.85]], INK))];

export const blinkAt = (time, seed) => {
  const b = (time * 0.31 + seed * 0.173) % 1;
  return b < 0.012 ? 0.4 : b < 0.028 ? 0 : b < 0.04 ? 0.4 : 1;
};
