// The Monster Book (core/collection.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { computeStats } from '../src/core/stats.js';
import { recordBook, masteryAt } from '../src/core/collection.js';

test('a card fills on the first defeat and masters at 100 (5 for a boss), with no hidden stat bonus', () => {
  const c = createCharacter('Book', {});
  const before = computeStats(c);
  assert.equal(recordBook(c, 'snailbun'), 'card');
  for (let i = 1; i < masteryAt('snailbun') - 1; i++) assert.equal(recordBook(c, 'snailbun'), null);
  assert.equal(recordBook(c, 'snailbun'), 'master');
  assert.deepEqual(computeStats(c), before, 'cards are for collecting');
  assert.equal(masteryAt('gnarlroot'), 5);
});
