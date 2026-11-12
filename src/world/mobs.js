// Monster runtime: spawning, respawning, patrol and chase AI, knockback, and the boss slam.

import { MOBS } from '../data/mobs.js';
import { surfacesOf, groundPieceAt, groundAt, waterAt, WALK_SPEED } from './physics.js';
import { habitGoal } from './habits.js';

// A monster comes back somewhere between these many seconds after it falls (a map's own
// `respawn` sets the shortest wait instead), so a cleared ledge fills up again bit by bit.
const RESPAWN = [6, 10];
// Each spawn point holds this many monsters (bosses stay single), spread a little apart.
const PER_SPAWN = 2;
const SPREAD = 50;
// A respawn lands somewhere within ROAM of its spot on the same ledge (or further along it when
// that's crowded), never closer than CLEAR to you or a partymate; with nowhere clear on the
// whole ledge, it waits a moment and tries again.
const ROAM = 90;
const CLEAR = 110;
const RETRY = 1;
const AGGRO_TIME = 6;
const HOVER = 46;
// A flyer never dips closer than this to the ground under it (its bob included), rises out at
// RISE px/s when the ground climbs ahead of it, and eases home at HOME_DRIFT px/s after a chase.
const FLY_CLEAR = 22;
const RISE = 140;
const HOME_DRIFT = 24;
const CHASE_DROP = 240;

let nextUid = 1;

function surfaceFor(map, x, y) {
  const fits = surfacesOf(map).filter((s) => x >= s.x1 && x <= s.x2 && Math.abs(s.yAt(x) - y) < 4);
  return fits[0] ?? groundPieceAt(map, x);
}

// (2026-11-12) A monster rests this long between its own touch attacks, so a crowd doesn't chain
// blows and an attack never fires every frame (god mode skips the hit's safe window).
export const MOB_ATTACK_GAP = 1.6;

export function spawnMob(map, spawn) {
  const def = MOBS[spawn.mob];
  const surface = surfaceFor(map, spawn.x, spawn.y);
  // Walkers stay on their ledge; flyers roam a band around their spawn point. On a map built over
  // open sky (`flyersStay`: Starfall Heights' crater), a flyer keeps over the floor it lives on (a
  // little past its ends), never out over the gap where a fighter on foot can't reach it.
  const keep = def.fly && map.flyersStay;
  const x1 = def.fly ? Math.max(def.w, spawn.x - 180, keep ? surface.x1 - 24 : -Infinity) : surface.x1 + def.w / 2;
  const x2 = def.fly ? Math.min(map.width - def.w, spawn.x + 180, keep ? surface.x2 + 24 : Infinity) : surface.x2 - def.w / 2;
  const x = Math.max(x1, Math.min(x2, spawn.x));
  // A flyer hovers over its spot, never below the ground there.
  const hover = def.fly ? Math.min(spawn.y - HOVER, Math.min(groundAt(map, x), groundAt(map, x - def.w / 2), groundAt(map, x + def.w / 2)) - FLY_CLEAR) : 0;
  return {
    uid: nextUid++,
    def,
    spawn,
    x,
    y: def.fly ? hover : surface.yAt(x),
    baseY: def.fly ? hover : surface.yAt(x),
    // Walkers follow their surface's height (up and down slopes).
    yAt: def.fly ? null : surface.yAt,
    // Flyers keep clear of the solid ground under them (`floorAt`) and drift back to their own
    // hover height (`homeY`) once a chase is over.
    floorAt: def.fly ? (fx) => groundAt(map, fx) : null,
    homeY: def.fly ? hover : null,
    x1, x2,
    hp: def.hp,
    dir: Math.random() < 0.5 ? -1 : 1,
    state: 'walk',
    timer: 1 + Math.random() * 2,
    aggroUntil: 0,
    knockVx: 0,
    stagger: 0,
    flash: 0,
    phase: Math.random() * Math.PI * 2,
    special: def.special ? { timer: def.special.every, warn: 0 } : null,
    dying: 0,
    age: 0,
  };
}

export function mobBox(m) {
  // (A guild bounty's elite is drawn bigger, and is as big to hit: world/bounties.js.)
  const k = m.def.scale ?? 1;
  return { x: m.x - (m.def.w * k) / 2, y: m.y - m.def.h * k, w: m.def.w * k, h: m.def.h * k };
}

