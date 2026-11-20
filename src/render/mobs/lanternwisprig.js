// The Will-o'-Wisp, remade 2026-11-20 (the player's pick "Lantern Wisp"): a warm peach-and-gold flame
// spirit (warm, so it shows on the purple Ruins) swinging a little red paper lantern. A flyer: drawn
// round its hover point. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: bobbing, its flame tip swaying, the lantern swinging; lifting the lantern up
//           to peer about; a happy twirl of its wisp tail.
//   walk    drifting along, the flame streaming back, the lantern trailing.
//   fight   it rears back, the flame whipping; then flicks a little flame at you.
//   hit     knocked back, the lantern swinging.
//   dead    it dims and droops, the lantern dropping, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, R, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, arcP, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, ov } from './rigkit.js';

const K = 0.8;
const FL = '#ffb070';
const FLM = '#ffd890';
const FLC = '#fff4d0';
const LACQ = '#c8463c';
const lw = pairOf('lanwisp');

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
const flameShape = (x, y, w, h, c, lean = 0) => blob([[x - w, y], [x - w * 0.8, y - h * 0.45], [x - w * 0.2 + lean * 0.5, y - h * 0.7], [x + lean, y - h], [x + w * 0.5 + lean * 0.4, y - h * 0.62], [x + w * 0.9, y - h * 0.3], [x + w, y], [x, y + w * 0.7]], c);

