// The Ghost Maid concept A's body (2026-11-26, Lacey the moon-jelly parlourmaid): a copy of the
// tentacle base (blanktentacle.js), its jellyfish only, kept here so the base itself stays clean (the
// player: "never edit the bases just copy the base and edit that"). What this copy adds: a dress,
// `look`, for a monster on it (dressedJelly(look)):
//   look.P      its own shape over the jellyfish's (bell, rim, sink, fringe, oral, fine, hz, cycle ...)
//   look.C      its own colours over the base's (lt, base, sh, deep); look.CO the oral arms', look.CF
//               the fine tentacles', look.CR the fringe's, each over look.C
//   look.ink    its own soft outline (never near-black)
//   look.paint  (ctx, a, sk, K) its own markings on the bell, clipped to it
//   look.face   (ctx, a, sk, K) its own face (the base's guide lines are gone); K.bellFrame puts the
//               canvas in the bell's own frame
//   look.over / look.under  { part: (ctx, a, mode, K) } over / under a part, in both passes (mode
//               'line': its outline, 'fill': itself); parts fineFar, oralFar, oralNear, fineNear,
//               fringe, bell
//   look.moves  its own moves over the base's; look.pick (m, a, st) which one an attack plays
//   look.pose   (m, a, out, K, mv, mt) its own act on the channels (d1..d9 are the dress's own)
//   look.goals  (kind 'oral'|'fine', j, n, S, { hang, prof, t, beta, a }) its own shapes for an arm:
//               [[angles (one a segment, in the world), weight], ...], blended with the base's
//   look.spot   (sk, what) its own place for an effect (else the base's)
//   look.pin    (key 'jOral'|'jFine', j, n, a) per segment, how much an arm is held to its shape each
//               240th of a second (0: free), or nothing
//   look.moveStiff  how much stiffer the arms' springs are while a move plays (the base: 3)
//   look.fx     (ctx, m, a, K) live extras over everything
// The base's own notes follow (the octopus and the starfish are left out of this copy).
//
// (base) The tentacle base (2026-11-25, the player: "more bases ... sea critters"): soft sea critters made
// (base) for themselves from the start, nothing carried over from any other base; only the engine is
// (base) shared (rig.js's springs and the live two-pass drawing). A plain lilac mannequin to design on,
// (base) never a finished character: no face but a soft eye line, no markings, no suckers. Drawn live:
// (base) one smooth shape over its bones, outlined only on its outer edge (every part's outline first,
// (base) then every part's fill over it, so a line only survives where nothing covers it), in a soft
// (base) lilac ink, never near-black.
// (base) 
// (base) The arms (all three): a chain of segments each, every segment's angle on its own damped spring
// (base) that follows the segment before it (so a turn at the root runs down the arm as a wave and the tip
// (base) trails, overshoots and settles), pushed by the body's own speeding up and slowing down; the width
// (base) tapers to a round tip, the length never changes (volume kept). An arm on the ground is laid
// (base) exactly along a guide (see `stanceJoints`), so the part touching the floor never slides.
// (base) 
// (base) Presets (units: game px at scale 1, x forward, y down, 0 on the floor):
// (base)   octopus    a big round mantle (its own soft hinge, trailing the body; breathing by its shape:
// (base)              narrower and taller as it squeezes, rounder as it fills) over a short crown with
// (base)              eight thick tapering arms, four near and four far: each comes out from under the
// (base)              head, down and out to the floor, lies along it a little, and its tip curls up. It
// (base)              creeps on its arms: each lifts in turn (a rolling wave front to back), peels up,
// (base)              curls, reaches out and lays itself down again, its phase from the distance walked.
// (base)              Jetting, its mantle squeezes and the arms stream behind in a bundle.
// (base)   jellyfish  a round bell (built from bones: rim tips, shoulders, crown and the hollow under it)
// (base)              over a frilly fringe, four soft oral arms from the middle and six fine trailing
// (base)              tentacles from the rim. It floats (`fly: true`): the bell pulses (a quick squeeze
// (base)              that lifts it, a slow relax as it drifts back down), faster as it travels, leaning
// (base)              into the way it swims, surging on each stroke; everything under it trails.
// (base)   starfish   five chubby tapering arms round a round middle, one smooth shape with soft webbed
// (base)              crotches, seen face on. It stands on two arms and tiptoe-walks (each "leg" arm
// (base)              reaching its tip to a planted spot by bending into a smooth arc), the side arms
// (base)              swaying, the top arm nodding; going fast it cartwheels, rolling without slipping.
// (base)              Its arms take their roles from where they point, so any fifth of a turn is the same
// (base)              star again (it lands every roll and flip on whichever arms are down).
// (base) Moves (TENTACLE_MOVES[kind]): octopus: slap (an arm cocked high, whipped down), grab (the front
// (base) arms coil round a point in front and squeeze), ink (fills up, then a soft puff of ink); jellyfish:
// (base) sting (the tentacles flicked forward, little sparks), slap (the oral arms swung), grab (arms and
// (base) tentacles coiled round a point); starfish: slap (the front arm), grab (top and front arms hug a
// (base) point), spin (a hop and a double spin, like a throwing star); all: jump, dash (octopus: a jet;
// (base) jellyfish: two hard strokes; starfish: a cartwheel), dodge, hurt, knockdown, and a pleased act
// (base) (stretch / bloom / cheer). Poses (m.pose): rest (settled flat), curl (curled up), sleep; a nap
// (base) habit sleeps too.
// (base) m.def.moves picks the attack pool (cycled), m.act = { name, at } plays any move by name.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { hold } from '../mobs/kidrig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6', guide: '#cfc6e2', nose: '#8f84ab', mouth: '#7d7299' };
// (the outline: a soft deeper lilac, never near-black)
const INK = '#7f6982'; // (the bases' shared soft ink, as the deertaur's)
const ease = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const mix = (a, b, u) => a + (b - a) * u;
const turn = ([x, y], r) => {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const less = (p, q) => [p[0] - q[0], p[1] - q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const mixP = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];
const unit = (an) => [Math.cos(an), Math.sin(an)];
const wrapPi = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const rgbOf = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rand = (n, seed) => {
  const q = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
  return q - Math.floor(q);
};

// ---------- Curves ----------
// (one point of a smooth curve through p1..p2, p0 and p3 steering it)
function spline(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
  return [f(0), f(1)];
}
// A closed smooth loop through points, `per` points to each span.
function loopCurve(pts, per) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < per; j++) out.push(spline(pts[(i + n - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n], j / per));
  return out;
}
// An open smooth line through points (its ends carried straight on).
function lineCurve(pts, per) {
  const n = pts.length;
  if (n < 2) return pts.slice();
  const P = [less(times(pts[0], 2), pts[1]), ...pts, less(times(pts[n - 1], 2), pts[n - 2])];
  const out = [];
  for (let i = 1; i < n; i++) for (let j = 0; j < per; j++) out.push(spline(P[i - 1], P[i], P[i + 1], P[i + 2], j / per));
  out.push(pts[n - 1]);
  return out;
}
function bezPts(p0, p1, p2, p3, n) {
  const out = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}
