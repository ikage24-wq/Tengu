// The Star Seraph, remade 2026-11-20 (the player's pick "Star Jelly"): a sky jellyfish of starlight
// with a golden halo, a lilac bell with a star glowing inside, ribbons of stardust trailing with a
// twinkle at each tip. A flyer: drawn round its hover point (the ribbon tips). Live rig, outer outline
// only, the face bare, no squash (its "pulse" is a lift and a flare of the ribbons, never a squeeze).
//
// How it moves:
//   idle    a 10 s act: drifting, a soft pulse every couple of seconds (it rises, the ribbons flare);
//           its inner star spinning round once; a burst of twinkles.
//   walk    drifting along, the ribbons streaming behind.
//   fight   it draws up, its star glowing brighter; then pulses and sends a shower of little stars.
//   hit     knocked back, the halo bobbing.
//   dead    it dims and sinks, the ribbons going limp, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, put, shift, MOODS, moodOf } from './rigkit.js';

const K = 0.78;
const JELLY = '#c8c0ff';
const JELLYL = '#e8e4ff';
const GOLD = '#f2c860';
const sj = pairOf('starjelly');

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
const star5 = (x, y, r, c, inner = 0.48) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(smoothPts(pts, 1), c);
};

// ---------- Parts ----------
// The bell. Box 44 x 28; its middle (22, 13) = (32, 20).
const bellP = () => at([
  blob([[12, 30], [14, 18], [22, 10], [32, 8], [42, 10], [50, 18], [52, 30], [46, 28], [40, 32], [32, 28], [24, 32], [18, 28]], JELLY),
  F(blob([[18, 24], [22, 14], [32, 11], [36, 13], [28, 16], [22, 24]], JELLYL, 1)),
], [32, 20], [22, 13]);
// The star inside. Box 14 x 14; its middle (7, 7).
const starP = () => [F(star5(7, 7, 6, '#ffd86a')), F(star5(7, 6.6, 3.2, '#fff8dc'))];
// The halo. Box 20 x 8; its middle (10, 4).
const haloP = () => [taper(arcP(10, 4, 8, 2.4, 0, 360, 18), 1.6, 1.6, GOLD)];
const PR = { BELL: sj('bell', 44, 28, bellP, 3, 3), STAR: sj('star', 14, 14, starP, 3, 3), HALO: sj('halo', 20, 8, haloP, 3, 3) };
// ---------- Its own face, either side of its star: starry eyes (deep violet with a little night
// sky of white specks in them), stardust freckles on its cheeks, a small serene smile under the
// star; teary, its tears glow. ----------
const JDARK = '#2e2266';
const JLOW = '#7a6ad8';
const ln = (pts, w, c = JDARK) => [F(taper(pts, w, w * 0.85, c))];
const twinkle = (x, y, r, c = '#ffffff') => F(T([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], c));
const JEYES = [[15.2, 14.6, -1], [28.8, 14.6, 1]];
const jellyFaceShapes = (mood) => {
  const out = [];
  const angry = mood === 'angry';
  for (const [x, y, s] of JEYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...ln(arcP(x, y, 1.9, 1, 15, 165, 8), 0.7));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 1.1, 1.9, 1.7, 200, 340, 8), 0.75));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.5, y - 1.3], [x - s * 1.1, y], [x + s * 1.5, y + 1.3]], 0.7), F(E(x, y + 2.5, 0.55, 0.85, '#bff4ff')), twinkle(x, y + 2.3, 0.4));
    else if (mood === 'dizzy') out.push(twinkle(x - 1, y - 0.8, 1.1, '#f0a020'), twinkle(x + 1, y + 0.2, 0.9, '#f0a020'), twinkle(x - 0.4, y + 1.4, 0.75, '#f0a020'));
    else if (mood === 'dead') out.push(...ln([[x - 1.5, y + 0.2], [x + 1.5, y + 0.2]], 0.55, '#8a80b8'));
    else {
      const wide = mood === 'shout' ? 1.12 : 1;
      let eye = Array.from({ length: 16 }, (_, i) => [x + Math.cos((i / 16) * Math.PI * 2) * 1.9 * wide, y + Math.sin((i / 16) * Math.PI * 2) * 2.4 * wide]);
      let low = Array.from({ length: 12 }, (_, i) => [x + Math.cos((i / 12) * Math.PI * 2) * 1.35, y + 1 + Math.sin((i / 12) * Math.PI * 2) * 1.1]);
      if (angry) {
        eye = eye.map(([px, py]) => [px, Math.max(py, y - 0.7 + (px - x) * -s * 0.5)]);
        low = low.map(([px, py]) => [px, Math.max(py, y - 0.4 + (px - x) * -s * 0.5)]);
      }
      out.push(F(T(eye, JDARK)), F(T(low, JLOW)));
      // The little night sky: a big shine and three specks.
      if (!angry) out.push(twinkle(x + 0.6, y - 0.9, 0.85), F(E(x - 0.8, y + 0.2, 0.17, 0.17, '#ffffff')), F(E(x + 0.2, y + 1.4, 0.15, 0.15, '#ffffff')), F(E(x - 0.3, y - 1.3, 0.13, 0.13, '#ffffff')));
      else out.push(...ln([[x + s * 2, y - 3.4], [x - s * 1.6, y - 2.2]], 0.6));
    }
  }
  // Stardust freckles (gone when it is out).
  if (mood !== 'dead') for (const [fx, fy] of [[11.4, 17.6], [12.6, 18.6], [11, 19.2], [32.6, 17.6], [31.4, 18.6], [33, 19.2]]) out.push(F(E(fx, fy, 0.32, 0.32, '#ffe08a')));
  const [mx, my] = [22, 21];
  if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.4, 1.3, 1.2, 0, 180, 8), '#5a3a8a')));
  else if (mood === 'shout') out.push(F(E(mx, my + 0.3, 1, 1.3, '#5a3a8a')));
  else if (angry) out.push(...ln([[mx - 1, my + 0.3], [mx, my - 0.2], [mx + 1, my + 0.3]], 0.4));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 1, my + 0.2], [mx - 0.35, my - 0.15], [mx + 0.35, my + 0.2], [mx + 1, my - 0.15]], 0.35));
  else if (mood === 'dead') out.push(...ln([[mx - 0.7, my], [mx + 0.7, my]], 0.35, '#8a80b8'));
  else out.push(...ln(arcP(mx, my - 0.5, 1, 0.7, 20, 160, 8), 0.4));
  return out;
};
const jellyFace = (mood) => faceSprite(`starjelly|face|${mood}`, 44, 28, () => jellyFaceShapes(mood));

