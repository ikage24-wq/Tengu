// The Storm Harpist, remade 2026-11-20 (the player's pick "Thundercloud Harpist"): a round little
// storm cloud with gold lightning-bolt horns and a golden harp, drizzling as it drifts. Live rig,
// outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: bobbing and drizzling; a rumble (a shiver, the horns crackling); a soft strum,
//           little notes floating off.
//   walk    drifting along, leaning into the wind.
//   fight   it lifts the harp and its horns crackle; then strums and a bolt of lightning snaps out
//           ahead (slim, and it bends smoothly, never jumping about).
//   hit     knocked back, the horns jangling.
//   dead    it sinks to the ground, the drizzle stops, the horns droop, dizzy.
// Built in the concept's own units and drawn at K of them; the cloud floats with its bottom 6 above
// the floor (the drizzle reaches down to it).

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, faceShapes } from './rigkit.js';

const K = 0.7;
const STORM = '#6a76a8';
const STORML = '#8e9ad0';
const BOLT = '#ffd84a';
const GOLD = '#f2c860';
const tc = pairOf('thundercl');
const at = (shapes, [px, py], [bx, by]) => shift(shapes, bx - px, by - py);

// ---------- Parts ----------
// The cloud. Box 52 x 40; its middle (26, 20) = (30, 40).
const cloudP = () => at([
  ...[[14, 40, 8, 7], [22, 32, 10, 9], [34, 30, 11, 10], [44, 40, 8, 7], [28, 46, 14, 8], [38, 48, 8, 6], [18, 48, 7, 5]].map(([x, y, rx, ry]) => E(x, y, rx, ry, STORM)),
  F(E(22, 28, 6, 3, STORML)), F(E(34, 25, 7, 3.4, STORML)),
], [30, 40], [26, 20]);
// The horns, gold zig-zags. Box 14 x 22; each one's base (6, 20).
const hornLP = () => at([T([[20, 22], [16, 8], [22, 14], [21, 4], [27, 18]], BOLT)], [22.6, 20], [6, 20]);
const hornRP = () => at([T([[36, 18], [40, 4], [40, 13], [46, 8], [42, 22]], BOLT)], [39.6, 20], [6, 20]);
// The golden harp. Box 18 x 22; held at (5, 13).
const harpP = () => {
  const [x, y, k] = [10, 8, 1.1];
  return [
    taper(arcP(x, y, 6 * k, 8 * k, 200, 340, 8), 1.8 * k, 1.8 * k, GOLD), taper([[x - 5.6 * k, y - 2.8 * k], [x - 4 * k, y + 8 * k]], 1.8 * k, 1.6 * k, GOLD), taper([[x - 4 * k, y + 8 * k], [x + 6 * k, y + 2 * k]], 1.6 * k, 1.6 * k, GOLD),
    ...[0, 1, 2, 3].map((i) => F(taper([[x - 3.6 * k + i * 2.2 * k, y - 5.6 * k + i * 0.6 * k], [x - 3.2 * k + i * 2.2 * k, y + 6.6 * k - i * 1.4 * k]], 0.4, 0.4, '#fff6d0'))),
  ];
};
// The little cloud-puff hand on the harp. Box 8 x 8; (4, 4).
const handP = () => [E(4, 4, 3, 2.8, STORM)];
const PR = {
  CLOUD: tc('cloud', 52, 40, cloudP, 3, 3), HORNL: tc('hornL', 14, 22, hornLP, 3, 3), HORNR: tc('hornR', 14, 22, hornRP, 3, 3), HARP: tc('harp', 18, 22, harpP, 3, 3), HAND: tc('hand', 8, 8, handP, 3, 3),
};
const FACE = { eyes: [[23, 17, 1.9, 2.4, -1], [30, 17, 1.9, 2.4, 1]], mouth: [26.6, 21.6, 1.3], blush: [[20, 20.4, 1.3], [33.4, 20.4, 1.3]], iris: '#2a3a6a', lid: 0, lashes: 0 };
const cloudFace = (mood) => faceSprite(`thundercl|face|${mood}`, 52, 40, () => faceShapes(mood, FACE));

