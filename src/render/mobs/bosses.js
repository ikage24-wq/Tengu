// Monster art: Prismaris, the Crystal King (crystalking). Redesigned 2026-11-06 in the chibi
// creature style of the dungeon bosses (Gnarlroot, Tuskar, the Myconid Queen): the old angular,
// plated dragon read as a machine beside them and his face was lost at game size.
//
// Now a round, pear-shaped little dragon king standing on stubby feet: lilac scales over a cream
// scaled belly, a big round head with a soft snout and a big face (ice-blue eyes) that holds the
// strongest contrast, small crystal horns and fins, a gold crown a size too big for him, a plum
// royal cape with an ermine collar, little rounded crystal wings, crystal spines down his back and
// tail, and the prism scepter. He's pompous and secretly scared of the dark (he's been drinking
// the island's light): his idle is a royal sway with the scepter held just so.
//
// One build serves both the live rig and the still frames: each piece is drawn round its own
// pivot, and the skeleton (`BONES`) places them, by sprite for the rig and by shape for the frames.
// The slam: he rises onto his toes with the scepter wound high behind his crown (the floor glows
// where it'll land), swings it over in one arc and smashes it into the floor in front of him, and
// crystals burst up there. Faces right, feet on the floor.

import { E, T, F, R, mix, ramp, crescent, shine, TAU, O, arcPts, limb, spin, move, strand, star, cuteFace, blob } from './critter.js';
import { part, makeRig, stateBlend } from './rig.js';

// ---------- Colours ----------

const PK = {
  scale: ramp('#b2a0f0', { step: 10, turn: 12, sat: -4 }),
  far: ramp('#9686dc', { step: 10, turn: 12, sat: -4 }),
  belly: ramp('#f6eeff', { step: 7, turn: 10, sat: -6 }),
  gold: ramp('#ffd36b', { step: 11, turn: 10 }),
  cape: ramp('#8a58c0', { step: 10, turn: 10 }),
  ermine: '#fffaf4',
  // Crystal tones: [the face toward the light (darkest), body, the far face (glowing), glint].
  ice: ['#5aa6dc', '#9fe3f8', '#dffaff', '#ffffff'],
  rose: ['#c25ba6', '#f2a0d4', '#ffe0f2', '#ffffff'],
  lilac: ['#7d6bd6', '#b9a8ff', '#ece6ff', '#ffffff'],
};
const IRIS = '#3fb8e8';
const LIGHT = [0.6, -0.8];

// ---------- Crystal ----------

