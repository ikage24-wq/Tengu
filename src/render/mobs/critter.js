// Shared drawing helpers for the creature-first dungeon monsters (the dungeon monster redesign,
// 2026-11-03: chibi creatures with their own silhouettes, not costumed girls on one rig). Built on
// the field monsters' kit (meadow.js ramps, crescents, chains) and the simple faces (faces.js), so
// they sit in the same world as the Bud Snail and the Blossom Kit.

import { E, T, F, R, mix, sparkLine } from './kit.js';
import { ramp, crescent, shine, smear, chain, wave, smooth, breath, sway } from './meadow.js';
import { simpleEye, simpleMouth, blush, band, deadEye, tear, vein } from './faces.js';

export { E, T, F, R, mix, ramp, crescent, shine, smear, chain, wave, smooth, breath, sway, band, tear, vein };

export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const wrap = (p) => ((p % 1) + 1) % 1;
export const lerp = (a, b, t) => a + (b - a) * t;

// A smooth bump peaking (1) at phase c, 0 beyond w either side; phases wrap.
export function bump(p, c, w) {
  const d = Math.abs(wrap(p - c + 0.5) - 0.5);
  return d >= w ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * d) / w);
}

// A rotated ellipse as a polygon.
export function O(cx, cy, rx, ry, deg, c, n = 18) {
  const a = deg * D2R;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    pts.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return T(pts, c);
}

// The points of an ellipse arc from a0 to a1 degrees (0 = right, 90 = down).
export const arcPts = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + ((a1 - a0) * i) / n) * D2R;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});

// A tapered limb from a (width wa) to b (width wb) with round ends.
export function limb(a, b, wa, wb, c) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  return [
    T([[a[0] + (nx * wa) / 2, a[1] + (ny * wa) / 2], [b[0] + (nx * wb) / 2, b[1] + (ny * wb) / 2], [b[0] - (nx * wb) / 2, b[1] - (ny * wb) / 2], [a[0] - (nx * wa) / 2, a[1] - (ny * wa) / 2]], c),
    E(a[0], a[1], wa / 2, wa / 2, c), E(b[0], b[1], wb / 2, wb / 2, c),
  ];
}

// Turns shapes about (cx, cy) by deg (polygons exactly; ellipses and rects move their centres).
export function spin(shapes, cx, cy, deg) {
  if (!deg) return shapes;
  const c = Math.cos(deg * D2R);
  const s = Math.sin(deg * D2R);
  const r = (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
  return shapes.map((q) => {
    if (!q) return q;
    if (q.t === 'p') return { ...q, x: 0, y: 0, pts: q.pts.map(([px, py]) => r(q.x + px, q.y + py)) };
    if (q.t === 'e') {
      const [x, y] = r(q.x, q.y);
      return { ...q, x, y };
    }
    const [x, y] = r(q.x + q.w / 2, q.y + q.h / 2);
    return { ...q, x: x - q.w / 2, y: y - q.h / 2 };
  });
}
// Moves shapes by (dx, dy).
export const move = (shapes, dx, dy) => shapes.map((q) => {
  if (!q || (!dx && !dy)) return q;
  if (q.t === 'p') return { ...q, x: (q.x ?? 0) + dx, y: (q.y ?? 0) + dy };
  return { ...q, x: q.x + dx, y: q.y + dy };
});

// A band along a chain of joints (tentacles, tails), smoothed, tapering by `w(t)`.
export const strand = (joints, w, c) => band(smooth(joints.map((p) => [p[0], p[1]]), 2), w, c);

// A four-point impact star.
export function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [{ ...F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), line: sparkLine(c) }, F(E(x, y, k * 0.9, k * 0.9, core))];
}
// Little bubbles rising, drifting with the phase.
export function bubbles(x, y, q, n = 3, k = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = wrap(q + i / n);
    const bx = x + Math.sin(u * TAU + i * 2) * 1.6 * k;
    const by = y - u * 12 * k;
    const r = (0.7 + 0.5 * u) * k;
    out.push(F(E(bx, by, r, r, '#e6fbff')), F(E(bx - r * 0.3, by - r * 0.3, r * 0.35, r * 0.35, '#ffffff')));
  }
  return out;
}
// A puff of ink: three dark rounds with a lighter rim.
export const ink = (x, y, k) => [F(E(x - 2.4 * k, y + 0.4 * k, 2.4 * k, 2 * k, '#3a2d5a')), F(E(x + 1.4 * k, y - 0.8 * k, 2.8 * k, 2.4 * k, '#4a3a6e')), F(E(x + 0.2 * k, y + 1.8 * k, 2 * k, 1.6 * k, '#2e2448')), F(E(x + 0.8 * k, y - 1.6 * k, 1, 0.8, '#8a7ab0'))];

