// The Sailfish Fencer's body (2026-11-26): a copy of the fish base (render/mobs/blankfish.js), its round
// fish only, by way of the Beluga Lifeguard's dressable copy (render/beluga/whalebase.js, whose dress
// hooks it started from), kept here so the base itself stays clean (the player: "never edit the bases
// just copy the base and edit that"). A dress, `look`, for a monster on it (dressedSailfish(look)):
//   look.P      its own shape over the round fish's (spine, pec, sail, tail, swim, speed, scale, turn
//               ...); P.float how far its belly floats over the floor; P.playful 0 drops the base's
//               little playful flip at rest; P.front its own head front, in place of the base's round
//               nose: { pts: [[ahead, down], ...] from the chin round to the top of the head (units,
//               from the front joint, before scale), tip: the index of its tip }
//   look.C      its own colours over the base's (lt, base, sh, deep); look.CF its fins' (pectorals,
//               tail), look.CS its sail's; look.inks { body: [back, belly], fin, sail } their soft
//               outlines (each its own darker colour, never near-black)
//   look.fxC    its own colours for the base's bubbles and sparkles { fill, edge, glint, spark }
//   look.bodyFill (ctx, a, sk, K) its own body colouring in place of the base's (clipped to the body)
//   look.paint  (ctx, a, sk, K) its own markings on the body, clipped to it
//   look.face   (ctx, a, sk, K) its own face; K.headFrame(ctx, a) puts the canvas in the head's own
//               frame (x ahead, y down, units before scale, 0 at the front joint)
//   look.over / look.under  { part: (ctx, a, mode, K) } over / under a part, in both passes (mode
//               'line': its outline, 'fill': itself); parts sail, pecF, tail, body, pecN, face
//   look.moves  its own moves over the base's; look.pick (m, a, st, pool) which one an attack plays;
//               look.pleased the move a gloat plays (the base: wiggle)
//   look.pose   (m, a, out, K, mv, mt) its own act on the channels: dorsal the sail raised (+) or
//               folded flat (-), pnA / pnW the near pectoral's own angle (degrees from ahead, + toward
//               the belly) and how much it holds it, pfA / pfW the far one's, d1..d6 the dress's own;
//               a.lookBack (true) turns it round to look the other way (the base's own turn plays)
//   look.spot   (sk, what) its own place for an effect (else the base's)
//   look.fx     (ctx, m, a, K) live extras over everything (in the body's own way round)
// What this copy adds to the round fish: a tall sail of a dorsal fin (P.sail: rooted along the back
// inside the body, its rays raised and fanned out or folded flat back along the back on `dorsal`,
// swung on its own damped spring and rippling softly, with a softly scalloped round top edge), a forked
// tail with round lobes (tail.kind 'fork'), each part's own outline colour, the near pectoral drawn
// before the face (a fin never covers the face). Left out: the seahorse, the whale calf, the mouth
// and jaw (the dress draws its own), the base's guide lines and its idle bubble.
// The base's own notes follow.
//
// (base) The fish base (2026-11-25): blank chibi swimmers that float through the air, made for a fish
// (base) from the start, nothing carried over from another base; only the engine is shared (rig.js's
// (base) springs). Drawn live like the other blank bases: one smooth shape over its bones, outlined
// (base) only on its outer edge (an outline pass, then a fill pass), in a soft ink, never near-black.
// (base)   spine   a chain of joints from the nose to the tail's root, each with its own girth over
// (base)           the back and under the belly; the body is one smooth outline over them. It turns
// (base)           about its middle (`pitch`), curls toward the back or the belly (`bend`), nods its
// (base)           head end (`head`)
// (base)   swim    a travelling wave runs down the spine from the middle to the tail fin, its phase run on
// (base)           by the distance swum (never the clock), so it never looks as if it slides; at rest a
// (base)           slow scull. The head recoils a touch against each beat.
// (base)   fins    pectorals (near over the body, far behind it), the tail fin; each rooted inside the
// (base)           body and carried on its own damped spring, so the body's starts, stops and turns
// (base)           swing them on, overshooting and settling.
// (base)   turning it mirrors round, staying level and never on the spot: a quick swish of the tail
// (base)           first, the flip, then a little overshoot wiggle the new way, settling.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2' };
const INK = '#7f6982'; // (the bases' shared soft ink)
const FXC0 = { fill: 'rgba(236,244,255,0.62)', edge: '#94aedb', glint: '#ffffff', spark: 'rgba(176,150,200,0.8)' };

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

// ---------- The round fish (units: game px at scale 1; x forward, y down; about the middle) ----------
// spine: joints from the nose to the tail's root: [x, y, girth over the back, girth under the belly];
//   `pivot` the joint it turns about. sail: the tall dorsal, rooted along [s0, s1] (along the spine
//   from the nose): h its height raised, prof each ray's share of it (front to back), up / fan the
//   front ray's lean back raised and how much more each one behind leans, flat its lean folded,
//   foldLen how much shorter the rays lie folded, flutter (degrees) its soft ripple.
const ROUNDFISH = {
  name: 'Round fish',
  scale: 1,
  spine: [[11, 0.8, 6.2, 5.8], [7, -0.2, 9.4, 8.8], [2, -0.6, 10.4, 9.8], [-3, -0.4, 9.6, 9], [-7.6, 0, 7, 6.4], [-11.6, 0.3, 4, 3.7], [-14.4, 0.2, 2.4, 2.2]],
  pivot: 2,
  nose: 2.6,
  pec: { at: [10.6, -2.2], len: 6, w: 4.2, ang: 142, scull: 22, tuck: 170, out: 96 },
  sail: null,
  tail: { kind: 'fan', len: 8.8, w: 2.4, spread: 30, notch: 0.86 },
  swim: { amp: 19, fin: 1.9, lag: 0.85, beats: 2.6, idle: 0.55, scull: 0.9, paddle: 24, recoil: 4, bob: 0.8, flutter: 6 },
  speed: 26,
  lean: 2,
  swimFins: -0.15,
  turn: [0.13, 0.42, 34],
  float: 2.4,
  playful: 1,
  moves: ['ram'],
};

