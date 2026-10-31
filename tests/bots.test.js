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

// A weekday evening, so how many are online (it follows the clock) is the same every run.
const EVENING = () => new Date(2026, 9, 28, 20, 0);

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
  const bots = createBots(world, seeded(3), { clock: EVENING });
  const names = new Set();
  // Levels seen in each town over the whole run (one moment can be a fluke).
  const seen = Object.fromEntries(TOWNS.map((t) => [t, { sum: 0, n: 0 }]));
  for (let i = 0; i < 20000; i++) {
    updateBots(bots, world, 0.1);
    assert.ok(bots.list.length >= 20, 'at least 20 online');
    for (const t of TOWNS) assert.ok(botsIn(bots, t).filter((b) => !b.legend && !b.merchant && !b.gm).length <= 8, `${t} stays uncrowded`);
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
  const bots = createBots(world, seeded(11), { clock: EVENING });
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
  step(8);
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
  const bots = createBots(world, seeded(5), { clock: EVENING });
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
  const bots = createBots(world, seeded(21), { clock: EVENING });
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
  const bots = createBots(world, seeded(2), { clock: EVENING });
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
    // (A copy of its kind, so other tests still get ordinary ones.)
    m.def = { ...m.def, hp: 1e9, speed: 0 };
    m.hp = 1e9;
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

test('fields are busy: every hunting map has a few players on it', () => {
  for (const id of ['woods', 'meadow1']) {
    for (let seed = 1; seed < 6; seed++) {
      const world = createWorld(createCharacter('Me', {}));
      quiet(world);
      world.char.level = 20;
      const bots = createBots(world, seeded(seed * 7), { clock: EVENING });
      loadMap(world, id, 'start');
      updateBots(bots, world, 0.05);
      const n = bots.list.filter((b) => b.hunter && !b.gone).length;
      assert.ok(n >= 2 && n <= 5, `${id}: ${n} hunters`);
    }
  }
});

test('monsters fight back: a player hit drinks potions, falls under a tombstone, and logs back in later', async () => {
  const { tickHunter } = await import('../src/world/party.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { createBody } = await import('../src/world/physics.js');
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  world.god = true;
  const bots = createBots(world, seeded(3), { clock: EVENING });
  loadMap(world, 'woods', 'start');
  bots.huntMap = world.map.id;
  bots.list = bots.list.filter((b) => !b.hunter);
  world.mobs = [];
  const x = world.body.x + 600;
  const char = makeBotCharacter(seeded(9), { name: 'Unlucky', level: 20, jobs: ['warrior'], pro: false });
  // A monster too strong for them (each touch takes about 40% of their HP), right on top of them.
  const st = computeStats(char);
  const m = spawnMob(world.map, { mob: 'snailbun', x, y: world.map.groundY });
  m.def = { ...m.def, atk: Math.round((st.maxHp * 0.4 * (100 + st.wdef)) / 100), acc: 999, speed: 0 };
  m.hp = 1e9;
  world.mobs.push(m);
  const bot = { id: 'u1', name: 'Unlucky', char, level: 20, hunter: true, map: world.map.id, x, facing: 1, state: 'hunt', body: createBody(x, world.map.groundY), session: 999, stay: 999, nextLine: 999, appear: 0, potions: 2 };
  bots.list.push(bot);
  let drank = 0;
  for (let t = 0; t < 20 && !bot.down; t += 1 / 30) {
    world.now += 1 / 30;
    const before = bot.potions;
    tickHunter(bot, world, [bot], 1 / 30, seeded(Math.floor(t * 30) + 1));
    if (bot.potions < before) drank++;
  }
  assert.equal(drank, 2, 'they drank their potions first');
  assert.ok(bot.down && bot.tomb, 'down under a tombstone');
  // A few seconds later they're gone back to town, and a while after that they log back in.
  world.mobs = [];
  for (let t = 0; t < 8; t += 1 / 30) {
    world.now += 1 / 30;
    updateBots(bots, world, 1 / 30);
  }
  assert.ok(!bots.list.some((b) => b.name === 'Unlucky' && !b.gone), 'off to town');
  assert.equal(bots.returns.length, 1);
  world.now += 120;
  for (let t = 0; t < 1; t += 1 / 30) updateBots(bots, world, 1 / 30);
  const again = bots.list.find((b) => b.name === 'Unlucky' && !b.gone);
  assert.ok(again && again.char === char, 'the same player, back for more');
});

test('dash moves carry a player along, and a party member who dies walks back in to you', async () => {
  const { tickHunter, updateParty } = await import('../src/world/party.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { createBody } = await import('../src/world/physics.js');
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  world.god = true;
  loadMap(world, 'woods', 'start');
  world.mobs = [];
  const x = world.body.x + 700;
  const m = spawnMob(world.map, { mob: 'snailbun', x, y: world.map.groundY });
  // (A copy of its kind, so other tests still get ordinary ones.)
  m.def = { ...m.def, hp: 1e9, speed: 0, atk: 0 };
  m.hp = 1e9;
  world.mobs.push(m);
  const char = makeBotCharacter(seeded(4), { name: 'Dasher', level: 45, jobs: ['thief', 'shinobi'], pro: false });
  const bot = { id: 'd1', name: 'Dasher', char, level: 45, hunter: true, map: world.map.id, x: x - 40, facing: 1, state: 'hunt', body: createBody(x - 40, world.map.groundY), session: 999, stay: 999, nextLine: 999, appear: 0 };
  let carried = 0;
  for (let t = 0; t < 15; t += 1 / 30) {
    world.now += 1 / 30;
    const x0 = bot.body.x;
    tickHunter(bot, world, [bot], 1 / 30, seeded(Math.floor(t * 30) + 7));
    if (bot.lunge) carried += Math.abs(bot.body.x - x0);
  }
  assert.ok(carried > 100, `steps and dashes move them (${Math.round(carried)}px)`);

  // A party member falls in the field: back to town, then in through a portal near you.
  const bots = { list: [], memory: new Set(), names: new Set(), rng: seeded(2) };
  world.bots = bots;
  const pal = { id: 'p1', name: 'Pal', char: makeBotCharacter(seeded(8), { name: 'Pal', level: 20, jobs: ['warrior'] }), level: 20, party: true, style: {}, map: world.map.id, x: world.body.x, facing: 1, state: 'idle', session: 999, stay: 999, nextLine: 999, appear: 0 };
  pal.stats = computeStats(pal.char);
  bots.list.push(pal);
  updateParty(bots, world, 1 / 30);
  pal.hp = 0;
  for (let t = 0; t < 6; t += 1 / 30) {
    world.now += 1 / 30;
    updateParty(bots, world, 1 / 30);
  }
  assert.ok(pal.away && !pal.body, 'gone back to town for a bit');
  world.now += 60;
  updateParty(bots, world, 1 / 30);
  assert.ok(pal.body && !pal.away && !pal.down, 'back again');
  assert.equal(pal.hp, pal.stats.maxHp);
});

// ---------- Friends, your rival, and help ----------

test('friends: add a player, they stay on your list across sessions, log in as themselves, and come hunt', async () => {
  const { askFriend, buddiesOf, answerHunt } = await import('../src/world/buddies.js');
  const { joinParty } = await import('../src/world/party.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.char.level = 30;
  const bots = createBots(world, seeded(31), { clock: EVENING });
  world.bots = bots;
  const pal = bots.list.find((b) => !b.shop && b.level <= 30 && b.level >= 10);
  joinParty(bots, pal, world);
  askFriend(world, pal);
  for (let t = 0; t < 3; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
  }
  assert.equal(buddiesOf(world.char).length, 1, 'added');
  assert.ok(lines.some((l) => /is now your friend/.test(l)));
  // A new session (the save goes through JSON): the friend logs in looking just as they did.
  const char = JSON.parse(JSON.stringify(world.char));
  const world2 = createWorld(char);
  const lines2 = quiet(world2);
  const bots2 = createBots(world2, seeded(32), { clock: EVENING });
  world2.bots = bots2;
  assert.ok(!bots2.list.some((b) => b.name === pal.name), 'nobody else gets their name');
  let friend = null;
  for (let t = 0; t < 400 && !friend; t += 0.5) {
    world2.now += 0.5;
    // (Their login rolls come round every minute or so; here, every couple of seconds.)
    if (t % 2 === 0) bots2.buddyIn = 0;
    updateBots(bots2, world2, 0.5);
    friend = bots2.list.find((b) => b.buddy && b.name === pal.name);
  }
  assert.ok(friend, 'they logged in');
  assert.deepEqual(friend.char.appearance, pal.char.appearance);
  assert.ok(lines2.some((l) => l.includes(`[Friend] ${pal.name} logged in`)));
  // Before long they ask you to hunt; say yes and they're in your party, here with you.
  for (let t = 0; t < 900 && !bots2.huntAsk; t += 0.5) {
    world2.now += 0.5;
    updateBots(bots2, world2, 0.5);
    if (!bots2.list.includes(friend)) break;
  }
  if (bots2.huntAsk) {
    const asker = bots2.huntAsk.bot;
    answerHunt(bots2, world2, true);
    assert.ok(asker.party && asker.map === world2.map.id, 'they came to you and joined');
  }
});

test('your rival turns up in your fields and races you to every level', async () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 20;
  const bots = createBots(world, seeded(41), { clock: EVENING });
  world.bots = bots;
  let rival = null;
  for (let i = 0; i < 20 && !rival; i++) {
    loadMap(world, i % 2 ? 'woods' : 'meadow1', 'start');
    updateBots(bots, world, 0.05);
    rival = bots.list.find((b) => b.rival && !b.gone);
  }
  assert.ok(rival && world.char.rival, 'a rival showed up');
  assert.ok(Math.abs(world.char.rival.level - 20) <= 2, 'near your level');
  assert.ok(lines.some((l) => /picked you as their rival/.test(l)));
  updateBots(bots, world, 0.05);
  gainExp(world.char, expToNext(world.char.level));
  updateBots(bots, world, 0.05);
  assert.ok(lines.some((l) => l.startsWith(`[Rival] ${world.char.rival.name}:`)), 'they let you know');
  assert.ok(world.char.rival.level >= world.char.level - 1, 'and keep pace');
});

test('in trouble out in the field, a player nearby rushes over and patches you up; say thanks', async () => {
  const { tickHunter } = await import('../src/world/party.js');
  const { createBody } = await import('../src/world/physics.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.char.level = 25;
  const bots = createBots(world, seeded(51), { clock: EVENING });
  world.bots = bots;
  loadMap(world, 'woods', 'start');
  world.mobs = [];
  bots.huntMap = world.map.id;
  bots.list = bots.list.filter((b) => !b.hunter);
  const char = makeBotCharacter(seeded(5), { name: 'Kind', level: 25, jobs: ['warrior'], pro: false });
  const kind = { id: 'k1', name: 'Kind', char, level: 25, hunter: true, map: world.map.id, x: world.body.x + 200, facing: -1, state: 'hunt', body: createBody(world.body.x + 200, world.body.y), session: 999, stay: 999, nextLine: 999, appear: 0 };
  bots.list.push(kind);
  world.char.hp = Math.round(world.stats.maxHp * 0.1);
  const low = world.char.hp;
  for (let t = 0; t < 12 && !kind.gave; t += 1 / 30) {
    world.now += 1 / 30;
    updateBots(bots, world, 1 / 30);
  }
  assert.ok(lines.some((l) => /rushes over to help you/.test(l)), 'someone came');
  assert.ok(kind.gave && world.char.hp > low, 'and healed you');
  world.heard = { words: 'ty!!', at: world.now };
  updateBots(bots, world, 0.1);
  assert.ok(kind.thanked, 'thanks went to them');
  void tickHunter;
});

// ---------- Raids, party combos, the priestesses ----------

test('a queen back for a rematch: players gather (your rival among them), dodge and take her moves, and pose for a photo', async () => {
  const { spawnMob } = await import('../src/world/mobs.js');
  const { killMob } = await import('../src/world/world.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 32;
  const bots = createBots(world, seeded(61), { clock: EVENING });
  world.bots = bots;
  loadMap(world, 'glade', 'start');
  updateBots(bots, world, 0.05);
  const queen = spawnMob(world.map, { mob: 'sylvana', x: world.body.x + 260, y: world.map.groundY });
  queen.aggroUntil = Infinity;
  world.mobs.push(queen);
  let hurt = 0;
  const seen = new Set();
  for (let t = 0; t < 25; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
    for (const n of world.numbers) if (n.small && n.color === '#ff8fa8' && !seen.has(n)) {
      seen.add(n);
      hurt++;
    }
  }
  const raid = bots.list.filter((b) => b.raid && !b.gone);
  assert.ok(raid.length >= 3, `players gathered (${raid.length})`);
  assert.ok(raid.some((b) => b.rival), 'your rival came too');
  assert.ok(lines.some((l) => /Players are gathering/.test(l)));
  assert.ok(hurt > 0, 'her moves (or her touch) caught some of them');
  // Down she goes: everyone poses, and the photo's kept.
  queen.hp = 0;
  killMob(world, queen);
  for (let t = 0; t < 4; t += 1 / 30) {
    world.now += 1 / 30;
    updateBots(bots, world, 1 / 30);
  }
  const photo = world.char.photos?.[0];
  assert.ok(photo, 'a group photo');
  assert.equal(photo.boss, 'sylvana');
  assert.equal(photo.people[0].name, 'Me');
  assert.ok(photo.people.length >= 2);
  assert.ok(JSON.parse(JSON.stringify(photo)).people[1].look, 'it saves');
});

test('a party combo: your finisher brings the members fighting by you in with theirs', async () => {
  const { joinParty } = await import('../src/world/party.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 40;
  const bots = { list: [], memory: new Set(), names: new Set(), rng: seeded(71), replies: [], spawnIn: 999, waveIn: 999, newsIn: 999 };
  world.bots = bots;
  loadMap(world, 'woods', 'start');
  world.mobs = [];
  const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 60, y: world.map.groundY });
  // (A copy of its kind, so other tests still get ordinary ones.)
  m.def = { ...m.def, hp: 1e9, speed: 0, atk: 0 };
  m.hp = 1e9;
  world.mobs.push(m);
  const pal = { id: 'p1', name: 'Pal', char: makeBotCharacter(seeded(8), { name: 'Pal', level: 40, jobs: ['warrior', 'paladin'] }), level: 40, style: {}, map: world.map.id, x: world.body.x + 20, facing: 1, state: 'idle', session: 9999, stay: 9999, nextLine: 999, appear: 0 };
  bots.list.push(pal);
  joinParty(bots, pal, world);
  for (let t = 0; t < 6; t += 1 / 30) {
    world.now += 1 / 30;
    updateBots(bots, world, 1 / 30);
  }
  assert.ok(pal.fight, 'they were fighting');
  pal.fight.gauge = 60;
  world.finisherCast = { at: world.now, id: 'grandverdict' };
  updateBots(bots, world, 1 / 30);
  assert.ok(lines.some((l) => /Party Combo! Pal/.test(l)));
  let fin = false;
  for (let t = 0; t < 3 && !fin; t += 1 / 30) {
    world.now += 1 / 30;
    updateBots(bots, world, 1 / 30);
    fin = pal.attack?.pose === 'verdict';
  }
  assert.ok(fin, 'and their own finisher goes off');
});

test('the priestesses fight with their whole kit: torii gates, talismans, and blessings', async () => {
  const { botSkills, tickHunter } = await import('../src/world/party.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { createBody } = await import('../src/world/physics.js');
  const shrine = makeBotCharacter(seeded(3), { name: 'Miko', level: 50, jobs: ['spiritmage', 'shrinemaiden'] });
  const onmyo = makeBotCharacter(seeded(4), { name: 'Abe', level: 50, jobs: ['spiritmage', 'onmyoji'] });
  const ids = (c) => botSkills(c).map((s) => s.id);
  for (const id of ['thousandtorii', 'grandblessing', 'blessing']) assert.ok(ids(shrine).includes(id), `Shrine Maiden: ${id}`);
  for (const id of ['ofudabarrage', 'troupecombo']) assert.ok(ids(onmyo).includes(id), `Onmyoji: ${id}`);
  for (const [char, fx] of [[shrine, 'thousandtorii'], [onmyo, 'ofuda']]) {
    const world = createWorld(createCharacter('Me', {}));
    quiet(world);
    world.god = true;
    loadMap(world, 'woods', 'start');
    world.mobs = [];
    const x = world.body.x + 600;
    const m = spawnMob(world.map, { mob: 'snailbun', x, y: world.map.groundY });
    // (A copy of its kind, so other tests still get ordinary ones.)
    m.def = { ...m.def, hp: 1e9, speed: 0, atk: 0 };
    m.hp = 1e9;
    world.mobs.push(m);
    const bot = { id: 'b1', name: char.name, char, level: 50, hunter: true, map: world.map.id, x: x - 120, facing: 1, state: 'hunt', body: createBody(x - 120, world.map.groundY), session: 999, stay: 999, nextLine: 999, appear: 0 };
    let seen = false;
    for (let t = 0; t < 40 && !seen; t += 1 / 30) {
      world.now += 1 / 30;
      world.pending = world.pending.filter((h) => h.at > world.now);
      tickHunter(bot, world, [bot], 1 / 30, seeded(Math.floor(t * 30) + 3));
      if (bot.fight) bot.fight.gauge = Math.max(bot.fight.gauge, 100);
      seen = world.fx.some((f) => f.kind === fx);
      world.fx = world.fx.filter((f) => f.kind === fx);
    }
    assert.ok(seen, `${char.name} casts with ${fx}`);
  }
});

test('the Crystal Throne fills up for a raid on the Crystal King', async () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 45;
  const bots = createBots(world, seeded(81), { clock: EVENING });
  world.bots = bots;
  loadMap(world, 'bossroom', 'west');
  for (let t = 0; t < 1; t += 1 / 30) updateBots(bots, world, 1 / 30);
  assert.ok(world.mobs.some((m) => m.def.id === 'crystalking'));
  assert.ok(lines.some((l) => /Prismaris is on Crystal Throne/.test(l)), lines.join(' | '));
  assert.ok(bots.list.filter((b) => b.raid && !b.gone).length >= 3);
});

// ---------- Server life: duels, legends, guilds, the clock, afk, kill stealers ----------

test('night owls: fewest players on late at night, most in the evening and at the weekend, and they talk about it', async () => {
  const { serverTime, onlineCount, timeLine } = await import('../src/world/drama.js');
  const at = (d, h) => serverTime(new Date(2026, 9, d, h, 0));
  const night = onlineCount(at(28, 3));
  const evening = onlineCount(at(28, 20));
  const saturday = onlineCount(at(31, 20));
  assert.ok(night < evening && evening < saturday, `${night} < ${evening} < ${saturday}`);
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  const late = createBots(world, seeded(5), { clock: () => new Date(2026, 9, 28, 3, 0) });
  const busy = createBots(world, seeded(5), { clock: () => new Date(2026, 9, 31, 20, 0) });
  assert.ok(late.list.length < busy.list.length);
  assert.match(timeLine(at(28, 3), seeded(1)), /am|bed|sleep|night|mom|gn/);
});

// Steps the town (and its goings-on) a while.
function townStep(world, bots, secs, dt = 0.1) {
  for (let t = 0; t < secs; t += dt) {
    world.now += dt;
    updateBots(bots, world, dt);
  }
}

test('a duel in town: two players spar with real moves, a crowd gathers, and someone wins', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(91), { clock: EVENING });
  world.bots = bots;
  // Plenty of people about, and a duel due.
  for (const b of bots.list.slice(0, 8)) Object.assign(b, { map: world.map.id, x: world.body.x + 100 + bots.list.indexOf(b) * 40, state: 'idle', timer: 99, session: 999, stay: 999, shop: null });
  townStep(world, bots, 0.2);
  for (let i = 0; i < 10 && !bots.drama.duels.length; i++) {
    bots.drama.duelIn = 0;
    townStep(world, bots, 0.2);
  }
  assert.ok(lines.some((l) => /challenged .* to a duel/.test(l)), 'a challenge');
  assert.ok(bots.list.some((b) => b.state === 'watch'), 'a crowd');
  const poses = new Set();
  for (let t = 0; t < 60 && !lines.some((l) => /won the duel/.test(l)); t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    for (const b of bots.list) if (b.state === 'duel' && b.emote) poses.add(b.emote.pose);
  }
  assert.ok(lines.some((l) => /won the duel/.test(l)), 'a winner');
  assert.ok(poses.size >= 3, `moves traded (${[...poses].join(', ')})`);
  assert.ok(!bots.list.some((b) => ['duel', 'watch'].includes(b.state)), 'everyone back to normal');
});

test('a legend logs in: the town loses it and fans follow them around', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(93), { clock: EVENING });
  world.bots = bots;
  for (const b of bots.list.slice(0, 8)) Object.assign(b, { map: world.map.id, x: world.body.x + 60 + bots.list.indexOf(b) * 50, state: 'idle', timer: 99, session: 999, stay: 999, shop: null, level: 12 });
  townStep(world, bots, 0.2);
  bots.drama.legendIn = 0;
  townStep(world, bots, 6);
  const legend = bots.list.find((b) => b.legend);
  assert.ok(legend && legend.level === 70 && legend.map === world.map.id, 'here, at the top level');
  assert.ok(lines.some((l) => /legendary .* has logged in/.test(l)));
  assert.ok(lines.filter((l) => l.includes(legend.name)).length >= 3, 'chat goes wild');
  assert.ok(bots.list.some((b) => b.state === 'follow'), 'fans follow');
});

