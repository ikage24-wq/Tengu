// Petal Catch, Blossom Day's stall game (ui/festival-stall.js plays it). Petals drift down from a
// branch of cherry blossom, swaying as they fall, faster as it goes on; move the basket under them
// (Left and Right, or the mouse over the play area) to catch them - a gold petal now and then is worth
// two. Thirty seconds. Tokens for the stall's prizes: one for each four points.
//
// Units are the play area's own: x across from its middle, y down from its top.

import { seededRandom } from '../data/mochi-genes.js';

export const PETAL = { cost: 100, time: 30, half: 128, basket: 14, speed: 170, catchY: 128, bottom: 150 };
export const petalTokens = (score) => Math.min(5, Math.floor(score / 4));

export function newCatch(seed = Date.now()) {
  return { phase: 'play', t: 0, score: 0, caught: 0, missed: 0, x: 0, petals: [], next: 0.3, rng: seededRandom(Math.floor(seed) % 1e9), last: null, lastAt: -9, pops: [] };
}
// One step: the basket moved (`input`: { left, right } held, or `aim`, an x to move toward), petals
// falling, caught or let fall. Returns 'catch' | 'gold' | 'done' | null.
export function tickCatch(g, dt, input = {}) {
  if (g.phase !== 'play') return null;
  g.t += dt;
  const want = input.aim != null ? Math.sign(input.aim - g.x) * Math.min(1, Math.abs(input.aim - g.x) / 6) : (input.right ? 1 : 0) - (input.left ? 1 : 0);
  g.x = Math.max(-PETAL.half + PETAL.basket, Math.min(PETAL.half - PETAL.basket, g.x + want * PETAL.speed * dt));
  if (g.t >= g.next && g.t < PETAL.time - 1.5) {
    g.petals.push({ x0: (g.rng() * 2 - 1) * (PETAL.half - 12), y: -6, vy: 34 + g.t * 1.6 + g.rng() * 14, sway: 6 + g.rng() * 12, ph: g.rng() * 6, gold: g.rng() < 0.12, done: false });
    g.next = g.t + (0.55 - (g.t / PETAL.time) * 0.25) * (0.6 + 0.8 * g.rng());
  }
  let out = null;
  for (const p of g.petals) {
    if (p.done) continue;
    p.y += p.vy * dt;
    p.x = p.x0 + Math.sin(g.t * 2.2 + p.ph) * p.sway;
    if (p.y >= PETAL.catchY && p.y - p.vy * dt < PETAL.catchY && Math.abs(p.x - g.x) <= PETAL.basket + 3) {
      p.done = true;
      g.caught += 1;
      g.score += p.gold ? 2 : 1;
      out = p.gold ? 'gold' : 'catch';
      g.last = out;
      g.lastAt = g.t;
      g.pops.push({ x: p.x, t: g.t, gold: p.gold });
    } else if (p.y > PETAL.bottom) {
      p.done = true;
      g.missed += 1;
    }
  }
  g.petals = g.petals.filter((p) => !p.done);
  g.pops = g.pops.filter((q) => g.t - q.t < 0.7);
  if (g.t >= PETAL.time) {
    g.phase = 'done';
    return 'done';
  }
  return out;
}
