// Monster art: sky. The Sky Garden's heavenly creatures:
//   cloudsheep  Pegasus Foal: a cream foal with a cotton-candy mane, cloud-puff fetlocks, and
//               feathered wings that beat as it trots.
//   windbird    Harpy: a bird-girl with feathered wing-arms, a plume crest, and dangling talons.
//   starspirit  Star Seraph: a turning star core with a serene face, three pairs of wings, a
//               halo, and star sparks circling it.
// Everything is built from feathers and puffs that carry their own thin inner line, so layered
// parts stay readable inside the automatic silhouette outline.

import { E, T, F, C, shade, mix, stroke, INK, BLUSH, MOUTH } from './kit.js';

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const dirOf = (a) => [Math.cos(rad(a)), Math.sin(rad(a))];
// The inner line drawn around a part where it overlaps another.
const lineOf = (c) => mix(shade(c, -36), INK, 0.38);
const lerp = (a, b, t) => a + (b - a) * t;
const shift = (shapes, dx, dy) => shapes.map((s) => s && { ...s, x: s.x + dx, y: s.y + dy });

// ---------- Building blocks ----------

// A feather: a long leaf with a rounded tip, its own thin line, an optional colored tip, a
// darker back vane, and a shaft.
function featherPts(bx, by, ang, len, wid) {
  const [dx, dy] = dirOf(ang);
  const p = (t, s) => [bx + dx * len * t - dy * wid * s, by + dy * len * t + dx * wid * s];
  return { p, body: [p(0, 0.3), p(0.45, 0.5), p(0.8, 0.42), p(0.97, 0.16), p(1, 0), p(0.97, -0.16), p(0.8, -0.42), p(0.45, -0.5), p(0, -0.3)] };
}

function feather(bx, by, ang, len, wid, col, { tip, vane, shaft = len > 6, cast = false, line = lineOf(col), tipAt = 0.62 } = {}) {
  const [dx, dy] = dirOf(ang);
  const out = [F(T(featherPts(bx - dx * 0.35, by - dy * 0.35, ang, len + 0.8, wid + 0.95).body, line))];
  const { p, body } = featherPts(bx, by, ang, len, wid);
  const main = T(body, col);
  out.push(cast ? C(main) : main);
  if (vane) out.push(F(T([p(0.12, 0), p(0.45, -0.46), p(0.8, -0.38), p(0.96, 0)], vane)));
  if (tip) out.push(F(T([p(tipAt, 0.47), p(0.8, 0.42), p(0.97, 0.16), p(1, 0), p(0.97, -0.16), p(0.8, -0.42), p(tipAt, -0.47)], tip)));
  if (shaft) out.push(...stroke([p(0.06, 0), p(0.8, 0)], 0.28, mix(col, line, 0.4)));
  return out;
}

// Fluffy puffs ([x, y, r]) with their own scalloped lines and a soft shine on each.
function puffs(list, col, { line = lineOf(col), hi = mix(col, '#ffffff', 0.6), sq = 0.88 } = {}) {
  const out = [];
  list.forEach(([x, y, r, c = col]) => {
    out.push(F(E(x, y, r + 0.45, r * sq + 0.45, c === col ? line : lineOf(c))), E(x, y, r, r * sq, c));
    if (hi && r > 1.4) out.push(F(E(x - r * 0.28, y - r * 0.38, r * 0.42, r * 0.26, c === col ? hi : mix(c, '#ffffff', 0.6))));
  });
  return out;
}

// A side-view wing from the shoulder (x, y): an arm toward `ang` (degrees, screen space), primaries
// fanning backward from the wrist by `ps` degrees each, secondaries along the arm, a row of coverts,
// and the leading edge. Scaled by k.
function wing({ x, y, ang, ps, k = 1, col, tip, tipAt = 0.62, cov, vane, bone = col, hand, n = 5, sec = 4, arm = 6.5, plen = 11, pw = 3.3, slen = 8, sw = 3 }) {
  const [dx, dy] = dirOf(ang);
  const wx = x + dx * arm * k;
  const wy = y + dy * arm * k;
  const out = [];
  // Inner lines stay soft; the silhouette gets the strong outline anyway.
  const line = mix(col, lineOf(col), 0.72);
  for (let i = 0; i < n; i++) {
    const a = ang + 4 - i * ps;
    const back = i * 0.55 * k;
    out.push(...feather(wx - dx * back, wy - dy * back, a, plen * k * (1 - i * 0.07), pw * k, col, { tip, tipAt, vane, shaft: false, line }));
  }
  const sa = ang + 4 - n * ps;
  for (let j = 0; j < sec; j++) {
    const t = 1 - (j + 0.7) / (sec + 0.3);
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), sa - 6 - j * 7, slen * k * (1 - j * 0.06), sw * k, col, { tip, tipAt, vane, shaft: false, line }));
  }
  // Coverts: one smooth band of three broad feathers over the feather roots.
  const cl = mix(cov, lineOf(cov), 0.8);
  const [nx, ny] = dirOf(sa + 20);
  out.push(...stroke([[x + nx * 1.2 * k, y + ny * 1.2 * k], [wx + nx * 1.2 * k, wy + ny * 1.2 * k]], 3.4 * k, cov, false));
  for (let j = 0; j < 3; j++) {
    const t = 0.9 - j * 0.36;
    out.push(...feather(lerp(x, wx, t), lerp(y, wy, t), sa + 16 - j * 8, slen * 0.6 * k, sw * 1.2 * k, cov, { shaft: false, line: cl }));
  }
  out.push(...stroke([[x, y], [wx, wy]], 2.4 * k, bone, false), E(wx, wy, 1.4 * k, 1.4 * k, bone), E(x, y, 1.9 * k, 1.9 * k, bone), F(E(lerp(x, wx, 0.45) - ny * 0.4, lerp(y, wy, 0.45) + nx * 0.4, 1.6 * k, 0.6 * k, mix(bone, '#ffffff', 0.55))));
  if (hand) out.push(...hand(wx, wy));
  return out;
}

// A four-pointed sparkle.
function sparkle(x, y, r, c, core = '#ffffff') {
  const q = r * 0.3;
  return [F(T([[x, y - r], [x + q, y - q], [x + r, y], [x + q, y + q], [x, y + r], [x - q, y + q], [x - r, y], [x - q, y - q]], c)), F(E(x, y, q * 0.9, q * 0.9, core))];
}

// A tilted ring (halo).
function ring(cx, cy, rx, ry, th, rot, c) {
  const pts = (a, b) => Array.from({ length: 25 }, (_, i) => {
    const t = (i / 24) * TAU;
    const px = Math.cos(t) * a;
    const py = Math.sin(t) * b;
    const r = rad(rot);
    return [cx + px * Math.cos(r) - py * Math.sin(r), cy + px * Math.sin(r) + py * Math.cos(r)];
  });
  return T([...pts(rx, ry), ...pts(rx - th, Math.max(0.4, ry - th * 0.7)).reverse()], c);
}