// ---------- The moves (units: x, rise in body heights; angles in degrees) ----------
// pitch: + nose down; bend: + the tail curling up over the back; head: + nodding down; fins: +
// spread out, − tucked back; dorsal: the sail raised (+) or folded flat (−); spread: the tail fanned;
// thrash: beating the tail hard; tumble: whole turns over (− backward), not on a spring.
export const FISH_MOVES = {
  // A slap: coiled with the tail tucked under, then it whips round up over the back and down on
  // the target in front, the nose ducking under it.
  tailSlap: {
    anticT: 0.22,
    keys: [
      [0, { x: -0.04, pitch: -16, bend: -42, head: -6, fins: 0.7, dorsal: 1, spread: 0.5 }],
      [0.1, { x: 0.05, pitch: 30, bend: 118, head: 10, fins: -0.4, dorsal: 0.2, spread: 1 }, 'out'],
      [0.18, { x: 0.06, pitch: 24, bend: 96, spread: 0.9 }, 'in'],
      [0.36, { x: 0.03, pitch: 2, bend: -10, head: 0, fins: 0.3, dorsal: 0.4, spread: 0.4 }, 'io'],
      [0.66, {}],
    ],
    spark: [0.1],
    sparkAt: 'slap',
    gust: [0.07],
  },

  // A charge: drawing back, fins out, then shooting forward head first, the tail thrashing, a
  // bonk and a little bounce back.
  ram: {
    anticT: 0.26,
    keys: [
      [0, { x: -0.13, pitch: -6, head: -8, fins: 0.8, dorsal: -0.4, spread: 0.4, thrash: 0.5 }],
      [0.1, { x: 0.38, pitch: 6, head: 8, fins: -1, dorsal: -1, spread: 0.2, thrash: 1 }, 'out'],
      [0.17, { x: 0.3, pitch: -10, head: -12, fins: 0.6, dorsal: 0.6, spread: 0.9, thrash: 0.3 }, 'out'],
      [0.34, { x: 0.25, pitch: -2, head: 0, fins: 0.2, thrash: 0, dorsal: 0.2 }, 'io'],
      [0.72, {}],
    ],
    spark: [0.1],
    sparkAt: 'nose',
    lines: [0, 0.15],
  },
  // A leap: a dip, up nose first, level over the top, down nose first and a wobble to recover.
  jump: {
    anticT: 0.16,
    keys: [
      [0, { rise: -0.08, pitch: 12, bend: -20, fins: -0.2 }],
      [0.16, { rise: 0.7, pitch: -38, bend: 26, fins: -0.8, spread: 1, dorsal: -0.5, thrash: 0.7 }, 'out'],
      [0.36, { rise: 0.86, pitch: 0, bend: 0, fins: -0.6, thrash: 0.2 }, 'io'],
      [0.56, { rise: 0.16, pitch: 30, bend: -14, fins: 0.1, dorsal: 0 }, 'in'],
      [0.66, { rise: -0.06, pitch: 6, bend: 12, fins: 0.8, spread: 0.8, dorsal: 0.6 }, 'out'],
      [0.94, {}, 'io'],
    ],
    splash: [0.04, 0.66],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { x: -0.03, fins: 0.5, bend: -8 }],
      [0.08, { x: 0.24, pitch: 4, fins: -1, dorsal: -1, thrash: 1, spread: 0.3 }, 'out'],
      [0.3, { x: 0.28, pitch: 2, fins: -0.8, thrash: 0.7 }],
      [0.46, { x: 0.26, pitch: -6, fins: 0.8, thrash: 0, dorsal: 0.5, spread: 0.9, bend: 14 }, 'io'],
      [0.82, {}],
    ],
    lines: [0, 0.32],
  },
  // A dart away: back and up, the tail tucking forward under it, fins flared.
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { fins: 0.4 }],
      [0.12, { x: -0.28, rise: 0.22, pitch: -22, bend: -30, fins: 1, dorsal: 1, spread: 1, thrash: 0.6 }, 'out'],
      [0.32, { x: -0.3, rise: 0.08, pitch: -4, bend: 6, fins: 0.5, thrash: 0 }, 'in'],
      [0.5, { x: -0.28, rise: 0, pitch: 2, bend: 0, fins: 0.2 }, 'io'],
      [0.84, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.06, pitch: -16, head: -10, bend: 30, fins: 1, dorsal: 1, spread: 1 }, 'out'],
      [0.2, { x: -0.06, pitch: -9, bend: 12, fins: 0.6 }],
      [0.4, { x: -0.03, pitch: -2, bend: 0, fins: 0.2, dorsal: 0.3 }, 'io'],
      [0.76, {}],
    ],
    burst: [0.05],
  },
  // Knocked over: thrown back, tumbling over backward once, sinking a little, dazed and limp; a
  // shake and it rights itself.
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.08, { x: -0.06, pitch: -10, bend: 30, fins: 1, dorsal: 1, spread: 1 }, 'out'],
      [0.52, { x: -0.16, rise: -0.12, pitch: 14, bend: -16, fins: -0.7, dorsal: -1, spread: 0, tumble: -1 }, 'io'],
      [0.62, { rise: -0.09, pitch: 11, tumble: -1 }, 'out'],
      [1.1, { x: -0.16, rise: -0.14, pitch: 16, bend: -18, fins: -0.7, dorsal: -1, tumble: -1 }, 'io'],
      [1.38, { x: -0.08, rise: 0.02, pitch: -6, bend: 10, fins: 0.8, dorsal: 0.6, spread: 0.8, thrash: 0.6, tumble: -1 }, 'io'],
      [1.7, { tumble: -1 }, 'io'],
    ],
    burst: [0.08],
  },
  // Pleased: a happy wiggle, up a little, the tail wagging fast, everything fanned out.
  wiggle: {
    anticT: 0.1,
    keys: [
      [0, { rise: -0.03, fins: 0.4 }],
      [0.14, { rise: 0.16, pitch: -12, fins: 1, dorsal: 1, spread: 1, thrash: 1 }, 'out'],
      [0.6, { rise: 0.12, pitch: -9, fins: 0.9, dorsal: 1, spread: 1, thrash: 1 }],
      [0.76, { rise: 0, pitch: 2, fins: 0.2, thrash: 0 }, 'in'],
      [1.05, {}],
    ],
    splash: [0.2],
  },
};
const moveLen = (mv) => mv.keys[mv.keys.length - 1][0];
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
// (0..1 through the `len` seconds after the latest of these moments, or −1)
const after = (moments, t, len) => {
  let u = -1;
  for (const m0 of moments ?? []) if (t >= m0 && t <= m0 + len) u = (t - m0) / len;
  return u;
};

