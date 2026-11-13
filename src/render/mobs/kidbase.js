// The chibi kid base (2026-11-13): everything the Whispering Glade's little tanuki folk are built
// from, for any future little-folk monster. Draw a new one as named groups (layers) in a 160 x 150
// box with these helpers and the hero's own hair, list its joints, and rig it with the kit in
// kidrig.js: every layer then gets its own swing (soft layers in rig.js), outer outline only.
//
// - Shape helpers: band (a tapered stroke), curve (a smooth line through points), ovalPts / oval,
//   petal, mitten, twinkle.
// - The face: eye (big tall eyes; moods idle (sly, half-closed), happy, blink, angry, hurt),
//   face (eyes low and wide, blush, a mouth for each mood), skull (round, ears each side).
// - kidHead: a hero hair style and bangs placed on that head, as { back, hang, backHead, front }.
// - groups(): the named-layer machinery a design draws into.

import { E, T, F } from './kit.js';
import { hairParts } from '../hair.js';
import { hairRamp } from '../hero.js';

export const W = 160;
export const H = 150;
export const CX = 80;
export const G = 146;

export const INK = '#3a2430';
export const SKIN = '#ffe8da';
export const SKIN_SH = '#f6c8b4';
export const BLUSH = '#ff8fa6';
export const MOUTH = '#9a3a4e';
export const TONGUE = '#ff8a9e';

// ---------- Helpers ----------

export function band(pts, w0, w1, c, flat = false) {
  const out = [];
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const wa = w0 + ((w1 - w0) * i) / n;
    const wb = w0 + ((w1 - w0) * (i + 1)) / n;
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / len;
    const ny = (bx - ax) / len;
    const q = T([[ax + (nx * wa) / 2, ay + (ny * wa) / 2], [bx + (nx * wb) / 2, by + (ny * wb) / 2], [bx - (nx * wb) / 2, by - (ny * wb) / 2], [ax - (nx * wa) / 2, ay - (ny * wa) / 2]], c);
    out.push(flat ? F(q) : q);
    if (i > 0) out.push(flat ? F(E(ax, ay, wa / 2, wa / 2, c)) : E(ax, ay, wa / 2, wa / 2, c));
  }
  return out;
}
export function curve(pts, k = 4) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// A tilted oval as a polygon (always convex).
export function ovalPts(x, y, rx, ry, a = 0, from = 0, to = Math.PI * 2, n = 20) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = from + ((to - from) * i) / n;
    const u = Math.cos(t) * rx;
    const v = Math.sin(t) * ry;
    pts.push([x + ca * u - sa * v, y + sa * u + ca * v]);
  }
  return pts;
}
export const oval = (x, y, rx, ry, a, c) => T(ovalPts(x, y, rx, ry, a), c);
// A rounded petal from (x, y) along angle a: long `len`, wide `w`, round at the tip.
export function petal(x, y, a, len, w, c, flat = false) {
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const p = (u, v) => [x + ca * u - sa * v, y + sa * u + ca * v];
  const pts = [p(0, 0), p(len * 0.25, -w * 0.42)];
  for (let i = 0; i <= 8; i++) {
    const t = -Math.PI / 2 + (i / 8) * Math.PI;
    pts.push(p(len * 0.62 + Math.cos(t) * len * 0.38, Math.sin(t) * w * 0.5));
  }
  pts.push(p(len * 0.25, w * 0.42));
  const s = T(pts, c);
  return flat ? F(s) : s;
}
// A mitten hand: a round palm and a little thumb, turned along `a`.
export function mitten(x, y, a, c, r = 5.4) {
  const tx = x + Math.cos(a - 1.4) * r * 0.8;
  const ty = y + Math.sin(a - 1.4) * r * 0.8;
  return [E(x, y, r, r * 0.92, c), E(tx, ty, r * 0.42, r * 0.42, c)];
}

// ---------- The face (head centre hx, hy; turned three-quarters to the right) ----------