test('guilds: a recruiter asks you to join, you join, and someone storms out', async () => {
  const { joinGuild, leaveGuild } = await import('../src/world/drama.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(95), { clock: EVENING });
  world.bots = bots;
  for (const b of bots.list.slice(0, 8)) Object.assign(b, { map: world.map.id, x: world.body.x + 80 + bots.list.indexOf(b) * 40, state: 'idle', timer: 99, session: 999, stay: 999, shop: null, guild: 'Cozy Corner' });
  townStep(world, bots, 0.2);
  let offer = null;
  for (let i = 0; i < 20 && !offer; i++) {
    bots.drama.recruitIn = 0;
    townStep(world, bots, 0.2);
    offer = bots.list.find((b) => b.guildOffer);
  }
  assert.ok(lines.some((l) => /recruiting|looking for|join|needs/.test(l)), 'recruiting in chat');
  assert.ok(offer, 'someone asks you');
  joinGuild(world, offer);
  assert.equal(world.char.guild, 'Cozy Corner');
  assert.equal(JSON.parse(JSON.stringify(world.char)).guild, 'Cozy Corner', 'it saves');
  bots.drama.stormIn = 0;
  townStep(world, bots, 5);
  assert.ok(lines.some((l) => /\[Guild\] .* has left the guild/.test(l)), 'drama, in guild chat');
  leaveGuild(world);
  assert.equal(world.char.guild, null);
});

test('afk on a portal in town, and afk in the field with a monster nibbling', async () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  const bots = createBots(world, seeded(97), { clock: EVENING });
  world.bots = bots;
  for (const b of bots.list.slice(0, 6)) Object.assign(b, { map: world.map.id, x: world.body.x + 80 + bots.list.indexOf(b) * 40, state: 'idle', timer: 99, session: 999, stay: 999, shop: null });
  townStep(world, bots, 0.2);
  bots.drama.afkIn = 0;
  townStep(world, bots, 25);
  const afk = bots.list.find((b) => b.state === 'afk');
  assert.ok(afk && afk.afkTag, 'afk on the spot');
  assert.ok(world.map.portals.some((p) => Math.abs(p.x - afk.x) < 4), 'right on a portal');
  assert.ok(lines.some((l) => l.includes(afk.name) && /afk|poke|hello|forever/.test(l)), 'people notice');
  // Out in the field.
  world.char.level = 20;
  loadMap(world, 'woods', 'start');
  for (let i = 0; i < 6 && !bots.list.some((b) => b.hunter && !b.gone); i++) {
    bots.huntMap = null;
    updateBots(bots, world, 0.05);
  }
  // (A snail by each of them, so there's something to nibble.)
  const { spawnMob } = await import('../src/world/mobs.js');
  for (const b of bots.list.filter((h) => h.hunter && !h.gone)) world.mobs.push(spawnMob(world.map, { mob: 'snailbun', x: b.body.x + 40, y: b.body.y }));
  let idle = null;
  for (let i = 0; i < 60 && !idle; i++) {
    bots.afkIn = 0;
    updateBots(bots, world, 0.05);
    idle = bots.list.find((b) => b.hunter && b.afk);
  }
  assert.ok(idle, 'a hunter goes afk');
  assert.ok(world.mobs.some((m) => m.foe === idle.body), 'a monster goes for them');
  let fought = false;
  for (let t = 0; t < 5; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
    fought ||= Boolean(idle.attack?.fighting);
  }
  assert.ok(!fought, 'they just stand there (nobody at the keyboard)');
});

