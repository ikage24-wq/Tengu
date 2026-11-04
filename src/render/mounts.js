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

// Puff Bun: a marshmallow bunny. Ground gait is a run of hops: crouch, spring (hind feet kick
// back), tuck in the air, land on the forefeet. Ears trail on their own spring.
BODIES.bun = {
  colors: { base: '#fff6f9', sh: '#f6dbe8', sh2: '#e2bcd6', ear: '#ffb3cf', cheek: '#ffc2d8', nose: '#e8799f' },
  pose(m, t) {
    const run = m.speed > 0.15 && !m.air;
    if (m.air) {
      const up = m.vy < 0;
      return { hop: 0, crouch: 0, earA: up ? 0.95 : -0.15, earLag: up ? 0.6 : -0.35, feetF: up ? 2.2 : 3.2, feetB: up ? 4.5 : 2.2, pitch: up ? -0.12 : 0.1, nose: 0, eyes: 1, joy: 1 };
    }
    const land = Math.max(0, 1 - (t - m.landAt) / 0.22);
    if (run) {
      const ph = (t * 2.3 * (0.7 + m.speed * 0.4)) % 1;
      const up = Math.sin(Math.PI * seg(ph, 0.18, 0.9));
      return { hop: up * 9, crouch: ph < 0.18 ? 2.2 * (1 - ph / 0.18) : ph > 0.9 ? 2.2 * seg(ph, 0.9, 1) : 0, earA: 0.75 - up * 0.45, earLag: -up * 0.5, feetF: up * 2.6, feetB: up * 4.6, pitch: (ph < 0.5 ? -0.1 : 0.08) * up, nose: 0, eyes: 1, joy: up };
    }
    const twitch = Math.max(0, Math.sin(t * 9)) * (Math.sin(t * 0.7) > 0.6 ? 1 : 0);
    const flick = Math.sin(t * 0.43) > 0.93 ? Math.sin(t * 22) * 0.15 : 0;
    return { hop: 0, crouch: land * 2.6 + Math.sin(t * 1.6) * 0.35, earA: 0.25 + land * -0.4 + Math.sin(t * 1.6 - 0.6) * 0.06 + flick, earLag: 0, feetF: 0, feetB: 0, pitch: 0, nose: twitch, eyes: blinkAt(t, 3), joy: land * 0.6 };
  },
  shapes(P, time) {
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
    const fy = GROUND - 2.6;
    const back = [
      ...ear(43, 14.5, eA + 0.14, c.sh, c.sh2),
      // far feet
      E(17 - P.feetB * 0.8, fy - P.feetB * 0.2, 4.2, 2.6, c.sh), E(41 + P.feetF * 0.4, fy - P.feetF * 0.3, 3.2, 2.4, c.sh),
    ];
    const bx = 30;
    const body = rot([[bx - 19, 30 + by], [bx - 15, 19 + by], [bx - 4, 13.5 + by], [bx + 9, 14 + by], [bx + 16, 19 + by], [bx + 18, 27 + by], [bx + 14, 37 + by], [bx, 40 + by], [bx - 14, 39 + by]], bx, 30 + by, P.pitch);
    const nose = P.nose > 0.5 ? 0.25 : 0;
    const front = [
      T(body, c.base),
      F(T(rot([[bx - 18, 33 + by], [bx + 15, 33 + by], [bx + 12, 38 + by], [bx, 40 + by], [bx - 13, 39 + by]], bx, 30 + by, P.pitch), c.sh)),
      F(E(bx + 1, 18 + by, 9, 2.8, '#ffffff')),
      // the cotton tail
      E(bx - 19, 26 + by, 3.4, 3.4, '#ffffff'), F(E(bx - 19.5, 27.5 + by, 2.2, 1.4, c.sh)),
      // near hind foot (kicks back on the spring) and forefoot
      E(bx - 11 - P.feetB, fy - P.feetB * 0.25 + Math.min(by, 1), 5, 3, c.base), F(E(bx - 11 - P.feetB, fy + 1.2 - P.feetB * 0.25 + Math.min(by, 1), 4, 1.3, c.sh)),
      E(bx + 11 + P.feetF * 0.5, fy - P.feetF * 0.35 + Math.min(by, 1), 3.6, 2.6, c.base),
      // face, at the front
      ...eye(bx + 12.4, 23 + by, P.eyes),
      F(E(bx + 15.4, 27 + by, 2, 0.9, c.cheek)), F(E(bx + 8.6, 27 + by, 1.6, 0.8, c.cheek)),
      F(T([[bx + 16.6, 25.6 + by - nose], [bx + 17.8, 25.6 + by - nose], [bx + 17.2, 26.4 + by - nose]], c.nose)),
      ...(P.joy > 0.4 ? [F(E(bx + 15.6, 28.6 + by, 0.9, 0.7, '#c2507a'))] : []),
      ...ear(46, 16, eA, c.base, c.ear),
    ];
    return { back, front };
  },
  seat: (P) => ({ x: 23, y: 15.5 + P.crouch, lean: P.pitch * 0.6 - P.hop * 0.004 }),
  lift: (P) => P.hop,
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

// Shell Skipper: a sea turtle. On land it plods, front flippers rowing in turn; on water it skims,
// flippers sweeping wide, a wake behind it.
BODIES.turtle = {
  colors: { shell: '#7fd1b9', shellSh: '#4fa89a', shellLt: '#c8f4e2', plate: '#fff1d0', skin: '#bfe8a8', skinSh: '#8cc983', belly: '#fff6d8' },
  pose(m, t) {
    if (m.special === 'swim') {
      const s = Math.sin(t * 6);
      return { row: s, rowLag: s * 0.5, head: 0.1, bob: Math.sin(t * 3) * 0.8, step: 0, eyes: blinkAt(t, 13), sink: 6 };
    }
    if (m.speed > 0.15 && !m.air) {
      const s = Math.sin(t * 6.5);
      return { row: s * 0.6, rowLag: s * 0.3, head: Math.sin(t * 13) * 0.08, bob: Math.abs(s) * 1.2, step: s, eyes: 1, sink: 0 };
    }
    return { row: Math.sin(t * 1.2) * 0.08, rowLag: 0, head: Math.sin(t * 0.9) * 0.1 + (Math.sin(t * 0.37) > 0.9 ? -0.3 : 0), bob: Math.sin(t * 1.2) * 0.4, step: 0, eyes: blinkAt(t, 13), sink: 0 };
  },
  shapes(P) {
    const c = this.colors;
    const y = 30 - P.bob + P.sink;
    const flip = (x0, y0, a, len, tone) => T(rot([[x0, y0 - 1.6], [x0 + len, y0 - 0.4], [x0 + len * 0.9, y0 + 2], [x0, y0 + 2.2]], x0, y0, a), tone);
    const back = [flip(42, y + 5, 0.6 - P.row * 0.6, 9, c.skinSh), flip(20, y + 6, 2.4 + P.rowLag * 0.4, 7, c.skinSh)];
    const hx = 50;
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
      // the near flippers: front rows, back paddles
      flip(38, y + 6, 0.9 - P.row * 0.9, 10, c.skin), flip(19, y + 6.5, 2.2 + P.rowLag * 0.5, 7.5, c.skin),
    ];
    return { back, front, wake: P.sink > 3 };
  },
  seat: (P) => ({ x: 29, y: 21 - P.bob + P.sink, lean: 0 }),
  lift: () => 0,
};

