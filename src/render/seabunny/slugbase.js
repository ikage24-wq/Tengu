// The Sea Bunny Bellhop's sea slug (2026-11-26): A COPY of the Bud Snail's snail
// (render/budsnail/snailbase.js, itself a copy of the shell crawler base blankshell.js's snail), kept
// here as this monster's own so the bases stay clean ("never edit the bases, just copy the base and
// edit that"). A sea slug is a snail without its shell, so this copy has none: the coil is gone and a
// soft round MANTLE (the plump back) sits on the foot in its place, one soft body with the foot, the
// neck and the head. Only the snail is kept (the tortoise and the sea turtle dropped). What else this
// copy changes and adds:
//   - one body shape: foot, mantle, neck and head filled as one and outlined only on the outside,
//     its edge a gentle cloud of small round scallops (round puffs sunk a little inside every edge,
//     none along the sole), lit from the upper front and shaded cool underneath;
//   - no `stretch` (the player's rule: no squash or stretch; poses only), no shell, no hiding in it,
//     no rolling over, no slime trail;
//   - the upper stalks are EARS (rounded, each from inside the head on its own spring: swept back
//     or forward, drooping, perking, and each its own swing), the lower stalks dropped;
//   - a TAIL: a cluster of round lobes rooted inside the back of the mantle on a light spring
//     (spread a little to puff it);
//   - `lean`: the mantle and the head rocked together about the foot's middle (the sole stays flat);
//   - the glide's ripples run at `P.ripK` waves a px (a slow even shimmer at a slug's speed) and the
//     body rises a hair as each passes;
//   - the base's own star sparks, dust and speed lines are gone: every effect is the dress's own.
// The dress (`look`), the same as the Bud Snail's where it can be:
//   look.C      its own colours (lt, base, sh, deep) for the body; look.CE the ears' (base, sh, tip,
//               tipLt), look.CT the tail's (lt, base, sh)
//   look.ink    the body's soft outline colour (never near-black); look.inkE, look.inkT the ears'
//               and the tail's
//   look.P      its own shape over the slug's (foot, mantle, neck, head, ears, tail, fluff)
//   look.face   (ctx, a, sk, K) its own eyes and mouth, in the head's frame
//   look.over   { part: (ctx, a, mode, K) } drawn over a part in both passes (mode 'line': its
//               outline, 'fill': itself); parts: tail, earF, body, earN
//   look.under  the same, under a part
//   look.pose   (m, a, out, K, mv, mt) its own idle act and moods on the channels
//   look.fx     (ctx, m, a, S, K) live extras over everything
//   look.moves  its own moves (the base has only `hurt`; a `gloat` played after it lands a hit)
//   look.turnKick, look.kick  the springs' kicks on a turn and on a hit
// K, the kit handed to them: the skeleton is a.bk (mc, mA, nb, hc, ha, ears, tail, xf, xb, fh,
// front, rip, rw); C, P, H, colour, tint, edge, soft, headFrame(ctx, a), the curve helpers; moves,
// poseAt, follow, followPt.

import { makeRig, clamp, TAU } from '../mobs/rig.js';
import { E } from '../mobs/kit.js';
import { sprite } from '../pixel.js';

const D2R = Math.PI / 180;
const C0 = { lt: '#f2eefa', base: '#e2dcee', sh: '#c8c0dc', deep: '#aea4c6' };
const CE0 = { base: '#efe6f6', sh: '#d8cce6', tip: '#b8a8c8', tipLt: '#d4c8e2' };
const CT0 = { lt: '#f6f2fc', base: '#e8e2f2', sh: '#cfc6e0' };
// (the outer line: a soft deep lilac of its own, never near-black)
const INK = '#7f6982';
const sstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const mul = (p, k) => [p[0] * k, p[1] * k];
const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const unit = (an) => [Math.cos(an), Math.sin(an)];
const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const frac = (x) => x - Math.floor(x);
const rgbOf = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// ---------- Curves ----------
// A smooth closed outline through control points (`n` steps between each two).
function loopThrough(pts, n) {
  const N = pts.length;
  const out = [];
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N];
    const b = pts[i];
    const c = pts[(i + 1) % N];
    const d = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  return out;
}
const bez2 = (p0, p1, p2, t) => {
  const s = 1 - t;
  return [s * s * p0[0] + 2 * s * t * p1[0] + t * t * p2[0], s * s * p0[1] + 2 * s * t * p1[1] + t * t * p2[1]];
};
const bez3 = (p0, p1, p2, p3, t) => {
  const s = 1 - t;
  return [s * s * s * p0[0] + 3 * s * s * t * p1[0] + 3 * s * t * t * p2[0] + t * t * t * p3[0], s * s * s * p0[1] + 3 * s * s * t * p1[1] + 3 * s * t * t * p2[1] + t * t * t * p3[1]];
};
// The outline of a soft round-ended tube along a spine (`ws`: its full width at each point).
function tubeOutline(sp, ws, capN = 7) {
  const n = sp.length;
  const tan = sp.map((_, i) => {
    const d = sub(sp[Math.min(n - 1, i + 1)], sp[Math.max(0, i - 1)]);
    const l = Math.hypot(d[0], d[1]) || 1;
    return [d[0] / l, d[1] / l];
  });
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const h = ws[i] / 2;
    left.push([sp[i][0] - tan[i][1] * h, sp[i][1] + tan[i][0] * h]);
    right.push([sp[i][0] + tan[i][1] * h, sp[i][1] - tan[i][0] * h]);
  }
  const out = [...left];
  const ae = Math.atan2(tan[n - 1][1], tan[n - 1][0]);
  for (let k = 1; k < capN; k++) out.push(add(sp[n - 1], mul(unit(ae + Math.PI / 2 - (Math.PI * k) / capN), ws[n - 1] / 2)));
  for (let i = n - 1; i >= 0; i--) out.push(right[i]);
  const a0 = Math.atan2(tan[0][1], tan[0][0]);
  for (let k = 1; k < capN; k++) out.push(add(sp[0], mul(unit(a0 - Math.PI / 2 - (Math.PI * k) / capN), ws[0] / 2)));
  return out;
}
// (every shape wound the same way round as an ellipse, so where two of a part's shapes overlap
// they add up: one filled union, never a hole)
const addShape = (ctx, pts) => {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area += x0 * y1 - x1 * y0;
  }
  const list = area < 0 ? [...pts].reverse() : pts;
  list.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