// The bell's middle floats 36 above its hover point, the ribbons hanging down to it.
const BELL_Y = 36;
const RIBBONS = [-12, -6, 0, 6, 12];

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `halo${tag}`, parent: 'haloJ', s: PR.HALO[i], pivot: [10, 4] },
    { name: `bell${tag}`, parent: 'bellJ', s: PR.BELL[i], pivot: [22, 13] },
    { name: `star${tag}`, parent: 'starJ', s: PR.STAR[i], pivot: [7, 7] },
    ...(bare ? [{ name: 'face', parent: 'bellJ', s: (a) => jellyFace(MOODS.has(a.sjMood) ? a.sjMood : 'idle'), pivot: [22, 13] }] : []),
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
const starPath = (ctx, x, y, r, rot) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = rot - Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    if (i) ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    else ctx.moveTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
};

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

export const starJellyRig = sized(makeRig({
  w: 120, h: 90, soft: true, stride: 40, recover: 0.7,
  springs: { x: [160, 14], lift: [70, 7], tilt: [90, 9], hb: [60, 5], sr: [60, 9], trail: [40, 8], pulse: [120, 9], dim: [40, 10] },
  fast: ['x'],
  kick: { tilt: -140, hb: 90, lift: 40 },
  turnKick: { tilt: 90 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 13) * 0.83;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 10;
    // Its act: drifting with a soft pulse now and then; the inner star spinning round; twinkles.
    const pulse = Math.pow(Math.max(0, Math.sin(t * 2.6)), 6);
    const spin = clamp((lu - 4) / 1.2, 0, 1) * (lu < 6 ? 1 : 0) * calm;
    const twk = hold(lu, 7.4, 7.6, 8.4, 8.8) * calm;
    const idle = { x: 0, lift: Math.sin(t * 1.1) * 2 + pulse * 3, tilt: Math.sin(t * 0.8) * 4, hb: Math.sin(t * 1.6) * 1.2, sr: Math.sin(t * 0.7) * 10 + spin * 360, trail: 0, pulse, dim: 0 };
    const walk = { x: 0, lift: Math.sin(t * 2) * 2.4 + pulse * 3, tilt: 8, hb: 1.6, sr: Math.sin(t * 0.7) * 10, trail: -1, pulse, dim: 0 };
    const antic = { x: -2, lift: 6, tilt: -6, hb: -1, sr: 30, trail: 0.4, pulse: 0.2, dim: 0 };
    const strike = { x: 3, lift: 3, tilt: 6, hb: 2, sr: -40, trail: -0.6, pulse: 1, dim: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // (The star's turn only ever goes forwards: once round, the spring is wound back by a whole turn.)
    const ss = a.mo.rig?.sr;
    if (ss) while (ss.x - S.sr > 180) ss.x -= 360;
    // Beaten: dimming and sinking, the ribbons limp.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -10, tilt: 20, hb: 4, sr: 0, trail: 0, pulse: 0, dim: 1 });
    a.sjMood = m.hp <= 0 ? 'dizzy' : moodOf(a, twk > 0.4 || spin > 0.1 ? 'happy' : null);
    a.sjTwk = twk;
    return S;
  },
  parts: [
    { name: 'bellJ', parent: null, at: (S) => [S.x, -BELL_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'starJ', parent: 'bellJ', at: () => [0, 0], rot: (S) => S.sr * D2R },
    { name: 'haloJ', parent: 'bellJ', at: (S) => [0, -16 + S.hb] },
    ...pass(false),
    ...pass(true),
  ],
  // The ribbons of stardust, behind the bell: soft waves trailing back, a twinkle at each tip.
  under(ctx, m, a, S, mat) {
    const M = mat('bellJ');
    const t = a.now + (m.uid % 7);
    const limp = 1 - (S.dim ?? 0) * 0.8;
    ctx.save();
    RIBBONS.forEach((rx, k) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const u = i / 8;
        const wave = Math.sin(t * 2.2 - u * 4 + k * 1.3) * (2 + u * 3) * limp * (1 + (S.pulse ?? 0) * 0.6);
        pts.push(at2(M, rx * (1 + (S.pulse ?? 0) * 0.25 * u) + wave + (S.trail ?? 0) * u * u * 14, 9 + u * 27 * (0.92 + 0.08 * limp)));
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [w, c] of [[3.6, '#9a8ad8'], [2.4, k % 2 ? '#fff0b0' : '#ffffff']]) {
        ctx.globalAlpha = a.alpha * (1 - (S.dim ?? 0) * 0.5);
        ctx.strokeStyle = c;
        ctx.lineWidth = w * 0.9;
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      const [tx, ty] = pts[8];
      const tw = 1.6 + Math.sin(t * 4 + k) * 0.5;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(tx, ty - tw * 1.4);
      ctx.quadraticCurveTo(tx, ty, tx + tw * 1.4, ty);
      ctx.quadraticCurveTo(tx, ty, tx, ty + tw * 1.4);
      ctx.quadraticCurveTo(tx, ty, tx - tw * 1.4, ty);
      ctx.quadraticCurveTo(tx, ty, tx, ty - tw * 1.4);
      ctx.fill();
    });
    ctx.restore();
  },
  // The star's glow (brighter as it draws up to strike); twinkles; the shower of little stars.
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const [sx, sy] = at2(mat('bellJ'), 0, 0);
    const t = a.now;
    ctx.save();
    const glow = 0.2 + a.ph.antic * 0.32 + (S.pulse ?? 0) * 0.15;
    const g = ctx.createRadialGradient(sx, sy - 1, 0, sx, sy - 1, 9 + a.ph.antic * 4);
    g.addColorStop(0, `rgba(255,246,200,${glow * a.alpha})`);
    g.addColorStop(1, 'rgba(255,246,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - 20, sy - 20, 40, 40);
    if ((a.sjTwk ?? 0) > 0.1) {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 4; k++) {
        const ang = (k / 4) * TAU + t * 0.8;
        const q = (t * 1.2 + k * 0.25) % 1;
        ctx.globalAlpha = a.alpha * a.sjTwk * Math.sin(q * Math.PI);
        starPath(ctx, sx + Math.cos(ang) * 24, sy + Math.sin(ang) * 18, 1.8 + q * 1.2, t);
        ctx.fill();
      }
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.9) {
      const q = since / 0.9;
      for (let k = 0; k < 5; k++) {
        const d = q * (30 + k * 7);
        const x = sx + 12 + d;
        const y = sy - 4 + (k - 2) * 5 - Math.sin(q * Math.PI) * 8 + q * q * 6;
        ctx.globalAlpha = a.alpha * (1 - q);
        ctx.fillStyle = k % 2 ? '#ffd86a' : '#fff6c8';
        starPath(ctx, x, y, 3 - k * 0.2, q * 4 + k);
        ctx.fill();
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): drifting.
export function starJellyStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BELL_Y;
  const ribbons = RIBBONS.flatMap((rx, k) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push([rx + Math.sin(i * 0.9 + k) * 2.6, by + 9 + (i / 6) * 27]);
    return [taper(pts, 2.2, 0.8, k % 2 ? '#fff0b0' : '#ffffff')];
  });
  const sh = [...ribbons, ...put(haloP(), [10, 4], 0, by - 16), ...put(bellP(), [22, 13], 0, by), ...put(starP(), [7, 7], 0, by), ...put(jellyFaceShapes(fm), [22, 13], 0, by)];
  const ox = 24;
  const oy = 46;
  return { w: 48, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
