// The Clockwork Carnival's toys, remade from scratch for Chapter 6 (2026-11-18): Queen Gearheart's
// wind-up troupe, who have to keep performing while anyone's watching. Live puppets on the rig
// (rig.js): every part drawn once and placed each frame, outer outline only, faces bare; all upright
// and chibi, no thin legs (chunky little legs, a tutu, a box to hop in, strings to dance on); most
// with a brass key in their back, turning as they go.
//
//   musicballerina  Music Box Ballerina: a tiny dancer on the lid of her music box, notes rising.
//                   The box hops along while she holds an arabesque; pirouettes; curtsies. A grand
//                   battement kick, spinning.
//   balloonseller   Balloon Seller: a balloon poodle standing on its hind legs, a bunch of balloons
//                   in its paw. Squeaky bouncing steps; flops its ears. Bonks you with the bunch.
//   tindrummer      Tin Drummer: a tin soldier in a tall shako with a red drum. Marches stiff-legged,
//                   drumrolls. Both sticks up and BOOM, rings of sound.
//   jackbox         Jack-in-the-Box: a starry box that hops, its crank turning, Jack swaying on his
//                   spring. Ducks in and pops out; springs out at you.
//   marionette      Marionette Dancer: a wooden puppet girl on strings from a control bar above,
//                   dancing a jig; yanked into a flying kick.
//   teddystrong     Teddy Strongbear: a circus strongman teddy in a striped leotard with a curly
//                   moustache and a barbell. Waddles; lifts reps. Slams the barbell down.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, INK, fr, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, put, shift, MOODS, moodOf, sparkle, note, puff } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const GOLD = ramp('#ffd36b', { step: 10, turn: 8 });
const SKIN = ramp('#ffe4d6', { step: 7, turn: 8, lift: 3 });
// A brass wind-up key, side on: its stem into the back, its bow. Box 9 x 6; the stem's root at (1, 3).
const keyShapes = () => [taper([[1, 3], [4, 3]], 1.2, 1.2, GOLD.sh), ...stroke(arcP(6, 3, 2, 2.4, 0, 360, 12), 1.1, GOLD.base), E(1, 3, 1, 1.6, GOLD.base)];
// Where a point in a part's own space sits in the rig's space.
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
// A whole turn: the rig mirrored for half of each turn.
const spinWrap = (rig, spinning) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => draw(ctx, m, spinning(m, a) ? { ...a, flip: !a.flip, spun: true } : a);
  return rig;
};

