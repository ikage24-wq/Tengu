// The Meteor Maiden (2026-11-22, replaces the Meteor Golem; remade the same day after the player's
// notes: "ugly hair, same eyes, square sharp clothes, a shading bug, disconnected parts, stiff
// walk"). A fallen-star tomboy who punches meteors for fun:
//   - hair: a real high ponytail (the hero's hair craft: clumps, a shine ring, shaped bangs), its
//     lock swinging on its own, a comet's fire bursting off its tip, a gold star at the tie;
//   - face: her own sharp upturned eyes (whites showing, a fiery iris banded red to gold, a star
//     glint), thick angular brows, a plaster across her nose, a cocky grin with a gap;
//   - clothes, all soft and round: a puffy navy bomber jacket with gold rib knit at the collar,
//     cuffs and hem, open over a white star tee, its front panels swinging; cuffed shorts; striped
//     knee socks; round crater-rock boots and gauntlets glowing in their cracks.
// Shading is drawn by hand on every cloth and limb layer (the kit's automatic shading put a dark
// band along every part's bottom edge, a seam wherever parts overlapped); only the hair keeps it.
// Every joint overlaps deep: the thighs run well up under the shorts, the knees are one smooth round
// of skin, sleeves cover the shoulders, gauntlets swallow the wrists.
//
// How she moves:
//   walk    on the hero's approved walk, on her own legs (about 1.5 strides a second): the heel
//           lands toe-up and the foot rolls onto its toe; lifting, it kicks up high behind her and
//           swings through low (the knee folding smoothly, never marching up); her hips settle
//           just as far as her planted feet need, a sharp little bob, the head a beat behind; the
//           heavy gauntlets swing a little, the jacket and the comet streaming after her.
//   idle    an 18 s act: bumps her gauntlets together in a shower of sparks; two quick jabs; spots a
//           shooting star, points, cheers with hops; tosses her ponytail, smug.
//   attack  the meteor smash: a gauntlet hauled up over her head, sparks gathering, the comet
//           flaring; then slammed into the ground in sparks and dust; then a shake of the hand.

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, petal, groups, skull, HS, mapShape, twinkle, kidHead } from './kidbase.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, smooth, clamp, TAU } from './rig.js';
import { puff, sparkle, dot } from './rigkit.js';

const MM = 'meteor2';
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  jacket: '#323a86', jacketSh: '#232a62', jacketDk: '#181d48', jacketLt: '#5a64b8',
  rib: '#ffcf5a', ribSh: '#d99a2a', tee: '#fff6ec', teeSh: '#ecdccc', print: '#ff8a4a',
  shorts: '#4a3e6e', shortsSh: '#352c52', shortsLt: '#6c5e96',
  sock: '#ffffff', sockSh: '#ddd8ea', stripe: '#ffb84a',
  rock: '#7c6c7e', rockSh: '#584a5c', rockDk: '#3e3244', rockLt: '#a99aa8',
  magma: '#ff9a3a', magmaLt: '#ffe07a',
  fire: '#ff8a52', fire2: '#ffc45e', fire3: '#fff3c8', star: '#ffe07a', gold: '#ffd45c', goldSh: '#d49a2a',
  irisTop: '#c8381c', iris: '#ff8a2a', irisLt: '#ffd25a', lash: '#3a1a16', brow: '#6e2416',
  mouth: '#a8402e', line: '#7e3024', tongue: '#ff8e8a', plaster: '#fffaf0', plasterSh: '#f0b8a8', tear: '#c4ecff',
};
const HAIR = '#ff8e5e';

// ---------- Her face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

// Eyes: e (open, glare, wide, arch, shut, squeeze, swirl, wink), lid (0..1), star (glints).
const EX = {
  idle: { e: 'open', lid: 0.12, m: 'smirk', b: 'set' },
  happy: { e: 'arch', m: 'grin', b: 'up' },
  focus: { e: 'glare', lid: 0.3, m: 'line', b: 'cross' },
  angry: { e: 'glare', lid: 0.18, m: 'teeth', b: 'cross' },
  shout: { e: 'wide', lid: 0, m: 'shout', b: 'cross' },
  wonder: { e: 'wide', lid: 0, star: 2, m: 'o', b: 'up' },
  smug: { e: 'open', lid: 0.46, m: 'smirk', b: 'smug' },
  cheer: { e: 'arch', m: 'shout', b: 'up' },
  hurt: { e: 'squeeze', m: 'teeth', b: 'worried', tear: true },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  sad: { e: 'open', lid: 0.34, m: 'wobble', b: 'worried', tear: true },
  ow: { e: 'wink', m: 'teeth', b: 'worried' },
  pant: { e: 'open', lid: 0.4, m: 'pant', b: 'worried' },
};
const GAZE = { c: [0, 0], f: [1.4, 0.2], b: [-1.4, 0.2], u: [0.3, -1.3], fu: [1.1, -1.1], d: [0.3, 1.1] };

const star4 = (x, y, r, c = '#ffffff') => [F(T([[x, y - r], [x + r * 0.26, y - r * 0.26], [x + r, y], [x + r * 0.26, y + r * 0.26], [x, y + r], [x - r * 0.26, y + r * 0.26], [x - r, y], [x - r * 0.26, y - r * 0.26]], c))];

