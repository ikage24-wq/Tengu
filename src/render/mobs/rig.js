// The boss rig (2026-11-03, the boss reanimation): a cutout skeleton for the big dungeon bosses.
// Instead of a handful of whole-body frames, a rigged boss is a set of parts (body, head, arms,
// props...), each drawn once as its own crisp sprite in the same pixel style as every other
// monster, then placed and turned every frame by a skeleton. Keys are blended with eases, and the
// loose parts (caps, crowns, skirts, tails, ears) ride on springs, so they trail the body, overshoot
// and settle: weight and follow-through instead of snapping between drawings. Nothing is squashed
// or stretched; all motion is bones turning and moving.
//
// A rigged design (render/mobs/*.js) has `rig: { w, h, draw(ctx, m, a) }` beside its frames; the
// frames stay for anything that still wants a still sprite (portraits, galleries), and drawMonster
// (render/monsters.js) hands the live drawing to the rig.

import { sprite, blit } from '../pixel.js';
import { springStep } from '../animator.js';
import { limb } from './critter.js';

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (u) => {
  const k = clamp(u, 0, 1);
  return k * k * (3 - 2 * k);
};
export const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
export const easeIn = (u) => clamp(u, 0, 1) ** 3;

// One part's sprite: `shapes()` drawn in a w x h box (with `pad` room round it for anything that
// pokes out), cached like any sprite.
// (The box is rounded up to whole pixels: the rasterizer needs them.)
export function part(key, w, h, shapes, pad = 6, res = 2) {
  return sprite(`rig|${key}`, () => ({ w: Math.ceil(w), h: Math.ceil(h), shapes: shapes(), res, soft: 'cel', crisp: true, selout: true, pad }));
}

// The same part with no outline at all, for the second pass of `outerOutline`.
export function partBare(key, w, h, shapes, pad = 6, res = 2) {
  return sprite(`rig|${key}|bare`, () => ({ w: Math.ceil(w), h: Math.ceil(h), shapes: shapes(), res, soft: 'cel', crisp: true, bare: true, pad }));
}

// Outer outline only (2026-11-12, the look the player chose on the Red Panda): every part with a
// bare twin (`b`) is drawn twice, first outlined, then all of them again bare, in the same order,
// over the top. Outlines grow outward from each shape, so the bare pass covers every outline that
// falls inside the creature and only its outer edge keeps a line: one soft shape, not a stack of
// pieces. A part marked `top` (a face) is drawn only in the second pass, in its place.
export function outerOutline(parts) {
  const first = parts.filter((p) => !p.top);
  const second = parts.filter((p) => p.s && (p.top || p.b)).map((p) => (p.top ? p : { ...p, name: `${p.name}~bare`, s: p.b }));
  return [...first, ...second];
}

// Draws a part with its pivot (in its box) at (x, y), turned by `ang` radians.
export function put(ctx, s, pivot, x, y, ang, look) {
  ctx.save();
  ctx.translate(x, y);
  if (ang) ctx.rotate(ang);
  blit(ctx, s, -pivot[0], -pivot[1], look);
  ctx.restore();
}

// A named spring in a rig's state: eases `goal` in with overshoot (k stiffness, c damping), or
// critically when c is high. Returns the current value.
export function spring(st, name, goal, k, c, dt) {
  const v = st[name] ?? (st[name] = { x: goal, v: 0 });
  [v.x, v.v] = springStep(v.x, v.v, goal, k, c, dt);
  return v.x;
}
// A kick to a spring's speed (a hit knocking the head back).
export function kick(st, name, dv) {
  if (st[name]) st[name].v += dv;
}

// Blends pose objects of numbers: sum of pose * weight over the weights given.
export function blend(list) {
  const out = {};
  let total = 0;
  for (const [p, w] of list) {
    if (w <= 0) continue;
    total += w;
    for (const [k, v] of Object.entries(p)) out[k] = (out[k] ?? 0) + v * w;
  }
  if (total > 0) for (const k of Object.keys(out)) out[k] /= total;
  return out;
}

// Where an attack is, for any rigged boss: `antic` 0..1 through the wind-up, `strike` 0..1 into
// the blow and back out, `since` seconds since it landed, `atk` whether the face should be fierce.
export function attackPhase(m, now, recover = 0.55) {
  const wind = Math.max(m.special?.warn > 0 ? m.special.warn : 0, m.windup > 0 ? m.windup : 0);
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const since = now - (m.attackAt ?? -9);
  if (wind > 0) {
    const u = smooth(1 - wind / total);
    return { antic: u, strike: 0, since: -1, atk: u > 0.4 };
  }
  if (since >= 0 && since < 0.3 + recover) {
    const strike = since < 0.07 ? easeOut(since / 0.07) : since < 0.3 ? 1 : 1 - smooth((since - 0.3) / recover);
    return { antic: since < 0.07 ? 1 - strike : 0, strike, since, atk: since < 0.4 };
  }
  return { antic: 0, strike: 0, since: -1, atk: false };
}

