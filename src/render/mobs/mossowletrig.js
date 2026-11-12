// The Moss Owlet (new for Mossy Woods' branches, 2026-11-12, built from scratch): a round little
// owlet in mossy green feathers, facing you with a big pale facial disc, huge amber eyes and two
// tufts of moss for ear tufts. A live puppet on the boss rig (rig.js): every part drawn once and
// placed each frame, the loose bits on springs, nothing squashed or stretched, every part filtered
// smoothly.
//
// Nothing else in the cast moves like it:
//   walk    it never walks: it spreads its wings and glides low along the branch, rocking with
//           slow soft wingbeats (one per so many px flown, on an eased speed), feet tucked up; when
//           it stops it settles back down and folds its wings with a little ruffle.
//   idle    it breathes, tilts its whole head to one side in curiosity and back, blinks slowly,
//           and now and then fluffs and shakes out its feathers.
//   attack  it puffs up, wings raised high, then swoops in talons first.
//   hit     knocked back on its lean, wings flaring and tufts flicking.
// `mossowletStill(pose, f, mood)` gives the still pictures (portraits, the book) from the same shapes.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, makeRig, stateBlend, spring, smooth, clamp, TAU } from './rig.js';
import { sprite } from '../pixel.js';

const FEATH = ramp('#6fae6a', { step: 9, turn: 12, sat: -6 });
const BREAST = ramp('#eef2d2', { step: 7, turn: 16 });
const DISC = '#f6f4e0';
const BAR = '#9ec28e';
const BEAK = '#f2b84e';
const TALON = '#f0b24a';
const INK = '#2a2632';
const D2R = Math.PI / 180;

// ---------- Shapes ----------

