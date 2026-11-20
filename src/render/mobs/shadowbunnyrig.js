// The Wraith, remade 2026-11-20 (the player's pick "Shadow Bunny"): a hand-shadow rabbit come to
// life, playing in the Crystal Cave's Shade Spires: long ears, a tail that trails off in puffs of
// smoke, a little crystal charm on a pink ribbon, one big glowing gold eye. A flyer: drawn round its
// hover point. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    an 8 s act: bobbing in the air, ears twitching, the tail curling; a quick sniff of the
//           air; then, playing, a whole forward somersault.
//   walk    gliding along, the ears and tail streaming back.
//   fight   it draws back, ears flat; then lunges and bites with a glowing mouth.
//   hit     knocked back, the ears flicking.
//   dead    it droops and sinks, the ears flopped, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.72;
const SH = '#4a3e78';
const SHD = '#382e60';
const RIM = '#8a7ad0';
const GLOW = '#ffd84a';
const sb = pairOf('shbunny');

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

// ---------- Parts ----------
// The body, with the pink ribbon at its neck. Box 24 x 22; its middle (12, 11) = (30, 44).
const bodyP = () => at([E(30, 44, 11, 10, SH), F(taper(arcP(30, 44, 11, 10, 150, 250, 8), 1.1, 0.5, RIM)), F(taper([[33, 39.6], [37.6, 40.8], [41.6, 39.6]], 1.2, 1.2, '#ff9ac8'))], [30, 44], [12, 11]);
// The head and snout. Box 24 x 18; its middle (11, 10) = (38, 32).
const headP = () => at([E(38, 32, 9.6, 8.6, SH), blob([[42, 29], [49, 32], [48.6, 37], [43, 38]], SH), F(taper(arcP(38, 32, 9.6, 8.6, 200, 280, 8), 1.1, 0.5, RIM))], [38, 32], [11, 10]);
// The ears, each rooted inside the head. Box 12 x 26; the root (8, 22) / (3, 21).
const earBP = () => at([taper([[33, 27], [29.4, 15], [28.4, 8]], 6.6, 4, SHD), E(28.4, 8, 2, 2.2, SHD)], [33, 27], [8, 22]);
const earFP = () => at([taper([[37, 26], [38.4, 15], [41.6, 9]], 7, 4.2, SH), E(41.8, 8.6, 2.2, 2.4, SH), F(taper([[37.8, 22], [38.6, 15], [41, 10.4]], 1.8, 1, RIM))], [37, 26], [3, 21]);
// The tail, a wisp of smoke curling up behind it in shrinking puffs. Box 22 x 18; its root (18, 10) = (26, 50).
const tailP = () => at([
  E(23, 51, 4.2, 3.8, SH), E(18.6, 52.6, 3.2, 2.9, '#52467e'), E(15, 51, 2.4, 2.2, '#5a4e86'), E(13, 48, 1.7, 1.6, '#62568e'), E(13.6, 45.4, 1.1, 1.1, '#6a5e96'),
  F(E(18.2, 51.4, 1.2, 0.8, RIM)), F(E(14.6, 50, 0.9, 0.6, RIM)),
], [26, 50], [18, 10]);
// A forepaw on its little arm. Box 10 x 8; the shoulder (2, 2).
const pawP = (far) => () => [taper([[2, 2], [7, 4.6]], 3.4, 3, far ? SHD : SH), E(7, 4.8, 2.4, 2, far ? SHD : SH)];
// The crystal charm, hanging from the ribbon. Box 8 x 8; its loop (4, 1).
const charmP = () => [T([[2.8, 1], [5.2, 1], [5.2, 4.4], [4, 6.4], [2.8, 4.4]], '#8ae8ff'), F(T([[4, 1], [5.2, 1], [5.2, 4.4], [4, 6.4]], '#e0fcff'))];
const PR = {
  TAIL: sb('tail', 22, 18, tailP, 3, 3), EARB: sb('earB', 12, 26, earBP, 3, 3), EARF: sb('earF', 12, 26, earFP, 3, 3), BODY: sb('body', 24, 22, bodyP, 3, 3),
  HEAD: sb('head', 24, 18, headP, 3, 3), PAW: [false, true].map((f) => sb(`paw${f ? 1 : 0}`, 10, 8, pawP(f), 3, 3)), CHARM: sb('charm', 8, 8, charmP, 3, 3),
};

