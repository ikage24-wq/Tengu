// Queen Coralie, the Drowned Queen (redrawn 2026-11-19, the player's pick "A, the Pearl Clam
// Queen"): a chibi mermaid queen sat in a great pearl-pink clam, its lid standing open behind her
// like a throne's back. Lilac waves with pearls, two locks swinging at her shoulders, a pink coral
// crown on a gold band, a coral bodice with a pearl strand, a sky-blue tail draped over the shell's
// lip down to a fluke on the floor; in her arms the little fishbowl she keeps (its fish swims).
// The clam hops her about, its lid clapping as it goes.
//
// How she moves:
//   idle    a 12 s act: swaying on her throne; peeking into her bowl, delighted; polishing it.
//   walk    the clam hops along, lid clapping, her hair and tail streaming.
//   fight   (world/aquarium.js) a plain swing is a slap of her tail's water, her free arm swung; a
//           Keepsake Bubble (m.bubbleAt) the bowl lifted to her lips and blown; the Tidal Strike
//           (m.tideAt) her free arm raised, calling the water up; hugging her treasures while the
//           tanks are shut (m.mech.hugging) she curls round the bowl, the lid tilting over her,
//           glass shimmering round her; dizzy when they're opened (m.vulnUntil); the Great Wave
//           (m.slamming) both arms flung up, hair streaming.

import { E, T, F, stroke } from './kit.js';
import { ramp, crescent } from './meadow.js';
import { makeRig, stateBlend, clamp, smooth, TAU } from './rig.js';
import { simpleEye } from './faces.js';
import { D2R, INK, fr, arcP, taper, pairOf, faceSprite, hold, window1, stepPhase, put, shift, MOODS, moodOf, faceShapes, sparkle, dot } from './rigkit.js';

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
const line = (pts, w, c = INK) => stroke(pts, w, c).map(F);
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

const SKIN = ramp('#ffe6dc', { step: 7, turn: 8, lift: 3 });
const HAIR = ramp('#c8a8f0', { step: 9, turn: 8 });
const SHELL = ramp('#f4c8d8', { step: 8, turn: 8 });
const TAIL = ramp('#5ab8d8', { step: 9, turn: 8 });
const BOD = ramp('#ff8a8a', { step: 8, turn: 8 });
const CORAL = '#ff7a8a';
const GOLD = '#ffd36b';
const PEARL = '#fff6fa';
const cr = pairOf('cr2');

