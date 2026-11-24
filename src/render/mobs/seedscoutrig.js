// The Seed Scout (2026-11-24, the player's pick "B" of three; replaces the Puff Spirit as Petal
// Meadow's Dandelion Puff): a little explorer bundled up in a round, fluffy dandelion-clock hood and
// cloak, her butter-blonde bob peeking out, a green tunic with a leaf belt and leaf boots, drifting
// over the meadow under a seed parachute she holds up like an umbrella. Built on the blank kid base
// (blankbase.js): its body under her clothes, on the kid rig (kidrig.js).
//   - hair: the hero's fluffy bob with blunt bangs, butter yellow;
//   - face: her own big round green eyes (a dark top to the iris, a light bottom, two glints) under
//     a real upper lid that lowers for a blink, a squint or sleep, a lash that flicks out at the
//     corner, a soft lower lash; a button nose, blush with little lines, a small round mouth;
//   - clothes, all soft and round: the hood (a clock of round scallops), the cloak (its back to her
//     knees with a hem of seed puffs, two front panels), puffed white sleeves, the tunic, a belt with
//     a gold buckle, a bloom clasp at her neck, round leaf boots with leaf cuffs;
//   - the parachute: a white dome on a long stalk with fine ribs and a rim of puffs; its stalk ends
//     in the seed itself.
// Shading is drawn by hand on every cloth and limb layer, outlines one even tone (kidKit `flat`).
//
// How she moves (a flyer: always drifting, her feet never touch the ground):
//   drift   leaning into the breeze, the parachute tipped forward like a sail, her legs trailing and
//           paddling, the cloak streaming behind, a seed now and then let go from the dome.
//   idle    a 16 s act: plays lookout (leans out into a glide, squints ahead, a startled look back);
//           a gust tugs her up (swaying on the stalk, her free arm flung up, legs swinging, then a
//           laugh); a seed drifts down onto her nose (wide-eyed, cross-eyed, a big sneeze that
//           shakes seeds off the dome, a giggle).
//   attack  a deep breath, cheeks puffed, the parachute hauled back; then she leans in and blows,
//           a spray of seeds flying at you.
//   nap     dozes hanging from the stalk, her head nodding, legs limp.

import { E, T, F } from './kit.js';
import { CX, SKIN, SKIN_SH, BLUSH, band, curve, groups, skull, HS, mapShape, kidHead, blob, ovalPts } from './kidbase.js';
import { BLANK, BLANK_J, blankBase } from './blankbase.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, clamp, TAU } from './rig.js';
import { sparkle } from './rigkit.js';

const SS = 'seedscout';
const HX = CX + 1;
const NECK = 83;
const HY = NECK - 31 * HS;
const INK = '#3a2430';
const SKIN_LT = '#fff4ec';
const SKIN_DK = '#eaa898';
const C = {
  iris: '#5ac47a', irisDk: '#2e8a52', irisLt: '#b8f0c0', pupil: '#1f3a2a',
  lash: INK, low: '#c48a86', mouth: '#9a3a4e', tongue: '#ff8a9e', tear: '#bfe8ff',
  cl: '#f6f3ec', clSh: '#e2ddd0', clDk: '#cfc8b8', clLt: '#ffffff',
  hood: '#fbf8f0', hoodSh: '#ece6d8',
  tunic: '#5aa84a', tunicSh: '#468a3a', tunicLt: '#7cc85a',
  belt: '#a8743a', beltSh: '#8a5a2a', gold: '#ffd23a', goldSh: '#e0a41c',
  boot: '#6ab04c', bootSh: '#4e8e3a', bootDk: '#3f7a2e', cuff: '#8ed46a', cuffSh: '#6ab04c',
  stalk: '#cfc4a8', stalkLt: '#efe7d0', rib: '#e6e0d2', seed: '#b08a5a', seedSh: '#8a6a40',
};
const HAIR = '#ffe9a0';

// ---------- Her face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

// e: the eyes' kind; lid: how far the upper lid is down (0..1); m: the mouth.
const EX = {
  idle: { e: 'open', lid: 0.1, m: 'smile' },
  happy: { e: 'arch', m: 'grin' },
  surprised: { e: 'open', lid: 0, pupil: 'small', m: 'o' },
  wonder: { e: 'open', lid: 0, sparkle: true, m: 'o' },
  focus: { e: 'open', lid: 0.42, m: 'line' },
  tickle: { e: 'open', lid: 0.2, pupil: 'small', m: 'wobble' },
  sneeze: { e: 'squeeze', m: 'sneeze' },
  puff: { e: 'open', lid: 0.34, m: 'puff', cheeks: true },
  blow: { e: 'shut', m: 'blow', cheeks: true },
  angry: { e: 'open', lid: 0.3, slant: 1, m: 'pout' },
  hurt: { e: 'squeeze', m: 'wobble', tear: true },
  dizzy: { e: 'swirl', m: 'wobble' },
  sleep: { e: 'shut', m: 'sleep' },
};
const GAZE = { c: [0, 0], f: [1.4, 0.2], b: [-1.4, 0.2], u: [0.3, -1.5], d: [0.3, 1.2] };

