// The other players as people: what they remember of you, their friends and parties, their goals
// and moods, and the little things real players do (world/botmemory.js, world/botsoul.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createBots, updateBots, botsIn, makeBotCharacter, bodiedIn } from '../src/world/bots.js';
import { createWorld, loadMap } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { remember, recallLine, warmth, standing, memoryOf, partyTime } from '../src/world/botmemory.js';
import { soulOf, rollGoal, workGoal, goalLine, moodEvent, populationAt, MOODS, teamUp } from '../src/world/botsoul.js';
import { joinParty } from '../src/world/party.js';
import { ITEMS } from '../src/data/items.js';
import { MAPS } from '../src/data/maps.js';
import { shape } from '../src/world/chatlog.js';

const EVENING = () => new Date(2026, 9, 28, 20, 0);
function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) % 4294967296;
    return n / 4294967296;
  };
}
function quiet(world) {
  const lines = [];
  world.log = (t) => lines.push(t);
  return lines;
}
function run(world, bots, secs, dt = 0.1) {
  for (let t = 0; t < secs; t += dt) {
    world.now += dt;
    updateBots(bots, world, dt);
  }
}

test('they remember what you did together, it saves with you, and they bring it up by its real name', () => {
  const char = createCharacter('Me', {});
  const bot = { name: 'Mochi42', char: makeBotCharacter(seeded(5), { name: 'Mochi42', level: 20 }), style: {}, guild: null };
  remember(char, bot, 'run', 'Rootwood Hollow', 'hollow1');
  remember(char, bot, 'boss', 'Sylvana', 'sylvana');
  remember(char, bot, 'trade', 'Oak Bow');
  partyTime(char, bot, 900, 'meadow1');
  // Saved with your character, and back after a load.
  const back = JSON.parse(JSON.stringify(char));
  assert.ok(memoryOf(back).Mochi42, 'kept in the save');
  assert.ok(memoryOf(back).Mochi42.snap?.look, 'with how they looked, to come back as themselves');
  // Warmer the more you've done.
  assert.ok(warmth(back, 'Mochi42') > 8);
  assert.notEqual(standing(back, 'Mochi42'), 'stranger');
  assert.equal(standing(back, 'Nobody'), 'stranger');
  const lines = new Set();
  const rng = seeded(9);
  for (let i = 0; i < 80; i++) lines.add(recallLine(back, 'Mochi42', rng));
  const all = [...lines].join(' | ');
  assert.match(all, /Rootwood Hollow/);
  assert.match(all, /Sylvana/);
  assert.match(all, /Oak Bow/);
  assert.match(all, /Petal Meadow|Meadow|together/);
  assert.match(all, /earlier|today|last night/);
  assert.equal(recallLine(back, 'Stranger', rng), null);
});

test('time in a party is remembered, and someone you know comes over to say hi in town', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(11), { clock: EVENING });
  world.bots = bots;
  const pal = bots.list.find((b) => !b.shop);
  Object.assign(pal, { map: world.map.id, x: world.body.x + 200, state: 'idle', timer: 99, session: 9999, stay: 9999 });
  joinParty(bots, pal, world);
  run(world, bots, 10);
  assert.ok(memoryOf(world.char)[pal.name].partySecs >= 9, 'party time counts');
  // Someone else you've done a lot with, standing nearby in town.
  const other = bots.list.find((b) => !b.shop && !b.party && b !== pal);
  Object.assign(other, { map: world.map.id, x: world.body.x + 250, state: 'idle', timer: 99, session: 9999, stay: 9999, waved: true });
  for (let i = 0; i < 3; i++) remember(world.char, other, 'run', 'Rootwood Hollow');
  run(world, bots, 15);
  assert.ok(lines.some((l) => l.startsWith(`${other.name}:`) && /Me/.test(l)), `a hello by name (${lines.filter((l) => l.startsWith(other.name)).join(' / ')})`);
});

