// Gnarlroot, the oldest tree, and his Root Tendrils, remade from scratch for Chapter 3 (2026-11-18).
// Live puppets on the rig (rig.js): every part drawn once and placed each frame, outer outline only,
// faces bare. Everything that grows out of him is rooted in him: the crown and the arms
// each turn only about a root sunk inside the trunk, so nothing ever comes away.
//
//   gnarlroot  A gentle, ancient tree: a broad trunk flaring into roots spread over the floor, a big
//              sleepy face under mossy brows, a round crown of leaves with white blossoms and
//              acorns, two branch arms ending in twig hands. He says one word a day: as each word
//              of his sentence crawls out (world/dungeon.js `m.saying`) his mouth works it slowly
//              and his body moves with what it brings (arms up for the Root Slam, down into the
//              floor for the thorns, spread wide and swept in for the hug). Elder Yomogi sits
//              tangled in a cradle of his roots at his feet, patiently waiting for him to finish.
//              At the last he sways, the tendrils holding Yomogi being cut.
//   sapling    Root Tendril (was the Corrupted Sapling): a thick root curling up out of the floor,
//              a leaf or two and a pink bud at its tip, swaying; cut, it wilts.

import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear } from './faces.js';
import { ramp, crescent, shine } from './meadow.js';
import { part, partBare, makeRig, stateBlend, smooth, clamp, lerp, TAU } from './rig.js';
import { sprite } from '../pixel.js';
import { drawMochiAnim } from '../mochi-anim.js';
import { rollMochi } from '../../data/mochi-genes.js';

const D2R = Math.PI / 180;
const INK = '#2e1c26';
const fr = (x) => ((x % 1) + 1) % 1;
const BARK = ramp('#a8785a', { step: 9, turn: 10 });
const MOSS = ramp('#8cc46e', { step: 9, turn: 10 });
const LEAF = [ramp('#7fc46a', { step: 10, turn: 10 }), ramp('#a2d878', { step: 10, turn: 10 }), ramp('#62a85e', { step: 10, turn: 10 })];
const ACORN = ramp('#c88a4a', { step: 9, turn: 8 });
const BUD = ramp('#ff9ec0', { step: 9, turn: 8 });

const ov = (cx, cy, rx, ry, deg, c, n = 18) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return T(pts, c);
};
const arcP = (cx, cy, rx, ry, a0, a1, n = 10) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
const taper = (pts, w0, w1, c) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x + nx * w, y + ny * w]);
    r.push([x - nx * w, y - ny * w]);
  });
  return T([...l, ...r.reverse()], c);
};
const pairOf = (pre) => (key, w, h, shapes, pad = 3) => [() => part(`${pre}|${key}`, w, h, shapes, pad), () => partBare(`${pre}|${key}`, w, h, shapes, pad)];
const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
const leafy = (x, y, r, d, c) => [ov(x, y, r * 1.3, r * 0.8, d, c.base), F(taper([[x - Math.cos(d * D2R) * r, y - Math.sin(d * D2R) * r], [x + Math.cos(d * D2R) * r, y + Math.sin(d * D2R) * r]], 0.5, 0.25, c.sh))];
const blossom = (x, y, k = 1) => [...[0, 1, 2, 3, 4].map((p) => F(E(x + Math.cos(p * 72 * D2R) * 1.4 * k, y + Math.sin(p * 72 * D2R) * 1.4 * k, 1.2 * k, 1.2 * k, '#ffffff'))), F(E(x, y, 0.7 * k, 0.7 * k, '#ffe36b'))];
const acorn = (x, y) => [E(x, y + 1.6, 2, 2.4, ACORN.base), T([[x - 2.6, y + 0.4], [x - 2, y - 1.4], [x, y - 2.2], [x + 2, y - 1.4], [x + 2.6, y + 0.4]], '#8a5a3a'), F(E(x - 0.6, y + 1.4, 0.6, 0.9, ACORN.hi))];

// =====================================================================================
// Gnarlroot
// =====================================================================================
const gp = pairOf('gn2');

