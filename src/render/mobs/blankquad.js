// Four-legged bodies' legs (2026-11-23), shared by the animal bases (blankbeast.js: dog, wolf, fox)
// and the four-legged lower halves of the centaur (a pony) and the deertaur (a deer) (blankrigs.js,
// blankskin.js). Built after the player's "body and legs too stiff and bad":
//   - each leg is three bones like a real animal's: a foreleg's upper arm back down to the elbow,
//     the forearm down to the wrist (a horse's knee), the pastern (a horse's cannon) down to the
//     foot; a hind leg's thigh forward down to the knee, the shank back down to the hock, the foot
//     (a horse's cannon) down to the paw or the fetlock;
//   - it steps at a walk (one foot at a time), a trot (in diagonal pairs) or a gallop (gathered:
//     hinds, then fores), planted for less of the step the faster it goes; planted, the lowest bone
//     tips back as the body passes over the foot; lifting, a foreleg folds its foot up under the
//     wrist, then reaches it out ahead to land, and a hind leg flexes its hock;
//   - a planted foot holds its end of the body lower as the leg slants (`sinks`), so the body rocks
//     and bobs over its legs of itself;
//   - drawn: the far legs a shade darker, under the body; the near legs over the body's side, their
//     thigh and shoulder fading in from the joint (no line, no edge where the leg meets the body), a
//     soft crease on the body along the leg's lower edge, a lower leg crossing the body given its
//     own edge, a shade down the back of the lower bones, the haunch and the shoulder lit round.
//
//   legDefs({ fore, hind, far }, sc)  the four legs at rest: fore, hind = { top, bones, w } (its top
//                                     joint, each joint from the last, its widths at each), in the
//                                     body's units; far: the far legs' offset; sc: units to pixels
//   legPhase(k, trot, run), stepAt(u, ph, r, cycle, LF), lowAngle(L, step), sinks(defs, steps)
//   placeLeg(L, T, paw, a3)           -> { T, J1, J2, P, up }: the bones reaching a foot's place
//   legDrawer({ C, edge })            -> { tubePath, tubeInto, limb, poly, capsule, drawLeg }

import { clamp, TAU } from './rig.js';

const smoothstep = (u) => {
  const v = Math.min(1, Math.max(0, u));
  return v * v * (3 - 2 * v);
};
const lerp = (a, b, u) => a + (b - a) * u;
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];

// When each foot steps, as a share of the stride: walking, one at a time (hind, fore, other hind,
// other fore); trotting, the diagonal pairs together; galloping, the hinds then the fores.
export const PHASES = {
  WALK: { hindN: 0, foreN: 0.25, hindF: 0.5, foreF: 0.75 },
  TROT: { hindN: 0, foreF: 0, hindF: 0.5, foreN: 0.5 },
  GALLOP: { hindF: 0, hindN: 0.1, foreF: 0.42, foreN: 0.52 },
};
export const legPhase = (k, trot, run) => PHASES.WALK[k] * (1 - trot) * (1 - run) + PHASES.TROT[k] * trot * (1 - run) + PHASES.GALLOP[k] * run;

// The four legs at rest: each one's joints (body units), its bones' lengths (px), the slant of its
// lowest bone (radians from straight down, + the foot ahead of the joint above it), the angle of its
// top bone, its reach from its top joint to its foot (px), its widths (px).
export function legDefs({ fore, hind, far }, sc) {
  const out = {};
  for (const [k, G, isFar] of [['foreN', fore, false], ['foreF', fore, true], ['hindN', hind, false], ['hindF', hind, true]]) {
    const top = isFar ? [G.top[0] + far[0], G.top[1] + far[1]] : G.top;
    const rest = [top];
    for (const bn of G.bones) rest.push(add(rest[rest.length - 1], bn));
    out[k] = {
      k,
      hind: k.startsWith('hind'),
      far: isFar,
      top,
      rest,
      lens: G.bones.map(([x, y]) => sc(Math.hypot(x, y))),
      a3: Math.atan2(G.bones[2][0], G.bones[2][1]),
      up: Math.atan2(G.bones[0][1], G.bones[0][0]),
      reach: sc(Math.hypot(rest[3][0] - top[0], rest[3][1] - top[1])),
      w: G.w.map(sc),
    };
  }
  return out;
}

