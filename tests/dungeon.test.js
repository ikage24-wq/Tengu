// Dungeons: group roles, the group finder, threat, and a whole run of Rootwood Hollow played by a
// simple autopilot.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeBotCharacter, createBots, updateBots } from '../src/world/bots.js';
import { createWorld, updateWorld } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { partyMembers } from '../src/world/party.js';
import { roleOf, DUNGEONS } from '../src/data/dungeons.js';
import { MAPS } from '../src/data/maps.js';
import { MOBS } from '../src/data/mobs.js';
import { planGroup, startRun, groupOf, isUp, noteHit } from '../src/world/dungeon.js';

function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}

// A world with a hero of the given job and level, standing at the Hollow Gate.
function heroAt(rng, level, jobs) {
  const char = makeBotCharacter(rng, { name: 'Tester', pro: false, level, jobs });
  char.mapId = 'hollow_gate';
  const world = createWorld(char);
  world.bots = createBots(world, rng);
  return world;
}

test('warriors tank, clerics and bishops heal, everyone else deals damage', () => {
  assert.equal(roleOf('warrior', 'warrior'), 'tank');
  assert.equal(roleOf('cleric', 'mage'), 'healer');
  assert.equal(roleOf('bishop', 'mage'), 'healer');
  for (const [job, fam] of [['mage', 'mage'], ['fpwizard', 'mage'], ['archer', 'archer'], ['thief', 'thief']]) assert.equal(roleOf(job, fam), 'dps');
  assert.equal(roleOf('novice', 'beginner'), null);
});

test('the group finder fills a 1 tank / 1 healer / 2 DPS group around you', () => {
  const rng = seeded(3);
  const world = heroAt(rng, 11, ['archer']);
  const plan = planGroup(world);
  assert.deepEqual(plan.slots.map((s) => s.role), ['tank', 'healer', 'dps', 'dps']);
  assert.equal(plan.slots.filter((s) => s.who === 'you').length, 1);
  assert.equal(startRun(world), null);
  const members = partyMembers(world.bots);
  assert.equal(members.length, 3);
  const roles = Object.values(world.dungeon.roles).sort();
  assert.deepEqual(roles, ['dps', 'dps', 'healer', 'tank']);
  const tank = members.find((b) => world.dungeon.roles[b.id] === 'tank');
  const healer = members.find((b) => world.dungeon.roles[b.id] === 'healer');
  assert.equal(tank.char.job, 'warrior');
  assert.equal(healer.char.job, 'cleric');
  assert.equal(world.map.id, DUNGEONS.hollow.rooms[0]);
  for (const b of members) assert.equal(b.hp, b.stats.maxHp);
});

test('novices and full roles are turned away', () => {
  const rng = seeded(5);
  const novice = createWorld(Object.assign(createCharacter('Nov', {}), { mapId: 'hollow_gate' }));
  novice.bots = createBots(novice, rng);
  assert.match(planGroup(novice).why, /first job/);
  const world = heroAt(rng, 12, ['warrior']);
  const other = makeBotCharacter(rng, { name: 'Two', pro: false, level: 12, jobs: ['warrior'] });
  world.bots.list.push({ id: 'two', name: 'Two', char: other, level: 12, party: true, map: world.map.id });
  assert.match(planGroup(world).why, /Tank/);
});

test('every dungeon room is laid out and every monster in it exists', () => {
  for (const id of DUNGEONS.hollow.rooms) {
    const map = MAPS[id];
    assert.equal(map.dungeon, 'hollow');
    for (const s of map.spawns) assert.ok(MOBS[s.mob], s.mob);
    for (const p of map.portals) if (p.to) assert.ok(MAPS[p.to], `${id} -> ${p.to}`);
  }
});

test("a tank's hits make five times the threat", () => {
  const rng = seeded(9);
  const world = heroAt(rng, 11, ['archer']);
  startRun(world);
  const tank = partyMembers(world.bots).find((b) => world.dungeon.roles[b.id] === 'tank');
  const m = world.mobs[0];
  noteHit(world, m, { damage: 100, party: tank.id });
  noteHit(world, m, { damage: 100 });
  // (Waking up adds a point for whoever started it.)
  assert.equal(m.threat[tank.id], 501);
  assert.equal(m.threat.you, 101);
  assert.ok(m.engaged);
  // Its whole pack wakes up with it.
  for (const o of world.mobs.filter((x) => x.spawn.pack === m.spawn.pack)) assert.ok(o.engaged);
});

