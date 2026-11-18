// Rootwood Hollow's two gatekeeper bosses, remade from scratch for Chapter 3 (2026-11-18). Live
// puppets on the rig (rig.js): every part drawn once and placed each frame, nothing squashed or
// stretched, outer outline only, faces bare. Neither shows a leg: she glides on her gown, he steps on
// hooves peeking out from under a shaggy coat.
//
//   mothercapper  The Myconid Queen: a grand mushroom matriarch under a great pink spotted cap with a
//                 lace gill frill, a little gold crown, two baby puffballs napping on her brim, a lace
//                 ruff and a ruffled gown, a root scepter topped with a glowing puff. Glides, fans
//                 herself, pats the babies, yawns. Slam: scepter up in both hands, down in a burst of
//                 spores. Spore Rain: scepter raised to the roof. Spore Mites: she shakes her cap and
//                 the babies hop off to fight. Lights Out: she ducks under her cap like a tent. Cap
//                 Twirl (new): she spins, gown flaring, and flings a ring of spores round her.
//   tuskar        Tuskar the Behemoth: a huge round boar standing guard in an acorn-cap helmet with a
//                 leaf plume and a red leaf scarf, an autumn-leaf bristle ridge down his back, great
//                 curling tusks. Trots on hooves under his coat; snorts steam, scrapes the floor,
//                 sniffs for truffles, straightens his helmet. Gore: head down, then tusks up.
//                 Charge: paws the floor snorting, then gallops; crashing, he sits down dizzy, helmet
//                 over one eye. Wargs: rears up and bellows. Belly Flop (new): wiggles, jumps, and
//                 lands belly-first in a shockwave of dust.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear, vein } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, makeRig, stateBlend, smooth, clamp, lerp, inPart, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
// The fractional part, never negative.
const fr = (x) => ((x % 1) + 1) % 1;
const INK = '#2e1c26';

// ---------- Shared bits (as in hollowrigs.js) ----------

const ov = (cx, cy, rx, ry, deg, c, n = 18) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return T(pts, c);
};
const arcP = (cx, cy, rx, ry, a0, a1, n = 10) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
const taper = (pts, w0, w1, c) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x + nx * w, y + ny * w]);
    r.push([x - nx * w, y - ny * w]);
  });
  return T([...l, ...r.reverse()], c);
};
const pairOf = (pre) => (key, w, h, shapes, pad = 3) => [() => part(`${pre}|${key}`, w, h, shapes, pad), () => partBare(`${pre}|${key}`, w, h, shapes, pad)];
const faceSprite = (key, w, h, shapes) => sprite(`rig|${key}`, () => ({ w, h, res: 2, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: shapes() }));
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
// How far into a moment that started at `at` we are, 0..1 over `dur` (0 outside it), with an eased
// rise over `ein` and fall over `eout`.
const window1 = (now, at, dur, ein = 0.25, eout = 0.35) => {
  if (at == null) return 0;
  const s = now - at;
  if (s < 0 || s > dur) return 0;
  return Math.min(smooth(clamp(s / ein, 0, 1)), smooth(clamp((dur - s) / eout, 0, 1)));
};
const stepPhase = (m, a, key, stride, cap = 600) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(cap, Math.abs(odo - (st[`${key}O`] ?? odo)) / dt);
  st[`${key}O`] = odo;
  st[`${key}V`] = (st[`${key}V`] ?? 0) + (raw - (st[`${key}V`] ?? 0)) * Math.min(1, dt * 5);
  st[`${key}U`] = ((st[`${key}U`] ?? 0) + (st[`${key}V`] / stride) * dt) % 1;
  return st[`${key}U`];
};
const pawStep = (u, ph, stride, duty, lift) => {
  const R = (stride * duty) / 2;
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < duty) return [R - (2 * R * q) / duty, 0];
  const s = (q - duty) / (1 - duty);
  return [-R + 2 * R * smooth(s), Math.sin(Math.PI * s) * lift];
};
const moveOf = (m, kind) => (m.move?.kind === kind ? m.move : null);
const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
const rot = (shapes, ang, px, py) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const R2 = ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
  return shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => R2([x + (sh.x ?? 0), y + (sh.y ?? 0)])) } : { ...sh, ...(([x, y]) => ({ x, y }))(R2([sh.x, sh.y])) }));
};
const put = (shapes, [pvx, pvy], x, y, deg = 0) => rot(shift(shapes, x - pvx, y - pvy), deg * D2R, x, y);
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout', 'sleep', 'dizzy']);
const moodOf = (a, extra = null) => {
  if (a.face === 'dead') return 'dead';
  if (extra === 'dizzy') return extra;
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3) return 'angry';
  if (extra) return extra;
  if (a.face === 'idle' && (a.t + (a.uidOff ?? 0)) % 4.7 < 0.14) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};
