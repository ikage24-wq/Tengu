// The shell crawler base (2026-11-25): a blank chibi creature that carries its house on its back,
// made for shelled crawlers from the start; nothing carried over from another base, only the
// engine is shared (rig.js's springs). Drawn live like the other blank bases: smooth shapes over
// its bones, outlined only on its outer edge (every part's line first, then every part's fill).
// A plain lilac mannequin to build on: no eyes, no markings, no shell pattern; soft guides only.
//
// The body, side on, facing right:
//   shell   one plain rigid shape riding the body: a snail's round coil (a soft spiral guide where
//           the whorls meet, a soft lip guide at its mouth), a tortoise's high dome, a sea turtle's
//           low teardrop (each with one soft guide where the rim's band begins); lit from the top
//           left whichever way it turns; everything else comes out from under it, its roots hidden
//   snail   one soft body: a long muscular foot flat on the ground (a round lip in front, a tapered
//           tail behind), rising in front of the shell into a neck and a round head; it glides,
//           soft ripples travelling forward along the underside as it goes (`stretch`: the body
//           reaching out of the shell, longer and a touch thinner; bunched back, shorter and
//           fuller); two upper stalks (plain stub guides, a soft knob at the tip) and two small
//           lower ones, each on its own spring, wandering on its own, drawn in by telescoping
//           into the head; the shell can tip forward over the head (`lean`)
//   tortoise four stubby elephant columns on round flat pads, a plodding walk in diagonal pairs,
//           the dome rocking a little; a head on a neck that slides out of the shell's front and
//           back in; a tiny tail
//   seaturtle four flippers: the front pair rows together on land (planted, hauling the body
//           forward in a lurch, then swung forward through the air), the hind pair pushing; the
//           shell lifts on each stroke and settles between
//   hide    everything drawn smoothly into the shell (the head and legs slide in, the shell settles
//           on the ground); `peek`: the head (and a snail's stalks) easing cautiously back out
//   head    faceless: a soft eye line, a soft mouth line, a tiny nostril; a jaw that opens (a nibble,
//           a snap, a yawn); held level, lagging the body a touch and settling
// Presets: snail, tortoise, seaturtle.
// Moves (SHELL_MOVES): spin (pulled in, spinning along the ground, bouncing back, popping out; the
// shared signature), glide (snail: a slime-glide charge), bonk (snail: the shell swung forward over
// its ducked head), headbutt and bash (tortoise: the neck shot out; a hop leading with the front of
// the shell), slap and snap (sea turtle: a flipper raised high and slapped down; a quick bite), jump
// (a little hop), dash, dodge, hurt, knockdown (tipped onto its back, rocking, legs paddling, then
// rolling back up), hide (in, a cautious peek, back in, out); a long neck stretch and a yawn when
// pleased. Poses (m.pose): rest (settled down, legs out flat), hide (pulled in, peeking out now and
// then), sleep (settled, the head drawn half in). A nap (m.habit nap) sleeps.

import { makeRig, clamp, TAU } from './rig.js';
import { hold } from './kidrig.js';
import { E } from './kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the outer line: a soft deep lilac of its own, never near-black)
const INK = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const sstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const unit = (an) => [Math.cos(an), Math.sin(an)];
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const frac = (x) => x - Math.floor(x);
const rgbOf = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// ---------- Curves ----------
// A smooth closed outline through control points (`n` steps between each two).
function loopThrough(pts, n) {
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
      const f = (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  return out;
}
const bez3 = (p0, p1, p2, p3, t) => {
  const s = 1 - t;
  return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]];
};
const bez2 = (p0, p1, p2, t) => {
  const s = 1 - t;
  return [s * s * p0[0] + 2 * s * t * p1[0] + t * t * p2[0], s * s * p0[1] + 2 * s * t * p1[1] + t * t * p2[1]];
};
// The outline of a soft round-ended tube along a spine (`ws`: its full width at each point).
function tubeOutline(sp, ws, capN = 7) {
  const n = sp.length;
  const tan = sp.map((_, i) => {
    const d = sub(sp[Math.min(n - 1, i + 1)], sp[Math.max(0, i - 1)]);
    const l = Math.hypot(d[0], d[1]) || 1;
    return [d[0] / l, d[1] / l];
  });
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const h = ws[i] / 2;
    left.push([sp[i][0] - tan[i][1] * h, sp[i][1] + tan[i][0] * h]);
    right.push([sp[i][0] + tan[i][1] * h, sp[i][1] - tan[i][0] * h]);
  }
  const out = [...left];
  const ae = Math.atan2(tan[n - 1][1], tan[n - 1][0]);
  for (let k = 1; k < capN; k++) out.push(add(sp[n - 1], mul(unit(ae + Math.PI / 2 - (Math.PI * k) / capN), ws[n - 1] / 2)));
  for (let i = n - 1; i >= 0; i--) out.push(right[i]);
  const a0 = Math.atan2(tan[0][1], tan[0][0]);
  for (let k = 1; k < capN; k++) out.push(add(sp[0], mul(unit(a0 - Math.PI / 2 - (Math.PI * k) / capN), ws[0] / 2)));
  return out;
}
// (every shape wound the same way round as an ellipse, so where two of a part's shapes overlap
// they add up: one filled union, never a hole)
const addShape = (ctx, pts) => {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  const list = area < 0 ? [...pts].reverse() : pts;
  list.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
const addOval = (ctx, [cx, cy], rx, ry, an = 0) => {
  ctx.moveTo(cx + Math.cos(an) * rx, cy + Math.sin(an) * rx);
  ctx.ellipse(cx, cy, rx, ry, an, 0, TAU);
};
// Two-bone reach: from `a` toward `b`, bones l1 then l2, the joint bent to `side` (+1 / -1).
function reach2(a, b, l1, l2, side) {
  const d = sub(b, a);
  const L = clamp(Math.hypot(d[0], d[1]), Math.abs(l1 - l2) + 0.02, l1 + l2 - 0.02);
  const base = Math.atan2(d[1], d[0]);
  const k = Math.acos(clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * L), -1, 1));
  return { J: add(a, mul(unit(base + side * k), l1)), F: add(a, mul(unit(base), L)) };
}
// A damped spring kept in the rig's state, stepped finely (a slow frame never throws it about).
function follow(st, key, goal, k, c, dt) {
  const s = (st[key] ??= { x: goal, v: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      s.v += ((goal - s.x) * k - s.v * c) * h;
      s.x += s.v * h;
    }
  }
  if (!Number.isFinite(s.x)) Object.assign(s, { x: goal, v: 0 });
  return s.x;
}
// The same for a point (a stalk's tip, a tail's tip).
function followPt(st, key, goal, k, c, dt) {
  const s = (st[key] ??= { p: [...goal], v: [0, 0] });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      for (const j of [0, 1]) {
        s.v[j] += ((goal[j] - s.p[j]) * k - s.v[j] * c) * h;
        s.p[j] += s.v[j] * h;
      }
    }
  }
  if (!Number.isFinite(s.p[0] + s.p[1]) || dist(s.p, goal) > 12) Object.assign(s, { p: [...goal], v: [0, 0] });
  return s.p;
}

// ---------- The crawlers (units: game px at scale 1; x forward, y down, the ground at y = 0) ----------
// Shells are drawn about their own middle: `ring` the outline (front first, round over the top and
// back under), `rim` the soft guide where the rim's band begins; `standY` how high the middle rides.
const SNAIL = {
  name: 'Snail',
  type: 'snail',
  speed: 7,
  rollK: 0.84,
  shell: { c: [-3.4, -12.6], r: 10.2, turns: 2.2 },
  foot: { back: -17.4, front: 14.6, h: 4.8 },
  neck: { base: [8.6, -3.9], w: [6.8, 5.9] },
  head: { c: [13.6, -12.6], rx: 4.9, ry: 4.5, tilt: 4 },
  stalks: [
    { id: 'upF', far: true, up: true, root: [-0.9, -3.5], ang: -82, len: 5.6, w: 1.45 },
    { id: 'loF', far: true, up: false, root: [3.5, 1.3], ang: 22, len: 2.1, w: 1.15 },
    { id: 'upN', far: false, up: true, root: [1.2, -3.8], ang: -64, len: 6.2, w: 1.55 },
    { id: 'loN', far: false, up: false, root: [4.2, 0.8], ang: 8, len: 2.4, w: 1.2 },
  ],
  ripple: 5.6,
  moves: ['glide', 'bonk', 'spin'],
};
const TORTOISE = {
  name: 'Tortoise',
  type: 'tortoise',
  speed: 9,
  rollK: 1,
  shell: {
    ring: [[11.6, 5.6], [12.4, 2.4], [10.8, -2.8], [7.4, -6.8], [2.4, -8.9], [-3, -9], [-8, -7.1], [-11.6, -3.3], [-13.2, 1.1], [-13, 5], [-11.6, 6.9], [-6.5, 7.6], [0, 7.9], [6.5, 7.6], [10.4, 6.9]],
    rim: [[12.2, 3.4], [6.4, 4.7], [0, 5.1], [-6.6, 4.7], [-12.9, 3.2]],
    standY: -13.4,
  },
  legs: { foreN: { hip: [7, 3.4], fx: 0.6 }, foreF: { hip: [5, 2.6], fx: 0.6 }, hindN: { hip: [-7.8, 3.4], fx: -0.5 }, hindF: { hip: [-9.8, 2.6], fx: -0.5 } },
  leg: { l1: 4.2, l2: 4, wF: 4.6, wH: 5, foot: [6, 2.2] },
  gait: { cycle: 7.6, duty: 0.68, lift: 1.6, phase: { foreN: 0, hindF: 0.06, foreF: 0.5, hindN: 0.56 } },
  neck: { root: [4, 0.8], open: [10.6, 2.8], ang: -18, ext: 7.2, inExt: -7.4, peekExt: -1.2, w: 4.5 },
  head: { skull: [0, 0, 4.3, 3.6], snout: [2.5, 0.5, 2.6, 2.5], tilt: 4, nostril: [4.8, -0.4] },
  tail: { root: [-11.8, 4.6], len: 3, w: 2.3, ang: 152 },
  crouchDrop: 1.9,
  moves: ['headbutt', 'bash', 'spin'],
};
const SEATURTLE = {
  name: 'Sea turtle',
  type: 'seaturtle',
  speed: 8,
  rollK: 1,
  shell: {
    ring: [[11.4, 3.4], [12.2, 0.2], [10.4, -3.8], [6.4, -6.9], [0.4, -8.1], [-5.8, -7.5], [-11, -5], [-14.8, -1.6], [-17.2, 1.8], [-14.8, 3.9], [-8, 4.8], [0, 5.1], [7.4, 4.8]],
    rim: [[12, 1.7], [6, 3.1], [-1, 3.5], [-8, 3.1], [-15.8, 1.5]],
    standY: -9.2,
  },
  // (front flippers: a shoulder under the shell's lower edge, a short arm, a long curved blade; on
  // land they row together: the tip planted ahead and the body hauled up and over it, then lifted
  // just off the ground and slid forward low, the tip trailing; the hind ones small round paddles
  // that push)
  legs: {
    foreN: { hip: [8, 4], front: true }, foreF: { hip: [6.4, 3.2], front: true },
    hindN: { hip: [-12, 3.4] }, hindF: { hip: [-13.4, 2.6] },
  },
  flip: { arm: 2.4, blade: 9.6, hind: 4.8, ahead: 8.4 },
  gait: { cycle: 8.4, duty: 0.6, surge: 2, phase: { foreN: 0, foreF: 0.05, hindN: 0.5, hindF: 0.55 } },
  neck: { root: [4, 0], open: [10.4, 1.2], ang: -28, ext: 7.6, inExt: -7.6, peekExt: -1, w: 4.6 },
  head: { skull: [0, 0, 4.5, 3.8], snout: [2.4, 0.6, 2.7, 2.6], tilt: 8, nostril: [4.9, -0.3] },
  crouchDrop: 1.4,
  moves: ['slap', 'snap', 'spin'],
};
export const SHELL_PRESETS = { snail: SNAIL, tortoise: TORTOISE, seaturtle: SEATURTLE };
export const SHELL_KINDS = ['snail', 'tortoise', 'seaturtle'];

