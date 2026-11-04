// Player movement: walking, jumping, one-way ledges, ropes, drop-through, and knockback, and a
// map's moving parts (bounce flowers, updrafts, drifting ledges).
// Bodies use center-x and feet-y, so "standing on a surface" means body.y === surface.y.

export const GRAVITY = 1500;
export const WALK_SPEED = 125; // at 100% speed
export const JUMP_SPEED = 550; // at 100% jump, about 100px high
export const CLIMB_SPEED = 95;
export const MAX_FALL = 700;
const ROPE_GRAB = 10;
const DROP_TIME = 0.22;

// The ground follows the map's `terrain`, a line of [x, y] points from one side to the other: it
// can rise and fall in slopes, and two points at the same x make a cliff wall. A map without
// one has flat ground at groundY. The ground between walls is one walkable piece; walls block
// anyone below their top.
const STICK = 14; // how far a step can rise or fall while walking and still stay on the ground
const WALL_PAD = 6; // how close a body's center gets to a wall

function lineY(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    if (x <= x1) {
      const [x0, y0] = pts[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
}

function groundPieces(map) {
  const pts = map.terrain ?? [[0, map.groundY], [map.width, map.groundY]];
  const pieces = [];
  let run = [pts[0]];
  for (const p of pts.slice(1)) {
    if (p[0] === run[run.length - 1][0]) {
      pieces.push(run);
      run = [p];
    } else run.push(p);
  }
  pieces.push(run);
  return pieces.filter((r) => r.length > 1).map((r) => {
    const flat = r.every((q) => q[1] === r[0][1]);
    return { x1: r[0][0], x2: r[r.length - 1][0], y: Math.min(...r.map((q) => q[1])), ground: true, pts: r, yAt: flat ? () => r[0][1] : (x) => lineY(r, x) };
  });
}

// Every surface you can stand on: the ground pieces and the one-way ledges. Each has `yAt(x)`,
// the height of its top at x (flat ledges are the same everywhere).
const surfaceCache = new WeakMap();
export function surfacesOf(map) {
  let list = surfaceCache.get(map);
  if (!list) {
    list = [...groundPieces(map), ...map.platforms.map((p) => p.drift
      // A drifting ledge (a cloud) glides back and forth on the map's clock.
      ? { get x1() { return p.x + driftOffset(p, map.clock ?? 0); }, get x2() { return p.x + p.w + driftOffset(p, map.clock ?? 0); }, y: p.y, ground: false, drift: p, yAt: () => p.y }
      : { x1: p.x, x2: p.x + p.w, y: p.y, ground: false, yAt: () => p.y })];
    surfaceCache.set(map, list);
  }
  return list;
}

// How far a drifting ledge (`drift: { dx, period }`) has glided from its spot at `clock` (the
// map's clock, world seconds): out and back each period, easing at both ends.
export function driftOffset(p, clock) {
  return p.drift.dx * (0.5 - 0.5 * Math.cos((2 * Math.PI * clock) / p.drift.period));
}

// The moving parts riders feel (the player and the other players, not summons or monsters):
//   springs   {x, y, up}: a bounce flower on a surface; stepping on it throws you `up` px high
//   updrafts  {x, w, top, bottom}: a column of rising air; press Up in it and you float up to
//             `top` and hover there a moment (Down lets go)
const SPRING_REACH = 13;
const LIFT = 190;
const HOVER = 3;
function ride(body, map, intent, dt) {
  // A drifting ledge carries whoever stands on it.
  const s = body.onGround ? body.surface : null;
  if (s?.drift) {
    const o = driftOffset(s.drift, map.clock ?? 0);
    if (body.carry === s) body.x += o - body.carryAt;
    body.carry = s;
    body.carryAt = o;
  } else body.carry = null;
  if (body.onGround) {
    const sp = map.springs?.find((q) => Math.abs(q.x - body.x) <= SPRING_REACH && Math.abs(q.y - body.y) < 2);
    if (sp) {
      body.vy = -Math.sqrt(2 * GRAVITY * sp.up);
      body.onGround = false;
      body.surface = null;
      body.y -= 1;
      sp.firedAt = map.clock ?? 0;
      return;
    }
  }
  const u = map.updrafts?.find((q) => Math.abs(body.x - q.x) <= q.w / 2 && body.y <= q.bottom + 1 && body.y >= q.top - 40);
  // Up (or a jump) catches the air; once caught it carries you until you let go with Down, drift
  // out of it, or have hung at the top for a few seconds.
  if (!u || body.onGround && !body.lifted) body.hoverT = 0;
  else if (body.y <= u.top + 6) body.hoverT = (body.hoverT ?? 0) + dt;
  if (u && !intent.down && body.hoverT < HOVER && (body.lifted === u || intent.up || intent.jump)) {
    if (body.onGround) {
      body.onGround = false;
      body.surface = null;
      body.y -= 1;
      body.vy = -LIFT * 0.7;
    }
    // Rise to the top and hang there, bobbing a little, free to drift out sideways (gravity, added
    // after this, is taken off up front).
    const target = body.y > u.top + 30 ? -LIFT : Math.max(-LIFT, (u.top - body.y) * 5 + 14 * Math.sin((map.clock ?? 0) * 3));
    body.vy += (target - body.vy) * Math.min(1, dt * 8) - GRAVITY * dt;
    body.lifted = u;
  } else body.lifted = null;
}

// The ground piece under x (at a wall, the one on the right).
export function groundPieceAt(map, x) {
  const pieces = surfacesOf(map).filter((s) => s.ground);
  return pieces.find((s) => x >= s.x1 && x < s.x2) ?? (x < pieces[0].x1 ? pieces[0] : pieces[pieces.length - 1]);
}

// The height of the ground at x.
export function groundAt(map, x) {
  return groundPieceAt(map, x).yAt(x);
}

// Water (a map's `water`: [{ x1, x2, y }], y the surface): the height of the surface at x, or
// null. Walking through it is a wade; a swimming mount skims along its top.
export function waterAt(map, x) {
  for (const w of map.water ?? []) if (x >= w.x1 && x <= w.x2) return w.y;
  return null;
}
const WADE_DEPTH = 6;
// Whether a body's feet are down in water deep enough to wade.
export const wading = (map, body) => {
  const wy = waterAt(map, body.x);
  return wy != null && body.y > wy + WADE_DEPTH;
};

// Stops a body walking (or flying) into a cliff wall that rises above its feet.
export function blockWalls(map, body, nx) {
  const dir = Math.sign(nx - body.x);
  if (!dir) return nx;
  const piece = groundPieceAt(map, nx + dir * WALL_PAD);
  if (piece.yAt(nx + dir * WALL_PAD) >= body.y - STICK) return nx;
  const wall = dir > 0 ? piece.x1 : piece.x2;
  body.vx = 0;
  return dir > 0 ? Math.min(nx, Math.max(body.x, wall - WALL_PAD)) : Math.max(nx, Math.min(body.x, wall + WALL_PAD));
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
    // Grab from below or mid-rope with Up; from the top ledge with Down (from the cliff's edge,
    // for a rope hanging beside one).
    if (wantDown) return Math.abs(body.x - r.x) <= ROPE_GRAB + ROPE_REACH && Math.abs(body.y - r.top) < 4;
    if (Math.abs(body.x - r.x) > ROPE_GRAB) return false;
    return body.y > r.top + 2 && body.y <= r.bottom + 2;
  });
}

