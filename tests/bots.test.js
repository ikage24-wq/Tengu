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
  for (let i = 0; i < 20000; i++) {
    updateBots(bots, world, 0.1);
    assert.ok(bots.list.length >= 20, 'at least 20 online');
    for (const t of TOWNS) assert.ok(botsIn(bots, t).length <= 8, `${t} stays uncrowded`);
    for (const b of bots.list) names.add(b.name);
  }
  assert.ok(names.size > 40, 'new players keep arriving');
  // Beginners gather in Sprout Village, veterans in Moonleaf Grove.
  const avg = (t) => {
    const here = botsIn(bots, t);
    return here.reduce((n, b) => n + b.level, 0) / Math.max(1, here.length);
  };
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
