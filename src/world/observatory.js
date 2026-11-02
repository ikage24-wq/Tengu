// What makes each room of the Star Observatory its own (docs/design/star-observatory.md; the map
// fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in here;
// the drawing is in render/observatory.js.
//
//   The Starlit Stair     meteor showers fall on the floors now and then; light the three star lamps.
//   The Constellation Hall  the puzzle: five star lamps joined in a constellation; using one flips
//                         it and the lamps joined to it. Light all five.
//   The Weightless Reading Room  low gravity: long, floaty jumps between far-apart shelves.
//   The Archive           Folio: hurled stacks of overdue books, Moth Librarians, and at half health
//                         the bookcases slide in from both ends of the hall.
//   The Orrery            the Eclipse Twins: the hall is half sunlit, half shadowed, swapping at each
//                         eclipse; Sol is only really hurt in the shadow, Luna only in the light.
//   The Telescope Crown   Astraea: Meteor Shower, then Constellations (lines of stars across the
//                         floor), then Supernova (the floor flares; the stars pull everyone light).

import { addZone, adds, callout } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { GRAVITY } from './physics.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const OBS_MECHS = new Set(['folio', 'eclipse', 'astraea']);
export const OBS_CHANNEL = { starlamp: 0.8, starlamp1: 1 };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};

// ---------- The constellation puzzle ----------

// Which lamps a press flips: itself and its neighbours in the constellation.
const flipsOf = (map, i) => [i, ...(map.constellation ?? []).filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a))];
// The fewest presses that light every lamp from here (lamp ids), found by trying every set.
function solveLamps(map, lamps) {
  const n = lamps.length;
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    const lit = lamps.map((o) => o.lit);
    for (let i = 0; i < n; i++) if (mask & (1 << i)) for (const j of flipsOf(map, i)) lit[j] = !lit[j];
    if (!lit.every(Boolean)) continue;
    const presses = lamps.filter((_, i) => mask & (1 << i)).map((o) => o.id);
    if (!best || presses.length < best.length) best = presses;
  }
  return new Set(best ?? []);
}

// ---------- Rooms ----------

export function obsSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'observatory') return;
  room.meteorIn = map.meteors ? map.meteors.every * 0.5 : null;
  const lamps = room.objects.filter((o) => o.kind === 'starlamp');
  if (lamps.length) {
    // Start from every lamp lit and scramble it with two to four presses, so it can always be solved.
    lamps.forEach((o) => (o.lit = true));
    const order = lamps.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
    for (const i of order) for (const j of flipsOf(map, i)) lamps[j].lit = !lamps[j].lit;
    if (lamps.every((o) => o.lit)) for (const j of flipsOf(map, 0)) lamps[j].lit = !lamps[j].lit;
    room.lamps = { press: solveLamps(map, lamps) };
  }
  room.eclipse = map.eclipse ? { lightLeft: true, t: 15 } : null;
  room.lowG = map.lowGravity ?? 0;
}

// Using a star lamp: it and its neighbours flip; once all five shine they lock in. Returns whether
// the hall is solved.
export function pressLamp(world, o) {
  const room = world.dungeon.room;
  const lamps = room.objects.filter((x) => x.kind === 'starlamp');
  const i = lamps.indexOf(o);
  for (const j of flipsOf(world.map, i)) lamps[j].lit = !lamps[j].lit;
  o.pressedAt = world.now;
  o.progress = 0;
  const solved = lamps.every((x) => x.lit);
  if (solved) {
    for (const x of lamps) x.done = true;
    callout(world, 'The constellation shines!', 'The stair to the next floor unfolds');
  }
  room.lamps.press = solveLamps(world.map, lamps);
  return solved;
}
// Lamps lit, for the room's task.
export const lampsLit = (room) => room.objects.filter((o) => o.kind === 'starlamp' && o.lit).length;

export function tickObs(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'observatory' || !room) return;
  // Meteor showers on the stair: a few marked spots on whoever's floors.
  if (room.meteorIn != null && up.length) {
    room.meteorIn -= dt;
    if (room.meteorIn <= 0) {
      room.meteorIn = map.meteors.every;
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x + (Math.random() - 0.5) * 60, y: floorY(world, g.body), w: 60, warn: 1.6, damage: map.meteors.damage, meteor: true });
      callout(world, 'Meteor shower!', 'Watch for the marks');
    }
  }
  // Low gravity: whoever is in the air falls slower (the room's own, or Astraea's pull).
  const lowG = Math.max(room.lowG ?? 0, room.pull ?? 0);
  if (lowG) for (const g of up) if (!g.body.onGround && !g.body.rope) g.body.vy -= GRAVITY * lowG * dt;
  // Folio's bookcases slide back once she's out of the fight (a wipe sets the room back).
  if (room.walls && !world.mobs.some((m) => m.def.mech === 'folio' && m.hp > 0 && m.engaged)) room.walls = null;
  // The eclipse: the light swaps sides on a timer.
  const e = room.eclipse;
  if (e && world.mobs.some((m) => m.def.mech === 'eclipse' && m.hp > 0 && m.engaged)) {
    e.t -= dt;
    if (e.t <= 0) {
      e.t = 15;
      e.lightLeft = !e.lightLeft;
      callout(world, 'Eclipse!', e.lightLeft ? 'The light falls on the left now' : 'The light falls on the right now');
    }
  }
}

