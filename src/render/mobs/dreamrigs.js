// The Queen's dream's three bosses (Chapter 9, 2026-11-19, the player's picks): her life in the
// human world, played back as a show. Live rigs on two-bone chibi legs, outer outline only, faces
// bare; each loose bit (a tie, a lid flap, a noodle neck) on its own spring.
//
//   mugboss       (her manager, Overtime: redrawn 2026-11-22 as the Night Manager, a human in his
//                 own module, nightmanagerrig.js)
//   noodledragon  the Cup-Noodle Dragon (the 2 a.m. store): an instant-ramen cup on stubby legs, a
//                 dragon of noodles curling up out of the broth, chopstick horns, a fish-cake swirl.
//                 idle: steam, a slow sway, a dip down for a slurp.
//   monday        Monday, the Calendar Beast (her flat): a towering calendar page, MON in red across
//                 its top, ring binders for horns, the week crossed off, a big red pen.
//                 idle: tapping the pen, crossing off a day, a stomp.

import { E, T, F, R, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, INK, fr, arcP, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, puff, sparkle } from './rigkit.js';
import { chibiLegs } from './chibilegs.js';

const smoothPts = (pts, n = 3) => {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const out = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      out.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = out;
  }
  return q;
};
const blob = (pts, c, n = 3) => T(smoothPts(pts, n), c);
const line = (pts, w, c = '#2e1c26') => stroke(pts, w, c).map(F);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
// A named cast (world/theatre.js sets m.castPose): the rig takes up that cast's own pose for the
// whole cast, acting it out (`moves[kind][2]`, a function of the time into the cast, or its
// wind-up when a move has none), then its own wind-up and blow as the cast lands. `moves[kind]`
// is [antic, strike, hold?]. Each cast reads as its own pose, so the boss itself tells you what's
// coming (2026-11-19: they all looked alike). Returns [base, antic, strike, how far into the cast
// 0..1, kind].
function castMove(m, a, moves, idle, antic, strike) {
  const mo = a.mo ?? {};
  const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
  if (m.castPose && moves[m.castPose]) mo.dreamKind = m.castPose;
  else if (!active) mo.dreamKind = null;
  const kind = mo.dreamKind;
  const mv = kind ? moves[kind] : null;
  if (!mv) return [idle, antic, strike, 0, null];
  const cast = m.cast && m.castPose ? clamp((a.now - m.cast.t0) / 0.45, 0, 1) : 0;
  const hold = typeof mv[2] === 'function' ? mv[2](m.cast ? a.now - m.cast.t0 : 0) : mv[2] ?? mv[0];
  const base = cast > 0 ? Object.fromEntries(Object.keys(idle).map((key) => [key, idle[key] + ((hold[key] ?? idle[key]) - idle[key]) * cast])) : idle;
  return [base, mv[0], mv[1], cast, kind];
}
// A rig drawn `k` times its size about its feet.
const sizedRig = (rig, k) => {
  const draw = rig.draw;
  rig.draw = (ctx, m, a) => {
    ctx.save();
    ctx.scale(k, k);
    draw(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * k);
  rig.h = Math.round(rig.h * k);
  return rig;
};
const PAPER = '#fbfaf6';
const TROUSER = ramp('#4a4a5e', { step: 8, turn: 8 });
const SHOE = '#2a2632';

// Legs in office trousers and black shoes, shared by the mug and Monday.
const thighP = (far) => () => [taper([[5, 2], [5, 8]], 9, 8.4, far ? TROUSER.sh : TROUSER.base), E(5, 8, 4.2, 4.2, far ? TROUSER.sh : TROUSER.base)];
const shinP = (far) => () => [E(5, 2, 4.2, 4.2, far ? TROUSER.sh : TROUSER.base), taper([[5, 2], [5, 7.6]], 8.4, 8, far ? TROUSER.sh : TROUSER.base)];
const footP = (far) => () => [blob([[0.4, 0.4], [9, 0.4], [13, 3], [12.6, 5.4], [0.2, 5.4]], far ? '#1a1620' : SHOE, 1), F(E(8.6, 1.8, 2, 0.8, '#5a5468'))];
// A leg part list for a rig pass, hung off `body` at the given hips.
function legParts(SP, tg, i, hips, L1, L2) {
  const leg = (far) => {
    const k = far ? 'F' : 'N';
    const j = far ? 1 : 0;
    return [
      { name: `foot${k}${tg}`, parent: `ankle${k}`, s: SP.FOOT[j][i], pivot: [4, 1], rot: (S) => -(S.tilt + S[`thigh${k}`] + S[`shin${k}`] - S[`roll${k}`]) * D2R },
      { name: `shin${k}${tg}`, parent: `knee${k}`, s: SP.SHIN[j][i], pivot: [5, 2], rot: (S) => S[`shin${k}`] * D2R },
      { name: `thigh${k}${tg}`, parent: 'bodyJ', s: SP.THIGH[j][i], pivot: [5, 2], at: () => hips[j], rot: (S) => S[`thigh${k}`] * D2R },
    ];
  };
  return { far: leg(true), near: leg(false) };
}
const jointsFor = (L1, L2) => [
  { name: 'kneeN', parent: 'thighN', at: () => [0, L1] },
  { name: 'kneeF', parent: 'thighF', at: () => [0, L1] },
  { name: 'ankleN', parent: 'shinN', at: () => [0, L2] },
  { name: 'ankleF', parent: 'shinF', at: () => [0, L2] },
];
const shadow = (r) => (ctx, m, a) => {
  ctx.globalAlpha = a.alpha * 0.22;
  ctx.fillStyle = '#1a1626';
  ctx.beginPath();
  ctx.ellipse(0, -0.6, r, 3.6, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a.alpha;
};
// A leg's still pieces, posed by a chibiLegs pose, for the stills.
function stillLeg(LEGS, P, k, far, hip, by, L1, L2) {
  const th = P[`thigh${k}`];
  const sh = P[`shin${k}`];
  const [hx, hy] = hip;
  const kx = hx - Math.sin(th * D2R) * L1;
  const ky = by + hy + Math.cos(th * D2R) * L1;
  const ax = kx - Math.sin((th + sh) * D2R) * L2;
  const ay = ky + Math.cos((th + sh) * D2R) * L2;
  return [...put(thighP(far)(), [5, 2], hx, by + hy, th), ...put(shinP(far)(), [5, 2], kx, ky, th + sh), ...put(footP(far)(), [4, 1], ax, ay, 0)];
}

// Shared drawing helpers for the bosses' own faces (once part of the Coffee Mug Boss's section).
const GOLD = ramp('#ffd36b', { step: 9, turn: 8 });
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

// =====================================================================================
// The Cup-Noodle Dragon
// =====================================================================================
const NOOD = ramp('#ffe090', { step: 8, turn: 10 });
const CUPR = ramp('#e8304a', { step: 9, turn: 8 });
const nd = pairOf('noodle');
// The cup: white, red bands top and bottom, gold lines, the broth in its rim. Box 60 x 56; its
// middle at (30, 28).
const cupP = () => [
  T([[4, 6], [56, 6], [50, 54], [10, 54]], '#ffffff'), F(T([[4, 6], [56, 6], [55, 15], [5, 15]], CUPR.base)), F(T([[9, 44], [51, 44], [50, 54], [10, 54]], CUPR.base)), crescent(30, 30, 26, 26, '#e4e0ee', { k: 0.1, a0: 100, a1: 200 }),
  ...line([[14, 24], [46, 24]], 1.6, GOLD.base), ...line([[16, 31], [44, 31]], 1.1, GOLD.base), F(E(30, 37, 5, 3, '#ff9ab8')),
  E(30, 6, 26, 4.6, '#e8c890'), E(30, 6.6, 22, 3, '#c8905a'), ...[[18, 6], [26, 7], [36, 6.4]].map(([x, y]) => F(E(x, y, 2, 0.8, NOOD.base))),
];
// The lid, peeled back and fluttering. Box 30 x 10; hinged at (2, 8).
const lidP = () => [T([[2, 8], [28, 2], [30, 5], [4, 10]], '#d8dce6'), F(T([[4, 8], [27, 3], [28, 4], [5, 9]], '#ffffff')), F(E(16, 6, 2, 1.2, CUPR.base))];
// A length of the noodle neck: a bundle of wavy strands. Box 22 x 12; from (2, 6) along +x.
const neckP = (w) => () => [taper([[2, 7], [18, 7]], w, w * 0.92, NOOD.base), ...[-0.3, 0, 0.3].map((k) => F(taper([[2, 7 + k * w], [7, 7 + k * w + 1], [12, 7 + k * w - 1], [18, 7 + k * w]], 0.8, 0.8, NOOD.sh)))];
// The dragon's head: round, a snout ahead, chopstick horns, a fish-cake swirl on the brow, noodle
// whiskers. Box 40 x 34; the neck's end at (8, 22).
// A dragon's head: round at the back, a long snout ahead with nostrils, chopstick horns swept back,
// a mane of noodles trailing down behind, a fish-cake swirl on the brow, noodle whiskers. Box 50 x
// 40; the neck's end at (10, 28).
const dHeadP = () => [
  ...[0, 1, 2, 3].map((k) => taper([[12, 10 + k * 4], [4 - k, 14 + k * 5], [-2 - k, 22 + k * 4], [0 - k, 30 + k * 2]], 3.4, 1.6, k % 2 ? NOOD.sh : NOOD.base)),
  ...line([[14, 10], [2, -2]], 2.6, '#b07a4a'), ...line([[20, 8], [12, -8]], 2.6, '#c8905a'),
  E(20, 20, 15, 13, NOOD.base), blob([[26, 13], [44, 15], [48, 22], [44, 29], [28, 30]], NOOD.base), crescent(20, 20, 15, 13, NOOD.sh, { k: 0.14, a0: 100, a1: 200 }),
  F(E(44, 18, 1.2, 1, '#c8905a')), F(E(46, 21, 1.1, 0.9, '#c8905a')), ...line([[30, 27], [46, 27]], 0.8, NOOD.deep),
  E(17, 9, 4.4, 3.8, '#ffffff'), ...line(arcP(17, 9, 2.6, 2.2, 0, 300, 10), 0.7, '#ff8ab8'),
  F(taper([[44, 26], [50, 32], [47, 38]], 1.2, 0.6, NOOD.sh)), F(taper([[40, 28], [42, 36], [38, 39]], 1.2, 0.6, NOOD.sh)),
];
// Its own face, a noodle dragon's: sly fiery eyes under heavy lids, a noodle-strand brow over each that
// curls up at the end, a long smug grin with one fang; jaws wide with both fangs to shout, a slurp of
// tongue when pleased. Box 50 x 40.
const ND_EYES = [[32, 18, 1, 3.4, 4.2], [22, 18.4, -1, 3, 3.8]];
const ND_MOUTH = '#7a2a2a';
const ndFang = (x, y, k = 1) => F(T([[x - 0.5 * k, y], [x + 0.5 * k, y], [x, y + 1.1 * k]], '#ffffff'));
const ndOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of ND_EYES) {
    // The noodle brow: a strand over the eye that curls up at its outer end.
    const drop = mood === 'angry' ? 1 : mood === 'shout' ? -0.8 : mood === 'hurt' || mood === 'dizzy' ? -0.6 : 0;
    const by = y - h * 1.25;
    const brow = [[x - s * w * 1, by + drop], [x - s * w * 0.2, by - 0.5 + drop * 0.5], [x + s * w * 0.7, by - 0.4], [x + s * w * 1.25, by - 1.2], [x + s * w * 1.1, by - 2], [x + s * w * 0.75, by - 1.6]];
    out.push(...oLn(brow, 1.5, NOOD.sh), ...oLn(brow, 0.7, NOOD.base));
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.4, w, h * 0.3, 15, 165, 8), 1));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 1));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 0.95));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.8, '#e86a20', s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.9));
    else {
      // Sly: the heavy lid slants down toward the middle; lower to glare; thrown up to roar.
      const lid = mood === 'angry' ? (px) => y - h * 0.15 + (px - x) * -s * 0.6 : mood === 'shout' ? () => -99 : (px) => y - h * 0.45 + (px - x) * -s * 0.3;
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y + h * 0.08, w * 0.84, h * 0.84), lid), '#e86a20')), F(T(oCut(oRing(x, y + h * 0.45, w * 0.64, h * 0.4), lid), '#ffc040')));
      out.push(F(T(oCut(oRing(x - s * w * 0.12, y + h * 0.12, w * (mood === 'shout' ? 0.22 : 0.34), h * (mood === 'shout' ? 0.25 : 0.4)), lid), '#3a1408')));
      out.push(F(T(oCut(oRing(x + w * 0.3, y - h * 0.05, w * 0.2, w * 0.2, 0, 8), lid), '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w * 1.02, h * 1.02, 190, 350, 10), (px) => lid(px) - 0.25), 1.15));
    }
  }
  if (mood !== 'dead') for (const [bx, by, r] of [[37.4, 22.4, 1.8], [18.6, 22.8, 1.6]]) out.push(F(E(bx, by, r, r * 0.5, '#ffa08a')));
  const [mx, my] = [36, 25];
  if (mood === 'shout') out.push(F(T([[mx - 4.4, my - 0.6], [mx + 3, my - 1.4], [mx + 2.6, my + 2.2], [mx - 3.4, my + 2.4]], ND_MOUTH)), F(E(mx - 0.6, my + 1.7, 2, 0.6, '#ff8f9a')), ndFang(mx - 2.8, my - 0.45), ndFang(mx + 1.6, my - 1.15));
  else if (mood === 'happy') out.push(...oLn([[mx - 4.4, my - 0.4], [mx - 2, my + 0.7], [mx + 0.6, my + 0.6], [mx + 2.6, my - 1]], 0.75), F(T([[mx + 1.4, my + 0.2], [mx + 3.2, my - 0.4], [mx + 3.6, my + 1], [mx + 2.6, my + 1.6], [mx + 1.6, my + 1.1]], '#ff8f9a')));
  else if (mood === 'angry') out.push(F(T([[mx - 4, my - 0.4], [mx + 2.6, my - 1], [mx + 2.2, my + 0.6], [mx - 3.4, my + 0.8]], '#ffffff')), ...oLn([[mx - 4, my - 0.4], [mx + 2.6, my - 1], [mx + 2.2, my + 0.6], [mx - 3.4, my + 0.8], [mx - 4, my - 0.4]], 0.6), ...[-2.4, -0.8, 0.8].flatMap((dx) => oLn([[mx + dx, my - 0.65 - dx * 0.08], [mx + dx, my + 0.7 - dx * 0.05]], 0.3, '#c8b8a8')));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...oWave(mx - 0.8, my, 2.4, 0.65));
  else if (mood === 'dead') out.push(...oLn([[mx - 3.6, my], [mx + 2, my - 0.6]], 0.65));
  else out.push(...oLn([[mx - 4.4, my - 0.4], [mx - 2, my + 0.6], [mx + 0.6, my + 0.5], [mx + 2.6, my - 1.1]], 0.75), ndFang(mx - 1.2, my + 0.55, 0.85));
  if (mood === 'hurt') out.push(...oDrop(39, 20, 0.95));
  return out;
};
const ndFace = (mood) => faceSprite(`noodle|face|${mood}`, 50, 40, () => ndOwnFace(mood));
// Stubby legs in red socks.
const nThighP = (far) => () => [taper([[5, 2], [5, 8]], 9, 8.4, far ? '#e4e0ee' : '#ffffff'), E(5, 8, 4.2, 4.2, far ? '#e4e0ee' : '#ffffff')];
const nShinP = (far) => () => [E(5, 2, 4.2, 4.2, far ? CUPR.sh : CUPR.base), taper([[5, 2], [5, 7.6]], 8.4, 8, far ? CUPR.sh : CUPR.base)];
const NSP = {
  CUP: nd('cup', 60, 56, cupP, 2), LID: nd('lid', 30, 10, lidP, 2), HEAD: nd('head', 50, 40, dHeadP, 9), NECK: [12, 11, 10].map((w, k) => nd(`neck${k}`, 22, 14, neckP(w), 3)),
  THIGH: [false, true].map((f) => nd(`thigh${f ? 1 : 0}`, 10, 12, nThighP(f), 2)), SHIN: [false, true].map((f) => nd(`shin${f ? 1 : 0}`, 10, 11, nShinP(f), 2)), FOOT: [false, true].map((f) => nd(`foot${f ? 1 : 0}`, 14, 6, footP(f), 2)),
};
const N_BODY = 42;
const N_L1 = 6;
const N_L2 = 6;
const N_HIPS = [[10, 24], [-10, 24]];
const N_FEET = [11, -10];
const N_LEGS = chibiLegs({ bodyY: N_BODY, l1: N_L1, l2: N_L2, sole: 5, hips: N_HIPS, feet: N_FEET });
// His casts: steam (rearing up tall, then a stamp), the whip (coiled far back, then flung low
// ahead), hot broth (head thrown back, then a spit), the chopstick snap (head down and forward,
// then a snap), the timer (tucked down in his cup, head ticking side to side, then up he rears).
const ndSt = (o, fN = [0, 0], fF = [0, 0]) => ({ x: 0, lift: 0, tilt: 0, n0: -70, n1: -34, n2: 62, hd: 40, ...o, ...N_LEGS.at(o.lift ?? 0, o.tilt ?? 0, [N_FEET[0] + fN[0], fN[1]], [N_FEET[1] + fF[0], fF[1]]) });
// Held through each cast: the steam burst, reared up tall on his toes, neck straight up and
// shuddering as the pressure builds; the whip, coiled far back, swaying to strike; hot broth, head
// thrown right back, gargling; the chopstick snap, head down low and thrust at you, jaws chomping.
const ND_MOVES = {
  steam: [ndSt({ lift: 2, tilt: -4, n0: -92, n1: 2, n2: -2, hd: 18 }), ndSt({ lift: -1, tilt: 4, n0: -78, n1: -12, n2: 24, hd: 50 }, [2, 5]),
    (t) => ndSt({ lift: 3, tilt: -3, n0: -96, n1: 4 + Math.sin(t * 13) * 4, n2: -6 + Math.sin(t * 13 + 1) * 4, hd: 6 + Math.sin(t * 13 + 2) * 5 })],
  whip: [ndSt({ x: -3, tilt: -8, n0: -122, n1: -40, n2: 30, hd: 10 }), ndSt({ x: 6, tilt: 10, n0: -20, n1: 22, n2: 8, hd: 70 }, [4, 0], [-2, 0]),
    (t) => ndSt({ tilt: -10, n0: -128, n1: -46 + Math.sin(t * 4.6) * 8, n2: 36 + Math.sin(t * 4.6 - 0.8) * 10, hd: 8 })],
  spit: [ndSt({ x: -2, tilt: -6, n0: -102, n1: -22, n2: 12, hd: -4 }), ndSt({ x: 3, tilt: 6, n0: -68, n1: -8, n2: 26, hd: 34 }),
    (t) => ndSt({ tilt: -12, n0: -114, n1: -44, n2: -14, hd: -44 + Math.sin(t * 8) * 10 })],
  snap: [ndSt({ tilt: 4, n0: -58, n1: -58, n2: 84, hd: 22 }), ndSt({ x: 6, tilt: 8, n0: -40, n1: 12, n2: 20, hd: 52 }, [4, 0]),
    (t) => ndSt({ tilt: 12, n0: -36, n1: 34, n2: 24, hd: 68 + Math.max(0, Math.sin(t * 7)) * 14 })],
  timer: [ndSt({ lift: -2, n0: -82, n1: -62, n2: 104, hd: 40 }), ndSt({ lift: 3, tilt: -4, n0: -88, n1: 4, n2: -4, hd: 20 }, [0, 4], [0, 4])],
};
const ND_MOOD = { steam: 'angry', whip: 'angry', spit: 'shout', snap: 'angry', timer: 'happy' };
export const noodleRig = makeRig({
  w: 120, h: 140, soft: true, stride: 1e9, recover: 0.6,
  springs: { x: [220, 16], lift: [220, 15], tilt: [160, 12], n0: [120, 9], n1: [110, 8], n2: [100, 7], hd: [140, 9], thighN: [340, 21], thighF: [340, 21], shinN: [340, 21], shinF: [340, 21], rollN: [320, 20], rollF: [320, 20] },
  fast: ['x', 'n0', 'n1', 'n2', 'hd', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -100, n1: 200, hd: -260 },
  turnKick: { n1: 160, hd: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'nd2', 14);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 9) * 9;
    const busy = active || (m.cast && m.castPose) || walkW > 0.05 || m.cine;
    // A slow S-sway; now and then a dip down into the broth for a slurp.
    const slurp = busy ? 0 : hold(lu, 4, 4.6, 5.8, 6.6);
    const s1 = Math.sin(t * 1.2);
    const s2 = Math.sin(t * 1.2 - 0.9);
    const idle = { x: 0, lift: 0, tilt: s1 * 1.5, n0: -70 + s1 * 5 + slurp * 8, n1: -34 + 10 * s2 + slurp * 100, n2: 62 - 10 * s1 + slurp * 60, hd: 40 + s2 * 6 + slurp * 50, ...N_LEGS.at(0, s1 * 1.5) };
    const steps = [pawStep(u, 0, 14, 0.6, 3), pawStep(u, 0.5, 14, 0.6, 3)];
    const sw = Math.sin(u * TAU);
    const liftW = Math.abs(Math.cos(u * TAU)) * 1.2;
    const walk = { x: 0, lift: liftW, tilt: 2 + sw * 5, n0: -66 + sw * 6, n1: -30 - sw * 10, n2: 56 + sw * 10, hd: 36, ...N_LEGS.at(liftW, 2 + sw * 5, [N_FEET[0] + steps[0][0], steps[0][1]], [N_FEET[1] + steps[1][0], steps[1][1]]) };
    // A lunge: the neck coiled back, then flung out ahead, jaws wide.
    const antic = { x: -2, lift: 0, tilt: -6, n0: -96, n1: -50, n2: 40, hd: 20, ...N_LEGS.at(0, -6) };
    const strike = { x: 6, lift: 0, tilt: 8, n0: -40, n1: 6, n2: 10, hd: 60, ...N_LEGS.at(0, 8, [N_FEET[0] + 4, 0], [N_FEET[1] - 2, 0]) };
    const [base0, an, st, cast, kind] = castMove(m, a, ND_MOVES, idle, antic, strike);
    // (Waiting out his three minutes, his head ticks side to side like a clock.)
    const tick = kind === 'timer' ? Math.sin(a.now * TAU) * cast : 0;
    const base = tick ? { ...base0, hd: base0.hd + tick * 14, tilt: base0.tilt + tick * 3 } : base0;
    const S = stateBlend(a, base, walk, an, st);
    if (m.hp <= 0) Object.assign(S, { tilt: -20, n0: -20, n1: 50, n2: 40, hd: 90, ...N_LEGS.at(-3, -20, [N_FEET[0] + 10, 6], [N_FEET[1] + 6, 6]) });
    a.ndSlurp = slurp;
    a.ndMood = m.hp <= 0 ? 'dizzy' : moodOf(a, cast > 0 ? ND_MOOD[kind] : slurp > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -N_BODY - S.lift], rot: (S) => S.tilt * D2R },
    ...jointsFor(N_L1, N_L2),
    { name: 'nk0', parent: 'bodyJ', at: () => [-2, -22], rot: (S) => S.n0 * D2R },
    { name: 'nk1', parent: 'nk0', at: () => [15, 0], rot: (S) => S.n1 * D2R },
    { name: 'nk2', parent: 'nk1', at: () => [15, 0], rot: (S) => S.n2 * D2R },
    // (The head keeps itself upright on the end of the neck: `hd` 40 is level.)
    { name: 'hdJ', parent: 'nk2', at: () => [14, 0], rot: (S) => (S.hd - 40 - S.n0 - S.n1 - S.n2) * D2R },
    ...[0, 1].flatMap((i) => {
      const tg = i ? 'b' : '';
      const L = legParts(NSP, tg, i, N_HIPS, N_L1, N_L2);
      return [
        { name: `lid${tg}`, parent: 'bodyJ', s: NSP.LID[i], pivot: [2, 8], at: () => [-26, -24], rot: () => -30 * D2R, soft: { key: 'lid', dir: [10, -4], k: 120, c: 6, gain: 0.8, turn: 0.7, max: 28, flutter: 8, hz: 1.4 } },
        ...L.far, ...L.near,
        { name: `n0${tg}`, parent: 'nk0', s: NSP.NECK[0][i], pivot: [2, 7] },
        { name: `n1${tg}`, parent: 'nk1', s: NSP.NECK[1][i], pivot: [2, 7] },
        { name: `n2${tg}`, parent: 'nk2', s: NSP.NECK[2][i], pivot: [2, 7] },
        { name: `cup${tg}`, parent: 'bodyJ', s: NSP.CUP[i], pivot: [30, 28] },
        { name: `head${tg}`, parent: 'hdJ', s: NSP.HEAD[i], pivot: [10, 28] },
        ...(i ? [{ name: 'face', parent: 'hdJ', s: (a) => ndFace(a.ndMood ?? 'idle'), pivot: [10, 28] }] : []),
      ];
    }),
  ],
  under: shadow(28),
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Steam off the broth, thicker in a slurp.
    const B = mat('bodyJ');
    const n = 3 + Math.round(a.ndSlurp * 3);
    for (let k = 0; k < n; k++) {
      const u = fr(a.now * 0.5 + k / n);
      const [x, y] = at2(B, -14 + k * 9 + Math.sin(u * 5 + k) * 3, -24 - u * 26);
      puff(ctx, a, x, y, 2.4 + u * 4, (1 - u) * 0.4, '255,255,255');
    }
  },
});
export function noodleStill(pose, f, mood) {
  const by = -N_BODY;
  const P = N_LEGS.at(0, 0);
  const a0 = -70;
  const a1 = a0 - 34;
  const a2 = a1 + 62;
  const p0 = [-2, by - 22];
  const p1 = [p0[0] + Math.cos(a0 * D2R) * 15, p0[1] + Math.sin(a0 * D2R) * 15];
  const p2 = [p1[0] + Math.cos(a1 * D2R) * 15, p1[1] + Math.sin(a1 * D2R) * 15];
  const p3 = [p2[0] + Math.cos(a2 * D2R) * 14, p2[1] + Math.sin(a2 * D2R) * 14];
  return { w: 120, h: 140, res: 2, shapes: shift([
    ...put(lidP(), [2, 8], -26, by - 24, -30), ...stillLeg(N_LEGS, P, 'F', true, N_HIPS[1], by, N_L1, N_L2), ...stillLeg(N_LEGS, P, 'N', false, N_HIPS[0], by, N_L1, N_L2),
    ...put(neckP(12)(), [2, 7], p0[0], p0[1], a0), ...put(neckP(11)(), [2, 7], p1[0], p1[1], a1), ...put(neckP(10)(), [2, 7], p2[0], p2[1], a2),
    ...put(cupP(), [30, 28], 0, by), ...put(dHeadP(), [10, 28], p3[0], p3[1], 0), ...put(ndOwnFace(MOODS.has(mood) ? mood : 'idle'), [10, 28], p3[0], p3[1], 0),
  ], 60, 136) };
}

