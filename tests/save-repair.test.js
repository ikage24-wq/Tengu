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

// (The 2026-11-21 save fuzz: gear with its stats gone crashed working out your stats, and a tutorial
// step that wasn't a number crashed the lessons.)
test('gear that lost its stats gets its own back, broken hotkeys are cleared, and a broken tutorial step starts the lessons again', async () => {
  const { makeEquip } = await import('../src/core/items.js');
  const { computeStats } = await import('../src/core/stats.js');
  const c = createCharacter('Tester', {});
  c.equipment.weapon = makeEquip('sword_0', { variance: 0 });
  c.equipment.weapon.stats = null;
  c.inventory.equip = [{ ...makeEquip('sword_0', { variance: 0 }), stats: 'x' }];
  c.tutorial = { step: true };
  c.hotkeys = { KeyQ: { skill: 'pebble' }, KeyF: 'x', KeyA: null, KeyS: [1] };
  repairSave(c);
  assert.deepEqual(c.hotkeys, { KeyQ: { skill: 'pebble' } }, 'broken hotkeys cleared');
  assert.equal(typeof c.equipment.weapon.stats, 'object');
  assert.ok(Object.keys(c.equipment.weapon.stats).length > 0, 'its own base stats');
  assert.equal(typeof c.inventory.equip[0].stats, 'object');
  assert.equal(c.tutorial.step, 0);
  assert.doesNotThrow(() => computeStats(c));
});
