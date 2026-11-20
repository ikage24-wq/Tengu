// The Crystal Golem, remade 2026-11-20 (the player's pick "Amethyst Owl"): a stone owl golem of the
// Crystal Cave, with crystal ear tufts, an amethyst geode in its belly, stubby stone wings and
// talons. Upright and chibi. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 10 s act: standing guard, one eye sleepily half-shut, the geode softly pulsing; the
//           owl's head tilt one way, then the other; ruffling its stone wings, the tufts quivering.
//   walk    a heavy side-to-side waddle on its talons, the wings swinging.
//   fight   it throws its wings up and the geode blazes; then slams them down, crystals bursting
//           off the ground in front of it.
//   hit     rocked back, the tufts quivering.
//   dead    it sits down hard, tipped back, the wings flopped out, dizzy, the geode dark.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, pawStep, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 1;
const OS = '#9aa6c8';
const OSD = '#7a86ac';
const OSL = '#c8d0e8';
const AM = '#a070e0';
const AML = '#e0d0ff';
const ao = pairOf('amowl');

const smoothPts = (pts, n = 1) => {
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
const blob = (pts, c, n = 1) => T(smoothPts(pts, n), c);
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);
const ln = (pts, w, c) => [F(taper(pts, w, w * 0.85, c))];
// A crystal shard from its base (x, y), pointing deg (0 = up), its right half lighter.
const shard = (x, y, len, w, deg, c, cl) => {
  const a = deg * D2R;
  const ux = Math.sin(a);
  const uy = -Math.cos(a);
  const p = (al, sd) => [x + ux * al - uy * sd, y + uy * al + ux * sd];
  return [T([p(0, -w), p(len * 0.75, -w), p(len, 0), p(len * 0.75, w), p(0, w)], c), F(T([p(0, 0), p(len, 0), p(len * 0.75, w), p(0, w)], cl))];
};

// ---------- Parts ----------
// The body: the stone egg, carved chest feathers, the owl's face disc, the beak, the geode. Box 40 x 48;
// its middle (20, 24) = (32, 43).
const GEODE = [[28, 59, -30], [31, 60, -8], [35, 59.6, 20], [33, 54, 170], [29.4, 54.4, 200]];
const bodyP = () => at([
  E(32, 43, 18, 22.5, OS),
  ...[[26, 47], [32, 49], [38, 47], [29, 52], [35, 52]].flatMap(([x, y]) => ln([[x - 1.6, y - 1], [x, y], [x + 1.6, y - 1]], 0.7, OSD)),
  F(E(26, 34, 8, 7.4, OSL)), F(E(38, 34, 8, 7.4, OSL)),
  F(E(32, 57, 8, 6.2, '#e0dcf0')), F(E(32, 57.4, 6.4, 4.8, '#7a4ac8')), ...GEODE.flatMap(([x, y, d]) => shard(x, y, 3.6, 0.9, d, AM, AML)),
  T([[29.6, 38.4], [34.4, 38.4], [32, 42.4]], '#e8b04a'),
], [32, 43], [20, 24]);
// The geode blazing (laid over the belly in a fight, and faintly pulsing at rest). Same box.
const glowP = () => at([
  F(E(32, 57.4, 6.4, 4.8, '#c8a0ff')), ...GEODE.flatMap(([x, y, d]) => shard(x, y, 3.6, 0.9, d, '#ffffff', '#ffffff')),
  ...[-60, -30, 0, 30, 60].map((d) => F(T([[32 + Math.sin(d * D2R) * 8, 57 - Math.cos(d * D2R) * 6], [32 + Math.sin((d - 6) * D2R) * 15, 57 - Math.cos((d - 6) * D2R) * 12], [32 + Math.sin((d + 6) * D2R) * 15, 57 - Math.cos((d + 6) * D2R) * 12]], '#f0e4ff'))),
], [32, 43], [20, 24]);
// The crystal ear tufts, each rooted inside the head. Box 16 x 20; the root (9.5, 17) / (4.5, 17).
const tuftLP = () => at([...shard(21, 25, 10, 2.4, -32, AM, AML), ...shard(24, 23, 13, 2.8, -12, AM, AML)], [22.5, 25], [9.5, 17]);
const tuftRP = () => at([...shard(43, 25, 10, 2.4, 32, AM, AML), ...shard(40, 23, 13, 2.8, 12, AM, AML)], [41.5, 25], [4.5, 17]);
// A stubby stone wing, hung from the shoulder. Box 14 x 24; the shoulder (10, 2) / (4, 2).
const wingLP = () => [blob([[10, 2], [3, 12], [5, 23], [12, 18]], OSD), ...ln([[7, 8], [5.4, 15]], 0.7, '#6a7498'), ...ln([[9.6, 9], [8.6, 16.4]], 0.7, '#6a7498')];
const wingRP = () => [blob([[4, 2], [11, 12], [9, 23], [2, 18]], OSD), ...ln([[7, 8], [8.6, 15]], 0.7, '#6a7498'), ...ln([[4.4, 9], [5.4, 16.4]], 0.7, '#6a7498')];
// A talon foot. Box 12 x 7; its top (6, 1).
const footP = () => [E(6, 3.4, 4.4, 2.4, OSD), F(E(3, 4.6, 1.1, 0.8, '#5a6488')), F(E(6, 5, 1.1, 0.8, '#5a6488')), F(E(9, 4.6, 1.1, 0.8, '#5a6488'))];
const PR = {
  BODY: ao('body', 40, 48, bodyP, 3, 3), GLOW: ao('glow', 40, 48, glowP, 3, 3), TUFTL: ao('tuftL', 16, 20, tuftLP, 3, 3), TUFTR: ao('tuftR', 16, 20, tuftRP, 3, 3),
  WINGL: ao('wingL', 14, 24, wingLP, 3, 3), WINGR: ao('wingR', 14, 24, wingRP, 3, 3), FOOT: ao('foot', 12, 7, footP, 3),
};

