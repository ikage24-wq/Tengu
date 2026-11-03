// Monster art: bosses. Four big, layered designs with multi-frame motion:
//   mothercapper  the Myconid Queen: a mushroom matriarch in a lace veil and mycelium robe
//   tuskar        the Behemoth: an armored demon boar with burning eyes and a mane of flame
//   gnarlroot     the Hollow Heart: a corrupted ancient tree with a beating heart in its bark
//   crystalking   the Crystal Dragon King: a crowned crystal dragon with a prism scepter
// All four are rigs built on the hollow module's joint transforms, chains, ramps and shape helpers:
// parts turn about real joints and chains trail their roots. All face right, feet at the bottom.

import { F, C, shade, mix, keyAt } from './kit.js';
import { heroineHead, heroineBrows, heroineTop } from './heroine.js';
import { glowEye, brow, deadEye, eye, grow } from './faces.js';
import * as H from './hollow.js';
import { part, makeRig, stateBlend, inPart, chainParts } from './rig.js';

const { ID, joint, at, snapJ, place, squash, ik, chainPts, arm2, footStep, pawStep, timing, limb, limbR, fp, ov, fov, pg, mote, star, ramp, actOf, PURP } = H;
const rball = H.ball;
const rtaper = H.taper;
const rswoosh = H.swoosh;

const TAU = Math.PI * 2;

// ---------- Small math helpers ----------

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const smooth = (k) => k * k * (3 - 2 * k);
// Picks the attack frame's value from a list (or the fallback outside an attack).
const key = (att, list, other) => (att >= 0 ? list[Math.min(att, list.length - 1)] : other);

// ---------- The Myconid Queen ----------
// A mushroom matriarch: a huge spotted pink cap crowned with a tiara, a lace veil falling from its
// rim, silver-lilac hair, a mycelium-violet robe open over a cream gown, and a crooked staff with a
// glowing spore orb. Signature: the wide cap over a small regal face. Rig: waist > chest > neck >
// head (heroine face kit) > cap (lags the head); robe edges, hem, veil strands and hair locks are
// chains that trail the body a beat late; the staff rides the front hand (IK arm). She glides:
// the hem ripples back while the staff foot plants and the hand carries it on. The slam is
// telegraphed: the staff rises overhead and holds while the orb swells and a glowing ring marks
// the floor where it will land.

const QR = {
  cap: ramp('#e2679f'),
  wart: ramp('#fff1cf'),
  gill: ramp('#ffd9ea'),
  frill: ramp('#ffb3d6'),
  robe: ramp('#6f50ae', true),
  gown: ramp('#f6ecdf'),
  gold: ramp('#ffd36b'),
  wood: ramp('#86665a'),
  hair: ramp('#e3d4f4', true),
  skin: ramp('#fff3e6'),
  lace: ramp('#f6eefe', true),
  glow: '#6ff0da',
  glowHi: '#e6fff9',
  ink: '#3a2448',
};
const QK = 1;
const QFACE = {
  k: QK,
  lineK: 1.15,
  skin: '#fff3e6', skinSh: '#f2d3d6', skinSh2: '#d9aec4', blush: '#ff9fc0', lip: '#e0708f', lipLine: '#a8456a',
  bangs: [[-5.4, -2.6], [-3.4, -0.9], [-1.1, -3], [1, -0.5], [3.3, -3.4], [5.3, -1.3], [7.6, -3.4], [9.6, -0.7], [11.6, -2.8]],
  eye: { ry: 3.1, iris: '#2fae9c', irisDk: '#145466', irisLt: '#c6fff0', hot: '#ff5fc8', hotDk: '#8a1f66', pupil: 'round', pupilC: '#173040', tilt: 0.05, wing: 1.2, flicks: 1, lashLen: 1.4, ink: '#3a2448', crease: false, lower: '#e9b8cc', sparkle: true },
  brow: { c: '#9a82c0', kind: 'arch', w: 0.7 },
  moods: { idle: { mouth: 'soft' }, angry: { mouth: 'shout' }, hurt: { mouth: 'gasp' } },
};

function queen(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry } = timing(pose, f, mood);
  const P = QR;
  const floor = 121;
  const u = f / 8;
  // The body: a stately glide (rise and settle twice a stride, a slow sway), a breathing idle with
  // a held top, and the slam: rise tall with the staff up (held), drive it down, sink, settle.
  let by;
  let lean;
  let dx = 0;
  let sq = 0;
  if (walk) {
    by = -1.1 * Math.sin(2 * p);
    lean = 0.03 + 0.02 * Math.sin(p);
    dx = 0.8 * Math.sin(p);
  } else if (att >= 0) {
    [by, lean, dx, sq] = [[-2.2, -0.08, -1.4, 0.03], [-3, -0.11, -1.8, 0.04], [2.8, 0.11, 1.8, -0.045], [2.2, 0.09, 1.5, -0.03], [0.6, 0.03, 0.4, 0]][att];
  } else {
    by = -0.9 * br;
    lean = 0.015 * Math.sin(it + 0.7);
    dx = 0.5 * Math.sin(it + 1);
    sq = 0.012 * br;
  }
  if (hurt) {
    lean = -0.12;
    dx -= 2;
    sq = -0.02;
  }
  if (dead) {
    lean = 0.12;
    by = 7;
    dx = 1;
  }
  const headA = (walk ? 0.03 * Math.sin(p - 0.8) : att >= 0 ? [-0.1, -0.14, 0.12, 0.1, 0.02][att] : 0.03 * Math.sin(it - 0.9)) + (hurt ? -0.16 : 0) + (dead ? 0.34 : 0) + (angry && att < 0 ? 0.06 : 0);
  const capA = (walk ? -0.03 * Math.sin(p - 1.6) : att >= 0 ? [-0.05, -0.07, 0.09, 0.06, -0.01][att] : -0.02 * Math.sin(it - 1.8)) + (hurt ? -0.06 : 0) + (dead ? 0.1 : 0);
  // Cloth lag: how far the hem, veil and hair trail behind (+ = swept back) per chain segment.
  const trail = (i, k = 1) => k * ((walk ? 0.05 + 0.05 * Math.sin(p - 1 - i * 0.7) : att >= 0 ? [-0.03, -0.05, 0.07, 0.05, 0.01][att] * (0.6 + i * 0.25) : 0.025 * Math.sin(it - 1.2 - i * 0.7)) + (hurt ? 0.08 : 0) + (dead ? -0.04 : 0));
  const MW = joint(ID, 50 + dx, 84 + by, lean);
  const MC = joint(MW, 0.6, -16, lean * 0.4 + (hurt ? -0.05 : 0));
  const MH = snapJ(joint(MC, 2, -12.2, headA));
  const MK = joint(MH, -0.4, -9.4, capA);
  const out = [];
  const hk = (pts) => pts.map(([x, y]) => [x * QK, y * QK]);

  // The veil: lace strands from under the cap's rim, behind her, each a chain trailing the cap.
  {
    const strands = [-31, -25, -19, -13, -7].map((x, j) => {
      const len = x < 0 ? 34 - Math.abs(x + 19) * 0.25 : 16;
      const top = at(MK, x, 2.6 + (Math.abs(x) / 32) ** 2 * 2.4);
      const a0 = Math.PI / 2 + headA + capA * 2;
      return chainPts(top[0], top[1], a0, 4, () => len / 4, (i) => trail(i, 1.3) * (0.6 + j * 0.03) + (x < 0 ? 0.02 : -0.03)).pts;
    });
    for (let j = 0; j < strands.length - 1; j++) {
      const A = strands[j];
      const B = strands[j + 1];
      out.push(fp([...A, ...[...B].reverse()], j % 2 ? P.lace.base : P.lace.sh));
      // Lace: two diamond holes per panel and a scalloped edge.
      for (const t of [1.5, 3]) {
        const m = [(A[Math.floor(t)][0] + B[Math.floor(t)][0]) / 2, (A[Math.floor(t)][1] + B[Math.floor(t)][1]) / 2 + (t % 1) * 4];
        out.push(fp([[m[0], m[1] - 1.4], [m[0] + 1, m[1]], [m[0], m[1] + 1.4], [m[0] - 1, m[1]]], P.lace.sh2));
      }
    }
    for (const S of strands) out.push(fov(S[4][0], S[4][1], 2.6, 1.5, P.lace.base, 0, 12), fov(S[4][0] - 0.4, S[4][1] + 0.5, 1.6, 0.7, P.lace.sh, 0, 10));
  }

  // Back hair: two long locks falling down her back, each a chain lagging the head.
  for (const [x, y, w, R] of [[-11, -1, 8, ramp(P.hair.sh, true)], [-6, 2, 7, P.hair]]) {
    const top = at(MH, x * QK, y * QK);
    const { pts } = chainPts(top[0], top[1], Math.PI / 2 + headA + 0.25, 4, () => 6.2, (i) => trail(i, 0.9) + (i ? -0.05 : 0));
    out.push(...limb(pts, w, 2.4, R.base, R.sh2), F(rtaper(pts.slice(0, 3).map(([a, b]) => [a + 1.6, b]), 1.4, 0.6, R.hi)));
  }

  // The robe: a mycelium-violet bell from the waist, its edges and hem hanging as chains.
  const hem = (x0, x1, k) => {
    const top = at(MW, x0, 0);
    const pts = [top];
    let ox = 0;
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      ox -= trail(i, 1) * 6 * k;
      pts.push([lerp(top[0], 50 + dx * 0.4 + x1, t ** 0.85) + ox * t, lerp(top[1], floor - 0.6, t)]);
    }
    return pts;
  };
  {
    const L = hem(-10, -30, 1);
    const Rr = hem(10, 27, 0.8);
    const hemPts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = lerp(L[4][0], Rr[4][0], t);
      hemPts.push([x, floor - 0.6 - (i % 2 ? 1.6 : 0) - (walk ? 0.6 * Math.max(0, Math.sin(p * 2 - i * 0.8)) : 0)]);
    }
    out.push(pg([...L, ...hemPts.slice(1, 8), ...[...Rr].reverse()], P.robe.base));
    // The back of the robe in shadow, the fold lines lagging with the hem.
    const L2 = hem(-6, -15, 0.7);
    out.push(fp([...L, ...[...L2].reverse()], P.robe.sh));
    out.push(F(rtaper(hem(-1, -6, 0.5), 1, 2.4, P.robe.sh)), F(rtaper(hem(-12, -24, 0.9).slice(1), 0.8, 2, P.robe.sh2)));
    // The open front: the cream gown between gold-trimmed edges, with soft folds.
    const G1 = hem(1, -2, 0.55);
    const G2 = hem(9.4, 20, 0.75);
    out.push(fp([...G1, ...[...G2].reverse()], P.gown.base));
    out.push(fp([...G1, ...[...hem(4, 6, 0.6)].reverse()], P.gown.sh));
    for (const t of [0.45, 0.72]) {
      const a = lerp2(G1[Math.floor(t * 4)], G1[Math.ceil(t * 4)], (t * 4) % 1);
      const b = lerp2(G2[Math.floor(t * 4)], G2[Math.ceil(t * 4)], (t * 4) % 1);
      out.push(F(rtaper([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 1.4], b], 0.8, 0.8, P.gown.sh)));
    }
    for (const E2 of [G1, G2]) out.push(...limb(E2, 2.2, 2.6, P.gold.base, P.gold.sh2), F(rtaper(E2.map(([a, b]) => [a + 0.3, b]), 0.7, 0.8, P.gold.hi)));
    // Glowing mycelium threads and little toadstools along the hem.
    const pulse = dead ? 0 : att >= 0 ? [0.8, 1, 0.6, 0.4, 0.3][att] : 0.5 + 0.5 * Math.sin(walk ? p : it);
    out.push(F(rtaper([L[2], [L[2][0] + 5, L[2][1] + 6], [L[3][0] + 8, L[3][1] + 2], [L[4][0] + 12, L[4][1] - 3]], 0.7, 0.5, dead ? P.robe.hi : mix(P.robe.hi, P.glow, 0.5 + 0.4 * pulse))));
    for (const [t, s, c] of [[0.12, 1, P.glow], [0.28, 0.8, '#ff9ad2'], [0.86, 0.9, P.glow]]) {
      const x = lerp(L[4][0], Rr[4][0], t);
      out.push(...limb([[x, floor - 0.4], [x + 0.2, floor - 3 * s]], 1.2, 1, P.gown.base, P.gown.sh2), fov(x + 0.2, floor - 3.4 * s, 2.3 * s, 1.4 * s, shade(c, -30), 0, 12), fov(x + 0.4, floor - 3.6 * s, 1.8 * s, 1 * s, dead ? P.lace.sh : c, 0, 12));
    }
  }

  // Back arm: a bell sleeve that gestures (and flares open over the orb for the cast).
  {
    const Sb = at(MC, -6.4, 2);
    const [a1, a2] = dead ? [1.7, 0.1] : hurt ? [-2.4, -0.6] : att >= 0 ? [[-2.3, -0.4], [-2.5, -0.3], [2.2, -0.2], [2, -0.3], [1.9, -0.5]][att] : walk ? [1.9 + 0.12 * Math.sin(p + Math.PI), -0.5] : angry ? [-2.2, -0.5] : [2 - 0.05 * br, -0.6];
    const [El, Hd] = arm2(Sb, 9, 8, a1, a2);
    out.push(...limbR([Sb, El, Hd], 6.4, 8.4, ramp(P.robe.sh, true)), ...rball(Hd[0], Hd[1], 2.2, 2.1, P.skin, { hi: false }));
  }

  // The bodice and the ruffled collar.
  {
    const b = [];
    b.push(pg([[-9, 2], [9, 2], [10.4, 16], [-10.4, 16]], P.robe.base), fp([[-9, 2.4], [-2, 2.4], [-4, 16], [-10.2, 16]], P.robe.sh));
    b.push(fp([[1, 2.6], [8.6, 2.6], [8.2, 16], [2.4, 16]], P.gown.base), fp([[1, 2.6], [3.6, 2.6], [4, 16], [2.4, 16]], P.gown.sh));
    b.push(...limb([[1, 3], [2.4, 16]], 1.6, 1.8, P.gold.base, P.gold.sh2), ...limb([[8.6, 3], [8.6, 16]], 1.6, 1.8, P.gold.base, P.gold.sh2));
    b.push(fp([[-10.4, 14.4], [10.4, 14.4], [10.6, 16.4], [-10.6, 16.4]], P.gold.sh), fp([[-10, 14.4], [10, 14.4], [10, 15.4], [-10, 15.4]], P.gold.base));
    out.push(...place(MC, b));
  }

  // The head: back of the hair, the heroine face, bangs and the front lock, brows over the bangs.
  {
    const A = (x, y) => at(MH, x, y);
    out.push(...place(MH, [fp(hk([[-13.6, -9], [-5.4, -2.6], [-8.6, 5.4], [-12.4, 8], [-14.2, 1]]), P.hair.sh)]));
    out.push(...heroineHead(A, mood, { ...QFACE, browsOnTop: true }));
    const edge = QFACE.bangs;
    out.push(...place(MH, [pg(hk([[-13.4, -10], [-6, -12.6], [6, -12.4], [13.8, -8], [13.8, 1.6], ...[...edge].reverse()]), P.hair.base), fp(hk([[-12.6, -8.6], [-5.4, -2.6], [-3.4, -6], [-6, -9.4]]), P.hair.sh)]));
    const lt = at(MH, 12.4 * QK, -1 * QK);
    const { pts: lock } = chainPts(lt[0], lt[1], Math.PI / 2 + headA - 0.12, 3, () => 4.4, (i) => trail(i, 0.8) + 0.04);
    out.push(...limb(lock, 3.4, 1.2, P.hair.base, P.hair.sh2), F(rtaper(lock.slice(0, 3).map(([a, b]) => [a + 0.5, b]), 1, 0.5, P.hair.hi)));
    out.push(...heroineBrows(A, mood, QFACE), ...heroineTop(A, mood, QFACE));
    // The collar ruffle, over the neck.
    const c = [];
    for (let i = 0; i < 6; i++) {
      const x = -8 + i * 3.2;
      const y = 2.4 + Math.abs(i - 2.5) * -0.3;
      const FR = i % 2 ? P.frill : ramp(P.frill.sh);
      c.push(ov(x, y, 2.2, 1.7, FR.base, 0, 12), fov(x - 0.5, y + 0.5, 1.4, 0.7, FR.sh, 0, 10));
    }
    c.push(fov(4.6, 4.4, 1.7, 1.7, '#1f8f86', 0, 12), fov(4.6, 4.4, 1.25, 1.25, P.glow, 0, 12), fov(4.2, 4, 0.5, 0.5, '#ffffff', 0, 8));
    out.push(...place(MC, c));
  }

  // The cap: a spotted dome over pale gills, its frilled brim drooping at the ends like heavy
  // cloth (the ends lag the cap), the tiara on top.
  {
    const c = [];
    const R = P.cap;
    const rx = 32;
    const ry = 21;
    const droop = (x) => (x / rx) ** 2 * (2.6 + (walk ? 1.2 * Math.sin(p - 1.8 + x * 0.04) : att >= 0 ? [-1.4, -2, 2.4, 1.6, 0.4][att] : 0.6 * Math.sin(it - 2 + x * 0.04)) + (dead ? 1.6 : 0));
    const dome = [];
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI * (1 + i / 18);
      dome.push([Math.cos(a) * rx, Math.sin(a) * ry]);
    }
    const rim = [];
    for (let i = 0; i <= 10; i++) {
      const x = rx - (i / 10) * 2 * rx;
      rim.push([x, 1.4 + droop(x)]);
    }
    c.push(fp([[rx - 2, 1.6 + droop(rx)], [-rx + 2, 1.6 + droop(-rx)], [-rx + 6, 5.2], [rx - 6, 5.2]], P.gill.sh));
    for (let i = 0; i < 8; i++) c.push(fp([[-rx + 7 + i * 7.4, 2.6], [-rx + 8.6 + i * 7.4, 2.6], [-rx + 8 + i * 7.4, 5]], P.gill.sh2));
    c.push(C(pg([...dome, ...rim.slice(1, 10)], R.base)));
    // Form shadow: a crescent on the back and underside, tapering out toward the light.
    const inner = dome.map(([x, y]) => [x * 0.86 + 4, y * 0.82 - 1]);
    c.push(fp([...dome.slice(0, 10), ...inner.slice(0, 10).reverse()], R.sh), fp([...rim.slice(4), ...rim.slice(4).reverse().map(([x, y]) => [x * 0.9 + 2, y - 2.6])], R.sh));
    c.push(fov(9, -15.6, 10, 2.8, R.hi, -0.12, 16));
    // Warts: pale, each with its own shade underneath.
    for (const [x, y, r] of [[-20, -8, 3.4], [-6, -15, 3.8], [10, -10, 3.2], [22, -5, 2.6], [-26, -1.6, 2.2], [-11, -4, 2.4], [2, -4, 2], [16, -16, 2]]) {
      c.push(fov(x, y + 0.4, r + 0.5, r * 0.72 + 0.4, R.sh2, 0, 14), fov(x, y, r, r * 0.72, P.wart.base, 0, 14), fov(x + r * 0.25, y - r * 0.25, r * 0.4, r * 0.24, '#ffffff', 0, 8));
    }
    // The frill along the brim: scallops swinging a beat after the cap.
    for (let i = 0; i < 11; i++) {
      const x = rx - 1.5 - i * ((2 * rx - 3) / 10);
      const w = walk ? 0.5 * Math.sin(p - 1.8 - i * 0.5) : 0.3 * Math.sin(it - 1.4 - i * 0.5);
      const y = 2.6 + droop(x) + (i % 2) * 0.5 + w;
      const FR = i % 2 ? P.frill : ramp(P.frill.sh);
      c.push(ov(x, y, 3.4, 2, FR.base, 0, 12), fov(x - 0.6, y + 0.6, 2.2, 0.8, FR.sh, 0, 10));
    }
    // The tiara: a gold band with three points and gems, lit on the front.
    const ty = -ry + 1.4;
    c.push(pg([[-7, ty + 1.4], [7, ty + 1.4], [7.4, ty - 2], [5, ty - 5], [3, ty - 2.2], [0, ty - 7.4], [-3, ty - 2.2], [-5, ty - 5], [-7.4, ty - 2]], P.gold.base));
    c.push(fp([[-7, ty + 1.4], [-1, ty + 1.4], [-1, ty - 1], [-3, ty - 2.2], [-5, ty - 5], [-7.4, ty - 2]], P.gold.sh), fp([[1, ty - 1], [0, ty - 6.4], [2.4, ty - 2]], P.gold.hi), fp([[-7, ty + 0.4], [7, ty + 0.4], [7, ty + 1.4], [-7, ty + 1.4]], P.gold.sh2));
    for (const [x, y, r, g] of [[0, ty - 7.6, 1.5, '#ff6fb5'], [-5, ty - 5.2, 1, P.glow], [5, ty - 5.2, 1, P.glow], [0, ty - 0.6, 1.3, P.glow]]) c.push(fov(x, y, r + 0.4, r + 0.4, shade(g, -40), 0, 10), fov(x, y, r, r, g, 0, 10), fov(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.35, '#ffffff', 0, 6));
    out.push(...place(MK, c));
  }

  // The staff rides the front hand: walking, its foot plants and the body passes it; for the slam
  // it rises overhead (held), then drives down into the floor ahead.
  const S = at(MC, 7.4, 2.4);
  let grip;
  let sa;
  if (walk) {
    const planted = u < 0.5;
    const k = planted ? u / 0.5 : (u - 0.5) / 0.5;
    const bx = planted ? 84 - k * 9 : 75 + smooth(k) * 9;
    const lift = planted ? 0 : Math.sin(k * Math.PI) * 3;
    const foot = [bx + dx, floor - lift];
    grip = [bx - 4 + dx, S[1] + 8 - lift * 0.4];
    sa = Math.atan2(grip[1] - foot[1], grip[0] - foot[0]);
  } else if (att >= 0) {
    grip = [[S[0] + 3, S[1] - 13], [S[0] + 2, S[1] - 14.4], [S[0] + 10, S[1] + 3], [S[0] + 9.8, S[1] + 4], [S[0] + 10, S[1] + 6]][att];
    sa = [-1.95, -2.05, -0.98, -0.96, -1.25][att];
  } else if (dead) {
    grip = [S[0] + 7, S[1] + 12];
    sa = -1.15;
  } else {
    grip = [S[0] + 10 + (hurt ? -2 : 0), S[1] + 7 - (angry ? 3 : 0.6 * br)];
    sa = -1.62 + (hurt ? -0.2 : 0) + 0.02 * Math.sin(it - 0.8);
  }
  const gd = 34;
  const sLen = 66;
  const MS = joint(ID, grip[0] - Math.cos(sa) * gd, grip[1] - Math.sin(sa) * gd, sa);
  const orbAt = at(MS, sLen + 5.6, 0);
  const charge = att === 0 ? 1.3 : att === 1 ? 1.55 : angry && att < 0 ? 1.12 : 1;
  {
    const s = [];
    const W = P.wood;
    s.push(...limb([[0, 0], [sLen * 0.5, 0.4], [sLen, 0]], 3, 2.4, W.base, W.sh2), F(rtaper([[1.6, -0.7], [sLen - 2, -0.7]], 0.8, 0.8, W.hi)));
    for (const t of [0.2, 0.46, 0.74]) s.push(fov(sLen * t, 0.2, 0.8, 1.6, W.sh, 0, 10));
    // The crook curls around the orb; a gold collar ties it on.
    s.push(...limb([[sLen, 0], [sLen + 3, -4.6], [sLen + 8.4, -5], [sLen + 10.6, -0.6], [sLen + 9, 3.6]], 2.6, 1.2, W.base, W.sh2));
    s.push(fp([[sLen - 3.4, -2], [sLen - 0.8, -2], [sLen - 0.8, 2], [sLen - 3.4, 2]], P.gold.sh), fp([[sLen - 3, -2], [sLen - 1.8, -2], [sLen - 1.8, 2], [sLen - 3, 2]], P.gold.base));
    const r = 3.6 * charge;
    s.push(fov(sLen + 5.6, 0, r + 0.8, r + 0.8, '#1f8f86', 0, 20), fov(sLen + 5.6, 0, r, r, dead ? '#b8c6c4' : P.glow, 0, 20), fov(sLen + 6.4, 0.6, r * 0.5, r * 0.5, P.glowHi, 0, 12), fov(sLen + 4.6, -1.2, r * 0.22, r * 0.22, '#ffffff', 0, 8));
    out.push(...place(MS, s));
  }
  // The front arm reaches the grip; the sleeve hangs from the forearm.
  {
    const [El, Hd] = ik(S, grip, 9, 8.6, -1);
    out.push(...limbR([S, El, Hd], 6.4, 8, P.robe), ...rball(Hd[0], Hd[1], 2.4, 2.3, P.skin, { hi: false }), fp([[Hd[0] - 0.6, Hd[1] - 2], [Hd[0] + 0.6, Hd[1] - 2], [Hd[0] + 0.6, Hd[1] + 2], [Hd[0] - 0.6, Hd[1] + 2]], P.skin.sh));
    out.push(...limb([[El[0], El[1]], [(El[0] + Hd[0]) / 2 - 1, (El[1] + Hd[1]) / 2 + 2]], 2, 1.6, P.gold.base, P.gold.sh2));
  }

  // Spores drift off the orb; the wind-up gathers them in, and a glowing ring marks the floor where
  // the staff will land (the telegraph), held over two frames.
  const n = att === 0 || att === 1 || angry ? 4 : 2;
  const mt = walk ? f / 8 : f / 6;
  if (att < 0 && !dead) for (let i = 0; i < n; i++) {
    const v = (mt + i / n) % 1;
    out.push(...mote(orbAt[0] + Math.sin(v * TAU + i * 2) * 3.6, orbAt[1] - 5 - v * 6, 0.8 - v * 0.3, i % 2 ? PURP : P.glow));
  }
  if (att === 0 || att === 1) {
    const k = att === 1 ? 1 : 0.7;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + att;
      const d = (att ? 7 : 10) + (i % 2) * 2;
      out.push(...mote(orbAt[0] + Math.cos(a) * d, orbAt[1] + Math.sin(a) * d, 0.8, i % 2 ? '#ff9ad2' : P.glow));
    }
    out.push(fp(ringPts(80, floor - 2.2, 15 * k, 3.2 * k, 2), mix(P.glow, '#ffffff', 0.3)), fp(ringPts(80, floor - 2.2, 15 * k - 1.6, 3.2 * k - 0.6, 1.2), P.glow));
  }
  if (att === 2) out.push(...rswoosh(56, 88, 26, -95, -25, 4, P.glow));
  if (att === 2 || att === 3) {
    const k = att === 2 ? 0.3 : 0.75;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.05 + (i / 8) * 0.9);
      const d = 6 + k * 20 + (i % 3) * 2.4;
      const r = (2.2 + (i % 3) * 0.8) * (1 - k * 0.4);
      const x = Math.min(97 - r, 82 + Math.cos(a) * d);
      const y = floor - 2 + Math.sin(a) * d * 0.6;
      out.push(...mote(x, y, r, i % 3 ? P.glow : '#ff9ad2'));
    }
    if (att === 2) out.push(star(82, floor - 6, 7, '#ffffff'), star(82, floor - 6, 4, P.glowHi));
  }
  const shapes = squash(out, 50, floor, 1 - sq * 0.6, 1 + sq);
  return { w: 100, h: 122, res: 3, shapes };
}