test('goals come from the real game: a set piece and who drops it, a level and its map, a craft and its material', () => {
  const rng = seeded(21);
  const kinds = new Set();
  for (let i = 0; i < 200; i++) {
    const c = makeBotCharacter(rng, { name: `g${i}` });
    const g = rollGoal(c, rng);
    if (!g) continue;
    kinds.add(g.kind);
    if (g.kind === 'set') {
      assert.ok(ITEMS[g.item], g.item);
      assert.ok(g.from);
    }
    if (g.kind === 'level') {
      assert.ok(MAPS[g.map] && !MAPS[g.map].isTown);
      assert.ok(g.to > c.level);
    }
    if (g.kind === 'craft') assert.ok(ITEMS[g.makes] && ITEMS[g.mat]);
    const bot = { char: c, name: c.name };
    c.soul = { mood: 'chill', goal: g, online: 0, done: [] };
    const line = goalLine(bot, rng);
    assert.ok(line);
    if (g.kind === 'set') assert.ok(line.includes(g.from) || line.includes(g.setName) || line.includes(ITEMS[g.item].name), line);
    if (g.kind === 'level') assert.ok(line.includes(g.mapName) || line.includes(String(g.to)), line);
  }
  for (const k of ['set', 'level', 'craft']) assert.ok(kinds.has(k), `${k} goals (${[...kinds]})`);
});

test('a goal moves along as they play, completes, and they move on to the next (a set piece goes on)', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(31), { clock: EVENING });
  const bot = bots.list.find((b) => b.level >= 22 && b.char.job !== 'novice' && !b.shop);
  Object.assign(bot, { map: world.map.id, x: world.body.x + 120, state: 'idle', timer: 99, session: 1e9, stay: 1e9 });
  const s = soulOf(bot);
  s.goal = { kind: 'set', set: 'sylvana', slot: 'hat', item: `set_sylvana_${bot.char.job === 'spiritmage' ? 'mage' : 'warrior'}_hat`, setName: 'Dryad Bloom', from: 'Sylvana', need: 2, got: 0 };
  if (!ITEMS[s.goal.item]) s.goal.item = Object.keys(ITEMS).find((id) => id.startsWith('set_sylvana_') && id.endsWith('_hat'));
  const first = s.goal;
  for (let t = 0; t < 900 && s.goal === first; t += 0.5) {
    world.now += 0.5;
    updateBots(bots, world, 0.5);
  }
  assert.notEqual(s.goal, first, 'done and on to a new one');
  assert.equal(bot.char.equipment.hat?.id, first.item, 'the piece went on');
  assert.ok(s.done.some((d) => d.what === first.item));
  // A level goal levels them for real.
  const c = makeBotCharacter(seeded(3), { name: 'Lv', level: 12 });
  const lv = { name: 'Lv', char: c, level: 12 };
  soulOf(lv).goal = { kind: 'level', to: 13, map: 'meadow1', mapName: 'x', mob: 'y' };
  let done = false;
  for (let i = 0; i < 400 && !done; i++) done = workGoal(lv, 2, seeded(i), { hunting: true });
  assert.ok(done && c.level >= 13, 'reached it');
  void lines;
});

test('moods shift with what happens and show in how they talk', () => {
  const c = makeBotCharacter(seeded(4), { name: 'Moody', level: 20 });
  const bot = { name: 'Moody', char: c };
  soulOf(bot, seeded(1));
  moodEvent(bot, 'died', { now: 1 });
  assert.equal(c.soul.mood, 'tired');
  assert.equal(bot.moodFace.face, 'sleepy');
  moodEvent(bot, 'goal', { now: 2 });
  assert.equal(c.soul.mood, 'cheerful');
  assert.ok(MOODS.includes(c.soul.mood));
  // A long session wears them out.
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  const bots = createBots(world, seeded(41), { clock: EVENING });
  for (const b of bots.list) b.session = 1e9;
  run(world, bots, 900, 1);
  assert.ok(bots.list.some((b) => b.char.soul?.mood === 'tired'), 'someone got tired');
});

test('in town some go AFK: sat down with an AFK tag, quiet, and back after a while', () => {
  // (Some of the bots' small choices roll Math.random rather than their own dice: pinned here, so
  // the run is the same every time.)
  const random = Math.random;
  Math.random = seeded(7);
  try {
    const world = createWorld(createCharacter('Me', {}));
    const lines = quiet(world);
    const bots = createBots(world, seeded(51), { clock: EVENING });
    world.bots = bots;
    for (const b of bots.list) Object.assign(b, { session: 1e9, stay: 1e9 });
    let afk = null;
    for (let t = 0; t < 1200 && !afk; t += 0.1) {
      world.now += 0.1;
      updateBots(bots, world, 0.1);
      afk = botsIn(bots, world.map.id).find((b) => b.afk);
    }
    assert.ok(afk, 'someone went AFK');
    assert.equal(afk.state, 'afk');
    const x = afk.x;
    const away = afk.afk;
    const saidBefore = lines.filter((l) => l.startsWith(`${afk.name}:`)).length;
    run(world, bots, 30);
    if (afk.afk) {
      assert.equal(afk.x, x, 'they stay put');
      assert.equal(lines.filter((l) => l.startsWith(`${afk.name}:`)).length, saidBefore, 'and quiet');
    }
    run(world, bots, 220);
    assert.ok(afk.afk !== away, 'back after a while');
  } finally {
    Math.random = random;
  }
});