// A crystal shard from (x, y) toward angle a (radians): the facet facing the light darkest, the far
// facet glowing, a glint on the lit edge near the tip; outlined in a deep shade of its own colour.
function prism(x, y, a, len, w, K, glint = true) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const q = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  const lit = -s * LIGHT[0] + c * LIGHT[1] > 0 ? 1 : -1;
  const out = [T([q(0, -w), q(len * 0.62, -w), q(len, 0), q(len * 0.62, w), q(0, w)], K[1])];
  out.push(F(T([q(0, lit * w), q(len * 0.62, lit * w), q(len, 0), q(0, lit * w * 0.12)], K[0])));
  out.push(F(T([q(len * 0.12, -lit * w * 0.8), q(len * 0.58, -lit * w * 0.8), q(len * 0.86, -lit * w * 0.14), q(len * 0.12, -lit * w * 0.22)], K[2])));
  if (glint) out.push(F(T([q(len * 0.5, lit * w * 0.85), q(len * 0.74, lit * w * 0.4), q(len * 0.56, lit * w * 0.38)], K[3])));
  return out;
}
// A round gem set in gold work: dark toward the light, glowing on the far side, a glint.
const gem = (x, y, r, K) => [O(x, y, r, r, 0, K[1], 12), F(O(x + r * 0.28, y - r * 0.3, r * 0.6, r * 0.5, 0, K[0], 10)), F(O(x - r * 0.3, y + r * 0.35, r * 0.45, r * 0.35, 0, K[2], 8)), F(E(x + r * 0.32, y - r * 0.42, Math.max(0.45, r * 0.24), Math.max(0.45, r * 0.24), K[3]))];
// A gem pane of a wing from the wrist A out between finger tips B and C, its trailing edge
// scalloped in between (`bulge` < 0) like a dragon's wing.
function petal(A, B, C, K, bulge = -0.14) {
  const M = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2];
  const out0 = [M[0] + (M[0] - A[0]) * bulge, M[1] + (M[1] - A[1]) * bulge];
  const edge = [B, [B[0] * 0.5 + out0[0] * 0.5, B[1] * 0.5 + out0[1] * 0.5], out0, [C[0] * 0.5 + out0[0] * 0.5, C[1] * 0.5 + out0[1] * 0.5], C];
  const m = (U, V, t) => [U[0] + (V[0] - U[0]) * t, U[1] + (V[1] - U[1]) * t];
  return [
    T([A, ...edge], K[1]),
    // (The half toward the light is the darker facet, the far half glows, a band of glow inside
    // the rim, one straight glint along the leading edge.)
    F(T([A, B, edge[1], out0], mix(K[0], K[1], 0.4))),
    F(T([m(A, out0, 0.6), out0, edge[3], C, m(A, C, 0.66)], K[2])),
    F(T([m(A, B, 0.45), m(A, B, 0.85), m(m(A, B, 0.85), out0, 0.14), m(m(A, B, 0.45), out0, 0.1)], K[3])),
  ];
}

// ---------- The pieces, each round its own pivot ----------
// Coordinates in each builder are relative to the pivot (the joint it turns on); `BOX` gives each
// piece's sprite box and where the pivot sits in it.

// The body: hips at (0, 0), a pear of lilac scales rising to the shoulders at about y -44, the cream
// belly with soft scale bands, the far paw resting on the belly, crystal spines down the back.
function pkBody() {
  const S = PK.scale;
  const B = PK.belly;
  const out = [];
  // Crystal spines down the back, behind the body (largest at the shoulders).
  [[-16, -46, -2.3, 11, 3.2, PK.ice], [-22, -36, -2.6, 12, 3.4, PK.rose], [-25, -24, -2.85, 11, 3.2, PK.ice], [-25, -12, -3.05, 9, 2.8, PK.lilac]].forEach(([x, y, a, l, w, K]) => out.push(...prism(x, y, a, l, w, K)));
  // The pear: a round belly-heavy bottom and narrower shoulders.
  out.push(O(0, -30, 19, 18, 0, S.base, 22), O(0, -16, 25, 19, 0, S.base, 24));
  out.push(crescent(0, -16, 25, 19, S.sh, { k: 0.28, a0: 40, a1: 215 }), crescent(0, -31, 19, 18, S.sh, { k: 0.3, a0: 120, a1: 215 }));
  out.push(shine(2, -30, 19, 18, S.hi, 0, 1));
  // The belly: cream, with three soft scale bands curving across it.
  out.push(F(O(8, -20, 15, 20, -6, B.base, 22)), F(crescent(8, -20, 15, 20, B.sh, { k: 0.3, a0: 50, a1: 190, rot: -6 })));
  for (const [y, w] of [[-30, 10], [-21, 13], [-12, 12]]) out.push(F(strand(arcPts(9, y - 4, w, 4, 30, 150, 8), 0.7, B.sh)));
  out.push(F(O(12, -27, 4, 6, -10, mix(B.base, '#ffffff', 0.6), 12)));
  // The far paw, resting on his belly (a very royal pose): a little round paw with crystal claws.
  out.push(...limb([-10, -30], [-2, -25], 5.4, 5, PK.far.base), O(0, -24.6, 4.6, 4, 0, PK.far.base, 14), F(crescent(0, -24.6, 4.6, 4, PK.far.sh, { k: 0.3, a0: 40, a1: 180 })));
  for (const [dx, dy] of [[3.6, -26.4], [4.4, -23.6]]) out.push(...prism(dx, dy, 0.25, 3, 1, PK.ice, false));
  return out;
}

