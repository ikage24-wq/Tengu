// Plays a life-skill move that isn't tied to a spot: cooking at a stove, crafting at a bench
// (render/life-moves.js draws them). The hero turns to face the stove or bench and plays it out;
// walking or jumping cuts it short (world.js: the move's lock ends once she's free to move), and
// nothing else in the game waits on it.
//
//   playLifePose(world, 'cook', { at: stoveX, find: dishId })
//   playLifePose(world, 'craft', { at: benchX, find: itemId })
//   playLifePose(world, 'cook', { at: stoveX, find: dishId, then: () => ... })
//
// With `then`, the work is done when the move ends, not when it starts: the dish comes out of the
// pot once she's tasted it (and pops up out of it, the way finds hop out of a spot), and walking
// off part-way leaves the ingredients where they were. `busyCooking` says one is on the stove.

export const LIFE_POSE_SECS = { cook: 2.4, craft: 2.6 };

export function playLifePose(world, kind, { at = null, find = null, then = null } = {}) {
  const dur = LIFE_POSE_SECS[kind];
  if (!dur || world.dead || !world.body.onGround) return false;
  if (at != null && Math.abs(at - world.body.x) > 2) world.body.facing = at > world.body.x ? 1 : -1;
  world.body.vx = 0;
  const b = world.body;
  const done = then && (() => {
    then();
    if (find && at != null) world.lastGathered = { x: at, y: b.y - 10, items: [find], at: world.now };
  });
  world.pose = { kind, t: dur, dur, since: world.now, at, find, then: done };
  // Rooted while it plays, but free to walk off at any moment (it's not an attack).
  world.lockTimer = Math.max(world.lockTimer ?? 0, dur);
  world.recoverAt = world.now;
  return true;
}

// Something waiting to come out of the pot (or off the bench): how far along it is (0 ... 1), or null.
export function lifeWork(world, kind) {
  const p = world.pose;
  return p?.kind === kind && p.then ? Math.min(1, 1 - p.t / p.dur) : null;
}