// A foot's place along the step at phase u (+ ph), `r` how much it gallops, `cycle` how far the body
// goes in one whole stride, `LF` a foreleg's length: { dx, lift, s (0..1 through the stance, or -1),
// v (0..1 through the swing, or -1) }.
export function stepAt(u, ph, r, cycle, LF) {
  const duty = 0.6 - 0.24 * r;
  const reach = (cycle * duty) / 2;
  const kk = LF * (0.24 + 0.2 * r);
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < duty) {
    const t = q / duty;
    return { dx: reach - 2 * reach * t, lift: 0, s: t, v: -1 };
  }
  const v = (q - duty) / (1 - duty);
  return { dx: -reach + 2 * reach * (0.5 - 0.5 * Math.cos(Math.PI * v)), lift: kk * Math.sin(Math.PI * v ** 0.75), s: -1, v };
}

// The slant of a leg's lowest bone through the step: planted, it tips back as the body passes over
// the foot; lifting, a foreleg's wrist folds the foot up and back under it, then the leg reaches it
// out ahead to land; a hind leg's hock flexes as the foot lifts behind, then swings it forward.
export function lowAngle(L, g) {
  const r0 = L.a3;
  if (g.v < 0) return r0 + (L.hind ? lerp(0.12, -0.5, g.s) : lerp(0.18, -0.48, g.s));
  const v = g.v;
  if (!L.hind) return v < 0.5 ? lerp(r0 - 0.48, -1.95, smoothstep(v / 0.5)) : lerp(-1.95, r0 + 0.28, smoothstep((v - 0.5) / 0.5));
  return v < 0.4 ? lerp(r0 - 0.5, -1.1, smoothstep(v / 0.4)) : lerp(-1.1, r0 + 0.16, smoothstep((v - 0.4) / 0.6));
}

// How much lower each end of the body is held by its planted legs slanting (px), and whether any
// foot is down at all (a gallop's flight has none).
export function sinks(defs, steps) {
  let fS = 0;
  let hS = 0;
  let down = false;
  for (const [k, L] of Object.entries(defs)) {
    const g = steps[k];
    if (g.v >= 0) continue;
    down = true;
    const sink = L.reach - Math.sqrt(Math.max(0, L.reach * L.reach - g.dx * g.dx));
    if (L.hind) hS = Math.max(hS, sink);
    else fS = Math.max(fS, sink);
  }
  return { fS, hS, down };
}

// A leg's bones reaching its foot's place `paw` from its top joint T, its lowest bone at slant a3:
// the joint above the foot first, then the upper two bones to it (the elbow bending back, the knee
// forward), straightening no further than they reach.
export function placeLeg(L, T, paw, a3) {
  const [l1, l2, l3] = L.lens;
  const J2t = [paw[0] - Math.sin(a3) * l3, paw[1] - Math.cos(a3) * l3];
  const gx = J2t[0] - T[0];
  const gy = J2t[1] - T[1];
  const d0 = Math.hypot(gx, gy) || 1;
  const d = Math.min(l1 + l2 - 0.001, Math.max(0.5, d0));
  const phi = Math.atan2(gy, gx);
  const ang = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const kn = phi + (L.hind ? -ang : ang);
  const J1 = add(T, [Math.cos(kn) * l1, Math.sin(kn) * l1]);
  const J2 = add(T, [(gx / d0) * d, (gy / d0) * d]);
  const P = [J2[0] + Math.sin(a3) * l3, J2[1] + Math.cos(a3) * l3];
  return { T, J1, J2, P, up: Math.atan2(J1[1] - T[1], J1[0] - T[0]) };
}

