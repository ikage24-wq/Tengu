// The Imp, remade 2026-11-20 (the player's pick "Ember Imp"): a chibi imp in warm coral (no more
// pink-on-purple), little cream horns, plum bat wings, a pointy tail and a gold trident. A darting
// flyer: drawn round its hover point. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: hovering on quick wingbeats, swinging its feet; twirling its trident round;
//           a cheeky giggle, shoulders shaking.
//   walk    darting about, wings beating hard, the tail streaming.
//   fight   it draws back, the trident cocked; then darts in for a poke.
//   hit     knocked tumbling back a little.
//   dead    it flops over, wings limp, dizzy.
// Built in the concept's own units and drawn at K of them.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, put, shift, MOODS, moodOf, ov, arcP } from './rigkit.js';

const K = 0.68;
const IMP = '#ff9a6a';
const IMPD = '#e8784e';
const WING = '#6a4a8a';
const GOLD = '#f2c860';
const ei = pairOf('emberimp');

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
// The far wing. Box 22 x 22; its root (19, 12) = (24, 36).
const wingFP = () => at([blob([[24, 36], [10, 26], [6, 32], [10, 34], [8, 40], [14, 38], [14, 44], [22, 42]], WING)], [24, 36], [19, 12]);
// The near wing. Box 26 x 22; its root (4, 18) = (31, 36).
const wingNP = () => at([blob([[30, 34], [44, 26], [52, 18], [40, 32], [32, 38]], WING)], [31, 36], [4, 18]);
// The tail with its arrow tip. Box 18 x 12; its root (15, 4) = (22, 46).
const tailP = () => at([taper([[22, 46], [14, 50], [10, 46]], 2.2, 1.6, IMPD), T([[10, 46], [6, 43], [8, 49]], IMPD)], [22, 46], [15, 4]);
// A foot. Box 8 x 6; its top (4, 1).
const footP = (far) => () => [E(4, 3, far ? 3.2 : 3.4, far ? 2.4 : 2.6, far ? IMPD : IMP)];
// The body and cream tummy. Box 24 x 20; its middle (12, 10) = (28.5, 46).
const bodyP = () => at([blob([[21, 38], [35, 38], [38, 48], [33, 54], [24, 54], [19, 48]], IMP, 2), F(E(29, 47, 5, 5, '#ffe2c8'))], [28.5, 46], [12, 10]);
// The head: horns, pointed ears, a red forelock. Box 36 x 26; its middle (16, 16) = (29, 26).
const headP = () => at([
  T([[22, 18], [20, 10], [26, 16]], '#fff0d0'), T([[34, 16], [38, 9], [38, 18]], '#fff0d0'),
  E(29, 26, 10, 9.4, IMP), T([[20, 26], [13, 24], [19, 30]], IMP), T([[38, 25], [44, 22], [39, 30]], IMP), F(blob([[22, 18], [28, 16], [34, 18], [30, 20], [24, 20]], '#ff7a6a')),
], [29, 26], [16, 16]);
// The trident. Box 12 x 42; the grip (6, 20).
const tridentP = () => [taper([[6, 40], [6, 6]], 1.6, 1.4, '#c8a050'), T([[3, 6], [6, -2], [9, 6], [6, 4]], GOLD), T([[3, 6], [1, 1], [4.4, 3]], GOLD), T([[9, 6], [11, 1], [7.6, 3]], GOLD)];
// The paw on the trident. Box 6 x 6; (3, 3).
const pawP = () => [E(3, 3, 2.4, 2.2, IMPD)];
const PR = {
  WINGF: ei('wingF', 22, 22, wingFP, 3, 3), WINGN: ei('wingN', 26, 22, wingNP, 3, 3), TAIL: ei('tail', 18, 12, tailP, 3, 3), FOOT: [false, true].map((f) => ei(`foot${f ? 1 : 0}`, 8, 6, footP(f), 3, 3)),
  BODY: ei('body', 24, 20, bodyP, 3, 3), HEAD: ei('head', 36, 26, headP, 3, 3), TRIDENT: ei('trident', 12, 42, tridentP, 3, 3), PAW: ei('paw', 6, 6, pawP, 3, 3),
};
// ---------- Its own face: smug gold cat-slit eyes under heavy plum lids, one brow cocked, a
// lopsided smirk with one fang; it winks with its tongue out when pleased. ----------
const IEYE = '#ffd23a';
const IPUP = '#3a1a2a';
const ILID = '#5a1e2e';
const IMOUTH = '#7a2030';
const ITONGUE = '#ff8fab';
const IFANG = '#fffaf2';
const ln = (pts, w, c = ILID) => [F(taper(pts, w, w * 0.8, c))];
const qb = (p0, c, p1, n = 8) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n;
  return [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]];
});
// An almond eye tilted up at its outer corner; h squints it.
const almond = (x, y, s, h = 1.8) => {
  const inner = [x - s * 2.2, y + 0.4];
  const outer = [x + s * 2.2, y - 0.6];
  return { top: qb(inner, [x, y - h * 1.5], outer), bot: qb(outer, [x, y + h * 1.25], inner) };
};
const fang = (x, y, l = 1) => F(T([[x - 0.4 * l, y], [x + 0.4 * l, y], [x, y + 1 * l]], IFANG));
const IEYES = [[12.6, 15.8, -1], [20, 15.8, 1]];
const impFaceShapes = (mood) => {
  const out = [];
  const [mx, my] = [16.4, 21.2];
  const angry = mood === 'angry' || mood === 'shout';
  for (const [x, y, s] of IEYES) {
    // The brows: smug (the left one cocked), angry (a sharp V), worried when hurt.
    const raise = mood === 'hurt' ? 0 : angry ? 0 : s < 0 ? 1 : 0.2;
    if (angry) out.push(...ln([[x + s * 2, y - 4.4], [x - s * 0.2, y - 3.4], [x - s * 1.8, y - 2.4]], 0.9));
    else if (mood === 'hurt') out.push(...ln([[x - s * 1.8, y - 4.2], [x + s * 0.2, y - 3.6], [x + s * 1.9, y - 3]], 0.8));
    else if (mood !== 'dead') out.push(...ln([[x - s * 1.7, y - 3.2], [x + s * 0.2, y - 3.7 - raise], [x + s * 1.9, y - 3.3 - raise * 0.6]], 0.8));
    const wink = mood === 'happy' && s < 0;
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') {
      const { bot } = almond(x, y, s, 1);
      out.push(...ln([...bot.slice().reverse(), [x + s * 2.8, y - 1.3]], 0.8));
    } else if (wink) out.push(...ln([[x - s * 1.8, y - 1.2], [x + s * 1.2, y + 0.2], [x - s * 1.8, y + 1.2]], 0.85));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.9, y - 1.3], [x - s * 1.1, y + 0.1], [x + s * 1.9, y + 1.1]], 0.85));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 14; i++) pts.push([x + Math.cos(i * 0.8 * s) * (0.15 + i * 0.13), y + Math.sin(i * 0.8 * s) * (0.15 + i * 0.13)]);
      out.push(...ln(pts, 0.55, '#d8a020'));
    } else {
      const { top, bot } = almond(x, y, s, angry ? 1.15 : 1.8);
      out.push(F(T([...top, ...bot], IEYE)), F(E(x + s * 0.1, y - 0.1, angry ? 0.3 : 0.5, angry ? 1 : 1.45, IPUP)));
      if (!angry) out.push(F(E(x + 0.6, y - 0.6, 0.35, 0.35, '#ffffff')));
      out.push(...ln([...top, [x + s * 2.9, y - 1.4]], 0.85));
    }
  }
  if (mood === 'happy') {
    // "Tehe": an open grin, little fangs, the tongue poking out at the corner.
    out.push(F(T(arcP(mx, my - 0.5, 2.3, 1.9, 0, 180, 10), IMOUTH)), F(E(mx + 1, my + 1.3, 0.9, 1, ITONGUE)), fang(mx - 1.3, my - 0.5, 0.8), fang(mx + 1.3, my - 0.5, 0.8));
  } else if (mood === 'angry') {
    out.push(F(T([[mx - 2.2, my - 0.6], [mx + 2.2, my - 0.8], [mx + 2, my + 0.7], [mx - 2, my + 0.8]], IFANG)), ...ln([[mx - 2.3, my - 0.6], [mx + 2.3, my - 0.8], [mx + 2.1, my + 0.8], [mx - 2.1, my + 0.8], [mx - 2.3, my - 0.6]], 0.45, IMOUTH));
    out.push(...ln([[mx - 2, my + 0.1], [mx - 1.3, my - 0.4], [mx - 0.6, my + 0.4], [mx, my - 0.4], [mx + 0.7, my + 0.4], [mx + 1.4, my - 0.4], [mx + 2, my]], 0.35, IMOUTH));
  } else if (mood === 'shout') {
    out.push(F(T(arcP(mx, my - 0.8, 2.6, 2.8, 0, 180, 12), IMOUTH)), F(E(mx, my + 1.2, 1.2, 0.7, ITONGUE)), fang(mx - 1.4, my - 0.8), fang(mx + 1.4, my - 0.8));
  } else if (mood === 'hurt') out.push(F(ov(mx, my + 0.3, 1, 0.7, -15, IMOUTH)));
  else if (mood === 'dizzy' || mood === 'dead') out.push(...ln([[mx - 1.6, my - 0.2], [mx - 0.5, my + 0.4], [mx + 0.6, my - 0.1], [mx + 1.6, my + 0.3]], 0.5, IMOUTH), F(E(mx + 1, my + 1.2, 0.75, 1.1, ITONGUE)));
  else out.push(...ln([[mx - 1.8, my - 0.2], [mx - 0.4, my + 0.5], [mx + 1.2, my + 0.2], [mx + 2, my - 0.6]], 0.55, IMOUTH), fang(mx + 0.9, my + 0.3, 0.9));
  return out;
};
const impFace = (mood) => faceSprite(`emberimp|face|${mood}`, 36, 26, () => impFaceShapes(mood));