// ---------- Its own face: huge round amber owl eyes, one always sleepily half-shut under a stone lid;
// they narrow under slanted lids to glare, and the beak drops open to hoot. ----------
const ODARK = '#2a2840';
const OAMBER = '#ffc84a';
const OLID = '#5a6488';
const OEYES = [[14, 15, -1], [26, 15, 1]];
const owlFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s] of OEYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...ln(arcP(x, y, 3.6, 2, 15, 165, 8), 0.9, ODARK));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 1.6, 3.4, 3, 200, 340, 8), 1, ODARK));
    else if (mood === 'hurt') out.push(...ln([[x + s * 2.6, y - 2.4], [x - s * 2, y], [x + s * 2.6, y + 2.4]], 1, ODARK));
    else if (mood === 'dead') out.push(...ln(arcP(x, y - 0.4, 3.2, 1.8, 15, 165, 8), 0.9, ODARK));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 14; i++) pts.push([x + Math.cos(i * 0.8 * s) * (0.2 + i * 0.22), y + Math.sin(i * 0.8 * s) * (0.2 + i * 0.22)]);
      out.push(...ln(pts, 0.8, '#c8902a'));
    } else {
      const angry = mood === 'angry';
      const wide = mood === 'shout';
      out.push(F(E(x, y, 4.4, 4.4, ODARK)), F(E(x, y + 0.3, 3.6, 3.6, OAMBER)), F(E(x + 0.3, y + 0.5, angry || wide ? 1.3 : 2, angry || wide ? 1.5 : 2.2, ODARK)));
      if (!angry) out.push(F(E(x + 1.4, y - 1.4, 1, 1, '#ffffff')), F(E(x - 1.2, y + 1.8, 0.4, 0.4, '#ffffff')));
      if (angry) {
        const [yl, yr] = s < 0 ? [y - 5.8, y - 2.4] : [y - 2.4, y - 5.8];
        out.push(F(T([[x - 4.8, yl], [x + 4.8, yr], [x + 4.8, y - 6.2], [x - 4.8, y - 6.2]], OSL)), ...ln([[x - 4.6, yl + 0.4], [x + 4.6, yr + 0.4]], 0.9, OLID));
      } else if (mood === 'idle' && s > 0) out.push(F(T([[x - 4.8, y - 0.4], [x + 4.8, y - 0.4], [x + 4.8, y - 5], [x - 4.8, y - 5]], OSL)), ...ln([[x - 4.2, y - 0.3], [x + 4.2, y - 0.3]], 0.9, OLID));
    }
  }
  if (mood === 'shout') out.push(F(T([[18, 22.4], [22, 22.4], [20, 25.6]], '#7a3040')), F(T([[18.4, 23.6], [21.6, 23.6], [20, 26.8]], '#c8902a')));
  else if (mood === 'angry' || mood === 'dizzy' || mood === 'hurt') out.push(F(T([[18.4, 22.6], [21.6, 22.6], [20, 25]], '#c8902a')));
  return out;
};
const owlFace = (mood) => faceSprite(`amowl|face|${mood}`, 40, 48, () => owlFaceShapes(mood));

