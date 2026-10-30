// Getting about, the light-footed jobs' own way (the player asked for these):
//   Flash jump     a Thief (and her paths) presses jump again in mid-air: a second kick off the air
//                  throws her far forward in a burst of her own colour (violet moonlight, ink and a
//                  red seal, blue fox fire). Once per jump; free, like jumping.
//   Shadow dash    a Thief double-taps left or right on the ground: she drops low and slips forward
//                  as a shadow, untouchable, straight through monsters, leaving afterimages. A short
//                  beat before the next one, so it can't be chained into flight.
//   Air leap       an Archer (and her paths) presses jump again in mid-air: she springs up and back
//                  in a backflip and looses a shot down at them from the top of it, in her own
//                  colours (gold hawk, green wind, violet storm). Once per jump.
// None of them can start mid-attack; the leap's shot is a real blow and lands on its release.

import { jobChain } from '../data/jobs.js';
import { thiefSchool, archerLook, outgoing, airLeap } from './melee.js';

export const FLASH = { vx: 520, vy: 300, hold: 0.32 };
export const LEAP = { vx: 230, hold: 0.3 };
export const DASH = { speed: 640, dur: 0.22, guard: 0.32, beat: 0.42, tap: 0.26 };

const family = (char, root) => jobChain(char.job).includes(root);
export const isThief = (char) => family(char, 'thief');
export const isArcher = (char) => family(char, 'archer');
// The colour a movement burst comes in, by path.
export const leapSchool = (char) => (isThief(char) ? thiefSchool(char) : isArcher(char) ? archerLook(char).school : null);

const busy = (world) => world.attackTimer > 0 || world.lockTimer > 0;
const jumpPressed = (pressed) => pressed.has('Space') || pressed.has('AltLeft') || pressed.has('AltRight');

function burst(world, dir, k = 1) {
  const b = world.body;
  world.fx.push({ kind: 'leapburst', school: leapSchool(world.char), x: b.x, y: b.y - b.h * 0.45, dir, k, t: 0, dur: 0.36 });
}

// Before the body moves: start a flash jump, a leap or a dash from this frame's presses.
export function startAgility(world, intent, pressed) {
  const { body: b, char } = world;
  if (world.dead || b.rope) return;
  if (b.onGround) world.airJumped = false;
  const thief = isThief(char);
  const archer = isArcher(char);
  if (!thief && !archer) return;
  // A second jump in the air.
  if (jumpPressed(pressed) && !b.onGround && !world.airJumped && !busy(world)) {
    world.airJumped = true;
    if (intent.left !== intent.right) b.facing = intent.left ? -1 : 1;
    if (thief) {
      b.vy = Math.min(b.vy, -FLASH.vy);
      b.vx = b.facing * FLASH.vx;
      world.flash = { until: world.now + FLASH.hold, dir: b.facing };
      world.pose = { from: outgoing(world), kind: 'flashjump', t: 0.5, dur: 0.5, since: world.now };
      burst(world, b.facing);
    } else {
      airLeap(world);
      world.flash = { until: world.now + LEAP.hold, dir: -b.facing, vx: LEAP.vx };
      burst(world, -b.facing, 0.8);
    }
  }
  // Double-tap a direction on the ground: the Thief's shadow dash.
  if (thief) {
    world.taps ??= {};
    for (const [key, dir] of [['ArrowLeft', -1], ['ArrowRight', 1]]) {
      if (!pressed.has(key)) continue;
      const again = world.now - (world.taps[key] ?? -9) <= DASH.tap;
      world.taps[key] = world.now;
      if (!again || !b.onGround || busy(world) || world.now < (world.dashReadyAt ?? 0)) continue;
      world.taps[key] = -9;
      b.facing = dir;
      world.dash = { until: world.now + DASH.dur, dir };
      world.dashReadyAt = world.now + DASH.dur + DASH.beat;
      world.invuln = Math.max(world.invuln, DASH.guard);
      world.pose = { from: outgoing(world), kind: 'shadowrun', t: DASH.dur + 0.12, dur: DASH.dur + 0.12, since: world.now };
      burst(world, dir, 0.75);
    }
  }
}

// After the body moves: carry the flash jump and the dash.
export function tickAgility(world, dt, blockWalls) {
  const b = world.body;
  if (b.onGround || b.rope) world.flash = null;
  if (world.flash) {
    if (world.now >= world.flash.until) world.flash = null;
    else b.vx = world.flash.dir * (world.flash.vx ?? FLASH.vx);
  }
  if (world.dash) {
    if (world.now >= world.dash.until || b.rope || world.dead) world.dash = null;
    else {
      b.x = blockWalls(world.map, b, Math.max(b.w / 2, Math.min(world.map.width - b.w / 2, b.x + world.dash.dir * DASH.speed * dt)));
      b.vx = 0;
    }
  }
}
