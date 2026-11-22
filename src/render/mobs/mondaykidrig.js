// Monday, as the Weekend-Eating Baku (2026-11-22, the player's pick from the T-pose design sheet;
// replaces the Calendar Beast, a calendar page on legs). A baku eats dreams; this one ate the
// Queen's weekends, so it's ALWAYS Monday. A smug little girl on the kid base at a boss's size:
//   - hair: a lilac flip bob (the hero's own cut), a navy headband with two round baku ears, each
//     with a pink inside, twitching on its own;
//   - face: her own eyes, violet with a crescent moon shining in each, heavy lids; a little fang;
//     crumbs round her mouth while she eats;
//   - clothes, all covering (2026-11-22, the player: "no exposed body, heavy redraw to perfection"),
//     soft and round, shaded by hand: a navy sailor dress, the top fitted to her waist with two soft
//     seams; long sleeves puffed and gathered at the shoulder, to white cuffs with a navy stripe and a
//     gold button; a white sailor collar (double navy stripes, a white dickey in the V) and a red scarf
//     bow with tails cut in a V; a white sash at her waist tied at her side; the skirt in box pleats,
//     each lit or shaded by which way it faces, to a curved hem with a white stripe; white tights all
//     the way down; navy Mary Janes with white straps and gold buttons;
//   - props: a giant red fountain pen held in her near hand like a staff, nib down (she raises it
//     nib-first, it swings like a sword), and a half-eaten sun cookie in the other (Saturday).
//
// How she moves:
//   idle    a 15 s act: nibbles the cookie (crumbs, puffed cheeks); taps the pen's cap on the floor,
//           impatient, toe tapping; points it at you, "Up!"; a smug little grin.
//   walk    the kid walk (the hero's approved walk on her legs), brisk and bossy, chin up, the
//           cookie hand swinging, the pen swung on the beat, ears and bow bouncing.
//   casts   (world/theatre.js sets m.castPose; each its own pose, held through the cast):
//           Email Avalanche: hops, flinging both arms up in turn, envelopes flying off her hands;
//           Red Pen: the pen swung back behind her, then swung down ahead;
//           Alarm Clock: a hand cupped to her mouth, bouncing on her toes, shouting GOOD MORNING
//           (rings of sound off her);
//           Meeting Invites: arms flung wide, beckoning everyone in, sly;
//           Deadline: up on tiptoe, the pen held straight up at the clock, then slammed down.
//   ending  (the scene theatre_monday_end, `mood: 'crumple'`): the Queen says "five more minutes"
//           and Monday YAWNS (yawns are catching): a huge stretch, arms up, then she nods off on
//           her feet, knees going, head sinking, the pen drooping, z's. Beaten, she sleeps.
// Built like Madame Reveille (reveillerig.js): every layer its own part, the loose ones (hair,
// ears, bow, sash bow, skirt) swinging on their own; outer outline only. (2026-11-22, the player:
// why is her body so blocky: the boxy blouse and bloomers and the MON badge were replaced by the
// fitted top, the flared skirt and a real sailor collar.)

import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, BLUSH, band, curve, groups, skull, HS, mapShape, kidHead } from './kidbase.js';
import { kidWalk, WALK_STIFF } from './kidwalk.js';
import { kidKit, SOFT, twoPass, hold, D2R } from './kidrig.js';
import { makeRig, smooth, clamp, TAU } from './rig.js';
import { sparkle, dot } from './rigkit.js';

const MK = 'mondaykid';
const SCALE = 3.5;
const HX = CX + 2;
const NECK = 86;
const HY = NECK - 31 * HS;
const C = {
  hair: '#c9b6ff', hairDk: '#7a68c0',
  navy: '#3c4486', navySh: '#2c336c', navyDk: '#202652', navyLt: '#6a74c0',
  white: '#ffffff', whiteSh: '#dfe3f2', whiteDk: '#c4cae2',
  tights: '#f8f6fd', tightsSh: '#dcd8ea', tightsDk: '#c4bed8', red: '#ff5a6e', redSh: '#d43a56', redLt: '#ffa2ae',
  ear: '#ffc6d6',
  iris: '#8a7ae8', irisDk: '#4a3a9e', irisLt: '#d6ccff', lash: '#2a1f4a',
  mouth: '#9a3a4e', line: '#5a2a3e', tongue: '#ff8a9e',
  cookie: '#ffd46a', cookieSh: '#f2b24a', ray: '#ffb84a', crumb: '#e8a040',
  gold: '#f2c14e', goldSh: '#a87a2a', grip: '#3a3050',
};

// ---------- The face ----------

const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));
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

const EX = {
  idle: { e: 'open', lid: 0.36, m: 'smirk', b: 'smug' },
  smug: { e: 'open', lid: 0.5, m: 'fang', b: 'smug' },
  happy: { e: 'arch', m: 'fang', b: 'smug' },
  munch: { e: 'arch', m: 'munch', b: 'calm', crumbs: true },
  angry: { e: 'open', lid: 0.16, glare: true, m: 'grit', b: 'cross' },
  shout: { e: 'wide', m: 'shout', b: 'cross' },
  yawn: { e: 'shut', m: 'yawn', b: 'soft' },
  sleep: { e: 'shut', m: 'o', b: 'soft' },
  hurt: { e: 'squeeze', m: 'grit', b: 'worried' },
  dizzy: { e: 'swirl', m: 'wobble', b: 'worried' },
  sad: { e: 'open', lid: 0.44, m: 'wobble', b: 'worried' },
};
const GAZE = { c: [0, 0], f: [1.4, 0.2], b: [-1.4, 0.2], u: [0.3, -1.3], d: [0.3, 1.2] };

