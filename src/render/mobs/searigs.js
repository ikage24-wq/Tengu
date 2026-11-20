// The Sunken Aquarium Palace's swimmers, remade from scratch for Chapter 5 (2026-11-18). Live
// puppets on the rig (rig.js): every part drawn once and placed each frame, outer outline only,
// faces bare, everything that grows out of them rooted in them (ribbons under the bell, arms under
// the head, fins on the back), no thin legs.
//
//   jellymaid      Jelly Belle: a round pink jelly bell with a face and a flower, a frilled rim, four
//                  ribbon tentacles. Drifts with a pulse; twirls; blushes. Lashes two ribbons.
//   seahorseknight Seahorse Squire: a chubby seahorse in a plumed helmet, a little lance, bouncing
//                  on the spring of its curled tail. Salutes; dozes. Lance thrust.
//   pearldiver     Pearl Otter: an otter in a glass bubble helmet hugging a big pearl, tiny feet, a
//                  flat tail. Polishes the pearl; juggles it. Throws it.
//   stardancer     Star Twirler: a starfish with a bow, skipping on tiptoe on two of its points.
//                  Pirouettes; waves. Cartwheels into a slap.
//   octoscholar    Octo Scholar: a round octopus in glasses and a mortarboard, a book in one arm,
//                  walking on curling arms. Reads; turns a page; pushes up the glasses. Flings the
//                  book in a puff of ink.
//   anglerlamp     Lantern Angler: a round little anglerfish with a cheeky grin and a glowing lure
//                  on a stalk. Bobs; the lure dims and brightens. Lure flash, then a chomp.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, inPart, TAU } from './rig.js';
import { D2R, INK, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, dot, puff, sparkle } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const st = (mood) => (MOODS.has(mood) ? mood : 'idle');

// =====================================================================================
// Jelly Belle
// =====================================================================================
const JELLY = ramp('#ffb3e0', { step: 8, turn: 8, lift: 4 });
const jb = pairOf('jb');
// The bell: a round dome, a flower on top. Box 30 x 22; its rim's middle at (15, 20).
const jbBell = () => [
  E(15, 13, 13.6, 10.6, JELLY.base),
  R(1.6, 13, 26.8, 6, JELLY.base),
  crescent(15, 13, 13.6, 10.6, JELLY.sh, { k: 0.2, a0: 100, a1: 210 }),
  shine(15, 11, 13.6, 10.6, '#ffffff', 0, 0.8),
  ...[0, 1, 2, 3, 4].map((k) => F(E(15 + Math.cos(k * 72 * D2R) * 2, 3 + Math.sin(k * 72 * D2R) * 2, 1.6, 1.6, '#fff6a8'))), F(E(15, 3, 1, 1, '#ff9a5a')),
  ...[0, 1, 2].map((k) => F(E(8 + k * 7, 8 + (k % 2) * 2, 1, 1, '#ffffff'))),
];
// The frilled rim under the bell. Box 32 x 8; hung at (16, 1).
const jbRim = () => {
  const out = [R(2, 0.6, 28, 3, JELLY.sh)];
  for (let i = 0; i <= 7; i++) out.push(E(2 + i * 4, 4, 2.4, 2.6, i % 2 ? JELLY.lit ?? '#ffd0ec' : JELLY.base));
  return out;
};
// A ribbon tentacle, wavy, hanging from its root. Box 10 x 26; root at (5, 1).
const jbRibbon = (k) => () => (k < 2
  ? [taper([[5, 1], [7.4, 4], [3.4, 7], [7, 10], [4, 13]], 5.4, 2.4, k ? '#ffb3e0' : '#ff9ac8'), ...[0, 1, 2].map((j) => E(j % 2 ? 7.6 : 2.6, 3.4 + j * 3.4, 1.6, 1.4, '#ffd6ee'))]
  : [taper([[5, 1], [6, 8], [4, 15], [6, 21], [5, 25]], 1.6, 0.8, k % 2 ? '#c8a0f0' : '#ffb3e0')]);