test('a kill stealer takes the monster you were on, and gets called out', async () => {
  const { spawnMob } = await import('../src/world/mobs.js');
  const { createBody } = await import('../src/world/physics.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 25;
  const bots = createBots(world, seeded(99), { clock: EVENING });
  world.bots = bots;
  loadMap(world, 'woods', 'start');
  updateBots(bots, world, 0.05);
  bots.list = bots.list.filter((b) => !b.hunter);
  world.mobs = [];
  const mine = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 60, y: world.map.groundY });
  mine.hp = Math.ceil(mine.def.hp * 0.3);
  mine.def = { ...mine.def, speed: 0, atk: 0 };
  world.mobs.push(mine);
  const mk = (id, dx, rude) => {
    const char = makeBotCharacter(seeded(id.length * 7), { name: id, level: 40, jobs: ['warrior'], pro: false });
    const b = { id, name: id, char, level: 40, hunter: true, map: world.map.id, x: world.body.x + dx, facing: -1, state: 'hunt', body: createBody(world.body.x + dx, world.body.y), session: 999, stay: 999, nextLine: 999, appear: 0, rude: rude ? { steals: 0 } : null };
    bots.list.push(b);
    return b;
  };
  const rude = mk('Grabby', 160, true);
  mk('Fair', 420, false);
  mk('Nice', -420, false);
  for (let t = 0; t < 15 && mine.hp > 0; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
  }
  assert.ok(mine.hp <= 0 && mine.credited, 'they took it');
  for (let t = 0; t < 5; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
  }
  assert.ok(lines.some((l) => l.startsWith('Grabby:')), 'they gloat');
  assert.ok(lines.some((l) => /KS|not cool|reported|own mobs|wow|ignore/.test(l) && !l.startsWith('Grabby')), 'and get called out');
  void rude;
});

