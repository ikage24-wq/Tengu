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
//   The Crater                Queen Bonbon (Chapter 8 rework, 2026-11-19), down her cake a layer
//                             at a time: Sprinkle Rain, then the Frosting Flood (up on the
//                             rock-candy stacks), then Cherry Bomb. Elder Ichigo, her only taster,
//                             eats cake on the far stack the whole time.

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
  if (w && world.now < w.until && world.now >= (w.from ?? 0)) for (const g of up) if (!g.body.rope) g.body.x = Math.max(24, Math.min(map.width - 24, g.body.x + Math.sign(g.body.x - w.x || 1) * 130 * dt));
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
      // (A cast bar for it, and her quake pose: render/mobs/toffeerig.js.)
      m.cast = { name: 'Hammer Quake', t0: world.now, dur: 2 };
      m.castPose = 'quake';
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
    // (She flicks it up off her hammer: render/mobs/toffeerig.js.)
    m.sparkAt = world.now + 0.5;
  }
  if (!s.bellows && frac <= 0.5) {
    s.bellows = true;
    // (A huge breath first, then she blows: render/mobs/toffeerig.js.)
    room.bellows = { x: m.x, from: world.now + 0.9, until: world.now + 3.9 };
    m.blowAt = world.now + 0.9;
    callout(world, 'The bellows!', 'A blast of hot air throws everyone back');
    radio(world, 'bellows');
  }
  // The quake's wind-up and blow (for the rig's pose), landing as the floor does.
  const left = (m.slamming ?? 0) - world.now;
  if (m.cast && m.castPose === 'quake') {
    const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
    m.windup = left > 0 && left < total ? left : 0;
    if (left <= 0) {
      m.cast = null;
      m.castPose = null;
      m.windup = 0;
      m.attackAt = world.now;
    }
  }
  return left > 0;
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
    // (She raises her lance to the sky, then sweeps it down: render/mobs/gretelrig.js.)
    m.rainAt = world.now + 0.7;
  }
  return false;
}

// Queen Bonbon bakes a bigger cake every day in case someone comes to share it. The fight goes down
// her cake a layer at a time:
//   the topping   (to 66%)  Sprinkle Rain: a cast, then sprinkles pour onto everyone's spot and two
//                           more besides (step off the marks).
//   the frosting  (to 33%)  the Frosting Flood: pink frosting floods the crater floor every so often
//                           (up on the rock-candy stacks), the sprinkles still falling.
//   the cherry    (to 0)    Cherry Bomb: she crouches, leaps, and the cherry off her crown comes down
//                           on one of you in a big splash (get clear), between the floods.
function bonbon(world, m, up, dt) {
  const room = world.dungeon.room;
  const map = world.map;
  const s = (m.mech ??= { phase: 1, rain: 5, cherry: 6 });
  const frac = m.hp / m.def.hp;
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    room.flood = { t: 2, state: 'calm', since: 0 };
    callout(world, 'The Frosting Flood!', 'Up on the rock-candy stacks when it comes!');
    // (A scoop of frosting off the floor, flung high: render/bonbon.)
    m.bombAt = world.now + 0.6;
    radio(world, 'frosting');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    s.cherry = 3;
    callout(world, 'The cherry on top!', 'When her cherry comes down, get out from under it!');
    radio(world, 'cherry');
  }
  // (A cast with no pose of its own ends when its bar runs out.)
  if (m.cast && !m.castPose && world.now >= m.cast.t0 + m.cast.dur) m.cast = null;
  s.rain -= dt;
  if (s.rain <= 0 && up.length && !m.cast) {
    s.rain = s.phase === 1 ? 8 : 12;
    const spots = up.map((g) => ({ x: g.body.x, y: floorY(world, g.body) }));
    for (let k = 0; k < 2; k++) spots.push({ x: Math.max(60, Math.min(map.width - 60, m.x + (Math.random() - 0.5) * 700)), y: map.groundY });
    for (const p of spots) addZone(world, { kind: 'circle', x: p.x, y: p.y, w: 64, warn: 1.8, damage: 180, from: m, look: 'sprinkles' });
    m.cast = { name: 'Sprinkle Rain', t0: world.now, dur: 1.8 };
    // (Her arms flung up, scattering sprinkles to the sky: render/bonbon.)
    m.floodAt = world.now + 0.8;
    callout(world, 'Sprinkle Rain!', 'Step off the marks');
  }
  if (s.phase === 3) {
    s.cherry -= dt;
    if (s.cherry <= 0 && up.length && !m.cast) {
      s.cherry = 13;
      // (A breath after the splash before the sprinkles come again.)
      s.rain = Math.max(s.rain, 4.5);
      const g = up[Math.floor(Math.random() * up.length)];
      addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 170, warn: 2.2, damage: 300, from: m, look: 'cherry', fromX: m.x, fromY: m.y - m.def.h });
      m.slamming = world.now + 2.2;
      // (A cast bar, a crouch, a leap, and the cherry comes down: render/bonbon.)
      m.cast = { name: 'Cherry Bomb', t0: world.now, dur: 2.2 };
      m.castPose = 'erupt';
      callout(world, 'Cherry Bomb!', 'Get out from under the cherry!');
    }
  }
  // The Eruption's wind-up and blow (for the rig's pose), landing as the floor does.
  const left = (m.slamming ?? 0) - world.now;
  if (m.cast && m.castPose === 'erupt') {
    const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
    m.windup = left > 0 && left < total ? left : 0;
    if (left <= 0) {
      m.cast = null;
      m.castPose = null;
      m.windup = 0;
      m.attackAt = world.now;
    }
  }
  return left > 0;
}

export function volcanoKilled(world, m) {
  const room = world.dungeon.room;
  if (m.def.mech === 'toffee') room.pools = [];
  if (m.def.mech === 'bonbon') {
    room.flood = null;
    // Elder Ichigo goes home to the palace (render/prologue.js), after a slice.
    world.char.elders = { ...(world.char.elders ?? {}), ichigo: true };
    playScene(world, 'volcano_freed');
  }
}