// ---------- Soft layers ----------
// A part marked `soft` is a loose layer (a coat panel, a pocket flap, a collar, a petal, a lock of
// hair, a dangling leg) that swings on its own, physically, on top of whatever `rot` poses it to:
// its attach point is followed through the world every frame, and the push of that point's
// acceleration (the body bobbing, stepping, landing, being hit, walking off and stopping) and of
// its parent's turning swings it about its pivot on a damped spring, so every layer of an outfit
// trails, overshoots and settles by itself, with nothing written per move. `soft` holds:
//   dir      [x, y] from the pivot to the layer's middle, in its box (default straight down);
//            a layer hanging straight down only feels sideways pushes, one sticking out also
//            feels the bobbing (a flap pointing out bounces as she lands)
//   k, c     its spring (stiffness 140, damping 9): low k is floppy, low c wobbles longer
//   gain     how hard the body's moves push it (1)
//   turn     how much it lags its parent's turning (0..1, 0.8)
//   hang     how much it keeps hanging straight down as its parent tilts (0..1, 0)
//   max      the most it swings, degrees (32)
//   flutter  a slow drift of its own in the air, degrees (0), at `hz` (0.7)
// (Integrated once per frame per layer, in small steps; the outlined and bare twins of a layer
// share one swing.)
const softKey = (p) => p.soft.key ?? p.name.replace(/~.*$/, '');
const wrapAngle = (v) => Math.atan2(Math.sin(v), Math.cos(v));
function softSwing(p, base, x, y, pose, m, a, st, swung) {
  const key = softKey(p);
  if (key in swung) return swung[key];
  const o = p.soft;
  const s = ((st._soft ??= {})[key] ??= { th: 0, w: 0 });
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  // Where the layer hangs from, in the world (the rig's space plus the monster's own travel).
  const sx = a.flip ? -1 : 1;
  const px = base[0] * x + base[2] * y + base[4] + sx * (m.x ?? 0);
  const py = base[1] * x + base[3] * y + base[5] + (m.y ?? 0);
  const pa = Math.atan2(base[1], base[0]);
  let ax = 0;
  let ay = 0;
  let aa = 0;
  const steady = s.px !== undefined && dt > 0 && s.flip === a.flip && Math.hypot(px - s.px, py - s.py) < 24;
  if (steady) {
    const vx = (px - s.px) / dt;
    const vy = (py - s.py) / dt;
    const pw = wrapAngle(pa - s.pa) / dt;
    if (s.vx !== undefined) {
      // (Smoothed over a few frames: a sharp bounce or a landing is a firm push, never a one-frame
      // spike that slams a small flap against its stop.)
      const f = Math.min(1, dt * 22);
      s.ax = lerp(s.ax ?? 0, clamp((vx - s.vx) / dt, -1600, 1600), f);
      s.ay = lerp(s.ay ?? 0, clamp((vy - s.vy) / dt, -1600, 1600), f);
      s.aa = lerp(s.aa ?? 0, clamp((pw - s.pw) / dt, -250, 250), f);
      ax = s.ax;
      ay = s.ay;
      aa = s.aa;
    }
    Object.assign(s, { vx, vy, pw });
  } else Object.assign(s, { vx: undefined, vy: undefined, pw: 0, ax: 0, ay: 0, aa: 0 });
  Object.assign(s, { px, py, pa, flip: a.flip });
  const [dx, dy] = o.dir ?? [0, 1];
  const len = Math.max(1, Math.hypot(dx, dy));
  const k = o.k ?? 140;
  const c = o.c ?? 9;
  const gain = o.gain ?? 1;
  const turn = o.turn ?? 0.8;
  const max = ((o.max ?? 32) * Math.PI) / 180;
  const flutter = (((o.flutter ?? 0) * Math.PI) / 180) * Math.sin((a.t ?? 0) * TAU * (o.hz ?? 0.7) + (key.length * 1.7) % TAU);
  const goal = -(o.hang ?? 0) * wrapAngle(pa + pose) + flutter;
  // Small steps, so a slow frame never throws a layer about.
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const ang = pa + pose + s.th;
    const ux = (Math.cos(ang) * dx - Math.sin(ang) * dy) / len;
    const uy = (Math.sin(ang) * dx + Math.cos(ang) * dy) / len;
    // The body's push on the layer (it is left behind as its attach point speeds up), and its
    // parent turning under it.
    const push = (gain * (uy * ax - ux * ay)) / len;
    const acc = -k * (s.th - goal) - c * s.w + push - turn * aa;
    s.w += acc * h;
    s.th += s.w * h;
    // (A soft stop at the limit, never a hard clamp.)
    if (Math.abs(s.th) > max) {
      s.th = Math.sign(s.th) * max;
      s.w *= -0.3;
    }
  }
  if (!Number.isFinite(s.th)) Object.assign(s, { th: 0, w: 0 });
  return (swung[key] = s.th);
}