const polyLen = (pts) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return s;
};

// ---------- Chains ----------
// n + 1 joints a segment apart, laid along a guide line by its length (carried straight on past
// its end): the arm keeps its length whatever shape the guide takes.
function layAlong(guide, n, seg) {
  const out = [guide[0]];
  let at = guide[0];
  let i = 1;
  let left = seg;
  while (out.length <= n) {
    if (i >= guide.length) {
      const a = guide[guide.length - 2] ?? guide[0];
      const b = guide[guide.length - 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      at = plus(at, times(less(b, a), left / l));
      out.push(at);
      left = seg;
      continue;
    }
    const q = guide[i];
    const d = Math.hypot(q[0] - at[0], q[1] - at[1]);
    if (d >= left && d > 0) {
      at = mixP(at, q, left / d);
      out.push(at);
      left = seg;
    } else {
      left -= d;
      at = q;
      i++;
    }
  }
  return out;
}
// Each segment's angle (kept continuous: a curl can turn more than once).
function anglesOf(J) {
  const out = [];
  for (let i = 0; i < J.length - 1; i++) {
    let an = Math.atan2(J[i + 1][1] - J[i][1], J[i + 1][0] - J[i][0]);
    if (i) an = out[i - 1] + wrapPi(an - out[i - 1]);
    out.push(an);
  }
  return out;
}
function jointsOf(root, angs, seg) {
  const J = [root];
  for (const an of angs) J.push(plus(J[J.length - 1], [Math.cos(an) * seg, Math.sin(an) * seg]));
  return J;
}
// A list of angles turned whole turns so its root is near `ref`.
const alignTo = (list, ref) => {
  const k = Math.round((ref - list[0]) / TAU);
  return k ? list.map((v) => v + k * TAU) : list;
};
// Several shapes for one arm blended by weight, angle by angle (so the arm keeps its length).
function blendShapes(entries) {
  let tot = 0;
  let ref = null;
  const out = [];
  for (const [L, w] of entries) {
    if (!(w > 1e-4)) continue;
    const A = ref === null ? L : alignTo(L, ref);
    if (ref === null) ref = L[0];
    for (let i = 0; i < A.length; i++) out[i] = (out[i] ?? 0) + A[i] * w;
    tot += w;
  }
  return out.map((v) => v / tot);
}
// The springs along an arm: segment 0 follows its goal, every other one the segment before it plus
// its own bend, softer toward the tip, so a turn runs down the arm as a wave; the body's speeding up
// and slowing down pushes each one. `pin` holds segments exactly on their goal (an arm on the floor).
function chainOf(mem, goal, dt, o) {
  const n = goal.length;
  if (mem.length !== n || !(dt > 0) || !Number.isFinite(mem[0].x)) {
    mem.length = 0;
    for (const g of goal) mem.push({ x: g, v: 0 });
    return goal.slice();
  }
  const k0 = Math.round((goal[0] - mem[0].x) / TAU);
  if (k0) for (const s of mem) s.x += k0 * TAU;
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  const [ax, ay] = o.push ?? [0, 0];
  const mx = o.max ?? 1.4;
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const f = n > 1 ? i / (n - 1) : 0;
      // (each follows the one before it, held partly to its own goal so a long arm still arrives)
      const tgt = i ? mix(mem[i - 1].x + (goal[i] - goal[i - 1]), goal[i], o.anchor ?? 0.3) : goal[0];
      const sp = mem[i];
      const kk = mix(o.k[0], o.k[1], f);
      const cc = mix(o.c[0], o.c[1], f);
      const push = (o.gain ?? 0) * (Math.sin(sp.x) * ax - Math.cos(sp.x) * ay) * (0.5 + f);
      sp.v += ((tgt - sp.x) * kk - sp.v * cc + push) * h;
      sp.x += sp.v * h;
      const pin = o.pin ? o.pin[i] : 0;
      if (pin > 0) {
        sp.x = mix(sp.x, goal[i], pin);
        sp.v *= 1 - pin;
      }
      // (the swing limit: a soft stop, a stiff damped spring past it, so a segment never halts in one
      // frame; a hard stop only well beyond it)
      const dev = sp.x - tgt;
      const over = Math.abs(dev) - mx;
      if (over > 0) {
        sp.v -= Math.sign(dev) * (over * 2600 + Math.max(0, sp.v * Math.sign(dev)) * 40) * h;
        if (over > 0.7) {
          sp.x = tgt + Math.sign(dev) * (mx + 0.7);
          sp.v *= 0.5;
        }
      }
    }
  }
  return mem.map((s) => s.x);
}
// Nothing goes through the floor.
const onFloor = (J, W, floor = 0) => {
  for (let i = 0; i < J.length; i++) if (J[i][1] > floor - W[i] / 2) J[i] = [J[i][0], floor - W[i] / 2];
  return J;
};
// How a point of the body moves in the world (smoothed), in the rig's own (maybe mirrored) frame.
function motionAt(st, key, p, m, a) {
  const s = (st[key] ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const sx = a.flip ? -1 : 1;
  const wx = sx * p[0] + (m.x ?? 0);
  const wy = p[1] + (m.y ?? 0);
  if (dt > 0 && s.wx !== undefined && s.flip === a.flip && Math.hypot(wx - s.wx, wy - s.wy) < 30) {
    const f = Math.min(1, dt * 16);
    const vx = mix(s.vx, (wx - s.wx) / dt, f);
    const vy = mix(s.vy, (wy - s.wy) / dt, f);
    s.ax = mix(s.ax, clamp((vx - s.vx) / dt, -1500, 1500), f);
    s.ay = mix(s.ay, clamp((vy - s.vy) / dt, -1500, 1500), f);
    s.vx = vx;
    s.vy = vy;
  } else if (dt > 0 || s.wx === undefined) Object.assign(s, { vx: 0, vy: 0, ax: 0, ay: 0 });
  Object.assign(s, { wx, wy, flip: a.flip });
  return { vx: s.vx * sx, vy: s.vy, ax: s.ax * sx, ay: s.ay };
}

// ---------- Drawing ----------
const flashOf = (a) => Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
const tone = (a, hex, al = 1) => {
  const k = flashOf(a);
  if (k <= 0 && al >= 1) return hex;
  const [r, g, b] = rgbOf(hex);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
const glowAt = (ctx, a, c, r, hex, al) => {
  const gr = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
  gr.addColorStop(0, tone(a, hex, al));
  gr.addColorStop(1, tone(a, hex, 0));
  ctx.fillStyle = gr;
  ctx.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
};
const edge = (ctx, ink = INK) => {
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
};
const polyPath = (ctx, pts) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
// A soft strand: a disc at every point, joined side to side (one shape, round at the tip).
function strandInto(ctx, pts, ws) {
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const r = Math.max(0.12, ws[i] / 2);
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
    if (!i) continue;
    const [x0, y0] = pts[i - 1];
    const r0 = Math.max(0.12, ws[i - 1] / 2);
    const l = Math.hypot(x - x0, y - y0) || 1;
    const nx = -(y - y0) / l;
    const ny = (x - x0) / l;
    ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
    ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
    ctx.lineTo(x - nx * r, y - ny * r);
    ctx.lineTo(x + nx * r, y + ny * r);
    ctx.closePath();
  }
}
// The joints smoothed into a dense line, each point's width eased between its joints'.
function strandPts(J, W, per = 3, wob = null) {
  const pts = lineCurve(J, per);
  const ws = pts.map((_, i) => {
    const f = i / per;
    const j = Math.min(W.length - 2, Math.floor(f));
    const w = mix(W[j], W[j + 1], f - j);
    return wob ? w * wob(f / (W.length - 1)) : w;
  });
  return [pts, ws];
}
// An arm: outlined, then filled, with a soft shade along its underside and a soft light along its top.
// (its edge: one clean line round it, out along one side, round the tip, back along the other)
function strandEdge(pts, ws) {
  const L = [];
  const R = [];
  for (let i = 0; i < pts.length; i++) {
    const q0 = pts[Math.max(0, i - 1)];
    const q1 = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    const nx = -(q1[1] - q0[1]) / l;
    const ny = (q1[0] - q0[0]) / l;
    const h = ws[i] / 2;
    L.push([pts[i][0] + nx * h, pts[i][1] + ny * h]);
    R.push([pts[i][0] - nx * h, pts[i][1] - ny * h]);
  }
  const e = pts.length - 1;
  const an = Math.atan2(pts[e][1] - pts[e - 1][1], pts[e][0] - pts[e - 1][0]);
  const cap = [];
  for (let k = 1; k < 6; k++) {
    const q = an + Math.PI / 2 - (k * Math.PI) / 6;
    cap.push([pts[e][0] + Math.cos(q) * ws[e] / 2, pts[e][1] + Math.sin(q) * ws[e] / 2]);
  }
  return [...L, ...cap, ...R.reverse()];
}
// An arm: outlined, then filled, with a soft shade along its side away from the light and a soft
// rim just inside its edge where it lies over another arm, so the two still read apart.
function drawStrand(ctx, a, mode, pts, ws, look, beneath = null) {
  ctx.beginPath();
  strandInto(ctx, pts, ws);
  if (mode === 'line') return edge(ctx, look.ink);
  ctx.fillStyle = tone(a, look.fill);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  strandInto(ctx, pts, ws);
  ctx.clip();
  // (each point's side away from the light, up and to the left)
  const away = pts.map((p, i) => {
    const q0 = pts[Math.max(0, i - 1)];
    const q1 = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]) || 1;
    const nx = -(q1[1] - q0[1]) / l;
    const ny = (q1[0] - q0[0]) / l;
    // (eased across, never flipped, as a turning arm brings its other side to the light)
    const k = clamp((nx * 0.45 + ny * 0.9) / 0.35, -1, 1);
    return [nx * k, ny * k];
  });
  // (the shade eased in from the root, so where it grows out of the body there's no band)
  if (look.shade) {
    ctx.beginPath();
    strandInto(ctx, pts.map(([x, y], i) => [x + away[i][0] * ws[i] * 0.36, y + away[i][1] * ws[i] * 0.36]), ws.map((v, i) => v * 0.5 * ease(i / (pts.length * 0.3))));
    ctx.fillStyle = tone(a, look.shade, look.shadeA ?? 0.6);
    ctx.fill();
  }
  // (only where it lies over something drawn before it)
  if (look.rim && beneath?.length) {
    ctx.beginPath();
    for (const [p2, w2] of beneath) strandInto(ctx, p2, w2);
    ctx.clip();
    polyPath(ctx, strandEdge(pts, ws));
    ctx.strokeStyle = tone(a, look.rim);
    ctx.lineWidth = 0.9;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.restore();
}
const BLANK = () => sprite('rig|tentblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));
// A soft guide line (where the eyes go, the middle of the face): faint, never a feature.
const guide = (ctx, a, p0, c, p1, w = 0.45) => {
  ctx.beginPath();
  ctx.moveTo(...p0);
  ctx.quadraticCurveTo(...c, ...p1);
  ctx.strokeStyle = tone(a, C0.guide);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
};
// A wandering glance: held, then turning to the next, every few seconds.
const glance = (t, seed) => {
  const blk = Math.floor(t / 5);
  const k = ease(((t / 5) % 1) / 0.18);
  return mix(rand(blk - 1, seed), rand(blk, seed), k) * 2 - 1;
};
// Round an arm into a coil about a point: out from the root to its near side, then round it
// (over the top clockwise, or under it the other way), tightening.
function coilGuide(R, a0, Pc, r, over) {
  const E0 = [Pc[0], Pc[1] + (over ? -r : r)];
  const d = Math.max(1, Math.hypot(E0[0] - R[0], E0[1] - R[1]));
  const pts = bezPts(R, plus(R, times(unit(a0), d * 0.45)), [E0[0] - d * 0.4, E0[1]], E0, 10);
  const a1 = over ? -Math.PI / 2 : Math.PI / 2;
  const sg = over ? 1 : -1;
  for (let k = 1; k <= 26; k++) {
    const f = k / 26;
    const an = a1 + sg * f * 1.7 * TAU;
    const rr = r * (1 - 0.32 * f);
    pts.push([Pc[0] + Math.cos(an) * rr, Pc[1] + Math.sin(an) * rr]);
  }
  return pts;
}

// ---------- The critters ----------
const JELLYFISH = {
  name: 'Jellyfish',
  speed: 22,
  // the rim's height (floating), how far it sinks settling; the bell's half width and height
  rim: 24,
  sink: 13,
  bell: { w: 13, h: 15 },
  fringe: 6,
  // the four oral arms: [x under the bell, spread (deg), far?]
  oral: { L: 17, n: 8, w0: 3.6, w1: 0.9, at: [[-1.8, 14, true], [1.6, -12, true], [-0.8, 5, false], [0.9, -6, false]] },
  // the six fine tentacles: [place along the rim (-1..1), spread (deg), far?]
  fine: { L: 22, n: 10, w0: 1, w1: 0.45, at: [[-0.86, 12, true], [-0.48, 6, false], [-0.14, 2, true], [0.2, -3, false], [0.54, -7, true], [0.88, -12, false]] },
  // the swim: pulses a second floating, px swum per pulse
  hz: 0.55,
  cycle: 20,
  moves: ['sting', 'grab', 'slap'],
};

// ---------- The moves (keys: [seconds, pose, ease into it]; x, hop in body heights, angles in degrees) ----------
// Channels: pitch (+ leans forward), tilt (octopus: the mantle's own lean; starfish: its lean),
// pump (+ the mantle or bell squeezes, - fills), crouch, raise (up tall, arms up), stream (arms
// trailing in a bundle), splay (arms flung out), slap + whip (an arm cocked at whip 0, struck through
// at 1), grab + squeeze (coiled round a point in front), zap (jellyfish tentacles flicked forward),
// roll (starfish turns, a fifth of a turn is the same star), free (starfish arms loose and straight),
// flat (settled), curl, sleep.
const JELLY_MOVES = {
  sting: {
    anticT: 0.26,
    keys: [
      [0, { pitch: -14, pump: -0.4, zap: -0.4, x: -0.03 }],
      [0.07, { pitch: 16, pump: 1, zap: 1, x: 0.12 }, 'out'],
      [0.22, { pitch: 12, pump: 0.6, zap: 0.9, x: 0.12 }],
      [0.5, { pitch: 3, zap: 0.15, x: 0.05 }, 'io'],
      [0.74, {}],
    ],
    zap: [0.06, 0.34],
    spark: [0.08],
    sparkAt: 'tips',
  },
  slap: {
    anticT: 0.22,
    keys: [
      [0, { pitch: -18, slap: 1, whip: 0, x: -0.03, pump: -0.2 }],
      [0.08, { pitch: 20, slap: 1, whip: 1, x: 0.08, pump: 0.7 }, 'out'],
      [0.36, { pitch: 5, slap: 0, whip: 1, x: 0.04 }, 'io'],
      [0.62, {}],
    ],
    spark: [0.09],
    sparkAt: 'slap',
  },
  grab: {
    anticT: 0.22,
    keys: [
      [0, { pitch: -9, pump: -0.35, splay: 0.3 }],
      [0.14, { grab: 1, pitch: 20, x: 0.1, pump: 0.7 }, 'out'],
      [0.3, { grab: 1, squeeze: 1, pitch: 18, x: 0.1, pump: 0.4 }, 'io'],
      [0.44, { grab: 1, squeeze: 0.25, pitch: 18, x: 0.1 }, 'io'],
      [0.58, { grab: 1, squeeze: 1, pitch: 18, x: 0.1, pump: 0.4 }, 'io'],
      [0.84, { grab: 0, pitch: 4, x: 0.04 }, 'io'],
      [1.04, {}],
    ],
    spark: [0.3, 0.58],
    sparkAt: 'grab',
  },
  jump: {
    anticT: 0.2,
    keys: [
      [0, { pump: -0.45, hop: -0.04 }],
      [0.12, { hop: 0.42, pump: 1, stream: 1 }, 'out'],
      [0.42, { hop: 0.52, pump: -0.35, splay: 0.45, stream: 0 }, 'out'],
      [0.85, { hop: 0.05, pump: 0 }, 'io'],
      [1.05, {}],
    ],
  },
  dash: {
    anticT: 0.12,
    keys: [
      [0, { pitch: -10, pump: -0.35 }],
      [0.06, { x: 0.16, pitch: 68, pump: 1, stream: 1 }, 'out'],
      [0.2, { x: 0.22, pitch: 68, pump: -0.25, stream: 1 }, 'io'],
      [0.27, { x: 0.33, pitch: 68, pump: 1, stream: 1 }, 'out'],
      [0.46, { x: 0.37, pitch: 36, pump: 0, stream: 0.4 }, 'io'],
      [0.78, {}],
    ],
    bubbles: [0.04, 0.5],
  },
  dodge: {
    anticT: 0.06,
    keys: [
      [0, { pitch: 8, pump: -0.3 }],
      [0.1, { x: -0.22, hop: 0.08, pitch: -40, pump: 1, stream: 1 }, 'out'],
      [0.36, { x: -0.26, pitch: -10, pump: 0, stream: 0.2 }, 'io'],
      [0.64, {}],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [[0, {}], [0.05, { x: -0.05, pitch: -24, pump: 0.8, splay: 0.8 }, 'out'], [0.24, { x: -0.05, pitch: -14, pump: 0.3, splay: 0.4 }], [0.6, {}]],
  },
  knockdown: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.12, { x: -0.08, pitch: -100, pump: 0.7, splay: 0.6 }, 'out'],
      [0.5, { x: -0.1, pitch: -140, hop: -0.18, pump: -0.2, splay: 0.2 }, 'io'],
      [1.0, { x: -0.1, pitch: -140, hop: -0.18, pump: -0.15 }],
      [1.42, { x: -0.05, pitch: -16, hop: -0.06, pump: 0.6 }, 'io'],
      [1.75, {}],
    ],
  },
  // Pleased: the bell opens slowly, wide, the arms and tentacles fanning out, then it settles.
  bloom: {
    anticT: 0.15,
    keys: [
      [0, { pump: 0.4 }],
      [0.45, { pump: -0.5, splay: 0.8, lift: 2.4 }, 'io'],
      [0.9, { pump: -0.5, splay: 0.8, lift: 2.4 }],
      [1.35, {}, 'io'],
    ],
  },
};

