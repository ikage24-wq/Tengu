// What makes each room of Moonlit Manor its own (docs/design/moonlit-manor.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the
// drawing is in render/manor.js.
//
//   The Moonlit Garden    fountains spout on a beat and throw whoever stands in the basin up to the
//                         high terraces; light the three garden lanterns.
//   The Portrait Gallery  the puzzle: four portraits on three floors, each turned through its four
//                         pictures; set them to the family crest shown in the hall (moon, rose...).
//   The Ballroom          the Waltzing Armours dance as a pair: they take hold now and then (side by
//                         side they guard each other), then the Grand Waltz sweeps the floor wall to
//                         wall; the chandelier falls; when one falls the other dances alone, faster.
//   The Library           the lost books flutter along the shelves: catch them; page storms blow
//                         through the stacks and push everyone on that floor.
//   The Endless Hallway   the chase: Madame Velvet's tea trolley rumbles after the group; doors bar
//                         the way until their levers are pulled; at the end, Madame Velvet herself
//                         (scalding tea, flung plates to jump, the bell that calls the maids).
//   The Moonlit Rooftop   Lady Marigold: Tea for Two (teacups rain on marked spots), the Guests
//                         Arrive (ghost guests to clear while she floats out of reach), the Last
//                         Waltz (moonlit sweeps across the roof: get up on a chimney or jump).

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const MANOR_MECHS = new Set(['waltz', 'velvet', 'marigold']);

// The crest's pictures, in the order a portrait turns through them.
export const CREST = ['moon', 'rose', 'key', 'cup'];
// How long each manor thing takes to use.
export const MANOR_CHANNEL = { lantern: 1, portrait: 0.45, book: 0.7, lever: 0.6 };
// How high a fountain's spout throws you (about the same as a Hollow bounce cap).
export const SPOUT = 760;

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};

// ---------- Rooms ----------

export function manorSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'manor') return;
  room.fountains = (map.fountains ?? []).map((f, i) => ({ ...f, t: (f.every * i) / Math.max(1, map.fountains.length), state: 'calm', since: 0 }));
  // The gallery: a fresh crest each run, and every portrait starting on a wrong picture.
  if (map.puzzle) {
    room.crest = [0, 1, 2, 3].map(() => Math.floor(Math.random() * CREST.length));
    for (const o of room.objects) {
      if (o.kind !== 'portrait') continue;
      const want = room.crest[o.slot];
      o.face = (want + 1 + Math.floor(Math.random() * 3)) % CREST.length;
    }
  }
  for (const o of room.objects) if (o.kind === 'book') o.home = o.x;
  room.storm = map.storms ? { t: 9, on: null } : null;
  room.chase = map.chase ? { state: 'waiting', x: map.chase.from, speed: map.chase.speed, plateIn: 3, hitAt: {} } : null;
  room.chandelier = map.chandelier ? { x: map.chandelier.x, state: 'up', at: 0 } : null;
}

// The crest's names, for the callout as you walk in.
export const crestWords = (room) => room.crest.map((i) => CREST[i][0].toUpperCase() + CREST[i].slice(1)).join(' · ');

// Turning a portrait on to its next picture; it locks in place once it shows the crest's.
// Returns whether it's now right.
export function turnPortrait(world, o) {
  const room = world.dungeon.room;
  o.face = (o.face + 1) % CREST.length;
  o.turnedAt = world.now;
  return o.face === room.crest[o.slot];
}

// A door in the hallway is open once its lever is pulled.
export function doorOpen(room, d) {
  return Boolean(room.objects[d.lever]?.done);
}

export function tickManor(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'manor' || !room) return;
  tickFountains(world, room, dt, up);
  // The lost books flutter back and forth over their shelves, and hold still to be caught.
  for (const o of room.objects) {
    if (o.kind !== 'book' || o.done) continue;
    const held = world.channel?.obj === o || group.some((g) => g.bot?.brain?.task === o && Math.abs(g.body.x - o.x) < 22);
    if (!held) o.x = o.home + Math.sin((world.now + o.id * 1.7) * ((Math.PI * 2) / (o.period ?? 7))) * (o.dx ?? 40);
  }
  tickStorm(world, room, dt, up);
  tickChase(world, room, dt, up);
  // Hallway doors: shut until their lever is pulled.
  for (const d of map.doors ?? []) {
    if (doorOpen(room, d)) continue;
    for (const g of up) {
      const b = g.body;
      if (b.x > d.x - 12 && b.x < d.x + 4) b.x = d.x - 12;
    }
  }
}