// The body's middle sits 25 above the ground; the feet, wings and tufts hang off it.
const BODY_Y = 25;
const FEET_X = 6;
const FOOT_Y = 20.2;
const SHOULDER = [15, -6];
const TUFT = [9.5, -18];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k) => ({ name: `foot${k}${tag}`, parent: 'bodyJ', s: PR.FOOT[i], pivot: [6, 1], at: (S) => [(k ? FEET_X : -FEET_X) + S[k ? 'xR' : 'xL'], FOOT_Y - S[k ? 'yR' : 'yL']], rot: (S) => -S.tilt * D2R });
  return [
    { name: `tuftL${tag}`, parent: 'bodyJ', s: PR.TUFTL[i], pivot: [9.5, 17], at: () => [-TUFT[0], TUFT[1]], rot: (S) => S.tL * D2R },
    { name: `tuftR${tag}`, parent: 'bodyJ', s: PR.TUFTR[i], pivot: [4.5, 17], at: () => [TUFT[0], TUFT[1]], rot: (S) => S.tR * D2R },
    { name: `wingL${tag}`, parent: 'bodyJ', s: PR.WINGL[i], pivot: [10, 2], at: () => [-SHOULDER[0], SHOULDER[1]], rot: (S) => S.wL * D2R },
    { name: `wingR${tag}`, parent: 'bodyJ', s: PR.WINGR[i], pivot: [4, 2], at: () => [SHOULDER[0], SHOULDER[1]], rot: (S) => S.wR * D2R },
    foot(0),
    foot(1),
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [20, 24] },
    ...(bare ? [
      { name: 'glow', parent: 'bodyJ', s: PR.GLOW[1], pivot: [20, 24], alpha: (a, S) => clamp(S.gl, 0, 1) },
      { name: 'face', parent: 'bodyJ', s: (a) => owlFace(MOODS.has(a.aoMood) ? a.aoMood : 'idle'), pivot: [20, 24] },
    ] : []),
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