// The cloud's middle floats 20 above the floor.
const BODY_Y = 20;
const HARP_AT = [12, 6];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `hornL${tag}`, parent: 'cloudJ', s: PR.HORNL[i], pivot: [6, 20], at: () => [-7.4, -20], rot: (S) => -S.horn * D2R },
    { name: `hornR${tag}`, parent: 'cloudJ', s: PR.HORNR[i], pivot: [6, 20], at: () => [9.6, -20], rot: (S) => S.horn * D2R },
    { name: `cloud${tag}`, parent: 'cloudJ', s: PR.CLOUD[i], pivot: [26, 20] },
    ...(bare ? [{ name: 'face', parent: 'cloudJ', s: (a) => cloudFace(MOODS.has(a.tcMood) ? a.tcMood : 'idle'), pivot: [26, 20] }] : []),
    { name: `harp${tag}`, parent: 'harpJ', s: PR.HARP[i], pivot: [5, 13] },
    { name: `hand${tag}`, parent: 'harpJ', s: PR.HAND[i], pivot: [4, 4], at: () => [-1, 1] },
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

export const thundercloudRig = sized(makeRig({
  w: 140, h: 84, soft: true, stride: 22, recover: 0.6,
  springs: { x: [200, 16], lift: [90, 9], tilt: [140, 10], horn: [160, 6], hp: [200, 12], hx: [260, 16] },
  fast: ['x', 'hp', 'hx'],
  kick: { tilt: -160, horn: 500, hp: -200 },
  turnKick: { tilt: 110, horn: 200 },
  pose(m, a) {
    a.uidOff = (m.uid % 13) * 0.67;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: bobbing and drizzling; a rumble, horns crackling; a soft strum.
    const rumble = hold(lu, 2.6, 2.8, 3.6, 3.8) * calm;
    const strum = hold(lu, 6, 6.3, 7.4, 7.8) * calm;
    const bob = Math.sin(t * 1.6);
    const idle = {
      x: 0, lift: bob * 1.6 + 1.6, tilt: Math.sin(t * 0.9) * 3 + rumble * Math.sin(t * 40) * 3, horn: rumble * Math.sin(t * 33) * 10 + bob * 2,
      hp: strum * Math.sin(t * 6) * 10 - 6, hx: strum * Math.sin(t * 6) * 1.2,
    };
    // Drifting, leaning into the wind.
    const walk = { x: 0, lift: Math.sin(t * 3) * 2 + 2, tilt: 7 + Math.sin(t * 3) * 2, horn: -6 + Math.sin(t * 3) * 3, hp: -10, hx: 0 };
    // The harp lifted, horns crackling; then the strum.
    const antic = { x: -2, lift: 3, tilt: -7, horn: Math.sin(t * 30) * 8, hp: -26, hx: -3 };
    const strike = { x: 3, lift: 1, tilt: 6, horn: 8, hp: 18, hx: 4 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: sunk to the ground, horns drooping, the harp dropped.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -6, tilt: -8, horn: 34, hp: 70, hx: 2 });
    a.tcMood = m.hp <= 0 ? 'dizzy' : moodOf(a, strum > 0.4 ? 'happy' : null);
    a.tcStrum = strum;
    a.tcRumble = rumble;
    return S;
  },
  parts: [
    { name: 'cloudJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'harpJ', parent: 'cloudJ', at: (S) => [HARP_AT[0] + S.hx, HARP_AT[1]], rot: (S) => (S.hp - S.tilt) * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a, S) {
    ctx.globalAlpha = a.alpha * clamp(0.2 - (S.lift ?? 0) * 0.006, 0.1, 0.24);
    ctx.fillStyle = '#2a3a6a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 14, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // Drizzle under it; crackles between the horns; notes off a soft strum; the bolt of the strike.
  fx(ctx, m, a, S, mat) {
    const C = mat('cloudJ');
    const t = a.now + (m.uid % 5);
    ctx.save();
    if (m.hp > 0) {
      ctx.fillStyle = '#4f8fe0';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      for (let k = 0; k < 4; k++) {
        const q = (t * 1.4 + k / 4) % 1;
        const [x0, y0] = at2(C, -10 + k * 6.4, 12);
        const y = y0 + q * (-y0 - 1);
        ctx.globalAlpha = a.alpha * Math.min(1, (1 - q) * 2) * 0.9;
        ctx.beginPath();
        ctx.moveTo(x0, y - 2.4);
        ctx.quadraticCurveTo(x0 + 1.4, y, x0, y + 1.2);
        ctx.quadraticCurveTo(x0 - 1.4, y, x0, y - 2.4);
        ctx.fill();
        ctx.stroke();
      }
    }
    // (Crackles: a slim zig between the horns that bends smoothly with time.)
    const crackle = m.hp > 0 ? Math.max(a.ph.antic, a.tcRumble ?? 0) : 0;
    if (crackle > 0.1) {
      const [ax, ay] = at2(C, -8, -30);
      const [bx, by] = at2(C, 10, -30);
      ctx.globalAlpha = a.alpha * crackle;
      ctx.strokeStyle = BOLT;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        const x = ax + (bx - ax) * u;
        const y = ay + (by - ay) * u + Math.sin(u * Math.PI) * (Math.sin(t * 7 + i * 2.1) * 3);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    // (Notes floating off a soft strum.)
    const strum = m.hp > 0 ? a.tcStrum ?? 0 : 0;
    if (strum > 0.2) {
      const [hx, hy] = at2(mat('harpJ'), 10, -4);
      for (let k = 0; k < 2; k++) {
        const q = (t * 0.8 + k * 0.5) % 1;
        const x = hx + 4 + q * 10 + k * 3;
        const y = hy - q * 14;
        ctx.globalAlpha = a.alpha * strum * (1 - q);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(x, y, 1.6, 1.2, -0.4, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 1.4, y);
        ctx.lineTo(x + 1.4, y - 5);
        ctx.lineTo(x + 3.4, y - 4);
        ctx.stroke();
      }
    }
    // (The strike: a slim bolt from the harp out ahead, bending smoothly as it fades.)
    const since = a.ph.since ?? -1;
    if (m.hp > 0 && since >= 0 && since < 0.32) {
      const q = since / 0.32;
      const [sx, sy] = at2(mat('harpJ'), 14, 2);
      const L = 46 + q * 10;
      const pts = [];
      for (let i = 0; i <= 7; i++) {
        const u = i / 7;
        pts.push([sx + u * L, sy + 2 * u + Math.sin(u * Math.PI) * Math.sin(t * 5 + i * 1.9) * 5 * (i % 2 ? 1 : -0.6)]);
      }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (const [w, c, al] of [[3.4, BOLT, 0.9], [1.3, '#ffffff', 1]]) {
        ctx.globalAlpha = a.alpha * (1 - q) * al;
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      ctx.globalAlpha = a.alpha * (1 - q);
      ctx.fillStyle = '#fff6c8';
      ctx.beginPath();
      ctx.arc(pts[7][0], pts[7][1], 3 * (1 - q * 0.5), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): drifting.
export function thundercloudStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y - 1.6;
  const sh = [
    ...put(hornLP(), [6, 20], -7.4, by - 20), ...put(hornRP(), [6, 20], 9.6, by - 20), ...put(cloudP(), [26, 20], 0, by), ...put(faceShapes(fm, FACE), [26, 20], 0, by),
    ...put(harpP(), [5, 13], HARP_AT[0], by + HARP_AT[1], -6), ...put(handP(), [4, 4], HARP_AT[0] - 1, by + HARP_AT[1] + 1),
  ];
  const ox = 26;
  const oy = 46;
  return { w: 54, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
