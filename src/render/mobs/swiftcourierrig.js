// The Sky Harpy, remade 2026-11-20 (the player's pick "Swift Courier"): a sleek little swift, navy
// with a red face and a cream chest, in a green postie cap, a satchel of letters on its hip, darting
// about the Harpy Roost. A flyer: drawn round its hover point. Live rig, outer outline only, the face
// bare, no squash.
//
// How it moves:
//   idle    a 9 s act: hovering on quick wingbeats; peeking into its satchel; a loop-the-loop.
//   walk    darting along, wings beating hard, the satchel swinging.
//   fight   it pulls up, wings raised; then dive-bombs you in a flurry of letters.
//   hit     knocked tumbling back a little, the cap askew.
//   dead    it flops over, wings limp, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.75;
const NAVY = '#2c3a7a';
const GOLD = '#f2c860';
const sc = pairOf('swiftc');

const smoothPts = (pts, n = 2) => {
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
const blob = (pts, c, n = 2) => T(smoothPts(pts, n), c);
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);

// ---------- Parts ----------
// The forked tail. Box 20 x 14; its root (18, 6) = (18, 40).
const tailP = () => at([T([[18, 38], [4, 34], [10, 38], [2, 44], [18, 42]], NAVY)], [18, 40], [18, 6]);
// A wing. Box 24 x 12; its root (2, 7).
const wingP = (c, tip) => () => at([
  blob([[0, 0], [8, -6], [20, -3.6], [18, 2.4], [10, 4], [0, 3]], c), F(blob([[12.4, -4.4], [20, -3.6], [18, 2], [13.2, 1.2]], tip, 1)),
], [0, 0], [2, 7]);
// The body: navy, a cream chest. Box 28 x 20; its middle (14, 10) = (30, 36).
const bodyP = () => at([blob([[18, 34], [32, 28], [42, 32], [40, 42], [26, 44]], NAVY), F(blob([[26, 38], [38, 35], [40, 41], [28, 44]], '#fff4e4', 1))], [30, 36], [14, 10]);
// The satchel on its strap, a letter peeking out. Box 16 x 22; the strap's top (14, 2) = (30, 34).
const satchelP = () => at([
  taper([[30, 34], [24, 46]], 1.2, 1.2, '#8a5a3a'), blob([[18, 44], [28, 44], [29, 52], [17, 52]], '#c8905a', 1), F(R(17.4, 46, 11, 1.4, '#a06a3a')),
  T([[21, 43], [27, 42], [26, 46], [20, 46]], '#ffffff'), F(T([[21, 43], [24, 45], [27, 42]], '#e0e0ea')),
], [30, 34], [14, 2]);
// The head: red face, a little black beak, the green postie cap. Box 26 x 22; its middle (10, 12) = (40, 28).
const headP = () => at([
  E(40, 28, 9, 8.4, NAVY), F(blob([[40, 30], [47, 28], [48, 33], [42, 35]], '#e8584a', 1)), T([[47, 27], [53, 28.6], [47, 30.6]], '#2a2a3a'),
  blob([[32, 22], [34, 18], [42, 17], [47, 21], [40, 21]], '#5a8a5a', 1), F(R(34, 20.4, 10, 1.4, GOLD)),
], [40, 28], [10, 12]);
const PR = {
  TAIL: sc('tail', 20, 14, tailP, 3, 3), WINGF: sc('wingF', 24, 12, wingP('#4a5aa8', '#7a8ad0'), 3, 3), WINGN: sc('wingN', 24, 12, wingP('#5a6ab8', '#8a9ae0'), 3, 3),
  BODY: sc('body', 28, 20, bodyP, 3, 3), SATCHEL: sc('satchel', 16, 22, satchelP, 3, 3), HEAD: sc('head', 26, 22, headP, 3, 3),
};
// ---------- Its own face (side on): a keen courier. A sharp white almond eye on the navy head,
// the pupil fixed ahead where it is going, a little speed flick at the back corner; the tiny beak
// opens to chirp or shriek. ----------
const WDARK = '#1a1a2e';
const WPALE = '#dfe6ff';
const ln = (pts, w, c = WDARK) => [F(taper(pts, w, w * 0.85, c))];
const beakOpen = (gape) => [
  F(T([[17.2, 12.4], [22.6, 12.6], [17.4, 13.8 + gape]], '#7a3040')),
  F(T([[17, 13.4 + gape], [22, 12.9 + gape * 0.6], [17.2, 15 + gape]], '#2a2a3a')),
];
const WE = [12.4, 11.2];
const swiftFaceShapes = (mood) => {
  const out = [];
  const [x, y] = WE;
  const angry = mood === 'angry';
  if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln([[x - 1.9, y + 0.3], [x, y + 0.7], [x + 1.8, y + 0.2]], 0.6, WPALE));
  else if (mood === 'happy') out.push(...ln(arcP(x, y + 0.9, 1.7, 1.4, 200, 340, 8), 0.65, WPALE));
  else if (mood === 'hurt') out.push(...ln([[x - 1.4, y - 1.2], [x + 1.1, y], [x - 1.4, y + 1.2]], 0.6, WPALE));
  else if (mood === 'dizzy') {
    const pts = [];
    for (let i = 0; i <= 12; i++) pts.push([x + Math.cos(i * 0.85) * (0.12 + i * 0.12), y + Math.sin(i * 0.85) * (0.12 + i * 0.12)]);
    out.push(...ln(pts, 0.42, WPALE));
  } else if (mood === 'shout') out.push(F(E(x, y, 1.7, 1.8, '#ffffff')), F(E(x + 0.4, y, 0.5, 0.55, WDARK)));
  else {
    // The almond: back corner flicked up and away, the front corner pointed toward the beak.
    const top = arcP(x, y + 0.5, 2.1, angry ? 1.3 : 2, 195, 345, 8);
    const bot = arcP(x, y - 0.1, 2, 1.4, 15, 165, 8);
    let pts = [...top, ...bot];
    if (angry) pts = pts.map(([px, py]) => [px, Math.max(py, y - 0.6 + (px - x) * 0.4)]);
    out.push(F(T(pts, '#ffffff')), F(E(x + 0.8, y + 0.1, 0.75, angry ? 0.7 : 0.95, WDARK)), F(E(x + 1.05, y - 0.3, 0.22, 0.22, '#ffffff')));
    out.push(...ln([[x - 2.6, y - 0.9], [x - 1.8, y - 0.1]], 0.5, WPALE));
  }
  if (mood === 'happy') out.push(...beakOpen(0.8));
  else if (mood === 'shout') out.push(...beakOpen(1.8));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...beakOpen(0.5));
  return out;
};
const swiftFace = (mood) => faceSprite(`swiftc|face|${mood}`, 26, 22, () => swiftFaceShapes(mood));