const addOval = (ctx, [cx, cy], rx, ry, an = 0) => {
  ctx.moveTo(cx + Math.cos(an) * rx, cy + Math.sin(an) * rx);
  ctx.ellipse(cx, cy, rx, ry, an, 0, TAU);
};
const addRing = (ctx, [x, y], r) => {
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, r, 0, TAU);
};
// A damped spring kept in the rig's state, stepped finely (a slow frame never throws it about).
function follow(st, key, goal, k, c, dt) {
  const s = (st[key] ??= { x: goal, v: 0 });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      s.v += ((goal - s.x) * k - s.v * c) * h;
      s.x += s.v * h;
    }
  }
  if (!Number.isFinite(s.x)) Object.assign(s, { x: goal, v: 0 });
  return s.x;
}
// The same for a point (an ear's tip, the tail's middle).
function followPt(st, key, goal, k, c, dt) {
  const s = (st[key] ??= { p: [...goal], v: [0, 0] });
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      for (const j of [0, 1]) {
        s.v[j] += ((goal[j] - s.p[j]) * k - s.v[j] * c) * h;
        s.p[j] += s.v[j] * h;
      }
    }
  }
  if (!Number.isFinite(s.p[0] + s.p[1]) || dist(s.p, goal) > 12) Object.assign(s, { p: [...goal], v: [0, 0] });
  return s.p;
}

// ---------- The slug (units: game px at scale 1; x forward, y down, the ground at y = 0) ----------
const SLUG = {
  foot: { back: -16, front: 15, h: 4.2 },
  // the plump back, an oval sat on the foot (its lower edge sunk in the foot)
  mantle: { c: [-4.6, -9.0], rx: 11.6, ry: 7.6 },
  neck: { base: [9.2, -3.2], w: [9.5, 10] },
  head: { c: [6.4, -12.4], rx: 8.2, ry: 7.4, tilt: 3 },
  // ears: roots in the head's frame (sunk inside it), the angle they stand at, length, widest width
  ears: [
    { id: 'F', far: true, root: [3.4, -5.6], ang: -74, len: 7.6, w: 3.2 },
    { id: 'N', far: false, root: [-1.6, -5.8], ang: -104, len: 8.0, w: 3.4 },
  ],
  // the tail: rooted inside the mantle's upper back (its angle round the mantle), its middle `out`
  // px out from the root, its lobes [along, across, r] about the middle
  tail: { at: -132, out: 2.9, lobes: [[0, 0, 2.3], [1.5, -1.6, 1.75], [1.5, 1.6, 1.75], [-0.3, -2.5, 1.6], [-0.3, 2.5, 1.6], [2.7, 0, 1.55], [-1.5, -0.2, 1.8]] },
  // the cloud edge: round puffs of radius r, sunk `inset` inside the edge, every `step` px
  fluff: { r: 1.55, inset: 1.05, mantleN: 30, headN: 28, bodyN: 34 },
  ripple: 8,
  ripK: 1,
};