const faceShapes = (mood, o) => {
  const { eyes, mouth, blush, iris, lid = 0.3, k = 1, lashes = 0 } = o;
  const out = [];
  if (mood === 'dead') for (const [x, y, w] of eyes) out.push(...deadEye(x, y, w * 0.75, { c: INK, th: 0.5 * k }));
  else if (mood === 'sleep') for (const [x, y, w] of eyes) out.push(...stroke(arcP(x, y - 0.4 * k, w, w * 0.45, 20, 160, 6), 0.5 * k, INK));
  else if (mood === 'dizzy') for (const [x, y, w] of eyes) {
    const pts = [];
    for (let i = 0; i <= 16; i++) pts.push([x + Math.cos(i * 0.75) * w * (i / 16) * 1.1, y + Math.sin(i * 0.75) * w * (i / 16) * 1.1]);
    out.push(...stroke(pts, 0.42 * k, INK));
  } else {
    const em = mood === 'shout' ? 'angry' : mood;
    for (const [x, y, w, h, s] of eyes) out.push(...simpleEye(x, y, { s, w, h, mood: em, iris, ink: INK, lid: em === 'idle' ? lid : 0, wing: lashes }));
  }
  if (blush && mood !== 'dead') for (const [x, y, rx] of blush) out.push(F(E(x, y, rx, rx * 0.5, '#ff9fb4')));
  const [mx, my, mw] = mouth;
  if (mood === 'shout') out.push(F(E(mx, my + 0.4 * k, mw * 0.55, mw * 0.5, '#7a3040')), F(E(mx, my + 0.8 * k, mw * 0.32, mw * 0.2, '#ff9ab0')));
  else if (mood === 'happy') out.push(...stroke(arcP(mx, my - 0.3 * k, mw * 0.5, mw * 0.4, 20, 160, 6), 0.42 * k, INK));
  else if (mood === 'sleep') out.push(F(E(mx, my, mw * 0.22, mw * 0.18, '#7a3040')));
  else if (mood === 'dizzy') out.push(...stroke([[mx - mw * 0.5, my], [mx - mw * 0.2, my + 0.5 * k], [mx + mw * 0.1, my - 0.2 * k], [mx + mw * 0.45, my + 0.4 * k]], 0.42 * k, INK), F(E(mx + mw * 0.15, my + 1.1 * k, mw * 0.18, mw * 0.25, '#ff8aa8')));
  else if (mood === 'angry' || mood === 'hurt') out.push(...stroke(arcP(mx, my + 0.6 * k, mw * 0.45, mw * 0.3, 200, 340, 6), 0.42 * k, INK));
  else out.push(...stroke([[mx - mw * 0.45, my], [mx, my + 0.5 * k], [mx + mw * 0.45, my - 0.1 * k]], 0.4 * k, INK));
  if (mood === 'hurt') out.push(...tear(eyes[0][0] + 0.6 * k, eyes[0][1] + 1.6 * k, 0.8 * k, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(eyes[0][0] - 3.6 * k, eyes[0][1] - 5 * k, 0.7 * k));
  return out;
};

// =====================================================================================
// The Myconid Queen (mothercapper)
// =====================================================================================

const QCAP = ramp('#ff8fbc', { step: 9, turn: 10 });
const QGILL = '#fff0e6';
const QSTEM = ramp('#fbf0e2', { step: 7, turn: 8, lift: 3 });
const QGOWN = ramp('#fbe4ec', { step: 7, turn: 8, lift: 3 });
const QLACE = '#ffd4e4';
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const QROOT = ramp('#9a6a5a', { step: 9, turn: 8 });
const QORB = '#ffd0ec';
const QBABY = ramp('#fbd6e6', { step: 8, turn: 8, lift: 4 });
const qp = pairOf('mq');

// The gown: her stem's foot flaring into three tiers of ruffles down to the floor. Box 54 x 32; its
// middle on the floor at (27, 31.4).
const qGownShapes = (back) => () => {
  const c = back ? QGOWN.sh : QGOWN.base;
  const out = [T([[17, 0.6], [37, 0.6], [44, 14], [52, 27], [27, 31.6], [2, 27], [10, 14]], c)];
  for (const [y, w, n] of [[11, 26, 7], [20, 38, 9], [29.4, 50, 11]]) {
    const pts = [];
    for (let i = 0; i <= n * 2; i++) {
      const x = 27 - w / 2 + (w * i) / (n * 2);
      pts.push([x, y + (i % 2 ? 1.8 : 0)]);
    }
    out.push(T([[27 - w / 2 + 1, y - 3.4], [27 + w / 2 - 1, y - 3.4], ...pts.reverse()], back ? QGOWN.deep : QLACE));
    if (!back) for (let i = 0; i < n; i++) out.push(F(E(27 - w / 2 + (w * (i + 0.5)) / n, y - 1.4, 0.7, 0.7, '#ffffff')));
  }
  if (!back) out.push(F(E(32, 6, 2, 6, QGOWN.hi)));
  return out;
};
// Her stem: pale and pear-shaped, wide up top where her face is, a slim waist, widening to the gown.
// Box 22 x 38; its joint (bottom middle) at (11, 37.4).
const qStemShapes = () => [
  T([[3.6, 0.6], [18.4, 0.6], [19.6, 9], [18, 18], [16.4, 24], [18.4, 31], [20, 37.4], [2, 37.4], [3.6, 31], [5.6, 24], [4, 18], [2.4, 9]], QSTEM.base),
  crescent(11, 18, 8.4, 18, QSTEM.sh, { k: 0.2, a0: 100, a1: 230 }),
  F(E(16, 8, 1.4, 5, QSTEM.hi)),
];
// The lace ruff round her neck (the ring of a mushroom's stem, worn as a collar). Box 32 x 10; its
// middle top at (16, 1.4).
const qRuffShapes = () => {
  const out = [];
  const pts = [];
  for (let i = 0; i <= 16; i++) pts.push([1 + i * 1.875, 7.6 + (i % 2 ? 1.6 : 0)]);
  out.push(T([[5, 1], [27, 1], ...pts.reverse()], QLACE));
  for (let i = 0; i < 8; i++) out.push(F(E(3.4 + i * 3.6, 5.4, 0.7, 0.7, '#ffffff')));
  out.push(crescent(16, 4.4, 15, 4, QCAP.base, { k: 0.15, a0: 30, a1: 150 }));
  return out;
};
// The great cap: a wide bell, pink with soft white spots, its scalloped lace of gills under the brim.
// Box 82 x 40; it sits on her stem at (41, 36).
const qCapShapes = () => {
  const out = [];
  const gill = [];
  for (let i = 0; i <= 26; i++) gill.push([3 + i * 2.9, 36.6 + (i % 2 ? 2 : 0)]);
  out.push(T([[4, 33], [78, 33], ...gill.reverse()], QGILL));
  for (let i = 0; i < 12; i++) out.push(F(taper([[10 + i * 5.6, 33.4], [11 + i * 5.4, 37.2]], 0.5, 0.3, '#f0c8d4')));
  out.push(T([[0.8, 34.4], [3, 26], [9, 16], [18, 8], [30, 3], [41, 2], [52, 3], [64, 8], [73, 16], [79, 26], [81.2, 34.4], [70, 36], [41, 36.6], [12, 36]], QCAP.base));
  out.push(crescent(41, 22, 40, 15, QCAP.sh, { k: 0.18, a0: 15, a1: 165 }));
  for (const [x, y, rx, ry] of [[22, 16, 5.4, 3.6], [41, 9.6, 6, 3.6], [60, 15, 5.4, 3.8], [12, 27, 3.6, 2.6], [70, 27, 3.8, 2.8], [32, 26, 3.4, 2.4], [52, 25.4, 3.6, 2.6]]) out.push(E(x, y, rx, ry, '#fff8fb'));
  out.push(F(E(48, 6, 9, 1.6, QCAP.hi)));
  return out;
};
// The crown. Box 20 x 12; its base middle at (10, 11).
const qCrownShapes = () => [
  T([[2, 11], [1, 3], [5.4, 6.4], [10, 0.8], [14.6, 6.4], [19, 3], [18, 11]], GOLD.base),
  F(T([[2.6, 10.4], [17.4, 10.4], [17.6, 8.6], [2.4, 8.6]], GOLD.sh)),
  E(10, 6.8, 1.6, 1.6, '#ff6fa8'),
  F(E(9.6, 6.3, 0.5, 0.5, '#ffffff')),
  E(1, 2.6, 1, 1, '#ffffff'),
  E(10, 0.8, 1, 1, '#ffffff'),
  E(19, 2.6, 1, 1, '#ffffff'),
];
// An arm: a puffed lace sleeve and a round hand. Box 20 x 9; the shoulder at (2.4, 4.4).
const qArmShapes = (far) => () => [
  E(5.6, 4.4, 4.6, 4, far ? QGOWN.sh : QLACE),
  taper([[7, 4.4], [15, 4.6]], 4, 3, far ? QSTEM.sh : QSTEM.base),
  E(16.4, 4.6, 2.6, 2.4, far ? QSTEM.sh : QSTEM.base),
];
// The scepter: a twisted root rod topped with leaves and a glowing pink puff, carried like a cane, its
// puff up at her chest. Box 12 x 42; held at (6, 15).
const qScepterShapes = () => [
  taper([[6, 41], [6.8, 33], [5.2, 25], [6.8, 17], [6, 10]], 2.6, 1.8, QROOT.base),
  F(taper([[6.6, 39], [7, 32]], 0.7, 0.5, QROOT.hi)),
  ov(2.6, 9.6, 3.4, 1.6, -30, '#7cbc78'),
  ov(9.6, 9.2, 3.4, 1.6, 30, '#7cbc78'),
  E(6, 5.4, 5, 5, QORB),
  F(E(4.4, 3.8, 1.6, 1.3, '#ffffff')),
  ...[0, 45, 90, 135, 180, 225, 270, 315].map((d) => F(taper([[6, 5.4], [6 + Math.cos(d * D2R) * 4, 5.4 + Math.sin(d * D2R) * 4]], 0.4, 0.2, '#ffb0d8'))),
];
// A baby puffball napping on her brim, in a little nightcap. Box 12 x 12; its bottom middle at (6, 11.4).
const qBabyShapes = (k) => () => [
  E(6, 7.4, 5.2, 4.2, QBABY.base),
  crescent(6, 7.4, 5.2, 4.2, QBABY.sh, { k: 0.2, a0: 30, a1: 170 }),
  T([[1.6, 4.4], [4, 1.4], [8, 0.4], [11.4, 1.6], [9.6, 2.4], [10.4, 4.4]], k ? '#b8e0ff' : '#ffe08a'),
  E(11.6, 1.8, 1.1, 1.1, '#ffffff'),
  ...stroke(arcP(5.6, 7.4, 1, 0.5, 20, 160, 5), 0.4, INK),
  ...stroke(arcP(8.4, 7.2, 0.8, 0.4, 20, 160, 5), 0.4, INK),
  F(E(4.6, 9, 0.9, 0.45, '#ff9fb4')),
];
const Q_GOWN = qp('gown', 54, 32, qGownShapes(false));
const Q_GOWNB = qp('gownb', 54, 32, qGownShapes(true));
const Q_STEM = qp('stem', 22, 38, qStemShapes);
const Q_RUFF = qp('ruff', 32, 10, qRuffShapes);
const Q_CAP = qp('cap', 82, 40, qCapShapes, 4);
const Q_CROWN = qp('crown', 20, 12, qCrownShapes, 2);
const Q_ARM = [false, true].map((far) => qp(`arm${far ? 1 : 0}`, 20, 9, qArmShapes(far), 2));
const Q_SCEPTER = qp('scepter', 12, 42, qScepterShapes, 2);
const Q_BABY = [0, 1].map((k) => qp(`baby${k}`, 12, 12, qBabyShapes(k), 2));
const Q_FACE = { eyes: [[10.6, 9.6, 2.2, 3, -1], [15.8, 9.2, 1.8, 2.5, 1]], mouth: [13.8, 15.2, 2.6], blush: [[8.6, 13, 1.9], [17.4, 12.6, 1.3]], iris: '#c0508a', lid: 0, lashes: 1.2 };
const qFace = (mood) => faceSprite(`mq|face|${mood}`, 22, 38, () => faceShapes(mood, Q_FACE));
// The babies on her brim: [x, y on the cap, which].
const BABIES = [[-24, -26, 0], [22, -29, 1]];

const Q_LOOP = 17;
const qPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const shown = (a, S) => 1 - clamp(S.hide * 1.5, 0, 1);
  return [
    { name: `gownB${tag}`, parent: null, s: Q_GOWNB[i], pivot: [27, 31.4], at: (S) => [S.x - 1.4, 0], rot: (S) => (S.gown * 0.6 - S.flare * 0.5) * D2R },
    { name: `armF${tag}`, parent: 'torso', s: Q_ARM[1][i], pivot: [2.4, 4.4], at: () => [3.6, -13.6], rot: (S) => (72 + S.armF) * D2R, alpha: shown },
    { name: `gown${tag}`, parent: null, s: Q_GOWN[i], pivot: [27, 31.4], at: (S) => [S.x, 0], rot: (S) => (S.gown + S.flare * 0.4) * D2R },
    { name: `stem${tag}`, parent: 'torso', s: Q_STEM[i], pivot: [11, 37.4], alpha: shown },
    { name: `ruff${tag}`, parent: 'torso', s: Q_RUFF[i], pivot: [16, 1.4], at: () => [0, -18.4], rot: (S) => S.ruff * D2R, alpha: shown },
    ...BABIES.map(([x, y, k]) => ({
      name: `baby${k}${tag}`,
      parent: 'capJ',
      s: Q_BABY[k][i],
      pivot: [6, 11.4],
      at: (S, a) => [x + (a.qHop ?? 0) * (k ? 14 : -14), y + 0.4 * Math.sin(a.t * 1.6 + k * 2) - Math.sin((a.qHop ?? 0) * Math.PI) * 14 - S[`pat${k}`]],
      rot: (S, a) => (Math.sin(a.t * 1.6 + k * 2) * 4 + S[`pat${k}`] * 6 * (k ? 1 : -1)) * D2R,
      alpha: (a) => a.qBabies ?? 1,
    })),
    { name: `crown${tag}`, parent: 'capJ', s: Q_CROWN[i], pivot: [10, 11], at: () => [4, -33.4], rot: (S) => (S.crown + S.crownLag) * D2R },
    { name: `cap${tag}`, parent: 'capJ', s: Q_CAP[i], pivot: [41, 36] },
    { name: `scepter${tag}`, parent: 'hand', s: Q_SCEPTER[i], pivot: [6, 15], rot: (S) => (S.scepter - (72 + S.armN) - S.lean - S.tilt) * D2R, alpha: shown },
    { name: `armN${tag}`, parent: 'torso', s: Q_ARM[0][i], pivot: [2.4, 4.4], at: () => [-1.4, -12.6], rot: (S) => (72 + S.armN) * D2R, alpha: shown },
  ];
};

