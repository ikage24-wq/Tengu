// Monster art: Twilight Ruins (a will-o'-wisp, an imp, a dullahan) and Crystal Cave (a gem mimic,
// a crystal golem, a wraith). Every design faces right with its feet (or its floating hem) on the
// bottom edge, and is built back to front from layered shapes with hand-placed shading.

import { E, T, F, mix, arc, stroke } from './kit.js';
import { walkBob } from '../animator.js';
import { eye, glowEye, brow, mouth, blush, sweat, tear, deadEye, vein, starPts, ovalPts } from './faces.js';

const TAU = Math.PI * 2;

// ---------- Colour ----------

// Hue-shifted ramp steps (art bible B9): a darker step (dl < 0) mixes toward a deep violet (cool
// materials) or a deep rose (warm ones, pass WARM), so shadows turn and gain colour instead of
// going grey; a lighter step (dl > 0) mixes toward a warm cream.
const COOL = '#30226a';
const WARM = '#5e1c44';
const step = (c, dl, toward = COOL) => (dl < 0 ? mix(c, toward, Math.min(1, -dl * 1.5)) : mix(c, '#fff8e6', Math.min(1, dl * 2.2)));

// ---------- Drawing helpers ----------

// The line around a part that overlaps another (the rasterizer only outlines the silhouette): a
// deep shade of the part's own hue, never a neutral ink.
const ink = (c, toward = COOL) => step(c, -0.42, toward);

// Grow a polygon outward by d (miter offset), for drawing a line around an overlapping part.
function grow(pts, d) {
  let A = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    A += x1 * y2 - x2 * y1;
  }
  const sg = A > 0 ? 1 : -1;
  const nrm = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [(sg * dy) / l, (-sg * dx) / l];
  };
  return pts.map((p, i) => {
    const a = nrm(pts[(i - 1 + pts.length) % pts.length], p);
    const b = nrm(p, pts[(i + 1) % pts.length]);
    let nx = a[0] + b[0];
    let ny = a[1] + b[1];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const k = d / Math.max(0.45, nx * a[0] + ny * a[1]);
    return [p[0] + nx * k, p[1] + ny * k];
  });
}

// Outlined polygon / ellipse / limb / ribbon (lined so they read over other parts).
const oT = (pts, c, d = 0.7) => [F(T(grow(pts, d), ink(c))), T(pts, c)];
const oE = (x, y, rx, ry, c, d = 0.7) => [F(E(x, y, rx + d, ry + d, ink(c))), E(x, y, rx, ry, c)];

function limb(pts, th, c, d = 0.7) {
  const out = [...stroke(pts, th + d * 2, ink(c))];
  for (const [x, y] of pts.slice(1, -1)) out.push(F(E(x, y, th / 2 + d, th / 2 + d, ink(c))));
  out.push(...stroke(pts, th, c, false));
  for (const [x, y] of pts.slice(1, -1)) out.push(E(x, y, th / 2, th / 2, c));
  return out;
}

// A limb along rest-pose points, lined (for put()).
const limbPts = (p, th, c, d = 0.6) => limb(p, th, c, d);

// A tapered band along a path (tails, plumes, tongues): widths per point.
function ribbonPts(pts, widths) {
  const L = [];
  const Rr = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const w = widths[i] / 2;
    L.push([p[0] - (dy / l) * w, p[1] + (dx / l) * w]);
    Rr.push([p[0] + (dy / l) * w, p[1] - (dx / l) * w]);
  });
  return [...L, ...Rr.reverse()];
}
const oRibbon = (pts, widths, c, d = 0.7) => oT(ribbonPts(pts, widths), c, d);

// A teardrop flame standing on (cx, by), w wide and h tall, its tip leaning by `lean`.
function flamePts(cx, by, w, h, lean = 0, n = 7) {
  const L = [];
  const Rr = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const hw = (w / 2) * (u < 0.32 ? Math.sqrt(Math.max(0, 1 - ((0.32 - u) / 0.32) ** 2)) : ((1 - u) / 0.68) ** 0.9);
    const x = cx + lean * u * u;
    const y = by - u * h;
    L.push([x - hw, y]);
    Rr.push([x + hw, y]);
  }
  return [...L, ...Rr.reverse()];
}

// ---------- Rig ----------
// Every design is a hierarchy of parts. A part's frame is a 2D affine [a, b, c, d, e, f]
// (x' = a x + c y + e, y' = b x + d y + f); a child joint sits at a point in its parent's space,
// turned and scaled about that point. Parts are drawn about their own pivot and placed with put(),
// so limbs keep their length, props ride their parent, and a pose is just a set of angles.
const ID = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const joint = (m, x, y, a = 0, sx = 1, sy = sx) => mul(m, [Math.cos(a) * sx, Math.sin(a) * sx, -Math.sin(a) * sy, Math.cos(a) * sy, x, y]);
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
// A cut-out joint: a part drawn at its rest coordinates turns (and scales) about its pivot (x, y),
// then rides its parent's frame. pivot(parent, x, y, a) is all a pose needs.
const pivot = (m, x, y, a = 0, sx = 1, sy = sx) => mul(joint(m, x, y, a, sx, sy), [1, 0, 0, 1, -x, -y]);
const move = (m, dx, dy) => mul(m, [1, 0, 0, 1, dx, dy]);
// Squash and stretch about a point (sx across, sy along the vertical), inside a part's frame.
const squash = (m, x, y, sx, sy) => mul(joint(m, x, y), [sx, 0, 0, sy, -x * sx, -y * sy]);

// Places shapes drawn in a part's local space into its frame; ellipses become polygons so they turn.
function put(m, shapes) {
  return shapes.map((s) => {
    if (!s) return s;
    const keep = { c: s.c, f: s.f, cast: s.cast, lit: s.lit };
    if (s.t === 'p') return { t: 'p', x: 0, y: 0, pts: s.pts.map(([px, py]) => ap(m, s.x + px, s.y + py)), ...keep };
    if (s.t === 'e') {
      const n = Math.max(10, Math.min(22, Math.round((s.rx + s.ry) * 2.2)));
      return { t: 'p', x: 0, y: 0, pts: Array.from({ length: n }, (_, i) => ap(m, s.x + Math.cos((i / n) * TAU) * s.rx, s.y + Math.sin((i / n) * TAU) * s.ry)), ...keep };
    }
    return { t: 'p', x: 0, y: 0, pts: [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]].map(([a, b]) => ap(m, a, b)), ...keep };
  });
}

// A chain (tails, flames, capes, plumes, chains): from frame m, segment i of length lens[i] bends
// by angs[i] (radians, relative to the previous one). Returns the joint frames, root first.
function chain(m, lens, angs) {
  const fr = [joint(m, 0, 0, angs[0] ?? 0)];
  lens.forEach((l, i) => fr.push(joint(fr[i], l, 0, angs[i + 1] ?? 0)));
  return fr;
}
const pts = (frames) => frames.map((f) => ap(f, 0, 0));
// Travelling-wave bends for a chain: the root leads and each segment follows `lag` later, the
// swing growing toward the tip (never one shape swung as a whole, never a ping-pong).
const wave = (n, base, amp, ph, lag = 0.7, grow = 1) => Array.from({ length: n + 1 }, (_, i) => base + amp * (0.4 + (grow * i) / n) * Math.sin(ph - i * lag));

// ---------- Motion helpers ----------

const lerp = (a, b, u) => a + (b - a) * u;
const wrap = (u) => ((u % 1) + 1) % 1;
const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
// A breath, 0..1: in slowly over most of the cycle, out quickly (README: idle breathes in slowly
// and out quickly); the renderer then holds its two extremes.
const breath = (u) => {
  u = wrap(u);
  return u < 0.62 ? ease(u / 0.62) : 1 - ease((u - 0.62) / 0.38);
};
// A wingbeat, 0 (raised) .. 1 (fully down): a fast downstroke over the first quarter, a slow
// recovery over the rest (Saint11 "Wings").
const beat = (u) => {
  u = wrap(u);
  return u < 0.26 ? ease(u / 0.26) : 1 - ease((u - 0.26) / 0.74);
};
// Speed lines trailing a fast part: [[x0, y0, x1, y1], ...].
const streaks = (lines, c, th = 0.6) => lines.flatMap(([x0, y0, x1, y1]) => stroke([[x0, y0], [x1, y1]], th, c));
// An impact star of n spikes.
function burst(x, y, r, c, core, n = 8, a0 = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = a0 + (i / (n * 2)) * TAU;
    const rr = i % 2 ? r * 0.4 : r * (i % 4 ? 0.72 : 1);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return [F(T(pts, c)), F(E(x, y, r * 0.3, r * 0.3, core))];
}
// Dust kicked up where a heavy foot lands.
function dust(x, y, k, c = '#e9e2f4') {
  return [F(E(x - 2.8 * k, y - 0.9 * k, 1.9 * k, 1.2 * k, c)), F(E(x + 2.8 * k, y - 0.8 * k, 1.7 * k, 1.1 * k, c)), F(E(x - 5 * k, y - 2 * k, 0.9 * k, 0.8 * k, c)), F(E(x + 4.8 * k, y - 2.1 * k, 0.8 * k, 0.7 * k, c))];
}

// ---------- Will-o'-Wisp ----------
// A little ghost-fire spirit: a round flame body with three chained flame tongues and a curling
// tail, glowing eyes in a deep socket, and a lantern hanging from its stubby arm on a pendulum
// joint. Signature shape: the teardrop flame with a lantern dangling off the front.
// Rig: root (float bob, sway) > body (squash about its base) > tongues and tail (chains, root
// leads), arm (shoulder > hand) > lantern (pendulum that lags the hand's motion).
const WISP_PAL = {
  calm: { hi: '#f7fffb', base: '#b4effa', s1: '#7ecdf0', s2: '#7393e4', hot: '#ffb547', flame: '#ffa64a' },
  angry: { hi: '#fff8ff', base: '#dcc9ff', s1: '#b591f7', s2: '#8b69e2', hot: '#ff7c6b', flame: '#ff7fb8' },
  dead: { hi: '#f2f1f7', base: '#d5d6e6', s1: '#afafca', s2: '#8e8cb3', hot: '#c9c4d8', flame: '#c9c4d8' },
};
const WISP_SOCKET = '#2b2665';
const WISP_LINE = '#3b2f6e';
// Attack keys: wind-up (rear back, lantern swung behind, flame flares), strike (lunge, lantern
// whipped through), impact (held: arm out, fireball bursting), settle (drifting back).
const WISP_ATK = [
  { x: -2, y: -0.6, rot: -0.14, sx: 0.92, sy: 1.08, flare: 1.35, arm: 2.5, lan: 0.5, lean: 0.5, behind: true },
  { x: 1.4, y: 0.4, rot: 0.16, sx: 1.14, sy: 0.9, flare: 1.1, arm: -0.1, lan: -1.4, lean: -0.7 },
  { x: 1.2, y: 0.5, rot: 0.1, sx: 1.06, sy: 0.95, flare: 1.02, arm: 0, lan: -0.6, lean: -0.45 },
  { x: 0.4, y: 0.2, rot: 0.04, sx: 0.98, sy: 1.03, flare: 0.96, arm: 0.2, lan: 0.3, lean: -0.15 },
];

function wispFace(m, mood, P, look, flick, shout) {
  const out = [];
  const lk = [look * 0.9, 0];
  const lx = look * 0.5;
  const E0 = [-2 + lx, -0.2];
  const E1 = [3.4 + lx, -0.4];
  if (mood === 'dead') out.push(...deadEye(E0[0], E0[1], 1.4, { type: 'swirl', c: WISP_LINE, s: -1 }), ...deadEye(E1[0], E1[1], 1.6, { type: 'swirl', c: WISP_LINE }));
  else if (mood === 'happy' || mood === 'blink' || mood === 'hurt') {
    // Shut, the fire inside goes out of view: lid lines in the flame's own deep violet.
    const closed = { happy: 'happy', blink: 'blink', hurt: 'squeeze' }[mood];
    const o = { closed, lashC: WISP_LINE, shape: 'round' };
    out.push(...eye(E0[0], E0[1], { ...o, s: -1, w: 1.35, h: 1.8 }), ...eye(E1[0], E1[1], { ...o, s: 1, w: 1.7, h: 2 }));
  } else {
    // Hollow flame eyes: a deep socket with the glow burning inside it, the strongest contrast on
    // the sprite.
    const fe = { c: P.hot, bg: WISP_SOCKET, flick, look: lk, ...(mood === 'angry' ? { lid: 0.3, slant: 0.85, raise: 0.2 } : {}) };
    // Each socket is a little flame of its own, licking upward.
    const ang = mood === 'angry';
    const sock = (x, y, w, h, s) => (ang ? [[x - s * w, y - h * 0.45], [x + s * w * 0.9, y - h * 0.95], [x + s * w * 1.05, y + h * 0.5], [x, y + h * 0.8], [x - s * w * 0.95, y + h * 0.35]] : flamePts(x, y + h * 0.75, w * 2, h * 2.1, s * 0.4 + look * 0.3));
    out.push(F(T(sock(E0[0], E0[1], 1.7, 2.2, -1), WISP_SOCKET)), F(T(sock(E1[0], E1[1], 2, 2.4, 1), WISP_SOCKET)));
    out.push(...glowEye(E0[0], E0[1] + 0.3, { ...fe, s: -1, w: 1.05, h: 1.45 }), ...glowEye(E1[0], E1[1] + 0.3, { ...fe, s: 1, w: 1.3, h: 1.6 }));
  }
  if (mood !== 'dead' && mood !== 'angry') out.push(...blush(-2.6 + lx, 2.6, 1.1, { on: P.hi }), ...blush(4.8 + lx, 2.4, 1.3, { on: P.hi }));
  const mx = 1 + lx;
  const mo = { ink: WISP_LINE };
  if (shout) out.push(...mouth(mx, 3, { ...mo, type: 'shout', w: 1.3, h: 2.6, open: 1, tongue: P.flame }));
  else if (mood === 'angry') out.push(...mouth(mx, 3.1, { ...mo, type: 'snarl', w: 1.4, h: 1.9, open: 0.85, fangs: 2, tongue: false }));
  else if (mood === 'happy') out.push(...mouth(mx, 2.8, { ...mo, type: 'grin', w: 1.3, h: 2, open: 1, teeth: 'none', tongue: P.flame }));
  else if (mood === 'hurt') out.push(...mouth(mx, 3.2, { ...mo, type: 'pained', w: 1.2, h: 1.4, open: 1 }), ...sweat(-5.4, -4.4, 0.8));
  else if (mood === 'dead') out.push(...mouth(mx, 3.2, { ...mo, type: 'wavy', w: 1.1, amp: 0.25 }));
  else out.push(...mouth(mx, 3, { ...mo, type: 'cat', w: 1.1, curve: 0.45 }));
  return put(m, out);
}

