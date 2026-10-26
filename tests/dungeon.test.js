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

test('warriors tank, mages heal, everyone else deals damage', () => {
  assert.equal(roleOf('warrior', 'warrior'), 'tank');
  for (const job of ['mage', 'cleric', 'bishop', 'fpwizard']) assert.equal(roleOf(job, 'mage'), 'healer');
  for (const [job, fam] of [['archer', 'archer'], ['thief', 'thief']]) assert.equal(roleOf(job, fam), 'dps');
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
  assert.equal(healer.char.job, 'mage');
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

test("a mage's support skills heal, shield, and revive the group", async () => {
  const { cast } = await import('../src/world/combat.js');
  const { hurtMember } = await import('../src/world/dungeon.js');
  const rng = seeded(21);
  const world = heroAt(rng, 12, ['mage']);
  Object.assign(world.char.skills, { mend: 10, renew: 5, barrier: 5, revive: 5 });
  world.char.mp = 999;
  assert.equal(startRun(world), null);
  assert.equal(world.dungeon.roles.you, 'healer');
  updateBots(world.bots, world, 1 / 60);
  const group = groupOf(world);
  const bots = group.filter((g) => g.bot);
  bots.forEach((g, i) => Object.assign(g.body, { x: world.body.x + 30 + i * 20, y: world.body.y }));
  const ready = () => {
    world.attackTimer = 0;
    world.lockTimer = 0;
  };
  // Mend: everyone around you gets HP back.
  for (const g of bots) g.bot.hp = Math.round(g.bot.stats.maxHp / 2);
  ready();
  assert.ok(cast(world, 'mend').ok);
  for (const g of bots) assert.ok(g.bot.hp > g.bot.stats.maxHp / 2, `${g.name} healed`);
  // Arcane Barrier: a bubble on everyone that soaks up damage first.
  ready();
  assert.ok(cast(world, 'barrier').ok);
  const tank = bots.find((g) => g.role === 'tank');
  const shield = tank.bot.buffs.barrier.shield;
  assert.ok(shield > 0 && world.char.buffs.barrier.shield > 0);
  tank.bot.hp = tank.bot.stats.maxHp;
  hurtMember(world, tank, 1, 0, { pierce: true });
  assert.equal(tank.bot.hp, tank.bot.stats.maxHp, 'absorbed');
  assert.equal(tank.bot.buffs.barrier.shield, shield - 1);
  // Revive: nobody to raise, then a fallen tank gets back up.
  ready();
  assert.equal(cast(world, 'revive').reason, 'noone');
  tank.bot.down = true;
  tank.bot.hp = 0;
  ready();
  assert.ok(cast(world, 'revive').ok);
  assert.ok(!tank.bot.down && tank.bot.hp > 0);
  // Renew: HP comes back every second.
  ready();
  assert.ok(cast(world, 'renew').ok);
  const dps = bots.find((g) => g.role === 'dps');
  dps.bot.hp = 50;
  for (let i = 0; i < 70; i++) updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: true });
  assert.ok(dps.bot.hp > 50, 'renewed');
});

test("a warrior's tank skills: Provoke, Chain Hook, Shield Wall", async () => {
  const { cast } = await import('../src/world/combat.js');
  const { loadMap } = await import('../src/world/world.js');
  const { hurtMember } = await import('../src/world/dungeon.js');
  const rng = seeded(31);
  const world = heroAt(rng, 12, ['warrior']);
  Object.assign(world.char.skills, { provoke: 5, chainhook: 10, shieldwall: 10, rallycry: 5 });
  world.char.mp = 999;
  const ready = () => {
    world.attackTimer = 0;
    world.lockTimer = 0;
  };
  // Out in the field, the hook drags a monster in front of you over to you.
  loadMap(world, 'woods', 'west');
  const b = world.body;
  const m = world.mobs.find((x) => x.y === world.map.groundY && x.x > 300 && x.def.hp >= 300);
  Object.assign(b, { x: m.x - 200, y: world.map.groundY, onGround: true, facing: 1 });
  ready();
  assert.equal(cast(world, 'chainhook').targets >= 1, true);
  for (let i = 0; i < 30; i++) updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: true });
  assert.ok(Math.abs(m.x - b.x) < 80, `dragged over (now ${Math.round(Math.abs(m.x - b.x))}px away)`);
  // In a dungeon, Provoke turns a pack on you.
  loadMap(world, 'hollow_gate', 'start');
  assert.equal(startRun(world), null);
  const pack = world.mobs.filter((x) => x.spawn.pack === 'a');
  Object.assign(world.body, { x: pack[0].x - 120, y: world.map.groundY, onGround: true });
  ready();
  assert.ok(cast(world, 'provoke').ok);
  for (const x of pack) {
    assert.ok(x.engaged);
    assert.equal(x.taunt.id, 'you');
  }
  // Shield Wall takes a share off every hit.
  const me = groupOf(world).find((g) => !g.bot);
  world.char.hp = world.stats.maxHp;
  hurtMember(world, me, 100, 0, { pierce: true });
  const plain = world.stats.maxHp - world.char.hp;
  ready();
  assert.ok(cast(world, 'shieldwall').ok);
  world.char.hp = world.stats.maxHp;
  hurtMember(world, me, 100, 0, { pierce: true });
  assert.ok(world.stats.maxHp - world.char.hp < plain, 'less damage behind the shield');
});