// The body: a round egg of mossy feathers with a pale breast, soft V-shaped bars across it, and a
// fluffy fringe at the bottom. Box 20 x 18; the bottom middle at (10, 17).
const bodyShapes = () => {
  const out = [E(10, 9.6, 9, 8.2, FEATH.base), E(10, 11, 6.2, 6.4, BREAST.base)];
  for (const [y, w] of [[8.6, 3.2], [11.2, 3.8], [13.8, 3.2]]) {
    for (const dx of [-2.6, 2.6]) out.push(...stroke([[10 + dx - w * 0.5, y - 0.6], [10 + dx, y + 0.4], [10 + dx + w * 0.5, y - 0.6]], 0.55, BAR));
  }
  for (let i = 0; i < 5; i++) out.push(E(4.4 + i * 2.8, 16.4, 1.7, 1.2, i % 2 ? BREAST.base : BREAST.sh));
  out.push(crescent(10, 9.6, 9, 8.2, FEATH.sh, { k: 0.2, a0: 20, a1: 160 }));
  return out;
};
// The head: big and round, with a pale facial disc (two soft rings meeting at the beak) and a
// darker crown. Box 22 x 17; the neck at (11, 14), the middle of the head 5.4 above it.
const headShapes = () => [
  E(11, 8.6, 10, 7.8, FEATH.base),
  E(7, 9.2, 4.8, 4.6, DISC),
  E(15, 9.2, 4.8, 4.6, DISC),
  F(E(11, 11.6, 2.4, 2.4, DISC)),
  crescent(11, 8.6, 10, 7.8, FEATH.sh, { k: 0.18, a0: 30, a1: 150 }),
  shine(11, 8.6, 10, 7.8, FEATH.hi, 0, 0.7),
  // A few speckles on its crown.
  ...[[7, 3.4], [11, 2.6], [15, 3.4], [9, 4.6], [13, 4.6]].map(([x, y]) => F(E(x, y, 0.7, 0.55, FEATH.hi))),
];
// The face (unoutlined, over the disc): huge amber eyes, a small hooked beak between them, rosy
// cheeks. Box 18 x 11, centre (9, 5.5).
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout']);
const faceShapes = (mood) => {
  const out = [];
  if (mood === 'dead') out.push(...deadEye(5, 5, 1.6, { c: INK, th: 0.6 }), ...deadEye(13, 5, 1.6, { c: INK, th: 0.6 }));
  else {
    const so = { iris: '#e89a2a', ink: INK, lid: 0, mood: mood === 'shout' ? 'angry' : mood };
    out.push(...simpleEye(5, 5, { ...so, s: -1, w: 2.6, h: 2.9 }), ...simpleEye(13, 5, { ...so, s: 1, w: 2.6, h: 2.9 }));
    out.push(F(E(2.6, 8.6, 1.3, 0.6, '#ffa8b8')), F(E(15.4, 8.6, 1.3, 0.6, '#ffa8b8')));
  }
  if (mood === 'shout') out.push(F(T([[7.8, 6.6], [10.2, 6.6], [9.6, 9.6], [8.4, 9.6]], '#c86a2a')), F(T([[8.2, 8], [9.8, 8], [9.4, 9.4], [8.6, 9.4]], '#8a3a3a')));
  else out.push(F(T([[7.8, 6.6], [10.2, 6.6], [9.4, 9.2], [9, 9.6], [8.6, 9.2]], BEAK)), F(T([[8.2, 6.8], [9, 6.8], [8.8, 7.8]], '#ffe0a0')));
  if (mood === 'hurt') out.push(...tear(13.6, 7, 0.8, { type: 'stream', len: 2 }));
    return out;
};
// An ear tuft of moss: three little leafy feathers from its base at (3, 6.6). Box 7 x 7.
const tuftShapes = (side) => {
  const s = side;
  return [
    E(3 - s * 1.6, 3.4, 1.3, 2.6, FEATH.sh),
    E(3, 2.6, 1.4, 3, '#7cc66a'),
    E(3 + s * 1.5, 3.8, 1.2, 2.2, '#8ed27a'),
    F(E(3, 1.8, 0.6, 1.2, '#b4e6a0')),
  ];
};
// A wing: a long teardrop of mossy feathers with a pale row of coverts and darker flight feathers
// scalloped along its tip; `side` -1 for the left, 1 for the right (mirrored). Box 10 x 14; the
// shoulder at (5, 1.4), hanging down along +y.
const wingShapes = (side) => {
  const m = (x) => (side < 0 ? x : 13 - x);
  // (Broad, narrow at the shoulder and fanning out into five long flight feathers, so spread wide
  // it reads as a big owl's wing.)
  const out = [];
  for (const [x, y, r] of [[2.4, 14, -0.45], [4.6, 15.6, -0.22], [6.8, 16.2, 0], [9, 15.4, 0.22], [10.8, 13.6, 0.45]]) out.push(T([[m(x - 1.3), y - 4], [m(x + 1.3), y - 4], [m(x + 1.2 + r * 3), y + 1.4], [m(x + r * 3), y + 2.8], [m(x - 1.2 + r * 3), y + 1.4]], FEATH.sh));
  out.push(E(m(6.5), 8, 5, 7, FEATH.base));
  out.push(F(E(m(6), 5.4, 3, 2.6, FEATH.hi)));
  for (let i = 0; i < 4; i++) out.push(F(E(m(3.6 + i * 1.9), 10.2, 0.9, 1.2, '#a6d696')));
  return out;
};
// A foot: three stubby orange toes with dark claw tips. Box 6 x 3, the ankle at (3, 0.4).
const footShapes = () => {
  const out = [];
  for (const dx of [-1.8, 0, 1.8]) out.push(E(3 + dx, 1.4, 1, 1.2, TALON), F(E(3 + dx, 2.4, 0.55, 0.4, '#6a4a3a')));
  return out;
};
// The tail: a little fan of three feathers peeking out under the body. Box 10 x 6; its root at (5, 0.6).
const tailShapes = () => [E(2.8, 3, 1.8, 2.8, FEATH.sh), E(7.2, 3, 1.8, 2.8, FEATH.sh), E(5, 3.4, 2, 3, FEATH.base)];

const bodyPart = () => part('ow|body', 20, 18, bodyShapes, 4);
const headPart = () => part('ow|head', 22, 17, headShapes, 4);
const facePart = (mood) => sprite(`rig|ow|face|${mood}`, () => ({ w: 18, h: 11, res: 2, soft: 'cel', crisp: true, bare: true, pad: 4, shapes: faceShapes(mood) }));
const tuftPart = (side) => part(`ow|tuft|${side}`, 7, 7, () => tuftShapes(side), 3);
const wingPart = (side) => part(`ow|wing|${side}`, 13, 19, () => wingShapes(side), 3);
const footPart = () => part('ow|foot', 6, 3, footShapes, 3);
const tailPart = () => part('ow|tail', 10, 6, tailShapes, 3);