const CH = ['x', 'hop', 'lift', 'pitch', 'tilt', 'look', 'pump', 'crouch', 'raise', 'stream', 'flat', 'curl', 'sleep', 'splay', 'slap', 'whip', 'grab', 'squeeze', 'roll', 'free', 'zap', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9'];
const zero = () => Object.fromEntries(CH.map((c) => [c, 0]));
const EASES = { out: easeOut, in: (u) => clamp(u, 0, 1) ** 3, io: ease };
const moveLen = (mv) => mv.keys[mv.keys.length - 1][0];
// A move's pose at t (before 0: easing in from the base through its wind-up).
function posed(mv, t, antic, base) {
  if (t < 0) {
    const first = { ...base, ...mv.keys[0][1] };
    const o = {};
    for (const k of Object.keys(base)) o[k] = mix(base[k], first[k], ease(antic));
    return o;
  }
  let i = 0;
  while (i < mv.keys.length - 1 && t >= mv.keys[i + 1][0]) i++;
  const A0 = { ...base, ...mv.keys[i][1] };
  if (i >= mv.keys.length - 1) return A0;
  const [t1, k1, how] = mv.keys[i + 1];
  const B0 = { ...base, ...k1 };
  const u = (EASES[how] ?? ease)((t - mv.keys[i][0]) / Math.max(1e-6, t1 - mv.keys[i][0]));
  const o = {};
  for (const k of Object.keys(A0)) o[k] = mix(A0[k], B0[k], u);
  return o;
}
// (0..1 through `span` seconds after any of the moments, else -1)
const after = (moments, t, span) => {
  let best = -1;
  for (const s of moments ?? []) if (t >= s && t <= s + span) best = (t - s) / span;
  return best;
};

// ---------- The jellyfish ----------
function jellyRig(P, look = {}) {
  const DRESS = look;
  const C = { ...C0, ...(look.C ?? {}) };
  const CO = { ...C, ...(look.CO ?? {}) };
  const CF = { ...C, ...(look.CF ?? {}) };
  const CR = { ...C, ...(look.CR ?? {}) };
  const INKD = look.ink ?? INK;
  const NEAR = { fill: CO.base, shade: CO.sh, shadeA: 0.5, rim: CO.sh, ink: INKD };
  const FAR = { fill: CO.sh, shade: CO.deep, shadeA: 0.4, rim: CO.deep, ink: INKD };
  const B0 = P.bell;
  const OA = P.oral;
  const FT = P.fine;
  const oSeg = OA.L / OA.n;
  const fSeg = FT.L / FT.n;
  const oW = Array.from({ length: OA.n + 1 }, (_, i) => mix(OA.w0, OA.w1, (i / OA.n) ** 0.8));
  const fW = Array.from({ length: FT.n + 1 }, (_, i) => mix(FT.w0, FT.w1, i / FT.n));
  const H = P.rim + B0.h + 1;
  // One pulse: the quick squeeze (the rim sweeping in and down), a slow relax a little past round,
  // back to rest; the lift it gives (up through the squeeze, drifting back down as it relaxes).
  const pulseAt = (ph) => (ph < 0.28 ? easeOut(ph / 0.28) : ph < 0.7 ? mix(1, -0.14, ease((ph - 0.28) / 0.42)) : mix(-0.14, 0, ease((ph - 0.7) / 0.3)));
  const riseAt = (ph) => (ph < 0.06 ? 0 : ph < 0.46 ? easeOut((ph - 0.06) / 0.4) : 1 - ease((ph - 0.46) / 0.54));
  const prof = (nn, a0, bend, tip) => Array.from({ length: nn }, (_, i) => {
    const f = i / (nn - 1);
    return a0 + bend * f + tip * f * f * f;
  });

  function skeleton(S, a, m) {
    const st = a.mo.rig;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const t = a.t + (m.uid % 7) * 1.1;
    const alive = m.hp > 0 ? 1 : 0;
    const flat = clamp(S.flat, 0, 1);
    const sleep = clamp(S.sleep, 0, 1);
    const curl = clamp(S.curl, 0, 1);
    const go = st.tnGo ?? 0;
    // The pulse: its own slow beat floating, quicker the farther it swims.
    const rate = (P.hz * (1 - 0.6 * Math.max(sleep, flat * 0.5)) + ((st.tnV ?? 0) / P.cycle) * go) * alive;
    st.jp = ((st.jp ?? ((m.uid ?? 0) * 0.37) % 1) + rate * dt) % 1;
    const ph = st.jp;
    st.jBusy = mix(st.jBusy ?? 0, st.tnActive ? 1 : 0, Math.min(1, dt * 6));
    const amp = (1 - 0.75 * st.jBusy) * (1 - 0.5 * flat) * alive;
    const p = clamp(S.pump + pulseAt(ph) * amp * 0.9, -0.6, 1.15);
    const rise = riseAt(ph);
    const bob = rise * 2.6 * amp * (1 + go * 0.4);
    const surge = (rise - 0.45) * 2 * go * amp;
    const B = [S.x + surge, -(P.rim - flat * P.sink + S.lift + S.hop + bob)];
    const beta = (S.pitch + go * 14) * D2R;
    const toW = (q) => plus(B, turn(q, beta));
    // The bell from its bones: the rim tips sweep in and down as it squeezes, the dome rising to
    // keep its volume; relaxed, wide and low.
    const wr = B0.w * (1 - 0.26 * p);
    const ws = B0.w * (1.02 - 0.12 * p);
    const hh = B0.h * (1 + 0.17 * p);
    const drop = 2.2 * Math.max(0, p) - 0.6 * Math.max(0, -p);
    const bell = [
      [wr, drop], [ws, -0.42 * hh], [0.62 * ws, -0.86 * hh], [0, -hh], [-0.62 * ws, -0.86 * hh], [-ws, -0.42 * hh], [-wr, drop],
      [-0.74 * wr, -0.03 * hh + drop * 0.5], [0, -0.1 * hh], [0.74 * wr, -0.03 * hh + drop * 0.5],
    ].map(toW);
    const outline = loopCurve(bell, 5);
    const mo = motionAt(st, 'tnB', B, m, a);
    // The fringe: a soft scalloped frill under the rim, trailing a beat behind the bell.
    const fr = (st.jFr ??= { x: 0, v: 0 });
    if (dt > 0) {
      fr.v += (-fr.x * 120 - fr.v * 10 + clamp(mo.ay, -900, 900) * 0.004) * dt;
      fr.x = clamp(fr.x + fr.v * dt, -1.2, 1.6);
    }
    // (one soft band: its top tucked up under the rim, its hem in shallow scallops, a ripple
    // running along it with each pulse)
    const frill = [];
    const lean = clamp(mo.vx * 0.004, -0.8, 0.8);
    const M = 40;
    for (let k = 0; k <= M; k++) {
      const f = k / M;
      const x = mix(-wr, wr, f) * 0.96;
      const sag = Math.sin(Math.PI * f) * 0.45;
      const scal = Math.abs(Math.sin(Math.PI * P.fringe * f)) ** 0.7;
      frill.push(toW([x - lean * f, drop + 0.6 + sag + scal * 1.05 + fr.x * (0.5 + sag) + 0.28 * Math.sin(TAU * ph - f * 7)]));
    }
    for (let k = M; k >= 0; k--) {
      const f = k / M;
      frill.push(toW([mix(-wr, wr, f) * 0.9, drop - 0.9 + Math.sin(Math.PI * f) * 0.3]));
    }
    // Everything hanging under it: down, trailing behind as it swims, tighter as it rises,
    // fanning a little as it relaxes; each pulse sends a ripple down them.
    const trail = clamp(mo.vx * 0.014, -0.9, 0.9);
    const rising = clamp(-mo.vy * 0.02, -1, 1);
    const fan = 1 + 0.6 * Math.max(0, -p) - 0.3 * Math.max(0, p) - 0.3 * Math.max(0, rising);
    const hang = Math.PI / 2;
    const splay = clamp(S.splay, 0, 1);
    const stream = clamp(S.stream, 0, 1);
    const zap = clamp(S.zap, -1, 1);
    const grab = clamp(S.grab, 0, 1);
    const slap = clamp(S.slap, 0, 1);
    const whip = clamp(S.whip, 0, 1);
    const grabP = toW([12, 13]);
    const chainSet = (key, roots, nn, sg, Wl, spreadOf, opts) => roots.map((R, j) => {
      const spread = spreadOf(j) * D2R;
      const a0 = hang + 0.55 * beta + spread * fan;
      const hangL = Array.from({ length: nn }, (_, i) => {
        const f = i / (nn - 1);
        return mix(a0, hang + trail + spread * 0.4, ease(f) * 0.85) + (0.16 * amp * Math.sin(TAU * ph - i * 0.7 + j) + 0.07 * Math.sin(t * 0.7 + j * 1.9 - i * 0.4) * (1 - sleep * 0.5)) * f;
      });
      const streamL = prof(nn, hang + beta + spread * 0.25, 0, 0).map((v, i) => v + 0.1 * Math.sin(t * 8 - i) * (i / nn));
      const splayL = prof(nn, hang + spread * 4 + Math.sign(spread || 1) * 0.3, Math.sign(spread || 1) * 0.6, 0);
      const sgC = spread >= 0 ? 1 : -1;
      const curlL = prof(nn, hang + spread * 2, sgC * 2.4, sgC * 3);
      const extra = opts(R, j, nn, sg);
      let others = stream + splay * (1 - stream * 0.5) + curl + extra.reduce((s, e) => s + e[1], 0);
      const norm = others > 1 ? 1 / others : 1;
      const goal = blendShapes([[hangL, Math.max(0, 1 - others)], [streamL, stream * norm], [splayL, splay * norm * (1 - stream * 0.5)], [curlL, curl * norm], ...extra.map(([L, ww]) => [L, ww * norm])]);
      const mem = ((st[key] ??= [])[j] ??= []);
      // (quicker through a move, so a flick lands on its beat; loose and trailing otherwise)
      const q = st.tnActive ? (DRESS.moveStiff ?? 3) : 1;
      // (the dress may hold an arm closer to its shape for a while: per segment, eased in and out by the dress)
      const pin = DRESS.pin?.(key, j, nn, a) ?? undefined;
      const angs = chainOf(mem, goal, dt, { k: [opts.k[0] * q, opts.k[1] * q], c: [opts.c[0] * Math.sqrt(q), opts.c[1] * Math.sqrt(q)], gain: opts.gain, push: [mo.ax, mo.ay], max: 1.6, anchor: st.tnActive ? 0.45 : 0.2, pin });
      return onFloor(jointsOf(R, angs, sg), Wl);
    });
    const oralRoots = OA.at.map(([x]) => toW([x, -0.12 * hh]));
    const oralOpts = (R, j, nn, sg) => {
      const out = [];
      if (slap > 0) out.push([blendShapes([[prof(nn, hang + 1.0, 0.5, 0.3), 1 - whip], [prof(nn, 0.45, -0.5, -0.6), whip]]), slap]);
      if (grab > 0) out.push([anglesOf(layAlong(coilGuide(R, hang - 0.4, plus(grabP, [0, j * 0.4 - 0.6]), 2.6 + j * 0.45, j % 2 === 0), nn, sg)), grab]);
      // (the dress's own shapes for an arm: [angles, weight] each)
      for (const g of DRESS.goals?.('oral', j, nn, S, { hang, prof, t, beta, a }) ?? []) if (g[1] > 0) out.push(g);
      return out;
    };
    Object.assign(oralOpts, { k: [150, 70], c: [14, 8], gain: 0.05 });
    const oral = chainSet('jOral', oralRoots, OA.n, oSeg, oW, (j) => OA.at[j][1], oralOpts);
    const fineRoots = FT.at.map(([f]) => toW([f * wr * 0.94, drop + 0.6]));
    const fineOpts = (R, j, nn, sg) => {
      const out = [];
      if (zap > 0) out.push([prof(nn, 0.55, -0.7, -0.3), zap]);
      else if (zap < 0) out.push([prof(nn, hang + 0.75, 0.25, 0), -zap]);
      if (grab > 0 && FT.at[j][0] > 0) out.push([anglesOf(layAlong(coilGuide(R, hang - 0.3, grabP, 3.6 + j * 0.3, j % 2 === 1), nn, sg)), grab * 0.8]);
      for (const g of DRESS.goals?.('fine', j, nn, S, { hang, prof, t, beta, a }) ?? []) if (g[1] > 0) out.push(g);
      return out;
    };
    Object.assign(fineOpts, { k: [110, 40], c: [11, 5], gain: 0.07 });
    const fine = chainSet('jFine', fineRoots, FT.n, fSeg, fW, (j) => FT.at[j][1], fineOpts);
    const tips = fine.filter((_, j) => FT.at[j][0] > 0).map((J) => J[J.length - 1]);
    return { B, beta, toW, wr, ws, hh, drop, outline, frill, oral, fine, grabP, tips, look: S.look, slapTip: oral[3][oral[3].length - 1], S };
  }

  function drawFine(ctx, a, mode, far) {
    const sk = a.tk;
    for (const [j, J] of sk.fine.entries()) {
      if (FT.at[j][2] !== far) continue;
      const [pts, ws] = strandPts(J, fW, 2);
      ctx.beginPath();
      strandInto(ctx, pts, ws);
      ctx.fillStyle = tone(a, far ? CF.sh : CF.deep);
      ctx.fill();
    }
  }
  function drawOral(ctx, a, mode, far) {
    const sk = a.tk;
    const t = a.t;
    for (const [j, J] of sk.oral.entries()) {
      if (OA.at[j][2] !== far) continue;
      // (a soft ruffled edge along its length, more toward the end)
      const [pts, ws] = strandPts(J, oW, 3, (f) => 1 + 0.2 * Math.sin(f * 15 + t * 1.6 + j) * f);
      drawStrand(ctx, a, mode, pts, ws, far ? FAR : NEAR);
    }
  }
  function drawFringe(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.frill);
    if (mode === 'line') return edge(ctx, INKD);
    ctx.fillStyle = tone(a, CR.base);
    ctx.fill();
    // (shaded under the rim, paler toward the hem)
    ctx.save();
    ctx.clip();
    const top = sk.toW([0, sk.drop - 0.4]);
    glowAt(ctx, a, top, sk.wr * 1.1, CR.sh, 0.7);
    ctx.restore();
  }
  function drawBell(ctx, a, mode) {
    const sk = a.tk;
    polyPath(ctx, sk.outline);
    if (mode === 'line') return edge(ctx, INKD);
    ctx.fillStyle = tone(a, C.base);
    ctx.fill();
    ctx.save();
    polyPath(ctx, sk.outline);
    ctx.clip();
    const w = B0.w;
    // the dome lit from above, shaded low; the hollow under it
    glowAt(ctx, a, sk.toW([-0.25 * w, -0.74 * sk.hh]), w * 0.85, C.lt, 0.95);
    glowAt(ctx, a, sk.toW([0, 0.1 * sk.hh]), w * 0.95, C.sh, 0.5);
    ctx.save();
    ctx.translate(...sk.toW([0, -0.05 * sk.hh + sk.drop * 0.5]));
    ctx.rotate(sk.beta);
    ctx.beginPath();
    ctx.ellipse(0, 0, sk.wr * 0.8, Math.max(0.5, 0.16 * sk.hh), 0, 0, TAU);
    ctx.fillStyle = tone(a, C.sh, 0.55);
    ctx.fill();
    ctx.restore();
    // its own markings (the dress), clipped to the bell
    DRESS.paint?.(ctx, a, sk, KIT);
    ctx.restore();
    // its own face (the dress)
    ctx.save();
    DRESS.face?.(ctx, a, sk, KIT);
    ctx.restore();
  }
  const KIT = {
    C, CO, CF, CR, P, ink: INKD, tone, edge: (ctx) => edge(ctx, INKD), glowAt, polyPath, strandPts, strandInto, drawStrand, NEAR, FAR, mix, ease, easeOut, turn, plus, times, unit,
    bellFrame: (ctx, a) => {
      ctx.translate(...a.tk.B);
      ctx.rotate(a.tk.beta);
    },
    bellPath: (ctx, a) => polyPath(ctx, a.tk.outline),
  };
  function spot(sk, what) {
    if (DRESS.spot) {
      const p = DRESS.spot(sk, what);
      if (p) return p;
    }
    if (what === 'tips') return sk.tips.reduce((s, p) => plus(s, times(p, 1 / sk.tips.length)), [0, 0]);
    if (what === 'grab') return sk.grabP;
    if (what === 'slap') return sk.slapTip;
    return [sk.B[0], sk.B[1] + 20];
  }
  const still = (wB, hB) => [E(wB / 2, hB - 30, 13, 10, C.base), E(wB / 2, hB - 16, 3, 9, C.sh)];
  return {
    H,
    speed: P.speed,
    cycle: P.cycle,
    fly: true,
    w: 26,
    h: Math.round(H * 1.02),
    boxW: 90,
    boxH: Math.ceil(H * 1.6),
    skeleton,
    spot,
    still,
    KIT,
    seq: [['fineFar', (c, a, md) => drawFine(c, a, md, true), true], ['oralFar', (c, a, md) => drawOral(c, a, md, true)], ['oralNear', (c, a, md) => drawOral(c, a, md, false)], ['fineNear', (c, a, md) => drawFine(c, a, md, false), true], ['fringe', drawFringe], ['bell', drawBell]],
    base(t, m, a, w) {
      const o = zero();
      o.look = glance(t, m.uid ?? 0) * (1 - w);
      o.pitch = 4 * Math.sin(t * 0.5) * (1 - w);
      o.lift = 1.4 * Math.sin(t * 0.37);
      return o;
    },
    poses(o, name, t) {
      if (name === 'rest') Object.assign(o, { flat: 1, pump: -0.2, pitch: 2 * Math.sin(t * 0.4) });
      else if (name === 'curl') Object.assign(o, { curl: 1, pump: 0.65, pitch: 4 });
      else if (name === 'sleep') Object.assign(o, { flat: 1, sleep: 1, pump: -0.15, pitch: 6 + 2 * Math.sin(t * 0.3), look: 0 });
      else if (name === 'dead') Object.assign(o, { flat: 1, sleep: 1, pump: -0.25, pitch: 34, look: 0 });
    },
  };
}

