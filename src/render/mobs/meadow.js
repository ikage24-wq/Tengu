// Monster art: Petal Meadow and Clover Hills (levels 1-8), the first monsters a player meets.
//   puffle      Kitsune Kit: a tiny fox spirit with three tails tipped in spirit flames
//   snailbun    Moss Tortoise: a little tortoise carrying a garden on its shell
//   sproutling  Mandrake: a root creature with a leafy crown that screams when angry
//   mushkin     Toadstool Goblin: a goblin in a spotted mushroom-cap helmet with a club
//   piglet      Jackalope: a fluffy antlered hare that bounds along
// Every design faces right with its feet on the bottom edge; see kit.js for the shapes. Each has
// its own gait (a light trot, a heavy plod, a root-footed scurry, a bow-legged swagger, bounding
// hops), its own face built from faces.js (fox almond eyes, sleepy tortoise lids, a mandrake's
// big round eyes, a goblin's shifty squint, a hare's glossy eye), an idle fidget loop, and a
// four-frame attack (wind-up, strike, impact, recover).

import { R, E, T, F, C, BLUSH, arc, stroke, shade, mix } from './kit.js';
import { eye, brow, mouth, nose, blush as cheek, sweat, tear, vein, deadEye } from './faces.js';

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

// An ellipse stretched between two points, w its half width (ears, limbs, feet).
function seg(a, b, w, c) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return O((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, len / 2, w, Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R, c);
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
  return [T([...l, ...r.reverse()], c), ...stroke(spine, 0.4, rib)];
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
  return [F(T([[x, y - r], [x + k, y - k], [x + r, y], [x + k, y + k], [x, y + r], [x - k, y + k], [x - r, y], [x - k, y - k]], c)), F(E(x, y, k * 0.9, k * 0.9, core))];
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

// ---------- Kitsune Kit (puffle) ----------

// Attack: fox-fire. b*/h*: body and head offsets, tl: tails raised, fl: tail flames flare, g: how
// wide the mouth opens, orb: the fox-fire [dx, dy, r] from the head, ff/fh: front/hind feet.
const KIT_ATK = [
  // Wind-up: crouched back on the haunches, chin tucked, tails flared, a fox-fire kindling.
  { bx: -1.8, by: 1.5, hx: -2.6, hy: 1.9, tl: -0.6, fl: 0, g: 0, orb: [8.6, 3.6, 1.3], ff: 1.6, fh: -0.6, sw: 1.6 },
  // Spit: thrust forward, mouth wide, the fire bursting off the muzzle.
  { bx: 0.6, by: -0.5, hx: 0.4, hy: -0.9, tl: 1.4, fl: -0.4, g: 1, orb: [8.6, 1.4, 2.2], ff: 0.4, fh: 1, sw: -1.8 },
  // Follow-through: the fox-fire floats up and away, tails streaming back.
  { bx: 0.3, by: 0, hx: 0.2, hy: -0.4, tl: 0.7, fl: -0.4, g: 0.55, orb: [8, -5, 2.6], ff: 0.2, fh: 0.6, sw: -0.9 },
  // Recover: settling back, the last of it drifting off as sparks.
  { bx: -0.3, by: 0.4, hx: -0.4, hy: 0.4, tl: -0.3, fl: -0.6, g: 0.1, orb: [8.2, -10, 1.5], ff: 0, fh: 0, sw: 0.5 },
];

function foxfire(x, y, r, outer, inner) {
  return [F(E(x, y, r * 1.45, r * 1.35, mix(inner, '#ffffff', 0.4))), ...flame(x, y + r * 0.55, r * 2.3, -r * 0.3, outer, inner),
    ...star(x + r * 1.5, y - r * 0.9, 0.9, '#fff6c8'), F(E(x - r * 1.2, y + r * 0.9, 0.45, 0.45, inner))];
}

function kitsune(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? KIT_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const p = q * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const fur = '#ffb98c';
  const furD = '#eea078';
  const cream = '#fff4e8';
  const sock = '#c58e86';
  const mark = '#ff6f92';
  const [fo, fi] = angry || A ? ['#ff8ab8', '#ffe1ee'] : ['#a6c8ff', '#eef6ff'];
  const out = [];

  // A light trot: diagonal pairs with a little float between steps, lowest at mid-stance.
  const DUTY = 0.4;
  const bob = dead ? 3 : walk ? 0.8 * Math.cos(2 * TAU * (q - 0.2)) - 0.1 : A ? A.by : Math.sin(p) * 0.35;
  const surge = walk ? 0.35 * Math.sin(2 * TAU * (q - 0.1)) : 0;
  const rx = hurt ? -1.4 : 0;
  const bx = 15 + rx + surge + (A ? A.bx : 0);
  const by = 22 + bob;

  // Tails: three fluffy plumes; a ripple runs down them as it trots, a lazy swish when idle.
  const tips = [[-9.6, -11.4, -9.4, -1], [-2.6, -15.4, -7.4, -6], [-10.2, -2.8, -4.6, 2]];
  tips.forEach(([tdx, tdy, cdx, cdy], k) => {
    const sw = A ? A.sw * (1 - k * 0.2) : walk ? Math.sin(2 * TAU * q - 1.4 - k * 0.8) * 1.4 - 1 : Math.sin(p - k * 1.1) * 1.8 + bump(q, 0.55 + k * 0.08, 0.2) * 1.2;
    const lift = happy ? -1.5 : dead ? [6, 8, 1.5][k] : angry ? -1 : 0;
    const flow = walk ? Math.cos(2 * TAU * q - 1.8 - k * 0.8) * 0.9 + 1.2 : A ? A.tl : 0;
    const base = [bx - 5.5, by - 1];
    const tip = [base[0] + tdx + sw + (dead ? -1 : 0), base[1] + tdy + lift + flow + Math.abs(sw) * 0.3];
    const ctl = [base[0] + cdx + sw * 0.35, base[1] + cdy + flow * 0.4];
    const tone = k === 2 ? furD : fur;
    const tc = k === 2 ? shade(cream, -5) : cream;
    for (const pass of [0, 1]) {
      for (let i = 0; i <= 7; i++) {
        const t = i / 7;
        const [x, y] = bz(base, ctl, tip, t);
        const r = 1.5 + 1.7 * Math.sin(Math.PI * (0.18 + 0.66 * t)) + (pass ? 0 : 0.45);
        const c = t > 0.7 ? tc : tone;
        out.push(pass ? E(x, y, r, r * 0.95, c) : F(E(x, y, r, r * 0.95, mix(shade(c, -22), '#9b6a8a', 0.3))));
      }
    }
    for (const t of [0.35, 0.55]) {
      const [x, y] = bz(base, ctl, tip, t);
      out.push(...stroke([[x - 1.4, y + 0.4], [x - 0.4, y - 0.2], [x + 0.4, y + 0.3]], 0.35, shade(tone, -12)));
    }
    out.push(F(E(tip[0] - 0.6, tip[1] - 0.6, 1, 0.7, '#ffffff')));
    const fl = Math.sin((walk ? 2 * TAU * q : p * 2) + k * 2.1);
    const h = dead ? 0 : (angry ? 7 : hurt ? 3 : 4.6) + fl * 0.7 + (A ? A.fl : 0);
    out.push(...flame(tip[0] - 0.2, tip[1] - 1.2, h, -sw * 0.5 + fl * 0.5 + (walk ? -1 : 0), fo, fi));
  });

  // Legs: hips ride with the body, feet stay planted on the ground.
  const hipY = by + 2.4;
  const leg = (hx0, fx0, ph, near, front) => {
    let [dx, up] = walk ? gait(q + ph, 8.8, 2.2, DUTY) : [0, 0];
    if (A) dx += front ? A.ff : A.fh;
    const fx = fx0 + rx + dx + (dead ? (near ? 2 : -2) : 0);
    const fy = dead ? 29.4 : 29 - up;
    const c = near ? fur : furD;
    return [...limb([hx0, hipY], [fx, fy - 0.8], 2.8, 2.2, c), E(fx + 0.5, fy, 1.7, 1, near ? sock : shade(sock, -6))];
  };
  out.push(...leg(bx - 4.2, 10.8, 0.5, false, false), ...leg(bx + 4.2, 19.2, 0, false, true));
  // Body: haunch, barrel, cream chest (swelling with each breath).
  const br = idle ? Math.sin(p) * 0.25 : 0;
  out.push(E(bx - 3.8, by + 0.4, 3.9, 4, fur), E(bx, by, 6.8 + br, 4.4 + br, fur), E(bx + 4.4, by + 0.8, 3.2 + br, 3.6 + br, cream));
  out.push(...leg(bx - 2.8, 12.2, 0, true, false), ...leg(bx + 5.4, 20.4, 0.5, true, true));

  // Head: steadied against the trot, its nod a beat behind the body; idle, it glances about.
  const nod = walk ? Math.sin(2 * TAU * q - 2.2) * 0.4 : idle ? -0.6 * bump(q, 0.33, 0.3) + 0.2 * Math.sin(p) : 0;
  const glance = idle ? 0.5 * Math.cos(p) : 0;
  const hx = 23 + rx * 1.1 + (dead ? -0.5 : 0) + (A ? A.hx : surge * 0.6);
  const hy = 13.5 + bob * (walk ? 0.55 : 0.8) + nod + (hurt ? -0.6 : 0) + (dead ? 1.6 : 0) + (A ? A.hy : 0);

  // Ruff: a fluffy cream collar, bristling when angry.
  const spike = angry ? 1.6 : 0;
  out.push(E(hx - 4.2, hy + 6.4, 3.4, 2.6, cream), E(hx - 0.8, hy + 7.2, 3.6, 2.6, cream), E(hx + 2.4, hy + 6.6, 2.8, 2.2, cream));
  for (const [x, y] of angry ? [[hx - 5.6, hy + 8], [hx - 3, hy + 9], [hx - 0.4, hy + 9.4], [hx + 2.2, hy + 8.6]] : [[hx - 3.6, hy + 8.8], [hx + 0.4, hy + 9.2]]) {
    out.push(T([[x - 1.4, y - 1], [x + 1.4, y - 1], [x + 0.2, y + 1.2 + spike]], cream));
  }

  // Ears: big and pointy, swaying a beat behind the head; idle, the near one flicks.
  const esw = walk ? Math.sin(2 * TAU * q - 2.9) * 0.9 : A ? [-1.4, 1.2, 0.6, 0][f] : Math.sin(p - 0.8) * 0.3;
  const twitch = idle ? bump(q, 0.67, 0.22) : 0;
  const farT = idle ? bump(q, 0.17, 0.2) * 0.7 : 0;
  const droop = dead ? 1 : hurt ? 0.6 : angry ? 0.35 : 0;
  const ear = (b0, b1, tip, c) => {
    const lp = (u, v, t) => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
    const mid = lp(b0, b1, 0.5);
    return [T([b0, tip, b1], c),
      F(T([lp(lp(b0, b1, 0.16), tip, 0.08), lp(mid, tip, 0.86), lp(lp(b0, b1, 0.84), tip, 0.08), lp(mid, tip, -0.04)], '#ffb3c6')),
      F(T([tip, lp(tip, b0, 0.24), lp(tip, b1, 0.24)], sock))];
  };
  out.push(...ear([hx - 6.4, hy - 2.4], [hx - 1.4, hy - 5.8], [hx - 6.4 + esw - droop * 5 - farT * 1.4, hy - 13 + droop * 7 + farT], furD));
  out.push(E(hx, hy, 8, 6.9, fur));
  out.push(...ear([hx + 0.2, hy - 6.2], [hx + 5.6, hy - 3.6], [hx + 4.4 + esw + twitch * 1.8 + droop * 5, hy - 13.4 + twitch * 1.2 + droop * 7.5], fur));
  // Cheek fluff and the cream lower face and muzzle.
  out.push(T([[hx - 6.6, hy + 0.6], [hx - 9.4 - esw * 0.3, hy + 4.8], [hx - 6.4, hy + 3.8], [hx - 7, hy + 6.6], [hx - 3.4, hy + 5.4]], fur),
    E(hx + 1.6, hy + 3.4, 5.6, 3.2, cream), E(hx + 6.4, hy + 2.8, 3.2, 2.3, cream),
    F(E(hx - 3.4, hy - 3.8, 2.2, 1.2, mix(fur, '#ffffff', 0.35))));
  // Kitsune mask: a flame mark on the brow.
  out.push(F(T([[hx + 0.9, hy - 3.6], [hx + 0.2, hy - 5.1], [hx + 0.8, hy - 6.6], [hx + 1.6, hy - 5.1]], mark)));
  // Face: sly almond fox eyes (amber, slit pupils, red liner wings) under red maro brows. Smug and
  // half-lidded at rest, a narrow pink glare when angry, a tight wince when hurt, swirled when dead.
  const ey = hy + 0.6;
  const eyeF = [hx - 2.6, ey + 0.1];
  const eyeN = [hx + 3.5, ey];
  const lashC = '#3a1f2e';
  const fe = { shape: 'almond', tilt: 0.5, iris: angry || A ? ['#8a1e48', '#ff4f8a', '#ffc6da'] : ['#9a4a1c', '#f59a2e', '#ffe08a'], pupil: 'slit', lashC, liner: mark, lower: 0.6, look: [glance, 0] };
  const act = { idle: { lid: 0.26, slant: -0.1 }, angry: { lid: 0.12, slant: 0.9, raise: 0.25, pupilK: 0.5 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'blink' } }[mood] ?? {};
  if (dead) out.push(...deadEye(eyeF[0], eyeF[1], 1.9, { type: 'swirl', s: -1, c: lashC }), ...deadEye(eyeN[0], eyeN[1], 2.3, { type: 'swirl', c: lashC }));
  else out.push(...eye(eyeF[0], eyeF[1], { ...fe, ...act, s: -1, w: 2.2, h: 2.7, squeeze: 0.85 }), ...eye(eyeN[0], eyeN[1], { ...fe, ...act, s: 1, w: 2.8, h: 3 }));
  // Maro brows: lopsided (one cocked: smug), slammed into slants, lifted in a pained tilt.
  const [ba, bf, bn] = { idle: [-6, 0.1, 0.8], angry: [34, -1.1, -1.1], hurt: [-30, 0.7, 0.7], happy: [-12, 0.7, 0.7], blink: [0, 0, 0], dead: [-15, 0.3, 0.3] }[mood];
  out.push(...brow(eyeF[0] - 0.2, ey - 4 - bf, { s: -1, len: 1.3, angle: ba, th: 0.7, c: mark, shape: 'dot' }),
    ...brow(eyeN[0] + 0.1, ey - 4.3 - bn, { s: 1, len: 1.5, angle: ba, th: 0.78, c: mark, shape: 'dot' }));
  if (!dead) out.push(...cheek(hx - 3.8, ey + 3.4, 1.1, { on: cream, lines: happy ? 2 : 0 }), ...cheek(hx + 2.6, ey + 3.8, 1.3, { on: cream, lines: happy || hurt ? 3 : 0 }));
  // Nose pad and mouth on the muzzle.
  const sniff = idle ? bump(q, 0.83, 0.18) * 0.3 : 0;
  out.push(...nose(hx + 9.2, hy + 1.8 - sniff, { r: 1.05, c: '#3a2a3a' }));
  const mx = hx + 6.5;
  const my = hy + 4.6;
  const g = A && !dead && !hurt ? A.g : 0;
  const mo = { s: 1, ink: '#7a2e40' };
  if (g > 0.3) out.push(...mouth(mx, my - 0.4, { ...mo, type: 'shout', open: 0.55 + g * 0.6, h: 3.2, w: 2.1, fangs: 2, tusks: 1 }));
  else if (angry) out.push(...mouth(mx, my - 0.3, { ...mo, type: 'snarl', open: 1, h: 3.4, w: 2.3, teeth: 'top', fangs: 2, tusks: 2, tongue: false, tilt: -0.3 }));
  else if (happy) out.push(...mouth(mx, my - 0.4, { ...mo, type: 'grin', open: 1, h: 2.8, w: 1.9, fangs: 1, teeth: 'none' }));
  else if (hurt) out.push(...mouth(mx, my - 0.1, { ...mo, type: 'pained', open: 1, h: 2.4, w: 1.8 }));
  else if (dead) out.push(...mouth(mx, my, { ...mo, type: 'wavy', w: 1.3, amp: 0.2, tongueOut: true, tongueLen: 1.7 }));
  else out.push(...mouth(mx, my, { ...mo, type: 'cat', w: 1.6, curve: 0.7, fangs: 1, fangAt: 0.74 }));
  // Marks: a vein when angry; when hurt, a sweat drop and a tear welling in the near eye.
  if (angry) out.push(...vein(hx - 4.4, hy - 4, 1.1));
  if (hurt) out.push(...sweat(hx - 6.2, hy - 3.6, 1.1), ...tear(eyeN[0] + 1, ey + 2.4, 0.9, { type: 'stream', len: 2.6 }));
  // The fox-fire it spits.
  if (A && !dead) out.push(...foxfire(hx + A.orb[0], hy + A.orb[1], A.orb[2], fo, fi));
  return { w: 42, h: 32, res: 3, shapes: out.map((q2) => ({ ...q2, x: q2.x + 6, y: q2.y + 2 })) };
}

// ---------- Moss Tortoise (snailbun) ----------

// Attack: a lunging snap. sx: shell shift, rim: shell height, reach/hy: head, gape: jaws (1 open,
// -1 snapped shut), lift: front feet raised, imp: impact.
const TORT_ATK = [
  // Wind-up: head pulled into the shell, front end reared up off the ground.
  { sx: -1.6, rim: -1.2, reach: -4.2, hy: 0.8, gape: 0, lift: 2.2, imp: 0 },
  // Strike: the front slams down and the head shoots out, jaws wide.
  { sx: 0.3, rim: 0.5, reach: -0.2, hy: 1.6, gape: 1, lift: 0, imp: 0.6 },
  // Impact: jaws snap shut.
  { sx: 0, rim: 0.3, reach: -0.2, hy: 1.9, gape: -1, lift: 0, imp: 1 },
  // Recover: the head eases back.
  { sx: 0, rim: 0, reach: -0.6, hy: 0.6, gape: 0, lift: 0, imp: 0 },
];

function tortoise(pose, f, mood) {
  const walk = pose === 'walk';
  const idle = pose === 'idle';
  const A = pose === 'attack' ? TORT_ATK[f] : null;
  const q = walk ? f / 8 : idle ? f / 6 : 0;
  const p = q * TAU;
  const angry = mood === 'angry';
  const hurt = mood === 'hurt';
  const dead = mood === 'dead';
  const happy = mood === 'happy';
  const skin = '#a3dcc0';
  const skinD = '#86c4a6';
  const shell = '#e4bc8e';
  const shellD = '#c89a6e';
  const plate = '#efcfa4';
  const moss = '#8fd07e';
  const mossL = '#b5e8a2';
  const mossD = '#72b866';
  const out = [];
  // A slow, heavy plod: one foot at a time, the shell sinking hard onto each planted foot.
  const DUTY = 0.75;
  const thud = walk ? -0.75 * Math.abs(Math.sin(2 * TAU * q + 0.5)) + 0.35 : 0;
  const bob = dead ? 1.2 : walk ? thud : A ? A.rim : Math.sin(p) * 0.3;
  const sx = 17 + (A ? A.sx : walk ? 0.3 * Math.sin(TAU * q) : 0);
  const rim = 21 + bob;

  // Stubby elephant legs, planted one after another (far hind, far front, near hind, near front).
  const leg = (x, ph, near, front) => {
    let [dx, up] = walk ? gait(q + ph, 9, 1.6, DUTY) : [0, 0];
    if (A && front) up += A.lift;
    const fx = x + dx + (dead ? (x < 17 ? -1.5 : 1.5) : 0);
    const fy = 27.2 - up;
    const hx0 = x + (sx - 17);
    const c = near ? skin : skinD;
    const o = [...limb([hx0, rim - 0.5], [fx, fy - 1], 3.8, 3.4, c), E(fx + 0.3, fy - 0.2, 2.3, 1.2, c)];
    if (near) o.push(F(E(fx + 1.4, fy + 0.1, 0.45, 0.35, '#fff6e8')), F(E(fx + 0.2, fy + 0.35, 0.45, 0.35, '#fff6e8')));
    return o;
  };
  out.push(...leg(8.6, 0, false, false), ...leg(23.2, 0.25, false, true));
  // Little tail, wagging a beat behind the steps.
  const tw = walk ? Math.sin(2 * TAU * q - 1.5) * 0.8 : idle ? bump(q, 0.5, 0.25) * 0.8 : 0;
  out.push(T([[sx - 11.6, rim - 1.2], [sx - 15.4, rim + 0.6 + tw], [sx - 11.6, rim + 1]], skin));

  // Head on its neck, poking out to the right: it pushes forward with each step, slowly looks
  // about when idle, and pulls in when hurt.
  const reach = A ? A.reach : (hurt ? -3 : angry ? 1 : 0) + (walk ? 0.7 * Math.sin(2 * TAU * q - 0.9) : idle ? 0.5 * Math.sin(p) - 0.3 : 0);
  const look = idle ? bump(q, 0.5, 0.34) : 0;
  const hx = 33.2 + reach + (sx - 17);
  const hy = (dead ? 21.6 : 14.4) + bob + (walk ? Math.cos(2 * TAU * q + 0.4) * 0.4 : -look * 1.3) + (hurt ? 1.4 : 0) + (A ? A.hy : 0);
  out.push(...limb([sx + 10, rim - 1.2], [hx - 2.2, hy + 1.6], 5.6, 4.8, skin));
  for (const t of [0.35, 0.65]) {
    const x = sx + 10 + (hx - 2.2 - sx - 10) * t;
    const y = rim - 1.2 + (hy + 1.6 - rim + 1.2) * t;
    out.push(...stroke([[x - 0.6, y - 1.8], [x + 0.6, y + 1.8]], 0.4, skinD));
  }

  // The shell: a domed carapace with scutes and a rim, then a garden on top.
  const dome = [];
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    dome.push([sx + Math.cos(a) * 13.4, rim + Math.sin(a) * 12]);
  }
  out.push(T(dome, shell));
  for (const [x, y, w, h] of [[sx, rim - 6.8, 3.4, 3], [sx - 6.6, rim - 5, 2.8, 2.8], [sx + 6.6, rim - 5, 2.8, 2.8], [sx - 10.4, rim - 2.2, 1.6, 1.8], [sx + 10.4, rim - 2.2, 1.6, 1.8]]) {
    out.push(F(T([[x - w, y], [x - w * 0.5, y - h], [x + w * 0.5, y - h], [x + w, y], [x + w * 0.5, y + h], [x - w * 0.5, y + h]], plate)));
  }
  out.push(...stroke([[sx - 3.6, rim - 9.8], [sx - 3.6, rim - 3.6], [sx + 3.6, rim - 3.6], [sx + 3.6, rim - 9.8]], 0.4, shellD),
    ...stroke([[sx - 9.6, rim - 6.6], [sx - 3.6, rim - 6.6]], 0.4, shellD), ...stroke([[sx + 3.6, rim - 6.6], [sx + 9.6, rim - 6.6]], 0.4, shellD),
    ...stroke([[sx - 3.6, rim - 3.6], [sx - 5, rim]], 0.4, shellD), ...stroke([[sx + 3.6, rim - 3.6], [sx + 5, rim]], 0.4, shellD));
  out.push(...leg(11.4, 0.5, true, false), ...leg(26, 0.75, true, true));
  out.push(E(sx, rim + 0.4, 14.2, 2.3, shellD));
  for (let i = 0; i < 9; i++) out.push(F(R(sx - 12 + i * 3, rim - 0.2, 0.4, 1.6, shade(shellD, -8))));

  // Moss blanket, dripping over the dome.
  const mb = rim - 9.6;
  out.push(E(sx, mb, 10.4, 3.4, moss), E(sx - 6.4, mb + 1.4, 5, 3, moss), E(sx + 6.6, mb + 1.4, 5, 3, moss));
  for (const [x, y, l] of [[sx - 9.6, mb + 2.6, 2.6], [sx - 5, mb + 3.2, 1.8], [sx + 1.2, mb + 3.2, 2.4], [sx + 7, mb + 3, 1.6], [sx + 10, mb + 2.4, 2.4]]) {
    out.push(E(x, y + l * 0.5, 1.1, l * 0.6, moss));
  }
  out.push(F(E(sx - 3, mb - 1.2, 2.4, 0.9, mossL)), F(E(sx + 5, mb - 0.4, 1.6, 0.7, mossL)), F(E(sx - 8, mb + 0.6, 1.2, 0.6, mossL)),
    F(E(sx + 2, mb + 1.4, 1.4, 0.6, mossD)), F(E(sx - 6, mb + 2.4, 1, 0.5, mossD)));
  // The garden on top sways a beat behind the shell's jolts.
  const sw = A ? [1.6, -1.8, -1, 0.4][f] : walk ? Math.sin(2 * TAU * q - 2.2) * 1 - 0.3 : Math.sin(p - 1) * 1;
  // Grass tufts.
  for (const [x, h] of [[sx - 9, 2.4], [sx + 9.4, 2], [sx + 3.6, 1.8]]) {
    const w = sw * 0.4;
    out.push(F(T([[x - 1, mb + 1], [x - 0.8 + w, mb - h], [x - 0.2, mb + 0.4], [x + 0.4 + w, mb - h - 0.6], [x + 0.6, mb + 0.4], [x + 1.4 + w, mb - h * 0.6], [x + 1.2, mb + 1]], mossD)));
  }
  // A spotted mushroom (puffs spores when angry), wobbling on its stalk.
  const mx = sx - 5.6 + sw * 0.15;
  const my = mb - 1.4;
  out.push(R(mx - 0.8, my - 1, 1.6, 2.6, '#fff1dc'), T([[mx - 3, my - 0.8], [mx - 2.4, my - 2.8], [mx, my - 3.8], [mx + 2.4, my - 2.8], [mx + 3, my - 0.8]], '#ff8f8f'),
    F(E(mx - 1.2, my - 2.4, 0.55, 0.45, '#ffffff')), F(E(mx + 1, my - 2.9, 0.45, 0.4, '#ffffff')), F(E(mx + 1.8, my - 1.4, 0.35, 0.3, '#ffffff')));
  if (angry) {
    const pf = A ? f * 0.8 : idle ? q * 2 : 0;
    out.push(E(mx - 0.6, my - 4.6 - pf, 1.6, 1.2, '#ffe0e6'), E(mx + 0.8, my - 5.8 - pf, 1.3, 1.1, '#ffe0e6'), E(mx - 0.4, my - 6.8 - pf, 1.1, 0.9, '#fff0f2'), F(E(mx - 0.9, my - 4.9 - pf, 0.5, 0.35, '#ffffff')));
  }
  // The flower: a stem swaying a beat behind, a pink bloom (wilted when dead).
  const fx0 = sx + 3.4;
  const fb = [fx0 + sw * 1.2 + (dead ? 3 : 0), mb - 7.4 + Math.abs(sw) * 0.15 + (dead ? 4 : happy ? -0.6 : 0)];
  out.push(...stroke([[fx0, mb], [fx0 + sw * 0.4, mb - 3.6], fb], 0.8, '#5fae5c'), leaf(fx0 + sw * 0.3, mb - 2.6, -20 + sw * 6, 3.4, 1.1, '#7fcf73'), leaf(fx0 + sw * 0.3, mb - 2, 200 + sw * 6, 2.8, 0.9, '#7fcf73'));
  const petal = dead ? '#d8b4c6' : '#ff9ec4';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2 + sw * 0.2;
    const pr = dead ? 1.4 : happy ? 2.1 : 1.8;
    out.push(E(fb[0] + Math.cos(a) * pr, fb[1] + Math.sin(a) * pr * (dead ? 1.4 : 1) + (dead ? 1 : 0), 1.35, 1.25, petal));
  }
  out.push(F(E(fb[0], fb[1], 1, 1, '#ffe27a')), F(E(fb[0] - 0.3, fb[1] - 0.3, 0.4, 0.4, '#fff6c8')));

  // Head: round, with a sprout on top and a little beak-like mouth.
  out.push(E(hx, hy, 5.4, 4.8, skin), E(hx + 2.2, hy + 1.8, 3.2, 2.4, skin), F(E(hx - 1.6, hy - 2.4, 1.8, 0.8, mix(skin, '#ffffff', 0.4))));
  for (const [x, y] of [[hx - 2.6, hy - 1.6], [hx - 3.4, hy + 0.6], [hx - 1.8, hy + 2.6]]) out.push(F(E(x, y, 0.7, 0.55, skinD)));
  const spr = walk ? Math.sin(2 * TAU * q - 2.6) * 0.8 : A ? [1, -1, -0.6, 0.3][f] : Math.sin(p - 1.2) * 0.5;
  out.push(...stroke([[hx - 0.4, hy - 4.4], [hx - 0.2 + spr * 0.5, hy - 6.2]], 0.5, '#5fae5c'),
    leaf(hx - 0.2 + spr * 0.5, hy - 6, -30 + spr * 15 + (dead ? 120 : 0), 2.8, 1, '#8fd07e'), leaf(hx - 0.2 + spr * 0.5, hy - 6, -160 + spr * 15 - (dead ? 30 : 0), 2.2, 0.8, '#a6e398'));
  // Face: big, sleepy, heavy-lidded eyes (warm brown, round pupils, a lid fold) under soft mossy
  // brows. It dozes at rest and slowly looks up and about; a flat-lidded glare when angry; when
  // hurt it scrunches up and cries big slow tears.
  const ey = hy - 0.3;
  const eyeF = [hx - 2, ey + 0.1];
  const eyeN = [hx + 2.2, ey];
  const lashC = '#2f2a2a';
  const te = { shape: 'heavy', sclera: '#fffaf0', iris: angry || A ? ['#5a1a0e', '#c8502a', '#ffb070'] : ['#3a2a1e', '#7c5636', '#d9ae6c'], pupil: 'round', lashC, lash: 0.85, lower: 0.25, flicks: 1, crease: skinD, look: [0.25, -look * 0.9] };
  const act = { idle: { lid: 0.5 - look * 0.25, slant: -0.3 }, angry: { lid: 0.42, slant: 0.7, raise: 0.25, pupilK: 0.55 }, hurt: { closed: 'squeeze' }, happy: { closed: 'happy' }, blink: { closed: 'sleep' } }[mood] ?? {};
  if (dead) out.push(...deadEye(eyeF[0], eyeF[1], 1.3, { c: lashC, th: 0.55 }), ...deadEye(eyeN[0], eyeN[1], 1.6, { c: lashC, th: 0.6 }));
  else out.push(...eye(eyeF[0], eyeF[1], { ...te, ...act, s: -1, w: 1.45, h: 2 }), ...eye(eyeN[0], eyeN[1], { ...te, ...act, s: 1, w: 1.95, h: 2.3 }));
  // Brows: droopy and sleepy, knitted down hard in anger, tipped up in misery.
  const [ba, bu] = { idle: [-14, 0.1], angry: [30, -0.9], hurt: [-28, 0.5], happy: [-10, 0.6], blink: [-16, -0.1], dead: [-20, 0] }[mood];
  out.push(...brow(eyeF[0] - 0.1, ey - 3 - bu, { s: -1, len: 1.2, angle: ba, th: 0.7, arch: 0.3, c: '#4f8a52', shape: 'bushy' }),
    ...brow(eyeN[0] + 0.1, ey - 3.3 - bu, { s: 1, len: 1.6, angle: ba, th: 0.75, arch: 0.35, c: '#4f8a52', shape: 'bushy' }));
  if (!dead) out.push(...cheek(hx - 2.4, ey + 2.6, 0.9, { on: skin, lines: happy ? 2 : 0 }), ...cheek(hx + 1.6, ey + 2.9, 1, { on: skin, lines: happy ? 3 : 0 }));
  // Nostril on the snout tip, and the beak-like mouth.
  out.push(...nose(hx + 4.9, hy + 0.6, { type: 'dot', r: 0.6, c: shade(skinD, -18) }));
  const mX = hx + 3.4;
  const mY = hy + 2.7;
  const mo = { s: 1, ink: '#3f6450' };
  const gape = A && !dead && !hurt ? A.gape : 0;
  if (gape > 0) out.push(...mouth(mX + 0.2, mY - 0.4, { ...mo, type: 'shout', w: 2, h: 3, open: 1, teeth: 'both' }));
  else if (gape < 0) out.push(...mouth(mX, mY, { ...mo, type: 'flat', w: 1.9, th: 0.5, tilt: 0.2 }), ...star(mX + 2.6, mY + 0.8, 1.4, '#fff2a8'));
  else if (angry) out.push(...mouth(mX, mY - 0.1, { ...mo, type: 'snarl', w: 1.8, h: 2.2, open: 0.9, teeth: 'both', tongue: false }));
  else if (happy) out.push(...mouth(mX, mY - 0.3, { ...mo, type: 'grin', w: 1.6, h: 2.2, open: 1, teeth: 'none' }));
  else if (hurt) out.push(...mouth(mX, mY, { ...mo, type: 'pained', w: 1.5, h: 1.8, open: 1 }));
  else if (dead) out.push(...mouth(mX, mY, { ...mo, type: 'flat', w: 1.3, tongueOut: true, tongueLen: 1.5 }));
  else out.push(...mouth(mX, mY, { ...mo, type: 'smile', w: 1.4, curve: 0.45 }));
  if (angry) out.push(...vein(hx - 2.8, hy - 3.2, 0.75));
  if (hurt) out.push(...tear(eyeN[0] + 0.4, ey + 1.4, 0.9, { type: 'stream', len: 3.4 }), ...tear(eyeF[0] - 0.6, ey + 1.4, 0.75, { type: 'stream', len: 2.6, s: -1 }));
  if (A && A.imp) out.push(...dust(sx + 9.6, 27.6, 0.6 + A.imp * 0.4));
  if (hurt) out.push(...stroke([[sx + 14, rim - 9], [sx + 15.6, rim - 10.4]], 0.5, '#9ad0ff'), ...stroke([[sx + 15.4, rim - 7], [sx + 17.4, rim - 7.6]], 0.5, '#9ad0ff'));
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
  const root = '#f8d6b8';
  const rootD = '#e6b796';
  const line = '#c99b74';
  const out = [];
  // A root-footed scurry: quick short steps, the whole body rocking from foot to foot.
  const DUTY = 0.6;
  const bob = dead ? 2 : walk ? 0.9 * Math.cos(2 * TAU * (q - 0.08)) - 0.2 : A ? A.by : Math.sin(p) * 0.35;
  const rock = dead ? 0 : walk ? 5 * Math.sin(TAU * q - 0.3) : A ? A.rock : 2.2 * Math.sin(p);
  const bx = 15 + (hurt ? -1 : 0) + (walk ? 0.3 * Math.sin(2 * TAU * q) : 0);
  const by = 22.5 + bob;

  // Root legs, scurrying.
  const leg = (x, ph, near) => {
    const [dx, up] = walk ? gait(q + ph, 7.8, 2.4, DUTY) : [0, 0];
    const fx = x + dx + (dead ? (near ? 2.4 : -2.4) : 0);
    const fy = 39.2 - up;
    const c = near ? root : rootD;
    const curl = up * 0.4;
    return [...limb([x + (bx - 15), by + 7], [fx, fy - 1], 4, 2.8, c), E(fx + 0.8, fy - 0.3, 2.2, 1.1, c),
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
  body.push(...limb([bx - 6, by - 1], hand0, 2.2, 1.6, rootD), ...fingers(hand0, -1, rootD));

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
  body.push(F(E(bx + 0.4, by + 6, 7.2, 3.6, mix(root, rootD, 0.25))));
  for (const [y, w] of [[-3.6, 6], [1.8, 7.2], [6.4, 5.4]]) body.push(arc(bx + 0.4, by + y, w, 1.6, 20, 160, 0.4, line));
  for (const [x, y, d] of [[-8.6, -1, -1], [-8, 3.4, -1], [8.6, 0.4, 1], [8, 4.4, 1]]) {
    const wv = walk ? Math.sin(TAU * q * 2 - 1 + y) * 0.5 : 0;
    body.push(...stroke([[bx + x, by + y], [bx + x + d * 1.4, by + y + 0.6 + wv], [bx + x + d * 2, by + y + 1.6 + wv]], 0.45, rootD));
  }
  body.push(F(E(bx - 3.6, by - 5, 2.4, 1.3, mix(root, '#ffffff', 0.45))));
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
  else body.push(...eye(eyeF[0], eyeF[1], { ...me, ...act, s: -1, w: 2.3, h: 2.6, irisW: 0.68 }), ...eye(eyeN[0], eyeN[1], { ...me, ...act, s: 1, w: 2.6, h: 2.9, irisW: 0.68 }));
  const [ba, bu] = hot && !A ? [36, -0.8] : A && A.mouth > 0 ? [30, -0.6] : { idle: [-16, 0.4], angry: [36, -0.8], hurt: [-30, 0.6], happy: [-12, 0.8], blink: [-12, 0.2], dead: [-22, 0.2] }[mood];
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
  body.push(...limb([bx + 6.4, by - 0.6], hand1, 2.4, 1.8, root), ...fingers(hand1, 1, root));
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
  { hand: [9, 2], tip: [14.2, 6], roll: 7, step: 3.4, up: 0, smear: 0.6, imp: 1, cap: 1.4 },
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
  const skin = '#a6dc8a';
  const skinD = '#8bc571';
  const skinL = '#c8eeb0';
  const cap = '#ff6f6f';
  const capL = '#ff9a8f';
  const gill = '#f6dcc0';
  const cloth = '#c8996a';
  const wood = '#cf9a64';
  const woodD = '#a8764c';
  const out = [];
  // A bow-legged swagger: a bouncy step, the shoulders rolling side to side.
  const DUTY = 0.55;
  const bob = dead ? 2.2 : walk ? 0.8 * Math.cos(2 * TAU * (q - 0.07)) + 0.1 : A ? [0.8, -0.4, 1.4, 0.2][f] : Math.sin(p) * 0.35;
  const roll = dead ? 0 : walk ? 2.6 * Math.sin(TAU * q) + 1 * Math.sin(2 * TAU * q - 1.2) : A ? A.roll : 1.4 * Math.sin(p - 0.5);
  const rx = hurt ? -1.2 : 0;
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
    const kn = [(hip[0] + fx) / 2 + 1.6 + up * 0.3, (hip[1] + fy) / 2 - 0.2];
    const toe = walk && up > 0.5 ? -0.5 : 0;
    return [...limb(hip, kn, 3, 2.7, c), ...limb(kn, [fx, fy - 1.4], 2.7, 2.6, c), E(fx + 1.2, fy - 0.2 + toe, 2.8, 1.3, c), F(E(fx + 2.8, fy - 0.6 + toe, 0.5, 0.4, shade(c, -10)))];
  };
  const back = [...leg(bx - 3, 0.5, false)];
  const body = [];
  // Far arm swinging opposite the near leg.
  const swing = walk ? Math.cos(TAU * q) * 2.4 : idle ? Math.sin(p) * 0.5 : A ? [-2, 2, 1.6, 0.6][f] : 0;
  const farHand = dead ? [bx - 8, by + 6] : [bx - 6.6 + swing, by + 3 - Math.abs(swing) * 0.3];
  body.push(...limb([bx - 4.6, by - 3.4], farHand, 2.6, 2.2, skinD), E(farHand[0], farHand[1], 1.6, 1.5, skinD));

  // Pot belly with a lighter tummy and a strap; it jiggles a beat after each step.
  const jig = walk ? 0.35 * Math.cos(2 * TAU * q - 1.6) : idle ? Math.sin(p) * 0.3 : 0;
  body.push(E(bx, by, 6.8 + jig * 0.3, 6 - jig * 0.3, skin), E(bx + 1.6, by + 1 + jig * 0.3, 4 + jig * 0.3, 4, skinL), F(E(bx + 2.2, by + 1.6 + jig * 0.3, 0.35, 0.35, skinD)));
  body.push(...stroke([[bx - 4.4, by - 4.6], [bx + 1, by + 0.4], [bx + 5.4, by + 3.4]], 1.3, '#8a6a4e', false), F(E(bx - 0.4, by - 1, 0.9, 0.7, '#ffe08a')),
    ...stroke([[bx - 4.4, by - 4.6], [bx + 1, by + 0.4], [bx + 5.4, by + 3.4]], 0.25, '#b08a66'));
  const front = [...leg(bx + 3, 0, true)];
  // Loincloth flapping a beat behind.
  const cs = walk ? Math.sin(TAU * q * 2 - 2) * 1 - 0.4 : A ? [1, -1.4, -0.6, 0.4][f] : Math.sin(p - 1) * 0.4;
  const cloth1 = [T([[bx - 6.2, by + 3.4], [bx + 6.4, by + 3.2], [bx + 5.2, by + 7.6 + cs * 0.3], [bx + 3.6 + cs, by + 9.4], [bx + 1.8 + cs, by + 8.4], [bx - 0.2 + cs, by + 9.6], [bx - 2.4 + cs, by + 8.4], [bx - 4.6 + cs, by + 9.2], [bx - 5.8, by + 7]], cloth)];
  cloth1.push(F(R(bx - 1.2 + cs * 0.4, by + 5.6, 2.4, 2, shade(cloth, 8))), ...stroke([[bx - 1.2 + cs * 0.4, by + 5.6], [bx + 1.2 + cs * 0.4, by + 7.6]], 0.3, shade(cloth, -16)));
  cloth1.push(...stroke([[bx - 6.6, by + 3], [bx, by + 3.8], [bx + 6.6, by + 2.8]], 1.2, '#8a6a4e', false), F(E(bx + 3.4, by + 3.5, 0.9, 0.8, '#ffe08a')));

  // Head, bobbing a beat behind the body.
  const head = [];
  const nod = walk ? Math.sin(2 * TAU * q - 2) * 0.5 : idle ? Math.sin(p - 0.6) * 0.3 : 0;
  const hx = 19 + rx * 1.2;
  const hy = 21.6 + bob * 0.8 + nod + (dead ? 1.4 : 0);
  // Long pointy ears out from under the cap, flopping a beat later still; idle, one flicks.
  const esw = walk ? Math.sin(2 * TAU * q - 2.8) * 1.3 : A ? [-1.6, 2, 2.4, 0.4][f] : idle ? -1.6 * bump(q, 0.67, 0.22) + Math.sin(p) * 0.3 : 0;
  const ed = dead ? 4 : hurt ? 2 : angry ? -1.6 : 0;
  head.push(T([[hx - 5.8, hy - 2.8], [hx - 14.6, hy - 5.4 + esw * 0.7 + ed], [hx - 6, hy + 2]], skinD), F(T([[hx - 6.4, hy - 1.6], [hx - 12.4, hy - 4.4 + esw * 0.7 + ed], [hx - 6.6, hy + 0.8]], '#ffb8c0')));
  head.push(E(hx, hy, 7.8, 6.8, skin));
  head.push(T([[hx + 5.6, hy - 2.8], [hx + 13.4, hy - 6.2 + esw + ed], [hx + 6.6, hy + 1.6]], skin), F(T([[hx + 6.2, hy - 1.8], [hx + 11.4, hy - 5 + esw + ed], [hx + 6.6, hy + 0.4]], '#ffb8c0')));
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
  else head.push(...eye(eyeF[0], eyeF[1], { ...ge, ...actF, s: -1, w: 2.1, h: 2.4 }), ...eye(eyeN[0], eyeN[1], { ...ge, ...actN, s: 1, w: 2.5, h: 2.6 }));
  // Bushy brows: one cocked, one low (scheming); crashing down; jumping up in shock.
  const bc = '#3f6a30';
  const [af, uf, an, un] = { idle: [-14, 0.9, 16, -0.2], angry: [34, -0.9, 34, -1], hurt: [-26, 1.3, -10, 0.3], happy: [-10, 0.8, -10, 0.8], blink: [-6, 0.3, 10, 0], dead: [-18, 0.4, -18, 0.4] }[mood];
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
  const capLag = walk ? Math.sin(2 * TAU * q - 2.6) * 0.5 : A ? A.cap : idle ? Math.sin(p - 1.2) * 0.25 : 0;
  const tilt = dead ? 3 : hurt ? -1.4 : capLag * 0.8;
  const cx = hx + (dead ? 2.4 : 0);
  const cy = hy - 6.4 + (hurt ? -1.8 : 0) + (dead ? 1.4 : 0) + capLag;
  head.push(C(E(cx, cy + 0.4, 12.6, 2.1, gill)));
  for (let i = -5; i <= 5; i++) head.push(...stroke([[cx + i * 1, cy - 0.4], [cx + i * 2.1, cy + 1.6]], 0.3, shade(gill, -14)));
  const domePts = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI + (i / 16) * Math.PI;
    domePts.push([cx + Math.cos(a) * 13.6, cy + Math.sin(a) * 12.4 * (0.85 + 0.15 * Math.abs(Math.cos(a))) + Math.cos(a) * tilt]);
  }
  head.push(T(domePts, cap), F(E(cx - 4.6, cy - 7.8 - tilt * 0.4, 3.8, 1.8, capL)));
  for (const [x, y, r] of [[-7.4, -3.8, 2.1], [-1.4, -8.6, 2.6], [5, -5.6, 2], [9.8, -2.2, 1.4], [0.6, -2.8, 1.2], [-10.6, -1.3, 1], [-5, -9.4, 0.9]]) {
    head.push(F(E(cx + x, cy + y - (x / 14.6) * tilt, r, r * 0.86, '#fff6ea')), F(E(cx + x + r * 0.3, cy + y - (x / 14.6) * tilt + r * 0.35, r * 0.45, r * 0.3, '#f0e2d0')));
  }
  if (angry) head.push(...stroke([[cx + 12, cy - 12], [cx + 13.2, cy - 13.4]], 0.5, '#ff5a5a'), ...stroke([[cx + 13.6, cy - 10.6], [cx + 15.4, cy - 11]], 0.5, '#ff5a5a'));

  // Near arm and the club: bouncing on the shoulder, tapped idly, raised when angry, swung in
  // the attack, dropped when dead.
  const club = [];
  const sh = [bx + 4.4, by - 3.4];
  let hand;
  let tip;
  if (dead) {
    hand = [bx + 8, by + 6];
    tip = [bx + 17.4, by + 5.6];
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
  const dx = tip[0] - hand[0];
  const dy = tip[1] - hand[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const at = (t) => [hand[0] + dx * t, hand[1] + dy * t];
  if (A && A.smear) {
    // A pale swoosh trailing the club head through its arc.
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const a = (-150 + i * (A.imp ? 33 : 20)) * D2R;
      pts.push([bx + 4 + Math.cos(a) * 14.6, by - 6 + Math.sin(a) * 14.6]);
    }
    club.push(...stroke(pts.slice(A.imp ? 2 : 0, A.imp ? 6 : 6), 2.6 * A.smear, '#fff4dc'), ...stroke(pts.slice(A.imp ? 3 : 1, A.imp ? 6 : 6), 1.2, '#ffe0b0'));
  }
  club.push(...limb(at(-0.18), at(0.62), 1.6, 2.6, wood), O(tip[0] - ux * 2.2, tip[1] - uy * 2.2, 4.4, 3.9, Math.atan2(dy, dx) / D2R, wood), E(tip[0] - ux * 3.4 + uy * 2.6, tip[1] - uy * 3.4 - ux * 2.6, 1.6, 1.6, wood), E(tip[0] - ux * 0.4 - uy * 2.4, tip[1] - uy * 0.4 + ux * 2.4, 1.4, 1.4, wood),
    F(E(tip[0] - ux * 2.4 - uy * 1.4, tip[1] - uy * 2.4 + ux * 1.4, 0.9, 0.7, woodD)), F(E(tip[0] - ux * 0.6 + uy * 1.2, tip[1] - uy * 0.6 - ux * 1.2, 0.7, 0.55, woodD)),
    F(E(tip[0] - ux * 1.2 - uy * 0.6, tip[1] - uy * 1.2 + ux * 0.6, 1.4, 1, mix(wood, '#ffffff', 0.3))));
  for (const t of [0.12, 0.24]) club.push(...stroke([[at(t)[0] - uy * 1, at(t)[1] + ux * 1], [at(t)[0] + uy * 1, at(t)[1] - ux * 1]], 0.5, '#8a6a4e'));
  club.push(...limb(sh, hand, 2.8, 2.4, skin), E(hand[0], hand[1], 1.8, 1.7, skin), F(E(hand[0] + 0.6, hand[1] - 0.6, 0.6, 0.5, skinL)));

  // The upper body rolls about the hips; legs stay planted.
  const pivot = [bx, by + 6];
  out.push(...back, ...spin(body, pivot[0], pivot[1], roll), ...front, ...spin([...cloth1, ...head, ...club], pivot[0], pivot[1], roll));
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
  const fur = '#dccdf0';
  const furD = '#c4b2e0';
  const cream = '#f6f0ff';
  const earIn = '#ffb3cc';
  const ant = '#f6dcb4';
  const antD = '#dcb98e';
  const hop = walk ? HOP[f] : A ?? { lift: 0, squash: Math.sin(p) * 0.35, hind: 0, reach: 0, ear: 0, tilt: 0 };
  const out = [];
  // The world lifts a bounder through the air, so the sprite keeps only a little of the arc.
  const L = dead ? -2 : hop.lift * 0.7;
  const rx = (hurt ? -1.4 : 0) + (A ? A.b : 0);
  const bx = 17 + rx;
  const by = 26.4 - L + hop.squash * 0.6;

  // Cotton tail, flicking.
  const tw = walk ? -hop.ear * 0.6 : idle ? -bump(q, 0.17, 0.2) * 1 : A ? -hop.ear * 0.4 : 0;
  out.push(E(bx - 9.6, by - 2.6 + tw, 2.8, 2.6, '#ffffff'), E(bx - 11, by - 3.6 + tw * 1.3, 1.6, 1.5, '#ffffff'), E(bx - 10.8, by - 1.2 + tw, 1.5, 1.4, '#ffffff'));
  // Far legs (darker).
  const hindFoot = (near) => {
    const k = hop.hind;
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
    out.push(...limb([bx - 6, by + 2.6], [fx + 2, fy - 1.2], 3, 2.4, furD), O(fx + 2.6, fy, 3.6, 1.3, a, furD));
    const [s, h] = front(false);
    out.push(...limb(s, h, 2.2, 1.8, furD), E(h[0] + 0.5, h[1] - 0.2, 1.5, 1, furD));
  }
  // Body: haunch, barrel, cream chest fluff, stretching in the air and bunching on landing.
  const sq = hop.squash;
  out.push(E(bx, by, 9.6 - sq * 0.5, 6.4 + sq * 0.4, fur), E(bx - 4.6, by + 1.2, 5.6 - sq * 0.2, 5.4 + sq * 0.3, fur), F(E(bx - 6, by - 2, 2.4, 1.2, mix(fur, '#ffffff', 0.35))));
  out.push(...stroke([[bx - 7.6, by + 3.2], [bx - 4, by + 5.4], [bx - 0.6, by + 4.6]], 0.4, furD));
  out.push(E(bx + 6.2, by + 1.6, 3.8, 4.2, cream));
  for (const [x, y] of [[bx + 4.4, by + 5.2], [bx + 6.6, by + 5.6]]) out.push(T([[x - 1.2, y - 1], [x + 1.2, y - 1], [x + 0.3, y + 1.3]], cream));
  out.push(...stroke([[bx + 4.4, by - 0.6], [bx + 5.2, by + 0.4], [bx + 6, by - 0.4]], 0.3, shade(cream, -12)));
  {
    const [fx, fy, a] = hindFoot(true);
    out.push(...limb([bx - 3.6, by + 3.4], [fx + 2, fy - 1.2], 3.2, 2.4, fur), O(fx + 2.8, fy, 4, 1.4, a, fur), F(E(fx + 5.4 - a / 30, fy + 0.2 + a / 40, 0.5, 0.4, furD)));
    const [s, h] = front(true);
    out.push(...limb(s, h, 2.4, 2, fur), E(h[0] + 0.6, h[1] - 0.2, 1.7, 1.1, cream));
  }

  // Head, tilting with the bound (nose up on the push, down on landing); idle, it perks up and
  // looks about.
  const head = [];
  const perk = idle ? bump(q, 0.5, 0.34) : 0;
  const hx = 27.4 + rx * (A ? 0 : 1.1) + (A ? A.hx : 0) + (dead ? -1 : 0);
  const hy = 17 - L + (walk ? hop.tilt * 0.6 : 0) + (idle ? Math.sin(p - 0.7) * 0.3 - perk * 0.8 : 0) + (dead ? 3 : 0) + (hurt ? -0.4 : 0) + (A ? hop.squash * 0.5 : 0);
  // Ears: long, swept back on the rise, flopping forward on landing; flat when angry, limp when
  // dead; idle, the near one swivels to listen.
  const eb = walk || A ? hop.ear : 0;
  const swivel = idle ? bump(q, 0.67, 0.25) : 0;
  const flat = angry ? 1 : hurt ? 0.8 : happy ? -0.3 : 0;
  const earTip = (bx0, by0, len, a0) => {
    const a = (dead ? a0 - 34 : a0 - eb * 12 - flat * 32) * D2R;
    return [bx0 + Math.cos(a) * len, by0 + Math.sin(a) * len];
  };
  const farB = [hx - 3.2, hy - 4.4];
  const farT = earTip(farB[0], farB[1], 10.4, -146 + perk * 10);
  head.push(seg(farB, farT, 2.3, furD), seg([farB[0] * 0.85 + farT[0] * 0.15, farB[1] * 0.85 + farT[1] * 0.15], farT, 1.2, shade(earIn, -8)));
  // Antlers (behind the near ear, in front of the far one): branching tines, a clover tied on.
  const antler = (x, y, c, k, g = 0) => {
    const qq = (dx, dy) => [x + dx * k, y + dy * Math.abs(k)];
    return [...limb(qq(0, 0), qq(1.4, -6.2), 2.2 + g, 1.8 + g, c), ...limb(qq(1.4, -6.2), qq(0.6, -12.6), 1.8 + g, 1.2 + g, c),
      ...limb(qq(0.7, -3.4), qq(-2.8, -6.4), 1.5 + g, 1.1 + g, c), ...limb(qq(1.3, -6.6), qq(5.6, -9.4), 1.5 + g, 1.1 + g, c),
      ...limb(qq(0.9, -10), qq(-1.8, -12.4), 1.2 + g, 0.9 + g, c)];
  };
  const antlers = (x, y, c, k) => [...antler(x, y, mix(shade(c, -14), '#a07a8a', 0.25), k, 0.4), ...antler(x, y, c, k),
    F(E(x + 0.2 * k, y - 4.4 * Math.abs(k), 0.35, 1.4, mix(c, '#ffffff', 0.55)))];
  head.push(...antlers(hx - 1.4, hy - 5.2, antD, -0.9));
  head.push(E(hx, hy, 7.6, 6.7, fur));
  head.push(...antlers(hx + 1.8, hy - 5.6, ant, 1.12));
  if (!dead) {
    const cx = hx + 8;
    const cy = hy - 13.4;
    head.push(...stroke([[cx - 0.2, cy + 0.6], [cx + 0.6, cy + 2.6]], 0.35, '#5fae5c'));
    for (const a of [-90, 30, 150]) head.push(F(E(cx + Math.cos(a * D2R) * 0.9, cy + Math.sin(a * D2R) * 0.9, 0.8, 0.8, '#7fcf73')));
    head.push(F(E(cx, cy, 0.35, 0.35, '#b5e8a2')));
  }
  const nearB = [hx + 0.4, hy - 5];
  const nearT = earTip(nearB[0], nearB[1], 11.4 - swivel * 1.4, -136 + swivel * 18 + perk * 6);
  head.push(seg(nearB, nearT, 2.6 - swivel * 0.3, fur), seg([nearB[0] * 0.8 + nearT[0] * 0.2, nearB[1] * 0.8 + nearT[1] * 0.2], nearT, 1.4 - swivel * 0.4, earIn));
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
  else head.push(...eye(hx + 6.5, ey - 0.3, { ...je, ...act, s: 1, w: 0.6, h: 2, ring: null, rim: 0.3, shine: 0.6, glint: false }), ...eye(hx + 2.2, ey, { ...je, ...act, s: 1, w: 2.5, h: 2.9 }));
  const [ba, bu] = { idle: [-14, 0.5 + perk * 0.4], angry: [36, -0.9], hurt: [-30, 0.6], happy: [-10, 0.6], blink: [0, 0], dead: [-20, 0.3] }[mood];
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
  const rot = A ? A.rot : walk ? hop.tilt * 3 : idle ? -perk * 4 : 0;
  out.push(...spin(head, hx - 3, hy + 5, rot));
  if (A && f === 1) for (const [y, l] of [[-2, 3.4], [1.6, 5], [5, 3]]) out.push(...stroke([[bx - 11.4 - l, by + y], [bx - 11.4, by + y]], 0.55, '#ffffff'));
  if (A && A.imp) {
    const { x: ix, y: iy } = spin([E(hx + 3, hy - 15, 0, 0, ant)], hx - 3, hy + 5, rot)[0];
    out.push(...star(Math.min(ix + 1, 37), iy, 3, '#fff2a8'), ...star(Math.min(ix - 1, 36), iy + 5, 1.6, '#ffd0e0'));
  }
  return { w: 40, h: 42, res: 3, shapes: out.map((q2) => ({ ...q2, y: q2.y + 6 })) };
}

export const ART = {
  puffle: { walk: 8, idle: 6, attack: 4, stride: 22, draw: kitsune },
  snailbun: { walk: 8, idle: 6, attack: 4, stride: 12, draw: tortoise },
  sproutling: { walk: 8, idle: 6, attack: 4, stride: 13, draw: mandrake },
  mushkin: { walk: 8, idle: 6, attack: 4, stride: 18, draw: goblin },
  piglet: { walk: 8, idle: 6, attack: 4, stride: 50, draw: jackalope },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  puffle: { name: 'Kitsune Kit', w: 22, h: 20 },
  snailbun: { name: 'Moss Tortoise', w: 32, h: 22 },
  sproutling: { name: 'Mandrake', w: 18, h: 28 },
  mushkin: { name: 'Toadstool Goblin', w: 24, h: 34 },
  piglet: { name: 'Jackalope', w: 26, h: 24 },
};