// The body's middle floats 16 above its hover point.
const BODY_Y = 16;
const HAND = [10, -4];

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
  const foot = (far) => ({ name: `foot${far ? 1 : 0}${tag}`, parent: 'bodyJ', s: PR.FOOT[far ? 1 : 0][i], pivot: [4, 1], at: (S) => [far ? -2.5 : 4.5, 8 + (far ? S.fF : S.fN)] });
  return [
    { name: `wingF${tag}`, parent: 'bodyJ', s: PR.WINGF[i], pivot: [19, 12], at: () => [-4.5, -10], rot: (S) => S.wg * D2R },
    { name: `tail${tag}`, parent: 'bodyJ', s: PR.TAIL[i], pivot: [15, 4], at: () => [-6.5, 0], rot: (S) => S.tail * D2R },
    foot(true),
    foot(false),
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [12, 10] },
    { name: `head${tag}`, parent: 'headJ', s: PR.HEAD[i], pivot: [16, 16] },
    ...(bare ? [{ name: 'face', parent: 'headJ', s: (a) => impFace(MOODS.has(a.eiMood) ? a.eiMood : 'idle'), pivot: [16, 16] }] : []),
    { name: `wingN${tag}`, parent: 'bodyJ', s: PR.WINGN[i], pivot: [4, 18], at: () => [2.5, -10], rot: (S) => -S.wg * D2R },
    { name: `trident${tag}`, parent: 'handJ', s: PR.TRIDENT[i], pivot: [6, 20], rot: (S) => S.tr * D2R },
    { name: `paw${tag}`, parent: 'handJ', s: PR.PAW[i], pivot: [3, 3] },
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