// The surface at the top of a rope: the one it hangs from, or one right beside it (a rope down
// a cliff face).
export function ropeTop(map, r) {
  return surfacesOf(map).find((s) => r.x >= s.x1 - ROPE_REACH && r.x <= s.x2 + ROPE_REACH && Math.abs(s.yAt(Math.max(s.x1, Math.min(s.x2, r.x))) - r.top) < 2) ?? null;
}
const ROPE_REACH = 16;

// intent: { left, right, up, down, jump } booleans. `speed` and `jump` are percentages (100 = normal).
// Riding a mount adds: `glide` (a fall speed held to while Jump is held), `float` (no gravity this
// step: a hover), `swim` (water's surface holds you up), `climb` (rope speed, %), and `wade` (the
// speed, %, while wading; 100 for none).
export function stepBody(body, map, intent, dt, { speed = 100, jump = 100, rider = false, glide = 0, float = false, swim = false, climb = 100, wade = 100 } = {}) {
  body.dropTimer = Math.max(0, body.dropTimer - dt);
  body.knockTimer = Math.max(0, body.knockTimer - dt);
  if (rider && !body.rope) ride(body, map, intent, dt);

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
    body.y += dir * CLIMB_SPEED * (climb / 100) * dt;
    body.vx = 0;
    body.vy = 0;
    if (body.y <= r.top) {
      body.y = r.top;
      body.rope = null;
      body.onGround = true;
      // A rope hanging beside a cliff puts you on top of it.
      const top = ropeTop(map, r);
      if (top) body.x = Math.max(top.x1 + 4, Math.min(top.x2 - 4, body.x));
      body.surface = top;
    } else if (body.y >= r.bottom) {
      body.y = r.bottom;
      body.rope = null;
      body.onGround = true;
      body.surface = surfacesOf(map).find((s) => Math.abs(s.yAt(body.x) - r.bottom) < 2 && body.x >= s.x1 && body.x <= s.x2) ?? null;
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
    const target = move * WALK_SPEED * (speed / 100) * (wade < 100 && !swim && wading(map, body) ? wade / 100 : 1);
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
  const was = body.onGround ? body.surface : null;
  body.vy = float ? 0 : Math.min(MAX_FALL, body.vy + GRAVITY * dt);
  body.gliding = Boolean(glide) && intent.jump && !body.onGround && body.vy > glide && !was;
  if (body.gliding) body.vy = glide;
  body.x = blockWalls(map, body, Math.max(body.w / 2, Math.min(map.width - body.w / 2, body.x + body.vx * dt)));
  body.y += body.vy * dt;

  body.onGround = false;
  if (body.vy >= 0) {
    // Walking along the ground keeps your feet on it, up and down slopes and over small steps.
    if (was?.ground) {
      const piece = groundPieceAt(map, body.x);
      const gy = piece.yAt(body.x);
      if (Math.abs(gy - prevY) <= STICK) {
        body.y = gy;
        body.vy = 0;
        body.onGround = true;
        body.surface = piece;
      }
    }
    for (const s of body.onGround ? [] : surfacesOf(map)) {
      if (!s.ground && body.dropTimer > 0) continue;
      if (body.x < s.x1 || body.x > s.x2) continue;
      const sy = s.yAt(body.x);
      if (prevY <= sy + 1 && body.y >= sy) {
        body.y = sy;
        body.vy = 0;
        body.onGround = true;
        body.surface = s;
        break;
      }
    }
  }
  // The ground is solid all the way down: nothing ends up inside it.
  if (!body.onGround && body.vy >= 0) {
    const piece = groundPieceAt(map, body.x);
    const gy = piece.yAt(body.x);
    if (body.y > gy) {
      body.y = gy;
      body.vy = 0;
      body.onGround = true;
      body.surface = piece;
    }
  }
  // A swimmer is held up by the water: it rides the surface (and bobs back up to it from below).
  body.swimming = false;
  const wy = swim ? waterAt(map, body.x) : null;
  if (wy != null && body.vy >= 0 && body.y >= wy - 0.5) {
    // Below the surface it floats back up (quickly, but not in a snap).
    body.y = Math.max(wy, body.y - 220 * dt);
    body.vy = 0;
    body.onGround = true;
    body.swimming = true;
    body.surface = { x1: body.x - 1, x2: body.x + 1, y: wy, ground: false, water: true, yAt: () => wy };
  }
  if (!body.onGround) body.surface = null;
}

export function knockBack(body, fromX) {
  body.rope = null;
  // (A short hop back: enough to feel the hit, not enough to throw you out of a fight.)
  body.vx = (body.x >= fromX ? 1 : -1) * 70;
  body.vy = -150;
  body.onGround = false;
  body.knockTimer = 0.25;
}