function wisp(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? WISP_ATK[frame] : null;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const P = dead ? WISP_PAL.dead : angry || ak ? WISP_PAL.angry : WISP_PAL.calm;
  const u = ak ? frame / 4 : frame / (walk ? 8 : 6);
  const ph = u * TAU;
  // Root: a drifting float. Walking it bobs on a triangle-ish wave and leans into the drift;
  // idling it breathes (slow in, quick out) with a sideways sway.
  const br = breath(u);
  let x = 15.6;
  let y = 23;
  let rot = 0;
  let sx = 1;
  let sy = 1;
  if (ak) {
    [x, y, rot, sx, sy] = [x + ak.x, y + ak.y, ak.rot, ak.sx, ak.sy];
  } else if (walk) {
    y += -1.5 * Math.sin(ph) - 0.3 * Math.sin(2 * ph);
    x += 0.5 * Math.sin(2 * ph + 0.6);
    rot = 0.1 + 0.05 * Math.sin(ph - 0.9);
    sy = 1 + 0.05 * Math.sin(ph - 0.5);
    sx = 2 - sy;
  } else {
    y += -0.9 * br;
    x += 0.5 * Math.sin(ph - 0.8);
    rot = 0.03 * Math.sin(ph - 0.8);
    sy = 1 + 0.035 * br;
    sx = 1 - 0.025 * br;
  }
  if (hurt) [x, rot, sx, sy] = [x - 1.6, rot - 0.24, sx * 1.1, sy * 0.88];
  if (dead) [y, rot, sx, sy] = [y + 1.4, rot - 0.12, sx * 1.12, sy * 0.84];
  const root = joint(ID, x, y, rot);
  const body = squash(root, 0, 7, sx, sy);
  const out = [];
  const fx = [];

  // Embers rising behind, each a little flame that shrinks as it climbs.
  if (!dead) {
    for (let i = 0; i < 2; i++) {
      const e = wrap(u + i * 0.5);
      const [ex, ey] = ap(root, -7 + i * 5 - e * 3, -6 - e * 11);
      const r = 1.7 - e * 0.6;
      out.push(...oT(starPts(ex, ey, r, 4, 0.45), P.s1, 0.45), F(T(starPts(ex, ey, r * 0.5, 4, 0.5), P.hi)));
    }
  }
  // Tail: a five-link chain curling down and back, its tip lagging the root.
  const flare = (dead ? 0.5 : angry ? 1.2 : hurt ? 0.85 : 1) * (ak ? ak.flare : 1);
  const tAmp = dead ? 0.05 : walk ? 0.32 : ak ? 0.15 : 0.18;
  const tail = chain(joint(body, -3, 5.5), [3, 2.9, 2.6, 2.2, 1.8], wave(5, 0, tAmp, ph - 0.6, 0.8).map((a, i) => a + [2.45, 0.32, 0.3, 0.4, 0.55, 0.6][i] + (walk ? [0.2, 0, -0.1, -0.1, 0, 0][i] : 0) + (dead ? 0.15 : 0)));
  const tp = pts(tail);
  out.push(...oT(ribbonPts(tp, [8.4, 6.6, 4.8, 3.2, 1.8, 0.5]), P.s1, 0.6), F(T(ribbonPts(tp.slice(0, 4), [5, 3.6, 2, 0.5]).map(([px, py]) => [px + 0.6, py - 0.6]), P.base)));
  // Flame tongues: three chains rising from the crown; the lean trails the motion and every link
  // follows the one below it, so the fire licks upward instead of swaying as a sheet.
  const lean = (ak ? ak.lean : walk ? -0.42 : -0.1) + (hurt ? 0.5 : 0);
  const tongue = (bx, by, len, w, ph0, amp, c, inner) => {
    const L = len * flare;
    const fr = chain(joint(body, bx, by, -Math.PI / 2), [L * 0.36, L * 0.34, L * 0.3], wave(3, 0, amp, ph * (walk ? 2 : 1) + ph0, 0.9).map((a, i) => a - (i ? lean * (0.5 + i * 0.35) : lean * 0.4) + (dead ? (i ? 0.5 : 0.3) : 0)));
    const p = pts(fr);
    const o = [T(ribbonPts(p, [w, w * 0.78, w * 0.42, 0.3]), c)];
    if (inner) o.push(F(T(ribbonPts(p.slice(0, 3).map(([px, py]) => [px + 0.5, py + 0.3]), [w * 0.6, w * 0.42, 0.3]), inner)));
    return o;
  };
  out.push(...tongue(-5, -3.6, 9.5, 6.6, 1.8, 0.16, P.s1, P.base), ...tongue(5.4, -4, 8.6, 6, 3.6, 0.18, P.s1, P.base), ...tongue(0.4, -5.6, 12.6, 9.4, 0, 0.13, P.s1, P.base));
  // The body: shadow, base, and hot core each set further toward the light (upper front), so the
  // glow reads as a lit form rather than rings that follow the outline.
  out.push(...put(body, [T(ovalPts(-0.6, 0.6, 9.9, 9.3), P.s2), F(T(ovalPts(0.1, -0.1, 9.4, 8.9), P.s1)), F(T(ovalPts(1, -0.9, 8, 7.6), P.base)), F(T(ovalPts(2.4, -1.4, 5.6, 5.2), P.hi))]));
  if (!dead) out.push(...put(body, [F(T(flamePts(1.2, -3.8, 4, 7.4 * flare, -lean * 2.2), P.hi)), F(T(ovalPts(-4.2, -4.6, 1.8, 1.1, -0.5), '#ffffff'))]));
  // Face, riding the body.
  const look = ak ? 0.6 : walk ? 0.5 : hurt ? -0.4 : 0.8 * Math.sin(ph);
  out.push(...wispFace(joint(body, 1.2, 0), mood, P, look, wrap(u * 3 + 0.2), !!ak && (frame === 1 || frame === 2) && !dead));

  // Arm: shoulder > hand, then the lantern on a pendulum that lags the hand.
  const armA = ak ? ak.arm : dead ? 1.2 : hurt ? 0.9 : walk ? 0.55 + 0.18 * Math.sin(ph - 0.6) : 0.65 + 0.08 * Math.sin(ph - 0.8);
  const sh = joint(body, 7.2, 3.8, armA);
  const hand = joint(sh, 4, 0, 0);
  const swing = ak ? ak.lan : dead ? 0.1 : hurt ? -0.6 : walk ? 0.32 * Math.sin(2 * ph - 1.9) + 0.18 : 0.12 * Math.sin(ph - 1.6);
  const lanF = joint(joint(ID, ...ap(hand, 0, 0)), 0, 0, swing);
  const lanFrame = { hi: '#a99bd8', base: '#6e5a96', s1: '#4c3d76' };
  const glass = dead ? '#cfcadd' : angry || ak ? '#ffe0f0' : '#fff3c2';
  const lan = [
    ...stroke([[0, 0], [0, 2.2]], 0.8, lanFrame.base),
    ...oT([[-1.4, 2], [1.4, 2], [3, 3.7], [-3, 3.7]], lanFrame.base, 0.5),
    ...oT([[-2.5, 3.7], [2.5, 3.7], [2.7, 9], [-2.7, 9]], glass, 0.5),
    F(T([[1.2, 3.7], [2.5, 3.7], [2.7, 9], [1.4, 9]], mix(glass, P.flame, 0.35))),
    ...stroke([[-2.5, 3.7], [-2.7, 9]], 0.8, lanFrame.base), ...stroke([[2.5, 3.7], [2.7, 9]], 0.8, lanFrame.s1),
    ...oT([[-3.3, 9], [3.3, 9], [2.6, 10.6], [-2.6, 10.6]], lanFrame.base, 0.5),
    F(T([[-3.1, 9.1], [-0.6, 9.1], [-0.8, 9.7], [-2.9, 9.7]], lanFrame.hi)), F(T([[-1.2, 2.1], [0.2, 2.1], [-0.6, 3.5], [-2.4, 3.5]], lanFrame.hi)),
  ];
  if (!dead) {
    const lf = (1 + 0.15 * Math.sin(ph * 2)) * (ak && frame === 0 ? 1.45 : ak && frame < 3 ? 0.6 : 1);
    lan.push(F(T(flamePts(0, 8.6, 2.6, 4 * lf, swing * 1.6), P.flame)), F(T(flamePts(0, 8.6, 1.3, 2.3 * lf, swing), '#fff8d6')));
  }
  const arm = [...put(lanF, lan), ...put(sh, [...oT(ribbonPts([[0, 0], [2, 0.2], [4, 0]], [2.9, 2.6, 2.4]), P.base, 0.55), ...oE(4.2, 0.3, 1.7, 1.6, P.base, 0.5), F(E(4.5, -0.3, 0.7, 0.5, P.hi))])];
  // Swung back for the throw, the arm and lantern pass behind the body.
  if (ak?.behind) out.unshift(...arm);
  else out.push(...arm);


  // The fireball: sparks gathering at the lantern, a flat smear on the throw, a burst with a dark
  // rim (so it reads on pale maps), then smoke that drifts and breaks up.
  const [lx, ly] = ap(lanF, 0, 7);
  if (ak && !dead) {
    if (frame === 0) {
      for (let i = 0; i < 4; i++) {
        const q = (i / 4) * TAU + 0.5;
        fx.push(...stroke([[lx + Math.cos(q) * 4.6, ly + Math.sin(q) * 4.2], [lx + Math.cos(q) * 2.8, ly + Math.sin(q) * 2.6]], 0.7, '#ffcf8a'));
      }
    } else if (frame === 1) {
      // Just flung: the ball a step ahead of the lantern, its flat smear trailing back to it.
      const [bx, by] = [Math.min(30, lx + 5), ly - 2];
      fx.push(...oT([[lx + 0.6, ly - 1.2], [bx - 0.6, by - 2.4], [bx + 2.2, by - 0.6], [bx + 1.8, by + 1.6], [bx - 0.6, by + 2.2], [lx + 0.8, ly + 0.8]], '#ffa66a', 0.5), F(T(ovalPts(bx + 0.4, by - 0.2, 1.6, 1.5), '#ffe8a8')));
    } else if (frame === 2) {
      fx.push(...burst(29.6, 17.6, 4.8, '#c8506a', '#c8506a', 8, 0.2), ...burst(29.6, 17.6, 4, '#ff9a6a', '#fff4d0', 8, 0.2), ...burst(29.6, 17.6, 2.4, '#ffe08a', '#ffffff', 6, 0.6));
    } else {
      fx.push(...oE(29.2, 15.2, 2.2, 1.6, '#efe2f6', 0.4), ...oE(27.4, 13.2, 1.4, 1.1, '#efe2f6', 0.4), F(T(flamePts(31.4, 17, 1.6, 2.4, 0.4), '#ffb27a')));
    }
  }
  return { w: 34, h: 40, res: 3, shapes: [...out, ...fx] };
}

// ---------- Imp ----------
// A pink little demon on bat wings: curled horns, pointy ears, slanted lime cat eyes under a smug
// lid, a fanged smirk, a spade-tipped tail, and a tiny golden trident. Signature shape: the round
// head between two horns and two spread bat wings.
// Rig: root (flight bob from the wingbeat, darting) > torso > neck > head > ears (each a floppy
// joint) and the face; torso > wings (bone > fingers, fast downstroke, slow recovery; the far wing
// a beat late), tail (chain), legs (hip > knee), arms (shoulder > elbow > hand > trident).
const IMP = {
  skin: '#f6a6c6', hi: '#ffd8e6', s1: '#d985b6', s2: '#ad66a4', belly: '#ffe4ee', ear: '#ffc4da',
  hair: '#7b4fc2', hairHi: '#a982ea', wing: '#5c4398', memb: '#9a7ddb', membS: '#7a5cc0',
  horn: '#f6e5c6', hornHi: '#fffaf0', hornS: '#d6b2a6', sole: '#86507a',
  gold: '#ffcd48', goldHi: '#fff4c2', goldS: '#d68e2c', shaft: '#b07a4c', shaftS: '#83504a',
  lash: '#4a1d50', iris: ['#2f6a1e', '#8ade46', '#e4ff9c'],
};
// Attack keys (shoulder, elbow, hand angles; body offset and lean): a long cocked wind-up with the
// trident drawn back, a short jab (smear), the held impact at full reach, and the settle.
const IMP_ATK = [
  { dx: -2.6, dy: -0.4, lean: -0.16, sa: 1.24, ea: -0.82, ha: 1.15, g: 9, el: 1.25, sp: 1.15, tail: -0.5, kick: -1.2 },
  { dx: 1, dy: 0.5, lean: 0.12, sa: -0.3, ea: 0.8, ha: 1.08, g: 13, el: -0.5, sp: 0.85, tail: 0.5, kick: 0.9 },
  { dx: 1.2, dy: 0.7, lean: 0.14, sa: -0.5, ea: 0.95, ha: 1.12, g: 13, el: -0.3, sp: 0.95, tail: 0.4, kick: 0.6 },
  { dx: 0.4, dy: 0.3, lean: 0.05, sa: -0.15, ea: 0.55, ha: 0.85, g: 6, el: 0.5, sp: 1, tail: -0.2, kick: 0.2 },
];

// A bat wing from its root (shoulder blade) S: the arm bone rises to the wrist at elevation `el`,
// three fingers fan behind it by `spread`, and the membrane scallops between them.
function batWing(S, dir, el, spread, P, far) {
  const k = far ? 0.92 : 1;
  const v = (a, l) => [dir * Math.cos(a) * l * k, -Math.sin(a) * l * k];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const Eb = add(S, v(el + 0.35, 7));
  const f1 = add(Eb, v(el - 0.05 * spread, 10.5 * (0.88 + spread * 0.12)));
  const f2 = add(Eb, v(el - 0.6 * spread, 9.4));
  const f3 = add(Eb, v(el - 1.15 * spread, 7.6));
  const B = [S[0] - dir * 0.5, S[1] + 6];
  const sc = (p, q, kk = 0.3) => {
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    return [m[0] + (Eb[0] - m[0]) * kk, m[1] + (Eb[1] - m[1]) * kk];
  };
  const memb = far ? step(P.memb, -0.12) : P.memb;
  const membS = far ? step(P.membS, -0.12) : P.membS;
  const bone = far ? step(P.wing, -0.1) : P.wing;
  const out = [...oT([S, Eb, f1, sc(f1, f2), f2, sc(f2, f3), f3, sc(f3, B, 0.2), B], memb, 0.6)];
  // The panel nearest the body sits in shadow; the leading panel catches the light.
  out.push(F(T([Eb, sc(f2, f3), f3, sc(f3, B, 0.2), B, S], membS)), F(T([Eb, f1, sc(f1, f2), [lerp(Eb[0], f2[0], 0.5), lerp(Eb[1], f2[1], 0.5)]], step(memb, 0.12))));
  out.push(...stroke([S, Eb, f1], 1.3, bone), ...stroke([Eb, f2], 0.8, bone), ...stroke([Eb, f3], 0.8, bone));
  out.push(...oT([add(Eb, [0, -0.6]), add(Eb, v(el + 1.3, 2.6)), add(Eb, [dir * 0.6, 0.4])], P.horn, 0.4));
  return out;
}