// Ivy Gecko: a leaf-green gecko with a blossom crest and a curled tail. It scurries on diagonal pairs
// of legs (near-front with far-back), tail swinging the other way; on a rope it climbs, head up.
BODIES.gecko = {
  colors: { skin: '#9fe0a0', sh: '#6fbf86', sh2: '#4f9e7a', belly: '#e8ffd8', spot: '#ffe36b', bloom: '#ff9ec7', bloomLt: '#ffd2e6' },
  pose(m, t) {
    if (m.special === 'climb') {
      const s = Math.sin(t * 12);
      return { stride: s, tail: s * 0.3, tailLag: s * 0.4, head: 0, crest: s * 0.1, eyes: 1, climb: 1, lick: 0 };
    }
    if (m.speed > 0.15 || m.air) {
      const s = m.air ? 0.6 : Math.sin(t * 15);
      return { stride: s, tail: -s * 0.35, tailLag: -s * 0.5, head: s * 0.04, crest: -s * 0.15, eyes: 1, climb: 0, lick: 0 };
    }
    const lick = Math.sin(t * 0.55) > 0.92 ? 1 : 0;
    return { stride: 0, tail: Math.sin(t * 1.5) * 0.2, tailLag: Math.sin(t * 1.5 - 1) * 0.25, head: Math.sin(t * 1.1) * 0.05, crest: Math.sin(t * 1.5 - 0.4) * 0.1, eyes: blinkAt(t, 17), climb: 0, lick };
  },
  shapes(P) {
    const c = this.colors;
    const y = 33;
    const leg = (x, fwd, tone) => {
      const k = fwd;
      return T([[x - 1.6, y + 1], [x + 1.6, y + 1], [x + 2.2 + k * 3, GROUND - 1.2 + Math.max(0, -k) * -1.4], [x - 1 + k * 3, GROUND - 0.4 + Math.max(0, -k) * -1.4]], tone);
    };
    const toes = (x, fwd, tone) => F(E(x + 0.6 + fwd * 3, GROUND - 0.8, 2.2, 0.9, tone));
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
    const back = [leg(42, -P.stride, c.sh2), leg(20, P.stride, c.sh2), ...tail.map(([x, py, r]) => E(x, py, r, r, c.sh))];
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
      leg(40, P.stride, c.skin), toes(40, P.stride, c.sh), leg(19, -P.stride, c.skin), toes(19, -P.stride, c.sh),
    ];
    return { back, front };
  },
  seat: (P) => ({ x: 28, y: 25, lean: P.stride * 0.02 }),
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
  const target = body.pose(m, time);
  const P = follow(st, target, dt);
  const facing = m.facing < 0 ? -1 : 1;
  const flip = facing < 0;
  const lift = body.lift(P);
  const left = Math.round(x - MW / 2);
  const top = Math.round(y - GROUND - lift);
  // The pose is rounded (a quarter pixel, a twentieth of a radian) before it's drawn, so a gait
  // comes round to the same sprites every cycle; lift is applied when blitting, not in the shapes.
  const qp = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, typeof v !== 'number' ? v : k === 'roll' ? Math.round((v % 1) * 12) / 12 : k === 'hop' ? 0 : q(v, 4)]));
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
