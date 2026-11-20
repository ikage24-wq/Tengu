// The Candy Volcano's sweets-folk, remade from scratch for Chapter 8 (2026-11-19): Queen Bonbon's
// bakery household, guarding the way up to her crater. Live puppets on the rig (rig.js): every part
// drawn once and placed each frame, outer outline only, faces bare; upright and chibi.
//
//   gummybear     Gummy Bear Brawler: a see-through red gummy cub in mint boxing gloves; bounces on
//                 its toes and shadow-boxes. A one-two: a jab, then a hook with the other glove.
//   cottoncandy   Cotton Candy Sheep: a lamb standing up inside a cloud of pink and blue floss;
//                 nibbles its own fleece. Rears back and puffs floss at you.
//   lollipopwitch Lollipop Witch: a lemon-drop witch in a starry robe and pointed hat, a big swirl
//                 lollipop for a staff; sneaks a lick of it. Points it and casts a sugar swirl.
//   peppermint    Peppermint Spinner: a round mint in its wrapper, the twists for arms, its red
//                 stripes always turning, faster as it runs. Spins up and dashes into you.
//   chocoknight   Chocolate Knight: a chocolate-bar knight in a bonbon helm with a gold foil plume
//                 and cape, a wafer sword and a cookie shield; stomps, salutes. Raises it and chops.
//   jellyninja    Jelly Bean Ninja: a glossy jelly bean (four flavours) in a red headband whose
//                 tails stream behind; sneaks low and quick. Throws a sprinkle star.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent, shine } from './meadow.js';
import { makeRig, stateBlend, TAU } from './rig.js';
import { D2R, INK, ov, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, sparkle, puff, dot } from './rigkit.js';

const sm = (key, w, h, shapes) => faceSprite(key, w, h, shapes);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
const star5 = (x, y, r, c, deg = -90) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (deg + i * 36) * D2R;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
};
// A star drawn live (a thrown sprinkle star, a sparkle of sugar).
function liveStar(ctx, x, y, r, rot, c, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

// =====================================================================================
// Gummy Bear Brawler
// =====================================================================================
const GUM = ramp('#ff5a72', { step: 10, turn: 10 });
const GUMIN = '#ff9aaa';
const GLOVE = ramp('#7fe0b8', { step: 10, turn: 10 });
const gb = pairOf('gb');
// Body: a round see-through gummy, its tummy glowing lighter. Box 22 x 20; standing at (11, 19.6).
const gbBody = () => [E(11, 11, 10, 8.8, GUM.base), F(E(11.6, 12.6, 6, 5.4, GUMIN)), crescent(11, 11, 10, 8.8, GUM.sh, { k: 0.22, a0: 100, a1: 230 }), shine(11, 11, 10, 8.8, '#ffffff', 0, 0.9), F(E(6.4, 7, 1.6, 1, '#ffffff'))];
// Head: round, round ears, a lighter muzzle, a shiny nose. Box 22 x 19; the neck at (11, 18).
const gbHead = () => [
  E(4.2, 4.6, 3.4, 3.4, GUM.base), E(17.8, 4.6, 3.4, 3.4, GUM.base), F(E(4.2, 4.8, 1.8, 1.8, GUMIN)), F(E(17.8, 4.8, 1.8, 1.8, GUMIN)),
  E(11, 10.6, 9.2, 8, GUM.base), crescent(11, 10.6, 9.2, 8, GUM.sh, { k: 0.2, a0: 110, a1: 220 }), shine(11, 10.6, 9.2, 8, '#ffffff', 0, 0.9),
  F(E(14.6, 13.4, 3.8, 2.6, GUMIN)), F(E(15, 12.2, 1.3, 1, '#c8304a')), F(E(14.6, 11.9, 0.5, 0.35, '#ffffff')),
];
// A boxing glove: mint, a thumb, a white cuff. Box 10 x 9; held at (5, 4.5).
const gbGlove = (far) => () => {
  const g = far ? GLOVE.sh : GLOVE.base;
  return [R(0.8, 2.8, 2.4, 3.4, far ? '#cfe8de' : '#fff6f6'), E(5.8, 4.5, 4.2, 3.9, g), E(8.2, 2.4, 1.6, 1.6, g), F(E(5, 3, 1.8, 1, '#ffffff'))];
};
const gbFoot = (far) => () => [E(4, 2.6, 3.8, 2.4, far ? GUM.sh : GUM.base), F(E(3, 1.8, 1.2, 0.6, '#ffffff'))];
const GB_BODY = gb('body', 22, 20, gbBody, 2);
const GB_HEAD = gb('head', 22, 19, gbHead, 2);
const GB_GLOVE = [false, true].map((f) => gb(`glove${f ? 1 : 0}`, 10, 9, gbGlove(f), 2));
const GB_FOOT = [false, true].map((f) => gb(`foot${f ? 1 : 0}`, 8, 5, gbFoot(f), 2));
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
// Its own face, a gummy bear's: glossy jelly eyes (deep red, no pupil) with a big slanted shine and a
// pink glow along the bottom where the light comes through, sugar crystals on its cheeks for a blush,
// a little bear mouth. Box 22 x 19.
const GB_EYES = [[10, 9.6, -1, 1.5, 2], [16, 9.4, 1, 1.6, 2.1]];
const GB_MOUTH = '#6a0a1e';
const gbOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of GB_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.55);
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.25 + (px - x) * -s * 0.6 : NOLID;
    const k = mood === 'shout' ? 0.6 : 1;
    out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.05, w * 0.84 * k, h * 0.86 * k), lid), '#5a0a1e')));
    out.push(...oLn(oCut(oArc(x, y + h * 0.05, w * 0.7 * k, h * 0.72 * k, 30, 150, 6), lid), 0.35, '#ff7a96'));
    out.push(F(T(oCut(oRing(x + w * 0.22, y - h * 0.25, w * 0.34 * k, h * 0.22 * k, -0.6, 8), lid), '#ffffff')), oDot(x - w * 0.3, y + h * 0.35, w * 0.1, '#ffffff', lid));
    out.push(...oLid(x, y, w, h, lid, 0.55));
  }
  if (mood !== 'dead') for (const [bx, by] of [[8, 12.8], [18.4, 12.6]]) for (const [dx, dy, r] of [[-0.6, 0, 0.32], [0.5, -0.3, 0.26], [0.2, 0.5, 0.22]]) out.push(F(T([[bx + dx, by + dy - r], [bx + dx + r, by + dy], [bx + dx, by + dy + r], [bx + dx - r, by + dy]], '#ffffff')));
  const [mx, my] = [14.8, 14.8];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 1, 1.2, GB_MOUTH)), F(E(mx, my + 0.9, 0.6, 0.3, '#ff9ab0')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.3, 1.3, 1.2, 0, 180, 8), GB_MOUTH)), F(E(mx, my + 0.5, 0.6, 0.28, '#ff9ab0')));
  else if (mood === 'angry') out.push(...oLn([[mx - 1.1, my + 0.3], [mx, my - 0.1], [mx + 1.1, my + 0.3]], 0.4), F(T([[mx - 0.6, my + 0.05], [mx - 0.2, my + 0.05], [mx - 0.4, my + 0.6]], '#ffffff')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 1, 0.35));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.45, 0.5, GB_MOUTH)));
  else out.push(...oLn([[mx - 1.1, my - 0.2], [mx - 0.55, my + 0.3], [mx, my - 0.05], [mx + 0.55, my + 0.3], [mx + 1.1, my - 0.2]], 0.38));
  if (mood === 'hurt') out.push(...oDrop(18, 11.4, 0.6));
  return out;
};
const gbFace = (mood) => sm(`gb|face|${mood}`, 22, 19, () => gbOwnFace(mood));
const gbPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: GB_FOOT[far ? 1 : 0][i], pivot: [4, 4.6], at: (S, a) => { const [dx, l] = pawStep(a.gbU ?? 0, far ? 0.5 : 0, 7, 0.55, 2.4); return [S.x + (far ? -3.6 : 3.6) + dx * a.walkW, -l * a.walkW - S.toes]; } });
  return [
    { name: `gloveF${tag}`, parent: 'trunk', s: GB_GLOVE[1][i], pivot: [5, 4.5], at: (S) => [-7 + S.gFx, -12 - S.gFy], rot: (S) => S.gFr * D2R },
    foot(1, true),
    foot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: GB_BODY[i], pivot: [11, 19.6] },
    { name: `head${tag}`, parent: 'nk', s: GB_HEAD[i], pivot: [11, 18] },
    { name: `gloveN${tag}`, parent: 'trunk', s: GB_GLOVE[0][i], pivot: [5, 4.5], at: (S) => [8 + S.gNx, -11 - S.gNy], rot: (S) => S.gNr * D2R },
  ];
};
// (Each attack is a jab or a hook in turn, by which blow it is.)
const hookOf = (m) => Math.floor((m.attackAt ?? 0) * 7) % 2 === 1;
export const gummyRig = makeRig({
  w: 40, h: 44, soft: true, stride: 7, recover: 0.5,
  springs: { x: [300, 20], lift: [280, 16], toes: [280, 16], tilt: [220, 14], head: [180, 10], gNx: [340, 16], gNy: [280, 14], gNr: [220, 12], gFx: [320, 16], gFy: [280, 14], gFr: [220, 12] },
  fast: ['x', 'tilt', 'gNx', 'gFx'],
  kick: { tilt: -200, head: -260 },
  turnKick: { tilt: 140, head: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.gbU = stepPhase(m, a, 'gb', 7);
    const lu = t % 7;
    // On its toes like a boxer, and every so often a burst of shadow-boxing.
    const box = hold(lu, 3, 3.2, 4.4, 4.7);
    const jab = Math.max(0, Math.sin(t * 13)) * box;
    const cross = Math.max(0, -Math.sin(t * 13)) * box;
    const bounce = Math.abs(Math.sin(t * 4.2));
    const idle = { x: 0, lift: bounce * 1.2, toes: bounce * 0.5, tilt: Math.sin(t * 2.1) * 3 + box * 6, head: -Math.sin(t * 2.1) * 3 - box * 4, gNx: jab * 7, gNy: 3 + bounce * 0.6, gNr: 0, gFx: cross * 10, gFy: 4 - bounce * 0.6, gFr: cross * 20 };
    const s1 = Math.sin(a.gbU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.4, toes: 0, tilt: 6, head: -4, gNx: 1, gNy: 3, gNr: 0, gFx: 1, gFy: 4, gFr: 0 };
    const hook = hookOf(m);
    const antic = hook ? { x: -2, lift: 0, toes: 0, tilt: -8, head: -6, gNx: -2, gNy: 4, gNr: 0, gFx: -6, gFy: 2, gFr: -30 } : { x: -3, lift: 0, toes: 0, tilt: -10, head: -8, gNx: -6, gNy: 2, gNr: 0, gFx: 0, gFy: 4, gFr: 0 };
    const strike = hook ? { x: 8, lift: 0.5, toes: 0, tilt: 18, head: 6, gNx: 0, gNy: 3, gNr: 0, gFx: 15, gFy: 5, gFr: 30 } : { x: 9, lift: 0, toes: 0, tilt: 16, head: 8, gNx: 8, gNy: 4, gNr: 0, gFx: 2, gFy: 4, gFr: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -4 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [1, -16], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    ...gbPass(false),
    ...gbPass(true),
    { name: 'face', parent: 'nk', s: (a) => gbFace(moodOf(a)), pivot: [11, 18] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 || a.ph.strike < 0.3) return;
    // Little stars off the glove that lands.
    const [gx, gy] = at2(mat(hookOf(m) ? 'gloveF' : 'gloveN'), 5, 0);
    for (let k = 0; k < 3; k++) sparkle(ctx, a, gx + 3 + k * 3, gy - 4 + k * 4, 2.2 * a.ph.strike, a.alpha * a.ph.strike, k % 2 ? '#ffffff' : '#fff3a6');
  },
});
export function gummyStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 40, h: 42, res: 3, shapes: shift([
    ...put(gbGlove(true)(), [5, 4.5], -7, -20), ...put(gbFoot(true)(), [4, 4.6], -3.6, 0), ...put(gbFoot(false)(), [4, 4.6], 3.6, 0), ...put(gbBody(), [11, 19.6], 0, -4),
    ...put(gbHead(), [11, 18], 1, -20), ...put(gbOwnFace(fm), [11, 18], 1, -20), ...put(gbGlove(false)(), [5, 4.5], 8, -18),
  ], 20, 41) };
}

