// The Mochi pet (world/mochi.js): adopting one, and what it does for you.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { spawnDrops } from '../src/world/drops.js';
import { adoptPet, EGG_CASH, hatchPet } from '../src/world/mochi.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
const run = (w, secs) => { for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, idle); };

function world() {
  const c = createCharacter('Owner', {});
  const w = createWorld(c);
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  w.god = true;
  return w;
}

test('a Mochi is adopted for Cash, one at a time, and never needs feeding', () => {
  const c = createCharacter('Owner', {});
  c.cash = EGG_CASH - 1;
  assert.ok(adoptPet(c), 'not enough Cash');
  c.cash = EGG_CASH;
  assert.equal(adoptPet(c), null);
  assert.ok(adoptPet(c), 'only one');
  assert.equal(c.pet.stats, undefined, 'no growth stats to feed');
});

test('out with you, a Mochi follows, fetches loot in range and leaves loot out of range', () => {
  const w = world();
  hatchPet(w.char);
  run(w, 0.5);
  assert.ok(w.mochi, 'it is out');
  assert.ok(Math.abs(w.mochi.x - w.body.x) < 40, 'beside you');
  const b = w.body;
  w.drops.push(...spawnDrops([{ kind: 'item', id: 'fluff', qty: 1 }], b.x + 60, b.y), ...spawnDrops([{ kind: 'item', id: 'shell', qty: 1 }], b.x + 600, b.y));
  run(w, 4);
  assert.equal(countItem(w.char.inventory, 'fluff'), 1, 'fetched the near one');
  assert.equal(countItem(w.char.inventory, 'shell'), 0, 'left the far one');
});

test('a Mochi drinks a tonic when you run low, and never goes hungry or sulks', () => {
  const w = world();
  const c = w.char;
  hatchPet(c);
  assert.equal(c.pet.full, undefined, 'no tummy to fill');
  addItem(c.inventory, 'red_potion', 5);
  run(w, 2);
  c.hp = 1;
  run(w, 1);
  assert.ok(c.hp > 1, 'gave you a tonic');
  // An hour out with you later, it still helps.
  run(w, 2);
  w.now += 3600;
  const n = countItem(c.inventory, 'red_potion');
  c.hp = 1;
  run(w, 1);
  assert.ok(countItem(c.inventory, 'red_potion') < n, 'still helping');
});
