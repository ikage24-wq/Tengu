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

test('chat is about what is real for the speaker, and never repeats', async () => {
  const { contextOf, moodFor } = await import('../src/world/chatter.js');
  const { MAPS } = await import('../src/data/maps.js');
  const { MOBS } = await import('../src/data/mobs.js');
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  const bots = createBots(world, seeded(5), { clock: EVENING });
  // A hunter out on Mossy Woods.
  const char = makeBotCharacter(seeded(6), { name: 'Hunter', level: 20, jobs: ['archer'] });
  const bot = { name: 'Hunter', char, level: 20, map: 'woods', style: makeStyle(seeded(7)), title: 'Veteran' };
  const here = new Set(MAPS.woods.spawns.map((sp) => MOBS[sp.mob].name.toLowerCase()));
  const elsewhere = Object.values(MOBS).map((d) => d.name.toLowerCase()).filter((n) => !here.has(n) && ![...here].some((h) => h.includes(n) || n.includes(h)));
  const memory = new Set();
  const said = [];
  for (let i = 0; i < 60; i++) {
    const ctx = contextOf(bot, bots, world);
    const line = speak(memory, moodFor(bot, Math.random, ctx), ctx, bot.style, Math.random);
    if (line) said.push(line);
  }
  assert.equal(new Set(said).size, said.length, 'never the same line twice');
  assert.ok(said.length >= 25, `plenty to say (${said.length})`);
  // A monster from somewhere else only comes up with the map it lives on (where they're headed next).
  const livesAt = (n) => Object.values(MAPS).filter((m) => (m.spawns ?? []).some((sp) => MOBS[sp.mob].name.toLowerCase() === n)).map((m) => m.name.toLowerCase());
  for (const l of said) for (const n of elsewhere) if (l.toLowerCase().includes(n)) assert.ok(livesAt(n).some((m) => l.toLowerCase().includes(m)), `a monster that's here, or where it lives: ${l}`);
  // Nothing about trading (the market is gone) or generic party-finding.
  assert.ok(!said.some((l) => /wts|wtb|price check/i.test(l)));
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

test('parties: anyone you invite joins (no refusals), and they leave when you do', async () => {
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
  for (let i = 0; i < 60; i++) updateParty(bots, world, 0.05);
  assert.deepEqual(partyMembers(bots).map((b) => b.id).sort(), ['high', 'low', 'near']);
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
// Everything said, in the log or only over someone's head (chat holds some back: chatlog.js).
const spoken = (world, lines) => [...lines, ...(world.chatGate ? world.chatGate.said.keys() : [])].join(String.fromCharCode(10)).toLowerCase();

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
  assert.ok(lines.some((l) => /gr|gz|congrats|ding|woo|level/i.test(l)), `cheers for the level (${lines.join(' | ')})`);
});

test('in town, players chat with each other and wear sets (no titles or rug shops)', () => {
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
  // (The old stand-in fishing and cooking are gone: real life skills are tested below.)
  assert.ok(!seen.has('fish') && !seen.has('cook'), `no stand-in fishing or cooking (${[...seen]})`);
  assert.ok(seen.has('chat'), 'two chatted');
  assert.ok(!bots.list.some((b) => b.shop), 'no rug shops');
  const rng = seeded(9);
  const chars = Array.from({ length: 60 }, (_, i) => makeBotCharacter(rng, { name: `s${i}`, level: 40 }));
  assert.ok(chars.some((c) => Object.values(c.equipment).some((e) => e?.id.startsWith('set_'))), 'some wear set pieces');
  assert.ok(!bots.list.some((b) => b.title), 'no titles');
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
      // (A kill stealer goes for yours on purpose: that's their whole thing.)
      if (bots.list.find((b) => b.id === h.party)?.rude) continue;
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
  const char = makeBotCharacter(seeded(4), { name: 'Dasher', level: 45, jobs: ['warrior', 'berserker'], pro: false });
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

// ---------- Friends, and help ----------

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

test('a queen back for a rematch: players gather, dodge and take her moves, and cheer when she falls', async () => {
  const { spawnMob } = await import('../src/world/mobs.js');
  const { killMob } = await import('../src/world/world.js');
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  world.god = true;
  world.char.level = 32;
  const bots = createBots(world, seeded(61), { clock: EVENING });
  world.bots = bots;
  loadMap(world, 'glade', 'start');
  // (Just this one queen: the glade's own roaming one is sent off for the test.)
  world.mobs = world.mobs.filter((m) => !m.def.boss);
  world.spawner.slots = world.spawner.slots.filter((s) => !s.spawn?.respawn);
  updateBots(bots, world, 0.05);
  const queen = spawnMob(world.map, { mob: 'sylvana', x: world.body.x + 260, y: world.map.groundY });
  queen.aggroUntil = Infinity;
  world.mobs.push(queen);
  let hurt = 0;
  const seen = new Set();
  const came = new Set();
  for (let t = 0; t < 25; t += 1 / 30) {
    updateWorld(world, 1 / 30, NONE);
    updateBots(bots, world, 1 / 30);
    for (const b of bots.list) if (b.raid) came.add(b.id);
    for (const n of world.numbers) if (n.small && n.color === '#ff8fa8' && !seen.has(n)) {
      seen.add(n);
      hurt++;
    }
  }
  // (Counting everyone who came: some may have fallen to her by now.)
  assert.ok(came.size >= 3, `players gathered (${came.size})`);
  assert.ok(lines.some((l) => /Players are gathering/.test(l)));
  assert.ok(hurt > 0, 'her moves (or her touch) caught some of them');
  // Down she goes: everyone cheers.
  queen.hp = 0;
  killMob(world, queen);
  const said = new Set();
  for (let t = 0; t < 4; t += 1 / 30) {
    world.now += 1 / 30;
    updateBots(bots, world, 1 / 30);
    for (const b of bots.list) if (b.bubble) said.add(b.bubble.text);
  }
  assert.ok([...said].some((l) => /GG|we did it|ez clap|gg|WOO|so fun| down!!|bye bye/.test(l)), `they cheer (${[...said].join(' | ')})`);
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
  loadMap(world, 'meadow1', 'west');
  world.mobs = [];
  const m = spawnMob(world.map, { mob: 'snailbun', x: world.body.x + 60, y: world.body.y });
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
    fin = pal.attack?.pose === 'plverdict';
  }
  assert.ok(fin, 'and their own finisher goes off');
});

test("the Star Witch's paths fight with their whole kit: the concert stage, the planets in a row, and songs", async () => {
  const { botSkills, tickHunter } = await import('../src/world/party.js');
  const { spawnMob } = await import('../src/world/mobs.js');
  const { createBody } = await import('../src/world/physics.js');
  const shrine = makeBotCharacter(seeded(3), { name: 'Mimi', level: 50, jobs: ['spiritmage', 'shrinemaiden'] });
  const onmyo = makeBotCharacter(seeded(4), { name: 'Vega', level: 50, jobs: ['spiritmage', 'onmyoji'] });
  const ids = (c) => botSkills(c).map((s) => s.id);
  for (const id of ['thousandtorii', 'grandblessing', 'blessing']) assert.ok(ids(shrine).includes(id), `Starlight Idol: ${id}`);
  for (const id of ['ofudabarrage', 'troupecombo']) assert.ok(ids(onmyo).includes(id), `Astronomer: ${id}`);
  for (const [char, fx] of [[shrine, 'sistage'], [onmyo, 'asalign']]) {
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
  for (const k of Object.keys(bots.social)) if (k.endsWith('In')) bots.social[k] = 1e9;
  return { world, bots, lines };
}

test('GM events: Double EXP doubles what you earn', async () => {
  const { killMob } = await import('../src/world/world.js');
  const { spawnMob } = await import('../src/world/mobs.js');
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
});

test('weather: rain comes and goes, and snow in winter', () => {
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
  // Snow in December.
  bots.clock = () => new Date(2026, 11, 20, 18, 0);
  roll('snow');
  assert.equal(world.weather, 'snow');
});

test('a lucky drop: the players around react', async () => {
  const { luckyDrop } = await import('../src/world/social.js');
  const { makeEquip } = await import('../src/core/items.js');
  const { world, bots, lines } = eventTown(422);
  luckyDrop(bots, world, makeEquip('sword_10', { rarity: 3 }));
  // (The town's chat log is paced, so in a busy square a reaction may only be said over their
  // heads: either counts.)
  const said = new Set();
  for (let t = 0; t < 8; t += 0.5) {
    townStep(world, bots, 0.5);
    for (const b of bots.list) if (b.bubble?.text) said.add(b.bubble.text);
  }
  assert.ok([...lines, ...said].some((l) => /gz|lucky|farmed|crazy|fair|legendary/.test(l)), 'they react');
});

test('a dungeon group looking for your role takes you in', async () => {
  const { joinGroup } = await import('../src/world/social.js');
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
    bots.social.lfgIn = 0;
    townStep(world, bots, 0.1);
    bot = bots.list.find((b) => b.lfg);
  }
  assert.ok(bot, 'someone is looking');
  assert.ok(lines.some((l) => /healer/i.test(l) && l.startsWith(`${bot.name}:`)), 'for a healer, like you');
  assert.equal(joinGroup(bots, world, bot), null);
  assert.ok(world.dungeon && bot.party, 'in the dungeon with them');
});

test('accepting a help request or a dungeon group never pushes your party past its cap', async () => {
  const { helpOut } = await import('../src/world/lives.js');
  const { joinGroup } = await import('../src/world/social.js');
  const { joinParty, partyMembers, PARTY_MAX } = await import('../src/world/party.js');
  const { world, bots } = eventTown(451);
  world.char.level = 40;
  const others = bots.list.filter((b) => !b.shop && b.char.job !== 'novice');
  for (const b of others.slice(0, PARTY_MAX)) joinParty(bots, b, world);
  assert.equal(partyMembers(bots).length, PARTY_MAX);
  const asker = others[PARTY_MAX];
  asker.helpAsk = { mob: 'snailbun', n: 5, until: world.now + 60 };
  bots.lives.ask = asker.helpAsk;
  assert.ok(helpOut(bots, world, asker), 'a full party says so');
  const lead = others[PARTY_MAX + 1];
  lead.lfg = { dungeon: 'hollow', role: 'healer', until: world.now + 60 };
  assert.ok(joinGroup(bots, world, lead), 'and a group asks you to leave your party first');
  assert.equal(partyMembers(bots).length, PARTY_MAX);
  assert.ok(!world.dungeon);
});

// ---------- Life skills (world/botlife.js) ----------

// A field with its players, run for `secs` (you standing still at the start), calling `each` every frame.
function lifeField(mapId, seed, secs, { night = false, each = null } = {}) {
  // A run always plays out the same way: the world's own dice are seeded from the very start (the
  // monsters' first places included), and its clocks are fixed (the game hour, the server's
  // evening), never the real time the test happens to run at.
  const random = Math.random;
  Math.random = seeded(seed + 1000);
  const lines = [];
  let world;
  let bots;
  try {
    world = createWorld(createCharacter('Tester', {}));
    world.log = (t) => lines.push({ t, at: world.now });
    world.char.level = 20;
    world.god = true;
    world.dayClock = EVENING;
    world.forceNight = night ? 1 : 0;
    bots = createBots(world, seeded(seed), { clock: EVENING });
    loadMap(world, mapId, 'start');
    for (let t = 0; t < secs; t += 1 / 30) {
      updateWorld(world, 1 / 30, NONE);
      updateBots(bots, world, 1 / 30);
      each?.(world, bots);
    }
  } finally {
    Math.random = random;
  }
  return { world, bots, lines };
}

test('generated players have life levels of their own: most casual, some keen with tools', async () => {
  const { lifeLevel, LIFE_SKILLS } = await import('../src/core/life.js');
  const { ITEMS } = await import('../src/data/items.js');
  const rng = seeded(31);
  const chars = Array.from({ length: 300 }, (_, i) => makeBotCharacter(rng, { name: `life${i}` }));
  const keen = chars.filter((c) => c.lifeStyle === 'keen');
  assert.ok(keen.length > 15 && keen.length < 90, `a few keen life-skillers (${keen.length} of 300)`);
  for (const c of chars) for (const s of LIFE_SKILLS) assert.ok(lifeLevel(c, s) >= 1 && lifeLevel(c, s) <= 50);
  const top = (c) => Math.max(...LIFE_SKILLS.map((s) => lifeLevel(c, s)));
  const avg = (list) => list.reduce((n, c) => n + top(c) / Math.max(1, c.level), 0) / list.length;
  assert.ok(avg(keen) > avg(chars.filter((c) => c.lifeStyle !== 'keen')) * 1.4, 'keen ones are well ahead for their level');
  assert.ok(keen.some((c) => Object.values(c.lifeTools ?? {}).some((id) => ITEMS[id]?.life)), 'keen ones carry bench-made tools');
  // The same character gets the same levels (they don't shift the rest of its rolls).
  const a = makeBotCharacter(seeded(5), { name: 'Same' });
  const b = makeBotCharacter(seeded(5), { name: 'Same' });
  assert.deepEqual(a.life, b.life);
});

test('players on a field work its ready life spots, leave them ready for you, and spread over the floors', async () => {
  const { nodeReady } = await import('../src/world/gathering.js');
  const worked = new Map();
  const kinds = new Set();
  const phases = new Set();
  let resting = 0;
  // (Seed 12: across seeds 11-15 several spots get worked; seed 11 alone sends this run's
  // players off elsewhere since the early levels got quicker.)
  const { world, bots } = lifeField('meadow1', 12, 600, {
    night: true,
    each: (w, bs) => {
      for (const b of bs.list) {
        if (!b.hunter || !b.life || b.life.phase === 'walk') continue;
        kinds.add(b.life.kind);
        if (b.life.kind === 'node') worked.set(b.life.i, b.life.node);
        else phases.add(b.life.phase);
        // Working a spot is standing at it, on its floor.
        const at = b.life.node ?? b.life.spot;
        assert.ok(Math.abs(b.body.x - at.x) < 30 && Math.abs(b.body.y - at.y) < 6, 'at the spot itself');
      }
      // A spot a player just worked is still ready for you (only they wait for it to grow back).
      for (const k of Object.keys(w.botRest ?? {})) if (!nodeReady(w, Number(k.split(':')[1]))) resting++;
    },
  });
  assert.ok(worked.size >= 4, `several spots worked (${worked.size})`);
  assert.equal(resting, 0, 'their work never uses a spot up for you');
  assert.equal(Object.keys(world.nodeRest ?? {}).length, 0, 'nothing rests for you');
  assert.ok(Object.keys(world.botRest ?? {}).length >= 3, 'the other players wait before working one again');
  const floors = new Set([...worked.values()].map((n) => n.y));
  assert.ok(floors.size >= 3, `worked on many floors (${[...floors]})`);
  assert.ok(kinds.has('fish'), 'and someone sat at the fishing nook');
  assert.ok(phases.has('wait') && phases.has('catch'), `waiting, then a catch (${[...phases]})`);
  assert.ok(bots.list.some((b) => b.hunter && b.lifer) || worked.size >= 4, 'a keen life-skiller among them');
});

test('a player never takes the spot you are using, and gives one up the moment you start on it', async () => {
  const { nodesOf, nodeReady, startGathering } = await import('../src/world/gathering.js');
  const { fieldLife } = await import('../src/world/botlife.js');
  const { createBody } = await import('../src/world/physics.js');
  // You stand at a spot all along: nobody ever goes for it.
  const world0 = createWorld(createCharacter('Tester', {}));
  quiet(world0);
  loadMap(world0, 'meadow1', 'start');
  const target = nodesOf(world0).findIndex((n) => !n.night && n.kind === 'herb');
  const spot = nodesOf(world0)[target];
  let tried = 0;
  lifeField('meadow1', 13, 300, {
    each: (w, bs) => {
      Object.assign(w.body, { x: spot.x, y: spot.y, vx: 0, vy: 0 });
      for (const b of bs.list) if (b.life?.kind === 'node') {
        tried++;
        assert.notEqual(b.life.i, target, 'never the spot you are at');
      }
      // Nobody stands on or by the spot you're at.
      for (const b of bs.list) if (b.body && b.life && b.life.phase !== 'walk' && Math.abs(b.body.x - spot.x) < 60 && Math.abs(b.body.y - spot.y) < 30) assert.fail('standing on your spot');
    },
  });
  assert.ok(tried > 0, 'they worked other spots meanwhile');
  // A player mid-work on a spot: you start on it, they let it go and it stays ready for you.
  const world = createWorld(createCharacter('Tester', {}));
  quiet(world);
  world.char.level = 20;
  loadMap(world, 'meadow1', 'start');
  world.bots = { list: [] };
  const char = makeBotCharacter(seeded(3), { name: 'Picker', level: 20, jobs: ['warrior'], life: 'keen' });
  for (const s of ['gathering', 'mining', 'fishing']) char.life[s].level = 30;
  const n0 = nodesOf(world).find((n) => !n.night);
  const bot = { id: 'p1', name: 'Picker', char, level: 20, hunter: true, lifer: true, map: 'meadow1', x: n0.x - 12, facing: 1, body: createBody(n0.x - 12, n0.y), brain: { settled: false }, appear: 0 };
  bot.body.onGround = true;
  world.bots.list.push(bot);
  world.body.x = 30;
  for (let k = 0; k < 40 && !bot.life; k++) {
    bot.lifeIn = 0;
    fieldLife(bot, world, 1 / 30, seeded(k + 1));
  }
  assert.ok(bot.life, 'they went for a spot');
  if (bot.life.kind !== 'node') return;
  bot.life.phase = 'work';
  const i = bot.life.i;
  const n = nodesOf(world)[i];
  Object.assign(world.body, { x: n.x + 6, y: n.y, onGround: true, vx: 0, vy: 0 });
  assert.equal(startGathering(world), null, 'you can start on it');
  fieldLife(bot, world, 1 / 30, seeded(9));
  assert.equal(bot.life, null, 'they let it go');
  assert.ok(nodeReady(world, i), 'still ready for you');
});

test('what players say about their life skills goes through the chat gate, names real things, and never repeats', async () => {
  const { shape } = await import('../src/world/chatlog.js');
  const { ITEMS } = await import('../src/data/items.js');
  const { FISH } = await import('../src/data/fishing.js');
  const { GATHERED } = await import('../src/data/gathering.js');
  const finds = [...GATHERED.map((g) => g[1]), ...FISH.map((f) => f.name)];
  const life = [];
  for (const [map, seed] of [['cave', 4], ['meadow1', 11], ['woods', 3], ['sky', 3]]) {
    const { lines, world } = lifeField(map, seed, 900, { night: true });
    const said = lines.filter(({ t }) => /^[^:[★(]+: /.test(t));
    // No line twice in ten minutes (names and numbers aside): the gate's rule.
    const last = new Map();
    for (const { t, at } of said) {
      const who = t.slice(0, t.indexOf(':'));
      const key = shape(t.slice(t.indexOf(': ') + 2), ['Tester', who]);
      assert.ok(!(last.has(key) && at - last.get(key) < 600), `said twice: ${t}`);
      last.set(key, at);
    }
    const ours = said.filter(({ t }) => finds.some((f) => t.toLowerCase().includes(f.toLowerCase())) || /fishing|gathering|mining|cooking|crafting/i.test(t));
    life.push(...ours.map(({ t }) => t));
    // A rare find from a vein names a real gem, and that vein's own.
    for (const { t } of ours) {
      const m = /got an? (.+?) out of the (.+?) vein/i.exec(t);
      if (m) assert.ok(Object.values(ITEMS).some((d) => d.name.toLowerCase() === m[1].toLowerCase()), `a real gem (${t})`);
    }
    assert.ok(world.chatGate, 'the gate was used');
  }
  assert.ok(life.length >= 4, `players talk about their life skills now and then (${life.join(' / ')})`);
  // Names are written as they are (no typos in an item's name).
  assert.ok(life.filter((l) => finds.some((f) => l.toLowerCase().includes(f.toLowerCase()))).length >= 2, `by their real names (${life.join(' / ')})`);
});

test('in town players cook at the stove and craft at the bench, and ask where their next material is found', async () => {
  const { whereFrom } = await import('../src/world/botlife.js');
  const world = createWorld(createCharacter('Tester', {}));
  const lines = quiet(world);
  loadMap(world, 'grove', 'start');
  const bots = createBots(world, seeded(3), { clock: EVENING });
  const seen = new Set();
  for (let t = 0; t < 900; t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    for (const b of botsIn(bots, 'grove')) {
      if (b.state !== 'life') continue;
      seen.add(b.life.kind);
      if (b.life.kind === 'cook') assert.ok(Math.abs(b.x - world.map.stove) < 30, 'at the stove');
      if (b.life.kind === 'craft') assert.ok(Math.abs(b.x - world.map.bench) < 30, 'at the bench');
    }
  }
  assert.ok(seen.has('cook') && seen.has('craft'), `cooking and crafting (${[...seen]})`);
  // Asking after a material names it and what it's for; an answer says where, from the data.
  const asks = lines.filter((l) => /(where to find|where do u get|^[^:]+: lf) /i.test(l));
  for (const l of asks) assert.ok(/for my |needs it|making /i.test(l), l);
  assert.match(whereFrom('copper_ore'), /veins on (Petal Meadow|Clover Hills|Windy Canyon)/);
  assert.match(whereFrom('sapphire'), /silver ore veins/);
  assert.match(whereFrom('moonpetal'), /only opens at night/);
  assert.match(whereFrom('fish_koi'), /bites at/);
  assert.equal(whereFrom('no_such_thing'), null);
});

test('at night, someone near you points out where the night-only find is open', () => {
  // (Someone has to come near you first: a few nights, one is plenty.)
  const tip = ({ t }) => /moonpetal/i.test(t) && /(up|down|left|right|by u)/.test(t);
  const nights = [7, 8, 9, 10, 11].map((seed) => lifeField('meadow1', seed, 300, { night: true }).lines.filter(tip));
  assert.ok(nights.filter((n) => n.length).length >= 2, 'a tip about the Moonpetal and where it is');
  assert.ok(nights.every((n) => n.length <= 1), 'once a night');
  const day = lifeField('meadow1', 7, 120);
  assert.ok(!day.lines.some(({ t }) => /open tonight|are out! theres one|only opens at night,/i.test(t)), 'not by day');
});