// ---------- Server events and celebrations ----------

// A town full of people, every event's timer pushed far off (the test starts the one it wants).
function eventTown(seed, mapId = 'sprout') {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 30;
  const bots = createBots(world, seeded(seed), { clock: EVENING });
  world.bots = bots;
  loadMap(world, mapId, 'start');
  for (const [i, b] of bots.list.filter((x) => !x.shop).slice(0, 10).entries()) Object.assign(b, { map: world.map.id, x: world.body.x + 60 + i * 40, state: 'idle', timer: 99, session: 9999, stay: 9999, level: 25 });
  townStep(world, bots, 0.2);
  for (const k of Object.keys(bots.events)) if (k.endsWith('In')) bots.events[k] = 1e9;
  for (const k of Object.keys(bots.drama)) if (k.endsWith('In')) bots.drama[k] = 1e9;
  for (const k of Object.keys(bots.lives)) if (k.endsWith('In')) bots.lives[k] = 1e9;
  for (const k of Object.keys(bots.market)) if (k.endsWith('In')) bots.market[k] = 1e9;
  return { world, bots, lines };
}

test('GM events: Double EXP doubles what you earn, a Mochi Rain pours treats, and GM Momo hides for you to find', async () => {
  const { killMob } = await import('../src/world/world.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { found } = await import('../src/world/events.js');
  const { world, bots, lines } = eventTown(201, 'woods');
  const kill = () => {
    const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 30, y: world.map.groundY });
    const exp = world.char.exp;
    killMob(world, m);
    return world.char.exp - exp;
  };
  world.char.level = 5;
  const plain = kill();
  bots.events.gmIn = 0;
  // (Roll until it's Double EXP.)
  for (let i = 0; i < 30 && bots.events.gm?.kind !== 'exp'; i++) {
    if (bots.events.gm) {
      bots.events.gm.until = 0;
      townStep(world, bots, 0.1);
    }
    bots.events.gmIn = 0;
    townStep(world, bots, 0.1);
  }
  assert.equal(bots.events.gm?.kind, 'exp');
  assert.ok(lines.some((l) => l.startsWith('[GM] GM Momo: DOUBLE EXP')));
  assert.equal(kill(), plain * 2, 'twice the EXP');
  bots.events.gm.until = 0;
  townStep(world, bots, 0.1);
  assert.equal(kill(), plain, 'and back to normal after');
  // A Mochi Rain.
  for (let i = 0; i < 30 && bots.events.gm?.kind !== 'rain'; i++) {
    if (bots.events.gm) bots.events.gm.until = 0;
    bots.events.gmIn = 0;
    townStep(world, bots, 0.1);
  }
  const drops = world.drops.length;
  townStep(world, bots, 5);
  assert.ok(world.drops.length > drops + 5, 'treats fall');
  // Hide and Seek.
  for (let i = 0; i < 40 && bots.events.gm?.kind !== 'seek'; i++) {
    if (bots.events.gm) bots.events.gm.until = 0;
    bots.events.gmIn = 0;
    townStep(world, bots, 0.1);
  }
  const gm = bots.events.gm?.bot;
  assert.ok(gm && gm.gm, 'GM Momo is hiding');
  const gold = world.char.gold;
  found(bots.events, bots, world);
  assert.ok(world.char.gold > gold && lines.some((l) => /found me/.test(l)), 'found, with a prize');
});