// =====================================================================================
// Monday, the Calendar Beast
// =====================================================================================
const CAL = ramp('#ffffff', { step: 6, turn: 8 });
const RED = ramp('#e8304a', { step: 9, turn: 8 });
const mo = pairOf('monday');
// The page: tall and white, the red header (MON is painted on live, so it reads the right way
// round whichever way Monday faces: monLetters), ring binders for horns, the week crossed off.
// Box 76 x 96; its middle at (38, 50).
const pageP = () => {
  const out = [];
  for (const x of [18, 38, 58]) out.push(E(x, 4, 4.4, 6, '#6a6a7a'), F(E(x, 4, 2.4, 4.2, '#ffffff')));
  out.push(blob([[4, 8], [72, 8], [72, 92], [68, 96], [8, 96], [4, 92]], CAL.base, 1), F(R(4, 8, 68, 20, RED.base)), F(R(4, 8, 68, 3, RED.hi)), crescent(38, 52, 34, 44, '#e4e0ee', { k: 0.08, a0: 100, a1: 200 }));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    const x = 12 + c * 11;
    const y = 62 + r * 10;
    if (r === 2 && c > 1) continue;
    out.push(...line([[x, y], [x + 6, y + 6]], 1, RED.base), ...line([[x + 6, y], [x, y + 6]], 1, RED.base));
  }
  out.push(F(T([[72, 80], [72, 92], [62, 96]], '#e4e0ee')));
  return out;
};
// (The still, never mirrored, has them in the picture.)
const lettersP = () => [...line([[13, 24], [13, 13], [18, 19.6], [23, 13], [23, 24]], 2, '#ffffff'), ...line(arcP(34, 18.6, 5, 5.6, 0, 360, 16), 2, '#ffffff'), ...line([[45, 24], [45, 13], [53, 24], [53, 13]], 2, '#ffffff')];
// MON across the header, about the page's middle (38, 50); never mirrored.
function monLetters(ctx, a) {
  if (a.flip) ctx.scale(-1, 1);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const pts of [[[13, 24], [13, 13], [18, 19.6], [23, 13], [23, 24]], [[45, 24], [45, 13], [53, 24], [53, 13]]]) pts.forEach(([x, y], k) => (k ? ctx.lineTo(x - 38, y - 50) : ctx.moveTo(x - 38, y - 50)));
  ctx.moveTo(34 - 38 + 5, 18.6 - 50);
  ctx.ellipse(34 - 38, 18.6 - 50, 5, 5.6, 0, 0, Math.PI * 2);
  ctx.stroke();
}
// Its own face, Monday's dread: droopy tired lids sagging at the corners over small red eyes, the near eye
// circled in red marker like a date nobody wants, a wobbly sigh for a mouth and a stress drop at its
// temple; it groans "UGH" with its teeth showing to shout. (Its worried brows are drawn on their own.)
// Box 76 x 96.
const MON_EYES = [[46, 42, 1, 3.8, 4.6], [31, 42.4, -1, 3.4, 4.2]];
const MON_MOUTH = '#6a1a2a';
const monOwnFace = (mood) => {
  const out = [];
  for (const [x, y, s, w, h] of MON_EYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...oLn(oArc(x, y + 0.6, w, h * 0.3, 15, 165, 8), 1.05));
    else if (mood === 'happy') out.push(...oLn(oArc(x, y + h * 0.35, w, h * 0.7, 200, 340, 8), 1.05));
    else if (mood === 'hurt') out.push(...oSquint(x, y, s, w * 0.8, 1));
    else if (mood === 'dizzy') out.push(...oSpiral(x, y, w, 0.85, RED.base, s));
    else if (mood === 'dead') out.push(...oX(x, y, w, h, 0.95));
    else {
      // Droopy: the lid sags toward the outer corner; slammed level to glare; up when it groans.
      const lid = mood === 'angry' ? (px) => y - h * 0.3 + (px - x) * -s * 0.5 : mood === 'shout' ? () => -99 : (px) => y - h * 0.35 + (px - x) * s * 0.28;
      const ir = w * (mood === 'shout' ? 0.3 : 0.42);
      out.push(F(T(oCut(oRing(x, y, w, h), lid), INK)), F(T(oCut(oRing(x, y, w - 0.8, h - 0.8), lid), '#ffffff')));
      out.push(F(T(oCut(oRing(x, y + h * 0.18, ir, ir * 1.08), lid), '#c8203a')), F(T(oCut(oRing(x, y + h * 0.18, ir * 0.45, ir * 0.48), lid), INK)), F(T(oCut(oRing(x + ir * 0.4, y + h * 0.18 - ir * 0.45, ir * 0.28, ir * 0.28, 0, 8), lid), '#ffffff')));
      out.push(...oLn(oCut(oArc(x, y, w, h, 190, 350, 10), (px) => lid(px) - 0.3), 1.25));
    }
    // The near eye circled in red marker.
    if (s > 0) out.push(...oLn(oArc(x + 0.3, y + 0.2, w * 1.75, h * 1.45, -60, 268, 18), 0.75, RED.base));
  }
  if (mood === 'idle' || mood === 'blink' || mood === 'angry') out.push(...oDrop(54.6, 37, 1.1));
  const [mx, my] = [40, 52];
  if (mood === 'shout') out.push(F(T([[mx - 3.6, my - 1.6], [mx + 3.6, my - 1.6], [mx + 3.2, my + 2.6], [mx - 3.2, my + 2.6]], INK)), F(T([[mx - 3, my - 1], [mx + 3, my - 1], [mx + 2.7, my + 2], [mx - 2.7, my + 2]], MON_MOUTH)), F(T([[mx - 3, my - 1], [mx + 3, my - 1], [mx + 2.9, my], [mx - 2.9, my]], '#ffffff')), F(E(mx, my + 1.6, 1.8, 0.5, '#ff8f9a')));
  else if (mood === 'happy') out.push(F(T(oArc(mx, my - 0.6, 2.4, 2.1, 0, 180, 8), MON_MOUTH)), F(E(mx, my + 0.8, 1.2, 0.5, '#ff8f9a')));
  else if (mood === 'angry') out.push(...oLn([[mx - 3, my + 0.8], [mx - 1.5, my - 0.2], [mx, my + 0.6], [mx + 1.5, my - 0.2], [mx + 3, my + 0.8]], 0.85));
  else if (mood === 'dead') out.push(...oLn([[mx - 2.4, my], [mx + 2.4, my]], 0.85));
  else if (mood === 'sleep') out.push(F(E(mx, my + 0.4, 1, 1.2, MON_MOUTH)));
  else out.push(...oLn(Array.from({ length: 9 }, (_, i) => [mx - 3.2 + i * 0.8, my + Math.sin(i * 1.1) * 0.45 + (i === 0 || i === 8 ? 0.4 : 0)]), 0.8));
  if (mood === 'hurt') out.push(...oDrop(54.6, 38, 1.2));
  return out;
};
const monFace = (mood) => faceSprite(`monday|face|${mood}`, 76, 96, () => monOwnFace(mood));
// Its brows: two thick strokes, always a little cross. Box 76 x 96 (over the face).
const browsP = () => [...line([[42, 34], [52, 37]], 2), ...line([[35, 34.6], [26, 37]], 2)];
// An arm: a white shirt sleeve, a grey cuff, a hand. Box 30 x 12; the shoulder at (3, 6).
const mArmP = (far) => () => [taper([[3, 6], [18, 6]], 7, 6.4, far ? '#e4e0ee' : '#ffffff'), R(17, 2.6, 4, 7, far ? '#5a5a6e' : '#6a6a7e'), E(24, 6, 4, 3.8, far ? '#e8d8c8' : '#fff0e6')];
// The big red pen. Box 8 x 40; held at (4, 30).
const penP = () => [R(2, 4, 4, 30, RED.base), F(R(2, 4, 1.4, 30, RED.hi)), T([[2, 34], [6, 34], [4, 40]], '#f4e0c8'), F(T([[3.4, 37.6], [4.6, 37.6], [4, 40]], '#2a2a3a')), R(1.4, 0, 5.2, 5, '#3a3a4a'), F(R(5, 6, 1.6, 10, '#c8ccd8'))];
const MOSP = {
  PAGE: mo('page', 76, 96, pageP, 7), ARM: [false, true].map((f) => mo(`arm${f ? 1 : 0}`, 30, 12, mArmP(f), 2)), PEN: mo('pen', 8, 40, penP, 2),
  THIGH: [false, true].map((f) => mo(`thigh${f ? 1 : 0}`, 10, 12, thighP(f), 2)), SHIN: [false, true].map((f) => mo(`shin${f ? 1 : 0}`, 10, 11, shinP(f), 2)), FOOT: [false, true].map((f) => mo(`foot${f ? 1 : 0}`, 14, 6, footP(f), 2)),
};
const D_BODY = 66;
const D_L1 = 8;
const D_L2 = 8;
const D_HIPS = [[14, 44], [-14, 44]];
const D_FEET = [15, -14];
const D_LEGS = chibiLegs({ bodyY: D_BODY, l1: D_L1, l2: D_L2, sole: 5, hips: D_HIPS, feet: D_FEET });
// Its casts: the email avalanche (arms flung up, then down), the red pen (raised high, then
// stabbed down ahead), the alarm clock (arms up, shaking, then a stomp), meeting invites (arms
// spread wide, then swept in), the deadline (pen pointed up at the clock on tiptoe, then slammed
// down). And the Queen's "five more minutes" (the scene theatre_monday_end, `mood: 'crumple'`):
// it sags, pen dropped, wobbling.
const monSt = (o, fN = [0, 0], fF = [0, 0]) => ({ x: 0, lift: 0, tilt: 0, armN: 40, armF: 140, pen: -20, ...o, ...D_LEGS.at(o.lift ?? 0, o.tilt ?? 0, [D_FEET[0] + fN[0], fN[1]], [D_FEET[1] + fF[0], fF[1]]) });
// Held through each cast (arms held out where they show past the page): the email avalanche,
// leaning in and typing frantically, both hands pumping; the red pen, crouched and leaning back
// with the pen raised high behind him; the alarm clock, jumping on the spot, arms flung up and out
// in a V, shaking; meeting invites, arms flung wide, beckoning everyone in; the deadline,
// stretched tall on tiptoe, the pen pointed straight up.
const MON_MOVES = {
  email: [monSt({ lift: 3, tilt: -6, armN: 176, armF: -86, pen: -30 }), monSt({ x: 4, tilt: 8, armN: 120, armF: 60, pen: 20 }, [4, 0]),
    (t) => monSt({ lift: 1, tilt: 9, armN: 96 + Math.sin(t * 12) * 28, armF: 172 - Math.sin(t * 12) * 28, pen: -24 })],
  pen: [monSt({ x: -3, lift: 3, tilt: -10, armN: 176, armF: 160, pen: -80 }), monSt({ x: 10, tilt: 14, armN: 30, armF: 120, pen: 80 }, [8, 0], [-2, 0]),
    (t) => monSt({ lift: -3, tilt: -15, armN: 198 + Math.sin(t * 13) * 4, armF: -46, pen: -104 + Math.sin(t * 13 + 1) * 5 })],
  alarm: [monSt({ lift: 2, tilt: -4, armN: 160, armF: -70, pen: -40 }), monSt({ lift: -2, tilt: 4, armN: 90, armF: 100, pen: 10 }, [0, 0], [2, 0]),
    (t) => monSt({ lift: 2 + Math.abs(Math.sin(t * 6.5)) * 9, tilt: Math.sin(t * 19) * 4, armN: 132 + Math.sin(t * 23) * 10, armF: -40 + Math.sin(t * 23 + 1) * 10, pen: -30 })],
  invite: [monSt({ tilt: -2, armN: 100, armF: 10, pen: -10 }), monSt({ x: 4, tilt: 6, armN: 60, armF: 150, pen: 30 }),
    (t) => monSt({ tilt: -3, armN: 104 + Math.sin(t * 3.4) * 22, armF: 8 + Math.sin(t * 3.4) * 10, pen: -6 })],
  deadline: [monSt({ lift: 5, tilt: -8, armN: 180, armF: 150, pen: -10 }, [0, 3], [0, 3]), monSt({ x: 6, lift: -3, tilt: 16, armN: 20, armF: 100, pen: 70 }, [6, 0], [-2, 0]),
    (t) => monSt({ lift: 6 + Math.sin(t * 5) * 1.2, tilt: -6, armN: 184, armF: 150, pen: -10 }, [0, 3], [0, 3])],
};
const MON_MOOD = { email: 'angry', pen: 'angry', alarm: 'shout', invite: 'happy', deadline: 'shout' };
const monCrumple = (t) => monSt({ lift: -6, tilt: -16 + Math.sin(t * 2.6) * 3, armN: 8, armF: 96, pen: 110 }, [10, 4], [8, 4]);
export const mondayRig = makeRig({
  w: 150, h: 170, soft: true, stride: 1e9, recover: 0.7,
  springs: { x: [200, 15], lift: [200, 14], tilt: [140, 11], armN: [220, 13], armF: [200, 12], pen: [240, 14], thighN: [320, 20], thighF: [320, 20], shinN: [320, 20], shinF: [320, 20], rollN: [300, 19], rollF: [300, 19] },
  fast: ['x', 'armN', 'pen', 'thighN', 'thighF', 'shinN', 'shinF'],
  kick: { tilt: -90 },
  turnKick: { tilt: 60 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.3;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'mon2', 22);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 11) * 11;
    const busy = active || (m.cast && m.castPose) || walkW > 0.05 || m.cine;
    // Tapping the pen; crossing off another day; a stomp.
    const cross = busy ? 0 : hold(lu, 3, 3.5, 5, 5.5);
    const stomp = busy ? 0 : hold(lu, 7.5, 7.8, 8.6, 9);
    const tapP = busy ? 0 : Math.max(0, Math.sin(t * 6)) * (1 - cross);
    const sway = Math.sin(t * 1.1);
    const stompUp = stomp * Math.max(0, Math.sin(t * 7)) * 6;
    const idle = { x: 0, lift: 0, tilt: sway * 1.5, armN: 40 + tapP * 12 + cross * 70 + Math.sin(t * 14) * cross * 10, armF: 140 + sway * 4, pen: -20 + cross * 30, ...D_LEGS.at(0, sway * 1.5, [D_FEET[0], stompUp], [D_FEET[1], 0]) };
    // A heavy stride, leaning into it.
    const steps = [pawStep(u, 0, 22, 0.62, 5), pawStep(u, 0.5, 22, 0.62, 5)];
    const sw = Math.sin(u * TAU);
    const liftW = Math.abs(Math.cos(u * TAU)) * 1.6;
    const walk = { x: 0, lift: liftW, tilt: 4 + sw * 2, armN: 40 + sw * 20, armF: 130 - sw * 20, pen: -10, ...D_LEGS.at(liftW, 4 + sw * 2, [D_FEET[0] + steps[0][0], steps[0][1]], [D_FEET[1] + steps[1][0], steps[1][1]]) };
    // The pen raised high, then stabbed down ahead.
    const antic = { x: -3, lift: 2, tilt: -8, armN: 150, armF: 160, pen: -60, ...D_LEGS.at(2, -8) };
    const strike = { x: 8, lift: 0, tilt: 10, armN: 10, armF: 120, pen: 60, ...D_LEGS.at(0, 10, [D_FEET[0] + 6, 0], [D_FEET[1] - 2, 0]) };
    const [base, an, st, cast, kind] = castMove(m, a, MON_MOVES, idle, antic, strike);
    const crumple = m.cine?.mood === 'crumple';
    const S = crumple ? monCrumple(t) : stateBlend(a, base, walk, an, st);
    if (m.hp <= 0) Object.assign(S, { lift: -6, tilt: -24, armN: 170, armF: 170, pen: 90, ...D_LEGS.at(-6, -24, [D_FEET[0] + 14, 6], [D_FEET[1] + 10, 8]) });
    a.monMood = m.hp <= 0 || crumple ? 'dizzy' : moodOf(a, cast > 0 ? MON_MOOD[kind] : stomp > 0.4 ? 'angry' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -D_BODY - S.lift], rot: (S) => S.tilt * D2R },
    ...jointsFor(D_L1, D_L2),
    ...[0, 1].flatMap((i) => {
      const tg = i ? 'b' : '';
      const L = legParts(MOSP, tg, i, D_HIPS, D_L1, D_L2);
      return [
        { name: `armF${tg}`, parent: 'bodyJ', s: MOSP.ARM[1][i], pivot: [3, 6], at: () => [-30, 8], rot: (S) => (180 - S.armF) * D2R },
        ...L.far, ...L.near,
        { name: `page${tg}`, parent: 'bodyJ', s: MOSP.PAGE[i], pivot: [38, 50], ...(i ? { paint: monLetters } : {}) },
        ...(i ? [{ name: 'face', parent: 'bodyJ', s: (a) => monFace(a.monMood ?? 'idle'), pivot: [38, 50] }, { name: 'brows', parent: 'bodyJ', s: () => faceSprite('monday|brows', 76, 96, browsP), pivot: [38, 50] }] : []),
        { name: `armN${tg}`, parent: 'bodyJ', s: MOSP.ARM[0][i], pivot: [3, 6], at: () => [30, 8], rot: (S) => -S.armN * D2R + Math.PI / 2 },
        { name: `pen${tg}`, parent: 'armN', s: MOSP.PEN[i], pivot: [4, 30], at: () => [24, 6], rot: (S) => (S.pen + S.armN - 90) * D2R },
      ];
    }),
  ],
  under: shadow(38),
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    // Now and then a page tears off and flutters away.
    const B = mat('bodyJ');
    for (let k = 0; k < 2; k++) {
      const u = fr(a.now * 0.18 + k * 0.5 + (m.uid % 5) * 0.1);
      if (u > 0.85) continue;
      const [x, y] = at2(B, -20 + k * 30 + u * 40 * (k ? 1 : -1), -40 - u * 50 + Math.sin(u * 9 + k) * 6);
      ctx.save();
      ctx.globalAlpha = a.alpha * (1 - u);
      ctx.translate(x, y);
      ctx.rotate(u * 6 + k);
      ctx.fillStyle = '#fbfaf6';
      ctx.fillRect(-4, -5, 8, 10);
      ctx.fillStyle = '#e8304a';
      ctx.fillRect(-4, -5, 8, 2);
      ctx.restore();
    }
  },
});
export function mondayStill(pose, f, mood) {
  const by = -D_BODY;
  const P = D_LEGS.at(0, 0);
  return { w: 150, h: 170, res: 2, shapes: shift([
    ...put(mArmP(true)(), [3, 6], -30, by + 8, 130), ...stillLeg(D_LEGS, P, 'F', true, D_HIPS[1], by, D_L1, D_L2), ...stillLeg(D_LEGS, P, 'N', false, D_HIPS[0], by, D_L1, D_L2),
    ...put(pageP(), [38, 50], 0, by), ...put(lettersP(), [38, 50], 0, by), ...put(monOwnFace(MOODS.has(mood) ? mood : 'idle'), [38, 50], 0, by), ...put(browsP(), [38, 50], 0, by),
    ...put(mArmP(false)(), [3, 6], 30, by + 8, 40), ...put(penP(), [4, 30], 30 + 24 * Math.cos(40 * D2R), by + 8 + 24 * Math.sin(40 * D2R), -20),
  ], 75, 166) };
}
