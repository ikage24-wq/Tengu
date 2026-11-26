// Monster art: Petal Meadow and Clover Hills (levels 1-8), the first monsters a player meets.
//   puffle      Blossom Kit: the Sakura Bud Kit, a petal-pink fox kit whose tail ends in a cherry-blossom
//               bud that blooms when it pounces (on its own copy of the fox base, render/foxkit/, 2026-11-25)
//   snailbun    Bud Snail: the Cinnamon Swirl, a cream snail whose shell is an iced cinnamon roll with a
//               strawberry on top (on its own copy of the shell crawler base, render/budsnail/, 2026-11-25)
//   sproutling  Turnip Tot: the Mufflebeet, a round ruby beet always a little chilly in the root
//               cellar, wrapped in a chunky mustard knitted scarf (on its own copy of the veggie
//               critter base, render/turniptot/, 2026-11-25)
// What's left here are the shared drawing helpers (chains, materials, shading) other monsters'
// art builds on.

import { E, T, F } from './kit.js';
import { FOXKIT } from '../foxkit/index.js';
import { BUDSNAIL } from '../budsnail/index.js';
import { TURNIPTOT } from '../turniptot/index.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

// ---------- Motion helpers ----------

const wrap = (p) => ((p % 1) + 1) % 1;

// ---------- Rig ----------
// Every design is built as parts hung on joints (hips, knees, shoulders, neck, tail and ear
// roots): a pose turns and moves the parts, the limbs keep their length (two-bone reach), feet
// stay planted, and whatever a part carries (a face, a club, a flower) is drawn in its frame and
// turned with it. Soft parts are chains, so motion starts at the root and reaches the
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

export const ART = {
  // (Remade 2026-11-25 on the fox base: the Sakura Bud Kit, render/foxkit/.)
  puffle: FOXKIT.art,
  // (Remade 2026-11-25 on the shell crawler base: the Cinnamon Swirl, render/budsnail/.)
  snailbun: BUDSNAIL.art,
  // (Remade 2026-11-25 on the veggie critter base: the Mufflebeet, render/turniptot/.)
  sproutling: TURNIPTOT.art,
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  puffle: { name: 'Blossom Kit', w: FOXKIT.w, h: FOXKIT.h },
  snailbun: { name: 'Bud Snail', w: BUDSNAIL.w, h: BUDSNAIL.h },
  sproutling: { name: 'Turnip Tot', w: TURNIPTOT.w, h: TURNIPTOT.h },
};