test('an invasion: monsters pour into town, the players there fight them off with you, and cheer', () => {
  const { world, bots, lines } = eventTown(203);
  bots.events.invadeIn = 0;
  townStep(world, bots, 0.1);
  const inv = bots.events.invasion;
  assert.ok(inv && inv.mobs.length >= 9, 'monsters in town');
  assert.ok(lines.some((l) => /invading/.test(l)));
  assert.ok(inv.fighters.length >= 3 && inv.fighters.every((b) => b.hunter && b.body), 'the townsfolk take up arms');
  let hits = 0;
  for (let t = 0; t < 60 && bots.events.invasion; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
    hits += world.pending.filter((h) => h.stranger && !h.counted && (h.counted = true)).length;
    // (You help too.)
    if (t > 20) for (const m of inv.mobs) m.hp = Math.min(m.hp, 1);
  }
  assert.ok(hits > 10, `they fought (${hits} blows)`);
  assert.ok(!bots.events.invasion && lines.some((l) => /is safe/.test(l)), 'the town is safe');
  assert.ok(inv.fighters.every((b) => b.gone || (!b.hunter && !b.body && b.state === 'idle')), 'and back to town life');
});

test('a festival by the calendar: Spooky Night in October, with fireworks and festive outfits', async () => {
  const { festivalOn } = await import('../src/world/events.js');
  assert.equal(festivalOn(new Date(2026, 9, 31)).name, 'Spooky Night');
  assert.equal(festivalOn(new Date(2026, 11, 24)).name, 'Snow Festival');
  assert.equal(festivalOn(new Date(2026, 4, 10)), null);
  const { world, bots, lines } = eventTown(205);
  townStep(world, bots, 12);
  assert.ok(lines.some((l) => /celebrating the Spooky Night/.test(l)));
  assert.ok(bots.list.some((b) => b.map === world.map.id && Object.values(b.char.outfit ?? {}).some((o) => o?.variant === 'dark')), 'dressed for it');
});