// The trunk: broad and old, flaring at the foot, soft bark grooves, moss patches, a knot. Box 76 x
// 96; its joint (bottom middle) at (38, 94).
const gnTrunkShapes = () => {
  const out = [T([[14, 2], [62, 2], [68, 22], [71, 50], [72, 78], [76, 94], [0, 94], [4, 78], [5, 50], [8, 22]], BARK.base)];
  for (const [x0, x1] of [[18, 16], [30, 31], [57, 60], [46, 47]]) out.push(F(taper([[x0, 6], [x0 + 1, 40], [x1, 70], [x1 - 2, 90]], 1.4, 0.8, BARK.sh)));
  out.push(crescent(38, 50, 30, 46, BARK.sh, { k: 0.2, a0: 100, a1: 240 }));
  out.push(E(16, 76, 4, 5.4, BARK.deep), F(E(17, 77, 2.2, 3.4, '#3a2622')));
  for (const [x, y, rx, ry] of [[12, 30, 3.6, 1.8], [66, 74, 4, 2], [22, 91, 6, 2]]) out.push(F(E(x, y, rx, ry, MOSS.sh)), F(E(x - 0.6, y - 0.6, rx * 0.5, ry * 0.4, MOSS.base)));
  return out;
};
// The roots spread over the floor round his foot (the near ones over Yomogi's cradle). Box 132 x 20;
// the trunk's foot at (66, 17).
const gnRootShapes = () => {
  const out = [];
  for (const [pts, w0] of [[[[52, 14], [36, 16], [20, 18], [4, 18.6]], 9], [[[56, 12], [44, 9], [30, 11], [22, 14]], 6], [[[80, 14], [96, 16], [112, 18], [128, 18.6]], 9], [[[76, 12], [90, 9], [104, 11], [110, 14]], 6]]) {
    out.push(taper(pts, w0, 1.6, BARK.base));
  }
  out.push(F(taper([[46, 15], [26, 17.4]], 1.4, 0.6, BARK.sh)), F(taper([[86, 15], [106, 17.4]], 1.4, 0.6, BARK.sh)));
  for (const [x, y] of [[30, 16], [100, 16]]) out.push(E(x, y, 4, 1.6, MOSS.base));
  return out;
};
// The crown: a round cloud of leaves in three greens, white blossoms and acorns tucked in it. Box
// 124 x 66; it grows from the trunk's top at (62, 60).
const gnCrownShapes = () => {
  const out = [];
  for (const [x, y, rx, ry, k] of [[30, 40, 26, 20, 2], [94, 40, 26, 20, 2], [62, 28, 40, 26, 0], [40, 22, 22, 17, 1], [84, 22, 22, 17, 1], [62, 48, 34, 16, 0]]) out.push(E(x, y, rx, ry, LEAF[k].base));
  out.push(crescent(62, 34, 58, 30, LEAF[2].sh, { k: 0.18, a0: 20, a1: 160, jag: 0.6 }));
  for (const [x, y] of [[46, 10], [70, 8], [90, 14], [24, 26], [102, 30], [58, 20]]) out.push(F(E(x, y, 5, 2, LEAF[1].hi)));
  for (const [x, y, d, k] of [[12, 44, 160, 0], [112, 44, 20, 1], [20, 24, 210, 1], [104, 22, 330, 0], [62, 2, 270, 0], [36, 8, 240, 2], [88, 6, 300, 2]]) out.push(...leafy(x, y, 4, d, LEAF[k]));
  for (const [x, y] of [[40, 30], [78, 18], [96, 38], [54, 46], [22, 40]]) out.push(...blossom(x, y));
  for (const [x, y] of [[66, 36], [32, 50], [90, 50]]) out.push(...acorn(x, y));
  return out;
};
// An arm: a branch tapering to a twig hand with three twig fingers and a leaf. Box 46 x 18; the
// shoulder (sunk in the trunk) at (5, 9).
const gnArmShapes = (far) => () => {
  const c = far ? BARK.sh : BARK.base;
  return [
    taper([[5, 9], [18, 9.6], [30, 8.6]], 12, 6, c),
    taper([[29, 8.6], [38, 4], [42, 1.6]], 3.4, 1.6, c),
    taper([[29, 9], [40, 9.6], [44, 8.6]], 3.4, 1.6, c),
    taper([[29, 9.6], [37, 14], [40, 16.4]], 3.4, 1.6, c),
    ...leafy(22, 4, 3.4, -30, LEAF[far ? 2 : 0]),
    ...(far ? [] : [F(taper([[8, 6.4], [24, 6.6]], 1.6, 0.6, BARK.hi))]),
  ];
};
const G_TRUNK = gp('trunk', 76, 96, gnTrunkShapes, 4);
const G_ROOTS = gp('roots', 132, 20, gnRootShapes);
const G_CROWN = gp('crown', 124, 66, gnCrownShapes, 4);
const G_ARM = [false, true].map((far) => gp(`arm${far ? 1 : 0}`, 46, 18, gnArmShapes(far), 2));

