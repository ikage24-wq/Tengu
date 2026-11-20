// Folio, the Archivist (redrawn 2026-11-18, the player's pick "B, the Scholar"): the Star
// Observatory's head librarian, a snowy owl scholar. No more floor-length robe: fluffy feathered
// trousers to the ankle and three round toes, feathered wings for arms (a fan of secondaries under
// each forearm, three long primaries for fingers), a broad round owl head with a heart-shaped face,
// pointed ear tufts rooted in her crown, half-moon spectacles on a chain, a mortarboard with a
// swinging gold tassel, a short gold-trimmed scholar's cape over an ivory tabard, a purple stole
// with a star at its end, and three bookmark ribbons (red, gold, blue) streaming from her belt.
// The great book is gripped at its spine in her near wing's feathers, open as she reads, shut when
// it's swung.
//
// Rigged on rig.js, outer outline only (an outlined pass, then the same parts bare), the face bare.
// Every loose bit rides its own spring a beat behind: tufts, cape, stole, tabard hem, the tassel's
// cord and tassel, each ribbon's two pieces.
//
// How she moves:
//   idle    a 12 s act: she reads, turning a page now and then; looks up over her spectacles at
//           you, tufts perking; a little "shh" with a feather to her beak, the book clutched shut;
//           then back to her page.
//   walk    an owl's waddle on planted feet (her knees bend to wherever each foot is, so nothing
//           slides), a rock and a bob on every step, the far wing out for balance.
//   attacks one for each of her casts (world/observatory.js sets m.castPose; a plain swing is a
//           bonk): Shhh! (a breath in, then the shush pushed out at you), Overdue Notice (the book
//           raised high in both wings and slammed down), Return Your Books (books flung up out of
//           it), Reading Lamp (the open book held high, blazing), Bookmark (a red ribbon whipped out
//           in a long slash), Group Study (she lectures, then points: gather!).
//   hit     a kick through her tilt, head, tufts and cape.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, sparkle, puff, ownFace } from './rigkit.js';