test('the wandering merchant sets up shop with odd wares, and word spreads', () => {
  const { world, bots, lines } = eventTown(207);
  bots.events.merchantIn = 0;
  townStep(world, bots, 0.1);
  const pip = bots.events.merchant?.bot;
  assert.ok(pip && pip.shop && pip.shop.items.length >= 4, 'a shop');
  assert.ok(pip.shop.items.every((it) => it.price > 0));
  assert.ok(lines.some((l) => /Wandering Merchant has set up shop/.test(l)));
  bots.events.merchant.until = 0;
  townStep(world, bots, 2);
  assert.ok(!bots.list.includes(pip) || pip.state === 'logout', 'and packs up after');
});

test('training dummies in Ember Crag: players beat on them and compare damage', () => {
  const { world, bots, lines } = eventTown(209, 'crag');
  let swung = 0;
  for (let t = 0; t < 120; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    swung += bots.list.filter((b) => b.state === 'dummy' && b.emote?.t === 0).length;
  }
  assert.ok(swung > 5, 'swinging at the dummies');
  assert.ok(lines.some((l) => /dps|dummy|total|weapon/.test(l)), 'and talking about it');
});

test('a fashion show: you can enter, everyone walks the runway, and someone wins', async () => {
  const { enterShow } = await import('../src/world/events.js');
  const { world, bots, lines } = eventTown(211);
  bots.events.showIn = 0;
  townStep(world, bots, 0.1);
  const show = bots.events.show;
  assert.ok(show, 'a show');
  enterShow(world, show.host);
  assert.ok(show.entries.includes('you'));
  townStep(world, bots, 70);
  assert.ok(lines.some((l) => /won the fashion show/.test(l)));
  assert.ok(lines.some((l) => l.includes(`next: ${world.char.name}`)), 'your turn on the runway');
  assert.equal(bots.events.show, null);
});

test('a meme catches on, everyone says it, and you saying it gets a reaction', async () => {
  const { memeLine } = await import('../src/world/events.js');
  const { world, bots, lines } = eventTown(213);
  bots.events.memeIn = 0;
  townStep(world, bots, 0.1);
  const meme = bots.events.meme;
  assert.ok(meme, 'a meme');
  let said = 0;
  for (let i = 0; i < 200; i++) if (memeLine(bots, Math.random)) said++;
  assert.ok(said > 30, 'it shows up in chat');
  world.heard = { words: `${meme.word} lol`, at: world.now };
  townStep(world, bots, 6);
  assert.ok(lines.some((l) => l.includes(`${world.char.name} said it`) || l.includes(`${world.char.name} gets it`) || l.includes(meme.word.toUpperCase())));
  meme.until = 0;
  townStep(world, bots, 0.2);
  assert.equal(bots.events.meme, null, 'and then it dies');
});

test('a wedding in town: guests gather, the couple says I do, hearts and confetti, and a bouquet', () => {
  const { world, bots, lines } = eventTown(215);
  bots.events.weddingIn = 0;
  townStep(world, bots, 0.1);
  const w = bots.events.wedding;
  assert.ok(w, 'a wedding');
  assert.ok(lines.some((l) => /getting married/.test(l)));
  const juice = [];
  for (let t = 0; t < 60 && bots.events.wedding; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    juice.push(...world.juice.map((j) => j.type));
    world.juice = [];
  }
  assert.ok(lines.some((l) => /are married/.test(l)));
  assert.ok(juice.includes('hearts') && juice.includes('confetti'));
  assert.equal(w.a.spouse, w.b.name);
});

// ---------- Players with lives ----------

