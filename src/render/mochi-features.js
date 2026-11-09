// What a grown Mochi grows (docs/design/mochi.md): from its path and its best stat, one of ten
// features, drawn in the Mochi's own pixel size and worn on its head, back, hips or ankles, moving
// with it (wings flap, tails swish, fins ripple, a halo bobs).
//
//   Stat      Amamochi (angel)          Karamochi (demon)
//   Fly       feathered wings           bat wings
//   Run       feathered ankle wings     swept-back horns
//   Swim      veil fin ears             a finned tail
//   Power     a halo and sturdy cuffs   big curled horns
//   Stamina   a fluffy cloud tail       a long devil tail
//
// Each part is a sprite built in a few frames (never stretched), placed with render/hero.js
// posedFrame inside drawPosed's under (behind the body) and over (in front) callbacks.
import { E, T, F, blit } from './pixel.js';
import { limb } from './figure.js';
import { art } from './scenery.js';
import { STATS } from '../data/mochi-genes.js';

export const FEATURES = {
  angel: { fly: 'featherwings', run: 'anklewings', swim: 'veilfins', power: 'halo', stamina: 'cloudtail' },
  demon: { fly: 'batwings', run: 'swepthorns', swim: 'fintail', power: 'curlhorns', stamina: 'deviltail' },
};
const GRADE = { E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 };
// Its best stat: the most points, else the best grade (ties go in stat order).
export function bestStat(g) {
  const score = (s) => (g.stats?.[s]?.points ?? 0) * 10 + (GRADE[g.talents?.[s]] ?? 0);
  return STATS.reduce((best, s) => (score(s) > score(best) ? s : best), STATS[0]);
}
// The feature a Mochi wears (none before it takes a path).
export function featureOf(g) {
  if (g.feature) return g.feature;
  if (!g.path || !(g.stage === 'amamochi' || g.stage === 'karamochi')) return null;
  return FEATURES[g.path]?.[bestStat(g)] ?? null;
}