// The cape behind him: hung from the back of his neck (0, 0), flaring down his back.
function pkCape() {
  const C = PK.cape;
  const out = [T([[2, -2], [-8, 0], [-18, 14], [-26, 32], [-24, 40], [-16, 37], [-8, 41], [0, 36], [6, 30]], C.base)];
  out.push(F(T([[-8, 0], [-18, 14], [-26, 32], [-24, 40], [-16, 37], [-14, 20]], C.sh)), F(T([[-24, 40], [-16, 37], [-8, 41], [-12, 28]], C.deep)));
  out.push(F(strand([[-4, 4], [-10, 18], [-14, 34]], 0.9, C.deep)), F(strand([[0, 6], [-2, 18], [-4, 32]], 1, C.hi)));
  return out;
}

// The ermine collar round his neck (0, 0): a white roll with little black tail spots, a gold clasp.
function pkCollar() {
  const out = [O(-2, 0, 15, 5.4, -8, PK.ermine, 18), F(crescent(-2, 0, 15, 5.4, '#e4dcec', { k: 0.3, a0: 30, a1: 200, rot: -8 }))];
  for (const [x, y] of [[-10, 0.6], [-3, 1.6], [4, 0.4], [10, -1.4]]) out.push(F(T([[x, y - 1.2], [x + 1, y + 0.6], [x - 1, y + 0.6]], '#3a2d4f')));
  out.push(...gem(8, 2.4, 1.8, PK.rose), F(strand(arcPts(8, 2.4, 2.4, 2.4, 0, 360, 10), 0.6, PK.gold.base)));
  return out;
}

// The head: the neck at (0, 0), the skull's middle at (4, -21); the face drawn as its own piece.
function pkHead() {
  const S = PK.scale;
  const out = [];
  // Crystal fins at the back of his head, and two little crystal horns sweeping back.
  out.push(...prism(-14, -26, -2.7, 10, 3, PK.lilac), ...prism(-12, -18, -2.95, 9, 2.6, PK.rose));
  out.push(...prism(-6, -36, -2.05, 10, 2.6, PK.ice), ...prism(4, -38, -1.85, 9, 2.4, PK.ice));
  // The skull, round and big; the soft muzzle in front.
  out.push(O(2, -21, 21, 19, 0, S.base, 24), crescent(2, -21, 21, 19, S.sh, { k: 0.28, a0: 40, a1: 205 }));
  out.push(O(17, -14, 10, 8, 0, S.base, 18), F(crescent(17, -14, 10, 8, S.sh, { k: 0.3, a0: 30, a1: 160 })));
  out.push(shine(2, -21, 21, 19, S.hi, 0, 1), F(O(19, -18, 4, 2, -10, S.hi, 10)));
  // A cream chin, a nostril, a few scales at the brow.
  out.push(F(O(12, -7.6, 9, 3.2, -4, PK.belly.base, 14)), F(E(24.4, -15.2, 0.9, 0.7, S.deep)));
  for (const [x, y] of [[-6, -34], [-1, -36.4], [-10, -30]]) out.push(F(strand(arcPts(x, y, 2.6, 1.6, 200, 340, 5), 0.6, S.sh)));
  return out;
}
const pkFace = (mood, atk) => cuteFace(8, -21, 3.1, mood, { iris: IRIS, gap: 6.4, atk, skin: PK.scale.base, mouthDy: 3.4, lash: 1.1 });

// The crown: its base's middle at (0, 0), a size too big for him, three points with gems.
function pkCrown() {
  const G = PK.gold;
  const out = [T([[-9, 0], [-10, -8], [-6, -4], [-3, -11], [0, -5], [3.4, -12], [6, -4], [10, -9], [9.4, 0]], G.base)];
  out.push(F(T([[-9, 0], [-10, -8], [-6, -4], [-5, 0]], G.sh)), F(R(-9, -1.6, 18.4, 1.6, G.sh)), F(strand([[-7, -2.6], [7, -2.6]], 0.7, G.hi)));
  out.push(...gem(-3, -8.6, 1.3, PK.ice), ...gem(3.4, -9.4, 1.5, PK.rose), ...gem(0.2, -2.4, 1.2, PK.ice));
  return out;
}