// ---------- The moves (units: x, hop in body heights; lift in px; angles in degrees) ----------
// pitch: + nose down; roll: + tipped over backwards (on its back at 180); nAng: + the neck raised;
// head: + nose down; neck: + reaching further out; stalkA: + the stalks swept back; lean: + a
// snail's shell tipped forward; flipN: + a near front flipper raised high, - slapped down ahead.
// `spin`: [from, to, turns] the whole shell turning; `spark`, `dust`, `lines`: effects.
export const SHELL_MOVES = {
  spin: {
    anticT: 0.3,
    keys: [
      [0, { crouch: 0.7, x: -0.03, neck: -0.4, nAng: 6, stalk: 0.4, stalkA: 20, hide: 0.2 }],
      [0.1, { hide: 1, stalk: 0, x: -0.02 }, 'out'],
      [0.56, { hide: 1, stalk: 0, x: 0.62 }, 'io'],
      [0.66, { hide: 1, stalk: 0, x: 0.6, hop: 0.06 }, 'out'],
      [0.86, { hide: 1, stalk: 0, x: 0.22, hop: 0 }, 'io'],
      [1.02, { hide: 0.55, stalk: 0.4, x: 0.08, crouch: 0.3 }, 'io'],
      [1.22, {}],
    ],
    spin: [[0.06, 0.6, 2.75], [0.6, 0.92, -0.75]],
    spark: [0.58],
    sparkAt: 'shellfront',
    lines: [0.12, 0.6],
    dust: [[0.1, 'body'], [0.6, 'body']],
  },
  glide: {
    anticT: 0.35,
    keys: [
      [0, { stretch: -0.5, x: -0.03, stalkA: 24, nAng: 8, head: -8, lean: -5, crouch: 0.3 }],
      [0.13, { stretch: 1, x: 0.56, stalkA: 34, nAng: -12, head: 10, lean: 5, crouch: 0 }, 'out'],
      [0.32, { stretch: 0.8, x: 0.62, stalkA: 16, nAng: -8, head: 4, lean: 2 }, 'io'],
      [0.72, { stretch: 0.15, x: 0.18, stalkA: 4 }, 'io'],
      [1.05, {}],
    ],
    spark: [0.13],
    sparkAt: 'head',
    trail: [0, 0.8],
  },
  bonk: {
    anticT: 0.32,
    keys: [
      [0, { lean: -24, nAng: 18, head: -12, stalkA: 16, x: -0.04, stretch: -0.3 }],
      [0.11, { lean: 58, nAng: -26, head: 22, stalkA: -4, stalk: 0.45, x: 0.08, stretch: 0.25 }, 'in'],
      [0.19, { lean: 50, nAng: -22, head: 18, stalk: 0.45, x: 0.08, stretch: 0.25 }, 'out'],
      [0.5, { lean: 6, x: 0.02, stalk: 0.9 }, 'io'],
      [0.8, {}],
    ],
    spark: [0.11],
    sparkAt: 'shellfront',
    dust: [[0.11, 'front']],
  },
  headbutt: {
    anticT: 0.3,
    keys: [
      [0, { neck: -0.75, nAng: 8, head: -8, crouch: 0.55, pitch: -3, x: -0.03 }],
      [0.08, { neck: 1.35, nAng: -6, head: 10, crouch: 0.1, pitch: 4, x: 0.09 }, 'out'],
      [0.18, { neck: 1.2, nAng: -3, head: 5, pitch: 3, x: 0.08 }, 'io'],
      [0.46, { neck: 0.2, x: 0.02 }, 'io'],
      [0.72, {}],
    ],
    spark: [0.08],
    sparkAt: 'head',
    dust: [[0.08, 'fore']],
  },
  bash: {
    anticT: 0.32,
    keys: [
      [0, { x: -0.06, crouch: 0.85, pitch: -7, neck: -0.5, head: -4, tail: -1 }],
      [0.11, { x: 0.22, hop: 0.13, crouch: 0, pitch: 13, neck: -0.7, hide: 0.4, free: 0.55 }, 'out'],
      [0.22, { x: 0.25, hop: 0, pitch: 4, hide: 0.4, free: 0, crouch: 0.45 }, 'in'],
      [0.52, { x: 0.1, pitch: 0, hide: 0.08, crouch: 0.1 }, 'io'],
      [0.84, {}],
    ],
    spark: [0.13],
    sparkAt: 'front',
    dust: [[0.22, 'feet']],
  },
  snap: {
    anticT: 0.26,
    keys: [
      [0, { neck: -0.55, nAng: 10, head: -12, jaw: 0.3, pitch: -3 }],
      [0.07, { neck: 1.6, nAng: -6, head: 6, jaw: 1, x: 0.06, pitch: 3 }, 'out'],
      [0.13, { neck: 1.45, nAng: -4, head: 4, jaw: 0, x: 0.06, pitch: 2 }, 'out'],
      [0.4, { neck: 0.3, jaw: 0.05 }, 'io'],
      [0.64, {}],
    ],
    spark: [0.13],
    sparkAt: 'mouth',
  },
  slap: {
    anticT: 0.34,
    keys: [
      [0, { flipN: 1, pitch: -6, x: -0.03, neck: -0.2, nAng: 8, head: -6 }],
      [0.09, { flipN: -1, pitch: 5, x: 0.05, neck: 0.35, nAng: -4, head: 6 }, 'in'],
      [0.16, { flipN: -0.85, pitch: 3, x: 0.05, neck: 0.3 }, 'out'],
      [0.5, { flipN: 0, pitch: 0, x: 0.02 }, 'io'],
      [0.78, {}],
    ],
    spark: [0.09],
    sparkAt: 'flipper',
    dust: [[0.09, 'flipper']],
  },
  jump: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.9, pitch: 2, neck: -0.3, stalkA: 10, stretch: -0.35 }],
      [0.14, { hop: 0.42, crouch: 0, pitch: -6, free: 0.7, neck: 0.2, stalkA: 28, tail: 1, stretch: 0.12 }, 'out'],
      [0.3, { hop: 0.46, pitch: 2, free: 0.8, stalkA: 8 }, 'out'],
      [0.46, { hop: 0, pitch: 4, free: 0, crouch: 0.1, stalkA: -14 }, 'in'],
      [0.54, { crouch: 0.75, pitch: 2, stalkA: -8, neck: -0.2, stretch: -0.2 }, 'out'],
      [0.86, {}],
    ],
    dust: [[0, 'feet'], [0.46, 'feet']],
  },
  dash: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.5, x: -0.02, pitch: -2, neck: -0.2, stretch: -0.3 }],
      [0.1, { x: 0.32, hop: 0.06, pitch: 6, free: 0.6, neck: 0.5, nAng: -6, stretch: 0.7, stalkA: 30, hide: 0.15 }, 'out'],
      [0.32, { x: 0.36, hop: 0, pitch: 2, free: 0, neck: 0.3, stretch: 0.3, stalkA: 14 }, 'io'],
      [0.66, {}],
    ],
    lines: [0.02, 0.34],
    dust: [[0.04, 'feet']],
    trail: [0, 0.5],
  },
  dodge: {
    anticT: 0.08,
    keys: [
      [0, { crouch: 0.4 }],
      [0.1, { x: -0.26, hop: 0.16, hide: 0.65, pitch: -8, free: 0.6, stalk: 0.2, stalkA: 20 }, 'out'],
      [0.26, { x: -0.3, hop: 0, hide: 0.55, pitch: 2, free: 0, stalk: 0.2, crouch: 0.3 }, 'in'],
      [0.5, { x: -0.22, hide: 0.2, stalk: 0.7 }, 'io'],
      [0.76, {}],
    ],
    dust: [[0.26, 'feet']],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -0.05, hide: 0.55, pitch: -5, nAng: 10, head: -12, stalk: 0.1, stalkA: 22, jaw: 0.3, tail: -1 }, 'out'],
      [0.22, { x: -0.05, hide: 0.45, pitch: -3, nAng: 6, head: -6, stalk: 0.15, stalkA: 14 }],
      [0.6, {}],
    ],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.12, { x: -0.1, hop: 0.22, roll: 70, hide: 0.3, nAng: 10, stalk: 0.3 }, 'out'],
      [0.34, { x: -0.16, hop: 0, roll: 180, hide: 0.1, nAng: -16, head: 10, stalk: 0.5, droop: 1 }, 'in'],
      [0.44, { x: -0.16, roll: 166, nAng: -10, stalk: 0.5, droop: 1 }, 'out'],
      [0.64, { x: -0.16, roll: 192, nAng: 4, stalk: 0.6, droop: 1, jaw: 0.3 }, 'io'],
      [0.84, { x: -0.16, roll: 170, nAng: -8, stalk: 0.6, droop: 1, jaw: 0 }, 'io'],
      [1.04, { x: -0.16, roll: 188, nAng: 2, stalk: 0.6, droop: 1 }, 'io'],
      [1.22, { x: -0.15, roll: 176, nAng: -4, stalk: 0.6, droop: 1 }, 'io'],
      [1.42, { x: -0.1, hop: 0.24, roll: 40, hide: 0.3, stalk: 0.3 }, 'out'],
      [1.56, { x: -0.06, hop: 0, roll: 0, crouch: 0.6, hide: 0.1 }, 'in'],
      [1.9, {}],
    ],
    dust: [[0.34, 'body'], [1.56, 'feet']],
  },
  hide: {
    anticT: 0.1,
    keys: [
      [0, { crouch: 0.3, nAng: 6 }],
      [0.22, { hide: 1, stalk: 0 }, 'io'],
      [1.1, { hide: 1, stalk: 0 }],
      [1.55, { hide: 1, peek: 0.6, stalk: 0.25 }, 'io'],
      [1.95, { hide: 1, peek: 0.55, stalk: 0.35, nAng: 4 }, 'io'],
      [2.08, { hide: 1, peek: 0, stalk: 0 }, 'out'],
      [2.6, { hide: 1, peek: 0, stalk: 0 }],
      [3.1, { hide: 0.75, peek: 0.6, stalk: 0.5 }, 'io'],
      [3.7, {}, 'io'],
    ],
  },
  // Pleased: a long stretch of the neck up and out, a big yawn, and back.
  stretch: {
    anticT: 0.2,
    keys: [
      [0, { crouch: 0.25 }],
      [0.42, { neck: 1.2, nAng: 26, head: -14, lift: 1, jaw: 0.65, stalkA: -10, stretch: 0.3 }, 'io'],
      [0.92, { neck: 1.2, nAng: 28, head: -16, lift: 1, jaw: 0.55, stretch: 0.3 }],
      [1.26, { neck: 0, jaw: 0 }, 'io'],
      [1.52, {}],
    ],
  },
};
export const SHELL_SHOW = ['spin', 'glide', 'bonk', 'headbutt', 'bash', 'slap', 'snap', 'jump', 'dash', 'dodge', 'hurt', 'knockdown', 'hide', 'stretch'];
const CH = ['x', 'hop', 'lift', 'pitch', 'crouch', 'roll', 'hide', 'peek', 'down', 'splay', 'free', 'neck', 'nAng', 'head', 'jaw', 'stalk', 'stalkA', 'droop', 'stretch', 'lean', 'flipN', 'tail'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: sstep };
// A move's pose at `t` seconds in (before 0: easing into its first key by `antic`).
function moveAt(mv, t, antic, base) {
  const keys = mv.keys.map(([kt, p, ease]) => [kt, { ...base, ...p }, ease]);
  const out = {};
  if (t < 0) {
    const w = sstep(antic);
    for (const c of Object.keys(base)) out[c] = lerp(base[c], keys[0][1][c], w);
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, ease] = keys[i + 1];
  const u = (EASE[ease] ?? sstep)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  for (const c of Object.keys(p0)) out[c] = lerp(p0[c], p1[c], u);
  return out;
}
const turnsAt = (mv, t) => (mv?.spin ?? []).reduce((s, [a, b, n]) => s + n * sstep((t - a) / (b - a)), 0);
const after = (at, t, len) => {
  let best = -1;
  for (const m of at ?? []) if (t >= m && t <= m + len) best = (t - m) / len;
  return best;
};
const BLANK = () => sprite('rig|shellblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// A planted foot at phase u (+ ph): flat on the ground for `duty` of the stride, sliding back as
// the body goes over; then lifted and swung forward, eased out and in.
function footStep(u, ph, duty, reach, lift) {
  const q = frac(u + ph);
  if (q < duty) {
    const s = q / duty;
    return { dx: reach - 2 * reach * s, lift: 0, s, v: -1 };
  }
  const v = (q - duty) / (1 - duty);
  return { dx: -reach + 2 * reach * sstep(v), lift: lift * Math.sin(Math.PI * v) ** 0.85, s: -1, v };
}

// ---------- One rig for a preset ----------
function shellRig(kind) {
  const P = SHELL_PRESETS[kind];
  const T = P.type;
  const snail = T === 'snail';
  // The shell's outline, worked out once (a snail's: a round coil, fuller at its mouth).
  const SR = snail ? P.shell.r : 0;
  const shellRing = snail
    ? Array.from({ length: 48 }, (_, i) => {
      const q = (i / 48) * TAU;
      const r = SR * (1 + 0.075 * Math.exp(-(((Math.atan2(Math.sin(q - 0.72), Math.cos(q - 0.72))) / 0.5) ** 2)));
      return [Math.cos(q) * r, Math.sin(q) * r];
    })
    : loopThrough(P.shell.ring, 5);
  const shellLow = Math.max(...shellRing.map((p) => p[1]));
  const shellTop = -Math.min(...shellRing.map((p) => p[1]));
  const xsR = shellRing.map((p) => p[0]);
  const shellFront = Math.max(...xsR);
  const rimCurve = snail ? null : (() => {
    const r = P.shell.rim;
    const out = [];
    for (let i = 0; i < r.length - 1; i++) {
      const a = r[Math.max(0, i - 1)];
      const b = r[i];
      const c = r[i + 1];
      const d = r[Math.min(r.length - 1, i + 2)];
      for (let j = 0; j < 6; j++) {
        const t = j / 6;
        const t2 = t * t;
        const t3 = t2 * t;
        const f = (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3);
        out.push([f(0), f(1)]);
      }
    }
    out.push(r[r.length - 1]);
    return out;
  })();
  // (the shell's lower band, below the rim guide: what a near front flipper tucks in under)
  const bandPoly = snail ? null : (() => {
    const rimY = (x) => {
      let best = rimCurve[0];
      for (const p of rimCurve) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
      return best[1];
    };
    const low = shellRing.filter((p) => p[1] > rimY(p[0]) + 0.05).sort((p, q) => p[0] - q[0]);
    return [...rimCurve, ...low];
  })();
  // Its size: how tall it stands (the unit its moves are measured in), how long it is.
  const H = snail ? -(P.shell.c[1] - SR) : -(P.shell.standY) + shellTop;
  const length = snail ? P.foot.front - P.foot.back : Math.max(...xsR) - Math.min(...xsR) + P.neck.ext + P.head.skull[2] + 2;
  const cycle = snail ? P.ripple : P.gait.cycle;
  const reach = snail ? 0 : (P.gait.duty * cycle) / 2;

  // ---------- The skeleton: every bone's place this frame ----------
  function skeleton(S, a) {
    const st = a.mo.rig;
    const t = a.shT ?? a.t ?? 0;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const w = a.walkW ?? 0;
    const u = st.shU ?? 0;
    const hide = clamp(S.hide, 0, 1);
    const peek = clamp(S.peek, 0, 1) * hide;
    const crouch = clamp(S.crouch, -0.3, 1.2);
    const sk = snail ? snailBones(S, a, st, t, dt, w, hide, peek, crouch) : shellBones(S, a, st, t, dt, w, u, hide, peek, crouch);
    // Turned over (knocked onto its back) or spinning: the whole of it turned about the shell's
    // middle, resting on whatever of the shell is lowest; never sunk into the ground.
    // (a sea turtle spins flat on its belly like a top: shown by turning it about, front to back,
    // each half turn, a light sweeping round the shell; the others roll round on edge)
    const top = T === 'seaturtle';
    const spun = a.shSpin ?? 0;
    const spinA = top ? 0 : spun * TAU;
    const rollA = -S.roll * P.rollK * D2R + spinA;
    const c = sk.sc;
    let low = -1e9;
    for (const p of sk.shellPts) low = Math.max(low, c[1] + turn(sub(p, c), rollA)[1]);
    const rollW = Math.max(sstep(Math.abs(S.roll) / 70), a.shSpinning ? 1 : 0);
    const want = lerp(Math.max(0, low), low, rollW);
    const shift = follow(st, 'shShift', want, 900, 60, dt);
    sk.rollA = rollA;
    sk.lift = shift + S.hop;
    sk.top = top ? (a.shSpinning ?? 0) : 0;
    sk.mirror = sk.top > 0.5 && Math.floor(frac(spun) * 2) === 1;
    sk.sweep = frac(spun * 2);
    sk.X = (p) => {
      const q = sk.mirror ? [2 * c[0] - p[0], p[1]] : p;
      return add(c, turn(sub(q, c), rollA)).map((v, i) => (i ? v - sk.lift : v));
    };
    sk.t = t;
    return sk;
  }
  // (draws in the skeleton's upright frame: the turn over and the hop applied)
  const upright = (ctx, sk) => {
    const c = sk.sc;
    ctx.translate(c[0], c[1] - sk.lift);
    ctx.rotate(sk.rollA);
    if (sk.mirror) ctx.scale(-1, 1);
    ctx.translate(-c[0], -c[1]);
  };

  // A snail: the shell riding on its back, the foot along the ground, the neck rising to the head.
  function snailBones(S, a, st, t, dt, w, hide, peek, crouch) {
    const R = SR;
    const s = clamp(S.stretch, -0.6, 1.3);
    const sp = Math.max(0, s);
    const sn = Math.max(0, -s);
    const X0 = S.x;
    // (the ripples: their phase from how far the foot has glided, walking or charging)
    const rip = st.shRip ?? 0;
    const rw = clamp(a.shRipW ?? 0, 0, 1);
    // The shell, sat on the back; tipping about its seat (`lean`, and a little with the waves).
    const sway = Math.sin(rip * TAU * 0.5) * 1.1 * rw;
    const leanA = (S.lean + S.pitch * 0.5 + sway) * D2R;
    const seatY = lerp(P.shell.c[1] + crouch * 1.3 - S.lift * 0.6 + sn * 0.5, -shellLow, hide);
    const seat = [P.shell.c[0] + X0 - 1.1 * sn + 0.8 * sp, seatY + R * 0.8];
    const sc = add(seat, turn([0, -R * 0.8], leanA));
    const shA = leanA;
    const shellPts = shellRing.filter((_, i) => i % 2 === 0).map((p) => add(sc, turn(p, shA)));
    // The foot: longer and a touch thinner reaching out, shorter and fuller bunched; drawn in under
    // the shell when it hides.
    let xf = P.foot.front + X0 + 6.2 * sp - 2.6 * sn;
    let xb = P.foot.back + X0 + 1.2 * sp + 0.6 * sn;
    let fh = P.foot.h * (1 - 0.14 * sp + 0.12 * sn) - crouch * 0.4;
    xf = lerp(xf, sc[0] + 2.2, hide);
    xb = lerp(xb, sc[0] - 3.4, hide);
    fh = lerp(fh, 1.5, hide);
    // The neck's base on the foot, and the head: raised or lowered about the base, reaching out.
    let nb = [P.neck.base[0] + X0 + 4.6 * sp - 1.8 * sn, -fh * 0.8];
    let hc = add(P.head.c, [X0 + 6.6 * sp - 3 * sn + 3.2 * S.neck, 3.6 * sp + 0.6 * sn - 1.5 * S.neck + crouch * 1.7 - S.lift * 0.5]);
    hc = add(nb, turn(sub(hc, nb), -S.nAng * D2R));
    // (hidden: drawn into the shell's mouth; peeking: eased just out of it)
    const inC = add(sc, [2.6, 2.4]);
    const peekC = add(sc, [R * 0.96 + 1.4, 1.2]);
    hc = mix(hc, mix(inC, peekC, peek), hide);
    nb = mix(nb, add(sc, [1.6, R * 0.5]), hide);
    // (the head lags the body a touch and settles: a spring on where it's carried)
    const wx = (a.flip ? -1 : 1) * (a.shM?.x ?? 0);
    const lagX = clamp(follow(st, 'shLagX', wx + hc[0], 150, 17, dt) - (wx + hc[0]), -1.4, 1.4);
    const lagY = clamp(follow(st, 'shLagY', hc[1], 170, 15, dt) - hc[1], -1.4, 1.4);
    hc = add(hc, [lagX * (1 - hide), lagY * (1 - hide)]);
    const ha = (P.head.tilt + S.head - S.nAng * 0.35 + lagY * 4) * D2R;
    // The neck: a soft curve up from its base into the head, a little thinner the further it reaches.
    const nL = dist(nb, hc);
    const c1 = add(nb, mul(unit(-72 * D2R), nL * 0.42));
    const c2 = add(hc, mul(unit(102 * D2R + ha), nL * 0.34));
    const thin = clamp(Math.sqrt(11 / Math.max(4, nL)), 0.86, 1.08);
    const spine = Array.from({ length: 8 }, (_, i) => bez3(nb, c1, c2, hc, (i / 7) * 0.84));
    const side = spine.map((p, i) => {
      const d = sub(spine[Math.min(7, i + 1)], spine[Math.max(0, i - 1)]);
      const l = Math.hypot(d[0], d[1]) || 1;
      const ww = lerp(P.neck.w[0], P.neck.w[1], i / 7) * thin * 0.5;
      return [add(p, [(d[1] / l) * ww, (-d[0] / l) * ww]), add(p, [(-d[1] / l) * ww, (d[0] / l) * ww])];
    });
    // The foot's underside: the ripples lift it a hair where each passes.
    const lam = P.ripple;
    const ph = frac(rip);
    const crest = (x) => {
      let c = 0;
      for (let n = -1; n < 9; n++) {
        const xn = xb + lam * (n + ph);
        c += Math.exp(-(((x - xn) / (lam * 0.2)) ** 2));
      }
      return c;
    };
    const sole = [];
    for (let x = xf - 2.4; x > xb + 2.2; x -= 1.4) {
      const k = sstep((x - xb - 2) / 4) * sstep((xf - 2 - x) / 4);
      sole.push([x, -0.3 * rw * k * crest(x)]);
    }
    const ring = [
      [xf, -fh * 0.34],
      [xf - 1.1, -0.06],
      ...sole,
      [xb + 1, -0.32],
      [xb, -fh * 0.3],
      [xb + 2.4, -fh * 0.64],
      [lerp(xb, sc[0], 0.55), -fh * 0.96],
      [sc[0] - 1, -fh - 1.2],
      ...side.map((p) => p[0]),
      ...side.slice().reverse().map((p) => p[1]),
      [lerp(nb[0], xf, 0.62), -fh * 0.72],
    ];
    const body = loopThrough(ring, 3);
    // The stalks: roots on the head, tips on springs (trailing the head, overshooting, settling),
    // each wandering on its own, now and then drawn in for a moment; telescoped into the head as it
    // hides.
    const stalks = {};
    for (const [i, K] of P.stalks.entries()) {
      const blk = Math.floor(t / 3.3 + i * 0.37);
      const rnd = (n) => frac(Math.sin(n * 12.9898 + i * 41.7 + (a.shM?.uid ?? 0) * 7.1) * 43758.5453);
      const roam = lerp(rnd(blk - 1), rnd(blk), sstep(frac(t / 3.3 + i * 0.37) / 0.3)) * 2 - 1;
      const wander = (roam * 14 + Math.sin(t * 1.3 + i * 2.1) * 4) * (K.up ? 1 : 0.5) * (1 - hide);
      const twitch = K.up ? hold(frac(t / (6.9 + i * 1.3)) * (6.9 + i * 1.3), 3, 3.12, 3.35, 3.8) * 0.6 : 0;
      const lean = K.up ? -S.stalkA : S.stalkA * 0.4;
      const droop = clamp(S.droop, 0, 1) * (K.up ? 62 : 20);
      const ang = ha + (K.ang + lean + wander + droop) * D2R;
      const ext = clamp(S.stalk, 0, 1) * (1 - twitch) * (1 - hide * (1 - peek * 0.7));
      const root = add(hc, turn(K.root, ha));
      const L = K.len * ext;
      const goal = add(root, mul(unit(ang + droop * 0.4 * D2R), L));
      let tip = followPt(st, `shStalk${i}`, goal, 230, 15, dt);
      const d = sub(tip, root);
      const dl = Math.hypot(d[0], d[1]) || 1;
      tip = add(root, mul(d, L / dl));
      stalks[K.id] = { root, ang, tip, L, ext, K };
    }
    const mouth = add(hc, turn([P.head.rx * 0.78, P.head.ry * 0.5], ha));
    return { sc, shA, shellPts, body, nb, hc, ha, stalks, xf, xb, fh, mouth, rip: ph, rw, front: add(hc, turn([P.head.rx, 0], ha)), jaw: clamp(S.jaw, 0, 1) };
  }

  const toward = (a, b, k) => a + (((((b - a) % 360) + 540) % 360) - 180) * k;
  // A tortoise or a sea turtle: the shell on four limbs, the neck sliding out of its front.
  function shellBones(S, a, st, t, dt, w, u, hide, peek, crouch) {
    const down = clamp(S.down, 0, 1);
    const splay = clamp(S.splay, 0, 1);
    const turtle = T === 'seaturtle';
    const G = P.gait;
    // The walk's sway: a plodder dips a little as each pair lifts, the dome rocking; a sea turtle
    // rises and surges on each stroke and settles between.
    const steps = {};
    let dip = 0;
    for (const k of Object.keys(P.legs)) {
      const g = footStep(u, G.phase[k], G.duty, reach, G.lift);
      steps[k] = g;
      if (g.v >= 0) dip += Math.sin(Math.PI * g.v);
    }
    let bob = 0;
    let rock = 0;
    let surge = 0;
    const free = Math.max(clamp(S.free, 0, 1), sstep((Math.abs(S.roll) - 20) / 50));
    const paddle = sstep((Math.abs(S.roll) - 100) / 50);
    if (turtle) {
      // (the stroke: the body surging forward while the flippers drive back, a little nose-up rock)
      const q = frac(u);
      const D0 = G.duty;
      surge = G.surge * ((q < D0 ? sstep(q / D0) : 1 - sstep((q - D0) / (1 - D0))) - 0.5) * w;
      rock = (q < D0 ? -2 * Math.sin((Math.PI * q) / D0) : 0.6 * Math.sin((Math.PI * (q - D0)) / (1 - D0))) * w;
      bob = (q < D0 ? 1.4 * Math.sin((Math.PI * q) / D0) ** 0.8 : 0) * w;
    } else {
      bob = -0.3 * dip * w;
      rock = 1.1 * Math.sin(TAU * u + 0.4) * w;
      surge = 0.22 * Math.sin(2 * TAU * u) * w;
    }
    const lowered = Math.max(hide, down);
    let py = lerp(P.shell.standY, -shellLow, lowered) + crouch * P.crouchDrop * (1 - lowered) - S.lift - bob * (1 - lowered);
    const ang = (S.pitch + rock) * D2R;
    // (never sunk into the ground, however it tips)
    let deep = -1e9;
    for (const p of shellRing) deep = Math.max(deep, py + turn(p, ang)[1]);
    if (deep > 0) py -= deep;
    const sc = [S.x + surge, py];
    const B = (p) => add(sc, turn(p, ang));
    const shellPts = shellRing.filter((_, i) => i % 2 === 0).map(B);
    // The limbs.
    const legs = {};
    for (const [k, L] of Object.entries(P.legs)) {
      const fore = k.startsWith('fore');
      const far = k.endsWith('F');
      const g = steps[k];
      const pd = paddle * Math.sin(t * 9.5 + (fore ? 0 : 1.7) + (far ? 2.4 : 0));
      if (!turtle) {
        // a stubby column: hip (inside the shell), knee, ankle; the pad flat on the ground
        const Lg = P.leg;
        const hipL = add(L.hip, mul([fore ? -1.4 : 1.4, -3.6], hide));
        const root = B(hipL);
        const ankY = -Lg.foot[1];
        let A = [L.hip[0] + L.fx + g.dx * w + S.x * 0.35, ankY - g.lift * w];
        let fa = (g.v >= 0 ? -0.24 * Math.sin(Math.PI * g.v) : 0) * w;
        A = mix(A, [sc[0] + L.hip[0] + (fore ? 4.4 : -4.2), ankY + 0.35], splay);
        fa = lerp(fa, fore ? -0.12 : 0.12, splay);
        A = mix(A, B(add(hipL, turn([fore ? 1.3 : -1.2, 6.2], pd * 0.42))), free);
        fa = lerp(fa, ang + pd * 0.3, free);
        A = mix(A, B(add(hipL, [fore ? 0.5 : -0.5, 2.4])), hide);
        fa = lerp(fa, ang, hide);
        const { J, F } = reach2(root, A, Lg.l1, Lg.l2, fore ? 1 : -1);
        legs[k] = { fore, far, root, J, F, fa, w: fore ? Lg.wF : Lg.wH };
      } else {
        // a flipper: shoulder (under the shell's lower edge), wrist, tip
        const Fl = P.flip;
        const root = B(L.hip);
        const pd = paddle * Math.sin(t * 9.5 + (fore ? 0 : 1.7) + (far ? 2.4 : 0));
        const toDeg = (r) => (r * 180) / Math.PI;
        if (fore) {
          // (planted: worked back from the tip on the ground, so it never slides; the arm held up)
          const planted = (tx) => {
            const r = reach2(root, [tx, -0.3], Fl.arm, Fl.blade, -1);
            return [toDeg(Math.atan2(r.J[1] - root[1], r.J[0] - root[0])), toDeg(Math.atan2(r.F[1] - r.J[1], r.F[0] - r.J[0]))];
          };
          const home = L.hip[0] + Fl.ahead;
          const rest = planted(sc[0] + home);
          let [al, be] = rest;
          if (w > 0.001) {
            // (rowing: the tip planted ahead, the body hauled over it; then lifted just off the
            // ground and slid forward low and close, the tip trailing a little, to plant again)
            const g = footStep(u, G.phase[k], G.duty, reach, 1.8);
            const pr = reach2(root, [home + g.dx + S.x * 0.35, -0.3 - g.lift], Fl.arm, Fl.blade, -1);
            const trail = g.v >= 0 ? 14 * Math.sin(Math.PI * g.v) : 0;
            const g2 = [toDeg(Math.atan2(pr.J[1] - root[1], pr.J[0] - root[0])), toDeg(Math.atan2(pr.F[1] - pr.J[1], pr.F[0] - pr.J[0])) + trail];
            al = toward(al, g2[0], w);
            be = toward(be, g2[1], w);
          }
          if (!far) {
            const up = sstep(clamp(S.flipN, 0, 1));
            const dn = sstep(clamp(-S.flipN, 0, 1));
            al = toward(al, -70, up);
            be = toward(be, -96, up);
            const slam = planted(sc[0] + home + 3.4);
            al = toward(al, slam[0], dn);
            be = toward(be, slam[1], dn);
          }
          al = toward(al, 40, splay);
          be = toward(be, 14, splay);
          al = toward(al, 86 + pd * 26, free);
          be = toward(be, 112 + pd * 36, free);
          al = toward(al, 150, hide);
          be = toward(be, 182, hide);
          const J = add(root, mul(unit(al * D2R + ang), Fl.arm));
          let bA = be * D2R + ang;
          // (never through the ground: the blade swung up to lie on it instead)
          const lim = -0.3 - J[1];
          if (Math.sin(bA) * Fl.blade > lim) {
            const s0 = Math.asin(clamp(lim / Fl.blade, -1, 1));
            bA = Math.cos(bA) >= 0 ? s0 : Math.PI - s0;
          }
          const F = add(J, mul(unit(bA), Fl.blade));
          legs[k] = { fore, far, root, J, F, be: bA, flipper: true };
        } else {
          let gaD = 150 + 24 * Math.sin(TAU * frac(u + G.phase[k])) * w;
          gaD = toward(gaD, 172, splay);
          gaD = toward(gaD, 118 + pd * 30, free);
          gaD = toward(gaD, 176, hide);
          let ga = gaD * D2R + ang;
          // (never through the ground: swung up level instead)
          const len = Fl.hind;
          const lim = -0.3 - root[1];
          if (Math.sin(ga) * len > lim) ga = Math.PI - Math.asin(clamp(lim / len, -1, 1));
          legs[k] = { fore, far, root, J: root, F: add(root, mul(unit(ga), len)), be: ga, flipper: true };
        }
      }
    }
    // The neck: from deep in the shell out through its front, the head on its end; drawn in as it
    // hides, eased cautiously back out to peek.
    const N = P.neck;
    const R0 = B(N.root);
    const O = B(N.open);
    const L0 = dist(R0, O);
    let ext = N.ext * (1 + 0.6 * clamp(S.neck, -1.2, 1.6));
    ext = lerp(ext, lerp(N.inExt, N.peekExt, peek / Math.max(1e-3, hide)), hide);
    const aRO = Math.atan2(O[1] - R0[1], O[0] - R0[0]);
    const aOut = ang + (N.ang - S.nAng) * D2R;
    const total = Math.max(0.5, L0 + ext);
    const spine = [R0];
    let p = R0;
    const ds = total / 14;
    for (let i = 1; i <= 14; i++) {
      const s = i * ds;
      const an = lerp(aRO, aOut, sstep((s - (L0 - 1.8)) / 3.6));
      p = add(p, mul(unit(an), ds));
      spine.push(p);
    }
    let hp = spine[spine.length - 1];
    // (the head lags the body a touch, and settles)
    const wx = (a.flip ? -1 : 1) * (a.shM?.x ?? 0);
    const lagX = clamp(follow(st, 'shLagX', wx + hp[0], 150, 17, dt) - (wx + hp[0]), -1.2, 1.2);
    const lagY = clamp(follow(st, 'shLagY', hp[1], 170, 15, dt) - hp[1], -1.2, 1.2);
    const out = sstep((L0 + ext) / 4);
    hp = add(hp, mul([lagX, lagY], out));
    spine[spine.length - 1] = hp;
    const ha = ang * 0.5 + (P.head.tilt + S.head - S.nAng * 0.45 + lagY * 5) * D2R;
    const mouth = add(hp, turn([P.head.snout[0] + P.head.snout[2] * 0.7, P.head.snout[1] + P.head.snout[3] * 0.55], ha));
    const front = add(hp, turn([P.head.snout[0] + P.head.snout[2], P.head.snout[1]], ha));
    // The tail: a little cone from under the back of the shell, its tip on a spring.
    let tail = null;
    if (P.tail) {
      const Tl = P.tail;
      const root = B(add(Tl.root, mul([2.6, -1.4], hide)));
      const flick = (a.shTail ?? 0) + clamp(S.tail, -1, 1) * 0.6;
      const goal = add(root, mul(unit(ang + (Tl.ang - flick * 26) * D2R), Tl.len * (1 - 0.3 * hide)));
      const tip = followPt(st, 'shTail', goal, 200, 11, dt);
      tail = { root, tip, mid: add(mix(root, tip, 0.5), mul(unit(ang + Math.PI / 2), 0.5)) };
    }
    return { sc, ang, B, shellPts, legs, spine, hp, ha, mouth, front, tail, jaw: clamp(S.jaw, 0, 1), O };
  }

  // ---------- Drawing ----------
  const tone = (a, c) => {
    const k = Math.min(0.85, (a.flash ?? 0) * 6);
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
  const line = (ctx) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const soft = (ctx, a, [x, y], r, al, col) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, toneA(a, col, al));
    g.addColorStop(1, toneA(a, col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const guide = (ctx, a, col = C.guide, wd = 0.45) => {
    ctx.strokeStyle = tone(a, col);
    ctx.lineWidth = wd;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // The shell: its plain shape, lit from the top left whichever way it's turned; the soft rim band
  // below the guide, a soft spiral on a snail's coil.
  function drawShell(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    upright(ctx, sk);
    const an = snail ? sk.shA : sk.ang;
    ctx.translate(...sk.sc);
    ctx.rotate(an);
    ctx.beginPath();
    addShape(ctx, shellRing);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    addShape(ctx, shellRing);
    ctx.clip();
    const back = -(an + sk.rollA);
    const W = (v) => turn(v, back);
    const big = snail ? SR : shellTop;
    if (snail) {
      // a soft shade round the coil's lower edge, the light on its upper left
      const cG = W([-0.18 * SR, -0.26 * SR]);
      const g = ctx.createRadialGradient(cG[0], cG[1], SR * 0.5, cG[0], cG[1], SR * 1.25);
      g.addColorStop(0, toneA(a, C.sh, 0));
      g.addColorStop(1, toneA(a, C.sh, 0.85));
      ctx.fillStyle = g;
      ctx.fillRect(-SR * 2, -SR * 2, SR * 4, SR * 4);
      soft(ctx, a, W([-0.34 * SR, -0.42 * SR]), SR * 0.78, 0.95, C.lt);
      // the spiral where the whorls meet, from the middle out to the lip
      guide(ctx, a, C.deep, 0.62);
      ctx.globalAlpha *= 0.8;
      ctx.beginPath();
      const n = 70;
      const th0 = 0.62 - P.shell.turns * TAU;
      for (let i = 0; i <= n; i++) {
        const s = i / n;
        const th = th0 + P.shell.turns * TAU * s;
        const r = SR * (0.08 + 0.74 * s ** 1.15);
        const q = [Math.cos(th) * r, Math.sin(th) * r];
        if (i) ctx.lineTo(...q);
        else ctx.moveTo(...q);
      }
      ctx.stroke();
      // the lip of its mouth: a soft curve low on the front
      ctx.beginPath();
      ctx.arc(SR * 0.52, SR * 0.5, SR * 0.46, -0.55, 1.15);
      ctx.stroke();
      ctx.globalAlpha /= 0.8;
    } else {
      // the band below the rim guide a shade darker, soft; the dome lit high on its left
      ctx.beginPath();
      rimCurve.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.lineTo(-30, 12);
      ctx.lineTo(30, 12);
      ctx.closePath();
      ctx.fillStyle = toneA(a, C.sh, 0.5);
      ctx.fill();
      const cG = W([0, -shellTop * 0.15]);
      const g = ctx.createRadialGradient(cG[0], cG[1], big * 0.6, cG[0], cG[1], big * 1.6);
      g.addColorStop(0, toneA(a, C.sh, 0));
      g.addColorStop(1, toneA(a, C.sh, 0.7));
      ctx.fillStyle = g;
      ctx.fillRect(-40, -40, 80, 80);
      soft(ctx, a, W([-big * 0.35, -big * 0.55]), big * 0.95, 0.95, C.lt);
      if (sk.top > 0) {
        ctx.save();
        ctx.translate(lerp(-16, 13, sk.sweep), -1);
        ctx.scale(0.55, 1);
        soft(ctx, a, [0, 0], 9, 0.9 * sk.top, '#ffffff');
        ctx.restore();
      }
      guide(ctx, a, C.deep, 0.62);
      ctx.globalAlpha *= 0.75;
      ctx.beginPath();
      rimCurve.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.stroke();
      ctx.globalAlpha /= 0.75;
    }
    ctx.restore();
    ctx.restore();
  }

  // A snail's body: the foot, the neck and the head, one soft shape; the back lit, the sole shaded,
  // soft bands where each ripple passes, a shade where it goes into the shell; the head's guides.
  function drawSnailBody(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    upright(ctx, sk);
    const Hd = P.head;
    const path = () => {
      ctx.beginPath();
      addShape(ctx, sk.body);
      addOval(ctx, sk.hc, Hd.rx, Hd.ry, sk.ha);
    };
    // (a faint shine left on the ground behind as it glides)
    if (mode !== 'line') {
      if (a.shTrail > 0.01) {
        ctx.save();
        const g = ctx.createLinearGradient(sk.xb - 16, 0, sk.xb + 2, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, `rgba(255,255,255,${0.42 * a.shTrail})`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 0.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sk.xb - 16, -0.3);
        ctx.lineTo(sk.xb + 2, -0.3);
        ctx.stroke();
        ctx.restore();
      }
    }
    path();
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    path();
    ctx.clip('nonzero');
    // the sole's shade, and the ripple bands travelling along it
    const sg = ctx.createLinearGradient(0, -sk.fh * 0.6, 0, 0.2);
    sg.addColorStop(0, toneA(a, C.sh, 0));
    sg.addColorStop(1, toneA(a, C.sh, 0.75));
    ctx.fillStyle = sg;
    ctx.fillRect(sk.xb - 2, -sk.fh * 0.6, sk.xf - sk.xb + 4, sk.fh * 0.6 + 1);
    if (sk.rw > 0.02) {
      const lam = P.ripple;
      for (let n = -1; n < 9; n++) {
        const x = sk.xb + lam * (n + sk.rip);
        const k = sstep((x - sk.xb - 2) / 4) * sstep((sk.xf - 2 - x) / 4) * sk.rw;
        if (k <= 0.01) continue;
        ctx.save();
        ctx.translate(x, -sk.fh * 0.22);
        ctx.scale(1, 2.4);
        soft(ctx, a, [0, 0], lam * 0.28, 0.5 * k, C.deep);
        ctx.restore();
        soft(ctx, a, [x - lam * 0.42, -sk.fh * 0.3], lam * 0.26, 0.45 * k, C.lt);
      }
    }
    // the back lit along the top, the head lit high, a soft shade under the chin and where the body
    // goes into the shell
    soft(ctx, a, [lerp(sk.xb, sk.xf, 0.2), -sk.fh * 0.95], 5.5, 0.6, C.lt);
    soft(ctx, a, [sk.xf - 3, -sk.fh * 0.95], 4, 0.55, C.lt);
    const nTop = add(sk.hc, turn([-Hd.rx * 0.95, Hd.ry * 0.4], sk.ha));
    soft(ctx, a, mix(sk.nb, nTop, 0.6), 3.6, 0.45, C.lt);
    soft(ctx, a, add(sk.hc, turn([-Hd.rx * 0.2, -Hd.ry * 0.45], sk.ha)), Hd.rx * 0.95, 0.95, C.lt);
    soft(ctx, a, add(sk.hc, turn([Hd.rx * 0.2, Hd.ry * 1.05], sk.ha)), 3.4, 0.5, C.sh);
    soft(ctx, a, add(sk.sc, turn([SR * 0.62, SR * 0.72], sk.shA)), 5.2, 0.75, C.sh);
    ctx.restore();
    // the soft guides on the head: where the eyes would go, a small mouth
    ctx.save();
    ctx.translate(...sk.hc);
    ctx.rotate(sk.ha);
    guide(ctx, a);
    ctx.beginPath();
    ctx.moveTo(Hd.rx * 0.05, -Hd.ry * 0.05);
    ctx.quadraticCurveTo(Hd.rx * 0.45, -Hd.ry * 0.18, Hd.rx * 0.86, -Hd.ry * 0.02);
    ctx.stroke();
    if (sk.jaw > 0.12) {
      ctx.beginPath();
      ctx.ellipse(Hd.rx * 0.66, Hd.ry * 0.52, Hd.rx * 0.2, Hd.ry * 0.16 * sk.jaw + 0.2, 0.3, 0, TAU);
      ctx.fillStyle = tone(a, C.mouth);
      ctx.fill();
    } else {
      guide(ctx, a, C.nose, 0.42);
      ctx.beginPath();
      ctx.moveTo(Hd.rx * 0.56, Hd.ry * 0.5);
      ctx.quadraticCurveTo(Hd.rx * 0.7, Hd.ry * 0.68, Hd.rx * 0.84, Hd.ry * 0.46);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  // A stalk: a soft tube from inside the head out to its tip (an upper one ends in a soft knob).
  function drawStalk(ctx, a, mode, id) {
    const sk = a.bk;
    const s = sk.stalks[id];
    if (!s || s.ext < 0.06) return;
    const K = s.K;
    const dR = unit(s.ang);
    const p0 = sub(s.root, mul(dR, 1.6));
    const ctl = add(s.root, mul(dR, s.L * 0.5));
    const pts = Array.from({ length: 7 }, (_, i) => bez2(p0, ctl, s.tip, i / 6));
    const ws = pts.map((_, i) => K.w * (i === 6 && K.up ? 1.3 : lerp(1.08, 0.92, i / 6)));
    const out = tubeOutline(pts, ws);
    ctx.save();
    upright(ctx, sk);
    // (only where it's out of the head: its root never shows over the face)
    if (!K.far) {
      ctx.beginPath();
      ctx.rect(-1e3, -1e3, 2e3, 2e3);
      addOval(ctx, sk.hc, P.head.rx, P.head.ry, sk.ha);
      ctx.clip('evenodd');
    }
    ctx.beginPath();
    addShape(ctx, out);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, K.far ? C.sh : C.base);
    ctx.fill('nonzero');
    if (!K.far) {
      ctx.save();
      ctx.beginPath();
      addShape(ctx, out);
      ctx.clip('nonzero');
      soft(ctx, a, add(s.tip, [-0.35, -0.35]), K.w * 0.9, 0.9, C.lt);
      ctx.restore();
    }
    ctx.restore();
  }

  // A leg (tortoise): a stubby column out from under the shell, on a round flat pad; a soft shade
  // where it comes out, faint toe creases on the near pads.
  function drawLeg(ctx, a, mode, k) {
    const sk = a.bk;
    const L = sk.legs[k];
    const [fw, fh] = P.leg.foot;
    const sp = [L.root, mix(L.root, L.J, 0.5), L.J, mix(L.J, L.F, 0.5), L.F];
    const ws = [L.w * 1.02, L.w * 1.02, L.w, L.w * 0.97, L.w * 0.95];
    // (the foot: the column's end, flaring a touch to a flat round-cornered sole)
    const w = L.w;
    const foot = loopThrough([[-w * 0.46, -0.9], [w * 0.46, -0.9], [fw * 0.49 + 0.2, fh * 0.52], [fw * 0.45 + 0.2, fh], [0.1, fh], [-fw * 0.45, fh], [-fw * 0.48, fh * 0.52]], 4)
      .map((q) => add(L.F, turn(q, L.fa)));
    const path = () => {
      ctx.beginPath();
      addShape(ctx, tubeOutline(sp, ws));
      addShape(ctx, foot);
    };
    ctx.save();
    upright(ctx, sk);
    path();
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, L.far ? C.sh : C.base);
    ctx.fill('nonzero');
    ctx.save();
    path();
    ctx.clip('nonzero');
    // lit down its front, shaded where it comes out from under the shell and along the sole
    if (!L.far) soft(ctx, a, add(mix(L.J, L.F, 0.35), [w * 0.12, -0.2]), w * 0.75, 0.6, C.lt);
    soft(ctx, a, L.root, w * 1.5, L.far ? 0.35 : 0.6, L.far ? C.deep : C.sh);
    ctx.save();
    ctx.translate(...L.F);
    ctx.rotate(L.fa);
    const g = ctx.createLinearGradient(0, fh * 0.35, 0, fh);
    g.addColorStop(0, toneA(a, L.far ? C.deep : C.sh, 0));
    g.addColorStop(1, toneA(a, L.far ? C.deep : C.sh, 0.7));
    ctx.fillStyle = g;
    ctx.fillRect(-fw, fh * 0.35, fw * 2, fh);
    ctx.restore();
    ctx.restore();
    // (two tiny soft nail creases at the front of a near foot)
    if (!L.far) {
      ctx.save();
      ctx.translate(...L.F);
      ctx.rotate(L.fa);
      guide(ctx, a, C.sh, 0.34);
      for (const x of [0.12, 0.34]) {
        ctx.beginPath();
        ctx.arc(fw * x + 0.2, fh - 0.15, 0.55, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // A flipper (sea turtle): a short arm from the shoulder under the shell, then a long curved
  // wing of a blade (a full rounded leading edge, a gently waved trailing edge, a round tip swept
  // back); the hind ones small round paddles. The near front one is drawn twice: behind the shell,
  // and again over it (`over`) so it shows in front when it swings up, never its shoulder or where
  // it tucks in under the shell's lower band, and edged softly where it crosses the shell.
  const FRONT_BLADE = (() => {
    const b = 1;
    return [[0, -1.5], [0.3, -2.25], [0.62, -1.9], [0.88, -1.05], [1.02, 0.05], [0.95, 0.95], [0.76, 1.35], [0.52, 2.15], [0.26, 2.85], [0.06, 2.2], [-0.05, 0.3]].map(([x, y]) => [x * b, y]);
  })();
  const HIND_BLADE = [[0, -1.3], [0.45, -1.7], [0.86, -1.1], [1.02, 0.2], [0.8, 1.5], [0.4, 1.9], [0, 1.4]];
  function drawFlipper(ctx, a, mode, k, over = false) {
    const sk = a.bk;
    const L = sk.legs[k];
    const Fl = P.flip;
    // (over the shell only while it's swung up in front of it)
    if (over && !(L.F[1] < sk.sc[1] + 1)) return;
    const len = L.fore ? Fl.blade : Fl.hind;
    const widen = L.fore ? 0.78 : 0.95;
    const blade = loopThrough((L.fore ? FRONT_BLADE : HIND_BLADE).map(([x, y]) => add(L.J, turn([x * len, y * widen], L.be))), 4);
    const arm = L.fore ? tubeOutline([L.root, mix(L.root, L.J, 0.5), L.J], [2.5, 2.9, 3.1]) : null;
    const inShell = (fn) => {
      ctx.translate(...sk.sc);
      ctx.rotate(sk.ang);
      fn();
      ctx.rotate(-sk.ang);
      ctx.translate(-sk.sc[0], -sk.sc[1]);
    };
    const path = () => {
      ctx.beginPath();
      addShape(ctx, blade);
      if (arm) addShape(ctx, arm);
      else addOval(ctx, L.root, 1.7, 1.7);
    };
    ctx.save();
    upright(ctx, sk);
    if (over) {
      inShell(() => {
        ctx.beginPath();
        ctx.rect(-1e3, -1e3, 2e3, 2e3);
        addShape(ctx, bandPoly);
      });
      ctx.clip('evenodd');
      ctx.beginPath();
      ctx.rect(-1e3, -1e3, 2e3, 2e3);
      addOval(ctx, L.root, Fl.arm + 1.3, Fl.arm + 1.3);
      ctx.clip('evenodd');
    }
    path();
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, L.far ? C.sh : C.base);
    ctx.fill('nonzero');
    ctx.save();
    path();
    ctx.clip('nonzero');
    // lit along the leading edge, a soft shade toward the trailing edge and where it comes out
    if (!L.far) {
      soft(ctx, a, add(L.J, turn([len * 0.4, -1.1], L.be)), len * 0.42, 0.75, C.lt);
      soft(ctx, a, add(L.J, turn([len * 0.45, 2.2 * widen], L.be)), len * 0.35, 0.4, C.sh);
    }
    soft(ctx, a, L.root, 3.6, L.far ? 0.4 : 0.6, L.far ? C.deep : C.sh);
    ctx.restore();
    if (over) {
      ctx.save();
      inShell(() => {
        ctx.beginPath();
        addShape(ctx, shellRing);
      });
      ctx.clip();
      path();
      ctx.strokeStyle = INK;
      ctx.globalAlpha *= 0.85;
      ctx.lineWidth = 1.1;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // The neck: a soft even tube out of the shell's front, shaded where it comes out.
  function drawNeck(ctx, a, mode) {
    const sk = a.bk;
    const N = P.neck;
    const n = sk.spine.length;
    const ws = sk.spine.map((_, i) => N.w * lerp(1.08, 0.96, i / (n - 1)));
    const out = tubeOutline(sk.spine, ws);
    ctx.save();
    upright(ctx, sk);
    ctx.beginPath();
    addShape(ctx, out);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.beginPath();
    addShape(ctx, out);
    ctx.clip('nonzero');
    soft(ctx, a, sk.O, 4.4, 0.7, C.sh);
    const mid = sk.spine[Math.floor(n * 0.75)];
    soft(ctx, a, add(mid, [-0.4, -1.2]), 2.6, 0.5, C.lt);
    ctx.restore();
    ctx.restore();
  }

  // The head (tortoise, sea turtle), in its own frame: the skull and the snout one soft shape; the
  // jaw under it opening; the guides: an eye line, the mouth line, a tiny nostril.
  function drawHead(ctx, a, mode) {
    const sk = a.bk;
    const Hd = P.head;
    const [sx, sy, srx, sry] = Hd.skull;
    const [nx, ny, nrx, nry] = Hd.snout;
    ctx.save();
    upright(ctx, sk);
    ctx.translate(...sk.hp);
    ctx.rotate(sk.ha);
    const hinge = [sx - srx * 0.1, sy + sry * 0.5];
    const jawPath = () => {
      ctx.beginPath();
      addOval(ctx, [nx - nrx * 0.25, ny + nry * 0.7], nrx * 0.95, nry * 0.5);
    };
    ctx.save();
    ctx.translate(...hinge);
    ctx.rotate(sk.jaw * 0.5);
    ctx.translate(-hinge[0], -hinge[1]);
    jawPath();
    if (mode === 'line') line(ctx);
    else {
      ctx.fillStyle = tone(a, C.sh);
      ctx.fill();
    }
    ctx.restore();
    const headPath = () => {
      ctx.beginPath();
      addOval(ctx, [sx, sy], srx, sry);
      addOval(ctx, [nx, ny], nrx, nry);
    };
    headPath();
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    headPath();
    ctx.clip('nonzero');
    soft(ctx, a, [sx - srx * 0.1, sy - sry * 0.5], srx * 0.95, 0.95, C.lt);
    soft(ctx, a, [nx + nrx * 0.1, ny - nry * 0.3], nrx * 0.9, 0.7, C.lt);
    soft(ctx, a, [sx - srx * 0.75, sy + sry * 0.35], sry * 1.1, 0.5, C.sh);
    soft(ctx, a, [nx - nrx * 0.3, ny + nry * 1.05], nrx * 0.9, 0.45, C.sh);
    ctx.restore();
    // the mouth open: dark inside
    if (sk.jaw > 0.12) {
      ctx.beginPath();
      ctx.ellipse(nx - nrx * 0.05, ny + nry * 0.62, nrx * 0.72, nry * 0.3 * sk.jaw + 0.15, 0.28 * sk.jaw, 0, TAU);
      ctx.fillStyle = tone(a, C.mouth);
      ctx.fill();
    }
    // the eye line, the mouth line, the nostril
    guide(ctx, a);
    ctx.beginPath();
    ctx.moveTo(sx + srx * 0.02, sy - sry * 0.2);
    ctx.quadraticCurveTo(sx + srx * 0.42, sy - sry * 0.36, sx + srx * 0.78, sy - sry * 0.24);
    ctx.stroke();
    if (sk.jaw <= 0.12) {
      guide(ctx, a, C.nose, 0.42);
      ctx.beginPath();
      ctx.moveTo(nx + nrx * 0.92, ny + nry * 0.3);
      ctx.quadraticCurveTo(nx + nrx * 0.2, ny + nry * 0.72, sx + srx * 0.05, sy + sry * 0.52);
      ctx.stroke();
    }
    ctx.fillStyle = tone(a, C.nose);
    ctx.beginPath();
    ctx.arc(Hd.nostril[0], Hd.nostril[1], 0.32, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // The tail: a tiny soft cone from under the back of the shell.
  function drawTail(ctx, a, mode) {
    const sk = a.bk;
    if (!sk.tail) return;
    const { root, mid, tip } = sk.tail;
    const pts = Array.from({ length: 5 }, (_, i) => bez2(root, mid, tip, i / 4));
    const W0 = P.tail.w;
    const out = tubeOutline(pts, pts.map((_, i) => lerp(W0, W0 * 0.32, i / 4)));
    ctx.save();
    upright(ctx, sk);
    ctx.beginPath();
    addShape(ctx, out);
    if (mode === 'line') line(ctx);
    else {
      ctx.fillStyle = tone(a, C.base);
      ctx.fill('nonzero');
      ctx.save();
      ctx.clip('nonzero');
      soft(ctx, a, root, W0 * 1.6, 0.6, C.sh);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- Effects: sparkles on a hit, dust, speed lines, the spin's soft swirl ----------
  const star = (ctx, x, y, r, an, fill) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.34 : r;
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
  const spotOf = (sk, what) => {
    if (what === 'head') return sk.X(snail ? sk.front : sk.front);
    if (what === 'mouth') return sk.X(sk.mouth);
    if (what === 'shellfront') return sk.X(add(sk.sc, turn([snail ? SR : shellFront, 0], snail ? sk.shA : sk.ang)));
    if (what === 'front') return snail ? [sk.X([sk.xf, 0])[0], 0] : sk.X(sk.B([shellFront, 2]));
    if (what === 'flipper') return sk.X(sk.legs.foreN.F);
    if (what === 'fore') return [sk.X(snail ? sk.front : sk.legs.foreN.F)[0], 0];
    if (what === 'body') return [sk.X(sk.sc)[0], 0];
    return [sk.X(sk.sc)[0], 0];
  };
  function drawFx(ctx, m, a) {
    const sk = a.bk;
    const mv = a.shMove?.mv;
    const t = a.shMove?.t ?? 0;
    if (!mv) return;
    ctx.save();
    for (const s0 of mv.spark ?? []) {
      const k = after([s0], t, 0.24);
      if (k < 0) continue;
      const [x, y] = spotOf(sk, mv.sparkAt);
      const e = 1 - (1 - k) ** 3;
      ctx.globalAlpha = 1 - k;
      star(ctx, x, y, H * 0.13 * (0.5 + 0.7 * e), k * 0.8, '#ffffff');
      star(ctx, x, y, H * 0.065 * (0.5 + 0.7 * e), k * 0.8 + 0.4, '#fff2a8');
      for (let i = 0; i < 4; i++) {
        const q = (i * TAU) / 4 + 0.6;
        star(ctx, x + Math.cos(q) * H * 0.17 * e, y + Math.sin(q) * H * 0.17 * e, H * 0.032, q, i % 2 ? '#ffc8de' : '#fff6c8');
      }
    }
    for (const [d0, where] of mv.dust ?? []) {
      const k = after([d0], t, 0.42);
      if (k < 0) continue;
      const [gx] = spotOf(sk, where);
      const e = 1 - (1 - k) ** 2;
      for (let i = 0; i < 4; i++) {
        const side = i < 2 ? -1 : 1;
        puff(ctx, gx + side * (2 + (i % 2) * 3.4) * (0.4 + e), -1 - (i % 2) - e * 2.4, (1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - k) * 0.85);
      }
    }
    if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
      const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
      const [cx, cy] = sk.X(sk.sc);
      ctx.globalAlpha = 0.7 * Math.sin(Math.PI * k);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 3; i++) {
        const y = cy + (i - 1) * 4;
        ctx.beginPath();
        ctx.moveTo(cx - 14 - 5 * k - (i % 2) * 2, y);
        ctx.lineTo(cx - 22 - 9 * k - (i % 2) * 2, y);
        ctx.stroke();
      }
    }
    // the spin: two soft swirls round the shell, turning with it
    if (a.shSpinning && sk.top) {
      // (spinning like a top: soft flat swirls round its belly)
      const [cx] = sk.X(sk.sc);
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6 * a.shSpinning;
      for (let i = 0; i < 2; i++) {
        const a0 = sk.sweep * TAU + i * Math.PI;
        ctx.beginPath();
        ctx.ellipse(cx, -2.2 - i * 2.6, 19 - i * 3, 3.2, 0, a0, a0 + 1.5);
        ctx.stroke();
      }
    } else if (a.shSpinning) {
      const [cx, cy] = sk.X(sk.sc);
      const r = (snail ? SR : shellTop * 1.25) + 2.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.55 * a.shSpinning;
      for (let i = 0; i < 2; i++) {
        const a0 = sk.rollA + i * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, r, a0, a0 + 1.1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (m.act && SHELL_MOVES[m.act.name]) {
      const mv = SHELL_MOVES[m.act.name];
      const T0 = a.now - m.act.at;
      if (T0 >= 0 && T0 < mv.anticT + lengthOf(mv)) {
        const t = T0 - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T0 / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.shAtk) {
        const pool = m.def.moves ?? P.moves;
        st.shN = (st.shN ?? m.uid ?? 0) + 1;
        st.shPick = m.move ?? pool[st.shN % pool.length];
      }
      st.shAtk = true;
      const mv = SHELL_MOVES[st.shPick];
      // (once its move has played out, a hit or a gloat can show again)
      if (mv && a.ph.since < 0) return [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
      if (mv && a.ph.since < lengthOf(mv)) return [mv, a.ph.since, 1];
    } else st.shAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) < lengthOf(SHELL_MOVES.hurt)) return [SHELL_MOVES.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < lengthOf(SHELL_MOVES.stretch)) return [SHELL_MOVES.stretch, gl, 1];
    return [null, 0, 0];
  }
  const layers = snail
    ? [
      ['stalkUpF', (ctx, a, mode) => drawStalk(ctx, a, mode, 'upF')],
      ['stalkLoF', (ctx, a, mode) => drawStalk(ctx, a, mode, 'loF')],
      ['body', drawSnailBody],
      ['stalkLoN', (ctx, a, mode) => drawStalk(ctx, a, mode, 'loN')],
      ['stalkUpN', (ctx, a, mode) => drawStalk(ctx, a, mode, 'upN')],
      ['shell', drawShell],
    ]
    : [
      ['hindF', (ctx, a, mode) => (T === 'seaturtle' ? drawFlipper : drawLeg)(ctx, a, mode, 'hindF')],
      ['foreF', (ctx, a, mode) => (T === 'seaturtle' ? drawFlipper : drawLeg)(ctx, a, mode, 'foreF')],
      ['tail', drawTail],
      ['neck', drawNeck],
      ['head', drawHead],
      ['hindN', (ctx, a, mode) => (T === 'seaturtle' ? drawFlipper : drawLeg)(ctx, a, mode, 'hindN')],
      ['foreN', (ctx, a, mode) => (T === 'seaturtle' ? drawFlipper : drawLeg)(ctx, a, mode, 'foreN')],
      ['shell', drawShell],
      // (a sea turtle's near front flipper again, over the shell: raised, it shows in front of it)
      ...(T === 'seaturtle' ? [['foreNover', (ctx, a, mode) => drawFlipper(ctx, a, mode, 'foreN', true)]] : []),
    ];
  const parts = [
    ...layers.map(([name, fn]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: BLANK, paint: (ctx, a) => fn(ctx, a, 'line') })),
    ...layers.map(([name, fn]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: BLANK, paint: (ctx, a) => fn(ctx, a, 'fill') })),
  ];
  const RW = Math.ceil(length * 2.6 + 24);
  const RH = Math.ceil(H * 2.2);
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: cycle,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, {
      hide: [140, 24], peek: [70, 15], roll: [110, 19], down: [80, 18], splay: [80, 18], free: [150, 22], neck: [190, 22], nAng: [160, 20], head: [170, 20],
      jaw: [420, 34], stalk: [150, 19], stalkA: [120, 15], droop: [60, 13], stretch: [180, 22], lean: [190, 21], flipN: [260, 26], tail: [150, 14],
    }[c] ?? [170, 21]])),
    walkStiff: { x: [400, 36], lift: [900, 60], pitch: [400, 38], nAng: [260, 28], head: [260, 28] },
    fast: CH.filter((c) => !['stalk', 'stalkA', 'droop', 'tail', 'peek', 'splay', 'down'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.shActive),
    kick: { pitch: -34, head: 44, nAng: 40, stalkA: 120 },
    turnKick: { pitch: 10, stalkA: 60 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + ((m.uid ?? 0) % 7) * 1.1;
      a.shT = t;
      a.shM = m;
      const dt = Math.max(0, a.dt ?? 0);
      // The gait: its phase straight from the distance walked, so a planted foot never slides.
      const odo = m.odo ?? 0;
      const moved = Math.min(20, Math.abs(odo - (st.shOdo ?? odo)));
      st.shOdo = odo;
      st.shU = frac((st.shU ?? 0) + moved / cycle);
      // (a snail's ripples run from the distance glided, walking or charging forward)
      const xNow = a.mo.rig.x?.x ?? 0;
      const glided = Math.min(20, Math.abs(xNow - (st.shX ?? xNow)));
      st.shX = xNow;
      if (snail) st.shRip = frac((st.shRip ?? 0) + ((moved + glided) * 1.4) / P.ripple);
      // Standing about: breathing; a slow look round (held, then turning); now and then a long
      // stretch of the neck, or the head down to the ground for a little nibble; a snail's stalks
      // wander on their own; a tortoise's tail flicks; a sea turtle shifts a flipper.
      const breath = Math.sin(t * 1.7);
      const rnd = (n) => frac(Math.sin(n * 12.9898 + ((m.uid ?? 0) % 97) * 78.233) * 43758.5453);
      const blk = Math.floor(t / 4.4);
      const look = (lerp(rnd(blk - 1), rnd(blk), sstep(frac(t / 4.4) / 0.24)) * 2 - 1);
      const cyc = t % 14;
      const reachUp = hold(cyc, 3.4, 4.3, 5.6, 6.6);
      const nib = hold(cyc, 9, 9.6, 11.2, 11.9);
      const busy = Math.max(reachUp, nib);
      const chew = nib * Math.max(0, Math.sin((cyc - 9.6) * 10)) * 0.5;
      a.shTail = hold(t % 6.1, 3, 3.12, 3.3, 3.7) * 1.2;
      const idle = {
        x: 0, hop: 0, lift: breath * 0.18, pitch: 0, crouch: 0, roll: 0, hide: 0, peek: 0, down: 0, splay: 0, free: 0,
        neck: breath * 0.05 + reachUp * (snail ? 0.55 : 0.85) - nib * 0.1, nAng: look * 7 * (1 - busy) + reachUp * 18 - nib * (snail ? 30 : 34), head: -look * 3 * (1 - busy) - reachUp * 10 + nib * 20 + breath * 0.6,
        jaw: chew + reachUp * 0.12, stalk: 1, stalkA: -reachUp * 8 + nib * 12, droop: 0, stretch: reachUp * 0.2, lean: 0,
        flipN: T === 'seaturtle' ? hold(t % 9.7, 6.2, 6.6, 6.8, 7.3) * 0.28 : 0, tail: 0,
      };
      const walk = { ...idle, neck: 0.2, nAng: -3 + look * 2, head: 2, jaw: 0, stalkA: 12, stretch: 0.12, flipN: 0, lift: 0 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      base.hop /= H;
      const out = mv ? moveAt(mv, mt, anticW, base) : { ...base };
      // Poses, a nap, a cutscene's mood.
      const pose = m.hp > 0 ? (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > (a.now ?? 0) ? 'sleep' : m.pose) : null;
      const mood = m.cine?.mood;
      if (pose === 'rest') Object.assign(out, { down: 1, splay: 1, neck: 0.1, nAng: -10 + look * 3, head: 8, stalk: 0.75, stalkA: 14, stretch: 0.1, lift: breath * 0.12 });
      else if (pose === 'hide') {
        const pk = hold(t % 6.4, 2.4, 3.2, 4.4, 4.9);
        Object.assign(out, { hide: 1, peek: pk * 0.65, stalk: pk * 0.55, nAng: pk * look * 6, head: 0, lift: 0, neck: 0 });
      } else if (pose === 'sleep' || mood === 'sleep' || mood === 'blink') {
        const sb = Math.sin(t * 0.9);
        Object.assign(out, { down: 1, splay: 0.7, hide: snail ? 0.75 : 0, neck: snail ? 0 : -0.8, nAng: -10, head: 10, stalk: 0, stalkA: 0, stretch: -0.1, lift: sb * 0.22, jaw: 0, flipN: 0 });
      } else if (mood === 'sad') Object.assign(out, { neck: -0.3, nAng: -14, head: 16, stalk: 0.6, droop: 0.7 });
      else if (mood === 'happy') Object.assign(out, { neck: 0.5, nAng: 14 + Math.sin(t * 5) * 4, head: -8, stalkA: -6, lift: Math.max(0, Math.sin(t * 6)) * 0.8 });
      // (a snail tipped over draws most of itself into its shell, only the head left out)
      if (snail) out.hide = Math.max(out.hide, 0.62 * sstep((Math.abs(out.roll) - 15) / 60));
      if (m.hp <= 0) Object.assign(out, { down: 1, splay: 1, hide: 0, neck: 0.45, nAng: -26, head: 16, jaw: 0.2, stalk: 0.35, droop: 1, stretch: 0.2, lean: 0, flipN: 0, roll: 0, peek: 0 });
      st.shActive = Boolean(mv);
      a.shMove = mv ? { mv, t: mt } : null;
      // (the spin: followed closely, the short way round if it's cut off mid-turn)
      const spinGoal = mv ? turnsAt(mv, mt) : 0;
      // (whole turns are the same as none: dropped the moment a spin ends, so nothing unwinds)
      if (!mv?.spin) st.shSpinT = (st.shSpinT ?? 0) - Math.round(st.shSpinT ?? 0);
      st.shSpinT = lerp(st.shSpinT ?? spinGoal, spinGoal, Math.min(1, dt * 30 + (dt === 0 ? 1 : 0)));
      a.shSpin = st.shSpinT;
      a.shSpinning = mv?.spin ? sstep((mt - mv.spin[0][0] + 0.05) / 0.1) * (1 - sstep((mt - mv.spin[mv.spin.length - 1][1] + 0.05) / 0.1)) : 0;
      // (the ripples show as it glides; a faint shine on the ground behind a charge)
      const gliding = mv && (mv.trail ? mt >= mv.trail[0] && mt <= mv.trail[1] : false);
      a.shRipW = follow(st, 'shRipW', snail && (a.moving || gliding) ? 1 : 0, 60, 15, dt);
      a.shTrail = follow(st, 'shTrailW', snail && (a.moving || gliding) ? 1 : 0, 20, 9, dt);
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
    fx: (ctx, m, a) => drawFx(ctx, m, a),
  });
  // (a still for the Monster Book: the shell and the head at rest, plain)
  const still = () => {
    const cx = RW / 2;
    const g = RH - 2;
    const shapes = snail
      ? [E(cx + P.foot.back / 2 + P.foot.front / 2, g - 2.4, (P.foot.front - P.foot.back) / 2, 2.6, C.base), E(cx + P.head.c[0], g + P.head.c[1], P.head.rx, P.head.ry, C.base), E(cx + P.shell.c[0], g + P.shell.c[1], SR, SR, C.base)]
      : [E(cx + P.neck.open[0] + P.neck.ext, g + P.shell.standY, P.head.skull[2], P.head.skull[3], C.base), E(cx, g + P.shell.standY, (Math.max(...xsR) - Math.min(...xsR)) / 2, (shellTop + shellLow) / 2, C.base)];
    return { w: RW, h: RH, res: 3, shapes };
  };
  return { rig, still, stride: cycle, speed: P.speed, H, w: Math.round(length * 0.95), h: Math.round(H * 1.05), moves: P.moves };
}

export const SHELL_ARTS = {};
export const SHELL_DEFS = {};
for (const kind of SHELL_KINDS) {
  const r = shellRig(kind);
  SHELL_ARTS[`blank_${kind}`] = { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig };
  SHELL_DEFS[kind] = { id: `blank_${kind}`, name: `Blank ${kind}`, art: `blank_${kind}`, w: r.w, h: r.h, speed: r.speed, hp: 100, fight: { windup: 0.5 }, bodyH: r.H, beast: true, moves: r.moves };
}