const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const sized = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};
const star5 = (x, y, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
// Rounds a closed outline (corner cutting).
const smoothPts = (pts, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return q;
};
const blob = (pts, c) => T(smoothPts(pts), c);
// A turned oval.
const ovl = (cx, cy, rx, ry, deg, c, n = 14) => {
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
const INK = '#2e1c26';
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
// A soft feather mark: a little V.
const vmark = (x, y, c, w = 1.6) => F(taper([[x - w, y], [x, y + w], [x + w, y]], 0.5, 0.5, c));

const SNOW = ramp('#f4f0ff', { step: 7, turn: 10, lift: 3 });
const MOZ = ramp('#5a46a8', { step: 10, turn: 8, lift: 12 });
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const BOOK = ramp('#a84a5a', { step: 10, turn: 8 });
const IVORY = '#f4ead8';
const MARK = '#d4cceb';
const BROW = '#9a88d0';
const RIBBONS = ['#e04a5a', GOLD.base, '#4a7ac8'];
const fo = pairOf('fo2');

// ---------- Her parts (each in its own box; the pivot is where it hangs) ----------
// The head: broad and round, cheek ruffs, little crown feathers, the heart-shaped face disc (a
// lavender rim, white inside). Box 46 x 40; centred at (23, 20); the neck at (23, 38).
const HX = 23;
const HY = 20;
const foHead = () => [
  blob([[HX - 17, HY + 3], [HX - 23, HY + 10], [HX - 16, HY + 9.6], [HX - 18, HY + 15], [HX - 11, HY + 12]], SNOW.base),
  blob([[HX + 15, HY + 8], [HX + 21, HY + 12], [HX + 15, HY + 14]], SNOW.base),
  E(HX, HY, 21, 17.4, SNOW.base),
  crescent(HX, HY, 21, 17.4, SNOW.sh, { k: 0.13, a0: 110, a1: 215 }),
  ...[[-8, -13], [-3, -15], [2, -15.4], [7, -14]].map(([dx, dy]) => vmark(HX + dx, HY + dy, '#d8d0f0')),
  F(E(HX - 7, HY - 9, 6, 2.4, '#ffffff')),
  F(blob([[HX + 4, HY + 15.6], [HX - 9.6, HY + 8.6], [HX - 13, HY - 0.6], [HX - 8, HY - 8], [HX + 2.6, HY - 4.4], [HX + 13.6, HY - 9], [HX + 20, HY - 1], [HX + 17, HY + 8.4]], '#d4cbef')),
  F(blob([[HX + 4, HY + 13.8], [HX - 8, HY + 7.8], [HX - 11, HY - 0.2], [HX - 7, HY - 6], [HX + 2.6, HY - 2.6], [HX + 13, HY - 7], [HX + 18.2, HY - 0.4], [HX + 15.4, HY + 7.6]], '#ffffff')),
];
// An ear tuft: three pointed feathers fanning up from a root inside her crown. Box 12 x 16; the
// root at (6, 15).
const foTuft = (far) => () => [0, 1, 2].map((i) => {
  const d = (-90 + (i - 1) * 22) * D2R;
  const len = i === 1 ? 11 : 8.4;
  return taper([[6, 15], [6 + Math.cos(d) * len * 0.55, 15 + Math.sin(d) * len * 0.55], [6 + Math.cos(d) * len, 15 + Math.sin(d) * len]], 4.4, 0.5, far ? SNOW.sh : i === 1 ? '#ffffff' : SNOW.base);
});
// The mortarboard: a skullcap on her crown under a square board seen from a little above, a gold
// button on top. Box 38 x 18; sat on her crown at (19, 15).
const foCap = () => [
  T([[9, 10], [29, 10], [30, 16], [8, 16]], MOZ.base), F(T([[9, 10], [13, 10], [11, 16], [8, 16]], MOZ.hi)),
  T([[2, 7], [16, 12], [16, 13.8], [2, 8.8]], MOZ.sh), T([[16, 12], [36, 7.6], [36, 9.4], [16, 13.8]], MOZ.sh),
  T([[2, 7], [21, 2.6], [36, 7.6], [16, 12]], MOZ.base), F(T([[2, 7], [21, 2.6], [23, 3.2], [5, 7.4]], MOZ.hi)),
  E(19, 7.4, 1.8, 1.3, GOLD.base), F(E(18.6, 7, 0.7, 0.4, '#fff8d8')),
];
// The tassel: its gold cord (along +x, box 14 x 5 from (1, 2.5)) and the tassel itself hanging
// on it (box 8 x 15 from (4, 1)).
const foCord = () => line([[1, 2.5], [12.4, 2.5]], 0.9, GOLD.base);
const foTassel = () => [...line([[4, 1], [4, 6]], 0.9, GOLD.base), E(4, 6.4, 1.6, 1.2, GOLD.sh), T([[2.2, 7], [5.8, 7], [6.6, 13.6], [1.4, 13.6]], GOLD.base), ...[2.4, 4, 5.6].map((x) => F(taper([[x, 9], [x, 13.4]], 0.4, 0.4, GOLD.sh))), F(T([[2.4, 7.4], [3.4, 7.4], [2.6, 12], [1.8, 12]], '#fff3c4'))];
// The scholar's cape (a mozetta), over her shoulders: round at a scalloped hem, gold at the edge,
// a soft collar fold, a star clasp at the front of her neck. Box 40 x 26; hung at (20, 1).
const foCape = () => [
  T([[6, 6], [14, 1], [26, 1], [33, 5], [37, 14], [38, 22], [32, 20], [26, 24], [20, 21], [14, 24], [8, 21], [2, 24], [1, 16]], MOZ.base),
  F(T([[6, 6], [10, 3.6], [6, 20], [2, 22], [1.6, 16]], MOZ.hi)),
  F(taper([[12, 4], [20, 6], [28, 4.6]], 0.6, 0.6, MOZ.sh)),
  ...line([[2, 24], [8, 21], [14, 24], [20, 21], [26, 24], [32, 20], [38, 22]], 1.1, GOLD.base),
  E(29.4, 6.4, 2.2, 2.2, GOLD.base), F(star5(29.4, 6.4, 1.4, '#fff8d8')),
];
// The hood, folded down at the back of the cape. Box 16 x 18; hung at (13, 2).
const foHood = () => [blob([[2, 4], [8, 1], [13, 2], [14.4, 11], [8, 16.4], [1.4, 12]], MOZ.sh), F(blob([[4, 5], [9, 3.4], [11, 9], [6, 12]], MOZ.base)), ...line([[1.6, 12.4], [8, 16.2], [14.2, 11]], 0.8, GOLD.sh)];
// Her body: a round snowy owl, soft feather marks down her front. Box 36 x 44; the chest joint at (17, 41).
const foBody = () => [E(18, 22, 16, 20, SNOW.base), crescent(18, 22, 16, 20, SNOW.sh, { k: 0.16, a0: 100, a1: 230 }), ...[0, 1, 2, 3, 4, 5].map((k) => vmark(16 + (k % 2) * 6, 13 + k * 3.6, MARK))];
// The tabard: ivory, to her hips (her legs show below it), a gold belt, a lacy hem. Box 28 x 34; hung at (14, 1).
const foTabard = () => [
  T([[3, 1], [25, 1], [27, 25], [14, 28.4], [1, 25]], IVORY), F(T([[3, 1], [7, 1], [4, 25], [1, 25]], '#fffaf0')),
  ...[0, 1, 2, 3, 4, 5].map((k) => F(E(3 + k * 4.4, 25.6 + (k === 2 || k === 3 ? 1.8 : 0), 1.6, 1, '#e4d8c0'))),
  R(1.4, 19, 26, 3, GOLD.sh), F(R(1.4, 19, 26, 1, GOLD.base)),
  R(18.6, 18.4, 4.6, 4.2, GOLD.base), F(R(19.6, 19.4, 2.6, 2.2, GOLD.sh)),
];
// The stole: a purple band down the front of the tabard, a gold star at its end. Box 8 x 34; hung at (4, 1).
const foStole = () => [R(1.7, 0, 4.6, 24, MOZ.base), F(R(1.7, 0, 1.2, 24, MOZ.hi)), star5(4, 25.6, 3, GOLD.base), F(star5(4, 25.8, 1.5, '#fff8d8'))];
// A bookmark ribbon, in two pieces: the top (box 6 x 12 from (3, 1)) and the forked tail (box
// 6 x 15 from (3, 1)).
const foRibA = (c) => () => [taper([[3, 1], [3, 10.4]], 2.6, 2.4, c)];
const foRibB = (c) => () => [taper([[3, 1], [3, 9.6]], 2.4, 2.4, c), T([[1.6, 9], [4.4, 9], [4.6, 13.6], [3, 11.6], [1.4, 13.6]], c)];
// A wing worn as an arm, in three pieces: the upper (box 14 x 10, from the shoulder at (2, 5) to
// the elbow at (11, 5)); the forearm with its fan of secondaries hanging under it (box 16 x 15,
// from the elbow at (2, 4) to the wrist at (12.2, 4)); the hand, three long round primaries for
// fingers (box 16 x 14, from the wrist at (2, 7)).
const foUpper = (far) => () => {
  const c = far ? SNOW.sh : SNOW.base;
  return [taper([[2, 5], [11, 5]], 7.4, 6.4, c), F(E(5, 3.2, 3, 1.1, far ? SNOW.base : '#ffffff')), vmark(6, 5.6, far ? '#c4bce0' : MARK, 1.2), vmark(9, 5.4, far ? '#c4bce0' : MARK, 1.2)];
};
const foFore = (far) => () => {
  const c = far ? SNOW.sh : SNOW.base;
  const fc = far ? '#c8c0e2' : '#e6e0f8';
  return [ovl(4.4, 8.4, 2.2, 3.8, 14, fc), ovl(7.8, 9, 2.2, 4, 8, c), ovl(11, 8.4, 2, 3.4, -4, fc), taper([[2, 4], [12.2, 4]], 6.4, 5.4, c), F(E(5, 2.4, 3, 0.9, far ? SNOW.base : '#ffffff'))];
};
const foHand = (far) => () => {
  const c = far ? SNOW.sh : SNOW.base;
  const fc = far ? '#c8c0e2' : '#e6e0f8';
  return [-32, 0, 32].map((d, k) => ovl(2 + Math.cos(d * D2R) * 5, 7 + Math.sin(d * D2R) * 5, 4.6, 2, d, k === 1 ? c : fc));
};
// The great book, gripped at the foot of its spine (17, 21): open, two pages fanned up and a red
// ribbon marker; or shut, standing up from her grip, its spine at her feathers. Box 36 x 24.
const foBookOpen = () => [
  T([[17, 21], [1, 15.4], [2, 13.4], [17, 19]], BOOK.base), T([[17, 21], [33, 15.4], [32, 13.4], [17, 19]], BOOK.base),
  T([[17, 20], [2, 14.4], [4, 3.6], [17, 9]], '#fff4e0'), T([[17, 20], [32, 14.4], [30, 3.6], [17, 9]], '#fff8ec'),
  ...[5, 8, 11].map((y) => F(taper([[6, y + 2], [14, y + 4]], 0.3, 0.3, '#c8b8a8'))), ...[5, 8, 11].map((y) => F(taper([[20, y + 4], [28, y + 2]], 0.3, 0.3, '#c8b8a8'))),
  F(star5(23.6, 6.6, 1.6, '#a8a0e0')), F(T([[16, 9], [18, 9], [18, 23.4], [17, 21.8], [16, 23.4]], '#e04a5a')),
];
const foBookShut = () => [
  R(19, 3, 13, 18, BOOK.base), R(30.4, 4.4, 1.6, 15.2, '#fff4e0'), R(16, 3, 3.4, 18, BOOK.sh), F(R(19, 3, 13, 1.6, BOOK.hi)),
  F(star5(25.4, 11.6, 3.2, GOLD.base)), F(star5(25.4, 11.8, 1.5, '#fff8d8')), F(R(29, 3, 3, 3, GOLD.base)), F(R(29, 18, 3, 3, GOLD.base)),
];
// A leg: a fluffy feathered thigh (box 18 x 14 from the hip at (9, 2); the knee 9.5 below), the
// fluffy shin to a feathered fringe (box 16 x 16 from the knee at (8, 1); the ankle 12.6 below)
// and three round toes (box 16 x 8 from the ankle at (6, 2)).
const foThigh = (far) => () => {
  const c = far ? SNOW.sh : SNOW.base;
  return [blob([[2, 3], [9, 1], [16, 3], [17, 9], [13, 13], [5, 13], [1, 9]], c), F(blob([[2.4, 2.6], [15.6, 2.6], [14.6, 5], [3.4, 5]], far ? '#c4bce0' : '#dcd4f2')), vmark(7, 8, far ? '#c4bce0' : MARK), vmark(12, 9.4, far ? '#c4bce0' : MARK), F(E(4.6, 8, 1.6, 2.6, far ? SNOW.base : '#ffffff'))];
};
const foShin = (far) => () => {
  const c = far ? SNOW.sh : SNOW.base;
  return [blob([[2.4, 0.6], [13.6, 0.6], [14.8, 8], [14.6, 13], [12.4, 15], [10, 13.2], [8, 15.4], [5.6, 13.2], [3.4, 15], [1.4, 13], [1.2, 7]], c), vmark(6, 6, far ? '#c4bce0' : MARK), vmark(10.4, 8.4, far ? '#c4bce0' : MARK)];
};
const foFoot = (far) => () => {
  const t = far ? '#d8943a' : '#f2b24a';
  return [E(12, 4.6, 2.4, 2, t), E(7.4, 5, 2.4, 2, t), E(3, 4.6, 2, 1.7, t), F(E(11.6, 3.9, 0.9, 0.5, '#ffe0a0')), F(E(7, 4.3, 0.9, 0.5, '#ffe0a0'))];
};
const FO = {
  HEAD: fo('head', 46, 40, foHead, 2), CAP: fo('cap', 38, 18, foCap, 2), CORD: fo('cord', 14, 5, foCord, 2), TASSEL: fo('tassel', 8, 15, foTassel, 2),
  TUFT: [false, true].map((f) => fo(`tuft${f ? 1 : 0}`, 12, 16, foTuft(f), 2)),
  CAPE: fo('cape', 40, 26, foCape, 2), HOOD: fo('hood', 16, 18, foHood, 2), BODY: fo('body', 36, 44, foBody, 2), TABARD: fo('tabard', 28, 34, foTabard, 2), STOLE: fo('stole', 8, 34, foStole, 2),
  RIB: RIBBONS.map((c, k) => [fo(`rib${k}a`, 6, 12, foRibA(c), 2), fo(`rib${k}b`, 6, 15, foRibB(c), 2)]),
  UP: [false, true].map((f) => fo(`up${f ? 1 : 0}`, 14, 10, foUpper(f), 2)), FORE: [false, true].map((f) => fo(`fore${f ? 1 : 0}`, 16, 15, foFore(f), 2)), HAND: [false, true].map((f) => fo(`hand${f ? 1 : 0}`, 16, 14, foHand(f), 2)),
  BOOK: [fo('bookopen', 36, 24, foBookOpen, 2), fo('bookshut', 36, 24, foBookShut, 2)],
  THIGH: [false, true].map((f) => fo(`thigh${f ? 1 : 0}`, 18, 14, foThigh(f), 2)), SHIN: [false, true].map((f) => fo(`shin${f ? 1 : 0}`, 16, 16, foShin(f), 2)), FOOT: [false, true].map((f) => fo(`foot${f ? 1 : 0}`, 16, 8, foFoot(f), 2)),
};

// ---------- Her faces ----------
// Her own set: big amber owl eyes behind half-moon spectacles, soft lilac brows that carry the
// feeling, a small hooked beak (open when she hoots), a light blush. Box 46 x 40, as the head.
const EN = [HX + 10, HY + 0.6, 4.2];
const EF = [HX - 3.6, HY + 0.6, 3.6];
const eye = ([x, y, r], { lx = 0, ly = 0, lid = 0, small = false } = {}) => [
  F(E(x, y, r, r * 1.06, '#f5b030')), F(E(x, y + r * 0.35, r * 0.86, r * 0.6, '#ffcf5a')),
  F(E(x + 0.4 + lx, y + 0.2 + ly, r * (small ? 0.34 : 0.56), r * (small ? 0.38 : 0.6), INK)),
  ...(small ? [] : [F(star5(x - r * 0.3 + lx * 0.5, y - r * 0.3 + ly * 0.5, r * 0.36, '#ffffff')), F(E(x + r * 0.4 + lx * 0.5, y + r * 0.42 + ly * 0.5, r * 0.15, r * 0.15, '#ffffff'))]),
  // (A heavy lid: lilac, drawn down over the top of the eye, its edge inked.)
  ...(lid > 0 ? [F(T([...arcP(x, y, r * 1.08, r * 1.1, 180, 360, 9), ...arcP(x, y - r * (1 - lid * 2), r * 1.08, r * 0.35, 0, 180, 9)], '#e2dcf6')), ...line(arcP(x, y - r * (1 - lid * 2), r * 1.02, r * 0.35, 15, 165, 8), 0.8)] : line(arcP(x, y, r * 1.02, r * 1.06, 195, 345, 8), 0.8)),
];
const shut = ([x, y, r], up = false) => line(arcP(x, y + 0.8, r, r * 0.6, up ? 20 : 200, up ? 160 : 340, 7), 0.9);
const brows = (pn, pf, c = BROW) => [F(taper(pn, 1.5, 0.8, c)), F(taper(pf, 1.3, 0.7, c))];
const BROW_N = [[HX + 5.6, HY - 5.4], [HX + 14.4, HY - 4.6]];
const BROW_F = [[HX - 7.4, HY - 4.2], [HX - 0.8, HY - 5]];
const browsUp = (k) => [[BROW_N[0], [BROW_N[1][0], BROW_N[1][1] - k]], [[BROW_F[0][0], BROW_F[0][1] - k], BROW_F[1]]];
const beak = () => [F(blob([[HX + 3, HY + 4.4], [HX + 7.4, HY + 4.4], [HX + 6.6, HY + 8.6], [HX + 5, HY + 10.6], [HX + 4.4, HY + 8]], '#ffa83a')), F(E(HX + 4.6, HY + 5.4, 1.2, 0.7, '#ffd8a0'))];
const beakOpen = (k = 1) => [
  F(E(HX + 5.4, HY + 8.4 + k, 2.4, 1.6 + k, '#7a3040')), F(E(HX + 5.4, HY + 9.4 + k, 1.4, 0.8, '#ff9ab0')),
  F(blob([[HX + 3, HY + 4], [HX + 7.8, HY + 4], [HX + 7.2, HY + 7.2], [HX + 5.6, HY + 8.4], [HX + 3.6, HY + 7.4]], '#ffa83a')), F(E(HX + 4.6, HY + 5, 1.2, 0.7, '#ffd8a0')),
  F(blob([[HX + 3.8, HY + 9.6 + k * 1.6], [HX + 7, HY + 9.4 + k * 1.6], [HX + 5.6, HY + 11.4 + k * 1.6]], '#f09030')),
];
const blush = (k = 1) => [F(E(HX - 8.2, HY + 7, 2.2 * k, 1.1 * k, '#ffb8cc')), F(E(HX + 16, HY + 6.6, 2.2 * k, 1.1 * k, '#ffb8cc'))];
const specs = () => [
  ...line(arcP(EN[0], EN[1] + 1, 5.6, 4.4, 10, 170, 9), 1, GOLD.base), ...line(arcP(EF[0], EF[1] + 1, 4.8, 3.8, 10, 170, 9), 0.9, GOLD.base),
  ...line([[HX + 1.2, HY + 2], [HX + 4.6, HY + 2]], 0.7, GOLD.base), ...line([[HX - 8.4, HY + 1.8], [HX - 12, HY + 9], [HX - 10, HY + 15]], 0.5, GOLD.sh),
];
const FO_FACES = {
  // Calm and kindly-strict: looking at you, a hint of a smile in her brows.
  idle: () => [...eye(EN), ...eye(EF), ...brows(BROW_N, BROW_F), ...beak(), ...blush(), ...specs()],
  blink: () => [...shut(EN), ...shut(EF), ...brows(BROW_N, BROW_F), ...beak(), ...blush(), ...specs()],
  // Reading: eyes down at the page under heavy lids.
  read: () => [...eye(EN, { lx: 0.8, ly: 1.4, lid: 0.45 }), ...eye(EF, { lx: 0.8, ly: 1.4, lid: 0.45 }), ...brows(BROW_N, BROW_F), ...beak(), ...blush(), ...specs()],
  // Peering at you over her spectacles: eyes up, one brow raised.
  peer: () => [...eye(EN, { ly: -1, lid: 0.15 }), ...eye(EF, { ly: -1, lid: 0.15 }), ...brows([BROW_N[0], [BROW_N[1][0], BROW_N[1][1] - 2.4]], BROW_F), ...beak(), ...blush(0.9), ...specs()],
  // Shhh: eyes shut, brows calm, the beak pursed under her feather.
  hush: () => [...shut(EN), ...shut(EF), ...brows([BROW_N[0], [BROW_N[1][0], BROW_N[1][1] + 0.6]], BROW_F), ...beak(), ...blush(1.1), ...specs()],
  sleep: () => [...shut(EN), ...shut(EF), ...brows(BROW_N, BROW_F), ...beak(), ...blush(), ...specs()],
  // Cross: pupils small, brows down in a V, a firm beak.
  angry: () => [...eye(EN, { small: true, lid: 0.25 }), ...eye(EF, { small: true, lid: 0.25 }), ...brows([[HX + 5.4, HY - 3.4], [HX + 14.6, HY - 6.4]], [[HX - 7.6, HY - 6], [HX - 0.6, HY - 3.4]], INK), ...beak(), ...blush(0.7), ...specs()],
  // Hooting it out: brows high, the beak wide.
  shout: () => [...eye(EN, { small: true }), ...eye(EF, { small: true }), ...brows(...browsUp(2)), ...beakOpen(1), ...blush(0.8), ...specs()],
  // Hurt: squeezed shut, a tear.
  hurt: () => [...shut(EN), ...shut(EF), ...brows([[HX + 5.6, HY - 6.2], [HX + 14.4, HY - 3.8]], [[HX - 7.4, HY - 3.6], [HX - 0.8, HY - 6]]), ...beakOpen(0.2), E(HX + 15, HY + 4, 1.1, 1.6, '#6ec4ff'), F(E(HX + 14.7, HY + 3.5, 0.4, 0.5, '#ffffff')), ...specs()],
  // Delighted: happy shut eyes, beak open a little.
  happy: () => [...shut(EN, true), ...shut(EF, true), ...brows(...browsUp(1.6)), ...beakOpen(0.4), ...blush(1.2), ...specs()],
  dead: () => [...line([[EN[0] - 2.6, EN[1] - 2.6], [EN[0] + 2.6, EN[1] + 2.6]], 0.9), ...line([[EN[0] + 2.6, EN[1] - 2.6], [EN[0] - 2.6, EN[1] + 2.6]], 0.9), ...line([[EF[0] - 2.2, EF[1] - 2.2], [EF[0] + 2.2, EF[1] + 2.2]], 0.8), ...line([[EF[0] + 2.2, EF[1] - 2.2], [EF[0] - 2.2, EF[1] + 2.2]], 0.8), ...beakOpen(0.3), ...specs()],
};
const foFaceShapes = (mood) => ownFace(FO_FACES, mood);
const foFace = (mood) => faceSprite(`fo2|face|${mood}`, 46, 40, () => foFaceShapes(mood));
const foMood = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.foKind === 'shush' && (a.ph.antic > 0.3 || a.ph.strike > 0.2 || a.foCast > 0.5)) return a.ph.strike > 0.3 ? 'shout' : 'hush';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3 || a.foCast > 0.5) return 'angry';
  if (a.face === 'hurt') return 'hurt';
  if (a.face && a.face !== 'idle' && a.face !== 'angry') return FO_FACES[a.face] || MOODS.has(a.face) ? a.face : 'idle';
  const t = a.t + (a.uidOff ?? 0);
  if (a.foHush > 0.5) return 'hush';
  if (t % 4.3 < 0.13) return 'blink';
  if (a.foPeer > 0.5) return 'peer';
  if (a.foRead > 0.5) return 'read';
  return 'idle';
};

