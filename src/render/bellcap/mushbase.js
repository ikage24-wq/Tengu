// The Bell-Cap Monk's mushroom (2026-11-27): a copy of the veggie critter base (blankveggie.js, its
// mushroom; the hooks as in the Turnip Tot's copy, render/turniptot/veggiebase.js), kept
// here so the base itself stays clean for future builds (the player: "never edit the bases just copy
// the base and edit that"). What this copy adds: a dress, `look`, for a monster on it:
//   look.kind   which preset it's built on: 'root' (default), 'mushroom' or 'sprout'
//   look.P      its own shape over the preset's (body, top, face, arm, leg, leaves, cap, stem, seeds,
//               tail, gait, ...; an object merges one level deep, so { face: { y: -9 } } is enough;
//               a tail may be given to any preset)
//   look.C      its own body colours over the base's (lt, base, sh, deep)
//   look.CL     the crown's own colours (leaves, stems, seed-leaves; also rib: a leaf's midrib, stem:
//               the stems), over look.C
//   look.CK     the cap's own colours, over look.C
//   look.CLeg   the legs' own colours, over look.C
//   look.CT     the root-tail's own colours, over look.C
//   look.DIRT   its own soil colours (top, clod, crumb, dust, dustEdge)
//   look.ink    its own soft outline colour (never near-black)
//   look.spore  [fill, edge] its own spore puff colours
//   look.paint  (ctx, a, bk, K) its own markings on the body, clipped to it (in the fill pass)
//   look.face   (ctx, a, bk, K) its own eyes and mouth (the base's face guides are gone); K.frameAt
//               puts the canvas in the body's own units at a height
//   look.over   { part: (ctx, a, mode, K) } drawn over a part, in both passes (mode 'line': its
//               outline, 'fill': itself), so anything added keeps the outer-outline-only look;
//               parts: legF, armF, tail, stems, stem, seedF, legN, body, cap, leaves, seedN, armN
//   look.under  the same, under a part
//   look.channels  { name: [k, c] } its own sprung channels (0 at rest; moves may key them; read
//               them as a.S[name])
//   look.quietIdle  the base's own idle bits to leave out: any of 'stretch', 'shake', 'glance', 'sway'
//   look.pose   (m, a, out, K, cur) its own idle act and extras on top of the base's channels (before
//               the plant / sit / sleep poses)
//   look.after  (m, a, out, K, cur, pose) the same, after them
//   look.fx     (ctx, m, a, S, K) live extras over everything
//   look.moves  its own moves over the base's (same form as the base's)
// K, the kit handed to them: the skeleton is a.bk (pivot, ang, B, topAng, pts, legs, arms, leaves,
// stem, seeds, cap, tail, mouth, open, look, sink, spots, bodyPt, x); a.S the sprung channels, a.vgM
// the monster, a.vgMove the move playing; C, CL, CK, CG, P, H, hw, colour, tint, edge, blob, capsule,
// oval, trace, twinkle, puff, at(a, p), path(ctx, a, pts), bodyPath(ctx, a), frameAt(ctx, a, y),
// capFrame(ctx, a), the curve helpers; moves, poseAt, hold, swing, feel, shove.
//
// The base's own notes follow.
// (base) The veggie critter base (2026-11-25, the player: "NEVER reuse another base when making a new one"):
// a blank chibi living vegetable made for one from the start: a turnip, a mushroom, a sprouting
// bean. Nothing carried over from another base; only the engine is shared (rig.js's springs, kit.js's
// shapes for the Monster Book still). A plain lilac mannequin to design on: no eyes, no markings, no
// veggie texture, only soft construction guides where the face goes. Drawn live like the other blank
// bases: smooth shapes over its bones, outlined only on its outer edge (every outline first, then
// every fill over them), in a soft ink of its own lilac.
//
// The body, side on, facing right:
//   body    the head and the torso in one soft round: a turnip's bulb (tapering to a little root
//           tip at the bottom-back), a mushroom's short thick stalk, a bean standing up; it leans
//           and bends on two bones (the lower half on the hips, the top on a soft spring that
//           trails every start, stop and footfall), never squashed; a soft eye line, a centre
//           line and a little mouth mark where the face goes, turning a touch as it glances
//   legs    short and chunky, tucked half under the body, hip and knee hidden inside it; a waddle:
//           each foot's step from the distance walked (it never slides), flat on the ground, heel
//           up to push off, toes up as it swings through; the whole body rocks from foot to foot
//           and rises over each step; tucked up in the air, stuck out in front to sit, paddling on
//           its back
//   arms    little nubs from the body's sides, swinging against the legs; the near one over the
//           body (a soft rim and a soft shadow, no seam where it starts), the far one behind
//   crown   on springs, every part rooted inside the top of the body, all trailing and settling:
//             root      three leaves on long stems, each stem and blade its own spring, the blade
//                       bending as it lags (a whip); a little root-tail curling from the bottom-back
//             mushroom  a round cap on the stalk's top: it tilts and bobs on its own spring,
//                       its gills a soft shade under the rim
//             sprout    a short stem and two big round seed-leaves that flap like ears
//   ground  it can sink into the ground (`sink`): everything below the ground is hidden and a soft
//           mound of soil covers the cut; half sunk it is planted
// Presets: root (a turnip), mushroom, sprout (a bean). Moves (VEGGIE_MOVES): leaf slap (wound
// back, then the leaves whirl over the top and lash down in front, round behind and up again), bonk
// (a headbutt), spore puff (the mushroom: two pumps of its cap, soft spores), seed spit (the sprout),
// burrow (all: it drills down into the ground, its crown tips glide along, it bursts up under the
// target and pops back home), jump, dash, dodge, hurt, knockdown (onto its back, feet paddling,
// rolling back up), cheer (when pleased). Idle: breathing, its crown swaying on its own, a big
// stretch up toward the sun, a shake (its leaves rustle), a glance back, a happy arm sway. Poses
// (m.pose): plant (rooted half in the ground, still), sit, sleep (also its nap).

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (its soft ink: a deeper tone of its own lilac, a touch of plum; never near-black)
const INK = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const DIRT0 = { top: '#ddd5e9', clod: '#cfc5df', crumb: '#e8e2f1', dust: '#f4f0fa', dustEdge: '#d9cfe8' };

// ---------- Little helpers (its own) ----------
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const mix = (a, b, u) => a + (b - a) * u;
const turn = ([x, y], r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const toward = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];
const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const frac = (v) => v - Math.floor(v);
const hash = (n) => frac(Math.sin(n * 91.345 + 7.13) * 47453.5453);
const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const EASE = { io: sstep, out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, soft: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u) };
// (a closed smooth outline through control points: a cardinal spline, `steps` points per span)
function smoothShape(pts, steps = 4, tension = 0.5) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n];
    const b = pts[i];
    const c = pts[(i + 1) % n];
    const d = pts[(i + 2) % n];
    const m1 = [(c[0] - a[0]) * tension, (c[1] - a[1]) * tension];
    const m2 = [(d[0] - b[0]) * tension, (d[1] - b[1]) * tension];
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = 3 * t2 - 2 * t3;
      const h11 = t3 - t2;
      out.push([h00 * b[0] + h10 * m1[0] + h01 * c[0] + h11 * m2[0], h00 * b[1] + h10 * m1[1] + h01 * c[1] + h11 * m2[1]]);
    }
  }
  return out;
}
// (a line bent into an even arc: where a point `s` along it and `v` across it lies)
function bendAlong(base, th, curl, len) {
  const k = curl / len;
  return (s, v) => {
    const an = th + k * s;
    const c = Math.abs(k) < 1e-4 ? [base[0] + Math.cos(th) * s, base[1] + Math.sin(th) * s] : [base[0] + (Math.sin(an) - Math.sin(th)) / k, base[1] - (Math.cos(an) - Math.cos(th)) / k];
    return [c[0] - Math.sin(an) * v, c[1] + Math.cos(an) * v];
  };
}
// (an angle on a damped spring, in small steps; `push` is what the body's moves add to it)
function swing(s, goal, k, c, push, dt, lim = 0) {
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (k * wrapPi(goal - s.x) - c * s.v + push) * h;
    s.x += s.v * h;
  }
  if (lim) {
    const e = wrapPi(s.x - goal);
    if (Math.abs(e) > lim) {
      s.x = goal + Math.sign(e) * lim;
      if (s.v * e > 0) s.v *= -0.25;
    }
  }
  if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) {
    s.x = goal;
    s.v = 0;
  }
  return s.x;
}
// (what a point riding on the body feels: its acceleration through the world, smoothed over a few
// frames so a landing is a firm push, never a one-frame spike)
function feel(st, key, p, dt, flip) {
  const f = (st[key] ??= {});
  if (!(dt > 0)) return { ax: f.ax ?? 0, ay: f.ay ?? 0 };
  if (f.px !== undefined && f.flip === flip && Math.hypot(p[0] - f.px, p[1] - f.py) < 30) {
    const vx = (p[0] - f.px) / dt;
    const vy = (p[1] - f.py) / dt;
    if (f.vx !== undefined) {
      const k = Math.min(1, dt * 18);
      f.ax = mix(f.ax ?? 0, clamp((vx - f.vx) / dt, -700, 700), k);
      f.ay = mix(f.ay ?? 0, clamp((vy - f.vy) / dt, -700, 700), k);
    }
    f.vx = vx;
    f.vy = vy;
  } else Object.assign(f, { vx: undefined, ax: 0, ay: 0 });
  Object.assign(f, { px: p[0], py: p[1], flip });
  return { ax: f.ax ?? 0, ay: f.ay ?? 0 };
}
// (how hard a pushed point turns something hanging off it at angle `th`)
const shove = (th, acc, g) => g * (Math.sin(th) * acc.ax - Math.cos(th) * acc.ay);

