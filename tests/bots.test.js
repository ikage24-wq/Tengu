// The other players: generated characters that come and go without crowding the towns.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createBots, updateBots, botsIn, makeBotCharacter, buyFromShop } from '../src/world/bots.js';
import { speak, makeStyle } from '../src/world/chatter.js';
import { createWorld } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { addItem } from '../src/core/inventory.js';
import { computeStats } from '../src/core/stats.js';
import { JOBS } from '../src/data/jobs.js';
import { TOWNS } from '../src/data/maps.js';

// A small seeded random so the test is repeatable.
function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}

test('generated players are real characters with a job for their level and gear they can wear', () => {
  const rng = seeded(7);
  for (let i = 0; i < 60; i++) {
    const c = makeBotCharacter(rng, { name: `p${i}` });
    assert.ok(c.level >= 1 && c.level <= 70);
    if (c.level < 10) assert.equal(c.job, 'novice');
    else assert.notEqual(c.job, 'novice');
    assert.equal(c.ap, 0, 'every point is spent');
    const w = c.equipment.weapon;
    if (w) assert.ok(JOBS[c.job].weapons.includes(computeStats(c).weaponType) || c.job === 'novice');
    for (const inst of Object.values(c.equipment).filter(Boolean)) assert.ok(inst.id);
  }
});

test('players come and go over time, at least 20 online, spread by level, and nobody comes back', () => {
  const world = createWorld(createCharacter('Me', {}));
  world.log = () => {};
  const bots = createBots(world, seeded(3));
  const names = new Set();
  // Levels seen in each town over the whole run (one moment can be a fluke).
  const seen = Object.fromEntries(TOWNS.map((t) => [t, { sum: 0, n: 0 }]));
  for (let i = 0; i < 20000; i++) {
    updateBots(bots, world, 0.1);
    assert.ok(bots.list.length >= 20, 'at least 20 online');
    for (const t of TOWNS) assert.ok(botsIn(bots, t).length <= 8, `${t} stays uncrowded`);
    for (const b of bots.list) names.add(b.name);
    if (i % 50 === 0) {
      for (const t of TOWNS) {
        for (const b of botsIn(bots, t)) {
          seen[t].sum += b.level;
          seen[t].n++;
        }
      }
    }
  }
  assert.ok(names.size > 40, 'new players keep arriving');
  // Beginners gather in Sprout Village, veterans in Moonleaf Grove.
  const avg = (t) => seen[t].sum / Math.max(1, seen[t].n);
  assert.ok(avg('grove') > avg('sprout'), 'higher levels hang out in the high-level town');
  assert.equal(names.size, bots.names.size, 'names are never reused');
});

test('chat lines never repeat', () => {
  const memory = new Set();
  const style = makeStyle(seeded(5));
  const said = [];
  for (let i = 0; i < 300; i++) {
    const line = speak(memory, ['lfg', 'trade', 'question', 'smalltalk'][i % 4], { level: 20, player: 'Me' }, style, Math.random);
    if (line) said.push(line);
  }
  assert.equal(new Set(said).size, said.length);
  assert.ok(said.length > 250, 'there is plenty to say');
});

test('buying from a player shop moves the item and the gold', () => {
  const me = createCharacter('Me', {});
  me.gold = 1000;
  const bot = { name: 'Seller', char: createCharacter('Seller', {}), shop: { title: 't', items: [{ id: 'red_potion', qty: 10, price: 300 }] }, state: 'shop' };
  const r = buyFromShop(bot, 0, me, addItem);
  assert.equal(r.ok, true);
  assert.equal(me.gold, 700);
  assert.equal(bot.char.gold, 300);
  assert.equal(bot.shop, null, 'a sold-out shop closes');
});

test('parties: players around your level or below join, higher ones decline, and they leave when you do', async () => {
  const { invite, partyMembers, leaveParty, updateParty } = await import('../src/world/party.js');
  const world = createWorld(createCharacter('Me', {}));
  world.log = () => {};
  for (let i = 0; i < 20; i++) world.char.level++;
  const bots = { list: [], memory: new Set(), names: new Set(), rng: seeded(11) };
  world.bots = bots;
  const make = (name, level) => {
    const char = makeBotCharacter(seeded(level), { name });
    char.level = level;
    const bot = { id: name, name, char, level, style: {}, map: world.map.id, x: world.body.x + 30, facing: 1, state: 'idle', session: 999, stay: 999, nextLine: 999, appear: 0 };
    bots.list.push(bot);
    return bot;
  };
  const low = make('low', 12);
  const near = make('near', 24);
  const high = make('high', 40);
  for (const b of [low, near, high]) invite(bots, b, world);
  // A rigged coin so nobody declines on a whim.
  bots.rng = () => 0.5;
  for (let i = 0; i < 60; i++) updateParty(bots, world, 0.05);
  assert.deepEqual(partyMembers(bots).map((b) => b.id).sort(), ['low', 'near']);
  assert.equal(high.party, undefined, 'too far above you');
  leaveParty(bots, world);
  assert.equal(partyMembers(bots).length, 0);
});

test('a party member\'s kill gives you a share of the EXP and counts for your quests', async () => {
  const { updateWorld } = await import('../src/world/world.js');
  const { acceptQuest } = await import('../src/core/quests.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { loadMap } = await import('../src/world/world.js');
  const world = createWorld(createCharacter('Me', {}));
  world.log = () => {};
  loadMap(world, 'meadow1', 'west');
  world.mobs = [];
  const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 40, y: world.map.groundY });
  world.mobs.push(m);
  world.char.level = 3;
  acceptQuest(world.char, 'snail_trouble');
  const exp = world.char.exp;
  world.pending.push({ at: 0, mob: m, miss: false, damage: 1e6, crit: false, fromX: 0, stack: 0, party: 'x' });
  updateWorld(world, 1 / 60, { held: new Set(), pressed: new Set() });
  assert.equal(world.char.exp - exp, Math.round(m.def.exp * 0.6));
  assert.equal(world.char.quests.snail_trouble.kills.snailbun, 1);
});
