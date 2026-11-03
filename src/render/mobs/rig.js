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
export function part(key, w, h, shapes, pad = 6) {
  return sprite(`rig|${key}`, () => ({ w, h, shapes: shapes(), res: 2, soft: 'cel', crisp: true, selout: true, pad }));
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

// ---------- A rig from a spec ----------
// Most bosses are built from this: `makeRig(spec)` returns the `{ w, h, draw }` a design hangs on
// its art. The spec gives:
//   parts     in drawing order: { s: (a) => sprite, pivot: [x, y] in its box, parent: name or
//             null (the feet), at: (S) => [x, y] in the parent's space, rot: (S) => radians,
//             when: (a, S) => bool to skip it }
//   pose      (m, a) => goals for the channels (numbers), from the boss's moves: a.t (clock),
//             a.wp (walk phase, radians), a.walkW (0..1 walking), a.ph (attack phase), a.mood
//   springs   { channel: [k, c] } (others: [220, 20]); during a strike `fast` channels stiffen
//   follow    (S, a) => goals for loose channels that trail the others (capes, ears, tails),
//             sprung with `springs` too (default loose: [90, 7])
//   kick      { channel: speed } given when a blow lands on it
//   stride    px walked per step cycle
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
      // Each part's place: its parent's, then moved to `at` and turned by `rot`.
      const mats = {};
      const matOf = (p) => {
        if (typeof p === 'string') p = spec.byName[p];
        if (mats[p.name]) return mats[p.name];
        const base = p.parent ? matOf(spec.byName[p.parent]) : [1, 0, 0, 1, 0, 0];
        const [x, y] = p.at ? p.at(S, a) : [0, 0];
        const r = p.rot ? p.rot(S, a) : 0;
        const c = Math.cos(r);
        const s = Math.sin(r);
        const [A, B, C, D, E, F] = base;
        const tx = A * x + C * y + E;
        const ty = B * x + D * y + F;
        return (mats[p.name] = [A * c + C * s, B * c + D * s, -A * s + C * c, -B * s + D * c, tx, ty]);
      };
      spec.byName ??= Object.fromEntries(spec.parts.map((p) => [p.name, p]));
      const look = { flash: a.flash, alpha: a.alpha };
      ctx.save();
      if (a.flip) ctx.scale(-1, 1);
      if (spec.under) {
        ctx.save();
        spec.under(ctx, m, a, S, matOf);
        ctx.restore();
      }
      for (const p of spec.parts) {
        if (p.when && !p.when(a, S)) continue;
        const M = matOf(p);
        ctx.save();
        ctx.transform(...M);
        blit(ctx, p.s(a, S), -p.pivot[0], -p.pivot[1], look);
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
