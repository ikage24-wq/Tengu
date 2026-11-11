// Monster art: Petal Meadow and Clover Hills (levels 1-8), the first monsters a player meets.
//   puffle      Blossom Kit: a pale pink fox kit with a blossom-tipped tail; it pounces
//   snailbun    Bud Snail: a plump peach snail whose shell is a pink flower bud that blooms
//   sproutling  Mandrake: a root creature with a leafy crown that screams when angry
//   mushkin     Toadstool Goblin: a goblin in a spotted mushroom-cap helmet with a club
//   piglet      Jackalope: a fluffy antlered hare that bounds along
// Every design faces right with its feet on the bottom edge; see kit.js for the shapes. Each has
// its own gait (a light trot, a heavy plod, a root-footed scurry, a bow-legged swagger, bounding
// hops), its own face built from faces.js (fox almond eyes, sleepy tortoise lids, a mandrake's
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

// ---------- Mandrake (sproutling) ----------

// Attack: the scream. by: crouch/stretch, rock: lean (deg), arms: hand offsets [far, near],
// spread: how far the crown flares, mouth: 0 shut tight, 1 screaming, ring: shockwave radii.
const MAN_ATK = [
  // Wind-up: squeezed down, leaning back, fists clenched to its chest, sucking in a breath.
  { by: 2.4, rock: -5, arms: [[-5.6, 1.6], [5.4, 1.4]], spread: -0.6, mouth: 0, ring: [] },
  // Scream: stretched tall, arms flung out, a shockwave bursting from the mouth.
  { by: -0.7, rock: 4, arms: [[-11.4, -9], [11.4, -9.6]], spread: 1, mouth: 1, ring: [4.5] },
  // The ring rolls out and a second one follows.
  { by: -0.4, rock: 2.5, arms: [[-11, -7.4], [11, -8]], spread: 0.8, mouth: 1, ring: [9, 4] },
  // Recover: settling, the last ring fading.
  { by: 0.4, rock: 0, arms: [[-9.4, 3.4], [9.6, 3]], spread: 0.2, mouth: 0.4, ring: [12] },
];