// ---------- Its own face: one big glowing gold eye with no pupil, a sparkle in it; and the shadow
// puppet's mouth (the gap between the fingers), a thin gold line that opens wide and glows to bite. ----------
const twinkle = (x, y, r, c = '#ffffff') => F(T([[x, y - r], [x + r * 0.3, y - r * 0.3], [x + r, y], [x + r * 0.3, y + r * 0.3], [x, y + r], [x - r * 0.3, y + r * 0.3], [x - r, y], [x - r * 0.3, y - r * 0.3]], c));
const EYE = [[9.2, 9.4], [11, 6.6], [14.6, 6.4], [16.6, 8.6], [14.4, 11], [11, 11.2]];
const bunFaceShapes = (mood) => {
  const out = [];
  const [x, y] = [12.9, 8.8];
  if (mood === 'blink' || mood === 'sleep') out.push(...ln(arcP(x, y - 0.2, 3.4, 1.6, 15, 165, 8), 0.9, GLOW));
  else if (mood === 'happy') out.push(...ln(arcP(x, y + 1.4, 3.2, 2.6, 200, 340, 8), 0.95, GLOW));
  else if (mood === 'hurt') out.push(...ln([[x - 2.6, y - 2.2], [x + 2.2, y], [x - 2.6, y + 2.2]], 0.9, GLOW));
  else if (mood === 'dizzy') {
    const pts = [];
    for (let i = 0; i <= 14; i++) pts.push([x + Math.cos(i * 0.8) * (0.2 + i * 0.18), y + Math.sin(i * 0.8) * (0.2 + i * 0.18)]);
    out.push(...ln(pts, 0.6, GLOW));
  } else if (mood === 'dead') out.push(...ln([[x - 2.8, y + 0.4], [x, y + 0.9], [x + 2.8, y + 0.4]], 0.8, '#8a80b0'));
  else {
    let pts = EYE;
    if (mood === 'angry') pts = EYE.map(([px, py]) => [px, Math.max(py, y - 0.6 + (px - x) * 0.45)]);
    if (mood === 'shout') pts = Array.from({ length: 14 }, (_, i) => [x + Math.cos((i / 14) * TAU) * 3.4, y + Math.sin((i / 14) * TAU) * 2.8]);
    out.push(F(T(pts, GLOW)), F(T(pts.map(([px, py]) => [x + (px - x) * 0.62, y + 0.2 + (py - y) * 0.62]), '#fff4c0')));
    if (mood !== 'angry') out.push(twinkle(x + 2, y - 2.4, 0.9));
  }
  // The mouth: a thin gold line; open and glowing to bite (or to shout).
  if (mood === 'shout') out.push(F(T([[16.4, 13], [23, 11], [23.6, 17], [17, 16]], '#2a2048')), F(T([[17.6, 13.6], [22, 12.4], [22.4, 15.8], [18, 15.2]], GLOW)));
  else if (mood === 'happy') out.push(F(T([[17.2, 13.2], [21.6, 12.4], [20.6, 14.6], [18, 14.8]], GLOW)));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[17.2, 13.8], [18.6, 13.2], [20, 13.8], [21.6, 13.1]], 0.5, GLOW));
  else if (mood === 'dead') out.push(...ln([[17.2, 13.6], [21.6, 12.8]], 0.5, '#8a80b0'));
  else out.push(...ln([[17.2, 13.6], [21.6, 12.6]], 0.55, GLOW));
  return out;
};
const bunFace = (mood) => faceSprite(`shbunny|face|${mood}`, 24, 18, () => bunFaceShapes(mood));