// The near arm from the shoulder (0, 0), hanging down along +y: a chubby limb and a round paw.
function pkArm() {
  const S = PK.scale;
  return [...limb([0, 0], [0, 13], 8, 6.4, S.base), F(strand([[-2.6, 1], [-2.4, 11]], 1, S.sh)), O(0, 15, 4.6, 4.2, 0, S.base, 14), F(crescent(0, 15, 4.6, 4.2, S.sh, { k: 0.3, a0: 40, a1: 180 }))];
}
// The far arm's hand is on his belly (drawn with the body), so there's no far arm piece.

// The scepter from the grip (0, 0), pointing up (-y): held high up its gold staff, so the prism
// rides just above his paw (clear of his face) and the staff hangs below with a pom at its end.
function pkScepter() {
  const G = PK.gold;
  const out = [...limb([0, 24], [0, -13], 2.6, 2.4, G.base), F(strand([[0.8, 23], [0.8, -12]], 0.7, G.hi)), O(0, 25, 2.8, 2.8, 0, G.base, 10), F(E(-0.8, 24.2, 1, 1, G.hi))];
  out.push(T([[-4, -13], [0, -16], [4, -13], [2.6, -11], [-2.6, -11]], G.sh));
  out.push(...prism(0, -14, -Math.PI / 2, 15, 4.6, PK.ice));
  return out;
}

// A wing from its root on his upper back (0, 0): the arm rises to a high wrist with a little gold
// claw, three finger spars sweep back and down from it, and gem panes hang between them with a
// scalloped trailing edge, the last one meeting his back. `far` dims it (it sits deeper behind).
function pkWing(far) {
  const dim = (K) => (far ? K.map((c, i) => (i === 3 ? mix(c, '#d8d0ff', 0.4) : mix(c, '#7a6ac8', 0.3))) : K);
  const Sc = far ? PK.far : PK.scale;
  const El = [-5, -18];
  const W = [-12, -36];
  const tips = [[-34, -42], [-44, -26], [-38, -9], [-10, -2]];
  const out = [];
  out.push(...petal(W, tips[0], tips[1], dim(PK.ice)), ...petal(W, tips[1], tips[2], dim(PK.rose)), ...petal(W, tips[2], tips[3], dim(PK.lilac), -0.1));
  for (const tip of tips.slice(0, 3)) out.push(...limb(W, tip, 2.6, 1.2, Sc.sh));
  out.push(...limb([0, 0], El, 4.6, 3.8, Sc.base), ...limb(El, W, 3.8, 3, Sc.base));
  out.push(T([[W[0] - 1.4, W[1] - 1], [W[0] + 1.6, W[1] - 6], [W[0] + 1.8, W[1] - 0.4]], PK.gold.base), O(W[0], W[1], 2.2, 2.2, 0, PK.gold.base, 10));
  return out;
}

// A foot planted on the floor, the sole's middle at (0, 0): a round thigh above, the foot with three
// toes and little crystal claws.
function pkLeg(far) {
  const S = far ? PK.far : PK.scale;
  return [
    O(-1, -9, 8.4, 8, 0, S.base, 16), F(crescent(-1, -9, 8.4, 8, S.sh, { k: 0.3, a0: 40, a1: 210 })),
    O(2.4, -3.4, 9, 3.8, 0, S.base, 16), F(R(-6, -1, 17, 1, S.sh)),
    ...[5.6, 8.6, 10.6].flatMap((x, i) => [O(x, -2.4 + i * 0.3, 2.2, 2.2, 0, S.base, 10), ...prism(x + 1.4, -1.4 + i * 0.3, 0.2, 3, 1, PK.ice, false)]),
  ];
}

