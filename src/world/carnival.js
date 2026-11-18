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
//   The Ferris Wheel   Queen Gearheart (reworked 2026-11-18, Chapter 6): she has to perform while
//                      anyone is watching, and Elder Kuri never stopped. Her fight is the fair's
//                      games, one a phase: whack-a-mole, ring toss, then the rollercoaster. Wound
//                      down at the end, not destroyed.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { killMob } from './world.js';
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
  room.coasterCfg = null;
  room.yank = null;
}

// A rolling hazard along the floor (the coaster car): moves, and knocks back whoever is on the floor
// where it passes, once each.
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
  // The coaster: waiting, then the rail lights up, then the car roars through. (Queen Gearheart's
  // finale brings it into the plaza with a timing of its own: room.coasterCfg.)
  const c = room.coaster;
  const cfg = room.coasterCfg ?? map.coaster;
  if (c && cfg) {
    c.t -= dt;
    if (c.state === 'waiting' && c.t <= 0) {
      c.state = 'warning';
      c.t = 2;
      callout(world, 'The coaster is coming!', c.dir > 0 ? 'From the left: get up on a platform!' : 'From the right: get up on a platform!');
    } else if (c.state === 'warning' && c.t <= 0) {
      c.state = 'running';
      Object.assign(c, { x: c.dir > 0 ? -60 : map.width + 60, speed: cfg.speed, w: 90, damage: cfg.damage, hit: new Set() });
    } else if (c.state === 'running' && roll(world, c, dt, up)) {
      c.state = 'waiting';
      c.t = cfg.every;
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

// Queen Gearheart's games:
//   Whack-a-Mole  (to 66%) brass moles pop up out of holes in the plaza for a few seconds; whack all
//                 of a wave before they duck and she loses the beat (hit harder for a while); one
//                 left up pops out with a BOINK on whoever's close.
//   Ring Toss     (to 33%) giant rings rain down on marked spots; after each volley she takes a bow,
//                 open to a hit.
//   The Finale    (to the end) the coaster comes through the plaza on the floor: up on the parked cars!
const MOLE_LIFE = 4.2;
function gearheart(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { phase: 1, moles: 5, rings: 4, wave: null });
  const frac = m.hp / m.def.hp;
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    s.rings = 2;
    for (const o of world.mobs) if (o.def.id === 'gearmole' && o.hp > 0) killMob(world, o);
    s.wave = null;
    callout(world, 'Game two: Ring Toss!', 'Rings rain down on the marks: step off them');
    radio(world, 'rings');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    room.coasterCfg = { every: 8, speed: 560, damage: 200 };
    room.coaster = { t: 3, state: 'waiting', dir: Math.random() < 0.5 ? 1 : -1, x: 0, hit: new Set() };
    callout(world, 'The Grand Finale!', 'The coaster comes through the plaza: up on the parked cars!');
    radio(world, 'finale');
  }
  // Whack-a-Mole.
  if (s.phase === 1) {
    s.moles -= dt;
    if (s.moles <= 0 && !s.wave && up.length) {
      s.moles = 8;
      // (Three holes side by side, so a group can get round them all in time.)
      const all = map.holes ?? [];
      const at = Math.floor(Math.random() * Math.max(1, all.length - 2));
      const holes = all.slice(at, at + 3);
      const before = new Set(world.mobs);
      adds(world, m, 'gearmole', holes, null);
      const moles = world.mobs.filter((o) => !before.has(o));
      for (const o of moles) Object.assign(o, { popAt: world.now, popLife: MOLE_LIFE, atkT: 99, frozenUntil: world.now + MOLE_LIFE + 1 });
      s.wave = { moles, at: world.now };
      callout(world, 'Game one: Whack-a-Mole!', 'Bop the brass moles before they duck: knock her off the beat');
      radio(world, 'moles');
    }
    const w = s.wave;
    if (w) {
      for (const o of w.moles) o.atkT = 99;
      if (w.moles.every((o) => o.hp <= 0)) {
        s.wave = null;
        m.vulnUntil = world.now + 6;
        callout(world, 'Off the beat!', "She's lost her rhythm: hit her now!");
      } else if (world.now - w.at >= MOLE_LIFE) {
        // The ones still up pop out with a BOINK, and duck away.
        for (const o of w.moles) {
          if (o.hp <= 0) continue;
          addZone(world, { kind: 'circle', x: o.x, y: map.groundY, w: 56, warn: 0.01, damage: 120, from: m, boink: true });
          killMob(world, o);
        }
        s.wave = null;
      }
    }
  }
  // Ring Toss: a volley on the marks, then a bow.
  if (s.phase === 2) {
    s.rings -= dt;
    if (s.rings <= 0 && up.length) {
      s.rings = 7;
      const marks = up.map((g) => g.body.x).sort(() => Math.random() - 0.5).slice(0, 2);
      while (marks.length < 4) marks.push(120 + Math.random() * (map.width - 240));
      for (const x of marks) addZone(world, { kind: 'circle', x, y: map.groundY, w: 72, warn: 1.6, damage: 180, from: m, ring: true });
      m.tossAt = world.now;
      m.vulnUntil = world.now + 1.6 + 3;
    }
  }
  return false;
}

export function carnivalKilled(world, m) {
  if (m.def.mech !== 'gearheart') return;
  // The games stop; Elder Kuri goes home to the palace (render/prologue.js).
  const room = world.dungeon.room;
  room.coaster = null;
  room.coasterCfg = null;
  for (const o of world.mobs) if (o.def.id === 'gearmole' && o.hp > 0) killMob(world, o);
  world.char.elders = { ...(world.char.elders ?? {}), kuri: true };
  world.map.elders = world.char.elders;
  playScene(world, 'carnival_freed');
}
