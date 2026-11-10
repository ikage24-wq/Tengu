// A damaged save is put back into shape rather than lost (2026-11-10: the dev save fuzzer found one
// bad bag slot or a missing list made the whole hero vanish, and a huge AP hung the game).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repairSave } from '../src/core/save.js';
import { createCharacter, autoAssignAp } from '../src/core/character.js';

test('a damaged save is repaired: broken bag entries dropped, broken parts reset, nothing normal changed', () => {
  const c = createCharacter('Tester', {});
  c.equipment.top = null;
  delete c.econ;
  c.inventory.etc = [null, { id: 'kinako', qty: 2 }, 'x', { id: 'azuki', qty: true }];
  c.hotkeys = null;
  c.album = 'x';
  c.level = '9';
  c.tutorial = -1;
  repairSave(c);
  assert.equal(c.equipment.top, null, 'an empty slot stays empty');
  assert.equal(c.econ, undefined, 'an old save keeps its missing fields for the update steps');
  assert.deepEqual(c.inventory.etc, [{ id: 'kinako', qty: 2 }, { id: 'azuki', qty: 1 }]);
  assert.deepEqual(c.hotkeys, {});
  assert.equal(c.album, undefined, 'a broken album is let go, to start afresh');
  assert.equal(c.level, 9);
  assert.equal(c.tutorial, undefined);
});

test('spending a damaged number of stat points never hangs', () => {
  const c = createCharacter('Tester', {});
  c.ap = 1e12;
  autoAssignAp(c);
  assert.equal(c.ap, 0);
  c.ap = 'lots';
  autoAssignAp(c);
  assert.equal(c.ap, 0);
});