// Her eyes: violet almonds under heavy lids, a crescent moon shining in each (the baku's dreams).
// (No eye-bags: under her blush they read as a second blush, 2026-11-22.)
function mkEye(x, y, o, ex, blink, g) {
  const out = [];
  const L = C.lash;
  const P = (dx, dy) => [x + dx * o, y + dy];
  let kind = ex.e;
  let lid = ex.lid ?? 0;
  if ((kind === 'open' || kind === 'wide') && blink === 2) kind = 'shut';
  if (kind === 'open' && blink === 1) lid = Math.max(lid, 0.66);
  if (kind === 'arch') {
    out.push(...band(curve([P(-6.4, 2), P(-2.6, -3.4), P(2.8, -4), P(7, -1.2)], 3), 2.6, 2.4, L, true), ...band([P(6.6, -1.4), P(8.6, -3.4)], 1.8, 0.6, L, true));
    return out;
  }
  if (kind === 'shut') {
    out.push(...band(curve([P(-6.4, 1.4), P(-2, 3.8), P(3, 3.4), P(7.2, 0.4)], 3), 2.4, 2.4, L, true), ...band([P(6.8, 0.6), P(8.8, -1.2)], 1.8, 0.6, L, true));
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
  const wide = kind === 'wide' ? 1.4 : 0;
  const glare = ex.glare ? 1 : 0;
  const top = curve([P(-6.6, 1.2), P(-3.6, -6.2 - wide + glare * 2.6), P(2.4, -7.6 - wide + glare), P(7.4, -3.8 - wide * 0.4)], 4);
  const bottom = curve([P(7.4, -3.8 - wide * 0.4), P(6.4, 3.4), P(1, 6.8 + wide * 0.4), P(-4.4, 5.6), P(-6.6, 1.2)], 4);
  out.push(F(T([...top, ...bottom], '#ffffff')));
  const [gx, gy] = g;
  const ix = x + 0.6 * o + gx;
  const iy = y + 0.8 + gy;
  const pr = kind === 'wide' ? 1.2 : glare ? 1.3 : 1.8;
  out.push(F(E(ix, iy, 5.3, 6.5, C.irisDk)), F(E(ix, iy + 1.2, 4.7, 5.3, C.iris)), F(E(ix, iy + 3.1, 3.5, 2.5, C.irisLt)));
  out.push(F(E(ix, iy + 0.4, pr, pr * 1.5, '#1e1636')));
  // The crescent moon glint: a white disc with a disc of the iris over its side.
  out.push(F(E(ix - 2 * o, iy - 2.4, 2.4, 2.4, '#ffffff')), F(E(ix - 1 * o, iy - 3.1, 2, 2, C.iris)), F(E(ix + 2.2 * o, iy + 2.7, 0.9, 0.9, '#ffffff')));
  const lidTop = lid > 0 ? curve([P(-6.8, 1.2 + lid * 1.2), P(-3, -5.4 + lid * 7.2 + glare * 2.6), P(2.6, -7 + lid * 7 + glare), P(7.8, -4 + lid * 2)], 4) : top;
  out.push(F(T([...lidTop, P(9.4, -13), P(-8.4, -13)], SKIN)));
  out.push(F(T([...bottom, P(-8.4, 10), P(9.4, 10)], SKIN)));
  out.push(...band(lidTop, 2.4, 3, L, true), ...band(curve([P(6.8, -3.4 + lid * 1.6), P(9, -5.8 + lid), P(9.8, -8 + lid)], 2), 2, 0.6, L, true));
  out.push(...band([P(5.6, 3.6), P(7, 5.2)], 0.9, 0.4, L, true));
  return out;
}

function mkMouth(kind) {
  const my = 23;
  const L = C.line;
  switch (kind) {
    case 'fang':
      return [F(T([[-4.6, my - 1.2], [4.6, my - 1.2], [3.4, my + 2.6], [0, my + 3.8], [-3.4, my + 2.6]], C.mouth)), F(T([[1.4, my - 1.1], [3.6, my - 1.1], [2.6, my + 1.6]], '#ffffff')), F(E(-0.4, my + 2.4, 2, 1, C.tongue))];
    case 'munch':
      // Cheeks puffed full of cookie, a wobbly closed mouth.
      return [...band(curve([[-3.2, my + 0.8], [-1.4, my], [0.4, my + 0.8], [2.2, my], [3.6, my + 0.6]], 2), 1.1, 1.1, L, true), F(E(17.4, 17.6, 4.4, 3.2, '#ffe2d4'))];
    case 'grit':
      return [F(T([[-3.8, my - 0.2], [3.8, my - 0.2], [3.2, my + 2.4], [-3.2, my + 2.4]], C.mouth)), F(T([[-3.4, my + 0.2], [3.4, my + 0.2], [3.2, my + 2], [-3.2, my + 2]], '#ffffff')), ...band([[-3, my + 1.1], [3, my + 1.1]], 0.5, 0.5, '#e0d0d4', true)];
    case 'shout':
      return [F(T([[-5, my - 1.6], [5, my - 1.6], [4.2, my + 3.6], [0, my + 6.2], [-4.2, my + 3.6]], C.mouth)), F(T([[1, my - 1.5], [3.4, my - 1.5], [2.4, my + 1]], '#ffffff')), F(E(0, my + 4.4, 2.6, 1.5, C.tongue))];
    case 'yawn':
      // A huge yawn: a tall open oval, the tongue low, the little fang.
      return [F(E(0, my + 2.6, 4.6, 6.2, C.mouth)), F(E(0, my + 6, 3, 1.8, C.tongue)), F(T([[1, my - 3.2], [2.8, my - 3.2], [1.8, my - 0.8]], '#ffffff'))];
    case 'o':
      return [F(E(0, my + 1.2, 1.6, 1.9, C.mouth))];
    case 'wobble':
      return band(curve([[-3.6, my + 1], [-1.8, my], [0, my + 1], [1.8, my], [3.6, my + 1]], 2), 1, 1, L, true);
    default:
      // The smug smirk: hiked up on one side, the fang peeking out of that corner.
      return [...band(curve([[-3.4, my + 1.2], [-0.4, my + 1.6], [2.4, my + 0.6], [4, my - 1.2]], 3), 1.2, 1.3, L, true), F(T([[2, my + 0.6], [3.6, my - 0.2], [2.8, my + 2.4]], '#ffffff'))];
  }
}

function mkFace(ex, blink, gaze, bangShade = []) {
  const L = [...skull(0, 0)];
  for (const sx of [-1, 1]) {
    const cx = 18.6 * sx;
    L.push(F(E(cx, 20.6, 5.2, 2.3, BLUSH)));
    for (let k = 0; k < 2; k++) L.push(...band([[cx - 2 + k * 2.8, 21.6], [cx - 0.8 + k * 2.8, 19.6]], 0.7, 0.7, '#f06a8a', true));
  }
  L.push(...mkEye(-13.2, 10.6, -1, ex, blink, gaze), ...mkEye(13.2, 10.6, 1, ex, blink, gaze));
  L.push(...mkMouth(ex.m));
  // Crumbs round her mouth while she eats.
  if (ex.crumbs) L.push(F(E(-6, 27, 0.8, 0.7, C.crumb)), F(E(6, 28, 0.9, 0.8, C.crumb)), F(E(1.6, 29.4, 0.6, 0.6, C.crumb)));
  const placed = place(L);
  return [...placed.slice(0, 5), ...bangShade, ...placed.slice(5)];
}
function mkBrows(kind) {
  const P = {
    smug: [[[5.8, -3.6], [12.6, -6.6], [18, -5]], [[5.8, -2.4], [12.6, -4.4], [18, -3.4]]],
    cross: [[[6.2, 0.4], [12.6, -2.8], [18, -5.2]], [[6.2, 0.4], [12.6, -2.8], [18, -5.2]]],
    calm: [[[5.8, -3.6], [12.6, -5.6], [18, -4.6]], [[5.8, -3.6], [12.6, -5.6], [18, -4.6]]],
    soft: [[[6, -2.4], [12.6, -3.6], [18, -2.8]], [[6, -2.4], [12.6, -3.6], [18, -2.8]]],
    worried: [[[6.2, -6.4], [12.6, -4.6], [18, -1.8]], [[6.2, -6.4], [12.6, -4.6], [18, -1.8]]],
  }[kind] ?? null;
  const pair = P ?? [[[5.8, -3.6], [12.6, -6.6], [18, -5]], [[5.8, -2.4], [12.6, -4.4], [18, -3.4]]];
  const B = [];
  for (const sx of [-1, 1]) B.push(...band(curve((sx > 0 ? pair[0] : pair[1]).map(([x, y]) => [x * sx, y + 1.6]), 2), 2.4, 1.2, C.hairDk, true));
  return place(B);
}

// ---------- The drawing ----------

const J = {
  hip: [CX, 104], neck: [HX, NECK], crown: [HX, 40],
  shF: [CX - 11, 92], elF: [CX - 13, 101], wrF: [CX - 13, 109],
  shN: [CX + 12, 92], elN: [CX + 14, 101], wrN: [CX + 15, 109],
  hipF: [CX - 7, 110], kneeF: [CX - 7, 125], ankF: [CX - 7, G - 8],
  hipN: [CX + 7, 110], kneeN: [CX + 7, 125], ankN: [CX + 7, G - 8],
  skirt: [CX, 100], bow: [CX + 1, 94.6], sashBow: [CX + 13.2, 100],
  earF: [HX - 15, 44], earN: [HX + 15, 44], mouth: [HX, HY + 23 * HS],
  // The pen: gripped about two thirds of the way down, nib down, the cap end up.
  pen: [CX + 15, 113], nib: [CX + 15, 143], cap: [CX + 15, 59], cookie: [CX - 11, 118],
};
const HANDS = new Set(['cookie', 'open', 'cup']);

// The giant red fountain pen, nib down: a white cap end with a gold band and clip, the red barrel
// lit down one side, the dark grip, the gold nib with its slit.
function pen(out) {
  const [x, y0] = J.cap;
  const y1 = J.nib[1];
  const at = (t, s = 0) => [x + s, y0 + (y1 - y0) * t];
  out.push(...band([at(0), at(0.1)], 9.6, 9.6, '#fff6ee'), ...band([at(0.1), at(0.14)], 10, 10, C.gold));
  out.push(...band([at(0.14), at(0.72)], 9.6, 9.6, C.red));
  out.push(...band([at(0.16, -2.6), at(0.7, -2.6)], 2.6, 2.6, C.redSh, true), ...band([at(0.18, 2.4), at(0.68, 2.4)], 1.6, 1.6, C.redLt, true));
  out.push(...band([at(0.72), at(0.84)], 9, 7, C.grip), ...band([at(0.74, 1.6), at(0.82, 1.4)], 1.2, 1, '#6a5a88', true));
  out.push(T([at(0.84, 3.6), at(0.84, -3.6), at(1)], C.gold), ...band([at(0.86), at(0.96)], 0.7, 0.4, C.goldSh, true), F(E(...at(0.88), 1, 1, C.goldSh)));
  out.push(...band([at(0.03, 5.6), at(0.3, 5.6)], 2, 2, C.gold), F(E(...at(0.3, 5.6), 1.4, 1.4, C.gold)));
}
// The half-eaten sun cookie (Saturday), a bite out of its top.
function cookie(out, cx, cy, r = 6) {
  const pts = [];
  const ba = -0.9;
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * TAU;
    const dd = Math.hypot(Math.cos(a) * r - Math.cos(ba) * r, Math.sin(a) * r - Math.sin(ba) * r);
    const bite = r * 0.55;
    const rr = dd < bite ? r - r * 0.5 * Math.sqrt(1 - (dd / bite) ** 2) : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU + 0.3;
    if (Math.abs(((a - ba + Math.PI) % TAU) - Math.PI) < 0.8) continue;
    out.push(T([[cx + Math.cos(a - 0.24) * r * 0.94, cy + Math.sin(a - 0.24) * r * 0.94], [cx + Math.cos(a) * r * 1.42, cy + Math.sin(a) * r * 1.42], [cx + Math.cos(a + 0.24) * r * 0.94, cy + Math.sin(a + 0.24) * r * 0.94]], C.ray));
  }
  out.push(T(pts, C.cookie), F(E(cx - r * 0.2, cy + r * 0.22, r * 0.5, r * 0.36, C.cookieSh)), F(E(cx - r * 0.36, cy - r * 0.2, r * 0.22, r * 0.14, '#fff1b8')));
  for (const [dx, dy] of [[-0.3, 0.4], [0.3, 0.1], [0, -0.2]]) out.push(F(E(cx + dx * r, cy + dy * r, 0.5, 0.5, C.cookieSh)));
}

