// What makes each room of the Clockwork Carnival its own (docs/design/clockwork-carnival.md; the map
// fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in here;
// the drawing is in render/carnival.js.
//
//   The Midway         carousel horses ride back and forth at different heights (drifting
//                      ledges); wind the three music boxes.
//   The Funhouse       springboards throw you between floors (map springs); pop the five prize
//                      balloons up high.
//   The Coaster Yard   the coaster runs the ground track on a timer, one way then the other: the
//                      rail lights up first; get up on a platform (or jump it).
//   The Big Top        Leonie: leaps up to the trapeze and pounces on a marked spot, fire hoops in
//                      a row along the ring, and a roar that throws everyone back.
//   The Toy Workshop   conveyor belts carry everyone along; Madame Marionette marks a player with
//                      her strings and yanks them across to her, cuts puppets loose, and dances her
//                      strings across the floor.
//   The Ferris Wheel   Queen Gearheart: gear saws roll across the plaza, then the wheel's cars drop
//                      on marked spots, then Overwound (faster saws and sweeps). Wound down at the
//                      end, not destroyed.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const CARNIVAL_MECHS = new Set(['leonie', 'marionetta', 'gearheart']);
export const CARNIVAL_CHANNEL = { windbox: 1.2, prize: 0.4 };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};
const onFloor = (world, body) => Math.abs(body.y - world.map.groundY) < 4;

// ---------- Rooms ----------

export function carnivalSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'carnival') return;
  room.coaster = map.coaster ? { t: map.coaster.every * 0.6, state: 'waiting', dir: 1, x: 0, hit: new Set() } : null;
  room.saws = [];
  room.yank = null;
}

// A rolling hazard along the floor (the coaster car, a gear saw): moves, and knocks back whoever is
// on the floor where it passes, once each.
function roll(world, h, dt, up) {
  h.x += h.dir * h.speed * dt;
  for (const g of up) {
    const b = g.body;
    if (h.hit.has(g.id) || !onFloor(world, b) || Math.abs(b.x - h.x) > h.w / 2 + 6) continue;
    h.hit.add(g.id);
    hurtMember(world, g, h.damage, h.x - h.dir * 40, { knock: true });
  }
  return h.dir > 0 ? h.x > world.map.width + 60 : h.x < -60;
}

export function tickCarnival(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'carnival' || !room) return;
  // The coaster: waiting, then the rail lights up, then the car roars through.
  const c = room.coaster;
  if (c) {
    c.t -= dt;
    if (c.state === 'waiting' && c.t <= 0) {
      c.state = 'warning';
      c.t = 2;
      callout(world, 'The coaster is coming!', c.dir > 0 ? 'From the left: get up on a platform!' : 'From the right: get up on a platform!');
    } else if (c.state === 'warning' && c.t <= 0) {
      c.state = 'running';
      Object.assign(c, { x: c.dir > 0 ? -60 : map.width + 60, speed: map.coaster.speed, w: 90, damage: map.coaster.damage, hit: new Set() });
    } else if (c.state === 'running' && roll(world, c, dt, up)) {
      c.state = 'waiting';
      c.t = map.coaster.every;
      c.dir = -c.dir;
    }
  }
  // Conveyor belts carry whoever stands on them.
  for (const cv of map.conveyors ?? []) {
    for (const g of up) {
      const b = g.body;
      if (!b.onGround || Math.abs(b.y - cv.y) > 3 || b.x < cv.x1 || b.x > cv.x2) continue;
      b.x = Math.max(cv.x1, Math.min(cv.x2, b.x + cv.dir * 55 * dt));
    }
  }
  room.saws = room.saws.filter((s) => !roll(world, s, dt, up));
  // Madame Marionette's yank: once the strings tighten, the marked one is pulled across to her.
  const y = room.yank;
  if (y && world.now >= y.at) {
    const g = up.find((o) => o.id === y.id);
    const m = world.mobs.find((o) => o.def.mech === 'marionetta' && o.hp > 0);
    if (g && m) {
      g.body.x = m.x + (g.body.x < m.x ? -40 : 40);
      hurtMember(world, g, 140, m.x, { knock: false });
      world.juice.push({ type: 'shake', mag: 3, dur: 0.3 });
    }
    room.yank = null;
  }
}

// ---------- The bosses ----------

// Leonie can't be hit while she's up on the trapeze.
export function carnivalHitMul(world, m) {
  if (m.def.mech === 'leonie' && m.aloft) return 0;
  return 1;
}

export function carnivalBoss(world, m, up, dt) {
  if (m.def.mech === 'leonie') return leonie(world, m, up, dt);
  if (m.def.mech === 'marionetta') return marionetta(world, m, up, dt);
  if (m.def.mech === 'gearheart') return gearheart(world, m, up, dt);
  return false;
}

