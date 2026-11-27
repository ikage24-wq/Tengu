// The Airbloom Lamb's body (2026-11-27): a copy of the blank hoofed base (blankhoof.js, its lamb; the hooks
// as in the Rockhound Kid's copy, render/pebblet/hoofbase.js), kept here so the base itself stays clean.
// What this copy adds: a dress, `look`, for a monster on it:
//   look.kind   which of the base's presets it starts from
//   look.C      its own colours over the base's (lt, base, sh, deep, nose, ...)
//   look.P      its own shape over the preset's (merged one level deep)
//   look.ink    its own soft outline colour (never the dark base ink)
//   look.face   (ctx, a, sk, K) its own face (the base's guides are gone)
//   look.over   { part: (ctx, a, mode, K) } drawn over a part, in both passes (mode 'line': its
//               outline, 'fill': itself), so anything added keeps the outer-outline-only look
//   look.under  the same, under a part
//   look.pose   (m, a, out, K, mv, mt) its own idle act and extras on top of the base's channels
//   look.fx     (ctx, m, a, S, K) live extras over everything
//   look.moves  its own moves over the base's (same form as the base's; its def.moves are played in
//               order, the first one first)
//   look.quietIdle  true: the base's own head toss and hoof pawing left out of its standing about
// K, the kit handed to them: its colours and shape (C, P), colour/tint (flash-aware), edge, glow,
// the skeleton's frames, H, the base's moves, so an act can be built from its channels.
//
// The base's own notes follow.
// The hoofed base (2026-11-25): a blank chibi hoofed animal (a lamb, a pony foal, a kid goat) built
// for hoofed animals from the start, nothing carried over from any other base (the player: "NEVER
// reuse another base"); only the engine is shared (rig.js's springs). Drawn live like the other
// blank bases: one smooth shape over its bones, outlined only on its outer edge, in a soft plum ink.
//
// The body, side on, facing right (units: game px at scale 1, about the middle of the back; x
// forward, y down):
//   spine   two bones from the middle of the back, the loin (to the hips) and the withers (to the
//           shoulders), each turning on its own, so it arches (`arch`: the middle up, as it springs),
//           lifts its rump (`hipLift`), and turns whole about a point of its own: about the hind hips
//           as it rears up (`rear`) and grazes, about the shoulders as it bucks (`kick`)
//   body    a barrel: a deep chest, a round rump; the outline near the near legs follows their upper
//           bones, the withers rolling up on the topline as a forehoof takes the weight; the back lit,
//           the belly shaded softly between the legs (never at them, so no seam where a leg comes out)
//   legs    each a real three-bone leg: in front the shoulder, the elbow (bent back), the knee and the
//           fetlock; behind the hip, the stifle (bent forward), the hock and the fetlock; under the
//           fetlock a short pastern and a small hoof (split in two for the lamb and the kid, solid for
//           the foal). It walks (one hoof at a time: hind, fore on the same side, the other hind, the
//           other fore), trots (in diagonal pairs) and canters (three beats and a float) as its speed
//           rises, the step's phase taken from the distance walked so a hoof never slides; a planted
//           hoof stands flat, then peels off over its toe; lifted, a fore folds up at the knee and a
//           hind flexes at the hock, then reaches out to land heel first
//   head    big and round, a soft muzzle, faceless: a soft eye line, a centre line down the face, a
//           muzzle line, a nostril and a mouth line as guides only; it nods with the walk
//   ears    on springs, each rooted at its own base inside the head: the lamb's small flaps out to
//           the side, the foal's upright points, the kid's long drooping leaves; each flicks alone
//   extras  the foal's short mane ridge and tufted tail, the kid's horn nubs and short upturned
//           tail, the lamb's stub of a tail that wiggles; tails are chains of springs
// Moves (HOOF_MOVES): a headbutt (rocks back pawing, then charges head down), a buck (the weight
// thrown onto the forelegs, both hinds kicking out behind), rearing up (the forelegs paddling, then
// stamping down), the pronk (its signature: a frisky spring straight up on four stiff legs, twice,
// when pleased), jump, dash, dodge, hurt, knockdown. Poses (m.pose): stand, graze (head down to the
// ground, nibbling), lie (legs folded under, front end first), sleep (lying, the chin on the ground);
// a nap habit sleeps. Standing about: breathing, glances, ear flicks, a tail swish, weight shifts,
// now and then a head toss or pawing the ground.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { OUTLINE, sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };

// ---------- Small maths of its own ----------
const lerp = (a, b, u) => a + (b - a) * u;
const ease = (u) => {
  const v = u < 0 ? 0 : u > 1 ? 1 : u;
  return v * v * (3 - 2 * v);
};
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const easeIn = (u) => clamp(u, 0, 1) ** 3;
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const minus = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mid = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const turn = ([x, y], r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};
const frac = (v) => v - Math.floor(v);
const toRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const blendHex = (p, q, u) => {
  const a = toRgb(p);
  const b = toRgb(q);
  return `#${a.map((v, i) => Math.round(lerp(v, b[i], u)).toString(16).padStart(2, '0')).join('')}`;
};
// (its ink: the game's outline lifted halfway to a dusty rose, landing on the soft rose-plum the
// game inks this lilac with (#7f6982), never near-black)
const INK = blendHex(OUTLINE, '#c4a5b5', 0.5);

// A closed smooth loop through `pts` (Catmull-Rom), `n` steps between each two; any extra numbers a
// point carries are eased along the loop with it.
function loop(pts, n) {
  const N = pts.length;
  const out = [];
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N];
    const b = pts[i];
    const c = pts[(i + 1) % N];
    const d = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(b.map((_, k) => b[k] + 0.5 * t * (c[k] - a[k]) + t2 * (a[k] - 2.5 * b[k] + 2 * c[k] - 0.5 * d[k]) + t3 * (1.5 * b[k] - 0.5 * a[k] - 1.5 * c[k] + 0.5 * d[k])));
    }
  }
  return out;
}
const trace = (ctx, pts) => {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i][0], pts[i][1]);
  ctx.closePath();
};
// A soft tube through points: a disc at each and a band between each two (fill nonzero: one shape).
function tube(ctx, pts, wl, grow = 0) {
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const r = Math.max(0.1, wl[i] / 2 + grow);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
    if (!i) continue;
    const [px, py] = pts[i - 1];
    const pr = Math.max(0.1, wl[i - 1] / 2 + grow);
    const l = Math.hypot(x - px, y - py) || 1;
    const nx = (py - y) / l;
    const ny = (x - px) / l;
    // (wound the same way as the discs, so where they overlap they add, never cancel)
    ctx.moveTo(px + nx * pr, py + ny * pr);
    ctx.lineTo(px - nx * pr, py - ny * pr);
    ctx.lineTo(x - nx * r, y - ny * r);
    ctx.lineTo(x + nx * r, y + ny * r);
    ctx.closePath();
  }
}
// Points down a chain of joints, `n` to a bone, the widths eased between joints and each bone slimmed
// a little in its middle (`slim`), so the knees, hocks and fetlocks read as soft knobs.
function bones(joints, widths, slim, n = 4) {
  const pts = [];
  const wl = [];
  for (let i = 0; i < joints.length - 1; i++) {
    for (let j = 0; j < n; j++) {
      const v = j / n;
      pts.push(mid(joints[i], joints[i + 1], v));
      wl.push(lerp(widths[i], widths[i + 1], ease(v)) * (1 - (slim[i] ?? 0) * Math.sin(Math.PI * v)));
    }
  }
  pts.push(joints[joints.length - 1]);
  wl.push(widths[widths.length - 1]);
  return [pts, wl];
}
const inside = (pts, [x, y]) => {
  let inn = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inn = !inn;
  }
  return inn;
};