const faceOf = (a) => {
  if (a.face === 'dead') return 'dead';
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk) return 'angry';
  if (a.owBlink) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};

// ---------- Motion ----------

// One soft wingbeat per BEAT px flown, on its speed eased over a moment.
const BEAT = 46;
const FEET = 3; // the body's bottom above the ground, standing
const beatPhase = (m, a) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(160, Math.abs(odo - (st.owOdo ?? odo)) / dt);
  st.owOdo = odo;
  st.owV = (st.owV ?? 0) + (raw - (st.owV ?? 0)) * Math.min(1, dt * 4);
  st.owU = ((st.owU ?? 0) + (st.owV / BEAT) * dt) % 1;
  return st.owU;
};
// The idle loop, every 9 s: a head tilt one way, a slow blink, a feather ruffle, a tilt the other way.
const LOOP = 9;
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));

export const mossowletRig = makeRig({
  w: 30,
  h: 32,
  soft: true,
  stride: BEAT,
  recover: 0.55,
  springs: {
    x: [180, 18],
    lift: [70, 13],
    tilt: [130, 11],
    head: [90, 10],
    wingL: [150, 13],
    wingR: [150, 13],
    tuck: [120, 16],
    // Loose: the moss tufts flick on after every move, the tail too.
    tuftL: [110, 5],
    tuftR: [110, 5],
    tail: [90, 7],
  },
  fast: ['x', 'tilt', 'wingL', 'wingR', 'lift'],
  kick: { tilt: -220, wingL: 400, wingR: 400, tuftL: 300, tuftR: -300 },
  turnKick: { tilt: 120, tuftL: 160, tuftR: -160 },
  pose(m, a) {
    const st = (a.mo.rig ??= {});
    const t = a.t + (m.uid % 9) * 0.97;
    const u = beatPhase(m, a);
    // (It only takes off once it has been moving a beat, and lands once it has stopped one, so a
    // pause mid-glide doesn't drop it.)
    st.owRun = a.moving ? (st.owRun ?? 0) + Math.max(0, a.dt) : 0;
    st.owStill = a.moving ? 0 : (st.owStill ?? 0) + Math.max(0, a.dt);
    const flying = m.hp > 0 && (st.owRun > 0.08 || (st.owStill ?? 0) < 0.25) && (a.moving || st.owWas);
    st.owWas = flying;
    const fly = spring(st, '_fly', flying ? 1 : 0, 60, 14, Math.max(1e-3, a.dt));
    a.owFly = fly;
    const lu = t % LOOP;
    const tiltA = hold(lu, 0.4, 1.2, 2.6, 3.3);
    const tiltB = hold(lu, 6.4, 7.2, 8.2, 8.9);
    const ruffle = hold(lu, 4.2, 4.35, 4.9, 5.2);
    const shake = ruffle * Math.sin(lu * 40) * 0.9;
    a.owBlink = (lu > 3.5 && lu < 3.85) || (lu > 5.6 && lu < 5.8);
    const breath = Math.sin(t * 1.6);
    const rest = {
      x: 0,
      lift: breath * 0.15,
      tilt: shake * 4,
      head: tiltA * 22 - tiltB * 18 + shake * 6,
      wingL: 14 + ruffle * 30 + breath * 1.5,
      wingR: 14 + ruffle * 30 + breath * 1.5,
      tuck: 0,
    };
    // Gliding: wings spread level, a slow soft beat that lifts it a hair on each downstroke, body
    // leaning into the glide, feet tucked.
    const p = u * TAU;
    const beat = Math.sin(p);
    const glide = { x: 0, lift: 5 + beat * 0.9, tilt: 10 - beat * 1.5, head: -6 + beat * 2, wingL: 108 + beat * 20, wingR: 108 + beat * 20, tuck: 1 };
    const base = { ...rest };
    for (const k of Object.keys(rest)) base[k] = rest[k] + (glide[k] - rest[k]) * clamp(fly, 0, 1.2);
    // The attack: puffed up, wings raised high, then a swoop in talons first.
    const antic = { x: -1.5, lift: 1, tilt: -8, head: -4, wingL: 140, wingR: 140, tuck: 0 };
    const strike = { x: 8, lift: 4, tilt: 24, head: 8, wingL: 70, wingR: 70, tuck: 0 };
    return stateBlend(a, base, base, antic, strike);
  },
  follow(S) {
    return {
      tuftL: -S.tilt * 2.4 - S.head * 0.6 - S.lift * 6 + S.wingL * 0.08,
      tuftR: -S.tilt * 2.4 - S.head * 0.6 + S.lift * 6 - S.wingR * 0.08,
      tail: -S.tilt * 2 + S.lift * 4,
    };
  },
  // A soft shadow on the branch under it while it glides.
  under(ctx, m, a, S) {
    const k = clamp(S.lift / 5, 0, 1);
    if (k < 0.05) return;
    ctx.globalAlpha = 0.18 * k;
    ctx.fillStyle = '#2a3a2a';
    ctx.beginPath();
    ctx.ellipse(S.x, 0, 8, 1.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  },
  parts: [
    { name: 'body0', parent: null, at: (S) => [S.x, -FEET - S.lift], rot: (S) => S.tilt * D2R },
    // The wings behind the body: folded, just their edges peek out at its sides; spread in a
    // wide V to glide.
    { name: 'wingL', parent: 'body0', s: () => wingPart(-1), pivot: [6.5, 1.6], at: () => [-4.6, -12.4], rot: (S) => S.wingL * D2R },
    { name: 'wingR', parent: 'body0', s: () => wingPart(1), pivot: [6.5, 1.6], at: () => [4.6, -12.4], rot: (S) => -S.wingR * D2R },
    { name: 'tail', parent: 'body0', s: tailPart, pivot: [5, 0.6], at: () => [0, -2.2], rot: (S) => S.tail * D2R },
    // The feet: on the branch standing, tucked up into the belly fluff gliding.
    ...[-3.2, 3.2].map((x, i) => ({ name: `foot${i}`, parent: 'body0', s: footPart, pivot: [3, 0.4], at: (S) => [x - S.x * 0 + (i ? 0.4 : 0), -0.6 - S.tuck * 2.4 + 0.6], rot: (S) => (S.tuck * 30 * (i ? 1 : -1)) * D2R, alpha: (a, S) => 1 - clamp(S.tuck * 2.2, 0, 1) })),
    { name: 'body', parent: 'body0', s: bodyPart, pivot: [10, 17] },
    { name: 'neck', parent: 'body0', at: () => [0, -13.4], rot: (S) => S.head * D2R },
    { name: 'tuftL', parent: 'neck', s: () => tuftPart(-1), pivot: [3, 6.6], at: () => [-7.2, -11.2], rot: (S) => (-24 + S.tuftL) * D2R },
    { name: 'tuftR', parent: 'neck', s: () => tuftPart(1), pivot: [3, 6.6], at: () => [7.2, -11.2], rot: (S) => (24 + S.tuftR) * D2R },
    { name: 'head', parent: 'neck', s: headPart, pivot: [11, 14] },
    { name: 'face', parent: 'neck', s: (a) => facePart(faceOf(a)), pivot: [9, 5.5], at: () => [1, -4.8] },
  ],
});

// ---------- Stills ----------

const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));

