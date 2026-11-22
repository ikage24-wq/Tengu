// The Rockhound Kid (2026-11-22, replaces the Basilisk Hatchling in Windy Canyon; remade the same
// day to the Meteor Maiden's approved standard): a canyon kid in a stone-lizard onesie who is sure
// she is a fearsome basilisk.
//   - hair: real curly bangs (the hero's hair craft) peeking out under the hood, rust red;
//   - face: her own lizard eyes: golden irises with a soft slit pupil and a glossy square glint,
//     held between an upper AND a lower lid (her resting look is a smug lizard squint), and she
//     blinks from the bottom up, the way a lizard does; little stubby brows, canyon-sun freckles, a
//     smirk with one fang;
//   - clothes, all soft and round: the onesie (a scaled belly panel, a rib hem), its hood (a dome, a
//     crest of rounded plates, an upper jaw of felt teeth that gapes and snaps), a red bandana with
//     two loose tails, claw mittens, lizard slippers with three round toes; a heavy plated tail.
// Shading is drawn by hand on every cloth and limb layer, outlines one even tone (kidKit `flat`).
//
// How she moves:
//   walk    the kid walk (kidwalk.js, the hero's approved walk on her legs), in her own crouch: low
//           and creeping, leaning in, little claws held up in front, the tail swinging against her
//           hips, a puff of canyon dust as each slipper lands.
//   idle    an 18 s act: basks in the sun (a big stretch, face up, eyes shut); practises her rawr
//           (crouched, claws up, the jaw gaping, a shaky held roar, CHOMP, a giggle); checks on her
//           tail (a look back, a wag, a pat, a blep); eyes darting about in between.
//   attack  a pounce: crouched and wiggling, the jaw opening; then a lunge, both claws swiping down
//           and the jaw snapping shut; then a proud little bounce.
//   nap     squats down, head nodding, eyes shut, the tail curled up round her.

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, petal, groups, skull, HS, mapShape, kidHead, blob } from './kidbase.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { kidWalk, WALK_STIFF } from './kidwalk.js';
import { makeRig, clamp, TAU } from './rig.js';
import { puff, sparkle } from './rigkit.js';

const RH = 'rockhound2';
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  st: '#bca88f', stSh: '#97836f', stDk: '#6f5d4d', stLt: '#e6d8c2',
  belly: '#f2dcae', bellySh: '#dcbd88',
  claw: '#fff3da',
  scarf: '#e8584e', scarfSh: '#b83a3e', scarfLt: '#ff9282',
  iris: '#f2a33a', irisDk: '#a8601a', irisLt: '#ffe3a6', rim: '#5a3418', lid: '#7a4a2c', pupil: '#2a1408',
  brow: '#8a3a22', mouth: '#9a3a3e', line: '#7a2e34', tongue: '#ff8a8e', freckle: '#e39a74', tear: '#bfe8ff',
};
const HAIR = '#d9794d';

// ---------- Her face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

// Eyes: lid (the upper lid, down), low (the lower lid, up), pupil.
const EX = {
  idle: { e: 'open', lid: 0.28, low: 0.2, pupil: 'slit', m: 'smirk', b: 'flat' },
  happy: { e: 'arch', m: 'grin', b: 'up' },
  angry: { e: 'open', lid: 0.24, low: 0.1, slant: 1, pupil: 'thin', m: 'rawr', b: 'cross' },
  focus: { e: 'open', lid: 0.34, low: 0.22, slant: 0.7, pupil: 'thin', m: 'line', b: 'cross' },
  shout: { e: 'open', lid: 0.06, low: 0, slant: 0.7, pupil: 'thin', m: 'roar', b: 'cross' },
  hurt: { e: 'squeeze', m: 'wobble', b: 'worried', tear: true },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  dead: { e: 'shut', m: 'o', b: 'worried' },
  surprised: { e: 'open', lid: 0, low: 0, pupil: 'dot', m: 'o', b: 'up' },
  bask: { e: 'shut', m: 'cat', b: 'up' },
  blep: { e: 'open', lid: 0.4, low: 0.26, pupil: 'slit', m: 'blep', b: 'flat' },
  sad: { e: 'open', lid: 0.34, low: 0.1, pupil: 'slit', m: 'wobble', b: 'worried', tear: true },
};
const GAZE = { c: [0, 0], f: [1.6, 0.2], b: [-1.6, 0.2], u: [0.4, -1.4], d: [0.4, 1.2] };