// =====================================================================================
// Cotton Candy Sheep
// =====================================================================================
const FLOSS = ramp('#ffb8d8', { step: 8, turn: 10, lift: 10 });
const FLOSSB = '#b8dcff';
const LAMB = ramp('#fff0e6', { step: 8, turn: 8 });
const HOOF = '#7a5a8a';
const cs = pairOf('cs');
// The fleece: a cloud of floss, pink with blue swirled through it. Box 30 x 24; standing at (15, 23.6).
const csFleece = () => [
  ...[[6, 15, 6], [24, 15, 6], [9, 19.4, 5], [21, 19.4, 5], [15, 20, 5.6], [8, 9, 5.6], [22, 9, 5.6], [15, 6.4, 6.4]].map(([x, y, r]) => E(x, y, r, r * 0.92, FLOSS.base)),
  E(15, 13, 11, 9.6, FLOSS.base),
  F(E(10, 11, 4.4, 3.4, FLOSSB)), F(E(20, 17, 4, 3, FLOSSB)), F(E(17, 7, 3, 2.2, FLOSSB)),
  ...stroke(arcP(11, 12, 3.6, 2.8, 200, 470, 12), 0.7, '#ffe6f2'), ...stroke(arcP(20, 10, 3, 2.4, 160, 430, 12), 0.7, '#ffe6f2'), ...stroke(arcP(15, 18, 3, 2, 190, 400, 10), 0.6, '#ffe6f2'),
  crescent(15, 13, 13, 11, FLOSS.sh, { k: 0.16, a0: 110, a1: 210 }), shine(15, 12, 12, 10, '#ffffff', 0, 0.8),
];
// The lamb's face poking well out of the floss: cream, floppy ears, a floss tuft on top. Box 22 x
// 20; the neck at (8, 18).
const csHead = () => [
  ov(3.4, 11.6, 4.6, 2.2, 32, LAMB.sh),
  E(11, 11.8, 8.2, 7.4, LAMB.base), crescent(11, 11.8, 8.2, 7.4, LAMB.sh, { k: 0.2, a0: 110, a1: 220 }), shine(11, 11.8, 8.2, 7.4, '#ffffff', 0, 0.7),
  ov(18.8, 11.4, 4.2, 2, -32, LAMB.base), F(ov(18.8, 11.4, 2.6, 1, -32, '#ffc8d8')),
  ...[[6.4, 4.6, 3.8], [11, 3.4, 4.2], [15.4, 4.8, 3.4]].map(([x, y, r]) => E(x, y, r, r * 0.9, FLOSS.base)), F(E(10, 2.4, 2, 1.2, '#ffffff')), F(E(6.4, 5.4, 1.8, 1.1, FLOSSB)),
];
const csHoof = (far) => () => [E(3, 2.4, 2.4, 2.2, far ? LAMB.sh : LAMB.base), E(3, 4, 2.2, 1.4, HOOF)];
const csFoot = (far) => () => [R(1.4, 0, 4.2, 2.8, far ? LAMB.sh : LAMB.base), E(3.5, 3.2, 3, 1.6, HOOF)];
const CS_FLEECE = cs('fleece', 30, 24, csFleece, 8, 8);
const CS_HEAD = cs('head', 22, 20, csHead, 2);
const CS_HOOF = [false, true].map((f) => cs(`hoof${f ? 1 : 0}`, 6, 6, csHoof(f), 2));
const CS_FOOT = [false, true].map((f) => cs(`foot${f ? 1 : 0}`, 7, 5, csFoot(f), 2));
// Its own face, a cotton-candy sheep's: dreamy half-shut lids over violet eyes, two lashes curling down
// from each, a sheep's little nose and its "Y" of a mouth, fluffy pink cloud puffs for a blush.
// Box 22 x 20.
const CS_EYES = [[9.4, 12, -1, 1.6, 2.1], [14.6, 11.8, 1, 1.7, 2.2]];
const csOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of CS_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.5, '#7a5a9a');
    if (shut) out.push(...shut);
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.05 + (px - x) * -s * 0.55 : mood === 'shout' ? NOLID : () => y - h * 0.2;
      out.push(...oOpen(x, y, w, h, lid, '#5a3a6a', '#a888d0'), oDot(x, y + h * 0.15, w * (mood === 'shout' ? 0.22 : 0.32), INK, lid), oDot(x + w * 0.3, y + h * 0.05, w * 0.18, '#ffffff', lid), ...oLid(x, y, w, h, lid, 0.5));
    }
    if (mood !== 'dead' && mood !== 'dizzy' && mood !== 'hurt') out.push(...oLn([[x + s * w * 0.55, y + h * 0.75], [x + s * w * 0.9, y + h * 1.2]], 0.3), ...oLn([[x + s * w * 0.1, y + h * 0.95], [x + s * w * 0.25, y + h * 1.4]], 0.3));
  }
  if (mood !== 'dead') for (const [bx, by] of [[7.2, 14.8], [16.6, 14.6]]) for (const [dx, dy, r] of [[-0.6, 0.1, 0.62], [0.4, -0.2, 0.7], [0.7, 0.35, 0.5]]) out.push(F(E(bx + dx, by + dy, r, r * 0.8, '#ffb4d0')));
  const [mx, my] = [12.4, 15.4];
  out.push(F(E(mx, my - 1.3, 0.55, 0.35, '#e890b0')));
  if (mood === 'shout') out.push(...oLn([[mx, my - 1], [mx, my - 0.5]], 0.32), F(E(mx, my + 0.3, 0.7, 0.85, '#7a2a4a')));
  else if (mood === 'happy') out.push(...oLn([[mx, my - 1], [mx, my - 0.3], [mx - 0.9, my + 0.2]], 0.32), ...oLn([[mx, my - 0.3], [mx + 0.9, my + 0.2]], 0.32), F(E(mx, my + 0.1, 0.45, 0.3, '#ff9ab0')));
  else if (mood === 'angry') out.push(...oLn([[mx, my - 1], [mx, my - 0.2]], 0.32), ...oLn([[mx - 0.9, my + 0.1], [mx + 0.9, my + 0.1]], 0.32));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oLn([[mx, my - 1], [mx, my - 0.4]], 0.32), ...oWave(mx, my + 0.1, 0.9, 0.3));
  else out.push(...oLn([[mx, my - 1], [mx, my - 0.3]], 0.32), ...oLn([[mx - 0.9, my + 0.35], [mx, my - 0.3], [mx + 0.9, my + 0.35]], 0.32));
  if (mood === 'hurt') out.push(...oDrop(16.6, 12, 0.6));
  return out;
};
const csFace = (mood) => sm(`cs|face|${mood}`, 22, 20, () => csOwnFace(mood));
const csPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: CS_FOOT[far ? 1 : 0][i], pivot: [3.5, 4.6], at: (S, a) => { const [dx, l] = pawStep(a.csU ?? 0, far ? 0.5 : 0, 8, 0.6, 2.2); return [S.x + (far ? -4.6 : 4.6) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `hoofF${tag}`, parent: 'trunk', s: CS_HOOF[1][i], pivot: [3, 1], at: () => [-8, -9], rot: (S) => S.armF * D2R },
    foot(1, true),
    foot(0, false),
    { name: `fleece${tag}`, parent: 'trunk', s: CS_FLEECE[i], pivot: [15, 23.6] },
    { name: `head${tag}`, parent: 'nk', s: CS_HEAD[i], pivot: [8, 18] },
    { name: `hoofN${tag}`, parent: 'trunk', s: CS_HOOF[0][i], pivot: [3, 1], at: () => [8, -6], rot: (S) => S.armN * D2R },
  ];
};
export const sheepRig = makeRig({
  w: 44, h: 40, soft: true, stride: 8, recover: 0.6,
  springs: { x: [260, 18], lift: [220, 14], tilt: [180, 12], head: [160, 10], hx: [200, 14], hy: [200, 14], armN: [200, 10], armF: [200, 10] },
  fast: ['x', 'head'],
  kick: { tilt: -160, head: -240 },
  turnKick: { tilt: 120, head: 160 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.csU = stepPhase(m, a, 'cs', 8);
    const lu = t % 9;
    // Now and then it turns round and nibbles a bit of its own fleece, very pleased about it.
    const nib = hold(lu, 4, 4.5, 6.4, 6.9);
    a.csNib = nib;
    const chew = nib * Math.sin(t * 16) * 4;
    const br = Math.sin(t * 2);
    const idle = { x: 0, lift: br * 0.5, tilt: br * 2 - nib * 4, head: -nib * 38 + chew + br * 3, hx: -nib * 5, hy: -nib * 3, armN: br * 6, armF: -br * 6 };
    const s1 = Math.sin(a.csU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.8, tilt: 5, head: -6, hx: 0, hy: 0, armN: s1 * 14, armF: -s1 * 14 };
    const antic = { x: -3, lift: 2, tilt: -12, head: -18, hx: -2, hy: 1, armN: -30, armF: -20 };
    const strike = { x: 4, lift: 0, tilt: 12, head: 22, hx: 2, hy: -1, armN: 30, armF: 20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -4 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: (S) => [9 + S.hx, -14 - S.hy], rot: (S) => S.head * D2R },
    ...csPass(false),
    ...csPass(true),
    { name: 'face', parent: 'nk', s: (a) => csFace(moodOf(a, a.csNib > 0.4 ? 'happy' : null)), pivot: [8, 18] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Wisps of floss drifting up off its fleece.
    for (let k = 0; k < 2; k++) {
      const u = (a.t * 0.3 + k * 0.5 + (m.uid % 7) * 0.13) % 1;
      const [fx, fy] = at2(mat('trunk'), -6 + k * 10, -24);
      puff(ctx, a, fx + Math.sin(u * 6 + k) * 3, fy - u * 16, 1.6 + u * 2, a.alpha * 0.5 * Math.sin(u * Math.PI), k ? '184,220,255' : '255,200,226');
    }
    // A ball of floss puffed out as it strikes.
    if (a.ph.strike > 0.2) {
      const [hx, hy] = at2(mat('nk'), 11, -6);
      for (let k = 0; k < 3; k++) puff(ctx, a, hx + 4 + k * 3 * a.ph.strike, hy + (k - 1) * 3, 2.4 + a.ph.strike * 2, a.alpha * a.ph.strike * 0.8, k % 2 ? '184,220,255' : '255,200,226');
    }
  },
});
export function sheepStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 38, res: 3, shapes: shift([
    ...put(csHoof(true)(), [3, 1], -8, -13), ...put(csFoot(true)(), [3.5, 4.6], -4.6, 0), ...put(csFoot(false)(), [3.5, 4.6], 4.6, 0), ...put(csFleece(), [15, 23.6], 0, -4),
    ...put(csHead(), [8, 18], 9, -18), ...put(csOwnFace(fm), [8, 18], 9, -18), ...put(csHoof(false)(), [3, 1], 9, -12),
  ], 20, 37) };
}

