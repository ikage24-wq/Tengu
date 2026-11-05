// Per-character animation state that lives across frames: a distance-driven walk cycle, springs
// for hair and cape follow-through, the landing and take-off beats, and blinking.
// The renderer reads it; the world simulation never does.

// The gait changes with speed: a stroll covers less ground per cycle (two steps) than a run, so
// each planted foot moves exactly with the ground at either pace. `gait` (0 walk .. 1 run) is
// smoothed so the change between them doesn't pop.
// Strides are short for the chibi's little legs: a long one makes each planted foot slide
// further under the body than the legs are tall, and every step turns into the splits.
export const WALK_STRIDE = 17;
export const RUN_STRIDE = 38;
const gaitOf = (speed) => Math.max(0, Math.min(1, (speed - 50) / 50));
export const strideAt = (gait) => WALK_STRIDE + (RUN_STRIDE - WALK_STRIDE) * gait;

export function createAnim() {
  return {
    t: 0,
    dist: 0,
    climb: 0,
    // The hair is a two-link chain: the root follows the body, the tips follow the root.
    hair: 0, hairV: 0, hairTip: 0, hairTipV: 0,
    phase: 0, gait: 0,
    // The cape too: its root rides the shoulders, its hem chases the root on a softer spring.
    cape: 0, capeV: 0, capeTip: 0, capeTipV: 0,
    land: 0,
    rise: 0,
    wasGround: true,
    prevVy: 0,
    events: [],
    lastPhase: 0,
  };
}

// A damped spring toward `target` (stiffness k, damping c), solved exactly over dt, so it moves
// the same at 30, 60, or 144 fps and can't blow up on a long frame. Returns [x, v].
export function springStep(x, v, target, k, c, dt) {
  if (dt <= 0) return [x, v];
  const w = Math.sqrt(k);
  const z = c / (2 * w);
  const y = x - target;
  if (z >= 1) {
    // Critically damped (or more): settles without overshoot.
    const e = Math.exp(-w * dt);
    const j = v + w * y;
    return [target + e * (y + j * dt), e * (v - j * w * dt)];
  }
  const a = z * w;
  const wd = w * Math.sqrt(1 - z * z);
  const B = (v + a * y) / wd;
  const e = Math.exp(-a * dt);
  const cs = Math.cos(wd * dt);
  const sn = Math.sin(wd * dt);
  return [target + e * (y * cs + B * sn), e * ((B * wd - a * y) * cs - (y * wd + a * B) * sn)];
}

function spring(a, key, vKey, target, k, damp, dt) {
  [a[key], a[vKey]] = springStep(a[key], a[vKey], target, k, damp, dt);
}

// body: { vx, vy, onGround, rope, facing, y }. Returns this frame's events
// ('step', 'land', 'jump') so the renderer can puff dust.
export function stepAnim(a, body, dt) {
  a.t += dt;
  a.events = [];
  const localVx = body.vx * (body.facing || 1);

  if (body.onGround && !body.rope) {
    const speed = Math.abs(body.vx);
    // `maxGait` holds a body to a walk however fast it goes (one drawn small covers its stride faster).
    a.gait += (Math.min(gaitOf(speed), body.maxGait ?? 1) - a.gait) * (1 - Math.exp(-8 * dt));
    const before = Math.floor(a.phase * 2);
    a.dist += speed * dt;
    a.phase += (speed * dt) / strideAt(a.gait);
    if (speed > 8 && Math.floor(a.phase * 2) !== before) a.events.push('step');
    // (The stride is kept where it was when they stop, never snapped back to the start: a walker
    // easing in or out at a slow pace still steps with the ground it covers instead of gliding.)
    if (speed <= 8) a.dist = 0;
  }
  if (body.rope) a.climb = body.y;

  // Landing and take-off show in the pose (the knees give, the legs tuck), never by squashing or
  // stretching the figure: the player's standing rule is that the character keeps its shape.
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
  // Standing, a slow sway that the hair follows a beat behind the breath.
  const idleSway = Math.sin(a.t * 1.3 - 0.9) * 0.75 + Math.sin(a.t * 2.1) * 0.2;
  const fall = body.onGround ? 0 : Math.max(-1, Math.min(1, body.vy / 500));
  // Running, they stream out behind and ripple with each stride, the cape a beat after the hair.
  const stride = a.phase * Math.PI * 4;
  const ripple = body.onGround ? Math.sin(stride) * Math.abs(speed) : 0;
  const capeRipple = body.onGround ? Math.sin(stride - 1.2) * Math.abs(speed) : 0;
  spring(a, 'hair', 'hairV', -speed * 3.4 + idleSway + fall * 0.9 + ripple * 1.3, 140, 10, dt);
  // The tips chase the root on a softer spring, so a swing travels down the hair and overshoots.
  spring(a, 'hairTip', 'hairTipV', a.hair * 1.4, 48, 5.2, dt);
  spring(a, 'cape', 'capeV', -speed * 4 + idleSway * 0.8 + fall * 1.2 + capeRipple * 1.2, 90, 9.5, dt);
  // The hem chases the cape's root on a softer spring: it lags a start, swings past on a stop,
  // and settles a beat after the shoulders.
  spring(a, 'capeTip', 'capeTipV', a.cape * 1.15, 32, 4.6, dt);

  return a.events;
}

export function walkPhase(a) {
  return ((a.phase % 1) + 1) % 1;
}

// A walk's body bob as a sharpened triangle wave (a sine reads floaty): 0 at the low point just
// after each foot strikes, 1 at the passing pose. Two bobs per cycle.
export function walkBob(p, lag = 0) {
  const u = (((2 * p - 0.08 - lag) % 1) + 1) % 1;
  const tri = 1 - Math.abs(u - 0.5) * 2;
  return tri * tri * (3 - 2 * tri) * 0.4 + tri * 0.6;
}
