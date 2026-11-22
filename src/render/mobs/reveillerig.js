// The Alarm, as Madame Reveille (2026-11-22, the player's pick from the concept sheet; replaces "the
// Big Ring"): the Queen's alarm clock grown into a prim, bossy lady who means to ring her back to
// Monday. Her two gold alarm bells are her hair buns, a little hammer on a spring between them;
// pink hair in two long ringlet drills, parted bangs; a rose dress with a clock-face apron, a bell brooch at her collar, white
// stockings, red buckled shoes; a white conductor's baton with a bell on its tip; a monocle with a
// tiny clock on its rim. Built on the kid base (kidbase.js, kidrig.js) at a boss's size, every part
// re-drawn at that size; her own face: strict amber almond eyes that keep time (each iris a little
// clock dial, ticks at twelve, three, six and nine, the pupil its pin), heavy lids, three-lash
// corners, brows arched high, lips pursed. (Remade the same day to the approved standard: real hair,
// every panel a soft shape, hand shading, even outlines, and the kid walk: knees, heels, the hips
// sinking into each step.)
//
// How she moves:
//   idle    a 14 s act: conducts the seconds with her baton like a metronome, head ticking side to
//           side in time; taps her foot, hand on her hip, and tuts; raps her own bell bun with the
//           baton, a sharp little ring and a satisfied nod.
//   walk    prim little steps (the kid walk), chin up, the baton swinging on the beat.
//   attack  (scenes) a rap of the baton.
//   trial   (world/story.js QUEENS.alarm, m.castMove) Wake-Up Ring: baton up, then rapping both bells
//           (m.ringAt); Tick, Tock: conducting the clock hands down, baton high, then a downbeat;
//           Bell Clang: the baton cracked down on the floor; IT'S MONDAY!: flung arms, a shout,
//           every bell going at once.
//   snooze  (m.snoozeUntil) nods off on her feet, head sinking, baton drooping, z's; then jolts
//           awake, LOUDER (m.loud) and crosser each time.
//   freed   cross to the very end, then she fades (the Queen flicks her).

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, groups, skull, HS, mapShape, kidHead, blob } from './kidbase.js';
import { kidWalk, WALK_STIFF } from './kidwalk.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, smooth, clamp, TAU } from './rig.js';
import { sparkle, dot } from './rigkit.js';

const RV = 'reveille2';
const SCALE = 3;
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  hair: '#ff9cbc', hairSh: '#e0709a', hairDk: '#b44a76', hairLt: '#ffd4e2',
  gold: '#ffd35c', goldSh: '#e0a83a', goldDk: '#b07a22', goldLt: '#fff0b0',
  dress: '#ee6f86', dressSh: '#c84c66', dressLt: '#ffa6b6', apron: '#fffaf2', apronSh: '#ecdcd4',
  stock: '#ffffff', stockSh: '#e4e0ec', shoe: '#c43a58', shoeSh: '#962a44',
  baton: '#ffffff', batonSh: '#d8d4e4',
  iris: '#ff9a3a', irisDk: '#b4520e', irisLt: '#ffe0b8', lash: '#4a2230',
  mouth: '#a83a50', line: '#86304a', tongue: '#ff8a9e', ink: '#5a4060',
};

// ---------- The face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));

const EX = {
  idle: { e: 'open', lid: 0.34, m: 'prim', b: 'stern' },
  tut: { e: 'shut', m: 'tut', b: 'stern' },
  smug: { e: 'open', lid: 0.5, m: 'smirk', b: 'arch' },
  shout: { e: 'open', lid: 0, slant: 0.5, m: 'shout', b: 'cross' },
  angry: { e: 'open', lid: 0.24, slant: 0.85, m: 'grit', b: 'cross' },
  sleep: { e: 'shut', m: 'o', b: 'soft' },
  wake: { e: 'open', lid: 0, pupil: 'small', m: 'o', b: 'arch' },
  surprised: { e: 'open', lid: 0, pupil: 'small', m: 'o', b: 'arch' },
  happy: { e: 'arch', m: 'smirk', b: 'arch' },
  hurt: { e: 'squeeze', m: 'grit', b: 'worried' },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  sad: { e: 'open', lid: 0.44, m: 'wobble', b: 'worried' },
};
const GAZE = { c: [0, 0], f: [1.6, 0.2], b: [-1.6, 0.2], u: [0.3, -1.4], d: [0.3, 1.3] };