// ---------- The moves (units: x in body heights; lift in px; angles in degrees) ----------
// nAng: + the head raised; head: + nose down; neck: + reaching out; lean: + the body rocked forward;
// earA: + both ears swept back, - swung forward; earN, earF: + that ear swung forward on its own;
// droop: the ears flopped back and down; perk: the ears stood up straight; puff: the tail spread;
// tail: a flick of it; crouch: settled low.
const SLUG_MOVES = {
  hurt: {
    keys: [
      [0, {}],
      [0.05, { x: -0.05, nAng: 10, head: -12, earA: 1, droop: 0.5, lean: -5, crouch: 0.3 }, 'out'],
      [0.22, { x: -0.05, nAng: 6, head: -6, earA: 0.8, droop: 0.4, lean: -3, crouch: 0.2 }],
      [0.6, {}],
    ],
  },
};
const CH = ['x', 'lift', 'crouch', 'neck', 'nAng', 'head', 'jaw', 'earA', 'earN', 'earF', 'droop', 'perk', 'lean', 'puff', 'tail'];
const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: sstep };
// A move's pose at `t` seconds in (before 0: easing into its first key by `antic`).
function moveAt(mv, t, antic, base) {
  const keys = mv.keys.map(([kt, p, ease]) => [kt, { ...base, ...p }, ease]);
  const out = {};
  if (t < 0) {
    const w = sstep(antic);
    for (const c of Object.keys(base)) out[c] = lerp(base[c], keys[0][1][c], w);
    return out;
  }
  let i = 0;
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
  if (i >= keys.length - 1) return { ...keys[keys.length - 1][1] };
  const [t0, p0] = keys[i];
  const [t1, p1, ease] = keys[i + 1];
  const u = (EASE[ease] ?? sstep)(clamp((t - t0) / Math.max(1e-6, t1 - t0), 0, 1));
  for (const c of Object.keys(p0)) out[c] = lerp(p0[c], p1[c], u);
  return out;
}
const BLANK = () => sprite('rig|slugblank', () => ({ w: 1, h: 1, shapes: [], res: 1, bare: true }));