test('regulars: players you met come back grown (levels, a new job) and remember you', async () => {
  const { remember, grow, regularsOf } = await import('../src/world/lives.js');
  // Growing: more levels the longer it's been, and a job once they reach it.
  const r = { name: 'Kid', level: 8, jobs: [], seen: 0 };
  assert.equal(grow({ ...r, seen: 1000 }, 1000 + 60000, seeded(1)), null, 'nothing in a minute');
  const g = grow(r, 40 * 3.6e6, seeded(2));
  assert.ok(g.to > 8 && r.level >= 10 && r.jobs.length === 1 && g.job === r.jobs[0], `grew to ${r.level} and became a ${r.jobs[0]}`);
  const big = { name: 'Vet', level: 29, jobs: ['warrior'], seen: 0 };
  grow(big, 40 * 3.6e6, seeded(3));
  assert.ok(['paladin', 'berserker'].includes(big.jobs[1]), 'a second job past 30');
  // A whole session: meet someone, play again ten hours later, and they come over with their news.
  const at = new Date(2026, 9, 28, 10, 0);
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  const bots = createBots(world, seeded(301), { clock: () => at });
  world.bots = bots;
  const pal = bots.list.find((b) => !b.shop && b.level >= 10 && b.level < 25);
  remember(world, pal, 'party');
  const metAt = pal.char.level;
  assert.equal(regularsOf(world.char).length, 1);
  const later = new Date(at.getTime() + 10 * 3.6e6);
  const char = JSON.parse(JSON.stringify(world.char));
  const world2 = createWorld(char);
  const lines = quiet(world2);
  const bots2 = createBots(world2, seeded(302), { clock: () => later });
  world2.bots = bots2;
  loadMap(world2, 'sprout', 'start');
  updateBots(bots2, world2, 0.1);
  const back = bots2.list.find((b) => b.name === pal.name);
  assert.ok(back, 'they are on today');
  assert.ok(back.char.level > metAt, `grown (${metAt} -> ${back.char.level})`);
  assert.deepEqual(back.char.appearance, pal.char.appearance, 'looking just the same');
  // What they'll say when they see you: your name, and their news.
  const news = back.news ?? back.hello ?? back.bubble?.text ?? '';
  assert.ok(news.includes('Me'), `they remember you (${news})`);
  void lines;
});

test('a player asks for help with their quest; help them and they thank you with a gift', async () => {
  const { helpOut } = await import('../src/world/lives.js');
  const { killMob } = await import('../src/world/world.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { world, bots, lines } = eventTown(311);
  bots.lives.askIn = 0;
  for (let i = 0; i < 10 && !bots.lives.ask; i++) {
    bots.lives.askIn = 0;
    townStep(world, bots, 0.1);
  }
  const ask = bots.lives.ask;
  assert.ok(ask, 'someone asks');
  assert.ok(lines.some((l) => l.startsWith(`${ask.bot.name}:`)), 'in chat');
  helpOut(bots, world, ask.bot);
  assert.ok(ask.bot.party && ask.bot.quest, 'they join you');
  const gold = world.char.gold;
  for (let i = 0; i < ask.n; i++) killMob(world, spawnMob(world.map, { mob: ask.mob, x: world.body.x + 40, y: world.map.groundY }));
  assert.ok(ask.bot.quest.done && world.char.gold > gold, 'quest done, and a thank-you');
  assert.ok(world.char.regulars.some((r) => r.name === ask.bot.name && r.helped), 'and they remember it');
});

test('weather: umbrellas up in the rain, snowball fights in the snow', () => {
  const { world, bots, lines } = eventTown(321);
  const roll = (kind) => {
    for (let i = 0; i < 60 && world.weather !== kind; i++) {
      bots.lives.weatherIn = 0;
      townStep(world, bots, 0.1);
    }
  };
  roll('rain');
  assert.equal(world.weather, 'rain');
  assert.ok(lines.some((l) => /starts to rain/.test(l)));
  townStep(world, bots, 15);
  assert.ok(bots.list.some((b) => b.umbrella), 'umbrellas up');
  // Snow in December.
  bots.clock = () => new Date(2026, 11, 20, 18, 0);
  roll('snow');
  assert.equal(world.weather, 'snow');
  const thrown = [];
  for (let t = 0; t < 15; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    thrown.push(...world.juice.filter((j) => j.type === 'snowball'));
    world.juice = [];
  }
  assert.ok(thrown.length >= 2, 'snowballs fly');
  assert.ok(!bots.list.some((b) => b.umbrella), 'and the umbrellas are down');
});

test('a photographer at a landmark asks you into the shot, and the photo is yours too', () => {
  const { world, bots, lines } = eventTown(331);
  // By the well in Sprout Village.
  world.body.x = 760;
  bots.lives.shootIn = 0;
  for (let i = 0; i < 10 && !bots.lives.shoot; i++) {
    bots.lives.shootIn = 0;
    townStep(world, bots, 0.1);
  }
  const s = bots.lives.shoot;
  assert.ok(s, 'a shoot');
  world.body.x = s.x + 10;
  for (let t = 0; t < 60 && bots.lives.shoot; t += 0.1) {
    world.now += 0.1;
    world.body.x = s.x + 10;
    updateBots(bots, world, 0.1);
  }
  assert.ok(lines.some((l) => /get in the pic/.test(l)), 'asked in');
  const photo = world.char.photos?.[0];
  assert.ok(photo && photo.landmark === s.kind && photo.people.length === 2);
});

test('a music jam: notes float up and people come to dance; and someone in costume plays the part', () => {
  const { world, bots, lines } = eventTown(341);
  bots.lives.jamIn = 0;
  townStep(world, bots, 0.1);
  assert.ok(bots.lives.jam, 'a jam');
  const notes = [];
  for (let t = 0; t < 20; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    notes.push(...world.juice.filter((j) => j.type === 'notes'));
    world.juice = [];
  }
  assert.ok(notes.length > 10, 'music');
  assert.ok(bots.lives.jam?.fans.length >= 1, 'dancers');
  bots.lives.cosplayIn = 0;
  townStep(world, bots, 5);
  const fan = bots.list.find((b) => b.costume);
  assert.ok(fan && fan.costume.look, 'in costume');
  assert.ok(lines.some((l) => l.includes(`cosplaying as ${fan.costume.as}`)));
});

// ---------- The economy and group play ----------

test('the market: prices drift, trade chat posts offers you can answer, and a rush sends one price flying', async () => {
  const { priceOf, answerOffer } = await import('../src/world/market.js');
  const { ITEMS } = await import('../src/data/items.js');
  const { countItem } = await import('../src/core/inventory.js');
  const { world, bots, lines } = eventTown(401);
  world.char.gold = 1e6;
  const M = bots.market;
  M.postIn = 0;
  for (let t = 0; t < 300; t += 1) {
    world.now += 1;
    updateBots(bots, world, 1);
  }
  assert.ok(lines.filter((l) => l.startsWith('[Trade]')).length >= 4, 'trade chat');
  assert.ok(Object.values(M.mult).some((m) => Math.abs(m - 1) > 0.02), 'prices moved');
  // Buy what someone's selling.
  const sell = { id: 'x', bot: bots.list[0], kind: 'sell', item: 'fluff', qty: 5, each: 10, until: world.now + 99 };
  M.offers.unshift(sell);
  const have = countItem(world.char.inventory, sell.item);
  assert.equal(answerOffer(bots, world, sell), null);
  assert.equal(countItem(world.char.inventory, sell.item), have + sell.qty);
  // Sell someone what they want.
  const want = { id: 'y', bot: bots.list[1], kind: 'buy', item: sell.item, qty: 2, each: 99, until: world.now + 99 };
  M.offers.unshift(want);
  const g0 = world.char.gold;
  assert.equal(answerOffer(bots, world, want), null);
  assert.equal(world.char.gold, g0 + 2 * 99);
  // A rush.
  M.rushIn = 0;
  townStep(world, bots, 0.2);
  assert.ok(M.rush, 'a rush');
  const id = M.rush.id;
  assert.ok(priceOf(bots, id) >= ITEMS[id].price * 2, 'the price shoots up');
  assert.ok(lines.some((l) => l.includes(`Everyone's buying ${ITEMS[id].name}`)));
  M.rush.until = 0;
  townStep(world, bots, 0.2);
  assert.ok(!M.rush && priceOf(bots, id) < ITEMS[id].price, 'and crashes');
});

test('haggling: friends give you a deal, strangers counter or take offence', async () => {
  const { haggle } = await import('../src/world/market.js');
  const { world, bots } = eventTown(411);
  const shop = (price) => ({ title: 't', items: [{ id: 'fluff', qty: 1, price }, { id: 'fluff', qty: 1, price }] });
  const friend = bots.list[0];
  world.char.buddies = [{ name: friend.name }];
  friend.shop = shop(1000);
  const r = haggle(bots, world, friend, 0);
  assert.ok(r.ok && friend.shop.items[0].price === 750, 'a friend price');
  assert.equal(haggle(bots, world, friend, 0).ok, false, 'only once per item');
  // Strangers: over many tries, some deals, some counters, some offence.
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const s = bots.list[2];
    s.shop = shop(1000);
    s.offended = 0;
    const out = haggle(bots, world, s, 0);
    seen.add(out.ok ? (s.shop.items[0].price === 850 ? 'deal' : 'counter') : 'offended');
  }
  assert.deepEqual([...seen].sort(), ['counter', 'deal', 'offended']);
});