function impFace(mood, look, wind) {
  const P = IMP;
  const out = [];
  const lx = look * 0.3;
  const eF = [24.2 + lx, 12.6];
  const eN = [30 + lx, 12.4];
  const ie = { shape: 'sharp', tilt: 0.5, iris: P.iris, pupil: 'slit', lashC: P.lash, flicks: 1, look: [look, 0], lowerC: '#e58aa8' };
  const act = {
    idle: { lid: 0.22 },
    angry: { lid: 0.2, slant: 0.9, raise: 0.25, pupilK: 0.6 },
    hurt: { closed: 'squeeze' },
    happy: { closed: 'happy' },
    blink: { closed: 'blink' },
  }[mood] ?? {};
  if (mood === 'dead') out.push(...deadEye(eF[0], eF[1], 1.2, { c: P.lash }), ...deadEye(eN[0], eN[1], 1.5, { c: P.lash }));
  else out.push(...eye(eF[0], eF[1], { ...ie, ...act, s: -1, w: 1.85, h: 2.5 }), ...eye(eN[0], eN[1], { ...ie, ...act, s: 1, w: 2.5, h: 2.8 }));
  const ba = { idle: 12, angry: 30, hurt: -24, happy: -8, dead: -10 }[mood] ?? 0;
  const bu = { angry: -0.5, hurt: 0.5, happy: 0.4 }[mood] ?? 0;
  out.push(...brow(eF[0] - 0.1, eF[1] - 3.7 - bu, { s: -1, len: 1.2, angle: ba, th: 0.7, arch: 0.3, c: P.hair }), ...brow(eN[0] + 0.2, eN[1] - 4 - bu, { s: 1, len: 1.6, angle: ba, th: 0.8, arch: 0.35, c: P.hair }));
  if (mood !== 'dead') out.push(...blush(22.8 + lx, 15.8, 1.3, { on: P.skin, lines: 2 }), ...blush(32.4 + lx, 15.6, 1.1, { on: P.skin }));
  const mx = 27.8 + lx;
  const my = 16.6;
  const mo = { ink: '#8a2f5a' };
  if (wind) out.push(...mouth(mx, my, { ...mo, type: 'pained', w: 2, h: 1.6, open: 1 }));
  else if (mood === 'angry') out.push(...mouth(mx, my - 0.2, { ...mo, type: 'snarl', w: 2, h: 2.4, open: 1, fangs: 2, tongue: false }), ...vein(33.4, 7.4, 0.55));
  else if (mood === 'happy') out.push(...mouth(mx, my - 0.4, { ...mo, type: 'grin', w: 1.9, h: 2.4, open: 1, fangs: 1, teeth: 'none' }));
  else if (mood === 'hurt') out.push(...mouth(mx, my, { ...mo, type: 'pained', w: 1.7, h: 1.6, open: 1 }), ...tear(eN[0] + 2.2, eN[1] + 0.8, 0.8));
  else if (mood === 'dead') out.push(...mouth(mx, my, { ...mo, type: 'wavy', w: 1.5, amp: 0.25, tongueOut: true, tongueLen: 1.5 }));
  else out.push(...mouth(mx, my, { ...mo, type: 'smirk', w: 1.8, tilt: 0.6, fangs: 1, fangAt: 0.72 }));
  return out;
}

function imp(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? IMP_ATK[frame] : null;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || !!ak;
  const P = IMP;
  const u = ak ? frame / 4 : frame / (walk ? 8 : 6);
  const ph = u * TAU;
  // The wingbeat drives everything: two quick beats per flight cycle, one slow beat per hover.
  const bu = walk ? 2 * u : u;
  const b = beat(bu);
  const bl = beat(bu - 0.08);
  let el = ak ? ak.el : lerp(walk ? 1.15 : 1, walk ? -0.6 : -0.4, b);
  let sp = ak ? ak.sp : walk ? 1 - 0.18 * b : 1 - 0.1 * b;
  // The body rises on the downstroke and sinks through the recovery, a hair after the wings.
  let dy = ak ? ak.dy : (walk ? 1.3 : 0.8) - (walk ? 2.4 : 1.4) * bl;
  let dx = ak ? ak.dx : walk ? 0.8 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph + 1) : 0.5 * Math.sin(ph - 0.8);
  let lean = ak ? ak.lean : walk ? 0.08 + 0.05 * Math.cos(2 * ph) : 0.03 * Math.sin(ph - 0.8);
  let headA = ak ? -ak.lean * 0.5 : -0.06 * Math.sin(ph - 1.1);
  if (angry && !ak) sp *= 1.12;
  if (hurt) [el, sp, dx, lean, headA] = [1.35, 1.2, dx - 1.6, -0.24, -0.18];
  if (dead) [el, sp, dy, lean, headA] = [-0.95, 0.72, 2, -0.3, 0.32];
  const root = pivot(move(ID, dx, dy), 24, 26, lean);
  const out = [];
  const fx = [];

  // Wings: the far one first, darker and a beat late.
  const elF = ak || hurt || dead ? el - 0.1 : lerp(walk ? 1.15 : 1, walk ? -0.6 : -0.4, beat(bu - 0.12)) - 0.1;
  out.push(...batWing(ap(root, 27.5, 18.6), 1, elF, sp, P, true));
  out.push(...batWing(ap(root, 19.6, 18.8), -1, el, sp, P, false));
  // Tail: a chain curling back and up, the spade on its last link.
  const tw = ak ? ak.tail : 0;
  const tail = chain(joint(root, 19.8, 26.2), [3.8, 3.6, 3.2, 2.8], wave(4, 0, dead ? 0.05 : walk ? 0.24 : 0.16, ph * (walk ? 2 : 1) - 0.8, 0.8).map((a, i) => a + [Math.PI - 0.5, 0.2, 0.45, 0.6, 0.55][i] + tw * (i ? 0.15 : 0.3) + (dead ? 0.25 : 0)));
  out.push(...oT(ribbonPts(pts(tail), [2.4, 2, 1.7, 1.4, 1.2]), P.s1, 0.6));
  out.push(...put(tail[4], oT([[3.8, 0], [0.4, -2.4], [-0.9, -1.5], [0, 0], [-0.9, 1.5], [0.4, 2.4]], P.s2, 0.55)), ...put(tail[4], [F(T([[3, -0.2], [0.6, -1.8], [0.2, -0.6]], P.s1))]));
  // Back arm and the legs, dangling a beat behind the flight.
  const legSw = ak ? ak.kick : dead ? -0.5 : hurt ? 0.9 : (walk ? 0.32 : 0.16) * Math.sin(ph * (walk ? 2 : 1) - 1.4);
  const ba = pivot(root, 20.6, 21.6, ak && !frame ? -0.5 : 0.15 * Math.sin(ph - 1.2) + (hurt ? -0.6 : 0));
  out.push(...put(ba, [...limbPts([[20.6, 21.6], [17.8, 24.2]], 2.3, P.s1), ...oE(17.4, 24.6, 1.3, 1.2, P.s1, 0.5)]));
  const leg = (hx, hy, kx, ky, fx0, fy0, c, a1, a2) => {
    const th = pivot(root, hx, hy, a1);
    const sh = pivot(th, kx, ky, a2);
    return [...put(th, limbPts([[hx, hy], [kx, ky]], 2.5, c)), ...put(sh, [...limbPts([[kx, ky], [fx0, fy0]], 2.2, c), ...oE(fx0 + 0.3, fy0 + 0.5, 1.5, 1, P.sole, 0.45)])];
  };
  out.push(...leg(21.8, 27, 21.4, 29.2, 20.8, 31.2, P.s1, legSw * 0.6, legSw * 0.5 + 0.1));
  // Torso: base set toward the light over its shadow side, then the belly.
  out.push(...put(root, [...oE(23.6, 23.8, 5.4, 5, P.s1), F(E(24.3, 23.1, 4.7, 4.3, P.skin)), F(E(25, 24.4, 3, 3.1, P.belly)), F(E(25.8, 23, 1, 0.6, '#ffffff'))]));
  out.push(...leg(25.8, 27.4, 26.2, 29.6, 26.8, 31.6, P.skin, -legSw * 0.5, -legSw * 0.4 + 0.05));

  // Head on the neck pivot; the ears flop after it.
  const neck = pivot(root, 24.6, 18.4, headA);
  const head = [];
  const earA = (angry ? -0.32 : dead ? 0.4 : 0) + (hurt ? -0.2 : 0);
  const earF = (s) => (walk ? 0.12 * Math.sin(2 * ph - 1.6) : 0.08 * Math.sin(ph - 1.4)) * s;
  head.push(...put(pivot(neck, 17.6, 12.2, -earA + earF(1)), [...oT([[18, 10.2], [11.2, 7.2], [17.6, 15]], P.s1, 0.6), F(T([[17.2, 11.2], [13.4, 9.2], [17, 13.6]], P.ear))]));
  head.push(...put(pivot(neck, 32, 11.8, earA - earF(1)), [...oT([[31.6, 9.8], [37.6, 6.6], [32.2, 14]], P.skin, 0.6), F(T([[32.4, 10.6], [35.8, 8.6], [32.6, 12.8]], P.ear))]));
  const hornL = [[21, 6.4], [19.2, 3.8], [18.8, 1.8], [19.8, 0.9]];
  const hornR = [[28.4, 6], [30, 3.6], [31.6, 2], [33, 1.6]];
  head.push(...put(neck, [...oT(ribbonPts(hornL, [3, 2.4, 1.5, 0.3]), P.horn, 0.6), ...oT(ribbonPts(hornR, [3, 2.4, 1.5, 0.3]), P.horn, 0.6)]));
  head.push(...put(neck, [F(T(ribbonPts(hornR.slice(0, 3).map(([x, y]) => [x + 0.5, y - 0.3]), [0.9, 0.7, 0.3]), P.hornHi)), ...stroke([[19.4, 4.4], [21, 4]], 0.5, P.hornS), ...stroke([[29.2, 3.6], [30.6, 4.4]], 0.5, P.hornS)]));
  // Head: shadow side, then the skin set toward the light, a soft sheen on the brow.
  head.push(...put(neck, [...oE(25, 12.4, 8.6, 7.8, P.s1), F(E(25.8, 11.7, 7.9, 7.1, P.skin)), F(T(ovalPts(28.4, 7.4, 3.2, 1.3, -0.25), P.hi))]));
  head.push(...put(neck, [F(T([[22.4, 7.6], [23.6, 3], [25, 5.6], [26.6, 2.6], [27.6, 5.6], [29, 4.4], [28.6, 7.2], [25.6, 6.6]], P.hair)), F(T([[24.4, 5.4], [26.4, 3.2], [26.8, 5.2]], P.hairHi))]));
  head.push(...put(neck, impFace(dead ? 'dead' : ak ? 'angry' : mood, ak ? 0.8 : walk ? 0.6 : [0, 1, 1, 0, -1, -1][frame] ?? 0, !!ak && frame === 0)));
  out.push(...head);

  // Front arm: shoulder > elbow > hand; the trident rides the hand (gripped short to jab).
  const sa = ak ? ak.sa : dead ? 0.5 : hurt ? 0.45 : 0.1 * Math.sin(ph - 0.6) + (angry ? -0.15 : 0);
  const ea = ak ? ak.ea : dead ? 0.3 : 0.08 * Math.sin(ph - 1.2);
  const ha = ak ? ak.ha : dead ? 0.6 : hurt ? 0.35 : 0.12 + 0.06 * Math.sin(ph - 1.6) + (angry ? 0.18 : 0);
  const g = ak ? ak.g : 0;
  const upper = pivot(root, 28, 21.4, sa);
  const fore = pivot(upper, 30.4, 23.8, ea);
  const hand = pivot(fore, 35, 22.6, ha);
  const H = [35, 22.6 + g];
  const tri = [
    ...oT([[H[0] - 0.7, H[1] + 9.2], [H[0] + 0.7, H[1] + 9.2], [H[0] + 0.7, H[1] - 14], [H[0] - 0.7, H[1] - 14]], P.shaft, 0.5),
    F(T([[H[0] + 0.1, H[1] + 9], [H[0] + 0.7, H[1] + 9], [H[0] + 0.7, H[1] - 13.8], [H[0] + 0.1, H[1] - 13.8]], P.shaftS)),
    ...oT([[H[0] - 4, H[1] - 14.6], [H[0] + 4, H[1] - 14.6], [H[0] + 3.4, H[1] - 13.2], [H[0] - 3.4, H[1] - 13.2]], P.gold, 0.5),
    ...oT([[H[0] - 0.9, H[1] - 14.4], [H[0], H[1] - 19.6], [H[0] + 0.9, H[1] - 14.4]], P.gold, 0.5),
    ...oT([[H[0] - 4, H[1] - 14.4], [H[0] - 4.4, H[1] - 17.6], [H[0] - 3.4, H[1] - 16.4], [H[0] - 2.8, H[1] - 14.4]], P.gold, 0.5),
    ...oT([[H[0] + 4, H[1] - 14.4], [H[0] + 4.4, H[1] - 17.6], [H[0] + 3.4, H[1] - 16.4], [H[0] + 2.8, H[1] - 14.4]], P.gold, 0.5),
    // Gold, three steps: a hot specular on the lit bevel, the base, a warm shadow on the far side.
    F(T([[H[0] - 3.6, H[1] - 14.5], [H[0] + 0.2, H[1] - 14.5], [H[0] + 0.1, H[1] - 14], [H[0] - 3.4, H[1] - 14]], P.goldHi)), F(T([[H[0] - 0.5, H[1] - 14.6], [H[0], H[1] - 18.6], [H[0] + 0.05, H[1] - 14.6]], P.goldHi)),
    F(T([[H[0] + 0.2, H[1] - 13.9], [H[0] + 3.4, H[1] - 13.9], [H[0] + 3.4, H[1] - 13.3], [H[0] + 0.2, H[1] - 13.3]], P.goldS)),
    F(E(H[0], H[1] - 13.9, 0.9, 0.8, '#ff6fa0')), F(E(H[0] - 0.3, H[1] - 14.2, 0.35, 0.3, '#ffffff')),
  ];
  out.push(...put(hand, tri));
  out.push(...put(upper, limbPts([[28, 21.4], [30.4, 23.8]], 2.4, P.skin)), ...put(fore, limbPts([[30.4, 23.8], [34.4, 22.8]], 2.3, P.skin)), ...put(hand, [...oE(35, 22.6, 1.6, 1.5, P.skin, 0.5), F(E(35.4, 22.1, 0.6, 0.5, P.hi))]));
  // The jab: a flat smear behind the prongs on the strike, a spark at full reach on the impact.
  const tip = ap(hand, H[0], H[1] - 19.6);
  if (ak && frame === 1 && !dead) fx.push(F(T([[tip[0] - 11, tip[1] - 2.2], [tip[0] - 1, tip[1] - 1.8], [tip[0] + 0.5, tip[1]], [tip[0] - 1, tip[1] + 1.8], [tip[0] - 11, tip[1] + 2.2], [tip[0] - 6, tip[1]]], '#fbe9ff')));
  if (ak && frame === 2 && !dead) fx.push(...burst(tip[0] + 1.2, tip[1], 4, '#d0607a', '#d0607a', 6, 0.3), ...burst(tip[0] + 1.2, tip[1], 3.3, '#fff1a8', '#ffffff', 6, 0.3));
  return { w: 46, h: 36, res: 3, shapes: [...out, ...fx] };
}