// ---------- The animals ----------
// body: the outline from the top of the withers, back along the back, round the rump, along the
// belly and up the chest: [x, y, follows the near foreleg's upper arm, follows the near thigh, lifts
// with the withers]. fore / hind: the top joint (inside the body), each joint from the one before,
// the widths at each. hoof: its width and height, the fetlock's height off the ground, how far ahead
// of the fetlock it stands, split or solid. head: the skull and the shapes joined to it ([x, y, rx, ry,
// turn]) in the head's own frame, the face to the right; brow (where a butt lands), tip (the nose's
// lowest point), the guides. ears: the root of each inside the head, length, width, angle at rest
// (degrees, 0 forward, 90 down), how far they turn perked up or laid flat. tail: a chain of springs.
const LAMB = {
  name: 'Lamb',
  scale: 1,
  body: [
    [8.6, -6.8, 0, 0, 0.5], [4.6, -8.8, 0, 0, 1], [0, -9.3, 0, 0, 0.3], [-4.6, -9.1, 0, 0, 0], [-8.8, -8, 0, 0.1, 0], [-11.9, -5.2, 0, 0.3, 0],
    [-13.2, -1.2, 0, 0.55, 0], [-12.6, 2.9, 0, 0.8, 0], [-9.8, 6, 0, 0.85, 0], [-5.6, 7.1, 0, 0.35, 0], [-1, 7.3, 0, 0, 0], [3.4, 7.1, 0, 0, 0],
    [7, 6.5, 0.45, 0, 0], [9.9, 4.3, 0.75, 0, 0], [11.5, 0.8, 0.3, 0, 0], [11.3, -2.9, 0, 0, 0], [10.3, -5.3, 0, 0, 0],
  ],
  fore: { top: [6.6, 1.4], bones: [[-0.9, 3.5], [0.5, 3.5], [0.2, 2.6]], w: [6.6, 3.9, 3.1, 2.7] },
  hind: { top: [-8.4, 0.4], bones: [[2.6, 4], [-2.8, 3.6], [0.4, 3]], w: [9.6, 4.8, 3.1, 2.7] },
  far: [-1.6, -0.6],
  hoof: { w: 3.5, h: 2.4, up: 2.7, ahead: 0.5, split: true },
  neck: { base: [8.4, -4], len: 5.6, w: [7.4, 6.4], ang: -50 },
  head: {
    skull: [0, 0, 7.6, 7],
    more: [[4.9, 2.6, 4.5, 3.6, 0.5], [2.4, 4.4, 4.8, 3.1, 0.2]],
    brow: [5.4, -4.6],
    tip: [7.2, 6.2],
    nose: [8.5, 3.4],
    eye: [[0.4, -0.3], [3.2, -1.5], [6, -0.2]],
    centre: [[4.4, -6.2], [7.4, -2], [8.8, 2.8]],
    muzzle: [[4.6, 0.6], [3.8, 3.2], [4.8, 6]],
  },
  ears: { kind: 'flap', near: [-3.4, -2.2], far: [-4.6, -3.8], len: 7.2, wid: 3.8, ang: 168, perk: 22, flat: -30 },
  tail: { kind: 'stub', root: [-12.4, -3.4], segs: [2.2, 2.1, 1.9], w: [3.8, 3.5, 3.1, 2.6], ang: 108, curl: 6 },
  moves: ['headbutt', 'buck', 'rear'],
};
const FOAL = {
  name: 'Foal',
  scale: 1,
  body: [
    [8.2, -6.6, 0, 0, 0.5], [4.2, -8, 0, 0, 1], [0, -7.8, 0, 0, 0.3], [-4.2, -7.6, 0, 0, 0], [-8, -7.6, 0, 0.1, 0], [-10.9, -5.2, 0, 0.3, 0],
    [-11.9, -1.5, 0, 0.55, 0], [-11.3, 2.3, 0, 0.8, 0], [-8.8, 5, 0, 0.85, 0], [-5, 5.6, 0, 0.35, 0], [-1, 5, 0, 0, 0], [3, 5.4, 0, 0, 0],
    [6.6, 5.8, 0.45, 0, 0], [9.3, 3.8, 0.75, 0, 0], [10.7, 0.4, 0.3, 0, 0], [10.5, -3, 0, 0, 0], [9.7, -5.1, 0, 0, 0],
  ],
  fore: { top: [6.2, 1.2], bones: [[-1.1, 5.6], [0.6, 6.4], [0.2, 5.8]], w: [6.2, 3.5, 2.6, 2.2] },
  hind: { top: [-7.8, 0.4], bones: [[3.2, 6.2], [-4, 5.8], [0.6, 6.6]], w: [8.8, 4.3, 2.7, 2.2] },
  far: [-1.4, -0.6],
  hoof: { w: 3.6, h: 3, up: 3.3, ahead: 0.6, split: false },
  neck: { base: [6.6, -5.2], len: 9.6, w: [7, 5.2], ang: -50, mane: [2.6, 3.2, 2.4] },
  head: {
    skull: [0, 0, 7, 6.4],
    more: [[6, 2.8, 5.4, 3.1, 0.55], [9.4, 5.2, 2.8, 2.6, 0], [1.6, 3.6, 5.2, 3.6, 0.3]],
    brow: [5, -4.4],
    tip: [9.6, 7.6],
    nose: [10.6, 4.4],
    eye: [[0.2, -0.6], [3, -1.8], [5.6, -0.6]],
    centre: [[4, -5.6], [7.4, -0.8], [10.4, 3.6]],
    muzzle: [[6.6, 2], [6, 4.8], [7.2, 7.4]],
  },
  ears: { kind: 'point', near: [-0.6, -5.2], far: [-2.6, -5.2], len: 6.2, wid: 3, ang: -98, perk: 16, flat: -48 },
  tail: { kind: 'tuft', root: [-11.1, -4.4], segs: [2, 2.2, 2.4, 2.2], w: [2.8, 2.6, 3.6, 3.8, 2.6], ang: 112, curl: -8 },
  moves: ['rear', 'buck', 'headbutt'],
};
const GOATKID = {
  name: 'Kid goat',
  scale: 1,
  body: [
    [8.4, -6.4, 0, 0, 0.5], [4.2, -7.8, 0, 0, 1], [0, -7.6, 0, 0, 0.3], [-4.4, -7.2, 0, 0, 0], [-8.4, -7.6, 0, 0.1, 0], [-11.2, -5.3, 0, 0.3, 0],
    [-12, -1.7, 0, 0.55, 0], [-11.4, 2.1, 0, 0.8, 0], [-9, 4.8, 0, 0.85, 0], [-5.4, 5.2, 0, 0.35, 0], [-1.4, 4.4, 0, 0, 0], [2.8, 4.8, 0, 0, 0],
    [6.4, 5.6, 0.45, 0, 0], [9, 3.8, 0.75, 0, 0], [10.4, 0.6, 0.3, 0, 0], [10.2, -2.8, 0, 0, 0], [9.6, -4.9, 0, 0, 0],
  ],
  fore: { top: [6.2, 1.2], bones: [[-0.9, 4.6], [0.5, 5], [0.2, 4]], w: [5.8, 3.3, 2.5, 2.2] },
  hind: { top: [-8.2, 0.4], bones: [[3, 5], [-3.6, 4.8], [0.5, 4.6]], w: [8.2, 4.1, 2.6, 2.2] },
  far: [-1.5, -0.6],
  hoof: { w: 3.2, h: 2.4, up: 2.7, ahead: 0.5, split: true },
  neck: { base: [8.2, -4], len: 5.6, w: [6.4, 5], ang: -60 },
  head: {
    skull: [0, 0, 7.2, 6.6],
    more: [[5.8, 2.6, 4.8, 3, 0.45], [8.8, 4.4, 2.3, 2.1, 0], [2.4, 4.2, 4.8, 2.8, 0.25], [7.4, 6.2, 1.7, 1.4, 0]],
    brow: [4.6, -5],
    tip: [7.6, 7.4],
    nose: [9.8, 3.6],
    eye: [[0.4, -0.4], [3.2, -1.6], [5.8, -0.4]],
    centre: [[4.2, -6], [7.2, -1.6], [9.8, 3]],
    muzzle: [[5.6, 1.2], [5, 3.8], [6, 6.6]],
  },
  horns: { near: [1.2, -5.2], far: [-0.8, -5.8], len: 3.2, wid: 2.6, ang: -108 },
  ears: { kind: 'droop', near: [-3.8, -2.6], far: [-4.8, -4], len: 7.4, wid: 3.2, ang: 158, perk: 24, flat: -24 },
  tail: { kind: 'flag', root: [-11.4, -5.2], segs: [2.1, 2], w: [3, 2.7, 2.1], ang: -116, curl: -12 },
  moves: ['headbutt', 'rear', 'buck'],
};
const HOOF_PRESETS = { lamb: LAMB, foal: FOAL, goatkid: GOATKID };