function tickFountains(world, room, dt, up) {
  for (const f of room.fountains ?? []) {
    f.t -= dt;
    f.since += dt;
    if (f.t > 0) continue;
    if (f.state === 'calm') {
      f.state = 'bubbling';
      f.t = 0.9;
    } else if (f.state === 'bubbling') {
      f.state = 'spout';
      f.t = 1.1;
    } else {
      f.state = 'calm';
      f.t = f.every - 2;
    }
    f.since = 0;
  }
  // The spout throws whoever stands in the basin up to the terraces.
  for (const f of room.fountains ?? []) {
    if (f.state !== 'spout') continue;
    for (const g of up) {
      const b = g.body;
      if (Math.abs(b.x - f.x) > 24 || Math.abs(b.y - f.y) > 30 || b.vy < -200 || b.rope) continue;
      b.vy = -SPOUT;
      b.onGround = false;
      b.y -= 2;
      world.juice.push({ type: 'jump', x: f.x, y: f.y });
    }
  }
}

// Page storms: a gust tears through one floor of the stacks, pushing everyone on it one way.
function tickStorm(world, room, dt, up) {
  const s = room.storm;
  if (!s) return;
  const map = world.map;
  if (s.on) {
    s.on.t += dt;
    if (s.on.t > s.on.warn) for (const g of up) if (Math.abs(g.body.y - s.on.y) < 40 && !g.body.rope) g.body.x = Math.max(24, Math.min(map.width - 24, g.body.x + s.on.dir * 150 * dt));
    if (s.on.t > s.on.warn + 2.6) {
      s.on = null;
      s.t = 8 + Math.random() * 5;
    }
    return;
  }
  s.t -= dt;
  if (s.t > 0 || !up.length) return;
  const g = pick(up);
  s.on = { y: floorY(world, g.body), dir: Math.random() < 0.5 ? -1 : 1, t: 0, warn: 1.2 };
  callout(world, 'Page Storm!', s.on.dir > 0 ? 'The pages blow right: brace or ride it' : 'The pages blow left: brace or ride it');
}

// The chase: once anyone is past the start line, the trolley comes, faster and faster, and runs
// over whoever it catches. Plates fly ahead of it.
function tickChase(world, room, dt, up) {
  const c = room.chase;
  if (!c) return;
  const def = world.map.chase;
  if (c.state === 'waiting') {
    if (up.some((g) => g.body.x > def.start)) {
      c.state = 'rolling';
      callout(world, 'The trolley is coming!', 'RUN! Pull the levers to open the doors!');
      radio(world, 'chase');
    }
    return;
  }
  if (c.state !== 'rolling') return;
  c.speed = Math.min(def.top, c.speed + def.speedUp * dt);
  // It slows behind a shut door the group hasn't got through yet.
  c.x = Math.min(def.to, c.x + c.speed * dt);
  for (const g of up) {
    const b = g.body;
    if (b.x < c.x + 18 && b.x > c.x - 40 && world.now - (c.hitAt[g.id] ?? -9) > 1.2) {
      c.hitAt[g.id] = world.now;
      hurtMember(world, g, def.damage, c.x - 60, { knock: true });
      b.x = Math.max(b.x, c.x + 30);
    }
  }
  c.plateIn -= dt;
  if (c.plateIn <= 0 && up.length) {
    c.plateIn = def.plates;
    const lead = up.reduce((a, g) => (g.body.x > a.body.x ? g : a), up[0]);
    addZone(world, { kind: 'circle', x: lead.body.x + 40 + Math.random() * 60, y: floorY(world, lead.body), w: 54, warn: 1.1, damage: 90, plate: true });
  }
  if (c.x >= def.to) {
    c.state = 'parked';
    callout(world, 'The trolley grinds to a stop', 'Someone is waiting at the end of the hall...');
  }
}