// ---------- Dullahan ----------
// A headless knight: ghost-fire rising from the empty collar, a swept cape, an upright sword, and
// its plumed helmet carried under one arm, burning slits glowing in the visor. Signature shape:
// the flame where a head should be, with the helmet held low at its side.
// Rig: pelvis (march bob) > legs (two-bone IK, feet planted on the ground and lifted in an arc) >
// torso (lean) > collar flame (chains) and cape (three hanging chains, root to hem) > arms
// (two-bone IK to a hand target) > the helmet riding the back hand and the sword the front hand.
const KNIGHT = {
  plateHi: '#f8faff', plate: '#bcc6ec', s1: '#8085c4', s2: '#5d5499', back: '#d6e4ff',
  suit: '#56498c', suitD: '#403670', gold: '#ffcd55', goldHi: '#fff4c4', goldS: '#cf8a3c',
  cape: '#7a5cc0', capeS: '#5e449f', lining: '#ff9ec0', plume: '#ff9ec0', plumeHi: '#ffd2e2', visor: '#211936',
  blade: '#eef3ff', bladeS: '#b6c1ea', grip: '#7a5a8a',
};
// Attack keys: hand targets and sword angle (radians from upright, clockwise), the helmet raised
// on the back hand, lean, crouch, and the flame's flare. A long wind-up with the sword cocked
// overhead, a fast chop (smear), the held impact with the tip at the ground, then the settle.
const DULL_ATK = [
  { hand: [27, 18.4], sw: -0.9, head: [10.6, 22.4], lean: -0.1, crouch: 1.2, fire: 1.4, dx: -1.2 },
  { hand: [34.4, 24], sw: 0.9, head: [10.4, 23], lean: 0.08, crouch: 0.4, fire: 1.15, dx: 0.6 },
  { hand: [33.6, 34.4], sw: 2.62, head: [10.6, 24], lean: 0.14, crouch: 2.4, fire: 1, dx: 1.2 },
  { hand: [32.6, 32.2], sw: 2.4, head: [10.8, 25], lean: 0.08, crouch: 1.4, fire: 1, dx: 0.8 },
];

// Two-bone IK: the joint between `a` and the end `b`, limbs l1 and l2 long, bending toward side
// `bend` (+1 bends the knee forward, toward +x, for a limb hanging down).
function ik(a, b, l1, l2, bend = 1) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, Math.hypot(dx, dy)));
  const ang = Math.atan2(dy, dx) - bend * Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  return [a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1];
}
// A foot in a walk cycle: planted and sliding back `stride` for `duty` of the cycle, then lifted
// and swung forward in an arc that rises quickly and sets down softly. Returns [dx, up].
function gait(p, stride, lift, duty = 0.52) {
  p = wrap(p);
  if (p < duty) return [stride / 2 - stride * (p / duty), 0];
  const t = (p - duty) / (1 - duty);
  return [-stride / 2 + stride * ease(t), lift * Math.sin(Math.PI * Math.pow(t, 0.8))];
}
// A segment's frame from point a toward point b (x along the segment).
const segF = (a, b) => joint(ID, a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0]));

function visorEyes(mood, P, look) {
  const out = [];
  const c = mood === 'angry' ? '#ff8fc0' : mood === 'dead' ? '#9a94b4' : '#86f0e6';
  const o = { c, bg: P.visor, shape: 'sharp', look: [look, 0], custom: { up: 0.8, dn: 0.55 } };
  const act = { angry: { slant: 0.9, lid: 0.15 }, happy: { closed: 'happy' }, blink: { closed: 'blink' }, hurt: { closed: 'squeeze' } }[mood] ?? {};
  if (mood === 'dead') out.push(...deadEye(10.9, 37.4, 0.8, { c, th: 0.5 }), ...deadEye(15, 37.2, 0.95, { c, th: 0.55 }));
  else out.push(...glowEye(10.8, 37.3, { ...o, ...act, s: -1, w: 1.35, h: 1.25 }), ...glowEye(15.1, 37.1, { ...o, ...act, s: 1, w: 1.7, h: 1.4 }));
  return out;
}

// The helmet, drawn at its rest place under the arm (pivot: where the hand holds it).
function helmet(mood, P, look, plumeA) {
  const h = [];
  const pl = chain(joint(ID, 9.4, 32), [2.6, 2.6, 2.4], plumeA);
  h.push(...oT(ribbonPts(pts(pl), [3.6, 3.4, 2.6, 0.8]), P.plume, 0.6), F(T(ribbonPts(pts(pl).slice(0, 3).map(([x, y]) => [x + 0.3, y - 0.5]), [1.3, 1.1, 0.5]), P.plumeHi)));
  // Bucket helm: shadow side, plate toward the light, then the bevel shine and a backlight rim.
  h.push(...oE(10.4, 38.2, 6.8, 6.6, P.s1), F(E(11.2, 37.4, 6, 5.8, P.plate)), F(T(ovalPts(12.6, 33.4, 3, 1.3, -0.2), P.plateHi)), ...stroke([[4.4, 40], [5.4, 43.4], [8, 44.6]], 0.67, P.back));
  h.push(...stroke([[5.6, 34.6], [10, 31.8], [14.6, 33.6]], 1.3, P.gold), ...stroke([[7.6, 33], [10, 31.6], [12.4, 32.2]], 0.5, P.goldHi));
  h.push(F(T([[8.2, 35], [17.6, 34.4], [17.8, 40], [8.6, 40.4]], P.visor)), ...stroke([[8.4, 35.1], [17.4, 34.5]], 0.7, P.plateHi), ...stroke([[13.2, 40.2], [13.2, 43.6]], 1, P.s1));
  h.push(...visorEyes(mood, P, look));
  for (const [x, y] of [[11.4, 41.8], [11.6, 43.2], [15, 41.8], [14.8, 43.2]]) h.push(F(E(x, y, 0.45, 0.45, P.visor)));
  return h;
}

function dullahan(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? DULL_ATK[frame] : null;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || !!ak;
  const P = KNIGHT;
  const u = ak ? frame / 4 : frame / (walk ? 8 : 6);
  const ph = u * TAU;
  const fl = angry ? ['#ff8fc0', '#ffd0e6', '#ffffff'] : dead ? ['#b8bfd0', '#dde1ea', '#f2f4f8'] : ['#7fe6e0', '#c8fbf4', '#ffffff'];
  // A heavy march: the pelvis drops just after each foot plants (walkBob), the armour settling a
  // beat later; standing, it breathes with a slow sideways sway.
  const br = breath(u);
  const bob = ak ? ak.crouch : walk ? 1.8 * (1 - walkBob(u)) : 0.6 * br;
  const sway = ak ? ak.dx : walk ? 0.4 * Math.sin(ph) : 0.45 * Math.sin(ph - 0.8);
  const hx = sway + (hurt ? -1.4 : 0);
  const clank = walk ? 0.6 * (1 - walkBob(u, 0.12)) : 0.3 * breath(u - 0.1);
  let lean = ak ? ak.lean : walk ? 0.06 + 0.02 * Math.sin(2 * ph - 1) : 0.02 * Math.sin(ph - 0.8);
  if (hurt) lean -= 0.16;
  if (dead) lean -= 0.1;
  const pelvis = move(ID, hx, bob + (dead ? 2 : 0));
  const torso = pivot(pelvis, 22, 42, lean);
  const out = [];
  const fxs = [];

  // Legs: feet planted on the ground (no sliding), knees from IK, the far leg in the back plate.
  const legs = [];
  const leg = (hipX, p, back) => {
    const hip = ap(pelvis, hipX, 44);
    let foot;
    let toe = 0;
    if (walk) {
      const [gx, up] = gait(p, 12, 3.2);
      foot = [hipX + 1 + gx, 55.6 - up];
      toe = up > 0.3 ? 0.25 : 0;
    } else if (ak) foot = [hipX + (back ? -4 : 5) + ak.dx * 0.3, 55.6];
    else if (dead) foot = [hipX + (back ? -1 : 3), 55.6];
    else foot = [hipX + (back ? -1.6 : 2.2) + hx * 0.2, 55.6];
    const knee = ik(hip, foot, 6.1, 6.1, 1);
    const pc = back ? P.s1 : P.plate;
    legs.push(...put(segF(hip, knee), limbPts([[0, 0], [6.1, 0]], 4.4, back ? P.suitD : P.suit)));
    legs.push(...put(segF(knee, foot), [...limbPts([[0, 0], [6.1, 0]], 4.6, pc), F(T([[0.6, -1.9], [5.6, -1.9], [5.6, -0.9], [0.6, -0.9]], back ? P.plate : P.plateHi))]));
    legs.push(...oE(knee[0] + 0.4, knee[1], 2.2, 1.9, back ? P.plate : P.plateHi, 0.5));
    // The sabaton stays flat while planted and tips its toe up as it swings through.
    legs.push(...put(pivot(move(ID, foot[0], foot[1]), 0, 0, -toe), [...oT([[-2.6, -0.8], [1.4, -1], [4.4, 1.6], [4, 2.4], [-2.6, 2.4]], pc, 0.5), F(T([[-2.2, -0.5], [1.2, -0.7], [2.8, 0.4], [-2.2, 0.4]], back ? P.plate : P.plateHi))]));
    if (walk && !dead && wrap(p) < 0.08) fxs.push(...dust(foot[0] + 1, 58, 0.55));
  };
  leg(19.4, u + 0.5, true);

  // Cape: hung from the shoulders on three chains that trail the march, each link a beat later.
  const capeAmp = dead ? 0 : walk ? 0.13 : ak ? 0.06 : 0.07;
  const cw = (k, i) => (ak ? [-0.25, 0.3, 0.45, 0.25][frame] * (0.3 + i * 0.25) : 0) + capeAmp * (0.4 + i * 0.3) * Math.sin(ph * (walk ? 2 : 1) - k * 0.6 - i * 0.8) + (walk ? 0.12 * i : 0);
  const capeChain = (x, y, k, l) => pts(chain(joint(torso, x, y, Math.PI / 2 + 0.42 + k * 0.1), [l, l, l, l * 0.8], [0, ...[1, 2, 3, 4].map((i) => cw(k, i) + 0.04 * i)]));
  const cb = capeChain(15, 24, 2, 7.4);
  const cm = capeChain(19, 24, 1, 7.2);
  const cf = capeChain(24, 24, 0, 6.6);
  const hem = [cb[4], [lerp(cb[4][0], cm[4][0], 0.5), lerp(cb[4][1], cm[4][1], 0.5) - 2.4], cm[4], [lerp(cm[4][0], cf[4][0], 0.5), lerp(cm[4][1], cf[4][1], 0.5) - 2], cf[4]];
  const capeP = [ap(torso, 27, 23), ap(torso, 15, 23.4), ...cb.slice(1, 4), ...hem, ...cf.slice(1, 4).reverse()];
  out.push(...oT(capeP, P.cape));
  // The back half lies in shadow; folds run parallel down from the shoulders, the lining shows at the hem.
  out.push(F(T([ap(torso, 15, 23.4), ...cb.slice(1, 5), hem[1], ...cm.slice(1, 4).reverse()], P.capeS)), ...stroke(cm.slice(1, 4), 0.67, P.capeS));
  out.push(F(T([hem[0], hem[1], hem[2], [cm[4][0] + 0.4, cm[4][1] - 1.4], [cb[4][0] + 0.6, cb[4][1] - 1.6]], P.lining)), F(T([hem[2], hem[3], hem[4], [cf[4][0] - 0.4, cf[4][1] - 1.2], [cm[4][0] + 0.6, cm[4][1] - 1.4]], step(P.lining, -0.08))));

  // Back arm (two-bone IK to the hand that carries the helmet).
  const headAt = ak ? ak.head : dead ? [12, 47.6] : hurt ? [13.6, 44] : [13.6, 45.4 + clank * 0.5];
  const bs = ap(torso, 15.4, 27);
  const bh = [headAt[0] - hx, headAt[1] - bob];
  const be = ik(bs, bh, 7.6, 7.2, ak ? 1 : -1);
  out.push(...put(segF(bs, be), limbPts([[0, 0], [7.6, 0]], 3.6, P.suitD)));

  // Breastplate: steel in three steps (shadow side, base, a cold bevel shine with a specular
  // pin) plus a backlight rim on the shadow edge; gold trim, belt, faulds swinging a beat late.
  const fs = walk ? 0.06 * Math.sin(2 * ph - 1.6) : ak ? [-0.06, 0.08, 0.12, 0.06][frame] : 0.03 * Math.sin(ph - 1.4);
  out.push(...put(pivot(torso, 22, 42.6, fs), [...oT([[15.6, 42.6], [28.6, 42.6], [30, 46.8], [14.2, 46.8]], P.s1, 0.5), F(T([[22, 42.8], [28.6, 42.8], [29.8, 46.4], [22.2, 46.4]], P.plate)), F(T([[14.6, 45.6], [29.6, 45.6], [30, 46.8], [14.2, 46.8]], P.gold)), F(T([[22.6, 45.7], [29.4, 45.7], [29.5, 46.1], [22.6, 46.1]], P.goldHi))]));
  const bp = [[15, 25], [29, 25], [30.6, 31], [28.6, 38], [27.4, 41], [16.6, 41], [15.4, 38], [13.8, 31]];
  out.push(...put(torso, [...oT(bp, P.plate), F(T([[15, 25], [19, 25], [18, 33], [18.6, 41], [16.6, 41], [15.4, 38], [13.8, 31]], P.s1)), F(T([[14.4, 31], [15.4, 37.6], [16.4, 40.4], [15.6, 37.6]], P.back)),
    F(T([[24.4, 26], [28.6, 26], [29.8, 31], [27.6, 34.4], [25.6, 31]], P.plateHi)), F(T([[26.8, 35.4], [28.2, 35.6], [27.2, 39], [26.2, 38.6]], P.plateHi)), F(E(27.4, 28, 0.5, 0.5, '#ffffff')),
    ...stroke([[21.6, 26], [22.2, 33], [21.8, 40.4]], 0.67, P.s1), F(T([[22.4, 30.4], [24, 32.4], [22.4, 34.6], [20.8, 32.4]], P.gold)), F(T([[22.4, 30.6], [23.4, 31.8], [22.4, 32.4]], P.goldHi)),
    ...oT([[16.2, 40.2], [27.8, 40.2], [28, 42.6], [16, 42.6]], P.suit, 0.5), F(T([[20.8, 40], [24, 40], [24, 42.8], [20.8, 42.8]], P.gold)), F(E(22.4, 41.4, 0.7, 0.6, P.suitD))]));
  // Back pauldron, bouncing a beat late on its strap.
  out.push(...put(move(torso, 0, clank * 0.7), [...oE(15, 26.6, 4.4, 3.8, P.s1), F(E(15.6, 25.9, 3.6, 3, P.plate)), F(T(ovalPts(16.4, 24.4, 1.8, 0.8, -0.2), P.plateHi))]));

  // The empty collar and its ghost-fire: three chained tongues, root leading, tips licking after.
  const fk = (angry ? 1.2 : dead ? 0.35 : 1) * (ak ? ak.fire / 1.2 : 1);
  const fLean = (walk ? -0.35 : -0.1) + (hurt ? -0.45 : 0) + (ak ? [0.3, -0.5, -0.35, -0.2][frame] : 0);
  const tongue = (bx, len, w, ph0, c, inner) => {
    const L = len * fk;
    const fr = chain(joint(torso, bx, 25, -Math.PI / 2), [L * 0.36, L * 0.34, L * 0.3], wave(3, 0, dead ? 0.02 : 0.15, ph * 2 + ph0, 0.9).map((a, i) => a + fLean * (i ? 0.4 + i * 0.3 : 0.3)));
    const p = pts(fr);
    const o = [T(ribbonPts(p, [w, w * 0.78, w * 0.42, 0.3]), c)];
    if (inner) o.push(F(T(ribbonPts(p.slice(0, 3).map(([px, py]) => [px + 0.4, py + 0.4]), [w * 0.55, w * 0.38, 0.3]), inner)));
    return o;
  };
  out.push(...put(torso, [...oE(22, 25.2, 6.8, 2.8, P.plateHi, 0.5), F(E(22, 24.7, 5, 1.7, P.visor))]));
  out.push(...tongue(18.6, 8, 4.6, 2, fl[0], fl[1]), ...tongue(25.4, 7.4, 4, 4, fl[0], fl[1]), ...tongue(22, 15, 9.4, 0, fl[0], fl[1]));
  if (!dead) out.push(F(T(flamePts(...ap(torso, 22.5, 25), 3, 6 * fk, fLean * 3), fl[2])));
  out.push(...put(torso, [...stroke([[16.4, 26.6], [22, 28.1], [27.6, 26.6]], 0.67, P.gold)]));

  // The helmet rides the back hand, tipping a little after the arm (it's heavy). The forearm
  // passes behind it and the gauntlet wraps its underside.
  const look = ak ? 0.5 : walk ? 0.3 : 0.6 * Math.sin(ph);
  const tip = ak ? [0.15, -0.1, -0.2, -0.05][frame] : dead ? 0.5 : hurt ? -0.25 : walk ? 0.06 * Math.sin(2 * ph - 2.2) : 0.04 * Math.sin(ph - 1.6);
  const plumeA = wave(3, 0, dead ? 0.02 : walk ? 0.22 : 0.1, ph * (walk ? 2 : 1) - 1.2, 0.8).map((a, i) => a + [Math.PI - 0.5, -0.3, 0.2, 0.3][i] + (ak ? [0.3, -0.4, -0.5, -0.2][frame] * (i ? 1 : 0) : 0));
  const grip = pivot(move(ID, headAt[0] - 13.6, headAt[1] - 45.4), 13.6, 45.4, tip);
  out.push(...put(segF(be, headAt), limbPts([[0, 0], [Math.hypot(headAt[0] - be[0], headAt[1] - be[1]), 0]], 3.2, P.suit)));
  out.push(...put(grip, helmet(dead ? 'dead' : mood === 'idle' && ak ? 'angry' : mood, P, look, plumeA)));
  out.push(...put(grip, [...oT([[9.6, 43.2], [14.6, 44.6], [15.6, 46.8], [10.4, 46.6], [8.6, 45]], P.s1, 0.5), F(T([[10.2, 43.6], [14.4, 44.8], [14.2, 45.6], [10, 45]], P.plate))]));

  // The near leg, over the faulds.
  leg(25, u, false);
  out.push(...legs);
  legs.length = 0;

  // The sword arm: IK from the shoulder to the hand target; the sword rides the hand.
  const hand2 = ak ? ak.hand : dead ? [33.4, 42] : hurt ? [33, 36] : [35.2 + (walk ? -1.1 * Math.sin(ph) : 0.3 * Math.sin(ph - 1)), 37 + (walk ? 0.4 * Math.cos(2 * ph) : 0.4 * br)];
  const sw = ak ? ak.sw : dead ? 1.3 : hurt ? -0.2 : 0.2 + (walk ? 0.08 * Math.sin(ph - 0.6) : 0.04 * Math.sin(ph - 1.2)) + (angry ? -0.12 : 0);
  const sShoulder = ap(torso, 30.4, 29);
  const hT = [hand2[0] + (ak ? 0 : hx * 0), hand2[1]];
  const sEl = ik(sShoulder, hT, 5.4, 5.2, -1);
  // The chop's smear: a flat crescent along the blade's arc, hard at the leading edge.
  if (ak && (frame === 1 || frame === 2) && !dead) {
    // The swept band between the hilt and the tip, thickest at the blade (its leading edge).
    const [a0, a1] = frame === 1 ? [-0.5, 0.9] : [1.3, 2.62];
    const pt = (a, r) => [hT[0] + Math.sin(a) * r, Math.min(57.4, hT[1] - Math.cos(a) * r)];
    const outer = [];
    const inner = [];
    for (let i = 0; i <= 6; i++) {
      const a = a0 + ((a1 - a0) * i) / 6;
      outer.push(pt(a, 25));
      inner.unshift(pt(a, 25 - 2 - (i / 6) * 13));
    }
    fxs.push(F(T([...outer, ...inner], '#ebe2ff')), F(T([...outer.slice(3), ...inner.slice(0, 4)], '#fbf8ff')));
  }
  const sword = [
    ...oE(0, 3.4, 1.3, 1.3, P.lining, 0.5),
    ...oT([[-0.8, 2.4], [0.8, 2.4], [0.8, -1.6], [-0.8, -1.6]], P.grip, 0.5),
    ...oT([[-1.6, -2.8], [1.6, -2.8], [1.6, -22.6], [0, -26.4], [-1.6, -22.6]], P.blade, 0.5),
    // Steel: the far bevel in shadow, a fuller line, and a specular glint on the lit edge.
    F(T([[0.1, -2.8], [1.6, -2.8], [1.6, -22.6], [0.1, -25.6]], P.bladeS)), ...stroke([[-0.5, -4], [-0.5, -21]], 0.5, '#ffffff'), F(T(starPts(-0.9, -17 + (ak ? frame * 3 : walk ? 2 * Math.sin(ph) : 0), 1, 4, 0.35), '#ffffff')),
    ...oT([[-4.2, -1.4], [4.2, -1.4], [3.4, -2.9], [-3.4, -2.9]], P.gold, 0.5), F(T([[-3.6, -2.7], [0, -2.7], [0, -2.2], [-3.8, -2.2]], P.goldHi)),
    F(E(-4.3, -2.4, 0.7, 0.7, P.gold)), F(E(4.3, -2.4, 0.7, 0.7, P.goldS)),
  ];
  out.push(...put(joint(ID, hT[0], hT[1], sw), sword));
  out.push(...put(segF(sShoulder, sEl), limbPts([[0, 0], [5.4, 0]], 3.2, P.suit)), ...put(segF(sEl, hT), [...limbPts([[0, 0], [5.2, 0]], 3.8, P.plate), F(T([[0.6, -1.5], [4.6, -1.5], [4.6, -0.8], [0.6, -0.8]], P.plateHi))]));
  out.push(...oE(sEl[0], sEl[1], 1.8, 1.6, P.plateHi, 0.5), ...oE(hT[0], hT[1] - 0.2, 2.1, 2, P.s1), F(E(hT[0] + 0.4, hT[1] - 0.8, 1.2, 0.8, P.plate)));
  // Front pauldron, layered and gold-rimmed, bouncing a beat late.
  out.push(...put(move(torso, 0, clank * 0.6), [...oE(29.6, 26.8, 5.2, 4.4, P.s1), F(E(30.2, 26.2, 4.5, 3.7, P.plate)), arc(29.6, 27.4, 5, 3.8, 15, 165, 0.8, P.gold), F(T(ovalPts(31, 24.4, 2.4, 1, -0.2), P.plateHi)), F(E(32, 24.2, 0.45, 0.45, '#ffffff'))]));
  if (ak && frame === 2 && !dead) fxs.push(...burst(42, 54.6, 4, '#8a5aa8', '#8a5aa8', 6, 0.4), ...burst(42, 54.6, 3.4, '#fff3b0', '#ffffff', 6, 0.4), ...dust(39, 58, 0.8));
  return { w: 44, h: 58, res: 3, shapes: [...out, ...fxs] };
}