export function createSpawner(map) {
  const slots = [];
  for (const s of map.spawns) {
    // Dungeon rooms hold exactly what they list, once.
    // (A map can ask for fewer: `perSpawn`, one monster a spot where two would crowd it.)
    const copies = MOBS[s.mob].boss || map.dungeon ? 1 : map.perSpawn ?? PER_SPAWN;
    // Keep copies on the same ledge as the original spawn point.
    const surface = surfaceFor(map, s.x, s.y);
    for (let i = 0; i < copies; i++) {
      const offset = (i - (copies - 1) / 2) * SPREAD;
      const x = Math.max(surface.x1 + 4, Math.min(surface.x2 - 4, s.x + offset));
      slots.push({ spawn: { ...s, x, respawn: map.dungeon ? Infinity : s.respawn }, mob: null, respawnAt: 0 });
    }
  }
  spreadOut(map, slots);
  return { slots };
}

// Spots a monster shouldn't stand on: by a ladder's or rope's foot (you'd climb straight into it),
// beside a portal (you'd arrive into it), in water, and at the map's very ends.
function keepClear(map, x, y) {
  if (x < 70 || x > map.width - 70) return true;
  if (waterAt(map, x) != null && Math.abs(groundAt(map, x) - y) < 6) return true;
  if ((map.portals ?? []).some((p) => !p.hidden && Math.abs(p.x - x) < 110 && Math.abs((p.y ?? y) - y) < 60)) return true;
  return (map.ropes ?? []).some((r) => Math.abs(r.x - x) < 44 && y <= r.bottom + 6 && y >= r.top - 6);
}
// Each ledge's walkers spread evenly along the parts of it that are clear (in the order the map
// lists them), as far apart as it allows: a map's spawn points were often only a few dozen pixels
// apart, each holding a pair, so monsters stood in heaps, on ladders and beside portals.
function spreadOut(map, slots) {
  const byLedge = new Map();
  for (const slot of slots) {
    // (Flyers hover in a band of their own; a boss holds its arena; a dungeon pack stands together.)
    if (MOBS[slot.spawn.mob].fly || MOBS[slot.spawn.mob].boss || slot.spawn.pack) continue;
    const q = surfaceFor(map, slot.spawn.x, slot.spawn.y);
    if (!byLedge.has(q)) byLedge.set(q, []);
    byLedge.get(q).push(slot);
  }
  for (const [q, list] of byLedge) {
    // The clear stretches of the ledge, a step at a time.
    const lo = q.x1 + 16;
    const hi = q.x2 - 16;
    const open = [];
    for (let x = lo; x <= hi; x += 4) if (!keepClear(map, x, q.yAt(x))) open.push(x);
    if (!open.length) continue;
    list.sort((a, b) => a.spawn.x - b.spawn.x);
    // Evenly through the clear spots: the i-th of n sits at the middle of its share of them.
    const n = list.length;
    list.forEach((slot, i) => {
      const x = open[Math.min(open.length - 1, Math.floor(((i + 0.5) / n) * open.length))];
      slot.spawn = { ...slot.spawn, x, y: q.yAt(x) };
    });
  }
}

// Where a respawn appears: a random spot near its own on the same ledge, clear of everyone in
// `near` (bodies), or null when there's no such spot right now. Flyers keep their spot.
function respawnSpot(map, spawn, near) {
  const crowded = (x, y) => near.some((b) => Math.abs(b.x - x) < CLEAR && Math.abs(b.y - y) < 70);
  if (MOBS[spawn.mob].fly) return crowded(spawn.x, spawn.y) ? null : spawn;
  const s = surfaceFor(map, spawn.x, spawn.y);
  // Near its own spot first; failing that, anywhere along the ledge.
  for (const reach of [ROAM, Infinity]) {
    const lo = Math.max(s.x1 + 12, spawn.x - reach);
    const hi = Math.min(s.x2 - 12, spawn.x + reach);
    for (let i = 0; i < 6; i++) {
      const x = hi > lo ? lo + Math.random() * (hi - lo) : spawn.x;
      const y = s.yAt(x);
      if (!crowded(x, y) && !keepClear(map, x, y)) return { ...spawn, x, y };
    }
  }
  return null;
}