// One eye: a big tall oval, dark under the lid, bright below, two highlights and a twinkle, a heavy
// lash line flicking out at the outer corner (`o` = 1: outer corner right; -1: left).
export function eye(x, y, w, h, mood, o, col) {
  const out = [];
  if (mood === 'happy' || mood === 'blink') {
    out.push(...band(curve([[x - w, y + 1.4], [x, y - h * 0.45], [x + w, y + 1.4]], 3), 2.2, 2.2, INK, true));
    return out;
  }
  if (mood === 'hurt') {
    out.push(...band([[x + w * o, y - h * 0.5], [x - w * 0.7 * o, y], [x + w * o, y + h * 0.5]], 2.2, 2, INK, true));
    return out;
  }
  if (mood === 'idle') return slyEye(x, y, w, h, o, col);
  out.push(F(E(x, y, w, h, INK)));
  out.push(F(E(x, y + 0.8, w - 1.3, h - 1.6, col.iris)));
  out.push(F(E(x, y - h * 0.32, w - 1.3, h * 0.5, col.irisDk)));
  out.push(F(E(x, y + h * 0.52, w * 0.62, h * 0.3, col.irisLt)));
  out.push(F(E(x + 0.4 * o, y + h * 0.08, w * 0.34, h * 0.36, INK)));
  out.push(F(E(x - w * 0.32, y - h * 0.36, w * 0.4, h * 0.3, '#ffffff')), F(E(x + w * 0.38, y + h * 0.4, w * 0.2, h * 0.14, '#ffffff')));
  out.push(F(E(x + w * 0.42, y - h * 0.1, w * 0.12, h * 0.1, '#ffffff')));
  const lid = mood === 'angry' ? h * 0.42 : 0;
  if (mood === 'angry') out.push(F(T([[x - w * 1.3, y - h * 1.3], [x + w * 1.3, y - h * 1.3], [x + w * 1.3 * o, y - h * 0.9 + lid * 0.2], [x - w * 1.3 * o, y - h * 0.4]].map(([a, b]) => [a, b]), SKIN)));
  out.push(...band(curve([[x - w * 1.08, y - h * 0.2], [x - w * 0.4, y - h * 1.0 + lid * 0.5], [x + w * 0.5, y - h * 1.0 + lid], [x + w * 1.08, y - h * 0.3 + lid * 0.5]], 3), 2.4, 2.4, INK, true));
  out.push(...band([[x + w * 0.95 * o, y - h * 0.4 + lid * 0.5], [x + w * 1.5 * o, y - h * 0.8 + lid * 0.5]], 2, 0.6, INK, true));
  out.push(...band(curve([[x - w * 0.5 * o, y + h * 0.98], [x + w * 0.3 * o, y + h * 0.96], [x + w * 0.85 * o, y + h * 0.7]], 2), 0.6, 1, INK, true));
  return out;
}
// Their resting look, the little tricksters: half-closed eyes, the heavy upper lid dropped over the
// top half, nearly level (a slope would read cross), the eyes slid sideways, a shadow under the lid,
// one bright catchlight left peeking under it.
export function slyEye(x, y, w, h, o, col) {
  const out = [];
  const gx = w * 0.3;
  out.push(F(E(x, y, w, h, INK)));
  out.push(F(E(x, y + 0.8, w - 1.3, h - 1.6, col.iris)));
  out.push(F(E(x + gx * 0.4, y + h * 0.52, w * 0.62, h * 0.3, col.irisLt)));
  out.push(F(E(x + gx, y + h * 0.18, w * 0.36, h * 0.34, INK)));
  out.push(F(E(x + gx * 0.3, y + h * 0.06, w - 1.6, h * 0.2, col.irisDk)));
  // The lid: skin over everything above its line, the line bulging a little over the eyeball.
  const inner = x - w * 1.2 * o;
  const outer = x + w * 1.2 * o;
  const line = curve([[inner, y + h * 0.02], [x, y - h * 0.04], [outer, y - h * 0.12]], 4);
  out.push(F(T([...line, [outer, y - h * 1.5], [inner, y - h * 1.5]], SKIN)));
  // The lid's crease, a soft line above it.
  out.push(...band(curve([[x - w * 0.55 * o, y - h * 0.38], [x + w * 0.1 * o, y - h * 0.46], [x + w * 0.8 * o, y - h * 0.5]], 2), 0.8, 0.5, SKIN_SH, true));
  // The heavy lash line along the lid, flicking up at the outer corner.
  out.push(...band(curve([[inner + w * 0.12 * o, y + h * 0.02], [x, y - h * 0.04], [outer - w * 0.1 * o, y - h * 0.11]], 3), 2.4, 2.6, INK, true));
  out.push(...band([[outer - w * 0.2 * o, y - h * 0.1], [outer + w * 0.4 * o, y - h * 0.36]], 2, 0.6, INK, true));
  // Catchlights under the lid.
  out.push(F(E(x + gx * 0.2 - w * 0.2, y + h * 0.3, w * 0.3, h * 0.17, '#ffffff')), F(E(x + w * 0.4, y + h * 0.55, w * 0.16, h * 0.11, '#ffffff')));
  // The lower lash.
  out.push(...band(curve([[x - w * 0.5 * o, y + h * 0.98], [x + w * 0.3 * o, y + h * 0.96], [x + w * 0.85 * o, y + h * 0.7]], 2), 0.6, 1, INK, true));
  return out;
}
export function face(hx, hy, mood, col) {
  const out = [];
  // Facing the screen like the hero: eyes set low and wide, blush under each, a small mouth.
  for (const sx of [-1, 1]) {
    const cx = hx + 19 * sx;
    out.push(F(E(cx, hy + 21, 6, 2.8, BLUSH)));
    for (let k = 0; k < 3; k++) out.push(...band([[cx - 3 + k * 2.7, hy + 22], [cx - 1.8 + k * 2.7, hy + 20]], 0.7, 0.7, '#f06a8a', true));
    out.push(F(E(cx + 3, hy + 19.6, 0.9, 0.7, '#ffffff')));
  }
  out.push(...eye(hx - 13.5, hy + 10, 6.4, 8.6, mood, -1, col), ...eye(hx + 13.5, hy + 10, 6.4, 8.6, mood, 1, col));
  const mx = hx;
  const my = hy + 23;
  if (mood === 'happy') {
    out.push(F(T([[mx - 4, my - 1], [mx + 4, my - 1], [mx + 3, my + 2.6], [mx, my + 4], [mx - 3, my + 2.6]], MOUTH)), F(E(mx, my + 2.6, 2, 1.1, TONGUE)));
  } else if (mood === 'angry') {
    out.push(...band(curve([[mx - 2.6, my + 1.2], [mx, my - 0.4], [mx + 2.6, my + 1.2]], 2), 1.3, 1.3, INK, true));
  } else if (mood === 'hurt') {
    out.push(F(E(mx, my + 1, 2.2, 2, MOUTH)), F(E(mx, my + 2, 1.3, 0.8, TONGUE)));
  } else {
    // A lopsided smirk: one corner tucked up into a little dimple, up to something.
    out.push(...band(curve([[mx - 3.6, my + 0.4], [mx - 0.6, my + 1.5], [mx + 2.4, my + 0.6], [mx + 3.8, my - 1.4]], 3), 1.1, 1.3, INK, true));
    out.push(...band(curve([[mx + 4.2, my - 2.4], [mx + 4.8, my - 1], [mx + 4.4, my + 0.2]], 2), 0.8, 0.5, INK, true));
  }
  return out;
}
// The head, facing the screen like the hero's: round with full soft cheeks, an ear each side.
export function skull(hx, hy) {
  return [
    E(hx - 31, hy + 8, 4.4, 6, SKIN_SH), E(hx + 31, hy + 8, 4.4, 6, SKIN),
    E(hx, hy, 32, 30.8, SKIN), E(hx, hy + 12.6, 29.5, 18.2, SKIN),
    F(T([[hx - 29, hy + 8], [hx - 22, hy + 24], [hx - 12, hy + 30], [hx - 20, hy + 18], [hx - 25, hy + 4]], SKIN_SH)),
  ];
}