// ---------- Effects: hit sparkles, dust, an ink puff, sparks, bubbles, speed lines, spin trails ----------
const twinkle = (ctx, x, y, r, an, fill) => {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.3 : r;
    const q = an + (i * Math.PI) / 4;
    ctx.lineTo(x + Math.cos(q) * rr, y + Math.sin(q) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};
const puff = (ctx, x, y, r, al, fill = '#f3eefa', line = '#d6cbe6') => {
  ctx.globalAlpha = al;
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(0.4, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.stroke();
};
function drawFx(ctx, K, a) {
  const sk = a.tk;
  const mv = a.tnMove?.mv;
  const t = a.tnMove?.t ?? 0;
  if (!mv || !sk) return;
  const H = K.H;
  ctx.save();
  for (const s0 of mv.spark ?? []) {
    const sp = after([s0], t, 0.22);
    if (sp < 0) continue;
    const [sx, sy] = K.spot(sk, mv.sparkAt);
    const e = easeOut(sp);
    ctx.globalAlpha = 1 - sp;
    twinkle(ctx, sx, sy, H * 0.11 * (0.5 + 0.7 * e), sp * 0.8, '#ffffff');
    twinkle(ctx, sx, sy, H * 0.055 * (0.5 + 0.7 * e), sp * 0.8 + 0.4, '#fff2a8');
    for (let i = 0; i < 4; i++) {
      const q = (i * TAU) / 4 + 0.6;
      twinkle(ctx, sx + Math.cos(q) * H * 0.15 * e, sy + Math.sin(q) * H * 0.15 * e, H * 0.028, q, i % 2 ? '#ffc8de' : '#fff6c8');
    }
  }
  for (const [d0, where] of mv.dust ?? []) {
    const dp = after([d0], t, 0.4);
    if (dp < 0) continue;
    const [gx] = K.spot(sk, where);
    const e = 1 - (1 - dp) ** 2;
    for (let i = 0; i < 4; i++) {
      const dir = i < 2 ? -1 : 1;
      puff(ctx, gx + dir * (2 + (i % 2) * 3) * (0.4 + e), -(1 + (i % 2)) - e * 2.4, (1.4 + (i % 2) * 0.6) * (0.6 + 0.6 * e), (1 - dp) * 0.85);
    }
  }
  // the ink: a soft cloud of round puffs from under the mantle, billowing forward and fading
  for (const i0 of mv.ink ?? []) {
    const ip = after([i0], t, 0.9);
    if (ip < 0) continue;
    const [sx, sy] = K.spot(sk, 'mouth');
    for (let i = 0; i < 6; i++) {
      const k = clamp(ip * 1.25 - i * 0.05, 0, 1);
      if (k <= 0) continue;
      const e = easeOut(k);
      const ang = (i - 2.5) * 0.28;
      puff(ctx, sx + (3 + 15 * e * (1 + (i % 3) * 0.15)) * Math.cos(ang), sy + (2 + 10 * e) * Math.sin(ang) - e * 1.5, 1.4 + 3.2 * e, (1 - k) * 0.8, '#b3a8cb', '#9d91b8');
    }
  }
  // sparks: little soft zigzags flickering off the tentacle tips
  if (mv.zap && t >= mv.zap[0] && t <= mv.zap[1]) {
    const k = (t - mv.zap[0]) / (mv.zap[1] - mv.zap[0]);
    const step = Math.floor(t * 24);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [j, [tx, ty]] of (sk.tips ?? []).entries()) {
      for (const [col, lw] of [['#fff3a0', 1.1], ['#ffffff', 0.45]]) {
        ctx.globalAlpha = (1 - k) * 0.95;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        let x = tx;
        let y = ty;
        ctx.moveTo(x, y);
        for (let s = 0; s < 3; s++) {
          x += 1.6 + rand(step + s, j) * 1.4;
          y += (rand(step + s, j + 9) - 0.5) * 3;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }
  // bubbles trailing a jet
  if (mv.bubbles && t >= mv.bubbles[0] && t <= mv.bubbles[1] + 0.4) {
    for (let i = 0; i < 5; i++) {
      const b0 = mv.bubbles[0] + i * 0.06;
      const bp = after([b0], t, 0.55);
      if (bp < 0) continue;
      const base = K.spot(sk, 'feet');
      ctx.globalAlpha = (1 - bp) * 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(base[0] - 6 - i * 2.5 - bp * 8, -8 - (i % 3) * 3 - bp * 6, 0.9 + (i % 2) * 0.6, 0, TAU);
      ctx.stroke();
    }
  }
  if (mv.lines && t >= mv.lines[0] && t <= mv.lines[1]) {
    const k = (t - mv.lines[0]) / (mv.lines[1] - mv.lines[0]);
    ctx.globalAlpha = 0.7 * (1 - k);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.9;
    const c = K.spot(sk, 'feet');
    for (let i = 0; i < 3; i++) {
      const y = -10 - i * 5;
      ctx.beginPath();
      ctx.moveTo(c[0] - 14 - 6 * k, y);
      ctx.lineTo(c[0] - 24 - 10 * k, y);
      ctx.stroke();
    }
  }
  // spin trails: soft arcs round the star, following its turn
  if (mv.trail && t >= mv.trail[0] && t <= mv.trail[1] && sk.O) {
    const k = (t - mv.trail[0]) / (mv.trail[1] - mv.trail[0]);
    ctx.globalAlpha = 0.6 * Math.sin(Math.PI * k);
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 3; i++) {
      const a0 = sk.rot + i * (TAU / 3);
      ctx.beginPath();
      ctx.arc(sk.O[0], sk.O[1], H * 0.62, a0 - 0.9, a0);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- One rig for a dress ----------
function jellyDressRig(look = {}) {
  const LP = look.P ?? {};
  const P = { ...JELLYFISH };
  for (const [k, v] of Object.entries(LP)) P[k] = v && typeof v === 'object' && !Array.isArray(v) && P[k] && typeof P[k] === 'object' && !Array.isArray(P[k]) ? { ...P[k], ...v } : v;
  const K = jellyRig(P, look);
  const DRESS = look;
  const KIT = K.KIT;
  const table = { ...JELLY_MOVES, ...(look.moves ?? {}) };
  KIT.moves = table;
  const pleased = 'bloom';
  function moveNow(m, a, st) {
    if (m.act && table[m.act.name]) {
      const mv = table[m.act.name];
      const T = a.now - m.act.at;
      if (T >= 0 && T < mv.anticT + moveLen(mv)) {
        const t = T - mv.anticT;
        return [mv, t, t < 0 ? (mv.anticT > 0 ? Math.min(1, T / mv.anticT) : 1) : 1];
      }
    }
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.tnAtk) {
        const pool = m.def.moves ?? P.moves;
        st.tnN = (st.tnN ?? m.uid ?? 0) + 1;
        st.tnPick = DRESS.pick ? DRESS.pick(m, a, st) : typeof m.move === 'string' && table[m.move] ? m.move : pool[st.tnN % pool.length];
      }
      st.tnAtk = true;
      const mv = table[st.tnPick];
      if (mv) return a.ph.since >= 0 ? [mv, a.ph.since, 1] : [mv, -(1 - a.ph.antic) * mv.anticT, a.ph.antic];
    } else st.tnAtk = false;
    if (m.hp > 0 && (a.hurtAgo ?? 9) >= 0 && (a.hurtAgo ?? 9) < moveLen(table.hurt)) return [table.hurt, a.hurtAgo, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (m.hp > 0 && gl >= 0 && gl < moveLen(table[pleased])) return [table[pleased], gl, 1];
    return [null, 0, 0];
  }
  const parts = [];
  for (const mode of ['line', 'fill']) {
    for (const [name, fn, fillOnly] of K.seq) {
      if (fillOnly && mode === 'line') continue;
      parts.push({
        name: `${name}~${mode}`,
        parent: null,
        at: () => [0, 0],
        pivot: [0, 0],
        s: BLANK,
        paint: (ctx, a) => {
          if (DRESS.under?.[name]) {
            ctx.save();
            DRESS.under[name](ctx, a, mode, KIT);
            ctx.restore();
          }
          fn(ctx, a, mode);
          if (DRESS.over?.[name]) {
            ctx.save();
            DRESS.over[name](ctx, a, mode, KIT);
            ctx.restore();
          }
        },
      });
    }
  }
  const soft = ['look', 'tilt'];
  const rig = makeRig({
    w: K.boxW,
    h: K.boxH,
    soft: true,
    stride: K.cycle,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, c === 'look' ? [60, 14] : c === 'roll' ? [260, 30] : c === 'pump' ? [220, 22] : c === 'tilt' ? [150, 17] : [170, 21]])),
    walkStiff: { pitch: [300, 32], tilt: [200, 24] },
    fast: CH.filter((c) => !soft.includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.tnActive),
    kick: { pitch: -40, tilt: -60 },
    turnKick: { tilt: 18 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + (m.uid % 7) * 1.1;
      // How far it has gone: the crawl's (or the pulse's, or the cartwheel's) phase comes from this.
      const dt = Math.max(1e-3, a.dt ?? 0);
      const odo = m.odo ?? 0;
      const raw = Math.min(400, Math.abs(odo - (st.tnOdo ?? odo)) / dt);
      st.tnOdo = odo;
      st.tnV = mix(st.tnV ?? 0, raw, Math.min(1, dt * 5));
      st.tnU = ((st.tnU ?? 0) + (st.tnV / K.cycle) * (a.dt ?? 0)) % 1;
      // (a floater is always "moving" to the game: how much it is swimming comes from its speed)
      st.tnGo = mix(st.tnGo ?? 0, clamp(st.tnV / (K.speed * 0.5), 0, 1), Math.min(1, dt * 4));
      const w = K.fly ? st.tnGo : (a.walkW ?? 0);
      const base = K.base(t, m, a, w);
      const [mv, mt, anticW] = moveNow(m, a, st);
      base.x /= K.H;
      base.hop /= K.H;
      const out = mv ? posed(mv, mt, anticW, base) : { ...base };
      const napping = m.habit?.kind === 'nap' && a.now < (m.habit.until ?? 0);
      if (m.pose && !mv) K.poses(out, m.pose === 'sleep' ? 'sleep' : m.pose, t);
      if (napping && !mv && m.hp > 0) K.poses(out, 'sleep', t);
      const mood = m.cine?.mood;
      if (mood === 'happy' && m.hp > 0 && !mv) Object.assign(out, { raise: Math.max(out.raise, 0.5), lift: out.lift + 1 + Math.sin(t * 5) * 0.8 });
      else if (mood === 'sad' && m.hp > 0 && !mv) Object.assign(out, { flat: Math.max(out.flat, 0.35), pitch: out.pitch + 8, look: 0 });
      if (m.hp <= 0) K.poses(out, 'dead', t);
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      st.tnActive = Boolean(mv);
      // (a whole turn of the starfish is the same star: between moves its turn is taken back to
      // the nearest fifth, which changes nothing on screen)
      if (!mv && st.roll && Math.abs(st.roll.x) > 0.1) {
        const nW = Math.round(st.roll.x / 0.2);
        st.roll.x -= nW * 0.2;
        st.sWrap = (st.sWrap ?? 0) - nW;
      }
      st.tnRoll = st.roll;
      a.tnMove = mv ? { mv, t: mt } : null;
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = out.x * K.H;
      res.hop = out.hop * K.H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.mo.rig ??= {};
      a.tk = K.skeleton(S, a, m);
    },
    parts,
    fx: (ctx, m, a) => {
      drawFx(ctx, K, a);
      DRESS.fx?.(ctx, m, a, KIT);
    },
  });
  // (a still for the Monster Book: the body plain)
  const still = () => ({ w: K.boxW, h: K.boxH, res: 3, shapes: K.still(K.boxW, K.boxH) });
  return { rig, still, K };
}

// One dressed jellyfish: its art entry (for ARTS), its size and its swimming pace.
export function dressedJelly(look) {
  const { rig, still, K } = jellyDressRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: K.cycle, atkMs: [110, 180, 340, 240], draw: still, rig }, w: K.w, h: K.h, speed: K.speed, bodyH: K.H, fly: true };
}