// ---------- The moves (x, hop in body heights; lift in px; angles in degrees; the rest 0..1) ----------
// pitch: + nose down; arch: + the middle of the back up; hipLift: + the rump up; neck, head: + down;
// ears: + perked, - laid back; tailUp: - raised; rear: up on its hind legs; kick: both hinds out
// behind (a buck); stiff: all four legs locked straight (the pronk); fly: legs stretched out (a leap);
// tuck: legs folded up (a jump); paw: the near forehoof scraping the ground.
const HOOF_MOVES = {
  headbutt: {
    anticT: 0.32,
    keys: [
      [0, { x: -0.07, crouch: 0.28, pitch: -4, hipLift: -3, neck: 4, head: 22, ears: -0.7, paw: 1, tailUp: -12 }],
      [0.09, { x: 0.2, crouch: 0.1, pitch: 10, neck: 34, head: 44, ears: -1, fly: 0.3, tailUp: -34 }, 'out'],
      [0.15, { x: 0.23, crouch: 0.08, pitch: 11, neck: 36, head: 48, ears: -1, fly: 0.12, tailUp: -34 }, 'out'],
      [0.27, { x: 0.15, pitch: -3, neck: 2, head: 4, ears: -0.2, tailUp: -12 }, 'out'],
      [0.64, {}],
    ],
    spark: [0.15],
    sparkAt: 'brow',
    dust: [[0.05, 'hinds']],
  },
  buck: {
    anticT: 0.24,
    keys: [
      [0, { x: 0.03, crouch: 0.32, pitch: 4, neck: 12, head: 12, ears: -0.6 }],
      [0.11, { kick: 1, crouch: 0.12, neck: 18, head: 16, ears: -1, tailUp: -70 }, 'out'],
      [0.22, { kick: 0.82, crouch: 0.1, neck: 16, head: 14, ears: -1, tailUp: -60 }],
      [0.38, { kick: 0, crouch: 0.34, pitch: 2, neck: 6, head: 6, ears: -0.3, tailUp: -12 }, 'in'],
      [0.72, {}],
    ],
    spark: [0.11],
    sparkAt: 'hinds',
    dust: [[0.38, 'hinds']],
  },
  rear: {
    anticT: 0.26,
    keys: [
      [0, { crouch: 0.42, pitch: 5, neck: 8, head: 6, ears: 0.2 }],
      [0.24, { rear: 1, crouch: 0.22, neck: -18, head: -10, ears: -0.4, tailUp: -24 }, 'out'],
      [0.46, { rear: 0.94, crouch: 0.24, neck: -14, head: -6, ears: -0.6, tailUp: -20 }, 'io'],
      [0.6, { rear: 0, crouch: 0.36, pitch: 7, neck: 14, head: 12, ears: -1, tailUp: 0 }, 'in'],
      [0.96, {}],
    ],
    spark: [0.6],
    sparkAt: 'fores',
    dust: [[0.6, 'fores']],
  },
  // Its signature, when pleased: a spring straight up on four stiff legs, the back arched, then a
  // smaller second bounce.
  pronk: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.55, pitch: 1, neck: 6, head: 4, ears: 0.3 }],
      [0.15, { hop: 0.42, stiff: 1, arch: 12, neck: 6, head: 16, ears: -0.2, tailUp: -40 }, 'out'],
      [0.29, { hop: 0.46, stiff: 1, arch: 14, neck: 4, head: 18, ears: -0.3, tailUp: -40 }, 'io'],
      [0.44, { hop: 0, stiff: 0.7, crouch: 0.4, arch: 4, neck: 8, head: 8, ears: 0.2, tailUp: -10 }, 'in'],
      [0.56, { hop: 0.24, stiff: 1, arch: 10, neck: 4, head: 14, ears: -0.2, tailUp: -40 }, 'out'],
      [0.68, { hop: 0, stiff: 0.6, crouch: 0.32, arch: 2, neck: 4, head: 4, ears: 0.3 }, 'in'],
      [1, {}],
    ],
    dust: [[0.47, 'all'], [0.7, 'all']],
    twinkle: [0.18, 0.58],
  },
  jump: {
    anticT: 0.16,
    keys: [
      [0, { crouch: 0.65, pitch: 3, ears: 0.4 }],
      [0.16, { hop: 0.58, crouch: 0, pitch: -14, fly: 0.7, ears: -0.3, tailUp: -30 }, 'out'],
      [0.32, { hop: 0.64, pitch: 0, fly: 0, tuck: 1, ears: 0 }, 'out'],
      [0.5, { hop: 0.03, pitch: 9, tuck: 0.2, ears: 0.2 }, 'in'],
      [0.56, { crouch: 0.5, pitch: 3 }, 'out'],
      [0.86, {}],
    ],
    dust: [[0, 'all'], [0.54, 'fores']],
  },
  dash: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.3 }],
      [0.08, { x: 0.22, crouch: 0.14, pitch: 3, neck: 10, head: 6, fly: 0.8, ears: -1, tailUp: -40 }, 'out'],
      [0.3, { x: 0.26, crouch: 0.12, pitch: 2, neck: 8, fly: 0.6, ears: -1, tailUp: -40 }],
      [0.62, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'hinds']],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { crouch: 0.35 }],
      [0.12, { hop: 0.24, x: -0.22, pitch: -14, neck: -10, head: -8, ears: -1, tuck: 0.6, tailUp: -40 }, 'out'],
      [0.3, { x: -0.26, crouch: 0.4, pitch: 3, ears: -0.4 }, 'in'],
      [0.64, {}],
    ],
    dust: [[0.3, 'all']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.05, pitch: -8, crouch: 0.3, neck: -10, head: -12, ears: -1, tailUp: 20 }, 'out'],
      [0.2, { x: -0.05, pitch: -5, crouch: 0.25, neck: -6, head: -8, ears: -1, tailUp: 16 }],
      [0.56, {}],
    ],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { x: -0.06, pitch: -12, neck: -12, head: -14, ears: -1 }, 'out'],
      [0.38, { lie: 1, x: -0.08, neck: 30, head: 20, ears: -1, tailUp: 20 }, 'in'],
      [0.46, { lie: 0.95, x: -0.08, neck: 24, head: 16, ears: -1, tailUp: 20 }, 'out'],
      [1.05, { lie: 1, x: -0.08, neck: 28, head: 20, ears: -0.9, tailUp: 16 }],
      [1.45, { lie: 0, crouch: 0.3, x: -0.04, ears: 0.2 }, 'io'],
      [1.75, {}],
    ],
    dust: [[0.38, 'body']],
  },
};
const HOOF_SHOW = ['headbutt', 'buck', 'rear', 'pronk', 'jump', 'dash', 'dodge', 'hurt', 'knockdown'];
const ATTACKS = ['headbutt', 'buck', 'rear'];
const lastKey = (mv) => mv.keys[mv.keys.length - 1][0];
const EASES = { out: easeOut, in: easeIn, io: ease };
// A move's pose at time t (t < 0: easing from `base` into its first key by `antic`).
function keyPose(mv, t, antic, base) {
  const keys = mv.keys.map(([kt, p, e]) => [kt, { ...base, ...p }, e]);
  if (t < 0) {
    const out = {};
    const k = ease(antic);
    for (const c of Object.keys(base)) out[c] = lerp(base[c], keys[0][1][c], k);
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, e] = keys[i + 1];
  const u = (EASES[e] ?? ease)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  const out = {};
  for (const c of Object.keys(p0)) out[c] = lerp(p0[c], p1[c], u);
  return out;
}
// (0..1 through `len` seconds after the latest of these moments, or -1)
const after = (moments, t, len) => {
  let k = -1;
  for (const m of moments ?? []) if (t >= m && t <= m + len) k = (t - m) / len;
  return k;
};