function mmEye(x, y, o, ex, blink, g) {
  const out = [];
  const L = C.lash;
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if (kind === 'wink') kind = o > 0 ? 'squeeze' : 'open';
  if ((kind === 'open' || kind === 'glare' || kind === 'wide') && blink === 2) kind = 'shut';
  if ((kind === 'open' || kind === 'glare') && blink === 1) lid = Math.max(lid, 0.62);
  // (Points across the eye, inner corner first; `o` is +1 for the eye on the right.)
  const P = (dx, dy) => [x + dx * o, y + dy];
  if (kind === 'arch') {
    out.push(...band(curve([P(-6.4, 2), P(-2.6, -3.6), P(2.8, -4.4), P(7, -1.4)], 3), 2.6, 2.4, L, true), ...band([P(6.6, -1.6), P(8.6, -3.6)], 1.8, 0.6, L, true));
    return out;
  }
  if (kind === 'shut') {
    out.push(...band(curve([P(-6.4, 1.2), P(-2, 3.6), P(3, 3.2), P(7.2, 0)], 3), 2.4, 2.4, L, true), ...band([P(6.8, 0.2), P(8.8, -1.8)], 1.8, 0.6, L, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([P(6.4, -4.2), P(-3.4, 0.6), P(6.4, 4.4)], 2.6, 2.2, L, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.32;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]);
    }
    out.push(...band(pts, 1.5, 1.6, L, true));
    return out;
  }
  // The eye's outline: an upturned almond, the outer corner sharp and lifted (wider when she's
  // wide-eyed, the top flattened toward her nose when she glares).
  const wide = kind === 'wide' ? 1.6 : 0;
  const glare = kind === 'glare' ? 1 : 0;
  const top = curve([P(-6.4, 1.4), P(-3.4, -5.6 - wide + glare * 3), P(2.2, -7.4 - wide + glare * 1.2), P(7.6, -4.6 - wide * 0.4)], 4);
  const bottom = curve([P(7.6, -4.6 - wide * 0.4), P(6, 3.4), P(1, 6.6 + wide * 0.5), P(-4.2, 5.4), P(-6.4, 1.4)], 4);
  out.push(F(T([...top, ...bottom], '#ffffff')));
  // The iris: big, banded red to orange to gold, a dark pupil, a star glint and a round one.
  const [gx, gy] = g;
  const ix = x + gx + 0.5 * o;
  const iy = y + 0.6 + gy;
  out.push(F(E(ix, iy, 5.2, 6.4, C.irisTop)), F(E(ix, iy + 1.2, 4.6, 5.2, C.iris)), F(E(ix, iy + 3, 3.6, 2.6, C.irisLt)));
  out.push(F(E(ix, iy + 0.4, kind === 'glare' ? 1.1 : 1.7, 2.6, '#2a0e08')));
  out.push(...star4(ix - 2 * o, iy - 2.6, ex.star ? 3.2 : 2.5), F(E(ix + 2.2 * o, iy + 2.6, 0.9, 0.9, '#ffffff')));
  if (ex.star === 2) out.push(...star4(ix + 2 * o, iy + 1.8, 1.6));
  // Skin over everything outside the almond, top and bottom (so the iris shows only inside it).
  const lidTop = lid > 0 ? curve([P(-6.6, 1.4 + lid * 1.2), P(-3, -5.4 + lid * 7.4 + glare * 3), P(2.6, -7 + lid * 7 + glare * 1.2), P(7.8, -4.8 + lid * 2)], 4) : top;
  out.push(F(T([...lidTop, P(9, -12), P(-8, -12)], SKIN)));
  out.push(F(T([...bottom, P(-8, 10), P(9, 10)], SKIN)));
  // The lash line: heavy along the top, a wing flicking up off the outer corner; two short lashes
  // under the outer corner; a soft crease above.
  out.push(...band(lidTop, 2.4, 3, L, true), ...band(curve([P(6.6, -4.2 + lid * 1.6), P(9.2, -6.6 + lid), P(10.2, -9 + lid)], 2), 2.2, 0.6, L, true));
  for (const [a, b] of [[[5.4, 3.8], [6.8, 5.4]], [[3.4, 5.4], [4.2, 7.2]]]) out.push(...band([P(...a), P(...b)], 0.9, 0.4, L, true));
  out.push(...band(curve([P(-3, -8.4 + lid * 4), P(3, -9.4 + lid * 4), P(7, -7.6 + lid * 3)], 2), 0.7, 0.5, SKIN_SH, true));
  return out;
}

function mmMouth(kind) {
  const my = 23;
  const L = C.line;
  switch (kind) {
    case 'grin':
      // A wide toothy grin with a little gap in her teeth.
      return [F(T([[-5, my - 1.2], [5, my - 1.2], [3.8, my + 3], [0, my + 4.6], [-3.8, my + 3]], C.mouth)), F(T([[-4.4, my - 1.1], [-0.4, my - 1.1], [-0.6, my + 0.8], [-4, my + 0.6]], '#ffffff')), F(T([[0.4, my - 1.1], [4.4, my - 1.1], [4, my + 0.6], [0.6, my + 0.8]], '#ffffff')), F(E(0, my + 3.2, 2.2, 1.2, C.tongue))];
    case 'teeth':
      return [F(T([[-3.8, my - 0.4], [3.8, my - 0.4], [3.2, my + 2.4], [-3.2, my + 2.4]], C.mouth)), F(T([[-3.4, my], [3.4, my], [3.2, my + 2], [-3.2, my + 2]], '#ffffff')), ...band([[-3, my + 1], [3, my + 1]], 0.5, 0.5, '#e0d0cc', true)];
    case 'shout':
      return [F(T([[-5, my - 1.6], [5, my - 1.6], [4.2, my + 3.6], [0, my + 6.2], [-4.2, my + 3.6]], C.mouth)), F(T([[-4.4, my - 1.5], [-0.4, my - 1.5], [-0.6, my + 0.2], [-4, my + 0.2]], '#ffffff')), F(T([[0.4, my - 1.5], [4.4, my - 1.5], [4, my + 0.2], [0.6, my + 0.2]], '#ffffff')), F(E(0, my + 4.4, 2.6, 1.5, C.tongue))];
    case 'o':
      return [F(E(0, my + 1.2, 2.2, 2.6, C.mouth)), F(E(0, my + 2.4, 1.2, 0.8, C.tongue))];
    case 'line':
      return band([[-3.2, my + 1], [3.4, my + 0.4]], 1.2, 1.2, L, true);
    case 'wobble':
      return band(curve([[-4, my + 1], [-2, my - 0.4], [0, my + 1], [2, my - 0.4], [4, my + 1]], 2), 1.1, 1.1, L, true);
    case 'pant':
      return [F(T([[-3.4, my - 0.6], [3.4, my - 0.6], [2.4, my + 2.4], [-2.4, my + 2.4]], C.mouth)), F(E(0.6, my + 3, 1.8, 2, C.tongue))];
    default:
      // The cocky smirk: hiked up on one side, the corner open on a tooth.
      return [...band(curve([[-3.8, my + 1.2], [-0.6, my + 1.6], [2.4, my + 0.6], [4.2, my - 1.4]], 3), 1.2, 1.4, L, true), F(T([[2.2, my + 0.2], [4, my - 1], [3.8, my + 0.8]], '#ffffff'))];
  }
}

