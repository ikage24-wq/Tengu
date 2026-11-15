// Ring Toss, Lantern Night's stall game (ui/festival-stall.js plays it). Three pegs stand on a board,
// near, middle and far - 1, 2 and 3 points; a power meter swings up and down; press (Space, Up or a
// click) to throw a ring as hard as it says. Right over a peg it drops on with a clack; a little off
// it clinks off the peg and rolls away. Ten rings; the meter swings a little faster with each.
// Tokens for the stall's prizes: one for each four points.
//
// Units are the play area's own: x from the thrower's spot on the left.

export const RING = { cost: 100, rings: 10, pegs: [[70, 1], [130, 2], [190, 3]], reach: 220, fly: 0.55, ringer: 6.5, clink: 13 };
export const ringTokens = (score) => Math.min(5, Math.floor(score / 4));
const meterSpeed = (n) => 1.1 + n * 0.09;

export function newRings() {
  return { phase: 'aim', t: 0, n: 0, score: 0, meter: 0, dir: 1, flying: null, on: [], off: [], last: null, lastAt: -9 };
}
// Where a ring thrown at power `k` (0-1) comes down.
export const landAt = (k) => 26 + k * (RING.reach - 26);
// One step: the meter swinging, a ring in the air coming down. Returns 'ringer' | 'clink' | 'miss' |
// 'done' | null.
export function tickRings(g, dt) {
  g.t += dt;
  if (g.phase === 'aim') {
    g.meter += g.dir * meterSpeed(g.n) * dt;
    if (g.meter >= 1 || g.meter <= 0) {
      g.meter = Math.max(0, Math.min(1, g.meter));
      g.dir = -g.dir;
    }
    return null;
  }
  if (g.phase !== 'fly') return null;
  const f = g.flying;
  if (g.t - f.t0 < RING.fly) return null;
  // Down it comes: on a peg, off one, or on the board.
  g.flying = null;
  const [peg, value] = RING.pegs.reduce((best, p) => (Math.abs(p[0] - f.x) < Math.abs(best[0] - f.x) ? p : best));
  const off = Math.abs(peg - f.x);
  let out;
  if (off <= RING.ringer) {
    g.score += value;
    g.on.push({ peg, t: g.t });
    out = 'ringer';
  } else {
    g.off.push({ x: f.x, peg, t: g.t, dir: Math.sign(f.x - peg) || 1, clink: off <= RING.clink });
    out = off <= RING.clink ? 'clink' : 'miss';
  }
  g.last = out;
  g.lastAt = g.t;
  g.n += 1;
  if (g.n >= RING.rings) {
    g.phase = 'done';
    return 'done';
  }
  g.phase = 'aim';
  return out;
}
export function throwRing(g) {
  if (g.phase !== 'aim') return false;
  g.phase = 'fly';
  g.flying = { k: g.meter, x: landAt(g.meter), t0: g.t };
  return true;
}
