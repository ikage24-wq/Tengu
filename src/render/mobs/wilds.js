// Monster art: wilds (Windy Canyon and Mossy Woods).
//   pebblet    Basilisk Hatchling: a stocky lizard with a rocky frill and stone-scale back
//   scorpip    Manticore Cub: a lion cub with a mane, bat wings, and a curled scorpion tail
//   leafling   Dryad: a forest nymph with leaf hair, bark limbs, and a budding twig staff
//   boarlet    Warg: a shaggy, scarred dire wolf that lopes after you
//   mossgolem  Treant: a slow, wise walking tree with root feet and a bird's nest in its crown
// Every design faces right with its feet on the bottom edge, and is built from small helpers
// (rotated ovals, smooth blobs, tapered tubes, two-bone legs and a gait cycle) so the walk
// cycles can plant, lift, and swing each leg while tails, manes, and leaves follow through.
// Each has its own gait (a low reptile wiggle, a cat's prowl, a graceful glide, a loping trot,
// a lumbering sway), its own eyes, an idle fidget loop, and a four-frame attack (wind-up,
// strike, impact, recover).

import { R, E, T, F, C, shade, mix, arc, stroke, INK, BLUSH, MOUTH } from './kit.js';
import { eye, glowEye, brow, mouth, nose as snout, blush as cheek, sweat, tear, vein, deadEye, band, LASH } from './faces.js';
import { ramp, hue, crescent, shine, smear, chain, wave as ripple, breath, sway } from './meadow.js';

// ---------- Geometry helpers ----------

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const wave = (t) => Math.sin(t * TAU);
const wrap = (p) => ((p % 1) + 1) % 1;
// A smooth bump that peaks (1) at phase c and fades to 0 within w either side; phases wrap.
function bump(p, c, w) {
  const d = Math.abs(wrap(p - c + 0.5) - 0.5);
  return d >= w ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * d) / w);
}

// Points of an ellipse rotated by `a` degrees.
function ovalPts(cx, cy, rx, ry, a = 0, n = 20) {
  const ca = Math.cos(rad(a));
  const sa = Math.sin(rad(a));
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return out;
}
const ov = (cx, cy, rx, ry, a, c) => (a ? T(ovalPts(cx, cy, rx, ry, a), c) : E(cx, cy, rx, ry, c));

// A Catmull-Rom spline through the points (closed loops for blobs, open for tubes).
function spline(pts, closed, seg = 4) {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
const blob = (pts, c, seg = 4) => T(spline(pts, true, seg), c);

// A smooth tapered tube along the points, with round caps; `ws` are widths spread along it.
function tubePts(pts, ws, seg = 4) {
  const path = spline(pts, false, seg);
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  const wAt = (u) => {
    const x = u * (ws.length - 1);
    const i = Math.min(ws.length - 2, Math.floor(x));
    return lerp(ws[i], ws[i + 1], x - i);
  };
  const left = [];
  const right = [];
  const dirs = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = (b[0] - a[0]) / l;
    const dy = (b[1] - a[1]) / l;
    dirs.push([dx, dy]);
    const h = wAt(lens[i] / total) / 2;
    left.push([path[i][0] - dy * h, path[i][1] + dx * h]);
    right.push([path[i][0] + dy * h, path[i][1] - dx * h]);
  }
  const cap = (p, d, h, sign) => {
    const out = [];
    for (let k = 1; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      // Sweep from one side to the other around the end.
      const nx = -d[1];
      const ny = d[0];
      const c = Math.cos(a);
      const s = Math.sin(a) * sign;
      out.push([p[0] + (nx * c + d[0] * s) * h, p[1] + (ny * c + d[1] * s) * h]);
    }
    return out;
  };
  const n = path.length - 1;
  const endCap = cap(path[n], dirs[n], wAt(1) / 2, 1);
  const startCap = cap(path[0], dirs[0], wAt(0) / 2, -1).map(([x, y]) => [2 * path[0][0] - x, 2 * path[0][1] - y]);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}
const tube = (pts, ws, c, seg) => T(tubePts(pts, ws, seg), c);
// Inner line color for a part (the auto outline only wraps the whole silhouette): the part's
// own deepest tone, hue-shifted, never a neutral ink.
const edges = new Map();
const edge = (c) => {
  if (!edges.has(c)) edges.set(c, hue(ramp(c, { step: 15, turn: 14 }).deep, 0, -8, -4));
  return edges.get(c);
};
// A tube with its own thin dark line, so a limb in front of the body still reads.
const tubeL = (pts, ws, c, seg, lw = 0.9) => [F(tube(pts, ws.map((w) => w + lw), edge(c), seg)), tube(pts, ws, c, seg)];
// An oval with its own thin line.
const ovL = (cx, cy, rx, ry, a, c, lw = 0.45) => [F(ov(cx, cy, rx + lw, ry + lw, a, edge(c))), ov(cx, cy, rx, ry, a, c)];

// Two-bone reach: the knee between hip and foot. bend +1 puts the knee behind (left), -1 in front.
function knee(hx, hy, fx, fy, l1, l2, bend) {
  const dx = fx - hx;
  const dy = fy - hy;
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / (Math.hypot(dx, dy) || 1);
  const uy = dy / (Math.hypot(dx, dy) || 1);
  return [hx + ux * a - uy * h * bend, hy + uy * a + ux * h * bend];
}

// A foot's place in a walk cycle: planted and sliding back for `duty` of it (stance), then
// lifted and swung forward in an arc that rises quickly and sets down softly (swing).
// Returns [dx, lift] (lift negative = up).
function gait(p, stride, lift, duty = 0.5) {
  p = wrap(p);
  if (p < duty) return [stride / 2 - stride * (p / duty), 0];
  const t = (p - duty) / (1 - duty);
  const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return [-stride / 2 + stride * e, -lift * Math.sin(Math.PI * Math.pow(t, 0.8))];
}

// Points spaced evenly along a smooth path through `pts` (n of them, from start to end).
function along(pts, n) {
  const path = spline(pts, false, 6);
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = lens[lens.length - 1];
  const out = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const d = (k / (n - 1)) * total;
    while (j < path.length - 1 && lens[j] < d) j++;
    const t = (d - lens[j - 1]) / (lens[j] - lens[j - 1] || 1);
    const a = path[j - 1];
    const b = path[j];
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), Math.atan2(b[1] - a[1], b[0] - a[0])]);
  }
  return out;
}

// Rotates points about (cx, cy) by `a` degrees.
const turn = (pts, cx, cy, a) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
// Rotates whole shapes about (cx, cy) (ellipses and rects keep their axes, fine for small turns).
const spin = (shapes, cx, cy, a) => (!a ? shapes : shapes.map((s) => {
  if (!s) return s;
  if (s.t === 'p') return { ...s, x: 0, y: 0, pts: turn(s.pts.map(([x, y]) => [x + s.x, y + s.y]), cx, cy, a) };
  if (s.t === 'e') {
    const [[x, y]] = turn([[s.x, s.y]], cx, cy, a);
    return { ...s, x, y };
  }
  const [[x, y]] = turn([[s.x + s.w / 2, s.y + s.h / 2]], cx, cy, a);
  return { ...s, x: x - s.w / 2, y: y - s.h / 2 };
}));

// A shaded ball: the base, its form shadow as a crescent on the back and underside (light from
// the upper front, so never a ring), and one small highlight on the top front. `jag` notches the
// shadow into fur tufts; `sh`/`hi` override the ramp's tones.
function ball(cx, cy, rx, ry, c, a = 0, { hi = true, k = 0.3, jag = 0, sh, light, a0 = 40, a1 = 225 } = {}) {
  const r = ramp(c, { step: 10, turn: 14, sat: -6 });
  const out = [ov(cx, cy, rx, ry, a, c), crescent(cx, cy, rx, ry, sh ?? r.sh, { k, jag, rot: a, a0, a1 })];
  if (hi) out.push(shine(cx, cy, rx, ry, light ?? r.hi, a));
  return out;
}

// Scales shapes about (cx, cy), to grow a head or shrink a detail.
const grow = (shapes, cx, cy, k) => shapes.map((s) => {
  if (!s) return s;
  if (s.t === 'p') return { ...s, x: 0, y: 0, pts: s.pts.map(([px, py]) => [cx + (s.x + px - cx) * k, cy + (s.y + py - cy) * k]) };
  if (s.t === 'e') return { ...s, x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, rx: s.rx * k, ry: s.ry * k };
  return { ...s, x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, w: s.w * k, h: s.h * k };
});
const shift = (shapes, dx, dy) => shapes.map((s) => (s ? { ...s, x: s.x + dx, y: s.y + dy } : s));

// A four-point sparkle (impact stars, glints).
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), F(E(x, y, k * 0.9, k * 0.9, core))];
}
// Little dust puffs kicked up where something hits the ground.
const dust = (x, y, k, c = '#f3e6d6') => [E(x - 2.4 * k, y - 0.8 * k, 1.6 * k, 1.2 * k, c), E(x, y - 1.6 * k, 2 * k, 1.6 * k, mix(c, '#ffffff', 0.4)), E(x + 2.4 * k, y - 0.7 * k, 1.5 * k, 1.1 * k, c)];

// ---------- Eyes ----------

// An almond outline: pointed corners, the outer one (on side s: +1 right, -1 left) lifted by
// `slant`; `round` near 0.5 gives a rounder eye, near 1 a sharper almond.
function almond(x, y, w, h, s, slant = 0, round = 0.75, lower = 0.8, n = 10) {
  const up = [];
  const lo = [];
  for (let i = 0; i <= n; i++) {
    const u = -1 + (2 * i) / n;
    const k = Math.pow(Math.max(0, 1 - u * u), round);
    const sl = -slant * u * s;
    up.push([x + u * w, y - h * k + sl]);
    lo.push([x + u * w, y + h * lower * k + sl]);
  }
  return { up, lo, pts: [...up, ...lo.slice(1, -1).reverse()] };
}

// One eye, built to a species' recipe (o): size (w, h), shape (slant, round, lower), colors
// (sclera, iris, irisL, glow for angry), pupil ('slit', 'cat' round that narrows to a slit when
// angry, 'round', 'none'), lashes, liner, and where it looks. s is the side of the outer corner.
// Every mood reads in every shape.
function peeper(x, y, mood, s, o) {
  const ink = o.ink ?? INK;
  const angry = mood === 'angry';
  const w = o.w;
  const h = o.h * (angry ? o.squint ?? 0.68 : 1);
  const sl = (o.slant ?? 0) + (angry ? 0.3 * o.h : 0);
  const rd = o.round ?? 0.75;
  const lw = o.lw ?? 0.5;
  const outer = (a) => (s > 0 ? a[a.length - 1] : a[0]);
  const out = [];
  switch (mood) {
    case 'blink': {
      const a = almond(x, y + o.h * 0.25, w, o.h * 0.35, s, o.slant ?? 0, rd, 1);
      out.push(...stroke(a.lo, lw * 1.3, ink));
      if (o.lash) out.push(...o.lash(outer(a.lo), s, true));
      return out;
    }
    case 'happy':
      return stroke(almond(x, y + o.h * 0.45, w * 0.92, o.h * 0.75, s, 0, 0.5, 0).up, lw * 1.3, ink);
    case 'hurt': {
      const r = Math.max(w, o.h) * 0.8;
      return stroke([[x + s * 0.85 * r, y - 0.75 * r], [x - s * 0.7 * r, y], [x + s * 0.85 * r, y + 0.75 * r]], lw * 1.3, ink);
    }
    case 'dead': {
      const r = Math.min(w, o.h) * 0.85;
      return [...stroke([[x - r, y - r], [x + r, y + r]], lw * 1.2, ink), ...stroke([[x - r, y + r], [x + r, y - r]], lw * 1.2, ink)];
    }
    default:
      break;
  }
  const lo = o.lower ?? 0.8;
  const a = almond(x, y, w, h, s, sl, rd, lo);
  if (angry && o.aura) out.push(F(T(almond(x, y, w + lw + 0.7, h + lw + 0.7, s, sl, rd, lo).pts, o.aura)));
  out.push(F(T(almond(x, y, w + lw, h + lw, s, sl, rd, lo).pts, ink)));
  const [lx, ly] = o.look ?? [0, 0];
  const iris = angry ? o.glow ?? o.iris : o.iris;
  const irisL = angry ? o.glowL ?? mix(iris, '#ffffff', 0.45) : o.irisL ?? mix(iris, '#ffffff', 0.45);
  if (o.sclera) {
    out.push(F(T(a.pts, o.sclera)));
    const iw = w * (o.irisW ?? 0.62);
    out.push(F(E(x + lx, y + ly + h * 0.05, iw, h * 0.92, iris)), F(E(x + lx, y + ly + h * 0.42, iw * 0.7, h * 0.4, irisL)));
  } else {
    out.push(F(T(a.pts, iris)), F(E(x + lx * 0.5, y + h * 0.36, w * 0.62, h * 0.36, irisL)));
  }
  const px = x + lx;
  const py = y + ly;
  const slit = o.pupil === 'slit' || (o.pupil === 'cat' && angry);
  if (slit) out.push(F(E(px + 0.05 * w, py + h * 0.04, Math.max(0.3, w * (angry ? 0.1 : 0.16)), h * 0.86, ink)));
  else if (o.pupil === 'cat') out.push(F(E(px + 0.05 * w, py + h * 0.08, w * 0.34, h * 0.72, ink)));
  else if (o.pupil === 'round') out.push(F(E(px + 0.05 * w, py + 0.1 * h, w * (angry ? 0.24 : 0.34), h * (angry ? 0.4 : 0.5), ink)));
  out.push(F(E(px - w * 0.3, py - h * 0.38, w * 0.22, w * 0.22, '#ffffff')), F(E(px + w * 0.3, py + h * 0.32, w * 0.1, w * 0.1, '#ffffff')));
  out.push(...stroke(a.up, lw * 1.25, ink));
  if (o.lash) out.push(...o.lash(outer(a.up), s, false));
  if (o.tear) out.push(...stroke([[x - s * w * 0.95, y + h * 0.1], [x - s * (w + 0.6), y + h + 0.8]], 0.45, o.tear));
  if (angry && o.brow) out.push(...stroke([[x + s * (w + 0.6), y - h - 1.8 - sl * 0.4], [x - s * w * 0.9, y - h - 0.3]], 0.65, o.brow));
  return out;
}