// ---------- Gem Mimic ----------
// A treasure chest that hops on stubby legs: one big gem eye set in the lid, crystal teeth, a long
// lolling tongue, crystals sprouting from its lid, and gems spilling out of its mouth. Signature
// shape: the box with its lid hinged open on a row of fangs.
// Rig: the box (squash and stretch about its base, hop lift, tilt) > lid (hinge at the back) >
// eye, crystals, fangs; box > tongue (chain from the mouth, lagging the hop) and four legs
// (two-bone IK: feet planted while it's down, tucked in the air).
const HOP = [
  { sq: 0.86, lift: 0, lid: 0.04, air: 0, slide: 0 },
  { sq: 0.95, lift: 0, lid: 0.12, air: 0, slide: -2.6 },
  { sq: 1.1, lift: 1.3, lid: 0.3, air: 0.35, slide: -4.2 },
  { sq: 1.05, lift: 3.5, lid: 0.5, air: 1, slide: 0 },
  { sq: 1, lift: 4.3, lid: 0.58, air: 1, slide: 0 },
  { sq: 1, lift: 3.6, lid: 0.5, air: 1, slide: 0 },
  { sq: 1.06, lift: 1.6, lid: 0.3, air: 0.6, slide: 0 },
  { sq: 0.8, lift: 0, lid: 0.02, air: 0, slide: 2.6 },
];
// Idle: it breathes through its lid, a slow gape and a quicker close, with a sideways shuffle.
const MIMIC_IDLE = [
  { sq: 1, lift: 0, lid: 0.12, air: 0, dx: 0 },
  { sq: 0.985, lift: 0, lid: 0.18, air: 0, dx: 0.3 },
  { sq: 0.97, lift: 0, lid: 0.25, air: 0, dx: 0.5 },
  { sq: 0.965, lift: 0, lid: 0.28, air: 0, dx: 0.4 },
  { sq: 1.02, lift: 0, lid: 0.1, air: 0, dx: -0.2 },
  { sq: 1.01, lift: 0, lid: 0.08, air: 0, dx: -0.3 },
];
const MIMIC_ATK = [
  { sq: 0.8, lift: 0, lid: 0.07, air: 0, dx: -2.4, tilt: -0.07, slide: 1.6 },
  { sq: 1.07, lift: 1.4, lid: 0.6, air: 0.8, dx: 2, tilt: 0.05 },
  { sq: 0.86, lift: 0.4, lid: 0.02, air: 0.25, dx: 3, tilt: 0.03 },
  { sq: 1.02, lift: 0, lid: 0.26, air: 0, dx: 1, tilt: 0, slide: -1 },
];
const CHEST = {
  woodHi: '#f4c99c', wood: '#dc9e70', woodS: '#b9765a', woodS2: '#8c5258', gold: '#fbcd55', goldHi: '#fff4c2', goldS: '#c98a3c',
  leg: '#b58ad8', legHi: '#d4b8ef', legS: '#8a66b8', tongue: '#ff8fb3', tongueS: '#df628f', mouth: '#43213e', lash: '#4a2440',
  iris: ['#106a86', '#3fcbe6', '#ccfaff'], gems: [['#8fe6ff', '#4fa8d8', '#e8fdff'], ['#c4a8ff', '#8a6ad6', '#f2ebff'], ['#ffadd8', '#d86aa8', '#ffe8f4']],
};

// A gem crystal growing from (x, y), w wide and h long, tilted from upright. Transparent: the
// facet facing the light is the darkest, the far facet glows (light passes through), a glint sits
// at the tip, and the line is the gem's own deep hue.
function gem(x, y, w, h, tilt, [c, dk, lt]) {
  const m = joint(ID, x, y, tilt);
  const tf = (p) => p.map(([px, py]) => ap(m, px, py));
  const body = [[-w / 2, 0], [-w / 2, -h * 0.72], [0, -h], [w / 2, -h * 0.72], [w / 2, 0]];
  return [
    F(T(tf(grow(body, 0.6)), mix(dk, '#2a1850', 0.35))), T(tf(body), c),
    F(T(tf([[0, -h], [w / 2, -h * 0.72], [w / 2, 0], [w * 0.08, 0], [w * 0.08, -h * 0.7]]), dk)),
    F(T(tf([[-w / 2 + 0.5, -h * 0.1], [-w * 0.08, -h * 0.1], [-w * 0.08, -h * 0.66], [-w / 2 + 0.5, -h * 0.62]]), lt)),
    F(T(tf([[0, -h + 0.2], [w * 0.2, -h * 0.84], [0, -h * 0.76], [-w * 0.2, -h * 0.84]]), '#ffffff')),
  ];
}

function gemEye(x, y, mood, look) {
  const P = CHEST;
  const out = [];
  // The gold bezel, three steps: a warm shadow, the base, and a bright bevel on the lit top edge.
  const shut = ['happy', 'blink', 'hurt', 'dead'].includes(mood);
  out.push(F(E(x, y, 4.3, 3.8, P.goldS)), F(E(x + 0.2, y - 0.2, 4, 3.5, P.gold)), arc(x + 0.2, y - 0.1, 3.9, 3.4, 200, 300, 0.67, P.goldHi), F(E(x, y, 3.4, 3, shut ? P.wood : P.woodS2)));
  const act = { angry: { lid: 0.3, slant: 0.7, raise: 0.2, pupilK: 0.7 }, happy: { closed: 'happy' }, blink: { closed: 'blink' }, hurt: { closed: 'squeeze' } }[mood] ?? {};
  if (mood === 'dead') out.push(...deadEye(x, y, 2, { c: P.lash, type: 'swirl' }));
  else out.push(...eye(x, y, { shape: 'round', iris: mood === 'angry' ? ['#7a1032', '#ff4d7a', '#ffc2d0'] : P.iris, pupil: 'slit', sclera: '#fff8ec', lashC: P.lash, flicks: 0, irisW: 0.72, look: [look, 0], ...act, w: 3.1, h: 2.7 }));
  out.push(...brow(x - 0.2, y - 4.5 - (mood === 'hurt' ? -0.4 : 0), { len: 2.6, angle: mood === 'angry' ? 0 : mood === 'hurt' ? -6 : 4, arch: mood === 'angry' ? -0.6 : 0.5, th: 0.7, c: P.woodS2, shape: 'flat' }));
  return out;
}

