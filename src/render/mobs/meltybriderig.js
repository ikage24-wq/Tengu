// The Candle Bride, remade 2026-11-20 (the player's pick "Melty Bride"): a chubby candle whose
// melting wax makes the ruffles of her dress, in a lace veil and a pearl tiara, her flame done up
// in a bun, standing in a brass dish and holding a bouquet of tiny flames. She haunts the Moonlit
// Manor's Ballroom. Live rig, outer outline only, the face bare, no squash.
//
// How it moves:
//   idle    a 9 s act: swaying, her flame flickering, the veil drifting; she lifts the bouquet to
//           smell it; she straightens her tiara; a happy little hop-hop.
//   walk    hopping along in her dish, the veil streaming, the flame leaning back.
//   fight   both arms up, her flame flaring tall; then she throws a flame (the shot flies off as
//           the dungeon's flame shot).
//   hit     rocked, the flame flickering.
//   dead    she slumps, her flame snuffed out, a curl of smoke rising from the wick.
// Built in the concept's own units and drawn at K of them; the dish's bottom at y 0.

import { E, T, F } from './kit.js';
import { makeRig, stateBlend, clamp, TAU } from './rig.js';
import { D2R, taper, pairOf, faceSprite, hold, stepPhase, put, shift, MOODS, moodOf, arcP } from './rigkit.js';

const K = 0.66;
const WAX = '#fff1dc';
const WAXL = '#fffaf0';
const WAXD = '#f0dcc0';
const VEIL = '#eeeaff';
const mb = pairOf('meltyb');

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
const flameShape = (x, y, w, h, c, lean = 0) => blob([[x - w, y], [x - w * 0.8, y - h * 0.45], [x - w * 0.2 + lean * 0.5, y - h * 0.7], [x + lean, y - h], [x + w * 0.5 + lean * 0.4, y - h * 0.62], [x + w * 0.9, y - h * 0.3], [x + w, y], [x, y + w * 0.6]], c, 2);
const fire = (x, y, w, h, lean = 0) => [flameShape(x, y, w, h, '#ffa03a', lean), F(flameShape(x, y - h * 0.04, w * 0.66, h * 0.72, '#ffd060', lean * 0.7)), F(flameShape(x, y - h * 0.06, w * 0.34, h * 0.4, '#fff4c0', lean * 0.4))];