// =====================================================================================
// Lollipop Witch
// =====================================================================================
const ROBE = ramp('#9a7ae8', { step: 10, turn: 10 });
const HATC = ramp('#6a4ab8', { step: 10, turn: 8, lift: 12 });
const LEMON = ramp('#ffe08a', { step: 9, turn: 10 });
const LOLLI = '#ff8ab8';
const lw = pairOf('lpw');
// The robe, down to her toes: a pink sash, gumdrop buttons, little stars. Box 20 x 20; standing at
// (10, 19.6).
const lwRobe = () => [
  T([[5, 0], [15, 0], [19, 19.6], [1, 19.6]], ROBE.base),
  F(T([[5, 0], [7.6, 0], [4.6, 19.6], [1, 19.6]], ROBE.hi)), F(T([[13.8, 0], [15, 0], [19, 19.6], [16.2, 19.6]], ROBE.sh)),
  F(R(4.4, 5.4, 11.2, 2.4, '#ff9ab8')), F(E(10, 10.6, 1.2, 1.1, '#9ae6c0')), F(E(10, 14, 1.2, 1.1, '#ffe08a')),
  star5(6, 15, 1.2, '#fff3a6'), star5(15.4, 11, 1, '#fff3a6'),
];
// The hem's frill of white lace, swinging by itself. Box 22 x 5; hung at (11, 0.4).
const lwHem = () => [...[1, 5, 9, 13, 17, 21].map((x) => E(x, 2.4, 2.4, 2.2, '#fff4fa')), ...[1, 5, 9, 13, 17, 21].map((x) => F(E(x, 2.2, 1.1, 0.9, '#ffd0e4')))];
// Her head: a round sugared lemon drop. Box 16 x 15; the neck at (8, 14).
const lwHead = () => [E(8, 8, 7.2, 6.6, LEMON.base), crescent(8, 8, 7.2, 6.6, LEMON.sh, { k: 0.2, a0: 100, a1: 220 }), shine(8, 8, 7.2, 6.6, '#ffffff', 0, 0.9)];
// The hat: a tall bent cone, a candy-stripe band, a star on it. Box 22 x 20; its brim at (11, 17.4).
const lwHat = () => [
  T([[4.6, 16.4], [17.4, 16.4], [13.6, 7], [10.6, 2.4], [7.6, 0.2], [9.4, 6]], HATC.base),
  F(T([[4.6, 16.4], [7.6, 16.4], [9.4, 6], [7.6, 0.2]], HATC.hi)),
  F(T([[6.2, 13], [16, 13], [16.8, 15.2], [5.4, 15.2]], '#ff9ab8')), F(R(8.6, 13, 1.6, 2.2, '#ffffff')), F(R(12.2, 13, 1.6, 2.2, '#ffffff')),
  ov(11, 17, 11, 2.4, 0, HATC.sh), F(ov(11, 16.6, 9, 1.3, 0, HATC.base)),
  star5(10.4, 9.4, 1.5, '#fff3a6'),
];
// The lollipop staff: a pink swirl on a white stick, a ribbon bow. Box 14 x 36; held at (7, 24).
const lwStaff = () => {
  const sp = [];
  for (let s = 0; s <= 1.001; s += 0.04) {
    const a = s * TAU * 2.2;
    const r = 0.8 + s * 5.2;
    sp.push([7 + Math.cos(a) * r, 7 + Math.sin(a) * r]);
  }
  return [
    R(6, 12, 2.2, 24, '#fff6ea'), F(R(6, 12, 0.7, 24, '#ffffff')),
    E(7, 7, 6.6, 6.6, LOLLI), ...stroke(sp, 1.3, '#ffffff'), shine(7, 7, 6.6, 6.6, '#ffffff', 0, 0.8),
    T([[7, 14.6], [3.4, 12.6], [3.4, 16.6]], '#9ae6c0'), T([[7, 14.6], [10.6, 12.6], [10.6, 16.6]], '#9ae6c0'), E(7, 14.6, 1.2, 1.2, '#7ac8a0'),
  ];
};
const lwHand = (far) => () => [E(2.4, 3.5, 3, 3, far ? ROBE.sh : ROBE.base), E(4.4, 3.6, 2.3, 2.2, far ? LEMON.sh : LEMON.base)];
const lwShoe = (far) => () => [E(4, 2, 3.2, 1.8, far ? '#3e2a66' : '#5a3a8a'), F(E(3, 1.4, 1, 0.5, '#ffffff'))];
const LW_ROBE = lw('robe', 20, 20, lwRobe, 2);
const LW_HEM = lw('hem', 22, 5, lwHem, 2);
const LW_HEAD = lw('head', 16, 15, lwHead, 2);
const LW_HAT = lw('hat', 22, 20, lwHat, 2);
const LW_STAFF = lw('staff', 14, 36, lwStaff, 2);
const LW_HAND = [false, true].map((f) => lw(`hand${f ? 1 : 0}`, 7, 7, lwHand(f), 2));
const LW_SHOE = [false, true].map((f) => lw(`shoe${f ? 1 : 0}`, 7, 4, lwShoe(f), 2));
// Her own face, a lollipop witch's: violet eyes with a little crescent moon of light, a lash flick at
// each corner, and an impish smirk with the tip of her tongue poking out at one side. Box 16 x 15.
const LW_EYES = [[7.4, 8.6, -1, 1.3, 1.8], [11.6, 8.4, 1, 1.4, 1.9]];
const LW_MOUTH = '#7a2a4a';
const lwOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of LW_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.5, '#6a3aa8');
    if (shut) out.push(...shut);
    else {
      const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.6 : NOLID;
      out.push(...oOpen(x, y, w, h, lid, '#6a3aa8', '#b88af0'), oDot(x, y + h * 0.12, w * (mood === 'shout' ? 0.2 : 0.3), INK, lid));
      out.push(F(T(oCut([...oArc(x + w * 0.25, y - h * 0.25, w * 0.32, w * 0.32, 300, 480, 6), ...oArc(x + w * 0.38, y - h * 0.32, w * 0.22, w * 0.24, 480, 300, 6)], lid), '#ffffff')));
      out.push(...oLid(x, y, w, h, lid, 0.5));
    }
    if (mood !== 'dead' && mood !== 'hurt' && mood !== 'dizzy') out.push(...oLn([[x + s * w * 0.85, y - h * 0.3], [x + s * w * 1.35, y - h * 0.7]], 0.35));
  }
  if (mood !== 'dead') for (const [bx, by, r] of [[5.6, 10.8, 1], [13.2, 10.6, 0.9]]) out.push(F(E(bx, by, r, r * 0.5, '#ff9ab0')));
  const [mx, my] = [9.8, 11.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 0.8, 0.9, LW_MOUTH)), F(T([[mx - 0.55, my - 0.45], [mx - 0.15, my - 0.45], [mx - 0.35, my + 0.1]], '#ffffff')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.3, 1.1, 1, 0, 180, 8), LW_MOUTH)), F(E(mx + 0.3, my + 0.5, 0.55, 0.4, '#ff8aa8')));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.9, my + 0.3], [mx, my], [mx + 0.9, my + 0.3]], 0.35));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.9, 0.3));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.35, 0.4, LW_MOUTH)));
  else out.push(...oLn([[mx - 0.9, my - 0.15], [mx - 0.2, my + 0.3], [mx + 0.6, my + 0.2], [mx + 1.1, my - 0.3]], 0.35), F(E(mx + 0.55, my + 0.6, 0.38, 0.4, '#ff8aa8')));
  if (mood === 'hurt') out.push(...oDrop(13.4, 8.4, 0.55));
  return out;
};
const lwFace = (mood) => sm(`lpw|face|${mood}`, 16, 15, () => lwOwnFace(mood));
const lwPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const shoe = (k, far) => ({ name: `shoe${k}${tag}`, parent: null, s: LW_SHOE[far ? 1 : 0][i], pivot: [3, 3.6], at: (S, a) => { const [dx, l] = pawStep(a.lwU ?? 0, far ? 0.5 : 0, 6, 0.6, 1.4); return [S.x + (far ? -2.6 : 3.4) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `handF${tag}`, parent: 'trunk', s: LW_HAND[1][i], pivot: [3.5, 3.5], at: (S) => [-7, -13 - S.fy], rot: (S) => S.fr * D2R },
    shoe(1, true),
    shoe(0, false),
    { name: `robe${tag}`, parent: 'trunk', s: LW_ROBE[i], pivot: [10, 19.6] },
    { name: `hem${tag}`, parent: 'trunk', s: LW_HEM[i], pivot: [11, 0.4], at: () => [0, -0.4], soft: { key: 'hem', dir: [0, 1], k: 200, c: 12, gain: 0.6, max: 5, turn: 0.15 } },
    { name: `head${tag}`, parent: 'nk', s: LW_HEAD[i], pivot: [8, 14] },
    { name: `hat${tag}`, parent: 'nk', s: LW_HAT[i], pivot: [11, 17.4], at: () => [0, -11.6], rot: (S) => S.hat * D2R, soft: { key: 'hat', dir: [0, -1], k: 150, c: 9, gain: 0.9, max: 14, turn: 0.5 } },
    { name: `staff${tag}`, parent: 'handN', s: LW_STAFF[i], pivot: [7, 24], rot: (S) => S.st * D2R },
    { name: `handN${tag}`, parent: 'trunk', s: LW_HAND[0][i], pivot: [3.5, 3.5], at: (S) => [7 + S.hx, -13 - S.hy] },
  ];
};
export const witchRig = makeRig({
  w: 44, h: 56, soft: true, stride: 6, recover: 0.6,
  springs: { x: [260, 18], lift: [220, 14], tilt: [180, 12], head: [170, 10], hat: [140, 9], hx: [240, 14], hy: [240, 14], st: [200, 12], fy: [200, 12], fr: [180, 10] },
  fast: ['hx', 'hy', 'st'],
  kick: { tilt: -160, head: -240 },
  turnKick: { tilt: 120, hat: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.lwU = stepPhase(m, a, 'lw', 6);
    const lu = t % 9;
    const br = Math.sin(t * 1.8);
    // A little twirl of the lollipop, then, when nobody's looking, a sneaky lick.
    const twirl = hold(lu, 1, 1.4, 2.6, 3);
    const lick = hold(lu, 5, 5.5, 6.9, 7.4);
    a.lwLick = lick;
    const idle = { x: 0, lift: br * 0.5, tilt: br * 2 + lick * 6, head: br * 3 + lick * 10, hat: -br * 3, hx: 3 - lick * 7, hy: lick * 6, st: 14 + Math.sin(t * 5) * 30 * twirl - lick * 48, fy: br, fr: lick * 20 };
    const s1 = Math.sin(a.lwU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 0.8, tilt: s1 * 3 + 3, head: -s1 * 3, hat: s1 * 6, hx: 3, hy: Math.abs(s1), st: 18, fy: 0, fr: s1 * 10 };
    const antic = { x: -2, lift: 1, tilt: -8, head: -10, hat: 10, hx: -2, hy: 12, st: -30, fy: 4, fr: -20 };
    const strike = { x: 3, lift: 0, tilt: 10, head: 8, hat: -10, hx: 6, hy: 4, st: 78, fy: 2, fr: 20 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -4 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [0, -19], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    ...lwPass(false),
    ...lwPass(true),
    { name: 'face', parent: 'nk', s: (a) => lwFace(moodOf(a, a.lwLick > 0.4 ? 'happy' : null)), pivot: [8, 14] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const [dx, dy] = at2(mat('staff'), 0, -17);
    // The lollipop glints, and casts a swirl of sugar sparkles as she points it.
    sparkle(ctx, a, dx - 3, dy - 3, 1.4, a.alpha * (0.4 + 0.4 * Math.sin(a.t * 3 + m.uid)), '#ffffff');
    const k = Math.max(a.ph.antic, a.ph.strike);
    if (k > 0.1) {
      for (let i = 0; i < 5; i++) {
        const ang = a.t * 9 + (i * TAU) / 5;
        const r = 5 + 6 * a.ph.strike;
        sparkle(ctx, a, dx + Math.cos(ang) * r, dy + Math.sin(ang) * r, 1.8, a.alpha * k, i % 2 ? '#ffffff' : '#ffc8e0');
      }
    }
  },
});
export function witchStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 52, res: 3, shapes: shift([
    ...put(lwHand(true)(), [3.5, 3.5], -7, -17), ...put(lwShoe(true)(), [3, 3.6], -2.6, 0), ...put(lwShoe(false)(), [3, 3.6], 3.4, 0), ...put(lwRobe(), [10, 19.6], 0, -4), ...put(lwHem(), [11, 0.4], 0, -4.4),
    ...put(lwHead(), [8, 14], 0, -23), ...put(lwHat(), [11, 17.4], 0, -34.6), ...put(lwOwnFace(fm), [8, 14], 0, -23), ...put(lwStaff(), [7, 24], 10, -17, 14), ...put(lwHand(false)(), [3.5, 3.5], 10, -17),
  ], 22, 51) };
}

// =====================================================================================
// Peppermint Spinner
// =====================================================================================
const MINT_R = '#ee4a5e';
const pm = pairOf('pm');
// The mint's ring: white, six red stripes curling round it (the ring turns live). Box 24 x 24; its
// middle at (12, 12).
const pmRing = () => {
  const out = [E(12, 12, 11, 11, '#fff8f8')];
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * TAU;
    const pts = [];
    for (let k = 0; k <= 5; k++) pts.push([12 + Math.cos(a0 + k * 0.1) * 10.6, 12 + Math.sin(a0 + k * 0.1) * 10.6]);
    for (let k = 5; k >= 0; k--) pts.push([12 + Math.cos(a0 - 0.42 + k * 0.08) * 6.2, 12 + Math.sin(a0 - 0.42 + k * 0.08) * 6.2]);
    out.push(F(T(pts, MINT_R)));
  }
  return out;
};
// Its white middle, where its face is. Box 14 x 14; its middle at (7, 7).
const pmMiddle = () => [E(7, 7, 6.2, 6.2, '#ffffff'), F(E(7, 7.4, 5.6, 5.4, '#fff4f6'))];
// A wrapper twist: cellophane pinched by the mint, flaring out in a crinkly fan. Box 12 x 12;
// pinched at (1, 6) (the far one mirrored, at (11, 6)).
const pmTwist = (far) => () => {
  const mx = (pts) => (far ? pts.map(([x, y]) => [12 - x, y]) : pts);
  const c = far ? '#c8dcf0' : '#e8f4ff';
  return [
    E(far ? 10.4 : 1.6, 6, 1.8, 2.2, c),
    T(mx([[2, 5], [10, 0.6], [11.6, 3.6], [10.6, 6], [11.6, 8.4], [10, 11.4], [2, 7]]), c),
    ...stroke(mx([[4, 5.6], [9.6, 2.4]]), 0.5, '#ffffff'), ...stroke(mx([[4, 6.4], [9.6, 9.6]]), 0.5, '#ffffff'), ...stroke(mx([[4, 6], [10.4, 6]]), 0.4, '#b8d0ec'),
  ];
};
const pmFoot = (far) => () => [E(3, 2, 2.8, 1.8, far ? '#b8344a' : '#e8505e'), F(E(2.2, 1.4, 0.8, 0.5, '#ffffff'))];
const PM_RING = pm('ring', 24, 24, pmRing, 2);
const PM_MID = pm('mid', 14, 14, pmMiddle, 2);
const PM_TWIST = [false, true].map((f) => pm(`twist${f ? 1 : 0}`, 12, 12, pmTwist(f), 2));
const PM_FOOT = [false, true].map((f) => pm(`foot${f ? 1 : 0}`, 6, 4, pmFoot(f), 2));
const pmGloss = () => sm('pm|gloss', 24, 24, () => [F(ov(7.4, 5.4, 3.4, 1.6, -35, '#ffffff')), F(E(4.4, 9.4, 0.9, 0.9, '#ffffff'))]);
// Its own face, a peppermint's: round red eyes with a candy stripe of light across them, red candy
// stripes on its cheeks, and a little "o" breathing out a cool minty puff. Box 14 x 14.
const PM_EYES = [[5.2, 6.6, -1, 1.2, 1.6], [9.2, 6.4, 1, 1.3, 1.7]];
const PM_MOUTH = '#8a1a2e';
const pmOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of PM_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.45, '#c8203a');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.2 + (px - x) * -s * 0.6 : NOLID;
    out.push(...oOpen(x, y, w, h, lid, '#c8203a', '#ff7a8a'), oDot(x, y + h * 0.12, w * (mood === 'shout' ? 0.2 : 0.3), INK, lid));
    out.push(F(T(oCut([[x - w * 0.15, y - h * 0.6], [x + w * 0.35, y - h * 0.6], [x + w * 0.75, y - h * 0.05], [x + w * 0.3, y + h * 0.05]], lid), '#ffffff')));
    out.push(...oLid(x, y, w, h, lid, 0.45));
  }
  if (mood !== 'dead') for (const [bx, by] of [[3.6, 8.8], [10.8, 8.6]]) for (const dx of [-0.45, 0.45]) out.push(...oLn([[bx + dx - 0.3, by + 0.4], [bx + dx + 0.3, by - 0.4]], 0.32, '#e8304a'));
  const [mx, my] = [7.4, 9.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.3, 0.75, 0.85, PM_MOUTH)));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.2, 0.95, 0.85, 0, 180, 8), PM_MOUTH)));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.8, my + 0.3], [mx, my - 0.05], [mx + 0.8, my + 0.3]], 0.32));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.8, 0.3));
  else if (mood === 'dead') out.push(...oLn([[mx - 0.6, my + 0.1], [mx + 0.6, my + 0.1]], 0.3));
  else out.push(F(E(mx, my + 0.1, 0.42, 0.45, PM_MOUTH)), F(E(mx + 1.5, my + 0.4, 0.55, 0.4, '#d8f4ff')), F(E(mx + 2.2, my + 0.2, 0.4, 0.32, '#d8f4ff')));
  if (mood === 'hurt') out.push(...oDrop(10.8, 6.4, 0.5));
  return out;
};
const pmFace = (mood) => sm(`pm|face|${mood}`, 14, 14, () => pmOwnFace(mood));
const pmPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: PM_FOOT[far ? 1 : 0][i], pivot: [3, 3.6], at: (S, a) => { const [dx, l] = pawStep(a.pmU ?? 0, far ? 0.5 : 0, 6, 0.55, 2); return [S.x + (far ? -3.6 : 3.6) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `twistF${tag}`, parent: 'trunk', s: PM_TWIST[1][i], pivot: [11, 6], at: () => [-10.4, 0], rot: (S) => -S.tw * D2R, soft: { key: 'twistF', dir: [-1, 0], k: 120, c: 7, gain: 1.2, max: 32, flutter: 6, hz: 1.1 } },
    foot(1, true),
    foot(0, false),
    { name: `ring${tag}`, parent: 'trunk', s: PM_RING[i], pivot: [12, 12], rot: (S, a) => a.pmSpin },
    { name: `mid${tag}`, parent: 'trunk', s: PM_MID[i], pivot: [7, 7], at: (S) => [S.look, 0] },
    { name: `twistN${tag}`, parent: 'trunk', s: PM_TWIST[0][i], pivot: [1, 6], at: () => [10.4, 0], rot: (S) => S.tw * D2R, soft: { key: 'twistN', dir: [1, 0], k: 120, c: 7, gain: 1.2, max: 32, flutter: 6, hz: 1.3 } },
  ];
};
export const mintRig = makeRig({
  w: 44, h: 36, soft: true, stride: 6, recover: 0.5,
  springs: { x: [300, 18], lift: [260, 14], tilt: [200, 12], look: [160, 12], tw: [200, 10] },
  fast: ['x', 'tilt'],
  kick: { tilt: -220, tw: 300 },
  turnKick: { tilt: 160, tw: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.pmU = stepPhase(m, a, 'pm', 6);
    // Its stripes turn all the time: lazily at rest, rolling with its speed as it runs, a blur as
    // it spins up and dashes.
    const st = (a.mo.rig ??= {});
    const roll = (st.pmV ?? 0) / 11;
    st.pmA = ((st.pmA ?? 0) + Math.min(0.2, a.dt) * (0.9 + roll + a.ph.antic * 9 + a.ph.strike * 18)) % TAU;
    a.pmSpin = st.pmA;
    const lu = t % 6;
    const hop = hold(lu, 3, 3.25, 3.45, 3.8);
    const idle = { x: 0, lift: Math.abs(Math.sin(t * 3.2)) * 0.8 + hop * 4, tilt: Math.sin(t * 1.6) * 6, look: Math.sin(t * 0.7) * 0.8, tw: Math.sin(t * 2.4) * 10 + hop * 24 };
    const s1 = Math.sin(a.pmU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.2, tilt: 8, look: 1, tw: -14 };
    const antic = { x: -3, lift: -1.6, tilt: -14, look: -0.6, tw: 24 };
    const strike = { x: 9, lift: 1, tilt: 16, look: 1.2, tw: -30 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -15 - S.lift], rot: (S) => S.tilt * D2R },
    ...pmPass(false),
    ...pmPass(true),
    { name: 'gloss', parent: 'trunk', s: () => pmGloss(), pivot: [12, 12] },
    { name: 'face', parent: 'trunk', s: (a) => pmFace(moodOf(a)), pivot: [7, 7], at: (S) => [S.look, 0] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const k = Math.max(a.ph.antic * 0.6, a.ph.strike);
    if (k < 0.1) return;
    // Spinning up: a whirl of red and white sparkles round the mint.
    const [cx, cy] = at2(mat('trunk'), 0, 0);
    for (let i = 0; i < 6; i++) {
      const ang = a.pmSpin * 1.5 + (i * TAU) / 6;
      sparkle(ctx, a, cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14, 1.6, a.alpha * k, i % 2 ? '#ffffff' : '#ff8a96');
    }
  },
});
export function mintStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 44, h: 34, res: 3, shapes: shift([
    ...put(pmTwist(true)(), [11, 6], -10.4, -15), ...put(pmFoot(true)(), [3, 3.6], -3.6, 0), ...put(pmFoot(false)(), [3, 3.6], 3.6, 0), ...put(pmRing(), [12, 12], 0, -15),
    ...put(pmMiddle(), [7, 7], 0, -15), ...put(pmOwnFace(fm), [7, 7], 0, -15), ...put(pmTwist(false)(), [1, 6], 10.4, -15),
  ], 22, 33) };
}

