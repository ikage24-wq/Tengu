// The Gargoyle Kid (2026-11-22, replaces the Imp on the Twilight Ruins' Temple Roof): an impish
// little gargoyle who lives on the temple's gutters, with stone bat wings, stone horns, a stone tail
// with a spade on the end, stone boots, a carved collar, and moss growing on her plum tunic. Built
// on the kid base (kidbase.js, kidrig.js) and drawn from scratch: a fluffy lilac bob flipping out at
// the ends under swept bangs, and her own face: rose eyes cut like gems (a faceted octagon, a
// diamond pupil in its table) with flicked-up corners, two tiny fangs. (Remade the same day to the
// approved standard: real hair, every panel a soft shape, hand shading, even outlines, legs that
// kick as she flies.)
//
// How she moves (her signature is turning to stone):
//   fly     heavy stone wings: two hard beats that lift her, then a glide where she sinks a little,
//           legs dangling and swinging, the outer wing lagging each beat, the tail streaming.
//   idle    a 20 s act: blows a raspberry at you; strikes a fierce gargoyle pose and FREEZES into a
//           statue (her face goes to stone, her hands too, nothing moves, dust crumbles off), starts
//           to drop, cracks out with frantic flapping and laughs about it; a huge wing stretch and a
//           yawn; catches her own tail and twirls the spade, smug.
//   attack  rears back with her wings high and her horns lowered, then dives at you horns first,
//           wings swept back; flaps hard to climb out of it, grinning.
//   beaten  her wings stop and she drops, swirly-eyed.

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, petal, groups, skull, HS, mapShape, kidHead, blob } from './kidbase.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, spring, smooth, clamp, TAU } from './rig.js';
import { dot, sparkle } from './rigkit.js';

const GK = 'gargoyle2';
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  st: '#9c9cbc', stSh: '#74749a', stDk: '#52527a', stLt: '#cacae2', groove: '#62628a',
  tunic: '#6c58a2', tunicSh: '#4e3e80', tunicLt: '#9c88ce',
  moss: '#8cc46e', mossSh: '#66a052', mossLt: '#bfe69a',
  hair: '#8f84c8', hairSh: '#6c60a8', hairDk: '#4c4284', hairLt: '#c4bcec',
  iris: '#ff6f86', irisMd: '#ff8ea0', irisDk: '#a8284a', irisLt: '#ffc4d0', pupil: '#4a1430', lash: '#3e2240',
  mouth: '#a83a56', line: '#7e2c48', tongue: '#ff8aa2', tear: '#c4ecff',
  stoneFace: '#c6c4d6', stoneSh: '#a2a0b8', stoneEye: '#ecebf4',
};

// ---------- The face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

const EX = {
  idle: { e: 'open', lid: 0.16, m: 'fangs', b: 'arch' },
  happy: { e: 'arch', m: 'laugh', b: 'up' },
  bleh: { e: 'wink', m: 'bleh', b: 'smug' },
  angry: { e: 'open', lid: 0.2, slant: 0.85, pupil: 'thin', m: 'snarl', b: 'cross' },
  shout: { e: 'open', lid: 0.04, slant: 0.6, pupil: 'thin', m: 'yell', b: 'cross' },
  smug: { e: 'open', lid: 0.44, m: 'cat', b: 'smug' },
  surprised: { e: 'open', lid: 0, pupil: 'small', m: 'o', b: 'up' },
  yawn: { e: 'shut', m: 'yawn', b: 'up' },
  hurt: { e: 'squeeze', m: 'yell', b: 'worried', tear: true },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  sad: { e: 'open', lid: 0.3, m: 'wobble', b: 'worried', tear: true },
  stone: { e: 'stone', m: 'stone', b: 'stone', stone: true },
};
const GAZE = { c: [0, 0], f: [1.7, 0.2], b: [-1.7, 0.2], u: [0.4, -1.5], d: [0.4, 1.3] };

