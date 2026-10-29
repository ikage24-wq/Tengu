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
import { planGroup, startRun, groupOf, isUp, noteHit, healerTurn } from '../src/world/dungeon.js';

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

test('warriors tank, Spirit Mages heal, everyone else deals damage', () => {
  assert.equal(roleOf('warrior', 'warrior'), 'tank');
  for (const [job, fam] of [['archer', 'archer'], ['thief', 'thief']]) assert.equal(roleOf(job, fam), 'dps');
  assert.equal(roleOf('spiritmage', 'mage'), 'healer', 'the Spirit Mage heals');
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
  // The Spirit Mage takes the healer's seat.
  assert.equal(healer.char.job, 'spiritmage');
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

test("a warrior's tank procs: War Cry taunts and guards as Valor fills, Iron Guard braces", async () => {
  const { braceOnHit } = await import('../src/world/combat.js');
  const { addValor } = await import('../src/world/melee.js');
  const { loadMap } = await import('../src/world/world.js');
  const { hurtMember } = await import('../src/world/dungeon.js');
  const rng = seeded(31);
  const world = heroAt(rng, 12, ['warrior']);
  world.char.skills.warcry = 5;
  // In a dungeon, War Cry turns a pack on you and guards the party around you.
  loadMap(world, 'hollow_gate', 'start');
  assert.equal(startRun(world), null);
  const pack = world.mobs.filter((x) => x.spawn.pack === 'a');
  Object.assign(world.body, { x: pack[0].x - 120, y: world.map.groundY, onGround: true });
  world.valor = 95;
  addValor(world, 10);
  for (const x of pack) {
    assert.ok(x.engaged);
    assert.equal(x.taunt.id, 'you');
  }
  assert.ok(world.char.buffs.warcry?.values.dmgCut > 0, 'the cry guards you');
  delete world.char.buffs.warcry;
  // Iron Guard takes a share off every hit once it's up.
  const me = groupOf(world).find((g) => !g.bot);
  world.char.hp = world.stats.maxHp;
  hurtMember(world, me, 100, 0, { pierce: true });
  const plain = world.stats.maxHp - world.char.hp;
  world.char.skills.ironguard = 10;
  braceOnHit(world, world.stats.maxHp, () => 0);
  assert.ok(world.char.buffs.ironguard, 'braced');
  world.char.hp = world.stats.maxHp;
  hurtMember(world, me, 100, 0, { pierce: true });
  assert.ok(world.stats.maxHp - world.char.hp < plain, 'less damage behind the guard');
});

test("a Spirit Mage in the healer's seat wards the tank and blesses the hurt, her own way", () => {
  const rng = seeded(11);
  const world = heroAt(rng, 12, ['archer']);
  assert.equal(startRun(world), null);
  const healer = partyMembers(world.bots).find((b) => world.dungeon.roles[b.id] === 'healer');
  assert.equal(healer.char.job, 'spiritmage');
  for (let i = 0; i < 30; i++) {
    updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: false });
    updateBots(world.bots, world, 1 / 60);
  }
  world.dungeon.combat = true;
  delete groupOf(world).find((g) => g.role === 'tank').bot.buffs?.spiritward;
  healerTurn(healer, world, rng);
  const tank = groupOf(world).find((g) => g.role === 'tank');
  assert.ok(tank.bot.buffs.spiritward?.shield > 0, 'a Spirit Ward on the tank');
  assert.equal(healer.attack.pose, 'kaguraward', 'cast with her fan sweep');
  world.char.hp = Math.round(world.stats.maxHp * 0.3);
  const before = world.char.hp;
  healerTurn(healer, world, rng);
  assert.ok(world.char.hp > before, 'and she heals you when you are hurt');
  assert.equal(healer.attack.pose, 'kagurabless');
  assert.ok(world.fx.some((f) => f.kind === 'blessing'), 'with her column of light');
});

test("a Shrine Maiden in the healer's seat heals with Grand Blessing and raises the fallen with the Resurrection Dance", async () => {
  assert.equal(roleOf('shrinemaiden', 'mage'), 'healer');
  assert.equal(roleOf('onmyoji', 'mage'), 'dps', 'an Onmyoji deals damage');
  const { computeStats } = await import('../src/core/stats.js');
  const rng = seeded(11);
  const world = heroAt(rng, 12, ['archer']);
  assert.equal(startRun(world), null);
  const healer = partyMembers(world.bots).find((b) => world.dungeon.roles[b.id] === 'healer');
  // (The Hollow's healers are Spirit Mages; one past level 30 has taken her path.)
  healer.char = makeBotCharacter(rng, { name: healer.name, pro: false, level: 34, jobs: ['spiritmage', 'shrinemaiden'] });
  healer.stats = computeStats(healer.char);
  assert.equal(healer.char.job, 'shrinemaiden');
  for (let i = 0; i < 30; i++) {
    updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set(), locked: false });
    updateBots(world.bots, world, 1 / 60);
  }
  // Several hurt: Grand Blessing.
  world.dungeon.combat = true;
  for (const g of groupOf(world)) {
    if (g.bot) g.bot.hp = Math.round(g.bot.stats.maxHp * 0.4);
    else world.char.hp = Math.round(world.stats.maxHp * 0.4);
  }
  healerTurn(healer, world, rng);
  assert.equal(healer.attack.pose, 'shrinegrand', 'her great sweep of the gohei');
  assert.ok(world.fx.some((f) => f.kind === 'grandblessing'), 'and the great pillar of light');
  // A fallen member, out of the fight: the Resurrection Dance.
  world.dungeon.combat = false;
  // (Everyone else whole again, so raising the fallen is what's left to do.)
  for (const g of groupOf(world)) {
    if (g.bot) g.bot.hp = g.bot.stats.maxHp;
    else world.char.hp = world.stats.maxHp;
  }
  const down = groupOf(world).find((g) => g.bot && g.bot !== healer);
  down.bot.down = true;
  down.bot.hp = 0;
  healerTurn(healer, world, rng);
  assert.ok(isUp(world, down), 'they get up');
  assert.equal(healer.attack.pose, 'shrinerevive');
});

test('an Onmyoji in the group dances her spells and flings talismans', async () => {
  const { makeAI } = await import('../src/world/party.js');
  const rng = seeded(4);
  const char = makeBotCharacter(rng, { name: 'Omy', pro: false, level: 34, jobs: ['spiritmage', 'onmyoji'] });
  assert.equal(char.job, 'onmyoji');
  const bot = { char, stats: null, level: 34, pro: false, body: { x: 0, y: 0, facing: 1 } };
  const { computeStats } = await import('../src/core/stats.js');
  bot.stats = computeStats(char);
  const ai = makeAI(bot, rng, 'sniper');
  assert.equal(ai.weapon.special, 'onmyoofuda', 'her big one is Ofuda Barrage');
  assert.ok(ai.weapon.ofuda && ai.weapon.magic, 'talismans and spells');
});
