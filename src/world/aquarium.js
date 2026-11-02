// What makes each room of the Sunken Aquarium Palace its own (docs/design/aquarium-palace.md; the
// map fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in
// here; the drawing is in render/aquarium.js.
//
//   The Coral Gate     bubble lifts rise between the floors (updrafts of bubbles: press Up in
//                      them); light the three lantern corals.
//   The Kelp Gardens   currents sweep along a floor at a time: they carry you if you go with them
//                      and push you back if you don't.
//   The Pearl Vault    the puzzle: the tide bell rings an order (a new one each run); open the clams
//                      in that order. A wrong clam snaps every open one shut and spits a jellyfish.
//   The Moray Grotto   the Twin Moray Sisters: one fights while the other hides in a burrow in the
//                      wall (out of reach, spitting bubbles); now and then they swap, the one coming
//                      out lunging across the floor.
//   The Ink Abyss      the tide surges up the shaft (get up on a ledge); Lady Abyssia's ink clouds
//                      and the tentacles that slam down along one side of the room.
//   The Throne of Tides  Queen Coralie: Tidal Strikes, then the Whirlpool (it pulls everyone to
//                      her), then the Great Wave (a wave rolls the whole floor: jump it). Freed at
//                      the end.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const AQUA_MECHS = new Set(['moray', 'abyssia', 'coralie']);
export const AQUA_CHANNEL = { coral: 1, clam: 0.6 };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};

// ---------- Rooms ----------

export function aquaSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'aquarium') return;
  // The vault: the bell's order, a fresh shuffle each run.
  const clams = room.objects.filter((o) => o.kind === 'clam');
  if (clams.length) {
    const order = clams.map((o) => o.id).sort(() => Math.random() - 0.5);
    room.bell = { order, next: 0 };
    clams.forEach((o) => (o.label = order.indexOf(o.id) + 1));
  }
  room.currents = (map.currents ?? []).map((c, i) => ({ ...c, t: 3 + i * 4, on: false, since: 0 }));
  room.whirl = null;
}

// The bell's order, for the callout as you walk in.
export const bellWords = (room) => `The tide bell rings: ${room.bell.order.map((id) => room.objects[id].mark).join(' · ')}`;

// Opening a clam: right if it's the next in the bell's order; a wrong one snaps every open clam
// shut and spits out a jellyfish. Returns whether it opened.
export function openClam(world, o) {
  const room = world.dungeon.room;
  const b = room.bell;
  if (b.order[b.next] === o.id) {
    b.next++;
    o.openAt = world.now;
    return true;
  }
  for (const c of room.objects) {
    if (c.kind !== 'clam' || !c.done) continue;
    c.done = false;
    c.progress = 0;
    c.snapAt = world.now;
  }
  b.next = 0;
  o.snapAt = world.now;
  o.progress = 0;
  adds(world, { x: o.x }, 'jellymaid', [o.x + 40], null);
  callout(world, 'SNAP!', 'Wrong clam: they all shut. Start the order again');
  return false;
}

export function tickAqua(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  if (world.map.dungeon !== 'aquarium' || !room) return;
  // Currents: on for a while, then still; going with one carries you, going against it is slow.
  for (const c of room.currents ?? []) {
    c.t -= dt;
    c.since += dt;
    if (c.t <= 0) {
      c.on = !c.on;
      c.t = c.on ? c.last : c.every;
      c.since = 0;
      if (c.on && up.some((g) => Math.abs(g.body.y - c.y) < 40)) callout(world, 'Current!', c.dir > 0 ? 'The water pulls right' : 'The water pulls left');
    }
    if (!c.on) continue;
    for (const g of up) {
      const b = g.body;
      if (Math.abs(b.y - c.y) > 40 || b.x < c.x1 || b.x > c.x2 || b.rope) continue;
      b.x = Math.max(c.x1, Math.min(c.x2, b.x + c.dir * 110 * dt));
    }
  }
  // Queen Coralie's whirlpool drags everyone toward her.
  const w = room.whirl;
  if (w && world.now < w.until) {
    for (const g of up) {
      const b = g.body;
      const d = w.x - b.x;
      if (Math.abs(d) > 8 && !b.rope) b.x += Math.sign(d) * Math.min(Math.abs(d), 70 * dt);
    }
  }
}

// ---------- The bosses ----------

// A share of a hit that reaches an aquarium boss: a moray hiding in her burrow can't be reached.
export function aquaHitMul(world, m) {
  if (m.def.mech === 'moray' && m.burrowed) return 0;
  return 1;
}

export function aquaBoss(world, m, up, dt) {
  if (m.def.mech === 'moray') return moray(world, m, up, dt);
  if (m.def.mech === 'abyssia') return abyssia(world, m, up, dt);
  if (m.def.mech === 'coralie') return coralie(world, m, up, dt);
  return false;
}

// A lunge across the floor (after a lane telegraph): whoever it passes through is knocked away.
function lunging(world, m, up, dt, speed, damage) {
  const c = m.charging;
  if (!c) return false;
  m.state = 'walk';
  m.dir = c.dir;
  m.x += c.dir * speed * dt;
  for (const g of up) {
    if (c.hit.has(g.id) || Math.abs(g.body.x - m.x) > m.def.w / 2 + 8 || Math.abs(g.body.y - m.y) > 50) continue;
    c.hit.add(g.id);
    hurtMember(world, g, damage, m.x - c.dir * 40, { knock: true });
  }
  const wall = c.dir > 0 ? m.fx2 : m.fx1;
  if ((c.dir > 0 && m.x >= wall) || (c.dir < 0 && m.x <= wall)) {
    m.x = wall;
    m.charging = null;
  }
  return true;
}

