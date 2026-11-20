// The Star Observatory's keepers, remade for Chapter 7 (2026-11-18): upright, chibi, rigged on
// rig.js, outer outline only, faces bare, everything that grows out of them rooted in them.
//
//   folio        Folio, the Archivist: her own module now (foliorig.js, redrawn 2026-11-18).
//   eclipsesol / eclipseluna   the Eclipse Twins: their own module now (twinsrig.js, 2026-11-18).

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { D2R, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, sparkle, puff, ownFace } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const STARC = '#fff3a6';
const star5 = (x, y, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
// A boss drawn a size up, evenly (nothing stretched), about her feet.
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

// =====================================================================================
// Astraea, the Star Keeper (remade 2026-11-18 for Chapter 7; the thin-legged stag is gone, and
// her bell gown went the same day for legs and a cape: the gown bosses all looked alike)
// =====================================================================================
// An upright moon-fawn who has counted the stars alone for a thousand years: a round lilac fawn
// face, soft ears, antlers of linked stars like two little constellations, a short two-layer
// tunic (a cream petal hem peeping under the night blue), sturdy fawn legs in cream fluff cuffs
// and gold-banded hooves, a white puff of a tail, and a long night cape from her shoulders in three
// pieces that trail one after another, its constellation lining showing as it flares, two star
// charms swinging from its corners. She counts with a gold star-pointer, tapping star after star
// overhead; she walks with a little prance; she rears with the near hoof up and the pointer high,
// and stamps down a starburst. Rearranging the sky (m.mech.arranging) she floats, legs dangling,
// sweeping the pointer in great arcs, the cape streaming; starstruck by a constellation she has
// never seen (m.mech.struck) she kneels, hands clasped, looking up. Stars orbit her all the while.
const FAWN = ramp('#d6cff6', { step: 8, turn: 10, lift: 3 });
const NIGHT = ramp('#2e3180', { step: 10, turn: 8, lift: 16 });
const LINING = ramp('#4a52c4', { step: 8, turn: 8, lift: 10 });
const LINE = '#8a92ee';
const as = pairOf('as');
// A little constellation: thin lines joining star dots (in box space).
const constel = (pts, joins, lc = LINE, sc = STARC, r = 1.3) => [...joins.map(([i, j]) => F(taper([pts[i], pts[j]], 0.5, 0.5, lc))), ...pts.map(([x, y], k) => F(k % 2 ? E(x, y, r * 0.7, r * 0.7, '#ffffff') : star5(x, y, r * 1.4, sc)))];
// The bodice: night blue, a cream ruff of fawn fluff at the collar, a gold star brooch. Box 24 x 22;
// the waist at (12, 21).
const asChest = () => [
  T([[4, 6], [20, 6], [18, 21], [6, 21]], NIGHT.base), F(T([[4, 6], [7, 6], [8, 21], [6, 21]], NIGHT.hi)),
  ...[3, 7.5, 12, 16.5, 21].map((x, k) => E(x, 5 + (k % 2) * 1.2, 3.6, 3, '#fff6ee')), F(E(9, 3.6, 3, 1.4, '#ffffff')),
  F(star5(12, 12, 3, GOLD.base)), F(E(12, 12, 1, 1, '#fff8d8')),
];
// Rounds a closed outline (corner cutting).
const asSmooth = (pts, n = 3) => {
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
const asBlob = (pts, c) => T(asSmooth(pts), c);
// The head (2026-11-18, the player's pick of the redrawn deer heads: the round fawn): a round
// crown with a short soft snout reaching forward, a shiny dark nose at its tip, a cream muzzle, a
// white chin tuft, white rings round her eyes, a darker brow, white fawn spots on her crown, a
// fluffy tuft at the jaw. Box 38 x 30 (the snout reaches past the crown); the neck at (17, 27).
const asHead = () => [
  // (The two little furry bumps the antlers grow out of.)
  E(10, 5.4, 3.2, 2.8, FAWN.base), E(22.4, 4.8, 3.4, 3, FAWN.base),
  E(15.6, 14.4, 12.6, 11.6, FAWN.base),
  asBlob([[19, 13], [25, 14.4], [30.4, 17.6], [32.4, 20.4], [31.4, 23.6], [27.6, 25.4], [22, 26.8], [15, 27.4], [9.6, 24.6], [6, 20], [10, 18], [15, 17]], FAWN.base),
  asBlob([[6.4, 19.4], [2.6, 23], [6.4, 22.6], [5.2, 26], [9.6, 23.4]], FAWN.base),
  crescent(15.6, 14.4, 12.6, 11.6, FAWN.sh, { k: 0.14, a0: 110, a1: 200 }),
  F(asBlob([[12, 4.4], [19, 3.6], [23.4, 6.6], [20, 9.6], [14, 9.6], [10.6, 7.6]], '#b8acec')),
  ...[[7.4, 9.6, 1.3, 1], [10.2, 6.6, 1.1, 0.85], [5.6, 13.4, 1, 0.8], [12.4, 4.6, 0.8, 0.6]].map(([x, y, rx, ry]) => F(E(x, y, rx, ry, '#ffffff'))),
  F(E(11.4, 7.2, 3.6, 1.6, FAWN.hi)),
  F(asBlob([[20.4, 17.4], [26, 17.4], [30.6, 19], [31.4, 22.4], [28.6, 24.8], [23, 25.6], [19.2, 23.4]], '#fff3ea')),
  F(asBlob([[17.6, 25], [22.6, 25.8], [21.4, 28.2], [17.4, 28.4], [15.6, 26.8]], '#ffffff')),
  // (White rings round her eyes, as a deer's: her faces draw the eyes in them.)
  F(E(23.3, 15.8, 4.2, 4.8, '#fff6fa')), F(E(12.3, 15.8, 3.9, 4.5, '#fff6fa')),
  E(30.8, 19.8, 2.8, 2, '#3a2a4a'), F(E(29.8, 19.1, 0.9, 0.5, '#ffffff')), F(E(31.6, 20.6, 0.5, 0.35, '#1a0f22')),
  ...stroke([[30.4, 21.6], [29.2, 22.8]], 0.5, '#2e1c26').map(F),
];
// An ear: a big deer's ear, a long leaf from its base at (1, 5.5) along +x, lilac-pink inside with
// a cream tuft, a dark rim at the tip. Box 21 x 11.
const asEar = (far) => () => {
  const len = 19;
  const wid = 9;
  const at = (pts) => pts.map(([x, y]) => [x + 1, y + 5.5]);
  const leaf = [[0, -wid * 0.35], [len * 0.35, -wid * 0.55], [len * 0.8, -wid * 0.32], [len, 0], [len * 0.8, wid * 0.32], [len * 0.35, wid * 0.5], [0, wid * 0.3]];
  return [
    asBlob(at(leaf), far ? FAWN.sh : FAWN.base),
    F(asBlob(at([[len * 0.8, -wid * 0.3], [len, 0], [len * 0.8, wid * 0.3], [len * 0.88, 0]]), '#7a68b8')),
    F(asBlob(at(leaf.map(([x, y]) => [x * 0.86 + len * 0.06, y * 0.58])), far ? '#d8a8d8' : '#f4c4e4')),
    F(asBlob(at([[len * 0.1, -wid * 0.1], [len * 0.42, -wid * 0.18], [len * 0.36, wid * 0.06], [len * 0.08, wid * 0.12]]), '#fff3ea')),
  ];
};
// An antler: a little constellation of linked stars growing from its base at (4, 23). Box 20 x 24.
const asAntler = (far) => () => {
  const lc = far ? '#c8a858' : GOLD.base;
  const sc = far ? '#d8d4ff' : '#fff8d8';
  const beam = [[4, 23], [5, 15], [3, 8], [6, 1.6]];
  return [
    ...stroke(beam, 1.4, lc), ...stroke([[5, 15], [11, 11], [15, 12]], 1.2, lc), ...stroke([[3.6, 9], [10, 4.4]], 1.1, lc),
    star5(6, 1.8, 2.8, sc), star5(15, 12, 2.4, sc), star5(10, 4.4, 2.2, sc), F(E(5, 15, 1.2, 1.2, '#ffffff')), F(E(3.6, 9, 1, 1, '#ffffff')),
  ];
};
// An arm, in two pieces so it can bend: the upper arm (a soft puffed sleeve, box 11 x 8, from the
// shoulder at (2, 4) to the elbow at (9, 4)) and the forearm (the sleeve flaring to a gold cuff, a
// cream hand; box 14 x 8 from the elbow at (1.5, 4); the hand at (10.8, 4)).
const asUpper = (far) => () => [E(3.2, 4, 3.2, 3.4, far ? NIGHT.sh : NIGHT.base), taper([[2, 4], [9, 4]], 4, 3.4, far ? NIGHT.sh : NIGHT.base), ...(far ? [] : [F(E(2.6, 2.6, 1.6, 1, NIGHT.hi))])];
const asFore = (far) => () => [taper([[1.5, 4], [8.4, 4]], 3.2, 4.6, far ? NIGHT.sh : NIGHT.base), R(8, 1.4, 1.6, 5.2, far ? GOLD.sh : GOLD.base), E(10.8, 4, 2.4, 2.3, far ? '#e8dcf0' : '#fff6ee')];
// The neck: lilac fur, rising out of the ruff into the head. Box 8 x 11; from its foot at (4, 10).
const asNeck = () => [taper([[4, 10], [4.2, 1.6]], 6.2, 5.4, FAWN.base), F(taper([[2.6, 9], [2.8, 3]], 1.2, 1, FAWN.hi))];
// The star-pointer: a slim gold rod tipped with a star. Box 12 x 52; held at (6, 40).
const asPointer = () => [R(5.2, 7, 1.6, 44, GOLD.base), F(R(5.2, 7, 0.6, 44, GOLD.hi)), E(6, 40, 1.8, 1.6, GOLD.sh), star5(6, 5.6, 5.4, STARC), F(star5(6, 5.8, 2.6, '#ffffff'))];
// The tunic, outer layer: night blue, a gold band and two stars, a soft petal hem, short enough to
// show her legs. Box 28 x 14; the waist at (14, 1).
const asTunic = () => {
  const hem = [];
  for (let k = 0; k <= 6; k++) hem.push([2 + k * 4, 11 + (k % 2 ? 1.8 : 0)]);
  return [T([[7, 1], [21, 1], [26, 11], ...hem.slice().reverse(), [2, 11]], NIGHT.base), F(T([[7, 1], [10, 1], [5, 11], [2.4, 11]], NIGHT.hi)), R(2.6, 8.6, 23, 1.8, GOLD.base), F(R(2.6, 8.6, 23, 0.6, GOLD.hi)), F(star5(9, 5.4, 1.4, STARC)), F(star5(19, 6, 1.2, '#ffffff')), R(6, 0, 16, 2.4, GOLD.sh)];
};
// The tunic's under layer: cream petals peeping below the hem. Box 30 x 16; the waist at (15, 1).
const asPetals = () => {
  const out = [T([[8, 1], [22, 1], [27, 10], [3, 10]], '#fff6ee')];
  for (let k = 0; k < 7; k++) out.push(E(3.4 + k * 3.87, 11.4, 2.4, 2.8, k % 2 ? '#f4ecf8' : '#fff6ee'));
  return out;
};
// A thigh: chunky lilac fur, from the hip at (5, 1) to the knee at (5, 11). Box 10 x 13.
const asThigh = (far) => () => [taper([[5, 1.4], [5, 10.6]], 9.4, 8.2, far ? FAWN.sh : FAWN.base), F(E(3.4, 4, 1.6, 3, far ? FAWN.base : FAWN.hi))];
// A shin: from the knee at (5, 1) to a fluffy cream cuff and a gold-banded hoof. Box 11 x 15.
const asShin = (far) => () => [taper([[5, 1.4], [5, 9]], 8.2, 7, far ? FAWN.sh : FAWN.base), E(5, 9.6, 4.8, 2.8, far ? '#e8dcf0' : '#fff6ee'), E(5.6, 12.4, 4.2, 2.4, far ? '#3a2e66' : '#4e4086'), F(R(1.6, 11.4, 8, 0.9, far ? GOLD.sh : GOLD.base)), F(E(4.4, 12.6, 1.4, 0.6, '#8a7ac8'))];
// The cape, in three pieces hung one from the next, each from the middle of its top edge; outside
// night blue with a gold edge, and a lining (drawn over it, fading in as that piece flares up).
// Top: box 22 x 16 from (11, 1). Middle: box 26 x 10 from (13, 1). Hem: box 30 x 13 from (15, 1),
// a point at each corner for a charm.
const capeA = (lin) => () => [T([[5, 1], [17, 1], [21, 15], [1, 15]], lin ? LINING.base : NIGHT.base), ...(lin ? constel([[6, 6], [11, 10], [16, 7]], [[0, 1], [1, 2]], '#c8ccff') : [F(T([[5, 1], [8, 1], [4, 15], [1, 15]], NIGHT.hi))])];
const capeB = (lin) => () => [T([[2, 1], [24, 1], [25.6, 9], [0.4, 9]], lin ? LINING.base : NIGHT.base), ...(lin ? constel([[5, 3.4], [12, 6.6], [20, 4], [16, 7.6]], [[0, 1], [1, 2], [1, 3]], '#c8ccff') : [F(T([[2, 1], [5, 1], [3.8, 9], [0.4, 9]], NIGHT.hi))])];
const capeC = (lin) => () => {
  const c = lin ? LINING.base : NIGHT.base;
  return [T([[1.4, 1], [28.6, 1], [29.6, 11], [22, 8.6], [15, 10.6], [8, 8.6], [0.4, 11]], c), ...(lin ? constel([[7, 4], [15, 6], [23, 4]], [[0, 1], [1, 2]], '#c8ccff') : []), ...stroke([[0.4, 11], [8, 8.6], [15, 10.6], [22, 8.6], [29.6, 11]], 0.9, lin ? '#c8ccff' : GOLD.base)];
};
// A star charm on a thread, hung from (3.5, 0.6). Box 7 x 12.
const asCharm = () => [...stroke([[3.5, 0.6], [3.5, 6]], 0.5, GOLD.sh), star5(3.5, 8.4, 3, STARC), F(star5(3.5, 8.6, 1.4, '#ffffff'))];
// The puff of a tail. Box 8 x 8, from its root (6, 4).
const asPuff = () => [E(4, 4, 3.6, 3.4, '#ffffff'), F(E(3, 3, 1.4, 1, '#ffffff'))];
const AS = {
  CHEST: as('chest', 24, 22, asChest, 2), HEAD: as('head', 38, 30, asHead, 2), PTR: as('ptr', 12, 52, asPointer, 2),
  TUNIC: as('tunic', 28, 14, asTunic, 2), PETALS: as('petals', 30, 16, asPetals, 2), PUFF: as('puff', 8, 8, asPuff, 2), CHARM: as('charm', 7, 12, asCharm, 2),
  EAR: [false, true].map((f) => as(`ear${f ? 1 : 0}`, 21, 11, asEar(f), 2)), ANT: [false, true].map((f) => as(`ant${f ? 1 : 0}`, 20, 24, asAntler(f), 2)),
  UP: [false, true].map((f) => as(`up${f ? 1 : 0}`, 11, 8, asUpper(f), 2)), FORE: [false, true].map((f) => as(`fore${f ? 1 : 0}`, 14, 8, asFore(f), 2)), NECK: as('neck', 8, 11, asNeck, 2),
  THIGH: [false, true].map((f) => as(`thigh${f ? 1 : 0}`, 10, 13, asThigh(f), 2)), SHIN: [false, true].map((f) => as(`shin${f ? 1 : 0}`, 11, 15, asShin(f), 2)),
  CAPE: [[capeA, 22, 16], [capeB, 26, 10], [capeC, 30, 13]].map(([fn, w, h], k) => [false, true].map((lin) => as(`cape${k}${lin ? 'l' : ''}`, w, h, fn(lin), 2))),
};
// Her own faces (2026-11-18: every boss shared one set). Soft lilac brows carry the feeling; eyes
// gold with star catchlights; only a light blush. Box 34 x 30, eyes at (23, 15.6) and (12.6, 15.6).
const AS_INK = '#2e1c26';
const AS_BROW = '#7a68c0';
const AS_LIP = '#7a3040';
const AS_TEAR = '#6ec4ff';
const asStar4 = (x, y, r, c) => T([[x, y - r], [x + r * 0.28, y - r * 0.28], [x + r, y], [x + r * 0.28, y + r * 0.28], [x, y + r], [x - r * 0.28, y + r * 0.28], [x - r, y], [x - r * 0.28, y - r * 0.28]], c);
const asBrow = (a, b, w, c = AS_BROW) => F(taper([a, b], w, w * 0.55, c));
const asLine = (pts, w, c = AS_INK) => stroke(pts, w, c).map(F);
const asEye = (x, y, w, h, { look = 0, cat = 'star' } = {}) => {
  const out = [E(x, y, w, h, AS_INK), E(x, y + h * 0.3 + look, w * 0.74, h * 0.5, '#ffc83a')];
  if (cat === 'big') out.push(F(asStar4(x + w * 0.25, y - h * 0.35, w * 0.8, '#ffffff')), F(asStar4(x - w * 0.4, y + h * 0.3, w * 0.42, '#ffffff')));
  else out.push(F(asStar4(x + w * 0.28, y - h * 0.4 + look * 0.3, w * 0.62, '#ffffff')), F(E(x - w * 0.36, y + h * 0.42, w * 0.18, w * 0.18, '#ffffff')));
  return out;
};
const asShut = (x, y, w, up = false) => asLine(arcP(x, y, w * 1.05, w * 0.55, up ? 200 : 20, up ? 340 : 160, 7), 0.75);
const asBlush = (k = 1) => [F(E(8.8, 20.8, 1.7 * k, 0.9 * k, '#ffb0c4')), F(E(25.6, 21, 1.5 * k, 0.8 * k, '#ffb0c4'))];
const AS_FACES = {
  // Calm: looking ahead, the faintest worry in her brows.
  idle: () => [...asEye(23, 15.6, 2.7, 3.5), ...asEye(12.6, 15.6, 2.4, 3.2), asBrow([19.8, 10], [26.2, 10.6], 1.1), asBrow([15.6, 10.2], [9.6, 10.8], 1), ...asLine(arcP(28, 23, 1.8, 1.1, 20, 150, 7), 0.55), ...asBlush()],
  blink: () => [...asShut(23, 16.4, 2.6), ...asShut(12.6, 16.4, 2.3), asBrow([19.8, 10.2], [26.2, 10.8], 1.1), asBrow([15.6, 10.4], [9.6, 11], 1), ...asLine(arcP(28, 23, 1.8, 1.1, 20, 150, 7), 0.55), ...asBlush()],
  // Counting: eyes up at the stars, worried brows, her lips whispering the numbers (two shapes).
  count: () => [...asEye(23, 15.6, 2.7, 3.5, { look: -1.6 }), ...asEye(12.6, 15.6, 2.4, 3.2, { look: -1.6 }), asBrow([19.8, 9.6], [26.2, 10.8], 1.2), asBrow([15.6, 9.8], [9.6, 11], 1.1), F(E(27.8, 23.6, 1, 1.2, AS_LIP)), ...asBlush()],
  count2: () => [...asEye(23, 15.6, 2.7, 3.5, { look: -1.6 }), ...asEye(12.6, 15.6, 2.4, 3.2, { look: -1.6 }), asBrow([19.8, 9.6], [26.2, 10.8], 1.2), asBrow([15.6, 9.8], [9.6, 11], 1.1), ...asLine([[26.8, 23.4], [28.8, 23.4]], 0.6), ...asBlush()],
  // Lost count: eyes down and away, brows knotted, a small unhappy mouth.
  lost: () => [...asEye(23, 16.2, 2.7, 3.2, { look: 1.2 }), ...asEye(12.6, 16.2, 2.4, 2.9, { look: 1.2 }), asBrow([19.6, 9.2], [26.4, 11.6], 1.3), asBrow([15.8, 9.4], [9.4, 11.8], 1.2), ...asLine(arcP(28, 24.4, 1.6, 0.9, 200, 340, 6), 0.6), ...asBlush(0.8)],
  sad: () => [...asEye(23, 16, 2.7, 3.3, { look: 0.8 }), ...asEye(12.6, 16, 2.4, 3, { look: 0.8 }), asBrow([19.6, 9.4], [26.4, 11.4], 1.2), asBrow([15.8, 9.6], [9.4, 11.6], 1.1), ...asLine(arcP(28, 24.2, 1.5, 0.8, 200, 340, 6), 0.6), ...asBlush(0.8)],
  // Fierce, and frightened under it: a hard frown, a tear she won't let fall.
  angry: () => [...asEye(23, 16.6, 2.7, 2.6, { cat: 'dot' }), ...asEye(12.6, 16.6, 2.4, 2.4, { cat: 'dot' }), asBrow([19.6, 12.6], [26.6, 9.4], 1.6, AS_INK), asBrow([16, 12.8], [9.4, 10], 1.4, AS_INK), E(26.4, 19.6, 1.2, 1.7, AS_TEAR), F(E(26.1, 19, 0.4, 0.5, '#ffffff')), ...asLine([[25.8, 24], [27, 23.4], [28.2, 24], [29.4, 23.4]], 0.6), ...asBlush(0.8)],
  // Calling to the sky: brows high, a round open mouth.
  shout: () => [...asEye(23, 15.6, 2.8, 3.6, { look: -0.6, cat: 'dot' }), ...asEye(12.6, 15.6, 2.5, 3.3, { look: -0.6, cat: 'dot' }), asBrow([19.8, 9], [26.4, 8.4], 1.3), asBrow([15.6, 9.2], [9.4, 8.6], 1.2), E(27.6, 24.4, 1.8, 2.2, AS_LIP), F(E(27.6, 25.4, 1.1, 0.7, '#ff9ab0')), ...asBlush(0.8)],
  // Hurt: squeezed shut, tears falling as little blue stars.
  hurt: () => [...asShut(23, 16.4, 2.6), ...asShut(12.6, 16.4, 2.3), asBrow([19.6, 9.4], [26.4, 11.4], 1.2), asBrow([15.8, 9.4], [9.4, 11.6], 1.1), asStar4(27.2, 20.4, 2.2, AS_TEAR), asStar4(25.4, 25.8, 1.6, AS_TEAR), asStar4(8.6, 20.8, 1.9, AS_TEAR), F(E(27.8, 24, 1.4, 1, AS_LIP))],
  // Awestruck: eyes wide and full of stars, a gasp of a smile.
  happy: () => [...asEye(23, 15.2, 3, 3.9, { cat: 'big' }), ...asEye(12.6, 15.2, 2.7, 3.6, { cat: 'big' }), ...asLine(arcP(23, 10.4, 3, 1.6, 200, 340, 6), 0.9, AS_BROW), ...asLine(arcP(12.6, 10.6, 2.6, 1.4, 200, 340, 6), 0.8, AS_BROW), T(arcP(27.8, 23, 2.2, 2.2, 0, 180, 8), AS_LIP), F(E(27.8, 24.4, 1.1, 0.7, '#ff9ab0')), ...asBlush(1.15)],
  sleep: () => [...asShut(23, 16.4, 2.6), ...asShut(12.6, 16.4, 2.3), asBrow([19.8, 10.6], [26.2, 10.8], 1), asBrow([15.6, 10.8], [9.6, 11], 0.9), F(E(27.8, 23.6, 0.7, 0.6, AS_LIP)), ...asBlush()],
};
const asFaceShapes = (mood) => ownFace(AS_FACES, mood);
const asFace = (mood) => sm(`as|face3|${mood}`, 38, 30, () => asFaceShapes(mood));
// Which face: the attack's (fierce in the wind-up, calling out on the blow), then the scene's own
// ('sad', 'happy', ...), then what she's doing: counting (whispering), losing count, starstruck.
const asMood = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3) return 'angry';
  if (a.asStruck) return 'happy';
  if (a.face && a.face !== 'idle') return AS_FACES[a.face] || MOODS.has(a.face) ? a.face : 'idle';
  const t = a.t + (a.uidOff ?? 0);
  if (t % 4.7 < 0.14) return 'blink';
  if (a.asLost > 0.5) return 'lost';
  if (a.asArr || a.asCount > 0.5) return fr(t * 2.4) < 0.5 ? 'count' : 'count2';
  return 'idle';
};
// How far a cape piece has flared (0 hanging, 1 streaming out): its lining shows that much.
const flareOf = (deg) => clamp((deg - 28) / 30, 0, 1);
const CAPE_KEYS = ['capeA', 'capeB', 'capeC'];
const asPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => [
    { name: `thigh${k}${tag}`, parent: 'hip', s: AS.THIGH[far ? 1 : 0][i], pivot: [5, 1], at: () => [far ? -3.6 : 3.6, 5], rot: (S) => (far ? S.thighF : S.thighN) * D2R },
    { name: `shin${k}${tag}`, parent: `knee${k}`, s: AS.SHIN[far ? 1 : 0][i], pivot: [5, 1], rot: (S) => (far ? S.shinF : S.shinN) * D2R },
  ];
  const cape = (k, parent, pivot, at) => [
    { name: `cape${k}${tag}`, parent, s: AS.CAPE[k][0][i], pivot, at, rot: (S) => S[CAPE_KEYS[k]] * D2R },
    { name: `capel${k}${tag}`, parent: `cape${k}`, s: AS.CAPE[k][1][i], pivot, alpha: (S) => flareOf(S.capeA + (k > 0 ? S.capeB : 0) + (k > 1 ? S.capeC : 0)) },
  ];
  return [
    { name: `antF${tag}`, parent: 'nk', s: AS.ANT[1][i], pivot: [4, 23], at: () => [-7, -21], rot: (S) => (-14 + S.antl) * D2R },
    { name: `earF${tag}`, parent: 'nk', s: AS.EAR[1][i], pivot: [1, 5.5], at: () => [-10, -19.6], rot: (S) => (208 - S.earF) * D2R },
    // The cape: from the nape, behind everything.
    ...cape(0, 'chest', [11, 1], () => [-2, -19]),
    ...cape(1, 'capeA', [13, 1], () => [0, 14]),
    ...cape(2, 'capeB', [15, 1], () => [0, 8]),
    { name: `charm0${tag}`, parent: 'capeC', s: AS.CHARM[i], pivot: [3.5, 0.6], at: () => [-14.6, 10], rot: (S) => S.charm0 * D2R },
    { name: `charm1${tag}`, parent: 'capeC', s: AS.CHARM[i], pivot: [3.5, 0.6], at: () => [14.6, 10], rot: (S) => S.charm1 * D2R },
    { name: `upF${tag}`, parent: 'chest', s: AS.UP[1][i], pivot: [2, 4], at: () => [-5, -15], rot: (S) => S.armF * D2R },
    { name: `foreF${tag}`, parent: 'elbowF', s: AS.FORE[1][i], pivot: [1.5, 4], rot: (S) => S.elbF * D2R },
    ...leg(1, true),
    { name: `puff${tag}`, parent: 'hip', s: AS.PUFF[i], pivot: [6, 4], at: () => [-11, 4], rot: (S) => S.puff * D2R },
    ...leg(0, false),
    { name: `petals${tag}`, parent: 'hip', s: AS.PETALS[i], pivot: [15, 1], rot: (S) => S.tunicU * D2R },
    { name: `tunic${tag}`, parent: 'hip', s: AS.TUNIC[i], pivot: [14, 1], rot: (S) => S.tunic * D2R },
    { name: `neck${tag}`, parent: 'chest', s: AS.NECK[i], pivot: [4, 10], at: () => [1, -15] },
    { name: `bodice${tag}`, parent: 'chest', s: AS.CHEST[i], pivot: [12, 21] },
    // (Both antlers grow from inside her head, out of the bumps on top: drawn behind it.)
    { name: `antN${tag}`, parent: 'nk', s: AS.ANT[0][i], pivot: [4, 23], at: () => [5.4, -22], rot: (S) => (10 + S.antl) * D2R },
    { name: `head${tag}`, parent: 'nk', s: AS.HEAD[i], pivot: [17, 27] },
    { name: `earN${tag}`, parent: 'nk', s: AS.EAR[0][i], pivot: [1, 5.5], at: () => [9, -20], rot: (S) => (-28 + S.earN) * D2R },
    { name: `upN${tag}`, parent: 'chest', s: AS.UP[0][i], pivot: [2, 4], at: () => [5, -14], rot: (S) => S.armN * D2R },
    { name: `ptr${tag}`, parent: 'handN', s: AS.PTR[i], pivot: [6, 40], rot: (S) => (90 + S.ptr) * D2R },
    { name: `foreN${tag}`, parent: 'elbowN', s: AS.FORE[0][i], pivot: [1.5, 4], rot: (S) => S.elbN * D2R },
  ];
};
// The stars in orbit round her: those behind her drawn under her, those in front over her.
const asOrbit = (front) => (ctx, m, a, S, mat) => {
  if (m.hp <= 0) return;
  const [cx, cy] = at2(mat('chest'), 0, -10);
  const n = 5;
  const sp = a.asArr ? 1.6 : 0.5;
  for (let k = 0; k < n; k++) {
    const ang = a.now * sp + (k / n) * TAU;
    const z = Math.sin(ang);
    if ((z > 0) !== front) continue;
    const r = a.asArr ? 40 : 30;
    const x = cx + Math.cos(ang) * r;
    const y = cy + z * 8 - (a.asArr ? Math.sin(ang * 2) * 10 : 0);
    sparkle(ctx, a, x, y, 2.2 + z * 0.8 + (a.asArr ? 1 : 0), a.alpha * (0.6 + z * 0.3), k % 2 ? '#ffffff' : STARC);
  }
};
// Her attacks, taken in turn: a flick of the pointer that throws a star; a great sweep that draws
// a constellation in the air; a head-down charge with her antlers blazing; rearing up and stamping
// down a starburst.
const AS_KINDS = ['flick', 'sweep', 'charge', 'stamp'];
// Her walk: one full cycle (a step with each hoof) covers AS_STRIDE rig px, which at her 1.5 size
// is AS_STRIDE * 1.5 px of floor; each hoof is down AS_DUTY of the cycle.
const AS_STRIDE = 22;
const AS_DUTY = 0.56;
// A leg's two angles (thigh from straight down, shin from the thigh; degrees) that put the hoof's
// sole `dx` ahead of and `dy` below the hip joint, the knee bending forward; `hipDeg` is the hip's
// own turn, taken off the thigh.
const AS_L1 = 9.6;
const AS_L2 = 13.6;
function asLegIK(dx, dy, hipDeg) {
  const d = Math.min(AS_L1 + AS_L2 - 0.05, Math.max(4, Math.hypot(dx, dy)));
  const hip = Math.acos(clamp((AS_L1 * AS_L1 + d * d - AS_L2 * AS_L2) / (2 * AS_L1 * d), -1, 1));
  const knee = Math.acos(clamp((AS_L1 * AS_L1 + AS_L2 * AS_L2 - d * d) / (2 * AS_L1 * AS_L2), -1, 1));
  return [(-Math.atan2(dx, dy) - hip) / D2R - hipDeg, (Math.PI - knee) / D2R];
}
// The pointer's turn (in the hand) that points it `want` degrees, given the arm's two angles.
const aim = (want, arm, elb) => want - arm - elb;
const asAttack = (kind, t) => {
  const paw = Math.sin(t * 16);
  if (kind === 'flick') return [
    { x: -2, lift: 1, tilt: -9, head: -6, armN: -110, elbN: -50, ptr: aim(-170, -110, -50), armF: 40, elbF: -40, earN: 14, earF: 12, antl: 3, thighN: -6, thighF: 8, shinN: 6, shinF: 0, tunic: 6, tunicU: 8, puff: 10, capeA: 10, capeB: 6, capeC: 4 },
    { x: 5, lift: 0, tilt: 10, head: 6, armN: 0, elbN: -8, ptr: aim(-14, 0, -8), armF: 100, elbF: -10, earN: -12, earF: -10, antl: -3, thighN: -20, thighF: 10, shinN: 12, shinF: 4, tunic: -8, tunicU: -10, puff: -10, capeA: 30, capeB: 26, capeC: 22 },
  ];
  if (kind === 'sweep') return [
    { x: -3, lift: 3, tilt: -14, head: -12, armN: -160, elbN: -10, ptr: aim(-175, -160, -10), armF: -30, elbF: -60, earN: 18, earF: 16, antl: 5, thighN: -4, thighF: 6, shinN: 0, shinF: 0, tunic: 8, tunicU: 10, puff: 14, capeA: 6, capeB: 3, capeC: 2 },
    { x: 8, lift: -1, tilt: 16, head: 10, armN: 40, elbN: 10, ptr: aim(55, 40, 10), armF: 120, elbF: 10, earN: -20, earF: -18, antl: -5, thighN: -28, thighF: 16, shinN: 18, shinF: 6, tunic: -12, tunicU: -14, puff: -16, capeA: 36, capeB: 30, capeC: 26 },
  ];
  if (kind === 'charge') return [
    { x: -6, lift: -3, tilt: 18, head: 30, armN: 90, elbN: -40, ptr: aim(150, 90, -40), armF: 110, elbF: -20, earN: -26, earF: -24, antl: 4, thighN: -14 + paw * 16, thighF: 12, shinN: 30 + paw * 20, shinF: 6, tunic: 6, tunicU: 8, puff: 18, capeA: 14, capeB: 10, capeC: 8 },
    { x: 16, lift: 1, tilt: 26, head: 36, armN: 110, elbN: -20, ptr: aim(170, 110, -20), armF: 120, elbF: -10, earN: -30, earF: -28, antl: -6, thighN: -34, thighF: 30, shinN: 10, shinF: 20, tunic: -14, tunicU: -16, puff: -18, capeA: 44, capeB: 40, capeC: 34 },
  ];
  return [
    { x: -3, lift: 8, tilt: -18, head: -14, armN: -140, elbN: -20, ptr: aim(-150, -140, -20), armF: -40, elbF: -50, earN: 22, earF: 18, antl: 6, thighN: -72, thighF: 6, shinN: 84, shinF: 4, tunic: 12, tunicU: 16, puff: 20, capeA: 2, capeB: 0, capeC: 0 },
    { x: 6, lift: -2, tilt: 12, head: 12, armN: 40, elbN: -10, ptr: aim(40, 40, -10), armF: 60, elbF: -20, earN: -24, earF: -20, antl: -6, thighN: 12, thighF: -10, shinN: 0, shinF: 8, tunic: -14, tunicU: -18, puff: -20, capeA: 34, capeB: 30, capeC: 26 },
  ];
};
export const astraeaRig = sized(makeRig({
  w: 70, h: 112, soft: true, stride: 8, recover: 0.7,
  springs: {
    x: [200, 16], lift: [150, 13], tilt: [150, 12], head: [120, 10], armN: [190, 14], elbN: [210, 15], armF: [150, 12], elbF: [160, 12], ptr: [200, 14], earN: [110, 6], earF: [110, 6], antl: [120, 7],
    thighN: [280, 18], thighF: [280, 18], shinN: [280, 18], shinF: [280, 18], tunic: [140, 8], tunicU: [100, 6], puff: [140, 6],
    capeA: [60, 6], capeB: [48, 5], capeC: [40, 4], charm0: [60, 3.2], charm1: [55, 3],
  },
  fast: ['x', 'armN', 'elbN', 'ptr', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -120, head: -160, earN: 260, earF: 260, tunic: 180, capeA: 240, capeB: 280, capeC: 320 },
  turnKick: { capeA: 320, capeB: 380, capeC: 420, tunic: 200, earN: 200, earF: 200, puff: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.asU = stepPhase(m, a, 'as', AS_STRIDE * 1.5);
    const mo = a.mo ?? {};
    // A new attack takes the next of her moves.
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    if (active && !mo.asIn) {
      mo.asIn = true;
      mo.asKind = ((mo.asKind ?? -1) + 1) % AS_KINDS.length;
      mo.asTrail = [];
    }
    // (A named cast, world/observatory.js, picks its move; it holds through the blow that ends it.)
    if (m.castPose && AS_KINDS.includes(m.castPose)) mo.asForce = m.castPose;
    if (!active) {
      mo.asIn = false;
      if (!m.castPose) mo.asForce = null;
    }
    const kind = m.asKind ?? mo.asForce ?? AS_KINDS[mo.asKind ?? 0];
    a.asKind = kind;
    const arr = m.mech?.arranging ? 1 : 0;
    const struck = m.mech?.struck && m.vulnUntil > a.now ? 1 : 0;
    a.asArr = arr;
    a.asStruck = struck;
    // Slow, calm breathing; the night wind in her cape.
    const br = Math.sin(t * 1.05);
    const wind = Math.sin(t * 1.1) * 3 + Math.sin(t * 2.3) * 1.4;
    // Her idle, a 14 s act: she counts four stars overhead, tapping each with her pointer and
    // whispering its number; then she loses count, sighs with a hand to her brow, shakes her head,
    // breathes in and starts again.
    const lu = fr(t / 14) * 14;
    const lost = hold(lu, 9.2, 9.8, 12.2, 12.9);
    const counting = 1 - lost;
    const k = Math.min(3, Math.floor(lu / 2.3));
    const want = [-62, -86, -112, -96][k];
    const tap = lu < 9.2 ? hold(fr(lu / 2.3) * 2.3, 1, 1.12, 1.24, 1.6) : 0;
    const shake = hold(lu, 10.6, 10.8, 11.6, 11.9) * Math.sin(t * 11) * 7;
    const flick = hold(fr(t / 7.3) * 7.3, 3, 3.1, 3.2, 3.5);
    const shiftW = Math.sin(t * 0.45);
    a.asCount = counting;
    a.asLost = lost;
    a.asTap = tap;
    const armC = -18;
    const elbC = want - armC + 6;
    const idle = {
      x: 0, lift: br * 0.35 - lost * 0.8, tilt: br * 0.6 - 1 + lost * 4, head: (-6 + (want + 62) * 0.22 - tap * 3) * counting + (6 + shake) * lost,
      armN: armC * counting + 64 * lost, elbN: elbC * counting - 108 * lost, ptr: (-6 - tap * 12) * counting + aim(-84, 64, -108) * lost,
      // (The far hand rests on her ruff while she counts; up to her brow when she loses count.)
      armF: 70 * counting - 30 * lost, elbF: -128 * counting - 118 * lost,
      earN: br * 3 + flick * 26 - lost * 18, earF: -br * 3 + flick * 20 - lost * 16, antl: br * 1.5,
      thighN: -1 - Math.max(0, shiftW) * 5, thighF: 1 + Math.max(0, -shiftW) * 3, shinN: Math.max(0, shiftW) * 9, shinF: Math.max(0, -shiftW) * 5,
      tunic: br * 1.2, tunicU: br * 1.6, puff: Math.sin(t * 2.6) * 8,
      capeA: 8 + wind, capeB: 4 + wind * 0.8, capeC: 3 + wind * 0.6, charm0: 0, charm1: 0,
    };
    // Walking: a graceful deer's step on planted feet. Each hoof stays put on the floor while her
    // body passes over it, then lifts and swings forward in a smooth arc; her knees bend to wherever
    // the hoof is (asLegIK), so nothing slides. The body is highest as a leg passes under it; hips,
    // head, ears, tunic, tail and cape all ride the steps a beat behind one another.
    const u = a.asU;
    // (The legs' springs trail their targets by about 0.05 s: the hooves are aimed that far ahead
    // in the stride, so on the floor they stay exactly put.)
    const lead = ((mo.rig?.asV ?? 0) / (AS_STRIDE * 1.5)) * 0.05;
    const [dxN, upN] = pawStep(u + lead, 0, AS_STRIDE, AS_DUTY, 3.4);
    const [dxF, upF] = pawStep(u + lead, 0.5, AS_STRIDE, AS_DUTY, 3.4);
    const R = (AS_STRIDE * AS_DUTY) / 2;
    const under = Math.max(upN ? 0 : 1 - (dxN / R) ** 2, upF ? 0 : 1 - (dxF / R) ** 2);
    const w2 = u * TAU * 2;
    const wLift = -1.5 + under * 1;
    const wTilt = 3 + Math.sin(w2 - 0.4) * 0.6;
    const [thN, shN] = asLegIK(dxN, 23.6 + wLift - upN, wTilt * 0.3);
    const [thF, shF] = asLegIK(dxF, 23.6 + wLift - upF, wTilt * 0.3);
    const sw = Math.sin(u * TAU);
    const walk = {
      x: 0, lift: wLift, tilt: wTilt, head: -3 + Math.sin(w2 - 1.1) * 1.4, armN: 60 + Math.sin(u * TAU - 0.5) * 4, elbN: -100, ptr: aim(-88, 60 + Math.sin(u * TAU - 0.5) * 4, -100),
      armF: 75 - Math.sin(u * TAU - 0.4) * 12, elbF: -30 - Math.max(0, Math.sin(u * TAU - 0.4)) * 16,
      earN: -6 + Math.sin(w2 - 1.6) * 5, earF: -5 + Math.sin(w2 - 1.9) * 4, antl: -2 + Math.sin(w2 - 1.3) * 1.5,
      thighN: thN, thighF: thF, shinN: shN, shinF: shF,
      tunic: -4 + sw * 3, tunicU: -6 + Math.sin(u * TAU - 0.7) * 4, puff: 8 + Math.sin(w2 - 0.8) * 12,
      capeA: 22 + Math.sin(w2 - 0.6) * 2, capeB: 18 + Math.sin(w2 - 1.5) * 4, capeC: 14 + Math.sin(w2 - 2.4) * 7, charm0: 0, charm1: 0,
    };
    const [antic, strike] = asAttack(kind, t);
    for (const o of [antic, strike]) Object.assign(o, { charm0: 0, charm1: 0 });
    let S = stateBlend(a, idle, walk, antic, strike);
    if (arr) {
      // Floating, legs dangling, the pointer sweeping great arcs, the cape streaming in her own wind.
      const s2 = Math.sin(t * 1.6);
      S = { ...S, lift: 6 + Math.sin(t * 2) * 2.4, tilt: -4 + s2 * 3, head: -16 - s2 * 4, armN: -50 + s2 * 34, elbN: -30, ptr: s2 * 30, armF: -120 + s2 * 14, elbF: -30, earN: -16, earF: -12, antl: s2 * 4,
        thighN: 10 + Math.sin(t * 2.2) * 6, thighF: -6 + Math.sin(t * 2.2 + 1.4) * 6, shinN: 22 + Math.sin(t * 2.2 - 0.6) * 8, shinF: 18 + Math.sin(t * 2.2 + 0.8) * 8, tunic: s2 * 6, tunicU: s2 * 8,
        capeA: 40 + s2 * 10, capeB: 30 + Math.sin(t * 1.6 - 0.8) * 14, capeC: 24 + Math.sin(t * 1.6 - 1.6) * 18, puff: s2 * 14 };
    }
    if (struck) {
      // Kneeling to look, both hands clasped under her chin, head tipped right back.
      S = { ...S, lift: -9, tilt: -6, head: -24 + Math.sin(t * 2) * 2, armN: 40, elbN: -150, ptr: aim(-100, 40, -150), armF: 50, elbF: -150, earN: -14 + Math.sin(t * 3) * 6, earF: -12, antl: 3,
        thighN: -46, thighF: -40, shinN: 112, shinF: 108, tunic: 4, tunicU: 6, capeA: 6 + wind, capeB: 3 + wind * 0.7, capeC: 2 + wind * 0.5, puff: Math.sin(t * 5) * 18 };
    }
    return S;
  },
  // The charms hang from the cape's corners and swing back down whatever the cape does.
  follow: (S, a) => {
    const c = S.capeA + S.capeB + S.capeC + S.tilt;
    return { charm0: -c + Math.sin(a.t * 2.1) * 6, charm1: -c + Math.sin(a.t * 2.1 + 1.3) * 6 };
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -28.6 - S.lift], rot: (S) => S.tilt * 0.3 * D2R },
    { name: 'chest', parent: 'hip', at: () => [0, 1], rot: (S) => S.tilt * 0.7 * D2R },
    { name: 'nk', parent: 'chest', at: () => [1, -21], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [7, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [7, 0] },
    { name: 'handN', parent: 'foreN', at: () => [9.3, 0] },
    { name: 'knee0', parent: 'thigh0', at: () => [0, 9.6] },
    { name: 'knee1', parent: 'thigh1', at: () => [0, 9.6] },
    { name: 'capeA', parent: 'cape0' },
    { name: 'capeB', parent: 'cape1' },
    { name: 'capeC', parent: 'cape2' },
    ...asPass(false),
    ...asPass(true),
    { name: 'face', parent: 'nk', s: (a) => asFace(asMood(a)), pivot: [17, 27] },
  ],
  under: asOrbit(false),
  fx(ctx, m, a, S, mat) {
    asOrbit(true)(ctx, m, a, S, mat);
    if (m.hp <= 0) return;
    const mo = a.mo ?? {};
    const [px, py] = at2(mat('handN'), 0, 0);
    const [sx, sy] = at2(mat('ptr'), 0, -34.4);
    const dl = Math.hypot(sx - px, sy - py) || 1;
    // The pointer's star glows, brighter on each counted star.
    const glowR = 16 + (a.asTap ?? 0) * 8;
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
    g.addColorStop(0, `rgba(255,243,166,${(0.45 + (a.asTap ?? 0) * 0.3) * a.alpha})`);
    g.addColorStop(1, 'rgba(255,243,166,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - glowR, sy - glowR, glowR * 2, glowR * 2);
    if ((a.asTap ?? 0) > 0.3) sparkle(ctx, a, sx + 2, sy - 4, 3.4 * a.asTap, a.alpha * a.asTap, '#ffffff');
    if (a.asArr) for (let k = 0; k < 3; k++) {
      const u = fr(a.now * 1.8 + k / 3);
      sparkle(ctx, a, sx - ((sx - px) / dl) * u * 16 + Math.sin(u * 7 + k) * 3, sy - ((sy - py) / dl) * u * 16 + u * 6, 2.4 * (1 - u) + 0.4, a.alpha * (1 - u), k % 2 ? '#ffffff' : STARC);
    }
    const since = a.ph.since;
    const kind = a.asKind;
    // Star Flick: a star leaves the pointer's tip and flies on ahead.
    if (kind === 'flick' && since >= 0 && since < 0.5) {
      mo.asFrom ??= [sx, sy];
      const [fx0, fy0] = mo.asFrom;
      const u = since / 0.5;
      const x = fx0 + u * 120;
      const y = fy0 + u * u * 18;
      for (let k = 3; k >= 0; k--) sparkle(ctx, a, x - k * 9, y - k * 1.2, (5 - k) * (1 - u * 0.6), a.alpha * (1 - k * 0.2) * (1 - u * 0.5), k ? STARC : '#ffffff');
    } else mo.asFrom = null;
    // Constellation Sweep: the pointer's path drawn as linked stars, lingering, then fading.
    if (kind === 'sweep' && since >= 0 && since < 1.1) {
      const trail = (mo.asTrail ??= []);
      if (since < 0.3 && (!trail.length || Math.hypot(trail.at(-1)[0] - sx, trail.at(-1)[1] - sy) > 9)) trail.push([sx, sy]);
      const fade = since < 0.4 ? 1 : 1 - (since - 0.4) / 0.7;
      ctx.globalAlpha = a.alpha * fade * 0.8;
      ctx.strokeStyle = '#c8ccff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      trail.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.globalAlpha = a.alpha;
      trail.forEach(([x, y], k) => sparkle(ctx, a, x, y, (k % 2 ? 2.2 : 3.2) * (0.6 + fade * 0.4), a.alpha * fade, k % 2 ? '#ffffff' : STARC));
    }
    // Antler Charge: the antlers' stars blaze as she lowers her head, streaks behind her as she goes.
    if (kind === 'charge' && (a.ph.antic > 0.2 || a.ph.strike > 0.1)) {
      const on = Math.max(a.ph.antic, a.ph.strike);
      for (const [nm, pts] of [['antN', [[2, -21.2], [11, -11], [6, -18.6]]], ['antF', [[2, -21.2], [11, -11], [6, -18.6]]]]) {
        for (const [x, y] of pts) {
          const [ax, ay] = at2(mat(nm), x, y);
          sparkle(ctx, a, ax, ay, 2.6 * on + Math.sin(a.now * 20 + x) * 0.6, a.alpha * on, nm === 'antN' ? '#fff8d8' : '#d8d4ff');
        }
      }
      if (a.ph.strike > 0.1) {
        const [cx, cy] = at2(mat('chest'), 0, -6);
        ctx.globalAlpha = a.alpha * a.ph.strike * 0.6;
        ctx.strokeStyle = '#c8ccff';
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(cx - 18 - k * 4, cy - 8 + k * 9);
          ctx.lineTo(cx - 40 - k * 6, cy - 8 + k * 9);
          ctx.stroke();
        }
        ctx.globalAlpha = a.alpha;
      }
    }
    // Hoof Stamp: a ring of stars bursts out along the floor from her hoof.
    if (kind === 'stamp' && a.ph.strike > 0.3) {
      const [fx, fy] = at2(mat('hip'), 8, 28.6);
      for (let k = 0; k < 8; k++) {
        const ang2 = Math.PI + (k / 7) * Math.PI;
        const r = 10 + a.ph.strike * 30;
        sparkle(ctx, a, fx + Math.cos(ang2) * r, fy + Math.sin(ang2) * r * 0.35, 3.2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : STARC);
      }
      puff(ctx, a, fx - 10, fy - 2, 6 * a.ph.strike, a.alpha * a.ph.strike * 0.4);
      puff(ctx, a, fx + 12, fy - 2, 5 * a.ph.strike, a.alpha * a.ph.strike * 0.4);
    }
  },
}), 1.5);
export function astraeaStill(pose, f, mood) {
  const fm = AS_FACES[mood] || MOODS.has(mood) ? mood : 'idle';
  const hy = -28.6;
  const cy = hy + 1;
  const ny = cy - 21;
  return { w: 90, h: 114, res: 2, shapes: shift([
    ...put(asAntler(true)(), [4, 23], -6, ny - 21, -14), ...put(asEar(true)(), [1, 5.5], -10, ny - 19.6, 208),
    ...put(capeA(false)(), [11, 1], -2, cy - 19, 8), ...put(capeB(false)(), [13, 1], -4, cy - 5, 12), ...put(capeC(false)(), [15, 1], -6, cy + 3, 15),
    ...put(asUpper(true)(), [2, 4], -5, cy - 15, 70), ...put(asFore(true)(), [1.5, 4], -2.6, cy - 8.4, -58), ...put(asThigh(true)(), [5, 1], -3.6, hy + 5), ...put(asShin(true)(), [5, 1], -3.6, hy + 14.6),
    ...put(asPuff(), [6, 4], -11, hy + 4), ...put(asThigh(false)(), [5, 1], 3.6, hy + 5), ...put(asShin(false)(), [5, 1], 3.6, hy + 14.6),
    ...put(asPetals(), [15, 1], 0, hy), ...put(asTunic(), [14, 1], 0, hy), ...put(asNeck(), [4, 10], 1, cy - 15),
    ...put(asChest(), [12, 21], 0, cy), ...put(asAntler(false)(), [4, 23], 6.4, ny - 22, 10), ...put(asHead(), [17, 27], 1, ny), ...put(asFaceShapes(fm), [17, 27], 1, ny),
    ...put(asEar(false)(), [1, 5.5], 9, ny - 20, -28),
    ...put(asUpper(false)(), [2, 4], 5, cy - 14, 60), ...put(asFore(false)(), [1.5, 4], 8.5, cy - 7.9, -100),
  ], 45, 113) };
}
// A wandering star from Astraea's sky (her constellation fight, world/observatory.js): a plump
// five-point star, slowly turning and bobbing, a soft glow and a ring pulsing out from it to say
// "strike me next". Its number is drawn over it by render/observatory.js.
const sp = pairOf('sp');
const spStar = () => [star5(11, 11.6, 10.4, '#ffe68a'), F(star5(11, 11.6, 6.4, '#fff8d8')), F(E(8.4, 8.4, 2, 1.4, '#ffffff'))];
const SP_STAR = sp('star', 22, 22, spStar, 2);
export const starRig = makeRig({
  w: 26, h: 26, soft: true, stride: 8, recover: 0.4,
  springs: { bob: [80, 6], spin: [60, 5] },
  fast: [],
  kick: { bob: 120 },
  pose(m, a) {
    const t = a.t + (m.uid % 7) * 0.7;
    return { bob: Math.sin(t * 2.2) * 2.4, spin: Math.sin(t * 0.9) * 18 };
  },
  parts: [
    { name: 'core', parent: null, at: (S) => [0, -13 + S.bob], rot: (S) => S.spin * D2R },
    { name: 'starO', parent: 'core', s: SP_STAR[0], pivot: [11, 11.6] },
    { name: 'starB', parent: 'core', s: SP_STAR[1], pivot: [11, 11.6] },
  ],
  under(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const [x, y] = at2(mat('core'), 0, 0);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 26);
    g.addColorStop(0, `rgba(255,243,166,${0.55 * a.alpha})`);
    g.addColorStop(1, 'rgba(255,243,166,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 26, y - 26, 52, 52);
    const u = fr(a.now * 0.8);
    ctx.globalAlpha = a.alpha * (1 - u) * 0.8;
    ctx.strokeStyle = '#fff3a6';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, 12 + u * 18, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = a.alpha;
  },
});
export function starStill() {
  return { w: 26, h: 26, res: 2, shapes: shift(put(spStar(), [11, 11.6], 0, -13), 13, 25) };
}