// ---------- The bosses ----------

// A share of a hit that reaches a manor boss: the Armours guard each other side by side, and the
// hostess can't be touched while she floats above her guests.
export function manorHitMul(world, m) {
  const mech = m.def.mech;
  if (mech === 'waltz') {
    const partner = world.mobs.find((o) => o !== m && o.def.mech === 'waltz' && o.hp > 0);
    if (partner && m.holdUntil > world.now && Math.abs(partner.x - m.x) < 100) {
      partner.guardAt = world.now;
      return 0.35;
    }
    return 1;
  }
  if (mech === 'marigold' && m.mech?.aloft) return 0;
  return 1;
}

// Returns true while the boss is busy with a move of its own.
export function manorBoss(world, m, up, dt) {
  if (m.def.mech === 'waltz') return waltz(world, m, up, dt);
  if (m.def.mech === 'velvet') return velvet(world, m, up, dt);
  if (m.def.mech === 'marigold') return marigold(world, m, up, dt);
  return false;
}

// A gliding sweep from one wall to the other: whoever it touches is knocked away.
function sweeping(world, m, up, dt, speed, damage) {
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

// The Armours keep time together: every so often they come together and take hold (side by side
// they guard each other), then break into the Grand Waltz, sweeping the floor wall to wall.
function waltz(world, m, up, dt) {
  const room = world.dungeon.room;
  const lead = m.def.id === 'waltzrondo';
  const s = (m.mech ??= { hold: 8 });
  const partner = world.mobs.find((o) => o !== m && o.def.mech === 'waltz' && o.hp > 0);
  if (!partner && !s.alone) {
    s.alone = true;
    s.hold = Math.min(s.hold, 3);
    m.holdUntil = 0;
    callout(world, `${m.def.name.split(',')[0]} dances alone!`, 'Faster now, and furious');
    radio(world, 'alone');
  }
  // Halfway down, the chandelier comes down over the middle of the floor.
  const ch = room.chandelier;
  if (ch?.state === 'up' && m.hp / m.def.hp < 0.55) {
    ch.state = 'falling';
    ch.at = world.now;
    addZone(world, { kind: 'circle', x: ch.x, y: world.map.groundY, w: 150, warn: 2.4, damage: 260, chandelier: true });
    callout(world, 'The chandelier!', 'Get out from under it!');
  }
  if (ch?.state === 'falling' && world.now - ch.at > 2.4) ch.state = 'down';
  if (sweeping(world, m, up, dt, s.alone ? 420 : 340, 160)) return true;
  if (m.aim) return true;
  // The lead keeps the time (or whichever dances alone).
  if ((lead || s.alone) && up.length) {
    s.hold -= dt;
    if (s.hold <= 0 && !m.windup) {
      if (partner && !s.holding) {
        s.holding = true;
        s.hold = 3.5;
        m.holdUntil = partner.holdUntil = world.now + 3.5;
        callout(world, 'The Armours take hold!', 'Side by side they guard each other: get ready to dodge');
        return true;
      }
      s.holding = false;
      s.hold = s.alone ? 7 : 12;
      const dir = m.x < (m.fx1 + m.fx2) / 2 ? 1 : -1;
      for (const o of [m, partner].filter(Boolean)) {
        const x = dir > 0 ? o.x : o.fx1 - o.def.w / 2;
        const w = dir > 0 ? o.fx2 + o.def.w / 2 - o.x : o.x - x;
        o.aim = { dir };
        o.dir = dir;
        o.state = 'idle';
        o.holdUntil = 0;
        addZone(world, { kind: 'lane', x, w, warn: 1.5, from: o, dir });
      }
      callout(world, 'The Grand Waltz!', 'They sweep the floor: out of the lane, or jump!');
      return true;
    }
  }
  // Taking hold: they glide to each other and turn in place.
  if (partner && m.holdUntil > world.now) {
    const d = partner.x - m.x;
    m.dir = Math.sign(d) || 1;
    if (Math.abs(d) > 46) {
      m.state = 'walk';
      m.x = Math.max(m.x1, Math.min(m.x2, m.x + Math.sign(d) * 90 * dt));
    } else m.state = 'idle';
    return true;
  }
  return false;
}

function velvet(world, m, up, dt) {
  const s = (m.mech ??= { tea: 5, plates: 11, bells: [0.7, 0.4] });
  const frac = m.hp / m.def.hp;
  const nonTanks = up.filter((g) => g.role !== 'tank');
  const pending = world.dungeon.zones.some((z) => !z.hit);
  s.tea -= dt;
  s.plates -= dt;
  if (s.tea <= 0 && up.length) {
    s.tea = 9;
    for (const g of [...(nonTanks.length ? nonTanks : up)].sort(() => Math.random() - 0.5).slice(0, 3)) {
      addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 64, warn: 1.6, damage: 140, from: m, tea: true });
    }
    callout(world, 'Tea is served!', 'Scalding: step out of the steam');
  }
  if (s.plates <= 0) {
    if (pending) s.plates = 1;
    else {
      s.plates = 13;
      addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 1.6, damage: 180, from: m, plates: true });
      callout(world, 'Plates!', 'A stack of plates skims the floor: jump!');
      m.slamming = world.now + 1.6;
    }
  }
  if (s.bells.length && frac <= s.bells[0]) {
    s.bells.shift();
    const healer = up.find((g) => g.role === 'healer') ?? pick(up);
    adds(world, m, 'ghostmaid', [m.x - 160, m.x + 160], healer?.id);
    callout(world, 'Madame Velvet rings the bell!', 'The maids come running for the healer: catch them!');
    radio(world, 'bell');
  }
  return m.slamming > world.now;
}