// A plain autopilot: fight what the group fights, step out of telegraphs, jump the slam, light,
// free, and pick up what the room needs, then walk through the exit (opening the chest first).
function pilot(world) {
  const run = world.dungeon;
  const b = world.body;
  const held = new Set();
  const pressed = new Set();
  const go = (x) => {
    if (Math.abs(x - b.x) > 6) held.add(x > b.x ? 'ArrowRight' : 'ArrowLeft');
  };
  if (world.dead) return { held, pressed };
  const fights = world.mobs.filter((m) => m.hp > 0 && m.engaged);
  const danger = run.zones.find((z) => !z.hit && z.kind !== 'floor' && (z.kind === 'circle' ? Math.abs(b.x - z.x) < z.w / 2 + 8 : b.x >= z.x - 8 && b.x <= z.x + z.w + 8));
  if (run.zones.some((z) => !z.hit && z.kind === 'floor' && z.warn - z.t < 0.3) && b.onGround) held.add('Space');
  const room = run.room;
  if (danger) {
    const lo = danger.kind === 'circle' ? danger.x - danger.w / 2 - 20 : danger.x - 20;
    const hi = danger.kind === 'circle' ? danger.x + danger.w / 2 + 20 : danger.x + danger.w + 20;
    go(Math.abs(b.x - lo) < Math.abs(b.x - hi) && lo > 30 ? lo : hi);
  } else if (fights.length) {
    const t = fights.reduce((a, m) => (Math.abs(m.x - b.x) < Math.abs(a.x - b.x) ? m : a));
    const spot = t.x + (Math.sign(b.x - t.x) || -1) * 150;
    if (Math.abs(b.x - spot) > 20) go(spot);
    else {
      b.facing = Math.sign(t.x - b.x) || 1;
      held.add('KeyZ');
    }
  } else if (room.cleared) {
    const chest = room.objects.find((o) => o.kind === 'chest' && !o.done);
    const x = chest ? chest.x : world.map.portals.find((p) => p.sealed).x;
    go(x);
    if (Math.abs(x - b.x) < 10 && Math.round(world.now * 60) % 10 === 0) pressed.add('ArrowUp');
  } else {
    const key = room.keys.find((k) => !k.got);
    const asleep = world.mobs.filter((m) => m.hp > 0 && !m.engaged);
    const obj = room.objects.find((o) => !o.done && o.kind !== 'chest' && !asleep.some((m) => Math.abs(m.x - o.x) < 170));
    if (key) go(key.x);
    else if (obj) {
      go(obj.x);
      if (Math.abs(obj.x - b.x) < 8 && !world.channel && b.onGround && Math.abs(b.vx) < 1) pressed.add('ArrowUp');
    } else {
      const tank = groupOf(world).find((g) => g.role === 'tank' && isUp(world, g));
      if (tank) go(tank.body.x - 60);
    }
  }
  return { held, pressed };
}

test('a group clears Rootwood Hollow from the first room to the chest', () => {
  const random = Math.random;
  const rng = seeded(11);
  Math.random = rng;
  try {
    const world = heroAt(rng, 11, ['archer']);
    assert.equal(startRun(world), null);
    const seen = new Set();
    let done = false;
    const gold = world.char.gold;
    for (let i = 0; i < 60 * 60 * 15 && world.dungeon; i++) {
      seen.add(world.map.id);
      done = world.dungeon.done;
      const { held, pressed } = pilot(world);
      updateWorld(world, 1 / 60, { held, pressed, locked: false });
      updateBots(world.bots, world, 1 / 60);
    }
    assert.ok(done, `finished (got as far as ${[...seen].at(-1)})`);
    assert.equal(world.map.id, 'hollow_gate');
    for (const id of DUNGEONS.hollow.rooms) assert.ok(seen.has(id), id);
    assert.ok(world.char.gold >= gold + DUNGEONS.hollow.reward.gold, 'opened the chest');
    // The finder's recruits said goodbye.
    assert.equal(partyMembers(world.bots).length, 0);
  } finally {
    Math.random = random;
  }
});