function mimic(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack';
  const st = (walk ? HOP : ak ? MIMIC_ATK : MIMIC_IDLE)[frame];
  const u = frame / (walk ? 8 : 6);
  const ph = u * TAU;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const P = CHEST;
  const mood0 = ak ? 0 : angry ? 0.2 : hurt ? -0.12 : dead ? 0.22 : mood === 'happy' ? 0.1 : 0;
  const lid = Math.min(ak ? 0.72 : 0.62, Math.max(0.02, st.lid + mood0));
  const sy = st.sq * (hurt ? 0.9 : dead ? 0.92 : 1);
  const sx = 1 + (1 - sy) * 0.8;
  const lift = st.lift;
  const tilt = (st.tilt ?? 0) + (hurt ? -0.1 : 0) + (dead ? 0.08 : 0);
  const dx = (st.dx ?? 0) + (hurt ? -1.4 : 0);
  const H = [5.6, 21];
  // The box: squashed about its base, lifted by the hop, tipped about its bottom centre.
  const box = pivot(move(ID, dx, -lift), 20, 31, tilt, 1, 1);
  const B = mul(box, [sx, 0, 0, sy, 20 - 20 * sx, 31 - 31 * sy]);
  const out = [];
  const look = walk ? 0.6 : ak ? 0.8 : [0, 0.8, 0.8, 0, -0.8, -0.8][frame];

  // Legs: two-bone IK from the hips under the box to the feet, planted while it's down (they
  // slide back as the box moves on), tucked and dangling in the air.
  const legAt = (x, back) => {
    const hip = ap(B, x, 30.4);
    const sl = st.slide ?? 0;
    const foot = st.air ? [hip[0] - 1.6 * st.air + sl, hip[1] + 4.2 - st.air * 0.6] : [hip[0] + (back ? -1.2 : 1.2) * (1.6 - sy) + sl, 34.8];
    const knee = ik(hip, foot, 2.7, 2.7, st.air ? -1 : 1);
    const c = back ? P.legS : P.leg;
    out.push(...limb([hip, knee, foot], 2.6, c, 0.6), ...oE(foot[0] + 0.4, foot[1] + 0.1, 2.1, 1.1, c, 0.6), F(E(foot[0] + 0.8, foot[1] - 0.3, 1.1, 0.4, back ? P.leg : P.legHi)));
    for (const k of [-1, 0, 1]) out.push(F(E(foot[0] + 1.5 + k * 0.9, foot[1] + 0.8, 0.4, 0.4, '#fff6ee')));
  };
  legAt(10, true);
  legAt(28, true);
  legAt(12.6, false);
  legAt(30.6, false);

  const chest = [];
  const lidF = pivot(B, H[0], H[1], -lid);
  // The mouth's inside and the treasure glinting in it.
  chest.push(...put(B, [F(T([H, [32.2, 21.4], [6, 21.4]], P.mouth))]));
  chest.push(F(T([ap(B, ...H), ap(lidF, 32.4, 21), ap(B, 32.2, 21.4), ap(B, 6, 21.4)], P.mouth)));
  chest.push(...put(B, [F(E(20, 21, 6, 1.6 + lid * 2, '#ffcf5a')), F(E(16, 20.4, 1.2, 1.2, '#8fe6ff')), F(E(24.6, 20.2, 1, 1, '#ff9ed2')), F(E(19.6, 19.8, 0.7, 0.7, '#fff6c9'))]));
  // Tongue: a chain lolling from the mouth, flapping a beat behind the hop, lashing in the lunge.
  const tl = dead ? 1.15 : hurt ? 0.5 : 1;
  const lash = ak && frame === 1 && !dead;
  const tA = lash ? [-0.1, -0.12, -0.05, 0.1, 0.35, 0.6] : wave(5, 0, dead ? 0 : walk ? 0.18 : 0.1, ph * (walk ? 1 : 1) - 1.4, 0.8).map((a, i) => a + [-0.05, 0.12, 0.5, 0.45, 0.35, 0.3][i] * tl + (walk ? -(st.air ?? 0) * 0.15 * i : 0));
  if (!(ak && frame === 2)) {
    const tg = chain(joint(B, 24, 20.6), lash ? [4.4, 4.2, 3.2, 2.2, 1.4] : [4.2, 3.8, 2.6, 2.4, 1.8].map((l) => l * tl), tA);
    const tp = pts(tg);
    chest.push(...oT(ribbonPts(tp, [3.6, 3.6, 3.4, 3, 2.6, 1.8]), P.tongue, 0.6), ...stroke(tp.slice(1, 5).map(([x, y]) => [x, y + 0.1]), 0.6, P.tongueS), ...put(tg[5], [F(E(0.6, 0, 1.4, 1.1, P.tongue))]));
  }
  // Base: planks with grain, gold straps (three-step metal), a hasp lock at the front.
  const base = [];
  base.push(...oT([[6, 21], [32, 21], [32, 31], [6, 31]], P.wood));
  base.push(F(T([[6, 21], [9, 21], [9, 31], [6, 31]], P.woodS)), ...stroke([[6.4, 25.8], [31.6, 25.8]], 0.67, P.woodS2), F(T([[9, 21.4], [31.6, 21.4], [31.6, 22.4], [9, 22.4]], P.woodHi)));
  base.push(...stroke([[14, 23.4], [18.6, 23.6], [24, 23.3]], 0.4, P.woodS), ...stroke([[13.6, 28.2], [20, 28], [24.6, 28.3]], 0.4, P.woodS));
  for (const x of [10, 26.4]) base.push(F(T([[x, 21], [x + 2.6, 21], [x + 2.6, 31], [x, 31]], P.gold)), F(T([[x, 21], [x + 0.7, 21], [x + 0.7, 31], [x, 31]], P.goldS)), F(T([[x + 1.6, 21], [x + 2.2, 21], [x + 2.2, 29], [x + 1.6, 29]], P.goldHi)), F(E(x + 1.3, 23.4, 0.45, 0.45, '#fff6c2')), F(E(x + 1.3, 28.6, 0.45, 0.45, '#fff6c2')));
  base.push(F(T([[6, 29.4], [32, 29.4], [32, 31], [6, 31]], P.gold)), F(T([[6, 29.4], [32, 29.4], [32, 29.9], [6, 29.9]], P.goldHi)), F(T([[6, 30.5], [32, 30.5], [32, 31], [6, 31]], P.goldS)));
  base.push(...oT([[31, 21.2], [34, 21.2], [34, 25.4], [31, 25.4]], P.gold, 0.5), F(T([[33.2, 21.4], [33.8, 21.4], [33.8, 25.2], [33.2, 25.2]], P.goldHi)), F(E(32.5, 22.8, 0.6, 0.6, '#5a3a3a')), F(T([[32.2, 23], [32.8, 23], [32.7, 24.4], [32.3, 24.4]], '#5a3a3a')));
  // Crystal teeth on the base rim, sized to how far the mouth gapes.
  const cap = ak ? 4.6 : angry ? 3.4 : 2.8;
  const gape = (x) => (x - H[0]) * Math.sin(lid);
  for (let x = 13; x <= 31; x += 3) {
    const h = Math.min(cap, gape(x) * 0.42);
    if (h > 0.5) base.push(...oT([[x - 1.2, 21.2], [x, 21.2 - h], [x + 1.2, 21.2]], x % 2 ? '#d2f6ff' : '#eee2ff', 0.4), F(T([[x, 21.2 - h], [x + 1.2, 21.2], [x + 0.3, 21.2]], x % 2 ? '#8fcbe6' : '#b9a6e6')));
  }
  chest.push(...put(B, base));
  // Lid: planks, straps, crystals, the gem eye; it swings open about the back hinge.
  const lidS = [];
  lidS.push(...gem(11.2, 14, 3.6, 7.4, -0.4, P.gems[0]), ...gem(16.2, 13.4, 4.4, 9, -0.12, P.gems[1]), ...gem(20.8, 13.4, 3, 5.6, 0.22, P.gems[2]));
  lidS.push(...oT([[5.6, 21], [5.6, 16], [7.4, 14], [12, 13], [26, 13], [30.6, 14], [32.4, 16], [32.4, 21]], P.wood));
  lidS.push(F(T([[5.6, 21], [5.6, 16], [7.4, 14], [9.4, 13.6], [9.4, 21]], P.woodS)), F(T([[12, 13.2], [26, 13.2], [30.4, 14.2], [31.6, 15.6], [24, 15], [12, 14.4]], P.woodHi)));
  for (const x of [10, 26.4]) lidS.push(F(T([[x, 13.2], [x + 2.6, 13.1], [x + 2.6, 21], [x, 21]], P.gold)), F(T([[x, 13.2], [x + 0.7, 13.2], [x + 0.7, 21], [x, 21]], P.goldS)), F(T([[x + 1.6, 13.2], [x + 2.2, 13.2], [x + 2.2, 19.4], [x + 1.6, 19.4]], P.goldHi)), F(E(x + 1.3, 15.4, 0.45, 0.45, '#fff6c2')));
  lidS.push(F(T([[5.6, 19.6], [32.4, 19.6], [32.4, 21], [5.6, 21]], P.gold)), F(T([[5.6, 19.6], [32.4, 19.6], [32.4, 20.1], [5.6, 20.1]], P.goldHi)));
  // Fangs along the lid's lip.
  for (let x = 14.5; x <= 31; x += 3) {
    const h = Math.min(cap, gape(x) * 0.42);
    if (h > 0.5) lidS.push(...oT([[x - 1.2, 21], [x, 21 + h], [x + 1.2, 21]], x % 2 ? '#eee2ff' : '#d2f6ff', 0.4), F(T([[x, 21 + h], [x + 1.2, 21], [x + 0.3, 21]], x % 2 ? '#b9a6e6' : '#8fcbe6')));
  }
  lidS.push(F(E(19.6, 16.6, 6.6, 4, P.wood)));
  lidS.push(...gemEye(19.6, 16.4, ak && mood === 'idle' ? 'angry' : mood, look));
  chest.push(...put(lidF, lidS));
  // Gems tumbling out mid-hop.
  if (walk && st.air > 0.9 && !dead) {
    const g = (frame - 3) / 2;
    chest.push(...gem(34 + g * 2.4, 18.8 - g * 2, 2.2, 3.4, 0.3 + g, P.gems[0]), ...oE(31 + g * 2, 15 - g * 3, 0.9, 0.9, P.gold, 0.5));
  }
  out.push(...chest);
  const fxs = [];
  if (ak && frame === 2 && !dead) fxs.push(...burst(35.4, 19.6, 4.2, '#b0507a', '#b0507a', 7, 0.2), ...burst(35.4, 19.6, 3.6, '#fff3b0', '#ffffff', 7, 0.2), ...streaks([[36.6, 14, 38.6, 12.4], [37.8, 17.4, 39.6, 16.6], [37.4, 24.6, 39.4, 25.6]], '#ffffff', 0.67));
  if (walk && frame === 7 && !dead) fxs.push(...dust(10, 35, 0.5), ...dust(31, 35, 0.5));
  return { w: 40, h: 40, res: 3, shapes: put(move(ID, 0, 4), [...out, ...fxs]) };
}

// ---------- Crystal Golem ----------
// A hulking lavender-stone golem: crystal clusters on its back and shoulders, a pulsing gem core in
// a rune socket, a little head sunk between its shoulders with glowing socket lights, and huge
// faceted fists. Signature shape: a hunched boulder with a crown of crystals and two hanging fists.
// Rig: pelvis (a slow stomp that drops onto each planted foot) > legs (two-bone IK, feet planted) >
// torso (lean) > back crystals, head (nods a beat after the stomp), core; torso > both arms
// (two-bone IK from the shoulder boulder to the fist; the shoulder leads, the fist arrives late).
const ROCK = { hi: '#dcd5f2', base: '#a89fcb', s1: '#7f75ae', s2: '#5a5088', edge: '#ece6fb', socket: '#2e2748' };
const GEM_C = [['#8fe6ff', '#4ca6d6', '#e8fdff'], ['#c4a8ff', '#8a6ad6', '#f2ebff'], ['#ffadd8', '#d86aa8', '#ffe8f4']];
// Attack keys: fist targets (back, front), body offset, the head's nod. A long, readable wind-up
// with both fists raised overhead, the downward smash, the held impact on the ground, the settle.
const GOLEM_ATK = [
  { bx: -1.6, by: -0.6, back: [36, 10], front: [50, 9.6], nod: -1.2, lean: -0.08 },
  { bx: 0.6, by: 0.6, back: [44, 36], front: [61, 41], nod: 0.6, lean: 0.05 },
  { bx: 1.4, by: 3, back: [52, 63], front: [61.6, 64], nod: 1.6, lean: 0.1 },
  { bx: 0.8, by: 1.6, back: [46, 58], front: [60, 59], nod: 0.8, lean: 0.06 },
];

// A chunky faceted fist centred on its local origin: the lit facet to the upper front, the shadow
// facet low at the back, knuckle cracks with a light lip (light catches fracture edges).
function fist(c, P, k = 1) {
  const o = [[-7, -2], [-4.6, -6], [1, -6.8], [6, -4.6], [7.6, 0.4], [5.4, 5.4], [-1, 6.6], [-6, 4]].map(([x, y]) => [x * k, y * k]);
  return [
    ...oT(o, c), F(T([o[0], o[7], o[6], [-1.4 * k, 2.6 * k], [-4 * k, 0]], P.s2 === c ? P.s2 : step(c, -0.16))),
    F(T([o[2], o[3], o[4], [3.4 * k, -0.6 * k], [0.6 * k, -3.6 * k]], c === P.s1 ? P.base : P.hi)),
    ...stroke([[-1.4 * k, -6.4 * k], [-0.6 * k, 0.6 * k], [-1.6 * k, 6 * k]], 0.67, P.s2), ...stroke([[-0.8 * k, -6.2 * k], [0, 0.4 * k]], 0.4, P.edge),
    ...stroke([[3 * k, -5.6 * k], [3.6 * k, 4.6 * k]], 0.67, P.s2),
  ];
}