// The body's middle floats 18 above its hover point; the head, ears and tail hang off it.
const BODY_Y = 18;
const HEAD_AT = [8, -12];
const EARB_AT = [-5, -5];
const EARF_AT = [-1, -6];
const TAIL_AT = [-4, 6];
const PAW_N = [8, 0];
const PAW_F = [6, 3];
const CHARM_AT = [8, -2.6];

// (Flyers are always "moving" to the game: go by how far it really travelled.)
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
const smooth = (x) => x * x * (3 - 2 * x);

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `earB${tag}`, parent: 'headJ', s: PR.EARB[i], pivot: [8, 22], at: () => EARB_AT, rot: (S) => S.eB * D2R },
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [18, 10], at: () => TAIL_AT, rot: (S) => S.tl * D2R },
    { name: `paw1${tag}`, parent: 'bodyJ', s: PR.PAW[1][i], pivot: [2, 2], at: () => PAW_F, rot: (S) => S.pF * D2R },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [12, 11] },
    { name: `charm${tag}`, parent: 'bodyJ', s: PR.CHARM[i], pivot: [4, 1], at: () => CHARM_AT, rot: (S) => S.ch * D2R, soft: { key: 'charm', dir: [0, 6], k: 70, c: 5, gain: 0.8, turn: 0.6, max: 40 } },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [11, 10] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => bunFace(MOODS.has(a.sbMood) ? a.sbMood : 'idle'), pivot: [11, 10] }] : []),
    { name: `earF${tag}`, parent: 'headJ', s: PR.EARF[i], pivot: [3, 21], at: () => EARF_AT, rot: (S) => S.eF * D2R },
    { name: `paw0${tag}`, parent: 'bodyJ', s: PR.PAW[0][i], pivot: [2, 2], at: () => PAW_N, rot: (S) => S.pN * D2R },
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