// A flat ring on the floor (an ellipse band) for telegraphs.
function ringPts(x, y, rx, ry, w) {
  const o = [];
  const i = [];
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * TAU;
    o.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
    i.push([x + Math.cos(a) * (rx - w), y + Math.sin(a) * Math.max(0.3, ry - w * 0.3)]);
  }
  return [...o, ...i.reverse()];
}

// ---------- Tuskar the Behemoth ----------
// An armoured demon boar: a heavy barrel body under riveted plates, a mane of flame streaming off
// the ridge, curled horns, ivory tusks, and one burning eye in a sooty socket. Signature: the
// flaming ridge over a wedge-shaped head. Rig: hips > body (pitch about the hips when rearing,
// about the middle when galloping) > four two-bone IK legs with planted hooves; body > neck >
// head > jaw, ear and horn; the mane tongues and the tail are chains whose tips trail the body.
// The gallop is a transverse gallop: hinds then fores land in turn, a gathered and a suspended
// phase, the body rocking over them. The attack rears up (held), stomps both forehooves down
// with a shock ring of embers, holds the impact, and settles.

const BR = {
  fur: ramp('#8e5170'),
  belly: ramp('#d49bab'),
  plate: ramp('#6970b6', true),
  gold: ramp('#ffd36b'),
  horn: ramp('#5a4878', true),
  tusk: ramp('#fff3dc'),
  hoof: ramp('#4a3c60', true),
  snout: ramp('#e7a2b9'),
  fire: ['#e2462e', '#ff7a45', '#ffbf4d', '#fff2b8'],
  smoke: '#cbbfd9',
  mouth: '#4a1f3a',
};

// A closed smooth outline through control points (Catmull-Rom), for round masses.
function blob(ctrl, c, n = 4) {
  const m = ctrl.length;
  const out = [];
  for (let i = 0; i < m; i++) {
    const [p0, p1, p2, p3] = [ctrl[(i + m - 1) % m], ctrl[i], ctrl[(i + 1) % m], ctrl[(i + 2) % m]];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const q = (j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([q(0), q(1)]);
    }
  }
  return pg(out, c);
}

// A flame tongue as a chain from its root along angle a: a round bulb at the root tapering to a
// licking point, three nested layers (the hot core sits low in the bulb), the chain bending in a
// travelling S-wave that flickers with ph, a side lick forking off, and an ember breaking away.
function tongue(x, y, a, len, w, bend, cols, ph = 0) {
  const out = [];
  const prof = (k) => (t) => w * k * (t < 0.26 ? 0.66 + 0.34 * Math.sin((t / 0.26) * (Math.PI / 2)) : Math.pow((1 - t) / 0.74, 1.2));
  const spine = (x0, y0, L, wav) => chainPts(x0, y0, a, 5, L / 5, (i) => bend * (i + 1) * 0.11 + wav * Math.sin(ph - i * 1.15) * (i / 5));
  // The side lick, behind the main tongue.
  const sd = Math.sin(ph * 1.3) > 0 ? 1 : -1;
  const { pts: lk } = chainPts(x + Math.cos(a) * len * 0.3, y + Math.sin(a) * len * 0.3, a + sd * 0.55 + bend * 0.6, 3, len * 0.14, (i) => -sd * 0.25 * (i + 1) + bend * 0.3);
  out.push(F(rtaper(lk, w * 0.42, 0.2, cols[0])));
  [[1, cols[0]], [0.66, cols[1]], [0.36, cols[2]]].forEach(([k, c], li) => {
    const off = li * len * 0.05;
    const { pts } = spine(x + Math.cos(a) * off, y + Math.sin(a) * off, len * (li ? k * 1.12 : 1), 0.5 + li * 0.12);
    out.push(F(rtaper(pts, prof(k), 0, c)));
  });
  // An ember breaking off the tip on alternate flickers.
  const fl = Math.sin(ph * 0.9 + 1);
  if (fl > 0.2) {
    const { pts } = spine(x, y, len * (1.04 + fl * 0.08), 0.5);
    const e = pts[5];
    out.push(fov(e[0], e[1], w * 0.11 + 0.3, w * 0.13 + 0.35, cols[1], a, 8));
  }
  return out;
}