// ---------- The skeleton ----------
// (Origin at her feet. The hip 25 up; the chest joint 2 above it; shoulders, neck and the rest
// hang from the chest in its own space.)
// (One cycle, a step with each foot, covers FO_STRIDE rig px: 26, so each foot travels about 15 px
// along the floor while it's down; at her 32 px/s that's two steps a second.)
const FO_STRIDE = 26;
const FO_DUTY = 0.6;
const L1 = 9.5;
const L2 = 13;
const LEG_DY = 21.4;
function legIK(dx, dy, hipDeg) {
  const d = Math.min(L1 + L2 - 0.05, Math.max(4, Math.hypot(dx, dy)));
  const hip = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const knee = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
  return [(-Math.atan2(dx, dy) - hip) / D2R - hipDeg, (Math.PI - knee) / D2R];
}
const [STAND_T, STAND_S] = legIK(0, LEG_DY, 0);
// The book's turn in her grip that holds it at `want` degrees on screen, given the arm's angles.
const aim = (want, arm, elb, tilt = 0) => want - arm - elb - tilt;
const RIB_AT = [[-11.4, -6], [-10.4, -5.4], [-9.4, -4.8]];

// Would the book overlap her head? Then it, and the wing holding it, go behind her head (nothing
// ever covers her face), unless she's shushing (her feather at her beak, the book under her chin).
// (All in chest space: the wrist from the arm's angles, the book's middle from its turn, the head
// round its centre above the neck.)
const behind = (a, S) => {
  if (a.foFront) return false;
  const ar = S.armN * D2R;
  const fr2 = (S.armN + S.elbN) * D2R;
  const wx = 11 + 9 * Math.cos(ar) + 10.2 * Math.cos(fr2);
  const wy = -27 + 9 * Math.sin(ar) + 10.2 * Math.sin(fr2);
  const br = (S.armN + S.elbN + S.book) * D2R;
  const [ox, oy] = a.foShut ? [8, -9] : [0, -10];
  const cx = wx + ox * Math.cos(br) - oy * Math.sin(br);
  const cy = wy + ox * Math.sin(br) + oy * Math.cos(br);
  const hr = (S.head - S.tilt * 0.5) * D2R;
  const hx = 2 + 18 * Math.sin(hr);
  const hy = -39 - 18 * Math.cos(hr);
  return ((cx - hx) / 34) ** 2 + ((cy - hy) / 30) ** 2 < 1;
};
const before = (a, S) => !behind(a, S);
const foPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `foot${k}${tag}`, parent: `ankle${k}`, s: FO.FOOT[j][i], pivot: [6, 2], rot: (S) => -(S.tilt * 0.3 + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${tag}`, parent: `knee${k}`, s: FO.SHIN[j][i], pivot: [8, 1], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${tag}`, parent: 'hip', s: FO.THIGH[j][i], pivot: [9, 2], at: () => [far ? -6 : 6, 0], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  const ribbon = (k) => [
    { name: `rib${k}a${tag}`, parent: 'chest', s: FO.RIB[k][0][i], pivot: [3, 1], at: () => RIB_AT[k], rot: (S) => S[`rb${k}a`] * D2R },
    { name: `rib${k}b${tag}`, parent: `rib${k}a`, s: FO.RIB[k][1][i], pivot: [3, 1], at: () => [0, 9.4], rot: (S) => S[`rb${k}b`] * D2R },
  ];
  const wing = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return {
      up: { name: `up${k}${tag}`, parent: 'chest', s: FO.UP[j][i], pivot: [2, 5], at: () => (far ? [-8, -27] : [11, -27]), rot: (S) => S[`arm${k}`] * D2R },
      fore: { name: `fore${k}${tag}`, parent: `elbow${k}`, s: FO.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
      hand: { name: `hand${k}${tag}`, parent: `grip${k}`, s: FO.HAND[j][i], pivot: [2, 7], rot: (S) => S[`fing${k}`] * D2R },
    };
  };
  const wn = wing(false);
  const wf = wing(true);
  return [
    ...ribbon(0), ...ribbon(1), ...ribbon(2),
    { name: `hood${tag}`, parent: 'chest', s: FO.HOOD[i], pivot: [13, 2], at: () => [-9, -38.6], rot: (S) => S.cape * 1.2 * D2R },
    wf.up, wf.fore, wf.hand,
    { name: `tuftF${tag}`, parent: 'nk', s: FO.TUFT[1][i], pivot: [6, 15], at: () => [-12, -28], rot: (S) => (-38 - S.tuftF) * D2R },
    ...leg(true),
    { name: `body${tag}`, parent: 'chest', s: FO.BODY[i], pivot: [17, 41] },
    ...leg(false),
    { name: `tabard${tag}`, parent: 'chest', s: FO.TABARD[i], pivot: [14, 1], at: () => [1, -25], rot: (S) => S.tab * D2R },
    { name: `stole${tag}`, parent: 'chest', s: FO.STOLE[i], pivot: [4, 1], at: () => [2.4, -21], rot: (S) => S.stole * D2R },
    wn.up,
    { name: `cape${tag}`, parent: 'chest', s: FO.CAPE[i], pivot: [20, 1], at: () => [2, -40], rot: (S) => S.cape * D2R },
    // (Raised high, the book and the wing holding it pass behind her head: drawn here.)
    { ...wn.fore, name: `foreNk${tag}`, when: behind },
    { name: `bookk${tag}`, parent: 'gripN', s: (a) => FO.BOOK[a.foShut ? 1 : 0][i](), pivot: [17, 21], rot: (S) => S.book * D2R, when: behind },
    { ...wn.hand, name: `handNk${tag}`, when: behind },
    { name: `tuftN${tag}`, parent: 'nk', s: FO.TUFT[0][i], pivot: [6, 15], at: () => [10, -30], rot: (S) => (32 + S.tuftN) * D2R },
    { name: `head${tag}`, parent: 'nk', s: FO.HEAD[i], pivot: [23, 38] },
    // (The face is bare, drawn in the bare pass right after the head, so whatever crosses in
    // front of her face, a wing or the book, is drawn over it.)
    ...(bare ? [{ name: 'face', parent: 'nk', s: (a) => foFace(foMood(a)), pivot: [23, 38] }] : []),
    { name: `cap${tag}`, parent: 'nk', s: FO.CAP[i], pivot: [19, 15], at: () => [1, -31], rot: (S) => S.cap * D2R },
    { name: `cord${tag}`, parent: 'cap', s: FO.CORD[i], pivot: [1, 2.5], at: () => [0, -7.6], rot: (S) => S.tas0 * D2R },
    { name: `tassel${tag}`, parent: 'cord', s: FO.TASSEL[i], pivot: [4, 1], at: () => [11.4, 0], rot: (S) => S.tas1 * D2R },
    { ...wn.fore, when: before },
    { name: `book${tag}`, parent: 'gripN', s: (a) => FO.BOOK[a.foShut ? 1 : 0][i](), pivot: [17, 21], rot: (S) => S.book * D2R, when: before },
    { ...wn.hand, when: before },
  ];
};