// His face, bare on the trunk: big gentle eyes under mossy brows, a knot of a nose, a slow mouth.
const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'sleep', 'talk']);
const gnFaceShapes = (mood) => () => {
  const out = [];
  const eyes = [[33, 46, 5, 6.4, -1], [53, 45, 4.2, 5.6, 1]];
  if (mood === 'dead' || mood === 'sleep' || mood === 'blink') for (const [x, y, w] of eyes) out.push(...stroke(arcP(x, y + (mood === 'sleep' ? 0.6 : 0), w * 1.05, w * 0.5, 20, 160, 7), 0.8, INK));
  else for (const [x, y, w, h, s] of eyes) out.push(...simpleEye(x, y, { s, w, h, mood: mood === 'talk' ? 'idle' : mood, iris: '#5aa86a', ink: INK, lid: mood === 'idle' || mood === 'talk' ? 0.3 : 0 }));
  // Mossy brows, drooping (or knitted, cross).
  const knit = mood === 'angry' ? 1 : 0;
  out.push(taper([[25, 36 + knit * 2], [32, 33 - knit], [39, 36 + knit * 3]], 3.2, 2, MOSS.base));
  out.push(taper([[47, 35 + knit * 3], [53, 32 - knit], [60, 35 + knit * 2]], 3, 1.8, MOSS.base));
  // The nose: a knot of bark.
  out.push(E(45, 54, 4.4, 3.6, BARK.base), F(E(44, 53, 1.8, 1.2, BARK.hi)));
  out.push(F(E(24, 55, 4, 1.8, '#ff9fb4')), F(E(59, 54, 3, 1.5, '#ff9fb4')));
  // The mouth: a slow 'o' as a word comes out, a smile when happy, a wobble when hurt.
  if (mood === 'talk') out.push(F(E(44, 63, 3, 3.6, '#5a2a30')), F(E(44, 64.6, 1.8, 1.2, '#ff9ab0')));
  else if (mood === 'happy') out.push(...stroke(arcP(44, 61, 4, 2.6, 20, 160, 6), 0.7, INK));
  else if (mood === 'hurt') {
    out.push(...stroke([[39, 63], [41.5, 62], [44, 63], [46.5, 62], [49, 63]], 0.65, INK));
    out.push(...tear(34, 51, 1.2, { type: 'stream', len: 3 }));
  } else if (mood === 'dead') out.push(...stroke(arcP(44, 62, 3, 1.8, 20, 160, 6), 0.65, INK));
  else out.push(...stroke([[40, 62], [44, 63], [48, 62]], 0.65, INK));
  return out;
};
const gnFace = (mood) => sprite(`rig|gn2|face|${mood}`, () => ({ w: 76, h: 96, res: 2, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: gnFaceShapes(mood)() }));

// Elder Yomogi, kept in his roots: a Mochi elder (mugwort-green, in the palace's elder robe and hat,
// a monocle and the famous fake beard), drawn by the Mochi renderer each frame.
export const YOMOGI = { seed: 41, force: { dough: '#d8efc0', hairColor: 'yomogi' }, wear: { dress: 'elderrobe', hat: 'elderhat', eyes: 'monocle', face: 'fakebeard' } };
const yomogiOf = (a) => {
  const st = a.mo;
  if (!st.yomo) {
    const genes = rollMochi(YOMOGI.seed, { ...YOMOGI.force });
    genes.wear = { ...YOMOGI.wear };
    st.yomo = { genes, dir: 1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, noIdle: true };
  }
  return st.yomo;
};