// ---------- Parts ----------
// The candle: the wax body, its shaded side, the ruffled hem, the drips, the pearl tiara, the wick.
// Box 28 x 40; its middle (14, 22) = (32, 46).
const bodyP = () => at([
  blob([[21, 30], [43, 30], [44, 62], [20, 62]], WAX), F(T([[37, 32], [42, 32], [42.6, 60], [38, 60]], WAXD)),
  ...Array.from({ length: 7 }, (_, i) => E(21.6 + i * 3.5, 60.6, 2.2, 1.8, WAXL)),
  E(32, 30, 11, 3, WAXL),
  ...[[22.4, 8], [26.4, 14], [31, 6], [35.6, 12], [40.6, 9]].flatMap(([x, l]) => [taper([[x, 30], [x, 30 + l]], 3.2, 2.6, WAXL), E(x, 30 + l, 1.6, 1.8, WAXL)]),
  ...Array.from({ length: 5 }, (_, i) => F(E(25 + i * 3.5, 28.6, 0.9, 0.9, '#ffffff'))),
  ...ln([[32, 29], [32, 25.6]], 0.9, '#5a3a3a'),
], [32, 46], [14, 22]);
// The brass dish she stands in. Box 28 x 8; its middle (14, 3.9) = (32, 64.4).
const dishP = () => at([E(32, 64.4, 12.4, 3, '#e8b84a'), F(E(32, 63.6, 10, 1.8, '#ffd884'))], [32, 64.4], [14, 3.9]);
// Her flame, done up in a bun with a curl. Box 18 x 22; its base (8, 17) = (32, 27).
const flameP = () => at([...fire(32, 27, 6.6, 16, 1.6), ...fire(37.6, 24, 3, 7, 2)], [32, 27], [8, 17]);
// The flame flaring tall to fight. Box 26 x 40; its base (13, 31) = (32, 27).
const flareP = () => at(fire(32, 27, 11, 30, 2), [32, 27], [13, 31]);
// The lace veil, hung from the back of her head (soft): the long left side, the short right side.
// Boxes 14 x 40 and 11 x 30; roots (12.5, 3) = (24, 24) and (2, 3) = (40, 24).
const veilLP = () => at([blob([[25, 22], [17, 30], [12, 48], [14, 60], [21, 56], [22, 32]], VEIL), ...Array.from({ length: 6 }, (_, i) => F(E(13 + i * 0.4, 50 + i * 2, 0.8, 0.8, '#ffffff')))], [24, 24], [12.5, 3]);
const veilRP = () => at([blob([[39, 22], [46, 30], [48, 44], [44, 50], [42, 32]], VEIL)], [40, 24], [2, 3]);
// A little wax arm, hanging straight down from the shoulder. Box 5 x 13; the shoulder (2.5, 2).
const armP = () => [taper([[2.5, 2], [2.5, 10]], 4, 3.2, WAX), E(2.5, 10.4, 1.9, 1.9, WAX)];
// The posy of tiny flames on a pink ribbon. Box 12 x 10; the grip (6, 7.4) = (32, 53.4).
const bouquetP = () => at([
  ...ln([[29.6, 50.6], [32, 54]], 1, '#6ab05a'), ...ln([[32.4, 49.8], [32, 54]], 1, '#6ab05a'), ...ln([[35, 50.8], [32, 54]], 1, '#6ab05a'), F(E(32, 53.4, 2, 1.2, '#ff9ac8')),
  ...fire(29.6, 50.6, 1.6, 3.8), ...fire(32.4, 49.8, 1.6, 4), ...fire(35, 50.8, 1.5, 3.6),
], [32, 53.4], [6, 7.4]);
const PR = {
  BODY: mb('body', 28, 40, bodyP, 3, 3), DISH: mb('dish', 28, 8, dishP, 3), FLAME: mb('flame', 18, 22, flameP, 3, 3), FLARE: mb('flare', 26, 40, flareP, 3, 3),
  VEILL: mb('veilL', 14, 40, veilLP, 3, 3), VEILR: mb('veilR', 11, 30, veilRP, 3, 3), ARM: mb('arm', 5, 13, armP, 3, 3), BOUQUET: mb('bouquet', 12, 10, bouquetP, 3, 3),
};

