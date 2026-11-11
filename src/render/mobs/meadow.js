// Monster art: Petal Meadow and Clover Hills (levels 1-8), the first monsters a player meets.
//   puffle      Blossom Kit: a pale pink fox kit with a blossom-tipped tail; it pounces
//   snailbun    Bud Snail: a plump peach snail whose shell is a pink flower bud that blooms
//   sproutling  Turnip Tot: a plump turnip that hops about and headbutts
// Every design faces right with its feet on the bottom edge; see kit.js for the shapes. Each has
// its own gait (a light trot, a heavy plod, a root-footed scurry, a bow-legged swagger, bounding
// hops), its own face built from faces.js (fox almond eyes, sleepy tortoise lids, a turnip's
// big round eyes, a goblin's shifty squint, a hare's glossy eye), an idle fidget loop, and a
// four-frame attack (wind-up, strike, impact, recover).

import { R, E, T, F, C, BLUSH, arc, stroke, shade, mix, sparkLine, keyAt } from './kit.js';
import { eye, brow, mouth, nose, blush as cheek, sweat, tear, vein, deadEye, band, simpleEye, simpleMouth, easyEye } from './faces.js';

// A brow pose for a mood from a table of them: the scenes' sad face borrows the hurt brows and
// surprised the happy ones; any other mood the table lacks gets its idle brows (never a crash).
const browsFor = (table, mood) => table[mood === 'sad' ? 'hurt' : mood === 'surprised' ? 'happy' : mood] ?? table.idle;

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

// ---------- Motion helpers ----------

const wrap = (p) => ((p % 1) + 1) % 1;
// A smooth bump that peaks (1) at phase c and fades to 0 within w either side; phases wrap.
function bump(p, c, w) {
  const d = Math.abs(wrap(p - c + 0.5) - 0.5);
  return d >= w ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * d) / w);
}

// A foot in a walk cycle: planted and sliding back `stride` for `duty` of the cycle, then lifted
// and swung forward in an arc that rises quickly and sets down softly. Returns [dx, up].
function gait(p, stride, lift, duty = 0.5) {
  p = wrap(p);
  if (p < duty) return [stride / 2 - stride * (p / duty), 0];
  const t = (p - duty) / (1 - duty);
  const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return [-stride / 2 + stride * e, lift * Math.sin(Math.PI * Math.pow(t, 0.8))];
}

// Turns shapes about (cx, cy) by `deg` (ellipses and rects keep their axes, fine for small turns).
function spin(shapes, cx, cy, deg) {
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

// ---------- Rig ----------
// Every design is built as parts hung on joints (hips, knees, shoulders, neck, tail and ear
// roots): a pose turns and moves the parts, the limbs keep their length (two-bone reach), feet
// stay planted, and whatever a part carries (a face, a club, a flower) is drawn in its frame and
// turned with it by spin(). Soft parts are chains, so motion starts at the root and reaches the
// tip later, as a wave, never one rigid swing played back and forth.

// A chain (tail, ear, leaf, lock of mane): segments of `lens` hanging from (x, y) at `deg`;
// segment i turns bend(i) degrees further than its parent. Returns the joints, root first, as
// [x, y, angle in degrees of the segment leaving it].
// Rounds a polyline off (Chaikin corner cutting, ends kept), so a band laid along a chain of
// links bends smoothly instead of kinking at each joint.
export function smooth(pts, passes = 2) {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const q = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [a, b] = [p[i], p[i + 1]];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    q.push(p.at(-1));
    p = q;
  }
  return p;
}

export function chain(x, y, deg, lens, bend = () => 0) {
  const out = [];
  let a = deg;
  let px = x;
  let py = y;
  lens.forEach((l, i) => {
    a += bend(i);
    out.push([px, py, a]);
    px += Math.cos(a * D2R) * l;
    py += Math.sin(a * D2R) * l;
  });
  out.push([px, py, a]);
  return out;
}
// A travelling wave for chain(): `amp` degrees at the root, growing by `grow` per segment, each
// segment `lag` radians behind its parent (the root leads, the tip follows).
export const wave = (ph, amp, lag = 0.75, grow = 0.2) => (i) => amp * (1 + grow * i) * Math.sin(ph - lag * i) * (i ? 0.55 : 1);
// Two-bone reach: the knee (or elbow) between a hip at a and a foot at b with bone lengths l1 and
// l2; for a limb hanging down, bend +1 puts the joint in front (a knee), -1 behind (an elbow).
export function reach(a, b, l1, l2, bend = 1) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d0 = Math.hypot(dx, dy) || 0.01;
  const d = Math.max(0.01, Math.min(d0, l1 + l2 - 0.01));
  const k = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - k * k));
  const ux = dx / d0;
  const uy = dy / d0;
  return [a[0] + ux * k + uy * h * bend, a[1] + uy * k - ux * h * bend];
}

// The idle breath, 0..1 over the loop: in slowly, a held beat at the top, out quickly. Never a
// plain sine, whose in and out mirror each other like a machine.
export function breath(q) {
  q = wrap(q);
  if (q < 0.5) return 0.5 - 0.5 * Math.cos((Math.PI * q) / 0.5);
  if (q < 0.68) return 1;
  return 0.5 + 0.5 * Math.cos((Math.PI * (q - 0.68)) / 0.32);
}
// The idle's sideways sway, -1..1, a beat behind the breath (an idle is never only vertical).
export const sway = (q) => Math.sin(TAU * q - 1.3);

// ---------- Materials ----------
// Colors are worked in HSL so a ramp turns its hue as it darkens (shadows toward violet, lights
// toward warm yellow) and never greys out. The light comes from the upper front (top right, as
// every design faces right): shadows hug the back and underside, highlights sit top front.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function toHsl(c) {
  const n = parseInt(c.slice(1, 7), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l * 100];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}
function fromHsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return `#${[f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
// Shifts a color by dh degrees of hue and ds / dl points of saturation / lightness.
export function hue(c, dh = 0, ds = 0, dl = 0) {
  const [h, s, l] = toHsl(c);
  return fromHsl(h + dh, clamp(s + ds, 0, 100), clamp(l + dl, 0, 100));
}
const toward = (h, to, by) => {
  const d = ((to - h + 540) % 360) - 180;
  return h + Math.sign(d) * Math.min(Math.abs(d), by);
};
// A material's ramp, four tones at most: hi (the lit top front), base, sh (the form shadow) and
// deep (occlusion: creases, contact, the far side of far limbs). Each shadow step drops `step`
// points of lightness, turns `turn` degrees toward violet and gains `sat` saturation; the
// highlight turns toward warm yellow.
export function ramp(base, { step = 11, turn = 12, sat = 6, cool = 270, warm = 55, lift } = {}) {
  const [h, s, l] = toHsl(base);
  return {
    hi: fromHsl(toward(h, warm, turn * 0.6), clamp(s - 3, 0, 100), clamp(l + (lift ?? step * 0.75), 0, 97)),
    base,
    sh: fromHsl(toward(h, cool, turn), clamp(s + sat, 0, 100), clamp(l - step, 0, 100)),
    deep: fromHsl(toward(h, cool, turn * 2), clamp(s + sat * 1.6, 0, 100), clamp(l - step * 2.1, 0, 100)),
  };
}

// The shadow side of a round mass: a crescent hugging its outline from angle a0 to a1 (degrees,
// 0 = front, 90 = down, 180 = back), whose inner edge is the same oval nudged toward the light by
// k of its size and tapered to nothing at both ends, so it never rings the form (no pillow
// shading). jag > 0 notches the inner edge into fur tufts reaching into the light; rot turns it.
export function crescent(cx, cy, rx, ry, c, { k = 0.3, a0 = 25, a1 = 235, jag = 0, rot = 0, n = 16 } = {}) {
  const ca = Math.cos(rot * D2R);
  const sa = Math.sin(rot * D2R);
  const P = (x, y) => [cx + x * ca - y * sa, cy + x * sa + y * ca];
  const outer = [];
  const inner = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (a0 + (a1 - a0) * t) * D2R;
    const ox = Math.cos(a) * rx;
    const oy = Math.sin(a) * ry;
    outer.push(P(ox, oy));
    const w = Math.sin(Math.PI * t) ** 0.6;
    let px = ox + (Math.cos(a) * rx * (1 - k * 0.2) + rx * k * 0.7 - ox) * w;
    let py = oy + (Math.sin(a) * ry * (1 - k * 0.2) - ry * k - oy) * w;
    if (jag && i % 2 && i < n) {
      px -= Math.cos(a) * jag * w;
      py -= Math.sin(a) * jag * w;
    }
    const e = (px / rx) ** 2 + (py / ry) ** 2;
    if (e > 1) {
      px /= Math.sqrt(e) * 1.001;
      py /= Math.sqrt(e) * 1.001;
    }
    inner.push(P(px, py));
  }
  return F(T([...outer, ...inner.reverse()], c));
}
// The highlight on a round mass: one small soft shape on its top front, never a ring.
export const shine = (cx, cy, rx, ry, c, rot = 0, k = 1) => F(O(cx + rx * 0.3, cy - ry * 0.55, rx * 0.34 * k, ry * 0.17 * k, rot - 18, c, 12));

// A smear (オバケ): one flat shape stretched along the path a fast part just swept, its leading
// end (the last point) full width and hard, its trailing end thinning out. Drawn in a light tint
// of the part, on strike frames only.
export function smear(pts, w, c) {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = i / (pts.length - 1);
    const h = (w / 2) * t ** 0.7;
    l.push([x - ((b[1] - a[1]) / len) * h, y + ((b[0] - a[0]) / len) * h]);
    r.push([x + ((b[1] - a[1]) / len) * h, y - ((b[0] - a[0]) / len) * h]);
  });
  return F(T([...l, ...r.reverse()], c));
}

// ---------- Shape helpers ----------

// A rotated ellipse (as a polygon).
function O(cx, cy, rx, ry, deg, c, n = 18) {
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

// A tapered limb from a (width wa) to b (width wb) with rounded ends.
function limb(a, b, wa, wb, c) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  return [
    T([[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2], [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]], c),
    E(a[0], a[1], wa / 2, wa / 2, c), E(b[0], b[1], wb / 2, wb / 2, c),
  ];
}

// A pointed leaf (or ear) growing from (bx, by) along deg.
function leaf(bx, by, deg, len, wid, c) {
  const a = deg * D2R;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const p = (u, v) => [bx + dx * len * u - dy * wid * v, by + dy * len * u + dx * wid * v];
  return T([p(0, 0.35), p(0.18, 0.85), p(0.45, 1), p(0.75, 0.7), p(1, 0), p(0.75, -0.7), p(0.45, -1), p(0.18, -0.85), p(0, -0.35)], c);
}

// A broad leaf whose spine curves from b along deg, its tip sagging by `bend`.
function cleaf(b, deg, len, wid, bend, c, rib, rim = 0) {
  const a = deg * D2R;
  const ctl = [b[0] + Math.cos(a) * len * 0.6, b[1] + Math.sin(a) * len * 0.6];
  const tip = [b[0] + Math.cos(a) * len, b[1] + Math.sin(a) * len + bend];
  const l = [];
  const r = [];
  const spine = [];
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const [x, y] = bz(b, ctl, tip, t);
    const tx = 2 * (1 - t) * (ctl[0] - b[0]) + 2 * t * (tip[0] - ctl[0]);
    const ty = 2 * (1 - t) * (ctl[1] - b[1]) + 2 * t * (tip[1] - ctl[1]);
    const tl = Math.hypot(tx, ty) || 1;
    const w = rim + wid * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.7) * (1 + 0.1 * Math.sin(t * 20));
    l.push([x - (ty / tl) * w, y + (tx / tl) * w]);
    r.push([x + (ty / tl) * w, y - (tx / tl) * w]);
    if (t <= 0.8) spine.push([x, y]);
  }
  if (rim) return [F(T([...l, ...r.reverse()], c))];
  // Two values split at the midrib: the half facing down and away from the light in shadow.
  const lo = l.reduce((n, p) => n + p[1], 0) > r.reduce((n, p) => n + p[1], 0) ? l : r;
  const mid = [];
  for (let i = 0; i <= 9; i++) mid.push(bz(b, ctl, tip, i / 9));
  return [T([...l, ...r.reverse()], c), F(T([...lo, ...mid.reverse()], hue(c, 14, 4, -10))), band(spine, (t) => 0.5 * (1 - t * 0.6), rib)];
}

const bz = (a, b, c, t) => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
];

// A thin ring (a shockwave), drawn as a band of quads.
function ring(cx, cy, rx, ry, th, c, a0 = 0, a1 = 360) {
  const out = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const u0 = (a0 + ((a1 - a0) * i) / n) * D2R;
    const u1 = (a0 + ((a1 - a0) * (i + 1)) / n) * D2R;
    const p = (u, k) => [cx + Math.cos(u) * (rx - k), cy + Math.sin(u) * (ry - k)];
    out.push(F(T([p(u0, 0), p(u1, 0), p(u1, th), p(u0, th)], c)));
  }
  return out;
}

// A four-point sparkle (impact stars, sparks).
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [{ ...F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), line: sparkLine(c) }, F(E(x, y, k * 0.9, k * 0.9, core))];
}

// Little dust puffs kicked up where something hits the ground.
const dust = (x, y, k) => [E(x - 2.4 * k, y - 0.8 * k, 1.6 * k, 1.2 * k, '#f3e6d6'), E(x, y - 1.6 * k, 2 * k, 1.6 * k, '#fbf1e4'), E(x + 2.4 * k, y - 0.7 * k, 1.5 * k, 1.1 * k, '#f3e6d6')];

// A spirit flame: a teardrop licking upward, h tall, leaning by `lean`.
function flame(x, y, h, lean, outer, inner) {
  if (h <= 0) return [];
  const w = 1.4 + h * 0.2;
  return [
    F(T([[x - w, y + 0.3], [x - w * 1.1, y - h * 0.32], [x - w * 0.8 + lean * 0.3, y - h * 0.7], [x - w * 0.3, y - h * 0.46], [x + lean, y - h],
      [x + w * 0.4, y - h * 0.5], [x + w * 0.95 + lean * 0.4, y - h * 0.68], [x + w * 1.05, y - h * 0.18], [x + w * 0.85, y + w * 0.6], [x, y + w * 0.95], [x - w * 0.85, y + w * 0.6]], outer)),
    F(T([[x - w * 0.55, y + 0.3], [x - w * 0.45, y - h * 0.3], [x - w * 0.1 + lean * 0.6, y - h * 0.68], [x + w * 0.3, y - h * 0.38], [x + w * 0.5, y - h * 0.1], [x + w * 0.4, y + w * 0.5], [x, y + w * 0.65]], inner)),
    F(E(x + 0.1, y + 0.1, w * 0.3, w * 0.36, '#ffffff')),
  ];
}

// ---------- Blossom Kit (puffle) ----------
// (Petal Meadow's new cast, 2026-11-11: the Blossom Kit made over.) A pale pink fox kit of the
// cherry tree, one big fluffy tail tipped with a cherry blossom and a blossom tucked by its ear.
// It trots and bounds about the boughs; it attacks with a pounce,
// landing paws first in a burst of petals.

// Attack: the pounce. bx/by: body shift (by - is up), pitch: body tilt (deg, + nose down), head:
// neck turn, tl: tail swept (deg), ff/fh: front/hind feet shift, lift: front paws raised, burst:
// petals bursting at the landing.
const KIT_ATK = [
  // Wind-up (held): crouched low on its haunches, rump up, tail swishing, eyes on you.
  { bx: -2.4, by: 2.4, pitch: -4, head: 6, tl: -16, ff: 1.6, fh: -1, lift: 0, burst: 0 },
  // Leap: sprung up and forward, front paws reaching out, tail streaming behind.
  { bx: 2.6, by: -5.4, pitch: -12, head: -6, tl: 26, ff: 4, fh: -2.4, lift: 3.4, burst: 0 },
  // Landing (held): paws down hard in front, nose down, petals bursting up round it.
  { bx: 4, by: 0.8, pitch: 7, head: 6, tl: 14, ff: 3, fh: 1, lift: 0, burst: 1 },
  // Recover: settling back past rest, the last petals drifting.
  { bx: 0.6, by: 0.3, pitch: -1.5, head: 0, tl: -6, ff: 0.4, fh: 0, lift: 0, burst: 0.4 },
];

// A cherry blossom: five round petals (each with a notch) round a golden heart.
function blossom(x, y, r, c, c2) {
  const o = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    o.push(E(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5, i % 2 ? c : c2));
  }
  o.push(F(E(x, y, r * 0.32, r * 0.32, '#ffe27a')), F(E(x - r * 0.1, y - r * 0.12, r * 0.12, r * 0.12, '#fff8d8')));
  return o;
}

function blossomKit(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? atkPose(KIT_ATK, f, { bx: 0, by: 0, pitch: 0, head: 0, tl: 0, ff: 0, fh: 0, lift: 0, burst: 0 }) : null;
  const fk = Math.floor(f);
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // Pale cherry-pink fur turning toward plum in shadow; the cream bib toward lilac.
  const fur = ramp('#ffd9e2', { step: 8, turn: 10, sat: -10 });
  const cream = ramp('#fff3e6', { step: 6, turn: 40, sat: 4 });
  const sock = '#c98aa4';
  const mark = '#f0608e';
  const out = [];

  // Root motion. A light trot: diagonal pairs, the body lowest as each pair lands (twice a
  // cycle) and floating between; idle, it breathes and sways; hurt, it is knocked back on its
  // haunches; dead, it lies flat.
  const DUTY = 0.42;
  const br = idle ? breath(q) : 0;
  const bob = dead ? 4.2 : walk ? 0.85 * Math.cos(2 * TAU * (q - 0.21)) - 0.15 : A ? A.by : hurt ? 0.8 : -br * 0.45;
  const surge = walk ? 0.4 * Math.sin(2 * TAU * (q - 0.1)) : idle ? sway(q) * 0.45 : 0;
  const rx = hurt ? -1.8 : 0;
  const bx = 15 + rx + surge + (A ? A.bx : 0);
  const by = 22 + bob;
  const pitch = dead ? 0 : A ? A.pitch : hurt ? -5 : walk ? 2.2 * Math.sin(2 * TAU * q - 0.6) : 0;
  const hip = [bx - 4.2, by + 1.6];
  // Every body point turns with the pitch about the hips.
  const bodyAt = (x, y) => spin([E(x, y, 0, 0, '#000')], hip[0], hip[1], pitch)[0];

  // Tails: three plumes, each a chain of five links from the rump. The trot's bounce reaches the
  // root first and rolls out to the tip; idle, a lazy wave; angry, raised and bristling.
  const root = bodyAt(bx - 5, by - 0.4);
  const tailBase = [[-134, 2.3]];
  tailBase.forEach(([a0, len], k) => {
    const ph = walk ? 2 * TAU * q - 0.8 - k * 0.9 : TAU * q - k * 1.3;
    const amp = dead ? 0 : walk ? 9 : idle ? 7 : 3;
    let base = a0 + (A ? A.tl * (1 - k * 0.15) : 0) + (angry ? 8 : 0) + (happy ? 6 : 0) + (hurt ? 14 : 0) - pitch;
    if (dead) base = [-150, -132, -165][k];
    const curl = dead ? 9 : 13 + (angry ? -4 : 0);
    const pts = chain(root.x, root.y, base, [len * 1.6, len * 1.8, len * 1.9, len * 1.8, len * 1.4], (i) => (i ? curl : 0) + wave(ph, amp)(i));
    const tone = k === 2 ? ramp(fur.sh, { step: 8, turn: 10, sat: -12 }) : fur;
    const tc = k === 2 ? ramp(cream.sh, { step: 7, turn: 20 }) : cream;
    // One smooth plume along the chain (the links rounded off so no joint shows): the shadow tone
    // is the whole plume nudged down and back, the lit fur a slimmer copy nudged up and front, so
    // the shadow reads as one clean crescent along the underside instead of a ball per link. The
    // cream tip is the last quarter.
    const sm = smooth(pts.map(([x, y]) => [x, y]));
    const wAt = (t) => 3.2 + 5 * Math.pow(Math.sin(Math.PI * (0.06 + 0.8 * t)), 1.2);
    const cut = Math.round((sm.length - 1) * 0.72);
    const tipC = sm.at(-1);
    const plume = (dx, dy, dw, m0, m1) => {
      const at = (p0) => p0.map(([x, y]) => [x + dx, y + dy]);
      const n = sm.length - 1;
      return [band(at(sm.slice(0, cut + 1)), (t) => wAt((t * cut) / n) - dw, m0), band(at(sm.slice(cut)), (t) => wAt((cut + t * (n - cut)) / n) - dw, m1),
        E(tipC[0] + dx, tipC[1] + dy, (wAt(1) - dw) / 2, (wAt(1) - dw) / 2, m1)];
    };
    out.push(...plume(-0.2, 0.35, 0, tone.sh, tc.sh), ...plume(0.3, -0.35, 1.1, tone.base, tc.base).map(F));
    // Fur tufts sweeping toward the tip break the plume's edge (two on the back, one on the front),
    // and the cream tip bites into the fur in a V instead of a straight cut.
    const n = sm.length - 1;
    const frame = (t) => {
      const i = Math.max(1, Math.min(n - 1, Math.round(t * n)));
      const d = [sm[i + 1][0] - sm[i - 1][0], sm[i + 1][1] - sm[i - 1][1]];
      const l = Math.hypot(...d) || 1;
      return [sm[i], [d[0] / l, d[1] / l], [d[1] / l, -d[0] / l]];
    };
    for (const [t, side] of [[0.38, 1], [0.6, -1], [0.82, 1]]) {
      const [[x, y], d, nn] = frame(t);
      const e = (wAt(t) / 2 - 0.4) * side;
      const ex = x + nn[0] * e;
      const ey = y + nn[1] * e;
      const c = (t > 0.72 ? tc : tone)[side > 0 ? 'sh' : 'base'];
      out.push(T([[ex - d[0] * 1.1, ey - d[1] * 1.1], [ex + nn[0] * 1.3 * side + d[0] * 1.2, ey + nn[1] * 1.3 * side + d[1] * 1.2], [ex + d[0] * 0.9, ey + d[1] * 0.9]], c));
    }
    {
      const [[x, y], d, nn] = frame(0.72);
      const hw = wAt(0.72) / 2 - 0.85;
      out.push(F(T([[x + nn[0] * hw + 0.3, y + nn[1] * hw - 0.35], [x - d[0] * 1.6 + 0.3, y - d[1] * 1.6 - 0.35], [x - nn[0] * hw + 0.3, y - nn[1] * hw - 0.35]], tc.base)));
    }
    const tip = pts.at(-1);
    out.push(F(E(tip[0] + 0.5, tip[1] - 0.9, 0.9, 0.55, cream.hi)));
    // The cherry blossom on the tail's tip.
    out.push(...blossom(tip[0] + 0.4, tip[1] - 1.2, dead ? 2.6 : 3.2, '#ff9fc0', '#ffd0e0'));
  });

  // Legs: two bones each (the hind knee forward, the foreleg's elbow back), hips riding the body,
  // paws planted while they bear weight and swung forward in an arc between.
  const leg = (hx0, hy0, fx0, ph, near, front) => {
    let [dx, up] = walk ? gait(q + ph, 8.8, 2.4, DUTY) : [0, 0];
    if (A) dx += front ? A.ff : A.fh;
    if (A && front) up += A.lift;
    if (hurt && front) up += 1.6;
    const top = bodyAt(hx0, hy0);
    const fy = dead ? 29.6 : 29.2 - up;
    const fx = dead ? fx0 + (front ? 3.6 : -3.6) + rx : fx0 + rx + dx;
    const c = near ? fur : { base: fur.sh, sh: fur.deep };
    const kn = reach([top.x, top.y], [fx, fy - 0.8], 3.4, 3.6, front ? -1 : 1);
    return [...limb([top.x, top.y], kn, 3, 2.5, c.base), ...limb(kn, [fx, fy - 0.8], 2.5, 2.1, c.base),
      E(fx + 0.6, fy - 0.1, 1.8, 1, near ? sock : hue(sock, 0, 0, -6)), F(E(fx + 1, fy - 0.5, 0.7, 0.3, near ? hue(sock, 0, -8, 12) : sock))];
  };
  out.push(...leg(bx - 4.4, by + 1.6, 10.8, 0.5, false, false), ...leg(bx + 3.8, by + 1.8, 19.2, 0, false, true));

  // Body: haunch and barrel in fur, the cream chest; it swells as it breathes in.
  const body = [];
  const sw = br * 0.3;
  body.push(E(bx - 3.8, by + 0.2, 4, 4.1, fur.base), E(bx, by, 6.8 + sw * 0.3, 4.4 + sw, fur.base), E(bx + 4.4, by + 0.8, 3.2 + sw * 0.4, 3.6 + sw, cream.base));
  body.push(crescent(bx - 0.6, by + 0.1, 7.4, 4.5 + sw, fur.sh, { k: 0.3, a0: 60, a1: 215, jag: 0.45 }),
    // the haunch's shadow only where it bulges past the barrel (its back), so the two shadows
    // meet in one line instead of a blotch where they overlap
    crescent(bx - 3.8, by + 0.2, 4, 4.1, fur.sh, { k: 0.4, a0: 120, a1: 200, jag: 0.5 }),
    crescent(bx + 4.4, by + 0.8, 3.2, 3.6 + sw, cream.sh, { k: 0.3, a0: 50, a1: 150 }),
    shine(bx + 0.6, by - 0.2, 6.4, 4.4, fur.hi, 0, 1.2));
  out.push(...spin(body, hip[0], hip[1], pitch));
  out.push(...leg(bx - 2.8, by + 2.4, 12.2, 0, true, false), ...leg(bx + 5.2, by + 2.6, 20.4, 0.5, true, true));

  // Head on the neck: steadied against the trot (it nods a beat after the body), glancing about
  // when idle, thrown back when hurt, resting on the ground when dead.
  const neck = bodyAt(bx + 4.6, by - 2.2);
  const nod = walk ? Math.sin(2 * TAU * q - 2.2) * 0.45 : idle ? -0.5 * br + 0.25 * sway(q - 0.1) : 0;
  const hx = neck.x + 3.4 + (dead ? 0.6 : 0) - (walk ? surge * 0.4 : 0);
  const hy = neck.y - 5.2 + nod + (dead ? 3 : 0) + (hurt ? -0.4 : 0) - (walk ? bob * 0.4 : 0);
  const headTurn = (A ? A.head : 0) + (hurt ? -8 : 0) + (dead ? 8 : 0) + pitch * 0.4;
  const glance = idle ? 0.5 * Math.cos(TAU * q) : 0;
  const head = [];

  // Ruff: a fluffy cream collar, bristling when angry.
  const spike = angry ? 1.6 : 0;
  head.push(E(hx - 4.2, hy + 6.4, 3.4, 2.6, cream.base), E(hx - 0.8, hy + 7.2, 3.6, 2.6, cream.base), E(hx + 2.4, hy + 6.6, 2.8, 2.2, cream.base),
    // one bib down into the chest, so ruff and chest read as a single cream mass, not stripes
    E(hx - 0.4, hy + 9.4, 3.4, 2.8, cream.base));
  for (const [x, y] of angry ? [[hx - 5.6, hy + 8], [hx - 3, hy + 9], [hx - 0.4, hy + 9.4], [hx + 2.2, hy + 8.6]] : [[hx - 3.6, hy + 8.8], [hx + 0.4, hy + 9.2]]) {
    head.push(T([[x - 1.4, y - 1], [x + 1.4, y - 1], [x + 0.2, y + 1.2 + spike]], cream.base));
  }
  head.push(crescent(hx - 1.4, hy + 8.4, 5.6, 3.4, cream.sh, { k: 0.3, a0: 95, a1: 175 }));

  // Ears: chains of two links from the skull, swinging a beat behind the head; the near one
  // flicks when idle; pinned back when hurt or angry, limp when dead.
  const droop = dead ? 1 : hurt ? 0.75 : angry ? 0.4 : 0;
  const eph = walk ? 2 * TAU * q - 2.9 : TAU * q - 0.8;
  const ear = (b0, b1, a0, len, near) => {
    const twitch = idle && near ? bump(q, 0.67, 0.2) * -22 : idle ? bump(q, 0.17, 0.2) * -12 : 0;
    const base = a0 - droop * (near ? 85 : 55) + twitch;
    const mid = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2];
    const pts = chain(mid[0], mid[1], base, [len * 0.55, len * 0.45], (i) => (i ? -6 : 0) + wave(eph, walk ? 5 : 2.5, 0.8)(i));
    const [m, tip] = [pts[1], pts[2]];
    const n = [-Math.sin(pts[1][2] * D2R), Math.cos(pts[1][2] * D2R)];
    const half = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]) * 0.32;
    const c = near ? fur : { base: fur.sh, hi: fur.base, deep: fur.deep };
    const lp = (u, v, t) => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
    return [T([b0, [m[0] - n[0] * half, m[1] - n[1] * half], tip, [m[0] + n[0] * half, m[1] + n[1] * half], b1], c.base),
      F(T([lp(b0, b1, 0.3), lp(m, tip, 0.1).map((v, j) => v - n[j] * half * 0.45), lp(mid, tip, 0.8), lp(m, tip, 0.1).map((v, j) => v + n[j] * half * 0.45), lp(b0, b1, 0.72)], near ? '#ffb3c6' : '#f09bb0')),
      F(T([tip, lp(tip, m, 0.45).map((v, j) => v - n[j] * half * 0.5), lp(tip, m, 0.45).map((v, j) => v + n[j] * half * 0.5)], sock))];
  };
  head.push(...ear([hx - 6.4, hy - 2.4], [hx - 1.4, hy - 5.8], -112, 9.4, false));
  // The skull: the shadow on its back and under the jaw, the light on its brow.
  head.push(E(hx, hy, 8, 6.9, fur.base));
  head.push(...ear([hx + 0.2, hy - 6.2], [hx + 5.6, hy - 3.6], -76, 9.6, true));
  head.push(crescent(hx, hy, 8, 6.9, fur.sh, { k: 0.3, a0: 105, a1: 230, jag: 0.6 }));
  // Cheek fluff and the cream lower face and muzzle.
  head.push(T([[hx - 6.6, hy + 0.6], [hx - 9.4, hy + 4.8], [hx - 6.4, hy + 3.8], [hx - 7, hy + 6.6], [hx - 3.4, hy + 5.4]], fur.sh),
    E(hx + 1.6, hy + 3.4, 5.6, 3.2, cream.base), E(hx + 6.4, hy + 2.8, 3.2, 2.3, cream.base),
    crescent(hx + 2.4, hy + 3.4, 5.8, 3.1, cream.sh, { k: 0.5, a0: 60, a1: 170 }),
    shine(hx + 1.6, hy - 2.4, 6.4, 4.4, fur.hi, 0, 1.15));
  // Face: sly almond fox eyes (spirit-blue irises that answer the tail flames and stand out from
  // the orange fur; slit pupils, red liner wings) under red maro brows. Smug and half-lidded at
  // rest, a narrow pink glare when angry, a tight wince when hurt, swirled when dead.
  const ey = hy + 0.6;
  const eyeF = [hx - 2.6, ey + 0.1];
  const eyeN = [hx + 3.5, ey];
  const lashC = '#3a1f2e';
  const fe = { shape: 'almond', tilt: 0.5, iris: angry || A ? ['#8a1e48', '#ff4f8a', '#ffc6da'] : ['#24306e', '#4f86e0', '#b4ecff'], pupil: 'slit', lashC, liner: mark, lower: 0.6, look: [glance, 0] };
  const act = { idle: { lid: 0.26, slant: -0.1 }, angry: { lid: 0.12, slant: 0.9, raise: 0.25, pupilK: 0.5 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  // Simple eyes (the player's pick): sly and half-lidded at rest, a liner flick at the corner.
  const em = A && !hurt ? 'angry' : { idle: 'idle', angry: 'angry', hurt: 'hurt', happy: 'happy', blink: 'blink' }[mood] ?? 'idle';
  const so = { iris: angry || A ? '#ff4f8a' : '#b05878', ink: lashC, wing: 1, lid: 0.1, mood: em };
  if (dead) head.push(...deadEye(eyeF[0], eyeF[1], 1.9, { type: 'swirl', s: -1, c: lashC }), ...deadEye(eyeN[0], eyeN[1], 2.3, { type: 'swirl', c: lashC }));
  else head.push(...simpleEye(eyeF[0], eyeF[1], { ...so, s: -1, w: 1.6, h: 2.1 }), ...simpleEye(eyeN[0], eyeN[1], { ...so, s: 1, w: 2, h: 2.4 }));
  // Maro brows: lopsided (one cocked: smug), slammed into slants, lifted in a pained tilt.
  const [ba, bf, bn] = browsFor({ idle: [-6, 0.1, 0.8], angry: [34, -1.1, -1.1], hurt: [-30, 0.7, 0.7], happy: [-12, 0.7, 0.7], blink: [0, 0, 0], dead: [-15, 0.3, 0.3] }, mood);
  head.push(...brow(eyeF[0] - 0.2, ey - 4 - bf, { s: -1, len: 1.3, angle: ba, th: 0.7, c: mark, shape: 'dot' }),
    ...brow(eyeN[0] + 0.1, ey - 4.3 - bn, { s: 1, len: 1.5, angle: ba, th: 0.78, c: mark, shape: 'dot' }));
  if (!dead) head.push(...cheek(hx - 3.8, ey + 3.4, 1.1, { on: cream.base, lines: happy ? 2 : 0 }), ...cheek(hx + 2.6, ey + 3.8, 1.3, { on: cream.base, lines: happy || hurt ? 3 : 0 }));
  // Nose pad and mouth on the muzzle.
  const sniff = idle ? bump(q, 0.83, 0.18) * 0.3 : 0;
  head.push(...nose(hx + 9.2, hy + 1.8 - sniff, { r: 1.05, c: '#3a2a3a' }));
  const mx = hx + 6.5;
  const my = hy + 4.6;
  const g = A && !dead && !hurt ? A.g : 0;
  const mo = { s: 1, ink: '#7a2e40' };
  head.push(...simpleMouth(mx - 1.4, my, { k: 1.2, mood: dead ? 'dead' : g > 0.3 ? 'shout' : angry ? 'angry' : happy ? 'happy' : hurt ? 'hurt' : 'idle', smug: true, lip: '#7a2e40' }));
  // Marks: a vein when angry; when hurt, a sweat drop and a tear welling in the near eye.
  if (angry) head.push(...vein(hx - 4.4, hy - 4, 1.1));
  if (hurt) head.push(...sweat(hx - 6.2, hy - 3.6, 1.1), ...tear(eyeN[0] + 1, ey + 2.4, 0.9, { type: 'stream', len: 2.6 }));
  out.push(...spin(head, neck.x, neck.y, headTurn));

  // A blossom tucked at the near ear's root, riding the head.
  out.push(...spin(blossom(hx + 4.6, hy - 4.2, 2.8, '#ff8fb4', '#ffc4d8'), neck.x, neck.y, headTurn));
  // The pounce: a smear under the leap, then petals bursting up round the landing.
  if (A && !dead) {
    if (fk === 1) out.push(smear([[bx - 10, by + 6], [bx - 2, by + 2], [bx + 6, by - 1]], 3.4, '#ffe4ee'));
    if (A.burst > 0.05) {
      const k2 = A.burst;
      for (const [dx, dy, r] of [[-3, -3, 1.4], [3, -5, 1.6], [8, -3, 1.3], [12, -1, 1.1], [0, -7, 1.1]]) {
        const lift2 = (1 - k2) * 4;
        out.push(E(hx + 4 + dx, 29 + dy * (0.6 + 0.6 * (1 - k2)) - lift2, r * (0.5 + k2 * 0.5), r * 0.7 * (0.5 + k2 * 0.5), dx % 2 ? '#ffd0e0' : '#ffffff'));
      }
      if (fk === 2) out.push(...dust(hx + 6, 29.6, 0.7), ...star(hx + 11, 26, 2.2, '#fff2a8'));
    }
  }
  return { w: 42, h: 32, res: 3, shapes: out.map((q2) => ({ ...q2, x: q2.x + 6, y: q2.y + 2 })) };
}

// ---------- Bud Snail (snailbun) ----------
// (Petal Meadow's new cast, 2026-11-11: replaced the Moss Tortoise.) A plump peach snail whose
// shell is a big pink flower bud. It creeps on a soft body that ripples from tail to head, its
// antennae bobbing a beat behind; the bud sways on its back. Cross, it flicks the bud open into a
// bloom and sneezes a puff of pollen; hurt, the bud pops open in fright; dead, the bloom wilts.

// Attack: the pollen sneeze. pull: head drawn back (-) or thrust (+), open: how far the bud
// blooms (0 shut, 1 wide), tilt: bud lean (deg, + forward), puff: pollen cloud size, lift: body
// rear (the front rising).
const BUD_ATK = [
  // Wind-up (held): head tucked back, the bud rocked back and squeezed shut, the front rising.
  { pull: -2.6, open: 0, tilt: -14, puff: 0, lift: 1.6 },
  // Strike: the bud flicks forward and bursts open, pollen blasting out ahead.
  { pull: 1.8, open: 1, tilt: 16, puff: 3.4, lift: 0 },
  // Impact (held): wide open, the cloud at full size with a star in it.
  { pull: 1.4, open: 0.92, tilt: 11, puff: 6, lift: 0 },
  // Recover: the bloom folding back up, the last of the cloud drifting.
  { pull: -0.4, open: 0.3, tilt: -3, puff: 7.4, lift: 0 },
];

// An attack pose between keys (an art with `atkTween`): frame f = key + quarters; each key holds
// for the first part of its beat, then eases into the next (or back to rest after the last).
function atkPose(table, f, rest) {
  const k = Math.floor(f);
  const u = Math.max(0, Math.min(1, (f - k - 0.25) / 0.75));
  const e = u * u * (3 - 2 * u);
  const a = table[k];
  const b = table[k + 1] ?? rest;
  const out = {};
  for (const key of Object.keys(a)) out[key] = a[key] + ((b[key] ?? a[key]) - a[key]) * e;
  return out;
}

function budSnail(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? atkPose(BUD_ATK, f, { pull: 0, open: 0, tilt: 0, puff: 8, lift: 0 }) : null;
  const fk = Math.floor(f);
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // Peach body warming to rose in shadow; a pink bud deepening to raspberry; leafy green sepals.
  const skin = ramp('#ffdcc4', { step: 9, turn: 14, sat: -6 });
  const bud = ramp('#ff9cc4', { step: 10, turn: 12, sat: -8 });
  const leafC = ramp('#8fd08a', { step: 10, turn: 16, sat: -10 });
  const out = [];
  const br = idle ? breath(q) : 0;

  // The body: round segments along the foot, a ripple running from the tail to the head as it
  // creeps (each segment lifts in turn), resting flat when dead.
  const segs = [[4.6, 2.6], [8.4, 3.1], [12.4, 3.5], [16.6, 3.8], [20.8, 3.9], [24.8, 3.8]];
  const lift = (i) => (walk ? 1.3 * Math.max(0, Math.sin(TAU * q - i * 0.85)) : idle ? br * 0.25 * (i / 5) : 0) + (A && i >= 4 ? A.lift * (i - 3) * 0.5 : 0);
  const sy = (i) => 27.2 - segs[i][1] - lift(i) + (dead ? 0.8 : 0);
  segs.forEach(([x, r], i) => out.push(E(x, sy(i), r + 0.6, r, skin.base)));
  // Its underside in shadow and a soft lit line along the back.
  out.push(F(E(14.6, 26.4, 11.6, 1.1, skin.sh)));
  segs.slice(1, 5).forEach(([x, r], i) => out.push(F(E(x - 0.4, sy(i + 1) - r * 0.55, r * 0.5, r * 0.18, skin.hi))));

  // The neck and head: the neck rises from the front of the foot, the head pushes forward with
  // each creep, draws back to wind up, flops when dead.
  const push = A ? A.pull : walk ? 0.9 * Math.sin(TAU * q - 4.2) : idle ? sway(q) * 0.4 : hurt ? -1.4 : 0;
  const hx = 30.4 + push + (dead ? 2 : 0);
  const hy = (dead ? 22.4 : 15.6 - br * 0.6 + (A ? -A.lift : 0)) + (walk ? -0.5 * Math.max(0, Math.sin(TAU * q - 4.6)) : 0);
  out.push(...limb([25.6, sy(5) - 0.6], [hx - 1.6, hy + 2.4], 4.4, 4.8, skin.base));

  // The bud shell, sitting on the body's back and swaying a beat behind it. It blooms open
  // (petals splaying out round a golden heart) when it attacks, is hurt, or is happy; dead, the
  // bloom wilts and droops.
  const open = dead ? 0.2 : A ? A.open : hurt ? 0.85 : happy ? 0.55 : 0;
  const tilt = (A ? A.tilt : walk ? 5 * Math.sin(TAU * q - 1.6) : idle ? sway(q) * 4 : 0) + (dead ? 26 : 0) + (hurt ? -6 : 0);
  const bx = 15.6;
  const by = sy(3) - 2.2 + (idle ? -br * 0.5 : 0);
  const sh = [];
  // Sepals: two leafy cups hugging the bud's foot.
  sh.push(leaf(bx - 1, by + 0.6, 196, 6.2, 2.2, leafC.sh), leaf(bx + 1, by + 0.6, -16, 6.2, 2.2, leafC.base));
  const droop = dead ? 36 : 0;
  if (open > 0.25) {
    // The outer petals, behind, opening out flat.
    const o = (open - 0.25) / 0.75;
    for (const s of [-1, 1]) sh.push(leaf(bx, by - 1, -90 + s * (34 + 26 * o) + (dead ? s * droop : 0), 11.5 + o, 4.8, bud.sh));
  }
  // The heart, shown as it opens.
  if (open > 0.1 && !dead) sh.push(E(bx, by - 10 - 1.5 * open, 2.4 + open * 1.2, 1.8 + open * 0.8, dead ? '#e8c87a' : '#ffe27a'), F(E(bx - 0.7, by - 10.8 - 1.5 * open, 1, 0.6, '#fff6c8')));
  // The three main petals: the side ones turned in to a closed bud, opening out with `open`.
  for (const s of [-1, 1]) sh.push(leaf(bx + s * 0.6, by, -90 + s * (16 + 20 * open) + (dead ? s * droop : 0), 15 - 1.5 * open, 5.6, s < 0 ? bud.base : bud.hi));
  if (open < 0.6) {
    const c = 1 - open / 0.6;
    sh.push(leaf(bx, by + 0.4, -90, 15.6 * (0.55 + 0.45 * c), 5.2, bud.base));
    // A soft swirl down the front petal, where the bud's petals wrap.
    sh.push(...stroke([[bx + 1.6, by - 12.4 * c], [bx + 0.4, by - 8.4 * c], [bx + 1.4, by - 4]], 0.6, bud.hi), F(E(bx - 1.8, by - 9 * c, 0.9, 2.6 * c, mix(bud.hi, '#ffffff', 0.4))));
  }
  out.push(...spin(sh, bx, by + 1, tilt));

  // Antennae: two little stalks from the top of the head, each a chain swaying a beat behind the
  // head, with a round pink bulb on the end; they droop when it's sad or dead and stand up cross.
  const head = [];
  head.push(E(hx, hy, 5.4, 5, skin.base), crescent(hx + 0.4, hy + 0.3, 5.9, 5.4, skin.sh, { k: 0.3, a0: 60, a1: 210 }), shine(hx, hy, 5.4, 5, skin.hi, 0, 1.1));
  const aph = walk ? TAU * q - 2.4 : idle ? TAU * q - 1.2 : 0;
  for (const [x0, a0, s] of [[hx - 2, -112, -1], [hx + 1.4, -78, 1]]) {
    const base = dead ? a0 + s * 60 + 40 : hurt ? a0 + s * 30 : angry ? a0 - s * 6 : a0;
    const ch = chain(x0, hy - 4.2, base, [2.4, 2.4], wave(aph + s * 0.5, walk ? 12 : idle ? 9 : 0));
    const tip = ch.at(-1);
    head.push(...stroke(ch.map((p) => p.slice(0, 2)), 0.75, skin.sh), E(tip[0], tip[1], 1.3, 1.3, bud.base), F(E(tip[0] - 0.4, tip[1] - 0.4, 0.45, 0.45, '#ffffff')));
  }
  // Face: big bright eyes, rosy cheeks, a tiny smile; a pout when cross, tears when hurt.
  const ey = hy - 0.2;
  const eyeF = [hx - 1.4, ey];
  const eyeN = [hx + 2.4, ey - 0.1];
  const ink = '#4a2f3a';
  if (dead) head.push(...deadEye(eyeF[0], eyeF[1], 1.2, { c: ink, th: 0.5 }), ...deadEye(eyeN[0], eyeN[1], 1.4, { c: ink, th: 0.55 }));
  else {
    const so = { iris: angry || A ? '#d0507a' : '#7a4a5a', ink, lid: 0, mood: A && !hurt ? 'angry' : { idle: 'idle', angry: 'angry', hurt: 'hurt', happy: 'happy', blink: 'blink' }[mood] ?? 'idle' };
    head.push(...simpleEye(eyeF[0], eyeF[1], { ...so, s: -1, w: 1.6, h: 2.2 }), ...simpleEye(eyeN[0], eyeN[1], { ...so, s: 1, w: 1.9, h: 2.5 }));
  }
  if (angry || A) head.push(...brow(eyeF[0], ey - 2.9, { s: -1, len: 1.1, angle: 26, th: 0.6, c: ink }), ...brow(eyeN[0], ey - 3.1, { s: 1, len: 1.4, angle: 26, th: 0.65, c: ink }));
  if (!dead) head.push(...cheek(hx - 2.2, ey + 2.6, 1, { on: skin.base }), ...cheek(hx + 2.6, ey + 2.8, 1.1, { on: skin.base }));
  const sneeze = A && fk >= 1 && fk <= 2;
  head.push(...simpleMouth(hx + 1.6, ey + 2.6, { k: 0.9, mood: dead ? 'dead' : sneeze ? 'shout' : angry ? 'angry' : happy ? 'happy' : hurt ? 'hurt' : 'idle', lip: ink }));
  if (hurt) head.push(...tear(eyeN[0] + 0.4, ey + 1.4, 0.8, { type: 'stream', len: 3 }), ...sweat(hx - 4.4, hy - 3, 0.9));
  if (angry) head.push(...vein(hx - 2.4, hy - 3.4, 0.7));
  out.push(...spin(head, hx - 1.6, hy + 3, dead ? 18 : A ? -A.pull * 2 : walk ? 3 * Math.sin(TAU * q - 4.2) : idle ? -br * 3 : 0));

  // The pollen sneeze: a smear on the strike, then a golden cloud billowing ahead of the bloom.
  if (A && A.puff) {
    const cx = Math.min(37, 34 + A.puff * 0.4);
    const cy = hy - 6 - A.puff * 0.3;
    const k = A.puff / 6;
    for (const [dx, dy, r] of [[0, 0, 2.4], [2.4, -1.6, 1.8], [2.2, 1.6, 1.6], [-1.8, -1.2, 1.3]]) out.push(E(cx + dx * k, cy + dy * k, r * Math.min(1.2, 0.5 + k * 0.6), r * Math.min(1.2, 0.5 + k * 0.6), fk === 3 ? '#fff4c8' : '#ffe27a'));
    if (A.puff >= 6 && fk === 2) out.push(...star(cx + 1, cy - 2, 2.6, '#fff2a8'));
  }
  if (A && fk === 2) out.push(...dust(30, 27.6, 0.7));
  return { w: 40, h: 28, res: 3, shapes: out };
}

// ---------- Turnip Tot (sproutling) ----------
// (Clover Hills' new cast, 2026-11-11: replaced the Mandrake.) A plump little turnip pulled up
// out of the patch: a bulb purple-pink on top fading to cream, a root tail, three leaves on its
// crown, tiny rootlet arms and a big-eyed face. No legs: it gets about in bouncy hops, leaves
// flopping a beat behind. It attacks by rocking back and hopping in for a headbutt.

// Attack: the headbutt. bx/by: shift (by - is up), tilt: lean (deg, + forward), arms: rootlet
// arms raised (0 down, 1 up), imp: the bonk.
const TOT_ATK = [
  // Wind-up (held): rocked back, arms up, eyes narrowed.
  { bx: -2.4, by: 0, tilt: -18, arms: 1, imp: 0 },
  // Hop: up and forward, leaning in head first.
  { bx: 3, by: -5, tilt: 16, arms: -0.4, imp: 0 },
  // Impact (held): the bonk, nose down, a star at its brow.
  { bx: 4.4, by: 0, tilt: 22, arms: -0.6, imp: 1 },
  // Recover: rocking back upright past rest.
  { bx: 1, by: 0, tilt: -5, arms: 0.2, imp: 0 },
];

// Where a Turnip Tot is in its walk or idle at phase f (frames, unstepped): wad/hh the waddle and
// hop parts (-1 outside them), rock -1..1, wig the idle wiggle, flung how far its leaves are
// thrown back in the hop.
function totPhase(pose, f) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const WAD = 0.64;
  const wad = walk && q < WAD ? q / WAD : -1;
  const hh = walk && q >= WAD ? (q - WAD) / (1 - WAD) : -1;
  const rock = wad >= 0 ? Math.sin(TAU * wad) : 0;
  const wig = idle && q > 0.72 && q < 0.96 ? Math.sin(((q - 0.72) / 0.24) * TAU * 2) * (1 - (q - 0.72) / 0.24) : 0;
  return { q, wad, hh, rock, wig, flung: hh >= 0 ? Math.sin(hh * Math.PI) : 0 };
}
// Its body motion, live (render/monsters.js applies it every frame about its feet): waddle,
// waddle, hop; idle, a breath, a sway and the odd happy wiggle.
function totMotion(pose, f) {
  const { q, wad, hh, rock, wig } = totPhase(pose, f);
  if (pose === 'walk') {
    const hop = hh >= 0 ? Math.sin(hh * Math.PI) * 6 : 0;
    return { dx: wad >= 0 ? rock * 0.8 : 0, lift: hop + Math.abs(rock) * 0.6, rot: rock * 16 + (hh >= 0 ? 10 * Math.sin(hh * Math.PI) * (hh < 0.5 ? 1 : -0.4) : 0) };
  }
  if (pose === 'idle') return { dx: sway(q) * 0.4, lift: breath(q) * 0.6, rot: sway(q) * 3 + wig * 7 };
  return {};
}

function turnipTot(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? atkPose(TOT_ATK, f, { bx: 0, by: 0, tilt: 0, arms: 0, imp: 0 }) : null;
  const fk = Math.floor(f);
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const top = ramp('#d79ae0', { step: 10, turn: 12, sat: -6 });
  const cream = ramp('#fff4ea', { step: 6, turn: 30 });
  const leafC = ramp('#86d27a', { step: 10, turn: 16, sat: -8 });
  const out = [];
  // Its walk (2026-11-11, made its own at the player's ask): waddle, waddle, HOP. Two rocks side to
  // side like a wobbly toy (no legs, not even root toes: they read as legs), then a springy hop
  // with an "o" of a face and its leaves flung back. Idle, it
  // breathes, and now and then gives a happy wiggle that sets its leaves flicking. Dead, it lies
  // on its side.
  // (The rock, hop and wiggle themselves are applied live by the renderer every frame,
  // totMotion below: the drawn poses carry only what moves on the body, leaves and face, so
  // the body glides instead of stepping through poses.)
  const { wad, hh, rock, wig, flung } = totPhase(walk ? 'walk' : idle ? 'idle' : pose, f);
  const bx = 18 + (A ? A.bx : 0) + (hurt ? -1.4 : 0);
  // (Dead, it lies on its side: lifted by its half-width so it rests on the ground, not in it.)
  const base = 30.6 + (A ? A.by : 0) - (dead ? 9.4 : 0);
  const tilt = dead ? 90 : (A ? A.tilt : 0) + (hurt ? -12 : 0);
  const cy = base - 9;
  const body = [];
  // The root tail under the bulb, and the bulb itself: cream below, the purple top blushing down.
  body.push(T([[bx - 1.6, base - 2], [bx + 0.4, base + 2.6], [bx + 1.6, base - 2]], cream.sh));
  body.push(E(bx, cy, 9.6, 9, cream.base));
  body.push(T([[bx - 9.6, cy - 0.6], [bx - 8.4, cy - 5.6], [bx - 4, cy - 8.8], [bx + 4, cy - 8.8], [bx + 8.4, cy - 5.6], [bx + 9.6, cy - 0.6], [bx + 5, cy + 1.6], [bx, cy + 0.6], [bx - 5, cy + 1.8]], top.base));
  body.push(crescent(bx, cy, 9.6, 9, top.sh, { k: 0.26, a0: 200, a1: 300 }), crescent(bx, cy, 9.6, 9, cream.sh, { k: 0.26, a0: 30, a1: 150 }), shine(bx, cy, 9.6, 9, '#ffffff', 0, 1.1));
  for (const [x, y] of [[bx - 5, cy + 4], [bx + 3, cy + 6], [bx + 6.4, cy + 2.4]]) body.push(F(T([[x, y], [x + 1.2, y + 0.4], [x + 0.2, y + 0.9]], cream.sh)));
  // Three leaves on the crown, each a chain flopping a beat behind the hop.
  // (They counter-swing against each rock, so they stay perky, flung back in the hop, and flick
  // in the idle wiggle.)
  const lph = walk ? TAU * q * 2 - 1.8 : TAU * q - 1.2;
  const droop = dead ? 40 : hurt ? 24 : 0;
  const counter = -rock * 9 - flung * 22 - wig * 10;
  for (const [a0, len, c, k] of [[-118, 7, leafC.sh, 0], [-90, 8.4, leafC.base, 1], [-62, 7, leafC.hi, 2]]) {
    const ch = chain(bx + (k - 1) * 1.4, cy - 8.4, a0 + (a0 < -90 ? -droop : a0 > -90 ? droop : 0) + counter, [2.4, 2.4], wave(lph + k * 0.6, walk ? 10 : idle ? 8 + Math.abs(wig) * 14 : 4));
    body.push(...stroke(ch.map((p) => p.slice(0, 2)), 0.9, '#5fae5c'), leaf(ch[2][0], ch[2][1], ch[2][2], len * 0.7, 2.4, c));
  }
  // Rootlet arms from the sides: down at rest, up winding up, waving as it hops.
  const ar = A ? A.arms : hurt ? 0.8 : 0;
  const wv = walk ? Math.sin(TAU * q * 2) * 0.4 : 0;
  for (const sd of [-1, 1]) {
    const sx0 = bx + sd * 8.6;
    const sy0 = cy + 2;
    const hx = sx0 + sd * 3.4;
    const hy = sy0 + 2.6 - (ar + wv * sd) * 5;
    body.push(...stroke([[sx0, sy0], [hx, hy]], 1, cream.sh), E(hx, hy, 1, 1, cream.sh));
  }
  // The face.
  const ink = '#4a2f4a';
  const ey = cy + 0.4;
  if (dead) body.push(...deadEye(bx - 1.6, ey, 1.2, { c: ink, th: 0.5 }), ...deadEye(bx + 3.4, ey, 1.4, { c: ink, th: 0.55 }));
  else {
    const so = { iris: angry || A ? '#d0507a' : '#8a5a7a', ink, lid: 0, mood: A && !hurt ? 'angry' : { idle: 'idle', angry: 'angry', hurt: 'hurt', happy: 'happy', blink: 'blink' }[mood] ?? 'idle' };
    body.push(...simpleEye(bx - 1.6, ey, { ...so, s: -1, w: 1.6, h: 2.1 }), ...simpleEye(bx + 3.4, ey - 0.1, { ...so, s: 1, w: 1.9, h: 2.4 }));
  }
  if (angry || A) body.push(...brow(bx - 1.6, ey - 3, { s: -1, len: 1.1, angle: 26, th: 0.6, c: ink }), ...brow(bx + 3.4, ey - 3.2, { s: 1, len: 1.4, angle: 26, th: 0.65, c: ink }));
  if (!dead) body.push(...cheek(bx - 4, ey + 2.6, 1.1, { on: cream.base }), ...cheek(bx + 6, ey + 2.6, 1.2, { on: cream.base }));
  body.push(...simpleMouth(bx + 1, ey + 3, { k: 0.95, mood: dead ? 'dead' : (A && fk === 2) || flung > 0.4 ? 'shout' : angry ? 'angry' : happy || Math.abs(wig) > 0.3 ? 'happy' : hurt ? 'hurt' : 'idle', lip: ink }));
  if (hurt) body.push(...tear(bx + 4.2, ey + 1.2, 0.8, { type: 'stream', len: 2.6 }), ...sweat(bx - 7, cy - 6, 0.9));
  if (angry && !A) body.push(...vein(bx - 5, cy - 5, 0.8));
  out.push(...spin(body, bx, base, tilt));
  // A soil puff as it lands from each hop, and the bonk.
  // (The dust puffs on landing are left out of the drawn poses: they'd ride along with the body.)
  if (A && fk === 1) out.push(smear([[bx - 10, base - 4], [bx - 4, base - 8], [bx + 2, base - 10]], 3, '#fff4ea'));
  if (A && fk === 2) out.push(...star(bx + 11, cy - 4, 2.8, '#fff2a8'), ...dust(bx + 6, 31.4, 0.7));
  return { w: 36, h: 34, res: 3, shapes: out };
}

export const ART = {
  puffle: { pad: 7, sub: 8, atkTween: true, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [45, 190, 140], draw: blossomKit },
  snailbun: { pad: 7, sub: 8, atkTween: true, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [70, 270, 210], draw: budSnail },
  // (Its live motion is a rig now, render/mobs/turniprig.js: these frames are its still pictures.)
  sproutling: { pad: 6, sub: 16, atkTween: true, idleCycle: 3.2, walk: 8, idle: 6, attack: 4, stride: 44, atkMs: [55, 240, 170], draw: turnipTot },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  puffle: { name: 'Blossom Kit', w: 22, h: 20 },
  snailbun: { name: 'Bud Snail', w: 30, h: 24 },
  sproutling: { name: 'Turnip Tot', w: 20, h: 24 },
};