function behemoth(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = BR;
  const floor = 99.5;
  // Body pose: the gallop rocks over the legs (low as the hinds gather, high in suspension); the
  // idle breathes with a held top and paws the floor; the rear pivots on the hind hooves.
  let by = 0;
  let pitch = 0;
  let headA = 0;
  let jaw = 0.06;
  let pivot = [62, 64];
  if (walk) {
    by = -2.4 * Math.sin(p + 0.6);
    pitch = 0.045 * Math.sin(p - 0.4);
    headA = 0.06 * Math.sin(p - 1.2);
    jaw = 0.08 + 0.05 * Math.sin(2 * p);
  } else if (att >= 0) {
    pivot = [40, 92];
    pitch = [-0.26, -0.33, 0.04, 0.06, 0][att];
    by = [0, -1, 3.2, 2.6, 0.6][att];
    headA = [-0.12, -0.18, 0.2, 0.16, 0.02][att];
    jaw = [0.36, 0.44, 0.2, 0.3, 0.1][att];
  } else {
    by = 0.7 * br;
    headA = 0.03 * Math.sin(it - 0.8) + (f === 3 || f === 4 ? 0.05 : 0);
    jaw = 0.05;
  }
  if (angry && att < 0) {
    headA += 0.12;
    by += 1.2;
    jaw = 0.32;
  }
  if (hurt) {
    headA -= 0.26;
    pitch -= 0.06;
    jaw = 0.18;
  }
  if (dead) {
    by = 14;
    pitch = 0.04;
    headA = 0.14;
    jaw = 0.22;
  }
  // The body's own space has its origin at the hips; it turns about `pivot`.
  const MP = joint(ID, pivot[0], pivot[1], pitch);
  const MB = joint(MP, 40 - pivot[0], 67 + by - pivot[1]);
  const MN = joint(MB, 44, -6, headA);
  const MJ = joint(MN, 12, 9, jaw);
  const out = [];
  const flare = dead ? 0 : angry || att === 0 || att === 1 ? 1.35 : att >= 2 ? 1.15 : 1;
  // How far the flames and tail trail per segment: streamed back in the gallop, up in the rear.
  const trail = (i) => (walk ? -0.18 - 0.08 * Math.sin(p - 1 - i * 0.8) : att >= 0 ? [-0.05, 0.05, -0.3, -0.22, -0.1][att] : -0.06 * Math.sin(it - 1.4 - i * 0.8) - 0.04) + (hurt ? 0.12 : 0);

  // Legs: hip/shoulder sockets in body space; the hooves plant on the floor (sprite space).
  const legs = [
    { s: [-1, 4], home: 34, q: 0, dir: -1, R: ramp(P.fur.sh), far: 1 },
    { s: [38, 5], home: 78, q: 0.5, dir: 1, R: ramp(P.fur.sh), far: 1 },
    { s: [2, 6], home: 40, q: 0.12, dir: -1, R: P.fur, far: 0 },
    { s: [41, 7], home: 84, q: 0.62, dir: 1, R: P.fur, far: 0 },
  ];
  const leg = (L) => {
    const Hp = at(MB, L.s[0], L.s[1]);
    const fore = L.dir > 0;
    let ft;
    if (dead) ft = [Hp[0] + (fore ? 9 : -10), floor - 1.4];
    else if (walk) {
      const [ox, lift] = pawStep(p + L.q * TAU, 7, 6, 0.42);
      ft = [L.home + ox, floor - 1.4 - lift];
    } else if (att >= 0 && fore) {
      ft = att < 2 ? [Hp[0] + 7 + L.far * -2, Hp[1] + 17 - att * 2] : [L.home + 4 - L.far * 3, floor - 1.4];
    } else {
      // Idle: the near forehoof paws the floor (scrapes back, lifts, comes down).
      const paw = !fore || L.far || angry ? [0, 0] : keyAt([[0, 0], [0, 0], [-2, 0], [-4, 3], [1, 4], [0, 0]], f);
      ft = [L.home + paw[0] + (hurt ? -2 : 0), floor - 1.4 - paw[1]];
    }
    const [K, Ft] = ik(Hp, ft, 17, 16, L.dir);
    const R = L.R;
    // Thick round upper legs (the thigh or forearm mass), a rounded knee, then the slim cannon.
    const mid = lerp2(Hp, K, 0.45);
    const res = [...limbR([K, Ft], 7.2, 5.4, R), ...limbR([Hp, mid, K], 13.6, 7.6, R), fov(K[0] + 0.2, K[1] - 0.3, 3.6, 3.6, R.base, 0, 12), fov(mid[0], mid[1], 6.2, 5.6, R.base, 0, 14)];
    // A shaggy fetlock tuft and an armoured hoof with an ember crack.
    res.push(fp([[Ft[0] - 4, Ft[1] - 3.4], [Ft[0] + 3.4, Ft[1] - 3.6], [Ft[0] + 2.4, Ft[1] - 0.4], [Ft[0] - 3, Ft[1] - 0.2]], R.sh2));
    res.push(pg([[Ft[0] - 3.6, Ft[1] - 0.6], [Ft[0] + 3.6, Ft[1] - 0.6], [Ft[0] + 4.6, Ft[1] + 1.4], [Ft[0] - 3.6, Ft[1] + 1.4]], L.far ? P.hoof.sh : P.hoof.base), fp([[Ft[0] - 3.2, Ft[1] - 0.6], [Ft[0] + 3.4, Ft[1] - 0.6], [Ft[0] + 3.6, Ft[1]], [Ft[0] - 3.2, Ft[1]]], P.hoof.hi));
    if (!dead) res.push(F(rtaper([[Ft[0] + 0.6, Ft[1] - 0.4], [Ft[0] + 0.9, Ft[1] + 1.2]], 0.67, 0.5, P.fire[2])));
    return { res, Ft };
  };
  const L = legs.map(leg);
  out.push(...L[0].res, ...L[1].res);

  // The tail: a chain from the rump, a flame tuft at its tip.
  {
    const r0 = at(MB, -15, -6);
    // Rearing drops the rump toward the sprite's back edge, so the tail swings down to hang
    // (gravity) until its flame tip stays inside the sprite.
    let a0 = Math.PI + 0.7 - pitch * 0.2 - (att === 0 || att === 1 ? 0.5 : 0);
    let tc = chainPts(r0[0], r0[1], a0, 4, () => 3.4, (i) => -0.35 + trail(i) * 1.2);
    for (let k = 0; k < 10 && Math.min(...tc.pts.map((q) => q[0]), tc.pts[4][0] + Math.cos(tc.a - 0.4) * 7 * flare) < 3; k++) {
      a0 -= 0.14;
      tc = chainPts(r0[0], r0[1], a0, 4, () => 3.4, (i) => -0.35 + trail(i) * 1.2);
    }
    const { pts, a } = tc;
    out.push(...limb(pts, 2.6, 1.2, P.fur.sh, P.fur.sh2));
    if (!dead) out.push(...tongue(pts[4][0], pts[4][1], a - 0.4, 7 * flare, 4, trail(4), P.fire.slice(1), (walk ? p : it) * 2 + 1));
  }

  // The body: a heavy barrel, the belly lighter underneath, the form shadow along the back and
  // belly line, and the bristled neck mass.
  {
    const b = [];
    // A round, weighty barrel: high humped shoulders, the back sloping to a round rump, a deep
    // chest and a sagging belly.
    b.push(C(blob([[-17, -2], [-13, -12], [0, -16], [16, -20], [30, -24], [43, -17], [50, -5], [47, 9], [34, 15], [14, 16], [-4, 13], [-14, 8]], P.fur.base)));
    // Form shadow down the back of the rump and under the belly line.
    b.push(F(blob([[-17, -2], [-13, -11], [-9, -8], [-11, 3], [-4, 12.6], [-14, 8]], P.fur.sh, 3)));
    b.push(F(blob([[-4, 12.6], [14, 15.6], [34, 14.6], [44, 10], [34, 9.6], [14, 10.4], [0, 9]], P.belly.base, 3)), fp([[-1, 11.6], [14, 14.4], [33, 13.8], [35, 12], [14, 12], [2, 10.6]], P.belly.sh));
    // The hip plane: a round haunch with its lit top and a crease along its front edge.
    b.push(F(blob([[-14, -4], [-6, -11], [4, -9], [8, 0], [4, 9], [-6, 10], [-13, 4]], P.fur.base, 3)));
    b.push(fp([[-11, -7], [-5, -10.6], [3, -8.6], [-2, -7.6], [-8, -5.4]], P.fur.hi));
    b.push(F(rtaper([[3, -8], [7.6, -1], [6.6, 5], [3, 9.6]], 1.4, 0.5, P.fur.sh2)));
    // The shoulder plane: the big lit scapula mass under the hump, set off from the barrel by a
    // crease behind it.
    b.push(F(rtaper([[24, -18], [21, -9], [22, 1], [26, 9]], 1.6, 0.6, P.fur.sh2)));
    b.push(F(blob([[25, -17], [36, -21], [45, -13], [46, -1], [41, 8], [31, 8], [25, 0]], P.fur.base, 3)));
    b.push(fp([[27, -16], [36, -20], [43, -14], [36, -14.6], [29, -12]], P.fur.hi), F(blob([[38, -6], [44, -9], [46, 2], [42, 6]], P.fur.hi, 2)));
    // The barrel's lower flank, shaded between the two planes.
    b.push(F(blob([[8, 4], [22, 3], [26, 9], [12, 10]], P.fur.sh, 2)));
    // Bristles at the scruff, each tuft a short chain lagging the head.
    for (let i = 0; i < 3; i++) {
      const x = 42 + i * 3;
      b.push(fp([[x - 2, -12 + i * 3], [x + 4 + trail(i) * 6, -16 + i * 2.6], [x + 2, -9 + i * 3]], P.fur.sh2));
    }
    out.push(...place(MB, b));
  }

  // Armour plates along the spine (riveted, three-step metal shine, gold trim), and the flame mane
  // streaming off their ridge: each tongue is a chain whose tip trails a beat behind.
  {
    const plates = [[-10, -12, 12, -0.3], [2, -17, 14, -0.12], [16, -20, 14, 0], [30, -19, 13, 0.14], [42, -13, 10, 0.4]];
    const flames = [];
    plates.forEach(([x, y, w, a], i) => {
      const MPl = joint(MB, x, y, a);
      const pl = [];
      pl.push(pg([[-w / 2 - 1, 6], [-w / 2, -1.4], [-w / 4, -4.4], [w / 2, -3.6], [w / 2 + 1.6, 5]], P.plate.base));
      pl.push(fp([[-w / 2 - 1, 6], [-w / 2, -1.4], [-w / 4, -4.4], [-w / 4 + 2, 6]], P.plate.sh), fp([[w / 6, -3.8], [w / 2, -3.4], [w / 2 + 0.4, -0.6], [w / 6 + 1, -1.2]], P.plate.hi), fp([[w / 2 - 1.4, -3.4], [w / 2, -3.4], [w / 2, -2]], '#ffffff'));
      pl.push(...limb([[-w / 2 - 0.6, 5], [w / 2 + 1.4, 4.4]], 1.6, 1.6, P.gold.base, P.gold.sh2));
      pl.push(fov(0, 1.6, 0.7, 0.7, P.plate.sh2, 0, 8), fov(-0.2, 1.4, 0.35, 0.35, P.plate.hi, 0, 6));
      out.push(...place(MPl, pl));
      if (!dead) {
        const root = at(MPl, 0, -3.6);
        const len = (17 + (i % 2) * 4 + (i === 2 ? 5 : 0)) * flare * (1 + 0.12 * Math.sin((walk ? p : it) * 2 + i * 1.9));
        flames.push(...tongue(root[0], root[1], -Math.PI / 2 + a + pitch - 0.3, len, 8.4, trail(i) * 1.6 - 0.1, P.fire, (walk ? p * 2 : it * 2) + i * 2.1));
      } else if (i % 2) flames.push(...mote(at(MPl, 0, -6)[0], at(MPl, 0, -6)[1] - (f % 3), 1.2, P.smoke));
    });
    out.push(...flames);
  }

  // Near legs over the body.
  out.push(...L[2].res, ...L[3].res);

  // The head: a wedge skull under a horned helm, the snout disc, one burning eye, the ear (a short
  // chain lagging the head), and the jaw with its tusk turning on its hinge.
  {
    const h = [];
    // The jaw first (under the skull).
    const j = [pg([[-2, -2], [16, -1], [18, 2.6], [8, 5], [-4, 3]], P.fur.sh), fp([[0, 1], [15, 0.4], [16, 2], [8, 3.6], [-2, 2.6]], P.belly.sh)];
    j.push(fp([[3, -1.6], [15, -1], [14, 0.4], [4, 0.4]], P.mouth));
    out.push(...place(MJ, j));
    // Ear behind the helm.
    const e0 = at(MN, -2, -10);
    const { pts: ear } = chainPts(e0[0], e0[1], -Math.PI / 2 - 0.9 + headA, 2, () => 4, (i) => -0.3 + trail(i) * 1.5 + (hurt ? -0.3 : 0) + (angry ? -0.2 : 0));
    out.push(...limb(ear, 5.4, 1.4, P.fur.sh, P.fur.sh2));
    h.push(C(pg([[-6, -10], [6, -12], [16, -6], [26, -1], [28, 6], [22, 9], [6, 10], [-6, 6]], P.fur.base)));
    h.push(fp([[-6, -10], [-1, -11], [-2, 4], [6, 10], [-6, 6]], P.fur.sh), fp([[4, 6], [20, 7.4], [22, 9], [6, 10]], P.fur.sh));
    // The snout disc, lit on its front face.
    h.push(...rball(27.6, 3.4, 3, 4.2, P.snout), fov(28.6, 2, 0.8, 1.1, P.snout.sh2, 0, 8), fov(28.4, 5, 0.8, 1.1, P.snout.sh2, 0, 8));
    // The helm: a plate over the brow and down the nose ridge, with a gold trim.
    h.push(pg([[-5, -11], [7, -13.4], [20, -6], [22, -3], [12, -3], [2, -4], [-4, -4]], P.plate.base), fp([[-5, -11], [1, -12.4], [0, -4], [-4, -4]], P.plate.sh), fp([[8, -12], [19, -6.2], [16, -5.2], [7, -10]], P.plate.hi));
    h.push(...limb([[-4, -4.4], [4, -4], [12, -3.2], [21, -3.2]], 1.4, 1.2, P.gold.base, P.gold.sh2));
    // Horn: a curled chain from the helm, sweeping back and up.
    const { pts: horn } = chainPts(2, -12, -Math.PI / 2 - 0.5, 4, (i) => [4.6, 4.4, 4, 3.4][i], () => -0.45);
    h.push(...limb(horn, 5, 1.2, P.horn.base, P.horn.sh2), F(rtaper(horn.slice(1).map(([x, y]) => [x + 0.8, y + 0.4]), 1.2, 0.5, P.horn.hi)));
    // The upper tusk, curving up from the lip.
    h.push(...limb([[18, 6], [22, 5.4], [25, 1.6], [25.4, -3]], 2.6, 0.8, P.tusk.base, P.tusk.sh2), F(rtaper([[19, 5.2], [22.6, 4.4], [24.4, 1]], 0.7, 0.4, '#ffffff')));
    // The burning eye in its sooty socket, a flame licking back off it (faces.js glowEye).
    const ex = 12;
    const ey = -1.4;
    h.push(fov(ex, ey, 4.4, 3.6, '#2a1830', 0, 16));
    if (dead) h.push(...deadEye(ex, ey, 1.9, { c: '#8a7d92', th: 0.8 }));
    else {
      const big = angry || att >= 0 ? 1.18 : 1;
      if (!hurt && mood !== 'blink' && !happy) {
        const fl = (angry || att >= 0 ? 6.6 : 4.4) * (1 + 0.15 * Math.sin((walk ? p : it) * 2));
        h.push(...tongue(ex - 1.8, ey - 0.6, Math.PI + 0.35, fl, 3.4, 0.25, P.fire.slice(1), (walk ? p : it) * 2 + 3));
      }
      const act = actOf(mood, { idle: { lid: 0.18 }, angry: { lid: 0.2, slant: 0.9, raise: 0.25 } });
      h.push(...glowEye(ex, ey, { shape: 'round', s: 1, w: 2.6 * big, h: 2.3 * big, c: angry || att >= 0 ? '#ff6a3a' : '#ff9a4a', hot: '#fff2b8', bg: '#2a1830', look: [0.4, 0.1], flick: (f % 4) / 4, ...act, ...(att >= 0 ? { lid: 0.16, slant: 0.9, closed: undefined } : {}) }));
      h.push(...brow(ex - 0.4, ey - 3.6, { s: 1, len: 3.2, angle: angry || att >= 0 ? 28 : hurt ? -20 : 8, th: 1.1, c: P.plate.sh2, shape: 'flat', arch: 0.1 }));
    }
    out.push(...place(MN, h));
    // The lower tusk rides the jaw.
    out.push(...place(MJ, [...limb([[13, 1], [16, -1.4], [17.4, -5]], 2, 0.7, P.tusk.base, P.tusk.sh2)]));
  }

  // Snorts: smoke puffs off the snout in the gallop and the paw; embers fly in the stomp.
  const nose = at(MN, 30, 3);
  if (!dead && (walk || att === 4 || f === 4)) {
    const k = walk ? (f % 4) / 4 : 0.4;
    for (let i = 0; i < 2; i++) out.push(fov(Math.min(118, nose[0] + 2 + k * 5 + i * 2.4), nose[1] + 2 - i * 2, 1.8 + k * 1.6 - i * 0.4, 1.5 + k * 1.2, mix(P.smoke, '#ffffff', 0.3 + k * 0.4), 0, 12));
  }
  if (att >= 2 && att <= 3) {
    const k = att === 2 ? 0.25 : 0.7;
    const hx = (L[2].Ft[0] + L[3].Ft[0]) / 2 + 2;
    out.push(fp(ringPts(hx, floor - 1 - k * 3.2, 10 + k * 20, 2.4 + k * 4, 2.4), mix(P.fire[2], '#ffffff', 0.3)));
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.08 + (i / 6) * 0.84);
      const d = 8 + k * 22 + (i % 3) * 2;
      out.push(...mote(Math.min(120, hx + Math.cos(a) * d), floor - 2 + Math.sin(a) * d * 0.55, 1.4 - k * 0.5, i % 2 ? P.fire[2] : P.fire[1]));
    }
    if (att === 2) out.push(star(hx, floor - 7, 8, P.fire[3]), star(hx, floor - 7, 4.6, '#ffffff'));
  }
  if (angry && att < 0) out.push(star(nose[0] - 6, nose[1] - 18, 2.2, P.fire[2]));
  const sq = key(att, [0.02, 0.025, -0.04, -0.02, 0], walk ? Math.cos(p + 0.6) * 0.015 : 0.008 * br);
  return { w: 124, h: 100, res: 3, shapes: squash(out, 62, floor, 1 - sq * 0.5, 1 + sq) };
}

