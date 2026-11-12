// Regression tests for bugs a play-through audit found: flyers sinking into the ground, bots
// freezing on ropes, gather quests the player can't work, bots staring up at a flyer they can't
// reach, and bots that couldn't get down (or across a cloud) to revive someone.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createWorld, updateWorld, loadMap, hurtPlayer } from '../src/world/world.js';
import { createBots, updateBots, makeBotCharacter, recruitBot } from '../src/world/bots.js';
import { joinParty, partyMembers } from '../src/world/party.js';
import { boardOffers, pqGoal } from '../src/world/partyquest.js';
import { groundAt } from '../src/world/physics.js';
import { MAPS } from '../src/data/maps.js';
import { NODES } from '../src/data/gathering.js';
import { needFor, skillOfKind, lifeLevel } from '../src/core/life.js';

function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}
const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
const CLOCK = () => new Date(2026, 10, 3, 15, 0);

function field(mapId, { level = 30, members = 2, seed = 5 } = {}) {
  const rng = seeded(seed);
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level, jobs: ['archer'] });
  char.mapId = mapId;
  const world = createWorld(char);
  world.log = () => {};
  world.clock = () => CLOCK().getTime();
  world.bots = createBots(world, rng, { clock: CLOCK });
  loadMap(world, mapId, MAPS[mapId].portals[0].id);
  for (let i = 0; i < members; i++) joinParty(world.bots, recruitBot(world.bots, world, { level, jobs: [i ? 'warrior' : 'thief'] }), world);
  return world;
}
const step = (world) => {
  updateWorld(world, DT, idle);
  updateBots(world.bots, world, DT);
  if (world.scene) world.scene = null;
};
function withRandom(seed, fn) {
  const real = Math.random;
  Math.random = seeded(seed);
  try {
    return fn();
  } finally {
    Math.random = real;
  }
}

test('flyers chasing you below a cliff stay out of the ground, and float home after', () => {
  withRandom(3, () => {
    const world = field('glade', { members: 0 });
    let deepest = -Infinity;
    for (let i = 0; i < 60 * 40; i++) {
      world.char.hp = 1e6;
      Object.assign(world.body, { x: 960, y: groundAt(world.map, 960), vx: 0 });
      const chasing = i < 60 * 20;
      for (const m of world.mobs) if (m.def.fly) m.aggroUntil = chasing ? world.now + 5 : 0;
      step(world);
      for (const m of world.mobs) if (m.def.fly && m.hp > 0) deepest = Math.max(deepest, m.y - groundAt(world.map, m.x));
    }
    assert.ok(deepest < -4, `a flyer dipped ${deepest.toFixed(0)} px into the ground`);
    const flyers = world.mobs.filter((m) => m.def.fly && m.hp > 0);
    assert.ok(flyers.length > 0);
    for (const m of flyers) assert.ok(Math.abs(m.baseY - m.homeY) < 2, `a ${m.def.id} stayed ${(m.baseY - m.homeY).toFixed(0)} px off its hover height`);
  });
});

test('a bot whose path is cleared mid-climb finishes the climb instead of hanging on the rope', () => {
  withRandom(4, () => {
    const world = field('ridge');
    const bot = partyMembers(world.bots)[0];
    for (let i = 0; i < 30; i++) step(world);
    const rope = world.map.ropes[0];
    Object.assign(bot.body, { x: rope.x, y: (rope.top + rope.bottom) / 2, vx: 0, vy: 0, onGround: false, rope });
    let off = null;
    for (let i = 0; i < 60 * 8 && off == null; i++) {
      // A ping, a revive call or a life skill ending clears their plans every half second.
      if (i % 30 === 0) {
        bot.brain.path = null;
        bot.brain.goal = null;
      }
      step(world);
      if (!bot.body.rope) off = world.now;
    }
    assert.ok(off != null, 'still on the rope after 8 s');
  });
});