function mandrake(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? MAN_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const p = q * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // Parsnip root: peach turning rose-mauve in shadow.
  const R0 = ramp('#f7d5b6', { step: 9, turn: 18, sat: -10 });
  const root = R0.base;
  const rootD = R0.sh;
  const out = [];
  // A root-footed scurry: quick short steps, the whole body rocking from foot to foot.
  const DUTY = 0.6;
  const br = idle ? breath(q) : 0;
  const bob = dead ? 2 : walk ? 0.9 * Math.cos(2 * TAU * (q - 0.08)) - 0.2 : A ? A.by : hurt ? 0.8 : -br * 0.6;
  const rock = dead ? 0 : walk ? 5 * Math.sin(TAU * q - 0.3) : A ? A.rock : hurt ? -7 : 2.6 * sway(q);
  const bx = 15 + (hurt ? -1 : 0) + (walk ? 0.3 * Math.sin(2 * TAU * q) : idle ? sway(q - 0.1) * 0.4 : 0);
  const by = 22.5 + bob;

  // Root legs, scurrying.
  const leg = (x, ph, near) => {
    const [dx, up] = walk ? gait(q + ph, 7.8, 2.4, DUTY) : [0, 0];
    const fx = x + dx + (dead ? (near ? 2.4 : -2.4) : 0);
    const fy = 39.2 - up;
    const c = near ? root : rootD;
    const curl = up * 0.4;
    const hip = [x + (bx - 15), by + 7];
    const kn = reach(hip, [fx, fy - 1], 4.6, 4.6, 1);
    return [...limb(hip, kn, 4, 3.3, c), ...limb(kn, [fx, fy - 1], 3.3, 2.8, c), E(fx + 0.8, fy - 0.3, 2.2, 1.1, c),
      ...stroke([[fx + 2.6, fy - 0.2], [fx + 3.6, fy + 0.2 - curl]], 0.6, c, false), ...stroke([[fx - 1.2, fy - 0.2], [fx - 2.2, fy + 0.4 - curl]], 0.6, c, false)];
  };
  const legs = [];
  legs.push(...leg(12.4, 0.5, false));
  const body = [];
  // Arms: swinging wide with the scurry; flung up when angry or happy.
  const swing = walk ? Math.cos(TAU * q) * 2.4 : Math.sin(p) * 0.6 + (idle ? -bump(q, 0.5, 0.25) * 1.4 : 0);
  const armUp = angry ? 1 : happy ? 0.6 : 0;
  const hand = (s) => {
    if (dead) return s < 0 ? [5, by + 8] : [25, by + 8];
    if (A) return [bx + A.arms[s < 0 ? 0 : 1][0], by + A.arms[s < 0 ? 0 : 1][1]];
    return s < 0 ? [4.6 - armUp + (bx - 15), by + 4 + swing - armUp * 13] : [25.6 + armUp + (bx - 15), by + 4 - swing - armUp * 13];
  };
  const hand0 = hand(-1);
  const fist = A && A.mouth === 0;
  const fingers = (h, s, c) => (fist ? [E(h[0], h[1], 1.2, 1.1, c)] : [...stroke([[h[0], h[1]], [h[0] + s * 1.4, h[1] - 1]], 0.6, c, false), ...stroke([[h[0], h[1]], [h[0] + s * 0.8, h[1] + 1.4]], 0.6, c, false)]);
  const arm = (sh, h, s, c) => {
    const el = reach(sh, h, 5.2, 5.2, s > 0 ? -1 : 1);
    return [...limb(sh, el, 2.4, 2, c), ...limb(el, h, 2, 1.7, c), ...fingers(h, s, c)];
  };
  body.push(...arm([bx - 6, by - 1], hand0, -1, rootD));

  // Leafy crown: a lush rosette of broad, drooping leaves whipping a beat behind the body.
  const top = [bx, by - 9.4];
  const ldead = '#bcc58e';
  const crown = [
    ['#5aa857', -174, 11.5, 4.5], ['#5aa857', -6, 11.5, 4.5], ['#68b762', -146, 12, 2], ['#68b762', -34, 12, 2],
    ['#7fcf73', -120, 11.5, -0.5], ['#7fcf73', -60, 11.5, -0.5], ['#93db84', -90, 11, -1.5],
  ];
  crown.forEach(([c, a, len, bend], k) => {
    const side = a < -90 ? -1 : a > -90 ? 1 : 0;
    // The rock reaches the leaves late and the tips later still; idle, a rustle runs across them.
    const s = walk ? -rock * 1.1 + Math.sin(TAU * q - 1.6 - k * 0.35) * 5 : idle ? Math.sin(p - k * 0.7) * 4.5 - rock * 0.6 : (hurt ? side * 10 : 0);
    let ang = a + s;
    let bd = bend + (walk ? Math.abs(Math.sin(2 * TAU * q - 1 - k * 0.2)) * 1.6 * Math.abs(side) : 0);
    if (dead) {
      ang = side < 0 ? 196 + k * 6 : side > 0 ? -16 - k * 6 : -90;
      bd = side ? 7 : 0;
    } else if (A) {
      ang = -90 + (a + 90) * (1 + A.spread * 0.18) + s;
      bd = bend - 3 * A.spread;
    } else if (angry) {
      ang = -90 + (a + 90) * 0.78 + s * 1.5;
      bd = bend - 3;
    } else if (happy) {
      ang = -90 + (a + 90) * 0.9;
      bd = bend - 1.5;
    }
    if (dead && !side) return;
    const lc = dead ? ldead : c;
    body.push(...cleaf(top, ang, len * (dead ? 0.85 : 1.1), 2.5, bd, shade(lc, -20), null, 0.45), ...cleaf(top, ang, len * (dead ? 0.85 : 1.1), 2.5, bd, lc, shade(lc, -16)));
  });
  // A cluster of purple mandrake bells in the middle, bobbing on their stem.
  if (!dead) {
    const fs = walk ? Math.sin(TAU * q - 2.2) * 1.4 - rock * 0.15 : idle ? Math.sin(p - 1.4) * 0.9 : A ? -A.rock * 0.25 : 0;
    const fl = [top[0] + 0.6 + fs, top[1] - 9.6 + (angry ? -1 : 0) + (A ? -A.spread : 0)];
    body.push(...stroke([[top[0], top[1]], [top[0] + 0.4 + fs * 0.5, top[1] - 5], fl], 0.6, '#4f9a50'));
    for (const [dx, dy] of [[-1.6, 1.2], [1.6, 1.2], [0, -0.8], [-0.4, 2.6], [1.4, -1.6]]) {
      const dg = fs * 0.25;
      body.push(T([[fl[0] + dx - 1.1 + dg, fl[1] + dy - 0.9], [fl[0] + dx + 1.1 + dg, fl[1] + dy - 0.9], [fl[0] + dx + 1.3, fl[1] + dy + 0.9], [fl[0] + dx, fl[1] + dy + 0.5], [fl[0] + dx - 1.3, fl[1] + dy + 0.9]], '#b48cff'));
      body.push(F(E(fl[0] + dx - 0.3, fl[1] + dy - 0.3, 0.45, 0.35, '#dcc8ff')));
    }
  }

  // The root body: a plump parsnip with rings and root hairs.
  const sq = A ? -A.by * 0.25 : walk ? -bob * 0.25 : 0;
  body.push(E(bx, by - 8.4, 4.6, 2.6, root), E(bx, by, 8.8 - sq, 10 + sq, root), E(bx + 0.5, by + 7.4, 6.4, 3.6, root));
  body.push(crescent(bx, by + 0.4, 8.8 - sq, 10.4 + sq, rootD, { k: 0.26, a0: 55, a1: 205 }));
  // Growth rings: short creases on the shadow side only, fading out toward the light.
  for (const [y, w] of [[-3.6, 6], [1.8, 7.2], [6.4, 5.4]]) body.push(arc(bx + 0.4, by + y, w, 1.6, 95, 165, 0.5, R0.deep), arc(bx + 0.4, by + y, w, 1.6, 55, 95, 0.4, mix(R0.deep, rootD, 0.6)));
  for (const [x, y, d] of [[-8.6, -1, -1], [-8, 3.4, -1], [8.6, 0.4, 1], [8, 4.4, 1]]) {
    const wv = walk ? Math.sin(TAU * q * 2 - 1 + y) * 0.5 : 0;
    body.push(...stroke([[bx + x, by + y], [bx + x + d * 1.4, by + y + 0.6 + wv], [bx + x + d * 2, by + y + 1.6 + wv]], 0.45, rootD));
  }
  body.push(shine(bx, by - 1.6, 8.8, 9.6, R0.hi, 0, 0.85));
  // Dangling tail root between the legs, flicking after the rock.
  const tw = walk ? Math.sin(TAU * q - 2.2) * 1.6 : idle ? Math.sin(p - 1.2) * 0.6 : 0;
  body.push(...stroke([[bx - 0.6, by + 9], [bx - 1.2 + tw * 0.5, by + 12], [bx - 0.4 + tw, by + 14.2]], 0.9, rootD, false));

  // Face: huge round, innocent eyes (cream whites, leaf-green irises, round pupils) under thin,
  // worried root brows, and a little pursed mouth. Angry, the pupils shrink to pinpoints, the
  // irises burn ember and the mouth tears open into the scream; hurt, it bawls.
  const fx = bx + 2;
  const ey = by - 2;
  const glance = idle ? Math.cos(p) * 0.6 : 0;
  const eyeF = [fx - 3.4, ey + 0.1];
  const eyeN = [fx + 3, ey];
  const lashC = '#3a2230';
  const hot = angry || (A && A.mouth > 0);
  const me = { shape: 'round', sclera: '#fffbea', iris: hot ? ['#7a1e0a', '#ff7a1e', '#ffe36b'] : ['#24502a', '#4fae4a', '#c9f58a'], pupil: hot ? 'pin' : 'round', lashC, lash: 0.9, lower: 0.45, flicks: 1, look: [glance, 0.1] };
  const act = { idle: { lid: 0.05 }, angry: { lid: 0.12, slant: 0.65, pupilK: 1.1 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  if (A && A.mouth === 0 && !dead && !hurt) Object.assign(act, { closed: 'squeeze', squeeze: 0.8 });
  if (dead) body.push(...deadEye(eyeF[0], eyeF[1], 1.7, { c: lashC }), ...deadEye(eyeN[0], eyeN[1], 2, { c: lashC }));
  else body.push(...easyEye(eyeF[0], eyeF[1], { ...me, ...act, s: -1, w: 2.3, h: 2.6, irisW: 0.68 }), ...easyEye(eyeN[0], eyeN[1], { ...me, ...act, s: 1, w: 2.6, h: 2.9, irisW: 0.68 }));
  const [ba, bu] = hot && !A ? [36, -0.8] : A && A.mouth > 0 ? [30, -0.6] : browsFor({ idle: [-16, 0.4], angry: [36, -0.8], hurt: [-30, 0.6], happy: [-12, 0.8], blink: [-12, 0.2], dead: [-22, 0.2] }, mood);
  body.push(...brow(eyeF[0] - 0.2, ey - 3.6 - bu, { s: -1, len: 1.5, angle: ba, th: 0.6, arch: 0.4, c: '#9a6a4a' }),
    ...brow(eyeN[0] + 0.2, ey - 3.9 - bu, { s: 1, len: 1.7, angle: ba, th: 0.65, arch: 0.45, c: '#9a6a4a' }));
  if (!dead) body.push(...cheek(fx - 4.8, ey + 3.4, 1.3, { on: root, lines: happy || hurt ? 2 : 0 }), ...cheek(fx + 4, ey + 3.6, 1.4, { on: root, lines: happy || hurt ? 3 : 0 }));
  const mY = ey + 5;
  const scream = A ? A.mouth : angry ? 1 : -1;
  const mo = { s: 1, ink: '#7a3a3a' };
  if (A && A.mouth === 0 && !dead) {
    // Holding its breath: cheeks puffed, lips pressed tight.
    body.push(F(E(fx - 4.6, mY - 0.8, 1.7, 1.4, mix(root, BLUSH, 0.4))), F(E(fx + 4.4, mY - 0.7, 1.8, 1.5, mix(root, BLUSH, 0.4))),
      ...mouth(fx, mY, { ...mo, type: 'wavy', w: 1.4, amp: 0.22 }));
  } else if (scream > 0 && !dead && !hurt) {
    // The scream: thrown wide, teeth bared, tongue back.
    const k = 0.75 + scream * 0.25;
    body.push(...mouth(fx, mY - 0.4, { ...mo, type: 'shout', w: 2.9 * k, h: 5.2 * k, open: 1, teeth: 'top', fangs: 2, fangK: 0.8 }));
    if (!A) {
      const pulse = walk ? 0.8 * Math.sin(2 * TAU * q) : idle ? Math.sin(p * 2) * 0.6 : 0;
      for (const [r, c] of [[2.4 + pulse, '#ff9ec0'], [4 + pulse, '#d9a0ff']]) body.push(arc(fx + 8.2, mY + 1.6, r, r * 1.3, -50, 50, 0.6, c));
    }
  } else if (happy) {
    body.push(...mouth(fx, mY - 0.3, { ...mo, type: 'grin', w: 2.1, h: 3, open: 1, teeth: 'none' }));
  } else if (hurt) {
    // Bawling.
    body.push(...mouth(fx, mY - 0.2, { ...mo, type: 'shout', w: 1.9, h: 2.8, open: 0.9, curve: -0.5 }));
    body.push(...tear(eyeN[0] + 1.6, ey + 1.6, 1, { type: 'stream', len: 4.4 }), ...tear(eyeF[0] - 1.6, ey + 1.6, 0.9, { type: 'stream', len: 3.8, s: -1 }));
  } else if (dead) {
    body.push(...mouth(fx, mY, { ...mo, type: 'o', w: 0.9, h: 1.6, open: 0.8, tongue: false }));
  } else {
    body.push(...mouth(fx, mY, { ...mo, type: 'pout', w: 0.9, h: 1.5, open: 0.7 + (idle ? 0.25 * Math.sin(p) : 0) }));
  }
  if (angry && !A) body.push(...vein(fx - 6, ey - 5, 0.9));
  // Near arm.
  const hand1 = hand(1);
  body.push(...arm([bx + 6.4, by - 0.6], hand1, 1, root));
  // Shake lines while it screams.
  if (A && A.mouth === 1) body.push(...stroke([[bx - 10.6, by - 2], [bx - 12, by - 1]], 0.45, '#d9a0ff'), ...stroke([[bx - 10.4, by + 2], [bx - 12, by + 2.4]], 0.45, '#d9a0ff'));

  // The whole root rocks about its feet; the legs stay planted.
  out.push(...legs, ...spin(body, bx, 38, rock));
  out.push(...leg(18.2, 0, true));
  // Shockwave rings from the scream.
  if (A && !dead) {
    for (const r of A.ring) {
      const fade = r > 11 ? '#ead8ff' : r > 7 ? '#d9a0ff' : '#ff9ec0';
      out.push(...ring(fx + 0.6, mY + 1.5, r * 0.9, r * 1.1, r > 11 ? 0.5 : 0.8, fade, -80, 80), ...ring(fx + 0.6, mY + 1.5, r * 0.82, r * 1.02, 0.35, '#ffffff', -50, 50));
    }
  }
  return { w: 34, h: 44, res: 3, shapes: out.map((q2) => ({ ...q2, x: q2.x + 2, y: q2.y + 4 })) };
}

// ---------- Toadstool Goblin (mushkin) ----------

// Attack: an overhead club smash. hand/tip: the club, relative to the body; roll: lean (deg);
// step: front foot forward, smear: a swoosh behind the swing, imp: the smash.
const GOB_ATK = [
  // Wind-up: club cocked back over the head, leaning back, front foot raised.
  { hand: [1.6, -10.6], tip: [-6.4, -19.6], roll: -7, step: 2.4, up: 1.8, smear: 0, imp: 0, cap: -0.6 },
  // Swing: the club whips over and forward.
  { hand: [8.6, -7.4], tip: [14, -16.2], roll: 4, step: 3.4, up: 0, smear: 1, imp: 0, cap: 0.4 },
  // Smash: the club slams into the ground.
  { hand: [7.6, 2.2], tip: [15.4, 4.8], roll: 7, step: 3.4, up: 0, smear: 0.6, imp: 1, cap: 1.4 },
  // Recover: hauling the club back up.
  { hand: [8.4, -1], tip: [15, -8], roll: 2, step: 1.6, up: 0, smear: 0, imp: 0, cap: 0.4 },
];

function goblin(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? GOB_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const p = q * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // Ramps: frog-green skin cooling to teal, a toadstool-red cap deepening to crimson-violet,
  // cream gills, a russet hide loincloth, an oak club, a leather strap with a brass buckle.
  const SK = ramp('#a8da8c', { step: 10, turn: 16, sat: -6 });
  const CP = ramp('#ff7072', { step: 11, turn: 14, sat: -8 });
  const GL = ramp('#f6dcc0', { step: 8, turn: 26, sat: -10 });
  const CL = ramp('#c99c6e', { step: 10, turn: 12, sat: -10 });
  const WD = ramp('#cf9c66', { step: 11, turn: 12, sat: -12 });
  const skin = SK.base;
  const skinD = SK.sh;
  const skinL = SK.hi;
  const cap = CP.base;
  const capL = CP.hi;
  const gill = GL.base;
  const cloth = CL.base;
  const wood = WD.base;
  const woodD = WD.sh;
  const strap = '#8a6a52';
  const brass = ['#fff2b8', '#f2c654', '#b7843a'];
  const out = [];
  // A bow-legged swagger: a bouncy step, the shoulders rolling side to side.
  const DUTY = 0.55;
  const br = idle ? breath(q) : 0;
  const bob = dead ? 2.2 : walk ? 0.8 * Math.cos(2 * TAU * (q - 0.07)) + 0.1 : A ? [0.9, -0.4, 1.4, 0.2][f] : hurt ? 0.6 : -br * 0.5;
  const roll = dead ? 0 : walk ? 2.6 * Math.sin(TAU * q) + 1 * Math.sin(2 * TAU * q - 1.2) : A ? A.roll : hurt ? -6 : 1.8 * sway(q);
  const rx = hurt ? -1.2 : idle ? sway(q - 0.15) * 0.4 : 0;
  const bx = 18 + rx;
  const by = 33 + bob;

  // Legs: short and bowed, knees out, big bare feet slapping down.
  const leg = (x, ph, near) => {
    let [dx, up] = walk ? gait(q + ph, 9.9, 2.8, DUTY) : [0, 0];
    if (A && near) {
      dx += A.step;
      up += A.up;
    }
    const fx = x + dx + (dead ? (near ? 2 : -2) : 0);
    const fy = 43.2 - up;
    const c = near ? skin : skinD;
    const hip = [x + rx * 0.5, by + 4];
    const kn = reach(hip, [fx, fy - 1.4], 3.6, 3.6, 1);
    const toe = walk && up > 0.5 ? -0.5 : 0;
    return [...limb(hip, kn, 3, 2.7, c), ...limb(kn, [fx, fy - 1.4], 2.7, 2.6, c), E(fx + 1.2, fy - 0.2 + toe, 2.8, 1.3, c),
      crescent(fx + 1.2, fy - 0.2 + toe, 2.8, 1.3, near ? SK.sh : SK.deep, { k: 0.5, a0: 60, a1: 200, n: 10 }), F(E(fx + 2.8, fy - 0.6 + toe, 0.5, 0.4, near ? SK.sh : SK.deep))];
  };
  const back = [...leg(bx - 3, 0.5, false)];
  const body = [];
  // Far arm swinging opposite the near leg.
  const swing = walk ? Math.cos(TAU * q) * 2.4 : idle ? Math.sin(p) * 0.5 : A ? [-2, 2, 1.6, 0.6][f] : 0;
  const farHand = dead ? [bx - 8, by + 6] : [bx - 6.6 + swing, by + 3 - Math.abs(swing) * 0.3];
  const farEl = reach([bx - 4.6, by - 3.4], farHand, 3.8, 3.8, -1);
  body.push(...limb([bx - 4.6, by - 3.4], farEl, 2.6, 2.4, skinD), ...limb(farEl, farHand, 2.4, 2.2, skinD), E(farHand[0], farHand[1], 1.6, 1.5, skinD));

  // Pot belly with a lighter tummy and a strap; it jiggles a beat after each step.
  const jig = walk ? 0.35 * Math.cos(2 * TAU * q - 1.6) : idle ? Math.sin(p) * 0.3 : 0;
  const bel = br * 0.3;
  body.push(E(bx, by, 6.8 + jig * 0.3 + bel * 0.4, 6 - jig * 0.3 + bel, skin), E(bx + 1.6, by + 1 + jig * 0.3, 4 + jig * 0.3, 4 + bel, mix(skin, skinL, 0.55)),
    crescent(bx, by, 6.8 + jig * 0.3 + bel * 0.4, 6 - jig * 0.3 + bel, skinD, { k: 0.3, a0: 40, a1: 230 }), shine(bx + 1, by, 6, 5.6, skinL), F(E(bx + 2.2, by + 1.6 + jig * 0.3, 0.4, 0.4, skinD)));
  // The bandolier: leather with a lit top edge, and a brass buckle in three steps of shine.
  body.push(band([[bx - 4.4, by - 4.6], [bx + 1, by + 0.4], [bx + 5.4, by + 3.4]], 1.4, strap), band([[bx - 4.2, by - 5], [bx + 1.2, by], [bx + 5.4, by + 2.9]], 0.4, mix(strap, '#e8c8a0', 0.4)),
    F(E(bx - 0.3, by - 0.9, 1, 0.8, brass[2])), F(E(bx - 0.25, by - 1, 0.75, 0.6, brass[1])), F(E(bx, by - 1.25, 0.3, 0.25, brass[0])));
  const front = [...leg(bx + 3, 0, true)];
  // Loincloth flapping a beat behind.
  const cs = walk ? Math.sin(TAU * q * 2 - 2) * 1 - 0.4 : A ? [1, -1.4, -0.6, 0.4][f] : Math.sin(p - 1) * 0.4;
  const cloth1 = [T([[bx - 6.2, by + 3.4], [bx + 6.4, by + 3.2], [bx + 5.2, by + 7.6 + cs * 0.3], [bx + 3.6 + cs, by + 9.4], [bx + 1.8 + cs, by + 8.4], [bx - 0.2 + cs, by + 9.6], [bx - 2.4 + cs, by + 8.4], [bx - 4.6 + cs, by + 9.2], [bx - 5.8, by + 7]], cloth)];
  // Folds hang from the belt and run down to the hem points, in shadow; the back panel in shadow.
  cloth1.push(F(T([[bx - 6.2, by + 3.4], [bx - 3.2, by + 3.6], [bx - 2.4 + cs, by + 8.4], [bx - 4.6 + cs, by + 9.2], [bx - 5.8, by + 7]], CL.sh)));
  for (const k of [0.4, 3.4]) cloth1.push(F(T([[bx + k - 0.4, by + 4], [bx + k + 0.5, by + 4], [bx + k + 0.6 + cs * 0.9, by + 8.6], [bx + k - 0.2 + cs * 0.9, by + 8.2]], CL.sh)));
  cloth1.push(band([[bx - 6.6, by + 3], [bx, by + 3.8], [bx + 6.6, by + 2.8]], 1.3, strap), band([[bx - 6.4, by + 2.6], [bx, by + 3.4], [bx + 6.4, by + 2.4]], 0.4, mix(strap, '#e8c8a0', 0.4)),
    F(E(bx + 3.4, by + 3.5, 1, 0.85, brass[2])), F(E(bx + 3.45, by + 3.4, 0.75, 0.62, brass[1])), F(E(bx + 3.7, by + 3.15, 0.3, 0.25, brass[0])));

  // Head, bobbing a beat behind the body.
  const head = [];
  const nod = walk ? Math.sin(2 * TAU * q - 2) * 0.5 : idle ? -br * 0.4 + sway(q - 0.2) * 0.2 : 0;
  const hx = 19 + rx * 1.2;
  const hy = 21.6 + bob * 0.8 + nod + (dead ? 1.4 : 0);
  // Long pointy ears out from under the cap: two-link chains flopping a beat behind the head
  // (the tip later still); idle, the near one flicks; perked when angry, drooping when hurt.
  const eph = walk ? 2 * TAU * q - 2.8 : TAU * q - 0.6;
  const ed = dead ? 26 : hurt ? 14 : angry ? -10 : 0;
  const goblinEar = (x, y, deg, len, s, c, inner, flick) => {
    const pts = chain(x, y, deg + s * (ed + flick), [len * 0.5, len * 0.5], (i) => (i ? s * 6 : 0) + wave(eph, A ? [-6, 10, 12, 2][f] : walk ? 8 : 3, 0.9)(i));
    const [m, tip] = [pts[1], pts[2]];
    const n = [-Math.sin(m[2] * D2R), Math.cos(m[2] * D2R)];
    const o = [T([[x - n[0] * 2.4, y - n[1] * 2.4], [m[0] - n[0] * 1.3, m[1] - n[1] * 1.3], tip, [m[0] + n[0] * 1.1, m[1] + n[1] * 1.1], [x + n[0] * 2.2, y + n[1] * 2.2]], c)];
    o.push(F(T([[x - n[0] * 1.3, y - n[1] * 1.3], [m[0] - n[0] * 0.6, m[1] - n[1] * 0.6], [(m[0] + tip[0]) / 2, (m[1] + tip[1]) / 2], [x + n[0] * 1.3, y + n[1] * 1.3]], inner)));
    return o;
  };
  const flick = idle ? bump(q, 0.67, 0.22) * -16 : 0;
  head.push(...goblinEar(hx - 6, hy - 0.4, 194, 9, -1, SK.sh, '#f0a4b4', 0));
  head.push(E(hx, hy, 7.8, 6.8, skin), crescent(hx, hy, 7.8, 6.8, skinD, { k: 0.26, a0: 70, a1: 215 }), shine(hx + 1, hy + 1, 7, 6, skinL, 0, 0.9));
  head.push(...goblinEar(hx + 6, hy - 0.6, -24, 8.6, 1, skin, '#ffb8c0', flick));
  // Face: shifty, sharp eyes (sallow whites, blood-red irises, small pupils) under heavy lids,
  // one squinting more than the other, darting side to side; a lopsided smirk with a tusk poking
  // up over the lip. Angry, the brows crash down and it bares every tooth; hurt, one eye
  // squeezes shut while the other pops wide.
  const ey = hy + 0.2;
  const glance = idle ? 0.8 * Math.sin(p + 0.6) : 0;
  const eyeF = [hx - 2.3, ey + 0.2];
  const eyeN = [hx + 3, ey];
  const lashC = '#24301e';
  const ge = { shape: 'sharp', sclera: angry || A ? '#ffe08a' : '#fff6c0', iris: angry || A ? ['#6a0a0a', '#ff3a22', '#ffd06a'] : ['#5a1a10', '#d0452c', '#ffb27a'], irisW: 0.55, pupil: 'round', pupilK: 0.75, lashC, lash: 1.05, lower: 0.35, flicks: 0, crease: skinD, look: [glance, 0.1] };
  const actF = { idle: { lid: 0.18 }, angry: { lid: 0.15, slant: 0.95, raise: 0.3, pupilK: 0.45 }, hurt: { lid: 0, raise: 0, pupilK: 0.45 }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  const actN = { idle: { lid: 0.42, slant: 0.2 }, hurt: { closed: 'squeeze' } }[mood] ?? actF;
  if (dead) head.push(...deadEye(eyeF[0], eyeF[1], 1.7, { type: 'swirl', s: -1, c: lashC }), ...deadEye(eyeN[0], eyeN[1], 2.1, { type: 'swirl', c: lashC }));
  else head.push(...easyEye(eyeF[0], eyeF[1], { ...ge, ...actF, s: -1, w: 2.1, h: 2.4 }), ...easyEye(eyeN[0], eyeN[1], { ...ge, ...actN, s: 1, w: 2.5, h: 2.6 }));
  // Bushy brows: one cocked, one low (scheming); crashing down; jumping up in shock.
  const bc = '#3f6a30';
  const [af, uf, an, un] = browsFor({ idle: [-14, 0.9, 16, -0.2], angry: [34, -0.9, 34, -1], hurt: [-26, 1.3, -10, 0.3], happy: [-10, 0.8, -10, 0.8], blink: [-6, 0.3, 10, 0], dead: [-18, 0.4, -18, 0.4] }, mood);
  head.push(...brow(eyeF[0] - 0.2, ey - 3.4 - uf, { s: -1, len: 1.6, angle: af, th: 0.85, arch: 0.3, c: bc, shape: 'bushy' }),
    ...brow(eyeN[0] + 0.1, ey - 3.6 - un, { s: 1, len: 1.9, angle: an, th: 0.9, arch: 0.3, c: bc, shape: 'bushy' }));
  if (!dead) head.push(...cheek(hx - 3.4, ey + 3.4, 1.2, { on: skin, lines: happy ? 2 : 0 }));
  head.push(F(E(hx - 4.6, ey + 2.6, 0.4, 0.4, skinD)), F(E(hx - 3.8, ey + 4, 0.35, 0.35, skinD)));
  // A big warty nose.
  head.push(...nose(hx + 6.6, hy + 2.6, { type: 'button', r: 2.1, c: skinD }), F(E(hx + 7.4, hy + 3.4, 0.45, 0.35, shade(skinD, -18))), F(E(hx + 5.6, hy + 3.4, 0.3, 0.3, shade(skinD, -10))));
  const mx = hx + 2.4;
  const my = hy + 5;
  const mo = { s: 1, ink: '#3e5a2c' };
  if (A && f === 2 && !dead && !hurt) head.push(...mouth(mx, my - 0.6, { ...mo, type: 'shout', w: 3, h: 3.6, open: 1, teeth: 'top', tusks: 2 }));
  else if (angry) head.push(...mouth(mx, my - 0.4, { ...mo, type: 'snarl', w: 3.2, h: 3.6, open: 1, teeth: 'top', tusks: 2, tongue: false, tilt: -0.2 }));
  else if (happy) head.push(...mouth(mx, my - 0.5, { ...mo, type: 'grin', w: 2.7, h: 3, open: 1, teeth: 'top', tusks: 1, tuskAt: 0.3 }));
  else if (hurt) head.push(...mouth(mx, my - 0.2, { ...mo, type: 'pained', w: 2.4, h: 2.2, open: 1, tilt: 0.5 }));
  else if (dead) head.push(...mouth(mx, my, { ...mo, type: 'flat', w: 2, tusks: 1, tuskAt: 0.3, tongueOut: true, tongueLen: 1.8 }));
  else head.push(...mouth(mx, my, { ...mo, type: 'smirk', w: 2.4, tilt: 0.7, tusks: 2, tuskAt: [0.28, 0.7] }));
  if (angry) head.push(...vein(hx - 4.6, hy - 2.4, 0.9));
  if (hurt) head.push(...sweat(hx - 6.4, hy - 1.6, 1.1), ...sweat(hx + 7.6, hy - 2.4, 0.8));

  // The mushroom-cap helmet: it bounces a beat behind the head and settles.
  const capLag = walk ? Math.sin(2 * TAU * q - 2.6) * 0.5 : A ? A.cap : idle ? -breath(q - 0.12) * 0.3 : 0;
  const tilt = dead ? 9 : hurt ? -7 : A ? A.cap * 3 : capLag * 4;
  const cx = hx + (dead ? 2.4 : 0);
  const cy = hy - 6.4 + (hurt ? -1.8 : 0) + (dead ? 1.4 : 0) + capLag;
  // The cap is one part in its own frame: the gills underneath, the dome shaded on its back and
  // lit on its top front, spots in shadow taking the shadow's tint. It turns as a whole.
  const capS = [C(E(cx, cy + 0.4, 12.6, 2.1, gill)), F(E(cx - 3, cy + 0.9, 8.6, 1.3, GL.sh))];
  for (let i = -3; i <= 3; i++) capS.push(band([[cx + i * 1.6, cy - 0.2], [cx + i * 3, cy + 1.7]], 0.34, GL.sh));
  const domePts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    domePts.push([cx + Math.cos(a) * 13.6, cy + Math.sin(a) * 12.4 * (0.85 + 0.15 * Math.abs(Math.cos(a)))]);
  }
  capS.push(T(domePts, cap), crescent(cx, cy + 0.6, 13.6, 12.4, CP.sh, { k: 0.28, a0: 182, a1: 262, n: 12 }), F(T([[cx - 13.4, cy + 0.2], [cx + 13.4, cy + 0.2], [cx + 12.8, cy - 0.8], [cx - 12.8, cy - 0.8]], CP.sh)));
  capS.push(band(Array.from({ length: 7 }, (_, i) => { const a = (-70 + i * 9) * D2R; return [cx + Math.cos(a) * 10.6, cy - 0.6 + Math.sin(a) * 9.2]; }), (t) => 1.6 * Math.sin(Math.PI * t) ** 0.6, capL));
  for (const [x, y, r] of [[-7.4, -3.8, 2.1], [-1.4, -7.6, 2.3], [5, -5.6, 2], [9.8, -2.2, 1.4], [0.6, -2.8, 1.2], [-10.6, -1.3, 1], [-5.4, -8.6, 0.9]]) {
    const lit = x > -4;
    capS.push(F(E(cx + x, cy + y, r, r * 0.86, lit ? '#fff6ea' : '#f4d6d8')), F(E(cx + x - r * 0.3, cy + y + r * 0.35, r * 0.5, r * 0.3, lit ? '#efdcd0' : '#e2b8c4')));
  }
  head.push(...spin(capS, cx, cy, tilt));
  if (angry) head.push(...stroke([[cx + 12, cy - 12], [cx + 13.2, cy - 13.4]], 0.67, '#ff5a5a'), ...stroke([[cx + 13.6, cy - 10.6], [cx + 15.4, cy - 11]], 0.67, '#ff5a5a'));

  // Near arm and the club: bouncing on the shoulder, tapped idly, raised when angry, swung in
  // the attack, dropped when dead.
  const club = [];
  const swoosh = [];
  const sh = [bx + 4.4, by - 3.4];
  let hand;
  let tip;
  // (the hand reaches no further than the arm allows, and the club stays in it)
  if (dead) {
    hand = [bx + 6.4, by + 3.4];
    tip = [bx - 6.4, by + 7.6];
  } else if (A) {
    hand = [bx + A.hand[0], by + A.hand[1]];
    tip = [bx + A.tip[0], by + A.tip[1]];
  } else if (angry) {
    const sh2 = walk ? Math.sin(2 * TAU * q - 1.8) * 0.8 : idle ? Math.sin(p * 2) * 0.5 : 0;
    hand = [bx + 8.6, by - 9.4 + sh2 * 0.5];
    tip = [bx + 13.6 + sh2, by - 22 + sh2];
  } else {
    const rock = walk ? Math.sin(2 * TAU * q - 2.2) * 1.1 : 0;
    const tap = idle ? bump(q, 0.33, 0.28) : 0;
    hand = [bx + 8.4 - swing * 0.6 + tap * 0.6, by + 1.4 + rock * 0.3 - tap * 1.6];
    tip = [bx + 15.4 - swing * 0.3 + rock - tap * 2.4, by - 11.4 + Math.abs(rock) * 0.4 - tap * 2];
  }
  {
    const d = Math.hypot(hand[0] - sh[0], hand[1] - sh[1]);
    if (d > 7.1) {
      const k = 7.1 / d;
      const [ox, oy] = [hand[0] - (sh[0] + (hand[0] - sh[0]) * k), hand[1] - (sh[1] + (hand[1] - sh[1]) * k)];
      hand = [hand[0] - ox, hand[1] - oy];
      tip = [tip[0] - ox, tip[1] - oy];
    }
  }
  // The club is a rigid part held in the hand: it keeps its length in every pose.
  const len0 = Math.hypot(tip[0] - hand[0], tip[1] - hand[1]) || 1;
  const ux = (tip[0] - hand[0]) / len0;
  const uy = (tip[1] - hand[1]) / len0;
  tip = [hand[0] + ux * 12.4, hand[1] + uy * 12.4];
  const dx = tip[0] - hand[0];
  const dy = tip[1] - hand[1];
  const at = (t) => [hand[0] + dx * t, hand[1] + dy * t];
  // Its shadow side is the one facing away from the light (up and to the front).
  const nx = -uy * (-uy * 0.6 - ux * 0.8 > 0 ? -1 : 1);
  const ny = ux * (-uy * 0.6 - ux * 0.8 > 0 ? -1 : 1);
  if (A && A.smear) {
    // The smear: one flat shape along the arc the club head just swept, hard at the club.
    const pts = [];
    const a1 = Math.atan2(tip[1] - (by - 6), tip[0] - (bx + 4)) / D2R;
    for (let i = 0; i <= 6; i++) {
      const a = (a1 - (A.imp ? 70 : 95) * (1 - i / 6)) * D2R;
      pts.push([bx + 4 + Math.cos(a) * 14, by - 6 + Math.sin(a) * 14]);
    }
    swoosh.push(smear(pts, 5.4 * A.smear, '#fff1d8'), smear(pts.slice(2), 2.6 * A.smear, mix(WD.hi, '#ffffff', 0.4)));
  }
  const hd = [tip[0] - ux * 2.2, tip[1] - uy * 2.2];
  club.push(...limb(at(-0.18), at(0.62), 1.6, 2.6, wood), ...limb([at(-0.1)[0] + nx * 0.5, at(-0.1)[1] + ny * 0.5], [at(0.6)[0] + nx * 0.8, at(0.6)[1] + ny * 0.8], 0.67, 1.1, woodD),
    O(hd[0], hd[1], 4.4, 3.9, Math.atan2(dy, dx) / D2R, wood), E(tip[0] - ux * 3.4 + uy * 2.6, tip[1] - uy * 3.4 - ux * 2.6, 1.6, 1.6, wood), E(tip[0] - ux * 0.4 - uy * 2.4, tip[1] - uy * 0.4 + ux * 2.4, 1.4, 1.4, wood),
    crescent(hd[0], hd[1], 4.4, 3.9, woodD, { k: 0.35, rot: Math.atan2(ny, nx) / D2R - 90, a0: 20, a1: 160, n: 12 }),
    F(E(hd[0] - nx * 2, hd[1] - ny * 2, 1.2, 0.8, WD.hi)), F(E(hd[0] + nx * 1.2 + ux, hd[1] + ny * 1.2 + uy, 0.7, 0.55, WD.deep)), F(E(hd[0] - ux * 1.4, hd[1] - uy * 1.4, 0.6, 0.45, WD.deep)));
  for (const t of [0.12, 0.24]) club.push(band([[at(t)[0] - uy * 1, at(t)[1] + ux * 1], [at(t)[0] + uy * 1, at(t)[1] - ux * 1]], 0.67, strap));
  // The arm: shoulder, elbow, hand, two bones that keep their length.
  const el = reach(sh, hand, 3.6, 3.6, hand[1] < sh[1] ? 1 : -1);
  club.push(...limb(sh, el, 2.8, 2.6, skin), ...limb(el, hand, 2.6, 2.4, skin), E(hand[0], hand[1], 1.8, 1.7, skin), F(E(hand[0] + 0.6, hand[1] - 0.6, 0.6, 0.5, skinL)));

  // The upper body rolls about the hips; legs stay planted.
  const pivot = [bx, by + 6];
  out.push(...back, ...spin(body, pivot[0], pivot[1], roll), ...front, ...spin([...cloth1, ...swoosh, ...head, ...club], pivot[0], pivot[1], roll));
  if (A && A.imp) out.push(...dust(bx + 14, 43, 0.9), ...star(bx + 16.6, by + 4.6, 2.2, '#fff2a8'));
  return { w: 38, h: 44, res: 3, shapes: out };
}

// ---------- Jackalope (piglet) ----------

// The bound, frame by frame: crouch and push off, stretch out in the air, reach and land on the
// front paws, then the hind feet swing through and it gathers for the next leap. lift: height,
// squash: + crouched / - stretched, hind: hind legs back (+) or tucked under (-), reach: front
// legs forward, ear: ears swept back (+) or flopping forward (-), tilt: nose down (+).
const HOP = [
  { lift: 0.2, squash: 0.9, hind: 0.2, reach: 0.1, ear: -0.5, tilt: 0.6 },
  { lift: 1.6, squash: -0.3, hind: 1, reach: 0.4, ear: 0.6, tilt: -1.4 },
  { lift: 3.4, squash: -1, hind: 0.9, reach: 0.9, ear: 1.4, tilt: -1.6 },
  { lift: 4.4, squash: -0.6, hind: 0.4, reach: 1, ear: 1.2, tilt: -0.4 },
  { lift: 3.8, squash: -0.2, hind: 0, reach: 1, ear: 0.4, tilt: 0.6 },
  { lift: 2, squash: 0.2, hind: -0.2, reach: 0.6, ear: -0.5, tilt: 1.3 },
  { lift: 0.5, squash: 1, hind: -0.5, reach: 0.2, ear: -1, tilt: 1 },
  { lift: 0, squash: 1.1, hind: -0.1, reach: 0, ear: -0.8, tilt: 0.8 },
];

// Attack: an antler charge. b: body shift, rot: head lowered (deg), plus hop-style pose keys.
const JAK_ATK = [
  // Wind-up: rocked back on the haunches, head down, antlers aimed.
  { b: -2.6, rot: 20, hx: -4, lift: 0, squash: 1.3, hind: -0.5, reach: -0.2, ear: -0.4, imp: 0 },
  // Charge: launching forward, stretched out.
  { b: 0.6, rot: 24, hx: -3, lift: 1.4, squash: -0.9, hind: 1, reach: 0.5, ear: 1.5, imp: 0 },
  // Impact: the antlers connect.
  { b: 0.4, rot: 22, hx: -3, lift: 0.4, squash: 0.6, hind: 0.7, reach: 0.4, ear: -1, imp: 1 },
  // Recover: bouncing back up.
  { b: -0.4, rot: 8, hx: -1.6, lift: 0.8, squash: 0, hind: 0.2, reach: 0.2, ear: 0.5, imp: 0 },
];

function jackalope(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? JAK_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const p = q * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  // Lilac fur cooling to periwinkle in shadow, a cream bib, bone antlers browning to umber.
  const FU = ramp('#dccdf0', { step: 10, turn: 22, cool: 228, sat: -2 });
  const CR = ramp('#f7f1ff', { step: 7, turn: 20, cool: 228, sat: 2 });
  const AN = ramp('#f4dab2', { step: 11, turn: 12, sat: -12 });
  const fur = FU.base;
  const furD = FU.sh;
  const cream = CR.base;
  const earIn = '#ffb3cc';
  const ant = AN.base;
  const antD = AN.sh;
  const br = idle ? breath(q) : 0;
  // Dead, it lies stretched out on the floor: body flattened, hind legs kicked back, forepaws
  // reaching forward, chin on the ground.
  const hop = dead ? { lift: 0, squash: -1.5, hind: 1.2, reach: 1, ear: 0, tilt: 0 }
    : walk ? keyAt(HOP, f) : A ?? { lift: 0, squash: hurt ? 0.6 : 0.35 - br * 0.6, hind: 0, reach: hurt ? -0.4 : 0, ear: 0, tilt: 0 };
  const out = [];
  // The world lifts a bounder through the air, so the sprite keeps only a little of the arc.
  const L = dead ? -2.9 : hop.lift * 0.7;
  const rx = (hurt ? -1.6 : 0) + (A ? A.b : 0) + (idle ? sway(q) * 0.4 : 0);
  const bx = 17 + rx;
  const by = 26.4 - L + hop.squash * 0.6;

  // Cotton tail, flicking.
  const tw = walk ? -hop.ear * 0.6 : idle ? -bump(q, 0.17, 0.2) * 1 : A ? -hop.ear * 0.4 : 0;
  out.push(E(bx - 9.6, by - 2.6 + tw, 2.8, 2.6, '#fdfbff'), E(bx - 11, by - 3.6 + tw * 1.3, 1.6, 1.5, '#fdfbff'), E(bx - 10.8, by - 1.2 + tw, 1.5, 1.4, '#fdfbff'),
    crescent(bx - 10, by - 2.4 + tw, 3, 2.8, CR.sh, { k: 0.4, a0: 60, a1: 210, jag: 0.5, n: 10 }));
  // Far legs (darker).
  const hindFoot = (near) => {
    const k = hop.hind;
    // Dead, the hind legs stretch straight out behind, past the tail, soles up.
    if (dead) return [bx - (near ? 18.2 : 16.4), by + (near ? 5.2 : 3.4), -8];
    const fx = (near ? 13.2 : 10.6) + rx - k * 4.6;
    const fy = Math.min(34.8, 34.8 - L * 0.55 + Math.max(0, k) * 0.6);
    return [fx, fy, Math.max(0, k) * 50];
  };
  const front = (near) => {
    const sx = bx + (near ? 6.6 : 5);
    const reach = hop.reach;
    return [[sx, by + 1.4], [sx + 1 + reach * 3.4 + (near ? 0.6 : 0), Math.min(35, by + 7.6 - reach * 1.6)]];
  };
  {
    const [fx, fy, a] = hindFoot(false);
    const kn = reach([bx - 6, by + 2.6], [fx + 2, fy - 1.2], 4, 4.4, 1);
    out.push(...limb([bx - 6, by + 2.6], kn, 3.2, 2.6, furD), ...limb(kn, [fx + 2, fy - 1.2], 2.6, 2.2, furD), O(fx + 2.6, fy, 3.6, 1.3, a, furD));
    const [s, h] = front(false);
    const el = reach(s, h, 3.4, 3.4, -1);
    out.push(...limb(s, el, 2.2, 2, furD), ...limb(el, h, 2, 1.8, furD), E(h[0] + 0.5, h[1] - 0.2, 1.5, 1, furD));
  }
  // Body: haunch, barrel, cream chest fluff, stretching in the air and bunching on landing.
  const sq = hop.squash;
  out.push(E(bx, by, 9.6 - sq * 0.5, 6.4 + sq * 0.4, fur), E(bx - 4.6, by + 1.2, 5.6 - sq * 0.2, 5.4 + sq * 0.3, fur));
  out.push(crescent(bx - 1.2, by + 0.4, 10.4 - sq * 0.5, 6.9 + sq * 0.4, furD, { k: 0.3, a0: 50, a1: 220, jag: 0.6 }), shine(bx + 1, by - 0.4, 8.6, 6, FU.hi, 0, 1.1));
  out.push(band([[bx - 7.6, by + 3.2], [bx - 4, by + 5.4], [bx - 0.6, by + 4.6]], (t) => 0.67 * Math.sin(Math.PI * t) ** 0.5, FU.deep));
  out.push(E(bx + 6.2, by + 1.6, 3.8, 4.2, cream), crescent(bx + 6.2, by + 1.6, 3.8, 4.2, CR.sh, { k: 0.35, a0: 60, a1: 170, jag: 0.4, n: 10 }));
  for (const [x, y] of [[bx + 4.4, by + 5.2], [bx + 6.6, by + 5.6]]) out.push(T([[x - 1.2, y - 1], [x + 1.2, y - 1], [x + 0.3, y + 1.3]], cream));
  out.push(...stroke([[bx + 4.4, by - 0.6], [bx + 5.2, by + 0.4], [bx + 6, by - 0.4]], 0.3, shade(cream, -12)));
  {
    const [fx, fy, a] = hindFoot(true);
    const kn = reach([bx - 3.6, by + 3.4], [fx + 2, fy - 1.2], 4, 4.4, 1);
    out.push(...limb([bx - 3.6, by + 3.4], kn, 3.6, 2.8, fur), ...limb(kn, [fx + 2, fy - 1.2], 2.8, 2.4, fur), O(fx + 2.8, fy, 4, 1.4, a, fur),
      crescent(bx - 2.6, by + 3.4, 3.6, 3, furD, { k: 0.4, a0: 70, a1: 200, jag: 0.5, n: 10 }), F(E(fx + 5.4 - a / 30, fy + 0.2 + a / 40, 0.5, 0.4, furD)));
    // Dead, the stretched leg is set off from the belly by a crease, and its sole shows a cream pad.
    if (dead) out.push(band([[bx - 2.4, by + 5.4], [bx - 5.6, by + 3.6], [fx + 4.4, fy - 1.1]], (t) => 0.6 * Math.sin(Math.PI * t) ** 0.5, FU.deep), E(fx - 0.2, fy + 0.1, 1.4, 1.1, cream), F(E(fx - 0.6, fy + 0.1, 0.5, 0.45, earIn)));
    const [s, h] = front(true);
    const el = reach(s, h, 3.4, 3.4, -1);
    out.push(...limb(s, el, 2.4, 2.2, fur), ...limb(el, h, 2.2, 2, fur), E(h[0] + 0.6, h[1] - 0.2, 1.7, 1.1, cream));
  }

  // Head, tilting with the bound (nose up on the push, down on landing); idle, it perks up and
  // looks about.
  const head = [];
  const perk = idle ? bump(q, 0.5, 0.34) : 0;
  const hx = 27.4 + rx * (A ? 0 : 1.1) + (A ? A.hx : 0) + (dead ? 2.4 : 0);
  const hy = 17 - L + (walk ? hop.tilt * 0.6 : 0) + (idle ? Math.sin(p - 0.7) * 0.3 - perk * 0.8 : 0) + (dead ? 4.6 : 0) + (hurt ? -0.4 : 0) + (A ? hop.squash * 0.5 : 0);
  // Ears: long, swept back on the rise, flopping forward on landing; flat when angry, limp when
  // dead; idle, the near one swivels to listen.
  const eb = walk || A ? hop.ear : 0;
  const swivel = idle ? bump(q, 0.67, 0.25) : 0;
  const flat = angry ? 1 : hurt ? 0.8 : happy ? -0.3 : 0;
  // Each ear is a chain of three links: on the bound each link takes the angle the one before
  // it had a frame earlier, so the flop runs from root to tip; idle, a slow wave.
  const earAt = (k) => (walk ? keyAt(HOP, (f - k + 8) % 8).ear : eb);
  const longEar = (b, len, a0, w, c, inner) => {
    const abs = [0, 1, 2].map((i) => (dead ? a0 - 34 + i * 16 : a0 - earAt(i) * 12 - flat * 32 + i * (4 + flat * 4) + (idle ? wave(TAU * q - 0.5, 4, 0.8)(i) : 0)));
    const pts = chain(b[0], b[1], abs[0], [len * 0.36, len * 0.34, len * 0.3], (i) => (i ? abs[i] - abs[i - 1] : 0)).map((p) => p.slice(0, 2));
    return [band(pts, (t) => w * (1 - 0.35 * t) * (t > 0.85 ? Math.sqrt((1 - t) / 0.15) * 0.7 + 0.3 : 1), c), band(pts.slice(1), (t) => w * 0.5 * (1 - 0.5 * t), inner)];
  };
  const farB = [hx - 3.2, hy - 4.4];
  head.push(...longEar(farB, 10.4, -146 + perk * 10, 4.4, furD, shade(earIn, -8)));
  // Antlers (behind the near ear, in front of the far one): branching tines, a clover tied on.
  const antler = (x, y, c, k, g = 0) => {
    const qq = (dx, dy) => [x + dx * k, y + dy * Math.abs(k)];
    return [...limb(qq(0, 0), qq(1.4, -6.2), 2.2 + g, 1.8 + g, c), ...limb(qq(1.4, -6.2), qq(0.6, -12.6), 1.8 + g, 1.2 + g, c),
      ...limb(qq(0.7, -3.4), qq(-2.8, -6.4), 1.5 + g, 1.1 + g, c), ...limb(qq(1.3, -6.6), qq(5.6, -9.4), 1.5 + g, 1.1 + g, c),
      ...limb(qq(0.9, -10), qq(-1.8, -12.4), 1.2 + g, 0.9 + g, c)];
  };
  // Bone: the tines' undersides in shadow (a slightly fatter copy, shifted down and back), the
  // base on top, one lit streak up the main beam's front.
  const antlers = (x, y, c, k) => [...antler(x - 0.3, y + 0.35, c === ant ? AN.sh : AN.deep, k, 0.15), ...antler(x, y, c, k),
    F(E(x + 0.9 * k, y - 5 * Math.abs(k), 0.4, 1.6, c === ant ? AN.hi : AN.base))];
  head.push(...antlers(hx - 1.4, hy - 5.2, antD, -0.9));
  head.push(E(hx, hy, 7.6, 6.7, fur), crescent(hx, hy, 7.6, 6.7, furD, { k: 0.28, a0: 75, a1: 225, jag: 0.6 }), shine(hx + 0.6, hy - 0.4, 6.6, 6, FU.hi, 0, 1.05));
  head.push(...antlers(hx + 1.8, hy - 5.6, ant, 1.12));
  if (!dead) {
    const cx = hx + 8;
    const cy = hy - 13.4;
    head.push(...stroke([[cx - 0.2, cy + 0.6], [cx + 0.6, cy + 2.6]], 0.35, '#5fae5c'));
    for (const a of [-90, 30, 150]) head.push(F(E(cx + Math.cos(a * D2R) * 0.9, cy + Math.sin(a * D2R) * 0.9, 0.8, 0.8, '#7fcf73')));
    head.push(F(E(cx, cy, 0.35, 0.35, '#b5e8a2')));
  }
  const nearB = [hx + 0.4, hy - 5];
  head.push(...longEar(nearB, 11.4 - swivel * 1.4, -136 + swivel * 18 + perk * 6, 5.2 - swivel * 0.6, fur, earIn));
  // Cheek fluff, muzzle, whiskers; the nose wiggles as it sniffs.
  head.push(T([[hx - 5.6, hy + 1], [hx - 8.4, hy + 3.4], [hx - 5.6, hy + 3.6], [hx - 6.6, hy + 6], [hx - 2.6, hy + 5.4]], fur),
    E(hx + 4.4, hy + 2.6, 3.4, 2.6, cream), F(E(hx - 2.6, hy - 3.6, 2, 1, mix(fur, '#ffffff', 0.35))));
  const tw2 = idle ? -0.35 * (bump(q, 0, 0.18) + bump(q, 0.33, 0.18)) : 0;
  head.push(...nose(hx + 7.6, hy + 1.4 + tw2, { r: 0.85, c: '#ff7f9f' }));
  for (const b of [-0.6, 0.7]) head.push(...stroke([[hx + 4.2, hy + 2.6 + b * 0.3], [hx + 7.2, hy + 2.4 + b * 1.2 + tw2 * 2]], 0.2, '#b2a4d0'));
  // Face: a big, glossy hare eye on the side of the head (violet, a pale ring, no white), wide and
  // curious at rest, under soft fur-tuft brows; the far eye just peeks past the muzzle. Angry, the
  // lid drops into a red glare; hurt, it squeezes shut with a tear; dead, it's seeing stars.
  const ey = hy - 0.3;
  const lashC = '#2e2040';
  const je = { shape: 'animal', iris: angry || A ? ['#4a0a1e', '#e0304e', '#ff9ab0'] : ['#2a1630', '#6a3a80', '#c49ae4'], pupil: 'round', pupilK: 0.85, pupilC: '#1e1428', lashC, ring: '#fbf6ff', ringW: 0.45, shine: 1.15, glint: !angry && !A, look: [idle ? 0.35 * Math.cos(p) + 0.2 : 0.2, -perk * 0.4] };
  const act = { idle: { lid: 0.05 - perk * 0.05 }, angry: { lid: 0.32, slant: 0.85, raise: 0.25, pupil: 'pin', pupilC: '#ffe0e8' }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  if (A && f === 0 && !dead && !hurt) Object.assign(act, { lid: 0.35, slant: 0.9, pupil: 'pin', pupilC: '#ffe0e8' });
  if (dead) head.push(...deadEye(hx + 2.2, ey, 2.2, { type: 'swirl', c: lashC }));
  else head.push(...easyEye(hx + 6.5, ey - 0.3, { ...je, ...act, s: 1, w: 0.6, h: 2, ring: null, rim: 0.3, shine: 0.6, glint: false }), ...easyEye(hx + 2.2, ey, { ...je, ...act, s: 1, w: 2.5, h: 2.9 }));
  const [ba, bu] = browsFor({ idle: [-14, 0.5 + perk * 0.4], angry: [36, -0.9], hurt: [-30, 0.6], happy: [-10, 0.6], blink: [0, 0], dead: [-20, 0.3] }, mood);
  head.push(...brow(hx + 1.5, ey - 3.7 - bu, { s: 1, len: 1.8, angle: ba, th: 0.8, arch: 0.3, c: '#6e58a0', shape: 'tuft' }));
  if (!dead) head.push(...cheek(hx + 0.4, ey + 4, 1.3, { on: fur, lines: happy || hurt ? 3 : 0 }), ...cheek(hx + 5.8, ey + 3.4, 0.7, { on: cream }));
  const mx = hx + 5.8;
  const my = hy + 3.7;
  const mo = { s: 1, ink: '#6a3a6a' };
  if (A && f === 0 && !dead && !hurt) head.push(...mouth(mx, my, { ...mo, type: 'pained', w: 1.3, h: 1.5, open: 1 }));
  else if (angry) head.push(...mouth(mx, my - 0.2, { ...mo, type: 'snarl', w: 1.6, h: 2.6, open: 1, teeth: 'buck', tongue: false }));
  else if (happy) head.push(...mouth(mx, my - 0.3, { ...mo, type: 'grin', w: 1.5, h: 2.6, open: 1, teeth: 'buck' }));
  else if (hurt) head.push(...mouth(mx, my - 0.1, { ...mo, type: 'shout', w: 1.2, h: 2.2, open: 0.8, teeth: 'buck' }));
  else if (dead) head.push(...mouth(mx, my, { ...mo, type: 'flat', w: 1.2, teeth: 'buck', tongueOut: true, tongueLen: 1.5 }));
  else head.push(...mouth(mx, my, { ...mo, type: 'cat', w: 1.2, curve: 0.5, teeth: 'buck' }));
  if (angry) head.push(...vein(hx - 3.6, hy - 2.8, 0.85));
  if (hurt) head.push(...tear(hx + 3.6, ey + 2.6, 0.9, { type: 'stream', len: 2.8 }), ...sweat(hx - 4.6, hy - 2.8, 1));
  // The head turns about the neck: lowered for the charge, tipped with the bound.
  const rot = A ? A.rot : walk ? hop.tilt * 3 : idle ? -perk * 4 : dead ? 14 : 0;
  out.push(...spin(head, hx - 3, hy + 5, rot));
  if (A && f === 1) for (const [y, l] of [[-2, 3.4], [1.6, 5], [5, 3]]) out.push(...stroke([[bx - 11.4 - l, by + y], [bx - 11.4, by + y]], 0.55, '#ffffff'));
  if (A && A.imp) {
    const { x: ix, y: iy } = spin([E(hx + 3, hy - 15, 0, 0, ant)], hx - 3, hy + 5, rot)[0];
    out.push(...star(Math.min(ix + 1, 37), iy, 3, '#fff2a8'), ...star(Math.min(ix - 1, 36), iy + 5, 1.6, '#ffd0e0'));
  }
  return { w: 40, h: 42, res: 3, shapes: out.map((q2) => ({ ...q2, y: q2.y + 6 })) };
}

export const ART = {
  puffle: { pad: 7, sub: 8, atkTween: true, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [45, 190, 140], draw: blossomKit },
  snailbun: { pad: 7, sub: 8, atkTween: true, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [70, 270, 210], draw: budSnail },
  sproutling: { walk: 8, idle: 6, attack: 4, stride: 13, atkMs: [55, 240, 170], draw: mandrake },
  mushkin: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [60, 250, 180], draw: goblin },
  piglet: { walk: 8, idle: 6, attack: 4, stride: 50, atkMs: [40, 200, 130], draw: jackalope },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  puffle: { name: 'Blossom Kit', w: 22, h: 20 },
  snailbun: { name: 'Bud Snail', w: 30, h: 24 },
  sproutling: { name: 'Mandrake', w: 18, h: 28 },
  mushkin: { name: 'Toadstool Goblin', w: 24, h: 34 },
  piglet: { name: 'Jackalope', w: 26, h: 24 },
};