// Perched, wings folded.
export function mossowletStill(pose, f, mood) {
  const fm = mood === 'dead' ? 'dead' : MOODS.has(mood) ? mood : 'idle';
  const ox = 15;
  const by = 33 - FEET;
  const ny = by - 13.4;
  return {
    w: 30,
    h: 34,
    res: 3,
    shapes: [
      ...shift(wingShapes(-1), ox - 4.6 - 6.5 - 2, by - 12.4 - 1.6),
      ...shift(wingShapes(1), ox + 4.6 - 6.5 + 2, by - 12.4 - 1.6),
      ...shift(tailShapes(), ox - 5, by - 2.2 - 0.6),
      ...shift(footShapes(), ox - 3.2 - 3, by - 0.4),
      ...shift(footShapes(), ox + 3.6 - 3, by - 0.4),
      ...shift(bodyShapes(), ox - 10, by - 17),
      ...shift(tuftShapes(-1), ox - 7.2 - 3, ny - 11.2 - 6.6),
      ...shift(tuftShapes(1), ox + 7.2 - 3, ny - 11.2 - 6.6),
      ...shift(headShapes(), ox - 11, ny - 14),
      ...shift(faceShapes(fm), ox + 1 - 9, ny - 4.8 - 5.5),
    ],
  };
}
