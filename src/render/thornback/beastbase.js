// The Bramble Bear concept B's dog (2026-11-26, a moss-stone guardian lion-dog on its temple ball): a
// copy of the blank canine base (blankbeast.js, its dog), kept here so the base itself stays clean
// (the player: "never edit the bases just copy the base and edit that"). What this copy adds: a
// dress, `look`, for a monster on it (dressedBeast(look)):
//   look.C / look.P / look.kit / look.ink  its own colours, its own shape over the dog's (kit: the
//               dog's body and legs stretched or squeezed, as the presets' variant), its own soft
//               outline (never the shared dark one)
//   look.face   (ctx, a, sk, K) its own face, in the head's frame (the base's eye guide line is gone)
//   look.over / look.under  { part: (ctx, a, mode, K) } drawn over / under a part, in both passes
//               (mode 'line': its outline, 'fill': itself), so anything added keeps the outer-
//               outline-only look; parts hindF, foreF, tail, body, hindN, foreN, neck, earF, head, earN
//   look.moves  its own moves over the base's (same form); look.pick (m, a) which one an attack plays
//               (a dungeon's own move, m.move, is an object: only a move's name forces one)
//   look.pose / look.after  (m, a, out, K, mv, mt) its own act on the base's channels, before /
//               after the base's poses (sit, lie, beaten); two more channels here: `gather` (the
//               legs' own stepping and the body's rock from it eased away, for paws placed by hand)
//               and `tip` (unused by the base; the dress's own)
//   look.paw    (a, k, { T, paw, a3, S, LF, ground }) a paw's own place { p, a3, k } (k: how much)
//   look.frame  (ctx, a, K) a transform for the whole figure (all parts and the fx), e.g. toppling
//   look.fx     (ctx, m, a, S, K) live extras over everything
//   look.noEars  no ears at all
//   look.noCheek  no shade at the back of the head
//   look.quiet  no sniffing at the ground in its idle; look.fast (m, a) its own moves stiffen the body's springs
// K, the kit: the skeleton is a.bk; C, P, colour, tint, edge, sc, poly, tubePath, curveThrough,
// shapePath, headShapes(sk, 'skull'|'jaw'), headFrame(ctx, a), earFrame(ctx, a, side), bodyPath(ctx,
// a), H, hb, LF; moves (the base's moves), poseAt, hold.
//
// The base's own notes follow.
// (base) The blank animal bases (2026-11-23, the player: "now we need animals, like a dog/wolf/fox base"):
// a cute chibi four-legged canine, one base with three presets (dog, wolf, fox), rigged and drawn
// live like the other blank bases (blankskin.js: one smooth shape over the bones, outlined only on
// its outer edge), game-ready with its own animal moves. Not monsters in the game: dev pages and new
// builds use them (BEAST_ARTS, BEAST_DEFS; blankrigs.js lists them with the other bases).
//
// The body, side on, facing right:
//   body    a round barrel skinned to two bones, the chest (front) and the hips (back), bending along
//           the spine (`spine`): it arches to spring, hunches to crouch; it pitches nose-up and
//           nose-down (`pitch`), sits (`sit`: the hips go down, the front up) and lies (`lie`)
//   legs    four, each reaching its paw's place on the ground from its socket on the body (two
//           bones and a paw: the forelegs bending at the wrist like a knee, the hind legs back at the
//           hock); stepping in turn at a walk, in diagonal pairs at a trot, gathered into a gallop
//           (hinds, then fores) running; tucked up jumping; the near forepaw can swipe (`fpX`, `fpY`)
//   neck    from the top of the chest up to the head (`neck`)
//   head    a big round chibi head with a snout (`head`), a jaw that opens (`jaw`), a nose, faint
//           guide line where the eyes go; ears on springs, perking up or flattening back (`ears`),
//           swinging as the head moves (floppy for a dog, pointed for a wolf, big for a fox)
//   tail    a chain from the rump, raised or lowered (`tailUp`), wagging (`wag`), swaying, trailing
//           as it runs (curled up over the back for a dog, bushy and low for a wolf, big and bushy
//           with a pale tip for a fox)
// Moves (BEAST_MOVES): bite, pounce, claw, howl, wag (a play bow), jump, dash, dodge, hurt,
// knockdown; poses (m.pose): sit, lie. In a fight a beast takes bite, pounce and claw in turn.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { OUTLINE, sprite } from '../pixel.js';
import { legDefs as legDefsOf, legPhase, stepAt, lowAngle, sinks, placeLeg, legDrawer } from '../mobs/blankquad.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab' };
const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const hexRgb = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
function curveThrough(pts, n, closed = false) {
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : pts;
  const out = [];
  const from = closed ? 1 : 0;
  const to = closed ? pts.length + 1 : pts.length - 1;
  for (let i = from; i < to; i++) {
    const p0 = P[Math.max(0, i - 1)];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}

// ---------- The presets (units: game px at scale 1, about the body's middle; x forward, y down) ----------
// (Chibi: a big round head on a deep-chested little body, the legs a dog's, three bones each.)
// The body's outline, round from the neck: [x, y, how much it follows the near foreleg's upper arm,
// how much the near hind leg's thigh]: the bottom of the chest by the elbow moves with the foreleg
// and the haunch with the hind leg, so the legs grow out of the body as they swing.
const DOG_BODY = [
  [12.5, -8.5, 0, 0], [9, -9.6, 0, 0], [0, -9, 0, 0], [-8, -9.2, 0, 0], [-14, -8.6, 0, 0.1], [-18.6, -5, 0, 0.3], [-19.6, 0.4, 0, 0.55],
  [-17.4, 5.2, 0, 0.8], [-11.2, 7.4, 0, 0.85], [-6.4, 5.4, 0, 0.3], [0, 6.6, 0, 0], [5.6, 8.8, 0.35, 0], [9.2, 9, 0.85, 0], [13.6, 4.6, 0.55, 0],
  [16, 0, 0.15, 0], [15.4, -4.4, 0, 0],
];
// A leg: its top joint, inside the body (the shoulder; the hip), then each joint from the last (the
// elbow, the wrist, the paw; the knee, the hock, the paw), and its widths at each.
const DOG = {
  name: 'Dog',
  scale: 1,
  body: DOG_BODY,
  chest: [12, 2.6, 4.6, 4.2],
  fore: { top: [10, 1.2], bones: [[-1, 6.6], [1, 6], [1, 3.4]], w: [7.6, 5.4, 3.8, 3.3] },
  hind: { top: [-13.8, -1.2], bones: [[4.2, 7], [-6.6, 5.6], [0.2, 5.8]], w: [10, 6.6, 3.9, 3.3] },
  far: [-1.8, -0.6],
  paw: { w: 5.4, h: 3, up: 1.3 },
  neck: { base: [11.5, -5.2], len: 8, w: 7.6, ang: -58 },
  head: { rx: 9, ry: 8.5, snout: { at: [1.5, 1.4], len: 11, h: 6.6 }, nose: 1.9, cheek: false },
  ears: { kind: 'flop', near: [-2.4, -6.6], far: [-5.4, -6], size: 1 },
  tail: { root: [-17, -6.4], n: 5, seg: 3.3, w: [4.8, 2.6], start: -2.25, curl: 0.34, bush: 0, tip: 0 },
};
// (A variant: the body stretched or squeezed, the legs longer or shorter, thicker or slimmer.)
const variant = (base, { bx, by, lx, ls, lw }, extra) => {
  const leg = (G) => ({ top: [G.top[0] * bx, G.top[1] * by], bones: G.bones.map(([x, y]) => [x * lx, y * ls]), w: G.w.map((v) => v * lw) });
  return { ...base, ...extra, body: base.body.map(([x, y, f, h]) => [x * bx, y * by, f, h]), fore: leg(base.fore), hind: leg(base.hind), chest: [base.chest[0] * bx, base.chest[1] * by, base.chest[2], base.chest[3]] };
};
const WOLF = variant(DOG, { bx: 1.08, by: 0.94, lx: 1.1, ls: 1.25, lw: 0.95 }, {
  name: 'Wolf',
  scale: 1.1,
  neck: { base: [12.4, -4.9], len: 9, w: 8.2, ang: -50 },
  head: { rx: 8.6, ry: 8, snout: { at: [1.5, 1.6], len: 13.5, h: 6.2 }, nose: 1.9, cheek: true },
  ears: { kind: 'point', near: [-1.6, -6.6], far: [-4.8, -6.2], size: 1 },
  tail: { root: [-18.6, -6], n: 6, seg: 3.4, w: [6, 3], start: 2.35, curl: -0.08, bush: 3, tip: 0 },
});
const FOX = variant(DOG, { bx: 1.02, by: 0.84, lx: 1, ls: 1.02, lw: 0.8 }, {
  name: 'Fox',
  scale: 0.9,
  paw: { w: 4.8, h: 2.7, up: 1.2 },
  neck: { base: [11.7, -4.4], len: 8, w: 6.8, ang: -56 },
  head: { rx: 8.4, ry: 7.8, snout: { at: [1.6, 1.8], len: 13, h: 5.2 }, nose: 1.6, cheek: true },
  ears: { kind: 'fox', near: [-1.6, -6.2], far: [-4.8, -5.8], size: 1 },
  tail: { root: [-17.6, -5.2], n: 6, seg: 3.6, w: [5, 3.4], start: 2.95, curl: 0.06, bush: 5.5, tip: 0.3 },
});
const BEAST_PRESETS = { dog: DOG, wolf: WOLF, fox: FOX };

// ---------- The animal moves (keys as blankmoves.js; units: x, lift, hop in body heights, fp in leg lengths) ----------
const BEAST_MOVES = {
  bite: {
    anticT: 0.2,
    keys: [
      [0, { x: -0.06, crouch: 0.35, pitch: 5, neck: 14, head: 8, ears: -0.4, jaw: 0.15, tailUp: 10 }],
      [0.07, { x: 0.11, crouch: 0, pitch: -4, neck: -14, head: -6, ears: 0.6, jaw: 1, tailUp: 18 }, 'out'],
      [0.12, { x: 0.12, pitch: -3, neck: -12, head: -2, ears: 0.6, jaw: 0, tailUp: 18 }, 'out'],
      [0.3, { x: 0.1, pitch: -2, neck: -8, head: 0, ears: 0.4, jaw: 0.05, tailUp: 14 }],
      [0.55, {}],
    ],
    spark: [0.12],
    sparkAt: 'snout',
  },
  pounce: {
    anticT: 0.32,
    keys: [
      [0, { x: -0.05, crouch: 0.75, pitch: 6, spine: 10, neck: 10, ears: 0.8, tailUp: 22, wag: 0.4 }],
      [0.15, { x: 0.28, hop: 0.45, crouch: 0, pitch: -12, spine: -14, neck: -12, head: -6, ears: -0.6, tailUp: 30, stretch: 1, jaw: 0.6 }, 'out'],
      [0.34, { x: 0.42, hop: 0.14, pitch: 10, spine: 6, neck: -4, ears: -0.2, stretch: 0.6, jaw: 0.3 }, 'in'],
      [0.44, { x: 0.44, hop: 0, crouch: 0.45, pitch: 6, spine: 8, neck: 6, ears: 0.4, jaw: 0 }, 'in'],
      [0.85, {}],
    ],
    spark: [0.42],
    sparkAt: 'paw',
    dust: [[0.44, 'front']],
  },
  claw: {
    anticT: 0.2,
    keys: [
      [0, { pitch: -9, crouch: 0.15, fpX: -0.25, fpY: 1.05, neck: -4, ears: 0.6, tailUp: 14 }],
      [0.07, { pitch: 5, x: 0.05, fpX: 0.75, fpY: 0.25, neck: 6, head: 4, ears: 0.3, tailUp: 10 }, 'out'],
      [0.24, { pitch: 4, x: 0.05, fpX: 0.7, fpY: 0.1, neck: 5, head: 3, tailUp: 10 }],
      [0.5, {}],
    ],
    trail: [[0, 0.12, 'paw']],
    spark: [0.07],
    sparkAt: 'paw',
  },
  howl: {
    anticT: 0.3,
    keys: [
      [0, { sit: 1, neck: -10, head: -6, ears: 0.4 }],
      [0.25, { sit: 1, pitch: -6, neck: -38, head: -40, jaw: 0.85, ears: -0.4, tailUp: -10 }, 'io'],
      [1.05, { sit: 1, pitch: -6, neck: -40, head: -42, jaw: 0.75, ears: -0.5, tailUp: -12 }],
      [1.4, {}],
    ],
  },
  wag: {
    anticT: 0.12,
    keys: [
      [0, { pitch: 14, crouch: 0.35, spine: 6, neck: 12, head: 10, ears: 1, wag: 1, tailUp: 28 }],
      [0.18, { hop: 0.12, pitch: 2, ears: 1, wag: 1, tailUp: 30, jaw: 0.4 }, 'out'],
      [0.36, { pitch: 14, crouch: 0.35, spine: 6, neck: 12, head: 10, ears: 1, wag: 1, tailUp: 28, jaw: 0.4 }, 'in'],
      [0.54, { hop: 0.12, pitch: 2, ears: 1, wag: 1, tailUp: 30, jaw: 0.4 }, 'out'],
      [0.72, { pitch: 12, crouch: 0.3, ears: 1, wag: 1, tailUp: 26, jaw: 0.3 }, 'in'],
      [1.05, {}],
    ],
    spark: [0.18, 0.54],
    sparkAt: 'head',
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.6, pitch: 4, ears: 0.5 }],
      [0.16, { hop: 0.6, crouch: 0, pitch: -10, ears: -0.4, tailUp: 20 }, 'out'],
      [0.32, { hop: 0.66, pitch: 0, ears: -0.2, tailUp: 18 }, 'out'],
      [0.5, { hop: 0.04, pitch: 8, ears: 0.2 }, 'in'],
      [0.56, { crouch: 0.45, pitch: 4 }, 'out'],
      [0.85, {}],
    ],
    dust: [[0, 'feet'], [0.54, 'feet']],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.3 }],
      [0.08, { x: 0.18, crouch: 0.2, pitch: -6, spine: -8, neck: -14, ears: -1, tailUp: 6, stretch: 0.6 }, 'out'],
      [0.3, { x: 0.22, crouch: 0.15, pitch: -5, spine: -6, neck: -12, ears: -1, tailUp: 6, stretch: 0.5 }],
      [0.6, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.3 }],
      [0.12, { hop: 0.22, x: -0.2, pitch: -14, neck: -10, head: -8, ears: -0.8, tailUp: -10 }, 'out'],
      [0.28, { x: -0.24, crouch: 0.4, pitch: 2, ears: -0.4 }, 'in'],
      [0.62, {}],
    ],
    dust: [[0.28, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -8, neck: 10, head: -12, ears: -1, crouch: 0.25, tailUp: -18, jaw: 0.3 }, 'out'], [0.2, { x: -0.05, pitch: -6, neck: 8, head: -9, ears: -1, crouch: 0.2, tailUp: -16, jaw: 0.2 }], [0.55, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, pitch: -12, head: -14, ears: -1, tailUp: -16, jaw: 0.4 }, 'out'],
      [0.38, { lie: 1, x: -0.08, neck: 14, head: 16, ears: -1, tailUp: -24, jaw: 0.1 }, 'in'],
      [0.46, { lie: 0.94, x: -0.08, neck: 10, head: 10, ears: -1, tailUp: -24 }, 'out'],
      [1.05, { lie: 1, x: -0.08, neck: 16, head: 18, ears: -0.9, tailUp: -24 }],
      [1.32, { crouch: 0.4, x: -0.04, neck: 0, ears: 0.2 }],
      [1.6, {}],
    ],
    dust: [[0.38, 'body']],
  },
};
const BEAST_SHOW = ['bite', 'pounce', 'claw', 'howl', 'wag', 'jump', 'dash', 'dodge', 'hurt', 'knockdown'];
const POOL = ['bite', 'pounce', 'claw'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: smoothstep };
function poseAt(mv, t, antic, base) {
  const K = mv.keys;
  const out = { ...base };
  const chans = new Set();
  for (const [, p] of K) for (const k of Object.keys(p)) chans.add(k);
  if (t < 0) {
    for (const k of chans) out[k] = (base[k] ?? 0) + ((K[0][1][k] ?? base[k] ?? 0) - (base[k] ?? 0)) * antic;
    return out;
  }
  let i = 0;
  while (i < K.length - 1 && t >= K[i + 1][0]) i++;
  if (i >= K.length - 1) return out;
  const [t0, p0] = K[i];
  const [t1, p1, e = 'io'] = K[i + 1];
  const u = (EASE[e] ?? smoothstep)(Math.min(1, Math.max(0, (t - t0) / Math.max(1e-3, t1 - t0))));
  for (const k of chans) {
    const a = p0[k] ?? base[k] ?? 0;
    const b = p1[k] ?? base[k] ?? 0;
    out[k] = a + (b - a) * u;
  }
  return out;
}
const since = (moments, t, len) => {
  let best = -1;
  for (const m of moments ?? []) if (typeof m === 'number' && t >= m && t <= m + len) best = (t - m) / len;
  return best;
};