const JB_BELL = jb('bell', 30, 24, jbBell, 2);
const JB_RIM = jb('rim', 32, 8, jbRim, 2);
const JB_RIB = [0, 1, 2, 3, 4].map((k) => jb(`rib${k}`, 10, 26, jbRibbon(k), 2));
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
// Its own face, a jellyfish's: dreamy pink eyes with little bubbles of light rising in them, a row of
// glowing aqua dots on each cheek and a small round smile. Box 30 x 22.
const JB_EYES = [[12.4, 12.6, -1, 2.1, 2.7], [19.4, 12.4, 1, 1.8, 2.4]];
const jbOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of JB_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.6, '#b04a8a');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.6 : mood === 'shout' ? NOLID : () => y - h * 0.75;
    out.push(...oOpen(x, y, w, h, lid, '#b04a8a', '#ffa8d8'), oDot(x, y + h * 0.15, w * (mood === 'shout' ? 0.22 : 0.3), '#5a1a4a', lid));
    for (const [dx, dy, r] of [[0.35, -0.3, 0.2], [0.05, -0.55, 0.12], [0.45, -0.62, 0.08]]) out.push(oDot(x + w * dx, y + h * dy, w * r, '#ffffff', lid));
    out.push(...oLid(x, y, w, h, lid, 0.6));
  }
  if (mood !== 'dead') for (const [bx, by] of [[9.8, 15.8], [22, 15.6]]) for (const dx of [-0.9, 0, 0.9]) out.push(F(E(bx + dx, by + Math.abs(dx) * 0.25, 0.42, 0.42, '#8af0f0')), F(E(bx + dx, by + Math.abs(dx) * 0.25, 0.2, 0.2, '#ffffff')));
  const [mx, my] = [16, 16.8];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 1, 1.2, '#8a2a5a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.3, 1.4, 1.3, 0, 180, 8), '#8a2a5a')), F(E(mx, my + 0.5, 0.7, 0.3, '#ff9ac8')));
  else if (mood === 'angry') out.push(...oLn([[mx - 1, my + 0.4], [mx, my], [mx + 1, my + 0.4]], 0.45));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1.1, 0.4));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.45, 0.55, '#8a2a5a')));
  else out.push(...oLn(oArc(mx, my - 0.7, 1.1, 1, 25, 155, 6), 0.45), F(E(mx, my + 0.4, 0.4, 0.3, '#8a2a5a')));
  if (mood === 'hurt') out.push(...oDrop(22, 12.8, 0.7));
  return out;
};
const jbFace = (mood) => sm(`jb|face|${mood}`, 30, 22, () => jbOwnFace(mood));
// (Two frilly arms under the middle; three thin tentacles from the rim's back, trailing.)
const JB_RIBX = [-2, 3, -10, -6, 8];
const jbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[2, 3, 4, 0, 1].map((k) => ({
      name: `rib${k}${tag}`, parent: 'bell', s: JB_RIB[k][i], pivot: [5, 1], at: () => [JB_RIBX[k], k < 2 ? 0 : -2],
      rot: (S, a) => ((k < 2 ? S.lash : S.drag * 1.4) + Math.sin(a.t * 2.6 - k * 0.9) * (k < 2 ? 6 : 12)) * D2R,
    })),
    { name: `rim${tag}`, parent: 'bell', s: JB_RIM[i], pivot: [16, 1], at: () => [0, -1], rot: (S, a) => Math.sin(a.t * 3) * 3 * D2R },
    { name: `bellp${tag}`, parent: 'bell', s: JB_BELL[i], pivot: [15, 20] },
  ];
};
export const jellyRig = makeRig({
  w: 34, h: 44, soft: true, stride: 22, recover: 0.6,
  springs: { x: [200, 18], bob: [90, 9], tilt: [120, 10], lash: [200, 14], drag: [60, 6] },
  fast: ['x', 'lash', 'tilt'],
  kick: { tilt: -300, lash: 300, drag: 200 },
  turnKick: { drag: 240, tilt: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.21;
    const t = a.t + a.uidOff;
    const lu = t % 11;
    const blush = hold(lu, 2, 2.4, 3.6, 4) * (1 - a.walkW);
    a.jbBlush = blush;
    // (A pulse: a lift on each push of the bell, a sink between.)
    const pulse = Math.pow(Math.max(0, Math.sin(t * 2.4)), 2);
    const idle = { x: 0, bob: 13 + pulse * 4, tilt: Math.sin(t * 1.2) * 5, lash: 0, drag: 14 };
    const walk = { x: 0, bob: 13 + pulse * 5, tilt: 10, lash: 0, drag: 30 };
    const antic = { x: -2, bob: 14, tilt: -12, lash: 50, drag: 10 };
    const strike = { x: 5, bob: 14, tilt: 14, lash: -85, drag: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'bell', parent: null, at: (S) => [S.x, -14 - S.bob], rot: (S) => S.tilt * D2R },
    ...jbPass(false),
    ...jbPass(true),
    { name: 'face', parent: 'bell', s: (a) => jbFace(moodOf(a, a.jbBlush > 0.5 ? 'happy' : null)), pivot: [15, 20] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    if (a.ph.strike > 0.2) for (const k of [0, 1]) inPart(ctx, mat, `rib${k}`, () => sparkle(ctx, a, 0, 13, 3 + Math.sin(a.now * 30) * 1.4, a.ph.strike, '#fff6a8'));
    if (a.jbBlush > 0.4) for (let k = 0; k < 2; k++) {
      const u = fr(a.t * 0.8 + k / 2);
      ctx.globalAlpha = a.alpha * Math.sin(u * Math.PI) * a.jbBlush;
      ctx.fillStyle = '#ff7aa8';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('♥', 6 + k * 6, -34 - S.bob - u * 10);
    }
  },
});
export function jellyStill(pose, f, mood) {
  const fm = st(mood);
  const by = -21;
  return { w: 34, h: 46, res: 3, shapes: shift([...JB_RIBX.flatMap((x, k) => put(jbRibbon(k)(), [5, 1], x, by - 2, k < 2 ? 0 : 20)), ...put(jbRim(), [16, 1], 0, by - 1), ...put(jbBell(), [15, 20], 0, by), ...put(jbOwnFace(fm), [15, 20], 0, by)], 17, 45) };
}

// =====================================================================================
// Seahorse Squire
// =====================================================================================
const SEA = ramp('#ffb35a', { step: 9, turn: 8 });
const STEELS = ramp('#cfdcf2', { step: 8, turn: 8, lift: 4 });
const sh = pairOf('sh');
// The body and head in one: a round belly, a curved back with ridges, a snout out front. Box 30 x
// 30; the tail's root at (13, 29).
const shBody = () => [
  E(13, 20, 9, 9.6, SEA.base),
  E(15, 9, 7.6, 7, SEA.base),
  taper([[19, 9.6], [26, 10.6], [29, 10]], 4.6, 3.2, SEA.base), E(29, 10, 1.6, 2, SEA.sh),
  ...[0, 1, 2, 3, 4].map((k) => E(5.2 + k * 0.4, 9 + k * 4.4, 2, 1.6, SEA.sh)),
  F(E(15, 22, 5.6, 6.6, '#ffe2b8')), ...[0, 1, 2].map((k) => F(R(10.6, 18 + k * 3, 9, 0.8, '#ffd090'))),
  crescent(13, 20, 9, 9.6, SEA.sh, { k: 0.18, a0: 110, a1: 220 }),
  shine(15, 8, 7.6, 7, '#ffffff', 0, 0.6),
];
// The curled tail, its spiral standing on the floor. Box 18 x 16; rooted at (9, 1).
const shTail = () => [taper([[9, 1], [8, 6], [4, 10], [5, 14], [10, 14.6], [12, 11], [9, 9.6]], 6, 2.4, SEA.sh)];
// The helmet: a steel cap with a cheek guard and a red plume. Box 18 x 16; sits at (9, 14).
const shHelm = () => [
  T(arcP(9, 11, 7.6, 7.4, 180, 360, 10), STEELS.base), R(1.4, 10, 15.2, 3, STEELS.sh), F(R(4, 6, 2, 4, STEELS.lit ?? '#ffffff')),
  ...[0, 1, 2].map((k) => E(6 - k * 2.6, 3.4 - k * 0.6, 2.6, 2, k % 2 ? '#ff6a7a' : '#ff8a8a')),
];
const shFin = () => [T([[1, 6], [4, 0.6], [8, 2], [9, 7]], '#ffe08a'), F(taper([[3, 5], [5, 1.6]], 0.6, 0.3, '#ffc85a'))];
const shArm = () => [taper([[1, 2.4], [6, 2.4]], 3.4, 2.6, SEA.base), E(6.4, 2.4, 1.8, 1.8, SEA.base)];
// The lance: a little striped jousting lance. Box 6 x 30; gripped at (3, 22).
const shLance = () => [T([[3, 0.6], [5, 20], [1, 20]], '#e8eef8'), F(T([[3, 4], [4, 12], [3, 12]], '#ffffff')), R(0.4, 20, 5.2, 2, STEELS.sh), taper([[3, 22], [3, 29]], 1.6, 1.6, '#8a5a3a')];
const SH_BODY = sh('body', 30, 30, shBody, 2);
const SH_TAIL = sh('tail', 18, 16, shTail, 2);
const SH_HELM = sh('helm', 18, 16, shHelm, 2);
const SH_FIN = sh('fin', 10, 8, shFin, 2);
const SH_ARM = sh('arm', 9, 5, shArm, 2);
const SH_LANCE = sh('lance', 6, 30, shLance, 2);
// Its own face, a seahorse knight's (side on): a ringed eye (amber ring round a dark middle) under a bold
// crested brow, and its snout's little round mouth at the tip. Box 30 x 30.
const shOwnFace = (mood) => {
  const out = [];
  const [x, y, s, w, h] = [17.6, 9, 1, 2.3, 2.9];
  const lift = mood === 'angry' ? 1 : mood === 'shout' || mood === 'happy' ? -0.6 : mood === 'hurt' ? -0.4 : 0;
  if (mood !== 'dead') out.push(F(T([[x - w * 1, y - h * 0.95 + lift * 0.3], [x + w * 0.2, y - h * 1.45], [x + w * 1.2, y - h * 1.25 + lift], [x + w * 0.4, y - h * 1.08 + lift * 0.6]], '#3a2018')));
  const shut = oShut(mood, x, y, s, w, h, 0.65, '#c87a1a');
  if (shut) out.push(...shut);
  else {
    const lid = mood === 'angry' ? (px) => y - h * 0.3 + (px - x) * 0.55 : mood === 'shout' ? NOLID : () => y - h * 0.62;
    out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x + 0.2, y + h * 0.05, w * 0.8, h * 0.82), lid), '#e8a030')), F(T(oCut(oRing(x + 0.2, y + h * 0.05, w * 0.55, h * 0.56), lid), '#6a3a1a')), oDot(x + 0.2, y + h * 0.05, w * (mood === 'shout' ? 0.18 : 0.3), INK, lid));
    out.push(oDot(x + w * 0.42, y - h * 0.18, w * 0.18, '#ffffff', lid), ...oLid(x, y, w, h, lid, 0.65));
  }
  if (mood !== 'dead') out.push(F(E(14.8, 12.8, 1.5, 0.7, '#ffa088')));
  const [mx, my] = [24, 13];
  if (mood === 'shout') out.push(F(E(mx, my, 0.75, 0.9, '#7a2a1a')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx - 0.2, my, 0.7, 0.3));
  else if (mood === 'dead') out.push(...oLn([[mx - 0.5, my], [mx + 0.5, my]], 0.32));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.55, my + 0.2], [mx + 0.5, my - 0.1]], 0.36));
  else out.push(F(E(mx, my, 0.5, 0.5, '#7a2a1a')), F(E(mx - 0.12, my - 0.12, 0.15, 0.15, '#c86a5a')));
  if (mood === 'hurt') out.push(...oDrop(20.4, 12.6, 0.7));
  return out;
};
const shFace = (mood) => sm(`sh|face|${mood}`, 30, 30, () => shOwnFace(mood));
const shPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `tail${tag}`, parent: 'body', s: SH_TAIL[i], pivot: [9, 1], at: () => [-1, -2], rot: (S) => S.coil * D2R },
    { name: `fin${tag}`, parent: 'body', s: SH_FIN[i], pivot: [8, 7], at: () => [-8, -16], rot: (S, a) => (Math.sin(a.t * 22) * 14 - 10) * D2R },
    { name: `bodyp${tag}`, parent: 'body', s: SH_BODY[i], pivot: [13, 29] },
    { name: `helm${tag}`, parent: 'body', s: SH_HELM[i], pivot: [9, 14], at: () => [2, -20], rot: (S) => S.helm * D2R },
    { name: `lance${tag}`, parent: 'hand', s: SH_LANCE[i], pivot: [3, 22], rot: (S) => (S.lance - (S.arm + 60) - S.lean) * D2R },
    { name: `arm${tag}`, parent: 'body', s: SH_ARM[i], pivot: [1, 2.4], at: () => [4, -12], rot: (S) => (S.arm + 60) * D2R },
  ];
};
export const seahorseRig = makeRig({
  w: 40, h: 54, soft: true, stride: 20, recover: 0.6,
  springs: { x: [220, 18], lift: [200, 13], lean: [150, 12], coil: [160, 10], helm: [100, 7], arm: [180, 13], lance: [180, 13] },
  fast: ['x', 'arm', 'lance', 'lean'],
  kick: { lean: -260, helm: 400, coil: 200 },
  turnKick: { helm: 260, coil: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.31;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'sh', 20);
    const lu = t % 12;
    const salute = hold(lu, 1.4, 1.8, 3, 3.4) * (1 - a.walkW);
    const doze = hold(lu, 7, 7.6, 9.6, 10.2) * (1 - a.walkW);
    a.shDoze = doze;
    const hop = Math.abs(Math.sin(u * Math.PI));
    const idle = { x: 0, lift: 6 + Math.abs(Math.sin(t * 2.2)) * 2.4 * (1 - doze), lean: -doze * 8 + salute * -4, coil: 0, helm: doze * 14, arm: 30 - salute * 140 + doze * 10, lance: 42 - salute * 42 + doze * 30 };
    // Bouncing along on the spring of its tail.
    const walk = { x: 0, lift: 6 + hop * 8, lean: 8 - hop * 6, coil: -hop * 14, helm: -hop * 6, arm: 30, lance: 50 };
    const antic = { x: -2, lift: 6, lean: -12, coil: 10, helm: -6, arm: 60, lance: 60 };
    const strike = { x: 6, lift: 9, lean: 16, coil: -14, helm: 8, arm: -40, lance: 90 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'body', parent: null, at: (S) => [S.x, -14 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'hand', parent: 'arm', at: () => [6.4, 0] },
    ...shPass(false),
    ...shPass(true),
    { name: 'face', parent: 'body', s: (a) => shFace(moodOf(a, a.shDoze > 0.5 ? 'sleep' : null)), pivot: [13, 29] },
  ],
  fx(ctx, m, a, S) {
    if (a.shDoze > 0.6) dot(ctx, a, 12, -48 - S.lift - fr(a.t * 0.6) * 8, 1.4 + fr(a.t * 0.6) * 2, 0.6 * (1 - fr(a.t * 0.6)), '#e8fcff');
  },
});
export function seahorseStill(pose, f, mood) {
  const by = -20;
  return { w: 40, h: 54, res: 3, shapes: shift([...put(shTail(), [9, 1], -1, by - 2), ...put(shFin(), [8, 7], -8, by - 16, -10), ...put(shBody(), [13, 29], 0, by), ...put(shHelm(), [9, 14], 2, by - 20), ...put(shOwnFace(st(mood)), [13, 29], 0, by), ...put(shLance(), [3, 22], 9, by - 8, 30), ...put(shArm(), [1, 2.4], 4, by - 12, 70)], 20, 52) };
}