function mondayKidShapes(v = 'idle') {
  const { G: parts, use, out } = groups();
  const faceKey = v.includes('|') ? v : `${EX[v] ? v : 'idle'}|0|c`;
  const [exName, blink, gaze] = faceKey.split('|');
  const ex = EX[exName] ?? EX.idle;
  const handKind = HANDS.has(v) ? v : 'cookie';
  const hd = kidHead(HX, NECK, 'idle', { iris: C.iris, irisDk: C.irisDk, irisLt: C.irisLt }, 'flipbob', C.hair, 'auto');

  use('hairB1');
  out.push(...hd.hang);
  use('hairB0');
  out.push(...hd.backHead);

  // A long sleeve, puffed and gathered at the shoulder, narrowing to the elbow (`far`: in shade).
  const upperSleeve = (sh, el, far) => {
    const [sx, sy] = sh;
    const [ex, ey] = el;
    const c = far ? C.navySh : C.navy;
    const dk = far ? C.navyDk : C.navySh;
    out.push(blob([[sx - 6.8, sy - 4.6], [sx + 6.2, sy - 5.4], [sx + 7, sy + 2.4], [ex + 4.4, ey + 0.6], [ex - 4.4, ey + 1], [sx - 7.6, sy + 2.6]], c));
    // The puff's gathers at the top, and the seam where it meets the sleeve.
    for (const dx of [-3, 0.4, 3.6]) out.push(...band(curve([[sx + dx, sy - 4.4], [sx + dx * 0.9, sy - 2.4]], 2), 0.6, 0.3, dk, true));
    out.push(...band(curve([[sx - 6.6, sy + 3], [sx, sy + 4.4], [sx + 6.4, sy + 2.8]], 2), 0.6, 0.6, dk, true));
    if (far) out.push(F(blob([[sx - 7.2, sy - 2], [sx - 3, sy - 2], [ex - 2.4, ey + 0.6], [ex - 4.2, ey + 0.8]], C.navyDk, 2)));
    else out.push(...band(curve([[sx - 3, sy - 3.8], [sx + 2, sy - 4.6], [sx + 5.8, sy - 1.6]], 2), 1.2, 0.7, C.navyLt, true), ...band(curve([[sx + 6, sy + 3], [ex + 3.4, ey - 1]], 2), 0.9, 0.6, C.navyLt, true));
  };
  // The forearm's sleeve from the elbow to a white cuff at the wrist, a navy stripe round the cuff
  // and a little gold button.
  const lowerSleeve = (el, wr, far) => {
    const [ex, ey] = el;
    const [wx, wy] = wr;
    const c = far ? C.navySh : C.navy;
    out.push(E(ex, ey, 4.3, 4.2, c), blob([[ex - 4.2, ey - 0.6], [ex + 4.2, ey - 0.6], [wx + 4.4, wy - 2.6], [wx - 4.4, wy - 2.6]], c, 2));
    out.push(F(blob([[ex - 4, ey], [ex - 1.8, ey], [wx - 2, wy - 2.8], [wx - 4.2, wy - 2.8]], far ? C.navyDk : C.navySh, 1)));
    if (!far) out.push(...band(curve([[ex + 3.2, ey - 1], [wx + 3.4, wy - 3.4]], 2), 0.8, 0.6, C.navyLt, true));
    out.push(blob([[wx - 4.8, wy - 3.4], [wx + 4.8, wy - 3.4], [wx + 5, wy + 0.6], [wx - 5, wy + 0.6]], far ? C.whiteSh : C.white, 2));
    out.push(...band([[wx - 4.8, wy - 1.4], [wx + 4.8, wy - 1.4]], 0.8, 0.8, C.navy, true), F(E(wx + 3.4, wy - 0.2, 0.8, 0.8, C.gold)));
    out.push(F(blob([[wx - 4.8, wy - 0.2], [wx + 4.8, wy - 0.2], [wx + 5, wy + 0.6], [wx - 5, wy + 0.6]], far ? C.whiteDk : C.whiteSh, 1)));
  };

  // The far arm (in shade), its hand holding the cookie.
  use('armFu');
  upperSleeve(J.shF, J.elF, true);
  use('armFf');
  lowerSleeve(J.elF, J.wrF, true);
  use('handF');
  if (handKind === 'cookie') {
    cookie(out, J.wrF[0] + 1.4, J.wrF[1] + 9.4, 6.2);
    out.push(E(J.wrF[0], J.wrF[1] + 3.6, 4.4, 4, SKIN_SH), E(J.wrF[0] + 3, J.wrF[1] + 5.6, 1.9, 1.9, SKIN_SH));
  } else out.push(E(J.wrF[0], J.wrF[1] + 3.6, 4.8, 4.4, SKIN_SH), E(J.wrF[0] + 3.4, J.wrF[1] + 2, 1.8, 1.8, SKIN_SH));

  // Legs in white tights all the way down: a thigh running up under the skirt, the knee one smooth
  // round with a soft light on it, the shin; navy Mary Janes with a white strap and a gold button.
  for (const [k, far] of [['F', true], ['N', false]]) {
    const [hx, hy] = J[`hip${k}`];
    const [kx, ky] = J[`knee${k}`];
    const [ax, ay] = J[`ank${k}`];
    const ti = far ? C.tightsSh : C.tights;
    const tsh = far ? C.tightsDk : C.tightsSh;
    use(`thigh${k}`);
    out.push(blob([[hx - 4.6, hy - 9], [hx + 4.6, hy - 9], [kx + 4, ky], [kx + 3.4, ky + 3.4], [kx - 3.4, ky + 3.4], [kx - 4, ky]], ti, 2));
    out.push(F(blob([[hx - 4.4, hy - 6], [hx - 2, hy - 6], [kx - 2.2, ky + 1], [kx - 3.8, ky + 1]], tsh, 1)));
    use(`shin${k}`);
    out.push(E(kx, ky + 0.4, 3.9, 3.7, ti), blob([[kx - 3.8, ky], [kx + 3.8, ky], [ax + 3.3, ay + 1.4], [ax - 3.3, ay + 1.4]], ti, 2));
    out.push(F(blob([[kx - 3.6, ky + 1.6], [kx - 1.6, ky + 1.6], [ax - 1.5, ay + 0.8], [ax - 3.1, ay + 0.8]], tsh, 1)));
    if (!far) out.push(F(E(kx + 1.2, ky - 0.4, 1.4, 1, '#ffffff')), F(blob([[kx + 1.6, ky + 4], [kx + 2.6, ky + 4], [ax + 2.2, ay - 2], [ax + 1.4, ay - 2]], '#ffffff', 1)));
    use(`foot${k}`);
    const sc = far ? C.navyDk : C.navySh;
    const sb = far ? C.navySh : C.navy;
    out.push(blob([[ax - 5.4, ay - 1], [ax + 4, ay - 1.4], [ax + 9.6, ay + 2], [ax + 10.4, ay + 5.6], [ax + 7, ay + 7.6], [ax - 5, ay + 7.6], [ax - 6.6, ay + 3.6]], sc));
    out.push(blob([[ax - 5, ay - 1], [ax + 4, ay - 1.4], [ax + 9.2, ay + 1.8], [ax + 9.8, ay + 5], [ax + 6.6, ay + 6.6], [ax - 4.6, ay + 6.6], [ax - 6, ay + 3]], sb));
    out.push(...band(curve([[ax - 4.8, ay + 6.4], [ax + 2, ay + 6.8], [ax + 9, ay + 5.6]], 2), 1, 1, far ? '#14183a' : C.navyDk, true));
    out.push(...band(curve([[ax - 2.8, ay - 0.6], [ax + 0.6, ay + 0.9], [ax + 3.8, ay - 0.4]], 2), 1.5, 1.5, far ? C.whiteSh : C.white, true), F(E(ax + 0.6, ay + 0.9, 1.3, 1.1, C.gold)), F(E(ax + 0.3, ay + 0.6, 0.5, 0.4, '#fff3c8')));
    out.push(F(E(ax + 6.4, ay + 2, 2.4, 1, far ? C.navy : C.navyLt)), F(E(ax + 7.4, ay + 1.6, 0.8, 0.5, '#ffffff')));
  }

  // The skirt: navy box pleats flaring from her waist to a curved hem with a white stripe round it
  // (it swings on its own). Each pleat a panel of its own, lit or shaded by which way it faces, a
  // deep fold between them; the far side in shade.
  use('skirt');
  const hemY = (x) => 118.6 + 3.2 * (1 - ((x - CX) / 22.6) ** 2);
  const waist = [-12.2, -8.1, -4, 0, 4, 8.1, 12.2];
  const hem = waist.map((w) => w * 1.85);
  out.push(blob([[CX - 12.2, 99.6], [CX + 12.2, 99.6], [CX + 18, 109], [CX + 22.8, 118.6], ...Array.from({ length: 9 }, (_, i) => {
    const x = CX + 22.6 - (45.2 * i) / 8;
    return [x, hemY(x) + 0.4];
  }), [CX - 22.8, 118.6], [CX - 18, 109]], C.navy, 2));
  for (let i = 0; i < 6; i++) {
    const [w0, w1] = [waist[i], waist[i + 1]];
    const [h0, h1] = [hem[i], hem[i + 1]];
    const side = (i + 0.5 - 3) / 3;
    const lit = i % 2 === 1;
    const col = side < -0.5 ? (lit ? C.navySh : C.navyDk) : lit ? (side > 0.5 ? C.navyLt : C.navy) : C.navySh;
    const xs = [CX + h1, CX + (h0 + h1) / 2, CX + h0];
    out.push(F(T([[CX + w0, 101], [CX + w1, 101], ...xs.map((x) => [x, hemY(x)])], col)));
    out.push(...band(curve([[CX + w0, 101.4], [CX + (w0 + h0) / 2, 110], [CX + h0, hemY(CX + h0) - 0.4]], 2), 0.5, 0.9, C.navyDk, true));
  }
  const hemLine = (dy, w, c) => band(curve(Array.from({ length: 9 }, (_, i) => {
    const x = CX - 21.4 + (42.8 * i) / 8;
    return [x, hemY(x) - dy];
  }), 3), w, w, c, true);
  out.push(...hemLine(2.6, 1.7, C.white), ...hemLine(0.4, 0.7, C.navyDk));

  // The top: fitted to her waist, two soft seams; the sailor collar, white, two flaps over her
  // shoulders meeting in a V, double navy stripes along each; the white dickey in the V; the white
  // sash at her waist.
  use('body');
  out.push(blob([[CX - 12, 83], [CX + 13, 83], [CX + 15.4, 90], [CX + 13.8, 96], [CX + 12, 101], [CX - 11.8, 101], [CX - 13.6, 96], [CX - 15, 90]], C.navy));
  out.push(F(blob([[CX - 12, 85], [CX - 6.6, 85], [CX - 7.4, 100.4], [CX - 11.6, 100.4], [CX - 13.4, 95.6], [CX - 14.4, 90]], C.navySh, 2)));
  out.push(...band(curve([[CX - 7, 88], [CX - 6.4, 94], [CX - 4.6, 99.6]], 2), 0.6, 0.6, C.navyDk, true), ...band(curve([[CX + 8.4, 88], [CX + 7.6, 94], [CX + 5.8, 99.6]], 2), 0.6, 0.6, C.navyDk, true));
  out.push(...band(curve([[CX + 13.2, 87], [CX + 14.4, 92], [CX + 12.6, 98]], 2), 1.3, 1.1, C.navyLt, true));
  out.push(T([[CX - 4, 83.2], [CX + 6, 83.2], [CX + 1, 90.6]], C.white), ...band([[CX - 2.2, 85.6], [CX + 4.2, 85.6]], 0.8, 0.8, C.navy, true), F(E(CX + 1, 84, 4.4, 1.1, C.whiteSh)));
  out.push(blob([[CX - 14.4, 83.4], [CX - 4.6, 83], [CX + 1, 91.4], [CX + 6.6, 83], [CX + 15.4, 83.4], [CX + 15, 88.4], [CX + 7.8, 89.4], [CX + 1, 96.8], [CX - 5.8, 89.4], [CX - 14.2, 88.4]], C.white, 2));
  out.push(F(blob([[CX - 14, 84], [CX - 6, 84], [CX - 4.8, 89], [CX - 13.6, 88]], C.whiteSh, 2)));
  for (const d of [1.2, 2.8]) out.push(...band(curve([[CX - 14, 88.4 - d], [CX - 6.4, 89.4 - d], [CX + 1 - d * 0.1, 96.8 - d * 1.5]], 2), 0.7, 0.7, C.navy, true), ...band(curve([[CX + 1 + d * 0.1, 96.8 - d * 1.5], [CX + 7.6, 89.4 - d], [CX + 15, 88.4 - d]], 2), 0.7, 0.7, C.navy, true));
  out.push(blob([[CX - 12.6, 97.2], [CX + 12.8, 97.2], [CX + 13.2, 102.6], [CX - 13, 102.6]], C.white, 2));
  out.push(F(blob([[CX - 12.8, 101.2], [CX + 13, 101.2], [CX + 13.2, 102.6], [CX - 13, 102.6]], C.whiteSh, 1)), F(blob([[CX - 12.6, 97.4], [CX - 8.4, 97.4], [CX - 8.8, 102.6], [CX - 13, 102.6]], C.whiteSh, 1)));
  out.push(...band([[CX - 8, 98.8], [CX + 12, 98.8]], 0.5, 0.5, '#ffffff', true));

  // The red scarf bow at the collar's V: two loops, each folded in, a knot, two tails cut in a V.
  use('bow');
  for (const s of [-1, 1]) {
    const bx = CX + 1 + s * 3.6;
    out.push(blob([[CX + 1, 93.6], [bx + s * 3.6, 92], [bx + s * 4.2, 96.4], [CX + 1, 95.8]], C.red, 2));
    out.push(F(blob([[CX + 1 + s * 1.4, 94.2], [bx + s * 2, 93.4], [bx + s * 2.4, 95.4], [CX + 1 + s * 1.4, 95.4]], C.redSh, 1)));
    out.push(T([[CX + 1 + s * 0.6, 95.8], [CX + 1 + s * 3.4, 101.6], [CX + 1 + s * 2.4, 100.6], [CX + 1 + s * 1.4, 101.8], [CX + 1 - s * 0.6, 96]], C.red));
  }
  out.push(blob([[CX - 0.8, 93.2], [CX + 2.8, 93.2], [CX + 2.8, 96.4], [CX - 0.8, 96.4]], C.redSh, 1), F(E(CX + 0.6, 94, 0.9, 0.5, C.redLt)));
  out.push(...band(curve([[CX - 4.6, 92.6], [CX - 2, 92.2]], 2), 0.6, 0.4, C.redLt, true));
  // The sash's bow at her side, white, its tails hanging.
  use('sashBow');
  out.push(blob([[CX + 13, 99.4], [CX + 16.6, 96.6], [CX + 18, 99.8], [CX + 14, 100.8]], C.white, 2), blob([[CX + 13, 100.6], [CX + 16.4, 103.4], [CX + 15, 105], [CX + 12.6, 101.8]], C.whiteSh, 2));
  out.push(E(CX + 13.2, 100.2, 1.6, 1.6, C.whiteSh), T([[CX + 12.6, 101.4], [CX + 13.4, 109], [CX + 14.4, 108], [CX + 15.2, 109.2], [CX + 14, 101.4]], C.white));
  out.push(F(blob([[CX + 14.2, 98.4], [CX + 16.4, 97.6], [CX + 17, 99.4], [CX + 14.6, 100]], C.whiteSh, 1)));

  // Her head and face, the bangs, brows.
  use('head');
  out.push(...mkFace(ex, Number(blink), GAZE[gaze] ?? GAZE.c, hd.shade));
  use('fringe');
  // (The flip bob comes with a pink hairband of its own: left out, she wears her navy one.)
  out.push(...hd.fringe.filter((sh) => sh.c !== '#ff8fb8' && sh.c !== '#ffc4dc'));
  use('brows');
  out.push(...mkBrows(ex.b));
  // The navy headband, and the round baku ears on it (each twitches on its own).
  use('band');
  const hb = curve([[-32, 4], [-28.4, -25], [0, -37.4], [28.4, -25], [32, 4]], 4);
  out.push(...place([...band(hb, 7.4, 7.4, C.navy), ...band(hb.map(([x, y]) => [x * 0.98, y * 0.98 - 2.4]), 1.4, 1.4, C.navyLt, true)]));
  use('earF');
  out.push(...place([E(-25, -37, 8.4, 8, C.navySh), F(E(-25, -36.2, 4.8, 4.4, '#f0aac0'))]));
  use('earN');
  out.push(...place([E(25, -37, 8.4, 8, C.navy), F(E(25, -36.2, 4.8, 4.4, C.ear)), F(E(22.4, -41, 2, 1.2, C.navyLt))]));

  // The near arm: the sleeve to its cuff; the pen; the hand round it.
  use('armNu');
  upperSleeve(J.shN, J.elN, false);
  use('armNf');
  lowerSleeve(J.elN, J.wrN, false);
  use('pen');
  pen(out);
  use('handN');
  out.push(E(J.wrN[0], J.wrN[1] + 3.8, 4.6, 4.2, SKIN), E(J.wrN[0] + 3.2, J.wrN[1] + 2.4, 1.8, 1.8, SKIN), ...band(curve([[J.wrN[0] - 3, J.wrN[1] + 4.8], [J.wrN[0] + 0.4, J.wrN[1] + 6.2], [J.wrN[0] + 3, J.wrN[1] + 4.8]], 2), 0.6, 0.6, SKIN_SH, true));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The rig ----------

const K = kidKit(MK, mondayKidShapes, J, { scale: SCALE, flat: true, cel: new Set(['hairB0', 'hairB1', 'fringe']) });
const { rel, through } = K;
const WK = kidWalk(K, { stride: 32, kick: 5.4, key: 'mk' });
const LOOP = 15;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// The cast she's in (m.castPose from world/theatre.js), how far she's taken it up (0..1), and the
// seconds into it; it lets go over 0.4 s once the cast is over.
function castOf(m, a) {
  const st = (a.mo.rig ??= {});
  if (m.cast && m.castPose) {
    if (st.mkKind !== m.castPose || st.mkT0 !== m.cast.t0) {
      st.mkKind = m.castPose;
      st.mkT0 = m.cast.t0;
    }
    st.mkEnd = null;
  } else if (st.mkKind && st.mkEnd == null) st.mkEnd = a.now;
  if (!st.mkKind) return null;
  const s = a.now - st.mkT0;
  const fade = st.mkEnd == null ? 1 : 1 - smooth(clamp((a.now - st.mkEnd) / 0.4, 0, 1));
  if (fade <= 0) {
    st.mkKind = null;
    return null;
  }
  return { id: st.mkKind, s, w: smooth(clamp(s / 0.4, 0, 1)) * fade, dur: m.cast?.dur ?? 3 };
}

export const mondayKidRig = makeRig({
  w: K.BW,
  h: K.BH,
  soft: true,
  stride: 32,
  recover: 0.7,
  springs: {
    x: [170, 15], lift: [170, 13], tilt: [130, 11], head: [110, 10], tap: [300, 20],
    shF: [140, 12], elF: [150, 12], shN: [150, 12], elN: [160, 12], hdN: [170, 13], upN: [400, 30], toeN: [400, 30], feet: [200, 18],
  },
  walkStiff: { ...WALK_STIFF, hdN: [320, 30] },
  fast: ['x', 'lift', 'tilt', 'shN', 'elN', 'hdN', 'shF', 'elF'],
  kick: { tilt: -200, head: 320 },
  turnKick: { tilt: 120, head: -140 },
  pose(m, a) {
    const t = a.t + (m.uid % 7) * 1.1;
    WK.step(m, a);
    const st = a.mo.rig;
    const lu = t % LOOP;
    const cm = castOf(m, a);
    // The ending: from the moment the scene says "crumple" (she yawns, then nods off), or beaten.
    const ending = m.cine?.mood === 'crumple' || m.hp <= 0;
    if (ending && st.mkSleepAt == null) st.mkSleepAt = a.now;
    if (!ending) st.mkSleepAt = null;
    const se = ending ? a.now - st.mkSleepAt + (m.hp <= 0 && !m.cine ? 9 : 0) : 0;
    const yawn = ending ? hold(se, 0, 0.5, 1.6, 2.2) : 0;
    const sleep = ending ? smooth(clamp((se - 1.6) / 1.2, 0, 1)) : 0;
    const calm = cm || ending ? 0 : a.calm ?? 1;
    const breath = Math.sin(t * 1.6);
    // The act: a nibble of the cookie; the pen's cap tapped on the floor, toe tapping; pointing the
    // pen at you; a smug grin.
    const nibble = hold(lu, 0.6, 1.1, 3.4, 3.9) * calm;
    const chew = nibble * Math.max(0, Math.sin(t * 9));
    const tapping = hold(lu, 5, 5.4, 8, 8.4) * calm;
    const point = hold(lu, 9.4, 9.8, 11.2, 11.7) * calm;
    const grin = hold(lu, 12.2, 12.5, 13.6, 14) * calm;
    const idle = {
      x: 0,
      lift: breath * 0.2 + point * 0.6,
      tilt: breath * 0.5 + tapping * -1.4 + point * 3,
      head: Math.sin(t * 0.5) * 1.6 - 2 + nibble * 6 + chew * 2 + point * -4 + grin * -6 + tapping * Math.sin(t * 9) * 1.2,
      tap: tapping * Math.max(0, Math.sin(t * 9)) * 2.4,
      shF: 6 + breath * 1.4 + nibble * -40,
      elF: 12 + nibble * -118,
      shN: -10 - breath * 1.2 + tapping * -14 + point * -62,
      elN: -18 + tapping * 8 + point * -16,
      hdN: 58 + tapping * (-8 + Math.abs(Math.sin(t * 9)) * 6) + point * -42,
      upN: 0, toeN: 0, feet: 0,
    };
    // The kid walk, brisk and bossy: chin up, the head a beat behind; the cookie hand swinging, the
    // pen swung on the beat.
    const p = (a.mkU ?? 0) * TAU;
    const roll = Math.sin(p - 0.5);
    const hb = WK.headBob(a);
    const fold = (v) => (1 - Math.cos(v)) / 2;
    const walk = {
      x: 0.4 + roll * 0.4,
      lift: -WK.sink(a) - 0.8 + WK.bob(a) * 1.5,
      tilt: -1 + roll * 1.8,
      head: -6 - roll * 1 + hb * 6,
      tap: 0,
      shF: 4 - Math.cos(p - 0.15) * 18,
      elF: 12 - fold(p - 0.4) * 14,
      shN: -16 + Math.cos(p - 0.15) * 16,
      elN: -24 - fold(p - 0.4 + Math.PI) * 14,
      hdN: 60 + Math.sin(p - 0.6) * 10,
      upN: 0, toeN: 0, feet: 0,
    };
    // Her plain attack (scenes): the pen swung back behind her, then swung down ahead.
    const antic = { x: -1.6, lift: 0.8, tilt: -9, head: -6, tap: 0, shF: -20, elF: -10, shN: 52, elN: 10, hdN: 28, upN: 0, toeN: 0, feet: 0 };
    const strike = { x: 4, lift: -1, tilt: 12, head: 8, tap: 0, shF: -10, elF: 10, shN: -62, elN: -12, hdN: 8, upN: 0, toeN: 0, feet: 1 };
    const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
    const out = {};
    for (const k of Object.keys(idle)) out[k] = (idle[k] * (1 - a.walkW) + walk[k] * a.walkW) * rest + antic[k] * a.ph.antic + strike[k] * a.ph.strike;
    const lay = (w, pose) => {
      if (w <= 0) return;
      for (const [k, v] of Object.entries(pose)) out[k] = out[k] * (1 - w) + v * w;
    };
    // Her casts, each held as its own pose while it builds.
    const id = cm?.id;
    const w = cm?.w ?? 0;
    const s = cm?.s ?? 0;
    if (id === 'email') {
      // Hopping, flinging both arms up in turn, envelopes flying off her hands.
      const pump = Math.sin(s * 11);
      lay(w, { lift: 1.6 + Math.abs(Math.sin(s * 5.5)) * 5, tilt: -4 + pump * 2, head: -8, shF: 130 + pump * 34, elF: 20, shN: -40 - pump * 14, elN: -30, hdN: 96, feet: 0 });
    } else if (id === 'pen') {
      // The pen swung back behind her, nib out behind, held quivering, ready to swing.
      lay(w, { x: -2.4, lift: 1.2, tilt: -10 + Math.sin(s * 13) * 1.2, head: -6, shF: -30, elF: -20, shN: 56 + Math.sin(s * 13) * 3, elN: 10, hdN: 26, feet: -2 });
    } else if (id === 'alarm') {
      // A hand cupped to her mouth, bouncing on her toes, shouting.
      lay(w, { lift: 1 + Math.abs(Math.sin(s * 7)) * 4, tilt: 6 + Math.sin(s * 23) * 1.4, head: -10, shF: -40, elF: -126, shN: -30, elN: -10, hdN: 72, feet: 1 });
    } else if (id === 'invite') {
      // Arms flung wide, beckoning everyone in, sly.
      const beck = Math.sin(s * 4);
      lay(w, { lift: 0.6, tilt: -3, head: -4 + beck * 2, shF: 96 + beck * 10, elF: -30 + beck * 30, shN: -96 + beck * 8, elN: 20 + beck * 26, hdN: 104 - beck * 26, feet: 3 });
    } else if (id === 'deadline') {
      // Up on tiptoe, the pen held straight up at the clock.
      lay(w, { lift: 4 + Math.sin(s * 5) * 0.8, tilt: -4, head: -12, shF: 70, elF: 30, shN: -118, elN: -14, hdN: -44, upN: 1.4, toeN: 18, feet: 0 });
    }
    // The ending: a huge yawn and stretch, then asleep on her feet, knees going, head sinking.
    lay(yawn, { lift: 2.4, tilt: -6, head: -14, shF: 160, elF: 30, shN: -122, elN: -14, hdN: -40, feet: 0 });
    lay(sleep, { lift: -2.6 + Math.sin(t * 0.9) * 0.4, tilt: 5 + Math.sin(t * 0.9) * 1.6, head: 18 + Math.sin(t * 0.9) * 3, shF: 2, elF: 10, shN: 4, elN: -6, hdN: 70, feet: 0 });
    // (Her foot tap: the near toe lifting off the floor and coming down, the heel kept put.)
    out.upN = (out.upN ?? 0) + out.tap * 0.4;
    out.toeN = (out.toeN ?? 0) - out.tap * 7;
    out.elN = clamp(out.elN, -150, 150);
    out.elF = clamp(out.elF, -150, 150);
    a.mkCast = cm;
    a.mkSleep = sleep;
    a.mkChew = nibble;
    // Her face.
    let ex = a.face === 'hurt' && !ending ? 'hurt' : null;
    if (!ex && ending) ex = yawn > 0.3 ? 'yawn' : 'sleep';
    else if (!ex && (id === 'alarm' || id === 'deadline') && w > 0.3) ex = 'shout';
    else if (!ex && (id === 'email' || id === 'pen') && w > 0.3) ex = 'angry';
    else if (!ex && id === 'invite' && w > 0.3) ex = 'smug';
    else if (!ex && a.ph.strike > 0.15) ex = 'shout';
    else if (!ex && a.ph.antic > 0.05) ex = 'angry';
    else if (!ex && a.face === 'angry') ex = 'angry';
    else if (!ex && a.face === 'happy') ex = 'happy';
    else if (!ex && a.face === 'sleepy') ex = 'sleep';
    else if (!ex && EX[a.face] && a.face !== 'idle') ex = a.face;
    if (!ex) ex = nibble > 0.3 ? 'munch' : point > 0.3 ? 'angry' : grin > 0.3 ? 'smug' : 'idle';
    const P = 3.3 + (m.uid % 7) * 0.33;
    const q = (a.t + (m.uid % 5) * 0.8) % P;
    const blink = q < 0.05 ? 1 : q < 0.13 ? 2 : q < 0.19 ? 1 : 0;
    const n = Math.floor((a.t + m.uid * 0.37) / 1.6);
    const atk = a.ph.antic > 0.02 || a.ph.strike > 0.02 || Boolean(cm);
    const gaze = tapping > 0.3 ? 'd' : point > 0.3 || atk || a.face === 'angry' ? 'f' : nibble > 0.3 ? 'c' : ['c', 'f', 'c', 'd', 'c', 'f', 'b', 'c'][Math.floor(hash(n + m.uid) * 8)];
    st.mkFace = `${ex}|${EX[ex].e === 'open' && !atk ? blink : 0}|${gaze}`;
    st.mkHandF = id === 'alarm' && w > 0.4 ? 'cup' : (id === 'email' || id === 'invite') && w > 0.4 ? 'open' : yawn > 0.4 ? 'open' : 'cookie';
    return out;
  },
  fx(ctx, m, a, S, matOf) {
    const t = a.t;
    const cm = a.mkCast;
    // Envelopes flying off her hands while she flings the emails.
    if (cm?.id === 'email' && cm.w > 0.3) {
      for (const [part, j] of [['handF', 'wrF'], ['handN', 'wrN']]) {
        const [hx, hy] = through(matOf(part), j, j);
        for (let i = 0; i < 2; i++) {
          const u = (((cm.s * 1.6 + i * 0.5 + (part === 'handF' ? 0.25 : 0)) % 1) + 1) % 1;
          ctx.save();
          ctx.globalAlpha = (a.alpha ?? 1) * cm.w * (1 - u);
          ctx.translate(hx + (i ? 14 : -10) * u, hy - 6 - u * 34);
          ctx.rotate(u * 3 + i);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#8a80b0';
          ctx.lineWidth = 0.8;
          ctx.fillRect(-5, -3.4, 10, 6.8);
          ctx.strokeRect(-5, -3.4, 10, 6.8);
          ctx.beginPath();
          ctx.moveTo(-5, -3.4);
          ctx.lineTo(0, 0.6);
          ctx.lineTo(5, -3.4);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // Rings of sound off her while she shouts the alarm.
    if (cm?.id === 'alarm' && cm.w > 0.3) {
      const [mx, my] = through(matOf('head'), 'mouth', 'neck');
      ctx.strokeStyle = '#fff3a6';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const r = 8 + i * 7 + ((t * 26) % 7);
        ctx.globalAlpha = (a.alpha ?? 1) * cm.w * (1 - i / 3.4);
        ctx.beginPath();
        ctx.arc(mx + 6, my, r, -0.7, 0.7);
        ctx.stroke();
      }
    }
    // Crumbs falling while she nibbles.
    if ((a.mkChew ?? 0) > 0.3) {
      const [hx, hy] = through(matOf('head'), 'mouth', 'neck');
      for (let i = 0; i < 3; i++) {
        const u = (((t * 1.4 + i / 3) % 1) + 1) % 1;
        dot(ctx, a, hx + 2 + i * 2.4 - u * 2, hy + 4 + u * 26, 0.9, (1 - u) * a.mkChew, '#e8a040');
      }
    }
    // A glint off the gold nib now and then.
    const [nx, ny] = through(matOf('pen'), 'nib', 'pen');
    const P2 = 2.6;
    const g = (((t + (m.uid % 3)) % P2) + P2) % P2 / P2;
    if (g < 0.25) sparkle(ctx, a, nx, ny, 2.2 * Math.sin((Math.PI * g) / 0.25), 0.9, '#fff3c8');
    // Z's drifting up while she sleeps.
    if ((a.mkSleep ?? 0) > 0.2) {
      const [hx, hy] = through(matOf('head'), 'crown', 'neck');
      for (let i = 0; i < 3; i++) {
        const P3 = 2.4;
        const u = (((t + i * 0.8) % P3) + P3) % P3 / P3;
        ctx.globalAlpha = (a.alpha ?? 1) * Math.sin(Math.PI * u) * a.mkSleep;
        ctx.fillStyle = '#e8dcff';
        ctx.font = `bold ${7 + u * 5}px sans-serif`;
        ctx.fillText('z', hx + 18 + u * 12, hy - 4 - u * 22);
      }
      ctx.globalAlpha = 1;
    }
  },
  parts: twoPass([
    K.layer('torso', { joint: true, pivot: 'hip', at: (S) => [rel('hip')[0] + S.x, rel('hip')[1] - S.lift], rot: (S) => S.tilt * D2R }),
    K.layer('hairB0', { parent: 'head', pivot: 'neck', from: 'neck', soft: { ...SOFT.HAIR, k: 80, max: 8, gain: 0.3 } }),
    K.layer('hairB1', { parent: 'hairB0', pivot: 'neck', from: 'neck', soft: { ...SOFT.HAIR, k: 60, max: 9, gain: 0.4, hang: 0.6 } }),
    K.layer('armFu', { parent: 'torso', pivot: 'shF', from: 'hip', rot: (S) => S.shF * D2R }),
    K.layer('armFf', { parent: 'armFu', pivot: 'elF', rot: (S) => S.elF * D2R }),
    { ...K.layer('handF', { parent: 'armFf', pivot: 'wrF' }), s: (a, S, b) => K.piece('handF', a.mo.rig?.mkHandF ?? 'cookie', b) },
    ...WK.parts(),
    K.layer('skirt', { parent: 'torso', pivot: 'skirt', from: 'hip', soft: { ...SOFT.CLOTH, max: 12 } }),
    K.layer('body', { parent: 'torso', pivot: 'hip' }),
    K.layer('sashBow', { parent: 'torso', pivot: 'sashBow', from: 'hip', soft: { ...SOFT.FLAP, max: 22 } }),
    K.layer('bow', { parent: 'torso', pivot: 'bow', from: 'hip', soft: { ...SOFT.FLAP, max: 14, gain: 0.2 } }),
    { ...K.layer('head', { parent: 'torso', pivot: 'neck', from: 'hip', rot: (S) => S.head * D2R }), s: (a, S, b) => K.piece('head', a.mo.rig?.mkFace ?? 'idle|0|c', b) },
    K.layer('fringe', { parent: 'head', pivot: 'crown', from: 'neck', soft: SOFT.FRINGE }),
    { ...K.layer('brows', { parent: 'head', pivot: 'neck', from: 'neck' }), s: (a, S, b) => K.piece('brows', (a.mo.rig?.mkFace ?? 'idle').split('|')[0], b) },
    K.layer('band', { parent: 'head', pivot: 'neck', from: 'neck' }),
    K.layer('earF', { parent: 'head', pivot: 'earF', from: 'neck', soft: { ...SOFT.FLAP, k: 150, max: 16, gain: 0.3 } }),
    K.layer('earN', { parent: 'head', pivot: 'earN', from: 'neck', soft: { ...SOFT.FLAP, k: 150, max: 16, gain: 0.3 } }),
    K.layer('armNu', { parent: 'torso', pivot: 'shN', from: 'hip', rot: (S) => S.shN * D2R }),
    K.layer('armNf', { parent: 'armNu', pivot: 'elN', rot: (S) => S.elN * D2R }),
    K.layer('pen', { parent: 'armNf', pivot: 'pen', from: 'wrN', rot: (S) => S.hdN * D2R }),
    K.layer('handN', { parent: 'armNf', pivot: 'wrN' }),
  ]),
});

export const mondayKidStill = K.still;
export { mondayKidShapes };