// ---------- Gnarlroot, the Hollow Heart ----------
// An ancient corrupted tree. Signature: a split down the bark where a purple heart beats, under a
// crown of dead branches tipped with glowing leaves, and two root-tentacle arms ending in claws.
// Rig: the base (planted on its roots) > lower trunk > upper trunk (the face) > the crown; each
// trunk joint bends further than the one below, so the top lags the sway. Arms, branches, twigs
// and roots are chains whose tips trail. Walking, the roots step in two groups (planted, then
// hauled forward) and the trunk lurches onto them. The slam curls both arms high over the crown
// (a held wind-up: the heart flares and the floor glows where they will land), whips them down
// onto the floor, holds the impact while root spikes burst up, then lifts them.

const GR = {
  bark: ramp('#8a6a80'),
  far: ramp('#6c536c'),
  root: ramp('#7b5d72'),
  moss: ramp('#86c99a', true),
  fungus: ramp('#ffae8a'),
  heart: ramp('#d65cff', true),
  dim: ramp('#7a5f80', true),
  leaf: ramp('#e58cff', true),
  leaf2: ramp('#7fe6cc', true),
  tooth: ramp('#f1e3cb'),
  hole: '#24182d',
  vein: '#b86cff',
  veinHot: '#ff8af0',
  core: '#ffe6ff',
};

// A pointed leaf from its stalk at (x, y) toward angle a: dark rim, the blade, its lit half.
function gleaf(x, y, a, l, w, R) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const q = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  return [
    fp([q(-0.4, 0), q(l * 0.4, w + 0.45), q(l + 0.6, 0), q(l * 0.4, -w - 0.45)], R.sh2),
    fp([q(0, 0), q(l * 0.4, w), q(l, 0), q(l * 0.4, -w)], R.base),
    fp([q(0.4, -0.1), q(l * 0.45, -w * 0.7), q(l * 0.85, -0.1)], R.hi),
  ];
}

// The trunk's back and front edges, each point in one of the three trunk frames (0 base, 1 lower,
// 2 upper), base to crown.
const TR_L = [[0, -47, 2], [0, -37, -5], [0, -30, -18], [0, -28, -36], [1, -31, -16], [1, -27, -36], [2, -27, -2], [2, -24, -16], [2, -20, -26], [2, -13, -32]];
const TR_R = [[0, 46, 2], [0, 34, -6], [0, 28, -20], [0, 26, -38], [1, 29, -20], [1, 26, -38], [2, 26, -6], [2, 23, -18], [2, 19, -27], [2, 12, -32]];
const GROOVES = [
  [[0, -20, -2], [0, -18, -20], [1, -20, -10], [1, -18, -30]],
  [[0, -8, -4], [0, -10, -24], [0, -12, -40]],
  [[0, 14, -2], [0, 13, -18], [0, 17, -36], [1, 19, -12]],
  [[1, -19, -40], [2, -17, -10], [2, -14, -24]],
  [[2, 18, -8], [2, 14, -22]],
];
// The split in the bark (lower trunk frame), and the corruption veins branching off it.
const SPLIT = [[2, -32], [6, -26], [11, -22], [9, -16], [13, -10], [10, -3], [11, 3], [4, 8], [-1, 4], [-6, -2], [-4, -9], [-8, -15], [-4, -21], [-5, -27]];
const VEINS = [[[-6, -20], [-13, -25], [-20, -24], [-24, -30]], [[11, -22], [16, -30], [15, -38]], [[13, -8], [19, -2], [21, 6]], [[-6, -2], [-12, 6], [-13, 16]]];
// Crown branches on the upper trunk: x, y, splay from upright, gnarl.
const CROWN = [[-17, -24, -1.05, 0.22], [-10, -29, -0.55, -0.2], [-3, -31, -0.15, 0.25], [4, -31, 0.18, -0.22], [11, -29, 0.55, 0.2], [17, -24, 1.0, -0.25]];
// Roots: base-frame socket, home tip x on the floor, step group, far (behind).
const GROOTS = [[-26, -9, 30, 0, 1], [22, -9, 120, 1, 1], [-34, -7, 8, 0, 0], [6, -6, 96, 1, 0], [32, -7, 142, 1, 0]];
const ARM_L = [13, 12, 12, 11, 11, 10, 9, 8];

