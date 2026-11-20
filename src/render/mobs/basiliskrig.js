// The Basilisk Hatchling (Windy Canyon, remade from scratch 2026-11-18 for Chapter 3): a round mint
// lizard still sitting in the bottom half of its speckled eggshell, the top half worn as a hat, a
// curly tail poking out of a crack at the back, and a folded frill round its neck that opens like a
// kite. A live puppet on the rig (rig.js): every part drawn once and placed each frame, nothing
// squashed or stretched, outer outline only.
//
//   walk    it can't walk yet: it waddles the whole egg along, rocking it forward and back on its
//           round bottom, two tiny feet shuffling under the shell in turn, its hat wobbling.
//   wind    when a gust comes through the canyon its frill catches it and opens like a kite, and
//           it lifts off the ground a little, swaying, delighted, then settles back down.
//   idle    it looks about; ducks right down into its shell, only its eyes and hat peeking out, then
//           pops back up; opens its frill to the breeze; yawns.
//   attack  it ducks into its shell and rattles it, then pops out and tumbles forward, frill flared,
//           bonking you with its head.
//   hit     the shell rattles, the hat jumps.

import { E, T, F } from './kit.js';

import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, makeRig, stateBlend, smooth, clamp, TAU } from './rig.js';
import { sprite } from '../pixel.js';
import { windAt } from '../terrain.js';

const SKIN = ramp('#8fdcb6', { step: 9, turn: 12 });
const BELLY = '#f6f2d4';
const SHELL = ramp('#fbf0de', { step: 7, turn: 10, lift: 4 });
const SPECK = ['#e8d0b2', '#bfe2d6'];
const FRILL = [ramp('#ffb39c', { step: 8, turn: 8 }), ramp('#ffd27c', { step: 8, turn: 8 })];
const INK = '#203024';
const D2R = Math.PI / 180;

const pair = (key, w, h, shapes, pad = 3) => [() => part(`bh|${key}`, w, h, shapes, pad), () => partBare(`bh|${key}`, w, h, shapes, pad)];

// ---------- Shapes ----------