function gkEye(x, y, o, ex, blink, g) {
  const out = [];
  const w = 7;
  const h = 8.6;
  const L = C.lash;
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if (kind === 'wink') kind = o > 0 ? 'arch' : 'open';
  if (kind === 'open' && blink === 2) kind = 'shut';
  if (kind === 'open' && blink === 1) lid = Math.max(lid, 0.66);
  if (kind === 'stone') {
    // A statue's eyes: blank, carved, a groove for the lid.
    out.push(F(E(x, y, w, h, C.stoneSh)), F(E(x, y + 0.6, w - 1.3, h - 1.6, C.stoneEye)));
    out.push(...band(curve([[x - w * 1.05, y - h * 0.5], [x, y - h * 0.95], [x + w * 1.05, y - h * 0.5]], 3), 1.6, 1.6, C.groove, true));
    return out;
  }
  if (kind === 'arch') {
    out.push(...band(curve([[x - w, y + 1.8], [x - w * 0.4, y - h * 0.42], [x + w * 0.4, y - h * 0.42], [x + w, y + 1.8]], 3), 2.5, 2.5, L, true));
    out.push(...band([[x + w * o * 0.95, y + 1.4], [x + w * o * 1.5, y - 0.6]], 1.8, 0.6, L, true));
    return out;
  }
  if (kind === 'shut') {
    out.push(...band(curve([[x - w, y - 0.4], [x - w * 0.3, y + h * 0.32], [x + w * 0.4, y + h * 0.3], [x + w, y - 0.6]], 3), 2.2, 2.6, L, true));
    out.push(...band([[x + w * o * 0.92, y - 0.4], [x + w * o * 1.4, y - 1.6]], 1.8, 0.6, L, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([[x + w * o, y - h * 0.46], [x - w * 0.62 * o, y + 0.3], [x + w * o, y + h * 0.46]], 2.5, 2.2, L, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.33;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]);
    }
    out.push(...band(pts, 1.5, 1.6, L, true));
    return out;
  }
  const [gx, gy] = g;
  // Her eyes are cut like gems: a white eye, and in it a rose octagon with a dark rim, its facets
  // catching the light (dark across the top, bright across the bottom, a flat table in the middle)
  // and a diamond pupil in the table; a big kite of light on one side, a speck on the other.
  const oct = (cx, cy, r, ry = r) => Array.from({ length: 8 }, (_, i) => [cx + Math.cos(Math.PI / 8 + (i * Math.PI) / 4) * r, cy + Math.sin(Math.PI / 8 + (i * Math.PI) / 4) * ry]);
  out.push(F(E(x, y + 0.4, w, h - 0.4, '#fff7fa')), F(E(x, y + h * 0.5, w * 0.8, h * 0.4, '#ffe6ee')));
  const cx = x + gx * 0.7;
  const cy = y + 1 + gy * 0.6;
  const R = 5.9;
  const outer = oct(cx, cy, R + 0.9, R + 1.2);
  const ring = oct(cx, cy, R, R + 0.3);
  const table = oct(cx, cy, R * 0.5, R * 0.55);
  out.push(F(T(outer, C.irisDk)), F(T(ring, C.iris)));
  for (let k = 0; k < 8; k++) {
    const a = ring[k];
    const b = ring[(k + 1) % 8];
    const ta = table[k];
    const tb = table[(k + 1) % 8];
    const mid = Math.sin(Math.PI / 4 + (k * Math.PI) / 4);
    const col = mid < -0.3 ? C.irisDk : mid > 0.3 ? C.irisLt : k % 2 ? C.iris : C.irisMd;
    out.push(F(T([a, b, tb, ta], col)));
  }
  out.push(F(T(table, C.irisMd)));
  const pw = ex.pupil === 'thin' ? 0.9 : ex.pupil === 'small' ? 1 : 1.7;
  const ph = ex.pupil === 'thin' ? 3.6 : ex.pupil === 'small' ? 1.3 : 2.8;
  out.push(F(T([[cx, cy - ph], [cx + pw, cy], [cx, cy + ph], [cx - pw, cy]], C.pupil)));
  const kx = x - w * 0.34 + gx * 0.3;
  const ky = y - h * 0.28 + gy * 0.3;
  out.push(F(T([[kx, ky - 2.6], [kx + 1.7, ky], [kx, ky + 2], [kx - 1.7, ky]], '#ffffff')), F(E(x + w * 0.36, y + h * 0.4, 0.9, 0.8, '#ffffff')));
  // The lid, the lash line flicking UP at the outer corner (an impish cat-eye).
  const sl = ex.slant ?? 0;
  const inner = x - w * 1.12 * o;
  const outerX = x + w * 1.18 * o;
  const yi = y - h * 0.9 + h * 1.8 * lid + sl * h * 0.55;
  const yo = y - h * 0.94 + h * 1.5 * lid - sl * h * 0.12;
  const ym = (yi + yo) / 2 - h * 0.14 * (1 - lid);
  out.push(F(T([[inner, yi], [x, ym], [outerX, yo], [outerX, y - h * 1.7], [inner, y - h * 1.7]], SKIN)));
  // (The eye's round bottom, kept clean: skin below it.)
  out.push(F(T([...Array.from({ length: 13 }, (_, k) => [x + Math.cos((k / 12) * Math.PI) * (w + 0.1), y + 0.4 + Math.sin((k / 12) * Math.PI) * (h - 0.3)]), [x - w - 3, y + h + 5], [x + w + 3, y + h + 5]], SKIN)));
  out.push(...band(curve([[inner, yi + 0.3], [x, ym], [outerX, yo]], 3), 2.4, 2.8, L, true));
  out.push(...band(curve([[outerX - w * 0.12 * o, yo + 0.2], [outerX + w * 0.34 * o, yo - h * 0.18], [outerX + w * 0.5 * o, yo - h * 0.46]], 2), 2.2, 0.6, L, true));
  out.push(...band(curve([[x - w * 0.6 * o, y + h * 0.9], [x + w * 0.3 * o, y + h * 0.98], [x + w * 0.9 * o, y + h * 0.6]], 2), 0.7, 1.1, L, true));
  return out;
}