// =====================================================================================
// Chocolate Knight
// =====================================================================================
const CHOC = ramp('#7a4a34', { step: 10, turn: 8 });
const FOIL = ramp('#ffd36b', { step: 10, turn: 8 });
const CAPE = ramp('#e8505e', { step: 10, turn: 8 });
const WHITE = '#fff2e2';
const ck = pairOf('ck');
// The breastplate: a chocolate bar in squares, a gold foil belt, round pauldrons. Box 22 x 22;
// standing at (11, 21.6).
const ckBody = () => {
  const out = [T([[3, 2], [19, 2], [20.4, 4], [20.4, 20], [19, 21.4], [3, 21.4], [1.6, 20], [1.6, 4]], CHOC.base)];
  for (const cx of [3.2, 11.4]) for (const cy of [3.4, 9.2]) out.push(F(R(cx, cy, 7.4, 5, CHOC.hi)), F(R(cx + 1, cy + 1, 5.6, 3, CHOC.base)));
  out.push(F(R(1.6, 15, 18.8, 3.2, FOIL.base)), F(R(1.6, 15, 18.8, 1, FOIL.hi)), F(E(11, 16.6, 1.7, 1.5, FOIL.sh)));
  out.push(E(2.6, 4.4, 3.6, 3.2, CHOC.hi), E(19.4, 4.4, 3.6, 3.2, CHOC.hi), F(E(1.8, 3.4, 1.2, 0.7, '#ffffff')));
  return out;
};
// The helm: a round bonbon, white chocolate drizzled over it, its visor showing a white-chocolate
// face. Box 20 x 19; the neck at (10, 18).
const ckHead = () => [
  E(10, 10.4, 9, 8.4, CHOC.base), crescent(10, 10.4, 9, 8.4, CHOC.sh, { k: 0.2, a0: 100, a1: 220 }), shine(10, 10.4, 9, 8.4, '#ffffff', 0, 0.7),
  F(ov(11.8, 11.8, 6, 4.6, 0, WHITE)),
  ...stroke([[2.6, 7], [4.6, 3.6], [6.6, 6.8], [8.6, 2.4], [10.6, 5.8], [12.6, 2.2], [14.6, 5.6], [16.6, 4]], 0.8, WHITE),
  F(R(2, 15.6, 16, 2.2, CHOC.sh)),
];
// A cherry on top of its helm, on a little bent stem. Box 10 x 12; its stem rooted at (5, 11.4).
const ckPlume = () => [taper([[5, 11.6], [5.4, 6], [7.4, 1.6]], 1.2, 0.8, '#6a8a3a'), E(5, 7.6, 3.8, 3.6, '#e8304a'), crescent(5, 7.6, 3.8, 3.6, '#b81e3a', { k: 0.2, a0: 60, a1: 200 }), F(E(3.8, 6.2, 1.2, 0.8, '#ffffff'))];
// The foil cape. Box 18 x 19; hung at (9, 1).
const ckCape = () => [T([[4, 0], [14, 0], [18, 18.4], [0, 18.4]], CAPE.base), F(T([[4, 0], [6.4, 0], [3, 18.4], [0, 18.4]], CAPE.hi)), F(T([[0.4, 16.6], [17.6, 16.6], [18, 18.4], [0, 18.4]], FOIL.base)), ...stroke([[9, 2], [8, 9], [9.4, 15]], 0.5, CAPE.sh)];
// The wafer sword. Box 8 x 32; gripped at (4, 27).
const ckSword = () => [
  R(1.6, 1, 4.8, 21, '#f6d6a0'), E(4, 1.2, 2.4, 1.4, '#f6d6a0'), F(R(1.6, 1, 4.8, 1.4, '#fff0cc')), ...[5, 10, 15, 20].map((y) => F(R(1.6, y, 4.8, 0.8, '#d8a868'))), F(R(3.6, 1, 0.8, 21, '#d8a868')),
  R(0, 22, 8, 2.6, CHOC.sh), R(2.8, 24.6, 2.4, 5, CHOC.base), E(4, 30.4, 1.8, 1.6, FOIL.base),
];
// A chocolate-chip cookie shield. Box 14 x 14; held at (7, 7).
const ckShield = () => [E(7, 7, 6.6, 6.6, '#e0a868'), crescent(7, 7, 6.6, 6.6, '#b87a44', { k: 0.18, a0: 90, a1: 230 }), ...[[4.6, 5], [9, 4], [8.6, 9.4], [4.4, 9.6], [6.8, 7.2]].map(([x, y]) => F(E(x, y, 1.3, 1.1, CHOC.deep))), shine(7, 7, 6.6, 6.6, '#ffffff', 0, 0.6)];
const ckHand = (far) => () => [E(3.5, 3.5, 3, 2.8, far ? CHOC.sh : CHOC.base), F(E(2.6, 2.6, 1, 0.6, CHOC.hi))];
const ckBoot = (far) => () => [R(1.4, 0, 6, 3.4, far ? CHOC.deep : CHOC.base), E(5, 3.6, 4, 2.2, far ? CHOC.deep : CHOC.sh)];
const CK_BODY = ck('body', 22, 22, ckBody, 6);
const CK_HEAD = ck('head', 20, 19, ckHead, 2);
const CK_PLUME = ck('plume', 10, 12, ckPlume, 2);
const CK_CAPE = ck('cape', 18, 19, ckCape, 2);
const CK_SWORD = ck('sword', 8, 32, ckSword, 2);
const CK_SHIELD = ck('shield', 14, 14, ckShield, 2);
const CK_HAND = [false, true].map((f) => ck(`hand${f ? 1 : 0}`, 7, 7, ckHand(f), 2));
const CK_BOOT = [false, true].map((f) => ck(`boot${f ? 1 : 0}`, 9, 6, ckBoot(f), 2));
// His own face, a cookie knight's: earnest brown eyes with a gold glint of valour, straight brave brows
// of chocolate, a chocolate-chip beauty mark and a confident half-smile; a battle cry to shout.
// Box 20 x 19.
const CK_EYES = [[9.8, 11.4, -1, 1.4, 1.8], [14, 11.2, 1, 1.5, 1.9]];
const CK_CHOC = '#5a2a1a';
const ckOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of CK_EYES) {
    const inner = mood === 'angry' ? 0.8 : mood === 'hurt' ? -0.6 : mood === 'happy' || mood === 'shout' ? -0.3 : 0.25;
    if (mood !== 'dead') out.push(...oLn([[x - s * w * 0.9, y - h * 1.15 + inner], [x + s * w * 0.95, y - h * 1.3 - inner * 0.2]], 0.55, CK_CHOC));
    const shut = oShut(mood, x, y, s, w, h, 0.5, CK_CHOC);
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y - h * 0.15 + (px - x) * -s * 0.5 : mood === 'shout' ? NOLID : () => y - h * 0.7;
    out.push(...oOpen(x, y, w, h, lid, '#5a2a1a', '#a8683a'), oDot(x, y + h * 0.12, w * (mood === 'shout' ? 0.2 : 0.32), '#2a1008', lid), oDot(x + w * 0.3, y - h * 0.1, w * 0.2, '#ffe070', lid), ...oLid(x, y, w, h, lid, 0.5));
  }
  if (mood !== 'dead') out.push(F(E(7.8, 13.6, 1, 0.5, '#ffa8a0')), F(E(15.8, 13.4, 0.9, 0.45, '#ffa8a0')));
  out.push(F(T([[16.6, 14.2], [17.2, 14.9], [16.6, 15.5], [16.1, 14.9]], CK_CHOC)));
  const [mx, my] = [12.2, 14.2];
  if (mood === 'shout') out.push(F(T([[mx - 1.1, my - 0.4], [mx + 1.1, my - 0.4], [mx + 0.6, my + 1.1], [mx - 0.6, my + 1.1]], '#7a2a2a')), F(E(mx, my + 0.8, 0.5, 0.25, '#ff9a9a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.3, 1.1, 1, 0, 180, 8), '#7a2a2a')));
  else if (mood === 'angry') out.push(...oLn([[mx - 0.9, my + 0.2], [mx + 0.9, my + 0.2]], 0.4));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.9, 0.35));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.4, 0.45, '#7a2a2a')));
  else out.push(...oLn([[mx - 0.9, my + 0.1], [mx, my + 0.35], [mx + 0.8, my + 0.1], [mx + 1.1, my - 0.25]], 0.38));
  if (mood === 'hurt') out.push(...oDrop(16, 11.2, 0.55));
  return out;
};
const ckFace = (mood) => sm(`ck|face|${mood}`, 20, 19, () => ckOwnFace(mood));
const ckPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const boot = (k, far) => ({ name: `boot${k}${tag}`, parent: null, s: CK_BOOT[far ? 1 : 0][i], pivot: [4.5, 5.6], at: (S, a) => { const [dx, l] = pawStep(a.ckU ?? 0, far ? 0.5 : 0, 9, 0.6, 3.2); return [S.x + (far ? -4.4 : 4.4) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `cape${tag}`, parent: 'trunk', s: CK_CAPE[i], pivot: [9, 1], at: () => [-3, -19], soft: { key: 'cape', dir: [0, 1], k: 100, c: 7, gain: 1.2, max: 28, turn: 0.8, flutter: 4, hz: 0.8 } },
    { name: `plume${tag}`, parent: 'nk', s: CK_PLUME[i], pivot: [6, 11.4], at: () => [0, -15.2], soft: { key: 'plume', dir: [0, -1], k: 150, c: 8, gain: 1, max: 18 } },
    { name: `shield${tag}`, parent: 'handF', s: CK_SHIELD[i], pivot: [7, 7], at: () => [-1, 0] },
    { name: `handF${tag}`, parent: 'trunk', s: CK_HAND[1][i], pivot: [3.5, 3.5], at: (S) => [-8, -10 - S.fy] },
    boot(1, true),
    boot(0, false),
    { name: `body${tag}`, parent: 'trunk', s: CK_BODY[i], pivot: [11, 21.6] },
    { name: `head${tag}`, parent: 'nk', s: CK_HEAD[i], pivot: [10, 18] },
    { name: `sword${tag}`, parent: 'handN', s: CK_SWORD[i], pivot: [4, 27], rot: (S) => S.sw * D2R },
    { name: `handN${tag}`, parent: 'trunk', s: CK_HAND[0][i], pivot: [3.5, 3.5], at: (S) => [8 + S.hx, -11 - S.hy] },
  ];
};
export const knightRig = makeRig({
  w: 48, h: 58, soft: true, stride: 9, recover: 0.7,
  springs: { x: [240, 18], lift: [240, 16], tilt: [180, 12], head: [160, 10], hx: [220, 14], hy: [220, 14], sw: [200, 13], fy: [180, 12] },
  fast: ['x', 'tilt', 'hx', 'hy', 'sw'],
  kick: { tilt: -160, head: -200 },
  turnKick: { tilt: 120 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    const t = a.t + a.uidOff;
    a.ckU = stepPhase(m, a, 'ck', 9);
    const lu = t % 10;
    const br = Math.sin(t * 1.6);
    // Sword on its shoulder; now and then a proper knightly salute, blade up before its visor.
    const salute = hold(lu, 6, 6.5, 7.6, 8.1);
    const idle = { x: 0, lift: br * 0.4, tilt: br * 1.5 - salute * 2, head: br * 2 + salute * 4, hx: salute * -1, hy: salute * 9 + (1 - salute) * 6, sw: 145 - salute * 145, fy: br * 0.6 };
    const s1 = Math.sin(a.ckU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 2.2, tilt: s1 * 3 + 2, head: -s1 * 2, hx: 0, hy: 4 + Math.abs(s1), sw: 128, fy: -s1 };
    const antic = { x: -2, lift: 1, tilt: -10, head: -8, hx: -4, hy: 13, sw: -140, fy: 3 };
    const strike = { x: 5, lift: 0, tilt: 16, head: 8, hx: 8, hy: 2, sw: 104, fy: 0 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -5 - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'nk', parent: 'trunk', at: () => [0, -18.4], rot: (S) => (S.head - S.tilt * 0.4) * D2R },
    ...ckPass(false),
    ...ckPass(true),
    { name: 'face', parent: 'nk', s: (a) => ckFace(moodOf(a)), pivot: [10, 18] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0 || a.ph.strike < 0.3) return;
    // Wafer crumbs and a glint where the blade comes down.
    const [tx, ty] = at2(mat('sword'), 0, -24);
    sparkle(ctx, a, tx, ty, 3 * a.ph.strike, a.alpha * a.ph.strike, '#fff3a6');
    for (let k = 0; k < 4; k++) dot(ctx, a, tx + (k - 1.5) * 3 + a.ph.strike * k, ty + 4 + k * 2 * a.ph.strike, 0.9, a.alpha * a.ph.strike, '#e8b880');
  },
});
export function knightStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 48, h: 54, res: 3, shapes: shift([
    ...put(ckCape(), [9, 1], -3, -24), ...put(ckPlume(), [5, 11.4], 0, -38.6), ...put(ckShield(), [7, 7], -9, -15), ...put(ckHand(true)(), [3.5, 3.5], -8, -15),
    ...put(ckBoot(true)(), [4.5, 5.6], -4.4, 0), ...put(ckBoot(false)(), [4.5, 5.6], 4.4, 0), ...put(ckBody(), [11, 21.6], 0, -5), ...put(ckHead(), [10, 18], 0, -23.4), ...put(ckOwnFace(fm), [10, 18], 0, -23.4),
    ...put(ckSword(), [4, 27], 8, -22, 145), ...put(ckHand(false)(), [3.5, 3.5], 8, -16),
  ], 24, 53) };
}