// =====================================================================================
// Music Box Ballerina
// =====================================================================================
const TUTU = ramp('#ffc4dc', { step: 8, turn: 8 });
const LEO = ramp('#ff8fb8', { step: 9, turn: 8 });
const BOXP = ramp('#ff9ac0', { step: 9, turn: 8 });
const BUN = ramp('#a8705a', { step: 9, turn: 10 });
const mb = pairOf('mb');
// The music box: a round drum, its lid on top, a gold scalloped band round its side. Box 26 x 14;
// its joint (the floor) at (13, 13.4).
const mbBox = () => [
  E(13, 11.6, 12, 2.4, BOXP.sh), R(1, 3.4, 24, 8.4, '#fff2e4'), F(R(1, 3.4, 3, 8.4, '#ffffff')),
  ...[0, 1, 2, 3, 4, 5].map((k) => F(E(3.4 + k * 3.9, 6.6, 1.8, 1.4, GOLD.base))), F(R(1, 9, 24, 1.4, BOXP.base)),
  E(13, 3.4, 12, 3, BOXP.base), F(E(11, 2.6, 7, 1.4, BOXP.hi)), F(E(13, 3.4, 3, 0.9, GOLD.base)),
  E(5, 13, 1.8, 1, GOLD.sh), E(21, 13, 1.8, 1, GOLD.sh),
];
// Her tutu: a stiff disc of tulle, layered. Box 22 x 8; its waist at (11, 3).
const mbTutu = () => [E(11, 4.2, 10.8, 3.4, TUTU.base), ...[0, 1, 2, 3, 4, 5, 6].map((k) => E(1.6 + k * 3.15, 5.6 + (k % 2) * 0.6, 1.9, 1.5, TUTU.base)), E(11, 3, 8.6, 2.4, TUTU.hi), F(E(11, 2.6, 4, 1, '#ffffff'))];
// A leg in pink tights and its pointe shoe. Box 5 x 10; the hip at (2.5, 0.5).
const mbLeg = (far) => () => [taper([[2.5, 0.5], [2.4, 6], [2.6, 8.6]], 3.2, 2.4, far ? TUTU.sh : TUTU.hi), E(2.6, 9, 1.6, 1.2, far ? LEO.sh : LEO.base)];
const mbBodice = () => [T([[1.4, 8], [1, 2], [3.6, 0.4], [6.4, 0.4], [9, 2], [8.6, 8]], LEO.base), F(T([[5, 0.8], [3.4, 2.4], [6.6, 2.4]], '#ffffff')), F(E(5, 4.6, 0.7, 0.7, '#fff2b0')), crescent(5, 4.4, 4, 4, LEO.sh, { k: 0.2, a0: 100, a1: 200 })];
// Her head: a round face, hair swept up into a bun, a little tiara. Box 14 x 14; the neck at (7, 13).
const mbHead = () => [
  E(6.4, 8, 6.2, 5.8, BUN.base), E(7, 1.8, 3, 2.6, BUN.base), F(E(6.4, 1.2, 1.4, 0.9, BUN.hi)),
  E(7.4, 8.6, 5.6, 5.2, SKIN.base),
  T([[1.6, 7], [3, 3.6], [7, 2.6], [11.4, 4.4], [12.6, 7.4], [10, 5.4], [6, 5], [3.4, 6.6]], BUN.base),
  ...[[4, 3.2], [7, 2.2], [10, 3.2]].map(([x, y]) => T([[x - 1.2, y + 1.4], [x, y - 1.4], [x + 1.2, y + 1.4]], GOLD.base)), F(E(7, 2.4, 0.6, 0.6, '#ffffff')),
  crescent(7.4, 8.6, 5.6, 5.2, SKIN.sh, { k: 0.18, a0: 100, a1: 200 }),
];
const mbArm = (far) => () => [taper([[1, 2], [5, 2.4], [8, 2]], 2, 1.6, far ? SKIN.sh : SKIN.base), E(8.2, 2, 1.2, 1.1, far ? SKIN.sh : SKIN.base)];
const MB_BOX = mb('box', 26, 14, mbBox, 2);
const MB_TUTU = mb('tutu', 22, 8, mbTutu, 2);
const MB_LEG = [false, true].map((f) => mb(`leg${f ? 1 : 0}`, 5, 10, mbLeg(f), 2));
const MB_BOD = mb('bodice', 10, 8, mbBodice, 2);
const MB_HEAD = mb('head', 14, 14, mbHead, 2);
const MB_ARM = [false, true].map((f) => mb(`arm${f ? 1 : 0}`, 10, 4, mbArm(f), 2));
const MB_KEY = mb('key', 9, 6, keyShapes, 2);
const oLn = (pts, w, c = INK) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = ((-(by - ay) / d) * w) / 2;
    const ny = (((bx - ax) / d) * w) / 2;
    l.push([x + nx, y + ny]);
    r.push([x - nx, y - ny]);
  });
  return [F(T([...l, ...r.reverse()], c))];
};
const oArc = (cx, cy, rx, ry, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const oRing = (cx, cy, rx, ry, rot = 0, n = 16) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)];
});
const oCut = (pts, lid) => pts.map(([px, py]) => [px, Math.max(py, lid(px))]);
const oSquint = (x, y, s, r, w, c = INK) => oLn([[x + s * r, y - r], [x - s * r * 0.8, y], [x + s * r, y + r]], w, c);
const oSpiral = (x, y, r, w, c, s = 1) => oLn(Array.from({ length: 15 }, (_, i) => [x + Math.cos(i * 0.8 * s) * r * (0.12 + i / 15), y + Math.sin(i * 0.8 * s) * r * (0.12 + i / 15)]), w, c);
const oDrop = (x, y, r, c = '#9ad8ff') => [F(E(x, y, r * 0.7, r, c)), F(E(x - r * 0.2, y - r * 0.3, r * 0.25, r * 0.25, '#ffffff'))];
const oStar = (x, y, r, c, n = 5, k = 0.45) => F(T(Array.from({ length: n * 2 }, (_, i) => {
  const a = (i * Math.PI) / n - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const oX = (x, y, w, h, wd, c = INK) => [...oLn([[x - w * 0.7, y - h * 0.55], [x + w * 0.7, y + h * 0.55]], wd, c), ...oLn([[x - w * 0.7, y + h * 0.55], [x + w * 0.7, y - h * 0.55]], wd, c)];
const oWave = (mx, my, hw, wd, c = INK) => oLn(Array.from({ length: 5 }, (_, i) => [mx - hw + (i * hw) / 2, my + (i % 2 ? -0.3 : 0.3)]), wd, c);
const NOLID = () => -99;
// The closed and knocked-about eyes every face has (each face draws its own open eyes).
const oShut = (mood, x, y, s, w, h, lw, sc = INK) => {
  if (mood === 'blink' || mood === 'sleep') return oLn(oArc(x, y + h * 0.1, w, h * 0.35, 15, 165, 8), lw);
  if (mood === 'happy') return oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), lw);
  if (mood === 'hurt') return oSquint(x, y, s, w * 0.8, lw);
  if (mood === 'dizzy') return oSpiral(x, y, w, lw * 0.8, sc, s);
  if (mood === 'dead') return oX(x, y, w, h, lw * 0.9);
  return null;
};
// An open eye's ink, two-tone iris and lid line, all cut by its lid.
const oOpen = (x, y, w, h, lid, top, low) => [F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.08, w * 0.82, h * 0.84), lid), top)), F(T(oCut(oRing(x, y + h * 0.45, w * 0.62, h * 0.4), lid), low))];
const oLid = (x, y, w, h, lid, lw) => oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - lw * 0.25), lw);
const oDot = (x, y, r, c, lid = NOLID) => F(T(oCut(oRing(x, y, r, r, 0, 8), lid), c));
// Her own face, a music-box dancer's: serene eyes half-lowered under pink-shadowed lids with long
// lashes, lilac irises gazing up, a beauty spot and small rosebud lips. Box 14 x 14.
const MB_EYES = [[6.6, 9, -1, 1.2, 1.6], [9.6, 8.8, 1, 1, 1.4]];
const mbOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of MB_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.4, '#7a50b8');
    if (shut) out.push(...shut);
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.15 + (px - x) * -s * 0.6 : mood === 'shout' ? NOLID : () => y - h * 0.3;
      out.push(F(T(oRing(x, y - 0.15, w * 1.08, h * 1.04), '#f4a8c8')), ...oOpen(x, y, w, h, lid, '#7a50b8', '#c8a8f0'), oDot(x + w * 0.1, y + h * (mood === 'shout' ? 0.15 : -0.02), w * 0.3, INK, lid), oDot(x + w * 0.35, y - h * 0.02, w * 0.16, '#ffffff', lid), ...oLid(x, y, w, h, lid, 0.42));
    }
    if (mood !== 'dead' && mood !== 'hurt' && mood !== 'dizzy') out.push(...oLn([[x + s * w * 0.8, y - h * 0.2], [x + s * w * 1.35, y - h * 0.55]], 0.3), ...oLn([[x + s * w * 0.4, y - h * 0.45], [x + s * w * 0.65, y - h * 0.95]], 0.28));
  }
  if (mood !== 'dead') out.push(F(E(5, 10.8, 1, 0.5, '#ffa8c0')), F(E(10.8, 10.6, 0.8, 0.4, '#ffa8c0')));
  out.push(F(E(10.6, 11.6, 0.2, 0.2, '#5a3a4a')));
  const [mx, my] = [8.4, 11.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.2, 0.55, 0.7, '#a83a5a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.2, 0.8, 0.7, 0, 180, 8), '#a83a5a')));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.6, my + 0.2], [mx + 0.6, my + 0.2]], 0.3, '#c84a6a'));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.7, 0.25, '#c84a6a'));
  else out.push(F(E(mx - 0.25, my, 0.32, 0.25, '#e05a7a')), F(E(mx + 0.25, my, 0.32, 0.25, '#e05a7a')), F(E(mx, my + 0.28, 0.4, 0.26, '#e05a7a')));
  if (mood === 'hurt') out.push(...oDrop(11, 8.4, 0.5));
  return out;
};
const mbFace = (mood) => sm(`mb|face|${mood}`, 14, 14, () => mbOwnFace(mood));
// (The pirouette: once every 11 s while she stands still, four quick half-turns.)
const mbSpin = (m, a) => {
  if (a.moving || m.hp <= 0) return false;
  const lu = (a.t + (m.uid % 13) * 0.93) % 11;
  return lu > 3 && lu < 4.6 && Math.floor((lu - 3) / 0.2) % 2 === 1;
};
const mbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `key${tag}`, parent: 'base', s: MB_KEY[i], pivot: [1, 3], at: () => [-11.6, -7], rot: (S) => (180 + S.key) * D2R },
    { name: `box${tag}`, parent: 'base', s: MB_BOX[i], pivot: [13, 13.4] },
    { name: `armF${tag}`, parent: 'hip', s: MB_ARM[1][i], pivot: [1, 2], at: () => [-0.6, -6.4], rot: (S) => S.armF * D2R },
    { name: `legF${tag}`, parent: 'hip', s: MB_LEG[1][i], pivot: [2.5, 0.5], at: () => [-0.6, 0.4], rot: (S) => S.legF * D2R },
    { name: `legS${tag}`, parent: 'hip', s: MB_LEG[0][i], pivot: [2.5, 0.5], at: () => [0.6, 0.4], rot: (S) => S.legS * D2R },
    { name: `tutu${tag}`, parent: 'hip', s: MB_TUTU[i], pivot: [11, 3], at: () => [0, 0.4], rot: (S) => S.tutu * D2R },
    { name: `bodice${tag}`, parent: 'hip', s: MB_BOD[i], pivot: [5, 8] },
    { name: `head${tag}`, parent: 'nk', s: MB_HEAD[i], pivot: [7, 13] },
    { name: `armN${tag}`, parent: 'hip', s: MB_ARM[0][i], pivot: [1, 2], at: () => [1.4, -6.4], rot: (S) => S.armN * D2R },
  ];
};
export const ballerinaRig = spinWrap(makeRig({
  w: 34,
  h: 50,
  soft: true,
  stride: 10,
  recover: 0.6,
  springs: { x: [260, 20], lift: [240, 16], hop: [300, 18], tilt: [200, 14], head: [140, 10], armN: [150, 11], armF: [150, 11], legF: [160, 11], legS: [200, 14], tutu: [160, 8], key: [200, 14] },
  fast: ['x', 'armN', 'armF', 'legF'],
  kick: { tilt: -160, tutu: 300, head: -200 },
  turnKick: { tutu: 260, armN: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.mbU = stepPhase(m, a, 'mb', 10);
    const lu = t % 11;
    const spin = hold(lu, 2.8, 3, 4.6, 4.8);
    const curtsy = hold(lu, 7, 7.5, 8.3, 8.8);
    const br = Math.sin(t * 2);
    a.mbNote = 1 - a.walkW;
    const idle = {
      x: 0, lift: br * 0.3 - curtsy * 2, hop: 0, tilt: Math.sin(t * 1.2) * 3 * (1 - spin), head: br * 3 + curtsy * 10,
      armN: -112 + Math.sin(t * 1.6) * 10 - curtsy * 60 + spin * 70, armF: -128 + Math.sin(t * 1.6 + 1) * 10 + curtsy * 60 + spin * 60,
      legF: curtsy ? 30 * curtsy : 18 + spin * 26, legS: curtsy * -6, tutu: Math.sin(t * 3) * 3 + spin * Math.sin(t * 30) * 4, key: Math.sin(t * 6) * 30,
    };
    // The box hops along while she holds an arabesque.
    const hp = Math.abs(Math.sin(a.mbU * Math.PI));
    const walk = { x: 0, lift: 0, hop: hp * 3, tilt: -6, head: -4, armN: -16, armF: 10, legF: 88, legS: 0, tutu: -hp * 3, key: Math.sin(t * 10) * 30 };
    // The kick: a deep plié, arms in, then a grand battement, spinning.
    const antic = { x: -1, lift: -2.4, hop: 0, tilt: 4, head: 6, armN: 70, armF: 70, legF: 20, legS: -10, tutu: 6, key: 0 };
    const strike = { x: 3, lift: 1.4, hop: 0, tilt: -10, head: -8, armN: -60, armF: -150, legF: -118, legS: 4, tutu: -8, key: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'base', parent: null, at: (S) => [S.x * 0.4, -S.hop] },
    { name: 'hip', parent: 'base', at: (S) => [S.x, -21 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'hip', at: () => [0.4, -7.4], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    ...mbPass(false),
    ...mbPass(true),
    { name: 'face', parent: 'nk', s: (a) => mbFace(moodOf(a, a.ph.atk ? null : 'happy')), pivot: [7, 13] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Notes rising from the music box while she dances.
    for (let k = 0; k < 2; k++) {
      const u = fr(a.now * 0.4 + k / 2 + (m.uid % 5) * 0.2);
      note(ctx, a, -8 + k * 16 + Math.sin(u * 6 + k) * 3, -12 - u * 30, a.alpha * a.mbNote * Math.sin(u * Math.PI) * 0.8, k ? '#ffc0dc' : '#fff2b0', 6);
    }
    if (a.ph.strike > 0.1) {
      const [fx, fy] = at2(mat('legF'), 0.1, 8.5);
      sparkle(ctx, a, fx, fy, 5 * a.ph.strike, a.alpha * a.ph.strike, '#fff2b0');
    }
  },
}), mbSpin);
export function ballerinaStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  const hy = -21;
  return {
    w: 34, h: 52, res: 3,
    shapes: shift([
      ...put(keyShapes(), [1, 3], -11.6, -7, 180), ...put(mbBox(), [13, 13.4], 0, 0),
      ...put(mbArm(true)(), [1, 2], -0.6, hy - 6.4, -128), ...put(mbLeg(true)(), [2.5, 0.5], -0.6, hy + 0.4, 18), ...put(mbLeg(false)(), [2.5, 0.5], 0.6, hy + 0.4),
      ...put(mbTutu(), [11, 3], 0, hy + 0.4), ...put(mbBodice(), [5, 8], 0, hy), ...put(mbHead(), [7, 13], 0.4, hy - 7.4), ...put(mbOwnFace(fm), [7, 13], 0.4, hy - 7.4),
      ...put(mbArm(false)(), [1, 2], 1.4, hy - 6.4, -112),
    ], 17, 51),
  };
}

// =====================================================================================
// Balloon Seller (a balloon poodle)
// =====================================================================================
const BAL = ramp('#ff9ac8', { step: 9, turn: 8 });
const BUNCH = ['#7fe0c8', '#ffd36b', '#c8a8ff', '#7fd8ff', '#ff9a8a'];
const bs = pairOf('bs');
// A sausage balloon from (x1, y1) to (x2, y2), r thick, shiny, a twist at each end.
const sausage = (x1, y1, x2, y2, r, c) => {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return [ov(mx, my, len / 2 + r * 0.4, r, ang, c.base, 16), F(ov(mx - (y2 - y1) * 0.08, my - r * 0.4, len * 0.3, r * 0.3, ang, '#ffffff', 10))];
};
const bsLeg = (far) => () => [...sausage(3, 1, 3, 8, 2.6, far ? { base: BAL.sh } : BAL), E(3.4, 9.4, 1.6, 1, far ? BAL.deep : BAL.sh)];
const bsBody = () => [E(7, 9, 6.4, 6.6, BAL.base), crescent(7, 9, 6.4, 6.6, BAL.sh, { k: 0.2, a0: 100, a1: 220 }), shine(7, 9, 6.4, 6.6, '#ffffff', 0, 1.1)];
// The head: a round balloon, a long snout balloon, a puff on top, a twist for a nose. Box 18 x 14;
// the neck at (6, 13).
const bsHead = () => [
  E(6, 3.4, 4, 3.4, BAL.hi), F(E(5, 2.2, 1.2, 0.9, '#ffffff')),
  E(7, 9, 6.8, 6.2, BAL.base), ...sausage(11.4, 10.4, 18, 11, 2.8, BAL), E(19.2, 11, 1.4, 1.4, '#3a2d4f'),
  crescent(7, 9, 6.8, 6.2, BAL.sh, { k: 0.2, a0: 110, a1: 210 }), shine(7, 9, 6.8, 6.2, '#ffffff', 0, 0.9),
];
const bsEar = (far) => () => [...sausage(2, 1.2, 2.4, 8, 2.2, far ? { base: BAL.sh } : BAL)];
const bsArm = (far) => () => [...sausage(1, 2, 7, 2.4, 2, far ? { base: BAL.sh } : BAL), E(8.2, 2.4, 1.2, 1.2, far ? BAL.deep : BAL.sh)];
const bsTail = () => [taper([[1, 6], [3, 2]], 1.4, 1, BAL.sh), E(3.6, 2, 2.6, 2.2, BAL.hi), F(E(3, 1.4, 0.9, 0.7, '#ffffff'))];
const BS_LEG = [false, true].map((f) => bs(`leg${f ? 1 : 0}`, 6, 11, bsLeg(f), 2));
const BS_BODY = bs('body', 14, 16, bsBody, 2);
const BS_HEAD = bs('head', 21, 16, bsHead, 2);
const BS_EAR = [false, true].map((f) => bs(`ear${f ? 1 : 0}`, 5, 10, bsEar(f), 2));
const BS_ARM = [false, true].map((f) => bs(`arm${f ? 1 : 0}`, 10, 5, bsArm(f), 2));
const BS_TAIL = bs('tail', 7, 7, bsTail, 2);
// Its own face, a balloon dog's (side on): one glossy black eye with a long rubbery streak of shine, a
// happy dog grin along its snout and its tongue lolling out. Box 21 x 16.
const bsOwnFace = (mood) => {
  const out = [];
  const [x, y, s, w, h] = [9.6, 7.6, 1, 1.5, 1.9];
  const shut = oShut(mood, x, y, s, w, h, 0.5, '#3a2d4f');
  if (shut) out.push(...shut);
  else {
    const lid = mood === 'angry' ? (px) => y - h * 0.25 + (px - x) * 0.6 : NOLID;
    const k = mood === 'shout' ? 1.12 : 1;
    out.push(F(T(oCut(oRing(x, y, w * k, h * k), lid), '#241a30')), ...oLn(oCut(oArc(x, y, w * 0.62 * k, h * 0.68 * k, 200, 290, 6), lid), 0.42, '#ffffff'), oDot(x + w * 0.35, y + h * 0.42, w * 0.12, '#ffffff', lid));
    if (mood === 'angry') out.push(...oLid(x, y, w, h, lid, 0.5));
  }
  if (mood !== 'dead') out.push(F(E(8.4, 11.4, 1.3, 0.6, '#ff8ab0')));
  const [mx, my] = [13, 13.4];
  if (mood === 'shout') out.push(F(T([[mx - 1.8, my - 0.6], [mx + 1.6, my - 1], [mx + 1.4, my + 0.8], [mx - 1.4, my + 0.7]], '#8a2a4a')), F(E(mx, my + 0.4, 0.9, 0.35, '#ff9ab8')));
  else if (mood === 'angry') out.push(...oLn([[mx - 1.8, my], [mx, my - 0.2], [mx + 1.6, my - 0.5]], 0.42), F(T([[mx + 0.6, my - 0.3], [mx + 1.1, my - 0.4], [mx + 0.9, my + 0.3]], '#ffffff')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.4, 0.38));
  else if (mood === 'dead') out.push(...oLn([[mx - 1.6, my], [mx + 1.4, my - 0.4]], 0.4));
  else out.push(...oLn([[mx - 1.9, my - 0.6], [mx - 0.8, my + 0.2], [mx + 0.8, my], [mx + 1.7, my - 0.7]], 0.42), F(T([[mx - 0.6, my + 0.1], [mx + 0.5, my], [mx + 0.4, my + 1.3], [mx - 0.1, my + 1.6], [mx - 0.5, my + 1.2]], '#ff8aa8')), ...oLn([[mx - 0.05, my + 0.2], [mx - 0.05, my + 1.1]], 0.2, '#d85a80'));
  if (mood === 'hurt') out.push(...oDrop(11.4, 9.6, 0.6));
  return out;
};
const bsFace = (mood) => sm(`bs|face|${mood}`, 21, 16, () => bsOwnFace(mood));
const bsPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (k, far) => ({ name: `leg${k}${tag}`, parent: 'hip', s: BS_LEG[far ? 1 : 0][i], pivot: [3, 1], at: () => [far ? -1.6 : 1.6, -1], rot: (S) => (far ? S.legF : S.legN) * D2R });
  return [
    { name: `armF${tag}`, parent: 'hip', s: BS_ARM[1][i], pivot: [1, 2], at: () => [-1, -11], rot: (S) => S.armF * D2R },
    { name: `earF${tag}`, parent: 'nk', s: BS_EAR[1][i], pivot: [2, 1.2], at: () => [-3.6, -11], rot: (S) => (10 + S.ear) * D2R },
    leg(1, true),
    { name: `tail${tag}`, parent: 'hip', s: BS_TAIL[i], pivot: [1, 6], at: () => [-6, -5], rot: (S) => (-30 + S.tail) * D2R },
    { name: `body${tag}`, parent: 'hip', s: BS_BODY[i], pivot: [7, 15] },
    leg(0, false),
    { name: `head${tag}`, parent: 'nk', s: BS_HEAD[i], pivot: [6, 15] },
    { name: `earN${tag}`, parent: 'nk', s: BS_EAR[0][i], pivot: [2, 1.2], at: () => [-1.4, -10.6], rot: (S) => (-6 + S.ear) * D2R },
    { name: `armN${tag}`, parent: 'hip', s: BS_ARM[0][i], pivot: [1, 2], at: () => [1.6, -10], rot: (S) => S.armN * D2R },
  ];
};
// The bunch of balloons in its far paw, bobbing on their strings (behind it).
function bsBunch(ctx, m, a, S, mat) {
  if (m.hp <= 0) return;
  const [hx, hy] = at2(mat('armF'), 8, 0.4);
  ctx.globalAlpha = a.alpha;
  for (let k = 0; k < 3; k++) {
    const sway = Math.sin(a.now * 1.6 + k * 2 + m.uid) * 2 + S.bunch * (0.6 + k * 0.2);
    const bx = hx - 4 + k * 4.4 + sway;
    const by = hy - 20 - (k % 2) * 4 + Math.cos(a.now * 1.9 + k) * 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo(hx + sway * 0.3, (hy + by) / 2, bx, by + 4.6);
    ctx.stroke();
    ctx.fillStyle = BUNCH[(k + m.uid) % BUNCH.length];
    ctx.beginPath();
    ctx.ellipse(bx, by, 3.8, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(bx - 1.3, by - 1.6, 0.9, 1.4, -0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = BUNCH[(k + m.uid) % BUNCH.length];
    ctx.beginPath();
    ctx.moveTo(bx - 0.8, by + 5);
    ctx.lineTo(bx + 0.8, by + 5);
    ctx.lineTo(bx, by + 4);
    ctx.fill();
  }
}
export const balloonRig = makeRig({
  w: 34,
  h: 52,
  soft: true,
  stride: 12,
  recover: 0.6,
  springs: { x: [260, 20], lift: [260, 14], tilt: [200, 12], head: [150, 9], ear: [90, 5], armN: [170, 11], armF: [150, 10], legN: [260, 16], legF: [260, 16], tail: [120, 6], bunch: [60, 5] },
  fast: ['x', 'armF', 'tilt'],
  kick: { tilt: -200, ear: 500, head: -260, bunch: 200 },
  turnKick: { ear: 400, tail: 300, bunch: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.bsU = stepPhase(m, a, 'bs', 12);
    const p = a.bsU * TAU;
    const lu = t % 9;
    const tilt = hold(lu, 2, 2.4, 3.4, 3.8);
    const wave = hold(lu, 5.6, 6, 7, 7.4);
    a.bsWave = wave;
    const br = Math.sin(t * 2.2);
    const idle = {
      x: 0, lift: br * 0.4, tilt: br * 1.4, head: tilt * 16 + br * 2, ear: br * 6 + tilt * 10, armN: 50 - wave * 170 + wave * Math.sin(t * 12) * 18, armF: -64 + br * 4,
      legN: 0, legF: 0, tail: Math.sin(t * 5) * 14, bunch: br * 3,
    };
    // Squeaky bouncing steps.
    const s1 = Math.sin(p);
    const walk = { x: 0, lift: Math.abs(Math.cos(p)) * 2.4, tilt: -s1 * 4, head: -s1 * 4, ear: -Math.cos(p) * 20, armN: 30 + s1 * 30, armF: -60 - s1 * 6, legN: s1 * 28, legF: -s1 * 28, tail: s1 * 20, bunch: -s1 * 4 };
    // The bonk: the bunch swung up behind, then down over the top onto you.
    const antic = { x: -2, lift: 0.6, tilt: 8, head: 8, ear: -16, armN: -30, armF: -170, legN: -10, legF: 10, tail: -20, bunch: -8 };
    const strike = { x: 4, lift: 0, tilt: -14, head: -10, ear: 30, armN: 40, armF: 40, legN: 18, legF: -16, tail: 30, bunch: 14 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -9 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'hip', at: () => [1.4, -13.4], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    ...bsPass(false),
    ...bsPass(true),
    { name: 'face', parent: 'nk', s: (a) => bsFace(moodOf(a, !a.ph.atk && a.bsWave > 0.5 ? 'happy' : null)), pivot: [6, 15] },
  ],
  under: bsBunch,
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike > 0.2) {
      const [hx, hy] = at2(mat('armF'), 8, 0.4);
      sparkle(ctx, a, hx + 6, hy - 6, 6 * a.ph.strike, a.alpha * a.ph.strike, '#ffd36b');
      puff(ctx, a, hx + 4, hy - 2, 5 * a.ph.strike, a.alpha * a.ph.strike * 0.5);
    }
  },
});
export function balloonStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  const hy = -9;
  return {
    w: 34, h: 52, res: 3,
    shapes: shift([
      ...[0, 1, 2].map((k) => E(-6 + k * 4.4, hy - 40 - (k % 2) * 4, 3.8, 4.6, BUNCH[k])),
      ...put(bsArm(true)(), [1, 2], -1, hy - 11, -64), ...put(bsEar(true)(), [2, 1.2], -2.2, hy - 24.4, 10), ...put(bsLeg(true)(), [3, 1], -1.6, hy - 1),
      ...put(bsTail(), [1, 6], -6, hy - 5, -30), ...put(bsBody(), [7, 15], 0, hy), ...put(bsLeg(false)(), [3, 1], 1.6, hy - 1),
      ...put(bsHead(), [6, 15], 1.4, hy - 13.4), ...put(bsOwnFace(fm), [6, 15], 1.4, hy - 13.4),
      ...put(bsEar(false)(), [2, 1.2], 0, hy - 24, -6), ...put(bsArm(false)(), [1, 2], 1.6, hy - 10, 50),
    ], 17, 51),
  };
}

// =====================================================================================
// Tin Drummer
// =====================================================================================
const JACK = ramp('#4f7ad8', { step: 10, turn: 8 });
const TRED = ramp('#e8505a', { step: 10, turn: 8 });
const TROU = ramp('#3a4a9a', { step: 9, turn: 8 });
const BOOT = '#3a3050';
const td = pairOf('td');
const tdLeg = (far) => () => [R(1, 0, 4.4, 7, far ? TROU.sh : TROU.base), F(R(3.6, 0, 0.8, 7, TRED.base)), E(3.6, 8.4, 3, 1.8, far ? '#2a2240' : BOOT), F(E(3, 7.8, 1.2, 0.5, '#6a5a8a'))];
// The jacket: a little tunic, white crossbelts, gold buttons. Box 14 x 13; its hem at (7, 12.6).
const tdBody = () => [
  T([[1.6, 12.6], [1.4, 3], [4, 0.6], [10, 0.6], [12.6, 3], [12.4, 12.6]], JACK.base), F(R(1.6, 10.6, 10.8, 2, JACK.sh)),
  F(taper([[3, 1.4], [11, 11]], 1.4, 1.4, '#fff6ea')), F(taper([[11, 1.4], [3, 11]], 1.4, 1.4, '#fff6ea')),
  ...[3.6, 6.4, 9].map((y) => F(E(7, y, 0.7, 0.7, GOLD.base))),
  T([[3.4, 0.6], [10.6, 0.6], [9.6, 2.4], [4.4, 2.4]], TRED.base),
  crescent(7, 7, 6, 6, JACK.sh, { k: 0.2, a0: 110, a1: 200 }),
];
// The drum: red, white cords zigzagging between gold rims. Box 14 x 11; hung at (7, 5.5).
const tdDrum = () => {
  const out = [R(1, 2, 12, 7.6, TRED.base), E(7, 9.6, 6, 1.4, TRED.sh)];
  const zz = [];
  for (let k = 0; k <= 6; k++) zz.push([1.4 + k * 1.86, k % 2 ? 8.4 : 3]);
  out.push(...stroke(zz, 0.6, '#fff6ea'));
  out.push(R(0.6, 1.4, 12.8, 1.4, GOLD.base), R(0.6, 8.8, 12.8, 1.4, GOLD.base), E(7, 1.6, 6.2, 1.5, '#fff6f0'), F(E(6, 1.4, 3, 0.6, '#ffffff')), F(R(1, 2.8, 1.6, 6, TRED.hi)));
  return out;
};
// The head: round, painted rosy cheeks. Box 12 x 11; the neck at (6, 10.6).
const tdHead = () => [E(6.2, 6, 5.4, 5, SKIN.base), crescent(6.2, 6, 5.4, 5, SKIN.sh, { k: 0.18, a0: 100, a1: 200 }), T([[1, 4], [3, 1.8], [6, 1.4], [3.4, 3.6]], '#6a4a3a')];
// The shako: a tall red hat, a gold plate, a peak, a white plume rooted in its crown. Box 11 x 15;
// it sits at (5.5, 14).
const tdHat = () => [
  E(5.5, 2.6, 2.4, 2.6, '#ffffff'), F(E(5, 1.8, 1, 1.2, '#fff6ea')), R(3.4, 2.6, 4.2, 2, GOLD.base),
  T([[1, 13.6], [1.6, 4], [9.4, 4], [10, 13.6]], TRED.base), F(R(1.6, 4, 1.4, 9.6, TRED.hi)), R(0.6, 12, 9.8, 2, GOLD.base),
  T([[4, 6], [7, 6], [7.4, 9], [5.5, 10.4], [3.6, 9]], GOLD.base), F(E(5.5, 8, 0.8, 0.8, '#fff2b0')),
  T([[6, 13.6], [11, 13], [10.4, 14.6], [6, 14.6]], BOOT),
];
const tdArm = (far) => () => [R(0.6, 0.6, 6, 3, far ? JACK.sh : JACK.base), E(7.4, 2, 1.8, 1.7, '#ffffff')];
const tdStick = () => [taper([[1, 1.4], [11, 1.4]], 0.9, 0.7, '#c89a6a'), E(11.4, 1.4, 1.4, 1.4, '#fff2e0')];
const TD_LEG = [false, true].map((f) => td(`leg${f ? 1 : 0}`, 7, 10, tdLeg(f), 2));
const TD_BODY = td('body', 14, 13, tdBody, 2);
const TD_DRUM = td('drum', 14, 11, tdDrum, 2);
const TD_HEAD = td('head', 12, 11, tdHead, 2);
const TD_HAT = td('hat', 11, 15, tdHat, 2);
const TD_ARM = [false, true].map((f) => td(`arm${f ? 1 : 0}`, 9, 4, tdArm(f), 2));
const TD_STICK = td('stick', 13, 3, tdStick, 2);
const TD_KEY = td('key', 9, 6, keyShapes, 2);
// His own face, a painted toy soldier's: little black dot eyes under bold painted brows, round red cheeks
// painted on and a short straight mouth; a fierce "hup!" to shout. Box 12 x 11.
const TD_EYES = [[7.6, 6, 1, 1, 1.4], [4.4, 6, -1, 0.8, 1.2]];
const tdOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of TD_EYES) {
    const inner = mood === 'angry' ? 0.6 : mood === 'hurt' ? -0.5 : mood === 'shout' || mood === 'happy' ? -0.3 : 0.15;
    if (mood !== 'dead') out.push(...oLn([[x - s * w * 0.9, y - h * 1 + inner], [x + s * w * 0.9, y - h * 1.12 - inner * 0.3]], 0.5));
    const shut = oShut(mood, x, y, s, w * 0.8, h * 0.8, 0.38, '#3a2d4f');
    if (shut) { out.push(...shut); continue; }
    const k = mood === 'shout' ? 0.75 : 1;
    out.push(F(E(x, y + 0.1, w * 0.48 * k, h * 0.5 * k, '#1e1828')), F(E(x + w * 0.18, y - h * 0.12, w * 0.15, w * 0.15, '#ffffff')));
  }
  if (mood !== 'dead') for (const [bx, by, r] of [[3.8, 8, 0.95], [9.6, 7.8, 0.95]]) out.push(F(E(bx, by, r, r, '#ff5a6a')), F(E(bx - r * 0.3, by - r * 0.3, r * 0.3, r * 0.25, '#ffb0b8')));
  const [mx, my] = [7, 8.6];
  if (mood === 'shout') out.push(F(T([[mx - 0.7, my - 0.3], [mx + 0.7, my - 0.3], [mx + 0.5, my + 0.8], [mx - 0.5, my + 0.8]], '#7a2a2a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.2, 0.7, 0.6, 0, 180, 8), '#7a2a2a')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.65, 0.25));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.1, 0.3, 0.35, '#7a2a2a')));
  else out.push(...oLn([[mx - 0.6, my], [mx + 0.6, my - (mood === 'angry' ? 0 : 0.05)]], 0.35));
  if (mood === 'hurt') out.push(...oDrop(9.4, 5.4, 0.45));
  return out;
};
const tdFace = (mood) => sm(`td|face|${mood}`, 12, 11, () => tdOwnFace(mood));
const tdPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `stickF${tag}`, parent: 'handF', s: TD_STICK[i], pivot: [1, 1.4], rot: (S) => (-50 + S.stickF) * D2R },
    { name: `armF${tag}`, parent: 'trunk', s: TD_ARM[1][i], pivot: [0.6, 2], at: () => [-1.6, -10], rot: (S) => S.armF * D2R },
    { name: `legF${tag}`, parent: 'hip', s: TD_LEG[1][i], pivot: [3, 0.4], at: () => [-1.6, 0], rot: (S) => S.legF * D2R },
    { name: `key${tag}`, parent: 'trunk', s: TD_KEY[i], pivot: [1, 3], at: () => [-6.6, -7], rot: (S) => (180 + S.key) * D2R },
    { name: `legN${tag}`, parent: 'hip', s: TD_LEG[0][i], pivot: [3, 0.4], at: () => [1.4, 0], rot: (S) => S.legN * D2R },
    { name: `body${tag}`, parent: 'trunk', s: TD_BODY[i], pivot: [7, 12.6] },
    { name: `head${tag}`, parent: 'nk', s: TD_HEAD[i], pivot: [6, 10.6] },
    { name: `hat${tag}`, parent: 'nk', s: TD_HAT[i], pivot: [5.5, 14], at: () => [0.4, -6.6], rot: (S) => S.hat * D2R },
    { name: `drum${tag}`, parent: 'trunk', s: TD_DRUM[i], pivot: [7, 5.5], at: () => [5, -4.6], rot: (S) => S.drum * D2R },
    { name: `armN${tag}`, parent: 'trunk', s: TD_ARM[0][i], pivot: [0.6, 2], at: () => [1.4, -10], rot: (S) => S.armN * D2R },
    { name: `stickN${tag}`, parent: 'handN', s: TD_STICK[i], pivot: [1, 1.4], rot: (S) => (-50 + S.stickN) * D2R },
  ];
};
export const drummerRig = makeRig({
  w: 34,
  h: 50,
  soft: true,
  stride: 12,
  recover: 0.6,
  springs: { x: [260, 20], lift: [300, 18], tilt: [240, 16], head: [180, 12], hat: [140, 8], armN: [600, 30], armF: [600, 30], stickN: [600, 30], stickF: [600, 30], legN: [300, 20], legF: [300, 20], drum: [160, 9], key: [200, 14] },
  fast: ['x', 'armN', 'armF', 'stickN', 'stickF'],
  kick: { tilt: -200, hat: 400, head: -200, drum: 200 },
  turnKick: { hat: 300, drum: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.tdU = stepPhase(m, a, 'td', 12);
    const p = a.tdU * TAU;
    const lu = t % 8;
    const roll = hold(lu, 1, 1.3, 3.4, 3.7);
    const salute = hold(lu, 5.4, 5.8, 6.6, 7);
    const br = Math.sin(t * 2);
    const beat = Math.sin(t * (roll ? 26 : 7));
    const idle = {
      x: 0, lift: br * 0.2, tilt: br * 0.8, head: Math.sin(t * 3.5) * 2, hat: Math.sin(t * 3.5 + 1) * 3,
      armN: 34 + beat * (roll ? 10 : 14) - salute * 150, armF: 34 - beat * (roll ? 10 : 14), stickN: beat * 8 + salute * 50, stickF: -beat * 8,
      legN: 0, legF: 0, drum: 0, key: Math.sin(t * 6) * 30,
    };
    // The march: stiff legs swinging, a drum beat on every step.
    const s1 = Math.sin(p);
    const walk = { x: 0, lift: Math.abs(Math.cos(p)) * 1.2, tilt: 0, head: -s1 * 2, hat: s1 * 4, armN: 34 + s1 * 16, armF: 34 - s1 * 16, stickN: s1 * 10, stickF: -s1 * 10, legN: s1 * 24, legF: -s1 * 24, drum: s1 * 2, key: Math.sin(t * 9) * 30 };
    // BOOM: both sticks up high, then down on the drum together.
    const antic = { x: -1.6, lift: 0.6, tilt: 8, head: 8, hat: -8, armN: -120, armF: -110, stickN: -20, stickF: -20, legN: 6, legF: -6, drum: -4, key: 0 };
    const strike = { x: 3, lift: 0, tilt: -10, head: -6, hat: 14, armN: 44, armF: 40, stickN: 26, stickF: 26, legN: -8, legF: 10, drum: 6, key: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -9.4 - S.lift] },
    { name: 'trunk', parent: 'hip', at: () => [0, 1.6], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [0.4, -12.4], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'handN', parent: 'armN', at: () => [7.4, 2] },
    { name: 'handF', parent: 'armF', at: () => [7.4, 2] },
    ...tdPass(false),
    ...tdPass(true),
    { name: 'face', parent: 'nk', s: (a) => tdFace(moodOf(a)), pivot: [6, 10.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike <= 0.05 || m.hp <= 0) return;
    // Rings of sound off the drum.
    const [dx, dy] = at2(mat('drum'), 6, 0);
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const u = clamp(a.ph.since * 2.4 - k * 0.22, 0, 1);
      if (u <= 0 || u >= 1) continue;
      ctx.globalAlpha = a.alpha * (1 - u) * 0.9;
      ctx.strokeStyle = k % 2 ? '#ffd36b' : '#fff6ea';
      ctx.lineWidth = 1.6 - u;
      ctx.beginPath();
      ctx.arc(dx + 2, dy, 4 + u * 18, -0.9, 0.9);
      ctx.stroke();
    }
  },
});
export function drummerStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -7.8;
  const ny = by - 12.4;
  return {
    w: 34, h: 50, res: 3,
    shapes: shift([
      ...put(tdArm(true)(), [0.6, 2], -1.6, by - 10, 34), ...put(tdLeg(true)(), [3, 0.4], -1.6, -9.4), ...put(keyShapes(), [1, 3], -6.6, by - 7, 180), ...put(tdLeg(false)(), [3, 0.4], 1.4, -9.4),
      ...put(tdBody(), [7, 12.6], 0, by), ...put(tdHead(), [6, 10.6], 0.4, ny), ...put(tdOwnFace(fm), [6, 10.6], 0.4, ny), ...put(tdHat(), [5.5, 14], 0.8, ny - 6.6),
      ...put(tdDrum(), [7, 5.5], 5, by - 4.6), ...put(tdArm(false)(), [0.6, 2], 1.4, by - 10, 34), ...put(tdStick(), [1, 1.4], 7, by - 4, -16),
    ], 17, 49),
  };
}