function gkMouth(kind) {
  const my = 23;
  const L = C.line;
  const fang = (x, y, s = 1) => F(T([[x - 0.9 * s, y], [x + 0.9 * s, y], [x, y + 1.8 * s]], '#ffffff'));
  switch (kind) {
    case 'laugh':
      return [F(T([[-4.8, my - 1.2], [4.8, my - 1.2], [3.6, my + 3.2], [0, my + 4.8], [-3.6, my + 3.2]], C.mouth)), F(E(0, my + 3.2, 2.4, 1.4, C.tongue)), fang(-2.2, my - 1.2), fang(2.2, my - 1.2)];
    case 'bleh':
      return [...band(curve([[-3.6, my + 0.2], [0, my + 1.2], [3.6, my + 0.2]], 2), 1.1, 1.1, L, true), F(T([[-1.6, my + 0.8], [2.4, my + 0.8], [2.6, my + 4.4], [0.4, my + 5.4], [-1.6, my + 4]], C.tongue)), ...band([[0.5, my + 1.6], [0.5, my + 4]], 0.5, 0.4, '#e2607a', true)];
    case 'snarl':
      return [F(T([[-4, my - 0.4], [4, my - 0.4], [3.2, my + 2.6], [-3.2, my + 2.6]], C.mouth)), ...band([[-3.4, my - 0.1], [3.4, my - 0.1]], 1, 1, '#ffffff', true), fang(-2, my), fang(2, my)];
    case 'yell':
      return [F(T([[-4.6, my - 1.4], [4.6, my - 1.4], [3.8, my + 3.4], [0, my + 5.6], [-3.8, my + 3.4]], C.mouth)), F(E(0, my + 4, 2.4, 1.4, C.tongue)), fang(-2.4, my - 1.4), fang(2.4, my - 1.4)];
    case 'cat':
      return [...band(curve([[-4.4, my - 0.4], [-2.2, my + 1.6], [0, my + 0.4], [2.2, my + 1.6], [4.4, my - 0.4]], 2), 1.1, 1.1, L, true), fang(1.6, my + 1)];
    case 'o':
      return [F(E(0, my + 1.2, 1.9, 2.2, C.mouth))];
    case 'yawn':
      return [F(E(0, my + 2, 3.4, 4.2, C.mouth)), F(E(0, my + 4, 2.2, 1.4, C.tongue)), fang(-1.8, my - 1.6, 0.8), fang(1.8, my - 1.6, 0.8)];
    case 'wobble':
      return band(curve([[-4, my + 1], [-2, my - 0.4], [0, my + 1], [2, my - 0.4], [4, my + 1]], 2), 1.1, 1.1, L, true);
    case 'stone':
      return band([[-3.4, my + 0.8], [3.4, my + 0.8]], 1.2, 1.2, C.groove, true);
    default:
      // Her resting grin: a wide closed smile, two tiny fangs poking down.
      return [...band(curve([[-4.2, my - 0.4], [-1.6, my + 1.4], [1.6, my + 1.4], [4.2, my - 0.4]], 3), 1.1, 1.1, L, true), fang(-1.8, my + 1.1, 0.85), fang(1.8, my + 1.1, 0.85)];
  }
}

function gkFace(ex, blink, gaze, bangShade = []) {
  const L = [];
  if (ex.stone) {
    // Turned to stone: a grey carved face, a crack across one cheek.
    L.push(E(-31, 8, 4.4, 6, C.stoneSh), E(31, 8, 4.4, 6, C.stoneFace), E(0, 0, 32, 30.8, C.stoneFace), E(0, 12.6, 29.5, 18.2, C.stoneFace));
    L.push(...band([[14, 16], [18, 19], [17, 23], [21, 25]], 0.9, 0.6, C.groove, true));
  } else {
    L.push(...skull(0, 0).slice(0, 4));
  }
  L.push(...gkEye(-13.5, 10, -1, ex, blink, gaze), ...gkEye(13.5, 10, 1, ex, blink, gaze));
  if (!ex.stone) {
    for (const sx of [-1, 1]) {
      const cx = 16 * sx;
      L.push(F(E(cx, 21, 4.8, 2.3, BLUSH)));
      for (let k = 0; k < 3; k++) L.push(...band([[cx - 2.8 + k * 2.4, 21.8], [cx - 1.7 + k * 2.4, 19.9]], 0.6, 0.6, '#f06a8a', true));
    }
  }
  L.push(...gkMouth(ex.m));
  if (ex.tear) for (const sx of [-1, 1]) L.push(E(sx * 21.4, 16, 2, 2.8, C.tear), F(E(sx * 21.4 - 0.6, 15, 0.7, 0.9, '#ffffff')));
  // (The shadow her bangs cast goes right over the skull, under everything else; grey on stone.)
  const placed = place(L);
  const shade = ex.stone ? bangShade.map((sh) => ({ ...sh, c: C.stoneSh })) : bangShade;
  return [...placed.slice(0, 4), ...shade, ...placed.slice(4)];
}
function gkBrows(kind) {
  if (kind === 'stone') return [];
  const B = [];
  const side = (k) => ({
    arch: [[6, -3.6], [12, -5.6], [17.5, -4.4]],
    up: [[6, -6.4], [12, -7.8], [17.5, -6.6]],
    cross: [[6.4, -0.2], [12, -2.6], [17.5, -5.6]],
    worried: [[6.4, -6.8], [12, -5], [17.5, -2.4]],
  })[k];
  for (const sx of [-1, 1]) {
    // (Smug: one brow cocked high, the other flat.)
    const P = kind === 'smug' ? (sx > 0 ? side('up') : [[6.4, -2], [12, -3], [17.5, -3]]) : side(kind) ?? side('arch');
    B.push(...band(curve(P.map(([x, y]) => [x * sx, y]), 3), 2.6, 1.5, C.hairDk, true));
  }
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 108], neck: [HX, NECK], crown: [HX, 40],
  shF: [CX - 11, 92], elF: [CX - 13, 101], wrF: [CX - 13, 109],
  shN: [CX + 12, 92], elN: [CX + 14, 101], wrN: [CX + 15, 109],
  wingF: [CX - 5, 90], wristF: [CX - 30, 70], wingN: [CX + 7, 90], wristN: [CX + 32, 70],
  hipF: [CX - 6, 112], hipN: [CX + 6, 112],
  g0: [CX - 8, 112], g1: [CX - 22, 121], g2: [CX - 34, 116], g3: [CX - 40, 102],
};
const HANDS = new Set(['open', 'fist', 'stone']);

