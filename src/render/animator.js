// Per-character animation state that lives across frames: a distance-driven walk cycle, springs
// for hair and cape follow-through, landing squash, blinking, and the weapon trail.
// The renderer reads it; the world simulation never does.

const STRIDE = 44; // pixels walked per full cycle (two steps)

export function createAnim() {
  return {
    t: 0,
    dist: 0,
    climb: 0,
    hair: 0, hairV: 0,
    cape: 0, capeV: 0,
    land: 0,
    rise: 0,
    wasGround: true,
    prevVy: 0,
    trail: [],
    events: [],
    lastPhase: 0,
  };
}

// Critically-damped-ish spring toward `target`.
function spring(a, key, vKey, target, k, damp, dt) {
  a[vKey] += ((target - a[key]) * k - a[vKey] * damp) * dt;
  a[key] += a[vKey] * dt;
}

// body: { vx, vy, onGround, rope, facing, y }. Returns this frame's events
// ('step', 'land', 'jump') so the renderer can puff dust.
export function stepAnim(a, body, dt) {
  a.t += dt;
  a.events = [];
  const localVx = body.vx * (body.facing || 1);

  if (body.onGround && !body.rope) {
    const before = Math.floor((a.dist / STRIDE) * 2);
    a.dist += Math.abs(body.vx) * dt;
    if (Math.abs(body.vx) > 8 && Math.floor((a.dist / STRIDE) * 2) !== before) a.events.push('step');
    if (Math.abs(body.vx) <= 8) a.dist = 0;
  }
  if (body.rope) a.climb = body.y;

  if (!a.wasGround && body.onGround && !body.rope && a.prevVy > 120) {
    a.land = Math.min(0.16, 0.08 + a.prevVy / 6000);
    a.events.push('land');
  }
  if (a.wasGround && !body.onGround && body.vy < -100 && !body.rope) {
    a.rise = 0.12;
    a.events.push('jump');
  }
  a.land = Math.max(0, a.land - dt);
  a.rise = Math.max(0, a.rise - dt);
  a.wasGround = body.onGround || Boolean(body.rope);
  a.prevVy = body.vy;

  // Hair and cape trail behind motion and float when falling.
  const speed = Math.max(-1, Math.min(1, localVx / 125));
  const idleSway = Math.sin(a.t * 1.3) * 0.5;
  const fall = body.onGround ? 0 : Math.max(-1, Math.min(1, body.vy / 500));
  spring(a, 'hair', 'hairV', -speed * 2.2 + idleSway + fall * 0.6, 140, 11, dt);
  spring(a, 'cape', 'capeV', -speed * 3.2 + idleSway * 0.8 + fall * 1.2, 70, 7, dt);

  for (const p of a.trail) p.age += dt;
  a.trail = a.trail.filter((p) => p.age < 0.14);
  return a.events;
}

export function walkPhase(a) {
  return (a.dist / STRIDE) % 1;
}
