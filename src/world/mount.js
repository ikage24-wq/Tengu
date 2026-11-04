// Riding (data/mounts.js; docs/design/mounts.md). The mounts you own are `char.mounts` (ids), the
// one you ride with T is `char.mount`; `world.riding` is the ride in progress:
//   { id, since, hoverLeft, hovering, steam (0-1), dashUntil, dashDir, landAt, stowed, tapAt }
// Getting on or off is a hop with a poof (`mountpoof`). While riding, the mount's speed, jump and
// trick replace your own movement extras (no flash jumps on a bunny). An attack or a skill hops you
// off and goes off at once; fishing, gathering and crafting put the mount away; grabbing a rope
// stows it (except the gecko, which climbs) and it pops back when you step off.

import { MOUNTS, MOUNT_TIME, WADE } from '../data/mounts.js';

export const ownsMount = (char, id) => Boolean(char.mounts?.includes(id));

// Gives the character a mount (once). Returns true when it's new.
export function giveMount(world, id, why = null) {
  const char = world.char;
  const def = MOUNTS[id];
  if (!def || ownsMount(char, id)) return false;
  (char.mounts ??= []).push(id);
  char.mount ??= id;
  world.log?.(`New mount: ${def.name}! ${why ?? ''}`.trim(), '#ffe36b');
  world.log?.(`${def.trickText} Press H to ride (pick mounts in the Collection, B).`, '#bff0dc');
  world.events?.push({ type: 'mount', id });
  return true;
}

// Why you can't ride right now, or null.
export function rideBlocker(world) {
  const char = world.char;
  if (!char.mounts?.length) return "You don't have a mount yet.";
  if (world.dead) return null;
  if (world.fishing || world.gathering || world.crafting) return 'Finish what you are doing first.';
  if (world.scene) return 'Not now.';
  return null;
}

function poof(world, on) {
  const b = world.body;
  world.fx.push({ kind: 'mountpoof', on, mount: world.riding?.id ?? world.char.mount, x: b.x, y: b.y, t: 0, dur: 0.45 });
}

// Gets on your chosen mount (or the one given).
export function mountUp(world, id = world.char.mount) {
  if (rideBlocker(world) || !ownsMount(world.char, id)) return false;
  const b = world.body;
  if (b.rope && id !== 'gecko') return false;
  world.riding = { id, since: world.now, hoverLeft: 1, hovering: false, steam: 1, dashUntil: 0, dashDir: 1, landAt: -9, stowed: false, tapAt: {} };
  world.char.mount = id;
  // A little hop up into the seat.
  if (b.onGround && !b.rope) {
    b.vy = -220;
    b.onGround = false;
    b.y -= 1;
  }
  poof(world, true);
  return true;
}

// Gets off (with a hop down, unless `quiet`).
export function dismount(world, { quiet = false, hop = true } = {}) {
  if (!world.riding) return false;
  if (!quiet) poof(world, false);
  world.riding = null;
  world.dismountAt = world.now;
  const b = world.body;
  if (hop && b.onGround && !b.rope) {
    b.vy = -180;
    b.onGround = false;
    b.y -= 1;
  }
  return true;
}

export function toggleMount(world) {
  if (world.riding) return dismount(world);
  const why = rideBlocker(world);
  if (why) {
    world.log?.(why, '#ffb3c6');
    return false;
  }
  return mountUp(world);
}