function ssEye(o, ex, blink, gaze) {
  const out = [];
  const x = 13.5 * o;
  const y = 10;
  const w = 6.6;
  const h = 8.8;
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if (kind === 'open' && blink === 1) lid = Math.max(lid, 0.55);
  if (kind === 'open' && blink === 2) kind = 'shut';
  // (P: a point of this eye, `u` toward its outer corner.)
  const P = (u, v) => [x + u * o, y + v];
  if (kind === 'arch') {
    out.push(...band(curve([P(-6.6, 1.8), P(-2.6, -3.6), P(3, -3.8), P(7, 1.4)], 3), 2.3, 2.4, INK, true));
    return out;
  }
  if (kind === 'shut') {
    // Closed: the lash line curving down, a flick at the corner, the lower lash under it.
    out.push(...band(curve([P(-6.8, 0.4), P(-2, 2.8), P(3, 2.8), P(7, 0.2)], 3), 2.1, 2.2, INK, true));
    out.push(...band([P(6.4, 0.6), P(8.8, -1.2)], 1.6, 0.7, INK, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([P(6.6, -4.2), P(-3.2, 0.2), P(6.6, 4.4)], 2.4, 2.1, INK, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.3;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.15]);
    }
    out.push(...band(pts, 1.3, 1.4, INK, true));
    return out;
  }
  const [gx, gy] = gaze;
  out.push(F(E(x, y, w, h, INK)));
  out.push(F(E(x, y + 0.9, w - 1.3, h - 1.6, C.iris)));
  out.push(F(E(x, y - h * 0.34, w - 1.4, h * 0.46, C.irisDk)));
  out.push(F(E(x + gx * 0.2, y + h * 0.5, w * 0.6, h * 0.28, C.irisLt)));
  const ps = ex.pupil === 'small' ? 0.62 : 1;
  out.push(F(E(x + gx + 0.5 * o, y + gy + h * 0.06, w * 0.34 * ps, h * 0.36 * ps, C.pupil)));
  out.push(F(E(x - w * 0.3 + gx * 0.3, y - h * 0.34, w * 0.42, h * 0.3, '#ffffff')), F(E(x + w * 0.36 + gx * 0.2, y + h * 0.42, w * 0.2, h * 0.14, '#ffffff')));
  if (ex.sparkle) {
    const sx = x + w * 0.34;
    const sy = y - h * 0.05;
    out.push(F(T([[sx, sy - 2.2], [sx + 0.55, sy], [sx, sy + 2.2], [sx - 0.55, sy]], '#ffffff')), F(T([[sx - 1.8, sy], [sx, sy - 0.5], [sx + 1.8, sy], [sx, sy + 0.5]], '#ffffff')));
  }
  // The upper lid: skin over the eye down to the lash line (lower toward the nose when she's
  // cross), the lash with its flick at the outer corner, a soft crease; a light lower lash.
  const sl = ex.slant ?? 0;
  const vm = y - h * 1.0 + h * 1.15 * lid;
  const vi = y - h * 0.18 + h * 0.3 * lid + sl * h * 0.38;
  const vo = y - h * 0.32 + h * 0.38 * lid;
  const lash = curve([P(-w * 1.05, vi), P(-w * 0.38, vm + sl * h * 0.3 - 0.4), P(w * 0.5, vm - 0.3), P(w * 1.05, vo)], 4);
  out.push(F(T([...lash, P(w * 1.4, y - h - 6), P(-w * 1.4, y - h - 6)], SKIN)));
  out.push(...band(lash, 2.2, 2.5, C.lash, true));
  out.push(...band([P(w * 0.88, vo - h * 0.06), P(w * 1.42, vo - h * 0.44)], 1.8, 0.7, C.lash, true));
  out.push(...band(curve([P(-w * 0.3, vm - 2.6), P(w * 0.2, vm - 3.2), P(w * 0.7, vm - 2.6)], 2), 0.6, 0.45, SKIN_SH, true));
  out.push(...band(curve([P(-w * 0.62, y + h * 0.84), P(0, y + h * 1.02), P(w * 0.7, y + h * 0.86)], 2), 0.55, 0.45, C.low, true));
  return out;
}

function ssMouth(kind) {
  const my = 23;
  switch (kind) {
    case 'grin':
      return [F(T([[-4.2, my - 0.8], [4.2, my - 1.2], [3, my + 2.6], [0, my + 3.6], [-2.8, my + 2.6]], C.mouth)), F(E(0.3, my + 2, 2, 1, C.tongue)), F(T([[-2.8, my - 0.6], [3, my - 0.9], [2.6, my + 0.3], [-2.4, my + 0.4]], '#ffffff'))];
    case 'o':
      return [F(E(0, my + 0.8, 1.8, 2.1, C.mouth)), F(E(0, my + 1.6, 1, 0.7, C.tongue))];
    case 'line':
      return band(curve([[-2.6, my + 0.9], [0, my + 0.4], [2.8, my + 0.7]], 2), 1.1, 1.1, INK, true);
    case 'wobble':
      return band(curve([[-3.6, my + 1], [-1.8, my - 0.3], [0, my + 1], [1.8, my - 0.3], [3.6, my + 1]], 2), 1, 1, INK, true);
    case 'sneeze':
      return [F(T([[-3.8, my - 1.2], [3.8, my - 1.2], [3, my + 2.8], [0, my + 4.4], [-3, my + 2.8]], C.mouth)), F(E(0, my + 3, 2, 1.1, C.tongue))];
    case 'puff':
      return [F(E(0.4, my + 0.6, 1.4, 1.1, C.mouth)), ...band([[-1.4, my + 0.4], [-0.2, my + 0.9]], 0.6, 0.6, INK, true), ...band([[2.2, my + 0.4], [1, my + 0.9]], 0.6, 0.6, INK, true)];
    case 'blow':
      return [F(E(0.8, my + 0.8, 1.6, 1.8, C.mouth)), F(E(0.8, my + 1.4, 0.8, 0.6, C.tongue))];
    case 'pout':
      return band(curve([[-2.8, my + 1.4], [0, my - 0.1], [2.8, my + 1.4]], 2), 1.1, 1.1, INK, true);
    case 'sleep':
      return [F(E(0, my + 1, 1.2, 1.4, C.mouth))];
    default:
      return band(curve([[-3, my], [0, my + 1.7], [3, my]], 3), 1.1, 1.1, INK, true);
  }
}