function golem(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? GOLEM_ATK[frame] : null;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || !!ak;
  const P = ROCK;
  const u = ak ? frame / 4 : frame / (walk ? 8 : 6);
  const ph = u * TAU;
  const glow = angry ? '#ff7fb0' : dead ? '#a59dbd' : '#86f0ff';
  const coreC = angry ? '#ff5f9a' : dead ? '#b4aec6' : '#ff8fca';
  // A slow, ground-shaking stomp; standing, it breathes with a heavy sideways sway.
  const br = breath(u);
  const bob = ak ? ak.by : walk ? 2.4 * (1 - walkBob(u)) : 0.8 * br;
  const hx = (hurt ? -1.8 : 0) + (ak ? ak.bx : walk ? 0.6 * Math.sin(ph) : 0.5 * Math.sin(ph - 0.8));
  const lean = (ak ? ak.lean : walk ? 0.03 * Math.sin(ph) : 0.015 * Math.sin(ph - 0.8)) + (hurt ? -0.1 : 0) + (dead ? -0.06 : 0);
  const pelvis = move(ID, hx, bob + (dead ? 2 : 0));
  const torso = pivot(pelvis, 37, 55, lean);
  const out = [];
  const up = [];
  const fxs = [];

  // Legs: short and thick, two-bone IK to feet planted on the ground.
  const legs = [];
  const leg = (hipX, p, back) => {
    const c = back ? P.s1 : P.base;
    const hip = ap(pelvis, hipX, 55);
    let foot;
    let up2 = 0;
    if (walk) {
      const [gx, l] = gait(p, 15, 3.6);
      foot = [hipX + 1.6 + gx, 70.8 - l];
      up2 = l;
    } else if (ak) foot = [hipX + (back ? -3 : 4) * (frame ? 1 : 0.6), 70.8];
    else foot = [hipX + 1.6 + (back ? -1 : 1) + hx * 0.2, 70.8];
    const knee = ik(hip, foot, 8.4, 8.4, 1);
    legs.push(...limb([hip, knee, foot], 10.4, c), F(T([[knee[0] - 1, knee[1] - 3], [knee[0] + 4, knee[1] - 2.6], [knee[0] + 3, knee[1] + 1.4]], back ? P.base : P.hi)));
    legs.push(...oT([[foot[0] - 5.2, 74 - up2], [foot[0] - 4.6, 69.6 - up2], [foot[0] + 3.4, 69 - up2], [foot[0] + 8.6, 72 - up2], [foot[0] + 8.8, 74 - up2]], c), F(T([[foot[0] - 4, 70 - up2], [foot[0] + 3.4, 69.6 - up2], [foot[0] + 7, 71.6 - up2], [foot[0] + 1, 71.4 - up2]], back ? P.base : P.hi)));
    legs.push(...stroke([[foot[0] + 4.2, 71.8 - up2], [foot[0] + 4.4, 73.6 - up2]], 0.67, P.s2), ...stroke([[foot[0] + 6.4, 72 - up2], [foot[0] + 6.6, 73.6 - up2]], 0.67, P.s2));
    if (walk && !dead && wrap(p) < 0.08) fxs.push(...dust(foot[0] + 1.6, 74, 1.1), ...oT([[foot[0] - 7, 69], [foot[0] - 5.8, 68], [foot[0] - 5.4, 69.6]], P.s1, 0.4), ...oT([[foot[0] + 10, 68.4], [foot[0] + 11.2, 67.6], [foot[0] + 11.4, 69]], P.s1, 0.4));
  };
  leg(28, u + 0.5, true);
  out.push(...legs);
  legs.length = 0;

  // Back crystal cluster (rides the torso).
  up.push(...put(torso, [...gem(13, 33, 4.4, 11, -0.95, GEM_C[0]), ...gem(18, 27, 5.4, 18, -0.5, GEM_C[0]), ...gem(24, 23, 6.4, 21, -0.18, GEM_C[1]), ...gem(30, 20.6, 4.6, 13, 0.15, GEM_C[2])]));
  // Back arm: IK from the shoulder to the fist; it swings opposite the near leg.
  const swing = walk ? Math.sin(ph - 0.6) * 4.6 : Math.sin(ph - 1) * 0.6;
  const bF = ak ? ak.back : dead ? [12, 63] : hurt ? [10, 58] : [12.4 + swing, 60.4 - Math.abs(swing) * 0.25 + br * 0.6];
  const bS = ap(torso, 21, 33);
  const bE = ik(bS, [bF[0] - hx, bF[1] - bob], 13.6, 13.6, ak && frame === 0 ? 1 : -1);
  const bFist = [bF[0] - hx, bF[1] - bob];
  up.push(...put(segF(bS, bE), limbPts([[0, 0], [13.6, 0]], 9.4, P.s1)), ...put(segF(bE, bFist), limbPts([[0, 0], [13.6, 0]], 9, P.s1)), ...put(joint(ID, bFist[0], bFist[1], ak ? 1 : 0.2), fist(P.s1, P, 0.95)));
  // Torso boulder: shadow facet at the back, lit facet up front, fracture lines with light lips.
  const torsoS = [[15, 32], [21, 21], [33, 16.4], [47, 17.6], [57, 25], [60, 39], [56.4, 51], [46, 58], [28, 58], [18.6, 52], [14.4, 42]];
  const tb = [...oT(torsoS, P.base)];
  tb.push(F(T([[15, 32], [21, 21], [25, 19.4], [21, 30], [20, 42], [25, 52], [34, 58], [28, 58], [18.6, 52], [14.4, 42]], P.s1)), F(T([[18.6, 52], [25, 52], [34, 58], [28, 58]], P.s2)));
  tb.push(F(T([[33, 16.4], [47, 17.6], [57, 25], [58.4, 31], [50, 25.6], [40, 21]], P.hi)), F(T([[57, 25], [60, 39], [58.6, 44], [57, 33]], P.hi)));
  tb.push(F(T([[31, 34.6], [37, 33], [48, 33.2], [53, 35.4], [48, 36], [37, 35.8]], P.hi)));
  tb.push(...stroke([[26, 46], [30, 49.4], [29, 54]], 0.9, P.s2), ...stroke([[26.6, 45.8], [30.6, 49.2]], 0.4, P.edge), ...stroke([[26.2, 46.4], [30, 49.6], [29.2, 53.6]], 0.35, glow));
  tb.push(...stroke([[51, 46], [54.6, 44], [56, 47]], 0.9, P.s2), ...stroke([[51.2, 45.4], [54.6, 43.4]], 0.4, P.edge), ...stroke([[51.2, 46.2], [54.6, 44.3], [55.8, 46.8]], 0.35, glow));
  // Core: rune socket and pulsing gem (it blazes as the golem winds up).
  const pulse = dead ? 0.85 : 1 + 0.09 * Math.sin(ph * 2) + (angry ? 0.12 : 0) + (ak && frame === 0 ? 0.12 : 0);
  tb.push(...oE(42.4, 43.6, 6.2, 6, P.s2, 0.5), arc(42.4, 43.6, 5.4, 5.2, 0, 360, 0.67, mix(glow, P.s2, 0.45)));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4 + u * 1.6;
    tb.push(F(T(starPts(42.4 + Math.cos(a) * 5.1, 43.6 + Math.sin(a) * 4.9, 0.8, 4, 0.5), glow)));
  }
  const g = (dx, dy) => [42.4 + dx * pulse, 43.6 + dy * pulse];
  // The core gem: transparent, so its dark facet faces the light and the far facet glows.
  tb.push(F(T([g(0, -4.4), g(3.6, 0), g(0, 4.4), g(-3.6, 0)], coreC)), F(T([g(0, -4.4), g(3.6, 0), g(0, 0)], step(coreC, -0.25, WARM))), F(T([g(-3.6, 0), g(0, 4.4), g(0, 0.6)], mix(coreC, '#ffffff', 0.55))));
  if (!dead) tb.push(F(T(starPts(41.4, 41.6, 1, 4, 0.4), '#ffffff')));
  up.push(...put(torso, tb));
  // Head, sunk between the shoulders; it nods a beat after each stomp.
  const nod = ak ? ak.nod : walk ? 0.8 * (1 - walkBob(u, 0.15)) - 0.4 : 0.4 * breath(u - 0.12) + (hurt ? -1 : 0) + (dead ? 1.2 : 0);
  const head = [];
  head.push(...oE(43, 25, 10, 8.8, P.base), F(T([[33.4, 25], [35, 30], [41, 33.4], [37.6, 28]], P.s1)), F(T(ovalPts(46.6, 18.8, 4.6, 1.8, -0.1), P.hi)));
  head.push(...gem(46.4, 17.6, 3.2, 6.6, 0.35, GEM_C[1]));
  // The face plate: a deep socket band with the two lights burning in it.
  head.push(F(T([[37.6, 23.4], [44.6, 22.2], [51.8, 23.2], [51.4, 29.4], [44.6, 31.2], [38, 29.6]], P.socket)));
  const lk = ak ? 0.4 : walk ? 0.3 : Math.sin(ph) * 0.8;
  const ge = { c: glow, bg: P.socket, look: [lk, 0], shape: 'round' };
  const act = { angry: { lid: 0.2, slant: 0.85 }, happy: { closed: 'happy' }, blink: { closed: 'blink' }, hurt: { closed: 'squeeze' } }[ak ? 'angry' : mood] ?? {};
  if (dead) head.push(...deadEye(41.6, 26.4, 1.3, { c: glow }), ...deadEye(48, 26.2, 1.5, { c: glow }));
  else head.push(...glowEye(41.6 + lk * 0.4, 26.4, { ...ge, ...act, s: -1, w: 1.7, h: 1.8 }), ...glowEye(48 + lk * 0.4, 26.2, { ...ge, ...act, s: 1, w: 2, h: 2 }));
  // The brow ridge: a slab of stone that slams down when it's angry.
  const bt = angry ? 2.6 : mood === 'happy' ? -1 : hurt ? -0.6 : 0.6;
  const browP = [[35.6, 21.4 - bt * 0.4], [39, 19.8 - bt * 0.3], [44.6, 21 + bt * 0.6], [50, 19.6 - bt * 0.3], [53.4, 21 - bt * 0.4], [52.6, 23.2 - bt * 0.2], [48.6, 22.4], [44.6, 23.4 + bt * 0.7], [40.4, 22.6], [36.4, 23.4 - bt * 0.2]];
  head.push(...oT(browP, P.s1, 0.5), F(T([browP[0], browP[1], browP[2], browP[3], browP[4], [browP[4][0] - 1, browP[4][1] + 0.9], [browP[3][0], browP[3][1] + 0.9], [browP[2][0], browP[2][1] + 0.9], [browP[1][0], browP[1][1] + 0.9], [browP[0][0] + 1, browP[0][1] + 0.9]], P.hi)));
  const mo = { ink: P.socket, inner: mix(P.socket, glow, 0.25), tongue: false };
  if (ak && frame === 2) head.push(...mouth(44.8, 30.4, { ...mo, type: 'shout', w: 2.2, h: 2.4, open: 1 }));
  else if (angry) head.push(...mouth(44.8, 30.2, { ...mo, type: 'snarl', w: 2.6, h: 1.8, open: 0.9, teeth: 'gritted' }));
  else if (hurt) head.push(...mouth(44.8, 30, { ...mo, type: 'o', w: 1, h: 1.4, open: 1 }));
  else if (mood === 'happy') head.push(...mouth(44.8, 29.8, { ...mo, type: 'smile', w: 1.8, curve: 0.6, ink: glow }));
  else if (!dead) head.push(...mouth(44.8, 30, { ...mo, type: 'flat', w: 1.4, ink: mix(glow, P.socket, 0.4) }));
  up.push(...put(move(torso, -3, nod), head));
  // Front arm: shoulder boulder crusted with crystals, then the arm and fist (IK).
  const fF = ak ? ak.front : dead ? [56, 64] : hurt ? [54, 60] : [57.8 - swing * 0.8, 62 - Math.abs(swing) * 0.25 + br * 0.6];
  const fS = ap(torso, 57, 36);
  const fFist = [fF[0] - hx, fF[1] - bob];
  const fE = ik(fS, fFist, 13.2, 13.2, ak && frame === 0 ? -1 : 1);
  const farm = [...put(segF(fS, fE), limbPts([[0, 0], [13.2, 0]], 8.6, P.s1)), ...put(segF(fE, fFist), [...limbPts([[0, 0], [13.2, 0]], 10.4, P.base), F(T([[1, -4.2], [12, -4.2], [12, -2.6], [1, -2.2]], P.hi))]), ...oE(fE[0], fE[1] + 0.4, 4.6, 4, P.base, 0.5), F(E(fE[0] + 1.4, fE[1] - 1, 2, 1.4, P.hi))];
  if (!ak) farm.push(...gem(fE[0] + 2.6, fE[1] + 3, 2.8, 5, 1.05, GEM_C[0]));
  farm.push(...put(joint(ID, fFist[0], fFist[1], ak ? 0.6 : 0), fist(P.base, P)));
  const raised = ak && frame < 2;
  if (!raised) up.push(...farm);
  up.push(...put(torso, [...gem(51.6, 27, 4, 11, 0.1, GEM_C[2]), ...gem(56.6, 26, 5, 14, 0.4, GEM_C[0]), ...gem(61.4, 29.6, 3.4, 8, 0.85, GEM_C[1])]));
  up.push(...put(torso, [...oT([[48, 32], [51, 27.6], [58.6, 27], [64.4, 31.6], [63.6, 37.4], [57.6, 40.4], [50, 38.6]], P.base), F(T([[51, 27.6], [58.6, 27], [64.4, 31.6], [58, 31.6], [52, 30.6]], P.hi)), F(T([[48, 32], [50, 38.6], [57.6, 40.4], [52.4, 36.4]], P.s1))]));
  if (raised) up.push(...farm);
  // A glint travelling over the crystals.
  if (!dead) {
    const gl = [[18.6, 11], [24.4, 4.6], [30.6, 9.4], [57.6, 13.6], [51.8, 17.4], [44.6, 12.2], [24.4, 4.6], [57.6, 13.6]][frame % 8];
    up.push(...put(torso, [F(T(starPts(gl[0], gl[1], 1.8, 4, 0.25), '#ffffff'))]));
  }
  if (hurt) up.push(...oT([[8, 14], [10, 12.6], [11, 14.6], [9, 15.6]], P.s1, 0.5), ...gem(5, 23, 1.6, 2.6, -0.6, GEM_C[0]));
  if (ak && frame === 0 && !dead) up.push(...oT([[40.6, 19.4], [42, 18.6], [42.4, 20], [41, 20.6]], P.s1, 0.4), ...oT([[55.6, 20], [56.8, 19.4], [57, 20.8]], P.s1, 0.4));
  // The smash: speed lines on the way down, then shards, dust and a dark-rimmed flash.
  if (ak && frame === 1 && !dead) fxs.push(...streaks([[fF[0] - 4, fF[1] - 16, fF[0] - 3, fF[1] - 9], [fF[0] + 3, fF[1] - 17, fF[0] + 3.4, fF[1] - 10]], '#f3eaff', 0.8));
  if (ak && frame === 2 && !dead) {
    fxs.push(...dust(50, 74, 1.5), ...dust(64, 74, 1.1), ...burst(62, 68, 7.2, '#7a4a9a', '#7a4a9a', 8, 0.2), ...burst(62, 68, 6.4, '#fff3b0', '#ffffff', 8, 0.2));
    fxs.push(...oT([[48, 64], [50, 62.6], [51, 64.6]], P.s1, 0.4), ...gem(68, 63, 1.8, 3, 0.5, GEM_C[0]), ...oT([[44, 67.4], [45.4, 66.4], [45.8, 68]], P.s1, 0.4));
  }
  out.push(...up);
  leg(45, u, false);
  out.push(...legs);
  return { w: 70, h: 74, res: 3, shapes: [...out, ...fxs] };
}

// ---------- Wraith ----------
// A hooded, tattered specter: two lights burning in a bottomless hood, ragged robes, bone claws,
// and rattling chains with a padlock and a broken shackle. It slides along in an eerie forward
// lean, its hem streaming behind, and attacks by rearing back and raking down with a scream.
// Signature shape: the peaked hood leaning over a long claw.
// Rig: root (float bob) > body (lean about the hem) > hood (sways a beat late; the peak is a
// chain), hem tatters (chains, root leads), waist chain (chain trailing back), diagonal chain and
// padlock; body > both sleeves (shoulder > elbow > wrist, two-bone IK) > bone claws (three
// fingers of two bones each) and the shackle chain hanging from the front wrist (a pendulum).
const WRAITH = { hi: '#8f82c6', base: '#62579a', s1: step('#62579a', -0.2), s2: step('#62579a', -0.38), fade: '#b9b0e6', hood: '#1a1430' };
const BONE = { hi: '#fffaf0', base: '#e6dcc8', s1: step('#e6dcc8', -0.24, WARM) };
const IRON = { base: '#cfc9e2', s1: '#968db4' };

// Links along a path: round links seen face-on alternate with thin ones seen edge-on.
function chainLinks(a, b, sag, n, c, cd, hole) {
  const ps = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    ps.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * sag]);
  }
  return links(ps, c, cd, hole);
}
function links(ps, c, cd, hole) {
  return ps.flatMap(([x, y], i) => (i % 2 ? [F(E(x, y, 0.55, 0.95, cd))] : [F(E(x, y, 1.2, 0.9, ink(c))), F(E(x, y, 1.05, 0.78, c)), F(E(x, y, 0.42, 0.24, hole))]));
}

// A bone claw in the wrist's frame (x along the forearm): a knuckled palm and three two-bone
// fingers that curl by `curl`, each ending in a hooked talon.
function boneClaw(curl, spread = 1) {
  const out = [...oE(1.2, 0, 1.6, 1.4, BONE.base, 0.5), F(E(1.6, -0.6, 0.8, 0.5, BONE.hi))];
  for (const [i, a] of [[0, -0.5], [1, 0.02], [2, 0.5]]) {
    const fr = chain(joint(ID, 2.2, (i - 1) * 0.9), [2.2, 2], [a * spread, 0.35 + curl * 0.5, 0.3 + curl * 0.6]);
    const p = pts(fr);
    out.push(...limb(p, 0.8, i === 0 ? BONE.s1 : BONE.base, 0.4), F(E(p[1][0], p[1][1], 0.55, 0.55, BONE.hi)));
    const t = fr[2];
    out.push(...oT([ap(t, 0, -0.45), ap(t, 1.8, 0.5), ap(t, 0, 0.45)], BONE.hi, 0.35));
  }
  return out;
}

// Attack keys: lean (rad), body offset, front/back hand targets in the body's space, claw curl,
// the hood's lag. A rear-back wind-up with the claw raised, the lunge, the held rake, the settle.
const WRAITH_ATK = [
  { lean: -0.12, dx: -0.8, dy: -1.4, fh: [33, 8], bh: [6, 26], curl: -0.6, hl: -0.12 },
  { lean: 0.12, dx: 0.4, dy: 0.2, fh: [32, 22], bh: [9, 32], curl: 0.4, hl: 0.06 },
  { lean: 0.15, dx: 0.4, dy: 0.8, fh: [33, 35], bh: [10, 34], curl: 1.4, hl: 0.16 },
  { lean: 0.08, dx: 0.2, dy: 0.4, fh: [33, 32], bh: [9, 33], curl: 0.8, hl: 0.06 },
];

