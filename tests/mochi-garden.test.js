// Raising your Mochi in your garden (world/garden-life.js), played with real key presses: Up beside
// a Mochi opens its care panel, care and sweets work and use up the sweet, the crop bed gives crops
// once it's ripe, and one ready to evolve does; at the end of a long, happy life it goes back to its
// egg; you can say goodbye to one; a full garden won't hatch another. And a friend visiting: their
// game asks yours for the garden, sees the same Mochi in the same places, and their pets and sweets
// reach your real Mochi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap, useItem } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord, giveExp, evolve, MOCHI_SWEETS, GARDEN_CROPS } from '../src/data/mochi-raise.js';
import { addItem, countItem } from '../src/core/inventory.js';
import { ITEMS } from '../src/data/items.js';
import { careFor, feedMochi, sayGoodbye, scheduledAt, CROP_X, CROP_GROW, GARDEN_MAX, EGG_SLOTS } from '../src/world/garden-life.js';
import { online } from '../src/net/online.js';
import { onVisit, askGardenVisit } from '../src/net/visit.js';

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

test('at the end of a long, happy life it goes back to its egg and hatches again', () => {
  const g = garden();
  try {
    const rec = g.swimmer;
    Object.assign(rec, { age: 99999, mood: 90 });
    evolve(rec);
    rec.age = 30 * 3600;
    rec.mood = 95;
    g.run(0.2);
    const e = g.w.gardenLife.mochi[0];
    assert.equal(e.scene, 'rebirth');
    assert.equal(g.char.garden.mochi[0].stage, 'egg');
    assert.equal(g.char.garden.mochi[0].gen, 2);
    // (The scenes are drawn; here they're marked done by hand.)
    e.m.reborn = true;
    g.run(0.1);
    assert.equal(e.scene, 'hatch');
    e.m.hatched = true;
    g.run(0.1);
    assert.equal(e.scene, null);
    assert.equal(g.char.garden.mochi[0].stage, 'mochiko');
  } finally {
    g.done();
  }
});

test('saying goodbye: it waves, fades and leaves; a full garden hatches no more', () => {
  const g = garden();
  try {
    const e = g.w.gardenLife.mochi[1];
    assert.ok(sayGoodbye(g.w, e));
    g.run(4);
    assert.equal(g.char.garden.mochi.length, 1);
    assert.equal(g.w.gardenLife.mochi.length, 1);
    // Full up: rocking an egg says so instead.
    while (g.char.garden.mochi.length < GARDEN_MAX) g.char.garden.mochi.push(newRecord(rollMochi(990 + g.char.garden.mochi.length)));
    g.char.garden.eggs = [{ seed: 4242 }];
    Object.assign(g.w.body, { x: EGG_SLOTS[0], y: g.w.body.y });
    g.up();
    assert.equal(g.w.gardenLife.hatching, null);
    assert.match(g.logs.at(-1), /garden is full/);
  } finally {
    g.done();
  }
});

test("visiting a friend's garden: same Mochi, same places; pets and sweets reach theirs", () => {
  // Two games in one room: Ann (with a garden) and Bea, visiting. Messages go by hand.
  const host = garden();
  const char = createCharacter('Bea', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: [], eggs: [], unlocked: {} };
  const bea = createWorld(char);
  const beaLogs = [];
  bea.log = (m) => beaLogs.push(m);
  bea.forceNight = 0;
  loadMap(bea, 'sprout', 'start');
  const out = [];
  const was = { ...online, ghosts: online.ghosts };
  Object.assign(online, { status: 'on', link: { send: (m) => out.push(m) }, ghosts: new Map([['A', { id: 'A', name: 'Ann' }], ['B', { id: 'B', name: 'Bea' }]]) });
  const deliver = () => {
    while (out.length) {
      // (Over the wire, as a copy.)
      const msg = JSON.parse(JSON.stringify(out.shift()));
      const [w, from] = msg.to === 'A' ? [host.w, 'Bea'] : [bea, 'Ann'];
      online.id = msg.to;
      onVisit(w, msg, { name: from });
    }
  };
  try {
    online.id = 'B';
    assert.equal(askGardenVisit(bea, 'A'), null);
    deliver();
    assert.equal(bea.map.id, 'garden');
    assert.equal(bea.gardenVisit.ownerId, 'A');
    assert.equal(bea.gardenLife.mochi.length, 2);
    assert.ok(host.logs.some((l) => /Bea is visiting your Mochi Garden/.test(l)));
    // The same Mochi in the same places (from the clock).
    updateWorld(bea, 1 / 60, keys());
    const now = Date.now() / 1000;
    bea.gardenLife.mochi.forEach((e, i) => assert.ok(Math.abs(e.x - scheduledAt(host.char.garden.mochi[i], now + i * 3.7).x) < 3, `Mochi ${i}`));
    // Bea pets Ann's Mochi, and feeds it a sweet of her own: it happens to Ann's real Mochi.
    const real = host.char.garden.mochi[0];
    const [mood, bond] = [real.mood, real.bond];
    online.id = 'B';
    assert.ok(careFor(bea, bea.gardenLife.mochi[0], 'pet'));
    assert.equal(careFor(bea, bea.gardenLife.mochi[0], 'prank'), null, 'no pranks on a friend');
    addItem(char.inventory, 'msweet_daifuku', 1);
    assert.ok(feedMochi(bea, bea.gardenLife.mochi[0], 'msweet_daifuku'));
    assert.equal(countItem(char.inventory, 'msweet_daifuku'), 0);
    deliver();
    assert.ok(real.mood > mood, 'cheered up');
    assert.equal(real.bond, bond, 'its bond is with Ann');
    assert.ok(real.tummy > 0, 'fed');
    assert.ok(host.logs.some((l) => /Bea petted your/.test(l)) && host.logs.some((l) => /Bea fed your/.test(l)));
    // Her Mochi Bell takes Bea back where she was.
    addItem(char.inventory, 'mochi_bell', 1);
    assert.ok(useItem(bea, 'mochi_bell'));
    assert.equal(bea.map.id, 'sprout');
    assert.equal(bea.gardenVisit, null);
  } finally {
    Object.assign(online, was);
    host.done();
  }
});