// The body's middle sits 12 above its hover point.
const BODY_Y = 12;

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [18, 6], at: () => [-12, 4], rot: (S) => S.tail * D2R },
    { name: `wingF${tag}`, parent: 'bodyJ', s: PR.WINGF[i], pivot: [2, 7], at: () => [-2, -2], rot: (S) => (-150 + S.wg) * D2R },
    { name: `satchel${tag}`, parent: 'bodyJ', s: PR.SATCHEL[i], pivot: [14, 2], at: () => [0, -2], rot: (S) => S.sat * D2R, soft: { key: 'satchel', dir: [-4, 16], k: 70, c: 5, gain: 0.8, turn: 0.6, max: 30 } },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [14, 10] },
    // The near wing goes behind the head, so it never hides the face.
    { name: `wingN${tag}`, parent: 'bodyJ', s: PR.WINGN[i], pivot: [2, 7], at: () => [4, -4], rot: (S) => (-30 - S.wg) * D2R },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [10, 12] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => swiftFace(MOODS.has(a.scMood) ? a.scMood : 'idle'), pivot: [10, 12] }] : []),
  ];
};

const sized = (rig, k) => {
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
const at2 = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];

// (Flyers are always "moving" to the game, so their idle acts would never play: go by how far it
// really travelled instead, and work out its own walk weight and calm from that.)
const flyGait = (m, a) => {
  const st = (a.mo.fly ??= { odo: m.odo ?? 0, w: 0, calm: 1, still: 9 });
  const v = Math.abs((m.odo ?? 0) - st.odo) / Math.max(a.dt, 1e-3);
  st.odo = m.odo ?? 0;
  const going = v > 6 ? 1 : 0;
  st.w += (going - st.w) * (1 - Math.exp(-a.dt * 4));
  st.still = going ? 0 : st.still + a.dt;
  const calm = !a.ph.atk && m.hp > 0 && (a.hurtAgo ?? 9) > 3 && st.still > 0.3 ? 1 : 0;
  st.calm += (calm - st.calm) * (1 - Math.exp(-a.dt * 3));
  a.walkW = st.w;
  a.calm = st.calm;
};