function rvEye(x, y, o, ex, blink, g) {
  const out = [];
  const w = 7.2;
  const h = 8;
  const L = C.lash;
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if (kind === 'open' && blink === 2) kind = 'shut';
  if (kind === 'open' && blink === 1) lid = Math.max(lid, 0.7);
  const lashes = (bx, by) => {
    // Her three-lash corner, swept up and out.
    for (let k = 0; k < 3; k++) out.push(...band([[bx, by + k * 0.9], [bx + w * (0.4 + k * 0.08) * o, by - h * (0.34 - k * 0.14)]], 1.6, 0.5, L, true));
  };
  if (kind === 'arch') {
    out.push(...band(curve([[x - w, y + 1.6], [x - w * 0.42, y - h * 0.36], [x + w * 0.42, y - h * 0.36], [x + w, y + 1.6]], 3), 2.3, 2.3, L, true));
    lashes(x + w * 0.9 * o, y + 0.6);
    return out;
  }
  if (kind === 'shut') {
    out.push(...band(curve([[x - w, y], [x - w * 0.3, y + h * 0.3], [x + w * 0.4, y + h * 0.28], [x + w, y - 0.2]], 3), 2, 2.4, L, true));
    out.push(...band([[x + w * o * 0.94, y], [x + w * o * 1.4, y + 1.8]], 1.6, 0.5, L, true), ...band([[x + w * o * 0.7, y + 1.4], [x + w * o * 1, y + 3.2]], 1.2, 0.4, L, true));
    return out;
  }
  if (kind === 'squeeze') {
    out.push(...band([[x + w * o, y - h * 0.44], [x - w * 0.6 * o, y + 0.3], [x + w * o, y + h * 0.44]], 2.4, 2.1, L, true));
    return out;
  }
  if (kind === 'swirl') {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = i * 0.6 * o;
      const r = 0.5 + i * 0.32;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1]);
    }
    out.push(...band(pts, 1.4, 1.5, L, true));
    return out;
  }
  const [gx, gy] = g;
  // Her eyes keep time: strict amber almonds, each iris a little clock dial (four tiny ticks round
  // its rim at twelve, three, six and nine, a small round pupil at its centre for the hands' pin), a
  // square-cut glint like a watch glass catching the light.
  out.push(F(E(x, y + 0.3, w, h - 0.3, '#fffaf4')));
  const ix = x + gx * 0.5;
  const iy = y + 0.9 + gy * 0.4;
  const ir = w - 1.5;
  const iry = h - 1.8;
  out.push(F(E(ix, iy, ir + 0.6, iry + 0.6, C.irisDk)), F(E(ix, iy, ir, iry, C.iris)), F(E(ix, iy + iry * 0.4, ir * 0.78, iry * 0.48, C.irisLt)));
  for (let k = 0; k < 4; k++) {
    const c = Math.cos((k * Math.PI) / 2);
    const sn = Math.sin((k * Math.PI) / 2);
    out.push(...band([[ix + c * ir * 0.6, iy + sn * iry * 0.6], [ix + c * ir * 0.86, iy + sn * iry * 0.86]], 0.8, 0.8, C.irisDk, true));
  }
  const pr = ex.pupil === 'small' ? 1 : 1.6;
  out.push(F(E(ix + gx * 0.3, iy + gy * 0.2, pr, pr, '#2a1010')));
  const qx = x - w * 0.3 + gx * 0.3;
  const qy = y - h * 0.22 + gy * 0.3;
  out.push(F(T([[qx - 1.8, qy - 1], [qx + 1.4, qy - 1.9], [qx + 1.9, qy + 1.2], [qx - 1.3, qy + 2]], '#ffffff')), F(E(x + w * 0.32, y + h * 0.42, w * 0.12, h * 0.1, '#ffffff')));
  const sl = ex.slant ?? 0;
  const inner = x - w * 1.12 * o;
  const outer = x + w * 1.16 * o;
  const yi = y - h * 0.9 + h * 1.8 * lid + sl * h * 0.55;
  const yo = y - h * 0.94 + h * 1.5 * lid - sl * h * 0.1;
  const ym = (yi + yo) / 2 - h * 0.1 * (1 - lid);
  out.push(F(T([[inner, yi], [x, ym], [outer, yo], [outer, y - h * 1.7], [inner, y - h * 1.7]], SKIN)));
  // (The eye's round bottom, kept clean: skin below it.)
  out.push(F(T([...Array.from({ length: 13 }, (_, k) => [x + Math.cos((k / 12) * Math.PI) * (w + 0.1), y + 0.3 + Math.sin((k / 12) * Math.PI) * (h - 0.2)]), [x - w - 3, y + h + 5], [x + w + 3, y + h + 5]], SKIN)));
  out.push(...band(curve([[inner, yi + 0.3], [x, ym], [outer, yo]], 3), 2.4, 2.8, L, true));
  lashes(outer - w * 0.1 * o, yo + 0.2);
  out.push(...band(curve([[x - w * 0.4 * o, y + h * 0.98], [x + w * 0.35 * o, y + h * 0.94], [x + w * 0.8 * o, y + h * 0.7]], 2), 0.7, 1, L, true));
  return out;
}

function rvMouth(kind) {
  const my = 23.4;
  const L = C.line;
  switch (kind) {
    case 'tut':
      return [F(E(1, my + 0.8, 1.6, 1.2, C.mouth)), ...band(curve([[-2.4, my + 1], [0, my + 0.4], [2.8, my + 0.2]], 2), 0.9, 0.9, L, true)];
    case 'smirk':
      return band(curve([[-3, my + 1], [0, my + 1.4], [2.6, my + 0.4], [3.8, my - 1]], 3), 1.1, 1.2, L, true);
    case 'shout':
      return [F(T([[-5, my - 1.6], [5, my - 1.6], [4.2, my + 3.6], [0, my + 6.2], [-4.2, my + 3.6]], C.mouth)), F(T([[-4.4, my - 1.5], [4.4, my - 1.5], [4, my], [-4, my]], '#ffffff')), F(E(0, my + 4.4, 2.6, 1.5, C.tongue))];
    case 'grit':
      return [F(T([[-3.8, my - 0.2], [3.8, my - 0.2], [3.2, my + 2.4], [-3.2, my + 2.4]], C.mouth)), F(T([[-3.4, my + 0.2], [3.4, my + 0.2], [3.2, my + 2], [-3.2, my + 2]], '#ffffff')), ...band([[-3, my + 1.1], [3, my + 1.1]], 0.5, 0.5, '#e0d0d4', true)];
    case 'o':
      return [F(E(0, my + 1.2, 1.8, 2.2, C.mouth))];
    case 'wobble':
      return band(curve([[-3.6, my + 1], [-1.8, my], [0, my + 1], [1.8, my], [3.6, my + 1]], 2), 1, 1, L, true);
    default:
      // Lips pursed: a small prim line with a darker centre.
      return [...band(curve([[-2.6, my + 0.8], [0, my + 0.4], [2.6, my + 0.8]], 2), 1.2, 1.2, L, true), F(E(0, my + 1.4, 1.4, 0.6, C.mouth))];
  }
}