const TAU = Math.PI * 2;
const rot = ([x, y], a, [cx, cy] = [0, 0]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
// A feather: a long leaf from `b` toward angle `a`.
function feather([bx, by], len, wid, a, c) {
  const d = [Math.cos(a), Math.sin(a)];
  const n = [-d[1], d[0]];
  const p = (t, w) => [bx + d[0] * len * t + n[0] * wid * w, by + d[1] * len * t + n[1] * wid * w];
  return T([p(0, 0.2), p(0.3, 0.5), p(0.8, 0.42), p(1, 0), p(0.8, -0.42), p(0.3, -0.5), p(0, -0.2)], c);
}
// A tapering curve (horns, tails): a quadratic from `a` through `c` to `b`, `w0` wide at the
// start and `w1` at the end, as one polygon.
function taper(a, c, b, w0, w1, col, n = 6) {
  const pt = (t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  const L = [];
  const R = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [x0, y0] = pt(Math.max(0, t - 0.01));
    const [x1, y1] = pt(Math.min(1, t + 0.01));
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
    const w = (w0 + (w1 - w0) * t) / 2;
    const [x, y] = pt(t);
    L.push([x + nx * w, y + ny * w]);
    R.push([x - nx * w, y - ny * w]);
  }
  return T([...L, ...R.reverse()], col);
}
// A chain of points as one tapering body (tails), each link a limb.
const chain = (pts, w0, w1, c) => pts.slice(1).map((p, i) => limb(pts[i][0], pts[i][1], p[0], p[1], w0 + ((w1 - w0) * i) / (pts.length - 1), w0 + ((w1 - w0) * (i + 1)) / (pts.length - 1), c));

// ---------- The parts, each in its own box with an anchor ----------
// Every moving part goes round its cycle in N frames (a sprite each, drawn once), eased.
export const FRAMES = { wing: 16, ankle: 8, fin: 12, tail: 16 };
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
// A wingbeat, `u` 0-1 round it: a quick downstroke (0-0.4), then a slower, softer recovery up.
const FLAP_UP = -0.42;
const FLAP_DOWN = 0.24;
function flapAt(u) {
  const v = ((u % 1) + 1) % 1;
  const k = v < 0.4 ? ease(v / 0.4) : 1 - ease((v - 0.4) / 0.6);
  return FLAP_UP + (FLAP_DOWN - FLAP_UP) * k;
}
// Wings: root at the anchor, spreading out to +x and up, `f` the frame round the wingbeat. The
// long feathers at the tip trail the wing's root a beat, so the wing bends as it beats. `far`: the
// far wing, a shade deeper.
function featherWing(f, far) {
  const u = f / FRAMES.wing;
  const a0 = flapAt(u);
  const aTip = flapAt(u - 0.08);
  const c = far ? ['#eef0f8', '#d6dcee', '#f2d68a'] : ['#fffdf8', '#e6ecf8', '#ffe08a'];
  const out = [];
  // Primaries (the long ones at the tip, dipped in gold), secondaries under them, then the soft
  // coverts.
  const tips = [];
  for (let i = 0; i < 5; i++) {
    const a = -0.98 + i * 0.25 + aTip;
    const base = rot([3 + i * 0.6, -1 - i * 0.2], a0);
    const len = 13 - i * 0.8;
    out.push(feather(base, len, 3.4, a, c[0]));
    tips.push([base[0] + Math.cos(a) * len * 0.84, base[1] + Math.sin(a) * len * 0.84, a]);
  }
  for (let i = 0; i < 5; i++) {
    const a = -0.62 + i * 0.28 + a0 * 0.8;
    const base = rot([2 + i * 0.4, 0.6 + i * 0.3], a0);
    out.push(feather(base, 8.4 - i * 0.6, 3, a, c[1]));
  }
  for (const [x, y, a] of tips) out.push(F(limb(x, y, x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6, 1.3, 0.5, c[2])));
  out.push(E(...rot([2.4, -1.6], a0), 4, 3, c[0]), F(E(...rot([1.6, -2.6], a0), 2, 1, '#ffffff')));
  return out;
}
function batWing(f, far) {
  const u = f / FRAMES.wing;
  const a0 = flapAt(u);
  const aTip = flapAt(u - 0.08);
  const [mem, memDk, bone] = far ? ['#5e2450', '#46183c', '#2e1028'] : ['#7e3268', '#5e2450', '#3a1632'];
  const r = (p) => rot(p, a0);
  const wrist = r([6, -7]);
  // (The fingers, past the wrist, trail it.)
  const tips = [[3.4, -16], [10.4, -15], [16, -9], [16, 0], [10, 3.4]].map((p) => rot(rot(p, a0), aTip - a0, wrist));
  const mid = (p, q) => {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    return [m[0] + (wrist[0] - m[0]) * 0.28, m[1] + (wrist[1] - m[1]) * 0.28];
  };
  const edge = [];
  tips.forEach((t, i) => {
    edge.push(t);
    if (i < tips.length - 1) edge.push(mid(t, tips[i + 1]));
  });
  return [
    T([[0, 0], r([0, -6]), ...edge, r([3, 3])], mem), F(T([wrist, ...edge.slice(4)], memDk)),
    F(limb(0, 0, wrist[0], wrist[1], 1.2, 0.9, bone)), ...tips.slice(0, 4).map((t) => F(limb(wrist[0], wrist[1], t[0], t[1], 0.6, 0.3, bone))),
    F(T([wrist, [wrist[0] - 0.4, wrist[1] - 2.2], [wrist[0] + 0.8, wrist[1] - 0.6]], '#f2e6ee')),
  ];
}
// Ankle wings: three little feathers from the ankle, swept back and up.
function ankleWing(f) {
  const a0 = -0.06 + 0.16 * Math.sin((f / FRAMES.ankle) * TAU);
  return [feather([0, 0.6], 4.2, 1.5, -3.02 + a0, '#cfe2fa'), feather([0, 0], 5.6, 1.7, -2.62 + a0, '#f6faff'), feather([0, -0.6], 4.6, 1.5, -2.2 + a0, '#f6faff'),
    T([[-0.6, -1.4], [0.8, -1.2], [0.8, 1.4], [-0.6, 1.4]], '#f2c94c')];
}
// Veil fins: sheer fins fanning out and down from the side of the head, rippling.
function veilFin(f, far) {
  const ph = (f / FRAMES.fin) * TAU;
  const [fin, ray] = far ? ['#bfe6ee', '#8ccad8'] : ['#d6f6f8', '#9ad8e4'];
  const tips = [];
  for (let i = 0; i < 5; i++) {
    // (A ripple running out along the fin, ray by ray.)
    const a = -0.5 + i * 0.42 + 0.12 * Math.sin(ph - i * 0.9);
    const len = 8.6 + (i % 2) * 1.4 - Math.abs(i - 2) * 0.3;
    tips.push([Math.cos(a) * len, Math.sin(a) * len]);
  }
  const edge = [];
  tips.forEach((t, i) => {
    edge.push(t);
    if (i < tips.length - 1) edge.push([(t[0] + tips[i + 1][0]) * 0.42, (t[1] + tips[i + 1][1]) * 0.42]);
  });
  return [T([[0, -1.2], ...edge, [-0.6, 1.6]], fin), ...tips.map((t) => F(limb(0, 0, t[0], t[1], 0.4, 0.25, ray))), ...tips.map((t) => F(E(t[0], t[1], 0.6, 0.6, '#ffffff')))];
}
// Tails, from the hip (anchor) out behind (to -x), swaying with frame `f` (0-3).
function cloudTail(f) {
  const a = 0.12 * Math.sin((f / FRAMES.tail) * TAU);
  const puffs = [[-2.2, -0.6, 3.2, 2.8], [-5.4, -2.6, 3, 2.8], [-3.6, -5.4, 2.8, 2.6], [-7.6, -5.8, 2.4, 2.2], [-6.4, -9, 1.8, 1.7]];
  return [...puffs.map(([x, y, rx, ry]) => E(...rot([x, y], a), rx, ry, '#ffffff')),
    ...puffs.map(([x, y, rx, ry]) => F(E(...rot([x + 0.4, y + ry * 0.45], a), rx * 0.75, ry * 0.4, '#e2eaf8'))),
    F(E(...rot([-4.2, -6.4], a), 1.2, 0.6, '#ffffff'))];
}
function finTail(f) {
  const ph = (f / FRAMES.tail) * TAU;
  const pts = [0, 1, 2, 3, 4].map((i) => [-i * 2.9, 1.2 * i * 0.3 + Math.sin(ph - i * 0.9) * i * 0.45]);
  const end = pts[4];
  const [body, belly, fin] = ['#2e4a8a', '#5a7ac8', '#d0609a'];
  return [...chain(pts, 3, 1.6, body), F(limb(pts[0][0], pts[0][1] + 0.6, pts[3][0], pts[3][1] + 0.5, 0.9, 0.5, belly)),
    T([[pts[1][0] - 0.6, pts[1][1] - 1], [pts[2][0] - 1, pts[2][1] - 3.4], [pts[2][0] - 1.6, pts[2][1] - 0.6]], fin),
    T([end, [end[0] - 3.6, end[1] - 4.4], [end[0] - 2.4, end[1] - 0.4], [end[0] - 3.8, end[1] + 3.6]], fin),
    F(limb(end[0], end[1], end[0] - 3, end[1] - 3.4, 0.3, 0.2, '#f2a0c4'))];
}
function devilTail(f) {
  const ph = (f / FRAMES.tail) * TAU;
  const base = [[0, 0], [-4, 0.4], [-8, -0.6], [-10.6, -3.6], [-11.4, -7.4], [-10.4, -10.6]];
  const pts = base.map(([x, y], i) => [x + Math.sin(ph - i * 0.7) * i * 0.32, y]);
  const [tx, ty] = pts[pts.length - 1];
  return [...chain(pts, 2.2, 1.3, '#4a1e3a'),
    T([[tx, ty + 0.6], [tx - 2.6, ty - 0.6], [tx - 2.2, ty - 3], [tx, ty - 5], [tx + 2.2, ty - 3], [tx + 2.6, ty - 0.6]], '#d8487e'), F(E(tx - 0.8, ty - 2.8, 0.7, 0.5, '#ff9ac0'))];
}
// Head things, in the head's own frame (the hero head: center (15.5, 14.6), top near y 4).
function sweptHorns() {
  const near = [taper([19.2, 6.2], [18.6, 0.2], [12.6, -2.8], 3.4, 0.5, '#3a2a40'), F(taper([18.9, 5.4], [18.2, 0.4], [13.6, -2.2], 0.8, 0.25, '#7e5e8a')), F(taper([14.6, -1.8], [13.4, -2.6], [12.7, -2.8], 1, 0.3, '#d8487e'))];
  const far = [taper([12.6, 5.8], [11.8, 0.8], [6.6, -1.4], 3, 0.5, '#2e2034'), F(taper([8.4, -0.6], [7.4, -1.2], [6.7, -1.4], 0.9, 0.3, '#b03a68'))];
  return [...far, ...near];
}
function curlHorns() {
  const curl = (side, dk) => {
    const m = ([x, y]) => [15.5 + side * (x - 15.5), y];
    const pts = [[24.4, 7.4], [26.6, 4.2], [29.4, 4.6], [30.6, 7.6], [29.4, 10.4], [27, 10.4], [26.4, 8.4]].map(m);
    const col = dk ? '#3a2a40' : '#5a4258';
    const ridge = dk ? '#4e3a54' : '#7e6080';
    return [...chain(pts, 3, 1.2, col), ...pts.slice(1, 5).map((p, i) => F(limb(p[0] - side * 0.6, p[1] - 0.8, p[0] + side * 0.6, p[1] + 0.8, 0.3, 0.3, ridge))), F(E(...pts[pts.length - 1], 0.8, 0.8, '#d8487e'))];
  };
  return [...curl(-1, true), ...curl(1, false)];
}
function halo() {
  const ring = (a0, a1, c) => {
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 10; i++) {
      const a = a0 + ((a1 - a0) * i) / 10;
      outer.push([15.5 + Math.cos(a) * 6.2, -1.6 + Math.sin(a) * 2]);
      inner.push([15.5 + Math.cos(a) * 4.9, -1.6 + Math.sin(a) * 1.1]);
    }
    return T([...outer, ...inner.reverse()], c);
  };
  return [ring(Math.PI, TAU, '#ffe27a'), ring(0, Math.PI, '#f2b844'), F(E(12.2, -3, 1.2, 0.35, '#fffbe0'))];
}
const cuff = () => [T([[-1.8, -1], [1.8, -1.4], [2, 1], [-1.6, 1.4]], '#f2c94c'), F(T([[-1.6, -0.9], [1.7, -1.2], [1.7, -0.5], [-1.6, -0.2]], '#fff0b0')), F(E(0, 0.4, 0.5, 0.5, '#e8485e'))];