// Fills empty spawn slots whose timers are up. Returns newly spawned mobs. `near` are the bodies
// a respawn keeps clear of (you and your party); the first fill of a map ignores them.
// `allow(spawn)` can hold a slot back (a field boss that only comes once its story is done).
export function tickSpawner(spawner, map, now, near = [], allow = null) {
  const born = [];
  for (const slot of spawner.slots) {
    if (allow && !allow(slot.spawn)) continue;
    if (slot.mob && slot.mob.hp > 0) continue;
    if (slot.mob && slot.mob.hp <= 0 && !slot.respawnAt) {
      const [lo, hi] = slot.spawn.respawn != null ? [slot.spawn.respawn, slot.spawn.respawn * 1.6] : RESPAWN;
      slot.respawnAt = now + lo + Math.random() * (hi - lo);
    }
    if (!slot.mob) {
      slot.mob = spawnMob(map, slot.spawn);
      born.push(slot.mob);
    } else if (slot.respawnAt && now >= slot.respawnAt) {
      const at = respawnSpot(map, slot.spawn, near);
      if (!at) {
        slot.respawnAt = now + RETRY;
        continue;
      }
      slot.mob = spawnMob(map, at);
      slot.respawnAt = 0;
      born.push(slot.mob);
    }
  }
  return born;
}

// Dragged by a chain hook toward x (along its own ledge): caught once the chain reaches it
// (`wait` seconds), then reeled in over a moment.
export function yank(m, x, wait = 0.15) {
  m.yank = { x: Math.max(m.x1, Math.min(m.x2, x)), t: 0.3, wait };
  m.dir = Math.sign(x - m.x) || m.dir;
}

// Moves a monster being dragged. Returns true while it is.
export function tickYank(m, dt) {
  if (!m.yank) return false;
  if (m.yank.wait > 0) {
    m.yank.wait -= dt;
    return true;
  }
  m.yank.t -= dt;
  m.x += (m.yank.x - m.x) * Math.min(1, dt * 16);
  if (m.yAt) m.y = m.yAt(m.x);
  if (m.yank.t <= 0) {
    m.x = m.yank.x;
    m.yank = null;
  }
  return true;
}

// A hit: knocked back (`knock` px/s, away from the blow; negative pulls in), and popped up into
// the air by a launcher (`launch` px/s); bosses stand firm.
export function hitMob(m, damage, fromX, now, { knock = 90, launch = 0 } = {}) {
  m.hp = Math.max(0, m.hp - damage);
  m.flash = 0.12;
  m.aggroUntil = now + AGGRO_TIME;
  // A hit wakes it from a nap; a peaceful one that's hurt runs off (world/habits.js).
  m.habit = !m.def.aggro && !m.def.boss && m.hp > 0 ? { kind: 'flee', x: m.x + (m.x >= fromX ? 1 : -1) * 300, speed: 1.8, until: now + 2.5 } : null;
  if (!m.def.boss) {
    m.stagger = Math.max(m.stagger, knock > 150 ? 0.4 : 0.25);
    // Everyday blows barely nudge (half their push), so monsters stay in reach; heavy ones still
    // shove clearly (three quarters), and launchers send them up as ever.
    m.knockVx = (m.x >= fromX ? 1 : -1) * knock * (knock >= 250 ? 0.75 : 0.5);
    // Hits keep a monster up in the air (a juggle); a launcher sends it up.
    if (launch && !m.def.fly) m.airV = Math.max(m.airV ?? 0, launch);
    else if (m.air > 0) m.airV = Math.max(m.airV ?? 0, 120);
  }
  return m.hp <= 0;
}

const AIR_GRAVITY = 1300;

// A monster up in the air falls back down, drifting with its knockback, and can't act until it
// lands (with a little bounce). Returns true while it's airborne.
export function tickAir(m, dt) {
  if (!(m.air > 0) && !(m.airV > 0)) return false;
  m.air = (m.air ?? 0) + m.airV * dt;
  m.airV -= AIR_GRAVITY * dt;
  m.x = Math.max(m.x1, Math.min(m.x2, m.x + (m.knockVx ?? 0) * dt));
  if (m.yAt) m.y = m.yAt(m.x);
  m.knockVx = (m.knockVx ?? 0) * 0.97;
  m.state = 'idle';
  if (m.air <= 0) {
    // A hard landing bounces once.
    const hard = m.airV < -380;
    m.air = 0;
    m.airV = hard ? 150 : 0;
    m.stagger = 0.3;
  }
  return true;
}