// =====================================================================================
// Pearl Otter
// =====================================================================================
const OTTER = ramp('#b07a52', { step: 9, turn: 8, lift: 10 });
const po = pairOf('po');
// The otter: a round body and head, cream belly and muzzle. Box 24 x 30; the hip at (12, 29).
const poBody = () => [
  E(12, 21, 9, 8.6, OTTER.base),
  E(12, 9, 8.6, 7.6, OTTER.base),
  E(4.4, 3.6, 2.2, 2, OTTER.base), E(19.6, 3.6, 2.2, 2, OTTER.base), F(E(4.4, 3.6, 1, 1, '#e8b890')), F(E(19.6, 3.6, 1, 1, '#e8b890')),
  F(E(12, 22, 6, 6.4, '#ffe8cc')), F(E(15, 11.4, 4.4, 3, '#ffe8cc')), F(E(17.6, 10.4, 1.4, 1, '#3a2a2a')),
  crescent(12, 21, 9, 8.6, OTTER.sh, { k: 0.18, a0: 100, a1: 220 }),
];
// The glass bubble round the head: a ring and glints (the head shows through). Box 26 x 24; at (13, 22).
const poHelm = () => [
  ...stroke(arcP(13, 11.4, 11.6, 10.8, 0, 360, 24), 1.2, '#bff0ff', false),
  F(taper([[5, 8], [7, 4], [11, 2.4]], 1.2, 0.6, '#ffffff')), F(E(19, 16, 1.2, 0.8, '#ffffff')),
  R(5, 20, 16, 3, '#ffd36b'), F(R(5, 20, 16, 1, '#fff0b0')),
];
const poPearl = () => [E(5, 5, 4.6, 4.6, '#fff6fa'), F(E(3.6, 3.4, 1.6, 1.2, '#ffffff')), crescent(5, 5, 4.6, 4.6, '#e0d0e8', { k: 0.25, a0: 30, a1: 140 })];
const poArm = (far) => () => [taper([[1, 2.4], [6.4, 2.4]], 3.4, 3, far ? OTTER.sh : OTTER.base), E(6.6, 2.4, 1.8, 1.7, far ? OTTER.sh : OTTER.base)];
const poFoot = (far) => () => [E(3, 1.6, 3, 1.6, far ? '#7a4a32' : '#8a5a3a')];
const poTail = () => [taper([[1, 2], [9, 3.4], [13, 3]], 4, 3.4, OTTER.sh)];
const PO_BODY = po('body', 24, 30, poBody, 2);
const PO_HELM = po('helm', 26, 24, poHelm, 2);
const PO_PEARL = po('pearl', 10, 10, poPearl, 2);
const PO_ARM = [false, true].map((f) => po(`arm${f ? 1 : 0}`, 9, 5, poArm(f), 2));
const PO_FOOT = [false, true].map((f) => po(`foot${f ? 1 : 0}`, 6, 3, poFoot(f), 2));
const PO_TAIL = po('tail', 14, 6, poTail, 2);
// Its own face, an otter's: big shiny black eyes with two glints, whisker dots on its muzzle and a
// cheeky little "w" with two buck teeth under its nose. Box 24 x 30.
const PO_EYES = [[10.8, 8, -1, 1.9, 2.4], [16, 7.8, 1, 1.6, 2.1]];
const poOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of PO_EYES) {
    if (mood === 'angry') out.push(...oLn([[x - s * w * 1, y - h * 0.85 + 0.6], [x + s * w * 0.9, y - h * 1.05]], 0.55, '#4a2a1a'));
    const shut = oShut(mood, x, y, s, w, h, 0.55, '#3a2a1a');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.55 : NOLID;
    const k = mood === 'shout' ? 0.8 : 1;
    out.push(F(T(oCut(oRing(x, y, w * 0.9 * k, h * 0.85 * k), lid), '#1a1010')), oDot(x + w * 0.28, y - h * 0.25, w * 0.26, '#ffffff', lid), oDot(x - w * 0.28, y + h * 0.3, w * 0.12, '#ffffff', lid));
  }
  // (Its nose is part of its head, at the tip of its muzzle.)
  if (mood !== 'dead') out.push(F(E(8.8, 11.4, 1.3, 0.6, '#ffa0a0')));
  if (mood !== 'dead') for (const [bx, by] of [[13.4, 11.6]]) for (const [dx, dy] of [[-0.4, 0], [0.35, -0.2], [0.2, 0.4]]) out.push(F(E(bx + dx, by + dy, 0.16, 0.16, '#4a2a1a')));
  const [mx, my] = [17.4, 12.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 0.9, 1.1, '#7a2a2a')), F(T([[mx - 0.5, my - 0.6], [mx + 0.5, my - 0.6], [mx + 0.45, my - 0.05], [mx - 0.45, my - 0.05]], '#ffffff')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.9, 0.32));
  else if (mood === 'dead') out.push(...oLn([[mx - 0.7, my], [mx + 0.7, my]], 0.32));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.8, my + 0.2], [mx, my - 0.1], [mx + 0.8, my + 0.2]], 0.34));
  else {
    const open = mood === 'happy';
    out.push(...oLn([[mx + 0.2, my - 1.3], [mx, my - 0.5]], 0.3), ...oLn([[mx - 1, my - 0.6], [mx - 0.5, my - 0.15], [mx, my - 0.5], [mx + 0.5, my - 0.15], [mx + 1, my - 0.6]], 0.34));
    out.push(F(T([[mx - 0.45, my - 0.32], [mx + 0.45, my - 0.32], [mx + 0.4, my + 0.35], [mx - 0.4, my + 0.35]], '#ffffff')), ...oLn([[mx, my - 0.32], [mx, my + 0.35]], 0.12, '#c8c0c0'));
    if (open) out.push(F(E(mx, my + 0.75, 0.6, 0.35, '#ff9a9a')));
  }
  if (mood === 'hurt') out.push(...oDrop(18.8, 8.4, 0.6));
  return out;
};
const poFace = (mood) => sm(`po|face|${mood}`, 24, 30, () => poOwnFace(mood));
const poPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (far) => ({ name: `foot${far ? 'F' : 'N'}${tag}`, parent: null, s: PO_FOOT[far ? 1 : 0][i], pivot: [3, 1.4], at: (S, a) => { const [dx, l] = pawStep(a.poU ?? 0, far ? 0.5 : 0, 8, 0.55, 1.6); return [S.x + (far ? -3 : 3) + dx * a.walkW, -1 - l * a.walkW]; } });
  return [
    foot(true),
    { name: `tail${tag}`, parent: 'hip', s: PO_TAIL[i], pivot: [1, 2], at: () => [-7, -3], rot: (S, a) => (150 + S.tail + Math.sin(a.t * 3) * 6) * D2R },
    { name: `armF${tag}`, parent: 'hip', s: PO_ARM[1][i], pivot: [1, 2.4], at: () => [-3, -17], rot: (S) => (40 + S.arms) * D2R },
    { name: `bodyp${tag}`, parent: 'hip', s: PO_BODY[i], pivot: [12, 29] },
    foot(false),
    { name: `pearl${tag}`, parent: 'hip', s: PO_PEARL[i], pivot: [5, 5], at: (S) => [3 + S.throwX, -9 - S.pearlY] },
    { name: `armN${tag}`, parent: 'hip', s: PO_ARM[0][i], pivot: [1, 2.4], at: () => [3, -16], rot: (S) => (50 + S.arms) * D2R },
    { name: `helm${tag}`, parent: 'hip', s: PO_HELM[i], pivot: [13, 22], at: () => [0, -14] },
  ];
};
export const otterRig = makeRig({
  w: 36, h: 44, soft: true, stride: 8, recover: 0.6,
  springs: { x: [220, 18], lift: [200, 15], lean: [150, 12], arms: [180, 13], pearlY: [160, 11], throwX: [260, 18], tail: [80, 7] },
  fast: ['x', 'arms', 'throwX', 'pearlY'],
  kick: { lean: -260, tail: 300, pearlY: 40 },
  turnKick: { tail: 240 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.97;
    const t = a.t + a.uidOff;
    a.poU = stepPhase(m, a, 'po', 8);
    const p = a.poU * TAU;
    const lu = t % 11;
    const polish = hold(lu, 1, 1.4, 3.4, 3.8) * (1 - a.walkW);
    const juggle = hold(lu, 6, 6.3, 8.6, 9) * (1 - a.walkW);
    a.poPolish = polish;
    const toss = Math.abs(Math.sin(t * 5)) * 12 * juggle;
    const idle = { x: 0, lift: (Math.sin(t * 2) + 1) * 0.7, lean: polish * 4 + Math.sin(t * 1.1) * 2.5, arms: polish * Math.sin(t * 12) * 12 - juggle * 30, pearlY: toss, throwX: 0, tail: Math.sin(t * 1.5) * 14 };
    const walk = { x: 0, lift: Math.abs(Math.sin(p)) * 1.2, lean: 6, arms: Math.sin(p) * 6, pearlY: 0, throwX: 0, tail: -10 };
    // The throw: pearl raised overhead, then flung.
    const antic = { x: -2, lift: 0, lean: -12, arms: -120, pearlY: 18, throwX: -4, tail: 10 };
    const strike = { x: 4, lift: 1, lean: 14, arms: -40, pearlY: 8, throwX: 26, tail: -12 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hip', parent: null, at: (S) => [S.x, -2 - S.lift], rot: (S) => S.lean * D2R },
    ...poPass(false),
    ...poPass(true),
    { name: 'face', parent: 'hip', s: (a) => poFace(moodOf(a, a.poPolish > 0.5 ? 'happy' : null)), pivot: [12, 29] },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.poPolish > 0.4) inPart(ctx, mat, 'pearl', () => sparkle(ctx, a, 2, -3, 2.4 + Math.sin(a.now * 9), a.poPolish));
  },
});
export function otterStill(pose, f, mood) {
  return { w: 36, h: 46, res: 3, shapes: shift([...put(poFoot(true)(), [3, 1.4], -3, -1), ...put(poTail(), [1, 2], -7, -5, 150), ...put(poArm(true)(), [1, 2.4], -3, -19, 40), ...put(poBody(), [12, 29], 0, -2), ...put(poOwnFace(st(mood)), [12, 29], 0, -2), ...put(poFoot(false)(), [3, 1.4], 3, -1), ...put(poPearl(), [5, 5], 3, -11), ...put(poArm(false)(), [1, 2.4], 3, -18, 50), ...put(poHelm(), [13, 22], 0, -16)], 18, 45) };
}

