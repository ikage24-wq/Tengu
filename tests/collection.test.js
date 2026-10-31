// The Monster Book, achievements and titles (core/collection.js, data/achievements.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { computeStats } from '../src/core/stats.js';
import { recordBook, newAchievements, titleOf, masteryAt } from '../src/core/collection.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';

test('a card fills on the first defeat and masters at 100 (5 for a boss), with no hidden stat bonus', () => {
  const c = createCharacter('Book', {});
  const before = computeStats(c);
  assert.equal(recordBook(c, 'snailbun'), 'card');
  for (let i = 1; i < masteryAt('snailbun') - 1; i++) assert.equal(recordBook(c, 'snailbun'), null);
  assert.equal(recordBook(c, 'snailbun'), 'master');
  assert.deepEqual(computeStats(c), before, 'cards are for collecting');
  assert.equal(masteryAt('gnarlroot'), 5);
});

test('achievements unlock titles once, and only earned titles can be worn', () => {
  const c = createCharacter('Ach', {});
  assert.equal(newAchievements(c).length, 0);
  c.level = 30;
  const got = newAchievements(c).map((a) => a.id);
  assert.ok(got.includes('lv10') && got.includes('lv30'));
  assert.deepEqual(newAchievements(c), [], 'each only once');
  c.title = 'lv30';
  assert.equal(titleOf(c), 'Veteran');
  c.title = 'lv50';
  assert.equal(titleOf(c), null, 'not earned yet');
  // Every achievement has a name, a line, a title and a check that works on a fresh hero.
  const fresh = createCharacter('New', {});
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.name && a.desc && a.title, a.id);
    assert.equal(typeof a.check(fresh), 'boolean', a.id);
  }
});