// =====================================================================================
// Jelly Bean Ninja
// =====================================================================================
const BEANS = ['#7fd86a', '#ff7a9a', '#ffcf4a', '#a08aff'].map((c) => ramp(c, { step: 10, turn: 12 }));
const BAND = '#e8404e';
const jn = pairOf('jn');
// The bean: glossy, curved in along its back, its face high on the front. Box 18 x 26; standing at
// (9, 25.6).
const beanPts = () => {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    let x = 9 + Math.cos(a) * 8.2;
    const y = 13 + Math.sin(a) * 12.4;
    if (x < 9) x += 2.4 * Math.exp(-(((y - 14) / 5.5) ** 2)) * ((9 - x) / 8.2);
    pts.push([x, y]);
  }
  return pts;
};
const jnBean = (k) => () => {
  const P = BEANS[k];
  return [T(beanPts(), P.base), crescent(9, 13, 8.2, 12.4, P.sh, { k: 0.16, a0: 100, a1: 210 }), F(ov(12.6, 6.6, 1.5, 4, -12, '#ffffff')), F(E(13.6, 18, 0.8, 1.2, '#ffffff'))];
};
// The headband round its forehead, a little swirl on its plate. Box 16 x 7; at (8, 3.5).
const jnBand = () => [taper([[0.6, 4.6], [4.6, 3], [11.4, 3], [15.4, 4.4]], 3.6, 3.4, BAND), F(R(10.4, 1.6, 4.4, 3.6, '#dfe6f0')), ...stroke(arcP(12.6, 3.4, 1.1, 1, 200, 470, 8), 0.4, '#8a94b0')];
// Its long tails, knotted at the back and streaming out behind. Box 16 x 7; knotted at (15, 3).
const jnTails = () => [taper([[15.5, 2.6], [10, 2], [5, 3], [0.5, 1.8]], 3, 1.6, BAND), taper([[15.5, 3.2], [10.4, 4.6], [6, 4.8], [1.6, 6.2]], 2.6, 1.4, '#c8303e'), E(15, 3, 2, 2, BAND)];
const jnHand = (k, far) => () => [E(2.5, 2.5, 2.2, 2.1, far ? BEANS[k].deep : BEANS[k].sh)];
const jnFoot = (far) => () => [E(3, 2, 2.8, 1.8, far ? '#241a30' : '#3a2a4a'), F(E(2.2, 1.4, 0.8, 0.4, '#8a7a9a'))];
const JN_BEAN = [0, 1, 2, 3].map((k) => jn(`bean${k}`, 18, 26, jnBean(k), 2));
const JN_BAND = jn('band', 16, 7, jnBand, 2);
const JN_TAILS = jn('tails', 16, 7, jnTails, 6);
const JN_HAND = [0, 1, 2, 3].map((k) => [false, true].map((f) => jn(`hand${k}${f ? 1 : 0}`, 5, 5, jnHand(k, f), 2)));
const JN_FOOT = [false, true].map((f) => jn(`foot${f ? 1 : 0}`, 6, 4, jnFoot(f), 2));
// Its own face, a jelly-bean ninja's: narrow focused eyes under level lids with a sharp four-point glint,
// a tiny set mouth, and a plaster on its cheek from training. Box 18 x 26.
const JN_EYES = [[10.6, 10.4, -1, 1.3, 1.8], [14.4, 10.2, 1, 1.3, 1.8]];
const jnOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of JN_EYES) {
    const shut = oShut(mood, x, y, s, w, h, 0.5, '#2a2040');
    if (shut) { out.push(...shut); continue; }
    const lid = mood === 'angry' ? (px) => y + h * 0.05 + (px - x) * -s * 0.6 : mood === 'shout' ? () => y - h * 0.5 : (px) => y - h * 0.2 + (px - x) * -s * 0.2;
    out.push(...oOpen(x, y, w, h, lid, '#2a2040', '#5a4a8a'));
    const gy = Math.max(y, lid(x + w * 0.3) + 0.5);
    out.push(F(T(oCut([[x + w * 0.3, gy - 0.55], [x + w * 0.42, gy - 0.12], [x + w * 0.75, gy], [x + w * 0.42, gy + 0.12], [x + w * 0.3, gy + 0.55], [x + w * 0.18, gy + 0.12], [x - w * 0.15, gy], [x + w * 0.18, gy - 0.12]], lid), '#ffffff')));
    out.push(...oLid(x, y, w, h, lid, 0.6));
  }
  out.push(F(T(oRing(8.6, 12.6, 1.1, 0.5, 0.45, 10), '#f6dcb0')), F(T(oRing(8.6, 12.6, 0.42, 0.36, 0.45, 8), '#e0b888')));
  const [mx, my] = [12.8, 13.4];
  if (mood === 'shout') out.push(F(T([[mx - 0.9, my - 0.3], [mx + 0.9, my - 0.3], [mx, my + 1]], '#6a2a3a')));
  else if (mood === 'happy') out.push(...oLn([[mx - 0.8, my], [mx, my + 0.3], [mx + 0.8, my - 0.2]], 0.35));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx, my, 0.8, 0.3));
  else if (mood === 'dead') out.push(F(E(mx, my + 0.2, 0.35, 0.4, '#6a2a3a')));
  else out.push(...oLn([[mx - 0.6, my + 0.1], [mx + 0.6, my + 0.1]], 0.38));
  if (mood === 'hurt') out.push(...oDrop(16.4, 10.6, 0.55));
  return out;
};
const jnFace = (mood) => sm(`jn|face|${mood}`, 18, 26, () => jnOwnFace(mood));
const STAR_C = ['#ff8ab8', '#9ae6ff', '#fff3a6', '#b8f0a0'];
const jnPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: null, s: JN_FOOT[far ? 1 : 0][i], pivot: [3, 3.6], at: (S, a) => { const [dx, l] = pawStep(a.jnU ?? 0, far ? 0.5 : 0, 8, 0.5, 2.6); return [S.x + (far ? -3.4 : 3.4) + dx * a.walkW, -l * a.walkW]; } });
  return [
    { name: `tails${tag}`, parent: 'trunk', s: JN_TAILS[i], pivot: [15, 3], at: () => [-6.4, -19.4], rot: (S) => S.tails * D2R, soft: { key: 'tails', dir: [-1, 0], k: 110, c: 7, gain: 0.7, max: 22, flutter: 8, hz: 1.6 } },
    { name: `handF${tag}`, parent: 'trunk', s: (a) => JN_HAND[a.jnK ?? 0][1][i](), pivot: [2.5, 2.5], at: (S) => [-6 + S.fx, -9 - S.fy] },
    foot(1, true),
    foot(0, false),
    { name: `bean${tag}`, parent: 'trunk', s: (a) => JN_BEAN[a.jnK ?? 0][i](), pivot: [9, 25.6] },
    { name: `band${tag}`, parent: 'trunk', s: JN_BAND[i], pivot: [8, 3.5], at: () => [0.6, -19.6] },
    { name: `handN${tag}`, parent: 'trunk', s: (a) => JN_HAND[a.jnK ?? 0][0][i](), pivot: [2.5, 2.5], at: (S) => [7 + S.hx, -9 - S.hy] },
  ];
};
export const ninjaRig = makeRig({
  w: 40, h: 40, soft: true, stride: 8, recover: 0.5,
  springs: { x: [320, 20], lift: [280, 16], tilt: [240, 14], tails: [120, 8], hx: [320, 16], hy: [320, 16], fx: [260, 14], fy: [260, 14] },
  fast: ['x', 'tilt', 'hx', 'hy'],
  kick: { tilt: -220, tails: 300 },
  turnKick: { tilt: 160, tails: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.93;
    a.jnK = m.uid % 4;
    const t = a.t + a.uidOff;
    a.jnU = stepPhase(m, a, 'jn', 8);
    const lu = t % 6;
    // Ready on its toes, and every so often a quick look one way, then the other.
    const peekB = hold(lu, 2, 2.2, 2.8, 3);
    const peekF = hold(lu, 4, 4.2, 4.8, 5);
    const bounce = Math.abs(Math.sin(t * 3.6));
    const idle = { x: 0, lift: bounce * 1, tilt: -peekB * 12 + peekF * 10 + 4, tails: -48 + Math.sin(t * 2) * 6, hx: 1, hy: 2 + bounce * 0.5, fx: -1, fy: 2 };
    const s1 = Math.sin(a.jnU * TAU);
    const walk = { x: 0, lift: Math.abs(s1) * 1.4, tilt: 16, tails: -8, hx: -4, hy: 0, fx: -5, fy: 1 };
    const antic = { x: -2, lift: -1.4, tilt: -8, tails: -30, hx: -9, hy: 6, fx: 3, fy: 3 };
    const strike = { x: 4, lift: 0, tilt: 18, tails: -6, hx: 10, hy: 4, fx: -4, fy: 1 };
    return stateBlend(a, idle, walk, antic, strike);
  },
  parts: [
    { name: 'trunk', parent: null, at: (S) => [S.x, -3 - S.lift], rot: (S) => S.tilt * D2R },
    ...jnPass(false),
    ...jnPass(true),
    { name: 'face', parent: 'trunk', s: (a) => jnFace(moodOf(a)), pivot: [9, 25.6] },
  ],
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const c = STAR_C[a.jnK ?? 0];
    const [hx, hy] = at2(mat('handN'), 0, 0);
    // The sprinkle star ready in its hand, then thrown, spinning away.
    if (a.ph.antic > 0.1) liveStar(ctx, hx, hy, 2.6, a.t * 10, c, a.alpha * a.ph.antic);
    if (a.ph.since >= 0 && a.ph.since < 0.3) {
      const u = a.ph.since / 0.3;
      liveStar(ctx, hx + 4 + u * 40, hy - u * 2, 2.6, a.t * 18, c, a.alpha * (1 - u));
    }
  },
});
export function ninjaStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  return { w: 40, h: 36, res: 3, shapes: shift([
    ...put(jnTails(), [15, 3], -6.4, -22.4), ...put(jnHand(0, true)(), [2.5, 2.5], -7, -14), ...put(jnFoot(true)(), [3, 3.6], -3.4, 0), ...put(jnFoot(false)(), [3, 3.6], 3.4, 0),
    ...put(jnBean(0)(), [9, 25.6], 0, -3), ...put(jnBand(), [8, 3.5], 0.6, -22.6), ...put(jnOwnFace(fm), [9, 25.6], 0, -3), ...put(jnHand(0, false)(), [2.5, 2.5], 8, -14),
  ], 20, 35) };
}