// =====================================================================================
// Star Twirler
// =====================================================================================
const STAR = ramp('#ffb07a', { step: 9, turn: 8 });
const sd = pairOf('sd');
// The star: five round-tipped points, standing on the two lower ones. Box 34 x 34; its middle at (17, 18).
const sdStar = () => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * D2R;
    const r = i % 2 ? 7.6 : 16;
    pts.push([17 + Math.cos(a) * r, 18 + Math.sin(a) * r]);
  }
  const out = [T(pts, STAR.base)];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * D2R;
    out.push(E(17 + Math.cos(a) * 14.6, 18 + Math.sin(a) * 14.6, 2.6, 2.6, STAR.base));
    for (let k = 1; k < 4; k++) out.push(F(E(17 + Math.cos(a) * (4 + k * 3), 18 + Math.sin(a) * (4 + k * 3), 0.8, 0.8, '#ffe0c0')));
  }
  out.push(crescent(17, 18, 9, 9, STAR.sh, { k: 0.2, a0: 100, a1: 220 }));
  // A frilly pink tutu round its middle.
  for (let i = 0; i <= 8; i++) out.push(E(8.4 + i * 2.15, 24.6 + (i % 2) * 0.8, 2, 1.6, i % 2 ? '#ffd0e2' : '#ffb3cf'));
  return out;
};
const sdBow = () => [T([[6, 4], [0.6, 0.6], [0.6, 7.4]], '#ff7aa8'), T([[6, 4], [11.4, 0.6], [11.4, 7.4]], '#ff7aa8'), E(6, 4, 1.8, 1.8, '#ff5a8a')];
const SD_STAR = sd('star', 34, 34, sdStar, 2);
const SD_BOW = sd('bow', 12, 8, sdBow, 2);
// Her own face, a starfish idol's: big amber eyes with a pink heart of light in each, long lashes, a wink
// when she's pleased and a bright idol smile. Box 34 x 34.
const SD_EYES = [[14.4, 16.4, -1, 1.9, 2.5], [20.6, 16.2, 1, 1.7, 2.3]];
const sdHeart = (x, y, r, c, lid) => [oDot(x - r * 0.5, y - r * 0.15, r * 0.58, c, lid), oDot(x + r * 0.5, y - r * 0.15, r * 0.58, c, lid), F(T(oCut([[x - r * 1.05, y], [x + r * 1.05, y], [x, y + r * 1.05]], lid), c))];
const sdOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of SD_EYES) {
    const lashes = (yy) => [...oLn([[x + s * w * 0.85, yy - h * 0.45], [x + s * w * 1.45, yy - h * 0.85]], 0.5), ...oLn([[x + s * w * 0.45, yy - h * 0.8], [x + s * w * 0.7, yy - h * 1.3]], 0.45)];
    const wink = mood === 'happy' && s > 0;
    const shut = wink ? oLn([[x - w, y + 0.1], [x + w * 0.2, y - h * 0.35], [x + w, y + 0.1]], 0.55) : oShut(mood, x, y, s, w, h, 0.55, '#e0703a');
    if (shut) { out.push(...shut); if (mood === 'happy' || mood === 'blink') out.push(...lashes(y + h * 0.4)); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.25 + (px - x) * -s * 0.55 : NOLID;
    out.push(...oOpen(x, y, w, h, lid, '#b04a2a', '#ffb070'), oDot(x, y + h * 0.15, w * (mood === 'shout' ? 0.2 : 0.32), '#4a1a0a', lid), ...sdHeart(x + w * 0.3, y - h * 0.3, w * 0.24, '#ffe0ec', lid), ...oLid(x, y, w, h, lid, 0.55), ...lashes(y));
  }
  if (mood !== 'dead') out.push(F(E(11.8, 19.8, 1.4, 0.7, '#ff8aa8')), F(E(23.2, 19.6, 1.2, 0.6, '#ff8aa8')));
  const [mx, my] = [17.6, 21];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 1, 1.2, '#8a2a3a')), F(E(mx, my + 0.9, 0.6, 0.3, '#ff9ab0')));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.9, my + 0.4], [mx, my], [mx + 0.9, my + 0.4]], 0.45));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1, 0.38));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.45, 0.5, '#8a2a3a')));
  else out.push(F(T(oArc(mx, my - 0.5, 1.5, 1.4, 0, 180, 8), '#8a2a3a')), F(T(oArc(mx, my - 0.5, 1.5, 1.4, 0, 180, 8).map(([px, py]) => [px, Math.min(py, my - 0.05)]), '#ffffff')), F(E(mx, my + 0.4, 0.75, 0.32, '#ff9ab0')));
  if (mood === 'hurt') out.push(...oDrop(23, 16.6, 0.65));
  return out;
};
const sdFace = (mood) => sm(`sd|face|${mood}`, 34, 34, () => sdOwnFace(mood));
export const starRig = makeRig({
  w: 40, h: 44, soft: true, stride: 24, recover: 0.5,
  springs: { x: [220, 18], lift: [200, 15], rock: [160, 12], bow: [90, 7] },
  fast: ['x', 'rock'],
  kick: { rock: -300, bow: 400 },
  turnKick: { bow: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.11;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'sd', 24);
    const lu = t % 10;
    const pir = hold(lu, 2, 2.2, 3, 3.2) * (1 - a.walkW);
    const wave = hold(lu, 6, 6.3, 7.4, 7.8) * (1 - a.walkW);
    a.sdWave = wave;
    // (Whole turns, eased, straight from the clock: a pirouette now and then, and the cartwheel of
    // its slap; a full turn ends where it began, so nothing jumps.)
    const pu = lu > 2.2 && lu < 3 ? (lu - 2.2) / 0.8 : 0;
    const su = a.ph.since >= 0 ? Math.min(1, a.ph.since / 0.3) : 0;
    const ease = (q) => q * q * (3 - 2 * q);
    a.sdSpin = (ease(pu) + ease(su)) * 360 * (1 - a.walkW);
    const skip = Math.abs(Math.sin(u * TAU));
    const idle = { x: 0, lift: Math.abs(Math.sin(t * 2)) * 1.4 + pir * 4, rock: Math.sin(t * 1.6) * 5 + wave * Math.sin(t * 9) * 10, bow: Math.sin(t * 2) * 6 };
    const walk = { x: 0, lift: skip * 6, rock: Math.sin(u * TAU) * 12, bow: -skip * 14 };
    // The cartwheel slap: a lean back, then a whole turn forward.
    const antic = { x: -2, lift: 1, rock: -24, bow: 10 };
    const strike = { x: 8, lift: 6, rock: 0, bow: -20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'hub', parent: null, at: (S) => [S.x, -15 - S.lift], rot: (S, a) => (S.rock + (a.sdSpin ?? 0)) * D2R },
    { name: 'star', parent: 'hub', s: SD_STAR[0], pivot: [17, 18] },
    { name: 'bow', parent: 'hub', s: SD_BOW[0], pivot: [6, 6], at: () => [1, -14], rot: (S) => S.bow * D2R },
    { name: 'starb', parent: 'hub', s: SD_STAR[1], pivot: [17, 18] },
    { name: 'bowb', parent: 'hub', s: SD_BOW[1], pivot: [6, 6], at: () => [1, -14], rot: (S) => S.bow * D2R },
    { name: 'face', parent: 'hub', s: (a) => sdFace(moodOf(a, a.sdWave > 0.5 ? 'happy' : null)), pivot: [17, 18] },
  ],
  fx(ctx, m, a) {
    if (a.ph.strike > 0.2) for (let k = 0; k < 5; k++) sparkle(ctx, a, Math.cos(k * 1.26 + a.now * 8) * 18, -15 + Math.sin(k * 1.26 + a.now * 8) * 18, 2.4, a.ph.strike * 0.9, k % 2 ? '#fff6a8' : '#ffffff');
  },
});
export function starStill(pose, f, mood) {
  return { w: 40, h: 46, res: 3, shapes: shift([...put(sdStar(), [17, 18], 0, -15), ...put(sdBow(), [6, 6], 1, -29), ...put(sdOwnFace(st(mood)), [17, 18], 0, -15)], 20, 44) };
}

