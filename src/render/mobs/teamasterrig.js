// The Grand Kettle, as the Tea Ceremony Master (2026-11-22, the player's pick "C" from the T-pose
// design sheet; replaces the Teapot Spirit, a plain teapot that read like a prop). The Tea Terraces'
// boss, Sencha's old master: a big, round, formal old tanuki, upright and chibi, on the kid base:
//   - head: wide and round, cheek fluff, round ears out to the sides (each twitching on its own),
//     the dark mask round his eyes, a cream muzzle; stern eyes under thick dark brows; his own faces
//     (stern, content, cross, shouting, drowsy, hurt, dizzy);
//   - clothes, all covering, soft shapes shaded by hand: a dark indigo kimono, its white collar
//     crossed at his chest; a black haori with white leaf crests and a white tie cord, each wide
//     sleeve one piece with its arm; a black obi with a red folding fan tucked in; grey striped
//     hakama in deep pleats, one piece from his waist to his ankles, swinging as he walks; white
//     tabi and straw zori stepping out under it;
//   - his soft bushy tail (a lighter underside, a dark tip) swaying behind; the huge black iron
//     kettle (hail-studded, a gold knob) hanging from his near hand by its handle.
//
// How he moves:
//   idle    a 14 s act: a formal tea master's bow; lifts the kettle to his nose and breathes in the
//           brew, eyes shut, content; then a grumpy foot-stamp and a "hmph".
//   walk    the kid walk, slow and dignified, the kettle swinging from his hand, sleeves and tail
//           swaying.
//   fight   his slam (m.special, world/mobs.js): as it winds up he swings the kettle back behind
//           him, steam puffing faster and faster from its spout; then brings it round and crashing
//           down ahead in a burst of steam. A plain swing of the kettle for his ordinary attack.
//   down    sat back, dizzy, the kettle dropped.

import { E, T, F } from './kit.js';
import { W, H, CX, G, BLUSH, band, curve, groups } from './kidbase.js';
import { kidWalk, WALK_STIFF } from './kidwalk.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, smooth, clamp, TAU } from './rig.js';
import { dot } from './rigkit.js';

const TM = 'teamaster';
const SCALE = 2.9;
const HX = CX + 2;
const C = {
  fur: '#b88c66', furSh: '#9a6e52', furLt: '#d8b48c', cream: '#f8ead2', creamSh: '#e8d2b2',
  dark: '#5a4038', darkSh: '#40302c', darkLt: '#7a5a4e', nose: '#2e2228', earIn: '#8e6a5e',
  kimono: '#2c3a6a', kimonoSh: '#222c52', kimonoLt: '#46568e',
  haori: '#2a2a38', haoriSh: '#1e1e2a', haoriLt: '#44445a',
  hakama: '#a8aac0', hakamaSh: '#8a8ca4', hakamaDk: '#6e7088', hakamaLt: '#c8cadc',
  white: '#ffffff', whiteSh: '#dfe3f2', obi: '#1a1622', obiLt: '#4a4658', fan: '#c84a4a', gold: '#f2c14e', goldSh: '#b8862a',
  iron: '#3e3e50', ironSh: '#2a2a38', ironLt: '#666684', stud: '#55556e', studLt: '#7a7a96',
  zori: '#c8a86a', zoriSh: '#a8884e', thong: '#3a3050',
  brow: '#2e2228', mouth: '#7a3a3a', tongue: '#e88a8a',
};

function soft(pts, n = 3) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const a = q[i];
      const b = q[(i + 1) % q.length];
      o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
const blob = (pts, c, n = 3) => T(soft(pts, n), c);

// ---------- The face ----------

const EX = {
  idle: { e: 'narrow', m: 'flat', b: 'stern' },
  calm: { e: 'shut', m: 'smile', b: 'calm' },
  angry: { e: 'glare', m: 'open', b: 'cross' },
  shout: { e: 'wide', m: 'shout', b: 'cross' },
  huff: { e: 'shut', m: 'pout', b: 'cross' },
  sleepy: { e: 'drowsy', m: 'flat', b: 'calm' },
  hurt: { e: 'squeeze', m: 'open', b: 'worried' },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
};
const GAZE = { c: [0, 0], f: [1.2, 0], b: [-1.2, 0], u: [0.3, -1], d: [0.3, 1] };