test('a lucky drop: the players around react, and someone wants to buy it', async () => {
  const { luckyDrop, answerOffer } = await import('../src/world/market.js');
  const { makeEquip } = await import('../src/core/items.js');
  const { addItem } = await import('../src/core/inventory.js');
  const { world, bots, lines } = eventTown(421);
  const inst = makeEquip('sword_10', { rarity: 3 });
  addItem(world.char.inventory, inst);
  let offer = null;
  for (let i = 0; i < 20 && !offer; i++) {
    luckyDrop(bots, world, inst);
    offer = bots.market.offers.find((o) => o.kind === 'yours');
  }
  townStep(world, bots, 6);
  assert.ok(lines.some((l) => /gz|lucky|farmed|crazy|fair|legendary/.test(l)), 'they react');
  assert.ok(offer, 'an offer for it');
  const g0 = world.char.gold;
  assert.equal(answerOffer(bots, world, offer), null);
  assert.ok(world.char.gold > g0 && !world.char.inventory.equip.includes(inst), 'sold');
});

test('a dungeon group looking for your role takes you in', async () => {
  const { joinGroup } = await import('../src/world/market.js');
  const { advanceJob } = await import('../src/core/character.js');
  const { world, bots, lines } = eventTown(431);
  world.char.level = 15;
  advanceJob(world.char, 'spiritmage');
  // Players of other jobs about.
  for (const b of bots.list.filter((x) => x.map === world.map.id).slice(0, 6)) {
    b.char = makeBotCharacter(seeded(b.name.length), { name: b.name, level: 14, jobs: ['warrior'] });
    b.level = 14;
  }
  let bot = null;
  for (let i = 0; i < 10 && !bot; i++) {
    bots.market.lfgIn = 0;
    townStep(world, bots, 0.1);
    bot = bots.list.find((b) => b.lfg);
  }
  assert.ok(bot, 'someone is looking');
  assert.ok(lines.some((l) => /healer/i.test(l) && l.startsWith(`${bot.name}:`)), 'for a healer, like you');
  assert.equal(joinGroup(bots, world, bot), null);
  assert.ok(world.dungeon && bot.party, 'in the dungeon with them');
});

test('the bounty board: take a bounty, hunt, get paid; and the hall of fame ranks you among them', async () => {
  const { takeBounty, hallOfFame } = await import('../src/world/market.js');
  const { killMob } = await import('../src/world/world.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { world, bots, lines } = eventTown(441);
  bots.market.bountyIn = 0;
  townStep(world, bots, 0.2);
  const b = bots.market.bounties[0];
  assert.ok(b && lines.some((l) => l.startsWith('[Board]')), 'a bounty posted');
  takeBounty(world, b);
  const g0 = world.char.gold;
  for (let i = 0; i < b.n; i++) killMob(world, spawnMob(world.map, { mob: b.mob, x: world.body.x + 30, y: world.map.groundY }));
  townStep(world, bots, 0.1);
  assert.ok(b.done && world.char.gold >= g0 + b.reward, 'paid');
  const fame = hallOfFame(bots, world);
  assert.ok(fame.level.some((p) => p.you) && fame.level.length > 10);
  for (let i = 1; i < fame.kills.length; i++) assert.ok(fame.kills[i - 1].kills >= fame.kills[i].kills, 'ranked');
  const me = fame.kills.find((p) => p.you);
  assert.ok(me.kills >= b.n, 'your kills counted');
});