// Sprites: [box w, box h, anchor x, anchor y, shapes].
const HEAD_BOX = [46, 42, 7, 12];
const GROW = { featherwing: 1.2, batwing: 1.2, anklewing: 1.15, veilfin: 1, cloudtail: 1.05, fintail: 1.05, deviltail: 1.1 };
const grow = (sh, k) => {
  if (k === 1) return sh;
  const out = { ...sh, x: (sh.x ?? 0) * k, y: (sh.y ?? 0) * k };
  if (sh.pts) out.pts = sh.pts.map(([px, py]) => [px * k, py * k]);
  if (sh.rx != null) [out.rx, out.ry] = [sh.rx * k, sh.ry * k];
  if (sh.w != null) [out.w, out.h] = [sh.w * k, sh.h * k];
  return out;
};
const sizeOf = (name) => {
  const k = GROW[name] ?? 1;
  const [w, h, ax, ay] = SIZES[name];
  return [Math.ceil(w * k), Math.ceil(h * k), ax * k, ay * k];
};
function partSprite(name, f = 0, far = false) {
  const [w, h, ax, ay] = sizeOf(name);
  return art(`mochi-feat|${name}|${f}|${far ? 1 : 0}`, w, h, () => BUILD[name](f, far).map((sh) => {
    const g = grow(sh, GROW[name] ?? 1);
    return { ...g, x: g.x + ax, y: g.y + ay };
  }));
}
const SIZES = {
  featherwing: [34, 30, 6, 22], batwing: [26, 26, 4, 18], anklewing: [10, 8, 7, 4], veilfin: [14, 16, 3, 6],
  cloudtail: [16, 16, 12, 6], fintail: [22, 16, 18, 7], deviltail: [20, 26, 15, 18],
  swepthorns: HEAD_BOX, curlhorns: HEAD_BOX, halo: HEAD_BOX, cuff: [6, 5, 3, 2.5],
};
const BUILD = {
  featherwing: featherWing, batwing: batWing, anklewing: ankleWing, veilfin: veilFin,
  cloudtail: cloudTail, fintail: finTail, deviltail: devilTail,
  swepthorns: sweptHorns, curlhorns: curlHorns, halo, cuff,
};
// Draws part `name` (frame `f`) with its anchor at canvas point `p`, mirrored with the figure
// (`mirror` mirrors it again: the far wing), turned `angle` (the head's tilt).
function stamp(ctx, Fr, name, f, p, { far = false, mirror = false, angle = 0, dy = 0 } = {}) {
  const spr = partSprite(name, f, far);
  const [w, , ax, ay] = sizeOf(name);
  const flip = Fr.flip !== mirror;
  ctx.save();
  ctx.translate(p[0], p[1] + dy);
  if (angle) ctx.rotate(Fr.flip ? -angle : angle);
  ctx.scale(Fr.scale, Fr.scale);
  blit(ctx, spr, flip ? -(w - ax) : -ax, -ay, { flip });
  ctx.restore();
}

