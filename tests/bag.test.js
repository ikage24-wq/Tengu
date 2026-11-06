// The bag (core/inventory.js): 64 cells a tab, and the Materials pocket that keeps the life
// skills' haul (fish, gathered finds, crafted materials) out of the Etc tab.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createInventory, addItem, countItem, removeItem, tabFor, settleBag, TAB_SIZE } from '../src/core/inventory.js';
import { storeItem, takeItem } from '../src/core/storage.js';
import { ITEMS } from '../src/data/items.js';

test('every tab holds 64', () => {
  assert.equal(TAB_SIZE, 64);
  const inv = createInventory();
  const ids = Object.values(ITEMS).filter((i) => i.type === 'etc' && tabFor(i.id) === 'etc').map((i) => i.id);
  let n = 0;
  for (const id of ids) if (addItem(inv, id, 1)) n++;
  assert.equal(inv.etc.length, Math.min(64, ids.length));
  if (ids.length > 64) assert.equal(n, 64, 'the 65th does not fit');
});

test('fish, gathered finds and crafted materials go in Materials; drops, tools and furniture stay in Etc', () => {
  const inv = createInventory();
  for (const id of ['fish_minnow', 'clover', 'polish_copper']) {
    assert.equal(tabFor(id), 'mats', id);
    addItem(inv, id, 3);
    assert.equal(countItem(inv, id), 3);
  }
  for (const id of ['fluff', 'rod_oak', 'sea_table']) assert.equal(tabFor(id), 'etc', id);
  assert.equal(inv.mats.length, 3);
  assert.equal(inv.etc.length, 0);
  assert.equal(removeItem(inv, 'clover', 2), 2);
  assert.equal(countItem(inv, 'clover'), 1);
});

test('an old bag and chest get the pocket, and their materials move into it', () => {
  // A save from before: no Materials tab, fish and herbs mixed into Etc.
  const old = { equip: [], use: [], etc: [{ id: 'fluff', qty: 4 }, { id: 'fish_minnow', qty: 2 }, { id: 'clover', qty: 7 }], cash: [] };
  settleBag(old);
  assert.deepEqual(old.etc.map((e) => e.id), ['fluff']);
  assert.deepEqual(old.mats.map((e) => e.id).sort(), ['clover', 'fish_minnow']);
  assert.equal(countItem(old, 'clover'), 7);
  // Settling again changes nothing.
  settleBag(old);
  assert.equal(old.mats.length, 2);
});

test('materials go into the shared chest and back', () => {
  const char = { inventory: createInventory() };
  const world = { storage: createInventory() };
  addItem(char.inventory, 'fish_minnow', 5);
  assert.ok(storeItem(char, world, 'mats', 0));
  assert.equal(countItem(world.storage, 'fish_minnow'), 5);
  assert.ok(takeItem(char, world, 'mats', 0));
  assert.equal(countItem(char.inventory, 'fish_minnow'), 5);
});