function treant(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = GR;
  const floor = 166;
  let lean = 0;
  let bend = 0;
  let drop = 0;
  let dx = 0;
  if (walk) {
    lean = 0.03 + 0.025 * Math.sin(2 * p - 0.8);
    bend = 0.02 * Math.sin(2 * p - 1.8);
    drop = 2.6 * Math.cos(p - 0.35) ** 2;
    dx = 1.4 * Math.sin(2 * p - 0.5);
  } else if (att >= 0) {
    lean = [-0.08, -0.11, 0.07, 0.06, 0.015][att];
    bend = [-0.05, -0.07, 0.07, 0.05, 0.01][att];
    drop = [-2, -3, 7, 6, 1.5][att];
  } else {
    lean = 0.014 * Math.sin(it - 0.5);
    bend = 0.018 * Math.sin(it - 1.5);
    drop = -1.4 * br;
  }
  if (angry && att < 0) {
    lean += 0.025;
    drop += 1.5;
  }
  if (hurt) {
    lean -= 0.07;
    bend -= 0.05;
    drop += 1;
  }
  if (dead) {
    lean = 0.05;
    bend = 0.12;
    drop = 9;
  }
  // The base barely turns (its roots hold it to the floor); the lean is taken up the trunk.
  const MB = joint(ID, 75 + dx, floor - 2, lean * 0.4);
  const MM = joint(MB, 0, -50 + drop * 0.5, bend + lean * 0.6);
  const MT = joint(MM, 0, -46 + drop * 0.5, bend * 1.3);
  const FR = [MB, MM, MT];
  const tp = (list, k = 0) => list.map(([i, x, y]) => {
    const q = at(FR[i], x * (1 - k), y);
    return [q[0], Math.min(q[1], floor)];
  });
  // The heart's beat (a lub-dub with a held rest) and how hot the corruption burns.
  const beat = dead ? 0 : walk ? keyAt([1, 0.3, 0.8, 0.1], f % 4) : att >= 0 ? [0.8, 1, 1, 0.7, 0.4][att] : keyAt([1, 0.35, 0.85, 0.15, 0, 0], f);
  const glow = dead ? 0 : angry || att >= 0 ? 1 : 0.55 + 0.45 * beat;
  const out = [];

  // The arms: root-tentacle chains from the shoulders that curl at the tips and end in claws.
  const armAt = (s, A, curl, wv) => {
    const sh = at(MT, s * 22, 7);
    const a0 = (s > 0 ? A : Math.PI - A) + lean + bend;
    const { pts, a } = chainPts(sh[0], sh[1], a0, 8, (i) => ARM_L[i], (i) => (i ? s * curl : 0) + wv(i));
    pts.forEach((q) => {
      q[1] = clamp(q[1], 6, floor - 3);
      q[0] = clamp(q[0], 5, 145);
    });
    return { pts, a };
  };
  const slamA = (s, curl, wv) => {
    let A = 0.2;
    while (A < 1.3 && armAt(s, A, curl, wv).pts[8][1] < floor - 9) A += 0.05;
    return A;
  };
  const arm = (s) => {
    let A = 0.68 + 0.04 * Math.sin(it - (s > 0 ? 0 : 1));
    let curl = 0.13;
    if (dead) {
      A = 1.1;
      curl = 0.04;
    } else if (att >= 0) {
      A = [-0.7, -0.85, 0.55, 0.6, 0.66][att];
      curl = [-0.3, -0.34, 0.06, 0.07, 0.13][att];
    } else if (walk) A = 0.7 + 0.16 * Math.sin(p + (s > 0 ? Math.PI : 0));
    if (hurt && att < 0) {
      A -= 0.5;
      curl -= 0.06;
    }
    if (angry && att < 0) {
      A -= 0.25;
      curl = 0.16;
    }
    const amp = dead ? 0 : walk ? 0.07 : att >= 0 ? 0.02 : 0.06;
    const ph = (walk ? 2 * p : it) + (s > 0 ? 0 : 1.7);
    const wv = (i) => amp * Math.sin(ph - i * 0.9);
    // The slam drives the arm down until its tip strikes the floor.
    if (!dead && (att === 2 || att === 3)) A = slamA(s, curl, wv);
    const { pts, a } = armAt(s, A, curl, wv);
    const R = s > 0 ? P.root : P.far;
    const res = limbR(pts, 10, 3.4, R);
    // Thorns along the top of the arm.
    [2, 4, 6].forEach((i, k) => {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const l = Math.hypot(x1 - x0, y1 - y0) || 1;
      let nx = -(y1 - y0) / l;
      let ny = (x1 - x0) / l;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const w = [4.6, 3.6, 2.6][k];
      const h = [4.4, 3.6, 2.8][k];
      res.push(fp([[x0 + nx * w * 0.5, y0 + ny * w * 0.5], [x0 + nx * (w * 0.5 + h) + (x1 - x0) / l * 2.4, y0 + ny * (w * 0.5 + h) + (y1 - y0) / l * 2.4], [x0 + (x1 - x0) / l * 3 + nx * w * 0.4, y0 + (y1 - y0) / l * 3 + ny * w * 0.4]], R.sh2));
    });
    // Three claws fanning from the tip.
    const T0 = pts[8];
    for (let k = -1; k <= 1; k++) {
      const { pts: c } = chainPts(T0[0], T0[1], a + k * 0.55, 2, (i) => [4.6, 3.6][i], () => s * 0.35);
      c.forEach((q) => {
        q[1] = clamp(q[1], 3, floor - 1);
        q[0] = clamp(q[0], 2, 148);
      });
      res.push(...limb(c, 2.2, 0.5, P.bark.sh, P.hole));
    }
    return { res, tip: T0 };
  };
  const nearArm = arm(1);
  const farArm = arm(-1);

  // Roots: far ones behind, near ones over the base. Each is planted along the floor and curls up
  // at the tip; walking, each group of roots plants, then is hauled forward.
  const root = ([x, y, home, g, far]) => {
    const r0 = at(MB, x, y);
    const [ox, lift] = walk ? pawStep(p + g * Math.PI, 5, 4, 0.6) : [0, 0];
    const dir = home < 75 ? -1 : 1;
    const tip = [clamp(home + ox, 4, 146), floor - 1.6 - lift];
    const pts = [r0, [lerp(r0[0], tip[0], 0.42), floor - 6.5 - lift * 0.3], [lerp(r0[0], tip[0], 0.76), floor - 2.6 - lift * 0.6], tip, [clamp(tip[0] + dir * 3, 2, 148), tip[1] - 2.6]];
    return limbR(pts, far ? 11 : 13, 1.4, far ? P.far : P.root);
  };
  GROOTS.filter((r) => r[4]).forEach((r) => out.push(...root(r)));

  // The crown: dead branches (behind the trunk top) whose tips trail the sway, each with a forked
  // twig, and glowing leaves on the tips.
  const sway = walk ? Math.sin(2 * p - 1.6) : att >= 0 ? [-0.6, -1, 1, 0.6, 0.2][att] : Math.sin(it - 1.8);
  CROWN.forEach(([x, y, a, g], i) => {
    const r0 = at(MT, x, y);
    const lag = (k) => (dead ? (a < 0 ? -0.22 : 0.22) * (k + 1) * 0.5 : 0.05 * sway * Math.cos(k * 0.6 + i * 0.5) * (k + 1) * 0.6) + (hurt ? -0.05 : 0);
    const { pts, a: aEnd } = chainPts(r0[0], r0[1], -Math.PI / 2 + a + lean + bend * 2.3, 3, (k) => [11, 9.5, 7.5][k] * (i === 2 || i === 3 ? 1 : 0.9), (k) => (k ? g * (k % 2 ? 1 : -0.7) : 0) + lag(k));
    pts.forEach((q) => (q[1] = Math.max(q[1], 13)));
    out.push(...limb(pts, 6.4, 1.6, P.bark.base, P.bark.sh2));
    const sa = Math.atan2(pts[2][1] - pts[1][1], pts[2][0] - pts[1][0]);
    const { pts: tw, a: twA } = chainPts(pts[1][0], pts[1][1], sa - Math.sign(g) * 0.8, 2, (k) => [6, 4][k], (k) => lag(k + 1) * 1.3);
    out.push(...limb(tw, 2.6, 0.8, P.bark.base, P.bark.sh2));
    if (!dead) {
      out.push(...gleaf(pts[3][0], pts[3][1], aEnd + 0.2 * sway, 5.4, 2.2, i % 2 ? P.leaf2 : P.leaf));
      if (i % 2 === 0) out.push(...gleaf(tw[2][0], tw[2][1], twA, 4.4, 1.8, P.leaf2));
    }
  });
  if (dead) [[22, 0.4], [104, -0.3], [128, 0.2]].forEach(([x, a], i) => out.push(...gleaf(x, floor - 1.2, a, 5, 1.6, i % 2 ? P.dim : P.far)));
  out.push(...farArm.res);

  // The trunk: base tone, the back in shadow (deepest low down), the front lit, bark grooves, a
  // knot, bracket fungi on the back and moss on the shoulders.
  out.push(C(pg([...tp(TR_L), ...tp(TR_R).reverse()], P.bark.base)));
  out.push(fp([...tp(TR_L), ...tp(TR_L, 0.3).reverse()], P.bark.sh));
  out.push(fp([...tp(TR_L.slice(0, 6)), ...tp(TR_L.slice(0, 6), 0.12).reverse()], P.bark.sh2));
  out.push(fp([...tp(TR_R.slice(4)), ...tp(TR_R.slice(4), 0.18).reverse()], P.bark.hi));
  out.push(fp([at(MB, -40, -1), at(MB, 40, -1), at(MB, 34, -7), at(MB, -34, -7)], P.bark.sh));
  GROOVES.forEach((g) => out.push(F(rtaper(tp(g), 1.4, 0.5, P.bark.sh2))));
  out.push(...place(MB, [fov(-14, -28, 3, 4, P.bark.sh2), fov(-13.4, -28.6, 1.7, 2.5, P.hole), fov(-15.6, -26.4, 0.8, 1.2, P.bark.hi)]));
  out.push(...place(MM, [[-31, -30, 6], [-33, -21, 4.6], [-30, -11, 5.4]].flatMap(([x, y, r]) => [fov(x, y, r, r * 0.46, P.fungus.base, -0.15), fp([[x - r, y + 0.4], [x + r * 0.6, y + 0.8], [x + r * 0.5, y + r * 0.42], [x - r * 0.7, y + r * 0.36]], P.fungus.sh2), fov(x - r * 0.1, y - r * 0.16, r * 0.62, r * 0.18, P.fungus.hi, -0.15)])));
  out.push(...place(MT, [[-19, -22, 5.2], [-11, -29, 4.6], [13, -29, 4.2], [20, -21, 4.8]].flatMap(([x, y, r]) => rball(x, y, r, r * 0.6, P.moss))));
  out.push(...place(MT, [F(rtaper([[-21, -19], [-21.6, -13], [-20.6, -9]], 1.6, 0.5, P.moss.sh)), F(rtaper([[21, -18], [21.4, -12]], 1.5, 0.5, P.moss.sh))]));

  // The heart: a jagged split glowing at its rim, the heart beating inside, splinters over the
  // edges, and veins of corruption running off it.
  {
    const hc = [3, -12];
    const k = 1 + 0.14 * beat;
    const HR = dead ? P.dim : P.heart;
    const h = [];
    h.push(fp(grow(SPLIT, 1.8), mix(P.bark.sh2, P.heart.base, 0.4 * glow)));
    if (att === 0 || att === 1) h.push(star(hc[0], hc[1], 14 + att * 6, mix(P.heart.base, '#ffffff', 0.35)));
    h.push(fp(grow(SPLIT, 0.6), mix(P.heart.sh2, P.hole, 0.35)), fp(SPLIT, P.hole));
    if (!dead) h.push(fov(hc[0], hc[1] + 1, 6.4, 10, mix(P.hole, P.heart.sh2, 0.5 * glow)));
    h.push(...limb([[hc[0] - 1, hc[1] - 4], [hc[0] - 2, hc[1] - 11], [hc[0] - 0.5, hc[1] - 16]], 2.6, 1.4, HR.sh, HR.sh2));
    h.push(...rball(hc[0], hc[1], 5.2 * k, 6.4 * k, HR), fov(hc[0] - 2.2 * k, hc[1] - 4.2 * k, 2.6 * k, 2.4 * k, HR.base));
    h.push(F(rtaper([[hc[0] - 3, hc[1] - 2], [hc[0], hc[1] + 1], [hc[0] + 1, hc[1] + 5]], 0.8, 0.4, HR.sh2)));
    if (!dead) h.push(fov(hc[0] + 1.6, hc[1] - 1.8, 1.6 * k, 2 * k, beat > 0.5 || att >= 0 ? P.core : HR.hi));
    h.push(fp([[6, -26], [3, -21], [8, -23]], P.bark.hi), fp([[-8, -15], [-3, -14], [-6, -12]], P.bark.base), fp([[10, -3], [5, -2], [8, 1]], P.bark.base));
    VEINS.forEach((v, i) => {
      h.push(F(rtaper(v, 1.9, 0.4, mix(P.bark.sh2, P.vein, 0.25 + 0.75 * glow))));
      if (glow > 0.8 && i < 3) h.push(F(rtaper(v.slice(0, 3), 0.7, 0.2, P.veinHot)));
    });
    out.push(...place(MM, h));
  }

  // The face on the upper trunk: lopsided hollows with amber embers for eyes under heavy bark
  // brows, a knot nose, and a jagged maw of splinters.
  {
    const h = [];
    h.push(fov(-9, -12, 5.6, 5, P.bark.sh2, -0.2), fov(10.5, -12, 6.4, 5.6, P.bark.sh2, 0.15));
    h.push(fov(-9, -11.6, 4.6, 4.1, P.hole, -0.2), fov(10.5, -11.6, 5.4, 4.7, P.hole, 0.15));
    if (dead) h.push(...deadEye(-9, -11.5, 2, { c: '#7d6a86', th: 0.8 }), ...deadEye(10.5, -11.5, 2.4, { c: '#7d6a86', th: 0.8 }));
    else {
      const hot = angry || att >= 0;
      const big = hot ? 1.15 : 1;
      const act = actOf(mood, { idle: { lid: 0.3 }, angry: { lid: 0.12, slant: 0.9, raise: 0.3 } });
      const eo = { shape: 'round', c: hot ? '#ff8a2a' : '#ffb84a', hot: '#fff3b8', bg: P.hole, look: [0.5, 0.15], flick: (f % 4) / 4, ...act, ...(att >= 0 ? { lid: 0.08, slant: 0.9, closed: undefined } : {}) };
      h.push(...glowEye(-9, -11.5, { ...eo, s: -1, w: 2.5 * big, h: 2.2 * big }), ...glowEye(10.5, -11.5, { ...eo, s: 1, w: 3 * big, h: 2.6 * big }));
    }
    // Brows: t > 0 drops the inner ends (a scowl), t < 0 lifts them.
    const t = dead ? -0.6 : att >= 0 ? 1.4 : angry ? 1.6 : hurt ? -1.6 : happy ? -0.6 : 0.7;
    h.push(fp([[-16.5, -17.5 - t * 0.3], [-2.5, -18 + t * 1.8], [-3, -15 + t * 1.8], [-15.5, -14.5 - t * 0.3]], P.bark.sh));
    h.push(fp([[3, -18 + t * 1.8], [18, -18.5 - t * 0.4], [17.5, -15.5 - t * 0.4], [3.5, -15 + t * 1.8]], P.bark.sh));
    h.push(F(rtaper([[-16, -17.6 - t * 0.3], [-3, -18 + t * 1.8]], 1, 0.6, P.bark.hi)), F(rtaper([[3.4, -18 + t * 1.8], [17.6, -18.6 - t * 0.4]], 0.6, 1.1, P.bark.hi)));
    h.push(fov(1.5, -4, 2.4, 3.2, P.bark.sh), fov(2.1, -4.8, 1, 1.4, P.bark.hi));
    // The maw: o is how far it gapes, grin lifts the corners.
    const o = dead ? 0.45 : att >= 0 ? [0.8, 1, 0.9, 0.7, 0.35][att] : angry ? 0.7 : hurt ? 0.55 : happy ? 0.3 : walk ? 0.25 + 0.08 * Math.sin(2 * p) : 0.22;
    const grin = happy ? 2.4 : angry || att >= 0 ? -0.6 : hurt ? -1.4 : 0;
    const gape = 2 + 10 * o;
    const lipY = (u) => 3 - grin * (1 - Math.sin(u * Math.PI));
    const U = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1];
    const mx = (u) => -10 + 24 * u;
    const top = U.map((u, i) => [mx(u), lipY(u) + (i % 2 ? 0.7 : -0.3) * (i && i < 6 ? 1 : 0)]);
    const bot = U.slice(1, -1).map((u, i) => [mx(u), lipY(u) + gape * Math.sin(u * Math.PI) ** 0.7 + (i % 2 ? -0.5 : 0.4)]);
    const maw = [...top, ...bot.reverse()];
    h.push(fp(grow(maw, 0.9), P.bark.sh2), fp(maw, P.hole));
    if (o > 0.4) h.push(fov(2, lipY(0.5) + gape * 0.62, 2 + 4 * o, 1 + 2 * o, mix(P.hole, P.heart.sh2, 0.5 * glow + 0.15)));
    [[0.17, 3.2], [0.42, 2.4], [0.62, 3.6], [0.83, 2.6]].forEach(([u, l]) => {
      const x = mx(u);
      const y = lipY(u);
      const L = Math.min(l, gape * Math.sin(u * Math.PI) * 0.5 + 0.6);
      h.push(fp([[x - 1.2, y - 0.2], [x + 1.2, y - 0.2], [x + 0.2, y + L]], P.tooth.base));
    });
    [[0.3, 2.2], [0.55, 2.8], [0.75, 2]].forEach(([u, l]) => {
      const x = mx(u);
      const y = lipY(u) + gape * Math.sin(u * Math.PI) ** 0.7;
      const L = Math.min(l, gape * 0.4 + 0.4);
      h.push(fp([[x - 1.1, y + 0.2], [x + 1.1, y + 0.2], [x - 0.2, y - L]], P.tooth.sh));
    });
    out.push(...place(MT, h));
  }

  // Near roots over the base, glowing toadstools at its foot, then the near arm.
  GROOTS.filter((r) => !r[4]).forEach((r) => out.push(...root(r)));
  const TS = dead ? P.dim : P.leaf2;
  [[30, 4.2], [113, 3.4]].forEach(([x, r]) => {
    out.push(fp([[x - r * 0.35, floor], [x + r * 0.35, floor], [x + r * 0.25, floor - r * 1.4], [x - r * 0.25, floor - r * 1.4]], '#f3e6dc'));
    out.push(...rball(x, floor - r * 1.5, r, r * 0.62, TS), fov(x - r * 0.3, floor - r * 1.75, r * 0.2, r * 0.14, '#ffffff'));
  });
  out.push(...nearArm.res);

  // Corrupted motes drifting up past the trunk.
  if (!dead) {
    for (let i = 0; i < 3; i++) {
      const u = ((f / (walk ? 8 : 6) + i / 3) % 1);
      out.push(...mote(34 + i * 38 + 3 * Math.sin(u * TAU + i), 120 - u * 70, 1.1 - u * 0.4, i % 2 ? P.vein : P.veinHot));
    }
  }

  // The slam: the floor glows where the arms will land during the held wind-up; on impact the
  // floor bursts into root spikes with a shock ring and flying splinters, held, then sinking back.
  if (att >= 0 && !dead) {
    const lands = att >= 2 ? [nearArm.tip, farArm.tip] : [1, -1].map((s) => armAt(s, slamA(s, 0.06, () => 0), 0.06, () => 0).pts[8]);
    lands.forEach(([lx], si) => {
      if (att < 2) {
        out.push(fp(ringPts(clamp(lx, 14, 136), floor - 1.6, 8 + att * 4, 1.8 + att * 0.6, 1.4), mix(P.vein, '#ffffff', 0.2 + att * 0.25)));
        out.push(...mote(lx + (si ? 4 : -4), floor - 6 - att * 4, 0.9, P.veinHot));
        return;
      }
      const k = [0, 0, 0.2, 0.6, 1][att];
      const grow_ = [0, 0, 1, 0.85, 0.35][att];
      const rx = 8 + k * 14;
      out.push(fp(ringPts(clamp(lx, rx + 2, 148 - rx), floor - 1.6 - k * 1.6, rx, 2 + k * 2.4, 2), mix(P.vein, '#ffffff', 0.45 - k * 0.2)));
      [[-8, 14, -0.2], [1, 19, 0.05], [8, 11, 0.3]].forEach(([ox, hS, tilt]) => {
        const x = clamp(lx + ox * (si ? -1 : 1), 7, 143);
        const hh = hS * grow_;
        if (hh < 1) return;
        const tipP = [x + tilt * hh * (si ? -1 : 1), floor - hh];
        out.push(fp([[x - 2.8, floor], tipP, [x + 2.8, floor]], P.root.sh), fp([tipP, [x + 2.8, floor], [x + 0.6, floor]], P.root.hi));
        out.push(fp([tipP, [tipP[0] - 1, tipP[1] + 3], [tipP[0] + 1, tipP[1] + 3]], P.veinHot));
      });
      for (let i = 0; i < 4; i++) {
        const a = Math.PI * (1.15 + i * 0.23);
        const d = 6 + k * 18;
        const bx = clamp(lx + Math.cos(a) * d, 3, 145);
        const by = floor - 4 + Math.sin(a) * d * 0.8;
        out.push(fp([[bx, by], [bx + 1.6, by + 0.6], [bx + 0.4, by + 1.6]], P.bark.sh));
      }
      if (att === 2) out.push(star(clamp(lx, 12, 138), floor - 8, 11, mix(P.veinHot, '#ffffff', 0.4)), star(clamp(lx, 12, 138), floor - 8, 5.4, '#ffffff'));
    });
  }
  const sq = key(att, [0.02, 0.03, -0.05, -0.03, 0], walk ? -0.012 * Math.cos(2 * p) : 0.006 * br);
  return { w: 150, h: 170, res: 3, shapes: squash(out, 75, floor, 1 - sq * 0.5, 1 + sq) };
}

// ---------- Prismaris, the Crystal King ----------
// A crowned crystal dragon standing upright. Signature: faceted crystal wings and crystal spines
// over a lilac body, a gold crown, and the prism scepter. Crystal is drawn as a transparent gem:
// the facet facing the light is the darkest and the far facet glows, with a glint on the lit
// edge. Rig: hips > torso (pitch) > neck chain > head > jaw and crown; torso > wing roots (arm,
// forearm, four finger spars whose tips trail), the scepter arm (IK to the hand, the scepter
// rides the hand), and the tail chain; two digitigrade IK legs with planted feet. The walk is a
// heavy royal stomp. The attack lifts the scepter overhead and back (held: the prism charges and
// the floor glows where it will land), swings it down into the floor in one arc, and holds the
// crystal burst before settling.

const DK = {
  scale: ramp('#ad9cf0', true),
  far: ramp('#8f7fdc', true),
  belly: ramp('#f1e9ff', true),
  gold: ramp('#ffd36b'),
  ermine: ramp('#fffaf4', true),
  mouth: '#3d2a6b',
  // Crystal tones: [the face toward the light (darkest), body, the far face (glowing), glint].
  ice: ['#5aa6dc', '#9fe3f8', '#dffaff', '#ffffff'],
  rose: ['#c25ba6', '#f2a0d4', '#ffe0f2', '#ffffff'],
  lilac: ['#7d6bd6', '#b9a8ff', '#ece6ff', '#ffffff'],
  mint: ['#3fae8a', '#8cecc6', '#dcfff0', '#ffffff'],
};
const LIGHT = [0.6, -0.8];
const dimK = (K) => K.map((c, i) => (i === 3 ? mix(c, '#c9c0ff', 0.4) : mix(c, '#6a5ab8', 0.28)));