// ---------- The pieces (each facing right) ----------
// The clam's lid, standing open behind her: a tall fluted fan, scalloped, pearly inside. Box 100 x
// 84; hinged at its bottom middle (50, 80).
const lidP = () => {
  const edge = arcP(50, 80, 47, 76, 180, 360, 20).map(([x, y], i) => (i % 2 ? [x, y] : [x + (x - 50) * 0.05, y - 3]));
  return [
    blob([[2, 80], ...edge, [98, 80]], SHELL.base, 1), F(blob([[10, 80], ...arcP(50, 80, 38, 64, 186, 354, 14), [90, 80]], '#fff0f6', 1)),
    ...[-64, -40, -18, 0, 18, 40, 64].flatMap((a) => line([[50, 79], [50 + Math.sin(a * D2R) * 40, 79 - Math.cos(a * D2R) * 66]], 0.7, SHELL.sh)),
    crescent(50, 80, 47, 76, SHELL.sh, { k: 0.12, a0: 180, a1: 250 }),
  ];
};
// The clam's bottom shell, its fluted front and pearly lip. Box 100 x 32; its middle at (50, 22).
const shellP = () => [
  blob([[3, 4], [97, 4], [92, 18], [78, 28], [22, 28], [8, 18]], SHELL.base, 2), crescent(50, 14, 47, 15, SHELL.sh, { k: 0.18, a0: 60, a1: 150 }),
  ...[14, 28, 42, 58, 72, 86].flatMap((x) => line([[x, 6], [50 + (x - 50) * 0.7, 27]], 0.7, SHELL.sh)),
  F(taper([[4, 4.4], [50, 6], [96, 4.4]], 2.6, 2.6, '#fff0f6')), ...[22, 50, 78].map((x) => F(E(x, 4.6, 1.6, 1.4, PEARL))),
];
// Her body: the coral bodice with a frill and a pearl strand, the waist going on down into the
// shell. Box 32 x 34; the waist at (16, 28).
const bodiceP = () => [
  blob([[6, 4], [26, 4], [27, 18], [26, 33], [6, 33], [5, 18]], BOD.base, 2), crescent(16, 18, 11, 15, BOD.sh, { k: 0.2, a0: 100, a1: 200 }),
  F(E(16, 4.6, 8, 3.4, SKIN.base)), F(taper([[7, 7], [16, 10.4], [25, 7]], 1.8, 1.8, '#ffffff')),
  ...[0, 1, 2, 3, 4].map((k) => F(E(9.6 + k * 3.2, 9 + Math.sin((k / 4) * Math.PI) * 2.4, 1.1, 1.1, PEARL))),
  F(taper([[6, 25], [26, 25]], 2.4, 2.4, GOLD)), F(E(16, 25, 1.8, 1.8, PEARL)),
];
// Her head: round, bangs in lilac waves, the coral crown on a gold band round the top. Box 44 x 62;
// the neck at (22, 58), the head's middle at (22, 40).
const headP = () => {
  const band = arcP(22, 40, 17.4, 16.8, 212, 328, 12);
  return [
    E(22, 40, 17, 16.4, SKIN.base),
    blob([[5, 40], [7, 30], [14, 25], [22, 23.6], [31, 25], [38, 31], [39.6, 40], [35, 35], [30, 38], [25, 34.6], [19, 38], [13, 35], [8, 39]], HAIR.base, 2),
    F(taper([[12, 29], [20, 26]], 1.2, 0.6, HAIR.hi)), F(E(9, 33, 1.4, 1.4, PEARL)), F(E(35, 31, 1.2, 1.2, PEARL)),
    taper([[14, 26], [11, 16], [7, 10]], 2.6, 1.6, CORAL), taper([[11, 16], [15, 10.6]], 2, 1.2, CORAL),
    taper([[22, 24], [22, 10], [20, 4]], 3, 1.6, CORAL), taper([[22, 13], [26, 7]], 2, 1.2, CORAL),
    taper([[30, 26], [33, 16], [37, 11]], 2.6, 1.6, CORAL),
    ...[[7, 10], [15, 10.6], [20, 4], [26, 7], [37, 11]].map(([x, y]) => E(x, y, 2, 2, CORAL)),
    F(taper(band, 3.2, 3.2, GOLD)), F(E(22, 23.4, 2, 2, PEARL)),
    crescent(22, 40, 17, 16.4, SKIN.sh, { k: 0.14, a0: 110, a1: 220 }),
  ];
};
// The lilac waves behind her head, down to her shoulders. Box 60 x 56; behind the head's middle at (30, 26).
const hairBackP = () => [E(30, 24, 22, 20, HAIR.sh), ...[0, 1, 2, 3, 4].map((k) => E(10 + k * 10, 40 + (k % 2) * 3, 6.4, 6.4, HAIR.sh)), F(E(14, 30, 1.4, 1.4, PEARL))];
// A lock at her shoulder: wavy, a pearl in it. Box 16 x 32; rooted at (8, 2).
const lockP = (far) => () => [taper([[8, 2], [6, 10], [10, 18], [7, 26]], 10, 6, far ? HAIR.sh : HAIR.base), E(7, 27, 3.4, 3.2, far ? HAIR.sh : HAIR.base), F(E(8.6, 16, 1.3, 1.3, PEARL)), F(taper([[8, 4], [7, 10], [9.4, 16]], 1, 0.6, HAIR.hi))];
// The tail, in two, then the fluke: draped from her waist over the lip, down to the floor. Upper:
// box 38 x 20 rooted at (3, 10); lower: box 30 x 16 rooted at (2, 8); fluke: box 26 x 24 rooted at (3, 12).
const tail1P = () => [taper([[3, 10], [18, 10.4], [35, 10]], 17, 12.6, TAIL.base), F(taper([[6, 15], [33, 14]], 2, 1.6, TAIL.sh)), ...[0, 1, 2, 3].flatMap((k) => line(arcP(10 + k * 7, 9 + (k % 2), 2.4, 1.6, 20, 160, 5), 0.5, TAIL.sh))];
const tail2P = () => [E(2, 8, 6.3, 6.3, TAIL.base), taper([[2, 8], [14, 8], [27, 8]], 12.6, 6.4, TAIL.base), F(taper([[4, 12], [25, 10.6]], 1.6, 1.2, TAIL.sh)), ...[0, 1].flatMap((k) => line(arcP(9 + k * 7, 7, 2, 1.4, 20, 160, 5), 0.5, TAIL.sh))];
const flukeP = () => [blob([[2, 12], [14, 2], [24, 3], [18, 11], [25, 21], [13, 22]], TAIL.hi ?? '#9fe0f0', 2), F(taper([[4, 12], [19, 5]], 0.8, 0.4, '#d8fcff')), F(taper([[4, 12], [19, 19]], 0.8, 0.4, '#d8fcff'))];
// An arm: a puffed coral sleeve, then the forearm and hand. Upper: box 12 x 10 at (2, 5);
// fore: box 14 x 8 at (2, 4).
const upP = (far) => () => [E(5, 5, 4.6, 4.4, far ? BOD.sh : BOD.base), taper([[2, 5], [10, 5]], 4.6, 4, far ? SKIN.sh : SKIN.base), F(taper([[2, 7], [9, 7]], 0.8, 0.8, BOD.deep)), E(5, 5, 4.4, 4.2, far ? BOD.sh : BOD.base)];
const foreP = (far) => () => [E(2, 4, 2.3, 2.3, far ? SKIN.sh : SKIN.base), taper([[2, 4], [9, 4]], 4.2, 3.6, far ? SKIN.sh : SKIN.base), E(10, 4, 2.6, 2.4, far ? SKIN.sh : SKIN.base), F(taper([[2.6, 5.8], [9, 5.6]], 0.6, 0.6, SKIN.deep))];
// The fishbowl: glass, water, gravel, a pearl (its fish swims, drawn live). Box 26 x 24; held at (13, 20).
const bowlP = () => [
  E(13, 13, 11.6, 10.6, '#d8f6ff'), E(13, 15, 10.4, 8, '#8ad8f0'), F(E(13, 12, 10, 3, '#b8ecf8')),
  F(E(13, 21, 7, 2, '#ffe0b8')), F(E(17, 20.4, 1.4, 1.4, PEARL)),
  F(taper([[5, 9], [7, 5]], 1.2, 0.6, '#ffffff')),
  T([[6, 1.6], [20, 1.6], [20, 4], [6, 4]], '#d8f6ff'), ...stroke(arcP(13, 13, 11.6, 10.6, 0, 360, 22), 0.8, '#8ad0e0'),
];