function ssFace(ex, blink, gaze, bangShade) {
  const L = [...skull(0, 0)];
  for (const o of [-1, 1]) {
    const big = ex.cheeks ? 1.25 : 1;
    L.push(F(E(19 * o, 21, 5.6 * big, 2.6 * big, BLUSH)));
    for (let k = 0; k < 2; k++) L.push(...band([[19 * o - 1.8 + k * 2.8, 22], [19 * o - 0.8 + k * 2.8, 20.2]], 0.6, 0.6, '#f06a8a', true));
    if (ex.cheeks) L.push(F(E(18 * o, 17.4, 2.2, 1.3, '#ffffff')));
  }
  const g = (o) => (gaze === 'x' ? [-1.6 * o, 0.8] : GAZE[gaze] ?? GAZE.c);
  L.push(...ssEye(-1, ex, blink, g(-1)), ...ssEye(1, ex, blink, g(1)));
  L.push(F(E(0.6, 17, 1.2, 0.8, SKIN_SH)));
  L.push(...ssMouth(ex.m));
  if (ex.tear) for (const o of [-1, 1]) L.push(E(o * 21, 16, 2, 2.8, C.tear), F(E(o * 21 - 0.6, 15, 0.7, 0.9, '#ffffff')));
  const placed = place(L);
  return [...placed.slice(0, 5), ...bangShade, ...placed.slice(5)];
}

// ---------- The drawing ----------

// The base's joints, with her near arm drawn up (holding the parachute's stalk by her cheek) and
// the parachute's own: the grip in her fist, the dome's middle (tip), its rim.
const J = {
  ...BLANK_J,
  shN: [93, 91], elN: [103, 86], wrN: [108, 78],
  grip: [110, 74], tip: [98, 26], seedEnd: [112, 88],
  cape: [HX, 86], panF: [66, 87], panN: [94, 87],
  nose: [HX + 0.4, HY + 17 * HS], mouth: [HX, HY + 24 * HS],
};
const SKINMAP = { [BLANK.lt]: SKIN_LT, [BLANK.base]: SKIN, [BLANK.sh]: SKIN_SH, [BLANK.deep]: SKIN_DK };
const skin = (list) => (list ?? []).map((sh) => ({ ...sh, c: SKINMAP[sh.c] ?? sh.c }));
const BODY = (() => {
  const b = blankBase({ tpose: false, guides: false });
  const g = {};
  for (const [n, list] of Object.entries(b.groups)) g[n] = skin(list);
  return g;
})();
const ring = (x, y, rx, ry, n, a0, a1) => Array.from({ length: n }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / Math.max(1, n - 1);
  return [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
});
const unit = (a, b) => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
};

