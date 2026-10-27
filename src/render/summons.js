// Summoned helpers that float beside the player: a guardian angel, a frost sprite, a venom
// salamander.
//
// Each is a small rig drawn at res 3 like the monsters (selective outline, hue-shifted ramps,
// light from the upper front): a root that bobs, a body that leans, and chained parts (wing
// bones, hair locks, ribbons, tails, flames) whose segments follow the root a beat later. Faces
// come from the kits: the heroine kit for the angel and the sprite, the creature kit for the
// salamander.
//
// drawSummon(ctx, art, x, y, time, facing, state)
//   state (optional) = { now, since, until, summon } from the summon's buff. With it the summon
//   pops in when cast, winds up before each shot, strikes as it fires and holds the blow, and
//   fades away in a burst of sparkles as the buff runs out. Without it the summon just flies.

import { T, E, F, sprite, blit, shade, mix } from './pixel.js';
import { heroineHead, heroineBrows, heroineTop } from './mobs/heroine.js';
import { eye as creatureEye, mouth as creatureMouth, blush as creatureBlush } from './mobs/faces.js';

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

const GLOWS = { angel: 'rgba(255,243,166,0.6)', sprite: 'rgba(143,227,255,0.55)', salamander: 'rgba(255,138,60,0.55)' };

// ---------- Transform stack ----------

let X = (x, y) => [x, y];
function within(f, fn) {
  const prev = X;
  X = (x, y) => prev(...f(x, y));
  try {
    return fn();
  } finally {
    X = prev;
  }
}
const rot = (cx, cy, a) => (x, y) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
};
const shift = (dx, dy) => (x, y) => [x + dx, y + dy];
const scale = (k) => (x, y) => [x * k, y * k];
const chain = (...fs) => (x, y) => fs.reduceRight((p, f) => f(...p), [x, y]);
// Local space around (x, y), turned by a: the pivot of a part.
const at = (x, y, a = 0) => chain(rot(x, y, a), shift(x, y));

// ---------- Shapes ----------

// The line around a part that overlaps another: a darkened shade of the part's own hue.
// A mid-dark, not a near-black: the sprite's own outline grows from it and darkens it again.
const ink = (c) => mix(shade(c, -20), '#6a4f8a', 0.16);
const INK_W = 0.36;

function grow(pts, d) {
  let A = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    A += x1 * y2 - x2 * y1;
  }
  const sg = A > 0 ? 1 : -1;
  const nrm = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [(sg * dy) / l, (-sg * dx) / l];
  };
  return pts.map((p, i) => {
    const a = nrm(pts[(i - 1 + pts.length) % pts.length], p);
    const b = nrm(p, pts[(i + 1) % pts.length]);
    let nx = a[0] + b[0];
    let ny = a[1] + b[1];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const k = d / Math.max(0.5, nx * a[0] + ny * a[1]);
    return [p[0] + nx * k, p[1] + ny * k];
  });
}

const poly = (pts, c) => T(pts.map(([x, y]) => X(x, y)), c);
// Shapes from the creature face kit are built in plain coordinates: carry them through the
// current transform so the face turns and moves with its head.
const place = (shapes) => shapes.map((sh) => {
  if (!sh) return sh;
  if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => X(sh.x + px, sh.y + py)) };
  if (sh.t === 'e') {
    const [px, py] = X(sh.x, sh.y);
    return { ...sh, x: px, y: py };
  }
  const [px, py] = X(sh.x + sh.w / 2, sh.y + sh.h / 2);
  return { ...sh, x: px - sh.w / 2, y: py - sh.h / 2 };
});
const fpoly = (pts, c) => F(poly(pts, c));
// A polygon with its own ink line, so it reads over whatever lies behind it.
function opoly(pts, c, d = INK_W, line = ink(c)) {
  const w = pts.map(([x, y]) => X(x, y));
  return [F(T(grow(w, d), line)), T(w, c)];
}
function ovalPts(cx, cy, rx, ry, n = 20, a = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
  }
  return out;
}
const foval = (cx, cy, rx, ry, c, a = 0, n = 18) => fpoly(ovalPts(cx, cy, rx, ry, n, a), c);
const ooval = (cx, cy, rx, ry, c, a = 0, d = INK_W) => opoly(ovalPts(cx, cy, rx, ry, 22, a), c, d);
const dot = (x, y, r, c) => {
  const [px, py] = X(x, y);
  return F(E(px, py, r, r, c));
};
const arcPts = (cx, cy, rx, ry, a0, a1, n = 8) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