// =====================================================================================
// Octo Scholar
// =====================================================================================
const OCTO = ramp('#ff8fb0', { step: 9, turn: 8 });
const os = pairOf('os');
// The head: a round mantle. Box 30 x 26; its bottom middle at (15, 25).
const osHead = () => [E(15, 13, 13.6, 12, OCTO.base), R(3, 16, 24, 9, OCTO.base), ...[0, 1, 2, 3].map((k) => F(E(7 + k * 5.4, 6 + (k % 2) * 3, 1.4, 1.2, '#ffc0d4'))), crescent(15, 13, 13.6, 12, OCTO.sh, { k: 0.18, a0: 100, a1: 220 }), shine(15, 11, 13.6, 12, '#ffffff', 0, 0.6)];
// An arm, curling at the tip. Box 10 x 18; rooted at (5, 1).
const osArm = (k) => () => [taper([[5, 1], [5.6, 8], [4, 13], [6, 16], [8.4, 15]], 4.6, 1.6, k % 2 ? OCTO.sh : OCTO.base), ...[0, 1, 2].map((j) => F(E(3.4, 5 + j * 4, 0.8, 0.8, '#ffe0ea')))];
const osCap = () => [T([[0.6, 4], [10, 0.6], [19.4, 4], [10, 7.4]], '#3a3058'), R(5, 5, 10, 4, '#3a3058'), F(E(10, 4, 1.2, 1, '#ffd36b'))];
const osTassel = () => [taper([[1, 1], [1, 7]], 0.8, 0.8, '#ffd36b'), E(1, 8, 1.4, 1.8, '#ffd36b')];
const osBook = () => [R(0.6, 0.6, 12, 9, '#4a7ad8'), F(R(1.6, 1.4, 10, 1.6, '#ffffff')), F(R(0.6, 0.6, 1.6, 9, '#2a4a9a')), F(E(7, 5.6, 1.8, 1.8, '#ffd36b'))];
const OS_HEAD = os('head', 30, 26, osHead, 2);
const OS_ARM = [0, 1, 2, 3, 4, 5].map((k) => os(`arm${k}`, 10, 18, osArm(k), 2));
const OS_CAP = os('cap', 20, 9, osCap, 2);
const OS_TASSEL = os('tassel', 3, 10, osTassel, 1);
const OS_BOOK = os('book', 13, 10, osBook, 2);
// (Glasses are part of the face, over the eyes.)
// Its own face, a scholar octopus's (behind its round glasses): studious eyes under lowered lids with the
// pupils down at its book, a thoughtful little pursed mouth and a smudge of blue ink on its cheek.
// Box 30 x 26.
const OS_EYES = [[14.6, 14.6, -1, 1.9, 2.4], [21.4, 14.4, 1, 1.7, 2.2]];
const osOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of OS_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.55, '#4a3a8a');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.55 : mood === 'shout' ? NOLID : () => y - h * 0.35;
    const py = mood === 'shout' ? y : y + h * 0.3;
    out.push(...oOpen(x, y, w, h, lid, '#4a3a8a', '#9a8ad8'), oDot(x, py, w * (mood === 'shout' ? 0.2 : 0.32), '#1e1840', lid), oDot(x + w * 0.3, py - h * 0.25, w * 0.16, '#ffffff', lid), ...oLid(x, y, w, h, lid, 0.55));
  }
  if (mood !== 'dead') out.push(F(E(11.4, 18.2, 1.3, 0.6, '#ff9ac0')), F(E(24.6, 17.8, 1.1, 0.5, '#ff9ac0')));
  out.push(F(E(9.6, 19.6, 0.7, 0.45, '#3a5ab8')), F(E(8.8, 20.1, 0.3, 0.25, '#3a5ab8')));
  const [mx, my] = [18, 19.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 0.9, 1.1, '#6a2a4a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.3, 1.2, 1.1, 0, 180, 8), '#6a2a4a')));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.8, my + 0.3], [mx + 0.8, my + 0.3]], 0.42));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.9, 0.36));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.4, 0.45, '#6a2a4a')));
  else out.push(...oLn([[mx - 0.55, my + 0.1], [mx - 0.15, my - 0.15], [mx + 0.15, my + 0.15], [mx + 0.55, my - 0.1]], 0.4));
  if (mood === 'hurt') out.push(...oDrop(24.4, 15.8, 0.6));
  return out;
};
const osFace = (mood) => sm(`os|face|${mood}`, 30, 26, () => [...osOwnFace(mood), ...stroke(arcP(15, 15, 3.2, 3, 0, 360, 14), 0.7, '#3a3058', false), ...stroke(arcP(21, 14.8, 2.8, 2.7, 0, 360, 14), 0.7, '#3a3058', false), ...stroke([[18.2, 14.8], [18.2, 14.6]], 0.6, '#3a3058')]);
const OS_ARMX = [-10, -6, -2, 2, 6, 10];
export const octoRig = makeRig({
  w: 40, h: 44, soft: true, stride: 18, recover: 0.6,
  springs: { x: [200, 18], lift: [180, 13], lean: [140, 11], head: [120, 10], book: [180, 13], bookX: [220, 16], cap: [90, 7] },
  fast: ['x', 'book', 'bookX', 'lean'],
  kick: { lean: -200, cap: 300, head: -200 },
  turnKick: { cap: 240 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 1.07;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'os', 18);
    a.osU = u;
    const lu = t % 12;
    const read = hold(lu, 1, 1.5, 5, 5.5) * (1 - a.walkW);
    const push = hold(lu, 7, 7.3, 7.8, 8.1) * (1 - a.walkW);
    a.osRead = read;
    const idle = { x: 0, lift: Math.sin(t * 2) * 0.6, lean: read * 6, head: read * 8 - push * 6, book: read * -40, bookX: read * 2, cap: Math.sin(t * 1.4) * 4 };
    const walk = { x: 0, lift: Math.abs(Math.sin(u * TAU)) * 1.4, lean: 6, head: 0, book: 10, bookX: 0, cap: -8 };
    const antic = { x: -2, lift: 1, lean: -12, head: -8, book: -120, bookX: -4, cap: 10 };
    const strike = { x: 5, lift: 1, lean: 14, head: 6, book: 40, bookX: 18, cap: -12 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'base', parent: null, at: (S) => [S.x, -14 - S.lift], rot: (S) => S.lean * D2R },
    { name: 'neck', parent: 'base', rot: (S) => S.head * D2R },
    ...OS_ARMX.map((x, k) => ({ name: `arm${k}`, parent: 'base', s: OS_ARM[k][0], pivot: [5, 1], at: () => [x, -2], rot: (S, a) => (x * 1.6 + Math.sin(((a.osU ?? 0) + k / 6) * TAU) * (6 + a.walkW * 16)) * D2R })),
    { name: 'headp', parent: 'neck', s: OS_HEAD[0], pivot: [15, 25] },
    ...OS_ARMX.map((x, k) => ({ name: `arm${k}b`, parent: 'base', s: OS_ARM[k][1], pivot: [5, 1], at: () => [x, -2], rot: (S, a) => (x * 1.6 + Math.sin(((a.osU ?? 0) + k / 6) * TAU) * (6 + a.walkW * 16)) * D2R })),
    { name: 'headb', parent: 'neck', s: OS_HEAD[1], pivot: [15, 25] },
    { name: 'tassel', parent: 'neck', s: OS_TASSEL[0], pivot: [1, 1], at: () => [8, -27], rot: (S, a) => (Math.sin(a.t * 3) * 14 + S.cap * 2) * D2R },
    { name: 'cap', parent: 'neck', s: OS_CAP[0], pivot: [10, 7], at: () => [0, -22], rot: (S) => S.cap * D2R },
    { name: 'capb', parent: 'neck', s: OS_CAP[1], pivot: [10, 7], at: () => [0, -22], rot: (S) => S.cap * D2R },
    { name: 'face', parent: 'neck', s: (a) => osFace(moodOf(a, a.osRead > 0.5 ? 'happy' : null)), pivot: [15, 25] },
    { name: 'book', parent: 'base', s: OS_BOOK[0], pivot: [6, 5], at: (S) => [9 + S.bookX, -4], rot: (S) => S.book * D2R },
    { name: 'bookb', parent: 'base', s: OS_BOOK[1], pivot: [6, 5], at: (S) => [9 + S.bookX, -4], rot: (S) => S.book * D2R },
  ],
  fx(ctx, m, a, S, mat) {
    if (a.ph.strike > 0.2) for (let k = 0; k < 4; k++) puff(ctx, a, 14 + k * 4, -16 + Math.sin(k * 2) * 4, 3 + k, a.ph.strike * 0.5, '74,58,138');
    if (a.osRead > 0.6 && fr(a.t * 0.5) < 0.12) inPart(ctx, mat, 'book', () => sparkle(ctx, a, 6, -2, 2, 0.8));
  },
});
export function octoStill(pose, f, mood) {
  return { w: 40, h: 46, res: 3, shapes: shift([...OS_ARMX.flatMap((x, k) => put(osArm(k)(), [5, 1], x, -16, x * 1.6)), ...put(osHead(), [15, 25], 0, -14), ...put(osCap(), [10, 7], 0, -36), ...put(osOwnFace(st(mood)), [15, 25], 0, -14), ...put(osBook(), [6, 5], 9, -18)], 20, 45) };
}