function rvFace(ex, blink, gaze, bangShade = []) {
  // (The skull without its angled jaw shadow; the blush goes on after the eyes, inside her side
  // locks.)
  const L = skull(0, 0).slice(0, 4);
  L.push(...rvEye(-13.4, 10.4, -1, ex, blink, gaze), ...rvEye(13.4, 10.4, 1, ex, blink, gaze));
  for (const sx of [-1, 1]) {
    const cx = 15.6 * sx;
    L.push(F(E(cx, 21, 4.6, 2.1, BLUSH)));
    for (let k = 0; k < 2; k++) L.push(...band([[cx - 2 + k * 2.6, 21.8], [cx - 0.9 + k * 2.6, 20]], 0.6, 0.6, '#ef6f90', true));
  }
  // The monocle over her near eye: a gold rim with a little clock dial on it, and its chain.
  L.push(...band(curve([[13.4 + 9.2, 10.4], [13.4 + 7, 17.6], [13.4, 19.8], [13.4 - 7, 17.6], [13.4 - 9.2, 10.4], [13.4 - 7, 3.2], [13.4, 1], [13.4 + 7, 3.2], [13.4 + 9.2, 10.4]], 3), 1.7, 1.7, C.gold, true));
  L.push(...band(curve([[13.4 - 6.4, 4.6], [13.4 - 2, 2.2]], 2), 1, 1, C.goldLt, true), E(13.4 + 9, 6, 2.2, 2.2, C.gold), F(E(13.4 + 9, 6, 1.4, 1.4, '#ffffff')), ...band([[13.4 + 9, 6], [13.4 + 9, 4.8]], 0.4, 0.4, C.ink, true));
  L.push(...band(curve([[13.4 + 8.4, 14], [26, 22], [29, 30]], 3), 0.8, 0.8, C.goldSh, true));
  L.push(...rvMouth(ex.m));
  // (The shadow her bangs cast goes right over the skull, under everything else.)
  const placed = place(L);
  return [...placed.slice(0, 4), ...bangShade, ...placed.slice(4)];
}
function rvBrows(kind) {
  const P = {
    stern: [[6.6, -3.4], [12, -6.4], [17.6, -5.6]],
    arch: [[6.4, -6.4], [12, -9], [17.6, -7.6]],
    cross: [[6.8, 0.4], [12, -2.2], [17.6, -5.6]],
    worried: [[6.6, -6.4], [12, -4.8], [17.6, -2.4]],
    soft: [[6.6, -3.6], [12, -4.6], [17.6, -3.8]],
  }[kind] ?? [[6.6, -3.4], [12, -6.4], [17.6, -5.6]];
  const B = [];
  for (const sx of [-1, 1]) B.push(...band(curve(P.map(([x, y]) => [x * sx, y]), 3), 2, 1, C.hairDk, true));
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 104], neck: [HX, NECK], crown: [HX, 40],
  shF: [CX - 11, 92], elF: [CX - 13, 101], wrF: [CX - 13, 109],
  shN: [CX + 12, 92], elN: [CX + 14, 101], wrN: [CX + 15, 109],
  hipF: [CX - 8, 112], kneeF: [CX - 8, 125], ankF: [CX - 8, G - 8],
  hipN: [CX + 7, 112], kneeN: [CX + 7, 125], ankN: [CX + 7, G - 8],
  skirt: [CX, 102], apron: [CX + 1, 104],
  hairB0: [HX, 58], hairB1: [HX, 64],
  bellF: [HX - 16, 49], bellN: [HX + 16, 49], hammer: [HX, 46],
  baton: [CX + 15, 113], batonTip: [CX + 15, 146],
};
const HANDS = new Set(['grip', 'open', 'hip', 'rap']);

function bell(out, [bx, by], col, sh, lt) {
  // An alarm bell for a hair bun: a gold dome with a rim, a knob on top, a pink ribbon at its base.
  out.push(T([[bx - 10.4, by + 1], ...Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI + (i / 12) * Math.PI;
    return [bx + Math.cos(a) * 9.6, by - 1 + Math.sin(a) * 10.6];
  }), [bx + 10.4, by + 1]], col));
  out.push(...band([[bx - 10.4, by + 0.6], [bx + 10.4, by + 0.6]], 3.6, 3.6, sh), F(E(bx - 3.4, by - 6.4, 2.4, 3.2, lt)), E(bx, by - 12.4, 2, 2, sh));
  out.push(...band(curve([[bx - 6, by + 3.6], [bx, by + 5], [bx + 6, by + 3.6]], 2), 2.6, 2.6, C.hairSh));
}

function reveilleShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : null;
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'drills', C.hair, 'part');

  // Her hair: the crown behind her head, and two long ringlet drills hanging either side of it
  // (they swing on their own, rooted at the nape).
  use('hairB1');
  out.push(...hd.hang);
  use('hairB0');
  out.push(...hd.backHead);

  // The far arm: a puffed sleeve, a lace cuff, her hand (on her hip, open, or raised).
  use('armFu');
  out.push(blob([[J.shF[0] - 6.8, J.shF[1] - 4.6], [J.shF[0] + 6, J.shF[1] - 5.4], [J.shF[0] + 7, J.shF[1] + 3.4], [J.elF[0] + 4.2, J.elF[1] + 1.4], [J.elF[0] - 4.4, J.elF[1] + 1.6], [J.shF[0] - 7.4, J.shF[1] + 3.6]], C.dressSh));
  use('armFf');
  out.push(E(J.elF[0], J.elF[1], 3.8, 3.8, SKIN_SH), blob([[J.elF[0] - 3.7, J.elF[1] - 0.6], [J.elF[0] + 3.7, J.elF[1] - 0.6], [J.wrF[0] + 3.4, J.wrF[1] + 0.6], [J.wrF[0] - 3.4, J.wrF[1] + 0.6]], SKIN_SH, 2));
  out.push(blob([[J.wrF[0] - 4.4, J.wrF[1] - 3], [J.wrF[0] + 4.4, J.wrF[1] - 3], [J.wrF[0] + 4.8, J.wrF[1] + 0.2], [J.wrF[0] - 4.8, J.wrF[1] + 0.2]], C.apronSh, 2));
  use('handF');
  if (handKind === 'hip') out.push(E(J.wrF[0], J.wrF[1] + 3.4, 4.6, 4.2, SKIN_SH), ...band(curve([[J.wrF[0] - 3, J.wrF[1] + 4.4], [J.wrF[0], J.wrF[1] + 5.6], [J.wrF[0] + 3, J.wrF[1] + 4.4]], 2), 0.6, 0.6, '#e8b0a0', true));
  else out.push(E(J.wrF[0], J.wrF[1] + 3.6, 4.8, 4.4, SKIN_SH), E(J.wrF[0] + 3.4, J.wrF[1] + 2, 1.8, 1.8, SKIN_SH));

  // Legs in white stockings: a thigh running well up under the skirt, the knee one smooth round, the
  // shin; red Mary Janes with a gold buckle on the strap (the walk rolls them heel to toe).
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx, hy] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const st = far ? C.stockSh : C.stock;
    use(`thigh${k}`);
    out.push(blob([[hx - 4.2, hy - 8], [hx + 4.2, hy - 8], [kx + 3.8, ky], [kx + 3.2, ky + 3.2], [kx - 3.2, ky + 3.2], [kx - 3.8, ky]], st, 2));
    use(`shin${k}`);
    out.push(E(kx, ky + 0.4, 3.7, 3.5, st), blob([[kx - 3.6, ky], [kx + 3.6, ky], [ax + 3.2, ay + 1.4], [ax - 3.2, ay + 1.4]], st, 2));
    if (!far) out.push(F(blob([[kx - 3.5, ky + 2.4], [kx - 1.7, ky + 2.4], [ax - 1.4, ay + 0.6], [ax - 3.1, ay + 0.6]], C.stockSh, 1)));
    use(`foot${k}`);
    out.push(blob([[ax - 5.4, ay - 1], [ax + 4, ay - 1.4], [ax + 9.6, ay + 2], [ax + 10.4, ay + 5.6], [ax + 7, ay + 7.6], [ax - 5, ay + 7.6], [ax - 6.6, ay + 3.6]], far ? '#7a1c30' : C.shoeSh));
    out.push(blob([[ax - 5, ay - 1], [ax + 4, ay - 1.4], [ax + 9.2, ay + 1.8], [ax + 9.8, ay + 5], [ax + 6.6, ay + 6.6], [ax - 4.6, ay + 6.6], [ax - 6, ay + 3]], far ? C.shoeSh : C.shoe));
    out.push(...band(curve([[ax - 2.6, ay - 0.6], [ax + 0.6, ay + 0.8], [ax + 3.6, ay - 0.4]], 2), 1.4, 1.4, far ? '#7a1c30' : C.shoeSh, true), F(E(ax + 0.6, ay + 0.8, 1.6, 1.2, C.gold)), F(E(ax + 6.4, ay + 2, 2.4, 1, far ? C.shoe : '#ff7a90')));
  }

  // The dress: a flared skirt (its own swing), the bodice, a lace collar with a bell brooch; the
  // clock-face apron in front with its own swing.
  use('skirt');
  out.push(blob([[CX - 15, 99], [CX + 15, 99], [CX + 24.6, 123], [CX + 20, 128.6], [CX + 8, 127], [CX - 6, 129], [CX - 20, 127.6], [CX - 25.6, 123]], C.dress));
  out.push(F(blob([[CX - 15, 100], [CX - 7, 100], [CX - 9, 128.2], [CX - 20, 127], [CX - 25, 123]], C.dressSh, 2)));
  out.push(...band(curve([[CX - 24, 124.4], [CX - 6, 127], [CX + 8, 125.6], [CX + 23, 123.6]], 3), 2.2, 2.2, C.dressLt, true));
  use('body');
  out.push(blob([[CX - 12, 83], [CX + 13, 83], [CX + 16, 96], [CX + 14.6, 105], [CX - 14.6, 105], [CX - 16, 96]], C.dress));
  out.push(F(blob([[CX - 12, 86], [CX - 6, 86], [CX - 7, 102], [CX - 14, 102], [CX - 15.6, 96]], C.dressSh, 2)));
  out.push(...band(curve([[CX - 14.4, 103], [CX, 103.8], [CX + 14.4, 103]], 2), 2.4, 2.4, C.goldSh, true));
  out.push(blob([[CX - 13.6, 83.4], [CX + 14.6, 83.4], [CX + 11.6, 90], [CX + 1, 91.6], [CX - 10.6, 90]], C.apron), F(blob([[CX - 13, 84], [CX - 5, 84], [CX - 3, 90.6], [CX - 10, 89.4]], C.apronSh, 2)));
  for (let k = 0; k < 6; k++) out.push(F(E(CX - 10 + k * 4.4, 89.6 + Math.sin(k * 1.3) * 0.4, 1.4, 1, C.apron)));
  out.push(E(CX + 1, 92.6, 3.4, 3.2, C.gold), F(E(CX + 0.2, 91.6, 1.2, 1, C.goldLt)), E(CX + 1, 89, 0.9, 0.9, C.goldSh));
  use('apron');
  const [ax, ay] = [CX + 1, 115];
  out.push(blob([[CX - 9.4, 101.4], [CX + 11.4, 101.4], [CX + 14, 106.6], [CX - 12, 106.6]], C.apron, 2));
  out.push(E(ax, ay, 14.4, 13.4, C.goldSh), E(ax, ay, 12.8, 11.8, C.apron), F(T([[ax - 12.8, ay], [ax - 4, ay + 11.4], [ax - 11, ay + 6]], C.apronSh)));
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const big = k % 3 === 0;
    out.push(F(E(ax + Math.cos(a) * 9.6, ay + Math.sin(a) * 8.8, big ? 1.2 : 0.6, big ? 1.2 : 0.6, C.ink)));
  }
  out.push(...band([[ax, ay], [ax, ay - 7.4]], 1.5, 1, C.ink, true), ...band([[ax, ay], [ax + 5.2, ay - 2]], 1.5, 1, C.ink, true), F(E(ax, ay, 1.4, 1.4, C.gold)));

  // Her head, face (and monocle), fringe, brows; a wavy lock down each side; the bells, the hammer.
  use('head');
  out.push(...rvFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  // (Parted in the middle, swept to each side: prim.)
  out.push(...hd.fringe);
  use('brows');
  out.push(...rvBrows(ex.b));
  use('bellF');
  bell(out, J.bellF, C.goldSh, C.goldDk, C.gold);
  use('bellN');
  bell(out, J.bellN, C.gold, C.goldSh, C.goldLt);
  use('hammer');
  out.push(...band([[HX, 47], [HX, 35]], 1.6, 1.6, C.goldDk, true), E(HX, 33, 3.4, 3, C.gold), F(E(HX - 1, 32, 1.2, 1, C.goldLt)));

  // The near arm: sleeve, cuff, the hand holding her baton, and the baton with its bell.
  use('armNu');
  out.push(blob([[J.shN[0] - 6, J.shN[1] - 5.4], [J.shN[0] + 6.8, J.shN[1] - 4.6], [J.shN[0] + 7.4, J.shN[1] + 3.6], [J.elN[0] + 4.4, J.elN[1] + 1.6], [J.elN[0] - 4.2, J.elN[1] + 1.4], [J.shN[0] - 7, J.shN[1] + 3.4]], C.dress), F(E(J.shN[0] + 2, J.shN[1] - 1.4, 2.6, 2, C.dressLt)));
  use('armNf');
  out.push(E(J.elN[0], J.elN[1], 3.8, 3.8, SKIN), blob([[J.elN[0] - 3.7, J.elN[1] - 0.6], [J.elN[0] + 3.7, J.elN[1] - 0.6], [J.wrN[0] + 3.4, J.wrN[1] + 0.6], [J.wrN[0] - 3.4, J.wrN[1] + 0.6]], SKIN, 2));
  out.push(blob([[J.wrN[0] - 4.4, J.wrN[1] - 3], [J.wrN[0] + 4.4, J.wrN[1] - 3], [J.wrN[0] + 4.8, J.wrN[1] + 0.2], [J.wrN[0] - 4.8, J.wrN[1] + 0.2]], C.apron, 2));
  use('baton');
  out.push(...band([[J.baton[0], J.baton[1] - 2], [J.batonTip[0], J.batonTip[1] - 6]], 2.2, 1.4, C.baton), ...band([[J.baton[0] - 0.4, J.baton[1]], [J.batonTip[0] - 0.4, J.batonTip[1] - 8]], 0.6, 0.4, C.batonSh, true));
  out.push(...band([[J.baton[0], J.baton[1] - 3], [J.baton[0], J.baton[1] + 4]], 3.4, 3.4, C.goldSh));
  out.push(E(J.batonTip[0], J.batonTip[1] - 3.4, 3.2, 3, C.gold), F(E(J.batonTip[0] - 1, J.batonTip[1] - 4.4, 1, 0.8, C.goldLt)), E(J.batonTip[0], J.batonTip[1] - 0.4, 0.9, 0.9, C.goldDk));
  use('handN');
  out.push(E(J.wrN[0], J.wrN[1] + 3.6, 4.6, 4.2, SKIN), E(J.wrN[0] + 3.2, J.wrN[1] + 2.4, 1.8, 1.8, SKIN), ...band(curve([[J.wrN[0] - 3, J.wrN[1] + 4.6], [J.wrN[0] + 0.4, J.wrN[1] + 6], [J.wrN[0] + 3, J.wrN[1] + 4.6]], 2), 0.6, 0.6, SKIN_SH, true));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(RV, reveilleShapes, J, { scale: SCALE, flat: true, cel: new Set(['hairB0', 'hairB1', 'fringe']) });
const { rel, through } = K;
// (Prim little steps: a short stride for her long boss-size legs.)
const WK = kidWalk(K, { stride: 28, kick: 5, key: 'rv' });
const LOOP = 14;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function castOf(m, now) {
  const c = m.castMove;
  if (!c) return null;
  const s = now - c.at;
  if (s < 0 || s > c.warn + 0.8) return null;
  const wind = smooth(clamp(s / Math.min(0.5, c.warn), 0, 1)) * (s < c.warn ? 1 : 1 - smooth((s - c.warn) / 0.8));
  return { id: c.id, wind, go: s >= c.warn ? (s - c.warn) / 0.8 : -1, u: clamp(s / c.warn, 0, 1) };
}

export const reveilleRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 28,
  recover: 0.7,
  springs: {
    x: [170, 15], lift: [170, 13], tilt: [130, 11], head: [110, 10], tap: [300, 20],
    shF: [140, 12], elF: [150, 12], shN: [160, 12], elN: [160, 12], hdN: [180, 13], bell: [320, 12], upN: [400, 30], toeN: [400, 30],
  },
  walkStiff: { ...WALK_STIFF, hdN: [320, 30] },
  fast: ['x', 'lift', 'tilt', 'shN', 'elN', 'hdN', 'shF', 'elF'],
  kick: { tilt: -200, head: 320, bell: 600 },
  turnKick: { tilt: 120, head: -140, bell: 300 },
  pose(m, a) {
    const t = a.t + (m.uid % 7) * 1.1;
    WK.step(m, a);
    const lu = t % LOOP;
    const cine = m.cine ?? {};
    const freed = Boolean(cine.freed);
    const snooze = m.snoozeUntil > a.now && m.hp > 0 ? 1 : 0;
    const woke = m.snoozeUntil != null && a.now >= m.snoozeUntil && a.now - m.snoozeUntil < 1.2 ? 1 - (a.now - m.snoozeUntil) / 1.2 : 0;
    const loud = m.loud ?? 0;
    const cm = castOf(m, a.now);
    const calm = freed || snooze || cm ? 0 : a.calm ?? 1;
    const breath = Math.sin(t * 1.6);
    // The act: conducting the seconds; a foot tapping and a tut; a test ring on her own bell.
    const conduct = hold(lu, 0.6, 1.2, 4.8, 5.4) * calm;
    const beat = Math.sin(t * Math.PI * 2);
    const tapping = hold(lu, 6, 6.4, 9, 9.4) * calm;
    const tut = hold(lu, 8.2, 8.4, 9.2, 9.5) * calm;
    const test = hold(lu, 10.4, 10.8, 11.6, 12) * calm;
    const rap = hold(lu, 11.1, 11.18, 11.26, 11.5) * calm;
    const nod = hold(lu, 11.4, 11.6, 12, 12.4) * calm;
    const ringRecent = Math.max(0, 1 - Math.abs(a.now - (m.ringAt ?? -9)) / 0.9);
    const mv = (id) => (cm && cm.id === id ? cm.wind : 0);
    const ringMv = mv('ring');
    const hands = mv('hands');
    const clang = mv('clang');
    const monday = mv('monday');
    const down = cm && cm.go >= 0 && cm.go < 1 ? Math.sin(Math.PI * Math.min(1, cm.go * 1.6)) : 0;
    a.rvRing = Math.max(rap, ringRecent, monday, ringMv * (cm?.u > 0.6 ? 1 : 0.3), freed ? 0.3 : 0) * (1 - snooze);
    a.rvSnooze = snooze;
    a.rvCast = cm;
    const idle = {
      x: 0,
      lift: breath * 0.2 + test * 0.4 + nod * -0.6,
      tilt: breath * 0.5 + conduct * beat * 2.6 + tapping * -2 + test * -3,
      head: Math.sin(t * 0.5) * 1.6 + conduct * beat * 7 - 3 + tut * 6 + test * -6 + nod * 8,
      tap: tapping * Math.max(0, Math.sin(t * 9)) * 2.4,
      // Conducting: the baton ticking side to side in time; tapping: the far hand on her hip.
      shF: 6 + breath * 1.4 + tapping * 30,
      elF: 12 + tapping * -110,
      shN: -10 - breath * 1.4 - conduct * (60 + beat * 16) - test * 96 - rap * 18,
      elN: -20 - conduct * (40 - beat * 24) - test * 60 + rap * 30,
      hdN: -conduct * beat * 18 - test * 40 - rap * 30,
      bell: 0,
    };
    // Walking: the kid walk, prim and upright: her hips sink just as far as her planted feet need,
    // a sharp little bob on top; chin up, the head a beat behind; the far arm swinging neatly, the
    // baton swung on the beat, its tip trailing.
    const p = (a.rvU ?? 0) * TAU;
    const roll = Math.sin(p - 0.5);
    const hb = WK.headBob(a);
    const fold = (v) => (1 - Math.cos(v)) / 2;
    const walk = {
      x: 0.4 + roll * 0.4,
      lift: -WK.sink(a) - 0.8 + WK.bob(a) * 1.4,
      tilt: -2 + roll * 1.6,
      head: -6 - roll * 1 + hb * 6,
      tap: 0,
      shF: 4 - Math.cos(p - 0.15) * 16,
      elF: 14 - fold(p - 0.4) * 12,
      shN: -30 + Math.cos(p - 0.15) * 22,
      elN: -60 - fold(p - 0.4 + Math.PI) * 24,
      hdN: -20 + Math.sin(p - 0.6) * 24,
      bell: 0,
    };
    // A rap of the baton (her plain attack, in scenes).
    const antic = { x: -1.6, lift: 0.6, tilt: -8, head: -6, tap: 0, shF: 14, elF: 20, shN: -150, elN: -30, hdN: -40, bell: 0 };
    const strike = { x: 4, lift: 0, tilt: 10, head: 6, tap: 0, shF: 10, elF: 10, shN: -60, elN: -10, hdN: 30, bell: 0 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - a.walkW) + walk[k] * a.walkW) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    const lay = (w, pose) => {
      if (w <= 0) return;
      for (const [k, v] of Object.entries(pose)) out[k] = out[k] * (1 - w) + v * w;
    };
    // The trial's moves.
    const rapB = cm?.id === 'ring' && cm.u > 0.6 ? Math.abs(Math.sin(a.now * 22)) : 0;
    lay(ringMv, { tilt: -4, head: -4 + rapB * 4, shN: -112 - rapB * 14, elN: -64 + rapB * 20, hdN: -50, shF: 70, elF: 60 });
    lay(hands, { tilt: -6 + down * 16, head: -10 + down * 14, lift: 1 - down * 3, shN: -160 + down * 120, elN: -10, hdN: -40 + down * 70, shF: 110 - down * 80, elF: 20 });
    lay(clang, { x: -1 + down * 3, lift: -2 - down * 3, tilt: -10 + down * 26, head: -6 + down * 12, shN: -150 + down * 130, elN: -20 + down * 10, hdN: -30 + down * 60, shF: 30, elF: 30 });
    lay(monday, { lift: 2 + Math.abs(Math.sin(a.now * 14)) * 1.4, tilt: 10 + Math.sin(a.now * 30) * 2, head: 8, shN: -120, elN: 20, hdN: -20, shF: 120, elF: -20 });
    // Snoozing on her feet: head sinking, baton drooping; then the jolt awake.
    lay(snooze, { lift: -1.4, tilt: 3 + Math.sin(t * 0.9) * 1.6, head: 16 + Math.sin(t * 0.9) * 4, shN: -2, elN: -4, hdN: 30, shF: 2, elF: 6 });
    lay(woke, { lift: 3, tilt: -8, head: -12, shN: -70, elN: -10, shF: 70, elF: 10 });
    if (freed) lay(1, { tilt: 4, head: 6, shF: 30, elF: -110, shN: -40, elN: 40, hdN: 20 });
    out.bell = (a.rvRing ?? 0) * Math.sin(a.now * 48) * (8 + loud * 3);
    // (Her foot tap: the near foot's toe lifting off the floor and coming down, the heel kept put.)
    out.upN = out.tap * 0.4;
    out.toeN = -out.tap * 7;
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    // Her face.
    let ex = a.face === 'dead' && !freed ? 'dizzy' : a.face === 'hurt' ? 'hurt' : null;
    if (!ex && snooze) ex = 'sleep';
    else if (!ex && woke > 0.3) ex = 'wake';
    else if (!ex && monday > 0.2) ex = 'shout';
    else if (!ex && (ringMv > 0.3 || hands > 0.3 || clang > 0.3)) ex = cm.go >= 0 || rapB ? 'shout' : 'angry';
    else if (!ex && a.ph.strike > 0.15) ex = 'shout';
    else if (!ex && a.ph.antic > 0.05) ex = 'angry';
    else if (!ex && freed) ex = 'angry';
    else if (!ex && a.face === 'angry') ex = loud >= 2 ? 'shout' : 'angry';
    else if (!ex && a.face === 'happy') ex = 'smug';
    else if (!ex && a.face === 'sleepy') ex = 'sleep';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = tut > 0.3 ? 'tut' : nod > 0.3 ? 'smug' : 'idle';
    const P = 3.3 + (m.uid % 7) * 0.33;
    const q = (a.t + (m.uid % 5) * 0.8) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.37) / 1.6);
    const atk = a.ph.antic > 0.02 || a.ph.strike > 0.02 || Boolean(cm);
    const gaze = conduct > 0.3 ? (beat > 0 ? 'f' : 'b') : tapping > 0.3 ? 'd' : test > 0.3 ? 'u' : a.face === 'angry' || atk ? 'f' : ['c', 'f', 'c', 'd', 'c', 'f', 'b', 'c'][Math.floor(hash(n + m.uid) * 8)];
    a.mo.rig.rvFace = `${ex}|${EX[ex].e === 'open' && !atk ? blink : 0}|${gaze}`;
    a.rvHandF = tapping > 0.3 || freed ? 'hip' : 'open';
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    const t = a.t;
    // Rings of sound off her bells while they ring (more, and wider, the louder she's got).
    const ring = a.rvRing ?? 0;
    if (ring > 0.05) {
      const loud = m.loud ?? 0;
      ctx.strokeStyle = '#fff3a6';
      ctx.lineWidth = 1.1;
      for (const [part, j] of [['bellF', 'bellF'], ['bellN', 'bellN']]) {
        const [bx, by] = through(matOf(part), j, j);
        const side = part === 'bellF' ? -1 : 1;
        for (let i = 0; i < 2 + Math.min(2, loud); i++) {
          const r = 7 + i * 5 + ((t * 24) % 5);
          ctx.globalAlpha = (a.alpha ?? 1) * ring * (1 - i / (3 + loud));
          ctx.beginPath();
          ctx.arc(bx, by - 4, r, side > 0 ? -Math.PI * 0.55 : -Math.PI * 1.05, side > 0 ? Math.PI * 0.05 : -Math.PI * 0.45);
          ctx.stroke();
        }
      }
    }
    // A twinkle off the baton's bell.
    const [tx, ty] = through(matOf('baton'), 'batonTip', 'baton');
    const P = 2.1;
    const f = (((t + (m.uid % 3)) % P) + P) % P / P;
    if (f < 0.3) sparkle(ctx, a, tx + 1, ty - 2, 2.2 * Math.sin((Math.PI * f) / 0.3), 0.9, '#fff3c8');
    // The clang: the baton cracked on the floor, sparks along it.
    const cm = a.rvCast;
    if (cm?.id === 'clang' && cm.go >= 0) {
      const u = cm.go;
      for (let i = 0; i < 8; i++) sparkle(ctx, a, 10 + i * 10 + u * 20, -2 - (i % 2) * 4, 2.4 * (1 - u), 1 - u, i % 2 ? '#ffd35c' : '#ffffff');
    }
    // The clock hands' downbeat: a flash off the raised baton.
    if (cm?.id === 'hands' && cm.wind > 0.5 && cm.go < 0) sparkle(ctx, a, tx, ty, 3 * cm.wind, cm.wind, '#ffffff');
    // Z's drifting up while she snoozes.
    if (a.rvSnooze) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const P2 = 2.4;
        const g = (((t + i * 0.8) % P2) + P2) % P2 / P2;
        ctx.globalAlpha = (a.alpha ?? 1) * Math.sin(Math.PI * g);
        ctx.fillStyle = '#e8dcff';
        ctx.font = `bold ${7 + g * 5}px sans-serif`;
        ctx.fillText('z', hx + 18 + g * 12, hy - 4 - g * 22);
      }
    }
    if (m.hp <= 0 && !m.cine?.freed) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 3 + (i * TAU) / 3;
        dot(ctx, a, hx + Math.cos(ang) * 16, hy - 8 + Math.sin(ang) * 4, 1.6, 0.9, '#ffe9a0');
      }
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    K.layer('hairB0', { parent: 'head', pivot: 'hairB0', from: 'neck', soft: { ...SOFT.HAIR, k: 80, max: 8, gain: 0.3 } }),
    K.layer('hairB1', { parent: 'hairB0', pivot: 'hairB1', from: 'hairB0', soft: { ...SOFT.HAIR, k: 60, max: 9, gain: 0.4, hang: 0.6 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    { ...K.layer('handF', { parent: 'armFf', pivot: 'wrF' }), s: (a, S, b) => K.piece('handF', a.rvHandF ?? 'open', b) },
    ...WK.parts(),
    K.layer('skirt', { parent: 'torso', pivot: 'skirt', from: 'hip', soft: { ...SOFT.CLOTH, max: 12 } }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('apron', { parent: 'torso', pivot: 'apron', from: 'hip', soft: { ...SOFT.CLOTH, k: 100, max: 10, gain: 0.4 } }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.rvFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.rvFace ?? 'idle').split('|')[0], b) },
    // The bells ring by shaking about their own bases; the hammer bobs between them on its spring.
    K.layer('hammer', { parent: 'head', pivot: 'hammer', from: 'neck', rot: (S) => S.bell * 1.4 * D2R, soft: { ...SOFT.FLAP, gain: 0.3, max: 24 } }),
    // (Each bell sits down into her hair on the curve of her head, tipped out a little with it.)
    K.layer('bellF', { parent: 'head', pivot: 'bellF', from: 'neck', rot: (S) => -(S.bell + 16) * D2R }),
    K.layer('bellN', { parent: 'head', pivot: 'bellN', from: 'neck', rot: (S) => (S.bell + 16) * D2R }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    K.layer('baton', { parent: 'armNf', pivot: 'baton', from: 'wrN', rot: (S) => S.hdN * D2R }),
    K.layer('handN', { parent: 'armNf', pivot: 'wrN' }),
  ]),
});

export const reveilleStill = K.still;
export { reveilleShapes };