// A tail segment along +x from its joint (0, 0), tapering w0 to w1, with a crystal spine on top.
function pkTailSeg(i, len, w0, w1) {
  const S = PK.scale;
  const out = [];
  if (i < 2) out.push(...prism(len * 0.4, -w0 * 0.42, -Math.PI / 2 - 0.5, [8, 6.4][i], [2.4, 2][i], i ? PK.rose : PK.ice, true));
  out.push(...limb([0, 0], [len, 0], w0, w1, S.base), F(strand([[1, w0 * 0.3], [len, w1 * 0.3]], Math.max(1, w1 * 0.5), S.sh)));
  return out;
}
// The tail's tip: a little crystal cluster.
const pkTailTip = () => [...prism(0, 0, -0.5, 9, 2.6, PK.rose), ...prism(0, 0, 0.35, 8, 2.4, PK.lilac), ...prism(0, 0, -0.05, 11, 3, PK.ice)];

// Sprite boxes: [w, h, pivot x, pivot y] (the pivot is the builder's (0, 0)).
const BOX = {
  body: [70, 78, 34, 66],
  cape: [40, 50, 30, 6],
  collar: [36, 14, 18, 7],
  head: [74, 64, 30, 48],
  face: [40, 30, 12, 36],
  crown: [26, 18, 12, 15],
  arm: [14, 24, 7, 4],
  scepter: [20, 60, 10, 32],
  wing: [56, 52, 48, 48],
  leg: [32, 22, 12, 19],
  tail: [26, 22, 4, 12],
  tailTip: [18, 18, 3, 10],
};
const TAIL = [[11, 11, 8], [10, 8, 5.4], [8, 5.4, 3.4]];

// Shapes for a piece (with the pose's face).
function shapesOf(name, a = {}) {
  if (name === 'body') return pkBody();
  if (name === 'cape') return pkCape();
  if (name === 'collar') return pkCollar();
  if (name === 'head') return pkHead();
  if (name === 'face') return pkFace(a.face ?? 'idle', a.atk ?? 0);
  if (name === 'crown') return pkCrown();
  if (name === 'arm') return pkArm();
  if (name === 'scepter') return pkScepter();
  if (name === 'wingF') return pkWing(true);
  if (name === 'wingN') return pkWing(false);
  if (name === 'legF') return pkLeg(true);
  if (name === 'legN') return pkLeg(false);
  if (name.startsWith('t') && name.length === 2) {
    const i = Number(name[1]);
    return pkTailSeg(i, ...TAIL[i]);
  }
  if (name === 'tailTip') return pkTailTip();
  return [];
}
const boxOf = (name) => BOX[name] ?? BOX[{ wingF: 'wing', wingN: 'wing', legF: 'leg', legN: 'leg', t0: 'tail', t1: 'tail', t2: 'tail' }[name]];

// ---------- The skeleton ----------
// Pose channels: by (body up/down), pitch (body lean, + forward), headA, arm (the near arm, 0
// hanging, - forward), sw (the scepter's angle in the world, 0 upright, + its top forward), flap
// (wings, - up), cape, crown, t0..t2 (tail), and the feet: fFx, fFy, fNx, fNy (foot offsets).
// Rig space: the floor at y 0 under his middle.

