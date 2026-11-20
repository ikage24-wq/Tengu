// The Gem Mimic, remade 2026-11-20 (the player's pick "Treasure Mimic"): a wooden treasure chest with
// gold bands and gems growing from its lid, a little keyhole-face on the front (no eye on the lid),
// three purple stubby feet. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: sitting very still like a chest; the lid creaking open a crack to peek, and
//           shutting; a shuffle of its little feet; the gems twinkling.
//   walk    pattering along on its three feet (its gait bounds it about).
//   fight   the lid creaks open, a tongue lolling; then it lunges and the lid snaps: chomp!
//   hit     knocked back, the lid rattling.
//   dead    it tips back, the lid flopped open, the tongue out, dizzy.
// Built in the concept's own units and drawn at K of them; the feet at y 0.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, put, shift, MOODS, moodOf, arcP, ov } from './rigkit.js';

const K = 0.75;
const WOOD = '#c8945a';
const WOODD = '#a06a3a';
const GOLD = '#f2c860';
const FEET = '#8a6a9a';
const GEMS = ['#8ad8ff', '#d8a8ff', '#ff9ac8'];
const tm = pairOf('tmimic');

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

// ---------- Parts ----------
// A stubby foot. Box 10 x 6; its top (5, 1).
const footP = (far) => () => [E(5, 3, far ? 3.4 : 3.8, far ? 2.2 : 2.6, far ? FEET : '#9a7aaa')];
// The chest: wood, gold bands, the keyhole-plate face. Box 32 x 24; its middle (16, 11) = (28, 46.5).
const chestP = () => at([
  R(13, 36, 30, 21, WOOD), F(R(13, 40, 30, 1.2, WOODD)), F(R(13, 47, 30, 1.2, WOODD)), R(13, 54, 30, 3, GOLD), R(19, 36, 3, 21, GOLD), R(34, 36, 3, 21, GOLD),
  blob([[25, 40], [31, 40], [32, 48], [24, 48]], '#ffe6a8'),
], [28, 46.5], [16, 11]);
// The mouth inside: dark, a row of little teeth, the tongue. Box 30 x 8; the middle of the rim (15, 6) = (28, 36).
const mouthP = () => at([blob([[14, 36], [42, 36], [40, 32], [16, 32]], '#7a2a3a'), ...[0, 1, 2, 3, 4].map((k) => T([[16 + k * 5.4, 36], [18.6 + k * 5.4, 36], [17.3 + k * 5.4, 32.6]], '#ffffff'))], [28, 36], [15, 6]);
// The tongue. Box 18 x 10; its root (3, 3) = (31, 35).
const tongueP = () => at([blob([[30, 35], [40, 34], [46, 40], [40, 42]], '#ff8aa8')], [31, 35], [3, 3]);
// The lid with its gems, hinged at the back. Box 34 x 26; the hinge (2, 22) = (13, 36).
const lidP = () => at([
  blob([[13, 36], [13, 30], [16, 26], [40, 26], [43, 30], [43, 36]], WOOD), R(13, 34, 30, 2.6, GOLD), R(19, 26, 3, 10, GOLD), R(34, 26, 3, 10, GOLD),
  ...GEMS.map((c, i) => T([[18 + i * 8, 27], [20 + i * 8, 16 - (i % 2) * 4], [23 + i * 8, 27]], c)), ...GEMS.map((c, i) => F(T([[19.4 + i * 8, 26], [20.4 + i * 8, 19 - (i % 2) * 4], [21.4 + i * 8, 26]], '#ffffff'))),
], [13, 36], [2, 22]);
const PR = {
  FOOT: [false, true].map((f) => tm(`foot${f ? 1 : 0}`, 10, 6, footP(f), 3)), CHEST: tm('chest', 32, 24, chestP, 3, 3), MOUTH: tm('mouth', 30, 8, mouthP, 3, 3),
  TONGUE: tm('tongue', 18, 10, tongueP, 3, 3), LID: tm('lid', 34, 26, lidP, 3, 3),
};
// ---------- Its own face, on the gold lock plate: round coin eyes (a gold rim, a big dark pupil, a
// star glint) and a keyhole for a mouth; it blinks into coin slots and cries a coin when hurt. ----------
const MRIM = '#b8862a';
const MPUP = '#3a2430';
const MCOIN = '#f2c860';
const ln = (pts, w, c = MPUP) => [F(taper(pts, w, w * 0.9, c))];
const star4 = (x, y, r, c, k = 0.36) => F(T(Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4 - Math.PI / 2;
  const rr = i % 2 ? r * k : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c));