// One stone wing, root to wrist (the inner part) and wrist to the finger tips (the outer part),
// in the left wing's shape; `s` mirrors it for the right.
function wingInner(out, s, root, wrist, col, sh) {
  const m = (x, y) => [root[0] + (x - J.wingF[0]) * s, y];
  const r0 = root;
  const wr = wrist;
  out.push(blob([r0, m(wr[0], wr[1]), m(CX - 36, 84), m(CX - 26, 90), m(CX - 16, 98)], col, 2));
  out.push(...band([r0, wr], 5.4, 3.6, sh), ...band(curve([r0, m(CX - 16, 76), wr], 3), 1.4, 1, C.stLt, true));
  out.push(...band(curve([m(CX - 24, 76), m(CX - 22, 84), m(CX - 20, 92)], 2), 1, 0.7, C.groove, true));
}
function wingOuter(out, s, root, wrist, col, sh) {
  const m = (x, y) => [root[0] + (x - J.wingF[0]) * s, y];
  const wr = wrist;
  const tips = [m(CX - 50, 56), m(CX - 58, 72), m(CX - 50, 90)];
  out.push(blob([wr, tips[0], m(CX - 47, 69), tips[1], m(CX - 46, 82), tips[2], m(CX - 36, 86)], col, 1));
  for (const tp of tips) out.push(...band([wr, tp], 2.4, 1, sh, true));
  out.push(...band(curve([wr, m(CX - 41, 58), tips[0]], 3), 1.4, 0.8, C.stLt, true));
  out.push(E(wr[0], wr[1], 3, 3, sh), F(E(wr[0] - 0.6 * s, wr[1] - 0.8, 1.2, 1, C.stLt)));
}

function gargoyleShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : 'open';
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'fluffybob', C.hair, 'swept');

  // The tail, three stone segments and a spade on the end.
  const TS = [J.g0, J.g1, J.g2, J.g3];
  const TWD = [7.4, 6.2, 5, 3.8];
  for (let i = 0; i < 3; i++) {
    use(`tail${i}`);
    out.push(E(TS[i][0], TS[i][1], TWD[i] / 2, TWD[i] / 2, C.stSh), ...band([TS[i], TS[i + 1]], TWD[i], TWD[i + 1], C.stSh));
    out.push(...band([[TS[i][0], TS[i][1] - TWD[i] * 0.22], [TS[i + 1][0], TS[i + 1][1] - TWD[i + 1] * 0.22]], 1, 0.8, C.st, true));
    if (i === 2) {
      const [tx, ty] = J.g3;
      out.push(blob([[tx - 0.4, ty - 12], [tx + 6.8, ty - 3.4], [tx + 1, ty + 1.6], [tx - 1.6, ty + 0.4], [tx - 6.8, ty - 2.6]], C.st, 2));
      out.push(F(blob([[tx - 0.4, ty - 11], [tx - 6, ty - 2.6], [tx - 1.6, ty + 0.2], [tx - 0.6, ty - 4]], C.stSh, 2)), ...band([[tx - 0.4, ty - 8.6], [tx + 0.4, ty - 1.4]], 0.8, 0.6, C.groove, true));
    }
  }
  // The wings: far (left) behind everything, near (right) behind her body.
  use('wingFo');
  wingOuter(out, 1, J.wingF, J.wristF, C.stSh, C.stDk);
  use('wingFi');
  wingInner(out, 1, J.wingF, J.wristF, C.stSh, C.stDk);
  use('wingNo');
  wingOuter(out, -1, [J.wingN[0], J.wingN[1]], J.wristN, C.st, C.stSh);
  use('wingNi');
  wingInner(out, -1, [J.wingN[0], J.wingN[1]], J.wristN, C.st, C.stSh);

  // Her hair's back: the fluffy bob behind her head, flipping out in curls at the ends.
  use('hairBack');
  out.push(...hd.back);

  // Far arm.
  use('armFu');
  out.push(blob([[J.shF[0] - 5, J.shF[1] - 2.4], [J.shF[0] + 4.8, J.shF[1] - 2.6], [J.elF[0] + 4.6, J.elF[1] + 1.6], [J.elF[0] - 4.8, J.elF[1] + 1.8]], C.tunicSh));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1], 4.2, 4.2, SKIN_SH), blob([[J.elF[0] - 4.1, J.elF[1] - 0.6], [J.elF[0] + 4.1, J.elF[1] - 0.6], [J.wrF[0] + 3.8, J.wrF[1] + 1], [J.wrF[0] - 3.8, J.wrF[1] + 1]], SKIN_SH, 2));
  out.push(blob([[J.elF[0] - 4.6, J.elF[1] + 0.2], [J.elF[0] + 4.6, J.elF[1] + 0.2], [J.elF[0] + 4.4, J.elF[1] + 3.2], [J.elF[0] - 4.4, J.elF[1] + 3.2]], C.stSh, 2));
  use('handF');
  out.push(E(J.wrF[0], J.wrF[1] + 3.6, 5, 4.6, handKind === 'stone' ? C.stSh : SKIN_SH), E(J.wrF[0] + 3.4, J.wrF[1] + 2, 2, 2, handKind === 'stone' ? C.stSh : SKIN_SH));

  // Dangling legs in stone boots, each swinging from its hip.
  for (const [k, x, far] of [['F', CX - 7, true], ['N', CX + 6, false]]) {
    use(`leg${k}`);
    // (A soft leg running well up under the smock; a round stone boot with a turned-up toe.)
    out.push(blob([[x - 4.2, 104], [x + 4.2, 104], [x + 3.8, G - 17], [x - 3.8, G - 17]], far ? SKIN_SH : SKIN, 2));
    if (!far) out.push(F(blob([[x - 4, 112], [x - 1.8, 112], [x - 1.8, G - 18], [x - 3.6, G - 18]], SKIN_SH, 1)));
    out.push(blob([[x - 6, G - 21], [x + 5.6, G - 21], [x + 6.8, G - 15], [x + 11, G - 13], [x + 10.4, G - 8.4], [x - 5.6, G - 8], [x - 6.8, G - 13]], far ? C.stSh : C.st));
    out.push(F(blob([[x - 6, G - 19], [x - 2.6, G - 19], [x - 2.4, G - 8.6], [x - 5.8, G - 8.6], [x - 6.6, G - 13]], far ? C.stDk : C.stSh, 2)));
    out.push(...band([[x - 5.8, G - 19.6], [x + 5.6, G - 19.6]], 2.6, 2.6, far ? C.stDk : C.stSh, true), F(E(x + 6, G - 14.2, 2.2, 1.1, far ? C.st : C.stLt)));
  }

  // The tunic: a little plum smock, moss growing on its hem and her shoulder, a stone belt.
  use('body');
  out.push(blob([[CX - 12, 83], [CX + 13, 83], [CX + 17, 102], [CX + 15.6, 111], [CX - 15.6, 111], [CX - 17, 102]], C.tunic));
  out.push(F(blob([[CX - 12, 86], [CX - 6, 86], [CX - 7.6, 106], [CX - 15.6, 106], [CX - 16.4, 101]], C.tunicSh, 2)));
  out.push(...band(curve([[CX + 12, 87], [CX + 14.6, 98], [CX + 14.6, 108]], 3), 1.8, 1.8, C.tunicLt, true));
  use('smock');
  out.push(blob([[CX - 16, 103], [CX + 16, 103], [CX + 20.6, 117], [CX + 12, 121], [CX + 2, 119], [CX - 8, 121], [CX - 20.6, 117]], C.tunic));
  out.push(F(blob([[CX - 16, 104], [CX - 8, 104], [CX - 9, 120], [CX - 20, 117]], C.tunicSh, 2)));
  out.push(F(E(CX - 11, 118.6, 5.4, 2.2, C.moss)), F(E(CX - 12, 118, 2.4, 1, C.mossLt)), F(E(CX + 9, 119.2, 6, 2.4, C.moss)), F(E(CX + 13, 118.6, 2.4, 1.2, C.mossSh)));
  use('belt');
  out.push(blob([[CX - 16.6, 102.8], [CX + 16.6, 102.8], [CX + 16.8, 106.4], [CX - 16.8, 106.4]], C.stSh, 2), E(CX + 3, 104.6, 3, 2.8, C.st), F(E(CX + 3, 104.6, 1.4, 1.2, C.stDk)));
  // The carved stone collar, and a stone pauldron on the near shoulder with moss on it.
  use('collar');
  out.push(blob([[CX - 15.6, 83.4], [CX + 16.6, 83.4], [CX + 13.6, 90.4], [CX + 4, 93], [CX - 4, 93], [CX - 13.6, 90.4]], C.st));
  out.push(F(blob([[CX - 15, 84], [CX - 6, 84], [CX - 4, 92.4], [CX - 13, 90]], C.stSh, 2)), ...band(curve([[CX - 10, 88.2], [CX, 89.4], [CX + 11, 88.2]], 2), 0.8, 0.8, C.groove, true));

  // Head: face, fringe, brows, then the near tuft, the stone horns.
  use('head');
  out.push(...gkFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  out.push(...hd.fringe);
  use('brows');
  out.push(...gkBrows(ex.b));
  use('horns');
  // Stubby stone horns: thick at the root, curling out and a little back, a ridge round each.
  for (const s of [-1, 1]) {
    const bx = HX + 12 * s;
    const pts = curve([[bx - 1.6 * s, 43.6], [bx + 1.8 * s, 37], [bx + 5.4 * s, 33.4], [bx + 8.6 * s, 32.6]], 3);
    out.push(E(bx - 0.6 * s, 43, 5.2, 3.4, s < 0 ? C.stSh : C.st), ...band(pts, 9.6, 3.4, s < 0 ? C.stSh : C.st));
    out.push(...band(pts.slice(1, -3).map(([x, y]) => [x - 1.6 * s, y - 1]), 1.6, 1, C.stLt, true));
    out.push(...band(curve([[bx - 3.6 * s, 39.6], [bx + 0.6 * s, 38.4], [bx + 4.4 * s, 40.4]], 2), 0.9, 0.9, C.groove, true));
  }

  // The near arm: a stone pauldron over the sleeve, a stone cuff, her hand.
  use('armNu');
  out.push(blob([[J.shN[0] - 4.8, J.shN[1] - 2.6], [J.shN[0] + 5, J.shN[1] - 2.4], [J.elN[0] + 4.8, J.elN[1] + 1.8], [J.elN[0] - 4.6, J.elN[1] + 1.6]], C.tunic));
  out.push(blob([[J.shN[0] - 5.4, J.shN[1] + 1], [J.shN[0] - 3.6, J.shN[1] - 4.6], [J.shN[0] + 3, J.shN[1] - 6], [J.shN[0] + 7.4, J.shN[1] - 1.6], [J.shN[0] + 6.6, J.shN[1] + 3.6], [J.shN[0], J.shN[1] + 4.6]], C.st), F(E(J.shN[0] + 2.6, J.shN[1] - 3.4, 3, 1.4, C.moss)), F(E(J.shN[0] + 3.6, J.shN[1] - 3.8, 1.2, 0.6, C.mossLt)), F(E(J.shN[0] - 1, J.shN[1] + 2.4, 4.6, 1.4, C.stSh)));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1], 4.2, 4.2, SKIN), blob([[J.elN[0] - 4.1, J.elN[1] - 0.6], [J.elN[0] + 4.1, J.elN[1] - 0.6], [J.wrN[0] + 3.8, J.wrN[1] + 1], [J.wrN[0] - 3.8, J.wrN[1] + 1]], SKIN, 2));
  out.push(blob([[J.elN[0] - 4.6, J.elN[1] + 0.2], [J.elN[0] + 4.6, J.elN[1] + 0.2], [J.elN[0] + 4.4, J.elN[1] + 3.2], [J.elN[0] - 4.4, J.elN[1] + 3.2]], C.st, 2), F(E(J.elN[0] + 1.6, J.elN[1] + 1, 1.6, 0.6, C.stLt)));
  use('handN');
  const hc = handKind === 'stone' ? C.st : SKIN;
  if (handKind === 'fist') out.push(E(J.wrN[0], J.wrN[1] + 3.4, 5, 4.6, hc), ...band(curve([[J.wrN[0] - 3.4, J.wrN[1] + 4.4], [J.wrN[0], J.wrN[1] + 5.8], [J.wrN[0] + 3.4, J.wrN[1] + 4.6]], 2), 0.8, 0.8, SKIN_SH, true));
  else out.push(E(J.wrN[0], J.wrN[1] + 3.8, 5.2, 4.8, hc), E(J.wrN[0] + 3.6, J.wrN[1] + 2, 2.1, 2.1, hc), ...band([[J.wrN[0] - 1.6, J.wrN[1] + 7.6], [J.wrN[0] + 2.2, J.wrN[1] + 7.6]], 0.6, 0.6, handKind === 'stone' ? C.stSh : SKIN_SH, true));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(GK, gargoyleShapes, J, { flat: true, cel: new Set(['hairBack', 'fringe']) });