// ---------- Basilisk Hatchling (pebblet) ----------

// Attack: a lunging bite. ox: body shift, rear: body raised, hx/hy: head, fr: frill flare,
// gape: jaws (1 wide, -1 snapped), tail: tail raised.
const PEB_ATK = [
  // Wind-up: rocked back and reared up, head high, frill flared, mouth shut in a hiss.
  { ox: -1.4, rear: -0.8, hx: -1, hy: -1.4, fr: 0.6, gape: 0, tail: -1.6 },
  // Lunge: thrown forward and down, jaws wide.
  { ox: 0.2, rear: 0.4, hx: 0.4, hy: 2.2, fr: -1, gape: 1, tail: 1.6 },
  // Bite: jaws snap shut.
  { ox: 0, rear: 0.6, hx: 0.2, hy: 2.6, fr: -0.6, gape: -1, tail: 1 },
  // Recover.
  { ox: -1, rear: 0.2, hx: -0.4, hy: 0.6, fr: 0.4, gape: 0, tail: 0 },
];

function pebblet(pose, f, mood) {
  const W = 40;
  const H = 32;
  // Laid out on a 30-tall box; the extra headroom keeps the crown horns clear of the top edge.
  const G = 30;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? PEB_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  // Ramps: leaf-green scales cooling to teal, a cream belly, warm sandstone turning plum in its
  // shadows, and the coral frill as the one accent.
  const SK = ramp('#a8d69a', { step: 10, turn: 18, sat: -6 });
  const BE = ramp('#f7ecd0', { step: 8, turn: 24, sat: -10 });
  const ST = ramp('#cfbca2', { step: 11, turn: 22, sat: -4 });
  const skin = SK.base;
  const skinD = SK.sh;
  const belly = BE.base;
  const stone = ST.base;
  const stoneL = ST.hi;
  const stoneD = ST.sh;
  const frill = angry || A ? '#ff8c6e' : '#f7a88c';
  const frillD = hue(frill, -10, -6, -10);
  const ox = A ? A.ox : 0;
  const br = idle ? breath(p) : 0;
  // A low reptile wiggle: belly close to the ground, shoulders and hips rolling in turn; idle,
  // the flanks fill and it sways a little.
  const by = dead ? 1.4 : (walk ? 0.3 * Math.cos(p * TAU * 2) - 0.9 : A ? A.rear : hurt ? 0.4 : -br * 0.4) - 1.6;
  const wig = walk ? 3 * Math.sin(p * TAU) : idle ? sway(p) * 1.2 : 0;
  const look = idle ? bump(p, 0.5, 0.34) : 0;
  const hx = (hurt ? -1.6 : 0) + (walk ? 0.7 * Math.sin(p * TAU - 0.9) : idle ? sway(p - 0.12) * 0.4 : 0) + (A ? A.hx : 0);
  const hy = (dead ? 3.4 : hurt ? -1 : 0) + by + (walk ? 0.35 * Math.sin(p * TAU * 2 + 0.6) : idle ? -breath(p - 0.1) * 0.3 - look * 0.9 : 0) + (A ? A.hy : 0);
  const out = [];
  const body = [];

  // Tail: a chain of five links from the hips, a thick root tapering to a curled tip; the walk's
  // sway enters at the root and runs out to the tip as an S.
  const tph = walk ? p * TAU - 0.4 : p * TAU - 1;
  const tamp = dead ? 0 : walk ? 9 : idle ? 5 : 2;
  const tlift = A ? A.tail * 6 : idle ? -bump(p, 0.75, 0.2) * 10 : 0;
  const tj = dead
    ? chain(11, 23 + by, 170, [4.4, 3.6, 3, 2.4, 1.8], (i) => (i ? 4 : 0))
    : chain(11, 23 + by, 166 + tlift * 0.4, [4.4, 3.8, 3.2, 2.6, 2], (i) => (i ? 26 + tlift * 0.3 : 0) + ripple(tph, tamp, 0.9, 0.3)(i));
  const tail = tj.map(([x, y]) => [x, y]);
  body.push(tube(tail, [7, 5, 3.4, 2.2, 1.4, 1], skin), F(tube(tail.slice(0, 4).map(([x, y]) => [x - 0.3, y + 0.9]), [4.6, 3, 1.8, 1], skinD)));
  // Stone scales riding the tail, each lit on top.
  for (const [i, s] of [[1, 1.8], [2, 1.4], [3, 1.1]]) {
    const [tx, ty] = tail[i];
    body.push(T([[tx - s, ty - 1.4], [tx, ty - 1.4 - s], [tx + s, ty - 1.4], [tx, ty - 0.6]], stone), F(T([[tx - s * 0.4, ty - 1.5], [tx, ty - 1.4 - s], [tx + s * 0.8, ty - 1.45]], stoneL)));
  }

  // Legs: two bones each, sprawled out to the sides, a diagonal trot; feet stay planted while
  // the body shifts over them.
  const legPhase = { nf: 0, fb: 0, nb: 0.5, ff: 0.5 };
  const leg = (key, hipX, hipY, near, front) => {
    const [dx, lift] = dead ? [front ? 3 : -3, 0] : walk ? gait(p + legPhase[key], 7.7, 2.2, 0.55) : [0, 0];
    const fx = hipX + dx + (front ? 1 : -0.5) - ox + (A && front ? [0, 2.4, 2.4, 0.8][f] : 0) + (hurt && front ? -1 : 0);
    const fy = G - 1.3 + lift + (dead ? -0.6 : 0);
    const kn = knee(hipX, hipY, fx, fy, 4.4, 4.4, front ? 1 : -1);
    // Elbows and knees bowed outward: the joint pokes up above the hip line.
    const kj = [kn[0], kn[1] - 1];
    const c = near ? skin : skinD;
    const parts = near
      ? [...ovL(fx + 1.1, fy + 0.2, 2.8, 1.35, 0, c), ...tubeL([[hipX, hipY], kj, [fx, fy]], [5, 3.8, 3.2], c, 4, 0.6), ov(fx + 1.1, fy + 0.2, 2.8, 1.35, 0, c), F(ov(fx + 0.4, fy + 0.6, 2, 0.6, 0, SK.sh))]
      : [tube([[hipX, hipY], kj, [fx, fy]], [5, 3.8, 3.2], c), ov(fx + 1.1, fy + 0.2, 2.8, 1.35, 0, c), band([[kj[0] - 1, kj[1] + 1], [fx - 1, fy]], 0.67, SK.deep)];
    // Little cream claws, splayed.
    for (const k of [0, 1, 2]) parts.push(F(E(fx + 2.4 + k * 0.1, fy + 0.6 - k * 0.65 + 0.5, 0.55, 0.42, '#fff6e0')));
    return parts;
  };
  const rollY = (front) => (walk ? (front ? 0.5 : -0.5) * Math.sin(p * TAU) : 0);
  out.push(...leg('fb', 14.5, 23 + by + rollY(false), false, false), ...leg('ff', 26.5, 23 + by + rollY(true), false, true));

  // Body with a cream belly; it swells a little as it breathes in.
  body.push(...ball(18.5, 21.5 + by, 10.4, 6.8 + br * 0.3, skin, 0, { sh: skinD, light: SK.hi, k: 0.32 }));
  body.push(E(19.5, 24.6 + by, 8.2, 2.9, belly), crescent(19.5, 24.6 + by, 8.2, 2.9, BE.sh, { k: 0.5, a0: 50, a1: 190 }));
  for (const [x, y] of [[12.5, 20], [16, 22.4], [21, 21.6], [24, 23]]) body.push(F(E(x, y + by, 0.7, 0.55, skinD)));

  // Stone plates along the spine, cut in facets: the top face lit, the side in the stone's base,
  // the back face in shadow, a crack in the deep tone. They rise when angry.
  for (let i = 0; i < 5; i++) {
    const x = 9.4 + i * 3.6;
    const y = 15.8 + by - Math.sin((i / 4) * Math.PI) * 1.6 + (i === 0 ? 1.4 : 0);
    const s = i === 2 ? 2.6 : 2.2;
    const lift = (angry || A ? -0.8 : 0) + (walk ? -0.35 * Math.max(0, Math.sin(p * TAU * 2 - i * 0.9)) : 0);
    body.push(C(T([[x - s, y + 2], [x - s * 0.8, y - 0.6 + lift], [x, y - s - 0.4 + lift], [x + s * 0.9, y - 0.4 + lift], [x + s, y + 2]], stone)),
      F(T([[x - s, y + 2], [x - s * 0.8, y - 0.6 + lift], [x, y - s - 0.4 + lift], [x - s * 0.15, y + 0.3], [x - s * 0.3, y + 2]], stoneD)),
      F(T([[x, y - s - 0.4 + lift], [x + s * 0.9, y - 0.4 + lift], [x + s * 0.5, y + 0.2], [x, y - 0.2 + lift * 0.5]], stoneL)),
      band([[x + 0.3, y + 0.5], [x + 0.9, y + 1.7]], 0.4, ST.deep));
  }
  out.push(...spin(body, 18.5, 22 + by, wig));
  out.push(...leg('nb', 13, 24 + by + rollY(false), true, false), ...leg('nf', 25, 24 + by + rollY(true), true, true));

  // The head is one part on the neck: frill, skull, horns, face. It is built level and turned
  // about the neck joint, so everything on it stays put as it nods.
  const head = [];
  const X = 29.2 + hx;
  const Y = 13.4 + hy;
  const neck = [X - 5.4, Y + 4.6];
  const tilt = dead ? 14 : hurt ? -10 : A ? [-10, 8, 10, 0][f] : idle ? -look * 6 : walk ? 2 * Math.sin(p * TAU * 2 - 1.4) : 0;
  // The rocky frill fanned behind the skull: a coral web on stone ribs, flaring as it breathes;
  // its ribs trail the head's turn a little.
  const fx0 = X - 5.2;
  const fy0 = Y - 2;
  const fr = (angry ? 11.4 : hurt ? 7.6 : 9.6) + br * 0.6 + (A ? A.fr : 0);
  const web = [[fx0, fy0 + 2]];
  for (let i = 0; i <= 8; i++) {
    const a = rad(lerp(140, 290, i / 8));
    const r = i % 2 ? fr * 0.78 : fr;
    web.push([fx0 + Math.cos(a) * r, fy0 + Math.sin(a) * r]);
  }
  head.push(T(web, frill), F(T(web.slice(0, 5).map(([x, y]) => [lerp(fx0, x, 1), lerp(fy0, y, 1)]).concat([[fx0, fy0 + 2]]), frillD)));
  for (let i = 0; i <= 8; i += 2) {
    const a = rad(lerp(140, 290, i / 8));
    head.push(tube([[fx0 + Math.cos(a) * 2, fy0 + Math.sin(a) * 2], [fx0 + Math.cos(a) * (fr + 0.6), fy0 + Math.sin(a) * (fr + 0.6)]], [1.6, 0.9], i < 4 ? ST.sh : stone));
    head.push(F(E(fx0 + Math.cos(a) * (fr + 0.4), fy0 + Math.sin(a) * (fr + 0.4), 0.9, 0.9, i < 4 ? stone : stoneL)));
  }
  head.push(F(T(web.map(([x, y]) => [lerp(fx0, x, 0.5), lerp(fy0 + 1, y, 0.5)]), frillD)));

  // Skull: a big round head with a blunt snout, lit on the brow and snout top, shadowed at the
  // back and under the jaw.
  head.push(F(ov(X, Y, 8.9, 7.9, 0, edge(skin))), ...ball(X, Y, 8.4, 7.4, skin, 0, { sh: skinD, light: SK.hi, a0: 70, a1: 220 }));
  head.push(C(ov(X + 5.2, Y + 2.6, 4.8, 3.8, 0, skin)), F(ov(X + 5.6, Y + 0.6, 2.6, 0.9, -8, SK.hi)));
  // Jaw and chin in belly cream.
  head.push(F(ov(X + 3.4, Y + 5.5, 5.6, 1.9, 0, belly)), F(ov(X + 1.4, Y + 6, 3, 1.1, 0, BE.sh)));
  // Stone horns on the crown, leaning back: the front face lit, the back face in shadow.
  for (const [ox2, oy, s, ang] of [[-3.6, -5.6, 2.3, -150], [-0.4, -6.8, 2, -125], [2.6, -6.6, 1.5, -105]]) {
    const bx = X + ox2;
    const by2 = Y + oy;
    const a = rad(ang + (angry ? 12 : 0));
    const tipX = bx + Math.cos(a) * (s * 2.6);
    const tipY = by2 + Math.sin(a) * (s * 2.6);
    head.push(T([[bx - s, by2 + 1], [tipX, tipY], [bx + s, by2 + 1]], stone), F(T([[bx - s, by2 + 1], [tipX, tipY], [bx - s * 0.1, by2 + 0.9]], stoneD)), F(T([[bx + s * 0.2, by2 + 0.7], [tipX, tipY], [bx + s * 0.7, by2 + 0.8]], stoneL)));
  }
  // Brow scales: a ridge of little stones over the eyes, hunched lower when angry.
  const bl = angry ? 0.9 : hurt ? -0.6 : happy ? -0.4 : 0;

  // Face: round, all-iris reptile eyes (gold, a slit pupil, a dark rim and no white) that stare
  // wide at rest; angry, the lids drop into a glare, the iris burns orange and the slit thins;
  // hurt, it squeezes shut; happy, it squints up into arcs.
  const glance = idle ? 0.4 * Math.sin(p * TAU + 0.5) : 0;
  const lashC = '#2a3a26';
  const eyeF = [X + 0.4, Y - 0.4];
  const eyeN = [X + 5, Y - 0.6];
  const be = { shape: 'animal', iris: angry || A ? ['#8a2a08', '#ff8a2a', '#ffe08a'] : ['#7a4a0a', '#f6be32', '#fff0a6'], pupil: 'slit', pupilC: '#2a1a10', lashC, rim: 0.4, look: [glance, 0] };
  const act = { idle: {}, angry: { lid: 0.35, slant: 0.8, pupilK: 0.55 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  if (A && f === 0 && !dead && !hurt) Object.assign(act, { lid: 0.3, slant: 0.6, pupilK: 0.5 });
  if (dead) head.push(...deadEye(eyeF[0], eyeF[1], 1.4, { c: lashC }), ...deadEye(eyeN[0], eyeN[1], 1.7, { c: lashC }));
  else head.push(...eye(eyeF[0], eyeF[1], { ...be, ...act, s: -1, w: 1.8, h: 2.1 }), ...eye(eyeN[0], eyeN[1], { ...be, ...act, s: 1, w: 2.2, h: 2.4 }));
  head.push(C(T([[X - 2, Y - 3.2 + bl], [X - 1, Y - 4.8 + bl], [X + 1.8, Y - 5.4], [X + 4.4, Y - 5], [X + 7, Y - 3.8 + bl * 0.6], [X + 7.8, Y - 2.8 + bl], [X + 5.4, Y - 3.6 + bl * 0.4], [X + 3.6, Y - 3.8 + bl * 0.2], [X + 1.4, Y - 3.8 + bl * 0.4]], stone)));
  for (const [x, y] of [[X - 0.4, Y - 4.2], [X + 2, Y - 4.9], [X + 4.6, Y - 4.6], [X + 6.6, Y - 3.6]]) head.push(F(E(x + 0.2, y - 0.1 + bl * 0.5, 0.75, 0.42, stoneL)));
  if (!dead) head.push(...cheek(X - 0.4, Y + 3, 1.3, { on: skin, lines: happy ? 2 : 0 }));
  head.push(...snout(X + 9.3, Y + 1.2, { type: 'dot', r: 0.8, c: SK.deep }));

  // Mouth: a long reptile smile along the snout; angry, a snarl of little teeth; the lunge opens
  // it wide and the bite snaps it shut. Idle, a forked tongue flicks out to taste the air.
  const mx = X + 6.2;
  const my = Y + 4.4;
  const mo = { s: 1, ink: '#3a5a32' };
  const gape = A && !dead && !hurt ? A.gape : 0;
  const tongue = idle && !dead && !hurt ? bump(p, 0.17, 0.2) : 0;
  if (gape > 0) head.push(...mouth(mx, my - 0.4, { ...mo, type: 'shout', w: 3, h: 4, open: 1, teeth: 'both', fangs: 2 }));
  else if (gape < 0) head.push(...mouth(mx, my, { ...mo, type: 'flat', w: 3, tilt: 0.3, fangs: 1, fangAt: 0.6 }));
  else if (angry) head.push(...mouth(mx, my - 0.2, { ...mo, type: 'snarl', w: 2.8, h: 3, open: 1, teeth: 'top', fangs: 2, tongue: false }));
  else if (hurt) head.push(...mouth(mx, my, { ...mo, type: 'pained', w: 2.2, h: 2, open: 1 }));
  else if (dead) head.push(...mouth(mx, my, { ...mo, type: 'flat', w: 2.6, tongueOut: true, tongueLen: 1.6 }));
  else if (happy) head.push(...mouth(mx, my - 0.3, { ...mo, type: 'grin', w: 2.6, h: 2.8, open: 1, teeth: 'none' }));
  else head.push(...mouth(mx, my, { ...mo, type: 'smile', w: 2.8, curve: 0.3, tilt: 0.3 }));
  if (tongue > 0.2) {
    const tl = Math.min(1.4 + tongue * 1.6, (39.2 - X - 9.2) / 0.7);
    head.push(band([[X + 8.6, my - 0.2], [X + 8.6 + tl * 0.7, my + 0.3]], 0.67, '#ff7f9f'), band([[X + 8.6 + tl * 0.7, my + 0.3], [X + 9.2 + tl * 0.7, my - 0.3]], 0.5, '#ff7f9f'), band([[X + 8.6 + tl * 0.7, my + 0.3], [X + 9.2 + tl * 0.7, my + 0.9]], 0.5, '#ff7f9f'));
  }
  if (angry) head.push(...vein(X - 2.6, Y - 1.4, 0.8));
  if (hurt) head.push(...sweat(X - 3, Y - 3, 1), ...tear(eyeN[0] + 1.4, eyeN[1] + 1.8, 0.8, { type: 'stream', len: 2.2 }));
  if (gape < 0) head.push(...star(X + 8.2, my + 1.8, 1.8, '#fff2a8'));
  // The lunge's smear: the snout's path from where the head was to where it bites.
  if (A && f === 1 && !dead) out.push(smear([[X - 6, Y - 4], [X - 1, Y - 1], [X + 5, Y + 2.4]], 4.4, mix(SK.hi, '#ffffff', 0.45)));
  out.push(...spin(head, neck[0], neck[1], tilt));
  return { w: W, h: H, res: 3, shapes: shift(shift(out, ox, 0), 0, 2) };
}

// ---------- Manticore Cub (scorpip) ----------

// Attack: the tail stab. tail: the tail's path from the rump to the stinger; by: crouch,
// flap: wings, hx/hy: head, imp: the stab lands.
const SCO_ATK = [
  // Wind-up: crouched low, tail cocked far back and high, wings raised.
  { tail: [[12, 28], [7, 25], [3.6, 18], [3.4, 10.4], [7, 5], [12.4, 3.6]], by: 1.8, flap: -24, hx: -1.2, hy: 1.4, imp: 0 },
  // Strike: the tail whips over the head.
  { tail: [[12, 28], [8.6, 23], [9.6, 14], [16, 6.6], [26, 3.4], [35, 4.4]], by: 0.4, flap: 10, hx: 0.6, hy: 0.6, imp: 0 },
  // Stab: the stinger drives down in front of its face.
  { tail: [[12, 28], [9, 22.6], [12.6, 13], [21, 4.6], [32, 3], [38.6, 10.6]], by: 0.2, flap: 4, hx: 0.6, hy: 0.8, imp: 1 },
  // Recover: the tail curls back.
  { tail: [[12, 28], [7.5, 26], [6.4, 19.4], [8.4, 12.4], [13.4, 8.4], [19, 7.8]], by: 0.4, flap: -4, hx: 0, hy: 0.2, imp: 0 },
];

function scorpip(pose, f, mood) {
  const W = 46;
  const H = 38;
  const G = H;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? SCO_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const fur = '#f4c27e';
  const furD = shade(fur, -12);
  const cream = '#fff0d4';
  const mane = angry || A ? '#e8623e' : '#e5774c';
  const maneD = shade(mane, -14);
  const maneL = mix(mane, '#ffd0a0', 0.45);
  const wing = '#e79bb4';
  const wingD = shade(wing, -16);
  const shell = '#8e5ca8';
  const shellL = mix(shell, '#ffffff', 0.35);
  const sting = '#ffd65a';
  // A prowl: low and slinky, one paw at a time, the shoulders rolling while the head stays level.
  const by = dead ? 3 : walk ? 0.25 * Math.cos(p * TAU * 4) + 0.5 : A ? A.by : wave(p) * 0.35;
  const roll = walk ? Math.sin(p * TAU) : 0;
  const hx = (hurt ? -1.6 : 0) + (walk ? 0.4 * Math.sin(p * TAU * 2) : 0) + (A ? A.hx : 0);
  const look = idle ? bump(p, 0.33, 0.3) - bump(p, 0.83, 0.2) * 0.6 : 0;
  const hy = (dead ? 4.6 : hurt ? -1 : 0) + (walk ? 0.4 + 0.15 * Math.sin(p * TAU * 2 + 0.8) : by + (idle ? wave(p + 0.2) * 0.3 : 0)) + (A ? A.hy : 0);
  const out = [];

  // The scorpion tail: armored segments arching over the back to a hooked stinger, swaying
  // slowly; idle, the stinger tip twitches like a cat's tail.
  const sway = dead ? 0 : walk ? Math.sin(p * TAU - 1.2) : wave(p) * 0.6;
  const flick = idle ? bump(p, 0.5, 0.22) : 0;
  const rise = angry ? -2 : 0;
  const tailPts = dead
    ? [[13, 29 + by], [10, 31.6], [8.4, 33.6], [8.2, 35.2]]
    : A ? A.tail.map(([x, y], i) => [x, y + (i < 2 ? by : 0)])
    : [[12, 28 + by], [7.5, 26 + by], [5.4 + sway * 0.3, 20 + by], [7 + sway * 0.7, 13.4 + rise], [11.6 + sway, 9.6 + rise - flick * 1.4], [17 + sway + flick * 1.2, 8.6 + rise - flick * 2.4]];
  const tailShapes = [];
  const segs = along(tailPts, 9);
  segs.forEach(([x, y, a], i) => {
    const r = lerp(2.7, 1.5, i / 8);
    tailShapes.push(...ovL(x, y, r, r * 0.85, (a * 180) / Math.PI, shell, 0.45), F(ov(x - 0.2, y - r * 0.35, r * 0.6, r * 0.3, (a * 180) / Math.PI, shellL)));
  });
  {
    const [x, y, a] = segs[8];
    const ang = (a * 180) / Math.PI;
    const hook = turn([[x - 1.2, y - 1.6], [x + 3.4, y - 1.6], [x + 5.8, y + 0.8], [x + 5.4, y + 4.4], [x + 4.6, y + 1.8], [x + 2.6, y + 1.6], [x - 0.6, y + 1.6]], x, y, dead ? ang : A ? ang * (f === 2 ? 0.9 : 0.6) : Math.max(-20, Math.min(20, ang)) * 0.4);
    tailShapes.push(F(T(hook.map(([px, py]) => [px + (px - x) * 0.12, py + (py - y) * 0.12]), edge(sting))), T(hook, sting), F(E(hook[2][0] - 1, hook[2][1] - 0.6, 0.8, 0.6, '#fff6c8')));
    if (angry || A) tailShapes.push(F(E(hook[3][0], hook[3][1] + 1, 0.7, 0.9, '#c6ff7a')));
    if (A && A.imp) tailShapes.push(...star(Math.min(hook[3][0] + 0.6, 43.6), hook[3][1] + 1.2, 2.4, '#e6ffb0'));
  }
  // Over the back it sits behind the body; whipped over the head it comes in front.
  const tailFront = A && (f === 1 || f === 2);
  if (!tailFront) out.push(...tailShapes);

  // Wings: small bat wings that flick as it prowls and fold and flutter when idle.
  const flap = dead ? -28 : A ? A.flap : walk ? wave(p * 2 - 0.15) * 8 - 4 : wave(p) * 5 + (angry ? -10 : 0) - bump(p, 0.67, 0.2) * 10;
  const wingShape = (rx, ry, a, c, cd, s) => {
    const pts = [[rx, ry], [rx - 2.4 * s, ry - 6.4], [rx - 5 * s, ry - 9.6], [rx - 11.6 * s, ry - 9.4], [rx - 9.4 * s, ry - 6.4], [rx - 12.4 * s, ry - 3.6], [rx - 9.2 * s, ry - 2], [rx - 9.6 * s, ry + 1.2], [rx - 6.4 * s, ry - 0.2], [rx - 4.6 * s, ry + 2], [rx - 2 * s, ry + 1.2]];
    const w = turn(pts, rx, ry, a);
    const elbow = w[2];
    return [T(w, c), ...stroke([w[0], w[1], elbow], 0.9, cd), ...stroke([elbow, w[3]], 0.55, cd), ...stroke([elbow, w[5]], 0.5, cd), ...stroke([elbow, w[7]], 0.45, cd), F(T([[elbow[0] + 0.5, elbow[1]], [elbow[0] + 1.6, elbow[1] - 1.6], [elbow[0] + 0.2, elbow[1] - 0.8]], cream))];
  };
  out.push(...wingShape(23 + hx * 0.3, 21.5 + by + roll * 0.4, flap - 6, wingD, shade(wingD, -16), 1));

  // Legs: short, chubby cub legs with big paws, set down one after another.
  const legPhase = { fb: 0, ff: 0.25, nb: 0.5, nf: 0.75 };
  const leg = (key, hipX, hipY, near, front) => {
    const [dx, lift] = dead ? [front ? 2.6 : -2.6, 0] : walk ? gait(p + legPhase[key], 10.4, 2.4, 0.6) : [0, 0];
    const fx = hipX + dx + (front ? 0.6 : 0) + (A && front ? [-1, 1.6, 1.6, 0.4][f] : 0);
    const fy = G - 1.7 + lift;
    const kn = knee(hipX, hipY, fx, fy, 4.4, 4.2, front ? 1 : -1);
    const c = near ? fur : furD;
    const parts = near ? [...tubeL([[hipX, hipY], kn, [fx, fy]], [5.6, 4.4, 4], c, 4, 0.6), ...ovL(fx + 0.8, fy + 0.2, 2.9, 1.6, 0, c)] : [tube([[hipX, hipY], kn, [fx, fy]], [5.6, 4.4, 4], c), ov(fx + 0.8, fy + 0.2, 2.9, 1.6, 0, c)];
    if (near) parts.push(...stroke([[fx + 1.6, fy - 0.4], [fx + 1.6, fy + 1.2]], 0.35, edge(c)), ...stroke([[fx + 2.7, fy - 0.2], [fx + 2.7, fy + 1.2]], 0.35, edge(c)));
    return parts;
  };
  // The shoulder blades and hips rise and fall in turn as each leg pushes.
  const sh = (front) => (walk ? (front ? -0.5 : 0.5) * roll : 0);
  out.push(...leg('fb', 15, 29 + by + sh(false), false, false), ...leg('ff', 27.5, 29 + by + sh(true), false, true));

  // Body: a round cub belly, a cream tummy, and a tuft of fur on the rump.
  out.push(...ball(20.5, 27.6 + by, 11, 7.2, fur));
  out.push(F(E(22, 31.6 + by, 7.4, 2.8, cream)), C(T([[10, 23 + by], [8, 21.6 + by], [10.4, 21 + by], [9.4, 19.6 + by], [12.6, 20.6 + by]], fur)));
  // Faint spots on the back, and the shoulder blade rolling under the skin.
  for (const [x, y] of [[14, 23.4], [17.6, 22.4], [13.4, 27.2]]) out.push(F(ov(x, y + by, 1.2, 0.7, -20, furD)));
  if (walk) out.push(F(ov(26.4, 22.6 + by + sh(true), 2.6, 1, -10, mix(fur, '#ffffff', 0.3))));
  out.push(...leg('nb', 14, 30 + by + sh(false), true, false), ...leg('nf', 26.5, 30 + by + sh(true), true, true));

  // Near wing over the shoulder, its beat a touch behind the far one.
  const flapN = dead ? -28 : A ? A.flap : walk ? wave(p * 2 - 0.25) * 8 - 4 : wave(p - 0.08) * 5 + (angry ? -10 : 0) - bump(p, 0.7, 0.2) * 12;
  out.push(...wingShape(20.5 + hx * 0.3, 23 + by + roll * 0.4, flapN + 4, wing, wingD, 1));

  // The mane: a fluffy flame of rusty fur around the head that bristles when angry.
  const X = 33.4 + hx;
  const Y = 18.6 + hy;
  const tilt = dead ? 18 : hurt ? -8 : idle ? -look * 6 : A ? [10, -4, 4, 0][f] : 0;
  const ruff = [];
  const ruffIn = [];
  const n = 13;
  const big = angry || A ? 1.14 : 1;
  for (let i = 0; i < n; i++) {
    const a = rad(lerp(70, 330, i / (n - 1)));
    const lag = walk ? Math.sin(p * TAU * 2 - 1.2 - i * 0.4) * 0.5 : wave(p - i * 0.05) * 0.35;
    const r1 = (11.2 + lag) * big;
    const r0 = 8.4 * big;
    ruff.push([X - 1.4 + Math.cos(a) * r1, Y + Math.sin(a) * r1 * 0.92]);
    const am = rad(lerp(70, 330, (i + 0.5) / (n - 1)));
    if (i < n - 1) ruff.push([X - 1.4 + Math.cos(am) * r0, Y + Math.sin(am) * r0 * 0.92]);
    ruffIn.push([X - 1 + Math.cos(a) * r1 * 0.72, Y + Math.sin(a) * r1 * 0.68]);
  }
  out.push(T([[X + 3, Y + 6], ...ruff, [X + 5, Y - 6]], mane));
  out.push(F(T([[X + 2, Y + 5], ...ruffIn, [X + 4, Y - 5]], maneL)));
  for (let i = 1; i < n - 1; i += 2) {
    const [x, y] = ruff[i * 2];
    out.push(...stroke([[lerp(X, x, 0.62), lerp(Y, y, 0.62)], [lerp(X, x, 0.86), lerp(Y, y, 0.86)]], 0.45, maneD));
  }
  // Round cub ears poking out of the mane, flattening when angry; idle, the near one flicks.
  const eflick = idle ? bump(p, 0.17, 0.2) : 0;
  for (const [ex, ey, s, k] of [[X - 4.2, Y - 8.4, 1, 0], [X + 3.2, Y - 9.2, 0.9, 1]]) {
    const flat = angry || A ? 1.4 : 0;
    const fe = k ? eflick * 1 : 0;
    out.push(...ovL(ex - flat * 0.6 - fe * 0.4, ey + flat + fe * 0.6, 2.9 * s, (2.7 - flat * 0.5) * s, 0, fur), F(E(ex + 0.2 - flat * 0.6 - fe * 0.4, ey + 0.4 + flat + fe * 0.6, 1.6 * s, (1.5 - flat * 0.3) * s, '#ffb3b8')));
  }

  // Head.
  out.push(F(ov(X, Y, 8.4, 7.6, tilt, edge(fur))), ...ball(X, Y, 7.9, 7.1, fur, tilt));
  // Forehead tuft of mane falling between the ears.
  out.push(C(T([[X - 4, Y - 6.2], [X - 1.6, Y - 8], [X + 1.2, Y - 7.2], [X + 0.4, Y - 4.4], [X - 0.8, Y - 5.6], [X - 2, Y - 3.8]], mane)));
  // Muzzle, nose, chin.
  out.push(...ovL(X + 5.4, Y + 3.4, 3.8, 2.8, tilt, cream, 0.35), F(T([[X + 7, Y + 1.3], [X + 9.6, Y + 1.1], [X + 8.4, Y + 2.9]], '#e8708a')), F(E(X + 7.8, Y + 1.5, 0.5, 0.3, '#ffc4d0')));
  // Whisker dots and whiskers.
  for (const [x, y] of [[X + 4.6, Y + 3], [X + 5.6, Y + 3.8], [X + 4.4, Y + 4.4]]) out.push(F(E(x, y, 0.28, 0.28, shade(fur, -30))));
  const wh = idle ? bump(p, 0.83, 0.2) * 0.6 : 0;
  out.push(...stroke([[X + 9.4, Y + 3.4], [X + 12, Y + 2.6 - wh]], 0.3, shade(fur, -35)), ...stroke([[X + 9.4, Y + 4.4], [X + 11.8, Y + 4.8 - wh]], 0.3, shade(fur, -35)));

  // Eyes: big teal cat eyes; the pupils open round when calm and narrow to slits when angry.
  const glance = idle ? 0.45 * Math.cos(p * TAU) : 0;
  const eo = { round: 0.7, lower: 0.85, slant: 0.35, iris: '#5fd0c4', irisL: '#c8fff4', glow: '#ffb02e', glowL: '#fff09a', aura: '#fff09a', pupil: 'cat', brow: maneD, look: [glance, look * -0.3], squint: 0.66 };
  out.push(...peeper(X + 0.6, Y - 0.6, mood, -1, { ...eo, w: 2.3, h: 2.3 }), ...peeper(X + 5.7, Y - 0.8, mood, 1, { ...eo, w: 1.45, h: 2 }));
  if (!dead) out.push(F(E(X - 1.4, Y + 2.8, 1.5, 0.75, BLUSH)));

  // Mouth.
  const mx = X + 7;
  const my = Y + 4.2;
  if (A && f === 0 && !dead && !hurt) {
    // A hissing snarl through bared fangs.
    out.push(F(T([[mx - 2.8, my - 0.2], [mx + 1.6, my - 0.4], [mx + 1, my + 1.6], [mx - 2.2, my + 1.4]], MOUTH)), F(R(mx - 2.4, my - 0.2, 3.6, 0.7, '#ffffff')), F(R(mx - 2, my + 0.9, 3, 0.6, '#ffffff')));
  } else if (angry) {
    out.push(F(T([[mx - 2.8, my - 0.2], [mx + 1.6, my - 0.4], [mx + 0.8, my + 2.6], [mx - 2, my + 2.4]], MOUTH)),
      F(T([[mx - 2.4, my - 0.2], [mx - 1.7, my + 1.6], [mx - 1.1, my - 0.2]], '#ffffff')), F(T([[mx + 0.2, my - 0.3], [mx + 0.8, my + 1.4], [mx + 1.4, my - 0.4]], '#ffffff')));
  } else if (hurt) {
    out.push(F(E(mx - 0.6, my + 0.8, 1.1, 1.2, MOUTH)));
  } else if (dead) {
    out.push(...stroke([[mx - 2.6, my + 0.4], [mx + 1, my + 0.2]], 0.45, INK), F(E(mx - 0.4, my + 1.4, 0.7, 1, '#ff8fa8')));
  } else if (mood === 'happy') {
    out.push(F(T([[mx - 2.4, my - 0.2], [mx + 1.4, my - 0.3], [mx - 0.4, my + 2.2]], MOUTH)), F(E(mx - 0.4, my + 1.3, 0.8, 0.5, '#ff9fb0')));
  } else {
    out.push(arc(mx - 1.6, my - 0.3, 0.9, 0.9, 20, 160, 0.35, INK), arc(mx + 0.2, my - 0.3, 0.9, 0.9, 20, 160, 0.35, INK));
  }
  if (tailFront) out.push(...tailShapes);
  if (hurt) out.push(F(E(43.6, 6, 0.8, 1.2, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: out };
}

// A pointed leaf from its stem (x, y), `len` long and `wid` wide, pointing at angle `a` degrees.
function leaf(x, y, len, wid, a, c, vein = true) {
  const pts = turn([[x, y], [x + len * 0.3, y - wid * 0.5], [x + len * 0.7, y - wid * 0.42], [x + len, y], [x + len * 0.7, y + wid * 0.42], [x + len * 0.3, y + wid * 0.5]], x, y, a);
  const out = [blob(pts, c, 3)];
  if (vein && len > 3) out.push(...stroke(turn([[x + len * 0.12, y], [x + len * 0.8, y]], x, y, a), 0.3, shade(c, -16)));
  return out;
}

// ---------- Dryad (leafling) ----------

// Attack: a vine whip cracked off the end of her staff. st: staff angle, sx: hand shift,
// lean: body lean, vine: the vine's path from the staff tip (relative), crack: the snap.
const DRY_ATK = [
  // Wind-up: staff drawn back over her shoulder, the vine trailing behind, leaning back.
  { st: -46, sx: -4.6, sy: -5, lean: -1.6, vine: [[-3, -2], [-7, 1], [-9.6, 5.6], [-9, 10]], crack: 0 },
  // Whip: the staff swings over, the vine arcing high overhead.
  { st: 6, sx: -3.4, sy: -3, lean: 0.8, vine: [[2, -3.6], [5.6, -3.8], [8, -1], [8.4, 2.6]], crack: 0 },
  // Crack: the vine lashes out straight and snaps at the tip.
  { st: 22, sx: -5, sy: -1.4, lean: 1.4, vine: [[2.8, 1.4], [4.4, 6.4], [5.2, 11.6], [5.6, 17]], crack: 1 },
  // Recover: the vine curls back toward the staff.
  { st: 12, sx: -1.4, sy: -1, lean: 0.4, vine: [[2, 0], [3.2, 3], [1.6, 5.2], [0, 4]], crack: 0 },
];

function leafling(pose, f, mood) {
  const W = 36;
  const H = 46;
  const G = H;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? DRY_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  const wilt = (c) => (dead ? mix(c, '#c9a36a', 0.45) : c);
  const skin = '#e4f6d2';
  const bark = '#b98a66';
  const barkD = shade(bark, -14);
  const leafA = wilt('#7cc96e');
  const leafB = wilt('#9be08a');
  const leafC = wilt('#5eaf62');
  const leafL = wilt('#c4f0b0');
  // A graceful glide: barely any bob, a sway from the hips, everything soft trailing after.
  const bob = walk ? 0.35 * Math.cos(p * TAU * 2) - 0.2 : idle ? wave(p) * 0.4 : 0;
  const lean = hurt ? -1.6 : dead ? 1 : walk ? 0.8 + 0.4 * Math.sin(p * TAU) : A ? A.lean : 0.3 * Math.sin(p * TAU - 0.5);
  const by = bob + (dead ? 2.4 : 0);
  const out = [];
  const hip = [16.6 + lean * 0.3, 37 + by];

  // Legs: slim bark legs with root toes, gliding in small steps under the skirt.
  const leg = (ph, near) => {
    const [dx, lift] = dead ? [near ? 2 : -2, 0] : walk ? gait(p + ph, 8.8, 1.6, 0.55) : A ? [near ? [1.4, 2.6, 3, 1.6][f] : -1.6, 0] : [near ? 1.2 : -1.2, 0];
    const hx = hip[0] + (near ? 1.2 : -1.2);
    const fx = hx + dx;
    const fy = G - 1.4 + lift;
    const kn = knee(hx, hip[1], fx, fy, 4.4, 4.4, -1);
    const c = near ? bark : barkD;
    // Toes point down as the foot lifts, like a dancer's.
    const toe = lift < -0.3 ? 0.8 : 0;
    return [...tubeL([[hx, hip[1]], kn, [fx, fy]], [3, 2.4, 2], c, 4, 0.5), ...ovL(fx + 0.9, fy + 0.4 + toe * 0.3, 2, 1.1, toe * 20, c, 0.4), ...stroke([[fx + 1.8, fy + 0.8 + toe * 0.5], [fx + 3, fy + 1.1 + toe]], 0.6, c, false)];
  };
  out.push(...leg(0.5, false));

  // Long leafy hair trailing behind, lagging the head and streaming in the glide.
  const X = 17 + lean;
  const Y = 16.6 + by * 0.9 + (dead ? 2.2 : 0) + (hurt ? -0.6 : 0);
  const lag = (i) => (walk ? Math.sin(p * TAU * 2 - 1.4 - i * 0.6) * 5 - 6 : idle ? wave(p - i * 0.12) * 5 : A ? [10, -14, -10, -2][f] * (0.6 + i * 0.1) : 0) + (dead ? 25 : 0) + (angry ? -8 : 0);
  for (let i = 0; i < 5; i++) {
    const a = 100 + i * 14 + lag(i);
    out.push(...leaf(X - 6 + i * 0.4, Y + 1 - i * 1.2, 9 - i * 0.6, 4.6, a, i % 2 ? leafC : leafA, false));
  }
  out.push(E(X - 0.6, Y - 0.8, 10.6, 9.8, leafC));

  // The back arm swinging softly, opposite the near leg.
  const swing = walk ? Math.cos(p * TAU) * 1.8 : wave(p) * 0.4;
  const sh = [X - 3.4, 29 + by];
  out.push(...tubeL([sh, [sh[0] - 1.6 - swing * 0.5, sh[1] + 3.4], [sh[0] - 1.2 - swing, sh[1] + 6.2]], [2.2, 1.9, 1.7], barkD, 4, 0.5), E(sh[0] - 1.2 - swing, sh[1] + 6.6, 1.3, 1.2, barkD));

  // Dress of layered leaves, flowing back and swishing a beat behind her hips.
  const sw = walk ? Math.sin(p * TAU * 2 - 1.6) * 4 - 3 : A ? [6, -6, -8, -2][f] : wave(p - 0.15) * 2.4;
  const skirt = [];
  for (let i = 0; i < 6; i++) {
    const a = 96 - (i - 2.5) * 16 + sw * (i % 2 ? 1 : -0.6) + (walk ? 6 : 0);
    skirt.push(...leaf(X + (i - 2.5) * 1.3 - 0.4, 30.4 + by, 8.6 - Math.abs(i - 2.5) * 0.6, 5, a, i % 2 ? leafB : leafA));
  }
  out.push(...skirt);
  // A small bodice with a bark belt.
  out.push(...ovL(X - 0.4, 29.2 + by, 3.8, 3.4, 0, leafA, 0.4), F(R(X - 4, 30.6 + by, 7.4, 1.2, bark)), F(E(X + 1, 31.2 + by, 0.9, 0.9, '#ffb3c8')));
  // Front leaves of the skirt.
  for (let i = 0; i < 3; i++) out.push(...leaf(X - 1.6 + i * 1.8, 31.4 + by, 6.6, 3.6, 92 - (i - 1) * 22 + sw * 0.6 + (walk ? 4 : 0), i === 1 ? leafB : leafA));
  out.push(...leg(0, true));

  // The twig staff, held out front: knots, a curl, a little leaf, and a glowing bud.
  const sx = X + 10.6 + (walk ? Math.sin(p * TAU) * 0.6 : 0) + (A ? A.sx : 0);
  const sy = 31 + by + (A ? A.sy : 0);
  const st = dead ? 14 : hurt ? -10 : A ? A.st : walk ? Math.sin(p * TAU - 0.6) * 3 + 2 : wave(p) * 1.4 - bump(p, 0.5, 0.25) * 4;
  const staff = turn([[sx - 0.8, sy + 13], [sx, sy + 4], [sx - 0.2, sy - 6], [sx + 0.6, sy - 13], [sx + 0.1, sy - 16.4]], sx, sy, st);
  out.push(...tubeL(staff, [1.2, 1.6, 1.6, 1.4, 1], bark, 4, 0.5));
  const top = staff[4];
  const mid = staff[3];
  out.push(...tubeL([mid, [mid[0] + 2, mid[1] - 1.4], [mid[0] + 2.4, mid[1] - 3]], [0.9, 0.7, 0.5], bark, 3, 0.4), ...leaf(mid[0] - 0.2, mid[1] + 1.6, 3.6, 2.2, 200 + st, leafB, false));
  for (const k of [1, 2]) out.push(F(E(staff[k][0] + 0.2, staff[k][1] - 1.2, 0.5, 0.6, barkD)));
  // The bud's glow breathes in and out.
  const pulse = idle ? wave(p) * 0.6 : walk ? wave(p * 2) * 0.3 : A ? [1.2, 0.4, 0.8, 0][f] : 0;
  const budC = angry || A ? '#ff5fa8' : dead ? '#c8a8a0' : '#ffb6d8';
  if (!dead) out.push(F(E(top[0], top[1] - 2, 3.6 + pulse + (angry ? 1 : 0), 3.6 + pulse + (angry ? 1 : 0), angry || A ? '#ffd0e8' : '#fff4c8')));
  out.push(...leaf(top[0], top[1], 2.6, 2, 210 + st, leafA, false), ...leaf(top[0], top[1], 2.6, 2, 330 + st, leafA, false));
  out.push(...ovL(top[0], top[1] - 2, 1.9, 2.6, st, budC, 0.4), F(ov(top[0] - 0.6, top[1] - 2.8, 0.6, 1, st, '#ffffff')));
  // A twinkle drifts off the bud.
  const tw = idle ? p : walk ? (p * 2) % 1 : -1;
  if (!dead && tw >= 0 && tw < 0.6) {
    const kx = top[0] + 3.6 + tw * 1.6;
    const ky = top[1] - 4.4 - tw * 4;
    out.push(...star(Math.min(kx, 34), ky, 1.3 - tw, '#fff6b0'));
  }
  // The vine: it sprouts from the bud and whips out.
  if (A && !dead) {
    const vp = [[top[0], top[1] - 1.4], ...A.vine.map(([dx, dy]) => [Math.min(34.4, top[0] + dx), Math.min(G - 0.8, top[1] + dy)])];
    out.push(...tubeL(vp, [1.4, 1.2, 1, 0.8, 0.6], leafC, 4, 0.4));
    for (const k of [1, 3]) out.push(...leaf(vp[k][0], vp[k][1], 2.4, 1.6, k === 1 ? -60 : 40, leafB, false));
    if (A.crack) out.push(...star(Math.min(33.4, vp[4][0]), vp[4][1] - 0.6, 2.6, '#fff6b0'), ...star(Math.min(33.4, vp[4][0]) - 3, vp[4][1] - 3.4, 1.2, '#ffd0e8'));
  }

  // Front arm, hand wrapped around the staff.
  const hand = [sx - 0.1, sy];
  out.push(...tubeL([[X + 2.6, 28.6 + by], [lerp(X + 2.6, hand[0], 0.55) + 0.8, lerp(28.6 + by, hand[1], 0.55) + 1.2], hand], [2.2, 2, 1.8], bark, 4, 0.5), ...ovL(hand[0], hand[1], 1.4, 1.3, 0, bark, 0.4));

  // Head and face; idle, she tips her head as if listening to the woods.
  const head = [];
  head.push(F(E(X, Y, 8.8, 8.4, edge(skin))), E(X, Y, 8.3, 7.9, skin), F(E(X - 2.6, Y - 4, 3.4, 1.6, '#f6fff0')));
  // A pointed leaf-ear, twitching.
  const et = idle ? bump(p, 0.17, 0.2) * 14 : walk ? Math.sin(p * TAU * 2 - 2) * 5 : 0;
  head.push(...leaf(X - 4.8, Y + 1, 4.4, 2.8, 200 + (angry ? -15 : 0) - et, skin, false));
  // Leaf hair: a crown of overlapping leaves and bangs that shade the brow, rustling.
  const rustle = walk ? Math.sin(p * TAU * 2 - 1.2) * 5 : idle ? wave(p) * 4 : A ? [6, -6, -4, 0][f] : 0;
  const crown = [[-8, -2, 150], [-7, -6, 165], [-4, -9, 200], [0, -10, 245], [4, -9.4, 285], [7, -7, 315], [8.6, -3, 345]];
  crown.forEach(([dx, dy, a], i) => head.push(...leaf(X + dx * 0.6, Y + dy * 0.6, angry ? 7.4 : 6.4, 4.4, a + rustle * (i % 2 ? 1 : -0.6), i % 2 ? leafB : leafA)));
  // Bangs: a solid cap of leaves, then pointed leaf-tips falling over the brow.
  head.push(blob([[X - 8.4, Y - 1.4], [X - 7, Y - 7], [X - 1, Y - 9.6], [X + 6, Y - 8], [X + 8.8, Y - 3.4], [X + 4, Y - 5.2], [X - 4, Y - 5]], leafA));
  const fringe = [[-6.6, -4.6, 112, leafC], [-3.4, -5.4, 100, leafA], [-0.2, -5.8, 86, leafB], [3, -5.4, 74, leafA], [6, -4.6, 60, leafB]];
  fringe.forEach(([dx, dy, a, c], i) => head.push(...leaf(X + dx, Y + dy, 4.4 - Math.abs(i - 2) * 0.4, 3.2, a + rustle * 0.3, c, false).map((sh2) => C(sh2))));
  head.push(F(E(X - 2.6, Y - 7, 2.6, 1, leafL)), F(E(X + 2.6, Y - 7.6, 1.2, 0.6, leafL)));
  // A sprout curling up from the crown, bobbing a beat behind each step.
  const sp = walk ? Math.sin(p * TAU * 2 - 2.2) * 10 : idle ? wave(p - 0.1) * 8 : A ? [16, -18, -12, 4][f] : 0;
  const sprout = turn([[X + 0.4, Y - 9], [X + 1, Y - 12], [X + 0.2, Y - 14]], X + 0.4, Y - 9, sp + (dead ? 50 : 0));
  head.push(...tubeL(sprout, [0.9, 0.7, 0.6], leafC, 3, 0.4), ...leaf(sprout[2][0], sprout[2][1], 3.6, 2.4, -150 + sp, leafB, false), ...leaf(sprout[2][0], sprout[2][1], 3.2, 2.2, -30 + sp, leafA, false));
  // A pink blossom tucked in the hair.
  const fx = X - 5.4;
  const fy = Y - 5.6;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + (walk ? p : idle ? p * 0.5 : 0);
    head.push(F(E(fx + Math.cos(a) * 1.4, fy + Math.sin(a) * 1.4, 1.2, 1.2, dead ? '#d8b8a8' : '#ffb6d0')));
  }
  head.push(F(E(fx, fy, 0.8, 0.8, '#ffe36b')));

  // Eyes: elegant green eyes with a soft wing of liner and two little leaf lashes.
  const cx = X + 2.2;
  const cy = Y + 1.8;
  const glance = idle ? 0.35 * Math.sin(p * TAU + 1) : 0;
  const lash = (c, s, shut) => [...leaf(c[0] - s * 0.2, c[1] + (shut ? 0.2 : 0), 1.8, 1, s > 0 ? (shut ? 10 : -40) : shut ? 170 : 220, leafC, false), ...leaf(c[0] - s * 0.8, c[1] - (shut ? 0 : 0.6), 1.5, 0.9, s > 0 ? (shut ? 40 : -75) : shut ? 140 : 255, leafA, false)];
  const de = { round: 0.62, lower: 0.85, slant: 0.2, sclera: '#ffffff', iris: '#3f9a5a', irisL: '#a8f0b0', glow: '#ff5fa8', glowL: '#ffd0e8', pupil: 'round', irisW: 0.7, lash, brow: '#5a8a4a', look: [glance, 0.1], squint: 0.7, lw: 0.45 };
  head.push(...peeper(cx - 3, cy, mood, -1, { ...de, w: 1.6, h: 1.95 }), ...peeper(cx + 3, cy, mood, 1, { ...de, w: 1.75, h: 2.1 }));
  if (!dead) head.push(F(E(cx - 4.2, cy + 2.8, 1.4, 0.65, BLUSH)), F(E(cx + 4.2, cy + 2.9, 1.4, 0.65, BLUSH)));
  const my = cy + 3;
  if (A && A.crack && !dead && !hurt) {
    head.push(F(T([[cx - 1.1, my - 0.3], [cx + 1.1, my - 0.3], [cx + 0.6, my + 1.2], [cx - 0.6, my + 1.2]], MOUTH)), F(R(cx - 0.9, my - 0.3, 1.8, 0.45, '#ffffff')));
  } else if (angry) {
    head.push(F(T([[cx - 1.2, my - 0.3], [cx + 1.2, my - 0.3], [cx + 0.6, my + 0.9], [cx - 0.6, my + 0.9]], MOUTH)), F(T([[cx + 0.1, my - 0.3], [cx + 0.9, my - 0.3], [cx + 0.5, my + 0.5]], '#ffffff')));
  } else if (hurt) {
    head.push(F(E(cx, my + 0.3, 0.6, 0.75, MOUTH)));
  } else if (dead) {
    head.push(...stroke([[cx - 0.9, my + 0.3], [cx - 0.3, my], [cx + 0.3, my + 0.3], [cx + 0.9, my]], 0.4, INK));
  } else if (happy) {
    head.push(F(T([[cx - 1.1, my - 0.3], [cx + 1.1, my - 0.3], [cx, my + 1.1]], MOUTH)));
  } else {
    head.push(arc(cx, my - 0.5, 0.9, 0.7, 25, 155, 0.4, INK));
  }
  if (angry) head.push(F(E(X + 7.2, Y - 1, 0.5, 0.5, '#ff6b9a')));
  const tip = idle ? bump(p, 0.5, 0.34) * 4 : walk ? Math.sin(p * TAU) * 1.5 : A ? [-4, 3, 5, 1][f] : 0;
  out.push(...spin(head, X, Y + 7, tip));
  if (hurt) out.push(F(E(X + 9, Y - 6, 0.8, 1.2, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: shift(out, 1, 0) };
}

// ---------- Warg (boarlet) ----------

// Attack: a pounce and bite. by: body height, pitch: nose down (+) or up (-), ox: body shift,
// fore/hind: [dx, lift] of the paws, gape: jaw, imp: the bite lands.
const WARG_ATK = [
  // Wind-up: crouched low, haunches gathered, head down, snarling.
  { by: 3, pitch: 5, ox: -2, fore: [1.6, 0], hind: [3, 0], gape: 1.6, imp: 0 },
  // Pounce: launched forward, nose up, forelegs reaching, jaws wide.
  { by: -2.4, pitch: -9, ox: 0.6, fore: [5, -4.6], hind: [-5, -1.6], gape: 3.4, imp: 0 },
  // Bite: landing nose-down, jaws snapped shut.
  { by: 1, pitch: 8, ox: 0.4, fore: [4, 0], hind: [-3, -1.2], gape: 0.2, imp: 1 },
  // Recover.
  { by: 0.6, pitch: 2, ox: -0.6, fore: [1.4, 0], hind: [0, 0], gape: 0.8, imp: 0 },
];

function boarlet(pose, f, mood) {
  const W = 54;
  const H = 38;
  const G = H;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? WARG_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const fur = '#9ea6d2';
  const furD = shade(fur, -13);
  const furDD = shade(fur, -24);
  const ruff = '#e8e6f6';
  const ruffD = shade(ruff, -10);
  const scar = '#ff9fb4';
  const out = [];
  // A loping trot: the body rocks nose-down as the front paws land, then rises as the hind legs
  // drive; idle, it pants and its sides heave.
  const pitch = dead ? 4 : hurt ? -6 : walk ? Math.sin(p * TAU - 0.3) * 5 : A ? A.pitch : 0;
  const by = dead ? 4.6 : walk ? -Math.sin(p * TAU * 2 + 0.6) * 0.9 - 0.4 : A ? A.by : wave(p * 2) * 0.35;
  const ox = A ? A.ox : 0;
  const cx = 26 + ox;
  const cy = 23 + by;
  const rot = (pts) => turn(pts.map(([x, y]) => [x + ox, y]), cx, cy, pitch);
  const pt = (x, y) => rot([[x, y + by]])[0];

  // Bushy tail streaming behind, lagging the body; idle, it gives a slow wag.
  const tl = dead ? 0 : walk ? Math.sin(p * TAU - 1.6) * 1.2 : A ? [1.6, -2, -1, 0.4][f] : wave(p - 0.2) * 1.2;
  const up = angry || A ? -3 : hurt ? 3 : 0;
  const tail = dead ? [pt(13, 22), [8, 30], [4, 34], [1.6, 35.4]] : [pt(13, 21), [8 + ox, 18.6 + by + tl + up], [4.2 + ox, 17 + by + tl * 2 + up], [1.6 + ox + Math.abs(tl) * 0.3, 18.6 + tl * 3 + up]];
  out.push(tube(tail, [4.6, 7.4, 6.4, 2.6], furD), F(tube(tail.slice(1), [3.6, 3.6, 1.6], fur)), ...stroke([tail[1], tail[2]], 0.4, furDD));
  out.push(F(E(tail[3][0] + 0.6, tail[3][1], 1.6, 1.4, ruff)));

  // Legs. Hind legs: thigh, a forward knee, a hock kicked back, then the paw. Feet stay planted
  // while the body shifts.
  const ph = { hb: 0, hn: 0.12, fb: 0.5, fn: 0.62 };
  const hind = (key, near) => {
    const [dx, lift] = dead ? [-4, 0] : walk ? gait(p + ph[key], 13.7, 3.8, 0.38) : A ? [A.hind[0] - ox + (near ? 0 : 0.8), A.hind[1]] : [near ? -0.8 : 0.8, 0];
    const [hx, hy] = pt(16 + (near ? 0 : 1), 25);
    const fx = (A ? 16 + (near ? 0 : 1) + ox : hx) + dx + 0.6;
    const fy = G - 1.4 + lift;
    const hock = [fx - 2.2 - (lift ? 1 : 0), fy - 4.8];
    const kn = knee(hx, hy, hock[0], hock[1], 5.2, 4.6, -1);
    const c = near ? fur : furDD;
    const leg = [[hx, hy], kn, hock, [fx, fy]];
    return near
      ? [...tubeL(leg, [7, 4, 2.8, 2.4], c, 4, 0.6), ...ovL(fx + 1, fy + 0.3, 2.4, 1.3, 0, c, 0.4), F(E(fx + 3, fy + 0.6, 0.5, 0.4, '#fffaf0'))]
      : [tube(leg, [6.4, 3.6, 2.6, 2.2], c), ov(fx + 1, fy + 0.3, 2.3, 1.2, 0, c)];
  };
  const front = (key, near) => {
    const [dx, lift] = dead ? [4, 0] : walk ? gait(p + ph[key], 13.7, 3.4, 0.38) : A ? [A.fore[0] - ox + (near ? 0 : -1), A.fore[1]] : [near ? 0.6 : -0.6, 0];
    const [hx, hy] = pt(34 - (near ? 0 : 1.2), 25.6);
    const fx = (A ? 34 - (near ? 0 : 1.2) + ox : hx) + dx + 0.6;
    const fy = G - 1.4 + lift;
    const kn = knee(hx, hy, fx, fy, 5.6, 6, 1);
    const c = near ? fur : furDD;
    const leg = [[hx, hy], kn, [fx, fy]];
    return near
      ? [...tubeL(leg, [5, 3, 2.6], c, 4, 0.6), ...ovL(fx + 1, fy + 0.3, 2.4, 1.3, 0, c, 0.4), F(E(fx + 3, fy + 0.6, 0.5, 0.4, '#fffaf0'))]
      : [tube(leg, [4.4, 2.8, 2.4], c), ov(fx + 1, fy + 0.3, 2.3, 1.2, 0, c)];
  };
  out.push(...hind('hb', false), ...front('fb', false));

  // Shaggy body: jagged tufts along the back and belly, the flanks heaving when idle.
  const heave = idle ? wave(p * 2) * 0.4 : 0;
  const body = rot([[12, 22], [13.4, 17.6], [16, 16.6], [17, 15], [19.4, 16], [21, 14.4], [23.4, 15.6], [25.6, 14], [28, 15.2], [30.4, 13.6], [34, 15], [37, 18.6], [37.4, 24], [36, 28.6 + heave], [33.4, 29.6 + heave], [31, 28.4 + heave], [28.6, 30 + heave], [26, 28.6 + heave], [23.4, 30 + heave], [21, 28.4 + heave], [18, 30], [14.6, 28.6], [12.4, 26]].map(([x, y]) => [x, y + by]));
  out.push(T(body.map(([x, y]) => [x + (x - cx) * 0.03, y + (y - cy) * 0.06]), edge(fur)), T(body, fur));
  // Darker saddle along the spine with fur strokes; its hackles rise when angry.
  const hack = angry || A ? -1.2 : 0;
  out.push(F(T(rot([[14, 19.4], [17, 16.4 + hack * 0.5], [21, 15.6 + hack], [26, 15 + hack], [31, 15 + hack * 0.6], [33.6, 17.6], [29, 18.4], [24, 18.8], [19, 19.6], [15.4, 21.4]].map(([x, y]) => [x, y + by])), furD)));
  for (const [x, y] of [[18, 22], [22, 21.4], [26, 22.4], [20, 25.4], [24, 25.6]]) out.push(...stroke(rot([[x, y + by], [x - 1.6, y + 1.8 + by]]), 0.4, furD));
  // A healed claw scar across the flank.
  for (const k of [0, 1, 2]) out.push(...stroke(rot([[19.6 + k * 1.6, 19.6 + by], [21.4 + k * 1.6, 24 + by]]), 0.5, scar));

  out.push(...hind('hn', true));

  // The ruff: a thick collar of pale fur wrapping the neck and chest, bouncing with the lope.
  const rl = walk ? Math.sin(p * TAU * 2 - 1.6) * 0.8 : wave(p) * 0.3;
  const rf = angry || A ? 1.35 : 1.15;
  const ruffPts = [];
  for (let i = 0; i <= 12; i++) {
    const a = rad(lerp(-100, 150, i / 12));
    const r = (i % 2 ? 6.6 : 9) * rf + (i % 2 ? 0 : rl);
    ruffPts.push([35 + Math.cos(a) * r * 0.85, 22 + Math.sin(a) * r]);
  }
  out.push(C(T(rot(ruffPts.map(([x, y]) => [x, y + by])), ruff)));
  out.push(F(T(rot(ruffPts.map(([x, y]) => [35 + (x - 35) * 0.6, 23 + (y - 22) * 0.6 + by])), mix(ruff, '#ffffff', 0.5))));
  for (let i = 1; i < 12; i += 2) {
    const [x, y] = ruffPts[i];
    out.push(...stroke(rot([[lerp(35, x, 0.7), lerp(22, y, 0.7) + by], [lerp(35, x, 1.05), lerp(22, y, 1.05) + by]]), 0.4, ruffD));
  }
  out.push(...front('fn', true));

  // Head: a broad skull, a long muzzle, tall ears, and a scar over the eye. Idle, it lifts its
  // nose to sniff the wind.
  const sniff = idle ? bump(p, 0.5, 0.34) : 0;
  const [X, Y0] = pt(38.8, 16.2);
  const Y = Y0 + (dead ? 3 : 0) + (walk ? Math.sin(p * TAU * 2 - 1.2) * 0.5 : idle ? wave(p + 0.3) * 0.3 - sniff * 0.8 : 0);
  const tilt = pitch * (walk ? 0.4 : 0.6) + (dead ? 16 : hurt ? -10 : angry ? 4 : 0) - sniff * 8 + (A ? [6, -4, 6, 2][f] : 0);
  const ear = (ex, ey, c, a) => {
    const pts = turn([[ex - 2.2, ey + 1], [ex - 0.6, ey - 5.6], [ex + 2.4, ey + 0.6]], ex, ey, a);
    return [T(pts, c), F(T(turn([[ex - 1.1, ey + 0.6], [ex - 0.5, ey - 3.6], [ex + 1.2, ey + 0.4]], ex, ey, a), '#ffb8c8'))];
  };
  const headAt = out.length;
  const eflick = idle ? bump(p, 0.83, 0.18) * 14 : 0;
  const earA = (angry || A ? -30 : hurt ? -40 : dead ? -55 : -10) + (walk ? Math.sin(p * TAU * 2 - 2.6) * 7 : wave(p) * 3) + tilt * 0.3;
  out.push(...ear(X - 3.4, Y - 4.4, furD, earA - 10));
  // Lower jaw (opens in a snarl; idle, it pants).
  const pant = idle && !angry ? 0.6 + 0.5 * (0.5 + 0.5 * wave(p * 2)) : 0;
  const gape = A && !dead && !hurt ? A.gape : angry ? 2.6 : hurt ? 1.6 : mood === 'happy' ? 1.4 : 0.4 + pant;
  const jaw = turn([[X + 1, Y + 3.6], [X + 9.6, Y + 4 + gape], [X + 8.6, Y + 5.6 + gape], [X + 2, Y + 6.4]], X, Y, tilt);
  out.push(T(jaw, ruff));
  if (gape > 1) out.push(F(T(turn([[X + 3, Y + 3.6], [X + 9.6, Y + 3], [X + 9.2, Y + 3.8 + gape], [X + 3.6, Y + 5]], X, Y, tilt), MOUTH)));
  if (pant > 0.7 && !dead) out.push(F(T(turn([[X + 4.4, Y + 4.4], [X + 8.4, Y + 4.4 + gape * 0.6], [X + 8.8, Y + 6 + gape], [X + 6.4, Y + 6.4 + gape], [X + 4.6, Y + 5.4]], X, Y, tilt), '#ff8fab')));
  out.push(F(ov(X, Y, 7.4, 6.4, tilt, edge(fur))), ...ball(X, Y, 6.9, 5.9, fur, tilt));
  const muzzle = turn([[X + 2, Y - 1.6], [X + 8.6, Y - 0.4], [X + 11, Y + 0.6], [X + 11.2, Y + 2.6], [X + 9.6, Y + 3.8], [X + 3, Y + 4]], X, Y, tilt);
  out.push(F(T(muzzle.map(([x, y]) => [x + 0.35, y + 0.35]), edge(fur))), blob(muzzle, fur, 3), F(blob(turn([[X + 4, Y + 1.6], [X + 10, Y + 2.4], [X + 9.4, Y + 3.6], [X + 4, Y + 3.8]], X, Y, tilt), ruff, 3)));
  // A snarl wrinkles the top of the muzzle.
  if (angry || (A && f < 2)) for (const k of [0, 1]) out.push(...stroke(turn([[X + 4.4 + k * 1.6, Y - 0.6], [X + 5.2 + k * 1.6, Y + 0.4]], X, Y, tilt), 0.35, furDD));
  const nose = turn([[X + 10.8, Y + 0.6]], X, Y, tilt)[0];
  out.push(F(E(nose[0], nose[1], 1.3, 1, '#4a3d63')), F(E(nose[0] - 0.4, nose[1] - 0.4, 0.4, 0.3, '#9c8fc0')));
  // Fangs: always peeking, bared when angry.
  const fang = (x, len) => {
    const [a, b, c] = turn([[x - 0.5, Y + 3.6], [x, Y + 3.6 + len], [x + 0.5, Y + 3.6]], X, Y, tilt);
    return F(T([a, b, c], '#fffaf0'));
  };
  out.push(fang(X + 5.6, angry || A ? 2.2 : 1.3), fang(X + 8.6, angry || A ? 1.8 : 1));
  // Cheek fur tuft over the jaw hinge.
  out.push(C(T(turn([[X - 4, Y + 1], [X - 1, Y + 6.6], [X - 0.4, Y + 4.2], [X + 1.6, Y + 6], [X + 1.4, Y + 2]], X, Y, tilt), ruff)));
  out.push(...ear(X + 0.2, Y - 5, fur, earA - eflick));
  // Eyes: narrow, fierce wolf eyes, amber, ringed in dark fur with a tear-line marking; the
  // near one crossed by an old scar.
  const [ex1, ey1] = turn([[X + 1.4, Y - 1.4]], X, Y, tilt)[0];
  const [ex2, ey2] = turn([[X + 5.4, Y - 1.8]], X, Y, tilt)[0];
  const glance = idle ? 0.35 * Math.sin(p * TAU) : 0;
  const eo = { round: 0.95, lower: 0.7, slant: 0.55, sclera: '#fff4d8', iris: '#ffc23a', irisL: '#fff0a0', glow: '#ff7a2a', glowL: '#ffe07a', aura: '#fff4a0', pupil: 'round', irisW: 0.6, tear: furDD, brow: furDD, look: [glance, 0], squint: 0.6 };
  out.push(...peeper(ex1, ey1, mood, -1, { ...eo, w: 1.9, h: 1.3 }), ...peeper(ex2, ey2, mood, 1, { ...eo, w: 1.3, h: 1.05, tear: null }));
  out.push(...stroke([[ex1 - 1.4, ey1 - 3.6], [ex1 - 0.6, ey1 - 1.6]], 0.55, scar), ...stroke([[ex1 + 0.4, ey1 + 1.8], [ex1 + 1.2, ey1 + 3.4]], 0.55, scar));
  // Brow: a heavy scowl when angry, a single furrow otherwise.
  if (!angry && !dead && mood !== 'hurt') out.push(...stroke([[ex1 - 1.2, ey1 - 2.4], [ex1 + 1.4, ey1 - 2.2], [ex2 + 1, ey2 - 2]], 0.5, furDD));
  if (dead) out.push(F(ov(nose[0] - 3, nose[1] + 4.4, 0.9, 1.6, tilt, '#ff8fa8')));
  out.push(...grow(out.splice(headAt), X + 2, Y + 4, 1.22));
  if (A && A.imp) out.push(...star(Math.min(51.6, nose[0] + 2.4), nose[1] + 4, 2.6, '#fff2a8'), ...dust(36, G - 0.4, 0.9, '#e6e2f2'));
  if (A && f === 1) for (const [y, l] of [[16, 4], [21, 5.4], [26, 3.6]]) out.push(...stroke([[8 - l, y], [8, y]], 0.55, '#ffffff'));
  if (hurt) out.push(F(E(51, 6, 0.8, 1.2, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: out };
}

// ---------- Treant (mossgolem) ----------

// Attack: a branch arm swung down like a club. lean: trunk lean, el/hd: the near arm's elbow and
// hand from the shoulder, imp: the slam lands.
const TREANT_ATK = [
  // Wind-up: the arm hauled up high overhead, leaning back.
  { lean: -2.6, el: [1.6, -8.4], hd: [-1, -17], imp: 0, by: -0.6 },
  // Swing: the arm sweeps forward and down.
  { lean: 1.4, el: [7.2, -2.8], hd: [12, -1.4], imp: 0, by: 0.4 },
  // Slam: the twig fist crashes into the ground.
  { lean: 2.2, el: [8, 10.6], hd: [12.2, 25.6], imp: 1, by: 1.4 },
  // Recover: hauling the arm back up.
  { lean: 1.2, el: [6.6, 5], hd: [10.2, 13], imp: 0, by: 0.6 },
];

function mossgolem(pose, f, mood) {
  const W = 62;
  const H = 70;
  const G = H;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? TREANT_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  const bark = '#a9826a';
  const barkD = shade(bark, -13);
  const barkDD = shade(bark, -26);
  const barkL = mix(bark, '#fff0dc', 0.3);
  const moss = '#9cd486';
  const mossD = shade(moss, -14);
  const leafA = dead ? '#b8b07a' : '#76c27a';
  const leafB = dead ? '#c9c08a' : '#92d690';
  const leafC = dead ? '#a89c68' : '#5ea86a';
  const leafL = dead ? '#e0d8a8' : '#c2efb4';
  const out = [];
  // A slow, lumbering sway: the trunk rolls far over onto each root foot as it lands and sinks
  // under its own weight; idle, it creaks and settles.
  const by = dead ? 5 : walk ? Math.abs(Math.sin(p * TAU)) * -1.6 + 0.6 : A ? A.by : wave(p) * 0.5;
  const lean = dead ? 3.5 : hurt ? -2.6 : walk ? Math.sin(p * TAU - 0.4) * 2.8 : A ? A.lean : wave(p - 0.1) * 0.8;
  const cx = 30;
  // The crown sits this much lower than it was laid out, leaving headroom for the nest's bird.
  const CY = 3;
  const pivot = [30, 62];
  const tr = (pts) => turn(pts.map(([x, y]) => [x, y + by]), pivot[0], pivot[1], lean);
  const tp = (x, y) => tr([[x, y]])[0];
  // The crown swings a beat behind the trunk.
  const sw = (walk ? Math.sin(p * TAU - 1.5) * 2.2 : idle ? wave(p - 0.25) * 1.2 : A ? [-2.4, 2, 3, 1][f] : 0) + (hurt ? -1.4 : 0);

  // Root feet: a splay of root toes that lift slowly and plant heavily in turn.
  const foot = (ph, near) => {
    const [dx, lift] = dead ? [near ? 4 : -4, 0] : walk ? gait(p + ph, 10.4, 4, 0.65) : A && near ? [[-0.6, 2.4, 2.4, 1][f], 0] : [near ? 1 : -1, 0];
    const fx = cx + (near ? 6 : -6) + dx;
    const fy = G - 1.6 + lift;
    const c = near ? bark : barkD;
    const top = tp(cx + (near ? 6 : -6), 57);
    const parts = near ? tubeL([top, [fx, fy - 4], [fx, fy]], [9, 7, 6], c, 4, 0.7) : [tube([top, [fx, fy - 4], [fx, fy]], [9, 7, 6], c)];
    // Root toes curl under as the foot lifts and splay as it plants.
    const curl = lift < -0.5 ? 1 : 0;
    for (const [ox, len, a] of [[-2, 4.6, 165], [0, 5.4, 20], [2.4, 5.4, 5]]) {
      const end = [fx + ox + Math.cos(rad(a + (a > 90 ? -1 : 1) * curl * 30)) * len, fy + 0.6 + Math.sin(rad(a)) * 0.4 + curl * 1.6];
      parts.push(...(near ? tubeL([[fx + ox, fy - 1], end], [3, 1.4], c, 3, 0.6) : [tube([[fx + ox, fy - 1], end], [3, 1.4], c)]));
    }
    if (near) parts.push(F(E(fx - 1, fy - 4, 1.4, 1, mossD)));
    return parts;
  };

  // Branch arms: a crooked bough with twig fingers and a tuft of leaves, swinging heavily.
  const arm = (near) => {
    const sh = tp(near ? 43 : 17, 31);
    const s = near ? 1 : -1;
    const swing = (walk ? Math.sin(p * TAU - 0.8) * (near ? -3.4 : 3.4) : idle ? wave(p + (near ? 0 : 0.5)) * 1 : 0) + (angry ? -4 : 0) + (dead ? 8 : 0) + (hurt ? -2 : 0);
    let elbow = [sh[0] + 6.4 * s, sh[1] + 4 + swing * 0.4];
    let hand = [sh[0] + 9.4 * s + swing * 0.5 * s, sh[1] + 11 + swing];
    if (A && near && !dead) {
      elbow = [sh[0] + A.el[0], sh[1] + A.el[1]];
      hand = [sh[0] + A.hd[0], sh[1] + A.hd[1]];
    }
    const c = near ? bark : barkDD;
    const out2 = near ? tubeL([sh, elbow, hand], [6, 4, 3], c, 4, 0.7) : [tube([sh, elbow, hand], [6, 4, 3], c)];
    // Twig fingers, curling into a fist for the slam.
    const dir = Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]) / (Math.PI / 180);
    const fan = A && near ? [dir - 40, dir, dir + 40] : near ? [40, 80, 120] : [60, 100, 140];
    for (const a of fan) {
      const aa = a + (angry && !A ? -30 : 0);
      const tip = [hand[0] + Math.cos(rad(aa)) * 3.6, hand[1] + Math.sin(rad(aa)) * 3.6];
      out2.push(...(near ? tubeL([hand, tip], [1.6, 0.8], c, 2, 0.5) : [tube([hand, tip], [1.6, 0.8], c)]));
    }
    // A sprig of leaves sprouting at the elbow, trailing the swing.
    const lc = near ? leafB : leafC;
    const tr2 = A && near ? [20, -30, -40, -10][f] : 0;
    out2.push(...leaf(elbow[0], elbow[1] - 1, 5.4, 3.4, (near ? -60 : -120) + sw * 6 + tr2, lc), ...leaf(elbow[0], elbow[1] - 1, 4.6, 3, (near ? -15 : -165) + sw * 5 + tr2, lc));
    return out2;
  };

  // Crown back layer.
  const crown = (x, y, rx, ry, c, k = 1) => {
    const ox = sw * k * (1 - y / 40);
    const [px, py] = tp(x + ox, y + CY);
    return ball(px, py, rx, ry, c, 0, { dark: -12 });
  };
  out.push(...arm(false));
  out.push(...foot(0.5, false));
  for (const [x, y, rx, ry] of [[14, 16, 10, 8], [46, 15, 10, 8], [30, 10, 15, 9], [22, 22, 9, 6], [40, 22, 9, 6]]) out.push(...crown(x, y, rx, ry, leafC));

  // The trunk.
  const trunk = tr([[17, 60], [18.4, 50], [16.6, 38], [17.6, 26], [21, 18], [39, 18], [42.4, 26], [43.4, 38], [41.6, 50], [43, 60], [36, 62], [30, 61], [24, 62]]);
  out.push(T(trunk.map(([x, y]) => [x + (x - cx) * 0.035, y + 0.3]), edge(bark)), blob(trunk, bark, 3));
  // Bark grooves and a lighter front plate where the face sits.
  out.push(F(blob(tr([[21, 32], [25, 27], [35, 27], [39.6, 33], [39, 48], [33, 52], [26, 52], [21.4, 47]]), mix(bark, barkL, 0.45), 3)));
  for (const line of [[[19.6, 56], [20.6, 48], [19.4, 40]], [[40.4, 58], [39.4, 50], [41, 42]], [[22.4, 22], [21.2, 28]], [[38, 21], [39.4, 27]], [[29.6, 54], [30.4, 60]], [[25, 55], [24.4, 60]], [[35, 55], [35.8, 60]]]) {
    out.push(...stroke(tr(line), 0.7, barkD), ...stroke(tr(line).map(([x, y]) => [x + 0.6, y]), 0.35, barkL));
  }
  // A knothole on the side.
  const [kx, ky] = tp(20.4, 44);
  out.push(F(E(kx, ky, 1.6, 2.2, barkDD)), F(E(kx + 0.3, ky + 0.4, 0.9, 1.4, '#4a3448')));
  // Mushrooms growing up the side.
  for (const [x, y, r] of [[17.6, 36, 2.6], [18.6, 32, 1.8]]) {
    const [mx, my] = tp(x, y);
    out.push(F(R(mx - 0.5, my, 1.2, 1.8, '#fff0dc')), ...ovL(mx - 0.6, my, r, r * 0.6, 0, dead ? '#c8a8a0' : '#ff9eb8', 0.35), F(E(mx - 1, my - 0.3, 0.5, 0.35, '#ffffff')), F(E(mx + 0.6, my - 0.1, 0.35, 0.3, '#ffffff')));
  }
  // Moss draped over the shoulders.
  out.push(C(blob(tr([[16.4, 27], [19, 20], [25, 17.4], [26.4, 21], [23.4, 22.4], [22, 26], [19.4, 25.6], [18.6, 30]]), moss, 3)));
  out.push(C(blob(tr([[43.6, 28], [41.4, 20], [35, 17.4], [34, 21], [37, 21.6], [38.4, 24.6], [41, 25], [42, 31]]), moss, 3)));

  out.push(...foot(0, true));

  // The face: deep knot-hole eyes with a smoldering ember glow, moss brows, a knobby nose, a
  // mouth crack, and a mossy beard.
  const [ex1, ey1] = tp(27.4, 37);
  const [ex2, ey2] = tp(36.6, 37);
  const glow = angry || A ? '#ff8a3a' : '#ffd36a';
  const ember = idle ? 0.25 * wave(p * 2) : walk ? 0.15 * wave(p * 2) : A ? [0.4, 0.2, 0.5, 0.1][f] : 0;
  const drift = idle ? 0.5 * Math.sin(p * TAU) : 0;
  const hollow = (x, y, s) => {
    const o = [F(E(x, y, 3.3, 2.9, barkDD)), F(E(x, y + 0.2, 2.7, 2.3, '#4a3448'))];
    switch (mood) {
      case 'blink':
        o.push(F(E(x, y - 0.6, 3, 2.2, barkD)), ...stroke([[x - 2.4, y + 0.6], [x, y + 1.2], [x + 2.4, y + 0.6]], 0.6, '#4a3448'));
        break;
      case 'happy':
        o.push(arc(x, y + 1, 1.8, 1.6, 200, 340, 0.8, glow));
        break;
      case 'hurt':
        o.push(...stroke([[x - s * 1.6, y - 1.4], [x + s * 1.2, y], [x - s * 1.6, y + 1.4]], 0.8, '#ffd36a'));
        break;
      case 'dead':
        o.push(...stroke([[x - 1.2, y - 1.2], [x + 1.2, y + 1.2]], 0.7, '#8a7a8a'), ...stroke([[x - 1.2, y + 1.2], [x + 1.2, y - 1.2]], 0.7, '#8a7a8a'));
        break;
      default: {
        const k = 1 + ember;
        const ax = x + 0.4 + drift;
        o.push(F(E(ax, y + 0.3, (angry ? 1.8 : 1.5) * k, (angry ? 1.4 : 1.7) * k, angry ? '#ffd27a' : '#fff1b0')), F(E(ax, y + 0.3, (angry ? 1.1 : 1) * k, (angry ? 0.8 : 1.2) * k, glow)), F(E(ax - 0.6, y - 0.4, 0.45, 0.45, '#ffffff')));
        // A spark drifting up out of the hollow.
        if (ember > 0.15) o.push(F(E(x + 1.6, y - 2.6 - ember * 3, 0.35, 0.35, '#ffd36a')));
      }
    }
    return o;
  };
  out.push(...hollow(ex1, ey1, 1), ...hollow(ex2, ey2, -1));
  // Moss brows: heavy, wise, and expressive; idle, one lifts as it ponders.
  const ponder = idle ? bump(p, 0.5, 0.3) : 0;
  const lift = happy ? -1.6 : hurt ? -1 : 0;
  const tilt = angry || A ? 2.6 : happy ? -0.6 : hurt ? -1.4 : 0.8;
  const brow = (x, y, s, l) => C(blob([[x - s * 4.4, y - 3.6 + l + tilt * 0.2], [x - s * 1, y - 5 + l - tilt * 0.4], [x + s * 2.6, y - 4.4 + l + tilt], [x + s * 3.6, y - 2.6 + l + tilt * 1.2], [x + s * 0.6, y - 3 + l + tilt * 0.4], [x - s * 3.6, y - 2.2 + l]], moss, 3));
  out.push(brow(ex1, ey1, 1, lift - ponder * 1.4), brow(ex2, ey2, -1, lift));
  out.push(...stroke([[ex1 - 3, ey1 - 4.2 + lift - ponder * 1.4], [ex1, ey1 - 4.6 + lift - ponder * 1.4]], 0.4, mossD), ...stroke([[ex2 + 3, ey2 - 4.2 + lift], [ex2, ey2 - 4.6 + lift]], 0.4, mossD));
  // Nose knot.
  const [nx, ny] = tp(32.4, 41.4);
  out.push(...ovL(nx, ny, 2.2, 1.8, 0, mix(bark, barkL, 0.6), 0.4), F(E(nx - 0.6, ny - 0.6, 0.7, 0.5, '#fff6e6')));
  // Mouth.
  const [mx, my] = tp(32, 46);
  if (A && A.imp && !dead && !hurt) {
    out.push(F(E(mx, my + 0.8, 3.4, 2.8, '#4a3448')), F(E(mx, my + 2, 2, 1, '#e9849a')));
    for (const k of [-2, 0, 2]) out.push(F(T([[mx + k - 0.7, my - 1.6], [mx + k + 0.7, my - 1.6], [mx + k, my - 0.4]], '#fff0dc')));
  } else if (angry) {
    out.push(F(T([[mx - 4.4, my - 1], [mx + 4.4, my - 1], [mx + 3, my + 2.6], [mx - 3, my + 2.6]], '#4a3448')));
    for (const k of [-3, -1, 1, 3]) out.push(F(T([[mx + k - 0.7, my - 1], [mx + k + 0.7, my - 1], [mx + k, my + 0.6]], '#fff0dc')));
  } else if (hurt) {
    out.push(F(E(mx, my + 0.6, 1.6, 1.6, '#4a3448')));
  } else if (dead) {
    out.push(...stroke([[mx - 3, my + 0.6], [mx - 1, my], [mx + 1, my + 0.6], [mx + 3, my]], 0.6, '#4a3448'));
  } else if (happy) {
    out.push(F(T([[mx - 3.4, my - 0.6], [mx + 3.4, my - 0.6], [mx, my + 2.4]], '#4a3448')), F(E(mx, my + 1.2, 1.2, 0.6, '#e9849a')));
  } else {
    out.push(arc(mx, my - 1.4, 3, 2, 30, 150, 0.7, '#4a3448'));
  }
  if (!dead) out.push(F(E(ex1 - 1.6, ey1 + 4.4, 1.6, 0.8, '#f2a0a8')), F(E(ex2 + 1.6, ey2 + 4.4, 1.6, 0.8, '#f2a0a8')));
  // Mossy beard hanging from the chin, swaying a beat behind.
  const bw = sw * 0.8;
  out.push(C(blob(tr([[25.4, 49.4], [29, 50.6], [35, 50.2], [38.6, 48.8], [38 + bw, 53.4], [35.6 + bw, 52.4], [34 + bw, 57], [31.6 + bw, 53], [29.4 + bw, 56], [27.6 + bw, 52], [25.6 + bw, 54]]), moss, 3)));
  out.push(F(E(...tp(30, 51.6), 1.6, 0.7, mix(moss, '#ffffff', 0.4))));
  // The near arm sits under the crown, except when it's raised through it to strike.
  if (!A) out.push(...arm(true));

  // Crown front: big leafy clouds with highlights, a few blossoms, and the bird's nest.
  for (const [x, y, rx, ry, c] of [[11, 22, 7.6, 5.6, leafA], [49, 21, 7.6, 5.6, leafA], [18, 12, 9, 6.6, leafB], [30, 7, 10, 6.4, leafB], [42, 12, 9, 6.6, leafA], [25, 19, 6, 3.6, leafA], [36, 19, 6, 3.6, leafB]]) out.push(...crown(x, y, rx, ry, c));
  // A fringe of leaves hanging from the crown's underside, swaying.
  for (let i = 0; i < 9; i++) {
    const x = 9 + i * 5.2;
    const y = 23.4 + CY + Math.sin(i * 1.7) * 1.2 - (i === 0 || i === 8 ? 2 : 0);
    const [px, py] = tp(x + sw * 0.6, y);
    out.push(...leaf(px, py, 3.6, 2.6, 90 + sw * 8 + (i - 4) * 4 + (walk ? Math.sin(p * TAU * 2 - i * 0.5) * 6 : 0), i % 2 ? leafA : leafC, false));
  }
  const leafRing = [[6, 18, 200], [5, 24, 160], [12, 7, 230], [22, 2, 260], [38, 2, 285], [48, 7, 310], [55, 17, 340], [55, 24, 20]];
  leafRing.forEach(([x, y, a], i) => {
    const [px, py] = tp(x + sw * (1 - y / 40), y + CY);
    const rus = idle ? wave(p - i * 0.12) * 8 : walk ? Math.sin(p * TAU * 2 - i * 0.6) * 6 : 0;
    out.push(...leaf(px, py, 4.4, 3, a + sw * 4 + rus, leafB, false));
  });
  for (const [x, y] of [[14, 9], [26, 3.4], [44, 9], [9, 19]]) {
    const [px, py] = tp(x + sw, y + CY);
    out.push(F(E(px, py, 2.4, 1.2, leafL)));
  }
  if (!dead) {
    for (const [x, y] of [[20, 16], [45, 17], [10, 14]]) {
      const [px, py] = tp(x + sw, y + CY);
      for (let i = 0; i < 5; i++) out.push(F(E(px + Math.cos((i / 5) * TAU) * 1, py + Math.sin((i / 5) * TAU) * 1, 0.85, 0.85, '#ffc4d8')));
      out.push(F(E(px, py, 0.55, 0.55, '#ffe36b')));
    }
  }
  if (A) out.push(...arm(true));
  // Leaves shaken loose by the slam.
  if (A && !dead && f >= 2) for (const [x, y, a] of [[8, 30, 30], [52, 26, -40], [14, 38, 70]]) out.push(...leaf(x, y + (f - 2) * 4, 3, 2, a + f * 40, leafB, false));
  // The nest, with a little bluebird who reacts to everything.
  const [nx2, ny2] = tp(36 + sw * 0.9, 2.6 + CY);
  out.push(...ovL(nx2, ny2 + 1.6, 4.6, 2.2, 0, '#c99a6a', 0.4));
  for (const k of [-3, -1, 1, 3]) out.push(...stroke([[nx2 + k - 1.4, ny2 + 0.8], [nx2 + k + 1.2, ny2 + 2.6]], 0.35, '#8f6a4a'));
  if (!dead) {
    const hop = happy ? -1.2 : angry ? -0.8 : A ? [-0.4, -1.8, -2.4, -0.6][f] : walk ? -Math.abs(Math.sin(p * TAU * 2)) * 1 : -bump(p, 0.33, 0.2) * 1.2;
    const bx = nx2 + 0.6;
    const bby = ny2 - 1.4 + hop;
    out.push(...ovL(bx, bby, 2.6, 2.1, 0, '#8ec8ff', 0.4), F(E(bx + 0.8, bby + 0.8, 1.4, 1, '#ffe2c8')));
    out.push(F(T([[bx + 2.2, bby - 0.4], [bx + 3.8, bby + 0.1], [bx + 2.2, bby + 0.6]], '#ffb347')));
    out.push(T([[bx - 1, bby - 1.8], [bx - 0.2, bby - 3 - (angry ? 0.8 : 0)], [bx + 0.4, bby - 1.8]], '#8ec8ff'));
    // A wing flaps as it hops.
    if (hop < -0.5) out.push(T([[bx - 1.6, bby], [bx - 3.6, bby - 1.8], [bx - 0.4, bby + 0.6]], '#6eb0f0'));
    if (mood === 'blink' || happy) out.push(arc(bx + 1, bby - 0.2, 0.5, 0.4, 200, 340, 0.3, INK));
    else if (hurt || (A && A.imp)) out.push(...stroke([[bx + 0.6, bby - 0.8], [bx + 1.4, bby - 0.3], [bx + 0.6, bby + 0.2]], 0.3, INK));
    else out.push(F(E(bx + 1, bby - 0.3, 0.45, 0.55, INK)));
    if (happy) out.push(F(E(bx + 5.6, bby + 1.4, 0.8, 0.6, INK)), ...stroke([[bx + 6.3, bby + 1.4], [bx + 6.3, bby - 1.2], [bx + 7.2, bby - 0.6]], 0.3, INK));
    if (angry) out.push(...stroke([[bx + 0.2, bby - 1.4], [bx + 1.8, bby - 0.8]], 0.35, INK));
  } else {
    out.push(F(ov(nx2 + 6, ny2 + 8, 0.8, 1.8, 40, '#8ec8ff')));
  }
  if (A && A.imp) {
    const [hx, hy] = [tp(43, 31)[0] + A.hd[0], tp(43, 31)[1] + A.hd[1]];
    out.push(...dust(Math.min(hx, 54), G - 0.6, 1.4), ...star(Math.min(hx + 2, 57), hy - 2, 3, '#fff2a8'));
  }
  if (hurt) out.push(F(E(53, 30, 0.9, 1.4, '#9fd8ff')));
  return { w: W, h: H, res: 3, shapes: shift(out, 1, 0) };
}

export const ART = {
  pebblet: { walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [55, 240, 170], draw: pebblet },
  scorpip: { walk: 8, idle: 6, attack: 4, stride: 17, atkMs: [50, 220, 150], draw: scorpip },
  leafling: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [55, 230, 170], draw: leafling },
  boarlet: { walk: 8, idle: 6, attack: 4, stride: 36, atkMs: [55, 290, 200], draw: boarlet },
  mossgolem: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [75, 320, 230], draw: mossgolem },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  pebblet: { name: 'Basilisk Hatchling', w: 28, h: 22 },
  scorpip: { name: 'Manticore Cub', w: 32, h: 26 },
  leafling: { name: 'Dryad', w: 20, h: 34 },
  boarlet: { name: 'Warg', w: 38, h: 26 },
  mossgolem: { name: 'Treant', w: 34, h: 58 },
};