// ---------- The bosses ----------

// A share of a hit that reaches an observatory boss: Sol is only really hurt in the shadow, Luna in
// the light.
export function obsHitMul(world, m) {
  if (m.def.mech !== 'eclipse') return 1;
  const e = world.dungeon.room.eclipse;
  if (!e) return 1;
  const inLight = (m.x < world.map.width / 2) === e.lightLeft;
  const sun = m.def.id === 'eclipsesol';
  return sun === inLight ? 0.3 : 1.25;
}

export function obsBoss(world, m, up, dt) {
  if (m.def.mech === 'folio') return folio(world, m, up, dt);
  if (m.def.mech === 'eclipse') return eclipse(world, m, up, dt);
  if (m.def.mech === 'astraea') return astraea(world, m, up, dt);
  return false;
}

function folio(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { books: 5, moths: [0.7, 0.4], shelved: false });
  const frac = m.hp / m.def.hp;
  s.books -= dt;
  if (s.books <= 0 && up.length) {
    s.books = 8;
    for (const g of [...up.filter((o) => o.role !== 'tank')].sort(() => Math.random() - 0.5).slice(0, 3)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 66, warn: 1.6, damage: 190, from: m, books: true });
    callout(world, 'Overdue!', 'Stacks of books come crashing down: move');
  }
  if (s.moths.length && frac <= s.moths[0]) {
    s.moths.shift();
    const healer = up.find((g) => g.role === 'healer') ?? pick(up);
    adds(world, m, 'mothlibrarian', [m.x - 200, m.x + 200], healer?.id);
    callout(world, 'Folio calls her moths!', 'They flutter at the healer: catch them');
    radio(world, 'moths');
  }
  if (!s.shelved && frac <= 0.5) {
    s.shelved = true;
    room.walls = { l: 0, r: map.width, toL: m.x - 380, toR: m.x + 380 };
    callout(world, 'The shelves are moving!', 'The bookcases close in from both ends: stay in the middle');
    radio(world, 'shelves');
  }
  return false;
}

function eclipse(world, m, up, dt) {
  const s = (m.mech ??= { beam: m.def.id === 'eclipsesol' ? 6 : 10 });
  const sister = world.mobs.find((o) => o !== m && o.def.mech === 'eclipse' && o.hp > 0);
  if (!sister && !s.alone) {
    s.alone = true;
    callout(world, `${m.def.name.split(',')[0]} is alone!`, 'Her eclipse is broken: no more halves');
    world.dungeon.room.eclipse = null;
  }
  s.beam -= dt;
  if (s.beam <= 0 && up.length) {
    s.beam = s.alone ? 6 : 9;
    for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 64, warn: 1.5, damage: 180, from: m, sun: m.def.id === 'eclipsesol' });
    callout(world, m.def.id === 'eclipsesol' ? 'Sunbeam!' : 'Moonbeam!', 'Step out of the light');
  }
  return false;
}

function astraea(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { phase: 1, fall: 4, lines: 6, nova: 4 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && (z.kind === 'thorns' || z.kind === 'floor'));
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    callout(world, 'Constellations!', 'Lines of stars light up across the floor: stand in the dark');
    radio(world, 'lines');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    room.pull = 0.45;
    callout(world, 'Supernova!', 'The stars pull you light: jump the flare');
    radio(world, 'nova');
  }
  s.fall -= dt;
  if (s.fall <= 0 && up.length) {
    s.fall = s.phase === 1 ? 6 : 9;
    for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 60, warn: 1.5, damage: 180, from: m, meteor: true });
    callout(world, 'Meteor Shower!', 'Stars falling on you: step aside');
  }
  if (s.phase >= 2) {
    s.lines -= dt;
    if (s.lines <= 0) {
      if (pending) s.lines = 1;
      else {
        s.lines = 10;
        const n = 8;
        const w = map.width / n;
        const flip = (s.flip = !s.flip) ? 1 : 0;
        for (let i = flip; i < n; i += 2) addZone(world, { kind: 'thorns', x: i * w, w, warn: 1.8, damage: 200, from: m, stars: true });
      }
    }
  }
  if (s.phase === 3) {
    s.nova -= dt;
    if (s.nova <= 0) {
      if (pending) s.nova = 1;
      else {
        s.nova = 12;
        addZone(world, { kind: 'floor', x: 0, w: map.width, warn: 2, damage: 250, from: m, nova: true });
        m.slamming = world.now + 2;
      }
    }
  }
  return m.slamming > world.now;
}

export function obsKilled(world, m) {
  const room = world.dungeon.room;
  if (m.def.mech === 'folio') room.walls = null;
  if (m.def.mech === 'astraea') {
    room.pull = 0;
    playScene(world, 'observatory_freed');
  }
}