// No ordinary monster outpaces you: on average over its gait (a dart's bursts, a bound's leaps, a
// stalker's run), chasing or not, it moves at most at MOB_TOP, four fifths of your walking speed,
// so you can always get away. Its own speed is scaled down to fit (the gait's shape is kept: a
// bounder still leaps, a darter still darts). Bosses keep theirs.
export const MOB_TOP = WALK_SPEED * 0.8;
const GAIT_AVG = { bound: 0.83, dart: 1.7, stalk: 1.3 };
export function speedOf(m, chasing) {
  const s = m.def.speed ?? 0;
  if (m.def.boss || !s) return s;
  const avg = s * (chasing ? 1.35 : 1) * (GAIT_AVG[m.def.gait] ?? 1);
  return avg > MOB_TOP ? s * (MOB_TOP / avg) : s;
}

// How fast a monster's gait carries it right now, as a share of its speed (averaging about 1).
function pace(m, chasing, dt) {
  m.walked = (m.walked ?? 0) + dt;
  return gait(m, chasing);
}
function gait(m, chasing) {
  switch (m.def.gait) {
    // Each leap covers ground fast, then it lands and gathers itself for the next.
    case 'bound': return 2.6 * Math.max(0, Math.sin(m.phase * 7));
    case 'dart': return 1.7;
    // Creeps up, then breaks into a run (a chase starts at a run).
    case 'stalk': return chasing ? 1.3 : Math.min(1.6, 0.4 + m.walked * 0.5);
    default: return 1;
  }
}

// The lowest a flyer's hover line may sit at x: clear of the ground under its whole body.
function flyFloor(m, x) {
  const half = m.def.w / 2;
  return Math.min(m.floorAt(x), m.floorAt(x - half), m.floorAt(x + half)) - FLY_CLEAR;
}

// Keeps a flyer out of the dirt: where the ground rises above its hover line it holds back and
// climbs over (smoothly, never popping up), and it never sinks below the ground it is over.
function keepAloft(m, x0, dt) {
  if (!m.floorAt) return;
  const floor = flyFloor(m, m.x);
  if (m.baseY <= floor) return;
  const deep = m.baseY - floor;
  // Blocked by rising ground: it holds back and climbs over, smoothly.
  if (deep > 10 && m.x !== x0 && m.baseY <= flyFloor(m, x0) + 0.5) {
    m.x = x0;
    m.baseY -= Math.min(deep, RISE * dt);
    return;
  }
  // (Pushed or pulled into the rock, with nowhere to back out to: it rises out quickly.)
  m.baseY -= Math.min(deep, Math.max(RISE, deep * 6) * dt);
}

// However a flyer was moved (yanked, launched, wandered), it never ends up inside the rock: a
// last guard after every move.
function unburyFlyer(m) {
  if (!m.def.fly || !m.floorAt) return;
  const floor = flyFloor(m, m.x);
  if (m.baseY > floor + 6) {
    m.baseY = floor;
    m.y = m.baseY + Math.sin(m.phase * 2.2) * 6;
  }
}

// Moves one monster. `player` is { x, y } so aggro'd monsters can chase.
// Returns 'slam' on the frame a boss slam lands.
// Turning round takes a moment (2026-11-11, the player's ask: monsters snapped round instantly).
// `m.dir` is the way it wants to go; `m.heading` the way it faces and moves. When they differ it
// stops, turns (TURN seconds, flipping round as it finishes), then sets off; and every
// start from a standstill eases in over GO seconds rather than leaping to full speed.
const TURN = 0.2;
const GO = 0.3;
function turnAndEase(m, x0, dt) {
  m.heading ??= m.dir;
  const dx = m.x - x0;
  const want = Math.sign(dx) || m.dir;
  if (want !== m.heading) {
    // Turning: it doesn't move yet.
    m.x = x0;
    m.turnT = (m.turnT ?? 0) + dt;
    m.go = 0;
    if (m.turnT >= TURN) {
      m.heading = want;
      m.turnT = 0;
    }
    return;
  }
  m.turnT = 0;
  if (Math.abs(dx) < 1e-6) {
    m.go = Math.max(0, (m.go ?? 0) - dt / 0.15);
    return;
  }
  m.go = Math.min(1, (m.go ?? 0) + dt / GO);
  // (Eased in: slow at first, up to full speed.)
  const k = m.go * m.go * (3 - 2 * m.go);
  m.x = x0 + dx * k;
}