// =====================================================================================
// Jack-in-the-Box
// =====================================================================================
const JBX = ramp('#b48ae8', { step: 9, turn: 8 });
const JRED = ramp('#ff6b8a', { step: 9, turn: 8 });
const JBLU = ramp('#7fd8ff', { step: 9, turn: 8 });
const jb = pairOf('jbox');
// The box: lilac, gold trim, a big star on the side. Box 22 x 19; its joint (the floor) at (11, 18.6).
const jbBox = () => [
  R(1, 1, 20, 17, JBX.base), F(R(1, 1, 3, 17, JBX.hi)), F(R(17.4, 1, 3.6, 17, JBX.sh)),
  R(0.4, 0.4, 21.2, 2.2, GOLD.base), R(0.4, 16.4, 21.2, 2.2, GOLD.sh),
  T([[11, 4.4], [12.6, 8], [16.4, 8.2], [13.4, 10.6], [14.4, 14.4], [11, 12.2], [7.6, 14.4], [8.6, 10.6], [5.6, 8.2], [9.4, 8]], GOLD.base),
  F(E(10.4, 8.4, 1.2, 0.8, '#fff6c8')),
];
const jbLid = () => [R(0, 0, 22, 3.6, JBX.base), F(R(0, 0, 22, 1.2, JBX.hi)), R(0, 2.6, 22, 1.2, GOLD.base), E(20.6, 1.8, 1.4, 1.4, GOLD.sh)];
// The crank, on the side: a gold arm and its knob, turning about its hub. Box 10 x 10; the hub at (5, 5).
const jbCrank = () => [taper([[5, 5], [5, 0.8]], 1.2, 1, GOLD.sh), E(5, 0.8, 1.4, 1.4, JRED.base), E(5, 5, 1.6, 1.6, GOLD.base)];
// Jack: a round clown face, a jester's cap with two bells, a ruff. Box 18 x 20; his ruff at (9, 19).
const jbHead = () => [
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => E(2 + k * 2, 17.4 + (k % 2) * 0.8, 1.8, 1.6, '#ffffff')),
  E(9, 11, 6.2, 5.8, '#fff2ea'), crescent(9, 11, 6.2, 5.8, '#f2d8cc', { k: 0.18, a0: 100, a1: 200 }),
  T([[2.6, 8.6], [1, 1.6], [5.6, 5], [9, 0.6], [12.4, 5], [17, 1.6], [15.4, 8.6]], JRED.base),
  T([[9, 0.6], [12.4, 5], [17, 1.6], [15.4, 8.6], [9, 7.4]], JBLU.base),
  E(1, 1.6, 1.6, 1.6, GOLD.base), E(17, 1.6, 1.6, 1.6, GOLD.base), E(9, 0.6, 1.4, 1.4, GOLD.base),
  F(E(13.4, 12.6, 1.6, 1.6, '#ff6b8a')),
];
const JB_BOX = jb('box', 22, 19, jbBox, 2);
const JB_LID = jb('lid', 22, 4, jbLid, 2);
const JB_CRANK = jb('crank', 10, 10, jbCrank, 2);
const JB_HEAD = jb('head', 18, 20, jbHead, 2);
// Its own face, a jack-in-the-box jester's: painted harlequin marks (a blue diamond over one eye, a pink
// tear-star under the other), bright laughing eyes and a wide clown grin. Box 18 x 20.
const JB_EYES = [[11.2, 10, 1, 1.1, 1.5], [7.4, 10, -1, 0.9, 1.3]];
const JB_MOUTH = '#8a1a3a';
const jbOwnFace = (mood) => {
  const out = [];
  out.push(F(T([[11.2, 6.4], [12.2, 7.9], [11.2, 9.1], [10.2, 7.9]], '#5ab0f0')));
  if (mood !== 'dead') out.push(oStar(7.4, 12.5, 0.75, '#ff7ab0', 4, 0.45));
  for (const [x, y, s, w, h] of JB_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.42, '#5ab0f0');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.6 : NOLID;
    out.push(...oOpen(x, y, w, h, lid, '#3a7ad8', '#8ad0ff'), oDot(x, y + h * 0.1, w * (mood === 'shout' ? 0.22 : 0.34), INK, lid), oDot(x + w * 0.32, y - h * 0.2, w * 0.2, '#ffffff', lid), ...oLid(x, y, w, h, lid, 0.42));
  }
  const [mx, my] = [10.4, 14.4];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 1.2, 1.3, JB_MOUTH)), F(E(mx, my + 1, 0.7, 0.35, '#ff8aa8')));
  else if (mood === 'angry') out.push(...oLn([[mx - 1.8, my + 0.4], [mx - 0.6, my - 0.2], [mx + 0.6, my - 0.2], [mx + 1.8, my + 0.4]], 0.42));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.3, 0.35));
  else if (mood === 'dead') out.push(...oLn([[mx - 1.2, my], [mx + 1.2, my]], 0.38));
  else {
    const k = mood === 'happy' ? 1.15 : 1;
    out.push(F(T([...oArc(mx, my - 0.6, 2.2 * k, 1.9 * k, 0, 180, 10)], JB_MOUTH)), F(T(oArc(mx, my - 0.6, 2.2 * k, 1.9 * k, 0, 180, 10).map(([px, py]) => [px, Math.min(py, my - 0.05)]), '#ffffff')), F(E(mx, my + 0.8 * k, 0.9, 0.38, '#ff8aa8')), ...oLn([[mx - 2.4 * k, my - 1.1], [mx - 2.05 * k, my - 0.55]], 0.32), ...oLn([[mx + 2.4 * k, my - 1.1], [mx + 2.05 * k, my - 0.55]], 0.32));
  }
  if (mood === 'hurt') out.push(...oDrop(13, 11.4, 0.5));
  return out;
};
const jbFace = (mood) => sm(`jbox|face|${mood}`, 18, 20, () => jbOwnFace(mood));
// Jack's spring, from the box's mouth up to his ruff: coils, gold, as long as he's out.
function jbSpring(ctx, a, S) {
  const top = -18 - S.pop;
  const n = 6;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const y0 = -17 + ((top + 2 + 17) * k) / n;
    const y1 = -17 + ((top + 2 + 17) * (k + 1)) / n;
    const x0 = (S.lean * k) / n;
    const x1 = (S.lean * (k + 1)) / n;
    ctx.strokeStyle = k % 2 ? GOLD.sh : GOLD.base;
    ctx.beginPath();
    ctx.moveTo(x0 - 3.4, y0);
    ctx.lineTo(x1 + 3.4, (y0 + y1) / 2);
    ctx.lineTo(x1 - 3.4, y1);
    ctx.stroke();
  }
}
const jbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `lid${tag}`, parent: 'bx', s: JB_LID[i], pivot: [1, 3], at: () => [-10, -18], rot: (S) => -S.lid * D2R },
    { name: `box${tag}`, parent: 'bx', s: JB_BOX[i], pivot: [11, 18.6], paint: bare ? (ctx, a, S) => jbSpring(ctx, a, S) : null },
    { name: `head${tag}`, parent: 'jack', s: JB_HEAD[i], pivot: [9, 19], alpha: (a, S) => clamp(S.pop / 3, 0, 1) },
    { name: `crank${tag}`, parent: 'bx', s: JB_CRANK[i], pivot: [5, 5], at: () => [7.4, -9], rot: (S) => S.crank },
  ];
};
export const jackboxRig = makeRig({
  w: 34,
  h: 62,
  soft: true,
  stride: 12,
  recover: 0.6,
  springs: { x: [260, 20], hop: [320, 18], tilt: [220, 14], pop: [260, 9], lean: [150, 7], head: [140, 7], lid: [200, 12], crank: [900, 60] },
  fast: ['x', 'pop', 'lean'],
  kick: { lean: -300, head: -400, tilt: -160 },
  turnKick: { lean: 200, head: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.jbU = stepPhase(m, a, 'jb', 12);
    const lu = t % 10;
    const duck = hold(lu, 4, 4.3, 5.4, 5.5);
    const br = Math.sin(t * 2);
    const sway = Math.sin(t * 1.7);
    a.mo.jbCrank = (a.mo.jbCrank ?? 0) + a.dt * (2 + duck * 10 + a.ph.antic * 14);
    const crank = a.mo.jbCrank;
    const idle = { x: 0, hop: 0, tilt: 0, pop: 12 - duck * 12 + br * 0.6, lean: sway * 4, head: sway * 10, lid: 100 - duck * 100, crank };
    // It hops along, Jack swaying on his spring behind each hop.
    const hp = Math.abs(Math.sin(a.jbU * Math.PI));
    const walk = { x: 0, hop: hp * 4, tilt: Math.sin(a.jbU * TAU) * 5, pop: 10 + hp * 2, lean: -3, head: -8, lid: 100, crank };
    // The pop: down into the box, the crank racing, then out at you.
    const antic = { x: -1, hop: 0, tilt: -4, pop: 2, lean: -2, head: 0, lid: 30, crank };
    const strike = { x: 2, hop: 1, tilt: 6, pop: 24, lean: 14, head: 18, lid: 130, crank };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'bx', parent: null, at: (S) => [S.x, -S.hop], rot: (S) => S.tilt * D2R },
    { name: 'jack', parent: 'bx', at: (S) => [S.lean, -18 - S.pop], rot: (S) => S.head * D2R },
    ...jbPass(false),
    ...jbPass(true),
    { name: 'face', parent: 'jack', s: (a) => jbFace(moodOf(a, a.ph.atk ? null : 'happy')), pivot: [9, 19], alpha: (a, S) => clamp(S.pop / 3, 0, 1) },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike > 0.3) {
      const [hx, hy] = at2(mat('jack'), 6, -10);
      sparkle(ctx, a, hx, hy, 6 * a.ph.strike, a.alpha * a.ph.strike, '#fff2b0');
    }
  },
});
export function jackboxStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  return {
    w: 30, h: 58, res: 3,
    shapes: shift([
      ...put(jbLid(), [1, 3], -10, -18, -100), ...put(jbBox(), [11, 18.6], 0, 0),
      ...stroke([[-3, -18], [3, -21], [-3, -24], [3, -27], [-3, -29]], 1.3, GOLD.base),
      ...put(jbHead(), [9, 19], 0, -30), ...put(jbOwnFace(fm), [9, 19], 0, -30), ...put(jbCrank(), [5, 5], 7.4, -9, 40),
    ], 15, 57),
  };
}