// The zigzag of a broken shell edge from x0 to x1 at height y.
const zig = (x0, x1, y, n, up = 1.6) => {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y - (i % 2 ? up : 0)]);
  return pts;
};
// The shell's bottom half: an egg's round bottom up to a jagged rim, two big soft speckles, a crack
// at the back where the tail comes out. Box 20 x 13; the point it stands on at (10, 12.6).
const shellShapes = () => {
  const out = [];
  const bottom = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI;
    bottom.push([10 + Math.cos(a) * 9.2, 2.6 + Math.sin(a) * 10]);
  }
  out.push(T([...zig(0.8, 19.2, 2.6, 8, 2), ...bottom.slice(1, -1)], SHELL.base));
  out.push(F(E(6, 7.6, 2.8, 2, SPECK[0])), F(E(13.6, 9.6, 2.2, 1.5, SPECK[1])), F(E(15.4, 5.4, 1.4, 1, SPECK[0])));
  out.push(crescent(10, 2.6, 9.2, 10, SHELL.sh, { k: 0.18, a0: 20, a1: 160 }));
  out.push(F(E(6.4, 4.6, 2.2, 1, '#ffffff')));
  return out;
};
// The hat: the shell's top half, a little dome with a jagged brim. Box 12 x 8; its brim's middle at (6, 7).
const capShapes = () => [
  T([...zig(0.6, 11.4, 7, 6, 1.4), [10.8, 4.2], [8.6, 1.2], [6, 0.4], [3.4, 1.2], [1.2, 4.2]], SHELL.base),
  F(E(4.2, 3, 1.4, 0.9, SPECK[1])),
  F(E(7.6, 2, 1.6, 0.6, '#ffffff')),
];
// The body inside the shell: round and mint, a cream tummy. Box 14 x 11; its joint (bottom middle) at (7, 10).
const bodyShapes = () => [E(7, 6, 6.4, 5, SKIN.base), E(8.6, 7.4, 3.6, 2.8, BELLY), crescent(7, 6, 6.4, 5, SKIN.sh, { k: 0.2, a0: 20, a1: 150 }), shine(7, 6, 6.4, 5, SKIN.hi, 0, 0.7)];
// The head: big and round with a short round snout. Box 18 x 15; the neck at (5, 13), its middle at (9, 7.6).
const headShapes = () => [
  E(8.6, 7.6, 6.6, 6.2, SKIN.base),
  E(13.6, 9.4, 3.8, 3, SKIN.base),
  E(13.4, 11.2, 3, 1.4, BELLY),
  crescent(8.6, 7.6, 6.6, 6.2, SKIN.sh, { k: 0.2, a0: 100, a1: 200 }),
  F(E(7, 3.4, 2.6, 1.1, SKIN.hi)),
  F(E(4.6, 8.6, 1, 0.8, SKIN.sh)),
  F(E(6.2, 10.6, 0.8, 0.6, SKIN.sh)),
];
// A blade of the frill: a broad rounded fan blade, lit down its rib. Box 6 x 13; its root at (3, 12.4).
// (Wide enough that the five overlap into one fan when it opens.)
const spineShapes = (k) => () => {
  const c = FRILL[k % 2];
  return [T([[3, 12.4], [0.2, 5.8], [0.8, 1.8], [3, 0.3], [5.2, 1.8], [5.8, 5.8]], c.base), F(T([[3, 12], [2.2, 5.6], [3, 1.8], [3.8, 5.6]], c.hi))];
};
// A foot: a tiny round mint foot. Box 5 x 3; its middle at (2.5, 1.5).
const footShapes = (far) => () => [E(2.5, 1.5, 2.3, 1.4, far ? SKIN.sh : SKIN.base), F(E(1.8, 1.1, 0.8, 0.4, SKIN.hi))];
// A bone of the curly tail. Box 6 x 4; its root at (1.4, 2).
const tailShapes = (i) => () => {
  const w0 = 2.8 - i * 0.6;
  const w1 = w0 - 0.6;
  return [E(1.4, 2, w0 / 2 + 0.1, w0 / 2 + 0.1, SKIN.base), T([[1.4, 2 - w0 / 2], [4.8, 2 - w1 / 2], [4.8, 2 + w1 / 2], [1.4, 2 + w0 / 2]], SKIN.base), E(4.8, 2, w1 / 2, w1 / 2, SKIN.base)];
};
// The face (bare): a hatchling gecko's. Big gold-green eyes with a slit pupil and two glints under a
// soft brow ridge, a long smile that curls up at the back, a nostril; a pink tongue blep when happy, a
// hiss with its tongue out to shout, and its stare goes bright gold when cross (the basilisk glare).
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const BH_EYES = [[10, 7.6, -1, 2.1, 2.7], [14.4, 7.2, 1, 1.6, 2.2]];
const BH_TONGUE = '#ff8aa8';
const faceShapes = (mood) => () => {
  const out = [];
  for (const [x, y, s, w, h] of BH_EYES) {
    const knit = mood === 'angry' ? 0.8 : mood === 'hurt' ? -0.5 : 0;
    out.push(...oLn([[x - s * w * 1.05, y - h * 1.08 + knit], [x + s * w * 0.9, y - h * 1.2 - knit * 0.4]], 0.5, SKIN.sh));
    if (mood === 'blink') out.push(...oLn(oArc(x, y + 0.3, w, h * 0.35, 15, 165, 8), 0.55));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 0.55));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 0.55));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.5));
    else {
      const glare = mood === 'angry';
      const lid = glare ? (px) => y - h * 0.3 + (px - x) * -s * 0.5 : () => -99;
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.05, w * 0.82, h * 0.84), lid), glare ? '#ffd23a' : '#c8c040')), F(T(oCut(oRing(x, y + h * 0.4, w * 0.62, h * 0.42), lid), glare ? '#fff08a' : '#9ad870')));
      out.push(F(T(oCut(oRing(x, y + h * 0.05, w * (mood === 'shout' ? 0.12 : 0.2), h * 0.7), lid), INK)));
      out.push(F(T(oCut(oRing(x + w * 0.38, y - h * 0.32, w * 0.24, w * 0.24, 0, 8), lid), '#ffffff')), F(E(x - w * 0.4, y + h * 0.4, w * 0.12, w * 0.12, '#ffffff')));
      if (glare) out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 8), (px) => lid(px) - 0.2), 0.5));
    }
  }
  if (mood !== 'dead') out.push(F(E(8.4, 11, 1.4, 0.7, '#ffa8b4')));
  out.push(F(E(16.4, 8.6, 0.35, 0.3, INK)));
  if (mood === 'shout') out.push(F(T([[12.2, 10.7], [16.4, 10.5], [15.8, 12.6], [13, 12.4]], '#7a3040')), F(T([[14.4, 11.6], [16.4, 11.2], [17.6, 10.8], [17, 11.5], [17.8, 11.9], [16.6, 11.9], [14.6, 12.3]], BH_TONGUE)));
  else if (mood === 'happy') out.push(...oLn([[11.2, 10.3], [12.2, 11.2], [14.2, 11.7], [16.2, 11]], 0.42), F(T([[15.2, 11.3], [16.2, 11.05], [16.4, 12.2], [15.7, 12.5], [15.2, 12]], BH_TONGUE)));
  else if (mood === 'angry') out.push(...oLn([[11.4, 11.3], [13.2, 11], [15, 11.3], [16.4, 10.9]], 0.42));
  else if (mood === 'hurt') out.push(...oWave(13.8, 11.3, 1.8, 0.4), ...oDrop(11.2, 10.6, 0.75));
  else if (mood === 'dead') out.push(...oLn([[12.4, 11.3], [16, 11.2]], 0.4));
  else out.push(...oLn([[11, 10.2], [11.6, 10.6], [12.6, 11.3], [14.4, 11.7], [16.2, 11]], 0.42));
  return out;
};
const SHELLP = pair('shell', 20, 13, shellShapes);
const CAPP = pair('cap', 12, 8, capShapes);
const BODYP = pair('body', 14, 11, bodyShapes);
const HEADP = pair('head', 18, 15, headShapes);
const SPINES = [0, 1, 2, 3, 4].map((k) => pair(`spine${k}`, 6, 13, spineShapes(k), 2));
const FEET = [false, true].map((far) => pair(`foot${far ? 1 : 0}`, 5, 3, footShapes(far), 2));
const TAILP = [0, 1, 2].map((i) => pair(`tail${i}`, 6, 4, tailShapes(i), 2));
const facePart = (mood) => sprite(`rig|bh|face|${mood}`, () => ({ w: 18, h: 15, res: 2, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: faceShapes(mood)() }));
const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.2) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3) return 'angry';
  if (a.yawn > 0.5) return 'shout';
  if (a.kite > 0.5) return 'happy';
  if (a.face === 'idle' && (a.t + (a.uidOff ?? 0)) % 4.1 < 0.12) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- Motion ----------