function spline(pts, n = 4) {
  if (pts.length < 3 || n <= 1) return pts;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// A band along a smooth curve; `wf(t)` is its width at t in 0..1 (or a number).
function bandPts(pts, wf, n = 4) {
  const p = spline(pts, n).map(([x, y]) => X(x, y));
  const m = p.length;
  const left = [];
  const right = [];
  const wfn = typeof wf === 'number' ? () => wf : wf;
  for (let i = 0; i < m; i++) {
    const a = p[Math.max(0, i - 1)];
    const b = p[Math.min(m - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = wfn(i / (m - 1)) / 2;
    left.push([p[i][0] - dy * w, p[i][1] + dx * w]);
    right.push([p[i][0] + dy * w, p[i][1] - dx * w]);
  }
  return [...left, ...right.reverse()];
}
const fband = (pts, wf, c, n = 4) => F(T(bandPts(pts, wf, n), c));
function oband(pts, wf, c, n = 4, d = INK_W, line = ink(c)) {
  const w = bandPts(pts, wf, n);
  return [F(T(grow(w, d), line)), T(w, c)];
}
const taperW = (w0, w1) => (t) => lerp(w0, w1, t);
// A soft lock or tail: thin root, full belly, pointed tip.
const lockW = (w, root = 0.55, at2 = 0.35, tip = 0.05) => (t) => (t < at2 ? lerp(w * root, w, smooth(t / at2)) : lerp(w, w * tip, smooth((t - at2) / (1 - at2))));

// A chain hanging from `root`: each segment's angle is the rest angle plus a wave that reaches
// the segment `lag` later than the one before it, so the root leads and the tip follows.
function chainPts(root, a0, len, n, wave, bend = 0) {
  const pts = [root];
  let q = root;
  for (let i = 1; i <= n; i++) {
    const a = a0 + (bend * i) / n + wave(i);
    q = [q[0] + Math.cos(a) * (len / n), q[1] + Math.sin(a) * (len / n)];
    pts.push(q);
  }
  return pts;
}

// Two-bone reach: the joint between root and end, bending toward `dir`.
function joint(h, ft, a, b, dir) {
  const dx = ft[0] - h[0];
  const dy = ft[1] - h[1];
  const d = clamp(Math.hypot(dx, dy), 0.01, a + b - 0.05);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const k1 = [h[0] + Math.cos(base + A) * a, h[1] + Math.sin(base + A) * a];
  const k2 = [h[0] + Math.cos(base - A) * a, h[1] + Math.sin(base - A) * a];
  const kn = (k1[0] - k2[0]) * dir > 0 ? k1 : k2;
  const fl = Math.hypot(ft[0] - kn[0], ft[1] - kn[1]) || 1;
  return { k: kn, f: [kn[0] + ((ft[0] - kn[0]) / fl) * Math.min(b, fl), kn[1] + ((ft[1] - kn[1]) / fl) * Math.min(b, fl)] };
}

function sparkle(x, y, r, c) {
  return fpoly([[x, y - r], [x + r * 0.25, y - r * 0.25], [x + r, y], [x + r * 0.25, y + r * 0.25], [x, y + r], [x - r * 0.25, y + r * 0.25], [x - r, y], [x - r * 0.25, y - r * 0.25]], c);
}

// A flame of three nested tongues standing on (x, y), leaning `lean`; `k` picks its flicker.
function flame(x, y, h, w, lean, cols, k = 0) {
  const out = [];
  [1, 0.64, 0.34].forEach((s, i) => {
    const hh = h * (i === 0 ? 1 : s * 1.08);
    const ww = w * s;
    const lk = lean + Math.sin(k * 2.3 + i) * 0.25 * w;
    const side = 0.55 + 0.25 * Math.sin(k * 1.7 + i * 2);
    out.push(fpoly([
      [x - ww, y], [x - ww * 1.05, y - hh * 0.3], [x - ww * (0.9 + side * 0.3) + lk * 0.3, y - hh * 0.6], [x - ww * 0.3 + lk * 0.45, y - hh * 0.52],
      [x - ww * 0.15 + lk * 0.6, y - hh * 0.8], [x + lk, y - hh], [x + ww * 0.55 + lk * 0.4, y - hh * 0.55], [x + ww, y - hh * 0.22], [x + ww * 0.75, y + ww * 0.3], [x, y + ww * 0.5],
    ], cols[i]));
  });
  return out;
}

// ---------- Rhythm ----------

// A wing beat as one value per phase (+1 raised, -1 down): the wings hold at the top, sweep down
// fast, and come back up slowly, so the beat has weight and never plays as a ping-pong.
function beat(p, keys) {
  p = ((p % 1) + 1) % 1;
  for (let i = 0; i < keys.length; i++) {
    const [p0, v0] = keys[i];
    const [p1, v1] = keys[(i + 1) % keys.length];
    const e1 = i + 1 < keys.length ? p1 : p1 + 1;
    if (p >= p0 && p < e1) return lerp(v0, v1, smooth((p - p0) / (e1 - p0)));
  }
  return keys[0][1];
}
const BIRD_BEAT = [[0, 1], [0.14, 0.96], [0.42, -1], [0.54, -0.86], [1, 1]];

// Cast stages: 0 none, 1 wind-up (held), 2 strike (the shot leaves), 3 held impact, 4 settle.
// `k` is how far into the pose the body is: anticipation pulls back, the strike overshoots.
const CAST = [0, -1, 1.25, 1, 0.45];

// ---------- Heads (heroine kit at summon scale) ----------

// Head-local units are maiden head px (skull radius ~7.75, facing right); the kit's own space is
// scaled by HK into them, and the whole head by HS onto the summon.
const HK = 0.53;
const HS = 0.74;
const headAt = () => {
  const Xh = X;
  const [ox, oy] = Xh(0, 0);
  const dx = Math.round(ox * 3) / 3 - ox;
  const dy = Math.round(oy * 3) / 3 - oy;
  return (x, y) => {
    const [px, py] = Xh(x, y);
    return [px + dx, py + dy];
  };
};
// Lines are thickened by 1/HS so lashes and lids keep their pixel weight on the small head.
const faceLook = (look) => ({ k: HK, lineK: 1.5 / HS, browsOnTop: true, blushLines: true, blushN: 2, chibi: true, mouthK: 1.45, ...look });
const face = (mood, look) => heroineHead(headAt(), mood, faceLook(look));
const faceTop = (mood, look) => {
  const l = faceLook(look);
  return [...heroineBrows(headAt(), mood, l), ...heroineTop(headAt(), mood, l)];
};

function clumpPts(root, tip, w, curl = 0, n = 6) {
  const dx = tip[0] - root[0];
  const dy = tip[1] - root[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const ctrl = [(root[0] + tip[0]) / 2 - nx * curl, (root[1] + tip[1]) / 2 - ny * curl];
  const q = (t) => [
    (1 - t) ** 2 * root[0] + 2 * (1 - t) * t * ctrl[0] + t * t * tip[0],
    (1 - t) ** 2 * root[1] + 2 * (1 - t) * t * ctrl[1] + t * t * tip[1],
  ];
  const left = [];
  const right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const [px, py] = q(t);
    const [ax, ay] = q(Math.max(0, t - 0.02));
    const [bx, by] = q(Math.min(1, t + 0.02));
    let tx = bx - ax;
    let ty = by - ay;
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    const hw = (w / 2) * (1 - t ** 1.6) ** 0.85;
    left.push([px + ty * hw, py - tx * hw]);
    right.push([px - ty * hw, py + tx * hw]);
  }
  return [...left, ...right.slice(0, -1).reverse()];
}

// Hair over the skull: a cap, clumps across the brow on a darker backing (it shows in the V
// between their tips), each shaded down its far side, and the angel ring broken between clumps.
function crownHair(H) {
  const out = [];
  const side = H.side ?? 4.6;
  const cap = [...arcPts(0, -0.3, 7.75, 7.7, 156, 350, 18), [7.5, -1.4], [6.2, -3.4], [3.4, -4.7], [0, -4.9], [-2.4, -4.1], [-3, -1.6], [-3.3, side - 1], [-4.4, side + 0.4], [-6.2, side - 0.2]];
  out.push(fpoly(cap, H.c));
  out.push(fpoly([...arcPts(0, -0.3, 7.8, 7.75, 150, 210, 6), ...arcPts(1.4, 0.8, 6, 6.4, 210, 166, 5), [-4.3, 0.6], [-4, side], [-4.5, side + 0.4], [-6.3, side - 0.2]], H.sh));
  const clumps = H.fringe.map(([x0, y0, x1, y1, w, curl = 0]) => clumpPts([x0, y0], [x1, y1], w, curl));
  for (const pts of clumps) out.push(fpoly(pts.map(([x, y]) => [x, y + 0.45]), H.sh2));
  clumps.forEach((pts, i) => {
    const [x0, y0, x1, y1, w, curl = 0] = H.fringe[i];
    out.push(fpoly(pts, H.c));
    out.push(fpoly(clumpPts([lerp(x0, x1, 0.4) + w * 0.22, lerp(y0, y1, 0.4)], [x1 + w * 0.04, y1 - 0.25], w * 0.34, curl * 0.4, 4), H.sh));
  });
  const [rcx, rcy, rr, rry] = [-0.2, 0.2, 6.2, 5.8];
  [[198, 234], [240, 282], [288, 326]].forEach(([a0, a1], si) => {
    const top = arcPts(rcx, rcy, rr + 0.6, rry + 0.6, a0, a1, 5);
    const bot = [];
    for (let i = 4; i >= 0; i--) {
      const a = ((a0 + ((a1 - a0) * i) / 4) * Math.PI) / 180;
      const d = i % 2 ? 1.1 + (si % 2) * 0.3 : 0.15;
      bot.push([rcx + Math.cos(a) * (rr - d), rcy + Math.sin(a) * (rry - d)]);
    }
    out.push(fpoly([...top, ...bot], H.lt));
  });
  return out;
}

// The bangs' lower edge in the kit's units, for the shadow they cast on the brow.
function bangEdge(fringe) {
  const pts = [];
  const cx = (x) => clamp(x, -3, 6.6) / HK;
  fringe.forEach(([, , x1, y1, w]) => pts.push([cx(x1 - w * 0.5), (y1 - 1.2) / HK], [cx(x1), y1 / HK]));
  return [...pts.sort((a, b) => a[0] - b[0]), [4.4 / HK, -4.8 / HK]];
}

// A lock of hair as one tapering clump with its shaded side and a lit edge.
function lockHair(pts, w, H) {
  const wf = lockW(w, 0.9, 0.3, 0.02);
  const sp = spline(pts, 4);
  return [
    ...oband(pts, wf, H.c, 4, 0.3, ink(H.sh2)),
    fband(sp.map(([x, y]) => [x - 0.45, y + 0.15]), (t) => wf(t) * 0.42, H.sh, 1),
    fband(sp.slice(1, Math.round(sp.length * 0.6)).map(([x, y]) => [x + w * 0.22, y]), (t) => wf(t) * 0.18, H.lt, 1),
  ];
}

// The hair behind the head, round over the back of the skull and falling to pointed clumps.
function backHair(H, low = 6.4, sway = 0) {
  const s = (y) => sway * clamp(y / low, 0, 1);
  const pts = [...arcPts(0, -0.4, 7.9, 7.9, 172, 330, 10), [5.6, 1.6], [4.4 + s(low * 0.7), low * 0.72], [3 + s(low), low + 0.4], [1.2 + s(low), low * 0.86], [-1 + s(low), low + 1], [-3 + s(low), low * 0.88], [-5 + s(low), low + 0.5], [-6.4 + s(low * 0.8), low * 0.75], [-8, 1.2]];
  return [...opoly(pts, H.sh2, 0.34, ink(H.sh2)), fpoly(pts.slice(0, 11).map(([x, y]) => [x * 0.9 - 0.3, y * 0.9 - 0.3]), H.sh)];
}

// ---------- Feathered wing (the angel's) ----------

// A feather from (bx, by) toward angle a: a long leaf with its own line, a shaded back vane and
// an optional tinted tip.
function feather(bx, by, a, len, wid, P, o = {}) {
  const d = [Math.cos(a), Math.sin(a)];
  const n = [-d[1], d[0]];
  const p = (t, s) => [bx + d[0] * len * t + n[0] * wid * s, by + d[1] * len * t + n[1] * wid * s];
  const tipK = o.point ?? 0.16;
  const body = [p(0, 0.3), p(0.45, 0.5), p(0.82, 0.42), p(0.97, tipK), p(1, 0), p(0.97, -tipK), p(0.82, -0.42), p(0.45, -0.5), p(0, -0.3)];
  const out = [...opoly(body, o.c ?? P.c, 0.36, P.line)];
  out.push(fpoly([p(0.1, 0), p(0.45, 0.48), p(0.82, 0.4), p(0.97, tipK * 0.8), p(1, 0)], o.vane ?? P.sh));
  if (o.tip) out.push(fpoly([p(0.66, 0.47), p(0.82, 0.42), p(0.97, tipK), p(1, 0), p(0.97, -tipK), p(0.82, -0.42), p(0.66, -0.47)], o.tip));
  return out;
}

// A wing on three bones from the shoulder `sh`: arm, forearm, hand. `ang(i)` gives each bone's
// angle; a later bone gets the beat later, so the tip trails the shoulder. Primaries fan from the
// hand, secondaries hang from the forearm, and two rows of coverts sit over their roots.
function featherWing(sh, ang, P, o = {}) {
  const L = o.bones ?? [3.4, 4.2, 3.6];
  const pts = [sh];
  for (let i = 0; i < 3; i++) {
    const a = ang(i);
    const q = pts[i];
    pts.push([q[0] + Math.cos(a) * L[i], q[1] + Math.sin(a) * L[i]]);
  }
  const out = [];
  const hand = ang(2);
  const fore = ang(1);
  const prim = o.primaries ?? [[0.1, 9, 2.6], [-0.35, 8.6, 2.6], [-0.75, 8, 2.5], [-1.1, 7, 2.4]];
  const spread = o.spread ?? 1;
  // Back to front: the long primaries first, then the secondaries, then the coverts on top.
  prim.forEach(([da, len, w], i) => {
    const t = i / (prim.length - 1);
    const base = [lerp(pts[3][0], pts[2][0], t * 0.7), lerp(pts[3][1], pts[2][1], t * 0.7)];
    out.push(...feather(base[0], base[1], hand + da * spread, len, w, P, { tip: P.tip, point: o.point, c: i % 2 ? P.c2 ?? P.c : P.c }));
  });
  const sec = o.secondaries ?? [[-1.35, 6, 2.4], [-1.6, 5.4, 2.3], [-1.85, 4.6, 2.2]];
  sec.forEach(([da, len, w], i) => {
    const t = (i + 0.5) / sec.length;
    const base = [lerp(pts[2][0], pts[1][0], t), lerp(pts[2][1], pts[1][1], t)];
    out.push(...feather(base[0], base[1], fore + da * spread, len, w, P, { tip: P.tip2 ?? null, point: o.point, c: P.c2 ?? P.c }));
  });
  // Coverts: the arm as one soft, rounded band, lit along its leading edge.
  const cv = [pts[0], pts[1], pts[2], [lerp(pts[2][0], pts[3][0], 0.7), lerp(pts[2][1], pts[3][1], 0.7)]];
  const cw = o.covert ?? 3.6;
  out.push(...oband(cv, lockW(cw, 0.95, 0.4, 0.3), P.cov ?? P.c, 3, 0.36, P.line));
  // A row of rounded coverts along the trailing side, so the arm reads as feathers, not a plank.
  [0.3, 0.6, 0.88].forEach((t, i) => {
    const bi = Math.min(2, Math.floor(t * 3));
    const u = t * 3 - bi;
    const q = [lerp(cv[bi][0], cv[bi + 1][0], u), lerp(cv[bi][1], cv[bi + 1][1], u)];
    const a = ang(bi) + 1.57;
    out.push(...opoly(ovalPts(q[0] + Math.cos(a) * cw * 0.42, q[1] + Math.sin(a) * cw * 0.42, cw * 0.42, cw * 0.3, 14, ang(bi) + 0.5), i % 2 ? P.c2 ?? P.c : P.cov ?? P.c, 0.32, P.line));
  });
  out.push(fband(cv.slice(0, 3).map(([x, y]) => [x, y + 0.2]), lockW((o.covert ?? 3.6) * 0.42, 1, 0.4, 0.4), P.sh, 2));
  out.push(fband(cv.slice(0, 3).map(([x, y], i) => [x + Math.cos(ang(i) - 1.57) * 0.9, y + Math.sin(ang(i) - 1.57) * 0.9]), lockW(0.8, 1, 0.4, 0.2), P.lt, 2));
  return out;
}

// ---------- Guardian Angel ----------

const AN = {
  skin: '#ffeae0', skinSh: '#f6c8c3',
  hair: '#ffd98a', hairLt: '#fff4c4', hairSh: '#eba95e', hairSh2: '#c27a4e',
  robe: '#fbf8ff', robeLt: '#ffffff', robeSh: '#dcd3f4', robeSh2: '#b4a6dc',
  gold: '#ffd25a', goldLt: '#fff6c0', goldSh: '#e39a3a', goldSh2: '#a8602e',
};
const ANGEL_WING = { c: '#fbfaff', c2: '#f3f2ff', sh: '#dcdaf6', lt: '#ffffff', tip: '#fff1c8', cov: '#ffffff', line: '#9f97cf' };
const ANGEL_WING_FAR = { c: '#e6e3f8', c2: '#dedaf4', sh: '#c9c4ec', lt: '#f2f0ff', tip: '#f1e2c4', cov: '#ebe8fa', line: '#8e86c2' };
// Honey-blonde hair against clear sky-blue eyes: the face holds the darkest dark (the lash) next
// to the lightest light (the catchlight).
const ANGEL_FACE = {
  skin: AN.skin, skinSh: '#f6c8c3', skinSh2: '#e0a1ab', blush: '#ff9fb2', lip: '#e2627c', lipLine: '#a8344f',
  eye: { nearX: 1.5, farX: 9.8, rx: 4.4, ry: 3.7, tilt: 0.05, iris: '#4f9cff', irisDk: '#1f3d96', irisLt: '#cdeaff', pupil: 'round', pupilC: '#13265e', sparkle: true, wing: 1, flicks: 1, lashLen: 1.1, ink: '#5a2e1c', crease: false, lower: '#e0a1ab', lashSh: '#f0cfc8' },
  brow: { c: '#c27a4e', kind: 'soft', w: 0.7 },
  moods: {
    idle: { mouth: 'soft', gaze: [0.08, 0] },
    // Casting: eyes wide and set, calling out the blessing.
    angry: { hot: false, open: 1, inner: 0.4, raise: 0.2, pupil: 0.85, iris: 1, mouth: 'grin', blush: 0.8, knit: false, brow: { inner: 0.9, outer: -0.3, arch: -0.3, w: 1.1 } },
    happy: { mouth: 'smile', blush: 1.4 },
  },
};
// Soft, rounded clumps with a little curl at the tips.
const ANGEL_FRINGE = [[-2.4, -4.6, -3.4, 0.6, 3, -0.7], [-0.4, -5.6, -0.2, 0.4, 3.4, -0.5], [2, -5.6, 3.2, 1.2, 3.4, 0.7], [4.4, -5, 5.6, -0.2, 3, 0.8], [6.4, -3.6, 7.6, 1.8, 2.4, 0.6]];

function angel(fp, cast, mood) {
  const P = AN;
  const ph = fp * TAU;
  const ck = CAST[cast];
  const F0 = (d = 0) => (cast === 2 || cast === 3 ? -1 : cast === 1 ? 1 : beat(fp - d, BIRD_BEAT));
  // The body rides the wings: it rises on the downstroke a beat after the wings push.
  const bob = cast ? -ck * 0.4 : -F0(0.12) * 0.7;
  const sway = Math.sin(ph) * 0.35;
  const root = [21 + sway - (cast === 1 ? 1 : cast >= 2 ? -ck * 0.8 : 0), 26.4 + bob];
  const lean = cast === 1 ? -0.12 : cast >= 2 ? ck * 0.1 : 0.04 + Math.sin(ph - 0.6) * 0.03;
  const out = [];
  const T0 = at(root[0], root[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));

  // Wings from between the shoulder blades: the far one behind the robe, the near one over it.
  const wingAng = (side) => (i) => {
    const f = F0(i * 0.07);
    const raised = -1.95 - side * 0.12 - i * 0.18;
    const low = -2.95 - i * 0.35;
    return lerp(low, raised, (f + 1) / 2) + lean + (cast === 2 ? -0.15 * i : 0);
  };
  const sh = pt(-2.4, -6.4);
  out.push(...featherWing([sh[0] + 0.8, sh[1] - 0.6], wingAng(-1), ANGEL_WING_FAR, { bones: [3, 3.8, 3.2] }));

  // The far sleeve, then the robe: a bell from the shoulders, its hem in three soft points that
  // swish a beat behind the body.
  const hem = (i) => Math.sin(ph - 1.2 - i * 0.7) * 0.6 - (cast >= 2 ? ck * 0.8 : 0);
  within(T0, () => {
    out.push(...oband([[1.6, -6.2], [3.6, -3.2], [4.6, -1.8]], taperW(2.6, 2), P.robeSh, 2));
    const robe = [[-2.4, -7.6], [0, -8.4], [2.6, -7.8], [3.8, -5.2], [4.4, -1], [5.6, 4], [6.4 + hem(0), 8.6], [4 + hem(0), 7.6], [1.8 + hem(1), 9.4], [-0.6 + hem(1), 7.8], [-3 + hem(2), 9], [-4.6 + hem(2), 7], [-4.6, 3], [-4, -1.4], [-3.6, -5.2]];
    out.push(...opoly(robe, P.robe));
    // Shadow down the back and under the far side, hue-shifted lavender, not grey.
    out.push(fpoly([[-2.4, -7.6], [-1.2, -8], [-1.6, -3], [-1.4, 3], [-0.6 + hem(1), 7.8], [-3 + hem(2), 9], [-4.6 + hem(2), 7], [-4.6, 3], [-4, -1.4], [-3.6, -5.2]], P.robeSh));
    out.push(fpoly([[-4.6 + hem(2), 7], [-3 + hem(2), 9], [-0.6 + hem(1), 7.8], [-2.2, 6.6]], P.robeSh2));
    // Folds falling from the sash.
    out.push(fband([[1.2, 0.4], [1.6 + hem(1) * 0.4, 5], [1.8 + hem(1), 8.4]], taperW(0.5, 0.9), P.robeSh, 2));
    out.push(fband([[3.8, 0.6], [4.4 + hem(0) * 0.4, 4.6]], taperW(0.4, 0.7), P.robeSh, 2));
    // A light plane on the front of the bodice.
    out.push(fpoly([[1.4, -7.8], [2.6, -7.8], [3.6, -5.2], [3.4, -2], [2, -2.2]], P.robeLt));
    // A gold sash with a knot and two tails that trail behind.
    out.push(...opoly([[-3.9, -2.6], [4.2, -2.8], [4.3, -1.2], [-4.2, -1]], P.gold, 0.32, ink(P.goldSh2)));
    out.push(fpoly([[-3.9, -1.8], [4.3, -2], [4.3, -1.2], [-4.2, -1]], P.goldSh));
    out.push(fband([[-2, -2.6], [2.6, -2.8]], 0.36, P.goldLt, 1));
    const tail = (k) => chainPts([-4, -1.8], 2.2 + k * 0.4, 5.6 - k, 3, (i) => Math.sin(ph - 0.8 - i * 0.7 - k) * 0.22 - (cast >= 2 ? 0.3 : 0));
    out.push(...oband(tail(1), taperW(1.3, 0.5), P.goldSh, 3, 0.3, ink(P.goldSh2)), ...oband(tail(0), taperW(1.4, 0.5), P.gold, 3, 0.3, ink(P.goldSh2)));
    // Gold trim along the hem points.
    out.push(fband([[5.6, 4.6], [6.4 + hem(0), 8.6], [4 + hem(0), 7.6], [1.8 + hem(1), 9.4], [-0.6 + hem(1), 7.8]], 0.6, P.gold, 1));
  });

  out.push(...featherWing(sh, wingAng(1), ANGEL_WING, { bones: [3.4, 4.2, 3.6] }));

  // Neck pivot, then the head, which trails the body's lean by a beat.
  const neck = pt(0.6, -8);
  const tilt = cast === 1 ? -0.14 : cast >= 2 ? 0.08 : Math.sin(ph - 1) * 0.05;
  const hc = [neck[0] + 0.4, neck[1] - 5.4];
  out.push(...oband([[neck[0], neck[1] + 0.6], [hc[0] + 0.2, hc[1] + 4.6]], 2, P.skin, 1), fband([[hc[0] - 0.4, hc[1] + 5], [hc[0] + 1, hc[1] + 4.8]], 0.8, P.skinSh, 1));
  const HR = { c: P.hair, sh: P.hairSh, sh2: P.hairSh2, lt: P.hairLt };
  within(chain(at(hc[0], hc[1], tilt), scale(HS)), () => {
    out.push(...backHair(HR, 5.4, Math.sin(ph - 1.4) * 0.6));
    out.push(...face(mood, { ...ANGEL_FACE, bangs: bangEdge(ANGEL_FRINGE) }));
    out.push(...crownHair({ ...HR, fringe: ANGEL_FRINGE }));
    // A side lock by the cheek, curling a beat behind the head.
    out.push(...lockHair(chainPts([6.6, -1.4], 1.62, 7, 3, (i) => Math.sin(ph - 1 - i * 0.8) * 0.12 * i), 2.3, HR));
    out.push(...faceTop(mood, ANGEL_FACE));
  });
  // The halo floats over the crown and follows the head a beat late; it flares on the strike.
  {
    const hl = [hc[0] - 0.4 + Math.sin(ph - 1.8) * 0.3, hc[1] - 8.4 + Math.sin(ph - 1.4) * 0.4 - (cast >= 2 ? 0.6 : 0)];
    const rx = cast === 2 ? 5 : 4.4;
    within(at(hl[0], hl[1], tilt * 0.6 - 0.08), () => {
      out.push(...opoly(ovalPts(0, 0, rx, 1.6, 24), P.gold, 0.32, ink(P.goldSh2)));
      // Metal in three steps: the far half in shadow, the near half bright, a specular on the bevel.
      out.push(fpoly(arcPts(0, 0, rx, 1.6, 180, 360, 10), P.goldSh));
      out.push(fpoly(ovalPts(0, -0.15, rx - 1.2, 0.75, 18), 'none'));
      out.push(fband(arcPts(0, 0.1, rx - 0.6, 1.1, 30, 150, 8), 0.5, P.goldLt, 1));
      out.push(dot(-rx * 0.45, 0.95, 0.42, '#ffffff'));
    });
  }

  // The near arm in its sleeve: hands folded in prayer; pulled in on the wind-up, flung open
  // toward the foe on the strike and held there.
  {
    const s0 = pt(1.8, -6.6);
    const hand = cast === 1 ? [s0[0] - 1.4, s0[1] + 4.6] : cast >= 2 ? [s0[0] + 6.4 + ck * 0.6, s0[1] - 1.2 - ck * 0.6] : [s0[0] + 2.4, s0[1] + 5.4 + Math.sin(ph - 0.8) * 0.3];
    const j = joint(s0, hand, 3.4, 3.4, cast === 1 ? 1 : -1);
    out.push(...oband([s0, j.k, j.f], (t) => lerp(2.3, 1.7, t) + smooth(clamp((t - 0.6) / 0.4, 0, 1)) * 1, P.robe, 3));
    out.push(fband([[j.k[0], j.k[1] + 0.6], [j.f[0], j.f[1] + 0.7]], 0.7, P.robeSh, 1));
    out.push(fband([j.f, [j.f[0] + (j.f[0] - j.k[0]) * 0.12, j.f[1] + (j.f[1] - j.k[1]) * 0.12]], 2.9, P.gold, 1));
    if (cast >= 2) {
      out.push(...ooval(j.f[0] + 1.6, j.f[1], 1.25, 1.05, P.skin, -0.3, 0.32));
      out.push(sparkle(j.f[0] + 4.2, j.f[1] - 0.6, cast === 2 ? 2.6 : 1.8, P.goldLt), sparkle(j.f[0] + 4.2, j.f[1] - 0.6, cast === 2 ? 1.2 : 0.8, '#ffffff'));
    } else out.push(...ooval(j.f[0] + 0.5, j.f[1] + 0.7, 1.1, 1.2, P.skin, 0.4, 0.32));
    if (cast === 1) out.push(sparkle(j.f[0] + 0.4, j.f[1] + 0.8, 1.6, P.goldLt), sparkle(j.f[0] + 0.4, j.f[1] + 0.8, 0.8, '#ffffff'));
  }
  return { w: 40, h: 40, res: 3, shapes: out };
}

// ---------- Frost Sprite ----------

const FR = {
  skin: '#fff1ec', skinSh: '#f2cfd4',
  hair: '#a6dcff', hairLt: '#e6f7ff', hairSh: '#6fb0ec', hairSh2: '#4f7fcf',
  dress: '#8fe0fa', dressLt: '#d8f8ff', dressSh: '#5fb0e6', dressSh2: '#4a7fcc',
  glass: '#d6f5ff', glassLt: '#ffffff', glassSh: '#9fd6f4', glassDk: '#6aa8e2', glassLine: '#5a8fd0',
  snow: '#ffffff', snowSh: '#bfe4ff',
};
// Cool icy hair against warm violet-pink eyes, a round cute eye with a star glint.
const SPRITE_FACE = {
  skin: FR.skin, skinSh: '#f2cfd4', skinSh2: '#d8a6bc', blush: '#ffa6c8', lip: '#ff7fa8', lipLine: '#b8406a', tearC: '#d8f4ff',
  eye: { nearX: 1.5, farX: 9.8, rx: 4.4, ry: 3.9, tilt: 0.02, iris: '#c46cff', irisDk: '#4e2296', irisLt: '#f2dcff', pupil: 'round', pupilC: '#28125a', sparkle: true, wing: 1, flicks: 1, lashLen: 1.1, ink: '#23366e', crease: false, lower: '#d8a6bc', lashSh: '#ead2e0' },
  brow: { c: '#4f7fcf', kind: 'soft', w: 0.7 },
  moods: {
    idle: { mouth: 'soft', gaze: [0.08, 0] },
    angry: { hot: false, open: 1, inner: 0.6, raise: 0.25, pupil: 0.8, mouth: 'shout', blush: 0.6, knit: false, brow: { inner: 1.2, outer: -0.4, arch: -0.3, w: 1.1 } },
    happy: { mouth: 'smile', blush: 1.4 },
  },
};
const SPRITE_FRINGE = [[-2.4, -4.6, -3.2, 0.2, 2.8, -0.6], [-0.4, -5.6, -0.6, -0.4, 3.2, -0.4], [2, -5.6, 2.8, 1, 3.2, 0.5], [4.4, -5, 5.4, -0.6, 3, 0.6], [6.4, -3.6, 7.6, 1.4, 2.4, 0.5]];

// A crystal wing from (x, y) toward angle a: an ice shard in three flat facets. Like a gem, the
// darkest facet sits nearest the light and the far facet catches it; a bright rim on the lit edge.
function crystalWing(x, y, a, len, w, P, far) {
  const d = [Math.cos(a), Math.sin(a)];
  const n = [-d[1], d[0]];
  const p = (t, s) => [x + d[0] * len * t + n[0] * w * s, y + d[1] * len * t + n[1] * w * s];
  const outline = [p(0, 0.2), p(0.35, 0.62), p(0.72, 0.5), p(1, 0), p(0.8, -0.38), p(0.5, -0.5), p(0.2, -0.3), p(0, -0.2)];
  const c = far ? P.glassSh : P.glass;
  const out = [...opoly(outline, c, 0.36, P.glassLine)];
  out.push(fpoly([p(0, 0), p(0.35, 0.62), p(0.72, 0.5), p(0.55, 0.05)], far ? P.glassDk : P.glassSh));
  out.push(fpoly([p(0.55, 0.05), p(0.72, 0.5), p(1, 0)], far ? P.glassSh : P.glass));
  out.push(fband([p(0.08, -0.18), p(0.5, -0.44), p(0.8, -0.32)], 0.42, far ? P.glass : P.glassLt, 1));
  out.push(fband([p(0.05, 0), p(0.55, 0.05), p(0.95, 0)], 0.3, far ? P.glassLine : P.glassDk, 1));
  if (!far) out.push(dot(p(0.62, -0.18)[0], p(0.62, -0.18)[1], 0.45, '#ffffff'));
  return out;
}

function snowflake(x, y, r, c, a = 0) {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const t = a + (i / 6) * TAU;
    const tip = [x + Math.cos(t) * r, y + Math.sin(t) * r];
    out.push(fband([[x, y], tip], taperW(0.75, 0.5), c, 1));
    const m = [x + Math.cos(t) * r * 0.55, y + Math.sin(t) * r * 0.55];
    out.push(fband([[m[0] + Math.cos(t + 0.9) * r * 0.32, m[1] + Math.sin(t + 0.9) * r * 0.32], m, [m[0] + Math.cos(t - 0.9) * r * 0.32, m[1] + Math.sin(t - 0.9) * r * 0.32]], 0.45, c, 1));
  }
  out.push(dot(x, y, r * 0.28, c));
  return out;
}

function frostSprite(fp, cast, mood) {
  const P = FR;
  const ph = fp * TAU;
  const ck = CAST[cast];
  // Insect-quick wings: two flutters per cycle.
  const flut = cast === 1 ? 0.9 : cast >= 2 ? -0.9 : Math.sin(ph * 2);
  const bob = cast ? -ck * 0.3 : Math.sin(ph - 0.4) * 0.8;
  const root = [20.5 + Math.sin(ph) * 0.4 - (cast === 1 ? 1 : cast >= 2 ? -ck * 0.6 : 0), 23.4 + bob];
  const lean = cast === 1 ? -0.16 : cast >= 2 ? ck * 0.12 : 0.05 + Math.sin(ph - 0.5) * 0.04;
  const out = [];
  const T0 = at(root[0], root[1], lean);
  const pt = (x, y) => within(T0, () => X(x, y));

  // Two pairs of ice wings from the shoulder blades; the lower pair beats a beat behind.
  const wr = pt(-2, -6.4);
  const fl = (lag) => (cast ? flut : Math.sin(ph * 2 - lag));
  out.push(...crystalWing(wr[0] + 0.6, wr[1] - 0.4, -2.0 + fl(0) * 0.28 + lean, 10, 5, P, true), ...crystalWing(wr[0] + 0.6, wr[1] + 0.8, -2.9 + fl(0.8) * 0.2 + lean, 7.6, 4, P, true));

  // A ponytail from the back of the head, chained, swinging a beat behind the body.
  const neck = pt(0.5, -7.8);
  const tilt = cast === 1 ? -0.16 : cast >= 2 ? 0.1 : Math.sin(ph - 1) * 0.06;
  const hc = [neck[0] + 0.4, neck[1] - 5.2];
  const HR = { c: P.hair, sh: P.hairSh, sh2: P.hairSh2, lt: P.hairLt };
  within(chain(at(hc[0], hc[1], tilt), scale(HS)), () => {
    const tail = chainPts([-6.4, -4.4], 2.75, 15, 5, (i) => Math.sin(ph - 1.2 - i * 0.75) * 0.12 * i + (cast >= 2 ? -0.08 * i : 0), -0.7);
    out.push(...lockHair(tail, 5.2, HR));
    out.push(...ooval(-6.6, -4.6, 1.8, 1.6, P.dressSh, 0, 0.3), dot(-6.2, -5.1, 0.5, P.dressLt));
  });

  // Legs: bare, pointed toes, dangling and trailing behind as she flits.
  const leg = (hx, foot, c) => {
    const h0 = pt(hx, 2);
    const k = joint(h0, foot, 4.4, 4.4, 1);
    const dir = Math.atan2(k.f[1] - k.k[1], k.f[0] - k.k[0]) - 0.3;
    return [...oband([h0, k.k, k.f], taperW(2.2, 1.2), c, 2, 0.32), ...oband([k.f, [k.f[0] + Math.cos(dir) * 1.8, k.f[1] + Math.sin(dir) * 1.8]], taperW(1.2, 0.4), c, 1, 0.3)];
  };
  const kick = cast >= 2 ? -1.6 : 0;
  out.push(...leg(-1.4, [root[0] - 4 + Math.sin(ph - 1.6) * 0.8 + kick, root[1] + 9.6], P.skinSh));

  // The dress: a frosted bodice and a skirt that ends in icicle points, swishing a beat behind.
  const sw = (i) => Math.sin(ph - 1.1 - i * 0.6) * 0.5 - (cast >= 2 ? ck * 0.6 : 0);
  within(T0, () => {
    out.push(...oband([[1.6, -6], [3.4, -3.4]], taperW(2.2, 1.8), P.skinSh, 1));
    const skirt = [[-2.8, -7.2], [0, -8], [2.6, -7.4], [3.4, -4.6], [3, -1.6], [5.6 + sw(0), 3], [4.4 + sw(0), 2.6], [3.8 + sw(0), 5.4], [2.2 + sw(1), 3.4], [0.6 + sw(1), 6.2], [-0.8 + sw(2), 3.4], [-2.6 + sw(2), 5.6], [-3.4 + sw(2), 2.6], [-5 + sw(3), 3.6], [-4, -1], [-3.6, -4.8]];
    out.push(...opoly(skirt, P.dress, 0.36, ink(P.dressSh2)));
    out.push(fpoly([[-2.8, -7.2], [-1.4, -7.6], [-1.6, -1.6], [-0.8 + sw(2), 3.4], [-2.6 + sw(2), 5.6], [-3.4 + sw(2), 2.6], [-5 + sw(3), 3.6], [-4, -1], [-3.6, -4.8]], P.dressSh));
    out.push(fpoly([[-2.6 + sw(2), 5.6], [-3.4 + sw(2), 2.6], [-5 + sw(3), 3.6], [-2.6, 1.4]], P.dressSh2));
    out.push(fpoly([[1, -7.8], [2.6, -7.4], [3.4, -4.6], [2.2, -3.4]], P.dressLt));
    // Frost trim: a pale band at the waist and snow on the icicle tips.
    out.push(...opoly([[-3.8, -2.4], [3.3, -2.6], [3.2, -1.2], [-4, -1]], P.snow, 0.3, ink(P.snowSh)));
    out.push(fband([[-3.4, -1.4], [3, -1.6]], 0.4, P.snowSh, 1));
    out.push(fband([[5.6 + sw(0), 3], [4.4 + sw(0), 2.6], [3.8 + sw(0), 5.4], [2.2 + sw(1), 3.4], [0.6 + sw(1), 6.2]], 0.5, P.dressLt, 1));
  });
  out.push(...leg(1.2, [root[0] - 0.6 + Math.sin(ph - 0.8) * 0.8 + kick, root[1] + 10.6], P.skin));

  // Near wings over the back of the dress.
  out.push(...crystalWing(wr[0], wr[1], -2.25 + fl(0) * 0.32 + lean, 11.5, 5.6, P, false), ...crystalWing(wr[0] + 0.2, wr[1] + 1.2, -3.15 + fl(0.8) * 0.24 + lean, 8.4, 4.4, P, false));

  // Neck and head, with a snowflake tiara.
  out.push(...oband([[neck[0], neck[1] + 0.6], [hc[0] + 0.2, hc[1] + 4.4]], 2, P.skin, 1), fband([[hc[0] - 0.4, hc[1] + 4.8], [hc[0] + 1, hc[1] + 4.6]], 0.8, P.skinSh, 1));
  within(chain(at(hc[0], hc[1], tilt), scale(HS)), () => {
    out.push(...backHair(HR, 4.6, Math.sin(ph - 1.4) * 0.5));
    out.push(...face(mood, { ...SPRITE_FACE, bangs: bangEdge(SPRITE_FRINGE) }));
    out.push(...crownHair({ ...HR, fringe: SPRITE_FRINGE }));
    out.push(...lockHair(chainPts([6.6, -1.4], 1.6, 6.6, 3, (i) => Math.sin(ph - 1 - i * 0.8) * 0.14 * i), 2.2, HR));
    out.push(...faceTop(mood, SPRITE_FACE));
    // Pointed elfin ear through the hair.
    out.push(...opoly([[-3.2, 0.6], [-8.6, -2.8 + Math.sin(ph * 2 - 0.5) * 0.3], [-3.6, 3]], P.skin, 0.3, ink(P.skinSh)), fpoly([[-4, 1.2], [-7.4, -1.8], [-4.2, 2.2]], P.skinSh));
    out.push(...snowflake(1.6, -8, cast === 2 ? 3 : 2.5, P.snow, cast * 0.3));
    out.push(dot(1.6, -8, 0.7, P.hairSh));
  });

  // The near arm: tossing frost. Drawn back over the head on the wind-up, flung forward on the
  // strike, the hand open with a snowflake leaving it.
  {
    const s0 = pt(1.8, -6.2);
    const hand = cast === 1 ? [s0[0] - 2.4, s0[1] + 4] : cast >= 2 ? [s0[0] + 6.6, s0[1] - 0.4 + (cast === 4 ? 1.6 : 0)] : [s0[0] + 3.4 + Math.sin(ph) * 0.3, s0[1] + 3.6 + Math.sin(ph - 0.6) * 0.4];
    const j = joint(s0, hand, 3.4, 3.4, cast === 1 ? 1 : -1);
    out.push(...oband([s0, j.k, j.f], taperW(2.1, 1.5), P.skin, 2, 0.32));
    out.push(...ooval(j.f[0] + 0.4, j.f[1], 1.05, 0.95, P.skin, 0, 0.3));
    if (cast === 1) out.push(...snowflake(j.f[0] + 0.4, j.f[1] + 0.4, 1.8, P.snow, 0.4));
    if (cast === 2 || cast === 3) out.push(...snowflake(j.f[0] + 3.6, j.f[1] - 0.4, cast === 2 ? 2.4 : 1.8, P.snow, cast), sparkle(j.f[0] + 6, j.f[1] - 2.4, 1.2, '#ffffff'));
  }
  return { w: 40, h: 38, res: 3, shapes: out };
}

// ---------- Venom Salamander ----------

const SA = {
  body: '#ff8240', bodyLt: '#ffb46a', bodySh: '#ea4c3e', bodySh2: '#a82a52',
  belly: '#a6ec70', bellyLt: '#e2ffa4', bellySh: '#5fbe5c',
  spot: '#b46bff', spotDk: '#7a3ec8',
  fire: ['#ff7a2e', '#ffc94a', '#fff6c4'],
  eye: '#2b8f5a',
};

// A fat little newt that swims through the air: the spine is a chain from the head to the tail
// tip with a wave running down it, four stubby legs paddle in diagonal pairs, flames lick along
// its back and burn at the tip of its tail. It breathes in on the wind-up and spits on the strike.
function salamander(fp, cast, mood) {
  const P = SA;
  const ph = fp * TAU;
  const ck = CAST[cast];
  const out = [];
  const bob = cast ? 0 : Math.sin(ph - 0.3) * 0.7;
  // Wind-up rears the head back and puffs the body; the strike lunges it forward.
  const lunge = cast === 1 ? -1.6 : cast >= 2 ? ck * 1.6 : 0;
  const puff = cast === 1 ? 1.12 : cast === 2 ? 0.92 : 1;
  const head = [26 + lunge, 15.6 + bob - (cast === 1 ? 1.4 : 0)];
  const body = [17 + lunge * 0.4, 19 + bob * 0.6];
  const bodyA = cast === 1 ? -0.22 : cast >= 2 ? 0.05 : Math.sin(ph - 0.8) * 0.06 - 0.06;

  // Tail: a chain from the hips, the wave reaching each segment later than the last.
  const hip = [body[0] - 6 * Math.cos(bodyA), body[1] - 6 * Math.sin(bodyA)];
  const tail = chainPts(hip, Math.PI + 0.25, 13, 6, (i) => Math.sin(ph - 0.9 - i * 0.7) * 0.16 * i + (cast >= 2 ? 0.05 * i : 0), -2.1);
  out.push(...oband(tail, lockW(5.4, 1, 0.12, 0.28), P.body, 4, 0.36, ink(P.bodySh2)));
  const sp = spline(tail, 4);
  out.push(fband(sp.map(([x, y]) => [x + 0.4, y + 0.9]), lockW(2, 1, 0.2, 0.2), P.bodySh, 1));
  // The flame on the tip of the tail, licking up a beat behind the tail.
  const tip = tail[tail.length - 1];
  const tf = Math.round(fp * 8) % 8;
  out.push(...flame(tip[0], tip[1] + 1, cast === 2 ? 9 : 7.4, 2.8, Math.sin(ph - 1.8) * 1.2, P.fire, tf));

  // Far legs (darker), then the body, then the near legs, paddling in diagonal pairs.
  const legs = [[-4.2, 0], [4, 0.5]];
  const paddle = (i, far) => {
    const p = ph + (i ? Math.PI : 0) + (far ? Math.PI : 0);
    const [lx] = legs[i];
    const r = within(at(body[0], body[1], bodyA), () => X(lx + (far ? 0.8 : 0), 2.6));
    const foot = cast === 1 ? [r[0] + (i ? 1.6 : -1.6), r[1] + 3] : cast >= 2 ? [r[0] - 1.2 - i * 0.6, r[1] + 3.6] : [r[0] + Math.cos(p) * 1.8, r[1] + 3.2 + Math.sin(p) * 1];
    const c = far ? P.bodySh : P.body;
    const k = joint(r, foot, 2.4, 2.4, i ? -1 : 1);
    const toe = [k.f[0] + 0.6, k.f[1] + 0.2];
    return [...oband([r, k.k, k.f], taperW(2.8, 2), c, 2, 0.32, ink(P.bodySh2)), ...ooval(toe[0], toe[1], 1.3, 0.8, far ? P.bodySh2 : P.bodySh, 0, 0.3)];
  };
  out.push(...paddle(0, true), ...paddle(1, true));

  within(at(body[0], body[1], bodyA), () => {
    const bx = 7.6 * puff;
    const by = 5.2 * puff;
    out.push(...opoly(ovalPts(0, 0, bx, by, 26), P.body, 0.36, ink(P.bodySh2)));
    // Form shadow on the far, lower side (light from the upper front), a lit back.
    out.push(fpoly([...arcPts(0, 0, bx, by, 100, 200, 8), ...arcPts(-1.2, -0.6, bx * 0.7, by * 0.55, 200, 100, 6)], P.bodySh));
    out.push(fpoly([...arcPts(0, 0, bx - 0.3, by - 0.3, 230, 320, 8), ...arcPts(0.6, -0.4, bx * 0.66, by * 0.6, 320, 230, 6)], P.bodyLt));
    // The venom-green belly.
    out.push(fpoly([...arcPts(0.4, 0.6, bx * 0.86, by * 0.78, 20, 160, 10), [-bx * 0.62, by * 0.24], [bx * 0.7, by * 0.16]], P.belly));
    out.push(fpoly([...arcPts(0.4, 0.6, bx * 0.86, by * 0.78, 90, 160, 6), [-bx * 0.62, by * 0.24], [-0.6, by * 0.5]], P.bellySh));
    out.push(fband(arcPts(1, 0.4, bx * 0.6, by * 0.38, 30, 120, 5), 0.5, P.bellyLt, 1));
    // Venom spots: few and small, an accent.
    for (const [x, y, r] of [[-3.4, -2, 1.1], [0.6, -3, 0.9], [3.6, -2.2, 0.75]]) out.push(foval(x * puff, y * puff, r * 1.1, r * 0.8, P.spotDk), foval(x * puff + 0.15, y * puff - 0.1, r * 0.75, r * 0.5, P.spot));
    // Little flames along the back, each a beat behind the one in front.
    [[-4.2, -4.2, 3.4], [-0.8, -5, 4.2], [2.6, -4.6, 3.6]].forEach(([x, y, h], i) => out.push(...flame(x * puff, y * puff + 0.6, cast === 2 ? h * 1.25 : h, 1.5, -0.8 + Math.sin(ph - 1 - i * 0.6) * 0.6, P.fire, tf + i * 3)));
  });

  // The head on its neck pivot: big and round, a broad smile, round glossy eyes.
  {
    const ha = cast === 1 ? -0.3 : cast >= 2 ? 0.1 : Math.sin(ph - 0.6) * 0.06;
    within(at(head[0], head[1], ha), () => {
      out.push(...oband([[-6.6, 3.4], [-2.4, 1.6]], 6, P.body, 1, 0.36, ink(P.bodySh2)));
      const hd = [[-4.4, -3.4], [-1, -5.4], [3, -5.2], [6.2, -3], [7.6, 0.2], [7.2, 2.6], [4.6, 3.8], [0, 4.2], [-3.6, 3.4], [-5.4, 0.4]];
      out.push(...opoly(spline([...hd, hd[0]], 3), P.body, 0.36, ink(P.bodySh2)));
      out.push(fpoly(spline([[-5.4, 0.4], [-3.6, 3.4], [0, 4.2], [4.6, 3.8], [7.2, 2.6], [4, 2.4], [0, 2.6], [-3, 1.6]], 2), P.bellySh));
      out.push(fpoly(spline([[-3.6, -3.4], [-0.8, -4.8], [3, -4.6], [5.4, -3], [2.4, -3], [-1, -2.8]], 2), P.bodyLt));
      // A little frill of horns at the back of the head, lit at the tips.
      [[-3.6, -1.6, 3.4, -2.7], [-2.6, -3.2, 3.6, -2.35], [-1, -4.4, 3, -2]].forEach(([x, y, len, a], i) => out.push(...oband([[x, y], [x + Math.cos(a) * len * 0.6, y + Math.sin(a) * len * 0.6 + Math.sin(ph - 1.4 - i * 0.5) * 0.3], [x + Math.cos(a) * len, y + Math.sin(a) * len]], taperW(1.7, 0.3), i === 1 ? P.body : P.bodySh, 2, 0.3, ink(P.bodySh2))));
      // Mood: a big round glossy eye (two catchlights) with a green iris against the orange.
      const eo = { shape: 'round', iris: P.eye, sclera: '#fffaf2', pupil: 'round', lashC: '#5a1a2a', lash: 1, rim: 0.3, irisW: 0.8, irisH: 0.85, look: [0.5, 0], shine: 1 };
      if (mood === 'blink') out.push(...place(creatureEye(3.2, -1, { ...eo, s: 1, w: 2.2, h: 2.4, closed: 'blink' })));
      else if (mood === 'angry') out.push(...place(creatureEye(3.2, -1, { ...eo, s: 1, w: 2.2, h: 2.4, slant: 0.5, lid: 0.25, pupilK: 0.7 })));
      else if (mood === 'happy') out.push(...place(creatureEye(3.2, -1, { ...eo, s: 1, w: 2.2, h: 2.4, closed: 'happy' })));
      else out.push(...place(creatureEye(3.2, -1, { ...eo, s: 1, w: 2.2, h: 2.6 })));
      out.push(...place(creatureBlush(4.4, 1.9, 1.3, { on: P.body, c: '#ff4f7a' })));
      if (cast === 1) out.push(...place(creatureMouth(6.4, 1.6, { type: 'smile', w: 1, ink: P.bodySh2, curve: -0.3 })));
      else if (cast === 2 || cast === 3) out.push(...place(creatureMouth(6.6, 1.8, { type: 'shout', w: 1.3, h: 2.2, open: 1, ink: P.bodySh2, teeth: 'none' })));
      else out.push(...place(creatureMouth(5.6, 2, { type: 'cat', w: 1.6, curve: 0.55, ink: P.bodySh2 })));
      // Venom spittle on the strike.
      if (cast === 2) out.push(...ooval(10, 2, 1.4, 1, P.belly, 0, 0.3), dot(9.6, 1.6, 0.4, P.bellyLt));
    });
  }
  out.push(...paddle(0, false), ...paddle(1, false));
  return { w: 40, h: 34, res: 3, shapes: out };
}

const ART = { angel, sprite: frostSprite, salamander };
// Frames per flying cycle and the cycle's length (s): wings beat on their own rhythm.
const CYCLE = { angel: [8, 0.9], sprite: [8, 0.8], salamander: [8, 1] };
// When each summon blinks: every few seconds, at its own offset.
const BLINK = { angel: [3.4, 0.4], sprite: [2.9, 1.2], salamander: [3.8, 2] };

// Cast timing (s). The summon winds up while its next shot is due, strikes as it leaves, holds
// the blow, then settles back into its flight.
const WIND = 0.32;
const STRIKE = 0.07;
const HOLD = 0.2;
const SETTLE = 0.24;
const APPEAR = 0.5;
const DISMISS = 0.5;

// What the drawing remembers of each summon between frames: when it last fired, and whether its
// timer last reset after a real shot (a summon with no target only polls, and shouldn't wind up).
const memory = new WeakMap();
function castStage(state) {
  const sm = state?.summon;
  if (!sm) return 0;
  let m = memory.get(sm);
  if (!m) {
    m = { timer: sm.timer, fired: -1e9, armed: true };
    memory.set(sm, m);
  }
  if (sm.timer > m.timer + 0.05) {
    m.armed = sm.timer > 0.3;
    if (m.armed) m.fired = state.now;
  }
  m.timer = sm.timer;
  const since = state.now - m.fired;
  if (since < STRIKE) return 2;
  if (since < STRIKE + HOLD) return 3;
  if (since < STRIKE + HOLD + SETTLE) return 4;
  if (m.armed && sm.timer < WIND) return 1;
  return 0;
}

// (x, y) is the summon's center in screen space.
export function drawSummon(ctx, art, x, y, time, facing, state = null) {
  const [n, len] = CYCLE[art];
  const frame = Math.floor(((time / len) % 1) * n);
  const [every, off] = BLINK[art];
  const cast = castStage(state);
  const blink = !cast && (time + off) % every < 0.14;
  const age = state ? state.now - state.since : 9;
  const left = state ? state.until - state.now : 9;
  const mood = cast === 1 || cast === 2 || cast === 3 ? 'angry' : age < APPEAR + 0.4 ? 'happy' : blink ? 'blink' : 'idle';
  const s = sprite(`summon|${art}|${frame}|${cast}|${mood}`, () => ({ soft: 'cel', crisp: true, selout: true, thin: true, ...ART[art](frame / n, cast, mood) }));

  // Appearing: a flash of light, then the summon pops out of it with an overshoot and settles.
  // Dismissed: it rises, shrinks into its glow and fades.
  let k = 1;
  let alpha = 1;
  let flash = 0;
  let dy = 0;
  if (age < APPEAR) {
    const u = clamp(age / APPEAR, 0, 1);
    k = u < 0.55 ? lerp(0.2, 1.22, smooth(u / 0.55)) : lerp(1.22, 1, smooth((u - 0.55) / 0.45));
    flash = u < 0.6 ? (1 - u / 0.6) * 0.14 : 0;
  } else if (left < DISMISS) {
    const u = clamp(1 - left / DISMISS, 0, 1);
    k = u < 0.25 ? lerp(1, 1.1, u / 0.25) : lerp(1.1, 0.3, smooth((u - 0.25) / 0.75));
    alpha = 1 - smooth(clamp((u - 0.35) / 0.65, 0, 1));
    flash = u * 0.12;
    dy = -u * 6;
  }

  ctx.save();
  // Effects light: the soft glow it sheds, brighter as it strikes and as it arrives.
  const gk = (cast === 2 || cast === 3 ? 1.35 : 1) * (age < APPEAR ? 1.5 - age / APPEAR * 0.5 : 1) * alpha;
  const r = 26 * Math.max(k, 0.6);
  const glow = ctx.createRadialGradient(x, y + dy, 2, x, y + dy, r);
  glow.addColorStop(0, GLOWS[art]);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = Math.min(1, gk);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y + dy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  blit(ctx, s, x - (s.w / 2) * k, y + dy - (s.h / 2) * k, { flip: facing < 0, scale: k, alpha, flash });
  // Sparkles burst out as it arrives and as it leaves.
  const burst = age < APPEAR ? age / APPEAR : left < DISMISS ? 1 - left / DISMISS : -1;
  if (burst >= 0) sparkles(ctx, x, y + dy, burst, art);
}

const SPARK = { angel: '#fff3a6', sprite: '#d8f8ff', salamander: '#ffc94a' };
function sparkles(ctx, x, y, u, art) {
  ctx.save();
  ctx.fillStyle = SPARK[art];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const d = 6 + u * 18;
    const r = (1 - u) * (i % 2 ? 2.4 : 3.4);
    if (r <= 0.2) continue;
    const px = x + Math.cos(a) * d;
    const py = y + Math.sin(a) * d * 0.8;
    ctx.globalAlpha = 1 - u * 0.7;
    ctx.beginPath();
    ctx.moveTo(px, py - r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.quadraticCurveTo(px, py, px, py + r);
    ctx.quadraticCurveTo(px, py, px - r, py);
    ctx.quadraticCurveTo(px, py, px, py - r);
    ctx.fill();
  }
  ctx.restore();
}