// =====================================================================================
// Marionette Dancer
// =====================================================================================
const WOOD = ramp('#f0d0a0', { step: 8, turn: 10 });
const DRESS = ramp('#7fb8f0', { step: 9, turn: 8 });
const YARN = ramp('#ff7a6a', { step: 9, turn: 8 });
const mn = pairOf('mnet');
// A wooden leg: a peg, a ball knee, a red shoe. Box 6 x 12; the hip at (3, 0.6).
const mnLeg = (far) => () => [taper([[3, 0.6], [3, 5]], 2.6, 2.4, far ? WOOD.sh : WOOD.base), E(3, 5.4, 1.6, 1.6, far ? WOOD.deep : WOOD.sh), taper([[3, 6], [3, 9.6]], 2.4, 2.2, far ? WOOD.sh : WOOD.base), E(3.8, 10.6, 2.2, 1.3, far ? '#c04a4a' : '#ff5a5a')];
const mnArm = (far) => () => [taper([[1, 1.6], [4, 1.8]], 2, 1.8, far ? WOOD.sh : WOOD.base), E(4.4, 1.8, 1.2, 1.2, far ? WOOD.deep : WOOD.sh), taper([[4.6, 1.8], [7.6, 1.8]], 1.8, 1.6, far ? WOOD.sh : WOOD.base), E(8, 1.8, 1.2, 1.2, far ? WOOD.sh : WOOD.base)];
// Her dress: a little bell with a white apron and a scalloped hem. Box 14 x 11; the waist at (7, 1).
const mnDress = () => {
  const hem = [];
  for (let k = 0; k <= 7; k++) hem.push([0.6 + k * 1.83, 10 + (k % 2 ? 1 : 0)]);
  return [T([[3.6, 0.6], [10.4, 0.6], [13.4, 10], ...hem.reverse(), [0.6, 10]], DRESS.base), T([[5, 1.4], [9, 1.4], [10, 9], [4, 9]], '#ffffff'), F(R(4, 8, 6, 1, '#e8e0f0')), crescent(7, 6, 6, 5, DRESS.sh, { k: 0.2, a0: 100, a1: 200 })];
};
const mnBodice = () => [T([[1.6, 7], [2, 1.4], [8, 1.4], [8.4, 7]], DRESS.base), F(R(4.4, 1.4, 1.2, 5.6, '#ffffff')), E(5, 1.4, 2.6, 1, WOOD.base)];
// Her head: a wooden ball, red yarn hair with a fringe, a bow; the pigtails are their own parts.
// Box 14 x 13; the neck at (7, 12.6).
const mnHead = () => [
  E(7, 7, 6, 5.6, YARN.base), E(7.4, 7.6, 5.4, 5, WOOD.base), crescent(7.4, 7.6, 5.4, 5, WOOD.sh, { k: 0.18, a0: 100, a1: 200 }),
  T([[1.6, 6.4], [3, 2.4], [7, 1.4], [11.6, 3], [12.8, 6.4], [10, 4.6], [8, 5.6], [6, 4.6], [3.6, 5.8]], YARN.base),
  T([[6.4, 1.6], [3.6, 0], [3.6, 3.4]], '#7fd8ff'), T([[6.4, 1.6], [9.2, 0], [9.2, 3.4]], '#7fd8ff'), E(6.4, 1.6, 1, 1, '#4fa8d8'),
  F(E(13.2, 8, 0.6, 0.6, WOOD.deep)),
];
const mnTail = (far) => () => [taper([[1.4, 1], [2, 5], [1.2, 8]], 2.6, 1.6, far ? YARN.sh : YARN.base), E(1.6, 1, 1.2, 1, '#7fd8ff')];
const mnCross = () => [R(0, 2, 22, 2.4, '#b8865a'), F(R(0, 2, 22, 0.8, '#d8a878')), R(9.8, 0, 2.4, 6.6, '#a87a4e'), E(1, 3.2, 1.2, 1.2, '#8a6040'), E(21, 3.2, 1.2, 1.2, '#8a6040')];
const MN_LEG = [false, true].map((f) => mn(`leg${f ? 1 : 0}`, 6, 12, mnLeg(f), 2));
const MN_ARM = [false, true].map((f) => mn(`arm${f ? 1 : 0}`, 9, 4, mnArm(f), 2));
const MN_DRESS = mn('dress', 14, 11, mnDress, 2);
const MN_BOD = mn('bodice', 10, 7, mnBodice, 2);
const MN_HEAD = mn('head', 14, 13, mnHead, 2);
const MN_TAIL = [false, true].map((f) => mn(`tail${f ? 1 : 0}`, 4, 9, mnTail(f), 2));
const MN_CROSS = mn('cross', 22, 7, mnCross, 2);
// Her own face, a little puppet girl's: big round painted eyes (blue rings round a dark middle, a white
// ring of shine), painted freckles and a tiny heart of a mouth. Box 14 x 13.
const MN_EYES = [[9, 7.6, 1, 1, 1.4], [5.8, 7.6, -1, 0.8, 1.2]];
const mnOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of MN_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.38, '#3a7ad8');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.6 : NOLID;
    out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y, w * 0.78, h * 0.8), lid), '#4a8ae0')), F(T(oCut(oRing(x, y, w * 0.45, h * 0.47), lid), '#1e2a4a')));
    out.push(...oLn(oCut(oArc(x, y, w * 0.62, h * 0.64, 200, 300, 6), lid), 0.22, '#ffffff'), ...oLid(x, y, w, h, lid, 0.38));
  }
  if (mood !== 'dead') for (const [bx, by] of [[5, 9.7], [10.6, 9.5]]) for (const [dx, dy] of [[-0.45, 0], [0.1, -0.35], [0.45, 0.15]]) out.push(F(E(bx + dx, by + dy, 0.2, 0.2, '#c87a5a')));
  const [mx, my] = [8, 10.4];
  if (mood === 'shout') out.push(F(E(mx, my + 0.2, 0.5, 0.6, '#9a2a4a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.15, 0.7, 0.6, 0, 180, 8), '#9a2a4a')));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.55, my + 0.2], [mx, my], [mx + 0.55, my + 0.2]], 0.28));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.6, 0.24));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.1, 0.25, 0.3, '#9a2a4a')));
  else out.push(F(E(mx - 0.22, my - 0.05, 0.28, 0.25, '#e04a6a')), F(E(mx + 0.22, my - 0.05, 0.28, 0.25, '#e04a6a')), F(T([[mx - 0.48, my + 0.02], [mx + 0.48, my + 0.02], [mx, my + 0.5]], '#e04a6a')));
  if (mood === 'hurt') out.push(...oDrop(10.6, 7.2, 0.45));
  return out;
};
const mnFace = (mood) => sm(`mnet|face|${mood}`, 14, 13, () => mnOwnFace(mood));
const mnPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `cross${tag}`, parent: 'ctl', s: MN_CROSS[i], pivot: [11, 3.2] },
    { name: `tailF${tag}`, parent: 'nk', s: MN_TAIL[1][i], pivot: [1.4, 1], at: () => [-5.4, -7], rot: (S) => (24 + S.tail) * D2R },
    { name: `armF${tag}`, parent: 'body', s: MN_ARM[1][i], pivot: [1, 1.6], at: () => [-1, -6], rot: (S) => S.armF * D2R },
    { name: `legF${tag}`, parent: 'body', s: MN_LEG[1][i], pivot: [3, 0.6], at: () => [-1.4, 4], rot: (S) => S.legF * D2R },
    { name: `legN${tag}`, parent: 'body', s: MN_LEG[0][i], pivot: [3, 0.6], at: () => [1.4, 4], rot: (S) => S.legN * D2R },
    { name: `dress${tag}`, parent: 'body', s: MN_DRESS[i], pivot: [7, 1], at: () => [0, -0.6], rot: (S) => S.skirt * D2R },
    { name: `bodice${tag}`, parent: 'body', s: MN_BOD[i], pivot: [5, 7] },
    { name: `head${tag}`, parent: 'nk', s: MN_HEAD[i], pivot: [7, 12.6] },
    { name: `tailN${tag}`, parent: 'nk', s: MN_TAIL[0][i], pivot: [1.4, 1], at: () => [4.6, -7.6], rot: (S) => (-14 + S.tail) * D2R },
    { name: `armN${tag}`, parent: 'body', s: MN_ARM[0][i], pivot: [1, 1.6], at: () => [1.6, -6], rot: (S) => S.armN * D2R },
  ];
};
export const marionetteRig = makeRig({
  w: 36,
  h: 72,
  soft: true,
  stride: 12,
  recover: 0.6,
  springs: { x: [240, 18], lift: [160, 9], tilt: [160, 10], head: [120, 8], armN: [140, 7], armF: [140, 7], legN: [160, 8], legF: [160, 8], skirt: [120, 7], tail: [90, 5], cross: [140, 9], cy: [160, 10] },
  fast: ['x', 'legN', 'cross'],
  kick: { tilt: -200, head: -300, tail: 400, skirt: 300, cross: 200 },
  turnKick: { tail: 300, skirt: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.mnU = stepPhase(m, a, 'mn', 12);
    const p = a.mnU * TAU;
    const lu = t % 9;
    const bow = hold(lu, 6, 6.5, 7.2, 7.6);
    a.mnBow = bow;
    const jig = Math.sin(t * 5);
    const idle = {
      x: 0, lift: 1 + Math.abs(jig) * 2 - bow, tilt: jig * 3 + bow * 20, head: -jig * 6 + bow * 10, armN: 50 + jig * 40 + bow * 30, armF: 60 - jig * 40, legN: Math.max(0, jig) * -50, legF: Math.max(0, -jig) * -40,
      skirt: jig * 4, tail: jig * 14, cross: jig * 12 + bow * 10, cy: 0,
    };
    // Hop-steps, dangling between them.
    const s1 = Math.sin(p);
    const walk = { x: 0, lift: 2 + Math.abs(Math.cos(p)) * 4, tilt: -4, head: s1 * 4, armN: 40 + s1 * 50, armF: 40 - s1 * 50, legN: s1 * 36, legF: -s1 * 36, skirt: -s1 * 4, tail: s1 * 18, cross: s1 * 10, cy: 0 };
    // Yanked up on her strings, then flung into a flying kick.
    const antic = { x: -2, lift: 8, tilt: 10, head: 8, armN: -150, armF: -150, legN: 30, legF: 40, skirt: 8, tail: -20, cross: -20, cy: -6 };
    const strike = { x: 6, lift: 4, tilt: -16, head: -10, armN: 10, armF: -30, legN: -110, legF: 20, skirt: -10, tail: 30, cross: 24, cy: 2 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'body', parent: null, at: (S) => [S.x, -15 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'body', at: () => [0.4, -6.6], rot: (S) => (S.head - S.tilt * 0.5) * D2R },
    { name: 'ctl', parent: null, at: (S) => [S.x * 0.6 + 2, -60 + S.cy], rot: (S) => S.cross * D2R },
    ...mnPass(false),
    ...mnPass(true),
    { name: 'face', parent: 'nk', s: (a) => mnFace(moodOf(a, !a.ph.atk && a.mnBow > 0.5 ? 'happy' : null)), pivot: [7, 12.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // The strings, from the bar to her hands and head.
    const C = mat('ctl');
    const ends = [at2(C, -10, 0.4), at2(C, 0, 0), at2(C, 10, 0.4)];
    const to = [at2(mat('armF'), 7, 0.2), at2(mat('nk'), 0.4, -12), at2(mat('armN'), 7, 0.2)];
    ctx.globalAlpha = a.alpha * 0.8;
    ctx.strokeStyle = '#f6f0ff';
    ctx.lineWidth = 0.4;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(ends[k][0], ends[k][1]);
      ctx.lineTo(to[k][0], to[k][1]);
      ctx.stroke();
    }
  },
});
export function marionetteStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  const by = -16;
  const ny = by - 6.6;
  return {
    w: 36, h: 70, res: 3,
    shapes: shift([
      ...put(mnCross(), [11, 3.2], 2, -60),
      ...stroke([[-8, -60], [-6, by - 2]], 0.4, '#f6f0ff'), ...stroke([[2, -60], [0.4, ny - 12]], 0.4, '#f6f0ff'), ...stroke([[12, -60], [8, by - 2]], 0.4, '#f6f0ff'),
      ...put(mnTail(true)(), [1.4, 1], -5, ny - 7, 24), ...put(mnArm(true)(), [1, 1.6], -1, by - 6, 60), ...put(mnLeg(true)(), [3, 0.6], -1.4, by + 4), ...put(mnLeg(false)(), [3, 0.6], 1.4, by + 4),
      ...put(mnDress(), [7, 1], 0, by - 0.6), ...put(mnBodice(), [5, 7], 0, by), ...put(mnHead(), [7, 12.6], 0.4, ny), ...put(mnOwnFace(fm), [7, 12.6], 0.4, ny),
      ...put(mnTail(false)(), [1.4, 1], 5, ny - 7.6, -14), ...put(mnArm(false)(), [1, 1.6], 1.6, by - 6, 50),
    ], 18, 69),
  };
}

// =====================================================================================
// Teddy Strongbear
// =====================================================================================
const FUR = ramp('#c8946a', { step: 9, turn: 10 });
const MUZ = '#f6dcc0';
const STRIPE = ramp('#ff6b7a', { step: 9, turn: 8 });
const IRON = ramp('#4a4a6a', { step: 10, turn: 8, lift: 14 });
const tb = pairOf('tb');
const tbLeg = (far) => () => [E(4, 4.6, 3.8, 4.6, far ? FUR.sh : FUR.base), E(4.6, 8.4, 3.2, 1.6, far ? FUR.deep : FUR.sh), F(E(4.8, 8.2, 1.6, 0.8, MUZ))];
// The body: a round tummy in a striped leotard on one strap, a gold belt. Box 22 x 20; the hips at (11, 19).
const tbBody = () => [
  E(11, 11, 10, 9, FUR.base),
  T([[2.4, 9], [19.6, 9], [20.4, 15], [16, 19.4], [6, 19.4], [1.6, 15]], STRIPE.base),
  ...[11.4, 15.4].map((y) => F(R(1.8, y, 18.6, 1.8, '#ffffff'))),
  taper([[14, 9.4], [8, 2.4]], 2, 2, STRIPE.base), F(taper([[13.4, 9], [8.6, 3.4]], 0.6, 0.6, '#ffffff')),
  R(2, 15.6, 18, 2.4, GOLD.base), F(E(11, 16.8, 1.6, 1.2, '#fff2b0')),
  E(13.4, 6.4, 3.6, 2.6, MUZ),
  crescent(11, 11, 10, 9, FUR.sh, { k: 0.2, a0: 110, a1: 210 }),
];
// The head: round, two round ears rooted in it, a muzzle, a curly moustache. Box 20 x 17; the neck at (10, 16).
const tbHead = () => [
  E(4, 3.6, 3.4, 3.2, FUR.base), F(E(4, 3.8, 1.8, 1.6, MUZ)), E(15.4, 3.2, 3.2, 3, FUR.base), F(E(15.4, 3.4, 1.6, 1.4, MUZ)),
  E(10, 9.4, 8.4, 7.2, FUR.base), crescent(10, 9.4, 8.4, 7.2, FUR.sh, { k: 0.18, a0: 100, a1: 210 }),
  E(13.6, 12, 4.6, 3.4, MUZ), E(16.6, 10.4, 1.6, 1.2, '#4a2a2a'), F(E(16.2, 10, 0.5, 0.4, '#ffffff')),
  ...stroke([[16.6, 12], [14.6, 12.4], [13.4, 11.6], [13.6, 10.6]], 0.8, '#6a3a2a'), ...stroke([[16.6, 12], [18.6, 12.4], [19.6, 11.4], [19.2, 10.4]], 0.8, '#6a3a2a'),
];
const tbArm = (far) => () => [taper([[2, 3], [7, 3.4], [9, 3.4]], 4.4, 3.8, far ? FUR.sh : FUR.base), E(9.4, 3.4, 2.4, 2.4, far ? FUR.sh : FUR.base)];
// The barbell: an iron bar and two big iron balls, shiny. Box 36 x 12; gripped at its middle (18, 6).
const tbBell = () => [
  R(5, 5.2, 26, 1.6, '#c8c4e2'), F(R(5, 5.2, 26, 0.6, '#ffffff')),
  ...[5, 31].flatMap((x) => [E(x, 6, 4.8, 4.8, IRON.base), crescent(x, 6, 4.8, 4.8, IRON.deep, { k: 0.2, a0: 60, a1: 200 }), shine(x, 6, 4.8, 4.8, '#ffffff', 0, 1.2)]),
];
const TB_LEG = [false, true].map((f) => tb(`leg${f ? 1 : 0}`, 8, 10, tbLeg(f), 2));
const TB_BODY = tb('body', 22, 20, tbBody, 2);
const TB_HEAD = tb('head', 21, 17, tbHead, 2);
const TB_ARM = [false, true].map((f) => tb(`arm${f ? 1 : 0}`, 12, 7, tbArm(f), 2));
const TB_BELL = tb('bell', 37, 12, tbBell, 2);
const TB_KEY = tb('key', 9, 6, keyShapes, 2);
// Its own face, a strongman teddy's: shiny black safety-eyes with a big glint, a stitched smile under its
// handlebar moustache and a confident grin; brows of darker fur when it means it.
// Box 21 x 17.
const TB_EYES = [[12.6, 7.6, 1, 1.1, 1.5], [8.4, 7.8, -1, 0.9, 1.3]];
const TB_STITCH = '#4a2a1a';
const tbOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of TB_EYES) {
    if (mood === 'angry' || mood === 'shout') out.push(...oLn([[x - s * w * 1, y - h * 1 + (mood === 'angry' ? 0.6 : -0.3)], [x + s * w * 0.9, y - h * 1.15]], 0.6, '#7a4a2a'));
    const shut = oShut(mood, x, y, s, w, h, 0.45, '#3a2d4f');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.15 + (px - x) * -s * 0.55 : NOLID;
    out.push(F(T(oCut(oRing(x, y, w * 0.85, h * 0.8), lid), '#140c10')), oDot(x + w * 0.25, y - h * 0.25, w * 0.28, '#ffffff', lid), oDot(x - w * 0.3, y + h * 0.3, w * 0.1, '#ffffff', lid));
  }
  if (mood !== 'dead') out.push(F(E(7.4, 11, 1.3, 0.6, '#ffa0a0')), F(E(17.6, 9.6, 0.9, 0.45, '#ffa0a0')));
  const [mx, my] = [15, 14.2];
  // (Its handlebar moustache is part of its head; the mouth sits under it.)
  if (mood === 'shout') out.push(F(E(mx + 0.6, my + 0.3, 1.3, 1.1, '#7a2a2a')), F(E(mx + 0.6, my + 0.9, 0.7, 0.3, '#ff9a9a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx + 0.6, my - 0.3, 1.4, 1.2, 0, 180, 8), '#7a2a2a')), F(E(mx + 0.6, my + 0.4, 0.7, 0.3, '#ff9a9a')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx + 0.6, my, 1.2, 0.3, TB_STITCH));
  else if (mood === 'dead') out.push(...oLn([[mx - 0.5, my], [mx + 1.7, my]], 0.3, TB_STITCH));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.5, my + 0.3], [mx + 0.6, my - 0.2], [mx + 1.7, my + 0.3]], 0.32, TB_STITCH));
  else out.push(...oLn(oArc(mx + 0.6, my - 0.7, 1.2, 0.8, 20, 160, 6), 0.32, TB_STITCH), ...[-0.5, 0.6, 1.7].flatMap((dx) => oLn([[mx + dx - 0.15, my - 0.05 + (dx === 0.6 ? 0.15 : -0.1)], [mx + dx + 0.15, my + 0.35 + (dx === 0.6 ? 0.15 : -0.1)]], 0.2, TB_STITCH)));
  if (mood === 'hurt') out.push(...oDrop(14, 8.4, 0.5));
  return out;
};
const tbFace = (mood) => sm(`tb|face|${mood}`, 21, 17, () => tbOwnFace(mood));
const tbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `armF${tag}`, parent: 'trunk', s: TB_ARM[1][i], pivot: [2, 3], at: () => [-2, -14], rot: (S) => S.armF * D2R },
    { name: `legF${tag}`, parent: 'hip', s: TB_LEG[1][i], pivot: [4, 1], at: () => [-3, -1], rot: (S) => S.legF * D2R },
    { name: `key${tag}`, parent: 'trunk', s: TB_KEY[i], pivot: [1, 3], at: () => [-10.4, -11], rot: (S) => (180 + S.key) * D2R },
    { name: `legN${tag}`, parent: 'hip', s: TB_LEG[0][i], pivot: [4, 1], at: () => [3, -1], rot: (S) => S.legN * D2R },
    { name: `body${tag}`, parent: 'trunk', s: TB_BODY[i], pivot: [11, 19] },
    { name: `head${tag}`, parent: 'nk', s: TB_HEAD[i], pivot: [10, 16] },
    { name: `bell${tag}`, parent: 'trunk', s: TB_BELL[i], pivot: [18, 6], at: (S) => [S.bx, S.by], rot: (S) => S.bar * D2R },
    { name: `armN${tag}`, parent: 'trunk', s: TB_ARM[0][i], pivot: [2, 3], at: () => [3, -13], rot: (S) => S.armN * D2R },
  ];
};
export const teddyRig = makeRig({
  w: 44,
  h: 56,
  soft: true,
  stride: 12,
  recover: 0.7,
  springs: { x: [240, 18], lift: [220, 14], tilt: [180, 12], head: [140, 9], armN: [200, 14], armF: [200, 14], legN: [240, 16], legF: [240, 16], bx: [200, 14], by: [200, 14], bar: [160, 10], key: [200, 14] },
  fast: ['x', 'bx', 'by', 'armN', 'armF'],
  kick: { tilt: -140, head: -200, by: 60 },
  turnKick: { bar: 160, head: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.tbU = stepPhase(m, a, 'tb', 12);
    const p = a.tbU * TAU;
    const lu = t % 7;
    // Reps: up over his head, hold, down to his chest.
    const up = hold(lu, 1.2, 1.9, 3, 3.7);
    const br = Math.sin(t * 2);
    a.tbProud = up > 0.8;
    const idle = {
      x: 0, lift: br * 0.4 - up * 0.6, tilt: br * 1.2, head: -up * 8 + br * 2,
      armN: 30 - up * 160, armF: 34 - up * 160, legN: 0, legF: 0,
      bx: 8 - up * 6, by: -10 - up * 24, bar: br * 2, key: Math.sin(t * 6) * 30,
    };
    // A heavy waddle, the barbell at his chest.
    const s1 = Math.sin(p);
    const walk = { x: 0, lift: Math.abs(Math.cos(p)) * 1.4, tilt: s1 * 5, head: -s1 * 3, armN: 34, armF: 38, legN: s1 * 22, legF: -s1 * 22, bx: 8, by: -10 + Math.abs(s1), bar: s1 * 4, key: Math.sin(t * 9) * 30 };
    // The slam: up over his head, leaning back, then down in front of him.
    const antic = { x: -2, lift: -0.6, tilt: 12, head: 10, armN: -150, armF: -150, legN: 8, legF: -8, bx: 0, by: -36, bar: -6, key: 0 };
    const strike = { x: 4, lift: 0.6, tilt: -16, head: -10, armN: 60, armF: 66, legN: -12, legF: 12, bx: 16, by: 2, bar: 8, key: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -8 - S.lift] },
    { name: 'trunk', parent: 'hip', at: () => [0, 1], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [1.4, -17], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    ...tbPass(false),
    ...tbPass(true),
    { name: 'face', parent: 'nk', s: (a) => tbFace(moodOf(a, a.tbProud ? 'happy' : null)), pivot: [10, 16] },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike <= 0.1 || m.hp <= 0) return;
    // The thump: dust and stars where the barbell lands.
    const [bx, by] = at2(mat('bell'), 13, 5);
    puff(ctx, a, bx, by, 6 + a.ph.strike * 6, a.alpha * a.ph.strike * 0.6);
    sparkle(ctx, a, bx + 4, by - 8, 5 * a.ph.strike, a.alpha * a.ph.strike, '#fff2b0');
  },
});
export function teddyStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'happy';
  const by = -7;
  return {
    w: 46, h: 56, res: 3,
    shapes: shift([
      ...put(tbArm(true)(), [2, 3], -2, by - 14, 34), ...put(tbLeg(true)(), [4, 1], -3, -9), ...put(keyShapes(), [1, 3], -10.4, by - 11, 180), ...put(tbLeg(false)(), [4, 1], 3, -9),
      ...put(tbBody(), [11, 19], 0, by), ...put(tbHead(), [10, 16], 1.4, by - 17), ...put(tbOwnFace(fm), [10, 16], 1.4, by - 17),
      ...put(tbBell(), [18, 6], 8, by - 10), ...put(tbArm(false)(), [2, 3], 3, by - 13, 30),
    ], 23, 55),
  };
}
