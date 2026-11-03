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