export const queenRig = makeRig({
  w: 90,
  h: 112,
  soft: true,
  stride: 30,
  recover: 0.8,
  springs: {
    x: [160, 16], lift: [120, 12], lean: [110, 11], tilt: [120, 11], armN: [110, 10], armF: [110, 10], scepter: [110, 11], cap: [70, 7], crown: [60, 5], gown: [80, 7], flare: [90, 9], ruff: [80, 7], hide: [90, 13], pat0: [160, 9], pat1: [160, 9],
  },
  fast: ['x', 'lean', 'armN', 'armF', 'scepter'],
  kick: { lean: -160, cap: 200, crown: 360, gown: 120 },
  turnKick: { cap: 110, crown: 220, gown: 180, ruff: 140 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.7;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'mq', 30);
    const p = u * TAU;
    const lu = t % Q_LOOP;
    const fan = hold(lu, 0.6, 1.2, 3.6, 4.2);
    const pat = hold(lu, 6, 6.6, 9, 9.6);
    const yawn = hold(lu, 11.4, 12, 13, 13.6);
    const look = hold(lu, 14.6, 15.2, 16, 16.6);
    const still = 1 - a.walkW;
    a.qYawn = yawn * still;
    a.qPat = pat * still;
    const br = Math.sin(t * 1.3);
    const fanW = Math.sin(t * 9);
    const patW = Math.abs(Math.sin(t * 5));
    const idle = {
      x: 0, lift: br * 0.6 + 0.6, lean: -yawn * 6 + look * -3, tilt: Math.sin(t * 0.7) * 1.4,
      armN: br * 3, armF: br * -3 - fan * (118 + fanW * 14) - pat * 168 - yawn * 120, scepter: br * 2,
      cap: Math.sin(t * 0.9) * 1.4 - yawn * 4 + pat * patW * 2, crown: Math.sin(t * 1.1) * 2, gown: Math.sin(t * 0.8) * 1.2, flare: 0, ruff: 0, hide: 0,
      pat0: pat * patW * 2, pat1: pat * (1 - patW) * 2,
    };
    // The glide: her gown swishing, the cap riding a beat behind, the scepter swinging with her stride.
    const walk = {
      x: 0, lift: Math.abs(Math.sin(p)) * 1, lean: 4, tilt: Math.sin(p) * 2, armN: Math.sin(p) * 8, armF: -Math.sin(p) * 14, scepter: Math.sin(p) * 6,
      cap: -Math.sin(p - 0.7) * 2.4, crown: -Math.sin(p - 1.2) * 4, gown: Math.sin(p) * 3.4, flare: 0, ruff: -Math.sin(p - 0.5) * 3, hide: 0, pat0: 0, pat1: 0,
    };
    // The slam: the scepter up in both hands, then down in front.
    const antic = { x: -3, lift: 1, lean: -10, tilt: 0, armN: -168, armF: -160, scepter: -8, cap: -6, crown: -10, gown: -2, flare: 0, ruff: 4, hide: 0, pat0: 1, pat1: 1 };
    const strike = { x: 6, lift: 0, lean: 14, tilt: 0, armN: -18, armF: -24, scepter: 72, cap: 7, crown: 14, gown: 4, flare: 0, ruff: -6, hide: 0, pat0: 3, pat1: 3 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // Spore Rain: the scepter raised to the roof, the puff blazing.
    const cast = window1(a.now, m.castAt, 1.6);
    a.qCast = cast;
    if (cast) {
      out.armN = lerp(out.armN, -175, cast);
      out.scepter = lerp(out.scepter, -4, cast);
      out.armF = lerp(out.armF, -100, cast);
      out.lean = lerp(out.lean, -8, cast);
      out.lift += cast * 2;
    }
    // Spore Mites: she shakes her cap and the babies hop off it (back on it a while later).
    const call = window1(a.now, m.callAt, 1.3, 0.15, 0.3);
    const since = m.callAt == null ? 99 : a.now - m.callAt;
    a.qHop = clamp((since - 0.3) / 0.6, 0, 1) * (since < 1 ? 1 : 0);
    a.qBabies = since < 0.9 ? 1 - smooth(clamp((since - 0.6) / 0.3, 0, 1)) : since < 9 ? 0 : smooth(clamp((since - 9) / 1, 0, 1));
    if (call) {
      out.cap += Math.sin(a.now * 26) * 7 * call;
      out.armF = lerp(out.armF, -150, call);
    }
    // Lights Out: down under her cap like a tent.
    out.hide = m.hideUntil > a.now ? 1 : 0;
    // Cap Twirl: arms flung wide, the gown flaring as she spins (the turn itself is real: she faces
    // the other way and back again, world/dungeon.js).
    const spin = moveOf(m, 'spin');
    a.qSpin = spin ? clamp((a.now - spin.at) / 0.3, 0, 1) : 0;
    if (spin) {
      out.armN = lerp(out.armN, -70, a.qSpin);
      out.armF = lerp(out.armF, -80, a.qSpin);
      out.flare = 8 * a.qSpin;
      out.lift += 2 * a.qSpin;
      out.scepter = lerp(out.scepter, 40, a.qSpin);
    }
    return out;
  },
  follow: (S) => ({ crownLag: -S.cap * 0.5 }),
  parts: [
    { name: 'torso', parent: null, at: (S) => [S.x, -27 - S.lift + S.hide * 18], rot: (S) => (S.lean + S.tilt) * D2R },
    { name: 'capJ', parent: 'torso', at: (S) => [0.4, -35.6 + S.hide * 14], rot: (S) => (S.cap - (S.lean + S.tilt) * 0.4) * D2R },
    { name: 'hand', parent: 'armN', at: () => [14, 0.2] },
    ...qPass(false),
    ...qPass(true),
    { name: 'face', parent: 'torso', s: (a) => qFace(moodOf(a, a.qYawn > 0.5 ? 'shout' : a.qPat > 0.4 ? 'happy' : a.qSpin > 0.5 ? 'happy' : a.qCast > 0.5 ? 'angry' : null)), pivot: [11, 37.4], alpha: (a, S) => 1 - clamp(S.hide * 1.5, 0, 1) },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The puff on her scepter glows, blazing as she calls the rain or lifts it to slam.
    const pow = Math.max(a.ph.antic, a.qCast, a.qSpin * 0.6);
    if (S.hide < 0.5) inPart(ctx, mat, 'scepter', () => {
      const r = 10 + pow * 12 + Math.sin(a.t * 2.6) * 1.2;
      const g = ctx.createRadialGradient(0, -9.6, 1, 0, -9.6, r);
      g.addColorStop(0, `rgba(255,220,240,${(0.5 + pow * 0.45) * a.alpha})`);
      g.addColorStop(1, 'rgba(255,143,188,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-r, -9.6 - r, r * 2, r * 2);
      if (a.qCast > 0.2) for (let k = 0; k < 6; k++) {
        const u = fr(a.t * 1.4 + k / 6);
        ctx.globalAlpha = a.alpha * a.qCast * (1 - u);
        ctx.fillStyle = k % 2 ? '#ffffff' : '#ffb0d8';
        ctx.beginPath();
        ctx.arc(Math.sin(u * 7 + k) * 5, -12 - u * 40, 1.6 - u, 0, TAU);
        ctx.fill();
      }
    });
    // The slam: a ring of spores bursting out along the floor where the scepter came down.
    if (a.ph.since >= 0 && a.ph.since < 0.6) {
      const u = a.ph.since / 0.6;
      for (let k = 0; k < 12; k++) {
        const ang = Math.PI + (k / 11) * Math.PI;
        ctx.globalAlpha = a.alpha * (1 - u) * 0.9;
        ctx.fillStyle = k % 3 ? '#ffb0d8' : '#ffffff';
        ctx.beginPath();
        ctx.arc(30 + Math.cos(ang) * (6 + u * 30), -2 + Math.sin(ang) * (4 + u * 16), 2.2 * (1 - u) + 0.6, 0, TAU);
        ctx.fill();
      }
    }
    // The twirl: spores flung off her brim in a widening swirl.
    if (a.qSpin > 0) for (let k = 0; k < 14; k++) {
      const ang = a.t * 7 + (k / 14) * TAU;
      const d = 34 + fr(a.t * 1.6 + k * 0.13) * 30;
      ctx.globalAlpha = a.alpha * a.qSpin * 0.85;
      ctx.fillStyle = k % 2 ? '#ffffff' : '#ffb0d8';
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * d, -56 + Math.sin(ang) * d * 0.25, 1.8, 0, TAU);
      ctx.fill();
    }
    // The babies snore.
    if ((a.qBabies ?? 1) > 0.5) {
      const u = fr(a.t * 0.45);
      ctx.globalAlpha = a.alpha * (1 - u) * 0.8 * (a.qBabies ?? 1);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px sans-serif';
      ctx.fillText('z', 28 + u * 4, -88 - u * 8);
    }
  },
});
export function queenStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const tr = [0, -27];
  const cj = [tr[0] + 0.4, tr[1] - 35.6];
  return {
    w: 100,
    h: 120,
    res: 2,
    shapes: shift(
      [
        ...put(qGownShapes(true)(), [27, 31.4], -1.4, 0),
        ...put(qArmShapes(true)(), [2.4, 4.4], tr[0] + 3.6, tr[1] - 13.6, 72),
        ...put(qGownShapes(false)(), [27, 31.4], 0, 0),
        ...put(qStemShapes(), [11, 37.4], tr[0], tr[1]),
        ...put(qRuffShapes(), [16, 1.4], tr[0], tr[1] - 18.4),
        ...BABIES.flatMap(([x, y, k]) => put(qBabyShapes(k)(), [6, 11.4], cj[0] + x, cj[1] + y)),
        ...put(qCrownShapes(), [10, 11], cj[0] + 4, cj[1] - 33.4),
        ...put(qCapShapes(), [41, 36], cj[0], cj[1]),
        ...put(faceShapes(fm, Q_FACE), [11, 37.4], tr[0], tr[1]),
        ...put(qScepterShapes(), [6, 15], tr[0] - 1.4 + 4.3, tr[1] - 12.6 + 13.4, 0),
        ...put(qArmShapes(false)(), [2.4, 4.4], tr[0] - 1.4, tr[1] - 12.6, 72),
      ],
      50,
      116,
    ),
  };
}