function mouth(x, y, k, mood, ink = INK) {
  switch (mood) {
    case 'angry':
      return [F(T([[x - 1 * k, y - 0.1 * k], [x + 1 * k, y - 0.35 * k], [x + 0.7 * k, y + 0.75 * k], [x - 0.6 * k, y + 0.7 * k]], MOUTH)), F(T([[x + 0.15 * k, y - 0.2 * k], [x + 0.8 * k, y - 0.3 * k], [x + 0.5 * k, y + 0.45 * k]], '#ffffff'))];
    case 'hurt':
      return [F(E(x, y + 0.3 * k, 0.5 * k, 0.65 * k, MOUTH))];
    case 'dead':
      return stroke([[x - 0.9 * k, y + 0.3 * k], [x - 0.3 * k, y], [x + 0.3 * k, y + 0.3 * k], [x + 0.9 * k, y]], 0.35 * k, ink);
    case 'happy':
      return [F(T([[x - 1 * k, y - 0.1 * k], [x + 1 * k, y - 0.1 * k], [x + 0.45 * k, y + 0.85 * k], [x - 0.45 * k, y + 0.85 * k]], MOUTH)), F(E(x, y + 0.6 * k, 0.4 * k, 0.22 * k, '#ff94ae'))];
    default:
      return stroke([[x - 0.8 * k, y], [x - 0.4 * k, y + 0.42 * k], [x, y + 0.1 * k], [x + 0.4 * k, y + 0.42 * k], [x + 0.8 * k, y]], 0.3 * k, ink);
  }
}

// Move and turn whole groups: f maps a point; ellipse radii scale by k.
function xf(shapes, f, k = 1) {
  return shapes.map((s) => {
    if (!s) return s;
    if (s.t === 'p') return { ...s, x: 0, y: 0, pts: s.pts.map(([px, py]) => f(s.x + px, s.y + py)) };
    if (s.t === 'e') {
      const [x, y] = f(s.x, s.y);
      return { ...s, x, y, rx: s.rx * k, ry: s.ry * k };
    }
    const pts = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]].map(([a, b]) => f(a, b));
    return { t: 'p', x: 0, y: 0, pts, c: s.c, f: s.f, cast: s.cast, lit: s.lit };
  });
}
const turnPt = (x, y, cx, cy, a) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
const turn = (shapes, cx, cy, a) => (a ? xf(shapes, (x, y) => turnPt(x, y, cx, cy, a)) : shapes);

// An impact star of n spikes.
function burst(x, y, r, c, core, n = 8, a0 = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = a0 + (i / (n * 2)) * TAU;
    const rr = i % 2 ? r * 0.4 : r * (i % 4 ? 0.72 : 1);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return [F(T(pts, c)), F(E(x, y, r * 0.3, r * 0.3, core))];
}
const streaks = (lines, c, th = 0.6) => lines.flatMap(([x0, y0, x1, y1]) => stroke([[x0, y0], [x1, y1]], th, c));

// ---------- Eyes ----------
// Each species gets its own: the foal's big gentle side-on horse eye with long lashes, the harpy's
// sharp raptor eyes under a stern brow, and the seraph's serene closed eyes that open on star pupils.

function horseEye(x, y, s, mood, { look = 0, lid = '#ffffff' } = {}) {
  const out = [];
  const lashes = (dy = 0, down = false) => [
    ...stroke([[x - 0.7 * s, y - 0.9 * s + dy], [x - 1.45 * s, y - 1.75 * s + dy + (down ? 1.6 * s : 0)]], 0.32 * s, INK),
    ...stroke([[x - 0.2 * s, y - 1.2 * s + dy], [x - 0.55 * s, y - 2.15 * s + dy + (down ? 2 * s : 0)]], 0.3 * s, INK),
    ...stroke([[x - 1.05 * s, y - 0.4 * s + dy], [x - 1.9 * s, y - 0.95 * s + dy + (down ? 1.2 * s : 0)]], 0.3 * s, INK),
  ];
  switch (mood) {
    case 'blink':
      return [...stroke([[x - 1.1 * s, y - 0.1 * s], [x - 0.4 * s, y + 0.5 * s], [x + 0.6 * s, y + 0.5 * s], [x + 1.1 * s, y]], 0.42 * s, INK), ...lashes(0.9 * s, true)];
    case 'happy':
      return [...stroke([[x - 1.15 * s, y + 0.5 * s], [x - 0.6 * s, y - 0.3 * s], [x + 0.2 * s, y - 0.55 * s], [x + 1 * s, y + 0.2 * s]], 0.46 * s, INK), ...lashes(0.6 * s)];
    case 'hurt':
      return [...stroke([[x - 1 * s, y - 1 * s], [x + 0.8 * s, y], [x - 1 * s, y + 1 * s]], 0.46 * s, INK), ...lashes(0.5 * s)];
    case 'dead':
      return [...stroke([[x - 0.8 * s, y - 0.8 * s], [x + 0.8 * s, y + 0.8 * s]], 0.42 * s, INK), ...stroke([[x - 0.8 * s, y + 0.8 * s], [x + 0.8 * s, y - 0.8 * s]], 0.42 * s, INK)];
  }
  const lx = look * 0.22 * s;
  out.push(F(E(x, y, 1.12 * s, 1.38 * s, INK)), F(E(x + lx, y + 0.12 * s, 0.9 * s, 1.15 * s, '#5b3fa8')), F(E(x + lx, y + 0.62 * s, 0.68 * s, 0.5 * s, '#a38cf4')),
    F(E(x + lx, y + 0.05 * s, 0.5 * s, 0.68 * s, '#2c1d58')), F(E(x - 0.32 * s + lx, y - 0.45 * s, 0.46 * s, 0.52 * s, '#ffffff')), F(E(x + 0.4 * s + lx, y + 0.55 * s, 0.18 * s, 0.18 * s, '#ffffff')));
  if (mood === 'angry') {
    out.push(F(T([[x - 1.6 * s, y - 2 * s], [x + 1.5 * s, y - 2 * s], [x + 1.5 * s, y - 0.1 * s], [x - 1.6 * s, y - 1.1 * s]], lid)),
      ...stroke([[x - 1.3 * s, y - 1.05 * s], [x + 1.2 * s, y - 0.2 * s]], 0.4 * s, INK), ...stroke([[x - 1.5 * s, y - 2.1 * s], [x + 1.1 * s, y - 1.2 * s]], 0.45 * s, INK));
  } else {
    out.push(...lashes());
  }
  return out;
}