function rhEye(x, y, o, ex, blink, g) {
  const out = [];
  const w = 7.4;
  const h = 8.2;
  let kind = ex.e;
  const lid = ex.lid ?? 0;
  let low = ex.low ?? 0;
  // (A lizard's blink: the lower lid rises to meet the upper.)
  if (kind === 'open' && blink === 1) low = Math.max(low, 0.6);
  if (kind === 'open' && blink === 2) kind = 'shut';
  const P = (dx, dy) => [x + dx * o, y + dy];
  if (kind === 'arch') {
    out.push(...band(curve([P(-7, 2), P(-3, -3.4), P(3, -3.6), P(7.2, 1.6)], 3), 2.3, 2.3, C.lid, true));
    return out;
  }
  if (kind === 'shut') {
    // Closed from below: the lower lid's line up high, gently arched, a fold under it.
    out.push(...band(curve([P(-7, -1.6), P(-2, -3.4), P(3, -3.4), P(7.2, -1.4)], 3), 2.1, 2.1, C.lid, true));
    out.push(...band(curve([P(-5, 1.4), P(0, 2.2), P(5, 1.2)], 2), 0.7, 0.7, SKIN_SH, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([P(6.4, -4), P(-3.4, 0.4), P(6.4, 4.2)], 2.4, 2.1, C.lid, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.32;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]);
    }
    out.push(...band(pts, 1.4, 1.5, C.lid, true));
    return out;
  }
  const [gx, gy] = g;
  // A round lizard eye: a thin dark rim, a golden iris darker toward the top, a soft slit pupil, a
  // few fine streaks of texture, a glossy square glint and a dot.
  out.push(F(E(x, y, w, h, C.rim)), F(E(x, y, w - 0.9, h - 0.9, C.irisDk)), F(E(x + gx * 0.2, y + 0.9, w - 1.7, h - 2.2, C.iris)), F(E(x + gx * 0.3, y + h * 0.46, w * 0.58, h * 0.24, C.irisLt)));
  for (const a of [-0.9, -0.3, 0.3, 0.9]) out.push(...band([[x + gx + Math.cos(a - Math.PI / 2) * 2, y + gy + Math.sin(a - Math.PI / 2) * 2.4], [x + gx + Math.cos(a - Math.PI / 2) * 5, y + gy + Math.sin(a - Math.PI / 2) * 5.4]], 0.5, 0.3, C.irisDk, true));
  const pw = ex.pupil === 'thin' ? 0.9 : ex.pupil === 'dot' ? 1.8 : 1.5;
  const ph = ex.pupil === 'dot' ? 2 : h * 0.62;
  out.push(F(E(x + gx, y + gy + 0.3, pw, ph, C.pupil)));
  out.push(F(blob([P(-4.6, -4.2), P(-1.8, -4.4), P(-1.8, -1.8), P(-4.6, -1.6)], '#ffffff', 2)), F(E(x + 3 * o, y + 3.2, 0.9, 0.9, '#ffffff')));
  // The lids: skin over the eye from the top down to the upper lid's line (sloping toward the nose
  // when she glares) and from the bottom up to the lower lid's; a warm brown edge on each, a crease.
  const sl = ex.slant ?? 0;
  const topY = (dx) => -h + h * 2 * lid * (0.85 + 0.15 * Math.abs(dx) / w) + sl * h * 0.5 * Math.max(0, -dx / w);
  const upper = curve([P(-w - 0.6, topY(-w) + 1.4), P(-w * 0.4, topY(-w * 0.4) - 0.6 * (1 - lid)), P(w * 0.4, topY(w * 0.4) - 0.6 * (1 - lid)), P(w + 0.6, topY(w) + 1.4)], 4);
  const botY = (dx) => h - h * 2 * low * (0.85 + 0.15 * Math.abs(dx) / w);
  const lower = curve([P(w + 0.6, botY(w) - 1.4), P(w * 0.4, botY(w * 0.4) + 0.4), P(-w * 0.4, botY(-w * 0.4) + 0.4), P(-w - 0.6, botY(-w) - 1.4)], 4);
  out.push(F(T([...upper, P(w + 2, -h - 4), P(-w - 2, -h - 4)], SKIN)), F(T([...lower, P(-w - 2, h + 4), P(w + 2, h + 4)], SKIN)));
  out.push(...band(upper, 1.6, 1.6, C.lid, true), ...band(lower, 1, 1, C.lid, true));
  out.push(...band(curve([P(-4, topY(-4) - 2.4), P(1, topY(1) - 3.2), P(5, topY(5) - 2.4)], 2), 0.7, 0.5, SKIN_SH, true));
  return out;
}