const { rel, through } = K;
const LOOP = 20;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function flightOf(m, a) {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(160, Math.abs(odo - (st.gkOdo ?? odo)) / dt);
  st.gkOdo = odo;
  st.gkV = (st.gkV ?? 0) + (raw - (st.gkV ?? 0)) * Math.min(1, dt * 4);
  return spring(st, '_fly', clamp((st.gkV - 4) / 18, 0, 1), 30, 11, dt);
}
// Heavy stone wings: a beat is a hard downstroke and a slower recovery. Over one cycle: two beats,
// then a glide with the wings held out. Returns [wing angle (down +), lift].
function wingCycle(p, glideShare) {
  const beatEnd = 1 - glideShare;
  const beat = (u) => (u < 0.38 ? -32 + 72 * smooth(u / 0.38) : 40 - 72 * smooth((u - 0.38) / 0.62));
  if (p < beatEnd) {
    const u = (p / beatEnd) * 2;
    const k = u % 1;
    const rise = (Math.floor(u) + smooth(k)) / 2;
    return [beat(k), rise];
  }
  const g = (p - beatEnd) / glideShare;
  return [-8 + Math.sin(g * Math.PI) * 4, 1 - smooth(g)];
}

export const gargoyleRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 40,
  recover: 0.7,
  springs: {
    x: [150, 14], lift: [120, 12], tilt: [110, 11], head: [80, 8], flap: [420, 26], fold: [160, 12],
    shF: [130, 11], elF: [140, 12], shN: [130, 11], elN: [140, 12], hdN: [160, 12], tw: [60, 7], lgF: [110, 10], lgN: [110, 10],
  },
  fast: ['x', 'lift', 'tilt', 'shN', 'elN', 'shF', 'elF', 'fold'],
  kick: { tilt: -300, head: 420, x: -50, flap: -600 },
  turnKick: { tilt: 150, head: -150, lift: -30, flap: 300 },
  pose(m, a) {
    const t = a.t + (m.uid % 9) * 0.97;
    const fly = flightOf(m, a);
    const st = a.mo.rig;
    const atk = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const calm = spring(st, '_gkCalm', fly < 0.3 && !atk && m.hp > 0 && (a.hurtAgo ?? 9) > 3 ? 1 : 0, 30, 11, a.dt);
    const lu = t % LOOP;
    // Her act.
    const bleh = hold(lu, 1.4, 1.7, 3.2, 3.6) * calm;
    const pose = hold(lu, 5, 5.35, 8.7, 8.72) * calm;
    const statue = hold(lu, 5.4, 5.42, 8.7, 8.72) * calm;
    const sink = statue * smooth(clamp((lu - 8.1) / 0.6, 0, 1));
    const crack = hold(lu, 8.7, 8.76, 9.5, 9.9) * calm;
    const laugh = hold(lu, 9.5, 9.8, 10.8, 11.3) * calm;
    const stretch = hold(lu, 12.2, 12.9, 14.2, 14.9) * calm;
    const tail = hold(lu, 16, 16.6, 18.4, 19) * calm;
    a.gkStatue = statue;
    a.gkCrack = crack;
    // The wings: hovering, a slow cycle (1.6 s) gliding half of it; flying, a quicker one; frozen
    // in the statue; frantic when she cracks out.
    const cyc = 1.6 - fly * 0.5 - crack * 1.1;
    const st2 = st;
    st2.gkP = ((st2.gkP ?? 0) + a.dt / Math.max(0.3, cyc) * (1 - statue)) % 1;
    const [wa, rise] = wingCycle(st2.gkP, 0.5 - fly * 0.2 - crack * 0.4);
    const breath = Math.sin(t * 1.6) * (1 - statue);
    const idle = {
      x: 0,
      lift: 5 + rise * 2.2 - pose * 0.8 - sink * 5 + crack * 2 + laugh * Math.abs(Math.sin(t * 10)) * 1.2,
      tilt: breath * 0.6 + pose * 8 + crack * Math.sin(t * 30) * 3 - stretch * 5 + bleh * -3 + laugh * Math.sin(t * 8) * 3,
      head: Math.sin(t * 0.6) * 2 * (1 - statue) - pose * 6 + bleh * 10 - stretch * 12 + crack * -8 + laugh * Math.sin(t * 9) * 6,
      flap: wa * (1 - pose) + pose * -38 - stretch * 30 + crack * 0,
      fold: pose * -20 + stretch * -24,
      shF: 10 + breath * 3 + pose * 92 + stretch * 118 + tail * 52 + crack * 70 + laugh * 20,
      elF: 16 + pose * 70 + stretch * 8 + tail * 26 + crack * 40,
      shN: -10 - breath * 3 - pose * 96 - stretch * 120 - bleh * 40 + crack * -70 - laugh * 50,
      elN: -18 - pose * 66 - stretch * 8 - bleh * 100 - crack * 40 - laugh * 110,
      hdN: -pose * 20 + bleh * 20,
      tw: 6 + Math.sin(t * 1.1) * 5 * (1 - statue) + tail * (18 + Math.sin(t * 5) * 10) + pose * 14,
      lgF: (Math.sin(t * 1.7) * 9 - rise * 6) * (1 - statue) + pose * 14 + crack * Math.sin(t * 22) * 22 + laugh * Math.sin(t * 9) * 16 - stretch * 8,
      lgN: (Math.sin(t * 1.7 + 2.2) * 9 - rise * 8) * (1 - statue) - pose * 10 + crack * Math.sin(t * 22 + 2) * 22 + laugh * Math.sin(t * 9 + 2) * 16 - stretch * 4,
    };
    // Flying: leaning into it, legs trailing, tail streaming.
    const go = { x: 0.6, lift: 5 + rise * 2.6, tilt: 12, head: -6, flap: wa, fold: 0, shF: -20, elF: -30, shN: 30, elN: -40, hdN: 0, tw: 2, lgF: 18 + Math.sin(t * 7) * 10, lgN: 24 + Math.sin(t * 7 + 2.6) * 10 };
    // The dive: rearing back, wings high, horns lowered; then horns first, wings swept back.
    const antic = { x: -3, lift: 9, tilt: -14, head: 10, flap: -44, fold: -18, shF: 40, elF: 30, shN: 40, elN: -30, hdN: 0, tw: 20, lgF: -26, lgN: -34 };
    const strike = { x: 8, lift: 3, tilt: 34, head: 16, flap: 34, fold: 26, shF: -60, elF: -20, shN: 60, elN: -20, hdN: 0, tw: -4, lgF: 30, lgN: 38 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - fly) + go[k] * fly) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    if (m.hp <= 0) Object.assign(out, { lift: 1, tilt: -12, head: 10, flap: 30, fold: 30, shF: 60, elF: 20, shN: -60, elN: -20, tw: 0, lgF: -12, lgN: 8 });
    out.elN = clamp(out.elN, -150, 0);
    out.elF = clamp(out.elF, -150, 150);
    // Her face.
    let ex = a.face === 'dead' ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
    if (!ex && a.ph.strike > 0.15) ex = 'shout';
    else if (!ex && a.ph.antic > 0.05) ex = 'angry';
    else if (!ex && a.face === 'angry') ex = 'angry';
    else if (!ex && a.face === 'happy') ex = 'happy';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = statue > 0.5 ? 'stone' : pose > 0.5 ? 'angry' : crack > 0.4 ? 'surprised' : laugh > 0.3 ? 'happy' : bleh > 0.4 ? 'bleh' : stretch > 0.4 ? 'yawn' : tail > 0.4 ? 'smug' : 'idle';
    const P = 2.5 + (m.uid % 7) * 0.33;
    const q = (a.t + (m.uid % 5) * 0.8) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.41) / 1.2);
    const gaze = tail > 0.4 ? 'b' : crack > 0.4 ? 'd' : a.face === 'angry' || atk ? 'f' : ['c', 'f', 'b', 'c', 'u', 'f', 'd', 'c'][Math.floor(hash(n + m.uid) * 8)];
    st.gkFace = `${ex}|${EX[ex].e === 'open' && !atk ? blink : 0}|${gaze}`;
    a.gkHand = statue > 0.5 ? 'stone' : a.ph.strike > 0.2 || pose > 0.4 ? 'fist' : 'open';
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    // Dust crumbling off her while she's a statue, a burst of grit as she cracks out, and stone
    // crumbs knocked off on the dive; stars round her head when she's beaten.
    const t = a.t + (m.uid % 9) * 0.97;
    if ((a.gkStatue ?? 0) > 0.5) {
      for (let i = 0; i < 4; i++) {
        const P = 0.9;
        const f = (((t + i * 0.37) % P) + P) % P / P;
        dot(ctx, a, -8 + hash(Math.floor((t + i * 0.37) / P) * 7 + i) * 16, -18 + f * 18, 0.6, 1 - f, '#9a98b4');
      }
    }
    const burst = Math.max(a.gkCrack ?? 0, a.ph.since >= 0 && a.ph.since < 0.4 ? 1 - a.ph.since / 0.4 : 0);
    if (burst > 0.05) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU + 0.4;
        const r = 6 + (1 - burst) * 8;
        dot(ctx, a, hx + Math.cos(ang) * r, hy + 8 + Math.sin(ang) * r * 0.8, 0.7, burst, i % 2 ? '#c8c8de' : '#8f8eae');
      }
    }
    if (m.hp <= 0) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 6, hy - 4 + Math.sin(ang) * 1.8, 1.4, 0.9, '#ffe9a0');
      }
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    K.layer('tail0', { parent: 'torso', pivot: 'g0', from: 'hip', rot: (S) => S.tw * 0.5 * D2R, soft: { k: 100, c: 8, gain: 0.35, turn: 0.6, max: 12 } }),
    K.layer('tail1', { parent: 'tail0', pivot: 'g1', rot: (S) => S.tw * 0.8 * D2R, soft: { k: 75, c: 6.5, gain: 0.45, turn: 0.75, max: 18 } }),
    K.layer('tail2', { parent: 'tail1', pivot: 'g2', rot: (S) => S.tw * D2R, soft: { k: 58, c: 5.5, gain: 0.5, turn: 0.85, max: 24 } }),
    // Wings: the inner part turned by the beat, the outer lagging behind it on its own.
    K.layer('wingFi', { parent: 'torso', pivot: 'wingF', from: 'hip', rot: (S) => -S.flap * D2R }),
    K.layer('wingFo', { parent: 'wingFi', pivot: 'wristF', rot: (S) => -(S.flap * 0.35 + S.fold) * D2R, soft: { k: 150, c: 9, gain: 0.3, turn: 0.9, max: 22 } }),
    K.layer('wingNi', { parent: 'torso', pivot: 'wingN', from: 'hip', rot: (S) => S.flap * D2R }),
    K.layer('wingNo', { parent: 'wingNi', pivot: 'wristN', rot: (S) => (S.flap * 0.35 + S.fold) * D2R, soft: { k: 150, c: 9, gain: 0.3, turn: 0.9, max: 22 } }),
    K.layer('hairBack', { parent: 'head', pivot: 'neck', from: 'neck', soft: { ...SOFT.HAIR, k: 70, max: 8, gain: 0.3, hang: 0.5 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    { ...K.layer('handF', { parent: 'armFf', pivot: 'wrF' }), s: (a, S, b) => K.piece('handF', a.gkHand === 'stone' ? 'stone' : 'open', b) },
    K.layer('legF', { parent: 'torso', pivot: 'hipF', from: 'hip', rot: (S) => S.lgF * D2R, soft: { ...SOFT.LIMB, k: 55, max: 30 } }),
    K.layer('legN', { parent: 'torso', pivot: 'hipN', from: 'hip', rot: (S) => S.lgN * D2R, soft: { ...SOFT.LIMB, k: 62, max: 30 } }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('smock', { parent: 'torso', pivot: 'hip', soft: { ...SOFT.CLOTH, max: 10 } }),
    K.layer('belt', { parent: 'torso', pivot: 'hip' }),
    K.layer('collar', { parent: 'torso', pivot: 'hip' }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.gkFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.gkFace ?? 'idle').split('|')[0], b) },
    K.layer('horns', { parent: 'head', pivot: 'neck', from: 'neck' }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    { ...K.layer('handN', { parent: 'armNf', pivot: 'wrN', rot: (S) => S.hdN * D2R }), s: (a, S, b) => K.piece('handN', a.gkHand ?? 'open', b) },
  ]),
});

export const gargoyleStill = K.still;
export { gargoyleShapes };
