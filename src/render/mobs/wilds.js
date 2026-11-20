// Monster art: wilds (Windy Canyon and Mossy Woods).
//   pebblet    Basilisk Hatchling: remade 2026-11-18 as a live rig (basiliskrig.js)
//   scorpip    Manticore Cub: remade 2026-11-18 as a live rig (manticorerig.js)
//   leafling   Dryad: a forest nymph with leaf hair, bark limbs, and a budding twig staff
//   boarlet    Warg: a chibi wolf pup with a cream ruff and a red bandana; it pounces with a chomp
//              (a live rig of its own since 2026-11-20)
//   mossgolem  Treant: a slow, wise walking tree with root feet and a bird's nest in its crown
// Every design faces right with its feet on the bottom edge, and is built from small helpers
// (rotated ovals, smooth blobs, tapered tubes, two-bone legs and a gait cycle) so the walk
// cycles can plant, lift, and swing each leg while tails, manes, and leaves follow through.
// Each has its own gait (a low reptile wiggle, a cat's prowl, a graceful glide, a loping trot,
// a lumbering sway), its own eyes, an idle fidget loop, and a four-frame attack (wind-up,
// strike, impact, recover).

import { R, E, T, F, C, mix, sparkLine } from './kit.js';
import { glowEye, brow, mouth, nose as snout, blush as cheek, sweat, vein, deadEye, band, LASH, easyEye } from './faces.js';
import { ramp, hue, crescent, shine, smear, chain, wave as ripple, reach, breath, sway } from './meadow.js';
import { manticoreRig, manticoreStill } from './manticorerig.js';
import { basiliskRig, basiliskStill } from './basiliskrig.js';
import { wolfPupRig, wolfPupStill } from './wolfpuprig.js';

// ---------- Geometry helpers ----------

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const wave = (t) => Math.sin(t * TAU);
const wrap = (p) => ((p % 1) + 1) % 1;
// A smooth bump that peaks (1) at phase c and fades to 0 within w either side; phases wrap.
function bump(p, c, w) {
  const d = Math.abs(wrap(p - c + 0.5) - 0.5);
  return d >= w ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * d) / w);
}

// Points of an ellipse rotated by `a` degrees.
function ovalPts(cx, cy, rx, ry, a = 0, n = 20) {
  const ca = Math.cos(rad(a));
  const sa = Math.sin(rad(a));
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU;
    const x = Math.cos(t) * rx;
    const y = Math.sin(t) * ry;
    out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]);
  }
  return out;
}
const ov = (cx, cy, rx, ry, a, c) => (a ? T(ovalPts(cx, cy, rx, ry, a), c) : E(cx, cy, rx, ry, c));