test('players log in and out over the game day: busiest in the evening', () => {
  const at = (h) => new Date(Math.round((h / 24) * 24 * 60000));
  assert.ok(populationAt(at(18)) > populationAt(at(6)), 'evening over dawn');
  for (let h = 0; h < 24; h += 0.5) assert.ok(populationAt(at(h)) >= 22);
  let hour = 6;
  const world = createWorld(createCharacter('Me', {}));
  quiet(world);
  const bots = createBots(world, seeded(61), { clock: () => at(hour), daily: true });
  const dawn = bots.list.length;
  hour = 18;
  run(world, bots, 300, 0.5);
  assert.ok(bots.list.length > dawn, `more online in the evening (${dawn} -> ${bots.list.length})`);
  hour = 6;
  run(world, bots, 600, 0.5);
  assert.ok(bots.list.length <= populationAt(at(6)) + 2, `fewer again at dawn (${bots.list.length})`);
  assert.ok(bots.list.length >= 20);
});

test('players team up: hunters on a field form a group that keeps together, and town friends walk about together', () => {
  // (A few fields: a quiet one may have nobody hunting together just then.)
  let world;
  let bots;
  let crew = null;
  for (let seed = 71; seed < 80 && !crew; seed++) {
    world = createWorld(createCharacter('Me', {}));
    quiet(world);
    world.god = true;
    bots = createBots(world, seeded(seed), { clock: EVENING });
    world.bots = bots;
    loadMap(world, 'meadow1', 'start');
    for (let t = 0; t < 200 && !crew; t += 0.1) {
      world.now += 0.1;
      updateBots(bots, world, 0.1);
      crew = bodiedIn(bots, world.map.id).find((b) => b.crew)?.crew;
    }
  }
  assert.ok(crew, 'a group forms on the field');
  assert.ok(crew.members.length >= 2);
  // They keep near the leader.
  let close = 0;
  let checks = 0;
  for (let t = 0; t < 60 && crew.members.every((m) => m.crew === crew); t += 0.1) {
    world.now += 0.1;
    updateBots(bots, world, 0.1);
    if (Math.round(t * 10) % 10) continue;
    checks++;
    const lead = crew.lead.body;
    if (crew.members.every((m) => Math.abs(m.body.x - lead.x) < 320)) close++;
  }
  assert.ok(checks < 5 || close / checks > 0.6, `together most of the time (${close}/${checks})`);
  // In town, two friends walk about side by side.
  const tw = createWorld(createCharacter('Me', {}));
  quiet(tw);
  const tb = createBots(tw, seeded(5), { clock: EVENING });
  tw.bots = tb;
  const [a, b] = tb.list.filter((x) => !x.shop);
  Object.assign(a, { map: tw.map.id, x: tw.body.x + 300, state: 'walk', target: tw.body.x + 900, session: 1e9, stay: 1e9 });
  Object.assign(b, { map: tw.map.id, x: tw.body.x + 100, state: 'idle', timer: 99, session: 1e9, stay: 1e9 });
  teamUp(tb, [a, b]);
  let near = 0;
  for (let t = 0; t < 30; t += 0.1) {
    tw.now += 0.1;
    updateBots(tb, tw, 0.1);
    if (a.crew && Math.abs(a.x - b.x) < 130) near++;
  }
  assert.ok(near > 140, `walking together (${near})`);
});

test('everything they say goes through the gate: nothing repeats within ten minutes', () => {
  const world = createWorld(createCharacter('Me', {}));
  const lines = quiet(world);
  const bots = createBots(world, seeded(81), { clock: EVENING });
  world.bots = bots;
  for (const b of bots.list.slice(0, 6)) remember(world.char, b, 'run', 'Rootwood Hollow');
  run(world, bots, 600, 0.2);
  const said = lines.filter((l) => /^[^ \[(★]+: /.test(l));
  assert.ok(said.length > 10, `people talk (${said.length})`);
  const seen = new Map();
  for (const l of said) {
    const [name, ...rest] = l.split(': ');
    const key = shape(rest.join(': '), ['Me', name]);
    assert.ok(!seen.has(key), `said twice: ${l}`);
    seen.set(key, true);
  }
});