// ---------- Her moves ----------
const KINDS = ['bonk', 'shush', 'slam', 'toss', 'lamp', 'mark', 'study'];
// (Each move: the wind-up (antic) and the blow (strike); legs given as plain angles.)
const SQ_T = STAND_T - 14;
const SQ_S = STAND_S + 26;
function moveOf(kind, t) {
  const legs = (tn, sn, tf, sf) => ({ thighN: tn, shinN: sn, thighF: tf, shinF: sf, rollN: 0, rollF: 0 });
  const stand = legs(STAND_T, STAND_S, STAND_T, STAND_S);
  if (kind === 'shush') return [
    // A breath in, leaning back, the feather rising to her beak, the book clutched shut.
    { x: -2, lift: 1.4, tilt: -8, head: -12, armN: -84, elbN: -36, book: aim(160, -84, -36, -8), armF: 120, elbF: -30, fingN: 0, fingF: 0, cape: 4, stole: 6, tab: 3, tuftN: 14, tuftF: 12, cap: -4, ...stand },
    // The shush, pushed out at you: leaning right in, tufts flattened, the cape thrown back.
    { x: 5, lift: -0.6, tilt: 14, head: 14, armN: -78, elbN: -44, book: aim(158, -78, -44, 14), armF: 140, elbF: -10, fingN: -6, fingF: 10, cape: 22, stole: -10, tab: -8, tuftN: -22, tuftF: -20, cap: 6, ...legs(STAND_T - 10, STAND_S + 8, STAND_T + 6, STAND_S) },
  ];
  if (kind === 'slam') return [
    // Overdue! The book shut and raised high in both wings, up on her toes.
    { x: -3, lift: 3.4, tilt: -14, head: -16, armN: 210, elbN: -12, book: aim(-150, -150, -12, -14), armF: -140, elbF: -20, fingN: 0, fingF: 0, cape: 2, stole: 10, tab: 6, tuftN: 18, tuftF: 16, cap: -8, ...legs(STAND_T + 4, STAND_S - 10, STAND_T + 4, STAND_S - 10) },
    // Slammed down flat in front of her, knees bent with it.
    { x: 7, lift: -4, tilt: 22, head: 16, armN: 424, elbN: -18, book: aim(90, 64, -18, 22), armF: 80, elbF: -20, fingN: 10, fingF: 10, cape: 26, stole: -14, tab: -12, tuftN: -24, tuftF: -22, cap: 10, ...legs(SQ_T, SQ_S, SQ_T + 8, SQ_S - 6) },
  ];
  if (kind === 'toss') return [
    // Return your books: the book held low and wide open, a little crouch.
    { x: -2, lift: -2, tilt: 8, head: 6, armN: 84, elbN: -40, book: aim(-30, 84, -40, 8), armF: 120, elbF: -30, fingN: 10, fingF: 0, cape: 8, stole: 2, tab: 0, tuftN: 6, tuftF: 6, cap: 2, ...legs(SQ_T + 6, SQ_S - 10, SQ_T + 6, SQ_S - 10) },
    // Flung up: the open book swept high, her head thrown back to watch them fly.
    { x: 2, lift: 3, tilt: -10, head: -18, armN: -96, elbN: -36, book: aim(-150, -96, -36, -10), armF: 60, elbF: -50, fingN: -10, fingF: 0, cape: 16, stole: 10, tab: 8, tuftN: 20, tuftF: 18, cap: -10, ...legs(STAND_T + 6, STAND_S - 12, STAND_T + 6, STAND_S - 12) },
  ];
  if (kind === 'lamp') return [
    // The book opened toward you at her face, beginning to glow.
    { x: -1, lift: 1, tilt: -4, head: -4, armN: 20, elbN: -70, book: aim(40, 20, -70, -4), armF: 130, elbF: -20, fingN: -10, fingF: 0, cape: 6, stole: 4, tab: 2, tuftN: 8, tuftF: 8, cap: -2, ...stand },
    // Held high overhead, blazing like a reading lamp.
    { x: 2, lift: 4, tilt: -8, head: -10, armN: -30, elbN: 2, book: aim(42, -30, 2, -8), armF: 150, elbF: 10, fingN: -10, fingF: 0, cape: 14, stole: 8, tab: 6, tuftN: 16, tuftF: 14, cap: -6, ...legs(STAND_T + 6, STAND_S - 14, STAND_T + 6, STAND_S - 14) },
  ];
  if (kind === 'mark') return [
    // Bookmark: the book shut and drawn right back, a red ribbon pulled out of it.
    { x: -4, lift: 0, tilt: -12, head: -4, armN: 150, elbN: 20, book: aim(-160, 150, 20, -12), armF: 40, elbF: -60, fingN: 0, fingF: 0, cape: 2, stole: 8, tab: 6, tuftN: 6, tuftF: 6, cap: -4, ...legs(STAND_T + 10, STAND_S, STAND_T - 6, STAND_S + 6) },
    // Whipped round in a long slash in front of her, a lunge on the near foot.
    { x: 9, lift: -2, tilt: 18, head: 8, armN: -14, elbN: 4, book: aim(80, -14, 4, 18), armF: 150, elbF: 0, fingN: 0, fingF: 0, cape: 30, stole: -16, tab: -12, tuftN: -18, tuftF: -16, cap: 8, ...legs(STAND_T - 24, STAND_S + 18, STAND_T + 14, STAND_S + 4) },
  ];
  if (kind === 'study') return [
    // Group study: the book held up to show the class, the far wing beckoning.
    { x: -1, lift: 1, tilt: -4, head: -2, armN: 56, elbN: -96, book: aim(36, 56, -96, -4), armF: -150, elbF: 10 + Math.sin(t * 12) * 24, fingN: 0, fingF: 0, cape: 6, stole: 4, tab: 2, tuftN: 10, tuftF: 10, cap: -2, ...stand },
    // Gather! The far wing points high, the book lifted.
    { x: 2, lift: 2, tilt: -6, head: -10, armN: 40, elbN: -90, book: aim(30, 40, -90, -6), armF: -150, elbF: -6, fingN: 0, fingF: 0, cape: 12, stole: 6, tab: 4, tuftN: 18, tuftF: 16, cap: -6, ...stand },
  ];
  // A plain bonk: the book up behind her head, then down on you, shut.
  return [
    { x: -2, lift: 1, tilt: -10, head: -10, armN: 230, elbN: -30, book: aim(-150, -130, -30, -10), armF: 120, elbF: -40, fingN: 0, fingF: 0, cape: 4, stole: 6, tab: 4, tuftN: 12, tuftF: 10, cap: -4, ...stand },
    { x: 6, lift: -1, tilt: 16, head: 12, armN: 400, elbN: -16, book: aim(70, 40, -16, 16), armF: 70, elbF: -20, fingN: 6, fingF: 0, cape: 22, stole: -10, tab: -8, tuftN: -16, tuftF: -14, cap: 6, ...legs(STAND_T - 10, STAND_S + 10, STAND_T + 6, STAND_S) },
  ];
}
const SHUT_KINDS = new Set(['bonk', 'slam', 'mark', 'shush']);
// (The moves whose blow comes over the top: their arm ends a full turn round, so the rest pose is
// taken a turn round too until the move is over, then both wound back together.)
const OVER_KINDS = new Set(['bonk', 'slam']);