// ---------- Her own face: big glossy brown eyes welling with happy tears (the shine runs along the
// bottom of each), a lash flick, warm peach cheeks, a little dimpled smile. ----------
const BEYE = '#5a3040';
const BLIP = '#8a3040';
const BEYES = [[9.6, 16, -1], [18.4, 16, 1]];
const brideFaceShapes = (mood) => {
  const out = [];
  for (const [x, y, s] of BEYES) {
    if (mood === 'blink' || mood === 'sleep' || mood === 'dead') out.push(...ln(arcP(x, y + 0.2, 2, 1.2, 15, 165, 8), 0.65, BEYE), ...(mood === 'dead' ? [] : ln([[x + s * 1.9, y + 0.5], [x + s * 2.7, y - 0.3]], 0.45, BEYE)));
    else if (mood === 'happy') out.push(...ln(arcP(x, y + 1.2, 2, 1.8, 200, 340, 8), 0.7, BEYE));
    else if (mood === 'hurt') out.push(...ln([[x + s * 1.7, y - 1.5], [x - s * 1.2, y], [x + s * 1.7, y + 1.5]], 0.7, BEYE), F(E(x - s * 0.2, y + 2.6, 0.5, 0.8, '#9ad8ff')));
    else if (mood === 'dizzy') {
      const pts = [];
      for (let i = 0; i <= 12; i++) pts.push([x + Math.cos(i * 0.85 * s) * (0.15 + i * 0.14), y + Math.sin(i * 0.85 * s) * (0.15 + i * 0.14)]);
      out.push(...ln(pts, 0.5, '#d8803a'));
    } else {
      const cross = mood === 'angry' || mood === 'shout';
      let e = Array.from({ length: 14 }, (_, i) => [x + Math.cos((i / 14) * TAU) * 2.1, y + Math.sin((i / 14) * TAU) * 2.7]);
      if (cross) e = e.map(([px, py]) => [px, Math.max(py, y - 0.8 + (px - x) * -s * 0.55)]);
      out.push(F(T(e, BEYE)), F(E(x, y + 1.2, 1.5, 1.1, '#ffb060')), F(E(x + 0.6, y - 0.9, 0.7, 0.7, '#ffffff')));
      if (!cross) out.push(...ln(arcP(x, y + 0.4, 1.9, 2.3, 30, 150, 6), 0.4, '#ffffff'), ...ln([[x + s * 1.8, y - 2.1], [x + s * 2.7, y - 2.9]], 0.45, BEYE));
    }
    if (mood !== 'dead') out.push(F(E(x - s * 2.8, y + 3.4, mood === 'happy' ? 1.9 : 1.5, mood === 'happy' ? 1 : 0.8, mood === 'happy' ? '#ff9a8a' : '#ffb08a')));
  }
  const [mx, my] = [14, 21.6];
  if (mood === 'shout') out.push(F(E(mx, my + 0.4, 1.3, 1.5, BLIP)));
  else if (mood === 'happy') out.push(F(T(arcP(mx, my - 0.5, 1.7, 1.6, 0, 180, 8), BLIP)), F(E(mx, my + 0.5, 0.8, 0.45, '#ff8fab')));
  else if (mood === 'angry') out.push(...ln([[mx - 1.3, my + 0.4], [mx, my - 0.3], [mx + 1.3, my + 0.4]], 0.45, BLIP));
  else if (mood === 'hurt' || mood === 'dizzy') out.push(...ln([[mx - 1.3, my + 0.3], [mx - 0.45, my - 0.1], [mx + 0.45, my + 0.3], [mx + 1.3, my - 0.1]], 0.4, BLIP));
  else if (mood === 'dead') out.push(F(E(mx, my, 0.55, 0.6, BLIP)));
  else out.push(...ln(arcP(mx, my, 1.6, 1.1, 20, 160, 6), 0.45, BLIP), ...ln([[mx + 2.1, my + 0.4], [mx + 2.6, my - 0.2]], 0.35, BLIP));
  return out;
};
const brideFace = (mood) => faceSprite(`meltyb|face|${mood}`, 28, 40, () => brideFaceShapes(mood));

// The candle's middle sits 21.4 above the dish's bottom; everything else hangs off it.
const BODY_Y = 21.4;
const DISH_AT = [0, 18.4];
const WICK = [0, -19];
const SHOULDER_L = [-11, -2];
const SHOULDER_R = [11, -2];
const VEIL_L = [-8, -22];
const VEIL_R = [8, -22];
const HAND = 9;