// The sisters take turns: Murri starts out in the open, Ena in the right-hand burrow. Every so
// often the one inside lunges out across the floor and the other dives into the far burrow.
function moray(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { swap: 14, spit: 3 });
  const sister = world.mobs.find((o) => o !== m && o.def.mech === 'moray' && o.hp > 0);
  if (m.burrowed === undefined) {
    m.burrowed = m.def.id === 'morayena';
    m.burrowX = m.x;
  }
  if (!sister && m.burrowed) {
    // Her sister is down: she comes out for good, furious.
    m.burrowed = false;
    m.enraged = true;
    callout(world, `${m.def.name.split(',')[0]} bursts out of her burrow!`, 'Alone and furious: she strikes faster');
    radio(world, 'moraymad');
  }
  if (lunging(world, m, up, dt, m.enraged ? 460 : 400, 170)) return true;
  if (m.aim) return true;
  if (m.burrowed) {
    // In the burrow: out of reach, spitting bubbles at whoever is furthest from the tank.
    m.x = m.burrowX ?? m.x;
    m.state = 'idle';
    s.spit -= dt;
    if (s.spit <= 0 && up.length) {
      s.spit = 3.2;
      const g = pick(up.filter((o) => o.role !== 'tank').length ? up.filter((o) => o.role !== 'tank') : up);
      addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 56, warn: 1.3, damage: 120, from: m, bubble: true });
    }
    return true;
  }
  // The one in the open keeps the time for the swap.
  s.swap -= dt;
  if (sister && s.swap <= 0 && !m.windup) {
    s.swap = 14;
    // The sister comes out with a lunge across the floor; this one dives into the burrow on the
    // far side from her.
    const into = sister.burrowX < (map.width / 2) ? map.burrows[1] : map.burrows[0];
    sister.burrowed = false;
    const dir = sister.x < m.x ? 1 : -1;
    const x = dir > 0 ? sister.x : sister.fx1 - sister.def.w / 2;
    const w = dir > 0 ? sister.fx2 + sister.def.w / 2 - sister.x : sister.x - x;
    sister.aim = { dir };
    sister.dir = dir;
    addZone(world, { kind: 'lane', x, w, warn: 1.4, from: sister, dir });
    sister.mech = { ...(sister.mech ?? {}), swap: 14 };
    m.burrowed = true;
    m.burrowX = into;
    m.x = into;
    callout(world, 'The sisters swap!', `${sister.def.name.split(',')[0]} lunges out: out of the lane!`);
    return true;
  }
  return false;
}

function abyssia(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { ink: 5, arms: 10, phase: 1 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'thorns');
  s.ink -= dt;
  s.arms -= dt;
  if (s.ink <= 0 && up.length) {
    s.ink = frac < 0.5 ? 6 : 8;
    for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, frac < 0.5 ? 4 : 3)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 70, warn: 1.6, damage: 150, from: m, ink: true });
    callout(world, 'Ink!', 'Step out of the dark clouds');
  }
  if (s.arms <= 0) {
    if (pending) s.arms = 1;
    else {
      s.arms = frac < 0.5 ? 9 : 12;
      // Her tentacles slam down along one half of the floor, then the other.
      const left = (s.side = !s.side);
      const n = 4;
      const w = map.width / 2 / n;
      for (let i = 0; i < n; i++) addZone(world, { kind: 'thorns', x: (left ? 0 : map.width / 2) + i * w, w, warn: 1.8, damage: 190, from: m, tentacle: true });
      callout(world, 'Tentacles!', left ? 'They slam the left side: go right!' : 'They slam the right side: go left!');
    }
  }
  if (s.phase === 1 && frac <= 0.5) {
    s.phase = 2;
    adds(world, m, 'anglerlamp', [m.x - 220, m.x + 220], null);
    callout(world, 'Lady Abyssia calls the deep!', 'Anglers in the dark: bring them down');
    radio(world, 'anglers');
  }
  return false;
}

function coralie(world, m, up, dt) {
  const room = world.dungeon.room;
  const s = (m.mech ??= { phase: 1, strike: 4, whirl: 6, wave: 4 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'floor');
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    s.whirl = 1;
    callout(world, 'The Whirlpool!', 'The water drags you to her: fight it, and mind the eye');
    radio(world, 'whirl');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    s.wave = 2;
    callout(world, 'The Great Wave!', 'A wave rolls over the whole floor: jump it, or get up high');
    radio(world, 'wave');
  }
  s.strike -= dt;
  if (s.strike <= 0 && up.length) {
    s.strike = 7;
    for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 60, warn: 1.5, damage: 160, from: m, tide: true });
    callout(world, 'Tidal Strike!', 'Water spouts under your feet: move');
  }
  if (s.phase >= 2) {
    s.whirl -= dt;
    if (s.whirl <= 0) {
      s.whirl = 15;
      room.whirl = { x: m.x, until: world.now + 5 };
      addZone(world, { kind: 'circle', x: m.x, y: world.map.groundY, w: 120, warn: 4.4, damage: 230, from: m, whirl: true });
    }
  }
  if (s.phase === 3) {
    s.wave -= dt;
    if (s.wave <= 0) {
      if (pending) s.wave = 1;
      else {
        s.wave = 12;
        addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 2, damage: 240, from: m, wave: true });
        m.slamming = world.now + 2;
      }
    }
  }
  return m.slamming > world.now;
}

// An aquarium boss down.
export function aquaKilled(world, m) {
  if (m.def.mech === 'coralie') playScene(world, 'aquarium_freed');
}