// ---------- The head on the hero's hair ----------

// The kids wear real hero hairstyles (hair.js), drawn exactly as the hero's are: one dome cut into
// clumps over the face, tapered locks, a shine ring. Hero head space (skull centre 15.5, 15, about
// 10 across) is blown up to the kids' head space (HK), and the whole head is then drawn at HS of
// that about the neck, so the head is a bit over a third of her height.
export const HK = 32 / 10.2;
export const HS = 0.66;
export function mapShape(sh, f, k) {
  if (sh.t === 'p') {
    const ox = sh.x ?? 0;
    const oy = sh.y ?? 0;
    return { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y, s]) => {
      const q = f([x + ox, y + oy]);
      return s ? [q[0], q[1], s] : q;
    }) };
  }
  const [x, y] = f([sh.x, sh.y]);
  if (sh.t === 'e') return { ...sh, x, y, rx: sh.rx * k, ry: sh.ry * k };
  if (sh.t === 'r') return { ...sh, x, y, w: sh.w * k, h: sh.h * k };
  return { ...sh, x, y };
}
// { back, front }: `back` (hair hanging behind, the back of the head) goes under the body; `front`
// (the head, face and bangs) over it. (hx, neck): where the chin sits.
export function kidHead(hx, neck, mood, col, style, color, bangs = 'auto') {
  const r = hairRamp(color);
  const p = hairParts(style, r, null, null, mood === 'angry' ? 'angry' : 'smile', bangs);
  const fromHero = ([x, y]) => [(x - 15.5) * HK, (y - 15) * HK];
  const kid = (list) => list.map((sh) => mapShape(sh, fromHero, HK));
  const y0 = neck - 31 * HS;
  const place = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [hx + x * HS, y0 + y * HS], HS));
  const shade = kid([...(p.hairline ? [F(E(15.5, 8.2, 10.4, 3.2, SKIN_SH))] : []), ...p.shade]).map((sh) => ({ ...sh, c: SKIN_SH }));
  return {
    back: place([...kid(p.hang), ...kid(p.head)]),
    hang: place(kid(p.hang)),
    backHead: place(kid(p.head)),
    front: place([...skull(0, 0), ...shade, ...face(0, 0, mood, col), ...kid(p.front), ...kid(p.top)]),
    // The same front in two layers: the face (skull, the fringe's shade, the face) and the fringe
    // over it (bangs, side locks, anything on top), so the fringe can sway on its own.
    face: place([...skull(0, 0), ...shade, ...face(0, 0, mood, col)]),
    fringe: place([...kid(p.front), ...kid(p.top)]),
  };
}

// A four-pointed twinkle, as two crossed slim diamonds (each convex).
export function twinkle(x, y, r, col) {
  return [F(T([[x, y - r], [x + r * 0.24, y], [x, y + r], [x - r * 0.24, y]], col)), F(T([[x - r * 0.8, y], [x, y - r * 0.2], [x + r * 0.8, y], [x, y + r * 0.2]], col))];
}

// Each kid is drawn in named groups (the rig moves each as its own part); `shapes` is all of them
// in drawing order.
export function groups() {
  const G = {};
  let cur = null;
  const use = (n) => {
    cur = G[n] ??= [];
  };
  return { G, use, out: { push: (...a) => cur.push(...a) } };
}