export const amethystOwlRig = sized(makeRig({
  w: 120, h: 110, soft: true, stride: 30, recover: 0.7,
  springs: {
    x: [200, 18], lift: [240, 17], tilt: [150, 13], wL: [220, 14], wR: [220, 14], tL: [130, 6], tR: [130, 6], gl: [120, 12],
    xL: [400, 24], xR: [400, 24], yL: [400, 24], yR: [400, 24],
  },
  fast: ['x', 'wL', 'wR', 'xL', 'xR', 'yL', 'yR'],
  kick: { tilt: -120, tL: 500, tR: -500 },
  turnKick: { tilt: 80, tL: 220, tR: -220 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.93;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'amowl', 30);
    const calm = a.calm ?? 1;
    const lu = t % 10;
    // Its act: the owl's head tilt, one way then the other; ruffling its stone wings.
    const tiltL = hold(lu, 1, 1.5, 2.6, 3.1) * calm;
    const tiltR = hold(lu, 3.8, 4.3, 5.2, 5.7) * calm;
    const ruffle = hold(lu, 7, 7.4, 8.4, 8.8) * calm;
    const br = Math.sin(t * 1.3);
    const shake = Math.sin(t * 18);
    const idle = {
      x: 0, lift: (br + 1) * 0.3, tilt: (tiltR - tiltL) * 9, wL: ruffle * (34 + shake * 8), wR: -ruffle * (34 + shake * 8),
      tL: Math.sin(t * 2) * 3 + ruffle * shake * 8 - tiltL * 6, tR: -Math.sin(t * 2.2) * 3 - ruffle * shake * 8 + tiltR * 6, gl: 0.18 + Math.sin(t * 1.6) * 0.12,
      xL: 0, xR: 0, yL: 0, yR: 0,
    };
    // A heavy waddle on its talons.
    const s = Math.sin(u * TAU);
    const [dL, uL] = pawStep(u, 0, 8, 0.6, 2.2);
    const [dR, uR] = pawStep(u, 0.5, 8, 0.6, 2.2);
    const walk = { x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.2, tilt: s * 5, wL: 8 + s * 10, wR: -8 + s * 10, tL: s * 6, tR: s * 6, gl: 0.2, xL: dL, xR: dR, yL: uL, yR: uR };
    // Wings thrown up, the geode blazing; then the slam.
    const antic = { x: -2, lift: 1.5, tilt: -6, wL: 140, wR: -140, tL: -12, tR: 12, gl: 1, xL: -1, xR: 1, yL: 0, yR: 0 };
    const strike = { x: 4, lift: 0.9, tilt: 9, wL: 32, wR: -30, tL: 14, tR: -14, gl: 0.7, xL: -2, xR: 2, yL: 0, yR: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: sat down hard, tipped back, wings flopped out, the geode dark.
    if (m.hp <= 0) Object.assign(S, { x: -1, lift: 1.2, tilt: -12, wL: 62, wR: -62, tL: -22, tR: 22, gl: 0, xL: -2, xR: 2, yL: 0, yR: 0 });
    a.aoMood = m.hp <= 0 ? 'dizzy' : moodOf(a, null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 17, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The tufts twinkling now and then; crystals bursting off the ground at the slam.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const L = mat('bodyJ');
    ctx.save();
    const tw = (x, y, r, al, c = '#ffffff') => {
      if (r <= 0.05 || al <= 0.01) return;
      ctx.globalAlpha = a.alpha * al;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    };
    const t = a.now + (m.uid % 7) * 0.37;
    const q = (t * 0.35) % 1;
    if (q < 0.22) {
      const side = Math.floor(t * 0.35) % 2 ? 1 : -1;
      const [gx, gy] = at2(L, side * 12, -32);
      tw(gx, gy, 2.6 * Math.sin((q / 0.22) * Math.PI), 0.9);
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.6) {
      const p = since / 0.6;
      const gx = S.x + 22;
      for (const [dx, h, r, c] of [[0, 14, 3.2, '#c8a0ff'], [6, 10, 2.6, '#8ae8ff'], [-4, 9, 2.4, '#e0d0ff'], [11, 6, 2, '#c8a0ff']]) {
        const x = gx + dx + p * dx * 0.6;
        const y = -3 - Math.sin(p * Math.PI) * h;
        ctx.globalAlpha = a.alpha * (1 - p);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 1.6);
        ctx.lineTo(x + r * 0.7, y);
        ctx.lineTo(x, y + r * 0.6);
        ctx.lineTo(x - r * 0.7, y);
        ctx.fill();
      }
      tw(gx, -6, 5 * (1 - p), 0.9 * (1 - p), '#f0e4ff');
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): standing guard.
export function amethystOwlStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(tuftLP(), [9.5, 17], -TUFT[0], by + TUFT[1]), ...put(tuftRP(), [4.5, 17], TUFT[0], by + TUFT[1]),
    ...put(wingLP(), [10, 2], -SHOULDER[0], by + SHOULDER[1]), ...put(wingRP(), [4, 2], SHOULDER[0], by + SHOULDER[1]),
    ...put(footP(), [6, 1], -FEET_X, by + FOOT_Y), ...put(footP(), [6, 1], FEET_X, by + FOOT_Y),
    ...put(bodyP(), [20, 24], 0, by), ...put(owlFaceShapes(fm), [20, 24], 0, by),
  ];
  const ox = 28;
  const oy = 64;
  return { w: 56, h: 70, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
