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

// ---------- Talking back, town life, hunters, news ----------

import { answer } from '../src/world/chatter.js';
import { loadMap, updateWorld } from '../src/world/world.js';
import { gainExp } from '../src/core/character.js';
import { expToNext } from '../src/core/exp.js';

const quiet = (world) => {
  const lines = [];
  world.log = (t) => lines.push(t);
  return lines;
};
const NONE = { held: new Set(), pressed: new Set() };

test('players answer questions from the game itself: maps, monsters, NPCs, fish, dishes', () => {
  const ctx = { here: 'sprout', playerLevel: 12 };
  assert.match(answer('where is clover hills?', ctx), /Petal Meadow/);
  assert.match(answer('what lvl is mossy woods', ctx), /lv 11-18/);
  assert.match(answer('where do jackalopes spawn?', ctx), /Clover Hills/);
  assert.match(answer('where is pip', ctx), /Sprout Village/);
  assert.match(answer('how do i fish?', ctx), /rod/);
  assert.match(answer('where is tamamo', ctx), /Fox Shrine Path/);
  assert.match(answer('how do i make Glow Eel Kabayaki', ctx), /Glow Eel \+ 1 Wisp Flame/);
  assert.equal(answer('i like turtles', ctx), null);
});

test('players nearby say hi back, answer a question, and cheer when you level up', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(11));
  // Put a few right next to you.
  for (const b of bots.list.slice(0, 3)) Object.assign(b, { map: 'sprout', x: world.body.x + 40, state: 'idle', timer: 99, session: 999, stay: 999, shop: null });
  const step = (secs) => {
    for (let t = 0; t < secs; t += 0.1) {
      world.now += 0.1;
      updateBots(bots, world, 0.1);
    }
  };
  world.heard = { words: 'hi everyone!', at: world.now };
  step(5);
  assert.ok(lines.some((l) => /: /.test(l) && bots.list.slice(0, 3).some((b) => l.startsWith(b.name))), 'someone said hi back');
  lines.length = 0;
  world.heard = { words: 'where is clover hills?', at: world.now };
  step(5);
  assert.ok(lines.some((l) => /clover hills/i.test(l)), `an answer about Clover Hills (${lines.join(' | ')})`);
  lines.length = 0;
  gainExp(world.char, expToNext(world.char.level));
  step(6);
  assert.ok(lines.some((l) => /gr|gz|congrats|ding|woo/i.test(l)), `cheers for the level (${lines.join(' | ')})`);
});

test('in town, players fish off the pier, cook, chat with each other, and wear titles and sets', () => {
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  loadMap(world, 'harbor', 'start');
  const bots = createBots(world, seeded(5));
  const seen = new Set();
  for (let t = 0; t < 600; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    for (const b of botsIn(bots, 'harbor')) seen.add(b.state);
  }
  assert.ok(seen.has('fish'), `someone fished (${[...seen]})`);
  assert.ok(seen.has('cook'), 'someone cooked');
  assert.ok(seen.has('chat'), 'two chatted');
  const rng = seeded(9);
  const chars = Array.from({ length: 60 }, (_, i) => makeBotCharacter(rng, { name: `s${i}`, level: 40 }));
  assert.ok(chars.some((c) => Object.values(c.equipment).some((e) => e?.id.startsWith('set_'))), 'some wear set pieces');
  assert.ok(bots.list.some((b) => b.title), 'some wear titles');
});

test('players hunt the field you are on, leave the monsters by you alone, and their kills give you nothing', () => {
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  world.char.level = 20;
  world.god = true;
  const bots = createBots(world, seeded(21));
  loadMap(world, 'woods', 'start');
  // Make sure some are here.
  let n = 0;
  for (let i = 0; i < 6 && n < 2; i++) {
    bots.huntMap = null;
    updateBots(bots, world, 0.05);
    n = bots.list.filter((b) => b.hunter).length;
  }
  assert.ok(n >= 1, 'hunters on the map');
  const exp0 = world.char.exp;
  const lvl0 = world.char.level;
  let hits = 0;
  const seenHits = new Set();
  for (let t = 0; t < 40; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
    for (const h of world.pending) if (h.stranger && !seenHits.has(h)) {
      seenHits.add(h);
      hits++;
      assert.ok(Math.abs(h.mob.x - world.body.x) >= 140 || Math.abs(h.mob.y - world.body.y) >= 90 || h.mob.def.boss, `never a monster by you (${Math.round(h.mob.x)},${Math.round(h.mob.y)} you ${Math.round(world.body.x)},${Math.round(world.body.y)} from ${Math.round(h.fromX)})`);
    }
  }
  assert.ok(hits > 0, 'they fought');
  assert.equal(world.char.level, lvl0);
  assert.equal(world.char.exp, exp0, 'no EXP from their kills');
  // Back in town they're gone from the field.
  loadMap(world, 'sprout', 'start');
  updateBots(bots, world, 0.05);
  assert.equal(bots.list.filter((b) => b.hunter && !b.gone).length, 0);
});

test('the server shares news of big moments now and then', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(2));
  for (let t = 0; t < 600; t += 0.5) {
    world.now += 0.5;
    updateBots(bots, world, 0.5);
  }
  assert.ok(lines.filter((l) => l.startsWith('★')).length >= 2, 'a few announcements in ten minutes');
});

test('other players really fight: their job\'s own string of moves, back to back, with skills and a finisher', async () => {
  const { tickHunter, botSkills } = await import('../src/world/party.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { createBody } = await import('../src/world/physics.js');
  for (const job of [['warrior', 'paladin'], ['thief', 'shinobi'], ['archer', 'beastmaster']]) {
    const world = createWorld(createCharacter('Me', {}));
    quiet(world);
    world.god = true;
    loadMap(world, 'woods', 'start');
    world.mobs = [];
    // A tough monster well away from you, with a player on it.
    const x = world.body.x + 600 < world.map.width - 100 ? world.body.x + 600 : world.body.x - 600;
    const m = spawnMob(world.map, { mob: 'snailbun', x, y: world.map.groundY });
    m.hp = m.def.hp = 1e9;
    m.def = { ...m.def, speed: 0 };
    world.mobs.push(m);
    const char = makeBotCharacter(seeded(5), { name: 'Hunter', level: 45, jobs: job, pro: false });
    assert.ok(botSkills(char).some((s) => s.full), `${job[1]} has a finisher to fight with`);
    const bot = { id: 'h1', name: 'Hunter', char, level: 45, hunter: true, map: world.map.id, x: x - 30, facing: 1, state: 'hunt', body: createBody(x - 30, world.map.groundY), session: 999, stay: 999, nextLine: 999, appear: 0 };
    const moves = new Set();
    const seen = new Set();
    let blows = 0;
    for (let t = 0; t < 20; t += 1 / 30) {
      world.now += 1 / 30;
      world.pending = world.pending.filter((h) => h.at > world.now);
      tickHunter(bot, world, [bot], 1 / 30, seeded(Math.floor(t * 30) + 1));
      if (bot.attack?.fighting) moves.add(bot.attack.pose);
      for (const h of world.pending) if (!seen.has(h)) {
        seen.add(h);
        blows++;
      }
    }
    assert.ok(blows >= 26, `${job[1]} lands a steady stream of blows (${blows} in 20 s)`);
    assert.ok(moves.size >= 5, `${job[1]} mixes up their moves (${[...moves].join(', ')})`);
  }
});