const HIP_Y = -12;
const BONES = [
  { name: 'legF', at: (S) => [-7 + S.fFx, S.fFy] },
  { name: 'body', at: (S) => [0, HIP_Y + S.by], rot: (S) => S.pitch },
  { name: 't0', parent: 'body', at: () => [-20, -6], rot: (S) => S.t0 },
  { name: 't1', parent: 't0', at: () => [TAIL[0][0], 0], rot: (S) => S.t1 },
  { name: 't2', parent: 't1', at: () => [TAIL[1][0], 0], rot: (S) => S.t2 },
  { name: 'tailTip', parent: 't2', at: () => [TAIL[2][0], 0], rot: () => 0.2 },
  { name: 'wingF', parent: 'body', at: () => [-6, -42], rot: (S) => -0.18 + S.flap * 0.8 },
  { name: 'cape', parent: 'body', at: () => [-4, -44], rot: (S) => S.cape },
  { name: 'wingN', parent: 'body', at: () => [-12, -40], rot: (S) => S.flap },
  { name: 'bodyS', parent: 'body', piece: 'body' },
  { name: 'legN', at: (S) => [7 + S.fNx, S.fNy] },
  { name: 'collar', parent: 'body', at: () => [4, -44] },
  { name: 'head', parent: 'body', at: () => [5, -45], rot: (S) => S.headA - S.pitch * 0.6 },
  { name: 'face', parent: 'head' },
  { name: 'crown', parent: 'head', at: () => [1, -39], rot: (S) => -0.12 + S.crown },
  { name: 'arm', parent: 'body', at: () => [12, -36], rot: (S) => S.arm },
  // (The scepter rides the paw, its angle held in the world, so it stays upright as he sways.)
  { name: 'scepter', parent: 'arm', at: () => [0, 15], rot: (S) => S.sw - S.arm - S.pitch },
];

// The slam's floor point (rig space), where the scepter's crystal lands.
const SLAM_X = 52;

// Every channel's pose, from the boss's moves.
function posePK(a) {
  const t = a.t;
  const b = Math.sin(t * 2);
  // A royal sway at rest: breathing in slowly, the scepter held just so, a glance about now and then.
  const idle = { by: -0.8 * b, pitch: 0.02 * Math.sin(t * 1.1), headA: 0.05 * Math.sin(t * 0.7 - 1) + 0.04 * Math.max(0, Math.sin(t * 0.31)) ** 8, arm: -1.0 + 0.04 * Math.sin(t * 1.1 - 0.5), sw: 0.3, flap: 0.05 * Math.sin(t * 1.2 - 1.6) };
  // The walk: a waddle on stubby feet, rocking side to side, wings fluttering.
  const s = Math.sin(a.wp);
  const walk = { by: -Math.abs(Math.cos(a.wp)) * 2.2, pitch: 0.04 + s * 0.04, headA: -s * 0.05, arm: -1.0 + s * 0.1, sw: 0.3 + s * 0.06, flap: 0.12 * Math.sin(a.wp * 2) };
  // The wind-up: up on his toes, leaning back, the scepter wound back with its crystal tipped over
  // his shoulder (his paw stays low behind his collar: raised, it would cross his big face), wings
  // flared, trembling with it as the slam comes.
  const sh = Math.sin(t * 40) * 0.03 * a.ph.antic * a.ph.antic;
  const antic = { by: -5, pitch: -0.16 + sh, headA: -0.18, arm: 1.3, sw: -0.95 + sh * 2, flap: -0.5 };
  // The slam: lunging over into it, the scepter brought down in one arc, its crystal smashed into
  // the floor in front of him, wings snapping forward.
  const strike = { by: 7, pitch: 0.42, headA: 0.1, arm: -1.05, sw: 2.55, flap: 0.3 };
  return stateBlend(a, idle, walk, antic, strike);
}

// Where a foot sits as he walks: planted for half the step cycle (sliding back under him exactly
// as far as he moves, so it stays put on the floor), then lifted and carried forward.
const STRIDE = 30;
function footAt(a, off) {
  const u = ((a.wp / TAU + off) % 1 + 1) % 1;
  const w = a.walkW;
  if (u < 0.5) return [(0.25 - u) * STRIDE * w, 0];
  const v = (u - 0.5) * 2;
  const e = v * v * (3 - 2 * v);
  return [(-0.25 + e * 0.5) * STRIDE * w, -Math.sin(v * Math.PI) * 4 * w];
}

// ---------- The rig ----------