// ---------- The veggies (units: game px at scale 1; the body's frame is about the middle of its
// bottom, x forward, y down) ----------
// body: its outline round from the top, down the front, along the bottom and up the back.
// hip / foot: where each leg starts inside the body, and where its foot rests (x from the middle).
// arm: each shoulder inside the body, the nub's length and its thickness at the shoulder and the end.
// face: where the eye line crosses the centre line, and the face's height.
// crownH: how far the crown stands above the body's top.
const ROOT = {
  name: 'Turnip',
  body: [[0.2, -18.2], [5.2, -16.9], [8.5, -13], [9.1, -8.6], [7.7, -4.2], [4.6, -1.1], [0.9, 0.1], [-3.2, -0.1], [-6.4, -0.9], [-8.4, -3.8], [-9, -8.6], [-7.8, -13.4], [-4.6, -16.8]],
  top: 18.2,
  hb: 3.4,
  hip: { N: [1.3, -1.9], F: [-0.9, -2.1] },
  foot: { N: 0.9, F: -0.9 },
  leg: { l1: 2.4, l2: 2.3, r: [1.8, 1.6, 1.4], foot: [2.3, 1.35] },
  ankle: 1.35,
  sitFoot: 4.2,
  arm: { N: [6.2, -6.4], F: [-6.4, -6.8], up: { N: [6.6, -10.8], F: [-6.8, -11.2] }, len: 5, r: [1.75, 1.5] },
  face: { x: 6, y: -11.4, h: 6.4 },
  crown: 'leaves',
  crownH: 9.5,
  // (each leaf: its root inside the top; its angle from straight up, + forward; its stem; its
  // blade's length, width and curl; drawn back to front)
  leaves: [
    { root: [-1.5, -16.6], rest: -34, stem: 3, len: 6.8, w: 4.4, curl: -26, tone: 'sh' },
    { root: [1.5, -16.6], rest: 30, stem: 2.6, len: 6.4, w: 4.2, curl: 24, tone: 'base' },
    { root: [0, -16.9], rest: -3, stem: 3.6, len: 8, w: 5, curl: 10, tone: 'base' },
  ],
  // (the root-tail: from inside the bottom-back, its angle (90 down, 180 back), a few short links
  // tapering to a soft tip, curling up)
  tail: { root: [-5.2, -2.2], ang: 128, n: 3, seg: 1.35, w: [3.2, 0.9], curl: 30 },
  gait: { cycle: 8, duty: 0.58, bob: 0.45, rock: 3, swing: 24, lift: 1.3 },
  speed: 10,
  moves: ['leafslap', 'bonk', 'burrow'],
};
const MUSHROOM = {
  name: 'Mushroom',
  body: [[0, -12.8], [3.8, -12.4], [5.7, -10.8], [6.1, -7.2], [6.6, -3.6], [5.6, -0.9], [2.6, 0.3], [-2.6, 0.3], [-5.6, -0.9], [-6.6, -3.6], [-6.1, -7.2], [-5.7, -10.8], [-3.8, -12.4]],
  top: 12.8,
  hb: 3.2,
  hip: { N: [1.4, -1.7], F: [-1, -1.9] },
  foot: { N: 1, F: -0.9 },
  leg: { l1: 2.3, l2: 2.2, r: [1.75, 1.55, 1.35], foot: [2.2, 1.3] },
  ankle: 1.3,
  sitFoot: 4,
  arm: { N: [4.4, -4.2], F: [-4.4, -4.4], up: { N: [4.6, -7.2], F: [-4.6, -7.4] }, len: 4.2, r: [1.6, 1.4] },
  face: { x: 3.9, y: -7.6, h: 4.6 },
  crown: 'cap',
  crownH: 8.6,
  plant: 0.22,
  // (the cap: about the stalk's top, the dome round from its crown, the rim curling under; its
  // underside, the gills, a soft shade)
  cap: {
    at: [0, -11.6],
    pts: [[0, -9.8], [4.4, -9], [8.4, -6.4], [10.4, -2.6], [10.6, 0.8], [7.6, 2.2], [3.2, 2.8], [-3.2, 2.8], [-7.6, 2.2], [-10.6, 0.8], [-10.4, -2.6], [-8.4, -6.4], [-4.4, -9]],
    w: 21.2,
  },
  gait: { cycle: 7.6, duty: 0.58, bob: 0.4, rock: 2.6, swing: 22, lift: 1.2 },
  speed: 9.5,
  moves: ['spore', 'bonk', 'burrow'],
};
const SPROUT = {
  name: 'Sprout',
  body: [[-0.4, -15.4], [3.8, -14.6], [6.3, -11.6], [7, -7.6], [6.4, -3.6], [4, -0.7], [0.4, 0.3], [-3.4, -0.5], [-5.9, -2.8], [-6.5, -6.6], [-6.2, -10.4], [-4.4, -13.8]],
  top: 15.4,
  hb: 3.2,
  hip: { N: [1.2, -1.7], F: [-1, -1.9] },
  foot: { N: 0.9, F: -0.9 },
  leg: { l1: 2.3, l2: 2.2, r: [1.75, 1.55, 1.35], foot: [2.2, 1.3] },
  ankle: 1.3,
  sitFoot: 4,
  arm: { N: [4.8, -5.4], F: [-4.6, -5.6], up: { N: [5.4, -9.4], F: [-5.2, -9.8] }, len: 4.6, r: [1.65, 1.45] },
  face: { x: 4.6, y: -10, h: 5.6 },
  crown: 'seed',
  crownH: 9.5,
  stem: { root: [-0.4, -13.6], rest: -4, len: 3.9, r: [1.05, 0.9] },
  // (the two seed-leaves, rooted at the stem's tip: the far one leaning back, the near one forward)
  seeds: [
    { side: 'F', rest: -56, len: 9, w: 6.8, curl: -18, tone: 'sh' },
    { side: 'N', rest: 54, len: 9.2, w: 7, curl: 18, tone: 'base' },
  ],
  gait: { cycle: 8.4, duty: 0.58, bob: 0.5, rock: 3.2, swing: 24, lift: 1.3 },
  speed: 11,
  moves: ['seedspit', 'leafslap', 'burrow'],
};
const VEGGIE_PRESETS = { root: ROOT, mushroom: MUSHROOM, sprout: SPROUT };
const VEGGIE_KINDS = ['root', 'mushroom', 'sprout'];

// Leaf blades, along (0 at the stem, 1 at the tip) and across (-1..1): a turnip's oval leaf with a
// soft round tip; a seed-leaf's big round paddle.
const LEAF = smoothShape([[0, 0], [0.14, -0.5], [0.42, -0.95], [0.72, -0.86], [0.93, -0.42], [1, 0], [0.93, 0.42], [0.72, 0.86], [0.42, 0.95], [0.14, 0.5]], 4);
const PADDLE = smoothShape([[0, 0], [0.1, -0.42], [0.34, -0.9], [0.66, -1], [0.9, -0.74], [1, -0.2], [1, 0.2], [0.9, 0.74], [0.66, 1], [0.34, 0.9], [0.1, 0.42]], 4);

