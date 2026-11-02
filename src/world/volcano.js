// What makes each room of the Candy Volcano its own (docs/design/candy-volcano.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the drawing
// is in render/volcano.js.
//
//   The Gumdrop Valley        sticky taffy patches slow whoever walks through them; gather the
//                             three sugar crystals.
//   The Licorice Mine         a pit of hot caramel under the tunnels burns whoever stands in it;
//                             minecarts ride the rails across.
//   The Candy Kitchen         the puzzle: the cauldron's recipe (a new one each run); add candies
//                             from the dispensers, exactly; one too many spoils the pot.
//   The Caramel Forge         Toffee: hammer quakes along the floor (jump), sparks that leave pools
//                             of hot caramel, and at half health the bellows blow everyone back.
//   The Gingerbread Ramparts  Gretel: lance charges the length of the wall, an icing shield that
//                             turns hits from the front (strike from behind), frosting rain.
//   The Crater                Queen Bonbon: sugar bombs, then the caramel rises over the crater
//                             floor (up on the islands), then Eruption.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const VOLCANO_MECHS = new Set(['toffee', 'gretel', 'bonbon']);
export const VOLCANO_CHANNEL = { crystal: 0.8, dispenser: 0.5 };
export const CANDY = ['red', 'yellow', 'green', 'blue'];

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};
const onFloor = (world, b) => b.onGround && Math.abs(b.y - world.map.groundY) < 3;

// ---------- Rooms ----------

export function volcanoSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'volcano') return;
  // The kitchen: a recipe of four or five candies in three colours, a new one each run.
  if (room.objects.some((o) => o.kind === 'dispenser')) {
    const colours = [...CANDY].sort(() => Math.random() - 0.5).slice(0, 3);
    const need = {};
    const total = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < total; i++) {
      const c = colours[i % 3 === 0 ? 0 : 1 + Math.floor(Math.random() * 2)];
      need[c] = (need[c] ?? 0) + 1;
    }
    room.recipe = { need, have: {} };
  }
  room.burnAt = {};
  room.pools = [];
  // The crater's caramel only rises once the queen calls it.
  if (map.lateFlood) room.flood = null;
}

export const recipeWords = (room) => `The recipe: ${Object.entries(room.recipe.need).map(([c, n]) => `${n} ${c}`).join(', ')}`;
export const recipeDone = (r) => Object.entries(r.need).every(([c, n]) => (r.have[c] ?? 0) === n) && Object.keys(r.have).every((c) => r.need[c]);
// Candies in the pot, and how many the recipe needs.
export const recipeCount = (room) => ({ have: Object.values(room.recipe.have).reduce((a, b) => a + b, 0), need: Object.values(room.recipe.need).reduce((a, b) => a + b, 0) });
// Whether a dispenser's candy is still wanted (party members only use those).
export const wantCandy = (room, o) => (room.recipe?.need[o.colour] ?? 0) > (room.recipe?.have[o.colour] ?? 0);

// Adding a candy from a dispenser: too many of one spoils the pot (it empties and something crawls
// out); the exact recipe finishes the room. Returns whether the recipe is done.
export function addCandy(world, o) {
  const room = world.dungeon.room;
  const r = room.recipe;
  r.have[o.colour] = (r.have[o.colour] ?? 0) + 1;
  o.progress = 0;
  o.usedAt = world.now;
  if ((r.have[o.colour] ?? 0) > (r.need[o.colour] ?? 0)) {
    r.have = {};
    room.spoiledAt = world.now;
    adds(world, null, 'gummybear', [o.x + 50], null);
    callout(world, 'The pot is spoiled!', `Too much ${o.colour}: it all bubbles over. Start again`);
    return false;
  }
  if (recipeDone(r)) {
    for (const d of room.objects) if (d.kind === 'dispenser') d.done = true;
    callout(world, 'Perfect!', 'The cauldron bubbles gold and the oven door swings open');
    return true;
  }
  return false;
}

export function tickVolcano(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'volcano' || !room) return;
  for (const g of up) {
    const b = g.body;
    // Sticky taffy: whoever walks through it moves at half pace.
    const stuck = (map.sticky ?? []).some((s) => b.onGround && Math.abs(b.y - s.y) < 3 && b.x > s.x1 && b.x < s.x2);
    if (stuck && b.lastX != null) b.x = b.lastX + (b.x - b.lastX) * 0.45;
    b.lastX = b.x;
    // Hot caramel underfoot (the mine's pit, the smith's pools) burns now and then.
    const pit = (map.hotFloor ?? []).some(([x1, x2]) => onFloor(world, b) && b.x > x1 && b.x < x2);
    const pool = room.pools.some((p) => world.now < p.until && b.onGround && Math.abs(b.y - p.y) < 3 && Math.abs(b.x - p.x) < p.w / 2);
    if ((pit || pool) && world.now - (room.burnAt[g.id] ?? -9) > 0.8) {
      room.burnAt[g.id] = world.now;
      hurtMember(world, g, pit ? 70 : 60, b.x, { pierce: true });
    }
  }
  room.pools = room.pools.filter((p) => world.now < p.until);
  // The forge's bellows: everyone pushed back from the smith while they blow.
  const w = room.bellows;
  if (w && world.now < w.until) for (const g of up) if (!g.body.rope) g.body.x = Math.max(24, Math.min(map.width - 24, g.body.x + Math.sign(g.body.x - w.x || 1) * 130 * dt));
}

// ---------- The bosses ----------

// Gretel's icing shield turns hits from the front while it's up (go round behind her).
export function volcanoHitMul(world, m, body) {
  if (m.def.mech === 'gretel' && m.shieldUntil > world.now && body) {
    const front = Math.sign(body.x - m.x) === Math.sign(m.dir || 1);
    return front ? 0.15 : 1.4;
  }
  return 1;
}