function leonie(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { leap: 8, hoops: 12, roared: false });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'thorns');
  // The pounce: up to the trapeze (out of reach), then down on the marked spot.
  if (m.aloft) {
    m.state = 'idle';
    if (world.now >= m.aloft.at) {
      m.x = Math.max(m.fx1, Math.min(m.fx2, m.aloft.x));
      m.aloft = null;
      world.juice.push({ type: 'shake', mag: 5, dur: 0.4 });
    }
    return true;
  }
  s.leap -= dt;
  s.hoops -= dt;
  if (s.leap <= 0 && up.length) {
    s.leap = frac < 0.5 ? 9 : 12;
    const g = pick(up.filter((o) => o.role !== 'tank').length ? up.filter((o) => o.role !== 'tank') : up);
    m.aloft = { x: g.body.x, at: world.now + 1.8 };
    addZone(world, { kind: 'circle', x: g.body.x, y: map.groundY, w: 90, warn: 1.8, damage: 200, from: m, pounce: true });
    callout(world, 'Leonie leaps to the trapeze!', 'She will pounce on the mark: get clear!');
    return true;
  }
  if (s.hoops <= 0) {
    if (pending) s.hoops = 1;
    else {
      s.hoops = frac < 0.5 ? 10 : 13;
      const n = 6;
      const w = map.width / n;
      const flip = (s.flip = !s.flip) ? 1 : 0;
      for (let i = flip; i < n; i += 2) addZone(world, { kind: 'thorns', x: i * w, w, warn: 1.8, damage: 170, from: m, hoop: true });
      callout(world, 'Rings of fire!', 'Stand between the hoops');
    }
  }
  if (!s.roared && frac <= 0.5) {
    s.roared = true;
    for (const g of up) hurtMember(world, g, 90, m.x, { knock: true });
    world.juice.push({ type: 'shake', mag: 8, dur: 0.6 });
    callout(world, 'ROAAAR!', 'Leonie is angry now: everything comes faster');
    radio(world, 'roar');
  }
  return false;
}

function marionetta(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { mark: 6, puppets: [0.7, 0.35], dance: 4 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'thorns');
  s.mark -= dt;
  if (s.mark <= 0 && !room.yank && up.length) {
    s.mark = 10;
    const g = pick(up.filter((o) => o.role !== 'tank').length ? up.filter((o) => o.role !== 'tank') : up);
    room.yank = { id: g.id, at: world.now + 2.6 };
    callout(world, `Strings on ${g.bot ? g.name : 'you'}!`, 'She will yank them to her: be ready to heal and run!');
  }
  if (s.puppets.length && frac <= s.puppets[0]) {
    s.puppets.shift();
    adds(world, m, 'marionette', [m.x - 200, m.x + 200], null);
    callout(world, 'She cuts her puppets loose!', 'Marionettes on the belts: bring them down');
    radio(world, 'puppets');
  }
  if (frac < 0.5) {
    s.dance -= dt;
    if (s.dance <= 0) {
      if (pending) s.dance = 1;
      else {
        s.dance = 11;
        const n = 8;
        const w = map.width / n;
        const flip = (s.flip = !s.flip) ? 1 : 0;
        for (let i = flip; i < n; i += 2) addZone(world, { kind: 'thorns', x: i * w, w, warn: 1.8, damage: 180, from: m, strings: true });
        callout(world, 'The string dance!', 'Strings sweep the floor: stand in the gaps');
      }
    }
  }
  return false;
}

function gearheart(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { phase: 1, saw: 4, cars: 6, sweep: 4 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'floor');
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    callout(world, 'The wheel turns!', "Its cars drop where they're marked: move!");
    radio(world, 'cars');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    callout(world, 'OVERWOUND!', 'She spins faster and faster: jump the sweeps, dodge the saws');
    radio(world, 'overwound');
  }
  s.saw -= dt;
  if (s.saw <= 0) {
    s.saw = s.phase === 3 ? 5 : 8;
    const dir = Math.random() < 0.5 ? 1 : -1;
    room.saws.push({ x: dir > 0 ? -40 : map.width + 40, dir, speed: s.phase === 3 ? 380 : 300, w: 40, damage: 160, hit: new Set() });
    callout(world, 'Gear saw!', dir > 0 ? 'Rolling from the left: jump it!' : 'Rolling from the right: jump it!');
  }
  if (s.phase >= 2) {
    s.cars -= dt;
    if (s.cars <= 0 && up.length) {
      s.cars = 9;
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 3)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 70, warn: 1.7, damage: 190, from: m, car: true });
    }
  }
  if (s.phase === 3) {
    s.sweep -= dt;
    if (s.sweep <= 0) {
      if (pending) s.sweep = 1;
      else {
        s.sweep = 11;
        addZone(world, { kind: 'floor', x: 0, w: map.width, warn: 2, damage: 230, from: m, spin: true });
        m.slamming = world.now + 2;
      }
    }
  }
  return m.slamming > world.now;
}

export function carnivalKilled(world, m) {
  if (m.def.mech === 'gearheart') {
    world.dungeon.room.saws = [];
    playScene(world, 'carnival_freed');
  }
}