// ---------- A rig from a spec ----------
// Most bosses are built from this: `makeRig(spec)` returns the `{ w, h, draw }` a design hangs on
// its art. The spec gives:
//   parts     in drawing order: { name, s: (a, S) => sprite (none: a bare joint), pivot: [x, y]
//             in its box (or (a, S) => [x, y]), alpha: (a, S) => 0..1, clip: (a, S) => [x, y, w, h]
//             around the pivot, parent: name or
//             null (the feet), at: (S) => [x, y] in the parent's space, rot: (S) => radians,
//             when: (a, S) => bool to skip it }
//   pose      (m, a) => goals for the channels (numbers), from the boss's moves: a.t (clock),
//             a.wp (walk phase, radians), a.walkW (0..1 walking), a.ph (attack phase), a.mood
//   springs   { channel: [k, c] } (others: [220, 20]); during a strike `fast` channels stiffen
//   follow    (S, a) => goals for loose channels that trail the others (capes, ears, tails),
//             sprung with `springs` too (default loose: [90, 7])
//   kick      { channel: speed } given when a blow lands on it
//   stride    px walked per step cycle
//   (a part may also be `soft`: a loose layer swinging on its own physics; see Soft layers above,
//   and `paint: (ctx, a, S)` for live extras drawn on it in its own space)
//   fx        (ctx, m, a, S, mat) live extras over the parts (glows, rings, trails)
//   under     (ctx, m, a, S, mat) live extras under the parts
export function makeRig(spec) {
  const { w, h } = spec;
  return {
    w,
    h,
    draw(ctx, m, a) {
      const st = (a.mo.rig ??= {});
      const dt = a.dt;
      a.walkW = spring(st, '_walk', a.moving ? 1 : 0, 60, 16, dt);
      a.wp = ((m.odo ?? 0) / (spec.stride ?? 56)) * TAU;
      a.ph = attackPhase(m, a.now, spec.recover);
      a.face = m.hp <= 0 ? 'dead' : a.ph.atk ? 'angry' : a.mood;
      a.atk = a.ph.atk ? 1 : 0;
      // (Turning round: the moment it flips, a little lean and dip, so the loose bits swing on.)
      if (st._flip !== undefined && st._flip !== a.flip && m.hp > 0) for (const [k, v] of Object.entries(spec.turnKick ?? { tilt: 160, lift: -40 })) kick(st, k, v);
      st._flip = a.flip;
      if (a.mo.hitT !== st._hit) {
        st._hit = a.mo.hitT;
        if (m.hp > 0) for (const [k, v] of Object.entries(spec.kick ?? { tilt: -2 })) kick(st, k, v);
      }
      const fast = a.ph.strike > 0 || a.ph.antic > 0.8;
      const S = {};
      const sp = (name, goal, def) => {
        const [k, c] = spec.springs?.[name] ?? def;
        const f = fast && spec.fast?.includes(name);
        S[name] = spring(st, name, goal, f ? Math.max(k, 800) : k, f ? Math.max(c, 44) : c, dt);
      };
      for (const [name, goal] of Object.entries(spec.pose(m, a))) sp(name, goal, [220, 20]);
      if (spec.follow) for (const [name, goal] of Object.entries(spec.follow(S, a))) sp(name, goal, [90, 7]);
      // Each part's place: its parent's, then moved to `at` and turned by `rot` (and, for a soft
      // layer, by its own swing).
      const mats = {};
      const swung = {};
      const matOf = (p) => {
        if (typeof p === 'string') p = spec.byName[p];
        if (mats[p.name]) return mats[p.name];
        const base = p.parent ? matOf(spec.byName[p.parent]) : [1, 0, 0, 1, 0, 0];
        const [x, y] = p.at ? p.at(S, a) : [0, 0];
        let r = p.rot ? p.rot(S, a) : 0;
        if (p.soft) r += softSwing(p, base, x, y, r, m, a, st, swung);
        const c = Math.cos(r);
        const s = Math.sin(r);
        const [A, B, C, D, E, F] = base;
        const tx = A * x + C * y + E;
        const ty = B * x + D * y + F;
        return (mats[p.name] = [A * c + C * s, B * c + D * s, -A * s + C * c, -B * s + D * c, tx, ty]);
      };
      spec.byName ??= Object.fromEntries(spec.parts.map((p) => [p.name, p]));
      // (`soft` in the spec: its parts filtered smoothly, so turning them never stair-steps.)
      const look = { flash: a.flash, alpha: a.alpha, soft: Boolean(spec.soft) };
      ctx.save();
      if (a.flip) ctx.scale(-1, 1);
      if (spec.under) {
        ctx.save();
        spec.under(ctx, m, a, S, matOf);
        ctx.restore();
      }
      for (const p of spec.parts) {
        // (A part with no picture is just a joint for others to hang from.)
        if (!p.s || (p.when && !p.when(a, S))) continue;
        // (A part may fade in and out (`alpha`), and may show only a window of itself (`clip`, a
        // rect around its pivot): one drawing cut in two at a seam a sash or a belt hides.)
        const lk = p.alpha ? { ...look, alpha: look.alpha * clamp(p.alpha(a, S), 0, 1) } : look;
        if (lk.alpha <= 0.01) continue;
        const M = matOf(p);
        const s = p.s(a, S);
        const pv = typeof p.pivot === 'function' ? p.pivot(a, S) : p.pivot;
        ctx.save();
        ctx.transform(...M);
        if (p.clip) {
          const [cx, cy, cw, ch] = p.clip(a, S);
          ctx.beginPath();
          ctx.rect(cx, cy, cw, ch);
          ctx.clip();
        }
        blit(ctx, s, -pv[0], -pv[1], lk);
        // (`paint`: live extras drawn on the part about its joint, under every part after it.)
        if (p.paint) {
          ctx.globalAlpha = lk.alpha ?? 1;
          p.paint(ctx, a, S);
        }
        ctx.restore();
      }
      if (spec.fx) {
        ctx.save();
        spec.fx(ctx, m, a, S, matOf);
        ctx.restore();
      }
      ctx.restore();
    },
  };
}

