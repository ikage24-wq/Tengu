// Plays a life-skill move that isn't tied to a spot: cooking at a stove, crafting at a bench
// (render/life-moves.js draws them). The hero turns to face the stove or bench and plays it out;
// walking or jumping cuts it short (world.js: the move's lock ends once she's free to move), and
// nothing else in the game waits on it.
//
//   playLifePose(world, 'cook', { at: stoveX, find: dishId })
//   playLifePose(world, 'craft', { at: benchX, find: itemId })

export const LIFE_POSE_SECS = { cook: 2.4, craft: 2.6 };

export function playLifePose(world, kind, { at = null, find = null } = {}) {
  const dur = LIFE_POSE_SECS[kind];
  if (!dur || world.dead || !world.body.onGround) return false;
  if (at != null && Math.abs(at - world.body.x) > 2) world.body.facing = at > world.body.x ? 1 : -1;
  world.body.vx = 0;
  world.pose = { kind, t: dur, dur, since: world.now, at, find };
  // Rooted while it plays, but free to walk off at any moment (it's not an attack).
  world.lockTimer = Math.max(world.lockTimer ?? 0, dur);
  world.recoverAt = world.now;
  return true;
}
