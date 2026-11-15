// Snowball Toss, the Snow Lantern Festival stall's game (ui/festival-stall.js plays it). Behind a low
// snow wall are three holes; little snow-Mochi heads pop up from them for a moment and duck down
// again, a golden one now and then. Your aim - a ring - sweeps back and forth along the wall; press
// (Space, Up or a click) and a snowball flies to where it is. Hit a head while it's up: a point (two
// for a golden one). Thirty seconds; the heads come quicker as it goes. Tokens for the stall's
// prizes: one for each four points.
//
// Units are the play area's own: x across from its middle.

import { seededRandom } from '../data/mochi-genes.js';

export const TOSS = { cost: 100, time: 30, holes: [-62, 0, 62], swing: 90, fly: 0.3, cool: 0.32, reach: 15 };
export const tossTokens = (score) => Math.min(5, Math.floor(score / 4));

export function newToss(seed = Date.now()) {
  return { phase: 'play', t: 0, score: 0, hits: 0, throws: 0, x: -TOSS.swing, dir: 1, targets: [], balls: [], next: 0.6, rng: seededRandom(Math.floor(seed) % 1e9), lastThrow: -9, last: null, lastAt: -9 };
}
// How long a head stays up, and the wait before the next, as the half-minute goes on.
const upFor = (g) => 1.7 - (g.t / TOSS.time) * 0.7;
const gapFor = (g) => 0.9 - (g.t / TOSS.time) * 0.45;
// Whether target `q` is up enough to hit at time t.
export const isUp = (q, t) => !q.hit && t >= q.at + 0.15 && t <= q.until;

// The aim sweeping, heads popping up and down, snowballs landing. Returns 'hit' | 'gold' | 'miss' |
// 'done' | null for what happened this step.
export function tickToss(g, dt) {
  if (g.phase !== 'play') return null;
  g.t += dt;
  const speed = 110 + g.score * 2.5;
  // (The aim eases round at each end of its sweep, never bouncing off a wall.)
  const edge = Math.min(1, (TOSS.swing - Math.abs(g.x)) / (TOSS.swing * 0.2));
  g.x += g.dir * speed * (0.4 + 0.6 * edge * edge * (3 - 2 * edge)) * dt;
  if (Math.abs(g.x) > TOSS.swing) {
    g.x = Math.sign(g.x) * TOSS.swing;
    g.dir = -g.dir;
  }
  // A head pops up at a free hole.
  if (g.t >= g.next && g.t < TOSS.time - 0.8) {
    const free = TOSS.holes.filter((h) => !g.targets.some((q) => q.hole === h && g.t <= q.until + 0.3));
    if (free.length) {
      const hole = free[Math.floor(g.rng() * free.length)];
      g.targets.push({ hole, at: g.t, until: g.t + upFor(g), gold: g.rng() < 0.15, hit: null });
    }
    g.next = g.t + gapFor(g) * (0.6 + 0.8 * g.rng());
  }
  g.targets = g.targets.filter((q) => g.t <= Math.max(q.until, q.hit ?? 0) + 0.6);
  let out = null;
  for (const b of g.balls) {
    if (b.done || g.t - b.t0 < TOSS.fly) continue;
    b.done = true;
    const q = g.targets.find((p) => Math.abs(p.hole - b.x) <= TOSS.reach && isUp(p, g.t));
    if (q) {
      q.hit = g.t;
      g.score += q.gold ? 2 : 1;
      g.hits += 1;
      out = q.gold ? 'gold' : 'hit';
      b.hitAt = q.hole;
    } else out = 'miss';
    g.last = out;
    g.lastAt = g.t;
  }
  g.balls = g.balls.filter((b) => g.t - b.t0 < TOSS.fly + 0.6);
  if (g.t >= TOSS.time) {
    g.phase = 'done';
    return 'done';
  }
  return out;
}
export function throwToss(g) {
  if (g.phase !== 'play' || g.t - g.lastThrow < TOSS.cool) return false;
  g.balls.push({ x: g.x, t0: g.t });
  g.throws += 1;
  g.lastThrow = g.t;
  return true;
}