const SP = {
  LID: cr('lid', 100, 84, lidP, 2), SHELL: cr('shell', 100, 32, shellP, 2), BOD: cr('bodice', 32, 34, bodiceP, 2), HEAD: cr('head', 44, 62, headP, 2), BACK: cr('hairback', 60, 56, hairBackP, 2),
  LOCK: [false, true].map((f) => cr(`lock${f ? 1 : 0}`, 16, 32, lockP(f), 2)),
  T1: cr('tail1', 38, 20, tail1P, 2), T2: cr('tail2', 30, 16, tail2P, 2), FLUKE: cr('fluke', 26, 24, flukeP, 2),
  UP: [false, true].map((f) => cr(`up${f ? 1 : 0}`, 12, 10, upP(f), 2)), FORE: [false, true].map((f) => cr(`fore${f ? 1 : 0}`, 14, 8, foreP(f), 2)),
  BOWL: cr('bowl', 26, 24, bowlP, 2),
};
const CR_FACE = { eyes: [[27.6, 42.4, 3.8, 4.8, 1], [17.4, 42.8, 3.3, 4.3, -1]], mouth: [23, 50, 2.8], blush: [[29.6, 47.2, 2.4], [15.6, 47.4, 2]], iris: '#3aa8c8', k: 1.8, lid: 0, lashes: 1 };
// (Her sad face for her scenes: drooping brows, a little frown.)
const crFaceShapes = (mood) => {
  if (mood !== 'sad') return faceShapes(mood, CR_FACE);
  const out = [];
  for (const [x, y, w, h, sd] of CR_FACE.eyes) out.push(...simpleEye(x, y, { s: -sd, w, h, mood: 'angry', iris: CR_FACE.iris, ink: INK, wing: 1 }));
  for (const [x, y, rx] of CR_FACE.blush) out.push(F(E(x, y, rx, rx * 0.5, '#ff9fb4')));
  const [mx, my, mw] = CR_FACE.mouth;
  out.push(...stroke(arcP(mx, my + 1.4, mw * 0.45, mw * 0.3, 200, 340, 6), 0.8, INK));
  return out;
};
const crFace = (mood) => faceSprite(`cr2|face|${mood}`, 44, 62, () => crFaceShapes(mood));