const CH = ['x', 'lift', 'hop', 'pitch', 'arch', 'hipLift', 'crouch', 'lie', 'sleep', 'graze', 'rear', 'kick', 'tuck', 'stiff', 'fly', 'neck', 'head', 'ears', 'tailUp', 'swish', 'paw'];
const NOTHING = () => sprite('rig|blankempty', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- The gaits: when each hoof leaves the ground, as a share of the stride ----------
// (a walk: hind, the fore on the same side, the other hind, the other fore; a trot in diagonal pairs,
// the hind a touch ahead; a canter on the near lead: the far hind, then the near hind with the far
// fore, then the near fore, then a float; the numbers chosen so each blends the short way round)
const WALK = { hindN: 0, foreN: 0.25, hindF: 0.5, foreF: 0.75 };
const TROT = { hindN: 0, foreN: 0.52, hindF: 0.5, foreF: 1.02 };
const CANTER = { hindN: 0.26, foreN: 0.52, hindF: 1, foreF: 1.3 };
const gaitPhase = (k, trot, run) => lerp(lerp(WALK[k], TROT[k], trot), CANTER[k], run);

// ---------- One rig for an animal ----------
function hoofRig(look = {}) {
  const DRESS = look;
  const LP = look.P ?? {};
  const P0 = HOOF_PRESETS[look.kind ?? 'goatkid'];
  const P = { ...P0, ...LP };
  for (const k of Object.keys(LP)) if (LP[k] && typeof LP[k] === 'object' && !Array.isArray(LP[k]) && P0[k] && typeof P0[k] === 'object' && !Array.isArray(P0[k])) P[k] = { ...P0[k], ...LP[k] };
  const C = { ...C0, ...(look.C ?? {}) };
  const MOVES = { ...HOOF_MOVES, ...(look.moves ?? {}) };
  const HOOF_N = C.hoofN ?? blendHex(C.deep, C.nose, 0.35);
  const HOOF_F = C.hoofF ?? blendHex(C.deep, C.nose, 0.6);
  const s = P.scale;
  const sc = (v) => v * s;
  const HF = P.hoof;
  const hw = sc(HF.w);
  const hh = sc(HF.h);
  const hup = sc(HF.up);
  const hx = sc(HF.ahead);
  // The four legs at rest.
  const LEGS = {};
  for (const [k, G, far] of [['hindF', P.hind, true], ['foreF', P.fore, true], ['hindN', P.hind, false], ['foreN', P.fore, false]]) {
    const top = far ? plus(G.top, P.far) : [...G.top];
    const js = [top];
    for (const b of G.bones) js.push(plus(js[js.length - 1], b));
    LEGS[k] = {
      k,
      hind: k.startsWith('hind'),
      far,
      top,
      rest: js,
      lens: G.bones.map((b) => sc(Math.hypot(b[0], b[1]))),
      a3: Math.atan2(G.bones[2][0], G.bones[2][1]),
      up: Math.atan2(G.bones[0][1], G.bones[0][0]),
      reach: sc(Math.hypot(js[3][0] - top[0], js[3][1] - top[1])),
      w: G.w.map(sc),
    };
  }
  const LF = LEGS.foreN.lens.reduce((a, b) => a + b, 0) + hup;
  const LH = LEGS.hindN.lens.reduce((a, b) => a + b, 0) + hup;
  const hb = sc((LEGS.foreN.rest[3][1] + LEGS.hindN.rest[3][1]) / 2 + HF.up);
  const xs = P.body.map((p) => p[0]);
  const bodyLen = sc(Math.max(...xs) - Math.min(...xs));
  const topY = -Math.min(...P.body.map((p) => p[1]));
  const H = hb + sc(topY + P.neck.len * 0.7 + P.head.skull[3] * 1.5);
  // The stride: short quick steps for short legs; a trot and a canter cover more ground a step.
  const stride = LF * 1.15;
  const walkSpeed = stride * 1.4;
  const cycleOf = (trot, run) => stride * (1 + 0.3 * trot + 0.5 * run);
  // (the spine: points behind the waist turn with the loin, ahead of it with the withers)
  const waist = (x) => ease((x + 4) / 8);
  const spine = (p, aL, aT) => {
    const k = waist(p[0]);
    const q = [sc(p[0]), sc(p[1])];
    const a = turn(q, aL);
    const b = turn(q, aT);
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  };
  const bellyY = Math.max(...P.body.map((p) => p[1]));
  const LIE_H = sc(bellyY) * 0.96;
  const REAR = 40;
  const BUCK = 24;

  // A hoof planted at `xc` (its sole's middle) on the line y = -lift, tipped by `fr` (+: the heel up,
  // peeling over the toe; -: the toe up, on its heel): where its fetlock is.
  const fetlockOf = (xc, lift, fr) => {
    const corner = fr >= 0 ? hw * 0.52 : -hw * 0.46;
    const c = [xc + corner, -lift];
    return plus(c, turn([-(hx + corner), -hup], fr));
  };
  // One hoof through the stride at phase q: planted (s: 0..1) or swinging (v: 0..1); dx along the
  // body, lift, the slant of the cannon (a3) and the hoof's tip (fr).
  function stepOf(L, q, duty, cyc, liftH, fold) {
    const reach = (cyc * duty) / 2;
    const r0 = L.a3;
    if (q < duty) {
      const st = q / duty;
      const a3 = r0 + lerp(0.16, -0.38, st);
      const fr = st < 0.15 ? lerp(-0.14, 0, ease(st / 0.15)) : 0.5 * ease((st - 0.7) / 0.3);
      return { dx: reach * (1 - 2 * st), lift: 0, a3, fr, s: st, v: -1 };
    }
    const v = (q - duty) / (1 - duty);
    // (the swing as a curve whose speed at each end matches the stance, so in the world the hoof
    // eases off the ground and eases down onto it, never jerking)
    const m = (-2 * reach * (1 - duty)) / duty;
    const v2 = v * v;
    const v3 = v2 * v;
    const dx = (2 * v3 - 3 * v2 + 1) * -reach + (v3 - 2 * v2 + v) * m + (-2 * v3 + 3 * v2) * reach + (v3 - v2) * m;
    const lift = liftH * Math.sin(Math.PI * v ** 0.85);
    let a3;
    let fr;
    if (!L.hind) {
      // (a fore: the knee lifts and the cannon folds back under it, the hoof flipped up; then the leg
      // reaches out straight to land heel first)
      a3 = v < 0.45 ? lerp(r0 - 0.38, -fold, ease(v / 0.45)) : lerp(-fold, r0 + 0.16, ease((v - 0.45) / 0.55));
      fr = v < 0.45 ? lerp(0.5, 0.35 + fold * 0.55, ease(v / 0.45)) : lerp(0.35 + fold * 0.55, -0.14, ease((v - 0.45) / 0.55));
    } else {
      // (a hind: the hock flexes, the hoof trailing, then swings through)
      a3 = v < 0.4 ? lerp(r0 - 0.38, -fold * 0.62, ease(v / 0.4)) : lerp(-fold * 0.62, r0 + 0.16, ease((v - 0.4) / 0.6));
      fr = v < 0.4 ? lerp(0.5, 0.3 + fold * 0.35, ease(v / 0.4)) : lerp(0.3 + fold * 0.35, -0.14, ease((v - 0.4) / 0.6));
    }
    return { dx, lift, a3, fr, s: -1, v };
  }
  // The leg's bones reaching a fetlock at `F` from its top joint T, the cannon at slant a3: the knee
  // (the hock) first, then the upper two bones to it, the elbow bending back and the stifle forward.
  function reachTo(L, T, F, a3) {
    const [l1, l2, l3] = L.lens;
    const J2t = [F[0] - Math.sin(a3) * l3, F[1] - Math.cos(a3) * l3];
    const gx = J2t[0] - T[0];
    const gy = J2t[1] - T[1];
    const d0 = Math.hypot(gx, gy) || 1;
    const d = clamp(d0, Math.abs(l1 - l2) + 0.3, l1 + l2 - 0.01);
    const phi = Math.atan2(gy, gx);
    const bend = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const ka = phi + (L.hind ? -bend : bend);
    const J1 = plus(T, [Math.cos(ka) * l1, Math.sin(ka) * l1]);
    const J2 = plus(T, [(gx / d0) * d, (gy / d0) * d]);
    const Pf = [J2[0] + Math.sin(a3) * l3, J2[1] + Math.cos(a3) * l3];
    return { T, J1, J2, P: Pf, up: Math.atan2(J1[1] - T[1], J1[0] - T[0]) };
  }

  // ---------- The skeleton this frame ----------
  function skeleton(S, a) {
    const st = a.mo.rig;
    const t = a.t;
    const w = a.walkW ?? 0;
    const u = st.hfU ?? 0;
    const trot = st.hfTrot ?? 0;
    const run = st.hfRun ?? 0;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const down = clamp(Math.max(S.lie, S.sleep), 0, 1);
    // (lying down front end first, getting up rump first)
    const downF = ease(down / 0.7);
    const downH = ease((down - 0.3) / 0.7);
    const cyc = cycleOf(trot, run);
    const duty = lerp(lerp(0.64, 0.5, trot), 0.42, run);
    const liftH = LF * lerp(lerp(0.2, 0.24, trot), 0.26, run);
    const fold = lerp(lerp(1, 1.5, trot), 1.7, run);
    // The step: each hoof's place; how low each end of the body rides over its planted legs.
    const steps = {};
    let fN = 0;
    let fD = 0;
    let hN = 0;
    let hD = 0;
    let withers = 0;
    for (const [k, L] of Object.entries(LEGS)) {
      const q = frac(u + gaitPhase(k, trot, run));
      const g = stepOf(L, q, duty, cyc, liftH, fold);
      steps[k] = g;
      if (g.v >= 0) continue;
      const wt = ease(g.s / 0.12) * ease((1 - g.s) / 0.12) + 1e-3;
      const sink = L.reach - Math.sqrt(Math.max(0, L.reach * L.reach - g.dx * g.dx));
      if (L.hind) {
        hN += sink * wt;
        hD += wt;
      } else {
        fN += sink * wt;
        fD += wt;
        withers = Math.max(withers, Math.sin(Math.PI * g.s) * wt);
      }
    }
    const sm = (st.hfSink ??= { f: 0, h: 0 });
    const kf = dt > 0 ? Math.min(1, dt * 18) : 1;
    if (fD > 0) sm.f = lerp(sm.f, fN / fD, kf);
    if (hD > 0) sm.h = lerp(sm.h, hN / hD, kf);
    const rock = Math.atan2((sm.f - sm.h) * w, bodyLen * 1.4);
    // (a canter rocks the body like a rocking horse, fore end up as the hinds take it)
    const lope = Math.sin(TAU * u + 0.9) * 5 * run * w;
    // The spine's two bones; the lying body levels out, its front end down first.
    let aL = (S.pitch - S.arch / 2 + S.hipLift + lope) * D2R + rock;
    let aT = (S.pitch + S.arch / 2 + lope) * D2R + rock;
    aL = lerp(aL, 0, down);
    aT = lerp(aT, 0, down);
    const kneel = (downF - downH) * 12 * D2R;
    aL += kneel;
    aT += kneel;
    let pH = hb + S.lift - clamp(S.crouch, 0, 1.2) * hb * 0.26;
    pH = lerp(pH, LIE_H, lerp(downF, downH, 0.5));
    let pivot = [S.x, -pH - S.hop + (sm.f + sm.h) * 0.4 * w];
    // The whole body turned about one point: the hind hips as it rears and grazes, the shoulders as
    // it bucks (that point stays put, the rest swings round it).
    const turnAbout = (pt, d) => {
      if (!d) return;
      const A = spine(pt, aL, aT);
      pivot = plus(pivot, minus(A, turn(A, d)));
      aL += d;
      aT += d;
    };
    turnAbout(P.hind.top, -REAR * clamp(S.rear, 0, 1.2) * D2R);
    turnAbout(P.fore.top, BUCK * clamp(S.kick, 0, 1.2) * D2R);
    turnAbout(P.hind.top, (GRAZE.pitch ?? 0) * clamp(S.graze, 0, 1) * D2R);
    const at = (p) => plus(pivot, spine(p, aL, aT));
    // The neck and the head: the head nodding with the walk, held up against the body's tipping.
    const nod = Math.sin(TAU * 2 * u + 0.7) * lerp(2.4, 1.2, run) * w * (1 - down);
    const nb = at(P.neck.base);
    const NL = sc(P.neck.len);
    let na = aT * 0.55 + (P.neck.ang + S.neck + nod * 0.4) * D2R;
    let ha = aT * 0.3 + (S.head + S.neck * 0.3 + nod) * D2R;
    // (grazing: the neck lowered just far enough that the nose touches the ground, whatever the body
    // does; nibbling)
    const gz = clamp(S.graze, 0, 1);
    if (gz > 0 && GRAZE.head != null) {
      const gha = aT * 0.3 + (GRAZE.head + Math.sin(t * 7.5) * 3 * hold(frac(t / 4.2), 0, 0.1, 0.55, 0.7)) * D2R;
      const tip = turn(P.head.tip.map(sc), gha);
      const want = (-0.3 - tip[1] - nb[1]) / NL;
      const gna = Math.asin(clamp(want, -1, 1));
      na = lerp(na, gna, gz);
      ha = lerp(ha, gha, gz);
    }
    const hp = plus(nb, [Math.cos(na) * NL, Math.sin(na) * NL]);
    const brow = plus(hp, turn(P.head.brow.map(sc), ha));
    // Each leg: its hoof's place (the step, or a pose), then its bones.
    const tuck = clamp(Math.max(S.tuck, S.hop / (hb * 0.45)), 0, 1) * (1 - clamp(S.fly, 0, 1)) * (1 - clamp(S.stiff, 0, 1));
    const legs = {};
    for (const [k, L] of Object.entries(LEGS)) {
      const g = steps[k];
      const T = at(L.hind ? L.top : [L.top[0] + (g.dx / s) * 0.05 * w, L.top[1]]);
      const xr = sc(L.rest[3][0]) + S.x * 0.35 * (1 - w);
      let F = fetlockOf(xr + hx + g.dx * w, g.lift * w + S.hop, g.fr * w);
      let a3 = lerp(L.a3, g.a3, w);
      let fr = g.fr * w;
      const to = (f, ang, tip, k2) => {
        if (!(k2 > 0)) return;
        F = mid(F, f, k2);
        a3 = lerp(a3, ang, k2);
        fr = lerp(fr, tip, k2);
      };
      const near = !L.far;
      // pawing the ground: the near forehoof lifted, struck forward, dragged back
      if (k === 'foreN' && S.paw > 0.01) {
        const th = TAU * frac(t * 1.7);
        const up = Math.max(0, -Math.sin(th));
        const f = [xr + LF * 0.2 * Math.cos(th), -hup - LF * 0.2 * up];
        to(f, lerp(L.a3, -0.9, up), lerp(0, 0.9, up), clamp(S.paw, 0, 1));
      }
      // stiff (the pronk): every leg locked straight down under its joint
      to(plus(T, [sc(L.rest[3][0] - L.top[0]) * 0.6, L.reach * 0.97]), L.a3, 0.45, clamp(S.stiff, 0, 1));
      // stretched out in a leap
      to(plus(T, L.hind ? [-LH * 0.72, LH * 0.42] : [LF * 0.72, LF * 0.48]), L.hind ? -1.25 : 0.95, L.hind ? 1.2 : -0.5, clamp(S.fly, 0, 1));
      // folded up in a jump
      to(plus(T, L.hind ? [-LH * 0.05, LH * 0.42] : [LF * 0.24, LF * 0.38]), L.hind ? -1.3 : -1.95, L.hind ? 1.3 : 1.9, tuck);
      // a buck: both hinds kicked out behind, the soles to the foe
      if (L.hind) to(plus(T, [-LH * 0.9, LH * 0.12]), -1.55, 1.5, clamp(S.kick, 0, 1));
      // reared up: the forelegs folded at the knee, paddling in turn
      if (!L.hind) {
        const pd = 0.5 + 0.5 * Math.sin(t * 9 + (L.far ? Math.PI : 0));
        to(plus(T, [lerp(LF * 0.2, LF * 0.48, pd), lerp(LF * 0.34, LF * 0.5, pd)]), lerp(-2.05, -1.05, pd), lerp(1.9, 1.1, pd), ease(clamp(S.rear, 0, 1)));
      }
      // lying: a fore folded under at the knee (the knee forward, the cannon back under the chest);
      // a hind folded at the hock (the hock behind, the cannon forward under the belly)
      if (L.hind) {
        const J2 = [T[0] - L.lens[1] * 0.2, -L.w[2] * 0.5];
        to([J2[0] + L.lens[2] * 0.98, -L.w[3] * 0.5], 1.42, -0.2, downH);
      } else {
        const J2 = [T[0] + L.lens[1] * 0.62, -L.w[2] * 0.5];
        to([J2[0] - L.lens[2] * 0.98, -L.w[3] * 0.5], -1.45, 1.5, downF);
      }
      const b = reachTo(L, T, F, a3);
      legs[k] = { k, hind: L.hind, far: L.far, near, ...b, fr, w: L.w, g };
    }
    // The outline: each point on the spine; near the near legs following their upper bones; the
    // withers rolling up as a forehoof takes the weight.
    const dF = (legs.foreN.up - (LEGS.foreN.up + aT)) * 0.5;
    const dH = (legs.hindN.up - (LEGS.hindN.up + aL)) * 0.5;
    const about = (q, c, an) => plus(c, turn(minus(q, c), an));
    const lift = withers * sc(0.6) * w * (1 - run);
    const bodyPt = (p) => {
      let q = at(p);
      if (p[2]) q = mid(q, about(q, legs.foreN.T, dF), p[2]);
      if (p[3]) q = mid(q, about(q, legs.hindN.T, dH), p[3]);
      if (p[4]) q = plus(q, turn([0, -lift * p[4]], aT));
      return q;
    };
    // The ears: one spring each, swung by the head turning and the body bobbing, a little apart.
    const ay = (() => {
      const e = (st.hfBob ??= { y: pivot[1], vy: 0 });
      const vy = dt > 0 ? (pivot[1] - e.y) / dt : 0;
      const acc = dt > 0 ? clamp((vy - e.vy) / dt, -900, 900) : 0;
      e.y = pivot[1];
      e.vy = vy;
      return acc;
    })();
    const spin = dt > 0 ? (ha - (st.hfHa ?? ha)) / dt : 0;
    st.hfHa = ha;
    const ears = [];
    for (const [i, kk, cc] of [[0, 190, 15], [1, 150, 13]]) {
      const e = ((st.hfEar ??= [])[i] ??= { x: 0, v: 0 });
      const n = dt > 0 ? Math.ceil(dt / (1 / 240)) : 0;
      for (let j = 0; j < n; j++) {
        e.v += (-e.x * kk - e.v * cc - spin * 2.2 + ay * 0.0016) * (dt / n);
        e.x = clamp(e.x + e.v * (dt / n), -0.4, 0.4);
      }
      ears.push(e.x);
    }
    // The tail: from the rump, a chain of springs, each following the one before, softer to the tip;
    // swishing now and then, held up as it runs or bucks.
    const T0 = P.tail;
    const tail = [bodyPt(T0.root)];
    const chain = (st.hfTail ??= []);
    let prev = 0;
    const up0 = T0.ang < 0;
    for (let i = 1; i <= T0.segs.length; i++) {
      const kf = i / T0.segs.length;
      let goal;
      if (i === 1) {
        const lifted = clamp(-S.tailUp / 70, -0.6, 1);
        const sw = S.swish * Math.sin(t * 11) * 0.35;
        goal = aL + (T0.ang + (up0 ? 1 : -1) * (w * 6 + run * 30) - lifted * (up0 ? 18 : 48)) * D2R + sw;
      } else goal = prev + (T0.curl * D2R) * kf + Math.sin(t * 1.3 - i * 0.7) * 0.03;
      const sp = (chain[i] ??= { x: goal, v: 0 });
      const n = dt > 0 ? Math.ceil(dt / (1 / 240)) : 0;
      for (let j = 0; j < n; j++) {
        sp.v += ((goal - sp.x) * (300 - kf * 130) - sp.v * (22 - kf * 6)) * (dt / n);
        sp.x += sp.v * (dt / n);
      }
      if (!(Math.abs(sp.x - goal) < 1)) sp.x = goal + clamp(sp.x - goal, -1, 1) || goal;
      prev = sp.x;
      tail.push(plus(tail[i - 1], [Math.cos(sp.x) * sc(T0.segs[i - 1]), Math.sin(sp.x) * sc(T0.segs[i - 1])]));
    }
    // The mane ridge (the foal): from the poll down the top of the neck to the withers, its middle
    // lagging the bob a touch on a spring.
    let mane = null;
    if (P.neck.mane) {
      const mm = (st.hfMane ??= { x: 0, v: 0 });
      const n = dt > 0 ? Math.ceil(dt / (1 / 240)) : 0;
      for (let j = 0; j < n; j++) {
        mm.v += (-mm.x * 260 - mm.v * 16 + ay * 0.004) * (dt / n);
        mm.x = clamp(mm.x + mm.v * (dt / n), -1.2, 1.2);
      }
      // (riding the neck's top edge, so it stands up off the neck as a soft ridge)
      const [, , rx, ry] = P.head.skull;
      const poll = plus(hp, turn([sc(-rx * 0.55), sc(-ry * 0.62)], ha));
      const wth = bodyPt([P.body[1][0] + 1.4, P.body[1][1] + 0.6, 0, 0, 1]);
      const back = [Math.cos(na - Math.PI / 2), Math.sin(na - Math.PI / 2)];
      const ridge = (f, k) => {
        const half = sc(lerp(P.neck.w[0], P.neck.w[1], f)) / 2;
        return plus(mid(nb, hp, f), [back[0] * (half + sc(0.4)), back[1] * (half + sc(0.4)) + mm.x * k]);
      };
      mane = [poll, ridge(0.78, 0.4), ridge(0.45, 1), ridge(0.12, 0.6), wth];
    }
    return { pivot, aL, aT, at, bodyPt, legs, nb, hp, na, ha, brow, ears, twitch: a.hfTwitch ?? [0, 0], earsUp: S.ears, tail, mane, down };
  }

  // GRAZE: worked out once: how far the body tips forward about its hips and how the head is held
  // so the nose reaches the ground (the neck's angle then found live each frame).
  const GRAZE = { pitch: 0, head: null, crouch: 0.4 };
  {
    const zero = Object.fromEntries(CH.map((c) => [c, 0]));
    const probe = { t: 0, dt: 0, walkW: 0, mo: { rig: {} } };
    // (the body tipped no more than 18 degrees and crouched a little on all fours, the head turned
    // as low as it goes; a long-legged foal that still can't reach splays down no further: it sniffs)
    let best = null;
    let low = { y: -1e9, pitch: 18, head: 60 };
    for (let pitch = 4; pitch <= 18 && !best; pitch += 2) {
      GRAZE.pitch = pitch;
      for (let head = 40; head <= 95; head += 5) {
        const sk = skeleton({ ...zero, graze: 1, crouch: GRAZE.crouch }, probe);
        const ha = sk.aT * 0.3 + head * D2R;
        const y = sk.nb[1] + sc(P.neck.len) * 0.98 + turn(P.head.tip.map(sc), ha)[1];
        if (y > low.y) low = { y, pitch, head };
        if (y >= -0.3) {
          best = { pitch, head };
          break;
        }
      }
    }
    Object.assign(GRAZE, best ?? low);
  }
  // SLEEP: lying, the neck lowered until the chin rests on the ground.
  const SLEEP = (() => {
    const zero = Object.fromEntries(CH.map((c) => [c, 0]));
    const probe = { t: 0, dt: 0, walkW: 0, mo: { rig: {} } };
    for (let neck = 0; neck <= 110; neck += 2) {
      const sk = skeleton({ ...zero, sleep: 1, neck, head: 26 - neck * 0.3 }, probe);
      const tip = plus(sk.hp, turn(P.head.tip.map(sc), sk.ha));
      if (tip[1] >= -0.4) return { neck, head: 26 - neck * 0.3 };
    }
    return { neck: 110, head: -7 };
  })();

  // ---------- Drawing ----------
  const tone = (a, c) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    if (k <= 0) return c;
    const [r, g, b] = toRgb(c);
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  };
  const line = (ctx) => {
    ctx.strokeStyle = DRESS.ink ?? INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const glow = (ctx, c, r, k, col) => {
    const [cr, cg, cb] = toRgb(col);
    const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
    gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  };
  const outline = loop(P.body, 4);
  const bodyOf = (sk) => (sk.pts ??= outline.map(sk.bodyPt));
  // (clip to everything but the body: a part coming out of it shows only where it is out)
  const clipOffBody = (ctx, sk) => {
    ctx.beginPath();
    ctx.rect(-1e4, -1e4, 2e4, 2e4);
    const pts = bodyOf(sk);
    for (let i = 0; i < pts.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.clip('evenodd');
  };
  // (over the body's edge where a part comes out of it, a band of the part's colour, so not even a
  // hairline shows where the two meet)
  const seal = (ctx, a, sk, shape) => {
    ctx.save();
    ctx.beginPath();
    shape(ctx);
    ctx.clip('nonzero');
    trace(ctx, bodyOf(sk));
    ctx.strokeStyle = tone(a, C.base);
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  };

  // The hoof and pastern, in the fetlock's frame (turned by fr): a short pastern down and forward to
  // the coronet, the hoof a soft rounded block, its front sloped, its sole flat; a soft knob at the
  // fetlock.
  const hoofLoop = loop([
    [hx - hw * 0.36, hup - hh], [hx + hw * 0.24, hup - hh], [hx + hw * 0.47, hup - hh * 0.45], [hx + hw * 0.56, hup - hh * 0.06],
    [hx + hw * 0.36, hup], [hx - hw * 0.36, hup], [hx - hw * 0.5, hup - hh * 0.2], [hx - hw * 0.47, hup - hh * 0.62],
  ], 3);
  const footPath = (ctx, Lg, grow = 0) => {
    const at = (p) => plus(Lg.P, turn(p, Lg.fr));
    tube(ctx, [Lg.P, at([hx * 0.75, hup - hh * 0.8])], [Lg.w[3], hw * 0.66], grow);
    const c = [hx, hup - hh / 2];
    const kx = 1 + (2 * grow) / hw;
    const ky = 1 + (2 * grow) / hh;
    const pts = hoofLoop.map(([x, y]) => at([c[0] + (x - c[0]) * kx, c[1] + (y - c[1]) * ky]));
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    const r = Math.max(0.1, Lg.w[3] * 0.62 + grow);
    ctx.moveTo(Lg.P[0] + r, Lg.P[1]);
    ctx.arc(Lg.P[0], Lg.P[1], r, 0, TAU);
  };
  const hoofOnly = (ctx, Lg, grow) => {
    const at = (p) => plus(Lg.P, turn(p, Lg.fr));
    const c = [hx, hup - hh / 2];
    const pts = hoofLoop.map(([x, y]) => at([c[0] + (x - c[0]) * (1 + (2 * grow) / hw), c[1] + (y - c[1]) * (1 + (2 * grow) / hh)]));
    trace(ctx, pts);
  };
  const SLIM = [0, 0.08, 0.24];
  const legShape = (Lg) => bones([Lg.T, Lg.J1, Lg.J2, Lg.P], Lg.w, SLIM);
  const lowerShape = (Lg) => bones([Lg.J1, Lg.J2, Lg.P], Lg.w.slice(1), SLIM.slice(1));
  // (the shade down the back of the forearm / gaskin and the cannon)
  const backShade = (ctx, Lg, col) => {
    ctx.fillStyle = col;
    for (const [p0, p1, w0, w1] of [[Lg.J1, Lg.J2, Lg.w[1], Lg.w[2]], [Lg.J2, Lg.P, Lg.w[2], Lg.w[3]]]) {
      const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
      let nx = (p0[1] - p1[1]) / l;
      let ny = (p1[0] - p0[0]) / l;
      if (nx * -0.8 + ny * 0.6 < 0) {
        nx = -nx;
        ny = -ny;
      }
      ctx.beginPath();
      tube(ctx, [[p0[0] + nx * w0 * 0.3, p0[1] + ny * w0 * 0.3], [p1[0] + nx * w1 * 0.3, p1[1] + ny * w1 * 0.3]], [w0 * 0.36, w1 * 0.36]);
      ctx.fill('nonzero');
    }
  };
  const darkHoof = (ctx, a, Lg) => {
    ctx.beginPath();
    hoofOnly(ctx, Lg, -0.55);
    ctx.fillStyle = tone(a, Lg.far ? HOOF_F : HOOF_N);
    ctx.fill();
    // (a soft sheen down its front; a split hoof's cleft)
    ctx.save();
    ctx.beginPath();
    hoofOnly(ctx, Lg, -0.55);
    ctx.clip();
    const at = (p) => plus(Lg.P, turn(p, Lg.fr));
    glow(ctx, at([hx + hw * 0.12, hup - hh * 0.62]), hw * 0.42, Lg.far ? 0.25 : 0.4, C.lt);
    if (HF.split) {
      ctx.beginPath();
      ctx.moveTo(...at([hx + hw * 0.2, hup - hh * 0.52]));
      ctx.quadraticCurveTo(...at([hx + hw * 0.32, hup - hh * 0.25]), ...at([hx + hw * 0.3, hup + 0.4]));
      ctx.strokeStyle = tone(a, Lg.far ? C.deep : C.sh);
      ctx.lineWidth = Math.max(0.5, hw * 0.09);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    ctx.restore();
  };
  function drawLeg(ctx, a, mode, k) {
    const sk = a.hk;
    const Lg = sk.legs[k];
    const [pts, wl] = legShape(Lg);
    const whole = (c2, grow = 0) => {
      tube(c2, pts, wl, grow);
      footPath(c2, Lg, grow);
    };
    if (mode === 'line') {
      ctx.beginPath();
      whole(ctx);
      return line(ctx);
    }
    if (Lg.far) {
      // under the body: a shade darker, a soft line inside its edge, the back of each bone shaded
      ctx.beginPath();
      whole(ctx);
      ctx.fillStyle = tone(a, C.deep);
      ctx.fill('nonzero');
      ctx.beginPath();
      whole(ctx, -0.55);
      ctx.fillStyle = tone(a, C.sh);
      ctx.fill('nonzero');
      ctx.save();
      ctx.beginPath();
      whole(ctx, -0.55);
      ctx.clip('nonzero');
      backShade(ctx, Lg, tone(a, C.deep));
      ctx.restore();
      return darkHoof(ctx, a, Lg);
    }
    // A near leg: only where it comes out of the body (the body itself is its top, so nothing of the
    // leg shows on the body), sealed over the body's edge; a lower leg tucked up in front of the body
    // (a jump, rearing) gets its own edge there.
    const body = bodyOf(sk);
    ctx.save();
    clipOffBody(ctx, sk);
    ctx.beginPath();
    whole(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.restore();
    seal(ctx, a, sk, (c2) => whole(c2));
    const lower = lowerShape(Lg);
    const lowerPath = (c2, grow = 0) => {
      tube(c2, lower[0], lower[1], grow);
      footPath(c2, Lg, grow);
    };
    // (clear of the upper bone, so nothing round the elbow or the stifle shows on the body)
    const notUpper = () => {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      tube(ctx, [Lg.T, Lg.J1], [Lg.w[0] + sc(2), Lg.w[1] + sc(1.2)]);
      ctx.clip('evenodd');
    };
    const tucked = inside(body, Lg.P) && sk.down < 0.5;
    if (tucked) {
      ctx.save();
      trace(ctx, body);
      ctx.clip();
      notUpper();
      ctx.beginPath();
      lowerPath(ctx);
      line(ctx);
      ctx.restore();
    }
    // a soft line inside the leg's own outer edge and a shade down the back of its bones: off the
    // body, from the whole leg's outline (so no seam runs round the elbow or the stifle); over the
    // body (tucked), from the lower leg only, clear of the upper bone
    const detail = (path) => {
      ctx.beginPath();
      path(ctx);
      ctx.fillStyle = tone(a, C.sh);
      ctx.fill('nonzero');
      ctx.beginPath();
      path(ctx, -0.55);
      ctx.fillStyle = tone(a, C.base);
      ctx.fill('nonzero');
      ctx.beginPath();
      path(ctx, -0.55);
      ctx.clip('nonzero');
      backShade(ctx, Lg, tone(a, C.sh));
    };
    ctx.save();
    clipOffBody(ctx, sk);
    detail(whole);
    ctx.restore();
    if (tucked) {
      ctx.save();
      trace(ctx, body);
      ctx.clip();
      notUpper();
      detail(lowerPath);
      ctx.restore();
    }
    ctx.save();
    if (!tucked) clipOffBody(ctx, sk);
    darkHoof(ctx, a, Lg);
    ctx.restore();
  }
  // The body: its outline over the spine; the back lit, the belly shaded softly between the legs
  // (fading before them), the rump and the shoulder lit round, moving with the legs under them.
  const topline = P.body.filter((p) => p[1] < -5);
  const hindJ = LEGS.hindN.rest[1][0];
  const foreJ = LEGS.foreN.rest[1][0];
  function drawBody(ctx, a, mode) {
    const sk = a.hk;
    const pts = bodyOf(sk);
    trace(ctx, pts);
    if (mode === 'line') return line(ctx);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    for (const p of topline) glow(ctx, sk.bodyPt([p[0], p[1] + 2.6, p[2], p[3], p[4]]), sc(4.6), 0.34, C.lt);
    {
      const c = sk.at([(hindJ + foreJ) / 2, bellyY + 1.6]);
      const rx = sc((foreJ - hindJ) / 2 - 2.2);
      const ry = sc(5.2);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate((sk.aL + sk.aT) / 2);
      ctx.scale(rx / ry, 1);
      const [r, g, b] = toRgb(C.sh);
      const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.75)`);
      gr.addColorStop(0.55, `rgba(${r},${g},${b},0.4)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gr;
      ctx.fillRect(-ry, -ry, ry * 2, ry * 2);
      ctx.restore();
    }
    const Lf = sk.legs.foreN;
    const Lh = sk.legs.hindN;
    glow(ctx, plus(mid(Lh.T, Lh.J1, 0.2), [-sc(1.4), -sc(1.2)]), sc(6.4), 0.5, C.lt);
    glow(ctx, plus(mid(Lf.T, Lf.J1, 0.25), [sc(0.4), -sc(0.8)]), sc(4.4), 0.42, C.lt);
    glow(ctx, sk.at([P.body[14][0] - 2.2, P.body[14][1]]), sc(3.6), 0.5, C.lt);
    ctx.restore();
  }
  // The neck: from inside the chest up into the head; shown only where it comes out of the body.
  const neckPts = (sk) => [sk.nb, mid(sk.nb, sk.hp, 0.5), sk.hp];
  const neckW = [sc(P.neck.w[0]), sc((P.neck.w[0] + P.neck.w[1]) / 2), sc(P.neck.w[1])];
  function drawNeck(ctx, a, mode) {
    const sk = a.hk;
    const pts = neckPts(sk);
    if (mode === 'line') {
      ctx.beginPath();
      tube(ctx, pts, neckW);
      return line(ctx);
    }
    ctx.save();
    clipOffBody(ctx, sk);
    ctx.beginPath();
    tube(ctx, pts, neckW);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    // (a soft shade down the throat)
    ctx.beginPath();
    tube(ctx, pts, neckW);
    ctx.clip('nonzero');
    const n = turn([0, 1], sk.na - Math.PI / 2);
    const off = (i) => plus(pts[i], n.map((v) => -v * neckW[i] * 0.42));
    ctx.beginPath();
    tube(ctx, [off(0), off(1), off(2)], neckW.map((v) => v * 0.4));
    ctx.fillStyle = `rgba(${toRgb(C.sh).join(',')},0.45)`;
    ctx.fill('nonzero');
    ctx.restore();
    seal(ctx, a, sk, (c2) => tube(c2, pts, neckW));
  }
  // The foal's mane: a short soft ridge along the top of the neck, a touch deeper than the coat.
  const maneW = P.neck.mane?.map(sc);
  function drawMane(ctx, a, mode) {
    const sk = a.hk;
    if (!sk.mane) return;
    const pts = sk.mane;
    const wl = [maneW[0], maneW[1], maneW[1], maneW[1] * 0.92, maneW[2]];
    if (mode === 'line') {
      ctx.beginPath();
      tube(ctx, pts, wl);
      return line(ctx);
    }
    ctx.save();
    clipOffBody(ctx, sk);
    ctx.beginPath();
    tube(ctx, pts, wl);
    ctx.fillStyle = tone(a, blendHex(C.base, C.sh, 0.55));
    ctx.fill('nonzero');
    ctx.beginPath();
    tube(ctx, pts.map(([x, y]) => [x + sc(0.3), y - sc(0.4)]), wl.map((v) => v * 0.45));
    ctx.fillStyle = tone(a, C.base);
    ctx.globalAlpha *= 0.6;
    ctx.fill('nonzero');
    ctx.restore();
  }
  // The head, in its own frame (about the middle of the skull, the face to the right).
  const HD = P.head;
  const headPath = (ctx, grow = 0) => {
    ctx.beginPath();
    for (const [x, y, rx, ry, r] of [[...HD.skull, 0], ...HD.more]) {
      const X = sc(x);
      const Y = sc(y);
      const RX = sc(rx) + grow;
      const RY = sc(ry) + grow;
      ctx.moveTo(X + RX * Math.cos(r), Y + RX * Math.sin(r));
      ctx.ellipse(X, Y, RX, RY, r, 0, TAU);
    }
  };
  const guide = (ctx, pts) => {
    ctx.beginPath();
    ctx.moveTo(sc(pts[0][0]), sc(pts[0][1]));
    ctx.quadraticCurveTo(sc(pts[1][0]), sc(pts[1][1]), sc(pts[2][0]), sc(pts[2][1]));
    ctx.stroke();
  };
  function drawHead(ctx, a, mode) {
    const sk = a.hk;
    ctx.save();
    ctx.translate(sk.hp[0], sk.hp[1]);
    ctx.rotate(sk.ha);
    headPath(ctx);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    headPath(ctx);
    ctx.clip('nonzero');
    const [, , rx, ry] = HD.skull;
    const mz = HD.more[0];
    glow(ctx, [sc(-rx * 0.15), sc(-ry * 0.45)], sc(rx * 0.9), 0.95, C.lt);
    glow(ctx, [sc(mz[0] + mz[2] * 0.2), sc(mz[1] - mz[3] * 0.2)], sc(mz[2] * 1.1), 0.75, C.lt);
    glow(ctx, [sc(-rx * 0.55), sc(ry * 0.5)], sc(ry * 0.9), 0.5, C.sh);
    glow(ctx, [sc(HD.tip[0] - 2.4), sc(HD.tip[1] + 0.6)], sc(3.6), 0.45, C.sh);
    ctx.restore();
    // its own face (the dress)
    DRESS.face?.(ctx, a, sk, KIT);
    ctx.restore();
  }
  // The ears, in the head's frame: a leaf rooted at its own base inside the head, a deeper tone
  // inside toward the tip; on its spring, perked up or laid back, each flicking on its own.
  const EA = P.ears;
  const earLoop = (L, W) => loop([[-W * 0.2, 0], [0, -W * 0.42], [L * 0.38, -W * 0.5], [L * 0.78, -W * 0.3], [L, 0], [L * 0.78, W * 0.3], [L * 0.38, W * 0.5], [0, W * 0.42]], 3);
  const earOut = earLoop(sc(EA.len), sc(EA.wid));
  const earIn = earLoop(sc(EA.len) * 0.62, sc(EA.wid) * 0.5).map(([x, y]) => [x + sc(EA.len) * 0.3, y]);
  function drawEar(ctx, a, mode, which) {
    const sk = a.hk;
    const far = which === 'far';
    const tw = sk.twitch[far ? 1 : 0];
    const e = sk.earsUp;
    const flick = EA.kind === 'point' ? -0.5 : 0.35;
    const ang = (EA.ang + (e > 0 ? e * EA.perk : -e * EA.flat) + (far ? (EA.kind === 'point' ? -6 : 10) : 0)) * D2R + sk.ears[far ? 1 : 0] * 0.7 + tw * flick;
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    ctx.translate(...EA[far ? 'far' : 'near'].map(sc));
    ctx.rotate(ang);
    trace(ctx, earOut);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, far ? C.sh : C.base);
    ctx.fill();
    trace(ctx, earIn);
    ctx.fillStyle = tone(a, far ? C.deep : C.sh);
    ctx.globalAlpha *= 0.85;
    ctx.fill();
    ctx.restore();
  }
  // The kid's horn nubs: small soft cones rooted inside the skull, slanting back.
  const HN = P.horns;
  const hornLoop = HN ? loop([[0, -sc(HN.wid) * 0.5], [sc(HN.len) * 0.6, -sc(HN.wid) * 0.36], [sc(HN.len), -sc(0.3)], [sc(HN.len) * 1.06, sc(0.2)], [sc(HN.len) * 0.6, sc(HN.wid) * 0.36], [0, sc(HN.wid) * 0.5], [-sc(1.2), 0]], 3) : null;
  function drawHorn(ctx, a, mode, which) {
    if (!HN) return;
    const sk = a.hk;
    const far = which === 'far';
    ctx.save();
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    ctx.translate(...HN[far ? 'far' : 'near'].map(sc));
    ctx.rotate((HN.ang + (far ? -6 : 0)) * D2R);
    trace(ctx, hornLoop);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, far ? C.deep : blendHex(C.sh, C.deep, 0.3));
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sc(HN.len) * 0.45, -sc(HN.wid) * 0.12, sc(HN.len) * 0.36, sc(HN.wid) * 0.14, 0, 0, TAU);
    ctx.fillStyle = tone(a, far ? C.sh : C.lt);
    ctx.globalAlpha *= 0.55;
    ctx.fill();
    ctx.restore();
  }
  // The tail: one soft tube along its chain, a shade down its underside.
  const TW = P.tail.w.map(sc);
  function drawTail(ctx, a, mode) {
    const sk = a.hk;
    const T = sk.tail;
    ctx.beginPath();
    tube(ctx, T, TW);
    if (mode === 'line') return line(ctx);
    ctx.fillStyle = tone(a, P.tail.kind === 'tuft' ? blendHex(C.base, C.sh, 0.3) : C.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.beginPath();
    tube(ctx, T, TW);
    ctx.clip('nonzero');
    ctx.beginPath();
    tube(ctx, T.map(([x, y], i) => [x - TW[i] * 0.15, y + TW[i] * 0.32]), TW.map((v) => v * 0.45));
    ctx.fillStyle = `rgba(${toRgb(C.sh).join(',')},0.7)`;
    ctx.fill('nonzero');
    ctx.restore();
  }

  // ---------- Effects: sparkles on a hit, dust, a pronk's twinkles, speed lines ----------
  const star = (ctx, x, y, r, an, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.3 : r;
      const q = an + (i * Math.PI) / 4;
      ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  const puff = (ctx, x, y, r, al) => {
    ctx.globalAlpha = al;
    ctx.fillStyle = '#f3eefa';
    ctx.strokeStyle = '#d6cbe6';
    ctx.lineWidth = Math.max(0.4, r * 0.12);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  };
  const where = (sk, w) => {
    const L = sk.legs;
    if (w === 'brow') return sk.brow;
    if (w === 'hinds') return mid(L.hindN.P, L.hindF.P, 0.5);
    if (w === 'fores') return mid(L.foreN.P, L.foreF.P, 0.5);
    if (w === 'all') return mid(L.hindN.P, L.foreN.P, 0.5);
    return plus(sk.pivot, [0, sc(6)]);
  };
  function drawFx(ctx, m, a) {
    const sk = a.hk;
    const mv = a.hfMove?.mv;
    const t = a.hfMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    for (const s0 of mv.spark ?? []) {
      const k = after([s0], t, 0.24);
      if (k < 0) continue;
      let [x, y] = where(sk, mv.sparkAt);
      if (mv.sparkAt === 'hinds') x -= sc(2.5);
      const e = easeOut(k);
      ctx.globalAlpha = 1 - k;
      star(ctx, x, y, H * 0.11 * (0.5 + 0.7 * e), k * 0.8, '#ffffff');
      star(ctx, x, y, H * 0.055 * (0.5 + 0.7 * e), k * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.6;
        star(ctx, x + Math.cos(q) * H * 0.15 * e, y + Math.sin(q) * H * 0.15 * e, H * 0.028, q, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    for (const s0 of mv.twinkle ?? []) {
      const k = after([s0], t, 0.4);
      if (k < 0) continue;
      const c = plus(sk.pivot, [0, -sc(4)]);
      ctx.globalAlpha = Math.sin(Math.PI * k) * 0.9;
      for (let i = 0; i < 3; i++) {
        const q = -2.4 + i * 0.75;
        const r = sc(12) + k * sc(5);
        star(ctx, c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r, H * 0.04 * (1 - k * 0.4), k * 2 + i, i % 2 ? '#fff2a8' : '#ffffff');
      }
    }
    for (const [d0, w] of mv.dust ?? []) {
      const k = after([d0], t, 0.4);
      if (k < 0) continue;
      const [gx] = where(sk, w);
      const e = 1 - (1 - k) ** 2;
      for (let i = 0; i < 4; i++) {
        const dir = i < 2 ? -1 : 1;
        puff(ctx, gx + dir * sc(2 + (i % 2) * 3) * (0.4 + e), -sc(1 + (i % 2)) - e * sc(2.4), sc(1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - k) * 0.85);
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
        ctx.moveTo(sk.pivot[0] - sc(14) - sc(6) * k, y);
        ctx.lineTo(sk.pivot[0] - sc(24) - sc(10) * k, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st, t) {
    if (m.act && MOVES[m.act.name]) {
      const mv = MOVES[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + lastKey(mv)) {
        const tt = T - mv.anticT;
        return [mv, tt, tt < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.since >= 0 && st.hfSince !== undefined && a.ph.since < st.hfSince - 0.05) st.hfAtk = false;
    st.hfSince = a.ph.since;
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.hfAtk) {
        const pool = m.def.moves ?? ATTACKS;
        st.hfN = st.hfN === undefined ? 0 : st.hfN + 1;
        st.hfPick = m.move ?? pool[st.hfN % pool.length];
      }
      st.hfAtk = true;
      const mv = MOVES[st.hfPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.hfAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lastKey(HOOF_MOVES.hurt)) return [HOOF_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < HOOF_MOVES.pronk.anticT + lastKey(HOOF_MOVES.pronk)) {
      const tt = gl - HOOF_MOVES.pronk.anticT;
      return [HOOF_MOVES.pronk, tt, tt < 0 ? gl / HOOF_MOVES.pronk.anticT : 1];
    }
    // (glad in a scene: a pronk now and then)
    if (m.hp > 0 && m.cine?.mood === 'happy') {
      const c = (t % 2.6) - 0.6;
      if (c < lastKey(HOOF_MOVES.pronk)) return [HOOF_MOVES.pronk, c, c < 0 ? 1 + c / 0.6 : 1];
    }
    return [null, 0, 0];
  }
  const seq = [
    ['hindF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindF')],
    ['foreF', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreF')],
    ['tail', drawTail],
    ['body', drawBody],
    ['hindN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'hindN')],
    ['foreN', (ctx, a, mode) => drawLeg(ctx, a, mode, 'foreN')],
    ['neck', drawNeck],
    ['mane', drawMane],
    ['earF', (ctx, a, mode) => drawEar(ctx, a, mode, 'far')],
    ['hornF', (ctx, a, mode) => drawHorn(ctx, a, mode, 'far')],
    ['hornN', (ctx, a, mode) => drawHorn(ctx, a, mode, 'near')],
    ['head', drawHead],
    ['earN', (ctx, a, mode) => drawEar(ctx, a, mode, 'near')],
  ];
  const tintA = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const n = parseInt(c.slice(1, 7), 16);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)},${al})`;
  };
  // (the dress's kit, and its hooks round each part)
  const KIT = {
    C, P, colour: tone, tint: tintA, edge: line, sc, glow, trace, tube, loop, turn, plus, mid, H, moves: MOVES, keyPose, hold,
    headFrame: (ctx, a) => {
      ctx.translate(a.hk.hp[0], a.hk.hp[1]);
      ctx.rotate(a.hk.ha);
    },
    headPath: (ctx, grow = 0) => headPath(ctx, grow),
    bodyPath: (ctx, a) => trace(ctx, bodyOf(a.hk)),
    skel: (a) => a.hk,
  };
  const hooked = (name, draw) => (ctx, a, mode) => {
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
  };
  const parts = ['line', 'fill'].flatMap((mode) => seq.map(([name, draw]) => ({ name: mode === 'line' ? name : `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: NOTHING, paint: (ctx, a) => hooked(name, draw)(ctx, a, mode) })));
  const rand = (n, uid) => {
    const q = Math.sin(n * 12.9898 + (uid % 97) * 78.233) * 43758.5453;
    return q - Math.floor(q);
  };
  const W = Math.ceil(bodyLen * 2.4 + sc(34));
  const Hh = Math.ceil(H * 1.4);
  const rig = makeRig({
    w: W,
    h: Hh,
    soft: true,
    stride,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'lie' || c === 'sleep' ? [36, 11] : c === 'graze' ? [40, 12] : c === 'paw' || c === 'swish' ? [60, 14] : c === 'neck' || c === 'head' || c === 'ears' ? [150, 21] : [170, 21]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], neck: [240, 28], head: [240, 28] },
    fast: CH.filter((c) => !['neck', 'head', 'ears', 'tailUp', 'swish', 'paw', 'graze'].includes(c)),
    // (its own moves snap as hard as an attack; beaten, it drops within the half second it stays)
    fastNow: (m, a) => Boolean(a.mo.rig?.hfActive) || m.hp <= 0,
    kick: { pitch: -36, head: -40 },
    turnKick: { pitch: 14 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + ((m.uid ?? 0) % 7) * 1.3;
      // The gait: its phase from the distance walked (never the clock); trotting, then cantering.
      const dt = Math.max(1e-3, a.dt || 0);
      const odo = m.odo ?? 0;
      let d = Math.abs(odo - (st.hfOdo ?? odo));
      if (d > 40) d = 0;
      st.hfOdo = odo;
      st.hfV = lerp(st.hfV ?? 0, Math.min(500, d / dt), Math.min(1, dt * 4));
      const v = st.hfV;
      const trotGoal = a.moving ? clamp((v - walkSpeed * 1.2) / (walkSpeed * 0.45), 0, 1) : 0;
      const runGoal = a.moving ? clamp((v - walkSpeed * 2) / (walkSpeed * 0.6), 0, 1) : 0;
      st.hfTrot = lerp(st.hfTrot ?? 0, trotGoal, Math.min(1, dt * 4));
      st.hfRun = lerp(st.hfRun ?? 0, runGoal, Math.min(1, dt * 4));
      st.hfU = frac((st.hfU ?? 0) + d / cycleOf(st.hfTrot, st.hfRun));
      // Standing about: breathing; a slow glance round (held, then turning); the weight shifting
      // from end to end; each ear flicking alone; a tail swish; now and then a toss of the head or a
      // few scrapes of a forehoof.
      const uid = m.uid ?? 0;
      const breath = Math.sin(t * 1.5);
      const gb = Math.floor(t / 4.6);
      const look = lerp(rand(gb - 1, uid), rand(gb, uid), ease(frac(t / 4.6) / 0.22)) * 2 - 1;
      const sb = Math.floor(t / 7.4);
      const shift = lerp(rand(sb + 40, uid), rand(sb + 41, uid), ease(frac(t / 7.4) / 0.3)) * 2 - 1;
      const cy = t % 19;
      const quiet = DRESS.quietIdle ? 0 : 1;
      const toss = hold(cy, 6.2, 6.42, 6.6, 7.3) * quiet;
      const paw = hold(cy, 12, 12.3, 14.1, 14.6) * quiet;
      a.hfTwitch = [hold(t % 5.3, 2, 2.06, 2.14, 2.4), hold(t % 6.7, 3.4, 3.46, 3.54, 3.8)];
      const idle = {
        x: shift * 0.5, lift: breath * 0.14, hop: 0, pitch: shift * 1.2, arch: breath * 0.7, hipLift: 0, crouch: 0, lie: 0, sleep: 0, graze: 0, rear: 0, kick: 0, tuck: 0, stiff: 0, fly: 0,
        neck: look * 5 - toss * 22 - paw * 4, head: look * 3 - toss * 14 + breath * 0.5 + paw * 10, ears: 0.15 - toss * 0.4 + paw * 0.2, tailUp: 0, swish: hold(t % 8.3, 3, 3.3, 4.4, 4.9), paw,
      };
      const r = st.hfRun;
      const walk = { ...idle, x: 0, pitch: 0, arch: 0, neck: -3 - r * 5, head: 3 + r * 4, ears: 0.15 - r * 0.6, tailUp: -r * 30, swish: 0, paw: 0 };
      const [mv, mt, anticW] = moveNow(m, a, st, t);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? keyPose(mv, mt, anticW, base) : { ...base };
      const sleeping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0));
      if (m.pose === 'graze' && !mv) Object.assign(out, { graze: 1, crouch: GRAZE.crouch, x: 0, pitch: 0, neck: 0, head: 0, ears: 0.1, paw: 0, swish: out.swish });
      else if (m.pose === 'lie' && !mv) Object.assign(out, { lie: 1, neck: -4 + look * 4, head: 6 + look * 2, ears: 0.2, paw: 0, tailUp: 8 });
      else if (sleeping && !mv) Object.assign(out, { sleep: 1, lie: 1, neck: SLEEP.neck, head: SLEEP.head + Math.sin(t * 0.9) * 0.8, ears: -0.7, paw: 0, swish: 0, tailUp: 12, lift: Math.sin(t * 0.9) * 0.25 });
      // (a scene's mood: drooping when sad, pawing with the ears back when cross)
      if (m.hp > 0 && m.cine?.mood === 'sad') Object.assign(out, { neck: out.neck + 18, head: out.head + 10, ears: -0.8, tailUp: 16 });
      if (m.hp > 0 && m.cine?.mood === 'angry' && !mv) Object.assign(out, { paw: 1, neck: 8, head: 14, ears: -0.8 });
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      if (m.hp <= 0) Object.assign(out, { x: out.x * 0, hop: 0, lie: 1, sleep: 1, neck: SLEEP.neck + 6, head: SLEEP.head + 8, ears: -1, tailUp: 16, rear: 0, kick: 0, stiff: 0, fly: 0, tuck: 0, paw: 0, swish: 0, graze: 0 });
      st.hfActive = Boolean(mv);
      a.hfMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * H;
      res.hop = out.hop * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.hk = skeleton(S, a);
    },
    parts,
    fx: (ctx, m, a, S) => {
      drawFx(ctx, m, a);
      DRESS.fx?.(ctx, m, a, S, KIT);
    },
  });
  // (a still for the Monster Book: the body and the head at rest, plain)
  const still = () => ({ w: W, h: Hh, res: 3, shapes: [E(bodyLen * 1.2, Hh - hb, bodyLen * 0.5, sc(7.5), C.base), E(bodyLen * 1.2 + sc(13), Hh - hb - sc(15), sc(HD.skull[2]), sc(HD.skull[3]), C.base)] });
  return { rig, still, stride, speed: walkSpeed, H, w: Math.round(bodyLen * 1.45), h: Math.round(H * 1.08), moves: P.moves };
}

// One dressed hoofed animal: its art entry (for ARTS) and its size.
export function dressedHoof(look) {
  const q = hoofRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: q.stride, atkMs: [110, 180, 340, 240], draw: q.still, rig: q.rig }, w: q.w, h: q.h, speed: q.speed, bodyH: q.H };
}