// A crystal shard from (x, y) toward angle a: the facet facing the light darkest, the far facet
// glowing, a glint on the lit edge near the tip.
function prism(x, y, a, len, w, K, glint = true) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const q = (u, v) => [x + c * u - s * v, y + s * u + c * v];
  const lit = -s * LIGHT[0] + c * LIGHT[1] > 0 ? 1 : -1;
  const out = [fp([q(-0.5, -w - 0.5), q(len * 0.62, -w - 0.5), q(len + 0.8, 0), q(len * 0.62, w + 0.5), q(-0.5, w + 0.5)], mix(K[0], '#2a2035', 0.45))];
  out.push(fp([q(0, -w), q(len * 0.62, -w), q(len, 0), q(len * 0.62, w), q(0, w)], K[1]));
  out.push(fp([q(0, lit * w), q(len * 0.62, lit * w), q(len, 0), q(0, lit * w * 0.12)], K[0]));
  out.push(fp([q(len * 0.12, -lit * w * 0.8), q(len * 0.58, -lit * w * 0.8), q(len * 0.86, -lit * w * 0.14), q(len * 0.12, -lit * w * 0.22)], K[2]));
  if (glint) out.push(fp([q(len * 0.5, lit * w * 0.85), q(len * 0.74, lit * w * 0.4), q(len * 0.56, lit * w * 0.38)], K[3]));
  return out;
}
// A round gem: dark toward the light, glowing on the far side, a glint.
const gemDot = (x, y, r, K) => [fov(x, y, r + 0.4, r + 0.4, mix(K[0], '#2a2035', 0.4), 0, 12), fov(x, y, r, r, K[1], 0, 12), fov(x + r * 0.28, y - r * 0.28, r * 0.6, r * 0.55, K[0], 0, 10), fov(x - r * 0.35, y + r * 0.38, r * 0.42, r * 0.34, K[2], 0, 8), fov(x + r * 0.3, y - r * 0.45, Math.max(0.4, r * 0.22), Math.max(0.4, r * 0.22), K[3], 0, 6)];
// A wing pane between spars (A the wrist, B the leading spar tip, C the trailing one).
function pane(A, B, C, K) {
  // A clean cut gem pane: split from the root to the outer edge into two flat facets (the one
  // toward the light darker, the far one glowing), a glowing band inside the outer edge, and one
  // straight glint along the leading edge.
  const m = (U, V, t) => [U[0] + (V[0] - U[0]) * t, U[1] + (V[1] - U[1]) * t];
  const M = m(B, C, 0.45);
  return [
    pg([A, B, C], K[1]),
    fp([A, B, M], mix(K[0], K[1], 0.35)),
    fp([m(A, M, 0.62), M, C, m(A, C, 0.7)], K[2]),
    fp([m(A, B, 0.5), m(A, B, 0.86), m(m(A, B, 0.86), M, 0.12), m(m(A, B, 0.5), M, 0.1)], K[3]),
  ];
}

function dragon(pose, f, mood) {
  const { walk, att, p, it, br, hurt, dead, angry, happy } = timing(pose, f, mood);
  const P = DK;
  const floor = 147;
  let by = 0;
  let pitch = 0.14;
  let headA = 0;
  let neckA = 0;
  let jaw = 0.04;
  let flap = 0;
  if (walk) {
    by = 2.2 * Math.cos(2 * p - 0.5);
    pitch = 0.16 + 0.025 * Math.sin(2 * p - 1);
    headA = -0.04 * Math.sin(2 * p - 1.8);
    flap = 0.08 * Math.sin(2 * p - 1.6);
  } else if (att >= 0) {
    by = [-1.5, -2.5, 4, 3.4, 1][att];
    pitch = [0.02, -0.04, 0.34, 0.3, 0.18][att];
    headA = [-0.2, -0.28, 0.2, 0.16, 0.02][att];
    neckA = [-0.1, -0.14, 0.12, 0.1, 0][att];
    jaw = [0.3, 0.42, 0.5, 0.35, 0.1][att];
    flap = [-0.3, -0.42, 0.25, 0.18, 0.05][att];
  } else {
    by = -0.9 * br;
    pitch = 0.14 + 0.012 * Math.sin(it - 0.6);
    headA = 0.04 * Math.sin(it - 1.4) + (f === 3 ? 0.03 : 0);
    flap = 0.06 * Math.sin(it - 1.9);
  }
  if (angry && att < 0) {
    flap -= 0.3;
    headA += 0.1;
    jaw = 0.4;
    pitch += 0.04;
  }
  if (hurt) {
    pitch -= 0.12;
    headA -= 0.3;
    jaw = 0.25;
    flap += 0.15;
  }
  if (happy && att < 0) headA -= 0.08;
  if (dead) {
    // Collapsed: slumped forward onto its belly, the neck laid along the floor, the wings
    // folded and draped down to the floor behind it, their panes gone dull.
    by = 22;
    pitch = 0.92;
    neckA = 0.3;
    headA = 0.35;
    jaw = 0.3;
  }
  const MB = joint(ID, 62, 110 + by, pitch);
  const out = [];
  const lagW = (k) => (dead ? 0 : walk ? 0.07 * Math.sin(2 * p - 1.6 - k * 0.8) : att >= 0 ? [0.1, 0.12, -0.15, -0.1, 0][att] * (k + 1) * 0.4 : 0.05 * Math.sin(it - 1.9 - k * 0.8));

  // Wings: arm and forearm from the root, four finger spars fanning back from the wrist, crystal
  // panes between them; the far wing sits higher and darker.
  const wing = (root, far) => {
    const a1 = dead ? -2.15 + (far ? 0.3 : 0) : -1.95 + flap + (far ? 0.3 : 0) + pitch * 0.5;
    const E = [root[0] + Math.cos(a1) * 18, root[1] + Math.sin(a1) * 18];
    const a2 = dead ? a1 - 1.25 : a1 + 0.5 + lagW(0) * 0.6 + flap * 0.3;
    const W = [E[0] + Math.cos(a2) * 18, E[1] + Math.sin(a2) * 18];
    const tips = (dead ? [-0.15, -0.55, -0.95, -1.35] : [-0.95, -1.5, -2.1, -2.6]).map((d, k) => {
      const a = a2 + d + lagW(k + 1);
      const l = [26, 30, 30, 26][k];
      return [clamp(W[0] + Math.cos(a) * l, 3, 147), clamp(W[1] + Math.sin(a) * l, 3, floor - 2)];
    });
    const dull = (K) => (dead ? K.map((c) => mix(c, '#a99fc6', 0.45)) : K);
    const KS = (far ? [dimK(P.lilac), dimK(P.ice), dimK(P.rose)] : [P.lilac, P.ice, P.rose]).map(dull);
    const R = far ? P.far : P.scale;
    const res = [];
    res.push(...pane(W, tips[0], tips[1], KS[0]), ...pane(W, tips[1], tips[2], KS[1]), ...pane(W, tips[2], tips[3], KS[2]), ...pane(W, tips[3], root, KS[0]));
    tips.forEach((t) => res.push(...limb([W, t], 2.4, 0.8, R.sh)));
    res.push(...limbR([root, E, W], 5, 3.4, R), ...rball(W[0], W[1], 2.6, 2.6, P.gold), ...rball(E[0], E[1], 2.2, 2.2, P.gold));
    return res;
  };
  out.push(...wing(at(MB, 2, -35), true));
  out.push(...wing(at(MB, -4, -32), false));

  // The tail: a chain that sweeps down to the floor and curls up, crystal spines along its top,
  // a shard cluster at the tip.
  {
    const t0 = at(MB, -10, 6);
    const tw = (k) => (dead ? 0 : walk ? 0.07 * Math.sin(2 * p - 2 - k * 0.7) : att >= 0 ? [-0.05, -0.08, 0.1, 0.06, 0][att] : 0.06 * Math.sin(it - 2.2 - k * 0.7));
    const { pts, a } = chainPts(t0[0], t0[1], Math.PI - 0.9 - pitch * 0.4, 6, (k) => [9, 8, 7, 6, 5.5, 5][k], (k) => (k ? 0.13 : 0) + tw(k));
    pts.forEach((q, i) => {
      q[1] = Math.min(q[1], floor - 1.5 - (13 - (10 * i) / 6) / 2);
      q[0] = Math.max(q[0], 8);
    });
    const sp = [];
    [1, 2, 3, 4].forEach((i, k) => {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const sa = Math.atan2(y1 - y0, x1 - x0);
      const up = Math.sin(sa + Math.PI / 2) < 0 ? sa + Math.PI / 2 : sa - Math.PI / 2;
      const hw = [5.4, 4.6, 3.8, 3][k];
      sp.push(...prism(x0 + Math.cos(up) * hw * 0.7, y0 + Math.sin(up) * hw * 0.7, up + (sa > Math.PI / 2 || sa < -Math.PI / 2 ? -0.45 : 0.45), [8, 7, 6, 5][k], [2.4, 2.2, 1.9, 1.6][k], k % 2 ? P.ice : P.rose, k < 2));
    });
    out.push(...sp, ...limbR(pts, 13, 3, P.scale));
    [[-0.55, 8, P.ice], [0.5, 7, P.rose], [-0.02, 10, P.lilac]].forEach(([d, l, K]) => out.push(...prism(pts[6][0], pts[6][1], clamp(a + d - 0.3, Math.PI * 0.75, Math.PI * 1.5), l, 2.3, K)));
  }

  // Legs: digitigrade, the knee forward and the hock back; the feet plant (walk: a heavy stomp).
  const leg = (sx, sy, home, q, R) => {
    const Hp = at(MB, sx, sy);
    const [ox, lift] = walk && !dead ? footStep(p + q, 7, 7) : [0, 0];
    const ft = [home + ox, floor - lift];
    const [K, A] = ik(Hp, [ft[0] - 6, ft[1] - 8], 17, 15, 1);
    const res = [...rball(Hp[0], Hp[1], 9, 11, R), ...limbR([Hp, K], 11, 8, R), ...limbR([K, A], 7, 5, R)];
    res.push(pg([[A[0] - 3.4, A[1] - 2], [A[0] + 3, A[1] - 3], [ft[0] + 5, ft[1] - 3.6], [ft[0] + 6.6, ft[1]], [A[0] - 4, ft[1]]], R.base), fp([[A[0] - 4, ft[1] - 1.4], [ft[0] + 6.6, ft[1] - 1.4], [ft[0] + 6.6, ft[1]], [A[0] - 4, ft[1]]], R.sh2));
    res.push(...prism(ft[0] + 5.6, ft[1] - 1.8, 0.35, 4.4, 1.3, P.ice, false), ...prism(ft[0] + 1.6, ft[1] - 1.6, 0.45, 3.6, 1.1, P.ice, false));
    return res;
  };
  out.push(...leg(-4, 2, 56, Math.PI, P.far));

  // Crystal spines down the back (behind the torso's edge), and the far arm tucked at the chest.
  const NB = at(MB, 10, -38);
  const nk = chainPts(NB[0], NB[1], -Math.PI / 2 + 0.55 + pitch + neckA, 3, 8, (i) => (dead ? 0.3 : -0.15) + (walk ? -0.03 * Math.sin(2 * p - 1.2 - i) : 0));
  {
    const back = -Math.PI / 2 - 0.75 + pitch;
    out.push(...prism(...at(MB, -12, -20), back - 0.15, 9, 2.6, P.ice), ...prism(...at(MB, -7, -30), back, 9, 2.6, P.rose));
    [1, 2].forEach((i) => out.push(...prism(nk.pts[i][0] - 2.4, nk.pts[i][1] - 1.4, back + 0.35 + i * 0.15 + (dead ? 0.5 : 0), 7 - i, 2.1, i % 2 ? P.ice : P.lilac, false)));
    const Sf = at(MB, 4, -30);
    const hf = [Sf[0] + 16, Sf[1] + 8];
    out.push(...limbR([Sf, [Sf[0] + 7, Sf[1] + 9], hf], 5, 3.6, P.far), ...rball(hf[0], hf[1], 2.6, 2.4, P.far));
  }

  // The torso: base, the back and underside in shadow, the belly plate with its scute lines, a
  // lit chest edge, and a gold pendant with a heart gem.
  out.push(
    ...place(MB, [
      C(pg([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [7, -41], [15, -36], [18, -22], [17, -6], [11, 8], [-2, 13]], P.scale.base)),
      fp([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [-1, -33], [-8, -21], [-11, -6], [-7, 10]], P.scale.sh),
      fp([[-7, 10], [-2, 13], [11, 8], [8, 5], [-2, 8]], P.scale.sh),
      pg([[7, -36], [14, -32], [16, -20], [14, -4], [8, 8], [2, 8], [7, -6], [9, -20], [4, -33]], P.belly.base),
      fp([[2, 8], [7, -6], [9, -20], [4, -33], [6, -34], [11, -20], [10, -6], [6, 8]], P.belly.sh),
      ...[[-18, 9.6, 15], [-10, 9.4, 15.4], [-2, 8.4, 14.4]].map(([y, x0, x1]) => F(rtaper([[x0, y], [x1, y + 1]], 0.7, 0.7, P.belly.sh))),
      fp([[7, -39], [13, -36], [12, -33], [6, -35]], P.scale.hi),
      pg([[7, -31], [15, -31], [15, -26], [11, -22], [7, -26]], P.gold.base),
      fp([[7, -27.5], [11, -24.5], [11, -22], [7, -26]], P.gold.sh),
      ...gemDot(11, -27.4, 2.3, P.rose),
    ]),
  );
  out.push(...leg(4, 4, 72, 0, P.scale));

  // The ermine collar around the neck's base: fluffy puffs with dark tail tips.
  out.push(
    ...place(MB, [
      ...[[-2, -34], [2, -37.5], [7, -39.5], [12, -39], [16.5, -36.5]].flatMap(([x, y]) => [fov(x - 0.5, y + 0.6, 3.4, 3, P.ermine.sh, 0, 12), fov(x + 0.3, y - 0.3, 2.9, 2.5, P.ermine.base, 0, 12)]),
      fov(4.6, -36, 0.9, 1.4, P.mouth, 0, 8),
      fov(14.4, -35.6, 0.9, 1.4, P.mouth, 0, 8),
    ]),
  );

  // Neck and head.
  {
    out.push(...limbR(nk.pts, 11, 8.4, P.scale), F(rtaper(nk.pts.map(([x, y]) => [x + 2.6, y + 0.6]), 4, 3, P.belly.base)));
    const top = nk.pts[3];
    const MH = joint(ID, top[0], top[1], headA + pitch * 0.3);
    const MJ = joint(MH, 2, 3, jaw);
    const h = [];
    h.push(...prism(-1, -8, -Math.PI + 0.55, 13, 2.3, dimK(P.ice)));
    h.push(...prism(-4, 2.4, Math.PI - 0.15, 8, 2, P.rose, false), ...prism(-4, 4, Math.PI + 0.35 - jaw, 6.5, 1.8, P.rose, false));
    out.push(...place(MH, h));
    out.push(fp([at(MH, 1, 3), at(MH, 22, 4), at(MJ, 20, 0), at(MJ, 0, 0)], P.mouth));
    out.push(...place(MJ, [pg([[-3, -1], [20, 0], [23, 2], [12, 6], [-2, 5]], P.scale.sh), fp([[0, 2], [18, 1.6], [12, 4.6], [0, 4]], P.belly.sh), fp([[15, -0.2], [17, -0.2], [16.2, -2.6]], '#fffaf2')]));
    const s = [];
    s.push(C(pg([[-7, -2], [-3, -9], [6, -12], [16, -9], [24, -5], [29, -2], [29, 2], [22, 4.5], [8, 5], [-3, 6]], P.scale.base)));
    s.push(fp([[-7, -2], [-3, -9], [0, -9.6], [-3, 4], [-3, 6]], P.scale.sh), fp([[-3, 6], [8, 5], [22, 4.5], [29, 2], [27, 3.2], [21, 3], [8, 3.4], [-3, 3.6]], P.scale.sh));
    s.push(fp([[14, -9.4], [24, -5.2], [22.4, -4.2], [14, -7.8]], P.scale.hi), fov(26.4, -2.4, 0.9, 0.6, P.scale.sh2, 0, 8));
    s.push(fp([[19, 4.3], [21, 4.3], [20.2, 6.6 + jaw * 4]], '#fffaf2'), fp([[13, 4.8], [14.6, 4.8], [13.8, 6.4 + jaw * 3]], '#fffaf2'));
    // The eye: a slit-pupilled dragon eye under a scaled brow ridge.
    if (dead) s.push(...deadEye(12, -4, 2.2, { c: '#7a6aa8', th: 0.8 }));
    else {
      const act = actOf(mood, { idle: { lid: 0.28 }, angry: { lid: 0.1, slant: 0.9, raise: 0.3 }, happy: { closed: 'happy' } });
      s.push(...eye(12, -4, { shape: 'sharp', custom: { animal: true }, s: 1, w: 3.4, h: 2.5, iris: ['#2c6fb8', '#46ddff', '#d4fbff'], pupil: 'slit', pupilK: att >= 0 || angry ? 0.7 : 1, look: [0.6, 0.1], lashC: '#3a2a6b', ...act, ...(att >= 0 ? { lid: 0.06, slant: 0.7, raise: 0.2, closed: undefined } : {}) }));
    }
    s.push(...brow(11.6, -7.6, { s: 1, len: 4, angle: angry || att >= 0 ? 24 : hurt ? -22 : happy ? -6 : 6, th: 1.2, c: P.scale.sh2, shape: 'flat', arch: 0.1 }));
    s.push(...prism(1, -8, -Math.PI + 0.78 + (hurt ? 0.12 : 0), 15, 2.8, P.ice));
    out.push(...place(MH, s));
    // The crown rides the head (knocked askew when hurt; fallen to the floor when defeated).
    const crown = [pg([[-6, 1.2], [6, 1.2], [6.4, 3.8], [-6.4, 3.8]], P.gold.base), fp([[-6.4, 2.8], [6.4, 2.8], [6.4, 3.8], [-6.4, 3.8]], P.gold.sh)];
    [[-5, 5], [0, 7], [5, 5]].forEach(([x, hgt]) => crown.push(pg([[x - 2, 1.4], [x, 1.4 - hgt], [x + 2, 1.4]], P.gold.base), fp([[x, 1.4 - hgt], [x + 2, 1.4], [x + 0.6, 1.4]], P.gold.sh)));
    crown.push(fp([[-1.4, 0.4 - 6], [0.2, -7], [0.4, 1]], P.gold.hi));
    crown.push(...gemDot(-5, -3.4, 1.1, P.ice), ...gemDot(5, -3.4, 1.1, P.mint), ...gemDot(0, 2.4, 1.3, P.rose));
    const MC = dead ? joint(ID, 124, floor - 4, 0.5) : joint(MH, 5, -11.6, hurt ? -0.35 : -0.08);
    out.push(...place(MC, crown));
  }

  // The scepter arm: the hand is placed by IK; the scepter rides the hand. Resting it stands
  // tall; the slam winds it overhead and back, then swings it down into the floor.
  {
    const S = at(MB, 12, -29);
    let tgt = [S[0] + 13, S[1] + 13 + (walk ? Math.sin(2 * p - 1) : 0)];
    let ang = -Math.PI / 2 + 0.12 + (walk ? 0.04 * Math.sin(2 * p - 1.4) : 0.02 * Math.sin(it - 1));
    if (dead) {
      tgt = [S[0] + 8, S[1] + 22];
      ang = 0;
    } else if (att >= 0) {
      tgt = [[S[0] - 2, S[1] - 24], [S[0] - 9, S[1] - 25], [S[0] + 26, S[1] + 24], [S[0] + 25, S[1] + 23], [S[0] + 18, S[1] + 14]][att];
      ang = [-Math.PI / 2 - 0.45, -Math.PI / 2 - 0.95, 1.2, 1.18, -Math.PI / 2 + 0.5][att];
    } else if (angry) ang += 0.3;
    if (hurt && att < 0) ang -= 0.3;
    const [El, Hd] = ik(S, tgt, 14, 14, -1);
    const sc = [];
    const d = [Math.cos(ang), Math.sin(ang)];
    const base = dead ? [96, floor - 2] : Hd;
    const dd = dead ? [1, 0] : d;
    const topP = [base[0] + dd[0] * 30, base[1] + dd[1] * 30];
    const pom = [base[0] - dd[0] * 10, base[1] - dd[1] * 10];
    if (att === 2) sc.push(...rswoosh(S[0], S[1], 52, -120, 52, 7, P.ice[1], '#ffffff'));
    sc.push(...limb([pom, topP], 2.4, 2.2, P.gold.base, P.gold.sh2), F(rtaper([[pom[0] + 0.6, pom[1] - 0.6], [topP[0] + 0.6, topP[1] - 0.6]], 0.7, 0.7, P.gold.hi)));
    sc.push(...rball(pom[0], pom[1], 2.4, 2.4, P.gold));
    const nx = -dd[1];
    const ny = dd[0];
    [-1, 1].forEach((k) => sc.push(F(rtaper([[topP[0] - dd[0] * 3, topP[1] - dd[1] * 3], [topP[0] + nx * k * 3.4, topP[1] + ny * k * 3.4], [topP[0] + dd[0] * 4 + nx * k * 3, topP[1] + dd[1] * 4 + ny * k * 3]], 1.4, 0.6, P.gold.sh))));
    const charge = att === 0 || att === 1;
    if (charge) sc.push(star(topP[0] + dd[0] * 6, topP[1] + dd[1] * 6, 7 + att * 4, mix(P.ice[2], '#ffffff', 0.3)));
    sc.push(...prism(topP[0] - dd[0], topP[1] - dd[1], Math.atan2(dd[1], dd[0]), 12, 4, P.ice));
    if (!dead) {
      out.push(...limbR([S, El], 6, 5, P.scale), ...limbR([El, Hd], 5, 4, P.scale));
      out.push(...sc);
      out.push(...rball(Hd[0], Hd[1], 3.4, 3.2, P.scale), F(rtaper([[Hd[0] - 1.4, Hd[1] - 2], [Hd[0] + 2.4, Hd[1] + 0.4]], 0.8, 0.6, P.scale.sh2)));
    } else {
      out.push(...sc, ...limbR([S, El], 6, 5, P.scale), ...limbR([El, Hd], 5, 4, P.scale), ...rball(Hd[0], Hd[1], 3.4, 3.2, P.scale));
    }
  }

  // The slam: a floor glow under the charging prism, then the crystal burst where it strikes,
  // shards erupting from the floor and shrinking back as the flash fades.
  const impX = 118;
  if (!dead && att >= 0) {
    if (att < 2) out.push(fp(ringPts(impX, floor - 1.6, 9 + att * 5, 1.8 + att * 0.6, 1.4), mix(P.ice[1], '#ffffff', 0.25 + att * 0.25)));
    else {
      const k = [0, 0, 0.2, 0.6, 1][att];
      const g = [0, 0, 1, 0.85, 0.4][att];
      const rx = Math.min(8 + k * 22, 28);
      out.push(fp(ringPts(Math.min(impX, 148 - rx), floor - 1.6 - k * 1.4, rx, 2 + k * 2.6, 2), mix(P.ice[1], '#ffffff', 0.45 - k * 0.2)));
      [[-20, -0.5, 12, P.ice], [-11, -0.25, 18, P.lilac], [-3, 0, 22, P.ice], [8, 0.2, 16, P.rose], [16, 0.45, 10, P.ice]].forEach(([ox, a, l, K]) => {
        if (l * g < 2) return;
        out.push(...prism(impX + ox, floor + 0.5, -Math.PI / 2 + a, l * g, 2.4 + l * 0.08, K));
      });
      if (att === 2) out.push(star(impX, floor - 8, 14, P.ice[2]), star(impX, floor - 8, 6.4, '#ffffff'));
      for (let i = 0; i < 3; i++) out.push(star(impX - 16 + i * 14, floor - 14 - k * 16 - (i % 2) * 6, 1.6 + (1 - k) * 1.2, i % 2 ? '#ffffff' : P.ice[2]));
    }
  }
  // A glint drifting off the wings at rest.
  if (!dead && att < 0) {
    const u = (f % (walk ? 8 : 6)) / (walk ? 8 : 6);
    out.push(star(30 + u * 20, 40 - u * 12, 1.4 + Math.sin(u * Math.PI) * 1.4, '#ffffff'));
  }
  const sq = key(att, [0.012, -0.004, -0.03, -0.015, 0], walk ? -Math.max(0, Math.cos(2 * p - 0.5)) * 0.015 : 0.006 * br);
  return { w: 150, h: 150, res: 3, shapes: squash(out, 70, floor, 1 - sq * 0.5, 1 + sq) };
}