// ---------- The skeleton ----------
const CLAM_Y = 8;
const WAIST = [0, -22];
const NECK = [1, -26];
const SHN = [8, -21];
const SHF = [-7, -21];
const UA = 8;
export const coralieRig = makeRig({
  w: 140, h: 170, soft: true, stride: 1e9, recover: 0.8,
  springs: {
    x: [150, 15], hop: [220, 15], rock: [150, 12], lid: [120, 9], lift: [120, 11], lean: [110, 11], head: [110, 10],
    armN: [180, 13], elbN: [180, 13], armF: [170, 12], elbF: [170, 12], bowl: [120, 10], bowlX: [160, 12], bowlY: [160, 12],
    t1: [100, 9], t2: [90, 8], fluke: [100, 8],
  },
  fast: ['x', 'hop', 'armN', 'elbN', 'armF', 'elbF', 'bowlX', 'bowlY', 'lean'],
  kick: { lean: -100, head: -160, lid: 200, fluke: 300 },
  turnKick: { lid: 120, fluke: 240 },
  pose(m, a) {
    a.uidOff = (m.uid % 7) * 1.2;
    const t = a.t + a.uidOff;
    const now = a.now;
    const u = stepPhase(m, a, 'cr2', 30);
    const active = a.ph.antic > 0.02 || a.ph.strike > 0.02;
    const walkW = a.walkW ?? 0;
    const lu = fr(t / 12) * 12;
    const busy = active || walkW > 0.05 || m.cine || m.aggroUntil === Infinity;
    const peek = busy ? 0 : hold(lu, 1.4, 1.9, 3.6, 4.1);
    const polish = busy ? 0 : hold(lu, 6.4, 6.8, 8.6, 9);
    const sway = Math.sin(t * 1.3);
    const rub = Math.sin(t * 12);
    // (The arms reach the bowl: near hand at its front, far hand at its back.)
    const idle = {
      x: 0, hop: 0, rock: sway * 1.4, lid: sway * 2, lift: sway * 1, lean: sway * 3 + peek * 10, head: peek * 14 - sway * 3,
      armN: 70 - polish * 20 + polish * rub * 10, elbN: -60 + polish * rub * 14, armF: 60, elbF: -70, bowl: peek * -10 + polish * Math.sin(t * 3) * 6, bowlX: peek * 2, bowlY: peek * 3,
      t1: 14 + sway * 2, t2: 38 - sway * 3, fluke: -70 + Math.sin(t * 2.2) * 10,
    };
    // The clam hops along: a little leap a stride, the lid clapping, her tail streaming.
    const sw = Math.sin(u * TAU);
    const leap = Math.max(0, Math.sin(u * TAU));
    const walk = { ...idle, hop: leap * 6, rock: 4 - sw * 4, lid: -sw * 10, lift: 2, lean: 6, head: -4, t1: 10 + leap * 6, t2: 34 + leap * 10, fluke: -50 - sw * 20 };
    // A slap of her tail's water: the bowl tucked in, her free arm swung.
    const antic = { ...idle, x: -3, rock: -4, lid: 6, lean: -12, head: -8, armF: -110, elbF: -30, bowlX: -2, t1: 4, t2: 20, fluke: -100 };
    const strike = { ...idle, x: 6, rock: 4, lid: -6, lean: 12, head: 6, armF: 30, elbF: -10, bowlX: 2, t1: 20, t2: 48, fluke: -30 };
    const S = stateBlend(a, idle, walk, antic, strike);
    const over = (P, w) => {
      if (w <= 0.001) return;
      for (const k of Object.keys(P)) S[k] += (P[k] - S[k]) * w;
    };
    // A Keepsake Bubble: the bowl lifted to her lips, cheeks puffed, blown.
    const bub = window1(now, m.bubbleAt, 1.4, 0.2, 0.4);
    over({ lean: -4, head: -6, armN: 10, elbN: -80, armF: 10, elbF: -90, bowlX: 14, bowlY: 8, bowl: -14 }, bub);
    // The Tidal Strike: her free arm up, calling the water.
    const tide = window1(now, m.tideAt, 1.6, 0.25, 0.4);
    over({ lift: 6, lean: -8, head: -10, armN: -10, elbN: -50, bowlX: -3, lid: 6 }, tide);
    // Hugging her treasures: curled round the bowl, the lid tilting over her.
    const hug = m.mech?.hugging ? 1 : 0;
    over({ lift: -4, lean: 14, head: 16, armN: 40, elbN: -100, armF: 30, elbF: -110, bowlX: -2, bowlY: -4, bowl: 0, lid: 16, t1: 10, t2: 30 }, hug);
    // Dizzy once her tanks are opened.
    const dizzy = m.vulnUntil > now ? 1 : 0;
    over({ lean: Math.sin(now * 5) * 10, head: Math.sin(now * 5 + 1) * 12, lid: Math.sin(now * 5) * 6 }, dizzy);
    // The Great Wave: both arms flung up.
    if (m.slamming > now) over({ lift: 10, lean: -12, head: -14, armN: -10, elbN: -50, armF: -60, elbF: -40, bowlX: -3, bowlY: 0, bowl: 0, lid: -8, fluke: -110 }, 1);
    if (m.hp <= 0) over({ lift: -4, lean: 12, head: 20, armN: 40, elbN: -40, armF: 50, elbF: -40, lid: 10 }, 1);
    a.crBubble = bub;
    a.crHug = hug;
    a.crMood = m.hp <= 0 ? 'dead' : dizzy ? 'dizzy' : hug ? 'sleep' : bub > 0.3 ? 'shout' : tide > 0.3 || m.slamming > now ? 'angry' : peek > 0.4 || polish > 0.4 ? 'happy' : null;
    return S;
  },
  parts: [
    { name: 'clamJ', parent: null, at: (S) => [S.x, -CLAM_Y - S.hop], rot: (S) => S.rock * D2R },
    { name: 'waistJ', parent: 'clamJ', at: (S) => [WAIST[0], WAIST[1] - S.lift], rot: (S) => (S.lean - S.rock) * D2R },
    { name: 'headJ', parent: 'waistJ', at: () => NECK, rot: (S) => S.head * D2R },
    { name: 'elbowN', parent: 'upN', at: () => [UA, 0] },
    { name: 'elbowF', parent: 'upF', at: () => [UA, 0] },
    { name: 't1End', parent: 'tail1', at: () => [32, 0] },
    { name: 't2End', parent: 'tail2', at: () => [25, 0] },
    ...[0, 1].flatMap((pass) => {
      const i = pass;
      const tg = pass ? 'b' : '';
      const arm = (far) => {
        const k = far ? 'F' : 'N';
        const j = far ? 1 : 0;
        return [
          { name: `up${k}${tg}`, parent: 'waistJ', s: SP.UP[j][i], pivot: [2, 5], at: () => (far ? SHF : SHN), rot: (S) => S[`arm${k}`] * D2R },
          { name: `fore${k}${tg}`, parent: `elbow${k}`, s: SP.FORE[j][i], pivot: [2, 4], rot: (S) => S[`elb${k}`] * D2R },
        ];
      };
      return [
        { name: `lid${tg}`, parent: 'clamJ', s: SP.LID[i], pivot: [50, 80], at: () => [-4, -6], rot: (S) => S.lid * D2R },
        { name: `lockF${tg}`, parent: 'headJ', s: SP.LOCK[1][i], pivot: [8, 2], at: () => [-13, -16], soft: { key: 'lockF', dir: [0, 14], k: 70, c: 6, gain: 0.55, turn: 1, hang: 0.6, max: 18, flutter: 2.5, hz: 0.45 } },
        { name: `hairback${tg}`, parent: 'headJ', s: SP.BACK[i], pivot: [30, 26], at: () => [0, -18] },
        ...arm(true),
        { name: `bodice${tg}`, parent: 'waistJ', s: SP.BOD[i], pivot: [16, 28] },
        { name: `shell${tg}`, parent: 'clamJ', s: SP.SHELL[i], pivot: [50, 22] },
        { name: `tail1${tg}`, parent: 'waistJ', s: SP.T1[i], pivot: [3, 10], at: () => [2, 2], rot: (S) => (S.t1 - S.lean + S.rock) * D2R },
        { name: `tail2${tg}`, parent: 't1End', s: SP.T2[i], pivot: [2, 8], rot: (S) => S.t2 * D2R },
        { name: `fluke${tg}`, parent: 't2End', s: SP.FLUKE[i], pivot: [3, 12], rot: (S) => S.fluke * D2R, soft: { key: 'fluke', dir: [12, 0], k: 100, c: 6, gain: 0.4, turn: 0.8, max: 22 } },
        { name: `lockN${tg}`, parent: 'headJ', s: SP.LOCK[0][i], pivot: [8, 2], at: () => [11, -12], soft: { key: 'lockN', dir: [0, 14], k: 70, c: 6, gain: 0.55, turn: 1, hang: 0.6, max: 18, flutter: 2.5, hz: 0.45 } },
        { name: `head${tg}`, parent: 'headJ', s: SP.HEAD[i], pivot: [22, 58] },
        ...(pass ? [{ name: 'face', parent: 'headJ', s: (a) => crFace(a.face === 'sad' && !a.ph.atk ? 'sad' : moodOf(a, a.crMood)), pivot: [22, 58] }] : []),
        { name: `bowl${tg}`, parent: 'waistJ', s: SP.BOWL[i], pivot: [13, 20], at: (S) => [10 + S.bowlX, -2 - S.bowlY], rot: (S) => S.bowl * D2R },
        ...arm(false),
      ];
    }),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#10283a';
    ctx.beginPath();
    ctx.ellipse(6, -0.6, 50, 4.6, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  fx(ctx, m, a, S, mat) {
    // The little fish in her bowl, swimming round.
    const B = mat('bowl');
    const q = a.now * 1.1 + (m.uid % 5);
    const fx = Math.sin(q) * 5;
    const dirF = Math.cos(q) >= 0 ? 1 : -1;
    const [cx, cy] = at2(B, fx, -5 + Math.sin(q * 2.3) * 1.2);
    ctx.globalAlpha = a.alpha;
    ctx.fillStyle = '#ff9a3a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 2.8, 1.9, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - dirF * 2, cy);
    ctx.lineTo(cx - dirF * 4.6, cy - 1.8);
    ctx.lineTo(cx - dirF * 4.6, cy + 1.8);
    ctx.closePath();
    ctx.fill();
    dot(ctx, a, cx + dirF * 1.2, cy - 0.4, 0.5, 1, '#2a1a2e');
    if (m.hp <= 0) return;
    // Bubbles drifting up off her; a stream of them as she blows; glass shimmering round her
    // while she hugs her treasures.
    for (let k = 0; k < 3; k++) {
      const u = fr(a.t * 0.4 + k / 3);
      ctx.globalAlpha = a.alpha * Math.sin(u * Math.PI) * 0.6;
      ctx.strokeStyle = '#e8fcff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-14 + k * 14 + Math.sin(u * 6 + k) * 4, -110 - u * 40, 1.6 + u * 2, 0, TAU);
      ctx.stroke();
    }
    if (a.crBubble > 0.2) {
      const [bx, by] = at2(B, 6, -14);
      for (let k = 0; k < 4; k++) {
        const u = fr(a.now * 1.4 + k / 4);
        ctx.globalAlpha = a.alpha * a.crBubble * (1 - u);
        ctx.strokeStyle = '#e8fcff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bx + u * 26, by - u * 10, 2 + u * 6, 0, TAU);
        ctx.stroke();
      }
    }
    if (a.crHug > 0) {
      ctx.globalAlpha = a.alpha * (0.35 + 0.1 * Math.sin(a.now * 3));
      ctx.strokeStyle = '#bff0ff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, -52, 56, 60, 0, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 4; k++) sparkle(ctx, a, Math.cos(a.now + k * 1.6) * 54, -52 + Math.sin(a.now + k * 1.6) * 56, 3, 0.8);
    }
  },
});
// A still of her on her throne (for anywhere a sprite is wanted), her mood's face.
export function coralieStill(pose, f, mood) {
  const cy = -CLAM_Y;
  const [wx, wy] = [WAIST[0], cy + WAIST[1]];
  const [hx, hy] = [wx + NECK[0], wy + NECK[1]];
  const t1 = 14;
  const t2 = 38;
  const [ex, ey] = [wx + 2 + Math.cos(t1 * D2R) * 32, wy + 2 + Math.sin(t1 * D2R) * 32];
  const [fx, fy] = [ex + Math.cos((t1 + t2) * D2R) * 25, ey + Math.sin((t1 + t2) * D2R) * 25];
  const arm = (far, ang, elb) => {
    const [sx, sy] = far ? SHF : SHN;
    const [bx, by] = [wx + sx + Math.cos(ang * D2R) * UA, wy + sy + Math.sin(ang * D2R) * UA];
    return [...put(upP(far)(), [2, 5], wx + sx, wy + sy, ang), ...put(foreP(far)(), [2, 4], bx, by, ang + elb)];
  };
  return {
    w: 140,
    h: 170,
    res: 2,
    shapes: shift([
      ...put(lidP(), [50, 80], -4, cy - 6), ...put(lockP(true)(), [8, 2], hx - 13, hy - 16), ...put(hairBackP(), [30, 26], hx, hy - 18),
      ...arm(true, 60, -70), ...put(bodiceP(), [16, 28], wx, wy), ...put(shellP(), [50, 22], 0, cy),
      ...put(tail1P(), [3, 10], wx + 2, wy + 2, t1), ...put(tail2P(), [2, 8], ex, ey, t1 + t2), ...put(flukeP(), [3, 12], fx, fy, t1 + t2 - 70),
      ...put(lockP(false)(), [8, 2], hx + 11, hy - 12), ...put(headP(), [22, 58], hx, hy), ...put(crFaceShapes(MOODS.has(mood) || mood === 'sad' ? mood : 'idle'), [22, 58], hx, hy),
      ...put(bowlP(), [13, 20], wx + 10, wy - 2), ...arm(false, 70, -60),
    ], 70, 166),
  };
}