// =====================================================================================
// Lantern Angler
// =====================================================================================
const ANG = ramp('#6a7ad8', { step: 9, turn: 8, lift: 10 });
const la = pairOf('la');
// The fish: round, a cheeky grin with little teeth, fins. Box 34 x 26; its belly's middle at (16, 25).
const laBody = () => [
  E(16, 13, 13, 11.4, ANG.base),
  T([[3.6, 12], [-0.2 + 1, 5], [1, 20]], ANG.sh),
  F(E(17, 18, 9, 5, '#a8b8f0')),
  F(T([...arcP(22, 15, 7, 4.4, 10, 170, 10), [16, 16.4], [28.6, 15]], '#3a2050')), ...[0, 1, 2].map((k) => F(T([[18.4 + k * 3, 16.2], [19.6 + k * 3, 18.2], [20.8 + k * 3, 16.1]], '#ffffff'))),
  crescent(16, 13, 13, 11.4, ANG.sh, { k: 0.18, a0: 110, a1: 220 }),
  shine(16, 11, 13, 11.4, '#ffffff', 0, 0.6),
];
const laFin = () => [T([[1, 1], [8, 3], [6, 8], [1, 6]], '#ffb3c8'), F(taper([[2, 3], [6, 5]], 0.6, 0.3, '#ff8ab0'))];
// The lure: a curving stalk with a glowing bulb. Box 16 x 16; rooted at (2, 15).
const laLure = () => [taper([[2, 15], [3, 8], [8, 3], [12, 3.4]], 1.6, 1, ANG.sh), E(13, 4, 2.6, 2.6, '#fff6a8'), F(E(12.4, 3.4, 1, 1, '#ffffff'))];
const LA_BODY = la('body', 34, 26, laBody, 2);
const LA_FIN = la('fin', 9, 9, laFin, 2);
const LA_LURE = la('lure', 16, 16, laLure, 2);
// Its own face, an anglerfish's (side on): one wide round deep-sea eye (white, a small pupil) with its
// lure's yellow light caught in it, under a heavy grumpy brow; its toothy mouth is part of its body.
// Box 34 x 26.
const laOwnFace = (mood) => {
  const out = [];
  const [x, y, s, w, h] = [18.6, 9, 1, 2.4, 3];
  const drop = mood === 'angry' ? 1 : mood === 'shout' ? -0.8 : mood === 'happy' ? -0.4 : mood === 'hurt' ? -0.5 : 0.3;
  if (mood !== 'dead') out.push(...oLn([[x - w * 1.05, y - h * 1 - drop * 0.2], [x + w * 0.2, y - h * 1.2 + drop * 0.4], [x + w * 1.1, y - h * 0.95 + drop]], 0.9, '#22285a'));
  const shut = oShut(mood, x, y, s, w, h, 0.65, '#ffd84a');
  if (shut) out.push(...shut);
  else {
    const lid = mood === 'angry' ? (px) => y - h * 0.3 + (px - x) * 0.5 : NOLID;
    const pr = w * (mood === 'shout' ? 0.16 : 0.26);
    out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y, w * 0.86, h * 0.88), lid), '#f4f2ff')), oDot(x + w * 0.15, y + h * 0.05, pr, '#1a1a3a', lid), oDot(x - w * 0.35, y - h * 0.35, w * 0.2, '#ffe060', lid), oDot(x - w * 0.15, y - h * 0.5, w * 0.09, '#ffe060', lid), ...oLid(x, y, w, h, lid, 0.65));
  }
  if (mood !== 'dead') out.push(F(E(15, 13, 1.5, 0.7, '#ff9ab8')));
  if (mood === 'hurt') out.push(...oDrop(21.6, 12.6, 0.75));
  return out;
};
const laFace = (mood) => sm(`la|face|${mood}`, 34, 26, () => laOwnFace(mood));
export const anglerRig = makeRig({
  w: 44, h: 44, soft: true, stride: 24, recover: 0.6,
  springs: { x: [200, 18], bob: [90, 8], tilt: [140, 11], lure: [60, 5], fin: [140, 9] },
  fast: ['x', 'tilt'],
  kick: { tilt: -260, lure: 400 },
  turnKick: { lure: 300, tilt: 100 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 1.17;
    const t = a.t + a.uidOff;
    const idle = { x: 0, bob: 10 + Math.sin(t * 1.8) * 2.4, tilt: Math.sin(t * 1.1) * 5, lure: Math.sin(t * 1.4) * 10, fin: Math.sin(t * 6) * 14 };
    const walk = { x: 0, bob: 10 + Math.sin(t * 2.6) * 2, tilt: 8, lure: -16, fin: Math.sin(t * 10) * 20 };
    // (The whole fish in it, 2026-11-19: only the lure's glow changed. Drawing back and up, the lure
    // swung back over its head; then a dart forward and down, the lure flung out ahead, fin
    // kicking.)
    const antic = { x: -6, bob: 15, tilt: -24, lure: 42, fin: -10 };
    const strike = { x: 14, bob: 7, tilt: 26, lure: -52, fin: 44 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'fish', parent: null, at: (S) => [S.x, -4 - S.bob], rot: (S) => S.tilt * D2R },
    { name: 'lure', parent: 'fish', s: LA_LURE[0], pivot: [2, 15], at: () => [4, -20], rot: (S) => S.lure * D2R },
    { name: 'lureb', parent: 'fish', s: LA_LURE[1], pivot: [2, 15], at: () => [4, -20], rot: (S) => S.lure * D2R },
    { name: 'body', parent: 'fish', s: LA_BODY[0], pivot: [16, 25] },
    { name: 'bodyb', parent: 'fish', s: LA_BODY[1], pivot: [16, 25] },
    { name: 'fin', parent: 'fish', s: LA_FIN[0], pivot: [1, 3], at: () => [-13, -6], rot: (S) => (S.fin + 150) * D2R },
    { name: 'finb', parent: 'fish', s: LA_FIN[1], pivot: [1, 3], at: () => [-13, -6], rot: (S) => (S.fin + 150) * D2R },
    { name: 'face', parent: 'fish', s: (a) => laFace(moodOf(a)), pivot: [16, 25] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const flash = a.ph.antic;
    inPart(ctx, mat, 'lure', () => {
      const g = ctx.createRadialGradient(11, -11, 0, 11, -11, 12 + flash * 6);
      g.addColorStop(0, `rgba(255,246,168,${(0.5 + 0.2 * Math.sin(a.now * 3) + flash * 0.4) * a.alpha})`);
      g.addColorStop(1, 'rgba(255,246,168,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-15, -37, 52, 52);
    });
  },
});
export function anglerStill(pose, f, mood) {
  return { w: 44, h: 46, res: 3, shapes: shift([...put(laLure(), [2, 15], 4, -34), ...put(laBody(), [16, 25], 0, -14), ...put(laFin(), [1, 3], -13, -20, 150), ...put(laOwnFace(st(mood)), [16, 25], 0, -14)], 22, 44) };
}