export function updateMob(m, player, dt, now) {
  if (m.hp <= 0) {
    m.dying += dt;
    return null;
  }
  m.flash = Math.max(0, m.flash - dt);
  m.age += dt;
  if (tickYank(m, dt) || tickAir(m, dt)) {
    unburyFlyer(m);
    return null;
  }
  // Frozen solid: no moving, no animating, no winding up, until the ice cracks.
  if (m.frozenUntil > now) {
    m.stagger = 0;
    unburyFlyer(m);
    return null;
  }
  m.phase += dt;

  let event = null;
  if (m.special) {
    if (m.special.warn > 0) {
      m.special.warn -= dt;
      if (m.special.warn <= 0) {
        event = 'slam';
        m.special.timer = m.def.special.every;
      }
    } else {
      m.special.timer -= dt;
      if (m.special.timer <= 0) m.special.warn = m.def.special.warn;
    }
  }

  const x0 = m.x;
  let chasing = false;
  if (m.stagger > 0) {
    m.stagger -= dt;
    m.x += m.knockVx * dt;
    m.knockVx *= 0.85;
  } else if (m.special?.warn > 0) {
    // Bosses stand still while winding up.
  } else if (now < m.aggroUntil && m.def.aggro) {
    const dx = player.x - m.x;
    if (Math.abs(dx) > 6) m.dir = Math.sign(dx);
    m.state = 'walk';
    m.x += m.dir * speedOf(m, true) * 1.35 * pace(m, true, dt) * dt;
    if (m.def.fly) {
      chasing = true;
      const want = player.y - 30 - m.baseY;
      m.baseY += Math.sign(want) * Math.min(Math.abs(want), 30 * dt);
      // (It guards its own heights: it swoops no more than CHASE_DROP below its hover line, so in a
      // tall map a flyer from the treetops doesn't dive all the way to the floor and take ages to
      // float back.)
      if (m.homeY != null) m.baseY = Math.min(m.baseY, m.homeY + CHASE_DROP);
    }
  } else if (habitGoal(m, now)) {
    // Living there: napping, heading home, playing chase or running off (world/habits.js).
    const goal = habitGoal(m, now);
    const dx = goal === 'stay' ? 0 : goal.x - m.x;
    if (Math.abs(dx) > 6) {
      m.dir = Math.sign(dx);
      m.state = 'walk';
      m.x += m.dir * speedOf(m, false) * goal.speed * pace(m, false, dt) * dt;
    } else m.state = 'idle';
  } else {
    m.timer -= dt;
    if (m.timer <= 0) {
      m.state = m.state === 'walk' ? 'idle' : 'walk';
      const quick = m.def.gait === 'dart' ? 0.35 : 1;
      m.timer = (m.state === 'walk' ? 1.5 + Math.random() * 2.5 : 0.8 + Math.random() * 1.5) * quick;
      m.walked = 0;
      if (m.state === 'walk' && Math.random() < 0.5) m.dir *= -1;
    }
    if (m.state === 'walk') m.x += m.dir * speedOf(m, false) * pace(m, false, dt) * dt;
  }

  if (m.stagger <= 0 || m.stagger == null) turnAndEase(m, x0, dt);
  else m.heading ??= m.dir;
  if (m.x <= m.x1) { m.x = m.x1; m.dir = 1; }
  if (m.x >= m.x2) { m.x = m.x2; m.dir = -1; }
  if (m.def.fly) {
    // Drifting back to its hover height, never down below the ground it's over (its home may be
    // on a lower floor than where it has wandered).
    const home = m.homeY != null && m.floorAt ? Math.min(m.homeY, flyFloor(m, m.x)) : m.homeY;
    if (!chasing && home != null && m.baseY !== home) {
      const back = home - m.baseY;
      m.baseY += Math.sign(back) * Math.min(Math.abs(back), HOME_DRIFT * dt);
    }
    keepAloft(m, x0, dt);
    m.y = m.baseY + Math.sin(m.phase * 2.2) * 6;
    unburyFlyer(m);
  }
  else if (m.yAt) m.y = m.yAt(m.x);
  return event;
}