const STRIDE = 13;
// The frill's five blades round the back of the neck: [folded, open], degrees from straight up
// (negative leans back). Folded they lie back along the neck, a little ruff behind the head; open
// they fan out into a half circle behind it, like a kite.
const FAN = [[-124, -150], [-114, -112], [-104, -74], [-94, -36], [-84, 2]];
// The waddle's phase: one rock forward and back per STRIDE px, on an eased speed.
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(120, Math.abs(odo - (st.bhOdo ?? odo)) / dt);
  st.bhOdo = odo;
  st.bhV = (st.bhV ?? 0) + (raw - (st.bhV ?? 0)) * Math.min(1, dt * 4);
  st.bhU = ((st.bhU ?? 0) + (st.bhV / STRIDE) * dt) % 1;
  return st.bhU;
};
// The kite: how hard the canyon's wind is blowing on it now (0 in a lull, 1 in a gust).
const gustOf = (m, a) => clamp((windAt(a.t, m.x ?? 0) - 0.98) * 4, 0, 1);

const LOOP = 13;
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));

const passOf = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({
      name: `tail${k}${tag}`,
      parent: k ? `tail${k - 1}${tag}` : 'egg',
      s: TAILP[k][i],
      pivot: [1.4, 2],
      at: k ? () => [3.4, 0] : () => [-8.4, -6.4],
      rot: (S, a) => (k ? -38 + Math.sin(a.t * 1.7 - k) * 8 + S.wag * 0.4 : 196 + S.wag + S.duck * 30) * D2R,
    })),
    { name: `footF${tag}`, parent: null, s: FEET[1][i], pivot: [2.5, 1.5], at: (S, a) => [S.x + 2.6 + S.footF, -1.2 - S.float] },
    { name: `body${tag}`, parent: 'egg', s: BODYP[i], pivot: [7, 10], at: (S) => [0.4, -7.6 + S.duck * 4.6] },
    ...FAN.map((f, k) => ({ name: `spine${k}${tag}`, parent: 'neck', s: SPINES[k][i], pivot: [3, 12.4], at: () => [0.6, -2.4], rot: (S, a) => (f[0] + (f[1] - f[0]) * clamp(S.frill, 0, 1.15) + Math.sin(a.t * 6 + k) * 3 * S.frill) * D2R })),
    { name: `head${tag}`, parent: 'neck', s: HEADP[i], pivot: [5, 13] },
    { name: `cap${tag}`, parent: 'neck', s: CAPP[i], pivot: [6, 7], at: (S) => [4.2, -9.6 - S.capHop], rot: (S) => (-14 + S.cap) * D2R },
    { name: `shell${tag}`, parent: 'egg', s: SHELLP[i], pivot: [10, 12.6] },
    { name: `footN${tag}`, parent: null, s: FEET[0][i], pivot: [2.5, 1.5], at: (S, a) => [S.x - 2.4 + S.footN, -0.8 - S.float] },
  ];
};