export function volcanoBoss(world, m, up, dt) {
  if (m.def.mech === 'toffee') return toffee(world, m, up, dt);
  if (m.def.mech === 'gretel') return gretel(world, m, up, dt);
  if (m.def.mech === 'bonbon') return bonbon(world, m, up, dt);
  return false;
}

function toffee(world, m, up, dt) {
  const room = world.dungeon.room;
  const s = (m.mech ??= { quake: 7, sparks: 4, bellows: false });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'floor');
  s.quake -= dt;
  s.sparks -= dt;
  if (s.quake <= 0) {
    if (pending) s.quake = 1;
    else {
      s.quake = 12;
      addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 2, damage: 230, from: m, quake: true });
      callout(world, 'Hammer Quake!', 'The whole floor shakes: jump!');
      m.slamming = world.now + 2;
    }
  }
  if (s.sparks <= 0 && up.length) {
    s.sparks = 8;
    for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 3)) {
      const y = floorY(world, g.body);
      addZone(world, { kind: 'circle', x: g.body.x, y, w: 60, warn: 1.5, damage: 160, from: m, spark: true });
      room.pools.push({ x: g.body.x, y, w: 60, until: world.now + 1.5 + 9 });
    }
    callout(world, 'Sparks!', 'Hot caramel splashes down, and stays hot: move off it');
  }
  if (!s.bellows && frac <= 0.5) {
    s.bellows = true;
    room.bellows = { x: m.x, until: world.now + 3 };
    callout(world, 'The bellows!', 'A blast of hot air throws everyone back');
    radio(world, 'bellows');
  }
  return m.slamming > world.now;
}

// A charge down the wall (after a lane telegraph): whoever it passes through is knocked away.
function charging(world, m, up, dt) {
  const c = m.charging;
  if (!c) return false;
  m.state = 'walk';
  m.dir = c.dir;
  m.x += c.dir * 460 * dt;
  for (const g of up) {
    if (c.hit.has(g.id) || Math.abs(g.body.x - m.x) > m.def.w / 2 + 8 || Math.abs(g.body.y - m.y) > 50) continue;
    c.hit.add(g.id);
    hurtMember(world, g, 220, m.x - c.dir * 40, { knock: true });
  }
  const wall = c.dir > 0 ? m.fx2 : m.fx1;
  if ((c.dir > 0 && m.x >= wall) || (c.dir < 0 && m.x <= wall)) {
    m.x = wall;
    m.charging = null;
  }
  return true;
}

function gretel(world, m, up, dt) {
  const s = (m.mech ??= { charge: 8, shield: 5, rain: 11 });
  const frac = m.hp / m.def.hp;
  if (charging(world, m, up, dt)) return true;
  if (m.aim) return true;
  s.charge -= dt;
  s.shield -= dt;
  s.rain -= dt;
  if (s.charge <= 0 && !m.windup && up.length) {
    s.charge = frac < 0.5 ? 9 : 13;
    const dir = m.x < (m.fx1 + m.fx2) / 2 ? 1 : -1;
    const x = dir > 0 ? m.x : m.fx1 - m.def.w / 2;
    const w = dir > 0 ? m.fx2 + m.def.w / 2 - m.x : m.x - x;
    m.aim = { dir };
    m.dir = dir;
    m.state = 'idle';
    addZone(world, { kind: 'lane', x, w, warn: 1.5, from: m, dir });
    callout(world, 'Lance charge!', 'Out of the lane, or over it!');
    return true;
  }
  if (s.shield <= 0) {
    s.shield = 12;
    m.shieldUntil = world.now + 5;
    callout(world, 'Icing Shield!', 'It turns hits from the front: strike her from behind!');
    radio(world, 'shield');
  }
  if (s.rain <= 0 && up.length) {
    s.rain = 10;
    for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 58, warn: 1.5, damage: 170, from: m, frost: true });
    callout(world, 'Frosting Rain!', 'Step off the pink marks');
  }
  return false;
}

function bonbon(world, m, up, dt) {
  const room = world.dungeon.room;
  const s = (m.mech ??= { phase: 1, bombs: 4, erupt: 4 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && z.kind === 'floor');
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    room.flood = { t: 2, state: 'calm', since: 0 };
    callout(world, 'The caramel rises!', 'Up on the rock-candy islands when it bubbles!');
    radio(world, 'caramel');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    callout(world, 'ERUPTION!', 'The whole crater flares: jump, or get up high!');
    radio(world, 'erupt');
  }
  s.bombs -= dt;
  if (s.bombs <= 0 && up.length) {
    s.bombs = s.phase === 3 ? 6 : 8;
    const spots = up.map((g) => g.body).concat([{ x: m.x + (Math.random() - 0.5) * 600, y: world.map.groundY }]);
    for (const b of spots) addZone(world, { kind: 'circle', x: b.x, y: b.y === world.map.groundY ? b.y : floorY(world, b), w: 64, warn: 1.5, damage: 180, from: m, bomb: true });
    callout(world, 'Sugar bombs!', 'Step off the marks');
  }
  if (s.phase === 3) {
    s.erupt -= dt;
    if (s.erupt <= 0) {
      if (pending) s.erupt = 1;
      else {
        s.erupt = 13;
        addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 2, damage: 260, from: m, erupt: true });
        m.slamming = world.now + 2;
      }
    }
  }
  return m.slamming > world.now;
}

export function volcanoKilled(world, m) {
  const room = world.dungeon.room;
  if (m.def.mech === 'toffee') room.pools = [];
  if (m.def.mech === 'bonbon') {
    room.flood = null;
    playScene(world, 'volcano_freed');
  }
}