const pkPart = (name, face, atk) => {
  const piece = name === 'bodyS' ? 'body' : name;
  const [w, h, ox, oy] = boxOf(piece);
  const key = piece === 'face' ? `face|${face}|${atk}` : piece;
  return part(`pking|${key}`, w, h, () => move(shapesOf(piece, { face, atk }), ox, oy), 6, 2);
};

const crystalRig = makeRig({
  w: 100,
  h: 130,
  stride: STRIDE,
  fast: ['by', 'pitch', 'headA', 'arm', 'sw', 'flap'],
  kick: { pitch: -1.6, crown: 5, flap: -2.4, headA: -1.2 },
  springs: { arm: [260, 22], sw: [240, 21], crown: [90, 5], cape: [60, 5], t0: [90, 8], t1: [70, 6], t2: [55, 5] },
  pose(m, a) {
    const P = posePK(a);
    const [fx0, fy0] = footAt(a, 0);
    const [fx1, fy1] = footAt(a, 0.5);
    return { ...P, fFx: fx0, fFy: fy0, fNx: fx1, fNy: fy1 };
  },
  follow: (S, a) => {
    const w = (k) => 0.08 * Math.sin(a.t * 1.6 - k * 0.8);
    return {
      // The crown lags his head (and hops when he's hit); the cape trails his lean; the tail swishes
      // a beat behind.
      crown: -S.headA * 0.5 - S.pitch * 0.3,
      cape: -S.pitch * 0.7 + Math.max(0, -S.by) * 0.01,
      t0: 2.75 - S.pitch * 0.9 + w(0),
      t1: -0.35 + w(1),
      t2: -0.4 + w(2),
    };
  },
  parts: BONES.map((B) => ({
    name: B.name,
    parent: B.parent,
    pivot: boxOf(B.piece ?? B.name).slice(2),
    at: B.at,
    rot: B.rot,
    // (The body bone is a bare joint: its sprite is drawn later, as bodyS, over the wings and cape.)
    s: B.name === 'body' ? undefined : (a) => pkPart(B.name, a.face, a.atk),
  })),
  fx(ctx, m, a, S, mat) {
    // The prism charging as he winds up: a sparkle swelling on its tip.
    if (a.ph.antic > 0.15 && m.hp > 0) {
      const k = a.ph.antic;
      const r = 2 + k * 5 + Math.sin(a.t * 18) * 0.8 * k;
      ctx.save();
      ctx.transform(...mat('scepter'));
      ctx.translate(0, -29);
      ctx.rotate(a.t * 2);
      ctx.globalAlpha = a.alpha * Math.min(1, k * 1.4);
      for (const [rr, c] of [[r + 1.2, '#5aa6dc'], [r, '#ffffff']]) {
        const w = rr * 0.28;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, -rr);
        ctx.lineTo(w, -w);
        ctx.lineTo(rr, 0);
        ctx.lineTo(w, w);
        ctx.lineTo(0, rr);
        ctx.lineTo(-w, w);
        ctx.lineTo(-rr, 0);
        ctx.lineTo(-w, -w);
        ctx.fill();
      }
      ctx.restore();
    }
    // The floor glowing where the slam will land.
    if (a.ph.antic > 0.2) {
      ctx.globalAlpha = a.alpha * a.ph.antic * 0.6;
      ctx.fillStyle = '#dffaff';
      ctx.beginPath();
      ctx.ellipse(SLAM_X, -1, 9 + a.ph.antic * 7, 2 + a.ph.antic, 0, 0, TAU);
      ctx.fill();
    }
    // Crystals bursting up from the floor where the scepter strikes.
    if (a.ph.since >= 0 && a.ph.since < 0.7) {
      const u = a.ph.since / 0.7;
      const g = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
      for (const [ox, ang, l, c] of [[-20, -0.5, 12, '#9fe3f8'], [-11, -0.25, 18, '#b9a8ff'], [-3, 0, 22, '#9fe3f8'], [8, 0.2, 16, '#f2a0d4'], [16, 0.45, 10, '#9fe3f8']]) {
        const len = l * g;
        if (len < 2) continue;
        const d = -Math.PI / 2 + ang;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = '#5a6ac8';
        ctx.beginPath();
        ctx.moveTo(SLAM_X + ox - 3, 0.5);
        ctx.lineTo(SLAM_X + ox + Math.cos(d) * (len + 1), Math.sin(d) * (len + 1));
        ctx.lineTo(SLAM_X + ox + 3, 0.5);
        ctx.fill();
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(SLAM_X + ox - 2.2, 0);
        ctx.lineTo(SLAM_X + ox + Math.cos(d) * len, Math.sin(d) * len);
        ctx.lineTo(SLAM_X + ox + 2.2, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(SLAM_X + ox + Math.cos(d) * len * 0.6 - 0.5, Math.sin(d) * len * 0.6, 1, 2);
      }
    }
  },
});