function wraith(pose, frame, mood) {
  const walk = pose === 'walk';
  const ak = pose === 'attack' ? WRAITH_ATK[frame] : null;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry' || !!ak;
  const P = WRAITH;
  const u = ak ? frame / 4 : frame / (walk ? 8 : 6);
  const ph = u * TAU;
  const eyeC = angry ? '#ff6f9f' : dead ? '#9890b0' : '#ffe36b';
  const amp = dead ? 0.15 : walk ? 1 : ak ? 0.7 : 0.55;
  // A slow float that breathes in, holds, and sinks; sliding, an eerie forward lean.
  const bob = ak ? ak.dy : walk ? Math.sin(ph) * 0.8 : -breath(u) * 0.9;
  const lean = (ak ? ak.lean : walk ? 0.1 + Math.sin(ph - 0.6) * 0.02 : Math.sin(ph - 0.9) * 0.025) + (hurt ? -0.14 : 0) + (dead ? 0.05 : 0);
  const root = move(ID, -2 + (hurt ? -1.4 : 0) + (ak ? ak.dx : walk ? -0.6 : 0), bob + (dead ? 2.6 : 0));
  const body = dead ? squash(pivot(root, 20, 47, lean), 20, 47, 1.06, 0.9) : pivot(root, 20, 47, lean);
  const out = [];
  const fxs = [];
  const B = (shapes) => put(body, shapes);

  // Ghost wisps trailing below.
  if (!dead) {
    for (let i = 0; i < 3; i++) {
      const q = wrap(u + i / 3);
      out.push(F(E(10 + i * 7 - q * (walk ? 9 : 4), 47 + q * 3, 1.3 - q * 0.6, 0.9 - q * 0.4, P.fade)));
    }
  }

  // Back sleeve and claw (IK from the shoulder; the claw hangs open).
  const bS = ap(body, 13, 24);
  const bH = ap(body, ...(ak ? ak.bh : [8 + Math.sin(ph - 1) * 1.2 * amp, 33 + (dead ? 3 : 0) + Math.cos(ph - 1) * 0.6 * amp]));
  const bE = ik(bS, bH, 5.6, 5.6, 1);
  out.push(...oRibbon([bS, bE, bH], [4.4, 4.8, 5.8], P.s2), ...put(joint(ID, bH[0], bH[1], Math.atan2(bH[1] - bE[1], bH[0] - bE[0])), [F(E(0, 0, 1.2, 2.4, P.hood)), ...boneClaw(ak ? 0.4 : 0.8, 0.8).map((s) => s && { ...s, c: s.c === BONE.hi ? BONE.base : s.c === BONE.base ? BONE.s1 : s.c })]));

  // Waist chain trailing back, swinging a beat behind the body.
  const wc = chain(joint(body, 11, 36), [2, 2, 2, 2, 2, 2], wave(6, walk ? 0.7 : 0, 0.18 * amp, ph - 1.2, 0.6).map((a, i) => (i ? a * 0.6 : 2.2 + a + (walk ? 0.5 : 0))));
  out.push(...links(pts(wc), IRON.s1, step(IRON.s1, -0.2), P.s2));

  // Hem tatters: ragged cloth strips on chains; the root leads, the tip streams behind.
  const tat = [];
  const tx = [8.6, 13, 17.4, 21.8, 26.2, 30.4];
  tx.forEach((x, i) => {
    const len = [2.6, 3, 3.4, 3, 3.2, 2.4][i];
    const back = walk ? 0.45 : ak && frame ? 0.35 : 0.08;
    const bends = wave(2, 0, 0.22 * amp, ph - i * 0.8, 0.8).map((a, k) => (k ? a + back * 0.4 : Math.PI / 2 + back + a));
    const p = pts(chain(joint(body, x, 41), [len, len * 0.9, len * 0.7], bends));
    const c = i % 2 ? P.base : P.s1;
    tat.push(...oRibbon(p, [5, 4.4, 3, 0.8], c, 0.6), F(T(ribbonPts(p.slice(2), [2.6, 0.6]), mix(c, P.fade, 0.5))));
  });

  // The robe: a back shadow plane, a lit front-top, and folds that ripple with the hem.
  const robeS = [[8.4, 43], [8.6, 34], [10, 26], [12.6, 21], [18, 18.6], [26, 18.6], [31, 21.6], [33, 28], [33.4, 36], [32, 43]];
  const rb = [...oT(robeS, P.base)];
  rb.push(F(T([[8.4, 43], [8.6, 34], [10, 26], [12.6, 21], [15, 20], [13.4, 27], [12.6, 35], [13.4, 43]], P.s1)));
  rb.push(F(T([[22, 18.6], [26, 18.6], [31, 21.6], [32.4, 26], [28.6, 23.4], [24, 21]], P.hi)));
  const fold = (x, k) => stroke([[x, 26], [x + Math.sin(ph - k) * 0.5 * amp, 34], [x + Math.sin(ph - k - 0.8) * 0.9 * amp - (walk ? 0.8 : 0), 42]], 0.7, P.s2);
  rb.push(...fold(18, 0.6), ...fold(24.6, 1.4), ...stroke([[29.4, 28], [30, 36], [29.6, 42]], 0.7, P.hi));
  out.push(...tat.slice(0, tat.length / 2), ...B(rb), ...tat.slice(tat.length / 2));

  // Diagonal chain across the robe, and a padlock swinging on it a beat late.
  out.push(...B(chainLinks([11, 26], [31.6, 35.4], 1.6 + (walk ? Math.sin(ph - 1.8) * 0.5 : 0), 12, IRON.base, IRON.s1, P.s2)));
  const pk = walk ? Math.sin(ph - 2) * 0.25 : ak ? [0.2, -0.3, -0.25, -0.1][frame] : Math.sin(ph - 1.4) * 0.08;
  const lock = pivot(body, 26.2, 33.4, pk);
  out.push(...put(lock, [arc(26.2, 33.8, 1.3, 1.6, 180, 360, 0.6, IRON.base), ...oT([[24.4, 33.8], [28, 33.6], [28.2, 37.2], [24.4, 37.4]], '#ffd66b', 0.5), F(T([[24.4, 35.8], [28.2, 35.6], [28.2, 37.2], [24.4, 37.4]], step('#ffd66b', -0.2, WARM))), F(T([[24.8, 34.1], [26, 34], [26, 34.8], [24.8, 34.9]], '#fff6c8')), F(E(26.3, 35.2, 0.45, 0.45, '#6a3a4a')), F(T([[26.1, 35.4], [26.5, 35.4], [26.4, 36.6], [26.2, 36.6]], '#6a3a4a'))]));

  // The hood, swaying a beat late: a peaked cowl whose tip is a little chain, a lit rim, and a
  // lopsided opening (wider at the front, arched at the top) with the lights burning in it.
  const hl = ak ? ak.hl : (walk ? Math.sin(ph - 1.2) * 0.06 : Math.sin(ph - 1.1) * 0.04) + (hurt ? -0.12 : 0) + (dead ? 0.32 : 0);
  const head = pivot(body, 22, 21, hl);
  const hd = [];
  const peak = pts(chain(joint(ID, 15.6, 5.4), [2.6, 2.4, 2], wave(3, 0, 0.2 * amp, ph - 1.8, 0.8).map((a, i) => (i ? 0.5 + a : 3.6 + a - (walk ? 0.2 : 0)))));
  hd.push(...oRibbon(peak, [5, 3.6, 2.2, 0.6], P.s1));
  const hood = [[12.6, 22.6], [11.4, 15], [13, 8.4], [17, 4], [23, 2], [28.6, 4.2], [31.8, 9.4], [32.8, 15.2], [31.6, 21], [26.4, 23.6], [18.4, 23.8]];
  hd.push(...oT(hood, P.base), F(T([[12.6, 22.6], [11.4, 15], [13, 8.4], [17, 4], [16, 10], [16.4, 17], [18.4, 23.8]], P.s1)), F(T([[19, 3.4], [23, 2], [28.6, 4.2], [31.8, 9.4], [28.4, 7.2], [23.6, 5]], P.hi)));
  const hole = [[19.6, 13.4], [20.6, 9.4], [23.6, 6.8], [27.4, 7.4], [30, 10.4], [30.8, 14.6], [29.8, 19], [26.6, 21], [22.6, 20.6], [20.2, 17.6]];
  hd.push(F(T(grow(hole, 0.9), P.s2)), F(T(hole, P.hood)), F(T([[20.6, 9.4], [23.6, 6.8], [27.4, 7.4], [30, 10.4], [27, 9], [23.6, 8.8]], step(P.hood, 0.06))));
  const look = ak ? 0.6 : walk ? 0.5 : Math.sin(ph) * 0.7;
  const lk = look * 0.4;
  const ge = { c: eyeC, bg: P.hood, look: [look, 0], shape: 'round', flick: wrap(u * 2) };
  const act = { angry: { lid: 0.3, slant: 0.9, raise: 0.2 }, happy: { closed: 'happy' }, blink: { closed: 'blink' }, hurt: { closed: 'squeeze' } }[angry ? 'angry' : mood] ?? {};
  if (dead) hd.push(...deadEye(23.4, 14.4, 1.1, { c: eyeC }), ...deadEye(27.8, 14.2, 1.3, { c: eyeC }));
  else hd.push(...glowEye(23.4 + lk, 13.8, { ...ge, ...act, s: -1, w: 1.2, h: 1.4 }), ...glowEye(27.8 + lk, 13.6, { ...ge, ...act, s: 1, w: 1.5, h: 1.6 }));
  const mo = { ink: mix(eyeC, P.hood, 0.35), inner: '#08050f', tongue: false };
  const mx = 25.8 + lk;
  if (ak && (frame === 1 || frame === 2) && !dead) hd.push(...mouth(mx, 18, { ...mo, type: 'shout', w: 1.5, h: 2.4, open: 1 }));
  else if (angry && !dead) hd.push(...mouth(mx, 18, { ...mo, type: 'snarl', w: 1.7, h: 1.2, open: 0.7, teeth: 'gritted' }));
  else if (hurt) hd.push(...mouth(mx, 18, { ...mo, type: 'o', w: 0.8, h: 1.1, open: 1 }));
  else if (mood === 'happy') hd.push(...mouth(mx, 17.6, { ...mo, type: 'smile', w: 1.3, curve: 0.5 }));
  else if (dead) hd.push(...mouth(mx, 18, { ...mo, type: 'wavy', w: 1.2, amp: 0.25 }));
  out.push(...put(head, hd));

  // Front sleeve reaching out (IK), its bell cuff, the bone claw, and the shackle chain that
  // hangs from the wrist like a pendulum, lagging the hand.
  const reachT = ak ? ak.fh : [35 + Math.sin(ph) * 0.8 * amp + (angry ? 1 : 0) - (walk ? 0.6 : 0), 33 + Math.cos(ph) * 0.6 * amp + (dead ? 5 : 0) + (hurt ? -1 : 0)];
  const fS = ap(body, 28.6, 24.4);
  const fH = ap(body, ...reachT);
  const fE = ik(fS, fH, 6.2, 6.2, ak && frame === 0 ? -1 : 1);
  const wa = Math.atan2(fH[1] - fE[1], fH[0] - fE[0]);
  const swing = ak ? [-0.6, 0.7, 0.4, 0.1][frame] : walk ? Math.sin(ph - 1.6) * 0.3 : Math.sin(ph - 1.4) * 0.12;
  const sc = chain(joint(ID, fH[0] - 1, fH[1] + 0.6), [1.6, 1.6, 1.6, 1.6, 1.6], [Math.PI / 2 - swing, swing * 0.4, swing * 0.3, swing * 0.2, swing * 0.1]);
  const scP = pts(sc);
  const end = scP[scP.length - 1];
  out.push(...links(scP, IRON.base, IRON.s1, P.s2), ...oE(end[0], end[1] + 1.4, 1.7, 1.5, IRON.base, 0.5), F(E(end[0], end[1] + 1.4, 0.85, 0.7, P.s2)), F(E(end[0] - 0.6, end[1] + 0.4, 0.6, 0.35, '#ffffff')));
  out.push(...oRibbon([fS, fE, fH], [4.6, 5, 6.4], P.base), ...stroke([fS, fE], 1.2, P.hi));
  const curl = ak ? ak.curl : (angry ? 1.2 : hurt ? -0.5 : dead ? 1.6 : 0) + Math.sin(ph * 2 - 0.5) * 0.25 * amp;
  out.push(...put(joint(ID, fH[0], fH[1], wa), [F(E(0, 0, 1.3, 2.6, P.hood)), ...boneClaw(curl, ak && frame === 0 ? 1.4 : 1)]));

  if (ak && !dead) {
    const hw = ap(head, 31, 13);
    if (frame === 1) {
      // The scream ripples out of the hood; a smear trails the claw.
      for (const r of [3, 5.4]) fxs.push(arc(hw[0] + r * 0.4, hw[1], r * 0.55, r, -60, 60, 0.67, '#e6dcff'));
      fxs.push(F(T(ribbonPts([[fH[0] - 9, fH[1] - 9], [fH[0] - 4, fH[1] - 4], [fH[0] + 1, fH[1] + 0.6]], [0.4, 3, 4]), '#e3dafa')));
    } else if (frame === 2) {
      for (const r of [4.2, 6.6]) fxs.push(arc(hw[0] + r * 0.45, hw[1], r * 0.55, r, -60, 60, 0.67, '#e6dcff'));
      for (const k of [-2.2, 0, 2.2]) fxs.push(...stroke([[fH[0] - 1 + k * 0.4, fH[1] - 10 + k], [fH[0] + 3.4 + k * 0.3, fH[1] - 4 + k], [fH[0] + 4 + k * 0.2, fH[1] + 1 + k]], 0.8, '#ff9ec0'), ...stroke([[fH[0] - 0.6 + k * 0.4, fH[1] - 9 + k], [fH[0] + 3.2 + k * 0.3, fH[1] - 3.6 + k]], 0.4, '#ffffff'));
    }
  }
  return { w: 40, h: 52, res: 3, shapes: [...out, ...fxs] };
}

// ---------- Exports ----------

// Every design flies or walks with its own cadence: `stride` is how far it travels per cycle.
export const ART = {
  wisp: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 34, atkMs: [50, 200, 150], draw: wisp },
  gloombat: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [40, 180, 130], draw: imp },
  boneknight: { pad: 17, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 270, 200], draw: dullahan },
  crystalslime: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [55, 240, 170], draw: mimic },
  rockgolem: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [75, 330, 240], draw: golem },
  shade: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 58, atkMs: [60, 230, 180], draw: wraith },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  wisp: { name: "Will-o'-Wisp", w: 22, h: 26 },
  gloombat: { name: 'Imp', w: 24, h: 26 },
  boneknight: { name: 'Dullahan', w: 26, h: 46 },
  crystalslime: { name: 'Gem Mimic', w: 28, h: 24 },
  rockgolem: { name: 'Crystal Golem', w: 46, h: 60 },
  shade: { name: 'Wraith', w: 26, h: 40 },
};

// The rig and motion helpers, shared with the other monster modules.
export { ID, joint, ap, pivot, move, put, chain, pts, wave, wrap, ease, breath, beat, burst, streaks, ik, gait, step };
