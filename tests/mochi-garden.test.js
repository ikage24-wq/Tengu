// Raising your Mochi in your garden (world/garden-life.js), played with real key presses: Up beside
// a Mochi opens its care panel, care and sweets work and use up the sweet, the crop bed gives crops
// once it's ripe, and one ready to evolve does.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord, giveExp, MOCHI_SWEETS, GARDEN_CROPS } from '../src/data/mochi-raise.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';
import { careFor, feedMochi, CROP_X, CROP_GROW } from '../src/world/garden-life.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });

// A garden with a grown-up swimmer and a fresh baby, on a clock the test moves.
function garden() {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  const swimmer = newRecord(rollMochi(901, { coat: null }));
  for (const [st, n] of [['swim', 3000], ['run', 1500], ['fly', 800], ['power', 900]]) giveExp(swimmer, st, n);
  const baby = newRecord(rollMochi(902, { coat: null }));
  char.garden = { back: null, mochi: [swimmer, baby], eggs: [], unlocked: {} };
  const w = createWorld(char);
  const logs = [];
  w.log = (m) => logs.push(m);
  w.forceNight = 0;
  let now = 1.8e12;
  const realNow = Date.now;
  Date.now = () => now;
  loadMap(w, 'garden', 'start');
  const run = (secs, step = 0.1) => {
    for (let t = 0; t < secs; t += step) {
      now += step * 1000;
      updateWorld(w, step, keys());
    }
  };
  const up = () => {
    const n = w.events.length;
    updateWorld(w, 1 / 60, keys(['ArrowUp']));
    return w.events.slice(n);
  };
  run(0.5);
  return { w, char, logs, run, up, swimmer, baby, done: () => (Date.now = realNow) };
}

test('every crop and sweet is a real item with its own icon', () => {
  for (const id of Object.keys(GARDEN_CROPS)) assert.equal(ITEMS[id]?.type, 'etc', id);
  for (const sw of MOCHI_SWEETS) assert.equal(ITEMS[sw.id]?.mochiSweet, sw.kind, sw.id);
});

test('Up beside a Mochi opens its care panel; care and sweets change it', () => {
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi[0];
    Object.assign(g.w.body, { x: e.x + 8, y: e.y });
    assert.deepEqual(g.up(), [{ type: 'mochi' }]);
    assert.equal(g.w.gardenLife.caring, e);
    const mood = g.swimmer.mood;
    assert.equal(careFor(g.w, e, 'pet').action, 'pet');
    assert.ok(g.swimmer.mood > mood);
    addItem(g.char.inventory, 'msweet_dango', 2);
    const out = feedMochi(g.w, e, 'msweet_dango');
    assert.equal(out.action, 'eat');
    assert.equal(countItem(g.char.inventory, 'msweet_dango'), 1);
    assert.equal(out.learned, 'roll');
    assert.equal(e.m.action.sweet, 'dango');
  } finally {
    g.done();
  }
});

test('the crop bed gives crops when ripe, then grows again', () => {
  const g = garden();
  try {
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3);
    g.up();
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 3, 'not ripe yet');
    g.run(CROP_GROW + 1, 1);
    Object.assign(g.w.body, { x: CROP_X, y: 700 });
    g.up();
    assert.equal(countItem(g.char.inventory, 'mochi_rice'), 6);
  } finally {
    g.done();
  }
});

test('a Mochiko ready to evolve does, there in the garden', () => {
  const g = garden();
  try {
    Object.assign(g.baby, { grown: 99999, age: 99999, mood: 90 });
    for (const st of STATS) giveExp(g.baby, st, 1200);
    g.run(0.3);
    const e = g.w.gardenLife.mochi[1];
    assert.equal(e.scene, 'evolve');
    assert.ok(['amamochi', 'karamochi', 'tsukimochi'].includes(g.baby.stage));
  } finally {
    g.done();
  }
});