// What his sentence's current word is bringing (world/dungeon.js `m.saying`: kind, at, dur).
const sayingOf = (m, now) => {
  const s = m.saying;
  if (!s || now < s.at || now > s.at + s.dur + 0.5) return null;
  return { kind: s.kind, u: clamp((now - s.at) / s.dur, 0, 1), after: Math.max(0, now - s.at - s.dur) };
};

const G_LOOP = 16;
const gnPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `armF${tag}`, parent: 'body', s: G_ARM[1][i], pivot: [5, 9], at: () => [-24, -46], rot: (S) => (150 - S.armF) * D2R },
    { name: `crown${tag}`, parent: 'body', s: G_CROWN[i], pivot: [62, 60], at: () => [0, -86], rot: (S) => (S.crown + S.crownLag) * D2R },
    { name: `trunk${tag}`, parent: 'body', s: G_TRUNK[i], pivot: [38, 94] },
    { name: `roots${tag}`, parent: null, s: G_ROOTS[i], pivot: [66, 17], at: (S) => [S.x + S.scoot, 0] },
    { name: `armN${tag}`, parent: 'body', s: G_ARM[0][i], pivot: [5, 9], at: () => [24, -44], rot: (S) => (30 + S.armN) * D2R },
  ];
};

export const gnarlRig = makeRig({
  w: 132,
  h: 150,
  soft: true,
  stride: 22,
  recover: 0.9,
  springs: { x: [120, 16], lift: [100, 12], sway: [40, 8], lean: [80, 10], armN: [90, 9], armF: [90, 9], crown: [40, 5], beard: [60, 5], scoot: [140, 14] },
  fast: ['armN', 'armF', 'lean'],
  kick: { lean: -40, crown: 120, beard: 200 },
  turnKick: { crown: 80, beard: 160 },
  pose(m, a) {
    a.uidOff = 0;
    const t = a.t;
    const now = a.now;
    const lu = t % G_LOOP;
    // (He blinks once in a very long while, and slowly.)
    a.gnBlink = hold(lu, 6, 6.5, 7.3, 7.9);
    a.gnDoze = hold(lu, 11, 12, 14, 15);
    const br = Math.sin(t * 0.8);
    const s = Math.sin(a.wp ?? 0);
    const idle = { x: 0, lift: br * 0.6, sway: Math.sin(t * 0.5) * 1.6 + a.gnDoze * 2, lean: a.gnDoze * 3, armN: br * 4, armF: br * 4, crown: Math.sin(t * 0.7) * 1.2, beard: Math.sin(t * 0.9) * 2, scoot: 0 };
    // The shuffle: his roots scoot him along, the trunk rocking slowly.
    const walk = { x: 0, lift: Math.abs(s) * 1.2, sway: s * 2.4, lean: 3, armN: s * 8, armF: -s * 8, crown: -s * 2, beard: -s * 4, scoot: s * 3 };
    // His swing: both branches up, then down in front.
    const antic = { x: -3, lift: 1, sway: 0, lean: -6, armN: -100, armF: -100, crown: -4, beard: 6, scoot: 0 };
    const strike = { x: 6, lift: 0, sway: 0, lean: 8, armN: 40, armF: 40, crown: 6, beard: -10, scoot: 0 };
    const out = stateBlend(a, idle, walk, antic, strike);
    // A word on its way, and what it brings: arms rising for the Root Slam and coming down as it
    // lands; reaching down into the floor for the thorns; spread wide, then swept in for the hug.
    const say = sayingOf(m, now);
    a.gnTalk = say && say.after === 0 ? 1 : 0;
    if (say) {
      const u = smooth(say.u);
      const hit = say.after > 0 ? 1 - clamp(say.after / 0.5, 0, 1) : 0;
      if (say.kind === 'slam') {
        out.armN = lerp(out.armN, say.after > 0 ? 40 : -100, say.after > 0 ? hit : u);
        out.armF = lerp(out.armF, say.after > 0 ? 40 : -100, say.after > 0 ? hit : u);
        out.lean = lerp(out.lean, say.after > 0 ? 8 : -6, say.after > 0 ? hit : u);
      } else if (say.kind === 'thorns') {
        out.armN = lerp(out.armN, 40, u);
        out.armF = lerp(out.armF, 40, u);
        out.lean = lerp(out.lean, 6, u);
      } else if (say.kind === 'hug') {
        const sweep = say.after > 0 ? hit : 0;
        out.armN = lerp(out.armN, lerp(-30, 30, sweep), say.after > 0 ? 1 : u);
        out.armF = lerp(out.armF, lerp(-30, 30, sweep), say.after > 0 ? 1 : u);
        out.lean = lerp(out.lean, -4, u);
      }
    }
    // Swaying at the last, while the tendrils holding Yomogi are cut.
    if (m.swaying) {
      out.sway = Math.sin(now * 1.3) * 7;
      out.armN = -10 + Math.sin(now * 1.3) * 20;
      out.armF = -10 - Math.sin(now * 1.3) * 20;
    }
    return out;
  },
  follow: (S) => ({ crownLag: -(S.sway + S.lean) * 0.5 }),
  parts: [
    // (He rocks about the middle of his foot.)
    { name: 'body', parent: null, at: (S) => [S.x, -4 - S.lift], rot: (S) => (S.sway + S.lean) * D2R },
    ...gnPass(false),
    ...gnPass(true),
    { name: 'face', parent: 'body', s: (a) => gnFace(a.face === 'dead' ? 'dead' : a.gnTalk ? 'talk' : a.ph.atk ? 'angry' : a.face === 'hurt' ? 'hurt' : a.gnBlink > 0.4 || a.gnDoze > 0.5 ? 'sleep' : MOODS.has(a.face) ? a.face : 'idle'), pivot: [38, 94] },
  ],
  fx(ctx, m, a, S) {
    // Elder Yomogi in the cradle of his roots, roots wrapped round it.
    if (m.yomogiFree) return;
    const y = yomogiOf(a);
    const yx = S.x + 50;
    ctx.save();
    ctx.globalAlpha = a.alpha;
    drawMochiAnim(ctx, y, yx, -2, a.t);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a.alpha;
    ctx.lineCap = 'round';
    const wob = Math.sin(a.t * 1.1) * 1.2;
    // (Two thin roots from his foot, looped once round its middle: held, not hidden.)
    for (const [c, w] of [[INK, 4.4], [BARK.base, 2.8], [BARK.hi, 0.8]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(yx - 30, -2);
      ctx.bezierCurveTo(yx - 16, -4, yx - 14, -13 + wob, yx, -12 + wob);
      ctx.bezierCurveTo(yx + 12, -11 + wob, yx + 13, -6, yx + 6, -5);
      ctx.moveTo(yx - 26, -1);
      ctx.bezierCurveTo(yx - 12, 0, yx - 10, -8 - wob, yx + 2, -7 - wob);
      ctx.bezierCurveTo(yx + 10, -6, yx + 10, -1, yx + 14, -1);
      ctx.stroke();
    }
    ctx.restore();
  },
});
export function gnarlStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const put = (shapes, [px, py], x, y, deg = 0) => {
    const c = Math.cos(deg * D2R);
    const sn = Math.sin(deg * D2R);
    const P = ([sx, sy]) => [x + (sx - px) * c - (sy - py) * sn, y + (sx - px) * sn + (sy - py) * c];
    return shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([qx, qy]) => P([qx + (sh.x ?? 0), qy + (sh.y ?? 0)])) } : { ...sh, ...(([qx, qy]) => ({ x: qx, y: qy }))(P([sh.x, sh.y])) }));
  };
  const [tx, ty] = [66, 150];
  return {
    w: 132,
    h: 154,
    res: 2,
    shapes: [
      ...put(gnArmShapes(true)(), [5, 9], tx - 24, ty - 50, 150),
      ...put(gnCrownShapes(), [62, 60], tx, ty - 90),
      ...put(gnTrunkShapes(), [38, 94], tx, ty - 4),
      ...put(gnFaceShapes(fm)(), [38, 94], tx, ty - 4),
      ...put(gnRootShapes(), [66, 17], tx, ty),
      ...put(gnArmShapes(false)(), [5, 9], tx + 24, ty - 48, 30),
    ],
  };
}