const keyhole = (x, y, k = 1, c = MPUP) => [F(E(x, y, 0.8 * k, 0.8 * k, c)), F(T([[x - 0.4 * k, y + 0.3 * k], [x + 0.4 * k, y + 0.3 * k], [x + 0.75 * k, y + 2 * k], [x - 0.75 * k, y + 2 * k]], c))];
const MEYES = [[13.7, 7.2, -1], [18.3, 7.2, 1]];
const mimicFaceShapes = (mood) => {
  const out = [];
  const [mx, my] = [16, 9.9];
  const angry = mood === 'angry' || mood === 'shout';
  for (const [x, y, s] of MEYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...ln([[x - 1.4, y + 0.3], [x + 1.4, y + 0.3]], 0.75));
    else if (mood === 'happy') out.push(star4(x, y, 2, '#7a4a1a'), star4(x, y, 1.45, '#ffe066'));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.3, y - 1.1], [x - s * 1, y], [x + s * 1.3, y + 1.1]], 0.7), F(E(x - s * 0.4, y + 2.6, 0.62, 0.62, MRIM)), F(E(x - s * 0.4, y + 2.6, 0.45, 0.45, MCOIN)));
    else if (mood === 'dizzy') out.push(F(ov(x, y, 0.75, 1.7, s * 14, MRIM)), F(ov(x, y, 0.45, 1.4, s * 14, MCOIN)), F(ov(x - 0.15, y - 0.2, 0.12, 0.8, s * 14, '#fff6c8')));
    else if (mood === 'dead') out.push(...ln([[x - s * 1.3, y + 0.6], [x + s * 0.2, y + 1], [x + s * 1.3, y + 1.7]], 0.7));
    else {
      let rim = Array.from({ length: 16 }, (_, i) => [x + Math.cos((i / 16) * Math.PI * 2) * 1.6, y + Math.sin((i / 16) * Math.PI * 2) * 1.6]);
      let pup = Array.from({ length: 14 }, (_, i) => [x + Math.cos((i / 14) * Math.PI * 2) * 1.15, y + 0.1 + Math.sin((i / 14) * Math.PI * 2) * (angry ? 0.8 : 1.2)]);
      if (angry) {
        const cut = (px) => y - 0.5 + s * (px - x) * -0.5;
        rim = rim.map(([px, py]) => [px, Math.max(py, cut(px))]);
        pup = Array.from({ length: 12 }, (_, i) => [x + Math.cos((i / 12) * Math.PI * 2) * 0.8, y + 0.55 + Math.sin((i / 12) * Math.PI * 2) * 0.8]).map(([px, py]) => [px, Math.max(py, cut(px) + 0.2)]);
      }
      out.push(F(T(rim, MRIM)), F(T(pup, MPUP)));
      if (!angry) out.push(star4(x + 0.45, y - 0.4, 0.8, '#ffffff'));
      else out.push(...ln([[x - s * 1.9, y - 0.5 + 1.9 * 0.5 - 0.25], [x + s * 1.9, y - 0.5 - 1.9 * 0.5 - 0.25]], 0.75));
    }
  }
  if (mood === 'dizzy') out.push(star4(12, 3.4, 0.9, '#ffe066'), star4(16, 2.4, 0.7, '#ffffff'), star4(20, 3.4, 0.9, '#ffe066'));
  if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.3, 1.6, 1.7, 0, 180, 10), MPUP)));
  else if (mood === 'shout') out.push(F(E(mx, my + 0.6, 1.3, 1.6, MPUP)));
  else if (mood === 'angry') out.push(...keyhole(mx, my, 0.75), ...ln([[mx - 1.6, my + 1.8], [mx + 1.6, my + 1.8]], 0.4));
  else if (mood === 'dizzy') out.push(...ln([[mx - 1.2, my + 0.6], [mx - 0.4, my + 0.1], [mx + 0.4, my + 0.7], [mx + 1.2, my + 0.2]], 0.45));
  else out.push(...keyhole(mx, my, mood === 'dead' ? 0.7 : 1));
  return out;
};
const chestFace = (mood) => faceSprite(`tmimic|face|${mood}`, 32, 24, () => mimicFaceShapes(mood));

