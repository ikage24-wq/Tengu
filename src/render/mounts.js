// Draws the mounts (data/mounts.js) with their riders. Each mount is its own creature on its own
// little rig, built for the one way it moves (docs/design/mounts.md):
//   bun      Puff Bun, a marshmallow bunny: bounds in springy hops, ears streaming, a soft landing
//   crane    Paper Crane, folded washi: skims low on beating wings, glides with them spread flat
//   nimbus   Nimbus, a sleepy cloud: floats, its puffs breathing; thins as a hover runs out
//   kettle   Kettle Racer, a copper teakettle on wheels with a tanuki's ears and tail: rolls fast,
//            lid rattling, steam whistling out of the spout on a dash
//   turtle   Shell Skipper, a sea turtle: plods on land with rowing flippers, skims over water
//   gecko    Ivy Gecko, a leafy gecko: scurries on diagonal leg pairs, runs straight up ropes
// Every number of a mount's pose is carried to the next on a spring (`follow`), so parts lag, settle
// and overshoot; the rider's bob copies the mount's a moment later and smaller (research
// home-mounts.md). Mount and rider are never squashed or stretched: bounces show in pose and
// height, turns are mirror flips. Each mount is drawn facing right in a 64x48 box whose ground line
// is y 46, then flipped.

import { sprite, blit, R, E, T, F } from './pixel.js';
import { drawPosed } from './hero.js';
import { ik, limb, pawCycle, bone } from './quadruped.js';
import { MOUNTS } from '../data/mounts.js';