// Common motion: a breath (-1..1), a walk's step (sin, cos), and the poses blended for the boss's
// state. `poses` holds idle, walk, antic, strike (any can be functions of the clock).
export function stateBlend(a, idle, walk, antic, strike) {
  const rest = Math.max(0, 1 - a.ph.antic - a.ph.strike);
  const base = blend([[idle, 1 - a.walkW], [walk, a.walkW]]);
  return blend([[base, rest], [antic, a.ph.antic], [strike, a.ph.strike]]);
}

// Draws something in a part's space, by its name (a glow on a staff's crystal...).
export function inPart(ctx, matOf, part, fn) {
  ctx.save();
  ctx.transform(...matOf(part));
  fn();
  ctx.restore();
}

// ---------- Chains ----------
// Bendy things (necks, tails, tentacles, locks of hair) as a chain of tapered segments, each
// hung from the end of the one before and turned by its own channel, so a wave runs down them and
// the tips trail. `segs` is [[length, width at the root, width at the tip], ...]; `shape(i, len,
// w0, w1)` draws segment i along +x from (w0 / 2 + 2, h / 2) (default: a plain tapered limb in
// `color`); `rot(S, a, i)` turns it (the first one relative to the parent, the rest relative to
// the segment before). Returns parts named `${name}0`, `${name}1`...
export function chainParts(name, { parent, at, segs, key, color, shape, rot, when }) {
  return segs.map(([len, w0, w1], i) => {
    const h = Math.ceil(Math.max(w0, w1) + 4);
    const x0 = w0 / 2 + 2;
    const s = () => part(`${key}|seg${i}`, Math.ceil(len + w0 / 2 + w1 / 2 + 4), h, () => (shape ? shape(i, len, w0, w1, x0, h / 2) : limb([x0, h / 2], [x0 + len, h / 2], w0, w1, color)));
    return { name: `${name}${i}`, parent: i ? `${name}${i - 1}` : parent, pivot: [x0, h / 2], at: i ? () => [segs[i - 1][0], 0] : at, rot: (S, a) => rot(S, a, i), s, when };
  });
}