// The chest's middle sits 16 above the feet.
const BODY_Y = 16;
const FEETX = [-8, 0, 8];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  const foot = (k, far) => ({ name: `foot${k}${tag}`, parent: 'chestJ', s: PR.FOOT[far ? 1 : 0][i], pivot: [5, 1], at: (S) => [FEETX[k], 10.5 - S[`y${k}`]], rot: (S) => -S.tilt * D2R });
  const open = (a, S) => clamp(-S.lid / 14, 0, 1);
  return [
    foot(0, true),
    foot(1, true),
    { name: `mouth${tag}`, parent: 'chestJ', s: PR.MOUTH[i], pivot: [15, 6], at: () => [0, -10.5], alpha: open },
    { name: `tongue${tag}`, parent: 'chestJ', s: PR.TONGUE[i], pivot: [3, 3], at: () => [3, -11.5], rot: (S) => S.tg * D2R, alpha: open },
    { name: `chest${tag}`, parent: 'chestJ', s: PR.CHEST[i], pivot: [16, 11] },
    ...(bare ? [{ name: 'face', parent: 'chestJ', s: (a) => chestFace(MOODS.has(a.tmMood) ? a.tmMood : 'idle'), pivot: [16, 11] }] : []),
    foot(2, false),
    { name: `lid${tag}`, parent: 'chestJ', s: PR.LID[i], pivot: [2, 22], at: () => [-15, -10.5], rot: (S) => S.lid * D2R },
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

export const treasureMimicRig = sized(makeRig({
  w: 90, h: 80, soft: true, stride: 16, recover: 0.6,
  springs: { x: [240, 18], lift: [300, 16], tilt: [180, 12], lid: [320, 14], tg: [160, 8], y0: [400, 24], y1: [400, 24], y2: [400, 24] },
  fast: ['x', 'lid', 'y0', 'y1', 'y2'],
  kick: { tilt: -170, lid: -500 },
  turnKick: { tilt: 110, lid: -160 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.89;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'tmimic', 16);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: still as a chest; the lid creaking open a crack to peek; a shuffle of its feet.
    const peek = hold(lu, 2.6, 3, 4.2, 4.6) * calm;
    const shuffle = hold(lu, 6.4, 6.6, 7.4, 7.6) * calm;
    const sh = Math.sin(t * 16);
    const idle = {
      x: 0, lift: 0, tilt: shuffle * sh * 3, lid: -peek * 11, tg: 0,
      y0: shuffle * Math.max(0, sh) * 1.6, y1: shuffle * Math.max(0, -sh) * 1.6, y2: shuffle * Math.max(0, sh) * 1.6,
    };
    // Pattering along.
    const s = Math.sin(u * TAU);
    const walk = { x: 0, lift: Math.abs(s) * 1.4, tilt: s * 4, lid: -4 - Math.abs(s) * 4, tg: 0, y0: Math.max(0, s) * 2.4, y1: Math.max(0, -s) * 2.4, y2: Math.max(0, s) * 2.4 };
    // The lid creaking open, the tongue lolling; then the lunge and the chomp.
    const antic = { x: -2, lift: 0, tilt: -8, lid: -38, tg: Math.sin(t * 8) * 10, y0: 0, y1: 0, y2: 0 };
    const strike = { x: 6, lift: 2, tilt: 8, lid: 2, tg: 0, y0: 0, y1: 1.4, y2: 1.4 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: tipped back, the lid flopped open, the tongue out.
    if (m.hp <= 0) Object.assign(S, { x: -2, lift: 0, tilt: -14, lid: -70, tg: 30, y0: 0, y1: 0, y2: 0 });
    a.tmMood = m.hp <= 0 ? 'dizzy' : moodOf(a, peek > 0.5 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'chestJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.22;
    ctx.fillStyle = '#1a2a3a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 15, 3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // The gems twinkling now and then, and a burst of twinkles off the chomp.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const t = a.now + (m.uid % 5);
    const L = mat('chestJ');
    const tw = (x, y, r, al) => {
      ctx.globalAlpha = a.alpha * al;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fill();
    };
    ctx.save();
    ctx.fillStyle = '#ffffff';
    const q = (t * 0.4) % 1;
    if (q < 0.25) {
      const [gx, gy] = at2(L, -6 + Math.floor(t * 0.4) % 3 * 8, -26);
      tw(gx, gy, 2.4 * Math.sin((q / 0.25) * Math.PI), 0.9);
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.45) {
      const p = since / 0.45;
      const [cx, cy] = at2(L, 16, -10);
      for (const [dx, dy, r] of [[4, -6, 3], [9, 2, 2.4], [2, 6, 2]]) tw(cx + dx + p * 6, cy + dy - p * 4, r * (0.6 + p * 0.6), 1 - p);
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): waiting.
export function treasureMimicStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(footP(true)(), [5, 1], FEETX[0], by + 10.5), ...put(footP(true)(), [5, 1], FEETX[1], by + 10.5), ...put(chestP(), [16, 11], 0, by), ...put(mimicFaceShapes(fm), [16, 11], 0, by),
    ...put(footP(false)(), [5, 1], FEETX[2], by + 10.5), ...put(lidP(), [2, 22], -15, by - 10.5),
  ];
  const ox = 24;
  const oy = 46;
  return { w: 48, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