// ---------- The still frames (the same skeleton, posed per frame) ----------

const FRAME_ATK = [
  { antic: 0.5, strike: 0, since: -1 },
  { antic: 1, strike: 0, since: -1 },
  { antic: 0, strike: 1, since: 0.05 },
  { antic: 0, strike: 1, since: 0.2 },
  { antic: 0, strike: 0.35, since: 0.5 },
];

function dragon(pose, f, mood) {
  const n = pose === 'walk' ? 8 : pose === 'attack' ? 5 : 6;
  const q = f / n;
  const att = pose === 'attack' ? FRAME_ATK[Math.min(4, Math.floor(f))] : null;
  const walk = pose === 'walk';
  const dead = mood === 'dead';
  const a = { t: q * TAU / 2, wp: walk ? q * TAU : 0, walkW: walk ? 1 : 0, ph: att ?? { antic: 0, strike: 0, since: -1 }, face: dead ? 'dead' : att && f >= 1 && f < 4 ? 'angry' : mood, atk: att && f >= 1 && f < 4 ? 1 : 0 };
  const P = posePK(a);
  const [fx0, fy0] = footAt(a, 0);
  const [fx1, fy1] = footAt(a, 0.5);
  const S = { ...P, fFx: fx0, fFy: fy0, fNx: fx1, fNy: fy1, crown: -P.headA * 0.5, cape: -P.pitch * 0.7, t0: 2.75 - P.pitch * 0.9, t1: -0.35 + 0.08 * Math.sin(q * TAU), t2: -0.4 + 0.08 * Math.sin(q * TAU - 0.8) };
  if (dead) Object.assign(S, { pitch: -0.25, headA: 0.3, arm: -0.2, sw: 1.2, flap: 0.4, by: 2 });
  // Each bone's place: its parent's, moved and turned (the shapes follow by position and angle).
  const mats = {};
  const out = [];
  const W = 150;
  const FLOOR = 146;
  for (const B of BONES) {
    const base = B.parent ? mats[B.parent] : { x: W / 2, y: FLOOR, r: 0 };
    const [x, y] = B.at ? B.at(S) : [0, 0];
    const c = Math.cos(base.r);
    const s = Math.sin(base.r);
    const m = { x: base.x + x * c - y * s, y: base.y + x * s + y * c, r: base.r + (B.rot ? B.rot(S) : 0) };
    mats[B.name] = m;
    if (B.name === 'body') continue;
    out.push(...move(spin(shapesOf(B.piece ?? B.name, a), 0, 0, (m.r * 180) / Math.PI), m.x, m.y));
  }
  if (att?.since >= 0 && att.since < 0.3) out.push(...star(W / 2 + SLAM_X, FLOOR - 4, 8, '#dffaff'));
  return { w: W, h: 150, res: 3, shapes: out };
}

export const ART = {
  crystalking: { pad: 12, walk: 8, idle: 6, attack: 5, stride: STRIDE, atkMs: [80, 150, 450, 240], draw: dragon, rig: crystalRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  crystalking: { name: 'Prismaris, the Crystal King', w: 100, h: 130 },
};
