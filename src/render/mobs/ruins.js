// Monster art: Twilight Ruins (the will-o'-wisp, the imp and the dullahan are live rigs of their own
// since 2026-11-20: a lantern wisp, an ember imp, a kitten driving an empty suit of armour) and
// Crystal Cave (the gem mimic a treasure-chest rig of its own; a crystal golem, a wraith). Every
// design faces right with its feet (or its floating hem) on the
// bottom edge, and is built back to front from layered shapes with hand-placed shading.

import { E, T, F, mix, arc, stroke } from './kit.js';
import { walkBob } from '../animator.js';
import { kittenArmourRig, kittenArmourStill } from './kittenarmourrig.js';
import { lanternWispRig, lanternWispStill } from './lanternwisprig.js';
import { emberImpRig, emberImpStill } from './emberimprig.js';
import { treasureMimicRig, treasureMimicStill } from './treasuremimicrig.js';
import { glowEye, brow, mouth, deadEye, starPts, ovalPts } from './faces.js';

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

// ---------- Limb helpers (the Ruins and Crystal Cave walkers) ----------

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

// ---------- Gems (the Crystal Golem's crystals) ----------

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
    const gl = [[18.6, 11], [24.4, 4.6], [30.6, 9.4], [57.6, 13.6], [51.8, 17.4], [44.6, 12.2], [24.4, 4.6], [57.6, 13.6]][Math.floor(frame) % 8];
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
  // (Remade 2026-11-20 as live rigs: the Lantern Wisp, the Ember Imp, the Treasure Mimic.)
  wisp: { pad: 8, walk: 8, idle: 6, attack: 4, stride: 34, atkMs: [50, 200, 150], draw: lanternWispStill, rig: lanternWispRig },
  gloombat: { pad: 7, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [40, 180, 130], draw: emberImpStill, rig: emberImpRig },
  // (Remade 2026-11-20 as the Kitten in the Armour: a live rig.)
  boneknight: { pad: 17, walk: 8, idle: 6, attack: 4, stride: 24, atkMs: [60, 270, 200], draw: kittenArmourStill, rig: kittenArmourRig },
  crystalslime: { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [55, 240, 170], draw: treasureMimicStill, rig: treasureMimicRig },
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