function mmFace(ex, blink, gaze, bangShade = []) {
  const L = [...skull(0, 0)];
  for (const sx of [-1, 1]) {
    const cx = 18.6 * sx;
    L.push(F(E(cx, 20.6, 5.2, 2.3, BLUSH)));
    for (let k = 0; k < 2; k++) L.push(...band([[cx - 2 + k * 2.8, 21.6], [cx - 0.8 + k * 2.8, 19.6]], 0.7, 0.7, '#f06a8a', true));
  }
  L.push(...mmEye(-13.2, 10.6, -1, ex, blink, gaze), ...mmEye(13.2, 10.6, 1, ex, blink, gaze));
  // A plaster across the bridge of her nose.
  L.push(F(T([[-6, 14.2], [5.6, 12.8], [6, 16.6], [-5.6, 18]], '#e8b8a8')), F(T([[-5.6, 14.6], [5.2, 13.2], [5.6, 16.2], [-5.2, 17.6]], C.plaster)), F(T([[-1.4, 14.2], [1.6, 13.8], [1.8, 16.8], [-1.2, 17.2]], C.plasterSh)));
  for (const [px, py] of [[-3.6, 16], [3.6, 15]]) L.push(F(E(px, py, 0.4, 0.4, C.plasterSh)));
  L.push(...mmMouth(ex.m));
  if (ex.tear) for (const sx of [-1, 1]) L.push(E(sx * 21.4, 16, 2, 2.8, C.tear), F(E(sx * 21.4 - 0.6, 15, 0.7, 0.9, '#ffffff')));
  // (The shadow her bangs cast goes in right over the skull, under everything else: it's the
  // hair's own, following each clump.)
  const placed = place(L);
  return [...placed.slice(0, 5), ...bangShade, ...placed.slice(5)];
}
function mmBrows(kind) {
  // Angular, sporty brows: two strokes meeting in a corner, dark and crisp against her bangs.
  const side = (k) => ({
    set: [[5.8, -2.2], [12.6, -4.8], [18, -3.6]],
    up: [[5.8, -5.4], [12.6, -8.4], [18, -6.8]],
    cross: [[6.2, 0.6], [12.6, -2.6], [18, -5.4]],
    worried: [[6.2, -6.4], [12.6, -4.6], [18, -1.8]],
  })[k];
  const B = [];
  for (const sx of [-1, 1]) {
    const P = kind === 'smug' ? (sx > 0 ? side('up') : side('set')) : side(kind) ?? side('set');
    B.push(...band(P.map(([x, y]) => [x * sx, y + 1.6]), 2.4, 1.2, C.brow, true));
  }
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 106], neck: [HX, NECK], crown: [HX, 40], tie: [HX - 22, 39], tip: [HX - 36, 112],
  shF: [CX - 13, 91], elF: [CX - 15, 101], wrF: [CX - 15, 109],
  shN: [CX + 13, 91], elN: [CX + 15, 101], wrN: [CX + 15, 109],
  // Legs: hip sockets inside the shorts, knees, ankles.
  hipF: [CX - 7, 108], kneeF: [CX - 7, 123], ankF: [CX - 7, 138],
  hipN: [CX + 7, 108], kneeN: [CX + 7, 123], ankN: [CX + 7, 138],
  panL: [CX - 3, 86], panR: [CX + 5, 86], shorts: [CX, 104],
};
const HANDS = new Set(['fist', 'open', 'point']);

// A smooth closed shape through points (corner-cut three times, so nothing is sharp).
function soft(pts, n = 3) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      const b = q[(i + 1) % q.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q = out;
  }
  return q;
}
const blob = (pts, c, n = 3) => T(soft(pts, n), c);

// A crater-rock gauntlet round the wrist (x, y): a round fist, craters, glowing cracks.
function gauntlet(out, [wx, wy], kind, far) {
  const c = far ? C.rockSh : C.rock;
  const sh = far ? C.rockDk : C.rockSh;
  const lt = far ? C.rock : C.rockLt;
  // The cuff over the wrist.
  out.push(blob([[wx - 6.4, wy - 3], [wx + 6, wy - 3.4], [wx + 7, wy + 2], [wx - 6.8, wy + 2.4]], sh, 2));
  if (kind === 'point') {
    out.push(blob([[wx - 6, wy], [wx + 5.4, wy - 0.6], [wx + 6.4, wy + 7], [wx - 5.6, wy + 8]], c));
    out.push(blob([[wx - 1, wy + 6], [wx + 3, wy + 6], [wx + 2.6, wy + 15.4], [wx - 0.6, wy + 15.4]], c, 2), F(E(wx + 1, wy + 14, 1, 1, lt)));
  } else if (kind === 'open') {
    out.push(blob([[wx - 6.6, wy], [wx + 6, wy - 0.4], [wx + 6.8, wy + 8], [wx - 6.4, wy + 8.6]], c));
    for (let k = -1; k <= 1; k++) out.push(blob([[wx + k * 3.6 - 1.6, wy + 7], [wx + k * 3.6 + 1.6, wy + 7], [wx + k * 3.8 + 1.4, wy + 12.6], [wx + k * 3.8 - 1.4, wy + 12.6]], c, 2));
  } else {
    out.push(blob([[wx - 8, wy + 1], [wx + 7.6, wy], [wx + 9, wy + 7], [wx + 6, wy + 12.6], [wx - 6, wy + 13], [wx - 9, wy + 7]], c));
    out.push(...band(curve([[wx - 6, wy + 10.6], [wx, wy + 12.2], [wx + 6, wy + 10.4]], 2), 1, 1, sh, true));
  }
  // Shade on the far side, a light on the near top, craters, a crack with the glow in it.
  out.push(F(blob([[wx - 8, wy + 2], [wx - 2, wy + 1], [wx - 3, wy + 12], [wx - 7, wy + 11]], sh, 2)), F(E(wx + 2.4, wy + 2.6, 3.2, 1.6, lt)));
  out.push(F(E(wx - 3, wy + 6, 1.6, 1.3, sh)), F(E(wx - 2.6, wy + 5.6, 1.4, 0.7, lt)), F(E(wx + 4, wy + 8, 1.2, 1, sh)));
  out.push(...band(curve([[wx + 1, wy + 1], [wx + 2.4, wy + 4.4], [wx + 0.6, wy + 7.2], [wx + 2, wy + 10]], 2), 1.2, 0.8, C.magma, true), F(E(wx + 1.6, wy + 5, 0.7, 0.7, C.magmaLt)));
}

function meteorShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : 'fist';
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisTop, irisLt: C.irisLt }, 'ponytail', HAIR, 'auto');

  // The ponytail (the hair's own lock), and the comet's fire bursting off its tip in two tongues.
  use('pony');
  out.push(...hd.hang);
  const [tx, ty] = J.tip;
  use('flame0');
  for (const [a, len, w, c] of [[2.2, 20, 11, C.fire], [2.7, 23, 12, C.fire], [1.8, 15, 9, C.fire]]) out.push(F(petal(tx + 1, ty - 4, a, len, w, c)));
  for (const [a, len, w] of [[2.25, 13, 6], [2.68, 15, 6.6], [1.9, 10, 5]]) out.push(F(petal(tx + 0.4, ty - 3, a, len, w, C.fire2)));
  use('flame1');
  for (const [a, len, w] of [[2.5, 13, 6], [2.95, 11, 5], [2.1, 9, 4]]) out.push(F(petal(tx - 14, ty + 3, a, len, w, C.fire3)));
  out.push(...twinkle(tx - 28, ty + 7, 3.2, C.fire3), ...twinkle(tx - 18, ty + 14, 2.2, C.star));

  use('hairBack');
  out.push(...hd.backHead);

  // The far arm: the jacket's puffy sleeve, a rib cuff, the gauntlet.
  use('armFu');
  out.push(blob([[J.shF[0] - 5, J.shF[1] - 3], [J.shF[0] + 4, J.shF[1] - 4], [J.elF[0] + 4.6, J.elF[1] + 1], [J.elF[0] - 5.4, J.elF[1] + 2]], C.jacketSh));
  out.push(F(blob([[J.shF[0] - 5, J.shF[1]], [J.shF[0] - 1, J.shF[1] - 1], [J.elF[0] - 1, J.elF[1] + 1], [J.elF[0] - 5, J.elF[1] + 1.4]], C.jacketDk, 2)));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1] + 1, 4.4, 4.4, C.jacketSh), blob([[J.elF[0] - 4.4, J.elF[1]], [J.elF[0] + 4.2, J.elF[1]], [J.wrF[0] + 4.6, J.wrF[1] - 1], [J.wrF[0] - 4.8, J.wrF[1] - 0.6]], C.jacketSh, 2));
  out.push(blob([[J.wrF[0] - 5.2, J.wrF[1] - 4.2], [J.wrF[0] + 5, J.wrF[1] - 4.6], [J.wrF[0] + 5.2, J.wrF[1] - 0.6], [J.wrF[0] - 5.4, J.wrF[1] - 0.2]], C.ribSh, 2));
  use('handF');
  gauntlet(out, J.wrF, handKind === 'point' ? 'fist' : handKind, true);

  // Legs: a thigh and a shin, the knee between them one smooth round of skin (no seam, no cap
  // standing out), the striped sock starting below it; the thigh runs well up under the shorts.
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const skin = far ? SKIN_SH : SKIN;
    const sock = far ? C.sockSh : C.sock;
    use(`thigh${k}`);
    out.push(blob([[hx - 4.6, 96], [hx + 4.6, 96], [kx + 4, ky], [kx + 3.4, ky + 3.4], [kx - 3.4, ky + 3.4], [kx - 4, ky]], skin, 2));
    if (!far) out.push(F(blob([[hx - 4.4, 108], [hx - 2.2, 108], [kx - 2.4, ky + 1], [kx - 3.8, ky + 1]], SKIN_SH, 1)));
    use(`shin${k}`);
    out.push(E(kx, ky + 0.4, 3.9, 3.7, skin), blob([[kx - 3.8, ky], [kx + 3.8, ky], [ax + 3.5, ay + 1], [ax - 3.5, ay + 1]], skin, 2));
    out.push(blob([[kx - 3.7, ky + 4.4], [kx + 3.7, ky + 4.4], [ax + 3.5, ay + 1], [ax - 3.5, ay + 1]], sock, 2));
    for (const sy of [ky + 6.6, ky + 10]) out.push(...band([[kx - 3.6, sy], [kx + 3.6, sy]], 1.5, 1.5, far ? C.ribSh : C.stripe, true));
    out.push(F(blob([[kx - 3.7, ky + 4.8], [kx - 1.6, ky + 4.8], [ax - 1.6, ay + 1], [ax - 3.4, ay + 1]], far ? '#c8c2da' : C.sockSh, 1)));
    use(`foot${k}`);
    const c = far ? C.rockSh : C.rock;
    // (A chunky little rock boot, round at the toe: not much longer than the sock is wide.)
    out.push(blob([[ax - 4.4, ay - 3], [ax + 3.4, ay - 3.2], [ax + 8.6, ay + 2.4], [ax + 8.6, ay + 6.6], [ax - 4.6, ay + 6.8]], c));
    out.push(F(blob([[ax - 4.4, ay + 4.4], [ax + 8.6, ay + 4.4], [ax + 8.6, ay + 6.6], [ax - 4.6, ay + 6.8]], far ? C.rockDk : C.rockSh, 1)));
    out.push(F(E(ax + 1.6, ay - 0.4, 2.8, 1.2, far ? C.rock : C.rockLt)), F(E(ax + 5.2, ay + 2.2, 1, 0.9, far ? C.rockDk : C.rockSh)));
    out.push(...band(curve([[ax + 5.6, ay + 0.6], [ax + 7.2, ay + 2.4], [ax + 6.8, ay + 4.2]], 2), 0.9, 0.6, C.magma, true));
  }

  // Cuffed shorts, soft and round, with a star patch.
  use('shorts');
  out.push(blob([[CX - 15, 101], [CX + 15, 101], [CX + 17, 112], [CX + 14, 117], [CX + 2, 116], [CX - 14, 117], [CX - 17, 112]], C.shorts));
  out.push(F(blob([[CX - 15, 102], [CX - 7, 102], [CX - 8, 116], [CX - 14, 116.6], [CX - 16.6, 112]], C.shortsSh, 2)));
  out.push(...band(curve([[CX - 16.6, 114.4], [CX - 9, 116.4], [CX - 2, 115.6]], 2), 2.2, 2.2, C.shortsLt, true), ...band(curve([[CX + 2.6, 115.6], [CX + 9, 116.4], [CX + 16.4, 114.4]], 2), 2.2, 2.2, C.shortsLt, true));
  out.push(...band([[CX + 1, 104], [CX + 1.2, 114]], 0.8, 0.8, C.shortsSh, true), ...twinkle(CX + 9, 110, 2.4, C.star));

  // The white tee under the jacket, a star printed on it; the jacket's body behind the panels.
  use('body');
  out.push(blob([[CX - 13, 84], [CX + 14, 84], [CX + 17, 95], [CX + 16, 104], [CX - 16, 104], [CX - 17, 95]], C.jacketSh));
  out.push(blob([[CX - 5, 86], [CX + 7, 86], [CX + 8, 104], [CX - 6, 104]], C.tee, 2), F(blob([[CX - 5, 86], [CX - 1, 86], [CX - 2, 104], [CX - 6, 104]], C.teeSh, 1)));
  out.push(...twinkle(CX + 2, 97, 3.2, C.print));
  // The jacket's front panels: puffy, quilted, gold rib at the hem; each swings from its shoulder.
  use('panL');
  out.push(blob([[CX - 14, 84], [CX - 4, 85], [CX - 3, 98], [CX - 4, 105], [CX - 16, 105.6], [CX - 18.6, 96]], C.jacket));
  out.push(F(blob([[CX - 14, 85], [CX - 9, 85], [CX - 11, 105], [CX - 16, 105], [CX - 18, 96]], C.jacketSh, 2)));
  out.push(...band(curve([[CX - 16, 94], [CX - 10, 95.4], [CX - 4, 94.6]], 2), 0.8, 0.8, C.jacketDk, true), ...band(curve([[CX - 17, 100], [CX - 10, 101.4], [CX - 4, 100.6]], 2), 0.8, 0.8, C.jacketDk, true));
  out.push(blob([[CX - 17, 102.4], [CX - 3.4, 102.4], [CX - 3.6, 106.6], [CX - 16.4, 107]], C.rib, 1), ...band([[CX - 16, 104.6], [CX - 4, 104.6]], 0.8, 0.8, C.jacket, true));
  use('panR');
  out.push(blob([[CX + 6, 85], [CX + 15, 84], [CX + 19, 96], [CX + 17, 105.6], [CX + 6, 105], [CX + 5, 98]], C.jacket));
  out.push(...band(curve([[CX + 14, 87], [CX + 17.6, 96], [CX + 16.6, 103]], 3), 1.6, 1.2, C.jacketLt, true));
  out.push(...band(curve([[CX + 6, 94.6], [CX + 12, 95.4], [CX + 18, 94]], 2), 0.8, 0.8, C.jacketDk, true), ...band(curve([[CX + 6, 100.6], [CX + 12, 101.4], [CX + 17.6, 100]], 2), 0.8, 0.8, C.jacketDk, true));
  out.push(blob([[CX + 5.6, 102.4], [CX + 17.6, 102.4], [CX + 17, 107], [CX + 5.8, 106.6]], C.rib, 1), ...band([[CX + 6.4, 104.6], [CX + 16.6, 104.6]], 0.8, 0.8, C.jacket, true));
  out.push(...twinkle(CX + 12, 90, 2.6, C.gold));
  // The rib-knit collar round her neck, and the neck's shadow under her chin.
  use('collar');
  out.push(F(E(CX + 1, 86.4, 9, 1.8, '#f0c0a8')));
  out.push(...band(curve([[CX - 13, 85.6], [CX - 6, 89.4], [CX + 1, 90.2], [CX + 8, 89.4], [CX + 15, 85.6]], 4), 4.4, 4.4, C.rib));
  out.push(...band(curve([[CX - 12, 86.6], [CX - 6, 89.8], [CX + 1, 90.6], [CX + 8, 89.8], [CX + 14, 86.6]], 4), 0.8, 0.8, C.jacket, true));

  // Her head and face, the bangs, brows, the gold star tie.
  use('head');
  out.push(...mmFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  out.push(...hd.fringe);
  use('brows');
  out.push(...mmBrows(ex.b));
  use('tie');
  const st = (x, y, r, c) => {
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? r * 0.48 : r;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    return T(pts, c);
  };
  out.push(st(J.tie[0], J.tie[1], 6.6, C.goldSh), st(J.tie[0], J.tie[1] - 0.4, 5.4, C.gold), F(E(J.tie[0] - 1, J.tie[1] - 1.6, 1.4, 1, '#fff3c8')));

  // The near arm.
  use('armNu');
  out.push(blob([[J.shN[0] - 4, J.shN[1] - 4], [J.shN[0] + 5, J.shN[1] - 3], [J.elN[0] + 5.4, J.elN[1] + 2], [J.elN[0] - 4.6, J.elN[1] + 1]], C.jacket));
  out.push(...band(curve([[J.shN[0] + 3.4, J.shN[1] - 2], [J.elN[0] + 4.4, J.elN[1] - 2], [J.elN[0] + 3.6, J.elN[1] + 1]], 2), 1.4, 1, C.jacketLt, true), F(blob([[J.shN[0] - 4, J.shN[1] - 2], [J.shN[0] - 1, J.shN[1] - 2], [J.elN[0] - 2, J.elN[1] + 1], [J.elN[0] - 4.6, J.elN[1] + 1]], C.jacketSh, 2)));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1] + 1, 4.4, 4.4, C.jacket), blob([[J.elN[0] - 4.2, J.elN[1]], [J.elN[0] + 4.4, J.elN[1]], [J.wrN[0] + 4.8, J.wrN[1] - 0.6], [J.wrN[0] - 4.6, J.wrN[1] - 1]], C.jacket, 2));
  out.push(blob([[J.wrN[0] - 5.4, J.wrN[1] - 4.6], [J.wrN[0] + 5.2, J.wrN[1] - 4.2], [J.wrN[0] + 5.4, J.wrN[1] - 0.2], [J.wrN[0] - 5.2, J.wrN[1] - 0.6]], C.rib, 2), ...band([[J.wrN[0] - 4.6, J.wrN[1] - 2.4], [J.wrN[0] + 4.6, J.wrN[1] - 2.4]], 0.7, 0.7, C.ribSh, true));
  use('handN');
  gauntlet(out, J.wrN, handKind, false);

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const HAIR_LAYERS = new Set(['pony', 'hairBack', 'fringe']);
const K = kidKit(MM, meteorShapes, J, { flat: true, cel: HAIR_LAYERS });
const { rel, pv, through } = K;
const STRIDE = 15;
const DUTY = 0.52;
const REACH = (STRIDE * DUTY) / 2;
const LOOP = 18;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const stepPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(140, Math.abs(odo - (st.mmOdo ?? odo)) / dt);
  st.mmOdo = odo;
  st.mmV = (st.mmV ?? 0) + (raw - (st.mmV ?? 0)) * Math.min(1, dt * 5);
  st.mmU = ((st.mmU ?? 0) + (st.mmV / STRIDE) * dt) % 1;
  return st.mmU;
};
const LT = (J.kneeN[1] - J.hipN[1]) * K.SC;
const LS = (J.ankN[1] - J.kneeN[1]) * K.SC;
const KICK = 3;
// A foot through its step (the hero's approved walk, on her own legs): [x off its rest, lift, roll
// in degrees (+ the heel up, - the toe up)]. Planted, it lands heel first with the toe up, rolls
// flat, then onto its toe, the ankle rising as the heel peels; then it kicks up high behind her
// (the lift peaks early in the swing, so the shin folds back from a forward knee instead of
// marching the knee up) and swings through low, reaching out heel first.
function footAt(u, ph) {
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < DUTY) {
    const s = q / DUTY;
    const peel = s > 0.7 ? (s - 0.7) / 0.3 : 0;
    const roll = s < 0.15 ? -16 * (1 - s / 0.15) : 30 * peel;
    return [REACH - 2 * REACH * s, 0.6 * peel, roll];
  }
  const v = (q - DUTY) / (1 - DUTY);
  return [-REACH + 2 * REACH * (0.5 - 0.5 * Math.cos(Math.PI * v)), KICK * Math.sin(Math.PI * v ** 0.7), 30 * (1 - v) ** 2 - 14 * v ** 3];
}
// A walk's bob as a sharpened triangle (a sine reads floaty): 0 just after each foot lands, 1 at the
// passing pose; twice a stride. (`lag` for the head, a beat behind.)
function bobAt(u, lag = 0) {
  const w = (((2 * u - 0.08 - lag) % 1) + 1) % 1;
  const tri = 1 - Math.abs(w - 0.5) * 2;
  return tri * tri * (3 - 2 * tri) * 0.4 + tri * 0.6;
}
// How far her hips must sink so every planted foot reaches the ground (the legs never stretch).
function hipSink(u) {
  let sink = 0;
  for (const ph of [0, 0.5]) {
    const [dx, lift] = footAt(u, ph);
    if (lift > 0.05) continue;
    sink = Math.max(sink, LT + LS - Math.sqrt(Math.max(0, (LT + LS) ** 2 - dx * dx)));
  }
  return sink;
}
const socketOf = (S, k) => {
  const [hx, hy] = rel('hip');
  const [ox, oy] = rel(`hip${k}`, 'hip');
  const r = S.tilt * D2R;
  return [hx + S.x + ox * Math.cos(r) - oy * Math.sin(r), hy - S.lift + ox * Math.sin(r) + oy * Math.cos(r)];
};
const ankleGoal = (S, a, k) => {
  const [dx, lift] = footAt(a.mmU ?? 0, k === 'F' ? 0.5 : 0);
  const [x, y] = rel(`ank${k}`);
  // (A planted foot stays put: the body's sway never drags it; only standing, she shifts her feet.)
  return [x + dx * a.walkW + S.x * 0.4 * (1 - a.walkW) + (k === 'N' ? S.stepN : 0), y - lift * a.walkW];
};
// The whole leg: socket, knee (bending forward, never back), ankle. If the ankle's mark is out of
// reach for a moment, the foot goes where the leg can reach, so foot and shin never come apart.
function legOf(S, a, k) {
  const hip = socketOf(S, k);
  const goal = ankleGoal(S, a, k);
  const dx = goal[0] - hip[0];
  const dy = goal[1] - hip[1];
  const d0 = Math.hypot(dx, dy) || 1;
  const d = Math.min(LT + LS - 0.001, Math.max(0.4, d0));
  const ankle = [hip[0] + (dx / d0) * d, hip[1] + (dy / d0) * d];
  const phi = Math.atan2(dy, dx);
  const ang = Math.acos(clamp((LT * LT + d * d - LS * LS) / (2 * LT * d), -1, 1));
  return { hip, knee: [hip[0] + LT * Math.cos(phi - ang), hip[1] + LT * Math.sin(phi - ang)], ankle };
}
// (The legs are solved once a frame; the parts read the solve.)
const legsOf = (S, a) => {
  if (a.mmLegs?.S !== S) a.mmLegs = { S, F: legOf(S, a, 'F'), N: legOf(S, a, 'N') };
  return a.mmLegs;
};
// (A part drawn hanging straight down from its pivot, turned to point from p to q.)
const aim = (p, q) => Math.atan2(-(q[0] - p[0]), q[1] - p[1]);