export const folioRig = sized(makeRig({
  w: 76, h: 112, soft: true, stride: 8, recover: 0.65,
  springs: {
    x: [200, 16], lift: [170, 14], tilt: [150, 12], head: [130, 10], armN: [200, 15], elbN: [210, 15], armF: [150, 12], elbF: [160, 12], book: [210, 15], fingN: [160, 10], fingF: [160, 10],
    thighN: [280, 18], thighF: [280, 18], shinN: [280, 18], shinF: [280, 18], rollN: [280, 18], rollF: [280, 18],
    cape: [70, 6.4], stole: [80, 5.6], tab: [110, 7], tuftN: [120, 6.4], tuftF: [120, 6.4], cap: [140, 9],
    tas0: [90, 6], tas1: [60, 3.6], rb0a: [60, 4.4], rb0b: [48, 3.4], rb1a: [55, 4.2], rb1b: [44, 3.2], rb2a: [58, 4.4], rb2b: [46, 3.4],
  },
  fast: ['x', 'armN', 'elbN', 'book', 'armF', 'elbF', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -120, head: -170, tuftN: 240, tuftF: 240, cape: 220, stole: 200, cap: 160 },
  turnKick: { cape: 260, stole: 220, tab: 160, tuftN: 180, tuftF: 180 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.foU = stepPhase(m, a, 'fo', FO_STRIDE * 1.25);
    const mo = a.mo ?? {};
    // Which move: a named cast picks it (and holds it through the blow that ends it); a plain
    // swing is a bonk.
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    if (m.castPose && KINDS.includes(m.castPose)) mo.foForce = m.castPose;
    else if (!active) mo.foForce = null;
    const kind = mo.foForce ?? 'bonk';
    a.foKind = kind;
    // (Casting: she takes up the move's wind-up, part way, for the whole cast.)
    const cast = m.cast && m.castPose ? clamp((a.now - m.cast.t0) / 0.45, 0, 1) : 0;
    a.foCast = cast;
    const br = Math.sin(t * 1.2);
    // Her idle, a 12 s act: reading (a page turned every 2.4 s), then looking up over her
    // spectacles, a little shush, and back to her page.
    const lu = fr(t / 12) * 12;
    const peer = hold(lu, 7.1, 7.5, 9.1, 9.5);
    const hush = hold(lu, 9.5, 9.9, 10.9, 11.3);
    const read = 1 - Math.max(peer, hush);
    const turn = lu < 7 ? hold(fr(lu / 2.4) * 2.4, 1.6, 1.75, 1.9, 2.2) : 0;
    const still = 1 - (a.walkW ?? 0);
    a.foRead = read * still;
    a.foPeer = peer * still;
    a.foHush = hush * still;
    a.foTurn = turn * still;
    a.foTurnU = lu < 7 && still > 0.9 ? clamp((fr(lu / 2.4) * 2.4 - 1.65) / 0.6, 0, 1) : 0;
    const shiftW = Math.sin(t * 0.5);
    const armR = 66 + peer * 10;
    const elbR = -74;
    const idle = {
      x: 0, lift: br * 0.35, tilt: br * 0.6 + hush * 5 - peer * 2, head: -8 * read + 4 * peer + hush * 10 + br * 1.2 - turn * 2,
      armN: armR * (1 - hush) - 60 * hush, elbN: elbR * (1 - hush) - 60 * hush, book: aim(-18 + turn * 6, armR, elbR) * (1 - hush) + aim(150, -60, -60, 5) * hush,
      armF: 116 + br * 2 - peer * 6, elbF: -26, fingN: turn * -16, fingF: 0,
      thighN: STAND_T - Math.max(0, shiftW) * 4, shinN: STAND_S + Math.max(0, shiftW) * 6, thighF: STAND_T - Math.max(0, -shiftW) * 3, shinF: STAND_S + Math.max(0, -shiftW) * 5, rollN: 0, rollF: 0,
      cape: 4 + br * 1.2, stole: br * 1.6, tab: br * 1, tuftN: br * 2 + peer * 16 - hush * 6 + hold(fr(t / 6.1) * 6.1, 2, 2.08, 2.16, 2.4) * 18, tuftF: -br * 2 + peer * 14 - hush * 6, cap: br * 1.2 - peer * 2,
    };
    // Walking: an owl's waddle. Each foot stays planted while her body passes over it (her knees
    // bend to wherever it is, so nothing slides), then lifts high, knee up, toes curled, and swings
    // forward. Her body drops as a foot lands and rises as she passes over it, rocking forward
    // onto each step; her head, as an owl's does, stays level and steady through it all; the far
    // wing swings out against her steps, the book bobs in her grip, and her tufts, cape, tabard,
    // stole, tassel and ribbons swing on a beat behind.
    const u = a.foU;
    const lead = ((mo.rig?.foV ?? 0) / (FO_STRIDE * 1.25)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, FO_STRIDE, FO_DUTY, 5);
    const [dxF, upF] = pawStep(u + lead, 0.5, FO_STRIDE, FO_DUTY, 5);
    const w2 = u * TAU * 2;
    // (Lowest as a foot lands, u = 0 and 0.5; highest passing over it.)
    const land = (1 + Math.cos(w2)) / 2;
    const wLift = 0.6 - land * 2.2;
    const wTilt = 5 + land * 3 + Math.sin(u * TAU) * 1.2;
    const [thN, shN] = legIK(dxN, LEG_DY + wLift - upN, wTilt * 0.3);
    const [thF, shF] = legIK(dxF, LEG_DY + wLift - upF, wTilt * 0.3);
    const sw = Math.sin(u * TAU);
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -wTilt * 0.5 - 2 + land * 2.4, armN: 70 + land * 5, elbN: -72 - land * 4, book: aim(-12 - land * 3, 70 + land * 5, -72 - land * 4, wTilt),
      armF: 118 + sw * 22, elbF: -24 - Math.max(0, sw) * 18, fingN: 0, fingF: sw * 10,
      thighN: thN, shinN: shN, thighF: thF, shinF: shF, rollN: upN * 3, rollF: upF * 3,
      cape: 10 + land * 5 + sw * 2, stole: 4 - sw * 6, tab: -sw * 1.6, tuftN: -6 + land * 10, tuftF: -5 + land * 9, cap: land * 3,
    };
    const [antic, strike] = moveOf(kind, t);
    let base = idle;
    if (cast > 0) {
      // (Her read/peer/hush act stops while she casts.)
      a.foRead = 0;
      a.foPeer = 0;
      a.foHush = 0;
      a.foTurn = 0;
      const k = cast * 0.7;
      base = Object.fromEntries(Object.keys(idle).map((key) => [key, idle[key] + ((antic[key] ?? idle[key]) - idle[key]) * k]));
    }
    a.foFront = kind === 'shush' && (active || cast > 0) ? true : a.foHush > 0.3 && !active && !cast;
    const st = mo.rig;
    if (OVER_KINDS.has(kind) && a.ph.since >= 0) mo.foWrap = 360;
    if (mo.foWrap && !active && !cast) {
      mo.foWrap = 0;
      if (st?.armN && st.armN.x > 200) st.armN.x -= 360;
    }
    base = { ...base, armN: base.armN + (mo.foWrap ?? 0) };
    walk.armN += mo.foWrap ?? 0;
    a.foShut = SHUT_KINDS.has(kind) && (a.ph.antic > 0.4 || a.ph.strike > 0.1 || (cast > 0.5 && kind !== 'bonk')) ? true : a.foHush > 0.5 && !active && !cast;
    return stateBlend(a, base, walk, antic, strike);
  },
  // The loose bits that hang: the tassel's cord lies on the board, the tassel itself and the
  // ribbons hang straight down whatever she does, trailing as she moves.
  follow: (S, a) => {
    const body = S.tilt * 0.5 + S.head + S.cap;
    const trail = (a.walkW ?? 0) * 10 + Math.max(0, a.ph.strike) * 18;
    const wob = (k) => Math.sin(a.t * 1.8 + k * 1.3) * 3;
    const ribTop = -S.tilt + 8 + trail;
    return {
      tas0: 14,
      tas1: 90 - (body + 14) - 90 + trail * 0.6 + wob(0),
      rb0a: ribTop + 6 + wob(1), rb0b: 4 + trail * 0.3 + wob(2), rb1a: ribTop + 2 + wob(3), rb1b: 3 + trail * 0.3 + wob(4), rb2a: ribTop - 2 + wob(5), rb2b: 2 + trail * 0.3 + wob(6),
    };
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -25 - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, -2], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [2, -39], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [9, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [9, 0] },
    { name: 'gripN', parent: 'foreN', at: () => [10.2, 0] },
    { name: 'gripF', parent: 'foreF', at: () => [10.2, 0] },
    { name: 'kneeN', parent: 'thighN', at: () => [0, 9.5] },
    { name: 'kneeF', parent: 'thighF', at: () => [0, 9.5] },
    { name: 'ankleN', parent: 'shinN', at: () => [0.4, 13] },
    { name: 'ankleF', parent: 'shinF', at: () => [0.4, 13] },
    ...foPass(false),
    ...foPass(true),
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const mo = a.mo ?? {};
    const since = a.ph.since;
    const kind = a.foKind;
    // A page turning over: the right-hand page lifts and folds over the spine to the left,
    // foreshortened as it turns (drawn in the book's own space).
    if ((a.foTurnU ?? 0) > 0 && (a.foTurnU ?? 0) < 1 && !a.foShut) {
      const u = smooth(a.foTurnU);
      const c = Math.cos(u * Math.PI);
      const lift = Math.sin(u * Math.PI) * 3;
      ctx.save();
      ctx.transform(...mat('book'));
      ctx.translate(-17, -21);
      ctx.globalAlpha = a.alpha;
      ctx.fillStyle = c > 0 ? '#fff8ec' : '#fff4e0';
      ctx.strokeStyle = '#c8b8a8';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(17, 20);
      ctx.lineTo(17 + 15 * c, 14.4 - lift);
      ctx.lineTo(17 + 13 * c, 3.6 - lift * 1.4);
      ctx.lineTo(17, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = a.alpha;
    }
    // Reading Lamp: the open book glows, then blazes held high.
    if (kind === 'lamp' && (a.foCast > 0.2 || a.ph.antic > 0.1 || (since >= 0 && since < 0.7))) {
      const on = Math.max(a.foCast * 0.6, a.ph.antic, since >= 0 && since < 0.7 ? 1 - since / 0.7 : 0);
      const [bx, by] = at2(mat('book'), 17, 10);
      const r = 20 + on * 26;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, `rgba(255,240,180,${0.6 * on * a.alpha})`);
      g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
      for (let k = 0; k < 3; k++) sparkle(ctx, a, bx + Math.sin(a.now * 3 + k * 2) * 10, by - 4 - fr(a.now * 0.8 + k / 3) * 16, 2.4 * on, a.alpha * on, '#fff3c4');
    }
    // Return Your Books: pages fly up out of the book as she flings it.
    if (kind === 'toss' && since >= 0 && since < 0.8) {
      mo.foFrom ??= at2(mat('book'), 17, 8);
      const [x0, y0] = mo.foFrom;
      for (let k = 0; k < 5; k++) {
        const u = clamp(since / 0.8 - k * 0.06, 0, 1);
        if (u <= 0) continue;
        ctx.save();
        ctx.translate(x0 + (k - 2) * 10 * u + Math.sin(u * 6 + k) * 4, y0 - u * 70 + u * u * 20);
        ctx.rotate(u * 5 + k);
        ctx.globalAlpha = a.alpha * (1 - u * u);
        ctx.fillStyle = '#d8c8b0';
        ctx.fillRect(-3.6, -4.6, 7.2, 9.2);
        ctx.fillStyle = '#fffaf0';
        ctx.fillRect(-3.2, -4.2, 6.4, 8.4);
        ctx.fillStyle = '#9a8ab8';
        for (let l = 0; l < 3; l++) ctx.fillRect(-2.2, -2.2 + l * 2, l === 2 ? 2.6 : 4.2, 0.6);
        ctx.restore();
      }
      ctx.globalAlpha = a.alpha;
    } else mo.foFrom = null;
    // Bookmark: a red ribbon trailing the book's swing, lingering a moment.
    if (kind === 'mark' && (a.ph.antic > 0.5 || (since >= 0 && since < 0.7))) {
      const trail = (mo.foTrail ??= []);
      const [tx, ty] = at2(mat('book'), 30, 4);
      const [cx0] = at2(mat('chest'), 0, 0);
      if (since >= 0 && since < 0.25 && tx > cx0 + 4) trail.push([tx, ty]);
      if (a.ph.antic > 0.5 && since < 0) trail.length = 0;
      const fade = since < 0.25 ? 1 : 1 - (since - 0.25) / 0.45;
      if (trail.length > 1 && fade > 0) {
        ctx.lineCap = 'round';
        for (const [wd, col] of [[5, '#8a2a3a'], [3, '#e04a5a']]) {
          ctx.globalAlpha = a.alpha * fade;
          ctx.strokeStyle = col;
          ctx.lineWidth = wd;
          ctx.beginPath();
          trail.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.stroke();
        }
        ctx.globalAlpha = a.alpha;
      }
    } else if (mo.foTrail) mo.foTrail = null;
    // Overdue Notice / a bonk: a puff and a scatter of stars where the book lands.
    if ((kind === 'slam' || kind === 'bonk') && a.ph.strike > 0.3) {
      const [bx, by] = at2(mat('book'), 26, 4);
      puff(ctx, a, bx, by, 7 * a.ph.strike, a.alpha * a.ph.strike * 0.5);
      if (kind === 'slam') for (let k = 0; k < 5; k++) sparkle(ctx, a, bx + Math.cos(k * 1.3) * (8 + a.ph.strike * 12), by + Math.sin(k * 1.3) * 6 - a.ph.strike * 6, 2.4 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#ffd36b');
    }
    // Shhh!: little rings of hush leaving her feather.
    if (kind === 'shush' && (a.ph.strike > 0.1 || a.foCast > 0.5)) {
      const [hx, hy] = at2(mat('handN'), 6, 6);
      for (let k = 0; k < 2; k++) {
        const u = fr(a.now * 1.4 + k / 2);
        ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
        ctx.strokeStyle = '#e8dcff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(hx + 6 + u * 16, hy, 3 + u * 8, 4 + u * 10, 0, -0.9, 0.9);
        ctx.stroke();
      }
      ctx.globalAlpha = a.alpha;
    }
    // Group Study: a twinkle at the tip of her raised wing.
    if (kind === 'study' && (a.ph.strike > 0.2 || a.ph.antic > 0.4)) {
      const [px, py] = at2(mat('handF'), 9, 7);
      sparkle(ctx, a, px, py, 3.6 * Math.max(a.ph.strike, a.ph.antic * 0.6), a.alpha, '#fff3c4');
    }
  },
}), 1.25);