const TAU = Math.PI * 2;
export const MW = 64;
export const MH = 48;
const GROUND = 46;
const ss = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const seg = (t, a, b) => ss((t - a) / (b - a));
const q = (v, n = 4) => Math.round(v * n) / n;
// Rotates points about (cx, cy).
const rot = (pts, cx, cy, a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
const at = (cx, cy, a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
const INK = '#3a2d4f';
// Grows a list of shapes about (cx, cy) by s (a bigger build of the same drawing, never a stretch).
const grow = (list, cx, cy, s) => list.map((sh) => sh.t === 'p' ? { ...sh, pts: sh.pts.map(([x, y]) => [cx + (x - cx) * s, cy + (y - cy) * s]) } : sh.t === 'e' ? { ...sh, x: cx + (sh.x - cx) * s, y: cy + (sh.y - cy) * s, rx: sh.rx * s, ry: sh.ry * s } : sh);
const eye = (x, y, open, s = 1) =>
  open > 0.6
    ? [F(E(x, y, 1.1 * s, 1.45 * s, INK)), F(E(x + 0.35 * s, y - 0.55 * s, 0.45 * s, 0.45 * s, '#ffffff'))]
    : open > 0.2
      ? [F(E(x, y + 0.3 * s, 1.1 * s, 0.75 * s, INK))]
      : [F(T([[x - 1.3 * s, y + 0.2], [x + 1.3 * s, y + 0.2], [x + 1.1 * s, y + 0.85], [x - 1.1 * s, y + 0.85]], INK))];
const blinkAt = (time, seed) => {
  const b = (time * 0.31 + seed * 0.173) % 1;
  return b < 0.012 ? 0.4 : b < 0.028 ? 0 : b < 0.04 ? 0.4 : 1;
};

// ---------- Springs: every number of a pose follows its target ----------
function follow(st, target, dt, k = 260, damp = 0.72) {
  if (!st.P) {
    st.P = { ...target };
    st.V = {};
    return st.P;
  }
  const c = 2 * Math.sqrt(k) * damp;
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  const P = { ...target };
  for (const key of Object.keys(target)) {
    const to = target[key];
    let x = st.P[key];
    if (typeof to !== 'number' || typeof x !== 'number') continue;
    // (A gait's numbers, `g_`, come straight from the ground covered: on a spring, a planted paw
    // would lag behind the ground and skate.)
    if (key.startsWith('g_')) continue;
    let v = st.V[key] ?? 0;
    const kk = key.endsWith('Lag') ? k * 0.45 : k;
    const cc = key.endsWith('Lag') ? 2 * Math.sqrt(kk) * 0.55 : c;
    for (let i = 0; i < n; i++) {
      v += ((to - x) * kk - v * cc) * h;
      x += v * h;
    }
    P[key] = x;
    st.V[key] = v;
  }
  st.P = P;
  return P;
}

// ---------- The six mounts ----------
// Each: pose(m, t) → target numbers; shapes(P, time) → { back, front } lists; seat(P) → where the
// rider sits [x, y] in the box, with the rider's pose and lean.
const BODIES = {};

// Puff Bun: a marshmallow bunny. It goes in real rabbit bounds, timed by the ground covered (one
// bound every HOP px): the long hind feet push off (heels lifting, toes last to leave), it sails
// with the hind feet trailing and the forepaws tucked, reaches down and lands on the forepaws,
// nose dipping, then the hind feet swing in ahead of them and it pushes off again. Every paw on
// the ground stays where it landed while the bunny goes over it. Ears trail on their own spring.
const HOP = 34;
// The parts of a bound (fractions of it): airborne, forepaws down, hind feet down.
const BUN_AIR = [0.12, 0.72];
const BUN_FORE = [0.7, 0.95];
const BUN_HIND = [0.86, 1.14];
const inSpan = (ph, [a, b]) => (ph - a + 2) % 1 < b - a;
const spanU = (ph, [a, b]) => ((ph - a + 2) % 1) / (b - a);
BODIES.bun = {
  stride: HOP,
  colors: { base: '#fff6f9', sh: '#f6dbe8', sh2: '#e2bcd6', ear: '#ffb3cf', cheek: '#ffc2d8', nose: '#e8799f' },
  pose(m, t) {
    const run = m.speed > 0.15 && !m.air ? 1 : 0;
    if (m.air) {
      const up = m.vy < 0;
      return { g_ph: 0, g_hop: 0, g_run: 0, g_air: up ? 1 : 2, crouch: 0, earA: up ? 0.95 : -0.15, earLag: up ? 0.6 : -0.35, pitch: up ? -0.12 : 0.1, nose: 0, eyes: 1, joy: 1 };
    }
    const land = Math.max(0, 1 - (t - m.landAt) / 0.22);
    const ph = ((m.ph % 1) + 1) % 1;
    if (run) {
      const flying = inSpan(ph, BUN_AIR);
      const up = flying ? Math.sin(Math.PI * spanU(ph, BUN_AIR)) : 0;
      // Nose up as the hind feet push, nose down coming in to land.
      const pitch = inSpan(ph, [0.95, 1.12]) ? -0.1 : ph > 0.45 && ph < 0.86 ? 0.09 : 0;
      const crouch = inSpan(ph, [0.74, 0.98]) ? 1.6 * Math.sin(Math.PI * spanU(ph, [0.74, 0.98])) : 0;
      return { g_ph: ph, g_hop: up * 8.5, g_run: 1, g_air: 0, crouch, earA: 0.75 - up * 0.45, earLag: -up * 0.5, pitch, nose: 0, eyes: 1, joy: up };
    }
    const twitch = Math.max(0, Math.sin(t * 9)) * (Math.sin(t * 0.7) > 0.6 ? 1 : 0);
    const flick = Math.sin(t * 0.43) > 0.93 ? Math.sin(t * 22) * 0.15 : 0;
    return { g_ph: 0, g_hop: 0, g_run: 0, g_air: 0, crouch: land * 2.6 + Math.sin(t * 1.6) * 0.35, earA: 0.25 + land * -0.4 + Math.sin(t * 1.6 - 0.6) * 0.06 + flick, earLag: 0, pitch: 0, nose: twitch, eyes: blinkAt(t, 3), joy: land * 0.6 };
  },
  // Where the hind toe and forepaw are (x from the body's middle, lift off the ground) and the
  // hind foot's tilt, at a point in the bound.
  feet(P) {
    const ph = P.g_ph;
    if (P.g_air) return P.g_air === 1 ? { hx: -14, hl: 3, ha: 0.9, fx: 15, fl: 4 } : { hx: -6, hl: 1.5, ha: 0.1, fx: 15, fl: 1 };
    if (!P.g_run) return { hx: -7, hl: 0, ha: 0, fx: 12, fl: 0 };
    const hr = (HOP * (BUN_HIND[1] - BUN_HIND[0])) / 2;
    const fr = (HOP * (BUN_FORE[1] - BUN_FORE[0])) / 2;
    let h;
    if (inSpan(ph, BUN_HIND)) {
      // Planted: the toe stays put as the bunny goes over it; the heel lifts for the push.
      const u = spanU(ph, BUN_HIND);
      h = { hx: -7 + hr * (1 - 2 * u), hl: 0, ha: u > 0.45 ? 0.9 * ss((u - 0.45) / 0.55) : 0 };
    } else {
      // Flying: trailing out behind, then swung in under the body ahead of the forepaws.
      const u = spanU(ph, [BUN_HIND[1] - 1, BUN_HIND[0]]);
      const trail = -7 - hr - 7 * Math.sin(Math.PI * Math.min(1, u / 0.6));
      h = { hx: u < 0.6 ? trail : -7 - hr + 2 * hr * ss((u - 0.6) / 0.4), hl: 2 * Math.sin(Math.PI * u), ha: 0.9 * (1 - ss(u / 0.7)) + 0.3 * Math.sin(Math.PI * u) };
    }
    let f;
    if (inSpan(ph, BUN_FORE)) {
      const u = spanU(ph, BUN_FORE);
      f = { fx: 12 + fr * (1 - 2 * u), fl: 0 };
    } else {
      // Tucked up under the chest in the air, then reaching forward and down to land.
      const u = spanU(ph, [BUN_FORE[1] - 1, BUN_FORE[0]]);
      f = { fx: 12 - fr + (2 * fr + 3) * ss(u) - 3 * ss((u - 0.8) / 0.2), fl: 3.4 * Math.sin(Math.PI * u) };
    }
    return { ...h, ...f };
  },
  shapes(P) {
    const c = this.colors;
    const by = P.crouch;
    const ear = (x, len, a, tone, inner) => {
      const base = [[x - 2.6, 17 + by], [x + 2.6, 17 + by], [x + 3.1, 17 + by - len * 0.55], [x + 1.2, 17 + by - len], [x - 2.4, 17 + by - len * 0.62]];
      const pts = rot(base, x, 17 + by, -a);
      const ip = rot([[x - 1.2, 16 + by], [x + 1.4, 16 + by], [x + 1.7, 17 + by - len * 0.52], [x + 0.6, 17 + by - len * 0.85], [x - 1.1, 17 + by - len * 0.58]], x, 17 + by, -a);
      return [T(pts, tone), F(T(ip, inner))];
    };
    // The ears stand at the front of the head and the rider sits back on the shoulders, so however
    // far they stream the tips stay ahead of the rider's face; a soft limit keeps a full trail just
    // above the bunny's back rather than across the rider.
    const raw = 0.55 + P.earA * 0.7 + P.earLag * 0.6;
    const eA = 1.1 * Math.tanh(raw / 1.1);
    const bx = 30;
    const ft = this.feet(P);
    const gy = GROUND - 1.2;
    // A hind leg: the thigh down from the haunch to the heel, and the long foot out to the toe at
    // (tx, ty), its heel lifting as it tilts up by `a`.
    const hindFoot = (tx, ty, a, tone, sole, hip) => {
      const hx = tx - Math.cos(a) * 7.6;
      const hy = ty - Math.sin(a) * 7.6;
      const { knee } = ik(hip[0], hip[1], hx, hy - 0.6, 4.2, 4.6, -1);
      const nx = Math.sin(a);
      const ny = -Math.cos(a);
      return [
        E(hip[0], hip[1], 4.6, 4.6, tone),
        bone(hip, knee, 9.4, 6.6, tone),
        E(knee[0], knee[1], 3.3, 3.3, tone),
        bone(knee, [hx, hy - 0.6], 6.4, 4.4, tone),
        T([[hx + nx * 2.4, hy + ny * 2.4], [tx + nx * 1.9, ty + ny * 1.9], [tx + 1.4, ty - 0.4], [tx + 0.8, ty + 0.9], [hx - nx * 1.2, hy - ny * 1.2], [hx - 2.4, hy - 0.6]], tone),
        E(tx + 0.4, ty - 0.4, 2.6, 1.8, tone),
        F(T([[hx - nx * 0.5, hy - ny * 0.5], [tx - 0.2, ty + 0.6], [tx + 1.2, ty + 0.3], [tx, ty - 0.2]], sole)),
      ];
    };
    // A forepaw on its short leg down from the chest.
    const fore = (rootX, px, lift, tone, sock) => {
      const root = [rootX, 35 + by];
      const { knee, paw } = ik(root[0], root[1], px, gy - lift, 4, 4.8, 1);
      return limb(root, knee, paw, { w0: 5, w1: 3.4, w2: 3.2, c: tone, sock, pawRx: 2.4, pawRy: 1.5, toe: 0.6 });
    };
    const back = [
      ...ear(43, 14.5, eA + 0.14, c.sh, c.sh2),
      // the far hind foot and forepaw, a touch behind the near ones
      ...hindFoot(bx + ft.hx + 1.6, gy - ft.hl - 0.6, ft.ha, c.sh, c.sh2, [bx - 8.4, 32.6 + by]),
      ...fore(bx + 11.4, bx + ft.fx + 1.6, ft.fl + 0.4, c.sh, c.sh),
    ];
    const body = rot([[bx - 19, 30 + by], [bx - 15, 19 + by], [bx - 4, 13.5 + by], [bx + 9, 14 + by], [bx + 16, 19 + by], [bx + 18, 27 + by], [bx + 14, 37 + by], [bx, 40 + by], [bx - 14, 39 + by]], bx, 30 + by, P.pitch);
    const nose = P.nose > 0.5 ? 0.25 : 0;
    const front = [
      T(body, c.base),
      F(T(rot([[bx - 18, 33 + by], [bx + 15, 33 + by], [bx + 12, 38 + by], [bx, 40 + by], [bx - 13, 39 + by]], bx, 30 + by, P.pitch), c.sh)),
      F(E(bx + 1, 18 + by, 9, 2.8, '#ffffff')),
      // the cotton tail
      E(bx - 19, 26 + by, 3.4, 3.4, '#ffffff'), F(E(bx - 19.5, 27.5 + by, 2.2, 1.4, c.sh)),
      // the near haunch, its long foot, and the near forepaw
      ...hindFoot(bx + ft.hx, gy - ft.hl, ft.ha, c.base, c.sh, [bx - 10, 33 + by]),
      E(bx - 10.6, 31.6 + by, 6, 5.4, c.base), F(E(bx - 11, 34.6 + by, 4.6, 1.8, c.sh)),
      ...fore(bx + 10, bx + ft.fx, ft.fl, c.base, '#ffffff'),
      // face, at the front
      ...eye(bx + 12.4, 23 + by, P.eyes),
      F(E(bx + 15.4, 27 + by, 2, 0.9, c.cheek)), F(E(bx + 8.6, 27 + by, 1.6, 0.8, c.cheek)),
      F(T([[bx + 16.6, 25.6 + by - nose], [bx + 17.8, 25.6 + by - nose], [bx + 17.2, 26.4 + by - nose]], c.nose)),
      ...(P.joy > 0.4 ? [F(E(bx + 15.6, 28.6 + by, 0.9, 0.7, '#c2507a'))] : []),
      ...ear(46, 16, eA, c.base, c.ear),
    ];
    return { back, front };
  },
  seat: (P) => ({ x: 23, y: 15.5 + P.crouch, lean: P.pitch * 0.6 - P.g_hop * 0.004 }),
  lift: (P) => P.g_hop,
};

// Paper Crane: folded washi. It floats a hand's breadth off the ground and beats its wings to
// move; held jump in the air spreads them flat into a glide that rocks gently.
BODIES.crane = {
  colors: { paper: '#ffd1e1', fold: '#f2a9c4', deep: '#d986aa', light: '#fff3f8', dot: '#ffffff', print: '#ff8fb0' },
  pose(m, t) {
    if (m.special === 'glide') return { wing: 0.12 + Math.sin(t * 2.4) * 0.05, wingLag: 0, neck: 0.12, tail: 0.15, pitch: 0.08 + Math.sin(t * 1.3) * 0.04, float: 8, eyes: 1 };
    if (m.air) {
      const beat = Math.sin(t * 15);
      return { wing: 0.35 + beat * 0.65, wingLag: beat * 0.3, neck: m.vy < 0 ? -0.15 : 0.05, tail: m.vy < 0 ? 0.3 : -0.1, pitch: m.vy < 0 ? -0.15 : 0.05, float: 8, eyes: 1 };
    }
    if (m.speed > 0.15) {
      const beat = Math.sin(t * 10.5);
      return { wing: 0.3 + beat * 0.55, wingLag: beat * 0.25, neck: 0.1 + Math.sin(t * 5.25) * 0.05, tail: 0.05, pitch: 0.06, float: 7 + beat * 1.2, eyes: 1 };
    }
    const preen = Math.sin(t * 0.5) > 0.85 ? Math.sin(t * 8) * 0.12 : 0;
    return { wing: -0.15 + Math.sin(t * 1.4) * 0.05, wingLag: 0, neck: -0.05 + Math.sin(t * 1.4 - 0.5) * 0.06 + preen, tail: Math.sin(t * 1.1) * 0.06, pitch: 0, float: 5 + Math.sin(t * 1.4) * 1, eyes: blinkAt(t, 7) };
  },
  shapes(P) {
    const c = this.colors;
    const y0 = -P.float + 6;
    const cx = 30;
    const cy = 32 + y0;
    const R0 = (pts) => rot(pts, cx, cy, P.pitch);
    const wingPts = (spread, near) => {
      const a = -0.35 - spread * 1.25;
      const root = near ? [[cx - 8, cy - 3], [cx + 6, cy - 2.4]] : [[cx - 6, cy - 4], [cx + 5, cy - 3.4]];
      const len = near ? 22 : 18;
      const tipA = at(root[0][0] + 2, root[0][1], Math.PI + a, len);
      const midA = at(root[1][0] - 2, root[1][1], Math.PI + a + 0.45, len * 0.7);
      return R0([root[0], root[1], midA, tipA]);
    };
    const neckA = -1.05 + P.neck;
    const n0 = [cx + 9, cy - 2];
    const head = at(n0[0], n0[1], neckA, 17);
    const back = [T(wingPts(P.wing + P.wingLag * 0.6, false), c.deep), F(T(wingPts(P.wing + P.wingLag * 0.6, false).slice(0, 3), c.fold))];
    const tailTip = at(cx - 12, cy, Math.PI + 0.45 + P.tail, 13);
    const front = [
      // tail fold
      T(R0([[cx - 9, cy - 1], [cx - 12, cy + 3], tailTip]), c.fold), F(T(R0([[cx - 10, cy], tailTip, [cx - 11, cy + 2]]), c.deep)),
      // body: a folded diamond, its belly in shadow
      T(R0([[cx - 12, cy], [cx - 2, cy - 6], [cx + 11, cy - 3], [cx + 6, cy + 6], [cx - 6, cy + 5]]), c.paper),
      F(T(R0([[cx - 6, cy + 5], [cx + 6, cy + 6], [cx + 1, cy + 1]]), c.fold)),
      F(E(cx - 3, cy + 1.6, 0.8, 0.8, c.dot)), F(E(cx + 2, cy + 2.4, 0.6, 0.6, c.dot)), F(E(cx - 6.6, cy + 1.2, 0.55, 0.55, c.dot)),
      // neck and head: a long fold up to a crisp beak
      T(R0([[n0[0] - 2.5, n0[1] + 1], [n0[0] + 2.2, n0[1] + 0.8], [head[0] + 1.3, head[1] + 1], [head[0] - 0.8, head[1] - 0.4]]), c.paper),
      F(T(R0([[n0[0] + 2.2, n0[1] + 0.8], [head[0] + 1.3, head[1] + 1], [n0[0] + 0.4, n0[1]]]), c.light)),
      T(R0([[head[0] - 0.8, head[1] - 0.4], [head[0] + 6, head[1] + 0.6], [head[0] + 1.3, head[1] + 1.6]]), c.fold),
      ...R0([[head[0] + 0.6, head[1] + 0.1]]).flatMap(([x, y]) => eye(x, y, P.eyes, 0.55)),
      // a printed sakura on the near wing, then the near wing
      T(wingPts(P.wing, true), c.paper),
      F(T(wingPts(P.wing, true).slice(0, 3), c.light)),
      ...(() => {
        const w = wingPts(P.wing, true);
        const mx = (w[0][0] + w[1][0] + w[2][0] + w[3][0]) / 4;
        const my = (w[0][1] + w[1][1] + w[2][1] + w[3][1]) / 4;
        return [0, 1, 2, 3, 4].map((i) => F(E(...at(mx, my, (i / 5) * TAU, 1.2), 0.8, 0.8, c.print))).concat([F(E(mx, my, 0.6, 0.6, '#ffe36b'))]);
      })(),
    ];
    const k = 1.4;
    return { back: grow(back, cx, cy + 8, k), front: grow(front, cx, cy + 8, k) };
  },
  seat: (P) => ({ x: 27, y: 27 - P.float + 4, lean: P.pitch * 0.5 }),
  lift: () => 0,
};

// Nimbus: a cloud of puffs that breathe out of step; a sleepy face that wakes when it moves. A hover
// thins it (its puffs shrink and part) as the hover runs out.
BODIES.nimbus = {
  colors: { base: '#ffffff', sh: '#dfe6fb', sh2: '#c4c8ef', warm: '#fff4c9', cheek: '#ffd2e3' },
  pose(m, t) {
    const moving = m.speed > 0.15 || m.air;
    return { ...Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((i) => [`b${i}`, Math.sin(t * 2.6 + i * 1.7) * 0.6])), bob: Math.sin(t * 1.7) * 1.6 + (m.air ? -1 : 0), thin: m.special === 'hover' ? 1 - (m.hoverLeft ?? 1) : 0, lean: moving ? 0.08 : 0, eyes: moving ? blinkAt(t, 5) : 0.3, awake: moving ? 1 : 0 };
  },
  shapes(P, time) {
    const c = this.colors;
    const y = 30 + P.bob;
    const k = 1 - P.thin * 0.35;
    const puffs = [[-15, 3, 7], [15, 3, 7], [-8, -3, 8], [7, -4, 8.5], [0, 1, 11], [-19, 0, 4.5], [19, -1, 5]];
    const parts = puffs.map(([dx, dy, r], i) => {
      const b = P[`b${i}`];
      const gap = P.thin * (dx > 0 ? 2 : -2) * (Math.abs(dx) / 19);
      return [32 + dx + gap, y + dy, (r + b) * k];
    });
    const back = parts.map(([x, py, r]) => E(x, py + 3, r, r * 0.8, c.sh));
    const front = [
      ...parts.map(([x, py, r]) => E(x, py, r, r * 0.86, c.base)),
      F(E(32, y + 7.5, 16 * k, 3, c.sh)),
      F(E(28, y - 6, 4, 1.6, c.warm)),
      F(E(38, y - 7.5, 3, 1.2, '#ffffff')),
      // the face, low on the front puff
      ...(P.awake > 0.5 ? [...eye(42, y + 1.5, P.eyes, 0.85), ...eye(47.5, y + 1.5, P.eyes, 0.85)] : [F(T([[40.6, y + 1.4], [43.4, y + 1.4], [43, y + 2.2], [41, y + 2.2]], INK)), F(T([[46.2, y + 1.4], [49, y + 1.4], [48.6, y + 2.2], [46.6, y + 2.2]], INK))]),
      F(E(44.8, y + 4.4, 0.9, 0.55, '#e8799f')),
      F(E(39.6, y + 4, 1.6, 0.7, c.cheek)), F(E(50, y + 4, 1.4, 0.7, c.cheek)),
    ];
    return { back, front };
  },
  seat: (P) => ({ x: 30, y: 24 + P.bob, lean: P.lean }),
  lift: () => 0,
};

// Kettle Racer: a copper teakettle on two wheels, a tanuki's ears out from under the lid and its
// striped tail behind. The wheels really turn; the lid rattles with speed; a dash whistles steam.
BODIES.kettle = {
  colors: { cu: '#f4a98a', cuSh: '#d9806e', cuSh2: '#b8606a', cuLt: '#ffd2bc', lid: '#ffcf8a', wheel: '#7a5a8a', hub: '#ffe36b', fur: '#b98a62', furLt: '#e8c8a0', furDk: '#7a5a4a' },
  pose(m, t) {
    const sp = m.air ? 0.4 : m.speed;
    return { roll: t * (2 + sp * 14), rattle: sp > 0.3 ? Math.abs(Math.sin(t * 24)) * sp : Math.max(0, Math.sin(t * 0.8) > 0.95 ? Math.abs(Math.sin(t * 30)) : 0), lean: m.special === 'dash' ? 0.12 : sp * 0.06, bounce: sp > 0.2 && !m.air ? Math.abs(Math.sin(t * 13)) * 0.9 : 0, tail: Math.sin(t * (sp > 0.2 ? 9 : 1.8)) * (0.25 + sp * 0.3), tailLag: sp * 0.6, steam: m.special === 'dash' ? 1 : 0, ears: Math.sin(t * 0.6) > 0.9 ? 1 : 0, eyes: blinkAt(t, 11) };
  },
  shapes(P) {
    const c = this.colors;
    const by = -P.bounce;
    const wheel = (x, r) => {
      const a = (P.roll % 1) * TAU;
      return [
        E(x, GROUND - r, r, r, c.wheel), F(E(x, GROUND - r, r * 0.62, r * 0.62, '#a888c0')),
        ...[0, 1, 2].map((i) => F(T((() => {
          const [ax, ay] = at(x, GROUND - r, a + (i * TAU) / 3, r * 0.6);
          const [bx2, by2] = at(x, GROUND - r, a + (i * TAU) / 3 + 0.3, r * 0.6);
          return [[x, GROUND - r], [ax, ay], [bx2, by2]];
        })(), c.wheel))),
        F(E(x, GROUND - r, 1.3, 1.3, c.hub)),
      ];
    };
    const tailBase = [13, 28 + by];
    const tA = Math.PI + 0.1 + P.tail * 0.5 - P.tailLag * 0.4;
    const back = [
      wheel(22, 5.5)[0],
      // the tail: a fat brush that curls up behind, ringed in dark bands, its tip pale
      ...(() => {
        const out = [];
        let [px, py] = tailBase;
        let a = tA;
        for (let i = 0; i < 7; i++) {
          const r = [3.2, 3.8, 4.2, 4.2, 3.9, 3.3, 2.5][i];
          const tone = i === 6 ? c.furLt : i === 2 || i === 4 ? c.furDk : c.fur;
          out.push(E(px, py, r, r * 0.92, tone));
          if (tone === c.fur) out.push(F(E(px - 0.6, py - r * 0.45, r * 0.55, r * 0.3, c.furLt)));
          [px, py] = at(px, py, a, 2.4);
          a += 0.32 + P.tail * 0.15 + P.tailLag * 0.1;
        }
        return out;
      })(),
      // the handle arc over the top
      ...Array.from({ length: 19 }, (_, i) => E(...at(32, 22 + by, Math.PI + 0.12 + (i / 18) * (Math.PI - 0.24), 11), 1.25, 1.25, c.cuSh2)),
    ];
    const lid = -P.rattle * 1.2;
    const front = [
      ...wheel(22, 5.5).slice(1),
      // the pot
      E(32, 31 + by, 15, 11, c.cu), F(E(32, 36 + by, 14, 5.5, c.cuSh)), F(E(27, 26 + by, 6, 2.6, c.cuLt)), F(E(23, 27.5 + by, 1.6, 1.2, '#ffffff')),
      // the spout at the front, steaming
      T([[42, 29 + by], [46, 27 + by], [53, 20 + by], [55, 21 + by], [49, 31 + by], [44, 34 + by]], c.cu), F(T([[44, 33 + by], [49, 31 + by], [55, 21 + by], [53.4, 21.6 + by]], c.cuSh)),
      // lid with its knob, and the tanuki's ears peeking out under it
      E(25, 20 + by + lid, 2.4, 2.4, c.furDk), E(39, 20 + by + lid - P.ears, 2.4, 2.4, c.furDk),
      E(32, 21 + by + lid, 9, 2.6, c.lid), F(E(32, 22 + by + lid, 8, 1, '#e8a860')), E(32, 18.2 + by + lid, 2, 1.6, c.lid),
      // the face on the pot (a tanuki mask)
      F(E(40.5, 29 + by, 4.6, 3, c.furDk)), ...eye(39.6, 28.6 + by, P.eyes, 0.8), ...eye(43, 28.6 + by, P.eyes, 0.8),
      F(E(41.6, 31.6 + by, 0.8, 0.5, INK)),
      ...wheel(44, 5.5),
    ];
    return { back, front, steam: P.steam };
  },
  seat: (P) => ({ x: 30, y: 17 - P.bounce, lean: P.lean }),
  lift: () => 0,
};

// Shell Skipper: a sea turtle. On land it hauls itself along the way sea turtles do: a front
// flipper digs its tip into the ground and pulls back under the shell (the tip staying where it dug
// in while the shell slides over it), lifts and reaches forward again, the other side half a pull
// behind, the hind flippers shoving in turn; the shell rides up on each pull and the head pokes
// forward with it. Timed by the ground covered. On water it skims, flippers sweeping wide, a wake
// behind it.
const SKIP = { stride: 13, duty: 0.62 };
BODIES.turtle = {
  stride: SKIP.stride,
  colors: { shell: '#7fd1b9', shellSh: '#4fa89a', shellLt: '#c8f4e2', plate: '#fff1d0', skin: '#bfe8a8', skinSh: '#8cc983', belly: '#fff6d8' },
  pose(m, t) {
    if (m.special === 'swim') {
      const s = Math.sin(t * 6);
      return { g_ph: 0, g_walk: 0, row: s, rowLag: s * 0.5, head: 0.1, bob: Math.sin(t * 3) * 0.8, eyes: blinkAt(t, 13), sink: 6 };
    }
    if (m.speed > 0.15 && !m.air) {
      const ph = ((m.ph % 1) + 1) % 1;
      // The shell rides up on each pull (twice a stride, one flipper then the other).
      const pull = Math.abs(Math.sin(ph * Math.PI * 2));
      return { g_ph: ph, g_walk: 1, g_bob: pull * 1.1, g_head: pull * 1.4, row: 0, rowLag: 0, head: 0, bob: 0, eyes: 1, sink: 0 };
    }
    return { g_ph: 0, g_walk: 0, g_bob: 0, g_head: 0, row: Math.sin(t * 1.2) * 0.08, rowLag: 0, head: Math.sin(t * 0.9) * 0.1 + (Math.sin(t * 0.37) > 0.9 ? -0.3 : 0), bob: Math.sin(t * 1.2) * 0.4, eyes: blinkAt(t, 13), sink: 0 };
  },
  shapes(P) {
    const c = this.colors;
    const walk = P.g_walk;
    const y = 30 - P.bob - (P.g_bob ?? 0) + P.sink;
    const gy = GROUND - 1;
    // A flipper as a paddle from its root out to the tip, wide in the middle.
    const paddle = (root, tip, w, tone) => {
      const dx = tip[0] - root[0];
      const dy = tip[1] - root[1];
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L;
      const ny = dx / L;
      const m1 = [root[0] + dx * 0.45, root[1] + dy * 0.45];
      return T([[root[0] + nx * w * 0.35, root[1] + ny * w * 0.35], [m1[0] + nx * w * 0.6, m1[1] + ny * w * 0.6], [tip[0] + nx * 0.6, tip[1] + ny * 0.6], [tip[0] + dx / L * 0.8, tip[1] + dy / L * 0.8], [tip[0] - nx * 0.8, tip[1] - ny * 0.8], [m1[0] - nx * w * 0.5, m1[1] - ny * w * 0.5], [root[0] - nx * w * 0.35, root[1] - ny * w * 0.35]], tone);
    };
    const flipTip = (root, ph, front) => {
      if (!walk) {
        // Standing or swimming: the old sweep about the shoulder.
        const a = front ? 0.9 - P.row * 0.9 : 2.2 + P.rowLag * 0.5;
        const len = front ? 10 : 7.5;
        return [root[0] + Math.cos(a) * len * (front ? 1 : 1), root[1] + Math.sin(a) * len * 0.5 + (P.sink ? 0 : 3)];
      }
      const [dx, up] = pawCycle(ph, SKIP.duty, (SKIP.stride * SKIP.duty) / 2, 2.6);
      return [root[0] + (front ? 6 : -4) + dx, gy - up];
    };
    const ph = P.g_ph;
    const rootFN = [38, y + 5.5];
    const rootHN = [19, y + 6.5];
    const back = [
      paddle([rootFN[0] + 3, rootFN[1] - 0.5], flipTip([rootFN[0] + 3, rootFN[1] - 0.5], ph + 0.5, true), 3.6, c.skinSh),
      paddle([rootHN[0] + 2, rootHN[1] - 0.5], flipTip([rootHN[0] + 2, rootHN[1] - 0.5], ph, false), 3, c.skinSh),
    ];
    const hx = 50 + (P.g_head ?? 0);
    const hy = y + 1 + P.head * 6;
    const front = [
      // head and neck
      T([[42, y + 1], [hx, hy - 3.5], [hx + 4.5, hy - 1.5], [hx + 4.5, hy + 2], [hx, hy + 3], [42, y + 6]], c.skin), F(T([[42, y + 5], [hx, hy + 2.4], [hx + 4.4, hy + 1.6], [hx, hy + 3]], c.skinSh)),
      ...eye(hx + 1.6, hy - 0.6, P.eyes, 0.85), F(E(hx + 1.6, hy + 1.6, 1.2, 0.5, '#ffb3c6')),
      // belly plate and the domed shell
      E(30, y + 6, 15, 3.4, c.belly),
      T([[13, y + 5], [16, y - 4], [24, y - 9], [36, y - 9.5], [44, y - 4], [47, y + 5]], c.shell),
      F(T([[13, y + 5], [47, y + 5], [44, y + 1.5], [16, y + 1.5]], c.shellSh)),
      // the shell's plates
      ...[[22, y - 3.5], [30, y - 5], [38, y - 3.5]].map(([x, py]) => F(T([[x - 3.6, py], [x - 1.6, py - 3], [x + 1.8, py - 3], [x + 3.6, py], [x + 1.8, py + 3], [x - 1.6, py + 3]], c.shellLt))),
      F(E(26, y - 7.4, 4, 1.2, '#ffffff')),
      ...[16, 22, 28, 34, 40, 45].map((x) => F(E(x, y + 3.8, 1.1, 0.8, c.plate))),
      // the near flippers: the front one hauls, the hind one shoves
      paddle(rootFN, flipTip(rootFN, ph, true), 4, c.skin),
      paddle(rootHN, flipTip(rootHN, ph + 0.5, false), 3.4, c.skin),
    ];
    return { back, front, wake: P.sink > 3 };
  },
  seat: (P) => ({ x: 29, y: 21 - P.bob - (P.g_bob ?? 0) + P.sink, lean: 0 }),
  lift: () => 0,
};

// Ivy Gecko: a leaf-green gecko with a blossom crest and a curled tail. It scurries in a sprawl,
// elbows and knees up above its back, on diagonal pairs (near fore with far hind), each sticky foot
// planted toes-splayed while the body slides over it; the tail swings against the step and the head
// sways. Timed by the ground covered. On a rope it climbs, head up.
const GECKO = { stride: 17, duty: 0.55 };
BODIES.gecko = {
  stride: GECKO.stride,
  colors: { skin: '#9fe0a0', sh: '#6fbf86', sh2: '#4f9e7a', belly: '#e8ffd8', spot: '#ffe36b', bloom: '#ff9ec7', bloomLt: '#ffd2e6' },
  pose(m, t) {
    if (m.special === 'climb') {
      const s = Math.sin(t * 12);
      return { g_ph: (t * 1.9) % 1, g_walk: 1, tail: s * 0.3, tailLag: s * 0.4, head: 0, crest: s * 0.1, eyes: 1, lick: 0 };
    }
    if (m.speed > 0.15 || m.air) {
      const ph = m.air ? 0.25 : ((m.ph % 1) + 1) % 1;
      const s = Math.sin(ph * Math.PI * 2);
      return { g_ph: ph, g_walk: m.air ? 0 : 1, tail: -s * 0.35, tailLag: -s * 0.5, head: s * 0.04, crest: -s * 0.15, eyes: 1, lick: 0 };
    }
    const lick = Math.sin(t * 0.55) > 0.92 ? 1 : 0;
    return { g_ph: 0, g_walk: 0, tail: Math.sin(t * 1.5) * 0.2, tailLag: Math.sin(t * 1.5 - 1) * 0.25, head: Math.sin(t * 1.1) * 0.05, crest: Math.sin(t * 1.5 - 0.4) * 0.1, eyes: blinkAt(t, 17), lick };
  },
  shapes(P) {
    const c = this.colors;
    const y = 33;
    const gy = GROUND - 1;
    // A sprawled leg: up out of the side to the elbow (or knee), down to the foot, toes splayed.
    const leg = (root, ph, front, tone, toeTone) => {
      const [dx, up] = P.g_walk ? pawCycle(ph, GECKO.duty, (GECKO.stride * GECKO.duty) / 2, 2.6) : [0, 0];
      const foot = [root[0] + (front ? 2.4 : -1.6) + dx, gy - up];
      const { knee, paw } = ik(root[0], root[1], foot[0], foot[1], 5.6, 7, 'up');
      const toes = [-0.9, 0, 0.9].map((a) => F(E(paw[0] + Math.cos(a) * 1.8 + 0.6, paw[1] + 0.2 + Math.sin(a) * 0.6, 1.1, 0.7, toeTone)));
      return [...limb(root, knee, paw, { w0: 3.4, w1: 2.4, w2: 2.2, c: tone, sock: tone, pawRx: 1.6, pawRy: 0.9, toe: 0.4 }), ...toes];
    };
    // the tail: a curl of beads
    const tail = [];
    let tx = 13;
    let ty = y;
    let a = Math.PI + 0.3 + P.tail;
    for (let i = 0; i < 8; i++) {
      const r = 3.2 - i * 0.33;
      tail.push([tx, ty, r]);
      [tx, ty] = at(tx, ty, a, 2.7);
      a -= 0.16 + P.tailLag * 0.12 + i * 0.07;
    }
    const ph = P.g_ph;
    const back = [...leg([41, y + 1.4], ph + 0.5, true, c.sh2, c.sh2), ...leg([21, y + 1.4], ph, false, c.sh2, c.sh2), ...tail.map(([x, py, r]) => E(x, py, r, r, c.sh))];
    const hy = y - 5 + P.head * 20;
    const front = [
      ...tail.map(([x, py, r]) => E(x, py - 0.4, r * 0.82, r * 0.82, c.skin)),
      // body and belly
      E(30, y, 15, 6, c.skin), F(E(30, y + 3.4, 13, 2.4, c.belly)), F(E(29, y - 4, 8, 1.4, '#d8ffc8')),
      ...[[24, y - 2.4], [30, y - 3.2], [36, y - 2]].map(([x, py]) => F(E(x, py, 1.1, 0.8, c.spot))),
      // head, big-eyed, with a little blossom crest
      E(47, hy, 7, 5.4, c.skin), F(E(47, hy + 3, 6, 1.8, c.belly)),
      ...eye(49, hy - 1, P.eyes, 1.05), F(E(51.6, hy + 1.6, 1.4, 0.6, '#ffb3c6')),
      ...(P.lick ? [F(E(54.6, hy + 2.8, 1.8, 0.7, '#ff7fa8'))] : [F(E(52.8, hy + 2.4, 0.9, 0.4, INK))]),
      ...[0, 1, 2, 3, 4].map((i) => E(...at(44.6, hy - 5 + P.crest * 3, (i / 5) * TAU + P.crest, 1.5), 1.3, 1.3, c.bloom)), F(E(44.6, hy - 5 + P.crest * 3, 0.9, 0.9, c.bloomLt)),
      // the near legs
      ...leg([39, y + 2.4], ph, true, c.skin, c.sh), ...leg([19, y + 2.4], ph + 0.5, false, c.skin, c.sh),
    ];
    return { back, front };
  },
  seat: (P) => ({ x: 28, y: 25, lean: Math.sin(P.g_ph * TAU) * 0.02 * P.g_walk }),
  lift: () => 0,
};

export const MOUNT_BODIES = BODIES;

// Each mount's rider pose: how the rider holds on (hands forward to the ears, the handle, the neck,
// the shell's rim) and tucks their legs.
const RIDE = {
  bun: { air: true, frontLeg: [3.2, -3.2, 55], backLeg: [1.6, -3.2, 55], frontArm: [3.5, -2], backArm: [4.5, -2] },
  crane: { air: true, frontLeg: [3.6, -4, 70], backLeg: [2, -4, 70], frontArm: [4.5, -1], backArm: [5.5, -1] },
  nimbus: { air: true, frontLeg: [2.6, -3, 45], backLeg: [1, -3, 45], frontArm: [2, 1], backArm: [3, 1] },
  kettle: { air: true, frontLeg: [3, -3, 50], backLeg: [1.5, -3, 50], frontArm: [1.5, -6], backArm: [2.5, -6] },
  turtle: { air: true, frontLeg: [3.4, -2.6, 45], backLeg: [1.4, -2.6, 45], frontArm: [3.5, 0.5], backArm: [4.5, 0.5] },
  gecko: { air: true, frontLeg: [3, -3, 50], backLeg: [1.5, -3, 50], frontArm: [4, -1], backArm: [5, -1] },
};

// The shapes for a mount in a pose, as sprites (cached by the pose's rounded numbers).
function partSprite(id, which, P, time, shapes) {
  const key = `mount|${id}|${which}|${Object.values(P).join(',')}`;
  return sprite(key, () => ({ w: MW, h: MH, shapes, res: 3, soft: 'cel', crisp: true, selout: true }));
}

const STATE = new WeakMap();
// Steam puffs and wake splashes the drawing lets off, per mount state (kept in world space).
function bits(st, time, list) {
  st.bits ??= [];
  for (const b of list) st.bits.push({ ...b, t0: time });
  st.bits = st.bits.filter((b) => time - b.t0 < b.life);
  return st.bits;
}

// Draws a mount and its rider with the ground point at (x, y) on screen.
//   who     the thing riding (its own spring state is kept on it): the world, a bot or a ghost
//   mount   a mount id
//   motion  { facing, speed (0-1+ of the mount's top speed), air, vy, special, hoverLeft, landAt }
//   rider   { look, pose (extra rig numbers), face } or null to draw the mount alone
export function drawMount(ctx, who, mount, x, y, time, motion, rider = null) {
  const body = BODIES[mount];
  if (!body) return;
  let st = STATE.get(who);
  if (!st || st.mount !== mount) STATE.set(who, (st = { mount, last: time, riderLag: 0, riderV: 0 }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  const m = { speed: 0, air: false, vy: 0, special: null, landAt: -9, hoverLeft: 1, ...motion };
  // How far through its stride it is, from the ground it has covered (its share of top speed times
  // the mount's top speed in px/s), so its feet keep pace with the ground at any speed.
  const topSpeed = 125 * ((MOUNTS[mount]?.speed ?? 100) / 100);
  if (!m.air && m.special !== 'swim' && m.special !== 'climb') st.dist = (st.dist ?? 0) + Math.min(1.6, m.speed) * topSpeed * dt;
  m.ph = body.stride ? (st.dist ?? 0) / body.stride : 0;
  const target = body.pose(m, time);
  const P = follow(st, target, dt);
  const facing = m.facing < 0 ? -1 : 1;
  const flip = facing < 0;
  const lift = body.lift(P);
  const left = Math.round(x - MW / 2);
  const top = Math.round(y - GROUND - lift);
  // The pose is rounded (a quarter pixel, a twentieth of a radian) before it's drawn, so a gait
  // comes round to the same sprites every cycle; lift is applied when blitting, not in the shapes.
  const qp = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, typeof v !== 'number' ? v : k === 'roll' ? Math.round((v % 1) * 12) / 12 : k === 'g_hop' ? 0 : k === 'g_ph' ? Math.round(v * 24) / 24 : q(v, 4)]));
  const { back, front, steam, wake } = body.shapes(qp, time);
  const backS = partSprite(mount, 'b', qp, time, back);
  const frontS = partSprite(mount, 'f', qp, time, front);
  // A soft ground shadow that shrinks as the mount leaves the ground.
  ctx.save();
  ctx.globalAlpha = 0.16 * Math.max(0.3, 1 - lift / 30);
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(x, y - 0.5, 15 - Math.min(8, lift * 0.3), 2.4, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Steam from the kettle's spout, a wake behind the turtle.
  const sx = (bx) => (flip ? x + (MW / 2 - bx) : x - MW / 2 + bx);
  const fx = bits(st, time, [
    ...(steam && Math.random() < dt * 30 ? [{ kind: 'steam', x: sx(55), y: top + 19, vx: facing * 10, life: 0.6 }] : []),
    ...(wake && Math.random() < dt * 18 ? [{ kind: 'wake', x: sx(12), y: y - 2, vx: -facing * 14, life: 0.7 }] : []),
    ...(mount === 'nimbus' && m.speed > 0.15 && Math.random() < dt * 8 ? [{ kind: 'puff', x: sx(10), y: top + 30, vx: -facing * 12, life: 0.9 }] : []),
  ]);
  for (const b of fx) {
    const k = (time - b.t0) / b.life;
    ctx.save();
    ctx.globalAlpha = (1 - k) * (b.kind === 'wake' ? 0.8 : 0.75);
    ctx.fillStyle = b.kind === 'wake' ? '#f2fffc' : '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x + b.vx * k * b.life, b.y - (b.kind === 'steam' ? 10 * k : b.kind === 'puff' ? 3 * k : 0), (b.kind === 'wake' ? 2.2 : 3) * (0.6 + k * 0.8), 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  blit(ctx, backS, left, top, { flip });
  if (rider) {
    // The rider's bob copies the mount's a beat later and smaller.
    const seat = body.seat(P);
    const seatY = seat.y - lift;
    const kk = 180;
    const cc = 2 * Math.sqrt(kk) * 0.6;
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n; i++) {
      st.riderV += ((seatY - st.riderLag) * kk - st.riderV * cc) * (dt / n);
      st.riderLag += st.riderV * (dt / n);
    }
    if (!st.seeded) {
      st.riderLag = seatY;
      st.seeded = true;
    }
    const ry = y - GROUND + (seatY * 0.65 + st.riderLag * 0.35);
    const rx = flip ? x + (MW / 2 - seat.x) : x - MW / 2 + seat.x;
    const pose = { ...RIDE[mount], hair: -Math.min(1, m.speed) * 0.8, ...(rider.pose ?? {}) };
    drawPosed(ctx, rider.look, rx, ry + 7, pose, { facing, lean: { tilt: seat.lean, lift: 0, lunge: 0 } });
  }
  blit(ctx, frontS, left, top, { flip });
}