// A cute face for a creature looking right: two simple eyes (the far one a little smaller), a
// mouth, blush. `k` scales it; `mood` is the monster's (idle angry hurt happy blink dead), and an
// attack (`atk`) shows the angry eyes and a shout on its strike.
export function cuteFace(cx, cy, k, mood, { iris = '#5a8ad8', inkC = '#2a1a3a', lip = '#8a3550', gap = 4.6, atk = 0, skin = '#fff4ee', blushOn = true, mouthDy = 3.2, lash = 1, wing = 0 } = {}) {
  const out = [];
  const far = [cx - (gap / 2) * k, cy];
  const near = [cx + (gap / 2) * k, cy + 0.1 * k];
  if (mood === 'dead') {
    out.push(...deadEye(far[0], far[1], 1.3 * k, { c: inkC, th: 0.55 }), ...deadEye(near[0], near[1], 1.5 * k, { c: inkC, th: 0.6 }));
    if (mouthDy !== null) out.push(...simpleMouth(cx + 0.4 * k, cy + mouthDy * k, { k: k * 0.9, mood: 'dead', lip }));
    return out;
  }
  const em = atk ? 'angry' : { idle: 'idle', angry: 'angry', hurt: 'hurt', happy: 'happy', blink: 'blink' }[mood] ?? 'idle';
  // (Sad: heavy drooping lids; surprised: eyes a size bigger, the scenes' moods.)
  const lid = !atk && mood === 'sad' ? 0.4 : 0;
  const big = !atk && mood === 'surprised' ? 1.18 : 1;
  out.push(...simpleEye(far[0], far[1], { s: -1, w: 1.5 * k * big, h: 1.9 * k * big, mood: em, iris, ink: inkC, lash, wing, lid }), ...simpleEye(near[0], near[1], { s: 1, w: 1.75 * k * big, h: 2.2 * k * big, mood: em, iris, ink: inkC, lash, wing, lid }));
  if (blushOn) out.push(...blush(far[0] - 0.6 * k, cy + 2.4 * k, 1.1 * k, { on: skin }), ...blush(near[0] + 0.4 * k, cy + 2.6 * k, 1.2 * k, { on: skin }));
  const mm = atk > 0.5 ? 'shout' : mood === 'happy' ? 'happy' : mood === 'hurt' ? 'hurt' : mood === 'surprised' ? 'shout' : mood === 'angry' || mood === 'sad' || atk ? 'angry' : 'idle';
  // (mouthDy null: the creature draws its own mouth, like the angler's grin.)
  if (mouthDy !== null) out.push(...simpleMouth(cx + 0.4 * k, cy + mouthDy * k, { k: k * 0.95, mood: mm, lip }));
  if (mood === 'hurt') out.push(...tear(near[0] + 0.6 * k, cy + 1.4 * k, 0.8 * k, { type: 'stream', len: 2.6 * k }));
  if (mood === 'sad' && !atk) out.push(...tear(near[0] + 0.6 * k, cy + 1.6 * k, 0.6 * k, { type: 'stream', len: 1.6 * k }));
  if (mood === 'angry' && !atk) out.push(...vein(cx + 3.6 * k, cy - 3.4 * k, 0.6 * k));
  return out;
}

// A soft round mass lit from the upper front: base, form shadow crescent, a small shine.
export const blob = (cx, cy, rx, ry, r, { k = 0.28, a0 = 30, a1 = 230, rot = 0, lit = 1 } = {}) => [
  O(cx, cy, rx, ry, rot, r.base, 22),
  crescent(cx, cy, rx, ry, r.sh, { k, a0, a1, rot }),
  ...(lit ? [shine(cx, cy, rx, ry, r.hi, rot, lit)] : []),
];

// How the monster's poses run (frames per pose).
export const framesOf = (pose, boss = false) => (pose === 'walk' ? 8 : pose === 'attack' ? (boss ? 5 : 4) : boss ? 8 : 6);