export const emberImpRig = sized(makeRig({
  w: 110, h: 90, soft: true, stride: 40, recover: 0.6,
  springs: { x: [220, 17], lift: [140, 10], tilt: [170, 12], hr: [160, 11], wg: [700, 22], tail: [140, 8], hx: [260, 16], hy: [260, 16], tr: [200, 13], fN: [200, 12], fF: [200, 12] },
  fast: ['x', 'hx', 'hy', 'tr'],
  kick: { tilt: -260, hr: -200, lift: 60 },
  turnKick: { tilt: 120, tail: 260 },
  pose(m, a) {
    flyGait(m, a);
    a.uidOff = (m.uid % 13) * 0.77;
    const t = a.t + a.uidOff;
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Its act: hovering, feet swinging; twirling its trident; a cheeky giggle.
    const twirl = clamp((lu - 3) / 1.1, 0, 1) * (lu < 4.6 ? 1 : 0) * calm;
    const giggle = hold(lu, 6.4, 6.6, 7.6, 7.8) * calm;
    const flap = Math.sin(t * 20);
    const idle = {
      x: 0, lift: Math.sin(t * 2.6) * 2, tilt: Math.sin(t * 1.2) * 3 + giggle * Math.sin(t * 26) * 3, hr: giggle * -8 + Math.sin(t * 0.9) * 3, wg: flap * 26, tail: Math.sin(t * 2.2) * 12,
      hx: 0, hy: 0, tr: twirl * 360, fN: Math.sin(t * 2.4) * 1.2, fF: Math.sin(t * 2.4 + 1.6) * 1.2,
    };
    const walk = { x: 0, lift: Math.sin(t * 6) * 2.4, tilt: 12, hr: -6, wg: Math.sin(t * 26) * 34, tail: -20, hx: 1, hy: 1, tr: 30, fN: 1.6, fF: 1.6 };
    const antic = { x: -4, lift: 4, tilt: -16, hr: -10, wg: -30, tail: 24, hx: -8, hy: -2, tr: 70, fN: -1, fF: -1 };
    const strike = { x: 12, lift: -2, tilt: 18, hr: 8, wg: 30, tail: -24, hx: 10, hy: 2, tr: 90, fN: 2, fF: 2 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // (The trident's twirl only ever winds forwards.)
    const ts = a.mo.rig?.tr;
    if (ts) while (ts.x - S.tr > 180) ts.x -= 360;
    // Beaten: flopped over, wings limp.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: -8, tilt: 120, hr: 20, wg: 40, tail: 30, hx: 2, hy: 6, tr: 100, fN: 0, fF: 0 });
    a.eiMood = m.hp <= 0 ? 'dizzy' : moodOf(a, giggle > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'headJ', parent: 'bodyJ', at: () => [0.5, -20], rot: (S) => S.hr * D2R },
    { name: 'handJ', parent: 'bodyJ', at: (S) => [HAND[0] + S.hx, HAND[1] + S.hy], rot: (S) => -S.tilt * 0.5 * D2R },
    ...pass(false),
    ...pass(true),
  ],
  // The poke: a few streaks behind as it darts.
  fx(ctx, m, a, S) {
    if (m.hp <= 0 || !(a.ph.strike > 0.2)) return;
    const al = clamp(1 - (a.ph.since ?? 0) / 0.35, 0, 1) * a.ph.strike;
    ctx.save();
    ctx.globalAlpha = a.alpha * al;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.4;
    for (const [y, l] of [[-34, 12], [-24, 16], [-14, 10]]) {
      ctx.beginPath();
      ctx.moveTo(S.x - 12, y);
      ctx.lineTo(S.x - 12 - l, y);
      ctx.stroke();
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): hovering.
export function emberImpStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const sh = [
    ...put(wingFP(), [19, 12], -4.5, by - 10), ...put(tailP(), [15, 4], -6.5, by), ...put(footP(true)(), [4, 1], -2.5, by + 8), ...put(footP(false)(), [4, 1], 4.5, by + 8),
    ...put(bodyP(), [12, 10], 0, by), ...put(headP(), [16, 16], 0.5, by - 20), ...put(impFaceShapes(fm), [16, 16], 0.5, by - 20), ...put(wingNP(), [4, 18], 2.5, by - 10),
    ...put(tridentP(), [6, 20], HAND[0], by + HAND[1]), ...put(pawP(), [3, 3], HAND[0], by + HAND[1]),
  ];
  const ox = 24;
  const oy = 44;
  return { w: 50, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
