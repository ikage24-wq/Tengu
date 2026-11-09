// Your Mochi out with you (world/mochi.js): any Mochi from your Garden comes along, follows you,
// fetches loot in its reach, gives you a tonic when you run low, and a grown one lends you a little
// of its form; at home in the Garden it's with the others; the old Cash pet hatches as itself.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { spawnDrops } from '../src/world/drops.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord, evolve } from '../src/data/mochi-raise.js';
import { takeAlong, sendHome, petReach, formHelp } from '../src/world/mochi.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set(), locked: false };
const run = (w, secs) => { for (let i = 0; i < secs * 60; i++) updateWorld(w, DT, idle); };
const mochi = (seed, points) => {
  const rec = newRecord(rollMochi(seed, { coat: null }));
  for (const st of STATS) rec.stats[st].points = points;
  return rec;
};

function world(rec) {
  const c = createCharacter('Owner', {});
  c.garden = { back: null, mochi: [rec], eggs: [], unlocked: {} };
  const w = createWorld(c);
  w.log = () => {};
  loadMap(w, 'meadow1', 'west');
  w.mobs = [];
  w.spawner.slots = [];
  w.god = true;
  return w;
}

test('your Mochi comes along, follows you, fetches loot in reach and leaves loot out of it', () => {
  const rec = mochi(11, 300);
  const w = world(rec);
  takeAlong(w.char, rec);
  run(w, 0.5);
  assert.ok(w.mochi, 'it is out');
  assert.equal(w.mochi.rec, rec, 'your own Mochi');
  assert.ok(Math.abs(w.mochi.x - w.body.x) < 40, 'beside you');
  const b = w.body;
  w.drops.push(...spawnDrops([{ kind: 'item', id: 'fluff', qty: 1 }], b.x + 60, b.y), ...spawnDrops([{ kind: 'item', id: 'shell', qty: 1 }], b.x + 600, b.y));
  run(w, 4);
  assert.equal(countItem(w.char.inventory, 'fluff'), 1, 'fetched the near one');
  assert.equal(countItem(w.char.inventory, 'shell'), 0, 'left the far one');
  // A faster runner reaches further.
  assert.ok(petReach(mochi(12, 2200)).range > petReach(mochi(13, 0)).range);
  // Sent home, it goes.
  sendHome(w.char);
  run(w, 0.1);
  assert.equal(w.mochi, null);
});

test('it gives you a tonic when you run low', () => {
  const rec = mochi(14, 300);
  const w = world(rec);
  const c = w.char;
  takeAlong(c, rec);
  addItem(c.inventory, 'red_potion', 5);
  run(w, 2);
  c.hp = 1;
  run(w, 1);
  assert.ok(c.hp > 1, 'gave you a tonic');
});

test('a grown Mochi lends you a little of its form while it is out; at home in the Garden it does not', () => {
  const rec = mochi(15, 300);
  rec.stats.run.points = 1700;
  Object.assign(rec, { age: 99999, mood: 90, trend: { run: 50, fly: 0, power: 0, stamina: 0, swim: 0 } });
  evolve(rec);
  assert.equal(rec.form, 'run');
  const help = formHelp(rec);
  assert.ok(help.values.speed > 0);
  assert.equal(formHelp(mochi(16, 300)), null, 'a Mochiko lends nothing yet');
  const w = world(rec);
  takeAlong(w.char, rec);
  run(w, 0.2);
  assert.ok(w.char.buffs['mochi:pet']?.values.speed > 0, 'a little speed');
  // In the Garden it's home with the others.
  loadMap(w, 'garden', 'start');
  run(w, 0.2);
  assert.equal(w.mochi, null);
  assert.equal(w.char.buffs['mochi:pet'], undefined);
});

test('the old Cash egg pet becomes a Star Egg that hatches as itself, its name and all', () => {
  const rec = mochi(17, 300);
  const w = world(rec);
  w.char.pet = { name: 'Mochi', out: true, opts: { loot: true, hp: 40, mp: 25 } };
  run(w, 0.1);
  assert.equal(w.char.pet, null);
  assert.equal(countItem(w.char.inventory, 'mochi_egg_star'), 1);
  loadMap(w, 'garden', 'start');
  const egg = w.char.garden.eggs.find((e) => e.name === 'Mochi');
  assert.ok(egg, 'set down by the gate, with its name');
  w.forceNight = 0;
  Object.assign(w.body, { x: 404 + 26 * w.char.garden.eggs.indexOf(egg), y: w.body.y });
  updateWorld(w, DT, { ...idle, pressed: new Set(['ArrowUp']) });
  w.gardenLife.hatching.m.hatched = true;
  run(w, 0.1);
  assert.equal(w.char.garden.mochi.at(-1).name, 'Mochi');
  assert.equal(w.naming ?? null, null, 'no need to name it again');
});