// ---------- Prismaris, the Crystal King, rigged ----------
// (2026-11-03, the boss reanimation.) A live skeleton (render/mobs/rig.js) on the same bones as his
// frames: crystal wings that beat and fold back on springs, a six-segment tail with crystal spines
// that sways a beat behind, digitigrade legs whose feet stay planted (two-bone reach, live), a
// three-segment neck carrying his head, a jaw that drops open, a crown that wobbles, and his
// scepter arm, also reaching live, winding the scepter overhead and smashing it down so crystals
// erupt from the floor. Rig space: the floor at (0, 0), his hips' joint above it.
const DKP = (key, w, h, ox, oy, shapes) => part(`crystal|${key}`, w, h, () => place(joint(ID, ox, oy), shapes()));
const dragonWing = (far) => {
  const P = DK;
  const a1 = -1.95 + (far ? 0.3 : 0);
  const E = [Math.cos(a1) * 18, Math.sin(a1) * 18];
  const a2 = a1 + 0.5;
  const W = [E[0] + Math.cos(a2) * 18, E[1] + Math.sin(a2) * 18];
  const tips = [-0.95, -1.5, -2.1, -2.6].map((d, k) => {
    const a = a2 + d;
    const l = [26, 30, 30, 26][k];
    return [W[0] + Math.cos(a) * l, W[1] + Math.sin(a) * l];
  });
  const KS = far ? [dimK(P.lilac), dimK(P.ice), dimK(P.rose)] : [P.lilac, P.ice, P.rose];
  const R = far ? P.far : P.scale;
  const root = [0, 0];
  const res = [...pane(W, tips[0], tips[1], KS[0]), ...pane(W, tips[1], tips[2], KS[1]), ...pane(W, tips[2], tips[3], KS[2]), ...pane(W, tips[3], root, KS[0])];
  tips.forEach((t) => res.push(...limb([W, t], 2.4, 0.8, R.sh)));
  res.push(...limbR([root, E, W], 5, 3.4, R), ...rball(W[0], W[1], 2.6, 2.6, P.gold), ...rball(E[0], E[1], 2.2, 2.2, P.gold));
  return res;
};
const CK = {
  wing: (far) => DKP(`wing|${far}`, 72, 84, 58, 74, () => dragonWing(far)),
  tailSeg: (i, len, w0, w1) => DKP(`tail|${i}`, len + w0 + 14, w0 + 22, w0 / 2 + 2, w0 / 2 + 14, () => {
    const out = [];
    if (i >= 1 && i <= 4) out.push(...prism(len * 0.2, 4 + w0 * 0.35, Math.PI / 2 - 0.45, [8, 7, 6, 5][i - 1], [2.4, 2.2, 1.9, 1.6][i - 1], i % 2 ? DK.rose : DK.ice, i < 3));
    out.push(...limbR([[0, 0], [len, 0]], w0, w1, DK.scale));
    return out;
  }),
  tailTip: () => DKP('tailtip', 30, 30, 4, 15, () => [[-0.55, 8, DK.ice], [0.5, 7, DK.rose], [-0.02, 10, DK.lilac]].flatMap(([d, l, K]) => prism(0, 0, d, l, 2.3, K))),
  thigh: (far) => DKP(`thigh|${far}`, 34, 26, 11, 13, () => {
    const R = far ? DK.far : DK.scale;
    return [...rball(0, 0, 9, 11, R), ...limbR([[0, 0], [17, 0]], 11, 8, R)];
  }),
  shin: (far) => DKP(`shin|${far}`, 26, 14, 5, 7, () => [...limbR([[0, 0], [15, 0]], 7, 5, far ? DK.far : DK.scale)]),
  // The foot, level, from the ankle at its origin; the toe on the floor 8 px below.
  foot: (far) => DKP(`foot|${far}`, 24, 16, 6, 4, () => {
    const R = far ? DK.far : DK.scale;
    return [pg([[-3.4, -2], [3, -3], [11, 4.4], [12.6, 8], [-4, 8]], R.base), fp([[-4, 6.6], [12.6, 6.6], [12.6, 8], [-4, 8]], R.sh2), ...prism(11.6, 6.2, 0.35, 4.4, 1.3, DK.ice, false), ...prism(7.6, 6.4, 0.45, 3.6, 1.1, DK.ice, false)];
  }),
  // The far arm tucked at his chest and the crystal spines down his back (behind the torso).
  back: () => DKP('back', 50, 50, 24, 44, () => {
    const backA = -Math.PI / 2 - 0.75;
    const Sf = [4, -30];
    const hf = [Sf[0] + 16, Sf[1] + 8];
    return [...prism(-12, -20, backA - 0.15, 9, 2.6, DK.ice), ...prism(-7, -30, backA, 9, 2.6, DK.rose), ...limbR([Sf, [Sf[0] + 7, Sf[1] + 9], hf], 5, 3.6, DK.far), ...rball(hf[0], hf[1], 2.6, 2.4, DK.far)];
  }),
  torso: () => DKP('torso', 44, 62, 21, 46, () => [
    C(pg([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [7, -41], [15, -36], [18, -22], [17, -6], [11, 8], [-2, 13]], DK.scale.base)),
    fp([[-15, 8], [-17, -6], [-13, -22], [-5, -34], [-1, -33], [-8, -21], [-11, -6], [-7, 10]], DK.scale.sh),
    fp([[-7, 10], [-2, 13], [11, 8], [8, 5], [-2, 8]], DK.scale.sh),
    pg([[7, -36], [14, -32], [16, -20], [14, -4], [8, 8], [2, 8], [7, -6], [9, -20], [4, -33]], DK.belly.base),
    fp([[2, 8], [7, -6], [9, -20], [4, -33], [6, -34], [11, -20], [10, -6], [6, 8]], DK.belly.sh),
    ...[[-18, 9.6, 15], [-10, 9.4, 15.4], [-2, 8.4, 14.4]].map(([y, x0, x1]) => F(rtaper([[x0, y], [x1, y + 1]], 0.7, 0.7, DK.belly.sh))),
    fp([[7, -39], [13, -36], [12, -33], [6, -35]], DK.scale.hi),
    pg([[7, -31], [15, -31], [15, -26], [11, -22], [7, -26]], DK.gold.base),
    fp([[7, -27.5], [11, -24.5], [11, -22], [7, -26]], DK.gold.sh),
    ...gemDot(11, -27.4, 2.3, DK.rose),
    ...[[-2, -34], [2, -37.5], [7, -39.5], [12, -39], [16.5, -36.5]].flatMap(([x, y]) => [fov(x - 0.5, y + 0.6, 3.4, 3, DK.ermine.sh, 0, 12), fov(x + 0.3, y - 0.3, 2.9, 2.5, DK.ermine.base, 0, 12)]),
    fov(4.6, -36, 0.9, 1.4, DK.mouth, 0, 8),
    fov(14.4, -35.6, 0.9, 1.4, DK.mouth, 0, 8),
  ]),
  neckSeg: (i, len, w0, w1) => DKP(`neck|${i}`, len + w0 + 4, w0 + 4, w0 / 2 + 2, w0 / 2 + 2, () => [...limbR([[0, 0], [len, 0]], w0, w1, DK.scale), F(rtaper([[0, w0 * 0.24], [len, w1 * 0.24]], 4, 3, DK.belly.base))]),
  headBack: () => DKP('headback', 34, 30, 26, 18, () => [...prism(-1, -8, -Math.PI + 0.55, 13, 2.3, dimK(DK.ice)), ...prism(-4, 2.4, Math.PI - 0.15, 8, 2, DK.rose, false), ...prism(-4, 4, Math.PI + 0.35, 6.5, 1.8, DK.rose, false)]),
  // The jaw from its hinge, with the mouth's dark inside above it (shown as it drops open).
  jaw: () => DKP('jaw', 30, 16, 5, 8, () => [fp([[0, -5], [21, -4], [20, 0], [0, 0]], DK.mouth), pg([[-3, -1], [20, 0], [23, 2], [12, 6], [-2, 5]], DK.scale.sh), fp([[0, 2], [18, 1.6], [12, 4.6], [0, 4]], DK.belly.sh), fp([[15, -0.2], [17, -0.2], [16.2, -2.6]], '#fffaf2')]),
  head: (mood, atk) => DKP(`head|${mood}|${atk}`, 50, 38, 14, 26, () => {
    const out = [];
    const angry = mood === 'angry' || atk;
    out.push(C(pg([[-7, -2], [-3, -9], [6, -12], [16, -9], [24, -5], [29, -2], [29, 2], [22, 4.5], [8, 5], [-3, 6]], DK.scale.base)));
    out.push(fp([[-7, -2], [-3, -9], [0, -9.6], [-3, 4], [-3, 6]], DK.scale.sh), fp([[-3, 6], [8, 5], [22, 4.5], [29, 2], [27, 3.2], [21, 3], [8, 3.4], [-3, 3.6]], DK.scale.sh));
    out.push(fp([[14, -9.4], [24, -5.2], [22.4, -4.2], [14, -7.8]], DK.scale.hi), fov(26.4, -2.4, 0.9, 0.6, DK.scale.sh2, 0, 8));
    out.push(fp([[19, 4.3], [21, 4.3], [20.2, 6.8]], '#fffaf2'), fp([[13, 4.8], [14.6, 4.8], [13.8, 6.6]], '#fffaf2'));
    if (mood === 'dead') out.push(...deadEye(12, -4, 2.2, { c: '#7a6aa8', th: 0.8 }));
    else {
      const act = actOf(mood, { idle: { lid: 0.28 }, angry: { lid: 0.1, slant: 0.9, raise: 0.3 }, happy: { closed: 'happy' } });
      out.push(...eye(12, -4, { shape: 'sharp', custom: { animal: true }, s: 1, w: 3.4, h: 2.5, iris: ['#2c6fb8', '#46ddff', '#d4fbff'], pupil: 'slit', pupilK: angry ? 0.7 : 1, look: [0.6, 0.1], lashC: '#3a2a6b', ...act, ...(atk ? { lid: 0.06, slant: 0.7, raise: 0.2, closed: undefined } : {}) }));
    }
    out.push(...brow(11.6, -7.6, { s: 1, len: 4, angle: angry ? 24 : mood === 'hurt' ? -22 : mood === 'happy' ? -6 : 6, th: 1.2, c: DK.scale.sh2, shape: 'flat', arch: 0.1 }));
    out.push(...prism(1, -8, -Math.PI + 0.78, 15, 2.8, DK.ice));
    return out;
  }),
  crown: () => DKP('crown', 18, 16, 8, 10, () => {
    const crown = [pg([[-6, 1.2], [6, 1.2], [6.4, 3.8], [-6.4, 3.8]], DK.gold.base), fp([[-6.4, 2.8], [6.4, 2.8], [6.4, 3.8], [-6.4, 3.8]], DK.gold.sh)];
    [[-5, 5], [0, 7], [5, 5]].forEach(([x, hgt]) => crown.push(pg([[x - 2, 1.4], [x, 1.4 - hgt], [x + 2, 1.4]], DK.gold.base), fp([[x, 1.4 - hgt], [x + 2, 1.4], [x + 0.6, 1.4]], DK.gold.sh)));
    crown.push(...gemDot(-5, -3.4, 1.1, DK.ice), ...gemDot(5, -3.4, 1.1, DK.mint), ...gemDot(0, 2.4, 1.3, DK.rose));
    return crown;
  }),
  upper: () => DKP('upper', 22, 12, 4, 6, () => [...limbR([[0, 0], [14, 0]], 6, 5, DK.scale)]),
  fore: () => DKP('fore', 22, 12, 4, 6, () => [...limbR([[0, 0], [14, 0]], 5, 4, DK.scale), ...rball(14, 0, 3.4, 3.2, DK.scale)]),
  // The scepter along +x from the grip: the gold pom behind, the crystal-topped head ahead.
  scepter: () => DKP('scepter', 64, 18, 14, 9, () => {
    const out = [...limb([[-10, 0], [30, 0]], 2.4, 2.2, DK.gold.base, DK.gold.sh2), ...rball(-10, 0, 2.4, 2.4, DK.gold)];
    [-1, 1].forEach((k) => out.push(F(rtaper([[27, 0], [30, k * 3.4], [34, k * 3]], 1.4, 0.6, DK.gold.sh))));
    out.push(...prism(29, 0, 0, 12, 4, DK.ice));
    return out;
  }),
};
const CK_SHOULDER = [12, -29];
const CK_HIPS = [[-4, 2, -6], [4, 4, 10]];
const crystalRig = makeRig({
  w: 100,
  h: 130,
  stride: 1e9,
  fast: ['by', 'pitch', 'headA', 'neckA', 'jaw', 'sc', 'up', 'fo'],
  kick: { pitch: -1.4, crown: 4, flapF: 3 },
  springs: { crown: [80, 5], flapF: [70, 5], flapN: [80, 6], t0: [120, 9], t1: [100, 8], t2: [85, 7], t3: [70, 6], t4: [60, 5], t5: [50, 4.5] },
  pose(m, a) {
    const t = a.t;
    const wp = t * 4.2;
    const idle = { by: -0.9 * Math.sin(t * 2), pitch: 0.14 + 0.012 * Math.sin(t * 1.2 - 0.6), headA: 0.04 * Math.sin(t * 1.2 - 1.4), neckA: 0, jaw: 0.04, flap: 0.06 * Math.sin(t * 1.2 - 1.9), arm: 0, stepA: 0 };
    const walk = { by: 2.2 * Math.cos(2 * wp - 0.5), pitch: 0.16 + 0.025 * Math.sin(2 * wp - 1), headA: -0.04 * Math.sin(2 * wp - 1.8), neckA: 0, jaw: 0.04, flap: 0.08 * Math.sin(2 * wp - 1.6), arm: 0, stepA: 1 };
    const antic = { by: -2.5, pitch: -0.04, headA: -0.28, neckA: -0.14, jaw: 0.42, flap: -0.42, arm: -1, stepA: 0 };
    const strike = { by: 4, pitch: 0.34, headA: 0.2, neckA: 0.12, jaw: 0.5, flap: 0.25, arm: 1, stepA: 0 };
    const P = stateBlend(a, idle, walk, antic, strike);
    // The legs and the scepter arm reach live (two-bone), for where the body is now.
    const c = Math.cos(P.pitch);
    const sn = Math.sin(P.pitch);
    const bodyY = -37 + P.by;
    const toWorld = ([x, y]) => [x * c - y * sn, bodyY + x * sn + y * c];
    const toBody = ([x, y]) => {
      const dy = y - bodyY;
      return [x * c + dy * sn, -x * sn + dy * c];
    };
    CK_HIPS.forEach(([hx, hy, home], k) => {
      const ph = wp + (k ? 0 : Math.PI);
      const ox = P.stepA * Math.sin(ph) * 7;
      const lift = P.stepA * Math.max(0, Math.cos(ph)) * 7;
      const hip = toWorld([hx, hy]);
      const [kn, an] = ik(hip, [home + ox - 6, -8 - lift], 17, 15, 1);
      const th = Math.atan2(kn[1] - hip[1], kn[0] - hip[0]);
      const sh = Math.atan2(an[1] - kn[1], an[0] - kn[0]);
      P[`th${k}`] = th - P.pitch;
      P[`sh${k}`] = sh - th;
      P[`ft${k}`] = -sh;
    });
    // The scepter hand's target from the shoulder, and the scepter's own angle, by the arm's state.
    const k = P.arm;
    const tgt = k < 0 ? [lerp(13, -9, -k), lerp(13, -25, -k)] : [lerp(13, 26, k), lerp(13, 24, k)];
    const S = CK_SHOULDER;
    const [El, Hd] = ik(S, [S[0] + tgt[0], S[1] + tgt[1]], 14, 14, -1);
    P.up = Math.atan2(El[1] - S[1], El[0] - S[0]);
    P.fo = Math.atan2(Hd[1] - El[1], Hd[0] - El[0]) - P.up;
    P.sc = k < 0 ? lerp(-Math.PI / 2 + 0.12, -Math.PI / 2 - 0.95, -k) : lerp(-Math.PI / 2 + 0.12, 1.2, k);
    P.sc -= P.up + P.fo;
    return P;
  },
  follow: (S, a) => {
    const tw = (k) => 0.06 * Math.sin(a.t * 1.2 - 2.2 - k * 0.7) - S.pitch * 0.2;
    return { flapF: S.flap + 0.06 * Math.sin(a.t * 1.2 - 2.4), flapN: S.flap, crown: -0.08 - S.headA * 0.6, t0: Math.PI - 0.9 - S.pitch * 1.4, t1: 0.13 + tw(1), t2: 0.13 + tw(2), t3: 0.13 + tw(3), t4: 0.13 + tw(4), t5: 0.13 + tw(5) };
  },
  parts: [
    { name: 'body', at: (S) => [0, -37 + S.by], rot: (S) => S.pitch },
    { name: 'wingF', parent: 'body', pivot: [58, 74], at: () => [2, -35], rot: (S) => S.flapF, s: () => CK.wing(true) },
    ...chainParts('t', { parent: 'body', at: () => [-10, 6], key: 'crystal|tail', segs: [9, 8, 7, 6, 5.5, 5].map((l, i) => [l, 13 - (10 * i) / 6, 13 - (10 * (i + 1)) / 6]), rot: (S, a, i) => S[`t${i}`] }).map((p, i) => {
      const len = [9, 8, 7, 6, 5.5, 5][i];
      const w0 = 13 - (10 * i) / 6;
      const w1 = 13 - (10 * (i + 1)) / 6;
      return { ...p, pivot: [w0 / 2 + 2, w0 / 2 + 14], s: () => CK.tailSeg(i, len, w0, w1) };
    }),
    { name: 'tailTip', parent: 't5', pivot: [4, 15], at: () => [5, 0], s: () => CK.tailTip() },
    { name: 'th0', parent: 'body', pivot: [11, 13], at: () => [-4, 2], rot: (S) => S.th0, s: () => CK.thigh(true) },
    { name: 'sh0', parent: 'th0', pivot: [5, 7], at: () => [17, 0], rot: (S) => S.sh0, s: () => CK.shin(true) },
    { name: 'ft0', parent: 'sh0', pivot: [6, 4], at: () => [15, 0], rot: (S) => S.ft0, s: () => CK.foot(true) },
    { name: 'back', parent: 'body', pivot: [24, 44], at: () => [0, 0], s: () => CK.back() },
    { name: 'torso', parent: 'body', pivot: [21, 46], at: () => [0, 0], s: () => CK.torso() },
    { name: 'th1', parent: 'body', pivot: [11, 13], at: () => [4, 4], rot: (S) => S.th1, s: () => CK.thigh(false) },
    { name: 'sh1', parent: 'th1', pivot: [5, 7], at: () => [17, 0], rot: (S) => S.sh1, s: () => CK.shin(false) },
    { name: 'ft1', parent: 'sh1', pivot: [6, 4], at: () => [15, 0], rot: (S) => S.ft1, s: () => CK.foot(false) },
    { name: 'wingN', parent: 'body', pivot: [58, 74], at: () => [-4, -32], rot: (S) => S.flapN, s: () => CK.wing(false) },
    ...[0, 1, 2].map((i) => ({ name: `n${i}`, parent: i ? `n${i - 1}` : 'body', pivot: [[11, 10.1, 9.2][i] / 2 + 2, [11, 10.1, 9.2][i] / 2 + 2], at: i ? () => [8, 0] : () => [10, -38], rot: (S) => (i ? -0.15 : -Math.PI / 2 + 0.55 + S.neckA), s: () => CK.neckSeg(i, 8, [11, 10.1, 9.2][i], [10.1, 9.2, 8.4][i]) })),
    { name: 'headJ', parent: 'n2', at: () => [8, 0], rot: (S) => S.headA - 0.7 * S.pitch - (-Math.PI / 2 + 0.55 + S.neckA - 0.3) },
    { name: 'headBack', parent: 'headJ', pivot: [26, 18], at: () => [0, 0], s: () => CK.headBack() },
    { name: 'jaw', parent: 'headJ', pivot: [5, 8], at: () => [2, 3], rot: (S) => S.jaw, s: () => CK.jaw() },
    { name: 'head', parent: 'headJ', pivot: [14, 26], at: () => [0, 0], s: (a) => CK.head(a.face, a.atk) },
    { name: 'crown', parent: 'headJ', pivot: [8, 10], at: () => [5, -11.6], rot: (S) => S.crown, s: () => CK.crown() },
    { name: 'up', parent: 'body', pivot: [4, 6], at: () => CK_SHOULDER, rot: (S) => S.up, s: () => CK.upper() },
    { name: 'fo', parent: 'up', pivot: [4, 6], at: () => [14, 0], rot: (S) => S.fo, s: () => CK.fore() },
    { name: 'scepter', parent: 'fo', pivot: [14, 9], at: () => [14, 0], rot: (S) => S.sc, s: () => CK.scepter() },
  ],
  fx(ctx, m, a) {
    // The slam: a glowing ring on the floor and crystals erupting where the scepter strikes.
    const x0 = 52;
    if (a.ph.antic > 0.2) {
      ctx.globalAlpha = a.alpha * a.ph.antic * 0.6;
      ctx.fillStyle = '#dffaff';
      ctx.beginPath();
      ctx.ellipse(x0, -1, 9 + a.ph.antic * 6, 2 + a.ph.antic, 0, 0, TAU);
      ctx.fill();
    }
    if (a.ph.since >= 0 && a.ph.since < 0.7) {
      const u = a.ph.since / 0.7;
      const g = u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
      for (const [ox, ang, l, c] of [[-20, -0.5, 12, '#9fe3f8'], [-11, -0.25, 18, '#b9a8ff'], [-3, 0, 22, '#9fe3f8'], [8, 0.2, 16, '#f2a0d4'], [16, 0.45, 10, '#9fe3f8']]) {
        const len = l * g;
        if (len < 2) continue;
        const d = -Math.PI / 2 + ang;
        ctx.globalAlpha = a.alpha;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x0 + ox - 2.4, 0);
        ctx.lineTo(x0 + ox + Math.cos(d) * len, Math.sin(d) * len);
        ctx.lineTo(x0 + ox + 2.4, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x0 + ox + Math.cos(d) * len * 0.6 - 0.5, Math.sin(d) * len * 0.6, 1, 2);
      }
    }
  },
});

export const ART = {
  mothercapper: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 420, 220], draw: queen },
  tuskar: { walk: 8, idle: 6, attack: 5, stride: 34, atkMs: [70, 150, 380, 220], draw: behemoth },
  gnarlroot: { walk: 8, idle: 6, attack: 5, stride: 22, atkMs: [90, 160, 520, 260], draw: treant },
  crystalking: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 450, 240], draw: dragon, rig: crystalRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  mothercapper: { name: 'Myconid Queen', w: 70, h: 100 },
  tuskar: { name: 'Tuskar the Behemoth', w: 96, h: 72 },
  gnarlroot: { name: 'Gnarlroot, the Hollow Heart', w: 100, h: 150 },
  crystalking: { name: 'Prismaris, the Crystal King', w: 100, h: 130 },
};