export const basiliskRig = makeRig({
  w: 34,
  h: 36,
  soft: true,
  stride: STRIDE,
  recover: 0.65,
  springs: {
    x: [200, 18],
    rock: [150, 9],
    float: [60, 9],
    duck: [110, 12],
    head: [90, 9],
    frill: [70, 8],
    footN: [400, 30],
    footF: [400, 30],
  },
  fast: ['x', 'rock', 'duck', 'frill'],
  kick: { rock: -260, cap: 420, capHop: 30 },
  turnKick: { rock: 120, cap: 160 },
  pose(m, a) {
    const t = a.t + (m.uid % 13) * 0.97;
    a.uidOff = (m.uid % 13) * 0.97;
    const u = stepPhase(m, a);
    const lu = t % LOOP;
    const look = hold(lu, 0.6, 1.4, 2.4, 3);
    const duck = hold(lu, 3.6, 4.1, 5.6, 6.3);
    const kiteLoop = hold(lu, 7.2, 8, 9.6, 10.4);
    const yawn = hold(lu, 11, 11.5, 12, 12.6);
    // (A real gust lifts it too, when it's standing about.)
    const kite = Math.max(kiteLoop, gustOf(m, a) * 0.85) * (1 - duck);
    a.yawn = yawn;
    a.kite = kite * (1 - a.walkW);
    const breath = Math.sin(t * 1.8);
    const idle = {
      x: 0, rock: breath * 0.8 + kite * Math.sin(t * 2.2) * 6, float: kite * (2.4 + Math.sin(t * 1.7) * 0.8), duck, head: -look * 10 + yawn * -16 + kite * -6,
      frill: kite, footN: 0, footF: 0,
    };
    // The waddle: the egg rocks forward and back on its round bottom, the feet shuffle in turn.
    const p = u * TAU;
    const walk = { x: 0, rock: Math.sin(p) * 8, float: Math.abs(Math.sin(p)) * 0.5, duck: 0, head: Math.sin(p - 0.9) * 5, frill: 0, footN: Math.sin(p) * 2.2, footF: -Math.sin(p) * 2.2 };
    // Ducked in and rattling, then the tumble and bonk, frill flared.
    const antic = { x: -1, rock: Math.sin(a.t * 34) * 5, float: 0, duck: 1, head: 0, frill: 0, footN: 0, footF: 0 };
    const strike = { x: 8, rock: 42, float: 1.4, duck: 0, head: 12, frill: 1.15, footN: 2, footF: 2 };
    const out = stateBlend(a, idle, walk, antic, strike);
    return out;
  },
  follow(S, a) {
    return {
      cap: -S.rock * 0.9 - S.float * 3 + Math.sin(a.t * 2.3) * 1.5,
      capHop: S.float * 0.4,
      wag: -S.rock * 0.8 + Math.sin(a.t * 1.4) * 6,
    };
  },
  parts: [
    // The egg rocks about the point it stands on; everything in it rides along.
    { name: 'egg', parent: null, at: (S) => [S.x, -S.float], rot: (S) => S.rock * D2R },
    { name: 'neck', parent: 'egg', at: (S) => [3.6, -15 + S.duck * 6.4], rot: (S) => S.head * D2R },
    ...passOf(false),
    ...passOf(true),
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [5, 13] },
  ],
});

// ---------- Still (portraits, the monster book) ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
const rot = (shapes, ang, px, py) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const R2 = ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
  return shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => R2([x + (sh.x ?? 0), y + (sh.y ?? 0)])) } : { ...sh, ...(([x, y]) => ({ x, y }))(R2([sh.x, sh.y])) }));
};
export function basiliskStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const [nx, ny] = [3.6, -15];
  const tail = [];
  let [px, py] = [-8.4, -6.4];
  let ang = 196;
  for (let k = 0; k < 3; k++) {
    tail.push(...rot(shift(tailShapes(k)(), px - 1.4, py - 2), ang * D2R, px, py));
    px += Math.cos(ang * D2R) * 3.4;
    py += Math.sin(ang * D2R) * 3.4;
    ang -= 38;
  }
  const fan = FAN.flatMap((fa, k) => rot(shift(spineShapes(k)(), nx + 0.6 - 3, ny - 2.4 - 12.4), fa[0] * D2R, nx + 0.6, ny - 2.4));
  return {
    w: 40,
    h: 40,
    res: 3,
    shapes: shift(
      [
        ...tail,
        ...shift(footShapes(true)(), 2.6 - 2.5, -1.2 - 1.5),
        ...shift(bodyShapes(), 0.4 - 7, -7.6 - 10),
        ...fan,
        ...shift(headShapes(), nx - 5, ny - 13),
        ...shift(faceShapes(fm)(), nx - 5, ny - 13),
        ...rot(shift(capShapes(), nx + 4.2 - 6, ny - 9.6 - 7), -14 * D2R, nx + 4.2, ny - 9.6),
        ...shift(shellShapes(), -10, -12.6),
        ...shift(footShapes(false)(), -2.4 - 2.5, -0.8 - 1.5),
      ],
      20,
      36,
    ),
  };
}