// The ride's movement for stepBody: speed, jump, climb, and the trick's numbers this step.
// `intent` is the step's controls; `pressed` this frame's fresh keys (for the dash's double tap).
export function rideStep(world, intent, pressed, dt) {
  const r = world.riding;
  if (!r) return null;
  const def = MOUNTS[r.id];
  const b = world.body;
  const base = world.stats?.speed ?? 100;
  const out = { speed: Math.min(230, (base * (b.swimming && def.swimSpeed ? def.swimSpeed : def.speed)) / 100), jump: def.jump, climb: def.climb, wade: def.trick === 'swim' ? 100 : WADE, swim: def.trick === 'swim', glide: 0, float: false };
  // A rope stows the mount (the gecko climbs on); stepping off brings it back.
  if (b.rope && def.trick !== 'climb') {
    if (!r.stowed) {
      r.stowed = true;
      poof(world, false);
    }
    return { ...out, speed: base, jump: 100, climb: 100 };
  }
  if (r.stowed && !b.rope) {
    r.stowed = false;
    poof(world, true);
  }
  if (b.onGround) {
    r.hoverLeft = 1;
    r.steam = Math.min(1, r.steam + dt / (def.steam ?? 1));
  }
  switch (def.trick) {
    case 'glide':
      out.glide = def.glideFall;
      break;
    case 'hover': {
      // Off an edge (not jumping) or at the top of a jump with Jump held: float level.
      const atTop = !b.onGround && b.vy >= -20 && intent.jump;
      const walkedOff = !b.onGround && r.walkedOff;
      if (r.hoverLeft > 0 && !b.onGround && (r.hovering || walkedOff || atTop) && !intent.down) {
        r.hovering = true;
        r.hoverLeft = Math.max(0, r.hoverLeft - dt / def.hover);
        out.float = r.hoverLeft > 0;
        if (out.float) b.vy = 0;
      } else r.hovering = false;
      break;
    }
    case 'dash': {
      for (const [key, dir] of [['ArrowLeft', -1], ['ArrowRight', 1]]) {
        if (!pressed?.has(key)) continue;
        if (world.now - (r.tapAt[key] ?? -9) < 0.28 && b.onGround && r.steam >= 1) {
          r.dashUntil = world.now + def.dash;
          r.dashDir = dir;
          r.steam = 0;
          b.facing = dir;
        }
        r.tapAt[key] = world.now;
      }
      if (world.now < r.dashUntil) {
        out.speed = Math.min(320, (base * def.dashSpeed) / 100);
        b.vx = r.dashDir * Math.max(Math.abs(b.vx), 125 * (out.speed / 100) * 0.9);
      }
      break;
    }
    default:
  }
  return out;
}

// After the step: landings (the bunny's soft one), and whether you're still on the ground.
export function rideAfter(world) {
  const r = world.riding;
  if (!r) return;
  const b = world.body;
  if (b.onGround && !r.wasGround) r.landAt = world.now;
  // Stepped off an edge (rather than jumped): the cloud's cue to hover.
  if (r.wasGround && !b.onGround && !b.rope) r.walkedOff = b.vy >= 0;
  if (b.onGround) r.walkedOff = false;
  r.wasGround = b.onGround;
  if (b.onGround) r.hovering = false;
}

// What the drawing needs: how the mount is moving (render/mounts.js drawMount's `motion`).
export function rideMotion(world) {
  const r = world.riding;
  if (!r) return null;
  const def = MOUNTS[r.id];
  const b = world.body;
  const top = 125 * ((world.stats?.speed ?? 100) * def.speed) / 10000;
  return {
    facing: b.facing,
    speed: b.onGround ? Math.abs(b.vx) / Math.max(1, top) : Math.min(1, Math.abs(b.vx) / Math.max(1, top)),
    air: !b.onGround && !b.rope,
    vy: b.vy,
    landAt: r.landAt,
    hoverLeft: r.hoverLeft,
    special: b.rope && def.trick === 'climb' ? 'climb' : b.gliding ? 'glide' : r.hovering ? 'hover' : world.now < r.dashUntil ? 'dash' : b.swimming ? 'swim' : null,
  };
}

// A short hop's worth of grace: the moments just after getting on or off (for the drawing to blend
// the rider in or out of the seat).
export const mountBlend = (world) => (world.riding ? Math.min(1, (world.now - world.riding.since) / MOUNT_TIME) : 0);