// =====================================================================================
// Tuskar the Behemoth (tuskar)
// =====================================================================================
// (Redrawn standing up on 2026-11-18: on all fours he read as a loaf.) A big round boar standing
// guard on two hooves, a barrel of a belly, stubby arms ending in hoofed fists, an acorn-cap helmet
// with a leaf plume, a red leaf scarf, a crest of autumn-leaf bristles from his crown down his back,
// great curling tusks.

const HIDE = ramp('#9c6a4c', { step: 9, turn: 10 });
const BELLY = '#f0d4b4';
const SNOUT = ramp('#f2a8a0', { step: 8, turn: 8 });
const TUSK = ramp('#fff6e4', { step: 8, turn: 8, lift: 3 });
const HOOF = ramp('#5a3e36', { step: 8, turn: 8 });
const RIDGE = [ramp('#ff9a3c', { step: 9, turn: 8 }), ramp('#ffc24a', { step: 9, turn: 8 }), ramp('#e8683a', { step: 9, turn: 8 })];
const ACORN = ramp('#e6b25e', { step: 11, turn: 8 });
const SCARF = ramp('#e85a4a', { step: 9, turn: 8 });
const tp = pairOf('tk2');

// The crest: leaf-bristle tufts growing out of his coat, each its own part rooted a few px inside the
// fur edge and turning only about that root, so it sways and flickers like a flame but can never
// come away from him. A tuft points up from its root; box 10 x (L + 6), its root at (5, L + 1), its
// foot sunk 4 px below that (under the fur).
const tuftShapes = (L, c) => () => [
  T([[1, L + 5], [1.4, L * 0.62], [3.2, L * 0.3], [5, 0.6], [6.8, L * 0.3], [8.6, L * 0.62], [9, L + 5]], c.base),
  F(taper([[5, L + 1], [4.9, L * 0.32]], 1.1, 0.4, c.hi)),
];
// Where the tufts root along an oval (its centre and radii in the parent's own space): the point on its
// edge, sunk `inset` px back in along the true normal, and which way that normal points (degrees).
const tuftRoots = (cx, cy, rx, ry, a0, a1, n, len, inset) => {
  const out = [];
  for (let k = 0; k < n; k++) {
    const a = (a0 + ((a1 - a0) * k) / (n - 1)) * D2R;
    const [ex, ey] = [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
    let [nx, ny] = [Math.cos(a) / rx, Math.sin(a) / ry];
    const d = Math.hypot(nx, ny);
    nx /= d;
    ny /= d;
    out.push({ x: ex - nx * inset, y: ey - ny * inset, deg: Math.atan2(ny, nx) / D2R, L: Math.round(len * (0.75 + 0.25 * Math.sin((k / (n - 1)) * Math.PI))), c: k % 3 });
  }
  return out;
};
// Down his back (in the hip's space: the body's box shifted by its joint, (31, 50)) and over the back
// of his crown (in the neck's space: the head's box shifted by its joint, (14, 40)).
const BACK_TUFTS = tuftRoots(31 - 31, 27 - 50, 27, 22.4, 194, 264, 8, 15, 3);
const HEAD_TUFTS = tuftRoots(24 - 14, 21 - 40, 19.5, 17.6, 204, 256, 5, 12, 3);
const TUFT = {};
const tuftPart = (L, c, bare) => {
  const key = `${L}|${c}`;
  TUFT[key] ??= tp(`tuft${key}`, 10, L + 6, tuftShapes(L, RIDGE[c]), 2);
  return TUFT[key][bare ? 1 : 0];
};
// A tuft's turn: out along the coat's normal, swept back a little, flickering on its own, leaning
// with the crest's sway (and streaming back as he charges).
const tuftRot = (t, k, S) => (t.deg + 90 - 16 + Math.sin(S._t * 3.2 + k * 1.3) * 5 + S.ridge * 0.6) * D2R;

// The barrel: a huge round belly under a shaggy coat, a lighter belly, one jagged hem of shag along
// the bottom that his short legs hide under. Box 62 x 52; its joint (bottom middle) at (31, 50).
const tkBodyShapes = () => {
  const out = [E(31, 27, 27, 22.4, HIDE.base)];
  const hem = [];
  for (let i = 0; i <= 12; i++) hem.push([9 + i * 3.7, i % 2 ? 51.4 : 47.6]);
  out.push(T([[8, 42], [54, 42], ...hem.reverse()], HIDE.base));
  out.push(F(E(37.6, 31, 15, 14.4, BELLY)));
  out.push(crescent(31, 27, 27, 22.4, HIDE.sh, { k: 0.18, a0: 110, a1: 240, jag: 0.5 }), shine(31, 25, 27, 22.4, HIDE.hi, 0, 0.7));
  for (const [x, y] of [[14, 16], [20, 9], [9, 28], [24, 40]]) out.push(F(taper([[x, y], [x - 2, y + 4], [x - 1, y + 7]], 1.2, 0.4, HIDE.sh)));
  return out;
};
// The head: big and round, a broad pink snout, the far tusk behind it and the near tusk curling up
// in front. Box 52 x 46; the neck at (14, 40).
const tkHeadShapes = () => [
  taper([[36, 37], [42, 34], [44.6, 27], [42, 22]], 4, 2, TUSK.sh),
  E(24, 21, 19.5, 17.6, HIDE.base),
  F(E(27, 31, 12, 6.4, BELLY)),
  crescent(24, 21, 19.5, 17.6, HIDE.sh, { k: 0.18, a0: 110, a1: 230 }),
  F(E(20, 8, 6, 2, HIDE.hi)),
  E(41, 28, 9.6, 8.2, SNOUT.base),
  E(46.4, 27.4, 3.6, 5.8, SNOUT.sh),
  F(E(47, 25, 1.2, 1.8, '#7a3a3a')),
  F(E(46.8, 30, 1.2, 1.8, '#7a3a3a')),
  F(E(38.6, 24, 3, 1.4, SNOUT.hi)),
  taper([[33, 39.4], [40, 37.6], [45.6, 31], [45.6, 23.6], [42, 20.6]], 6, 2.2, TUSK.base),
  F(taper([[34.6, 38.4], [40, 36.4], [44, 30.6]], 1.4, 0.8, '#ffffff')),
];
const tkEarShapes = (far) => () => [T([[2, 13], [3, 5], [8, 0.8], [12, 8], [9, 13.6]], far ? HIDE.sh : HIDE.base), F(T([[4, 11.4], [4.8, 5.4], [7.8, 2.8], [9.4, 8.4]], far ? HIDE.deep : SNOUT.base))];
// The acorn-cap helmet, a leaf plume from its stalk. Box 34 x 20; its rim's middle at (17, 18).
const tkHelmShapes = () => {
  const out = [T([[2, 18], [3, 11], [7, 6], [17, 4], [27, 6], [31, 11], [32, 18]], ACORN.base)];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7 - r; i++) out.push(F(ov(6 + r * 2.4 + i * ((22 - r * 4.8) / (6 - r)), 15.4 - r * 3.6, 2, 1.2, 0, r % 2 ? ACORN.sh : ACORN.hi)));
  out.push(T([[1, 18.8], [33, 18.8], [32, 16.2], [2, 16.2]], ACORN.sh));
  out.push(taper([[17, 4.4], [17.8, 1.4]], 2.2, 1.6, ACORN.sh));
  out.push(ov(23.4, 2, 4.6, 1.9, -20, '#7cbc78'), F(taper([[19.6, 2.8], [26.6, 0.8]], 0.4, 0.2, '#4f8a52')));
  return out;
};
// The leaf scarf round his neck, its tail its own part. Box 36 x 14; its knot at (18, 5).
const tkScarfShapes = () => [
  T([[2, 2], [34, 2], [35, 9], [26, 12.6], [18, 11], [10, 12.6], [1, 9]], SCARF.base),
  F(taper([[3, 6], [18, 8.4], [33, 6]], 1, 1, SCARF.sh)),
  F(taper([[6, 3.4], [13, 5.4]], 0.6, 0.4, SCARF.hi)),
];
const tkScarfTailShapes = () => [T([[2, 1], [5, 1.6], [12, 6], [14, 11.4], [10.4, 9.6], [6, 11.6], [1.4, 4]], SCARF.base), F(taper([[3, 2], [9, 7.4]], 0.6, 0.4, SCARF.sh))];
// An arm: thick and short, a round fist tipped with dark hoof. Box 30 x 16; the shoulder at (5, 8).
const tkArmShapes = (far) => () => [
  taper([[5, 8], [13, 8.2]], 11, 10.4, far ? HIDE.sh : HIDE.base),
  E(17, 8.4, 6.6, 6.2, far ? HIDE.sh : HIDE.base),
  E(21.8, 8.6, 2.6, 4.6, far ? HOOF.sh : HOOF.base),
  ...(far ? [] : [F(E(15.4, 5.4, 2.6, 1.1, HIDE.hi))]),
];
// A foot: a big round hoof, cloven, peeking from under the coat. Box 20 x 11; its middle at (10, 6).
const tkFootShapes = (far) => () => [E(10, 6, 9, 5, far ? HOOF.sh : HOOF.base), F(taper([[12.6, 1.6], [13.2, 10.4]], 1.1, 0.8, HOOF.deep)), F(E(6.4, 3.6, 3, 1.1, HOOF.hi))];
const tkTailShapes = () => [taper([[1.4, 6], [4, 3], [7.6, 2.4], [9, 5], [6.6, 6.6], [5.6, 4.6]], 2, 1.4, HIDE.base), E(5.6, 4.2, 1.4, 1.2, RIDGE[0].base)];
const TK_BODY = tp('body', 62, 52, tkBodyShapes, 4);
const TK_HEAD = tp('head', 52, 46, tkHeadShapes, 4);
const TK_EAR = [false, true].map((far) => tp(`ear${far ? 1 : 0}`, 13, 14, tkEarShapes(far), 2));
const TK_HELM = tp('helm', 34, 20, tkHelmShapes);
const TK_SCARF = tp('scarf', 36, 14, tkScarfShapes);
const TK_SCARFT = tp('scarft', 15, 13, tkScarfTailShapes, 2);
const TK_ARM = [false, true].map((far) => tp(`arm${far ? 1 : 0}`, 30, 16, tkArmShapes(far), 2));
const TK_FOOT = [false, true].map((far) => tp(`foot${far ? 1 : 0}`, 20, 11, tkFootShapes(far), 2));
const TK_TAIL = tp('tail', 11, 8, tkTailShapes, 2);
const TK_FACE = { eyes: [[26, 17.4, 2.6, 3.4, -1], [33.6, 16.6, 2.1, 2.8, 1]], mouth: [38.6, 38.6, 3], blush: [[21, 24.4, 2.8]], iris: '#7a4a28', lid: 0 };
const tkFace = (mood) => faceSprite(`tk2|face|${mood}`, 52, 46, () => faceShapes(mood, TK_FACE));