function rhMouth(kind) {
  const my = 23;
  const L = C.line;
  const fang = (x, y, s = 1) => F(T([[x - 0.9 * s, y], [x + 0.9 * s, y], [x, y + 1.9 * s]], '#ffffff'));
  switch (kind) {
    case 'grin':
      return [F(T([[-4.6, my - 1], [4.6, my - 1], [3.4, my + 3], [0, my + 4.4], [-3.4, my + 3]], C.mouth)), F(E(0, my + 3, 2.3, 1.3, C.tongue)), fang(2.3, my - 1)];
    case 'rawr':
      return [F(E(0, my + 1.8, 4.2, 3.8, C.mouth)), F(E(0, my + 3.6, 2.6, 1.6, C.tongue)), fang(-2.2, my - 1.6), fang(2.2, my - 1.6)];
    case 'roar':
      return [F(T([[-5.4, my - 1.8], [5.4, my - 1.8], [4.6, my + 3.6], [0, my + 6.2], [-4.6, my + 3.6]], C.mouth)), F(E(0, my + 4.4, 3, 1.7, C.tongue)), fang(-2.8, my - 1.8, 1.2), fang(2.8, my - 1.8, 1.2)];
    case 'o':
      return [F(E(0, my + 1.2, 1.9, 2.2, C.mouth))];
    case 'wobble':
      return band(curve([[-4, my + 1], [-2, my - 0.4], [0, my + 1], [2, my - 0.4], [4, my + 1]], 2), 1.1, 1.1, L, true);
    case 'cat':
      return band(curve([[-4.2, my], [-2.1, my + 1.7], [0, my + 0.5], [2.1, my + 1.7], [4.2, my]], 2), 1.1, 1.1, L, true);
    case 'blep':
      return [F(E(1.3, my + 2.4, 1.7, 1.9, C.tongue)), ...band([[1.3, my + 1.2], [1.3, my + 3]], 0.5, 0.4, '#e0606a', true), ...band(curve([[-3.2, my + 0.6], [0, my + 1.2], [3.2, my + 0.4]], 2), 1.1, 1.1, L, true)];
    case 'line':
      return band([[-3, my + 0.9], [3.2, my + 0.5]], 1.1, 1.1, L, true);
    default:
      return [fang(2.1, my + 0.8, 0.9), ...band(curve([[-3.4, my + 0.2], [-0.6, my + 1.4], [2.2, my + 0.6], [3.6, my - 1.2]], 3), 1.1, 1.3, L, true), ...band(curve([[4, my - 2.2], [4.6, my - 0.9], [4.2, my + 0.2]], 2), 0.8, 0.5, L, true)];
  }
}

function rhFace(ex, blink, gaze, bangShade) {
  const L = [...skull(0, 0)];
  for (const sx of [-1, 1]) {
    const cx = 19 * sx;
    L.push(F(E(cx, 21, 5.4, 2.4, BLUSH)));
    for (let k = 0; k < 3; k++) L.push(...band([[cx - 3 + k * 2.6, 22], [cx - 1.8 + k * 2.6, 20]], 0.7, 0.7, '#f06a8a', true));
    for (const [fx, fy] of [[8.6, 16.4], [11.4, 15], [13.6, 17]]) L.push(F(E(fx * sx, fy, 0.85, 0.75, C.freckle)));
  }
  L.push(...rhEye(-13.6, 10.4, -1, ex, blink, gaze), ...rhEye(13.6, 10.4, 1, ex, blink, gaze));
  L.push(...rhMouth(ex.m));
  if (ex.tear) for (const sx of [-1, 1]) L.push(E(sx * 21.4, 16, 2, 2.8, C.tear), F(E(sx * 21.4 - 0.6, 15, 0.7, 0.9, '#ffffff')));
  const placed = place(L);
  return [...placed.slice(0, 5), ...bangShade, ...placed.slice(5)];
}
// Little stubby brows: short round bars that tilt with her mood.
function rhBrows(kind) {
  const A = { flat: [0, 0], up: [-0.15, -2.4], cross: [0.42, 0.6], worried: [-0.42, -1.6] }[kind] ?? [0, 0];
  const B = [];
  for (const sx of [-1, 1]) {
    const cx = 12.6 * sx;
    const cy = -1.6 + A[1];
    const a = A[0] * sx;
    const dx = Math.cos(a) * 3.2;
    const dy = Math.sin(a) * 3.2;
    B.push(...band([[cx - dx, cy - dy], [cx + dx, cy + dy]], 2.8, 2.8, C.brow, true), F(E(cx - dx, cy - dy, 1.4, 1.4, C.brow)), F(E(cx + dx, cy + dy, 1.4, 1.4, C.brow)));
  }
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 108], neck: [HX, NECK], crown: [HX, 40], crest: [HX, 38], jaw: [HX, 50],
  shF: [CX - 11, 92], elF: [CX - 13, 101], wrF: [CX - 13, 109],
  shN: [CX + 12, 92], elN: [CX + 14, 101], wrN: [CX + 15, 109],
  hipF: [CX - 7, 108], kneeF: [CX - 7, 123], ankF: [CX - 7, 138],
  hipN: [CX + 7, 108], kneeN: [CX + 7, 123], ankN: [CX + 7, 138],
  t0: [CX - 10, 114], t1: [CX - 27, 126], t2: [CX - 44, 132], t3: [CX - 58, 128], t4: [CX - 66, 115],
  knot: [CX - 12, 89],
};
const TW = [15, 12.4, 9.6, 6.6, 3];
const HANDS = new Set(['paw', 'fist', 'claw']);