// ---------- Parts ----------
// The round body of the flame. Box 30 x 30; its middle (15, 17) = (28, 40).
const bodyP = () => at([E(28, 42, 13, 11, FL), F(E(29, 41, 9, 8, FLM)), F(E(30, 39, 4.6, 4, FLC))], [28, 40], [15, 17]);
// The flame's tip, swaying. Box 26 x 40; its root (13, 26) = (28, 36).
const tipP = () => at([flameShape(28, 40, 11, 28, FL, 2), F(flameShape(29, 40, 7, 21, FLM, 1.5)), F(flameShape(30, 39, 3.6, 10, FLC, 1))], [28, 36], [13, 26]);
// The wisp tail. Box 16 x 12; its root (13, 4) = (22, 46).
const tailP = () => at([blob([[22, 46], [16, 50], [10, 48], [14, 44]], FL, 1)], [22, 46], [13, 4]);
// The arm. Box 12 x 10; the shoulder (2, 3) = (38, 40).
const armP = () => at([taper([[38, 40], [44, 46]], 3, 2.6, FL)], [38, 40], [2, 3]);
// The lantern on its little handle. Box 14 x 16; the handle's top (7, 2) = (46, 44.6).
const lanternP = () => at([
  taper(arcP(46, 47, 2.4, 2.4, 200, 340, 6), 0.8, 0.8, '#7a5a3a'), blob([[42, 49], [50, 49], [51, 58], [41, 58]], '#fff2d8', 1),
  R(41.4, 48, 9.2, 2, LACQ), R(41.4, 57, 9.2, 2, LACQ), F(E(46, 53.6, 2.4, 3, '#ffd06a')),
], [46, 44.6], [7, 2]);
const PR = {
  BODY: lw('body', 30, 30, bodyP, 3, 3), TIP: lw('tip', 26, 40, tipP, 3, 3), TAIL: lw('tail', 16, 12, tailP, 3, 3), ARM: lw('arm', 12, 10, armP, 3, 3), LANTERN: lw('lantern', 14, 16, lanternP, 3, 3),
};
// ---------- Its own face: candle-flame eyes (a little flame for a shine), a round "oo" mouth;
// snuffed out, its eyes go to wisps of smoke. ----------
const WEYE = '#6a2a3a';
const WGLOW = '#ffe27a';
const WMOUTH = '#a8343a';
const WSMOKE = '#b8a6cc';
const ln = (pts, w, c = WEYE) => [F(taper(pts, w, w * 0.85, c))];
// A teardrop eye, its point up and leaning out: a flame turned into an eye.
const dropPts = (x, y, w, h, s) => [...arcP(x, y, w, w * 1.05, 0, 180, 10), [x - w * 0.8, y - h * 0.42], [x - w * 0.3 + s * 0.3, y - h * 0.82], [x + s * 0.35, y - h], [x + w * 0.4 + s * 0.3, y - h * 0.7], [x + w * 0.9, y - h * 0.3]];
const flick = (cx, cy, r, c) => F(T([[cx - r * 0.5, cy + r * 0.4], [cx - r * 0.45, cy - r * 0.3], [cx, cy - r * 1.2], [cx + r * 0.45, cy - r * 0.3], [cx + r * 0.5, cy + r * 0.4], [cx, cy + r * 0.7]], c));
const smokeCurl = (x, y, k = 1) => ln([[x, y], [x + 0.9 * k, y - 0.5 * k], [x + 0.9 * k, y - 1.4 * k], [x, y - 1.7 * k], [x - 0.5 * k, y - 2.4 * k], [x + 0.2 * k, y - 3.2 * k]], 0.5 * k, WSMOKE);
const WEYES = [[13, 13.6, -1], [19.8, 13.6, 1]];
const wispFaceShapes = (mood) => {
  const out = [];
  const [mx, my] = [16.4, 18.2];
  for (const [x, y, s] of WEYES) {
    if (mood === 'blink' || mood === 'sleep') out.push(...ln([[x - s * 1.6, y + 0.1], [x - s * 0.5, y + 0.9], [x + s * 0.7, y + 0.8], [x + s * 1.5, y], [x + s * 2, y - 0.9]], 0.75));
    else if (mood === 'happy') out.push(...ln([[x - 1.9, y + 0.9], [x - 0.8, y - 0.6], [x + s * 0.3, y - 1.8], [x + 0.9, y - 0.5], [x + 1.9, y + 0.9]], 0.8));
    else if (mood === 'hurt') {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([x - 1.9 + (i * 3.8) / 8, y + 0.2 + Math.sin((i * Math.PI) / 2) * 0.5]);
      out.push(...ln(pts, 0.65));
    } else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push([x + Math.cos(i * 0.85) * (0.2 + i * 0.12), y + Math.sin(i * 0.85) * (0.2 + i * 0.12)]);
      out.push(...ln([...pts, [x + 1.4, y - 2.2], [x + 0.6, y - 3.2]], 0.55, WSMOKE));
    } else if (mood === 'dead') out.push(...ln([[x, y + 1.2], [x, y - 0.4]], 0.8), ...smokeCurl(x, y - 0.8));
    else {
      const angry = mood === 'angry' || mood === 'shout';
      let pts = dropPts(x, y, 1.8, 3.4, s);
      if (angry) {
        const [yi, yo] = [y - 0.6, y - 2.4];
        pts = pts.map(([px, py]) => [px, Math.max(py, yo + ((yi - yo) * (px - (x + s * 2))) / (-s * 4))]);
      }
      out.push(F(T(pts, WEYE)), flick(x + 0.5, y - 0.3, angry ? 0.75 : 1, angry ? '#ff8a4a' : WGLOW), F(E(x - 0.7, y + 0.9, 0.3, 0.3, '#ffb27a')));
    }
  }
  if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.6, 2.2, 2.3, 0, 180, 10), WMOUTH)), flick(mx, my + 0.9, 0.8, '#ffb04a'));
  else if (mood === 'shout') out.push(F(E(mx, my + 0.7, 1.9, 2.3, WMOUTH)), flick(mx, my + 1.6, 1.1, '#ffb04a'));
  else if (mood === 'angry') out.push(...ln([[mx - 1.6, my + 0.3], [mx - 0.8, my - 0.3], [mx, my + 0.3], [mx + 0.8, my - 0.3], [mx + 1.6, my + 0.3]], 0.55, '#7a2030'));
  else if (mood === 'hurt') out.push(...ln([[mx - 1.2, my + 0.4], [mx - 0.4, my], [mx + 0.4, my + 0.4], [mx + 1.2, my]], 0.5, '#7a2030'));
  else if (mood === 'dizzy') out.push(F(ov(mx, my + 0.2, 0.8, 1.2, 25, WMOUTH)));
  else if (mood === 'dead') out.push(...ln([[mx - 0.9, my], [mx + 0.9, my + 0.3]], 0.5, '#7a2030'));
  else out.push(F(E(mx, my, 0.95, 1.1, WMOUTH)), F(E(mx, my + 0.35, 0.5, 0.45, '#ffa04a')));
  return out;
};
const wispFace = (mood) => faceSprite(`lanwisp|face|${mood}`, 30, 30, () => wispFaceShapes(mood));

// The body's middle floats 20 above its hover point (the lantern hanging below).
const BODY_Y = 20;

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

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [13, 4], at: () => [-6, 6], rot: (S) => S.tail * D2R },
    { name: `tip${tag}`, parent: 'bodyJ', s: PR.TIP[i], pivot: [13, 26], at: () => [0, -4], rot: (S) => S.tip * D2R },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [15, 17] },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => wispFace(MOODS.has(a.lwMood) ? a.lwMood : 'idle'), pivot: [15, 17] }] : []),
    { name: `lantern${tag}`, parent: 'handJ', s: PR.LANTERN[i], pivot: [7, 2], rot: (S) => (S.lan - S.arm - S.tilt) * D2R, soft: { key: 'lantern', dir: [0, 12], k: 50, c: 3, gain: 1, turn: 0.8, max: 40 } },
    { name: `arm${tag}`, parent: 'bodyJ', s: PR.ARM[i], pivot: [2, 3], at: () => [10, 0], rot: (S) => S.arm * D2R },
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