function raptorEye(x, y, s, mood, { inner = 1, lid = '#ffffff', look = 0, brow = INK } = {}) {
  const o = -inner;
  const P = (px, py) => [x + o * px * s, y + py * s];
  switch (mood) {
    case 'blink':
      return [...stroke([P(-1.3, 0.3), P(0, 0.55), P(1.2, 0.1)], 0.42 * s, INK), ...stroke([P(-1.4, -0.9), P(0, -1.2), P(1.3, -1)], 0.5 * s, brow)];
    case 'happy':
      return [...stroke([P(-1.2, 0.4), P(-0.4, -0.3), P(0.5, -0.45), P(1.2, 0.2)], 0.46 * s, INK)];
    case 'hurt':
      return stroke([[x + o * 0.85 * s, y - 0.95 * s], [x + inner * 0.75 * s, y], [x + o * 0.85 * s, y + 0.95 * s]], 0.46 * s, INK);
    case 'dead':
      return [...stroke([[x - 0.8 * s, y - 0.8 * s], [x + 0.8 * s, y + 0.8 * s]], 0.42 * s, INK), ...stroke([[x - 0.8 * s, y + 0.8 * s], [x + 0.8 * s, y - 0.8 * s]], 0.42 * s, INK)];
  }
  // A keen almond: the tear duct dips toward the beak-line, the outer end sweeps up.
  const shape = [P(-1.35, 0.4), P(-0.6, -0.55), P(0.4, -0.85), P(1.2, -0.55), P(1.15, 0.3), P(0.3, 0.85), P(-0.6, 0.75)];
  const lx = look * 0.2 * s;
  const out = [F(T(shape.map(([px, py]) => [x + (px - x) * 1.22, y + (py - y) * 1.22]), INK)), F(T(shape, '#fff8ea'))];
  out.push(F(E(x + lx, y + 0.05 * s, 0.86 * s, 0.86 * s, '#ffc23a')), F(E(x + lx, y + 0.35 * s, 0.55 * s, 0.35 * s, '#ffe08a')), F(E(x + lx, y, mood === 'angry' ? 0.3 * s : 0.4 * s, mood === 'angry' ? 0.3 * s : 0.4 * s, '#21152e')), F(E(x + lx - 0.3 * s, y - 0.32 * s, 0.24 * s, 0.24 * s, '#ffffff')));
  if (mood === 'angry') {
    out.push(F(T([P(-1.6, -2), P(1.5, -2), P(1.5, -0.95), P(-1.6, 0.05)], lid)), ...stroke([P(-1.5, 0.05), P(1.4, -0.95)], 0.42 * s, INK), ...stroke([P(-1.6, -0.4), P(1.5, -1.7)], 0.6 * s, brow));
  } else {
    out.push(...stroke([P(-1.35, 0.4), P(-0.6, -0.55), P(0.4, -0.85), P(1.2, -0.55)], 0.36 * s, INK), ...stroke([P(-1.45, -1.05), P(0, -1.6), P(1.45, -1.45)], 0.45 * s, brow));
  }
  return out;
}

function seraphEye(x, y, s, mood, { inner = 1, lid = '#ffffff', open = false } = {}) {
  const o = -inner;
  const glow = '#fff3b0';
  switch (mood) {
    case 'happy':
      return stroke([[x - 1.05 * s, y + 0.5 * s], [x - 0.6 * s, y - 0.25 * s], [x, y - 0.55 * s], [x + 0.6 * s, y - 0.25 * s], [x + 1.05 * s, y + 0.5 * s]], 0.42 * s, INK);
    case 'hurt':
      return stroke([[x + o * 0.85 * s, y - 0.95 * s], [x + inner * 0.75 * s, y], [x + o * 0.85 * s, y + 0.95 * s]], 0.44 * s, INK);
    case 'dead':
      return [...stroke([[x - 0.8 * s, y - 0.8 * s], [x + 0.8 * s, y + 0.8 * s]], 0.4 * s, INK), ...stroke([[x - 0.8 * s, y + 0.8 * s], [x + 0.8 * s, y - 0.8 * s]], 0.4 * s, INK)];
  }
  if (mood === 'angry' || open) {
    // Eyes opened wide on glowing star pupils.
    const st = 0.85 * s;
    const out = [F(E(x, y, 1.05 * s, 1.3 * s, INK)), F(E(x, y + 0.15 * s, 0.82 * s, 1.02 * s, '#9a6cf0')), F(E(x, y + 0.6 * s, 0.55 * s, 0.32 * s, '#d4b8ff')),
      F(T([[x, y - st], [x + st * 0.3, y - st * 0.3], [x + st, y], [x + st * 0.3, y + st * 0.3], [x, y + st], [x - st * 0.3, y + st * 0.3], [x - st, y], [x - st * 0.3, y - st * 0.3]], glow)), F(E(x, y, 0.22 * s, 0.22 * s, '#ffffff'))];
    if (mood === 'angry') out.push(F(T([[x + o * 1.25 * s, y - 1.9 * s], [x + inner * 1.25 * s, y - 1.9 * s], [x + inner * 1.25 * s, y - 0.2 * s], [x + o * 1.25 * s, y - 1.05 * s]], lid)), ...stroke([[x + o * 1.1 * s, y - 1 * s], [x + inner * 1.1 * s, y - 0.25 * s]], 0.38 * s, INK));
    return out;
  }
  // Serene closed eyes: soft downturned lids with long lashes and a faint glow beneath.
  const dip = mood === 'blink' ? 0.3 : 0.6;
  return [F(E(x, y + 0.5 * s, 1.15 * s, 0.55 * s, glow)), ...stroke([[x - 1.1 * s, y - 0.1 * s], [x - 0.5 * s, y + dip * s], [x + 0.5 * s, y + dip * s], [x + 1.1 * s, y - 0.1 * s]], 0.42 * s, INK),
    ...stroke([[x + o * 1.05 * s, y - 0.05 * s], [x + o * 1.55 * s, y - 0.5 * s]], 0.3 * s, INK), ...stroke([[x - 0.2 * s, y + dip * s], [x - 0.35 * s, y + (dip + 0.5) * s]], 0.22 * s, INK), ...stroke([[x + 0.45 * s, y + dip * s], [x + 0.55 * s, y + (dip + 0.45) * s]], 0.22 * s, INK)];
}

// ---------- Pegasus Foal ----------
// It prances in a springy diagonal trot with high knees, a nodding head, and a flagging tail; it
// attacks by rearing up on its hind legs and stamping down with its forehooves.

const COAT = '#fff6ee';
const COAT_FAR = '#ece2f6';
const COAT_SH = '#efe4f8';
const MANE = ['#ffc4de', '#e2caff', '#c0e2ff'];
const CLOUD = '#ffffff';
const HOOF = '#ffd98a';

const PEG_ATK = [
  { rot: 0.05, dy: 1.4, wa: -152, ps: 8, fore: [0.8, 46], head: [-0.6, 1.6], tail: -0.6 },
  { rot: -0.3, dy: 1.6, wa: -98, ps: 15, fore: [3.4, 38], head: [-0.8, 3.4], tail: 1 },
  { rot: -0.08, dy: 0.4, wa: -116, ps: 13, fore: [7, 44.6], head: [0.8, 0.8], tail: 0.6 },
  { rot: -0.02, dy: 0.2, wa: -126, ps: 11, fore: [2.4, 46], head: [0.3, 0.4], tail: 0.2 },
];