// ---------- One rig ----------
function slugRig(look = {}) {
  const DRESS = look;
  const LP = look.P ?? {};
  const P = {
    ...SLUG,
    ...LP,
    foot: { ...SLUG.foot, ...(LP.foot ?? {}) },
    mantle: { ...SLUG.mantle, ...(LP.mantle ?? {}) },
    neck: { ...SLUG.neck, ...(LP.neck ?? {}) },
    head: { ...SLUG.head, ...(LP.head ?? {}) },
    tail: { ...SLUG.tail, ...(LP.tail ?? {}) },
    fluff: { ...SLUG.fluff, ...(LP.fluff ?? {}) },
    ears: LP.ears ?? SLUG.ears,
  };
  const C = { ...C0, ...(look.C ?? {}) };
  const CE = { ...CE0, ...(look.CE ?? {}) };
  const CT = { ...CT0, ...(look.CT ?? {}) };
  const MOVES = { ...SLUG_MOVES, ...(look.moves ?? {}) };
  // Its size: how tall its body stands (the unit its moves are measured in), how long it is.
  const H = -(P.head.c[1] - P.head.ry);
  const length = P.foot.front - P.foot.back;
  // (the round puffs' places round each oval, worked out once: [cos, sin] of each)
  const ringOf = (n, ph = 0) => Array.from({ length: n }, (_, i) => unit(((i + ph) / n) * TAU));
  const MANTLE_RING = ringOf(P.fluff.mantleN, 0.3);
  const HEAD_RING = ringOf(P.fluff.headN, 0.1);
  const OVAL = ringOf(40);

  // ---------- The skeleton: every bone's place this frame ----------
  function skeleton(S, a) {
    const st = a.mo.rig;
    const t = a.shT ?? a.t ?? 0;
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const X0 = S.x;
    const crouch = clamp(S.crouch, -0.4, 1.5);
    // (the ripples: their phase from how far the foot has glided; the body rises a hair with each)
    const rip = st.shRip ?? 0;
    const rw = clamp(a.shRipW ?? 0, 0, 1);
    const bob = (0.5 - 0.5 * Math.cos(rip * TAU)) * 0.3 * rw;
    const up = S.lift + bob - crouch * 1.5;
    // (rocked about the foot's middle: the mantle and the head together, the sole flat)
    const leanA = clamp(S.lean, -30, 30) * D2R;
    const pv = [X0 - 1, -1.5];
    const R = (p) => add(pv, turn(sub(p, pv), leanA));
    // The foot: a long soft skirt flat on the ground.
    const xf = P.foot.front + X0;
    const xb = P.foot.back + X0;
    const fh = Math.max(2.4, P.foot.h - crouch * 0.5);
    // The mantle, sat on the foot.
    const mc = R([P.mantle.c[0] + X0, P.mantle.c[1] - up * 0.8]);
    const mA = leanA;
    // The neck's base on the foot, and the head: raised or lowered about the base, reaching out.
    const nb = [P.neck.base[0] + X0, -fh * 0.8];
    let hc = add(P.head.c, [X0 + 3.2 * S.neck, -1.5 * S.neck - up]);
    hc = R(add(nb, turn(sub(hc, nb), -S.nAng * D2R)));
    // (the head lags the body a touch and settles: a spring on where it's carried)
    const wx = (a.flip ? -1 : 1) * (a.shM?.x ?? 0);
    const lagX = clamp(follow(st, 'shLagX', wx + hc[0], 150, 17, dt) - (wx + hc[0]), -1.4, 1.4);
    const lagY = clamp(follow(st, 'shLagY', hc[1], 170, 15, dt) - hc[1], -1.4, 1.4);
    hc = add(hc, [lagX, lagY]);
    const ha = (P.head.tilt + S.head - S.nAng * 0.35 + lagY * 4) * D2R + leanA;
    // The neck: a soft curve up from its base into the head (hidden in the body, it fills the chest).
    const nL = dist(nb, hc);
    const c1 = add(nb, mul(unit(-72 * D2R), nL * 0.42));
    const c2 = add(hc, mul(unit(102 * D2R + ha), nL * 0.34));
    const spine = Array.from({ length: 8 }, (_, i) => bez3(nb, c1, c2, hc, (i / 7) * 0.84));
    const side = spine.map((p, i) => {
      const d = sub(spine[Math.min(7, i + 1)], spine[Math.max(0, i - 1)]);
      const l = Math.hypot(d[0], d[1]) || 1;
      const ww = lerp(P.neck.w[0], P.neck.w[1], i / 7) * 0.5;
      return [add(p, [(d[1] / l) * ww, (-d[0] / l) * ww]), add(p, [(-d[1] / l) * ww, (d[0] / l) * ww])];
    });
    // The foot's underside: the ripples lift it a hair where each passes (a fixed count of points).
    const lam = P.ripple;
    const ph = frac(rip);
    const crest = (x) => {
      let c = 0;
      for (let n = -1; n < 6; n++) {
        const xn = xb + lam * (n + ph);
        c += Math.exp(-(((x - xn) / (lam * 0.2)) ** 2));
      }
      return c;
    };
    const sole = [];
    for (let i = 0; i < 18; i++) {
      const x = lerp(xf - 2.4, xb + 2.2, i / 17);
      const k = sstep((x - xb - 2) / 4) * sstep((xf - 2 - x) / 4);
      sole.push([x, -0.3 * rw * k * crest(x)]);
    }
    const ring = [
      [xf, -fh * 0.34],
      [xf - 1.1, -0.06],
      ...sole,
      [xb + 1, -0.32],
      [xb, -fh * 0.3],
      [xb + 2.4, -fh * 0.64],
      [lerp(xb, mc[0], 0.55), -fh * 0.96],
      [mc[0] - 1, -fh - 1.2],
      ...side.map((p) => p[0]),
      ...side.slice().reverse().map((p) => p[1]),
      [lerp(nb[0], xf, 0.62), -fh * 0.72],
    ];
    const body = loopThrough(ring, 3);
    // The ears: roots inside the head, tips on springs (trailing the head, overshooting, settling);
    // swept, drooped, perked and swung by the channels; a slow sway of their own.
    const ears = {};
    for (const [i, K] of P.ears.entries()) {
      const sway = Math.sin(t * 1.15 + i * 1.9) * 2.2 + Math.sin(t * 0.53 + i * 0.7) * 1.6;
      const own = K.far ? S.earF : S.earN;
      let an = K.ang - S.earA * 40 - S.droop * (K.far ? 52 : 58) + own * 46 + sway;
      // (perked: drawn up toward standing straight, a soft V)
      an = lerp(an, K.far ? -80 : -100, clamp(S.perk, 0, 1) * 0.55);
      const ang = ha + an * D2R;
      const root = add(hc, turn(K.root, ha));
      const L = K.len;
      const goal = add(root, mul(unit(ang), L));
      let tip = followPt(st, `sbEar${K.id}`, goal, 210, 13, dt);
      const d = sub(tip, root);
      const dl = Math.hypot(d[0], d[1]) || 1;
      tip = add(root, mul(d, L / dl));
      ears[K.id] = { root, ang, tip, L, K };
    }
    // The tail: a cluster of round lobes rooted inside the mantle's upper back, its middle on a light
    // spring (bouncing a little as the body moves, never leaving its root).
    const T = P.tail;
    const ta = T.at * D2R;
    const root = add(mc, turn([Math.cos(ta) * P.mantle.rx * 0.8, Math.sin(ta) * P.mantle.ry * 0.8], mA));
    // (pointing out from the mantle's middle through the root, flicked by `tail`)
    const outA = Math.atan2(root[1] - mc[1], root[0] - mc[0]) + clamp(S.tail, -1.5, 1.5) * 0.35;
    const goal = add(root, mul(unit(outA), T.out));
    let tc = followPt(st, 'sbTail', goal, 200, 13, dt);
    const td = sub(tc, root);
    const tl = Math.hypot(td[0], td[1]) || 1;
    // (kept near its length on a soft limit, never a hard stop it could knock against)
    tc = add(root, mul(td, (T.out + 0.8 * Math.tanh((tl - T.out) / 0.8)) / tl));
    const tailAng = Math.atan2(tc[1] - root[1], tc[0] - root[0]);
    const puff = clamp(S.puff, 0, 1.4);
    const lobes = T.lobes.map(([al, ac, r]) => [...add(tc, turn([al * (1 + 0.26 * puff), ac * (1 + 0.26 * puff)], tailAng)), r]);
    return {
      mc, mA, nb, hc, ha, ears, body, spine, xf, xb, fh, rip: ph, rw,
      tail: { root, c: tc, ang: tailAng, lobes, puff },
      front: add(hc, turn([P.head.rx, 0], ha)),
      top: add(hc, turn([0, -P.head.ry], ha)),
      jaw: clamp(S.jaw, 0, 1),
      S,
      t,
      X: (p) => p,
    };
  }

  // ---------- Drawing ----------
  const tone = (a, c) => {
    const k = Math.min(0.85, (a.flash ?? 0) * 6);
    if (k <= 0) return c;
    const [r, g, b] = rgbOf(c);
    return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
  };
  const toneA = (a, c, al) => {
    const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
    const [r, g, b] = rgbOf(c);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgba(${f(r)},${f(g)},${f(b)},${clamp(al, 0, 1)})`;
  };
  const line = (ctx, ink = DRESS.ink ?? INK) => {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const soft = (ctx, a, [x, y], r, al, col) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, toneA(a, col, al));
    g.addColorStop(1, toneA(a, col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // The cloud edge: round puffs sunk a little inside an edge (only their outer rims show past it).
  const FL = P.fluff;
  function ovalPuffs(ctx, c, rx, ry, an, list, sinkAt = null) {
    for (const [cs, sn] of list) {
      const p = add(c, turn([cs * rx, sn * ry], an));
      const n0 = turn([cs / rx, sn / ry], an);
      const nl = Math.hypot(n0[0], n0[1]) || 1;
      let inset = FL.inset;
      // (sunk right in where it meets the ground: the sole stays a clean flat line)
      if (sinkAt !== null) inset += 2.6 * sstep((p[1] - sinkAt) / 1.4);
      addRing(ctx, sub(p, mul(n0, inset / nl)), FL.r);
    }
  }
  function ringPuffs(ctx, pts, n) {
    // (resampled to `n` even steps round the outline, so the puffs only ever slide, never pop)
    const L = [0];
    for (let i = 1; i <= pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i % pts.length]));
    const tot = L[pts.length];
    let j = 0;
    let area = 0;
    for (let i = 0; i < pts.length; i++) area += pts[i][0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * pts[i][1];
    const sgn = area < 0 ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const s = (k / n) * tot;
      while (j < pts.length - 1 && L[j + 1] < s) j++;
      const p0 = pts[j];
      const p1 = pts[(j + 1) % pts.length];
      const u = (s - L[j]) / Math.max(1e-6, L[j + 1] - L[j]);
      const p = mix(p0, p1, u);
      const d = sub(p1, p0);
      const dl = Math.hypot(d[0], d[1]) || 1;
      // (outward: to the right of the way round for a shape wound like an ellipse)
      const nrm = [(sgn * d[1]) / dl, (-sgn * d[0]) / dl];
      const inset = FL.inset + 2.6 * sstep((p[1] + 1.9) / 1.4);
      addRing(ctx, sub(p, mul(nrm, inset)), FL.r);
    }
  }
  // The body: foot, mantle, neck and head, one soft fluffy shape.
  function bodyPath(ctx, sk) {
    ctx.beginPath();
    addShape(ctx, sk.body);
    addShape(ctx, OVAL.map(([c, s]) => add(sk.mc, turn([c * P.mantle.rx, s * P.mantle.ry], sk.mA))));
    addOval(ctx, sk.hc, P.head.rx, P.head.ry, sk.ha);
    ringPuffs(ctx, sk.body, FL.bodyN);
    ovalPuffs(ctx, sk.mc, P.mantle.rx, P.mantle.ry, sk.mA, MANTLE_RING, -1.9);
    ovalPuffs(ctx, sk.hc, P.head.rx, P.head.ry, sk.ha, HEAD_RING);
  }
  function drawBody(ctx, a, mode) {
    const sk = a.bk;
    ctx.save();
    // (nothing below the ground: the puffs low on the mantle tuck under the sole)
    ctx.beginPath();
    ctx.rect(-200, -200, 400, mode === 'line' ? 201 : 200.05);
    ctx.clip();
    bodyPath(ctx, sk);
    if (mode === 'line') {
      line(ctx);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, C.base);
    ctx.fill('nonzero');
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip('nonzero');
    // cool lilac shade underneath, rising from the sole
    const g = ctx.createLinearGradient(0, -7.5, 0, 0.2);
    g.addColorStop(0, toneA(a, C.sh, 0));
    g.addColorStop(0.7, toneA(a, C.sh, 0.7));
    g.addColorStop(1, toneA(a, C.deep, 0.8));
    ctx.fillStyle = g;
    ctx.fillRect(sk.xb - 4, -7.5, sk.xf - sk.xb + 8, 8);
    // the ripple bands travelling along the sole as it glides
    // (one sweep along the whole sole, the bands as its colour stops: nothing drawn band by band, so
    // nothing pops as the waves roll on)
    if (sk.rw > 0.02) {
      const lam = P.ripple;
      const x0 = sk.xb;
      const x1 = sk.xf;
      const span = x1 - x0;
      for (const [col, al, dx, hw] of [[C.deep, 0.42, 0, 0.26], [C.lt, 0.5, -0.36, 0.2]]) {
        const g = ctx.createLinearGradient(x0, 0, x1, 0);
        const stops = [];
        for (let n = -1; n < 6; n++) {
          const x = x0 + lam * (n + sk.rip + dx);
          const k = sstep((x - x0 - 2) / 4) * sstep((x1 - 2 - x) / 4) * sk.rw;
          for (const [o, w] of [[-hw, 0], [-hw * 0.45, 0.7], [0, 1], [hw * 0.45, 0.7], [hw, 0]]) {
            const u = (x + o * lam - x0) / span;
            if (u > 0 && u < 1) stops.push([u, al * k * w]);
          }
        }
        stops.sort((p, q) => p[0] - q[0]);
        g.addColorStop(0, toneA(a, col, 0));
        for (const [u, v] of stops) g.addColorStop(u, toneA(a, col, v));
        g.addColorStop(1, toneA(a, col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x0, -sk.fh * 0.62, span, sk.fh * 0.62);
      }
    }
    // the back's soft shade, the mantle lit from the upper front, the head lit high at its front
    soft(ctx, a, add(sk.mc, turn([-P.mantle.rx * 0.75, P.mantle.ry * 0.25], sk.mA)), 7, 0.55, C.sh);
    soft(ctx, a, add(sk.mc, turn([P.mantle.rx * 0.2, -P.mantle.ry * 0.55], sk.mA)), 9, 0.95, C.lt);
    // (a soft crease where the head sits on the back)
    soft(ctx, a, add(sk.hc, turn([-P.head.rx * 0.92, P.head.ry * 0.15], sk.ha)), 3.6, 0.42, C.sh);
    soft(ctx, a, add(sk.hc, turn([P.head.rx * 0.1, P.head.ry * 1.0], sk.ha)), 4.2, 0.5, C.sh);
    soft(ctx, a, add(sk.hc, turn([P.head.rx * 0.12, -P.head.ry * 0.42], sk.ha)), P.head.rx * 0.95, 1, C.lt);
    DRESS.paint?.(ctx, a, sk, KIT);
    ctx.restore();
    // its own face (the dress), in the head's frame
    ctx.save();
    ctx.translate(...sk.hc);
    ctx.rotate(sk.ha);
    DRESS.face?.(ctx, a, sk, KIT);
    ctx.restore();
    ctx.restore();
  }

  // An ear: a soft rounded ear from inside the head out to its round tip, bending as its tip trails;
  // cream, its tip a soft warm grey.
  function earShape(e) {
    const dR = unit(e.ang);
    const p0 = sub(e.root, mul(dR, 1.8));
    const ctl = add(e.root, mul(dR, e.L * 0.5));
    const pts = Array.from({ length: 9 }, (_, i) => bez2(p0, ctl, e.tip, i / 8));
    const W = e.K.w;
    const ws = pts.map((_, i) => {
      const u = i / 8;
      return W * (0.74 + 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.15)) - 0.12 * u);
    });
    return tubeOutline(pts, ws, 9);
  }
  function drawEar(ctx, a, mode, id) {
    const sk = a.bk;
    const e = sk.ears[id];
    if (!e) return;
    const out = earShape(e);
    ctx.save();
    // (the near ear's root: only a little of it shows inside the head's edge, never over the face)
    if (!e.K.far) {
      ctx.beginPath();
      ctx.rect(-1e3, -1e3, 2e3, 2e3);
      addOval(ctx, sk.hc, P.head.rx - 1.5, P.head.ry - 1.5, sk.ha);
      ctx.clip('evenodd');
    }
    ctx.beginPath();
    addShape(ctx, out);
    if (mode === 'line') {
      line(ctx, DRESS.inkE ?? DRESS.ink ?? INK);
      ctx.restore();
      return;
    }
    ctx.fillStyle = tone(a, e.K.far ? CE.sh : CE.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.beginPath();
    addShape(ctx, out);
    ctx.clip('nonzero');
    const dir = unit(Math.atan2(e.tip[1] - e.root[1], e.tip[0] - e.root[0]));
    const side = [-dir[1], dir[0]];
    // the inner ear lit soft along its middle (near ear), the far one a shade darker
    if (!e.K.far) soft(ctx, a, add(e.root, mul(dir, e.L * 0.5)), e.K.w * 1.1, 0.85, '#ffffff');
    soft(ctx, a, add(add(e.root, mul(dir, e.L * 0.45)), mul(side, e.K.w * 0.55)), e.K.w * 0.9, 0.45, CE.sh);
    // the rounded warm-grey tip, soft where it meets the cream
    const tipC = add(e.tip, mul(dir, -0.4));
    const gt = ctx.createRadialGradient(tipC[0], tipC[1], 0, tipC[0], tipC[1], e.K.w * 1.15);
    gt.addColorStop(0, toneA(a, CE.tip, 1));
    gt.addColorStop(0.55, toneA(a, CE.tip, 1));
    gt.addColorStop(1, toneA(a, CE.tip, 0));
    ctx.fillStyle = gt;
    ctx.fillRect(tipC[0] - 5, tipC[1] - 5, 10, 10);
    soft(ctx, a, add(add(tipC, mul(dir, -0.2)), mul(side, -0.5)), e.K.w * 0.45, 0.8, CE.tipLt);
    // (a soft blend into the head's white at the root)
    soft(ctx, a, e.root, e.K.w * 0.9, 0.9, C.base);
    ctx.restore();
    ctx.restore();
  }

  // The tail: a pom-pom of round lobes, lit on top, shaded cool beneath.
  function drawTail(ctx, a, mode) {
    const sk = a.bk;
    const tl = sk.tail;
    const path = () => {
      ctx.beginPath();
      for (const [x, y, r] of tl.lobes) addRing(ctx, [x, y], r);
    };
    path();
    if (mode === 'line') return line(ctx, DRESS.inkT ?? DRESS.ink ?? INK);
    // (a soft shade on the back just round it, where it sits: drawn first, the puff over it)
    ctx.save();
    bodyPath(ctx, sk);
    ctx.clip('nonzero');
    soft(ctx, a, add(tl.c, mul(unit(tl.ang), -0.6)), 5.2, 0.6, C.sh);
    ctx.restore();
    path();
    ctx.fillStyle = tone(a, CT.base);
    ctx.fill('nonzero');
    ctx.save();
    path();
    ctx.clip('nonzero');
    // (each lobe its own soft round: shaded along its lower rim, lit high, so the puff reads as a
    // cluster of round tufts)
    for (const [x, y, r] of tl.lobes) {
      ctx.beginPath();
      ctx.arc(x, y, r - 0.25, Math.PI * 0.05, Math.PI * 0.95);
      ctx.strokeStyle = toneA(a, CT.sh, 0.9);
      ctx.lineWidth = 0.5;
      ctx.stroke();
      soft(ctx, a, [x + r * 0.1, y + r * 0.5], r * 0.9, 0.45, CT.sh);
    }
    for (const [x, y, r] of tl.lobes) soft(ctx, a, [x - r * 0.15, y - r * 0.4], r * 0.8, 1, CT.lt);
    ctx.restore();
  }

  // ---------- The rig ----------
  function moveNow(m, a, st) {
    if (a.ph.antic > 0 || a.ph.since >= 0) {
      if (!st.shAtk) {
        const pool = m.def.moves ?? DRESS.pool ?? [];
        st.shN = st.shN === undefined ? (m.uid ?? 0) : st.shN + 1;
        st.shPick = m.move ?? pool[st.shN % Math.max(1, pool.length)];
      }
      st.shAtk = true;
      const mv = MOVES[st.shPick];
      // (once its move has played out, a hit or a gloat can show again)
      if (mv && a.ph.since < 0) return [mv, -(1 - a.ph.antic) * 0.4, a.ph.antic];
      if (mv && a.ph.since < lengthOf(mv)) return [mv, a.ph.since, 1];
    } else st.shAtk = false;
    const ago = a.hurtAgo ?? 9;
    if (m.hp > 0 && ago >= 0 && ago < lengthOf(MOVES.hurt)) return [MOVES.hurt, ago, 1];
    const gl = a.now - (m.gloatAt ?? -9);
    if (MOVES.gloat && m.hp > 0 && gl >= 0 && gl < lengthOf(MOVES.gloat)) return [MOVES.gloat, gl, 1];
    return [null, 0, 0];
  }
  // (the dress's kit)
  const KIT = {
    C, CE, CT, P, H, colour: tone, tint: toneA, edge: line, soft, sc: (v) => v,
    moves: MOVES, poseAt: moveAt, follow, followPt, sstep, lerp, add, sub, mul, mix, turn, unit, dist,
    loopThrough, tubeOutline, addShape, addOval, addRing, bez2, bez3, TAU,
    upright: () => {},
    headFrame: (ctx, a) => {
      ctx.translate(...a.bk.hc);
      ctx.rotate(a.bk.ha);
    },
    headPt: (sk, p) => add(sk.hc, turn(p, sk.ha)),
    bodyPath: (ctx, a) => bodyPath(ctx, a.bk),
  };
  const dressed = (name, fn) => (ctx, a, mode) => {
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
  };
  const layers = [
    ['earF', (ctx, a, mode) => drawEar(ctx, a, mode, 'F')],
    ['body', drawBody],
    // (the tail sat on the back, over it, its root sunk in the mantle: a round pom-pom that reads)
    ['tail', drawTail],
    ['earN', (ctx, a, mode) => drawEar(ctx, a, mode, 'N')],
  ].map(([name, fn]) => [name, dressed(name, fn)]);
  const parts = [
    ...layers.map(([name, fn]) => ({ name, parent: null, at: () => [0, 0], pivot: [0, 0], s: BLANK, paint: (ctx, a) => fn(ctx, a, 'line') })),
    ...layers.map(([name, fn]) => ({ name: `${name}~b`, parent: null, at: () => [0, 0], pivot: [0, 0], s: BLANK, paint: (ctx, a) => fn(ctx, a, 'fill') })),
  ];
  const RW = Math.ceil(length * 2.6 + 24);
  const RH = Math.ceil(H * 2.6);
  const rig = makeRig({
    w: RW,
    h: RH,
    soft: true,
    stride: P.ripple * 4,
    recover: 1.4,
    springs: Object.fromEntries(CH.map((c) => [c, {
      neck: [190, 22], nAng: [160, 20], head: [170, 20], jaw: [420, 34], earA: [150, 17], earN: [170, 18], earF: [170, 18],
      droop: [70, 13], perk: [110, 15], lean: [180, 20], puff: [120, 15], tail: [150, 14],
    }[c] ?? [170, 21]])),
    walkStiff: { x: [400, 36], lift: [500, 44], nAng: [260, 28], head: [260, 28] },
    fast: CH.filter((c) => !['droop', 'perk', 'tail', 'puff'].includes(c)),
    fastNow: (m, a) => Boolean(a.mo.rig?.shActive),
    kick: look.kick ?? { head: 40, nAng: 30, earA: 5 },
    turnKick: look.turnKick ?? { head: 14, earA: 3 },
    pose(m, a) {
      const st = (a.mo.rig ??= {});
      const t = a.t + ((m.uid ?? 0) % 7) * 1.1;
      a.shT = t;
      a.shM = m;
      const dt = Math.max(0, a.dt ?? 0);
      // The glide's ripples: their phase from the distance glided, walking or charging forward.
      const odo = m.odo ?? 0;
      const moved = Math.min(20, Math.abs(odo - (st.shOdo ?? odo)));
      st.shOdo = odo;
      const xNow = a.mo.rig.x?.x ?? 0;
      const glided = Math.min(20, Math.abs(xNow - (st.shX ?? xNow)));
      st.shX = xNow;
      st.shRip = frac((st.shRip ?? 0) + ((moved + glided) * P.ripK) / P.ripple);
      // Standing about: breathing; the dress's act does the rest.
      const breath = Math.sin(t * 1.7);
      const idle = { x: 0, lift: breath * 0.18, crouch: 0, neck: breath * 0.05, nAng: 0, head: breath * 0.6, jaw: 0, earA: 0, earN: 0, earF: 0, droop: 0, perk: 0, lean: 0, puff: 0, tail: 0 };
      const walk = { ...idle, neck: 0.15, nAng: -2, head: 2, earA: 0.35, lift: 0 };
      const [mv, mt, anticW] = moveNow(m, a, st);
      const base = {};
      for (const c of CH) base[c] = idle[c] * (1 - a.walkW) + walk[c] * a.walkW;
      base.x /= H;
      const out = mv ? moveAt(mv, mt, anticW, base) : { ...base };
      DRESS.pose?.(m, a, out, KIT, mv, mt);
      st.shActive = Boolean(mv);
      a.shMove = mv ? { mv, t: mt } : null;
      // (the ripples show as it glides, walking or in a charge)
      const gliding = mv && (mv.trail ? mt >= mv.trail[0] && mt <= mv.trail[1] : false);
      a.shRipW = follow(st, 'shRipW', a.moving || gliding ? 1 : 0, 60, 15, dt);
      const res = {};
      for (const c of CH) res[c] = out[c] ?? 0;
      res.x = (out.x ?? 0) * H;
      return res;
    },
    under: (ctx, m, a, S) => {
      a.bk = skeleton(S, a);
    },
    parts,
    fx: (ctx, m, a, S) => {
      DRESS.fx?.(ctx, m, a, S, KIT);
    },
  });
  // (a still for the Monster Book: the body, the head and the ears at rest, plain)
  const still = () => {
    const cx = RW / 2;
    const g = RH - 2;
    const Hd = P.head;
    const shapes = [
      ...P.ears.map((K) => {
        const r = add(add(Hd.c, K.root), mul(unit(K.ang * D2R), K.len * 0.5));
        return E(cx + r[0], g + r[1], K.w * 0.5, K.len * 0.5, CE.base);
      }),
      E(cx + P.mantle.c[0], g + P.mantle.c[1], P.mantle.rx, P.mantle.ry, C.base),
      E(cx + (P.foot.back + P.foot.front) / 2, g - P.foot.h / 2, (P.foot.front - P.foot.back) / 2, P.foot.h / 2, C.base),
      E(cx + Hd.c[0], g + Hd.c[1], Hd.rx, Hd.ry, C.base),
    ];
    return { w: RW, h: RH, res: 3, shapes };
  };
  return { rig, still, stride: P.ripple * 4, H, w: Math.round(length * 0.95), h: Math.round(H * 1.05) };
}

// One dressed sea slug: its art entry (for ARTS) and its size.
export function dressedSlug(look) {
  const r = slugRig(look);
  return { art: { pad: 10, walk: 8, idle: 8, attack: 5, stride: r.stride, atkMs: [110, 180, 340, 240], draw: r.still, rig: r.rig }, w: r.w, h: r.h, bodyH: r.H };
}
