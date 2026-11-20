// The Cloud Shepherd, remade 2026-11-20 (the player's pick "Lamb Shepherdess"): a cloud-wool lamb
// with a crook, curly gold horns and a brass bell, herding three tiny rain clouds that bob along after
// her. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 10 s act: leaning on her crook while the cloudlets drift about her; a look back to
//           count them; a soft ring of the bell, and the cloudlets twirl round once.
//   walk    a trot with the crook as a walking stick, the cloudlets trailing behind.
//   fight   she lifts the crook and rings the bell hard; then points the crook and the cloudlets
//           rush over you and rain; they drift home after.
//   hit     knocked back, the bell jangling, the cloudlets scattering a little.
//   dead    she sits down in a heap of wool, the crook dropped, dizzy; the cloudlets float off.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, stepPhase, pawStep, put, MOODS, moodOf } from './rigkit.js';

const K = 0.75;
const WOOL = '#ffffff';
const WOOLD = '#e4def6';
const LFACE = '#9a86c4';
const HOOF = '#5a4a7a';
const GOLD = '#f2c860';
const CORAL = '#ff7a6a';
const WOOD = '#a0704a';
const ls = pairOf('lambsh');

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

// ---------- Parts ----------
// A cloudlet. Box 16 x 12; its middle (8, 6).
const cloudletP = (k) => () => [
  E(8 - 3 * k, 6 + 1 * k, 3.4 * k, 3 * k, WOOL), E(8, 6 - 1.4 * k, 4 * k, 3.6 * k, WOOL), E(8 + 3.4 * k, 6 + 1 * k, 3.2 * k, 2.8 * k, WOOL),
  F(E(8 - 1.6 * k, 6 + 1 * k, 1.2 * k, 0.7 * k, '#ffc8d4')), F(E(8 + 2.4 * k, 6 + 1 * k, 1.2 * k, 0.7 * k, '#ffc8d4')),
];
// The crook. Box 12 x 48; held at (8, 32).
const crookP = () => [taper([[8, 45.6], [8, 5.6]], 2.2, 2, WOOD), taper(arcP(4.6, 5.6, 3.4, 3.6, 0, -200, 9), 2, 2, WOOD)];
// A leg and its hoof. Box 8 x 10; the hip (4, 1).
const legP = () => [R(2, 1, 4, 5.6, LFACE), E(4, 7.6, 3, 2, HOOF)];
// The woolly body. Box 28 x 22; its middle (14, 11).
const bodyP = () => [E(8, 10, 6, 6, WOOL), E(14, 6, 7, 6.4, WOOL), E(20, 11, 6, 6, WOOL), E(13, 15, 8, 5.4, WOOL), F(E(9, 12, 3, 2, WOOLD)), F(E(17, 16, 3.6, 2, WOOLD))];
// The arm in its woolly sleeve, holding the crook. Box 16 x 10; the shoulder (3, 2).
const armP = () => [taper([[3, 2], [10, 5]], 5, 4, WOOL), E(11.4, 5.4, 2.8, 2.8, LFACE)];
// The far hand on the crook. Box 6 x 6; its middle (3, 3).
const handP = () => [E(3, 3, 2.8, 2.8, LFACE)];
// The ribbon at her neck. Box 16 x 6; its middle (8, 2).
const ribbonP = () => [blob([[2, 0.6], [14, 0.6], [14.6, 3], [1.4, 3]], CORAL)];
// The brass bell, swinging from the ribbon. Box 8 x 8; its top (4, 1).
const bellP = () => [E(4, 3.6, 2.6, 2.8, GOLD), F(E(4, 5.4, 1.6, 0.8, '#b8862a')), F(E(3.2, 2.6, 0.8, 0.6, '#fff4c8'))];
// The head: wool tufts, floppy ears, the face, curly gold horns. Box 32 x 26; its middle (15, 14).
const headP = () => [
  blob([[6, 13], [2, 17], [4, 20]], LFACE), E(6.8, 8, 5, 4.6, WOOL), E(13, 4, 6, 5.4, WOOL), E(19, 7, 5, 4.6, WOOL),
  E(15, 14, 8.6, 8, LFACE), F(E(17, 17, 5.6, 4.4, '#b8a8dc')), T([[7, 13], [1, 17], [7, 18]], LFACE), F(T([[6, 14.4], [2.6, 16.8], [6, 17]], '#ffc8d4')),
  E(8.4, 8.6, 5, 4.4, WOOL), E(14.4, 6, 5.6, 4.6, WOOL), E(20.4, 8.6, 4.6, 4, WOOL),
  taper(arcP(9, 10, 3.2, 3.2, -90, 200, 10), 1.8, 1.4, GOLD), taper(arcP(22, 10, 3, 3, -20, 260, 10), 1.8, 1.4, GOLD),
];
const CLOUD_K = [0.9, 0.8, 0.75];
const PR = {
  CLOUD: CLOUD_K.map((k, i) => ls(`cloud${i}`, 16, 12, cloudletP(k), 3, 3)), CROOK: ls('crook', 12, 48, crookP, 3, 3), LEG: ls('leg', 8, 10, legP, 3),
  BODY: ls('body', 28, 22, bodyP, 3, 3), ARM: ls('arm', 16, 10, armP, 3, 3), HAND: ls('hand', 6, 6, handP, 3, 3), RIBBON: ls('ribbon', 16, 6, ribbonP, 3, 3),
  BELL: ls('bell', 8, 8, bellP, 3, 3), HEAD: ls('head', 32, 26, headP, 3, 3),
};
// ---------- Its own face: gentle, sleepy-lidded eyes with long lashes (the only lashes in the
// flock), a little pink heart of a nose and the lamb's "y" mouth; a stern look to scold, a big
// "baa" to shout, and out cold it simply dozes off. ----------
const LDARK = '#2e2448';
const LIRIS = '#c8b8f0';
const LNOSE = '#ff9fb8';
const ln = (pts, w, c = LDARK) => [F(taper(pts, w, w * 0.85, c))];
const lashes = (x, y, s, up = 1) => [...ln([[x + s * 1.3, y], [x + s * 2.1, y - 0.8 * up]], 0.45), ...ln([[x + s * 0.6, y - 0.15 * up], [x + s * 1, y - 1.1 * up]], 0.4)];
const LEYES = [[15, 14.8, -1], [20.4, 14.8, 1]];
const lambFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s] of LEYES) {
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') {
      out.push(...ln(arcP(x, y, 1.5, 0.9, 15, 165, 6), 0.6));
      out.push(...ln([[x + s * 1.3, y + 0.4], [x + s * 2, y + 1]], 0.4), ...ln([[x + s * 0.5, y + 0.9], [x + s * 0.8, y + 1.7]], 0.38));
    } else if (mood === 'happy') out.push(...ln(arcP(x, y + 0.9, 1.5, 1.4, 200, 340, 6), 0.65), ...lashes(x, y - 0.1, s));
    else if (mood === 'shout') out.push(...ln([[x + s * 1.3, y - 1.2], [x - s * 1, y], [x + s * 1.3, y + 1.2]], 0.65));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 11; i++) pts.push([x + Math.cos(i * 0.9) * (0.12 + i * 0.12), y + Math.sin(i * 0.9) * (0.12 + i * 0.12)]);
      out.push(...ln(pts, 0.4, '#6a50a8'));
    } else {
      const angry = mood === 'angry';
      const hurt = mood === 'hurt';
      // Lidded: the eye is cut under an arch (serene); slanted when stern; wide open when hurt.
      const lid = angry ? (px) => y - 0.4 + (px - x) * -s * 0.45 : hurt ? () => -99 : (px) => y + 0.4 - 1.25 * Math.sqrt(Math.max(0, 1 - ((px - x) / 1.7) ** 2));
      const eye = Array.from({ length: 16 }, (_, i) => [x + Math.cos((i / 16) * Math.PI * 2) * 1.5, y + Math.sin((i / 16) * Math.PI * 2) * 1.85]).map(([px, py]) => [px, Math.max(py, lid(px))]);
      const iris = Array.from({ length: 12 }, (_, i) => [x + Math.cos((i / 12) * Math.PI * 2) * 1.05, y + 0.7 + Math.sin((i / 12) * Math.PI * 2) * 0.8]).map(([px, py]) => [px, Math.max(py, lid(px) + 0.2)]);
      out.push(F(T(eye, LDARK)), F(T(iris, LIRIS)), F(E(x + 0.45, hurt ? y - 0.7 : y + 0.1, 0.36, 0.36, '#ffffff')));
      if (!hurt) out.push(...ln(Array.from({ length: 7 }, (_, i) => x - 1.6 + (i * 3.2) / 6).map((px) => [px, lid(px)]), 0.55));
      out.push(...lashes(x, hurt ? y - 1.4 : angry ? lid(x + s * 1.3) : y - 0.4, s));
      if (hurt) out.push(F(E(x, y + 1.6, 1.2, 0.4, '#bfe8ff')));
    }
  }
  // The heart nose, the mouth under it; a "z" when it dozes off.
  out.push(F(E(18.6, 16.9, 0.55, 0.5, LNOSE)), F(E(19.5, 16.9, 0.55, 0.5, LNOSE)), F(T([[18.1, 17.1], [20, 17.1], [19.05, 18]], LNOSE)));
  const [mx, my] = [19.05, 18.6];
  if (mood === 'shout') out.push(F(E(mx, my + 1, 1, 1.2, '#7a3040')), F(E(mx, my + 1.6, 0.6, 0.35, '#ff8fab')));
  else if (mood === 'happy') out.push(...ln([[mx, my - 0.5], [mx, my]], 0.35), F(T(arcP(mx, my, 1.1, 1, 0, 180, 8), '#7a3040')));
  else if (mood === 'angry') out.push(...ln([[mx, my - 0.5], [mx, my]], 0.35), ...ln([[mx - 1, my + 0.4], [mx + 1, my + 0.2]], 0.4));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx, my - 0.5], [mx, my]], 0.35), ...ln([[mx - 1.1, my + 0.5], [mx - 0.4, my + 0.1], [mx + 0.4, my + 0.5], [mx + 1.1, my + 0.1]], 0.35));
  else out.push(...ln([[mx, my - 0.5], [mx, my]], 0.35), ...ln(arcP(mx - 0.55, my, 0.55, 0.5, 0, 180, 6), 0.35), ...ln(arcP(mx + 0.55, my, 0.55, 0.5, 0, 180, 6), 0.35));
  if (mood === 'dead') out.push(...ln([[25, 11.4], [26.6, 11.4], [25, 13], [26.6, 13]], 0.45, '#6a50a8'));
  return out;
};
const lambFace = (mood) => faceSprite(`lambsh|face|${mood}`, 32, 26, () => lambFaceShapes(mood));