function tmEye(out, x, y, o, ex, blink, g) {
  let kind = ex.e;
  if ((kind === 'narrow' || kind === 'glare' || kind === 'wide' || kind === 'drowsy') && blink === 2) kind = 'shut';
  const ink = '#1a1218';
  if (kind === 'shut') {
    out.push(...band(curve([[x - 4, y], [x, y + 1.8], [x + 4, y]], 2), 1.4, 1.4, ink, true));
    return;
  }
  if (kind === 'squeeze') {
    out.push(...band([[x + 3.6 * o, y - 2.4], [x - 2.6 * o, y + 0.2], [x + 3.6 * o, y + 2.6]], 1.4, 1.2, ink, true));
    return;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 16; i++) pts.push([x + Math.cos(i * 0.6 * o) * (0.4 + i * 0.24), y + Math.sin(i * 0.6 * o) * (0.4 + i * 0.24)]);
    out.push(...band(pts, 1, 1, ink, true));
    return;
  }
  const [gx, gy] = g;
  const rx = kind === 'wide' ? 4.6 : 4.3;
  const ry = kind === 'wide' ? 5.4 : kind === 'narrow' || kind === 'drowsy' ? 4 : 5;
  // (A warm brown iris ring inside the black, so the eye reads against the dark mask.)
  out.push(F(E(x + gx * 0.4, y + 0.6 + gy * 0.4, rx + 0.7, ry + 0.7, '#f4ece0')), F(E(x + gx * 0.4, y + 0.6 + gy * 0.4, rx, ry, '#6a4030')), F(E(x + gx * 0.4, y + 1 + gy * 0.4, rx * 0.66, ry * 0.7, ink)));
  out.push(F(E(x - 1.4 + gx * 0.4, y - 1.2 + gy * 0.3, 1.7, 1.7, '#ffffff')), F(E(x + 1.6 + gx * 0.4, y + 2.2, 0.8, 0.8, '#ffffff')));
  // The lid: heavy and level when he's stern, half down when drowsy, slanted when cross.
  const lid = kind === 'narrow' ? 0.34 : kind === 'drowsy' ? 0.56 : kind === 'glare' ? 0.3 : 0;
  if (lid > 0) {
    const slope = kind === 'glare' ? 1.6 : 0;
    const top = y - 6.6;
    const ly = y - 6.2 + lid * 9;
    out.push(F(T([[x - 5.8 * o, top], [x + 5.8 * o, top], [x + 5.8 * o, ly - slope], [x - 5.8 * o, ly + slope]], C.dark)), ...band([[x - 5.4 * o, ly + slope], [x + 5.4 * o, ly - slope]], 1.2, 1.2, ink, true));
  }
}
function tmFace(ex, blink, g) {
  const out = [];
  tmEye(out, HX - 10.6, 59.4, -1, ex, blink, g);
  tmEye(out, HX + 10.6, 59.4, 1, ex, blink, g);
  const my = 70;
  const L = C.nose;
  switch (ex.m) {
    case 'smile':
      out.push(...band(curve([[HX - 3.6, my - 0.4], [HX - 1.8, my + 1.4], [HX, my + 0.2], [HX + 1.8, my + 1.4], [HX + 3.6, my - 0.4]], 2), 0.9, 0.9, L, true));
      break;
    case 'open':
      out.push(F(T([[HX - 3, my - 0.6], [HX + 3, my - 0.6], [HX + 2, my + 2.4], [HX - 2, my + 2.4]], C.mouth)), F(E(HX, my + 1.8, 1.4, 0.7, C.tongue)));
      break;
    case 'shout':
      out.push(F(T([[HX - 4, my - 1], [HX + 4, my - 1], [HX + 3, my + 3.6], [HX, my + 4.8], [HX - 3, my + 3.6]], C.mouth)), F(E(HX, my + 3.2, 2, 1.1, C.tongue)), F(T([[HX - 3.4, my - 0.9], [HX + 3.4, my - 0.9], [HX + 3, my + 0.2], [HX - 3, my + 0.2]], '#ffffff')));
      break;
    case 'pout':
      out.push(...band(curve([[HX - 2.6, my + 1.4], [HX, my - 0.2], [HX + 2.6, my + 1.4]], 2), 1, 1, L, true));
      break;
    case 'wobble':
      out.push(...band(curve([[HX - 3.4, my + 0.6], [HX - 1.7, my - 0.4], [HX, my + 0.6], [HX + 1.7, my - 0.4], [HX + 3.4, my + 0.6]], 2), 0.9, 0.9, L, true));
      break;
    default:
      // Stern: a flat line, the corners turned down.
      out.push(...band(curve([[HX - 3.4, my + 1], [HX - 2, my + 0.2], [HX + 2, my + 0.2], [HX + 3.4, my + 1]], 2), 0.9, 0.9, L, true));
  }
  return out;
}
function tmBrows(kind) {
  const P = {
    stern: [[4, 53.4], [9, 51.4], [16, 50.4]],
    cross: [[4, 55.6], [9.6, 52.4], [16, 49.4]],
    calm: [[4, 51.6], [9.6, 49.6], [16, 50.6]],
    worried: [[4, 50.4], [9.6, 51.4], [16, 54]],
  }[kind] ?? [[4, 53.4], [9, 51.4], [16, 50.4]];
  const out = [];
  for (const s of [-1, 1]) out.push(...band(curve(P.map(([x, y]) => [HX + x * s, y]), 2), 3, 1.8, C.brow, true));
  return out;
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 108], neck: [HX, 80], crown: [HX, 38],
  shF: [CX - 13, 86], elF: [CX - 15, 96], wrF: [CX - 15, 105],
  shN: [CX + 14, 86], elN: [CX + 16, 96], wrN: [CX + 17, 105],
  hipF: [CX - 8, 112], kneeF: [CX - 8.4, 124], ankF: [CX - 8.6, G - 8],
  hipN: [CX + 8, 112], kneeN: [CX + 8.4, 124], ankN: [CX + 8.6, G - 8],
  tail: [CX - 10, 110], earF: [HX - 17, 47], earN: [HX + 17, 47],
  hakama: [CX, 102], mouth: [HX, 71],
  // The kettle hangs from the near hand by its handle: the grip at the top of the handle.
  grip: [CX + 17, 109], spout: [CX + 39, 117], kettle: [CX + 17, 130],
};

