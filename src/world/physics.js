// Player movement: walking, jumping, one-way ledges, ropes, drop-through, and knockback.
// Bodies use center-x and feet-y, so "standing on a surface" means body.y === surface.y.

export const GRAVITY = 1500;
export const WALK_SPEED = 125; // at 100% speed
export const JUMP_SPEED = 550; // at 100% jump, about 100px high
export const CLIMB_SPEED = 95;
export const MAX_FALL = 700;
const ROPE_GRAB = 10;
const DROP_TIME = 0.22;

export function surfacesOf(map) {
  return [{ x1: 0, x2: map.width, y: map.groundY, ground: true }, ...map.platforms.map((p) => ({ x1: p.x, x2: p.x + p.w, y: p.y, ground: false }))];
}

export function createBody(x, y) {
  return {
    x, y, w: 22, h: 46, vx: 0, vy: 0,
    onGround: true, surface: null, rope: null, facing: 1,
    dropTimer: 0, knockTimer: 0,
  };
}

function ropeAt(map, body, wantDown) {
  return map.ropes.find((r) => {
    if (Math.abs(body.x - r.x) > ROPE_GRAB) return false;
    // Grab from below or mid-rope with Up; from the top ledge with Down.
    if (wantDown) return Math.abs(body.y - r.top) < 4;
    return body.y > r.top + 2 && body.y <= r.bottom + 2;
  });
}

// intent: { left, right, up, down, jump } booleans. `speed` and `jump` are percentages (100 = normal).
export function stepBody(body, map, intent, dt, { speed = 100, jump = 100 } = {}) {
  body.dropTimer = Math.max(0, body.dropTimer - dt);
  body.knockTimer = Math.max(0, body.knockTimer - dt);

  // ----- On a rope -----
  if (body.rope) {
    const r = body.rope;
    if (intent.jump && (intent.left || intent.right)) {
      body.rope = null;
      body.vx = (intent.right ? 1 : -1) * WALK_SPEED * 0.9;
      body.vy = -JUMP_SPEED * 0.55;
      body.facing = intent.right ? 1 : -1;
      return;
    }
    const dir = (intent.down ? 1 : 0) - (intent.up ? 1 : 0);
    body.y += dir * CLIMB_SPEED * dt;
    body.vx = 0;
    body.vy = 0;
    if (body.y <= r.top) {
      body.y = r.top;
      body.rope = null;
      body.onGround = true;
      body.surface = surfacesOf(map).find((s) => s.y === r.top && body.x >= s.x1 && body.x <= s.x2) ?? null;
    } else if (body.y >= r.bottom) {
      body.y = r.bottom;
      body.rope = null;
      body.onGround = true;
      body.surface = surfacesOf(map).find((s) => s.y === r.bottom && body.x >= s.x1 && body.x <= s.x2) ?? null;
    }
    return;
  }

  // ----- Grab a rope -----
  if ((intent.up || (intent.down && body.onGround)) && !intent.jump) {
    const r = ropeAt(map, body, intent.down && !intent.up);
    if (r) {
      body.rope = r;
      body.x = r.x;
      body.vx = 0;
      body.vy = 0;
      body.onGround = false;
      if (intent.down) body.y = r.top + 2;
      return;
    }
  }

  // ----- Walk / air control -----
  const move = (intent.right ? 1 : 0) - (intent.left ? 1 : 0);
  if (body.knockTimer <= 0) {
    const target = move * WALK_SPEED * (speed / 100);
    const accel = body.onGround ? 1600 : 900;
    if (body.vx < target) body.vx = Math.min(target, body.vx + accel * dt);
    else if (body.vx > target) body.vx = Math.max(target, body.vx - accel * dt);
    if (move) body.facing = move;
  }

  // ----- Jump / drop through -----
  if (intent.jump && body.onGround) {
    if (intent.down && body.surface && !body.surface.ground) {
      body.dropTimer = DROP_TIME;
      body.onGround = false;
      body.y += 2;
    } else {
      body.vy = -JUMP_SPEED * Math.sqrt(jump / 100);
      body.onGround = false;
    }
  }

  // ----- Gravity and landing -----
  const prevY = body.y;
  body.vy = Math.min(MAX_FALL, body.vy + GRAVITY * dt);
  body.x += body.vx * dt;
  body.y += body.vy * dt;
  body.x = Math.max(body.w / 2, Math.min(map.width - body.w / 2, body.x));

  body.onGround = false;
  if (body.vy >= 0) {
    for (const s of surfacesOf(map)) {
      if (!s.ground && body.dropTimer > 0) continue;
      if (body.x < s.x1 || body.x > s.x2) continue;
      if (prevY <= s.y + 1 && body.y >= s.y) {
        body.y = s.y;
        body.vy = 0;
        body.onGround = true;
        body.surface = s;
        break;
      }
    }
  }
  if (!body.onGround) body.surface = null;
}

export function knockBack(body, fromX) {
  body.rope = null;
  body.vx = (body.x >= fromX ? 1 : -1) * 140;
  body.vy = -260;
  body.onGround = false;
  body.knockTimer = 0.35;
}