export const meteorMaidenRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: STRIDE,
  recover: 0.75,
  springs: {
    x: [170, 15], lift: [150, 12], tilt: [110, 10], head: [80, 8.5],
    shF: [110, 10], elF: [120, 10.5], shN: [110, 10], elN: [120, 10.5], pf: [70, 8], stepN: [200, 17],
  },
  fast: ['x', 'lift', 'tilt', 'shN', 'elN', 'shF', 'elF'],
  // (Walking, the body and shoulders follow the step tightly; the elbows and head stay a little
  // looser, so the fists and the head trail each beat and settle.)
  walkStiff: { x: [500, 44], lift: [1400, 75], tilt: [400, 38], head: [260, 28], shN: [320, 32], shF: [320, 32], elN: [200, 22], elF: [200, 22] },
  kick: { tilt: -260, head: 380, x: -40, pf: 200 },
  turnKick: { tilt: 150, head: -150, lift: -30, pf: 260 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 1.13;
    a.mmU = stepPhase(m, a);
    const lu = t % LOOP;
    const calm = a.calm ?? 1;
    const breath = Math.sin(t * 1.8);
    const bumpOut = hold(lu, 1.6, 2, 3.6, 4) * calm;
    const bumpIn = hold(lu, 2.15, 2.45, 3.1, 3.4) * calm;
    const bump = hold(lu, 2.42, 2.5, 2.62, 2.9) * calm;
    const jab1 = hold(lu, 5.2, 5.32, 5.42, 5.6) * calm;
    const jab2 = hold(lu, 5.9, 6.02, 6.12, 6.3) * calm;
    const box = hold(lu, 4.9, 5.1, 6.5, 6.9) * calm;
    const spot = hold(lu, 8.6, 8.9, 11.4, 11.8) * calm;
    const point = hold(lu, 9.2, 9.5, 11.2, 11.6) * calm;
    const cheer = hold(lu, 11.6, 11.8, 12.6, 13.1) * calm;
    const flick = hold(lu, 14.6, 14.75, 15.1, 15.6) * calm;
    const smug = hold(lu, 15, 15.3, 16.4, 16.9) * calm;
    a.mmFront = bumpIn > 0.02 ? 1 : 0;
    a.mmBump = bump;
    a.mmSpot = spot;
    const cheerHop = cheer * Math.abs(Math.sin(t * 9));
    // Standing: the weight shifting slowly from foot to foot.
    const sway = Math.sin(t * 0.55);
    const idle = {
      x: sway * 0.4 + jab1 * 1.2 + jab2 * 1.2,
      lift: -0.5 + breath * 0.18 - bump * 0.8 + cheerHop * 2.4 + box * (Math.abs(Math.sin(t * 7)) * 0.6 - 0.8),
      tilt: sway * 1.4 + breath * 0.5 + box * (2 + Math.sin(t * 7) * 2) + jab1 * 5 + jab2 * 5 - spot * 4 + flick * -8,
      head: -sway * 1.2 + Math.sin(t * 0.7) * 1.6 + bump * 4 - spot * 16 + flick * (lu < 14.9 ? -14 : 10) + cheer * Math.sin(t * 9) * 5,
      shF: 8 + breath * 2 + bumpOut * 34 - bumpIn * 8 + box * 30 + cheer * 114,
      elF: 14 + bumpOut * 20 - bumpIn * 118 + box * 96 - cheer * 36,
      shN: -8 - breath * 2 - bumpOut * 36 + bumpIn * 10 - box * 40 - jab1 * 40 - jab2 * 40 - point * 106 - cheer * 114,
      elN: -16 - bumpOut * 20 + bumpIn * 130 + box * -40 + jab1 * 44 + jab2 * 44 + point * 22 + cheer * 50,
      pf: flick * (lu < 14.9 ? 40 : -26) + cheer * 16 + spot * 6,
      stepN: box * 2 + sway * 0.6,
    };
    // The strut, built from the walk's key poses over one stride (u 0..1, a step each half):
    //   contact  the near heel lands ahead, the far foot pushing off behind (u 0);
    //   down     the weight settles onto the near foot, the body at its lowest (just after);
    //   passing  the far leg swings through under her, the body rising over the planted foot;
    //   up       the highest point, the near heel peeling up, the far leg reaching ahead;
    // then the same on the other foot. Her hips roll over whichever foot is planted, the head rides
    // steadier than the body, and each arm swings against its own leg (back as that foot reaches
    // ahead), the elbow folding as the fist comes forward and the forearm trailing the swing.
    const u = a.mmU ?? 0;
    const p = u * TAU;
    const h = (u * 2) % 1;
    const bob = -Math.cos(TAU * (h - 0.12));
    const roll = Math.sin(p - 0.5);
    // (Her hips sink just as far as her planted feet need, a sharp little bob on top of that; her
    // head rides a beat behind; the heavy gauntlets swing a little against her legs, the elbows
    // trailing.)
    const fold = (v) => (1 - Math.cos(v)) / 2;
    const walk = {
      x: 0.4 + roll * 0.25,
      lift: -hipSink(u) - 0.25 + bobAt(u) * 0.55,
      tilt: 2.5 + roll * 1.4,
      head: -1.5 - roll * 1 + (bobAt(u) - bobAt(u, 0.14)) * 6,
      shF: -4 - Math.cos(p - 0.15) * 18,
      elF: 12 - fold(p - 0.4) * 14,
      shN: -4 + Math.cos(p - 0.15) * 18,
      elN: -16 - fold(p - 0.4 + Math.PI) * 14,
      pf: 8 + Math.sin(p * 2 - 1) * 4,
      stepN: 0,
    };
    // The meteor smash.
    const antic = { x: -2, lift: -3, tilt: -12, head: -8, shF: 50, elF: 20, shN: -168, elN: -24, pf: 34, stepN: -1.4 };
    const strike = { x: 7, lift: -3.4, tilt: 24, head: 10, shF: 70, elF: 30, shN: -24, elN: -4, pf: -14, stepN: 3 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - a.walkW) + walk[k] * a.walkW) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    const shake = a.ph.since > 0.35 && a.ph.since < 1 ? Math.sin(Math.PI * (a.ph.since - 0.35) / 0.65) : 0;
    out.elN += shake * Math.sin(t * 40) * 14;
    if (m.hp <= 0) Object.assign(out, { x: -1, lift: -6, tilt: -14, head: -10, shF: 20, elF: 10, shN: -20, elN: -10, pf: -20 });
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    // Her face.
    let ex = a.face === 'dead' ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
    if (!ex && a.ph.strike > 0.15) ex = 'shout';
    else if (!ex && a.ph.antic > 0.05) ex = 'focus';
    else if (!ex && shake > 0.3) ex = 'ow';
    else if (!ex && a.face === 'angry') ex = 'angry';
    else if (!ex && a.face === 'happy') ex = 'happy';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = bump > 0.3 ? 'happy' : box > 0.4 ? 'focus' : spot > 0.4 ? 'wonder' : cheer > 0.3 ? 'cheer' : smug > 0.3 ? 'smug' : 'idle';
    const P = 2.9 + (m.uid % 7) * 0.35;
    const q = (a.t + (m.uid % 5) * 0.8) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.37) / 1.5);
    const atk = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const gaze = spot > 0.4 ? 'fu' : smug > 0.4 ? 'b' : a.face === 'angry' || atk || box > 0.3 ? 'f' : ['c', 'f', 'c', 'b', 'f', 'c', 'u', 'f'][Math.floor(hash(n + m.uid) * 8)];
    a.mo.rig.mmFace = `${ex}|${!atk ? blink : 0}|${gaze}`;
    a.mmHand = point > 0.4 ? 'point' : cheer > 0.4 ? 'open' : 'fist';
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    const t = a.t + (m.uid % 9) * 1.13;
    for (const [part, j] of [['handN', 'wrN'], ['handF', 'wrF']]) {
      const [hx, hy] = through(matOf(part), j, j);
      const P = 1.7;
      const f = (((t + (part === 'handF' ? 0.8 : 0)) % P) + P) % P / P;
      if (f < 0.7) dot(ctx, a, hx + 0.6 + Math.sin(f * 9) * 1.4, hy + 1 - f * 9, 0.45 * (1 - f), 0.9 * (1 - f / 0.7), '#ffc45e');
    }
    const bump = a.mmBump ?? 0;
    if (bump > 0.05) {
      const [hx, hy] = through(matOf('handN'), 'wrN', 'wrN');
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI / 2 + (i - 3) * 0.45;
        const r = 3 + (1 - bump) * 9;
        sparkle(ctx, a, hx - 2 + Math.cos(ang) * r, hy + 1 + Math.sin(ang) * r, 1.4 * bump, bump, i % 2 ? '#ffe27a' : '#ffffff');
      }
    }
    const spot = a.mmSpot ?? 0;
    if (spot > 0.05) {
      const u = clamp(((t % LOOP) - 8.8) / 1.4, 0, 1);
      const sx = 34 - u * 50;
      const sy = -70 + u * 14;
      sparkle(ctx, a, sx, sy, 2.4, spot * (1 - u * 0.4), '#fff3c8');
      for (let i = 1; i < 6; i++) dot(ctx, a, sx + i * 2.6, sy - i * 0.72, 0.8 - i * 0.12, spot * (1 - i / 6) * 0.8, '#ffe27a');
    }
    // Stars shed off the comet's tip.
    const [tx, ty] = through(matOf('flame1'), 'tip', 'tip');
    for (let i = 0; i < 2; i++) {
      const P = 0.9 + i * 0.3;
      const f = (((t + i * 0.45) % P) + P) % P / P;
      sparkle(ctx, a, tx - 6 - f * 6 + i * 2, ty + 2 + f * 3 - i * 3, 1.2 * (1 - f), 1 - f, '#fff3c8');
    }
    if (a.ph.antic > 0.2) {
      const [hx, hy] = through(matOf('handN'), 'wrN', 'wrN');
      for (let i = 0; i < 4; i++) {
        const ang = t * 6 + (i * TAU) / 4;
        sparkle(ctx, a, hx + Math.cos(ang) * 5, hy + 4 + Math.sin(ang) * 5, 1.2, a.ph.antic, '#ffe27a');
      }
    }
    if (a.ph.since >= 0 && a.ph.since < 0.55) {
      const u = a.ph.since / 0.55;
      const gx = 16;
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI + (i / 7) * Math.PI;
        const r = 3 + u * 16;
        sparkle(ctx, a, gx + Math.cos(ang) * r, -1 + Math.sin(ang) * r * 0.7 + u * u * 6, 1.6 * (1 - u), 1 - u, i % 2 ? '#ffb040' : '#fff3c8');
      }
      puff(ctx, a, gx - 6 - u * 8, -2, 2 + u * 5, 0.6 * (1 - u), '230,214,200');
      puff(ctx, a, gx + 6 + u * 8, -2, 2 + u * 5, 0.6 * (1 - u), '230,214,200');
    }
    // A thud of dust as each heel strikes.
    if (a.walkW > 0.3) {
      for (const k of ['F', 'N']) {
        const q = ((((a.mmU ?? 0) + (k === 'F' ? 0.5 : 0)) % 1) + 1) % 1;
        if (q < 0.22) {
          const [ax] = legsOf(S, a)[k].ankle;
          const u = q / 0.22;
          puff(ctx, a, ax + 1 - u * 3, -1 - u, 1.4 + u * 2.2, 0.45 * (1 - u) * a.walkW, '220,210,220');
        }
      }
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
    // The ponytail swings from its tie; the comet's fire hangs off its tip, lighter, livelier.
    K.layer('pony', { parent: 'head', pivot: 'tie', from: 'neck', rot: (S) => S.pf * 0.5 * D2R, soft: { ...SOFT.HAIR, k: 64, c: 6, gain: 0.6, turn: 0.9, hang: 0.45, max: 30, flutter: 2, hz: 0.5 } }),
    K.layer('flame0', { parent: 'pony', pivot: 'tip', rot: (S) => S.pf * 0.3 * D2R, soft: { k: 58, c: 5, gain: 0.6, turn: 0.85, hang: 0.3, max: 36, flutter: 7, hz: 1.4 } }),
    K.layer('flame1', { parent: 'flame0', pivot: 'tip', from: 'tip', soft: { k: 48, c: 4.6, gain: 0.7, turn: 0.9, hang: 0.3, max: 40, flutter: 10, hz: 2.1 } }),
    K.layer('hairBack', { parent: 'head', pivot: 'neck', from: 'neck' }),
    { ...K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }), alpha: (a) => 1 - (a.mmFront ?? 0) },
    { ...K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }), alpha: (a) => 1 - (a.mmFront ?? 0) },
    { ...K.layer('handF', { parent: 'armFf', pivot: 'wrF' }), s: (a, S, b) => K.piece('handF', a.mmHand === 'open' ? 'open' : 'fist', b), alpha: (a) => 1 - (a.mmFront ?? 0) },
    // Legs: the thigh from the socket to the knee, the shin from the knee to the ankle, the foot
    // rolling heel to toe; all from one solve a frame.
    ...['F', 'N'].flatMap((k) => [
      {
        name: `thigh${k}`,
        parent: null,
        s: (a, S, b) => K.piece(`thigh${k}`, null, b),
        pivot: pv(`hip${k}`),
        at: (S, a) => legsOf(S, a)[k].hip,
        rot: (S, a) => aim(legsOf(S, a)[k].hip, legsOf(S, a)[k].knee),
      },
      {
        name: `shin${k}`,
        parent: null,
        s: (a, S, b) => K.piece(`shin${k}`, null, b),
        pivot: pv(`knee${k}`),
        at: (S, a) => legsOf(S, a)[k].knee,
        rot: (S, a) => aim(legsOf(S, a)[k].knee, legsOf(S, a)[k].ankle),
      },
      {
        name: `foot${k}`,
        parent: null,
        s: (a, S, b) => K.piece(`foot${k}`, null, b),
        pivot: pv(`ank${k}`),
        at: (S, a) => legsOf(S, a)[k].ankle,
        rot: (S, a) => footAt(a.mmU ?? 0, k === 'F' ? 0.5 : 0)[2] * a.walkW * D2R,
      },
    ]),
    K.layer('shorts', { parent: 'torso', pivot: 'shorts', from: 'hip', soft: { ...SOFT.CLOTH, k: 140, max: 5, gain: 0.3 } }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('panL', { parent: 'torso', pivot: 'panL', from: 'hip', soft: { ...SOFT.CLOTH, k: 90, max: 12, gain: 0.5 } }),
    K.layer('panR', { parent: 'torso', pivot: 'panR', from: 'hip', soft: { ...SOFT.CLOTH, k: 96, max: 12, gain: 0.5 } }),
    K.layer('collar', { parent: 'torso', pivot: 'hip' }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.mmFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.mmFace ?? 'idle').split('|')[0], b) },
    K.layer('tie', { parent: 'head', pivot: 'tie', from: 'neck' }),
    { ...K.layer('armFu2', { group: 'armFu', parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }), alpha: (a) => a.mmFront ?? 0 },
    { ...K.layer('armFf2', { group: 'armFf', parent: 'armFu2', pivot: 'elF', rot: (S) => S.elF * D2R }), alpha: (a) => a.mmFront ?? 0 },
    { ...K.layer('handF2', { group: 'handF', parent: 'armFf2', pivot: 'wrF' }), s: (a, S, b) => K.piece('handF', 'fist', b), alpha: (a) => a.mmFront ?? 0 },
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    { ...K.layer('handN', { parent: 'armNf', pivot: 'wrN' }), s: (a, S, b) => K.piece('handN', a.mmHand ?? 'fist', b) },
  ]),
});

export const meteorMaidenStill = K.still;
export { meteorShapes };