// ---------- The moves (x, hop, lift in px; angles in degrees; lean: + tipped forward; arms: 0
// hanging, 90 straight out in front, 180 straight up, - back; crown: the whole crown tipped, +
// forward; twirl: the leaves whirled round their roots; flap: the seed-leaves perked up (-: flung
// down); the rest 0..1) ----------
const VEGGIE_MOVES = {
  // Wound right back, then the leaves whirl up over its head and lash out in front like a whip
  // (the blades cracking after the stems), recoil, a second little flick, and settle.
  leafslap: {
    anticT: 0.26,
    keys: [
      [0, { lean: -13, bend: -6, crouch: 0.4, twirl: -75, armN: 0, armF: 65, look: 0.3, flap: 20 }],
      [0.09, { lean: 9, bend: 5, crouch: 0, lift: 0.6, x: 1.2, twirl: 118, armN: 55, armF: 32, mouth: 0.45, flap: -24 }, 'out'],
      [0.2, { lean: 5, bend: 1, lift: 0.3, x: 1.4, twirl: 74, armN: 38, armF: 24, mouth: 0.3, flap: -10 }, 'io'],
      [0.3, { lean: 6, x: 1.3, twirl: 96, armN: 30, mouth: 0.2 }, 'io'],
      [0.64, {}, 'io'],
    ],
    spark: [[0.11, 'leaf']],
  },
  // Rears back, then a hop forward, the top of its head first: bonk. Bounces off, lands, hops home.
  bonk: {
    anticT: 0.22,
    keys: [
      [0, { lean: -18, bend: -6, crouch: 0.65, armN: 0, armF: 70, crown: -18, capTilt: -12, flap: 15 }],
      [0.09, { lean: 34, bend: 8, hop: 2.2, x: 5, tuck: 1, armN: 10, armF: 90, crown: 12, capTilt: 12, flap: -15 }, 'out'],
      [0.16, { lean: 24, bend: 4, hop: 2.4, x: 5.4, tuck: 1, armN: 20, armF: 60, crown: 4 }, 'io'],
      [0.3, { lean: -8, hop: 0.6, x: 3.6, tuck: 0.6, armN: 35, armF: 25, mouth: 0.3 }, 'io'],
      [0.38, { lean: -3, hop: 0, x: 3.2, tuck: 0, crouch: 0.45, armN: 20 }, 'in'],
      [0.52, { crouch: 0.6, x: 3.2, lean: -2 }, 'io'],
      [0.66, { hop: 1.7, x: 1.4, tuck: 0.9, lean: -4, crouch: 0 }, 'out'],
      [0.78, { hop: 0, x: 0, tuck: 0, crouch: 0.35 }, 'in'],
      [1.02, {}, 'io'],
    ],
    spark: [[0.1, 'top']],
    dust: [[0.38, 'feet'], [0.78, 'feet']],
  },
  // (the mushroom) Pressed down, then it pops up and its cap puffs a soft cloud of spores; again,
  // smaller.
  spore: {
    anticT: 0.26,
    keys: [
      [0, { crouch: 0.6, lean: -8, capDrop: 1.1, capTilt: -7, armN: 5, armF: 10 }],
      [0.08, { crouch: 0, hop: 1.5, lean: 9, capDrop: -0.7, capTilt: 12, armN: 75, armF: 62, shake: 1, tuck: 0.4, mouth: 0.4 }, 'out'],
      [0.2, { hop: 0, lean: 4, capDrop: 0.4, capTilt: 4, shake: 0.8, tuck: 0, crouch: 0.3, armN: 40, armF: 30 }, 'in'],
      [0.32, { crouch: 0.5, capDrop: 0.9, lean: -4, shake: 0.3, armN: 0, armF: 0 }, 'io'],
      [0.42, { crouch: 0, hop: 0.8, lean: 8, capDrop: -0.5, capTilt: 9, armN: 55, armF: 45, shake: 0.7, tuck: 0.2, mouth: 0.3 }, 'out'],
      [0.54, { hop: 0, lean: 2, capDrop: 0.2, shake: 0.2, crouch: 0.2, tuck: 0 }, 'in'],
      [0.92, {}, 'io'],
    ],
    spores: [0.08, 0.42],
    spark: [[0.24, 'ahead']],
  },
  // (the sprout) Leans back drawing a breath, its seed-leaves perking up; then forward, and a seed
  // flies out in an arc.
  seedspit: {
    anticT: 0.26,
    keys: [
      [0, { lean: -15, bend: -7, crouch: 0.2, flap: 26, armN: 5, armF: 60, mouth: 0.15, look: 0.2 }],
      [0.07, { lean: 15, bend: 7, x: 1.2, flap: -30, mouth: 1, armN: 40, armF: 25 }, 'out'],
      [0.18, { lean: 10, bend: 3, x: 1.3, mouth: 0.55, flap: -10 }, 'io'],
      [0.46, { lean: 0, x: 0.4, mouth: 0, flap: 6 }, 'io'],
      [0.76, {}, 'io'],
    ],
    seed: [0.07, 0.36],
    spark: [[0.36, 'seed']],
  },
  // Arms up, a hop forward, and it drills itself down into the ground; its crown's tips glide along
  // under the soil to the target; it bursts up under it and pops back home.
  burrow: {
    anticT: 0.26,
    keys: [
      [0, { crouch: 0.7, lean: 6, armN: 120, armF: 110, crown: -6 }],
      [0.1, { crouch: 0, hop: 2.6, x: 2, tuck: 1, lean: 14, armN: 135, armF: 135 }, 'out'],
      [0.2, { hop: 0, sink: 0.42, x: 3.6, tuck: 1, lean: 6, wiggle: 1, armN: 135, armF: 135 }, 'in'],
      [0.38, { sink: 1.02, x: 5.4, tuck: 1, lean: 0, wiggle: 1, armN: 135, armF: 135 }, 'io'],
      [0.62, { sink: 1.02, x: 13, tuck: 1, wiggle: 0.35, armN: 135, armF: 135 }, 'io'],
      [0.72, { sink: 0, hop: 1.6, x: 13.6, tuck: 1, wiggle: 0, armN: 140, armF: 140, lean: 4 }, 'out'],
      [0.92, { hop: 6, x: 7, tuck: 1, lean: -14, armN: 130, armF: 120, crown: 16 }, 'out'],
      [1.1, { hop: 0, x: 0, tuck: 0, crouch: 0.6, lean: -3, armN: 30, armF: 25 }, 'in'],
      [1.32, {}, 'io'],
    ],
    soil: [[0.17, 'base'], [0.69, 'base']],
    spark: [[0.72, 'top']],
    dust: [[1.1, 'feet']],
  },
  jump: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.85, lean: 4, armN: 0, armF: 45, crown: -8 }],
      [0.13, { crouch: 0, hop: 9, tuck: 1, lean: -4, armN: 150, armF: 140 }, 'out'],
      [0.3, { hop: 10, tuck: 0.8, armN: 120, armF: 110 }, 'out'],
      [0.48, { hop: 0, tuck: 0, armN: 60, armF: 50, lean: 4 }, 'in'],
      [0.56, { crouch: 0.6, armN: 20, armF: 15 }, 'out'],
      [0.86, {}, 'io'],
    ],
    dust: [[0.02, 'feet'], [0.48, 'feet']],
  },
  dash: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.5, lean: 10, armN: 0, armF: 60 }],
      [0.14, { crouch: 0, hop: 2, x: 9, tuck: 1, lean: 18, armN: 5, armF: 85, crown: -20, flap: -15 }, 'out'],
      [0.28, { hop: 0, x: 12, tuck: 0, lean: -10, crouch: 0.4, armN: 35, armF: 30 }, 'in'],
      [0.4, { x: 12.8, lean: -6, crouch: 0.3, armN: 20 }, 'out'],
      [0.56, { hop: 1.8, x: 6, tuck: 1, lean: -4, crouch: 0 }, 'out'],
      [0.68, { hop: 0, x: 0, tuck: 0, crouch: 0.35 }, 'in'],
      [0.9, {}, 'io'],
    ],
    lines: [0.02, 0.3],
    dust: [[0.02, 'feet'], [0.28, 'feet'], [0.68, 'feet']],
  },
  dodge: {
    anticT: 0.08,
    keys: [
      [0, { crouch: 0.45, lean: -6 }],
      [0.14, { hop: 3.5, x: -8, tuck: 1, lean: -18, bend: -6, armN: 110, armF: 100, crown: 20, flap: 15 }, 'out'],
      [0.3, { hop: 0, x: -10, tuck: 0, crouch: 0.5, lean: -6, armN: 40, armF: 35 }, 'in'],
      [0.5, { hop: 1.6, x: -4, tuck: 1, lean: 4, crouch: 0 }, 'out'],
      [0.62, { hop: 0, x: 0, tuck: 0, crouch: 0.3 }, 'in'],
      [0.86, {}, 'io'],
    ],
    dust: [[0.3, 'feet'], [0.62, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -1.2, lean: -16, bend: -8, crouch: 0.3, armN: 80, armF: 70, crown: 22, flap: 22, capTilt: -14, mouth: 0.5, look: -0.5 }, 'out'],
      [0.22, { x: -1.2, lean: -10, bend: -4, crouch: 0.25, armN: 50, armF: 40, crown: 12, flap: 10, capTilt: -8, mouth: 0.3, look: -0.3 }, 'io'],
      [0.6, {}, 'io'],
    ],
  },
  // Knocked onto its back, a little bounce, its feet paddling, then it rolls back up.
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.08, { x: -1.5, lean: -22, armN: 90, armF: 80, crown: 20, flap: 20, mouth: 0.5 }, 'out'],
      [0.36, { lie: 1, x: -3.5, armN: 150, armF: 140, crown: 26, mouth: 0.3 }, 'in'],
      [0.44, { lie: 0.92, x: -3.5, armN: 160, armF: 150, crown: 30 }, 'out'],
      [0.54, { lie: 1, x: -3.5, armN: 150, armF: 140, crown: 26 }, 'in'],
      [0.98, { lie: 1, x: -3.5, paddle: 1, armN: 120, armF: 110, crown: 24 }, 'io'],
      [1.24, { lie: 0.3, x: -2, crouch: 0.55, lean: 12, armN: 30, armF: 25 }, 'io'],
      [1.44, { x: -1, crouch: 0.6, lean: 2 }, 'io'],
      [1.7, {}, 'io'],
    ],
    dust: [[0.36, 'body']],
  },
  // Pleased: two little hops, arms up, its crown fanned out.
  cheer: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.4 }],
      [0.13, { hop: 3, tuck: 0.7, armN: 160, armF: 150, spread: 1, flap: 26, mouth: 0.8, lean: -4 }, 'out'],
      [0.27, { hop: 0, tuck: 0, crouch: 0.35, armN: 140, armF: 130, spread: 0.8, mouth: 0.6 }, 'in'],
      [0.4, { hop: 2.2, tuck: 0.6, armN: 165, armF: 155, spread: 1, flap: 26, mouth: 0.8, crouch: 0 }, 'out'],
      [0.52, { hop: 0, crouch: 0.3, tuck: 0, spread: 0.6 }, 'in'],
      [0.88, {}, 'io'],
    ],
    dust: [[0.27, 'feet'], [0.52, 'feet']],
  },
};
const VEGGIE_SHOW = ['leafslap', 'bonk', 'spore', 'seedspit', 'burrow', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'cheer'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
function poseAt(mv, t, antic, base) {
  const ks = mv.keys;
  const at = (i) => ({ ...base, ...ks[i][1] });
  if (t < 0) {
    const k0 = at(0);
    const e = sstep(antic);
    const o = {};
    for (const c of Object.keys(base)) o[c] = mix(base[c], k0[c], e);
    return o;
  }
  let i = 0;
  while (i < ks.length - 1 && t >= ks[i + 1][0]) i++;
  if (i >= ks.length - 1) return at(ks.length - 1);
  const p0 = at(i);
  const p1 = at(i + 1);
  const e = (EASE[ks[i + 1][2]] ?? sstep)(clamp((t - ks[i][0]) / Math.max(1e-6, ks[i + 1][0] - ks[i][0]), 0, 1));
  const o = {};
  for (const c of Object.keys(p0)) o[c] = mix(p0[c], p1[c], e);
  return o;
}
// (how far into a moment's effect, 0..1, or -1 outside it)
const since = (t0, t, len) => (t >= t0 && t <= t0 + len ? (t - t0) / len : -1);

// The channels its springs carry (twirl is not sprung: the leaves' own springs smooth it).
const CH = ['x', 'lift', 'hop', 'lean', 'bend', 'crouch', 'sink', 'sit', 'lie', 'armN', 'armF', 'crown', 'spread', 'droop', 'flap', 'capTilt', 'capDrop', 'mouth', 'look', 'wiggle', 'shake', 'tuck', 'paddle'];
const SPRINGS = {
  lean: [150, 17], bend: [170, 18], armN: [140, 15], armF: [140, 15], crown: [110, 13], spread: [80, 13], droop: [60, 12], flap: [120, 12],
  capTilt: [140, 14], capDrop: [220, 20], mouth: [300, 30], look: [60, 13], sink: [200, 26], sit: [90, 17], lie: [120, 18], tuck: [260, 30], paddle: [100, 18],
};
const EMPTY = () => sprite('rig|veggie-none', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a preset ----------
function veggieRig(look = {}) {
  // (the dress, by a name the base's own code never uses)
  const DRESS = look;
  const P0 = VEGGIE_PRESETS[look.kind ?? 'root'];
  const P = { ...P0 };
  for (const [k, v] of Object.entries(look.P ?? {})) {
    P[k] = v && typeof v === 'object' && !Array.isArray(v) && P0[k] && typeof P0[k] === 'object' && !Array.isArray(P0[k]) ? { ...P0[k], ...v } : v;
  }
  const C = { ...C0, ...(look.C ?? {}) };
  const CL = { ...C, ...(look.CL ?? {}) };
  const CK = { ...C, ...(look.CK ?? {}) };
  const CG = { ...C, ...(look.CLeg ?? {}) };
  const CT = { ...C, ...(look.CT ?? {}) };
  const DIRT = { ...DIRT0, ...(look.DIRT ?? {}) };
  const MOVES = { ...VEGGIE_MOVES, ...(look.moves ?? {}) };
  const CHS = [...CH, ...Object.keys(look.channels ?? {})];
  const SPR = { ...SPRINGS, ...(look.channels ?? {}) };
  const INKD = look.ink ?? INK;
  const G = P.gait;
  const outline = smoothShape(P.body, 5);
  const xs = P.body.map((p) => p[0]);
  const hw = (Math.max(...xs) - Math.min(...xs)) / 2;
  const front = Math.max(...xs);
  const H = P.hb + P.top + P.crownH;
  const reach = (G.cycle * G.duty) / 2;
  // (sunk all the way, only the top 5.5 px of its crown still show; planted, half the body)
  const sinkDepth = P.hb + P.top + P.crownH - 5.5;
  const plantSink = (P.hb + P.top * (P.plant ?? 0.48)) / sinkDepth;
  const capLoop = P.cap ? smoothShape(P.cap.pts, 4) : null;
  // (what it rests on, lying or sitting: the body's outline, and a mushroom's cap)
  const restPts = capLoop ? [...outline, ...capLoop.map((p) => plus(p, P.cap.at))] : outline;
  const lowest = (ang) => {
    let lo = -1e9;
    for (const p of restPts) lo = Math.max(lo, turn(p, ang)[1]);
    return lo;
  };
  // A foot at phase u: planted (moving back under it exactly as far as the body goes forward, flat,
  // the heel lifting to push off), then swung through (lifted, toes up, reaching out to land).
  function stepAt(u, ph) {
    const q = frac(u + ph);
    if (q < G.duty) {
      const s = q / G.duty;
      return { dx: reach * (1 - 2 * s), lift: 0, ang: 0.34 * sstep((s - 0.62) / 0.38) };
    }
    const v = (q - G.duty) / (1 - G.duty);
    const ang = v < 0.6 ? mix(0.34, -0.3, sstep(v / 0.6)) : mix(-0.3, 0, sstep((v - 0.6) / 0.4));
    return { dx: -reach + 2 * reach * sstep(v), lift: G.lift * Math.sin(Math.PI * v) ** 0.9, ang };
  }
  // Two bones from the hip to the ankle, the knee bent forward (with the body).
  function limb(h, f, l1, l2, fwd) {
    const dx = f[0] - h[0];
    const dy = f[1] - h[1];
    const d0 = Math.hypot(dx, dy) || 1e-6;
    const d = clamp(d0, Math.abs(l1 - l2) + 0.02, l1 + l2 - 0.02);
    const A = [h[0] + (dx / d0) * d, h[1] + (dy / d0) * d];
    const base = Math.atan2(dy, dx);
    const al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const k1 = [h[0] + Math.cos(base + al) * l1, h[1] + Math.sin(base + al) * l1];
    const k2 = [h[0] + Math.cos(base - al) * l1, h[1] + Math.sin(base - al) * l1];
    const side = (k) => (k[0] - h[0]) * fwd[0] + (k[1] - h[1]) * fwd[1];
    return { K: side(k1) > side(k2) ? k1 : k2, A };
  }

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const now = a.now ?? 0;
    const t = (a.t ?? 0) + ((m.uid ?? 0) % 7) * 1.37;
    const w = clamp(a.walkW ?? 0, 0, 1);
    const u = st.vgU ?? 0;
    const sit = clamp(S.sit, 0, 1);
    const lie = clamp(S.lie, 0, 1);
    const sink = Math.max(0, S.sink);
    const twirl = a.vgTwirl ?? 0;
    // The waddle: up over each planted foot, down as the next lands; a rock from foot to foot.
    const bob = w * G.bob * (0.5 - 0.5 * Math.cos(TAU * 2 * (u - 0.04)));
    const rock = w * G.rock * Math.sin(TAU * (u - 0.04));
    // (drilling down: a quick twist to and fro; a shake: a quick little shiver)
    const jig = S.wiggle * 9 * Math.sin(now * 30) + S.shake * 4.5 * Math.sin(now * 41);
    const ang = mix((S.lean + rock + jig) * D2R, (-100 + S.lean * 0.15) * D2R, lie);
    // How high it stands: on its legs (crouching bends them), or sat or lying on the ground.
    let py = -(P.hb + bob + S.lift - clamp(S.crouch, 0, 1.2) * P.hb * 0.42);
    const down = Math.max(sit, lie);
    if (down > 0) py = mix(py, -lowest(ang) + 0.15, down);
    py += -S.hop + sinkDepth * sink;
    const pivot = [S.x, py];
    // The soft body: its top trails every push (a start, a stop, a footfall, a landing).
    const sx = a.flip ? -1 : 1;
    const top0 = plus(pivot, turn([0, -P.top * 0.85], ang));
    const acc = feel(st, 'vgFeel', [top0[0] + sx * (m.x ?? 0), top0[1] + (m.y ?? 0)], dt, a.flip);
    const bs = (st.vgBend ??= { x: S.bend * D2R, v: 0 });
    const B = swing(bs, S.bend * D2R, 340, 28, shove(ang - Math.PI / 2, acc, 0.055), dt, 0.12);
    const bodyPt = (p) => plus(pivot, turn(p, ang + B * sstep(-p[1] / P.top)));
    const topAng = ang + B;
    const upTop = topAng - Math.PI / 2;
    const pts = outline.map(bodyPt);
    const fwd = turn([1, 0], ang);
    // Where its feet stand: they stay planted while the body shifts about over them, and follow it
    // only while walking, in the air, lying or sunk; (never more than a short lean behind it).
    const air = clamp(Math.max(S.tuck, S.hop / 1.6), 0, 1);
    const free = clamp(Math.max(air, lie, w, sink > 0.3 ? 1 : 0), 0, 1);
    if (st.vgAnchor === undefined || !(dt > 0 || st.vgAnchorSet)) st.vgAnchor = S.x;
    st.vgAnchorSet = true;
    st.vgAnchor = mix(st.vgAnchor, S.x, free);
    const off = S.x - st.vgAnchor;
    if (Math.abs(off) > 2.2) st.vgAnchor = S.x - Math.sign(off) * 2.2;
    const legs = {};
    for (const side of ['F', 'N']) {
      const g = stepAt(u, side === 'N' ? 0 : 0.5);
      const hip = bodyPt(P.hip[side]);
      const restX = P.foot[side];
      // (stopping or starting, each foot picks itself up as it steps back under the body)
      const shuffle = 4 * w * (1 - w) * (Math.abs(g.dx) / reach);
      let ank = [st.vgAnchor + restX + g.dx * w, -P.ankle - (g.lift + Math.max(0, g.ang) * 1.6) * w - shuffle * 0.8];
      let fa = g.ang * w;
      // tucked up under it in the air
      ank = toward(ank, bodyPt(plus(P.hip[side], [0.7, P.leg.l1 + P.leg.l2 - 1.7])), air);
      fa = mix(fa, ang + 0.25, air);
      // sat down: stuck out in front, toes up
      ank = toward(ank, [S.x + P.sitFoot + restX * 0.35, -P.ankle], sit);
      fa = mix(fa, -0.45, sit);
      // on its back: up in the air, paddling
      const ph = now * 9 + (side === 'N' ? 0 : Math.PI);
      ank = toward(ank, bodyPt(plus(P.hip[side], [0.6 + Math.sin(ph) * 0.8 * S.paddle, 3.3 + Math.cos(ph) * 0.5 * S.paddle])), lie);
      fa = mix(fa, ang + 0.2, lie);
      const { K, A } = limb(hip, ank, P.leg.l1, P.leg.l2, fwd);
      legs[side] = { H: hip, K, A, fa };
    }
    // The arms: swinging against the legs; a light spring of their own.
    const arms = {};
    for (const side of ['F', 'N']) {
      // (the near arm comes out of the front side, the far one out of the back: the far arm's
      // angle is mirrored, so + lifts it out behind; on the walk they swing against the legs.
      // Raised, its shoulder rolls up the side of the body, so the arm lifts clear of it.)
      const swingDeg = -w * G.swing * Math.cos(TAU * u);
      const deg = side === 'N' ? S.armN + swingDeg : -S.armF + swingDeg * -1;
      const raise = sstep(((side === 'N' ? deg : -deg) - 70) / 80);
      const shL = toward(P.arm[side], P.arm.up[side], raise);
      const sh = bodyPt(shL);
      const goal = ang + B * sstep(-shL[1] / P.top) + (90 - deg) * D2R;
      const s = (st[`vgArm${side}`] ??= { x: goal, v: 0 });
      const th = swing(s, goal, 520, 30, shove(s.x, acc, 0.1), dt, 0.9);
      arms[side] = { S: sh, Hd: plus(sh, [Math.cos(th) * P.arm.len, Math.sin(th) * P.arm.len]), th };
    }
    // The crown's own life: each part swaying slowly on its own.
    const sway = (i) => (Math.sin(t * 0.9 + i * 1.9) * 2.4 + Math.sin(t * 1.63 + i * 0.7) * 1.2) * (1 - lie * 0.6);
    const cr = (st.vgCrown ??= {});
    // A leaf: its stem on a spring from its root, its blade on another from the stem's end, bending
    // further as it lags (so a lash cracks like a whip).
    // (a whirl of the leaves turns the stems straight round with it; only the blades trail)
    const whirl = twirl * D2R;
    const frond = (key, L, root, baseUp, rel, i, tpl) => {
      const goalS = baseUp + rel * D2R;
      const ss = (cr[`s${key}`] ??= { x: goalS, v: 0 });
      swing(ss, goalS, 360, 21, shove(ss.x + whirl, acc, 0.34), dt);
      const sa = ss.x + whirl;
      const stemEnd = L.stem ? plus(root, [Math.cos(sa) * L.stem, Math.sin(sa) * L.stem]) : root;
      const bl = (cr[`b${key}`] ??= { x: sa, v: 0 });
      swing(bl, sa, 300, 15, shove(bl.x, acc, 0.42), dt, 1.2);
      const lag = clamp(wrapPi(bl.x - sa) * 0.9, -0.9, 0.9);
      const sideK = Math.sign(L.rest) || 1;
      const curl = (L.curl + sideK * S.droop * 26) * D2R + lag;
      const f = bendAlong(stemEnd, bl.x, curl, L.len);
      // (a leaf that reaches the ground lies along it, never through it)
      const shape = tpl.map(([q, v]) => {
        const p = f(q * L.len, v * L.w * 0.5);
        if (sink < 0.02 && p[1] > -0.3) p[1] = -0.3 - 0.4 * (1 - Math.exp(-(p[1] + 0.3)));
        return p;
      });
      return { L, root, stemEnd, sa, shape, tip: f(L.len, 0), f, i };
    };
    let leaves = [];
    let stem = null;
    let seeds = [];
    let cap = null;
    let tail = null;
    if (P.leaves) {
      leaves = P.leaves.map((L, i) => {
        const sideK = Math.sign(L.rest) || (i % 2 ? 1 : -1);
        const rel = L.rest * (1 + 0.45 * S.spread) + S.crown + sideK * S.droop * 48 + sway(i);
        return frond(i, L, bodyPt(L.root), upTop, rel, i, LEAF);
      });
    }
    if (P.stem) {
      const root = bodyPt(P.stem.root);
      const goal = upTop + (P.stem.rest + S.crown * 0.6 + S.droop * 18 + sway(3) * 0.6) * D2R;
      const ss = (cr.stem ??= { x: goal, v: 0 });
      swing(ss, goal, 420, 24, shove(ss.x, acc, 0.22), dt);
      const tip = plus(root, [Math.cos(ss.x) * P.stem.len, Math.sin(ss.x) * P.stem.len]);
      stem = { root, tip };
      const up2 = ss.x;
      seeds = P.seeds.map((L, i) => {
        const sideK = Math.sign(L.rest);
        const rel = L.rest + sideK * (S.droop * 50 + S.spread * 14 - S.flap) + S.crown * 0.4 + sway(i + 5);
        return frond(`seed${i}`, { ...L, stem: 0 }, tip, up2, rel, i, PADDLE);
      });
    }
    if (P.cap) {
      // The cap: tilting on its own spring about the stalk's top, and bobbing on it.
      const cs = (cr.cap ??= { x: topAng, v: 0, d: 0, dv: 0 });
      const goal = topAng + (S.capTilt + S.shake * 7 * Math.sin(now * 37) + S.crown * 0.5 + sway(0) * 0.6 + S.droop * 12) * D2R;
      swing(cs, goal, 280, 17, shove(cs.x - Math.PI / 2, acc, 0.13), dt, 0.45);
      const upv = [Math.sin(topAng), -Math.cos(topAng)];
      const accUp = acc.ax * upv[0] + acc.ay * upv[1];
      const n = Math.max(1, Math.ceil(dt * 240));
      for (let i = 0; i < n; i++) {
        cs.dv += (-(cs.d - S.capDrop) * 480 - cs.dv * 22 + accUp * 0.6) * (dt / n);
        cs.d += cs.dv * (dt / n);
      }
      if (!Number.isFinite(cs.d)) Object.assign(cs, { d: 0, dv: 0 });
      cs.d = clamp(cs.d, -1, 1.6);
      const c0 = bodyPt(P.cap.at);
      const capAt = [c0[0] - upv[0] * cs.d, c0[1] - upv[1] * cs.d];
      cap = { at: capAt, ang: cs.x, shape: capLoop.map((p) => plus(capAt, turn(p, cs.x))) };
    }
    if (P.tail) {
      // The root-tail: a few links on springs, curling up, never through the ground.
      const T = P.tail;
      const ch = (cr.tail ??= []);
      let p = bodyPt(T.root);
      tail = [p];
      let prev = 0;
      for (let i = 0; i < T.n; i++) {
        const goal = i === 0 ? ang + (T.ang - S.droop * 10) * D2R : prev + (T.curl + Math.sin(t * 1.3 - i) * 4) * D2R;
        const s = (ch[i] ??= { x: goal, v: 0 });
        prev = swing(s, goal, 460 - i * 70, 22 - i * 3, shove(s.x, acc, 0.22), dt, 1);
        p = plus(p, [Math.cos(prev) * T.seg, Math.sin(prev) * T.seg]);
        if (sink < 0.02) p[1] = Math.min(p[1], -0.6);
        tail.push(p);
      }
    }
    // Spots the effects come from.
    const F0 = P.face;
    const mouth = bodyPt([F0.x + 0.7, F0.y + F0.h * 0.36]);
    const tipOf = (list) => list.reduce((b, l) => (!b || l.tip[0] > b[0] ? l.tip : b), null);
    const spots = {
      top: bodyPt([hw * 0.4, -P.top * 0.95]),
      leaf: tipOf(leaves.length ? leaves : seeds) ?? bodyPt([front + 3, -P.top]),
      front: bodyPt([front + 2, -P.top * 0.5]),
      ahead: bodyPt([front + 7, -P.top * 0.55]),
      mouth,
      feet: [st.vgAnchor, 0],
      base: [S.x, 0],
      body: [pivot[0], 0],
      cap: cap ? plus(cap.at, turn([0, 1.8], cap.ang)) : bodyPt([0, -P.top]),
    };
    // The cut where it goes into the ground: how wide the soil mound must be to cover it.
    let mound = 0;
    if (sink > 0.02) {
      let lo = Infinity;
      let hi = -Infinity;
      for (const q of pts) {
        if (Math.abs(q[1]) < 1.3) {
          lo = Math.min(lo, q[0]);
          hi = Math.max(hi, q[0]);
        }
      }
      mound = Number.isFinite(lo) ? Math.max(3.2, (hi - lo) / 2 + 1.6) : 3.2;
    }
    return { pivot, ang, B, topAng, pts, legs, arms, leaves, stem, seeds, cap, tail, mouth, open: clamp(S.mouth, 0, 1), look: S.look, sink, mound, spots, bodyPt, x: S.x };
  }

  // ---------- Drawing ----------
  const tone = (a, c) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    if (k <= 0) return c;
    const [r, g, b] = rgbOf(c);
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  };
  const toneA = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  const ink = (ctx) => {
    ctx.strokeStyle = INKD;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const trace = (ctx, pts) => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  };
  // (a soft-ended tube from a to b, its radius going r0 to r1; drawn round clockwise like every
  // other shape here, so they all join into one)
  function capsule(ctx, p, q, r0, r1) {
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.hypot(dx, dy);
    if (d <= Math.abs(r0 - r1) + 1e-3) {
      const [c, r] = r0 >= r1 ? [p, r0] : [q, r1];
      ctx.moveTo(c[0] + r, c[1]);
      ctx.arc(c[0], c[1], r, 0, TAU);
      return;
    }
    const th = Math.atan2(dy, dx);
    const ph = Math.acos(clamp((r0 - r1) / d, -1, 1));
    ctx.moveTo(p[0] + Math.cos(th + ph) * r0, p[1] + Math.sin(th + ph) * r0);
    ctx.arc(p[0], p[1], r0, th + ph, th + TAU - ph);
    ctx.lineTo(q[0] + Math.cos(th - ph) * r1, q[1] + Math.sin(th - ph) * r1);
    ctx.arc(q[0], q[1], r1, th - ph, th + ph);
    ctx.closePath();
  }
  const oval = (ctx, c, rx, ry, rot) => {
    ctx.moveTo(c[0] + Math.cos(rot) * rx, c[1] + Math.sin(rot) * rx);
    ctx.ellipse(c[0], c[1], rx, ry, rot, 0, TAU);
  };
  // (a soft round of light or shade, fading out to nothing at its edge)
  function blob(ctx, a, col, c, rx, ry, rot, al) {
    const [r, g, b] = rgbOf(col);
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(rot);
    ctx.scale(rx / ry, 1);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const f = (v) => Math.round(v + (255 - v) * k);
    gr.addColorStop(0, `rgba(${f(r)},${f(g)},${f(b)},${al})`);
    gr.addColorStop(0.55, `rgba(${f(r)},${f(g)},${f(b)},${al * 0.55})`);
    gr.addColorStop(1, `rgba(${f(r)},${f(g)},${f(b)},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
    ctx.restore();
  }
  const clipBody = (ctx, bk) => {
    ctx.beginPath();
    trace(ctx, bk.pts);
    ctx.clip();
  };

  // A leg: hip, knee and ankle one soft tube into a little round foot; the far one in shade.
  function drawLeg(ctx, a, mode, side) {
    const L = a.bk.legs[side];
    const [r0, r1, r2] = P.leg.r;
    const [fx, fy] = P.leg.foot;
    const fc = plus(L.A, turn([0.6, 0], L.fa));
    const path = () => {
      ctx.beginPath();
      capsule(ctx, L.H, L.K, r0, r1);
      capsule(ctx, L.K, L.A, r1, r2);
      oval(ctx, fc, fx, fy, L.fa);
    };
    path();
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, side === 'F' ? CG.sh : CG.base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // the sole and the back of the leg in soft shade, the top of the foot lit
    blob(ctx, a, side === 'F' ? CG.deep : CG.sh, plus(fc, turn([-0.3, fy * 0.9], L.fa)), fx * 1.2, fy * 0.9, L.fa, 0.8);
    if (side === 'N') blob(ctx, a, CG.lt, plus(fc, turn([0.4, -fy * 0.5], L.fa)), fx * 0.7, fy * 0.6, L.fa, 0.7);
    ctx.restore();
  }
  // An arm: a little soft nub. The near one lies over the body: a soft shadow under it and a soft rim
  // round it (fading out toward the shoulder, so there's no seam where it starts).
  function drawArm(ctx, a, mode, side) {
    const bk = a.bk;
    const A = bk.arms[side];
    const [r0, r1] = P.arm.r;
    const path = () => {
      ctx.beginPath();
      capsule(ctx, A.S, A.Hd, r0, r1);
    };
    if (mode === 'line') {
      path();
      return ink(ctx);
    }
    if (side === 'F') {
      path();
      ctx.fillStyle = tone(a, C.sh);
      ctx.fill();
      return;
    }
    // (it comes out of the body's side and past its outline: the outline shows only where it's out;
    // where it's over the body, it's the body's own colour, so it grows out of it with no seam, a
    // soft shade under it and its end lit)
    const len = P.arm.len;
    ctx.save();
    clipBody(ctx, bk);
    blob(ctx, a, C.sh, plus(toward(A.S, A.Hd, 0.75), [-0.3, 1]), len * 0.45, r0 * 0.9, A.th, 0.5);
    ctx.restore();
    path();
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    blob(ctx, a, C.lt, plus(toward(A.S, A.Hd, 0.8), [0.1, -0.4]), len * 0.4, r0 * 0.8, A.th, 0.85);
    blob(ctx, a, C.sh, plus(toward(A.S, A.Hd, 0.85), [-0.2, 0.9]), len * 0.35, r0 * 0.55, A.th, 0.5);
    ctx.restore();
  }
  // The body: one soft round over its bones, lit from above, shaded round the back and under, where
  // the legs go in; the face's soft guides.
  function drawBody(ctx, a, mode) {
    const bk = a.bk;
    ctx.beginPath();
    trace(ctx, bk.pts);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    const T = P.top;
    blob(ctx, a, C.sh, bk.bodyPt([-hw * 0.55, -T * 0.35]), hw * 0.75, T * 0.42, bk.ang, 0.55);
    blob(ctx, a, C.sh, bk.bodyPt([0.4, 0.6]), hw * 0.75, 2.8, bk.ang, 0.75);
    blob(ctx, a, C.lt, bk.bodyPt([hw * 0.05, -T * 0.78]), hw * 0.78, T * 0.36, bk.topAng, 0.95);
    blob(ctx, a, C.lt, bk.bodyPt([hw * 0.5, -T * 0.55]), hw * 0.35, T * 0.3, bk.ang, 0.4);
    if (P.cap) {
      // (the cap's soft shadow over the top of the stalk)
      const c = bk.bodyPt([P.cap.at[0] - 0.6, P.cap.at[1] + 2.6]);
      blob(ctx, a, C.sh, c, hw * 1.05, 2.4, bk.cap.ang, 0.85);
    }
    // its own markings (the dress), clipped to the body
    DRESS.paint?.(ctx, a, bk, KIT);
    ctx.restore();
    // its own face (the dress)
    ctx.save();
    DRESS.face?.(ctx, a, bk, KIT);
    ctx.restore();
  }
  // A leaf: its stem and blade one shape, a soft midrib down it; a soft rim wherever it lies over
  // something drawn before it (so leaves read over each other and over the body).
  // (a leaf's stem is drawn behind the body, so where it comes out of the top never shows; its
  // blade in front, so a leaf that flops or lashes forward lies over the face)
  function drawStems(ctx, a, mode) {
    ctx.beginPath();
    for (const l of a.bk.leaves) capsule(ctx, l.root, plus(l.stemEnd, [Math.cos(l.sa) * 0.6, Math.sin(l.sa) * 0.6]), 0.85, 0.7);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, CL.stem ?? CL.base);
    ctx.fill();
  }
  const leafPath = (ctx, l) => trace(ctx, l.shape);
  function drawLeaf(ctx, a, mode, l, under) {
    ctx.beginPath();
    leafPath(ctx, l);
    if (mode === 'line') return ink(ctx);
    const col = l.L.tone === 'sh' ? CL.sh : CL.base;
    ctx.fillStyle = tone(a, col);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    trace(ctx, l.shape);
    ctx.clip();
    blob(ctx, a, l.L.tone === 'sh' ? CL.deep : CL.sh, l.f(0, 0), l.L.len * 0.45, l.L.w * 0.45, 0, 0.55);
    blob(ctx, a, CL.lt, l.f(l.L.len * 0.62, -l.L.w * 0.15), l.L.len * 0.32, l.L.w * 0.3, 0, l.L.tone === 'sh' ? 0.35 : 0.8);
    ctx.strokeStyle = tone(a, CL.rib ?? (l.L.tone === 'sh' ? CL.deep : CL.sh));
    ctx.lineWidth = 0.45;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const p = l.f(l.L.len * mix(0.08, 0.78, i / 6), 0);
      if (i) ctx.lineTo(p[0], p[1]);
      else ctx.moveTo(p[0], p[1]);
    }
    ctx.stroke();
    ctx.restore();
    if (under) {
      ctx.save();
      ctx.beginPath();
      under(ctx);
      ctx.clip();
      ctx.beginPath();
      trace(ctx, l.shape);
      // (fading out toward the root, so where a stem comes out of the body there's no seam)
      const gr = ctx.createRadialGradient(l.root[0], l.root[1], 0, l.root[0], l.root[1], 4.5);
      const rc = l.L.tone === 'sh' ? CL.deep : CL.sh;
      gr.addColorStop(0, toneA(a, rc, 0));
      gr.addColorStop(0.5, toneA(a, rc, 0));
      gr.addColorStop(1, toneA(a, rc, 0.9));
      ctx.strokeStyle = gr;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.restore();
    }
  }
  function drawLeaves(ctx, a, mode) {
    const ls = a.bk.leaves;
    ls.forEach((l, i) => drawLeaf(ctx, a, mode, l, (c) => {
      trace(c, a.bk.pts);
      ls.slice(0, i).forEach((o) => trace(c, o.shape));
    }));
  }
  // The root-tail: a soft tapering curl.
  function drawTail(ctx, a, mode) {
    const T = a.bk.tail;
    const W = P.tail.w;
    ctx.beginPath();
    for (let i = 0; i < T.length - 1; i++) capsule(ctx, T[i], T[i + 1], mix(W[0], W[1], i / (T.length - 1)) / 2, mix(W[0], W[1], (i + 1) / (T.length - 1)) / 2);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, CT.base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    blob(ctx, a, CT.sh, plus(T[1], [0, 0.6]), 2.4, 1.4, 0, 0.7);
    ctx.restore();
  }
  // The sprout's stem and its far seed-leaf (behind the body), and its near seed-leaf (in front).
  function drawStem(ctx, a, mode) {
    const s = a.bk.stem;
    ctx.beginPath();
    capsule(ctx, s.root, s.tip, P.stem.r[0], P.stem.r[1]);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, CL.stem ?? CL.base);
    ctx.fill();
  }
  function drawSeedFar(ctx, a, mode) {
    drawLeaf(ctx, a, mode, a.bk.seeds[0], null);
  }
  function drawSeedNear(ctx, a, mode) {
    const bk = a.bk;
    drawLeaf(ctx, a, mode, bk.seeds[1], (c) => {
      trace(c, bk.pts);
      trace(c, bk.seeds[0].shape);
    });
  }
  // The mushroom's cap: a round dome, lit on top, the gills a soft shade under its rim.
  function drawCap(ctx, a, mode) {
    const cp = a.bk.cap;
    ctx.beginPath();
    trace(ctx, cp.shape);
    if (mode === 'line') return ink(ctx);
    ctx.fillStyle = tone(a, CK.base);
    ctx.fill();
    ctx.save();
    ctx.clip();
    const at = (x, y) => plus(cp.at, turn([x, y], cp.ang));
    blob(ctx, a, CK.sh, at(-4, -1.5), 8, 5, cp.ang, 0.45);
    blob(ctx, a, CK.lt, at(-0.5, -6.4), 8.4, 4.2, cp.ang, 0.95);
    blob(ctx, a, CK.lt, at(4.2, -4.2), 3.2, 2.2, cp.ang, 0.5);
    ctx.beginPath();
    oval(ctx, at(0, 2.3), 10.2, 1.75, cp.ang);
    ctx.fillStyle = tone(a, CK.sh);
    ctx.fill();
    blob(ctx, a, CK.deep, at(0, 2.6), 6, 1.3, cp.ang, 0.7);
    ctx.restore();
  }

  // ---------- Effects: sparkles, dust, soil, spores, a seed, speed lines, the mound ----------
  function twinkle(ctx, x, y, r, rot, col) {
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const a0 = rot + (i * Math.PI) / 2;
      const tip = [x + Math.cos(a0) * r, y + Math.sin(a0) * r];
      if (!i) ctx.moveTo(tip[0], tip[1]);
      else {
        const a1 = a0 - Math.PI / 4;
        ctx.quadraticCurveTo(x + Math.cos(a1) * r * 0.12, y + Math.sin(a1) * r * 0.12, tip[0], tip[1]);
      }
    }
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }
  function puff(ctx, x, y, r, al, fill = DIRT.dust, edge = DIRT.dustEdge) {
    if (al <= 0.01 || r <= 0.05) return;
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = Math.max(0.35, r * 0.16);
    ctx.stroke();
    ctx.globalAlpha = al * 0.7;
    ctx.beginPath();
    ctx.arc(x - r * 0.28, y - r * 0.3, r * 0.38, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function mound(ctx, bk) {
    const k = sstep(bk.sink / 0.35);
    const x = bk.x;
    const hw2 = bk.mound * (0.75 + 0.25 * k);
    const h = 0.8 + 1.3 * k;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x - hw2 - 1.6, 0.5);
      ctx.bezierCurveTo(x - hw2 * 0.85, -h * 1.15, x + hw2 * 0.85, -h * 1.15, x + hw2 + 1.6, 0.5);
      ctx.closePath();
    };
    path();
    ctx.strokeStyle = DRESS.dirtInk ?? INKD;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = DIRT.top;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = DIRT.clod;
    for (const [dx, r] of [[-0.5, 1], [0.15, 0.8], [0.6, 0.9]]) {
      ctx.beginPath();
      ctx.arc(x + dx * hw2, -h * 0.55 + 0.6, r * (0.6 + 0.4 * k), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawFx(ctx, m, a) {
    const bk = a.bk;
    if (!bk) return;
    ctx.save();
    if (bk.sink > 0.02) mound(ctx, bk);
    const cur = a.vgMove;
    if (!cur) {
      ctx.restore();
      return;
    }
    const { mv, t } = cur;
    const st = a.mo.rig;
    // (each effect stays where it began)
    const inst = `${cur.name}@${Math.round(((a.now ?? 0) - t) * 50)}`;
    if (st.vgFx?.inst !== inst) st.vgFx = { inst, at: {} };
    // (a seed lands 22 px out in front of the mouth it left)
    const pin = (key, where) => {
      if (where === 'seed') return (st.vgFx.at.seed ??= [pin('mouth', 'mouth')[0] + 22, -5]);
      return (st.vgFx.at[key] ??= [...(bk.spots[where] ?? bk.spots.front)]);
    };
    // sparkles where a blow lands
    (mv.spark ?? []).forEach(([s0, where], i) => {
      const k = since(s0, t, 0.26);
      if (k < 0) return;
      const [x, y] = pin(`s${i}`, where);
      const e = 1 - (1 - k) ** 3;
      ctx.globalAlpha = 1 - k * k;
      twinkle(ctx, x, y, H * (0.08 + 0.08 * e), k * 0.9, "#ffffff");
      twinkle(ctx, x, y, H * (0.04 + 0.035 * e), k * 0.9 + 0.5, "#fff3b0");
      for (let j = 0; j < 4; j++) {
        const q = (j * TAU) / 4 + 0.4;
        ctx.beginPath();
        ctx.arc(x + Math.cos(q) * H * 0.2 * e, y + Math.sin(q) * H * 0.2 * e, H * 0.03 * (1 - k * 0.5), 0, TAU);
        ctx.fillStyle = j % 2 ? '#ffd3e6' : '#fff6cf';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    // soft dust where it pushes off or lands
    (mv.dust ?? []).forEach(([d0, where], i) => {
      const k = since(d0, t, 0.45);
      if (k < 0) return;
      const [gx] = pin(`d${i}`, where);
      const e = 1 - (1 - k) ** 2;
      for (let j = 0; j < 4; j++) {
        const dir = j < 2 ? -1 : 1;
        const far = j % 2;
        puff(ctx, gx + dir * (2.2 + far * 2.6) * (0.5 + e), -1 - far * 0.6 - e * 2, (1.2 + far * 0.5) * (0.6 + 0.6 * e), (1 - k) * 0.85);
      }
    });
    // soil thrown up: soft round clods in arcs, and a puff of dust
    (mv.soil ?? []).forEach(([s0, where], i) => {
      const k = since(s0, t, 0.62);
      if (k < 0) return;
      const [gx] = pin(`o${i}`, where);
      const tau = k * 0.62;
      for (let j = 0; j < 7; j++) {
        const dir = j % 2 ? 1 : -1;
        const vx = dir * (8 + hash(j + i * 7) * 14);
        const vy = 16 + hash(j * 3 + 1) * 14;
        const x = gx + vx * tau;
        const y = -vy * tau + 60 * tau * tau - 0.5;
        if (y > 0.4) continue;
        puff(ctx, x, y, (0.75 + hash(j + 4) * 0.55) * (1 - k * 0.4), 1 - sstep((k - 0.55) / 0.45), DIRT.crumb, DIRT.clod);
      }
      for (let j = 0; j < 3; j++) puff(ctx, gx + (j - 1) * 3.2 * (0.6 + k), -1.4 - k * 2.6, (1.4 + j % 2 * 0.4) * (0.7 + 0.7 * k), (1 - k) * 0.8);
    });
    // spores: a soft cloud puffing out from under the cap, drifting up and away
    for (const [i, s0] of (mv.spores ?? []).entries()) {
      const k = since(s0, t, 0.85);
      if (k < 0) continue;
      const c = pin(`p${i}`, 'cap');
      const e = 1 - (1 - k) ** 2;
      const big = i ? 0.75 : 1;
      for (let j = 0; j < 7; j++) {
        // (out from under the rim, each its own way, rising as it drifts, swelling and fading)
        const side = j % 2 ? 1 : -1;
        const far = hash(j * 5 + i * 3);
        const x = c[0] + side * (3 + far * 6) * big + (side > 0 ? 1 : 0.4) * e * (6 + far * 8) * side * big;
        const y = c[1] + 1 - e * (4 + hash(j + 2) * 7) * big - Math.sin(e * Math.PI) * 1.5;
        const r = (0.6 + e * (1.3 + hash(j + 9) * 1.1)) * big;
        puff(ctx, x, y, r, (1 - sstep((k - 0.35) / 0.65)) * (0.75 + 0.25 * far), DRESS.spore?.[0] ?? '#f7f3fc', DRESS.spore?.[1] ?? '#ddd3ec');
      }
      if (k < 0.7) {
        ctx.globalAlpha = 1 - k / 0.7;
        for (let j = 0; j < 3; j++) twinkle(ctx, c[0] + 6 + j * 3 + e * 4, c[1] - 2 - j * 1.5 - e * 3, 0.9, k * 2 + j, '#ffffff');
        ctx.globalAlpha = 1;
      }
    }
    // a seed: popped from the mouth with a little puff, flying in an arc, spinning
    if (mv.seed) {
      const [s0, s1] = mv.seed;
      const k0 = since(s0, t, 0.22);
      if (k0 >= 0) {
        const mo = pin('mouth', 'mouth');
        puff(ctx, mo[0] + 1 + k0 * 2, mo[1], 0.9 + k0 * 1.2, (1 - k0) * 0.8);
      }
      if (t >= s0 && t <= s1) {
        const k = (t - s0) / (s1 - s0);
        const mo = pin('mouth', 'mouth');
        const end = pin('seed', 'seed');
        const x = mix(mo[0], end[0], k);
        const y = mix(mo[1], end[1], k) - Math.sin(Math.PI * k) * 5;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(k * 9);
        ctx.beginPath();
        ctx.ellipse(0, 0, 1.4, 1, 0, 0, TAU);
        ctx.strokeStyle = INKD;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = CL.base;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-0.3, -0.3, 0.6, 0.4, 0, 0, TAU);
        ctx.fillStyle = CL.lt;
        ctx.fill();
        ctx.restore();
      }
    }
    // speed lines behind a dash
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      ctx.globalAlpha = 0.75 * (1 - k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.9;
      for (let j = 0; j < 3; j++) {
        const y = bk.pivot[1] - P.top * (0.25 + j * 0.25);
        ctx.beginPath();
        ctx.moveTo(bk.pivot[0] - hw - 2 - 3 * k, y);
        ctx.lineTo(bk.pivot[0] - hw - 9 - 7 * k + j, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && MOVES[m.act.name]) {
      const mv = MOVES[m.act.name];
      const T = (a.now ?? 0) - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return { name: m.act.name, mv, t, antic: t < 0 ? (mv.anticT > 0 ? T / mv.anticT : 1) : 1 };
      }
    }
    // An attack: each one the next of its moves in turn, chosen as its wind-up starts (or as it
    // strikes, for one with no wind-up).
    const pool = m.def?.moves ?? P.moves;
    const next = () => {
      st.vgN = st.vgN === undefined ? (m.uid ?? 0) : st.vgN + 1;
      return m.move ?? pool[st.vgN % pool.length];
    };
    // (winding up: before the release only; the engine's wind-up eases out over the strike's first
    // frames, which must not count as a new attack)
    const winding = (m.windup ?? 0) > 0 || (a.ph.antic > 0 && a.ph.since < 0);
    if (winding && !st.vgWind) st.vgPick = next();
    if (winding) st.vgWound = a.now ?? 0;
    st.vgWind = winding;
    if (a.ph.since >= 0 && m.attackAt !== st.vgAt) {
      if ((a.now ?? 0) - (st.vgWound ?? -9) > 0.35) st.vgPick = next();
      st.vgAt = m.attackAt;
    }
    const pick = MOVES[st.vgPick] ? st.vgPick : pool[0];
    const mv = MOVES[pick];
    if (mv && winding) return { name: pick, mv, t: -(1 - a.ph.antic) * mv.anticT, antic: a.ph.antic };
    if (mv && a.ph.since >= 0 && a.ph.since < lengthOf(mv)) return { name: pick, mv, t: a.ph.since, antic: 1 };
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(MOVES.hurt)) return { name: 'hurt', mv: MOVES.hurt, t: a.hurtAgo, antic: 1 };
    const gl = (a.now ?? 0) - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(MOVES.cheer)) return { name: 'cheer', mv: MOVES.cheer, t: gl, antic: 1 };
    return null;
  }
  const order = [
    ['legF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'F')],
    ['armF', (ctx, a, mode) => drawArm(ctx, a, mode, 'F')],
    ...(P.tail ? [['tail', drawTail]] : []),
    ...(P.leaves ? [['stems', drawStems]] : []),
    ...(P.stem ? [['stem', drawStem], ['seedF', drawSeedFar]] : []),
    ['legN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'N')],
    ['body', drawBody],
    ...(P.cap ? [['cap', drawCap]] : []),
    ...(P.leaves ? [['leaves', drawLeaves]] : []),
    ...(P.stem ? [['seedN', drawSeedNear]] : []),
    ['armN', (ctx, a, mode) => drawArm(ctx, a, mode, 'N')],
  ];
  // (sunk into the ground, nothing below it shows)
  const layer = (name, fn, mode) => ({
    name: mode === 'line' ? name : `${name}~b`,
    parent: null,
    at: () => [0, 0],
    pivot: [0, 0],
    s: EMPTY,
    paint: (ctx, a) => {
      if (!a.bk) return;
      ctx.save();
      if (a.bk.sink > 0.02) {
        ctx.beginPath();
        ctx.rect(-400, -400, 800, 400.3);
        ctx.clip();
      }
      fn(ctx, a, mode);
      ctx.restore();
    },
  });
  // (the dress's kit)
  const KIT = {
    C, CL, CK, CG, CT, P, H, hw, DIRT, ink: INKD, moves: MOVES, poseAt, hold, sstep, mix, clamp, turn, plus, toward, wrapPi, hash, frac,
    smoothShape, bendAlong, swing, feel, shove, EASE, TAU, D2R, LEAF, PADDLE,
    colour: tone, tint: toneA, edge: ink, blob, capsule, oval, trace, twinkle, puff, clipBody, drawLeaf,
    at: (a, p) => a.bk.bodyPt(p),
    path: (ctx, a, pts) => trace(ctx, pts.map(a.bk.bodyPt)),
    bodyPath: (ctx, a) => trace(ctx, a.bk.pts),
    // (the canvas in the body's own units, bent as the body is at height y)
    frameAt: (ctx, a, y) => {
      const bk = a.bk;
      ctx.translate(bk.pivot[0], bk.pivot[1]);
      ctx.rotate(bk.ang + bk.B * sstep(-y / P.top));
    },
    capFrame: (ctx, a) => {
      ctx.translate(a.bk.cap.at[0], a.bk.cap.at[1]);
      ctx.rotate(a.bk.cap.ang);
    },
  };
  const dressed = (name, fn) => (ctx, a, mode) => {
    if (DRESS.under?.[name]) {
      ctx.save();
      DRESS.under[name](ctx, a, mode, KIT);
      ctx.restore();
    }
    fn(ctx, a, mode);
    if (DRESS.over?.[name]) {
      ctx.save();
      DRESS.over[name](ctx, a, mode, KIT);
      ctx.restore();
    }
  };
  const order2 = order.map(([n, f]) => [n, dressed(n, f)]);
  const parts = [...order2.map(([n, f]) => layer(n, f, 'line')), ...order2.map(([n, f]) => layer(n, f, 'fill'))];
  const W = Math.round(hw * 2 + 8);
  const rig = makeRig({
    w: W,
    h: Math.ceil(H * 1.3),
    soft: true,
    stride: G.cycle,
    recover: 1.5,
    springs: Object.fromEntries(CHS.map((c) => [c, SPR[c] ?? [170, 21]])),
    walkStiff: { lean: [300, 30], bend: [260, 26] },
    fast: CHS.filter((c) => !['crown', 'spread', 'droop', 'flap', 'look', 'capTilt'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.vgActive),
    kick: { lean: -150, bend: -90 },
    turnKick: { lean: 90 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = (a.t ?? 0) + ((m.uid ?? 0) % 7) * 1.37;
      // The gait's phase: from the distance walked, never the clock.
      const odo = m.odo ?? 0;
      const d = Math.abs(odo - (st.vgOdo ?? odo));
      st.vgOdo = odo;
      st.vgU = frac((st.vgU ?? 0) + Math.min(d, 20) / G.cycle);
      // Standing about: breathing, its crown swaying; every 11 s a stretch up toward the sun, a
      // shake, a glance back, a happy sway of its arms.
      const calm = a.calm ?? 0;
      const breath = Math.sin(t * 1.6);
      const tt = t % 11;
      const qi = DRESS.quietIdle ?? [];
      const on = (n) => (qi.includes(n) ? 0 : 1);
      const stretch = hold(tt, 1.2, 1.9, 2.9, 3.7) * calm * on('stretch');
      const shake = hold(tt, 4.4, 4.6, 5.2, 5.5) * calm * on('shake');
      const glance = hold(tt, 6.3, 6.9, 7.8, 8.4) * calm * on('glance');
      const sway = hold(tt, 8.9, 9.3, 10.1, 10.6) * calm * on('sway');
      const idle = {
        x: 0, lift: breath * 0.12 + stretch * 0.5, hop: 0, lean: -glance * 3 - stretch * 9, bend: breath * 0.8 - stretch * 5, crouch: 0, sink: 0, sit: 0, lie: 0,
        armN: 26 + breath * 3 + stretch * 118 + sway * 26 * Math.sin(t * 5), armF: 26 + breath * 3 + stretch * 118 - sway * 26 * Math.sin(t * 5),
        crown: -glance * 6, spread: stretch * 0.9, droop: 0, flap: 3 + Math.sin(t * 1.1) * 3 + stretch * 22, capTilt: Math.sin(t * 0.8) * 2 - stretch * 5, capDrop: 0,
        mouth: stretch * 0.45, look: -glance * 0.9, wiggle: 0, shake, tuck: 0, paddle: 0, twirl: 0,
      };
      const walk = { ...idle, lift: 0, lean: 5, bend: 0, armN: 22, armF: 22, crown: -5, spread: 0, flap: 0, capTilt: 0, mouth: 0, look: 0.15, shake: 0 };
      const base = {};
      for (const c of Object.keys(idle)) base[c] = mix(idle[c], walk[c], a.walkW ?? 0);
      for (const c of Object.keys(DRESS.channels ?? {})) base[c] ??= 0;
      const mood = m.cine?.mood ?? (a.mood === 'happy' ? 'happy' : null);
      if (mood === 'sad') Object.assign(base, { droop: 0.7, lean: base.lean + 6, armN: 2, armF: 2, look: 0.3, flap: -10 });
      else if (mood === 'happy') Object.assign(base, { spread: 0.5, armN: base.armN + 25, armF: base.armF + 20, flap: base.flap + 10, mouth: 0.3, lift: base.lift + 0.5 * (0.5 - 0.5 * Math.cos(t * 10)) });
      const cur = moveNow(m, a, st);
      const out = cur ? poseAt(cur.mv, cur.t, cur.antic, base) : { ...base };
      a.vgM = m;
      DRESS.pose?.(m, a, out, KIT, cur);
      // Poses: planted half in the ground, sat, asleep (also its nap).
      const nap = m.habit?.kind === 'nap' && (a.now ?? 0) < m.habit.until && m.hp > 0;
      const pose = nap ? 'sleep' : m.pose;
      if (pose === 'plant') Object.assign(out, { sink: plantSink, sit: 0, lie: 0, lean: 0, bend: breath * 0.5, armN: 30 + breath * 3, armF: 30 + breath * 3, crouch: 0, hop: 0, look: 0, mouth: 0 });
      else if (pose === 'sit') Object.assign(out, { sit: 1, lean: -8 + breath * 0.8, armN: 32 + breath * 3, armF: 30 + breath * 3, crouch: 0, hop: 0 });
      else if (pose === 'sleep') {
        const sb = Math.sin(t * 0.95);
        Object.assign(out, { sit: 1, lean: -13 + sb * 2.2, bend: -3 + sb * 1.4, droop: 1, crown: 8, flap: -8, capTilt: 9, armN: 14 + sb * 2, armF: 14 + sb * 2, mouth: 0.16 + 0.08 * sb, look: 0.1, crouch: 0, hop: 0, shake: 0, spread: 0 });
      }
      if (m.hp <= 0) Object.assign(out, { lie: 1, sit: 0, sink: 0, droop: 1, crown: 20, armN: 130, armF: 120, mouth: 0.2, paddle: 0, look: 0, hop: 0, tuck: 0, wiggle: 0, shake: 0 });
      DRESS.after?.(m, a, out, KIT, cur, pose);
      st.vgActive = Boolean(cur);
      a.vgMove = cur;
      a.vgTwirl = out.twirl ?? 0;
      const res = {};
      for (const c of CHS) res[c] = out[c] ?? 0;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.S = S;
      a.bk = skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a, S) => {
      drawFx(ctx, m, a);
      if (a.bk && DRESS.fx) {
        ctx.save();
        DRESS.fx(ctx, m, a, S, KIT);
        ctx.restore();
      }
    },
  });
  // (a still for the Monster Book: the body and its crown at rest, plain)
  const still = () => {
    const w = Math.ceil(hw * 2 + 24);
    const h = Math.ceil(H + 6);
    const cx = w / 2;
    const by = h - P.hb - P.top / 2;
    const shapes = [E(cx, by, hw, P.top / 2, C.base)];
    if (P.leaves) shapes.push(E(cx - 3, by - P.top / 2 - 5, 2.4, 4.4, C.sh), E(cx + 3, by - P.top / 2 - 4.5, 2.2, 4, C.base), E(cx, by - P.top / 2 - 6, 2.6, 5, C.base));
    if (P.cap) shapes.push(E(cx, h - P.hb + P.cap.at[1] - 3.2, P.cap.w / 2, 5.4, C.base));
    if (P.stem) shapes.push(E(cx - 3.6, by - P.top / 2 - 6, 3.6, 2.6, C.sh), E(cx + 3.6, by - P.top / 2 - 6, 3.6, 2.6, C.base));
    return { w, h, res: 3, shapes };
  };
  return { rig, still, stride: G.cycle, speed: P.speed, H, w: Math.round(hw * 2 + 2), h: Math.round(H), moves: P.moves };
}

// One dressed veggie: its art entry (for ARTS) and its size.
export function dressedVeggie(look) {
  const r = veggieRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, speed: r.speed, bodyH: r.H };
}