// Draws feature `feat` on a Mochi: `layer` 'under' (behind it) or 'over' (in front), `Fr` its
// posedFrame, `mv` how it's moving ({ mode, phase, time }), `hand` its near hand on the canvas.
export function drawFeature(ctx, feat, layer, Fr, mv, hand = null) {
  const { mode = 'stand', phase = 0, time = 0 } = mv;
  // Frames round each cycle: wingbeats in time with its strokes when it flies (two a stroke),
  // slow and lazy standing, quicker running, folded down swimming; tails and fins likewise.
  const cyc = (rate, n) => Math.floor(time * rate * n) % n;
  const W = FRAMES.wing;
  const flap = mode === 'fly' ? Math.floor((mv.pc ?? phase) * 2 * W) % W : mode === 'swim' ? W / 2 : cyc(mode === 'run' ? 1.6 : 0.7, W);
  const sway = cyc(mode === 'run' ? 1.5 : mode === 'swim' ? 1 : 0.55, FRAMES.tail);
  const ripple = cyc(mode === 'swim' ? 1.2 : 0.6, FRAMES.fin);
  const at = (p) => Fr.at(p);
  if (feat === 'featherwings' || feat === 'batwings') {
    if (layer !== 'under') return;
    const part = feat === 'featherwings' ? 'featherwing' : 'batwing';
    stamp(ctx, Fr, part, flap, at(Fr.body([13.4, 30.4])), { far: true, mirror: true });
    stamp(ctx, Fr, part, flap, at(Fr.body([17.6, 30.4])));
  } else if (feat === 'anklewings') {
    const f = cyc(mode === 'run' ? 3 : 0.75, FRAMES.ankle);
    const side = layer === 'under' ? 'back' : 'front';
    const [x, y] = Fr.ankle(side);
    stamp(ctx, Fr, 'anklewing', f, at([x - 1.6, y - 0.4]), { far: side === 'back' });
  } else if (feat === 'veilfins') {
    if (layer !== 'under') return;
    stamp(ctx, Fr, 'veilfin', ripple, at(Fr.head([6.6, 16.4])), { far: true, mirror: true, angle: Fr.tilt });
    stamp(ctx, Fr, 'veilfin', (ripple + FRAMES.fin / 2) % FRAMES.fin, at(Fr.head([24.6, 16.4])), { angle: Fr.tilt });
  } else if (feat === 'cloudtail' || feat === 'fintail' || feat === 'deviltail') {
    if (layer !== 'under') return;
    stamp(ctx, Fr, feat, sway, at(Fr.body([12.6, 41])));
  } else if (feat === 'swepthorns' || feat === 'curlhorns') {
    if (layer !== 'over') return;
    stamp(ctx, Fr, feat, 0, at(Fr.head([0, 0])), { angle: Fr.tilt });
  } else if (feat === 'halo') {
    if (layer === 'over') {
      // A soft glow, the ring bobbing gently over its head, and its cuffs.
      const bob = Math.sin(time * 2.4) * 0.8 * Fr.scale;
      const [gx, gy] = at(Fr.head([15.5, -1.6]));
      const gr = ctx.createRadialGradient(gx, gy + bob, 0, gx, gy + bob, 7 * Fr.scale);
      gr.addColorStop(0, 'rgba(255,240,170,0.4)');
      gr.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(gx, gy + bob, 7 * Fr.scale, 0, TAU);
      ctx.fill();
      stamp(ctx, Fr, 'halo', 0, at(Fr.head([0, 0])), { angle: Fr.tilt, dy: bob });
      if (hand) stamp(ctx, Fr, 'cuff', 0, [hand[0] + (Fr.flip ? 1 : -1) * 0.6 * Fr.scale, hand[1] - 1.2 * Fr.scale]);
    }
  }
}