function mitt(out, [wx, wy], kind, col, sh) {
  if (kind === 'fist') {
    out.push(blob([[wx - 5, wy], [wx + 5, wy - 0.4], [wx + 5.6, wy + 6.6], [wx - 5.4, wy + 7.4]], col), F(blob([[wx - 5, wy + 1], [wx - 2, wy + 1], [wx - 2.6, wy + 7], [wx - 5.2, wy + 7]], sh, 1)));
    for (let k = 0; k < 3; k++) out.push(F(E(wx - 2.4 + k * 2.4, wy + 7.4, 1.1, 0.9, C.claw)));
    return;
  }
  out.push(blob([[wx - 5.4, wy], [wx + 5.2, wy - 0.4], [wx + 5.8, wy + 7], [wx - 5.6, wy + 7.6]], col), F(blob([[wx - 5.2, wy + 1], [wx - 2, wy + 1], [wx - 2.6, wy + 7.2], [wx - 5.4, wy + 7.2]], sh, 1)), E(wx + 4, wy + 2, 2, 2, col));
  if (kind === 'claw') for (const [k, a] of [[-1, 2.1], [0, 1.57], [1, 1.04]]) out.push(F(petal(wx + k * 2.8, wy + 6.6, a, 5, 2.8, C.claw)));
  else for (let k = -1; k <= 1; k++) out.push(F(blob([[wx + k * 3 - 1.3, wy + 7], [wx + k * 3 + 1.3, wy + 7], [wx + k * 3 + 0.4, wy + 10.2], [wx + k * 3 - 0.4, wy + 10.2]], C.claw, 1)));
}

function rockhoundShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : 'paw';
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'curlycrop', HAIR, 'auto');

  // The tail, root to tip: rounded plates down its back, a pale belly stripe underneath.
  for (let i = 0; i < 4; i++) {
    use(`tail${i}`);
    const a = J[`t${i}`];
    const b = J[`t${i + 1}`];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const n = ang + Math.PI / 2;
    const half = (TW[i] + TW[i + 1]) / 4;
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    out.push(petal(mid[0] + Math.cos(n) * half * 0.5, mid[1] + Math.sin(n) * half * 0.5, n - 0.25, 7 + TW[i] * 0.42, 5.4 + TW[i] * 0.3, C.stDk));
    out.push(E(a[0], a[1], TW[i] / 2, TW[i] / 2, C.stSh), ...band([a, b], TW[i], TW[i + 1], C.stSh));
    if (i === 3) out.push(E(b[0], b[1], TW[4] / 2 + 0.4, TW[4] / 2 + 0.4, C.stSh));
    out.push(...band([[a[0] - Math.cos(n) * half * 0.55, a[1] - Math.sin(n) * half * 0.55], [b[0] - Math.cos(n) * half * 0.4, b[1] - Math.sin(n) * half * 0.4]], TW[i] * 0.34, TW[i + 1] * 0.34, C.bellySh, true));
  }

  // The bandana's two loose tails.
  use('scarfB');
  out.push(petal(J.knot[0] + 1, J.knot[1] + 2, 1.95, 13, 6.4, C.scarfSh));
  use('scarfA');
  out.push(petal(J.knot[0], J.knot[1] + 1, 2.35, 15, 7.4, C.scarf), F(petal(J.knot[0], J.knot[1] + 1, 2.35, 9, 2.4, C.scarfLt)));

  // The hood's back: a soft dome, dark inside round her face; the crest of rounded plates.
  use('hoodBack');
  out.push(blob([[HX - 27, 66], [HX - 25, 42], [HX, 32], [HX + 25, 42], [HX + 27, 66], [HX + 18, 88], [HX - 18, 88]], C.stSh), F(blob([[HX - 22, 66], [HX - 20, 46], [HX, 38], [HX + 20, 46], [HX + 22, 66], [HX + 14, 86], [HX - 14, 86]], C.stDk)));
  use('crest');
  out.push(petal(HX - 6.4, 37, -1.98, 12, 8.4, C.stDk), petal(HX + 6.4, 37, -1.2, 12, 8.4, C.stDk), petal(HX, 36, -1.6, 16, 10, C.stDk), F(petal(HX, 36, -1.6, 10, 3.6, C.stSh)));

  // The far arm: a soft sleeve, its forearm, a claw mitten.
  use('armFu');
  out.push(blob([[J.shF[0] - 5, J.shF[1] - 2], [J.shF[0] + 4.6, J.shF[1] - 2.6], [J.elF[0] + 4.6, J.elF[1] + 1], [J.elF[0] - 4.8, J.elF[1] + 1.4]], C.stSh));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1] + 0.6, 4.4, 4.4, C.stSh), blob([[J.elF[0] - 4.4, J.elF[1]], [J.elF[0] + 4.2, J.elF[1]], [J.wrF[0] + 4.2, J.wrF[1] + 0.4], [J.wrF[0] - 4.4, J.wrF[1] + 0.6]], C.stSh, 2));
  out.push(blob([[J.wrF[0] - 4.6, J.wrF[1] - 2], [J.wrF[0] + 4.4, J.wrF[1] - 2.2], [J.wrF[0] + 4.6, J.wrF[1] + 0.8], [J.wrF[0] - 4.8, J.wrF[1] + 1]], C.stDk, 1));
  use('handF');
  mitt(out, J.wrF, handKind, C.st, C.stSh);

  // Legs: the onesie's soft legs (no seam at the knee: one fabric), lizard slippers.
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const c = far ? C.stSh : C.st;
    use(`thigh${k}`);
    out.push(blob([[hx - 5, 96], [hx + 5, 96], [kx + 4.6, ky], [kx + 4, ky + 3.6], [kx - 4, ky + 3.6], [kx - 4.6, ky]], c, 2));
    if (!far) out.push(F(blob([[hx - 4.8, 106], [hx - 2.4, 106], [kx - 2.6, ky + 1], [kx - 4.2, ky + 1]], C.stSh, 1)));
    use(`shin${k}`);
    out.push(E(kx, ky + 0.4, 4.4, 4.2, c), blob([[kx - 4.4, ky], [kx + 4.4, ky], [ax + 4, ay + 1], [ax - 4, ay + 1]], c, 2));
    if (!far) out.push(F(blob([[kx - 4.2, ky + 1], [kx - 2, ky + 1], [ax - 2, ay], [ax - 3.8, ay]], C.stSh, 1)));
    use(`foot${k}`);
    const fc = far ? C.stSh : C.st;
    out.push(blob([[ax - 5, ay - 3.4], [ax + 3.6, ay - 3.6], [ax + 10, ay + 1.4], [ax + 10.4, ay + 6.6], [ax - 5.2, ay + 6.8]], fc));
    out.push(F(blob([[ax - 5, ay + 4.4], [ax + 10.4, ay + 4.4], [ax + 10.4, ay + 6.6], [ax - 5.2, ay + 6.8]], far ? C.stDk : C.stSh, 1)));
    for (const [tx, ty] of [[6.6, 4.2], [9.4, 3], [11, 0.6]]) out.push(E(ax + tx, ay + ty, 2.2, 2, fc), F(E(ax + tx + 1.4, ay + ty + 0.6, 1, 0.8, C.claw)));
    out.push(F(E(ax + 1, ay - 1, 3, 1.2, far ? C.st : C.stLt)));
  }

  // The onesie: the body, its scaled belly panel, a light edge, the shadow side, a rib hem.
  use('body');
  out.push(blob([[CX - 13, 84], [CX + 14, 84], [CX + 18, 98], [CX + 19, 110], [CX + 14, 118], [CX - 14, 118], [CX - 19, 110], [CX - 18, 98]], C.st));
  out.push(F(blob([[CX - 13, 86], [CX - 6, 86], [CX - 8, 115], [CX - 14, 116], [CX - 18.4, 110], [CX - 17.4, 99]], C.stSh, 2)));
  out.push(F(blob([[CX - 1, 90], [CX + 11, 90], [CX + 14, 103], [CX + 12, 114], [CX - 2, 114]], C.belly, 2)));
  for (let k = 0; k < 4; k++) out.push(...band(curve([[CX - 1, 95 + k * 5], [CX + 6, 96 + k * 5], [CX + 12.6 - Math.abs(k - 1.5) * 0.6, 95 + k * 5]], 2), 0.9, 0.9, C.bellySh, true));
  out.push(...band(curve([[CX + 13, 87], [CX + 16.6, 99], [CX + 17.4, 110]], 3), 1.8, 1.6, C.stLt, true));
  out.push(...band(curve([[CX - 16, 113.4], [CX, 115.4], [CX + 16, 113.4]], 3), 3.4, 3.4, C.stSh));

  // The bandana round her neck, knotted at the side.
  use('scarf');
  out.push(...band(curve([[CX - 13, 86.4], [CX, 91], [CX + 13, 86.4]], 3), 5.4, 5.4, C.scarf));
  out.push(...band(curve([[CX - 6, 89.6], [CX + 2, 91.4], [CX + 9, 89.4]], 2), 1, 1, C.scarfLt, true));
  out.push(E(J.knot[0], J.knot[1], 4.2, 3.6, C.scarfSh), F(E(J.knot[0] + 0.8, J.knot[1] - 1, 1.6, 1.1, C.scarf)));

  // Her head and face, the curly bangs, the brows.
  use('head');
  out.push(...rhFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  out.push(...hd.bangs);
  use('brows');
  out.push(...rhBrows(ex.b));

  // The hood's front: its sides round her face, and the upper jaw over her brow (gapes and snaps):
  // a soft brim, a row of round felt teeth, the snout with its nostrils.
  use('hoodRim');
  for (const sx of [-1, 1]) out.push(blob([[HX + 20 * sx, 52], [HX + 28 * sx, 58], [HX + 28.6 * sx, 76], [HX + 24 * sx, 88], [HX + 19.4 * sx, 84], [HX + 21 * sx, 66]], C.st, 2));
  use('hoodTop');
  for (let k = -2; k <= 2; k++) {
    const x = HX + k * 6.2;
    const y = 48 + Math.abs(k) * 1.1;
    out.push(F(blob([[x - 2.8, y - 1.4], [x + 2.8, y - 1.4], [x + 0.8, y + 4.4], [x - 0.8, y + 4.4]], C.claw, 2)));
  }
  out.push(blob([[HX - 26, 58], [HX - 22, 46], [HX - 10, 39], [HX + 10, 39], [HX + 22, 46], [HX + 26, 58], [HX + 18, 52.6], [HX, 49], [HX - 18, 52.6]], C.st));
  out.push(blob([[HX - 12, 42], [HX - 8, 35], [HX + 8, 35], [HX + 12, 42], [HX, 45]], C.st, 2), F(E(HX - 4.6, 38.4, 1.8, 1.2, C.stDk)), F(E(HX + 4.6, 38.4, 1.8, 1.2, C.stDk)));
  out.push(...band(curve([[HX - 20, 50], [HX - 12, 42.6], [HX + 2, 38.6], [HX + 8, 36.6]], 3), 1.6, 1.2, C.stLt, true));

  // The near arm, in front of everything.
  use('armNu');
  out.push(blob([[J.shN[0] - 4.6, J.shN[1] - 2.6], [J.shN[0] + 5, J.shN[1] - 2], [J.elN[0] + 4.8, J.elN[1] + 1.4], [J.elN[0] - 4.6, J.elN[1] + 1]], C.st));
  out.push(...band(curve([[J.shN[0] + 3.6, J.shN[1] - 1], [J.elN[0] + 3.8, J.elN[1] - 1]], 2), 1.3, 1, C.stLt, true), F(blob([[J.shN[0] - 4.4, J.shN[1] - 1], [J.shN[0] - 1.6, J.shN[1] - 1], [J.elN[0] - 2, J.elN[1] + 1], [J.elN[0] - 4.4, J.elN[1] + 1]], C.stSh, 1)));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1] + 0.6, 4.4, 4.4, C.st), blob([[J.elN[0] - 4.2, J.elN[1]], [J.elN[0] + 4.4, J.elN[1]], [J.wrN[0] + 4.6, J.wrN[1] + 0.6], [J.wrN[0] - 4.2, J.wrN[1] + 0.4]], C.st, 2));
  out.push(blob([[J.wrN[0] - 4.8, J.wrN[1] - 2.2], [J.wrN[0] + 4.6, J.wrN[1] - 2], [J.wrN[0] + 4.8, J.wrN[1] + 1], [J.wrN[0] - 4.6, J.wrN[1] + 0.8]], C.stSh, 1));
  use('handN');
  mitt(out, J.wrN, handKind, C.stLt, C.stSh);

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(RH, rockhoundShapes, J, { flat: true, cel: new Set(['fringe']) });
const { rel, through } = K;
const WK = kidWalk(K, { stride: 14, kick: 2.6, key: 'rh' });
const LOOP = 18;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function faceOf(m, a, act) {
  const st = a.mo.rig;
  let ex = a.face === 'dead' ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
  if (!ex && a.ph.strike > 0.15) ex = 'shout';
  else if (!ex && a.ph.antic > 0.05) ex = 'focus';
  else if (!ex && act.nap > 0.5) ex = 'bask';
  else if (!ex && a.face === 'angry') ex = 'angry';
  else if (!ex && a.face === 'happy') ex = 'happy';
  else if (!ex && a.face === 'sleep') ex = 'bask';
  else if (!ex && a.face === 'cross') ex = 'focus';
  else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
  if (!ex) ex = act.face ?? 'idle';
  const P = 2.7 + (m.uid % 7) * 0.37;
  const q = (a.t + (m.uid % 5) * 0.9) % P;
  const blink = q < 0.06 ? 1 : q < 0.15 ? 2 : q < 0.22 ? 1 : 0;
  const n = Math.floor((a.t + m.uid * 0.37) / 1.35);
  const gaze = act.gaze ?? (a.face === 'angry' || a.ph.atk ? 'f' : ['c', 'f', 'c', 'b', 'u', 'c', 'd', 'f'][Math.floor(hash(n + m.uid) * 8)]);
  const blinks = EX[ex].e === 'open' && !(a.ph.antic > 0.05 || a.ph.strike > 0.05);
  st.rhFace = `${ex}|${blinks ? blink : 0}|${gaze}`;
}