function pegasus(pose, f, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? PEG_ATK[f] : null;
  const a = ak ? f * 1.2 : (f / (walk ? 8 : 6)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // A springy trot: two bounces per cycle, the head nodding a beat after each.
  const bob = ak ? ak.dy : walk ? 0.75 * Math.cos(2 * a) : 0;
  const breathe = walk || ak ? 0 : Math.sin(a) * 0.35;
  let hx = ak ? ak.head[0] : walk ? 0.3 * Math.sin(2 * a - 0.6) : Math.sin(a) * 0.25;
  let hy = bob + (ak ? ak.head[1] - ak.dy : walk ? 0.7 * Math.cos(2 * a - 0.9) : Math.sin(a + 0.6) * 0.3);
  if (hurt) {
    hx -= 1.2;
    hy -= 0.8;
  }
  if (dead) {
    hx -= 0.4;
    hy += 2.4;
  }
  const look = walk ? 0.4 : ak ? 0.6 : Math.sin(a) * 0.9;
  const out = [];
  const B = (shapes) => shift(shapes, 0, bob);
  const H = (shapes) => shift(shapes, hx, hy);
  const piv = [18, 46];
  // Turned about the hind hooves, nudged forward so the rear stays in frame.
  const R = (shapes) => (ak ? shift(turn(shapes, piv[0], piv[1], ak.rot), -ak.rot * 16, 0) : shapes);

  // Wing pose: raised and half spread, beating with the trot.
  let wa = ak ? ak.wa : walk ? -128 + 12 * Math.sin(a) : -133 + 3 * Math.sin(a) + (f === 3 ? -4 : 0);
  let ps = ak ? ak.ps : walk ? 10.5 + 2.5 * Math.cos(a) : 9.5 + Math.sin(a) * 0.8;
  if (angry && !ak) [wa, ps] = [wa + 14, ps + 2.5];
  if (happy) wa += 8;
  if (hurt) [wa, ps] = [-104, 15];
  if (dead) [wa, ps] = [-176, 6];
  const wingCol = { col: '#fbfaff', tip: '#a9d3ff', cov: '#ffffff', vane: '#e8eefb', k: 1.2, arm: 7 };
  out.push(...R(B(wing({ x: 29.5, y: 21.5, ang: wa + 9 + (walk ? 4 * Math.sin(a - 0.5) : 0), ps, k: 1.08, arm: 7, col: '#e7e2f4', tip: '#b5d3f2', cov: '#efebf8', vane: '#dcd6ee' }))));

  // Tail: a cotton-candy plume carried high in the trot, swishing a beat behind.
  const tsw = walk ? 1.2 : ak ? 0.4 : 0.6;
  const lift = ak ? ak.tail : walk ? 0.7 : 0;
  const tail = [[10.5, 24.5, 2.8], [7.6, 26.2, 3.3], [5.4, 29.4, 3.4], [4.6, 33.2, 3.1], [5.4, 36.8, 2.6], [7.2, 39.4, 1.9]].map(([x, y, r], i) => {
    const sw = Math.sin((walk ? 2 : 1) * a - i * 0.75) * i * 0.38 * tsw + (dead ? i * 0.5 : 0);
    return [x + sw + 0.6 - lift * i * 0.35, y - (angry ? i * 0.5 : 0) - lift * i * 0.9, r, MANE[i % 3]];
  });
  out.push(...R(B(puffs(tail, MANE[0]))));

  // Legs: a diagonal trot with high, prancing forelegs (near fore with far hind, and so on).
  const ground = 46;
  const leg = (hipx, hipy, ph, fore, near, foot) => {
    const s = Math.sin(ph);
    const c = Math.cos(ph);
    const dx = walk ? s * 4 : 0;
    let up = walk ? Math.max(0, c) ** 1.2 * (fore ? 4.6 : 3.4) : 0;
    let fx = hipx + dx + (fore ? 0.6 : -0.4) + (dead ? (fore ? 1 : -1) : 0);
    let fy = ground - up;
    if (foot) {
      [fx, fy] = foot;
      up = Math.max(0, ground - fy);
    }
    const hy0 = foot ? hipy : hipy + bob;
    const coat = near ? COAT : COAT_FAR;
    const knee = fore ? [lerp(hipx, fx, 0.5) + up * 0.7 + 0.3, lerp(hy0, fy, 0.45) - up * 0.15] : [lerp(hipx, fx, 0.5) - 1.3 - up * 0.25, lerp(hy0, fy, 0.55)];
    const ank = [fx + (fore ? up * 0.12 : 0.2), fy - 4.3];
    const o = [...stroke([[hipx, hy0], knee], fore ? 3.6 : 3.9, coat, false), E(knee[0], knee[1], 1.6, 1.6, coat), ...stroke([knee, ank], 2.7, coat, false)];
    o.push(T([[fx - 1.7, fy - 2.3], [fx + 1.8, fy - 2.3], [fx + 2.2, fy], [fx - 2, fy]], near ? HOOF : shade(HOOF, -8)), F(T([[fx - 1.1, fy - 2], [fx + 0.1, fy - 2], [fx - 0.3, fy - 0.6], [fx - 1.4, fy - 0.6]], '#fff1c8')));
    o.push(...puffs([[fx - 1.5, fy - 3.2, 1.9], [fx + 1.6, fy - 3.3, 1.8], [fx, fy - 4.6, 2.1]], near ? CLOUD : '#e8eefc', { line: near ? '#a9b8de' : '#9aa6cf' }));
    return o;
  };
  // In the attack the hind legs stay planted under the turned body; the forelegs kick and stamp.
  const hind = (hipx, hipy, ph, near) => {
    if (!ak) return leg(hipx, hipy, ph, false, near);
    const [x0, y] = turnPt(hipx, hipy + bob, piv[0], piv[1], ak.rot);
    const x = x0 - ak.rot * 16;
    return leg(x, y, 0, false, near, [hipx - 1.2 + (near ? 0 : 1.4), ground]);
  };
  const foreLeg = (hipx, hipy, ph, near) => R(leg(hipx, hipy, ph, true, near, ak ? [hipx + ak.fore[0] + (near ? 0 : -1.2), ak.fore[1] - (near ? 0 : 0.8) - (f === 0 || f === 3 ? bob : 0)] : null));
  out.push(...foreLeg(34.5, 31, a + Math.PI, false), ...hind(19.5, 31.5, a, false));

  // Body: rump, barrel, chest, a soft lavender belly, and star dapples.
  out.push(...R(B([F(E(16.4, 28.4, 7.9, 7.6, lineOf(COAT))), E(16.4, 28.4, 7.4, 7.1 + breathe * 0.4, COAT), E(25, 29.6, 11.5, 7.2 + breathe, COAT), E(33.2, 28, 6.4, 7, COAT),
    F(E(25.5, 35.2, 8.6, 1.6, COAT_SH)), F(E(15.5, 33.6, 4.5, 1.3, COAT_SH)), F(E(23, 24.4, 7, 1.3, '#ffffff')), F(E(14.5, 23.6, 3.2, 1.1, '#ffffff')),
    ...sparkle(14.2, 28.4, 1.9, '#ffd6ea', '#fff2f8'), ...sparkle(18.4, 31.6, 1.3, '#d9cfff', '#f4f0ff'), ...sparkle(11.6, 31.8, 1, '#c8e4ff', '#f0f8ff')])));
  out.push(...foreLeg(30.8, 32, a, true), ...hind(16.5, 32.5, a + Math.PI, true));

  const front = [];
  // Neck, bridging the body and the head.
  front.push(T([[28.6, 22.5 + bob], [33 + hx, 11 + hy], [40 + hx, 12 + hy], [38.6, 27 + bob], [33, 30 + bob]], COAT), F(E(36 + hx * 0.5, 22 + (bob + hy) / 2, 2.4, 4.6, COAT_SH)));
  // Mane down the neck crest, streaming back and rippling.
  const maneLine = [[36.2, 5.6, 3.7], [33.4, 8.2, 3.7], [31.2, 11.6, 3.5], [29.5, 15.2, 3.3], [28, 18.7, 3], [26.8, 21.8, 2.6]];
  const mane = maneLine.map(([x, y, r], i) => {
    const t = i / 5;
    const wv = walk ? -(0.5 + 0.7 * Math.sin(a * 2 - i * 0.9)) * (0.3 + t) : ak ? -[0, 1.2, 0.8, 0.3][f] * (0.3 + t) : -Math.sin(a - i * 0.8) * 0.4 * t;
    return [x + lerp(hx, 0, t) + wv - (angry ? 0.6 * (1 - t) : 0), y + lerp(hy, bob, t) - (angry ? 0.8 : 0), r, MANE[(5 - i) % 3]];
  }).reverse();
  front.push(...puffs(mane, MANE[0]));
  front.push(...B([...stroke([[30, 24.6 + (hy - bob) * 0.3], [34.2, 26.4], [38.6, 25.6]], 1.5, '#9fd4ff'), ...stroke([[30.2, 24.1 + (hy - bob) * 0.3], [34.2, 25.9], [38.4, 25.1]], 0.4, '#d6efff')]),
    ...shift(sparkle(35.2, 28.2, 1.9, '#ffd66b', '#fff4c0'), walk ? Math.sin(2 * a - 1.4) * 0.4 : 0, bob + (walk ? Math.abs(Math.cos(a - 0.7)) * 0.4 : 0)));
  // Near wing, in front of the body.
  front.push(...B(wing({ x: 27.5, y: 23, ang: wa, ps, ...wingCol })));

  // Head: ears flick and pin back with mood.
  let earTip = [33.2, 1.4];
  if (angry || ak) earTip = [30.2, 4.6];
  if (happy) earTip = [33.8, 0.8];
  if (dead) earTip = [29.6, 8.4];
  if (hurt) earTip = [31, 3];
  if (!walk && !ak && f === 3 && !angry && !dead && !hurt) earTip = [31.6, 2.6];
  const farTip = [earTip[0] + 10.6 + (angry || dead || ak ? -1.5 : 0), earTip[1] - 0.3];
  const head = [T([[40.5, 7.5], farTip, [44.6, 8.6]], COAT_FAR), F(T([[41.4, 7.6], [farTip[0] - 0.1, farTip[1] + 2], [43.6, 8.2]], '#f4c6d8'))];
  head.push(F(E(40, 14, 8.65, 8.05, lineOf(COAT))), E(40, 14, 8.2, 7.6, COAT), E(41.2, 17.6, 7, 5.4, COAT), F(E(46.2, 20.1, 5.85, 4.65, lineOf(COAT))), E(46.2, 20.1, 5.4, 4.2, COAT),
    F(E(47.4, 21.1, 3.7, 2.8, '#ffe2ec')), F(E(49.7, 19.8, 0.75 + (angry || ak ? 0.25 : 0), 0.55, '#e295b1')), F(E(37.4, 9.6, 3.6, 1.3, '#ffffff')), F(E(45, 17.4, 2, 0.8, '#ffffff')));
  head.push(T([[34.2, 9.2], earTip, [38.8, 6.6]], COAT), F(T([[35.1, 8.2], [earTip[0] + 0.7, earTip[1] + 2], [37.6, 6.9]], '#ffcade')));
  // Forelock, a curl, and a gold star clip.
  head.push(...puffs([[37.6, 6.6, 3.2, MANE[1]], [41, 5.8, 3, MANE[0]], [44, 7.6, 2.4, MANE[2]]], MANE[0]),
    ...feather(41.6, 7.4, 78 + (walk ? Math.sin(2 * a - 1) * 10 : Math.sin(a) * 4), 5.4, 2.6, MANE[0], { shaft: false, cast: true }),
    ...sparkle(36.4, 5.4, 1.7, '#ffd66b', '#fff4c0'));
  // One big gentle eye on the side of the head.
  head.push(...horseEye(42.2, 13.8, 2.15, ak && mood === 'idle' ? 'angry' : mood, { look, lid: COAT }));
  if (!dead) head.push(F(E(40.6, 18.4, 1.8, 0.8, BLUSH)));
  head.push(...mouth(47.6, 22.6, 1.05, ak && f === 1 && !dead ? 'angry' : mood));
  if (angry || (ak && f > 0)) head.push(...puffs([[52.2, 20.8, 0.9], [53.1, 22.4, 0.7]], '#ffffff', { hi: null }));
  front.push(...H(head));
  out.push(...R(front));
  if (ak && f === 2 && !dead) {
    const [bx, by] = turnPt(30.8 + ak.fore[0] - ak.rot * 16, ak.fore[1], piv[0], piv[1], ak.rot);
    out.push(...burst(bx + 2.4, Math.min(by, 44), 3.4, '#fff3b0', '#ffffff', 7, 0.2), ...puffs([[bx - 3, 45, 1.6], [bx + 5.6, 45, 1.4]], '#ffffff', { hi: null }));
  }
  if (ak && f === 1 && !dead) out.push(...streaks([[48, 30, 51.6, 27.6], [47.4, 34, 51.4, 33]], '#e0ecff', 0.6));
  return { w: 54, h: 46, res: 3, shapes: out };
}

// ---------- Harpy ----------
// Strong, deep wingbeats: the body surges up on each downstroke and sags on the recovery, the
// crest, hair, and tail streaming a beat behind. It attacks by rising, then diving talons-first.

const PLUME = '#8fd0ff';
const PLUME_D = '#6cb8f2';
const PLUME_L = '#c4e9ff';
const SKIN = '#ffe8da';
const LEGC = '#ffc887';
const CLAW = '#6a5a86';
const CREST = ['#ff9ec0', '#ffd66b', '#ffb3d1'];

const HARPY_ATK = [
  { ang: -96, ps: 15, bob: -0.6, rot: -0.14, dx: -1.6, feet: [-1.2, -3.6], spread: 0.7 },
  { ang: 166, ps: 6, bob: -0.6, rot: 0.32, dx: 1.6, feet: [5.4, -2.6], spread: 1.6 },
  { ang: 178, ps: 7, bob: -0.2, rot: 0.24, dx: 2.4, feet: [6.4, -1.6], spread: 1.7 },
  { ang: -124, ps: 13, bob: 0.4, rot: 0.06, dx: 0.8, feet: [1.6, -0.6], spread: 1.1 },
];

function harpy(pose, f, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? HARPY_ATK[f] : null;
  const a = ak ? f * 1.3 : (f / (walk ? 8 : 6)) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // A full stroke: wings sweep from high (-108) down past the body (-204) and back.
  let ang = ak ? ak.ang : walk ? -156 + 48 * Math.cos(a) - 6 * Math.sin(2 * a) : -130 + 12 * Math.cos(a);
  let ps = ak ? ak.ps : walk ? 11.3 + 3.7 * Math.cos(a - 1.6) : 10.8 + 0.5 * Math.cos(a - 1.4);
  let bob = ak ? ak.bob : walk ? 0.7 - 0.9 * Math.cos(a - 0.5) : 0.4 - 0.4 * Math.cos(a - 0.5);
  if (angry && !ak) [ang, ps] = [ang + 8, ps + 2];
  if (hurt) [ang, ps] = [-100, 16];
  if (dead) [ang, ps, bob] = [128, 6, 0.6];
  // The head lags the body a little.
  let hx = 0;
  let hy = (ak ? bob : walk ? 0.7 - 0.9 * Math.cos(a - 1.2) : 0.4 - 0.4 * Math.cos(a - 1.1)) - bob + bob * 0.7 + (walk ? 0.25 : 0);
  if (hurt) [hx, hy] = [-1.3, hy - 0.6];
  if (dead) [hx, hy] = [0.4, hy + 1.6];
  const lagA = a - 1.1;
  const look = walk ? 0.5 : ak ? 0.7 : Math.sin(a) * 0.9;
  const B = (shapes) => shift(shapes, 0, bob);
  const Hd = (shapes) => shift(shapes, hx, hy);
  const out = [];

  // Tail fan, swinging a beat behind the strokes.
  const tsw = Math.sin(lagA) * (walk ? 7 : 3) + (dead ? 20 : 0) + (ak ? [10, -12, -10, -2][f] : 0);
  const tail = [];
  [[200, 8.6, PLUME_D], [186, 10.6, PLUME], [172, 11.2, PLUME_D], [160, 9.6, PLUME]].forEach(([d, len, c]) => tail.push(...feather(22.5, 30, d + tsw * (len / 11), len, 3.5, c, { tip: '#ffffff', vane: shade(c, -6) })));
  tail.push(...feather(22.5, 30.5, 180 + tsw, 7, 2.2, CREST[0], { tip: '#ffffff', shaft: false }));
  out.push(...B(tail));

  // Far wing, a touch behind the near one.
  const wingOpts = { n: 6, sec: 4, arm: 7, plen: 11.6, pw: 3.4, slen: 8.2, sw: 3.2 };
  out.push(...B(wing({ x: 30.6, y: 21.6, ang: ang + 9 + (walk ? 6 * Math.sin(a) : 0), ps, k: 1.12, col: '#dce8f6', tip: PLUME_D, tipAt: 0.72, cov: '#cfe0f4', bone: PLUME_D, vane: '#cfdcef', ...wingOpts })));

  // Legs and talons: dangling and swinging after the strokes, tucked or thrust out in the dive.
  const leg = (x, near) => {
    const sw = (walk ? -Math.cos(lagA) * 1.4 : Math.sin(a) * 0.4) + (dead ? -1.5 : 0);
    const kx = x + sw * 0.3;
    let fx = x + 0.8 + sw;
    let fy = 40.2 - (walk ? Math.max(0, Math.cos(lagA)) * 0.8 : 0);
    if (ak) [fx, fy] = [x + 0.8 + ak.feet[0] + (near ? 0.8 : 0), 40.2 + ak.feet[1]];
    const c = near ? LEGC : shade(LEGC, -10);
    const o = [...stroke([[kx, 33.5], [fx, fy]], 1.7, c, false)];
    for (const y of [36, 37.6]) {
      const u = (y - 33.5) / Math.max(1, fy - 33.5);
      if (u < 0.95) o.push(...stroke([[lerp(kx, fx, u) - 0.8, lerp(33.5, fy, u)], [lerp(kx, fx, u) + 0.8, lerp(33.5, fy, u) + 0.2]], 0.3, shade(c, -18)));
    }
    const spread = ak ? ak.spread : angry ? 1.4 : dead ? 0.5 : 1;
    const toes = [[-1.9 * spread, 1.4], [0.9, 2.1], [2.6 * spread, 1.2], [-0.6, -0.3]];
    for (const [tx, ty] of toes) {
      const ex = fx + tx;
      const ey = fy + ty;
      o.push(...stroke([[fx, fy], [ex, ey]], 1.1, c, false), T([[ex - 0.5, ey - 0.3], [ex + 0.5, ey - 0.3], [ex + 0.35 * Math.sign(tx || 1), ey + 1.1]], CLAW));
    }
    return o;
  };
  out.push(...B(leg(29.5, false)));

  // Back hair: feather locks trailing behind the head.
  const lag = walk ? Math.sin(a - 1.3) * 5 : ak ? [-6, 8, 6, 2][f] : Math.sin(a - 0.6) * 2;
  const back = [F(E(28.4, 14, 9, 8.4, lineOf(PLUME_D))), E(28.4, 14, 8.5, 7.9, PLUME_D)];
  [[22, 13.5, 158, 7.6], [21.6, 17, 130, 8.4], [23.6, 19.6, 108, 7.4], [26.4, 21, 96, 5.6]].forEach(([x, y, d, len], i) =>
    back.push(...feather(x, y, d + lag * (1 - i * 0.2) + (dead ? 12 : 0), len, 3.8, i % 2 ? PLUME : PLUME_D, { tip: i % 2 ? '#ffffff' : PLUME_L })));
  out.push(...Hd(back));

  // Body: plumed torso, a fluffy feather skirt, and a white ruff.
  const body = [F(E(27, 27, 6.1, 6.5, lineOf(PLUME))), E(27, 27, 5.6, 6, PLUME)];
  [[21.8, 29.6, 116], [24.2, 30.4, 104], [27, 30.8, 92], [29.8, 30.4, 80], [32.2, 29.4, 68]].forEach(([x, y, d], i) =>
    body.push(...feather(x, y, d + (walk ? Math.sin(lagA + i * 0.6) * 4 : Math.sin(a + i) * 1.5), 6.4 - Math.abs(i - 2) * 0.5, 3.6, i % 2 ? PLUME_D : PLUME, { tip: '#ffffff', shaft: false })));
  out.push(...B(body), ...B(leg(25.2, true)));
  out.push(...B([...puffs([[25.6, 24.2, 2.5], [28.4, 28.4, 2.6], [30.8, 25.8, 2.7], [28.6, 22.8, 3]], '#ffffff', { line: '#a8c4e6' }),
    ...stroke([[25.8, 21.6], [29, 24.2], [32, 21.8]], 0.45, '#ffd66b'), F(T([[29, 23.6], [30.2, 25.1], [29, 26.8], [27.8, 25.1]], '#ffd66b')), F(T([[29, 24.2], [29.7, 25.1], [29, 26.1], [28.3, 25.1]], '#ff8fb8'))]));

  // Near wing-arm, with a little hand at the wrist.
  const hand = (x, y) => [E(x + 0.4, y + 0.6, 1.3, 1.1, SKIN), ...stroke([[x + 0.6, y + 1.2], [x + 1.4, y + 2]], 0.7, SKIN, false), ...stroke([[x - 0.3, y + 1.3], [x - 0.2, y + 2.3]], 0.7, SKIN, false)];
  out.push(...B(wing({ x: 24.8, y: 23.2, ang, ps, col: '#f8fcff', tip: PLUME, tipAt: 0.72, cov: '#e6f4ff', bone: PLUME, vane: '#e4effa', hand, k: 1.25, ...wingOpts })));
  // Head.
  const head = [E(29.6, 20.6, 1.8, 2.2, SKIN), F(E(32.6, 16.2, 7.05, 6.65, lineOf(SKIN))), E(32.6, 16.2, 6.6, 6.2, SKIN), E(33.4, 18.4, 5.4, 3.6, SKIN)];
  // Crest plumes, streaming behind.
  const cr = angry || ak ? 14 : happy ? 8 : hurt ? -18 : dead ? -40 : 0;
  const csw = walk ? Math.sin(a - 1.6) * 9 : ak ? [8, -16, -12, -4][f] : Math.sin(a - 0.8) * 4;
  const crest = [];
  [[-160, 7, CREST[2]], [-130, 8.6, CREST[1]], [-104, 8, CREST[0]]].forEach(([d, len, c], i) =>
    crest.push(...feather(27.2 + i * 0.9, 8.4 - i * 0.2, d + cr + csw * (0.6 + i * 0.2), len, 2.7, c, { tip: '#ffffff', tipAt: 0.7 })));
  head.unshift(...crest);
  // Hair cap and feather bangs.
  head.push(F(E(29.8, 11, 8.6, 5.8, lineOf(PLUME))), E(29.8, 11, 8.1, 5.3, PLUME), E(24.8, 14.4, 3.8, 5, PLUME));
  [[25.2, 12, 98, 7.2, PLUME_D], [28.8, 8.4, 92, 5, PLUME], [31.8, 8, 76, 5.2, PLUME], [34.8, 8.6, 60, 4.8, PLUME], [37.4, 10.2, 48, 3.6, PLUME]].forEach(([x, y, d, len, c], i) =>
    head.push(...feather(x, y, d + (walk ? Math.sin(lagA - i * 0.3) * 3 : 0), len, 3.7, c, { cast: true, shaft: false, line: mix(c, lineOf(c), 0.7) })));
  head.push(...stroke([[25.6, 9.4], [28, 7.2], [31, 6.4], [34, 7]], 0.9, PLUME_L));
  head.push(...feather(24.6, 15, 130 + lag * 0.5, 5, 2.4, '#ffffff', { tip: CREST[0], shaft: false }), F(E(24.8, 14.4, 1.5, 1.5, '#ffd66b')), F(E(24.8, 14.4, 0.8, 0.8, '#5ec8e8')));
  // Sharp raptor eyes under a stern feathered brow.
  const em = ak && mood === 'idle' ? 'angry' : mood;
  head.push(...raptorEye(32.4, 16.9, 1.85, em, { inner: 1, lid: SKIN, look, brow: PLUME_D }), ...raptorEye(37.8, 16.5, 1.5, em, { inner: -1, lid: SKIN, look, brow: PLUME_D }));
  if (!dead) head.push(F(E(31, 20.2, 1.5, 0.7, BLUSH)), F(E(38, 19.8, 0.9, 0.55, BLUSH)));
  head.push(...mouth(35.4, 21, 0.95, ak && f > 0 && !dead ? 'angry' : mood));
  out.push(...Hd(head));

  let shapes = out;
  if (ak) {
    shapes = shift(turn(shapes, 28, 26, ak.rot), ak.dx, 0);
    if (!dead && f === 1) shapes.push(...streaks([[6, 12, 14, 17], [4, 20, 12, 23], [8, 27, 16, 29]], '#e0f0ff', 0.7));
    if (!dead && f === 2) for (const k of [-2.2, 0, 2.2]) shapes.push(...stroke([[39 + k * 0.3, 31 + k], [44 + k * 0.2, 36.4 + k], [45.4, 42 + k * 0.4]], 0.7, '#ff9ec0'), ...stroke([[39.4 + k * 0.3, 31.8 + k], [43.8 + k * 0.2, 36.8 + k]], 0.3, '#ffffff'));
  }
  return { w: 52, h: 44, res: 3, shapes };
}

// ---------- Star Seraph ----------
// A slow, majestic hover: three pairs of wings ripple in long sweeps, the core turning and the
// stardust tail streaming. It casts by gathering light into its core and releasing a star burst.

const GOLD = '#ffe27a';
const STAR = '#ffe88f';
const STAR_IN = '#fff6c8';
const WING_TIPS = ['#ffe9a8', '#e4d8ff', '#cdeaff'];

const SERAPH_ATK = [
  { beat: -20, fan: 0.8, pulse: 1.12, orbit: 0.45, dx: -1.2, dy: -0.8 },
  { beat: 18, fan: 1.25, pulse: 0.94, orbit: 1.1, dx: 1, dy: 0.4 },
  { beat: 12, fan: 1.2, pulse: 1, orbit: 1.15, dx: 0.6, dy: 0.3 },
  { beat: 2, fan: 1.05, pulse: 1, orbit: 1, dx: 0.2, dy: 0 },
];

function seraph(pose, f, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? SERAPH_ATK[f] : null;
  const n = walk ? 8 : ak ? 4 : 6;
  const a = (f / n) * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const cx = 25 + (ak ? ak.dx : 0);
  const cy = 26 + (ak ? ak.dy : walk ? Math.sin(a - 0.4) * 1.2 : Math.sin(a) * 0.5) + (dead ? 1.2 : 0);
  const fade = (c) => (dead ? mix(c, '#cfc6dc', 0.45) : angry || ak ? mix(c, '#ffb07a', 0.2) : c);
  const out = [];

  // Halo, behind everything, tilting a beat behind the hover.
  let hrot = walk ? Math.sin(a - 1) * 5 : Math.sin(a) * 2;
  let hdy = walk ? Math.sin(a - 1.2) * 0.5 : 0;
  if (hurt) hrot += 16;
  if (dead) [hrot, hdy] = [-24, 4];
  out.push(F(ring(cx + 0.6, cy - 18.6 + hdy, 9.3, 3.1, 2.4, hrot, lineOf(GOLD))), ring(cx + 0.6, cy - 18.6 + hdy, 8.6, 2.6, 1.7, hrot, fade(GOLD)));
  if (!dead) {
    const ha = rad(hrot) + (f / n) * TAU;
    out.push(...sparkle(cx + 0.6 + 7.6 * Math.cos(ha), cy - 18.6 + hdy + 2.2 * Math.sin(ha), 1.6, '#ffffff', '#ffffff'));
  }

  // Sparks circling the core; the far half passes behind the wings. They gather in to cast.
  const orbit = ak ? ak.orbit : 1;
  const sparks = [];
  for (let i = 0; i < 4; i++) {
    const t = rad(i * 90 + (f / n) * 90 + 20);
    const sx = cx + Math.cos(t) * 21.5 * orbit;
    const sy = cy + 2 + (Math.sin(t) * 5.5 - Math.cos(t) * 2) * orbit;
    const front = Math.sin(t) > 0;
    sparks.push({ front, s: sparkle(sx, sy, front ? 2.4 : 1.7, fade(front ? '#fff1a6' : '#e8dcff')) });
  }
  if (!dead) for (const s of sparks) if (!s.front) out.push(...s.s);

  // Three pairs of wings, the long sweep rippling from the top pair down.
  const pairs = [
    { dx: 4.4, dy: -4.8, base: -50, amp: 14, n: 5, len: 15, w: 3.9, fan: 9, tip: WING_TIPS[0] },
    { dx: 6.2, dy: 0.2, base: 2, amp: 11, n: 5, len: 16, w: 3.9, fan: 8, tip: WING_TIPS[1] },
    { dx: 4.6, dy: 4.8, base: 54, amp: 9, n: 4, len: 11.5, w: 3.6, fan: 9, tip: WING_TIPS[2] },
  ];
  const wings = [];
  pairs.forEach((p, i) => {
    let beat = ak ? ak.beat * (1 - i * 0.15) : Math.sin(a - i * 0.8) * (walk ? p.amp : p.amp * 0.4);
    if (angry && !ak) beat -= 10;
    if (happy) beat -= 5;
    if (hurt) beat += 10 + i * 2;
    if (dead) beat = 26 - i * 6;
    const fan = p.fan * (ak ? ak.fan : walk ? 1 + 0.22 * Math.cos(a - i * 0.8) : 1 + 0.05 * Math.cos(a - i)) * (dead ? 0.6 : 1);
    for (const side of [-1, 1]) {
      const rx = cx + side * p.dx;
      const ry = cy + p.dy;
      const one = [];
      for (let j = p.n - 1; j >= 0; j--) {
        // Feathers fan from the leading edge down to the trailing edge; the tips lag the sweep.
        const lagT = walk ? Math.sin(a - i * 0.8 - 0.9) * (j / p.n) * 4 : 0;
        const d = p.base + beat + (j - (p.n - 1) * 0.35) * fan + lagT;
        const ang = side > 0 ? d : 180 - d;
        const len = p.len * (1 - Math.abs(j - 1) * 0.08);
        one.push(...feather(rx, ry, ang, len, p.w, fade('#ffffff'), { tip: fade(p.tip), vane: fade('#f0ecfb'), line: fade('#bcaedf') }));
      }
      for (let j = 0; j < 3; j++) {
        const d = p.base + beat + (j - 1) * fan * 0.9 - fan * 0.4;
        one.push(...feather(rx, ry, side > 0 ? d : 180 - d, p.len * 0.45, p.w * 1.1, fade('#fffaf0'), { shaft: false, line: fade('#c6b9e4'), tip: fade(mix(p.tip, '#ffffff', 0.5)) }));
      }
      wings.push(one);
    }
  });
  for (const i of [5, 4, 3, 2, 1, 0]) out.push(...wings[i]);

  // Stardust tail streaming below the core.
  const tw = walk ? Math.sin(a - 1.2) * 2.4 : ak ? [-1, 2, 1.6, 0.6][f] : Math.sin(a) * 1;
  const wisp = (wk, grow = 0) => {
    const L = [];
    const Rr = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = cx + Math.sin(t * 3 - a * (walk ? 1 : 0.6)) * (1 + tw * 0.7) * t * 1.8 - (walk ? t * t * 2 : 0);
      const y = cy + 4 + t * (20 + grow * 0.6 - (cy - 26) * 0.6);
      const w = (5.4 * Math.pow(1 - t, 0.85) * (1 + 0.12 * Math.sin(t * 15 - a)) + 0.25) * wk + grow * (1 - t);
      L.push([x - w, y]);
      Rr.push([x + w, y]);
    }
    return [...L, ...Rr.reverse()];
  };
  out.push(F(T(wisp(1, 0.5), lineOf(STAR))), T(wisp(1), fade(STAR)), F(T(wisp(0.5), fade(STAR_IN))), F(T(wisp(0.18), fade('#ffffff'))));
  if (!dead) {
    const u = (f / n) % 1;
    out.push(...sparkle(cx - 3.5 + tw, cy + 15 + u * 5, 1.2 - u * 0.4, '#fff6c8'), ...sparkle(cx + 4 + tw * 0.8, cy + 12 + ((u + 0.5) % 1) * 5, 0.9, '#ffffff'));
  }

  // The core: two turning eight-pointed stars around a glowing face.
  const spin = (f / n) * 45 + (hurt ? 10 : 0) + (ak ? f * 8 : 0);
  const star = (r1, r2, off, sq = 1) =>
    Array.from({ length: 16 }, (_, i) => {
      const t = rad(-90 + off + i * 22.5);
      const r = i % 2 ? r2 : r1;
      return [cx + Math.cos(t) * r, cy + Math.sin(t) * r * sq];
    });
  const pulse = ak ? ak.pulse : walk ? 1 + Math.sin(a * 2) * 0.04 : 1 + Math.sin(a) * 0.04;
  if (ak && f === 0 && !dead) out.push(F(T(star(16.4, 6, spin + 11), fade('#fff8d8'))));
  out.push(F(T(star(14 * pulse, 7.6, spin), lineOf(STAR))), T(star(13.3 * pulse, 7.2, spin), fade(STAR)));
  out.push(F(T(star(10.6, 7.4, 22.5 - spin * 1.5), lineOf(STAR_IN))), F(T(star(10, 7, 22.5 - spin * 1.5), fade('#fff0b0'))));
  out.push(F(E(cx, cy, 8.4, 8, lineOf(STAR_IN))), E(cx, cy, 7.9, 7.5, fade(STAR_IN)), F(E(cx - 2.4, cy - 4.4, 3.4, 1.4, '#ffffff')), F(E(cx + 3.8, cy + 4.6, 2.2, 0.9, fade('#ffe9a8'))));
  out.push(F(T([[cx + 0.8, cy - 6.6], [cx + 2, cy - 5.2], [cx + 0.8, cy - 3.8], [cx - 0.4, cy - 5.2]], fade('#ff9ec0'))), F(E(cx + 0.5, cy - 5.6, 0.35, 0.35, '#ffffff')));
  // Serene closed eyes that open on star pupils when it's roused or casting.
  const fx = cx + 0.8;
  const fy = cy + 0.4;
  const open = !!ak && f > 0;
  const em = ak && f === 0 && mood === 'angry' ? 'idle' : mood;
  out.push(...seraphEye(fx - 3, fy, 1.6, em, { inner: 1, lid: fade(STAR_IN), open }), ...seraphEye(fx + 3, fy, 1.6, em, { inner: -1, lid: fade(STAR_IN), open }));
  if (!dead) out.push(F(E(fx - 4.4, fy + 2.6, 1.4, 0.7, BLUSH)), F(E(fx + 4.4, fy + 2.6, 1.4, 0.7, BLUSH)));
  out.push(...(ak && f > 0 && f < 3 && !dead ? [F(E(fx, fy + 3.6, 1, 1.2, MOUTH)), F(E(fx, fy + 4.1, 0.6, 0.4, '#ff94ae'))] : mouth(fx, fy + 3.2, 1, em === 'idle' && !ak ? 'idle' : em)));
  if (!dead) for (const s of sparks) if (s.front) out.push(...s.s);
  if (angry && !ak) out.push(...sparkle(cx + 11, cy - 11, 2.2, '#ff9a6b', '#fff0c0'));

  // The cast: light drawn in, then a star burst flung forward, then its shards.
  if (ak && !dead) {
    if (f === 0) {
      for (let i = 0; i < 6; i++) {
        const t = (i / 6) * TAU + 0.3;
        out.push(...stroke([[cx + Math.cos(t) * 19, cy + Math.sin(t) * 17], [cx + Math.cos(t) * 14, cy + Math.sin(t) * 12.5]], 0.6, '#fff3b0'));
      }
    } else if (f === 1) {
      out.push(...streaks([[cx + 8, cy - 1, 40, cy - 2], [cx + 8, cy + 2, 39, cy + 4]], '#fff3b0', 0.9), ...burst(42.6, cy - 1, 6.4, '#ffe27a', '#ffffff', 8, 0.2), ...sparkle(42.6, cy - 1, 3.6, '#ffffff', '#ffffff'));
    } else if (f === 2) {
      out.push(F(ring(42, cy - 1, 6.6, 6.6, 1.1, 0, '#fff3b0')), ...burst(42, cy - 1, 4.4, '#fff6c8', '#ffffff', 6, 0.6));
      for (const [x, y, r] of [[47, cy - 9, 1.8], [46.6, cy + 7, 1.6], [36.6, cy - 9.6, 1.3], [37.6, cy + 8.6, 1.2]]) out.push(...sparkle(x, y, r, '#ffe27a', '#ffffff'));
    } else {
      for (const [x, y, r] of [[47.6, cy - 11, 1.2], [47, cy + 9, 1.1], [42.4, cy - 2, 1.4], [38.4, cy - 12, 0.9]]) out.push(...sparkle(x, y, r, '#fff1a6', '#ffffff'));
    }
  }
  return { w: 50, h: 52, res: 3, shapes: out };
}

// Each design keeps its own cadence: `stride` is how far it travels in one walk or wingbeat cycle.
export const ART = {
  cloudsheep: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [60, 250, 180], draw: pegasus },
  windbird: { walk: 8, idle: 6, attack: 4, stride: 45, atkMs: [45, 200, 140], draw: harpy },
  starspirit: { walk: 8, idle: 6, attack: 4, stride: 60, atkMs: [60, 240, 180], draw: seraph },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  cloudsheep: { name: 'Pegasus Foal', w: 40, h: 32 },
  windbird: { name: 'Sky Harpy', w: 36, h: 30 },
  starspirit: { name: 'Star Seraph', w: 34, h: 36 },
};