// The drawing, in the body's palette `C` (lt, base, sh, deep) with its outline `edge(ctx)`.
export function legDrawer({ C, edge }) {
  const poly = (ctx, pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  // (a tube: a round at each point and the band between each two, one shape when filled nonzero)
  const tubeInto = (ctx, pts, wl, grow = 0) => {
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const r = Math.max(0.1, wl[i] / 2 + grow);
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
      if (i) {
        const [x0, y0] = pts[i - 1];
        const r0 = Math.max(0.1, wl[i - 1] / 2 + grow);
        const dx = x - x0;
        const dy = y - y0;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
        ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
        ctx.lineTo(x - nx * r, y - ny * r);
        ctx.lineTo(x + nx * r, y + ny * r);
        ctx.closePath();
      }
    }
  };
  const tubePath = (ctx, pts, wl, grow = 0) => {
    ctx.beginPath();
    tubeInto(ctx, pts, wl, grow);
  };
  // (points along the joints, straight along each bone, the width eased from joint to joint;
  // `pinch`: how much each bone narrows between its joints, so the joints stand out as knobs)
  const limb = (joints, widths, n = 4, pinch = null) => {
    const pts = [];
    const wl = [];
    for (let i = 0; i < joints.length - 1; i++) {
      for (let j = 0; j < n; j++) {
        const v = j / n;
        pts.push([lerp(joints[i][0], joints[i + 1][0], v), lerp(joints[i][1], joints[i + 1][1], v)]);
        wl.push(lerp(widths[i], widths[i + 1], smoothstep(v)) * (1 - (pinch?.[i] ?? 0) * Math.sin(Math.PI * v)));
      }
    }
    pts.push(joints[joints.length - 1]);
    wl.push(widths[widths.length - 1]);
    return [pts, wl];
  };
  // (the round-ended shape around two circles, one closed line, for cutting a hole in a clip)
  const capsule = (ctx, p0, r0, p1, r1) => {
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const d = Math.hypot(dx, dy);
    if (d <= Math.abs(r0 - r1) + 1e-3) {
      const [c, r] = r0 > r1 ? [p0, r0] : [p1, r1];
      ctx.moveTo(c[0] + r, c[1]);
      ctx.arc(c[0], c[1], r, 0, TAU);
      return;
    }
    const an = Math.atan2(dy, dx);
    const b = Math.acos((r0 - r1) / d);
    ctx.moveTo(p0[0] + r0 * Math.cos(an + b), p0[1] + r0 * Math.sin(an + b));
    ctx.arc(p0[0], p0[1], r0, an + b, an - b + TAU);
    ctx.arc(p1[0], p1[1], r1, an - b, an + b);
    ctx.closePath();
  };
  // (the shade side of a bone faces down and back)
  const SH = [-0.8, 0.6];
  const backShade = (ctx, Lg, colour) => {
    ctx.fillStyle = colour;
    for (const [p0, p1, w0, w1] of [[Lg.J1, Lg.J2, Lg.w[1], Lg.w[2]], [Lg.J2, Lg.P, Lg.w[2], Lg.w[3]]]) {
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1;
      let nx = -dy / len;
      let ny = dx / len;
      if (nx * SH[0] + ny * SH[1] < 0) {
        nx = -nx;
        ny = -ny;
      }
      tubePath(ctx, [[p0[0] + nx * w0 * 0.3, p0[1] + ny * w0 * 0.3], [p1[0] + nx * w1 * 0.3, p1[1] + ny * w1 * 0.3]], [w0 * 0.36, w1 * 0.36]);
      ctx.fill('nonzero');
    }
  };

  // A leg: `Lg` its bones this frame ({ hind, T, J1, J2, P, w }); `o`: { far, colour(c), tint(c,
  // alpha), bodyPts (the body's outline, for a near leg), foot: { path(ctx, grow) (its shape, added
  // to the leg's), dark?(ctx) and darkColour (a hoof's darker part, filled over it) }, unit (px a
  // detail unit), pinch? (each bone's narrowing between its joints) }.
  function drawLeg(ctx, mode, Lg, o) {
    const { far, colour, foot } = o;
    const [pts, wl] = limb([Lg.T, Lg.J1, Lg.J2, Lg.P], [Lg.w[0], Lg.w[1], Lg.w[2], Lg.w[3]], 4, o.pinch);
    tubePath(ctx, pts, wl);
    foot.path(ctx);
    if (mode === 'line') return edge(ctx);
    if (far) {
      // under the body: a soft line inside its edge, a shade down the back of each bone
      ctx.fillStyle = colour(C.deep);
      ctx.fill('nonzero');
      tubePath(ctx, pts, wl, -0.55);
      foot.path(ctx, -0.55);
      ctx.fillStyle = colour(C.sh);
      ctx.fill('nonzero');
      ctx.save();
      tubePath(ctx, pts, wl, -0.55);
      ctx.clip('nonzero');
      backShade(ctx, Lg, colour(C.deep));
      ctx.restore();
    } else nearLeg(ctx, Lg, pts, wl, o);
    if (foot.dark) {
      ctx.beginPath();
      foot.dark(ctx);
      ctx.fillStyle = colour(far ? foot.darkColour[1] : foot.darkColour[0]);
      ctx.fill('nonzero');
    }
  }
  // A near leg (the player: "it's popping out ... it should never pop out"): drawn only where it comes
  // out of the body, the body itself, drawn untouched, being its top, so nothing of the leg ever
  // shows on the body (no shape, no crease, no line), and where it comes out its fill covers the
  // body's edge, so there's no line there either; a lower leg crossing in front of the body (a paw
  // tucked up under it) drawn over the body with its own edge; a soft line inside the lower leg's
  // edge and a shade down the back of its bones, clear of the elbow (the knee), so nothing round a
  // joint shows on the body.
  function nearLeg(ctx, Lg, pts, wl, { colour, bodyPts, foot, unit: U, pinch }) {
    const T = Lg.T;
    const r0 = wl[0] / 2;
    const lower = limb([Lg.J1, Lg.J2, Lg.P], [Lg.w[1], Lg.w[2], Lg.w[3]], 4, pinch?.slice(1));
    const offBody = () => {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      bodyPts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip('evenodd');
    };
    const notThigh = (grow) => {
      ctx.beginPath();
      ctx.rect(-1e4, -1e4, 2e4, 2e4);
      capsule(ctx, T, r0 + U, Lg.J1, Lg.w[1] / 2 + grow);
      ctx.clip('evenodd');
    };
    // the leg where it shows, off the body; and over the body's edge where it comes out, a band of
    // its colour, so not even a hairline shows where they meet
    ctx.save();
    offBody();
    tubePath(ctx, pts, wl);
    foot.path(ctx);
    ctx.fillStyle = colour(C.base);
    ctx.fill('nonzero');
    ctx.restore();
    ctx.save();
    tubePath(ctx, pts, wl);
    foot.path(ctx);
    ctx.clip('nonzero');
    poly(ctx, bodyPts);
    ctx.strokeStyle = colour(C.base);
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    // a lower leg in front of the body (only when its paw is tucked up in front of it): its own edge
    // there; otherwise nothing of it shows on the body at all
    let pawIn = false;
    for (let i = 0, j = bodyPts.length - 1; i < bodyPts.length; j = i++) {
      const [xi, yi] = bodyPts[i];
      const [xj, yj] = bodyPts[j];
      if (yi > Lg.P[1] !== yj > Lg.P[1] && Lg.P[0] < ((xj - xi) * (Lg.P[1] - yi)) / (yj - yi) + xi) pawIn = !pawIn;
    }
    if (pawIn) {
      ctx.save();
      poly(ctx, bodyPts);
      ctx.clip();
      notThigh(U * 3);
      tubePath(ctx, ...lower);
      foot.path(ctx);
      edge(ctx);
      ctx.restore();
    }
    // the lower leg itself, clear of the thigh: a soft line inside its edge, its shade
    ctx.save();
    if (!pawIn) offBody();
    notThigh(U * 3);
    tubePath(ctx, ...lower);
    foot.path(ctx);
    ctx.fillStyle = colour(C.sh);
    ctx.fill('nonzero');
    tubePath(ctx, ...lower, -0.55);
    foot.path(ctx, -0.55);
    ctx.fillStyle = colour(C.base);
    ctx.fill('nonzero');
    tubePath(ctx, pts, wl, -0.55);
    foot.path(ctx, -0.55);
    ctx.clip('nonzero');
    backShade(ctx, Lg, colour(C.sh));
    ctx.restore();
  }
  return { tubePath, tubeInto, limb, poly, capsule, drawLeg };
}