const TK_FEET = { N: [-7, 0], F: [6, 0.5] };
// His hips: lower as he sits down dazed or lies flat after a belly flop, up as he jumps.
const tkHip = (S) => [S.x, -8 - S.lift - S.air + S.sit * 9 - S.flat * 18];
const tkAng = (S) => (S.lean + S.tilt) * D2R;
const tkPt = (S, lx, ly) => {
  const r = tkAng(S);
  const [hx, hy] = tkHip(S);
  return [hx + lx * Math.cos(r) - ly * Math.sin(r), hy + lx * Math.sin(r) + ly * Math.cos(r)];
};
const tkFoot = (S, a, key) => {
  const [rx, ph] = TK_FEET[key];
  const [dx, lift] = pawStep(a.tkU ?? 0, ph, a.tkStride ?? 24, 0.55, 4);
  let x = S.x + rx + dx * a.walkW;
  let y = -5.4 - lift * a.walkW;
  // Scraping the floor with his near hoof (pawing before a charge, or just grumpy).
  if (key === 'N' && S.scrape > 0) {
    const q = fr(a.t * 3.2);
    x += S.scrape * (8 - q * 16);
    y -= S.scrape * Math.sin(Math.min(1, q * 1.4) * Math.PI) * 4;
  }
  // Sat down dazed: both feet out in front of him.
  x = lerp(x, S.x + rx * 0.4 + 20, clamp(S.sit, 0, 1));
  y = lerp(y, -5, clamp(S.sit, 0, 1));
  // In the air or flat on his belly: the feet go with the body.
  const r = clamp(S.ride, 0, 1);
  if (r > 0) {
    const [bx, by] = tkPt(S, rx * 0.5, 4);
    x = lerp(x, bx, r);
    y = lerp(y, by, r);
  }
  return [x, y];
};
const tkPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `tail${tag}`, parent: 'hip', s: TK_TAIL[i], pivot: [1.4, 6], at: () => [-26, -22], rot: (S) => (200 + S.tailWag) * D2R },
    ...BACK_TUFTS.map((t, k) => ({ name: `bt${k}${tag}`, parent: 'hip', s: () => tuftPart(t.L, t.c, bare)(), pivot: [5, t.L + 1], at: () => [t.x, t.y], rot: (S) => tuftRot(t, k, S) })),
    { name: `armF${tag}`, parent: 'hip', s: TK_ARM[1][i], pivot: [5, 8], at: () => [-6, -36], rot: (S) => (56 + S.armF) * D2R },
    { name: `footF${tag}`, parent: null, s: TK_FOOT[1][i], pivot: [10, 6], at: (S, a) => tkFoot(S, a, 'F') },
    { name: `footN${tag}`, parent: null, s: TK_FOOT[0][i], pivot: [10, 6], at: (S, a) => tkFoot(S, a, 'N') },
    { name: `body${tag}`, parent: 'hip', s: TK_BODY[i], pivot: [31, 50] },
    { name: `scarfT${tag}`, parent: 'scarfJ', s: TK_SCARFT[i], pivot: [2, 1], at: () => [-12, 3], rot: (S) => (40 + S.scarf) * D2R },
    { name: `scarf${tag}`, parent: 'scarfJ', s: TK_SCARF[i], pivot: [18, 5] },
    { name: `earF${tag}`, parent: 'neck', s: TK_EAR[1][i], pivot: [5, 13], at: () => [-4, -30], rot: (S) => (-36 + S.ear) * D2R },
    ...HEAD_TUFTS.map((t, k) => ({ name: `ht${k}${tag}`, parent: 'neck', s: () => tuftPart(t.L, t.c, bare)(), pivot: [5, t.L + 1], at: () => [t.x, t.y], rot: (S) => tuftRot(t, k + 8, S) })),
    { name: `head${tag}`, parent: 'neck', s: TK_HEAD[i], pivot: [14, 40] },
    { name: `helm${tag}`, parent: 'neck', s: TK_HELM[i], pivot: [17, 18], at: (S) => [10 + S.askew * 6, -33 + S.askew * 3], rot: (S) => (-6 + S.helm + S.askew * 26) * D2R },
    { name: `earN${tag}`, parent: 'neck', s: TK_EAR[0][i], pivot: [5, 13], at: () => [0, -31], rot: (S) => (-18 + S.ear) * D2R },
    { name: `armN${tag}`, parent: 'hip', s: TK_ARM[0][i], pivot: [5, 8], at: () => [14, -32], rot: (S) => (44 + S.armN) * D2R },
  ];
};