function marigold(world, m, up, dt) {
  const room = world.dungeon.room;
  const s = (m.mech ??= { phase: 1, cups: 4, sweep: 0 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit);
  // Phase 2: the guests arrive, and she floats above them out of reach until they're gone.
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    s.aloft = true;
    adds(world, m, 'candlebride', [m.x - 260, m.x + 260], null);
    adds(world, m, 'armourknight', [m.x - 120, m.x + 120], null);
    callout(world, 'The Guests Arrive!', 'She floats out of reach: clear her guests!');
    radio(world, 'guests');
  }
  if (s.aloft && !room.adds.some((a) => a.hp > 0)) {
    s.aloft = false;
    m.vulnUntil = world.now + 6;
    callout(world, 'Her guests are gone!', 'Lady Marigold sinks down, dizzy: strike now!');
  }
  if (s.phase === 2 && !s.aloft && frac <= 0.33) {
    s.phase = 3;
    s.sweep = 2;
    callout(world, 'The Last Waltz!', 'Moonlight sweeps the roof: up on a chimney, or jump!');
    radio(world, 'lastwaltz');
  }
  s.cups -= dt;
  if (s.cups <= 0 && up.length) {
    s.cups = s.phase === 3 ? 11 : 8;
    const spots = up.map((g) => g.body).concat(s.phase >= 2 ? [{ x: m.x + (Math.random() - 0.5) * 500, y: world.map.groundY }] : []);
    for (const b of spots) addZone(world, { kind: 'circle', x: b.x, y: b.y === world.map.groundY ? b.y : floorY(world, b), w: 58, warn: 1.5, damage: 150, from: m, cups: true });
    callout(world, 'Tea for Two!', 'Teacups falling: step off the marks');
  }
  if (s.phase === 3) {
    s.sweep -= dt;
    if (s.sweep <= 0) {
      if (pending) s.sweep = 1;
      else {
        s.sweep = 12;
        addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 2, damage: 220, from: m, moon: true });
        m.slamming = world.now + 2;
      }
    }
  }
  return s.aloft || m.slamming > world.now;
}

// A manor boss down.
export function manorKilled(world, m) {
  if (m.def.mech === 'marigold') playScene(world, 'manor_freed');
}