// A Catmull-Rom spline through the points (closed loops for blobs, open for tubes).
function spline(pts, closed, seg = 4) {
  const n = pts.length;
  if (n < 3) return pts.slice();
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
const blob = (pts, c, seg = 4) => T(spline(pts, true, seg), c);

// A smooth tapered tube along the points, with round caps; `ws` are widths spread along it.
function tubePts(pts, ws, seg = 4) {
  const path = spline(pts, false, seg);
  const lens = [0];
  for (let i = 1; i < path.length; i++) lens.push(lens[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  const wAt = (u) => {
    const x = u * (ws.length - 1);
    const i = Math.min(ws.length - 2, Math.floor(x));
    return lerp(ws[i], ws[i + 1], x - i);
  };
  const left = [];
  const right = [];
  const dirs = [];
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const dx = (b[0] - a[0]) / l;
    const dy = (b[1] - a[1]) / l;
    dirs.push([dx, dy]);
    const h = wAt(lens[i] / total) / 2;
    left.push([path[i][0] - dy * h, path[i][1] + dx * h]);
    right.push([path[i][0] + dy * h, path[i][1] - dx * h]);
  }
  const cap = (p, d, h, sign) => {
    const out = [];
    for (let k = 1; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      // Sweep from one side to the other around the end.
      const nx = -d[1];
      const ny = d[0];
      const c = Math.cos(a);
      const s = Math.sin(a) * sign;
      out.push([p[0] + (nx * c + d[0] * s) * h, p[1] + (ny * c + d[1] * s) * h]);
    }
    return out;
  };
  const n = path.length - 1;
  const endCap = cap(path[n], dirs[n], wAt(1) / 2, 1);
  const startCap = cap(path[0], dirs[0], wAt(0) / 2, -1).map(([x, y]) => [2 * path[0][0] - x, 2 * path[0][1] - y]);
  return [...left, ...endCap, ...right.reverse(), ...startCap];
}
const tube = (pts, ws, c, seg) => T(tubePts(pts, ws, seg), c);
// Inner line color for a part (the auto outline only wraps the whole silhouette): the part's
// own deepest tone, hue-shifted, never a neutral ink.
const edges = new Map();
const edge = (c) => {
  if (!edges.has(c)) edges.set(c, hue(ramp(c, { step: 15, turn: 14 }).deep, 0, -8, -4));
  return edges.get(c);
};
// A tube with its own thin dark line, so a limb in front of the body still reads.
const tubeL = (pts, ws, c, seg, lw = 0.9) => [F(tube(pts, ws.map((w) => w + lw), edge(c), seg)), tube(pts, ws, c, seg)];
// An oval with its own thin line.
const ovL = (cx, cy, rx, ry, a, c, lw = 0.45) => [F(ov(cx, cy, rx + lw, ry + lw, a, edge(c))), ov(cx, cy, rx, ry, a, c)];

// A foot's place in a walk cycle: planted and sliding back for `duty` of it (stance), then
// lifted and swung forward in an arc that rises quickly and sets down softly (swing).
// Returns [dx, lift] (lift negative = up).
function gait(p, stride, lift, duty = 0.5) {
  p = wrap(p);
  if (p < duty) return [stride / 2 - stride * (p / duty), 0];
  const t = (p - duty) / (1 - duty);
  const e = 0.5 - 0.5 * Math.cos(Math.PI * t);
  return [-stride / 2 + stride * e, -lift * Math.sin(Math.PI * Math.pow(t, 0.8))];
}

// Rotates points about (cx, cy) by `a` degrees.
const turn = (pts, cx, cy, a) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
// Rotates whole shapes about (cx, cy) (ellipses and rects keep their axes, fine for small turns).
const spin = (shapes, cx, cy, a) => (!a ? shapes : shapes.map((s) => {
  if (!s) return s;
  if (s.t === 'p') return { ...s, x: 0, y: 0, pts: turn(s.pts.map(([x, y]) => [x + s.x, y + s.y]), cx, cy, a) };
  if (s.t === 'e') {
    const [[x, y]] = turn([[s.x, s.y]], cx, cy, a);
    return { ...s, x, y };
  }
  const [[x, y]] = turn([[s.x + s.w / 2, s.y + s.h / 2]], cx, cy, a);
  return { ...s, x: x - s.w / 2, y: y - s.h / 2 };
}));

// A shaded ball: the base, its form shadow as a crescent on the back and underside (light from
// the upper front, so never a ring), and one small highlight on the top front. `jag` notches the
// shadow into fur tufts; `sh`/`hi` override the ramp's tones.
function ball(cx, cy, rx, ry, c, a = 0, { hi = true, k = 0.3, jag = 0, sh, light, a0 = 40, a1 = 225 } = {}) {
  const r = ramp(c, { step: 10, turn: 14, sat: -6 });
  const out = [ov(cx, cy, rx, ry, a, c), crescent(cx, cy, rx, ry, sh ?? r.sh, { k, jag, rot: a, a0, a1 })];
  if (hi) out.push(shine(cx, cy, rx, ry, light ?? r.hi, a));
  return out;
}

// Scales shapes about (cx, cy), to grow a head or shrink a detail.
const grow = (shapes, cx, cy, k) => shapes.map((s) => {
  if (!s) return s;
  if (s.t === 'p') return { ...s, x: 0, y: 0, pts: s.pts.map(([px, py]) => [cx + (s.x + px - cx) * k, cy + (s.y + py - cy) * k]) };
  if (s.t === 'e') return { ...s, x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, rx: s.rx * k, ry: s.ry * k };
  return { ...s, x: cx + (s.x - cx) * k, y: cy + (s.y - cy) * k, w: s.w * k, h: s.h * k };
});
const shift = (shapes, dx, dy) => shapes.map((s) => (s ? { ...s, x: s.x + dx, y: s.y + dy } : s));

// A four-point sparkle (impact stars, glints).
function star(x, y, r, c, core = '#ffffff') {
  const k = r * 0.28;
  return [{ ...F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), line: sparkLine(c) }, F(E(x, y, k * 0.9, k * 0.9, core))];
}
// Little dust puffs kicked up where something hits the ground.
const dust = (x, y, k, c = '#f3e6d6') => [E(x - 2.4 * k, y - 0.8 * k, 1.6 * k, 1.2 * k, c), E(x, y - 1.6 * k, 2 * k, 1.6 * k, mix(c, '#ffffff', 0.4)), E(x + 2.4 * k, y - 0.7 * k, 1.5 * k, 1.1 * k, c)];

function leaf(x, y, len, wid, a, R, bend = 0, vein = true) {
  const b = typeof bend === 'function' ? bend : (i) => (i ? bend : 0);
  const pts = chain(x, y, a, [len * 0.42, len * 0.58], b).map(([px, py]) => [px, py]);
  const out = [tube(pts, [0.5, wid, 0.25], R.base, 3)];
  if (wid > 2.4) out.push(F(tube(pts.map(([px, py]) => [px + wid * 0.08, py + wid * 0.2]), [0.3, wid * 0.5, 0.15], R.sh, 3)));
  if (vein && len > 4.5) out.push(band([pts[0], pts[1], [lerp(pts[1][0], pts[2][0], 0.6), lerp(pts[1][1], pts[2][1], 0.6)]], 0.35, R.deep));
  return out;
}

// ---------- Dryad (leafling) ----------

// Attack: a vine whip cracked off the end of her staff. st: staff angle, sx/sy: hand shift,
// lean: body lean, vine: the vine chain's [root angle, curl per link], crack: the snap.
const DRY_ATK = [
  // Wind-up: staff drawn back over her shoulder, the vine trailing behind, leaning back.
  { st: -46, sx: -4.6, sy: -5, lean: -1.6, vine: [150, -12], crack: 0 },
  // Whip: the staff swings over, the vine arcing high overhead.
  { st: 6, sx: -3.4, sy: -3, lean: 0.8, vine: [-10, 26], crack: 0 },
  // Crack: the vine lashes out straight and snaps at the tip.
  { st: 22, sx: -5, sy: -1.4, lean: 1.4, vine: [66, -3], crack: 1 },
  // Recover: the vine curls back toward the staff.
  { st: 12, sx: -1.4, sy: -1, lean: 0.4, vine: [20, 46], crack: 0 },
];

function leafling(pose, f, mood) {
  const W = 36;
  const H = 46;
  const G = H;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? DRY_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  const wilt = (c) => (dead ? mix(c, '#c9a36a', 0.45) : c);
  // Ramps: warm peach skin (apart from the green hair in hue and value), bark limbs, two leaf
  // greens cooling to teal, the back hair one step darker, and the pink bud as the accent.
  const SK = ramp('#f8dcc4', { step: 9, turn: 16, sat: -10 });
  const BK = ramp('#b98a66', { step: 11, turn: 18, sat: -6 });
  const LA = ramp(wilt('#74c46a'), { step: 11, turn: 20, sat: -8 });
  const LB = ramp(wilt('#a2dc88'), { step: 10, turn: 20, sat: -8 });
  const LD = { base: LA.sh, sh: LA.deep, deep: edge(LA.deep) };
  const br = idle ? breath(p) : 0;
  // A graceful glide: barely any bob, a sway from the hips, everything soft trailing after.
  const bob = walk ? 0.35 * Math.cos(p * TAU * 2) - 0.2 : idle ? -br * 0.4 : 0;
  const lean = hurt ? -1.6 : dead ? 1 : walk ? 0.8 + 0.4 * Math.sin(p * TAU) : A ? A.lean : 0.4 * sway(p);
  const by = bob + (dead ? 2.4 : 0);
  const out = [];
  const hip = [16.6 + lean * 0.3, 37 + by];
  const X = 17 + lean;
  const Y = 16.6 + by * 0.9 + (dead ? 2.2 : 0) + (hurt ? -0.6 : 0);
  // The head tips on the neck; idle, she tilts it as if listening to the woods.
  const tip = idle ? bump(p, 0.5, 0.34) * 4 : walk ? Math.sin(p * TAU) * 1.5 : A ? [-4, 3, 5, 1][f] : dead ? 6 : 0;
  const neck = [X, Y + 7];
  // Soft parts share one travelling wave, each starting a little later than the one before.
  const ph = walk ? p * TAU * 2 - 1.4 : p * TAU - 0.4;
  const amp = dead ? 0 : walk ? 6 : idle ? 5 : 2;
  const blow = (A ? [10, -14, -10, -2][f] : 0) + (dead ? 25 : 0) + (angry ? -8 : 0) + (walk ? -6 : 0);

  // Legs: slim bark legs on two bones with root toes, gliding in small steps under the skirt.
  const leg = (phs, near) => {
    const [dx, lift] = dead ? [near ? 2 : -2, 0] : walk ? gait(p + phs, 8.8, 1.6, 0.55) : A ? [near ? [1.4, 2.6, 3, 1.6][f] : -1.6, 0] : [near ? 1.2 : -1.2, 0];
    const hx = hip[0] + (near ? 1.2 : -1.2);
    const fx = hx + dx;
    const fy = G - 1.4 + lift;
    const kn = reach([hx, hip[1]], [fx, fy], 4.4, 4.4, 1);
    const c = near ? BK.base : BK.sh;
    // Toes point down as the foot lifts, like a dancer's.
    const toe = lift < -0.3 ? 0.8 : 0;
    return [...tubeL([[hx, hip[1]], kn, [fx, fy]], [3, 2.4, 2], c, 4, 0.5), ...ovL(fx + 0.9, fy + 0.4 + toe * 0.3, 2, 1.1, toe * 20, c, 0.4), band([[fx + 1.8, fy + 0.8 + toe * 0.5], [fx + 3, fy + 1.1 + toe]], 0.6, c)];
  };
  out.push(...leg(0.5, false));

  // Long leaf locks hanging behind the head, each a chain lagging the one before.
  const back = [];
  for (let i = 0; i < 5; i++) back.push(...leaf(X - 6 + i * 0.5, Y + 1 - i * 1.3, 9.4 - i * 0.6, 4.6, 100 + i * 14 + blow, i % 2 ? LD : LA, ripple(ph - i * 0.5, amp, 0.9, 0.3), false));
  back.push(E(X - 0.6, Y - 0.8, 10.6, 9.8, LA.sh));
  out.push(...spin(back, neck[0], neck[1], tip));

  // The back arm on two bones, swinging softly opposite the near leg.
  const swing = walk ? Math.cos(p * TAU) * 1.8 : sway(p) * 0.4;
  const sh = [X - 3.4, 29 + by];
  const fh = [sh[0] - 1.2 - swing, sh[1] + 6.2];
  out.push(...tubeL([sh, reach(sh, fh, 3.2, 3.2, -1), fh], [2.2, 1.9, 1.7], BK.sh, 4, 0.5), E(fh[0], fh[1] + 0.4, 1.3, 1.2, BK.sh));

  // Dress of layered leaves on chains, flowing back and swishing a beat behind her hips.
  const sw = walk ? -3 : A ? [6, -6, -8, -2][f] : 0;
  const sph = walk ? p * TAU * 2 - 1.6 : p * TAU - 0.9;
  for (let i = 0; i < 6; i++) {
    const a = 96 - (i - 2.5) * 16 + sw * (i % 2 ? 1 : -0.6) + (walk ? 6 : 0);
    out.push(...leaf(X + (i - 2.5) * 1.3 - 0.4, 30.4 + by, 8.6 - Math.abs(i - 2.5) * 0.6, 5, a, i % 2 ? LB : LA, ripple(sph - i * 0.4, amp * 0.8, 0.9, 0.3)));
  }
  // Neck and bodice: a leaf bodice and a bark belt with a pink seed.
  out.push(tube([[X - 0.2, 23.6 + by], [X - 0.4, 27 + by]], [2.4, 2.6], SK.base), F(band([[X - 1.1, 24 + by], [X - 1.1, 26.8 + by]], 0.8, SK.sh)));
  out.push(...ovL(X - 0.4, 29.2 + by, 3.8, 3.4, 0, LA.base, 0.4), crescent(X - 0.4, 29.2 + by, 3.8, 3.4, LA.sh, { k: 0.4 }), shine(X - 0.4, 29.2 + by, 3.8, 3.4, LA.hi));
  out.push(band([[X - 4, 31.2 + by], [X + 3.4, 31.2 + by]], 1.2, BK.base), F(E(X + 1, 31.2 + by, 0.9, 0.9, '#ffb3c8')));
  for (let i = 0; i < 3; i++) out.push(...leaf(X - 1.6 + i * 1.8, 31.4 + by, 6.6, 3.6, 92 - (i - 1) * 22 + sw * 0.6 + (walk ? 4 : 0), i === 1 ? LB : LA, ripple(sph - 0.6 - i * 0.5, amp * 0.6, 0.9, 0.3)));
  out.push(...leg(0, true));

  // The twig staff, held out front and turned about her hand: knots, a curl, a little leaf, and
  // a glowing bud.
  const sx = X + 10.6 + (walk ? Math.sin(p * TAU) * 0.6 : 0) + (A ? A.sx : 0);
  const sy = 31 + by + (A ? A.sy : 0);
  const st = dead ? 14 : hurt ? -10 : A ? A.st : walk ? Math.sin(p * TAU - 0.6) * 3 + 2 : sway(p) * 1.4 - bump(p, 0.5, 0.25) * 4;
  const staff = turn([[sx - 0.8, sy + 13], [sx, sy + 4], [sx - 0.2, sy - 6], [sx + 0.6, sy - 13], [sx + 0.1, sy - 16.4]], sx, sy, st);
  out.push(...tubeL(staff, [1.2, 1.6, 1.6, 1.4, 1], BK.base, 4, 0.5), F(band(staff.slice(1, 4).map(([x, y]) => [x + 0.35, y]), 0.4, BK.hi)));
  const top = staff[4];
  const mid = staff[3];
  out.push(...tubeL([mid, [mid[0] + 2, mid[1] - 1.4], [mid[0] + 2.4, mid[1] - 3]], [0.9, 0.7, 0.5], BK.base, 3, 0.4), ...leaf(mid[0] - 0.2, mid[1] + 1.6, 3.6, 2.2, 200 + st, LB, ripple(ph, amp * 2, 0.9, 0.3), false));
  for (const k of [1, 2]) out.push(F(E(staff[k][0] + 0.2, staff[k][1] - 1.2, 0.5, 0.6, BK.deep)));
  // The bud's glow breathes in and out.
  const pulse = idle ? br * 0.8 : walk ? wave(p * 2) * 0.3 : A ? [1.2, 0.4, 0.8, 0][f] : 0;
  const BU = ramp(angry || A ? '#ff5fa8' : dead ? '#c8a8a0' : '#ffb6d8', { step: 10, turn: 10, sat: -6 });
  if (!dead) out.push(F(E(top[0], top[1] - 2, 3.6 + pulse + (angry ? 1 : 0), 3.6 + pulse + (angry ? 1 : 0), angry || A ? '#ffd0e8' : '#fff4c8')));
  out.push(...leaf(top[0], top[1], 2.6, 2, 210 + st, LA, 0, false), ...leaf(top[0], top[1], 2.6, 2, 330 + st, LA, 0, false));
  out.push(...ovL(top[0], top[1] - 2, 1.9, 2.6, st, BU.base, 0.4), crescent(top[0], top[1] - 2, 1.9, 2.6, BU.sh, { k: 0.4, rot: st }), F(ov(top[0] - 0.6, top[1] - 2.8, 0.6, 1, st, '#ffffff')));
  // A twinkle drifts off the bud.
  const tw = idle ? p : walk ? (p * 2) % 1 : -1;
  if (!dead && tw >= 0 && tw < 0.6) out.push(...star(Math.min(top[0] + 3.6 + tw * 1.6, 34), top[1] - 4.4 - tw * 4, 1.3 - tw, '#fff6b0'));
  // The vine: a chain sprouting from the bud that whips out link by link.
  if (A && !dead) {
    const vp = chain(top[0], top[1] - 1.4, A.vine[0], [3.6, 3.4, 3.2, 3, 2.8], (i) => (i ? A.vine[1] : 0)).map(([x, y]) => [Math.min(34.4, x), Math.min(G - 0.8, y)]);
    out.push(...tubeL(vp, [1.4, 1.2, 1, 0.8, 0.7, 0.5], LA.sh, 4, 0.4));
    for (const k of [1, 3]) out.push(...leaf(vp[k][0], vp[k][1], 2.4, 1.6, k === 1 ? -60 : 40, LB, 0, false));
    const [ex, ey] = vp[5];
    if (A.crack) out.push(...star(Math.min(33.4, ex), ey - 0.6, 2.6, '#fff6b0'), ...star(Math.min(33.4, ex) - 3, ey - 3.4, 1.2, '#ffd0e8'));
    if (f === 1) out.push(smear(vp.slice(1), 2.4, mix(LB.hi, '#ffffff', 0.4)));
  }

  // Front arm on two bones, the hand wrapped around the staff.
  const ns = [X + 2.6, 28.6 + by];
  const hand = [sx - 0.1, sy];
  out.push(...tubeL([ns, reach(ns, hand, 4, 4, -1), hand], [2.2, 2, 1.8], BK.base, 4, 0.5), ...ovL(hand[0], hand[1], 1.4, 1.3, 0, BK.base, 0.4));

  // Head: the face, a chained leaf ear, a crown of leaves, the bangs, a sprout and a blossom.
  const head = [];
  head.push(F(E(X, Y, 8.6, 8.2, SK.sh)), ...ball(X, Y, 8.3, 7.9, SK.base, 0, { sh: SK.sh, light: SK.hi, k: 0.25, a0: 80, a1: 215 }));
  const et = idle ? bump(p, 0.17, 0.2) * 14 : walk ? Math.sin(p * TAU * 2 - 2) * 5 : 0;
  head.push(...leaf(X - 4.8, Y + 1.4, 4.6, 2.8, 200 + (angry ? -15 : 0) - et * 0.5, SK, (i) => (i ? -et : 0), false));
  const rustle = (i) => ripple(ph - i * 0.45, amp * 0.8, 0.9, 0.3);
  const crown = [[-8, -2, 150], [-7, -6, 165], [-4, -9, 200], [0, -10, 245], [4, -9.4, 285], [7, -7, 315], [8.6, -3, 345]];
  crown.forEach(([dx, dy, a], i) => head.push(...leaf(X + dx * 0.6, Y + dy * 0.6, angry ? 7.4 : 6.4, 4.4, a + blow * 0.3, i % 2 ? LB : LA, rustle(i))));
  head.push(blob([[X - 8.4, Y - 1.4], [X - 7, Y - 7], [X - 1, Y - 9.6], [X + 6, Y - 8], [X + 8.8, Y - 3.4], [X + 4, Y - 5.2], [X - 4, Y - 5]], LA.base));
  // The bangs' shadow on the forehead, so the hair lifts off the skin by value.
  head.push(F(blob([[X - 7.2, Y - 3.2], [X - 3, Y - 4.2], [X + 1, Y - 4.4], [X + 6, Y - 3.6], [X + 7.6, Y - 1.6], [X + 3.6, Y - 2.2], [X, Y - 2.4], [X - 4, Y - 2]], SK.sh)));
  const fringe = [[-6.6, -4.6, 112, LD], [-3.4, -5.4, 100, LA], [-0.2, -5.8, 86, LB], [3, -5.4, 74, LA], [6, -4.6, 60, LB]];
  fringe.forEach(([dx, dy, a, R], i) => head.push(...leaf(X + dx, Y + dy, 4.4 - Math.abs(i - 2) * 0.4, 3.2, a, R, rustle(i + 2), false).map((s) => C(s))));
  head.push(F(ov(X - 1.4, Y - 7.2, 3.4, 0.9, -8, LA.hi)), F(E(X + 3.2, Y - 7.6, 1.2, 0.55, LA.hi)));
  // A sprout curling up from the crown, a chain bobbing a beat behind each step.
  const sp = chain(X + 0.4, Y - 9, dead ? -40 : -88, [1.6, 1.6, 1.4], (i) => (i ? -16 : 0) + ripple(ph - 1, amp * 1.6 + (A ? 10 : 0), 0.9, 0.3)(i));
  const [spx, spy, spa] = sp[3];
  head.push(...tubeL(sp.map(([x, y]) => [x, y]), [0.9, 0.7, 0.6, 0.5], LA.sh, 3, 0.4), ...leaf(spx, spy, 3.6, 2.4, spa - 70, LB, -10, false), ...leaf(spx, spy, 3.2, 2.2, spa + 60, LA, 10, false));
  // A pink blossom tucked in the hair.
  const bx = X - 5.4;
  const bly = Y - 5.6;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + (walk ? p : idle ? p * 0.5 : 0);
    head.push(F(E(bx + Math.cos(a) * 1.4, bly + Math.sin(a) * 1.4, 1.2, 1.2, i < 2 ? '#ffd0e0' : dead ? '#d8b8a8' : '#ffb6d0')));
  }
  head.push(F(E(bx, bly, 0.8, 0.8, '#ffe36b')));

  // Face: honey-amber eyes (they contrast the green hair) with a winged lash; angry, they burn
  // pink like her bud.
  const cx = X + 2.2;
  const cy = Y + 1.8;
  const glance = idle ? 0.35 * Math.sin(p * TAU + 1) : 0;
  const hot = angry || (A && A.crack);
  const de = { shape: 'almond', sclera: '#fffdf6', iris: hot ? ['#7a1040', '#ff5fa8', '#ffd0e8'] : ['#7a4410', '#e09a3a', '#ffe6a0'], pupil: 'round', pupilC: '#3a2210', lashC: '#2f4a28', lash: 1, flicks: 1, lower: 0.5, lowerC: SK.sh, look: [glance, 0.1] };
  const act = { angry: { lid: 0.25, slant: 0.6 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  if (dead) head.push(...deadEye(cx - 2.6, cy, 1.5, { c: '#2f4a28' }), ...deadEye(cx + 2.6, cy, 1.3, { c: '#2f4a28' }));
  else head.push(...easyEye(cx - 2.6, cy, { ...de, ...act, s: -1, w: 1.75, h: 2.1 }), ...easyEye(cx + 2.6, cy, { ...de, ...act, s: 1, w: 1.45, h: 1.95 }));
  if (angry || hurt || happy) for (const s of [-1, 1]) head.push(...brow(cx + s * 2.6, cy - 3, { s, len: 1.2, angle: angry ? 22 : hurt ? -20 : -8, th: 0.45, c: '#4f7a3e' }));
  head.push(...snout(cx - 0.2, cy + 1.7, { type: 'tick', r: 0.6, c: SK.deep }));
  if (!dead) head.push(...cheek(cx - 4.2, cy + 2.6, 1.3, { on: SK.base, lines: happy ? 2 : 0 }), ...cheek(cx + 4, cy + 2.7, 1, { on: SK.base }));
  const mo = { s: 1, ink: '#a8505a' };
  const my = cy + 3.2;
  if (A && A.crack && !dead && !hurt) head.push(...mouth(cx, my, { ...mo, type: 'shout', w: 1, h: 1.6, open: 1, teeth: 'top' }));
  else if (angry) head.push(...mouth(cx, my, { ...mo, type: 'snarl', w: 1.1, h: 1.2, open: 0.8, teeth: 'top' }));
  else if (hurt) head.push(...mouth(cx, my, { ...mo, type: 'o', w: 0.6, h: 0.9, open: 1 }));
  else if (dead) head.push(...mouth(cx, my, { ...mo, type: 'wavy', w: 0.9 }));
  else if (happy) head.push(...mouth(cx, my - 0.2, { ...mo, type: 'grin', w: 1.1, h: 1.4, open: 1, teeth: 'none' }));
  else head.push(...mouth(cx, my, { ...mo, type: 'smile', w: 0.9 }));
  if (hurt) head.push(...sweat(X + 7.6, Y - 5, 0.9));
  if (angry) head.push(...vein(X + 6.4, Y - 2.4, 0.7));
  out.push(...spin(head, neck[0], neck[1], tip));
  return { w: W, h: H, res: 3, shapes: shift(out, 1, 0) };
}

// ---------- Treant (mossgolem) ----------

// Attack: a branch arm swung down like a club. lean: trunk lean, hd: the near hand from the
// shoulder (the elbow follows from two fixed bones), bend: which way the elbow points, imp: the
// blow lands, by: body drop, sd: the near shoulder rolling down into the blow.
const TREANT_ATK = [
  // Wind-up: the arm hauled up high overhead, leaning back.
  { lean: -2.6, hd: [-2, -19], bend: -1, imp: 0, by: -0.6 },
  // Swing: the arm sweeps forward and down.
  { lean: 1.4, hd: [13, -6], bend: -1, imp: 0, by: 0.4 },
  // Slam: the twig fist crashes down on whatever is in front of it.
  { lean: 9, hd: [10, 26], bend: 1, imp: 1, by: 3.6, sd: 5 },
  // Recover: hauling the arm back up.
  { lean: 4, hd: [11, 16], bend: 1, imp: 0, by: 1.4, sd: 2 },
];

function mossgolem(pose, f, mood) {
  const W = 62;
  const H = 70;
  const G = H;
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? TREANT_ATK[f] : null;
  const p = walk ? f / 8 : idle ? f / 6 : 0;
  const dead = mood === 'dead';
  const hurt = mood === 'hurt';
  const angry = mood === 'angry';
  const happy = mood === 'happy';
  // Ramps: warm bark turning plum in its grooves, spring moss, two leaf greens cooling to teal
  // (the crown's back layer a step darker), and the ember eyes as the accent.
  const BK = ramp('#a9826a', { step: 11, turn: 18, sat: -6 });
  const MO = ramp('#9cd486', { step: 10, turn: 20, sat: -8 });
  const LA = ramp(dead ? '#b8b07a' : '#76c27a', { step: 11, turn: 22, sat: -8 });
  const LB = ramp(dead ? '#c9c08a' : '#96d890', { step: 10, turn: 22, sat: -8 });
  const LC = { base: LA.sh, sh: LA.deep, hi: LA.base, deep: edge(LA.deep) };
  const pit = '#3a2a3e';
  const out = [];
  // A slow, lumbering sway: the trunk rolls far over onto each root foot as it lands and sinks
  // under its own weight; idle, it creaks and settles.
  const by = dead ? 5 : walk ? Math.abs(Math.sin(p * TAU)) * -1.6 + 0.6 : A ? A.by : -breath(p) * 0.6;
  const lean = dead ? 3.5 : hurt ? -2.6 : walk ? Math.sin(p * TAU - 0.4) * 2.8 : A ? A.lean : sway(p) * 0.8;
  const cx = 30;
  // The crown sits this much lower than it was laid out, leaving headroom for the nest's bird.
  const CY = 3;
  const pivot = [30, 62];
  const tr = (pts) => turn(pts.map(([x, y]) => [x, y + by]), pivot[0], pivot[1], lean);
  const tp = (x, y) => tr([[x, y]])[0];
  // The crown swings a beat behind the trunk, and its leaves a beat behind that.
  const sw = (walk ? Math.sin(p * TAU - 1.5) * 2.2 : idle ? sway(p - 0.25) * 1.2 : A ? [-2.4, 2, 3, 1][f] : 0) + (hurt ? -1.4 : 0);
  const ph = walk ? p * TAU * 2 - 1.5 : p * TAU - 1.6;
  const amp = dead ? 0 : walk ? 8 : idle ? 6 : A ? 10 : 3;

  // Root feet: a trunk-thick shin and three root toes on chains that lift slowly, curl under,
  // and splay as they plant heavily in turn.
  const foot = (fp, near) => {
    const [dx, lift] = dead ? [near ? 4 : -4, 0] : walk ? gait(p + fp, 10.4, 4, 0.65) : A && near ? [[-0.6, 2.4, 2.4, 1][f], 0] : [near ? 1 : -1, 0];
    const fx = cx + (near ? 6 : -6) + dx;
    const fy = G - 1.6 + lift;
    const c = near ? BK.base : BK.sh;
    const top = tp(cx + (near ? 6 : -6), 57);
    const parts = near ? [...tubeL([top, [fx, fy - 4], [fx, fy]], [9, 7, 6], c, 4, 0.7), F(tube([[top[0] - 2.6, top[1] + 1], [fx - 2.2, fy - 4], [fx - 2, fy - 1]], [2.6, 2, 1.4], BK.sh))] : [tube([top, [fx, fy - 4], [fx, fy]], [9, 7, 6], c)];
    const curl = lift < -0.5 ? 1 : 0;
    for (const [o, len, a] of [[-2, 4.6, 168], [0, 5.4, 18], [2.4, 5.4, 4]]) {
      const s = a > 90 ? -1 : 1;
      const j = chain(fx + o, fy - 1, a - s * curl * 20, [len * 0.55, len * 0.45], (k) => (k ? s * (14 + curl * 40) : 0)).map(([x, y]) => [x, Math.min(G - 0.4, y)]);
      parts.push(...(near ? tubeL(j, [3, 2, 1.2], c, 3, 0.6) : [tube(j, [3, 2, 1.2], c, 3)]));
    }
    if (near) parts.push(F(E(fx - 1, fy - 4, 1.4, 1, MO.sh)));
    return parts;
  };

  // Branch arms: a crooked bough on two fixed bones, twig fingers on chains, and a sprig of
  // leaves at the elbow trailing the swing.
  const arm = (near) => {
    // The near shoulder rolls down into the slam (sd), so the club reaches the ground.
    const sh = tp(near ? 43 : 17, 31 + (A && near && !dead ? A.sd ?? 0 : 0));
    const s = near ? 1 : -1;
    const swing = (walk ? Math.sin(p * TAU - 0.8) * (near ? -3.4 : 3.4) : idle ? sway(p + (near ? 0 : 0.5)) * 1 : 0) + (angry ? -4 : 0) + (dead ? 6 : 0) + (hurt ? -2 : 0);
    const aim = A && near && !dead;
    const hand = aim ? [sh[0] + A.hd[0], sh[1] + A.hd[1]] : [sh[0] + (5 + swing * 0.5) * s, sh[1] + 17 + swing];
    const dist = Math.min(Math.hypot(hand[0] - sh[0], hand[1] - sh[1]), 24.5);
    const ha = Math.atan2(hand[1] - sh[1], hand[0] - sh[0]);
    const wrist = [sh[0] + Math.cos(ha) * dist, sh[1] + Math.sin(ha) * dist];
    const fixed = reach(sh, wrist, 12, 12.6, aim ? A.bend : s);
    const c = near ? BK.base : BK.sh;
    const o = near ? [...tubeL([sh, fixed, wrist], [6, 4, 3], c, 4, 0.7), F(band([[sh[0] + 0.6, sh[1] - 1.6], [fixed[0] + 0.6, fixed[1] - 1.2]], 0.6, BK.hi))] : [tube([sh, fixed, wrist], [6, 4, 3], c)];
    const dir = (Math.atan2(wrist[1] - fixed[1], wrist[0] - fixed[0]) * 180) / Math.PI;
    const fist = aim && f >= 1;
    const fan = aim ? [dir - 40, dir, dir + 40] : near ? [40, 80, 120] : [60, 100, 140];
    fan.forEach((a, i) => {
      const j = chain(wrist[0], wrist[1], a + (angry && !A ? -30 : 0), [2, 2], (k) => (k ? (fist ? 50 : 16) : 0) + ripple(ph - 1 - i * 0.6, amp * 0.6, 0.9, 0.3)(k)).map(([x, y]) => [x, Math.min(G - 0.4, y)]);
      o.push(...(near ? tubeL(j, [1.6, 1.1, 0.6], c, 2, 0.5) : [tube(j, [1.6, 1.1, 0.6], c, 2)]));
    });
    const R = near ? LB : LC;
    o.push(...leaf(fixed[0], fixed[1] - 1, 5.4, 3.4, (near ? -60 : -120) + sw * 6, R, ripple(ph - 0.5, amp, 0.9, 0.3)), ...leaf(fixed[0], fixed[1] - 1, 4.6, 3, (near ? -15 : -165) + sw * 5, R, ripple(ph - 1.1, amp, 0.9, 0.3)));
    return o;
  };

  // A leaf cloud of the crown, swinging with it.
  const crown = (x, y, rx, ry, R, hi = true) => {
    const [px, py] = tp(x + sw * (1 - y / 40), y + CY);
    return ball(px, py, rx, ry, R.base, 0, { sh: R.sh, light: R.hi, hi, jag: 2 });
  };
  out.push(...arm(false));
  out.push(...foot(0.5, false));
  for (const [x, y, rx, ry] of [[14, 16, 10, 8], [46, 15, 10, 8], [30, 10, 15, 9], [22, 22, 9, 6], [40, 22, 9, 6]]) out.push(...crown(x, y, rx, ry, LC, false));

  // The trunk: shadow down its back side, a lighter front plate where the face sits, grooves
  // in the deep tone with a lit lip on each.
  const trunk = tr([[17, 60], [18.4, 50], [16.6, 38], [17.6, 26], [21, 18], [39, 18], [42.4, 26], [43.4, 38], [41.6, 50], [43, 60], [36, 62], [30, 61], [24, 62]]);
  out.push(T(trunk.map(([x, y]) => [x + (x - cx) * 0.035, y + 0.3]), edge(BK.base)), blob(trunk, BK.base, 3));
  out.push(F(blob(tr([[17.4, 60], [18.8, 50], [17, 38], [18, 26], [21.4, 18.6], [24.4, 19], [22, 27], [22.6, 40], [22, 52], [23.6, 61.4]]), BK.sh, 3)));
  out.push(F(blob(tr([[21, 32], [25, 27], [35, 27], [39.6, 33], [39, 48], [33, 52], [26, 52], [21.4, 47]]), mix(BK.base, BK.hi, 0.45), 3)));
  for (const line of [[[19.6, 56], [20.6, 48], [19.4, 40]], [[40.4, 58], [39.4, 50], [41, 42]], [[22.4, 22], [21.2, 28]], [[38, 21], [39.4, 27]], [[29.6, 54], [30.4, 60]], [[25, 55], [24.4, 60]], [[35, 55], [35.8, 60]]]) {
    out.push(band(tr(line), 0.7, BK.deep), band(tr(line).map(([x, y]) => [x + 0.6, y]), 0.35, BK.hi));
  }
  // A knothole on the side.
  const [kx, ky] = tp(20.4, 44);
  out.push(F(E(kx, ky, 1.6, 2.2, BK.deep)), F(E(kx + 0.3, ky + 0.4, 0.9, 1.4, pit)));
  // Mushrooms growing up the side.
  const MU = ramp(dead ? '#c8a8a0' : '#ff9eb8', { step: 10, turn: 12, sat: -6 });
  for (const [x, y, r] of [[17.6, 36, 2.6], [18.6, 32, 1.8]]) {
    const [mx, my] = tp(x, y);
    out.push(F(R(mx - 0.5, my, 1.2, 1.8, '#fff0dc')), ...ovL(mx - 0.6, my, r, r * 0.6, 0, MU.base, 0.35), crescent(mx - 0.6, my, r, r * 0.6, MU.sh, { k: 0.4 }), F(E(mx - 1, my - 0.3, 0.5, 0.35, '#ffffff')));
  }
  // Moss draped over the shoulders, lit along the top.
  out.push(C(blob(tr([[16.4, 27], [19, 20], [25, 17.4], [26.4, 21], [23.4, 22.4], [22, 26], [19.4, 25.6], [18.6, 30]]), MO.base, 3)));
  out.push(C(blob(tr([[43.6, 28], [41.4, 20], [35, 17.4], [34, 21], [37, 21.6], [38.4, 24.6], [41, 25], [42, 31]]), MO.base, 3)));
  out.push(F(band(tr([[19.4, 21], [24.4, 18.4]]), 0.8, MO.hi)), F(band(tr([[35.6, 18.4], [40.6, 20.8]]), 0.8, MO.hi)));
  out.push(...foot(0, true));

  // The face: deep knot holes with ember eyes glowing in them, moss brows, a knobby nose, a
  // mouth, and a mossy beard.
  const [ex1, ey1] = tp(27.4, 37);
  const [ex2, ey2] = tp(36.6, 37);
  const drift = idle ? 0.5 * Math.sin(p * TAU) : 0;
  const ge = { c: angry || A ? '#ff8a3a' : '#ffcf5a', bg: pit, hot: angry || A ? '#ffe0a0' : '#fff6c8', shape: 'round', look: [drift, 0], flick: idle ? bump(p, 0.5, 0.2) : A ? [0.6, 0.2, 0.8, 0.1][f] : 0 };
  const act = { angry: { lid: 0.35, slant: 0.8 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  if (A && !act.closed) Object.assign(act, { lid: 0.3, slant: 0.7 });
  for (const [x, y, s] of [[ex1, ey1, -1], [ex2, ey2, 1]]) {
    out.push(F(E(x, y, 3.3, 2.9, BK.deep)), F(E(x, y + 0.2, 2.7, 2.3, pit)));
    if (dead) out.push(...deadEye(x, y + 0.2, 1.3, { c: '#8a7a8a' }));
    else out.push(...glowEye(x + 0.2, y + 0.3, { ...ge, ...act, s, w: 1.7, h: 1.8 }));
  }
  // Moss brows: heavy, wise, and expressive; idle, one lifts as it ponders.
  const ponder = idle ? bump(p, 0.5, 0.3) : 0;
  const lift = happy ? -1.6 : hurt ? -1 : 0;
  const tilt = angry || A ? 2.6 : happy ? -0.6 : hurt ? -1.4 : 0.8;
  const browB = (x, y, s, l) => [C(blob([[x - s * 4.4, y - 3.6 + l + tilt * 0.2], [x - s * 1, y - 5 + l - tilt * 0.4], [x + s * 2.6, y - 4.4 + l + tilt], [x + s * 3.6, y - 2.6 + l + tilt * 1.2], [x + s * 0.6, y - 3 + l + tilt * 0.4], [x - s * 3.6, y - 2.2 + l]], MO.base, 3)),
    F(band([[x - s * 3.4, y - 3.9 + l], [x - s * 0.4, y - 4.7 + l - tilt * 0.3]], 0.5, MO.hi))];
  out.push(...browB(ex1, ey1, 1, lift - ponder * 1.4), ...browB(ex2, ey2, -1, lift));
  // Nose knot.
  const [nx, ny] = tp(32.4, 41.4);
  out.push(F(ov(nx, ny, 2.6, 2.2, 0, edge(BK.base))), ...ball(nx, ny, 2.2, 1.8, mix(BK.base, BK.hi, 0.6), 0, { sh: BK.sh, light: '#fff6e6' }));
  // Mouth.
  const [mx, my] = tp(32, 46);
  const mo = { s: 1, ink: BK.deep, inner: pit };
  if (A && A.imp && !dead && !hurt) out.push(...mouth(mx, my, { ...mo, type: 'shout', w: 3, h: 3.6, open: 1, teeth: 'top' }));
  else if (angry || (A && !dead && !hurt)) out.push(...mouth(mx, my, { ...mo, type: 'snarl', w: 3.6, h: 2.8, open: 1, teeth: 'top' }));
  else if (hurt) out.push(...mouth(mx, my, { ...mo, type: 'o', w: 1.4, h: 1.8, open: 1 }));
  else if (dead) out.push(...mouth(mx, my, { ...mo, type: 'wavy', w: 3, th: 0.7 }));
  else if (happy) out.push(...mouth(mx, my - 0.4, { ...mo, type: 'grin', w: 3.2, h: 2.6, open: 1, teeth: 'none' }));
  else out.push(...mouth(mx, my - 0.4, { ...mo, type: 'smile', w: 3, curve: 0.7, th: 0.7 }));
  if (!dead) out.push(...cheek(ex1 - 1.6, ey1 + 4.4, 1.6, { on: BK.base }), ...cheek(ex2 + 1.6, ey2 + 4.4, 1.5, { on: BK.base }));
  // Mossy beard: a cap at the chin and strands on chains swaying a beat behind.
  out.push(C(blob(tr([[25.4, 49.4], [29, 50.6], [35, 50.2], [38.6, 48.8], [37.4, 52], [27, 52.2]]), MO.base, 3)));
  for (let i = 0; i < 6; i++) {
    const j = chain(26.6 + i * 2.2, 51 + Math.sin(i * 1.3) * 0.4, 90 - sw * 5, [2.6, 2.2 + (i % 2) * 1.2], ripple(ph - i * 0.5, amp * 0.7, 0.9, 0.3)).map(([x, y]) => [x, y]);
    out.push(tube(tr(j), [3.2, 2.4, 0.8], i % 2 ? MO.sh : MO.base));
  }
  out.push(F(E(...tp(30, 50.4), 1.6, 0.6, MO.hi)));
  // The near arm sits under the crown, except when it's raised through it to strike.
  if (!A) out.push(...arm(true));

  // Crown front: big leafy clouds, a fringe of leaves on chains hanging from its underside, a
  // ring of leaves rustling root to tip, a few blossoms, and the bird's nest.
  for (const [x, y, rx, ry, R] of [[11, 22, 7.6, 5.6, LA], [49, 21, 7.6, 5.6, LA], [18, 12, 9, 6.6, LB], [30, 7, 10, 6.4, LB], [42, 12, 9, 6.6, LA], [25, 19, 6, 3.6, LA], [36, 19, 6, 3.6, LB]]) out.push(...crown(x, y, rx, ry, R));
  for (let i = 0; i < 9; i++) {
    const [px, py] = tp(9 + i * 5.2 + sw * 0.6, 23.4 + CY + Math.sin(i * 1.7) * 1.2 - (i === 0 || i === 8 ? 2 : 0));
    out.push(...leaf(px, py, 3.6, 2.6, 90 + sw * 8 + (i - 4) * 4, i % 2 ? LA : LC, ripple(ph - i * 0.5, amp, 0.9, 0.3), false));
  }
  [[6, 18, 200], [5, 24, 160], [12, 7, 230], [22, 2, 260], [38, 2, 285], [48, 7, 310], [55, 17, 340], [55, 24, 20]].forEach(([x, y, a], i) => {
    const [px, py] = tp(x + sw * (1 - y / 40), y + CY);
    out.push(...leaf(px, py, 4.4, 3, a + sw * 4, LB, ripple(ph - i * 0.6, amp, 0.9, 0.3), false));
  });
  if (!dead) {
    for (const [x, y] of [[20, 16], [45, 17], [10, 14]]) {
      const [px, py] = tp(x + sw, y + CY);
      for (let i = 0; i < 5; i++) out.push(F(E(px + Math.cos((i / 5) * TAU) * 1, py + Math.sin((i / 5) * TAU) * 1, 0.85, 0.85, i < 2 ? '#ffe0ea' : '#ffc4d8')));
      out.push(F(E(px, py, 0.55, 0.55, '#ffe36b')));
    }
  }
  if (A) out.push(...arm(true));
  // Leaves shaken loose by the slam.
  if (A && !dead && f >= 2) for (const [x, y, a] of [[8, 30, 30], [52, 26, -40], [14, 38, 70]]) out.push(...leaf(x, y + (f - 2) * 4, 3, 2, a + f * 40, LB, 20, false));
  // The nest, with a little bluebird who reacts to everything.
  const NE = ramp('#c99a6a', { step: 11, turn: 18, sat: -6 });
  const [nx2, ny2] = tp(36 + sw * 0.9, 2.6 + CY);
  out.push(...ovL(nx2, ny2 + 1.6, 4.6, 2.2, 0, NE.base, 0.4), crescent(nx2, ny2 + 1.6, 4.6, 2.2, NE.sh, { k: 0.4 }));
  for (const k of [-3, -1, 1, 3]) out.push(band([[nx2 + k - 1.4, ny2 + 0.8], [nx2 + k + 1.2, ny2 + 2.6]], 0.4, NE.deep));
  if (!dead) {
    const BI = ramp('#8ec8ff', { step: 10, turn: 14, sat: -6 });
    const hop = happy ? -1.2 : angry ? -0.8 : A ? [-0.4, -1.8, -2.4, -0.6][f] : walk ? -Math.abs(Math.sin(p * TAU * 2)) * 1 : -bump(p, 0.33, 0.2) * 1.2;
    const bx = nx2 + 0.6;
    const bby = ny2 - 1.4 + hop;
    out.push(...ovL(bx, bby, 2.6, 2.1, 0, BI.base, 0.4), crescent(bx, bby, 2.6, 2.1, BI.sh, { k: 0.4 }), F(E(bx + 0.8, bby + 0.8, 1.4, 1, '#ffe2c8')));
    out.push(F(T([[bx + 2.2, bby - 0.4], [bx + 3.8, bby + 0.1], [bx + 2.2, bby + 0.6]], '#ffb347')));
    out.push(T([[bx - 1, bby - 1.8], [bx - 0.2, bby - 3 - (angry ? 0.8 : 0)], [bx + 0.4, bby - 1.8]], BI.base));
    // A wing flaps as it hops.
    if (hop < -0.5) out.push(T([[bx - 1.6, bby], [bx - 3.6, bby - 1.8], [bx - 0.4, bby + 0.6]], BI.sh));
    if (mood === 'blink' || happy) out.push(band([[bx + 0.5, bby - 0.1], [bx + 1, bby - 0.6], [bx + 1.5, bby - 0.1]], 0.4, LASH));
    else if (hurt || (A && A.imp)) out.push(band([[bx + 0.6, bby - 0.8], [bx + 1.4, bby - 0.3], [bx + 0.6, bby + 0.2]], 0.4, LASH));
    else out.push(F(E(bx + 1, bby - 0.3, 0.45, 0.55, LASH)));
    if (happy) out.push(F(E(bx + 5.6, bby + 1.4, 0.8, 0.6, LASH)), band([[bx + 6.3, bby + 1.4], [bx + 6.3, bby - 1.2], [bx + 7.2, bby - 0.6]], 0.4, LASH));
    if (angry) out.push(band([[bx + 0.2, bby - 1.4], [bx + 1.8, bby - 0.8]], 0.4, LASH));
  } else {
    out.push(F(ov(nx2 + 6, ny2 + 8, 0.8, 1.8, 40, '#8ec8ff')));
  }
  if (A && A.imp) {
    const sh = tp(43, 31 + (A.sd ?? 0));
    const ha = Math.atan2(A.hd[1], A.hd[0]);
    const [hx, hy] = [sh[0] + Math.cos(ha) * 24.5, sh[1] + Math.sin(ha) * 24.5];
    out.push(...star(Math.min(hx + 2, 57), hy + 2, 3.2, '#fff2a8'), ...dust(Math.min(hx, 54), G - 0.6, 1.4));
  }
  if (hurt) out.push(...sweat(52, 30, 1.2));
  return { w: W, h: H, res: 3, shapes: shift(out, 1, 0) };
}

export const ART = {
  // (Windy Canyon's two, remade from scratch 2026-11-18: live rigs, their stills from the same shapes.)
  pebblet: { walk: 8, idle: 6, attack: 4, stride: 13, atkMs: [80, 300, 220], draw: basiliskStill, rig: basiliskRig, pad: 4 },
  scorpip: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 300, 220], draw: manticoreStill, rig: manticoreRig, pad: 4 },
  leafling: { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [55, 230, 170], draw: leafling },
  // (Remade 2026-11-20 as the Wolf Pup: a live rig.)
  boarlet: { pad: 6, walk: 8, idle: 6, attack: 4, stride: 36, atkMs: [55, 290, 200], draw: wolfPupStill, rig: wolfPupRig },
  mossgolem: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [75, 320, 230], draw: mossgolem },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  pebblet: { name: 'Basilisk Hatchling', w: 24, h: 30 },
  scorpip: { name: 'Manticore Cub', w: 30, h: 30 },
  leafling: { name: 'Dryad', w: 20, h: 34 },
  boarlet: { name: 'Warg', w: 38, h: 26 },
  mossgolem: { name: 'Treant', w: 34, h: 58 },
};