const CH = ['x', 'lift', 'hop', 'pitch', 'spine', 'crouch', 'sit', 'lie', 'stretch', 'neck', 'head', 'jaw', 'ears', 'tailUp', 'wag', 'fpX', 'fpY', 'gather', 'tip'];
const EMPTY = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig for a preset ----------
function beastRig(look = {}) {
  // (the dress, by a name the base's own code never uses)
  const DRESS = look;
  const P00 = BEAST_PRESETS[look.kind ?? 'dog'];
  const LP = look.P ?? {};
  let P = { ...P00, ...LP, head: { ...P00.head, ...(LP.head ?? {}), snout: { ...P00.head.snout, ...(LP.head?.snout ?? {}) } }, ears: { ...P00.ears, ...(LP.ears ?? {}) }, tail: { ...P00.tail, ...(LP.tail ?? {}) }, neck: { ...P00.neck, ...(LP.neck ?? {}) }, paw: { ...P00.paw, ...(LP.paw ?? {}) } };
  if (look.kit) P = variant(P, look.kit, {});
  const C = { ...C0, ...(look.C ?? {}) };
  Object.assign(BEAST_MOVES, look.moves ?? {});
  const s = P.scale;
  const sc = (v) => v * s;
  // Its legs at rest (blankquad.js: three bones each, like a real dog's).
  const legDefs = legDefsOf(P, sc);
  const hb = sc((legDefs.foreN.rest[3][1] + legDefs.hindN.rest[3][1]) / 2 + P.paw.up);
  const bodyLen = sc(Math.max(...P.body.map((p) => p[0])) - Math.min(...P.body.map((p) => p[0])));
  const H = hb + sc(P.neck.len * 0.9 + P.head.ry * 1.6);
  const LF = legDefs.foreN.lens.reduce((x, y) => x + y, 0);
  const stride = LF * 1.15;
  const walkSpeed = stride * 1.5;
  // (how far the body goes in one whole stride, `r` how much it gallops)
  const cycle = (r) => stride * (1 + 0.7 * r);

  // The skeleton, worked out each frame from the channels (rig space: feet at 0, 0, y down).
  function skeleton(S, a) {
    const t = a.t;
    const gath = clamp(S.gather ?? 0, 0, 1);
    const w = (a.walkW ?? 0) * (1 - gath);
    const st = a.mo.rig;
    const run = st.bkRun ?? 0;
    const trot = st.bkTrot ?? 0;
    const u = st.bkU ?? 0;
    const lie = clamp(S.lie, 0, 1);
    const sit = clamp(S.sit, 0, 1);
    // The step first: a planted paw ahead of its shoulder or hip, or behind it, holds that end of
    // the body lower (the leg slants), so the shoulders and the hips rise and dip in turn as each
    // leg passes under them and the body rocks and bobs with every step, of itself; in a gallop's
    // flight, no paw down, it floats; the spine flexes with the stride (most in the gallop).
    const steps = {};
    for (const k of Object.keys(legDefs)) steps[k] = stepAt(u, legPhase(k, trot, run), run, cycle(run), LF);
    const { fS, hS, down } = sinks(legDefs, steps);
    const float = down ? 0 : LF * 0.07 * run;
    // (rocking over the legs as a long body does, the taurs' calm: the seesaw's lever taken as the
    // whole body's length, not just from shoulder to hip)
    const rock = Math.atan2((fS - hS) * w, bodyLen * 1.6);
    const pivot = [S.x, -(hb + S.lift - S.crouch * hb * 0.3 - lie * hb * 0.62 - sit * hb * 0.36) - S.hop + ((fS + hS) * 0.35 - float) * w];
    const th = (-S.pitch - sit * 30) * D2R + rock;
    const spine = S.spine + Math.sin(4 * Math.PI * u + 0.5) * (0.6 + 0.8 * trot + 4 * run) * w;
    const thC = th - (spine * D2R) / 2;
    const thH = th + (spine * D2R) / 2;
    // (the head held steady, a small nod with the forefeet, steadier than the body)
    const nod = Math.sin(4 * Math.PI * u - 1) * (0.8 + 0.8 * trot + 2 * run) * w - (rock / D2R) * 0.8;
    const half = bodyLen * 0.5;
    // (a point of the body on the spine: between the chest's bone and the hips' by how far forward)
    const spinePt = (p) => {
      const q = [sc(p[0]), sc(p[1])];
      const k = smoothstep((q[0] + half * 0.3) / (half * 0.6));
      return add(pivot, add(rot(q, thC).map((v) => v * k), rot(q, thH).map((v) => v * (1 - k))));
    };
    // Each leg: where its paw goes (the step, or a pose: reaching, a leap, tucked up, lying, sitting),
    // how its lowest bone slants, then its upper two bones reaching the joint above the paw (the
    // elbow bending back, the knee forward).
    const tuck = clamp(S.hop / (hb * 0.5), 0, 1) * (1 - clamp(S.stretch, 0, 1)) * (1 - gath);
    const ground = -sc(P.paw.up);
    const Lg = {};
    for (const [k, L] of Object.entries(legDefs)) {
      const g = steps[k];
      // (the shoulder blade slides along the ribs with the foreleg's swing; the hip is fixed in the pelvis)
      const T = spinePt(L.hind ? L.top : [L.top[0] + (g.dx / s) * 0.06 * w, L.top[1]]);
      let paw = [sc(L.rest[3][0]) + S.x * 0.35 * (1 - w) + g.dx * w, ground - g.lift * w - S.hop];
      let a3 = lerp(L.a3, lowAngle(L, g), w);
      const to = (q, ang, k2) => {
        paw = [lerp(paw[0], q[0], k2), lerp(paw[1], q[1], k2)];
        a3 = lerp(a3, ang, k2);
      };
      if (k === 'foreN' && (S.fpX || S.fpY)) {
        paw = add(paw, [S.fpX * LF, -S.fpY * LF]);
        a3 = lerp(a3, 0.6, clamp(S.fpY, 0, 1));
      }
      if (S.stretch > 0) to(add(T, L.hind ? [-LF * 0.9, LF * 0.34] : [LF * 0.88, LF * 0.32]), L.hind ? -1.25 : 0.75, clamp(S.stretch, 0, 1));
      if (tuck > 0) to(add(T, L.hind ? [LF * 0.12, LF * 0.5] : [LF * 0.14, LF * 0.52]), L.hind ? -0.95 : -1.95, tuck);
      if (lie > 0) to(L.hind ? [T[0] + LF * 0.42, ground] : [T[0] + LF * 0.9, ground], L.hind ? 1.4 : 1.45, lie);
      // (sitting: the hind legs folded flat under the rump, the forelegs straight down under the chest)
      if (sit > 0) to(L.hind ? [T[0] + LF * 0.36, ground] : [T[0] - LF * 0.2, ground], L.hind ? 1.32 : L.a3, sit);
      // (the dress's own place for a paw: on its ball, paddling, ...)
      const own = DRESS.paw?.(a, k, { T, paw, a3, S, LF, ground, L });
      if (own && own.k > 0) to(own.p, own.a3 ?? a3, clamp(own.k, 0, 1));
      const bones = placeLeg(L, T, paw, a3);
      // (a planted paw lies flat; a lifted one tips with its bone)
      const flat = g.v < 0 && Math.max(lie, sit * (L.hind ? 1 : 0), tuck) < 0.5 ? 0.22 : 0.62;
      Lg[k] = { hind: L.hind, ...bones, rot: (a3 - L.a3) * flat, w: L.w };
    }
    // The body's outline points follow the spine, and near the near legs those legs' upper bones:
    // the chest's bottom by the elbow turns with the upper arm about the shoulder, the haunch with
    // the thigh about the hip.
    // (the bone's turn from its rest, the short way round: a leg raised high, its upper bone past
    // straight up, crossed the angle's wrap and swung the chest a whole turn in one frame, 2026-11-26)
    const wrapT = (v) => Math.atan2(Math.sin(v), Math.cos(v));
    const dF = wrapT(Lg.foreN.up - (legDefs.foreN.up + thC)) * 0.55;
    const dH = wrapT(Lg.hindN.up - (legDefs.hindN.up + thH)) * 0.55;
    const turnAbout = (q, c, ang) => add(c, rot([q[0] - c[0], q[1] - c[1]], ang));
    const bodyPt = (p) => {
      let q = spinePt(p);
      if (p[2]) q = lerp2(q, turnAbout(q, Lg.foreN.T, dF), p[2]);
      if (p[3]) q = lerp2(q, turnAbout(q, Lg.hindN.T, dH), p[3]);
      return q;
    };
    const L = Lg;
    // The neck and the head, on the chest.
    const nb = bodyPt(P.neck.base);
    const na = thC + (P.neck.ang + S.neck + nod * 0.5 + sit * 12) * D2R;
    const hp = add(nb, [Math.cos(na) * sc(P.neck.len), Math.sin(na) * sc(P.neck.len)]);
    const ha = thC + (S.neck + S.head + nod + sit * 26) * D2R;
    // The ears: each a spring trailing the head's swing.
    const earGoal = S.ears;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const e = (st.bkEar ??= { x: 0, v: 0, last: ha });
    const spin = dt > 0 ? (ha - e.last) / dt : 0;
    e.last = ha;
    // (and bounce as the body rises and falls, the drop at each step flinging them)
    const vy = dt > 0 ? (pivot[1] - (st.bkPy ?? pivot[1])) / dt : 0;
    const ay = dt > 0 ? (vy - (st.bkVy ?? vy)) / dt : 0;
    st.bkPy = pivot[1];
    st.bkVy = vy;
    e.v += (-(e.x * 170) - e.v * 16 - spin * 3 + clamp(ay, -900, 900) * 0.0018) * dt;
    e.x += e.v * dt;
    e.x = clamp(e.x, -0.35, 0.35);
    // The tail: from the rump, raised, wagging, trailing back as it runs; each piece a spring that
    // follows the one before it, a little looser toward the tip, so the body's rocks and turns and
    // a wag run down it as a wave, the tip trailing and whipping after.
    const tr = bodyPt(P.tail.root);
    const tail = [tr];
    const wagA = S.wag * Math.sin(t * 16) * 0.55;
    const ch = (st.bkTail ??= []);
    let prevA = null;
    for (let i = 1; i <= P.tail.n; i++) {
      const kf = i / P.tail.n;
      let goal;
      // (raised: turned up from its rest; running: streamed back toward level behind)
      if (i === 1) goal = thH + P.tail.start + S.tailUp * D2R + wagA;
      else goal = prevA + P.tail.curl + wagA * 0.2 + Math.sin(t * 1.6 - i * 0.7) * 0.015;
      goal += (w * 0.05 + run * 0.08) * (P.tail.start < 0 ? -1 : 1) * kf;
      const sp = (ch[i] ??= { x: goal, v: 0 });
      const kk = 300 - kf * 120;
      const cc = 22 - kf * 6;
      for (let n = 0; n < 2; n++) {
        sp.v += ((goal - sp.x) * kk - sp.v * cc) * (dt / 2);
        sp.x += sp.v * (dt / 2);
      }
      if (!(Math.abs(sp.x - goal) < 1.2)) sp.x = goal + clamp(sp.x - goal, -1.2, 1.2);
      prevA = sp.x;
      const next = add(tail[i - 1], [Math.cos(sp.x) * sc(P.tail.seg), Math.sin(sp.x) * sc(P.tail.seg)]);
      // (it lies along the ground, never through it)
      next[1] = Math.min(next[1], -sc(P.tail.w[1]) * 0.5);
      tail.push(next);
    }
    return { pivot, th, thC, thH, bodyPt, spinePt, legs: L, nb, hp, ha, jaw: clamp(S.jaw, 0, 1), ear: e.x, ears: earGoal, tail, twitch: a.bkTwitch ?? [0, 0] };
  }

  // ---------- Drawing ----------
  const colour = (a, c) => {
    const k = Math.min(0.85, (a.flash ?? 0) * 6);
    if (k <= 0) return c;
    const [r, g, b] = hexRgb(c);
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  };
  const poly = (ctx, pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  const edge = (ctx) => {
    ctx.strokeStyle = DRESS.ink ?? OUTLINE;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const QD = legDrawer({ C, edge });
  const { tubePath, limb } = QD;
  // A leg (blankquad.js): the far ones under the body, the near ones over its side, grown out of it;
  // the paw a soft round, flat on the ground, tipping as it lifts.
  function drawLeg(ctx, a, mode, k) {
    const sk = a.bk;
    const Lg = sk.legs[k];
    const far = k.endsWith('F');
    const pw = sc(P.paw.w);
    const ph = sc(P.paw.h);
    const path = (c2, grow = 0) => {
      const [cx, cy] = add(Lg.P, rot([pw * 0.16, ph * 0.08], Lg.rot));
      c2.moveTo(cx + pw * 0.5 + grow, cy);
      c2.ellipse(cx, cy, pw * 0.5 + grow, ph * 0.5 + grow, Lg.rot, 0, TAU);
    };
    QD.drawLeg(ctx, mode, Lg, {
      far,
      colour: (c) => colour(a, c),
      tint: (c, al) => tint(a, c, al),
      bodyPts: far ? null : (sk.bodyPts ??= outline.map(sk.bodyPt)),
      foot: { path },
      unit: s,
    });
  }
  // A colour with see-through (and the hit flash).
  const tint = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = hexRgb(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
  };
  // The body: its outline (skinned to the spine and the near legs), the back lit, the belly between
  // the legs in soft shade, the shoulder and the haunch lit round where the legs move them, a pale
  // chest.
  const outline = curveThrough(P.body, 4, true);
  // (the longest unbroken run of outline points that pass, wrapping round the end of the outline)
  const runOf = (ok) => {
    const n = outline.length;
    const start = outline.findIndex((p) => !ok(p));
    let best = [];
    let cur = [];
    for (let j = 1; j <= n; j++) {
      const i = (start + j) % n;
      if (ok(outline[i])) cur.push(i);
      else {
        if (cur.length > best.length) best = cur;
        cur = [];
      }
    }
    return cur.length > best.length ? cur : best;
  };
  const backIdx = runOf((p) => p[1] < -5.5);
  // (where the belly's shade fades out: just clear of the near legs' elbow and knee at rest)
  const bellyEnds = [legDefs.hindN.rest[1][0] + P.hind.w[1] / 2 + 0.5, legDefs.foreN.rest[1][0] - P.fore.w[1] / 2 - 0.5];
  const bellyIdx = runOf((p) => p[1] > 4.5 && p[0] > P.hind.top[0] + 1.5 && p[0] < P.fore.top[0] - 0.5);
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    const pts = (sk.bodyPts ??= outline.map(sk.bodyPt));
    poly(ctx, pts);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill();
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    const [sr, sg, sb] = hexRgb(C.sh);
    const [lr, lg, lb] = hexRgb(C.lt);
    const glow = (c, r, k, rgb) => {
      const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
      gr.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${k})`);
      gr.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
    };
    // the back's light, a band in from the top
    const back = backIdx.map((i) => outline[i]);
    // (tapering to nothing at both ends, so it never ends in a sliver)
    const tb = (i) => 3.2 * smoothstep(Math.min(i, back.length - 1 - i) / 3);
    poly(ctx, [...back.map(sk.bodyPt), ...back.map(([x, y, f, h], i) => sk.bodyPt([x, y + tb(i), f, h])).reverse()]);
    ctx.fillStyle = `rgba(${lr},${lg},${lb},0.75)`;
    ctx.fill();
    // the belly's shade, between the legs, fading out before them (so where a leg comes out of the
    // body, the body there is the leg's own colour, no seam)
    const belly = bellyIdx.map((i) => outline[i]);
    if (belly.length > 1) {
      const tl = (i) => 3.6 * smoothstep(Math.min(i, belly.length - 1 - i) / 3);
      poly(ctx, [...belly.map(sk.bodyPt), ...belly.map(([x, y, f, h], i) => sk.bodyPt([x, y - tl(i), f, h])).reverse()]);
      const [g0, g1] = [sk.bodyPt([bellyEnds[0], 6]), sk.bodyPt([bellyEnds[1], 6])];
      const bg = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
      bg.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
      bg.addColorStop(0.3, `rgba(${sr},${sg},${sb},0.7)`);
      bg.addColorStop(0.7, `rgba(${sr},${sg},${sb},0.7)`);
      bg.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      ctx.fillStyle = bg;
      ctx.fill();
    }
    glow(sk.bodyPt(P.chest), sc(P.chest[2]) * 1.2, 0.85, [lr, lg, lb]);
    // (the haunch and the shoulder lit round, soft, moving with the legs under them)
    const Lf = sk.legs.foreN;
    const Lh = sk.legs.hindN;
    glow(add(lerp2(Lh.T, Lh.J1, 0.25), [-sc(1.4), -sc(1.2)]), sc(6.5), 0.5, [lr, lg, lb]);
    glow(add(lerp2(Lf.T, Lf.J1, 0.3), [-sc(0.4), -sc(0.6)]), sc(4.4), 0.4, [lr, lg, lb]);
    ctx.restore();
  }
  function drawNeck(ctx, a, mode) {
    const sk = a.bk;
    const pts = curveThrough([sk.nb, sk.hp], 5);
    const wl = pts.map(() => sc(P.neck.w));
    tubePath(ctx, pts, wl);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
  }
  // The head, in its own frame (about its middle, the snout forward): the skull, the snout and the
  // jaw under it (hinged, opening), the nose, a cheek's fluff, the guides where the eye goes.
  function headShapes(sk, which) {
    const Hd = P.head;
    const sn = Hd.snout;
    const out = [];
    if (which === 'skull') {
      out.push(['e', 0, 0, sc(Hd.rx), sc(Hd.ry)]);
      // the snout: a round-ended bar forward from the face
      const x0 = sc(sn.at[0]);
      const y0 = sc(sn.at[1]);
      // (wide where it leaves the face, tapering to the nose, so it grows out of the head)
      out.push(['cap', x0, y0 - sc(sn.h) * 0.1, x0 + sc(sn.len), y0 - sc(sn.h) * 0.08, sc(sn.h) * 1.15, sc(sn.h) * 0.64]);
    }
    if (which === 'jaw') {
      const x0 = sc(sn.at[0] - 1);
      const y0 = sc(sn.at[1] + sn.h * 0.28);
      out.push(['cap', x0, y0, x0 + sc(sn.len * 0.86), y0 + sc(0.2), sc(sn.h) * 0.58, sc(sn.h) * 0.36]);
    }
    return out;
  }
  const shapePath = (ctx, list) => {
    ctx.beginPath();
    for (const sh of list) {
      if (sh[0] === 'e') {
        ctx.moveTo(sh[1] + sh[3], sh[2]);
        ctx.ellipse(sh[1], sh[2], sh[3], sh[4], 0, 0, TAU);
      } else if (sh[0] === 'cap') {
        const [, x0, y0, x1, y1, w0, w1] = sh;
        tubePathInto(ctx, [[x0, y0], [x1, y1]], [w0, w1], 6);
      } else if (sh[0] === 'tri') {
        const [, x, y, r] = sh;
        ctx.moveTo(x + r * 0.5, y - r * 0.6);
        ctx.lineTo(x - r * 0.9, y + r * 0.2);
        ctx.lineTo(x + r * 0.4, y + r * 0.7);
        ctx.closePath();
      }
    }
  };
  // (a tube's discs and strips added to the current path)
  const tubePathInto = (ctx, ends, ws, n) => {
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const v = i / n;
      const x = lerp(ends[0][0], ends[1][0], v);
      const y = lerp(ends[0][1], ends[1][1], v);
      const r = lerp(ws[0], ws[1], v) / 2;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
      // (and the strip to the last disc, so its edge runs smooth, never scalloped)
      if (prev) {
        const [x0, y0, r0] = prev;
        const len = Math.hypot(x - x0, y - y0) || 1;
        const nx = -(y - y0) / len;
        const ny = (x - x0) / len;
        ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
        ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
        ctx.lineTo(x - nx * r, y - ny * r);
        ctx.lineTo(x + nx * r, y + ny * r);
        ctx.closePath();
      }
      prev = [x, y, r];
    }
  };
  // (an ear's own frame, for the dress: its root at 0, 0, pointing up)
  function earFrame(ctx, a, k) {
    const sk = a.bk;
    const E0 = P.ears;
    const far = k === 'far';
    const root = E0[k === 'far' ? 'far' : 'near'].map(sc);
    const z = sc(E0.size);
    let pts;
    let ang;
    const tw = sk.twitch[far ? 1 : 0];
    if (E0.kind === 'flop') {
      pts = [[0, 0], [3.2, -0.8], [5.4, 3.6], [4.6, 9.6], [1.6, 11.6], [-1.6, 8.4], [-2, 2.2]].map(([x, y]) => [x * z, y * z]);
      ang = (-0.15 - sk.ears * 0.25 + sk.ear * 0.8) - (far ? 0.12 : 0) - tw * 0.35;
    } else {
      const big = E0.kind === 'fox' ? 1.45 : 1;
      pts = [[-3.2, 0.6], [-1.4, -6], [0.2, -9.4 * big], [1.8, -6], [3.4, 0.6]].map(([x, y]) => [x * z * (E0.kind === 'fox' ? 1.15 : 1), y * z]);
      ang = (-0.1 - Math.max(0, -sk.ears) * 0.9 + Math.max(0, sk.ears) * 0.12 + sk.ear * 0.5) - (far ? 0.18 : 0) - tw * 0.3;
    }
    ctx.translate(sk.hp[0], sk.hp[1]);
    ctx.rotate(sk.ha);
    ctx.translate(root[0], root[1]);
    ctx.rotate(ang);
    return pts;
  }
  function drawEar(ctx, a, mode, k) {
    if (DRESS.noEars) return;
    const sk = a.bk;
    const E0 = P.ears;
    const far = k === 'far';
    const root = E0[k === 'far' ? 'far' : 'near'].map(sc);
    const z = sc(E0.size);
    let pts;
    let ang;
    const tw = sk.twitch[far ? 1 : 0];
    if (E0.kind === 'flop') {
      pts = [[0, 0], [3.2, -0.8], [5.4, 3.6], [4.6, 9.6], [1.6, 11.6], [-1.6, 8.4], [-2, 2.2]].map(([x, y]) => [x * z, y * z]);
      ang = (-0.15 - sk.ears * 0.25 + sk.ear * 0.8) - (far ? 0.12 : 0) - tw * 0.35;
    } else {
      const big = E0.kind === 'fox' ? 1.45 : 1;
      pts = [[-3.2, 0.6], [-1.4, -6], [0.2, -9.4 * big], [1.8, -6], [3.4, 0.6]].map(([x, y]) => [x * z * (E0.kind === 'fox' ? 1.15 : 1), y * z]);
      ang = (-0.1 - Math.max(0, -sk.ears) * 0.9 + Math.max(0, sk.ears) * 0.12 + sk.ear * 0.5) - (far ? 0.18 : 0) - tw * 0.3;
    }
    ctx.save();
    ctx.translate(sk.hp[0], sk.hp[1]);
    ctx.rotate(sk.ha);
    ctx.translate(root[0], root[1]);
    ctx.rotate(ang);
    const P2 = curveThrough(pts, 3, true);
    poly(ctx, P2);
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, far ? C.sh : C.base);
    ctx.fill();
    if (E0.kind === 'flop') {
      // (a hanging ear lies over the head: a soft line just inside its edge and a shade down its
      // inner side, so it reads against the head)
      ctx.fillStyle = colour(a, far ? C.deep : C.sh);
      ctx.fill();
      poly(ctx, P2.map(([x, y], i) => {
        const [cx0, cy0] = P2.reduce((m, p) => [m[0] + p[0] / P2.length, m[1] + p[1] / P2.length], [0, 0]);
        const d = Math.hypot(x - cx0, y - cy0) || 1;
        return [x - ((x - cx0) / d) * 0.6, y - ((y - cy0) / d) * 0.6];
      }));
      ctx.fillStyle = colour(a, far ? C.sh : C.base);
      ctx.fill();
      poly(ctx, P2.map(([x, y]) => [x * 0.5 - z * 0.6, y * 0.82 + z * 0.4]));
      ctx.fillStyle = colour(a, far ? C.deep : C.sh);
      ctx.globalAlpha *= 0.55;
      ctx.fill();
      ctx.globalAlpha /= 0.55;
    }
    if (E0.kind !== 'flop') {
      poly(ctx, P2.map(([x, y]) => [x * 0.55, y * 0.6 - z * 0.4]));
      ctx.fillStyle = colour(a, far ? C.deep : C.sh);
      ctx.fill();
    }
    ctx.restore();
  }
  function drawHead(ctx, a, mode) {
    const sk = a.bk;
    const Hd = P.head;
    ctx.save();
    ctx.translate(sk.hp[0], sk.hp[1]);
    ctx.rotate(sk.ha);
    // The jaw first, under the snout, hinged at the back of the snout.
    const hx = sc(Hd.snout.at[0] - 1);
    const hy = sc(Hd.snout.at[1] + Hd.snout.h * 0.28);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(sk.jaw * 0.5);
    ctx.translate(-hx, -hy);
    shapePath(ctx, headShapes(sk, 'jaw'));
    if (mode === 'line') edge(ctx);
    else {
      ctx.fillStyle = colour(a, C.sh);
      ctx.fill('nonzero');
    }
    ctx.restore();
    shapePath(ctx, headShapes(sk, 'skull'));
    if (mode === 'line') {
      edge(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    // A paler underside to the snout and cheek, a light on the crown, the nose, the guides.
    ctx.save();
    shapePath(ctx, headShapes(sk, 'skull'));
    ctx.clip('nonzero');
    const [lr, lg, lb] = hexRgb(C.lt);
    const gl = ctx.createRadialGradient(-sc(Hd.rx) * 0.15, -sc(Hd.ry) * 0.45, 0, -sc(Hd.rx) * 0.15, -sc(Hd.ry) * 0.45, sc(Hd.rx) * 0.8);
    gl.addColorStop(0, `rgba(${lr},${lg},${lb},0.95)`);
    gl.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
    ctx.fillStyle = gl;
    ctx.fillRect(-sc(Hd.rx) * 2, -sc(Hd.ry) * 2, sc(Hd.rx) * 4, sc(Hd.ry) * 4);
    const mx = sc(Hd.snout.at[0] + Hd.snout.len * 0.6);
    const my = sc(Hd.snout.at[1] + Hd.snout.h * 0.3);
    const gm = ctx.createRadialGradient(mx, my, 0, mx, my, sc(Hd.snout.len * 0.5));
    gm.addColorStop(0, `rgba(${lr},${lg},${lb},0.85)`);
    gm.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
    ctx.fillStyle = gm;
    ctx.fillRect(mx - sc(Hd.snout.len), my - sc(Hd.snout.len), sc(Hd.snout.len) * 2, sc(Hd.snout.len) * 2);
    if (!DRESS.noCheek) ctx.fillStyle = colour(a, C.sh);
    else ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.beginPath();
    ctx.ellipse(-sc(Hd.rx) * 0.55, sc(Hd.ry) * 0.35, sc(Hd.rx) * 0.4, sc(Hd.ry) * 0.5, 0, 0, TAU);
    ctx.globalAlpha *= 0.5;
    ctx.fill();
    ctx.globalAlpha /= 0.5;
    ctx.restore();
    const tipX = sc(Hd.snout.at[0] + Hd.snout.len);
    const tipY = sc(Hd.snout.at[1] - Hd.snout.h * 0.12);
    ctx.fillStyle = colour(a, C.nose);
    ctx.beginPath();
    ctx.ellipse(tipX - sc(Hd.nose) * 0.2, tipY - sc(Hd.nose) * 0.2, sc(Hd.nose), sc(Hd.nose) * 0.8, 0, 0, TAU);
    ctx.fill();
    // its own face (the dress)
    DRESS.face?.(ctx, a, sk, KIT);
    ctx.restore();
  }
  function drawTail(ctx, a, mode) {
    const T = a.bk.tail;
    const n = T.length;
    const wl = T.map((_, i) => {
      const v = i / (n - 1);
      return sc(lerp(P.tail.w[0], P.tail.w[1], v) + P.tail.bush * Math.sin(Math.PI * Math.min(1, v * 1.1)));
    });
    const pts = curveThrough(T, 3);
    const W = pts.map((_, i) => {
      const f = (i / (pts.length - 1)) * (n - 1);
      const j = Math.min(n - 2, Math.floor(f));
      return lerp(wl[j], wl[j + 1], f - j);
    });
    tubePath(ctx, pts, W);
    if (mode === 'line') return edge(ctx);
    ctx.fillStyle = colour(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    tubePath(ctx, pts, W);
    ctx.clip('nonzero');
    tubePath(ctx, pts.map(([x, y], i) => [x, y + W[i] * 0.3]), W.map((v) => v * 0.45));
    ctx.fillStyle = colour(a, C.sh);
    ctx.fill('nonzero');
    if (P.tail.tip > 0) {
      const k0 = Math.floor(pts.length * (1 - P.tail.tip));
      tubePath(ctx, pts.slice(k0), W.slice(k0).map((v) => v * 1.1));
      ctx.fillStyle = colour(a, C.lt);
      ctx.fill('nonzero');
    }
    ctx.restore();
  }

  // ---------- Effects: a swipe's trail, sparkles, dust, speed lines ----------
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
  const puff = (ctx, x, y, r, alpha) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const sourceOf = (sk, what) => {
    if (what === 'snout') {
      const tip = rot([sc(P.head.snout.at[0] + P.head.snout.len), sc(P.head.snout.at[1])], sk.ha);
      return add(sk.hp, tip);
    }
    if (what === 'head') return add(sk.hp, [0, -sc(P.head.ry) * 1.2]);
    return sk.legs.foreN.P;
  };
  function drawFx(ctx, m, a, S) {
    const sk = a.bk;
    const st = a.mo.rig;
    const mv = a.bkMove?.mv;
    const t = a.bkMove?.t ?? 0;
    const trail = (st.bkTrail ??= []);
    const win = mv?.trail?.find((w) => t >= w[0] && t <= w[1]);
    if (win) trail.push({ at: a.now, p: sourceOf(sk, win[2]) });
    while (trail.length && (a.now - trail[0].at > 0.14 || a.now < trail[0].at)) trail.shift();
    ctx.save();
    for (let i = 1; i < trail.length; i++) {
      const k = 1 - (a.now - trail[i - 1].at) / 0.14;
      ctx.globalAlpha = 0.6 * k;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.6, H * 0.07 * k);
      ctx.beginPath();
      ctx.moveTo(...trail[i - 1].p);
      ctx.lineTo(...trail[i].p);
      ctx.stroke();
    }
    if (mv) {
      for (const s0 of mv.spark ?? []) {
        const sp = since([s0], t, 0.22);
        if (sp < 0) continue;
        const [sx, sy] = sourceOf(sk, mv.sparkAt ?? 'paw');
        const e = 1 - (1 - sp) ** 3;
        ctx.globalAlpha = 1 - sp;
        star(ctx, sx, sy, H * 0.12 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
        star(ctx, sx, sy, H * 0.06 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
        for (let i = 0; i < 4; i++) {
          const q = (i * TAU) / 4 + 0.6;
          star(ctx, sx + Math.cos(q) * H * 0.16 * e, sy + Math.sin(q) * H * 0.16 * e, H * 0.03, q, i % 2 ? '#ffc8de' : '#fff6c8');
        }
      }
      for (const [d0, where] of mv.dust ?? []) {
        const dp = since([d0], t, 0.45);
        if (dp < 0) continue;
        const gx = where === 'front' ? sk.legs.foreN.P[0] : where === 'body' ? sk.pivot[0] : (sk.legs.foreN.P[0] + sk.legs.hindN.P[0]) / 2;
        const e = 1 - (1 - dp) ** 2;
        for (const s2 of [-1, 1]) for (let i = 0; i < 2; i++) {
          const r = H * (0.05 - i * 0.012) * (0.6 + e * 0.8);
          puff(ctx, gx + s2 * H * (0.08 + i * 0.08) * (0.4 + e), -r * 0.7 - H * 0.02 * e, r, 0.75 * (1 - dp));
        }
      }
      if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
        const k = Math.max(0, Math.min(1, (t - mv.lines[0]) / 0.05, (mv.lines[1] - t) / 0.1));
        ctx.globalAlpha = 0.75 * k;
        ctx.strokeStyle = '#ffffff';
        ctx.lineCap = 'round';
        ctx.lineWidth = Math.max(0.5, H * 0.025);
        for (let i = 0; i < 3; i++) {
          const y = sk.pivot[1] + (i - 1) * H * 0.14;
          const x0 = sk.pivot[0] - bodyLen * 0.6 - H * ((t * 3 + i * 0.37) % 1) * 0.25;
          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.lineTo(x0 - H * 0.3, y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && BEAST_MOVES[m.act.name]) {
      const mv = BEAST_MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lengthOf(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.bkAtk) {
        const pool = m.def.moves ?? POOL;
        st.bkN = (st.bkN ?? m.uid) + 1;
        st.bkPick = typeof m.move === 'string' ? m.move : DRESS.pick?.(m, a) ?? pool[st.bkN % pool.length];
      }
      st.bkAtk = true;
      const mv = BEAST_MOVES[st.bkPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.bkAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(BEAST_MOVES.hurt)) return [BEAST_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(BEAST_MOVES.wag)) return [BEAST_MOVES.wag, gl, 1];
    return [null, 0, 0];
  }
  // (the dress's kit, and its hooks round each part)
  const KIT = {
    C, P, colour, tint, edge, sc, poly, tubePath, curveThrough, shapePath, headShapes, H, hb, LF, moves: BEAST_MOVES, poseAt, hold,
    headFrame: (ctx, a) => {
      ctx.translate(a.bk.hp[0], a.bk.hp[1]);
      ctx.rotate(a.bk.ha);
    },
    earFrame: (ctx, a, side) => earFrame(ctx, a, side),
    bodyPath: (ctx, a) => poly(ctx, (a.bk.bodyPts ??= outline.map(a.bk.bodyPt))),
  };
  const live = (name, draw) => ({
    name,
    draw: (ctx, a, mode) => {
      ctx.save();
      DRESS.frame?.(ctx, a, KIT);
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
      ctx.restore();
    },
  });
  const seq = [
    // (The far legs under the body; the near legs over its side, their thigh and shoulder grown out of
    // it with no line between, so the body and the legs are one.)
    live('hindF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindF')),
    live('foreF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreF')),
    live('tail', drawTail),
    live('body', drawBody),
    live('hindN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindN')),
    live('foreN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreN')),
    live('neck', drawNeck),
    live('earF', (ctx, a, mode) => drawEar(ctx, a, mode, 'far')),
    live('head', drawHead),
    live('earN', (ctx, a, mode) => drawEar(ctx, a, mode, 'near')),
  ];
  const parts = [...seq.map((p) => ({ name: p.name, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'line') })), ...seq.map((p) => ({ name: `${p.name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: EMPTY, paint: (ctx, a) => p.draw(ctx, a, 'fill') }))];
  const rig = makeRig({
    w: Math.ceil(bodyLen * 2.2 + sc(30)),
    h: Math.ceil(H * 1.3),
    soft: true,
    stride,
    recover: 1.4,
    // (well damped, so a head or a body settling after a move eases in, never wobbles)
    springs: Object.fromEntries(CH.map((c) => [c, c === 'jaw' ? [400, 28] : c === 'wag' ? [60, 12] : c === 'neck' || c === 'head' || c === 'ears' ? [170, 23] : [170, 20]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], neck: [260, 28], head: [260, 28] },
    // (the head, ears and tail left on their softer springs in a move, so they trail the body a beat)
    fast: CH.filter((c) => !['neck', 'head', 'ears', 'tailUp', 'wag'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.bkActive),
    kick: { pitch: 50, head: -60 },
    turnKick: { pitch: -20 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      // The gait: its phase from the distance walked; trotting and galloping as it speeds up.
      const dt = Math.max(1e-3, a.dt);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.bkOdo ?? odo)) / dt);
      st.bkOdo = odo;
      st.bkV = (st.bkV ?? 0) + (raw - (st.bkV ?? 0)) * Math.min(1, dt * 5);
      const v = st.bkV;
      const trotGoal = a.moving ? clamp((v - walkSpeed * 1.15) / (walkSpeed * 0.45), 0, 1) : 0;
      const runGoal = a.moving ? clamp((v - walkSpeed * 1.9) / (walkSpeed * 0.6), 0, 1) : 0;
      st.bkTrot = (st.bkTrot ?? 0) + (trotGoal - (st.bkTrot ?? 0)) * Math.min(1, dt * 4);
      st.bkRun = (st.bkRun ?? 0) + (runGoal - (st.bkRun ?? 0)) * Math.min(1, dt * 4);
      st.bkU = ((st.bkU ?? 0) + (v / (stride * (1 + 0.7 * st.bkRun))) * dt) % 1;
      // Standing about: breathing (the chest and back rising), the weight shifting, looking around
      // (a new way every few seconds, held, then turning to the next), now and then a sniff at the
      // ground, each ear twitching on its own, the tail wagging in bursts.
      const breath = Math.sin(t * 1.6);
      const rnd = (n) => {
        const v = Math.sin(n * 12.9898 + (m.uid % 97) * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };
      const blk = Math.floor(t / 4.4);
      const turn = smoothstep(((t / 4.4) % 1) / 0.22);
      const look = lerp(rnd(blk - 1), rnd(blk), turn) * 2 - 1;
      const lookUp = lerp(rnd(blk + 50), rnd(blk + 51), turn) * 2 - 1;
      const sniff = DRESS.quiet ? 0 : hold(t % 13, 8.6, 9.2, 10.4, 11);
      a.bkTwitch = [hold(t % 5.3, 2, 2.05, 2.1, 2.32), hold(t % 6.1, 3.1, 3.15, 3.2, 3.42)];
      const idle = {
        x: Math.sin(t * 0.3) * 0.12, lift: breath * 0.18 - sniff * 1.2, hop: 0, pitch: sniff * 4, spine: breath * 0.6, crouch: sniff * 0.15, sit: 0, lie: 0, stretch: 0,
        neck: look * 5 + lookUp * 3 + sniff * 28, head: look * 4 - lookUp * 3 + breath * 0.4 + sniff * (14 + Math.sin(t * 20) * 1.2), jaw: 0.06 + 0.03 * breath, ears: 0.2 + sniff * 0.35, tailUp: 8 + sniff * 8, wag: 0.03 + 0.45 * hold(t % 12, 1, 1.4, 2.4, 2.9), fpX: 0, fpY: 0,
      };
      const r = st.bkRun;
      const tr = st.bkTrot;
      // Moving: the legs' own step rocks and bobs the body (skeleton); on top only a lean into the run,
      // the head carried a little lower and forward, the ears back as it gallops, the tail still.
      const walk = {
        ...idle,
        x: 0.4, lift: -r * 0.3, pitch: r * 3, spine: 0, neck: -4 - r * 8, head: -2 + r * 2,
        ears: 0.1 - r * 0.9, tailUp: 10 + tr * 4 - r * 6, wag: 0.04, jaw: 0.1 + r * 0.4,
      };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? poseAt(mv, mt, anticW, base) : { ...base };
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      if (m.pose === 'sit') Object.assign(out, { sit: 1, neck: -6, head: 4, ears: 0.4, tailUp: -6, wag: 0.3 });
      else if (m.pose === 'lie') Object.assign(out, { lie: 1, neck: 10, head: 10, ears: 0.1, tailUp: -18, wag: 0.1 });
      if (m.hp <= 0) Object.assign(out, { lie: 1, neck: 18, head: 22, ears: -1, tailUp: -24, wag: 0, jaw: 0.2 });
      DRESS.after?.(m, a, out, KIT, mv, mt);
      st.bkActive = Boolean(mv) || Boolean(DRESS.fast?.(m, a));
      a.bkMove = mv ? { mv, t: mt } : null;
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
    fx: (ctx, m, a, S) => {
      ctx.save();
      DRESS.frame?.(ctx, a, KIT);
      drawFx(ctx, m, a, S);
      DRESS.fx?.(ctx, m, a, S, KIT);
      ctx.restore();
    },
  });
  // (A still for the Monster Book: the body and the head at rest, plain.)
  const still = () => ({ w: Math.ceil(bodyLen * 2.2 + sc(30)), h: Math.ceil(H * 1.3), res: 3, shapes: [E(bodyLen * 1.1, H * 1.3 - hb, bodyLen * 0.55, sc(9.5), C.base), E(bodyLen * 1.1 + sc(16), H * 1.3 - hb - sc(16), sc(P.head.rx), sc(P.head.ry), C.base)] });
  return { rig, still, stride, speed: walkSpeed, H, w: Math.round(bodyLen * 1.4), h: Math.round(H * 1.1) };
}

// One dressed beast: its art entry (for ARTS), its size and its walking pace.
export function dressedBeast(look) {
  const r = beastRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, speed: r.speed, bodyH: r.H, show: BEAST_SHOW };
}