const CH = ['x', 'rise', 'lift', 'sink', 'pitch', 'head', 'bend', 'fins', 'dorsal', 'spread', 'thrash', 'pnA', 'pnW', 'pfA', 'pfW', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a dress ----------
function sailRig(look = {}) {
  const P = { ...ROUNDFISH };
  for (const [k, v] of Object.entries(look.P ?? {})) P[k] = v && typeof v === 'object' && !Array.isArray(v) && P[k] && typeof P[k] === 'object' && !Array.isArray(P[k]) ? { ...P[k], ...v } : v;
  const C = { ...C0, ...(look.C ?? {}) };
  const CF = { ...C, ...(look.CF ?? {}) };
  const CS = { ...CF, ...(look.CS ?? {}) };
  const INKD = look.ink ?? INK;
  // (each part's own soft outline: the body's from its back's colour to its belly's, the fins', the sail's)
  const INKS = { body: [INKD, INKD], fin: INKD, sail: INKD, ...(look.inks ?? {}) };
  const FXC = { ...FXC0, ...(look.fxC ?? {}) };
  const TABLE = { ...FISH_MOVES, ...(look.moves ?? {}) };
  const PLEASED = look.pleased ?? 'wiggle';
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
  const WAVEW = REST.map((_, j) => (j > pv ? ((j - pv) / (n - 1 - pv)) ** 1.2 : 0));
  const WSUM = WAVEW.reduce((x, y) => x + y, 0) + 1;
  const BENDW = WAVEW;
  const BSUM = WSUM;
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
  // (the head's own front: ahead of the front joint, along its way)
  const F0 = unit(minus(REST[0], REST[1]));
  if (P.front) {
    for (const [ax, dy] of P.front.pts) {
      const q = plus(REST[0], plus(times(F0, sc(ax)), times([-F0[1], F0[0]], sc(dy))));
      fore = Math.max(fore, q[0]);
      top = Math.min(top, q[1]);
      bottom = Math.max(bottom, q[1]);
    }
  } else fore += sc(P.nose);
  // (the sail is not counted in its height: its box is its body; the sail rises over it)
  if (P.tail) aft -= sc(P.tail.len);
  const FLOAT = bottom - REST[pv][1] + sc(P.float);
  const H = FLOAT + (REST[pv][1] - top);
  const bodyLen = fore - aft;
  const CYC = P.speed / P.swim.beats;
  const FLUT = P.speed / (P.swim.flutter ?? 6);

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
    const relAt = (j) => {
      if (j > pv) return REL[j] + ((S.bend + TB) * D2R * BENDW[j]) / BSUM + amp * WAVEW[j] * Math.sin(ph - P.swim.lag * (j - pv));
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
    const sk = { pos, dirs, nrm, back, belly, ang, swim, ph, S, s };
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
    // The head's own frame: ahead along the front segment, down across it (the face's frame).
    const f0 = times(dirs[0], -1);
    const n0 = nrm[0];
    sk.head = { o: pos[0], f: f0, d: times(n0, -1) };
    // (a point in the head's frame, units before scale)
    sk.inHead = (x, y) => plus(pos[0], plus(times(f0, sc(x)), times(n0, -sc(y))));
    const cap = [];
    if (P.front) {
      for (const [x, y] of P.front.pts) cap.push(sk.inHead(x, y));
      sk.nosePt = cap[P.front.tip];
    } else {
      for (let deg = -72; deg <= 72; deg += 18) {
        const r = deg * D2R;
        cap.push(plus(plus(pos[0], times(f0, sc(P.nose) * Math.cos(r))), times(n0, Math.sin(r) * (r > 0 ? back[0] : belly[0]))));
      }
      sk.nosePt = plus(pos[0], times(f0, sc(P.nose)));
    }
    sk.mouthPt = sk.nosePt;
    const outl = [];
    for (let j = 0; j < n; j++) outl.push(plus(pos[j], times(nrm[j], back[j])));
    const dl = dirs[n - 2];
    outl.push(plus(pos[n - 1], times(dl, Math.min(back[n - 1], belly[n - 1]) * 0.85)));
    for (let j = n - 1; j >= 0; j--) outl.push(plus(pos[j], times(nrm[j], -belly[j])));
    outl.push(...cap);
    sk.outline = outl;

    // ---------- The fins: each on its own damped spring ----------
    const flipS = st.fsShown ? -1 : 1;
    const wx = (m.x ?? 0) + flipS * px;
    const wy = (m.y ?? 0) + py;
    let ax = 0;
    let ay = 0;
    let al = 0;
    const steady = dt > 0 && st.fsW !== undefined && Math.hypot(wx - st.fsW[0], wy - st.fsW[1]) < 30;
    if (steady) {
      const vx = (wx - st.fsW[0]) / dt;
      const vy = (wy - st.fsW[1]) / dt;
      const om = wrapPi(angP - st.fsA) / dt;
      if (st.fsVel) {
        const f = Math.min(1, dt * 20);
        st.fsAcc = [mix(st.fsAcc[0], clamp((vx - st.fsVel[0]) / dt, -1800, 1800), f), mix(st.fsAcc[1], clamp((vy - st.fsVel[1]) / dt, -1800, 1800), f), mix(st.fsAcc[2], clamp((om - st.fsVel[2]) / dt, -300, 300), f)];
        [ax, ay, al] = st.fsAcc;
        ax *= flipS;
      }
      st.fsVel = [vx, vy, om];
    } else {
      st.fsVel = null;
      st.fsAcc = [0, 0, 0];
    }
    st.fsW = [wx, wy];
    st.fsA = angP;
    const FS = (st.fsFin ??= {});
    // (one fin's swing on its damped spring: `u` the way it points; easing into a soft stop near
    // `max` instead of hitting a wall; sub-stepped, so any frame rate swings it the same)
    const swing = (key, u, k, c, gain, lag, max = 0.7) => {
      const f = (FS[key] ??= { o: 0, w: 0 });
      if (!(dt > 0)) return f.o;
      const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
      const h = dt / steps;
      const push = gain * (u[1] * -ax - u[0] * -ay) * -1 - lag * al;
      const z = max * 0.6;
      for (let i = 0; i < steps; i++) {
        let acc = -k * f.o - c * f.w + push;
        const over = Math.abs(f.o) - z;
        if (over > 0) acc -= Math.sign(f.o) * k * 5 * over + c * 6 * Math.min(1, over / (max - z)) * f.w;
        f.w += acc * h;
        f.o += f.w * h;
      }
      if (!Number.isFinite(f.o) || Math.abs(f.o) > max * 3) Object.assign(f, { o: 0, w: 0 });
      return f.o;
    };
    const fins = clamp(S.fins, -1, 1.2);
    // The flippers: sculling slowly at rest (near and far out of step), tucked back and paddling a
    // little in time with the flukes swimming; spread or tucked by `fins`; held to the dress's own
    // angle by pnW / pfW.
    const pecs = {};
    if (P.pec) {
      const F = P.pec;
      const fp = st.fsFp ?? 0;
      for (const side of ['near', 'far']) {
        const far = side === 'far';
        const stroke = Math.sin(fp + (far ? 2.1 : 0)) * F.scull * (1 - swim) * (st.fsCalm ?? 1) + Math.sin(ph - 1.2 + (far ? 1.4 : 0)) * P.swim.paddle * swim + Math.sin(ph * 2) * 10 * thr;
        let goal = mix(F.ang, F.tuck, swim * 0.4) + stroke;
        goal = fins > 0 ? mix(goal, F.out, fins * 0.75) : mix(goal, F.tuck, -fins);
        goal += (far ? -9 : 0) + (st.fsTF ?? 0) * 30;
        const hw = clamp(far ? S.pfW : S.pnW, 0, 1);
        if (hw > 0.001) goal = mix(goal, far ? S.pfA : S.pnA, hw);
        const root = sk.along(sc(F.at[0] - (far ? 0.7 : 0)), sc(F.at[1] + (far ? 1.1 : 0)));
        const fwd = sk.fwdAt(sc(F.at[0]));
        let an = Math.atan2(fwd[1], fwd[0]) + goal * D2R;
        an += swing(`pec${side}`, dirOf(an), 150, 11, 0.03, 0.5) * (1 - 0.7 * hw);
        pecs[side] = { root, ang: an, len: sc(F.len), w: sc(F.w) };
        pecs[side].tip = plus(root, times(dirOf(an), sc(F.len) * 0.92));
      }
    }
    sk.pecs = pecs;
    // The sail: rays rooted inside the back, raised and fanned out (`dorsal` +) or folded flat back
    // along it (−); the whole sail swung on its own damped spring by the body's starts, stops and
    // turns, and rippling softly along its edge (the ripple run on by the distance swum).
    if (P.sail) {
      const F = P.sail;
      const raise = clamp(S.dorsal, -1, 1.35);
      const rz = ease((raise + 1) / 2);
      const over = Math.max(0, raise - 1);
      const sm = sc((F.s0 + F.s1) / 2);
      const mid0 = sk.along(sm, 0);
      const out0 = unit(minus(sk.along(sm, 1), mid0));
      const sway = swing('sail', out0, 120, 10, 0.022, 0.55, 0.45) / D2R;
      const N = F.prof.length;
      const bases = [];
      const tips = [];
      const inset = sc(F.inset ?? 1.6);
      for (let i = 0; i < N; i++) {
        const f = i / (N - 1);
        const sPos = sc(mix(F.s0, F.s1, f));
        const b = sk.along(sPos, sk.girth(sPos, 1) - inset);
        const nn = unit(minus(sk.along(sPos, 1), sk.along(sPos, 0)));
        const back = times(sk.fwdAt(sPos), -1);
        const flut = (F.flutter ?? 0) * Math.sin((st.fsFl ?? 0) - i * 1.15) * mix(0.35, 1, swim) * (0.3 + 0.7 * rz);
        const up = F.up + f * F.fan * (1 + over * 0.8) - over * 10 * (1 - f);
        const th = (mix(F.flat + f * 3, up, rz) + sway * (0.35 + 0.65 * f) + flut * f) * D2R;
        const rd = unit(plus(times(nn, Math.cos(th)), times(back, Math.sin(th))));
        const L = sc(F.h) * F.prof[i] * mix(F.foldLen ?? 0.35, 1, rz) * (1 + over * 0.08);
        bases.push(b);
        tips.push(plus(b, times(rd, L + inset)));
      }
      // (the outline: in at the front root, up the leading edge, along the top in soft round
      // scallops between the rays' tips, down behind the last, back along inside the body)
      const pts = [sk.along(sc(F.s0) - sc(0.6), sk.girth(sc(F.s0), 1) - inset * 1.3)];
      for (let i = 0; i < N; i++) {
        pts.push(tips[i]);
        if (i < N - 1) pts.push(between(between(tips[i], tips[i + 1], 0.5), between(bases[i], bases[i + 1], 0.5), F.scallop ?? 0.07));
      }
      pts.push(sk.along(sc(F.s1) + sc(0.8), sk.girth(sc(F.s1), 1) - inset * 1.2));
      pts.push(sk.along(sm, sk.girth(sm, 1) - inset * 2.6));
      sk.sail = { pts, tips, bases, rz };
    }
    // The tail fin: the wave carried on into it, a beat behind the last joint, swung on by the
    // body's moves; fanned open by `spread`.
    if (P.tail) {
      const T = P.tail;
      const root = pos[n - 1];
      const waveFin = amp * P.swim.fin * Math.sin(ph - P.swim.lag * (n - pv));
      const bendFin = (S.bend * D2R * 1.4) / WSUM;
      let ta = ang[n - 2] + waveFin + bendFin;
      ta += swing('tail', dirOf(ta), 200, 13, 0.035, 0.9);
      const half = (T.spread + clamp(S.spread, 0, 1.2) * T.spread * 0.45 - (1 - clamp(S.spread, 0, 1)) * 6) * D2R;
      sk.tail = { root, ang: ta, half, tip: plus(root, times(dirOf(ta), sc(T.len) * 0.9)) };
    }
    sk.slapPt = sk.tail ? plus(sk.tail.root, times(dirOf(sk.tail.ang), sc(P.tail.len) * 0.8)) : pos[n - 1];
    sk.pivot = pos[pv];
    sk.fwd = times(dirs[pv], -1);
    sk.down = times(nrm[pv], -1);
    return sk;
  }

  // ---------- Drawing ----------
  const tone = (a, c, al = 1) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return al >= 1 ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const edge = (ctx, col = INKD, w = 2) => {
    ctx.strokeStyle = col;
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
  // The head's own frame (x ahead, y down, units before scale, 0 at the front joint).
  const headFrame = (ctx, a) => {
    const h = a.fk.head;
    ctx.transform(h.f[0] * s, h.f[1] * s, h.d[0] * s, h.d[1] * s, h.o[0], h.o[1]);
  };
  // The body: one smooth shape; lit along the back, softly shaded under the belly (or the dress's own
  // colouring); its outline its own colour, from the back's down to the belly's.
  function drawBody(ctx, a, mode) {
    const sk = a.fk;
    bodyPath(ctx, sk);
    if (mode === 'line') {
      const [ib, iu] = INKS.body;
      if (ib === iu) return edge(ctx, ib);
      const top = plus(sk.pivot, times(sk.nrm[pv], sk.back[pv]));
      const low = plus(sk.pivot, times(sk.nrm[pv], -sk.belly[pv]));
      const g = ctx.createLinearGradient(top[0], top[1], low[0], low[1]);
      g.addColorStop(0.15, ib);
      g.addColorStop(0.75, iu);
      return edge(ctx, g);
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip();
    if (look.bodyFill) look.bodyFill(ctx, a, sk, KIT);
    else {
      const sMid = SJ[pv];
      const big = Math.max(...BACK);
      soft(ctx, sk.along(SJ[1], sk.back[1] * 0.42), sk.back[1] * 1.05, C.lt, 0.9);
      soft(ctx, sk.along(sMid + sc(3), sk.back[pv] * 0.5), big * 1.2, C.lt, 0.6);
      soft(ctx, sk.along(sMid + sc(1), -sk.belly[pv] * 0.95), sk.belly[pv] * 1.05, C.sh, 0.6);
      soft(ctx, sk.pos[n - 1], sc(5), C.sh, 0.35);
    }
    if (look.paint) {
      ctx.save();
      look.paint(ctx, a, sk, KIT);
      ctx.restore();
    }
    ctx.restore();
  }
  // The face: the dress's own, over the body (fill pass only: a face is never outlined).
  function drawFace(ctx, a, mode) {
    if (mode === 'line' || !look.face) return;
    ctx.save();
    look.face(ctx, a, a.fk, KIT);
    ctx.restore();
  }
  // A pectoral: a rounded paddle from its root inside the body.
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
    const pts = leafPts(f);
    ctx.beginPath();
    loopPath(ctx, pts);
    if (mode === 'line') return edge(ctx, INKS.fin);
    if (!far) {
      // (lying over the body: a soft deeper edge where it does, fading out at its root)
      ctx.save();
      bodyPath(ctx, sk);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      const hole = plus(f.root, times(dirOf(f.ang), f.len * 0.12));
      ctx.moveTo(hole[0] + f.len * 0.5, hole[1]);
      ctx.arc(hole[0], hole[1], f.len * 0.5, 0, TAU);
      ctx.clip('evenodd');
      ctx.beginPath();
      loopPath(ctx, pts);
      ctx.strokeStyle = tone(a, CF.deep);
      ctx.lineWidth = 1.1;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.fillStyle = tone(a, far ? CF.sh : CF.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.clip();
    const u = dirOf(f.ang);
    const v = [-u[1], u[0]];
    if (!far) soft(ctx, plus(f.root, times(u, f.len * 0.3)), f.len * 0.6, CF.lt, 0.75);
    soft(ctx, plus(f.root, times(u, f.len * 0.95)), f.len * 0.55, far ? CF.deep : CF.sh, far ? 0.45 : 0.6);
    // a few soft rays fanning out from the root
    ctx.strokeStyle = tone(a, far ? CF.deep : CF.sh);
    ctx.lineWidth = Math.max(0.35, sc(0.42));
    ctx.lineCap = 'round';
    ctx.globalAlpha *= 0.75;
    for (const y of [-0.18, 0.16]) {
      ctx.beginPath();
      ctx.moveTo(...plus(f.root, plus(times(u, f.len * 0.4), times(v, y * f.w * 0.4))));
      ctx.lineTo(...plus(f.root, plus(times(u, f.len * 0.82), times(v, y * f.w))));
      ctx.stroke();
    }
    ctx.restore();
  }
  // The sail: its scalloped shape, lit at its root and along its leading edge, its rays as soft lines.
  const sailPath = (ctx, sk) => {
    ctx.beginPath();
    loopPath(ctx, sk.sail.pts);
  };
  function drawSail(ctx, a, mode) {
    const sk = a.fk;
    if (!sk.sail) return;
    const Sl = sk.sail;
    sailPath(ctx, sk);
    if (mode === 'line') return edge(ctx, INKS.sail);
    ctx.fillStyle = tone(a, CS.base);
    ctx.fill();
    ctx.save();
    sailPath(ctx, sk);
    ctx.clip();
    const N = Sl.tips.length;
    const b0 = Sl.bases[0];
    const bN = Sl.bases[N - 1];
    const mid = between(b0, bN, 0.5);
    const tall = Math.hypot(...minus(Sl.tips[1], Sl.bases[1]));
    // (a deeper shade toward its scalloped edge, lit at its root and up its leading edge)
    for (let i = 0; i < N; i += 2) soft(ctx, Sl.tips[i], tall * 0.4, CS.sh, 0.5);
    soft(ctx, between(b0, Sl.tips[0], 0.45), tall * 0.75, CS.lt, 0.75);
    soft(ctx, mid, tall * 0.55, CS.lt, 0.5);
    ctx.strokeStyle = tone(a, CS.deep);
    ctx.lineWidth = Math.max(0.35, sc(0.45));
    ctx.lineCap = 'round';
    ctx.globalAlpha *= 0.7;
    for (let i = 0; i < N; i++) {
      ctx.beginPath();
      ctx.moveTo(...between(Sl.bases[i], Sl.tips[i], 0.12));
      ctx.quadraticCurveTo(...plus(between(Sl.bases[i], Sl.tips[i], 0.55), times(sk.fwd, sc(0.25))), ...between(Sl.bases[i], Sl.tips[i], 0.9));
      ctx.stroke();
    }
    ctx.restore();
  }
  // The tail fin: a fan, or a fork of two round lobes with a soft notch between.
  const tailPts = (sk) => {
    const T = P.tail;
    const { root, ang, half } = sk.tail;
    const L0 = sc(T.len);
    const u = dirOf(ang);
    const v = [-u[1], u[0]];
    const w0 = sc(T.w);
    const ray = (k, l) => plus(root, times(dirOf(ang + half * k), L0 * l));
    if (T.kind === 'fork') {
      return [plus(root, times(u, -w0)), plus(root, times(v, w0)), plus(between(plus(root, times(v, w0)), ray(1, 1), 0.5), times(v, sc(0.5))), ray(1.06, 0.98), ray(0.94, 1.08), ray(0.74, 1.0), ray(0.42, 0.66), ray(0, T.notch), ray(-0.42, 0.66), ray(-0.74, 1.0), ray(-0.94, 1.08), ray(-1.06, 0.98), plus(between(plus(root, times(v, -w0)), ray(-1, 1), 0.5), times(v, -sc(0.5))), plus(root, times(v, -w0))];
    }
    return [plus(root, times(u, -w0)), plus(root, times(v, w0)), plus(between(plus(root, times(v, w0)), ray(1, 1), 0.55), times(v, -sc(0.3))), ray(1, 1), ray(0.62, 1.02), ray(0.22, 0.95), ray(0, T.notch), ray(-0.22, 0.95), ray(-0.62, 1.02), ray(-1, 1), plus(between(plus(root, times(v, -w0)), ray(-1, 1), 0.55), times(v, sc(0.3))), plus(root, times(v, -w0))];
  };
  function drawTail(ctx, a, mode) {
    const sk = a.fk;
    if (!sk.tail) return;
    const pts = tailPts(sk);
    ctx.beginPath();
    loopPath(ctx, pts);
    if (mode === 'line') return edge(ctx, INKS.fin);
    ctx.fillStyle = tone(a, CF.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    loopPath(ctx, pts);
    ctx.clip();
    const { root, ang, half } = sk.tail;
    const L = sc(P.tail.len);
    soft(ctx, plus(root, times(dirOf(ang), L * 0.2)), L * 0.7, CF.lt, 0.85);
    soft(ctx, plus(root, times(dirOf(ang + half * 0.85), L * 0.95)), L * 0.45, CF.sh, 0.55);
    soft(ctx, plus(root, times(dirOf(ang - half * 0.85), L * 0.95)), L * 0.45, CF.sh, 0.55);
    ctx.strokeStyle = tone(a, CF.deep);
    ctx.lineWidth = Math.max(0.35, sc(0.42));
    ctx.lineCap = 'round';
    ctx.globalAlpha *= 0.7;
    for (const k of [-0.75, -0.35, 0.35, 0.75]) {
      ctx.beginPath();
      ctx.moveTo(...plus(root, times(dirOf(ang + half * k * 0.5), L * 0.25)));
      ctx.lineTo(...plus(root, times(dirOf(ang + half * k), L * 0.8)));
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- Effects (the base's: sparkles, bubbles, speed lines; in the dress's colours) ----------
  const twinkle = (ctx, x, y, r, an, fill) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(an);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const q = (i * Math.PI) / 2;
      const q2 = q + Math.PI / 2;
      if (i === 0) ctx.moveTo(r, 0);
      ctx.quadraticCurveTo(Math.cos(q + Math.PI / 4) * r * 0.18, Math.sin(q + Math.PI / 4) * r * 0.18, Math.cos(q2) * r, Math.sin(q2) * r);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = FXC.spark;
    ctx.lineWidth = Math.max(0.3, r * 0.1);
    ctx.stroke();
    ctx.restore();
  };
  const bubbleAt = (ctx, x, y, r, al) => {
    if (al <= 0.01 || r <= 0.05) return;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = FXC.fill;
    ctx.fill();
    ctx.strokeStyle = FXC.edge;
    ctx.lineWidth = Math.max(0.3, r * 0.2);
    ctx.stroke();
    ctx.strokeStyle = FXC.glint;
    ctx.lineWidth = Math.max(0.3, r * 0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.6, -2.5, -1.6);
    ctx.stroke();
    ctx.restore();
  };
  const spotBase = (sk, what) => {
    if (what === 'nose' || what === 'mouth') return sk.nosePt;
    if (what === 'slap') return sk.slapPt;
    return sk.pivot;
  };
  const spot = (sk, what) => look.spot?.(sk, what) ?? spotBase(sk, what);
  function drawFx(ctx, m, a) {
    const sk = a.fk;
    if (!sk) return;
    const mv = a.fsMove?.mv;
    const t = a.fsMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    for (const s0 of mv.spark ?? []) {
      const u = after([s0], t, 0.24);
      if (u < 0) continue;
      const [x, y] = spot(sk, mv.sparkAt);
      const e = 1 - (1 - u) ** 3;
      ctx.globalAlpha = 1 - u;
      twinkle(ctx, x, y, H * 0.13 * (0.5 + 0.7 * e), u * 0.7, '#ffffff');
      twinkle(ctx, x, y, H * 0.06 * (0.5 + 0.7 * e), u * 0.7 + 0.4, '#fff2a8');
      ctx.globalAlpha = 1;
    }
    for (const b0 of mv.burst ?? []) {
      const u = after([b0], t, 0.7);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      for (let i = 0; i < 4; i++) {
        const q = -2.4 + i * 0.75;
        bubbleAt(ctx, sk.pivot[0] + Math.cos(q) * sc(8 + e * 8), sk.pivot[1] + Math.sin(q) * sc(6 + e * 6) - e * sc(4), sc(0.7 + (i % 2) * 0.5), 1 - u);
      }
    }
    for (const b0 of mv.splash ?? []) {
      const u = after([b0], t, 0.6);
      if (u < 0) continue;
      const e = 1 - (1 - u) ** 2;
      const at = sk.tail ? sk.tail.root : sk.pos[n - 1];
      for (let i = 0; i < 4; i++) bubbleAt(ctx, at[0] - sc(2 + i * 1.5) * e, at[1] + sc((i - 1.5) * 2) - e * sc(3 + i), sc(0.6 + (i % 2) * 0.4), 1 - u);
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.7 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = sc(0.9);
      const bk = minus(sk.pivot, times(sk.fwd, bodyLen * 0.5));
      for (let i = 0; i < 3; i++) {
        const y = bk[1] + sc((i - 1) * 4.5);
        ctx.beginPath();
        ctx.moveTo(bk[0] - sc(2) - sc(6) * k, y);
        ctx.lineTo(bk[0] - sc(11) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && TABLE[m.act.name]) {
      const mv = TABLE[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + moveLen(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.fsAtk) {
        const pool = m.def.moves ?? P.moves;
        st.fsN = (st.fsN ?? m.uid ?? 0) + 1;
        st.fsPick = look.pick ? look.pick(m, a, st, pool) : typeof m.move === 'string' && TABLE[m.move] ? m.move : pool[st.fsN % pool.length];
      }
      st.fsAtk = true;
      const mv = TABLE[st.fsPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.fsAtk = false;
    const ago = a.hurtAgo ?? 9;
    if (m.hp > 0 && ago >= 0 && ago < moveLen(TABLE.hurt)) return [TABLE.hurt, ago, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < moveLen(TABLE[PLEASED])) return [TABLE[PLEASED], gl, 1];
    return [null, 0, 0];
  }
  // Turning round: the way it's shown lags the way it faces for a moment while its tail swishes,
  // then it flips and a little overshoot wiggle plays the new way and settles. (The dress may turn it
  // to look the other way, st.fsBack.)
  const [PRE, POST, SWISH] = P.turn;
  function turning(st, a, m, dt) {
    const want = st.fsBack && m.hp > 0 ? !a.flip : a.flip;
    if (st.fsShown === undefined || m.hp <= 0) {
      st.fsShown = a.flip;
      st.fsTt = null;
      st.fsTB = st.fsTP = st.fsTF = 0;
      return;
    }
    if (!(dt > 0)) return;
    if (st.fsTt == null ? want !== st.fsShown : st.fsTt >= PRE && want !== st.fsShown) st.fsTt = 0;
    let tb = 0;
    let tp = 0;
    let tf = 0;
    if (st.fsTt != null) {
      const t0 = st.fsTt;
      st.fsTt += dt;
      if (t0 < PRE && st.fsTt >= PRE) st.fsShown = want;
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
  // (the sail and the far pectoral behind everything; the near pectoral before the face, so a fin
  // never covers the face)
  const seq = [
    ['sail', drawSail],
    ['pecF', (ctx, a, mode) => drawPec(ctx, a, mode, 'far')],
    ['tail', drawTail],
    ['body', drawBody],
    ['pecN', (ctx, a, mode) => drawPec(ctx, a, mode, 'near')],
    ['face', drawFace],
  ];
  const paintOf = (name, draw, mode) => (ctx, a) => {
    if (!a.fk) return;
    const back = mirrored(a);
    if (back) {
      ctx.save();
      ctx.scale(-1, 1);
    }
    if (look.under?.[name]) {
      ctx.save();
      look.under[name](ctx, a, mode, KIT);
      ctx.restore();
    }
    draw(ctx, a, mode);
    if (look.over?.[name]) {
      ctx.save();
      look.over[name](ctx, a, mode, KIT);
      ctx.restore();
    }
    if (back) ctx.restore();
  };
  const parts = [];
  for (const mode of ['line', 'fill']) for (const [name, draw] of seq) parts.push({ name: `${name}~${mode}`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: paintOf(name, draw, mode) });
  const BOX_W = Math.ceil(bodyLen * 2.6 + sc(30));
  const BOX_H = Math.ceil(H * 2.4 + sc(20));
  const KIT = { P, C, CF, CS, INKS, sailPath, ink: INKD, FXC, sc, s, H, FLOAT, bodyLen, CYC, tone, edge, soft, loopPath, bodyPath, headFrame, twinkle, bubbleAt, spot, mirrored, moves: TABLE };
  const rig = makeRig({
    w: BOX_W,
    h: BOX_H,
    soft: true,
    stride: CYC,
    recover: 1.4,
    springs: Object.fromEntries(
      CH.map((c) => [
        c,
        {
          sink: [10, 6.4],
          lift: [90, 14],
          bend: [150, 17],
          fins: [190, 19],
          spread: [170, 17],
          thrash: [110, 18],
          head: [190, 22],
          pnA: [200, 22],
          pfA: [200, 22],
          pnW: [170, 21],
          pfW: [170, 21],
          dorsal: [230, 15],
          d1: [150, 17],
          d2: [180, 20],
        }[c] ?? [170, 21],
      ]),
    ),
    fast: CH.filter((c) => !['sink', 'lift', 'spread', 'dorsal', 'd3', 'd4', 'd5', 'd6'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.fsActive),
    kick: { pitch: -50, bend: 160, fins: 4 },
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
      // The beats: run on by the distance swum (and the body's own travel and thrashing within a
      // move); at rest, slowly.
      const mx = st.x?.x ?? 0;
      const moved = Math.min(20, Math.abs(mx - (st.fsMx ?? mx)));
      st.fsMx = mx;
      const thr = clamp(st.thrash?.x ?? 0, 0, 1.5);
      const cm = st.fsCalm;
      st.fsPh = ((st.fsPh ?? m.uid * 1.3) + TAU * ((step + moved) / CYC + dt * (P.swim.idle * (1 - swim) * cm + thr * P.swim.beats * 1.6))) % (TAU * 1000);
      st.fsFp = ((st.fsFp ?? 0) + TAU * ((step / CYC) * 0.5 + dt * (P.swim.scull * (1 - swim) * cm + thr * 2))) % (TAU * 1000);
      st.fsFl = ((st.fsFl ?? 0) + TAU * (step / FLUT + dt * (0.9 * (1 - swim) * cm + thr * 4))) % (TAU * 1000);
      // At rest: breathing, a slow bob, an easy glance up or down, a flick of the tail now and then
      // (and, unless the dress says not, a playful little flip).
      const breath = Math.sin(t * (nap ? 1.2 : 2.1));
      const rnd = (k) => frac(Math.sin(k * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453);
      const per = 3.1;
      const blk = Math.floor(t / per);
      const lk = mix(rnd(blk - 1), rnd(blk), ease(((t / per) % 1) / 0.4)) * 2 - 1;
      const flick = hold(t % 6.3, 3, 3.14, 3.3, 3.9);
      const flip = hold(t % 14.3, 9.2, 9.45, 9.65, 10.4) * (P.playful ?? 1);
      const idle = { x: 0, rise: 0, lift: Math.sin(t * 1.15) * sc(0.8) + breath * sc(0.18), sink: 0, pitch: lk * 3 - flip * 16, head: lk * 4, bend: flip * 36 + flick * 12, fins: 0.15 + flip * 0.6, dorsal: flip * 0.8, spread: 0.45 + flip * 0.5, thrash: 0, pnA: 0, pnW: 0, pfA: 0, pfW: 0, d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 };
      const cruise = { ...idle, rise: 0, lift: 0, pitch: P.lean, head: 0, bend: 0, fins: P.swimFins, dorsal: -0.25, spread: 0.25 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = { tumble: 0 };
      for (const c of CH) base[c] = mix(idle[c], cruise[c], swim);
      base.x /= H;
      base.rise /= H;
      const out = mv ? poseIn(mv, mt, anticW, base) : { ...base };
      a.fsTumble = mv ? out.tumble ?? 0 : 0;
      if (m.pose === 'rest') Object.assign(out, { pitch: 1 + lk, head: lk * 2, fins: 0.05, dorsal: 0, spread: 0.3, bend: 0, lift: Math.sin(t * 0.6) * sc(0.9) });
      else if (m.pose === 'curl') Object.assign(out, { bend: -60, head: 14, pitch: 4, fins: -0.3, dorsal: -0.6, spread: 0.2 });
      if (nap) Object.assign(out, { sink: sc(2.4) + H * 0.1, pitch: 7, head: 4, bend: -12, fins: -0.35, dorsal: -1, spread: 0.1, lift: Math.sin(t * 0.7) * sc(0.25) });
      if (m.cine?.mood === 'sad' && m.hp > 0) Object.assign(out, { pitch: 8, head: 10, fins: -0.6, dorsal: -0.7, spread: 0.1 });
      else if (m.cine?.mood === 'happy' && m.hp > 0 && !mv) Object.assign(out, { fins: 0.8, dorsal: 1, spread: 1, thrash: 0.5 + 0.5 * Math.sin(t * 2) });
      if (m.hp <= 0) Object.assign(out, { pitch: 16, head: 6, bend: -16, fins: -0.8, dorsal: -0.9, spread: 0, thrash: 0 });
      st.fsActive = Boolean(mv);
      a.fsMove = mv ? { mv, t: mt } : null;
      out.x *= H;
      out.rise *= H;
      a.lookBack = false;
      look.pose?.(m, a, out, KIT, mv, mt);
      st.fsBack = Boolean(a.lookBack);
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.fk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => {
      const back = mirrored(a);
      if (back) ctx.scale(-1, 1);
      drawFx(ctx, m, a);
      look.fx?.(ctx, m, a, KIT);
    },
  });
  // (a still for the Monster Book: the body plain)
  const still = () => ({
    w: BOX_W,
    h: BOX_H,
    res: 3,
    shapes: [E(BOX_W / 2, BOX_H - FLOAT, bodyLen * 0.4, (Math.max(...BACK) + Math.max(...BELLY)) / 2, C.base)],
  });
  return { rig, still, KIT, H, w: Math.round(bodyLen * 0.85), h: Math.round(H * 1.05), speed: P.speed, stride: CYC };
}

// One dressed round fish: its art entry (for ARTS), its size and its swimming pace.
export function dressedSailfish(look) {
  const r = sailRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, bodyH: r.H, speed: r.speed, K: r.KIT };
}