// The kettle, hanging from the grip: the handle arching up to it, the hail-studded body, the lid and
// its gold knob, the spout out ahead.
function kettle(out) {
  const [gx, gy] = J.grip;
  const cy = gy + 21;
  out.push(...band(curve([[gx - 11, gy + 13], [gx - 8, gy + 3], [gx, gy], [gx + 8, gy + 3], [gx + 11, gy + 13]], 4), 2.2, 2.2, C.ironSh));
  out.push(...band(curve([[gx + 11, cy + 2], [gx + 18, cy - 2], [gx + 21, cy - 7], [gx + 22.4, cy - 9.6]], 3), 6, 3.6, C.iron), F(E(gx + 22.6, cy - 9.8, 1.8, 1.1, C.ironSh)));
  out.push(E(gx, cy, 14, 11, C.iron), F(blob([[gx - 14, cy - 1], [gx - 7, cy - 9], [gx - 5, cy - 6], [gx - 8, cy + 6], [gx - 6, cy + 10], [gx - 12, cy + 6]], C.ironSh, 2)));
  for (let r = 0; r < 3; r++) {
    const yy = cy - 5 + r * 5;
    for (let x = -10 + (r % 2) * 2; x <= 10; x += 4) out.push(F(E(gx + x, yy, 0.9, 0.9, x < -4 ? '#34344a' : C.stud)), F(E(gx + x - 0.3, yy - 0.3, 0.35, 0.35, x < -4 ? '#44445c' : C.studLt)));
  }
  out.push(F(blob([[gx + 5, cy - 7], [gx + 10, cy - 4], [gx + 11, cy + 2], [gx + 8, cy - 2]], C.ironLt, 2)));
  out.push(E(gx, cy - 10.6, 8.6, 2.6, C.ironSh), E(gx, cy - 11.6, 7.8, 2.2, C.iron), E(gx, cy - 13.6, 2, 1.8, C.gold), F(E(gx - 0.6, cy - 14.2, 0.7, 0.5, '#fff3c8')));
}

function teaMasterShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;

  // The tail: a tanuki's, soft and bushy, sweeping out from behind his hip and curling up, fullest in
  // the middle; a softly rounded dark tip, a lighter underside, a little fur notch or two.
  use('tail');
  const R = [CX - 10, 109];
  const M = [CX - 40, 114];
  const Tp = [CX - 35, 88];
  const at = (u) => {
    const v = 1 - u;
    return [v * v * R[0] + 2 * v * u * M[0] + u * u * Tp[0], v * v * R[1] + 2 * v * u * M[1] + u * u * Tp[1]];
  };
  // Its outline: `wf(u)` half wide along it, `to` how far along it goes (the end rounded off).
  const tailPts = (wf, to = 1, n = 22) => {
    const side = (sgn) => Array.from({ length: n + 1 }, (_, i) => {
      const u = (to * i) / n;
      const [x1, y1] = at(Math.max(0, u - 0.02));
      const [x2, y2] = at(Math.min(1, u + 0.02));
      const [x, y] = at(u);
      const l = Math.hypot(x2 - x1, y2 - y1) || 1;
      const w = wf(u);
      return [x + (-(y2 - y1) / l) * w * sgn, y + ((x2 - x1) / l) * w * sgn];
    });
    const [ex, ey] = at(to);
    const [px, py] = at(to - 0.03);
    const l = Math.hypot(ex - px, ey - py) || 1;
    const tip = [ex + ((ex - px) / l) * wf(to) * 0.9, ey + ((ey - py) / l) * wf(to) * 0.9];
    return [...side(1), tip, ...side(-1).reverse()];
  };
  const full = (u) => 3.6 + 7.4 * Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.98));
  // (The whole tail in the dark of its tip, then the fur over all but the tip, ending round.)
  out.push(blob(tailPts(full), C.dark, 2));
  const fur = (u) => full(u) * (u < 0.66 ? 1 : Math.sqrt(Math.max(0, 1 - ((u - 0.66) / 0.14) ** 2)));
  out.push(F(blob(tailPts(fur, 0.8), C.fur, 2)));
  out.push(F(blob(tailPts((u) => fur(u) * 0.55, 0.74).map(([x, y]) => [x + 1.6, y + 1.8]), C.furLt, 2)));
  const [tx, ty] = at(0.92);
  out.push(F(E(tx + 1, ty - 0.4, 2.2, 1.6, C.darkLt)));
  // Two soft notches in the fur on its outer edge.
  for (const u of [0.34, 0.56]) {
    const [x, y] = at(u);
    const [x2, y2] = at(u + 0.02);
    const l = Math.hypot(x2 - x, y2 - y) || 1;
    const nx = -(y2 - y) / l;
    const ny = (x2 - x) / l;
    const w = full(u);
    out.push(F(T([[x + nx * w * 0.7 - (x2 - x) / l * 1.2, y + ny * w * 0.7 - (y2 - y) / l * 1.2], [x + nx * (w + 1.6), y + ny * (w + 1.6)], [x + nx * w * 0.7 + (x2 - x) / l * 1.6, y + ny * w * 0.7 + (y2 - y) / l * 1.6]], C.fur)));
  }
  out.push(...band(curve([at(0.08), at(0.3), at(0.52)], 2), 0.9, 0.5, C.furSh, true));

  // The far arm: the haori's wide sleeve, one piece from the shoulder, hanging past the elbow; the
  // forearm in the kimono's sleeve comes out of its opening; the paw.
  use('armFu');
  out.push(blob([[J.shF[0] - 6.4, J.shF[1] - 4], [J.shF[0] + 5.8, J.shF[1] - 4.6], [J.shF[0] + 6.8, J.shF[1] + 3.6], [J.elF[0] + 6.4, J.elF[1] + 4], [J.elF[0] + 5.6, J.elF[1] + 11.4], [J.elF[0] - 1, J.elF[1] + 13], [J.elF[0] - 6.8, J.elF[1] + 9], [J.shF[0] - 7.2, J.shF[1] + 3]], C.haoriSh));
  out.push(...band(curve([[J.elF[0] - 6, J.elF[1] + 9.6], [J.elF[0] - 1, J.elF[1] + 12], [J.elF[0] + 5, J.elF[1] + 10.6]], 2), 0.8, 0.8, '#14141e', true));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1], 4.2, 4, C.kimonoSh), blob([[J.elF[0] - 4.2, J.elF[1] - 0.6], [J.elF[0] + 4.2, J.elF[1] - 0.6], [J.wrF[0] + 4.4, J.wrF[1] + 0.6], [J.wrF[0] - 4.4, J.wrF[1] + 0.6]], C.kimonoSh, 2));
  use('handF');
  out.push(E(J.wrF[0], J.wrF[1] + 3.4, 4.4, 4, C.darkSh), F(E(J.wrF[0] + 0.6, J.wrF[1] + 4.4, 2, 1.4, C.dark)));

  // Legs, under the hakama: only the white tabi below its hem show as he steps; straw zori.
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx, hy] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    use(`thigh${k}`);
    out.push(blob([[hx - 5, hy - 6], [hx + 5, hy - 6], [kx + 4.6, ky + 2], [kx - 4.6, ky + 2]], far ? C.hakamaDk : C.hakamaSh, 2));
    use(`shin${k}`);
    out.push(blob([[kx - 4.2, ky - 1], [kx + 4.2, ky - 1], [ax + 3.8, ay + 1.4], [ax - 3.8, ay + 1.4]], far ? C.whiteSh : C.white, 2));
    if (!far) out.push(F(blob([[kx - 4, ky], [kx - 2, ky], [ax - 1.8, ay + 1], [ax - 3.6, ay + 1]], C.whiteSh, 1)));
    use(`foot${k}`);
    out.push(blob([[ax - 5.6, ay + 4.4], [ax + 9.6, ay + 4.4], [ax + 10, ay + 7.6], [ax - 6, ay + 7.6]], far ? C.zoriSh : C.zori, 2));
    out.push(blob([[ax - 4.4, ay - 0.6], [ax + 5.6, ay - 0.6], [ax + 8.6, ay + 2.4], [ax + 8, ay + 5], [ax - 4.4, ay + 5]], far ? C.whiteSh : C.white, 2));
    out.push(...band([[ax + 3, ay + 4.6], [ax + 4.4, ay + 1.4]], 0.9, 0.9, C.thong, true), ...band([[ax + 4.4, ay + 1.4], [ax - 1.6, ay + 4.6]], 0.9, 0.9, C.thong, true));
  }

  // The hakama: one piece from his waist to his ankles (it swings on its own), deep pleats down it
  // from the waist, the divide between its legs, the far side in shade.
  use('hakama');
  out.push(blob([[CX - 17.4, 100.6], [CX + 17.4, 100.6], [CX + 21, 117], [CX + 24.4, 139.4], [CX + 12, 140.4], [CX + 1, 139.6], [CX - 1, 139.6], [CX - 12, 140.4], [CX - 24.4, 139.4], [CX - 21, 117]], C.hakama, 2));
  out.push(F(blob([[CX - 17.4, 101.6], [CX - 9, 101.6], [CX - 12.6, 140], [CX - 24, 139.2], [CX - 20.6, 117]], C.hakamaSh, 2)));
  for (const x of [-14, -9, -4, 4, 9, 14]) out.push(...band(curve([[CX + x * 0.95, 103], [CX + x * 1.25, 121], [CX + x * 1.55, 139.4]], 2), 0.6, 1, x < -6 ? C.hakamaDk : C.hakamaSh, true));
  out.push(...band(curve([[CX, 112], [CX + 0.6, 126], [CX + 1, 139.4]], 2), 1, 1.4, C.hakamaDk, true));
  out.push(...band(curve([[CX + 15.6, 104], [CX + 19.6, 120], [CX + 22.6, 138]], 2), 1, 0.8, C.hakamaLt, true));
  out.push(...band(curve([[CX - 23.6, 138.6], [CX - 12, 139.6], [CX, 139], [CX + 12, 139.6], [CX + 23.6, 138.6]], 3), 0.8, 0.8, C.hakamaDk, true));

  // The kimono top, the white collar crossed; the haori's front panels and crests; the tie cord;
  // the obi and the fan.
  use('body');
  out.push(blob([[CX - 14, 80], [CX + 14, 80], [CX + 19, 92], [CX + 19, 105], [CX - 19, 105], [CX - 19, 92]], C.kimono, 2));
  out.push(...band(curve([[CX - 6, 80], [CX - 0.6, 87], [CX + 6.6, 96]], 2), 2.6, 2.6, C.white), ...band(curve([[CX + 7, 80], [CX + 3, 84.6]], 2), 2.6, 2.6, C.white), ...band(curve([[CX - 5, 82], [CX + 0.4, 88.4]], 2), 0.6, 0.6, C.whiteSh, true));
  for (const s of [-1, 1]) {
    const c = s < 0 ? C.haoriSh : C.haori;
    out.push(blob([[CX + 8 * s, 80], [CX + 15 * s, 82], [CX + 20.6 * s, 95], [CX + 20.6 * s, 110], [CX + 13 * s, 111], [CX + 10.6 * s, 95]], c, 2));
    out.push(...band(curve([[CX + 8.6 * s, 81], [CX + 11.6 * s, 96], [CX + 13.4 * s, 110]], 2), 1.2, 1.2, s < 0 ? '#14141e' : C.haoriSh, true));
    out.push(E(CX + 15.6 * s, 88.6, 2.5, 2.5, C.white), F(T([[CX + 15.6 * s, 86.8], [CX + 17 * s, 89.2], [CX + 15.6 * s, 90.6], [CX + 14.2 * s, 89.2]], c)));
  }
  out.push(...band(curve([[CX + 15, 84], [CX + 19.4, 95], [CX + 19.6, 106]], 2), 1, 0.8, C.haoriLt, true));
  out.push(blob([[CX - 11.6, 99.6], [CX + 11.6, 99.6], [CX + 12, 105.4], [CX - 12, 105.4]], C.obi, 2), ...band([[CX - 11, 102.4], [CX + 11, 102.4]], 0.6, 0.6, C.obiLt, true));
  out.push(T([[CX - 8.4, 95], [CX - 4.4, 95], [CX - 5.4, 105], [CX - 7.4, 105]], C.fan), ...band([[CX - 6.4, 95.4], [CX - 6.4, 104]], 0.5, 0.5, C.gold, true));
  out.push(...band(curve([[CX - 8.4, 92], [CX - 3, 94], [CX + 3, 94], [CX + 8.4, 92]], 2), 1, 1, C.white, true), E(CX, 94.4, 1.4, 1.4, C.white), ...band([[CX - 0.6, 95], [CX - 1.6, 98.6]], 0.8, 0.8, C.white, true), ...band([[CX + 0.6, 95], [CX + 1.4, 98.6]], 0.8, 0.8, C.white, true));

  // The head: round, cheek fluff, the dark mask, the muzzle, the nose, blush; the face for the mood.
  use('head');
  out.push(blob([[HX - 26, 57], [HX - 22, 46], [HX - 11, 40], [HX, 39], [HX + 11, 40], [HX + 22, 46], [HX + 26, 57], [HX + 28.4, 67], [HX + 25, 74], [HX + 16, 80], [HX, 82], [HX - 16, 80], [HX - 25, 74], [HX - 28.4, 67]], C.fur));
  for (const s of [-1, 1]) out.push(F(T([[HX + 25.6 * s, 63], [HX + 31 * s, 68.4], [HX + 26 * s, 71.6]], C.fur)), F(T([[HX + 24.6 * s, 70], [HX + 29 * s, 75], [HX + 23 * s, 75.4]], C.fur)));
  out.push(F(blob([[HX - 24, 54], [HX - 18, 46], [HX - 13, 47], [HX - 20, 60], [HX - 23, 72], [HX - 27, 67]], C.furSh, 2)), F(blob([[HX - 8, 43], [HX + 8, 42], [HX + 13, 45], [HX - 6, 46.6]], C.furLt, 2)));
  for (const s of [-1, 1]) out.push(F(blob([[HX + 3.6 * s, 55], [HX + 14 * s, 51], [HX + 19.6 * s, 58], [HX + 15 * s, 67], [HX + 5 * s, 64]], C.dark, 3)));
  out.push(F(blob([[HX - 13, 66], [HX - 4, 62], [HX + 4, 62], [HX + 13, 66], [HX + 12, 74], [HX, 77], [HX - 12, 74]], C.cream, 3)), F(blob([[HX - 13, 70], [HX - 7, 72], [HX - 4, 76.4], [HX - 12, 74.4]], C.creamSh, 2)));
  out.push(F(E(HX, 64.6, 3.2, 2.3, C.nose)), F(E(HX - 0.8, 63.8, 1.1, 0.7, '#8a7a88')));
  for (const s of [-1, 1]) out.push(F(E(HX + 14 * s, 71.4, 3.4, 1.6, BLUSH)));
  out.push(...tmFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c));
  use('brows');
  out.push(...tmBrows(ex.b));
  // Round ears, each with its own swing.
  use('earF');
  out.push(E(HX - 19.4, 43, 6.6, 6.2, C.darkSh), F(E(HX - 19.4, 43.6, 3.6, 3.4, C.earIn)));
  use('earN');
  out.push(E(HX + 19.4, 43, 6.6, 6.2, C.dark), F(E(HX + 19.4, 43.6, 3.6, 3.4, C.earIn)));

  // The near arm: the haori's wide sleeve, one piece from the shoulder; the forearm in the kimono's
  // sleeve; the kettle; the paw round its handle.
  use('armNu');
  out.push(blob([[J.shN[0] - 5.8, J.shN[1] - 4.6], [J.shN[0] + 6.4, J.shN[1] - 4], [J.shN[0] + 7.2, J.shN[1] + 3], [J.elN[0] + 6.8, J.elN[1] + 9], [J.elN[0] + 1, J.elN[1] + 13], [J.elN[0] - 5.6, J.elN[1] + 11.4], [J.elN[0] - 6.4, J.elN[1] + 4], [J.shN[0] - 6.8, J.shN[1] + 3.6]], C.haori));
  out.push(...band(curve([[J.shN[0] - 2, J.shN[1] - 3.8], [J.shN[0] + 4, J.shN[1] - 3.2], [J.shN[0] + 6.8, J.shN[1] + 1]], 2), 1, 0.6, C.haoriLt, true), ...band(curve([[J.shN[0] + 6.4, J.shN[1] + 4], [J.elN[0] + 6.2, J.elN[1] + 8]], 2), 0.9, 0.7, C.haoriLt, true));
  out.push(...band(curve([[J.elN[0] - 5, J.elN[1] + 10.6], [J.elN[0] + 1, J.elN[1] + 12], [J.elN[0] + 6, J.elN[1] + 9.6]], 2), 0.8, 0.8, C.haoriSh, true));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1], 4.2, 4, C.kimono), blob([[J.elN[0] - 4.2, J.elN[1] - 0.6], [J.elN[0] + 4.2, J.elN[1] - 0.6], [J.wrN[0] + 4.4, J.wrN[1] + 0.6], [J.wrN[0] - 4.4, J.wrN[1] + 0.6]], C.kimono, 2));
  out.push(...band(curve([[J.elN[0] + 3, J.elN[1]], [J.wrN[0] + 3.2, J.wrN[1] - 1]], 2), 0.8, 0.6, C.kimonoLt, true));
  use('kettle');
  kettle(out);
  use('handN');
  out.push(E(J.wrN[0], J.wrN[1] + 3.4, 4.4, 4, C.dark), F(E(J.wrN[0] + 0.6, J.wrN[1] + 4.4, 2, 1.4, C.darkLt)));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(TM, teaMasterShapes, J, { scale: SCALE, flat: true });