export const lanternWispRig = sized(makeRig({
  w: 100, h: 90, soft: true, stride: 30, recover: 0.6,
  springs: { x: [180, 15], lift: [90, 8], tilt: [130, 10], tip: [90, 6], tail: [110, 7], arm: [180, 12], lan: [80, 6], dim: [40, 9] },
  fast: ['x', 'arm'],
  kick: { tilt: -160, tip: -300, lan: 300 },
  turnKick: { tilt: 100, tip: 200, tail: 260 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 11) * 0.83;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: bobbing; lifting the lantern to peer about; a twirl of its wisp tail.
    const peer = hold(lu, 2.4, 2.8, 4.2, 4.6) * calm;
    const twirl = hold(lu, 6.4, 6.6, 7.6, 7.8) * calm;
    const idle = {
      x: 0, lift: Math.sin(t * 1.7) * 2, tilt: Math.sin(t * 0.9) * 3 - peer * 4, tip: Math.sin(t * 2.4) * 8, tail: Math.sin(t * 2) * 10 + twirl * Math.sin(t * 14) * 30,
      arm: -peer * 70 + Math.sin(t * 1.3) * 4, lan: 0, dim: 0,
    };
    const walk = { x: 0, lift: Math.sin(t * 2.6) * 2.4, tilt: 9, tip: -14 + Math.sin(t * 5) * 4, tail: -18, arm: 14, lan: 0, dim: 0 };
    const antic = { x: -3, lift: 2, tilt: -12, tip: -26, tail: 20, arm: -40, lan: 0, dim: 0 };
    const strike = { x: 4, lift: 0, tilt: 12, tip: 24, tail: -10, arm: 10, lan: 0, dim: 0 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: dimming and drooping, the lantern dropped.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -6, tilt: 18, tip: 30, tail: 20, arm: 60, lan: 50, dim: 1 });
    a.lwMood = m.hp <= 0 ? 'dizzy' : moodOf(a, twirl > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'handJ', parent: 'bodyJ', at: (S) => [10 + Math.cos(Math.atan2(6, 6) + S.arm * D2R) * 8.5, Math.sin(Math.atan2(6, 6) + S.arm * D2R) * 8.5], rot: (S) => S.arm * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // A warm glow round it and the lantern; embers rising; the flicked flame.
  under(ctx, m, a, S, mat) {
    const [bx, by] = at2(mat('bodyJ'), 0, -2);
    const dim = 1 - (S.dim ?? 0) * 0.7;
    ctx.save();
    const g = ctx.createRadialGradient(bx, by, 4, bx, by, 30);
    g.addColorStop(0, `rgba(255,190,110,${0.3 * dim * a.alpha})`);
    g.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = g;
    ctx.fillRect(bx - 32, by - 32, 64, 64);
    ctx.restore();
  },
  fx(ctx, m, a, S, mat) {
    if (m.hp <= 0) return;
    const t = a.now + (m.uid % 7);
    const [bx, by] = at2(mat('bodyJ'), 0, -12);
    ctx.save();
    ctx.fillStyle = '#ffd890';
    for (let k = 0; k < 3; k++) {
      const q = (t * 0.7 + k / 3) % 1;
      ctx.globalAlpha = a.alpha * (1 - q) * 0.9;
      ctx.beginPath();
      ctx.arc(bx - 6 + k * 6 + Math.sin(q * 6 + k) * 2, by - q * 18, 1.1 * (1 - q * 0.5), 0, TAU);
      ctx.fill();
    }
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.5) {
      const q = since / 0.5;
      const [sx, sy] = at2(mat('bodyJ'), 14, -6);
      const x = sx + q * 34;
      const y = sy + Math.sin(q * Math.PI) * -4;
      for (const [c, k] of [['#ffb070', 1], ['#fff4d0', 0.5]]) {
        ctx.globalAlpha = a.alpha * (1 - q * 0.7);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x + 5 * k, y);
        ctx.quadraticCurveTo(x, y - 4 * k, x - 9 * k, y - 1);
        ctx.quadraticCurveTo(x, y + 4 * k, x + 5 * k, y);
        ctx.fill();
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): drifting.
export function lanternWispStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(tailP(), [13, 4], -6, by + 6), ...put(tipP(), [13, 26], 0, by - 4), ...put(bodyP(), [15, 17], 0, by), ...put(wispFaceShapes(fm), [15, 17], 0, by),
    ...put(lanternP(), [7, 2], 16, by + 6), ...put(armP(), [2, 3], 10, by),
  ];
  const ox = 22;
  const oy = 44;
  return { w: 48, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