// =====================================================================================
// Root Tendril (sapling)
// =====================================================================================
const tp = pairOf('rt');
// A segment of the tendril: a thick root, tapering. Box 10 x 18; its root at (5, 17).
const rtSegShapes = (k) => () => {
  const w0 = 10 - k * 2.4;
  const w1 = w0 - 2.4;
  return [taper([[5, 17], [5.4, 9], [5, 1]], w0, w1, k % 2 ? BARK.sh : BARK.base), F(taper([[4.2, 15], [4.4, 4]], 0.8, 0.4, BARK.hi))];
};
const rtBudShapes = () => [E(5, 5, 3.6, 4.2, BUD.base), F(E(4, 3.6, 1.2, 1.4, BUD.hi)), ...leafy(1.6, 8.6, 2.4, 150, LEAF[0]), ...leafy(8.6, 8.4, 2.4, 30, LEAF[1])];
const rtFootShapes = () => [ov(9, 4, 9, 3.4, 0, BARK.base), F(E(5, 3, 2.4, 1, MOSS.base))];
const RT_SEG = [0, 1, 2].map((k) => tp(`seg${k}`, 10, 18, rtSegShapes(k), 2));
const RT_BUD = tp('bud', 10, 12, rtBudShapes, 2);
const RT_FOOT = tp('foot', 18, 8, rtFootShapes, 2);
const rtPass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    ...[0, 1, 2].map((k) => ({
      name: `seg${k}${tag}`,
      parent: k ? `seg${k - 1}${tag}` : 'base',
      s: RT_SEG[k][i],
      pivot: [5, 17],
      at: k ? () => [0, -15] : () => [0, 0],
      rot: (S, a) => ([-12, 26, 34][k] + Math.sin(a.t * 1.6 + k * 0.9 + (a.uidOff ?? 0)) * (5 + k * 3) + S.curl * (k + 1) * 0.6) * D2R,
    })),
    { name: `bud${tag}`, parent: `seg2${tag}`, s: RT_BUD[i], pivot: [5, 11], at: () => [0, -14], rot: (S, a) => (Math.sin(a.t * 2 + 1) * 8) * D2R },
    { name: `foot${tag}`, parent: null, s: RT_FOOT[i], pivot: [9, 6], at: () => [0, 0] },
  ];
};
export const tendrilRig = makeRig({
  w: 26,
  h: 56,
  soft: true,
  stride: 20,
  springs: { curl: [60, 6], wilt: [40, 8] },
  kick: { curl: 600 },
  pose(m, a) {
    a.uidOff = (m.uid % 9) * 0.7;
    // (Cut: it wilts over.)
    return { curl: m.hp <= 0 ? 40 : Math.sin(a.t * 0.9 + a.uidOff) * 6, wilt: m.hp <= 0 ? 1 : 0 };
  },
  parts: [{ name: 'base', parent: null, at: () => [0, -2], rot: (S) => S.wilt * 50 * D2R }, ...rtPass(false), ...rtPass(true)],
});
export function tendrilStill() {
  const put = (shapes, [px, py], x, y) => shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([qx, qy]) => [qx + (sh.x ?? 0) - px + x, qy + (sh.y ?? 0) - py + y]) } : { ...sh, x: sh.x - px + x, y: sh.y - py + y }));
  return {
    w: 26,
    h: 56,
    res: 3,
    shapes: [...put(rtSegShapes(0)(), [5, 17], 13, 52), ...put(rtSegShapes(1)(), [5, 17], 13, 37), ...put(rtSegShapes(2)(), [5, 17], 13, 22), ...put(rtBudShapes(), [5, 11], 13, 8), ...put(rtFootShapes(), [9, 6], 13, 54)],
  };
}