export const tuskarRig = makeRig({
  w: 96,
  h: 104,
  soft: true,
  stride: 24,
  recover: 0.8,
  springs: {
    x: [150, 16], lift: [140, 12], air: [140, 14], lean: [110, 11], tilt: [120, 11], sit: [80, 12], flat: [120, 14], ride: [160, 16], head: [110, 10], armN: [120, 10], armF: [120, 10],
    ear: [120, 7], ridge: [80, 6], tailWag: [140, 7], scarf: [60, 5], helm: [90, 7], askew: [70, 10], scrape: [120, 12],
  },
  fast: ['x', 'head', 'lean', 'armN', 'armF', 'air'],
  kick: { lean: -100, head: -180, ear: 400, helm: 300, ridge: 200 },
  turnKick: { ear: 260, ridge: 160, scarf: 200, helm: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.9;
    const t = a.t + a.uidOff;
    // (A longer stride as he gallops, so his feet never blur.)
    a.tkStride = m.charging ? 64 : 24;
    a.tkU = stepPhase(m, a, 'tk', a.tkStride);
    const p = a.tkU * TAU;
    const lu = t % 18;
    const snort = hold(lu, 0.6, 0.9, 1.6, 2);
    const scrape = hold(lu, 3.6, 4, 5.6, 6);
    const sniff = hold(lu, 8, 8.6, 10.4, 11);
    const fix = hold(lu, 12.4, 12.7, 13.4, 13.8);
    const yawn = hold(lu, 15, 15.5, 16.4, 16.9);
    const still = 1 - a.walkW;
    a.tkSnort = snort * still;
    a.tkYawn = yawn * still;
    const br = Math.sin(t * 1.4);
    const idle = {
      x: 0, lift: br * 0.5 + 0.5, air: 0, lean: sniff * 12 - yawn * 6, tilt: 0, sit: 0, flat: 0, ride: 0,
      head: -snort * 8 + Math.sin(t * 9) * 3 * snort + sniff * (16 + Math.sin(t * 9) * 3) - yawn * 18 + fix * Math.sin(t * 12) * 6 + br * 1.4,
      armN: br * 3 - fix * 126 - yawn * 120, armF: -br * 3 - yawn * 116, ear: br * 4 + sniff * Math.sin(t * 7) * 8, ridge: br * 2,
      tailWag: Math.sin(t * 3) * 16, scarf: Math.sin(t * 1.2) * 6, helm: fix * Math.sin(t * 14) * 8, askew: 0, scrape: scrape * still,
    };
    // The stomp: big hooves stepping out from under the coat, the barrel rolling, arms swinging, the
    // ears, scarf and crest a beat behind.
    const walk = {
      x: 0, lift: Math.abs(Math.sin(p)) * 2, air: 0, lean: 4, tilt: Math.sin(p) * 3, sit: 0, flat: 0, ride: 0, head: 3 + Math.sin(p * 2 - 0.5) * 3,
      armN: Math.sin(p) * 24, armF: -Math.sin(p) * 24, ear: -Math.sin(p) * 10, ridge: -Math.sin(p - 0.6) * 4, tailWag: Math.sin(p) * 20, scarf: -8 - Math.sin(p - 0.8) * 8, helm: -Math.sin(p - 0.9) * 3, askew: 0, scrape: 0,
    };
    // The gore: hunched, head down, then the tusks swung up as he lunges.
    const antic = { x: -6, lift: 0, air: 0, lean: 18, tilt: 0, sit: 0, flat: 0, ride: 0, head: 22, armN: 64, armF: 60, ear: -24, ridge: 10, tailWag: 30, scarf: 0, helm: 6, askew: 0, scrape: 0.6 };
    const strike = { x: 14, lift: 2, air: 0, lean: -8, tilt: 0, sit: 0, flat: 0, ride: 0, head: -36, armN: -36, armF: -26, ear: 30, ridge: -12, tailWag: -20, scarf: -30, helm: -14, askew: 0, scrape: 0 };
    const out = stateBlend(a, idle, walk, antic, strike);
    const now = a.now;
    // Lowering his tusks at someone: hunched, head down, pawing the floor, snorting steam.
    if (m.aim) Object.assign(out, { lean: 16, head: 18, scrape: 1, armN: 50, armF: 50, ear: -20, ridge: 12, tailWag: Math.sin(now * 20) * 30 });
    if (m.aim) a.tkSnort = 1;
    // The charge: leaning right into it, arms pumping, ears, scarf and crest streaming.
    a.tkCharge = m.charging ? 1 : 0;
    if (m.charging) Object.assign(out, { lean: 24, head: 8, armN: Math.sin(p) * 55 - 10, armF: -Math.sin(p) * 55 - 10, ear: -40, scarf: -60, ridge: -16 });
    // Dazed after crashing: sat down hard, feet out, swaying, his helmet over one eye.
    const stun = m.hold === 'stun' && m.frozenUntil > now;
    a.tkStun = stun ? 1 : 0;
    if (stun) Object.assign(out, { sit: 1, lean: -14 + Math.sin(now * 3) * 4, head: -6 + Math.sin(now * 3 + 1) * 8, askew: 1, armN: -30 + Math.sin(now * 3) * 10, armF: -20, ear: Math.sin(now * 3) * 20 });
    // Calling his Wargs: arms up, head back, bellowing.
    const call = window1(now, m.callAt, 1.6, 0.3, 0.4);
    a.tkCall = call;
    if (call) {
      out.armN = lerp(out.armN, -136, call);
      out.armF = lerp(out.armF, -130, call);
      out.head = lerp(out.head, -24, call);
      out.lean = lerp(out.lean, -8, call);
    }
    // Belly Flop: a wiggle, a jump, and down flat on his belly; then up again.
    const flop = moveOf(m, 'flop');
    a.tkFlop = 0;
    if (flop) {
      const s = now - flop.at;
      const jump = flop.warn - 0.5;
      if (s < jump) Object.assign(out, { lift: -2, lean: 8 + Math.sin(now * 16) * 5, tailWag: Math.sin(now * 24) * 40, armN: 64, armF: 60, head: 10 });
      else if (s < flop.warn) {
        const k = (s - jump) / 0.5;
        Object.assign(out, { air: Math.sin(k * Math.PI) * 26 + k * 6, lean: 10 + k * 72, ride: 1, armN: -96, armF: -86, head: -20, ear: 30 });
      } else {
        const k = clamp((s - flop.warn) / 0.7, 0, 1);
        const down = 1 - smooth(clamp((k - 0.45) / 0.55, 0, 1));
        Object.assign(out, { flat: down, lean: 82 * down, ride: down, armN: -40 * down, armF: -30 * down, head: -40 * down });
        a.tkFlop = 1 - k;
      }
    }
    return out;
  },
  parts: [
    { name: 'hip', parent: null, at: (S, a) => ((S._t = a.t), tkHip(S)), rot: (S) => tkAng(S) },
    { name: 'neck', parent: 'hip', at: () => [6, -38], rot: (S) => (S.head - (S.lean + S.tilt) * 0.4) * D2R },
    { name: 'scarfJ', parent: 'neck', at: () => [2, -1] },
    ...tkPass(false),
    ...tkPass(true),
    { name: 'face', parent: 'neck', s: (a) => tkFace(moodOf(a, a.tkStun ? 'dizzy' : a.tkCall > 0.4 || a.tkYawn > 0.5 ? 'shout' : a.tkCharge ? 'angry' : null)), pivot: [14, 40] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Steam snorting from his nostrils.
    if (a.tkSnort > 0.3 || a.tkCharge) inPart(ctx, mat, 'neck', () => {
      for (let k = 0; k < 4; k++) {
        const u = fr(a.t * 2.4 + k / 4);
        ctx.globalAlpha = a.alpha * (1 - u) * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(35 + u * 12, -12 + (k % 2 ? 4 : -4) * u, 1.6 + u * 3.4, 0, TAU);
        ctx.fill();
      }
    });
    // Embers drifting up off his crest (it's only leaves, but they glow like a hearth).
    inPart(ctx, mat, 'hip', () => {
      for (let k = 0; k < 4; k++) {
        const u = fr(a.t * 0.6 + k / 4);
        ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
        ctx.fillStyle = k % 2 ? '#ffb03a' : '#ffe36b';
        ctx.beginPath();
        ctx.arc(-26 + k * 6 + Math.sin(u * 6 + k) * 3, -44 - u * 22 + k * 4, 1.3 * (1 - u) + 0.5, 0, TAU);
        ctx.fill();
      }
    });
    const dust = (x, y, r, al) => {
      ctx.globalAlpha = a.alpha * al;
      ctx.fillStyle = '#e8dccc';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    };
    // Dust: scraped up by his hoof, thrown behind the gallop, a great ring as his belly lands.
    if (S.scrape > 0.3) for (let k = 0; k < 3; k++) {
      const u = fr(a.t * 3.2 + k / 3);
      dust(-6 - u * 22 - k * 4, -2 - u * 7, 2 + u * 4, (1 - u) * 0.6 * S.scrape);
    }
    if (a.tkCharge) for (let k = 0; k < 5; k++) {
      const u = fr(a.t * 3 + k / 5);
      dust(-24 - u * 40, -3 - u * 8, 3 + u * 6, (1 - u) * 0.7);
    }
    if (a.tkFlop > 0) {
      const u = 1 - a.tkFlop;
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) dust(20 + s * (34 + u * 70 + k * 8), -3 - k * 2 - u * 6, 4 + u * 6 - k, (1 - u) * 0.8);
    }
  },
});
export function tuskarStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const [hx, hy] = [0, -8];
  const nk = [hx + 6, hy - 38];
  return {
    w: 110,
    h: 112,
    res: 2,
    shapes: shift(
      [
        ...put(tkTailShapes(), [1.4, 6], hx - 26, hy - 22, 200),
        ...BACK_TUFTS.flatMap((t) => put(tuftShapes(t.L, RIDGE[t.c])(), [5, t.L + 1], hx + t.x, hy + t.y, t.deg + 90 - 16)),
        ...put(tkArmShapes(true)(), [5, 8], hx - 6, hy - 36, 56),
        ...put(tkFootShapes(true)(), [10, 6], 6, -5.4),
        ...put(tkFootShapes(false)(), [10, 6], -7, -5.4),
        ...put(tkBodyShapes(), [31, 50], hx, hy),
        ...put(tkScarfTailShapes(), [2, 1], nk[0] + 2 - 12, nk[1] - 1 + 3, 40),
        ...put(tkScarfShapes(), [18, 5], nk[0] + 2, nk[1] - 1),
        ...put(tkEarShapes(true)(), [5, 13], nk[0] - 4, nk[1] - 30, -36),
        ...HEAD_TUFTS.flatMap((t) => put(tuftShapes(t.L, RIDGE[t.c])(), [5, t.L + 1], nk[0] + t.x, nk[1] + t.y, t.deg + 90 - 16)),
        ...put(tkHeadShapes(), [14, 40], nk[0], nk[1]),
        ...put(faceShapes(fm, TK_FACE), [14, 40], nk[0], nk[1]),
        ...put(tkHelmShapes(), [17, 18], nk[0] + 10, nk[1] - 33, -6),
        ...put(tkEarShapes(false)(), [5, 13], nk[0], nk[1] - 31, -18),
        ...put(tkArmShapes(false)(), [5, 8], hx + 14, hy - 32, 44),
      ],
      55,
      108,
    ),
  };
}
