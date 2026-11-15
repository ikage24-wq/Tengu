// Dango Stack, the Moon Viewing festival stall's game (ui/festival-stall.js plays it, world/
// garden-festival.js opens the stall). A tall skewer stands in the middle; a dango swings back and
// forth above it, a little faster each time; press (Space, Up, or a click) to drop it onto the stack.
// Dropped right on top it sits straight - a perfect drop even steadies the stack - but off to one
// side it sits off-centre and the whole stack leans that way; too far off and it rolls away (a
// miss). Three misses, or the stack leaning over too far, and it's over; sixteen high and the
// skewer's full. Every fifth is a golden moon dango, worth one more. Tokens for the stall's prizes:
// one for each four.
//
// Units are the play area's own: x across from the skewer (0), the dango's radius R.

export const STACK = { cost: 100, R: 7, swing: 82, lives: 3, max: 16, lean: 17, fall: 0.26 };
export const tokensFor = (score) => Math.min(5, Math.floor(score / 4));
const speedAt = (n) => 62 + n * 8.5;

export function newStack() {
  return { phase: 'swing', t: 0, n: 0, score: 0, lives: STACK.lives, lean: 0, topX: 0, x: -STACK.swing, dir: 1, tower: [], falling: null, misses: [], perfects: 0, last: null, toppleAt: null };
}
// The swinging dango moving, a dropped one falling and landing. Returns what happened this step:
// 'land' | 'perfect' | 'miss' | 'topple' | 'full' | null.
export function tickStack(g, dt) {
  g.t += dt;
  if (g.phase === 'swing') {
    g.x += g.dir * speedAt(g.n) * dt;
    if (Math.abs(g.x) > STACK.swing) {
      g.x = Math.sign(g.x) * STACK.swing;
      g.dir = -g.dir;
    }
    return null;
  }
  if (g.phase === 'fall') {
    const f = g.falling;
    f.t += dt;
    if (f.t < STACK.fall) return null;
    return land(g, f.x);
  }
  if (g.phase === 'topple' && g.t - g.toppleAt > 1.4) g.phase = 'done';
  return null;
}
export function dropDango(g) {
  if (g.phase !== 'swing') return false;
  g.phase = 'fall';
  g.falling = { x: g.x, t: 0, gold: (g.n + 1) % 5 === 0 };
  return true;
}
function land(g, x) {
  const gold = g.falling.gold;
  g.falling = null;
  const off = x - g.topX;
  if (Math.abs(off) > STACK.R * 1.25) {
    // Off the edge: it rolls away.
    g.lives -= 1;
    g.misses.push({ x, t: g.t, dir: Math.sign(off) || 1 });
    g.last = 'miss';
    g.phase = g.lives <= 0 ? 'done' : 'swing';
    return 'miss';
  }
  const perfect = Math.abs(off) < 1.8;
  const at = perfect ? g.topX : x;
  g.tower.push({ dx: at, gold });
  g.n += 1;
  g.score += gold ? 2 : 1;
  g.topX = at;
  // (Off-centre, it leans the stack; a perfect one steadies it.)
  g.lean = perfect ? g.lean * 0.6 : g.lean + off * 0.9;
  if (perfect) g.perfects += 1;
  g.last = perfect ? 'perfect' : 'land';
  if (Math.abs(g.lean) > STACK.lean) {
    g.phase = 'topple';
    g.toppleAt = g.t;
    g.last = 'topple';
    return 'topple';
  }
  if (g.n >= STACK.max) {
    g.phase = 'done';
    g.last = 'full';
    return 'full';
  }
  g.phase = 'swing';
  // (The next comes in from the side it's further from.)
  g.x = (g.x > 0 ? -1 : 1) * STACK.swing;
  g.dir = g.x > 0 ? -1 : 1;
  return perfect ? 'perfect' : 'land';
}