const pass = (bare) => {
  const i = bare ? 1 : 0;
  const tag = bare ? 'b' : '';
  return [
    { name: `veilL${tag}`, parent: 'bodyJ', s: PR.VEILL[i], pivot: [12.5, 3], at: () => VEIL_L, rot: (S) => S.vl * D2R, soft: { key: 'veilL', dir: [-2, 30], k: 60, c: 5, gain: 0.7, turn: 0.6, max: 26 } },
    { name: `veilR${tag}`, parent: 'bodyJ', s: PR.VEILR[i], pivot: [2, 3], at: () => VEIL_R, rot: (S) => S.vl * 0.6 * D2R, soft: { key: 'veilR', dir: [3, 22], k: 60, c: 5, gain: 0.7, turn: 0.6, max: 22 } },
    { name: `dish${tag}`, parent: 'bodyJ', s: PR.DISH[i], pivot: [14, 3.9], at: () => DISH_AT, rot: (S) => -S.tilt * 0.5 * D2R },
    { name: `body${tag}`, parent: 'bodyJ', s: PR.BODY[i], pivot: [14, 22] },
    ...(bare ? [{ name: 'face', parent: 'bodyJ', s: (a) => brideFace(MOODS.has(a.mbMood) ? a.mbMood : 'idle'), pivot: [14, 22] }] : []),
    { name: `flame${tag}`, parent: 'flameJ', s: PR.FLAME[i], pivot: [8, 17], alpha: (a, S) => clamp((1 - S.fl) * S.lit, 0, 1) },
    { name: `flare${tag}`, parent: 'flameJ', s: PR.FLARE[i], pivot: [13, 31], alpha: (a, S) => clamp(S.fl * S.lit, 0, 1) },
    { name: `armL${tag}`, parent: 'armLJ', s: PR.ARM[i], pivot: [2.5, 2] },
    { name: `bouquet${tag}`, parent: 'handLJ', s: PR.BOUQUET[i], pivot: [6, 7.4] },
    { name: `armR${tag}`, parent: 'armRJ', s: PR.ARM[i], pivot: [2.5, 2] },
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

export const meltyBrideRig = sized(makeRig({
  w: 90, h: 100, soft: true, stride: 22, recover: 0.6,
  springs: {
    x: [200, 17], lift: [300, 18], tilt: [170, 13], aL: [230, 15], aR: [230, 15], bq: [140, 9], fr: [260, 9], fl: [140, 13], lit: [60, 12], vl: [90, 8],
  },
  fast: ['x', 'aL', 'aR', 'lift'],
  kick: { tilt: -160, fr: 600, vl: 300 },
  turnKick: { tilt: 110, fr: 300, vl: 260 },
  pose(m, a) {
    a.uidOff = (m.uid % 11) * 0.87;
    const t = a.t + a.uidOff;
    const u = stepPhase(m, a, 'meltyb', 22);
    const calm = a.calm ?? 1;
    const lu = t % 9;
    // Her act: smelling the bouquet; straightening her tiara; a happy little hop-hop.
    const smell = hold(lu, 1.2, 1.6, 2.8, 3.2) * calm;
    const tiara = hold(lu, 4.4, 4.8, 5.6, 6) * calm;
    const hops = hold(lu, 7, 7.1, 8.1, 8.3) * calm;
    const sway = Math.sin(t * 1.2);
    const flick = Math.sin(t * 7) * 4 + Math.sin(t * 13) * 2;
    const idle = {
      x: 0, lift: hops * Math.abs(Math.sin(t * 9)) * 2.4 + (Math.sin(t * 1.6) + 1) * 0.2, tilt: sway * 2 + smell * 4 - tiara * 3, aL: -12 - smell * 41 + sway * 3, aR: 28 + tiara * 132 - sway * 3,
      bq: sway * 4 + smell * 10, fr: flick + sway * 2, fl: 0, lit: 1, vl: sway * 4,
    };
    // Hopping along in her dish, the flame leaning back.
    const hop = Math.abs(Math.sin(u * Math.PI));
    const s = Math.sin(u * TAU);
    const walk = { x: 0, lift: hop * 2.6, tilt: 3 + s * 3, aL: -10 + s * 8, aR: 20 + s * 8, bq: s * 8, fr: -10 + flick * 0.5, fl: 0, lit: 1, vl: -12 };
    // Arms up, the flame flaring tall; then the throw.
    const antic = { x: -1.5, lift: 1, tilt: -5, aL: 150, aR: -150, bq: -10, fr: flick * 0.6, fl: 1, lit: 1, vl: 8 };
    const strike = { x: 3, lift: 0, tilt: 6, aL: -20, aR: -95, bq: 6, fr: 8, fl: 0.35, lit: 1, vl: -10 };
    const S = stateBlend(a, idle, walk, antic, strike);
    // Beaten: slumped, the arms down, her flame snuffed out.
    if (m.hp <= 0) Object.assign(S, { x: 0, lift: 0, tilt: 10, aL: -8, aR: 8, bq: 20, fr: 0, fl: 0, lit: 0, vl: 6 });
    a.mbMood = m.hp <= 0 ? 'dead' : moodOf(a, smell > 0.4 || hops > 0.4 ? 'happy' : null);
    return S;
  },
  parts: [
    { name: 'bodyJ', parent: null, at: (S) => [S.x, -BODY_Y - S.lift], rot: (S) => S.tilt * D2R },
    { name: 'flameJ', parent: 'bodyJ', at: () => WICK, rot: (S) => S.fr * D2R },
    { name: 'armLJ', parent: 'bodyJ', at: () => SHOULDER_L, rot: (S) => S.aL * D2R },
    { name: 'handLJ', parent: 'armLJ', at: () => [0, HAND], rot: (S) => (-S.aL - S.tilt + S.bq) * D2R },
    { name: 'armRJ', parent: 'bodyJ', at: () => SHOULDER_R, rot: (S) => S.aR * D2R },
    ...pass(false),
    ...pass(true),
  ],
  under(ctx, m, a) {
    ctx.globalAlpha = a.alpha * 0.2;
    ctx.fillStyle = '#2a1a3a';
    ctx.beginPath();
    ctx.ellipse(0, -0.5, 13, 2.8, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = a.alpha;
  },
  // A warm glow round her flame; a flame ball in her hand as she throws; a curl of smoke when out.
  fx(ctx, m, a, S, mat) {
    const B = mat('bodyJ');
    ctx.save();
    if (m.hp <= 0) {
      const t = a.now + (m.uid % 5) * 0.3;
      const [wx, wy] = at2(B, WICK[0], WICK[1]);
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.5 + k / 3) % 1;
        ctx.globalAlpha = a.alpha * 0.4 * (1 - p);
        ctx.fillStyle = '#c8c0d8';
        ctx.beginPath();
        ctx.arc(wx + Math.sin(p * 6 + k) * 2.4, wy - 2 - p * 16, 1.4 + p * 2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      return;
    }
    const [fx, fy] = at2(B, WICK[0], WICK[1] - 6 - S.fl * 8);
    // (A soft fade of light, not a disc.)
    const R = 10 + S.fl * 10;
    const glow = ctx.createRadialGradient(fx, fy, 0, fx, fy, R);
    glow.addColorStop(0, 'rgba(255, 200, 90, 0.32)');
    glow.addColorStop(1, 'rgba(255, 200, 90, 0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a.alpha * (0.7 + S.fl * 0.3);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fx, fy, R, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    const since = a.ph.since ?? -1;
    if (since >= 0 && since < 0.35) {
      const p = since / 0.35;
      const R = mat('armRJ');
      const [hx, hy] = at2(R, 0, HAND + 2);
      ctx.globalAlpha = a.alpha * (1 - p);
      for (const [r, c] of [[5, '#ffa03a'], [3.4, '#ffd060'], [1.8, '#fff4c0']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(hx + p * 8, hy, r * (1 - p * 0.4), 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  },
}), K);

// A still (the Monster Book and anywhere a sprite is wanted): holding her bouquet.
export function meltyBrideStill(pose, f, mood) {
  const fm = MOODS.has(mood) ? mood : 'idle';
  const by = -BODY_Y;
  const rotv = (deg, l) => [-Math.sin(deg * D2R) * l, Math.cos(deg * D2R) * l];
  const [hlx, hly] = rotv(-12, HAND);
  const sh = [
    ...put(veilLP(), [12.5, 3], VEIL_L[0], by + VEIL_L[1]), ...put(veilRP(), [2, 3], VEIL_R[0], by + VEIL_R[1]),
    ...put(dishP(), [14, 3.9], DISH_AT[0], by + DISH_AT[1]), ...put(bodyP(), [14, 22], 0, by), ...put(brideFaceShapes(fm), [14, 22], 0, by),
    ...put(flameP(), [8, 17], WICK[0], by + WICK[1]),
    ...put(armP(), [2.5, 2], SHOULDER_L[0], by + SHOULDER_L[1], -12), ...put(bouquetP(), [6, 7.4], SHOULDER_L[0] + hlx, by + SHOULDER_L[1] + hly),
    ...put(armP(), [2.5, 2], SHOULDER_R[0], by + SHOULDER_R[1], 28),
  ];
  const ox = 22;
  const oy = 46;
  return { w: 44, h: 50, res: 3, shapes: sh.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [px * K + ox, py * K + oy]) } : { ...s, x: s.x * K + ox, y: s.y * K + oy, ...(s.rx != null ? { rx: s.rx * K, ry: s.ry * K } : {}), ...(s.t === 'r' ? { w: s.w * K, h: s.h * K } : {}) })) };
}
