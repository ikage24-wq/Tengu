// Monster art: Petal Meadow and Clover Hills (levels 1-8), the first monsters a player meets.
//   puffle      Blossom Kit: a pink fox kit whose petals fold up into a bud; it blooms, then pounces
//               (a live rig, its own file since 2026-11-19)
//   snailbun    Bud Snail: the Mushroom Cottage snail, a lavender snail whose shell is a little
//               cottage with a mushroom roof (cottagesnailrig.js, 2026-11-20)
//   sproutling  Turnip Tot: a plump turnip that hops about and headbutts
// Every design faces right with its feet on the bottom edge; see kit.js for the shapes. Each has
// its own gait (a light trot, a heavy plod, a root-footed scurry, a bow-legged swagger, bounding
// hops), its own face built from faces.js (fox almond eyes, sleepy tortoise lids, a turnip's
// big round eyes, a goblin's shifty squint, a hare's glossy eye), an idle fidget loop, and a
// four-frame attack (wind-up, strike, impact, recover).

import { E, T, F, arc, stroke, sparkLine } from './kit.js';
import { budKitRig, budKitStill } from './budkitrig.js';
import { cottageSnailRig, cottageSnailStill } from './cottagesnailrig.js';
import { eye, brow, nose, blush as cheek, sweat, tear, vein, deadEye, band, simpleEye, simpleMouth } from './faces.js';

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

// ---------- Attack poses (the Turnip Tot's) ----------

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
  // (Remade 2026-11-19 as the Bud-to-Bloom Kit: a live rig.)
  puffle: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [45, 190, 140], draw: budKitStill, rig: budKitRig },
  snailbun: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [70, 270, 210], draw: cottageSnailStill, rig: cottageSnailRig },
  // (Its live motion is a rig now, render/mobs/turniprig.js: these frames are its still pictures.)
  sproutling: { pad: 6, sub: 16, atkTween: true, idleCycle: 3.2, walk: 8, idle: 6, attack: 4, stride: 44, atkMs: [55, 240, 170], draw: turnipTot },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  puffle: { name: 'Blossom Kit', w: 22, h: 20 },
  snailbun: { name: 'Bud Snail', w: 30, h: 24 },
  sproutling: { name: 'Turnip Tot', w: 20, h: 24 },
};
