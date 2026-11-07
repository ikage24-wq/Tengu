// The Spell Juggler (the base Mage, remade 2026-11-07; docs/design/mage-line.md). While she is in a
// fight, spell orbs pop into being one after another and circle her: fire, then ice, then spark,
// up to ORB_MAX. Her attacks fling them, oldest first (world/melee.js `orbThrow`); an orb that finds
// nothing to hit flies out to its reach and curves back, and she catches it (it rejoins the orbit).
// With no orb in hand she snaps a little palm spark instead. Each orb carries its element, so
// flinging a mix sets off her element reactions (world/reactions.js).

export const ORB_MAX = 5;
// Seconds between new orbs while she fights, and how long after the last monster nearby they keep
// coming (so a short lull doesn't empty her hands).
export const ORB_EVERY = 0.7;
export const ORB_FIGHT = 3;
// How near a monster has to be for her to start juggling.
const NEAR_X = 420;
const NEAR_Y = 200;
export const ORB_ELS = ['fire', 'ice', 'bolt'];

export const isJuggler = (char) => char.job === 'spiritmage';

export function juggleOf(world) {
  world.juggle ??= { orbs: [], spin: 0, next: 0, turn: 0, back: [], fightAt: -99, caught: [] };
  return world.juggle;
}

export function tickJuggle(world, dt) {
  if (!isJuggler(world.char)) {
    if (world.juggle) world.juggle = null;
    return;
  }
  const j = juggleOf(world);
  const b = world.body;
  // The orbit turns faster the more she has going.
  j.spin += dt * (2.4 + 0.25 * j.orbs.length);
  if (world.mobs.some((m) => m.hp > 0 && Math.abs(m.x - b.x) < NEAR_X && Math.abs(m.y - b.y) < NEAR_Y)) j.fightAt = world.now;
  const fighting = world.now - j.fightAt < ORB_FIGHT;
  // Orbs coming home: caught, back into the orbit.
  for (const r of j.back) {
    if (r.done || world.now < r.at) continue;
    r.done = true;
    if (j.orbs.length < ORB_MAX) {
      j.orbs.push({ el: r.el, born: world.now });
      j.caught.push({ el: r.el, at: world.now });
    }
  }
  j.back = j.back.filter((r) => !r.done);
  j.caught = j.caught.filter((c) => world.now - c.at < 0.5);
  if (fighting && j.orbs.length + j.back.length < ORB_MAX && world.now >= j.next) {
    j.orbs.push({ el: ORB_ELS[j.turn % ORB_ELS.length], born: world.now });
    j.turn++;
    j.next = world.now + ORB_EVERY;
  }
  // Out of the fight they wink out one by one.
  if (!fighting && j.orbs.length && world.now >= j.next) {
    j.orbs.shift();
    j.next = world.now + 0.5;
  }
}

// The oldest orb, taken off the orbit to be flung (null when her hands are empty).
export function takeOrb(world) {
  if (!isJuggler(world.char)) return null;
  return juggleOf(world).orbs.shift() ?? null;
}

// An orb on its way home after missing: she catches it at `at`.
export function orbHome(world, el, at) {
  juggleOf(world).back.push({ el, at });
}

// Where orb `i` of `n` is in her orbit (relative to her chest; `front` when it passes before her).
export function orbSlot(spin, i, n) {
  const a = spin + (i / Math.max(1, n)) * Math.PI * 2;
  return { x: Math.cos(a) * 30, y: Math.sin(a) * 8 - Math.sin(a * 2) * 1.5, front: Math.sin(a) > 0, a };
}