export const rockhoundRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 14,
  recover: 0.6,
  springs: {
    x: [190, 17], lift: [170, 13], tilt: [130, 11], head: [80, 8], jaw: [260, 14],
    shF: [120, 11], elF: [140, 12], shN: [120, 11], elN: [140, 12], hdF: [160, 12], hdN: [160, 12],
    tw: [60, 6], tc: [50, 8], feet: [240, 18],
  },
  walkStiff: { ...WALK_STIFF, tw: [120, 12] },
  fast: ['x', 'lift', 'tilt', 'shN', 'elN', 'shF', 'elF', 'jaw'],
  kick: { tilt: -300, head: 420, x: -50, jaw: 9 },
  turnKick: { tilt: 150, head: -160, lift: -30, tw: 260 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.21;
    WK.step(m, a);
    const lu = t % LOOP;
    const calm = a.calm ?? 1;
    const breath = Math.sin(t * 1.7);
    const bask = hold(lu, 2.4, 3.3, 6.2, 7.1) * calm;
    const rawrUp = hold(lu, 8.4, 9.1, 10.3, 10.42) * calm;
    const chomp = hold(lu, 10.36, 10.42, 10.5, 10.7) * calm;
    const giggle = hold(lu, 10.5, 10.7, 11.6, 12.1) * calm;
    const look = hold(lu, 13.1, 13.5, 15.6, 16.1) * calm;
    const pat = hold(lu, 14, 14.3, 14.9, 15.2) * calm;
    const blep = hold(lu, 15.2, 15.35, 15.75, 15.9) * calm;
    const nap = m.habit?.kind === 'nap' && a.now < m.habit.until ? 1 : 0;
    const shake = rawrUp > 0.9 ? Math.sin(t * 52) : 0;
    const gig = giggle * Math.abs(Math.sin(t * 11));
    const act = {
      nap,
      face: rawrUp > 0.5 ? 'shout' : giggle > 0.3 || chomp > 0.3 ? 'happy' : bask > 0.4 ? 'bask' : blep > 0.4 ? 'blep' : look > 0.4 && lu < 13.8 ? 'surprised' : null,
      gaze: look > 0.4 ? 'b' : bask > 0.4 ? 'u' : null,
    };
    a.rhAct = { rawrUp, chomp, nap };
    const idle = {
      x: -rawrUp * 1.2 + giggle * 0.4,
      lift: -0.4 + breath * 0.14 - rawrUp * 2.2 + gig * 1.4 + bask * 0.6 - nap * 5,
      tilt: breath * 0.5 - bask * 6 + rawrUp * 5 + shake * 0.8 + look * -4 + gig * 2 - nap * 4,
      head: Math.sin(t * 0.6) * 2 - bask * 14 + rawrUp * -4 + look * -10 + giggle * Math.sin(t * 9) * 5 + blep * 6 + nap * (13 + Math.sin(t * 0.9) * 3),
      jaw: rawrUp * 1 - chomp * 0.35 + nap * 0.1,
      shF: 4 + breath * 2 + bask * 126 + rawrUp * 112 + look * 31 + pat * 8 - nap * 19,
      elF: 12 + rawrUp * 50 - look * 2 - nap * 52,
      shN: -4 - breath * 2 - bask * 126 - rawrUp * 91 - giggle * 56 - nap * 21,
      elN: -14 + bask * 2 - rawrUp * 48 - giggle * 131 - nap * 36,
      hdF: rawrUp * 22 + pat * 20,
      hdN: -rawrUp * 22 + giggle * 10 + gig * 8,
      tw: 3 + Math.sin(t * 0.8) * 3 + look * (9 + Math.sin(t * 9) * 9) + giggle * (4 + Math.sin(t * 12) * 4) + pat * 4,
      tc: nap * 14 + bask * 6,
      feet: rawrUp * 1.2,
    };
    // Walking: the kid walk, in her own creeping crouch: low (her hips sink a pixel more than her
    // feet need), leaning in, the head a beat behind, little claws held up in front and bobbing
    // with the steps, the tail swinging against her hips.
    const u = a.rhU ?? 0;
    const p = u * TAU;
    const roll = Math.sin(p - 0.5);
    const walk = {
      x: 0.5 + roll * 0.3,
      lift: -WK.sink(a) - 1.1 + WK.bob(a) * 0.5,
      tilt: 6 + roll * 1.6,
      head: -4 - roll * 1.2 + WK.headBob(a) * 6,
      jaw: 0.08,
      shF: -28 - Math.cos(p) * 8,
      elF: -64 + WK.headBob(a) * 10,
      shN: -42 + Math.cos(p) * 8,
      elN: -76 - WK.headBob(a) * 10,
      hdF: -10,
      hdN: -14,
      tw: 6 + roll * 7,
      tc: 4,
      feet: 0,
    };
    const wig = Math.sin(t * 34);
    const antic = { x: -2.4, lift: -3.4, tilt: -8, head: -10, jaw: 1, shF: 100, elF: 60, shN: -105, elN: -55, hdF: 25, hdN: -25, tw: 12 + wig * 11, tc: 0, feet: 1.6 };
    const since = a.ph.since;
    const strike = { x: 6, lift: 0.6, tilt: 18, head: 10, jaw: since >= 0 && since < 0.09 ? 1.1 : -0.3, shF: -40, elF: -20, shN: -35, elN: -15, hdF: -10, hdN: 20, tw: 16, tc: 0, feet: 2.4 };
    a.rhHand = a.ph.antic > 0.3 || rawrUp > 0.4 ? 'claw' : a.ph.strike > 0.2 || giggle > 0.4 ? 'fist' : 'paw';
    a.rhHandF = a.ph.antic > 0.3 || rawrUp > 0.4 ? 'claw' : 'paw';
    faceOf(m, a, act);
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - a.walkW) + walk[k] * a.walkW) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    if (m.hp <= 0) Object.assign(out, { x: -1, lift: -6, tilt: -16, head: -12, jaw: 0.8, shF: 20, elF: 10, shN: -10, elN: -10, tw: 2, tc: 0 });
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    if (a.walkW > 0.3) {
      for (const k of ['F', 'N']) {
        const q = ((((a.rhU ?? 0) + (k === 'F' ? 0.5 : 0)) % 1) + 1) % 1;
        if (q < 0.22) {
          const [ax] = WK.ankle(S, a, k);
          const u = q / 0.22;
          puff(ctx, a, ax + 1 - u * 3, -1 - u * 2, 1.4 + u * 2.2, 0.5 * (1 - u) * a.walkW, '236,214,182');
        }
      }
    }
    const jawSnap = a.rhAct?.chomp ?? 0;
    const strikeSnap = a.ph.since >= 0.08 && a.ph.since < 0.3 ? 1 - (a.ph.since - 0.08) / 0.22 : 0;
    const snap = Math.max(jawSnap, strikeSnap);
    if (snap > 0.05) {
      const [jx, jy] = through(matOf('hoodTop'), 'jaw', 'jaw');
      sparkle(ctx, a, jx + 7, jy - 3, 1.6 * snap, snap);
      sparkle(ctx, a, jx - 6, jy - 1, 1.1 * snap, snap * 0.8);
    }
    if (m.hp <= 0) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 6, hy - 2 + Math.sin(ang) * 1.8, 1.4, 0.9, '#ffe9a0');
      }
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    K.layer('tail0', { parent: 'torso', pivot: 't0', from: 'hip', rot: (S) => (S.tw * 0.5 + S.tc * 0.4) * D2R, soft: { k: 110, c: 9, gain: 0.3, turn: 0.6, max: 6 } }),
    K.layer('tail1', { parent: 'tail0', pivot: 't1', rot: (S) => (S.tw * 0.8 + S.tc) * D2R, soft: { k: 80, c: 7, gain: 0.4, turn: 0.7, max: 8 } }),
    K.layer('tail2', { parent: 'tail1', pivot: 't2', rot: (S) => (S.tw + S.tc * 1.3) * D2R, soft: { k: 62, c: 6, gain: 0.45, turn: 0.8, max: 10 } }),
    K.layer('tail3', { parent: 'tail2', pivot: 't3', rot: (S) => (S.tw * 1.2 + S.tc * 1.6) * D2R, soft: { k: 50, c: 5.5, gain: 0.5, turn: 0.85, max: 13 } }),
    K.layer('scarfB', { parent: 'torso', pivot: 'knot', from: 'hip', soft: { ...SOFT.PETAL, k: 90, flutter: 7, hz: 1.4, max: 30 } }),
    K.layer('scarfA', { parent: 'torso', pivot: 'knot', from: 'hip', soft: { ...SOFT.PETAL, k: 75, flutter: 9, hz: 1.1, max: 34 } }),
    K.layer('hoodBack', { parent: 'head', pivot: 'neck', from: 'neck' }),
    K.layer('crest', { parent: 'head', pivot: 'crest', from: 'neck', soft: { ...SOFT.FLAP, gain: 0.22, max: 16 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    { ...K.layer('handF', { parent: 'armFf', pivot: 'wrF', rot: (S) => S.hdF * D2R }), s: (a, S, b) => K.piece('handF', a.rhHandF ?? 'paw', b) },
    ...WK.parts(),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('scarf', { parent: 'torso', pivot: 'knot', from: 'hip' }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.rhFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.rhFace ?? 'idle').split('|')[0], b) },
    K.layer('hoodRim', { parent: 'head', pivot: 'neck', from: 'neck' }),
    K.layer('hoodTop', { parent: 'head', pivot: 'jaw', from: 'neck', at: (S) => {
      const [x, y] = rel('jaw', 'neck');
      return [x, y - S.jaw * 2.2];
    }, rot: (S) => -S.jaw * 4 * D2R }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    { ...K.layer('handN', { parent: 'armNf', pivot: 'wrN', rot: (S) => S.hdN * D2R }), s: (a, S, b) => K.piece('handN', a.rhHand ?? 'paw', b) },
  ]),
});

export const rockhoundStill = K.still;
export { rockhoundShapes, J as ROCKHOUND_JOINTS };