// The still (portraits, the monster book): her reading pose, assembled from the same parts.
export function folioStill(pose, f, mood) {
  const fm = FO_FACES[mood] || MOODS.has(mood) ? mood : 'idle';
  const hip = [0, -25];
  const ch = [0, -27];
  const nk = [2, -66];
  const legAt = (far) => {
    const x = far ? -6 : 6;
    const tr = STAND_T * D2R;
    const kx = x - Math.sin(tr) * 9.5;
    const ky = hip[1] + Math.cos(tr) * 9.5;
    const sr = (STAND_T + STAND_S) * D2R;
    const ax = kx - Math.sin(sr) * 13 + Math.cos(sr) * 0.4;
    const ay = ky + Math.cos(sr) * 13 + Math.sin(sr) * 0.4;
    return [
      ...put(foFoot(far)(), [6, 2], ax, ay, 0),
      ...put(foShin(far)(), [8, 1], kx, ky, STAND_T + STAND_S),
      ...put(foThigh(far)(), [9, 2], x, hip[1], STAND_T),
    ];
  };
  const arm = (far, armA, elbA) => {
    const [sx, sy] = far ? [-8, ch[1] - 27] : [11, ch[1] - 27];
    const ex = sx + Math.cos(armA * D2R) * 9;
    const ey = sy + Math.sin(armA * D2R) * 9;
    const fa = armA + elbA;
    const gx = ex + Math.cos(fa * D2R) * 10.2;
    const gy = ey + Math.sin(fa * D2R) * 10.2;
    return { up: put(foUpper(far)(), [2, 5], sx, sy, armA), fore: put(foFore(far)(), [2, 4], ex, ey, fa), hand: put(foHand(far)(), [2, 7], gx, gy, fa), grip: [gx, gy], fa };
  };
  const wn = arm(false, 66, -74);
  const wf = arm(true, 116, -26);
  return { w: 76, h: 112, res: 2, shapes: shift([
    ...RIB_AT.flatMap(([x, y], k) => [...put(foRibA(RIBONS_C(k))(), [3, 1], x, ch[1] + y, 14), ...put(foRibB(RIBONS_C(k))(), [3, 1], x - Math.sin(14 * D2R) * 9.4, ch[1] + y + Math.cos(14 * D2R) * 9.4, 18)]),
    ...put(foHood(), [13, 2], -9, ch[1] - 38.6, 0),
    ...wf.up, ...wf.fore, ...wf.hand,
    ...put(foTuft(true)(), [6, 15], nk[0] - 12, nk[1] - 28, -38),
    ...legAt(true),
    ...put(foBody(), [17, 41], ch[0], ch[1]),
    ...legAt(false),
    ...put(foTabard(), [14, 1], 1, ch[1] - 25), ...put(foStole(), [4, 1], 2.4, ch[1] - 21),
    ...wn.up,
    ...put(foCape(), [20, 1], 2, ch[1] - 40),
    ...put(foTuft(false)(), [6, 15], nk[0] + 10, nk[1] - 30, 32),
    ...put(foHead(), [23, 38], nk[0], nk[1]), ...put(foFaceShapes(fm === 'idle' ? 'read' : fm), [23, 38], nk[0], nk[1]),
    ...put(foCap(), [19, 15], nk[0] + 1, nk[1] - 31), ...put(foCord(), [1, 2.5], nk[0] + 1, nk[1] - 38.6, 14), ...put(foTassel(), [4, 1], nk[0] + 1 + Math.cos(14 * D2R) * 11.4, nk[1] - 38.6 + Math.sin(14 * D2R) * 11.4, 0),
    ...wn.fore,
    ...put(foBookOpen(), [17, 21], wn.grip[0], wn.grip[1], -18),
    ...wn.hand,
  ], 38, 111) };
}
const RIBONS_C = (k) => RIBBONS[k];