const { rel, through } = K;
const WK = kidWalk(K, { stride: 26, kick: 3.6, key: 'tm' });
const LOOP = 14;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export const teaMasterRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 26,
  recover: 0.7,
  springs: {
    x: [170, 15], lift: [170, 13], tilt: [130, 11], head: [110, 10], tap: [300, 20],
    shF: [140, 12], elF: [150, 12], shN: [130, 12], elN: [140, 12], hdN: [120, 10], upN: [400, 30], toeN: [400, 30], feet: [200, 18],
  },
  walkStiff: { ...WALK_STIFF, hdN: [200, 20] },
  fast: ['x', 'lift', 'tilt', 'shN', 'elN', 'shF', 'elF'],
  kick: { tilt: -40, head: 60 },
  turnKick: { tilt: 24, head: -30 },
  pose(m, a) {
    const t = a.t + (m.uid % 7) * 1.1;
    WK.step(m, a);
    const st = a.mo.rig;
    const lu = t % LOOP;
    const warn = m.special?.warn > 0 ? 1 - m.special.warn / (m.def.special?.warn ?? 1.5) : 0;
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const calmW = warn > 0 || active || m.cine || m.hp <= 0 ? 0 : a.calm ?? 1;
    const breath = Math.sin(t * 1.4);
    // The act: a bow, the brew's smell, a grumpy stamp.
    const bow = hold(lu, 1, 1.7, 2.9, 3.6) * calmW;
    const sniff = hold(lu, 5, 5.8, 7.8, 8.6) * calmW;
    const stamp = hold(lu, 9.6, 9.9, 11.4, 11.8) * calmW;
    const stomp = stamp * Math.max(0, Math.sin((lu - 9.9) * 6));
    const idle = {
      x: 0,
      lift: breath * 0.3 + bow * -1.4,
      tilt: breath * 0.6 + bow * 5 + sniff * 3 + stamp * -2,
      head: Math.sin(t * 0.45) * 1.4 + bow * 8 + sniff * 6 + stamp * -4,
      tap: 0,
      shF: 6 + breath * 1.2 + bow * -10,
      elF: 10 + bow * -6,
      shN: -6 - breath * 1 + bow * -8 + sniff * -66,
      elN: -10 + sniff * -70,
      hdN: 0,
      upN: stomp * 4, toeN: 0, feet: 0,
    };
    // The kid walk, slow and dignified: an upright back, the head a beat behind, the kettle swinging.
    const p = (a.tmU ?? 0) * TAU;
    const roll = Math.sin(p - 0.5);
    const hb = WK.headBob(a);
    const fold = (v) => (1 - Math.cos(v)) / 2;
    const walk = {
      x: 0.3 + roll * 0.4,
      lift: -WK.sink(a) - 0.6 + WK.bob(a) * 1.2,
      tilt: 1 + roll * 2,
      head: -3 - roll * 1 + hb * 5,
      tap: 0,
      shF: 4 - Math.cos(p - 0.15) * 14,
      elF: 10 - fold(p - 0.4) * 10,
      shN: -4 + Math.cos(p - 0.15) * 10,
      elN: -8 - fold(p - 0.4 + Math.PI) * 8,
      hdN: Math.sin(p - 0.9) * 8,
      upN: 0, toeN: 0, feet: 0,
    };
    // His swing: the kettle swung back behind him, then brought round and down ahead (his face
    // always clear of it).
    const antic = { x: -1.6, lift: 0.6, tilt: -7, head: -4, tap: 0, shF: -16, elF: -10, shN: 74, elN: 16, hdN: 0, upN: 0, toeN: 0, feet: -2 };
    const strike = { x: 3, lift: -1.4, tilt: 9, head: 5, tap: 0, shF: 16, elF: 10, shN: -64, elN: -12, hdN: 0, upN: 0, toeN: 0, feet: 2 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - a.walkW) + walk[k] * a.walkW) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    const lay = (w, pose) => {
      if (w <= 0) return;
      for (const [k, v] of Object.entries(pose)) out[k] = out[k] * (1 - w) + v * w;
    };
    // The slam's wind-up: the kettle swung back behind him, quivering, steam faster and faster.
    if (warn > 0 && a.ph.antic < 0.05) {
      const k = smooth(clamp(warn * 2.4, 0, 1));
      const q = Math.sin(a.now * (10 + warn * 26)) * warn;
      lay(k, { x: -1.4, lift: 0.8, tilt: -6 + q * 1.2, head: -6, shF: -14, elF: -10, shN: 70 + q * 4, elN: 16, hdN: 0, feet: -2 });
    }
    // Down: sat back, dizzy, the kettle dropped beside him.
    if (m.hp <= 0) lay(1, { x: -2, lift: -5, tilt: -10, head: 10, shF: 30, elF: 20, shN: 40, elN: 20, hdN: 60, feet: 4 });
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    // The kettle hangs from his hand: whatever his arm does, it settles back toward straight down,
    // but for the swing of a blow.
    const hang = -(out.tilt + out.shN + out.elN);
    const blow = Math.max(a.ph.antic, a.ph.strike, warn > 0 ? smooth(clamp(warn * 2.4, 0, 1)) : 0);
    out.hdN = hang * (1 - blow) + out.hdN;
    a.tmWarn = warn;
    a.tmBurst = a.ph.since >= 0.04 && a.ph.since < 0.8 && a.ph.strike > 0 ? 1 - (a.ph.since - 0.04) / 0.76 : 0;
    // His face.
    let ex = a.face === 'dead' || m.hp <= 0 ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
    if (!ex && (warn > 0.3 || a.ph.strike > 0.15)) ex = 'shout';
    else if (!ex && (warn > 0 || a.ph.antic > 0.05 || a.face === 'angry')) ex = 'angry';
    else if (!ex && a.face === 'happy') ex = 'calm';
    else if (!ex && a.face === 'sleepy') ex = 'sleepy';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = bow > 0.4 || sniff > 0.4 ? 'calm' : stamp > 0.3 ? 'huff' : 'idle';
    const P = 3.6 + (m.uid % 7) * 0.33;
    const q = (a.t + (m.uid % 5) * 0.8) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.37) / 1.8);
    const atk = active || warn > 0;
    const gaze = sniff > 0.3 ? 'd' : atk || a.face === 'angry' ? 'f' : ['c', 'f', 'c', 'd', 'c', 'b', 'c'][Math.floor(hash(n + m.uid) * 7)];
    st.tmFace = `${ex}|${!atk && ex === 'idle' ? blink : 0}|${gaze}`;
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    const t = a.t;
    const [sx, sy] = through(matOf('kettle'), 'spout', 'grip');
    // Steam curling off the spout always, thicker and faster as the slam winds up.
    const warn = a.tmWarn ?? 0;
    const n = 2 + Math.round(warn * 4);
    for (let i = 0; i < n; i++) {
      const P = 1.6 - warn * 0.8;
      const u = (((t * (1 + warn) + i / n) % P) + P) % P / P;
      dot(ctx, a, sx + 2 + Math.sin(u * 6 + i) * 2.4, sy - 2 - u * (14 + warn * 10), 1.4 + u * (2 + warn * 2), (1 - u) * (0.45 + warn * 0.45), '#f4f6fb');
    }
    // The slam landing: a burst of steam round the kettle.
    if ((a.tmBurst ?? 0) > 0) {
      const [kx, ky] = through(matOf('kettle'), 'kettle', 'grip');
      for (let i = 0; i < 6; i++) {
        const ang = Math.PI + (i / 5) * Math.PI;
        const r = 8 + (1 - a.tmBurst) * 22;
        dot(ctx, a, kx + Math.cos(ang) * r, ky + 6 + Math.sin(ang) * r * 0.5, 2.4 + (1 - a.tmBurst) * 3, a.tmBurst * 0.8, '#f4f6fb');
      }
    }
    if (m.hp <= 0) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        dot(ctx, a, hx + Math.cos(ang) * 14, hy - 4 + Math.sin(ang) * 4, 1.6, 0.9, '#ffe9a0');
      }
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    K.layer('tail', { parent: 'torso', pivot: 'tail', from: 'hip', soft: { ...SOFT.HAIR, k: 55, max: 14, gain: 0.45, hang: 0.3 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    K.layer('handF', { parent: 'armFf', pivot: 'wrF' }),
    ...WK.parts(),
    K.layer('hakama', { parent: 'torso', pivot: 'hakama', from: 'hip', soft: { ...SOFT.CLOTH, max: 8, gain: 0.4 } }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.tmFace ?? 'idle|0|c', b) },
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.tmFace ?? 'idle').split('|')[0], b) },
    K.layer('earF', { parent: 'head', pivot: 'earF', from: 'neck', soft: { ...SOFT.FLAP, k: 150, max: 14, gain: 0.25 } }),
    K.layer('earN', { parent: 'head', pivot: 'earN', from: 'neck', soft: { ...SOFT.FLAP, k: 150, max: 14, gain: 0.25 } }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    K.layer('kettle', { parent: 'armNf', pivot: 'grip', from: 'elN', rot: (S) => S.hdN * D2R }),
    K.layer('handN', { parent: 'armNf', pivot: 'wrN' }),
  ]),
});

export const teaMasterStill = K.still;
export { teaMasterShapes };