export const swiftCourierRig = sized(makeRig({
  w: 120, h: 90, soft: true, stride: 40, recover: 0.6,
  springs: { x: [200, 16], lift: [160, 12], tilt: [160, 12], hr: [160, 11], wg: [600, 20], tail: [140, 9], sat: [120, 8] },
  fast: ['x', 'lift', 'tilt'],
  kick: { tilt: -320, hr: -200, lift: 80 },
  turnKick: { tilt: 140, tail: 260 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 11) * 0.87;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: hovering on quick wingbeats; peeking into its satchel; a loop-the-loop.
    const peek = hold(lu, 2.2, 2.6, 3.6, 4) * calm;
    const flap = Math.sin(t * 18);
    const idle = {
      x: 0, lift: Math.sin(t * 2.4) * 1.8, tilt: -4 + Math.sin(t * 1.3) * 3 + peek * 14, hr: peek * 26, wg: flap * 34, tail: Math.sin(t * 2) * 6, sat: peek * -10,
    };
    // Darting along, wings beating hard.
    const walk = { x: 0, lift: Math.sin(t * 6) * 2.4, tilt: 8, hr: -6, wg: Math.sin(t * 22) * 44, tail: -6, sat: 10 };
    // Pulled up, wings raised; then the dive.
    const antic = { x: -4, lift: 8, tilt: -26, hr: -12, wg: -50, tail: 18, sat: -10 };
    const strike = { x: 14, lift: -6, tilt: 30, hr: 8, wg: 40, tail: -20, sat: 20 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // The loop-the-loop: one whole forward turn, wound forwards only (the spring wound on by a turn,
    // then both wound back together once it has got there).
    const lp = (a.mo.sc ??= { turns: 0, cyc: null });
    const cyc = Math.floor(t / 9);
    if (lu > 6.4 && lu < 6.6 && calm > 0.6 && lp.cyc !== cyc) {
      lp.cyc = cyc;
      lp.turns += 1;
    }
    const ts = a.mo.rig?.tilt;
    if (ts && lp.turns > 0 && Math.abs(ts.x - lp.turns * -360) < 8) {
      ts.x += lp.turns * 360;
      lp.turns = 0;
    }
    S.tilt -= lp.turns * 360;
    // Beaten: flopped over, wings limp.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -8, tilt: 160, hr: 20, wg: 60, tail: 20, sat: 30 });
    a.scMood = m.hp <= 0 ? 'dizzy' : moodOf(a, peek > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [10, -8], rot: (S) => S.hr * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // The dive-bomb's flurry of letters.
  fx(ctx, m, a, S, mat) {
    const since = a.ph.since ?? -1;
    if (m.hp <= 0 || since < 0 || since > 0.7) return;
    const q = since / 0.7;
    const [bx, by] = at2(mat('bodyJ'), 4, 8);
    ctx.save();
    for (let k = 0; k < 3; k++) {
      const x = bx + 6 + q * (18 + k * 8);
      const y = by - 4 + k * 4 + q * q * 10;
      ctx.globalAlpha = a.alpha * (1 - q);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(q * (3 + k) + k);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b8bccb';
      ctx.lineWidth = 0.6;
      ctx.fillRect(-3, -2, 6, 4);
      ctx.strokeRect(-3, -2, 6, 4);
      ctx.beginPath();
      ctx.moveTo(-3, -2);
      ctx.lineTo(0, 0.4);
      ctx.lineTo(3, -2);
      ctx.stroke();
      ctx.fillStyle = '#e8584a';
      ctx.beginPath();
      ctx.arc(0.4, 0.8, 0.8, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): on its round.
export function swiftCourierStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(tailP(), [18, 6], -12, by + 4), ...put(wingP('#4a5aa8', '#7a8ad0')(), [2, 7], -2, by - 2, -150), ...put(satchelP(), [14, 2], 0, by - 2),
    ...put(bodyP(), [14, 10], 0, by), ...put(wingP('#5a6ab8', '#8a9ae0')(), [2, 7], 4, by - 4, -30), ...put(headP(), [10, 12], 10, by - 8), ...put(swiftFaceShapes(fm), [10, 12], 10, by - 8),
  ];
  const ox = 26;
  const oy = 40;
  return { w: 54, h: 46, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