export const shadowBunnyRig = sized(makeRig({
  w: 90, h: 90, soft: true, stride: 58, recover: 0.6,
  springs: {
    x: [200, 16], lift: [160, 12], tilt: [170, 13], spin: [120, 15], hr: [200, 13], eB: [120, 6], eF: [110, 6], tl: [100, 6], pN: [220, 14], pF: [220, 14], ch: [100, 6],
  },
  fast: ['x', 'tilt', 'hr', 'pN', 'pF'],
  kick: { tilt: -160, eB: -500, eF: -600, tl: 300 },
  turnKick: { tilt: 120, eB: -260, eF: -300, tl: 260 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 13) * 0.71;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 8;
    // Its act: an ear twitch; a quick sniff of the air; then, playing, a whole forward somersault.
    const twitch = hold(lu, 0.8, 0.9, 1.1, 1.3) * calm;
    const sniff = hold(lu, 2.4, 2.6, 3.6, 3.8) * calm;
    const flip = lu > 5 && lu < 6.4 ? smooth((lu - 5) / 1.4) * calm : 0;
    const bob = Math.sin(t * 2.2);
    const idle = {
      x: 0, lift: bob * 1.6, tilt: bob * 3, spin: flip * 360, hr: sniff * Math.sin(t * 22) * 4 - sniff * 6, eB: Math.sin(t * 1.7) * 4 - twitch * 18, eF: Math.sin(t * 1.9 + 1) * 5 + twitch * 22,
      tl: Math.sin(t * 2.6) * 10, pN: 20 + bob * 6, pF: 26 + bob * 6, ch: 0,
    };
    // Gliding, the ears and tail streaming back.
    const walk = { x: 0, lift: bob, tilt: 8, spin: 0, hr: 4, eB: -34, eF: -40, tl: -18 + Math.sin(t * 6) * 6, pN: 46, pF: 50, ch: 0 };
    // Drawn back, ears flat; then the lunge and the bite.
    const antic = { x: -3, lift: 1, tilt: -10, spin: 0, hr: -6, eB: -46, eF: -52, tl: 14, pN: 60, pF: 64, ch: 0 };
    const strike = { x: 8, lift: -1, tilt: 16, spin: 0, hr: 10, eB: -64, eF: -70, tl: -26, pN: -30, pF: -24, ch: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // (The somersault only ever turns forward: once round, its spring is wound back a turn.)
    const sst = a.mo.rig?.spin;
    if (sst && sst.x - S.spin > 180) sst.x -= 360;
    // Beaten: it droops and sinks, the ears flopped.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -10, tilt: 26, spin: 0, hr: 14, eB: 40, eF: 64, tl: 30, pN: 70, pF: 74, ch: 0 });
    a.sbMood = m.hp <= 0 ? 'dizzy' : moodOf(a, flip > 0.05 || sniff > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => (S.tilt + S.spin) * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => HEAD_AT, rot: (S) => S.hr * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // Smoke curling off the tail; the charm glinting; the glow of the bite.
  fx(ctx, m, a, S, mat) {
    const B = mat('bodyJ');
    const t = a.now + (m.uid % 5) * 0.41;
    ctx.save();
    const dead = m.hp <= 0;
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.7 + k / 4) % 1;
      const [x, y] = at2(B, -16 - p * 6, -1 - p * 10);
      ctx.globalAlpha = a.alpha * 0.45 * (1 - p) * (dead ? 0.4 : 1);
      ctx.fillStyle = '#5a4e8a';
      ctx.beginPath();
      ctx.arc(x, y, 2.2 * (1 - p * 0.6), 0, TAU);
      ctx.fill();
    }
    if (!dead) {
      const q = (t * 0.45) % 1;
      if (q < 0.2) {
        const [cx, cy] = at2(B, CHARM_AT[0] + 0.5, CHARM_AT[1] + 4);
        const r = 2.4 * Math.sin((q / 0.2) * Math.PI);
        ctx.globalAlpha = a.alpha * 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.quadraticCurveTo(cx, cy, cx + r, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy + r);
        ctx.quadraticCurveTo(cx, cy, cx - r, cy);
        ctx.quadraticCurveTo(cx, cy, cx, cy - r);
        ctx.fill();
      }
      const since = a.ph.since ?? -1;
      if (since >= 0 && since < 0.4) {
        const p = since / 0.4;
        const H = mat('headJ');
        const [mx, my] = at2(H, 13, 4);
        ctx.fillStyle = '#fff4c0';
        for (const [dx, dy, r] of [[5, -4, 2.6], [8, 1, 2.2], [4, 5, 1.8]]) {
          const x = mx + dx * (0.4 + p);
          const y = my + dy * (0.4 + p);
          const rr = r * (1 - p * 0.5);
          ctx.globalAlpha = a.alpha * (1 - p);
          ctx.beginPath();
          ctx.moveTo(x, y - rr);
          ctx.quadraticCurveTo(x, y, x + rr, y);
          ctx.quadraticCurveTo(x, y, x, y + rr);
          ctx.quadraticCurveTo(x, y, x - rr, y);
          ctx.quadraticCurveTo(x, y, x, y - rr);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): floating.
export function shadowBunnyStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const hx = HEAD_AT[0];
  const hy = by + HEAD_AT[1];
  const sh = [
    ...put(earBP(), [8, 22], hx + EARB_AT[0], hy + EARB_AT[1]), ...put(tailP(), [18, 10], TAIL_AT[0], by + TAIL_AT[1]), ...put(pawP(true)(), [2, 2], PAW_F[0], by + PAW_F[1], 26),
    ...put(bodyP(), [12, 11], 0, by), ...put(charmP(), [4, 1], CHARM_AT[0], by + CHARM_AT[1]), ...put(headP(), [11, 10], hx, hy), ...put(bunFaceShapes(fm), [11, 10], hx, hy),
    ...put(earFP(), [3, 21], hx + EARF_AT[0], hy + EARF_AT[1]), ...put(pawP(false)(), [2, 2], PAW_N[0], by + PAW_N[1], 20),
  ];
  const ox = 22;
  const oy = 44;
  return { w: 44, h: 48, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