test('gather quests on the board are for spots you can work, or say what level they need', () => {
  for (const [town, level] of [['sprout', 6], ['harbor', 18], ['crag', 28], ['grove', 42]]) {
    const world = field(town, { level, members: 0 });
    world.char.life = {};
    for (let h = 0; h < 6; h++) {
      world.clock = () => CLOCK().getTime() + h * 2.1 * 3600e3;
      const q = boardOffers(world).find((o) => o.kind === 'gather');
      assert.ok(q, `${town}: a gather on the board`);
      const spots = (NODES[q.map] ?? MAPS[q.map].nodes ?? []).filter((n) => !n.night && (n.pool ?? {})[q.item]);
      const workable = spots.some((n) => lifeLevel(world.char, skillOfKind(n.kind)) >= needFor(n));
      if (!workable) {
        assert.ok(q.needs?.lv > 1, `${town}: ${q.item} on ${q.map} needs a level and doesn't say so`);
        assert.match(pqGoal(q), /Lv \d+/);
      }
    }
  }
  // Harbor at Lv 18 with Gathering Lv 1 used to offer Chanterelle (Gathering Lv 12) in the woods.
  const world = field('harbor', { level: 18, members: 0 });
  world.char.life = {};
  const q = boardOffers(world).find((o) => o.kind === 'gather');
  assert.ok(!q.needs, `${q.item} on ${q.map} should be one you can gather`);
});

test('a hunter gives up on a flyer hovering out of reach and goes after something else', () => {
  withRandom(6, () => {
    const world = field('glade', { level: 20, members: 1 });
    const bot = partyMembers(world.bots)[0];
    for (let i = 0; i < 30; i++) step(world);
    const flyer = world.mobs.find((m) => m.def.fly);
    assert.ok(flyer);
    // Hovering high over the bot's own floor (above the map's highest ledge, so truly out of
    // reach whatever the layout), frozen in place, the only monster there.
    world.mobs = [flyer];
    world.spawner.slots = [];
    const x = bot.body.x;
    const high = Math.min(bot.body.y - 260, ...world.map.platforms.map((p) => p.y - 300));
    Object.assign(flyer, { x, baseY: high, y: high, frozenUntil: Infinity, homeY: high });
    bot.brain.target = flyer;
    let gaveUp = null;
    for (let i = 0; i < 60 * 12 && gaveUp == null; i++) {
      world.char.hp = 1e6;
      step(world);
      if (bot.brain.outOfReach?.some((o) => o.mob === flyer)) gaveUp = world.now;
    }
    assert.ok(gaveUp != null, 'never gave up on a flyer it could not reach');
    // ...and leaves it be for a while.
    for (let i = 0; i < 60 * 3; i++) step(world);
    assert.notEqual(bot.brain.target, flyer);
  });
});

test('party members get down (and across a drifting cloud) to revive you on another floor', () => {
  for (const [id, hx, hy, bx, by] of [['peak', 711, 580, 1055, 693], ['meadow1', 1061, 280, 886, 440]]) {
    withRandom(5, () => {
      const world = field(id);
      for (let i = 0; i < 120; i++) step(world);
      for (const b of partyMembers(world.bots)) Object.assign(b.body, { x: bx, y: by, vx: 0, vy: 0, onGround: true, rope: null });
      Object.assign(world.body, { x: hx, y: hy, vx: 0, vy: 0, onGround: true, rope: null });
      for (let i = 0; i < 10; i++) step(world);
      world.invuln = 0;
      world.char.hp = 1;
      hurtPlayer(world, 1e7, world.body.x + 10);
      assert.ok(world.dead, `${id}: the hero went down`);
      const t0 = world.now;
      for (let i = 0; i < 60 * 40 && world.dead; i++) step(world);
      assert.ok(!world.dead, `${id}: nobody came to revive you within 40 s`);
      assert.ok(world.now - t0 < 40);
    });
  }
});