// The body's middle sits 15.6 above the feet, the head 18 above that.
const BODY_Y = 15.6;
// The cloudlets: where each floats at home (behind her), and where it rushes to (over you).
const HOME = [[-21, -38.6], [-25, -26.6], [-17, -50.6]];
const AWAY = [[52, -44], [64, -38], [42, -36]];
const cloudAt = (i) => (S, a) => {
  const t = (a.t ?? 0) + i * 2.1;
  const [hx, hy] = HOME[i];
  const [ax, ay] = AWAY[i];
  const g = S.go;
  const swirl = S.twirl * TAU + i * 2.1;
  return [
    S.x * 0.6 + hx + (ax - hx) * g + Math.sin(t * 1.3) * 1.8 + S.drift * (1 - g) + Math.cos(swirl) * 6 * Math.min(1, S.twirl * 4) * (1 - g),
    hy + (ay - hy) * g + Math.cos(t * 1.7) * 2.2 - S.away * (12 + i * 4) + Math.sin(swirl) * 4 * Math.min(1, S.twirl * 4) * (1 - g),
  ];
};

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const leg = (far) => ({ name: `leg${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.LEG[i], pivot: [4, 1], at: (S) => [far ? -3 : 4.1, 7 - S[far ? 'yF' : 'yN']], rot: (S) => (S[far ? 'lF' : 'lN'] - S.tilt) * D2R });
  const cloud = (k) => ({ name: `cloud${k}${tag}`, parent: `cJ${k}`, s: PR.CLOUD[k][i], pivot: [8, 6], alpha: (a, S) => clamp(1 - S.away * 1.4, 0, 1) });
  return [
    cloud(2),
    cloud(1),
    leg(true),
    { name: `hand${tag}`, parent: 'crookJ', s: PR.HAND[i], pivot: [3, 3], at: () => [-0.6, -2.4] },
    { name: `crook${tag}`, parent: 'crookJ', s: PR.CROOK[i], pivot: [8, 32] },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [14, 11] },
    leg(false),
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [15, 14] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => lambFace(MOODS.has(a.lsMood) ? a.lsMood : 'idle'), pivot: [15, 14] }] : []),
    { name: `ribbon${tag}`, parent: 'bodyJ', s: PR.RIBBON[i], pivot: [8, 2], at: () => [1, -9.4] },
    { name: `bell${tag}`, parent: 'bodyJ', s: PR.BELL[i], pivot: [4, 1], at: () => [1, -7.6], rot: (S) => (S.bell - S.tilt) * D2R },
    { name: `arm${tag}`, parent: 'bodyJ', s: PR.ARM[i], pivot: [3, 2], at: () => [5, -4], rot: (S) => S.arm * D2R },
    cloud(0),
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

export const lambShepherdRig = sized(makeRig({
  w: 140, h: 96, soft: true, stride: 20, recover: 0.9,
  springs: {
    x: [240, 18], lift: [260, 17], tilt: [180, 13], hr: [160, 11], lN: [340, 21], lF: [340, 21], yN: [400, 24], yF: [400, 24],
    arm: [200, 14], crk: [180, 13], bell: [260, 6], go: [110, 14], drift: [30, 8], twirl: [30, 10], away: [20, 7],
  },
  fast: ['x', 'lN', 'lF', 'yN', 'yF', 'arm', 'crk'],
  kick: { tilt: -140, bell: 500, hr: -160 },
  turnKick: { tilt: 100, bell: 300 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.77;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'lambsh', 20);
    const calm = a.calm ?? 1;
    const lu = t % 10;
    // Her act: leaning on the crook; a look back to count the cloudlets; a soft ring of the bell
    // and the cloudlets twirl round once.
    const count = hold(lu, 2.4, 2.8, 4, 4.4) * calm;
    const ring = hold(lu, 6.4, 6.6, 7.6, 7.8) * calm;
    const tw = clamp((lu - 6.6) / 1.6, 0, 1) * calm;
    const br = Math.sin(t * 1.5);
    const idle = {
      x: 0, lift: (br + 1) * 0.3, tilt: br * 1.2, hr: -count * 18 + Math.sin(t * 0.8) * 3, lN: 0, lF: 0, yN: 0, yF: 0,
      arm: 0, crk: 4 + br * 2, bell: ring * Math.sin(t * 16) * 28 + br * 4, go: 0, drift: 0, twirl: tw, away: 0,
    };
    // A trot, the crook a walking stick, the cloudlets trailing.
    const s = Math.sin(u * TAU);
    const [dxN, upN] = pawStep(u, 0, 20, 0.6, 2.4);
    const [dxF, upF] = pawStep(u, 0.5, 20, 0.6, 2.4);
    const walk = {
      x: 0, lift: Math.abs(Math.cos(u * TAU)) * 1.4, tilt: 3 + s * 2, hr: -2, lN: -dxN * 3, lF: -dxF * 3, yN: upN, yF: upF,
      arm: -6 + s * 8, crk: s * 10, bell: s * 18, go: 0, drift: -8, twirl: 0, away: 0,
    };
    // The crook lifted high and the bell rung hard; then the crook pointed and the cloudlets rush.
    const antic = { x: -1, lift: 0, tilt: -6, hr: -8, lN: 6, lF: -4, yN: 0, yF: 0, arm: -40, crk: -10, bell: Math.sin(t * 24) * 40, go: 0.12, drift: 4, twirl: 0, away: 0 };
    const strike = { x: 3, lift: 0, tilt: 8, hr: 8, lN: -10, lF: 8, yN: 0, yF: 0, arm: -20, crk: 62, bell: 20, go: 1, drift: 0, twirl: 0, away: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // (The cloudlets stay out over you a while after the strike, raining, then drift home.)
    const since = a.ph.since ?? -1;
    if (since > 0 && m.hp > 0) S.go = Math.max(S.go, clamp(1 - (since - 0.5) / 1.1, 0, 1));
    // Beaten: down in a heap of wool, the crook dropped; the cloudlets float away.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -3, tilt: -10, hr: 12, lN: -50, lF: 46, yN: 0, yF: 0, arm: 40, crk: -86, bell: 30, go: 0, drift: 0, twirl: 0, away: 1 });
    a.lsMood = m.hp <= 0 ? 'dizzy' : moodOf(a, ring > 0.5 || count > 0.5 ? 'happy' : null);
    a.lsGo = S.go;
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [0, -18], rot: (S) => (S.hr - S.tilt * 0.4) * D2R },
    { name: 'armJ', parent: 'bodyJ', at: () => [5, -4], rot: (S) => S.arm * D2R },
    { name: 'crookJ', parent: 'armJ', at: () => [8.4, 3.4], rot: (S) => (S.crk - S.arm - S.tilt) * D2R },
    { name: 'cJ0', parent: null, at: cloudAt(0) },
    { name: 'cJ1', parent: null, at: cloudAt(1) },
    { name: 'cJ2', parent: null, at: cloudAt(2) },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a4a7a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 12, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Rain from the cloudlets while they're out over you; little rings off the bell as she rings it.
  fx(ctx, m, a, S, mat) {
    const go = a.lsGo ?? 0;
    ctx.save();
    if (go > 0.5 && m.hp > 0) {
      const al = clamp((go - 0.5) * 3, 0, 1);
      // (Deep blue drops with a white rim, so they read on the pale sky.)
      ctx.fillStyle = '#3f86e0';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6;
      for (let k = 0; k < 3; k++) {
        const [cx, cy] = at2(mat(`cJ${k}`), 0, 4);
        for (let d = 0; d < 5; d++) {
          const q = (a.now * 1.8 + d / 5 + k * 0.3) % 1;
          ctx.globalAlpha = a.alpha * al * Math.min(1, (1 - q) * 1.6);
          const x = cx - 4 + ((d * 7 + k * 3) % 9);
          const y = cy + q * 34;
          ctx.beginPath();
          ctx.moveTo(x, y - 2.8);
          ctx.quadraticCurveTo(x + 1.7, y, x, y + 1.4);
          ctx.quadraticCurveTo(x - 1.7, y, x, y - 2.8);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    if (a.ph.antic > 0.3 && m.hp > 0) {
      const [bx, by] = at2(mat('bodyJ'), 1, -6);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      for (let r = 0; r < 2; r++) {
        const q = (a.now * 2.4 + r * 0.5) % 1;
        ctx.globalAlpha = a.alpha * (1 - q) * 0.8;
        ctx.beginPath();
        ctx.arc(bx, by, 3 + q * 8, -0.6, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bx, by, 3 + q * 8, Math.PI - 0.6, Math.PI + 0.6);
        ctx.stroke();
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): herding.
export function lambShepherdStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const arm = [5, by - 4];
  const grip = [arm[0] + 8.4, arm[1] + 3.4];
  const sh = [
    ...put(cloudletP(0.75)(), [8, 6], HOME[2][0], HOME[2][1]), ...put(cloudletP(0.8)(), [8, 6], HOME[1][0], HOME[1][1]),
    ...put(legP(), [4, 1], -3, by + 7), ...put(handP(), [3, 3], grip[0] - 0.6, grip[1] - 2.4), ...put(crookP(), [8, 32], grip[0], grip[1], 4),
    ...put(bodyP(), [14, 11], 0, by), ...put(legP(), [4, 1], 4.1, by + 7), ...put(headP(), [15, 14], 0, by - 18), ...put(lambFaceShapes(fm), [15, 14], 0, by - 18),
    ...put(ribbonP(), [8, 2], 1, by - 9.4), ...put(bellP(), [4, 1], 1, by - 7.6), ...put(armP(), [3, 2], arm[0], arm[1]), ...put(cloudletP(0.9)(), [8, 6], HOME[0][0], HOME[0][1]),
  ];
  const ox = 26;
  const oy = 62;
  return { w: 56, h: 66, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