// An arm on the base's shapes, any way it's drawn: the upper arm, the forearm, a mitten hand; the
// underside shaded, a light down the near arm's top.
function arm(out, use, k, far, withHand = true) {
  const sh = J[`sh${k}`];
  const el = J[`el${k}`];
  const wr = J[`wr${k}`];
  const c = far ? SKIN_SH : SKIN;
  const s = far ? SKIN_DK : SKIN_SH;
  const d1 = unit(sh, el);
  const n1 = [-d1[1], d1[0]];
  const d2 = unit(el, wr);
  const n2 = [-d2[1], d2[0]];
  // (Shade on the side away from her front: for a hanging arm, its back.)
  const sg = -n1[0] + n1[1] >= 0 ? 1 : -1;
  use(`arm${k}u`);
  out.push(E(sh[0], sh[1], 4.4, 4.4, c), ...band([sh, el], 7.4, 6.6, c), ...band([[sh[0] + n1[0] * 2.2 * sg, sh[1] + n1[1] * 2.2 * sg], [el[0] + n1[0] * 2 * sg, el[1] + n1[1] * 2 * sg]], 2, 1.6, s, true));
  // the puffed sleeve over the top of it
  const m = [sh[0] * 0.4 + el[0] * 0.6, sh[1] * 0.4 + el[1] * 0.6];
  out.push(...band([[sh[0] - d1[0] * 1.5, sh[1] - d1[1] * 1.5], m], 9.9, 9, far ? C.clSh : C.clLt));
  out.push(F(E(m[0] - d1[0] * 0.4, m[1] - d1[1] * 0.4, 4.4, 1.5, far ? C.clDk : C.clSh)));
  out.push(...band([[sh[0] + n1[0] * 3.4 * sg, sh[1] + n1[1] * 3.4 * sg], [m[0] + n1[0] * 3 * sg, m[1] + n1[1] * 3 * sg]], 1.6, 1.2, far ? C.clDk : C.clSh, true));
  use(`arm${k}f`);
  out.push(E(el[0], el[1], 3.5, 3.5, c), ...band([el, wr], 6.6, 5.6, c), ...band([[el[0] + n2[0] * 1.8 * sg, el[1] + n2[1] * 1.8 * sg], [wr[0] + n2[0] * 1.6 * sg, wr[1] + n2[1] * 1.6 * sg]], 1.6, 1.4, s, true));
  if (!far) out.push(...band([[el[0] - n2[0] * 2 * sg, el[1] - n2[1] * 2 * sg], [wr[0] - n2[0] * 1.8 * sg, wr[1] - n2[1] * 1.8 * sg]], 1, 0.8, SKIN_LT, true));
  if (!withHand) return;
  hand(out, use, k, far);
}
// Its mitten hand (the near one a fist round the stalk).
function hand(out, use, k, far) {
  const el = J[`el${k}`];
  const wr = J[`wr${k}`];
  const c = far ? SKIN_SH : SKIN;
  const s = far ? SKIN_DK : SKIN_SH;
  const d2 = unit(el, wr);
  const n2 = [-d2[1], d2[0]];
  const sg = -n2[0] + n2[1] >= 0 ? 1 : -1;
  use(`hand${k}`);
  const [hx, hy] = k === 'N' ? J.grip : [wr[0] + d2[0] * 4, wr[1] + d2[1] * 4];
  out.push(E(hx, hy, 4.4, 4.2, c), E(hx - n2[0] * 3 * sg + d2[0] * -1.4, hy - n2[1] * 3 * sg + d2[1] * -1.4, 1.8, 1.7, c), F(E(hx + n2[0] * 0.6 * sg + d2[0] * 1.6, hy + n2[1] * 0.6 * sg + d2[1] * 1.6, 2.4, 1.3, s)));
  if (k === 'N') out.push(...band(curve([[hx - 3, hy - 1.2], [hx, hy - 1.8], [hx + 3, hy - 1]], 2), 0.6, 0.5, s, true), ...band(curve([[hx - 3, hy + 1.2], [hx, hy + 0.8], [hx + 3, hy + 1.4]], 2), 0.6, 0.5, s, true));
}

// A dandelion bloom: a ring of round yellow petals, a deeper heart.
function bloom(out, x, y, r) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    out.push(E(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.3, i % 2 ? '#ffd23a' : '#ffe066'));
  }
  out.push(E(x, y, r * 0.5, r * 0.5, '#f5b51c'), F(E(x - r * 0.15, y - r * 0.2, r * 0.18, r * 0.14, '#fff3b0')));
}

function seedScoutShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'fluffybob', HAIR, 'blunt');

  // The parachute's dome (behind her: the hood sits in front of its rim): a white dome, the fine
  // ribs out from the stalk, a rim of round puffs, a soft shade along its underside, a light.
  use('dome');
  const [tx, ty] = J.tip;
  out.push(T(ovalPts(tx, ty + 1, 22, 17, 0, Math.PI, TAU, 20), '#ffffff'));
  out.push(F(T(ovalPts(tx, ty + 1, 21, 7, 0, Math.PI, TAU, 14), '#f1ede4')));
  for (let i = 1; i < 7; i++) {
    const a = Math.PI + (i / 7) * Math.PI;
    out.push(...band([[tx, ty], [tx + Math.cos(a) * 20, ty + 1 + Math.sin(a) * 15.4]], 0.9, 0.6, C.rib, true));
  }
  for (const p of ring(tx, ty + 1, 21, 4, 11, Math.PI, TAU)) out.push(E(p[0], p[1] + 1.2, 3.2, 2.8, '#f7f4ec'));
  out.push(F(E(tx - 7, ty - 9, 6, 2.8, '#ffffff')), F(E(tx, ty + 0.6, 2.2, 1.6, C.rib)));

  // The cloak's back, falling to her knees, its hem a row of seed puffs.
  use('cloakBack');
  out.push(blob([[58, 84], [104, 84], [110, 108], [112, 123], [50, 123], [52, 108]], C.cl));
  for (let i = 0; i < 8; i++) {
    const x = 53 + i * 8.2;
    out.push(E(x, 123.4 + (i % 2) * 0.6, 4.8, 3.6, i % 2 ? C.cl : C.clSh));
  }
  out.push(F(blob([[58, 88], [66, 88], [62, 110], [56, 121], [52, 118], [54, 106]], C.clSh, 2)), F(E(81, 119, 26, 3.4, C.clSh)));

  // The hood behind her head: a clock of soft scallops round a fluffy dome, shaded low and back.
  use('hoodBack');
  const H = [];
  for (const [x, y] of ring(0, -2, 40, 40, 19, 0, TAU - TAU / 19)) H.push(E(x, y, 8.2, 8, y > 18 ? C.hoodSh : '#ffffff'));
  H.push(E(0, -2, 40, 39, C.hood), F(T(ovalPts(0, -2, 39, 38, 0, Math.PI * 0.55, Math.PI * 1.25, 14).concat(ovalPts(-4, 2, 33, 33, 0, Math.PI * 1.25, Math.PI * 0.55, 14)), C.hoodSh)));
  H.push(F(E(14, -26, 9, 4.6, '#ffffff')));
  out.push(...place(H));

  // The hair behind her head (the bob's back and its crown).
  use('hairBack');
  out.push(...hd.back);

  // The far arm (hanging, in shade), its sleeve.
  arm(out, use, 'F', true);

  // Legs: the base's legs, round leaf boots with leaf cuffs (each shin carries its boot).
  for (const [k, far] of [['F', true], ['N', false]]) {
    use(`thigh${k}`);
    out.push(...BODY[`thigh${k}`]);
    use(`shin${k}`);
    out.push(...BODY[`shin${k}`]);
    const a = J[`ank${k}`];
    const bc = far ? C.bootSh : C.boot;
    const bs = far ? C.bootDk : C.bootSh;
    out.push(blob([[a[0] - 5, a[1] - 3], [a[0] + 6, a[1] - 3], [a[0] + 8.6, a[1] + 3.6], [a[0] + 7.4, a[1] + 7.6], [a[0] - 5.2, a[1] + 7.6], [a[0] - 6.2, a[1] + 3]], bc));
    out.push(F(blob([[a[0] - 5.6, a[1] + 4.6], [a[0] + 8.2, a[1] + 4.6], [a[0] + 7.4, a[1] + 7.4], [a[0] - 5, a[1] + 7.4]], bs, 1)));
    if (!far) out.push(F(E(a[0] + 4.6, a[1] + 1, 2.4, 1.3, C.cuff)));
    out.push(blob([[a[0] - 5.8, a[1] - 4.4], [a[0] + 6.6, a[1] - 4.4], [a[0] + 7.4, a[1] - 0.4], [a[0] + 2, a[1] + 1.2], [a[0] - 6.4, a[1] - 0.4]], far ? C.cuffSh : C.cuff));
    out.push(F(E(a[0] - 2.4, a[1] - 0.8, 3, 1, far ? C.bootDk : C.cuffSh)));
  }

  // Her body (the base's, under the tunic), the tunic, the leaf belt with its gold buckle.
  use('body');
  out.push(...BODY.pelvis, ...BODY.chest, ...BODY.neck);
  out.push(blob([[66, 87], [94, 87], [96, 104], [97, 113], [63, 113], [64, 104]], C.tunic));
  out.push(F(blob([[66, 89], [72, 89], [70, 104], [69, 112], [64, 112], [65, 104]], C.tunicSh, 2)));
  out.push(...band(curve([[93, 90], [95, 101], [96, 110]], 2), 1.4, 1.2, C.tunicLt, true));
  out.push(F(E(80, 111, 16, 2.4, C.tunicSh)));
  out.push(blob([[64, 101], [96, 101], [96.5, 105.4], [63.5, 105.4]], C.belt), F(blob([[64, 104], [96, 104], [96.4, 105.4], [63.6, 105.4]], C.beltSh, 1)));
  out.push(E(80, 103.2, 2.6, 2.4, C.gold), F(E(80.6, 103.8, 1.2, 1, C.goldSh)));

  // The cloak's two front panels over her shoulders.
  use('cloakF');
  out.push(blob([[62, 85], [70, 85], [67, 102], [61, 114], [56, 111]], C.clSh), F(blob([[63, 88], [66, 88], [62, 108], [59, 111]], C.clDk, 2)));
  use('cloakN');
  out.push(blob([[90, 85], [98, 85], [104, 110], [100, 115], [94, 103]], C.cl), ...band(curve([[96, 88], [100, 100], [102, 109]], 2), 1.3, 1, C.clLt, true), F(blob([[90.6, 88], [93, 88], [96.4, 104], [94.6, 104]], C.clSh, 1)));

  // Her head and face, the blunt bangs.
  use('head');
  out.push(...ssFace(ex, Number(blink), gaze, hd.shade));
  use('fringe');
  out.push(...hd.fringe);

  // The bloom clasp at her neck.
  use('clasp');
  bloom(out, HX, NECK + 4, 4.4);

  // The near arm, up, holding the stalk.
  arm(out, use, 'N', false, false);

  // The stalk, from below her fist up to the dome, ending at the bottom in the seed itself.
  use('stalk');
  const [ex2, ey2] = J.seedEnd;
  out.push(...band([[ex2, ey2], [tx, ty + 2]], 2, 1.6, C.stalk), ...band([[ex2 - 0.6, ey2 - 2], [tx - 0.5, ty + 4]], 0.6, 0.5, C.stalkLt, true));
  out.push(blob([[ex2 - 2.2, ey2 - 3], [ex2 + 2.4, ey2 - 3.4], [ex2 + 1.6, ey2 + 3], [ex2 + 0.6, ey2 + 5.6], [ex2 - 1.4, ey2 + 2.6]], C.seed, 2), F(E(ex2 + 0.8, ey2, 0.9, 2, C.seedSh)));
  hand(out, use, 'N', false);

  return { w: 160, h: 150, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(SS, seedScoutShapes, J, { flat: true, cel: new Set(['fringe']) });
const { rel, through } = K;
const LOOP = 16;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function faceOf(m, a, act) {
  const st = a.mo.rig;
  let ex = a.face === 'dead' ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
  if (!ex && a.ph.strike > 0.15) ex = 'blow';
  else if (!ex && a.ph.antic > 0.05) ex = 'puff';
  else if (!ex && act.nap > 0.5) ex = 'sleep';
  else if (!ex && act.face) ex = act.face;
  else if (!ex && a.face === 'angry') ex = 'angry';
  else if (!ex && a.face === 'happy') ex = 'happy';
  else if (!ex && a.face === 'sleep') ex = 'sleep';
  if (!ex) ex = 'idle';
  const P = 2.9 + (m.uid % 7) * 0.37;
  const q = (a.t + (m.uid % 5) * 0.9) % P;
  const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
  const n = Math.floor((a.t + m.uid * 0.37) / 1.4);
  const gaze = act.gaze ?? (a.face === 'angry' || a.ph.atk ? 'f' : ['c', 'f', 'c', 'b', 'u', 'c', 'd', 'f'][Math.floor(hash(n + m.uid) * 8)]);
  const blinks = EX[ex].e === 'open' && !(a.ph.antic > 0.05 || a.ph.strike > 0.05) && act.face !== 'wonder' && act.face !== 'tickle';
  st.ssFace = `${ex}|${blinks ? blink : 0}|${gaze}`;
}

// A dandelion seed in the air: a round white puff on a fine stalk, the little seed at its end.
function seedFx(ctx, x, y, r, al, ang = -Math.PI / 2) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  const ex = x - Math.cos(ang) * r * 2.4;
  const ey = y - Math.sin(ang) * r * 2.4;
  ctx.strokeStyle = '#b9b09a';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.fillStyle = '#a8865a';
  ctx.beginPath();
  ctx.arc(ex, ey, 0.45, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#cdd3de';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

const KEYS = ['x', 'lift', 'tilt', 'head', 'shF', 'elF', 'shN', 'elN', 'br', 'lF', 'kF', 'lN', 'kN', 'cl'];

export const seedScoutRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 24,
  recover: 0.55,
  springs: {
    x: [150, 14], lift: [70, 9], tilt: [110, 10], head: [80, 8],
    shF: [110, 10], elF: [120, 11], shN: [120, 11], elN: [130, 12], br: [90, 9],
    lF: [70, 7], kF: [80, 8], lN: [70, 7], kN: [80, 8], cl: [60, 7],
  },
  fast: ['x', 'tilt', 'head', 'shN', 'elN', 'br'],
  kick: { tilt: -260, head: 380, x: -40, br: -200, lF: 300, lN: 260 },
  turnKick: { tilt: 140, lift: -30, br: 160, cl: 200 },
  pose(m, a) {
    const st = a.mo.rig;
    const t = a.t + (m.uid % 9) * 1.13;
    const dt = Math.max(1e-3, a.dt);
    // How fast she's drifting along, eased (a flyer never stands, so this is her "walk").
    const odo = m.odo ?? 0;
    const raw = Math.min(120, Math.abs(odo - (st.ssOdo ?? odo)) / dt);
    st.ssOdo = odo;
    st.ssV = (st.ssV ?? 0) + (raw - (st.ssV ?? 0)) * Math.min(1, dt * 3);
    const drift = clamp(st.ssV / 22, 0, 1);
    const nap = m.habit?.kind === 'nap' && a.now < m.habit.until ? 1 : 0;
    const calmNow = !a.ph.atk && m.hp > 0 && (a.hurtAgo ?? 9) > 2.5 && !nap ? 1 : 0;
    st.ssCalm = (st.ssCalm ?? 1) + (calmNow - (st.ssCalm ?? 1)) * Math.min(1, dt * 4);
    const cw = st.ssCalm * (1 - drift * 0.6);
    const lu = t % LOOP;
    const look = hold(lu, 0.8, 1.4, 3.5, 4.1) * cw;
    const back = hold(lu, 3.6, 3.75, 4.2, 4.6) * cw;
    const gust = hold(lu, 5.8, 6.05, 8.1, 8.9) * cw;
    const gs = gust * Math.sin((lu - 5.8) * 6.5);
    const laugh = hold(lu, 7.4, 7.7, 8.6, 9.1) * cw;
    const spot = hold(lu, 10.1, 10.5, 12.1, 12.4) * cw;
    const tickle = hold(lu, 12.3, 12.5, 13.1, 13.22) * cw;
    const sneeze = hold(lu, 13.18, 13.26, 13.5, 13.9) * cw;
    const giggle = hold(lu, 13.8, 14.1, 15, 15.6) * cw;
    const gig = giggle * Math.abs(Math.sin(t * 10));
    const bob = Math.pow(Math.abs(Math.sin(t * 1.9)), 0.7);
    const sw = Math.sin(t * 1.7);
    const pad = t * 1.5;
    a.ssAct = { lu, cw, gust, spot, tickle, sneeze, drift, nap };
    const act = {
      nap,
      face: sneeze > 0.3 ? 'sneeze' : tickle > 0.3 ? 'tickle' : spot > 0.3 ? 'wonder' : giggle > 0.3 || laugh > 0.4 ? 'happy' : gust > 0.4 ? 'surprised' : back > 0.4 ? 'surprised' : look > 0.4 ? 'focus' : null,
      gaze: tickle > 0.3 ? 'x' : spot > 0.3 ? (lu < 11.4 ? 'u' : 'c') : back > 0.4 ? 'b' : look > 0.4 ? 'f' : gust > 0.4 ? 'u' : null,
    };
    const idle = {
      x: look * 1 + sneeze * 1.4,
      lift: 1.2 + bob * 1.5 + gust * 4.5 + gs * 1.2 + gig * 0.8 - nap * 1.6,
      tilt: sw * 1.5 + look * 8 - back * 7 + gs * 5 - tickle * 6 + sneeze * 10 + gig * 1.5 - nap * 3,
      head: Math.sin(t * 0.7) * 2 + look * 3 + back * -6 - spot * 12 - tickle * 10 + sneeze * 16 + giggle * Math.sin(t * 9) * 4 - gust * 5 + nap * (14 + Math.sin(t * 0.9) * 3),
      shF: 6 + sw * 3 + gust * 128 + gs * 10 - laugh * 30 + sneeze * 26 + giggle * 14 - nap * 4,
      elF: 10 + gust * 34 + sneeze * 20 + nap * 6,
      shN: sw * 2 + gust * (-8 + gs * 6) - tickle * 6 + sneeze * 8 + nap * 14,
      elN: -gust * 10 + sneeze * 4 + nap * 12,
      br: sw * 2.2 + look * 9 + gs * 16 - tickle * 5 + sneeze * 12 - nap * 9,
      lF: -8 + Math.sin(pad) * 7 + gs * 24 + look * 12 + sneeze * 10 - nap * 6,
      kF: 22 + Math.sin(pad + 0.8) * 9 + gust * 10 + look * 16 + gig * 18 - nap * 12,
      lN: -4 + Math.sin(pad + 2.3) * 7 - gs * 18 + look * 18 + sneeze * 6 - nap * 6,
      kN: 16 + Math.sin(pad + 3.1) * 9 + look * 22 + gig * 22 - nap * 8,
      cl: sw * 2 + gust * (8 + gs * 6) + look * 5,
    };
    // Drifting: leaning into the breeze, the dome tipped forward like a sail, legs trailing behind
    // and paddling, the cloak streaming back.
    const p = t * 4.2;
    const walk = {
      x: 0.6,
      lift: 1.2 + bob * 1.2,
      tilt: 9 + sw * 1.4,
      head: -3 + Math.sin(t * 0.9) * 1.5,
      shF: 18 + Math.sin(p) * 6,
      elF: 18,
      shN: -4,
      elN: 0,
      br: 15 + Math.sin(t * 2.2) * 3,
      lF: 14 + Math.sin(p) * 10,
      kF: 32 + Math.sin(p + 0.8) * 12,
      lN: 22 + Math.sin(p + Math.PI) * 10,
      kN: 38 + Math.sin(p + Math.PI + 0.8) * 12,
      cl: 16 + Math.sin(t * 3) * 3,
    };
    // The attack: a deep breath, cheeks puffed, the dome hauled back and legs tucked; then she leans
    // in and blows, the dome swung forward, legs kicking out behind.
    const antic = { x: -2, lift: 2.8, tilt: -11, head: -9, shF: 34, elF: 30, shN: 10, elN: 12, br: -18, lF: -24, kF: 62, lN: -18, kN: 58, cl: -4 };
    const strike = { x: 4.5, lift: 1.4, tilt: 15, head: 9, shF: 24, elF: 10, shN: -14, elN: -10, br: 30, lF: 24, kF: 20, lN: 28, kN: 24, cl: 16 };
    faceOf(m, a, act);
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of KEYS) out[k] = (idle[k] * (1 - drift) + walk[k] * drift) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    if (m.hp <= 0) Object.assign(out, { x: -1, lift: -2, tilt: -14, head: 14, shF: 12, elF: 24, shN: 30, elN: 30, br: -26, lF: 6, kF: 12, lN: 4, kN: 14, cl: 0 });
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    const base = a.alpha ?? 1;
    const dome = matOf('dome');
    const [tx, ty] = [dome[4], dome[5]];
    const ac = a.ssAct ?? {};
    const tt = a.t + (m.uid % 9) * 1.13;
    // Now and then a seed comes loose from the dome's rim and floats off up and behind her (more
    // of them when she drifts or a gust tugs her).
    const n = 2 + Math.round((ac.drift ?? 0) * 1 + (ac.gust ?? 0) * 3);
    for (let i = 0; i < n; i++) {
      const P = 3.6 + i * 0.7 - (ac.gust ?? 0) * 1.6;
      const k = (tt + i * 1.73) / P;
      const c = Math.floor(k);
      const f = k - c;
      const side = -0.9 + hash(c * 7 + i) * 1.8;
      const x0 = tx + side * 6;
      const y0 = ty - 3 + Math.abs(side) * 1.4;
      const x = x0 - f * (10 + hash(c * 13 + i) * 10 + (ac.drift ?? 0) * 10) + Math.sin(f * 6 + i) * 1.6;
      const y = y0 - f * (8 + hash(c * 3 + i) * 6);
      seedFx(ctx, x, y, 1.15, base * Math.sin(Math.PI * Math.min(1, f * 1.3)) * 0.95);
    }
    // The seed that lands on her nose: drifting down, sitting there, then sneezed away; and the
    // seeds the sneeze shakes off the dome.
    const lu = ac.lu ?? 0;
    if ((ac.cw ?? 0) > 0.4 && lu > 10 && lu < 14.6) {
      const [nx, ny] = through(matOf('head'), 'nose', 'neck');
      let x = nx;
      let y = ny - 1.9;
      let al = 1;
      if (lu < 12.35) {
        const u = clamp((lu - 10) / 2.35, 0, 1);
        const e = 1 - (1 - u) * (1 - u);
        x = nx + (1 - e) * 9 + Math.sin(u * 9) * 2 * (1 - u);
        y = ny - 1.9 - (1 - e) * 22;
        al = Math.min(1, u * 4);
      } else if (lu > 13.22) {
        const u = (lu - 13.22) / 1.3;
        x = nx + u * 22;
        y = ny - 1.9 - u * 10 + Math.sin(u * 8) * 1.5;
        al = 1 - u;
      }
      seedFx(ctx, x, y, 0.75, base * al * ac.cw);
      if (lu > 13.22 && lu < 14.5) {
        const u = (lu - 13.22) / 1.28;
        for (let i = 0; i < 9; i++) {
          const ang = Math.PI + (i / 8) * Math.PI;
          const d = 18 + (1 - (1 - u) * (1 - u)) * (12 + (i % 3) * 5);
          seedFx(ctx, tx + Math.cos(ang) * d, ty + Math.sin(ang) * d * 0.7 + u * 6, 1.1, base * (1 - u) * ac.cw, ang);
        }
      }
    }
    // The blow: a spray of seeds from her lips and the dome's rim, flying out at you.
    const since = a.ph.since;
    if (since >= 0 && since < 0.7 && m.hp > 0) {
      const u = since / 0.7;
      const [mx, my] = through(matOf('head'), 'mouth', 'neck');
      for (let i = 0; i < 14; i++) {
        const from = i % 3 === 0 ? [mx + 2, my] : [tx + 10, ty + 4 + (i % 4)];
        const ang = -0.55 + (i / 13) * 1;
        const d = 3 + (1 - (1 - u) * (1 - u)) * (30 + (i % 4) * 8);
        seedFx(ctx, from[0] + Math.cos(ang) * d, from[1] + Math.sin(ang) * d + Math.sin(u * 7 + i) * 1.6, 1.6 * (1 - u * 0.25), base * (1 - u * u), ang);
      }
    }
    if (m.hp <= 0) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        sparkle(ctx, a, hx + Math.cos(ang) * 6, hy - 2 + Math.sin(ang) * 1.8, 1.4, 0.9, '#ffe9a0');
      }
    }
    ctx.globalAlpha = 1;
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    // (The dome rides on the stalk, drawn behind her; the stalk is drawn in her fist, below.)
    K.layer('dome', { parent: 'stalk', pivot: 'tip', from: 'grip' }),
    K.layer('cloakBack', { parent: 'torso', pivot: 'cape', from: 'hip', rot: (S) => S.cl * D2R, soft: { ...SOFT.CLOTH, max: 20 } }),
    K.layer('hoodBack', { parent: 'head', pivot: 'neck', from: 'neck' }),
    K.layer('hairBack', { parent: 'head', pivot: 'crown', from: 'neck', soft: { ...SOFT.HAIR, max: 5, flutter: 1 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    K.layer('handF', { parent: 'armFf', pivot: 'wrF' }),
    // Dangling legs: the thigh from the hip, the shin and boot from the knee, each a soft pendulum.
    K.layer('thighF', { parent: 'torso', pivot: 'hipF', from: 'hip', rot: (S) => S.lF * D2R, soft: { ...SOFT.LIMB, gain: 0.5, max: 18 } }),
    K.layer('shinF', { parent: 'thighF', pivot: 'kneeF', rot: (S) => S.kF * D2R, soft: { k: 90, c: 6, gain: 0.45, turn: 0.8, hang: 0.4, max: 16 } }),
    K.layer('thighN', { parent: 'torso', pivot: 'hipN', from: 'hip', rot: (S) => S.lN * D2R, soft: { ...SOFT.LIMB, gain: 0.5, max: 18, k: 66 } }),
    K.layer('shinN', { parent: 'thighN', pivot: 'kneeN', rot: (S) => S.kN * D2R, soft: { k: 96, c: 6, gain: 0.45, turn: 0.8, hang: 0.4, max: 16 } }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('cloakF', { parent: 'torso', pivot: 'panF', from: 'hip', rot: (S) => S.cl * 0.6 * D2R, soft: { ...SOFT.CLOTH, max: 14, k: 110 } }),
    K.layer('cloakN', { parent: 'torso', pivot: 'panN', from: 'hip', rot: (S) => S.cl * 0.5 * D2R, soft: { ...SOFT.CLOTH, max: 14, k: 104 } }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.ssFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    K.layer('clasp', { parent: 'torso', pivot: 'neck', from: 'hip' }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    // The stalk is held in her fist but keeps the lean it's given (`br`), whatever her arm does; it
    // nods on its own spring.
    K.layer('stalk', { parent: 'armNf', pivot: 'grip', rot: (S) => (S.br - 0.85 * (S.tilt + S.shN + S.elN)) * D2R, soft: { ...SOFT.PROP, k: 120, c: 7, gain: 0.3, max: 14 } }),
    K.layer('handN', { parent: 'armNf', pivot: 'grip' }),
  ]),
});

export const seedScoutStill = K.still;
export { seedScoutShapes, J as SEED_SCOUT_JOINTS };
